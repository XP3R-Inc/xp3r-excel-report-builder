import { useEffect, useState } from 'react';
import { X, Loader2, CheckCircle, XCircle, Download } from 'lucide-react';
import { ExportJob, subscribeToExportJob } from '../lib/exportJobService';

interface ExportProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: ExportJob | null;
  onDownload?: (url: string) => void;
}

export function ExportProgressModal({
  isOpen,
  onClose,
  job: initialJob,
  onDownload,
}: ExportProgressModalProps) {
  const [job, setJob] = useState<ExportJob | null>(initialJob);

  useEffect(() => {
    setJob(initialJob);
  }, [initialJob]);

  useEffect(() => {
    if (!job?.id) return;

    const unsubscribe = subscribeToExportJob(job.id, (updatedJob) => {
      setJob(updatedJob);
    });

    return () => {
      unsubscribe();
    };
  }, [job?.id]);

  const handleDownload = () => {
    if (job?.downloadUrl && onDownload) {
      onDownload(job.downloadUrl);
    }
  };

  const getStatusIcon = () => {
    if (!job) return null;

    switch (job.status) {
      case 'processing':
      case 'pending':
        return <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="w-8 h-8 text-red-500" />;
    }
  };

  const getStatusText = () => {
    if (!job) return '';

    switch (job.status) {
      case 'pending':
        return 'Export queued...';
      case 'processing':
        return 'Exporting...';
      case 'completed':
        return 'Export completed!';
      case 'failed':
        return 'Export failed';
      case 'cancelled':
        return 'Export cancelled';
    }
  };

  const getStatusColor = () => {
    if (!job) return 'bg-gray-200';

    switch (job.status) {
      case 'processing':
      case 'pending':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'failed':
      case 'cancelled':
        return 'bg-red-500';
    }
  };

  if (!isOpen || !job) return null;

  const canClose = job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Export Progress</h2>
          {canClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        <div className="p-6">
          <div className="flex flex-col items-center">
            <div className="mb-4">{getStatusIcon()}</div>

            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {getStatusText()}
            </h3>

            <p className="text-sm text-gray-600 mb-4 text-center">
              {job.fileName}
            </p>

            {(job.status === 'processing' || job.status === 'pending') && (
              <>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getStatusColor()}`}
                    style={{ width: `${job.progressPercentage}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {job.processedRows} of {job.totalRows} rows ({job.progressPercentage}%)
                </p>
                {job.totalRows > 1 && job.processedRows > 0 && (
                  <p className="text-xs text-gray-500">
                    Estimated time remaining: {
                      Math.ceil((job.totalRows - job.processedRows) * 0.5)
                    }s
                  </p>
                )}
              </>
            )}

            {job.status === 'completed' && job.downloadUrl && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-5 h-5" />
                Download {job.exportMode === 'all' ? 'ZIP' : 'PDF'}
              </button>
            )}

            {job.status === 'failed' && job.errorMessage && (
              <div className="w-full mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>Error:</strong> {job.errorMessage}
                </p>
              </div>
            )}

            {job.status === 'completed' && (
              <div className="w-full mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm text-green-800 space-y-1">
                  <p>
                    <strong>Mode:</strong> {job.exportMode === 'single' ? 'Single PDF' : 'Batch ZIP'}
                  </p>
                  <p>
                    <strong>Rows exported:</strong> {job.totalRows}
                  </p>
                  {job.fileSizeBytes && (
                    <p>
                      <strong>File size:</strong> {(job.fileSizeBytes / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {canClose && (
          <div className="flex items-center justify-end gap-3 p-6 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
