export type TemplateKind =
  | 'function'
  | 'advancement'
  | 'loot_table'
  | 'predicate'
  | 'recipe'
  | 'tag_function'
  | 'tag_block'
  | 'tag_item'

interface TemplateDef {
  title: string
  defaultPath: (namespace: string) => string
  content: string
}

const json = (value: unknown): string => `${JSON.stringify(value, null, 2)}\n`

export const TEMPLATES: Record<TemplateKind, TemplateDef> = {
  function: {
    title: 'Function',
    defaultPath: (ns) => `data/${ns}/function/new_function.mcfunction`,
    content: '# TODO: describe this function\n',
  },
  advancement: {
    title: 'Advancement',
    defaultPath: (ns) => `data/${ns}/advancement/new_advancement.json`,
    content: json({ criteria: { impossible: { trigger: 'minecraft:impossible' } } }),
  },
  loot_table: {
    title: 'Loot Table',
    defaultPath: (ns) => `data/${ns}/loot_table/new_loot_table.json`,
    content: json({ type: 'minecraft:generic', pools: [] }),
  },
  predicate: {
    title: 'Predicate',
    defaultPath: (ns) => `data/${ns}/predicate/new_predicate.json`,
    content: json({ condition: 'minecraft:random_chance', chance: 0.5 }),
  },
  recipe: {
    title: 'Recipe',
    defaultPath: (ns) => `data/${ns}/recipe/new_recipe.json`,
    content: json({
      type: 'minecraft:crafting_shapeless',
      category: 'misc',
      ingredients: [{ item: 'minecraft:dirt' }],
      result: { id: 'minecraft:dirt', count: 1 },
    }),
  },
  tag_function: {
    title: 'Function Tag',
    defaultPath: (ns) => `data/${ns}/tags/function/new_tag.json`,
    content: json({ values: [] }),
  },
  tag_block: {
    title: 'Block Tag',
    defaultPath: (ns) => `data/${ns}/tags/block/new_tag.json`,
    content: json({ values: [] }),
  },
  tag_item: {
    title: 'Item Tag',
    defaultPath: (ns) => `data/${ns}/tags/item/new_tag.json`,
    content: json({ values: [] }),
  },
}

export const TEMPLATE_KINDS = Object.keys(TEMPLATES) as TemplateKind[]

export function detectNamespace(paths: string[]): string {
  for (const path of paths) {
    const match = /^data\/([^/]+)\//.exec(path)
    if (match) return match[1]
  }
  return 'mccode'
}
