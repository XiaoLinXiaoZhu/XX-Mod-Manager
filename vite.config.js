import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [vue({
    template: {
      compilerOptions: {
        isCustomElement: tag => tag.startsWith('s-')
      }
    }
  })],
  server: {
    port: 3000
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'index.html',
        tapePage: 'tapePage/index.html'
      }
    }
  },
  assetsInclude: ['**/*.png', '**/*.jpg', '**/*.ttf', '**/*.woff2'], // 确保添加所有静态资源类型
})