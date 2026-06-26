import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: tag => tag.startsWith('s-')
        }
      }
    }),
  ],
  server: {
    port: 3000
  },
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.ttf','**/*.wasm'],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'index.html',
        firstLoad: 'apps/desktop/first-load/index.html',
        switchConfig: 'apps/desktop/switch-config/index.html',
      },
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.wasm')) {
            return 'assets/[name].[ext]'; // 保持文件名不变
          }
          return 'assets/[name]-[hash].[ext]';
        },
      },
    }
  }
})
