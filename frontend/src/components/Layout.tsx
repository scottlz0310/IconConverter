import type { ReactNode } from 'react'
import { ThemeToggle } from './ThemeToggle'

interface LayoutProps {
  children: ReactNode
}

/**
 * アプリケーション全体のレイアウトコンポーネント
 * ヘッダー、メインコンテンツエリア、フッターを含む
 * レスポンシブデザイン対応
 */
export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* スキップリンク - キーボードナビゲーション用 */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      >
        メインコンテンツへスキップ
      </a>

      {/* ヘッダー */}
      <header className="border-b border-border bg-card glass-effect sticky top-0 z-40 animate-fade-in" role="banner">
        <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 gradient-primary rounded-lg flex items-center justify-center transition-smooth hover-scale shadow-md">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                  Image to ICO Converter
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                  画像をWindowsアイコンファイルに変換
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* メインコンテンツエリア */}
      <main
        id="main-content"
        className="flex-1 container mx-auto px-4 py-6 sm:px-6 lg:px-8 sm:py-8 lg:py-12"
        role="main"
        tabIndex={-1}
      >
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </main>

      {/* フッター */}
      <footer className="border-t border-border bg-card mt-auto transition-smooth" role="contentinfo">
        <div className="container mx-auto px-4 py-4 sm:py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
            <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
              © 2024 Image to ICO Converter. All rights reserved.
            </p>
            <div className="flex items-center space-x-3 sm:space-x-4 text-xs sm:text-sm text-muted-foreground">
              <span className="px-2 py-1 bg-muted/50 rounded-md">対応形式: PNG, JPEG, BMP, GIF, TIFF, WebP</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline px-2 py-1 bg-muted/50 rounded-md">最大10MB</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
