import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const host = '127.0.0.1';
const port = Number(process.env.PORT || 4173);
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.webp':'image/webp','.svg':'image/svg+xml'};

http.createServer(async (request,response) => {
  try {
    const url = new URL(request.url || '/',`http://${host}:${port}`);
    const pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const target = path.resolve(root, `.${pathname}`);
    if (!target.startsWith(root + path.sep)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    const body = await fs.readFile(target);
    response.writeHead(200,{'content-type':types[path.extname(target)] || 'application/octet-stream','cache-control':'no-store'}).end(body);
  } catch {
    response.writeHead(404).end('Not found');
  }
}).listen(port,host,() => console.log(`Preview: http://${host}:${port}/`));
