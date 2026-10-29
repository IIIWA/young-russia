<script setup lang="ts">
import '../../assets/share-background.css'
const siteUrl = 'https://young-russia.ru/'
const siteTitle = 'Найди своё занятие в Петербурге'
const shareText = 'Спорт, творчество, языки и общение рядом с домом. На young-russia.ru можно найти бесплатные занятия в молодёжных клубах Петербурга. Найди своё занятие и поделись с друзьями!'
const postText = `${shareText}\n\n${siteUrl}`
const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(siteUrl)}&text=${encodeURIComponent(shareText)}`
const vkUrl = `https://vk.com/share.php?url=${encodeURIComponent(siteUrl)}&title=${encodeURIComponent(siteTitle)}`
const maxUrl = `https://max.ru/:share?text=${encodeURIComponent(postText)}`
const backgroundPaused = ref(false)
const previewPinned = ref(false)
const previewDismissed = ref(false)
const glitterParticles = Array.from({ length: 28 }, (_, i) => ({ x: (i * 37 + 9) % 100, y: (i * 29 + 7) % 100, size: 3 + (i % 4) * 2, delay: -(i % 9) * 0.7, duration: 4.8 + (i % 5) * 0.6 }))
const status = ref('')
const busy = ref(false)
const manualText = ref('')
const manualInput = ref<HTMLTextAreaElement | null>(null)
const linkInput = ref<HTMLInputElement | null>(null)

async function copy(value: string, message: string) {
  status.value = ''
  manualText.value = ''
  try {
    await navigator.clipboard.writeText(value)
    status.value = message
  } catch {
    manualText.value = value
    status.value = 'Автоматическое копирование недоступно. Скопируй выделенный текст вручную.'
    await nextTick()
    manualInput.value?.focus()
    manualInput.value?.select()
  }
}

