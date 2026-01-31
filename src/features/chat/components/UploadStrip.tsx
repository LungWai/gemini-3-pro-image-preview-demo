import { useState } from 'react'
import { X, Pencil } from 'lucide-react'
import type { UploadItem } from '@/features/chat/types'
import { getThumbSize } from '../utils/thumb'
import { ImageAnnotationDialog } from './ImageAnnotationDialog'

type UploadStripProps = {
  uploads: UploadItem[]
  onRemove: (id: string) => void
  onUpdateImage: (id: string, newDataUrl: string) => void
  aspectRatio?: string | number
}

export function UploadStrip({ uploads, onRemove, onUpdateImage, aspectRatio }: UploadStripProps) {
  const [annotatingImage, setAnnotatingImage] = useState<UploadItem | null>(null)

  // 条件渲染:无上传时不显示
  if (uploads.length === 0) return null

  const MAX_EDGE = 72

  const handleAnnotationSave = (annotatedBase64: string) => {
    if (annotatingImage) {
      const newDataUrl = `data:image/png;base64,${annotatedBase64}`
      onUpdateImage(annotatingImage.id, newDataUrl)
      setAnnotatingImage(null)
    }
  }

  return (
    <>
      <div className="flex overflow-x-auto gap-2 pb-2 px-1 custom-scrollbar">
        {uploads.map((img) => (
          <div
            key={img.id}
            className="relative shrink-0 group rounded-lg border shadow-sm bg-muted/20 overflow-hidden flex items-center justify-center"
            style={getThumbSize(img.aspectRatio ?? aspectRatio ?? 1, MAX_EDGE)}
          >
            <img
              src={img.dataUrl}
              className="w-full h-full object-contain"
              alt={img.name}
            />
            {/* Annotate button */}
            <button
              onClick={() => setAnnotatingImage(img)}
              className="absolute bottom-0.5 right-0.5 z-10 bg-black/50 hover:bg-primary text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
              aria-label="标注图片"
            >
              <Pencil className="h-3 w-3" />
            </button>
            {/* Remove button */}
            <button
              onClick={() => onRemove(img.id)}
              className="absolute top-0.5 right-0.5 z-10 bg-black/50 hover:bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
              aria-label="删除图片"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Annotation Dialog */}
      <ImageAnnotationDialog
        open={!!annotatingImage}
        onOpenChange={(open) => !open && setAnnotatingImage(null)}
        imageData={annotatingImage?.dataUrl || ''}
        onSave={handleAnnotationSave}
      />
    </>
  )
}
