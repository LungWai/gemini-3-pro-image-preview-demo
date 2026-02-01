import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

  // PWA-friendly text input dialog state
  const [textInputOpen, setTextInputOpen] = useState(false);
  const [textInputValue, setTextInputValue] = useState('');
  const [pendingTextPoint, setPendingTextPoint] = useState<Point | null>(null);

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
        // PWA-friendly: use modal dialog instead of prompt()
        setPendingTextPoint(point);
        setTextInputValue('');
        setTextInputOpen(true);
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

  // PWA-friendly text input confirmation
  const handleTextInputConfirm = () => {
    if (pendingTextPoint && textInputValue.trim()) {
      const textAnn = {
        id: generateAnnotationId(),
        color: state.currentColor,
        strokeWidth: state.strokeWidth,
        tool: 'text' as const,
        position: pendingTextPoint,
        text: textInputValue.trim(),
        fontSize: state.fontSize,
      };
      addAnnotation(textAnn);
    }
    setTextInputOpen(false);
    setTextInputValue('');
    setPendingTextPoint(null);
  };

  const handleTextInputCancel = () => {
    setTextInputOpen(false);
    setTextInputValue('');
    setPendingTextPoint(null);
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

  // PWA-friendly: Use larger icons for better touch targets
  const toolButtons: { tool: AnnotationTool; icon: React.ReactNode; label: string }[] = [
    { tool: 'pen', icon: <Pencil className="h-5 w-5" />, label: '画笔' },
    { tool: 'rectangle', icon: <Square className="h-5 w-5" />, label: '矩形' },
    { tool: 'circle', icon: <Circle className="h-5 w-5" />, label: '圆形' },
    { tool: 'arrow', icon: <ArrowRight className="h-5 w-5" />, label: '箭头' },
    { tool: 'text', icon: <Type className="h-5 w-5" />, label: '文字' },
    { tool: 'eraser', icon: <Eraser className="h-5 w-5" />, label: '橡皮擦' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] w-auto">
        <DialogHeader>
          <DialogTitle>图片标注</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 overflow-hidden">
          {/* Toolbar - PWA-friendly with touch-friendly button sizes (min 44x44px) */}
          <div className="flex flex-wrap items-center gap-2 p-2 bg-muted rounded-lg overflow-x-auto">
            {/* Tool buttons - touch-friendly min 44px tap targets */}
            <div className="flex gap-1.5">
              {toolButtons.map(({ tool, icon, label }) => (
                <Button
                  key={tool}
                  size="icon"
                  variant={state.currentTool === tool ? 'default' : 'outline'}
                  onClick={() => setTool(tool)}
                  title={label}
                  className="h-11 w-11 min-h-[44px] min-w-[44px] touch-manipulation"
                >
                  {icon}
                </Button>
              ))}
            </div>

            <Separator orientation="vertical" className="h-8 hidden sm:block" />

            {/* Color picker - touch-friendly */}
            <div className="flex gap-1.5">
              {ANNOTATION_COLORS.slice(0, 6).map((color) => (
                <button
                  key={color}
                  className={`w-9 h-9 min-w-[36px] min-h-[36px] rounded-lg border-2 touch-manipulation transition-transform active:scale-95 ${state.currentColor === color ? 'border-primary ring-2 ring-primary/30' : 'border-transparent'}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setColor(color)}
                  title={color}
                />
              ))}
            </div>

            <Separator orientation="vertical" className="h-8 hidden sm:block" />

            {/* Stroke width - touch-friendly */}
            <div className="flex gap-1.5">
              {STROKE_WIDTH_OPTIONS.slice(0, 4).map((width) => (
                <Button
                  key={width}
                  size="icon"
                  variant={state.strokeWidth === width ? 'default' : 'outline'}
                  onClick={() => setStrokeWidth(width)}
                  className="h-11 w-11 min-h-[44px] min-w-[44px] touch-manipulation text-sm font-medium"
                >
                  {width}
                </Button>
              ))}
            </div>

            <Separator orientation="vertical" className="h-8 hidden sm:block" />

            {/* Undo/Redo/Clear - touch-friendly */}
            <div className="flex gap-1.5">
              <Button size="icon" variant="outline" onClick={undo} disabled={historyIndex <= 0} title="撤销" className="h-11 w-11 min-h-[44px] min-w-[44px] touch-manipulation">
                <Undo2 className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="outline" onClick={redo} disabled={historyIndex >= history.length - 1} title="重做" className="h-11 w-11 min-h-[44px] min-w-[44px] touch-manipulation">
                <Redo2 className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="outline" onClick={clearAll} title="清除全部" className="h-11 w-11 min-h-[44px] min-w-[44px] touch-manipulation">
                <Trash2 className="h-5 w-5" />
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

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={handleCancel} className="touch-manipulation">
            <X className="h-4 w-4 mr-2" />
            取消
          </Button>
          <Button onClick={handleSave} className="touch-manipulation">
            <Check className="h-4 w-4 mr-2" />
            保存
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* PWA-friendly text input dialog - replaces browser prompt() */}
      <Dialog open={textInputOpen} onOpenChange={(open) => !open && handleTextInputCancel()}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>输入文字</DialogTitle>
            <DialogDescription>
              输入要添加到图片上的文字
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="annotation-text" className="sr-only">文字内容</Label>
            <Input
              id="annotation-text"
              value={textInputValue}
              onChange={(e) => setTextInputValue(e.target.value)}
              placeholder="输入文字..."
              className="text-base"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleTextInputConfirm();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleTextInputCancel} className="touch-manipulation">
              取消
            </Button>
            <Button onClick={handleTextInputConfirm} disabled={!textInputValue.trim()} className="touch-manipulation">
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

