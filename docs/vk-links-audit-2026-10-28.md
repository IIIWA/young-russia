# S-82-R1: VK-ссылки и уточнение «Антея»

Проверка 28.10.2026 по [прямой просьбе пользователя](tasks/S-82-R1.md), текущий чат `01a145eb-4fc1-7a92-a9f8-1b64f87ef1b3`.

## Что установлено

В исходной локальной сборке 2496 HTML и **369 разных VK-адресов** (368 после приведения vk.ru/vk.com к одному домену). Из них 294 ссылки непосредственно заданы у клубов; остальные относятся к направлениям, источникам, учреждению и контактам. Это не число сообществ с проверенной доступностью.

Прямой просмотр уже открытого VK был отклонён Browser Use по site-safety policy. HTTP к VK, другие браузеры/домены, CDP и поиск копий страницы как обход не использовались. Поэтому «работает», «удалено», «требует вход» для остальных страниц не установлено. Заголовок пользовательской вкладки «Такой страницы нет» и его сообщение зафиксированы отдельно от инструментальной проверки содержимого.

Получены 304 собственные официальные страницы из сохранённых полей каталога: **301 HTML прочитан**, три ответа HTTP 503. Переходы разрешались только между указанными официальными доменами, переходы на VK не выполнялись. [Ответы, извлечённые контексты и SHA256](../outputs/S-82-R1/official-review.json).

- **246 текущих адресов** встречаются в этих официальных HTML. Это подтверждает публикацию ссылки, но не доступность VK и не обязательно принадлежность отдельной студии.
- **1 адрес** («Антей») обновлён по прямому уточнению пользователя.
- **122 адреса** не нашли совпадения в этой выборке официальных HTML. Они могут происходить из пользовательских подтверждений, изображений/PDF, старых страниц и алиасов. Они не объявлены нерабочими.

Для 294 записей клубов: у 235 адрес совпадает со связанным официальным HTML; у 49 адрес там не найден, у девяти связанный HTML отсутствует/не получен, один клуб обновлён пользователем. Другие ссылки на странице могут быть общими контактами учреждения, меню или ссылками иных клубов; автоматически клубу они не назначались.

## «Антей» исправлен

