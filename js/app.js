/*
 * Campaign Studio: page behavior.
 * Renders the static layout, wires up the form, kit, adoption pulse, nudges, agent playbook, brief, and guided tour.
 * Live mode: when the page runs inside claude.ai with the "sample" capability, Claude drafts kits and briefs.
 * Demo mode: everywhere else, kits and briefs come from the templates in logic.js. The page always works in demo mode.
 */
(function () {
  "use strict";
  var D = window.CS_DATA, L = window.CSLogic;
  var REPO_URL = "https://github.com/brittneymtolbert/campaign-studio";
  var STORE_KEY = "campaign-studio:playbook:v1";

  var LAYOUT =
    '<a class="skip" href="#new-campaign">Skip to the demo</a>' +
    '<div class="wrap">' +
    '<header class="intro" id="intro">' +
      '<div class="eyebrow">Independent portfolio project · Interactive prototype · Simulated data</div>' +
      '<h1>Campaign Studio</h1>' +
      '<p class="lead">A prototype of how a marketing team could adopt AI, from the first draft to a team habit. A marketer describes a launch and gets a full campaign kit to edit and approve. The studio then tracks adoption, measures how much of each AI draft people keep, and recommends who to coach, pair, or celebrate next.</p>' +
      '<div class="pillars">' +
        '<div class="pillar"><span class="k">Strategist</span><b>Pick the right workflow</b><p>Launch campaigns need a brief, audience angles, and copy for every channel, often written from scratch each time. That makes them a high-value place to start.</p></div>' +
        '<div class="pillar"><span class="k">Builder</span><b>Build the agent</b><p>One short brief in, a multi-channel kit out, with a human review checklist and approval step built in. Marketers can read and edit the instructions the AI follows.</p></div>' +
        '<div class="pillar"><span class="k">Transformationist</span><b>Make it stick</b><p>Usage moves each person along an adoption journey. Edits reveal where the drafts miss. Nudges and a weekly brief turn the data into coaching.</p></div>' +
      '</div>' +
      '<div class="meta">' +
        '<span class="pill" id="mode" title=""><span class="dot"></span><span id="modeText">Checking for live AI…</span></span>' +
        '<button class="ghost" id="tourStart" type="button">Take the 90-second tour</button>' +
        '<span>Built by Brittney Tolbert</span>' +
      '</div>' +
      '<p class="disclose" id="modeExplain"></p>' +
    '</header>' +

    '<div class="main">' +
      '<div class="col">' +
        '<section class="panel" id="new-campaign" aria-labelledby="h-new">' +
          '<div class="panel-head"><h2 id="h-new">New campaign</h2><span class="sub">Fill in the launch, get a kit</span></div>' +
          '<form class="panel-body" id="briefForm" novalidate>' +
            '<div class="chips" id="presets"><span>Try an example:</span></div>' +
            '<div class="form">' +
              '<div class="field"><label for="asker">Running as</label><select id="asker"></select></div>' +
              '<div class="field"><label for="goal">Goal</label><select id="goal"></select></div>' +
              '<div class="field"><label for="feature">What\'s launching</label><input type="text" id="feature" maxlength="80" required></div>' +
              '<div class="field"><label for="audience">Audience</label><select id="audience"></select></div>' +
              '<div class="field full"><label for="benefit">What it does (start with a verb)</label><input type="text" id="benefit" maxlength="160" required></div>' +
              '<div class="field full"><label for="proof">Proof point (optional)</label><input type="text" id="proof" maxlength="120"></div>' +
              '<fieldset class="field full checks" id="channels"><legend class="legend">Channels</legend>' +
                '<label><input type="checkbox" id="ch-email" value="email"> Email</label>' +
                '<label><input type="checkbox" id="ch-linkedin" value="linkedin"> LinkedIn</label>' +
                '<label><input type="checkbox" id="ch-landing" value="landing"> Landing page</label>' +
                '<label><input type="checkbox" id="ch-sales" value="sales"> Sales talking points</label>' +
              '</fieldset>' +
              '<div class="field"><label for="tone">Tone</label><select id="tone"></select></div>' +
              '<div class="field"><label for="templatePick">Agent playbook</label><select id="templatePick"></select></div>' +
            '</div>' +
            '<p class="error" id="formError" role="alert" hidden></p>' +
            '<div class="actions">' +
              '<button class="primary" id="go" type="submit">Draft campaign kit</button>' +
              '<p class="note">Edit anything in the kit before you approve it. Your edits show the team what the agent gets right.</p>' +
            '</div>' +
          '</form>' +
        '</section>' +
        '<section class="panel" id="kitPanel" aria-labelledby="h-kit">' +
          '<div class="panel-head"><h2 id="h-kit">Campaign kit</h2><span class="sub" id="kitSub" aria-live="polite">Example kit</span></div>' +
          '<div class="panel-body" id="kit"></div>' +
        '</section>' +
      '</div>' +
      '<div class="col">' +
        '<section class="panel" id="pulse" aria-labelledby="h-pulse">' +
          '<div class="panel-head"><h2 id="h-pulse">Adoption pulse</h2><span class="sub">12 fictional marketers · 4 teams</span></div>' +
          '<div class="panel-body">' +
            '<div class="stats" id="stats"></div>' +
            '<div class="teams" id="teams"></div>' +
            '<div class="roster"><table id="roster"></table></div>' +
          '</div>' +
        '</section>' +
        '<section class="panel" id="nudgePanel" aria-labelledby="h-nudge">' +
          '<div class="panel-head"><h2 id="h-nudge">Suggested nudges</h2><span class="sub">From this week\'s usage</span></div>' +
          '<div class="panel-body" id="nudges"></div>' +
        '</section>' +
      '</div>' +
    '</div>' +

    '<div class="lower">' +
      '<section class="panel" id="playbook" aria-labelledby="h-play">' +
        '<div class="panel-head"><h2 id="h-play">Agent playbook</h2><span class="sub">See and shape what the AI is told</span></div>' +
        '<div class="panel-body">' +
          '<ol class="steps">' +
            '<li>Your brief and the playbook below become one set of instructions for the AI.</li>' +
            '<li>The AI drafts the kit. The studio adds a human review checklist on its own, so safeguards never depend on the AI.</li>' +
            '<li>You edit and approve. How much you kept tells the team where the playbook needs work.</li>' +
          '</ol>' +
          '<div class="field"><label for="pbVoice">Voice guide</label><textarea id="pbVoice" rows="3"></textarea></div>' +
          '<div class="field"><label for="pbAvoid">Words to avoid (comma separated)</label><input type="text" id="pbAvoid"></div>' +
          '<div class="field"><label for="pbExamples">Examples of copy we like (one per line)</label><textarea id="pbExamples" rows="3"></textarea></div>' +
          '<div class="actions">' +
            '<label for="pbName" class="legend">Save as</label>' +
            '<input type="text" id="pbName" maxlength="40" style="max-width:220px">' +
            '<button class="ghost" id="pbSave" type="button">Save to team library</button>' +
            '<span class="toast" id="pbToast" aria-live="polite"></span>' +
          '</div>' +
          '<div><div class="k-label">Team library</div><div class="templates" id="pbList"></div></div>' +
          '<p class="note" id="pbModeNote"></p>' +
          '<details><summary>See the exact instructions the AI receives</summary><pre id="pbPrompt"></pre></details>' +
        '</div>' +
      '</section>' +
      '<section class="panel" id="briefPanel" aria-labelledby="h-brief">' +
        '<div class="panel-head"><h2 id="h-brief">Friday leadership brief</h2><button class="ghost" id="brief" type="button">Write this week\'s brief</button></div>' +
        '<div class="panel-body">' +
          '<div class="summary" id="summary" aria-live="polite">Press "Write this week\'s brief" for a summary for the VP of Marketing: adoption, how useful the drafts are, who needs support, and what to do next week.</div>' +
        '</div>' +
      '</section>' +
    '</div>' +

    '<footer>' +
      '<p><b>Independent portfolio project by Brittney Tolbert.</b> Not affiliated with, commissioned by, or endorsed by any company. Larkspur and every person, team, and number shown are fictional.</p>' +
      '<p>In a real deployment, adoption data would come from actual usage logs and the studio would sit inside the tools marketers already use. Those integrations are not built here. <a href="' + REPO_URL + '" target="_blank" rel="noopener">Source code and documentation</a>.</p>' +
    '</footer>' +
    '</div>' +
    '<div class="tour" id="tour" role="dialog" aria-labelledby="tourTitle" hidden>' +
      '<div class="row"><span class="count" id="tourCount"></span><button class="ghost" id="tourClose" type="button">Close tour</button></div>' +
      '<h2 id="tourTitle"></h2><p id="tourText"></p>' +
      '<div class="row"><button class="ghost" id="tourBack" type="button">Back</button><button class="primary" id="tourNext" type="button">Next</button></div>' +
    '</div>';

  // ---------- state ----------
  var cohort = D.COHORT.map(function (p) { return Object.assign({}, p); });
  var sample = null, live = false, busy = false, briefBusy = false;
  var original = [], approved = false, queued = {}, lastEdits = [];
  var library = [Object.assign({ id: "house", builtIn: true }, D.DEFAULT_INSTRUCTIONS)];
  var activeId = "house";

  var $ = function (id) { return document.getElementById(id); };
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function byId(id) { for (var i = 0; i < cohort.length; i++) if (cohort[i].id === id) return cohort[i]; return null; }
  function reduced() { return window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches; }
  function scrollTo(node) { node.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" }); }

  function loadLibrary() {
    try {
      var saved = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
      if (saved && Array.isArray(saved.library)) {
        saved.library.forEach(function (t) { if (t && t.id && t.id !== "house" && typeof t.voice === "string") library.push(t); });
        if (saved.activeId && library.some(function (t) { return t.id === saved.activeId; })) activeId = saved.activeId;
      }
    } catch (e) { /* storage unavailable: library stays in memory for this visit */ }
  }
  function saveLibrary() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ activeId: activeId, library: library.filter(function (t) { return !t.builtIn; }) })); } catch (e) { /* ignore */ }
  }
  function activeTemplate() { for (var i = 0; i < library.length; i++) if (library[i].id === activeId) return library[i]; return library[0]; }
  function instructions() { return { voice: $("pbVoice").value.trim(), avoid: $("pbAvoid").value.trim(), examples: $("pbExamples").value.trim() }; }

  // ---------- form ----------
  function readForm() {
    var ch = ["email", "linkedin", "landing", "sales"].filter(function (k) { return $("ch-" + k).checked; });
    return { asker: $("asker").value, goal: $("goal").value, audience: $("audience").value, tone: $("tone").value,
      feature: $("feature").value.trim(), benefit: $("benefit").value.trim().replace(/\.$/, ""),
      proof: $("proof").value.trim().replace(/\.$/, ""), channels: ch };
  }
  function validate(f) {
    if (!f.feature) return { field: "feature", msg: "Add what's launching." };
    if (!f.benefit) return { field: "benefit", msg: "Add what it does, starting with a verb." };
    if (!f.channels.length) return { field: "ch-email", msg: "Pick at least one channel." };
    return null;
  }
  function fillForm(p) {
    $("asker").value = p.asker; $("goal").value = p.goal; $("audience").value = p.audience; $("tone").value = p.tone;
    $("feature").value = p.feature; $("benefit").value = p.benefit; $("proof").value = p.proof;
    ["email", "linkedin", "landing", "sales"].forEach(function (k) { $("ch-" + k).checked = p.ch.indexOf(k) !== -1; });
    $("formError").hidden = true; updatePrompt();
  }

  // ---------- kit ----------
  function countText(a, ta, span) {
    var v = ta.value, c = (a.channel || "").toLowerCase();
    if (c === "email" && /subject/i.test(a.label || "")) {
      var sc = L.subjectCheck(v);
      span.textContent = sc.lengths.join(" · ") + " chars" + (sc.over ? " · over 50 may be cut off in the inbox" : " · fits the inbox preview");
      span.classList.toggle("over", sc.over);
    } else if (c === "linkedin") {
      span.textContent = v.length + " / 700 chars"; span.classList.toggle("over", v.length > 700);
    } else { span.textContent = v.length + " chars"; span.classList.remove("over"); }
  }

  function renderKit(k, f, secs, example, source) {
    original = []; approved = false;
    var root = $("kit"); root.textContent = "";
    var who = byId(f.asker);
    $("kitSub").textContent = example ? "Example kit · demo template" : "Drafted for " + L.first(who) + " in " + secs + " sec · " + source;
    var top = el("div", "kit-top");
    top.appendChild(el("div", "k-label", "Campaign"));
    top.appendChild(el("div", "kit-name", k.campaign_name));
    top.appendChild(el("div", "kit-msg", k.core_message || ""));
    [["Insight: ", k.insight], ["Objective: ", k.objective]].forEach(function (x) {
      var p = el("p", "kit-insight"); p.appendChild(el("b", "", x[0])); p.appendChild(document.createTextNode(x[1] || "")); top.appendChild(p);
    });
    root.appendChild(top);

    root.appendChild(el("div", "k-label", "Audience angles"));
    var segs = el("div", "segs");
    (k.segments || []).slice(0, 3).forEach(function (s) {
      var d = el("div", "seg"); d.appendChild(el("b", "", s.name)); d.appendChild(el("p", "", s.pain)); d.appendChild(el("p", "angle", s.angle)); segs.appendChild(d);
    });
    root.appendChild(segs);

    root.appendChild(el("div", "k-label", "Channel copy · edit before approving"));
    var as = el("div", "assets");
    k.assets.forEach(function (a, i) {
      var box = el("div", "asset"), head = el("div", "asset-head");
      var lab = el("label"); lab.htmlFor = "asset-" + i;
      lab.appendChild(el("span", "badge", a.channel)); lab.appendChild(document.createTextNode(" " + (a.label || "")));
      var cnt = el("span", "count");
      head.appendChild(lab); head.appendChild(cnt);
      var ta = el("textarea"); ta.id = "asset-" + i; ta.value = a.content;
      ta.rows = Math.min(9, Math.max(3, a.content.split("\n").length + 1));
      original.push(a.content);
      ta.addEventListener("input", function () { countText(a, ta, cnt); });
      countText(a, ta, cnt);
      box.appendChild(head); box.appendChild(ta); as.appendChild(box);
    });
    root.appendChild(as);

    var two = el("div", "two");
    var m = el("div"); m.appendChild(el("div", "k-label", "How we'll know it worked"));
    var ml = el("ul", "plain"); (k.metrics || []).forEach(function (x) { ml.appendChild(el("li", "", x)); }); m.appendChild(ml);
    var c = el("div"); c.appendChild(el("div", "k-label", "Check before it ships"));
    var cl = el("ul", "plain flags"); (k.checks || []).forEach(function (x) { cl.appendChild(el("li", "", x)); }); c.appendChild(cl);
    two.appendChild(m); two.appendChild(c); root.appendChild(two);

    var tip = el("div", "tip"); tip.id = "editTip"; tip.hidden = true; root.appendChild(tip);

    var foot = el("div", "kit-foot");
    var toast = el("span", "toast"); toast.id = "toast"; toast.setAttribute("aria-live", "polite");
    var btns = el("div", "actions");
    var regen = el("button", "ghost", "Redraft"); regen.type = "button"; regen.onclick = function () { draft(); };
    var ok = el("button", "primary", "Approve kit"); ok.type = "button"; ok.id = "approve"; ok.onclick = approve;
    btns.appendChild(regen); btns.appendChild(ok);
    foot.appendChild(toast); foot.appendChild(btns); root.appendChild(foot);
  }

  function currentEdits() { return original.map(function (_, i) { return $("asset-" + i).value; }); }

  function approve() {
    if (approved) return;
    var f = readForm(), p = byId(f.asker), edited = currentEdits(), share = L.keptShare(original, edited);
    approved = true; $("approve").disabled = true;
    var r = L.recordApproval(p, share);
    $("toast").textContent = "Approved for " + L.first(p) + ". " + share + "% of the AI copy kept" + (r.moved ? ". Moved to " + D.STAGES[r.stage] + "." : ".");
    lastEdits = edited.filter(function (t, i) { return t.trim() && t !== original[i]; });
    var tip = $("editTip"); tip.textContent = "";
    if (share < 70 && lastEdits.length) {
      tip.appendChild(el("p", "", "You rewrote a lot of this draft. Save your edited lines as examples so the next draft sounds more like your team."));
      var b = el("button", "ghost", "Add my edits to the playbook examples"); b.type = "button";
      b.onclick = function () {
        var lines = [];
        lastEdits.forEach(function (t) { t.split("\n").forEach(function (l) { l = l.trim(); if (l.length > 20 && lines.length < 3) lines.push(l); }); });
        var ex = $("pbExamples"); ex.value = (ex.value.trim() ? ex.value.trim() + "\n" : "") + lines.join("\n");
        updatePrompt(); b.disabled = true; b.textContent = "Added to the playbook examples";
      };
      tip.appendChild(b); tip.hidden = false;
    } else { tip.hidden = true; }
    renderPulse(p.id);
  }

  function draft(evt) {
    if (evt) evt.preventDefault();
    if (busy) return;
    var f = readForm(), err = validate(f);
    if (err) { $("formError").textContent = err.msg; $("formError").hidden = false; $(err.field).focus(); return; }
    $("formError").hidden = true;
    var instr = instructions();
    busy = true; $("go").disabled = true; var t0 = Date.now();
    $("kitSub").textContent = live ? "Drafting with Claude…" : "Drafting from templates…";
    var done = function (k, source) {
      var secs = ((Date.now() - t0) / 1000).toFixed(1);
      renderKit(k, f, secs, false, source); busy = false; $("go").disabled = false; scrollTo($("kitPanel"));
    };
    if (!live) { setTimeout(function () { done(L.offlineKit(f, D, instr), "demo template"); }, 600); return; }
    sample.json(L.kitPrompt(f, D, instr), { cache: false })
      .then(function (k) {
        if (!L.validKit(k)) { done(L.offlineKit(f, D, instr), "demo template (live reply was incomplete)"); return; }
        k.checks = L.reviewChecks(k, f, instr, Array.isArray(k.checks) ? k.checks.filter(function (c) { return typeof c === "string"; }) : []);
        k.metrics = Array.isArray(k.metrics) ? k.metrics.filter(function (x) { return typeof x === "string"; }) : [];
        done(k, "live AI");
      })
      .catch(function (e) {
        var code = e && e.code;
        if (code === "not_granted" || code === "not_declared" || code === "capability_disabled" || code === "sampling_disabled") setMode(false);
        done(L.offlineKit(f, D, instr), code === "rate_limited" ? "demo template (live AI is busy, try again shortly)" : "demo template (live AI unavailable)");
      });
  }

  // ---------- pulse + nudges ----------
  function renderPulse(movedId) {
    var s = L.stats(cohort);
    var st = $("stats"); st.textContent = "";
    [[s.weekly + " of " + s.total, "use it weekly or more"], [s.kits, "kits approved"], [s.keptAvg + "%", "of AI copy kept after edits"], [s.notStarted, "haven't started"]]
      .forEach(function (x) { var d = el("div", "stat" + (movedId ? " flash" : "")); d.appendChild(el("b", "", String(x[0]))); d.appendChild(el("span", "", x[1])); st.appendChild(d); });

    var tm = $("teams"); tm.textContent = "";
    tm.appendChild(el("div", "k-label", "Weekly use by team"));
    L.teamAdoption(cohort, D.TEAMS).forEach(function (t) {
      var row = el("div", "team"); row.appendChild(el("span", "", t.team));
      var tr = el("div", "track"); tr.setAttribute("role", "img"); tr.setAttribute("aria-label", t.team + ": " + t.pct + "% use it weekly");
      var fl = el("div", "fill"); fl.style.width = t.pct + "%"; tr.appendChild(fl); row.appendChild(tr);
      row.appendChild(el("em", "", t.pct + "%")); tm.appendChild(row);
    });

    var tb = $("roster"); tb.textContent = "";
    var cap = el("caption", "k-label", "Marketers by adoption stage"); tb.appendChild(cap);
    var hr = el("tr"); [["Marketer", ""], ["Stage", ""], ["Kits", "num"], ["Kept", "num"], ["Last used", "num"]].forEach(function (h) { var th = el("th", h[1], h[0]); th.scope = "col"; hr.appendChild(th); });
    var thead = el("thead"); thead.appendChild(hr); tb.appendChild(thead);
    var tbody = el("tbody");
    cohort.slice().sort(function (a, b) { return b.stage - a.stage || b.kits - a.kits; }).forEach(function (c) {
      var r = el("tr", c.id === movedId ? "flash" : "");
      var n = el("td", "", c.name); n.title = c.team; r.appendChild(n);
      var sc = el("td"); sc.appendChild(el("span", "stage s" + c.stage, D.STAGES[c.stage])); r.appendChild(sc);
      r.appendChild(el("td", "num", String(c.kits)));
      var k = L.keptAverage(c); r.appendChild(el("td", "num" + (k !== null && k < 50 ? " low" : ""), k === null ? "–" : k + "%"));
      r.appendChild(el("td", "num", c.kits ? (c.last === 0 ? "today" : c.last + "d ago") : "never"));
      tbody.appendChild(r);
    });
    tb.appendChild(tbody);
    renderNudges();
  }

  var KIND = { start: "Get started", coach: "Coach", voice: "Fix the playbook", champion: "Champion", recognize: "Recognize" };
  function renderNudges() {
    var box = $("nudges"); box.textContent = "";
    var list = L.nudges(cohort, 6);
    if (!list.length) { box.appendChild(el("p", "note", "No nudges this week. Everyone is moving.")); return; }
    list.forEach(function (n) {
      var d = el("div", "nudge " + n.kind);
      d.appendChild(el("span", "kind", KIND[n.kind]));
      d.appendChild(el("p", "", n.text));
      var row = el("div", "row"); row.appendChild(el("small", "", n.action));
      var b = el("button", "ghost", queued[n.id] ? "Queued for Monday" : "Queue nudge"); b.type = "button"; b.disabled = !!queued[n.id];
      b.onclick = function () { queued[n.id] = true; b.textContent = "Queued for Monday"; b.disabled = true; };
      row.appendChild(b); d.appendChild(row); box.appendChild(d);
    });
  }

  // ---------- playbook ----------
  function renderLibrary() {
    var list = $("pbList"); list.textContent = "";
    library.forEach(function (t) {
      var b = el("button", "chip", t.name); b.type = "button"; b.setAttribute("aria-pressed", String(t.id === activeId));
      b.onclick = function () { applyTemplate(t.id); };
      list.appendChild(b);
    });
    var pick = $("templatePick"); pick.textContent = "";
    library.forEach(function (t) { var o = el("option", "", t.name); o.value = t.id; pick.appendChild(o); });
    pick.value = activeId;
  }
  function applyTemplate(id) {
    activeId = id; var t = activeTemplate();
    $("pbVoice").value = t.voice; $("pbAvoid").value = t.avoid; $("pbExamples").value = t.examples; $("pbName").value = t.builtIn ? "" : t.name;
    renderLibrary(); updatePrompt(); saveLibrary();
  }
  function savePlaybook() {
    var name = $("pbName").value.trim() || (L.first(byId($("asker").value)) + "'s playbook");
    var i = instructions(), existing = null;
    library.forEach(function (t) { if (!t.builtIn && t.name.toLowerCase() === name.toLowerCase()) existing = t; });
    if (existing) { existing.voice = i.voice; existing.avoid = i.avoid; existing.examples = i.examples; activeId = existing.id; }
    else { var t = { id: "t" + Date.now(), name: name, voice: i.voice, avoid: i.avoid, examples: i.examples }; library.push(t); activeId = t.id; }
    $("pbName").value = name; renderLibrary(); saveLibrary();
    $("pbToast").textContent = "Saved \"" + name + "\" to the team library in this browser.";
  }
  function updatePrompt() {
    var f = readForm();
    if (!f.feature) f.feature = "(what's launching)";
    if (!f.benefit) f.benefit = "(what it does)";
    if (!f.channels.length) f.channels = ["email"];
    $("pbPrompt").textContent = L.kitPrompt(f, D, instructions());
  }

  // ---------- brief ----------
  function brief() {
    if (briefBusy) return;
    var out = $("summary"), btn = $("brief"), n = Object.keys(queued).length;
    if (!live) { out.textContent = L.offlineBrief(cohort, D, n); return; }
    briefBusy = true; btn.disabled = true; out.textContent = "Writing with Claude…";
    sample(L.briefPrompt(cohort, D, n), { cache: false, onText: function (u) { out.textContent = u.text; } })
      .then(function (r) { out.textContent = r.text; })
      .catch(function (e) { out.textContent = L.offlineBrief(cohort, D, n); if (e && e.code === "not_granted") setMode(false); })
      .then(function () { briefBusy = false; btn.disabled = false; });
  }

  // ---------- mode ----------
  function setMode(on) {
    live = on;
    $("mode").classList.toggle("live", on);
    $("modeText").textContent = on ? "Live AI mode" : "Demo mode";
    $("modeExplain").textContent = "";
    var b = el("b", "", on ? "Live AI mode: " : "Demo mode: ");
    $("modeExplain").appendChild(b);
    $("modeExplain").appendChild(document.createTextNode(on
      ? "Claude writes each campaign kit and the leadership brief from your inputs. The people, teams, and usage numbers are still simulated."
      : "Kits and briefs come from built-in templates, so no AI runs on this page. Every control works. Live AI mode, where Claude writes the copy, runs when the studio is opened inside claude.ai. The people, teams, and usage numbers are simulated."));
    $("pbModeNote").textContent = on ? "Live AI mode: the voice guide, avoid list, and examples are sent with every draft."
      : "Demo mode: templates don't read your voice guide or examples, but the avoid list is checked on every kit. In live AI mode, all three are sent to Claude.";
  }

  // ---------- guided tour ----------
  var TOUR = [
    { target: "intro", title: "Why this exists", text: "Campaign Studio is a working prototype of how a marketing team could adopt AI. It shows three jobs in one place: picking the right workflow, building the agent, and making it stick." },
    { target: "new-campaign", title: "1. Describe the launch", text: "A marketer fills in a short brief. Try an example chip, or type your own launch, then press Draft campaign kit." },
    { target: "kitPanel", title: "2. Edit and approve", text: "The kit has a campaign name, audience angles, copy sized for each channel, success metrics, and a review checklist. Edit anything, then approve. The studio measures how much of the AI's copy you kept." },
    { target: "pulse", title: "3. Watch adoption", text: "Each approval updates the adoption pulse: weekly use by team and each marketer's stage, from Not started to Champion. Approve a kit and watch the numbers move." },
    { target: "nudgePanel", title: "4. Act on it", text: "Usage signals become specific nudges: pair someone who hasn't started with a champion, coach someone who stalled, fix the playbook where people rewrite a lot, and recognize champions." },
    { target: "playbook", title: "5. Teach people to build", text: "Marketers can read and edit the instructions the AI follows, save versions to a team library, and see the exact prompt. This is how users become builders." },
    { target: "briefPanel", title: "6. Brief leadership", text: "One click writes the Friday brief for the VP of Marketing: adoption, how useful the drafts are, who needs support, and next week's focus." }
  ];
  var tourAt = -1, lastFocus = null;
  function showStep(i) {
    document.querySelectorAll(".tour-target").forEach(function (n) { n.classList.remove("tour-target"); });
    tourAt = i; var s = TOUR[i], t = $(s.target);
    t.classList.add("tour-target"); scrollTo(t);
    $("tourCount").textContent = "Step " + (i + 1) + " of " + TOUR.length;
    $("tourTitle").textContent = s.title; $("tourText").textContent = s.text;
    $("tourBack").disabled = i === 0;
    $("tourNext").textContent = i === TOUR.length - 1 ? "Finish" : "Next";
    $("tour").hidden = false; $("tourNext").focus();
  }
  function endTour() {
    document.querySelectorAll(".tour-target").forEach(function (n) { n.classList.remove("tour-target"); });
    $("tour").hidden = true; tourAt = -1; if (lastFocus) lastFocus.focus();
  }

  // ---------- init ----------
  function init() {
    var mount = document.getElementById("app");
    mount.innerHTML = LAYOUT;
    cohort.forEach(function (c) { var o = el("option", "", c.name + " · " + c.team); o.value = c.id; $("asker").appendChild(o); });
    Object.keys(D.GOALS).forEach(function (k) { var o = el("option", "", D.GOALS[k].label); o.value = k; $("goal").appendChild(o); });
    Object.keys(D.AUDIENCES).forEach(function (k) { var o = el("option", "", D.AUDIENCES[k].label); o.value = k; $("audience").appendChild(o); });
    Object.keys(D.TONES).forEach(function (k) { var o = el("option", "", D.TONES[k]); o.value = k; $("tone").appendChild(o); });
    D.PRESETS.forEach(function (p, i) {
      var b = el("button", "chip", p.label); b.type = "button"; b.setAttribute("aria-pressed", String(i === 0));
      b.onclick = function () { fillForm(p); document.querySelectorAll("#presets .chip").forEach(function (x) { x.setAttribute("aria-pressed", "false"); }); b.setAttribute("aria-pressed", "true"); };
      $("presets").appendChild(b);
    });
    fillForm(D.PRESETS[0]);
    loadLibrary(); applyTemplate(activeId);

    $("briefForm").addEventListener("submit", draft);
    $("briefForm").addEventListener("input", updatePrompt);
    $("briefForm").addEventListener("change", updatePrompt);
    ["pbVoice", "pbAvoid", "pbExamples"].forEach(function (id) { $(id).addEventListener("input", updatePrompt); });
    $("templatePick").addEventListener("change", function () { applyTemplate($("templatePick").value); });
    $("pbSave").onclick = savePlaybook;
    $("brief").onclick = brief;
    $("tourStart").onclick = function () { lastFocus = document.activeElement; showStep(0); };
    $("tourNext").onclick = function () { if (tourAt >= TOUR.length - 1) endTour(); else showStep(tourAt + 1); };
    $("tourBack").onclick = function () { if (tourAt > 0) showStep(tourAt - 1); };
    $("tourClose").onclick = endTour;
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && tourAt >= 0) endTour(); });

    renderKit(L.offlineKit(readForm(), D, instructions()), readForm(), 0, true, "demo template");
    renderPulse();
    setMode(false);
    if (window.claude && typeof window.claude.use === "function") {
      $("modeText").textContent = "Checking for live AI…";
      window.claude.use("sample").then(function (s) { sample = s; setMode(!!s); }).catch(function () { setMode(false); });
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
