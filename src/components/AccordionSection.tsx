import { ChevronDown, ChevronRight } from 'lucide-react';
import { ReactNode, useState } from 'react';

interface AccordionSectionProps {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  isExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  badge?: string | number;
  icon?: ReactNode;
  highlight?: boolean;
}

export function AccordionSection({
  title,
  children,
  defaultExpanded = false,
  isExpanded: controlledExpanded,
  onToggle,
  badge,
  icon,
  highlight = false,
}: AccordionSectionProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isControlled = controlledExpanded !== undefined;
  const expanded = isControlled ? controlledExpanded : internalExpanded;

  const handleToggle = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newExpanded = !expanded;
    if (!isControlled) {
      setInternalExpanded(newExpanded);
    }
    onToggle?.(newExpanded);
  };

  return (
    <div className={`border-b border-gray-200 ${highlight ? 'bg-blue-50' : ''}`}>
      <button
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.code === 'Space' || e.code === 'Enter') {
            handleToggle(e);
          }
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onWheel={(e) => e.stopPropagation()}
        onMouseMove={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        onMouseEnter={(e) => e.stopPropagation()}
        onMouseLeave={(e) => e.stopPropagation()}
        className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 transition-colors text-left"
        type="button"
      >
        <div className="flex items-center gap-1.5 flex-1">
          {icon && <span className="text-gray-500">{icon}</span>}
          <span className="text-xs font-semibold text-gray-700">{title}</span>
          {badge !== undefined && (
            <span className="px-1 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
              {badge}
            </span>
          )}
        </div>
        <div className="text-gray-400">
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </div>
      </button>

      {expanded && (
        <div
          className="px-2 py-2 space-y-2 animate-accordion-down"
          onWheel={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseMove={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      )}
    </div>
  );
}
