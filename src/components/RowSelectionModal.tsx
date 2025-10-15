import { useState, useMemo } from 'react';
import { X, Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface RowSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: Record<string, unknown>[];
  headers: string[];
  onSelectRow: (rowIndex: number) => void;
  currentRowIndex?: number;
}

const ROWS_PER_PAGE = 10;

export function RowSelectionModal({
  isOpen,
  onClose,
  data,
  headers,
  onSelectRow,
  currentRowIndex = 0,
}: RowSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(currentRowIndex);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase();
    return data.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(query)
      )
    );
  }, [data, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / ROWS_PER_PAGE);
  const startIndex = currentPage * ROWS_PER_PAGE;
  const endIndex = startIndex + ROWS_PER_PAGE;
  const currentPageData = filteredData.slice(startIndex, endIndex);

  const handleSelect = () => {
    onSelectRow(selectedIndex);
    onClose();
  };

  const getRowIdentifier = (row: Record<string, unknown>, index: number): string => {
    const nameFields = ['name', 'Name', 'title', 'Title', 'id', 'ID'];
    for (const field of nameFields) {
      if (row[field]) {
        return String(row[field]);
      }
    }
    return `Row ${index + 1}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Select Row to Export</h2>
            <p className="text-sm text-gray-600 mt-1">
              Choose which data row to export as PDF
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search in all fields..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(0);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {searchQuery && (
            <p className="text-sm text-gray-600 mt-2">
              Found {filteredData.length} matching {filteredData.length === 1 ? 'row' : 'rows'}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-2">
            {currentPageData.map((row, idx) => {
              const actualIndex = data.indexOf(row);
              const isSelected = selectedIndex === actualIndex;

              return (
                <button
                  key={actualIndex}
                  onClick={() => setSelectedIndex(actualIndex)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">
                          {getRowIdentifier(row, actualIndex)}
                        </span>
                        <span className="text-xs text-gray-500">
                          (Row {actualIndex + 1} of {data.length})
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {headers.slice(0, 4).map((header) => (
                          <div key={header} className="text-sm truncate">
                            <span className="text-gray-600">{header}:</span>{' '}
                            <span className="text-gray-900">
                              {String(row[header] || '')}
                            </span>
                          </div>
                        ))}
                      </div>
                      {headers.length > 4 && (
                        <p className="text-xs text-gray-500 mt-1">
                          +{headers.length - 4} more fields
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <div className="flex-shrink-0 ml-4">
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7"></path>
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {filteredData.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No rows found matching your search.</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
            <p className="text-sm text-gray-600">
              Page {currentPage + 1} of {totalPages} ({filteredData.length} total rows)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage === totalPages - 1}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSelect}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Preview & Export
          </button>
        </div>
      </div>
    </div>
  );
}
