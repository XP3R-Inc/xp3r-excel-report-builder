export interface DataBinding {
  field: string;
  format?: 'none' | 'currency' | 'date' | 'number' | 'percentage';
  prefix?: string;
  suffix?: string;
  dateFormat?: string;
  currencySymbol?: string;
  decimalPlaces?: number;
  locale?: string;
  thousandSeparator?: boolean;
}

export interface ConditionalRule {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_empty' | 'empty' | 'greater_than' | 'less_than';
  value?: string | number;
  action: 'hide' | 'show' | 'color' | 'background';
  actionValue?: string;
}

export interface FallbackConfig {
  strategy: 'placeholder' | 'hide' | 'default';
  placeholderText?: string;
  defaultValue?: string;
}

export interface CanvasElement {
  id: string;
  type: 'text' | 'image' | 'shape';
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  locked?: boolean;
  hidden?: boolean;
  groupId?: string;
  layerIndex?: number;
  dataBinding?: string;
  dataBindings?: DataBinding[];
  bindingSeparator?: string;
  isList?: boolean;
  listDelimiter?: string;
  listLayout?: 'vertical' | 'horizontal';
  listStyle?: 'none' | 'bullets' | 'numbers';
  imageUrl?: string;
  imageFitMode?: 'fill' | 'fit' | 'crop' | 'tile';
  imageFocalPoint?: { x: number; y: number };
  altText?: string;
  overflowStrategy?: 'wrap' | 'auto-shrink' | 'truncate' | 'scale-line-height' | 'auto-expand';
  minFontSize?: number;
  hyphenation?: boolean;
  wordBreak?: 'word' | 'character';
  fallbackConfig?: FallbackConfig;
  conditionalRules?: ConditionalRule[];
  linkedStyleToken?: string;
  constraints?: {
    pinTop?: boolean;
    pinBottom?: boolean;
    pinLeft?: boolean;
    pinRight?: boolean;
    centerHorizontal?: boolean;
    centerVertical?: boolean;
    maintainAspectRatio?: boolean;
  };
  style?: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    fontStyle?: string;
    textDecoration?: string;
    lineHeight?: number;
    letterSpacing?: number;
    color?: string;
    backgroundColor?: string;
    borderWidth?: number;
    borderColor?: string;
    borderStyle?: string;
    borderRadius?: number;
    borderTopLeftRadius?: number;
    borderTopRightRadius?: number;
    borderBottomLeftRadius?: number;
    borderBottomRightRadius?: number;
    textAlign?: string;
    verticalAlign?: string;
    padding?: number;
    paddingTop?: number;
    paddingRight?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    opacity?: number;
    fillOpacity?: number;
    strokeOpacity?: number;
    boxShadow?: string;
    strokeAlignment?: 'inside' | 'center' | 'outside';
    dashPattern?: 'solid' | 'subtle' | 'dense' | 'custom';
    customDash?: string;
  };
  content?: string;
}

export interface ElementGroup {
  id: string;
  name: string;
  elementIds: string[];
  locked?: boolean;
}

export interface ColorToken {
  id: string;
  name: string;
  value: string;
  category?: 'brand' | 'neutral' | 'semantic' | 'recent';
}

export interface TextStyleToken {
  id: string;
  name: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  lineHeight: number;
  letterSpacing?: number;
  textTransform?: string;
}

export interface ShadowToken {
  id: string;
  name: string;
  value: string;
}

export interface SpacingToken {
  id: string;
  name: string;
  value: number;
}

export interface StylePreset {
  id: string;
  name: string;
  category: 'text' | 'shape' | 'effect';
  style: Partial<CanvasElement['style']>;
  description?: string;
}

export interface DesignTokens {
  colors: ColorToken[];
  textStyles: TextStyleToken[];
  shadows: ShadowToken[];
  spacing: SpacingToken[];
  presets: StylePreset[];
  recentColors: string[];
}

export interface PropertyChange {
  property: string;
  oldValue: unknown;
  newValue: unknown;
  timestamp: number;
}

export interface ElementHistory {
  elementId: string;
  changes: PropertyChange[];
}

export interface PanelPreferences {
  expandedSections: Record<string, boolean>;
  perElementType: Record<string, string[]>;
}

export interface UserPreferences {
  panelPreferences: PanelPreferences;
  recentColors: string[];
  customPresets: StylePreset[];
}

