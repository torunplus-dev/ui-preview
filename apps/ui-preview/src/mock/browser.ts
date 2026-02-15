import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// ブラウザでService Workerを起動し、定義したhandlersで通信をモックする。
export const worker = setupWorker(...handlers);
