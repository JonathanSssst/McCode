export interface Doc {
  summary: string
  syntax?: string
  wiki?: string
}

export const SELECTOR_ARG_DOCS: Record<string, Doc> = {
  x: { summary: '选择区域的起始 X 坐标（距离检测原点）。', syntax: 'x=<坐标>' },
  y: { summary: '选择区域的起始 Y 坐标。', syntax: 'y=<坐标>' },
  z: { summary: '选择区域的起始 Z 坐标。', syntax: 'z=<坐标>' },
  dx: { summary: '选择区域在 X 轴上的体积（默认 0）。', syntax: 'dx=<整数>' },
  dy: { summary: '选择区域在 Y 轴上的体积（默认 0）。', syntax: 'dy=<整数>' },
  dz: { summary: '选择区域在 Z 轴上的体积（默认 0）。', syntax: 'dz=<整数>' },
  distance: {
    summary: '与执行点的距离，支持范围写法（如 ..5、5..、3..7）。',
    syntax: 'distance=<范围>',
  },
  scores: { summary: '按计分板分数筛选，可指定多个目标。', syntax: 'scores={<目标>=<范围>,...}' },
  tag: { summary: '按实体标签筛选，可加 ! 取反。', syntax: 'tag=<标签> | tag=!<标签>' },
  team: { summary: '按队伍筛选，! 表示不在任何队伍。', syntax: 'team=<队伍> | team=!<队伍>' },
  name: {
    summary: '按实体名称筛选（不含自定义名称的实体）。',
    syntax: 'name=<名称> | name=!<名称>',
  },
  type: { summary: '按实体类型筛选，可在类型前加 ! 取反。', syntax: 'type=<实体类型>' },
  level: { summary: '按玩家经验等级筛选。', syntax: 'level=<范围>' },
  gamemode: {
    summary: '按游戏模式筛选：survival/creative/adventure/spectator。',
    syntax: 'gamemode=<模式>',
  },
  limit: { summary: '限制选中的实体数量，配合 sort 使用。', syntax: 'limit=<整数>' },
  sort: {
    summary: '排序方式：nearest（最近）、furthest（最远）、random（随机）、arbitrary（任意）。',
    syntax: 'sort=<nearest|furthest|random|arbitrary>',
  },
  advancements: { summary: '按进度完成情况筛选。', syntax: 'advancements={<进度>=<条件>}' },
  nbt: { summary: '按实体 NBT 数据筛选，例如 {Health:20.0f}。', syntax: 'nbt=<NBT>' },
  predicate: { summary: '按谓词筛选，需提供谓词资源。', syntax: 'predicate=<命名空间:路径>' },
  x_rotation: { summary: '按实体的俯仰角（上下视角）范围筛选。', syntax: 'x_rotation=<范围>' },
  y_rotation: { summary: '按实体的偏航角（左右朝向）范围筛选。', syntax: 'y_rotation=<范围>' },
}
