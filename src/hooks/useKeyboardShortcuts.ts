import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: (event: KeyboardEvent) => void;
  description?: string;
  preventDefault?: boolean;
  enabled?: boolean;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
  target?: HTMLElement | Document;
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

export const getModifierKey = () => (isMac ? 'Cmd' : 'Ctrl');

export function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase() ||
    event.code.toLowerCase() === shortcut.key.toLowerCase();

  if (!keyMatches) return false;

  const ctrlPressed = isMac ? event.metaKey : event.ctrlKey;
  const metaPressed = event.metaKey;

  const ctrlMatches = shortcut.ctrl ? ctrlPressed : true;
  const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
  const altMatches = shortcut.alt ? event.altKey : !event.altKey;
  const metaMatches = shortcut.meta ? metaPressed : true;

  if (shortcut.ctrl && !ctrlPressed) return false;
  if (shortcut.shift && !event.shiftKey) return false;
  if (shortcut.alt && !event.altKey) return false;
  if (shortcut.meta && !metaPressed) return false;

  if (!shortcut.ctrl && ctrlPressed && !isMac) return false;
  if (!shortcut.meta && metaPressed) return false;
  if (!shortcut.alt && event.altKey) return false;

  return true;
}

export function useKeyboardShortcuts({ shortcuts, enabled = true, target }: UseKeyboardShortcutsOptions) {
  const shortcutsRef = useRef(shortcuts);

  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const activeElement = document.activeElement;
    const isInputField = activeElement instanceof HTMLInputElement ||
      activeElement instanceof HTMLTextAreaElement ||
      activeElement?.getAttribute('contenteditable') === 'true';

    for (const shortcut of shortcutsRef.current) {
      if (shortcut.enabled === false) continue;

      if (matchesShortcut(event, shortcut)) {
        if (isInputField && !shortcut.ctrl && !shortcut.meta && shortcut.key.length === 1) {
          continue;
        }

        if (shortcut.preventDefault !== false) {
          event.preventDefault();
          event.stopPropagation();
        }

        shortcut.handler(event);
        break;
      }
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const targetElement = target || document;
    targetElement.addEventListener('keydown', handleKeyDown as EventListener);

    return () => {
      targetElement.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [handleKeyDown, enabled, target]);
}

export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.ctrl) parts.push(isMac ? '⌘' : 'Ctrl');
  if (shortcut.shift) parts.push(isMac ? '⇧' : 'Shift');
  if (shortcut.alt) parts.push(isMac ? '⌥' : 'Alt');

  let key = shortcut.key;
  if (key === 'ArrowUp') key = '↑';
  else if (key === 'ArrowDown') key = '↓';
  else if (key === 'ArrowLeft') key = '←';
  else if (key === 'ArrowRight') key = '→';
  else if (key === ' ') key = 'Space';
  else key = key.charAt(0).toUpperCase() + key.slice(1);

  parts.push(key);

  return parts.join(isMac ? '' : '+');
}
