const pad = value => String(value).padStart(2, '0');
const daysInMonth = (year, month) => new Date(Date.UTC(year, month, 0)).getUTCDate();

function exactDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:$|T)/.test(value)) return undefined;
  const iso = value.slice(0, 10);
  const [year, month, day] = iso.split('-').map(Number);
  return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month) ? iso : undefined;
}

export function isOlderThanCalendarYear(value, asOf) {
  const date = exactDate(value);
  const today = exactDate(asOf);
  if (!date || !today) return false;
  const [year, month, day] = date.split('-').map(Number);
  const anniversary = `${year + 1}-${pad(month)}-${pad(Math.min(day, daysInMonth(year + 1, month)))}`;
  return today > anniversary;
}

export function scheduleCaptionDate() {
  return new Intl.DateTimeFormat('sv-SE', {timeZone:'Europe/Moscow', year:'numeric', month:'2-digit', day:'2-digit'}).format(new Date());
}

const displayDate = iso => iso.split('-').reverse().join('.');
const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];

function printedStartDate(period) {
  const numeric = period.match(/(?:^|\s)с\s+(\d{2})\.(\d{2})\.(\d{4})(?:\D|$)/u);
  if (numeric) return exactDate(`${numeric[3]}-${numeric[2]}-${numeric[1]}`);
  const named = period.match(/(?:^|\s)с\s+(\d{1,2})\s+([а-я]+)\s+(\d{4})(?:\D|$)/u);
  const month = named ? months.indexOf(named[2]) + 1 : 0;
  return month ? exactDate(`${named[3]}-${pad(month)}-${pad(named[1])}`) : undefined;
}

export function scheduleCaptionMetadata(record, {verifiedAt, asOf = scheduleCaptionDate()} = {}) {
  const sourcePeriod = String(record.sourcePeriod ?? '').trim();
  const academic = sourcePeriod.match(/\b(20\d{2}\s*[-–/]\s*(?:20)?\d{2})\s+учебный\s+год/iu);
  const seasonal = /^(?:архив:\s*)?(?:летний график|лето|осень|график на)\s+20\d{2}(?:\s+год)?$/iu.test(sourcePeriod) ? sourcePeriod : '';
  // An academic-year label does not establish a first day of term.
  const from = academic ? undefined : exactDate(record.effectiveFrom) ?? printedStartDate(sourcePeriod);
  const to = academic ? undefined : exactDate(record.effectiveTo);
  const verified = exactDate(record.confirmedAt) ?? exactDate(record.sourceCheckedAt) ?? exactDate(verifiedAt);
  const period = academic ? `${academic[1]} учебный год` : seasonal;
  let label = period ? `Расписание: ${period}` : 'Расписание';
  if (from) label += ` с ${displayDate(from)}`;
  if (to) label += ` по ${displayDate(to)}`;
  if (verified) label += `${period || from || to ? '. Сведения на' : ': сведения на'} ${displayDate(verified)}`;
  if (!period && !from && !to && !verified) return undefined;
  // Age belongs to dated knowledge about this schedule, never a generic post,
  // club-wide check, file mtime or build date. Keep the role visible in the label.
  const knowledgeDate = verified ?? to ?? from;
  return {label:label + '.', knowledgeDate, verifiedAt:verified, from, to, period, warning:isOlderThanCalendarYear(knowledgeDate, asOf)};
}

export function renderScheduleCaption(records, {text, verifiedAt, asOf = scheduleCaptionDate()}) {
  const captions = records.filter(Boolean).map(record => ({activity:record.activity, ...scheduleCaptionMetadata(record, {verifiedAt, asOf})})).filter(item => item.label);
  const unique = [...new Map(captions.map(item => [JSON.stringify([item.label, item.warning]), item])).values()];
  return unique.map(item => `<p class="detail-muted schedule-source-note">${unique.length > 1 ? `${text(item.activity)}. ` : ''}${text(item.label)}${item.warning ? ' Актуальное время уточняй в&nbsp;сообществах.' : ''}</p>`).join('');
}
