(() => {
  const mapElement = document.querySelector('#topic-map');
  const dataElement = document.querySelector('#topic-map-data');
  if (!mapElement || !dataElement) return;

  const points = JSON.parse(dataElement.textContent);
  const cards = [...document.querySelectorAll('[data-topic-club]')];
  const select = document.querySelector('#topic-district');
  const resultCount = document.querySelector('#topic-result-count');
  const status = document.querySelector('#topic-map-status');
  const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const flagBase = new URL('flags/', document.currentScript.src);
  const flagFiles = new Map([
    ['английский', 'gb'], ['немецкий', 'de'], ['французский', 'fr'],
    ['испанский', 'es'], ['китайский', 'cn'], ['японский', 'jp'], ['корейский', 'kr'],
  ]);
  const languageMarks = new Map();
  let map;

  function languageMarkerOptions(point, key) {
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
    const layout = window.ymaps.templateLayoutFactory.createClass(
      `<button type="button" class="topic-language-marker" data-topic-language-marker="${escapeHtml(key)}" aria-label="${escapeHtml(label)}" style="--topic-marker-color:${color}"><span class="topic-map-language-flags">${badges}</span><span class="topic-map-language-dot" aria-hidden="true"></span></button>`
    );
    return {
      iconLayout:layout,
      iconShape:{type:'Rectangle', coordinates:[[-width / 2, -38], [width / 2, 10]]},
      hideIconOnBalloonOpen:false,
    };
  }

  mapElement.addEventListener('keydown', event => {
    if (!['Enter', ' '].includes(event.key)) return;
    const marker = event.target.closest('[data-topic-language-marker]');
    if (!marker) return;
    event.preventDefault();
    languageMarks.get(marker.dataset.topicLanguageMarker)?.balloon.open();
  });

  function visiblePoints() {
    return points.filter(point => !select.value || point.district === select.value);
  }

  function update() {
    const selected = visiblePoints();
    let visibleCards = 0;
    cards.forEach(card => {
      card.hidden = Boolean(select.value && card.dataset.district !== select.value);
      if (!card.hidden) visibleCards++;
    });
    resultCount.textContent = `Показано ${visibleCards} из ${cards.length} клубов`;
    if (!map) return;
    map.geoObjects.removeAll();
    languageMarks.clear();
    selected.forEach(point => {
      const links = point.activities.map(activity => `<a class="map-balloon-link" style="color:#1d4ed8!important;text-decoration:underline!important" href="${escapeHtml(activity.url)}">${escapeHtml(activity.activity)}</a>`).join('<br>');
      const languages = Array.isArray(point.languages)
        ? `<br><strong>Языки:</strong> ${point.languages.length ? point.languages.map(escapeHtml).join(', ') : 'уточнить у&nbsp;клуба'}`
        : '';
      const formatNote = point.formatNote ? `<br><small>${escapeHtml(point.formatNote)}</small>` : '';
      [point.coordinates, ...(point.additionalCoordinates || [])].forEach((coordinates, index) => {
        const key = `${point.id}-${index}`;
        const placemark = new window.ymaps.Placemark(coordinates, {
          hintContent: point.name,
          balloonContentHeader: escapeHtml(point.name),
          balloonContentBody: `${escapeHtml(point.address)}${languages}${formatNote}<br>${links}${point.provisional ? '<br><small>Точка предварительная</small>' : ''}`,
        }, languageMarkerOptions(point, key));
        if (Array.isArray(point.languages)) languageMarks.set(key, placemark);
        map.geoObjects.add(placemark);
      });
    });
    if (map.geoObjects.getLength() > 1) map.setBounds(map.geoObjects.getBounds(), {checkZoomRange:true, zoomMargin:40});
    else if (selected.length === 1) map.setCenter(selected[0].coordinates, 15);
    status.hidden = selected.length > 0;
    if (!selected.length) status.textContent = 'Для выбранного района пока нет точек.';
  }

  select.addEventListener('change', update);
  update();
  if (!['localhost', '127.0.0.1', 'young-russia.ru', 'www.young-russia.ru'].includes(location.hostname)) {
    status.textContent = 'Интерактивная карта откроется через локальный сервер просмотра.';
    return;
  }
  const script = document.createElement('script');
  script.src = 'https://api-maps.yandex.ru/2.1/?apikey=c615fafc-18f3-4567-a34b-587069896dd1&lang=ru_RU';
  script.onload = async () => {
    try {
      await new Promise((resolve, reject) => window.ymaps.ready(resolve, reject));
      map = new window.ymaps.Map(mapElement, {center:[59.94, 30.27], zoom:11, controls:['zoomControl']});
      update();
    } catch { status.textContent = 'Не удалось загрузить карту.'; }
  };
  script.onerror = () => { status.textContent = 'Не удалось загрузить карту.'; };
  document.head.appendChild(script);
})();
