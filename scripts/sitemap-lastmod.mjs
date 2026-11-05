import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {plainText} from './page-seo.mjs';

export const algorithm = 'rendered-content-v1';
const origin = 'https://young-russia.ru';
const digest = value => createHash('sha256').update(value).digest('hex');
const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value;
const capture = (html, regex) => html.match(regex)?.[1] ?? '';
const clean = html => html.replace(/<!--[\s\S]*?-->/g, '').replace(/\sdata-v-[\da-f]+(?:="[^"]*")?/gi, '');
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(m => [m[1],m[2]]));

// Final rendered regions, not Nuxt payload, bundles, filesystem dates or build IDs.
function projection(html) {
  const head = html.split('</head>')[0];
  const metadata = [...head.matchAll(/<meta\b[^>]*>/g)].map(m => attrs(m[0]))
    .filter(a => a.name === 'description' || a.name === 'robots' || a.name?.startsWith('twitter:') || a.property?.startsWith('og:'))
    .map(a => [a.name ?? a.property, a.content ?? '']).sort((a,b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  const canonical = [...head.matchAll(/<link\b[^>]*>/g)].map(m => attrs(m[0])).find(a => a.rel === 'canonical')?.href;
  const title = capture(head, /<title>([\s\S]*?)<\/title>/);
  const main = capture(html, /<main\b[^>]*id="main"[^>]*>([\s\S]*?)<\/main>/);
  if (!canonical || !title || !main) throw Error('Expected a canonical rendered page with title and main');
  const schema = [...head.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
  return {title, canonical, metadata, schema,
    header: clean(capture(html, /(<header\b[^>]*class="site-header"[^>]*>[\s\S]*?<\/header>)/)),
    main: clean(main), footer: clean(capture(html, /(<footer\b[^>]*class="site-footer"[^>]*>[\s\S]*?<\/footer>)/)),
  };
}
export const semanticFingerprint = html => digest(JSON.stringify(stable(projection(html))));
// A strict identity change may invalidate a date without proving a significant
// update. Frame/copyright/decorative markup alone never advances lastmod.
export function significantFingerprint(html) {
  const p=projection(html), main=p.main.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'');
  return digest(JSON.stringify(stable({title:plainText(p.title),canonical:p.canonical,metadata:p.metadata.map(([k,v])=>[k,plainText(v)]),schema:p.schema,
    text:plainText(main.replace(/<[^>]*>/g,' ')).replace(/©\s*\d{4}(?:-\d{4})?/g,'©'),
    links:[...main.matchAll(/<(a|img|source|iframe)\b[^>]*>/g)].map(m=>{const a=attrs(m[0]);return [m[1],...['href','src','srcset','alt'].map(k=>a[k]===undefined?null:plainText(a[k]))];}),
  })));
}

function validDate(date, asOf) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || new Date(date+'T00:00:00Z').toISOString().slice(0,10) !== date || date > asOf) throw Error('Invalid/future lastmod date: '+date);
}
function timestamp(value) {
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(value) || !Number.isFinite(Date.parse(value))) throw Error('Missing publication timestamp');
  validDate(value.slice(0,10),'9999-12-31');
  if (+value.slice(11,13)>23 || +value.slice(14,16)>59 || +value.slice(17,19)>59) throw Error('Invalid publication time');
  return new Date(value).toISOString();
}
function routeFile(url) {
  const parsed = new URL(url);
  if (parsed.origin !== origin || parsed.search || parsed.hash || /(?:^|\/)\.\.(?:\/|$)/.test(parsed.pathname)) throw Error('Invalid sitemap URL');
  const file=parsed.pathname === '/' ? 'index.html' : decodeURIComponent(parsed.pathname.slice(1));
  if (!file.endsWith('.html') || file.includes('\\') || file.includes(':') || file.split('/').includes('..') || file.startsWith('/')) throw Error('Unsafe/non-HTML route');
  return file;
}
export function latestPublished(ledger, asOf) {
  const now=new Date().toISOString(), today=asOf ?? now.slice(0,10), ceiling=asOf ? asOf+'T23:59:59.999Z' : now;
  if (ledger.version !== 1 || ledger.algorithm !== algorithm || !Array.isArray(ledger.events)) throw Error('Unsupported lastmod ledger');
  const latest = new Map(), releases = new Set(); let previousTime = '';
  for (const event of ledger.events) {
    if (!event.release || releases.has(event.release)) throw Error('Duplicate/missing release');
    releases.add(event.release);
    const time = timestamp(event.publishedAt);
    if (time > ceiling) throw Error('Future publication timestamp');
    if (previousTime && time < previousTime) throw Error('Nonchronological lastmod history');
    previousTime = time;
    validDate(event.date, today);
    if (event.date !== time.slice(0,10)) throw Error('Date must be the proven publication UTC day');
    for (const key of ['receiptSha256','beforeReceiptSha256','beforeManifestSha256','afterManifestSha256']) if (!/^[a-f0-9]{64}$/.test(event[key] ?? '')) throw Error('Missing evidence fingerprint');
    if (!event.receipt || !event.beforeReceipt || !Object.keys(event.changes ?? {}).length) throw Error('Missing changed-route evidence');
    for (const [url, change] of Object.entries(event.changes)) {
      routeFile(url);
      if (!/^[a-f0-9]{64}$/.test(change.before ?? '') || !/^[a-f0-9]{64}$/.test(change.after ?? '') || change.before === change.after) throw Error('Not a proven semantic change');
      if (!/^[a-f0-9]{64}$/.test(change.substantiveBefore ?? '') || !/^[a-f0-9]{64}$/.test(change.substantiveAfter ?? '') || change.substantiveBefore===change.substantiveAfter) throw Error('No significant change evidence');
      if (latest.has(url) && latest.get(url).hash !== change.before && latest.get(url).substantiveHash !== change.substantiveBefore) throw Error('Broken route revision chain');
      latest.set(url, {hash:change.after, substantiveHash:change.substantiveAfter, date:event.date, release:event.release});
    }
  }
  return latest;
}

