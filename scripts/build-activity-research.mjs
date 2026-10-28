import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifyActivity, subtopicToTopic, topicGroups } from './topic-taxonomy.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const folder = path.join(root, 'data/research');
const config = JSON.parse(await fs.readFile(path.join(folder, 'activity-type-normalization-2026-10-22.json'), 'utf8'));
const key = value => value.normalize('NFKC').toLocaleLowerCase('ru-RU').replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
const aliases = new Map(Object.entries(config.aliasGroups).flatMap(([name, variants]) => [name, ...variants].map(variant => [key(variant), name])));
const composites = new Map(Object.entries(config.composites).map(([name, values]) => [key(name), values]));
const unclear = new Set(config.unclearLabels.map(key));
const labels = new Map();
const types = new Map();
let clubCount = 0;
let occurrences = 0;
for (const file of (await fs.readdir(path.join(root, 'data'))).filter(file => /^clubs-.*\.json$/.test(file)).sort()) {
  const clubs = JSON.parse(await fs.readFile(path.join(root, 'data', file), 'utf8'));
  for (const [clubIndex, club] of clubs.entries()) {
    clubCount++;
    const clubId = `${file}:${clubIndex}`;
    for (const raw of club.activities ?? []) {
      occurrences++;
      const labelKey = key(raw);
      let label = labels.get(labelKey);
      if (!label) {
        const clean = raw.replace(/\s*[«“][^»”]+[»”]/gu, '').replace(/\s*\([^)]*\)/gu, '').trim();
        const names = unclear.has(labelKey) ? [] : composites.get(labelKey) ?? [aliases.get(labelKey) ?? aliases.get(key(clean)) ?? clean];
        label = {label: raw, types: names, normalization: !names.length ? 'needs_subject_clarification' : composites.has(labelKey) ? 'composite_subjects' : names[0] !== raw ? 'merged_label' : 'source_label', clubIds: new Set(), subgroups: classifyActivity(raw)};
        labels.set(labelKey, label);
      }
      label.clubIds.add(clubId);
      for (const name of label.types) {
        let type = types.get(name);
        if (!type) {
          type = {name, labels: new Set(), clubs: new Map(), subgroups: new Set()};
          types.set(name, type);
        }
        type.labels.add(raw);
        type.clubs.set(clubId, {id: clubId, sourceFile: `data/${file}`, sourceIndex: clubIndex, name: club.name, district: file.replace(/^clubs-|\.json$/g, '')});
        label.subgroups.forEach(group => type.subgroups.add(group));
      }
    }
  }
}
let observations = [];
try {
  observations = JSON.parse(await fs.readFile(path.join(folder, 'wordstat-2026-10-22/activity-demand.json'), 'utf8')).samples;
} catch (error) { if (error.code !== 'ENOENT') throw error; }
const observationMap = new Map(observations.map(sample => [sample.query, sample]));
const records = [...types.values()].sort((a,b) => b.clubs.size-a.clubs.size || a.name.localeCompare(b.name, 'ru')).map((type, index) => {
  const query = config.queryOverrides[type.name] ?? `${type.name.toLocaleLowerCase('ru-RU')} бесплатно`;
  const observed = observationMap.get(query);
  const summary = observed?.summary?.match(/за (\d{2}\.\d{2}\.\d{4})\s*[–—-]\s*(\d{2}\.\d{2}\.\d{4}):\s*([\d\s]+)$/u);
  return {id:`activity-${String(index+1).padStart(3,'0')}`, name:type.name, clubCount:type.clubs.size, districts:[...new Set([...type.clubs.values()].map(c=>c.district))], sourceLabels:[...type.labels], clubs:[...type.clubs.values()], subgroups:[...type.subgroups], groups:[...new Set([...type.subgroups].map(group=>subtopicToTopic[group]))], query, queryMode:query.includes('бесплатно')?'free_option':'general_interest', wordstat:{status: summary ? 'observed' : observed ? 'no_summary_requires_review' : 'pending', count:summary ? Number(summary[3].replace(/\s/g,'')) : null, periodStart:summary?.[1]??null, periodEnd:summary?.[2]??null, sourceUrl:observed?.sourceUrl ?? `https://wordstat.yandex.ru/?region=2&view=table&words=${encodeURIComponent(query)}`, intentReview:'pending_offline_intent_review'}};
});
const inventory = {createdOn:config.date, scope:'Local research only; no new site pages or Popular section created', city:'Санкт-Петербург', catalog:{clubCount,occurrences,uniqueLabels:labels.size}, normalization:config.method, coverage:{typeCount:records.length,observed:records.filter(r=>r.wordstat.status==='observed').length, pending:records.filter(r=>r.wordstat.status==='pending').length, unclearLabels:[...labels.values()].filter(label=>!label.types.length).map(label=>({label:label.label,clubCount:label.clubIds.size}))}, taxonomy:topicGroups, labels:[...labels.values()].map(label=>({...label,clubIds:[...label.clubIds]})), types:records};
await fs.writeFile(path.join(folder, 'activity-types-2026-10-22.json'), JSON.stringify(inventory,null,2)+'\n');
const queryPlan = records.filter(record=>record.wordstat.status==='pending').map(record=>({id:record.id,name:record.name,query:record.query,clubs:record.clubCount}));
await fs.writeFile(path.join(folder, 'wordstat-2026-10-22/activity-query-plan.json'),JSON.stringify(queryPlan,null,2)+'\n');
const table = records.map(record=>`| ${record.name.replace(/\|/g,'/')} | ${record.clubCount} | ${record.sourceLabels.length} | ${record.query} | ${record.wordstat.count ?? (record.wordstat.status==='pending'?'ожидает':'уточнить')} | ${record.wordstat.periodStart ? record.wordstat.periodStart + ' - ' + record.wordstat.periodEnd : ''} | ${record.queryMode === 'free_option' ? 'бесплатный вариант' : 'общий интерес'} |`).join('\n');
await fs.writeFile(path.join(root,'docs/activity-types-research-2026-10-22.md'),`# Все виды занятий: реестр для исследования\n\nДата: 22.10.2026. Локальное исследование, новые страницы и раздел «Популярные» не созданы.\n\n## Объём\n\n- Клубов: ${clubCount}; записей занятий: ${occurrences}; разных исходных названий: ${labels.size}.\n- После редакционного объединения дублей и раскрытия составных названий: ${records.length} тем.\n- ${inventory.coverage.unclearLabels.length} названий требуют уточнения профиля: ${inventory.coverage.unclearLabels.map(row=>row.label).join('; ')}.\n- В Wordstat получен верхний счётчик для ${inventory.coverage.observed} тем; ожидают проверки ${inventory.coverage.pending}.\n\n## Как читать\n\nКлубы посчитаны по уникальной исходной записи, а не по повторениям названия занятия. Составное название может относиться к нескольким темам: это не доказывает наличие отдельных групп. Подвиды сохранены отдельно там, где программа различается. Объединения являются редакционной гипотезой; исходные названия, клубы, файлы и индексы сохранены в [полном реестре](../data/research/activity-types-2026-10-22.json). Каталог не изменён.\n\nОдин пробный запрос на тему. Для занятий используется уточнение «бесплатно»; для добровольчества, семейных и общественных объединений проверяется общий интерес. Эти режимы не сравниваются между собой. Регион Wordstat: Санкт-Петербург, все устройства. Общий счётчик и строки выдачи сохраняются отдельно в [наблюдениях](../data/research/wordstat-2026-10-22/activity-demand.json). Счётчик не равен числу людей, включает вложенные формулировки, может содержать онлайн-уроки, скачивание и другие нерелевантные намерения. Пересекающиеся запросы не складываются. Ноль по одному запросу не доказывает отсутствия спроса. Сервис предупреждает о частичной недоступности данных. До ручного разбора намерения и подбора синонимов это не рейтинг популярности. Спрос других городов и всей России этой выборкой не измерен.\n\n## Темы\n\n| Тема | Клубов | Названий-источников | Пробный запрос | Верхний счётчик Wordstat | Период | Режим |\n| --- | ---: | ---: | --- | ---: | --- | --- |\n${table}\n\n## Следующий этап\n\n1. Уточнить неясные названия и редакционные объединения; сохранить исходные подписи.\n2. Разобрать строки Wordstat: отделить поиск очных занятий от видео, файлов, трансляций и игр. Для приоритетных тем добавить запросы «секция», «кружок», «занятия», «СПб», возрастные уточнения.\n3. Сопоставить релевантный спрос с клубами, адресами, актуальностью набора и достаточностью содержания для статьи.\n4. Согласовать первые темы и добавлять статьи постепенно через прототипы.\n`);
console.log(JSON.stringify(inventory.coverage));
