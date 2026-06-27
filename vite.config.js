import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@xxmm/core': path.resolve(__dirname, 'packages/core/src'),
      '@xxmm/helper': path.resolve(__dirname, 'packages/helper/src'),
      '@xxmm/events': path.resolve(__dirname, 'packages/events/src'),
      '@xxmm/store': path.resolve(__dirname, 'packages/store/src'),
      '@xxmm/styles': path.resolve(__dirname, 'packages/styles/src'),
      '@xxmm-apps/electron': path.resolve(__dirname, 'apps/electron/src'),
      '@xxmm-apps/vault': path.resolve(__dirname, 'apps/desktop/vault/src'),
      '@xxmm-apps/first-load': path.resolve(__dirname, 'apps/desktop/first-load/src'),
      '@xxmm-apps/switch-config': path.resolve(__dirname, 'apps/desktop/switch-config/src'),
    }
  },
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
  // 排除无法打包的原生模块
  optimizeDeps: {
    exclude: ['hmc-win32'],
  },
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
            return 'assets/[name].[ext]';
          }
          return 'assets/[name]-[hash].[ext]';
        },
      },
    }
  }
})
