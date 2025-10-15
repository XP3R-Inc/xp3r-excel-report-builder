import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  Group,
  Ungroup,
} from 'lucide-react';
import { getModifierKey } from '../hooks/useKeyboardShortcuts';

interface AlignmentToolbarProps {
  selectedCount: number;
  onAlign: (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  onGroup: () => void;
  onUngroup: () => void;
  hasGroup: boolean;
}

export function AlignmentToolbar({
  selectedCount,
  onAlign,
  onGroup,
  onUngroup,
  hasGroup,
}: AlignmentToolbarProps) {
  const isVisible = selectedCount > 0;
  const modKey = getModifierKey();

  return (
    <div
      className="bg-white border-b border-gray-200 overflow-hidden transition-all duration-200 ease-in-out"
      style={{
        height: isVisible ? '36px' : '0px',
        borderBottomWidth: isVisible ? '1px' : '0px',
      }}
    >
      <div
        className="flex items-center gap-1.5 px-3 py-1.5 h-9 transition-opacity duration-200"
        style={{
          opacity: isVisible ? 1 : 0,
          pointerEvents: isVisible ? 'auto' : 'none',
        }}
      >
        <span className="text-xs text-gray-600 mr-1.5">{selectedCount} selected</span>

        {selectedCount > 1 && (
          <>
            <div className="h-5 w-px bg-gray-300"></div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => onAlign('left')}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="Align Left"
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onAlign('center')}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="Align Center"
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onAlign('right')}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="Align Right"
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-5 w-px bg-gray-300"></div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => onAlign('top')}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="Align Top"
              >
                <AlignVerticalJustifyStart className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onAlign('middle')}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="Align Middle"
              >
                <AlignVerticalJustifyCenter className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onAlign('bottom')}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="Align Bottom"
              >
                <AlignVerticalJustifyEnd className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-5 w-px bg-gray-300"></div>
            <button
              onClick={onGroup}
              className="flex items-center gap-1 px-2 py-1 text-xs hover:bg-gray-100 rounded transition-colors"
              title={`Group Selection (${modKey}+G)`}
            >
              <Group className="w-3.5 h-3.5" />
              Group
            </button>
          </>
        )}

        {hasGroup && (
          <button
            onClick={onUngroup}
            className="flex items-center gap-1 px-2 py-1 text-xs hover:bg-gray-100 rounded transition-colors"
            title={`Ungroup (${modKey}+Shift+G)`}
          >
            <Ungroup className="w-3.5 h-3.5" />
            Ungroup
          </button>
        )}
      </div>
    </div>
  );
}
