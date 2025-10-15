import { Search, X } from 'lucide-react';
import { useState } from 'react';

interface PropertySearchProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}

export function PropertySearch({ value, onChange, onClear }: PropertySearchProps) {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search properties..."
        className="w-full pl-8 pr-8 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {value && (
        <button
          onClick={onClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded transition-colors"
          title="Clear search"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      )}
    </div>
  );
}
