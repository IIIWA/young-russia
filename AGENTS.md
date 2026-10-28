# Project rules

## Project management and task dispatch

- This is the controlling project chat unless the user's launch message explicitly assigns an executor role. The controlling chat plans work, reviews evidence, accepts results, and keeps the site register current.
- Read `PLANS.md` for the roadmap, `TASKS.md` for the dispatch queue, and the matching brief in `docs/tasks/`. `YoungRussiaOBS/СТАТУС-САЙТА-И-ЗАДАЧИ.md` remains the single register of site results; do not create a competing completion history.
- Planning does not authorize execution. Create executor chats, send work assignments, or start the next task only after the user's explicit launch instruction for that task. Do not start background automations or subagents as part of planning.
- An executor works only within the launched brief. Completing one task does not launch its successor. Read-only monitoring and review may continue within an already launched task; sending a new assignment or correction requires the user's authorization covering that message.
- Record the actual chat ID, launch instruction, file scope, dependencies, evidence, and acceptance result in the dispatch queue. Suggested role names do not mean that chats have been created.
- Use one writer per shared file set. Parallel execution requires non-overlapping write scopes; a separate worktree for an executor chat requires the user's explicit request. Until the current uncommitted batch is reviewed, use the existing checkout sequentially.
- Keep task dispatch, source changes, local commits, GitHub push, and deployment as distinct recorded actions. A task launch authorizes only the actions named in that brief. Before every new SSH session, ask and wait for fresh confirmation that the user is currently on the server; do not request passwords or private keys in chat.
- Use existing skills and tools first. New skills, MCP servers, plugins, paid API requests, and account permission changes require a concrete task and user authorization; they are not part of adopting this management workflow.

## Site task register

- At the start of every task concerning the Young Russia website, read `YoungRussiaOBS/СТАТУС-САЙТА-И-ЗАДАЧИ.md` before changing files. It is the central register of completed, current, and future site work.
- After a site task changes status, update that register with the result, next step, date, and evidence. Keep strategic task statuses in `YoungRussiaOBS/ЗАДАЧИ-YOUNG-RUSSIA-90-ДНЕЙ.md` consistent where they overlap.
- Distinguish local files, committed Git state, GitHub, and the live site. Recheck time-sensitive counts and external state; do not infer deployment from a local build or a checked box.

## Prototype and production workflow

- For Saint Petersburg only, new district pages using the established district template and their club detail pages go directly into production in `dist/`. Do not create or update a prototype for them unless the user explicitly requests one. This exception covers the current root-level `districts/<slug>.html` and `clubs/<district>/<slug>.html` routes.
- When work begins on another city, first create and review prototypes for its city, district, and club pages. Build their production versions only after the user approves the prototypes; keep matching saved prototype routes.
- Keep all previously reviewed prototype pages as saved snapshots; do not delete them or silently replace them when updating production.
- For other page types, keep a saved prototype at the same relative route under `prototype/site/`. Agree on a new page structure with the user before building its production version.
- Every district page must have a recognizable landmark or architectural image in its hero. Do not display a generated-image caption on the page. Record image provenance in project files and do not describe generated images as real photographs. Label any visible placeholders accurately.
- Before changing an existing district hero, save the previous production version and any existing prototype version in a dated backup so the earlier variant can be restored.
- Run `npm run check` after building. It verifies local links and prototype counterparts for page types that still require them.
- Do not describe the prototype as an official resource. Keep personal authorship out of site copy, except the creator's VK and Telegram contacts explicitly requested by the user for the shared footer on 23.10.2026.
- Use Yandex Maps for every map displayed on site pages, including club pages and prototypes. Keep data provenance and required attribution for coordinates separately from the map provider.
- On every page, make all links in map marker popups visually distinct from plain text: use blue text (#1d4ed8) and an underline, including visited links. Keep this styling explicit in popup markup so map-provider styles cannot make links look like ordinary text. For language-club selections, show the foreign languages available at that club in the marker popup; derive them from catalog data and state when the language list needs clarification.
- On club detail pages, place the address immediately above the map and do not display phone numbers. Keep phone data in the internal catalog for verification.
- Show email addresses themselves as plain text, separately after contact buttons. Never turn them into buttons, mailto links, or a generic "Написать организатору" action.
- Split generic catalog schedules into tables with days in rows and at most two groups in columns on every screen size. Place time and room on separate lines, with the room below the time at the bottom of the colored slot. Keep cells spacious and prefer wrapping between words. Preserve the previously approved custom schedules such as the language schedule at «Морской».
- Present activity schedules as accessible colored HTML tables with clear day, time, and group headers. Use days in columns when the table fits. If a horizontal table does not fit on a narrow screen, place days in rows and groups in columns so the schedule remains readable without horizontal scrolling. Keep confirmed start times or full intervals exactly as provided; do not invent end times. Colors may vary by activity. Do not substitute gray information cards for a schedule. Keep each activity's schedule on its activity page, not on the parent club card, unless the user explicitly requests otherwise.

## Local preview reliability

- Do not give a `127.0.0.1` preview URL as working merely because a command printed it. Verify that the server is still running after the command returns and that the page opens in the user's browser.
- Tool-launched background Node processes may disappear when the command ends; an occupied port may also be held by an unresponsive process. Do not reuse an occupied port or assume a detached process will persist.
- For this static build, prefer opening the generated `dist/...html` file directly with `file:///` or a clickable absolute file link when a persistent server cannot be verified. Relative CSS, image and script paths must be checked first.
- If an HTTP preview is needed, run `npm run preview` in a persistent terminal, keep that terminal open, and verify the exact URL in the intended browser before sharing it. Recheck access in later turns instead of repeating a stale URL.
