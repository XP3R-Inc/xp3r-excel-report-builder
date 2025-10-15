import { DesignTokens, StylePreset, UserPreferences, ColorToken, TextStyleToken, ShadowToken, SpacingToken } from './types';

const STORAGE_KEYS = {
  DESIGN_TOKENS: 'design_tokens',
  USER_PREFERENCES: 'user_preferences',
  ELEMENT_HISTORY: 'element_history',
};

const DEFAULT_COLORS: ColorToken[] = [
  { id: 'brand-primary', name: 'Primary', value: '#3B82F6', category: 'brand' },
  { id: 'brand-secondary', name: 'Secondary', value: '#8B5CF6', category: 'brand' },
  { id: 'brand-accent', name: 'Accent', value: '#10B981', category: 'brand' },
  { id: 'neutral-black', name: 'Black', value: '#000000', category: 'neutral' },
  { id: 'neutral-gray-900', name: 'Gray 900', value: '#111827', category: 'neutral' },
  { id: 'neutral-gray-700', name: 'Gray 700', value: '#374151', category: 'neutral' },
  { id: 'neutral-gray-500', name: 'Gray 500', value: '#6B7280', category: 'neutral' },
  { id: 'neutral-gray-300', name: 'Gray 300', value: '#D1D5DB', category: 'neutral' },
  { id: 'neutral-gray-100', name: 'Gray 100', value: '#F3F4F6', category: 'neutral' },
  { id: 'neutral-white', name: 'White', value: '#FFFFFF', category: 'neutral' },
  { id: 'semantic-success', name: 'Success', value: '#10B981', category: 'semantic' },
  { id: 'semantic-warning', name: 'Warning', value: '#F59E0B', category: 'semantic' },
  { id: 'semantic-error', name: 'Error', value: '#EF4444', category: 'semantic' },
  { id: 'semantic-info', name: 'Info', value: '#3B82F6', category: 'semantic' },
];

const DEFAULT_TEXT_STYLES: TextStyleToken[] = [
  { id: 'heading', name: 'Heading', fontSize: 24, fontFamily: 'Arial', fontWeight: 'bold', lineHeight: 1.2 },
  { id: 'subheading', name: 'Subheading', fontSize: 18, fontFamily: 'Arial', fontWeight: '600', lineHeight: 1.3 },
  { id: 'body', name: 'Body', fontSize: 14, fontFamily: 'Arial', fontWeight: 'normal', lineHeight: 1.5 },
  { id: 'caption', name: 'Caption', fontSize: 12, fontFamily: 'Arial', fontWeight: 'normal', lineHeight: 1.4 },
  { id: 'small', name: 'Small', fontSize: 10, fontFamily: 'Arial', fontWeight: 'normal', lineHeight: 1.4 },
];

const DEFAULT_SHADOWS: ShadowToken[] = [
  { id: 'subtle', name: 'Subtle Shadow', value: '0 1px 2px rgba(0, 0, 0, 0.05)' },
  { id: 'soft', name: 'Soft Shadow', value: '0 4px 6px rgba(0, 0, 0, 0.1)' },
  { id: 'medium', name: 'Medium Shadow', value: '0 10px 15px rgba(0, 0, 0, 0.1)' },
  { id: 'strong', name: 'Strong Shadow', value: '0 20px 25px rgba(0, 0, 0, 0.15)' },
  { id: 'glow', name: 'Soft Glow', value: '0 0 15px rgba(59, 130, 246, 0.3)' },
];

const DEFAULT_SPACING: SpacingToken[] = [
  { id: 'xs', name: 'XS', value: 4 },
  { id: 'sm', name: 'SM', value: 8 },
  { id: 'md', name: 'MD', value: 12 },
  { id: 'lg', name: 'LG', value: 16 },
  { id: 'xl', name: 'XL', value: 24 },
  { id: '2xl', name: '2XL', value: 32 },
  { id: '3xl', name: '3XL', value: 48 },
];

