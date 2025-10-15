import { storage, AutoSaveState } from './storage';
import { CanvasElement, ElementGroup } from './types';

export interface AutoSaveData {
  fileName: string;
  excelData: {
    headers: string[];
    data: Record<string, unknown>[];
    rowCount: number;
  } | null;
  pageSize: string;
  pageWidth: number;
  pageHeight: number;
  orientation: 'portrait' | 'landscape';
  elements: CanvasElement[];
  groups: ElementGroup[];
  currentRowIndex: number;
}

let autoSaveTimeout: ReturnType<typeof setTimeout> | null = null;
const AUTO_SAVE_DELAY = 2000;

export async function saveWorkspace(data: AutoSaveData): Promise<void> {
  if (autoSaveTimeout) {
    clearTimeout(autoSaveTimeout);
  }

  autoSaveTimeout = setTimeout(async () => {
    try {
      const state: AutoSaveState = {
        id: 'current',
        ...data,
        savedAt: new Date().toISOString(),
      };

      await storage.saveAutoSaveState(state);
      notifyAutoSaveComplete();
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, AUTO_SAVE_DELAY);
}

export async function loadWorkspace(): Promise<AutoSaveState | null> {
  try {
    return await storage.getAutoSaveState('current');
  } catch (error) {
    console.error('Failed to load workspace:', error);
    return null;
  }
}

export async function clearWorkspace(): Promise<void> {
  try {
    await storage.clearAutoSaveState('current');
  } catch (error) {
    console.error('Failed to clear workspace:', error);
  }
}

type AutoSaveCompleteCallback = () => void;
const autoSaveCompleteListeners = new Set<AutoSaveCompleteCallback>();

function notifyAutoSaveComplete() {
  autoSaveCompleteListeners.forEach(callback => callback());
}

export function subscribeToAutoSave(callback: AutoSaveCompleteCallback): () => void {
  autoSaveCompleteListeners.add(callback);

  return () => {
    autoSaveCompleteListeners.delete(callback);
  };
}
