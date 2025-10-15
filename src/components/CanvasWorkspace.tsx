import { useState, useRef, useEffect } from 'react';
import { Type, Square, Undo, Redo, Image, AlertTriangle, ZoomIn, ZoomOut, Maximize2, Hand, Keyboard } from 'lucide-react';
import { CanvasElement, ElementGroup } from '../lib/types';
import { ContextMenu } from './ContextMenu';
import { PropertiesPanel } from './PropertiesPanel';
import { AlignmentToolbar } from './AlignmentToolbar';
import { LayersPanel } from './LayersPanel';
import { MemoizedCanvasElement } from './CanvasElement';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';
import { alignElements } from '../utils/alignment';
import { estimateTextOverflow } from '../utils/textOverflow';
import { createBoundaryConstraints, constrainElementPosition, constrainElementResize, constrainGroupPosition } from '../utils/boundaries';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useClipboard } from '../hooks/useClipboard';

interface CanvasWorkspaceProps {
  width: number;
  height: number;
  elements: CanvasElement[];
  groups: ElementGroup[];
  headers: string[];
  data: Record<string, unknown>[];
  onElementsChange: (elements: CanvasElement[]) => void;
  onGroupsChange: (groups: ElementGroup[]) => void;
  onInteractionChange?: (isInteracting: boolean) => void;
  onCanvasInteractionChange?: (isInteracting: boolean) => void;
}

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null;

