(() => {
  const navigation = document.querySelector('.guide-language-buttons');
  const table = document.querySelector('.guide-language-table');
  const section = document.querySelector('#languages');
  if (!navigation || !table || !section) return;

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
  if (!groups.size) return;
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
  const showControls = () => requestAnimationFrame(() => section.scrollIntoView({block:'start', behavior:'auto'}));

  navigation.addEventListener('click', event => {
    const button = event.target.closest('.guide-language-button');
    if (!button || !navigation.contains(button) || !compact.matches) return;
    event.preventDefault();
    interacted = true;
    const id = button.getAttribute('href').slice(1);
    if (!groups.has(id)) return;
    if (location.hash !== `#${id}`) history.pushState(null, '', `#${id}`);
    selected = id;
    render();
  });
  const syncUrl = () => {
    const id = languageFromUrl();
    if (id) selected = id;
    render();
    if (compact.matches && id) showControls();
  };
  window.addEventListener('hashchange', syncUrl);
  window.addEventListener('popstate', syncUrl);
  compact.addEventListener('change', () => {
    const bounds = section.getBoundingClientRect();
    const sectionWasVisible = bounds.top < innerHeight && bounds.bottom > 0;
    render();
    if (compact.matches && sectionWasVisible) showControls();
  });

  render();
  if (compact.matches && groups.has(location.hash.slice(1))) {
    showControls();
    window.addEventListener('load', () => { if (!interacted) showControls(); }, {once:true});
  }
})();
