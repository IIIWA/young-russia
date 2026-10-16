import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'site');
const port = Number(process.env.PORT || 4183);
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp'};

http.createServer(async (request,response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url,'http://127.0.0.1').pathname);
    const target = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!target.startsWith(root + path.sep)) throw new Error('Outside prototype');
    const body = await fs.readFile(target);
    response.writeHead(200, {'content-type':types[path.extname(target)] || 'application/octet-stream','cache-control':'no-store'}).end(body);
  } catch {
    response.writeHead(404).end('Not found');
  }
}).listen(port,'127.0.0.1',() => console.log(`Prototype: http://127.0.0.1:${port}/`));
