# Deployment

## Public site (demo mode): GitHub Pages

The repository is served as a static site by GitHub Pages from the `main` branch, root folder.

1. Push changes to `main`.
2. GitHub Pages rebuilds automatically (usually within a minute or two).
3. The site is available at `https://<github-username>.github.io/campaign-studio/`.

No configuration, environment variables, or secrets are needed. GitHub Pages on a free account requires the repository to be public.

## Live AI mode: claude.ai artifact

Live AI mode runs only inside claude.ai. To publish or update it, publish `live.html` as a Claude artifact with the `sample` capability, and include `css/styles.css`, `js/data.js`, `js/logic.js`, and `js/app.js` as supporting files at the same paths. The artifact is private to its owner unless shared from claude.ai.

## Environment variables

None. The project has no server code and uses no API keys. If a server-side live mode is ever added, the key must live only in the hosting platform's secret settings, never in this repository or in browser code.

## Before every release

1. Open `tests/index.html` through a local server and confirm `PASS`.
2. Check the page at desktop and phone widths, in light and dark mode.
3. Run through: example chips, a custom brief, validation messages, drafting, editing, approving, the playbook tip, saving a playbook, switching playbooks, queueing a nudge, the Friday brief, and the guided tour.
4. After pushing, open the public URL in a signed-out browser window and repeat a short smoke test.
