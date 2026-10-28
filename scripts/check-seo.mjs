import fs from 'node:fs/promises';
import path from 'node:path';
import { canonicalUrl, plainText } from './page-seo.mjs';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
const routes = JSON.parse(await fs.readFile(path.join(root, 'app/content/routes.json'), 'utf8'));
const errors = [];
const titles = new Map(), descriptions = new Map();
let breadcrumbs = 0;
for (const route of routes) {
  const markup = await fs.readFile(path.join(dist, route === '/' ? 'index.html' : route.slice(1)), 'utf8');
  const head = markup.split('</head>')[0];
  const expected = canonicalUrl(route);
  const links = [...head.matchAll(/<link\b[^>]*rel="canonical"[^>]*>/g)];
  if (links.length !== 1 || links[0][0].match(/href="([^"]+)"/)?.[1] !== expected) errors.push(`${route}: incorrect canonical`);
  if (/<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex/.test(head)) errors.push(`${route}: indexable route has noindex`);
  for (const [map, value, label] of [
    [titles, head.match(/<title>([\s\S]*?)<\/title>/)?.[1], 'title'],
    [descriptions, head.match(/<meta\b[^>]*name="description"[^>]*content="([^"]*)"/)?.[1], 'description'],
  ]) {
    const text = plainText(value ?? '');
    if (!text) errors.push(`${route}: empty ${label}`);
    else if (map.has(text)) errors.push(`${route}: duplicate ${label} with ${map.get(text)}`);
    else map.set(text, route);
  }
  const scripts = [...head.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  if (route !== '/' && scripts.length !== 1) errors.push(`${route}: missing BreadcrumbList`);
  for (const script of scripts) {
    try {
      const data = JSON.parse(script[1]);
      if (data['@type'] !== 'BreadcrumbList' || data.itemListElement.length < 2) throw new Error('invalid list');
      data.itemListElement.forEach((item, index) => {
        if (item.position !== index + 1 || !item.name || !item.item.startsWith('https://young-russia.ru/')) throw new Error('invalid item');
      });
      if (data.itemListElement.at(-1).item !== expected) throw new Error('incorrect final URL');
      breadcrumbs++;
    } catch (error) { errors.push(`${route}: ${error.message}`); }
  }
}
const xml = await fs.readFile(path.join(dist, 'sitemap.xml'), 'utf8');
const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
const expectedUrls = new Set(routes.map(route => canonicalUrl(route)));
if (urls.length !== expectedUrls.size || new Set(urls).size !== urls.length || urls.some(url => !expectedUrls.has(url))) errors.push('Sitemap and canonical routes differ');
for (const fallback of ['200.html', '404.html']) {
  const html = await fs.readFile(path.join(dist, fallback), 'utf8');
  if (!/<meta\b[^>]*name="robots"[^>]*content="noindex,nofollow"/.test(html)) errors.push(`${fallback}: missing noindex`);
}
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`SEO checked: ${routes.length} canonical URLs, unique titles/descriptions, ${breadcrumbs} BreadcrumbList pages, sitemap and noindex fallbacks.`);
