import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Pencil,
  Square,
  Circle,
  ArrowRight,
  Type,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import type {
  Annotation,
  AnnotationTool,
  Point,
  AnnotationState,
} from '../types/annotation';
import {
  DEFAULT_ANNOTATION_STATE,
  ANNOTATION_COLORS,
  STROKE_WIDTH_OPTIONS,
  generateAnnotationId,
} from '../types/annotation';

type ImageAnnotationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageData: string; // base64 image data
  onSave: (annotatedImageData: string) => void;
};

export function ImageAnnotationDialog({
  open,
  onOpenChange,
  imageData,
  onSave,
}: ImageAnnotationDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<AnnotationState>(DEFAULT_ANNOTATION_STATE);
  const [history, setHistory] = useState<Annotation[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Load image when dialog opens
  useEffect(() => {
    if (open && imageData) {
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        setImageDimensions({ width: img.width, height: img.height });
        setImageLoaded(true);
      };
      img.src = imageData.startsWith('data:') ? imageData : `data:image/png;base64,${imageData}`;
    } else {
      setImageLoaded(false);
      setState(DEFAULT_ANNOTATION_STATE);
      setHistory([[]]);
      setHistoryIndex(0);
    }
  }, [open, imageData]);

  // Redraw canvas when annotations change
  useEffect(() => {
    if (!imageLoaded || !canvasRef.current || !imageRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and draw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);

    // Draw all annotations
    const annotations = history[historyIndex] || [];
    annotations.forEach((ann) => drawAnnotation(ctx, ann));

    // Draw current annotation being created
    if (currentAnnotation) {
      drawAnnotation(ctx, currentAnnotation);
    }
  }, [imageLoaded, history, historyIndex, currentAnnotation]);

  const drawAnnotation = (ctx: CanvasRenderingContext2D, ann: Annotation) => {
    ctx.strokeStyle = ann.color;
    ctx.fillStyle = ann.color;
    ctx.lineWidth = ann.strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (ann.tool) {
      case 'pen':
        if (ann.points.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(ann.points[0].x, ann.points[0].y);
        ann.points.forEach((p) => ctx.lineTo(p.x, p.y));
        ctx.stroke();
        break;
      case 'eraser':
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        if (ann.points.length > 0) {
          ctx.moveTo(ann.points[0].x, ann.points[0].y);
          ann.points.forEach((p) => ctx.lineTo(p.x, p.y));
        }
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
        break;
      case 'rectangle': {
        const width = ann.end.x - ann.start.x;
        const height = ann.end.y - ann.start.y;
        if ('filled' in ann && ann.filled) {
          ctx.fillRect(ann.start.x, ann.start.y, width, height);
        } else {
          ctx.strokeRect(ann.start.x, ann.start.y, width, height);
        }
        break;
      }
      case 'circle': {
        ctx.beginPath();
        ctx.ellipse(ann.center.x, ann.center.y, Math.abs(ann.radiusX), Math.abs(ann.radiusY), 0, 0, 2 * Math.PI);
        if ('filled' in ann && ann.filled) {
          ctx.fill();
        } else {
          ctx.stroke();
        }
        break;
      }
      case 'arrow':
        drawArrow(ctx, ann.start, ann.end, ann.strokeWidth);
        break;
      case 'text':
        ctx.font = `${ann.fontSize}px sans-serif`;
        ctx.fillText(ann.text, ann.position.x, ann.position.y);
        break;
    }
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, start: Point, end: Point, strokeWidth: number) => {
    const headLength = strokeWidth * 4;
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(end.x, end.y);
    ctx.lineTo(end.x - headLength * Math.cos(angle - Math.PI / 6), end.y - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(end.x - headLength * Math.cos(angle + Math.PI / 6), end.y - headLength * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  };

  const getCanvasPoint = useCallback((e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  }, []);

  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const point = getCanvasPoint(e);
    setIsDrawing(true);

    const baseAnn = {
      id: generateAnnotationId(),
      color: state.currentColor,
      strokeWidth: state.strokeWidth,
    };

    switch (state.currentTool) {
      case 'pen':
        setCurrentAnnotation({ ...baseAnn, tool: 'pen', points: [point] });
        break;
      case 'eraser':
        setCurrentAnnotation({ ...baseAnn, tool: 'eraser', points: [point] });
        break;
      case 'rectangle':
        setCurrentAnnotation({ ...baseAnn, tool: 'rectangle', start: point, end: point, filled: state.filled });
        break;
      case 'circle':
        setCurrentAnnotation({ ...baseAnn, tool: 'circle', center: point, radiusX: 0, radiusY: 0, filled: state.filled });
        break;
      case 'arrow':
        setCurrentAnnotation({ ...baseAnn, tool: 'arrow', start: point, end: point });
        break;
      case 'text': {
        const text = prompt('输入文字:');
        if (text) {
          const textAnn = { ...baseAnn, tool: 'text' as const, position: point, text, fontSize: state.fontSize };
          addAnnotation(textAnn);
        }
        break;
      }
    }
  }, [getCanvasPoint, state]);

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !currentAnnotation) return;
    e.preventDefault();
    const point = getCanvasPoint(e);

    switch (currentAnnotation.tool) {
      case 'pen':
      case 'eraser':
        setCurrentAnnotation({ ...currentAnnotation, points: [...currentAnnotation.points, point] });
        break;
      case 'rectangle':
        setCurrentAnnotation({ ...currentAnnotation, end: point });
        break;
      case 'circle': {
        const radiusX = Math.abs(point.x - currentAnnotation.center.x);
        const radiusY = Math.abs(point.y - currentAnnotation.center.y);
        setCurrentAnnotation({ ...currentAnnotation, radiusX, radiusY });
        break;
      }
      case 'arrow':
        setCurrentAnnotation({ ...currentAnnotation, end: point });
        break;
    }
  }, [isDrawing, currentAnnotation, getCanvasPoint]);

  const handlePointerUp = useCallback(() => {
    if (currentAnnotation && isDrawing) {
      addAnnotation(currentAnnotation);
    }
    setIsDrawing(false);
    setCurrentAnnotation(null);
  }, [currentAnnotation, isDrawing]);

  const addAnnotation = (ann: Annotation) => {
    const newAnnotations = [...(history[historyIndex] || []), ann];
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newAnnotations);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  const clearAll = () => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleSave = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
    onSave(base64);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const setTool = (tool: AnnotationTool) => {
    setState((s) => ({ ...s, currentTool: tool }));
  };

  const setColor = (color: string) => {
    setState((s) => ({ ...s, currentColor: color }));
  };

  const setStrokeWidth = (width: number) => {
    setState((s) => ({ ...s, strokeWidth: width }));
  };

  const canvasWidth = Math.min(imageDimensions.width, 800);
  const canvasHeight = imageDimensions.width > 0
    ? (imageDimensions.height / imageDimensions.width) * canvasWidth
    : 600;

  const toolButtons: { tool: AnnotationTool; icon: React.ReactNode; label: string }[] = [
    { tool: 'pen', icon: <Pencil className="h-4 w-4" />, label: '画笔' },
    { tool: 'rectangle', icon: <Square className="h-4 w-4" />, label: '矩形' },
    { tool: 'circle', icon: <Circle className="h-4 w-4" />, label: '圆形' },
    { tool: 'arrow', icon: <ArrowRight className="h-4 w-4" />, label: '箭头' },
    { tool: 'text', icon: <Type className="h-4 w-4" />, label: '文字' },
    { tool: 'eraser', icon: <Eraser className="h-4 w-4" />, label: '橡皮擦' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] w-auto">
        <DialogHeader>
          <DialogTitle>图片标注</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 p-2 bg-muted rounded-lg">
            {/* Tool buttons */}
            <div className="flex gap-1">
              {toolButtons.map(({ tool, icon, label }) => (
                <Button
                  key={tool}
                  size="sm"
                  variant={state.currentTool === tool ? 'default' : 'outline'}
                  onClick={() => setTool(tool)}
                  title={label}
                >
                  {icon}
                </Button>
              ))}
            </div>

            <Separator orientation="vertical" className="h-8" />

            {/* Color picker */}
            <div className="flex gap-1">
              {ANNOTATION_COLORS.slice(0, 6).map((color) => (
                <button
                  key={color}
                  className={`w-6 h-6 rounded border-2 ${state.currentColor === color ? 'border-primary' : 'border-transparent'}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setColor(color)}
                  title={color}
                />
              ))}
            </div>

            <Separator orientation="vertical" className="h-8" />

            {/* Stroke width */}
            <div className="flex gap-1">
              {STROKE_WIDTH_OPTIONS.slice(0, 4).map((width) => (
                <Button
                  key={width}
                  size="sm"
                  variant={state.strokeWidth === width ? 'default' : 'outline'}
                  onClick={() => setStrokeWidth(width)}
                  className="w-8"
                >
                  {width}
                </Button>
              ))}
            </div>

            <Separator orientation="vertical" className="h-8" />

            {/* Undo/Redo/Clear */}
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={undo} disabled={historyIndex <= 0} title="撤销">
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={redo} disabled={historyIndex >= history.length - 1} title="重做">
                <Redo2 className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={clearAll} title="清除全部">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Canvas container */}
          <div ref={containerRef} className="relative overflow-auto max-h-[60vh] border rounded-lg">
            {imageLoaded ? (
              <canvas
                ref={canvasRef}
                width={canvasWidth}
                height={canvasHeight}
                className="touch-none cursor-crosshair"
                onMouseDown={handlePointerDown}
                onMouseMove={handlePointerMove}
                onMouseUp={handlePointerUp}
                onMouseLeave={handlePointerUp}
                onTouchStart={handlePointerDown}
                onTouchMove={handlePointerMove}
                onTouchEnd={handlePointerUp}
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                加载图片中...
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            <X className="h-4 w-4 mr-2" />
            取消
          </Button>
          <Button onClick={handleSave}>
            <Check className="h-4 w-4 mr-2" />
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

