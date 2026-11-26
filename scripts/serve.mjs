import http from 'node:http';
import { readFile, watch } from 'node:fs/promises';
import path from 'node:path';
import { build, root } from './build.mjs';

await build();
const directory = path.join(root, 'dist');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8' };
const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === '/') pathname = '/index.html';
    if (!path.extname(pathname)) pathname += '.html';
    const file = path.resolve(directory, '.' + pathname);
    if (!file.startsWith(directory + path.sep)) { response.writeHead(403).end(); return; }
    let content;
    let status = 200;
    let extension = path.extname(file);
    try { content = await readFile(file); }
    catch { content = await readFile(path.join(directory, '404.html')); status = 404; extension = '.html'; }
    response.writeHead(status, { 'Content-Type': types[extension] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch { response.writeHead(400).end('Bad request'); }
});
const port = Number(process.env.PORT || 4173);
server.listen(port, '127.0.0.1', () => console.log(`Local: http://localhost:${port}`));
if (!process.argv.includes('--production')) {
  let pending;
  for (const folder of ['src', 'public']) {
    (async () => {
      for await (const event of watch(path.join(root, folder), { recursive: true })) {
        clearTimeout(pending);
        pending = setTimeout(() => build().catch(console.error), 150);
      }
    })().catch(console.error);
  }
}
