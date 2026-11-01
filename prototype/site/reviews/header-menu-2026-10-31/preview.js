const header = document.querySelector('.site-header');
const variant = document.querySelector('meta[name="header-preview"]').content;
document.body.dataset.headerVariant = variant;
const menu = document.querySelector('.menu-button');
const nav = document.querySelector('#mobile-nav');
const showHeader = () => header.classList.remove('header-is-hidden');
const sizeHeader = () => document.documentElement.style.setProperty('--header-preview-height', `${header.getBoundingClientRect().height}px`);
sizeHeader();
new ResizeObserver(sizeHeader).observe(header);
menu?.addEventListener('click', () => {
  const opened = menu.getAttribute('aria-expanded') === 'true';
  menu.setAttribute('aria-expanded', String(!opened));
  menu.setAttribute('aria-label', opened ? 'Открыть меню' : 'Закрыть меню');
  nav.hidden = opened;
  showHeader();
});
nav?.addEventListener('click', event => {
  if (event.target.closest('a')) { nav.hidden = true; menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Открыть меню'); }
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && nav && !nav.hidden) { nav.hidden = true; menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Открыть меню'); menu.focus(); }
});
header.addEventListener('focusin', showHeader);
let previousY = Math.max(0, window.scrollY);
let direction = 0;
let travel = 0;
let pending = false;
function updateHeader() {
  pending = false;
  const y = Math.max(0, window.scrollY);
  const delta = y - previousY;
  previousY = y;
  header.classList.toggle('header-is-scrolled', y > 16);
  if (variant !== 'reveal' || y < header.offsetHeight + 36 || header.contains(document.activeElement) || menu?.getAttribute('aria-expanded') === 'true') { showHeader(); travel = 0; return; }
  const nextDirection = Math.sign(delta);
  if (nextDirection !== direction) { direction = nextDirection; travel = 0; }
  travel += Math.abs(delta);
  if (travel >= 10) { header.classList.toggle('header-is-hidden', direction > 0); travel = 0; }
}
window.addEventListener('scroll', () => { if (!pending) { pending = true; requestAnimationFrame(updateHeader); } }, { passive: true });
window.addEventListener('pageshow', updateHeader);
