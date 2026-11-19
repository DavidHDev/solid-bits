const sharedScopes = {
  comments: ['comment', 'punctuation.definition.comment'],
  accent: [
    'keyword',
    'storage',
    'entity.name.tag',
    'entity.name.function',
    'support.function',
    'support.type',
    'constant.language'
  ],
  soft: [
    'entity.other.attribute-name',
    'variable.other.property',
    'meta.object-literal.key',
    'support.variable.property'
  ],
  strings: ['string', 'string.quoted', 'string.template', 'constant.character.escape'],
  numbers: ['constant.numeric', 'constant.character', 'constant.other'],
  punctuation: ['punctuation', 'meta.brace', 'meta.delimiter']
};

type ThemeInput = {
  name: string;
  type: 'dark' | 'light';
  background: string;
  foreground: string;
  muted: string;
  accent: string;
  soft: string;
  string: string;
  number: string;
};

const createTheme = ({ name, type, background, foreground, muted, accent, soft, string, number }: ThemeInput) => ({
  name,
  type,
  colors: {
    'editor.background': background,
    'editor.foreground': foreground
  },
  settings: [
    { settings: { background, foreground } },
    { scope: sharedScopes.comments, settings: { foreground: muted, fontStyle: 'italic' } },
    { scope: sharedScopes.accent, settings: { foreground: accent } },
    { scope: sharedScopes.soft, settings: { foreground: soft, fontStyle: 'italic' } },
    { scope: sharedScopes.strings, settings: { foreground: string } },
    { scope: sharedScopes.numbers, settings: { foreground: number } },
    { scope: sharedScopes.punctuation, settings: { foreground: muted } }
  ]
});

export const solidBitsDarkTheme = createTheme({
  name: 'solid-bits-dark',
  type: 'dark',
  background: '#0c0f13',
  foreground: '#d4dde6',
  muted: '#717c88',
  accent: '#6ec9f7',
  soft: '#a8dffa',
  string: '#b3c6d8',
  number: '#bcd9f2'
});

export const solidBitsLightTheme = createTheme({
  name: 'solid-bits-light',
  type: 'light',
  background: '#ffffff',
  foreground: '#363f49',
  muted: '#7a8592',
  accent: '#0977ae',
  soft: '#3a6ea8',
  string: '#4d6278',
  number: '#2f68a6'
});
