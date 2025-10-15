import jsPDF from 'jspdf';
import JSZip from 'jszip';
import { CanvasElement } from '../lib/types';
import { formatMultipleBindings } from './dataFormatter';
import { updateExportJob } from '../lib/exportJobService';

export interface ExportOptions {
  pageWidth: number;
  pageHeight: number;
  elements: CanvasElement[];
  data: Record<string, unknown>[];
  fileName: string;
  exportMode?: 'single' | 'all';
  rowIndex?: number;
  onProgress?: (processed: number, total: number, percentage: number) => void;
  jobId?: string;
}

async function renderCanvasToImage(
  elements: CanvasElement[],
  dataRow: Record<string, unknown>,
  width: number,
  height: number
): Promise<string> {
  const canvas = document.createElement('canvas');
  const dpi = 300;
  const scale = dpi / 96;

  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.scale(scale, scale);
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);

  const imagePromises: Promise<void>[] = [];

  for (const element of elements.filter(el => !el.hidden)) {
    if (element.type === 'image' && element.imageUrl) {
      const img = new window.Image();
      const promise = new Promise<void>((resolve) => {
        img.onload = () => {
          ctx.save();
          ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
          ctx.rotate((element.rotation || 0) * Math.PI / 180);
          ctx.translate(-element.width / 2, -element.height / 2);
          ctx.globalAlpha = element.style?.opacity ?? 1;

          const borderRadius = element.style?.borderRadius || 0;
          const tl = element.style?.borderTopLeftRadius ?? borderRadius;
          const tr = element.style?.borderTopRightRadius ?? borderRadius;
          const br = element.style?.borderBottomRightRadius ?? borderRadius;
          const bl = element.style?.borderBottomLeftRadius ?? borderRadius;

          if (tl > 0 || tr > 0 || br > 0 || bl > 0) {
            ctx.beginPath();
            ctx.moveTo(tl, 0);
            ctx.lineTo(element.width - tr, 0);
            ctx.quadraticCurveTo(element.width, 0, element.width, tr);
            ctx.lineTo(element.width, element.height - br);
            ctx.quadraticCurveTo(element.width, element.height, element.width - br, element.height);
            ctx.lineTo(bl, element.height);
            ctx.quadraticCurveTo(0, element.height, 0, element.height - bl);
            ctx.lineTo(0, tl);
            ctx.quadraticCurveTo(0, 0, tl, 0);
            ctx.closePath();
            ctx.clip();
          }

          ctx.drawImage(img, 0, 0, element.width, element.height);
          ctx.restore();
          resolve();
        };
        img.src = element.imageUrl!;
      });
      imagePromises.push(promise);
      continue;
    }

    ctx.save();

    ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
    ctx.rotate((element.rotation || 0) * Math.PI / 180);
    ctx.translate(-element.width / 2, -element.height / 2);

    ctx.globalAlpha = element.style?.opacity ?? 1;

    const borderRadius = element.style?.borderRadius || 0;
    const tl = element.style?.borderTopLeftRadius ?? borderRadius;
    const tr = element.style?.borderTopRightRadius ?? borderRadius;
    const br = element.style?.borderBottomRightRadius ?? borderRadius;
    const bl = element.style?.borderBottomLeftRadius ?? borderRadius;

    if (tl > 0 || tr > 0 || br > 0 || bl > 0) {
      ctx.beginPath();
      ctx.moveTo(tl, 0);
      ctx.lineTo(element.width - tr, 0);
      ctx.quadraticCurveTo(element.width, 0, element.width, tr);
      ctx.lineTo(element.width, element.height - br);
      ctx.quadraticCurveTo(element.width, element.height, element.width - br, element.height);
      ctx.lineTo(bl, element.height);
      ctx.quadraticCurveTo(0, element.height, 0, element.height - bl);
      ctx.lineTo(0, tl);
      ctx.quadraticCurveTo(0, 0, tl, 0);
      ctx.closePath();
      ctx.clip();
    }

    if (element.style?.backgroundColor && element.style.backgroundColor !== 'transparent') {
      ctx.fillStyle = element.style.backgroundColor;
      if (tl > 0 || tr > 0 || br > 0 || bl > 0) {
        ctx.fill();
      } else {
        ctx.fillRect(0, 0, element.width, element.height);
      }
    }

    if (element.type === 'text') {
      let text = element.content || '';

      if (element.dataBindings && element.dataBindings.length > 0) {
        text = formatMultipleBindings(dataRow, element.dataBindings, element.bindingSeparator || ' ');
      } else if (element.dataBinding && dataRow[element.dataBinding]) {
        text = String(dataRow[element.dataBinding]);
      }

      const fontSize = element.style?.fontSize || 14;
      const fontFamily = element.style?.fontFamily || 'Arial';
      const fontWeight = element.style?.fontWeight || 'normal';
      const fontStyle = element.style?.fontStyle || 'normal';

      ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
      ctx.fillStyle = element.style?.color || '#000000';

      const textAlign = element.style?.textAlign || 'left';
      const verticalAlign = element.style?.verticalAlign || 'middle';
      const padding = element.style?.padding || 0;
      const lineHeight = fontSize * (element.style?.lineHeight || 1.5);

      let xPos = padding;

      if (textAlign === 'center') {
        xPos = element.width / 2;
        ctx.textAlign = 'center';
      } else if (textAlign === 'right') {
        xPos = element.width - padding;
        ctx.textAlign = 'right';
      } else {
        ctx.textAlign = 'left';
      }

      if (element.isList && element.dataBinding && dataRow[element.dataBinding]) {
        const items = String(dataRow[element.dataBinding]).split(element.listDelimiter || ',');
        const layout = element.listLayout || 'vertical';
        const style = element.listStyle || 'none';

        if (layout === 'horizontal') {
          let yPos: number;
          if (verticalAlign === 'top') {
            ctx.textBaseline = 'top';
            yPos = padding;
          } else if (verticalAlign === 'bottom') {
            ctx.textBaseline = 'bottom';
            yPos = element.height - padding;
          } else {
            ctx.textBaseline = 'middle';
            yPos = element.height / 2;
          }

          let currentX = padding;
          if (textAlign === 'center') {
            const totalText = items.map((item, idx) => {
              let prefix = '';
              if (style === 'bullets') prefix = '• ';
              if (style === 'numbers') prefix = `${idx + 1}. `;
              return prefix + item.trim();
            }).join('  ');
            const totalWidth = ctx.measureText(totalText).width;
            currentX = (element.width - totalWidth) / 2;
          } else if (textAlign === 'right') {
            const totalText = items.map((item, idx) => {
              let prefix = '';
              if (style === 'bullets') prefix = '• ';
              if (style === 'numbers') prefix = `${idx + 1}. `;
              return prefix + item.trim();
            }).join('  ');
            const totalWidth = ctx.measureText(totalText).width;
            currentX = element.width - totalWidth - padding;
          }

          items.forEach((item, index) => {
            let displayText = item.trim();
            if (style === 'bullets') {
              displayText = '• ' + displayText;
            } else if (style === 'numbers') {
              displayText = `${index + 1}. ${displayText}`;
            }

            ctx.fillText(displayText, currentX, yPos);
            currentX += ctx.measureText(displayText + '  ').width;
          });
        } else {
          const totalHeight = items.length * lineHeight;
          let startY: number;

          if (verticalAlign === 'top') {
            startY = padding;
          } else if (verticalAlign === 'bottom') {
            startY = element.height - totalHeight - padding;
          } else {
            startY = (element.height - totalHeight) / 2;
          }

          ctx.textBaseline = 'top';
          items.forEach((item, index) => {
            const yPos = startY + (index * lineHeight);
            let displayText = item.trim();

            if (style === 'bullets') {
              displayText = '• ' + displayText;
            } else if (style === 'numbers') {
              displayText = `${index + 1}. ${displayText}`;
            }

            ctx.fillText(displayText, xPos, yPos, element.width - padding * 2);
          });
        }
      } else {
        const lines = text.split('\n');
        const totalHeight = lines.length * lineHeight;
        let startY: number;

        if (verticalAlign === 'top') {
          startY = padding;
          ctx.textBaseline = 'top';
        } else if (verticalAlign === 'bottom') {
          startY = element.height - totalHeight - padding;
          ctx.textBaseline = 'top';
        } else {
          startY = (element.height - totalHeight) / 2;
          ctx.textBaseline = 'top';
        }

        lines.forEach((line, index) => {
          const yPos = startY + (index * lineHeight);
          ctx.fillText(line, xPos, yPos, element.width - padding * 2);
        });
      }
    }

    if (element.style?.borderWidth && element.style?.borderColor) {
      ctx.strokeStyle = element.style.borderColor;
      ctx.lineWidth = element.style.borderWidth;

      if (element.style?.borderStyle === 'dashed') {
        ctx.setLineDash([5, 5]);
      } else if (element.style?.borderStyle === 'dotted') {
        ctx.setLineDash([2, 2]);
      }

      if (tl > 0 || tr > 0 || br > 0 || bl > 0) {
        ctx.stroke();
      } else {
        ctx.strokeRect(0, 0, element.width, element.height);
      }

      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  await Promise.all(imagePromises);

  return canvas.toDataURL('image/png');
}

export async function exportToPDF(options: ExportOptions): Promise<string> {
  const { pageWidth, pageHeight, elements, data, fileName, exportMode = 'single', rowIndex = 0, onProgress, jobId } = options;

  const mmWidth = pageWidth * 0.264583;
  const mmHeight = pageHeight * 0.264583;

  try {
    if (jobId) {
      await updateExportJob(jobId, {
        status: 'processing',
        startedAt: new Date().toISOString(),
      });
    }

    if (exportMode === 'single') {
      const dataRow = data[rowIndex] || {};
      const imageData = await renderCanvasToImage(elements, dataRow, pageWidth, pageHeight);

      const pdf = new jsPDF({
        orientation: mmWidth > mmHeight ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [mmWidth, mmHeight],
      });

      pdf.addImage(imageData, 'PNG', 0, 0, mmWidth, mmHeight);
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);

      if (jobId) {
        await updateExportJob(jobId, {
          status: 'completed',
          processedRows: 1,
          progressPercentage: 100,
          downloadUrl: url,
          fileSizeBytes: pdfBlob.size,
          completedAt: new Date().toISOString(),
        });
      }

      if (onProgress) {
        onProgress(1, 1, 100);
      }

      return url;
    } else {
      const zip = new JSZip();
      const totalRows = data.length;

      for (let i = 0; i < totalRows; i++) {
        const dataRow = data[i];
        const imageData = await renderCanvasToImage(elements, dataRow, pageWidth, pageHeight);

        const pdf = new jsPDF({
          orientation: mmWidth > mmHeight ? 'landscape' : 'portrait',
          unit: 'mm',
          format: [mmWidth, mmHeight],
        });

        pdf.addImage(imageData, 'PNG', 0, 0, mmWidth, mmHeight);
        const pdfBlob = pdf.output('blob');

        const rowName = dataRow['Name'] || dataRow['name'] || `record_${i + 1}`;
        const sanitizedName = String(rowName).replace(/[^a-z0-9]/gi, '_').toLowerCase();
        zip.file(`${sanitizedName}.pdf`, pdfBlob);

        const processed = i + 1;
        const percentage = Math.round((processed / totalRows) * 100);

        if (jobId) {
          await updateExportJob(jobId, {
            processedRows: processed,
            progressPercentage: percentage,
          });
        }

        if (onProgress) {
          onProgress(processed, totalRows, percentage);
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);

      if (jobId) {
        await updateExportJob(jobId, {
          status: 'completed',
          processedRows: totalRows,
          progressPercentage: 100,
          downloadUrl: url,
          fileSizeBytes: zipBlob.size,
          completedAt: new Date().toISOString(),
        });
      }

      return url;
    }
  } catch (error) {
    if (jobId) {
      await updateExportJob(jobId, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
        completedAt: new Date().toISOString(),
      });
    }
    throw error;
  }
}
