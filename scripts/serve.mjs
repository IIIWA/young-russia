import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.join(projectRoot, 'dist');
const headerReviewRoot = process.argv.includes('--review-headers') ? path.join(projectRoot, 'prototype/site/reviews/header-menu-2026-10-31') : null;
const host = '127.0.0.1';
const port = Number(process.env.PORT || 4173);
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.geojson':'application/geo+json; charset=utf-8','.webp':'image/webp','.svg':'image/svg+xml'};

http.createServer(async (request,response) => {
  try {
    const url = new URL(request.url || '/',`http://${host}:${port}`);
    if (headerReviewRoot && ['/__review/links/', '/__review/links'].includes(url.pathname)) {
      const body = await fs.readFile(path.join(projectRoot, 'docs/s98-added-links-2026-11-01.html'));
      response.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}).end(body);
      return;
    }
    let pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const review = headerReviewRoot && pathname.startsWith('/__review/header/');
    const servingRoot = review ? headerReviewRoot : root;
    if (review) pathname = pathname.slice('/__review/header'.length) || '/index.html';
    if (review && pathname === '/') pathname = '/index.html';
    const target = path.resolve(servingRoot, `.${pathname}`);
    if (!target.startsWith(servingRoot + path.sep)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    let body;
    try { body = await fs.readFile(target); }
    catch (error) {
      if (!headerReviewRoot || !/^\/assets\/style-[a-f0-9]+\.css$/.test(pathname)) throw error;
      body = await fs.readFile(path.join(headerReviewRoot, 'render-assets', path.basename(pathname)));
    }
    response.writeHead(200,{'content-type':types[path.extname(target)] || 'application/octet-stream','cache-control':'no-store'}).end(body);
  } catch {
    response.writeHead(404).end('Not found');
  }
}).listen(port,host,() => console.log(`Preview: http://${host}:${port}/`));
