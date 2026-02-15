import React from 'react';
import ReactDOM from 'react-dom/client';
import 'antd/dist/reset.css';
import App from './App';
import { worker } from './mock/browser';

// アプリ起動時の初期化処理をまとめる関数。
// Next.js ならこのエントリーファイルを直接書く機会は少なく、
// `app/layout.tsx` や `app/page.tsx` 側で初期化を設計することが多い。
// その場合、ブラウザ専用処理(MSW起動など)は `use client` コンポーネントへ寄せる。
async function bootstrap() {
  // 開発環境のみ MSW を有効化し、実APIの代わりにブラウザ内でモックを返す。
  if (import.meta.env.DEV) {
    await worker.start({
      serviceWorker: {
        url: '/mockServiceWorker.js'
      }
    });
  }

  // React 18 の root API で描画を開始。
  // StrictMode は副作用の問題を早期検知するための開発支援。
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// 非同期起動関数を呼び出す。戻り値(Promise)は意図的に待たない。
void bootstrap();
