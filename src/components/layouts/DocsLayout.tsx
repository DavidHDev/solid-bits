import { Loading } from 'solid-js';
import type { JSX } from '@solidjs/web';
import ProCard from '@/components/common/Pro/ProCard';
import Navbar from '@/components/landing/Navbar/Navbar';
import Sidebar from '@/components/navs/Sidebar';

export default function DocsLayout(props: { children?: JSX.Element }) {
  return (
    <main class="app-container docs-app">
      <Navbar showDocs />
      <section class="category-wrapper">
        <Sidebar />
        <Loading fallback={<div class="category-page" />}>{props.children}</Loading>
        <aside class="right-panel" aria-label="React Bits Pro">
          <div class="right-panel-inner">
            <ProCard />
          </div>
        </aside>
      </section>
    </main>
  );
}
