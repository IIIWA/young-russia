import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {activityPageSlug,slugify} from './activity-page-routes.mjs';

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
async function copyFileWithRetry(from, to) {
  for (let attempt = 0; ; attempt++) {
    try {
      await fs.copyFile(from, to);
      return;
    } catch (error) {
      if (error.code === 'UNKNOWN') {
        const temporary = `${to}.copy-${process.pid}`;
        try {
          await fs.copyFile(from, temporary);
          await fs.rename(temporary, to);
          return;
        } catch (fallbackError) {
          // Rename can encounter the same transient Windows sharing lock.
          // Let it use the retry/backoff path below as well.
          error = fallbackError;
        } finally {
          await fs.rm(temporary, {force:true});
        }
      }
      if (!['EBUSY', 'EPERM'].includes(error.code) || attempt >= 5) throw error;
      await new Promise(resolve => setTimeout(resolve, 100 * 2 ** attempt));
    }
  }
}
async function copyGenerated(source, target) {
  await fs.mkdir(target, {recursive:true});
  for (const entry of await fs.readdir(source, {withFileTypes:true})) {
    const from = path.join(source, entry.name);
    const to = path.join(target, entry.name);
    if (entry.isDirectory()) {
      await copyGenerated(from, to);
    } else {
      await copyFileWithRetry(from, to);
    }
  }
}
await copyGenerated(generated, dist);
// A clean Windows generate can omit client assets from .output/public.
// Publish the freshly compiled client files explicitly as well.
await copyGenerated(path.join(root, '.nuxt', 'dist', 'client', '_nuxt'), nuxtAssets);
// Retired catalogue entries are kept in research data and prototype snapshots.
// Remove only their exact, verified generated files, never a directory tree.
const ohtaClubs=JSON.parse(await fs.readFile(path.join(root,'data','clubs-krasnogvardeysky.json'),'utf8'));
let retiredCount=0;
for(const club of ohtaClubs)for(const entry of club.archivedActivities??[]){
  const slug=activityPageSlug({...club,slug:slugify(club.name),districtCode:'krasnogvardeysky'},entry.activity,club.activityRouteIndices[entry.activity]);
  const relative=`activities/${slug}.html`;
  if(routes.includes('/'+relative))continue;
  const target=path.resolve(dist,relative);
  if(!slug.startsWith('krasnogvardeysky-')||path.relative(dist,target).replaceAll(path.sep,'/')!==relative)throw Error('Unexpected retired activity path');
  const backup=path.join(root,'outputs','retired-ohta-activity-pages-2026-10-23');await fs.mkdir(backup,{recursive:true});
  try{await fs.copyFile(target,path.join(backup,slug+'.html'),fs.constants.COPYFILE_EXCL);}catch(e){if(!['ENOENT','EEXIST'].includes(e.code))throw e;}
  await fs.rm(target,{force:true});retiredCount++;
}
console.log(`Retired ${retiredCount} superseded Ohta activity pages; research and prototype snapshots preserved.`);
const admiralClubs=JSON.parse(await fs.readFile(path.join(root,'data','clubs-admiralteysky.json'),'utf8'));
for(const club of admiralClubs.filter(c=>c.activityCatalogConfirmedAt==='2026-10-24'))for(const entry of club.archivedActivities??[]){
  const slug=activityPageSlug({...club,slug:slugify(club.name),districtCode:'admiralteysky'},entry.activity,0);
  const relative=`activities/${slug}.html`,target=path.resolve(dist,relative);
  if(!slug?.startsWith('admiralteets-')||routes.includes('/'+relative)||path.relative(dist,target).replaceAll(path.sep,'/')!==relative)throw Error('Unexpected closed Admiralteets activity route');
  const backup=path.join(root,'outputs','admiralteets-update-2026-10-24','retired-pages');await fs.mkdir(backup,{recursive:true});
  try{await fs.copyFile(target,path.join(backup,slug+'.html'),fs.constants.COPYFILE_EXCL);}catch(e){if(!['ENOENT','EEXIST'].includes(e.code))throw e;}
  await fs.rm(target,{force:true});
}
// Re-importing new programmes can change their suffix before the first release.
// Discard stale files from those intermediate builds as well.
for(const filename of await fs.readdir(path.join(dist,'activities'))){
  if(!filename.startsWith('krasnogvardeysky-')||!filename.endsWith('.html')||routes.includes('/activities/'+filename))continue;
  const target=path.resolve(dist,'activities',filename);
  if(path.relative(dist,target).replaceAll(path.sep,'/')!=='activities/'+filename)throw Error('Unexpected stale Ohta path');
  const backup=path.join(root,'outputs','retired-ohta-activity-pages-2026-10-23');await fs.mkdir(backup,{recursive:true});
  try{await fs.copyFile(target,path.join(backup,filename),fs.constants.COPYFILE_EXCL);}catch(e){if(e.code!=='EEXIST')throw e;}
  await fs.rm(target);
}
await copyFileWithRetry(path.join(root, 'public', '.htaccess'), path.join(dist, '.htaccess'));
// Existing HTML files can reject direct truncation with UNKNOWN on Windows.
// Copying a freshly written file avoids that error without deleting the target.
async function writeGenerated(filename, markup) {
  const temporary = `${filename}.tmp-${process.pid}`;
  try {
    await fs.writeFile(temporary, markup);
    await copyFileWithRetry(temporary, filename);
  } finally {
    await fs.rm(temporary, {force:true});
  }
}
for (const fallback of ['200.html', '404.html']) {
  const filename = path.join(dist, fallback);
  const markup = await fs.readFile(filename, 'utf8');
  await writeGenerated(filename, markup.replace('<head>', '<head><meta name="robots" content="noindex,nofollow">'));
}
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
  const normalized = markup.replace(/^[\t ]+$/gm, '');
  if (normalized !== markup) await writeGenerated(target, normalized);
}
console.log(`Published ${routes.length} Nuxt pages to ${dist}.`);
