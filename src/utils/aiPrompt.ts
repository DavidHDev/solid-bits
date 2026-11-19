import type { PropRow } from '@/components/common/PropTable';

export type PromptCodeObject = {
  usage?: string;
  code?: string;
  css?: string;
  utility?: string;
  dependencies?: string;
};

export const stripSourceHeader = (source = '') => source.replace(/^['"]use client['"];\s*/gm, '').trim();

export function buildPrompt(componentName: string, codeObject: PromptCodeObject, propData: PropRow[] = []) {
  const usage = codeObject.usage || '';
  const deps = codeObject.dependencies || '';
  const source = stripSourceHeader(codeObject.code || '');
  const css = codeObject.css || '';

  let prompt = `## Integrate the <${componentName} /> component from Solid Bits

You are helping integrate an open-source SolidJS component into an existing application.

### Component: ${componentName}
### Variant: SolidJS 2.0 + TypeScript + CSS
${deps ? `### Dependencies: ${deps}` : ''}

---

### Usage Example
\`\`\`tsx
${usage}
\`\`\`
`;

  if (propData.length > 0) {
    prompt += `
### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
${propData.map(p => `| ${p.name} | ${p.type} | ${p.default || '—'} | ${p.description} |`).join('\n')}
`;
  }

  prompt += `
### Full Component Source
\`\`\`tsx
${source}
\`\`\`
`;

  if (css) {
    prompt += `
### Component CSS
\`\`\`css
${css}
\`\`\`
`;
  }

  if (codeObject.utility) {
    prompt += `
### Utility Source
\`\`\`ts
${codeObject.utility}
\`\`\`
`;
  }

  prompt += `
### Integration Instructions
1. Install any listed dependencies.
2. Copy the component source into the appropriate directory in the project.
${css ? '3. Import the CSS file alongside the component.\n' : ''}${css ? '4' : '3'}. Import and render the component using the usage example above as a starting point.
${css ? '5' : '4'}. Adjust props as needed for the specific use case — refer to the props table for all available options.

### More from Solid Bits
The full library index, including everything solid-bits.dev offers, is at https://solid-bits.dev/llms.txt — fetch it if this component is not the right fit or the project needs more pieces.
`;

  return prompt;
}
