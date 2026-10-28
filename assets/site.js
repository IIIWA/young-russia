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

function mapClubActivities(activities, languageSelection = false, base = '') {
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const entries = [...new Map((activities ?? []).map(activity => typeof activity === 'string' ? {label:activity} : activity).filter(activity => activity?.label).map(activity => [activity.label,activity])).values()];
  const labels = entries.map(activity => activity.label);
  const languagePatterns = [['английский',/английск/iu],['немецкий',/немецк/iu],['французский',/французск/iu],['испанский',/испанск/iu],['китайский',/китайск/iu],['японский',/японск/iu],['корейский',/корейск/iu],['жестовый язык',/жестов/iu]];
  const languages = languagePatterns.filter(([,pattern]) => labels.some(label => pattern.test(label))).map(([label]) => label);
  const languageDetails = languageSelection || languages.length || labels.some(label => /язык|билингв/iu.test(label))
    ? `<p style="margin:8px 0"><strong>Языки:</strong> ${languages.length ? languages.join(', ') : 'список уточняется у&nbsp;клуба'}</p>` : '';
  const list = labels.length
    ? `<ul style="margin:6px 0 0;padding-left:18px;max-height:180px;overflow-y:auto;line-height:1.5">${entries.map(activity => `<li>${/^activities\/[a-z0-9-]+\.html$/.test(activity.url ?? '') ? `<a class="map-balloon-link" style="color:#1d4ed8!important;text-decoration:underline!important" href="${escape(base + activity.url)}">${escape(activity.label)}</a>` : escape(activity.label)}</li>`).join('')}</ul>`
    : '<p style="margin:6px 0">Список занятий уточняется у&nbsp;клуба.</p>';
  return `${languageDetails}<div style="margin-top:10px;max-width:320px;font-size:14px"><strong>Направления клуба</strong>${list}</div>`;
}

function addMapPlacemarks(map, placemarks, clusterNearby = false) {
  if (clusterNearby) {
    const clusterer = new window.ymaps.Clusterer({
      preset:'islands#blueClusterIcons',
      gridSize:64,
      groupByCoordinates:false,
      clusterDisableClickZoom:false,
      clusterOpenBalloonOnClick:false,
      zoomMargin:32,
    });
    clusterer.add(placemarks);
    map.geoObjects.add(clusterer);
  } else {
    placemarks.forEach(placemark => map.geoObjects.add(placemark));
  }
}

