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

## Learning Guide (Bottom-Up)

React/Next.js 初学者向けに、下から積み上げる読み順を用意しています。

### 1. 型と仕様を理解する

1. `packages/ui-spec/src/index.ts`
2. `apps/ui-preview/public/spec/user-list.screen.json`
3. `apps/ui-preview/public/spec/user-list.screen.yaml`
4. `apps/ui-preview/src/types/index.ts`

チェックポイント:
- `zod` の schema から TypeScript 型を作っている理由を説明できる
- 画面仕様(Spec)が「コードではなくデータ」である意味を説明できる

### 2. Specを読み込む流れを理解する

1. `packages/ui-renderer/src/index.ts`
2. `apps/ui-preview/src/App.tsx` (`openScreen` 周辺)

チェックポイント:
- JSON/YAML の分岐読み込みを追える
- 読み込んだ spec が `UserListScreen` に props で渡る流れを追える

### 3. Reactの状態管理を理解する

1. `apps/ui-preview/src/contexts/AppContext.tsx`
2. `apps/ui-preview/src/panels/AuthPanel.tsx`
3. `apps/ui-preview/src/panels/ScenarioPanel.tsx`
4. `apps/ui-preview/src/panels/LogPanel.tsx`

チェックポイント:
- `useState` と `Context` の役割分担を説明できる
- Provider の外で hook を使うとエラーになる理由を説明できる

### 4. UIの主要画面を理解する

1. `apps/ui-preview/src/screens/UserListScreen.tsx`
2. `apps/ui-preview/src/components/NavTree.tsx`
3. `packages/ui-components/src/index.tsx`

チェックポイント:
- `useEffect` がデータ取得のトリガーになる仕組みを説明できる
- `useMemo` を使う意図(再計算抑制)を説明できる
- props とイベントハンドラで親子連携していることを説明できる

### 5. APIとモック層を理解する

1. `apps/ui-preview/src/services/apiClient.ts`
2. `apps/ui-preview/src/mock/scenarioBridge.ts`
3. `apps/ui-preview/src/mock/handlers.ts`
4. `apps/ui-preview/src/mock/browser.ts`
5. `apps/ui-preview/src/main.tsx`

チェックポイント:
- なぜ MSW を使うとフロント開発が安定するか説明できる
- timeout/delay/error を UI から切り替えられる設計を説明できる

## Mapping To Next.js (App Router)

このプロジェクトを Next.js に移すときの対応イメージ:

- `apps/ui-preview/src/main.tsx`:
  Next.js では不要。`app/layout.tsx` + `app/page.tsx` へ分割する。
- `apps/ui-preview/src/App.tsx`:
  状態とイベントがあるので基本 `use client` コンポーネントにする。
- `apps/ui-preview/src/screens/UserListScreen.tsx`:
  インタラクション部分は `use client`。初期データ取得は Server Component へ分離可能。
- `apps/ui-preview/src/services/apiClient.ts`:
  Route Handler (`app/api/.../route.ts`) と接続して利用可能。
- `apps/ui-preview/src/mock/*`:
  開発専用としてクライアント起動時に有効化。必要ならテスト時のみ有効化でもよい。

## Practice Tasks

1. `UserListScreen` の検索対象を `name` だけでなく `email` にも広げる
2. `ScenarioPanel` に `PATCH /api/users/:id` を追加する
3. `ui-spec` に列の `width` を追加し、テーブル描画に反映する
4. Next.js App Router で最小移植を行う (`app/page.tsx` + `use client` 分離)
