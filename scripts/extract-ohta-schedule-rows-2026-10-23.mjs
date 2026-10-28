import fs from 'node:fs/promises';
const source=JSON.parse(await fs.readFile('data/research/ohta-structured-source-2026-10-23.json','utf8'));
const clock=/\b(\d{1,2})[.:](\d{2})\s*[-–—−‑]\s*(\d{1,2})[.:](\d{2})\b/g;
const person=s=>/^[А-ЯЁ][а-яёА-ЯЁ-]+\s+[А-ЯЁ]{1,2}\.(?:\s*[А-ЯЁ]\.)?(?:\s|,|$)/u.test(s)||/^[А-ЯЁ][а-яё-]+\s+[А-ЯЁ][а-яё-]+\s+[А-ЯЁ][а-яё-]*(?:вич|вна|ична|ич)$/u.test(s);
const groupRe=/(?:групп[аы]\s*(?:\d+[а-яА-Я]?|[«"“][^»"”]+[»"”])|\d+[а-яА-Я]?\s*групп[аы])(?:\s*\([^)]*\))?/i;
const trim=s=>s.replace(/^[\s():;,-]+|[\s():;,-]+$/g,'').replace(/\s+/g,' ').trim().replace(/^[«"“]([^«»"“”]*)[»"”]$/,'$1');
const cohortRe=/(?<![а-яё])(?:Новичок|Опытные|Начинающие|Продолжающие|Продолжающий|С ноля|С нуля)(?![а-яё])/iu;
const normalizeGroup=s=>s.replace(/(\d+)\s*группа/ig,'Группа $1').replace(/группа/ig,'Группа').replace(/\s+/g,' ').trim().replace(cohortRe,x=>x[0].toLocaleUpperCase('ru')+x.slice(1).toLocaleLowerCase('ru'));
const result={date:'2026-10-23',rows:[],unresolved:[],sources:[]};
for(const page of source.schedules){
 result.sources.push({url:page.url,sha256:page.sha256,headings:page.headings,title:page.title});
 for(const day of page.days)for(const [roomIndex,section]of day.sections.entries()){
  let activity='',group='',staff='',heading='';
  for(const [lineIndex,sourceLine]of section.lines.entries()){
   let line=sourceLine;
   if(person(line)){
    const inline=line.match(/^([А-ЯЁ][а-яёА-ЯЁ-]+\s+[А-ЯЁ]{1,2}\.(?:\s*[А-ЯЁ]\.)?)(?:\s|,|$)/u);
    staff=inline?.[1]??line;activity='';group='';heading='';
    if(!inline||![...line.matchAll(clock)].length)continue;
    line=line.slice(inline[0].length).trim();
   }
   const matches=[...line.matchAll(clock)];
   if(!matches.length){
    if(!line||/^[()\s;,.]+$/.test(line))continue;
    if(groupRe.test(line)&&trim(line.replace(groupRe,''))===''){group=trim(line);continue;}
    if(/^(?:пн|вт|ср|чт|пт|сб|вс|выходной|перерыв|нет занятий)$/i.test(line))continue;
    activity=trim(line);heading=activity;group='';continue;
   }
   let previousEnd=0;
   for(const [mi,m]of matches.entries()){
    const segment=line.slice(previousEnd,m.index);
    const groupMatch=segment.match(groupRe)?.[0];
    let label=trim(segment.replace(groupRe,''));
    if(groupMatch)group=trim(groupMatch);
    const cohort=label.match(cohortRe)?.[0];
    if(cohort){label=trim(label.replace(cohortRe,''));group=[cohort,groupMatch??''].filter(Boolean).join('; ');if(!label&&heading)activity=heading;}
    if(label&&!/^(?:с|до|в|и|по|группа)$/i.test(label)){activity=label;if(!groupMatch)group='';}
    if(cohort)group=[cohort,groupMatch??''].filter(Boolean).join('; ');
    const time=`${m[1].padStart(2,'0')}:${m[2]}-${m[3].padStart(2,'0')}:${m[4]}`;
    const row={clubSlug:page.slug.replace(/_schedule$/,''),day:day.day.toLocaleLowerCase('ru'),room:section.room,activity,group:normalizeGroup(group),staff,time,rawLine:sourceLine,sourceUrl:page.url,recordId:section.recordId,roomIndex,lineIndex};
    if(!activity)row.review='Не найдено явное название рядом со временем';
    if(Number(m[1])>23||Number(m[3])>24||Number(m[2])>59||Number(m[4])>59||time.split('-')[1]<=time.split('-')[0])row.review='Проверить необычный интервал исходника';
    result.rows.push(row);previousEnd=m.index+m[0].length;
   }
  }
 }
}
const names=new Map();for(const row of result.rows){const key=row.clubSlug+'|'+row.activity;if(!names.has(key))names.set(key,{club:row.clubSlug,activity:row.activity,groups:new Set(),rows:0,example:row.rawLine});const n=names.get(key);n.rows++;if(row.group)n.groups.add(row.group);}
result.labels=[...names.values()].map(n=>({...n,groups:[...n.groups]}));result.unresolved=result.rows.filter(r=>r.review);
await fs.writeFile('data/research/ohta-schedule-transcription-2026-10-23.json',JSON.stringify(result,null,2)+'\n');
await fs.writeFile('outputs/ohta-schedule-labels-2026-10-23.txt',result.labels.map(n=>`${n.club} | ${n.activity} | ${n.groups.join('; ')} | ${n.rows}`).join('\n'));
console.log(JSON.stringify({rows:result.rows.length,labels:result.labels.length,unresolved:result.unresolved.length}));
