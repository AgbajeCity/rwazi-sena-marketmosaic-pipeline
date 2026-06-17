// ─────────────────────────────────────────────────────────────────────────────
// Sena Launch Readiness — the single source of truth.
//
// This module encodes the launch-gate framework (gates, milestones, numeric
// bars, the readiness-review scorecard, the absolute-minimum criteria, the
// execution roadmap and the launch-window rules) plus the pure functions that
// turn a saved `ReadinessState` into progress, gate-completion and the GO/NO-GO
// verdict. UI components render this; the API persists `ReadinessState`.
//
// Guiding principle (from the framework): the launch date is the reward for
// completing the milestones, not the forcing function.
// ─────────────────────────────────────────────────────────────────────────────

export type Comparator = "gte" | "lte";

export interface Metric {
  id: string;
  label: string;
  target: number;
  comparator: Comparator; // gte = "at least", lte = "at most / under"
  unit?: string; // "%", "min", …
}

export interface MetricGroup {
  title: string;
  metrics: Metric[];
}

export interface Milestone {
  id: string;
  label: string;
}

export interface Gate {
  id: string;
  number: number;
  name: string;
  owner: string;
  tagline: string;
  description: string;
  milestones: Milestone[];
  metricGroups: MetricGroup[];
  note?: string;
}

// ── Helpers to build gate content without hand-writing every id ──────────────
function ms(gateId: string, labels: string[]): Milestone[] {
  return labels.map((label, i) => ({ id: `${gateId}/m${i + 1}`, label }));
}
function m(id: string, label: string, target: number, comparator: Comparator = "gte", unit = ""): Metric {
  return { id, label, target, comparator, unit };
}

