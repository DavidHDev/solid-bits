import { For, onSettled } from 'solid-js';
import antigravityIcon from '@/assets/icons/antigravity.svg';
import claudeIcon from '@/assets/icons/claude.svg';
import cursorIcon from '@/assets/icons/cursor.svg';
import vscodeIcon from '@/assets/icons/vscode.svg';
import { SAMPLE_COMPONENTS_JSON_REGISTRIES_DOC } from '@/constants/cli';
import type { JSX } from '@solidjs/web';
import CommandList, { type CommandItem } from './CommandList';
import CopyPageButton from './CopyPageButton';
import DocsButtonBar from './DocsButtonBar';
import DocsCodeBlock from './DocsCodeBlock';
import DocsCopyButton from './DocsCopyButton';
import DocsStep from './DocsStep';

const ICONS: Record<string, string> = {
  antigravity: antigravityIcon,
  claude: claudeIcon,
  cursor: cursorIcon,
  vscode: vscodeIcon
};

const CLIENTS: CommandItem[] = [
  {
    key: 'antigravity',
    label: 'Antigravity',
    command: `{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}`
  },
  { key: 'claude', label: 'Claude Code', command: 'npx shadcn@latest mcp init --client claude' },
  {
    key: 'codex',
    label: 'Codex',
    command: `[mcp_servers.shadcn]
command = "npx"
args = ["shadcn@latest", "mcp"]`
  },
  { key: 'cursor', label: 'Cursor', command: 'npx shadcn@latest mcp init --client cursor' },
  { key: 'vscode', label: 'VS Code', command: 'npx shadcn@latest mcp init --client vscode' }
];

const NOTES: Record<string, () => JSX.Element> = {
  antigravity: () => (
    <>
      Add this to <code>~/.gemini/config/mcp_config.json</code> or project <code>.agents/mcp_config.json</code>. Works
      across Antigravity CLI (<code>agy</code>), Antigravity IDE, and Antigravity 2.0.
    </>
  ),
  claude: () => (
    <>
      Then restart Claude Code. If the server doesn't show up, run <code>/mcp</code> to debug it.
    </>
  ),
  codex: () => (
    <>
      The CLI can't set up Codex for you. Add this to <code>~/.codex/config.toml</code>, then restart Codex.
    </>
  ),
  cursor: () => <>Then open Cursor Settings and enable the shadcn MCP server.</>,
  vscode: () => (
    <>
      Then open <code>.vscode/mcp.json</code> and click Start next to the shadcn server.
    </>
  )
};

const EXAMPLE_PROMPTS = [
  'Show me all the available backgrounds from the Solid Bits registry',
  'Add the Dither background from Solid Bits to the page, make it blue',
  'Add a new section which fades in on scroll using FadeContent from Solid Bits'
];

const OpenAIIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M11.217 19.384a3.501 3.501 0 0 0 6.783 -1.217v-5.167l-6 -3.35" />
    <path d="M5.214 15.014a3.501 3.501 0 0 0 4.446 5.266l4.34 -2.534v-6.946" />
    <path d="M6 7.63c-1.391 -.236 -2.787 .395 -3.534 1.689a3.474 3.474 0 0 0 1.271 4.745l4.263 2.514l6 -3.348" />
    <path d="M12.783 4.616a3.501 3.501 0 0 0 -6.783 1.217v5.067l6 3.45" />
    <path d="M18.786 8.986a3.501 3.501 0 0 0 -4.446 -5.266l-4.34 2.534v6.946" />
    <path d="M18 16.302c1.391 .236 2.787 -.395 3.534 -1.689a3.474 3.474 0 0 0 -1.271 -4.745l-4.308 -2.514l-5.955 3.42" />
  </svg>
);

const ArrowUpRightIcon = () => (
  <svg
    width="1em"
    height="1em"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M7 7h10v10" />
    <path d="M7 17 17 7" />
  </svg>
);

export default function McpServer() {
  onSettled(() => {
    window.scrollTo(0, 0);
  });

  return (
    <section class="docs-section">
      <div class="docs-page-header">
        <h1 class="docs-title">MCP Server</h1>
        <CopyPageButton />
      </div>

      <p class="docs-lead">
        Let your AI assistant browse, search and install Solid Bits components for you, straight from a prompt.
      </p>

      <p class="docs-paragraph dim">
        It works through the shadcn MCP server.{' '}
        <a class="docs-inline-link" href="https://modelcontextprotocol.io/" target="_blank" rel="noreferrer">
          Model Context Protocol
        </a>{' '}
        is an open standard that lets AI assistants connect to tools and data.
      </p>

      <h2 class="docs-section-title">Setup</h2>

      <ol class="docs-steps">
        <DocsStep index={1} title="Add the Solid Bits registry">
          <p class="docs-step-text">
            In your project's <code>components.json</code>, add <code>@solid-bits</code> to the registries:
          </p>
          <DocsCodeBlock code={SAMPLE_COMPONENTS_JSON_REGISTRIES_DOC} language="json" showLineNumbers />
        </DocsStep>

        <DocsStep index={2} title="Connect your AI client">
          <p class="docs-step-text">Set up the shadcn MCP server for your client:</p>
          <CommandList
            items={CLIENTS}
            icon={item =>
              item.key === 'codex' ? <OpenAIIcon /> : <img src={ICONS[item.key]} alt="" class="docs-cmd-logo" />
            }
            note={item => NOTES[item.key]()}
          />
        </DocsStep>

        <DocsStep index={3} title="Ask for components">
          <p class="docs-step-text">Describe what you want in plain language. Try one of these:</p>
          <ul class="docs-cmds">
            <For each={EXAMPLE_PROMPTS}>
              {prompt => (
                <li class="docs-prompt">
                  <span class="docs-prompt-text">{prompt}</span>
                  <DocsCopyButton text={prompt} label="Copy prompt" />
                </li>
              )}
            </For>
          </ul>
        </DocsStep>
      </ol>

      <h2 class="docs-section-title">Learn more</h2>

      <a class="docs-link-tile" href="https://ui.shadcn.com/docs/mcp" target="_blank" rel="noreferrer">
        <span class="docs-link-tile-text">
          <span class="docs-link-tile-title">shadcn MCP documentation</span>
          <span class="docs-link-tile-desc">Manual setup for other clients, and more ways to use the server.</span>
        </span>
        <ArrowUpRightIcon />
      </a>

      <DocsButtonBar
        next={{ label: 'Browse Components', route: '/get-started/index' }}
        previous={{ label: 'Installation', route: '/get-started/installation' }}
      />
    </section>
  );
}
