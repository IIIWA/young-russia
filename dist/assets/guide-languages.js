const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const flagBase = '/assets/flags/';
const flagFiles = new Map([
  ['английский', 'gb'], ['немецкий', 'de'], ['французский', 'fr'],
  ['испанский', 'es'], ['китайский', 'cn'], ['японский', 'jp'], ['корейский', 'kr'],
]);

export function activityLanguages(activities) {
  const labels = (activities ?? []).map(activity => typeof activity === 'string' ? activity : activity?.label ?? activity?.activity ?? '');
  const patterns = [['английский',/английск/iu],['немецкий',/немецк/iu],['французский',/французск/iu],['испанский',/испанск/iu],['китайский',/китайск/iu],['японский',/японск/iu],['корейский',/корейск/iu],['жестовый язык',/жестов/iu]];
  return patterns.filter(([,pattern]) => labels.some(label => pattern.test(label))).map(([label]) => label);
}

export function languageMarkerOptions(ymaps, point, key) {
  const color = point.provisional ? '#db7819' : '#1976d2';
  if (!Array.isArray(point.languages)) return {preset:'islands#circleDotIcon', iconColor:color};
  const languages = [...new Set(point.languages)];
  const badges = (languages.length ? languages : ['Язык уточняется']).map(language => {
    const normalized = language.toLocaleLowerCase('ru');
    const file = flagFiles.get(normalized);
    return file
      ? `<img src="${flagBase}${file}.svg" width="22" height="15" alt="" title="${escapeHtml(language)}">`
      : `<span class="topic-map-language-neutral" title="${escapeHtml(language)}">${normalized === 'жестовый язык' ? 'SL' : '?'}</span>`;
  }).join('');
  const label = `${point.name}. Языки: ${languages.length ? languages.join(', ') : 'уточняются'}`;
  const width = Math.max(44, (languages.length || 1) * 25 + 7);
  const layout = ymaps.templateLayoutFactory.createClass(
    `<button type="button" class="topic-language-marker" data-topic-language-marker="${escapeHtml(key)}" aria-label="${escapeHtml(label)}" style="--topic-marker-color:${color}"><span class="topic-map-language-flags">${badges}</span><span class="topic-map-language-dot" aria-hidden="true"></span></button>`
  );
  return {
    iconLayout:layout,
    iconShape:{type:'Rectangle', coordinates:[[-width / 2, -38], [width / 2, 10]]},
    hideIconOnBalloonOpen:false,
  };
}


export function initGuideLanguageSelection(signal) {
  const navigation = document.querySelector('.guide-language-buttons');
  const table = document.querySelector('.guide-language-table');
  const section = document.querySelector('#languages');
  if (!navigation || !table || !section) return () => {};

  const compact = window.matchMedia('(max-width: 1100px), (hover: none) and (pointer: coarse)');
  const buttons = [...navigation.querySelectorAll('a[href^="#guide-language-"]')];
  const groups = new Map();
  for (const button of buttons) {
    const id = button.getAttribute('href').slice(1);
    const heading = document.getElementById(id);
    if (!heading) continue;
    const rows = [heading];
    // English has a separate heading and a full-width row of clubs.
    for (let next = heading.nextElementSibling; next && !next.id; next = next.nextElementSibling) rows.push(next);
    groups.set(id, {button, rows});
  }
  if (!groups.size) return () => {};
  const defaultLanguage = groups.has('guide-language-en') ? 'guide-language-en' : groups.keys().next().value;
  const languageFromUrl = () => {
    const id = location.hash.slice(1);
    if (groups.has(id)) return id;
    return !id || id === 'languages' ? defaultLanguage : null;
  };
  let selected = languageFromUrl() ?? defaultLanguage;
  let interacted = false;

  function render() {
    navigation.dataset.selectionMode = compact.matches ? 'single' : 'all';
    for (const [id, {button, rows}] of groups) {
      const active = compact.matches && id === selected;
      rows.forEach(row => { row.hidden = compact.matches && !active; });
      if (active) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    }
  }
  const showControls = () => requestAnimationFrame(() => { if (!signal.aborted) section.scrollIntoView({block:'start', behavior:'auto'}); });

  navigation.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    const button = event.target.closest('.guide-language-button');
    if (!button || !navigation.contains(button) || !compact.matches) return;
    event.preventDefault();
    interacted = true;
    const id = button.getAttribute('href').slice(1);
    if (!groups.has(id)) return;
    if (location.hash !== `#${id}`) history.pushState(null, '', `#${id}`);
    selected = id;
    render();
  }, {signal});
  const syncUrl = () => {
    const id = languageFromUrl();
    if (id) selected = id;
    render();
    if (compact.matches && id) showControls();
  };
  window.addEventListener('hashchange', syncUrl, {signal});
  window.addEventListener('popstate', syncUrl, {signal});
  compact.addEventListener('change', () => {
    const bounds = section.getBoundingClientRect();
    const sectionWasVisible = bounds.top < innerHeight && bounds.bottom > 0;
    render();
    if (compact.matches && sectionWasVisible) showControls();
  }, {signal});

  render();
  if (compact.matches && groups.has(location.hash.slice(1))) {
    showControls();
    window.addEventListener('load', () => { if (!interacted) showControls(); }, {once:true,signal});
  }
  return () => {
    groups.forEach(({button, rows}) => { rows.forEach(row => { row.hidden = false; }); button.removeAttribute('aria-current'); });
    delete navigation.dataset.selectionMode;
  };
}
