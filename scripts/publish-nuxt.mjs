import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const generated = path.join(root, '.output', 'public');
const dist = path.join(root, 'dist');
const routes = JSON.parse(await fs.readFile(path.join(root, 'app', 'content', 'routes.json'), 'utf8'));

const nuxtAssets = path.resolve(dist, '_nuxt');
if (path.relative(root, nuxtAssets).replaceAll(path.sep, '/') !== 'dist/_nuxt') {
  throw new Error('Unexpected Nuxt asset path');
}
await fs.rm(nuxtAssets, { recursive: true, force: true });
await fs.rm(path.join(dist, '_payload.json'), { force: true });
// fs.cp unlinks existing targets first. Windows readers can temporarily deny
// deletion, so overwrite each file directly and retry transient sharing locks.
async function copyGenerated(source, target) {
  await fs.mkdir(target, {recursive:true});
  for (const entry of await fs.readdir(source, {withFileTypes:true})) {
    const from = path.join(source, entry.name);
    const to = path.join(target, entry.name);
    if (entry.isDirectory()) {
      await copyGenerated(from, to);
    } else {
      for (let attempt = 0; ; attempt++) {
        try {
          await fs.copyFile(from, to);
          break;
        } catch (error) {
          if (!['EBUSY', 'EPERM'].includes(error.code) || attempt >= 5) throw error;
          await new Promise(resolve => setTimeout(resolve, 100 * 2 ** attempt));
        }
      }
    }
  }
}
await copyGenerated(generated, dist);
for (const route of routes) {
  const relative = route === '/' ? 'index.html' : route.slice(1);
  const target = path.join(dist, relative);
  let markup;
  try {
    markup = await fs.readFile(target, 'utf8');
  } catch {
    const nested = path.join(generated, relative, 'index.html');
    markup = await fs.readFile(nested, 'utf8');
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, markup);
  }
  if (!markup.includes('data-v-app') && !markup.includes('id="__nuxt"')) {
    throw new Error(`Nuxt did not generate ${route}`);
  }
}
console.log(`Published ${routes.length} Nuxt pages to ${dist}.`);
