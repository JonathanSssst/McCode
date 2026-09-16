export type PermMode = 'read' | 'readwrite'

export interface FsDirectoryHandle extends FileSystemDirectoryHandle {
  values(): AsyncIterableIterator<FileSystemFileHandle | FileSystemDirectoryHandle>
  queryPermission?(descriptor?: { mode?: PermMode }): Promise<PermissionState>
  requestPermission?(descriptor?: { mode?: PermMode }): Promise<PermissionState>
}

export type FsHandle = FileSystemFileHandle | FsDirectoryHandle

export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window
}

export async function pickDirectory(): Promise<FsDirectoryHandle> {
  const picker = (
    window as unknown as {
      showDirectoryPicker?: (options?: { mode?: PermMode }) => Promise<FsDirectoryHandle>
    }
  ).showDirectoryPicker
  if (!picker) {
    throw new Error(
      'File System Access API is unavailable. Please use a Chromium-based browser (Chrome/Edge).',
    )
  }
  const handle = await picker.call(window, { mode: 'readwrite' })
  return handle
}

export async function ensurePermission(
  handle: FsHandle,
  mode: PermMode = 'readwrite',
): Promise<boolean> {
  const dir = handle as FsDirectoryHandle
  if (dir.queryPermission) {
    if ((await dir.queryPermission({ mode })) === 'granted') return true
  }
  if (dir.requestPermission) {
    return (await dir.requestPermission({ mode })) === 'granted'
  }
  return true
}

export async function readFileText(handle: FileSystemFileHandle): Promise<string> {
  const file = await handle.getFile()
  return await file.text()
}

export async function readFileBytes(handle: FileSystemFileHandle): Promise<Uint8Array> {
  const file = await handle.getFile()
  return new Uint8Array(await file.arrayBuffer())
}

export async function createFileAtPath(
  root: FsDirectoryHandle,
  path: string,
  contents: string,
): Promise<FileSystemFileHandle> {
  const parts = path.split('/').filter(Boolean)
  const fileName = parts.pop()
  if (!fileName) throw new Error('Invalid file path')
  let dir: FsDirectoryHandle = root
  for (const part of parts) {
    dir = (await dir.getDirectoryHandle(part, { create: true })) as FsDirectoryHandle
  }
  const fileHandle = await dir.getFileHandle(fileName, { create: true })
  const writable = await (
    fileHandle as unknown as {
      createWritable(options?: { keepExistingData?: boolean }): Promise<{
        write(data: string): Promise<void>
        close(): Promise<void>
      }>
    }
  ).createWritable()
  await writable.write(contents)
  await writable.close()
  return fileHandle
}

export async function writeFileText(handle: FileSystemFileHandle, contents: string): Promise<void> {
  const writable = await (
    handle as unknown as {
      createWritable(options?: { keepExistingData?: boolean }): Promise<{
        write(data: string): Promise<void>
        close(): Promise<void>
      }>
    }
  ).createWritable()
  await writable.write(contents)
  await writable.close()
}

export async function getDirectoryByPath(
  root: FsDirectoryHandle,
  path: string,
): Promise<FsDirectoryHandle> {
  let dir = root
  for (const part of path.split('/').filter(Boolean)) {
    dir = (await dir.getDirectoryHandle(part)) as FsDirectoryHandle
  }
  return dir
}

export async function createDirectoryAtPath(
  root: FsDirectoryHandle,
  path: string,
): Promise<FsDirectoryHandle> {
  let dir: FsDirectoryHandle = root
  for (const part of path.split('/').filter(Boolean)) {
    dir = (await dir.getDirectoryHandle(part, { create: true })) as FsDirectoryHandle
  }
  return dir
}

export async function removeEntryAtPath(
  root: FsDirectoryHandle,
  path: string,
  recursive: boolean,
): Promise<void> {
  const parts = path.split('/').filter(Boolean)
  const name = parts.pop()
  if (!name) throw new Error('Invalid path')
  const dir = parts.length ? await getDirectoryByPath(root, parts.join('/')) : root
  await dir.removeEntry(name, { recursive })
}

export async function createFileBytesAtPath(
  root: FsDirectoryHandle,
  path: string,
  data: Uint8Array,
): Promise<void> {
  const parts = path.split('/').filter(Boolean)
  const fileName = parts.pop()
  if (!fileName) throw new Error('Invalid file path')
  let dir: FsDirectoryHandle = root
  for (const part of parts) {
    dir = (await dir.getDirectoryHandle(part, { create: true })) as FsDirectoryHandle
  }
  const handle = await dir.getFileHandle(fileName, { create: true })
  const writable = await (
    handle as unknown as {
      createWritable(options?: { keepExistingData?: boolean }): Promise<{
        write(data: Uint8Array): Promise<void>
        close(): Promise<void>
      }>
    }
  ).createWritable()
  await writable.write(data)
  await writable.close()
}

export async function copyDirectory(
  source: FsDirectoryHandle,
  targetDir: FsDirectoryHandle,
  name: string,
): Promise<void> {
  const newDir = (await targetDir.getDirectoryHandle(name, { create: true })) as FsDirectoryHandle
  for await (const handle of source.values()) {
    if (handle.kind === 'directory') {
      await copyDirectory(handle as FsDirectoryHandle, newDir, handle.name)
    } else {
      const data = new Uint8Array(await (await handle.getFile()).arrayBuffer())
      const fileHandle = await newDir.getFileHandle(handle.name, { create: true })
      const writable = await (
        fileHandle as unknown as {
          createWritable(): Promise<{
            write(data: Uint8Array): Promise<void>
            close(): Promise<void>
          }>
        }
      ).createWritable()
      await writable.write(data)
      await writable.close()
    }
  }
}
