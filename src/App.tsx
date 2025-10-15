import { useState, useEffect } from 'react';
import { FileSpreadsheet, Eye, Download, Home, Database, Upload, FileDown, FileUp, History, Save } from 'lucide-react';
import { useToast } from './contexts/ToastContext';
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
import { TemplateSelector } from './components/TemplateSelector';
import { ParsedExcelData } from './utils/excelParser';
import { CanvasElement, ElementGroup } from './lib/types';
import { ExportJob } from './lib/exportJobService';
import { Template, saveTemplateWithThumbnail } from './lib/templateService';
import { saveWorkspace, loadWorkspace, clearWorkspace } from './lib/autoSaveService';

type Step = 'home' | 'upload' | 'preview' | 'canvas';

function App() {
  const [step, setStep] = useState<Step>('home');
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
  const [hasAutoSave, setHasAutoSave] = useState(false);

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
    checkAutoSave();
  }, []);

  useEffect(() => {
    if (step === 'canvas' && excelData) {
      autoSave();
    }
  }, [step, excelData, elements, groups, pageSize, orientation, previewRowIndex]);

  const checkAutoSave = async () => {
    const savedState = await loadWorkspace();
    if (savedState && savedState.excelData) {
      setHasAutoSave(true);
      if (confirm('Would you like to restore your previous session?')) {
        restoreAutoSave(savedState);
      } else {
        await clearWorkspace();
      }
    }
  };

  const restoreAutoSave = async (savedState: any) => {
    setFileName(savedState.fileName);
    setExcelData(savedState.excelData);

    const restoredPageSize = PAGE_SIZES.find(ps => ps.name === savedState.pageSize) || PAGE_SIZES[0];
    setPageSize(restoredPageSize);
    setOrientation(savedState.orientation);
    setElements(savedState.elements);
    setGroups(savedState.groups);
    setPreviewRowIndex(savedState.currentRowIndex);
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

  const handleSelectTemplate = (template: Template) => {
    setElements(template.elements);
    setGroups(template.groups);

    const templatePageSize = PAGE_SIZES.find(ps => ps.name === template.pageSize) || PAGE_SIZES[0];
    setPageSize(templatePageSize);
    setOrientation(template.orientation);

    setStep('upload');
  };

  const handleStartBlank = () => {
    setStep('upload');
  };

  const handleUploadData = () => {
    setStep('upload');
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
    if (confirm('Are you sure you want to start over? Unsaved changes will be lost.')) {
      await clearWorkspace();
      setStep('home');
      setExcelData(null);
      setFileName('');
      setElements([]);
      setGroups([]);
      setPageSize(PAGE_SIZES[0]);
      setOrientation('portrait');
    }
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
    const templateName = prompt('Enter a name for this template:');
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
          const template = JSON.parse(event.target?.result as string);
          if (template.elements) {
            setElements(template.elements);
          }
          if (template.groups) {
            setGroups(template.groups);
          }
          if (template.pageSize) {
            const foundPageSize = PAGE_SIZES.find(ps => ps.name === template.pageSize);
            if (foundPageSize) {
              setPageSize(foundPageSize);
            }
          }
          if (template.orientation) {
            setOrientation(template.orientation);
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

  if (step === 'home') {
    return (
      <TemplateSelector
        onSelectTemplate={handleSelectTemplate}
        onStartBlank={handleStartBlank}
        onUploadData={handleUploadData}
      />
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <header className="bg-white shadow-sm border-b flex-shrink-0">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Excel to PDF Builder
                </h1>
                <p className="text-sm text-gray-600">
                  Import data, design templates, and export to PDF
                </p>
              </div>
            </div>

            {step !== 'upload' && (
              <button
                onClick={handleStartOver}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Home className="w-4 h-4" />
                Start Over
              </button>
            )}
          </div>
        </div>

        {step === 'canvas' && (
          <div className="px-6 py-3 bg-gray-50 border-t flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{fileName}</span> • {excelData?.rowCount} rows
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleChangeDataSource}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                title="Change Data Source"
              >
                <Upload className="w-4 h-4" />
                Change Data
              </button>
              <button
                onClick={() => setShowDataEdit(true)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Database className="w-4 h-4" />
                Edit Data
              </button>
              <button
                onClick={handleSaveTemplate}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                title="Save as Template"
              >
                <Save className="w-4 h-4" />
                Save Template
              </button>
              <button
                onClick={handleLoadTemplate}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                title="Load Template"
              >
                <FileUp className="w-4 h-4" />
                Load
              </button>
              <button
                onClick={() => setShowPreview(true)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
              <button
                onClick={() => setShowExportStatus(true)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                title="View Export History"
              >
                <History className="w-4 h-4" />
                History
              </button>
              <button
                onClick={handleExportSingle}
                disabled={isExporting}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export Single Record"
              >
                <Download className="w-4 h-4" />
                {isExporting ? 'Exporting...' : 'Export Single'}
              </button>
              <button
                onClick={handleExportAll}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export All Records as ZIP"
              >
                <Download className="w-4 h-4" />
                {isExporting ? 'Exporting...' : 'Export All'}
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col">
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
          <div className="flex-1 flex flex-col overflow-hidden">
            <PageSizeSelector
              selectedSize={pageSize}
              orientation={orientation}
              onSizeChange={setPageSize}
              onOrientationChange={setOrientation}
            />
            <div className="flex-1 overflow-hidden">
              <CanvasWorkspace
                width={currentWidth}
                height={currentHeight}
                elements={elements}
                groups={groups}
                headers={excelData.headers}
                data={excelData.data}
                onElementsChange={setElements}
                onGroupsChange={setGroups}
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
        </>
      )}
    </div>
  );
}

export default App;
