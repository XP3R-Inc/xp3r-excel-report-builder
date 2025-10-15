import { CanvasElement } from '../lib/types';

export interface OverflowRenderStyle {
  fontSize: number;
  lineHeight: number;
  overflow: string;
  overflowY: string;
  textOverflow: string;
  whiteSpace: string;
  wordBreak: string;
  hyphens: string;
  display: string;
  WebkitLineClamp?: number;
  WebkitBoxOrient?: 'vertical';
}

export function calculateOverflowStyle(
  element: CanvasElement,
  textContent: string
): OverflowRenderStyle {
  const strategy = element.overflowStrategy || 'wrap';
  const baseFontSize = element.style?.fontSize || 16;
  const baseLineHeight = element.style?.lineHeight || 1.5;
  const minFontSize = element.minFontSize || 8;
  const hyphenation = element.hyphenation || false;
  const wordBreak = element.wordBreak || 'word';

  const baseStyle: OverflowRenderStyle = {
    fontSize: baseFontSize,
    lineHeight: baseLineHeight,
    overflow: 'hidden',
    overflowY: 'hidden',
    textOverflow: 'clip',
    whiteSpace: 'normal',
    wordBreak: wordBreak === 'character' ? 'break-all' : 'break-word',
    hyphens: hyphenation ? 'auto' : 'none',
    display: 'flex',
  };

  switch (strategy) {
    case 'wrap':
      return {
        ...baseStyle,
        whiteSpace: 'normal',
        overflowY: 'hidden',
      };

    case 'auto-shrink': {
      const availableWidth = element.width - (element.style?.padding || 0) * 2;
      const availableHeight = element.height - (element.style?.padding || 0) * 2;
      const avgCharWidth = baseFontSize * 0.6;
      const charsPerLine = Math.floor(availableWidth / avgCharWidth);
      const lineHeightPx = baseFontSize * baseLineHeight;
      const maxLines = Math.floor(availableHeight / lineHeightPx);

      const lines = textContent.split('\n');
      let totalLines = 0;
      for (const line of lines) {
        totalLines += Math.ceil(line.length / charsPerLine) || 1;
      }

      let adjustedFontSize = baseFontSize;
      if (totalLines > maxLines) {
        const shrinkFactor = maxLines / totalLines;
        adjustedFontSize = Math.max(minFontSize, baseFontSize * shrinkFactor);
      }

      return {
        ...baseStyle,
        fontSize: adjustedFontSize,
        whiteSpace: 'normal',
        overflowY: 'hidden',
      };
    }

    case 'truncate':
      return {
        ...baseStyle,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: 'block',
      };

    case 'scale-line-height': {
      const availableHeight = element.height - (element.style?.padding || 0) * 2;
      const lineHeightPx = baseFontSize * baseLineHeight;
      const estimatedLines = Math.ceil(textContent.length / 50);
      const requiredHeight = estimatedLines * lineHeightPx;

      let adjustedLineHeight = baseLineHeight;
      if (requiredHeight > availableHeight) {
        adjustedLineHeight = Math.max(1.0, (availableHeight / (estimatedLines * baseFontSize)));
      }

      return {
        ...baseStyle,
        lineHeight: adjustedLineHeight,
        whiteSpace: 'normal',
        overflowY: 'hidden',
      };
    }

    case 'auto-expand':
      return {
        ...baseStyle,
        whiteSpace: 'normal',
        overflowY: 'auto',
        overflow: 'visible',
      };

    default:
      return baseStyle;
  }
}
