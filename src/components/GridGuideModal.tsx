import { useState, useEffect } from 'react';
import { X, Wand2 } from 'lucide-react';

interface GridGuideModalProps {
  isOpen: boolean;
  pageWidth: number;
  pageHeight: number;
  onApply: (rows: number, cols: number) => void;
  onClose: () => void;
}

export function GridGuideModal({ isOpen, pageWidth, pageHeight, onApply, onClose }: GridGuideModalProps) {
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(3);

  useEffect(() => {
    if (isOpen) {
      // Initialize a sensible default on open based on page size
      recommend();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, pageWidth, pageHeight]);

  if (!isOpen) return null;

  const recommend = () => {
    // Aim for target cell size; tune values for practical grids
    const targetCellW = 220; // px
    const targetCellH = 180; // px
    const recCols = Math.max(2, Math.min(8, Math.round(pageWidth / targetCellW)));
    const recRows = Math.max(2, Math.min(12, Math.round(pageHeight / targetCellH)));
    setCols(recCols);
    setRows(recRows);
  };

  const apply = () => {
    const r = Math.max(2, Math.min(50, Math.floor(rows)));
    const c = Math.max(2, Math.min(50, Math.floor(cols)));
    onApply(r, c);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Add Grid Guides</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="text-xs text-gray-600">Page: {Math.round(pageWidth)} × {Math.round(pageHeight)} px</div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Columns</label>
              <input
                type="number"
                min={2}
                max={50}
                value={cols}
                onChange={(e) => setCols(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Rows</label>
              <input
                type="number"
                min={2}
                max={50}
                value={rows}
                onChange={(e) => setRows(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={recommend}
              className="flex items-center gap-1 px-3 py-2 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              title="Recommend based on page size"
            >
              <Wand2 className="w-3.5 h-3.5" />
              Recommend
            </button>
            <div className="text-xs text-gray-500">Suggests a balanced grid for this page size</div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={apply} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Apply</button>
        </div>
      </div>
    </div>
  );
}


