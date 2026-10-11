# Svaraa Lite V1

Web PWA + React Native Gateway + multi-tenant Node/Postgres (PGlite in local mock mode), with auto-identification for **SL1-A (Accessory)** and **SL1-F (Fold-over)** during onboarding.

## Stack

| Surface | Tech |
|--------|------|
| Web | React + Vite PWA (`apps/web`) |
| Gateway | Expo React Native (`apps/gateway`) |
| Control plane | Fastify + PGlite (`apps/control-plane`) |
| Household tenant | Fastify + in-memory tenant store + mock pendant feed (`apps/tenant`) |
| Shared | `@svaraa/shared`, `@svaraa/protocol`, `@svaraa/ui`, `@svaraa/mock-pendant` |

## Quick start

```bash
# Node 22+ and pnpm 9
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"
pnpm install

# Terminal A — control plane
pnpm --filter @svaraa/control-plane dev

# Terminal B — tenant API
pnpm --filter @svaraa/tenant dev

# Terminal C — web
pnpm --filter @svaraa/web dev
```

Open http://localhost:5173 → **Set up household**. OTP codes are returned in the API response for local mock auth.

Optional Docker services (Postgres/Redis/MinIO):

```bash
pnpm db:up
```

Gateway (device or simulator):

```bash
pnpm --filter @svaraa/gateway start
```

## Demo

```bash
pnpm demo
```

Starts control-plane, tenant, and web; seeds a demo household. Open http://localhost:5173/demo?demo=1 or click **Investor demo**. Use the **Guide** button (bottom-right) for tours, hardware explainers, and FAQ.

## Temporary GitHub Pages deploy (private repo)

Repo: [`VishwajeetJK/Svaraa-V1`](https://github.com/VishwajeetJK/Svaraa-V1) (private).

GitHub **cannot** host the Node control-plane/tenant APIs. Actions builds the PWA with an **in-browser mock** (`VITE_STATIC_DEMO=true`) and deploys to **GitHub Pages**. Private Pages need a plan that includes Pages for private repos (e.g. Pro); otherwise use **Actions → Deploy GitHub Pages** artifacts / local `preview:pages`.

1. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Push to `main` (or run workflow **Deploy GitHub Pages** manually).
3. Open the Pages URL from the deploy environment — use **Investor demo** / **Full feature walkthrough**.

Local preview of the Pages build:

```bash
pnpm pages:build
pnpm --filter @svaraa/web preview:pages
```

Workflow: [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml). CI tests still use real local servers.

## Tests

```bash
pnpm test
pnpm --filter @svaraa/web test:e2e   # servers must be running
pnpm gates                          # live stack smoke
```

## Walkthrough Bot

Bottom-right **Guide** on landing, onboarding, and the app shell. Modes: family, investor, FAQ. Five product tours with spotlight, SL1-A / SL1-F hardware cards, and a curated knowledge base in `@svaraa/walkthrough-kb`.

## Hardware auto-ID

1. Scan filters `SVARAA_LITE_SERVICE_UUID` (provisional contract in `packages/protocol`).
2. Read model `SL1-A` / `SL1-F`.
3. Capability probe (wear-mode vs fold/privacy/USB).
4. Persist on the pendant record; branch onboarding coaching (charge, OTA, buttons, mic privacy).

Mock profiles: `sim-sl1a-chest`, `sim-sl1a-wrist`, `sim-sl1f-clipped`, `sim-sl1f-open-privacy-off`.

## Docs

Product source PDFs live in [`Documents/`](Documents/).
