export interface ContrastResult {
  ratio: number;
  passesAA: boolean;
  passesAAA: boolean;
  passesAALarge: boolean;
  passesAAALarge: boolean;
  rating: 'fail' | 'aa-large' | 'aa' | 'aaa';
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const val = c / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 0;

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

export function checkContrast(textColor: string, backgroundColor: string, isLargeText = false): ContrastResult {
  const ratio = getContrastRatio(textColor, backgroundColor);

  const aaThreshold = isLargeText ? 3 : 4.5;
  const aaaThreshold = isLargeText ? 4.5 : 7;

  const passesAA = ratio >= 4.5;
  const passesAAA = ratio >= 7;
  const passesAALarge = ratio >= 3;
  const passesAAALarge = ratio >= 4.5;

  let rating: ContrastResult['rating'] = 'fail';
  if (ratio >= aaaThreshold) {
    rating = 'aaa';
  } else if (ratio >= aaThreshold) {
    rating = 'aa';
  } else if (isLargeText && ratio >= 3) {
    rating = 'aa-large';
  }

  return {
    ratio,
    passesAA,
    passesAAA,
    passesAALarge,
    passesAAALarge,
    rating,
  };
}

export function suggestAccessibleColor(
  textColor: string,
  backgroundColor: string,
  targetRatio = 4.5
): string | null {
  const bgRgb = hexToRgb(backgroundColor);
  if (!bgRgb) return null;

  const bgLum = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);

  const targetLum = bgLum > 0.5
    ? (bgLum + 0.05) / targetRatio - 0.05
    : (bgLum + 0.05) * targetRatio - 0.05;

  const clampedLum = Math.max(0, Math.min(1, targetLum));

  const gray = Math.round(
    clampedLum <= 0.03928
      ? clampedLum * 12.92 * 255
      : (Math.pow(clampedLum, 1 / 2.4) * 1.055 - 0.055) * 255
  );

  return `#${gray.toString(16).padStart(2, '0').repeat(3)}`;
}

export function isLargeText(fontSize: number, fontWeight: string): boolean {
  if (fontSize >= 18) return true;
  if (fontSize >= 14 && (fontWeight === 'bold' || fontWeight === '700' || fontWeight === '600')) return true;
  return false;
}

export const COLOR_BLIND_SAFE_PALETTES = {
  categorical: [
    '#000000',
    '#E69F00',
    '#56B4E9',
    '#009E73',
    '#F0E442',
    '#0072B2',
    '#D55E00',
    '#CC79A7',
  ],
  sequential: [
    '#FFFFCC',
    '#FFEDA0',
    '#FED976',
    '#FEB24C',
    '#FD8D3C',
    '#FC4E2A',
    '#E31A1C',
    '#BD0026',
  ],
};
