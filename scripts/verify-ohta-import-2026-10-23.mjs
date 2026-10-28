import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const read=async f=>JSON.parse(await fs.readFile(f,'utf8'));
const source=await read('data/research/ohta-structured-source-2026-10-23.json'),tx=await read('data/research/ohta-schedule-transcription-2026-10-23.json'),review=await read('data/research/krasnogvardeysky-import-review-2026-10-23.json'),clubs=await read('data/clubs-krasnogvardeysky.json');
const expected=[];for(const p of source.schedules)for(const d of p.days)for(const [ri,room]of d.sections.entries())for(const [li,line]of room.lines.entries())for(const m of line.matchAll(/(\d{1,2})[.:](\d{2})\s*[-–—−‑]\s*(\d{1,2})[.:](\d{2})/g))expected.push(`${p.url}|${d.day.toLowerCase()}|${ri}|${li}|${m[1].padStart(2,'0')}:${m[2]}-${m[3].padStart(2,'0')}:${m[4]}`);
assert.deepEqual(tx.rows.map(r=>`${r.sourceUrl}|${r.day}|${r.roomIndex}|${r.lineIndex}|${r.time}`).sort(),expected.sort());
assert.equal(tx.rows.length,review.publishedRows.length+review.excludedRows.length+review.unmappedRows.length);
assert.equal(clubs.length,22);assert.equal(source.schedules.length,21);assert.equal(clubs.find(c=>c.name==='Вега').activities.length,0);
assert(!clubs.flatMap(c=>c.activitySchedule).some(a=>/х\s*[/\\]\s*р/iu.test(a.activity)));
assert(!clubs.find(c=>c.name==='Родник').activities.some(a=>/чирлидинг/iu.test(a)));
const freeAlsoPaid=['настольного тенниса','скалолазания','художественной гимнастики'];for(const label of freeAlsoPaid)assert(clubs.find(c=>c.name==='Метеор').activitySchedule.some(a=>a.activity.includes(label)));
const english=clubs.find(c=>c.name==='Тепло').activitySchedule.find(a=>/Овсянка/.test(a.activity));assert(english);assert.equal(english.schedule.length,9);assert.deepEqual([...new Set(english.schedule.map(s=>s.group))].sort(),['Группа "Болтуны"','Группа "Мечтатели"','Группа "Смельчаки"'].sort());
let slots=0;for(const c of clubs)for(const a of c.activitySchedule){assert(c.activities.includes(a.activity));assert(a.freeProfile);for(const s of a.schedule){slots++;assert(tx.rows.some(r=>r.sourceUrl===a.sourceUrl&&r.day===s.day&&r.time===s.time&&r.room===s.room&&r.group===(s.group??'')));}}
const coords=await read('data/club-coordinates.json'),point=coords.addresses.find(a=>a.id==='17b607645fdb');assert.equal(point.coordinates.latitude,59.936537);assert.equal(point.coordinates.longitude,30.499081);
const result={checkedAt:'2026-10-23',clubs:clubs.length,schedulePages:source.schedules.length,dayTabs:source.schedules.reduce((n,p)=>n+p.days.length,0),roomSections:source.schedules.reduce((n,p)=>n+p.days.reduce((m,d)=>m+d.sections.length,0),0),sourceIntervals:expected.length,publicSchedules:clubs.reduce((n,c)=>n+c.activitySchedule.length,0),publicSlots:slots,publishedSourceRows:review.publishedRows.length,explicitPaidRows:review.excludedRows.length,pendingRows:review.unmappedRows.length,englishNamedGroupsChecked:3,coordinatePreserved:true};
await fs.writeFile('docs/ohta-import-check-2026-10-23.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