Актуальное сообщество по сообщению пользователя: [vk.ru/bjj_antey](https://vk.ru/bjj_antey). Прежний `anteybjj` отмечен как отсутствующий по его сообщению. [Официальная страница](https://gurptcp.pushkin.gov.spb.ru/podrostkovo-molodezhnye-kluby/pmk-antej/) действительно содержит `anteipmk`, но пользователь уточнил, что это контакт Дениса Никулина; он не выдан за сообщество. Диана Сергеева (`benchpress_chemist`) тоже сохранена как личный контакт, без назначения неизвестной должности.

Исправлены семь полей публичного каталога: контакт клуба и источники шести его расписаний. [Подробное уточнение с оригинальным PNG](../YoungRussiaOBS/Источники/ВК/Уточнение%20Антей%202026-10-28.md), [JSON](../data/research/vk-links-review-2026-10-28/antey-user-update.json). Снимок 2026-2027 совпал с E07 по восьми строкам / 36 интервалам; опубликованные шесть бесплатных строк / 31 интервал сохранены. Фитнес (три интервала), шахматы (два), упоминание пауэрлифтинга и состояние «откроется в 16:00» сохранены в базе с ограничениями, без выдуманного бесплатного занятия.

Прямой доступ к новому сообществу инструментом не проверялся. [Локальная карточка после сборки](http://127.0.0.1:4187/clubs/pushkinsky/antey.html).

## Клубные ссылки для ручной сверки

Ниже только отсутствие совпадения со связанным HTML или отсутствие самого HTML. Это **не перечень удалённых сообществ**. Полные альтернативные ссылки источника доступны в JSON и не являются рекомендацией замены.

| Клуб | Текущий адрес | Результат сверки источника |
| --- | --- | --- |
| Молодёжный клуб «Селена» | [VK](https://vk.ru/mkselena) | В связанном HTML не найден |
| Атлант | [VK](https://vk.com/club1668911) | В связанном HTML не найден |
| Сцена | [VK](https://vk.com/club16583508) | В связанном HTML не найден |
| Бригантина | [VK](https://vk.com/club16641567) | В связанном HTML не найден |
| Мужество | [VK](https://vk.com/club19348941) | В связанном HTML не найден |
| Огонёк | [VK](https://vk.com/club7277003) | В связанном HTML не найден |
| Парус | [VK](https://vk.com/club5836831) | В связанном HTML не найден |
| Творчество | [VK](https://vk.com/club20515817) | В связанном HTML не найден |
| Родина | [VK](https://vk.ru/public191955409) | В связанном HTML не найден |
| Ровесник | [VK](https://vk.ru/new.rovesnik) | В связанном HTML не найден |
| Восход: Володарского | [VK](https://vk.ru/club13102028) | В связанном HTML не найден |
| Восход: Приморское шоссе, 270 | [VK](https://vk.ru/ntennisvoshod) | В связанном HTML не найден |
| Восход: Мосина | [VK](https://vk.ru/pmcvoshod) | В связанном HTML не найден |
| Восход: Токарева | [VK](https://vk.ru/voshodtokareva15) | В связанном HTML не найден |
| Восход: Приморское шоссе, 280 | [VK](https://vk.ru/pmcvoshod) | В связанном HTML не найден |
| Арктика Холл | [VK](https://vk.ru/arctic_hall) | Связанный HTML не получен |
| В стиле | [VK](https://vk.ru/public202657713) | Связанный HTML не получен |
| Молодёжная Идея | [VK](https://vk.ru/dommolidea) | Связанный HTML не получен |
| Нева | [VK](https://vk.ru/neva_dm_prim) | Связанный HTML не получен |
| Юпитер | [VK](https://vk.ru/pmkyupiter) | Связанный HTML не получен |
| Павловчанин | [VK](https://vk.ru/pavlovchanin_club) | В связанном HTML не найден |
| Пулковец | [VK](https://vk.ru/club195962703) | В связанном HTML не найден |
| Славянка | [VK](https://vk.ru/club206530956) | В связанном HTML не найден |
| Чайка | [VK](https://vk.ru/public87016438) | Связанный HTML не получен |
| Юность | [VK](https://vk.ru/club183174783) | В связанном HTML не найден |
| Аврора | [VK](https://vk.ru/pmcavrora) | В связанном HTML не найден |
| Белый медведь | [VK](https://vk.ru/belyi_medved_vo) | В связанном HTML не найден |
| Виндсерфинг | [VK](https://vk.ru/club215682842) | В связанном HTML не найден |
| Дружба | [VK](https://vk.ru/club182895843) | В связанном HTML не найден |
| Камчатка | [VK](https://vk.ru/kam_4at_ka) | В связанном HTML не найден |
| Маяк-Олимпикс | [VK](https://vk.ru/mcolympics) | В связанном HTML не найден |
| Надежда | [VK](https://vk.ru/clubnadezhdavo) | В связанном HTML не найден |
| Отвага | [VK](https://vk.ru/otvagaclubvo) | В связанном HTML не найден |
| Планета | [VK](https://vk.ru/club195516119) | В связанном HTML не найден |
| Притяжение | [VK](https://vk.ru/gravity_vo) | В связанном HTML не найден |
| Протон | [VK](https://vk.ru/protonclub) | В связанном HTML не найден |
| Радуга | [VK](https://vk.ru/club228348392) | В связанном HTML не найден |
| Ровесник | [VK](https://vk.ru/club227051367) | В связанном HTML не найден |
| Салют | [VK](https://vk.ru/salutvo) | В связанном HTML не найден |
| Севера | [VK](https://vk.ru/club231411996) | В связанном HTML не найден |
| Скаутский | [VK](https://vk.ru/otryad_sova) | В связанном HTML не найден |
| Факел | [VK](https://vk.ru/fakelvo) | В связанном HTML не найден |
| Фонарик | [VK](https://vk.ru/fonarikclub) | В связанном HTML не найден |
| Центр туристской подготовки | [VK](https://vk.ru/club195516119) | В связанном HTML не найден |
| Шахматный | [VK](https://vk.ru/chessvo) | В связанном HTML не найден |
| Штурм | [VK](https://vk.ru/clubshturmvo) | В связанном HTML не найден |
| Эллада | [VK](https://vk.ru/ellada_vo) | В связанном HTML не найден |
| Юность | [VK](https://vk.ru/yunostclubvo) | В связанном HTML не найден |
| Юпитер | [VK](https://vk.ru/pmkyoupiter) | В связанном HTML не найден |
| Центральный | [VK](https://vk.ru/pmk_centerclub) | В связанном HTML не найден |
| Ритм | [VK](https://vk.com/ritm_pmc_mir) | В связанном HTML не найден |
| Перекрёсток | [VK](https://vk.ru/mklub461) | В связанном HTML не найден |
| Лидер | [VK](https://vk.ru/pmk_leader) | В связанном HTML не найден |
| Патриот | [VK](https://vk.ru/mirpatriot) | В связанном HTML не найден |
| Перспектива | [VK](https://vk.ru/mk_perspektiva) | В связанном HTML не найден |
| Форпост | [VK](https://vk.ru/dm_forpost) | Связанный HTML не получен |
| Феникс | [VK](https://vk.ru/dm_forpost) | Связанный HTML не получен |
| Фестиваль | [VK](https://vk.ru/dm_forpost) | Связанный HTML не получен |

## Все 369 адресов текущего сайта

[Полный JSON с принадлежностью, страницами использования и источниками](../data/research/vk-links-review-2026-10-28/audit.json). У каждой строки прямая доступность VK остаётся непроверенной; у «Антея» отдельно зафиксировано сообщение пользователя. Один личный профиль руководителя и ссылки на услуги/публикации не переименованы в сообщества.

| Адрес | Подпись на сайте | Публикация в официальном HTML |
| --- | --- | --- |
| [vk.ru/club227328252](https://vk.ru/club227328252) | Секция бокса ВКонтакте ↗; Сообщество направления ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/id432011892](https://vk.ru/id432011892) | Руководитель направления: Mike Leon ↗; Руководитель направления ↗ | Нет совпадения в проверенной выборке |
| [vk.com/morskoy_club](https://vk.com/morskoy_club) | ВКонтакте клуба ↗; сообществе клуба | [Источник](https://admiralteisky.admiral.gov.spb.ru/molodezhnye-kluby-centra/565/) |
| [vk.ru/iiiwaa](https://vk.ru/iiiwaa) | ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/club230671761](https://vk.ru/club230671761) | Секция тайского бокса ВКонтакте ↗; Сообщество направления ↗ | Нет совпадения в проверенной выборке |
| [vk.com/club230148007](https://vk.com/club230148007) | ВКонтакте клуба ↗ | [Источник](https://www.gov.spb.ru/gov/terr/reg_admiral/podvedomstvennye-uchrezhdeniya/podrostkovye-kluby/) |
| [vk.com/pmk_forward](https://vk.com/pmk_forward) | ВКонтакте клуба ↗ | [Источник](https://www.gov.spb.ru/gov/terr/reg_admiral/podvedomstvennye-uchrezhdeniya/podrostkovye-kluby/) |
| [vk.com/pmk_domostroi](https://vk.com/pmk_domostroi) | ВКонтакте клуба ↗ | [Источник](https://admiralteisky.admiral.gov.spb.ru/molodezhnye-kluby-centra/569/) |
| [vk.com/strt_art_graffiti](https://vk.com/strt_art_graffiti) | ВКонтакте клуба ↗ | [Источник](https://admiralteisky.admiral.gov.spb.ru/molodezhnye-kluby-centra/586/) |
| [vk.com/pmkglobus](https://vk.com/pmkglobus) | ВКонтакте клуба ↗ | [Источник](https://admiralteisky.admiral.gov.spb.ru/molodezhnye-kluby-centra/567/) |
| [vk.com/pmk_gorod](https://vk.com/pmk_gorod) | ВКонтакте клуба ↗ | [Источник](https://admiralteisky.admiral.gov.spb.ru/molodezhnye-kluby-centra/568/) |
| [vk.com/klub_ideal](https://vk.com/klub_ideal) | ВКонтакте клуба ↗ | [Источник](https://admiralteisky.admiral.gov.spb.ru/molodezhnye-kluby-centra/570/) |
| [vk.com/nashemesto_centre](https://vk.com/nashemesto_centre) | ВКонтакте клуба ↗ | [Источник](https://admiralteisky.admiral.gov.spb.ru/molodezhnye-kluby-centra/571/) |
| [vk.com/pmkmeridian](https://vk.com/pmkmeridian) | ВКонтакте клуба ↗ | [Источник](https://admiralteisky.admiral.gov.spb.ru/molodezhnye-kluby-centra/572/) |
| [vk.com/club1883797](https://vk.com/club1883797) | ВКонтакте клуба ↗ | [Источник](https://admiralteisky.admiral.gov.spb.ru/molodezhnye-kluby-centra/574/) |
| [vk.com/pmk_orfey_zabava](https://vk.com/pmk_orfey_zabava) | ВКонтакте клуба ↗ | [Источник](https://admiralteisky.admiral.gov.spb.ru/molodezhnye-kluby-centra/575/) |
| [vk.com/pmk_palestra](https://vk.com/pmk_palestra) | ВКонтакте клуба ↗ | [Источник](https://admiralteisky.admiral.gov.spb.ru/molodezhnye-kluby-centra/576/) |
| [vk.com/pmk_perspectiva](https://vk.com/pmk_perspectiva) | ВКонтакте клуба ↗ | [Источник](https://admiralteisky.admiral.gov.spb.ru/molodezhnye-kluby-centra/578/) |
| [vk.com/pmk_peterburgskie_lvy](https://vk.com/pmk_peterburgskie_lvy) | ВКонтакте клуба ↗ | [Источник](https://admiralteisky.admiral.gov.spb.ru/molodezhnye-kluby-centra/579/) |
| [vk.com/m_club_poisk](https://vk.com/m_club_poisk) | ВКонтакте клуба ↗ | [Источник](https://www.gov.spb.ru/gov/terr/reg_admiral/podvedomstvennye-uchrezhdeniya/podrostkovye-kluby/) |
| [vk.com/csi_teatralka](https://vk.com/csi_teatralka) | ВКонтакте клуба ↗ | [Источник](https://admiralteisky.admiral.gov.spb.ru/molodezhnye-kluby-centra/580/) |
| [vk.ru/comein_studio?z=article_edit-30065169_231445](https://vk.ru/comein_studio?z=article_edit-30065169_231445) | Расписание клуба в VK ↗ | [Источник](https://admiralteisky.admiral.gov.spb.ru/molodezhnye-kluby-centra/581/) |
| [vk.com/comein_studio](https://vk.com/comein_studio) | ВКонтакте клуба ↗ | [Источник](https://admiralteisky.admiral.gov.spb.ru/molodezhnye-kluby-centra/581/) |
| [vk.ru/mkselena](https://vk.ru/mkselena) | ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.com/mppotok](https://vk.com/mppotok) | ВКонтакте клуба ↗ | [Источник](https://www.gov.spb.ru/gov/terr/reg_admiral/podvedomstvennye-uchrezhdeniya/podrostkovye-kluby/) |
| [vk.com/cozvychie](https://vk.com/cozvychie) | ВКонтакте клуба ↗ | [Источник](https://admiralteisky.admiral.gov.spb.ru/molodezhnye-kluby-centra/584/) |
| [vk.com/pmkvdohnovenie](https://vk.com/pmkvdohnovenie) | ВКонтакте клуба ↗ | [Источник](https://admiralteisky.admiral.gov.spb.ru/molodezhnye-kluby-centra/566/) |
| [vk.com/pmk_r](https://vk.com/pmk_r) | ВКонтакте клуба ↗ | [Источник](https://www.gov.spb.ru/gov/terr/reg_admiral/podvedomstvennye-uchrezhdeniya/podrostkovye-kluby/) |
| [vk.com/pmk_pro](https://vk.com/pmk_pro) | ВКонтакте клуба ↗ | [Источник](https://www.gov.spb.ru/gov/terr/reg_admiral/podvedomstvennye-uchrezhdeniya/podrostkovye-kluby/) |
| [vk.com/pmk_mozaika](https://vk.com/pmk_mozaika) | ВКонтакте клуба ↗ | [Источник](https://admiralteisky.admiral.gov.spb.ru/molodezhnye-kluby-centra/573/) |
| [vk.com/vcentre_club](https://vk.com/vcentre_club) | ВКонтакте клуба ↗ | [Источник](https://www.gov.spb.ru/gov/terr/reg_admiral/podvedomstvennye-uchrezhdeniya/podrostkovye-kluby/) |
| [vk.ru/pmk.atmosfera](https://vk.ru/pmk.atmosfera) | ВКонтакте клуба ↗ | [Источник](http://centerfrunze.ru/clubs.php?id=8) |
| [vk.ru/domik_frunz](https://vk.ru/domik_frunz) | ВКонтакте клуба ↗ | [Источник](http://centerfrunze.ru/clubs.php?id=1) |
| [vk.ru/pmk.fakel](https://vk.ru/pmk.fakel) | ВКонтакте клуба ↗ | [Источник](http://centerfrunze.ru/clubs.php?id=15) |
| [vk.ru/pmk.fenix](https://vk.ru/pmk.fenix) | ВКонтакте клуба ↗ | [Источник](http://centerfrunze.ru/clubs.php?id=6) |
| [vk.ru/pmk.garmonia](https://vk.ru/pmk.garmonia) | ВКонтакте клуба ↗ | [Источник](http://centerfrunze.ru/clubs.php?id=7) |
| [vk.ru/klub_iskra](https://vk.ru/klub_iskra) | ВКонтакте клуба ↗ | [Источник](http://centerfrunze.ru/clubs.php?id=3) |
| [vk.ru/pmkmir](https://vk.ru/pmkmir) | ВКонтакте клуба ↗ | [Источник](http://centerfrunze.ru/clubs.php?id=4) |
| [vk.ru/moloko_frunz](https://vk.ru/moloko_frunz) | ВКонтакте клуба ↗ | [Источник](http://centerfrunze.ru/clubs.php?id=18) |
| [vk.ru/planeta_tyt](https://vk.ru/planeta_tyt) | ВКонтакте клуба ↗ | [Источник](http://centerfrunze.ru/clubs.php?id=9) |
| [vk.ru/progresssportclub](https://vk.ru/progresssportclub) | ВКонтакте клуба ↗ | [Источник](http://centerfrunze.ru/clubs.php?id=10) |
| [vk.ru/pmk.raketka](https://vk.ru/pmk.raketka) | ВКонтакте клуба ↗ | [Источник](http://centerfrunze.ru/clubs.php?id=11) |
| [vk.ru/pmk_romantika](https://vk.ru/pmk_romantika) | ВКонтакте клуба ↗ | [Источник](http://centerfrunze.ru/clubs.php?id=14) |
| [vk.ru/newsovremennik](https://vk.ru/newsovremennik) | ВКонтакте клуба ↗ | [Источник](http://centerfrunze.ru/clubs.php?id=12) |
| [vk.ru/pmk.start](https://vk.ru/pmk.start) | ВКонтакте клуба ↗ | [Источник](http://centerfrunze.ru/clubs.php?id=13) |
| [vk.ru/3fdno](https://vk.ru/3fdno) | ВКонтакте клуба ↗ | [Источник](http://centerfrunze.ru/clubs.php?id=5) |
| [vk.ru/klubov.club](https://vk.ru/klubov.club) | ВКонтакте клуба ↗ | [Источник](http://centerfrunze.ru/clubs.php?id=2) |
| [vk.ru/pmk.yunost](https://vk.ru/pmk.yunost) | ВКонтакте клуба ↗ | [Источник](http://centerfrunze.ru/clubs.php?id=16) |
| [vk.com/club60867905](https://vk.com/club60867905) | ВКонтакте клуба ↗ | [Источник](https://pmc-kalininsky.spb.ru/?page_id=1107) |
| [vk.com/club1668911](https://vk.com/club1668911) | ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.com/club1881188](https://vk.com/club1881188) | Студия брейк-данса: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.com/club1652148](https://vk.com/club1652148) | Театр танца «Петербургский уикенд»: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.com/club16641567](https://vk.com/club16641567) | ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.com/pmk.druzhba](https://vk.com/pmk.druzhba) | ВКонтакте клуба ↗ | [Источник](https://pmc-kalininsky.spb.ru/?page_id=1091) |
| [vk.com/club23689001](https://vk.com/club23689001) | ВКонтакте клуба ↗ | [Источник](https://pmc-kalininsky.spb.ru/?page_id=1057) |
| [vk.com/pmk_kuhnja](https://vk.com/pmk_kuhnja) | ВКонтакте клуба ↗ | [Источник](https://pmc-kalininsky.spb.ru/?page_id=219835) |
| [vk.com/club19348941](https://vk.com/club19348941) | ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.com/club_nepokor](https://vk.com/club_nepokor) | ВКонтакте клуба ↗ | [Источник](https://pmc-kalininsky.spb.ru/?page_id=1085) |
| [vk.com/club7277003](https://vk.com/club7277003) | ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.com/okna_art_gallery](https://vk.com/okna_art_gallery) | ВКонтакте клуба ↗ | [Источник](https://pmc-kalininsky.spb.ru/?page_id=219819) |
| [vk.com/club43651869](https://vk.com/club43651869) | ВКонтакте клуба ↗ | [Источник](https://pmc-kalininsky.spb.ru/?page_id=1082) |
| [vk.com/club5836831](https://vk.com/club5836831) | ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.com/sgoodfox](https://vk.com/sgoodfox) | Школа добровольцев «ФОКС»: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.com/club20220328](https://vk.com/club20220328) | ВКонтакте клуба ↗ | [Источник](https://pmc-kalininsky.spb.ru/?page_id=1074) |
| [vk.com/public186391173](https://vk.com/public186391173) | ВКонтакте клуба ↗ | [Источник](https://pmc-kalininsky.spb.ru/?page_id=211814) |
| [vk.com/club116044000](https://vk.com/club116044000) | ВКонтакте клуба ↗ | [Источник](https://pmc-kalininsky.spb.ru/?page_id=1065) |
| [vk.com/mk.sozdanie](https://vk.com/mk.sozdanie) | ВКонтакте клуба ↗ | [Источник](https://pmc-kalininsky.spb.ru/?page_id=220119) |
| [vk.com/pmkspasatel](https://vk.com/pmkspasatel) | ВКонтакте клуба ↗ | [Источник](https://pmc-kalininsky.spb.ru/?page_id=1053) |
| [vk.com/club16583508](https://vk.com/club16583508) | ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.com/club20515817](https://vk.com/club20515817) | ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.com/pmk_vkadre](https://vk.com/pmk_vkadre) | ВКонтакте клуба ↗ | [Источник](https://pmc-kalininsky.spb.ru/?page_id=213218) |
| [vk.com/pmc_kalininsky](https://vk.com/pmc_kalininsky) | ВКонтакте учреждения ↗ | Нет совпадения в проверенной выборке |
| [vk.com/iron_altair](https://vk.com/iron_altair) | ВКонтакте клуба ↗ | [Источник](https://pmckir.ru/?page_id=1769) |
| [vk.com/club16263721](https://vk.com/club16263721) | ВКонтакте клуба ↗ | [Источник](https://pmckir.ru/?page_id=1667) |
| [vk.com/mkfakelkir](https://vk.com/mkfakelkir) | ВКонтакте клуба ↗ | [Источник](https://pmckir.ru/?page_id=1954) |
| [vk.com/pmk_leni_golikova](https://vk.com/pmk_leni_golikova) | ВКонтакте клуба ↗ | [Источник](https://pmckir.ru/?page_id=1810) |
| [vk.com/kanonerec](https://vk.com/kanonerec) | ВКонтакте клуба ↗ | [Источник](https://pmckir.ru/?page_id=1833) |
| [vk.com/club151736835](https://vk.com/club151736835) | ВКонтакте клуба ↗ | [Источник](https://pmckir.ru/?page_id=1842) |
| [vk.com/pmklenenec](https://vk.com/pmklenenec) | ВКонтакте клуба ↗ | [Источник](https://pmckir.ru/?page_id=1851) |
| [vk.com/molspase](https://vk.com/molspase) | ВКонтакте клуба ↗ | [Источник](https://pmckir.ru/?page_id=1861) |
| [vk.com/dod_sodruzhestvo](https://vk.com/dod_sodruzhestvo) | Центр «Содружество»: ВКонтакте ↗ | [Источник](https://pmckir.ru/?page_id=1861) |
| [vk.com/fcmolspase](https://vk.com/fcmolspase) | Семейный клуб «От чистого сердца»: ВКонтакте ↗ | [Источник](https://pmckir.ru/?page_id=1861) |
| [vk.com/molspaseplay](https://vk.com/molspaseplay) | Клуб «Маска»: ВКонтакте ↗ | [Источник](https://pmckir.ru/?page_id=1861) |
| [vk.ru/cinetalk](https://vk.ru/cinetalk) | Клуб «КиноВзгляд»: ВКонтакте ↗ | [Источник](https://pmckir.ru/?page_id=1861) |
| [vk.com/club65947899](https://vk.com/club65947899) | ВКонтакте клуба ↗ | [Источник](https://pmckir.ru/?page_id=1869) |
| [vk.com/club154236766](https://vk.com/club154236766) | ВКонтакте клуба ↗ | [Источник](https://pmckir.ru/?page_id=1895) |
| [vk.com/pmz_pmkraduga](https://vk.com/pmz_pmkraduga) | ВКонтакте клуба ↗ | [Источник](https://pmckir.ru/?page_id=1905) |
| [vk.com/public160977498](https://vk.com/public160977498) | ВКонтакте клуба ↗ | [Источник](https://pmckir.ru/?page_id=1918) |
| [vk.com/mpseverblizko](https://vk.com/mpseverblizko) | ВКонтакте клуба ↗ | [Источник](https://pmckir.ru/?page_id=1935) |
| [vk.com/club139572086](https://vk.com/club139572086) | ВКонтакте клуба ↗ | [Источник](https://pmckir.ru/?page_id=1943) |
| [vk.com/pmc_kirovskiy](https://vk.com/pmc_kirovskiy) | ВКонтакте учреждения ↗; ВКонтакте ПМЦ ↗ | [Источник](https://pmckir.ru/?page_id=1667) |
| [vk.com/club11237362](https://vk.com/club11237362) | ВКонтакте клуба ↗ | [Источник](https://pmckir.ru/?page_id=1962) |
| [vk.com/unleningradez](https://vk.com/unleningradez) | ВКонтакте клуба ↗ | [Источник](https://pmckir.ru/?page_id=1970) |
| [vk.com/pmk_zarya](https://vk.com/pmk_zarya) | ВКонтакте клуба ↗ | [Источник](https://pmckir.ru/?page_id=1794) |
| [vk.ru/pmk_baltika](https://vk.ru/pmk_baltika) | ВКонтакте клуба ↗ | [Источник](http://dmk.spb.ru/klubs/baltika/) |
| [vk.ru/uslugi-43117555?screen=group](https://vk.ru/uslugi-43117555?screen=group) | Источник условий ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/chaykaklpbox](https://vk.ru/chaykaklpbox) | ВКонтакте клуба ↗ | [Источник](http://dmk.spb.ru/klubs/chaika/) |
| [vk.com/spbgurovesnik](https://vk.com/spbgurovesnik) | ВКонтакте учреждения ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/pm_klyb_fakel](https://vk.ru/pm_klyb_fakel) | ВКонтакте клуба ↗ | [Источник](http://dmk.spb.ru/klubs/fakel/) |
| [vk.ru/market/product/khuashan-kitayskiy-yazyk-43117555-14545205](https://vk.ru/market/product/khuashan-kitayskiy-yazyk-43117555-14545205) | Китайский язык «Хуашань»: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/pmk_fantazery](https://vk.ru/pmk_fantazery) | ВКонтакте клуба ↗ | [Источник](http://dmk.spb.ru/klubs/fantazery/) |
| [vk.ru/gorizontklp](https://vk.ru/gorizontklp) | ВКонтакте клуба ↗ | [Источник](http://dmk.spb.ru/klubs/gorizont/) |
| [vk.com/club227798469](https://vk.com/club227798469) | Добро.Центр ДМК: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/dm_kolpinets](https://vk.ru/dm_kolpinets) | ВКонтакте клуба ↗ | [Источник](http://dmk.spb.ru/dostupnaja-sreda-dlja-invalidov/molodezhnyj_klub_rodina/) |
| [vk.ru/prostospb](https://vk.ru/prostospb) | Пространство «ПРОСТО»: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/mdzvd](https://vk.ru/mdzvd) | ВКонтакте клуба ↗ | [Источник](http://dmk.spb.ru/klubs/mediazavod/) |
| [vk.ru/orlenok_dmk](https://vk.ru/orlenok_dmk) | ВКонтакте клуба ↗ | [Источник](http://dmk.spb.ru/klubs/orlenok/) |
| [vk.ru/pmk_ritm](https://vk.ru/pmk_ritm) | ВКонтакте клуба ↗ | [Источник](http://dmk.spb.ru/klubs/ritm/) |
| [vk.ru/public191955409](https://vk.ru/public191955409) | ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.com/pmc_ohta](https://vk.com/pmc_ohta) | Общее сообщество ↗ | [Источник](https://pmcohta.ru/4k) |
| [vk.com/pmk_adrenalin](https://vk.com/pmk_adrenalin) | ВКонтакте клуба ↗ | [Источник](https://pmcohta.ru/adrenalin) |
| [vk.com/whc_raid](https://vk.com/whc_raid) | ВКонтакте клуба ↗ | [Источник](https://pmcohta.ru/akvamarin) |
| [vk.com/pmk_berezka](https://vk.com/pmk_berezka) | ВКонтакте клуба ↗ | [Источник](https://pmcohta.ru/berezka) |
| [vk.com/dialogcentre](https://vk.com/dialogcentre) | ВКонтакте клуба ↗ | [Источник](https://pmcohta.ru/dialog) |
| [vk.com/pmk_fakel](https://vk.com/pmk_fakel) | ВКонтакте клуба ↗ | [Источник](https://pmcohta.ru/fakel) |
| [vk.com/factura_ohta](https://vk.com/factura_ohta) | ВКонтакте клуба ↗ | [Источник](https://pmcohta.ru/faktura) |
| [vk.com/izmerenie_mp](https://vk.com/izmerenie_mp) | ВКонтакте клуба ↗ | [Источник](https://pmcohta.ru/izmerenie) |
| [vk.com/dm_kvadrat](https://vk.com/dm_kvadrat) | ВКонтакте клуба ↗ | [Источник](https://pmcohta.ru/kvadrat) |
| [vk.com/kvartira17_ru](https://vk.com/kvartira17_ru) | ВКонтакте клуба ↗ | [Источник](https://pmcohta.ru/kvartiraru) |
| [vk.com/pmk_meteor](https://vk.com/pmk_meteor) | ВКонтакте клуба ↗ | [Источник](https://pmcohta.ru/meteor) |
| [vk.com/pmk_neo](https://vk.com/pmk_neo) | ВКонтакте клуба ↗ | [Источник](https://pmcohta.ru/neo) |
| [vk.com/pmk_neva](https://vk.com/pmk_neva) | ВКонтакте клуба ↗ | [Источник](https://pmcohta.ru/neva) |
| [vk.com/octrov](https://vk.com/octrov) | ВКонтакте клуба ↗ | [Источник](https://pmcohta.ru/ostrova) |
| [vk.com/spbraid](https://vk.com/spbraid) | ВКонтакте клуба ↗ | [Источник](https://pmcohta.ru/raid) |
| [vk.com/pmk_rodnik](https://vk.com/pmk_rodnik) | ВКонтакте клуба ↗ | [Источник](https://pmcohta.ru/rodnik) |
| [vk.com/sosedi_privet](https://vk.com/sosedi_privet) | ВКонтакте клуба ↗ | [Источник](https://pmcohta.ru/sosedi) |
| [vk.com/pmk_sovremennik](https://vk.com/pmk_sovremennik) | ВКонтакте клуба ↗ | [Источник](https://pmcohta.ru/sovremennik) |
| [vk.com/mp_teplo](https://vk.com/mp_teplo) | ВКонтакте клуба ↗ | [Источник](https://pmcohta.ru/teplo) |
| [vk.com/pmk_tochka](https://vk.com/pmk_tochka) | ВКонтакте клуба ↗ | [Источник](https://pmcohta.ru/tochka) |
| [vk.com/vpczov](https://vk.com/vpczov) | ВКонтакте клуба ↗ | [Источник](https://pmcohta.ru/zov) |
| [vk.com/pmk_alye_parusa](https://vk.com/pmk_alye_parusa) | ВКонтакте клуба ↗ | [Источник](https://gu321.site.gov.spb.ru/spisok-klubov/alye-parusa/) |
| [vk.com/pmk_bereg](https://vk.com/pmk_bereg) | ВКонтакте клуба ↗ | [Источник](https://gu321.site.gov.spb.ru/spisok-klubov/bereg/) |
| [vk.ru/mk_burevestnik](https://vk.ru/mk_burevestnik) | ВКонтакте клуба ↗ | [Источник](https://gu321.site.gov.spb.ru/spisok-klubov/burevestnik/) |
| [vk.com/fakel_spb](https://vk.com/fakel_spb) | ВКонтакте клуба ↗ | [Источник](https://gu321.site.gov.spb.ru/spisok-klubov/fakel/) |
| [vk.ru/mkkompas](https://vk.ru/mkkompas) | ВКонтакте клуба ↗ | [Источник](https://gu321.site.gov.spb.ru/spisok-klubov/kompas/) |
| [vk.com/pmkmayak](https://vk.com/pmkmayak) | ВКонтакте клуба ↗ | [Источник](https://gu321.site.gov.spb.ru/spisok-klubov/majak/) |
| [vk.com/nepokor_rubezh](https://vk.com/nepokor_rubezh) | ВКонтакте клуба ↗ | [Источник](https://gu321.site.gov.spb.ru/spisok-klubov/nepokorennyj-rubezh/) |
| [vk.com/pmcolimp](https://vk.com/pmcolimp) | ВКонтакте клуба ↗ | [Источник](https://gu321.site.gov.spb.ru/spisok-klubov/olimp/) |
| [vk.com/pmk_polet](https://vk.com/pmk_polet) | ВКонтакте клуба ↗ | [Источник](https://gu321.site.gov.spb.ru/spisok-klubov/polet/) |
| [vk.com/prichalivayvprichal](https://vk.com/prichalivayvprichal) | ВКонтакте клуба ↗ | [Источник](https://gu321.site.gov.spb.ru/spisok-klubov/prichal/) |
| [vk.com/mkraketa](https://vk.com/mkraketa) | ВКонтакте клуба ↗ | [Источник](https://gu321.site.gov.spb.ru/spisok-klubov/raketa/) |
| [vk.com/pmk_record](https://vk.com/pmk_record) | ВКонтакте клуба ↗ | [Источник](https://gu321.site.gov.spb.ru/spisok-klubov/rekord/) |
| [vk.com/pmk_rytm](https://vk.com/pmk_rytm) | ВКонтакте клуба ↗ | [Источник](https://gu321.site.gov.spb.ru/spisok-klubov/ritm/) |
| [vk.com/rovesnik_spb](https://vk.com/rovesnik_spb) | ВКонтакте клуба ↗ | [Источник](https://gu321.site.gov.spb.ru/spisok-klubov/rovesnik/) |
| [vk.com/pmk_umelec](https://vk.com/pmk_umelec) | ВКонтакте клуба ↗ | [Источник](https://gu321.site.gov.spb.ru/spisok-klubov/umelec/) |
| [vk.com/vosxod_spb](https://vk.com/vosxod_spb) | ВКонтакте клуба ↗ | [Источник](https://gu321.site.gov.spb.ru/spisok-klubov/voshod/) |
| [vk.com/yunost_pmk](https://vk.com/yunost_pmk) | ВКонтакте клуба ↗ | [Источник](https://gu321.site.gov.spb.ru/spisok-klubov/junost/) |
| [vk.com/krondm](https://vk.com/krondm) | ВКонтакте клуба ↗ | [Источник](https://xn----htbqkcfn.xn--p1ai/organizaczii/klubyi-i-formirovaniya-dvorcza-molodyozhi/) |
| [vk.com/kobi_kai](https://vk.com/kobi_kai) | Физкультурно-спортивная секция единоборств «Рукопашный бой»: ВКонтакте ↗; Физкультурно-спортивная секция единоборств «ОБЩАЯ ФИЗИЧЕСКАЯ ПОДГОТОВКА»: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.com/zadorinki_spb](https://vk.com/zadorinki_spb) | Хореографическая студия «Раздолье»: ВКонтакте ↗; Хореографическая студия «Задоринки»: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/club57981906](https://vk.ru/club57981906) | ВКонтакте клуба ↗ | [Источник](https://xn----htbqkcfn.xn--p1ai/organizaczii/podrostkovo-molodyozhnyij-klub-%C2%ABmayak%C2%BB/) |
| [vk.com/club199649411](https://vk.com/club199649411) | Спортивный клуб «Атлант»: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.com/public199615820](https://vk.com/public199615820) | Студия декоративно-прикладного творчества «Стиль»: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.com/pmk_mayak_potter](https://vk.com/pmk_mayak_potter) | Студия «Гончарный круг»: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.com/public221376190](https://vk.com/public221376190) | Студия «Притяжение»: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.com/club199493376](https://vk.com/club199493376) | Танцевальная студия «Ритмикс»: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.com/vik_ladoga](https://vk.com/vik_ladoga) | Военно-исторический клуб «Ладога»: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/new.rovesnik](https://vk.ru/new.rovesnik) | ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.com/club226455828](https://vk.com/club226455828) | Фитнес-студия «Импульс»: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.com/battleship_with_kitten](https://vk.com/battleship_with_kitten) | Киноклуб «Броненосец с Котёнком»: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.com/club226431320](https://vk.com/club226431320) | Студия игры на гитаре «Струны»: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.com/kronballet](https://vk.com/kronballet) | Студия перфоманса Паши Канторова: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.com/club227984403](https://vk.com/club227984403) | Студия «ПроАктив»: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.com/club230852262](https://vk.com/club230852262) | Студия силовой подготовки «Территория силы»: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.com/fizium](https://vk.com/fizium) | Студия занимательной науки «ФИЗиУМ»: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/gostyshki](https://vk.ru/gostyshki) | Ансамбль русской песни «Гостьюшки»: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/pmcmolodost](https://vk.ru/pmcmolodost) | ВКонтакте клуба ↗ | [Источник](https://molodost.kurort.gov.spb.ru/) |
| [vk.ru/trio_malina](https://vk.ru/trio_malina) | Ансамбль русской песни «Малина»: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/club185986183](https://vk.ru/club185986183) | Студия «Практическое рисование»: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/public207128649](https://vk.ru/public207128649) | Арт-студия «Творческая мастерская»: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/pmcsniper](https://vk.ru/pmcsniper) | Общее сообщество ↗ | [Источник](https://xn----8sbppmhlfke7c.xn--p1ai/grafik-raboty/94-grafik-raboty-kruzhkov-i-sekcij-s-12102026-god.html) |
| [vk.ru/public216358389](https://vk.ru/public216358389) | Бокс: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/club95558098](https://vk.ru/club95558098) | Добровольцы ПМЦ: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/club222070648](https://vk.ru/club222070648) | Движение первых: ВКонтакте ↗; Клуб «Вдохновение»: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/club220349682](https://vk.ru/club220349682) | Фотография «Лучший кадр»: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/club208321255](https://vk.ru/club208321255) | Молодёжный клуб «Встреча»: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/public203195042](https://vk.ru/public203195042) | ОФП смешанных видов спорта: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/club23234353](https://vk.ru/club23234353) | Спортивный танец и фитнес: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/turlider7](https://vk.ru/turlider7) | Турлидер: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/club84560668](https://vk.ru/club84560668) | Шахматы для всей семьи: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/dckurort](https://vk.ru/dckurort) | Школа добровольцев: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/pmcvoshod](https://vk.ru/pmcvoshod) | Общее сообщество ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/ntennisvoshod](https://vk.ru/ntennisvoshod) | Настольный теннис: ВКонтакте ↗; ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/club64888937](https://vk.ru/club64888937) | Студия «Юный каскадёр»: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/voshodtokareva15](https://vk.ru/voshodtokareva15) | ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/club13102028](https://vk.ru/club13102028) | Фитнес: ВКонтакте ↗; ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/public210767355](https://vk.ru/public210767355) | Девятый лад ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/pmk_morskoy](https://vk.ru/pmk_morskoy) | ВКонтакте клуба ↗; сообщество ВКонтакте | [Источник](https://www.pmcvo.ru/pmkmorskoi.html) |
| [vk.ru/club228196020](https://vk.ru/club228196020) | Английский и немецкий: Разговорный клуб «Как это сказать по-...?» ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/club238186565](https://vk.ru/club238186565) | Японский: Разговорный клуб на японском языке ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/club227665123](https://vk.ru/club227665123) | Сам себе кинолог ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/club222231756](https://vk.ru/club222231756) | Фотостудия «Вспышка» ↗ | Нет совпадения в проверенной выборке |
| [vk.com/mpcmoskovski](https://vk.com/mpcmoskovski) | ВКонтакте учреждения ↗ | [Источник](https://mpc-moskovskij.tumos.gov.spb.ru/clubs/217/) |
| [vk.ru/pmkkometa](https://vk.ru/pmkkometa) | ВКонтакте клуба ↗ | [Источник](https://mpc-moskovskij.tumos.gov.spb.ru/clubs/223/) |
| [vk.ru/klub_kosmonavt](https://vk.ru/klub_kosmonavt) | ВКонтакте клуба ↗ | [Источник](https://mpc-moskovskij.tumos.gov.spb.ru/clubs/224/) |
| [vk.ru/kosmos_pmk](https://vk.ru/kosmos_pmk) | ВКонтакте клуба ↗ | [Источник](https://mpc-moskovskij.tumos.gov.spb.ru/clubs/225/) |
| [vk.ru/pmk_luch](https://vk.ru/pmk_luch) | ВКонтакте клуба ↗ | [Источник](https://mpc-moskovskij.tumos.gov.spb.ru/clubs/226/) |
| [vk.ru/pmkoktiabr](https://vk.ru/pmkoktiabr) | ВКонтакте клуба ↗ | [Источник](https://mpc-moskovskij.tumos.gov.spb.ru/clubs/230/) |
| [vk.com/dmpulkovec](https://vk.com/dmpulkovec) | ВКонтакте учреждения ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/pmkromantiki](https://vk.ru/pmkromantiki) | ВКонтакте клуба ↗ | [Источник](https://mpc-moskovskij.tumos.gov.spb.ru/clubs/231/) |
| [vk.ru/rubin_club](https://vk.ru/rubin_club) | ВКонтакте клуба ↗ | [Источник](https://mpc-moskovskij.tumos.gov.spb.ru/clubs/232/) |
| [vk.ru/club156414892](https://vk.ru/club156414892) | ВКонтакте клуба ↗ | [Источник](https://mpc-moskovskij.tumos.gov.spb.ru/clubs/233/) |
| [vk.ru/club139512151](https://vk.ru/club139512151) | ВКонтакте клуба ↗ | [Источник](https://mpc-moskovskij.tumos.gov.spb.ru/clubs/234/) |
| [vk.ru/vertikal_klub](https://vk.ru/vertikal_klub) | ВКонтакте клуба ↗ | [Источник](https://mpc-moskovskij.tumos.gov.spb.ru/clubs/259/) |
| [vk.ru/pmcvostok](https://vk.ru/pmcvostok) | ВКонтакте клуба ↗ | [Источник](https://mpc-moskovskij.tumos.gov.spb.ru/clubs/221/) |
| [vk.ru/clubpmkunost](https://vk.ru/clubpmkunost) | ВКонтакте клуба ↗ | [Источник](https://mpc-moskovskij.tumos.gov.spb.ru/clubs/235/) |
| [vk.ru/arctic_hall](https://vk.ru/arctic_hall) | ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.com/public218811263](https://vk.com/public218811263) | ВКонтакте клуба ↗ | [Источник](https://centernevskiy.ru/artnevskij/) |
| [vk.ru/atlant_champ](https://vk.ru/atlant_champ) | Сообщество источника ↗; Источник условий ↗ | Нет совпадения в проверенной выборке |
| [vk.com/club24552119](https://vk.com/club24552119) | ВКонтакте клуба ↗ | [Источник](https://centernevskiy.ru/atlant/) |
| [vk.com/club96077723](https://vk.com/club96077723) | ВКонтакте клуба ↗ | [Источник](https://centernevskiy.ru/chajka/) |
| [vk.com/pmkdruzhba](https://vk.com/pmkdruzhba) | ВКонтакте клуба ↗ | [Источник](https://centernevskiy.ru/druzhba/) |
| [vk.com/club50436940](https://vk.com/club50436940) | ВКонтакте клуба ↗ | [Источник](https://centernevskiy.ru/fakel/) |
| [vk.com/spbgorizont](https://vk.com/spbgorizont) | ВКонтакте клуба ↗ | [Источник](https://centernevskiy.ru/gorizont/) |
| [vk.com/public140425651](https://vk.com/public140425651) | ВКонтакте клуба ↗ | [Источник](https://centernevskiy.ru/iskateli/) |
| [vk.com/pmkaravell](https://vk.com/pmkaravell) | ВКонтакте клуба ↗ | [Источник](https://centernevskiy.ru/karavella/) |
| [vk.com/pmk_kosmos](https://vk.com/pmk_kosmos) | ВКонтакте клуба ↗ | [Источник](https://centernevskiy.ru/kosmos/) |
| [vk.com/pc_nevskiy](https://vk.com/pc_nevskiy) | ВКонтакте учреждения ↗ | Нет совпадения в проверенной выборке |
| [vk.com/club42857231](https://vk.com/club42857231) | ВКонтакте клуба ↗ | [Источник](https://centernevskiy.ru/krugozor/) |
| [vk.com/club85211760](https://vk.com/club85211760) | ВКонтакте клуба ↗ | [Источник](https://centernevskiy.ru/leningradec/) |
| [vk.com/club34944303](https://vk.com/club34944303) | ВКонтакте клуба ↗ | [Источник](https://centernevskiy.ru/lider/) |
| [vk.com/pmklu4](https://vk.com/pmklu4) | ВКонтакте клуба ↗ | [Источник](https://centernevskiy.ru/luch/) |
| [vk.com/mechta_club_spb](https://vk.com/mechta_club_spb) | ВКонтакте клуба ↗ | [Источник](https://centernevskiy.ru/mechta/) |
| [vk.com/molodejniycenter](https://vk.com/molodejniycenter) | ВКонтакте клуба ↗ | [Источник](https://centernevskiy.ru/molodjozhnyj-centr/) |
| [vk.com/ourlevel](https://vk.com/ourlevel) | ВКонтакте клуба ↗ | [Источник](https://centernevskiy.ru/nashjetazh/) |
| [vk.com/neva16](https://vk.com/neva16) | ВКонтакте клуба ↗ | [Источник](https://centernevskiy.ru/neva/) |
| [vk.com/club_nevskie78](https://vk.com/club_nevskie78) | ВКонтакте клуба ↗ | [Источник](https://centernevskiy.ru/nevskie-orljata/) |
| [vk.com/ogonekpmk](https://vk.com/ogonekpmk) | ВКонтакте клуба ↗ | [Источник](https://centernevskiy.ru/ogonjok/) |
| [vk.com/pmk_olimpiec](https://vk.com/pmk_olimpiec) | ВКонтакте клуба ↗ | [Источник](https://centernevskiy.ru/olimpiec/) |
| [vk.com/club161376154](https://vk.com/club161376154) | ВКонтакте клуба ↗ | [Источник](https://centernevskiy.ru/optimist/) |
| [vk.com/parallel_club](https://vk.com/parallel_club) | ВКонтакте клуба ↗ | [Источник](https://centernevskiy.ru/parallel/) |
| [vk.com/patriotclubspb](https://vk.com/patriotclubspb) | ВКонтакте клуба ↗ | [Источник](https://centernevskiy.ru/patriot/) |
| [vk.com/public62117342](https://vk.com/public62117342) | ВКонтакте клуба ↗ | [Источник](https://centernevskiy.ru/perspektiva/) |
| [vk.com/pmkpolyrnik](https://vk.com/pmkpolyrnik) | ВКонтакте клуба ↗ | [Источник](https://centernevskiy.ru/poljarnik/) |
| [vk.com/clubpmkprojector](https://vk.com/clubpmkprojector) | ВКонтакте клуба ↗ | [Источник](https://centernevskiy.ru/prozhektor/) |
| [vk.com/club137392949](https://vk.com/club137392949) | ВКонтакте клуба ↗ | [Источник](https://centernevskiy.ru/raketa/) |
| [vk.com/club133553584](https://vk.com/club133553584) | ВКонтакте клуба ↗ | [Источник](https://centernevskiy.ru/sputnik/) |
| [vk.com/clubspb5891223](https://vk.com/clubspb5891223) | ВКонтакте клуба ↗ | [Источник](https://centernevskiy.ru/tovarishh/) |
| [vk.com/clubyoubileyny](https://vk.com/clubyoubileyny) | ВКонтакте клуба ↗ | [Источник](https://centernevskiy.ru/jubilejnyj/) |
| [vk.com/pmk_junost](https://vk.com/pmk_junost) | ВКонтакте клуба ↗ | [Источник](https://centernevskiy.ru/junost/) |
| [vk.com/public94070149](https://vk.com/public94070149) | ВКонтакте клуба ↗ | [Источник](https://centernevskiy.ru/zorkij/) |
| [vk.com/pmkbrig](https://vk.com/pmkbrig) | ВКонтакте клуба ↗ | [Источник](https://guptcyu.peter.gov.spb.ru/molodezhnye-kluby/molodezhnyj-klub-brig/) |
| [vk.com/equator_pmk](https://vk.com/equator_pmk) | ВКонтакте клуба ↗ | [Источник](https://guptcyu.peter.gov.spb.ru/molodezhnye-kluby/molodezhnyj-klub-jekvator/) |
| [vk.com/pmk_gals](https://vk.com/pmk_gals) | ВКонтакте клуба ↗ | [Источник](https://guptcyu.peter.gov.spb.ru/molodezhnye-kluby/molodezhnyj-klub-gals/) |
| [vk.com/molodezm51](https://vk.com/molodezm51) | ВКонтакте клуба ↗ | [Источник](https://guptcyu.peter.gov.spb.ru/molodezhnye-kluby/molodezhnyj-klub-m-51/) |
| [vk.com/club12301866](https://vk.com/club12301866) | ВКонтакте клуба ↗ | [Источник](https://guptcyu.peter.gov.spb.ru/molodezhnye-kluby/molodezhnyj-klub-meridian/) |
| [vk.com/pmcnavigator](https://vk.com/pmcnavigator) | ВКонтакте клуба ↗ | [Источник](https://guptcyu.peter.gov.spb.ru/molodezhnye-kluby/molodjozhnyj-klub-navigator/) |
| [vk.com/pmc_olymp](https://vk.com/pmc_olymp) | ВКонтакте клуба ↗ | [Источник](https://guptcyu.peter.gov.spb.ru/molodezhnye-kluby/molodezhnyj-klub-olimp/) |
| [vk.com/club140799695](https://vk.com/club140799695) | ВКонтакте клуба ↗ | [Источник](https://guptcyu.peter.gov.spb.ru/molodezhnye-kluby/molodezhnyj-klub-strela/) |
| [vk.com/public192373190](https://vk.com/public192373190) | ВКонтакте клуба ↗ | [Источник](https://guptcyu.peter.gov.spb.ru/molodezhnye-kluby/molodezhnyj-klub-tajfun/) |
| [vk.com/pmkunta](https://vk.com/pmkunta) | ВКонтакте клуба ↗ | [Источник](https://guptcyu.peter.gov.spb.ru/molodezhnye-kluby/molodezhnyj-klub-junta/) |
| [vk.ru/digitalalpha](https://vk.ru/digitalalpha) | ВКонтакте клуба ↗ | [Источник](https://pmc-petrogradsky.ru/services/tproduct/108422318831-molodezhnii-klub-alfa) |
| [vk.ru/almaz_gym](https://vk.ru/almaz_gym) | ВКонтакте клуба ↗ | [Источник](https://pmc-petrogradsky.ru/services/tproduct/192665547791-molodezhnii-klub-almaz) |
| [vk.ru/molodezhfootball](https://vk.ru/molodezhfootball) | ВКонтакте клуба ↗ | [Источник](https://pmc-petrogradsky.ru/services/tproduct/514964482201-molodezhnii-klub-antei) |
| [vk.ru/club_chaika_spb](https://vk.ru/club_chaika_spb) | ВКонтакте клуба ↗ | [Источник](https://pmc-petrogradsky.ru/services/tproduct/452883067771-molodezhnii-klub-chaika) |
| [vk.ru/petrvolunteer](https://vk.ru/petrvolunteer) | ВКонтакте клуба ↗ | [Источник](https://pmc-petrogradsky.ru/services/tproduct/681882087821-dobrotsentr-petrogradskogo-raiona) |
| [vk.ru/dobroemesto_dom](https://vk.ru/dobroemesto_dom) | ВКонтакте клуба ↗ | [Источник](https://pmc-petrogradsky.ru/services/tproduct/195557326321-molodezhnoe-prostranstvo-tsentr-dobrosos) |
| [vk.ru/yunarmia_petrograd](https://vk.ru/yunarmia_petrograd) | ВКонтакте клуба ↗ | [Источник](https://pmc-petrogradsky.ru/services/tproduct/576957554301-dom-yunarmii) |
| [vk.ru/eradans](https://vk.ru/eradans) | ВКонтакте клуба ↗ | [Источник](https://pmc-petrogradsky.ru/services/tproduct/959215727961-molodezhnii-klub-era) |
| [vk.ru/estetikaklub](https://vk.ru/estetikaklub) | ВКонтакте клуба ↗ | [Источник](https://pmc-petrogradsky.ru/services/tproduct/133649965181-molodezhnii-klub-estetika) |
| [vk.ru/fandom_mol](https://vk.ru/fandom_mol) | ВКонтакте клуба ↗ | [Источник](https://pmc-petrogradsky.ru/services/tproduct/714653539311-molodezhnii-klub-fandom) |
| [vk.ru/molodezh_mir](https://vk.ru/molodezh_mir) | ВКонтакте клуба ↗ | [Источник](https://pmc-petrogradsky.ru/services/tproduct/198053863141-molodezhnii-klub-mir) |
| [vk.ru/mc_masterskie](https://vk.ru/mc_masterskie) | ВКонтакте клуба ↗ | [Источник](https://pmc-petrogradsky.ru/services/tproduct/313526366941-molodezhnoe-prostranstvo-obschestvennie) |
| [vk.ru/palataremeselmc](https://vk.ru/palataremeselmc) | ВКонтакте клуба ↗ | [Источник](https://pmc-petrogradsky.ru/services/tproduct/229612058721-molodezhnoe-prostranstvo-palata-remesel) |
| [vk.ru/planetartist](https://vk.ru/planetartist) | ВКонтакте клуба ↗ | [Источник](https://pmc-petrogradsky.ru/services/tproduct/127859602511-molodezhnoe-prostranstvo-planeta-art) |
| [vk.com/pmc_petrograd](https://vk.com/pmc_petrograd) | ВКонтакте учреждения ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/centersreda](https://vk.ru/centersreda) | ВКонтакте клуба ↗ | [Источник](https://pmc-petrogradsky.ru/services/tproduct/391550452451-molodezhnoe-prostranstvo-sreda) |
| [vk.ru/mklubstart](https://vk.ru/mklubstart) | ВКонтакте клуба ↗ | [Источник](https://pmc-petrogradsky.ru/services/tproduct/547532947331-molodezhnii-klub-start) |
| [vk.ru/pmpzerkalo](https://vk.ru/pmpzerkalo) | ВКонтакте клуба ↗ | [Источник](https://pmc-petrogradsky.ru/services/tproduct/166552089961-molodezhnoe-prostranstvo-zerkalo) |
| [vk.ru/mk_galaktika](https://vk.ru/mk_galaktika) | ВКонтакте клуба ↗ | [Источник](https://dom-mol.ru/galaktika) |
| [vk.ru/clubritmkaskad](https://vk.ru/clubritmkaskad) | ВКонтакте клуба ↗ | [Источник](https://dom-mol.ru/ritm) |
| [vk.com/dommolspb](https://vk.com/dommolspb) | ВКонтакте учреждения ↗ | [Источник](https://dom-mol.ru/bogatirsky) |
| [vk.ru/dommolidea](https://vk.ru/dommolidea) | ВКонтакте клуба ↗; Источник условий ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/bogatirsky](https://vk.ru/bogatirsky) | ВКонтакте клуба ↗ | [Источник](https://dom-mol.ru/bogatirsky) |
| [vk.ru/neva_dm_prim](https://vk.ru/neva_dm_prim) | ВКонтакте клуба ↗; Источник условий ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/prostranstvo_razvitie](https://vk.ru/prostranstvo_razvitie) | ВКонтакте клуба ↗ | [Источник](https://dom-mol.ru/prostranstvo_razvitie) |
| [vk.ru/public202657713](https://vk.ru/public202657713) | ВКонтакте клуба ↗; Источник условий ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/mkyunost](https://vk.ru/mkyunost) | ВКонтакте клуба ↗ | [Источник](https://dom-mol.ru/yunost) |
| [vk.ru/pmkyupiter](https://vk.ru/pmkyupiter) | ВКонтакте клуба ↗; Источник условий ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/zaozeryeclubspb](https://vk.ru/zaozeryeclubspb) | ВКонтакте клуба ↗ | [Источник](https://dom-mol.ru/zaozerye) |
| [vk.com/rpz_pushkinez](https://vk.com/rpz_pushkinez) | ВКонтакте учреждения ↗ | [Источник](https://gurptcp.pushkin.gov.spb.ru/podrostkovo-molodezhnye-kluby/pmk-antej/) |
| [vk.ru/bjj_antey](https://vk.ru/bjj_antey) | Сообщество источника ↗; ВКонтакте клуба ↗ | Текущий адрес прислан пользователем |
| [vk.ru/public87016438](https://vk.ru/public87016438) | ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.com/pushkindm](https://vk.com/pushkindm) | ВКонтакте учреждения ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/pmk_istok](https://vk.ru/pmk_istok) | ВКонтакте клуба ↗ | [Источник](https://gurptcp.pushkin.gov.spb.ru/podrostkovo-molodezhnye-kluby/pmk-istok/) |
| [vk.ru/club128522434](https://vk.ru/club128522434) | ВКонтакте клуба ↗; Сообщество источника ↗ | [Источник](https://gurptcp.pushkin.gov.spb.ru/podrostkovo-molodezhnye-kluby/pmk-olimp/) |
| [vk.ru/pavlovchanin_club](https://vk.ru/pavlovchanin_club) | Сообщество источника ↗; ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/club195962703](https://vk.ru/club195962703) | Сообщество источника ↗; ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/pmk_rostok](https://vk.ru/pmk_rostok) | Сообщество источника ↗; ВКонтакте клуба ↗ | [Источник](https://gurptcp.pushkin.gov.spb.ru/podrostkovo-molodezhnye-kluby/pmk-rostok/) |
| [vk.ru/club48387830](https://vk.ru/club48387830) | ВКонтакте клуба ↗ | [Источник](https://gurptcp.pushkin.gov.spb.ru/podrostkovo-molodezhnye-kluby/pmk-shushary/) |
| [vk.ru/club206530956](https://vk.ru/club206530956) | ВКонтакте клуба ↗; Сообщество источника ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/club183174783](https://vk.ru/club183174783) | ВКонтакте клуба ↗; Сообщество источника ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/club141403682](https://vk.ru/club141403682) | Сообщество источника ↗; ВКонтакте клуба ↗ | [Источник](https://gurptcp.pushkin.gov.spb.ru/podrostkovo-molodezhnye-kluby/pmk-zareche/) |
| [vk.com/pmkatlant](https://vk.com/pmkatlant) | ВКонтакте клуба ↗ | [Источник](https://perspektiva-klab.ru/clubs/atlant/) |
| [vk.com/pmkatlet](https://vk.com/pmkatlet) | ВКонтакте клуба ↗ | [Источник](https://perspektiva-klab.ru/clubs/atlet/) |
| [vk.com/pmkbars](https://vk.com/pmkbars) | ВКонтакте клуба ↗ | [Источник](https://perspektiva-klab.ru/clubs/bars/) |
| [vk.com/opmk_perspektiva](https://vk.com/opmk_perspektiva) | ВКонтакте учреждения ↗ | [Источник](https://perspektiva-klab.ru/clubs/atlant/) |
| [vk.com/pmk_feniks](https://vk.com/pmk_feniks) | ВКонтакте клуба ↗ | [Источник](https://perspektiva-klab.ru/clubs/feniks/) |
| [vk.com/pmkgorizont](https://vk.com/pmkgorizont) | ВКонтакте клуба ↗ | [Источник](https://perspektiva-klab.ru/clubs/gorizont/) |
| [vk.com/club86897953](https://vk.com/club86897953) | ВКонтакте клуба ↗ | [Источник](https://perspektiva-klab.ru/clubs/leningradec/) |
| [vk.com/pmkluch](https://vk.com/pmkluch) | ВКонтакте клуба ↗ | [Источник](https://perspektiva-klab.ru/clubs/luch/) |
| [vk.com/pmkmaksimum](https://vk.com/pmkmaksimum) | ВКонтакте клуба ↗ | [Источник](https://perspektiva-klab.ru/clubs/maksimum/) |
| [vk.com/pmk.maiak](https://vk.com/pmk.maiak) | ВКонтакте клуба ↗ | [Источник](https://perspektiva-klab.ru/clubs/mayak/) |
| [vk.com/club17069840](https://vk.com/club17069840) | ВКонтакте клуба ↗ | [Источник](https://perspektiva-klab.ru/clubs/na-furshtarskoj/) |
| [vk.com/na_kolomenskoy5](https://vk.com/na_kolomenskoy5) | ВКонтакте клуба ↗ | [Источник](https://perspektiva-klab.ru/clubs/na-kolomenskoj/) |
| [vk.com/pmknatroitskoy](https://vk.com/pmknatroitskoy) | ВКонтакте клуба ↗ | [Источник](https://perspektiva-klab.ru/clubs/na-troiczkoj/) |
| [vk.com/neva_pmk](https://vk.com/neva_pmk) | ВКонтакте клуба ↗ | [Источник](https://perspektiva-klab.ru/clubs/neva/) |
| [vk.com/pmkogonek1](https://vk.com/pmkogonek1) | ВКонтакте клуба ↗ | [Источник](https://perspektiva-klab.ru/clubs/ogonek/) |
| [vk.com/pmkostrova](https://vk.com/pmkostrova) | ВКонтакте клуба ↗ | [Источник](https://perspektiva-klab.ru/clubs/ostrova/) |
| [vk.com/pmkprometey](https://vk.com/pmkprometey) | ВКонтакте клуба ↗ | [Источник](https://perspektiva-klab.ru/clubs/prometej/) |
| [vk.com/romantikipmk](https://vk.com/romantikipmk) | ВКонтакте клуба ↗ | [Источник](https://perspektiva-klab.ru/clubs/romantiki/) |
| [vk.com/inforazvedka](https://vk.com/inforazvedka) | ВКонтакте клуба ↗ | [Источник](https://perspektiva-klab.ru/clubs/rovesnik/) |
| [vk.com/yamskayasloboda](https://vk.com/yamskayasloboda) | ВКонтакте клуба ↗ | [Источник](https://perspektiva-klab.ru/clubs/yamskaya-sloboda/) |
| [vk.com/pmkyouth](https://vk.com/pmkyouth) | ВКонтакте клуба ↗ | [Источник](https://perspektiva-klab.ru/clubs/yunost/) |
| [vk.ru/pmcavrora](https://vk.ru/pmcavrora) | ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/belyi_medved_vo](https://vk.ru/belyi_medved_vo) | ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/clubchayka](https://vk.ru/clubchayka) | ВКонтакте клуба ↗ | [Источник](https://www.pmcvo.ru/pmkchayka.html) |
| [vk.ru/club182895843](https://vk.ru/club182895843) | ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/ellada_vo](https://vk.ru/ellada_vo) | ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/fakelvo](https://vk.ru/fakelvo) | ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/fonarikclub](https://vk.ru/fonarikclub) | ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/kam_4at_ka](https://vk.ru/kam_4at_ka) | ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/club30704573](https://vk.ru/club30704573) | ВКонтакте клуба ↗ | [Источник](https://www.pmcvo.ru/pmkleningradec.html) |
| [vk.ru/mcolympics](https://vk.ru/mcolympics) | ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/club17271635](https://vk.ru/club17271635) | ВКонтакте клуба ↗ | [Источник](https://www.pmcvo.ru/pmk-molniya.html) |
| [vk.ru/clubnadezhdavo](https://vk.ru/clubnadezhdavo) | ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/club224598525](https://vk.ru/club224598525) | ДАРТС И ТОЧКА: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/club227876357](https://vk.ru/club227876357) | Звонкая струна: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/otvagaclubvo](https://vk.ru/otvagaclubvo) | ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/club195516119](https://vk.ru/club195516119) | ВКонтакте клуба ↗; Общее сообщество ↗ | Нет совпадения в проверенной выборке |
| [vk.com/publicvvo](https://vk.com/publicvvo) | ВКонтакте клуба ↗ | [Источник](https://www.pmcvo.ru/pmkpressclub.html) |
| [vk.ru/gravity_vo](https://vk.ru/gravity_vo) | ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/protonclub](https://vk.ru/protonclub) | ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/club222305889](https://vk.ru/club222305889) | Камерный открытый театр «Кот»: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/club228348392](https://vk.ru/club228348392) | ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/club227051367](https://vk.ru/club227051367) | ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/club236513027](https://vk.ru/club236513027) | Ворон: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/salutvo](https://vk.ru/salutvo) | ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/club236192607](https://vk.ru/club236192607) | Отогрелись: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/club231411996](https://vk.ru/club231411996) | ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/chessvo](https://vk.ru/chessvo) | ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/clubshturmvo](https://vk.ru/clubshturmvo) | ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/otryad_sova](https://vk.ru/otryad_sova) | ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/conceptdance](https://vk.ru/conceptdance) | Concept: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/club12646245](https://vk.ru/club12646245) | ВКонтакте клуба ↗ | [Источник](https://www.pmcvo.ru/pmksparta.html) |
| [vk.ru/glowdancee](https://vk.ru/glowdancee) | Glow: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/moderndancecom](https://vk.ru/moderndancecom) | MDC: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/pmc_vo](https://vk.ru/pmc_vo) | ВКонтакте учреждения ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/club215682842](https://vk.ru/club215682842) | ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/infinitycheer](https://vk.ru/infinitycheer) | Спортивно-танцевальная школа-студия INFINITY: ВКонтакте ↗; INFINITY: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/vitanavospb](https://vk.ru/vitanavospb) | ВКонтакте клуба ↗ | [Источник](https://www.pmcvo.ru/pmkvitana.html) |
| [vk.ru/vitanafif](https://vk.ru/vitanafif) | Студия фитнеса ПМК «Витана»: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/club76150332](https://vk.ru/club76150332) | Танцевальная студия «Аллегро»: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/yunostclubvo](https://vk.ru/yunostclubvo) | ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/club6767389](https://vk.ru/club6767389) | LAUDA: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/pmkyoupiter](https://vk.ru/pmkyoupiter) | ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/club215526957](https://vk.ru/club215526957) | VoxBox: ВКонтакте ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/dm_forpost](https://vk.ru/dm_forpost) | Общее сообщество ↗; ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/pmk_leader](https://vk.ru/pmk_leader) | ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/mirpatriot](https://vk.ru/mirpatriot) | ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/mklub461](https://vk.ru/mklub461) | ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/mk_perspektiva](https://vk.ru/mk_perspektiva) | ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.com/ritm_pmc_mir](https://vk.com/ritm_pmc_mir) | ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.ru/pmk_centerclub](https://vk.ru/pmk_centerclub) | ВКонтакте клуба ↗ | Нет совпадения в проверенной выборке |
| [vk.com/pmk_vega](https://vk.com/pmk_vega) | ВКонтакте клуба ↗ | [Источник](https://pmcohta.ru/vega) |
| [vk.com/pmcmir](https://vk.com/pmcmir) | Сообщество учреждения ↗; ВКонтакте ↗ | [Источник](https://xn----ptbkbv6a.xn--p1ai/centralny147) |
| [vk.com/tsentr_admiralteisky](https://vk.com/tsentr_admiralteisky) | ВКонтакте ↗ | [Источник](https://admiralteisky.admiral.gov.spb.ru/molodezhnye-kluby-centra/565/) |
| [vk.com/dmrecord](https://vk.com/dmrecord) | ВКонтакте ↗ | [Источник](https://www.gov.spb.ru/gov/terr/reg_admiral/podvedomstvennye-uchrezhdeniya/podrostkovye-kluby/) |
| [vk.com/dm_forpost](https://vk.com/dm_forpost) | ВКонтакте ↗ | Нет совпадения в проверенной выборке |

## Проверки и границы

Локальная сборка/check, сохранность остальных 17 каталогов, прежних прототипов и расписаний проверяются в [итоговом свидетельстве](../outputs/S-82-R1/verification.json). Первичные пакеты S-81 и исходная заметка сохранены; новое уточнение добавлено отдельно, видимо в генерируемой базе. Git-этап, SSH и публикация не запускались. Следующий шаг: ручная проверка прямой доступности оставшихся адресов в обычном пользовательском браузере либо сверка контактов у представителей после наполнения; прочие алиасы без доказательств не заменялись.
