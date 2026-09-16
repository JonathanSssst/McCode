import type { Doc } from './selectorArgs.zh'

const wiki = (name: string): string => `https://minecraft.wiki/w/Commands/${name}`

export const COMMAND_DOCS: Record<string, Doc> = {
  advancement: {
    summary: '授予或剥夺玩家的进度。',
    syntax: 'advancement grant|revoke <目标> <仅此|从此|全部|until|through> <进度>',
    wiki: wiki('advancement'),
  },
  attribute: {
    summary: '读取或修改实体的属性（如最大生命值、移动速度）。',
    syntax: 'attribute <目标> <属性> get|base|modifier ...',
    wiki: wiki('attribute'),
  },
  bossbar: {
    summary: '创建和管理 BOSS 栏。',
    syntax: 'bossbar add|get|list|remove|set <...>',
    wiki: wiki('bossbar'),
  },
  clear: {
    summary: '清除玩家物品栏中的物品。',
    syntax: 'clear [目标] [物品] [最大数量]',
    wiki: wiki('clear'),
  },
  clone: {
    summary: '从一个区域克隆方块到另一个区域。',
    syntax: 'clone <起点> <终点> <目标> [masked|replace] [force|move|normal]',
    wiki: wiki('clone'),
  },
  damage: {
    summary: '对实体造成指定类型的伤害。',
    syntax: 'damage <目标> <数量> [<伤害类型>] [at <位置>|by <实体>|from <实体>]',
    wiki: wiki('damage'),
  },
  data: {
    summary: '读取、修改、合并或移除方块/实体/存储中的 NBT 数据。',
    syntax: 'data get|merge|modify|remove <目标> <路径> ...',
    wiki: wiki('data'),
  },
  datapack: {
    summary: '启用、禁用或列出数据包。',
    syntax: 'datapack enable|disable|list <名称> [first|last|before|after]',
    wiki: wiki('datapack'),
  },
  dialog: {
    summary: '向玩家显示对话框（1.21.6+）。',
    syntax: 'dialog show <目标> <对话框> | dialog ...',
    wiki: wiki('dialog'),
  },
  difficulty: {
    summary: '设置游戏难度。',
    syntax: 'difficulty [peaceful|easy|normal|hard]',
    wiki: wiki('difficulty'),
  },
  effect: {
    summary: '给予或移除状态效果。',
    syntax: 'effect give|clear <目标> [<效果>] [时长] [等级] [隐藏粒子]',
    wiki: wiki('effect'),
  },
  enchant: {
    summary: '为主手物品附魔。',
    syntax: 'enchant <目标> <附魔> [等级]',
    wiki: wiki('enchant'),
  },
  execute: {
    summary: '以指定的执行者、位置、朝向或条件执行一条命令（子命令可链式组合）。',
    syntax: 'execute <子命令链> run <命令>',
    wiki: wiki('execute'),
  },
  experience: {
    summary: '查询或修改玩家的经验值。',
    syntax: 'experience add|set|query <目标> <数量> [points|levels]',
    wiki: wiki('experience'),
  },
  fill: {
    summary: '用指定方块填充一个区域。',
    syntax: 'fill <起点> <终点> <方块> [destroy|hollow|keep|outline|replace]',
    wiki: wiki('fill'),
  },
  fillbiome: {
    summary: '用指定生物群系填充一个区域。',
    syntax: 'fillbiome <起点> <终点> <生物群系> [replace]',
    wiki: wiki('fillbiome'),
  },
  forceload: {
    summary: '强制加载或卸载区块。',
    syntax: 'forceload add|remove|query <起点> [<终点>]',
    wiki: wiki('forceload'),
  },
  function: {
    summary: '运行一个数据包函数。',
    syntax: 'function <命名空间:路径> [<参数>]',
    wiki: wiki('function'),
  },
  gamemode: {
    summary: '设置玩家的游戏模式。',
    syntax: 'gamemode <模式> [目标]',
    wiki: wiki('gamemode'),
  },
  gamerule: {
    summary: '查询或设置游戏规则。',
    syntax: 'gamerule <规则> [值]',
    wiki: wiki('gamerule'),
  },
  give: {
    summary: '给予玩家指定物品。',
    syntax: 'give <目标> <物品>[组件] [数量]',
    wiki: wiki('give'),
  },
  item: {
    summary: '修改实体或方块的物品栏（替换、修改、复制）。',
    syntax: 'item replace|modify <容器> <槽位> ...',
    wiki: wiki('item'),
  },
  kick: {
    summary: '将玩家踢出服务器。',
    syntax: 'kick <目标> [原因]',
    wiki: wiki('kick'),
  },
  kill: {
    summary: '杀死指定实体。',
    syntax: 'kill [目标]',
    wiki: wiki('kill'),
  },
  locate: {
    summary: '定位最近的结构、生物群系或兴趣点。',
    syntax: 'locate structure|biome|poi <类型>',
    wiki: wiki('locate'),
  },
  loot: {
    summary: '将战利品表的结果给予、插入、生成或替换到目标。',
    syntax: 'loot give|insert|spawn|replace <目标> <来源>',
    wiki: wiki('loot'),
  },
  particle: {
    summary: '在指定位置生成粒子效果。',
    syntax: 'particle <粒子> [坐标] [偏移] [速度] [数量] [force|normal]',
    wiki: wiki('particle'),
  },
  place: {
    summary: '放置结构、地物、拼图或模板。',
    syntax: 'place feature|jigsaw|structure|template <...>',
    wiki: wiki('place'),
  },
  playsound: {
    summary: '向玩家播放音效。',
    syntax: 'playsound <声音> <来源> <目标> [坐标] [音量] [音调] [最小音量]',
    wiki: wiki('playsound'),
  },
  random: {
    summary: '生成随机数、掷骰子或重置随机序列。',
    syntax: 'random value|roll|reset <范围> [序列]',
    wiki: wiki('random'),
  },
  recipe: {
    summary: '解锁或锁定玩家的配方。',
    syntax: 'recipe give|take <目标> <配方>',
    wiki: wiki('recipe'),
  },
  reload: {
    summary: '重新加载数据包与函数。',
    syntax: 'reload',
    wiki: wiki('reload'),
  },
  return: {
    summary: '从函数返回值或提前结束函数。',
    syntax: 'return <值> | return fail | return run <命令>',
    wiki: wiki('return'),
  },
  ride: {
    summary: '让实体骑乘或被骑乘。',
    syntax: 'ride <目标> mount <载具> | ride <目标> dismount',
    wiki: wiki('ride'),
  },
  rotate: {
    summary: '旋转实体。',
    syntax: 'rotate <目标> <偏航> <俯仰> | rotate <目标> facing <坐标>',
    wiki: wiki('rotate'),
  },
  say: {
    summary: '向所有玩家广播一条消息。',
    syntax: 'say <消息>',
    wiki: wiki('say'),
  },
  schedule: {
    summary: '安排函数在指定时间后运行。',
    syntax: 'schedule function <函数> <时间> [append|replace]',
    wiki: wiki('schedule'),
  },
  scoreboard: {
    summary: '管理计分板目标、玩家分数与显示位置。',
    syntax: 'scoreboard objectives|players <...>',
    wiki: wiki('scoreboard'),
  },
  setblock: {
    summary: '在指定位置放置一个方块。',
    syntax: 'setblock <坐标> <方块> [destroy|keep|replace]',
    wiki: wiki('setblock'),
  },
  setworldspawn: {
    summary: '设置世界出生点。',
    syntax: 'setworldspawn [坐标] [角度]',
    wiki: wiki('setworldspawn'),
  },
  spawnpoint: {
    summary: '设置玩家的重生点。',
    syntax: 'spawnpoint [玩家] [坐标] [角度]',
    wiki: wiki('spawnpoint'),
  },
  spectate: {
    summary: '以旁观视角看向某个实体。',
    syntax: 'spectate [目标] [玩家]',
    wiki: wiki('spectate'),
  },
  spreadplayers: {
    summary: '将玩家分散到指定区域的地面上。',
    syntax: 'spreadplayers <中心> <分散距离> <最大半径> <同队> <目标>',
    wiki: wiki('spreadplayers'),
  },
  stopwatch: {
    summary: '创建和控制计时器（1.21.11+）。',
    syntax: 'stopwatch <...>',
    wiki: wiki('stopwatch'),
  },
  summon: {
    summary: '在指定位置生成一个实体。',
    syntax: 'summon <实体> [坐标] [NBT]',
    wiki: wiki('summon'),
  },
  tag: {
    summary: '为实体添加或移除标签。',
    syntax: 'tag <目标> add|remove <标签>',
    wiki: wiki('tag'),
  },
  team: {
    summary: '创建和管理队伍。',
    syntax: 'team add|join|leave|remove|modify|list <...>',
    wiki: wiki('team'),
  },
  teleport: {
    summary: '传送实体到指定位置或另一个实体。',
    syntax: 'teleport <目标> <目的地> [<朝向>]',
    wiki: wiki('teleport'),
  },
  tellraw: {
    summary: '向玩家发送 JSON 文本组件消息。',
    syntax: 'tellraw <目标> <JSON文本组件>',
    wiki: wiki('tellraw'),
  },
  time: {
    summary: '查询或设置世界时间。',
    syntax: 'time set|add|query <值>',
    wiki: wiki('time'),
  },
  title: {
    summary: '显示标题、副标题或动作栏文本。',
    syntax: 'title <目标> title|subtitle|actionbar|times ...',
    wiki: wiki('title'),
  },
  tp: {
    summary: '传送实体（teleport 的别名）。',
    syntax: 'tp <目标> <目的地> [<朝向>]',
    wiki: wiki('teleport'),
  },
  transfer: {
    summary: '将玩家转移到另一台服务器。',
    syntax: 'transfer <主机> [端口] [玩家]',
    wiki: wiki('transfer'),
  },
  weather: {
    summary: '设置天气。',
    syntax: 'weather clear|rain|thunder [时长]',
    wiki: wiki('weather'),
  },
  worldborder: {
    summary: '管理世界边界。',
    syntax: 'worldborder add|set|center|damage|get|warning ...',
    wiki: wiki('worldborder'),
  },
  xp: {
    summary: '查询或修改玩家经验（experience 的别名）。',
    syntax: 'xp add|set|query <目标> <数量> [points|levels]',
    wiki: wiki('experience'),
  },
  ban: {
    summary: '封禁玩家（默认永久）。',
    syntax: 'ban <玩家> [原因]',
    wiki: wiki('ban'),
  },
  'ban-ip': {
    summary: '封禁某个 IP 地址。',
    syntax: 'ban-ip <IP|玩家> [原因]',
    wiki: wiki('ban'),
  },
  banlist: {
    summary: '查看封禁名单。',
    syntax: 'banlist [ips|players]',
    wiki: wiki('banlist'),
  },
  debug: {
    summary: '开始或停止调试性能分析。',
    syntax: 'debug start|stop|function <函数>',
    wiki: wiki('debug'),
  },
  defaultgamemode: {
    summary: '设置新玩家加入时的默认游戏模式。',
    syntax: 'defaultgamemode <模式>',
    wiki: wiki('defaultgamemode'),
  },
  deop: {
    summary: '撤销玩家的管理员权限。',
    syntax: 'deop <目标>',
    wiki: wiki('op'),
  },
  fetchprofile: {
    summary: '获取在线玩家或指定玩家的档案信息。',
    syntax: 'fetchprofile name <名称> | fetchprofile id <UUID>',
    wiki: wiki('fetchprofile'),
  },
  help: {
    summary: '列出可用命令或查看某命令的帮助。',
    syntax: 'help [命令]',
    wiki: wiki('help'),
  },
  jfr: {
    summary: '启动或停止 Java Flight Recorder 性能分析。',
    syntax: 'jfr start|stop',
    wiki: wiki('jfr'),
  },
  list: {
    summary: '列出在线玩家。',
    syntax: 'list [uuids]',
    wiki: wiki('list'),
  },
  me: {
    summary: '以表情动作的形式广播一条消息。',
    syntax: 'me <动作>',
    wiki: wiki('me'),
  },
  msg: {
    summary: '向某个玩家发送私聊消息（tell/w 的别名）。',
    syntax: 'msg <目标> <消息>',
    wiki: wiki('msg'),
  },
  op: {
    summary: '授予玩家管理员权限。',
    syntax: 'op <目标>',
    wiki: wiki('op'),
  },
  pardon: {
    summary: '解除对玩家的封禁。',
    syntax: 'pardon <玩家>',
    wiki: wiki('pardon'),
  },
  'pardon-ip': {
    summary: '解除对某个 IP 的封禁。',
    syntax: 'pardon-ip <IP>',
    wiki: wiki('pardon'),
  },
  perf: {
    summary: '开始或停止性能分析。',
    syntax: 'perf start|stop',
    wiki: wiki('perf'),
  },
  publish: {
    summary: '将单人世界开放到局域网。',
    syntax: 'publish [端口] [gamemode <模式>] [allow-cheats <true|false>]',
    wiki: wiki('publish'),
  },
  'save-all': {
    summary: '立即保存所有世界数据。',
    syntax: 'save-all [flush]',
    wiki: wiki('save-all'),
  },
  'save-off': {
    summary: '关闭服务器的自动保存。',
    syntax: 'save-off',
    wiki: wiki('save-all'),
  },
  'save-on': {
    summary: '开启服务器的自动保存。',
    syntax: 'save-on',
    wiki: wiki('save-all'),
  },
  seed: {
    summary: '显示当前世界种子。',
    syntax: 'seed [get]',
    wiki: wiki('seed'),
  },
  setidletimeout: {
    summary: '设置挂机多久后踢出玩家（分钟）。',
    syntax: 'setidletimeout <分钟>',
    wiki: wiki('setidletimeout'),
  },
  stop: {
    summary: '关闭服务器。',
    syntax: 'stop',
    wiki: wiki('stop'),
  },
  stopsound: {
    summary: '停止播放指定的声音。',
    syntax: 'stopsound <目标> [来源] [声音]',
    wiki: wiki('stopsound'),
  },
  teammsg: {
    summary: '向自己所在的队伍发送消息（tm 的别名）。',
    syntax: 'teammsg <消息>',
    wiki: wiki('teammsg'),
  },
  tell: {
    summary: '向某个玩家发送私聊消息（msg 的别名）。',
    syntax: 'tell <目标> <消息>',
    wiki: wiki('msg'),
  },
  test: {
    summary: '运行游戏测试。',
    syntax: 'test run|runthis|runthese|runfailed|clearall|clearthis|create|...',
    wiki: wiki('test'),
  },
  tick: {
    summary: '控制游戏刻的速率、暂停与步进。',
    syntax:
      'tick query | tick rate <速率> | tick freeze|unfreeze | tick step <刻数> | tick sprint ...',
    wiki: wiki('tick'),
  },
  tm: {
    summary: '向自己所在的队伍发送消息（teammsg 的别名）。',
    syntax: 'tm <消息>',
    wiki: wiki('teammsg'),
  },
  trigger: {
    summary: '触发某个记分板触发器。',
    syntax: 'trigger <目标> [add|set] [值]',
    wiki: wiki('trigger'),
  },
  version: {
    summary: '显示当前游戏版本。',
    syntax: 'version',
    wiki: wiki('version'),
  },
  w: {
    summary: '向某个玩家发送私聊消息（msg 的别名）。',
    syntax: 'w <目标> <消息>',
    wiki: wiki('msg'),
  },
  waypoint: {
    summary: '管理路径点（1.21.11+）。',
    syntax: 'waypoint ...',
    wiki: wiki('waypoint'),
  },
  whitelist: {
    summary: '管理服务器白名单。',
    syntax: 'whitelist add|remove <玩家> | whitelist list|on|off|reload',
    wiki: wiki('whitelist'),
  },

  // execute 子命令
  as: {
    summary: '以目标实体作为执行者执行。',
    syntax: 'execute as <目标> ...',
    wiki: wiki('execute'),
  },
  at: {
    summary: '以目标实体的位置和朝向执行。',
    syntax: 'execute at <目标> ...',
    wiki: wiki('execute'),
  },
  positioned: {
    summary: '设置执行位置。',
    syntax: 'execute positioned <坐标>|as <目标>|over <高度图> ...',
    wiki: wiki('execute'),
  },
  align: {
    summary: '将执行坐标对齐到方块中心。',
    syntax: 'execute align <轴组合，如 xyz> ...',
    wiki: wiki('execute'),
  },
  anchored: {
    summary: '设置视点锚点（eyes 或 feet）。',
    syntax: 'execute anchored eyes|feet ...',
    wiki: wiki('execute'),
  },
  facing: {
    summary: '设置执行朝向。',
    syntax: 'execute facing <坐标>|entity <目标> <锚点> ...',
    wiki: wiki('execute'),
  },
  rotated: {
    summary: '设置执行旋转角度。',
    syntax: 'execute rotated <偏航> <俯仰>|as <目标> ...',
    wiki: wiki('execute'),
  },
  in: {
    summary: '在指定维度中执行。',
    syntax: 'execute in <维度> ...',
    wiki: wiki('execute'),
  },
  on: {
    summary: '按关系选择执行者（如 attacker、controller、owner、leasher…）。',
    syntax: 'execute on <关系> ...',
    wiki: wiki('execute'),
  },
  if: {
    summary: '仅当条件成立时才继续执行。',
    syntax: 'execute if <条件> ...',
    wiki: wiki('execute'),
  },
  unless: {
    summary: '仅当条件不成立时才继续执行。',
    syntax: 'execute unless <条件> ...',
    wiki: wiki('execute'),
  },
  store: {
    summary: '将命令结果存储到计分板、NBT 或 BOSS 栏。',
    syntax: 'execute store result|success <位置> <路径> ...',
    wiki: wiki('execute'),
  },
  run: {
    summary: '执行最终的命令。',
    syntax: 'execute ... run <命令>',
    wiki: wiki('execute'),
  },
}