export function addLastmod(xml, htmlByUrl, ledger, {asOf} = {}) {
  const records = latestPublished(ledger, asOf);
  const counts = {dated:0, unknown:0, mismatch:0};
  const sitemap = xml.replace(/<url>([\s\S]*?)<\/url>/g, (whole, content) => {
    const url = capture(content, /<loc>([^<]+)<\/loc>/); routeFile(url);
    const withoutDate = content.replace(/<lastmod>[^<]*<\/lastmod>/g, '');
    const record = records.get(url), html = htmlByUrl.get(url);
    if (!record) { counts.unknown++; return '<url>'+withoutDate+'</url>'; }
    if (!html || semanticFingerprint(html) !== record.hash) { counts.mismatch++; return '<url>'+withoutDate+'</url>'; }
    counts.dated++;
    return '<url>'+withoutDate.replace('</loc>', '</loc><lastmod>'+record.date+'</lastmod>')+'</url>';
  });
  return {xml:sitemap, ...counts};
}

export function appendPublication(ledger, event, options) {
  const existing = ledger.events.find(item => item.release === event.release);
  if (existing) {
    if (JSON.stringify(stable(existing)) !== JSON.stringify(stable(event))) throw Error('Cannot rewrite a published release');
    return ledger;
  }
  const result = {...ledger, events:[...ledger.events, event]}; latestPublished(result, options?.asOf); return result;
}

export async function applyToSite(site, ledgerFile, options) {
  const ledger = JSON.parse(await fs.readFile(ledgerFile,'utf8'));
  const xmlFile = path.join(site,'sitemap.xml'), xml = await fs.readFile(xmlFile,'utf8');
  const pages = new Map();
  for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) pages.set(match[1], await fs.readFile(path.join(site,routeFile(match[1])),'utf8'));
  const result = addLastmod(xml,pages,ledger,options); await fs.writeFile(xmlFile,result.xml);
  return {dated:result.dated, unknown:result.unknown, mismatch:result.mismatch};
}

