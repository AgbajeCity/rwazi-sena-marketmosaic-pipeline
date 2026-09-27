// Market Mosaic → Sena outreach readiness.
// Tracks everything needed to send the Sena commercial newsletter to
// Market Mosaic subscribers and convert them into booked Sena demos.

export type Comparator = "gte" | "lte";

export interface Metric {
  id: string;
  label: string;
  target: number;
  comparator: Comparator;
  unit?: string;
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

function ms(gateId: string, labels: string[]): Milestone[] {
  return labels.map((label, i) => ({ id: `${gateId}/m${i + 1}`, label }));
}
function m(id: string, label: string, target: number, comparator: Comparator = "gte", unit = ""): Metric {
  return { id, label, target, comparator, unit };
}

export const GATES: Gate[] = [
  {
    id: "newsletter",
    number: 1,
    name: "Newsletter Draft",
    owner: "Insights",
    tagline: "Insight-led, not sales-led.",
    description: "The Sena block reads like useful analysis, not an ad.",
    milestones: ms("newsletter", [
      "Newsletter draft is complete.",
      "Sena commercial block is placed mid-newsletter.",
      "Positioning is insight-led — data use cases, not a product pitch.",
      "CTA is a soft nudge (e.g. 'see how your data compares'), not 'get access to Sena'.",
      "Block length is concise — fits naturally without disrupting the read.",
      "Copy has been reviewed for tone alignment with Market Mosaic's voice.",
      "Internal sign-off received.",
    ]),
    metricGroups: [
      {
        title: "Content bar",
        metrics: [
          m("newsletter/block-words", "Sena block word count", 300, "lte", " words"),
          m("newsletter/cta-count", "Number of CTAs in the Sena block", 1, "lte"),
        ],
      },
    ],
  },
  {
    id: "booking",
    number: 2,
    name: "Booking Flow",
    owner: "Growth",
    tagline: "One step. No friction.",
    description: "Subscribers click → land on Calendly → book. No Google Form, no redirect.",
    milestones: ms("booking", [
      "Calendly event created for Sena demo calls.",
      "Intake form fields embedded directly in Calendly (name, role, company, use case).",
      "Two-step Google Form flow removed or bypassed.",
      "Booking link tested end-to-end in a non-Google browser environment.",
      "Confirmation email configured with next-step context.",
      "Calendly link inserted into the newsletter CTA.",
    ]),
    metricGroups: [
      {
        title: "Form quality",
        metrics: [
          m("booking/form-fields", "Number of required form fields", 5, "lte"),
          m("booking/steps", "Steps from click to confirmed booking", 1, "lte"),
        ],
      },
    ],
    note: "Fewer fields = higher conversion. Keep it to what you actually need for the first call.",
  },
  {
    id: "subscribers",
    number: 3,
    name: "Subscriber Targeting",
    owner: "Insights",
    tagline: "Right subscribers. Right segment.",
    description: "The pipeline has already scored and ranked our Market Mosaic subscribers — use it.",
    milestones: ms("subscribers", [
      "Target segment defined (e.g. Tier 1 + Tier 2 corporate subscribers).",
      "Segment pulled from the Prospect Pipeline tab.",
      "List size confirmed — enough volume for statistical signal.",
      "Personalisation tokens verified (first name, company where available).",
      "Unsubscribe / suppression list checked.",
      "Send list uploaded or synced to beehiiv.",
    ]),
    metricGroups: [
      {
        title: "Audience size",
        metrics: [
          m("subscribers/list-size", "Subscribers in the send list", 500),
          m("subscribers/corporate", "Corporate-domain subscribers in the list", 100),
        ],
      },
    ],
  },
  {
    id: "tracking",
    number: 4,
    name: "Conversion Tracking",
    owner: "Insights",
    tagline: "Every click and booking accounted for.",
    description: "Track open rate, click rate, and meetings booked so we can report to leadership.",
    milestones: ms("tracking", [
      "beehiiv campaign analytics enabled.",
      "UTM parameters added to all Calendly links in the newsletter.",
      "Calendly analytics connected or manually tracked.",
      "Shared reporting view set up (or spreadsheet agreed).",
      "Metrics baseline established (previous campaign benchmarks).",
      "Report template ready for leadership presentation.",
    ]),
    metricGroups: [
      {
        title: "Target engagement",
        metrics: [
          m("tracking/open-rate", "Email open rate", 35, "gte", "%"),
          m("tracking/click-rate", "Click-through rate on the Sena CTA", 3, "gte", "%"),
          m("tracking/meetings", "Demo meetings booked from this send", 10),
          m("tracking/responses", "Direct subscriber replies or enquiries", 5),
        ],
      },
    ],
  },
];

export const REVIEW_CATEGORIES: ReviewCategory[] = [
  { id: "review/copy", label: "Newsletter copy quality", min: 8 },
  { id: "review/positioning", label: "Sena positioning (insight-led)", min: 8 },
  { id: "review/booking", label: "Booking flow (friction-free)", min: 9 },
  { id: "review/segment", label: "Subscriber segment quality", min: 8 },
  { id: "review/tracking", label: "Tracking & reporting setup", min: 8 },
];

export interface ReviewCategory {
  id: string;
  label: string;
  min: number;
}

export interface Criterion {
  id: string;
  label: string;
  metricId?: string;
}
export const MIN_CRITERIA: Criterion[] = [
  { id: "crit/draft", label: "Newsletter draft complete and signed off" },
  { id: "crit/block", label: "Sena block is insight-led, not a pitch" },
  { id: "crit/cta", label: "Single CTA linking to Calendly" },
  { id: "crit/calendly", label: "One-step Calendly booking live and tested" },
  { id: "crit/list", label: "Send list confirmed from Prospect Pipeline", metricId: "subscribers/list-size" },
  { id: "crit/corporate", label: "100+ corporate subscribers in the list", metricId: "subscribers/corporate" },
  { id: "crit/utm", label: "UTM tracking on Calendly link" },
  { id: "crit/reporting", label: "Reporting template ready for Jay" },
];

export interface Step {
  id: string;
  number: number;
  title: string;
  owner: string;
  summary: string;
}
export const STEPS: Step[] = [
  { id: "step/1", number: 1, title: "Pull the target segment", owner: "Insights", summary: "Use the Prospect Pipeline tab — filter Tier 1 + Tier 2 corporate subscribers. Export or sync the list." },
  { id: "step/2", number: 2, title: "Set up Calendly one-step booking", owner: "Growth", summary: "Create the Sena demo event. Embed name, role, company, use-case fields directly. Remove the Google Form step. Test in a non-Google browser." },
  { id: "step/3", number: 3, title: "Add UTM parameters", owner: "Insights", summary: "Tag the Calendly link with utm_source=market-mosaic&utm_campaign=sena-newsletter so every booking is traceable." },
  { id: "step/4", number: 4, title: "Write the Sena block", owner: "Insights", summary: "Place mid-newsletter. Lead with a data use case that mirrors what our subscribers care about. End with a single soft CTA. Keep it under 300 words." },
  { id: "step/5", number: 5, title: "Internal review", owner: "Insights", summary: "Share draft with Mercy. Check tone, CTA, and booking flow end-to-end before approving send." },
  { id: "step/6", number: 6, title: "Send newsletter", owner: "Insights", summary: "Schedule for Tuesday–Thursday morning. Confirm beehiiv analytics are live before sending." },
  { id: "step/7", number: 7, title: "Monitor in real time", owner: "Insights", summary: "Watch open rate and click rate in the first 4 hours. Flag any broken links immediately." },
  { id: "step/8", number: 8, title: "Log meetings booked", owner: "Growth", summary: "Track every Calendly booking back to the newsletter send. Note company, role, and use case from the form." },
  { id: "step/9", number: 9, title: "Build the conversion report", owner: "Insights", summary: "Outreach sent → opens → clicks → bookings → meetings held. Present to Jay with the pipeline data alongside." },
];

export const IDEAL_CRITERIA: string[] = [
  "Open rate 45%+",
  "Click rate 5%+ on Sena CTA",
  "20+ demo meetings booked",
  "10+ meetings held within 2 weeks of send",
  "3+ enterprise accounts in the booked list",
  "1 subscriber converts to a Sena pilot",
  "Shared reporting dashboard live before the next send",
  "Second newsletter iteration planned based on this send's data",
];

export const DATE_RULES = {
  structural: [
    "Tuesday, Wednesday, or Thursday send.",
    "Not during a public holiday week.",
    "Not the same week as another major Rwazi announcement.",
  ],
  judgement: [
    "Newsletter draft approved at least 24 hours before send.",
    "Calendly booking link tested same day as send.",
    "Mercy and Ayomide aligned on timing before scheduling.",
  ],
  preferred: "Preferred: Tuesday, 8:00 AM ET / 11:00 AM Lagos.",
};

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

export const METRIC_BY_ID: Record<string, Metric> = Object.fromEntries(
  GATES.flatMap((g) => allMetrics(g)).map((mt) => [mt.id, mt])
);

export interface GateProgress {
  milestonesDone: number;
  milestonesTotal: number;
  metricsMet: number;
  metricsTotal: number;
  fraction: number;
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
      if (p.milestonesDone < p.milestonesTotal) parts.push(`${p.milestonesTotal - p.milestonesDone} item(s)`);
      if (p.metricsMet < p.metricsTotal) parts.push(`${p.metricsTotal - p.metricsMet} metric(s)`);
      blockers.push(`${g.name}: ${parts.join(" + ")} outstanding`);
    }
  }
  if (!reviewPassed) {
    const weak = REVIEW_CATEGORIES.filter((c) => (state.scores[c.id] ?? 0) < c.min).map((c) => c.label);
    blockers.push(`Review below bar: ${weak.join(", ")}`);
  }
  if (minMet < MIN_CRITERIA.length) {
    blockers.push(`${MIN_CRITERIA.length - minMet} minimum criteria unmet`);
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

export interface DateCheck {
  rule: string;
  ok: boolean;
}
export function validateLaunchDate(iso: string | null): { checks: DateCheck[]; ok: boolean } | null {
  if (!iso) return null;
  const d = new Date(iso + "T12:00:00Z");
  if (Number.isNaN(d.getTime())) return null;
  const day = d.getUTCDay();
  const month = d.getUTCMonth();
  const checks: DateCheck[] = [
    { rule: "Tuesday, Wednesday, or Thursday", ok: day >= 2 && day <= 4 },
    { rule: "Not during August", ok: month !== 7 },
  ];
  return { checks, ok: checks.every((c) => c.ok) };
}

export function comparatorSymbol(c: Comparator): string {
  return c === "gte" ? ">=" : "<=";
}
