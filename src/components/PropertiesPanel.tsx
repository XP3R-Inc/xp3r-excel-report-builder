import { useState, useMemo } from 'react';
import {
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Move,
  Type,
  Palette,
  Sparkles,
  Database,
  List,
  Maximize2,
  Shield,
  FileDown,
  Copy,
} from 'lucide-react';
import { CanvasElement, StylePreset } from '../lib/types';
import { AccordionSection } from './AccordionSection';
import { PropertySearch } from './PropertySearch';
import { ScrubbableInput } from './ScrubbableInput';
import { LinkedInputs, UniformControl } from './LinkedInputs';
import { ColorPicker } from './ColorPicker';
import { PresetSelector } from './PresetSelector';
import { EnhancedDataBinding } from './EnhancedDataBinding';
import { DataBindingConfig } from './DataBindingConfig';
import { OverflowControls } from './OverflowControls';
import { ConstraintsControl } from './ConstraintsControl';
import { ContrastChecker } from './ContrastChecker';
import { loadUserPreferences, updatePanelPreferences } from '../lib/designTokens';

interface PropertiesPanelProps {
  element: CanvasElement;
  headers: string[];
  data: Record<string, unknown>[];
  onUpdate: (updates: Partial<CanvasElement>) => void;
  onDelete: () => void;
  pageWidth?: number;
  pageHeight?: number;
}

