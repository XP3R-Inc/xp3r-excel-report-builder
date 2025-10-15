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
    <div className="flex items-center gap-4 p-4 bg-white border-b">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Page Size:</label>
        <select
          value={selectedSize.name}
          onChange={(e) => {
            const size = PAGE_SIZES.find((s) => s.name === e.target.value);
            if (size) onSizeChange(size);
          }}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {PAGE_SIZES.map((size) => (
            <option key={size.name} value={size.name}>
              {size.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Orientation:</label>
        <div className="flex gap-1 border border-gray-300 rounded-lg p-0.5">
          <button
            onClick={() => onOrientationChange('portrait')}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              orientation === 'portrait'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Portrait
          </button>
          <button
            onClick={() => onOrientationChange('landscape')}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              orientation === 'landscape'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Landscape
          </button>
        </div>
      </div>

      <div className="ml-auto text-sm text-gray-600">
        {orientation === 'portrait'
          ? `${selectedSize.width} × ${selectedSize.height}px`
          : `${selectedSize.height} × ${selectedSize.width}px`}
      </div>
    </div>
  );
}

export { PAGE_SIZES };
export type { PageSize };
