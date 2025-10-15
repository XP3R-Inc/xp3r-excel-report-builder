import { CanvasElement, DataBinding } from '../lib/types';
import { formatMultipleBindings, formatDataValue } from './dataFormatter';

export function estimateTextOverflow(
  element: CanvasElement,
  dataRow: Record<string, unknown>
): { willOverflow: boolean; currentLength: number; estimatedMaxLength: number } {
  if (element.type !== 'text') {
    return { willOverflow: false, currentLength: 0, estimatedMaxLength: 0 };
  }

  let text = '';

  if (element.dataBindings && element.dataBindings.length > 0) {
    text = formatMultipleBindings(dataRow, element.dataBindings, element.bindingSeparator || ' ');
  } else if (element.dataBinding && dataRow[element.dataBinding]) {
    if (element.isList) {
      const items = String(dataRow[element.dataBinding]).split(element.listDelimiter || ',');
      const layout = element.listLayout || 'vertical';
      const style = element.listStyle || 'none';

      text = items.map((item, idx) => {
        let prefix = '';
        if (style === 'bullets') prefix = '• ';
        if (style === 'numbers') prefix = `${idx + 1}. `;
        return prefix + item.trim();
      }).join(layout === 'horizontal' ? '  ' : '\n');
    } else {
      text = String(dataRow[element.dataBinding]);
    }
  } else {
    text = element.content || '';
  }

  const currentLength = text.length;

  const fontSize = element.style?.fontSize || 16;
  const width = element.width;
  const height = element.height;
  const padding = element.style?.padding || 0;
  const lineHeight = element.style?.lineHeight || 1.5;

  const availableWidth = width - (padding * 2);
  const availableHeight = height - (padding * 2);

  const avgCharWidth = fontSize * 0.6;
  const charsPerLine = Math.floor(availableWidth / avgCharWidth);
  const lineHeightPx = fontSize * lineHeight;
  const maxLines = Math.floor(availableHeight / lineHeightPx);

  let estimatedMaxLength: number;

  if (element.isList && element.listLayout === 'vertical') {
    estimatedMaxLength = charsPerLine * maxLines;
  } else {
    estimatedMaxLength = charsPerLine * maxLines;
  }

  const lines = text.split('\n');
  let totalLines = 0;
  for (const line of lines) {
    const lineChars = line.length;
    totalLines += Math.ceil(lineChars / charsPerLine) || 1;
  }

  const willOverflow = totalLines > maxLines;

  return {
    willOverflow,
    currentLength,
    estimatedMaxLength: Math.floor(estimatedMaxLength * 0.9),
  };
}

export function findMaxDataLength(
  element: CanvasElement,
  allData: Record<string, unknown>[]
): { maxLength: number; maxRow: number; willOverflow: boolean } {
  if (!element.dataBinding && (!element.dataBindings || element.dataBindings.length === 0)) {
    return { maxLength: 0, maxRow: 0, willOverflow: false };
  }

  let maxLength = 0;
  let maxRow = 0;
  let maxOverflow = false;

  allData.forEach((row, index) => {
    const result = estimateTextOverflow(element, row);
    if (result.currentLength > maxLength) {
      maxLength = result.currentLength;
      maxRow = index;
      maxOverflow = result.willOverflow;
    }
  });

  return { maxLength, maxRow, willOverflow: maxOverflow };
}
