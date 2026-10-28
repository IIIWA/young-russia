// Shared by generated production activity pages and newly saved prototypes.
export function renderCatalogSchedule(record,{activity,index,text,html,weekdayLabels}) {
 const slots=record.schedule.flatMap(entry=>{
  const days=String(entry.day??entry.days??'').split(',').map(d=>d.trim().toLowerCase());
  const times=String(entry.time??'').split(',').map(t=>t.trim()).filter(Boolean);
  if(days.some(d=>!weekdayLabels.has(d))||!times.length)throw Error(`Invalid schedule: ${activity}`);
  return days.flatMap(day=>times.map(time=>({day,time,group:entry.group??activity,room:entry.room??''})));
 });
 const days=[...new Set(slots.map(s=>s.day))].sort((a,b)=>[...weekdayLabels.keys()].indexOf(a)-[...weekdayLabels.keys()].indexOf(b));
 const groups=[...new Set(slots.map(s=>s.group))],color=index%5;
 const place=room=>/^\d+(?:[ ,./-]\d+)*$/.test(room)?`Кабинет ${room}`:room;
 const cell=s=>`<span class="language-schedule-slot catalog-schedule-slot catalog-schedule-tone-${color}"><span class="catalog-schedule-time">${text(s.time)}</span>${s.room?`<small class="catalog-schedule-room">${text(place(s.room))}</small>`:''}</span>`;
 const columns=groups.some(group=>group.length>40)?1:2;
 const chunks=[];for(let i=0;i<groups.length;i+=columns)chunks.push(groups.slice(i,i+columns));
 const parts=chunks.map(chunk=>`<div class="language-schedule-frame catalog-schedule-part"><table class="language-schedule catalog-schedule-table" aria-label="Расписание по дням: ${text(activity)}, ${text(chunk.join(', '))}"><colgroup><col class="catalog-schedule-day">${chunk.map(()=>'<col>').join('')}</colgroup><thead><tr><th scope="col">День</th>${chunk.map(g=>`<th scope="col">${text(g)}</th>`).join('')}</tr></thead><tbody>${days.filter(d=>slots.some(s=>s.day===d&&chunk.includes(s.group))).map(day=>`<tr><th scope="row" aria-label="${text(day)}">${weekdayLabels.get(day)}</th>${chunk.map(g=>`<td>${slots.filter(s=>s.day===day&&s.group===g).map(cell).join('')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`).join('');
 const sourceDate=record.effectiveFrom?record.effectiveFrom.split('-').reverse().join('.'):'';
 const sourceEnd=record.effectiveTo?record.effectiveTo.split('-').reverse().join('.'):'';
 const sourceLabel=record.partial?'Часть расписания':record.seasonalStatus==='expired'?'Архивный летний график':record.sourcePeriod==='летний график 2026'?'Летний график 2026 года':record.sourcePeriod==='осень 2026'?'Осенний график 2026 года':'По официальной странице';
 const official=/^official_/.test(record.sourceType??'');
 const copied=/^user_vk_(?:image|text)$/.test(record.sourceType??'');
 const copiedSource=copied?`<p class="detail-muted schedule-source-note"><strong>${record.sourceType==='user_vk_image'?'По предоставленному снимку расписания.':'По предоставленным сведениям сообщества.'}</strong> ${text(record.sourceNote??'Уточни действующую сетку перед посещением.')}${record.sourceUrl?` <a href="${html(record.sourceUrl)}" target="_blank" rel="noopener noreferrer">Сообщество источника ↗</a>`:''}</p>`:'';
 const source=copied?copiedSource:official?`<p class="detail-muted schedule-source-note"><strong>${sourceLabel}${sourceDate?` с&nbsp;${text(sourceDate)}`:''}${sourceEnd?` по&nbsp;${text(sourceEnd)}`:''}.</strong> ${text(record.sourceNote??'Уточни изменения перед посещением.')}${record.sourceUrl?` <a href="${html(record.sourceUrl)}" target="_blank" rel="noopener noreferrer">Открыть источник ↗</a>`:''}</p>`:record.sourceType==='user_image'?`<p class="detail-muted">На&nbsp;снимке указано расписание${sourceDate?` с&nbsp;${text(sourceDate)}`:''}. Перед посещением уточни изменения и&nbsp;наличие мест у&nbsp;клуба.</p>`:record.sourceType==='user_confirmed'?`<p class="detail-muted schedule-source-note">${text(record.sourceNote??'Время подтверждено пользователем. Уточни изменения перед посещением.')}</p>`:'';
 const frequency=[...new Set(record.schedule.map(s=>s.frequency).filter(Boolean))];
 return `${source}${frequency.map(s=>`<p class="schedule-frequency"><strong>${text(s)}</strong></p>`).join('')}<div class="language-schedule-group catalog-schedule-group"><h3>${text(activity)}</h3>${parts}</div>`;
}
