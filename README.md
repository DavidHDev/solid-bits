<div align="center">
  <br />
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="src/assets/logos/solidbits-gh-white.svg">
    <source media="(prefers-color-scheme: light)" srcset="src/assets/logos/solidbits-gh-black.svg">
    <img src="src/assets/logos/solidbits-gh-black.svg" alt="Solid Bits" width="420">
  </picture>
  <br />
  <br />
  <h3>Animated SolidJS components for websites people remember.</h3>
  <p>217 free animated components and backgrounds for SolidJS.<br />Tune them yourself, or hand them to your agent.</p>
  <p>
    <a href="https://github.com/DavidHDev/solid-bits/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/DavidHDev/solid-bits?style=flat&logo=github&label=Stars"></a>
    <a href="https://github.com/DavidHDev/solid-bits/blob/main/LICENSE.md"><img alt="License: MIT + Commons Clause" src="https://img.shields.io/badge/License-MIT%20%2B%20Commons%20Clause-blue?style=flat"></a>
  </p>
  <p>
    <a href="https://solid-bits.dev/get-started/introduction">Documentation</a> ·
    <a href="https://solid-bits.dev/get-started/installation">Installation</a> ·
    <a href="https://solid-bits.dev/get-started/mcp">MCP</a> ·
    <a href="https://solid-bits.dev/get-started/index">Browse components</a>
  </p>
  <br />
</div>

## About

Solid Bits is the official SolidJS port of [React Bits](https://reactbits.dev): a free, open source library of animated SolidJS components and backgrounds that you copy into your project and make your own.

Each component is a single TSX file written for SolidJS 2.0, with its styles in a plain CSS file alongside it when it needs one. It drops straight into any SolidJS or SolidStart project.

## What's inside

Every component has a live demo with controls, works in light and dark mode on the docs site, and most backgrounds come with presets to start from. Search, favorites and a browse page help you find the effect you have in mind.

| Category                                                    | Count | What you'll find                                                              |
| ----------------------------------------------------------- | ----: | ----------------------------------------------------------------------------- |
| [Text Animations](https://solid-bits.dev/c/text-animations) |    33 | Split, scramble, blur and morph text, from headlines to scroll-driven reveals |
| [Animations](https://solid-bits.dev/c/animations)           |    38 | Cursor effects, hover interactions and reveals that wrap around any element   |
| [Components](https://solid-bits.dev/c/components)           |    48 | Carousels, galleries, cards, menus and docks with the motion built in         |
| [Micro](https://solid-bits.dev/c/micro)                     |    34 | Small interactive pieces like toggles, sliders, buttons and loaders           |
| [Backgrounds](https://solid-bits.dev/c/backgrounds)         |    64 | Shader and canvas backgrounds for heroes and full pages, most with presets    |

## Installation

Add any component with [jsrepo](https://jsrepo.dev):

```bash
npx jsrepo add https://solid-bits.dev/r/SplitText.json
```

Or with the [shadcn](https://ui.shadcn.com/) CLI:

```bash
npx shadcn@latest add https://solid-bits.dev/r/SplitText.json
```

Swap `SplitText` for any component. On pnpm, yarn or bun, replace `npx` with `pnpm dlx`, `yarn dlx` or `bunx --bun`.

Prefer to copy by hand? Open a component's Code tab, paste the file into your project and install the dependencies it lists. The [installation guide](https://solid-bits.dev/get-started/installation) covers both.

## Usage

Render it like any other component:

```tsx
import SplitText from './SplitText';

export default function Hero() {
  return <SplitText text="Hello, you!" delay={100} duration={0.6} />;
}
```

The code is yours, so change the styles, props or behavior however you like.

### Use it with your agent

Solid Bits works with the shadcn MCP server, so Claude Code, Cursor, Codex, VS Code and Antigravity can find and add components for you. Add the registry to your `components.json`:

```json
{
  "registries": {
    "@solid-bits": "https://solid-bits.dev/r/{name}.json"
  }
}
```

Then connect your client, for example `npx shadcn@latest mcp init --client claude`, and ask for what you need. See the [MCP guide](https://solid-bits.dev/get-started/mcp) for every client.

## Community

**Contributing.** Ideas and fixes are welcome. Browse the [open issues](https://github.com/DavidHDev/solid-bits/issues) or open a new one before starting a pull request.

**Official ports.** Solid Bits is a port of [React Bits](https://reactbits.dev), which is also available for [Vue](https://vue-bits.dev/) and [Svelte](https://sveltebits.xyz/).

## Sponsorship

You can support the project with the Sponsor button on the repository page. Donations go strictly towards hosting costs.

## Credit

Solid Bits occasionally draws inspiration from publicly available code examples. These are rewritten as full-fledged, customizable components. If you recognize your work, [open an issue](https://github.com/DavidHDev/solid-bits/issues) to request credit.

## License

[MIT + Commons Clause](https://github.com/DavidHDev/solid-bits/blob/main/LICENSE.md), free for personal and commercial use. Created and maintained by [David Haz](https://github.com/DavidHDev).
