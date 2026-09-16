export interface Snippet {
  id: string
  title: string
  snippet: string
}

export const SNIPPETS: Snippet[] = [
  {
    id: 'execute.as',
    title: 'execute as ... at @s run',
    snippet: 'execute as ${1:@a} at @s run $0',
  },
  { id: 'execute.if', title: 'execute if ... run', snippet: 'execute if ${1:entity @s} run $0' },
  {
    id: 'execute.positioned',
    title: 'execute positioned ... run',
    snippet: 'execute positioned ${1:~ ~ ~} run $0',
  },
  {
    id: 'execute.store',
    title: 'execute store result ...',
    snippet: 'execute store result ${1:score} ${2:@a} ${3:objective} run $0',
  },
  { id: 'summon', title: 'summon', snippet: 'summon ${1:minecraft:zombie} ~ ~ ~ {${0}}' },
  { id: 'give', title: 'give', snippet: 'give ${1:@a} ${2:minecraft:diamond_sword}${3: 1}' },
  {
    id: 'tellraw',
    title: 'tellraw',
    snippet: 'tellraw ${1:@a} {"text":"${2:Hello}","color":"white"}',
  },
  { id: 'title', title: 'title', snippet: 'title ${1:@a} title {"text":"${2:Hello}"}' },
  {
    id: 'scoreboard.add',
    title: 'scoreboard objectives add',
    snippet: 'scoreboard objectives add ${1:objective} ${2:dummy}',
  },
  {
    id: 'scoreboard.set',
    title: 'scoreboard players set',
    snippet: 'scoreboard players set ${1:@a} ${2:objective} ${3:0}',
  },
  {
    id: 'scoreboard.operation',
    title: 'scoreboard players operation',
    snippet: 'scoreboard players operation ${1:@a} ${2:objective} ${3:+=} ${4:@s} ${5:objective}',
  },
  { id: 'tag.add', title: 'tag add', snippet: 'tag ${1:@a} add ${2:tag}' },
  { id: 'team.add', title: 'team add', snippet: 'team add ${1:team}' },
  { id: 'function', title: 'function', snippet: 'function ${1:mccode:function}' },
  {
    id: 'schedule',
    title: 'schedule function',
    snippet: 'schedule function ${1:mccode:function} ${2:1s} ${3:append}',
  },
  {
    id: 'particle',
    title: 'particle',
    snippet: 'particle ${1:minecraft:flame} ~ ~ ~ ${2:0 0 0} ${3:0.1} ${4:10} ${5:normal}',
  },
  {
    id: 'playsound',
    title: 'playsound',
    snippet: 'playsound ${1:minecraft:ui.button.click} master ${2:@a} ~ ~ ~ ${3:1} ${4:1}',
  },
  {
    id: 'effect.give',
    title: 'effect give',
    snippet: 'effect give ${1:@a} ${2:minecraft:speed} ${3:30} ${4:0}',
  },
  {
    id: 'fill',
    title: 'fill',
    snippet: 'fill ${1:~-5 ~-1 ~-5} ${2:~5 ~1 ~5} ${3:minecraft:stone}',
  },
  { id: 'setblock', title: 'setblock', snippet: 'setblock ${1:~ ~ ~} ${2:minecraft:stone}' },
  { id: 'clone', title: 'clone', snippet: 'clone ${1:~-1 ~-1 ~-1} ${2:~1 ~1 ~1} ~ ~ ~' },
  { id: 'data.get', title: 'data get entity', snippet: 'data get entity ${1:@a} ${2:Health}' },
  { id: 'tp', title: 'tp', snippet: 'tp ${1:@s} ${2:~ ~ ~}' },
  { id: 'loot.give', title: 'loot give', snippet: 'loot give ${1:@a} loot ${2:mccode:loot_table}' },
  {
    id: 'advancement.grant',
    title: 'advancement grant',
    snippet: 'advancement grant ${1:@a} only ${2:mccode:advancement}',
  },
  { id: 'gamerule', title: 'gamerule', snippet: 'gamerule ${1:doDaylightCycle} ${2:false}' },
  { id: 'macro', title: 'macro line', snippet: '\\$(${1:name})' },
]
