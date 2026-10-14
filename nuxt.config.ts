import { readFileSync } from 'node:fs'

const routes = JSON.parse(readFileSync(new URL('./app/content/routes.json', import.meta.url), 'utf8')) as string[]

export default defineNuxtConfig({
  compatibilityDate: '2026-10-15',
  devtools: { enabled: false },
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
