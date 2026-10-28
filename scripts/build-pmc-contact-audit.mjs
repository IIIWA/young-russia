import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeGeneratedFile } from './write-generated-file.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.join(root, 'data');
const out = path.join(dataDir, 'research', 'pmc-club-contact-audit.json');
const files = (await fs.readdir(dataDir)).filter(name => /^clubs-.*\.json$/.test(name)).sort();
const nevskySupplement = JSON.parse(await fs.readFile(path.join(dataDir, 'research', 'nevsky-official-club-links.json'), 'utf8'));
const kirovskySupplement = JSON.parse(await fs.readFile(path.join(dataDir, 'research', 'kirovsky-official-club-pages.json'), 'utf8'));
const userLinks = JSON.parse(await fs.readFile(path.join(dataDir, 'research', 'user-supplied-vk-links.json'), 'utf8'));
const normalize = value => value.toLowerCase().replace(/ё/g, 'е').replace(/[^а-яa-z0-9]/g, '');
const nevskyByName = new Map(nevskySupplement.clubs.map(item => [normalize(item.name), item]));
const kirovskyByName = new Map(kirovskySupplement.clubs.map(item => [normalize(item.name), item]));
const clubs = [];
const directionPrototypeRoutes = new Map([
  ['morskoy-devyatyy-lad', 'activities/morskoy-devyatyy-lad.html'],
  ['morskoy-sam-sebe-kinolog', 'activities/morskoy-sam-sebe-kinolog.html'],
  ['morskoy-kak-eto-skazat', 'activities/morskoy-razgovornyy-klub.html'],
  ['morskoy-yaponskiy', 'activities/morskoy-razgovornyy-klub.html'],
  ['morskoy-vspyshka', 'activities/morskoy-vspyshka.html'],
]);

for (const filename of files) {
  const district = filename.slice('clubs-'.length, -'.json'.length);
  const entries = JSON.parse(await fs.readFile(path.join(dataDir, filename), 'utf8'));
  for (const [index, entry] of entries.entries()) {
    const supplement = district === 'nevsky' ? nevskyByName.get(normalize(entry.name)) : district === 'kirovsky' ? kirovskyByName.get(normalize(entry.name)) : null;
    const activityPages = entry.activityPages || userLinks.activities.filter(item => item.district === district && normalize(item.club) === normalize(entry.name));
    clubs.push({
      id: `${district}:${index + 1}`,
      district,
      organization: entry.organization || '',
      name: entry.name,
      type: entry.type || '',
      address: entry.address || '',
      activities: entry.activities || [],
      phone: entry.phone || '',
      officialPhone: supplement?.phone || '',
      email: entry.email || '',
      links: {
        vk: supplement?.vk || entry.vkUrl || '',
        official: supplement?.url || entry.officialUrl || '',
      },
      vkApproval: entry.vkUrlApprovedAt ? {approvedByUserAt: entry.vkUrlApprovedAt, source: entry.vkUrlSource || '', sourceLine: entry.vkUrlSourceLine || null, alternateUrls: entry.vkUrlAlternates || [], aliasConfirmedByUserAt: entry.vkUrlAliasConfirmedAt || '', sharedWith: entry.vkUrlSharedWith || ''} : null,
      activityPages: activityPages.map(item => ({
        id: item.id,
        title: item.title,
        catalogActivity: item.catalogActivity,
        languages: item.languages || [],
        suggestedCatalogActivity: item.suggestedCatalogActivity || '',
        vkUrl: item.vkUrl,
        officialUrl: item.officialUrl || '',
        mapping: item.mapping,
        sourceLine: item.sourceLine || null,
        approvedByUserAt: item.approvedByUserAt || '',
        schedule: item.schedule || [],
        prototypeRoute: directionPrototypeRoutes.get(item.id) || '',
        pageStatus: directionPrototypeRoutes.has(item.id) ? 'Есть прототип и производственная страница' : item.approvedByUserAt ? 'Ссылка сообщества показана в локальной карточке клуба' : 'Запланирована; шаблон проходит согласование',
      })),
      activitySchedule: entry.activitySchedule || [],
      scheduleSource: entry.scheduleSource || '',
      scheduleCheckedAt: entry.scheduleCheckedAt || '',
      source: entry.sourceUrl || '',
      reviewSource: supplement?.url || '',
      sourceDate: entry.sourceDate || '',
      projectFile: `data/${filename}`,
      review: {
        vk: supplement?.vk || entry.contactSource?.vkEvidence ? 'Ссылка указана на официальном сайте центра; сама страница VK не открывалась' : entry.vkUrl ? 'Сохранено в проекте; требуется проверить страницу' : 'Ссылка не найдена в данных проекта',
        contacts: supplement?.phone && entry.phone && normalize(supplement.phone) !== normalize(entry.phone) ? 'Телефон из проекта расходится с официальным сайтом центра' : supplement?.phone ? 'Телефон указан на официальном сайте центра' : entry.phone || entry.email ? 'Сохранено в проекте; требуется сверить актуальность' : 'Контакты не найдены в данных проекта',
      },
    });
  }
}

const summary = {
  clubs: clubs.length,
  withVk: clubs.filter(x => x.links.vk).length,
  userApprovedClubVk: clubs.filter(x => x.vkApproval?.approvedByUserAt).length,
  withOfficialPage: clubs.filter(x => x.links.official).length,
  withPhone: clubs.filter(x => x.phone).length,
  withOfficialPhone: clubs.filter(x => x.officialPhone).length,
  withAnyPhone: clubs.filter(x => x.phone || x.officialPhone).length,
  withEmail: clubs.filter(x => x.email).length,
  withActivities: clubs.filter(x => x.activities.length).length,
  withActivityVk: clubs.reduce((count, club) => count + club.activityPages.filter(page => page.vkUrl).length, 0),
};
await fs.mkdir(path.dirname(out), { recursive: true });
await writeGeneratedFile(out, JSON.stringify({
  created: '2026-10-16',
  updated: '2026-10-23',
  purpose: 'Рабочий реестр для последующей проверки и применения ссылок и контактов на сайте; это не доказательство их текущей актуальности.',
  summary,
  clubs,
}, null, 2) + '\n');
console.log(JSON.stringify(summary));
