import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const prototypeRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'prototype', 'site');
const files = [];
async function walk(dir) {
  for (const entry of await fs.readdir(dir,{withFileTypes:true})) {
    const full = path.join(dir,entry.name);
    if (entry.isDirectory()) await walk(full);
    else files.push(full);
  }
}
await walk(root);
const htmlFiles = files.filter(file=>file.endsWith('.html'));
const prototypeFiles = new Set();
async function walkPrototype(dir) {
  for (const entry of await fs.readdir(dir,{withFileTypes:true})) {
    const full = path.join(dir,entry.name);
    if (entry.isDirectory()) await walkPrototype(full);
    else if (entry.isFile() && full.endsWith('.html')) prototypeFiles.add(path.relative(prototypeRoot,full).replaceAll(path.sep,'/'));
  }
}
await walkPrototype(prototypeRoot);
const missing = [];
const missingPrototypes = [];
// Only the existing root-level Saint Petersburg district and club routes skip prototype parity.
// Pages for future cities must live under city-specific routes and retain prototypes.
const saintPetersburgPrototypeOptional = route =>
  (/^districts\/[^/]+\.html$/.test(route) && route !== 'districts/index.html') ||
  /^clubs\/[^/]+\/[^/]+\.html$/.test(route);
for (const file of htmlFiles) {
  const route = path.relative(root,file).replaceAll(path.sep,'/');
  if (!saintPetersburgPrototypeOptional(route) && !prototypeFiles.has(route)) missingPrototypes.push(route);
  const markup = await fs.readFile(file,'utf8');
  for (const match of markup.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const target = match[1];
    if (/^(https?:|mailto:|tel:|#)/.test(target)) continue;
    const pathname = decodeURIComponent(target.split(/[?#]/,1)[0]);
    if (!pathname) continue;
    const resolved = path.resolve(path.dirname(file),pathname);
    if (!resolved.startsWith(root+path.sep) || !files.includes(resolved)) missing.push(`${path.relative(root,file)} -> ${target}`);
  }
}
if (!htmlFiles.length || missing.length || missingPrototypes.length) {
  console.error(`HTML pages: ${htmlFiles.length}; missing local links: ${missing.length}; missing prototype routes: ${missingPrototypes.length}`);
  missing.forEach(item=>console.error(item));
  missingPrototypes.forEach(item=>console.error(`No saved prototype for ${item}`));
  process.exitCode=1;
} else console.log(`Checked ${htmlFiles.length} HTML pages: local links resolve and required prototype routes are saved.`);