export function PropertiesPanel({
  element,
  headers,
  data,
  onUpdate,
  onDelete,
  pageWidth,
  pageHeight,
}: PropertiesPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentDataRow, setCurrentDataRow] = useState(0);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    const prefs = loadUserPreferences();
    const defaultSections = prefs.panelPreferences.perElementType[element.type] || [];
    return Object.fromEntries(defaultSections.map((s) => [s, true]));
  });

  const [aspectRatioLinked, setAspectRatioLinked] = useState(true);
  const [borderRadiusLinked, setBorderRadiusLinked] = useState(true);
  const [paddingLinked, setPaddingLinked] = useState(true);

  const handleSectionToggle = (sectionId: string, expanded: boolean) => {
    const newExpanded = { ...expandedSections, [sectionId]: expanded };
    setExpandedSections(newExpanded);
    updatePanelPreferences(newExpanded);
  };

  const searchableContent = useMemo(() => {
    const content: Record<string, string[]> = {
      'position-size': ['position', 'size', 'x', 'y', 'width', 'height', 'rotation', 'rotate'],
      typography: [
        'font',
        'text',
        'size',
        'family',
        'weight',
        'style',
        'italic',
        'bold',
        'line',
        'height',
        'align',
        'color',
        'decoration',
        'underline',
      ],
      'fill-stroke': [
        'fill',
        'background',
        'color',
        'border',
        'stroke',
        'width',
        'radius',
        'corner',
        'padding',
      ],
      effects: ['shadow', 'opacity', 'blur', 'glow', 'effect'],
      data: ['binding', 'data', 'field', 'column', 'format', 'fallback'],
      lists: ['list', 'delimiter', 'layout', 'bullets', 'numbers'],
      constraints: ['pin', 'anchor', 'center', 'position', 'align', 'snap'],
      accessibility: ['contrast', 'alt', 'wcag', 'accessible'],
      overflow: ['overflow', 'wrap', 'truncate', 'shrink', 'fit'],
    };
    return content;
  }, []);

  const getSectionRelevance = (sectionId: string): boolean => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const keywords = searchableContent[sectionId] || [];
    return keywords.some((keyword) => keyword.includes(query) || query.includes(keyword));
  };

  const highlightSection = (sectionId: string): boolean => {
    return searchQuery !== '' && getSectionRelevance(sectionId);
  };

  const handleApplyPreset = (preset: StylePreset) => {
    onUpdate({ style: { ...element.style, ...preset.style } });
  };

  const handleCopyStyle = () => {
    localStorage.setItem('copied_style', JSON.stringify(element.style));
  };

  const handlePasteStyle = () => {
    const copied = localStorage.getItem('copied_style');
    if (copied) {
      try {
        const style = JSON.parse(copied);
        onUpdate({ style: { ...element.style, ...style } });
      } catch (e) {
        console.error('Failed to paste style');
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 sticky top-0 bg-white z-10 border-b border-gray-200 pb-3">
        <div className="flex items-center justify-between mb-3 pt-4 px-3">
          <h3 className="text-sm font-semibold text-gray-700">Properties</h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onUpdate({ hidden: !element.hidden })}
              className={`p-1.5 rounded transition-colors ${
                element.hidden ? 'text-amber-600 bg-amber-50' : 'text-gray-600 hover:bg-gray-100'
              }`}
              title={element.hidden ? 'Show' : 'Hide'}
            >
              {element.hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
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

        <div className="px-3">
          <PropertySearch
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3" style={{ scrollBehavior: 'auto' }}>
        <AccordionSection
          title="Position & Size"
          icon={<Move className="w-4 h-4" />}
          defaultExpanded={expandedSections['position-size']}
          onToggle={(expanded) => handleSectionToggle('position-size', expanded)}
          highlight={highlightSection('position-size')}
        >
          <div className="grid grid-cols-2 gap-2">
            <ScrubbableInput
              label="X Position"
              value={element.x}
              onChange={(x) => onUpdate({ x })}
              unit="px"
            />
            <ScrubbableInput
              label="Y Position"
              value={element.y}
              onChange={(y) => onUpdate({ y })}
              unit="px"
            />
          </div>

          <LinkedInputs
            label1="Width"
            label2="Height"
            value1={element.width}
            value2={element.height}
            onChange1={(width) => onUpdate({ width })}
            onChange2={(height) => onUpdate({ height })}
            linked={aspectRatioLinked}
            onLinkToggle={setAspectRatioLinked}
            unit="px"
            min={1}
          />

          <ScrubbableInput
            label="Rotation"
            value={element.rotation || 0}
            onChange={(rotation) => onUpdate({ rotation })}
            min={0}
            max={360}
            unit="°"
          />

          <ScrubbableInput
            label="Opacity"
            value={(element.style?.opacity ?? 1) * 100}
            onChange={(opacity) =>
              onUpdate({ style: { ...element.style, opacity: opacity / 100 } })
            }
            min={0}
            max={100}
            unit="%"
          />
        </AccordionSection>

        {element.type === 'text' && (
          <AccordionSection
            title="Typography"
            icon={<Type className="w-4 h-4" />}
            defaultExpanded={expandedSections['typography']}
            onToggle={(expanded) => handleSectionToggle('typography', expanded)}
            highlight={highlightSection('typography')}
          >
            <PresetSelector category="text" onApply={handleApplyPreset} currentStyle={element.style} />

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Content</label>
              <textarea
                value={element.content || ''}
                onChange={(e) => onUpdate({ content: e.target.value })}
                onFocus={(e) => {
                  e.target.scrollIntoView = () => {};
                }}
                rows={3}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <ScrubbableInput
                label="Font Size"
                value={element.style?.fontSize || 16}
                onChange={(fontSize) =>
                  onUpdate({ style: { ...element.style, fontSize } })
                }
                min={6}
                max={200}
                unit="px"
              />
              <ScrubbableInput
                label="Line Height"
                value={element.style?.lineHeight || 1.5}
                onChange={(lineHeight) =>
                  onUpdate({ style: { ...element.style, lineHeight } })
                }
                min={0.5}
                max={5}
                step={0.1}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Font Family</label>
              <select
                value={element.style?.fontFamily || 'Arial'}
                onChange={(e) =>
                  onUpdate({ style: { ...element.style, fontFamily: e.target.value } })
                }
                onFocus={(e) => {
                  e.target.scrollIntoView = () => {};
                }}
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
                <label className="block text-xs font-medium text-gray-600 mb-1">Weight</label>
                <select
                  value={element.style?.fontWeight || 'normal'}
                  onChange={(e) =>
                    onUpdate({ style: { ...element.style, fontWeight: e.target.value } })
                  }
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="normal">Normal</option>
                  <option value="600">Semibold</option>
                  <option value="bold">Bold</option>
                  <option value="lighter">Lighter</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Style</label>
                <select
                  value={element.style?.fontStyle || 'normal'}
                  onChange={(e) =>
                    onUpdate({ style: { ...element.style, fontStyle: e.target.value } })
                  }
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="normal">Normal</option>
                  <option value="italic">Italic</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Decoration</label>
              <select
                value={element.style?.textDecoration || 'none'}
                onChange={(e) =>
                  onUpdate({ style: { ...element.style, textDecoration: e.target.value } })
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
                      onUpdate({ style: { ...element.style, textAlign: align } })
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
                  { value: 'bottom', label: 'Bottom' },
                ].map((align) => (
                  <button
                    key={align.value}
                    onClick={() =>
                      onUpdate({ style: { ...element.style, verticalAlign: align.value } })
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

            <ColorPicker
              label="Text Color"
              value={element.style?.color || '#000000'}
              onChange={(color) => onUpdate({ style: { ...element.style, color } })}
            />
          </AccordionSection>
        )}

        <AccordionSection
          title="Fill & Stroke"
          icon={<Palette className="w-4 h-4" />}
          defaultExpanded={expandedSections['fill-stroke']}
          onToggle={(expanded) => handleSectionToggle('fill-stroke', expanded)}
          highlight={highlightSection('fill-stroke')}
        >
          {element.type === 'shape' && (
            <PresetSelector category="shape" onApply={handleApplyPreset} currentStyle={element.style} />
          )}

          <ColorPicker
            label="Background Color"
            value={element.style?.backgroundColor || '#ffffff'}
            onChange={(backgroundColor) =>
              onUpdate({ style: { ...element.style, backgroundColor } })
            }
          />

          <ScrubbableInput
            label="Border Width"
            value={element.style?.borderWidth || 0}
            onChange={(borderWidth) =>
              onUpdate({ style: { ...element.style, borderWidth } })
            }
            min={0}
            unit="px"
          />

          <ColorPicker
            label="Border Color"
            value={element.style?.borderColor || '#000000'}
            onChange={(borderColor) =>
              onUpdate({ style: { ...element.style, borderColor } })
            }
          />

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Border Style</label>
            <select
              value={element.style?.borderStyle || 'solid'}
              onChange={(e) =>
                onUpdate({ style: { ...element.style, borderStyle: e.target.value } })
              }
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="solid">Solid</option>
              <option value="dashed">Dashed</option>
              <option value="dotted">Dotted</option>
              <option value="double">Double</option>
            </select>
          </div>

          <UniformControl
            values={[
              element.style?.borderTopLeftRadius ?? element.style?.borderRadius ?? 0,
              element.style?.borderTopRightRadius ?? element.style?.borderRadius ?? 0,
              element.style?.borderBottomLeftRadius ?? element.style?.borderRadius ?? 0,
              element.style?.borderBottomRightRadius ?? element.style?.borderRadius ?? 0,
            ]}
            labels={['Top Left', 'Top Right', 'Bottom Left', 'Bottom Right']}
            onChange={([tl, tr, bl, br]) =>
              onUpdate({
                style: {
                  ...element.style,
                  borderRadius: tl,
                  borderTopLeftRadius: tl,
                  borderTopRightRadius: tr,
                  borderBottomLeftRadius: bl,
                  borderBottomRightRadius: br,
                },
              })
            }
            linked={borderRadiusLinked}
            onLinkToggle={setBorderRadiusLinked}
            uniformLabel="Border Radius"
            unit="px"
            min={0}
          />

          <UniformControl
            values={[
              element.style?.paddingTop ?? element.style?.padding ?? 0,
              element.style?.paddingRight ?? element.style?.padding ?? 0,
              element.style?.paddingBottom ?? element.style?.padding ?? 0,
              element.style?.paddingLeft ?? element.style?.padding ?? 0,
            ]}
            labels={['Top', 'Right', 'Bottom', 'Left']}
            onChange={([t, r, b, l]) =>
              onUpdate({
                style: {
                  ...element.style,
                  padding: t,
                  paddingTop: t,
                  paddingRight: r,
                  paddingBottom: b,
                  paddingLeft: l,
                },
              })
            }
            linked={paddingLinked}
            onLinkToggle={setPaddingLinked}
            uniformLabel="Padding"
            unit="px"
            min={0}
          />
        </AccordionSection>

        <AccordionSection
          title="Effects"
          icon={<Sparkles className="w-4 h-4" />}
          defaultExpanded={expandedSections['effects']}
          onToggle={(expanded) => handleSectionToggle('effects', expanded)}
          highlight={highlightSection('effects')}
        >
          <PresetSelector category="effect" onApply={handleApplyPreset} currentStyle={element.style} />

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!element.style?.boxShadow}
                onChange={(e) =>
                  onUpdate({
                    style: {
                      ...element.style,
                      boxShadow: e.target.checked
                        ? '0 4px 6px rgba(0, 0, 0, 0.1)'
                        : undefined,
                    },
                  })
                }
                className="rounded"
              />
              <span className="text-xs font-medium text-gray-600">Drop Shadow</span>
            </label>
          </div>

          {element.style?.boxShadow && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Shadow Preset</label>
              <select
                value={element.style.boxShadow}
                onChange={(e) =>
                  onUpdate({ style: { ...element.style, boxShadow: e.target.value } })
                }
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="0 1px 2px rgba(0, 0, 0, 0.05)">Subtle</option>
                <option value="0 4px 6px rgba(0, 0, 0, 0.1)">Soft</option>
                <option value="0 10px 15px rgba(0, 0, 0, 0.1)">Medium</option>
                <option value="0 20px 25px rgba(0, 0, 0, 0.15)">Strong</option>
                <option value="0 0 15px rgba(59, 130, 246, 0.3)">Glow</option>
              </select>
            </div>
          )}
        </AccordionSection>

        {element.type === 'text' && headers.length > 0 && (
          <>
            <AccordionSection
              title="Data Binding"
              icon={<Database className="w-4 h-4" />}
              defaultExpanded={expandedSections['data']}
              onToggle={(expanded) => handleSectionToggle('data', expanded)}
              highlight={highlightSection('data')}
              badge={element.dataBinding ? '1' : element.dataBindings?.length || undefined}
            >
              <EnhancedDataBinding
                dataBinding={element.dataBinding}
                headers={headers}
                data={data}
                currentRowIndex={currentDataRow}
                fallbackConfig={element.fallbackConfig}
                conditionalRules={element.conditionalRules}
                onChange={(binding) => onUpdate({ dataBinding: binding })}
                onFallbackChange={(config) => onUpdate({ fallbackConfig: config })}
                onConditionalRulesChange={(rules) => onUpdate({ conditionalRules: rules })}
                onRowChange={setCurrentDataRow}
              />

              <div className="border-t pt-3 mt-3">
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Multiple Fields
                </label>
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
            </AccordionSection>

            <AccordionSection
              title="Text Overflow"
              icon={<Maximize2 className="w-4 h-4" />}
              defaultExpanded={expandedSections['overflow']}
              onToggle={(expanded) => handleSectionToggle('overflow', expanded)}
              highlight={highlightSection('overflow')}
            >
              <OverflowControls element={element} data={data} onUpdate={onUpdate} />
            </AccordionSection>

            <AccordionSection
              title="Lists"
              icon={<List className="w-4 h-4" />}
              defaultExpanded={expandedSections['lists']}
              onToggle={(expanded) => handleSectionToggle('lists', expanded)}
              highlight={highlightSection('lists')}
            >
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
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Layout</label>
                      <select
                        value={element.listLayout || 'vertical'}
                        onChange={(e) =>
                          onUpdate({
                            listLayout: e.target.value as 'vertical' | 'horizontal',
                          })
                        }
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
                        onChange={(e) =>
                          onUpdate({
                            listStyle: e.target.value as 'none' | 'bullets' | 'numbers',
                          })
                        }
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
            </AccordionSection>
          </>
        )}

        <AccordionSection
          title="Alignment & Constraints"
          icon={<Move className="w-4 h-4" />}
          defaultExpanded={expandedSections['constraints']}
          onToggle={(expanded) => handleSectionToggle('constraints', expanded)}
          highlight={highlightSection('constraints')}
        >
          <ConstraintsControl
            element={element}
            onUpdate={onUpdate}
            pageWidth={pageWidth}
            pageHeight={pageHeight}
          />
        </AccordionSection>

        {element.type === 'text' && (
          <AccordionSection
            title="Accessibility"
            icon={<Shield className="w-4 h-4" />}
            defaultExpanded={expandedSections['accessibility']}
            onToggle={(expanded) => handleSectionToggle('accessibility', expanded)}
            highlight={highlightSection('accessibility')}
          >
            <ContrastChecker
              textColor={element.style?.color || '#000000'}
              backgroundColor={element.style?.backgroundColor || '#ffffff'}
              fontSize={element.style?.fontSize}
              fontWeight={element.style?.fontWeight}
              onSuggestFix={(color) =>
                onUpdate({ style: { ...element.style, color } })
              }
            />
          </AccordionSection>
        )}

        {element.type === 'image' && (
          <AccordionSection
            title="Image"
            icon={<FileDown className="w-4 h-4" />}
            defaultExpanded={expandedSections['image']}
            onToggle={(expanded) => handleSectionToggle('image', expanded)}
          >
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fit Mode</label>
              <select
                value={element.imageFitMode || 'fill'}
                onChange={(e) =>
                  onUpdate({ imageFitMode: e.target.value as CanvasElement['imageFitMode'] })
                }
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="fill">Fill</option>
                <option value="fit">Fit</option>
                <option value="crop">Crop</option>
                <option value="tile">Tile</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Alt Text</label>
              <input
                type="text"
                value={element.altText || ''}
                onChange={(e) => onUpdate({ altText: e.target.value })}
                placeholder="Describe this image..."
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                For accessibility and documentation
              </p>
            </div>
          </AccordionSection>
        )}
      </div>

      <div className="flex-shrink-0 sticky bottom-0 bg-white border-t border-gray-200 p-3">
        <div className="flex gap-2">
          <button
            onClick={handleCopyStyle}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            title="Copy style"
          >
            <Copy className="w-4 h-4" />
            <span>Copy Style</span>
          </button>
          <button
            onClick={handlePasteStyle}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            title="Paste style"
          >
            <Copy className="w-4 h-4" />
            <span>Paste Style</span>
          </button>
        </div>
      </div>
    </div>
  );
}
