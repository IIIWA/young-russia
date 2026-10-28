import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {slugify,activityPageSlug} from './activity-page-routes.mjs';
const read=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const source=await read('data/research/kurortny-schedule-transcription-2026-10-24.json'),clubs=await read('data/clubs-kurortny.json'),before=await read('data/research/kurortny-catalog-before-2026-10-24.json');
const norm=s=>s.toLowerCase().replaceAll('ё','е').replace(/[^а-яa-z0-9]/g,'');
const clock=s=>[...s.matchAll(/(\d{1,2}):(\d{2})\s*[-–—]\s*(\d{1,2}):(\d{2})/g)].map(m=>`${m[1].padStart(2,'0')}:${m[2]}-${m[3].padStart(2,'0')}:${m[4]}`);
const native=source.molodostHtmlTables[0],grid=[];
for(let y=0;y<native.rows.length;y++){
 grid[y]??=[];let x=0;
 for(const c of native.rows[y]){while(grid[y][x]!==undefined)x++;for(let dy=0;dy<c.rowspan;dy++){grid[y+dy]??=[];for(let dx=0;dx<c.colspan;dx++)grid[y+dy][x+dx]=c.text;}x+=c.colspan;}
}
let title='';const htmlTuples=[];
for(const cells of grid.slice(2,native.rows.length)){if((cells[0]??'').trim())title=cells[0].trim()==='13'?'Студия «Город мастеров»':cells[1];for(let day=0;day<7;day++)for(const time of clock(cells[5+day]??''))htmlTuples.push([norm(title),day,time].join('|'));}
const days=['понедельник','вторник','среда','четверг','пятница','суббота','воскресенье'];
const docxTuples=source.rows.filter(r=>r.center==='molodost').flatMap(r=>r.slots.map(s=>[norm(r.activity),days.indexOf(s.day),s.time].join('|')));
assert.deepEqual(htmlTuples.sort(),docxTuples.sort(),'HTML / DOCX time correspondence');
let stableRoutes=0;
for(const old of before){const club=clubs.find(c=>c.name===old.name);assert(club);for(const a of old.activities){const oldSlug=activityPageSlug({...old,slug:slugify(old.name),districtCode:'kurortny'},a,old.activities.indexOf(a)),newSlug=activityPageSlug({...club,slug:slugify(club.name),districtCode:'kurortny'},a,club.activities.indexOf(a));assert.equal(oldSlug,newSlug);stableRoutes++;}}
const schedules=clubs.flatMap(c=>c.activitySchedule.map(a=>({...a,club:c.name}))),published=schedules.flatMap(a=>a.schedule.map(s=>[a.club,s.day,s.time].join('|'))).sort();
const freeRows=source.rows.filter(r=>r.kind==='regular'),sourceTuples=freeRows.flatMap(r=>r.slots.map(s=>[s.venue??r.venue,s.day,s.time].join('|'))).sort();
assert.deepEqual(published,sourceTuples);
assert(schedules.filter(s=>s.club==='Молодость').every(s=>s.seasonalStatus==='expired'&&s.effectiveTo==='2026-08-31'));
assert.equal(schedules.filter(s=>s.activity==='Бокс').length,2);
assert.deepEqual(schedules.find(s=>s.activity==='Бокс'&&s.club==='Снайпер: Ленина').schedule.map(s=>s.day),['суббота']);
assert(!clubs.some(c=>c.organization!=='sniper'&&c.activityPages.some(p=>p.vkUrl==='https://vk.ru/public216358389')));
const coord=await read('data/club-coordinates.json'),lenina=coord.addresses.find(a=>a.clubs.some(c=>c.name==='Снайпер: Ленина'));
assert.deepEqual(lenina.coordinates,{latitude:60.200765,longitude:29.70687});
const coordinateChecks=[];
for(const club of clubs){const oldHtml=await fs.readFile(`dist/clubs/kurortny/${slugify(club.name)}.html`,'utf8'),urls=[...oldHtml.matchAll(/<iframe\b[^>]*src="([^"]+)"/g)].map(m=>m[1].replaceAll('&amp;','&'));const c=coord.addresses.find(a=>a.clubs.some(r=>r.name===club.name));for(const point of c?.clubCoordinates??[]){const needle=[point.coordinates.longitude,point.coordinates.latitude].join(',');assert(urls.some(u=>decodeURIComponent(u).includes(needle)),club.name+' old map '+needle);coordinateChecks.push(club.name);}}
const out={checkedAt:'2026-10-24',clubs:clubs.length,activities:clubs.reduce((n,c)=>n+c.activities.length,0),schedules:schedules.length,slots:published.length,sourceIntervals:source.rows.reduce((n,r)=>n+r.slots.length,0),htmlDocxMatchingIntervals:docxTuples.length,stablePreviousRoutes:stableRoutes,coordinateChecks,paidAndFreeVariantsKeptSeparate:true,notes:source.notes};
await fs.writeFile('docs/kurortny-import-check-2026-10-24.json',JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out));
