# HANDOFF — Slyz Wallet Integration & Build Fixes

**Date:** 18 September 2026
**Author:** reviewer agent (Hermes), on request of project owner
**Repo:** https://github.com/Cryptojigi/slyz
**Local path:** `C:\Users\IK\.gemini\antigravity-ide\scratch\slyz`
**Status:** Complete and verified. **Nothing committed yet** — all changes sit in the working tree. Latest commit is still `41e6f0b`.

---

## 1. Scope

Added mobile wallet connectivity to Slyz (WalletConnect + a zero-config deep-link fallback), and fixed two build-level defects that surfaced while installing the dependency.

---

## 2. Files changed

| File | Change |
| --- | --- |
| `src/components/WalletContextProvider.tsx` | Modified — adds the WalletConnect adapter |
| `src/components/MobileWalletLink.tsx` | **NEW** — mobile deep-link fallback banner |
| `src/components/Navbar.tsx` | Modified — renders `<MobileWalletLink />` |
| `package.json` | +1 dependency, +`overrides` block |
| `package-lock.json` | Regenerated |
| `.env.example` | +`NEXT_PUBLIC_WC_PROJECT_ID` |

Diff stat:

```
 .env.example                             |    8 +
 package-lock.json                        | 7188 ++++++++++++++++++++++--------
 package.json                             |    5 +
 src/components/Navbar.tsx                |    6 +
 src/components/WalletContextProvider.tsx |   45 +-
```

---

## 3. The problem being solved

Previously `WalletContextProvider.tsx` had:

```ts
const wallets = useMemo(() => [], []);
```

An empty array means **Wallet Standard autodetect only**. That works for browser-extension wallets (Phantom, Solflare, Backpack on desktop) and for a page opened *inside* a wallet's in-app browser — but **not** for a normal mobile browser (Safari / Chrome). On a phone, no wallet registers, the modal is empty, and the user cannot connect at all.

---

## 4. `WalletContextProvider.tsx`

The adapter list is now built conditionally:

```ts
const adapters: WalletAdapter[] = [];

if (WC_PROJECT_ID && WC_PROJECT_ID.trim().length > 0) {
  adapters.push(
    new WalletConnectWalletAdapter({
      network: WalletAdapterNetwork.Mainnet,
      options: {
        projectId: WC_PROJECT_ID,
        metadata: {
          name: "Slyz",
          description: "Thematic stock basket investing on Solana",
          url: APP_URL,
          icons: [`${APP_URL.replace(/\/$/, "")}/slyzlogo.png`],
        },
      },
    })
  );
}

return adapters;
```

**Key points:**

- WalletConnect is enabled **only when `NEXT_PUBLIC_WC_PROJECT_ID` is present**. A missing/placeholder ID can never break the build or the connect flow.
- **Passing an explicit array does NOT disable extension detection.** `WalletProvider` internally calls `useStandardWalletAdapters(adapters)` — see `node_modules/@solana/wallet-adapter-react/lib/esm/WalletProvider.js:28` — which merges Wallet Standard wallets in. Desktop helpers keep working exactly as before.
- Imports verified against the published package: `WalletConnectWalletAdapter` is re-exported by `@solana/wallet-adapter-walletconnect` from `@walletconnect/solana-adapter`; its config type is `{ network } & Pick<…, 'options'>` where `options` is WalletConnect's `SignClientTypes.Options` (accepts `projectId` + `metadata`).

---

## 5. `MobileWalletLink.tsx` (new component)

A fixed bottom banner offering **"Open in Phantom" / "Open in Solflare"** universal links:

```
https://phantom.app/ul/browse/<encoded-url>?ref=<origin>
https://solflare.com/ul/v1/browse/<encoded-url>?ref=<origin>
```

Render conditions — it returns `null` unless **all** are true:

- user agent looks mobile (`Android|iPhone|iPad|iPod`)
- `wallets.length === 0` (no wallet detected in this browser)
- `!connected`
- not dismissed by the user

It is also `md:hidden`, so it never appears on desktop. **This requires zero configuration** — it makes mobile usable even before WalletConnect is enabled.

It is mounted once, inside `Navbar`, immediately before `</header>`. Because it is `position: fixed`, it does not affect header layout.

---

## 6. CRITICAL — do not undo these two things

### (a) The `overrides` block in `package.json`

```json
"overrides": {
  "@types/react": "$@types/react",
  "@types/react-dom": "$@types/react-dom"
}
```

**Why it exists:**

Installing the WalletConnect package caused npm to create **nested `@types/react@19.3.0` copies** at:

- `node_modules/@solana/wallet-adapter-react/node_modules/@types/react`
- `node_modules/@solana-mobile/wallet-standard-mobile/node_modules/@types/react`

while the project root was `@types/react@18.3.31`. Those nested copies shadowed the React 18 types and broke TypeScript compilation:

```
src/components/WalletContextProvider.tsx(61,6): error TS2786:
'ConnectionProvider' cannot be used as a JSX component.
  Type 'ReactNode | Promise<ReactNode>' is not assignable to type 'ReactNode'.
```

**This would also have failed the Vercel build** — the same type-check runs there.

