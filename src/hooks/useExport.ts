import { useState, useCallback } from 'react';
import { createExportJob } from '../lib/exportJobService';
import { exportToPDF } from '../utils/pdfExport';
import { CanvasElement } from '../lib/types';
import { useToast } from '../contexts/ToastContext';

interface UseExportOptions {
  elements: CanvasElement[];
  data: Record<string, unknown>[];
  fileName: string;
  pageWidth: number;
  pageHeight: number;
}

export function useExport({ elements, data, fileName, pageWidth, pageHeight }: UseExportOptions) {
  const [isExporting, setIsExporting] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const toast = useToast();

  const startExport = useCallback(
    async (mode: 'single' | 'all', rowIndex: number = 0) => {
      if (isExporting) {
        toast.warning('Export in progress', 'Please wait for the current export to complete.');
        return null;
      }

      setIsExporting(true);
      let jobId: string | null = null;

      try {
        const job = await createExportJob({
          fileName,
          exportMode: mode,
          totalRows: mode === 'single' ? 1 : data.length,
          rowIndices: mode === 'single' ? [rowIndex] : [],
        });

        jobId = job.id;
        setCurrentJobId(jobId);

        toast.info(
          'Export started',
          `${mode === 'single' ? 'Single PDF' : `Batch export of ${data.length} rows`} is being processed.`
        );

        const downloadUrl = await exportToPDF({
          pageWidth,
          pageHeight,
          elements,
          data,
          fileName,
          exportMode: mode,
          rowIndex,
          jobId,
        });

        toast.success(
          'Export completed!',
          'Your file is ready for download.'
        );

        return { jobId, downloadUrl };
      } catch (error) {
        console.error('Export failed:', error);
        toast.error(
          'Export failed',
          error instanceof Error ? error.message : 'An unknown error occurred.'
        );
        return null;
      } finally {
        setIsExporting(false);
        setCurrentJobId(null);
      }
    },
    [isExporting, elements, data, fileName, pageWidth, pageHeight, toast]
  );

  const downloadFile = useCallback((url: string, mode: 'single' | 'all') => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = mode === 'single' ? `${fileName}.pdf` : `${fileName}_all.zip`;
      link.click();

      toast.success('Download started', 'Your file is being downloaded.');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Download failed', 'Failed to download the file.');
    }
  }, [fileName, toast]);

  return {
    startExport,
    downloadFile,
    isExporting,
    currentJobId,
  };
}
