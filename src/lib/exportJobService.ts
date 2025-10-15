import { storage, ExportJob } from './storage';

export type { ExportJob };

export interface CreateExportJobParams {
  fileName: string;
  exportMode: 'single' | 'all';
  totalRows: number;
  rowIndices?: number[];
}

export interface UpdateExportJobParams {
  status?: ExportJob['status'];
  processedRows?: number;
  progressPercentage?: number;
  downloadUrl?: string;
  errorMessage?: string;
  fileSizeBytes?: number;
  startedAt?: string;
  completedAt?: string;
}

function getSessionId(): string {
  let sessionId = sessionStorage.getItem('export_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem('export_session_id', sessionId);
  }
  return sessionId;
}

export async function createExportJob(params: CreateExportJobParams): Promise<ExportJob> {
  const sessionId = getSessionId();

  const job: ExportJob = {
    id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    sessionId,
    fileName: params.fileName,
    exportMode: params.exportMode,
    totalRows: params.totalRows,
    rowIndices: params.rowIndices || [],
    processedRows: 0,
    progressPercentage: 0,
    status: 'pending',
    downloadUrl: null,
    errorMessage: null,
    fileSizeBytes: null,
    createdAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
  };

  await storage.saveExportJob(job);
  notifyJobUpdate(job);

  return job;
}

export async function updateExportJob(
  jobId: string,
  updates: UpdateExportJobParams
): Promise<ExportJob> {
  const existingJob = await storage.getExportJob(jobId);

  if (!existingJob) {
    throw new Error(`Export job not found: ${jobId}`);
  }

  const updatedJob: ExportJob = {
    ...existingJob,
    ...(updates.status !== undefined && { status: updates.status }),
    ...(updates.processedRows !== undefined && { processedRows: updates.processedRows }),
    ...(updates.progressPercentage !== undefined && { progressPercentage: updates.progressPercentage }),
    ...(updates.downloadUrl !== undefined && { downloadUrl: updates.downloadUrl }),
    ...(updates.errorMessage !== undefined && { errorMessage: updates.errorMessage }),
    ...(updates.fileSizeBytes !== undefined && { fileSizeBytes: updates.fileSizeBytes }),
    ...(updates.startedAt !== undefined && { startedAt: updates.startedAt }),
    ...(updates.completedAt !== undefined && { completedAt: updates.completedAt }),
  };

  await storage.saveExportJob(updatedJob);
  notifyJobUpdate(updatedJob);

  return updatedJob;
}

export async function getExportJob(jobId: string): Promise<ExportJob | null> {
  return await storage.getExportJob(jobId);
}

export async function getExportJobs(): Promise<ExportJob[]> {
  const sessionId = getSessionId();
  const allJobs = await storage.getAllExportJobs();

  return allJobs.filter(job => job.sessionId === sessionId);
}

export async function deleteExportJob(jobId: string): Promise<void> {
  await storage.deleteExportJob(jobId);
  notifyJobsUpdate();
}

type JobUpdateCallback = (job: ExportJob) => void;
type JobsUpdateCallback = (jobs: ExportJob[]) => void;

const jobUpdateListeners = new Map<string, Set<JobUpdateCallback>>();
const jobsUpdateListeners = new Set<JobsUpdateCallback>();

function notifyJobUpdate(job: ExportJob) {
  const listeners = jobUpdateListeners.get(job.id);
  if (listeners) {
    listeners.forEach(callback => callback(job));
  }
  notifyJobsUpdate();
}

async function notifyJobsUpdate() {
  const jobs = await getExportJobs();
  jobsUpdateListeners.forEach(callback => callback(jobs));
}

export function subscribeToExportJob(
  jobId: string,
  callback: JobUpdateCallback
): () => void {
  if (!jobUpdateListeners.has(jobId)) {
    jobUpdateListeners.set(jobId, new Set());
  }

  const listeners = jobUpdateListeners.get(jobId)!;
  listeners.add(callback);

  const pollInterval = setInterval(async () => {
    const job = await getExportJob(jobId);
    if (job) {
      callback(job);

      if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
        clearInterval(pollInterval);
      }
    }
  }, 500);

  return () => {
    listeners.delete(callback);
    if (listeners.size === 0) {
      jobUpdateListeners.delete(jobId);
    }
    clearInterval(pollInterval);
  };
}

export function subscribeToExportJobs(callback: JobsUpdateCallback): () => void {
  jobsUpdateListeners.add(callback);

  (async () => {
    const jobs = await getExportJobs();
    callback(jobs);
  })();

  const pollInterval = setInterval(async () => {
    const jobs = await getExportJobs();
    callback(jobs);
  }, 1000);

  return () => {
    jobsUpdateListeners.delete(callback);
    clearInterval(pollInterval);
  };
}