// ── The six launch gates ─────────────────────────────────────────────────────
export const GATES: Gate[] = [
  {
    id: "product",
    number: 1,
    name: "Product Readiness",
    owner: "Ashton Slatev",
    tagline: "Reliable enough to put people in without hand-holding.",
    description:
      "Sena must be reliable enough that sales, marketing, and customer success can confidently put people into the product without hand-holding.",
    milestones: ms("product", [
      "Core Sena workflow is fully usable end-to-end.",
      "Users can upload CSV or Excel files without internal support.",
      "Sena generates useful insights, recommendations, and simulations from uploaded data.",
      "Output is clear enough for a business user to understand without product-team explanation.",
      "Error states are clean and understandable.",
      "Onboarding flow is complete.",
      "Demo environment is stable.",
      "Sales demo environment is separate from the live user environment.",
      "Website signup or demo-request flow is live.",
      "Analytics tracking is installed across product and website.",
      "At least 50 full internal test runs have been completed.",
      "At least 20 external beta users have completed a full workflow.",
      "No unresolved critical bugs.",
      "No unresolved launch-blocking UX issues.",
    ]),
    metricGroups: [
      {
        title: "Minimum product bar",
        metrics: [
          m("product/completion-rate", "Successful completion rate for the core workflow", 95, "gte", "%"),
          m("product/time-to-output", "Median time to first useful output", 10, "lte", "min"),
          m("product/support-rate", "Users requiring human support to finish the first workflow", 5, "lte", "%"),
        ],
      },
    ],
  },
  {
    id: "enterprise",
    number: 2,
    name: "Enterprise Customer Proof",
    owner: "Mercy Gitau",
    tagline: "The main revenue motion — this gate matters most.",
    description:
      "Since enterprise is the main revenue motion, this gate matters most. We need real corporate customers getting real value, not demos.",
    milestones: ms("enterprise", [
      "At least 5 corporate customers actively using Sena.",
      "At least 3 of those customers are recognizable or strategically valuable.",
      "At least 2 customers are using Sena weekly.",
      "At least 1 customer is using Sena across more than one stakeholder or team.",
      "At least 3 customers have completed real business use cases, not demos.",
      "At least 2 customers have generated outputs they would be willing to show internally.",
      "At least 2 corporate customers have clear before/after value stories.",
    ]),
    metricGroups: [
      {
        title: "Minimum enterprise usage bar",
        metrics: [
          m("enterprise/active-customers", "Active corporate customers", 5),
          m("enterprise/active-users", "Active enterprise users across those customers", 15),
          m("enterprise/sessions", "Real Sena sessions completed by enterprise users", 25),
          m("enterprise/decisions", "Concrete business decisions influenced by Sena", 10),
          m("enterprise/expansions", "Expansion conversations triggered by Sena usage", 3),
        ],
      },
    ],
  },
  {
    id: "testimonials",
    number: 3,
    name: "Testimonials & Proof Assets",
    owner: "Mercy Gitau",
    tagline: "Named proof before public launch.",
    description: "We need named proof before public launch — quotes, references, and at least one detailed case study.",
    milestones: ms("testimonials", [
      "3 named corporate testimonials approved for public use.",
      "5 private customer quotes approved for sales decks, even if not public.",
      "1 detailed case study.",
      "3 short use-case stories.",
      "1 enterprise customer willing to join a webinar, fireside chat, or launch quote.",
      "1 investor/advisor quote (if useful).",
      "1 strong internal customer-success memo summarizing actual usage and value.",
    ]),
    metricGroups: [
      {
        title: "Minimum testimonial bar",
        metrics: [
          m("testimonials/named-quotes", "Named quotes approved for public use", 3),
          m("testimonials/case-studies", "Detailed case studies", 1),
          m("testimonials/private-refs", "Private sales references", 5),
          m("testimonials/logos", "Customer logos approved for launch page / deck", 1),
        ],
      },
    ],
    note: "If we cannot get named testimonials, that is a signal the product value is not yet strong enough.",
  },
  {
    id: "selfserve",
    number: 4,
    name: "Self-Serve Usage Proof",
    owner: "Kapil Mathrani",
    tagline: "Proof Sena can spread beyond enterprise sales.",
    description:
      "Self-serve does not need to drive primary revenue, but it should prove that Sena can activate and spread without enterprise hand-holding.",
    milestones: ms("selfserve", [
      "Self-serve signup or request-access flow is live.",
      "Onboarding emails are live.",
      "Product analytics are live.",
      "Payment or pricing flow is either live or clearly staged.",
      "At least 250 non-enterprise users have signed up or requested access.",
      "At least 100 have activated.",
      "At least 50 have completed a full Sena workflow.",
      "At least 25 have returned for a second session.",
      "At least 10 users have invited, shared, or referred someone else.",
    ]),
    metricGroups: [
      {
        title: "Minimum self-serve usage bar",
        metrics: [
          m("selfserve/signups", "Signups or access requests", 250),
          m("selfserve/activated", "Activated users", 100),
          m("selfserve/completed", "Completed workflows", 50),
          m("selfserve/returning", "Returning users", 25),
          m("selfserve/activation-rate", "Activation rate", 30, "gte", "%"),
          m("selfserve/retention", "Week-one retention among activated users", 20, "gte", "%"),
        ],
      },
      {
        title: "Minimum satisfaction bar",
        metrics: [
          m("selfserve/nps", "NPS from active users", 40),
          m("selfserve/useful", "Surveyed users who say the output was useful", 70, "gte", "%"),
          m("selfserve/would-reuse", "Users who would use Sena again for a real decision", 50, "gte", "%"),
          m("selfserve/qual-responses", "Qualitative responses explaining the value", 20),
        ],
      },
    ],
    note: "NPS should not be the main launch gate, but we should still measure it.",
  },
  {
    id: "narrative",
    number: 5,
    name: "Market Narrative Readiness",
    owner: "Diksha Sharma",
    tagline: "The market understands what Sena is in one sentence.",
    description: "The market must understand what Sena is in one sentence — positioning, category, and story all locked.",
    milestones: ms("narrative", [
      "One-line positioning finalized.",
      "Category language finalized.",
      "Website headline finalized.",
      "Founder narrative finalized.",
      "Sales narrative finalized.",
      "Product demo narrative finalized.",
      "Press narrative finalized.",
      "FAQ finalized.",
      "Objection handling finalized.",
      "Competitor positioning finalized.",
      "Pricing explanation finalized.",
      "Launch announcement copy finalized.",
    ]),
    metricGroups: [
      {
        title: "Clarity test — give the launch page to 10 people who have never seen Sena",
        metrics: [
          m("narrative/clarity", "Of 10 cold readers, those who can answer all six questions below", 8),
        ],
      },
    ],
    note: "They must be able to answer: What is Sena? · Who is it for? · What problem does it solve? · Why now? · Why Rwazi? · What should I do next? — If they cannot answer clearly, we are not ready.",
  },
  {
    id: "distribution",
    number: 6,
    name: "Distribution Readiness",
    owner: "Marketing & Sales",
    tagline: "The launch has an audience before the announcement.",
    description: "The launch must have an audience before the announcement — press, partners, sequences, and paid all primed.",
    milestones: ms("distribution", [
      "Press release drafted and approved.",
      "PR Newswire credits / package confirmed.",
      "Media list finalized.",
      "25 journalists identified.",
      "10 warm media relationships activated.",
      "5 journalist briefings completed before launch.",
      "3 newsletter partnerships or placements lined up.",
      "10 customer / prospect email segments prepared.",
      "Founder LinkedIn launch sequence prepared.",
      "Company LinkedIn sequence prepared.",
      "Sales outreach sequence prepared.",
      "Investor update prepared.",
      "Partner outreach prepared.",
      "Webinar or live demo scheduled.",
      "Retargeting audiences created.",
      "Paid LinkedIn campaign ready.",
      "Website analytics and conversion tracking ready.",
    ]),
    metricGroups: [
      {
        title: "Minimum distribution bar",
        metrics: [
          m("distribution/briefings", "Embargoed journalist briefings", 5),
          m("distribution/placements", "Likely media / newsletter placements", 3),
          m("distribution/webinar", "Launch webinar scheduled", 1),
          m("distribution/customer-email", "Customer email campaign ready", 1),
          m("distribution/prospect-email", "Prospect email campaign ready", 1),
          m("distribution/sales-assets", "Sales-ready launch assets completed", 10),
        ],
      },
    ],
  },
];

