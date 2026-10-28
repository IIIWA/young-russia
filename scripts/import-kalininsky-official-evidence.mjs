import fs from 'node:fs/promises';
import {writeGeneratedFile} from './write-generated-file.mjs';
const read=async f=>JSON.parse(await fs.readFile(f,'utf8'));
const [clubs,evidence,transcription,city]=await Promise.all(['data/research/kalininsky-catalog-before-2026-10-23.json','data/research/kalininsky-official-evidence.json','data/research/kalininsky-schedule-transcription-2026-10-23.json','data/research/kalininsky-city-free-evidence-2026-10-23.json'].map(read));
const norm=s=>s.toLowerCase().replaceAll('ё','е').replace(/[«»".,()[\]\s–—-]/g,'');
const aliases={
 'Студия ИЗО: история костюма':'Изобразительное искусство',
 'Студия ДПИ':'Декоративно-прикладное творчество','ДПИ':'Декоративно-прикладное творчество','Студия изобразительного искусства':'Изобразительное искусство','Изостудия':'Изобразительное искусство',
 'Секция ОФП':'ОФП','Школа добровольцев':'Школа добровольца','Народный танец':'Народные танцы','Современные танцы':'Современный танец','Эстрадные танцы':'Эстрадный танец','Секция шахмат':'Шахматы','Студия вокала':'Вокальная студия',
 'Студия мульти-медиа-дизайна':'Мультимедиадизайн','Мульти-медиа-дизайн':'Мультимедиадизайн','Студия игры на барабанах':'Игра на барабанах','Секция бильярда':'Бильярд','Секция дартса':'Дартс','Студия народной песни':'Народная песня','Студия фортепиано':'Фортепиано','Студия акварели':'Акварель','Секция фитнеса':'Фитнес','Секция современного танца':'Современный танец',
 'Студия журналистики':'Журналистика','Секция «Операторы дронов»':'Операторы дронов','Тренажерный зал':'Атлетическая гимнастика','Секция настольного футбола (кикер)':'Настольный футбол','Настольный футбол (кикер)':'Настольный футбол','Клуб молодой семьи семья до 35 лет':'Клуб молодой семьи','Батик (роспись по ткани)':'Батик',
 'Галерея молодежного искусство «АртПРО»':'Галерея «АртПРО»','Молодежный коворкинг':'Молодёжный коворкинг','МСО':'Место свободного общения','Студия ИЗО — история костюма':'Изобразительное искусство',
};
const byClub={
 'Атлант':{'Школа добровольца':'Школа добровольчества','Место свободного общения «Берлога»':'Пространство общения «Берлога»','Пространство свободного общения «Берлога» (игровая приставка, настольные игры)':'Пространство общения «Берлога»','Студия Арт-Дизайн':'Арт-дизайн','Брейк-данс':'Брейкинг','ОФП (кикер)':'Настольный футбол'},
 'Бригантина':{'Школа добровольца':'Школа добровольцев'},'ВКадре':{'Школа добровольца':'Школа добровольцев'},'Алые Паруса':{'Школа добровольца':'Школа добровольцев'},
 'Дружба':{'Аэробика':'Аэробика и акробатика','Акробатика':'Аэробика и акробатика'},
 'Непокорённых':{'Школа добровольца':'Школа добровольцев'},'Сцена':{'Школа добровольца':'Школа добровольцев','Место свободного общения':'Территория общения'},'Ровесник':{'Школа добровольца':'Школа добровольцев','Студия КВН':'КВН','Театр':'Театральная студия'},'#Водинголос':{'Школа добровольца':'Школа добровольцев'},
 'Парус':{'Эстрадный вокал':'Вокальная студия','Место свободного общения':'Территория общения'},
 'Пионер':{'Вокальная студия':'Эстрадный вокал','Секция шахмат «Ферзь»':'Шахматы','Клуб молодой семьи «Супер семейка»':'Клуб молодой семьи','ИЗО «Пространство Цвета»':'Изобразительное искусство','ДПИ «Внеформата»':'Декоративно-прикладное творчество','Народные танцы «РОСИНКА»':'Народные танцы','Поисковый отряд «Неман»':'Поисковый отряд','Школа добровольца «Помоги СВОим»':'Школа добровольца','Фото и журналистика':'Журналистика','МСО «Тепло»':'Место свободного общения','Эстрадный танец «Истома»':'Эстрадный танец'},
 'Ритмикс':{'Современный танец (хип-хоп)':'Хип-хоп'},'Создание':{'Мастерская форм (фото и видео)':'Фото и видео','Керамика':'Мастерская керамики','Швейное мастерство':'Швейная мастерская'},
 'Спасатель':{'Клуб настольных военно-стратегических и тактических игр':'Настольные военно-стратегические игры','Военно-тактические настольные игры':'Настольные военно-стратегические игры'},
};
function clean(s){
 if(s.startsWith('High heels'))return 'High heels и контемп';
 if(s.startsWith('Бильярд, игровая'))return 'Бильярд и территория общения';
 if(s.startsWith('Территория общения,'))return 'Территория общения';
 if(s.startsWith('Игровая приставка, территория'))return 'Территория общения';
 if(s.startsWith('Игровая приставка, настольные'))return 'Настольные игры';
 if(s.startsWith('Студия современного ,'))return 'Современный танец';
 return s.replace(/\s*\((?:мед\.|юноши|ДПИ)[^)]*\)/gi,'').replace(/[,\s.]+(?:мед\.?\s*допуск|юноши|девушки|возможность|с подготовкой|\d{1,2}[-–]\d{1,2}|\d{1,2}\+|ОВЗ).*$/i,'').replace(/\s*14-35\s*лет.*$/i,'').replace(/[\s,.]+$/,'').replaceAll('\u00a0',' ').replace(' — ',': ').trim();
}
function canonical(club,s){
 const concept=x=>byClub[club.name]?.[x]??byClub[club.name]?.[aliases[x]]??aliases[x]??x;
 const v=concept(s);return club.activities.find(x=>norm(concept(x))===norm(v))??v;
}
const report={updatedAt:'2026-10-23',excludedRows:[],unmappedRows:[],addedActivities:[],scheduleRecords:0};
for(const club of clubs){
 const fact=evidence.clubs.find(x=>norm(x.name)===norm(club.name));if(!fact)throw Error(club.name);
 club.officialUrl=fact.officialUrl;club.sourceCheckedAt='2026-10-23';if(fact.vkUrl)club.vkUrl=fact.vkUrl;
 club.contactSource={url:fact.officialUrl,checkedAt:'2026-10-23',vkEvidence:'Ссылка опубликована на официальном сайте; сама страница VK не проверена.'};
 if(fact.officialPhone&&fact.officialPhone!==club.phone){club.phoneHistory=[{value:club.phone,source:'Каталог до сверки 23.10.2026',status:'not_listed_on_current_club_page'}];club.phone=fact.officialPhone;}
 club.activityConditions=[];
 for(const raw of fact.freeActivities)for(const cleaned of raw.startsWith('High heels')?['High heels','Контемп']:[clean(raw)]){let name=canonical(club,cleaned);if(!club.activities.includes(name)){club.activities.push(name);report.addedActivities.push({club:club.name,activity:name,source:'official_free_list'});}club.activityConditions.push({activity:name,sourceText:raw,sourceUrl:evidence.indexUrl});}
 const cityFact=city.clubs.find(c=>c.name===club.name);
 for(const raw of cityFact?.freeActivities??[]){const name=canonical(club,raw);if(!club.activities.includes(name)){club.activities.push(name);report.addedActivities.push({club:club.name,activity:name,source:'city_free_column'});}club.activityConditions.push({activity:name,sourceText:`${raw}; в бесплатной колонке городского документа, загруженного 01.06.2026. Текущие условия и возраст группы уточни`,sourceUrl:city.sourceUrl,sourcePage:cityFact.page});}
 const pages=transcription.pages.filter(p=>p.source.startsWith('https://pmc-kalininsky.spb.ru/')&&fact.scheduleDocuments.some(d=>d.url===p.source));
 const candidates=[];
 for(const page of pages)for(const row of page.rows){
  if(page.funding==='commercial'||row.review||row.effectiveTo&&row.effectiveTo<'2026-10-23'){report.excludedRows.push({club:club.name,activity:row.activity,page:page.page,source:page.source,reason:row.review??'Коммерческая страница'});continue;}
  let name=canonical(club,row.activity);
  if(!club.activities.includes(name)){
   if(page.funding==='budget'){club.activities.push(name);report.addedActivities.push({club:club.name,activity:name,source:'dated_budget_schedule'});}
   else {report.unmappedRows.push({club:club.name,activity:row.activity,source:page.source,page:page.page,reason:'Бесплатность или соответствие направлению из списка не подтверждены'});continue;}
  }
  candidates.push({name,page,row});
 }
 const names=[...new Set(candidates.map(x=>x.name))];club.activitySchedule=[];
 for(const name of names){const rows=candidates.filter(x=>x.name===name),date=rows.map(x=>x.row.effectiveFrom??x.page.effectiveFrom).sort().at(-1),latest=rows.filter(x=>(x.row.effectiveFrom??x.page.effectiveFrom)===date),summer=!latest[0].page.sourcePeriod;
  const schedule=latest.flatMap(({row,page})=>row.slots.map(slot=>({...slot,group:`${row.activity===name?'':row.activity+'; '}${row.group}`,room:row.room,sourcePage:page.page})));
  if(!schedule.length)continue;
  club.activitySchedule.push({activity:name,sourceType:'official_pdf',sourceUrl:latest[0].page.source,effectiveFrom:date,sourcePeriod:summer?'летний график 2026':'осень 2026',sourceNote:summer?'На сайте ПМЦ документ размещён как летний график. Действующее осеннее расписание и место занятий нужно уточнить.':'Официальный осенний график. Перед посещением уточни набор и возможные изменения.',schedule});
 }
 report.scheduleRecords+=club.activitySchedule.length;
 // Точные места и ограничения хранятся в строках PDF; часы другого клуба не присваиваются кулинарной студии.
 club.scheduleReview={source:'data/research/kalininsky-schedule-transcription-2026-10-23.json',checkedAt:'2026-10-23',notes:fact.notes};
 if(club.name==='Пионер')club.nameConfirmedAt='2026-10-23';
 if(club.name==='Окна'){
  club.openingHours={sourceUrl:'https://pmc-kalininsky.spb.ru/video/SChfu-1uivw.jpg',sourceType:'official_image',sourceCheckedAt:'2026-10-23',schedule:[{days:'вторник, среда, четверг, пятница, суббота, воскресенье',time:'10:00-22:00'}],closedDays:['понедельник'],note:'Режим пространства из иллюстрации официального сайта. Это не расписание отдельного занятия; время посещения уточни перед визитом.'};
 }
 if(club.name==='Атлант'){
  club.activityPages=[{id:'atlant-breaking',catalogActivity:'Брейкинг',title:'Студия брейк-данса',vkUrl:'https://vk.com/club1881188',sourceUrl:fact.officialUrl,sourceCheckedAt:'2026-10-23',mapping:'Соответствие подтверждено названием на официальной странице клуба.'}];
  club.activityPages.push({id:'atlant-peterburgsky-weekend',catalogActivity:'Эстрадный танец',title:'Театр танца «Петербургский уикенд»',vkUrl:'https://vk.com/club1652148',sourceUrl:fact.officialUrl,mappingSourceUrl:city.sourceUrl,sourceCheckedAt:'2026-10-23',mapping:'Соответствие подтверждено бесплатной колонкой городского документа, страница 4. Набор уточняется.'});
 }
 if(club.name==='Парус'){
  club.additionalOfficialUrl='https://www.pmc-parus.spb.ru/';
  const linkMap=[['ОФП','ОФП, растяжка, здоровая спина','Bod'],['Танцевальный фитнес','Танцевальный фитнес','graf2'],['K-pop танец','Кавер-студия «НФ»','Kpop'],['Эстрадный танец','Студия «Горизонт»','gor1'],['Мастерская событий','Ивент-студия','Event'],['Мастермайнд: групповая работа над целями','Деловые встречи «Сила окружения»','sul'],['Вокальная студия','Студия «Автограф»','avt'],['Спортивно-патриотическая секция','Формирование «Торнадо»','TR'],['Клуб молодой семьи','«Поэзия творчества»','tvor1'],['Студия рукоделия','Рукоделие и ДПИ','tvor1'],['Роспись по дереву','Роспись по дереву','pal2'],['Акварель','ИЗО «Акварель»','pal1'],['Квест-лаборатория','Квест-лаборатория «Концепт»','dbr'],['Школа добровольца','Школа добровольцев «ФОКС»','dbr'],['Территория общения','Территория общения «Адреналин»','game']];
  club.activityPages=linkMap.filter(([a])=>club.activities.includes(a)).map(([a,t,id])=>({id:`parus-${id}-${norm(a)}`,catalogActivity:a,title:t,officialUrl:`https://www.pmc-parus.spb.ru/parus.shtml#${id}`,sourceUrl:'https://www.pmc-parus.spb.ru/parus.shtml',sourceCheckedAt:'2026-10-23',mapping:'Соответствие подтверждено описанием направления на сайте клуба.'}));
  club.activityPages.find(x=>x.catalogActivity==='Школа добровольца').vkUrl='https://vk.com/sgoodfox';
 }
}
await writeGeneratedFile('data/clubs-kalininsky.json',JSON.stringify(clubs,null,2)+'\n');
await writeGeneratedFile('data/research/kalininsky-official-evidence.json',JSON.stringify(evidence,null,2)+'\n');
await writeGeneratedFile('data/research/kalininsky-import-review-2026-10-23.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({clubs:clubs.length,activities:clubs.reduce((n,c)=>n+c.activities.length,0),scheduleRecords:report.scheduleRecords,unmappedRows:report.unmappedRows.length,excludedRows:report.excludedRows.length,addedActivities:report.addedActivities.length}));
