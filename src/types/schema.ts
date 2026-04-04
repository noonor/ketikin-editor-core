/**
 * ---------------------------------------------------------
 * Ketikin Editor Core Schema - "Source of Truth"
 * Advanced Word-Processor JSON Data Model
 * ---------------------------------------------------------
 */

export type PageSize = 'A4' | 'Letter' | 'Legal' | 'Custom';
export type Orientation = 'portrait' | 'landscape';
export type Alignment = 'left' | 'center' | 'right' | 'justify';

export interface DocumentSetup {
  pageSize: PageSize;
  orientation: Orientation;
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  customWidth?: number; // Active if pageSize === 'Custom' (in pixels or pt)
  customHeight?: number; // Active if pageSize === 'Custom'
}

export interface DocumentMetadata {
  title: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

// ---------------------------------------------------------
// Page Elements (Headers, Footers, Numbering)
// ---------------------------------------------------------
export interface PageHeaderFooter {
  type: 'Header' | 'Footer';
  content: BlockElement[];
  displayOnFirstPage: boolean;
  distanceFromEdge: number;
}

// ---------------------------------------------------------
// Collaboration & Academic Tools
// ---------------------------------------------------------
export interface TrackChange {
  id: string;
  authorId: string;
  timestamp: string;
  type: 'insert' | 'delete' | 'format';
  originalText?: string;
  newText?: string;
}

export interface Annotation {
  id: string;
  authorId: string;
  timestamp: string;
  text: string;    // The comment content itself
  resolved: boolean;
  // Anchored to indices in the document
  anchorStart: number;
  anchorEnd: number;
}

// ---------------------------------------------------------
// Embedded Objects (Images, Tables)
// ---------------------------------------------------------
export interface TableCell {
  content: BlockElement[];
  colSpan: number;
  rowSpan: number;
  width?: number; // absolute px or percentage
  backgroundColor?: string;
}

export interface TableRow {
  cells: TableCell[];
  height?: number; // optional fixed row height
}

export interface TableConfig {
  rows: TableRow[];
  borderWidth: number;
  borderColor: string;
}

// ---------------------------------------------------------
// Typography & Layout Structure
// ---------------------------------------------------------
export type BlockType = 'paragraph' | 'heading' | 'list' | 'table' | 'image';
export type ImageWrapping = 'inline' | 'square' | 'tight' | 'through' | 'topBottom' | 'behind' | 'front';

export interface InlineFormat {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
  fontFamily?: string;
  link?: string;     // URL for hyperlinks
}

export interface TextRun extends InlineFormat {
  text: string;
  trackChangeId?: string; // If this run was inserted via track changes
}

export interface BlockStyle {
  align?: Alignment;
  lineHeight?: number; // 1.0, 1.15, 1.5, 2.0 multiplier
  spacingBefore?: number; // padding above paragraph
  spacingAfter?: number;  // padding below paragraph
  indentLeft?: number;
  indentRight?: number;
  firstLineIndent?: number;
}

export interface BlockElement {
  id: string; // Unique block ID (UUID)
  type: BlockType;
  runs?: TextRun[]; // Core text elements
  style?: BlockStyle;
  
  // Specific to headings (Academic structure / ToC)
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6; 
  
  // Specific to Images
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageRotation?: number; // 0-360 degrees
  imageOpacity?: number;  // 0-1
  imageFilters?: {
    brightness?: number; // 0-2 (1=normal)
    contrast?: number;   // 0-2 (1=normal)
    grayscale?: number;  // 0-1
    saturate?: number;   // 0-2 (1=normal)
    sepia?: number;      // 0-1
    blur?: number;       // in pixels
    hueRotate?: number;  // 0-360 degrees
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
    left: number;   // percentage 0-100
    top: number;
    right: number;
    bottom: number;
  };
  imageFlip?: {
    horizontal: boolean;
    vertical: boolean;
  };
  altText?: string;
  transparentColor?: string; // Hex color to make transparent
  
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
  
  // Specific to Tables
  tableConfig?: TableConfig;
  
  // Specific to Lists
  listType?: 'bullet' | 'number';
  listLevel?: number; // indentation depth
}

// ---------------------------------------------------------
// Root Document Interface
// ---------------------------------------------------------
export interface KetikinDocument {
  metadata: DocumentMetadata;
  setup: DocumentSetup;
  header?: PageHeaderFooter;
  footer?: PageHeaderFooter;
  body: BlockElement[];
  annotations: Annotation[];
  trackChanges: Record<string, TrackChange>;
}
