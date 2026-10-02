/**
 * Genera una demo de cada slot en un único HTML autocontenido (JS y CSS en línea),
 * listo para publicar como artifact o abrir sin servidor: dist-demo/<slot>.html
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { build } from 'vite';

const root = resolve(import.meta.dirname, '..');
const out = join(root, 'dist-demo');
mkdirSync(out, { recursive: true });

for (const game of ['duelo', 'olimpo']) {
  const dir = join(out, `.tmp-${game}`);
  await build({
    root,
    base: './',
    logLevel: 'warn',
    build: {
      outDir: dir,
      emptyOutDir: true,
      assetsInlineLimit: Infinity,
      cssCodeSplit: false,
      modulePreload: false,
      rollupOptions: {
        input: join(root, game, 'index.html'),
        output: { inlineDynamicImports: true },
      },
    },
  });
  const assets = join(dir, 'assets');
  const files = readdirSync(assets);
  const js = files.filter((f) => f.endsWith('.js')).map((f) => readFileSync(join(assets, f), 'utf8'));
  const css = files.filter((f) => f.endsWith('.css')).map((f) => readFileSync(join(assets, f), 'utf8'));
  if (js.length !== 1) throw new Error(`${game}: se esperaba 1 JS y hay ${js.length}`);

  let html = readFileSync(join(dir, game, 'index.html'), 'utf8');
  html = html
    .replace(/<script type="module"[^>]*src="[^"]*"[^>]*><\/script>/, '')
    .replace(/<link rel="stylesheet"[^>]*href="\.\.?\/assets\/[^"]*"[^>]*>/g, '');
  const script = `<script type="module">${js[0].replace(/<\/script/gi, '<\\/script')}</script>`;
  const style = `<style>${css.join('\n')}</style>`;
  html = html.replace('</head>', `${style}\n</head>`).replace('</body>', `${script}\n</body>`);
  writeFileSync(join(out, `${game}.html`), html);

  // Versión para artifact: sin doctype/html/head/body (el visor pone su propio esqueleto).
  const head = html.match(/<head>([\s\S]*)<\/head>/)[1].replace(/<meta [^>]*>\s*/g, '');
  const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
  writeFileSync(join(out, `${game}.artifact.html`), `${head.trim()}\n${body.trim()}\n`);
  console.log(`${game}: ${(html.length / 1024).toFixed(0)} KB`);
}
