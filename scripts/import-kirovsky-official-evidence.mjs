import fs from 'node:fs/promises';
import {writeGeneratedFile} from './write-generated-file.mjs';
const read=async f=>JSON.parse(await fs.readFile(f,'utf8'));
const [clubs,manifest]=await Promise.all(['data/clubs-kirovsky.json','outputs/kirovsky-official-2026-10-23/manifest.json'].map(read));
const userLinks=['club16263721','iron_altair',null,'pmk_zarya','pmk_leni_golikova','kanonerec','club151736835','pmklenenec','molspase','club65947899','club154236766','pmz_pmkraduga','public160977498','mpseverblizko','club139572086','mkfakelkir',null,'club11237362','unleningradez'];
if(clubs.length!==19||manifest.clubPages.length!==19)throw Error('Перепроверить состав Кировского района');
const research={updatedAt:'2026-10-23',indexUrl:'https://pmckir.ru/?page_id=556',indexSha256:manifest.pages.find(p=>p.url.endsWith('page_id=556')).sha256,purpose:'Ссылка VK подтверждается размещением на официальном сайте; сама VK-страница не открывалась.',clubs:[],departments:[{name:'Отдел по реализации досуговых проектов',vkUrl:'https://vk.com/od.pmckir',source:'user_message',checkedAt:null},{name:'ДоброЦентр «Кировский»',vkUrl:'https://vk.com/dobro_kirovskiy',alternativeUserUrl:'https://vk.com/public204315177',sourceUrl:'https://pmckir.ru/?page_id=1667',notes:['Псевдоним dobro_kirovskiy опубликован официальным сайтом. Тождество с numeric public204315177 напрямую не проверено.']},{name:'Точка опоры',description:'Отдел по социальной работе',vkUrl:'https://vk.com/social_kirovskiy',source:'user_message',checkedAt:null}]};
const registry={checked:'2026-10-23',source:'Официальный сайт ПМЦ «Кировский», раздел «Наши клубы» и 19 страниц',note:research.purpose,clubs:[]};
research.departments[0]={...research.departments[0],source:'official_web',sourceUrl:'https://pmckir.ru/?page_id=553',checkedAt:'2026-10-23',phone:'372-18-06',email:'od.pmckir@ya.ru'};
research.departments[2]={...research.departments[2],source:'official_web',sourceUrl:'https://pmckir.ru/?page_id=553',checkedAt:'2026-10-23',phone:'377-21-13',email:'soc.kir@mail.ru',notes:['Официальная страница подтверждает отдел по социальной работе и этот VK; название «Точка опоры» дано пользователем.']};
for(const [i,club] of clubs.entries()){
 const page=manifest.clubPages.find(p=>p.url===club.sourceUrl);if(!page||page.error)throw Error(club.name);
 const vk=page.links.find(a=>/^https:\/\/vk\.(com|ru)\//.test(a.url))?.url;
 if(userLinks[i]&&vk!==`https://vk.com/${userLinks[i]}`)throw Error(`VK mismatch ${club.name}`);
 club.officialUrl=page.url;if(vk)club.vkUrl=vk;
 club.sourceCheckedAt='2026-10-23';club.contactSource={url:page.url,checkedAt:'2026-10-23',vkEvidence:research.purpose};
 const lines=page.text.split('\n');const marker=lines.findIndex(x=>/Клубные формирования|Деятельность пространства/.test(x));
 const directionLines=lines.slice(marker+1).filter(x=>x.trim()).map(x=>x.replace(/^[-–—]\s*/,'').replace(/\s+[–—]\s+.*$/,'').trim());
 research.clubs.push({name:club.name,officialUrl:page.url,pageSha256:page.sha256,vkUrl:vk??'',userLinkMatched:Boolean(userLinks[i]),sourceCheckedAt:'2026-10-23',activities:club.activities,sourceLines:directionLines,images:page.images,scheduleStatus:club.name==='Молодёжный'?'Четыре регулярные встречи с точным временем начала; другие события по заявкам или в часы работы.':'На странице клуба не опубликована сетка расписания. Изображения представлены логотипами, портретами и фотографиями помещений.',notes:club.note?[club.note]:[]});
 registry.clubs.push({name:club.name,url:page.url,...(vk?{vkUrl:vk}:{}),sourceCheckedAt:'2026-10-23'});
 if(club.name==='Канонерец'){delete club.activitiesSource;club.note='Адрес, направления и ссылка VK сверены с официальной страницей ПМЦ 23.10.2026.';}
 if(['Север','Центр'].includes(club.name))club.type='Молодёжное пространство';
}
const mol=clubs.find(c=>c.name==='Молодёжный');
for(const activity of ['Разговорный английский язык «КиноВзгляд»','Игра «Расследование культурного многообразия»','Дискуссионно-литературный клуб «3К»'])if(!mol.activities.includes(activity))mol.activities.push(activity);
mol.activityPages=[['Клуб молодой семьи','Семейный клуб «От чистого сердца»','https://vk.com/fcmolspase'],['Гражданские инициативы','Центр «Содружество»','https://vk.com/dod_sodruzhestvo'],['Настольные игры','Клуб «Маска»','https://vk.com/molspaseplay'],['Разговорный английский язык «КиноВзгляд»','Клуб «КиноВзгляд»','https://vk.ru/cinetalk']].map(([activity,title,url],i)=>({id:`molodezhny-${i+1}`,catalogActivity:activity,title,vkUrl:url,officialUrl:mol.sourceUrl,sourceUrl:mol.sourceUrl,sourceCheckedAt:'2026-10-23',mapping:'Соответствие подтверждено описанием на официальной странице пространства.'}));
mol.activitySchedule=[['Клуб молодой семьи','вторник','13:00','Каждый чётный вторник (формулировка источника; дату встречи уточни).'],['Разговорный английский язык «КиноВзгляд»','среда','19:00','Каждая третья среда месяца'],['Игра «Расследование культурного многообразия»','пятница','19:00','Каждая третья пятница месяца'],['Дискуссионно-литературный клуб «3К»','суббота','18:30','Вторая суббота месяца']].map(([activity,day,time,frequency])=>({activity,sourceType:'official_web',sourceUrl:mol.sourceUrl,sourceNote:'Указано время начала. Продолжительность встречи и ближайшую дату уточни у организатора.',schedule:[{day,time,frequency,group:activity}]}));
await writeGeneratedFile('data/clubs-kirovsky.json',JSON.stringify(clubs,null,2)+'\n');
await writeGeneratedFile('data/research/kirovsky-official-evidence.json',JSON.stringify(research,null,2)+'\n');
await writeGeneratedFile('data/research/kirovsky-official-club-pages.json',JSON.stringify(registry,null,2)+'\n');
console.log(JSON.stringify({clubs:clubs.length,vk:clubs.filter(c=>c.vkUrl).length,matchedUserLinks:research.clubs.filter(c=>c.userLinkMatched).length,schedules:mol.activitySchedule.length,activityLinks:mol.activityPages.length}));
