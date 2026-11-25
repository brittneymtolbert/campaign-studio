# Campaign Studio

**An interactive prototype of how a marketing team could adopt AI, from the first draft to a team habit.**

Campaign Studio is an independent portfolio project by Brittney Tolbert. It is not an official product of any company, not a commissioned engagement, and not an enterprise production deployment. Larkspur, its products, and every person, team, and number in the app are fictional.

## The problem

Most AI rollouts stall at adoption, not at the build. A team gets access to a capable tool, a few people use it, and nobody can say whether it is changing how work gets done. A useful AI workflow has to do three things at once:

1. **Solve a real, recurring task.** Launch campaigns are a good candidate: each one needs a brief, audience angles, and copy for several channels, often written from scratch.
2. **Keep people in control.** Marketers need to edit, approve, and trust what goes out under the brand's name.
3. **Show whether it is working.** Leaders need to see who is using it, whether the drafts are useful, and where people need help.

## Who it is for

- **Marketers** who want a strong first draft of a campaign in minutes, in their team's voice.
- **A transformation or enablement lead** who has to drive adoption across a marketing team and coach people from first try to self-sufficiency.
- **A marketing leader** who wants a weekly, plain-language view of progress.

## What it does

| Area | What happens |
| --- | --- |
| **Campaign drafting** | A marketer fills in a short brief: what's launching, what it does, a proof point, the goal (trials, upgrades, or event registrations), audience, channels, and tone. The studio returns a campaign kit: name, core message, audience insight, three audience segments with pain points and message angles, ready-to-edit copy (email subject lines and opening, LinkedIn post, landing page hero, sales talking points), success metrics, and a review checklist. |
| **Human review** | Every piece of copy is editable. Subject lines show their length against a 50-character inbox limit; the LinkedIn post shows its length. The review checklist always asks for a source for any proof point, flags words on the team's avoid list, and adds goal-specific checks (for example, excluding customers with open support escalations). |
| **Copy kept** | When a marketer approves a kit, the studio compares the approved copy with the AI draft and records what share of the draft's words were kept. This is a signal of how useful the draft was and how much human refinement it needed. It is not a measure of accuracy, quality, or campaign performance. |
| **Adoption pulse** | Each approval updates a simulated cohort of 12 marketers on 4 teams: weekly use, kits approved, average copy kept, weekly use by team, and each person's stage on a five-stage journey (Not started, First win, Weekly use, Workflow changed, Champion). |
| **Suggested nudges** | Usage signals become specific, behavior-based interventions: pair someone who hasn't started with a champion, coach someone who stalled after a first win, fix the playbook where people rewrite most of the copy, invite a strong user to demo, and recognize champions. Each nudge can be queued. |
| **Agent playbook** | Marketers can read and edit the instructions the AI follows (voice guide, words to avoid, examples of copy they like), save versions to a team library, and see the exact prompt sent to the AI. After a heavily edited approval, the studio offers to add the marketer's own lines to the examples. |
| **Friday leadership brief** | One click writes a short brief for a VP of Marketing: adoption, how useful the drafts are, who needs support, and next week's focus. |
| **Guided tour** | A seven-step, roughly 90-second tour explains the studio without a walkthrough from its author. |

## Live AI mode and demo mode

The page shows which mode it is in.

- **Live AI mode** runs when the studio is opened inside claude.ai as a Claude artifact with the `sample` capability. Claude writes each kit and the leadership brief from the marketer's inputs and the team's playbook. If a reply is incomplete or the AI is unavailable, the page falls back to demo drafting and says so.
- **Demo mode** runs everywhere else, including the public GitHub Pages site. Kits and briefs come from built-in templates in `js/logic.js`; no AI runs on the page. Every control still works. Demo templates do not read the voice guide or examples, but the avoid list is checked on every kit.

The cohort, teams, and starting usage numbers are simulated in both modes.

## Behavioral design principles

- **Lower the cost of a first win.** A filled-in example and a one-click draft make the first try nearly effortless.
- **Keep people in control.** Editing and approval come before anything is "done," and safeguards are added by the page, not left to the AI.
- **Treat edits as feedback, not failure.** Low copy-kept rates point to the playbook, not the person.
- **Use social proof and peer modeling.** Pair newcomers with champions; invite strong users to demo.
- **Reinforce the habit.** Recognize champions; coach people who stall after a first win.
- **Make progress visible.** Stages and a weekly brief show movement beyond "has access" or "finished training."

## Adoption measurement framework

| Measure | How it is calculated |
| --- | --- |
| Copy kept (per kit) | Share of the draft's words still present in the approved copy, matched one-for-one, ignoring word order. |
| Average copy kept | Total of each kit's copy-kept share divided by kits approved. |
| Weekly use | Marketers at the Weekly use stage or beyond. |
| Stage changes | First approval: First win. 3+ kits: Weekly use. 6+ kits with 70%+ average copy kept: Workflow changed. Champion is a human decision and is never set automatically. |

Full rules are documented in code comments in `js/logic.js` and covered by tests.

## Technology

- Plain HTML, CSS, and JavaScript. No framework, no build step, no runtime dependencies.
- Fonts from Google Fonts (Archivo, Figtree, IBM Plex Mono), with system fallbacks.
- Live AI mode uses the claude.ai artifact runtime (`window.claude.use("sample")`). No API key exists anywhere in this project.
- Hosting: GitHub Pages (static files).
- Built by Brittney Tolbert with Claude Code (AI-assisted development).

## Project structure

```
index.html            Public entry point (demo mode on GitHub Pages)
live.html             Entry point for live AI mode inside claude.ai
css/styles.css        Styles, light and dark themes
js/data.js            Synthetic demonstration data (cohort, presets, audiences, default playbook)
js/logic.js           Pure logic: drafting templates, copy kept, stages, nudges, review checks, prompts
js/app.js             Page behavior and rendering
tests/index.html      Test runner (open in a browser)
tests/logic.tests.js  Tests for js/logic.js
docs/ARCHITECTURE.md  How the pieces fit and how data moves
docs/DEPLOYMENT.md    How to run, test, and publish
```

## Run it locally

Serve the folder with any static web server and open `index.html`. For example, with Python: `python -m http.server 8000`, then visit http://localhost:8000. Opening `index.html` directly from disk also works in most browsers.

## Tests

Open `tests/index.html` through the same local server. The page title shows `PASS n/n` or `FAIL n/n`, and each test is listed.

## Privacy and security

- No API keys, credentials, or secrets are used or stored.
- No personal data is collected. Saved playbooks stay in the viewer's own browser (`localStorage`) and never leave it.
- All people and data are fictional. No employer or client information is included.

## Known limitations

- Demo mode drafts from templates, so the copy is less varied than live AI mode.
- The cohort and usage data are simulated; nothing is read from real usage logs.
- The team library is saved only in the viewer's browser, not shared between people.
- Queued nudges are not sent anywhere.

## Possible production path

These are not built. In a real deployment, the studio could:

- Read adoption data from actual usage logs instead of `js/data.js`.
- Call a model through a small server-side function that keeps the API key secret, with rate limits and a spending cap.
- Sit inside tools marketers already use (for example, Slack or the team's marketing platform) and send queued nudges there.
- Store team playbooks centrally, with version history and an owner for each.

## About

Designed and built by Brittney Tolbert as an independent portfolio project. All rights reserved.
