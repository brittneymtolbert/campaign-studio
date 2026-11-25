/*
 * Campaign Studio: synthetic demonstration data.
 * Everything in this file is fictional: Larkspur, its products, its marketers, and their usage numbers.
 * In a real deployment, the cohort would come from actual usage logs instead of this file.
 */
(function (root) {
  var DATA = {
    STAGES: ["Not started", "First win", "Weekly use", "Workflow changed", "Champion"],
    TEAMS: ["Product marketing", "Lifecycle", "Events", "Content"],

    // keptSum = sum of "% of AI copy kept" across every approved kit, so average kept = keptSum / kits.
    // last = days since the marketer last approved a kit.
    COHORT: [
      { id: "ana", name: "Ana Lima", team: "Product marketing", stage: 4, kits: 14, keptSum: 86 * 14, last: 0 },
      { id: "priya", name: "Priya Shah", team: "Product marketing", stage: 2, kits: 4, keptSum: 72 * 4, last: 2 },
      { id: "dana", name: "Dana Ortiz", team: "Content", stage: 3, kits: 9, keptSum: 81 * 9, last: 1 },
      { id: "ravi", name: "Ravi Desai", team: "Content", stage: 2, kits: 4, keptSum: 70 * 4, last: 2 },
      { id: "lee", name: "Lee Park", team: "Content", stage: 1, kits: 1, keptSum: 55, last: 6 },
      { id: "theo", name: "Theo Grant", team: "Lifecycle", stage: 2, kits: 5, keptSum: 46 * 5, last: 3 },
      { id: "sam", name: "Sam Okafor", team: "Lifecycle", stage: 1, kits: 2, keptSum: 41 * 2, last: 4 },
      { id: "elle", name: "Elle Brooks", team: "Lifecycle", stage: 0, kits: 0, keptSum: 0, last: 12 },
      { id: "omar", name: "Omar Haddad", team: "Events", stage: 3, kits: 7, keptSum: 77 * 7, last: 1 },
      { id: "kim", name: "Kim Nguyen", team: "Events", stage: 1, kits: 1, keptSum: 62, last: 9 },
      { id: "marcus", name: "Marcus Bell", team: "Events", stage: 0, kits: 0, keptSum: 0, last: 16 },
      { id: "jo", name: "Jo Rivera", team: "Events", stage: 0, kits: 0, keptSum: 0, last: 21 }
    ],

    PRESETS: [
      { label: "Feature launch", asker: "priya", goal: "trial", audience: "ops", tone: "confident", feature: "Team Routing",
        benefit: "sends every meeting request to the right teammate automatically", proof: "Beta teams booked meetings 32% faster", ch: ["email", "linkedin", "landing"] },
      { label: "Upgrade push", asker: "theo", goal: "upgrade", audience: "starter", tone: "warm", feature: "Smart Reminders",
        benefit: "cuts no-shows by texting clients at the time they're most likely to read it", proof: "Pro customers see 27% fewer no-shows", ch: ["email", "landing", "sales"] },
      { label: "Webinar", asker: "marcus", goal: "event", audience: "smb", tone: "bold", feature: "the Booking Playbook webinar",
        benefit: "shows owners how to fill a calendar without a front desk", proof: "", ch: ["email", "linkedin"] }
    ],

    GOALS: {
      trial: { label: "Drive free trials", cta: "Start your free trial", objective: "Drive free trials from new accounts in the first 30 days.",
        metrics: ["400 trial starts in 30 days", "Landing page conversion of 4% or higher", "Email click rate of 3.5% or higher"] },
      upgrade: { label: "Upgrade existing customers", cta: "See what Pro adds", objective: "Move Starter customers to Pro this quarter.",
        metrics: ["6% of targeted Starter accounts upgrade in 45 days", "In-app banner click rate of 2% or higher", "Fewer than 1% unsubscribes per send"] },
      event: { label: "Fill a live event", cta: "Save your seat", objective: "Fill the live session and turn attendees into trials.",
        metrics: ["600 registrations, 40% live attendance", "15% of attendees start a trial within 7 days", "Replay views equal to 30% of registrations"] }
    },

    AUDIENCES: {
      ops: { label: "Operations leaders at mid-size companies",
        insight: "Operations leaders rarely lose deals to a weak product. They lose them to slow handoffs.",
        segs: [
          { name: "Ops director", pain: "Requests stall between teams and no one owns the handoff.", angle: "Lead with control: every request has an owner from the first click." },
          { name: "Team lead", pain: "Spends the morning chasing who should take which meeting.", angle: "Lead with time back: no more triage in the team channel." },
          { name: "Finance partner", pain: "Sees the cost of delays but not the cause.", angle: "Lead with the numbers: faster bookings mean faster revenue." } ] },
      smb: { label: "Small business owners",
        insight: "Small business owners don't have time to be their own receptionist.",
        segs: [
          { name: "Owner-operator", pain: "Answers booking calls between jobs and loses some.", angle: "Lead with freedom: the calendar fills while you work." },
          { name: "Office manager", pain: "Juggles reschedules by phone and sticky note.", angle: "Lead with calm: fewer calls, fewer mix-ups." },
          { name: "Solo service pro", pain: "Can't afford a front desk, can't afford empty slots.", angle: "Lead with value: front desk results without the payroll." } ] },
      starter: { label: "Customers on the Starter plan",
        insight: "Starter customers already trust us. They just haven't seen what the next plan saves them.",
        segs: [
          { name: "Power user", pain: "Has hit the Starter limits and is working around them.", angle: "Lead with headroom: remove the workaround they already built." },
          { name: "Quiet account", pain: "Logs in less each month and may not renew.", angle: "Lead with a quick win they can feel this week." },
          { name: "Account admin", pain: "Has to justify any new spend.", angle: "Lead with ROI they can forward to their manager." } ] }
    },

    TONES: { confident: "Confident and clear", warm: "Warm and helpful", bold: "Bold and punchy" },

    // The starting "agent playbook": the instructions marketers can read, edit, and save as team templates.
    DEFAULT_INSTRUCTIONS: {
      name: "Larkspur house style",
      voice: "Plain, confident, and specific. Lead with the customer's problem, then the outcome. Short sentences. Use \"you\" more than \"we\". No exclamation points.",
      avoid: "revolutionary, seamless, game-changing, synergy, cutting-edge",
      examples: "Your team shouldn't spend the morning deciding who takes the meeting."
    }
  };
  root.CS_DATA = DATA;
  if (typeof module !== "undefined" && module.exports) module.exports = DATA;
})(typeof window !== "undefined" ? window : globalThis);