// ── Readiness review scorecard (final gate, scored 0–10 each) ────────────────
export interface ReviewCategory {
  id: string;
  label: string;
  min: number;
}
export const REVIEW_CATEGORIES: ReviewCategory[] = [
  { id: "review/product", label: "Product Readiness", min: 9 },
  { id: "review/enterprise", label: "Enterprise Proof", min: 9 },
  { id: "review/selfserve", label: "Self-Serve Proof", min: 8 },
  { id: "review/testimonials", label: "Testimonials", min: 8 },
  { id: "review/narrative", label: "Narrative", min: 8 },
  { id: "review/distribution", label: "Distribution", min: 8 },
  { id: "review/sales", label: "Sales Readiness", min: 8 },
];

// ── Absolute-minimum launch criteria (non-negotiable) ────────────────────────
// Items with `metricId` are derived automatically from a gate metric; the rest
// are manual confirmations the owners tick off.
export interface Criterion {
  id: string;
  label: string;
  metricId?: string;
}
export const MIN_CRITERIA: Criterion[] = [
  { id: "crit/active-customers", label: "5 active corporate customers using Sena", metricId: "enterprise/active-customers" },
  { id: "crit/named-testimonials", label: "3 named corporate testimonials", metricId: "testimonials/named-quotes" },
  { id: "crit/case-study", label: "1 public case study", metricId: "testimonials/case-studies" },
  { id: "crit/signups", label: "250 self-serve signups or access requests", metricId: "selfserve/signups" },
  { id: "crit/activated", label: "100 activated self-serve users", metricId: "selfserve/activated" },
  { id: "crit/completed", label: "50 completed self-serve workflows", metricId: "selfserve/completed" },
  { id: "crit/nps", label: "NPS 40+ from active users", metricId: "selfserve/nps" },
  { id: "crit/completion-rate", label: "95%+ successful core-workflow completion", metricId: "product/completion-rate" },
  { id: "crit/time-to-output", label: "Median time to first useful output under 10 minutes", metricId: "product/time-to-output" },
  { id: "crit/briefings", label: "5 embargoed journalist briefings", metricId: "distribution/briefings" },
  { id: "crit/placements", label: "3 likely media / newsletter placements", metricId: "distribution/placements" },
  { id: "crit/assets-ready", label: "Final website, demo, sales deck, FAQ, and launch video ready" },
  { id: "crit/sales-trained", label: "Sales team trained and ready" },
  { id: "crit/cs-ready", label: "Customer success ready for inbound" },
  { id: "crit/support-ready", label: "Product support ready for launch week" },
  { id: "crit/launch-cta", label: "Clear launch CTA" },
  { id: "crit/pricing-path", label: "Clear pricing or access path" },
  { id: "crit/followup", label: "Clear follow-up campaign for 30 days after announcement" },
];

