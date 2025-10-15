import { useState, useEffect } from 'react';
import { FileSpreadsheet, Eye, Download, Database, Upload, FileUp, History, Save, Home, Pencil, FileDown, Ruler } from 'lucide-react';
import { useToast } from './contexts/ToastContext';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useExport } from './hooks/useExport';
import { ExcelUploader } from './components/ExcelUploader';
import { DataPreview } from './components/DataPreview';
import { PageSizeSelector, PAGE_SIZES, PageSize } from './components/PageSizeSelector';
import { CanvasWorkspace } from './components/CanvasWorkspace';
import { PreviewModal } from './components/PreviewModal';
import { DataEditModal } from './components/DataEditModal';
import { RowSelectionModal } from './components/RowSelectionModal';
import { ExportProgressModal } from './components/ExportProgressModal';
import { ExportStatusPanel } from './components/ExportStatusPanel';
import { StartupModal } from './components/StartupModal';
import { ConfirmModal } from './components/ConfirmModal';
import { ParsedExcelData } from './utils/excelParser';
import { CanvasElement, ElementGroup } from './lib/types';
import { ExportJob } from './lib/exportJobService';
import { saveTemplateWithThumbnail, importTemplateFromJSON, exportTemplateToJSON } from './lib/templateService';
import type { Template } from './lib/templateService';
import { InputModal } from './components/InputModal';
import { saveWorkspace, clearWorkspace } from './lib/autoSaveService';
import { WorkspaceSession } from './lib/sessionService';

type Step = 'upload' | 'preview' | 'canvas';

