# ACTIVITY-LAYOUT-NAV-HOTFIX-2026-11-11

Status: PRODUCTION ACCEPTED IN R2. Git synchronization is authorized and pending actual execution.

Пользователь поручил исправить desktop layout страниц занятий и переход карточек каталога, затем удалить внутренние кнопки профиля клуба и надзаголовок «Контакты клуба» в activity-info. Code 01a1a68f-5ad6-7f41-8828-2061d01de2fe выполнял source/shared работу; root оркестрировал, SEO/QA и PC проверяли независимо.

## Результат

На desktop основной контент activity page расположен слева, адрес, контакты и карта — справа. На mobile сохранён порядок main / contacts / join / back. Карточки каталога используют URL того же indexed activity object, который задаёт видимое занятие. Отдельный data-club-href сохраняет клубную identity карты и пару «Камчатка/Отвага»; ограничения homepage, language mode и одиночного участника пары сохранены.

Удалены 2261 внутренняя club-profile button CTA и 2261 целевой p.section-kicker над H2 «Уточнить подробности». Внешние кнопки, обычные ссылки клуба, breadcrumbs, back navigation и map popup links сохранены. Изменены только build-site.mjs, assets/site.js, assets/style.css и scripts/activity-content-markup.mjs. Данные, 1076 таблиц, 30 intro, 17 rich descriptions, 24 stars, группы и Нева не откатывались; два retired Neva URL сохраняют 410.

## Диагностика и проверка

Исходные generic layout и catalog binding существовали до ed0af80b. В проверенных старых образцах «Морской / разговорный клуб» и «Адмиралтеец / бокс» также не было боковой колонки; вывод не распространяется на неизученные старые версии или другие custom pages. См. [root cause](../../outputs/activity-layout-nav-hotfix-2026-11-11/code/ROOT-CAUSE.md).

Локальные кандидаты сохранялись отдельно: 73448 для layout/navigation, 9b37 для map identity, 866e для удаления кнопок, 02646ce1 для удаления kicker. Каждый согласованный pipeline завершил build/check с кодом 0. Финальный manifest: 02646ce1cff6ac0ae846dc7bc037ea9de0c6d68facf0864dad45ca66ef7c4882, 5338 файлов / 2636 HTML / 2634 canonical / 2275 activity pages. Точные DOM и source invariants позволили переиспользовать предыдущие UI/nav/map проверки без повторных полных аудитов.

[Финальная локальная QA](../../outputs/activity-layout-nav-hotfix-2026-11-11/qa/remove-info-kicker/QA-ACK.json), [PC ACK](../../outputs/activity-layout-nav-hotfix-2026-11-11/pc/remove-info-kicker/ROOT-PREVIEW-ACK.json), [release brief](RELEASE-2026-11-11-R2.md).

## Production и Git

Root принял production R2: контент активирован 11.11.2026 в 21:19:59 МСК, XML применён в 21:28:25 МСК. Независимые POST_CONTENT_GO, LIVE_UI_PASS и FINAL_XML_GO подтверждены. 48627 файлов server manifest и 13 content HTTP checks прошли; final XML имеет exact server/HTTP readback. SSH закрыт штатно с кодом 0. Старые freezes, backup и previous tree сохранены.

[Production ACK](../../outputs/release-2026-11-11-r2/code/PRODUCTION-ACK.json), [XML ACK](../../outputs/release-2026-11-11-r2/code/XML-ACK.json), [final manifest ACK](../../outputs/release-2026-11-11-r2/code/FINAL-MANIFEST-ACK.json). Этот документ фиксирует production acceptance до Git execution. Фактические commit/push и SHA записываются после выполнения в ignored [Git receipt](../../outputs/release-2026-11-11-r2/code/git/receipt.json); второй документальный коммит ради собственного SHA не создаётся. Новые задачи не запускаются.
