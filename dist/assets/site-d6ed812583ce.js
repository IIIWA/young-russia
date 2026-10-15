// Google Analytics 4 for the published site. Prototype pages use separate assets.
{
  const measurementId = 'G-S6ELZTNJ0N';
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });

  const googleTag = document.createElement('script');
  googleTag.async = true;
  googleTag.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(googleTag);
}

const menuButton = document.querySelector('.menu-button');
const mobileNav = document.querySelector('#mobile-nav');
if (menuButton && mobileNav) {
  menuButton.addEventListener('click', () => {
    const opened = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!opened));
    menuButton.setAttribute('aria-label', opened ? 'Открыть меню' : 'Закрыть меню');
    mobileNav.hidden = opened;
  });
  mobileNav.addEventListener('click', event => {
    if (event.target.closest('a')) {
      mobileNav.hidden = true;
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Открыть меню');
    }
  });
}

const clubsMap = document.querySelector('#clubs-map');
if (clubsMap) {
  const status = document.querySelector('#clubs-map-status');
  const setStatus = message => { if (status) status.textContent = message; };
  const allowedHost = location.hostname === 'young-russia.ru' || location.hostname === 'www.young-russia.ru';
  if (!allowedHost) {
    setStatus('Карта откроется на сайте young-russia.ru.');
  } else {
    let started = false;
    const loadMap = () => {
      if (started) return;
      started = true;
      const script = document.createElement('script');
      script.src = 'https://api-maps.yandex.ru/v3/?apikey=c615fafc-18f3-4567-a34b-587069896dd1&lang=ru_RU';
      script.async = true;
      script.onload = async () => {
        try {
          await window.ymaps3.ready;
          const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer } = window.ymaps3;
          const map = new YMap(clubsMap, { location: { center: [30.3158, 59.9391], zoom: 10 } });
          map.addChild(new YMapDefaultSchemeLayer());
          map.addChild(new YMapDefaultFeaturesLayer());
          if (status) status.hidden = true;
        } catch {
          setStatus('Не удалось загрузить карту. Открой её по ссылке ниже.');
        }
      };
      script.onerror = () => setStatus('Не удалось загрузить карту. Открой её по ссылке ниже.');
      document.head.appendChild(script);
    };
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          observer.disconnect();
          loadMap();
        }
      }, { rootMargin: '400px' });
      observer.observe(clubsMap);
    } else {
      loadMap();
    }
  }
}

const districtSearch = document.querySelector('#district-search');
if (districtSearch) {
  const cards = [...document.querySelectorAll('.directory-card')];
  const empty = document.querySelector('#district-empty');
  const topicNote = document.querySelector('#district-topic-note');
  const topicNoteText = document.querySelector('#district-topic-note-text');
  const topicNames = {languages:'Языки',sport:'Спорт',dance:'Танцы',creative:'Творчество',stage:'Сцена и музыка',community:'Общение'};
  const requestedTopic = new URLSearchParams(location.search).get('topic');
  const activeTopic = Object.hasOwn(topicNames, requestedTopic) ? requestedTopic : '';
  if (activeTopic && topicNote && topicNoteText) {
    topicNote.hidden = false;
    topicNoteText.textContent = `Направление «${topicNames[activeTopic]}»: показаны районы с подходящими площадками в каталоге.`;
  }
  function updateDistricts() {
    const query = districtSearch.value.toLocaleLowerCase('ru').trim();
    let visible = 0;
    for (const card of cards) {
      const topicMatch = !activeTopic || card.dataset.topics.split(' ').includes(activeTopic);
      card.hidden = !topicMatch || !card.dataset.search.includes(query);
      if (!card.hidden) visible++;
    }
    empty.hidden = visible > 0;
  }
  districtSearch.addEventListener('input', updateDistricts);
  updateDistricts();
}

const clubSearch = document.querySelector('#club-search');
if (clubSearch) {
  const cards = [...document.querySelectorAll('.club-card')];
  const topicChips = [...document.querySelectorAll('[data-filter]')];
  const organizationChips = [...document.querySelectorAll('[data-org-filter]')];
  const count = document.querySelector('#result-count');
  const empty = document.querySelector('#club-empty');
  const initialTopic = new URLSearchParams(location.search).get('topic');
  let activeTopic = topicChips.some(chip => chip.dataset.filter === initialTopic) ? initialTopic : 'all';
  let activeOrganization = organizationChips.some(chip => chip.dataset.orgFilter === new URLSearchParams(location.search).get('org')) ? new URLSearchParams(location.search).get('org') : 'all';
  function update() {
    const query = clubSearch.value.toLocaleLowerCase('ru').trim();
    let visible = 0;
    for (const card of cards) {
      const topicMatch = activeTopic === 'all' || card.dataset.topics.split(' ').includes(activeTopic);
      const organizationMatch = activeOrganization === 'all' || card.dataset.org === activeOrganization;
      card.hidden = !topicMatch || !organizationMatch || !card.dataset.search.includes(query);
      if (!card.hidden) visible++;
    }
    for (const chip of topicChips) {
      const selected = chip.dataset.filter === activeTopic;
      chip.classList.toggle('active', selected);
      chip.setAttribute('aria-pressed', String(selected));
    }
    for (const chip of organizationChips) {
      const selected = chip.dataset.orgFilter === activeOrganization;
      chip.classList.toggle('active', selected);
      chip.setAttribute('aria-pressed', String(selected));
    }
    count.textContent = `Показано ${visible} из ${cards.length}`;
    empty.hidden = visible > 0;
  }
  clubSearch.addEventListener('input', update);
  topicChips.forEach(chip => chip.addEventListener('click', () => {
    activeTopic = chip.dataset.filter;
    const url = new URL(location.href);
    if (activeTopic === 'all') url.searchParams.delete('topic');
    else url.searchParams.set('topic', activeTopic);
    history.replaceState(null, '', url);
    update();
  }));
  organizationChips.forEach(chip => chip.addEventListener('click', () => {
    activeOrganization = chip.dataset.orgFilter;
    const url = new URL(location.href);
    if (activeOrganization === 'all') url.searchParams.delete('org');
    else url.searchParams.set('org', activeOrganization);
    history.replaceState(null, '', url);
    update();
  }));
  update();
}
