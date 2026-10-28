import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {writeGeneratedFile} from './write-generated-file.mjs';
import {vkNoteSection} from './vk-note-research.mjs';
import {applyPetrodvortsovyImport} from './petrodvortsovy-import-source.mjs';

const sourceDir='data/research/remaining-districts-2026-10-26';
export const remainingDistrictConfigs=[
  {code:'nevsky',label:'Невский',genitive:'Невского',short:'НВ',task:'S-79-A'},
  {code:'pushkinsky',label:'Пушкинский',genitive:'Пушкинского',short:'ПШ',task:'S-79-A'},
  {code:'frunzensky',label:'Фрунзенский',genitive:'Фрунзенского',short:'ФР',task:'S-79-A'},
  {code:'petrodvortsovy',label:'Петродворцовый',genitive:'Петродворцового',short:'ПД',task:'S-79-B'},
  {code:'primorsky',label:'Приморский',genitive:'Приморского',short:'ПР',task:'S-79-B'},
  {code:'tsentralny',label:'Центральный',genitive:'Центрального',short:'ЦН',task:'S-79-B'},
];
const norm=s=>String(s??'').toLowerCase().replaceAll('ё','е').replace(/[^а-яa-z0-9]/g,'');
const yaml=x=>JSON.stringify(String(x??''));
const text=x=>x==null?'не указано':typeof x==='string'?x:JSON.stringify(x);
const noteName=s=>s.replace(/[<>:"/\\|?*\[\]#^]/g,' - ').replace(/\s+/g,' ').trim();
const matchName=c=>c.baselineMatch?.name??c.catalogMatch?.existingName;
const activityName=a=>a.activity??a.name??a.text??'';
const urls=c=>c.officialPages??(c.officialPage?[c.officialPage]:[]);
const sourceLink=(url,label='источник')=>url?`[${label}](${url})`:'источник не указан';
const schedules=c=>c.activitySchedules??[];
const fundingLabels={free:'Бесплатно',paid:'Платно','paid-explicit-pd':'Платно, пометка ПД','not-stated':'Финансирование не указано',
  'mixed-free-and-paid':'Есть бесплатные и платные варианты, условия разделены',
  'institution-offers-free-and-paid-services; each timetable has no funding label':'У учреждения есть бесплатные и платные услуги; финансирование этой группы не указано',
  'general-free-offer; parallel-paid-offerings-separate':'Общее бесплатное предложение учреждения; платные варианты сохранены отдельно',
  'general-free-offer; timetable may refine':'Общее бесплатное предложение учреждения; условия конкретной группы проверить',
  'general-free-offer; not individually-labelled':'Общее бесплатное предложение учреждения; строка отдельно не помечена',
  'general-free-offer; explicit-pd-paid':'Смешанный график: группы с ПД платные; остальные требуют проверки условий',
  'free-recruitment-page':'Бесплатный набор из объявления; период проверить',
  'not-labelled-in-archive':'Финансирование в архиве не указано'};
const currentnessLabels={
  'listed-on-official-page; season-not-stated':'Есть на официальной странице; сезон не указан',
  'archived; explicit-period-ended-in-2025':'Архив: период закончился в 2025 году',
  'archived; explicit-2021-2022':'Архив: 2021–2022 учебный год',
  'historical-page; 2026-validity-unconfirmed':'Старая страница; действительность в 2026 году не подтверждена',
  'published-on-active-official-page; explicit-season-not-stated':'Опубликовано на активной странице; сезон не указан',
  'published-current-period-unspecified':'Опубликовано сейчас; период самой таблицы не указан',
  'dated-2026-currently-linked':'Датировано 2026 годом, ссылка есть на официальной странице',
  'summer-or-undated-recruitment-archive':'Архив летнего или недатированного набора',
  'week-specific-2026-09-07-to-2026-09-13; recurrence-not-confirmed':'Неделя 7–13 сентября 2026; повторение не подтверждено',
  'currently-linked-period-unspecified':'Документ доступен по текущей ссылке; период не указан',
  'dated-2026-currently-linked; autumn-reconfirmation-needed':'Документ 2026 года; осенний график требует подтверждения',
  'archived-2024; superseded-by-2026-PDF':'Архив 2024 года; найден более новый PDF 2026 года',
};
const currentness=x=>currentnessLabels[x]??text(x);
const period=x=>typeof x==='object'&&x?.label?x.label:text(x);
const folded=(label,value)=>[`> [!info]- ${label}`,`> \`\`\`json`,`> ${JSON.stringify(value)}`,'> ```',''];
export function scheduleClass(s){
  const current=String(s.currentness??'').toLowerCase();
  const funding=String(typeof s.fundingEvidence==='string'?s.fundingEvidence:s.fundingEvidence?.status??'').toLowerCase();
  if(/archiv|historical|2021_01_25/.test(current)||/летни|summer/i.test(text(s.period)))return 'Архив / старый источник';
  if(['paid','paid-explicit-pd'].includes(funding))return 'Платный вариант';
  if(funding.includes('explicit-pd-paid'))return 'Смешанные бесплатные и платные группы';
  if(current.includes('week-specific'))return 'Отдельная неделя, повторение не подтверждено';
  if(funding==='free'||funding.includes('бесплатные'))return 'Бесплатность указана, период проверить';
  if(funding.includes('no funding label'))return 'Финансирование группы не установлено';
  return 'Общее предложение учреждения, группу проверить';
}
function funding(value){
  const status=typeof value==='string'?value:value?.status;
  const quote=typeof value==='object'?value?.quote??value?.text:'';
  return `${fundingLabels[status?.toLowerCase()]??status??'Финансирование не указано'}${quote?`; ${quote}`:''}${value?.sourceUrl?`; ${sourceLink(value.sourceUrl)}`:''}`;
}
function issuesFor(d,c){
  return [...(c.reviewIssues??[]),...(d.reviewIssues??[]).filter(x=>x.club
    ? [norm(c.name),norm(matchName(c))].includes(norm(x.club))
    : x.affectedClubs ? x.affectedClubs.some(n=>[norm(c.name),norm(matchName(c))].includes(norm(n))) : true)];
}
function communities(c){
  return [
    ...(c.activities??[]).filter(a=>a.community?.url).map(a=>({...a.community,activity:activityName(a)})),
    ...(c.activityCommunities??[]),
  ];
}
const quoteRecord=x=>typeof x==='string'?x:JSON.stringify(x);
const slotText=s=>`${s.day}: ${s.time}${s.group?`; группа: ${s.group}`:''}${s.room?`; помещение: ${s.room}`:''}`;
const locator=s=>text(s.sourceLocator??{page:s.page??s.sourcePage,table:s.table,row:s.row});

// Only accepted, byte-identical packages may become generated research views.
export async function loadRemainingDistrictResearch(){
  const index=JSON.parse(await fs.readFile(`${sourceDir}/index.json`,'utf8'));
  if(index.status!=='accepted_research_with_documented_gaps')throw Error('S-79 research acceptance missing');
  const results=[];
  for(const config of remainingDistrictConfigs){
    const sourceNote=`${sourceDir}/${config.code}.json`,raw=await fs.readFile(sourceNote);
    const accepted=index.districts.find(x=>x.district===config.code);
    if(createHash('sha256').update(raw).digest('hex')!==accepted?.sha256)throw Error(`S-79 accepted hash changed: ${config.code}`);
    const data=JSON.parse(raw),baseline=JSON.parse(await fs.readFile(`data/clubs-${config.code}.json`,'utf8'));
    const filenames=data.clubs.map(c=>noteName(c.name));
    if(new Set(filenames.map(n=>n.toLowerCase())).size!==filenames.length)throw Error(`Duplicate research note: ${config.code}`);
    for(const b of baseline){if(data.clubs.filter(c=>norm(matchName(c))===norm(b.name)).length!==1)throw Error(`Incomplete baseline coverage: ${config.code}/${b.name}`);}
    if(baseline.length!==accepted.baselineClubs)throw Error(`Baseline count changed: ${config.code}`);
    results.push({config,data,baseline,sourceNote,baseName:`ПМК ${config.genitive} района`});
  }
  return applyPetrodvortsovyImport(results);
}

export async function remainingDistrictRows(){
  const rows=[];
  for(const {config,data,baseline,sourceNote,baseName} of await loadRemainingDistrictResearch()){
    for(const [i,b] of baseline.entries()){
      const c=data.clubs.find(x=>norm(matchName(x))===norm(b.name));
      const org=data.organizations.find(o=>o.id===c.organizationId)??data.organizations[0];
      const links=communities(c);
      const details=schedules(c).flatMap((s,j)=>s.slots.map(slot=>({activity:s.activity,
        text:`${slotText(slot)}; ${scheduleClass(s)}; период: ${period(s.period)}; ${funding(s.fundingEvidence)}; ${sourceLink(s.sourceUrl)}`,
        line:`запись ${j+1}, ${locator(s)}`,sourceUrl:s.sourceUrl})));
      rows.push({id:`${config.short}-${String(i+1).padStart(3,'0')}`,district:config.label,club:b.name,address:b.address,
        phone:b.phone??'',clubVk:(c.vk??[]).find(v=>!v.kind||v.kind==='club-or-activity')?.url??'',officialPage:urls(c)[0]??'',
        center:org.name,centerPhone:(org.phones??[]).join('; '),centerEmail:(org.emails??[]).join('; '),centerVk:org.vk?.[0]?.url??'',centerSite:org.site??org.officialSites?.[0]??'',centerSource:org.clubListUrl??org.site??'',
        activities:[...new Set((c.activities??[]).map(activityName).filter(Boolean))],
        activityPages:links.map(l=>({title:l.activity??l.label??'Ссылка направления',catalogActivity:l.activity??'',vkUrl:l.url})),
        specialists:[],scheduleLines:details.length,scheduleDetails:details,imageSchedule:null,imageScheduleLines:[],scheduleActivities:[...new Set(details.map(x=>x.activity))],
        catalogScheduleCount:(b.activitySchedule??[]).length+(b.classSchedule?1:0),
        reviewStatus:data.followupReviewStatus??`${config.task}: исследование принято 26.10.2026 с вопросами; база обновлена 27.10.2026. Статус источника: ${text(c.status)}. Текущий бесплатный набор не подтверждён для всех строк.`,
        sourceNote,sourceCatalog:`data/clubs-${config.code}.json`,researchSourceUrl:urls(c)[0]??org.clubListUrl??org.site??org.officialSites?.[0]??'',
        sections:[],reviewIssues:issuesFor(data,c),detailNote:`${baseName}/${noteName(c.name)}`,detailBase:`${baseName}.base`,updatedAt:data.updatedAt??'2026-10-27',researchOnly:true,
      });
    }
  }
  return rows;
}

function scheduleBody(s,i){
  return [`### ${i+1}. ${s.activity}`,'',`**Статус:** ${scheduleClass(s)}.`,
    `**Период:** ${period(s.period)}. **Актуальность в источнике:** ${currentness(s.currentness)}.`,
    `**Условия:** ${funding(s.fundingEvidence)}.`,
    `**Возраст:** ${text(s.age??s.ageRaw)}. **Специалист:** ${text(s.teacher??s.staffRaw??s.staffAndActivityRaw)}.`,
    `${sourceLink(s.sourceUrl)}; тип: ${s.sourceType}; место в источнике: ${locator(s)}.`,
    ...(s.slots??[]).map(slot=>`- ${slotText(slot)}${slot.funding?`; условия группы: ${text(slot.funding)}`:''}.`),
    '',...folded('Точная запись источника и ячеек',s)];
}
const section=(heading,records)=>records?.length?[`## ${heading}`,'',...records.map(x=>`- ${quoteRecord(x)}`),'']:[];

export async function writeRemainingDistrictBases(){
  let records=0;
  for(const {config,data,baseline,sourceNote,baseName} of await loadRemainingDistrictResearch()){
    const folder=path.join('YoungRussiaOBS','База данных',baseName);await fs.mkdir(folder,{recursive:true});
    const base=`filters:\n  and:\n    - file.inFolder("База данных/${baseName}")\n    - record_type == "official_district_research"\nproperties:\n  club:\n    displayName: Клуб или подразделение\n  address:\n    displayName: Адреса из источников\n  existing_catalog_club:\n    displayName: Есть в каталоге\n  source_status:\n    displayName: Статус источника\n  activity_count:\n    displayName: Предложения\n  schedule_count:\n    displayName: Записей графиков\n  archive_schedule_count:\n    displayName: Архивных графиков\n  schedule_slot_count:\n    displayName: Интервалов всего\n  club_vk:\n    displayName: Опубликованные VK клуба\n  official_page:\n    displayName: Официальная страница\n  questions:\n    displayName: Вопросы\nviews:\n  - type: table\n    name: Все исследовательские записи\n    order:\n      - club\n      - existing_catalog_club\n      - address\n      - source_status\n      - club_vk\n      - official_page\n      - activity_count\n      - schedule_count\n      - archive_schedule_count\n      - schedule_slot_count\n      - questions\n    sort:\n      - property: club\n        direction: ASC\n  - type: table\n    name: Дополнительные записи\n    filters:\n      and:\n        - existing_catalog_club == false\n    order:\n      - club\n      - source_status\n      - address\n      - questions\n`;
    await writeGeneratedFile(path.join('YoungRussiaOBS','База данных',baseName+'.base'),base);
    for(const c of data.clubs){
      const b=baseline.find(x=>norm(x.name)===norm(matchName(c))),schedule=schedules(c),issues=issuesFor(data,c);
      const index=b?baseline.indexOf(b):-1,id=b?`${config.short}-${String(index+1).padStart(3,'0')}`:null;
      const body=['---','record_type: official_district_research',`district: ${yaml(config.label)}`,`club: ${yaml(c.name)}`,
        `existing_catalog_club: ${Boolean(b)}`,`record_kind: ${yaml(c.recordType??(b?'club':'additional-record-status-unconfirmed'))}`,
        `address: ${yaml((c.addresses??[]).map(a=>a.address).join(' | '))}`,`club_vk: ${yaml((c.vk??[]).filter(v=>!v.kind||v.kind==='club-or-activity').map(v=>v.url).join(' | '))}`,
        `official_page: ${yaml(urls(c).join(' | '))}`,`source_status: ${yaml(text(c.status))}`,
        `activity_count: ${(c.activities??[]).length}`,`schedule_count: ${schedule.length}`,`archive_schedule_count: ${schedule.filter(s=>scheduleClass(s)==='Архив / старый источник').length}`,
        `schedule_slot_count: ${schedule.reduce((n,s)=>n+s.slots.length,0)}`,`questions: ${yaml(issues.map(quoteRecord).join(' | '))}`,
        `research_source: ${yaml(sourceNote)}`,`research_checked_at: ${yaml(data.checkedAt)}`,`updated_at: ${yaml(data.updatedAt??'2026-10-27')}`,'---','',`# ${c.name}`,'',
        `**${config.task}, ${config.label} район.** Исследование принято с явно сохранёнными пробелами. Сведения перенесены во внутреннюю базу; готовность каждого графика к публикации проверяется отдельно.`,'',
        b?`[[Каталог клубов Санкт-Петербурга/${id}|Запись в общей базе]]. Название и адрес в публичном каталоге: ${b.name}; ${b.address}.`:'Дополнительная организационная запись или площадка с неуточнённым статусом. В общий список существующих клубов не добавлена.','',
        `**Статус источника:** ${text(c.status)}.`,...urls(c).map(u=>`- ${sourceLink(u,'официальная страница')}`),'',
        ...section('Адреса с основаниями',c.addresses),
        '## Опубликованные VK клуба, учреждения и профилей','',
        'Тип ссылки сохранён. Личный профиль, публикация и контакт учреждения не считаются отдельным сообществом клуба. Содержимое VK напрямую не проверялось.','',
        ...(c.vk??[]).map(v=>`- ${sourceLink(v.url,v.label||v.kind||'опубликованная ссылка')}; ${quoteRecord(v)}`),'',
        '## Направления и условия','',
        ...(c.activities??[]).flatMap(a=>[`### ${activityName(a)}`,'',`Условия: ${funding(a.fundingEvidence??a.funding)}. Возраст: ${text(a.age??a.ageRaw??a.ageEvidence)}.`,
          `${sourceLink(a.sourceUrl)}. Период: ${period(a.period)}. Актуальность: ${currentness(a.currentness)}.`,
          ...(a.community?.url?[`${sourceLink(a.community.url,'Ссылка направления')}; вид: ${a.community.kind}.`]:[]),
          ...(c.activityCommunities??[]).filter(l=>norm(l.activity)===norm(activityName(a))).map(l=>`${sourceLink(l.url,'Сообщество направления')}; ${sourceLink(l.sourceUrl,'страница-основание')}.`),
          ...folded('Точная запись направления',a)]),
        ...section('Другие ссылки направлений из исследования',communities(c).filter(l=>!(c.activities??[]).some(a=>norm(activityName(a))===norm(l.activity)))),
        '## Графики из источников','',
        'Архив, платные варианты, конкретная неделя и неопределённое финансирование отмечены у каждой записи. Общий режим и часы сотрудников находятся в отдельном разделе.','',
        ...schedule.flatMap(scheduleBody),
        ...section('Режим клуба, пространства и часы сотрудников', [...(c.clubOpeningHours??[]),...(c.activityOpeningHours??[]),...(c.serviceAvailability??[])]),
        ...section('Платные предложения, отдельно от бесплатных вариантов',c.paidOfferings),
        ...section('Ограничения и объявления',c.restrictions),
        ...section('Вопросы клуба и района',issues),
        ...section('Общие возрастные и финансовые условия',[c.ageEvidence,c.fundingEvidence].filter(Boolean)),
        ...section('Опубликованные перечни предложений',c.publishedOfferings),
        ...folded('Полная запись клуба для сверки',c),
        '## Источники и пересборка','',`- Полные исходные данные и журналы документов/изображений: [${config.code}.json](../../../${sourceNote}).`,
        `- [Отчёт ${config.task}](../../../docs/research/${config.task}.md).`,
        `- [[База данных/${baseName}/Материалы района|Учреждения, документы и общие вопросы района]].`,
        '- Поля JSON сохраняют точные ячейки, страницы, исходные условия, метод проверки и хеши вложений.',
        '- Представление пересобирается командой `npm run data:views`. Исходные данные исследования остаются неизменными.',''];
      const vkSection=await vkNoteSection(config.code,b?.name??c.name);
      if(vkSection.length)body[body.findIndex(line=>line.startsWith('updated_at: '))]='updated_at: "2026-10-28"';
      body.splice(body.indexOf('## Источники и пересборка'),0,...vkSection);
      await writeGeneratedFile(path.join(folder,noteName(c.name)+'.md'),body.join('\n'));records++;
    }
    const materials=['---','record_type: district_research_sources',`district: ${yaml(config.label)}`,'---','',
      `# ${config.label} район: материалы ${config.task}`,'',`Исследовано ${data.checkedAt}; внутренняя база обновлена ${data.updatedAt==='2026-10-28'?'28.10.2026':'27.10.2026'}.`,'',
      '## Учреждения и общие условия','',...data.organizations.flatMap(o=>[`### ${o.name}`,'',...folded('Контакты, основания и условия учреждения',o)]),
      ...section('Все вопросы района',data.reviewIssues),
      '## Документы и статус просмотра','',...data.documents.map(d=>`- ${sourceLink(d.url??d.sourceUrl,d.title??d.name??'Документ')}; просмотр: ${text(d.visualStatus??d.visualReview??d.reviewStatus)}; файл: ${d.localPath??d.localFile??'см. JSON'}.`),'',
      `Журналы: ${data.sources.length} записей источников, ${data.documents.length} документов, ${data.mediaReviews.length} записей медиа. Число записей не равно числу уникальных или актуальных расписаний.`,
      `Полные источники, результаты разбора, ограничения просмотра, спорные фрагменты и SHA256: [${config.code}.json](../../../${sourceNote}).`,
      `Отчёт: [${config.task}](../../../docs/research/${config.task}.md).`,''];
    await writeGeneratedFile(path.join(folder,'Материалы района.md'),materials.join('\n'));
  }
  console.log(JSON.stringify({remainingDistrictBases:remainingDistrictConfigs.length,researchRecords:records}));
}
