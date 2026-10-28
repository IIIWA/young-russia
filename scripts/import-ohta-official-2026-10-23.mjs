import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const read=async f=>JSON.parse(await fs.readFile(f,'utf8'));
const write=async(f,d)=>fs.writeFile(f,JSON.stringify(d,null,2)+'\n');
const date='2026-10-23',source=await read('data/research/ohta-structured-source-2026-10-23.json'),transcription=await read('data/research/ohta-schedule-transcription-2026-10-23.json');
const backup='outputs/ohta-before-import-2026-10-23';await fs.mkdir(backup,{recursive:true});
for(const f of ['clubs-krasnogvardeysky.json','manual-club-coordinates.json','club-coordinates.json']){try{await fs.copyFile('data/'+f,backup+'/'+f,fs.constants.COPYFILE_EXCL);}catch(e){if(e.code!=='EEXIST')throw e;}}
// Always start from the preserved source so a repeat import cannot change route indices.
const clubs=await read('data/research/ohta-catalog-before-2026-10-23.json');
const names={'4k':'4К',adrenalin:'Адреналин',akvamarin:'Аквамарин',berezka:'Берёзка',dialog:'Диалог',fakel:'Факел',faktura:'Фактура',izmerenie:'Измерение',kvadrat:'Квадрат',kvartiraru:'Квартира.ру',meteor:'Метеор',neo:'Нео',neva:'Нева',ostrova:'Острова',raid:'Рейд 2.0',rodnik:'Родник',sosedi:'Соседи',sovremennik:'Современник',teplo:'Тепло',tochka:'Точка',vega:'Вега',zov:'ZOV'};
const norm=s=>s.toLocaleLowerCase('ru').replaceAll('ё','е').replace(/[^а-яa-z0-9²]/g,'');
const display=s=>s.trim().replace(/\.\s*$/,'').replace(/^[«"“]([^«»"“”]*)[»"”]$/,'$1').replace(/"([^"\n]+)"/g,'«$1»').replace(/\s+/g,' ');
const oldFree={adrenalin:['Фитнес','Йога','Добровольчество'],akvamarin:['Допризывная подготовка','Школа поисковика','Историческая реконструкция'],tochka:['Вокал','Настольные игры','Ударные инструменты','Творчество'],dialog:['ОФП','Вокал','Японский язык','Китайский язык','Настольные игры'],neo:['Театр','Барабаны','Искусство'],fakel:['Дизайн','Изобразительное искусство'],rodnik:['Танцы','Тхэквондо','Вокал','Гитара'],teplo:['Добровольчество','Графический дизайн','Английский язык','Гончарная мастерская','Настольные игры'],neva:['Волейбол','Баскетбол','Футбол'],izmerenie:['Английский язык','Шахматы'],vega:[],sovremennik:['Театр','Сценическая поэзия','Гитара'],kvadrat:['Стретчинг','Фотография','Танцы','Театр'],faktura:['Дизайн одежды','Фитнес','Йога'],zov:['Военно-патриотическая подготовка','Первая помощь'],raid:['Школа поисковика','Историческая реконструкция','Музейная работа'],ostrova:['ОФП','Настольные игры','Добровольчество','Психологическая мастерская','Программирование'],kvartiraru:['Психологическая помощь','Японский язык','Корейский язык'],berezka:['Рукоделие','Вокал','Фольклор','Туризм','Настольные игры'],meteor:['ОФП','Скалолазание','Настольный теннис','Фитнес'],sosedi:['Киноклуб','Книжный клуб','Вокал'],'4k':['Кинокомната']};
// Named programmes are matched to the explicit free profile on the same club page.
// Rows outside these families remain in the internal transcription, never in public tables.
const families={
 '4k':[[/кинокомната/i,'КиноКомната']],
 adrenalin:[[/танцы народов/i,'танцы народов мира'],[/подсолнушки/i,'Подсолнушки'],[/^фитнес$/i,'фитнес'],[/патруль добра/i,'патруль добра'],[/место для своих/i,'место для своих'],[/йога/i,'йога Айенгара']],
 akvamarin:[[/оружие победы|допризывная|трудовые будни|возвращение|солдатский медальон|дорогами войны/i,'школа поисковика']],
 berezka:[[/фитнес/i,'студия фитнеса'],[/вокал/i,'вокальная студия'],[/танца/i,'студия танца'],[/рисунка/i,'студия рисунка'],[/живописи/i,'студия живописи'],[/растяжки/i,'студия растяжки'],[/настольных игр/i,'клуб настольных игр'],[/турис/i,'секция туризма'],[/фольклор|народные инструменты|ремесленная/i,'этно-клуб молодой семьи']],
 dialog:[[/джиу-джитсу/i,'ОФП с элементами'],[/зодиак/i,'Зодиак'],[/японского/i,'японский язык'],[/семейный клуб/i,'семейный клуб'],[/медиа/i,'медиа студия'],[/маджонг/i,'маджонга'],[/карате/i,'школа карате'],[/школа го/i,'игры в го'],[/цигун/i,'Цигун'],[/творческая студия/i,'творческая студия'],[/профориентац/i,'профориентация']],
 fakel:[[/ораторское/i,'ораторское искусство'],[/дизайн/i,'дизайн'],[/доброохта/i,'Добро.Центр']],
 faktura:[[/женский клуб/i,'женский клуб'],[/творческая мастерская|шитью/i,'дизайн и конструирование'],[/боди.?фитнес/i,'групповые тренировки'],[/английский/i,'английский язык'],[/кутюрье/i,'школа моделей'],[/гиревой|атлетик|кроссфит|силов/i,'силовые тренировки'],[/йога/i,'хатха-йога']],
 izmerenie:[[/магия кино/i,'киноклуб'],[/троянский конь/i,'шахматы'],[/акваферма/i,'экология'],[/английского/i,'английский язык']],
 kvadrat:[[/пауэрлифтинг/i,'пауэрлифтинг'],[/офп|функциональный|мягкий фитнес|боди фитнес|стретчинг|гимнастика|хайхиллс/i,'фитнес-программы'],[/беговой/i,'беговой клуб'],[/пилатес/i,'пилатес'],[/сап-серфинг/i,'САП-гребля'],[/фотостудия/i,'фотостудия'],[/актерского|театр|театральная/i,'актерские тренинги'],[/эмпатия/i,'студия психологии'],[/изостудия|палитра/i,'академический рисунок'],[/язык кино/i,'киноклуб на английском'],[/разговорный.*английского/i,'разговорный английский'],[/студия.*рок/i,'рок-студия'],[/студия гитары/i,'гитара'],[/вокал/i,'вокальный ансамбль'],[/тренажерный/i,'тренажерный зал']],
 kvartiraru:[[/японии и кореи/i,'японского и корейского'],[/психологическое сопровождение/i,'психологическое консультирование'],[/фандом/i,'фандомный клуб']],
 meteor:[[/настольного тенниса/i,'настольный теннис'],[/^секция офп$/i,'тренажерный зал'],[/скалолазани/i,'скалолазания'],[/йога/i,'йога'],[/родители/i,'семейный клуб'],[/метеорактивити/i,'МетеорАктивити'],[/настольные игры/i,'настольные игры'],[/карта профессий/i,'карта профессий'],[/художественной гимнастики/i,'художественная гимнастика'],[/бодибилдинг|троеборье/i,'тренажерный зал'],[/женский фитнес|фитнес для всех/i,'женский фитнес']],
 neo:[[/ковчег/i,'Ковчег'],[/академический музыкальный/i,'Музыкальный Театр'],[/нео микс/i,'Нео-Микс'],[/мастерская звука/i,'Мастерская звука'],[/музыка для всех/i,'Музыка для всех'],[/биоарт/i,'БиоАрт'],[/драм стафф/i,'Драм стаф'],[/отряд.*победа/i,'Юнармия']],
 neva:[[/^футбол$/i,'футбол'],[/волейбол/i,'волейбол'],[/баскетбол/i,'баскетбол'],[/настольный теннис/i,'настольный теннис'],[/настольные игры/i,'настольные игры'],[/музыка невы/i,'вокал'],[/дружина/i,'Дружина']],
 ostrova:[[/силовые|круговая/i,'силовые тренировки'],[/путь творчества/i,'декоративно-прикладное'],[/психологическ/i,'психологический клуб'],[/английского/i,'клуб английского'],[/нашe место|наше место/i,'инклюзивный клуб'],[/растяжка|стретчинг/i,'динамическая растяжка'],[/лапа помощи/i,'добровольчество']],
 raid:[[/подвиг ленинградцев|ленинградская армия|возвращая имена|спасённые|хранители памяти|судьба солдата/i,'поисковые экспедиции']],
 rodnik:[[/тхэквондо/i,'тхэквондо'],[/творческий калейдоскоп/i,'декоративно-прикладное'],[/настольн|игротека/i,'настольные игры'],[/фитнеса и растяжки/i,'растяжка'],[/эстрадного вокала/i,'эстрадный вокал'],[/пауэрлифтинг|атлетизм|силового тренинга|секция офп/i,'силовые тренировки'],[/гитар/i,'игра на гитаре'],[/моделизм/i,'масштабный моделизм']],
 sosedi:[[/вокал/i,'вокальная студия'],[/ораторское/i,'ораторское'],[/кинолаб/i,'киноклуб'],[/стриминг/i,'стриминг'],[/яркие краски/i,'ИЗО'],[/инновационные игры/i,'инновационные игры'],[/книжный/i,'книжный клуб']],
 sovremennik:[[/экотеатр/i,'ЭКОтеатр'],[/сценической поэзии/i,'лаборатория сценической поэзии'],[/звенящая струна/i,'игра на гитаре'],[/театр историй/i,'театр']],
 teplo:[[/графический дизайн/i,'графический дизайн'],[/настольных игр/i,'настольные игры'],[/гончарная/i,'керамическая мастерская'],[/^дизайн$|веронитка|швейн/i,'дизайн одежды'],[/модная иллюстрация/i,'фешн иллюстрация'],[/фотографии/i,'фотостудия'],[/нешкола/i,'НеШкола'],[/здоровое тело|спортивный заряд/i,'фитнес'],[/киностудия/i,'киноклуб'],[/овсянка/i,'разговорного английского'],[/графит/i,'леттеринг'],[/косплей/i,'косплей']],
 tochka:[[/творческая лаборатория|безграничное творчество/i,'декоративно-прикладное'],[/ударной установке/i,'студия игры на ударной'],[/танцевальный/i,'танцевальная студия'],[/экспериментального театра/i,'экспериментального театра'],[/прообраз/i,'театральная студия'],[/театрального грима/i,'сценический макияж'],[/^офп/i,'ОФП'],[/настольный драйв/i,'настольные игры'],[/беспилотные/i,'БПЛА']],
 zov:[[/парашют/i,'парашютная подготовка'],[/первая помощь/i,'оказание первой помощи'],[/искатели приключений|безопасный горизонт|герои каменных джунглей/i,'выживание']]
};
const review={date,excludedRows:[],unmappedRows:[],publishedRows:[],removedOldActivities:[],issues:[]},evidence={checkedAt:date,indexUrl:'https://pmcohta.ru/ourclubs2',freeConditions:'На официальном списке: бесплатно для молодёжи от 14 до 35 лет. Платные предложения вынесены в отдельные разделы карточек. Для старше 35 лет общее правило не установлено.',clubs:[]};
const notePath='YoungRussiaOBS/Источники/ВК/ВК ПМК Красногвардейского района.md',note=await fs.readFile(notePath,'utf8'),headings=[...note.matchAll(/^\*\*\[([^\]]+)\]\((https?:[^)]+)\)\*\*/gm)];
const userSections=headings.map(m=>({heading:m[1],url:m[2],line:note.slice(0,m.index).split('\n').length,text:''}));
// Bound section ends explicitly; the final section ends before the pasted VK roundup.
for(let i=0;i<headings.length;i++){let end=headings[i+1]?.index??note.length;const tail=note.indexOf('### Ждём',headings[i].index);if(tail>headings[i].index&&tail<end)end=tail;userSections[i].text=note.slice(headings[i].index,end);}
for(const page of source.clubs){
 const club=clubs.find(c=>c.name===names[page.slug]);if(!club)throw Error(page.slug);
 const previous=[...club.activities],free=page.freeActivities.filter(s=>s!=='Направления'),known=new Map();
 club.activities=previous.filter(a=>oldFree[page.slug].includes(a));club.activityRouteIndices=Object.fromEntries(previous.map((a,i)=>[a,i]));
 club.archivedActivities=previous.filter(a=>!club.activities.includes(a)).map(activity=>({activity,reason:page.slug==='vega'?'Площадка закрыта на капитальный ремонт':'Бесплатное действующее направление не подтверждено текущей карточкой',sourceUrl:page.url,checkedAt:date}));
 review.removedOldActivities.push(...club.archivedActivities.map(a=>({club:club.name,...a})));
 let nextIndex=previous.length;
 function add(label){const n=norm(label);const found=club.activities.find(a=>norm(a)===n);if(found)return found;const name=display(label);club.activities.push(name[0].toLocaleUpperCase('ru')+name.slice(1));const value=club.activities.at(-1);club.activityRouteIndices[value]=nextIndex++;return value;}
 // Free profiles without a matching timetable remain available with an honest missing-schedule message.
 for(const profile of free){if(profile.length<115)add(profile);}
 club.officialUrl=page.url;club.sourceUrl=page.url;club.sourceCheckedAt=date;
 const own=page.vkLinks.find(x=>!/(?:pmc_ohta|share\.php)/.test(x.url));
 if(own){club.vkUrl=own.url;delete club.vkUrlSharedWith;}else{delete club.vkUrl;club.vkUrlSharedWith='МЦ «Охта»';}
 const schedule=source.schedules.find(s=>s.slug===(page.slug==='raid'?'reid':page.slug==='kvartiraru'?'kvartira':page.slug)+'_schedule');
 club.activitySchedule=[];club.activityPages=[];club.activityConditions=[];
 const fact={name:club.name,slug:page.slug,url:page.url,address:club.address,freeActivities:free,paidActivities:page.paidActivities,sourceLines:page.text,sourceSha256:page.sha256,vkEvidence:own?'Размещена на официальной странице '+page.url:'Отдельная группа не найдена на официальной странице; контакт учреждения',userNote:userSections.find(s=>s.url.replace('vk.ru','vk.com')===own?.url.replace('vk.ru','vk.com'))??null,scheduleUrl:schedule?.url,notes:[],sourceRecords:[],fundingReview:[]};
 if(page.slug==='vega'){club.temporarilyClosed=true;club.description='Клуб закрыт на капитальный ремонт. Дата возобновления работы на официальной странице не указана.';club.note=club.description;fact.notes.push(club.description);}
 if(page.slug==='adrenalin'){club.address='ул. Белорусская, д. 6, корп. 2';club.addressNote='На официальной странице указан третий этаж.';fact.address=club.address;fact.notes.push('Прежнее «корп. 2 и 3» исправлено: в источнике корпус 2, третий этаж. Пользовательская точка сохранена.');}
 if(page.slug==='4k')club.note='На официальной странице опубликовано направление «КиноКомната» и отдельное расписание. Возраст группы и наличие мест уточни у организатора.';
 if(page.slug==='kvadrat')fact.notes.push('В понедельник «Вспышка» одновременно указана в кабинетах 210 и 216. Оба варианта сохранены; место необходимо уточнить.');
 if(page.slug==='ostrova')fact.notes.push('В title страницы расписания ошибочно написано «Современник»; видимый заголовок и ссылка карточки относятся к «Островам».');
 const rs=transcription.rows.filter(r=>r.clubSlug===(page.slug==='raid'?'reid':page.slug==='kvartiraru'?'kvartira':page.slug));
 for(const row of rs){
  fact.sourceRecords.push(row);
  let reason='',profile='';
  if(/х\s*[/\\]\s*р/iu.test(row.activity))reason='Явная пометка х/р: платное направление';
  else if(page.slug==='rodnik'&&/чирлидинг/i.test(row.activity))reason='Чирлидинг найден только в платном разделе; отсутствие х/р в части строк не подтверждает бесплатность';
  else{
   const rule=families[page.slug]?.find(([pattern])=>pattern.test(row.activity));
   if(rule)profile=free.find(p=>p.toLocaleLowerCase('ru').includes(rule[1].toLocaleLowerCase('ru')))??'';
   if(!profile)reason='Не подтверждено соответствие конкретному бесплатному направлению карточки';
  }
  if(reason){const held={club:club.name,...row,reason};fact.fundingReview.push(held);(reason.startsWith('Явная')?review.excludedRows:review.unmappedRows).push(held);continue;}
  let canonical=display(row.activity);
  if(/молодёжный театр.*театр²/i.test(canonical))canonical='Молодёжный театр «Театр²»';
  if(/студия.*рок-ансамбли/i.test(canonical))canonical='Студия «Рок-ансамбли. Гитара, бас-гитара»';
  if(norm(canonical)==='пилатесрелакс')canonical='Пилатес «Релакс»';
  const key=norm(canonical);let activity=known.get(key);if(!activity){activity=add(canonical);known.set(key,activity);}
  let record=club.activitySchedule.find(x=>x.activity===activity);
  if(!record){record={activity,sourceType:'official_web',sourceUrl:row.sourceUrl,sourceCheckedAt:date,sourceNote:'Сетка официального сайта сверена 23.10.2026. Дата начала действия не указана. В карточке подтверждена бесплатная часть направления для 14-35 лет. Возраст каждой группы в сетке не указан; перед визитом уточни время бесплатной группы своего возраста. Детские платные предложения с тем же названием не входят в условия бесплатного участия.',freeProfile:profile,schedule:[]};if(page.slug==='kvadrat'&&/Вспышка/.test(activity))record.sourceNote+=' В понедельник источник одновременно указывает кабинеты 210 и 216 на одинаковое время. Уточни кабинет у клуба.';club.activitySchedule.push(record);}
  const slot={day:row.day,time:row.time,...(row.group?{group:row.group}:{}),...(row.room?{room:row.room}:{})};
  if(!record.schedule.some(s=>JSON.stringify(s)===JSON.stringify(slot)))record.schedule.push(slot);
  review.publishedRows.push({club:club.name,activity,freeProfile:profile,...row});
 }
 for(const activity of club.activities){club.activityPages.push({title:activity,catalogActivity:activity,officialUrl:page.url,sourceUrl:page.url,sourceCheckedAt:date});club.activityConditions.push({activity,sourceType:'official_web',sourceUrl:page.url,sourceCheckedAt:date,sourceText:'Бесплатные направления для молодёжи 14-35 лет. Конкретный возраст группы, места и порядок записи уточни у клуба'});}
 if(fact.fundingReview.length)fact.notes.push(`Во внутренней расшифровке оставлено ${fact.fundingReview.length} платных или не подтверждённых как бесплатные интервалов; на сайт они не передаются.`);
 evidence.clubs.push(fact);
}
evidence.userNote={path:notePath,sha256:createHash('sha256').update(note).digest('hex'),sections:userSections};
await write('data/clubs-krasnogvardeysky.json',clubs);await write('data/research/krasnogvardeysky-official-evidence.json',evidence);await write('data/research/krasnogvardeysky-import-review-2026-10-23.json',review);
const centers=await read('data/research/pmc-centers-contacts.json'),center=centers.find(c=>c.id==='ohta');center.name='МЦ «Охта»';await write('data/research/pmc-centers-contacts.json',centers);
const manual=await read('data/manual-club-coordinates.json'),oldId='5e7a14938b11',newId=createHash('sha256').update('krasnogvardeysky\0'+clubs[0].address.toLocaleLowerCase('ru')).digest('hex').slice(0,12);
if(manual.overrides[oldId]){manual.overrides[newId]={...manual.overrides[oldId],addressHistory:[...(manual.overrides[oldId].addressHistory??[]),{oldId,address:'ул. Белорусская, д. 6, корп. 2 и 3',newAddress:clubs[0].address,sourceUrl:'https://pmcohta.ru/adrenalin',checkedAt:date,note:'Исправлена запись корпуса; ранее предоставленная пользователем точка сохранена.'}]};delete manual.overrides[oldId];await write('data/manual-club-coordinates.json',manual);}
console.log(JSON.stringify({clubs:clubs.length,activities:clubs.reduce((n,c)=>n+c.activities.length,0),schedules:clubs.reduce((n,c)=>n+c.activitySchedule.length,0),publishedSourceRows:review.publishedRows.length,paid:review.excludedRows.length,review:review.unmappedRows.length,archived:review.removedOldActivities.length,oldId,newId}));
