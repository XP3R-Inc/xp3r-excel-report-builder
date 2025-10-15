import { useState } from 'react';
import { ChevronLeft, ChevronRight, AlertCircle, Eye } from 'lucide-react';
import { DataBinding, FallbackConfig, ConditionalRule } from '../lib/types';
import { formatData } from '../utils/dataFormatter';

interface EnhancedDataBindingProps {
  dataBinding?: string;
  headers: string[];
  data: Record<string, unknown>[];
  currentRowIndex?: number;
  fallbackConfig?: FallbackConfig;
  conditionalRules?: ConditionalRule[];
  onChange: (binding?: string) => void;
  onFallbackChange?: (config: FallbackConfig) => void;
  onConditionalRulesChange?: (rules: ConditionalRule[]) => void;
  onRowChange?: (index: number) => void;
}

export function EnhancedDataBinding({
  dataBinding,
  headers,
  data,
  currentRowIndex = 0,
  fallbackConfig,
  conditionalRules = [],
  onChange,
  onFallbackChange,
  onConditionalRulesChange,
  onRowChange,
}: EnhancedDataBindingProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const currentRow = data[currentRowIndex];
  const previewValue = dataBinding && currentRow
    ? String(currentRow[dataBinding] ?? '')
    : '';

  const handlePrevRow = () => {
    if (currentRowIndex > 0) {
      onRowChange?.(currentRowIndex - 1);
    }
  };

  const handleNextRow = () => {
    if (currentRowIndex < data.length - 1) {
      onRowChange?.(currentRowIndex + 1);
    }
  };

  const isBindingValid = !dataBinding || headers.includes(dataBinding);

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Data Binding</label>
        <select
          value={dataBinding || ''}
          onChange={(e) => onChange(e.target.value || undefined)}
          className={`w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            !isBindingValid ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
        >
          <option value="">None</option>
          {headers.map((header) => (
            <option key={header} value={header}>
              {header}
            </option>
          ))}
        </select>

        {!isBindingValid && (
          <div className="mt-1 flex items-center gap-1 text-xs text-red-600">
            <AlertCircle className="w-3 h-3" />
            <span>Binding column not found in dataset</span>
          </div>
        )}
      </div>

      {dataBinding && data.length > 0 && (
        <div className="p-2 bg-gray-50 border border-gray-200 rounded">
          <div className="flex items-center justify-between mb-2">
            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
              <Eye className="w-3 h-3" />
              <span>Live Preview</span>
            </label>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevRow}
                disabled={currentRowIndex === 0}
                className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Previous row"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-gray-600 min-w-[60px] text-center">
                Row {currentRowIndex + 1} / {data.length}
              </span>
              <button
                onClick={handleNextRow}
                disabled={currentRowIndex === data.length - 1}
                className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Next row"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="px-2 py-1.5 bg-white border border-gray-300 rounded text-xs font-mono text-gray-700 min-h-[28px]">
            {previewValue || <span className="text-gray-400 italic">empty</span>}
          </div>
        </div>
      )}

      <div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Options
        </button>
      </div>

      {showAdvanced && (
        <div className="space-y-3 pt-2 border-t border-gray-200">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Empty Value Fallback
            </label>
            <select
              value={fallbackConfig?.strategy || 'placeholder'}
              onChange={(e) =>
                onFallbackChange?.({
                  ...fallbackConfig,
                  strategy: e.target.value as FallbackConfig['strategy'],
                })
              }
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            >
              <option value="placeholder">Show placeholder</option>
              <option value="hide">Hide element</option>
              <option value="default">Use default value</option>
            </select>

            {fallbackConfig?.strategy === 'placeholder' && (
              <input
                type="text"
                value={fallbackConfig.placeholderText || ''}
                onChange={(e) =>
                  onFallbackChange?.({
                    ...fallbackConfig,
                    placeholderText: e.target.value,
                  })
                }
                placeholder="Placeholder text..."
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}

            {fallbackConfig?.strategy === 'default' && (
              <input
                type="text"
                value={fallbackConfig.defaultValue || ''}
                onChange={(e) =>
                  onFallbackChange?.({
                    ...fallbackConfig,
                    defaultValue: e.target.value,
                  })
                }
                placeholder="Default value..."
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Conditional Rules
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Show/hide or change colors based on data values
            </p>
            <button
              onClick={() => {
                const newRule: ConditionalRule = {
                  id: `rule-${Date.now()}`,
                  field: headers[0] || '',
                  operator: 'not_empty',
                  action: 'show',
                };
                onConditionalRulesChange?.([...conditionalRules, newRule]);
              }}
              className="w-full px-3 py-2 text-xs border border-dashed border-gray-300 rounded hover:border-blue-500 hover:bg-blue-50 text-gray-600 hover:text-blue-600 transition-colors"
            >
              + Add Rule
            </button>

            {conditionalRules.length > 0 && (
              <div className="mt-2 space-y-2">
                {conditionalRules.map((rule, index) => (
                  <div key={rule.id} className="p-2 bg-gray-50 border border-gray-200 rounded text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-700">Rule {index + 1}</span>
                      <button
                        onClick={() => {
                          onConditionalRulesChange?.(
                            conditionalRules.filter((r) => r.id !== rule.id)
                          );
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="text-gray-600">
                      If {rule.field} {rule.operator.replace('_', ' ')}
                      {rule.value && ` "${rule.value}"`}
                      {' → '}
                      {rule.action}
                      {rule.actionValue && ` (${rule.actionValue})`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
