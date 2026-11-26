import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const root = fileURLToPath(new URL('../', import.meta.url));
export async function build() {
  const output = path.join(root, 'dist');
  // Only the generated output within this project is replaced.
  if (path.dirname(output) !== root.replace(/[\\/]$/, '')) throw new Error('Invalid output path');
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  await cp(path.join(root, 'public'), output, { recursive: true });
  const pages = (await readdir(path.join(root, 'src/pages'))).filter(name => name.endsWith('.html'));
  for (const name of pages) {
    let html = await readFile(path.join(root, 'src/pages', name), 'utf8');
    html = html.replace('</head>', `
<meta name="description" content="Community Skill Development Institute — practical caregiving, Japanese, English and computer skills training in Dhaka.">
<meta name="robots" content="noindex,nofollow,noarchive">
<meta name="theme-color" content="#00528E">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/preview.css">
<script src="/app.js" defer></script>
</head>`);
    html = html.replace('<main>', '<main id="main-content" tabindex="-1">');
    html = html.replace('<body>', '<body><a class="skip-link" href="#main-content">Skip to content</a>');
    await writeFile(path.join(output, name), html);
  }
  await cp(path.join(output, 'NotFound.html'), path.join(output, '404.html'));
  console.log(`Built ${pages.length} design pages into dist/`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await build();
