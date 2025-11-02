import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'

/**
 * TanStack Query クライアントの設定
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // デフォルトのクエリ設定
      refetchOnWindowFocus: false, // ウィンドウフォーカス時の自動再取得を無効化
      retry: 1, // 失敗時に1回リトライ
      staleTime: 5 * 60 * 1000, // 5分間はデータを新鮮とみなす
    },
    mutations: {
      // デフォルトのミューテーション設定
      retry: 0, // ミューテーションは基本的にリトライしない（個別に設定）
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