const menuButton = document.querySelector('.menu-button');
const boxingSchedule = document.querySelector('.boxing-schedule');
if (boxingSchedule) {
  const dayCells = [...boxingSchedule.querySelectorAll('tbody th[data-day-full]')];
  const frame = boxingSchedule.closest('.boxing-schedule-frame');
  const probe = document.createElement('span');
  probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;pointer-events:none';
  document.body.append(probe);
  const updateDayNames = () => {
    const allFit = dayCells.every(cell => {
      const style = getComputedStyle(cell);
      probe.style.font = style.font;
      probe.style.letterSpacing = style.letterSpacing;
      probe.textContent = cell.dataset.dayFull;
      const available = cell.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      return probe.getBoundingClientRect().width <= available - 2;
    });
    dayCells.forEach(cell => { cell.textContent = allFit ? cell.dataset.dayFull : cell.dataset.dayShort; });
  };
  updateDayNames();
  new ResizeObserver(updateDayNames).observe(frame);
  document.fonts?.ready.then(updateDayNames);
}
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
  const filtered = clubsMap.dataset.filtered === 'true';
  let mapCount = document.querySelector('#catalog-map-count');
  if (filtered && !mapCount) {
    mapCount = document.createElement('p');
    mapCount.id = 'catalog-map-count';
    mapCount.className = 'catalog-map-credit';
    mapCount.setAttribute('aria-live', 'polite');
    clubsMap.closest('.catalog-map-panel')?.querySelector('.catalog-map-credit')?.before(mapCount);
  }
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
          const map = new window.ymaps.Map(clubsMap, { center: [59.94, 30.27], zoom: 12, controls: ['zoomControl'] });
          const renderMap = () => {
            const visibleUrls = filtered ? new Set([...document.querySelectorAll('#club-grid .club-card:not([hidden]) h3 a')].map(link => link.getAttribute('href'))) : null;
            const selected = visibleUrls ? clubs.filter(club => [...visibleUrls].some(url => url.endsWith(club.url))) : clubs;
            const grouped = new Map();
            for (const club of selected) {
              for (const coordinates of [club.coordinates, ...(club.additionalCoordinates ?? [])]) {
                const key = coordinates.join(',');
                if (!grouped.has(key)) grouped.set(key, {coordinates, clubs:[]});
                grouped.get(key).clubs.push(club);
              }
            }
            map.geoObjects.removeAll();
            const placemarks = [...grouped.values()].map(({coordinates, clubs:group}) => {
              const provisional = group.some(club => club.provisional);
              const languageSelection = new URLSearchParams(location.search).get('subtopic') === 'languages' || new URLSearchParams(location.search).get('topic') === 'languages';
              const body = group.map(club => `<div><a class="map-balloon-link" style="color:#1d4ed8!important;text-decoration:underline!important" href="${escapeHtml(filtered ? `../${club.url}` : club.url)}">${escapeHtml(club.name)}</a><br>${escapeHtml(club.address)}${mapClubActivities(club.activities, languageSelection, filtered ? '../' : '')}${club.provisional ? '<br><small>Точка предварительная</small>' : ''}</div>`).join('<hr>');
              return new window.ymaps.Placemark(coordinates, {
                balloonContentHeader: group.length === 1 ? escapeHtml(group[0].name) : `${group.length} клуба по&nbsp;одному адресу`,
                balloonContentBody: body,
                hintContent: group.map(club => club.name).join(', '),
              }, {preset:'islands#circleDotIcon', iconColor:provisional ? '#db7819' : '#1976d2'});
            });
            addMapPlacemarks(map, placemarks, filtered);
            if (placemarks.length > 1) map.setBounds(map.geoObjects.getBounds(), {checkZoomRange:true, zoomMargin:24});
            else if (placemarks.length === 1) map.setCenter(placemarks[0].geometry.getCoordinates(), 15);
            if (mapCount) mapCount.textContent = `Площадок с координатами: ${selected.length} из ${visibleUrls.size}.`;
            if (status) {
              status.hidden = placemarks.length > 0;
              if (!placemarks.length) setStatus(visibleUrls?.size ? 'Координаты выбранных площадок уточняются. Адреса указаны в карточках ниже.' : 'Для выбранных фильтров площадок нет.');
            }
          };
          if (filtered) document.addEventListener('club-catalog-filtered', renderMap);
          renderMap();
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
    document.dispatchEvent(new Event('club-catalog-filtered'));
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

