# Seltra Stellar visual PoC

A standalone visual proof of concept for a Stellar version of Seltra.

## What is real

- Wallet discovery and address connection through Stellar Wallets Kit.
- The wallet kit is initialized for Stellar testnet.
- Disconnecting clears the selected wallet session through the kit.
- XLM/USD reference price, 24-hour change and update timestamp from CoinGecko's keyless public API.

## What is intentionally mocked

- Balances and portfolio values
- Non-XLM market references, charts and venue comparisons
- Order-book depth and recent fills
- Local limit and grid order placement
- Order status and cancellation
- Local take-profit and stop-loss attachments
- Immediate highlighted order-book placement for active browser-session orders

The project does not construct XDR, request transaction signatures, submit transactions, call a trading API, or query a Stellar RPC/Horizon endpoint. The order preview is browser-only React state and disappears after a page reload.

## Run locally

Requirements: Node.js 20 or newer.

```bash
npm install
npm start
```

Open `http://127.0.0.1:4173`.

## Verify

```bash
npm run typecheck
npm run build
```

## Wallet integration boundary

Wallet interaction is isolated in `src/wallet.ts`. It imports only the initialization, authentication, address-state and disconnect interfaces used by this demo. There are no calls to `signTransaction`, `signAndSubmitTransaction`, or any Stellar network client.

This repository is a product/design prototype, not a production trading interface.

## DigitalOcean deployment

The site is deployed as static Vite output behind Caddy; it does not require a Node.js service on the Droplet.

From a trusted workstation with SSH access to the Droplet:

```bash
DEPLOY_HOST=root@your-droplet-ip ./scripts/deploy-digitalocean.sh
```

The script verifies and builds the app, synchronizes `dist/` to `/var/www/xlm.seltra.finance`, installs the versioned Caddy site block, validates the full Caddy configuration, and reloads Caddy.

DNS must contain an `A` record named `xlm` pointing to the Droplet. When Cloudflare manages the Seltra zone, use the proxied setting and keep SSL/TLS mode on **Full (strict)**.

## Dependency note

Stellar Wallets Kit 2.5.0 currently installs a broad set of optional wallet and hardware-wallet dependencies. `npm audit` reports advisories inside that transitive tree. The production Vite bundle was checked and does not include the flagged Trezor, protobuf, Coinbase, Hot Wallet or Solana packages, but this PoC must still be re-audited and dependency-pinned before any production use.
