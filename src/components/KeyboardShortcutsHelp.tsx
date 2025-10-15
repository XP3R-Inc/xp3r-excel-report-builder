import { X, Command, Keyboard } from 'lucide-react';
import { formatShortcut, getModifierKey } from '../hooks/useKeyboardShortcuts';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutGroup {
  title: string;
  shortcuts: Array<{
    keys: string;
    description: string;
  }>;
}

export function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  if (!isOpen) return null;

  const modKey = getModifierKey();

  const shortcutGroups: ShortcutGroup[] = [
    {
      title: 'Element Manipulation',
      shortcuts: [
        { keys: `${modKey}+C`, description: 'Copy selected elements' },
        { keys: `${modKey}+X`, description: 'Cut selected elements' },
        { keys: `${modKey}+V`, description: 'Paste elements' },
        { keys: `${modKey}+D`, description: 'Duplicate selected elements' },
        { keys: 'Delete / Backspace', description: 'Delete selected elements' },
        { keys: `${modKey}+A`, description: 'Select all elements' },
        { keys: 'Escape', description: 'Deselect all' },
      ],
    },
    {
      title: 'Layer Management',
      shortcuts: [
        { keys: `${modKey}+]`, description: 'Bring forward' },
        { keys: `${modKey}+[`, description: 'Send backward' },
        { keys: `${modKey}+Shift+]`, description: 'Bring to front' },
        { keys: `${modKey}+Shift+[`, description: 'Send to back' },
        { keys: `${modKey}+G`, description: 'Group selected elements' },
        { keys: `${modKey}+Shift+G`, description: 'Ungroup' },
      ],
    },
    {
      title: 'Positioning',
      shortcuts: [
        { keys: 'Arrow Keys', description: 'Nudge 1px' },
        { keys: 'Shift+Arrow Keys', description: 'Nudge 10px' },
      ],
    },
    {
      title: 'History',
      shortcuts: [
        { keys: `${modKey}+Z`, description: 'Undo' },
        { keys: `${modKey}+Shift+Z`, description: 'Redo' },
        { keys: `${modKey}+Y`, description: 'Redo (Windows)' },
      ],
    },
    {
      title: 'View',
      shortcuts: [
        { keys: `${modKey}++`, description: 'Zoom in' },
        { keys: `${modKey}+-`, description: 'Zoom out' },
        { keys: `${modKey}+0`, description: 'Reset zoom to 100%' },
        { keys: `${modKey}+1`, description: 'Zoom to fit' },
        { keys: 'Space+Drag', description: 'Pan canvas' },
      ],
    },
    {
      title: 'Quick Actions',
      shortcuts: [
        { keys: `${modKey}+S`, description: 'Save template' },
        { keys: `${modKey}+P`, description: 'Preview' },
        { keys: `${modKey}+E`, description: 'Export' },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <Keyboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Keyboard Shortcuts</h2>
              <p className="text-sm text-gray-600">Speed up your workflow</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {shortcutGroups.map((group) => (
              <div key={group.title} className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                  <div className="h-px flex-1 bg-gradient-to-r from-blue-200 to-transparent"></div>
                  <span>{group.title}</span>
                  <div className="h-px flex-1 bg-gradient-to-l from-blue-200 to-transparent"></div>
                </h3>
                <div className="space-y-2">
                  {group.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm text-gray-700">{shortcut.description}</span>
                      <kbd className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded shadow-sm">
                        {shortcut.keys}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Command className="w-4 h-4" />
            <span>Press <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-gray-200 rounded">?</kbd> anytime to view shortcuts</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