The `overrides` block forces npm to resolve a single, deduped `@types/react` (and `-dom`) across the whole tree. The `"$@types/react"` syntax means "use the version already declared in `devDependencies`" — note that a plain `"^18.3.0"` literal here triggers npm's `EOVERRIDE` error (*"Override … conflicts with direct dependency"*), so the `$` reference form is required.

After this change, `package-lock.json` contains only the root `@types/react` / `@types/react-dom` entries — no nested duplicates.

**Do not remove the `overrides` block.** The build will break again.

### (b) Do not rewrite `WalletContextProvider.tsx` or `Navbar.tsx` wholesale

Both now contain wiring that must survive any refactor:

- the conditional WalletConnect adapter construction
- the `<MobileWalletLink />` mount point

---

## 7. The `.next` corruption incident

The app was returning **HTTP 500 / "Internal Server Error"** on every route. The cause was **not application code**. The server log showed:

```
⨯ Error: Cannot find module './8948.js'
Require stack:
- .next/server/webpack-runtime.js
- .next/server/pages/_document.js
  code: 'MODULE_NOT_FOUND'
```

`.next` held **mixed dev + production artifacts**:

```
.next/cache/webpack/
  client-development
  client-production
  edge-server-production
  server-development
  server-production
```

and `.next/server/` was missing its numbered chunk files. The production `webpack-runtime.js` referenced chunks the dev server had already replaced.

Timestamps confirmed the sequence: the production build finished at **13:59**, then `.next/server` was rewritten at **14:25** by the concurrently running dev server.

### Rule going forward

1. **Never run `next build` while `next dev` is running** — they share one `.next` directory and overwrite each other's output.
2. **Restart the dev server after any `npm install`** — it holds a stale module graph and will keep erroring otherwise.
3. If it happens again: `rm -rf .next`, then restart dev.

This **cannot happen on Vercel** — it clones fresh and builds in isolation. It is a local workflow issue only.

---

## 8. Verification performed

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | **EXIT 0** (clean) |
| `next build` after `rm -rf .next` | **EXIT 0** — 7 routes generated |
| `next start` + live requests | `/` → **200**, `/portfolio` → **200**, `/dashboard` → **200** |

Route table from the verified build:

```
Route (app)                    Size     First Load JS
┌ ○ /                          7.82 kB  111 kB
├ ○ /_not-found                 880 B   89.7 kB
├ ○ /dashboard                 18.7 kB  320 kB
├ ○ /icon.png                   0 B      0 B
├ ƒ /invest/[basketId]         3.52 kB  299 kB
└ ○ /portfolio                 7.54 kB  309 kB

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

---

## 9. Known benign warning

The build now emits:

```
Module not found: Can't resolve 'pino-pretty'
  ./node_modules/pino/lib/tools.js
  ← ./node_modules/@walletconnect/logger/dist/index.es.js
  ← ./node_modules/@walletconnect/universal-provider/dist/index.es.js
  ← ./node_modules/@walletconnect/solana-adapter/dist/core.js
  ← ./node_modules/@walletconnect/solana-adapter/dist/adapter.js
  ← ./node_modules/@solana/wallet-adapter-walletconnect/lib/esm/index.js
  ← ./src/components/WalletContextProvider.tsx
```

This is a **warning, not an error**. `pino-pretty` is an optional, development-only logger for `pino`. The build succeeds and the app runs. It is safe to ignore and will also appear in Vercel logs.

---

## 10. Environment variables

Added to `.env.example`:

```env
# Public app URL — used for WalletConnect metadata + social share cards (metadataBase).
NEXT_PUBLIC_APP_URL=https://your-deployed-domain

# WalletConnect / Reown Cloud project id — https://cloud.reown.com
# REQUIRED for MOBILE wallet connections (QR / deep link from a phone browser).
# The deployed domain MUST be on this project's allowlist, or the relay rejects
# the connection with "origin not allowed".
NEXT_PUBLIC_WC_PROJECT_ID=
```

`.env.local` (gitignored — holds the real Alchemy key) now also contains:

```env
NEXT_PUBLIC_WC_PROJECT_ID=28814c1abe6991a25160016ecbba2159
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**`.env.local` must never be committed.**

---

## 11. Outstanding items (owner: project owner, not the coding agent)

1. **Reown dashboard** — `cloud.reown.com` → project `28814c1a…` → **Allowed Origins** → add `http://localhost:3000` **and** the future Vercel domain. Skipping this reproduces the known `relay 3000 — origin not allowed` failure (blank QR / failed mobile connect).
2. **Deploy to Vercel.**
3. **Vercel environment variables** — set `NEXT_PUBLIC_ALCHEMY_RPC_URL`, `NEXT_PUBLIC_APP_URL` (the Vercel HTTPS URL), `NEXT_PUBLIC_WC_PROJECT_ID`.
4. **Update `NEXT_PUBLIC_APP_URL`** from the `http://localhost:3000` placeholder to the deployed HTTPS URL.

### Why the deployment matters for wallet testing

WalletConnect works on any origin, but **mobile wallets will not deep-link to `http://localhost`** — the phone cannot reach the developer machine, and wallet apps reject non-HTTPS origins. Desktop QR testing may work locally once `localhost` is allowlisted; **mobile can only be verified after an HTTPS deployment.**

---

*End of handoff.*
