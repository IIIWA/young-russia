import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const legacyDir = path.join(root, '.data', 'legacy');
const contentDir = path.join(root, 'app', 'content');
const pagesDir = path.join(contentDir, 'pages');
const publicDir = path.join(root, 'public');

async function* htmlFiles(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const filename = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(filename);
    else if (entry.name.endsWith('.html')) yield filename;
  }
}

function required(markup, expression, filename) {
  const match = markup.match(expression);
  if (!match) throw new Error(`Cannot read ${expression} from ${filename}`);
  return match[1];
}

await fs.rm(legacyDir, { recursive: true, force: true });
process.env.SITE_OUTPUT_DIR = legacyDir;
await import('../build-site.mjs');
await fs.rm(contentDir, { recursive: true, force: true });
await fs.mkdir(pagesDir, { recursive: true });
await fs.mkdir(publicDir, { recursive: true });
const routes = [];

for await (const filename of htmlFiles(legacyDir)) {
  const relative = path.relative(legacyDir, filename).replaceAll(path.sep, '/');
  const markup = await fs.readFile(filename, 'utf8');
  const page = {
    title: required(markup, /<title>(.*?)<\/title>/, filename),
    description: required(markup, /<meta name="description" content="([^"]*)">/, filename),
    className: required(markup, /<body class="([^"]*)">/, filename),
    header: required(markup, /(<header class="site-header">[\s\S]*?<\/header>)/, filename),
    body: required(markup, /<main id="main">([\s\S]*?)<\/main>/, filename),
    footer: required(markup, /(<footer class="site-footer">[\s\S]*?<\/footer>)/, filename),
    stylesheet: required(markup, /<link rel="stylesheet" href="(?:\.\.\/)*assets\/([^"]+)">/, filename),
    script: required(markup, /<script src="(?:\.\.\/)*assets\/([^"]+)" defer><\/script>/, filename),
    hero: markup.match(/<link rel="preload" as="image" href="(?:\.\.\/)*assets\/([^"]+)"[^>]*>/)?.[1] ?? null,
  };
  const target = path.join(pagesDir, `${relative}.json`);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, JSON.stringify(page));
  routes.push(relative === 'index.html' ? '/' : `/${relative}`);
}

await fs.writeFile(path.join(contentDir, 'routes.json'), JSON.stringify(routes.sort(), null, 2));
await fs.cp(path.join(legacyDir, 'assets'), path.join(publicDir, 'assets'), { recursive: true, force: true });
for (const name of ['robots.txt', 'sitemap.xml']) {
  await fs.copyFile(path.join(legacyDir, name), path.join(publicDir, name));
}
console.log(`Prepared ${routes.length} Nuxt routes from the catalog source.`);
