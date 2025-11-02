/**
 * 変換オプションコンポーネント
 *
 * 透明化保持と自動背景透明化のオプションを提供します。
 * 要件3.1, 3.2, 3.3, 3.4, 3.5に対応
 */

import { Checkbox } from './ui/checkbox';
import { useImageStore } from '../stores/imageStore';

/**
 * ConversionOptionsコンポーネント
 *
 * 透明化オプションを選択するためのUIを提供します。
 * - 透明化保持: 既存の透明度を保持
 * - 自動背景透明化: 四隅のピクセルから単色背景を検出して除去
 *
 * 相互排他制御により、両方のオプションを同時に有効にすることはできません。
 * デフォルトでは「透明化保持」が有効です。
 *
 * @example
 * ```tsx
 * <ConversionOptions />
 * ```
 */
export function ConversionOptions() {
  const { options, status, setOptions } = useImageStore();

  // 要件5.5: 処理中はオプション変更を無効化
  const isProcessing = status === 'uploading' || status === 'converting';

  /**
   * 透明化保持チェックボックスの変更ハンドラー
   * 要件3.3: 透明化保持が選択されたら、自動背景透明化を無効化
   */
  const handlePreserveTransparencyChange = (checked: boolean) => {
    setOptions({
      preserveTransparency: checked,
      autoTransparentBg: checked ? false : options.autoTransparentBg,
    });
  };

  /**
   * 自動背景透明化チェックボックスの変更ハンドラー
   * 要件3.4: 自動背景透明化が選択されたら、透明化保持を無効化
   */
  const handleAutoTransparentBgChange = (checked: boolean) => {
    setOptions({
      preserveTransparency: checked ? false : options.preserveTransparency,
      autoTransparentBg: checked,
    });
  };

  /**
   * キーボードイベントハンドラー
   */
  const handleKeyDown = (e: React.KeyboardEvent, option: 'preserve' | 'auto') => {
    // Enterキーまたはスペースキーでチェックボックスをトグル
    if ((e.key === 'Enter' || e.key === ' ') && !isProcessing) {
      e.preventDefault();
      if (option === 'preserve') {
        handlePreserveTransparencyChange(!options.preserveTransparency);
      } else {
        handleAutoTransparentBgChange(!options.autoTransparentBg);
      }
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <h3 className="text-base sm:text-lg font-semibold">変換オプション</h3>

      <div className="space-y-3 sm:space-y-4">
        {/* 透明化保持オプション - 要件3.1 */}
        <div className="space-y-1.5 sm:space-y-2">
          <div
            className="flex items-center space-x-2 sm:space-x-3 min-h-[44px] touch-manipulation"
            onKeyDown={(e) => handleKeyDown(e, 'preserve')}
          >
            <Checkbox
              id="preserve-transparency"
              checked={options.preserveTransparency}
              onCheckedChange={handlePreserveTransparencyChange}
              disabled={isProcessing}
              aria-label="透明化保持"
              aria-describedby="preserve-transparency-desc"
              className="h-5 w-5 sm:h-6 sm:w-6 focus:ring-2 focus:ring-primary focus:ring-offset-2"
            />
            <label
              htmlFor="preserve-transparency"
              className="text-xs sm:text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70 py-2"
            >
              透明化保持
            </label>
          </div>
          <p id="preserve-transparency-desc" className="text-xs sm:text-sm text-muted-foreground ml-7 sm:ml-9">
            既存の透明度を保持します（PNG、GIF、WebP形式）
          </p>
        </div>

        {/* 自動背景透明化オプション - 要件3.2 */}
        <div className="space-y-1.5 sm:space-y-2">
          <div
            className="flex items-center space-x-2 sm:space-x-3 min-h-[44px] touch-manipulation"
            onKeyDown={(e) => handleKeyDown(e, 'auto')}
          >
            <Checkbox
              id="auto-transparent-bg"
              checked={options.autoTransparentBg}
              onCheckedChange={handleAutoTransparentBgChange}
              disabled={isProcessing}
              aria-label="自動背景透明化"
              aria-describedby="auto-transparent-bg-desc"
              className="h-5 w-5 sm:h-6 sm:w-6 focus:ring-2 focus:ring-primary focus:ring-offset-2"
            />
            <label
              htmlFor="auto-transparent-bg"
              className="text-xs sm:text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70 py-2"
            >
              自動背景透明化
            </label>
          </div>
          <p id="auto-transparent-bg-desc" className="text-xs sm:text-sm text-muted-foreground ml-7 sm:ml-9">
            四隅のピクセルから単色背景を検出して除去します
          </p>
        </div>
      </div>

      {/* 相互排他の説明 */}
      <p className="text-[10px] sm:text-xs text-muted-foreground italic">
        ※ 透明化保持と自動背景透明化は同時に選択できません
      </p>
    </div>
  );
}
