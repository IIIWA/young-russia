import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {writeGeneratedFile} from './write-generated-file.mjs';
const folder='data/research/vk-notes-2026-10-28';
const norm=s=>String(s??'').toLowerCase().replaceAll('ё','е').replace(/[^а-яa-z0-9]/g,'');
const yaml=s=>JSON.stringify(String(s??''));
const value=s=>s==null||s==='unknown'?'не указано':typeof s==='string'?s:JSON.stringify(s);
const noteName=s=>s.replace(/[<>:"/\\|?*\[\]#^]/g,' - ').replace(/\s+/g,' ').trim();
const configs=[{code:'moskovsky',label:'Московский',genitive:'Московского',short:'МС'},{code:'petrogradsky',label:'Петроградский',genitive:'Петроградского',short:'ПГ'}];
const allNames={moskovsky:'Московского',nevsky:'Невского',petrogradsky:'Петроградского',petrodvortsovy:'Петродворцового',primorsky:'Приморского',pushkinsky:'Пушкинского',frunzensky:'Фрунзенского',tsentralny:'Центрального'};
const cache=new Map();
async function acceptedIndex(){
 if(!cache.has('index'))cache.set('index',fs.readFile(`${folder}/index.json`,'utf8').then(JSON.parse).catch(e=>{if(e.code==='ENOENT')return null;throw e;}));
 const index=await cache.get('index');return index?.status==='accepted_for_internal_database'?index:null;
}
export async function vkResearch(district){
 const index=await acceptedIndex();if(!index)return null;
 if(!cache.has(district))cache.set(district,(async()=>{const ref=index.districts.find(d=>d.district===district);if(!ref)return null;const raw=await fs.readFile(ref.path);if(createHash('sha256').update(raw).digest('hex')!==ref.sha256)throw Error(`VK research changed after acceptance: ${district}`);const data=JSON.parse(raw);if(district==='pushkinsky'){try{data.linkReview=JSON.parse(await fs.readFile('data/research/vk-links-review-2026-10-28/antey-user-update.json','utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}}return data;})());
 return cache.get(district);
}
const recordFor=(d,name)=>d?.clubs.find(c=>norm(c.name)===norm(name));
const sourceText=refs=>(refs??[]).map(r=>`строки ${r.startLine??'?'}–${r.endLine??r.startLine??'?'}${r.url?`; ${r.url}`:''}`).join('; ');
const fold=(title,data)=>[`> [!info]- ${title}`,'> ```json',`> ${JSON.stringify(data)}`,'> ```',''];
const link=l=>`[${l.label??l.activity??l.url}](${l.url}); вид: ${l.kind??'не указан'}`;
const localTarget=p=>path.isAbsolute(p)?p.replaceAll('\\','/'):'../../../'+p;
const evidenceLink=(d,id)=>{const e=d.evidence.find(e=>e.id===id);return e?.localPath?`[${id}](<${localTarget(e.localPath)}>)`:id;};
function block(d,c){
 const coverage={mentioned:'Клуб упомянут',organization_only:'Есть сведения учреждения; клубная детализация отсутствует',not_found:'Отдельные сведения клуба в заметке не найдены'};
 const result=['## Сведения из пользовательской заметки ВК, обработка 28.10.2026','',
  'Источник предоставлен пользователем. Это обработка сохранённого текста и вложений; она не означает новую проверку содержимого VK или подтверждение официальным представителем.',
  `**Охват:** ${coverage[c.noteCoverage]??c.noteCoverage}.`,
  `[Исходная заметка](<../../../${d.sourceNote.path}>); SHA256: \`${d.sourceNote.sha256}\`.`,
  `[Структурированные данные района](../../../${folder}/${d.district}.json).`,'',
  `[[База данных/ПМК ${allNames[d.district]} района/Материалы ВК 2026-10-28|Общие сведения учреждения, вложения и вопросы района]].`,'',
  '### Основные сведения из заметки','',
  ...(c.facts??[]).map(f=>`- ${value(f.value??f.text??f)}. ${sourceText(f.sourceRefs)}`),
  ...(c.addressesFromNote??[]).map(a=>`- Адрес из заметки: ${value(a.address??a.text??a)}. ${sourceText(a.sourceRefs)}`),'',
  '### Ссылки клуба, учреждения и другие опубликованные контакты','',
  ...(c.links??[]).filter(l=>!l.activity).map(l=>`- ${link(l)}. ${sourceText(l.sourceRefs)}`),'',
  '### Направления из заметки','',
  ...(c.activities??[]).flatMap(a=>[`#### ${a.name}`,'',a.description??'',`Возраст: ${value(a.age)}. Условия: ${value(a.funding)}.`,
    `Основание: ${sourceText(a.sourceRefs)}.`,
    ...(c.links??[]).filter(l=>l.activity&&norm(l.activity)===norm(a.name)).map(l=>`- ${link(l)}. ${sourceText(l.sourceRefs)}`),'']),
  '### Графики из заметки и вложений','',
  ...((c.scheduleRecords??[]).length?(c.scheduleRecords??[]).flatMap(s=>[`#### ${s.activity}`,'',
    `Период: ${value(s.period)}. Статус источника: ${value(s.currentness)}. Условия: ${value(s.fundingEvidence)}.`,
    `Специалист из источника: ${value(s.teacher??s.staffRaw)}.`,
    ...s.slots.map(slot=>`- ${slot.day}: **${slot.time}**${slot.group?`; группа: ${value(slot.group)}`:''}${slot.room?`; помещение: ${value(slot.room)}`:''}.`),
    `Основание: ${sourceText(s.sourceRefs)}${s.evidenceId?`; вложение: ${evidenceLink(d,s.evidenceId)}`:''}${s.sourceUrl?`; [документ расписания](${s.sourceUrl})`:''}.`,'']):['Новых часов занятий для этого клуба из заметки не извлечено.','']),
  ...((c.openingHoursRecords??[]).length?['### Режим площадки, отдельно от расписания занятий','',...c.openingHoursRecords.map(h=>`- ${value(h)}`),'']:[]),
  ...((c.contacts??[]).length?['### Контакты источника для внутренней сверки','',...c.contacts.map(h=>`- ${value(h)}`),'']:[]),
  ...((c.staffHours??[]).length?['### Часы сотрудников, отдельно от занятий','',...c.staffHours.map(h=>`- ${value(h)}`),'']:[]),
  '### Ограничения, расхождения и вопросы ВК','',
  ...(c.restrictions??[]).map(x=>`- ${value(x)}`),...(c.questions??[]).map(x=>`- ${value(x)}`),'',
  'Общая сверка всех данных с официальными представителями запланирована после заполнения сайта. Неизвестное и спорное сохраняется во внутренней базе.','',
  ...fold('Полная запись ВК: исходные формулировки, строки и сравнение с официальными данными',c)];
 if(d.linkReview&&c.name==='Антей'){const u=d.linkReview;result.unshift('## Уточнение пользователя 28.10.2026: актуальное сообщество','',`[Сообщество ПМК «Антей»](${u.communityUrl}). Актуальная ссылка прислана пользователем; прямой просмотр VK заблокирован политикой инструмента.`,`[Исходное уточнение](<../../../${u.sourceNote}>). [Структурированная запись](../../../data/research/vk-links-review-2026-10-28/antey-user-update.json).`,`Прежний ${u.previousUrl} отмечен как отсутствующий по сообщению пользователя. anteipmk является личным контактом, а не сообществом клуба.`,...u.contacts.map(x=>`- ${x.name}: [личный контакт](${x.url}).`),'Снимок: восемь строк / 36 интервалов, ранее опубликованные шесть бесплатных строк / 31 интервал совпадают. Бесплатность фитнеса и шахмат требует отдельного основания.','');}
 return result;
}
export async function vkNoteSection(district,name){const d=await vkResearch(district),c=recordFor(d,name);return c?block(d,c):[];}
export async function enrichRowsWithVk(rows){
 for(const row of rows){const district=row.config?.code??row.vkDistrict??row.sourceCatalog?.match(/clubs-(.+)\.json$/)?.[1];if(!district)continue;const d=await vkResearch(district),c=recordFor(d,row.club);if(!c)continue;
  row.vkSection=block(d,c);row.vkResearch={sourceNote:d.sourceNote.path,coverage:c.noteCoverage,schedules:c.scheduleRecords.length,questions:c.questions.length};
  row.reviewStatus+=`; ВК-заметка обработана 28.10.2026, охват: ${c.noteCoverage}, графиков из ВК: ${c.scheduleRecords.length}; подтверждение представителями впереди`;
  row.updatedAt='2026-10-28';
 }
 return rows;
}
export async function vkOnlyDistrictRows(){
 if(!await acceptedIndex())return [];
 const centers=JSON.parse(await fs.readFile('data/research/pmc-centers-contacts.json','utf8')),rows=[];
 for(const config of configs){const data=await vkResearch(config.code);if(!data)continue;const baseline=JSON.parse(await fs.readFile(`data/clubs-${config.code}.json`,'utf8'));
  for(const [i,b]of baseline.entries()){const c=recordFor(data,b.name);if(!c)throw Error(`Missing accepted VK baseline: ${config.code}/${b.name}`);const center=centers.find(x=>x.id===b.organization)??{};
   rows.push({id:`${config.short}-${String(i+1).padStart(3,'0')}`,district:config.label,club:b.name,address:b.address,phone:b.phone??'',clubVk:b.vkUrl??'',officialPage:b.officialUrl??b.sourceUrl??'',center:center.name??b.organization??'',centerPhone:(center.phones??[]).join('; '),centerEmail:(center.emails??[]).join('; '),centerVk:center.links?.vk??'',centerSite:center.links?.site??'',centerSource:center.source??'',
    activities:b.activities??[],activityPages:b.activityPages??[],specialists:[],scheduleLines:0,scheduleDetails:[],imageSchedule:null,imageScheduleLines:[],scheduleActivities:[],catalogScheduleCount:(b.activitySchedule??[]).length,
    reviewStatus:'Каталог и пользовательская заметка ВК; полная проверка представителями запланирована после заполнения сайта',
    sourceNote:data.sourceNote.path,sourceCatalog:`data/clubs-${config.code}.json`,sections:[],reviewIssues:[],detailNote:`ПМК ${config.genitive} района/${noteName(b.name)}`,detailBase:`ПМК ${config.genitive} района.base`,updatedAt:'2026-10-28',vkDistrict:config.code});
  }
 }
 return enrichRowsWithVk(rows);
}
export async function writeVkOnlyDistrictBases(){
 const rows=await vkOnlyDistrictRows();if(!rows.length)return;
 for(const config of configs){const baseName=`ПМК ${config.genitive} района`,dir=`YoungRussiaOBS/База данных/${baseName}`;await fs.mkdir(dir,{recursive:true});
  const base=`filters:\n  and:\n    - file.inFolder("База данных/${baseName}")\n    - record_type == "pmk_vk_research"\nproperties:\n  club:\n    displayName: Клуб\n  address:\n    displayName: Адрес каталога\n  vk_note_coverage:\n    displayName: Охват заметки ВК\n  vk_schedule_count:\n    displayName: Графиков из ВК\n  questions:\n    displayName: Вопросы\nviews:\n  - type: table\n    name: Клубы и сведения ВК\n    order:\n      - club\n      - address\n      - vk_note_coverage\n      - vk_schedule_count\n      - questions\n    sort:\n      - property: club\n        direction: ASC\n`;
  await writeGeneratedFile(`YoungRussiaOBS/База данных/${baseName}.base`,base);
  const data=await vkResearch(config.code);
  for(const row of rows.filter(r=>r.vkDistrict===config.code)){const c=recordFor(data,row.club),body=['---','record_type: pmk_vk_research',`district: ${yaml(config.label)}`,`club: ${yaml(row.club)}`,`address: ${yaml(row.address)}`,`vk_note_coverage: ${yaml(c.noteCoverage)}`,`vk_schedule_count: ${c.scheduleRecords.length}`,`questions: ${yaml(c.questions.map(value).join(' | '))}`,'updated_at: "2026-10-28"','official_representative_verification: "pending_after_site_completion"','---','',`# ${row.club}`,'',`Адрес из существующего каталога: ${row.address}.`,
   `[[База данных/Каталог клубов Санкт-Петербурга/${row.id}|Запись в общей базе]].`,'',...row.vkSection,
   '## Уже сохранённые официальные сведения','',`[Официальное исследование S-79-C](../../../data/research/remaining-districts-2026-10-26/${config.code}.json). Сопоставление с ним сохранено в блоке ВК выше; первичный пакет не перезаписывается.`,
   ...(row.officialPage?[`[Ранее сохранённая официальная страница](${row.officialPage}).`]:[]),''];
   await writeGeneratedFile(path.join(dir,noteName(row.club)+'.md'),body.join('\n'));
  }
 }
 console.log(JSON.stringify({vkOnlyDistrictBases:configs.length,clubs:rows.length}));
}
export async function writeVkResearchMaterials(){
 const index=await acceptedIndex();if(!index)return;
 for(const ref of index.districts){const d=await vkResearch(ref.district),dir=`YoungRussiaOBS/База данных/ПМК ${allNames[ref.district]} района`;await fs.mkdir(dir,{recursive:true});
 const lines=['---','record_type: vk_research_context',`district: ${yaml(ref.district)}`,'updated_at: "2026-10-28"','---','',
  '# Материалы пользовательской заметки ВК','',
  `[Исходная заметка](<../../../${d.sourceNote.path}>). [Полный пакет обработки](../../../${ref.path}).`,
  'Общие сведения учреждения не означают одинаковых условий каждой группы. Источник предоставлен пользователем; подтверждение представителями запланировано после заполнения сайта.','',
  ...fold('Сведения учреждений из заметки',d.organizationFacts),
  ...fold('Дополнительные и неоднозначные записи, отдельно от существующих клубов',d.additionalRecords),
  '## Вложения и их фактический статус проверки','',
  ...d.evidence.map(e=>`- **${e.id}:** ${e.reviewStatus}; ${e.localPath?`[локальный файл](<${localTarget(e.localPath)}>)`:e.sourceUrl?`[исходная ссылка](${e.sourceUrl})`:'см. основания в JSON'}${e.limitations?`; ограничения: ${value(e.limitations)}`:''}.`),'',
  ...fold('Полные данные вложений: происхождение, страницы, контрольные суммы и ограничения',d.evidence),
  '## Вопросы района','',...d.issues.map(x=>`- ${value(x)}`),'',
  ...fold('Кандидаты для дальнейшего сайта: решение требует проверки, автоматического переноса нет',d.publicCandidates),''];
 await writeGeneratedFile(path.join(dir,'Материалы ВК 2026-10-28.md'),lines.join('\n'));
 }
}
