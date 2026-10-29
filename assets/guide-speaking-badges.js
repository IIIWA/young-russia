export function initSpeakingBadges(signal) {
  const table = document.querySelector('.guide-language-table');
  const badges = [...(table?.querySelectorAll('[data-guide-speaking]') ?? [])];
  if (!badges.length) return () => {};

  const titles = new Map(badges.map(badge => [badge, badge.title]));
  // An empty title suppresses the parent link's native tooltip over the badge.
  badges.forEach(badge => { badge.title = ''; });
  const tooltip = document.createElement('div');
  tooltip.id = 'guide-speaking-tooltip';
  tooltip.className = 'guide-speaking-tooltip';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.hidden = true;
  document.body.append(tooltip);
  let active, hideTimer, pinned = false;

  const hide = () => {
    clearTimeout(hideTimer);
    active?.closest('a')?.removeAttribute('aria-describedby');
    active = undefined;
    pinned = false;
    tooltip.hidden = true;
  };
  const show = (badge, keepOpen = false) => {
    hide();
    active = badge;
    pinned = keepOpen;
    tooltip.textContent = titles.get(badge);
    tooltip.hidden = false;
    badge.closest('a')?.setAttribute('aria-describedby', tooltip.id);
    const rect = badge.getBoundingClientRect();
    const size = tooltip.getBoundingClientRect();
    tooltip.style.left = `${Math.max(12, Math.min(innerWidth - size.width - 12, rect.left + rect.width / 2 - size.width / 2))}px`;
    tooltip.style.top = `${rect.top - size.height - 8 >= 12 ? rect.top - size.height - 8 : rect.bottom + 8}px`;
  };
  const hideSoon = () => { clearTimeout(hideTimer); hideTimer = setTimeout(hide, 150); };
  table.addEventListener('pointerover', event => {
    if (event.pointerType === 'touch') return;
    const badge = event.target.closest('[data-guide-speaking]');
    if (badge && !(active === badge && pinned)) show(badge);
  }, {signal});
  table.addEventListener('pointerout', event => {
    if (!pinned && event.target.closest('[data-guide-speaking]')) hideSoon();
  }, {signal});
  table.addEventListener('focusin', event => {
    const badge = event.target.closest('a')?.querySelector('[data-guide-speaking]');
    if (badge) show(badge, true);
  }, {signal});
  table.addEventListener('focusout', () => { pinned = false; hideSoon(); }, {signal});
  document.addEventListener('click', event => {
    const badge = event.target.closest('[data-guide-speaking]');
    if (!badge || !table.contains(badge)) { if (!tooltip.contains(event.target)) hide(); return; }
    event.preventDefault();
    show(badge, true);
  }, {signal});
  document.addEventListener('keydown', event => { if (event.key === 'Escape') hide(); }, {signal});
  tooltip.addEventListener('pointerenter', () => clearTimeout(hideTimer), {signal});
  tooltip.addEventListener('pointerleave', () => { if (!pinned) hideSoon(); }, {signal});
  window.addEventListener('scroll', () => {
    // Focusing an offscreen link can scroll it into view after focusin.
    if (active && document.activeElement === active.closest('a')) show(active, pinned);
    else hide();
  }, {capture:true, passive:true, signal});
  window.addEventListener('resize', hide, {signal});
  window.addEventListener('hashchange', hide, {signal});
  return () => { hide(); tooltip.remove(); titles.forEach((title, badge) => { badge.title = title; }); };
}
