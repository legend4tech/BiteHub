export interface TawkAPI {
  hideWidget?: () => void
  showWidget?: () => void
  toggle?: () => void
  maximize?: () => void
  minimize?: () => void
  isChatMaximized?: () => boolean
  isChatMinimized?: () => boolean
  onBeforeLoad?: () => void
  onLoad?: () => void
  onChatMaximized?: () => void
  onChatMinimized?: () => void
  onChatHidden?: () => void
  onChatStarted?: () => void
  onChatEnded?: () => void
  onUnreadCountChanged?: (count: number) => void
  onChatMessageAgent?: (message?: unknown) => void
  onChatMessageVisitor?: (message?: unknown) => void
  onChatMessageSystem?: (message?: unknown) => void
  customStyle?: Record<string, unknown>
}

declare global {
  interface Window {
    Tawk_API?: TawkAPI
    Tawk_LoadStart?: Date
  }
}
