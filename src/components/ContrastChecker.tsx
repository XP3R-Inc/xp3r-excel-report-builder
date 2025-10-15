import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { checkContrast, isLargeText, suggestAccessibleColor } from '../utils/accessibility';

interface ContrastCheckerProps {
  textColor: string;
  backgroundColor: string;
  fontSize?: number;
  fontWeight?: string;
  onSuggestFix?: (color: string) => void;
}

export function ContrastChecker({
  textColor,
  backgroundColor,
  fontSize = 14,
  fontWeight = 'normal',
  onSuggestFix,
}: ContrastCheckerProps) {
  const large = isLargeText(fontSize, fontWeight);
  const result = checkContrast(textColor, backgroundColor, large);

  const getRatingColor = () => {
    switch (result.rating) {
      case 'aaa':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'aa':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'aa-large':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'fail':
        return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const getRatingLabel = () => {
    switch (result.rating) {
      case 'aaa':
        return 'AAA';
      case 'aa':
        return 'AA';
      case 'aa-large':
        return 'AA (Large)';
      case 'fail':
        return 'Fail';
    }
  };

  const getRatingIcon = () => {
    switch (result.rating) {
      case 'aaa':
      case 'aa':
        return <CheckCircle className="w-4 h-4" />;
      case 'aa-large':
        return <Info className="w-4 h-4" />;
      case 'fail':
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const handleFixContrast = () => {
    const suggestedColor = suggestAccessibleColor(textColor, backgroundColor, large ? 3 : 4.5);
    if (suggestedColor && onSuggestFix) {
      onSuggestFix(suggestedColor);
    }
  };

  return (
    <div className={`p-3 border rounded-lg ${getRatingColor()}`}>
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0 mt-0.5">{getRatingIcon()}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold">Contrast: {result.ratio.toFixed(2)}:1</span>
            <span className="text-xs font-bold">{getRatingLabel()}</span>
          </div>

          <div className="text-xs space-y-0.5">
            {large && <div className="text-xs opacity-80">Large text ({fontSize}px)</div>}

            {result.rating === 'fail' && (
              <div className="mt-2">
                <p className="mb-1.5">
                  {large
                    ? 'Needs 3:1 minimum for large text'
                    : 'Needs 4.5:1 minimum for normal text'}
                </p>
                {onSuggestFix && (
                  <button
                    onClick={handleFixContrast}
                    className="text-xs font-medium underline hover:no-underline"
                  >
                    Suggest accessible color
                  </button>
                )}
              </div>
            )}

            {result.rating === 'aa-large' && !large && (
              <p className="mt-1">
                Passes for large text only. Increase to 4.5:1 for normal text.
              </p>
            )}

            {result.rating === 'aa' && (
              <p className="mt-1">
                Passes WCAG AA. Consider 7:1 for AAA.
              </p>
            )}

            {result.rating === 'aaa' && (
              <p className="mt-1">
                Excellent! Passes WCAG AAA standards.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-2 flex gap-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded border" style={{ backgroundColor: textColor }} />
          <span>Text</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded border" style={{ backgroundColor }} />
          <span>Background</span>
        </div>
      </div>
    </div>
  );
}
