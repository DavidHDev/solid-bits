import code from '@content/Animations/LogoLoop/LogoLoop.tsx?raw';
import css from '@content/Animations/LogoLoop/LogoLoop.css?raw';
import { createCodeObject } from '@/types/code';

export const logoLoop = createCodeObject(code, 'Animations/LogoLoop', {
  dependencies: '',
  usage: `import LogoLoop from './LogoLoop';
import { SolidLogo, ViteLogo, TypeScriptLogo, TailwindLogo } from './logos';

const techLogos = [
  { node: () => <SolidLogo />, title: "Solid", href: "https://www.solidjs.com", hoverColor: "#6ec9f7" },
  { node: () => <ViteLogo />, title: "Vite", href: "https://vite.dev" },
  { node: () => <TypeScriptLogo />, title: "TypeScript", href: "https://www.typescriptlang.org", hoverColor: "#3178c6" },
  { node: () => <TailwindLogo />, title: "Tailwind CSS", href: "https://tailwindcss.com", hoverColor: "#38bdf8" },
];

const imageLogos = [
  { src: "/logos/company1.png", alt: "Company 1", href: "https://company1.com" },
  { src: "/logos/company2.png", alt: "Company 2", href: "https://company2.com" },
  { src: "/logos/company3.png", alt: "Company 3", href: "https://company3.com" },
];

function App() {
  return (
    <div style={{ height: '200px', position: 'relative', overflow: 'hidden' }}>
      <LogoLoop
        logos={techLogos}
        speed={100}
        direction="left"
        logoHeight={48}
        gap={56}
        hoverSpeed={0}
        scaleOnHover
        ariaLabel="Technology partners"
      />

      <LogoLoop
        logos={techLogos}
        layout="orbit"
        bend={0.6}
        magnify={0.6}
        labels="hover"
        muted={0.5}
      />

      <LogoLoop logos={imageLogos} direction="up" focus={0.5} step />
    </div>
  );
}`,
  css
});
