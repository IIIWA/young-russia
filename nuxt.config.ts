import { readFileSync } from 'node:fs'

const routes = JSON.parse(readFileSync(new URL('./app/content/routes.json', import.meta.url), 'utf8')) as string[]

export default defineNuxtConfig({
  compatibilityDate: '2026-10-15',
  devtools: { enabled: false },
  app: {
    head: {
      meta: [{ name: 'yandex-verification', content: '3ef164ad4f4a6da7' }],
      script: [{
        key: 'yandex-metrika',
        id: 'yandex-metrika',
        type: 'text/javascript',
        tagPriority: 'high',
        innerHTML: `(function(m,e,t,r,i,k,a){
    m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();
    for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
    k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
})(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=113739844', 'ym');
ym(113739844, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});`,
      }],
      noscript: [{
        key: 'yandex-metrika-noscript',
        tagPosition: 'bodyOpen',
        innerHTML: '<div><img src="https://mc.yandex.ru/watch/113739844" style="position:absolute; left:-9999px;" alt="" /></div>',
      }],
    },
  },
  // Existing .html URLs must be files. Payload directories would collide with them.
  experimental: { payloadExtraction: false },
  nitro: {
    prerender: {
      routes,
      crawlLinks: false,
      failOnError: true,
    },
  },
})
