const menuToggle = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('#mobile-nav');

if (menuToggle && mobileNav) {
  menuToggle.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!open));
    menuToggle.setAttribute('aria-label', open ? 'Открыть меню' : 'Закрыть меню');
    mobileNav.hidden = open;
  });
  mobileNav.addEventListener('click', event => {
    if (!event.target.closest('a')) return;
    mobileNav.hidden = true;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Открыть меню');
  });
}

const normalize = value => value.toLocaleLowerCase('ru').replaceAll('\u00a0', ' ').trim();

const districtSearch = document.querySelector('#district-search');
if (districtSearch) {
  const cards = [...document.querySelectorAll('#district-grid .linked-card')];
  const empty = document.querySelector('#district-empty');
  const update = () => {
    const query = normalize(districtSearch.value);
    let visible = 0;
    for (const card of cards) {
      card.hidden = !normalize(card.textContent).includes(query);
      if (!card.hidden) visible++;
    }
    empty.hidden = visible !== 0;
  };
  districtSearch.addEventListener('input', update);
}

const clubSearch = document.querySelector('#club-search');
if (clubSearch) {
  const cards = [...document.querySelectorAll('#club-grid .club-card')];
  const chips = [...document.querySelectorAll('.filter-chip[data-topic]')];
  const centerChips = [...document.querySelectorAll('#center-filters [data-center]')];
  const empty = document.querySelector('#club-empty');
  const count = document.querySelector('#club-count');
  const initial = new URLSearchParams(location.search).get('topic');
  let selected = chips.some(chip => chip.dataset.topic === initial) ? initial : 'all';
  let selectedCenter = 'all';
  const update = () => {
    const query = normalize(clubSearch.value);
    let visible = 0;
    for (const card of cards) {
      const matchesTopic = selected === 'all' || card.dataset.topics.split(' ').includes(selected);
      const matchesCenter = selectedCenter === 'all' || card.dataset.center === selectedCenter;
      card.hidden = !matchesTopic || !matchesCenter || !normalize(card.dataset.search).includes(query);
      if (!card.hidden) visible++;
    }
    for (const chip of chips) {
      const active = chip.dataset.topic === selected;
      chip.classList.toggle('active', active);
      chip.setAttribute('aria-pressed', String(active));
    }
    for (const chip of centerChips) {
      const active = chip.dataset.center === selectedCenter;
      chip.classList.toggle('active', active);
      chip.setAttribute('aria-pressed', String(active));
    }
    count.textContent = `Показано ${visible} из ${cards.length}`;
    empty.hidden = visible !== 0;
  };
  clubSearch.addEventListener('input', update);
  chips.forEach(chip => chip.addEventListener('click', () => {
    selected = chip.dataset.topic;
    const url = new URL(location.href);
    if (selected === 'all') url.searchParams.delete('topic');
    else url.searchParams.set('topic', selected);
    history.replaceState(null, '', url);
    update();
  }));
  centerChips.forEach(chip => chip.addEventListener('click', () => {
    selectedCenter = chip.dataset.center;
    update();
  }));
  update();
}
