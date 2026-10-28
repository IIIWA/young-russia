import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
const read=async f=>JSON.parse(await fs.readFile(f,'utf8'));
const write=async(f,d)=>fs.writeFile(f,JSON.stringify(d,null,2)+'\n');
const folder='outputs/ligovo-official-2026-10-23',index=await read(folder+'/browser-club-list.json'),doc=await read('data/research/krasnoselsky-docx-2025-05.json'),paid=await read(folder+'/browser-platnye-uslugi.json');
const norm=s=>s.toLocaleLowerCase('ru').replaceAll('ё','е').replace(/[^а-яa-z0-9]/g,'');
const links=[...new Map(index.links.filter(l=>/^https:\/\/gu321\.site\.gov\.spb\.ru\/spisok-klubov\/[^/]+\/$/.test(l.url)).map(l=>[l.url,l])).values()];
const notePath='YoungRussiaOBS/Источники/ВК/ВК ПМК Красносельского района.md',note=await fs.readFile(notePath,'utf8');
const closure=await read('data/research/raketa-closure-image-2026-10-24.json');
const rows=doc.blocks.find(b=>b.type==='table'&&b.rows.length===17).rows.slice(1),clubs=await read('data/clubs-krasnoselsky.json');
await fs.mkdir(folder+'/before',{recursive:true});try{await fs.copyFile('data/clubs-krasnoselsky.json',folder+'/before/clubs-krasnoselsky.json',fs.constants.COPYFILE_EXCL);}catch(e){if(e.code!=='EEXIST')throw e;}
const result={checkedAt:'2026-10-23',indexUrl:index.url,sourceNote:{path:notePath,sha256:createHash('sha256').update(note).digest('hex')},docx:{sourcePath:doc.sourcePath,sourceSha256:doc.sourceSha256,period:doc.sourcePeriod,freeHeader:'Бесплатные формирования для подростков и молодёжи от 14 до 35 лет',note:'Перечень за май 2025, не сетка времени и не подтверждение текущего набора'},paidSource:{url:paid.url,period:'2026-2027',text:paid.text,note:'Есть отдельные предложения 36+ и для детей. Одно название в платном перечне не отменяет бесплатную группу 14-35 лет.'},scheduleSearch:{clubPages:18,timetablesFound:0,note:'В тексте и ссылках карточек сетки дней/времени не найдены. Контакты учреждения: пн-чт 09:00-18:00, пт 09:00-17:00; это не расписание занятий. Пн-сб 16:00-22:00 в заметке также нельзя переносить на каждое направление.',userDirectionsLink:'https://clck.ru/3Mdh5A',resolvedUrl:'https://disk.yandex.ru/i/xFq9VE5aQztg3A',linkResult:'Яндекс Диск показывает «У вас нет доступа или такой страницы нет», также предупреждает о проблемах сервиса. Причина недоступности не установлена.'},clubs:[]};
for(const link of links){
 const slug=link.url.split('/').filter(Boolean).at(-1),page=await read(`${folder}/browser-${slug}.json`),clean=page.text.replaceAll('\u00a0',' '),start=clean.search(/Информация\s+(?:о\s+)?клубе/i),end=clean.indexOf('Поделиться:'),content=clean.slice(start>=0?start:clean.indexOf('Адрес:'),end>=0?end:undefined),old=rows.find(r=>norm(r[1].join(' ')).startsWith(norm(link.text))),primary=clubs.find(c=>norm(c.name)===norm(link.text));
 const own=page.links.find(l=>/^https?:\/\/(?:vk.com|vk.ru)\//.test(l.url)&&!l.url.endsWith('/pmcligovo'));
 let profile=content.slice(Math.max(content.indexOf('Направления'),0));let stop=profile.indexOf('Коллектив');if(stop<0){const m=profile.match(/\n[А-ЯЁ][а-яё]+ [А-ЯЁ][а-яё]+ [А-ЯЁ][а-яё]+\s*[-–]/u);if(m)stop=m.index;}if(stop>0)profile=profile.slice(0,stop);
 const fact={name:primary?.name??link.text,slug,url:page.url,sourceSha256:createHash('sha256').update(page.html).digest('hex'),address:content.match(/Адрес:\s*([^\n]+)/i)?.[1]??'',phone:content.match(/(?:Телефоны?|Тел\.):\s*([^\n]+)/i)?.[1]??'',vkUrl:own?.url??'',vkEvidence:'Размещена на официальной странице клуба, содержимое VK напрямую не проверялось',currentProfileText:profile.trim(),sourceLines:content.split('\n').filter(Boolean),freeActivities:old?.[4]??[],paidActivities:old?.[5]??[],docxRow:old?Number(old[0][0])+1:null,docxContactCell:old?.[1]??[],docxStaffCell:old?.[2]??[],docxMunicipality:old?.[3]??[],publicCatalog:Boolean(primary),notes:['Расписание занятий по дням, времени и группам не найдено; режим учреждения не переносится на занятия.','Платный и бесплатный варианты одного направления хранятся отдельно; возраст для каждой группы требуется указывать по источнику.']};
 if(!primary)fact.notes.push('«Альфа» есть в действующем официальном списке, но отсутствует в публичном каталоге. Статус открытия после ремонта не подтверждён. Запись пока только во внутренней базе.');
 if(slug==='ritm')fact.notes.push('В DOCX старое имя VK pmk_rhythm; в заметке и на официальном сайте pmk_rytm. Основной контакт взят с сайта.');
 if(slug==='burevestnik')fact.notes.push('В DOCX pmk_burevestnik, в заметке и на сайте mk_burevestnik.');
 if(slug==='voshod')fact.notes.push('В заметке и DOCX vosxod_pmk, на текущей официальной странице vosxod_spb. Прежняя ссылка сохранена для сверки.');
 if(slug==='fakel')fact.notes.push('Сайт пишет «Томбасова, 32, лит Б», в каталоге и DOCX «Тамбасова, 32». Улица с опечаткой не заменяет нормализованный адрес; литера требует сверки.');
 if(slug==='alfa')fact.notes.push('На странице указан корпус 1, в старом DOCX корпус отсутствует. Требуется сверка перед нанесением новой точки.');
 if(slug==='raketa'){
  fact.closureEvidence=closure;fact.notes.push(closure.note,closure.dateLimitation);fact.checkedAt=closure.checkedAt;
  if(primary){primary.temporarilyClosed=true;primary.note=closure.note;primary.closureEvidence=closure;}
 }
 if(primary){primary.activitiesSource=(await read('data/research/ligovo-catalog-before-2026-10-23.json')).find(c=>c.name===primary.name)?.sourceUrl??'https://www.spbdm.ru/upload/iblock/524/35qphtbcqyez2ov7ps7y8rp6jdm56ezp/%D0%9F%D0%9C%D0%A6%20%D0%9B%D0%B8%D0%B3%D0%BE%D0%B2%D0%BE.pdf';primary.officialUrl=page.url;primary.sourceUrl=page.url;primary.sourceCheckedAt='2026-10-23';if(own)primary.vkUrl=own.url;primary.phone=fact.phone;primary.email='pmcligovo@mail.ru';primary.ageConditions={freeFrom:14,freeTo:35,sourceNote:notePath,sourceDocx:doc.sourcePath,note:'Платные группы могут называться так же; они не включены в бесплатные условия.'};}
 result.clubs.push(fact);
}
await write('data/research/krasnoselsky-official-evidence.json',result);await write('data/clubs-krasnoselsky.json',clubs);
console.log(JSON.stringify({officialClubs:result.clubs.length,docxClubs:rows.length,publicClubs:clubs.length,clubVk:result.clubs.filter(c=>c.vkUrl).length,schedules:0}));
