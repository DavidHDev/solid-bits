export type IconSvgElement =
  | [string, { [key: string]: string | number }][]
  | readonly (readonly [string, { readonly [key: string]: string | number }])[];

const escapeAttr = (value: string | number) => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;');

const toMarkup = (icon: IconSvgElement, strokeWidth?: number) =>
  icon
    .map(([tag, attrs]) => {
      const parts = Object.entries(attrs)
        .filter(([key]) => key !== 'key')
        .map(([key, value]) => {
          const name = key.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`);
          const next = name === 'stroke-width' && strokeWidth !== undefined ? strokeWidth : value;
          return `${name}="${escapeAttr(next)}"`;
        });
      return `<${tag} ${parts.join(' ')}></${tag}>`;
    })
    .join('');

export default function HugeiconsIcon(props: {
  icon: IconSvgElement;
  size?: number;
  strokeWidth?: number;
  color?: string;
  class?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.size ?? 24}
      height={props.size ?? 24}
      viewBox="0 0 24 24"
      fill="none"
      color={props.color ?? 'currentColor'}
      class={props.class}
      aria-hidden="true"
      innerHTML={toMarkup(props.icon, props.strokeWidth)}
    />
  );
}