function App() {
  const [step, setStep] = useState<Step | null>(null);
  const [showStartupModal, setShowStartupModal] = useState(true);
  const [excelData, setExcelData] = useState<ParsedExcelData | null>(null);
  const [fileName, setFileName] = useState('');
  const [pageSize, setPageSize] = useState<PageSize>(PAGE_SIZES[0]);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [groups, setGroups] = useState<ElementGroup[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showDataEdit, setShowDataEdit] = useState(false);
  const [previewRowIndex, setPreviewRowIndex] = useState(0);
  const [showRowSelection, setShowRowSelection] = useState(false);
  const [showExportProgress, setShowExportProgress] = useState(false);
  const [showExportStatus, setShowExportStatus] = useState(false);
  const [currentExportJob, setCurrentExportJob] = useState<ExportJob | null>(null);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [isCanvasInteracting, setIsCanvasInteracting] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    danger?: boolean;
  } | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);

  const toast = useToast();
  const currentWidth = orientation === 'portrait' ? pageSize.width : pageSize.height;
  const currentHeight = orientation === 'portrait' ? pageSize.height : pageSize.width;

  const { startExport, downloadFile, isExporting } = useExport({
    elements,
    data: excelData?.data || [],
    fileName: fileName.replace(/\.[^/.]+$/, ''),
    pageWidth: currentWidth,
    pageHeight: currentHeight,
  });

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && (elements.length > 0 || excelData)) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, elements, excelData]);

  useEffect(() => {
    if (elements.length > 0 || excelData) {
      setHasUnsavedChanges(true);
    }
  }, [elements, excelData]);

  useEffect(() => {
    if (step === 'canvas' && excelData && !isUserInteracting) {
      const timeoutId = setTimeout(() => {
        autoSave();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [step, excelData, elements, groups, pageSize, orientation, previewRowIndex, isUserInteracting]);

  const handleResumeSession = async (session: WorkspaceSession) => {
    setFileName(session.fileName);
    setExcelData(session.excelData);

    const restoredPageSize = PAGE_SIZES.find(ps => ps.name === session.pageSize) || PAGE_SIZES[0];
    setPageSize(restoredPageSize);
    setOrientation(session.orientation);
    setElements(session.elements);
    setGroups(session.groups);
    setPreviewRowIndex(session.currentRowIndex);
    setStep('canvas');

    toast.success('Session restored', 'Your previous work has been restored');
  };


  const autoSave = async () => {
    if (!excelData) return;

    await saveWorkspace({
      fileName,
      excelData,
      pageSize: pageSize.name,
      pageWidth: currentWidth,
      pageHeight: currentHeight,
      orientation,
      elements,
      groups,
      currentRowIndex: previewRowIndex,
    });
  };

  const handleStartBlank = () => {
    setStep('upload');
  };

  const handleUploadData = () => {
    setStep('upload');
  };

  const handleImportTemplate = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const json = event.target?.result as string;
            const imported = await importTemplateFromJSON(json);
            setElements(imported.elements);
            setGroups(imported.groups);
            const templatePageSize = PAGE_SIZES.find(ps => ps.name === imported.pageSize) || PAGE_SIZES[0];
            setPageSize(templatePageSize);
            setOrientation(imported.orientation);
            setStep('upload');
            toast.success('Template imported', `"${imported.name}" has been imported`);
          } catch (error) {
            toast.error('Failed to import template', 'Invalid template file');
          }
        };
        reader.readAsText(file);
      } catch (error) {
        console.error('Failed to import template:', error);
        toast.error('Failed to import template', 'Could not read the template file');
      }
    };
    input.click();
  };

  const handleDataParsed = (data: ParsedExcelData, name: string) => {
    setExcelData(data);
    setFileName(name);
    setStep('preview');
  };

  const handleConfirmData = () => {
    setStep('canvas');
  };

  const handleCancelPreview = () => {
    setStep('upload');
    setExcelData(null);
    setFileName('');
  };

  const handleStartOver = async () => {
    setConfirmModal({
      isOpen: true,
      title: 'Start Over',
      message: 'Are you sure you want to start over? Unsaved changes will be lost.',
      onConfirm: async () => {
        await clearWorkspace();
        setShowStartupModal(true);
        setStep(null);
        setExcelData(null);
        setFileName('');
        setElements([]);
        setGroups([]);
        setPageSize(PAGE_SIZES[0]);
        setOrientation('portrait');
        setHasUnsavedChanges(false);
        setConfirmModal(null);
      },
      danger: true,
    });
  };

  const handleExportSingle = () => {
    setShowRowSelection(true);
  };

  const handleRowSelected = async (rowIndex: number) => {
    setPreviewRowIndex(rowIndex);
    setShowRowSelection(false);

    const result = await startExport('single', rowIndex);
    if (result) {
      setCurrentExportJob({ id: result.jobId } as ExportJob);
      setShowExportProgress(true);

      if (result.downloadUrl) {
        downloadFile(result.downloadUrl, 'single');
      }
    }
  };

  const handleExportAll = async () => {
    if (!excelData) return;

    toast.info('Starting batch export', `Preparing to export ${excelData.data.length} PDFs...`);
    const result = await startExport('all', 0);

    if (result) {
      setCurrentExportJob({ id: result.jobId } as ExportJob);
      setShowExportProgress(true);

      if (result.downloadUrl) {
        downloadFile(result.downloadUrl, 'all');
      }
    }
  };

  const handleRenameDesign = () => {
    setRenameModalOpen(true);
  };

  const submitRename = async (newName: string) => {
    const current = fileName || 'Untitled';
    if (!newName || newName === current) {
      setRenameModalOpen(false);
      return;
    }

    setFileName(newName);
    try {
      await saveWorkspace({
        fileName: newName,
        excelData,
        pageSize: pageSize.name,
        pageWidth: currentWidth,
        pageHeight: currentHeight,
        orientation,
        elements,
        groups,
        currentRowIndex: previewRowIndex,
      });
      toast.success('Design renamed', `Name updated to "${newName}"`);
    } catch (error) {
      console.error('Failed to rename design:', error);
      toast.error('Rename failed', 'Could not save the new name');
    } finally {
      setRenameModalOpen(false);
    }
  };

  const handleExportTemplateJson = () => {
    // Derive a sensible name without extension for the downloaded file
    const baseName = (fileName || 'template').replace(/\.[^/.]+$/, '') || 'template';

    // Build a minimal template object for export
    const tempTemplate: Template = {
      id: 'current',
      name: baseName,
      description: undefined,
      tags: [],
      pageSize: pageSize.name,
      pageWidth: currentWidth,
      pageHeight: currentHeight,
      orientation,
      elements,
      groups,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      usageCount: 0,
    };

    const json = exportTemplateToJSON(tempTemplate);

    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const sanitize = (name: string) => name.replace(/[^a-z0-9-_]+/gi, '_');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sanitize(baseName)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Template exported', `Saved ${sanitize(baseName)}.json`);
  };

  const handleDownloadFromHistory = (url: string) => {
    const mode = url.endsWith('.zip') ? 'all' : 'single';
    downloadFile(url, mode);
  };

  const handleViewProgress = (job: ExportJob) => {
    setCurrentExportJob(job);
    setShowExportProgress(true);
    setShowExportStatus(false);
  };

  const handleDataSave = (headers: string[], data: Record<string, unknown>[]) => {
    setExcelData({
      headers,
      data,
      rowCount: data.length,
    });
    toast.success('Data updated', `${data.length} rows have been saved.`);
  };

  const handleSaveTemplate = async () => {
    const templateName = window.prompt('Enter a name for this template:');
    if (!templateName) return;

    try {
      await saveTemplateWithThumbnail({
        name: templateName,
        pageSize: pageSize.name,
        pageWidth: currentWidth,
        pageHeight: currentHeight,
        orientation,
        elements,
        groups,
      });

      toast.success('Template saved', `"${templateName}" has been saved successfully.`);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error('Failed to save template', 'Could not save the template');
    }
  };

  const handleLoadTemplate = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          const tpl = parsed?.template ? parsed.template : parsed;

          if (tpl.elements) {
            setElements(tpl.elements);
          }
          if (tpl.groups) {
            setGroups(tpl.groups);
          }
          if (tpl.pageSize) {
            const foundPageSize = PAGE_SIZES.find(ps => ps.name === tpl.pageSize);
            if (foundPageSize) {
              setPageSize(foundPageSize);
            }
          }
          if (tpl.orientation) {
            setOrientation(tpl.orientation);
          }
          toast.success('Template loaded', 'Your template has been applied successfully.');
        } catch (error) {
          toast.error('Invalid template', 'Failed to load template file.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleChangeDataSource = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls,.csv';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const { parseExcelFile } = await import('./utils/excelParser');
      try {
        const data = await parseExcelFile(file);
        setExcelData(data);
        setFileName(file.name);
        toast.success('Data loaded', `Successfully loaded ${data.rowCount} rows from ${file.name}`);
      } catch (error) {
        toast.error('Failed to load data', 'Could not parse the selected file.');
      }
    };
    input.click();
  };

  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 's',
        ctrl: true,
        handler: () => {
          if (step === 'canvas') {
            handleSaveTemplate();
          }
        },
        description: 'Save template',
        enabled: step === 'canvas',
      },
      {
        key: 'p',
        ctrl: true,
        handler: () => {
          if (step === 'canvas') {
            setShowPreview(true);
          }
        },
        description: 'Preview',
        enabled: step === 'canvas',
      },
      {
        key: 'e',
        ctrl: true,
        handler: () => {
          if (step === 'canvas') {
            handleExportSingle();
          }
        },
        description: 'Export',
        enabled: step === 'canvas',
      },
    ],
    enabled: true,
  });

  if (!step) {
    return (
      <>
        <StartupModal
          isOpen={showStartupModal}
          onUploadData={handleUploadData}
          onImportTemplate={handleImportTemplate}
          onStartBlank={handleStartBlank}
          onResumeSession={handleResumeSession}
          onClose={() => setShowStartupModal(false)}
        />
        <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
          <div className="text-center">
            <FileSpreadsheet className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Excel to PDF Builder</h1>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden" style={{ pointerEvents: isCanvasInteracting ? 'none' : 'auto' }}>
      <header className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              <h1 className="text-base font-bold text-gray-800">
                Excel to PDF Builder
              </h1>
            </div>

            {step !== 'upload' && (
              <button
                onClick={handleStartOver}
                className="flex items-center gap-1.5 px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 rounded transition-colors"
                title="Start Over"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Start Over</span>
              </button>
            )}
          </div>
        </div>

        {step === 'canvas' && (
          <div className="px-4 py-1.5 bg-gray-50 border-t flex items-center justify-between">
            <div className="text-xs text-gray-600">
              <span className="font-medium">{fileName}</span> • {excelData?.rowCount} rows
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRenameDesign}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                title="Rename Design"
              >
                <Pencil className="w-3 h-3" />
                <span>Rename</span>
              </button>
              <button
                onClick={handleChangeDataSource}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                title="Change Data Source"
              >
                <Upload className="w-3 h-3" />
                <span>Data</span>
              </button>
              <button
                onClick={() => setShowDataEdit(true)}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                title="Edit Data"
              >
                <Database className="w-3 h-3" />
                <span>Edit</span>
              </button>
              <button
                onClick={handleSaveTemplate}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                title="Save as Template"
              >
                <Save className="w-3 h-3" />
                <span>Save</span>
              </button>
              <button
                onClick={handleLoadTemplate}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                title="Load Template"
              >
                <FileUp className="w-3 h-3" />
                <span>Load</span>
              </button>
              <button
                onClick={handleExportTemplateJson}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                title="Export Template as JSON"
              >
                <FileDown className="w-3 h-3" />
                <span>Export JSON</span>
              </button>
              <button
                onClick={() => window.dispatchEvent(new Event('open-grid-modal'))}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                title="Open Grid Builder"
              >
                <Ruler className="w-3 h-3" />
                <span>Grid</span>
              </button>
              <button
                onClick={() => window.dispatchEvent(new Event('clear-guides'))}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                title="Clear Guides"
              >
                <Ruler className="w-3 h-3 rotate-45" />
                <span>Clear</span>
              </button>
              <button
                onClick={() => setShowPreview(true)}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                title="Preview"
              >
                <Eye className="w-3 h-3" />
                <span>Preview</span>
              </button>
              <button
                onClick={() => setShowExportStatus(true)}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                title="View Export History"
              >
                <History className="w-3 h-3" />
                <span>History</span>
              </button>
              <button
                onClick={handleExportSingle}
                disabled={isExporting}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export Single Record"
              >
                <Download className="w-3 h-3" />
                <span>{isExporting ? 'Exporting...' : 'Single'}</span>
              </button>
              <button
                onClick={handleExportAll}
                disabled={isExporting}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export All Records as ZIP"
              >
                <Download className="w-3 h-3" />
                <span>{isExporting ? 'Exporting...' : 'All'}</span>
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col min-h-0">
        {step === 'upload' && (
          <div className="flex-1 flex items-center justify-center p-8">
            <ExcelUploader onDataParsed={handleDataParsed} />
          </div>
        )}

        {step === 'preview' && excelData && (
          <div className="flex-1 flex items-center justify-center p-8">
            <DataPreview
              headers={excelData.headers}
              data={excelData.data}
              onConfirm={handleConfirmData}
              onCancel={handleCancelPreview}
            />
          </div>
        )}

        {step === 'canvas' && excelData && (
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            <PageSizeSelector
              selectedSize={pageSize}
              orientation={orientation}
              onSizeChange={setPageSize}
              onOrientationChange={setOrientation}
            />
            <div className="flex-1 overflow-hidden min-h-0" style={{ pointerEvents: 'auto' }}>
              <CanvasWorkspace
                width={currentWidth}
                height={currentHeight}
                elements={elements}
                groups={groups}
                headers={excelData.headers}
                data={excelData.data}
                onElementsChange={setElements}
                onGroupsChange={setGroups}
                onInteractionChange={setIsUserInteracting}
                onCanvasInteractionChange={setIsCanvasInteracting}
              />
            </div>
          </div>
        )}
      </main>

      {excelData && (
        <>
          <RowSelectionModal
            isOpen={showRowSelection}
            onClose={() => setShowRowSelection(false)}
            data={excelData.data}
            headers={excelData.headers}
            onSelectRow={handleRowSelected}
            currentRowIndex={previewRowIndex}
          />
          <PreviewModal
            isOpen={showPreview}
            onClose={() => setShowPreview(false)}
            width={currentWidth}
            height={currentHeight}
            elements={elements}
            data={excelData.data}
            currentRowIndex={previewRowIndex}
            onRowChange={setPreviewRowIndex}
          />
          <DataEditModal
            isOpen={showDataEdit}
            onClose={() => setShowDataEdit(false)}
            headers={excelData.headers}
            data={excelData.data}
            onSave={handleDataSave}
          />
          <ExportProgressModal
            isOpen={showExportProgress}
            onClose={() => setShowExportProgress(false)}
            job={currentExportJob}
            onDownload={handleDownloadFromHistory}
          />
          <ExportStatusPanel
            isOpen={showExportStatus}
            onClose={() => setShowExportStatus(false)}
            onDownload={handleDownloadFromHistory}
            onViewProgress={handleViewProgress}
          />
          <StartupModal
            isOpen={showStartupModal}
            onUploadData={handleUploadData}
            onImportTemplate={handleImportTemplate}
            onStartBlank={handleStartBlank}
            onResumeSession={handleResumeSession}
            onClose={() => setShowStartupModal(false)}
          />
          <InputModal
            isOpen={renameModalOpen}
            title="Rename Design"
            message="Choose a descriptive name for your current design."
            label="Design name"
            placeholder="Untitled"
            defaultValue={fileName || 'Untitled'}
            confirmText="Save"
            cancelText="Cancel"
            onSubmit={submitRename}
            onCancel={() => setRenameModalOpen(false)}
          />
          {confirmModal && (
            <ConfirmModal
              isOpen={confirmModal.isOpen}
              title={confirmModal.title}
              message={confirmModal.message}
              onConfirm={confirmModal.onConfirm}
              onCancel={() => setConfirmModal(null)}
              danger={confirmModal.danger}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;
