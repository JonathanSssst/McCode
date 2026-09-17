interface MccodeDesktopBridge {
  openFolder(): Promise<{ path: string } | null>
  openFolderPath(path: string): Promise<{ path: string } | null>
  getRecentFolders(): Promise<string[]>
  readDir(path: string): Promise<{ name: string; isDirectory: boolean }[]>
  readFile(path: string): Promise<Uint8Array>
  writeFile(path: string, data: string | Uint8Array): Promise<void>
  mkdir(path: string): Promise<void>
  remove(path: string, recursive: boolean): Promise<void>
  rename(oldPath: string, newPath: string): Promise<void>
  copy(sourcePath: string, targetPath: string): Promise<void>
  stat(path: string): Promise<{ isDirectory: boolean; isFile: boolean }>
  reveal(path: string): Promise<void>
  gitCheck(): Promise<{ available: boolean; version: string }>
  gitRun(args: string[]): Promise<{ code: number; stdout: string; stderr: string }>
  aiStatus?(): Promise<{ encryption: boolean; configured: boolean; baseUrl: string; model: string }>
  aiSetKey?(key: string): Promise<{ ok: boolean; configured?: boolean; error?: string }>
  aiClearKey?(): Promise<{ ok: boolean; configured?: boolean; error?: string }>
  aiComplete?(request: {
    id: string
    baseUrl?: string
    model?: string
    messages: { role: string; content: string }[]
    maxTokens?: number
    temperature?: number
  }): Promise<{ ok: boolean; content?: string; error?: string }>
  aiCancel?(id: string): Promise<boolean>
  setDirty(dirty: boolean): void
  windowMinimize(): void
  windowToggleMaximize(): void
  windowClose(): void
  windowReload(): void
  windowToggleDevTools(): void
  windowIsMaximized(): Promise<boolean>
  onWindowMaximized(callback: (maximized: boolean) => void): () => void
  onFilesChanged(callback: (paths: string[]) => void): () => void
}

interface Window {
  mccodeDesktop?: MccodeDesktopBridge
}
