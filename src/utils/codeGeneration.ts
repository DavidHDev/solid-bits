const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const quoteString = (value: string) => `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

export function formatJsLiteral(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return quoteString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'function') return value.name && value.name !== 'anonymous' ? value.name : 'handler';
  if (Array.isArray(value)) return `[${value.map(formatJsLiteral).join(', ')}]`;
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).map(([key, entry]) => {
      const safeKey = /^[A-Za-z_$][\w$]*$/.test(key) ? key : quoteString(key);
      return `${safeKey}: ${formatJsLiteral(entry)}`;
    });
    return entries.length ? `{ ${entries.join(', ')} }` : '{}';
  }
  return String(value);
}

export function formatJsxProp(propName: string, value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value === 'boolean') return value ? propName : `${propName}={false}`;
  if (typeof value === 'string' && !value.includes('"') && !value.includes('\n')) return `${propName}="${value}"`;
  return `${propName}={${formatJsLiteral(value)}}`;
}

type Attr = { name: string; start: number; end: number };

const readAttributes = (tag: string, from: number): Attr[] => {
  const attrs: Attr[] = [];
  let i = from;
  while (i < tag.length) {
    while (i < tag.length && /\s/.test(tag[i])) i++;
    if (i >= tag.length || tag[i] === '/' || tag[i] === '>') break;
    if (tag[i] === '{') {
      let depth = 0;
      const start = i;
      for (; i < tag.length; i++) {
        if (tag[i] === '{') depth++;
        else if (tag[i] === '}' && --depth === 0) {
          i++;
          break;
        }
      }
      attrs.push({ name: '', start, end: i });
      continue;
    }
    const start = i;
    while (i < tag.length && /[\w$:-]/.test(tag[i])) i++;
    const name = tag.slice(start, i);
    if (!name) {
      i++;
      continue;
    }
    if (tag[i] === '=') {
      i++;
      const open = tag[i];
      if (open === '"' || open === "'") {
        i = tag.indexOf(open, i + 1) + 1;
      } else if (open === '{') {
        let depth = 0;
        let quote: string | null = null;
        for (; i < tag.length; i++) {
          const char = tag[i];
          if (quote) {
            if (char === '\\') i++;
            else if (char === quote) quote = null;
            continue;
          }
          if (char === '"' || char === "'" || char === '`') quote = char;
          else if (char === '{') depth++;
          else if (char === '}' && --depth === 0) {
            i++;
            break;
          }
        }
      }
    }
    attrs.push({ name, start, end: i });
  }
  return attrs;
};

const findTagEnd = (code: string, from: number) => {
  let depth = 0;
  let quote: string | null = null;
  for (let i = from; i < code.length; i++) {
    const char = code[i];
    if (quote) {
      if (char === '\\') i++;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') quote = char;
    else if (char === '{') depth++;
    else if (char === '}') depth--;
    else if (char === '>' && depth === 0) return i;
  }
  return -1;
};

export function injectPropsIntoUsage(
  usageCode: string,
  props: Record<string, unknown>,
  defaultProps: Record<string, unknown>,
  componentName: string,
  demoOnlyProps: string[] = []
): string {
  if (!usageCode || !props || !componentName) return usageCode;

  const demoOnly = new Set(demoOnlyProps);
  const changed: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (demoOnly.has(key) || typeof value === 'function') continue;
    if (JSON.stringify(value) !== JSON.stringify(defaultProps[key])) changed[key] = value;
  }
  if (Object.keys(changed).length === 0) return usageCode;

  const tagStart = usageCode.search(new RegExp(`<${escapeRegex(componentName)}(?=[\\s/>])`));
  if (tagStart === -1) return usageCode;
  const tagEnd = findTagEnd(usageCode, tagStart + componentName.length + 1);
  if (tagEnd === -1) return usageCode;

  const selfClosing = usageCode[tagEnd - 1] === '/';
  const before = usageCode.slice(0, tagStart);
  const after = usageCode.slice(tagEnd + 1);
  let tag = usageCode.slice(tagStart, tagEnd + 1);
  const additions: string[] = [];

  for (const [propName, value] of Object.entries(changed)) {
    const line = formatJsxProp(propName, value);
    const attr = readAttributes(tag, componentName.length + 1).find(item => item.name === propName);
    if (attr) {
      tag =
        line === null
          ? tag.slice(0, attr.start) + tag.slice(attr.end)
          : tag.slice(0, attr.start) + line + tag.slice(attr.end);
    } else if (line !== null) {
      additions.push(line);
    }
  }

  if (additions.length > 0) {
    const indentMatch = tag.match(/\n([ \t]+)\S/);
    const closingIndent = before.match(/(^|\n)([ \t]*)$/)?.[2] ?? '';
    const indent = indentMatch ? indentMatch[1] : `${closingIndent}  `;
    const closing = selfClosing ? '/>' : '>';
    const body = tag.slice(0, tag.length - closing.length).trimEnd();
    tag = `${body}\n${additions.map(line => `${indent}${line}`).join('\n')}\n${closingIndent}${closing}`;
  }

  return before + tag + after;
}
