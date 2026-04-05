import { Alignment, TableConfig, ImageWrapping } from './schema';
export * from './schema';

export interface DocElement {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize: number;
  color?: string;
  fontFamily?: string;
  strikethrough?: boolean;
  backgroundColor?: string;
  subscript?: boolean;
  superscript?: boolean;
  
  // Expanded MS Word Features mapped from Schema (Backward compatible)
  align?: Alignment;
  lineHeight?: number;
  spacingBefore?: number;
  spacingAfter?: number;
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  
  // Image block
  elementType?: 'text' | 'image';
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageRotation?: number;
  imageXOffset?: number;
  imageOpacity?: number;
  imageFilters?: {
    brightness?: number; 
    contrast?: number;   
    grayscale?: number; 
    saturate?: number;   
    sepia?: number;      
    blur?: number;
    hueRotate?: number;
  };
  imageBorder?: {
    color: string;
    width: number;
    radius?: number;
    style?: 'solid' | 'dashed' | 'dotted';
  };
  imageShadow?: {
    color: string;
    blur: number;
    x: number;
    y: number;
  };
  imageCrop?: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
  imageFlip?: {
    horizontal: boolean;
    vertical: boolean;
  };
  altText?: string;
  transparentColor?: string;
  tableConfig?: TableConfig;
  
  imageWrapping?: ImageWrapping;
  imagePosition?: {
    horizontal: { type: 'alignment' | 'absolute' | 'relative', value: number, relativeTo: string },
    vertical: { type: 'alignment' | 'absolute' | 'relative', value: number, relativeTo: string },
    moveWithText: boolean,
    lockAnchor: boolean,
    allowOverlap: boolean,
    layoutInTableCell: boolean
  };
  imageSizeOptions?: {
    widthRelative?: number;
    widthRelativeTo?: string;
    heightRelative?: number;
    heightRelativeTo?: string;
    lockAspectRatio?: boolean;
    relativeToOriginalSize?: boolean;
  };
  
  listType?: 'bullet' | 'number';
  listLevel?: number;

  tabStops?: Array<{
    position: number;
    type: 'left' | 'center' | 'right' | 'decimal';
  }>;
}

export interface EditorConfig {
  width: number;
  height: number;
  scale?: number;
  padding: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export interface TextMetrics {
  width: number;
  height: number;
  ascent: number;
  descent: number;
}

export interface RenderChar {
  char: string;
  elementIndex: number;
  charIndex: number; // index within element
  x: number;
  y: number;
  width: number;
  height: number;
  ascent: number;
  fontSize: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  backgroundColor?: string;
  subscript?: boolean;
  superscript?: boolean;
  color?: string;
}

export interface RenderLine {
  chars: RenderChar[];
  y: number;
  height: number;
  startIndex: number;
  endIndex: number;
}

export interface RenderPage {
  lines: RenderLine[];
  pageIndex: number;
}

export interface Selection {
  start: number; // index in flat char array
  end: number;
}
