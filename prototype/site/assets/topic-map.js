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
  let map;

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
    selected.forEach(point => {
      const links = point.activities.map(activity => `<a class="map-balloon-link" style="color:#1d4ed8;text-decoration:underline" href="${escapeHtml(activity.url)}">${escapeHtml(activity.activity)}</a>`).join('<br>');
      const languages = Array.isArray(point.languages)
        ? `<br><strong>Языки:</strong> ${point.languages.length ? point.languages.map(escapeHtml).join(', ') : 'уточнить у&nbsp;клуба'}`
        : '';
      const formatNote = point.formatNote ? `<br><small>${escapeHtml(point.formatNote)}</small>` : '';
      [point.coordinates, ...(point.additionalCoordinates || [])].forEach(coordinates => {
        const placemark = new window.ymaps.Placemark(coordinates, {
          hintContent: point.name,
          balloonContentHeader: escapeHtml(point.name),
          balloonContentBody: `${escapeHtml(point.address)}${languages}${formatNote}<br>${links}${point.provisional ? '<br><small>Точка предварительная</small>' : ''}`,
        }, { preset: 'islands#circleDotIcon', iconColor: point.provisional ? '#db7819' : '#1976d2' });
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
