import { Link, Unlink } from 'lucide-react';
import { useState } from 'react';
import { ScrubbableInput } from './ScrubbableInput';

interface LinkedInputsProps {
  value1: number;
  value2: number;
  label1: string;
  label2: string;
  onChange1: (value: number) => void;
  onChange2: (value: number) => void;
  linked?: boolean;
  onLinkToggle?: (linked: boolean) => void;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
}

export function LinkedInputs({
  value1,
  value2,
  label1,
  label2,
  onChange1,
  onChange2,
  linked: controlledLinked,
  onLinkToggle,
  unit,
  min,
  max,
  step,
}: LinkedInputsProps) {
  const [internalLinked, setInternalLinked] = useState(true);
  const isControlled = controlledLinked !== undefined;
  const linked = isControlled ? controlledLinked : internalLinked;
  const aspectRatio = value1 / value2;

  const handleLinkToggle = () => {
    const newLinked = !linked;
    if (!isControlled) {
      setInternalLinked(newLinked);
    }
    onLinkToggle?.(newLinked);
  };

  const handleChange1 = (newValue: number) => {
    onChange1(newValue);
    if (linked && value2 !== 0) {
      onChange2(newValue / aspectRatio);
    }
  };

  const handleChange2 = (newValue: number) => {
    onChange2(newValue);
    if (linked && newValue !== 0) {
      onChange1(newValue * aspectRatio);
    }
  };

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
      <ScrubbableInput
        label={label1}
        value={value1}
        onChange={handleChange1}
        min={min}
        max={max}
        step={step}
        unit={unit}
      />

      <button
        onClick={handleLinkToggle}
        className={`mb-1.5 p-1.5 rounded transition-colors ${
          linked ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:bg-gray-100'
        }`}
        title={linked ? 'Unlink values' : 'Link values'}
      >
        {linked ? <Link className="w-4 h-4" /> : <Unlink className="w-4 h-4" />}
      </button>

      <ScrubbableInput
        label={label2}
        value={value2}
        onChange={handleChange2}
        min={min}
        max={max}
        step={step}
        unit={unit}
      />
    </div>
  );
}

interface UniformControlProps {
  values: [number, number, number, number];
  labels: [string, string, string, string];
  onChange: (values: [number, number, number, number]) => void;
  linked?: boolean;
  onLinkToggle?: (linked: boolean) => void;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  uniformLabel?: string;
}

export function UniformControl({
  values,
  labels,
  onChange,
  linked: controlledLinked,
  onLinkToggle,
  unit,
  min,
  max,
  step,
  uniformLabel = 'All',
}: UniformControlProps) {
  const [internalLinked, setInternalLinked] = useState(true);
  const isControlled = controlledLinked !== undefined;
  const linked = isControlled ? controlledLinked : internalLinked;

  const handleLinkToggle = () => {
    const newLinked = !linked;
    if (!isControlled) {
      setInternalLinked(newLinked);
    }
    onLinkToggle?.(newLinked);
  };

  const handleUniformChange = (value: number) => {
    onChange([value, value, value, value]);
  };

  const handleIndividualChange = (index: number, value: number) => {
    const newValues = [...values] as [number, number, number, number];
    newValues[index] = value;
    onChange(newValues);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2">
        <ScrubbableInput
          label={uniformLabel}
          value={linked ? values[0] : 0}
          onChange={handleUniformChange}
          min={min}
          max={max}
          step={step}
          unit={unit}
          className="flex-1"
        />
        <button
          onClick={handleLinkToggle}
          className={`mb-1.5 p-1.5 rounded transition-colors ${
            linked ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:bg-gray-100'
          }`}
          title={linked ? 'Unlink values' : 'Link values'}
        >
          {linked ? <Link className="w-4 h-4" /> : <Unlink className="w-4 h-4" />}
        </button>
      </div>

      {!linked && (
        <div className="grid grid-cols-2 gap-2">
          {values.map((value, index) => (
            <ScrubbableInput
              key={index}
              label={labels[index]}
              value={value}
              onChange={(v) => handleIndividualChange(index, v)}
              min={min}
              max={max}
              step={step}
              unit={unit}
            />
          ))}
        </div>
      )}
    </div>
  );
}
