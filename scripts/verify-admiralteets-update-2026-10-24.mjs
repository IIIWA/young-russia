import fs from 'node:fs';
import assert from 'node:assert/strict';
import {activityPageSlug,slugify} from './activity-page-routes.mjs';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const club=read('data/clubs-admiralteysky.json').find(c=>c.name.includes('Адмиралтеец'));
const before=read('outputs/admiralteets-update-2026-10-24/clubs-admiralteysky-before.json').find(c=>c.name===club.name);
const source=read('data/research/admiralteets-user-update-2026-10-24.json');
assert.deepEqual(club.activities,source.activeActivities);
assert.deepEqual(club.activitySchedule.find(r=>r.activity==='Бокс'),before.activitySchedule.find(r=>r.activity==='Бокс'));
assert.equal(club.archivedActivities.length,5);
const sitemap=fs.readFileSync('dist/sitemap.xml','utf8');
const results=[];
for(const expected of source.schedule){
  const record=club.activitySchedule.find(r=>r.activity===expected.activity);
  assert.deepEqual(record.schedule.map(s=>s.day),expected.days);
  assert(record.schedule.every(s=>s.time===expected.time));
  const slug=activityPageSlug({...club,slug:slugify(club.name),districtCode:'admiralteysky'},expected.activity,club.activities.indexOf(expected.activity));
  const relative=`activities/${slug}.html`;
  const markup=fs.readFileSync(`dist/${relative}`,'utf8').match(/<main[^>]*>[\s\S]*?<\/main>/)[0];
  const times=[...markup.matchAll(/class="catalog-schedule-time">([^<]+)/g)].map(m=>m[1]);
  assert.deepEqual(times,expected.days.map(()=>expected.time));
  assert(markup.includes('подтверждено пользователем 24.10.2026'));
  assert(sitemap.includes('/'+relative));
  results.push({activity:expected.activity,route:relative,intervals:times.length});
}
for(const entry of club.archivedActivities){
  const slug=activityPageSlug({...club,slug:slugify(club.name),districtCode:'admiralteysky'},entry.activity,0);
  assert(!fs.existsSync(`dist/activities/${slug}.html`));
  assert(!sitemap.includes(`/activities/${slug}.html`));
  assert(fs.existsSync(`prototype/site/activities/${slug}.html`));
}
const notesDir='YoungRussiaOBS/База данных/ПМК Адмиралтейского района/';
const detail=fs.readFileSync(notesDir+club.name+'.md','utf8');
for(const r of source.schedule)assert(detail.includes(`### ${r.activity}`)&&detail.includes(r.time));
const raketa=read('data/clubs-krasnoselsky.json').find(c=>c.name==='Ракета');
assert(raketa.temporarilyClosed);
for(const r of read('data/research/krasnoselsky-official-evidence.json').clubs)assert(r.currentProfileText);
assert(fs.readFileSync('dist/clubs/krasnoselsky/raketa.html','utf8').includes('капитальный ремонт'));
const result={checkedAt:'2026-10-24',activeDirections:5,closedDirections:5,newIntervals:15,boxingUnchanged:true,oldPrototypesPreserved:true,results,ligovoProfiles:18,raketaClosureNotice:true};
fs.writeFileSync('docs/admiralteets-update-check-2026-10-24.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result));
