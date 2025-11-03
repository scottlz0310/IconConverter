import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // セキュリティ設定
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
    },
  },
  build: {
    // パフォーマンス最適化設定
    target: 'es2020',
    minify: 'esbuild', // esbuildの方が高速
    // ソースマップを本番環境では無効化（セキュリティ向上）
    sourcemap: false,
    rollupOptions: {
      output: {
        // チャンク分割戦略（バンドルサイズ削減）
        manualChunks(id) {
          // node_modules内のパッケージを自動的にvendorチャンクに分割
          if (id.includes('node_modules')) {
            // React関連
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor'
            }
            // TanStack Query
            if (id.includes('@tanstack/react-query')) {
              return 'query-vendor'
            }
            // その他のvendor
            return 'vendor'
          }
        },
      },
    },
    // チャンクサイズ警告の閾値を調整
    chunkSizeWarningLimit: 1000,
  },
})
