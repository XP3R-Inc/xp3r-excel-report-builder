import { useState, useEffect } from 'react';
import { Upload, FileText, History, Plus, X, Clock, FileSpreadsheet } from 'lucide-react';
import { WorkspaceSession, getRecentSessions } from '../lib/sessionService';

interface StartupModalProps {
  isOpen: boolean;
  onUploadData: () => void;
  onImportTemplate: () => void;
  onStartBlank: () => void;
  onResumeSession: (session: WorkspaceSession) => void;
  onClose: () => void;
}

export function StartupModal({
  isOpen,
  onUploadData,
  onImportTemplate,
  onStartBlank,
  onResumeSession,
  onClose,
}: StartupModalProps) {
  const [recentSessions, setRecentSessions] = useState<WorkspaceSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadRecentSessions();
    }
  }, [isOpen]);

  const loadRecentSessions = async () => {
    setLoading(true);
    const sessions = await getRecentSessions(5);
    setRecentSessions(sessions);
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-7 h-7 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Excel to PDF Builder</h2>
              <p className="text-sm text-gray-600">Choose how to get started</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => {
                onUploadData();
                onClose();
              }}
              className="group relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg transition-all"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Upload Data</h3>
                <p className="text-xs text-gray-600">Start with Excel or CSV</p>
              </div>
            </button>

            <button
              onClick={() => {
                onImportTemplate();
                onClose();
              }}
              className="group relative bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border-2 border-green-200 hover:border-green-400 hover:shadow-lg transition-all"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-green-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Import Template</h3>
                <p className="text-xs text-gray-600">Load from JSON file</p>
              </div>
            </button>

            <button
              onClick={() => {
                onStartBlank();
                onClose();
              }}
              className="group relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border-2 border-gray-200 hover:border-gray-400 hover:shadow-lg transition-all"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-gray-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Plus className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Blank Canvas</h3>
                <p className="text-xs text-gray-600">Start from scratch</p>
              </div>
            </button>
          </div>

          {recentSessions.length > 0 && (
            <div className="border-t pt-6">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-gray-600" />
                <h3 className="text-base font-bold text-gray-900">Recent Sessions</h3>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentSessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => {
                        onResumeSession(session);
                        onClose();
                      }}
                      className="w-full flex items-center gap-4 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 hover:border-gray-300 transition-all text-left"
                    >
                      {session.thumbnail ? (
                        <img
                          src={session.thumbnail}
                          alt={session.fileName}
                          className="w-16 h-16 object-cover rounded border border-gray-300"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded border border-gray-300 flex items-center justify-center">
                          <FileSpreadsheet className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">
                          {session.fileName || 'Untitled'}
                        </h4>
                        <p className="text-xs text-gray-600">
                          {session.excelData?.rowCount || 0} rows • {session.elements.length} elements
                        </p>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(session.updatedAt)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
