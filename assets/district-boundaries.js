// OSM-derived polygons are a separate, optional layer on the Yandex catalogue map.
export const districtColors = Object.freeze({
  admiralteysky:'#ed426e',vasileostrovsky:'#169fce',vyborgsky:'#8b46d9',kalininsky:'#ef9616',
  kirovsky:'#29a967',kolpinsky:'#9daf18',krasnogvardeysky:'#e85b20',krasnoselsky:'#0caf97',
  kronshtadtsky:'#bb43b6',kurortny:'#6aae20',moskovsky:'#247fc4',nevsky:'#c88c28',
  petrogradsky:'#ed63b0',petrodvortsovy:'#d4a900',primorsky:'#009d9a',pushkinsky:'#e15b60',
  frunzensky:'#9d61d6',tsentralny:'#52a52e',
});
export async function createDistrictBoundaryLayer(map, toggle, status) {
  const response = await fetch(new URL('./district-boundaries.geojson',import.meta.url));
  if (!response.ok) throw new Error('District boundaries unavailable');
  const data = await response.json();
  if (data.features?.length !== 18) throw new Error('Incomplete district boundaries');
  const ymaps = window.ymaps;
  const polygons = new ymaps.GeoObjectCollection();
  const labels = new ymaps.GeoObjectCollection();
  const Label = ymaps.templateLayoutFactory.createClass('<span class="map-district-label">$[properties.districtName]</span>');
  const shapes = [];
  const names = [];
  for (const feature of data.features) {
    const {slug,name,labelPoint} = feature.properties;
    const color = districtColors[slug];
    // GeoJSON is longitude/latitude; Yandex API defaults to latitude/longitude.
    for (const polygon of feature.geometry.coordinates) {
      const shape = new ymaps.Polygon(polygon.map(ring=>ring.map(([lon,lat])=>[lat,lon])), {districtSlug:slug}, {
        strokeColor:color,strokeWidth:3,strokeOpacity:.9,fillColor:color,fillOpacity:.36,
        interactivityModel:'default#transparent',hasBalloon:false,hasHint:false,zIndex:1,
      });
      polygons.add(shape); shapes.push({slug,shape,color});
    }
    const mark = new ymaps.Placemark([labelPoint[1],labelPoint[0]], {districtName:name,districtSlug:slug}, {
      iconLayout:Label,iconOffset:[-65,-12],iconShape:{type:'Rectangle',coordinates:[[0,0],[0,0]]},
      interactivityModel:'default#transparent',hasBalloon:false,hasHint:false,zIndex:2,
    });
    labels.add(mark); names.push({slug,mark});
  }
  let selected = '';
  function updateLabels() {
    // Selecting a district must not hide its neighbours' names.
    const visible = toggle.checked && (selected !== '' || map.getZoom() >= 9);
    names.forEach(({mark})=>mark.options.set('visible',visible));
  }
  function updateView() {
    shapes.forEach(({slug,shape,color}) => {
      const active = slug === selected;
      shape.options.set({
        strokeColor:color,
        strokeWidth:active ? 4.5 : 3,
        strokeOpacity:active ? 1 : .9,
        fillOpacity:active ? .46 : .36,
      });
    });
    updateLabels();
  }
  function render(slug = selected) {
    selected = slug;
    // The caller may have replaced club objects; reattach without affecting fit bounds.
    map.geoObjects.remove(polygons); map.geoObjects.remove(labels);
    if (toggle.checked) {
      map.geoObjects.add(polygons); map.geoObjects.add(labels);
      const selectedName = data.features.find(feature=>feature.id === selected)?.properties.name;
      status.textContent = selectedName ? `Выделен ${selectedName.toLocaleLowerCase('ru')} район.` : 'Показаны границы 18 районов.';
    } else {
      map.geoObjects.remove(polygons); map.geoObjects.remove(labels);
      status.textContent = 'Границы скрыты.';
    }
    updateView();
  }
  toggle.disabled = false;
  toggle.addEventListener('change',()=>render());
  map.events.add('boundschange',event => {
    if (event.get('newZoom') !== event.get('oldZoom')) updateLabels();
  });
  return {render};
}
