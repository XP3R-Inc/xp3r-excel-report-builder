import {
  Eye, EyeOff, Lock, Unlock, ChevronDown, ChevronRight, Layers, FolderMinus,
  Edit2, Check, X, Copy, Trash2, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown,
  Type, Square, Image as ImageIcon, Database, Search, Filter, ChevronsDownUp, ChevronsUpDown,
  DollarSign, Calendar, Hash, Percent, List, AlertCircle
} from 'lucide-react';
import { CanvasElement, ElementGroup } from '../lib/types';
import { useState, useEffect } from 'react';
import { storage } from '../lib/storage';

interface LayersPanelProps {
  elements: CanvasElement[];
  groups: ElementGroup[];
  selectedIds: string[];
  onSelectElement: (id: string, multi: boolean) => void;
  onToggleLock: (id: string) => void;
  onToggleVisibility?: (id: string) => void;
  onRenameElement?: (id: string, newName: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onGroupToggle: (groupId: string) => void;
  onCreateGroup: () => void;
  onUngroup: () => void;
  onRenameGroup: (groupId: string, newName: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onBringForward: (id: string) => void;
  onSendBackward: (id: string) => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
  onHoverElement?: (id: string | null) => void;
}

type FilterType = 'all' | 'text' | 'shape' | 'image' | 'bound' | 'unbound';

export function LayersPanel({
  elements,
  groups,
  selectedIds,
  onSelectElement,
  onToggleLock,
  onToggleVisibility,
  onRenameElement,
  onGroupToggle,
  onCreateGroup,
  onUngroup,
  onRenameGroup,
  onDuplicate,
  onDelete,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  onHoverElement,
}: LayersPanelProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; elementId: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const prefs = await storage.getLayerPanelPreferences();
        if (prefs) {
          setExpandedGroups(new Set(prefs.expandedGroups));
          setFilterType(prefs.filterType);
        }
      } catch (error) {
        console.error('Failed to load layer panel preferences:', error);
      }
    };
    loadPreferences();
  }, []);

  useEffect(() => {
    const savePreferences = async () => {
      try {
        await storage.saveLayerPanelPreferences({
          id: 'default',
          expandedGroups: Array.from(expandedGroups),
          panelWidth: 256,
          showHiddenElements: false,
          filterType,
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Failed to save layer panel preferences:', error);
      }
    };

    const timeoutId = setTimeout(savePreferences, 500);
    return () => clearTimeout(timeoutId);
  }, [expandedGroups, filterType]);

  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const collapseAll = () => {
    setExpandedGroups(new Set());
  };

  const expandAll = () => {
    setExpandedGroups(new Set(groups.map(g => g.id)));
  };

  const selectAll = () => {
    onSelectElement('', false);
    elements.forEach(el => onSelectElement(el.id, true));
  };

  const deselectAll = () => {
    onSelectElement('', false);
  };

  const filterElements = (els: CanvasElement[]) => {
    let filtered = els;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(el => {
        const name = getElementDisplayName(el).toLowerCase();
        const hasBinding = el.dataBinding?.toLowerCase().includes(query) ||
                          el.dataBindings?.some(b => b.field.toLowerCase().includes(query));
        return name.includes(query) || hasBinding;
      });
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(el => {
        switch (filterType) {
          case 'text':
            return el.type === 'text';
          case 'shape':
            return el.type === 'shape';
          case 'image':
            return el.type === 'image';
          case 'bound':
            return !!(el.dataBinding || (el.dataBindings && el.dataBindings.length > 0));
          case 'unbound':
            return !el.dataBinding && (!el.dataBindings || el.dataBindings.length === 0);
          default:
            return true;
        }
      });
    }

    return filtered;
  };

  const sortedElements = [...elements].sort((a, b) => (b.layerIndex || 0) - (a.layerIndex || 0));
  const filteredElements = filterElements(sortedElements);

  const groupedElements = new Map<string, CanvasElement[]>();
  const ungroupedElements: CanvasElement[] = [];

  filteredElements.forEach(el => {
    if (el.groupId) {
      if (!groupedElements.has(el.groupId)) {
        groupedElements.set(el.groupId, []);
      }
      groupedElements.get(el.groupId)!.push(el);
    } else {
      ungroupedElements.push(el);
    }
  });

  const canGroup = selectedIds.length > 1;
  const hasGroupedElements = selectedIds.some(id => {
    const el = elements.find(e => e.id === id);
    return el?.groupId !== undefined;
  });

  return (
    <div
      className="w-64 bg-white border-l border-gray-200 flex flex-col h-[calc(100vh-0px)] min-h-0"
      onWheel={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      style={{ touchAction: 'auto' }}
    >
      <div className="px-4 py-3 border-b border-gray-200 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Layers
          </h3>
          <div className="flex items-center gap-1">
            {expandedGroups.size === 0 && groups.length > 0 && (
              <button
                onClick={expandAll}
                className="p-1 hover:bg-gray-100 rounded text-gray-600"
                title="Expand All Groups"
              >
                <ChevronsDownUp className="w-3.5 h-3.5" />
              </button>
            )}
            {expandedGroups.size > 0 && (
              <button
                onClick={collapseAll}
                className="p-1 hover:bg-gray-100 rounded text-gray-600"
                title="Collapse All Groups"
              >
                <ChevronsUpDown className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search layers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-8 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute right-1 top-1/2 -translate-y-1/2">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`p-1 hover:bg-gray-100 rounded ${filterType !== 'all' ? 'text-blue-600' : 'text-gray-400'}`}
              title="Filter"
            >
              <Filter className="w-3.5 h-3.5" />
            </button>
          </div>

          {showFilterMenu && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowFilterMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[140px] z-40">
                {(['all', 'text', 'shape', 'image', 'bound', 'unbound'] as FilterType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => {
                      setFilterType(type);
                      setShowFilterMenu(false);
                    }}
                    className={`w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 flex items-center gap-2 ${
                      filterType === type ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    {type === 'text' && <Type className="w-3.5 h-3.5" />}
                    {type === 'shape' && <Square className="w-3.5 h-3.5" />}
                    {type === 'image' && <ImageIcon className="w-3.5 h-3.5" />}
                    {type === 'bound' && <Database className="w-3.5 h-3.5" />}
                    {type === 'unbound' && <X className="w-3.5 h-3.5" />}
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {selectedIds.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs text-gray-500">
              {selectedIds.length} selected
            </div>
            <div className="flex gap-1">
              {canGroup && (
                <button
                  onClick={onCreateGroup}
                  className="flex-1 px-2 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                  title="Group Selected"
                >
                  <Layers className="w-3 h-3" />
                  Group
                </button>
              )}
              {hasGroupedElements && (
                <button
                  onClick={onUngroup}
                  className="flex-1 px-2 py-1.5 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors flex items-center justify-center gap-1"
                  title="Ungroup"
                >
                  <FolderMinus className="w-3 h-3" />
                  Ungroup
                </button>
              )}
            </div>
            <div className="flex gap-1">
              <button
                onClick={selectAll}
                className="flex-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                Select All
              </button>
              <button
                onClick={deselectAll}
                className="flex-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                Deselect
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 max-h-full" style={{ scrollBehavior: 'smooth' }}>
        {groups.filter(g => groupedElements.has(g.id)).map(group => {
          const groupEls = groupedElements.get(group.id) || [];
          const isExpanded = expandedGroups.has(group.id);
          const hasSelected = groupEls.some(el => selectedIds.includes(el.id));

          return (
            <div key={group.id} className="border-b border-gray-100">
              <div
                className={`flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-gray-50 ${
                  hasSelected ? 'bg-blue-50' : ''
                }`}
                onClick={() => toggleGroupExpansion(group.id)}
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                )}
                {editingGroupId === group.id ? (
                  <div className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onRenameGroup(group.id, editingName);
                          setEditingGroupId(null);
                        } else if (e.key === 'Escape') {
                          setEditingGroupId(null);
                        }
                      }}
                      className="flex-1 px-1 py-0.5 text-sm border border-blue-400 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={() => {
                        onRenameGroup(group.id, editingName);
                        setEditingGroupId(null);
                      }}
                      className="p-0.5 hover:bg-green-100 rounded"
                    >
                      <Check className="w-3 h-3 text-green-600" />
                    </button>
                    <button
                      onClick={() => setEditingGroupId(null)}
                      className="p-0.5 hover:bg-red-100 rounded"
                    >
                      <X className="w-3 h-3 text-red-600" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Layers className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                    <span className="flex-1 text-sm font-medium truncate">{group.name}</span>
                    <span className="text-xs text-gray-400 px-1.5 py-0.5 bg-gray-100 rounded">
                      {groupEls.length}
                    </span>
                  </>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingGroupId(group.id);
                    setEditingName(group.name);
                  }}
                  className="p-1 hover:bg-gray-200 rounded flex-shrink-0"
                  title="Rename Group"
                >
                  <Edit2 className="w-3 h-3 text-gray-500" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onGroupToggle(group.id);
                  }}
                  className="p-1 hover:bg-gray-200 rounded flex-shrink-0"
                >
                  {group.locked ? (
                    <Lock className="w-3 h-3 text-gray-500" />
                  ) : (
                    <Unlock className="w-3 h-3 text-gray-500" />
                  )}
                </button>
              </div>
              {isExpanded && (
                <div className="pl-6 bg-purple-50/30">
                  {groupEls.map(el => (
                    <LayerItem
                      key={el.id}
                      element={el}
                      isSelected={selectedIds.includes(el.id)}
                      onSelect={(multi) => onSelectElement(el.id, multi)}
                      onToggleLock={() => onToggleLock(el.id)}
                      onToggleVisibility={onToggleVisibility ? () => onToggleVisibility(el.id) : undefined}
                      onRename={onRenameElement ? (name) => onRenameElement(el.id, name) : undefined}
                      isEditing={editingElementId === el.id}
                      onStartEdit={() => {
                        setEditingElementId(el.id);
                        setEditingName(el.name || getElementDisplayName(el));
                      }}
                      onEndEdit={() => setEditingElementId(null)}
                      editingName={editingName}
                      onEditingNameChange={setEditingName}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setContextMenu({ x: e.clientX, y: e.clientY, elementId: el.id });
                        onSelectElement(el.id, false);
                      }}
                      onHover={onHoverElement}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {ungroupedElements.map(el => (
          <LayerItem
            key={el.id}
            element={el}
            isSelected={selectedIds.includes(el.id)}
            onSelect={(multi) => onSelectElement(el.id, multi)}
            onToggleLock={() => onToggleLock(el.id)}
            onToggleVisibility={onToggleVisibility ? () => onToggleVisibility(el.id) : undefined}
            onRename={onRenameElement ? (name) => onRenameElement(el.id, name) : undefined}
            isEditing={editingElementId === el.id}
            onStartEdit={() => {
              setEditingElementId(el.id);
              setEditingName(el.name || getElementDisplayName(el));
            }}
            onEndEdit={() => setEditingElementId(null)}
            editingName={editingName}
            onEditingNameChange={setEditingName}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setContextMenu({ x: e.clientX, y: e.clientY, elementId: el.id });
              onSelectElement(el.id, false);
            }}
            onHover={onHoverElement}
          />
        ))}

        {filteredElements.length === 0 && elements.length > 0 && (
          <div className="px-4 py-8 text-center text-sm text-gray-400">
            No layers match your search
          </div>
        )}

        {elements.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-gray-400">
            No layers yet. Add elements to get started.
          </div>
        )}
      </div>

      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[180px]"
            style={{
              left: `${contextMenu.x}px`,
              top: `${contextMenu.y}px`,
            }}
          >
            <button
              onClick={() => {
                onDuplicate(contextMenu.elementId);
                setContextMenu(null);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Duplicate
            </button>
            <div className="border-t border-gray-200 my-1" />
            <button
              onClick={() => {
                onBringToFront(contextMenu.elementId);
                setContextMenu(null);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            >
              <ChevronsUp className="w-4 h-4" />
              Bring to Front
            </button>
            <button
              onClick={() => {
                onBringForward(contextMenu.elementId);
                setContextMenu(null);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            >
              <ArrowUp className="w-4 h-4" />
              Bring Forward
            </button>
            <button
              onClick={() => {
                onSendBackward(contextMenu.elementId);
                setContextMenu(null);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            >
              <ArrowDown className="w-4 h-4" />
              Send Backward
            </button>
            <button
              onClick={() => {
                onSendToBack(contextMenu.elementId);
                setContextMenu(null);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            >
              <ChevronsDown className="w-4 h-4" />
              Send to Back
            </button>
            <div className="border-t border-gray-200 my-1" />
            <button
              onClick={() => {
                onToggleLock(contextMenu.elementId);
                setContextMenu(null);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            >
              {elements.find(el => el.id === contextMenu.elementId)?.locked ? (
                <>
                  <Unlock className="w-4 h-4" />
                  Unlock
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Lock
                </>
              )}
            </button>
            {onToggleVisibility && (
              <button
                onClick={() => {
                  onToggleVisibility(contextMenu.elementId);
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
              >
                {elements.find(el => el.id === contextMenu.elementId)?.hidden ? (
                  <>
                    <Eye className="w-4 h-4" />
                    Show
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4" />
                    Hide
                  </>
                )}
              </button>
            )}
            <div className="border-t border-gray-200 my-1" />
            <button
              onClick={() => {
                onDelete(contextMenu.elementId);
                setContextMenu(null);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function getElementDisplayName(element: CanvasElement): string {
  if (element.name) return element.name;

  if (element.type === 'text') {
    if (element.dataBinding) return element.dataBinding;
    if (element.dataBindings && element.dataBindings.length > 0) {
      return element.dataBindings.map(b => b.field).join(', ');
    }
    return element.content?.substring(0, 20) || 'Text';
  }
  if (element.type === 'image') return 'Image';
  return 'Shape';
}

function getBindingFormatIcon(format?: string) {
  switch (format) {
    case 'currency':
      return <DollarSign className="w-3 h-3" />;
    case 'date':
      return <Calendar className="w-3 h-3" />;
    case 'number':
      return <Hash className="w-3 h-3" />;
    case 'percentage':
      return <Percent className="w-3 h-3" />;
    default:
      return null;
  }
}

interface LayerItemProps {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: (multi: boolean) => void;
  onToggleLock: () => void;
  onToggleVisibility?: () => void;
  onRename?: (name: string) => void;
  isEditing: boolean;
  onStartEdit: () => void;
  onEndEdit: () => void;
  editingName: string;
  onEditingNameChange: (name: string) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onHover?: (id: string | null) => void;
}

function LayerItem({
  element,
  isSelected,
  onSelect,
  onToggleLock,
  onToggleVisibility,
  onRename,
  isEditing,
  onStartEdit,
  onEndEdit,
  editingName,
  onEditingNameChange,
  onContextMenu,
  onHover,
}: LayerItemProps) {
  const hasBinding = element.dataBinding || (element.dataBindings && element.dataBindings.length > 0);
  const hasMultipleBindings = element.dataBindings && element.dataBindings.length > 1;
  const bindingFormat = element.dataBindings?.[0]?.format;
  const isList = element.isList;

  const getTypeIcon = () => {
    switch (element.type) {
      case 'text':
        return <Type className="w-3.5 h-3.5 text-blue-600" />;
      case 'shape':
        return <Square className="w-3.5 h-3.5 text-green-600" />;
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-orange-600" />;
    }
  };

  const getDisplayName = () => {
    return getElementDisplayName(element);
  };

  return (
    <div
      className={`group flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-gray-50 border-l-2 transition-colors ${
        isSelected
          ? 'bg-blue-100 border-l-blue-500'
          : element.hidden
          ? 'opacity-50 border-l-gray-300'
          : 'border-l-transparent'
      }`}
      onClick={(e) => onSelect(e.shiftKey || e.ctrlKey || e.metaKey)}
      onContextMenu={onContextMenu}
      onMouseEnter={() => onHover?.(element.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <div className="flex-shrink-0">
        {getTypeIcon()}
      </div>

      {isEditing && onRename ? (
        <div className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            value={editingName}
            onChange={(e) => onEditingNameChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onRename(editingName);
                onEndEdit();
              } else if (e.key === 'Escape') {
                onEndEdit();
              }
            }}
            className="flex-1 px-1 py-0.5 text-xs border border-blue-400 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRename(editingName);
              onEndEdit();
            }}
            className="p-0.5 hover:bg-green-100 rounded flex-shrink-0"
          >
            <Check className="w-3 h-3 text-green-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEndEdit();
            }}
            className="p-0.5 hover:bg-red-100 rounded flex-shrink-0"
          >
            <X className="w-3 h-3 text-red-600" />
          </button>
        </div>
      ) : (
        <>
          <span className="flex-1 text-xs truncate" title={getDisplayName()}>
            {getDisplayName()}
          </span>

          {hasBinding && (
            <div className="flex items-center gap-0.5 flex-shrink-0">
              {isList && (
                <div className="p-0.5 bg-purple-100 text-purple-600 rounded" title="List binding">
                  <List className="w-3 h-3" />
                </div>
              )}
              {hasMultipleBindings && (
                <div className="px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded text-[10px] font-medium" title="Multiple fields bound">
                  {element.dataBindings!.length}
                </div>
              )}
              {bindingFormat && bindingFormat !== 'none' && (
                <div className="p-0.5 bg-green-100 text-green-600 rounded" title={`Format: ${bindingFormat}`}>
                  {getBindingFormatIcon(bindingFormat)}
                </div>
              )}
              {!hasMultipleBindings && (
                <div className="p-0.5 bg-blue-100 text-blue-600 rounded" title={`Bound to: ${element.dataBinding || element.dataBindings?.[0]?.field}`}>
                  <Database className="w-3 h-3" />
                </div>
              )}
            </div>
          )}

          {onRename && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartEdit();
              }}
              className="p-1 hover:bg-gray-200 rounded flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Rename"
            >
              <Edit2 className="w-3 h-3 text-gray-500" />
            </button>
          )}
        </>
      )}

      {onToggleVisibility && !isEditing && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility();
          }}
          className="p-1 hover:bg-gray-200 rounded flex-shrink-0"
          title={element.hidden ? 'Show' : 'Hide'}
        >
          {element.hidden ? (
            <EyeOff className="w-3 h-3 text-gray-400" />
          ) : (
            <Eye className="w-3 h-3 text-gray-500" />
          )}
        </button>
      )}

      {!isEditing && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock();
          }}
          className="p-1 hover:bg-gray-200 rounded flex-shrink-0"
          title={element.locked ? 'Unlock' : 'Lock'}
        >
          {element.locked ? (
            <Lock className="w-3 h-3 text-gray-500" />
          ) : (
            <Unlock className="w-3 h-3 text-gray-500" />
          )}
        </button>
      )}
    </div>
  );
}
