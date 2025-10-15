import { X } from 'lucide-react';
import { useEffect } from 'react';
import { CanvasElement } from '../lib/types';
import { formatMultipleBindings } from '../utils/dataFormatter';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  width: number;
  height: number;
  elements: CanvasElement[];
  data: Record<string, unknown>[];
  currentRowIndex: number;
  onRowChange: (index: number) => void;
}

export function PreviewModal({
  isOpen,
  onClose,
  width,
  height,
  elements,
  data,
  currentRowIndex,
  onRowChange,
}: PreviewModalProps) {
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 'Escape',
        handler: onClose,
        description: 'Close preview',
      },
      {
        key: 'ArrowLeft',
        handler: () => {
          if (currentRowIndex > 0) {
            onRowChange(currentRowIndex - 1);
          }
        },
        description: 'Previous row',
      },
      {
        key: 'ArrowRight',
        handler: () => {
          if (currentRowIndex < data.length - 1) {
            onRowChange(currentRowIndex + 1);
          }
        },
        description: 'Next row',
      },
    ],
    enabled: isOpen,
  });

  if (!isOpen) return null;

  const currentRow = data[currentRowIndex] || {};

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-800">Preview Document</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Row:</span>
              <select
                value={currentRowIndex}
                onChange={(e) => onRowChange(Number(e.target.value))}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {data.map((_, index) => (
                  <option key={index} value={index}>
                    {index + 1}
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-600">of {data.length}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-8 bg-gray-100">
          <div
            className="bg-white shadow-2xl mx-auto relative"
            style={{ width: `${width}px`, height: `${height}px` }}
          >
            {elements.filter(el => !el.hidden).map((element) => {
              const getBorderRadius = () => {
                if (element.style?.borderTopLeftRadius !== undefined ||
                    element.style?.borderTopRightRadius !== undefined ||
                    element.style?.borderBottomLeftRadius !== undefined ||
                    element.style?.borderBottomRightRadius !== undefined) {
                  return `${element.style?.borderTopLeftRadius ?? element.style?.borderRadius ?? 0}px ${element.style?.borderTopRightRadius ?? element.style?.borderRadius ?? 0}px ${element.style?.borderBottomRightRadius ?? element.style?.borderRadius ?? 0}px ${element.style?.borderBottomLeftRadius ?? element.style?.borderRadius ?? 0}px`;
                }
                return `${element.style?.borderRadius || 0}px`;
              };

              return (
              <div
                key={element.id}
                className="absolute"
                style={{
                  left: `${element.x}px`,
                  top: `${element.y}px`,
                  width: `${element.width}px`,
                  height: `${element.height}px`,
                  transform: `rotate(${element.rotation || 0}deg)`,
                  opacity: element.style?.opacity ?? 1,
                  borderRadius: getBorderRadius(),
                  boxShadow: element.style?.boxShadow,
                }}
              >
                {element.type === 'text' && (
                  <div
                    className="w-full h-full overflow-hidden"
                    style={{
                      display: 'flex',
                      alignItems: element.style?.verticalAlign === 'top' ? 'flex-start' : element.style?.verticalAlign === 'bottom' ? 'flex-end' : 'center',
                      backgroundColor: element.style?.backgroundColor || 'transparent',
                      padding: `${element.style?.padding || 0}px`,
                      borderWidth: `${element.style?.borderWidth || 0}px`,
                      borderColor: element.style?.borderColor || '#000000',
                      borderStyle: (element.style?.borderStyle as any) || 'solid',
                    }}
                  >
                    <div
                      className="w-full"
                      style={{
                        fontSize: `${element.style?.fontSize || 16}px`,
                        fontFamily: element.style?.fontFamily || 'Arial',
                        fontWeight: element.style?.fontWeight || 'normal',
                        fontStyle: element.style?.fontStyle || 'normal',
                        textDecoration: element.style?.textDecoration || 'none',
                        lineHeight: element.style?.lineHeight || 1.5,
                        letterSpacing: `${element.style?.letterSpacing || 0}px`,
                        color: element.style?.color || '#000000',
                        textAlign: (element.style?.textAlign as any) || 'left',
                      }}
                    >
                      {element.dataBindings && element.dataBindings.length > 0
                        ? formatMultipleBindings(currentRow, element.dataBindings, element.bindingSeparator || ' ')
                        : element.dataBinding && currentRow[element.dataBinding]
                        ? element.isList
                          ? (() => {
                              const items = String(currentRow[element.dataBinding]).split(element.listDelimiter || ',');
                              const layout = element.listLayout || 'vertical';
                              const style = element.listStyle || 'none';

                              if (layout === 'horizontal') {
                                return (
                                  <div className="flex flex-wrap gap-2">
                                    {items.map((item, idx) => (
                                      <span key={idx}>
                                        {style === 'bullets' && '• '}
                                        {style === 'numbers' && `${idx + 1}. `}
                                        {item.trim()}
                                      </span>
                                    ))}
                                  </div>
                                );
                              }

                              return items.map((item, idx) => (
                                <div key={idx}>
                                  {style === 'bullets' && '• '}
                                  {style === 'numbers' && `${idx + 1}. `}
                                  {item.trim()}
                                </div>
                              ));
                            })()
                          : String(currentRow[element.dataBinding])
                        : element.content}
                    </div>
                  </div>
                )}

                {element.type === 'shape' && (
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundColor: element.style?.backgroundColor || '#e5e7eb',
                      borderWidth: `${element.style?.borderWidth || 0}px`,
                      borderColor: element.style?.borderColor || '#000000',
                      borderStyle: (element.style?.borderStyle as any) || 'solid',
                      borderRadius: getBorderRadius(),
                    }}
                  />
                )}

                {element.type === 'image' && element.imageUrl && (
                  <img
                    src={element.imageUrl}
                    alt="Canvas element"
                    className="w-full h-full object-cover"
                    style={{
                      borderWidth: `${element.style?.borderWidth || 0}px`,
                      borderColor: element.style?.borderColor || '#000000',
                      borderStyle: (element.style?.borderStyle as any) || 'solid',
                    }}
                  />
                )}
              </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
