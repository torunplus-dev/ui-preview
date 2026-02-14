import React from 'react';
import ReactDOM from 'react-dom/client';
import 'antd/dist/reset.css';
import App from './App';
import { worker } from './mock/browser';

async function bootstrap() {
  if (import.meta.env.DEV) {
    await worker.start({
      serviceWorker: {
        url: '/mockServiceWorker.js'
      }
    });
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

void bootstrap();
