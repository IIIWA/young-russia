const frame = document.querySelector('#preview-frame');
const holder = document.querySelector('.frame-window');
const titles = { reveal: 'Появляется при прокрутке вверх', glass: 'Всегда закреплено: стекло', solid: 'Всегда закреплено: светлый фон' };
let width = window.matchMedia('(max-width:700px)').matches ? 390 : 1280;
document.querySelectorAll('[data-width]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.width) === width)));
function resize() {
  const scale = Math.min(1, holder.clientWidth / width);
  const height = width < 600 ? 844 : 800;
  frame.style.width = `${width}px`;
  frame.style.height = `${height}px`;
  frame.style.transform = `scale(${scale})`;
  frame.style.marginLeft = `${Math.max(0, (holder.clientWidth - width) / 2)}px`;
  holder.style.height = `${Math.ceil(height * scale)}px`;
}
document.querySelectorAll('[data-variant]').forEach(button => button.addEventListener('click', () => {
  const variant = button.dataset.variant;
  frame.src = `${variant}.html`;
  frame.title = titles[variant];
  document.querySelector('#viewer-title').textContent = titles[variant];
  document.querySelectorAll('[data-variant]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
}));
document.querySelectorAll('[data-width]').forEach(button => button.addEventListener('click', () => {
  width = Number(button.dataset.width);
  document.querySelectorAll('[data-width]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  resize();
}));
new ResizeObserver(resize).observe(holder);
resize();
