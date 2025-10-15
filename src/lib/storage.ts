import { CanvasElement, ElementGroup } from './types';

const DB_NAME = 'ExcelToPDFBuilder';
const DB_VERSION = 3;

export interface StoredProject {
  id: string;
  name: string;
  fileName: string;
  headers: string[];
  data: Record<string, unknown>[];
  elements: CanvasElement[];
  pageSize: string;
  pageWidth: number;
  pageHeight: number;
  orientation: string;
  createdAt: string;
  updatedAt: string;
}

export interface LayerPanelPreferences {
  id: string;
  expandedGroups: string[];
  panelWidth: number;
  showHiddenElements: boolean;
  filterType: 'all' | 'text' | 'shape' | 'image' | 'bound' | 'unbound';
  updatedAt: string;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  thumbnail?: string;
  pageSize: string;
  pageWidth: number;
  pageHeight: number;
  orientation: 'portrait' | 'landscape';
  elements: CanvasElement[];
  groups: ElementGroup[];
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

export interface ExportJob {
  id: string;
  sessionId: string;
  fileName: string;
  exportMode: 'single' | 'all';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  totalRows: number;
  processedRows: number;
  progressPercentage: number;
  rowIndices: number[];
  downloadUrl: string | null;
  errorMessage: string | null;
  fileSizeBytes: number | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface AutoSaveState {
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
  savedAt: string;
}

class IndexedDBStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('projects')) {
          const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
          projectStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('layerPanelPreferences')) {
          const prefsStore = db.createObjectStore('layerPanelPreferences', { keyPath: 'id' });
          prefsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('templates')) {
          const templateStore = db.createObjectStore('templates', { keyPath: 'id' });
          templateStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          templateStore.createIndex('createdAt', 'createdAt', { unique: false });
          templateStore.createIndex('usageCount', 'usageCount', { unique: false });
        }

        if (!db.objectStoreNames.contains('exportJobs')) {
          const jobStore = db.createObjectStore('exportJobs', { keyPath: 'id' });
          jobStore.createIndex('sessionId', 'sessionId', { unique: false });
          jobStore.createIndex('status', 'status', { unique: false });
          jobStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        if (!db.objectStoreNames.contains('autoSave')) {
          db.createObjectStore('autoSave', { keyPath: 'id' });
        }
      };
    });
  }

  async saveProject(project: StoredProject): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['projects'], 'readwrite');
      const store = transaction.objectStore('projects');
      const request = store.put(project);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getProject(id: string): Promise<StoredProject | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['projects'], 'readonly');
      const store = transaction.objectStore('projects');
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async getAllProjects(): Promise<StoredProject[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['projects'], 'readonly');
      const store = transaction.objectStore('projects');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async deleteProject(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['projects'], 'readwrite');
      const store = transaction.objectStore('projects');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async saveLayerPanelPreferences(prefs: LayerPanelPreferences): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['layerPanelPreferences'], 'readwrite');
      const store = transaction.objectStore('layerPanelPreferences');
      const request = store.put(prefs);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getLayerPanelPreferences(id: string = 'default'): Promise<LayerPanelPreferences | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['layerPanelPreferences'], 'readonly');
      const store = transaction.objectStore('layerPanelPreferences');
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async saveTemplate(template: Template): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['templates'], 'readwrite');
      const store = transaction.objectStore('templates');
      const request = store.put(template);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getTemplate(id: string): Promise<Template | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['templates'], 'readonly');
      const store = transaction.objectStore('templates');
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async getAllTemplates(): Promise<Template[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['templates'], 'readonly');
      const store = transaction.objectStore('templates');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async deleteTemplate(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['templates'], 'readwrite');
      const store = transaction.objectStore('templates');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async saveExportJob(job: ExportJob): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['exportJobs'], 'readwrite');
      const store = transaction.objectStore('exportJobs');
      const request = store.put(job);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getExportJob(id: string): Promise<ExportJob | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['exportJobs'], 'readonly');
      const store = transaction.objectStore('exportJobs');
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async getAllExportJobs(): Promise<ExportJob[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['exportJobs'], 'readonly');
      const store = transaction.objectStore('exportJobs');
      const index = store.index('createdAt');
      const request = index.openCursor(null, 'prev');
      const results: ExportJob[] = [];

      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
    });
  }

  async deleteExportJob(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['exportJobs'], 'readwrite');
      const store = transaction.objectStore('exportJobs');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async saveAutoSaveState(state: AutoSaveState): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['autoSave'], 'readwrite');
      const store = transaction.objectStore('autoSave');
      const request = store.put(state);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getAutoSaveState(id: string = 'current'): Promise<AutoSaveState | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['autoSave'], 'readonly');
      const store = transaction.objectStore('autoSave');
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async clearAutoSaveState(id: string = 'current'): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['autoSave'], 'readwrite');
      const store = transaction.objectStore('autoSave');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

export const storage = new IndexedDBStorage();
