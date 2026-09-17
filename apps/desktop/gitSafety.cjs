const path = require('node:path')

const GIT_SUBCOMMANDS = new Set([
  'status',
  'add',
  'restore',
  'reset',
  'commit',
  'log',
  'show',
  'diff',
  'branch',
  'checkout',
  'switch',
  'stash',
  'fetch',
  'pull',
  'push',
  'init',
  'rev-parse',
  'ls-files',
  'for-each-ref',
  'remote',
])

// `-c` is intentionally allowed: it can only be a per-subcommand option here,
// because the subcommand is always the first argument (the dangerous global
// `git -c key=value <cmd>` form is impossible from this API).
const FORBIDDEN_GIT_FLAG =
  /^--?(?:config-env|exec-path|upload-pack|receive-pack|git-dir|work-tree|namespace|no-index|rules)\b/

const WINDOWS_ABSOLUTE = /^[A-Za-z]:[\\/]/

function assertInsideRoot(root, target) {
  const rootResolved = path.resolve(root)
  const resolved = path.resolve(rootResolved, target)
  if (resolved !== rootResolved && !resolved.startsWith(rootResolved + path.sep)) {
    throw new Error(`git: path outside workspace: ${target}`)
  }
}

function validateGitArgs(args, root) {
  if (!Array.isArray(args) || args.length === 0) throw new Error('git: empty arguments')
  const [subcommand, ...rest] = args
  if (typeof subcommand !== 'string' || !GIT_SUBCOMMANDS.has(subcommand)) {
    throw new Error(`git: subcommand not allowed: ${String(subcommand)}`)
  }
  for (const arg of rest) {
    if (typeof arg !== 'string' || arg.includes('\0')) throw new Error('git: invalid argument')
    if (FORBIDDEN_GIT_FLAG.test(arg)) throw new Error(`git: argument not allowed: ${arg}`)
  }
  const separator = rest.indexOf('--')
  for (const candidate of separator === -1 ? [] : rest.slice(separator + 1)) {
    assertInsideRoot(root, candidate)
  }
  for (const arg of rest) {
    const colon = arg.indexOf(':')
    if (colon > 0 && !arg.startsWith('-') && !arg.includes('://') && !WINDOWS_ABSOLUTE.test(arg)) {
      assertInsideRoot(root, arg.slice(colon + 1))
    }
  }
}

module.exports = { GIT_SUBCOMMANDS, validateGitArgs, assertInsideRoot }
