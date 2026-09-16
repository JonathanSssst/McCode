export interface DatapackOptions {
  namespace: string
  packFormat: number
  description: string
}

const json = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`

export function datapackFiles({
  namespace,
  packFormat,
  description,
}: DatapackOptions): Record<string, string> {
  return {
    'pack.mcmeta': json({ pack: { pack_format: packFormat, description } }),
    [`data/${namespace}/function/load.mcfunction`]: `# ${namespace}:load\nsay ${namespace} loaded\n`,
    [`data/${namespace}/function/tick.mcfunction`]: `# ${namespace}:tick\n`,
    [`data/${namespace}/function/init.mcfunction`]: `# ${namespace}:init\n`,
    'data/minecraft/tags/function/load.json': json({ values: [`${namespace}:load`] }),
    'data/minecraft/tags/function/tick.json': json({ values: [`${namespace}:tick`] }),
  }
}

export function datapackDirs(namespace: string): string[] {
  return [
    `data/${namespace}/advancement`,
    `data/${namespace}/loot_table`,
    `data/${namespace}/predicate`,
    `data/${namespace}/recipe`,
    `data/${namespace}/structure`,
    `data/${namespace}/tags/function`,
    `data/${namespace}/tags/block`,
    `data/${namespace}/tags/item`,
  ]
}
