import { lazy, Suspense } from 'react'
import { Layout } from './components/Layout'
import { FileUploader } from './components/FileUploader'
import { ConversionProgress } from './components/ConversionProgress'
import { Toaster } from './components/ui/toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { useImageStore } from './stores/imageStore'

// コード分割: 画像選択後に必要なコンポーネントを遅延ロード（パフォーマンス最適化）
const ImagePreview = lazy(() => import('./components/ImagePreview').then(m => ({ default: m.ImagePreview })))
const ConversionOptions = lazy(() =>
  import('./components/ConversionOptions').then(m => ({ default: m.ConversionOptions })),
)
const ConvertButton = lazy(() => import('./components/ConvertButton').then(m => ({ default: m.ConvertButton })))

function App() {
  const { image, error, status } = useImageStore()

  // 要件5.3, 5.4, 5.5: 状態に応じた表示制御
  const isProcessing = status === 'uploading' || status === 'converting'
  const showOptions = image && !isProcessing && status !== 'success'

  return (
    <Layout>
      {/* レスポンシブグリッドレイアウト: モバイルは1列、タブレット以上は2列 */}
      <div className="space-y-4 sm:space-y-6">
        {/* メインカード: アップロードとプログレス */}
        <Card className="animate-fade-in transition-smooth hover-lift">
          <CardHeader className="space-y-1 sm:space-y-2">
            <CardTitle className="text-xl sm:text-2xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Image to ICO Converter
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              画像ファイルをWindowsアイコン（ICO）形式に変換します
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            {/* ファイルアップローダー - 処理中は無効化 */}
            <div
              className={isProcessing ? 'pointer-events-none opacity-50' : ''}
              aria-busy={isProcessing}
              aria-live="polite"
            >
              <FileUploader />
            </div>

            {/* エラーメッセージ表示 */}
            {error && (
              <div
                className="p-3 sm:p-4 bg-destructive/10 border border-destructive/20 rounded-lg"
                role="alert"
                aria-live="assertive"
              >
                <p className="text-xs sm:text-sm text-destructive font-medium break-words">{error}</p>
              </div>
            )}

            {/* プログレス表示 - 処理中、成功時、エラー時に表示 */}
            <ConversionProgress />
          </CardContent>
        </Card>

        {/* タブレット以上: 2列グリッドレイアウト */}
        {image && (
          <Suspense
            fallback={
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <Card className="animate-pulse">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="h-64 bg-muted rounded-lg animate-pulse-subtle" />
                      <div className="h-4 bg-muted rounded w-3/4 animate-pulse-subtle" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            }
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 animate-scale-in" role="region" aria-label="画像変換エリア">
              {/* 画像プレビュー */}
              <div className="order-1">
                <ImagePreview />
              </div>

              {/* 変換オプションと変換ボタン */}
              {showOptions && (
                <div className="order-2 animate-slide-in">
                  <Card className="h-full transition-smooth hover-lift">
                    <CardContent className="pt-4 sm:pt-6 space-y-4 sm:space-y-6">
                      <ConversionOptions />
                      <ConvertButton />
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </Suspense>
        )}
      </div>

      {/* トースト通知 */}
      <Toaster />
    </Layout>
  )
}

export default App
