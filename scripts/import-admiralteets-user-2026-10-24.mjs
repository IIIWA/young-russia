import fs from 'node:fs/promises';
const file='data/clubs-admiralteysky.json',sourceFile='data/research/admiralteets-user-update-2026-10-24.json';
const source=JSON.parse(await fs.readFile(sourceFile,'utf8'));
const clubs=JSON.parse(await fs.readFile(file,'utf8'));
const club=clubs.find(c=>c.name===source.club);if(!club)throw Error('Missing Admiralteets');
await fs.mkdir('outputs/admiralteets-update-2026-10-24',{recursive:true});
try{await fs.copyFile(file,'outputs/admiralteets-update-2026-10-24/clubs-admiralteysky-before.json',fs.constants.COPYFILE_EXCL);}catch(e){if(e.code!=='EEXIST')throw e;}
const previous=[...club.activities];
const archived=new Map((club.archivedActivities??[]).map(r=>[r.activity,r]));
for(const activity of previous.filter(a=>!source.activeActivities.includes(a)))archived.set(activity,{activity,reason:'Направление закрыто по уточнению пользователя',confirmedAt:source.confirmedAt,source:source.source,sourceFile});
club.activities=[...source.activeActivities];club.archivedActivities=[...archived.values()];
club.activityCatalogConfirmedAt=source.confirmedAt;club.activityCatalogSource=sourceFile;
club.activitySchedule=(club.activitySchedule??[]).filter(s=>source.activeActivities.includes(s.activity)&&!source.schedule.some(r=>r.activity===s.activity));
for(const row of source.schedule)club.activitySchedule.push({activity:row.activity,schedule:row.days.map(day=>({day,time:row.time,group:row.activity})),sourceType:source.sourceType,source:source.source,sourceFile,confirmedAt:source.confirmedAt,sourceNote:'Время подтверждено пользователем 24.10.2026. Распределение по группам и помещениям не указано.',timeMeaning:'интервалы занятий, сообщённые пользователем'});
await fs.writeFile(file,JSON.stringify(clubs,null,2)+'\n');
console.log(JSON.stringify({club:club.name,active:club.activities,closed:club.archivedActivities.map(r=>r.activity),newIntervals:source.schedule.reduce((n,r)=>n+r.days.length,0)}));
