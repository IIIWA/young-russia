export function clubScheduleImageMarkup(club, {base = '../../', html, text}) {
  const image = club.scheduleImage;
  if (!image) return '';
  if (!/^assets\/schedules\/[a-z0-9-]+\.png$/.test(image.path) || !Number.isInteger(image.width) || image.width < 1 || !Number.isInteger(image.height) || image.height < 1) {
    throw new Error(`Invalid original schedule image: ${club.name}`);
  }
  const href = html(base + image.path);
  return `<section class="detail-block" id="club-schedule-image"><p class="section-kicker">Занятия клуба</p><h2>Расписание</h2><figure style="margin:0"><a href="${href}" target="_blank" rel="noopener noreferrer"><img src="${href}" width="${image.width}" height="${image.height}" loading="lazy" decoding="async" alt="${html(image.alt)}" style="display:block;width:100%;height:auto"></a><figcaption style="margin-top:16px"><a class="text-link" href="${href}" target="_blank" rel="noopener noreferrer">${text('Открыть изображение расписания')} ↗</a></figcaption></figure></section>`;
}
