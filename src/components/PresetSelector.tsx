import { useState } from 'react';
import { Sparkles, Plus, Trash2 } from 'lucide-react';
import { StylePreset, CanvasElement } from '../lib/types';
import { loadDesignTokens, saveCustomPreset } from '../lib/designTokens';

interface PresetSelectorProps {
  category: 'text' | 'shape' | 'effect';
  onApply: (preset: StylePreset) => void;
  currentStyle?: Partial<CanvasElement['style']>;
}

export function PresetSelector({ category, onApply, currentStyle }: PresetSelectorProps) {
  const [tokens, setTokens] = useState(loadDesignTokens());
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState('');

  const presets = tokens.presets.filter(p => p.category === category);

  const handleSaveAsPreset = () => {
    if (!presetName.trim() || !currentStyle) return;

    const newPreset: StylePreset = {
      id: `custom-${category}-${Date.now()}`,
      name: presetName,
      category,
      style: currentStyle,
      description: 'Custom preset',
    };

    saveCustomPreset(newPreset);
    setTokens(loadDesignTokens());
    setPresetName('');
    setShowSaveDialog(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Presets</span>
        </label>
        <button
          onClick={() => setShowSaveDialog(!showSaveDialog)}
          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          title="Save current style as preset"
        >
          <Plus className="w-3 h-3" />
          <span>Save</span>
        </button>
      </div>

      {showSaveDialog && (
        <div className="p-2 bg-blue-50 border border-blue-200 rounded space-y-2">
          <input
            type="text"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Preset name..."
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveAsPreset();
              if (e.key === 'Escape') setShowSaveDialog(false);
            }}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveAsPreset}
              className="flex-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save
            </button>
            <button
              onClick={() => setShowSaveDialog(false)}
              className="flex-1 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onApply(preset)}
            className="p-2 text-left border border-gray-300 rounded hover:border-blue-500 hover:bg-blue-50 transition-colors group"
            title={preset.description}
          >
            <div className="text-xs font-medium text-gray-700 group-hover:text-blue-700">
              {preset.name}
            </div>
            {preset.description && (
              <div className="text-xs text-gray-500 mt-0.5 truncate">
                {preset.description}
              </div>
            )}
          </button>
        ))}
      </div>

      {presets.length === 0 && (
        <div className="text-xs text-gray-400 text-center py-4">
          No presets available
        </div>
      )}
    </div>
  );
}
