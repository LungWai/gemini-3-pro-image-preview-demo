import { useState } from 'react'
import { ChatHeader } from '@/features/chat/components/ChatHeader'
import { MessageList } from '@/features/chat/components/MessageList'
import { PromptPanel } from '@/features/chat/components/PromptPanel'
import { LoadingOverlay } from '@/features/chat/components/LoadingOverlay'
import { SettingsDialog } from '@/features/chat/components/SettingsDialog'
import { useChatSession } from '@/features/chat/hooks/useChatSession'
import { apiConfig, type ModelName } from '@/features/chat/utils/apiConfig'
import { AuthProvider, useAuth, LoginDialog } from '@/features/auth'
import { CredentialsEditor } from '@/features/admin'

function AppContent() {
  const { state, actions } = useChatSession()
  const { isAuthenticated } = useAuth()
  const [settingsOpen, setSettingsOpen] = useState(!apiConfig.isConfigured())
  const [model, setModel] = useState<ModelName>(apiConfig.getModel())
  const [loginOpen, setLoginOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)

  const handleModelChange = (value: ModelName) => {
    setModel(value)
    apiConfig.setModel(value)
  }

  const handleSettingsOpenChange = (open: boolean) => {
    setSettingsOpen(open)
    if (!open) {
      setModel(apiConfig.getModel())
    }
  }

  const handleAdminClick = () => {
    if (isAuthenticated) {
      setAdminOpen(true)
    } else {
      setLoginOpen(true)
    }
  }

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground">
      <ChatHeader
        loading={state.loading}
        onReset={actions.reset}
        onOpenSettings={() => handleSettingsOpenChange(true)}
        onOpenAdmin={handleAdminClick}
        isAuthenticated={isAuthenticated}
      />

      <main className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 relative pb-[calc(var(--prompt-panel-height,160px)+16px)]">
          <MessageList
            messages={state.messages}
            onDownload={actions.downloadImage}
            onDeleteMessage={actions.deleteMessage}
            onRetry={actions.retryRequest}
            hasSavedConversation={state.hasSavedConversation}
            savedConversationAt={state.savedConversationAt}
            onRestoreSavedConversation={actions.restoreSavedConversation}
            onClearSavedConversation={actions.clearSavedConversation}
          />

          {/* 加载覆盖层 */}
          <LoadingOverlay
            show={state.loading}
            imageSize={apiConfig.getType() === 'openai' ? '1K' : state.imageSize}
          />
        </div>
      </main>

      <PromptPanel
        prompt={state.prompt}
        onPromptChange={actions.setPrompt}
        onSend={actions.sendPrompt}
        loading={state.loading}
        uploads={state.uploadedImages}
        onAddFiles={actions.addUploads}
        onRemoveUpload={actions.removeUpload}
        onUpdateUpload={actions.updateUpload}
        aspectRatio={state.aspectRatio}
        imageSize={state.imageSize}
        model={model}
        forceImageGuidance={state.forceImageGuidance}
        onAspectChange={actions.setAspectRatio}
        onSizeChange={actions.setImageSize}
        onModelChange={handleModelChange}
        onToggleForceImageGuidance={actions.setForceImageGuidance}
        canEditLast={!!state.lastImageData}
        onEditLast={() => actions.sendPrompt('edit')}
      />

      <SettingsDialog open={settingsOpen} onOpenChange={handleSettingsOpenChange} />
      <LoginDialog
        open={loginOpen}
        onOpenChange={setLoginOpen}
        onSuccess={() => setAdminOpen(true)}
      />
      <CredentialsEditor open={adminOpen} onOpenChange={setAdminOpen} />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
