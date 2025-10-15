import { useState, useRef, useEffect } from 'react';
import { Type, Square, Undo, Redo, Image, AlertTriangle, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { CanvasElement, ElementGroup } from '../lib/types';
import { ContextMenu } from './ContextMenu';
import { PropertiesPanel } from './PropertiesPanel';
import { AlignmentToolbar } from './AlignmentToolbar';
import { LayersPanel } from './LayersPanel';
import { alignElements } from '../utils/alignment';
import { formatMultipleBindings } from '../utils/dataFormatter';
import { estimateTextOverflow } from '../utils/textOverflow';

interface CanvasWorkspaceProps {
  width: number;
  height: number;
  elements: CanvasElement[];
  groups: ElementGroup[];
  headers: string[];
  data: Record<string, unknown>[];
  onElementsChange: (elements: CanvasElement[]) => void;
  onGroupsChange: (groups: ElementGroup[]) => void;
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
}: CanvasWorkspaceProps) {
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragStartPositions, setDragStartPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
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
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartMousePos = useRef<{ x: number; y: number } | null>(null);
  const hasDraggedRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const selectedElement = selectedElements.length === 1
    ? elements.find((el) => el.id === selectedElements[0])
    : null;

  const addTextElement = () => {
    const savedPanOffset = { ...panOffset };
    const savedZoom = zoom;

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

    requestAnimationFrame(() => {
      setPanOffset(savedPanOffset);
      setZoom(savedZoom);
    });
  };

  const addShapeElement = () => {
    const savedPanOffset = { ...panOffset };
    const savedZoom = zoom;

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

    requestAnimationFrame(() => {
      setPanOffset(savedPanOffset);
      setZoom(savedZoom);
    });
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
          const savedPanOffset = { ...panOffset };
          const savedZoom = zoom;

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

          requestAnimationFrame(() => {
            setPanOffset(savedPanOffset);
            setZoom(savedZoom);
          });
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
      return;
    }

    if (e.shiftKey) {
      setSelectedElements((prev) =>
        prev.includes(elementId)
          ? prev.filter((id) => id !== elementId)
          : [...prev, elementId]
      );
    } else {
      setSelectedElements([elementId]);
    }
  };

  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    if (isSpacePressed) {
      return;
    }
    e.stopPropagation();
    const element = elements.find((el) => el.id === elementId);
    if (!element || element.locked) return;

    hasDraggedRef.current = false;
    dragStartMousePos.current = { x: e.clientX, y: e.clientY };
    setIsMouseDown(true);
  };

  const handleResizeStart = (e: React.MouseEvent, elementId: string, handle: ResizeHandle) => {
    e.stopPropagation();
    const element = elements.find((el) => el.id === elementId);
    if (!element || element.locked) return;

    setIsResizing(true);
    setResizeHandle(handle);
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

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (!isSpacePressed && !isPanning) {
      setSelectedElements([]);
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (isSpacePressed) {
      e.preventDefault();
      e.stopPropagation();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.1));
  };

  const handleZoomReset = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleZoomToFit = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    const scaleX = (containerWidth - 100) / width;
    const scaleY = (containerHeight - 100) / height;
    const newZoom = Math.min(scaleX, scaleY, 1);
    setZoom(newZoom);
    setPanOffset({ x: 0, y: 0 });
  };

  const screenToCanvas = (screenX: number, screenY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (screenX - rect.left - panOffset.x) / zoom,
      y: (screenY - rect.top - panOffset.y) / zoom,
    };
  };

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;

      if (dragStartMousePos.current && !isResizing) {
        const deltaX = e.clientX - dragStartMousePos.current.x;
        const deltaY = e.clientY - dragStartMousePos.current.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance > 3 && !hasDraggedRef.current && selectedElements.length > 0) {
          hasDraggedRef.current = true;
          setIsDragging(true);

          const positions = new Map<string, { x: number; y: number }>();
          selectedElements.forEach(id => {
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
        }

        if (hasDraggedRef.current && dragStartPositions.size > 0) {
          if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
          }

          rafRef.current = requestAnimationFrame(() => {
            const updatedElements = elements.map(el => {
              const startPos = dragStartPositions.get(el.id);
              if (!startPos) return el;

              const x = Math.max(0, Math.min(width - el.width, startPos.x + deltaX));
              const y = Math.max(0, Math.min(height - el.height, startPos.y + deltaY));
              return { ...el, x, y };
            });

            onElementsChange(updatedElements);
          });
        }
      }

      if (isResizing && selectedElements.length === 1 && resizeHandle) {
        const element = elements.find((el) => el.id === selectedElements[0]);
        if (!element) return;

        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
        }

        rafRef.current = requestAnimationFrame(() => {
          const deltaX = e.clientX - resizeStart.x;
          const deltaY = e.clientY - resizeStart.y;

          let newWidth = resizeStart.width;
          let newHeight = resizeStart.height;
          let newX = resizeStart.elementX;
          let newY = resizeStart.elementY;

          if (resizeHandle.includes('e')) {
            newWidth = Math.max(20, resizeStart.width + deltaX);
          }
          if (resizeHandle.includes('w')) {
            newWidth = Math.max(20, resizeStart.width - deltaX);
            newX = resizeStart.elementX + (resizeStart.width - newWidth);
          }
          if (resizeHandle.includes('s')) {
            newHeight = Math.max(20, resizeStart.height + deltaY);
          }
          if (resizeHandle.includes('n')) {
            newHeight = Math.max(20, resizeStart.height - deltaY);
            newY = resizeStart.elementY + (resizeStart.height - newHeight);
          }

          const updatedElements = elements.map(el =>
            el.id === element.id
              ? { ...el, width: newWidth, height: newHeight, x: newX, y: newY }
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

      if (hasDraggedRef.current && dragStartPositions.size > 0) {
        addToHistory(elements);
      }

      setIsDragging(false);
      setIsResizing(false);
      setResizeHandle(null);
      dragStartMousePos.current = null;
      setDragStartPositions(new Map());
      hasDraggedRef.current = false;
      setIsMouseDown(false);
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
  }, [isDragging, isResizing, isMouseDown, elements, dragStartPositions, width, height, resizeHandle, resizeStart, selectedElements]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (e.code === 'Space' && !isSpacePressed && !isInputField) {
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
        setIsPanning(false);
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

      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
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
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        container.removeEventListener('wheel', handleWheel);
      };
    }
  }, [zoom, panOffset]);

  useEffect(() => {
    const handlePanMove = (e: MouseEvent) => {
      if (isPanning) {
        const deltaX = e.clientX - panStart.x;
        const deltaY = e.clientY - panStart.y;
        setPanOffset(prev => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY,
        }));
        setPanStart({ x: e.clientX, y: e.clientY });
      }
    };

    const handlePanEnd = () => {
      setIsPanning(false);
    };

    if (isPanning) {
      document.addEventListener('mousemove', handlePanMove);
      document.addEventListener('mouseup', handlePanEnd);
      return () => {
        document.removeEventListener('mousemove', handlePanMove);
        document.removeEventListener('mouseup', handlePanEnd);
      };
    }
  }, [isPanning, panStart]);

  const renderElement = (element: CanvasElement) => {
    const isSelected = selectedElements.includes(element.id);
    const isHovered = hoveredElement === element.id;
    const transform = `rotate(${element.rotation || 0}deg)`;

    const sampleRow = data.length > 0 ? data[0] : {};
    const overflowInfo = element.type === 'text' && (element.dataBinding || element.dataBindings)
      ? estimateTextOverflow(element, sampleRow)
      : null;

    const getBorderRadius = () => {
      if (element.style?.borderTopLeftRadius !== undefined ||
          element.style?.borderTopRightRadius !== undefined ||
          element.style?.borderBottomLeftRadius !== undefined ||
          element.style?.borderBottomRightRadius !== undefined) {
        return `${element.style?.borderTopLeftRadius ?? element.style?.borderRadius ?? 0}px ${element.style?.borderTopRightRadius ?? element.style?.borderRadius ?? 0}px ${element.style?.borderBottomRightRadius ?? element.style?.borderRadius ?? 0}px ${element.style?.borderBottomLeftRadius ?? element.style?.borderRadius ?? 0}px`;
      }
      return `${element.style?.borderRadius || 0}px`;
    };

    const commonStyles: React.CSSProperties = {
      transform,
      opacity: element.style?.opacity ?? 1,
      borderRadius: getBorderRadius(),
      boxShadow: element.style?.boxShadow,
    };

    const isGrouped = element.groupId !== undefined;
    const groupInfo = isGrouped ? groups.find(g => g.id === element.groupId) : null;

    return (
      <div
        key={element.id}
        className={`absolute select-none transition-all ${element.locked ? 'cursor-not-allowed' : 'cursor-move'} ${
          isSelected ? 'ring-2 ring-blue-500' : isHovered ? 'ring-2 ring-blue-300' : isGrouped ? 'ring-1 ring-purple-300' : ''
        }`}
        style={{
          left: `${element.x}px`,
          top: `${element.y}px`,
          width: `${element.width}px`,
          height: `${element.height}px`,
          zIndex: element.layerIndex || 0,
          ...commonStyles,
        }}
        onMouseDown={(e) => handleMouseDown(e, element.id)}
        onClick={(e) => handleElementClick(e, element.id)}
        onContextMenu={(e) => handleContextMenu(e, element.id)}
        onMouseEnter={(e) => {
          setHoveredElement(element.id);
          if (overflowInfo?.willOverflow) {
            const rect = e.currentTarget.getBoundingClientRect();
            setOverflowTooltip({
              x: rect.left + rect.width / 2,
              y: rect.top - 10,
              elementId: element.id
            });
          }
        }}
        onMouseLeave={() => {
          setHoveredElement(null);
          setOverflowTooltip(null);
        }}
      >
        {overflowInfo?.willOverflow && (
          <div className="absolute -top-1 -right-1 z-10">
            <AlertTriangle className="w-4 h-4 text-amber-500 fill-amber-100" />
          </div>
        )}
        {isGrouped && groupInfo && (
          <div className="absolute -top-5 -left-1 px-1.5 py-0.5 bg-purple-500 text-white text-[10px] rounded pointer-events-none">
            {groupInfo.name}
          </div>
        )}
        {element.type === 'text' && (
          <div
            className="w-full h-full flex items-center overflow-hidden"
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
              backgroundColor: element.style?.backgroundColor || 'transparent',
              padding: `${element.style?.padding || 0}px`,
              borderWidth: `${element.style?.borderWidth || 0}px`,
              borderColor: element.style?.borderColor || '#000000',
              borderStyle: (element.style?.borderStyle as any) || 'solid',
            }}
          >
            {element.dataBindings && element.dataBindings.length > 0
              ? `{formatted: ${element.dataBindings.map(b => b.field).join(', ')}}`
              : element.dataBinding
              ? (element.isList
                  ? `{${element.dataBinding} [${element.listLayout || 'vertical'} ${element.listStyle || 'none'}]}`
                  : `{${element.dataBinding}}`)
              : element.content}
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

        {isSelected && !element.locked && (
          <>
            <div
              className="absolute -top-1 -left-1 w-2 h-2 bg-white border-2 border-blue-500 rounded-full cursor-nw-resize"
              onMouseDown={(e) => handleResizeStart(e, element.id, 'nw')}
            />
            <div
              className="absolute -top-1 -right-1 w-2 h-2 bg-white border-2 border-blue-500 rounded-full cursor-ne-resize"
              onMouseDown={(e) => handleResizeStart(e, element.id, 'ne')}
            />
            <div
              className="absolute -bottom-1 -left-1 w-2 h-2 bg-white border-2 border-blue-500 rounded-full cursor-sw-resize"
              onMouseDown={(e) => handleResizeStart(e, element.id, 'sw')}
            />
            <div
              className="absolute -bottom-1 -right-1 w-2 h-2 bg-white border-2 border-blue-500 rounded-full cursor-se-resize"
              onMouseDown={(e) => handleResizeStart(e, element.id, 'se')}
            />
            <div
              className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-2 border-blue-500 rounded-full cursor-n-resize"
              onMouseDown={(e) => handleResizeStart(e, element.id, 'n')}
            />
            <div
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-2 border-blue-500 rounded-full cursor-s-resize"
              onMouseDown={(e) => handleResizeStart(e, element.id, 's')}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-white border-2 border-blue-500 rounded-full cursor-w-resize"
              onMouseDown={(e) => handleResizeStart(e, element.id, 'w')}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 bg-white border-2 border-blue-500 rounded-full cursor-e-resize"
              onMouseDown={(e) => handleResizeStart(e, element.id, 'e')}
            />
          </>
        )}
      </div>
    );
  };

  const handleContainerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).classList.contains('canvas-container')) {
      if (isSpacePressed || e.button === 1) {
        e.preventDefault();
        e.stopPropagation();
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY });
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <AlignmentToolbar
        selectedCount={selectedElements.length}
        onAlign={handleAlign}
        onGroup={handleCreateGroup}
        onUngroup={handleUngroup}
        hasGroup={hasGroupSelected}
      />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 bg-white border-r flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Add Elements</h3>
          <div className="flex flex-col gap-2">
            <button
              onClick={addTextElement}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Type className="w-4 h-4" />
              <span className="text-sm font-medium">Text Field</span>
            </button>
            <button
              onClick={addShapeElement}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Square className="w-4 h-4" />
              <span className="text-sm font-medium">Shape</span>
            </button>
            <button
              onClick={addImageElement}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Image className="w-4 h-4" />
              <span className="text-sm font-medium">Image</span>
            </button>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">History</h3>
          <div className="flex gap-2">
            <button
              onClick={undo}
              disabled={historyIndex === 0}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                historyIndex === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
              title="Undo"
            >
              <Undo className="w-4 h-4" />
              <span className="text-sm">Undo</span>
            </button>
            <button
              onClick={redo}
              disabled={historyIndex === history.length - 1}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                historyIndex === history.length - 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
              title="Redo"
            >
              <Redo className="w-4 h-4" />
              <span className="text-sm">Redo</span>
            </button>
          </div>
        </div>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 bg-gray-100 overflow-hidden relative"
        onMouseDown={handleContainerMouseDown}
        style={{
          cursor: isPanning ? 'grabbing' : isSpacePressed ? 'grab' : 'default',
          scrollBehavior: 'auto'
        }}
        onScroll={(e) => e.preventDefault()}
      >
        <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex flex-col gap-2">
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Zoom In (Ctrl/Cmd + +)"
          >
            <ZoomIn className="w-4 h-4 text-gray-700" />
          </button>
          <div className="text-xs text-center text-gray-600 font-medium py-1">
            {Math.round(zoom * 100)}%
          </div>
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Zoom Out (Ctrl/Cmd + -)"
          >
            <ZoomOut className="w-4 h-4 text-gray-700" />
          </button>
          <div className="border-t border-gray-200 my-1" />
          <button
            onClick={handleZoomReset}
            className="p-2 hover:bg-gray-100 rounded transition-colors text-xs font-medium text-gray-700"
            title="Reset Zoom (Ctrl/Cmd + 0)"
          >
            100%
          </button>
          <button
            onClick={handleZoomToFit}
            className="p-2 hover:bg-gray-100 rounded transition-colors"
            title="Zoom to Fit"
          >
            <Maximize2 className="w-4 h-4 text-gray-700" />
          </button>
        </div>

        <div
          className="absolute inset-0 flex items-center justify-center canvas-container"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
            cursor: isPanning ? 'grabbing' : isSpacePressed ? 'grab' : 'default',
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && (isSpacePressed || e.button === 1)) {
              e.preventDefault();
              setIsPanning(true);
              setPanStart({ x: e.clientX, y: e.clientY });
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
              cursor: isPanning ? 'grabbing' : isSpacePressed ? 'grab' : 'default',
            }}
            onClick={handleCanvasClick}
            onMouseDown={handleCanvasMouseDown}
            onContextMenu={(e) => e.preventDefault()}
          >
            {elements.filter(el => !el.hidden).map(renderElement)}
          </div>
        </div>

        {isSpacePressed && !isPanning && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-xs font-medium shadow-lg">
            Hold Space + Drag to Pan
          </div>
        )}
      </div>

      <div className="w-80 bg-white border-l flex flex-col overflow-hidden">
        {selectedElement ? (
          <PropertiesPanel
            element={selectedElement}
            headers={headers}
            data={data}
            onUpdate={(updates) => updateElement(selectedElement.id, updates)}
            onDelete={() => deleteElement(selectedElement.id)}
            pageWidth={width}
            pageHeight={height}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-gray-500">Select an element to edit its properties</p>
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
    </div>
  );
}
