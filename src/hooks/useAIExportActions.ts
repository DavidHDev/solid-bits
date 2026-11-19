import { createMemo, createSignal, type Accessor } from 'solid-js';
import {
  ChatGptIcon,
  ClaudeIcon,
  CodeSquareIcon,
  CommandLineIcon,
  FileScriptIcon,
  SparklesIcon
} from '@hugeicons/core-free-icons';
import { jsrepoAddSnippet, registryUrl, shadcnAddSnippet } from '@/constants/cli';
import { buildCompactPrompt, copyText, openInAI, type AiProviderKey } from '@/utils/aiExport';
import type { IconSvgElement } from '@/components/icons/HugeiconsIcon';
import { useInstallation } from './useInstallation';
import { addToast } from './useToast';

export type AIExportInput = {
  componentName?: string;
  category?: string;
  subcategory?: string;
  fullPrompt?: string;
  configuredUsage?: string;
  componentSource?: string;
};

export type AIMenuItem = {
  key: string;
  label: string;
  icon: IconSvgElement | 'vercel';
  run: () => void;
};

export function useAIExportActions(input: Accessor<AIExportInput | null>) {
  const [done, setDone] = createSignal<string | null>(null);
  const { cliTool, packageManager } = useInstallation();

  const installCommand = createMemo(() => {
    const slug = input()?.subcategory;
    if (!slug) return '';
    return cliTool() === 'jsrepo' ? jsrepoAddSnippet(slug, packageManager()) : shadcnAddSnippet(slug, packageManager());
  });

  const run = async (key: string, text: string | undefined, message: string) => {
    if (!text) {
      addToast({ severity: 'error', summary: 'Nothing to copy for this component', life: 2500 });
      return;
    }
    if (await copyText(text)) {
      setDone(key);
      addToast({ severity: 'success', summary: message, life: 2500 });
      setTimeout(() => {
        if (done() === key) setDone(null);
      }, 2000);
    } else {
      addToast({ severity: 'error', summary: 'Could not copy to clipboard', life: 2500 });
    }
  };

  const copyItems = createMemo<AIMenuItem[]>(() => [
    {
      key: 'prompt',
      label: 'Copy prompt',
      icon: SparklesIcon as IconSvgElement,
      run: () => run('prompt', input()?.fullPrompt, 'Prompt copied — paste into any AI assistant')
    },
    {
      key: 'usage',
      label: 'Copy configured code',
      icon: CodeSquareIcon as IconSvgElement,
      run: () => run('usage', input()?.configuredUsage, 'Configured usage copied')
    },
    {
      key: 'source',
      label: 'Copy component source',
      icon: FileScriptIcon as IconSvgElement,
      run: () => run('source', input()?.componentSource, 'Component source copied')
    },
    {
      key: 'install',
      label: 'Copy install command',
      icon: CommandLineIcon as IconSvgElement,
      run: () => run('install', installCommand(), 'Install command copied')
    }
  ]);

  const openItems = createMemo<AIMenuItem[]>(() => {
    const items: { key: AiProviderKey; label: string; icon: AIMenuItem['icon'] }[] = [
      { key: 'chatgpt', label: 'Open in ChatGPT', icon: ChatGptIcon as IconSvgElement },
      { key: 'claude', label: 'Open in Claude', icon: ClaudeIcon as IconSvgElement },
      { key: 'v0', label: 'Open in v0', icon: 'vercel' }
    ];
    return items.map(item => ({
      ...item,
      run: () => {
        const value = input() || {};
        openInAI(item.key, {
          prompt: buildCompactPrompt({
            componentName: value.componentName || '',
            category: value.category || '',
            subcategory: value.subcategory || '',
            installCommand: installCommand(),
            usage: value.configuredUsage
          }),
          registryUrl: value.subcategory ? registryUrl(value.subcategory) : ''
        });
      }
    }));
  });

  return { copyItems, openItems, done, installCommand };
}
