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
  const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));
  const allowedHost = ['young-russia.ru', 'www.young-russia.ru', 'localhost', '127.0.0.1'].includes(location.hostname);
  if (!allowedHost) {
    setStatus('Карту можно открыть на сайте или через локальный сервер просмотра.');
  } else {
    let started = false;
    const loadMap = () => {
      if (started) return;
      started = true;
      let clubs;
      try {
        clubs = JSON.parse(document.querySelector('#clubs-map-data').textContent);
        if (!Array.isArray(clubs) || !clubs.length) throw new Error('No map clubs');
      } catch {
        setStatus('Не удалось прочитать список клубов для карты.');
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://api-maps.yandex.ru/2.1/?apikey=c615fafc-18f3-4567-a34b-587069896dd1&lang=ru_RU';
      script.async = true;
      script.onload = async () => {
        try {
          await new Promise((resolve, reject) => window.ymaps.ready(resolve, reject));
          const map = new window.ymaps.Map(clubsMap, { center: [59.94, 30.27], zoom: 12 });
          const grouped = new Map();
          for (const club of clubs) {
            const key = club.coordinates.join(',');
            if (!grouped.has(key)) grouped.set(key, []);
            grouped.get(key).push(club);
          }
          const placemarks = [...grouped.values()].map(group => {
            const provisional = group.some(club => club.provisional);
            const body = group.map(club => `<div><a href="${escapeHtml(club.url)}">${escapeHtml(club.name)}</a><br>${escapeHtml(club.address)}${club.provisional ? '<br><small>Точка предварительная</small>' : ''}</div>`).join('<hr>');
            return new window.ymaps.Placemark(group[0].coordinates, {
              balloonContentHeader: group.length === 1 ? escapeHtml(group[0].name) : `${group.length} клуба по&nbsp;одному адресу`,
              balloonContentBody: body,
              hintContent: group.map(club => club.name).join(', '),
            }, {preset:'islands#circleDotIcon', iconColor:provisional ? '#db7819' : '#1976d2'});
          });
          const clusterer = new window.ymaps.Clusterer({preset:'islands#blueClusterIcons'});
          clusterer.add(placemarks);
          map.geoObjects.add(clusterer);
          if (placemarks.length > 1) map.setBounds(clusterer.getBounds(), {checkZoomRange:true, zoomMargin:24});
          if (status) status.hidden = true;
        } catch {
          setStatus('Не удалось загрузить карту. Открой каталог клубов по ссылке ниже.');
        }
      };
      script.onerror = () => setStatus('Не удалось загрузить карту. Открой каталог клубов по ссылке ниже.');
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
  const taxonomy = JSON.parse(document.querySelector('#topic-taxonomy-data').textContent);
  const topicNames = Object.fromEntries(Object.entries(taxonomy).map(([key, group]) => [key, group.label]));
  topicNames.languages = 'Иностранные языки';
  topicNames.dance = 'Танцы';
  const requestedTopic = new URLSearchParams(location.search).get('topic');
  const activeTopic = Object.hasOwn(topicNames, requestedTopic) ? requestedTopic : '';
  if (activeTopic && topicNote && topicNoteText) {
    topicNote.hidden = false;
    topicNoteText.textContent = `Направление «${topicNames[activeTopic]}»: показаны районы с подходящими площадками в каталоге.`;
  }
  if (activeTopic) {
    for (const card of cards) {
      const url = new URL(card.getAttribute('href'), location.href);
      url.searchParams.set('topic', activeTopic);
      card.href = url.href;
    }
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
  const taxonomy = JSON.parse(document.querySelector('#topic-taxonomy-data').textContent);
  const aliases = {languages:{topic:'knowledge',subtopic:'languages'},dance:{topic:'sport',subtopic:'dance'}};
  const subtopicParent = Object.fromEntries(Object.entries(taxonomy).flatMap(([topic, group]) => Object.keys(group.subtopics).map(subtopic => [subtopic, topic])));
  const cards = [...document.querySelectorAll('.club-card')];
  const topicChips = [...document.querySelectorAll('[data-filter]')];
  const organizationChips = [...document.querySelectorAll('[data-org-filter]')];
  const count = document.querySelector('#result-count');
  const empty = document.querySelector('#club-empty');
  const params = new URLSearchParams(location.search);
  const initialTopic = params.get('topic');
  let activeTopic = aliases[initialTopic]?.topic ?? (topicChips.some(chip => chip.dataset.filter === initialTopic) ? initialTopic : 'all');
  let activeSubtopic = aliases[initialTopic]?.subtopic ?? (subtopicParent[params.get('subtopic')] === activeTopic ? params.get('subtopic') : '');
  let activeOrganization = organizationChips.some(chip => chip.dataset.orgFilter === new URLSearchParams(location.search).get('org')) ? new URLSearchParams(location.search).get('org') : 'all';
  const topicRow = topicChips[0]?.parentElement;
  const subtopicRow = document.createElement('div');
  subtopicRow.className = 'subtopic-filters';
  subtopicRow.setAttribute('role', 'group');
  subtopicRow.setAttribute('aria-label', 'Уточнить занятие');
  topicRow?.insertAdjacentElement('afterend', subtopicRow);
  function renderSubtopics() {
    subtopicRow.replaceChildren();
    subtopicRow.hidden = activeTopic === 'all';
    if (activeTopic === 'all') return;
    const title = document.createElement('p');
    title.textContent = 'Уточни занятие';
    subtopicRow.appendChild(title);
    for (const [key, label] of [['', 'Все занятия'], ...Object.entries(taxonomy[activeTopic].subtopics)]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `filter-chip subtopic-chip${key === activeSubtopic ? ' active' : ''}`;
      button.dataset.subfilter = key;
      button.setAttribute('aria-pressed', String(key === activeSubtopic));
      button.textContent = label;
      button.addEventListener('click', () => {
        activeSubtopic = key;
        const url = new URL(location.href);
        if (key) url.searchParams.set('subtopic', key);
        else url.searchParams.delete('subtopic');
        history.replaceState(null, '', url);
        renderSubtopics();
        update();
      });
      subtopicRow.appendChild(button);
    }
  }
  function update() {
    const query = clubSearch.value.toLocaleLowerCase('ru').trim();
    let visible = 0;
    for (const card of cards) {
      const topicMatch = activeTopic === 'all' || card.dataset.topics.split(' ').includes(activeTopic);
      const subtopicMatch = !activeSubtopic || card.dataset.subtopics.split(' ').includes(activeSubtopic);
      const organizationMatch = activeOrganization === 'all' || card.dataset.org === activeOrganization;
      card.hidden = !topicMatch || !subtopicMatch || !organizationMatch || !card.dataset.search.includes(query);
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
    activeSubtopic = '';
    const url = new URL(location.href);
    if (activeTopic === 'all') url.searchParams.delete('topic');
    else url.searchParams.set('topic', activeTopic);
    url.searchParams.delete('subtopic');
    history.replaceState(null, '', url);
    renderSubtopics();
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
  renderSubtopics();
  update();
}