const DEFAULT_PRESETS: StylePreset[] = [
  {
    id: 'text-heading',
    name: 'Heading',
    category: 'text',
    description: 'Large bold heading',
    style: { fontSize: 24, fontWeight: 'bold', lineHeight: 1.2, color: '#111827' },
  },
  {
    id: 'text-subheading',
    name: 'Subheading',
    category: 'text',
    description: 'Medium semibold subheading',
    style: { fontSize: 18, fontWeight: '600', lineHeight: 1.3, color: '#374151' },
  },
  {
    id: 'text-body',
    name: 'Body',
    category: 'text',
    description: 'Regular body text',
    style: { fontSize: 14, fontWeight: 'normal', lineHeight: 1.5, color: '#111827' },
  },
  {
    id: 'text-caption',
    name: 'Caption',
    category: 'text',
    description: 'Small caption text',
    style: { fontSize: 12, fontWeight: 'normal', lineHeight: 1.4, color: '#6B7280' },
  },
  {
    id: 'shape-card',
    name: 'Card',
    category: 'shape',
    description: 'Rounded card with shadow',
    style: { backgroundColor: '#FFFFFF', borderRadius: 8, boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', padding: 16 },
  },
  {
    id: 'shape-pill',
    name: 'Pill',
    category: 'shape',
    description: 'Fully rounded pill shape',
    style: { backgroundColor: '#3B82F6', borderRadius: 9999, padding: 8, color: '#FFFFFF' },
  },
  {
    id: 'shape-divider',
    name: 'Divider',
    category: 'shape',
    description: 'Thin horizontal line',
    style: { backgroundColor: '#E5E7EB', borderWidth: 0 },
  },
  {
    id: 'effect-subtle-shadow',
    name: 'Subtle Shadow',
    category: 'effect',
    description: 'Very light shadow',
    style: { boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' },
  },
  {
    id: 'effect-soft-glow',
    name: 'Soft Glow',
    category: 'effect',
    description: 'Blue glow effect',
    style: { boxShadow: '0 0 15px rgba(59, 130, 246, 0.3)' },
  },
  {
    id: 'effect-strong-shadow',
    name: 'Strong Shadow',
    category: 'effect',
    description: 'Heavy shadow for depth',
    style: { boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)' },
  },
];

function getDefaultTokens(): DesignTokens {
  return {
    colors: DEFAULT_COLORS,
    textStyles: DEFAULT_TEXT_STYLES,
    shadows: DEFAULT_SHADOWS,
    spacing: DEFAULT_SPACING,
    presets: DEFAULT_PRESETS,
    recentColors: [],
  };
}

export function loadDesignTokens(): DesignTokens {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.DESIGN_TOKENS);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...getDefaultTokens(),
        ...parsed,
        colors: [...DEFAULT_COLORS, ...(parsed.customColors || [])],
        textStyles: [...DEFAULT_TEXT_STYLES, ...(parsed.customTextStyles || [])],
        shadows: [...DEFAULT_SHADOWS, ...(parsed.customShadows || [])],
        spacing: [...DEFAULT_SPACING, ...(parsed.customSpacing || [])],
        presets: [...DEFAULT_PRESETS, ...(parsed.customPresets || [])],
      };
    }
  } catch (error) {
    console.error('Failed to load design tokens:', error);
  }
  return getDefaultTokens();
}

export function saveDesignTokens(tokens: DesignTokens): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DESIGN_TOKENS, JSON.stringify(tokens));
  } catch (error) {
    console.error('Failed to save design tokens:', error);
  }
}

export function addRecentColor(color: string): void {
  const tokens = loadDesignTokens();
  const recent = tokens.recentColors.filter(c => c !== color);
  recent.unshift(color);
  if (recent.length > 10) {
    recent.pop();
  }
  tokens.recentColors = recent;
  saveDesignTokens(tokens);
}

export function saveCustomPreset(preset: StylePreset): void {
  const tokens = loadDesignTokens();
  const existingIndex = tokens.presets.findIndex(p => p.id === preset.id);
  if (existingIndex >= 0) {
    tokens.presets[existingIndex] = preset;
  } else {
    tokens.presets.push(preset);
  }
  saveDesignTokens(tokens);
}

export function deleteCustomPreset(presetId: string): void {
  const tokens = loadDesignTokens();
  tokens.presets = tokens.presets.filter(p => p.id !== presetId && !p.id.startsWith('text-') && !p.id.startsWith('shape-') && !p.id.startsWith('effect-'));
  saveDesignTokens(tokens);
}

export function loadUserPreferences(): UserPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load user preferences:', error);
  }
  return {
    panelPreferences: {
      expandedSections: {},
      perElementType: {
        text: ['typography', 'data'],
        shape: ['fill-stroke', 'effects'],
        image: ['image', 'effects'],
      },
    },
    recentColors: [],
    customPresets: [],
  };
}

export function saveUserPreferences(preferences: UserPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
  } catch (error) {
    console.error('Failed to save user preferences:', error);
  }
}

export function updatePanelPreferences(expandedSections: Record<string, boolean>): void {
  const prefs = loadUserPreferences();
  prefs.panelPreferences.expandedSections = expandedSections;
  saveUserPreferences(prefs);
}
