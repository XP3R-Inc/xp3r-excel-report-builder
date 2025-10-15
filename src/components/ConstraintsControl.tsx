import { Pin, Anchor } from 'lucide-react';
import { CanvasElement } from '../lib/types';

interface ConstraintsControlProps {
  element: CanvasElement;
  onUpdate: (updates: Partial<CanvasElement>) => void;
  pageWidth?: number;
  pageHeight?: number;
}

export function ConstraintsControl({
  element,
  onUpdate,
  pageWidth = 595,
  pageHeight = 842,
}: ConstraintsControlProps) {
  const constraints = element.constraints || {};

  const handleConstraintToggle = (key: keyof typeof constraints) => {
    onUpdate({
      constraints: {
        ...constraints,
        [key]: !constraints[key],
      },
    });
  };

  const handleSnapTo = (position: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom') => {
    const updates: Partial<CanvasElement> = {};

    switch (position) {
      case 'left':
        updates.x = 0;
        break;
      case 'center-h':
        updates.x = (pageWidth - element.width) / 2;
        break;
      case 'right':
        updates.x = pageWidth - element.width;
        break;
      case 'top':
        updates.y = 0;
        break;
      case 'center-v':
        updates.y = (pageHeight - element.height) / 2;
        break;
      case 'bottom':
        updates.y = pageHeight - element.height;
        break;
    }

    onUpdate(updates);
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-2">
          <Pin className="w-3.5 h-3.5" />
          <span>Pin to Page</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={constraints.pinTop || false}
              onChange={() => handleConstraintToggle('pinTop')}
              className="rounded"
            />
            <span>Top</span>
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={constraints.pinBottom || false}
              onChange={() => handleConstraintToggle('pinBottom')}
              className="rounded"
            />
            <span>Bottom</span>
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={constraints.pinLeft || false}
              onChange={() => handleConstraintToggle('pinLeft')}
              className="rounded"
            />
            <span>Left</span>
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={constraints.pinRight || false}
              onChange={() => handleConstraintToggle('pinRight')}
              className="rounded"
            />
            <span>Right</span>
          </label>
        </div>
      </div>

      <div>
        <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-2">
          <Anchor className="w-3.5 h-3.5" />
          <span>Center on Page</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={constraints.centerHorizontal || false}
              onChange={() => handleConstraintToggle('centerHorizontal')}
              className="rounded"
            />
            <span>Horizontal</span>
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={constraints.centerVertical || false}
              onChange={() => handleConstraintToggle('centerVertical')}
              className="rounded"
            />
            <span>Vertical</span>
          </label>
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={constraints.maintainAspectRatio || false}
            onChange={() => handleConstraintToggle('maintainAspectRatio')}
            className="rounded"
          />
          <span className="font-medium">Maintain Aspect Ratio</span>
        </label>
      </div>

      <div className="border-t border-gray-200 pt-3">
        <label className="block text-xs font-medium text-gray-600 mb-2">Quick Position</label>
        <div className="grid grid-cols-3 gap-1">
          <button
            onClick={() => handleSnapTo('left')}
            className="px-2 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Left
          </button>
          <button
            onClick={() => handleSnapTo('center-h')}
            className="px-2 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Center H
          </button>
          <button
            onClick={() => handleSnapTo('right')}
            className="px-2 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Right
          </button>
          <button
            onClick={() => handleSnapTo('top')}
            className="px-2 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Top
          </button>
          <button
            onClick={() => handleSnapTo('center-v')}
            className="px-2 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Center V
          </button>
          <button
            onClick={() => handleSnapTo('bottom')}
            className="px-2 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Bottom
          </button>
        </div>
      </div>
    </div>
  );
}