// ── Recommended order of execution ───────────────────────────────────────────
export interface Step {
  id: string;
  number: number;
  title: string;
  owner: string;
  summary: string;
}
export const STEPS: Step[] = [
  { id: "step/1", number: 1, title: "Define the launch thesis", owner: "Marketing · Product · CEO", summary: "Lock the exact launch claim — what changed, why it matters, who it's for, why Rwazi, why now. Not “we built an AI tool.”" },
  { id: "step/2", number: 2, title: "Lock the product use cases", owner: "Product · Sales · CS", summary: "Pick 3–5 killer use cases (e.g. market-share growth, marketing ROI, CLV, demand-signal analysis, scenario simulation). Each needs input data, output, user, decision, example, and a sales story." },
  { id: "step/3", number: 3, title: "Recruit beta customers", owner: "Sales · CS", summary: "Select a controlled group — 10 invited, 5 active minimum, 3 strong proof customers, 1 public case-study candidate. Criteria: recognizable, real problem, active use, quote + expansion potential." },
  { id: "step/4", number: 4, title: "Run enterprise beta", owner: "Customer Success", summary: "The most important phase. Each account: kickoff → data connect → first workflow → output review → decision discussion → value capture → testimonial → expansion. Every account produces a short internal memo." },
  { id: "step/5", number: 5, title: "Open controlled self-serve access", owner: "Growth · Product Marketing", summary: "Start controlled with analysts, operators, founders, consultants, growth/strategy/finance/marketing teams. Prove activation without hand-holding. Track signup → activation → upload → output → return → referral → support → NPS." },
  { id: "step/6", number: 6, title: "Collect proof", owner: "Marketing · CS", summary: "Gather before final launch copy: 3 named testimonials, 5 private quotes, 1 public case study, 3 mini use cases, screenshots, demo videos, usage metrics, analyst/user quotes." },
  { id: "step/7", number: 7, title: "Build launch assets", owner: "Marketing", summary: "Landing page, PR Newswire release, founder + company LinkedIn posts, customer + prospect emails, investor update, sales deck, demo + teaser + 3-min launch video, FAQ, objection sheet, case study, media kit, talking points, webinar deck, follow-up sequence." },
  { id: "step/8", number: 8, title: "Test the narrative", owner: "Product Marketing", summary: "Before announcing, test the story with 5 customers, 5 prospects, 5 advisors/investors, 5 non-technical business users. Launch only if the narrative is immediately understood." },
  { id: "step/9", number: 9, title: "Build the distribution machine", owner: "Marketing · Sales", summary: "Turn the launch into a campaign, not a post: PR, founder + company LinkedIn, customer/prospect/investor/partner emails, sales outbound, webinars, paid LinkedIn, retargeting, newsletters, briefings, YouTube demo, blog. Don't rely on PR alone." },
  { id: "step/10", number: 10, title: "Final launch readiness review", owner: "Leadership", summary: "No date is selected before this review. Score every gate; if below the bar, we do not launch." },
];

