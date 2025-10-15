import { CanvasElement } from '../lib/types';

export interface BoundaryConstraints {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface ConstrainedPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  wasConstrained: boolean;
}

export function createBoundaryConstraints(
  canvasWidth: number,
  canvasHeight: number
): BoundaryConstraints {
  return {
    minX: 0,
    minY: 0,
    maxX: canvasWidth,
    maxY: canvasHeight,
  };
}

export function constrainElementPosition(
  x: number,
  y: number,
  width: number,
  height: number,
  constraints: BoundaryConstraints
): ConstrainedPosition {
  let constrainedX = x;
  let constrainedY = y;
  let wasConstrained = false;

  if (constrainedX < constraints.minX) {
    constrainedX = constraints.minX;
    wasConstrained = true;
  }
  if (constrainedY < constraints.minY) {
    constrainedY = constraints.minY;
    wasConstrained = true;
  }
  if (constrainedX + width > constraints.maxX) {
    constrainedX = constraints.maxX - width;
    wasConstrained = true;
  }
  if (constrainedY + height > constraints.maxY) {
    constrainedY = constraints.maxY - height;
    wasConstrained = true;
  }

  return {
    x: Math.max(constraints.minX, constrainedX),
    y: Math.max(constraints.minY, constrainedY),
    width,
    height,
    wasConstrained,
  };
}

export function constrainElementResize(
  x: number,
  y: number,
  width: number,
  height: number,
  minWidth: number,
  minHeight: number,
  constraints: BoundaryConstraints
): ConstrainedPosition {
  let constrainedX = x;
  let constrainedY = y;
  let constrainedWidth = Math.max(minWidth, width);
  let constrainedHeight = Math.max(minHeight, height);
  let wasConstrained = false;

  if (constrainedX < constraints.minX) {
    const overflow = constraints.minX - constrainedX;
    constrainedX = constraints.minX;
    constrainedWidth = Math.max(minWidth, constrainedWidth - overflow);
    wasConstrained = true;
  }

  if (constrainedY < constraints.minY) {
    const overflow = constraints.minY - constrainedY;
    constrainedY = constraints.minY;
    constrainedHeight = Math.max(minHeight, constrainedHeight - overflow);
    wasConstrained = true;
  }

  if (constrainedX + constrainedWidth > constraints.maxX) {
    constrainedWidth = Math.max(minWidth, constraints.maxX - constrainedX);
    wasConstrained = true;
  }

  if (constrainedY + constrainedHeight > constraints.maxY) {
    constrainedHeight = Math.max(minHeight, constraints.maxY - constrainedY);
    wasConstrained = true;
  }

  return {
    x: constrainedX,
    y: constrainedY,
    width: constrainedWidth,
    height: constrainedHeight,
    wasConstrained,
  };
}

export function constrainGroupPosition(
  elements: CanvasElement[],
  elementIds: string[],
  deltaX: number,
  deltaY: number,
  constraints: BoundaryConstraints
): { x: number; y: number } {
  const groupElements = elements.filter(el => elementIds.includes(el.id));
  if (groupElements.length === 0) {
    return { x: deltaX, y: deltaY };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  groupElements.forEach(el => {
    const newX = el.x + deltaX;
    const newY = el.y + deltaY;
    minX = Math.min(minX, newX);
    minY = Math.min(minY, newY);
    maxX = Math.max(maxX, newX + el.width);
    maxY = Math.max(maxY, newY + el.height);
  });

  let constrainedDeltaX = deltaX;
  let constrainedDeltaY = deltaY;

  if (minX < constraints.minX) {
    constrainedDeltaX = deltaX + (constraints.minX - minX);
  } else if (maxX > constraints.maxX) {
    constrainedDeltaX = deltaX - (maxX - constraints.maxX);
  }

  if (minY < constraints.minY) {
    constrainedDeltaY = deltaY + (constraints.minY - minY);
  } else if (maxY > constraints.maxY) {
    constrainedDeltaY = deltaY - (maxY - constraints.maxY);
  }

  return { x: constrainedDeltaX, y: constrainedDeltaY };
}

export function getGroupBounds(elements: CanvasElement[], elementIds: string[]) {
  const groupElements = elements.filter(el => elementIds.includes(el.id));

  if (groupElements.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  const minX = Math.min(...groupElements.map(el => el.x));
  const minY = Math.min(...groupElements.map(el => el.y));
  const maxX = Math.max(...groupElements.map(el => el.x + el.width));
  const maxY = Math.max(...groupElements.map(el => el.y + el.height));

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
