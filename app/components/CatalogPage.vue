<script setup lang="ts">
const route = useRoute()
const pages = import.meta.glob('../content/pages/**/*.json')
const filename = route.path === '/' ? 'index.html' : route.path.slice(1)
const loader = pages[`../content/pages/${filename}.json`]

if (!loader) throw createError({ statusCode: 404, statusMessage: 'Страница не найдена' })

const { data: page } = await useAsyncData(`catalog:${filename}`, async () => {
  const module = await loader() as { default: Record<string, string | null> }
  return module.default
})

onMounted(async () => {
  // The catalog filters bind to the rendered DOM, after Nuxt has hydrated it.
  await import('../../assets/site.js')
})

useHead(() => ({
  htmlAttrs: { lang: 'ru' },
  bodyAttrs: { class: page.value?.className ?? '' },
  title: page.value?.title ?? 'ПМК Петербурга',
  meta: [
    { name: 'theme-color', content: '#faf8f1' },
    { name: 'description', content: page.value?.description ?? '' },
  ],
  link: [
    { rel: 'icon', href: '/assets/favicon.svg', type: 'image/svg+xml' },
    { rel: 'stylesheet', href: `/assets/${page.value?.stylesheet ?? 'style.css'}` },
    ...(page.value?.hero ? [{ rel: 'preload', as: 'image', href: `/assets/${page.value.hero}`, fetchpriority: 'high' }] : []),
  ],
}))
</script>

<template>
  <div v-if="page">
    <a class="skip-link" href="#main">Перейти к&nbsp;содержимому</a>
    <div v-html="page.header" />
    <main id="main" v-html="page.body" />
    <div v-html="page.footer" />
  </div>
</template>
