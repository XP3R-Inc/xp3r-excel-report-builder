import { useState } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';

interface DataEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  headers: string[];
  data: Record<string, unknown>[];
  onSave: (headers: string[], data: Record<string, unknown>[]) => void;
}

export function DataEditModal({ isOpen, onClose, headers, data, onSave }: DataEditModalProps) {
  const [editedHeaders, setEditedHeaders] = useState<string[]>(headers);
  const [editedData, setEditedData] = useState<Record<string, unknown>[]>(data);
  const [newColumnName, setNewColumnName] = useState('');

  if (!isOpen) return null;

  const handleCellChange = (rowIndex: number, header: string, value: string) => {
    const newData = [...editedData];
    newData[rowIndex] = { ...newData[rowIndex], [header]: value };
    setEditedData(newData);
  };

  const handleAddColumn = () => {
    if (!newColumnName.trim()) return;

    const columnName = newColumnName.trim();
    if (editedHeaders.includes(columnName)) {
      alert('Column already exists');
      return;
    }

    setEditedHeaders([...editedHeaders, columnName]);
    setEditedData(editedData.map(row => ({ ...row, [columnName]: '' })));
    setNewColumnName('');
  };

  const handleDeleteColumn = (columnName: string) => {
    setEditedHeaders(editedHeaders.filter(h => h !== columnName));
    setEditedData(editedData.map(row => {
      const newRow = { ...row };
      delete newRow[columnName];
      return newRow;
    }));
  };

  const handleAddRow = () => {
    const newRow: Record<string, unknown> = {};
    editedHeaders.forEach(header => {
      newRow[header] = '';
    });
    setEditedData([...editedData, newRow]);
  };

  const handleDeleteRow = (index: number) => {
    setEditedData(editedData.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave(editedHeaders, editedData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Edit Data</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
              placeholder="New column name"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAddColumn}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Column
            </button>
            <button
              onClick={handleAddRow}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Row
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-gray-100 z-10">
              <tr>
                <th className="px-2 py-2 text-left text-sm font-semibold text-gray-700 border">
                  #
                </th>
                {editedHeaders.map((header, index) => (
                  <th
                    key={index}
                    className="px-2 py-2 text-left text-sm font-semibold text-gray-700 border"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span>{header}</span>
                      <button
                        onClick={() => handleDeleteColumn(header)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete column"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </th>
                ))}
                <th className="px-2 py-2 text-left text-sm font-semibold text-gray-700 border w-12">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {editedData.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  <td className="px-2 py-2 text-sm text-gray-600 border">{rowIndex + 1}</td>
                  {editedHeaders.map((header, colIndex) => (
                    <td key={colIndex} className="px-2 py-2 border">
                      <input
                        type="text"
                        value={String(row[header] || '')}
                        onChange={(e) => handleCellChange(rowIndex, header, e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-transparent hover:border-gray-300 focus:border-blue-500 rounded focus:outline-none"
                      />
                    </td>
                  ))}
                  <td className="px-2 py-2 border text-center">
                    <button
                      onClick={() => handleDeleteRow(rowIndex)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {editedData.length} rows × {editedHeaders.length} columns
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
