import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {algorithm,semanticFingerprint as hash,significantFingerprint as significant,appendPublication,addLastmod,recordPublication,applyToSite} from './sitemap-lastmod.mjs';
const sha=s=>createHash('sha256').update(s).digest('hex');
const url='https://young-russia.ru/a.html', second='https://young-russia.ru/b.html';
const page=(text='one',footer='© 2025',runtime='first')=>`<html><head><title>A</title><meta name="description" content="D"><link rel="canonical" href="${url}"><script type="application/ld+json">{"@type":"WebPage","name":"A"}</script><link rel="modulepreload" href="/_nuxt/${runtime}.js"></head><body><header class="site-header">Menu</header><main id="main"><h1>A</h1><p>${text}</p><a href="/join.html">Join</a></main><footer class="site-footer">${footer}</footer><script id="__NUXT_DATA__">{"buildId":"${runtime}","prerenderedAt":123}</script></body></html>`;
const old=page('zero'), current=page();
const event=(release,date,before,after,route=url)=>({release,date,publishedAt:date+'T10:00:00Z',receipt:'receipt.json',beforeReceipt:'before-receipt.json',beforeReceiptSha256:'d'.repeat(64),receiptSha256:'a'.repeat(64),beforeManifestSha256:'b'.repeat(64),afterManifestSha256:'c'.repeat(64),changes:{[route]:{before:hash(before),after:hash(after),substantiveBefore:significant(before),substantiveAfter:significant(after)}}});
const empty=()=>({version:1,algorithm,events:[]});
const ledger=()=>appendPublication(empty(),event('r1','2026-10-01',old,current));
const xml=`<?xml version="1.0"?><urlset><url><loc>${url}</loc><priority>0.8</priority></url><url><loc>${second}</loc></url></urlset>`;
test('same inputs and repeated sitemap application retain exact dates/order/other fields',()=>{
 const pages=new Map([[url,current],[second,current]]), first=addLastmod(xml,pages,ledger());
 assert.deepEqual({dated:first.dated,unknown:first.unknown,mismatch:first.mismatch},{dated:1,unknown:1,mismatch:0});
 assert.equal(addLastmod(first.xml,pages,ledger()).xml,first.xml);
 assert.equal(first.xml.replace('<lastmod>2026-10-01</lastmod>',''),xml);
});
test('Nuxt bundle/buildId/prerender changes, comments and scoped attrs do not change identity or date',()=>{
 const churn=page('one','© 2025','new').replace('<p>','<!--nuxt--><p data-v-0123abcd>');
 assert.equal(hash(churn),hash(current));assert.equal(addLastmod(xml,new Map([[url,churn]]),ledger()).dated,1);
});
test('unpublished main text, metadata, structured data or link changes omit only that route',()=>{
 const two=appendPublication(ledger(),event('r2','2026-10-02',old,current,second));
 for(const changed of [page('two'),current.replace('content="D"','content="E"'),current.replace('"name":"A"','"name":"B"'),current.replace('/join.html','/other.html')]){
  const result=addLastmod(xml,new Map([[url,changed],[second,current]]),two);
  assert.equal(result.dated,1);assert.equal(result.mismatch,1);assert.match(result.xml,new RegExp(`<loc>${second}</loc><lastmod>2026-10-02`));
 }
});
test('a proved substantive publication updates only the changed route',()=>{
 const next=appendPublication(ledger(),event('r3','2026-10-03',current,page('two')));
 const result=addLastmod(xml,new Map([[url,page('two')]]),next);
 assert.match(result.xml,/<lastmod>2026-10-03<\/lastmod>/);assert.equal(result.dated,1);
});
test('unknown route loses stale supplied lastmod instead of receiving a build date',()=>{
 const input=xml.replace(`<loc>${second}</loc>`,`<loc>${second}</loc><lastmod>2026-01-01</lastmod>`);
 assert.equal(addLastmod(input,new Map([[url,current]]),ledger()).xml,addLastmod(xml,new Map([[url,current]]),ledger()).xml);
});
test('future/invalid date, rewritten release, unchanged-significance and broken revision chains fail closed',()=>{
 for(const date of ['2099-01-01','2026-02-30'])assert.throws(()=>appendPublication(empty(),event('future',date,old,current)));
 assert.throws(()=>appendPublication(ledger(),event('r1','2026-10-02',old,page('two'))));
 assert.throws(()=>appendPublication(ledger(),event('r4','2026-10-02',old,page('two'))));
 assert.throws(()=>appendPublication(ledger(),event('decorative','2026-10-02',current,page('one','© 2026'))));
});
test('footer copyright and decorative class are identity-only, never significance or automatic newer date',()=>{
 for(const changed of [page('one','© 2026'),current.replace('<p>','<p class="new-style">')]){
  assert.notEqual(hash(changed),hash(current));assert.equal(significant(changed),significant(current));
  const result=addLastmod(xml,new Map([[url,changed]]),ledger());assert.equal(result.dated,0);assert.equal(result.mismatch,1);
 }
});

