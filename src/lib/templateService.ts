import { storage, Template } from './storage';
import { CanvasElement, ElementGroup } from './types';

export type { Template };

export interface CreateTemplateParams {
  name: string;
  description?: string;
  tags?: string[];
  pageSize: string;
  pageWidth: number;
  pageHeight: number;
  orientation: 'portrait' | 'landscape';
  elements: CanvasElement[];
  groups: ElementGroup[];
}

export interface UpdateTemplateParams {
  name?: string;
  description?: string;
  tags?: string[];
  pageSize?: string;
  pageWidth?: number;
  pageHeight?: number;
  orientation?: 'portrait' | 'landscape';
  elements?: CanvasElement[];
  groups?: ElementGroup[];
}

export async function createTemplate(params: CreateTemplateParams): Promise<Template> {
  const now = new Date().toISOString();

  const template: Template = {
    id: `template_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    name: params.name,
    description: params.description,
    tags: params.tags || [],
    pageSize: params.pageSize,
    pageWidth: params.pageWidth,
    pageHeight: params.pageHeight,
    orientation: params.orientation,
    elements: params.elements,
    groups: params.groups,
    createdAt: now,
    updatedAt: now,
    usageCount: 0,
  };

  await storage.saveTemplate(template);

  return template;
}

export async function updateTemplate(
  templateId: string,
  updates: UpdateTemplateParams
): Promise<Template> {
  const existingTemplate = await storage.getTemplate(templateId);

  if (!existingTemplate) {
    throw new Error(`Template not found: ${templateId}`);
  }

  const updatedTemplate: Template = {
    ...existingTemplate,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await storage.saveTemplate(updatedTemplate);

  return updatedTemplate;
}

export async function getTemplate(templateId: string): Promise<Template | null> {
  return await storage.getTemplate(templateId);
}

export async function getAllTemplates(): Promise<Template[]> {
  return await storage.getAllTemplates();
}

export async function deleteTemplate(templateId: string): Promise<void> {
  await storage.deleteTemplate(templateId);
}

export async function duplicateTemplate(templateId: string): Promise<Template> {
  const existingTemplate = await storage.getTemplate(templateId);

  if (!existingTemplate) {
    throw new Error(`Template not found: ${templateId}`);
  }

  const now = new Date().toISOString();

  const duplicatedTemplate: Template = {
    ...existingTemplate,
    id: `template_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    name: `${existingTemplate.name} (Copy)`,
    createdAt: now,
    updatedAt: now,
    usageCount: 0,
  };

  await storage.saveTemplate(duplicatedTemplate);

  return duplicatedTemplate;
}

export async function incrementTemplateUsage(templateId: string): Promise<void> {
  const template = await storage.getTemplate(templateId);

  if (template) {
    template.usageCount += 1;
    template.updatedAt = new Date().toISOString();
    await storage.saveTemplate(template);
  }
}

export async function generateThumbnail(
  elements: CanvasElement[],
  pageWidth: number,
  pageHeight: number
): Promise<string> {
  const canvas = document.createElement('canvas');
  const maxSize = 300;
  const scale = Math.min(maxSize / pageWidth, maxSize / pageHeight);

  canvas.width = pageWidth * scale;
  canvas.height = pageHeight * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return '';
  }

  ctx.scale(scale, scale);
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, pageWidth, pageHeight);

  for (const element of elements.filter(el => !el.hidden)) {
    ctx.save();

    ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
    ctx.rotate((element.rotation || 0) * Math.PI / 180);
    ctx.translate(-element.width / 2, -element.height / 2);

    ctx.globalAlpha = element.style?.opacity ?? 1;

    if (element.style?.backgroundColor && element.style.backgroundColor !== 'transparent') {
      ctx.fillStyle = element.style.backgroundColor;
      ctx.fillRect(0, 0, element.width, element.height);
    }

    if (element.type === 'text') {
      const fontSize = (element.style?.fontSize || 14);
      const fontFamily = element.style?.fontFamily || 'Arial';
      const fontWeight = element.style?.fontWeight || 'normal';

      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      ctx.fillStyle = element.style?.color || '#000000';

      const textAlign = element.style?.textAlign || 'left';
      let xPos = element.style?.padding || 0;

      if (textAlign === 'center') {
        xPos = element.width / 2;
        ctx.textAlign = 'center';
      } else if (textAlign === 'right') {
        xPos = element.width - (element.style?.padding || 0);
        ctx.textAlign = 'right';
      } else {
        ctx.textAlign = 'left';
      }

      ctx.textBaseline = 'middle';
      const text = element.content || 'Text';
      ctx.fillText(text, xPos, element.height / 2, element.width);
    }

    if (element.style?.borderWidth && element.style?.borderColor) {
      ctx.strokeStyle = element.style.borderColor;
      ctx.lineWidth = element.style.borderWidth;
      ctx.strokeRect(0, 0, element.width, element.height);
    }

    ctx.restore();
  }

  return canvas.toDataURL('image/png', 0.5);
}

export async function saveTemplateWithThumbnail(
  params: CreateTemplateParams
): Promise<Template> {
  const thumbnail = await generateThumbnail(params.elements, params.pageWidth, params.pageHeight);

  const now = new Date().toISOString();

  const template: Template = {
    id: `template_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    name: params.name,
    description: params.description,
    tags: params.tags || [],
    thumbnail,
    pageSize: params.pageSize,
    pageWidth: params.pageWidth,
    pageHeight: params.pageHeight,
    orientation: params.orientation,
    elements: params.elements,
    groups: params.groups,
    createdAt: now,
    updatedAt: now,
    usageCount: 0,
  };

  await storage.saveTemplate(template);

  return template;
}

export function exportTemplateToJSON(template: Template): string {
  const exportData = {
    version: '1.0',
    template: {
      name: template.name,
      description: template.description,
      tags: template.tags,
      pageSize: template.pageSize,
      pageWidth: template.pageWidth,
      pageHeight: template.pageHeight,
      orientation: template.orientation,
      elements: template.elements,
      groups: template.groups,
    },
    exportedAt: new Date().toISOString(),
  };

  return JSON.stringify(exportData, null, 2);
}

export async function importTemplateFromJSON(jsonString: string): Promise<Template> {
  try {
    const importData = JSON.parse(jsonString);

    if (!importData.template) {
      throw new Error('Invalid template file format');
    }

    const params: CreateTemplateParams = {
      name: importData.template.name || 'Imported Template',
      description: importData.template.description,
      tags: importData.template.tags || [],
      pageSize: importData.template.pageSize || 'A4',
      pageWidth: importData.template.pageWidth || 794,
      pageHeight: importData.template.pageHeight || 1123,
      orientation: importData.template.orientation || 'portrait',
      elements: importData.template.elements || [],
      groups: importData.template.groups || [],
    };

    return await saveTemplateWithThumbnail(params);
  } catch (error) {
    throw new Error('Failed to import template: Invalid JSON format');
  }
}
