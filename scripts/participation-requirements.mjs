import fs from 'node:fs/promises';
import { participationRoute } from './participation-explainer.mjs';

const facts = JSON.parse(await fs.readFile(new URL('../data/catalog-facts.json', import.meta.url), 'utf8'));
const requirements = facts.participation;
if (!Number.isInteger(requirements?.ageFrom) || !Number.isInteger(requirements?.ageTo) || requirements.ageTo < requirements.ageFrom || !requirements.citizenship || !requirements.agreement || requirements.funding !== 'budget') {
  throw new Error('Missing confirmed catalog participation requirements');
}
const escape = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[character]));

// These are editorial reminders appended to source records. Keep the source
// evidence intact and remove age-clarification requests only from public copy.
const agePromptEdits = [
  ['Возраст своей группы и наличие мест уточни у клуба', 'Наличие мест уточни у клуба'],
  ['Текущие условия и возраст группы уточни', 'Текущие условия уточни'],
  ['Возраст каждой группы в сетке не указан; перед визитом уточни время бесплатной группы своего возраста', 'Перед визитом уточни время бесплатной группы'],
  ['Конкретный возраст группы, места и порядок записи уточни у клуба', 'Наличие мест и порядок записи уточни у клуба'],
  ['Возраст конкретной группы на странице не указан; уточни условия бесплатного участия при записи', 'Условия бесплатного участия уточни при записи'],
  ['Возраст, состав конкретной группы и наличие мест уточни у организатора', 'Состав конкретной группы и наличие мест уточни у организатора'],
  ['Возраст, состав группы и наличие мест уточни при записи', 'Состав группы и наличие мест уточни при записи'],
  ['Уточни возраст и наличие мест в выбранной бесплатной группе', 'Уточни наличие мест в выбранной бесплатной группе'],
  ['Возраст своей группы, допуск, запись и наличие мест уточни перед посещением', 'Допуск, запись и наличие мест уточни перед посещением'],
  ['Возраст, условия и наличие мест своей группы уточни у организаторов', 'Условия и наличие мест своей группы уточни у организаторов'],
  ['Возраст своей группы и наличие мест уточни перед записью', 'Наличие мест уточни перед записью'],
  ['Возраст своей группы уточни у клуба', 'Наличие мест уточни у клуба'],
  ['Возраст группы и наличие мест уточни у организатора', 'Наличие мест уточни у организатора'],
  ['Возраст, группу и наличие мест уточни при записи', 'Группу и наличие мест уточни при записи'],
  ['Перед первым посещением уточни возраст и наличие мест в бесплатной группе', 'Перед первым посещением уточни наличие мест в бесплатной группе'],
].map(([before, after]) => [new RegExp(before.split(' ').map(word => word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('(?:\\s|&nbsp;)+'), 'giu'), after.replace(/(^| )(и|у|в|перед|при) /giu, '$1$2&nbsp;')]);

export function removeAgeClarificationPrompts(markup) {
  for (const [before, after] of agePromptEdits) markup = markup.replace(before, after);
  return markup;
}

// Link visible participation copy only. Preserve existing links and JSON/scripts.
export function linkParticipationMentions(markup, base = '') {
  let anchorDepth = 0;
  let rawElement = '';
  const space = '(?:\\s|&nbsp;)+';
  const phrase = new RegExp(`договор${space}об${space}участии${space}в${space}деятельности${space}клуба|подписать${space}(?:договор|документы)(?:${space}с${space}клубом)?`, 'giu');
  return markup.split(/(<[^>]+>)/g).map(part => {
    if (part.startsWith('<')) {
      if (/^<a(?:\s|>)/i.test(part)) anchorDepth++;
      if (/^<\/a\s*>/i.test(part)) anchorDepth = Math.max(0, anchorDepth - 1);
      if (/^<(script|style)\b/i.test(part)) rawElement = part.match(/^<(script|style)/i)[1].toLowerCase();
      if (rawElement && new RegExp(`^<\\/${rawElement}\\s*>`, 'i').test(part)) rawElement = '';
      return part;
    }
    if (anchorDepth || rawElement) return part;
    return part.replace(phrase, label => `<a class="participation-document-link" href="${base}${participationRoute}">${label}</a>`);
  }).join('');
}

export function renderParticipationRequirements({compact = false} = {}) {
  return `<div class="participation-requirements${compact ? ' participation-requirements--compact' : ''}" data-participation-requirements>${compact ? '' : '<h3>Основные условия участия</h3>'}<ul class="participation-requirements-list"><li><strong>Возраст:</strong> от&nbsp;${requirements.ageFrom} до&nbsp;${requirements.ageTo}&nbsp;лет.</li><li><strong>Гражданство:</strong> ${escape(requirements.citizenship)}.</li><li><strong>Оформление:</strong> Занятия проходят на&nbsp;бюджетной основе. Для участия нужно подписать договор с&nbsp;клубом.</li></ul></div>`;
}

export function addActivityParticipationRequirements(markup) {
  if (markup.includes('data-participation-requirements')) return markup;
  const updated = markup.replace(/(<section\b[^>]*\bid="join"[^>]*>[\s\S]*?<h2\b[^>]*>[\s\S]*?<\/h2>)/, heading => heading + renderParticipationRequirements());
  if (updated === markup) throw new Error('Activity page has no join section for participation requirements');
  return updated;
}
