import { useState, useRef, useEffect } from 'react';

interface ScrubbableInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  className?: string;
}

export function ScrubbableInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit = '',
  className = '',
}: ScrubbableInputProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const startXRef = useRef(0);
  const startValueRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.select();
      inputRef.current.focus({ preventScroll: true });
    }
  }, [isEditing]);

  const handleLabelMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return;
    e.preventDefault();
    setIsDragging(true);
    startXRef.current = e.clientX;
    startValueRef.current = value;
    document.body.style.cursor = 'ew-resize';
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startXRef.current;
      const multiplier = e.shiftKey ? 10 : 1;
      const delta = Math.round(deltaX / 2) * step * multiplier;
      let newValue = startValueRef.current + delta;

      if (min !== undefined) newValue = Math.max(min, newValue);
      if (max !== undefined) newValue = Math.min(max, newValue);

      onChange(newValue);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onChange, step, min, max]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value) || 0;
    onChange(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const multiplier = e.shiftKey ? 10 : 1;
      const delta = (e.key === 'ArrowUp' ? 1 : -1) * step * multiplier;
      let newValue = value + delta;

      if (min !== undefined) newValue = Math.max(min, newValue);
      if (max !== undefined) newValue = Math.min(max, newValue);

      onChange(newValue);
    } else if (e.key === 'Enter') {
      setIsEditing(false);
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className={className}>
      <label
        onMouseDown={handleLabelMouseDown}
        className={`block text-xs font-medium text-gray-600 mb-1 select-none ${
          !isEditing ? 'cursor-ew-resize hover:text-blue-600' : ''
        }`}
        title="Click and drag to scrub value"
      >
        {label}
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="number"
          value={Math.round(value * 100) / 100}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={(e) => {
            setIsEditing(true);
            e.target.scrollIntoView = () => {};
          }}
          onBlur={() => setIsEditing(false)}
          min={min}
          max={max}
          step={step}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
        />
        {unit && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
