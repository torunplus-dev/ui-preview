# UI Preview Workspace

Spec-driven preview UI using Vite + React + TypeScript + MSW.

## Run

```bash
pnpm install
pnpm --filter ui-preview msw:init
pnpm dev
```

## Build

```bash
pnpm build
```

## Structure

- `apps/ui-preview`: runnable app
- `apps/ui-preview/public/spec`: JSON/YAML screen specs
- `apps/ui-preview/src/mock`: MSW handlers + scenario bridge
- `packages/ui-spec`: schema + validation
- `packages/ui-renderer`: spec loading and validation
- `packages/ui-components`: shared UI primitives


## Included sample specs

- `user-list.screen.json`: user CRUD sample
- `audit-log.screen.yaml`: YAML-driven audit tab sample
