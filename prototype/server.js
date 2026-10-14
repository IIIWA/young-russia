import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const site = path.join(root, 'site');
const commentsFile = path.join(root, 'comments.json');
const host = '127.0.0.1';
const port = Number(process.env.PORT || 4175);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
};
let writeQueue = Promise.resolve();

async function readComments() {
  try {
    const items = JSON.parse(await fs.readFile(commentsFile, 'utf8'));
    return Array.isArray(items) ? items : [];
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

function json(response, status, value) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(value));
}

async function saveComment(request, response) {
  let raw = '';
  for await (const chunk of request) {
    raw += chunk;
    if (raw.length > 12000) return json(response, 413, {error:'Комментарий слишком длинный'});
  }
  let payload;
  try { payload = JSON.parse(raw); }
  catch { return json(response, 400, {error:'Неверный формат'}); }
  const page = String(payload.page || '');
  const section = String(payload.section || '');
  const text = String(payload.text || '').trim();
  if (!/^[a-z0-9/_-]+\.html$/.test(page) || !/^[a-z0-9-]{1,80}$/.test(section) || text.length < 1 || text.length > 2000) {
    return json(response, 400, {error:'Проверьте текст и страницу'});
  }
  const item = {id:crypto.randomUUID(), createdAt:new Date().toISOString(), page, section, text};
  try {
    await (writeQueue = writeQueue.then(async () => {
      const items = await readComments();
      items.push(item);
      const temporary = `${commentsFile}.${process.pid}.tmp`;
      await fs.writeFile(temporary, JSON.stringify(items, null, 2) + '\n', 'utf8');
      await fs.rename(temporary, commentsFile);
    }));
    json(response, 201, item);
  } catch {
    json(response, 500, {error:'Не удалось сохранить комментарий'});
  }
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${host}:${port}`);
    if (url.pathname === '/api/comments' || url.pathname === '/api/comments.php') {
      if (request.method === 'GET') {
        const items = await readComments();
        const page = url.searchParams.get('page');
        return json(response, 200, page ? items.filter(item => item.page === page) : items);
      }
      if (request.method === 'POST') return await saveComment(request, response);
      return json(response, 405, {error:'Метод не поддерживается'});
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') return json(response, 405, {error:'Метод не поддерживается'});
    const pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const target = path.resolve(site, `.${pathname}`);
    if (!target.startsWith(site + path.sep)) return json(response, 403, {error:'Доступ запрещён'});
    const data = await fs.readFile(target);
    response.writeHead(200, {
      'Content-Type': mime[path.extname(target)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    response.end(request.method === 'HEAD' ? undefined : data);
  } catch (error) {
    json(response, error.code === 'ENOENT' ? 404 : 500, {error:'Страница не найдена'});
  }
});

server.listen(port, host, () => console.log(`Прототип: http://${host}:${port}/`));
