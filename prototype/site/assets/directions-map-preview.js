(() => {
  const element = document.querySelector('[data-map-preview]');
  const dataElement = document.querySelector('#map-preview-data');
  if (!element || !dataElement) return;

  const points = JSON.parse(dataElement.textContent);
  const frame = element.closest('.prototype-map-frame');
  const status = frame.querySelector('.prototype-map-status');
  const summary = document.querySelector('#map-preview-summary');
  const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  let matchingKeys = [];
  let matchCount = 0;
  let map;
  let ready = false;

  function render() {
    const keys = new Set(matchingKeys);
    const selected = points.filter(point => keys.has(point.key));
    if (summary) summary.textContent = selected.length
      ? `На карте: ${selected.length} из ${matchCount} площадок.${selected.length < matchCount ? ' Координаты остальных уточняются.' : ''}`
      : matchCount ? 'Координаты этих площадок уточняются. Адреса есть в карточках ниже.' : 'Для выбранных фильтров площадок нет.';
    if (!ready) return;
    map.geoObjects.removeAll();
    const grouped = new Map();
    for (const point of selected) {
      const key = point.coordinates.join(',');
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(point);
    }
    for (const group of grouped.values()) {
      const provisional = group.some(point => point.provisional);
      map.geoObjects.add(new window.ymaps.Placemark(group[0].coordinates, {
        hintContent: group.map(point => point.name).join(', '),
        balloonContentHeader: group.length === 1 ? escapeHtml(group[0].name) : `${group.length} клуба по&nbsp;одному адресу`,
        balloonContentBody: group.map(point => `${escapeHtml(point.name)}<br>${escapeHtml(point.address)}<br><a href="${escapeHtml(point.url)}">${escapeHtml(point.linkLabel)}</a>${point.provisional ? '<br><small>Точка предварительная</small>' : ''}`).join('<hr>'),
      }, {preset:'islands#circleDotIcon', iconColor:provisional ? '#db7819' : '#111'}));
    }
    if (grouped.size > 1) map.setBounds(map.geoObjects.getBounds(), {checkZoomRange:true, zoomMargin:36});
    else if (grouped.size === 1) map.setCenter(selected[0].coordinates, 15);
    status.hidden = selected.length > 0;
    if (!selected.length) status.textContent = summary.textContent;
  }

  document.addEventListener('prototype:direction-filter', event => {
    matchingKeys = event.detail.matchingKeys;
    matchCount = event.detail.matchCount;
    render();
  });
  render();

  if (!['localhost','127.0.0.1','young-russia.ru','www.young-russia.ru'].includes(location.hostname)) {
    status.textContent = 'Интерактивная карта откроется через локальный сервер просмотра.';
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://api-maps.yandex.ru/2.1/?apikey=c615fafc-18f3-4567-a34b-587069896dd1&lang=ru_RU';
  script.onload = async () => {
    try {
      await new Promise((resolve, reject) => window.ymaps.ready(resolve, reject));
      map = new window.ymaps.Map(element, {center:[59.94,30.27], zoom:12, controls:['zoomControl']});
      ready = true;
      render();
    } catch {
      status.textContent = 'Не удалось загрузить карту.';
    }
  };
  script.onerror = () => { status.textContent = 'Не удалось загрузить карту.'; };
  document.head.appendChild(script);
})();
