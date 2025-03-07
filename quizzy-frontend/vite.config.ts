import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import wasm from "vite-plugin-wasm";

const mode = process.env.NODE_ENV;
if (mode) {
  process.env = {...process.env, ...loadEnv(mode, process.cwd())};
}

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [
    react(),
    // dts({ include: ['lib'] }),
    wasm(),
    tsconfigPaths(),
  ],
  optimizeDeps: {
    exclude: ['jieba-wasm'],
  },
  build: {
    target: 'esnext',
    // minify: false,
    rollupOptions: {
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        assetFileNames: 'assets/[name][extname]'
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    }
  },
  server: {
    port: 4200,
    host: true,
  }
});
