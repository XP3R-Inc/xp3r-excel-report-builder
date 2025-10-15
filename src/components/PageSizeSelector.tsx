interface PageSize {
  name: string;
  width: number;
  height: number;
}

const PAGE_SIZES: PageSize[] = [
  { name: 'A4', width: 794, height: 1123 },
  { name: 'Letter', width: 816, height: 1056 },
  { name: 'Legal', width: 816, height: 1344 },
  { name: 'A3', width: 1123, height: 1587 },
  { name: 'Tabloid', width: 1056, height: 1632 },
];

interface PageSizeSelectorProps {
  selectedSize: PageSize;
  orientation: 'portrait' | 'landscape';
  onSizeChange: (size: PageSize) => void;
  onOrientationChange: (orientation: 'portrait' | 'landscape') => void;
}

export function PageSizeSelector({
  selectedSize,
  orientation,
  onSizeChange,
  onOrientationChange,
}: PageSizeSelectorProps) {
  return (
    <div className="flex items-center gap-3 px-3 py-1.5 bg-white border-b">
      <div className="flex items-center gap-1.5">
        <label className="text-xs font-medium text-gray-700">Page:</label>
        <select
          value={selectedSize.name}
          onChange={(e) => {
            const size = PAGE_SIZES.find((s) => s.name === e.target.value);
            if (size) onSizeChange(size);
          }}
          className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {PAGE_SIZES.map((size) => (
            <option key={size.name} value={size.name}>
              {size.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="flex gap-0.5 border border-gray-300 rounded p-0.5">
          <button
            onClick={() => onOrientationChange('portrait')}
            className={`px-2 py-0.5 text-xs rounded transition-colors ${
              orientation === 'portrait'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Portrait
          </button>
          <button
            onClick={() => onOrientationChange('landscape')}
            className={`px-2 py-0.5 text-xs rounded transition-colors ${
              orientation === 'landscape'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Landscape
          </button>
        </div>
      </div>

      <div className="ml-auto text-xs text-gray-600">
        {orientation === 'portrait'
          ? `${selectedSize.width} × ${selectedSize.height}px`
          : `${selectedSize.height} × ${selectedSize.width}px`}
      </div>
    </div>
  );
}

export { PAGE_SIZES };
export type { PageSize };
