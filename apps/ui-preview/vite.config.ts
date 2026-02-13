import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@ui-preview/ui-spec': path.resolve(__dirname, '../../packages/ui-spec/src'),
      '@ui-preview/ui-components': path.resolve(__dirname, '../../packages/ui-components/src'),
      '@ui-preview/ui-renderer': path.resolve(__dirname, '../../packages/ui-renderer/src')
    }
  }
});
