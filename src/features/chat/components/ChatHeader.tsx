import { RotateCcw, Settings, Loader2, Sparkles, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type ChatHeaderProps = {
  loading: boolean
  onReset: () => void
  onOpenSettings?: () => void
  onOpenAdmin?: () => void
  isAuthenticated?: boolean
}

export function ChatHeader({ loading, onReset, onOpenSettings, onOpenAdmin, isAuthenticated }: ChatHeaderProps) {
  return (
    <header className="ios-navbar flex items-center justify-between px-4 py-3 md:px-5 md:py-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-lg md:text-xl font-semibold tracking-tight">
            <span className="md:hidden">Gemini Studio</span>
            <span className="hidden md:inline">Gemini Image Studio</span>
          </h1>
        </div>
        {loading && (
          <Badge variant="secondary" className="gap-1.5 animate-pulse rounded-full px-3 py-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="text-xs font-medium">Generating…</span>
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-1 md:gap-2">
        {isAuthenticated && onOpenAdmin && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenAdmin}
            title="Admin Settings"
            className="h-9 w-9 rounded-xl ios-pressable hover:bg-secondary/80"
          >
            <Shield className="h-5 w-5 text-primary" />
          </Button>
        )}
        {onOpenSettings && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSettings}
            title="Settings"
            className="h-9 w-9 rounded-xl ios-pressable hover:bg-secondary/80"
          >
            <Settings className="h-5 w-5 text-muted-foreground" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onReset}
          title="Reset conversation"
          disabled={loading}
          className="h-9 w-9 rounded-xl ios-pressable hover:bg-secondary/80 disabled:opacity-40"
        >
          <RotateCcw className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>
    </header>
  )
}
