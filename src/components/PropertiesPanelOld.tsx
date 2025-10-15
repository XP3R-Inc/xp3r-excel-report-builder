import { Trash2, Lock, Unlock, AlertTriangle } from 'lucide-react';
import { CanvasElement, DataBinding } from '../lib/types';
import { DataBindingConfig } from './DataBindingConfig';
import { findMaxDataLength } from '../utils/textOverflow';

interface PropertiesPanelProps {
  element: CanvasElement;
  headers: string[];
  data: Record<string, unknown>[];
  onUpdate: (updates: Partial<CanvasElement>) => void;
  onDelete: () => void;
}

export function PropertiesPanel({ element, headers, data, onUpdate, onDelete }: PropertiesPanelProps) {
  const overflowInfo = element.type === 'text' && (element.dataBinding || element.dataBindings)
    ? findMaxDataLength(element, data)
    : null;
  return (
    <div className="border-t pt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Properties</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onUpdate({ locked: !element.locked })}
            className={`p-1.5 rounded transition-colors ${
              element.locked ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-100'
            }`}
            title={element.locked ? 'Unlock' : 'Lock'}
          >
            {element.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
        {overflowInfo && overflowInfo.willOverflow && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <p className="font-semibold text-amber-900 mb-1">Text Overflow Warning</p>
                <p className="text-amber-700">
                  Row {overflowInfo.maxRow + 1} has {overflowInfo.maxLength} characters and may overflow.
                  Consider increasing field size or reducing font size.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">X Position</label>
            <input
              type="number"
              value={Math.round(element.x)}
              onChange={(e) => onUpdate({ x: Number(e.target.value) })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Y Position</label>
            <input
              type="number"
              value={Math.round(element.y)}
              onChange={(e) => onUpdate({ y: Number(e.target.value) })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Width</label>
            <input
              type="number"
              value={Math.round(element.width)}
              onChange={(e) => onUpdate({ width: Number(e.target.value) })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Height</label>
            <input
              type="number"
              value={Math.round(element.height)}
              onChange={(e) => onUpdate({ height: Number(e.target.value) })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Rotation</label>
          <input
            type="number"
            value={element.rotation || 0}
            onChange={(e) => onUpdate({ rotation: Number(e.target.value) })}
            min="0"
            max="360"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Opacity</label>
          <input
            type="range"
            value={(element.style?.opacity ?? 1) * 100}
            onChange={(e) =>
              onUpdate({
                style: { ...element.style, opacity: Number(e.target.value) / 100 },
              })
            }
            min="0"
            max="100"
            className="w-full"
          />
          <div className="text-xs text-gray-500 text-right">{Math.round((element.style?.opacity ?? 1) * 100)}%</div>
        </div>

        {element.type === 'text' && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Content</label>
              <textarea
                value={element.content || ''}
                onChange={(e) => onUpdate({ content: e.target.value })}
                rows={3}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Data Binding</label>
              <select
                value={element.dataBinding || ''}
                onChange={(e) => onUpdate({ dataBinding: e.target.value || undefined })}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">None</option>
                {headers.map((header) => (
                  <option key={header} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </div>

            <div className="border-t pt-3 mt-3">
              <DataBindingConfig
                bindings={element.dataBindings || []}
                separator={element.bindingSeparator || ' '}
                headers={headers}
                onChange={(bindings, separator) => {
                  onUpdate({
                    dataBindings: bindings.length > 0 ? bindings : undefined,
                    bindingSeparator: separator,
                  });
                }}
              />
            </div>

            <div className="border-t pt-3 mt-3">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-2">
                <input
                  type="checkbox"
                  checked={element.isList || false}
                  onChange={(e) => onUpdate({ isList: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span>Treat as List</span>
              </label>
              {element.isList && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Delimiter</label>
                    <input
                      type="text"
                      value={element.listDelimiter || ','}
                      onChange={(e) => onUpdate({ listDelimiter: e.target.value })}
                      placeholder="e.g., , or | or ;"
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Split data by this delimiter
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Layout</label>
                      <select
                        value={element.listLayout || 'vertical'}
                        onChange={(e) => onUpdate({ listLayout: e.target.value as 'vertical' | 'horizontal' })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="vertical">Vertical</option>
                        <option value="horizontal">Horizontal</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Style</label>
                      <select
                        value={element.listStyle || 'none'}
                        onChange={(e) => onUpdate({ listStyle: e.target.value as 'none' | 'bullets' | 'numbers' })}
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="none">None</option>
                        <option value="bullets">Bullets</option>
                        <option value="numbers">Numbers</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Font Size</label>
                <input
                  type="number"
                  value={element.style?.fontSize || 16}
                  onChange={(e) =>
                    onUpdate({
                      style: { ...element.style, fontSize: Number(e.target.value) },
                    })
                  }
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Line Height</label>
                <input
                  type="number"
                  step="0.1"
                  value={element.style?.lineHeight || 1.5}
                  onChange={(e) =>
                    onUpdate({
                      style: { ...element.style, lineHeight: Number(e.target.value) },
                    })
                  }
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Font Family</label>
              <select
                value={element.style?.fontFamily || 'Arial'}
                onChange={(e) =>
                  onUpdate({
                    style: { ...element.style, fontFamily: e.target.value },
                  })
                }
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Georgia">Georgia</option>
                <option value="Courier New">Courier New</option>
                <option value="Verdana">Verdana</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Font Weight</label>
                <select
                  value={element.style?.fontWeight || 'normal'}
                  onChange={(e) =>
                    onUpdate({
                      style: { ...element.style, fontWeight: e.target.value },
                    })
                  }
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="normal">Normal</option>
                  <option value="bold">Bold</option>
                  <option value="lighter">Lighter</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Font Style</label>
                <select
                  value={element.style?.fontStyle || 'normal'}
                  onChange={(e) =>
                    onUpdate({
                      style: { ...element.style, fontStyle: e.target.value },
                    })
                  }
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="normal">Normal</option>
                  <option value="italic">Italic</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Text Decoration</label>
              <select
                value={element.style?.textDecoration || 'none'}
                onChange={(e) =>
                  onUpdate({
                    style: { ...element.style, textDecoration: e.target.value },
                  })
                }
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="none">None</option>
                <option value="underline">Underline</option>
                <option value="line-through">Strikethrough</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Horizontal Align</label>
              <div className="grid grid-cols-3 gap-1">
                {['left', 'center', 'right'].map((align) => (
                  <button
                    key={align}
                    onClick={() =>
                      onUpdate({
                        style: { ...element.style, textAlign: align },
                      })
                    }
                    className={`px-2 py-1.5 text-xs rounded transition-colors ${
                      (element.style?.textAlign || 'left') === align
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {align.charAt(0).toUpperCase() + align.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Vertical Align</label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { value: 'top', label: 'Top' },
                  { value: 'middle', label: 'Middle' },
                  { value: 'bottom', label: 'Bottom' }
                ].map((align) => (
                  <button
                    key={align.value}
                    onClick={() =>
                      onUpdate({
                        style: { ...element.style, verticalAlign: align.value },
                      })
                    }
                    className={`px-2 py-1.5 text-xs rounded transition-colors ${
                      (element.style?.verticalAlign || 'middle') === align.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {align.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Text Color</label>
              <input
                type="color"
                value={element.style?.color || '#000000'}
                onChange={(e) =>
                  onUpdate({
                    style: { ...element.style, color: e.target.value },
                  })
                }
                className="w-full h-8 border border-gray-300 rounded cursor-pointer"
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Background Color</label>
          <input
            type="color"
            value={element.style?.backgroundColor || '#ffffff'}
            onChange={(e) =>
              onUpdate({
                style: { ...element.style, backgroundColor: e.target.value },
              })
            }
            className="w-full h-8 border border-gray-300 rounded cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Border Width</label>
          <input
            type="number"
            value={element.style?.borderWidth || 0}
            onChange={(e) =>
              onUpdate({
                style: { ...element.style, borderWidth: Number(e.target.value) },
              })
            }
            min="0"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Border Color</label>
          <input
            type="color"
            value={element.style?.borderColor || '#000000'}
            onChange={(e) =>
              onUpdate({
                style: { ...element.style, borderColor: e.target.value },
              })
            }
            className="w-full h-8 border border-gray-300 rounded cursor-pointer"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Border Style</label>
          <select
            value={element.style?.borderStyle || 'solid'}
            onChange={(e) =>
              onUpdate({
                style: { ...element.style, borderStyle: e.target.value },
              })
            }
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
            <option value="double">Double</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Border Radius (All)</label>
          <input
            type="number"
            value={element.style?.borderRadius || 0}
            onChange={(e) => {
              const value = Number(e.target.value);
              onUpdate({
                style: {
                  ...element.style,
                  borderRadius: value,
                  borderTopLeftRadius: value,
                  borderTopRightRadius: value,
                  borderBottomLeftRadius: value,
                  borderBottomRightRadius: value,
                },
              });
            }}
            min="0"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Individual Corners</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Top Left</label>
              <input
                type="number"
                value={element.style?.borderTopLeftRadius ?? element.style?.borderRadius ?? 0}
                onChange={(e) =>
                  onUpdate({
                    style: { ...element.style, borderTopLeftRadius: Number(e.target.value) },
                  })
                }
                min="0"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Top Right</label>
              <input
                type="number"
                value={element.style?.borderTopRightRadius ?? element.style?.borderRadius ?? 0}
                onChange={(e) =>
                  onUpdate({
                    style: { ...element.style, borderTopRightRadius: Number(e.target.value) },
                  })
                }
                min="0"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Bottom Left</label>
              <input
                type="number"
                value={element.style?.borderBottomLeftRadius ?? element.style?.borderRadius ?? 0}
                onChange={(e) =>
                  onUpdate({
                    style: { ...element.style, borderBottomLeftRadius: Number(e.target.value) },
                  })
                }
                min="0"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Bottom Right</label>
              <input
                type="number"
                value={element.style?.borderBottomRightRadius ?? element.style?.borderRadius ?? 0}
                onChange={(e) =>
                  onUpdate({
                    style: { ...element.style, borderBottomRightRadius: Number(e.target.value) },
                  })
                }
                min="0"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Padding</label>
          <input
            type="number"
            value={element.style?.padding || 0}
            onChange={(e) =>
              onUpdate({
                style: { ...element.style, padding: Number(e.target.value) },
              })
            }
            min="0"
            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!element.style?.boxShadow}
              onChange={(e) =>
                onUpdate({
                  style: {
                    ...element.style,
                    boxShadow: e.target.checked ? '0 4px 6px rgba(0, 0, 0, 0.1)' : undefined,
                  },
                })
              }
              className="rounded"
            />
            <span className="text-xs font-medium text-gray-600">Drop Shadow</span>
          </label>
        </div>
      </div>
    </div>
  );
}