async function share() {
  if (busy.value) return
  status.value = ''
  if (typeof navigator.share !== 'function') {
    await copy(siteUrl, 'Ссылка скопирована. Отправь её друзьям в любом приложении.')
    return
  }
  busy.value = true
  try {
    await navigator.share({ title: siteTitle, text: shareText, url: siteUrl })
    manualText.value = ''
  } catch (error) {
    // Closing the system share sheet is an ordinary cancellation.
    if (!(error instanceof Error && error.name === 'AbortError')) {
      await copy(siteUrl, 'Ссылка скопирована. Отправь её друзьям в любом приложении.')
    }
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <section id="share" class="share-site" data-share-background="glow" :data-motion-paused="backgroundPaused" aria-labelledby="share-title">
    <div class="share-glitter" aria-hidden="true"><span v-for="(particle, i) in glitterParticles" :key="i" :style="{ left: particle.x + '%', top: particle.y + '%', width: particle.size + 'px', height: particle.size + 'px', animationDelay: particle.delay + 's', animationDuration: particle.duration + 's' }" /></div><div class="container share-site__layout">
      <div class="share-site__copy">
        <h2 id="share-title">Помоги другим найти своё занятие</h2>
        <p class="share-site__lead">Твоя ссылка может стать чьим-то первым шагом к&nbsp;новому увлечению, друзьям и&nbsp;возможности реализовать себя.</p>
        <p>Нам очень важно, чтобы как&nbsp;можно больше людей узнали о&nbsp;бесплатных занятиях рядом с&nbsp;домом. Поделись сайтом с&nbsp;друзьями и&nbsp;расскажи о&nbsp;нём в&nbsp;соцсетях.</p>
        <p class="share-site__mention">Снимаешь видео для&nbsp;TikTok или&nbsp;YouTube? Укажи <strong>young-russia.ru</strong> в&nbsp;описании или&nbsp;на&nbsp;экране, чтобы нас было легко найти.</p>
        <button class="share-motion-toggle" type="button" :aria-pressed="backgroundPaused" @click="backgroundPaused = !backgroundPaused">{{ backgroundPaused ? 'Включить анимацию' : 'Остановить анимацию' }}</button>
      </div>
      <div class="share-site__panel">
        <h3>Начни с&nbsp;одного друга</h3>
        <p>Отправь ссылку тому, с&nbsp;кем хочется попробовать что-то новое.</p>
        <button class="share-site__button share-site__button--primary" type="button" :disabled="busy" @click="share">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 16V3m-5 5 5-5 5 5M5 13v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" /></svg>
          {{ busy ? 'Открываем…' : 'Поделиться сайтом' }}
        </button>
        <div class="share-site__networks" aria-label="Отправить ссылку через соцсеть или мессенджер">
          <a :href="maxUrl" target="_blank" rel="noopener noreferrer" aria-label="Поделиться сайтом в MAX (новая вкладка)">MAX</a>
          <a :href="telegramUrl" target="_blank" rel="noopener noreferrer" aria-label="Поделиться сайтом в Telegram (новая вкладка)">Telegram</a>
          <a :href="vkUrl" target="_blank" rel="noopener noreferrer" aria-label="Поделиться сайтом ВКонтакте (новая вкладка)">ВКонтакте</a>
        </div>
        <label class="share-site__label" for="share-site-url">Ссылка на&nbsp;сайт</label>
        <div class="share-site__url-row">
          <input id="share-site-url" ref="linkInput" :value="siteUrl" type="url" readonly spellcheck="false" @focus="linkInput?.select()">
          <button class="share-site__button share-site__button--copy" type="button" @click="copy(siteUrl, 'Ссылка скопирована. Спасибо, что помогаешь рассказать о нас!')">Скопировать ссылку</button>
        </div>
        <div class="share-site__post" :class="{ 'is-preview-open': previewPinned, 'is-preview-dismissed': previewDismissed }" @mouseenter="previewDismissed = false" @focusin="previewDismissed = false" @keydown.esc="previewDismissed = true; previewPinned = false">
          <p>Для&nbsp;YouTube, TikTok и&nbsp;других площадок</p>
          <button class="share-site__text-button" type="button" aria-describedby="share-post-preview" @click="copy(postText, 'Текст со ссылкой скопирован. Вставь его в описание видео или публикацию.')">Скопировать текст со&nbsp;ссылкой</button>
          <button class="share-site__preview-toggle" type="button" aria-controls="share-post-preview" :aria-expanded="previewPinned" @click="previewPinned = !previewPinned; previewDismissed = !previewPinned">{{ previewPinned ? 'Скрыть текст' : 'Посмотреть текст' }}</button>
          <div id="share-post-preview" class="share-site__preview" role="note"><strong>Текст публикации</strong><p>{{ postText }}</p></div>
        </div>
        <p class="share-site__status" role="status" aria-live="polite" aria-atomic="true">{{ status }}</p>
        <div v-if="manualText" class="share-site__manual">
          <label class="share-site__label" for="share-site-manual">Текст для&nbsp;ручного копирования</label>
          <textarea id="share-site-manual" ref="manualInput" :value="manualText" readonly rows="5" @focus="manualInput?.select()" />
        </div>
        <noscript><p>Выдели и&nbsp;скопируй адрес сайта или&nbsp;отправь ссылку через MAX, Telegram или&nbsp;ВКонтакте.</p></noscript>
      </div>
    </div>
  </section>
</template>

<style scoped>
.share-site{padding:88px 0;scroll-margin-top:90px}
.share-site__layout{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);align-items:center;gap:clamp(32px,6vw,88px)}
.share-site__copy,.share-site__panel{min-width:0}
.share-site h2{font-size:clamp(30px,3.5vw,46px);line-height:1.12;letter-spacing:-1.5px;max-width:540px;margin:0 0 24px;text-wrap:balance}
.share-site p{margin:0 0 18px;text-wrap:pretty}
.share-site__lead{font-size:20px;line-height:1.5}
.share-site__mention{border-top:1px solid #a2c7bb;padding-top:20px;margin-top:26px!important;font-size:15px}
.share-site__mention strong{white-space:nowrap}
.share-site__panel{padding:32px;border-radius:var(--radius,22px);background:var(--white,#fff)}
.share-site h3{font-size:24px;line-height:1.25;margin:0 0 12px;letter-spacing:-.5px;text-wrap:balance}
.share-site__panel>p:not(.share-site__status){color:#526079;font-size:15px}
.share-site__button{display:inline-flex;align-items:center;justify-content:center;gap:12px;min-height:48px;padding:13px 16px;font:inherit;font-size:15px;font-weight:700;line-height:1.3;border:1px solid transparent;border-radius:10px;cursor:pointer;white-space:normal;text-align:center}
.share-site__button--primary{background:var(--blue,#2545ed);color:#fff;width:100%}
.share-site__button--primary:hover{background:var(--blue-dark,#172ca9)}
.share-site__button:disabled{opacity:.65;cursor:wait}
.share-site__networks{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0 24px}
.share-site__networks a{display:flex;align-items:center;justify-content:center;min-height:48px;padding:10px 6px;border:1px solid #ccd3e3;border-radius:10px;font-size:14px;font-weight:700;text-decoration:none;color:var(--ink,#18243b)}
.share-site__networks a:hover{border-color:var(--blue,#2545ed);color:var(--blue,#2545ed);background:#f3f5ff}
.share-site__label{display:block;margin-bottom:8px;font-size:13px;font-weight:700}
.share-site__url-row{display:flex;flex-wrap:wrap;gap:8px}
.share-site input,.share-site textarea{font:inherit;color:var(--ink,#18243b);background:#f5f7fc;border:1px solid #ccd3e3;border-radius:10px;min-width:0;padding:12px;line-height:1.5}
.share-site input{flex:1 1 190px;min-height:48px;font-size:15px;width:100%}
.share-site__button--copy{flex:1 1 auto;border-color:#ccd3e3;background:#fff;color:var(--blue,#2545ed)}
.share-site__button--copy:hover{background:#f3f5ff}
.share-site__post{border-top:1px solid var(--line,#e5e7ee);margin-top:24px;padding-top:20px}
.share-site__post p{font-size:13px;margin:0 0 4px;color:#526079}
.share-site__text-button{min-height:44px;padding:6px 0;background:none;border:0;font:inherit;font-size:15px;text-align:left;font-weight:700;color:var(--blue,#2545ed);text-decoration:underline;text-underline-offset:4px;cursor:pointer}
.share-site__status{font-size:14px;line-height:1.5;margin:12px 0 0!important;min-height:42px;color:#334762}
.share-site textarea{display:block;width:100%;resize:vertical;font-size:15px}
.share-site__manual{margin-top:16px}
.share-site :is(a,button,input,textarea):focus-visible{outline:3px solid var(--blue,#2545ed);outline-offset:4px}
@media(max-width:900px){.share-site__layout{grid-template-columns:1fr;gap:28px}.share-site{padding:56px 0}.share-site h2{max-width:620px}.share-site__copy{max-width:680px}.share-site__mention{margin-bottom:0!important}}
@media(max-width:480px){.share-site__panel{padding:24px 20px}.share-site h2{letter-spacing:-.8px}.share-site__lead{font-size:18px}.share-site__button--copy{flex-basis:100%}.share-site__networks{gap:6px}.share-site__networks a{font-size:13px}}
</style>
