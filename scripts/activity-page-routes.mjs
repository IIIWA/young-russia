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
  return club.activities.map((label, index) => {
    const hasCommunity = club.activityPages?.some(page => page.catalogActivity === label && isVkCommunityUrl(page.vkUrl));
    const slug = hasCommunity ? activityPageSlug(club,label,index) : null;
    if (hasCommunity && !slug) throw new Error(`Missing activity route: ${club.name}, ${label}`);
    return {label,...(slug ? {url:`activities/${slug}.html`} : {})};
  });
}
