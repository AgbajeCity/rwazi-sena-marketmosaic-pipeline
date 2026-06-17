# Sena Launch Readiness

Internal launch-readiness command center for **Sena** (Rwazi's enterprise Decision-AI).
Lives at `sena-marketmosaic.vercel.app`. Project owner: **Peter Garazha**.

## What this does
Tracks everything Sena must prove before we pick a public launch date — the launch
gates, their milestones and numeric bars, the readiness-review scorecard, the
absolute-minimum criteria, the execution roadmap, and the launch-window rules.

Guiding rule: **we pick the date only when every gate is complete. The launch date
is the reward for completing the milestones, not the forcing function.**

The whole team shares one live state (stored in Vercel Blob), so ticking a milestone
or entering a metric is visible to everyone.

## Run it
```bash
cd web
npm install
npm run dev      # http://localhost:3000
```

## The model
- `web/lib/readiness.ts` — **single source of truth**: the gates, milestones, metric
  bars, review categories, minimum/ideal criteria, execution steps, date rules, and
  all the pure functions that compute progress and the GO/NO-GO verdict. Edit content here.
- `web/lib/storage.ts` — shared team state in Vercel Blob (`sena-launch/readiness.json`).
- `web/app/api/readiness/route.ts` — `GET` loads state, `PUT` saves it.
- `web/app/page.tsx` — dashboard orchestrator: loads state, debounced autosave.

## Gates (each has an owner)
1. **Product Readiness** — Ashton Slatev
2. **Enterprise Customer Proof** — Mercy Gitau
3. **Testimonials & Proof Assets** — Mercy Gitau
4. **Self-Serve Usage Proof** — Kapil Mathrani
5. **Market Narrative Readiness** — Diksha Sharma
6. **Distribution Readiness** — Marketing & Sales

## Components
- `LaunchVerdict` — headline GO/NO-GO, readiness %, blockers
- `GateCard` — per-gate milestones + editable metric bars
- `ReadinessReview` — the 7-category /10 scorecard (final gate)
- `MinimumCriteria` — non-negotiable shortlist (auto-derives from gate metrics where possible)
- `ExecutionRoadmap` — the 10-step recommended order of execution
- `LaunchWindow` — candidate-date validator + judgement rules
- `IdealCriteria` — the stretch "global-banger" bar

## Persistence
Shared state needs `BLOB_READ_WRITE_TOKEN` (or `SENA_BLOB_READ_WRITE_TOKEN`) in the
Vercel project. Without it the dashboard still renders (read-only defaults) and shows
"Couldn't sync" on save.

## Build / lint
```bash
cd web
npm run build
npm run lint
```

## Deploy
Pushing to `claude/nifty-newton-KOvRC` triggers `.github/workflows/deploy.yml`, which
builds and deploys `web/` to Vercel (project `prj_B2S3jJDip6PKHFjEVnkbDgGvHm5h`).
