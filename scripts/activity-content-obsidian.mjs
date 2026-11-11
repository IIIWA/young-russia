import {approvedFieldRef, approvedDescriptionParts, attachApprovedActivityContent, approvedOfficialLinkPresentation, canonicalValueSha256} from './activity-editorial-content.mjs';

export const activityBlockStart = '<!-- YR_ACTIVITY_CONTENT:START -->';
export const activityBlockEnd = '<!-- YR_ACTIVITY_CONTENT:END -->';
const md = value => String(value).replace(/[\r\n]+/g, ' ').replace(/([\\`*_{}\[\]<>#|])/g, '\\$1');
const mdDescriptionPart = value => md(value).replace(/^([+-])(?=\s|$|-)/, '\\$1').replace(/^(\d+)([.)])(?=\s|$)/, '$1\\$2');

export function approvedClubState(club, {approvals,catalogPath} = {}) {
  const proof = approvals?.clubChanges?.find(item => item.catalogFile === catalogPath && item.club === club?.name && item.address === club?.address && item.field === 'vkUrl' && item.value === club?.vkUrl);
  if (!proof) return undefined;
  return {vkUrl:club.vkUrl, activities:[...club.activities], scheduleCount:(club.activitySchedule ?? []).length};
}

export function findCatalogClub(catalog, name, address) {
  const named = catalog.filter(club => club.name === name);
  if (named.length === 1) {
    if (address !== undefined && named[0].address !== address) throw new Error(`Public club address drift: ${name}`);
    return named[0];
  }
  if (!named.length) return undefined;
  const addressed = named.filter(club => club.address === address);
  if (addressed.length !== 1) throw new Error(`Ambiguous public club identity: ${name}`);
  return addressed[0];
}

function link(value) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return undefined;
    return `<${url.href.replaceAll('<', '%3C').replaceAll('>', '%3E')}>`;
  } catch { return undefined; }
}

export function renderApprovedActivityBlock(club, {approvals, catalogPath, clubIndex} = {}) {
  club = attachApprovedActivityContent(club, approvals, catalogPath, clubIndex);
  const sections = [];
  const seen = new Set();
  const state = approvedClubState(club,{approvals,catalogPath});
  if (state) sections.push(`### Действующие направления каталога\n\n${state.activities.map(activity => `- ${md(activity)}`).join('\n')}\n\n[ВКонтакте клуба](${link(state.vkUrl)})`);
  const labels = {vkUrl:'Сообщество направления', officialUrl:'Страница направления', registrationUrl:'Запись'};
  for (const page of club?.activityPages ?? []) {
    const descriptionRef = approvedFieldRef(page, 'description');
    const parts = descriptionRef ? approvedDescriptionParts(page) : {paragraphs:[], listItems:[]};
    const fields = Object.entries(labels).flatMap(([field, label]) => {
      const ref = approvedFieldRef(page, field);
      const url = ref && link(page[field]);
      return url ? [{field, label:field === 'officialUrl' ? approvedOfficialLinkPresentation(page)?.label ?? label : label, url, ref}] : [];
    });
    if (!descriptionRef && !fields.length) continue;
    const key = JSON.stringify([page.catalogActivity, page.title, descriptionRef ? [page.description, descriptionRef.sourceUrl, descriptionRef.checkedAt] : '', parts, fields.map(item => [item.field, item.url, item.ref.sourceUrl, item.ref.checkedAt])]);
    if (seen.has(key)) continue;
    seen.add(key);
    const title = page.title || page.catalogActivity;
    if (!title) throw new Error('Approved activity content has no exact direction identity');
    const lines = [`### ${md(title)}`];
    if (page.catalogActivity && page.catalogActivity !== title) lines.push('', `Направление: ${md(page.catalogActivity)}.`);
    if (descriptionRef) lines.push('', md(page.description.trim()));
    for (const part of parts.paragraphs) lines.push('', mdDescriptionPart(part.text));
    if (parts.listItems.length) lines.push('', ...parts.listItems.map(part => `- ${mdDescriptionPart(part.text)}`));
    if (fields.length) lines.push('', ...fields.map(item => `- [${md(item.label)}](${item.url})`));
    const refs = [...(descriptionRef ? [descriptionRef] : []), ...parts.paragraphs.map(part => part.ref), ...parts.listItems.map(part => part.ref), ...fields.map(item => item.ref)];
    const sources = [...new Map(refs.map(ref => [JSON.stringify([ref.sourceUrl, ref.checkedAt]), ref])).values()];
    for (const ref of sources) {
      const url = link(ref.sourceUrl);
      if (!url) throw new Error('Approved activity evidence URL is invalid');
      const date = ref.checkedAt === null ? undefined : /^\d{4}-\d{2}-\d{2}(?:$|T)/.test(ref.checkedAt) ? ref.checkedAt.slice(0, 10).split('-').reverse().join('.') : md(ref.checkedAt);
      lines.push('', `Источник: [открыть](${url}).${date === undefined ? ' Дата проверки не установлена.' : ` Проверено: ${date}.`}`);
    }
    sections.push(lines.join('\n'));
  }
  const image = club?.scheduleImage;
  const imageProof = approvals?.assets?.find(item => item.catalogFile === catalogPath && item.club === club.name && item.address === club.address && item.path === image?.path);
  if (image && imageProof) {
    if (!/^assets\/schedules\/[a-z0-9-]+\.png$/.test(image.path) || !/^[a-f0-9]{64}$/.test(imageProof.sha256)
      || image.width !== imageProof.width || image.height !== imageProof.height) throw new Error('Invalid approved schedule image binding');
    sections.push(`### Изображение расписания клуба\n\n[Открыть исходное изображение](<../../../${image.path}>)\n\nДата расписания на изображении не указана.`);
  }
  for (const proof of approvals?.schedules ?? []) {
    if (proof.catalogFile !== catalogPath || proof.club !== club?.name || proof.address !== club?.address) continue;
    const record = club.activitySchedule?.find(item => item.activity === proof.activity);
    if (!record || canonicalValueSha256(record) !== proof.recordSha256) throw new Error('Approved schedule field drift');
    sections.push(`### ${md(record.activity)}\n\n${record.schedule.map(slot => `- ${md(slot.day)}: **${md(slot.time)}**${slot.group && slot.group !== record.activity ? `; ${md(slot.group)}` : ''}`).join('\n')}`);
  }
  const inactive = approvals?.retirements?.records?.filter(item => item.catalogFile === catalogPath && item.club === club?.name && item.address === club?.address) ?? [];
  if (inactive.length) sections.push(`### Снятые направления\n\nПо подтверждению пользователя от ${md(inactive[0].confirmedInactiveOn)} не действуют: ${inactive.map(item => md(item.activity)).join('; ')}. Дата прекращения занятий не установлена.`);
  return sections.length ? [activityBlockStart, '## Подтверждённые сведения о направлениях', ...sections, activityBlockEnd].join('\n\n') : '';
}

// Targeted Data updates preserve exact bytes outside this one managed block.
// No filesystem imports, frontmatter parsing or whole-note regeneration occurs.
export function mergeActivityBlock(existing, block) {
  const stringInput = typeof existing === 'string';
  const bytes = Buffer.from(existing);
  const start = Buffer.from(activityBlockStart);
  const end = Buffer.from(activityBlockEnd);
  const first = bytes.indexOf(start);
  const last = bytes.indexOf(end);
  if ((first < 0) !== (last < 0) || (first >= 0 && (last < first || bytes.indexOf(start, first + start.length) >= 0 || bytes.indexOf(end, last + end.length) >= 0))) {
    throw new Error('Unpaired, reversed or duplicate activity-content markers');
  }
  if (!block) return stringInput ? existing : bytes;
  if (!block.startsWith(activityBlockStart) || !block.endsWith(activityBlockEnd)
    || block.indexOf(activityBlockStart, activityBlockStart.length) >= 0
    || block.indexOf(activityBlockEnd) !== block.length - activityBlockEnd.length) {
    throw new Error('Expected one complete rendered activity-content block');
  }
  const eol = bytes.includes(Buffer.from('\r\n')) ? '\r\n' : '\n';
  const rendered = Buffer.from(block.replace(/\r?\n/g, eol));
  let result;
  if (first >= 0) {
    result = Buffer.concat([bytes.subarray(0, first), rendered, bytes.subarray(last + end.length)]);
  } else {
    const hasFinalNewline = bytes.length && bytes[bytes.length - 1] === 10;
    const separator = bytes.length ? Buffer.from(hasFinalNewline ? eol : eol + eol) : Buffer.alloc(0);
    result = Buffer.concat([bytes, separator, rendered, hasFinalNewline ? Buffer.from(eol) : Buffer.alloc(0)]);
  }
  return stringInput ? result.toString('utf8') : result;
}
