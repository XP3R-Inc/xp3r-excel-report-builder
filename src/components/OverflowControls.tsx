import { AlertTriangle, Maximize2 } from 'lucide-react';
import { CanvasElement } from '../lib/types';
import { findMaxDataLength } from '../utils/textOverflow';

interface OverflowControlsProps {
  element: CanvasElement;
  data: Record<string, unknown>[];
  onUpdate: (updates: Partial<CanvasElement>) => void;
}

export function OverflowControls({ element, data, onUpdate }: OverflowControlsProps) {
  const overflowInfo =
    element.type === 'text' && (element.dataBinding || element.dataBindings)
      ? findMaxDataLength(element, data)
      : null;

  const handleTestLongestRow = () => {
    if (overflowInfo) {
    }
  };

  return (
    <div className="space-y-3">
      {overflowInfo && overflowInfo.willOverflow && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <p className="font-semibold text-amber-900 mb-1">Text Overflow Warning</p>
              <p className="text-amber-700 mb-2">
                Row {overflowInfo.maxRow + 1} has {overflowInfo.maxLength} characters and may
                overflow. Consider adjusting the strategy below.
              </p>
              <button
                onClick={handleTestLongestRow}
                className="px-2 py-1 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded text-amber-800 font-medium transition-colors"
              >
                <Maximize2 className="w-3 h-3 inline mr-1" />
                Test with longest row
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Overflow Strategy</label>
        <select
          value={element.overflowStrategy || 'wrap'}
          onChange={(e) =>
            onUpdate({
              overflowStrategy: e.target.value as CanvasElement['overflowStrategy'],
            })
          }
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="wrap">Wrap text</option>
          <option value="auto-shrink">Auto-shrink to fit</option>
          <option value="truncate">Truncate with ellipsis</option>
          <option value="scale-line-height">Scale line height</option>
          <option value="auto-expand">Auto-expand height</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">
          {element.overflowStrategy === 'wrap' && 'Text wraps to next line'}
          {element.overflowStrategy === 'auto-shrink' && 'Font size reduces to fit'}
          {element.overflowStrategy === 'truncate' && 'Text cuts off with ...'}
          {element.overflowStrategy === 'scale-line-height' && 'Line height adjusts'}
          {element.overflowStrategy === 'auto-expand' && 'Container grows vertically'}
        </p>
      </div>

      {element.overflowStrategy === 'auto-shrink' && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Minimum Font Size
          </label>
          <input
            type="number"
            value={element.minFontSize || 8}
            onChange={(e) => onUpdate({ minFontSize: Number(e.target.value) })}
            min="6"
            max={element.style?.fontSize || 16}
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Text won't shrink below this size
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={element.hyphenation || false}
              onChange={(e) => onUpdate({ hyphenation: e.target.checked })}
              className="rounded"
            />
            <span>Hyphenation</span>
          </label>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Word Break</label>
          <select
            value={element.wordBreak || 'word'}
            onChange={(e) =>
              onUpdate({ wordBreak: e.target.value as 'word' | 'character' })
            }
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="word">By word</option>
            <option value="character">By character</option>
          </select>
        </div>
      </div>

      {element.style?.fontSize && (
        <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
          <div className="font-medium mb-1">Estimated Capacity</div>
          <div>
            At {element.style.fontSize}px, approximately{' '}
            {Math.floor(element.width / (element.style.fontSize * 0.6))} characters per line,{' '}
            {Math.floor(element.height / (element.style.fontSize * (element.style.lineHeight || 1.5)))}{' '}
            lines total
          </div>
        </div>
      )}
    </div>
  );
}
