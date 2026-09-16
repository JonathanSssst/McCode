import type { languages } from 'monaco-editor'
import {
  COMMAND_NAMES_1_21_11,
  EXECUTE_SUBCOMMANDS,
  SELECTOR_ARG_NAMES,
} from '@/mcdata/commandNames'

export const mcfunctionLanguage: languages.IMonarchLanguage = {
  defaultToken: '',
  ignoreCase: true,
  tokenPostfix: '.mcfunction',
  keywords: [...COMMAND_NAMES_1_21_11, ...EXECUTE_SUBCOMMANDS],
  selectorArgs: [...SELECTOR_ARG_NAMES],
  brackets: [
    { open: '{', close: '}', token: 'delimiter.curly' },
    { open: '[', close: ']', token: 'delimiter.square' },
    { open: '(', close: ')', token: 'delimiter.parenthesis' },
  ],
  tokenizer: {
    root: [
      [/^\s*#.*$/, 'comment'],
      [/\$\(/, { token: 'variable', next: '@macro' }],
      [/[a-z_][\w.-]*:[a-z0-9_][\w./-]*/, 'string'],
      [/@[apresdn]\[/, { token: 'type.identifier', next: '@selector' }],
      [/@[apresdn]/, 'type.identifier'],
      [/"[^"]*"/, 'string'],
      [/'[^']*'/, 'string'],
      [/-?\d+(\.\d+)?[bdfLs]?\b/, 'number'],
      [/[~^]-?\d*\.?\d*/, 'number'],
      [
        /[a-z_][\w-]*/,
        {
          cases: {
            '@keywords': 'keyword',
            '@default': 'identifier',
          },
        },
      ],
      [/[{}[\]()]/, '@brackets'],
      [/[=!<>]=?|[+\-*/%]/, 'operator'],
      [/[,:]/, 'delimiter'],
    ],
    selector: [
      [/\]/, { token: '@brackets', next: '@pop' }],
      [
        /[a-z_]\w*/,
        {
          cases: {
            '@selectorArgs': 'keyword',
            '@default': 'identifier',
          },
        },
      ],
      [/[=!<>]=?/, 'operator'],
      [/"[^"]*"|'[^']*'/, 'string'],
      [/-?\d+(\.\d+)?/, 'number'],
      [/[~^]/, 'number'],
      [/[,\s]+/, ''],
    ],
    macro: [
      [/\)/, { token: 'variable', next: '@pop' }],
      [/[a-z_]\w*/, 'variable'],
      [/\d+/, 'number'],
    ],
  },
}