// ── Ideal “global banger” criteria (stretch reference) ───────────────────────
export const IDEAL_CRITERIA: string[] = [
  "10 corporate customers using Sena",
  "5 weekly active corporate accounts",
  "3 recognizable enterprise customers willing to be referenced",
  "5 named testimonials",
  "2 full case studies",
  "1 customer willing to speak publicly",
  "1,000 self-serve signups or access requests",
  "400 activated users",
  "200 completed workflows",
  "100 returning users",
  "NPS 50+",
  "10 journalist briefings",
  "5 confirmed or highly likely media / newsletter placements",
  "2 founder thought-leadership posts warmed up before launch",
  "1 launch webinar with customers / prospects invited",
  "1 partner / investor amplification plan",
  "Paid LinkedIn and retargeting campaigns ready",
  "30-day post-launch content calendar ready",
  "Sales has a target-account list ready to hit immediately",
];

// ── Launch-window rules ──────────────────────────────────────────────────────
export const DATE_RULES = {
  structural: [
    "Land on a Tuesday, Wednesday, or Thursday (Tuesday preferred).",
    "Not during August.",
    "Not during the final two weeks of December.",
    "Not during the first week of January.",
  ],
  judgement: [
    "Not during a major U.S. holiday week.",
    "Not during a major competing industry event — unless we are intentionally using it.",
    "At least 21 days after press briefings begin.",
    "At least 14 days after final launch assets are approved.",
    "At least 7 days after sales has all launch materials.",
  ],
  preferred: "Preferred: Tuesday, 8:00 AM ET.",
};

// ─────────────────────────────────────────────────────────────────────────────
// State + pure computation
// ─────────────────────────────────────────────────────────────────────────────
export interface ReadinessState {
  milestones: Record<string, boolean>;
  metrics: Record<string, number>;
  scores: Record<string, number>;
  criteria: Record<string, boolean>;
  steps: Record<string, boolean>;
  ideal: Record<string, boolean>;
  targetDate: string | null;
  updatedAt: string | null;
}

export function emptyState(): ReadinessState {
  return { milestones: {}, metrics: {}, scores: {}, criteria: {}, steps: {}, ideal: {}, targetDate: null, updatedAt: null };
}

export function metricMet(metric: Metric, value: number | undefined): boolean {
  if (value === undefined || Number.isNaN(value)) return false;
  return metric.comparator === "gte" ? value >= metric.target : value <= metric.target;
}

export function allMetrics(gate: Gate): Metric[] {
  return gate.metricGroups.flatMap((g) => g.metrics);
}

// Flat lookup of every metric by id, for criteria derivation and validation.
export const METRIC_BY_ID: Record<string, Metric> = Object.fromEntries(
  GATES.flatMap((g) => allMetrics(g)).map((mt) => [mt.id, mt])
);

export interface GateProgress {
  milestonesDone: number;
  milestonesTotal: number;
  metricsMet: number;
  metricsTotal: number;
  fraction: number; // 0..1 across milestones + metrics
  complete: boolean;
}

export function gateProgress(gate: Gate, state: ReadinessState): GateProgress {
  const metrics = allMetrics(gate);
  const milestonesDone = gate.milestones.filter((x) => state.milestones[x.id]).length;
  const metricsMet = metrics.filter((mt) => metricMet(mt, state.metrics[mt.id])).length;
  const total = gate.milestones.length + metrics.length;
  const done = milestonesDone + metricsMet;
  return {
    milestonesDone,
    milestonesTotal: gate.milestones.length,
    metricsMet,
    metricsTotal: metrics.length,
    fraction: total === 0 ? 0 : done / total,
    complete: milestonesDone === gate.milestones.length && metricsMet === metrics.length,
  };
}

