import type { Doc } from './selectorArgs.zh'

const wiki = (name: string): string => `https://minecraft.wiki/w/Commands/${name}`

// 键是完整的命令路径（空格分隔），按光标所在行的命令链解析后查表。
export const SUBCOMMAND_DOCS: Record<string, Doc> = {
  // scoreboard
  'scoreboard objectives': {
    summary: '管理计分板目标（objective）。',
    syntax: 'scoreboard objectives <...>',
    wiki: wiki('scoreboard'),
  },
  'scoreboard objectives add': {
    summary: '新建一个计分板目标。',
    syntax: 'scoreboard objectives add <目标> <准则> [显示名]',
    wiki: wiki('scoreboard'),
  },
  'scoreboard objectives remove': {
    summary: '删除一个计分板目标及其所有分数。',
    syntax: 'scoreboard objectives remove <目标>',
    wiki: wiki('scoreboard'),
  },
  'scoreboard objectives list': {
    summary: '列出所有计分板目标。',
    syntax: 'scoreboard objectives list',
    wiki: wiki('scoreboard'),
  },
  'scoreboard objectives setdisplay': {
    summary: '设置计分板在屏幕上的显示位置。',
    syntax: 'scoreboard objectives setdisplay <位置> [目标]',
    wiki: wiki('scoreboard'),
  },
  'scoreboard objectives modify': {
    summary: '修改目标的显示名称或渲染类型。',
    syntax: 'scoreboard objectives modify <目标> displayname|rendertype ...',
    wiki: wiki('scoreboard'),
  },
  'scoreboard players': {
    summary: '读写实体的分数。',
    syntax: 'scoreboard players <...>',
    wiki: wiki('scoreboard'),
  },
  'scoreboard players set': {
    summary: '将某实体的分数设为指定值。',
    syntax: 'scoreboard players set <目标> <目标> <分数>',
    wiki: wiki('scoreboard'),
  },
  'scoreboard players add': {
    summary: '增加某实体的分数。',
    syntax: 'scoreboard players add <目标> <目标> <分数>',
    wiki: wiki('scoreboard'),
  },
  'scoreboard players remove': {
    summary: '减少某实体的分数。',
    syntax: 'scoreboard players remove <目标> <目标> <分数>',
    wiki: wiki('scoreboard'),
  },
  'scoreboard players get': {
    summary: '读取并显示某实体的分数。',
    syntax: 'scoreboard players get <目标> <目标>',
    wiki: wiki('scoreboard'),
  },
  'scoreboard players reset': {
    summary: '重置（清除）某实体的分数。',
    syntax: 'scoreboard players reset <目标> [目标]',
    wiki: wiki('scoreboard'),
  },
  'scoreboard players operation': {
    summary: '对两个分数做运算并写回。',
    syntax: 'scoreboard players operation <目标> <目标> <运算> <来源> <来源目标>',
    wiki: wiki('scoreboard'),
  },
  'scoreboard players enable': {
    summary: '允许某实体使用 /trigger 触发该目标。',
    syntax: 'scoreboard players enable <目标> <目标>',
    wiki: wiki('scoreboard'),
  },
  'scoreboard players display': {
    summary: '设置单个分数的显示方式。',
    syntax: 'scoreboard players display name|numberformat ...',
    wiki: wiki('scoreboard'),
  },

  // data
  'data get': {
    summary: '读取方块/实体/存储的 NBT 数据。',
    syntax: 'data get <目标> [<路径>] [<缩放>]',
    wiki: wiki('data'),
  },
  'data merge': {
    summary: '将一个 NBT 合并进目标。',
    syntax: 'data merge <目标> <NBT>',
    wiki: wiki('data'),
  },
  'data modify': {
    summary: '修改目标中的某个 NBT 值。',
    syntax: 'data modify <目标> <路径> set|merge|append|prepend|insert ...',
    wiki: wiki('data'),
  },
  'data remove': {
    summary: '删除目标中的某个 NBT 值。',
    syntax: 'data remove <目标> <路径>',
    wiki: wiki('data'),
  },

  // tag
  'tag add': { summary: '给实体添加标签。', syntax: 'tag <目标> add <标签>', wiki: wiki('tag') },
  'tag remove': {
    summary: '移除实体的标签。',
    syntax: 'tag <目标> remove <标签>',
    wiki: wiki('tag'),
  },
  'tag list': { summary: '列出实体拥有的标签。', syntax: 'tag <目标> list', wiki: wiki('tag') },

  // team
  'team add': { summary: '创建队伍。', syntax: 'team add <队伍> [显示名]', wiki: wiki('team') },
  'team remove': { summary: '删除队伍。', syntax: 'team remove <队伍>', wiki: wiki('team') },
  'team join': {
    summary: '让实体加入队伍。',
    syntax: 'team join <队伍> [目标]',
    wiki: wiki('team'),
  },
  'team leave': { summary: '让实体离开其队伍。', syntax: 'team leave <目标>', wiki: wiki('team') },
  'team modify': {
    summary: '修改队伍设置（颜色、友好伤害等）。',
    syntax: 'team modify <队伍> <选项> ...',
    wiki: wiki('team'),
  },
  'team list': { summary: '列出队伍及其成员。', syntax: 'team list [队伍]', wiki: wiki('team') },

  // effect / enchant / advancement / recipe
  'effect give': {
    summary: '给予状态效果。',
    syntax: 'effect give <目标> <效果> [时长] [等级] [隐藏粒子]',
    wiki: wiki('effect'),
  },
  'effect clear': {
    summary: '清除状态效果。',
    syntax: 'effect clear <目标> [效果]',
    wiki: wiki('effect'),
  },
  'advancement grant': {
    summary: '授予进度。',
    syntax: 'advancement grant <目标> <范围> <进度>',
    wiki: wiki('advancement'),
  },
  'advancement revoke': {
    summary: '撤销进度。',
    syntax: 'advancement revoke <目标> <范围> <进度>',
    wiki: wiki('advancement'),
  },
  'recipe give': {
    summary: '解锁配方。',
    syntax: 'recipe give <目标> <配方>',
    wiki: wiki('recipe'),
  },
  'recipe take': {
    summary: '锁定配方。',
    syntax: 'recipe take <目标> <配方>',
    wiki: wiki('recipe'),
  },

  // datapack / forceload / item / loot
  'datapack enable': {
    summary: '启用数据包。',
    syntax: 'datapack enable <名称> [first|last|before|after]',
    wiki: wiki('datapack'),
  },
  'datapack disable': {
    summary: '禁用数据包。',
    syntax: 'datapack disable <名称>',
    wiki: wiki('datapack'),
  },
  'datapack list': {
    summary: '列出已启用/可用的数据包。',
    syntax: 'datapack list [available|enabled]',
    wiki: wiki('datapack'),
  },
  'forceload add': {
    summary: '强制加载区块。',
    syntax: 'forceload add <起点> [<终点>]',
    wiki: wiki('forceload'),
  },
  'forceload remove': {
    summary: '取消强制加载区块。',
    syntax: 'forceload remove <起点> [<终点>]',
    wiki: wiki('forceload'),
  },
  'forceload query': {
    summary: '查询区块是否被强制加载。',
    syntax: 'forceload query [<坐标>]',
    wiki: wiki('forceload'),
  },
  'item replace': {
    summary: '替换容器或实体某个槽位的物品。',
    syntax: 'item replace <容器/实体> <槽位> with <物品>',
    wiki: wiki('item'),
  },
  'item modify': {
    summary: '对物品应用物品修饰器。',
    syntax: 'item modify <容器/实体> <槽位> <修饰器>',
    wiki: wiki('item'),
  },
  'loot give': {
    summary: '把战利品表结果给予玩家。',
    syntax: 'loot give <玩家> <来源>',
    wiki: wiki('loot'),
  },
  'loot insert': {
    summary: '把战利品表结果插入容器。',
    syntax: 'loot insert <坐标> <来源>',
    wiki: wiki('loot'),
  },
  'loot spawn': {
    summary: '在指定位置生成战利品。',
    syntax: 'loot spawn <坐标> <来源>',
    wiki: wiki('loot'),
  },
  'loot replace': {
    summary: '用战利品表结果替换容器槽位。',
    syntax: 'loot replace <容器> <槽位> <来源>',
    wiki: wiki('loot'),
  },

  // place / random / schedule / time / title
  'place feature': {
    summary: '放置一个地物。',
    syntax: 'place feature <地物> [坐标]',
    wiki: wiki('place'),
  },
  'place jigsaw': {
    summary: '放置一个拼图结构。',
    syntax: 'place jigsaw <模板池> <目标> <深度> [坐标]',
    wiki: wiki('place'),
  },
  'place structure': {
    summary: '放置一个结构。',
    syntax: 'place structure <结构> [坐标]',
    wiki: wiki('place'),
  },
  'place template': {
    summary: '放置一个结构模板。',
    syntax: 'place template <模板> [坐标] [旋转] [镜像]',
    wiki: wiki('place'),
  },
  'random value': {
    summary: '生成一个随机数。',
    syntax: 'random value <范围> [序列]',
    wiki: wiki('random'),
  },
  'random roll': {
    summary: '掷骰并返回结果。',
    syntax: 'random roll <范围> [序列]',
    wiki: wiki('random'),
  },
  'random reset': {
    summary: '重置随机序列。',
    syntax: 'random reset [序列] [种子]',
    wiki: wiki('random'),
  },
  'schedule function': {
    summary: '定时运行函数。',
    syntax: 'schedule function <函数> <时间> [append|replace]',
    wiki: wiki('schedule'),
  },
  'schedule clear': {
    summary: '取消已计划的函数。',
    syntax: 'schedule clear <函数>',
    wiki: wiki('schedule'),
  },
  'time set': {
    summary: '设置世界时间。',
    syntax: 'time set <day|noon|night|midnight|<时间>>',
    wiki: wiki('time'),
  },
  'time add': { summary: '增加世界时间。', syntax: 'time add <时间>', wiki: wiki('time') },
  'time query': {
    summary: '查询世界时间。',
    syntax: 'time query <daytime|gametime|day>',
    wiki: wiki('time'),
  },
  'title title': {
    summary: '显示主标题。',
    syntax: 'title <目标> title <JSON文本组件>',
    wiki: wiki('title'),
  },
  'title subtitle': {
    summary: '显示副标题。',
    syntax: 'title <目标> subtitle <JSON文本组件>',
    wiki: wiki('title'),
  },
  'title actionbar': {
    summary: '在动作栏显示文本。',
    syntax: 'title <目标> actionbar <JSON文本组件>',
    wiki: wiki('title'),
  },
  'title times': {
    summary: '设置标题的淡入/停留/淡出时间。',
    syntax: 'title <目标> times <淡入> <停留> <淡出>',
    wiki: wiki('title'),
  },
  'title reset': { summary: '重置标题显示。', syntax: 'title <目标> reset', wiki: wiki('title') },

  // worldborder / whitelist / tick
  'worldborder add': {
    summary: '扩大或缩小世界边界。',
    syntax: 'worldborder add <距离> [时间]',
    wiki: wiki('worldborder'),
  },
  'worldborder set': {
    summary: '设置世界边界直径。',
    syntax: 'worldborder set <直径> [时间]',
    wiki: wiki('worldborder'),
  },
  'worldborder center': {
    summary: '设置世界边界中心。',
    syntax: 'worldborder center <坐标>',
    wiki: wiki('worldborder'),
  },
  'worldborder damage': {
    summary: '设置边界外伤害的缓冲与数值。',
    syntax: 'worldborder damage amount|buffer ...',
    wiki: wiki('worldborder'),
  },
  'worldborder get': {
    summary: '查询世界边界直径。',
    syntax: 'worldborder get',
    wiki: wiki('worldborder'),
  },
  'worldborder warning': {
    summary: '设置边界警告距离/时间。',
    syntax: 'worldborder warning distance|time ...',
    wiki: wiki('worldborder'),
  },
  'whitelist add': {
    summary: '把玩家加入白名单。',
    syntax: 'whitelist add <玩家>',
    wiki: wiki('whitelist'),
  },
  'whitelist remove': {
    summary: '把玩家移出白名单。',
    syntax: 'whitelist remove <玩家>',
    wiki: wiki('whitelist'),
  },
  'whitelist list': {
    summary: '列出白名单玩家。',
    syntax: 'whitelist list',
    wiki: wiki('whitelist'),
  },
  'whitelist on': { summary: '开启白名单。', syntax: 'whitelist on', wiki: wiki('whitelist') },
  'whitelist off': { summary: '关闭白名单。', syntax: 'whitelist off', wiki: wiki('whitelist') },
  'whitelist reload': {
    summary: '重新加载白名单。',
    syntax: 'whitelist reload',
    wiki: wiki('whitelist'),
  },
  'tick query': { summary: '查询当前游戏刻速率。', syntax: 'tick query', wiki: wiki('tick') },
  'tick rate': {
    summary: '设置游戏刻速率（每秒刻数）。',
    syntax: 'tick rate <速率>',
    wiki: wiki('tick'),
  },
  'tick freeze': { summary: '冻结游戏刻。', syntax: 'tick freeze', wiki: wiki('tick') },
  'tick unfreeze': { summary: '解除游戏刻冻结。', syntax: 'tick unfreeze', wiki: wiki('tick') },
  'tick step': {
    summary: '在冻结状态下步进指定刻数。',
    syntax: 'tick step <刻数> [时间]',
    wiki: wiki('tick'),
  },
  'tick sprint': {
    summary: '在指定时间内尽可能快地推进游戏刻。',
    syntax: 'tick sprint <时间>',
    wiki: wiki('tick'),
  },
}
