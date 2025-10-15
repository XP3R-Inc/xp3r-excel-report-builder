import { useState, useEffect } from 'react';
import { FileSpreadsheet, Plus, Search, Calendar, Star, Trash2, Copy, Download, Upload, FileText } from 'lucide-react';
import { Template, getAllTemplates, deleteTemplate, duplicateTemplate, incrementTemplateUsage, exportTemplateToJSON, importTemplateFromJSON } from '../lib/templateService';
import { useToast } from '../contexts/ToastContext';

interface TemplateSelectorProps {
  onSelectTemplate: (template: Template) => void;
  onStartBlank: () => void;
  onUploadData: () => void;
}

export function TemplateSelector({ onSelectTemplate, onStartBlank, onUploadData }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'usage'>('recent');
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const allTemplates = await getAllTemplates();
      setTemplates(allTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load templates', 'Could not retrieve saved templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = async (template: Template) => {
    try {
      await incrementTemplateUsage(template.id);
      onSelectTemplate(template);
    } catch (error) {
      console.error('Failed to load template:', error);
      toast.error('Failed to load template', 'Could not open the selected template');
    }
  };

  const handleDeleteTemplate = async (templateId: string, templateName: string) => {
    if (!confirm(`Are you sure you want to delete "${templateName}"?`)) {
      return;
    }

    try {
      await deleteTemplate(templateId);
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      toast.success('Template deleted', `"${templateName}" has been deleted`);
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast.error('Failed to delete template', 'Could not delete the template');
    }
  };

  const handleDuplicateTemplate = async (templateId: string) => {
    try {
      const duplicated = await duplicateTemplate(templateId);
      setTemplates(prev => [duplicated, ...prev]);
      toast.success('Template duplicated', `"${duplicated.name}" has been created`);
    } catch (error) {
      console.error('Failed to duplicate template:', error);
      toast.error('Failed to duplicate template', 'Could not create a copy');
    }
  };

  const handleExportTemplate = (template: Template) => {
    try {
      const json = exportTemplateToJSON(template);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${template.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_template.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Template exported', 'Template has been downloaded');
    } catch (error) {
      console.error('Failed to export template:', error);
      toast.error('Failed to export template', 'Could not export the template');
    }
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
            setTemplates(prev => [imported, ...prev]);
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

  const filteredTemplates = templates
    .filter(template =>
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'usage':
          return b.usageCount - a.usageCount;
        case 'recent':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FileSpreadsheet className="w-12 h-12 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Excel to PDF Builder</h1>
          </div>
          <p className="text-lg text-gray-600">
            Start with a template, upload your data, or create from scratch
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <button
            onClick={onUploadData}
            className="group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-8 border-2 border-blue-600 hover:border-blue-700"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Data</h3>
              <p className="text-sm text-gray-600">
                Start with Excel or CSV file
              </p>
            </div>
          </button>

          <button
            onClick={onStartBlank}
            className="group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-8 border-2 border-gray-200 hover:border-gray-300"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-gray-200 transition-colors">
                <Plus className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Blank Template</h3>
              <p className="text-sm text-gray-600">
                Start from scratch
              </p>
            </div>
          </button>

          <button
            onClick={handleImportTemplate}
            className="group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-8 border-2 border-gray-200 hover:border-gray-300"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                <FileText className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Import Template</h3>
              <p className="text-sm text-gray-600">
                Load from JSON file
              </p>
            </div>
          </button>
        </div>

        {templates.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Saved Templates</h2>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'recent' | 'name' | 'usage')}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="recent">Most Recent</option>
                  <option value="name">Name</option>
                  <option value="usage">Most Used</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No templates found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="group relative bg-white border-2 border-gray-200 rounded-lg overflow-hidden hover:border-blue-500 hover:shadow-lg transition-all duration-300"
                  >
                    <button
                      onClick={() => handleSelectTemplate(template)}
                      className="w-full text-left"
                    >
                      <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                        {template.thumbnail ? (
                          <img
                            src={template.thumbnail}
                            alt={template.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileSpreadsheet className="w-16 h-16 text-gray-300" />
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 mb-1 truncate">{template.name}</h3>
                        {template.description && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{template.description}</p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(template.updatedAt)}
                          </div>
                          {template.usageCount > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3" />
                              {template.usageCount} uses
                            </div>
                          )}
                        </div>

                        {template.tags && template.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {template.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </button>

                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateTemplate(template.id);
                          }}
                          className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-100 transition-colors"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportTemplate(template);
                          }}
                          className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-100 transition-colors"
                          title="Export"
                        >
                          <Download className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(template.id, template.name);
                          }}
                          className="p-2 bg-white rounded-lg shadow-md hover:bg-red-100 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
