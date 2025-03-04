import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import dts from 'vite-plugin-dts';
import wasm from "vite-plugin-wasm";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // dts({ include: ['lib'] }),
    wasm(),
    tsconfigPaths(),
  ],
  optimizeDeps: {
    exclude: ['jieba-wasm'], // 替换为实际使用的 wasm 库名
  },
  build: {
    target: 'esnext',
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