async function fixture(t,before,after){
 const tempRoot=await fs.realpath(os.tmpdir()), dir=await fs.mkdtemp(path.join(tempRoot,'lastmod-test-'));
 t.after(async()=>{const target=await fs.realpath(dir);assert.equal(path.dirname(target),tempRoot);assert.ok(path.basename(target).startsWith('lastmod-test-'));await fs.rm(target,{recursive:true,force:true});});
 for(const [name,body] of [['before',before],['after',after]]){await fs.mkdir(path.join(dir,name));await fs.writeFile(path.join(dir,name,'a.html'),body);}
 const beforeManifest=path.join(dir,'before.json'),afterManifest=path.join(dir,'after.json'),receipt=path.join(dir,'receipt.json'),beforeReceipt=path.join(dir,'before-receipt.json'),history=path.join(dir,'history.json');
 const beforeText=JSON.stringify({release:'old',files:{'a.html':sha(before)}});await fs.writeFile(beforeManifest,beforeText);
 await fs.writeFile(beforeReceipt,JSON.stringify({status:'PRODUCTION_ACCEPTED',release:'old',activationUtc:'2026-10-01T12:00:00Z',manifestFileSha256:sha(beforeText)}));
 const afterText=JSON.stringify({release:'published',files:{'a.html':sha(after)}});await fs.writeFile(afterManifest,afterText);
 await fs.writeFile(receipt,JSON.stringify({status:'PRODUCTION_ACCEPTED',release:'published',activationUtc:'2026-10-03T12:00:00Z',manifestFileSha256:sha(afterText)}));
 await fs.writeFile(history,JSON.stringify(empty()));
 return {ledger:history,beforeManifest,afterManifest,beforeReceipt,receipt,beforeSite:path.join(dir,'before'),afterSite:path.join(dir,'after'),routes:[url]};
}
test('publication recorder uses pinned published bytes, not filesystem mtimes or first observation',async t=>{
 const args=await fixture(t,current,page('two'));await fs.utimes(path.join(args.afterSite,'a.html'),0,0);
 const result=await recordPublication(args);assert.equal(result.events[0].date,'2026-10-03');
 const before=JSON.parse(await fs.readFile(args.beforeManifest));before.files={};const text=JSON.stringify(before);await fs.writeFile(args.beforeManifest,text);
 const proof=JSON.parse(await fs.readFile(args.beforeReceipt));proof.manifestFileSha256=sha(text);await fs.writeFile(args.beforeReceipt,JSON.stringify(proof));
 assert.equal((await recordPublication(args)).events.length,0);
});
test('draft HTML with an old successful receipt cannot forge a publication date',async t=>{
 const args=await fixture(t,current,page('two'));await fs.writeFile(path.join(args.afterSite,'a.html'),page('draft'));
 await assert.rejects(recordPublication(args),/Snapshot differs/);
});
test('wrong after-manifest pin is rejected',async t=>{
 const args=await fixture(t,current,page('two'));const receipt=JSON.parse(await fs.readFile(args.receipt));receipt.manifestFileSha256='0'.repeat(64);await fs.writeFile(args.receipt,JSON.stringify(receipt));
 await assert.rejects(recordPublication(args),/does not pin/);
});
test('recorder skips runtime/copyright/frame-only published churn',async t=>{
 for(const html of [page('one','© 2025','new'),page('one','© 2026')])assert.equal((await recordPublication(await fixture(t,current,html))).events.length,0);
});
test('a later real update can follow an omitted frame-only publication without inventing an intermediate date',async t=>{
 const args=await fixture(t,page('one','© 2026'),page('two','© 2026'));
 await fs.writeFile(args.ledger,JSON.stringify(ledger()));
 const next=await recordPublication(args);
 assert.equal(next.events.length,2);assert.equal(next.events[1].date,'2026-10-03');
 assert.equal(addLastmod(xml,new Map([[url,page('two','© 2026')]]),next).dated,1);
});
test('same publisher seam applies sitemap only and preserves HTML bytes',async t=>{
 const args=await fixture(t,old,current), snapshot=await recordPublication(args);await fs.writeFile(args.ledger,JSON.stringify(snapshot));
 const sitemap=xml.replace(`<url><loc>${second}</loc></url>`,'');await fs.writeFile(path.join(args.afterSite,'sitemap.xml'),sitemap);
 const result=await applyToSite(args.afterSite,args.ledger);assert.equal(result.dated,1);assert.equal(await fs.readFile(path.join(args.afterSite,'a.html'),'utf8'),current);
 assert.equal((await applyToSite(args.afterSite,args.ledger)).dated,1);
});
test('unpublished before snapshot cannot seed a new date using a genuine after receipt',async t=>{
 const args=await fixture(t,current,page('two'));const before=JSON.parse(await fs.readFile(args.beforeManifest));before.release='UNPUBLISHED_DRAFT';await fs.writeFile(args.beforeManifest,JSON.stringify(before));
 await assert.rejects(recordPublication(args),/matching publication receipt/);
 await assert.rejects(recordPublication({...args,beforeReceipt:undefined}),/previous publication receipt/);
});
test('equivalent HTML entity serialization does not qualify as significant change',()=>{
 const a=page('one&nbsp;two'),b=page('one\u00a0two'),c=page('one&#160;two');
 assert.notEqual(hash(a),hash(b));assert.equal(significant(a),significant(b));assert.equal(significant(a),significant(c));
});
test('impossible publication timestamp cannot silently normalize into another date',()=>{
 const bad=event('invalid-time','2026-03-02',old,current);bad.publishedAt='2026-02-30T10:00:00Z';
 assert.throws(()=>appendPublication(empty(),bad));
});
