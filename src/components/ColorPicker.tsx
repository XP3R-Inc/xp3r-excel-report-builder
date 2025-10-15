import { useState, useRef, useEffect } from 'react';
import { Palette } from 'lucide-react';
import { loadDesignTokens, addRecentColor } from '../lib/designTokens';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  showPalette?: boolean;
}

export function ColorPicker({ label, value, onChange, showPalette = true }: ColorPickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [tokens, setTokens] = useState(loadDesignTokens());
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPicker]);

  const handleColorChange = (newColor: string) => {
    onChange(newColor);
    addRecentColor(newColor);
    setTokens(loadDesignTokens());
  };

  const brandColors = tokens.colors.filter(c => c.category === 'brand');
  const recentColors = tokens.recentColors;

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="color"
            value={value}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-full h-8 border border-gray-300 rounded cursor-pointer"
          />
        </div>

        {showPalette && (
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            title="Show color palette"
          >
            <Palette className="w-4 h-4 text-gray-600" />
          </button>
        )}
      </div>

      {showPicker && showPalette && (
        <div
          ref={pickerRef}
          className="absolute z-50 mt-1 p-3 bg-white border border-gray-300 rounded-lg shadow-lg w-64"
        >
          {recentColors.length > 0 && (
            <div className="mb-3">
              <div className="text-xs font-medium text-gray-600 mb-2">Recent</div>
              <div className="flex flex-wrap gap-1">
                {recentColors.map((color, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      handleColorChange(color);
                      setShowPicker(false);
                    }}
                    className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}

          {brandColors.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-600 mb-2">Brand Colors</div>
              <div className="flex flex-wrap gap-1">
                {brandColors.map((colorToken) => (
                  <button
                    key={colorToken.id}
                    onClick={() => {
                      handleColorChange(colorToken.value);
                      setShowPicker(false);
                    }}
                    className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: colorToken.value }}
                    title={colorToken.name}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs font-medium text-gray-600 mb-2">All Colors</div>
            <div className="grid grid-cols-8 gap-1">
              {tokens.colors.map((colorToken) => (
                <button
                  key={colorToken.id}
                  onClick={() => {
                    handleColorChange(colorToken.value);
                    setShowPicker(false);
                  }}
                  className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                  style={{ backgroundColor: colorToken.value }}
                  title={colorToken.name}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
