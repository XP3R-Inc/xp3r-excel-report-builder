interface DataPreviewProps {
  headers: string[];
  data: Record<string, unknown>[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function DataPreview({ headers, data, onConfirm, onCancel }: DataPreviewProps) {
  const displayRows = data.slice(0, 10);

  return (
    <div className="w-full max-w-6xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Preview Your Data</h2>
        <p className="text-sm text-gray-600">
          Found {headers.length} columns and {data.length} rows
          {data.length > 10 && ' (showing first 10 rows)'}
        </p>
      </div>

      <div className="overflow-x-auto mb-6 border rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b hover:bg-gray-50">
                {headers.map((header, colIndex) => (
                  <td
                    key={colIndex}
                    className="px-4 py-3 text-gray-700 whitespace-nowrap"
                  >
                    {String(row[header] || '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Confirm & Continue
        </button>
      </div>
    </div>
  );
}
