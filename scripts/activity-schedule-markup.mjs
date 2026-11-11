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
 const frequency=[...new Set(record.schedule.map(s=>s.frequency).filter(Boolean))];
 return `${frequency.map(s=>`<p class="schedule-frequency"><strong>${text(s)}</strong></p>`).join('')}<div class="language-schedule-group catalog-schedule-group"><h3>${text(activity)}</h3>${parts}</div>`;
}
