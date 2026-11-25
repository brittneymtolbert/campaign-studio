/* Campaign Studio: tests for js/logic.js. Open tests/index.html in a browser to run them. */
(function () {
  var D = window.CS_DATA, L = window.CSLogic, results = [];
  function fresh() { return D.COHORT.map(function (p) { return Object.assign({}, p); }); }
  function test(name, fn) {
    try { fn(); results.push({ name: name, ok: true }); }
    catch (e) { results.push({ name: name, ok: false, msg: e.message }); }
  }
  function eq(a, b, msg) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((msg || "") + " expected " + JSON.stringify(b) + ", got " + JSON.stringify(a)); }
  function ok(v, msg) { if (!v) throw new Error(msg || "expected true"); }
  var presetForm = function (p) { return { asker: p.asker, goal: p.goal, audience: p.audience, tone: p.tone, feature: p.feature, benefit: p.benefit, proof: p.proof, channels: p.ch.slice() }; };

  // keptShare
  test("keptShare: unedited draft keeps 100%", function () { eq(L.keptShare(["Meet Team Routing today"], ["Meet Team Routing today"]), 100); });
  test("keptShare: deleted draft keeps 0%", function () { eq(L.keptShare(["Meet Team Routing today"], [""]), 0); });
  test("keptShare: half the words kept", function () { eq(L.keptShare(["one two three four"], ["one two five six"]), 50); });
  test("keptShare: reordering is not penalized", function () { eq(L.keptShare(["alpha beta gamma"], ["gamma alpha beta"]), 100); });
  test("keptShare: repeated words only match once", function () { eq(L.keptShare(["go go go go"], ["go"]), 25); });
  test("keptShare: combines all assets", function () { eq(L.keptShare(["a b", "c d"], ["a b", "x y"]), 50); });
  test("keptShare: no original text counts as 100%", function () { eq(L.keptShare([], []), 100); });

  // recordApproval
  test("recordApproval: first approval is a First win", function () {
    var p = { name: "Test Person", stage: 0, kits: 0, keptSum: 0, last: 12 };
    var r = L.recordApproval(p, 80); eq(r, { moved: true, stage: 1 }); eq([p.kits, p.keptSum, p.last], [1, 80, 0]);
  });
  test("recordApproval: third kit reaches Weekly use", function () {
    var p = { name: "T", stage: 1, kits: 2, keptSum: 120, last: 4 }; eq(L.recordApproval(p, 60).stage, 2);
  });
  test("recordApproval: 6 kits at 70%+ kept reaches Workflow changed", function () {
    var p = { name: "T", stage: 2, kits: 5, keptSum: 375, last: 1 }; eq(L.recordApproval(p, 75).stage, 3);
  });
  test("recordApproval: 6 kits under 70% kept stays at Weekly use", function () {
    var p = { name: "T", stage: 2, kits: 5, keptSum: 230, last: 3 }; eq(L.recordApproval(p, 96), { moved: false, stage: 2 });
  });
  test("recordApproval: never promotes to Champion automatically", function () {
    var p = { name: "T", stage: 3, kits: 30, keptSum: 2700, last: 0 }; eq(L.recordApproval(p, 100).stage, 3);
  });

  // stats and team adoption on the starting data
  test("stats: starting cohort numbers", function () { eq(L.stats(fresh()), { weekly: 6, total: 12, kits: 47, keptAvg: 74, notStarted: 3 }); });
  test("teamAdoption: starting team percentages", function () {
    eq(L.teamAdoption(fresh(), D.TEAMS).map(function (t) { return t.pct; }), [100, 33, 25, 67]);
  });
  test("keptAverage: null before any kit", function () { eq(L.keptAverage({ kits: 0, keptSum: 0 }), null); });

  // nudges
  test("nudges: every kind appears on the starting data", function () {
    var kinds = L.nudges(fresh(), 6).map(function (n) { return n.kind; });
    ["start", "coach", "voice", "champion", "recognize"].forEach(function (k) { ok(kinds.indexOf(k) !== -1, "missing " + k); });
  });
  test("nudges: at most the requested number", function () { ok(L.nudges(fresh(), 3).length === 3); });
  test("nudges: no gendered pronouns in any text", function () {
    L.nudges(fresh(), 50).forEach(function (n) { ok(!/\b(he|she|him|her|his|hers)\b/i.test(n.text + " " + n.action), n.text + " / " + n.action); });
  });
  test("nudges: pairing suggests a champion from the same team when there is one", function () {
    var jo = L.nudges(fresh(), 50).filter(function (n) { return n.id === "start-jo"; })[0];
    ok(jo && /Omar/.test(jo.action), jo && jo.action);
  });
  test("nudges: a voice nudge clears once the average rises to 50%+", function () {
    var c = fresh(); var sam = c.filter(function (p) { return p.id === "sam"; })[0];
    L.recordApproval(sam, 100); // (82 + 100) / 3 = 61%
    ok(!L.nudges(c, 50).some(function (n) { return n.id === "voice-sam"; }));
  });

  // avoid list and subject lines
  test("findAvoided: finds whole words and phrases", function () { eq(L.findAvoided("A seamless, game-changing launch", "seamless, game-changing, synergy"), ["seamless", "game-changing"]); });
  test("findAvoided: ignores partial words", function () { eq(L.findAvoided("It works seamlessly", "seamless"), []); });
  test("findAvoided: empty list finds nothing", function () { eq(L.findAvoided("anything", ""), []); });
  test("subjectCheck: flags lines over 50 characters", function () {
    ok(L.subjectCheck(new Array(52).join("x")).over); ok(!L.subjectCheck("Short line\nAnother").over);
  });

  // demo drafting
  test("offlineKit: every preset drafts the requested channels", function () {
    D.PRESETS.forEach(function (p) {
      var k = L.offlineKit(presetForm(p), D, D.DEFAULT_INSTRUCTIONS), ch = k.assets.map(function (a) { return a.channel; });
      ok(L.validKit(k), p.label + " invalid");
      if (p.ch.indexOf("email") !== -1) ok(ch.indexOf("Email") !== -1, p.label + " email");
      if (p.ch.indexOf("linkedin") !== -1) ok(ch.indexOf("LinkedIn") !== -1, p.label + " linkedin");
      if (p.ch.indexOf("landing") !== -1) ok(ch.indexOf("Landing page") !== -1, p.label + " landing");
      if (p.ch.indexOf("sales") !== -1) ok(ch.indexOf("Sales") !== -1, p.label + " sales");
      eq(k.segments.length, 3, p.label + " segments");
    });
  });
  test("offlineKit: default templates never use words on the default avoid list", function () {
    D.PRESETS.forEach(function (p) {
      var k = L.offlineKit(presetForm(p), D, D.DEFAULT_INSTRUCTIONS);
      ok(!k.checks.some(function (c) { return /avoid list/.test(c); }), p.label);
    });
  });
  test("offlineKit: default subject lines fit in 50 characters", function () {
    D.PRESETS.forEach(function (p) {
      var k = L.offlineKit(presetForm(p), D, D.DEFAULT_INSTRUCTIONS);
      k.assets.forEach(function (a) { if (/subject/i.test(a.label)) ok(!L.subjectCheck(a.content).over, p.label + ": " + a.content); });
    });
  });
  test("offlineKit: flags avoid-list words in the draft", function () {
    var k = L.offlineKit(presetForm(D.PRESETS[0]), D, { avoid: "booked" });
    ok(k.checks.some(function (c) { return /avoid list: booked/.test(c); }));
  });
  test("reviewChecks: proof point always needs a source check", function () {
    var k = L.offlineKit(presetForm(D.PRESETS[0]), D, D.DEFAULT_INSTRUCTIONS);
    ok(/Confirm the source/.test(k.checks[0]));
  });
  test("reviewChecks: safeguards are added to live AI kits too", function () {
    var aiKit = { campaign_name: "X", core_message: "Y", assets: [{ channel: "Email", label: "Subject lines", content: "ok" }] };
    var checks = L.reviewChecks(aiKit, presetForm(D.PRESETS[1]), D.DEFAULT_INSTRUCTIONS, ["AI check"]);
    ok(checks.indexOf("AI check") !== -1); ok(checks.some(function (c) { return /support escalation/.test(c); })); ok(/Confirm the source/.test(checks[0]));
  });

  // live-mode contract
  test("kitPrompt: carries the playbook and forbids invented numbers", function () {
    var f = presetForm(D.PRESETS[2]); var p = L.kitPrompt(f, D, { voice: "VOICE-X", avoid: "AVOID-Y", examples: "EX-Z" });
    ok(/VOICE-X/.test(p) && /AVOID-Y/.test(p) && /EX-Z/.test(p)); ok(/do not invent statistics/.test(p)); ok(/Reply with only JSON/.test(p));
  });
  test("validKit: rejects incomplete replies", function () {
    ok(!L.validKit(null)); ok(!L.validKit({ campaign_name: "x", segments: [], assets: [] }));
    ok(!L.validKit({ campaign_name: "x", segments: [], assets: [{ channel: "Email" }] }));
    ok(L.validKit({ campaign_name: "x", segments: [], assets: [{ channel: "Email", content: "hi" }] }));
  });

  // brief
  test("offlineBrief: reflects the current numbers", function () {
    var b = L.offlineBrief(fresh(), D, 2);
    ok(/6 of 12 marketers/.test(b)); ok(/47 kits/.test(b)); ok(/74% of AI copy/.test(b)); ok(/2 nudges queued/.test(b));
    ["ADOPTION", "QUALITY", "NEEDS SUPPORT", "NEXT WEEK"].forEach(function (s) { ok(b.indexOf(s) !== -1, s); });
  });
  test("offlineBrief: singular nudge wording", function () { ok(/1 nudge queued/.test(L.offlineBrief(fresh(), D, 1))); });

  // report
  var pass = results.filter(function (r) { return r.ok; }).length;
  document.title = (pass === results.length ? "PASS " : "FAIL ") + pass + "/" + results.length;
  var out = document.getElementById("results");
  var h = document.createElement("h1"); h.textContent = document.title; out.appendChild(h);
  results.forEach(function (r) {
    var li = document.createElement("li"); li.textContent = (r.ok ? "✓ " : "✗ ") + r.name + (r.ok ? "" : " — " + r.msg);
    li.style.color = r.ok ? "#1f7a3a" : "#b00020"; out.appendChild(li);
  });
  window.TEST_RESULTS = results;
})();