export function CanvasWorkspace({
  width,
  height,
  elements,
  groups,
  headers,
  data,
  onElementsChange,
  onGroupsChange,
  onInteractionChange,
  onCanvasInteractionChange,
}: CanvasWorkspaceProps) {
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null);
  const [dragStartPositions, setDragStartPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [tempDragOffset, setTempDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, elementX: 0, elementY: 0 });
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; elementId: string } | null>(null);
  const [overflowTooltip, setOverflowTooltip] = useState<{ x: number; y: number; elementId: string } | null>(null);
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const [history, setHistory] = useState<CanvasElement[][]>([elements]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanMode, setIsPanMode] = useState(false);
  const [isTrackpadPanning, setIsTrackpadPanning] = useState(false);
  const [isTrackpadZooming, setIsTrackpadZooming] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const propertiesPanelRef = useRef<HTMLDivElement>(null);
  const leftSidebarRef = useRef<HTMLDivElement>(null);
  const layersPanelRef = useRef<HTMLDivElement>(null);
  const dragStartMousePos = useRef<{ x: number; y: number } | null>(null);
  const hasDraggedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const panRafRef = useRef<number | null>(null);
  const elementsRef = useRef<CanvasElement[]>(elements);
  const widthRef = useRef(width);
  const heightRef = useRef(height);
  const resizeStartRef = useRef(resizeStart);
  const resizeHandleRef = useRef(resizeHandle);
  const selectedElementsRef = useRef(selectedElements);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const panOffsetStartRef = useRef<{ x: number; y: number } | null>(null);
  const clickStartPositionRef = useRef<{ x: number; y: number } | null>(null);
  const isPanelInteractingRef = useRef(false);

  const clipboard = useClipboard();

  const isEventFromPanel = (target: EventTarget | null): boolean => {
    if (!target || !(target instanceof Node)) return false;

    let currentElement: Node | null = target;
    while (currentElement) {
      if (currentElement instanceof Element) {
        if (propertiesPanelRef.current?.contains(currentElement)) return true;
        if (leftSidebarRef.current?.contains(currentElement)) return true;
        if (layersPanelRef.current?.contains(currentElement)) return true;

        if (
          currentElement.classList.contains('properties-panel') ||
          currentElement.classList.contains('layers-panel') ||
          currentElement.classList.contains('left-sidebar')
        ) {
          return true;
        }

        const tagName = currentElement.tagName?.toLowerCase();
        if (
          tagName === 'input' ||
          tagName === 'select' ||
          tagName === 'textarea' ||
          tagName === 'button'
        ) {
          if (propertiesPanelRef.current?.contains(currentElement) ||
              leftSidebarRef.current?.contains(currentElement) ||
              layersPanelRef.current?.contains(currentElement)) {
            return true;
          }
        }
      }
      currentElement = currentElement.parentNode;
    }
    return false;
  };

  useEffect(() => {
    elementsRef.current = elements;
    widthRef.current = width;
    heightRef.current = height;
    resizeStartRef.current = resizeStart;
    resizeHandleRef.current = resizeHandle;
    selectedElementsRef.current = selectedElements;
  });

  const selectedElement = selectedElements.length === 1
    ? elements.find((el) => el.id === selectedElements[0])
    : null;

  const addTextElement = () => {
    const newElement: CanvasElement = {
      id: `element-${Date.now()}`,
      type: 'text',
      x: 50,
      y: 50,
      width: 200,
      height: 40,
      rotation: 0,
      content: 'New Text',
      style: {
        fontSize: 16,
        fontFamily: 'Arial',
        fontWeight: 'normal',
        color: '#000000',
        textAlign: 'left',
        opacity: 1,
        borderRadius: 0,
        padding: 5,
      },
    };
    onElementsChange([...elements, newElement]);
    setSelectedElements([newElement.id]);
  };

  const addShapeElement = () => {
    const newElement: CanvasElement = {
      id: `element-${Date.now()}`,
      type: 'shape',
      x: 50,
      y: 50,
      width: 150,
      height: 100,
      rotation: 0,
      style: {
        backgroundColor: '#e5e7eb',
        borderWidth: 2,
        borderColor: '#000000',
        borderRadius: 0,
        opacity: 1,
      },
    };
    onElementsChange([...elements, newElement]);
    setSelectedElements([newElement.id]);
  };

  const addImageElement = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        const img = new window.Image();
        img.onload = () => {
          const newElement: CanvasElement = {
            id: `element-${Date.now()}`,
            type: 'image',
            x: 50,
            y: 50,
            width: Math.min(300, img.width),
            height: Math.min(300, img.height * (Math.min(300, img.width) / img.width)),
            rotation: 0,
            imageUrl,
            style: {
              opacity: 1,
              borderRadius: 0,
            },
          };
          onElementsChange([...elements, newElement]);
          addToHistory([...elements, newElement]);
          setSelectedElements([newElement.id]);
        };
        img.src = imageUrl;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const deleteElement = (id: string) => {
    const newElements = elements.filter((el) => el.id !== id);
    const element = elements.find((el) => el.id === id);

    if (element?.groupId) {
      const remainingGroupElements = newElements.filter(el => el.groupId === element.groupId);
      if (remainingGroupElements.length === 0) {
        onGroupsChange(groups.filter(g => g.id !== element.groupId));
      }
    }

    onElementsChange(newElements);
    setSelectedElements([]);
  };

  const updateElement = (id: string, updates: Partial<CanvasElement>) => {
    const newElements = elements.map((el) => (el.id === id ? { ...el, ...updates } : el));
    onElementsChange(newElements);
    addToHistory(newElements);
  };

  const addToHistory = (newElements: CanvasElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newElements);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onElementsChange(history[newIndex]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onElementsChange(history[newIndex]);
    }
  };

  const duplicateElement = (id: string) => {
    const element = elements.find((el) => el.id === id);
    if (!element) return;

    const newElement: CanvasElement = {
      ...element,
      id: `element-${Date.now()}`,
      x: element.x + 20,
      y: element.y + 20,
    };
    onElementsChange([...elements, newElement]);
    setSelectedElements([newElement.id]);
  };

  const lockElement = (id: string) => {
    updateElement(id, { locked: true });
  };

  const unlockElement = (id: string) => {
    updateElement(id, { locked: false });
  };

  const handleCreateGroup = () => {
    if (selectedElements.length < 2) return;
    const groupId = `group-${Date.now()}`;
    const newGroup: ElementGroup = {
      id: groupId,
      name: `Group ${groups.length + 1}`,
      elementIds: selectedElements,
    };
    onGroupsChange([...groups, newGroup]);
    onElementsChange(
      elements.map((el) =>
        selectedElements.includes(el.id) ? { ...el, groupId } : el
      )
    );
  };

  const handleUngroup = () => {
    const groupsToRemove = new Set<string>();
    selectedElements.forEach(id => {
      const el = elements.find(e => e.id === id);
      if (el?.groupId) {
        groupsToRemove.add(el.groupId);
      }
    });

    onElementsChange(
      elements.map(el =>
        groupsToRemove.has(el.groupId || '') ? { ...el, groupId: undefined } : el
      )
    );
    onGroupsChange(groups.filter(g => !groupsToRemove.has(g.id)));
  };

  const handleAlign = (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    const aligned = alignElements(elements, selectedElements, type, width, height);
    onElementsChange(aligned);
    addToHistory(aligned);
  };

  const handleSelectFromLayer = (id: string, multi: boolean) => {
    if (multi) {
      setSelectedElements((prev) =>
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    } else {
      setSelectedElements([id]);
    }
  };

  const handleToggleLock = (id: string) => {
    const element = elements.find(el => el.id === id);
    if (element) {
      updateElement(id, { locked: !element.locked });
    }
  };

  const handleToggleVisibility = (id: string) => {
    const element = elements.find(el => el.id === id);
    if (element) {
      updateElement(id, { hidden: !element.hidden });
    }
  };

  const handleRenameElement = (id: string, newName: string) => {
    updateElement(id, { name: newName });
  };

  const handleGroupToggle = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      onGroupsChange(
        groups.map(g => g.id === groupId ? { ...g, locked: !g.locked } : g)
      );
    }
  };

  const handleRenameGroup = (groupId: string, newName: string) => {
    onGroupsChange(
      groups.map(g => g.id === groupId ? { ...g, name: newName } : g)
    );
  };

  const bringForward = (elementId: string) => {
    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    if (element.groupId) {
      const groupElements = elements.filter(el => el.groupId === element.groupId);
      const sortedGroup = groupElements.sort((a, b) => (a.layerIndex || 0) - (b.layerIndex || 0));
      const currentIndexInGroup = sortedGroup.findIndex(el => el.id === elementId);

      if (currentIndexInGroup < sortedGroup.length - 1) {
        const nextElement = sortedGroup[currentIndexInGroup + 1];
        const tempIndex = element.layerIndex || 0;
        updateElement(elementId, { layerIndex: nextElement.layerIndex });
        updateElement(nextElement.id, { layerIndex: tempIndex });
      }
    } else {
      const ungroupedElements = elements.filter(el => !el.groupId);
      const sortedElements = ungroupedElements.sort((a, b) => (a.layerIndex || 0) - (b.layerIndex || 0));
      const currentIndex = sortedElements.findIndex(el => el.id === elementId);

      if (currentIndex < sortedElements.length - 1) {
        const nextElement = sortedElements[currentIndex + 1];
        const tempIndex = element.layerIndex || 0;
        updateElement(elementId, { layerIndex: nextElement.layerIndex });
        updateElement(nextElement.id, { layerIndex: tempIndex });
      }
    }
  };

  const sendBackward = (elementId: string) => {
    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    if (element.groupId) {
      const groupElements = elements.filter(el => el.groupId === element.groupId);
      const sortedGroup = groupElements.sort((a, b) => (a.layerIndex || 0) - (b.layerIndex || 0));
      const currentIndexInGroup = sortedGroup.findIndex(el => el.id === elementId);

      if (currentIndexInGroup > 0) {
        const prevElement = sortedGroup[currentIndexInGroup - 1];
        const tempIndex = element.layerIndex || 0;
        updateElement(elementId, { layerIndex: prevElement.layerIndex });
        updateElement(prevElement.id, { layerIndex: tempIndex });
      }
    } else {
      const ungroupedElements = elements.filter(el => !el.groupId);
      const sortedElements = ungroupedElements.sort((a, b) => (a.layerIndex || 0) - (b.layerIndex || 0));
      const currentIndex = sortedElements.findIndex(el => el.id === elementId);

      if (currentIndex > 0) {
        const prevElement = sortedElements[currentIndex - 1];
        const tempIndex = element.layerIndex || 0;
        updateElement(elementId, { layerIndex: prevElement.layerIndex });
        updateElement(prevElement.id, { layerIndex: tempIndex });
      }
    }
  };

  const bringToFront = (elementId: string) => {
    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    if (element.groupId) {
      const groupElements = elements.filter(el => el.groupId === element.groupId);
      const maxGroupIndex = Math.max(...groupElements.map(el => el.layerIndex || 0));
      updateElement(elementId, { layerIndex: maxGroupIndex + 1 });
    } else {
      const maxIndex = Math.max(...elements.map(el => el.layerIndex || 0));
      updateElement(elementId, { layerIndex: maxIndex + 1 });
    }
  };

  const sendToBack = (elementId: string) => {
    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    if (element.groupId) {
      const groupElements = elements.filter(el => el.groupId === element.groupId);
      const minGroupIndex = Math.min(...groupElements.map(el => el.layerIndex || 0));
      updateElement(elementId, { layerIndex: minGroupIndex - 1 });
    } else {
      const minIndex = Math.min(...elements.map(el => el.layerIndex || 0));
      updateElement(elementId, { layerIndex: minIndex - 1 });
    }
  };

  const hasGroupSelected = selectedElements.some(id => {
    const el = elements.find(e => e.id === id);
    return el?.groupId !== undefined;
  });

  const handleElementClick = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    const element = elements.find((el) => el.id === elementId);
    if (!element || element.locked) return;

    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }

    if (e.shiftKey) {
      setSelectedElements((prev) =>
        prev.includes(elementId)
          ? prev.filter((id) => id !== elementId)
          : [...prev, elementId]
      );
    }
  };

  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    if (isSpacePressed || isPanMode) {
      return;
    }
    e.stopPropagation();
    const element = elements.find((el) => el.id === elementId);
    if (!element || element.locked) return;

    if (!selectedElements.includes(elementId) && !e.shiftKey) {
      setSelectedElements([elementId]);
    }

    hasDraggedRef.current = false;
    dragStartMousePos.current = { x: e.clientX, y: e.clientY };
    setIsMouseDown(true);

    const positions = new Map<string, { x: number; y: number }>();
    // If multiple elements are already selected, dragging any of them moves the whole selection
    const elementsToMove = selectedElements.includes(elementId)
      ? selectedElements
      : [elementId];

    elementsToMove.forEach(id => {
      const el = elements.find(e => e.id === id);
      if (!el || el.locked) return;

      if (el.groupId) {
        elements.filter(e => e.groupId === el.groupId && !e.locked).forEach(groupEl => {
          positions.set(groupEl.id, { x: groupEl.x, y: groupEl.y });
        });
      } else {
        positions.set(el.id, { x: el.x, y: el.y });
      }
    });
    setDragStartPositions(positions);
  };

  const handleResizeStart = (e: React.MouseEvent, elementId: string, handle: ResizeHandle) => {
    e.stopPropagation();
    const element = elements.find((el) => el.id === elementId);
    if (!element || element.locked) return;

    setIsResizing(true);
    setResizeHandle(handle);
    onInteractionChange?.(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: element.width,
      height: element.height,
      elementX: element.x,
      elementY: element.y,
    });
    setSelectedElements([elementId]);
  };


  const handleContextMenu = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, elementId });
    setSelectedElements([elementId]);
  };

  const handleCanvasClick = () => {
    if (hasDraggedRef.current || isPanning) {
      return;
    }

    if (clickStartPositionRef.current) {
      return;
    }

    if (!isSpacePressed && !isPanMode) {
      setSelectedElements([]);
    }
  };

  const startPanning = (clientX: number, clientY: number, event?: MouseEvent | React.MouseEvent) => {
    if (isPanelInteractingRef.current) {
      return;
    }
    if (event && isEventFromPanel(event.target as EventTarget)) {
      return;
    }
    if (clickStartPositionRef.current && isPanelInteractingRef.current) {
      return;
    }
    setIsPanning(true);
    onCanvasInteractionChange?.(true);
    panStartRef.current = { x: clientX, y: clientY };
    panOffsetStartRef.current = { ...panOffset };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (isPanelInteractingRef.current || isEventFromPanel(e.target)) {
      return;
    }

    clickStartPositionRef.current = { x: e.clientX, y: e.clientY };

    if (isSpacePressed || isPanMode) {
      e.preventDefault();
      e.stopPropagation();
      startPanning(e.clientX, e.clientY, e);
      clickStartPositionRef.current = null;
    } else {
      setTimeout(() => {
        if (clickStartPositionRef.current) {
          const dx = Math.abs(e.clientX - clickStartPositionRef.current.x);
          const dy = Math.abs(e.clientY - clickStartPositionRef.current.y);
          if (dx < 3 && dy < 3) {
            clickStartPositionRef.current = null;
          }
        }
      }, 0);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.1));
  };

  const handleZoomReset = () => {
    if (isPanelInteractingRef.current) {
      return;
    }
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const togglePanMode = () => {
    setIsPanMode(prev => !prev);
    if (isPanning) {
      setIsPanning(false);
      onCanvasInteractionChange?.(false);
      panStartRef.current = null;
      panOffsetStartRef.current = null;
    }
  };

  const handleZoomToFit = () => {
    if (!containerRef.current || isPanelInteractingRef.current) return;
    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const scaleX = (containerWidth - 100) / width;
    const scaleY = (containerHeight - 100) / height;
    const newZoom = Math.min(scaleX, scaleY, 1);
    setZoom(newZoom);
    setPanOffset({ x: 0, y: 0 });
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;

      if (dragStartMousePos.current && !isResizing && dragStartPositions.size > 0) {
        const deltaX = e.clientX - dragStartMousePos.current.x;
        const deltaY = e.clientY - dragStartMousePos.current.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance > 3 && !hasDraggedRef.current) {
          hasDraggedRef.current = true;
          setIsDragging(true);
          onInteractionChange?.(true);
        }

        if (hasDraggedRef.current) {
          if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
          }

          rafRef.current = requestAnimationFrame(() => {
            const constraints = createBoundaryConstraints(widthRef.current, heightRef.current);
            const scaledDeltaX = deltaX / zoom;
            const scaledDeltaY = deltaY / zoom;

            const draggedElementIds = Array.from(dragStartPositions.keys());
            const constrainedDelta = constrainGroupPosition(
              elementsRef.current,
              draggedElementIds,
              scaledDeltaX,
              scaledDeltaY,
              constraints
            );

            setTempDragOffset({ x: constrainedDelta.x, y: constrainedDelta.y });
          });
        }
      }

      if (isResizing && selectedElementsRef.current.length === 1 && resizeHandleRef.current) {
        const element = elementsRef.current.find((el) => el.id === selectedElementsRef.current[0]);
        if (!element) return;

        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }

        rafRef.current = requestAnimationFrame(() => {
          const currentResizeStart = resizeStartRef.current;
          const currentHandle = resizeHandleRef.current;
          const deltaX = e.clientX - currentResizeStart.x;
          const deltaY = e.clientY - currentResizeStart.y;

          let newWidth = currentResizeStart.width;
          let newHeight = currentResizeStart.height;
          let newX = currentResizeStart.elementX;
          let newY = currentResizeStart.elementY;

          if (currentHandle && currentHandle.includes('e')) {
            newWidth = Math.max(20, currentResizeStart.width + deltaX);
          }
          if (currentHandle && currentHandle.includes('w')) {
            newWidth = Math.max(20, currentResizeStart.width - deltaX);
            newX = currentResizeStart.elementX + (currentResizeStart.width - newWidth);
          }
          if (currentHandle && currentHandle.includes('s')) {
            newHeight = Math.max(20, currentResizeStart.height + deltaY);
          }
          if (currentHandle && currentHandle.includes('n')) {
            newHeight = Math.max(20, currentResizeStart.height - deltaY);
            newY = currentResizeStart.elementY + (currentResizeStart.height - newHeight);
          }

          const constraints = createBoundaryConstraints(widthRef.current, heightRef.current);
          const constrained = constrainElementResize(
            newX,
            newY,
            newWidth,
            newHeight,
            20,
            20,
            constraints
          );

          const updatedElements = elementsRef.current.map(el =>
            el.id === element.id
              ? { ...el, width: constrained.width, height: constrained.height, x: constrained.x, y: constrained.y }
              : el
          );
          onElementsChange(updatedElements);
        });
      }
    };

    const handleGlobalMouseUp = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      if (hasDraggedRef.current && dragStartPositions.size > 0 && tempDragOffset) {
        const deltaX = tempDragOffset.x;
        const deltaY = tempDragOffset.y;

        const updatedElements = elementsRef.current.map(el => {
          const startPos = dragStartPositions.get(el.id);
          if (!startPos) return el;

          const newX = startPos.x + deltaX;
          const newY = startPos.y + deltaY;

          if (el.x === newX && el.y === newY) return el;

          return { ...el, x: newX, y: newY };
        });

        onElementsChange(updatedElements);
        addToHistory(updatedElements);

        setTimeout(() => {
          onInteractionChange?.(false);
        }, 100);
      }

      setTempDragOffset(null);
      setDragStartPositions(new Map());
      hasDraggedRef.current = false;

      setIsDragging(false);

      if (isResizing) {
        setTimeout(() => {
          onInteractionChange?.(false);
        }, 100);
      }

      setIsResizing(false);
      setResizeHandle(null);
      dragStartMousePos.current = null;
      setIsMouseDown(false);
      clickStartPositionRef.current = null;
    };

    if (isDragging || isResizing || isMouseDown) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }
      };
    }
  }, [isDragging, isResizing, isMouseDown, onElementsChange, onInteractionChange, addToHistory, zoom, dragStartPositions, tempDragOffset, selectedElements]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      const isButton = target.tagName === 'BUTTON' || target.tagName === 'SELECT';
      const isInPanel = propertiesPanelRef.current?.contains(target) ||
                        leftSidebarRef.current?.contains(target) ||
                        layersPanelRef.current?.contains(target);

      if (e.code === 'Space' && !isSpacePressed && !isInputField && !isButton && !isInPanel) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.code === 'Equal') {
        e.preventDefault();
        handleZoomIn();
      }
      if ((e.ctrlKey || e.metaKey) && e.code === 'Minus') {
        e.preventDefault();
        handleZoomOut();
      }
      if ((e.ctrlKey || e.metaKey) && e.code === 'Digit0') {
        e.preventDefault();
        handleZoomReset();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        if (isPanning) {
          setIsPanning(false);
          onCanvasInteractionChange?.(false);
          panStartRef.current = null;
          panOffsetStartRef.current = null;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSpacePressed]);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) return;

      if (isEventFromPanel(e.target)) {
        return;
      }

      if (isPanelInteractingRef.current) {
        return;
      }

      let currentNode = e.target as Node | null;
      while (currentNode) {
        if (currentNode instanceof Element) {
          if (currentNode.classList.contains('overflow-y-auto')) {
            return;
          }
          const computedStyle = window.getComputedStyle(currentNode);
          if (computedStyle.overflowY === 'auto' || computedStyle.overflowY === 'scroll') {
            return;
          }
        }
        currentNode = currentNode.parentNode;
      }

      const isPinchZoom = e.ctrlKey;
      const isTrackpadScroll = Math.abs(e.deltaX) > 0 || (Math.abs(e.deltaY) > 0 && !e.ctrlKey && !e.metaKey);

      if (isPinchZoom || e.metaKey) {
        e.preventDefault();
        setIsTrackpadZooming(true);
        onCanvasInteractionChange?.(true);

        const delta = -e.deltaY * 0.01;
        const newZoom = Math.max(0.1, Math.min(3, zoom + delta));

        if (canvasRef.current) {
          const rect = canvasRef.current.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;

          const scaleDiff = newZoom / zoom;
          const newPanX = mouseX - (mouseX - panOffset.x) * scaleDiff;
          const newPanY = mouseY - (mouseY - panOffset.y) * scaleDiff;

          setPanOffset({ x: newPanX, y: newPanY });
        }

        setZoom(newZoom);

        setTimeout(() => {
          setIsTrackpadZooming(false);
          onCanvasInteractionChange?.(false);
        }, 150);
      } else if (isTrackpadScroll && !isSpacePressed && !isPanMode && !isDragging && !isResizing) {
        e.preventDefault();
        setIsTrackpadPanning(true);
        onCanvasInteractionChange?.(true);

        setPanOffset(prev => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }));

        setTimeout(() => {
          setIsTrackpadPanning(false);
          onCanvasInteractionChange?.(false);
        }, 150);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        container.removeEventListener('wheel', handleWheel);
      };
    }
  }, [zoom, panOffset, isSpacePressed, isPanMode, isDragging, isResizing, onCanvasInteractionChange]);

  useEffect(() => {
    const handlePanMove = (e: MouseEvent) => {
      if (isPanning && panStartRef.current && panOffsetStartRef.current) {
        if (panRafRef.current) {
          cancelAnimationFrame(panRafRef.current);
        }

        const deltaX = e.clientX - panStartRef.current.x;
        const deltaY = e.clientY - panStartRef.current.y;

        panRafRef.current = requestAnimationFrame(() => {
          if (panOffsetStartRef.current) {
            setPanOffset({
              x: panOffsetStartRef.current.x + deltaX,
              y: panOffsetStartRef.current.y + deltaY,
            });
          }
        });
      }
    };

    const handlePanEnd = () => {
      if (panRafRef.current) {
        cancelAnimationFrame(panRafRef.current);
        panRafRef.current = null;
      }
      setIsPanning(false);
      onCanvasInteractionChange?.(false);
      panStartRef.current = null;
      panOffsetStartRef.current = null;
    };

    if (isPanning) {
      document.addEventListener('mousemove', handlePanMove);
      document.addEventListener('mouseup', handlePanEnd);
      return () => {
        document.removeEventListener('mousemove', handlePanMove);
        document.removeEventListener('mouseup', handlePanEnd);
        if (panRafRef.current) {
          cancelAnimationFrame(panRafRef.current);
          panRafRef.current = null;
        }
      };
    }
  }, [isPanning, onCanvasInteractionChange]);

  const handleElementMouseEnter = (e: React.MouseEvent, elementId: string) => {
    setHoveredElement(elementId);
    const element = elements.find(el => el.id === elementId);
    if (!element || isDragging) return;

    const sampleRow = data.length > 0 ? data[0] : {};
    const overflowInfo = element.type === 'text' && (element.dataBinding || element.dataBindings)
      ? estimateTextOverflow(element, sampleRow)
      : null;

    if (overflowInfo?.willOverflow) {
      const rect = e.currentTarget.getBoundingClientRect();
      setOverflowTooltip({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
        elementId
      });
    }
  };

  const handleElementMouseLeave = () => {
    setHoveredElement(null);
    setOverflowTooltip(null);
  };

  const sampleRow = data.length > 0 ? data[0] : {};

  const handleContainerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const isFromPropertiesPanel = propertiesPanelRef.current?.contains(target);
    const isFromLeftSidebar = leftSidebarRef.current?.contains(target);
    const isFromLayersPanel = layersPanelRef.current?.contains(target);

    if (isFromPropertiesPanel || isFromLeftSidebar || isFromLayersPanel) {
      clickStartPositionRef.current = null;
      return;
    }

    if (isEventFromPanel(e.target as EventTarget)) {
      clickStartPositionRef.current = null;
      return;
    }

    if (isPanelInteractingRef.current) {
      clickStartPositionRef.current = null;
      return;
    }

    clickStartPositionRef.current = { x: e.clientX, y: e.clientY };
    if (e.target === containerRef.current || (e.target as HTMLElement).classList.contains('canvas-container')) {
      if (isSpacePressed || isPanMode || e.button === 1) {
        e.preventDefault();
        e.stopPropagation();
        startPanning(e.clientX, e.clientY, e);
        clickStartPositionRef.current = null;
      }
    }
  };

  const handleSelectAll = () => {
    const selectableElements = elements.filter(el => !el.locked && !el.hidden);
    setSelectedElements(selectableElements.map(el => el.id));
  };

  const handleDeselectAll = () => {
    setSelectedElements([]);
  };

  const handleCopy = () => {
    const selectedElementsData = elements.filter(el => selectedElements.includes(el.id));
    if (selectedElementsData.length > 0) {
      clipboard.copy(selectedElementsData);
    }
  };

  const handleCut = () => {
    const selectedElementsData = elements.filter(el => selectedElements.includes(el.id));
    if (selectedElementsData.length > 0) {
      clipboard.cut(selectedElementsData);
      const newElements = elements.filter(el => !selectedElements.includes(el.id));
      onElementsChange(newElements);
      addToHistory(newElements);
      setSelectedElements([]);
    }
  };

  const handlePaste = () => {
    const pastedElements = clipboard.paste();
    if (pastedElements) {
      const newElements = [...elements, ...pastedElements];
      onElementsChange(newElements);
      addToHistory(newElements);
      setSelectedElements(pastedElements.map(el => el.id));
    }
  };

  const handleDelete = () => {
    if (selectedElements.length === 0) return;

    const newElements = elements.filter(el => !selectedElements.includes(el.id));
    const groupsToCheck = new Set<string>();

    selectedElements.forEach(id => {
      const el = elements.find(e => e.id === id);
      if (el?.groupId) {
        groupsToCheck.add(el.groupId);
      }
    });

    let updatedGroups = groups;
    groupsToCheck.forEach(groupId => {
      const remainingGroupElements = newElements.filter(el => el.groupId === groupId);
      if (remainingGroupElements.length === 0) {
        updatedGroups = updatedGroups.filter(g => g.id !== groupId);
      }
    });

    onElementsChange(newElements);
    onGroupsChange(updatedGroups);
    addToHistory(newElements);
    setSelectedElements([]);
  };

  const handleDuplicate = () => {
    if (selectedElements.length === 0) return;

    const elementsToDuplicate = elements.filter(el => selectedElements.includes(el.id));
    const newElements = elementsToDuplicate.map(el => ({
      ...el,
      id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x: el.x + 20,
      y: el.y + 20,
    }));

    const updatedElements = [...elements, ...newElements];
    onElementsChange(updatedElements);
    addToHistory(updatedElements);
    setSelectedElements(newElements.map(el => el.id));
  };

  const handleNudge = (direction: 'up' | 'down' | 'left' | 'right', amount: number) => {
    if (selectedElements.length === 0) return;

    const dx = direction === 'left' ? -amount : direction === 'right' ? amount : 0;
    const dy = direction === 'up' ? -amount : direction === 'down' ? amount : 0;

    const newElements = elements.map(el => {
      if (selectedElements.includes(el.id) && !el.locked) {
        return {
          ...el,
          x: Math.max(0, Math.min(el.x + dx, width - el.width)),
          y: Math.max(0, Math.min(el.y + dy, height - el.height)),
        };
      }
      return el;
    });

    onElementsChange(newElements);
    addToHistory(newElements);
  };

  const handleBringForwardShortcut = () => {
    if (selectedElements.length === 1) {
      bringForward(selectedElements[0]);
    }
  };

  const handleSendBackwardShortcut = () => {
    if (selectedElements.length === 1) {
      sendBackward(selectedElements[0]);
    }
  };

  const handleBringToFrontShortcut = () => {
    if (selectedElements.length === 1) {
      bringToFront(selectedElements[0]);
    }
  };

  const handleSendToBackShortcut = () => {
    if (selectedElements.length === 1) {
      sendToBack(selectedElements[0]);
    }
  };

  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 'Delete',
        handler: handleDelete,
        description: 'Delete selected elements',
      },
      {
        key: 'Backspace',
        handler: handleDelete,
        description: 'Delete selected elements',
      },
      {
        key: 'c',
        ctrl: true,
        handler: handleCopy,
        description: 'Copy selected elements',
      },
      {
        key: 'x',
        ctrl: true,
        handler: handleCut,
        description: 'Cut selected elements',
      },
      {
        key: 'v',
        ctrl: true,
        handler: handlePaste,
        description: 'Paste elements from clipboard',
      },
      {
        key: 'd',
        ctrl: true,
        handler: handleDuplicate,
        description: 'Duplicate selected elements',
      },
      {
        key: 'a',
        ctrl: true,
        handler: handleSelectAll,
        description: 'Select all elements',
      },
      {
        key: 'Escape',
        handler: handleDeselectAll,
        description: 'Deselect all elements',
        preventDefault: true,
      },
      {
        key: 'z',
        ctrl: true,
        handler: undo,
        description: 'Undo',
      },
      {
        key: 'z',
        ctrl: true,
        shift: true,
        handler: redo,
        description: 'Redo',
      },
      {
        key: 'y',
        ctrl: true,
        handler: redo,
        description: 'Redo',
      },
      {
        key: 'ArrowUp',
        handler: () => handleNudge('up', 1),
        description: 'Nudge up 1px',
      },
      {
        key: 'ArrowDown',
        handler: () => handleNudge('down', 1),
        description: 'Nudge down 1px',
      },
      {
        key: 'ArrowLeft',
        handler: () => handleNudge('left', 1),
        description: 'Nudge left 1px',
      },
      {
        key: 'ArrowRight',
        handler: () => handleNudge('right', 1),
        description: 'Nudge right 1px',
      },
      {
        key: 'ArrowUp',
        shift: true,
        handler: () => handleNudge('up', 10),
        description: 'Nudge up 10px',
      },
      {
        key: 'ArrowDown',
        shift: true,
        handler: () => handleNudge('down', 10),
        description: 'Nudge down 10px',
      },
      {
        key: 'ArrowLeft',
        shift: true,
        handler: () => handleNudge('left', 10),
        description: 'Nudge left 10px',
      },
      {
        key: 'ArrowRight',
        shift: true,
        handler: () => handleNudge('right', 10),
        description: 'Nudge right 10px',
      },
      {
        key: ']',
        ctrl: true,
        handler: handleBringForwardShortcut,
        description: 'Bring forward',
      },
      {
        key: '[',
        ctrl: true,
        handler: handleSendBackwardShortcut,
        description: 'Send backward',
      },
      {
        key: ']',
        ctrl: true,
        shift: true,
        handler: handleBringToFrontShortcut,
        description: 'Bring to front',
      },
      {
        key: '[',
        ctrl: true,
        shift: true,
        handler: handleSendToBackShortcut,
        description: 'Send to back',
      },
      {
        key: 'g',
        ctrl: true,
        handler: handleCreateGroup,
        description: 'Group selected elements',
      },
      {
        key: 'g',
        ctrl: true,
        shift: true,
        handler: handleUngroup,
        description: 'Ungroup selected elements',
      },
      {
        key: '=',
        ctrl: true,
        handler: handleZoomIn,
        description: 'Zoom in',
      },
      {
        key: '-',
        ctrl: true,
        handler: handleZoomOut,
        description: 'Zoom out',
      },
      {
        key: '0',
        ctrl: true,
        handler: handleZoomReset,
        description: 'Reset zoom to 100%',
      },
      {
        key: '1',
        ctrl: true,
        handler: handleZoomToFit,
        description: 'Zoom to fit',
      },
      {
        key: '?',
        handler: () => setShowKeyboardHelp(true),
        description: 'Show keyboard shortcuts',
        preventDefault: true,
      },
    ],
    enabled: true,
  });

  return (
    <div className="flex flex-col h-full">
      <AlignmentToolbar
        selectedCount={selectedElements.length}
        onAlign={handleAlign}
        onGroup={handleCreateGroup}
        onUngroup={handleUngroup}
        hasGroup={hasGroupSelected}
      />
      <div className="flex flex-1 overflow-hidden min-h-0">
        <div
          ref={leftSidebarRef}
          className="w-52 bg-white border-r flex flex-col overflow-hidden min-h-0 h-full left-sidebar"
          onWheel={(e) => e.stopPropagation()}
          onPointerDownCapture={() => {
            isPanelInteractingRef.current = true;
            clickStartPositionRef.current = null;
          }}
          onMouseDownCapture={() => {
            isPanelInteractingRef.current = true;
            clickStartPositionRef.current = null;
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onPointerUpCapture={() => {
            isPanelInteractingRef.current = false;
          }}
          onMouseUp={(e) => {
            e.stopPropagation();
            isPanelInteractingRef.current = false;
          }}
          onMouseLeave={() => {
            isPanelInteractingRef.current = false;
          }}
          onMouseEnter={() => {
            isPanelInteractingRef.current = true;
          }}
          onClick={(e) => e.stopPropagation()}
          style={{ touchAction: 'auto' }}
        >
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 min-h-0 max-h-full">
        <div>
          <h3 className="text-xs font-semibold text-gray-700 mb-2">Add Elements</h3>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={addTextElement}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
            >
              <Type className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Text</span>
            </button>
            <button
              onClick={addShapeElement}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
            >
              <Square className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Shape</span>
            </button>
            <button
              onClick={addImageElement}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
            >
              <Image className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">Image</span>
            </button>
          </div>
        </div>

        <div className="border-t pt-3">
          <h3 className="text-xs font-semibold text-gray-700 mb-2">History</h3>
          <div className="flex gap-1.5">
            <button
              onClick={undo}
              disabled={historyIndex === 0}
              className={`flex items-center gap-1 px-2 py-1.5 rounded transition-colors ${
                historyIndex === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
              title="Undo"
            >
              <Undo className="w-3.5 h-3.5" />
              <span className="text-xs">Undo</span>
            </button>
            <button
              onClick={redo}
              disabled={historyIndex === history.length - 1}
              className={`flex items-center gap-1 px-2 py-1.5 rounded transition-colors ${
                historyIndex === history.length - 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
              title="Redo"
            >
              <Redo className="w-3.5 h-3.5" />
              <span className="text-xs">Redo</span>
            </button>
          </div>
        </div>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 bg-gray-100 overflow-hidden relative min-h-0"
        onMouseDown={handleContainerMouseDown}
        style={{
          cursor: isPanning || isTrackpadPanning ? 'grabbing' : (isSpacePressed || isPanMode) ? 'grab' : 'default',
          scrollBehavior: 'auto',
          touchAction: 'none',
        }}
        onScroll={(e) => e.preventDefault()}
      >
        <div className="absolute top-3 right-3 z-10 bg-white rounded-lg shadow-lg border border-gray-200 p-1.5 flex flex-col gap-1.5">
          <button
            onClick={handleZoomIn}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="Zoom In (Ctrl/Cmd + +)"
          >
            <ZoomIn className="w-3.5 h-3.5 text-gray-700" />
          </button>
          <div className="text-xs text-center text-gray-600 font-medium py-0.5">
            {Math.round(zoom * 100)}%
          </div>
          <button
            onClick={handleZoomOut}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="Zoom Out (Ctrl/Cmd + -)"
          >
            <ZoomOut className="w-3.5 h-3.5 text-gray-700" />
          </button>
          <div className="border-t border-gray-200 my-0.5" />
          <button
            onClick={togglePanMode}
            className={`p-1.5 rounded transition-colors ${
              isPanMode ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'
            }`}
            title="Pan Mode (Hold Space or click to toggle)"
          >
            <Hand className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleZoomReset}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors text-xs font-medium text-gray-700"
            title="Reset Zoom (Ctrl/Cmd + 0)"
          >
            100%
          </button>
          <button
            onClick={handleZoomToFit}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="Zoom to Fit"
          >
            <Maximize2 className="w-3.5 h-3.5 text-gray-700" />
          </button>
          <div className="border-t border-gray-200 my-0.5" />
          <button
            onClick={() => setShowKeyboardHelp(true)}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="Keyboard Shortcuts (?)"
          >
            <Keyboard className="w-3.5 h-3.5 text-gray-700" />
          </button>
        </div>

        <div
          className="absolute inset-0 flex items-center justify-center canvas-container"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
            cursor: isPanning || isTrackpadPanning ? 'grabbing' : (isSpacePressed || isPanMode) ? 'grab' : 'default',
            transition: isTrackpadZooming ? 'none' : undefined,
          }}
          onMouseDown={(e) => {
            clickStartPositionRef.current = { x: e.clientX, y: e.clientY };
            if (e.target === e.currentTarget && (isSpacePressed || isPanMode || e.button === 1)) {
              e.preventDefault();
              startPanning(e.clientX, e.clientY);
              clickStartPositionRef.current = null;
            }
          }}
        >
          <div
            ref={canvasRef}
            className="bg-white shadow-2xl relative"
            style={{
              width: `${width}px`,
              height: `${height}px`,
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              cursor: isPanning || isTrackpadPanning ? 'grabbing' : (isSpacePressed || isPanMode) ? 'grab' : 'default',
              transition: isTrackpadZooming ? 'transform 0.05s ease-out' : undefined,
            }}
            onClick={handleCanvasClick}
            onMouseDown={handleCanvasMouseDown}
            onContextMenu={(e) => e.preventDefault()}
          >
            {elements.filter(el => !el.hidden).map((element) => (
              <MemoizedCanvasElement
                key={element.id}
                element={element}
                isSelected={selectedElements.includes(element.id)}
                isHovered={hoveredElement === element.id}
                isDragging={isDragging}
                tempDragOffset={tempDragOffset}
                dragStartPositions={dragStartPositions}
                groups={groups}
                sampleRow={sampleRow}
                onMouseDown={handleMouseDown}
                onClick={handleElementClick}
                onContextMenu={handleContextMenu}
                onMouseEnter={handleElementMouseEnter}
                onMouseLeave={handleElementMouseLeave}
                onResizeStart={handleResizeStart}
              />
            ))}
          </div>
        </div>

        {((isSpacePressed && !isPanning) || (isPanMode && !isPanning)) && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-xs font-medium shadow-lg">
            {isPanMode ? 'Pan Mode Active - Click and Drag' : 'Hold Space + Drag to Pan'}
          </div>
        )}

        {isTrackpadPanning && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-xs font-medium shadow-lg">
            Trackpad Panning
          </div>
        )}

        {isTrackpadZooming && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900 text-white px-4 py-3 rounded-lg text-sm font-medium shadow-lg">
            {Math.round(zoom * 100)}%
          </div>
        )}
      </div>

      <div
        ref={propertiesPanelRef}
        className="w-72 bg-white border-l flex flex-col overflow-hidden min-h-0 h-full properties-panel"
        onWheel={(e) => e.stopPropagation()}
        onPointerDownCapture={() => {
          isPanelInteractingRef.current = true;
          clickStartPositionRef.current = null;
        }}
        onMouseDownCapture={() => {
          isPanelInteractingRef.current = true;
          clickStartPositionRef.current = null;
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        onPointerUpCapture={() => {
          isPanelInteractingRef.current = false;
        }}
        onMouseUp={(e) => {
          e.stopPropagation();
          isPanelInteractingRef.current = false;
        }}
        onMouseLeave={() => {
          isPanelInteractingRef.current = false;
        }}
        onMouseEnter={() => {
          isPanelInteractingRef.current = true;
        }}
        onClick={(e) => e.stopPropagation()}
        style={{ touchAction: 'auto' }}
      >
        {selectedElement ? (
          <PropertiesPanel
            element={selectedElement}
            headers={headers}
            data={data}
            onUpdate={(updates) => updateElement(selectedElement.id, updates)}
            onDelete={() => deleteElement(selectedElement.id)}
            pageWidth={width}
            pageHeight={height}
            onInteractionStart={() => {
              isPanelInteractingRef.current = true;
            }}
            onInteractionEnd={() => {
              isPanelInteractingRef.current = false;
            }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <p className="text-xs text-gray-500 text-center">Select an element to edit its properties</p>
          </div>
        )}
      </div>

      {contextMenu && (() => {
        const hasGroupedElements = selectedElements.some(id => {
          const el = elements.find(e => e.id === id);
          return el?.groupId !== undefined;
        });

        return (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            isLocked={elements.find((el) => el.id === contextMenu.elementId)?.locked || false}
            canGroup={selectedElements.length > 1}
            isGrouped={hasGroupedElements}
            onLock={() => {
              lockElement(contextMenu.elementId);
              setContextMenu(null);
            }}
            onUnlock={() => {
              unlockElement(contextMenu.elementId);
              setContextMenu(null);
            }}
            onGroup={() => {
              handleCreateGroup();
              setContextMenu(null);
            }}
            onUngroup={() => {
              handleUngroup();
              setContextMenu(null);
            }}
            onBringForward={() => {
              bringForward(contextMenu.elementId);
              setContextMenu(null);
            }}
            onSendBackward={() => {
              sendBackward(contextMenu.elementId);
              setContextMenu(null);
            }}
            onBringToFront={() => {
              bringToFront(contextMenu.elementId);
              setContextMenu(null);
            }}
            onSendToBack={() => {
              sendToBack(contextMenu.elementId);
              setContextMenu(null);
            }}
            onDuplicate={() => {
              duplicateElement(contextMenu.elementId);
              setContextMenu(null);
            }}
            onDelete={() => {
              deleteElement(contextMenu.elementId);
              setContextMenu(null);
            }}
            onClose={() => setContextMenu(null)}
          />
        );
      })()}

      <div
        ref={layersPanelRef}
        className="layers-panel"
        onWheel={(e) => e.stopPropagation()}
        onPointerDownCapture={() => {
          isPanelInteractingRef.current = true;
          clickStartPositionRef.current = null;
        }}
        onMouseDownCapture={() => {
          isPanelInteractingRef.current = true;
          clickStartPositionRef.current = null;
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        onPointerUpCapture={() => {
          isPanelInteractingRef.current = false;
        }}
        onMouseUp={(e) => {
          e.stopPropagation();
          isPanelInteractingRef.current = false;
        }}
        onMouseLeave={() => {
          isPanelInteractingRef.current = false;
        }}
        onMouseEnter={() => {
          isPanelInteractingRef.current = true;
        }}
        onClick={(e) => e.stopPropagation()}
        style={{ touchAction: 'auto' }}
      >
        <LayersPanel
          elements={elements}
          groups={groups}
          selectedIds={selectedElements}
          onSelectElement={handleSelectFromLayer}
          onToggleLock={handleToggleLock}
          onToggleVisibility={handleToggleVisibility}
          onRenameElement={handleRenameElement}
          onReorder={() => {}}
          onGroupToggle={handleGroupToggle}
          onCreateGroup={handleCreateGroup}
          onUngroup={handleUngroup}
          onRenameGroup={handleRenameGroup}
          onDuplicate={duplicateElement}
          onDelete={deleteElement}
          onBringForward={bringForward}
          onSendBackward={sendBackward}
          onBringToFront={bringToFront}
          onSendToBack={sendToBack}
          onHoverElement={setHoveredElement}
        />
      </div>
      </div>

      {overflowTooltip && (() => {
        const element = elements.find(el => el.id === overflowTooltip.elementId);
        if (!element) return null;

        const sampleRow = data.length > 0 ? data[0] : {};
        const info = estimateTextOverflow(element, sampleRow);

        return (
          <div
            className="fixed z-50 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg pointer-events-none"
            style={{
              left: `${overflowTooltip.x}px`,
              top: `${overflowTooltip.y}px`,
              transform: 'translateX(-50%) translateY(-100%)',
            }}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
              <div>
                <div className="font-semibold">Text Overflow Warning</div>
                <div className="text-gray-300 mt-0.5">
                  Content may be cut off ({info.currentLength} chars)
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <KeyboardShortcutsHelp
        isOpen={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
      />
    </div>
  );
}
