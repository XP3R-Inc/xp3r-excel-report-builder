import { useEffect, useState } from 'react';
import { X, Download, Trash2, Clock, CheckCircle, XCircle, Loader2, FileText, Package } from 'lucide-react';
import { ExportJob, getExportJobs, deleteExportJob, subscribeToExportJobs } from '../lib/exportJobService';

interface ExportStatusPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: (url: string) => void;
  onViewProgress: (job: ExportJob) => void;
}

export function ExportStatusPanel({
  isOpen,
  onClose,
  onDownload,
  onViewProgress,
}: ExportStatusPanelProps) {
  const [jobs, setJobs] = useState<ExportJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    loadJobs();

    const unsubscribe = subscribeToExportJobs((updatedJobs) => {
      setJobs(updatedJobs);
    });

    return () => {
      unsubscribe();
    };
  }, [isOpen]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await getExportJobs();
      setJobs(data);
    } catch (error) {
      console.error('Failed to load export jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (jobId: string) => {
    try {
      await deleteExportJob(jobId);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    } catch (error) {
      console.error('Failed to delete export job:', error);
    }
  };

  const handleClearCompleted = async () => {
    const completedJobs = jobs.filter(
      (job) => job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled'
    );

    for (const job of completedJobs) {
      try {
        await deleteExportJob(job.id);
      } catch (error) {
        console.error('Failed to delete job:', error);
      }
    }

    await loadJobs();
  };

  const getStatusIcon = (status: ExportJob['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-gray-400" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: ExportJob['status']) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    switch (status) {
      case 'pending':
        return `${baseClasses} bg-gray-100 text-gray-700`;
      case 'processing':
        return `${baseClasses} bg-blue-100 text-blue-700`;
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-700`;
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-700`;
      case 'cancelled':
        return `${baseClasses} bg-orange-100 text-orange-700`;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const pendingJobs = jobs.filter((j) => j.status === 'pending' || j.status === 'processing');
  const completedJobs = jobs.filter((j) => j.status === 'completed');
  const failedJobs = jobs.filter((j) => j.status === 'failed' || j.status === 'cancelled');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Export History</h2>
            <p className="text-sm text-gray-600 mt-1">
              {pendingJobs.length} pending, {completedJobs.length} completed, {failedJobs.length} failed
            </p>
          </div>
          <div className="flex items-center gap-2">
            {jobs.some((j) => j.status === 'completed' || j.status === 'failed' || j.status === 'cancelled') && (
              <button
                onClick={handleClearCompleted}
                className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Clear Completed
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No exports yet</h3>
              <p className="text-sm text-gray-600">
                Export history will appear here after you create your first export
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div
                  key={job.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {job.exportMode === 'single' ? (
                        <FileText className="w-6 h-6 text-gray-400" />
                      ) : (
                        <Package className="w-6 h-6 text-gray-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {job.fileName}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {job.exportMode === 'single' ? 'Single PDF' : `Batch Export (${job.totalRows} rows)`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={getStatusBadge(job.status)}>
                            {job.status}
                          </span>
                          {getStatusIcon(job.status)}
                        </div>
                      </div>

                      {(job.status === 'processing' || job.status === 'pending') && (
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>{job.progressPercentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${job.progressPercentage}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          {formatDate(job.createdAt)}
                        </p>
                        <div className="flex items-center gap-2">
                          {job.status === 'completed' && job.downloadUrl && (
                            <button
                              onClick={() => onDownload(job.downloadUrl!)}
                              className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                              Download
                            </button>
                          )}
                          {(job.status === 'processing' || job.status === 'pending') && (
                            <button
                              onClick={() => onViewProgress(job)}
                              className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            >
                              View Progress
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(job.id)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {job.errorMessage && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                          {job.errorMessage}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
