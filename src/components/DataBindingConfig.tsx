import { Plus, X } from 'lucide-react';
import { DataBinding } from '../lib/types';

interface DataBindingConfigProps {
  bindings: DataBinding[];
  separator: string;
  headers: string[];
  onChange: (bindings: DataBinding[], separator: string) => void;
}

export function DataBindingConfig({
  bindings,
  separator,
  headers,
  onChange,
}: DataBindingConfigProps) {
  const addBinding = () => {
    onChange([...bindings, { field: '', format: 'none' }], separator);
  };

  const removeBinding = (index: number) => {
    const updated = bindings.filter((_, i) => i !== index);
    onChange(updated, separator);
  };

  const updateBinding = (index: number, updates: Partial<DataBinding>) => {
    const updated = bindings.map((b, i) => (i === index ? { ...b, ...updates } : b));
    onChange(updated, separator);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-600">Advanced Data Binding</label>
        <button
          onClick={addBinding}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add Field
        </button>
      </div>

      {bindings.map((binding, index) => (
        <div key={index} className="p-3 bg-gray-50 rounded-lg space-y-2">
          <div className="flex items-start gap-2">
            <div className="flex-1 space-y-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Field</label>
                <select
                  value={binding.field}
                  onChange={(e) => updateBinding(index, { field: e.target.value })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select field</option>
                  {headers.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">Format</label>
                <select
                  value={binding.format || 'none'}
                  onChange={(e) => updateBinding(index, { format: e.target.value as any })}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="none">None</option>
                  <option value="currency">Currency</option>
                  <option value="date">Date</option>
                  <option value="number">Number</option>
                  <option value="percentage">Percentage</option>
                </select>
              </div>

              {binding.format === 'currency' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Symbol</label>
                    <input
                      type="text"
                      value={binding.currencySymbol || '$'}
                      onChange={(e) => updateBinding(index, { currencySymbol: e.target.value })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Decimals</label>
                    <input
                      type="number"
                      min="0"
                      max="4"
                      value={binding.decimalPlaces ?? 2}
                      onChange={(e) => updateBinding(index, { decimalPlaces: parseInt(e.target.value) })}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {binding.format === 'date' && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Date Format</label>
                  <input
                    type="text"
                    value={binding.dateFormat || 'MM/DD/YYYY'}
                    onChange={(e) => updateBinding(index, { dateFormat: e.target.value })}
                    placeholder="e.g., MM/DD/YYYY"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Use: YYYY, MM, DD, HH, mm, ss
                  </p>
                </div>
              )}

              {(binding.format === 'number' || binding.format === 'percentage') && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Decimal Places</label>
                  <input
                    type="number"
                    min="0"
                    max="4"
                    value={binding.decimalPlaces ?? 2}
                    onChange={(e) => updateBinding(index, { decimalPlaces: parseInt(e.target.value) })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Prefix</label>
                  <input
                    type="text"
                    value={binding.prefix || ''}
                    onChange={(e) => updateBinding(index, { prefix: e.target.value })}
                    placeholder="e.g., $"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Suffix</label>
                  <input
                    type="text"
                    value={binding.suffix || ''}
                    onChange={(e) => updateBinding(index, { suffix: e.target.value })}
                    placeholder="e.g., USD"
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => removeBinding(index)}
              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Remove binding"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}

      {bindings.length > 1 && (
        <div>
          <label className="block text-xs text-gray-500 mb-1">Separator</label>
          <input
            type="text"
            value={separator}
            onChange={(e) => onChange(bindings, e.target.value)}
            placeholder="e.g., space or comma"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            Text to separate multiple bound fields
          </p>
        </div>
      )}
    </div>
  );
}
