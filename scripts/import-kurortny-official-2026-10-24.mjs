import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const read=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const write=async(p,d)=>fs.writeFile(p,JSON.stringify(d,null,2)+'\n');
const hash=s=>createHash('sha256').update(s).digest('hex');
const date='2026-10-24',catalog='data/clubs-kurortny.json',baseline='data/research/kurortny-catalog-before-2026-10-24.json';
try{await fs.copyFile(catalog,baseline,fs.constants.COPYFILE_EXCL);}catch(e){if(e.code!=='EEXIST')throw e;}
const clubs=await read(baseline),source=await read('data/research/kurortny-schedule-transcription-2026-10-24.json'),pages=(await read('data/research/kurortny-official-pages-2026-10-24.json')).pages;
const page=name=>{const p=pages.find(p=>p.file===name+'.json');assert(p,name);return p;};
const rootUrls={voshod:page('voshod-root').url,molodost:page('molodost-root').url,sniper:page('sniper-root').url};
const scheduleUrls={voshod:page('voshod-activities').url,molodost:page('molodost-schedule').url,sniper:page('sniper-schedule').url};
const centerVk={voshod:'https://vk.ru/pmcvoshod',molodost:'https://vk.ru/pmcmolodost',sniper:'https://vk.ru/pmcsniper'};
const ownVk={'Восход: Володарского':'https://vk.ru/club13102028','Восход: Приморское шоссе, 270':'https://vk.ru/ntennisvoshod','Восход: Токарева':'https://vk.ru/voshodtokareva15'};
const clean=s=>s.replaceAll('ё','е').replace(/[^а-яa-z0-9]/gi,'').toLowerCase();
const note=source.userNote.text;
const noteSlices={voshod:note.slice(0,note.indexOf('https://vk.ru/pmcmolodost')),molodost:note.slice(note.indexOf('https://vk.ru/pmcmolodost'),note.indexOf('https://vk.ru/club11492364')),sniper:note.slice(note.indexOf('https://vk.ru/club11492364'))};
function canonical(club,title){
 const aliases={'Вокальная студия':'Вокал','Правовой клуб «Закон и порядок»':'Правовой клуб','Волонтерство':'Волонтёрство'};
 const wanted=aliases[title]??title;return club.activities.find(a=>clean(a)===clean(wanted))??wanted;
}
const community={
 'Пилатес':'https://vk.ru/club13102028','Функционально-силовая тренировка':'https://vk.ru/club13102028','Фитнес':'https://vk.ru/club13102028',
 'Студия «Юный каскадёр»':'https://vk.ru/club64888937','Настольный теннис':'https://vk.ru/ntennisvoshod','Школа добровольцев':'https://vk.ru/dckurort',
 'Ансамбль русской песни «Малина»':'https://vk.ru/trio_malina','Ансамбль русской песни «Гостьюшки»':'https://vk.ru/gostyshki','Студия «Практическое рисование»':'https://vk.ru/club185986183',
 'Спортивный танец и фитнес':'https://vk.ru/club23234353','ОФП смешанных видов спорта':'https://vk.ru/public203195042','Шахматы для всей семьи':'https://vk.ru/club84560668',
 'Добровольцы ПМЦ':'https://vk.ru/club95558098','Молодёжный клуб «Встреча»':'https://vk.ru/club208321255','Бокс':'https://vk.ru/public216358389','Клуб «Вдохновение»':'https://vk.ru/club222070648','Движение первых':'https://vk.ru/club222070648','Фотография «Лучший кадр»':'https://vk.ru/club220349682','Турлидер':'https://vk.ru/turlider7','Арт-студия «Творческая мастерская»':'https://vk.ru/public207128649',
};
// Resolve activity cards by the exact source page, never by a general institution footer link.
const sniperCards={
 'Молодёжный клуб «Встреча»':1,'Арт-студия «Творческая мастерская»':1,'Фотография «Лучший кадр»':2,'Танцевальный фитнес':3,'Спортивный танец и фитнес':4,'Бокс':5,'ОФП силовых способностей (тренажёрный зал)':6,'Шахматы для всей семьи':7,'ОФП смешанных видов спорта':8,'Турлидер':9,'Клуб «Вдохновение»':10,'Движение первых':10,'Добровольцы ПМЦ':11,
};
const communityFor=(center,title)=>center==='voshod'?(['Фитнес','Пилатес','Функционально-силовая тренировка','Студия «Юный каскадёр»','Настольный теннис','Школа добровольцев'].includes(title)?community[title]:undefined):center==='molodost'?(['Ансамбль русской песни «Малина»','Ансамбль русской песни «Гостьюшки»','Студия «Практическое рисование»'].includes(title)?community[title]:undefined):community[title];
const evidence={checkedAt:date,indexUrl:'https://www.gov.spb.ru/gov/terr/reg_kurort/molodezhnaya-politika/',organizations:[],clubs:[],notes:source.notes,userNote:source.userNote};
for(const club of clubs){
 const center=club.organization,clubRows=source.rows.filter(r=>r.venue===club.name||r.slots.some(s=>s.venue===club.name)).map(r=>({...r,slots:r.slots.filter(s=>(s.venue??r.venue)===club.name)})).filter(r=>r.slots.length||r.venue===club.name);
 club.officialUrl=center==='sniper'?rootUrls.sniper+'kontakty.html':center==='voshod'?page('voshod-contacts').url:rootUrls.molodost;
 club.sourceUrl=scheduleUrls[center];club.sourceCheckedAt=date;club.vkUrl=ownVk[club.name]??centerVk[center];club.email=center==='voshod'?'sportvoshod@mail.ru':center==='molodost'?'molodostr@yandex.ru':'pmcsniper1111@mail.ru';
 if(!ownVk[club.name]&&center!=='molodost')club.vkUrlSharedWith=clubs.filter(c=>c.organization===center&&c.name!==club.name).map(c=>c.name);
 if(center==='molodost'){club.phoneHistory=[{value:club.phone,source:'Городской документ; дополнительный телефон также есть в DOCX',status:'additional'}];club.phone='+7 (812) 596-80-01';}
 const fact={name:club.name,organization:center,url:club.officialUrl,sourceUrl:scheduleUrls[center],sourceLines:page(center==='voshod'?'voshod-activities':center==='molodost'?'molodost-schedule':'sniper-schedule').text.split('\n').filter(Boolean),vkEvidence:ownVk[club.name]?'Собственное сообщество площадки из заметки пользователя, присланной 24.10.2026':'Общее сообщество учреждения; опубликовано на официальном сайте и в заметке пользователя',freeActivities:[],paidActivities:[],sourceRecords:clubRows,notes:[],userNote:{path:source.userNote.path,text:noteSlices[center]}};
 club.activitySchedule=[];club.activityConditions=[];club.activityPages=[];
 function add(title,url){const activity=canonical(club,title);if(!club.activities.includes(activity))club.activities.push(activity);
  if(!club.activityPages.some(p=>p.catalogActivity===activity))club.activityPages.push({title,catalogActivity:activity,officialUrl:url??(center==='sniper'&&sniperCards[title]?page('sniper-programme-'+sniperCards[title]).url:scheduleUrls[center]),...(communityFor(center,title)?{vkUrl:communityFor(center,title),vkSourceType:'user_note',vkSourcePath:source.userNote.path}:{}),sourceCheckedAt:date});
  if(!fact.freeActivities.includes(activity))fact.freeActivities.push(activity);
  return activity;
 }
 for(const r of clubRows.filter(r=>r.kind==='regular')){
  const activity=add(r.activity);
  let record=club.activitySchedule.find(a=>a.activity===activity);
  if(!record){record={activity,sourceType:center==='molodost'?'official_web':'official_pdf',sourceUrl:center==='voshod'?r.sourceUrl:scheduleUrls[center],sourceCheckedAt:date,sourcePeriod:r.sourcePeriod,...(r.effectiveFrom?{effectiveFrom:r.effectiveFrom}:{}),...(r.effectiveTo?{effectiveTo:r.effectiveTo,seasonalStatus:'expired'}:{}),sourceNote:center==='molodost'?'Архивный летний график: с 01.06.2026 по 31.08.2026. Срок его действия завершён; актуальные осенние дни и время уточни у клуба.':center==='sniper'?'График с 12.10.2026. В нём указаны часы секций без деления на возрастные группы. Перед визитом уточни время своей группы и наличие мест.':'Официальный график на 2026 год, утверждён 12.01.2026. Уточни возраст и наличие мест в выбранной бесплатной группе.',schedule:[]};club.activitySchedule.push(record);}
  for(const s of r.slots){let room=s.room.replace(/\(?\s*(?:группа\s*[123]|[123]\s*группа)\s*\)?/gi,'').replace(/[,\s]+$/,'').trim();if(center==='molodost'&&activity==='Настольный теннис'&&s.group==='Группа 2')room='Зал настольного тенниса; этаж уточни';record.schedule.push({...s,group:s.group||activity,room});}
  if(r.notes?.length)record.sourceNote+=' В DOCX дополнительно указан выезд на экскурсию в третье воскресенье месяца; время выезда уточни у организатора.';
 }
 if(club.name==='Восход: Володарского'){add('Пилатес');add('Функционально-силовая тренировка');fact.notes.push('Расписание фитнеса на официальной странице не опубликовано. Пилатес и ФСТ названы бесплатными для 14-35 лет в присланном описании VK; часы аэробной гимнастики 36+ не используются.');}
 if(club.name==='Снайпер: Исполкомская'){add('Арт-студия «Творческая мастерская»');fact.notes.push('В заметке пользователя АРТ-студия названа отдельным объединением; в официальной январской карточке заголовок объединён с клубом «Встреча». Часы «Встречи» не приписаны АРТ-студии.','В октябрьской сетке ОФП указан Березун В. В.; январская карточка и заметка ещё называют Горскову В. В. Ссылки сообщества соответствуют направлению, персональный контакт не заменяется предположением.');}
 if(club.name==='Снайпер: Ленина'){club.address='г. Зеленогорск, пр. Ленина, д. 25';fact.notes.push('Уточнён тип улицы: в официальном графике проспект Ленина, 25. Ранее предоставленная пользователем точка сохраняется без изменения.','Субботний бокс отделён от понедельника и среды на Исполкомской. Платные шахматы «Юный вундеркинд» и «Оздоровительный фитнес» не смешиваются с бесплатными секциями.');fact.paidActivities.push('Шахматы «Юный вундеркинд»','Оздоровительный фитнес');}
 if(club.name==='Снайпер: Привокзальная')fact.notes.push('В городском документе ноль бесплатных групп. Нового подтверждённого расписания по этому адресу не найдено.');
 if(center==='voshod'){fact.notes.push('На сайте, в расписаниях и в заметке встречаются разные составы специалистов; часы взяты из утверждённых PDF. Паркур у Володарского, 31 записан в исследовании как дополнительная открытая площадка без сетки занятий.','Тарифы 2025 и дополнение 2023 года используются для различения платных вариантов; актуальная стоимость 2026 года не подтверждена.');if(club.name==='Восход: Володарского')fact.paidActivities.push('Аэробная гимнастика 36+; в городском платном разделе также стретчинг и pro-фитнес');if(club.name==='Восход: Приморское шоссе, 270')fact.paidActivities.push('ОФП с элементами настольного тенниса 7-13 лет (перечень 2025)');if(club.name==='Восход: Приморское шоссе, 280')fact.paidActivities.push('Грепплинг 4-13 лет и 36+ (перечень 2025)','ОФП с элементами дзюдо 5-13 лет (перечень 2025; в присланном описании 4-7 лет)','ОФП с элементами вольной борьбы 5-13 лет (перечень 2025)');}
 if(center==='molodost'){fact.notes.push(...source.notes.filter(n=>/Молодости|Краеведение|HTML и DOCX/.test(n)));fact.paidActivities.push('Дзюдо «Молния»','ИЗО «Творчество»');}
 for(const a of club.activities){
  const mapped=club.activityPages.find(p=>p.catalogActivity===a),city=source.documents.find(d=>d.center===center&&d.kind==='city_free_paid');
  club.activityConditions.push({activity:a,sourceType:center==='sniper'?'official_pdf_and_user_note':'official_web_and_user_note',sourceUrl:center==='voshod'?page('voshod-about').url:center==='molodost'?page('molodost-about').url:city.url,sourceCheckedAt:date,sourceText:center==='sniper'?'Бесплатные занятия в бюджетной группе. Возраст, состав группы и наличие мест уточни при записи.':'Бесплатные группы для молодёжи 14-35 лет. Возраст, состав конкретной группы и наличие мест уточни у организатора.'});
  if(!mapped&&center==='voshod')club.activityPages.push({title:a,catalogActivity:a,officialUrl:scheduleUrls.voshod,...(communityFor(center,a)?{vkUrl:communityFor(center,a),vkSourceType:'user_note',vkSourcePath:source.userNote.path}:{}),sourceCheckedAt:date});
 }
 if(center==='molodost')club.note='На сайте опубликован летний график по 31 августа 2026 года. Актуальное осеннее расписание и набор уточни перед визитом.';
 else if(club.name!=='Снайпер: Привокзальная')club.note='Перед первым посещением уточни возраст и наличие мест в бесплатной группе.';
 fact.notes.push('Заметка VK предоставлена пользователем; страницы VK напрямую не открывались.');
 evidence.clubs.push(fact);
}
const manual=await read('data/manual-club-coordinates.json'),oldAddress=(await read(baseline)).find(c=>c.name==='Снайпер: Ленина').address,newAddress=clubs.find(c=>c.name==='Снайпер: Ленина').address;
const id=a=>hash('kurortny\0'+a.toLocaleLowerCase('ru')).slice(0,12),oldId=id(oldAddress),newId=id(newAddress);
if(manual.overrides[oldId]){manual.overrides[newId]={...manual.overrides[oldId],addressHistory:[...(manual.overrides[oldId].addressHistory??[]),{oldId,address:oldAddress,newAddress,sourceUrl:scheduleUrls.sniper,checkedAt:date,note:'Уточнён тип улицы; пользовательская точка сохранена без сдвига.'}]};delete manual.overrides[oldId];await write('data/manual-club-coordinates.json',manual);}
const centers=await read('data/research/pmc-centers-contacts.json');
for(const name of ['voshod','molodost','sniper']){const center=centers.find(c=>c.id===name);assert(center,name);center.links.site=rootUrls[name];center.links.vk=centerVk[name];center.source=page(name+'-contacts').url;center.sourceCheckedAt=date;if(name==='molodost')center.phones=['+7 (812) 596-80-01'];if(name==='voshod')center.address='г. Сестрорецк, Приморское ш., д. 286';evidence.organizations.push({...center});}
assert.equal(clubs.length,9);assert.equal(clubs.reduce((n,c)=>n+c.activitySchedule.length,0),40);assert.equal(clubs.reduce((n,c)=>n+c.activitySchedule.reduce((m,r)=>m+r.schedule.length,0),0),208);
assert(clubs.find(c=>c.name==='Снайпер: Привокзальная').activities.length===0);
assert(!clubs.some(c=>c.activities.some(a=>/Юный вундеркинд|Оздоровительный фитнес|Молния|Творчество|Аэробная гимнастика/.test(a))));
await write(catalog,clubs);await write('data/research/kurortny-official-evidence.json',evidence);await write('data/research/pmc-centers-contacts.json',centers);
console.log(JSON.stringify({clubs:clubs.length,activities:clubs.reduce((n,c)=>n+c.activities.length,0),schedules:40,slots:208,addressMigration:{oldId,newId}}));
