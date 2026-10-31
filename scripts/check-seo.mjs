import fs from 'node:fs/promises';
import path from 'node:path';
import { canonicalUrl, plainText } from './page-seo.mjs';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
const routes = JSON.parse(await fs.readFile(path.join(root, 'app/content/routes.json'), 'utf8'));
const errors = [];
const titles = new Map(), descriptions = new Map();
let breadcrumbs = 0, webPages = 0, webSites = 0;
for (const route of routes) {
  const markup = await fs.readFile(path.join(dist, route === '/' ? 'index.html' : route.slice(1)), 'utf8');
  const head = markup.split('</head>')[0];
  const expected = canonicalUrl(route);
  const links = [...head.matchAll(/<link\b[^>]*rel="canonical"[^>]*>/g)];
  if (links.length !== 1 || links[0][0].match(/href="([^"]+)"/)?.[1] !== expected) errors.push(`${route}: incorrect canonical`);
  if (/<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex/.test(head)) errors.push(`${route}: indexable route has noindex`);
  const metadata = (key, attribute = 'property') => head.match(new RegExp(`<meta\\b[^>]*${attribute}="${key}"[^>]*content="([^"]*)"`))?.[1];
  if (metadata('og:url') !== expected) errors.push(`${route}: incorrect Open Graph URL`);
  for (const key of ['og:title', 'og:description', 'og:image']) if (!metadata(key)) errors.push(`${route}: missing ${key}`);
  if (metadata('twitter:card', 'name') !== 'summary_large_image') errors.push(`${route}: missing social preview card`);
  try {
    const image = new URL(metadata('og:image'));
    if (image.origin !== 'https://young-russia.ru' || !image.pathname.startsWith('/assets/')) throw new Error('invalid image URL');
    await fs.access(path.join(dist, decodeURIComponent(image.pathname)));
  } catch { errors.push(`${route}: missing or invalid social preview image`); }
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
  if (scripts.length !== 1) errors.push(`${route}: expected one JSON-LD graph`);
  for (const script of scripts) {
    try {
      const data = JSON.parse(script[1]);
      if (data['@context'] !== 'https://schema.org' || !Array.isArray(data['@graph'])) throw new Error('invalid graph');
      const graph = data['@graph'];
      const pageNodes = graph.filter(item => item['@type'] === 'WebPage');
      if (pageNodes.length !== 1) throw new Error('expected one WebPage');
      const pageNode = pageNodes[0];
      if (pageNode['@id'] !== expected+'#webpage' || pageNode.url !== expected || pageNode.inLanguage !== 'ru' || pageNode.isPartOf?.['@id'] !== 'https://young-russia.ru/#website') throw new Error('invalid WebPage identity');
      if (pageNode.name !== plainText(head.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '') || pageNode.description !== plainText(metadata('description', 'name') ?? '')) throw new Error('WebPage metadata differs from HTML');
      const visibleDate = markup.match(/<p class="guide-meta">[^<]*<time datetime="(\d{4}-\d{2}-\d{2})"/)?.[1];
      if (pageNode.dateModified !== visibleDate) throw new Error('WebPage date differs from visible guide date');
      webPages++;
      const sites = graph.filter(item => item['@type'] === 'WebSite');
      if (sites.length !== (route === '/' ? 1 : 0)) throw new Error('unexpected WebSite count');
      if (route === '/') {
        const site = sites[0];
        if (site['@id'] !== 'https://young-russia.ru/#website' || site.url !== 'https://young-russia.ru/' || site.name !== 'ПМК Петербурга' || site.alternateName !== 'young-russia.ru') throw new Error('invalid WebSite identity');
        webSites++;
      }
      const lists = graph.filter(item => item['@type'] === 'BreadcrumbList');
      if (lists.length !== (route === '/' ? 0 : 1)) throw new Error('unexpected BreadcrumbList count');
      if (route === '/') continue;
      const list = lists[0];
      if (list['@id'] !== expected+'#breadcrumb' || pageNode.breadcrumb?.['@id'] !== list['@id'] || list.itemListElement.length < 2) throw new Error('invalid breadcrumb relationship');
      list.itemListElement.forEach((item, index) => {
        if (item.position !== index + 1 || !item.name || !item.item.startsWith('https://young-russia.ru/')) throw new Error('invalid item');
      });
      if (list.itemListElement.at(-1).item !== expected) throw new Error('incorrect final URL');
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
else console.log(`SEO checked: ${routes.length} canonical URLs, unique titles/descriptions, ${breadcrumbs} BreadcrumbList, ${webPages} WebPage, ${webSites} WebSite, social previews, sitemap and noindex fallbacks.`);
