import { useState, useCallback } from 'react';
import { CanvasElement } from '../lib/types';

interface ClipboardData {
  elements: CanvasElement[];
  timestamp: number;
  isCut?: boolean;
}

const CLIPBOARD_KEY = 'canvas-clipboard';

export function useClipboard() {
  const [clipboard, setClipboardState] = useState<ClipboardData | null>(() => {
    try {
      const stored = localStorage.getItem(CLIPBOARD_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const setClipboard = useCallback((data: ClipboardData | null) => {
    setClipboardState(data);
    try {
      if (data) {
        localStorage.setItem(CLIPBOARD_KEY, JSON.stringify(data));
      } else {
        localStorage.removeItem(CLIPBOARD_KEY);
      }
    } catch (error) {
      console.error('Failed to save clipboard data:', error);
    }
  }, []);

  const copy = useCallback((elements: CanvasElement[]) => {
    if (elements.length === 0) return;

    const data: ClipboardData = {
      elements: elements.map(el => ({ ...el })),
      timestamp: Date.now(),
      isCut: false,
    };
    setClipboard(data);
  }, [setClipboard]);

  const cut = useCallback((elements: CanvasElement[]) => {
    if (elements.length === 0) return;

    const data: ClipboardData = {
      elements: elements.map(el => ({ ...el })),
      timestamp: Date.now(),
      isCut: true,
    };
    setClipboard(data);
  }, [setClipboard]);

  const paste = useCallback((offsetX = 10, offsetY = 10): CanvasElement[] | null => {
    if (!clipboard || clipboard.elements.length === 0) return null;

    const pastedElements = clipboard.elements.map(el => ({
      ...el,
      id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x: el.x + offsetX,
      y: el.y + offsetY,
    }));

    if (clipboard.isCut) {
      setClipboard(null);
    }

    return pastedElements;
  }, [clipboard, setClipboard]);

  const clear = useCallback(() => {
    setClipboard(null);
  }, [setClipboard]);

  const hasClipboard = clipboard !== null && clipboard.elements.length > 0;

  return {
    clipboard,
    copy,
    cut,
    paste,
    clear,
    hasClipboard,
  };
}
