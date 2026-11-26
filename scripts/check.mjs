import assert from 'node:assert/strict';
import { readFile, readdir, access } from 'node:fs/promises';
import path from 'node:path';
import { build, root } from './build.mjs';

await build();
const directory = path.join(root, 'dist');
const pages = (await readdir(directory)).filter(file => file.endsWith('.html'));
let links = 0;
const failures = [];
for (const page of pages) {
  const html = await readFile(path.join(directory, page), 'utf8');
  assert.match(html, /<title>.+<\/title>/, `${page}: missing title`);
  assert.match(html, /name="viewport"/, `${page}: missing viewport`);
  assert.match(html, /noindex/, `${page}: missing preview robots directive`);
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1, `${page}: should have one h1`);
  for (const match of html.matchAll(/(?:href|src)=["']([^"']+)["']|url\(([^)]+)\)/g)) {
    const url = (match[1] || match[2]).replace(/^['"]|['"]$/g, '').replace(/&amp;/g, '&');
    if (/^(https?:|mailto:|tel:|data:)/.test(url) || url === '#') continue;
    const [pathname, fragment] = url.split('#');
    const file = pathname.split('?')[0];
    const target = file ? path.join(directory, file) : path.join(directory, page);
    try {
      await access(target); links++;
      if (fragment && path.extname(target) === '.html') {
        const destination = await readFile(target, 'utf8');
        assert(destination.includes(`id="${fragment}"`) || destination.includes(`id='${fragment}'`), `Missing fragment #${fragment}`);
      }
    } catch (error) { failures.push(`${page}: ${url} — ${error.message}`); }
  }
}
assert.equal(failures.length, 0, failures.join('\n'));
const config = JSON.parse(await readFile(path.join(root, 'vercel.json'), 'utf8'));
assert.equal(config.outputDirectory, 'dist');
console.log(`PASS: ${pages.length} HTML pages, ${links} local asset/link references, page titles, anchors and Vercel output configuration.`);
