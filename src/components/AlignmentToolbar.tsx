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
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-200">
      <span className="text-sm text-gray-600 mr-2">{selectedCount} selected</span>

      {selectedCount > 1 && (
        <>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onAlign('left')}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Align Left"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onAlign('center')}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Align Center"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              onClick={() => onAlign('right')}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Align Right"
            >
              <AlignRight className="w-4 h-4" />
            </button>
          </div>

          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onAlign('top')}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Align Top"
            >
              <AlignVerticalJustifyStart className="w-4 h-4" />
            </button>
            <button
              onClick={() => onAlign('middle')}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Align Middle"
            >
              <AlignVerticalJustifyCenter className="w-4 h-4" />
            </button>
            <button
              onClick={() => onAlign('bottom')}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Align Bottom"
            >
              <AlignVerticalJustifyEnd className="w-4 h-4" />
            </button>
          </div>

          <div className="h-6 w-px bg-gray-300"></div>
          <button
            onClick={onGroup}
            className="flex items-center gap-1 px-3 py-1.5 text-sm hover:bg-gray-100 rounded transition-colors"
            title="Group Selection"
          >
            <Group className="w-4 h-4" />
            Group
          </button>
        </>
      )}

      {hasGroup && (
        <button
          onClick={onUngroup}
          className="flex items-center gap-1 px-3 py-1.5 text-sm hover:bg-gray-100 rounded transition-colors"
          title="Ungroup"
        >
          <Ungroup className="w-4 h-4" />
          Ungroup
        </button>
      )}
    </div>
  );
}
