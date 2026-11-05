# Honest sitemap lastmod

`publish-nuxt.mjs` enriches `dist/sitemap.xml` after final HTML publication into local dist. It reads only explicit HTML routes and `config/sitemap-lastmod-history.json`. It never changes page HTML, derives dates from filesystem times, or edits the ledger during a build. The legacy-only builder intentionally emits no dates because it precedes final Nuxt rendering.

Dates are UTC calendar days of verified significant content publications. Current seed:2621 routes on2026-11-04, proven by title-restore2621 metadata changes and later source-note21 body changes. The21 are a subset and retain the same calendar day, with separate revision evidence. Seven other canonical routes are intentionally undated; their older candidate histories are not promoted merely because files were observed or republished. See `outputs/seo-lastmod-2026-11-04/provenance/` and the two receipt/manifest fingerprints inside the ledger.

The strict identity signature covers final title, selected descriptive/OG/Twitter/robots metadata, canonical, JSON-LD, actual header/main/footer and links within them. Nuxt payload/build IDs, preload/bundle names and prerender timestamps outside those regions are excluded; Vue comments/scoped hash attributes are ignored. The significance signature separately covers main visible text, its links/images/iframe targets, metadata and structured data. Header/footer/copyright/decorative markup alone cannot create a new date. A strict identity mismatch can conservatively omit an old date. A later real update may bridge such frame-only churn only when its previous substantive fingerprint still matches the recorded substantive content.

This is an HTML-content contract. Binary image replacement at an unchanged URL is not detected; use versioned image URLs for real image updates or extend/version the algorithm with explicit asset evidence. Pure renderer formatting changes may conservatively omit a date; they must not be used to manufacture a newer date.

For an ordinary build, a route receives lastmod only when its final identity matches its latest proven published revision. Local drafts, unknown routes or changed content receive no date. Invalid/future dates or broken revision/evidence chains fail closed. Existing unknown lastmod is removed. URL set/order and other sitemap fields are preserved.

## Future real updates

1. Build/review content normally. Draft changes will omit affected dates; unchanged routes keep their dates. Do not edit dates to make a candidate look fresh.
2. Publish the accepted content through the separately authorized deployment process. Preserve previous and new public HTML snapshots, manifests and the successful publication receipt. This module does not deploy, request indexing or contact services.
3. Record only proven before→after substantive changes into a proposed ledger:

```powershell
node scripts/sitemap-lastmod.mjs record --ledger config/sitemap-lastmod-history.json --before-site PREVIOUS_SNAPSHOT --before-manifest PREVIOUS_MANIFEST --before-receipt PREVIOUS_SUCCESSFUL_RECEIPT --after-site PUBLISHED_SNAPSHOT --after-manifest PUBLISHED_MANIFEST --receipt SUCCESSFUL_RECEIPT --out outputs/proposed-lastmod-history.json
```

Both publication receipts must match their release and pin the exact manifest files. Modern receipts use `status=PRODUCTION_GO/PRODUCTION_ACCEPTED`, `activationUtc` (or `activation.at_utc`) and `manifestFileSha256` (or `finalManifestFileSha256`). The documented S-100 legacy receipt is supported only with its successful cleanup manifest pin and final server file count. Previous publication must precede the new one. Both public snapshot HTML bytes must match their raw manifest SHA. First observation without a proven published before snapshot does not establish an update. The recorder computes substantive differences, normalizing common/numeric HTML entities; frame/copyright/runtime-only updates are skipped. A published release ID cannot be rewritten. Preserve the actual accepted before-manifest/receipt evidence, especially when initializing a new ledger.

4. Review the proposed ledger and evidence, then replace the tracked config with the approved history. Rebuild/review sitemap against the published snapshot and publish sitemap separately when authorized. This two-phase process keeps unpublished drafts distinct from publication facts. A repeat record with identical evidence is idempotent; do not resubmit different evidence under an old release ID.

For XML-only verification against an already accepted snapshot:

```powershell
node scripts/sitemap-lastmod.mjs apply --site ISOLATED_PUBLIC_SNAPSHOT --ledger config/sitemap-lastmod-history.json
```

Always use an isolated copy for review. This rewrites only that copy's sitemap. Run `node --test scripts/sitemap-lastmod.test.mjs` and the normal site checks. The initial Google rule is unchanged: only accurate, consistently verifiable significant updates belong in lastmod; a sitemap is not an indexing guarantee. Existing local primary-source reference: `docs/research/S-97-GEO-2026-10-31.md`, pointing to Google's [Build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap). No new network request was made for this implementation.
