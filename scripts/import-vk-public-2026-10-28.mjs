import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { isVkCommunityUrl } from './activity-page-routes.mjs';

// S-82 is a reviewed local import. Accepted S-81 evidence stays immutable.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => fs.readFile(path.join(root,p),'utf8');
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const write = (p,v) => fs.writeFile(path.join(root,p),JSON.stringify(v,null,2)+'\n');
const index = JSON.parse(await read('data/research/vk-notes-2026-10-28/index.json'));
if(index.status !== 'accepted_for_internal_database') throw Error('S-81 has not been accepted');
const sources={},catalogs={},original={};
for(const item of index.districts){
 const raw=await read(item.path); if(sha(raw)!==item.sha256)throw Error('Evidence changed: '+item.path);
 sources[item.district]=JSON.parse(raw);
 const p='data/clubs-'+item.district+'.json';original[item.district]=await read(p);catalogs[item.district]=JSON.parse(original[item.district]);
}
let accepted;try{accepted=JSON.parse(await read('data/research/vk-public-import-2026-10-28/selection.json'));}catch(e){if(e.code!=='ENOENT')throw e;}
if(accepted?.catalogAfterSha256){for(const [d,h]of Object.entries(accepted.catalogAfterSha256))if(sha(original[d])!==h)throw Error('Local catalog changed after accepted S-82 import: '+d);console.log('S-82 already applied; source hashes and catalogs verified.');process.exit(0);}
const audit={task:'S-82',importedOn:'2026-10-28',sourceIndex:'data/research/vk-notes-2026-10-28/index.json',
 policy:'Only nonconflicting facts and funding-supported free schedules; no archive, mixed funding without group mapping, staff hours, or assumed aliases. Representative verification remains a later stage.',
 changes:[],candidateDecisions:[],scheduleDecisions:[],offeringDecisions:[],sourceHashes:index.districts.map(x=>({path:x.path,sha256:x.sha256})),verificationByRepresentatives:false};