export function gatesComplete(state: ReadinessState): boolean {
  return GATES.every((g) => gateProgress(g, state).complete);
}

export function gatesCompleteCount(state: ReadinessState): number {
  return GATES.filter((g) => gateProgress(g, state).complete).length;
}

export function reviewPass(state: ReadinessState): boolean {
  return REVIEW_CATEGORIES.every((c) => (state.scores[c.id] ?? 0) >= c.min);
}

export function criterionMet(crit: Criterion, state: ReadinessState): boolean {
  if (crit.metricId) {
    const metric = METRIC_BY_ID[crit.metricId];
    return metric ? metricMet(metric, state.metrics[crit.metricId]) : false;
  }
  return !!state.criteria[crit.id];
}

export function minCriteriaMetCount(state: ReadinessState): number {
  return MIN_CRITERIA.filter((c) => criterionMet(c, state)).length;
}

// Mean of the six gate fractions — the headline readiness percentage.
export function overallReadiness(state: ReadinessState): number {
  const sum = GATES.reduce((acc, g) => acc + gateProgress(g, state).fraction, 0);
  return Math.round((sum / GATES.length) * 100);
}

export interface Verdict {
  ready: boolean;
  gatesDone: number;
  gatesTotal: number;
  reviewPassed: boolean;
  minCriteriaMet: number;
  minCriteriaTotal: number;
  blockers: string[];
}

export function launchVerdict(state: ReadinessState): Verdict {
  const gatesDone = gatesCompleteCount(state);
  const reviewPassed = reviewPass(state);
  const minMet = minCriteriaMetCount(state);
  const blockers: string[] = [];

  for (const g of GATES) {
    const p = gateProgress(g, state);
    if (!p.complete) {
      const parts: string[] = [];
      if (p.milestonesDone < p.milestonesTotal) parts.push(`${p.milestonesTotal - p.milestonesDone} milestone(s)`);
      if (p.metricsMet < p.metricsTotal) parts.push(`${p.metricsTotal - p.metricsMet} metric(s)`);
      blockers.push(`${g.name}: ${parts.join(" + ")} outstanding`);
    }
  }
  if (!reviewPassed) {
    const weak = REVIEW_CATEGORIES.filter((c) => (state.scores[c.id] ?? 0) < c.min).map((c) => c.label);
    blockers.push(`Readiness review below bar: ${weak.join(", ")}`);
  }
  if (minMet < MIN_CRITERIA.length) {
    blockers.push(`${MIN_CRITERIA.length - minMet} absolute-minimum criteria unmet`);
  }

  return {
    ready: gatesDone === GATES.length && reviewPassed && minMet === MIN_CRITERIA.length,
    gatesDone,
    gatesTotal: GATES.length,
    reviewPassed,
    minCriteriaMet: minMet,
    minCriteriaTotal: MIN_CRITERIA.length,
    blockers,
  };
}

// ── Launch-date validation (structural rules only — the rest need judgement) ──
export interface DateCheck {
  rule: string;
  ok: boolean;
}
export function validateLaunchDate(iso: string | null): { checks: DateCheck[]; ok: boolean } | null {
  if (!iso) return null;
  const d = new Date(iso + "T12:00:00Z");
  if (Number.isNaN(d.getTime())) return null;
  const day = d.getUTCDay(); // 0 Sun … 6 Sat
  const month = d.getUTCMonth(); // 0 Jan … 11 Dec
  const date = d.getUTCDate();

  const checks: DateCheck[] = [
    { rule: "Tuesday, Wednesday, or Thursday", ok: day >= 2 && day <= 4 },
    { rule: "Not during August", ok: month !== 7 },
    { rule: "Not the final two weeks of December", ok: !(month === 11 && date >= 18) },
    { rule: "Not the first week of January", ok: !(month === 0 && date <= 7) },
  ];
  return { checks, ok: checks.every((c) => c.ok) };
}

export function comparatorSymbol(c: Comparator): string {
  return c === "gte" ? "≥" : "≤";
}