const directionResults = document.querySelector('#direction-results');
if (directionResults) {
  const taxonomy = JSON.parse(document.querySelector('#topic-taxonomy-data').textContent);
  const topicButtons = [...document.querySelectorAll('[data-topic-button]')];
  const subtopicButtons = [...document.querySelectorAll('[data-subtopic-button]')];
  const subgroups = document.querySelector('#subgroups');
  const subtopicSelection = document.querySelector('#direction-subtopic-selection');
  const compactSubgroups = matchMedia('(max-width:1050px)');
  const cards = [...directionResults.querySelectorAll('.direction-club-card')].map(element => ({
    element,
    activities: JSON.parse(element.dataset.directionActivities),
  }));
  const districtSelect = document.querySelector('#direction-district');
  const title = document.querySelector('#direction-title');
  const summary = document.querySelector('#direction-summary');
  const empty = document.querySelector('#direction-empty');
  const more = document.querySelector('#direction-more');
  const reset = document.querySelector('#direction-reset');
  const mapNode = document.querySelector('#direction-map');
  const mapStatus = document.querySelector('#direction-map-status');
  const defaultTopic = 'all';
  const allTopics = {label:'Все направления', subtopics:{}};
  let topic = defaultTopic;
  let subtopic = '';
  let limit = 12;
  let directionMap = null;
  let mapMatches = [];
  let mapError = false;
  const escapeMapHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));

  function renderDirectionMap(matches) {
    if (!mapNode) return;
    mapMatches = matches;
    const points = matches.filter(element => element.dataset.mapLat && element.dataset.mapLon);
    if (mapError) return;
    if (!directionMap) {
      mapStatus.textContent = `Загружаем карту. Координаты есть у ${points.length} из ${matches.length} площадок.`;
      return;
    }
    directionMap.geoObjects.removeAll();
    if (!points.length) {
      mapStatus.textContent = matches.length ? 'Координаты этих площадок уточняются. Адреса есть в карточках ниже.' : 'Для выбранных фильтров площадок нет.';
      return;
    }
    const grouped = new Map();
    for (const element of points) {
      const locations = [[Number(element.dataset.mapLat),Number(element.dataset.mapLon)], ...JSON.parse(element.dataset.mapAdditional || '[]')];
      for (const coordinates of locations) {
        const key = coordinates.join(',');
        if (!grouped.has(key)) grouped.set(key, {coordinates, elements:[]});
        grouped.get(key).elements.push(element);
      }
    }
    const placemarks = [...grouped.values()].map(({coordinates, elements:group}) => {
      const provisional = group.some(element => element.dataset.mapProvisional === 'true');
      const body = group.map(element => {
        const link = element.querySelector('h3 a');
        const activity = element.querySelector('[data-matched-activity]').textContent;
        const address = element.querySelector('.direction-club-address').textContent;
        const activities = JSON.parse(element.dataset.directionActivities);
        return `<div><a class="map-balloon-link" style="color:#1d4ed8!important;text-decoration:underline!important" href="${escapeMapHtml(link.getAttribute('href'))}">${escapeMapHtml(link.textContent)}</a><br>${escapeMapHtml(address)}<p style="margin:8px 0"><strong>По&nbsp;выбранному фильтру:</strong> ${escapeMapHtml(activity)}</p>${mapClubActivities(activities, subtopic === 'languages', '../')}${element.dataset.mapProvisional === 'true' ? '<br><small>Точка предварительная</small>' : ''}</div>`;
      }).join('<hr>');
      return new window.ymaps.Placemark(coordinates, {
        balloonContentHeader: group.length === 1 ? escapeMapHtml(group[0].querySelector('h3 a').textContent) : `${group.length} клуба по&nbsp;одному адресу`,
        balloonContentBody: body,
        hintContent: group.map(element => element.querySelector('h3 a').textContent).join(', '),
      }, {preset:'islands#circleDotIcon',iconColor:provisional ? '#db7819' : '#2545ed'});
    });
    addMapPlacemarks(directionMap, placemarks, true);
    if (placemarks.length === 1) directionMap.setCenter(placemarks[0].geometry.getCoordinates(),14);
    else directionMap.setBounds(directionMap.geoObjects.getBounds(),{checkZoomRange:true,zoomMargin:30});
    mapStatus.textContent = `На карте: ${points.length} из ${matches.length} площадок.${points.length < matches.length ? ' Координаты остальных уточняются.' : ''}`;
  }

  function loadDirectionMap() {
    if (!mapNode) return;
    const allowedHost = ['young-russia.ru','www.young-russia.ru','localhost','127.0.0.1'].includes(location.hostname);
    if (!allowedHost) {
      mapError = true;
      mapStatus.textContent = 'Карта доступна на сайте или через локальный сервер просмотра.';
      return;
    }
    const initialize = async () => {
      try {
        await new Promise((resolve,reject) => window.ymaps.ready(resolve,reject));
        directionMap = new window.ymaps.Map(mapNode,{center:[59.94,30.3],zoom:11,controls:['zoomControl']});
        renderDirectionMap(mapMatches);
      } catch {
        mapError = true;
        mapStatus.textContent = 'Карта пока не загрузилась. Адреса клубов есть в карточках ниже.';
      }
    };
    if (window.ymaps) { initialize(); return; }
    const script = document.createElement('script');
    script.src = 'https://api-maps.yandex.ru/2.1/?apikey=c615fafc-18f3-4567-a34b-587069896dd1&lang=ru_RU';
    script.async = true;
    script.onload = initialize;
    script.onerror = () => {
      mapError = true;
      mapStatus.textContent = 'Карта пока не загрузилась. Адреса клубов есть в карточках ниже.';
    };
    document.head.appendChild(script);
  }

  function readDirectionUrl() {
    const params = new URLSearchParams(location.search);
    const requestedTopic = params.get('topic');
    topic = requestedTopic === 'all' || Object.hasOwn(taxonomy,requestedTopic) ? requestedTopic : defaultTopic;
    const requestedSubtopic = params.get('subtopic');
    subtopic = topic !== 'all' && Object.hasOwn(taxonomy[topic].subtopics,requestedSubtopic) ? requestedSubtopic : '';
    const requestedDistrict = params.get('district') || '';
    districtSelect.value = [...districtSelect.options].some(option => option.value === requestedDistrict) ? requestedDistrict : '';
    limit = 12;
  }

  function writeDirectionUrl() {
    const url = new URL(location.href);
    if (topic === 'all') url.searchParams.delete('topic');
    else url.searchParams.set('topic',topic);
    if (subtopic) url.searchParams.set('subtopic',subtopic);
    else url.searchParams.delete('subtopic');
    if (districtSelect.value) url.searchParams.set('district',districtSelect.value);
    else url.searchParams.delete('district');
    history.pushState(null,'',url);
  }

  function renderDirections() {
    const group = topic === 'all' ? allTopics : taxonomy[topic];
    const groupSubtopics = new Set(Object.keys(group.subtopics));
    title.textContent = group.label;
    document.title = `${group.label} | ПМК Петербурга`;
    topicButtons.forEach(button => button.setAttribute('aria-pressed',String(button.dataset.topicButton === topic)));
    subtopicButtons.forEach(input => {
      input.closest('.direction-subtopic').hidden = Boolean(input.dataset.group && input.dataset.group !== topic);
      input.checked = input.dataset.subtopicButton === subtopic;
    });
    subtopicSelection.textContent = subtopicButtons.find(input => input.checked)?.closest('.direction-subtopic').querySelector('strong').textContent || 'Все занятия';

    const matches = [];
    for (const {element,activities} of cards) {
      const matchedActivity = topic === 'all' ? activities[0] : activities.find(activity => activity.subtopics.some(code => subtopic ? code === subtopic : groupSubtopics.has(code)));
      if (matchedActivity && (!districtSelect.value || element.dataset.district === districtSelect.value)) {
        element.querySelector('[data-matched-activity]').textContent = matchedActivity.label;
        element.querySelector('[data-activity-provisional]').hidden = !matchedActivity.provisional;
        matches.push(element);
      }
      element.hidden = true;
    }
    matches.slice(0,limit).forEach(element => { element.hidden = false; });
    summary.textContent = `Найдено площадок: ${matches.length}. Показано: ${Math.min(matches.length,limit)}.`;
    empty.hidden = matches.length !== 0;
    more.hidden = matches.length <= limit;
    renderDirectionMap(matches);
  }

  topicButtons.forEach(button => button.addEventListener('click',() => {
    if (topic === button.dataset.topicButton) return;
    topic = button.dataset.topicButton;
    subtopic = '';
    limit = 12;
    writeDirectionUrl();
    renderDirections();
    document.querySelector('#subgroups')?.scrollIntoView({behavior:'smooth',block:'start'});
  }));
  subtopicButtons.forEach(input => input.addEventListener('change',() => {
    subtopic = input.dataset.subtopicButton;
    limit = 12;
    writeDirectionUrl();
    renderDirections();
    if (compactSubgroups.matches) subgroups.open = false;
    document.querySelector('#results')?.scrollIntoView({behavior:'smooth',block:'start'});
  }));
  const syncSubgroups = () => { subgroups.open = !compactSubgroups.matches; };
  compactSubgroups.addEventListener('change',syncSubgroups);
  districtSelect.addEventListener('change',() => { limit = 12; writeDirectionUrl(); renderDirections(); });
  more.addEventListener('click',() => { limit += 12; renderDirections(); });
  reset.addEventListener('click',() => { topic = defaultTopic; subtopic = ''; districtSelect.value = ''; limit = 12; writeDirectionUrl(); renderDirections(); });
  addEventListener('popstate',() => { readDirectionUrl(); renderDirections(); });
  readDirectionUrl();
  renderDirections();
  syncSubgroups();
  loadDirectionMap();
}
