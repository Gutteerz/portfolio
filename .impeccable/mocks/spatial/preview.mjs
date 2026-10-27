import http from 'node:http';
import { readFile } from 'node:fs/promises';

const files = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/entrance.png', ['entrance.png', 'image/png']],
  ['/pool-floor.png', ['pool-floor.png', 'image/png']],
  ['/gallery.png', ['gallery.png', 'image/png']],
]);
const server = http.createServer(async (request, response) => {
  const file = files.get(new URL(request.url, 'http://localhost').pathname);
  if (!file) { response.writeHead(404); response.end(); return; }
  try {
    const content = await readFile(new URL(file[0], import.meta.url));
    response.writeHead(200, { 'Content-Type': file[1], 'Cache-Control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch {
    response.writeHead(404); response.end('View not available.');
  }
});
server.listen(0, '127.0.0.1', () => console.log(`Mockup: http://127.0.0.1:${server.address().port}/`));
