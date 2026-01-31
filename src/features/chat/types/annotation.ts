// Annotation tool types
export type AnnotationTool = 'pen' | 'rectangle' | 'circle' | 'arrow' | 'text' | 'eraser';

// Point for drawing
export type Point = {
  x: number;
  y: number;
};

// Base annotation properties
type BaseAnnotation = {
  id: string;
  tool: AnnotationTool;
  color: string;
  strokeWidth: number;
};

// Freehand pen stroke
export type PenAnnotation = BaseAnnotation & {
  tool: 'pen';
  points: Point[];
};

// Rectangle shape
export type RectangleAnnotation = BaseAnnotation & {
  tool: 'rectangle';
  start: Point;
  end: Point;
  filled: boolean;
};

// Circle/Ellipse shape
export type CircleAnnotation = BaseAnnotation & {
  tool: 'circle';
  center: Point;
  radiusX: number;
  radiusY: number;
  filled: boolean;
};

// Arrow annotation
export type ArrowAnnotation = BaseAnnotation & {
  tool: 'arrow';
  start: Point;
  end: Point;
};

// Text annotation
export type TextAnnotation = BaseAnnotation & {
  tool: 'text';
  position: Point;
  text: string;
  fontSize: number;
};

// Eraser stroke (same as pen but for erasing)
export type EraserAnnotation = BaseAnnotation & {
  tool: 'eraser';
  points: Point[];
};

// Union type for all annotations
export type Annotation =
  | PenAnnotation
  | RectangleAnnotation
  | CircleAnnotation
  | ArrowAnnotation
  | TextAnnotation
  | EraserAnnotation;

// Annotation state for a single image
export type AnnotationState = {
  annotations: Annotation[];
  currentTool: AnnotationTool;
  currentColor: string;
  strokeWidth: number;
  fontSize: number;
  filled: boolean;
};

// Default annotation state
export const DEFAULT_ANNOTATION_STATE: AnnotationState = {
  annotations: [],
  currentTool: 'pen',
  currentColor: '#ff0000',
  strokeWidth: 3,
  fontSize: 16,
  filled: false,
};

// Available colors for annotation
export const ANNOTATION_COLORS = [
  '#ff0000', // Red
  '#00ff00', // Green
  '#0000ff', // Blue
  '#ffff00', // Yellow
  '#ff00ff', // Magenta
  '#00ffff', // Cyan
  '#ffffff', // White
  '#000000', // Black
  '#ff8800', // Orange
  '#8800ff', // Purple
];

// Stroke width options
export const STROKE_WIDTH_OPTIONS = [1, 2, 3, 5, 8, 12];

// Font size options
export const FONT_SIZE_OPTIONS = [12, 16, 20, 24, 32, 48];

// Generate unique ID for annotations
export const generateAnnotationId = (): string => {
  return `ann_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

