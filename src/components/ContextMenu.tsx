import { Lock, Unlock, Layers, Copy, Trash2, FolderMinus, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown } from 'lucide-react';
import { useEffect } from 'react';

interface ContextMenuProps {
  x: number;
  y: number;
  isLocked: boolean;
  canGroup: boolean;
  isGrouped: boolean;
  onLock: () => void;
  onUnlock: () => void;
  onGroup: () => void;
  onUngroup: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function ContextMenu({
  x,
  y,
  isLocked,
  canGroup,
  isGrouped,
  onLock,
  onUnlock,
  onGroup,
  onUngroup,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  onDuplicate,
  onDelete,
  onClose,
}: ContextMenuProps) {
  useEffect(() => {
    const handleClickOutside = () => onClose();
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 0);

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div
      className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 min-w-[180px]"
      style={{ left: `${x}px`, top: `${y}px` }}
      onClick={(e) => e.stopPropagation()}
    >
      {isLocked ? (
        <button
          onClick={onUnlock}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-3 text-gray-700"
        >
          <Unlock className="w-4 h-4" />
          Unlock
        </button>
      ) : (
        <button
          onClick={onLock}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-3 text-gray-700"
        >
          <Lock className="w-4 h-4" />
          Lock
        </button>
      )}

      {canGroup && (
        <button
          onClick={onGroup}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-3 text-gray-700"
        >
          <Layers className="w-4 h-4" />
          Group Selected
        </button>
      )}

      {isGrouped && (
        <button
          onClick={onUngroup}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-3 text-gray-700"
        >
          <FolderMinus className="w-4 h-4" />
          Ungroup
        </button>
      )}

      <div className="border-t border-gray-200 my-1" />

      <button
        onClick={onBringToFront}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-3 text-gray-700"
      >
        <ChevronsUp className="w-4 h-4" />
        Bring to Front
      </button>

      <button
        onClick={onBringForward}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-3 text-gray-700"
      >
        <ArrowUp className="w-4 h-4" />
        Bring Forward
      </button>

      <button
        onClick={onSendBackward}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-3 text-gray-700"
      >
        <ArrowDown className="w-4 h-4" />
        Send Backward
      </button>

      <button
        onClick={onSendToBack}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-3 text-gray-700"
      >
        <ChevronsDown className="w-4 h-4" />
        Send to Back
      </button>

      <div className="border-t border-gray-200 my-1" />

      <button
        onClick={onDuplicate}
        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-3 text-gray-700"
      >
        <Copy className="w-4 h-4" />
        Duplicate
      </button>

      <div className="border-t border-gray-200 my-1" />

      <button
        onClick={onDelete}
        className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-3 text-red-600"
      >
        <Trash2 className="w-4 h-4" />
        Delete
      </button>
    </div>
  );
}