// Explicit publication recorder. Both snapshots must match their published raw
// manifests, and the after-manifest must be pinned by a successful receipt.
export async function recordPublication(args) {
  const read = file => fs.readFile(file,'utf8');
  if (!args.beforeReceipt) throw Error('Missing previous publication receipt');
  const [ledgerText,beforeText,afterText,receiptText,beforeReceiptText] = await Promise.all([read(args.ledger),read(args.beforeManifest),read(args.afterManifest),read(args.receipt),read(args.beforeReceipt)]);
  const ledger=JSON.parse(ledgerText), before=JSON.parse(beforeText), after=JSON.parse(afterText), receipt=JSON.parse(receiptText), beforeReceipt=JSON.parse(beforeReceiptText);
  function verifyReceipt(r,m,text) {
    const legacy=r.status==='complete' && r.cleanup?.status==='PASS' && r.finalServerVerification?.finalFilesVerified===Object.keys(m.manifest ?? {}).length;
    if ((!['PRODUCTION_GO','PRODUCTION_ACCEPTED'].includes(r.status) && !legacy) || r.release!==m.release) throw Error('No successful matching publication receipt');
    if ((r.manifestFileSha256 ?? r.finalManifestFileSha256 ?? (legacy?r.cleanup.manifest?.sha256:null))!==digest(text)) throw Error('Receipt does not pin this published manifest');
  }
  verifyReceipt(beforeReceipt,before,beforeText); verifyReceipt(receipt,after,afterText);
  const publishedAt=receipt.activationUtc ?? receipt.activation?.at_utc;
  const beforeTime=timestamp(beforeReceipt.activationUtc ?? beforeReceipt.activation?.at_utc ?? beforeReceipt.deployedAtUtc);
  if (beforeTime>timestamp(publishedAt)) throw Error('Previous publication is newer than this publication');
  const beforeFiles=before.files ?? before.manifest, afterFiles=after.files;
  const urls=args.routes ?? Object.keys(afterFiles).filter(p=>p.endsWith('.html')&&!['200.html','404.html'].includes(p)).map(p=>origin+'/'+(p==='index.html'?'':p));
  const changes={};
  for (const url of urls) {
    const file=routeFile(url); if (!beforeFiles[file] || !afterFiles[file]) continue; // first observation is not an update date
    const [oldHtml,newHtml]=await Promise.all([read(path.join(args.beforeSite,file)),read(path.join(args.afterSite,file))]);
    if (digest(oldHtml)!==beforeFiles[file] || digest(newHtml)!==afterFiles[file]) throw Error('Snapshot differs from published manifest: '+file);
    const oldHash=semanticFingerprint(oldHtml), newHash=semanticFingerprint(newHtml), oldSignificant=significantFingerprint(oldHtml), newSignificant=significantFingerprint(newHtml);
    if (oldHash!==newHash && oldSignificant!==newSignificant) changes[url]={before:oldHash,after:newHash,substantiveBefore:oldSignificant,substantiveAfter:newSignificant};
  }
  if (!Object.keys(changes).length) return ledger;
  return appendPublication(ledger,{release:after.release,publishedAt,date:new Date(publishedAt).toISOString().slice(0,10),receipt:args.receiptLabel ?? args.receipt,
    receiptSha256:digest(receiptText),beforeReceipt:args.beforeReceiptLabel ?? args.beforeReceipt,beforeReceiptSha256:digest(beforeReceiptText),beforeManifestSha256:digest(beforeText),afterManifestSha256:digest(afterText),changes});
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [command,...flags]=process.argv.slice(2), args={};
  for(let i=0;i<flags.length;i+=2) args[flags[i].replace(/^--/,'').replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=flags[i+1];
  if(command==='apply') console.log(await applyToSite(path.resolve(args.site),path.resolve(args.ledger)));
  else if(command==='record') {
    for(const key of ['ledger','beforeManifest','afterManifest','beforeReceipt','receipt','beforeSite','afterSite','out']) if(!args[key]) throw Error('Missing --'+key);
    const result=await recordPublication(args); await fs.writeFile(args.out,JSON.stringify(result,null,2)+'\n');
  } else throw Error('Use apply --site DIR --ledger FILE, or record with explicit published snapshots/manifests/receipt');
}
