import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { approximateActivityTopics, classifyActivity, classifyClub, subtopicToTopic, topicGroups } from './topic-taxonomy.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'data');
const files = (await fs.readdir(dataDir)).filter(name => /^clubs-[\w-]+\.json$/.test(name)).sort();
const clubs = (await Promise.all(files.map(async name => {
  const entries = JSON.parse(await fs.readFile(path.join(dataDir, name), 'utf8'));
  return entries.map(club => ({...club, sourceFile: name}));
}))).flat();

const occurrences = new Map();
for (const club of clubs) {
  for (const activity of club.activities ?? []) {
    const record = occurrences.get(activity) ?? {count: 0, clubs: []};
    record.count++;
    record.clubs.push(`${club.name} (${club.sourceFile})`);
    occurrences.set(activity, record);
  }
}

const unknown = [...occurrences].filter(([name]) => classifyActivity(name).length === 0)
  .sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0], 'ru'));
const emptyClubs = clubs.filter(club => !club.activities?.length);
const unclassifiedClubs = clubs.filter(club => club.activities?.length && !classifyClub(club).topics.length);
const topicCounts = Object.fromEntries(Object.keys(topicGroups).map(key => [key, clubs.filter(club => classifyClub(club).topics.includes(key)).length]));
const recognized = [...occurrences].filter(([name]) => classifyActivity(name).length);
const occurrencesTotal = [...occurrences.values()].reduce((sum, item) => sum + item.count, 0);
const unknownTotal = unknown.reduce((sum, [, item]) => sum + item.count, 0);
const approximate = Object.entries(approximateActivityTopics).map(([name, record]) => ({name, ...record, occurrence: occurrences.get(name)}));
const multiTagged = [...occurrences].filter(([name]) => {
  const tags = classifyActivity(name);
  return new Set(tags.map(tag => subtopicToTopic[tag])).size > 1;
});

const lines = [
  '# Проверка классификации занятий',
  '',
  'Рабочий отчёт, созданный `node scripts/audit-topics.mjs`. Предварительные темы сохраняют пометку «Тематика уточняется» на страницах сайта.',
  '',
  `- Клубов: ${clubs.length}.`,
  `- Занятий: ${occurrencesTotal}, различных названий: ${occurrences.size}.`,
  `- Без категории: ${unknownTotal} упоминаний, ${unknown.length} названий.`,
  `- Предварительно отнесено: ${approximate.reduce((sum, item) => sum + (item.occurrence?.count ?? 0), 0)} упоминания, ${approximate.length} названия.`,
  `- Без списка занятий: ${emptyClubs.length} ${emptyClubs.length === 1 ? 'клуб' : 'клубов'}. С занятиями, но без категории: ${unclassifiedClubs.length} клубов.`,
  `- Названий с несколькими крупными категориями: ${multiTagged.length}.`,
  '',
  '## Клубы по крупным направлениям',
  '',
  ...Object.entries(topicCounts).map(([key, count]) => `- ${topicGroups[key].label}: ${count}.`),
  '',
  '## Занятия без категории',
  '',
  '| Упоминаний | Занятие | Клуб |',
  '| ---: | --- | --- |',
  ...unknown.map(([name, item]) => `| ${item.count} | ${name.replaceAll('|', '\\|')} | ${item.clubs.join('; ').replaceAll('|', '\\|')} |`),
  '',
  '## Предварительные темы для проверки',
  '',
  '| Занятие | Клуб | Предварительная подкатегория | Причина проверки |',
  '| --- | --- | --- | --- |',
  ...approximate.map(item => `| ${item.name} | ${(item.occurrence?.clubs ?? []).join('; ')} | ${item.subtopics.map(tag => topicGroups[subtopicToTopic[tag]].subtopics[tag]).join(', ')} | ${item.reason} |`),
  '',
  '## Клубы с занятиями без категории',
  '',
  ...unclassifiedClubs.map(club => `- ${club.name} (${club.sourceFile}): ${(club.activities ?? []).join('; ')}.`),
  '',
  '## Примеры нескольких крупных категорий',
  '',
  ...multiTagged.slice(0, 80).map(([name]) => `- ${name}: ${classifyActivity(name).map(tag => topicGroups[subtopicToTopic[tag]].subtopics[tag]).join(', ')}.`),
  '',
];
await fs.writeFile(path.join(dataDir, 'topic-classification-review.md'), lines.join('\n'), 'utf8');
console.log(`Clubs ${clubs.length}; activities ${occurrencesTotal}; unique ${occurrences.size}; unknown ${unknownTotal}/${unknown.length}; empty clubs ${emptyClubs.length}; unclassified clubs ${unclassifiedClubs.length}; recognized distinct ${recognized.length}`);
