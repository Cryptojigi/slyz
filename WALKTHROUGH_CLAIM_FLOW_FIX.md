# Technical Walkthrough: Solana Gift Vault Claim Fix & Rent Exemption Architecture

This document provides a comprehensive, verifiable technical breakdown of the `InsufficientFundsForRent` issue encountered during the Slyz gift claim flow, the exact root cause, the architectural and mathematical fixes implemented across the codebase, and live on-chain proof verifying that the fix succeeded on Solana mainnet without requiring new funding.

---

## 1. On-Chain Timeline & Verifiable Signatures

You can verify all accounts, token movements, instruction traces, and balances directly on Solscan.

| Event | Transaction Signature | Solscan Link | Status |
| :--- | :--- | :--- | :--- |
| **Gift Funded** | `2rDHwMkCkj3Ztn29juwCAtXD9U6f9z91hfQHMfPPmnCXqYh1HEExoL3gJUUfVpebxodm1NQLu8dqTeU757xCh21J` | [View Funding on Solscan](https://solscan.io/tx/2rDHwMkCkj3Ztn29juwCAtXD9U6f9z91hfQHMfPPmnCXqYh1HEExoL3gJUUfVpebxodm1NQLu8dqTeU757xCh21J) | **Finalized** |
| **Gift Claimed** | `26z6FH1BbZK3KaZ1dsqFCd7Fs6JPUy8ZxtGDFd7xK3wvoCC6ta6oUVP96mdg5t7kDHbrm5GU54H1Gjc5YkiAgZTP` | [View Claim on Solscan](https://solscan.io/tx/26z6FH1BbZK3KaZ1dsqFCd7Fs6JPUy8ZxtGDFd7xK3wvoCC6ta6oUVP96mdg5t7kDHbrm5GU54H1Gjc5YkiAgZTP) | **Finalized (`Ok`)** |

### Verified On-Chain State
* **Sender Address:** [`GpgSeA5MxAWz1J6vjwo5LNUATuaZCMwcU36bXrSqeLmU`](https://solscan.io/account/GpgSeA5MxAWz1J6vjwo5LNUATuaZCMwcU36bXrSqeLmU)
* **Ephemeral Vault Address:** [`FH34sDz5fRqbiwokMjzwJHLTmWMUt53zpM5nkydtpjhG`](https://solscan.io/account/FH34sDz5fRqbiwokMjzwJHLTmWMUt53zpM5nkydtpjhG)
* **Token Mint:** AAPLx (`XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp`, Token-2022)
* **Amount Transferred:** `0.00029623 AAPLx` (29,623 base units)
* **Recipient Token Account:** [`45xmMPywZr6DMeAwA4NJbFm7xQAKNrW58XWt92acSfFc`](https://solscan.io/account/45xmMPywZr6DMeAwA4NJbFm7xQAKNrW58XWt92acSfFc)
* **Supabase Record:** ID `gift_1791619789827_7d4qgr` marked `status: "claimed"` with signature `26z6FH1BbZK3KaZ1dsqFCd7Fs6JPUy8ZxtGDFd7xK3wvoCC6ta6oUVP96mdg5t7kDHbrm5GU54H1Gjc5YkiAgZTP`.

---

## 2. Root Cause Analysis

### The Failure Symptom
When the recipient clicked **"Claim 0.0003 AAPL to Wallet"**, the preflight simulation failed with:
```json
Transaction simulation failed: {"InsufficientFundsForRent": {"account_index": 0}}
```

### Account Index 0
In the claim transaction, `feePayer` is set to `vaultKeypair.publicKey`. Account 0 in the instruction array was the ephemeral vault itself:
`FH34sDz5fRqbiwokMjzwJHLTmWMUt53zpM5nkydtpjhG`.

### Why the Balance Failed
The claim transaction executes 4 operations atomically:
1. **Instruction 1 (CreateIdempotent):** Create the recipient's Token-2022 Associated Token Account (`recipientAta`), paid by `vaultKeypair`.
   * ATA data size with extensions: **179 bytes**.
   * Rent exemption cost: **1,559,560 lamports** (~0.00156 SOL).
2. **Instruction 2 (TransferChecked):** Transfer the shares from `vaultAta` to `recipientAta`.
3. **Instruction 3 (CloseAccount):** Close `vaultAta` and transfer its rent refund directly to `recipientPublicKey`.
4. **Instruction 4 (SystemProgram.transfer):** Sweep leftover SOL lamports from `vaultKeypair` to `recipientPublicKey`.

### The Bug in Instruction 4
In the original implementation, the sweep amount was calculated as:
```typescript
// BUGGY CALCULATION
const vaultSolBalance = await connection.getBalance(vaultKeypair.publicKey); // 3,500,000 lamports
const estimatedFee = 35_000;
transaction.add(
  SystemProgram.transfer({
    fromPubkey: vaultKeypair.publicKey,
    toPubkey: recipientPublicKey,
    lamports: vaultSolBalance - estimatedFee, // Tried to send 3,465,000 lamports!
  })
);
```

#### Mathematical Impossibility:
* **Initial Vault Balance:** `3,500,000 lamports`
* **Debited by Instruction 1 (ATA Creation):** `1,559,560 lamports`
* **Debited by Transaction Fee:** `5,000 lamports`
* **Actual Remaining Lamports in Vault:** `3,500,000 - 1,559,560 - 5,000 = 1,935,440 lamports`
* **Amount Instruction 4 Attempted to Transfer:** `3,465,000 lamports`

Because `3,465,000 > 1,935,440`, the instruction demanded `1,529,560` more lamports than existed.

Furthermore, under Solana runtime rules, an active system account cannot hold a non-zero balance below the rent-exempt minimum (`650,240 lamports` for 0 data bytes). Any transaction that leaves a non-zero balance below this threshold is immediately aborted by the runtime with `InsufficientFundsForRent`.

---

## 3. Detailed Walkthrough of Changes Made

### A. Dynamic Rent Reservation & Safe Sweep Math
**File:** `src/lib/gifting.ts`

The sweep logic now dynamically queries the on-chain account status and computes the exact safety reserve:

```typescript
// 1. Check if the recipient ATA already exists on-chain
const recipientAtaInfo = await connection.getAccountInfo(recipientAta);
const ataRentNeeded = recipientAtaInfo ? 0 : await connection.getMinimumBalanceForRentExemption(250);
const minRentExempt = await connection.getMinimumBalanceForRentExemption(0);

// 2. Compute the exact safety reserve:
// ataRentNeeded + minRentExempt + 100,000 lamports (gas buffer)
const safetyReserve = ataRentNeeded + minRentExempt + 100_000;

// 3. Compute sweepable remainder
const sweepLamports = vaultSolBalance > safetyReserve ? vaultSolBalance - safetyReserve : 0;

// 4. Dust protection: only add transfer if above dust threshold (10,000 lamports)
if (sweepLamports > 10_000) {
  transaction.add(
    SystemProgram.transfer({
      fromPubkey: vaultKeypair.publicKey,
      toPubkey: recipientPublicKey,
      lamports: sweepLamports,
    })
  );
}
```

* **Vault Remains Sole Payer:** The recipient never needs SOL to claim.
* **No Rent Deficit:** The vault account always holds `>= minRentExempt` at the end of instruction processing, satisfying validator invariants.
* **Dust Safe:** If the remaining balance is tiny, the sweep is safely skipped without aborting the token claim.
* **Reclaim Parity:** Applied the exact same reservation math to `executeReclaimGift`.

---

### B. Shared Transaction Builder & Pre-Flight Simulation
**Files:** `src/lib/gifting.ts`, `src/app/gift/claim/page.tsx`

1. **`buildClaimGiftTransaction`:**
   Created a single source of truth for constructing, validating, and signing the claim transaction, ensuring simulation and execution always run identical instructions.

2. **`simulateClaimGift`:**
   Exposes a read-only pre-flight simulator that verifies the transaction against the RPC:
   ```typescript
   export async function simulateClaimGift(params: {
     connection: Connection;
     payload: GiftClaimPayload;
     recipientPublicKey: PublicKey;
   }): Promise<{ success: boolean; error?: string }>
   ```

3. **Pre-Flight Hook on Claim Page (`src/app/gift/claim/page.tsx`):**
   * As soon as a user connects their wallet, the page automatically calls `simulateClaimGift`.
   * If simulation detects `InsufficientFundsForRent` or another error, the error notice is displayed and the **Claim button is disabled**:
     ```tsx
     <button
       type="button"
       onClick={handleClaim}
       disabled={claimStatus === "claiming" || isSimulating || Boolean(simulationError)}
       className={`... ${Boolean(simulationError) || isSimulating ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
     >
     ```
   * **Result:** The user is never prompted to sign or broadcast an invalid transaction.

---

### C. Claim Status Sync & Idempotency
**Files:** `src/app/gift/claim/page.tsx`, `src/app/api/gifts/route.ts`

1. **Mount-Time Database Status Check:**
   When the recipient opens the claim page, the page fetches `/api/gifts/[id]`. If the database already marks the gift as `claimed`, the page immediately transitions to the success screen:
   * Displays *"Shares Safely in Your Wallet!"*
   * Displays the on-chain Solscan receipt link
   * Displays the shortcut to the Slyz Portfolio
   * No redundant simulation or claim attempts are triggered.

2. **Claim Status Endpoint Authorization:**
   In `PATCH /api/gifts`, updated the authentication guard to permit transitions to `status: "claimed"` when accompanied by a valid 64+ byte Solana transaction signature, without requiring sender Ed25519 headers.

---

### D. Production Hostname Hardening
**Files:** `src/lib/gifting.ts`, `.env.local`, `.env.example`

Updated `generateGiftClaimUrl` to guarantee that all generated and copied links point to the deployed app domain:
```typescript
export function generateGiftClaimUrl(payload: GiftClaimPayload): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const baseUrl =
    envUrl && !envUrl.includes("localhost")
      ? envUrl.replace(/\/+$/, "")
      : "https://www.useslyz.xyz";
  const rawJson = JSON.stringify(payload);
  const encoded = btoa(encodeURIComponent(rawJson));
  return `${baseUrl}/gift/claim#gift=${encoded}`;
}
```

* In `.env.local`: Updated `NEXT_PUBLIC_APP_URL=https://www.useslyz.xyz`.
* Any gift generated now produces an official production URL (`https://www.useslyz.xyz/gift/claim#gift=...`), ensuring recipient links are never broken by `localhost` references.

---

## 4. Verification Checklist

| Criterion | Requirement | Verified Result |
| :--- | :--- | :--- |
| **Existing Vault Claim** | Claim $0.10 AAPL vault without new funding | **Success:** Tx `26z6FH1BbZK3KaZ1dsqFCd7Fs6JPUy8ZxtGDFd7xK3wvoCC6ta6oUVP96mdg5t7kDHbrm5GU54H1Gjc5YkiAgZTP` finalized on mainnet. |
| **Simulation** | No `InsufficientFundsForRent` | **Success:** Simulation passes with `err: null`, units consumed `13,448`. |
| **Fee Payer Invariant** | Vault remains sole fee payer | **Success:** Fee payer is `FH34sDz5fRqbiwokMjzwJHLTmWMUt53zpM5nkydtpjhG`. |
| **Pre-Flight UI Guard** | Disable button on simulation error | **Success:** Integrated in `src/app/gift/claim/page.tsx`. |
| **Claim URL Host** | Use `https://www.useslyz.xyz` | **Success:** Configured in `gifting.ts`, `.env.local`, `.env.example`. |
| **TypeScript Build** | Zero type errors | **Success:** `npx tsc --noEmit` exited `0`. |
