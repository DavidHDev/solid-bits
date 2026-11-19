import { existsSync } from 'node:fs';
import { output as shadcnOutput } from '@jsrepo/shadcn';
import { defineConfig, type RegistryItem } from 'jsrepo';
import { componentDependenciesOutput } from './scripts/component-dependencies-output';
import { componentMetadata } from './src/constants/Information';

function defineComponent({
  title,
  description,
  category
}: {
  title: string;
  description: string;
  category: string;
}): RegistryItem[] {
  return [
    {
      title,
      description,
      name: title,
      type: 'registry:component',
      categories: [category],
      files: [{ path: `src/content/${category}/${title}` }]
    }
  ];
}

export default defineConfig({
  registry: {
    name: '@solid-bits',
    description:
      'An open source collection of animated, interactive & fully customizable SolidJS components for building stunning, memorable user interfaces.',
    homepage: 'https://solid-bits.dev',
    authors: ['David Haz'],
    bugs: 'https://github.com/DavidHDev/solid-bits/issues',
    repository: 'https://github.com/DavidHDev/solid-bits',
    tags: [
      'solid',
      'solidjs',
      'javascript',
      'typescript',
      'components',
      'web',
      'css-animations',
      'component-library',
      'ui-components',
      '3d',
      'ui-library'
    ],
    excludeDeps: ['solid-js', '@solidjs/web'],
    outputs: [
      shadcnOutput({ dir: 'public/r', format: true }),
      componentDependenciesOutput({ path: 'src/constants/componentDependencies.ts' })
    ],
    items: Object.values(componentMetadata)
      .filter(component => existsSync(`src/content/${component.category}/${component.name}`))
      .map(component =>
        defineComponent({
          title: component.name,
          description: component.description,
          category: component.category
        })
      )
      .flat()
      .sort((a, b) => a.name.localeCompare(b.name))
  }
});
