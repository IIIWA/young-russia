import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {writeGeneratedFile} from './write-generated-file.mjs';

// Editorial transcription: names are read together with the time block below them.
// VK content is user-supplied evidence; these pages were not opened by this importer.
const read=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const save=async(p,v)=>writeGeneratedFile(p,JSON.stringify(v,null,2)+'\n');
const date='2026-10-23',base='http://dmk.spb.ru/';
const manifest=await read('outputs/kolpinets-official-2026-10-23/manifest.json');
const clubs=await read('data/clubs-kolpinsky.json');
const archive='data/research/kolpinets-before-import-2026-10-23.json';
try{await fs.access(archive);}catch(e){if(e.code!=='ENOENT')throw e;await save(archive,{clubs,coordinates:await read('data/club-coordinates.json'),manualCoordinates:await read('data/manual-club-coordinates.json')});}
const days=['понедельник','вторник','среда','четверг','пятница','суббота','воскресенье'];
const slots=groups=>groups.flatMap(([dd,time])=>[...String(dd)].map(d=>({day:days[Number(d)-1],time})));
const a=(activity,groups,userServiceIndexes=[],extra={})=>({activity,schedule:slots(groups),userServiceIndexes,...extra});
const services=[
'«Хуашань». Китайский язык','«Резонанс». Вокал','Цифровой дизайн','Настольный теннис','Игровой клуб','Проектная мастерская','Диалог. Психология и общение','«Авангард». Дизайн и искусство','«Про тебя». Психология','Настольные игры','«Потешки». Семейный музыкальный клуб','«ПРОСТО». Молодёжные пространства','Добро.Центр ДМК Колпинского района','«Клавишный мир»','«Закон в тренде»','«Смех и точка»','Атлетическая Гимнастика','Секция Бокса','«Спорт - жизнь!». Молодежное объединение','Молодежное объединение «Даёшь молодёжь»','Медиастудия «Софит»','Секция «Шахматы»','«Курс на спорт». Спортивная секция','«Шахматы»','Степ-аэробика','Пауэрлифтинг и гиревой спорт','«Настольный теннис»','«Основы обработки фотографии и мобильной съемки»','«Старт в арт». Творческая студия','«Антикафе» в рамках объединений «Траектория подростка» и «Паутина»','«ПРОфото». Фотостудия','«Траектория подростка»','«Паутина». Волонтерское объединение','«Аргентум». Арт-студия','«Перо». Любительское объединение','Школа ведущего','Коротко. Метражно','«Иносказание»','«Лига возможностей». Любительское объединение','«Театр миниатюр»','«Вокальная лаборатория»','«Вокальная лаборатория Про». Студия эстрадного вокала','«Классика». Студия игры на акустической гитаре','«ARTем».Студия обучения игре на гитаре','«Звуки шума». Игра на барабанной установке','«Под крылом». Волонтерское объединение','Народное пение','«Пианино здесь»','«Крылья». Театральная студия','«Графический дизайн и анимация»','Уличные танцы','«Бриз». Вокальная студия','«Cantabile». Вокальная студия','«Живой звук». Гитарная студия','«Арт-территория». Творческое развитие','«Концепт» . Студия стиля и моды','«Есть контакт». Объединение для молодёжи'
];
if(services.length!==57)throw Error('User list length');
const userEvidence={receivedAt:date,sourceType:'user_message',collectionUrl:'https://vk.ru/uslugi-43117555?screen=group',directVkChecked:false,accessStatus:'Пользователь отложил прямую проверку VK; browser site-safety gate не предоставил доступ даже после access=allow.',services:services.map((title,i)=>({index:i+1,title,costText:'бесплатно',institution:'ДМК — Дом молодёжи «Колпинец»',...(i===0?{url:'https://vk.ru/market/product/khuashan-kitayskiy-yazyk-43117555-14545205'}:{})})),contacts:{vk:'https://vk.com/dm_kolpinets',telegram:'https://t.me/dm_kolpinets',max:'https://max.ru/id7817022830_gos',email:'mail@dmk.spb.ru',institutionPhone:'+7 (812) 246-43-22',venuePhone:'+7 (812) 482-56-90'},notes:['Повторы шахмат и настольного тенниса сохранены. ID отдельных услуг, кроме «Хуашань», не предоставлены. Сопоставление названия с программой не устанавливает, какой из одноимённых товаров относится к этой площадке.']};
const shared='В источнике рядом перечислены основная программа и вариант с дополнительным названием. Опубликованы общие часы этого блока; отдельный график и условия дополнительного варианта нужно уточнить.';
const venues=[
 {name:'Колпинец',slug:'kolpinets',vk:'dm_kolpinets',published:'2026-08-13',phone:'482-56-90',opening:[['пн-пт','09:00-21:00']],records:[
  a('Объединение «Траектория подростка»',[['24','09:00-18:00']],[32]),
  a('Шахматы',[['7','13:00-18:00']],[22,24],{mappingNote:'Две одноимённые услуги в пользовательской витрине; конкретный ID этой секции не установлен.'})
 ]},
 {name:'Горизонт',slug:'gorizont',vk:'gorizontklp',published:'2026-07-20',phone:'461-38-57',address:'г. Колпино, ул. Павловская, д. 82',opening:[['пн-пт','13:00-21:00'],['сб','15:00-21:00']],records:[
  a('Игра на барабанной установке «Звуки шума»',[['1456','16:00-21:00']],[45],{sourceNote:shared,sourceHeading:'Игра на барабанной установке «Звуки шума»; Основы игры на барабанной установке «26»'}),
  a('Обучение игре на гитаре «ARTем»',[['234','16:00-21:00'],['5','18:30-21:00']],[44],{sourceNote:shared,sourceHeading:'Обучение игре на гитаре «ARTем», «ARTем+»'}),
  a('Игра на акустической гитаре «Классика»',[['15','16:00-21:00'],['24','15:00-20:00']],[43],{sourceNote:shared,sourceHeading:'Студия игры на акустической гитаре «Классика», «Классика ПРО»'})
 ],unpublished:[a('Группа практической психологии «Спроси у психолога»',[['26','15:00-20:00']],[],{reason:'В присланном бесплатном перечне это название не найдено; бесплатность и набор не подтверждены.'})]},
 {name:'Фантазёры',slug:'fantazery',vk:'pmk_fantazery',published:'2026-07-20',phone:'246-43-33',address:'г. Колпино, ул. Адмиралтейская, д. 9',opening:[['пн-сб','15:00-20:00']],records:[
  a('Студия стиля и моды «Концепт»',[['46','15:00-20:00']],[56]),
  a('Творческое развитие «Арт-территория»',[['35','15:00-20:00']],[55]),
  a('Основы обработки фотографий и мобильной съёмки',[['25','15:00-20:00']],[28]),
  a('Фотостудия «ПроФото»',[['14','15:00-20:00']],[31])
 ]},
 {name:'Орлёнок',slug:'orlenok',vk:'orlenok_dmk',published:'2026-07-20',phone:'464-31-49',opening:[['пн-пт','13:00-21:00'],['сб','17:30-20:30']],records:[
  a('Шахматы',[['24','17:30-21:00'],['6','17:30-20:30']],[22,24],{mappingNote:'Две одноимённые услуги в пользовательской витрине; конкретный ID этой секции не установлен.'}),
  a('Волонтёрское объединение «Под крылом»',[['1','18:00-20:00'],['35','16:00-20:00']],[46]),
  a('Настольные игры «Игровая гавань»',[['1','16:00-18:00'],['24','16:00-20:00']],[10]),
  a('Любительское объединение «Лига возможностей»',[['13','15:30-18:30'],['5','15:00-18:00']],[39]),
  a('Настольный теннис',[['3','15:00-20:00']],[4,27],{mappingNote:'В витрине два одноимённых предложения; ID этой секции не установлен.'})
 ]},
 {name:'Балтика',slug:'baltika',vk:'pmk_baltika',published:'2026-07-20',phone:'246-43-31',opening:[['пн-ср, пт','15:00-22:00'],['чт','15:00-21:00'],['сб','10:00-22:00']],records:[
  a('Медиастудия «Софит»',[['13','17:00-19:00'],['245','15:00-17:00']],[21]),
  a('Молодёжное объединение «Даёшь молодёжь»',[['13','15:00-17:00'],['245','17:00-19:00']],[20]),
  a('Настольный теннис',[['24','18:00-21:00'],['6','10:00-14:00']],[4,27],{mappingNote:'В витрине два одноимённых предложения; ID этой секции не установлен.'}),
  a('ОФП «Курс на спорт»',[['13','17:00-20:00'],['5','16:00-20:00']],[23]),
  a('Пауэрлифтинг и гиревой спорт',[['15','19:00-22:00'],['6','18:00-22:00']],[26]),
  a('Степ-аэробика',[['24','10:00-14:00'],['3','19:00-21:00']],[25])
 ],notes:['Степ-аэробика во вторник и четверг начинается в 10:00, хотя общий режим клуба на странице начинается в 15:00. Сохранены часы самой секции; вход уточнить перед визитом.']},
 {name:'Медиазавод',slug:'mediazavod',vk:'mdzvd',published:'2026-07-20',phone:'461-38-57',opening:[['ежедневно','09:00-21:00']],records:[
  a('Театр миниатюр',[['25','16:00-20:00'],['3','18:00-20:00']],[40]),
  a('Школа ведущего',[['14','16:00-20:00'],['3','16:00-18:00']],[36]),
  a('Коротко. Метражно',[['24','18:00-20:00'],['3','17:00-20:00'],['5','18:00-21:00']],[37]),
  a('Вокальная лаборатория',[['23','15:00-20:00']],[41]),
  a('Вокальная лаборатория ПРО',[['45','15:00-20:00']],[42]),
  a('Иносказание',[['24','15:00-18:00'],['3','15:00-17:00'],['5','16:00-18:00']],[38]),
  a('Психологическая студия «Про тебя»',[['12345','14:00-16:00']],[9],{sourceNote:'Индивидуальные консультации по предварительной записи. Указаны часы приёма; это не расписание группового занятия.'}),
  a('Пианино здесь',[['12','15:00-20:00']],[48]),
  a('Клавишный мир',[['3','15:00-20:00'],['6','12:00-17:00']],[14]),
  a('Игровой клуб «Нереальность»',[['45','15:00-20:00']],[5]),
  a('Бесконфликтное общение «Диалог»',[['23','15:00-20:00']],[7],{mappingNote:'Название витрины «Диалог. Психология и общение» сопоставлено по профилю общения. На сайте также есть другое семейное пространство «Диалог» в «Факеле»; ID услуги и однозначность сопоставления требуют проверки.'}),
  a('Проектная мастерская',[['6','15:00-20:00']],[6]),
  a('Вокал «Резонанс»',[['57','15:00-20:00']],[2])
 ]},
 {name:'Факел',slug:'fakel',vk:'pm_klyb_fakel',published:'2026-07-21',phone:'246-43-28',opening:[['пн-пт','14:00-20:30'],['сб','10:00-17:30'],['вс','13:00-19:00']],records:[
  a('Уличные танцы',[['12','14:00-19:00']],[51]),
  a('Театральная студия «Крылья»',[['2','15:30-20:30'],['6','12:30-17:30']],[49]),
  a('Вокальная студия «Бриз»',[['1','14:00-21:00'],['34','14:00-20:30']],[52],{sourceNote:shared+' В понедельник блок указан до 21:00, общий режим клуба до 20:30; время окончания уточни.',sourceHeading:'Вокальная студия «Бриз» и «Бриз+»'}),
  a('Вокальная студия «Cantabile»',[['15','14:00-18:00'],['2','15:00-21:00'],['7','13:00-19:00']],[53],{sourceNote:shared,sourceHeading:'Вокальная студия «Кантабиле» и «Кантабиле+»'}),
  a('Графический дизайн и анимация',[['24','14:00-19:00']],[50]),
  a('Цифровой дизайн «От идеи до воплощения»',[['13','14:00-19:00']],[3]),
  a('Народное пение «При долине»',[['24','14:00-19:00']],[47]),
  a('Семейный музыкальный клуб «Потешки»',[['6','10:00-15:00']],[11]),
  a('Дизайн и искусство «Авангард»',[['24','15:30-20:30']],[8]),
  a('Китайский язык «Хуашань»',[['1245','15:00-20:00']],[1])
 ],unpublished:[a('Семейное психологическое пространство «Диалог»',[['2','16:30-20:30'],['4','15:00-21:00']],[],{reason:'В бесплатной витрине есть «Диалог. Психология и общение», но отдельную услугу нельзя однозначно отнести к этой семейной программе либо к «Медиазаводу».'})]},
 {name:'Ритм',slug:'ritm',vk:'pmk_ritm',published:'2026-07-20',phone:'246-43-27',opening:[['пн-пт','13:00-20:00'],['сб','15:00-20:00']],records:[
  a('Арт-студия «Аргентум»',[['13','15:00-20:00']],[34]),
  a('Цифровая иллюстрация «Перо»',[['25','15:00-20:00']],[35]),
  a('Гитарная студия «Живой звук»',[['3456','15:00-20:00']],[54],{sourceNote:shared,sourceHeading:'Гитарная студия «Живой звук» и «Живой звук ПРО»'})
 ]},
 {name:'Чайка',slug:'chaika',vk:'chaykaklpbox',published:'2026-07-20',phone:'246-43-29',opening:[['пн-пт','15:30-22:00'],['вс','17:00-21:00']],records:[
  a('Бокс',[['135','15:30-22:00']],[18],{sourceHeading:'Бокс, атлетическая гимнастика',sourceNote:'На странице бокс и атлетическая гимнастика объединены одним блоком времени. Часы конкретной группы уточни у клуба.'}),
  a('Атлетическая гимнастика',[['135','15:30-22:00']],[17],{sourceHeading:'Бокс, атлетическая гимнастика',sourceNote:'На странице бокс и атлетическая гимнастика объединены одним блоком времени. Часы конкретной группы уточни у клуба.'}),
  a('Молодёжное объединение «Спорт - жизнь!»',[['234','19:00-21:00'],['7','17:00-21:00']],[19])
 ]},
 {name:'Родина',slug:null,vk:'public191955409',published:'2026-08-14',phone:'246-43-22',address:'г. Колпино, бульвар Трудящихся, д. 29/52',records:[],notes:['Официальная страница доступной среды подтверждает адрес на базе Ижорского колледжа. В основном меню клуба нет; это само по себе не подтверждает закрытие. Направления и расписания не опубликованы на проверенной странице. Собственный VK дан пользователем, на официальной странице найдена только общая группа учреждения.']}
];
const dobroUrl=base+'dobrocentr/',prostoUrl=base+'prostranstvo-prosto/';
venues[0].records.push(a('Волонтёрское объединение «Паутина»',[['135','09:00-18:00']],[33],{sourceUrl:dobroUrl,sourcePublishedAt:'2026-08-13'}));
venues[0].extraActivities=[{activity:'Пространство «ПРОСТО»',sourceUrl:prostoUrl,userServiceIndexes:[12],costEvidence:'official_web',note:'Бесплатное пространство для молодёжи 14-35 лет; нужна регистрация. Ежедневно 09:00-21:00. Это режим пространства, даты событий уточняются.',vkUrl:'https://vk.ru/prostospb',registrationUrl:'https://www.prostospb.team/coworking'},{activity:'Добро.Центр ДМК',sourceUrl:dobroUrl,userServiceIndexes:[13],note:'Волонтёрские проекты, консультации и помощь в работе с Добро.рф. Режим центра: пн-пт 09:00-18:00; график отдельного проекта уточни.',vkUrl:'https://vk.com/club227798469'}];
const research={updatedAt:date,indexUrl:base+'klubs/',institutionId:'kolpinets',scope:'10 площадок ДМК; пять клубов «Ровесника» не входили в эту сверку.',directVkChecked:false,clubs:[],unmappedUserServices:[],contacts:{institutionPhone:'+7 (812) 246-43-22',venuePhone:'+7 (812) 482-56-90',note:'Это разные роли: общий телефон учреждения на странице контактов и телефон площадки «Колпинец» на её странице.'},rawPages:manifest.pages.map(p=>({url:p.url,sha256:p.sha256,status:p.status}))};
for(const venue of venues){
 const club=clubs.find(c=>c.name===venue.name&&c.organization==='kolpinets');if(!club)throw Error(venue.name);
 const url=venue.slug?base+'klubs/'+venue.slug+'/':base+'dostupnaja-sreda-dlja-invalidov/molodezhnyj_klub_rodina/';
 const page=manifest.pages.find(p=>p.url===url);if(page?.status!==200)throw Error(url);
 const sourceLines=page.text.split('Главная').at(-1).split('Поделиться:')[0].split('\n').map(s=>s.trim()).filter(Boolean);
 const notes=[...(venue.notes??[]),'Даты страниц обозначают публикацию источника, а не дату начала действия расписания. Текущий набор нужно уточнять.'];
 if(venue.address&&club.address!==venue.address){club.addressHistory=[...(club.addressHistory??[]),{address:club.address,status:'заменён по официальному сайту',replacedAt:date,sourceUrl:url}];club.address=venue.address;}
 club.officialUrl=url;club.sourceUrl=url;club.sourceCheckedAt=date;club.phone=venue.phone;club.vkUrl='https://vk.ru/'+venue.vk;
 club.contactSource={url,checkedAt:date,vkEvidence:venue.name==='Родина'?'user_message; прямой доступ VK отложен':'Ссылка размещена на официальной странице клуба; сама группа VK не открывалась.'};
 club.addressNote='В официальной записи адреса указана литера А.';
 club.note=venue.name==='Родина'?'Адрес подтверждён разделом доступной среды ДМК. Действующие направления, набор и место входа уточни у учреждения.':'Адрес и расписания сверены с официальной страницей ДМК 23.10.2026. Набор и изменения уточни перед визитом.';
 if(venue.opening)club.openingHours={sourceUrl:url,sourcePublishedAt:venue.published,note:'Общий режим площадки; часы отдельных занятий указаны на страницах направлений.',schedule:venue.opening.map(([days,time])=>({days,time})),closedDays:[]};
 const published=venue.records.filter(r=>r.activity!=='Бесконфликтное общение «Диалог»');
 // Both «Диалог» programs remain in internal evidence until the free service is identified.
 const ambiguous=venue.records.filter(r=>r.activity==='Бесконфликтное общение «Диалог»').map(r=>({...r,reason:r.mappingNote}));
 club.activitySchedule=published.map(r=>({activity:r.activity,sourceType:'official_web',sourceUrl:r.sourceUrl??url,sourcePublishedAt:r.sourcePublishedAt??venue.published,sourceNote:`В источнике указана дата ${(r.sourcePublishedAt??venue.published).split('-').reverse().join('.')}. Перед визитом уточни изменения и наличие мест.${r.sourceNote?' '+r.sourceNote:''}`,schedule:r.schedule}));
 const details=[...published,...(venue.extraActivities??[])];
 club.activityPages=details.map((r,i)=>({id:`kolpinets-${venue.slug??'rodina'}-${i+1}`,title:r.activity,catalogActivity:r.activity,officialUrl:r.sourceUrl??url,sourceUrl:r.sourceUrl??url,sourceCheckedAt:date,...(r.userServiceIndexes.includes(1)?{vkUrl:userEvidence.services[0].url}:r.vkUrl?{vkUrl:r.vkUrl}:{}),mapping:'Название и площадка подтверждены официальной страницей; пользовательские свидетельства бесплатности хранятся отдельно.',...(r.registrationUrl?{registrationUrl:r.registrationUrl}:{}),...(r.note?{note:r.note}:{})}));
 club.activityConditions=details.map(r=>({activity:r.activity,sourceUrl:r.costEvidence==='official_web'?r.sourceUrl:userEvidence.collectionUrl,sourceType:r.costEvidence==='official_web'?'official_web':'user_supplied_vk_text',sourceText:r.note??'В перечне услуг ДМК направление указано как бесплатное. Перед записью уточни условия и наличие мест.'}));
 for(const detail of details)if(!club.activities.includes(detail.activity))club.activities.push(detail.activity);
 const fact={name:club.name,officialUrl:url,pageSha256:page.sha256,sourcePublishedAt:venue.published,sourceCheckedAt:date,vkUrl:club.vkUrl,vkEvidence:club.contactSource.vkEvidence,activities:club.activities,records:venue.records,extraActivities:venue.extraActivities??[],unpublishedRecords:[...(venue.unpublished??[]),...ambiguous],freeActivities:details.map(r=>r.activity),fundingSourceType:'user_supplied_vk_text_except_prosto',paidActivities:[],sourceLines,notes:[...notes,...[...(venue.unpublished??[]),...ambiguous].map(r=>`${r.activity}: ${r.reason}`)],scheduleStatus:published.length?'Названия и интервалы прочитаны совместно из официального HTML. Набор не проверен.':'Расписание на проверенной странице не найдено.'};
 research.clubs.push(fact);
}
const mapped=new Set(research.clubs.flatMap(c=>[...c.records.filter(r=>r.activity!=='Бесконфликтное общение «Диалог»'),...c.extraActivities].flatMap(r=>r.userServiceIndexes)));
research.unmappedUserServices=userEvidence.services.filter(s=>!mapped.has(s.index)).map(s=>({...s,reason:s.index===7?'Две официальные программы «Диалог», одно общее название услуги; соответствие не определено.':s.index===30?'На сайте найдены «Траектория подростка» и «Паутина», но не отдельные часы услуги «Антикафе».':'Точное соответствие программе и клубу на проверенных официальных страницах не найдено.'}));
userEvidence.clubVk=venues.map(v=>({club:v.name,url:'https://vk.ru/'+v.vk,directChecked:false,publishedOnOfficialWebsite:v.name!=='Родина'}));
await save('data/clubs-kolpinsky.json',clubs);
await save('data/research/kolpinets-user-evidence-2026-10-23.json',userEvidence);
await save('data/research/kolpinsky-official-evidence.json',research);
const centers=await read('data/research/pmc-centers-contacts.json'),center=centers.find(c=>c.id==='kolpinets');
center.address='г. Колпино, Заводской пр., д. 10, лит. А';center.phones=['+7 (812) 246-43-22'];center.emails=['mail@dmk.spb.ru'];center.links={...center.links,site:base,vk:'https://vk.ru/dm_kolpinets',telegram:'https://t.me/dm_kolpinets',governmentMirror:'https://gu265.site.gov.spb.ru/'};center.source=base+'kontakti/';center.sourceCheckedAt=date;center.sourceNote='Общий телефон и почта сверены со страницей контактов ДМК. 482-56-90 указан отдельно как телефон площадки «Колпинец». VK подтверждён ссылкой официального сайта, содержимое группы не проверялось; Telegram прислан пользователем.';
await save('data/research/pmc-centers-contacts.json',centers);
const old=await read(archive),otherBefore=old.clubs.filter(c=>c.organization!=='kolpinets'),otherNow=clubs.filter(c=>c.organization!=='kolpinets');
if(JSON.stringify(otherBefore)!==JSON.stringify(otherNow))throw Error('Changed unrelated Rovesnik clubs');
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
console.log(JSON.stringify({venues:venues.length,newNamedActivities:clubs.reduce((n,c,i)=>n+c.activities.length-old.clubs[i].activities.length,0),schedules:clubs.reduce((n,c)=>n+(c.activitySchedule?.length??0),0),slots:clubs.flatMap(c=>c.activitySchedule??[]).reduce((n,r)=>n+r.schedule.length,0),userServices:services.length,unmapped:research.unmappedUserServices.map(s=>s.title),rovesnikUnchangedHash:hash(otherNow)}));
