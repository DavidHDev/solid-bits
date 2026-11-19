import { Show, createMemo, createSignal, onSettled } from 'solid-js';
import { CheckIcon, CopyIcon } from '@/components/icons/Icons';
import { useInstallation } from '@/hooks/useInstallation';
import { generateDependencyCommands, getTypeDependencies, normalizeDependencies } from '@/utils/dependencies';

export default function Dependencies(props: { dependencyList?: string[] }) {
  const { packageManager } = useInstallation();
  const [copied, setCopied] = createSignal(false);
  let resetTimer: ReturnType<typeof setTimeout> | undefined;

  const dependencies = createMemo(() => normalizeDependencies(props.dependencyList ?? []));
  const command = createMemo(() => {
    const commands = generateDependencyCommands(dependencies());
    return commands?.[packageManager()] || commands?.npm || '';
  });
  const packageCount = () => dependencies().length + getTypeDependencies(dependencies()).length;

  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText(command());
      setCopied(true);
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  onSettled(() => () => clearTimeout(resetTimer));

  return (
    <Show when={dependencies().length > 0}>
      <section class="dependencies-panel" aria-labelledby="dependencies-title">
        <div class="dependencies-summary">
          <h2 id="dependencies-title">Dependencies</h2>
          <p>
            {packageCount()} required {packageCount() === 1 ? 'package' : 'packages'}
          </p>
        </div>
        <div class="dependencies-command">
          <code title={command()}>{command()}</code>
          <button
            type="button"
            aria-label={copied() ? 'Install command copied' : 'Copy install command'}
            onClick={copyCommand}
          >
            <Show when={copied()} fallback={<CopyIcon size={15} />}>
              <CheckIcon size={15} />
            </Show>
            <span aria-live="polite">{copied() ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </section>
    </Show>
  );
}
