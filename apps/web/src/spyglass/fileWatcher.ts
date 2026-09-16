import * as core from '@spyglassmc/core'

type FileWatcherEvents = {
  ready: void
  add: string
  change: string
  unlink: string
  error: Error
}

/**
 * A file watcher backed by `externals.fs`. Spyglass's `Project` only scans and binds the
 * project's own files when a `projectRootsWatcher` is provided; without it, only dependencies
 * are tracked (so function/objective symbols are missing and references report undeclaredSymbol).
 *
 * This watcher performs an initial recursive scan for `ready()` and can re-scan on demand
 * (`refresh`) when the host detects file changes.
 */
export class SimpleFileWatcher extends core.EventDispatcher<FileWatcherEvents> {
  private readonly externals: core.Externals
  private readonly roots: string[]
  private readonly logger: core.Logger | undefined
  private readonly store = new core.UriStore()

  constructor(externals: core.Externals, roots: string[], logger?: core.Logger) {
    super()
    this.externals = externals
    this.roots = roots.map((root) => core.fileUtil.ensureEndingSlash(root))
    this.logger = logger
  }

  get watchedFiles(): core.UriStore {
    return this.store
  }

  async ready(): Promise<void> {
    await this.refresh(false)
    this.emit('ready', undefined)
  }

  async close(): Promise<void> {
    this.store.clear()
  }

  /**
   * Re-list all project files, emitting `add`/`change`/`unlink` when `emitChanges` is true.
   */
  async refresh(emitChanges: boolean): Promise<void> {
    const seen = new Set<string>()
    for (const root of this.roots) {
      let files: string[]
      try {
        files = await core.fileUtil.getAllFiles(this.externals, root)
      } catch (error) {
        if (!this.externals.error.isKind(error, 'ENOENT')) {
          this.logger?.error('[SimpleFileWatcher] list failed', error)
          this.emit('error', error as Error)
        }
        continue
      }
      for (const file of files) {
        seen.add(file)
        if (!this.store.has(file)) {
          this.store.add(file)
          if (emitChanges) this.emit('add', file)
        } else if (emitChanges) {
          this.emit('change', file)
        }
      }
    }
    for (const existing of [...this.store]) {
      if (!seen.has(existing)) {
        this.store.delete(existing)
        if (emitChanges) this.emit('unlink', existing)
      }
    }
  }

  /**
   * Handle a set of changed project-relative paths, emitting only the relevant events so the
   * `Project` re-processes just those files.
   */
  async handleChanges(paths: string[]): Promise<void> {
    const root = this.roots[0] ?? ''
    for (const rel of paths) {
      const uri = core.normalizeUri(root + rel)
      let stat: { isFile(): boolean; isDirectory(): boolean }
      try {
        stat = await this.externals.fs.stat(uri)
      } catch (error) {
        if (!this.externals.error.isKind(error, 'ENOENT')) {
          this.emit('error', error as Error)
        } else if (this.store.has(uri)) {
          this.store.delete(uri)
          this.emit('unlink', uri)
        }
        continue
      }
      if (!stat.isFile()) continue
      if (this.store.has(uri)) {
        this.emit('change', uri)
      } else {
        this.store.add(uri)
        this.emit('add', uri)
      }
    }
  }
}
