/*
 * Campaign Studio: core logic.
 * Pure functions only (no page access), so they can be tested on their own (see tests/).
 */
(function (root) {
  function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function lower1(s) { return s ? s.charAt(0).toLowerCase() + s.slice(1) : s; }
  function first(p) { return p.name.split(" ")[0]; }

  /** Average share of AI copy a marketer kept across approved kits, or null if no kits yet. */
  function keptAverage(p) { return p.kits ? Math.round(p.keptSum / p.kits) : null; }

  function words(text) { return (String(text || "").toLowerCase().match(/[a-z0-9'’%$]+/g)) || []; }

  /**
   * Share of the AI's words that survive the marketer's edits (0–100).
   * Counts each word of the original draft as kept if the edited text still contains it
   * (each edited word can only be matched once). Word order is ignored on purpose:
   * moving a sentence is not the same as rewriting it.
   * It is a signal of how useful the draft was, not a measure of quality or accuracy.
   */
  function keptShare(originals, edited) {
    var total = 0, kept = 0;
    for (var i = 0; i < originals.length; i++) {
      var a = words(originals[i]), bag = {};
      words(edited[i]).forEach(function (w) { bag[w] = (bag[w] || 0) + 1; });
      a.forEach(function (w) { total++; if (bag[w]) { kept++; bag[w]--; } });
    }
    return total ? Math.round(kept / total * 100) : 100;
  }

  /**
   * Records an approved kit for a marketer and moves them along the adoption journey.
   * Rules: any approval = First win; 3+ kits = Weekly use;
   * 6+ kits with 70%+ copy kept on average = Workflow changed.
   * Champion is never automatic: it is a human call (see nudges).
   * Returns { moved: boolean, stage: number }.
   */
  function recordApproval(p, share) {
    var before = p.stage;
    p.kits += 1; p.keptSum += share; p.last = 0;
    if (p.stage < 1) p.stage = 1;
    if (p.kits >= 3 && p.stage < 2) p.stage = 2;
    if (p.kits >= 6 && keptAverage(p) >= 70 && p.stage < 3) p.stage = 3;
    return { moved: p.stage > before, stage: p.stage };
  }

  function stats(cohort) {
    var kits = 0, keptSum = 0, weekly = 0, notStarted = 0;
    cohort.forEach(function (p) { kits += p.kits; keptSum += p.keptSum; if (p.stage >= 2) weekly++; if (p.stage === 0) notStarted++; });
    return { weekly: weekly, total: cohort.length, kits: kits, keptAvg: kits ? Math.round(keptSum / kits) : 0, notStarted: notStarted };
  }

  /** Share of each team at Weekly use or beyond. */
  function teamAdoption(cohort, teams) {
    return teams.map(function (t) {
      var people = cohort.filter(function (p) { return p.team === t; });
      var n = people.filter(function (p) { return p.stage >= 2; }).length;
      return { team: t, pct: people.length ? Math.round(n / people.length * 100) : 0, size: people.length };
    });
  }

  function championFor(cohort, team) {
    var pool = cohort.filter(function (p) { return p.team === team && p.stage >= 3; });
    if (!pool.length) pool = cohort.filter(function (p) { return p.stage >= 3; });
    return pool.sort(function (a, b) { return b.kits - a.kits; })[0] || null;
  }

  /**
   * Turns usage signals into recommended interventions. Each rule maps to a behavioral lever:
   *  start    – hasn't tried it in 10+ days: social proof and a low-effort first step (pair with a peer)
   *  coach    – got a first win, then stalled 7+ days: help turn one win into a habit
   *  voice    – keeps under 50% of AI copy over 2+ kits: the drafts miss their voice, so fix the instructions, not the person
   *  champion – 6+ kits at Workflow changed: invite them to demo (peer modeling)
   *  recognize – already a champion: public recognition reinforces the behavior
   * The list shows the most pressing nudge of each kind first, then fills by priority.
   */
  function nudges(cohort, max) {
    max = max || 6;
    var out = [];
    cohort.forEach(function (p) {
      var k = keptAverage(p);
      if (p.stage === 0 && p.last >= 10) {
        var ch = championFor(cohort, p.team);
        out.push({ id: "start-" + p.id, kind: "start", pri: p.last, text: first(p) + " (" + p.team + ") hasn't run a kit yet.",
          action: ch ? "Pair with " + first(ch) + " for 15 minutes on a real launch." : "Book a 15-minute session on a real launch." });
      }
      if (p.stage === 1 && p.last >= 7) out.push({ id: "coach-" + p.id, kind: "coach", pri: p.last, text: first(p) + " had a first win but hasn't used it in " + p.last + " days.",
        action: "Book a 20-minute coaching session on the next real launch." });
      if (p.kits >= 2 && k !== null && k < 50) out.push({ id: "voice-" + p.id, kind: "voice", pri: 60 - k, text: first(p) + " keeps only " + k + "% of the AI copy.",
        action: "Collect those edits and add them to the " + p.team + " voice guide." });
      if (p.stage === 3 && p.kits >= 6) out.push({ id: "champ-" + p.id, kind: "champion", pri: p.kits, text: first(p) + " is ready to champion.",
        action: "Invite " + first(p) + " to demo a kit at the next " + p.team + " meeting." });
      if (p.stage === 4) out.push({ id: "recog-" + p.id, kind: "recognize", pri: p.kits, text: "Recognize " + first(p) + ": " + p.kits + " kits, " + k + "% of copy kept.",
        action: "Thank " + first(p) + " in the team channel and ask to share a favorite prompt." });
    });
    out.sort(function (a, b) { return b.pri - a.pri; });
    var picked = [], kinds = {};
    out.forEach(function (n) { if (!kinds[n.kind]) { kinds[n.kind] = 1; picked.push(n); } });
    out.forEach(function (n) { if (picked.indexOf(n) === -1) picked.push(n); });
    return picked.slice(0, max);
  }

  function parseAvoid(list) {
    return String(list || "").split(/[,\n]/).map(function (s) { return s.trim().toLowerCase(); }).filter(Boolean);
  }
  /** Words from the avoid list that appear in the text (whole words or phrases, case-insensitive). */
  function findAvoided(text, avoidList) {
    var t = String(text || "").toLowerCase();
    return parseAvoid(avoidList).filter(function (w) {
      var re = new RegExp("(^|[^a-z0-9])" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "([^a-z0-9]|$)", "i");
      return re.test(t);
    });
  }

  /** Subject-line length check: inboxes often cut subject lines after about 50 characters. */
  function subjectCheck(text) {
    var lens = String(text || "").split("\n").filter(function (s) { return s.trim(); }).map(function (s) { return s.length; });
    return { lengths: lens, over: lens.some(function (n) { return n > 50; }) };
  }

  /** Demo-mode drafting: templates shaped by goal, audience, and tone. No AI is used here. */
  function offlineKit(f, D, instr) {
    var G = D.GOALS[f.goal], A = D.AUDIENCES[f.audience], F = f.feature, Fc = cap(F), B = f.benefit, P = f.proof;
    var name = { trial: "Meet " + F, upgrade: Fc + " is ready for you", event: "Live: " + F }[f.goal];
    var msg = Fc + " " + B + ".";
    var subjects = {
      confident: [Fc + " is here", P ? P : "The handoff fix your team asked for", "Less triage, more booked meetings"],
      warm: ["Something new to make your week easier", P ? P : Fc + " is now on your account", "A quick look at " + F],
      bold: ["Stop losing bookings", P ? P : "30 minutes to a fuller calendar", "Your calendar, without the scramble"]
    }[f.tone];
    var assets = [];
    if (f.channels.indexOf("email") !== -1) {
      assets.push({ channel: "Email", label: "Subject lines (3 to test)", content: subjects.join("\n") });
      assets.push({ channel: "Email", label: "Opening and call to action", content: "Hi {first_name},\n\n" + A.insight + "\n\n" + Fc + " " + B + "." + (P ? " " + P + "." : "") + "\n\n" + G.cta + " →" });
    }
    if (f.channels.indexOf("linkedin") !== -1) {
      assets.push({ channel: "LinkedIn", label: "Company post", content: A.insight + "\n\nThat's why we built " + F + ". It " + B + "." + (P ? "\n\nIn beta, " + lower1(P) + "." : "") + "\n\n" + G.cta + ". Link in the comments." });
    }
    if (f.channels.indexOf("landing") !== -1) {
      assets.push({ channel: "Landing page", label: "Hero", content: name + "\n" + msg + (P ? "\n" + P + "." : "") + "\n[" + G.cta + "]" });
    }
    if (f.channels.indexOf("sales") !== -1) {
      assets.push({ channel: "Sales", label: "Talking points", content: "• Open with the pain: " + lower1(A.segs[0].pain) + "\n• " + Fc + " " + B + "." + (P ? "\n• Proof: " + P + "." : "") + "\n• Ask: \"Where do requests stall for your team today?\"" });
    }
    var kit = { campaign_name: name, core_message: msg, insight: A.insight, objective: G.objective, segments: A.segs, assets: assets, metrics: G.metrics.slice(), checks: [] };
    kit.checks = reviewChecks(kit, f, instr);
    return kit;
  }

  /** Human-review checklist. Added to every kit, live or demo, so the safeguards never depend on the AI. */
  function reviewChecks(kit, f, instr, aiChecks) {
    var checks = [];
    if (f.proof) checks.push("Confirm the source for \"" + f.proof + "\" before anything ships.");
    (aiChecks || []).forEach(function (c) { if (checks.indexOf(c) === -1) checks.push(c); });
    if (f.goal === "upgrade") checks.push("Exclude accounts with an open support escalation.");
    if (f.goal === "event") checks.push("Confirm the session date and speaker before the first send.");
    var all = [kit.campaign_name, kit.core_message].concat(kit.assets.map(function (a) { return a.content; })).join("\n");
    var hits = findAvoided(all, instr && instr.avoid);
    if (hits.length) checks.push("Remove words on your avoid list: " + hits.join(", ") + ".");
    kit.assets.forEach(function (a) { if (/subject/i.test(a.label || "") && subjectCheck(a.content).over) checks.push("Shorten subject lines over 50 characters."); });
    checks.push("Run a final brand voice read before launch.");
    return checks;
  }

  /** The exact instructions sent to Claude in live mode. Shown to marketers in the Agent playbook panel. */
  function kitPrompt(f, D, instr) {
    var G = D.GOALS[f.goal];
    return "You are a senior B2B campaign strategist at Larkspur, a scheduling software company. Draft a campaign kit.\n\n" +
      "LAUNCH: " + f.feature + ", which " + f.benefit + ".\nPROOF POINT: " + (f.proof || "none; do not invent statistics") +
      "\nGOAL: " + G.label + ". Call to action: " + G.cta +
      "\nAUDIENCE: " + D.AUDIENCES[f.audience].label + "\nTONE: " + D.TONES[f.tone] +
      "\nCHANNELS: " + f.channels.join(", ") +
      "\n\nTEAM VOICE GUIDE: " + (instr.voice || "none") +
      "\nNEVER USE THESE WORDS: " + (instr.avoid || "none") +
      "\nEXAMPLES OF COPY WE LIKE: " + (instr.examples || "none") +
      "\n\nRules:\n- Specific, human copy. No hashtags, no emoji.\n- Never invent numbers beyond the proof point.\n" +
      "- Email subject lines under 50 characters. LinkedIn post under 700 characters. Landing hero: headline, subhead, button.\n" +
      "- Exactly 3 segments, each with a concrete pain and a one-line message angle.\n- assets: one or two per requested channel, with channel names Email, LinkedIn, Landing page, Sales.\n" +
      "- checks: what a reviewer must verify before launch (claims, legal, audience exclusions).\n\n" +
      'Reply with only JSON: {"campaign_name": string, "core_message": string, "insight": string, "objective": string, ' +
      '"segments": [{"name": string, "pain": string, "angle": string}], "assets": [{"channel": string, "label": string, "content": string}], ' +
      '"metrics": [string], "checks": [string]}';
  }

  /** Accepts a live AI reply only if it has the shape the page needs; otherwise the page falls back to demo drafting. */
  function validKit(k) {
    return !!(k && typeof k.campaign_name === "string" && Array.isArray(k.segments) && Array.isArray(k.assets) && k.assets.length &&
      k.assets.every(function (a) { return a && typeof a.content === "string" && typeof a.channel === "string"; }));
  }

  function cohortSummary(cohort, D) {
    return cohort.map(function (p) {
      var k = keptAverage(p);
      return p.name + " (" + p.team + "): " + D.STAGES[p.stage] + ", " + p.kits + " kits, " + (k === null ? "no kits yet" : k + "% of AI copy kept") + ", last used " + (p.kits ? p.last + " days ago" : "never");
    }).join("\n");
  }

  function briefPrompt(cohort, D, queuedCount) {
    return "Write a Friday leadership brief about the adoption of Campaign Studio, an AI campaign agent, across a 12-person marketing team. Audience: the VP of Marketing. " +
      "Plain text, no markdown symbols except • bullets. Sections in caps: ADOPTION, QUALITY, NEEDS SUPPORT, NEXT WEEK. Two or three bullets each, specific, using names and numbers from the data. " +
      "Treat '% of AI copy kept' as a signal of how useful the drafts are, not as a measure of accuracy. Under 180 words.\n\nStages in order: " + D.STAGES.join(" > ") +
      "\n\nTEAM DATA:\n" + cohortSummary(cohort, D) + "\n\nNUDGES QUEUED: " + queuedCount;
  }

  /** Demo-mode brief, computed from the current numbers. */
  function offlineBrief(cohort, D, queuedCount) {
    var s = stats(cohort);
    var teams = teamAdoption(cohort, D.TEAMS).sort(function (a, b) { return b.pct - a.pct; });
    var byTeamKept = D.TEAMS.map(function (t) {
      var people = cohort.filter(function (p) { return p.team === t && p.kits; });
      var kits = people.reduce(function (a, p) { return a + p.kits; }, 0);
      return { team: t, kept: kits ? Math.round(people.reduce(function (a, p) { return a + p.keptSum; }, 0) / kits) : null };
    }).filter(function (x) { return x.kept !== null; }).sort(function (a, b) { return a.kept - b.kept; });
    var notStarted = cohort.filter(function (p) { return p.stage === 0; }).map(first);
    var stalled = cohort.filter(function (p) { return p.stage === 1 && p.last >= 7; }).map(first);
    var champs = cohort.filter(function (p) { return p.stage >= 3; }).map(first);
    var low = byTeamKept[0];
    return [
      "ADOPTION",
      "• " + s.weekly + " of " + s.total + " marketers use Campaign Studio weekly or more; " + s.kits + " kits approved to date.",
      "• " + teams[0].team + " leads at " + teams[0].pct + "% weekly use. " + teams[teams.length - 1].team + " trails at " + teams[teams.length - 1].pct + "%.",
      "",
      "QUALITY",
      "• Marketers keep " + s.keptAvg + "% of AI copy after editing.",
      low ? "• " + low.team + " keeps " + low.kept + "%, the lowest of any team. Their edits should feed the voice guide." : "• Not enough kits yet to compare teams.",
      "",
      "NEEDS SUPPORT",
      notStarted.length ? "• Not started: " + notStarted.join(", ") + ". Next step: pair each with a champion on a real launch." : "• Everyone has approved at least one kit.",
      stalled.length ? "• Stalled after a first win: " + stalled.join(", ") + ". Next step: a 20-minute coaching session." : "• No one is stalled after a first win.",
      "• " + queuedCount + (queuedCount === 1 ? " nudge" : " nudges") + " queued for Monday.",
      "",
      "NEXT WEEK",
      champs.length ? "• Ask " + champs.slice(0, 2).join(" and ") + " to demo their launch workflow to " + teams[teams.length - 1].team + "." : "• Identify a first champion.",
      "• Goal: every " + teams[teams.length - 1].team + " marketer approves a first kit."
    ].join("\n");
  }

  var API = { cap: cap, first: first, keptAverage: keptAverage, keptShare: keptShare, recordApproval: recordApproval, stats: stats,
    teamAdoption: teamAdoption, championFor: championFor, nudges: nudges, parseAvoid: parseAvoid, findAvoided: findAvoided,
    subjectCheck: subjectCheck, offlineKit: offlineKit, reviewChecks: reviewChecks, kitPrompt: kitPrompt, validKit: validKit,
    cohortSummary: cohortSummary, briefPrompt: briefPrompt, offlineBrief: offlineBrief };
  root.CSLogic = API;
  if (typeof module !== "undefined" && module.exports) module.exports = API;
})(typeof window !== "undefined" ? window : globalThis);
