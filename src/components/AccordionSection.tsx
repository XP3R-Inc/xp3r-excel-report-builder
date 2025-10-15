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

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
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
        onMouseDown={(e) => e.preventDefault()}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-2 flex-1">
          {icon && <span className="text-gray-500">{icon}</span>}
          <span className="text-sm font-semibold text-gray-700">{title}</span>
          {badge !== undefined && (
            <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
              {badge}
            </span>
          )}
        </div>
        <div className="text-gray-400">
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>
      </button>

      {expanded && (
        <div className="px-3 py-3 space-y-3 animate-accordion-down">
          {children}
        </div>
      )}
    </div>
  );
}
