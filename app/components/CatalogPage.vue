<script setup lang="ts">
const route = useRoute()
const pages = import.meta.glob('../content/pages/**/*.json')
const filename = route.path === '/' ? 'index.html' : route.path.slice(1)
const loader = pages[`../content/pages/${filename}.json`]

if (!loader) throw createError({ statusCode: 404, statusMessage: 'Страница не найдена' })

const { data: page } = await useAsyncData(`catalog:${filename}`, async () => {
  const module = await loader() as { default: {
    title: string; description: string; className: string; header: string;
    body: string; footer: string; stylesheet: string; hero: string | null;
    canonical: string; structuredData: string | null; guide?: boolean;
    socialImage: string; socialImageAlt: string;
  } }
  return module.default
})

// Keep the district catalogue last, after the interactive home sharing block.
const homeDistrictSection = computed(() => filename === 'index.html'
  ? page.value?.body.match(/<section\b[^>]*\bid="districts"[^>]*>[\s\S]*?<\/section>/)?.[0] ?? ''
  : '')
const mainBody = computed(() => homeDistrictSection.value
  ? page.value?.body.replace(homeDistrictSection.value, '')
  : page.value?.body)

const footerMarkup = computed(() => page.value?.footer.replace(
  /<a\b[^>]*href="(?:\.\.\/)*districts\/vasileostrovsky\.html"[^>]*>Василеостровский(?:&nbsp;|\u00a0| )район<\/a>/g,
  '',
))
const showBackToTop = ref(false)
let disposeGuide: (() => void) | undefined
const updateBackToTop = () => { showBackToTop.value = window.scrollY > 480 }
const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
  })
}

onMounted(async () => {
  // The catalog filters bind to the rendered DOM, after Nuxt has hydrated it.
  await import('../../assets/site.js')
  if (page.value?.guide) {
    const { initGuidePage } = await import('../../assets/guide-page.js')
    disposeGuide = initGuidePage()
  }
  window.addEventListener('scroll', updateBackToTop, { passive: true })
  updateBackToTop()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateBackToTop)
  disposeGuide?.()
})

useHead(() => ({
  htmlAttrs: { lang: 'ru' },
  bodyAttrs: { class: page.value?.className ?? '' },
  title: page.value?.title ?? 'ПМК Петербурга',
  meta: [
    { name: 'theme-color', content: '#faf8f1' },
    { name: 'description', content: page.value?.description ?? '' },
    { property: 'og:type', content: page.value?.guide && filename !== 'guides/index.html' ? 'article' : 'website' },
    { property: 'og:locale', content: 'ru_RU' },
    { property: 'og:site_name', content: 'ПМК Петербурга' },
    { property: 'og:title', content: page.value?.title ?? '' },
    { property: 'og:description', content: page.value?.description ?? '' },
    { property: 'og:url', content: page.value?.canonical ?? 'https://young-russia.ru/' },
    { property: 'og:image', content: page.value?.socialImage ?? '' },
    { property: 'og:image:alt', content: page.value?.socialImageAlt ?? '' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: page.value?.title ?? '' },
    { name: 'twitter:description', content: page.value?.description ?? '' },
    { name: 'twitter:image', content: page.value?.socialImage ?? '' },
    { name: 'twitter:image:alt', content: page.value?.socialImageAlt ?? '' },
  ],
  link: [
    { rel: 'canonical', href: page.value?.canonical ?? 'https://young-russia.ru/' },
    { rel: 'icon', href: '/assets/favicon.svg', type: 'image/svg+xml' },
    { rel: 'stylesheet', href: `/assets/${page.value?.stylesheet ?? 'style.css'}` },
    ...(page.value?.guide ? [{ rel: 'stylesheet', href: '/assets/guide-pages.css' }] : []),
    ...(page.value?.hero ? [{ rel: 'preload', as: 'image', href: `/assets/${page.value.hero}`, fetchpriority: 'high' }] : []),
  ],
  script: page.value?.structuredData ? [{ type: 'application/ld+json', innerHTML: page.value.structuredData }] : [],
}))
</script>

<template>
  <div v-if="page">
    <a class="skip-link" href="#main">Перейти к&nbsp;содержимому</a>
    <div v-html="page.header" />
    <main v-if="$slots.default" id="main"><div v-html="mainBody" /><slot /><div v-if="homeDistrictSection" v-html="homeDistrictSection" /></main>
    <main v-else id="main" v-html="page.body" />
    <div v-html="footerMarkup" />
    <button v-show="showBackToTop" class="back-to-top" type="button" aria-label="Вернуться наверх" title="Наверх" @click="scrollToTop"><span aria-hidden="true">↑</span></button>
  </div>
</template>
