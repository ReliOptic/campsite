import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    target: 'esnext',
    minify: 'esbuild',
    cssCodeSplit: true,
  },
  server: {
    port: 3000,
    open: true,
  },
});
