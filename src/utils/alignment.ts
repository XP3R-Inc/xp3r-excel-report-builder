import { CanvasElement } from '../lib/types';

export type AlignmentType = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';

export function alignElements(
  elements: CanvasElement[],
  selectedIds: string[],
  alignment: AlignmentType,
  canvasWidth: number,
  canvasHeight: number
): CanvasElement[] {
  const selectedElements = elements.filter(el => selectedIds.includes(el.id));
  if (selectedElements.length === 0) return elements;

  const bounds = getSelectionBounds(selectedElements);

  return elements.map(element => {
    if (!selectedIds.includes(element.id)) return element;

    const updated = { ...element };

    switch (alignment) {
      case 'left':
        updated.x = bounds.minX;
        break;
      case 'center':
        updated.x = bounds.minX + (bounds.width - element.width) / 2;
        break;
      case 'right':
        updated.x = bounds.maxX - element.width;
        break;
      case 'top':
        updated.y = bounds.minY;
        break;
      case 'middle':
        updated.y = bounds.minY + (bounds.height - element.height) / 2;
        break;
      case 'bottom':
        updated.y = bounds.maxY - element.height;
        break;
    }

    return updated;
  });
}

export function distributeElements(
  elements: CanvasElement[],
  selectedIds: string[],
  direction: 'horizontal' | 'vertical'
): CanvasElement[] {
  const selectedElements = elements.filter(el => selectedIds.includes(el.id));
  if (selectedElements.length < 3) return elements;

  const sorted = [...selectedElements].sort((a, b) =>
    direction === 'horizontal' ? a.x - b.x : a.y - b.y
  );

  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const totalSpace = direction === 'horizontal'
    ? (last.x + last.width) - first.x
    : (last.y + last.height) - first.y;

  const totalElementSize = sorted.reduce((sum, el) =>
    sum + (direction === 'horizontal' ? el.width : el.height), 0
  );

  const gap = (totalSpace - totalElementSize) / (sorted.length - 1);

  let currentPos = direction === 'horizontal' ? first.x : first.y;

  const updates = new Map<string, Partial<CanvasElement>>();

  sorted.forEach(el => {
    if (direction === 'horizontal') {
      updates.set(el.id, { x: currentPos });
      currentPos += el.width + gap;
    } else {
      updates.set(el.id, { y: currentPos });
      currentPos += el.height + gap;
    }
  });

  return elements.map(element => {
    const update = updates.get(element.id);
    return update ? { ...element, ...update } : element;
  });
}

function getSelectionBounds(elements: CanvasElement[]) {
  const minX = Math.min(...elements.map(el => el.x));
  const minY = Math.min(...elements.map(el => el.y));
  const maxX = Math.max(...elements.map(el => el.x + el.width));
  const maxY = Math.max(...elements.map(el => el.y + el.height));

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
