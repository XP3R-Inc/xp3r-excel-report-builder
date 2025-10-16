import React, { memo, useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { CanvasElement as CanvasElementType, ElementGroup } from '../lib/types';
import { estimateTextOverflow } from '../utils/textOverflow';
import { calculateOverflowStyle } from '../utils/overflowRenderer';
import { formatMultipleBindings } from '../utils/dataFormatter';

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';

interface CanvasElementProps {
  element: CanvasElementType;
  isSelected: boolean;
  isHovered: boolean;
  isDragging: boolean;
  tempDragOffset: { x: number; y: number } | null;
  dragStartPositions: Map<string, { x: number; y: number }>;
  groups: ElementGroup[];
  sampleRow: Record<string, unknown>;
  onMouseDown: (e: React.MouseEvent, elementId: string) => void;
  onClick: (e: React.MouseEvent, elementId: string) => void;
  onContextMenu: (e: React.MouseEvent, elementId: string) => void;
  onMouseEnter: (e: React.MouseEvent, elementId: string) => void;
  onMouseLeave: () => void;
  onResizeStart: (e: React.MouseEvent, elementId: string, handle: ResizeHandle) => void;
}

const CanvasElementComponent: React.FC<CanvasElementProps> = ({
  element,
  isSelected,
  isHovered,
  isDragging,
  tempDragOffset,
  dragStartPositions,
  groups,
  sampleRow,
  onMouseDown,
  onClick,
  onContextMenu,
  onMouseEnter,
  onMouseLeave,
  onResizeStart,
}) => {
  const isDraggingThisElement = isDragging && dragStartPositions.has(element.id);
  const dragTransform = isDraggingThisElement && tempDragOffset
    ? `translate(${tempDragOffset.x}px, ${tempDragOffset.y}px) `
    : '';
  const transform = `${dragTransform}rotate(${element.rotation || 0}deg)`;

  const overflowInfo = !isDragging && element.type === 'text' && (element.dataBinding || element.dataBindings)
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

  const textContent = useMemo(() => {
    if (element.type !== 'text') return '';

    // Prefer bound data for preview/export fidelity
    if (element.dataBindings && element.dataBindings.length > 0) {
      return formatMultipleBindings(sampleRow, element.dataBindings, element.bindingSeparator || ' ');
    }

    if (element.dataBinding) {
      if (element.isList) {
        const raw = sampleRow[element.dataBinding];
        if (raw !== undefined && raw !== null) {
          const items = String(raw).split(element.listDelimiter || ',');
          return items.join(element.bindingSeparator || ' ');
        }
      } else {
        const val = sampleRow[element.dataBinding];
        if (val !== undefined && val !== null) return String(val);
      }
    }

    return element.content || '';
  }, [element, sampleRow]);

  const overflowStyle = useMemo(() => {
    if (element.type !== 'text') return {};
    return calculateOverflowStyle(element, textContent);
  }, [element, textContent]);

  return (
    <div
      key={element.id}
      className={`absolute select-none ${element.locked ? 'cursor-not-allowed' : 'cursor-move'} ${
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
      onMouseDown={(e) => onMouseDown(e, element.id)}
      onClick={(e) => onClick(e, element.id)}
      onContextMenu={(e) => onContextMenu(e, element.id)}
      onMouseEnter={(e) => onMouseEnter(e, element.id)}
      onMouseLeave={onMouseLeave}
    >
      {overflowInfo?.willOverflow && (
        <div className="absolute -top-1 -right-1 z-10 helper-badge">
          <AlertTriangle className="w-4 h-4 text-amber-500 fill-amber-100" />
        </div>
      )}
      {isGrouped && groupInfo && (
        <div className="absolute -top-5 -left-1 px-1.5 py-0.5 bg-purple-500 text-white text-[10px] rounded pointer-events-none helper-badge">
          {groupInfo.name}
        </div>
      )}
      {element.type === 'text' && (
        <div
          className="w-full h-full text-field"
          style={{
            fontSize: `${overflowStyle.fontSize || element.style?.fontSize || 16}px`,
            fontFamily: element.style?.fontFamily || 'Arial',
            fontWeight: element.style?.fontWeight || 'normal',
            fontStyle: element.style?.fontStyle || 'normal',
            textDecoration: element.style?.textDecoration || 'none',
            lineHeight: overflowStyle.lineHeight || element.style?.lineHeight || 1.5,
            letterSpacing: `${element.style?.letterSpacing || 0}px`,
            color: element.style?.color || '#000000',
            textAlign: (element.style?.textAlign as any) || 'left',
            backgroundColor: element.style?.backgroundColor || 'transparent',
            padding: `${element.style?.padding || 0}px`,
            borderWidth: `${element.style?.borderWidth || 0}px`,
            borderColor: element.style?.borderColor || '#000000',
            borderStyle: (element.style?.borderStyle as any) || 'solid',
            overflow: overflowStyle.overflow,
            overflowY: overflowStyle.overflowY,
            textOverflow: overflowStyle.textOverflow,
            whiteSpace: overflowStyle.whiteSpace,
            wordBreak: overflowStyle.wordBreak,
            hyphens: overflowStyle.hyphens,
            display: overflowStyle.display,
            WebkitLineClamp: overflowStyle.WebkitLineClamp,
            WebkitBoxOrient: overflowStyle.WebkitBoxOrient,
          }}
        >
          {textContent}
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
          draggable={false}
          className="w-full h-full object-cover pointer-events-none select-none"
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
            onMouseDown={(e) => onResizeStart(e, element.id, 'nw')}
          />
          <div
            className="absolute -top-1 -right-1 w-2 h-2 bg-white border-2 border-blue-500 rounded-full cursor-ne-resize"
            onMouseDown={(e) => onResizeStart(e, element.id, 'ne')}
          />
          <div
            className="absolute -bottom-1 -left-1 w-2 h-2 bg-white border-2 border-blue-500 rounded-full cursor-sw-resize"
            onMouseDown={(e) => onResizeStart(e, element.id, 'sw')}
          />
          <div
            className="absolute -bottom-1 -right-1 w-2 h-2 bg-white border-2 border-blue-500 rounded-full cursor-se-resize"
            onMouseDown={(e) => onResizeStart(e, element.id, 'se')}
          />
          <div
            className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-2 border-blue-500 rounded-full cursor-n-resize"
            onMouseDown={(e) => onResizeStart(e, element.id, 'n')}
          />
          <div
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white border-2 border-blue-500 rounded-full cursor-s-resize"
            onMouseDown={(e) => onResizeStart(e, element.id, 's')}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-2 bg-white border-2 border-blue-500 rounded-full cursor-w-resize"
            onMouseDown={(e) => onResizeStart(e, element.id, 'w')}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 bg-white border-2 border-blue-500 rounded-full cursor-e-resize"
            onMouseDown={(e) => onResizeStart(e, element.id, 'e')}
          />
        </>
      )}
    </div>
  );
};

export const MemoizedCanvasElement = memo(CanvasElementComponent, (prevProps, nextProps) => {
  return (
    prevProps.element === nextProps.element &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isHovered === nextProps.isHovered &&
    prevProps.isDragging === nextProps.isDragging &&
    prevProps.tempDragOffset === nextProps.tempDragOffset &&
    prevProps.dragStartPositions === nextProps.dragStartPositions
  );
});
