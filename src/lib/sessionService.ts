import { CanvasElement, ElementGroup } from './types';
import { storage } from './storage';

export interface WorkspaceSession {
  id: string;
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
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
}

export async function saveSession(sessionData: Omit<WorkspaceSession, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkspaceSession> {
  const sessionId = `session-${Date.now()}`;
  const now = new Date().toISOString();

  const session: WorkspaceSession = {
    id: sessionId,
    ...sessionData,
    createdAt: now,
    updatedAt: now,
  };

  await storage.saveAutoSaveState({
    ...session,
    savedAt: now,
  });

  return session;
}

export async function updateSession(id: string, updates: Partial<WorkspaceSession>): Promise<void> {
  const existing = await storage.getAutoSaveState(id);
  if (existing) {
    await storage.saveAutoSaveState({
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }
}

export async function getSession(id: string): Promise<WorkspaceSession | null> {
  return await storage.getAutoSaveState(id);
}

export async function getRecentSessions(_limit: number = 10): Promise<WorkspaceSession[]> {
  const session = await storage.getAutoSaveState('current');
  return session ? [session] : [];
}

export async function deleteSession(id: string): Promise<void> {
  await storage.clearAutoSaveState(id);
}

export async function cleanupOldSessions(_daysToKeep: number = 30): Promise<void> {
  // IndexedDB doesn't need active cleanup as we only store 'current' session
  // This function is kept for API compatibility
}
