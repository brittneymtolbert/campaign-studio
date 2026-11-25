# Architecture

Campaign Studio is a static web page: three JavaScript files, one stylesheet, and two HTML entry points. There is no server code and no build step.

## Pieces

| File | Role |
| --- | --- |
| `js/data.js` | Synthetic data: the 12-person cohort, example briefs, goals, audiences, tones, and the default agent playbook. Exposed as `window.CS_DATA`. |
| `js/logic.js` | Pure functions with no page access, exposed as `window.CSLogic`: demo drafting (`offlineKit`), the review checklist (`reviewChecks`), copy kept (`keptShare`), stage rules (`recordApproval`), team and cohort stats, nudge rules (`nudges`), the live AI prompts (`kitPrompt`, `briefPrompt`), and the reply check (`validKit`). |
| `js/app.js` | Builds the page, reads the form, renders the kit, pulse, nudges, playbook, brief, and tour, and decides between live and demo mode. |
| `index.html` | Public entry point. Always demo mode. |
| `live.html` | Entry point used when the studio is published as a Claude artifact inside claude.ai, where live AI mode is available. |

Keeping logic separate from the page means the rules can be tested on their own (`tests/`) and reused if the studio moved into another tool.

## How information moves

```
Brief form ──► readForm() ──► validate()
                                 │
          ┌──────────────────────┴──────────────────────┐
     live AI mode                                   demo mode
 kitPrompt(brief, playbook)                  offlineKit(brief, playbook)
 └► Claude (sample.json)                     └► templates + reviewChecks()
 └► validKit()? ── no ──► offlineKit() fallback
 └► reviewChecks() added by the page
          └──────────────────────┬──────────────────────┘
                                 ▼
                     Campaign kit (editable copy)
                                 │  Approve
                                 ▼
          keptShare(draft, approved copy) ──► recordApproval(marketer)
                                 │
                                 ▼
             stats() · teamAdoption() · nudges() ──► Adoption pulse + Suggested nudges
                                 │
                                 ▼
          offlineBrief() or briefPrompt() ──► Friday leadership brief
```

## Live AI mode

When the page runs inside claude.ai, `window.claude.use("sample")` returns a function that sends a prompt to Claude using the viewer's own claude.ai session. The page asks for structured JSON (`sample.json`) for kits and streams plain text (`sample` with `onText`) for the brief. No API key is involved, and nothing is sent anywhere else. On any other host, `window.claude` does not exist and the page stays in demo mode.

## Human-in-the-loop safeguards

- Nothing is "done" until a marketer approves it, and every piece of copy is editable first.
- The review checklist is added by `reviewChecks()` for every kit, live or demo, so safeguards never depend on the AI including them: proof-point sourcing, avoid-list words, subject-line length, and goal-specific checks.
- Live replies are checked by `validKit()`; incomplete replies fall back to demo drafting, and the kit header says which source was used.
- The live prompt tells the model never to invent numbers beyond the proof point.

## Nudge rules

| Kind | Rule | Behavioral lever |
| --- | --- | --- |
| Get started | Not started and no activity for 10+ days | Social proof and a low-effort first step: pair with a champion from the same team |
| Coach | First win, then 7+ days without use | Turn one win into a habit |
| Fix the playbook | 2+ kits and under 50% average copy kept | Fix the instructions, not the person |
| Champion | Workflow changed with 6+ kits | Peer modeling: invite to demo |
| Recognize | Champion stage | Reinforce the behavior publicly |

The list shows the most pressing nudge of each kind first, then fills by priority, up to six.

## State

All state lives in memory for the visit. Saved playbooks are also written to the viewer's own `localStorage` (wrapped in try/catch, so the page works when storage is blocked). Reloading the page resets the simulated cohort.

## Scaling and production considerations

Not built, but these are the changes a production version would need:

- **Data:** replace `js/data.js` with a read from real usage logs, aggregated so individual metrics are visible only to the right people.
- **AI access:** a small server-side function that holds the API key, applies per-user rate limits and a monthly spending cap, and logs prompts and replies for review.
- **Privacy:** keep customer data out of prompts by default; document what is sent to the model.
- **Reliability:** keep the demo-mode fallback as a safe default when the model is unavailable.
- **Integration:** deliver nudges and briefs through Slack or email; store team playbooks centrally with version history.