const eqUrl=(a,b)=>{try{let x=new URL(a),y=new URL(b);return x.pathname.replace(/\/$/,'').toLowerCase()===y.pathname.replace(/\/$/,'').toLowerCase()&&(/(^|\.)vk\.(com|ru)$/.test(x.hostname))&&(/(^|\.)vk\.(com|ru)$/.test(y.hostname));}catch{return a===b;}};
const club=(d,n)=>{let c=catalogs[d].find(x=>x.name===n);if(!c)throw Error('Missing club '+d+' '+n);return c;};
const clean=s=>String(s).replace(/[–—]/g,'-').replace(/\s+/g,' ').trim();
const change=(d,n,field,from,to,sourceRefs)=>audit.changes.push({district:d,club:n,field,from:from??null,to,sourceRefs});
function setField(d,n,field,value,refs){const c=club(d,n);if(c[field]===value)return false;change(d,n,field,c[field],value,refs);c[field]=value;return true;}
function ensureActivity(d,n,a){let c=club(d,n);if(!c.activities.includes(a)){c.activities.push(a);change(d,n,'activities',null,a,[]);}return c;}
function appendUnique(c,field,item,key){c[field]??=[];let prev=c[field].find(x=>key(x)===key(item));if(prev){if(JSON.stringify(prev)!==JSON.stringify(item))throw Error('Existing record differs: '+c.name+' '+field+' '+key(item));return false;}c[field].push(item);return true;}
function addCondition(d,n,a,item){let c=ensureActivity(d,n,a);const row={activity:a,...item,importTask:'S-82'};if(c.activityConditions?.some(x=>x.importTask==='S-82'&&x.activity===a&&x.sourceText===row.sourceText))return;if(appendUnique(c,'activityConditions',row,x=>x.importTask+'|'+x.activity+'|'+x.sourceText))change(d,n,'activityConditions',null,row,item.sourceRefs);}
function addPage(d,n,a,title,officialUrl){let c=ensureActivity(d,n,a);if(!officialUrl)return;let row={catalogActivity:a,title:clean(title),officialUrl,sourceCheckedAt:'2026-10-26',importTask:'S-82'};if(!c.activityPages?.some(p=>p.catalogActivity===a&&p.title===row.title)){c.activityPages??=[];c.activityPages.push(row);change(d,n,'activityPages',null,row,[]);}}
const official={};for(const d of Object.keys(sources))official[d]=JSON.parse(await read('data/research/remaining-districts-2026-10-26/'+d+'.json'));
function officialClub(d,c){return official[d].clubs.find(x=>(x.baselineMatch?.name??x.catalogMatch?.existingName??x.name)===c.name);}
function pageFor(d,c){let o=officialClub(d,c),comp=c.officialComparison;let values=[o?.officialPage,o?.sourceUrl,...(o?.officialPages??[]),...(comp?.officialPages??[]),...(comp?.sourceUrls??[])];return values.find(u=>typeof u==='string'&&/^(https?):/.test(u)&&(/\/clubs\/[^/]+\/?(?:\?|$)|\/clubs\.php\?id=\d+|\/services\/tproduct\/|\/podrostkovo-molodezhnye-kluby\/[^/]+\/?$|^https:\/\/dom-mol\.ru\/[\w-]+\/?$/.test(u)))??null;}
// Fill the club's own official page; do not call organization directories club pages.
for(const [d,v]of Object.entries(sources))for(const c of v.clubs){
 const p=pageFor(d,c),out=club(d,c.name);
 if(p&&!out.officialUrl&&c.noteCoverage!=='not_found'){
  setField(d,c.name,'officialUrl',p,[{sourcePackage:'data/research/remaining-districts-2026-10-26/'+d+'.json',checkedAt:'2026-10-26'}]);
  out.contactSource={...(out.contactSource??{}),officialUrl:p,officialCheckedAt:'2026-10-26',vkNote:c.sourceRefs?.[0]??null,importTask:'S-82'};
 }
}
// Every original manager candidate receives a decision, including duplicates and holds.
for(const [d,v]of Object.entries(sources))for(const [i,p]of v.publicCandidates.entries()){
 const out=catalogs[d].find(c=>c.name===p.club),kind=p.kind??p.type,url=p.value??p.url;
 const rec={district:d,index:i,club:p.club,kind,statusBefore:p.status,sourceRefs:p.sourceRefs??[],decision:'held',reason:p.reason};
 if(!out){audit.candidateDecisions.push({...rec,reason:'Дополнительная/неопределённая площадка; исходная запись остаётся в БД.'});continue;}
 if((['club_vk','club_link'].includes(kind)&&p.status==='ready_for_manager_review')||(d==='pushkinsky'&&p.status==='candidate_link_after_review')){
  const link=v.clubs.find(c=>c.name===p.club).links.find(l=>l.url===url);
  const isClub=d!=='pushkinsky'||link?.kind==='club_community';
  if(!isClub){rec.reason='Ссылка принадлежит направлению, а не клубу; не переносить в контакты клуба без отдельного сопоставления.';}
  else if(!isVkCommunityUrl(url)){rec.reason='Не отдельное сообщество VK.';}
  else if(out.vkUrl&&!eqUrl(out.vkUrl,url)){rec.reason='Нынешний VK отличается: алиас не установлен. Сохранены оба адреса внутри.';}
  else if(out.vkUrl){rec.decision='already_present';rec.reason='То же опубликованное сообщество, повторная замена домена не нужна.';}
  else {setField(d,p.club,'vkUrl',url,p.sourceRefs);out.vkUrlSource=d==='pushkinsky'?'user_supplied_vk_copy':out.officialUrl??'user_supplied_vk_copy';if(d==='pushkinsky')out.vkUrlSourceRefs=p.sourceRefs;out.vkUrlSourceCheckedAt='2026-10-28';out.vkUrlImportedAt='2026-10-28';rec.decision='imported';rec.reason='Подписанная связь клуба без конкурирующего адреса; источник и ограничения сохранены.';}
 }
 if(d==='nevsky'&&kind==='address_correction'){rec.decision='held';rec.reason='Дом 42 подтверждён двумя текстовыми источниками, но связанная точка/адрес карты ещё относятся к прежней записи. Исправление сохраняется в БД до совместной сверки точки; координаты не менялись.';}
 if(kind==='status_or_participation_restriction'&&p.club==='Корпус'&&d==='primorsky'){rec.decision='already_present';rec.reason='Требование справки уже есть в текущей заметке клуба; оно сохраняется и в условиях направлений.';}
 audit.candidateDecisions.push(rec);
}
// Explicitly reviewed mapping. Existing categories/routes are retained; new ones append.
const pushMap={
 'S81A-012':'Боевые искусства','S81A-013':'Творческая мастерская','S81A-014':'ОФП','S81A-015':'Кикбоксинг','S81A-016':'Капоэйра','S81A-018':'Тренажёрный зал',
 'S81A-083':'Бильярд','S81A-084':'Творчество','S81A-085':'Фитнес','S81A-086':'Йога','S81A-087':'Гитара','S81A-088':'Тренажёрный зал','S81A-089':'Тренажёрный зал','S81A-090':'Витражная мозаика',
 'S81A-045':'Атлетическая гимнастика','S81A-046':'Атлетическая гимнастика','S81A-047':'Фитнес','S81A-048':'Гитара',
 'S81A-052':'Интеллектуальный клуб','S81A-053':'Семейный клуб знатоков','S81A-101':'Кукольное ремесло',
 'S81A-077':'Рукопашный бой','S81A-080':'Йога',
 'S81A-055':'Вокал','S81A-056':'Рисование','S81A-057':'Молодёжное пространство','S81A-058':'Танцы','S81A-059':'Творческая мастерская','S81A-060':'Клуб молодой семьи',
 'S81A-030':'Тренажёрный зал','S81A-031':'Тренажёрный зал','S81A-032':'Вокал','S81A-034':'Рисование','S81A-035':'Клуб молодой семьи','S81A-037':'Танцы',
 'S81A-094':'Авиамоделирование','S81A-095':'Парапланеризм','S81A-096':'Лидерский клуб'
};
const scheduleBuckets=new Map();
function addSchedule(d,c,r,a,meta){
 let key=d+'|'+c.name+'|'+a;
 if(!scheduleBuckets.has(key))scheduleBuckets.set(key,{d,c,a,records:[],meta});
 scheduleBuckets.get(key).records.push(r);
}
for(const c of sources.pushkinsky.clubs)for(const r of c.scheduleRecords){
 let p=sources.pushkinsky.publicCandidates.find(p=>p.scheduleId===r.id&&p.club===c.name),a=pushMap[r.id];
 const decision={district:'pushkinsky',club:c.name,id:r.id,evidenceId:r.evidenceId,activity:r.activity,period:r.period,slots:r.slots.length,decision:'held',reason:p?.reason??'Вне отобранной непротиворечивой бесплатной сетки',sourceRefs:r.sourceRefs};
 if(a){
  const f=r.officialActivityMatch;
  if(p?.status!=='candidate_with_prior_free_condition'||r.fundingEvidence?.status==='paid'||!f?.fundingVariants?.length||!f.fundingVariants.every(x=>x.funding==='free')||!r.currentness.startsWith('explicit_2026_2027'))throw Error('Invalid free schedule selection: '+r.id);
  decision.decision='imported';decision.catalogActivity=a;decision.reason='Сетка 2026-2027 и однозначное бесплатное направление этого же клуба в официальном перечне. Без переноса платных/возрастных вариантов на неизвестные группы.';
  addSchedule('pushkinsky',c,r,a,{fundingEvidence:{status:'free',sourceUrl:f.sourceUrl,quote:f.raw,age:f.age,checkedAt:f.checkedOn,matchScope:'Same named activity at the same club; no mixed funding variant in saved official list. Timetable does not state individual age groups.'},sourceType:'user_vk_image',sourcePeriod:r.period,sourceNote:'Расписание на 2026-2027 учебный год взято из предоставленного снимка. Бесплатное направление указано на официальной странице клуба. Возраст своей группы и наличие мест уточни перед записью.'});
 }else if(r.id==='S81A-033')decision.reason='В одной строке объединены футбол и ОФП; бесплатность найденного предложения подтверждает только футбол, соответствие всей строки не установлено.';
 else if(['S81A-091','S81A-097','S81A-099'].includes(r.id))decision.reason='В официальном перечне есть платный и бесплатный возрастные варианты; снимок не распределяет часы по этим вариантам.';
 audit.scheduleDecisions.push(decision);
 const orig=audit.candidateDecisions.find(x=>x.district==='pushkinsky'&&x.club===c.name&&sources.pushkinsky.publicCandidates[x.index].scheduleId===r.id);if(orig){orig.decision=decision.decision;orig.reason=decision.reason;}
}
// Undated copied text: disclose the missing period, keep exact groups and intervals.
const atlant=sources.nevsky.clubs.find(c=>c.name==='Атлант');
const nevMap={'ОФП':'ОФП','Бачата, сальса соло':'Бачата и сальса соло','Каратэ':'Каратэ','Хип-хоп':'Хип-хоп'};
for(const r of atlant.scheduleRecords){let a=nevMap[r.activity];let rec={district:'nevsky',club:atlant.name,id:r.evidenceId,activity:r.activity,period:r.period,slots:r.slots.length,decision:a?'imported':'held',reason:a?'Бесплатно 14-35 прямо в том же блоке; период не указан и будет обозначен на странице.':'Название «Патриот» / тренажёрный зал не позволяет однозначно распределить строку.',sourceRefs:r.sourceRefs};audit.scheduleDecisions.push(rec);
 if(a)addSchedule('nevsky',atlant,r,a,{fundingEvidence:{...r.fundingEvidence,age:'14-35',sourceRefs:r.sourceRefs},sourceType:'user_vk_text',sourcePeriod:'Период действия не указан',sourceNote:'В предоставленных сведениях сообщества период действия расписания не указан. Указаны бесплатные занятия для участников от 14 до 35 лет. До посещения уточни действующую сетку и время своей группы.'});
 const orig=audit.candidateDecisions.find(x=>x.district==='nevsky'&&x.club==='Атлант'&&sources.nevsky.publicCandidates[x.index].evidenceId===r.evidenceId);if(orig){orig.decision=rec.decision;orig.reason=rec.reason;}
}
for(const b of scheduleBuckets.values()){
 const {d,c,a,records,meta}=b,out=ensureActivity(d,c.name,a);
 if(out.activitySchedule?.some(x=>x.activity===a&&x.importTask!=='S-82'))throw Error('Do not overwrite existing schedule '+d+' '+c.name+' '+a);
 const known=x=>x&&x!=='unknown';
 const schedule=records.flatMap(r=>r.slots.map(s=>({day:s.day.toLowerCase(),time:s.time,...(known(s.group)?{group:s.group}:known(r.group)?{group:r.group}:records.length>1?{group:clean(r.teacher)}:{}),...(known(s.room)?{room:clean(s.room)}:known(r.room)?{room:clean(r.room)}:{})})));
 const sourceUrl=d==='nevsky'?'https://vk.ru/atlant_champ':out.vkUrl;
 const row={activity:a,...meta,sourceCheckedAt:'2026-10-28',...(sourceUrl?{sourceUrl}:{}),sourceRefs:records.flatMap(r=>r.sourceRefs),sourceRecords:records.map(r=>r.id??r.evidenceId),importTask:'S-82',schedule};
 if(appendUnique(out,'activitySchedule',row,x=>x.activity))change(d,c.name,'activitySchedule',null,row,row.sourceRefs);
 for(const r of records){let f=r.officialActivityMatch;addPage(d,c.name,a,r.activity,f?.sourceUrl);addCondition(d,c.name,a,{sourceType:d==='pushkinsky'?'official_free_offer':'user_vk_note',sourceUrl:f?.sourceUrl??sourceUrl,sourceCheckedAt:d==='pushkinsky'?'2026-10-26':'2026-10-28',sourceText:d==='pushkinsky'?clean(f.raw)+'. Возраст своей группы уточни у клуба':'Бесплатные занятия для участников от 14 до 35 лет. Период расписания не указан',sourceRefs:r.sourceRefs});}
}
// Explicit category mapping for corroborated free-studio information. No inherited hours.
const primMap={
 'На Королёва':['Тренажёрный зал','Киностудия','Звукорежиссура','Музыка','Саксофон','Вязание','Йога','Йога','Фитнес'],
 'В стиле':['Ногтевой сервис','Визаж','Стиль'],
 'Молодёжная Идея':['Тренажёрный зал','Вокал','Музыка','Театр'],
 'Заозерье':['Вокал','Музыка','Клуб молодой семьи','Рисование','Вязание','Бисероплетение','Декоративное творчество','Гитара','Разговорный английский','Клуб молодой семьи','Йога','Гитара','Медиа','Гитара','Гитара'],
 'Нева':['Декоративно-прикладное творчество','Декоративно-прикладное творчество','Декоративно-прикладное творчество'],
 'Юпитер':['Фитнес','Театр','Вокал','Фотография','Клуб общения','Клуб общения','Клуб общения','Вокал','Клуб молодой семьи','Клуб общения'],
 'Корпус':['Пауэрлифтинг','Атлетизм','Фитнес','Бокс','ОФП','Силовой комплекс','Координация','НВП','Тактико-стрелковое многоборье','Тактическая медицина','Строевая подготовка'],
 'Развитие':['Рисование','Фотография','Танцы','Фитнес','Йога','Йога','Стиль','Вокал','Театр','Творческая мастерская','Танцы','Танцы','Разговорный английский','Визаж','Пилатес','Степ-аэробика','Клуб молодой семьи','Йога','Фитнес'],
 'Галактика':['Вокал','Театр','Настольный теннис','Рисование','Рисование']
};
for(const c of sources.primorsky.clubs)for(const [i,a]of c.activities.entries()){
 let mapped=primMap[c.name]?.[i],matched=a.officialComparison?.exactNameMatches?.length>0;
 const rec={district:'primorsky',club:c.name,activity:a.name,sourceRefs:a.sourceRefs,decision:'held',reason:!mapped?'Площадка/актуальная версия предложения требует уточнения.':'Название не сопоставлено с официальным снимком; не угадывать тождество.'};
 if(mapped&&matched&&a.funding?.status==='listed_under_free_studios'){
  const p=pageFor('primorsky',c),out=ensureActivity('primorsky',c.name,mapped);
  const name=clean(a.name).replace(/:\s*$/,'');
  const med=(c.name==='Корпус'||a.restrictions?.some(x=>/справк/.test(x.text)))&&!(c.name==='На Королёва'&&mapped!=='Тренажёрный зал');
  const text=name+'. Направление указано в бесплатном перечне студий. '+(med?'Для занятий нужна медицинская справка об отсутствии противопоказаний. ':'')+'Условия своей группы и наличие мест уточни у клуба';
  addPage('primorsky',c.name,mapped,name,p);
  addCondition('primorsky',c.name,mapped,{sourceType:'user_vk_note',sourceUrl:p??out.vkUrl,sourceCheckedAt:'2026-10-28',sourceText:text,sourceRefs:a.sourceRefs,fundingEvidence:a.funding});
  rec.decision='imported';rec.catalogActivity=mapped;rec.reason='Бесплатный перечень с точной привязкой к клубу; название совпадает с сохранённым официальным предложением. Возраст сохранён в названии, не распространён на другие студии.';
 }
 audit.offeringDecisions.push(rec);
}
// Other districts retain all unknown-funding, paid, archival and ambiguous records internally.
for(const [d,v]of Object.entries(sources))if(d!=='primorsky')for(const c of v.clubs)for(const a of c.activities??[]){audit.offeringDecisions.push({district:d,club:c.name,activity:a.name,decision:'retained_in_database',reason:'Исходное упоминание сохранено. Публичные сопоставления отобранных расписаний учтены отдельно; другие условия/принадлежность не предполагаются.',sourceRefs:a.sourceRefs});}
// Preserved free official schedules, explicitly included by the current local-import scope.
const kup=sources.frunzensky.clubs.find(c=>c.name==='Дом молодёжи «Купчино»');
for(const r of kup.officialComparison.officialScheduleRecords){
 if(r.fundingEvidence?.status!=='free')continue;
 const a=r.activity,out=ensureActivity('frunzensky',kup.name,a);
 if(out.activitySchedule?.some(x=>x.activity===a))continue;
 const row={activity:a,sourceType:'official_web',sourceUrl:r.sourceUrl,sourceCheckedAt:'2026-10-26',sourcePeriod:'Период действия не указан',sourceNote:'Период действия на официальной странице не указан. Бесплатные занятия для участников от 14 до 35 лет. Для спортивных занятий нужна медицинская справка. До посещения уточни расписание.',fundingEvidence:r.fundingEvidence,sourceRecords:['S-81/frunzensky/officialComparison/'+a],importTask:'S-82',schedule:r.slots.map(s=>({day:s.day.toLowerCase(),time:s.time,...(s.group&&s.group!=='unknown'?{group:s.group}:{}),...(s.room&&s.room!=='unknown'?{room:s.room}:{})}))};
 out.activitySchedule??=[];out.activitySchedule.push(row);change('frunzensky',kup.name,'activitySchedule',null,row,[{sourceUrl:r.sourceUrl}]);
 addPage('frunzensky',kup.name,a,a,r.sourceUrl);addCondition('frunzensky',kup.name,a,{sourceType:'official_free_offer',sourceUrl:r.sourceUrl,sourceCheckedAt:'2026-10-26',sourceText:'Бесплатно для участников от 14 до 35 лет. Обязательна справка о допуске к занятиям спортом'});
 audit.scheduleDecisions.push({district:'frunzensky',club:kup.name,id:'official-'+a,activity:a,slots:row.schedule.length,decision:'imported',reason:'Явные бесплатные условия и время в сохранённой официальной карточке этого направления; сезон не указан.'});
}
// Source schedules outside the accepted local subset remain discoverable, without duplication.
for(const [d,v]of Object.entries(sources))if(!['pushkinsky','nevsky'].includes(d))for(const c of v.clubs)for(const r of c.scheduleRecords??[])audit.scheduleDecisions.push({district:d,club:c.name,id:r.id??r.evidenceId??null,activity:r.activity,slots:r.slots?.length??0,decision:'held',reason:'Повтор старого исследования либо архив/неустановленный период/финансирование/площадка. Эта партия не импортирует эти часы.',sourceRefs:r.sourceRefs});
for(const [d,v]of Object.entries(sources))for(const c of v.additionalRecords??[])for(const r of c.scheduleRecords??[])audit.scheduleDecisions.push({district:d,club:c.name,id:r.id??r.evidenceId??null,activity:r.activity,slots:r.slots?.length??0,decision:'held',reason:'Площадка не установлена; нельзя распределять часы по порядку заметки.',sourceRefs:r.sourceRefs});
for(const [d,data]of Object.entries(catalogs)){
 // Existing category order is an invariant; coordinate/address IDs are untouched.
 const before=JSON.parse(original[d]);for(let i=0;i<data.length;i++)if(before[i].name!==data[i].name||before[i].activities.some((a,j)=>data[i].activities[j]!==a))throw Error('Existing activity route order changed');
 const serialized=JSON.stringify(data,null,2)+'\n';if(JSON.stringify(before)!==JSON.stringify(data))await fs.writeFile(path.join(root,'data/clubs-'+d+'.json'),serialized);
}
audit.counts={changedFields:audit.changes.length,changedClubs:new Set(audit.changes.map(x=>x.district+'|'+x.club)).size,
 clubVkAdded:audit.changes.filter(x=>x.field==='vkUrl').length,officialPagesAdded:audit.changes.filter(x=>x.field==='officialUrl').length,
 newCategories:audit.changes.filter(x=>x.field==='activities').length,
 scheduleSourceRows:audit.scheduleDecisions.filter(x=>x.decision==='imported').length,
 publicScheduleTables:audit.changes.filter(x=>x.field==='activitySchedule').length,
 publicIntervals:audit.changes.filter(x=>x.field==='activitySchedule').reduce((n,x)=>n+x.to.schedule.length,0),
 freeStudioRecords:audit.offeringDecisions.filter(x=>x.decision==='imported').length,
 heldSourceSchedules:audit.scheduleDecisions.filter(x=>x.decision==='held').length};
await fs.mkdir(path.join(root,'data/research/vk-public-import-2026-10-28'),{recursive:true});
audit.catalogAfterSha256={};for(const d of Object.keys(catalogs))audit.catalogAfterSha256[d]=sha(await read('data/clubs-'+d+'.json'));
await write('data/research/vk-public-import-2026-10-28/selection.json',audit);
console.log(JSON.stringify(audit.counts,null,2));
