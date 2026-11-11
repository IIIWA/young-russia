// Shared activity composition. Schedule markup remains owned by its existing renderer.
function descriptionSparkle(id) {
  return `<svg class="activity-description-sparkle" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" style="display:block;flex:0 0 1.1em;inline-size:1.1em;block-size:1lh;pointer-events:none"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#3659f5"/><stop offset="1" stop-color="#7c3aed"/></linearGradient></defs><path d="M12 1.5C12.75 7.5 16.5 11.25 22.5 12C16.5 12.75 12.75 16.5 12 22.5C11.25 16.5 7.5 12.75 1.5 12C7.5 11.25 11.25 7.5 12 1.5Z" fill="url(#${id})"/></svg>`;
}

export function activityContentMarkup({descriptions = [], communityLinks = '', communityNote = '', hasSchedule = false, scheduleMarkup = '', scheduleNote = '', fallbackLinks, fallbackText}, {text, html}) {
  const about = descriptions.length
    ? `<section class="detail-block" id="about"><h2>О направлении</h2>${descriptions.map((description, descriptionIndex) => {
      const paragraphs = description.paragraphs ?? [];
      const items = description.listItems ?? [];
      const sources = [...new Set([description.sourceUrl, ...paragraphs.map(part => part.sourceUrl), ...items.map(part => part.sourceUrl)])];
      return `<p>${descriptions.length > 1 ? `<strong>${text(description.title)}.</strong> ` : ''}${text(description.text)}</p>${paragraphs.map(part => `<p>${text(part.text)}</p>`).join('')}${items.length ? `<ul class="activity-description-list" role="list" style="list-style:none;display:grid;gap:.5em;margin:1em 0;padding:0">${items.map((part, itemIndex) => `<li class="activity-description-item" style="display:flex;align-items:flex-start;gap:.65em">${descriptionSparkle(`activity-description-sparkle-${descriptionIndex}-${itemIndex}`)}<span style="min-inline-size:0">${text(part.text)}</span></li>`).join('')}</ul>` : ''}${sources.map(url => `<p class="detail-muted"><a href="${html(url)}" target="_blank" rel="noopener noreferrer">Источник описания ↗</a></p>`).join('')}`;
    }).join('')}</section>`
    : '';
  const fallback = !about || !communityLinks || !hasSchedule
    ? `<section class="detail-block" id="activity-info"><p class="section-kicker">Контакты клуба</p><h2>Уточнить подробности</h2><p>${text(fallbackText)}</p><div class="direction-link-list">${fallbackLinks}</div></section>`
    : '';
  const community = communityLinks
    ? `<section class="detail-block" id="community"><h2>Страницы направления</h2><div class="direction-link-list">${communityLinks}</div>${communityNote}</section>`
    : '';
  const schedule = hasSchedule
    ? `<section class="detail-block" id="schedule"><h2>Расписание</h2>${scheduleMarkup}${scheduleNote}</section>`
    : '';
  return about + fallback + community + schedule;
}
