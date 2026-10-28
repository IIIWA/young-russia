const translit = {'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'sch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'};
export const slugify = value => [...value.toLowerCase()].map(char => translit[char] ?? char).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const morskoyRoutes = {
  'Гитара':'morskoy-devyatyy-lad',
  'Курс «Сам себе кинолог»':'morskoy-sam-sebe-kinolog',
  'Разговорный клуб: английский, немецкий, японский':'morskoy-razgovornyy-klub',
  'Фотостудия':'morskoy-vspyshka',
};
const admiralteetsRoutes = {
  'Судовождение':'admiralteets-sudovozhdenie',
  'Морская пехота':'admiralteets-morskaya-pekhota',
  'Лазертаг':'admiralteets-lazertag',
  'Комбинированный туризм':'admiralteets-kombinirovannyy-turizm',
  'Общая физическая подготовка':'admiralteets-ofp',
  'Тайский бокс':'admiralteets-tayskiy-boks',
  'Бокс':'admiralteets-boks',
  'ЮНАРМИЯ':'admiralteets-yunarmiya',
  'Настольный теннис':'admiralteets-nastolnyy-tennis',
  'Тренажёрный зал':'admiralteets-trenazhernyy-zal',
};

export function activityPageSlug(club, activity, index) {
  index = club.activityRouteIndices?.[activity] ?? index;
  const district = club.districtCode ?? 'vasileostrovsky';
  if (district === 'vasileostrovsky' && club.name === 'Морской') return morskoyRoutes[activity];
  if (district === 'admiralteysky' && club.slug === 'klub-yunyh-moryakov-admiralteets') return admiralteetsRoutes[activity];
  return `${district}-${club.slug.slice(0, 42)}-${slugify(activity).slice(0, 34) || 'zanyatie'}-${String(index + 1).padStart(2, '0')}`;
}

export function isVkCommunityUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && /^(?:(?:www|m)\.)?vk\.(?:com|ru)$/.test(url.hostname)
      && /^\/[^/]+\/?$/.test(url.pathname)
      && !/^\/(?:id\d+|wall-?\d+_\d+|video-?\d+_\d+|photo-?\d+_\d+|topic-?\d+_\d+|im|write-?\d+|app\d+|join|login|feed)\/?$/i.test(url.pathname);
  } catch { return false; }
}

export function mapClubActivityEntries(club) {
  // Preserve the source index when computing routes; only the displayed list is sorted.
  return club.activities.map((label, index) => {
    const slug = activityPageSlug(club, label, index);
    if (!slug) throw new Error(`Missing activity route: ${club.name}, ${label}`);
    const pages = (club.activityPages ?? []).filter(page => page.catalogActivity === label);
    const schedules = (club.activitySchedule ?? []).filter(record => record.activity === label);
    const hasSchedule = [...schedules, ...pages].some(record =>
      record.seasonalStatus !== 'expired' && record.schedule?.some(slot => slot.time)
    ) || (club.classSchedule === 'Брейкинг: пн–сб 16:00–21:00' && label.startsWith('Брейкинг'));
    // Count direction-specific content shown on its page; shared club contacts do not affect rank.
    const contacts = new Set(pages.flatMap(page => [page.vkUrl, page.officialUrl,
      ...(page.communityContacts ?? []).map(contact => contact.profileUrl),
    ]).filter(Boolean));
    const sections = [
      pages.some(page => page.title && page.title !== label),
      pages.some(page => page.specialist),
      contacts.size > 0,
      pages.some(page => page.registrationUrl),
      club.activityConditions?.some(condition => condition.activity === label && condition.sourceText),
    ].filter(Boolean).length;
    return {label, url:`activities/${slug}.html`, index, priority:[Number(hasSchedule), sections, contacts.size]};
  }).sort((a,b) => b.priority[0] - a.priority[0] || b.priority[1] - a.priority[1]
    || b.priority[2] - a.priority[2] || a.index - b.index)
    .map(({label,url}) => ({label,url}));
}
