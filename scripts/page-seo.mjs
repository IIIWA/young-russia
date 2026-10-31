export const siteOrigin = 'https://young-russia.ru';

const entities = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ', shy: '' };
export function plainText(value = '') {
  return value.replace(/<[^>]*>/g, '').replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (whole, code) => {
    if (code.startsWith('#')) return String.fromCodePoint(parseInt(code.slice(code[1]?.toLowerCase() === 'x' ? 2 : 1), code[1]?.toLowerCase() === 'x' ? 16 : 10));
    return entities[code] ?? whole;
  }).replace(/[\s\u00a0]+/g, ' ').replace(/\u00ad/g, '').trim();
}

export function canonicalUrl(relative, base = `${siteOrigin}/`) {
  const url = new URL(relative, base);
  url.search = '';
  url.hash = '';
  if (url.pathname === '/index.html') url.pathname = '/';
  return url.href;
}

export function pageSeo(relative, page) {
  const canonical = canonicalUrl(`/${relative}`);
  const navigation = page.body.match(/<nav class="breadcrumbs"[^>]*>([\s\S]*?)<\/nav>/)?.[1] ?? '';
  const crumbs = [...navigation.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>|<span\b[^>]*>([\s\S]*?)<\/span>/g)]
    .map(match => ({ name: plainText(match[2] ?? match[3]), href: match[1] ? canonicalUrl(match[1], canonical) : canonical }))
    .filter(crumb => crumb.name && crumb.name !== '/');
  const district = crumbs.find(crumb => /\/districts\/(?!index\.html)[^/]+\.html$/.test(crumb.href))?.name;
  let title = plainText(page.title);
  let description = plainText(page.description);
  if (relative === 'index.html') {
    title = 'Бесплатные кружки и секции в Санкт-Петербурге | ПМК Петербурга';
    description = 'Бесплатные занятия для молодёжи в Санкт-Петербурге: спорт, языки, творчество и музыка. Выберите район, найдите клуб и узнайте, как присоединиться.';
  } else if (relative.startsWith('activities/') || relative.startsWith('clubs/')) {
    if (!district) throw new Error(`Missing district for SEO: ${relative}`);
    title = `${title.replace(/ \| ПМК Петербурга$/, '')}, ${district}, Санкт-Петербург`;
    // Existing club titles may already contain the district.
    title = title.replace(`${district}, ${district}`, district);
    description = `${description} ${district}, Санкт-Петербург.`;
  } else if (relative.startsWith('districts/') && relative !== 'districts/index.html') {
    title = `${title.replace(/ \| ПМК Петербурга$/, '')}, Санкт-Петербург`;
  }
  const breadcrumb = crumbs.length > 1 ? {
    '@type': 'BreadcrumbList', '@id': `${canonical}#breadcrumb`,
    itemListElement: crumbs.map((crumb, index) => ({ '@type': 'ListItem', position: index + 1, name: crumb.name, item: crumb.href })),
  } : null;
  const imageTag = page.body.match(/<img\b[^>]*>/)?.[0] ?? '';
  const source = imageTag.match(/\bsrc="([^"]+)"/)?.[1];
  const candidate = source ? new URL(source, canonical) : null;
  const usePageImage = candidate?.origin === siteOrigin && candidate.pathname.startsWith('/assets/');
  const socialImage = usePageImage ? candidate.href : `${siteOrigin}/assets/hero-youth.webp`;
  const socialImageAlt = usePageImage ? plainText(imageTag.match(/\balt="([^"]*)"/)?.[1] ?? '') : 'Иллюстрация: молодые люди общаются за игрой в настольный теннис';
  const dateModified = page.body.match(/<p class="guide-meta">[^<]*<time datetime="(\d{4}-\d{2}-\d{2})"/)?.[1];
  const webPage = {
    '@type': 'WebPage', '@id': `${canonical}#webpage`, url: canonical,
    name: title, description, inLanguage: 'ru',
    isPartOf: {'@id': `${siteOrigin}/#website`},
    ...(breadcrumb ? {breadcrumb: {'@id': breadcrumb['@id']}} : {}),
    ...(dateModified ? {dateModified} : {}),
  };
  const graph = [
    ...(relative === 'index.html' ? [{
      '@type': 'WebSite', '@id': `${siteOrigin}/#website`, url: `${siteOrigin}/`,
      name: 'ПМК Петербурга', alternateName: 'young-russia.ru', inLanguage: 'ru',
    }] : []),
    webPage,
    ...(breadcrumb ? [breadcrumb] : []),
  ];
  const structuredData = JSON.stringify({'@context':'https://schema.org', '@graph':graph}).replace(/</g, '\\u003c');
  return { title, description, canonical, socialImage, socialImageAlt, structuredData };
}
