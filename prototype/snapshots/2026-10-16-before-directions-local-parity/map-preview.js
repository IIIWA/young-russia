(() => {
  const element = document.querySelector('[data-map-preview]');
  const dataElement = document.querySelector('#map-preview-data');
  if (!element || !dataElement) return;

  const points = JSON.parse(dataElement.textContent);
  const frame = element.closest('.prototype-map-frame');
  const status = frame.querySelector('.prototype-map-status');
  const summary = document.querySelector('#map-preview-summary');
  const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const params = new URLSearchParams(location.search);
  let filter = { topic: params.get('topic') || 'knowledge', subtopic: params.get('subtopic') || '', district: params.get('district') || '' };
  let map;
  let ready = false;

  function selectedPoints() {
    return points.filter(point => !point.subtopics || (
      (!filter.district || point.district === filter.district) &&
      (filter.subtopic ? point.subtopics.includes(filter.subtopic) : point.topics.includes(filter.topic))
    ));
  }

  function render() {
    const selected = selectedPoints();
    if (summary) summary.textContent = selected.length
      ? `На карте: ${selected.length} из 32 клубов района с подготовленными координатами.`
      : 'Для выбранного фильтра координаты пока не подготовлены.';
    if (!ready) return;
    map.geoObjects.removeAll();
    selected.forEach(point => {
      map.geoObjects.add(new window.ymaps.Placemark(point.coordinates, {
        hintContent: point.name,
        balloonContentHeader: escapeHtml(point.name),
        balloonContentBody: `${escapeHtml(point.address)}<br><a href="${escapeHtml(point.url)}">${escapeHtml(point.linkLabel || 'Страница клуба')}</a>${point.provisional ? '<br><small>Точка предварительная</small>' : ''}`,
      }, {preset:'islands#circleDotIcon', iconColor:point.provisional ? '#db7819' : '#1976d2'}));
    });
    if (selected.length > 1) map.setBounds(map.geoObjects.getBounds(), {checkZoomRange:true, zoomMargin:36});
    else if (selected.length === 1) map.setCenter(selected[0].coordinates, 15);
    status.hidden = selected.length > 0;
    if (!selected.length) status.textContent = 'Для выбранного фильтра координаты пока не подготовлены.';
  }

  document.addEventListener('prototype:direction-filter', event => {
    filter = event.detail;
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
