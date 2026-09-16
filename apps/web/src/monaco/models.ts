import { monaco } from './api'

const models = new Map<string, monaco.editor.ITextModel>()

function uriForPath(path: string): monaco.Uri {
  return monaco.Uri.parse('mccode://workspace/' + path.replace(/^\/+/, ''))
}

export function getModel(path: string): monaco.editor.ITextModel | undefined {
  return models.get(path)
}

export function getOrCreateModel(
  path: string,
  language: string,
  content: string,
): monaco.editor.ITextModel {
  const existing = models.get(path)
  if (existing) {
    if (existing.getLanguageId() !== language) {
      monaco.editor.setModelLanguage(existing, language)
    }
    return existing
  }
  const model = monaco.editor.createModel(content, language, uriForPath(path))
  models.set(path, model)
  return model
}

export function disposeModel(path: string): void {
  const model = models.get(path)
  if (model) {
    model.dispose()
    models.delete(path)
  }
}

export function disposeAllModels(): void {
  for (const model of models.values()) model.dispose()
  models.clear()
}
