# Slyz gift flow — agent spec (Supabase is required)

Supabase is already connected in Antigravity. Use it. Do not propose `localStorage` as the store, and do not add a second database. Do not redesign custody. Do not add Ondo, Privy, cNFT, Blinks, or usernames in this change.

## What broke

Mainnet signature `2UFV4cb7fMmkuvuSaXqvMQu5pxmgwGaM5RZSxd4D44vsEfn5xHwUyRGegFFa2hpetqNQrRX5YSLwsreu4sjd8NRJ` succeeded. `err` is null.

Sender `GpgSeA5MxAWz1J6vjwo5LNUATuaZCMwcU36bXrSqeLmU` moved 0.01042583 NVDAx (`Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh`) and 0.0035 SOL into ephemeral vault `HtpY6eVyt5Mpr3Qy1MBbz7Qm9L31CsnqqHEtBbH6xpGS`, token account `EG4tUqKiz2MisaFBPrvn8U6iCFSVofxArHfUjG9afnsi`.

The UI then threw `TransactionExpiredBlockheightExceededError` and never saved the claim payload. Sent Gifts reads `localStorage`, so it shows nothing. The 15-minute timer was only in that payload. It was never enforced on-chain. This gift cannot be reclaimed unless that browser session still has the secret. Do not claim you can recover it.

`TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb` is the Token-2022 program. It is not the vault.

## Rule

A landed signature with `err: null` is success. A confirmation timeout is not a failure. The vault secret must be in Supabase before the user is asked to sign.

## Supabase

One table, `gifts`. Apply this in the SQL editor.

```sql
create table public.gifts (
  id text primary key,
  sender text not null,
  vault text not null,
  secret_encrypted text not null,
  symbol text not null,
  mint text not null,
  raw_amount text not null,
  estimated_usd numeric,
  unlock_at timestamptz,
  expires_at timestamptz,
  signature text,
  status text not null,
  created_at timestamptz not null default now()
);

alter table public.gifts enable row level security;
```

Status values: `awaiting_signature`, `submitted`, `funded`, `claimed`, `reclaimed`, `failed`, `unknown`.

The browser may hold `NEXT_PUBLIC_SUPABASE_URL` and the anon key. The service-role key stays in a server env var. Never import it in a client component.

All gift writes go through Route Handlers under `src/app/api/gifts/`. Those routes use the service role. Encrypt `secretKeyBase58` with `GIFT_SECRET_KEY` before insert. Decrypt only when the sender asks for their claim link, or when reclaim builds the vault signer. Never log the plaintext. Never put it in a query string, OG tag, or analytics.

RLS: no anon select on `secret_encrypted`. Sender reads go through the server route, which checks the connected wallet matches `sender`. A claimed gift may expose symbol, amount, note, and expiry on the claim page. It must not expose the secret in the API response after status is `claimed` or `reclaimed`.

`localStorage` may cache the sent-gift list. It is not the source of truth. Sent Gifts loads from Supabase.

## Order of operations

1. Generate the vault keypair and the claim payload in the modal.
2. `POST /api/gifts` inserts the row, status `awaiting_signature`. If this insert fails, do not open the wallet.
3. Build the existing fund transaction: 0.0035 SOL to the vault, idempotent Token-2022 ATA, `TransferChecked` of the raw amount.
4. User signs. As soon as the signature string returns, `PATCH` the row to `submitted` and store the signature. Do this before confirmation.
5. Confirm with the buy-flow helper. Do not call raw `confirmTransaction` and treat a throw as failure.
6. On `TransactionExpiredBlockheightExceededError` or any timeout, `getSignatureStatus(signature, { searchTransactionHistory: true })`.
   - `value` present and `err` null: status `funded`, show the claim link.
   - `err` set: status `failed`, show the chain error. Keep the row.
   - signature still unknown after polling: status `unknown`. Keep the secret. Sent Gifts tells the user to refresh.
7. Success UI is the claim URL, a copy button, and the expiry. Closing the modal must not delete the row.

Claim and reclaim use the same confirmation rule, then set `claimed` or `reclaimed`.

## Custody stays as it is

Ephemeral vault, Token-2022 checked transfer, 0.0035 SOL funding, claim URL with the secret in the hash fragment. The recipient does not need an account. Do not replace this with a PDA program. Do not add a relayer.

Expiry is read from `expires_at` and enforced in the claim route. It does not return tokens by itself. Reclaim is a transaction signed by the vault key loaded from Supabase.

## Copy

This sprint gifts public xStocks only. Remove “private pre-IPO shares” from the gift modal. Input is a dollar amount. Share count is the quote result, not the field the sender types.

## Done when

1. `npx tsc --noEmit` exits 0.
2. The Supabase row exists before the wallet prompt.
3. Killing the tab after submit still shows the gift under Sent Gifts, with a working claim link from Supabase.
4. A forced `TransactionExpiredBlockheightExceededError` on a landed signature still ends as `funded` and a visible link.
5. A new mainnet NVDAx gift at $5 or less is funded and claimed. Both signatures are in the PR.
6. The service-role key is not in client code. The plaintext secret is not in `console.log` or a query param.

The stranded 0.01042583 NVDAx is out of scope. Its key was never written.
