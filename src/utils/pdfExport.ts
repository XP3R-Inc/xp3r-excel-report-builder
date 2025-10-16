import jsPDF from 'jspdf';
import JSZip from 'jszip';
import html2canvas from 'html2canvas';
import { CanvasElement } from '../lib/types';
import { formatMultipleBindings } from './dataFormatter';
import { updateExportJob } from '../lib/exportJobService';
import { calculateOverflowStyle } from './overflowRenderer';

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
  const dpi = 1000;
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

  for (const element of elements.filter(el => !el.hidden && el.meta?.helper !== true)) {
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
      } else if (element.dataBinding) {
        const v = dataRow[element.dataBinding];
        if (v !== undefined && v !== null) text = String(v);
      }

      await (document as any).fonts?.ready;
      const overflowStyle = calculateOverflowStyle(element, text);
      const fontSize = overflowStyle.fontSize || element.style?.fontSize || 14;
      const fontFamily = element.style?.fontFamily || 'Arial';
      const fontWeightRaw = element.style?.fontWeight || '400';
      const fontWeight = typeof fontWeightRaw === 'string' ? fontWeightRaw : String(fontWeightRaw);
      const fontStyle = element.style?.fontStyle || 'normal';

      // Safer font declaration with quoted family and numeric weight fallback
      const weightVal = /^(normal|bold|bolder|lighter|\d{3})$/.test(fontWeight) ? fontWeight : '400';
      ctx.font = `${fontStyle} ${weightVal} ${fontSize}px "${fontFamily}"`;
      ctx.fillStyle = element.style?.color || '#000000';

      const textAlign = element.style?.textAlign || 'left';
      const verticalAlign = element.style?.verticalAlign || 'middle';
      const padding = element.style?.padding || 0;
      // Normalize line-height to px and derive leading
      const lhRaw = (overflowStyle as any).lineHeight ?? element.style?.lineHeight ?? 1.5;
      let lineHeightPx: number;
      if (typeof lhRaw === 'string') {
        const m = lhRaw.match(/^([0-9.]+)px$/);
        lineHeightPx = m ? Math.max(1, parseFloat(m[1])) : Math.max(1, parseFloat(lhRaw) * fontSize);
      } else {
        // If numeric > 10 treat as px, else multiplier
        lineHeightPx = (lhRaw as number) > 10 ? (lhRaw as number) : Math.max(1, (lhRaw as number) * fontSize);
      }
      ctx.textBaseline = 'alphabetic';
      const metrics = ctx.measureText('Mg');
      const ascent = (metrics as any).actualBoundingBoxAscent ?? fontSize * 0.8;
      const descent = (metrics as any).actualBoundingBoxDescent ?? fontSize * 0.2;
      const contentBox = ascent + descent;
      const leading = Math.max(0, lineHeightPx - contentBox);
      const halfLeading = leading / 2;

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
          // Single baseline for the line box
          const availableHeight = Math.max(0, element.height - padding * 2);
          const totalHeight = lineHeightPx; // one line
          let yPos: number;
          if (verticalAlign === 'top') {
            yPos = padding + halfLeading + ascent;
          } else if (verticalAlign === 'bottom') {
            yPos = padding + (availableHeight - totalHeight) + halfLeading + ascent;
          } else {
            yPos = padding + (availableHeight - totalHeight) / 2 + halfLeading + ascent;
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
          const availableHeight = Math.max(0, element.height - padding * 2);
          const totalHeight = items.length * lineHeightPx;
          let firstBaseline: number;
          if (verticalAlign === 'top') {
            firstBaseline = padding + halfLeading + ascent;
          } else if (verticalAlign === 'bottom') {
            firstBaseline = padding + (availableHeight - totalHeight) + halfLeading + ascent;
          } else {
            firstBaseline = padding + (availableHeight - totalHeight) / 2 + halfLeading + ascent;
          }
          items.forEach((item, index) => {
            const yPos = firstBaseline + (index * lineHeightPx);
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
        const overflowStrategy = element.overflowStrategy || 'wrap';

        if (overflowStrategy === 'truncate') {
          const availableHeight = Math.max(0, element.height - padding * 2);
          const totalHeight = lineHeightPx;
          let baselineY: number;
          if (verticalAlign === 'top') {
            baselineY = padding + halfLeading + ascent;
          } else if (verticalAlign === 'bottom') {
            baselineY = padding + (availableHeight - totalHeight) + halfLeading + ascent;
          } else {
            baselineY = padding + (availableHeight - totalHeight) / 2 + halfLeading + ascent;
          }

          const maxWidth = element.width - padding * 2;
          let truncatedText = text;
          let textWidth = ctx.measureText(truncatedText).width;

          if (textWidth > maxWidth) {
            while (textWidth > maxWidth && truncatedText.length > 0) {
              truncatedText = truncatedText.slice(0, -1);
              textWidth = ctx.measureText(truncatedText + '...').width;
            }
            truncatedText += '...';
          }

          // Draw without maxWidth to avoid horizontal scaling
          ctx.fillText(truncatedText, xPos, baselineY);
        } else {
          // Word-wrap by available width
          const availableHeight = Math.max(0, element.height - padding * 2);
          const maxWidth = Math.max(0, element.width - padding * 2);
          const paras = text.split(/\n/);
          const wrapped: string[] = [];
          paras.forEach((para) => {
            const words = para.split(/\s+/);
            let line = '';
            for (const w of words) {
              const candidate = line ? line + ' ' + w : w;
              if (ctx.measureText(candidate).width <= maxWidth) {
                line = candidate;
              } else {
                if (line) wrapped.push(line);
                line = w;
              }
            }
            wrapped.push(line);
          });

          const maxLines = Math.max(0, Math.floor(availableHeight / lineHeightPx));
          const displayLines = wrapped.slice(0, maxLines);
          const totalHeight = displayLines.length * lineHeightPx;
          let firstBaseline: number;
          if (verticalAlign === 'top') {
            firstBaseline = padding + halfLeading + ascent;
          } else if (verticalAlign === 'bottom') {
            firstBaseline = padding + (availableHeight - totalHeight) + halfLeading + ascent;
          } else {
            firstBaseline = padding + (availableHeight - totalHeight) / 2 + halfLeading + ascent;
          }

          displayLines.forEach((line, index) => {
            const yPos = firstBaseline + (index * lineHeightPx);
            if (textAlign === 'center') {
              ctx.textAlign = 'center';
              ctx.fillText(line, element.width / 2, yPos);
            } else if (textAlign === 'right') {
              ctx.textAlign = 'right';
              ctx.fillText(line, element.width - padding, yPos);
            } else {
              ctx.textAlign = 'left';
              ctx.fillText(line, xPos, yPos);
            }
          });
        }
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
      // Try DOM capture for exact visual match if the on-screen canvas is present
      let imageData: string | null = null;
      const canvasEl = document.getElementById('export-canvas') as HTMLElement | null;
      if (canvasEl) {
        // Ensure fonts loaded
        try { await (document as any).fonts?.ready; } catch {}
        const PX_DPI = 96;
        const TARGET_DPI = 300;
        const captureScale = TARGET_DPI / PX_DPI;
        const canvasBmp = await html2canvas(canvasEl, {
          backgroundColor: '#ffffff',
          scale: captureScale,
          // Capture at exact CSS size to avoid resampling differences
          useCORS: true,
          allowTaint: false,
          logging: false,
          windowWidth: canvasEl.clientWidth,
          windowHeight: canvasEl.clientHeight,
          width: pageWidth,
          height: pageHeight,
          scrollX: 0,
          scrollY: 0,
          onclone: (doc) => {
            // Hide helper overlays
            const style = doc.createElement('style');
            // Ensure text fields preserve CSS text rendering exactly during capture
            style.textContent = `.helper-badge{display:none!important}
              #export-canvas{box-shadow:none!important}
              #export-canvas .text-field{white-space:pre-wrap!important;overflow-wrap:anywhere!important;word-break:break-word!important;}
            `;
            doc.head.appendChild(style);
            const el = doc.getElementById('export-canvas') as HTMLElement | null;
            if (el) {
              // Force exact size and neutralize transforms/shadows for a 1:1 capture
              el.style.transform = 'none';
              el.style.width = `${pageWidth}px`;
              el.style.height = `${pageHeight}px`;
              el.style.boxShadow = 'none';
              // Also ensure parent of export-canvas has no transform if any
              const parent = el.parentElement as HTMLElement | null;
              if (parent) {
                parent.style.transform = 'none';
              }
            }
          },
        });
        imageData = canvasBmp.toDataURL('image/png');
      }
      if (!imageData) {
        imageData = await renderCanvasToImage(elements, dataRow, pageWidth, pageHeight);
      }

      const pdf = new jsPDF({
        orientation: mmWidth > mmHeight ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [mmWidth, mmHeight],
      });
      // After forcing DOM capture to exact page size, draw full-page without distortion
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
        // Batch mode uses renderer fallback for now
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
