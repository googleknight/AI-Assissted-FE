# AI-assisted FE Interview Prep

Self-study material for a **brownfield frontend coding + design interview**: 60-minute hands-on, AI-assisted round where you read unfamiliar code, find issues, and ship a small change with a test.

Built for a senior IC. React-first, light Vue, light Next.js, version-aware. ~4,100 lines of notes + ~70 practice files.

---

## Folder layout

```
.
├── docs/        12 topic-wise reference docs — read these first
└── practice/    70 hands-on exercises across 9 categories
```

Open `docs/00-START-HERE.md` for the meta-strategy doc. Open `practice/README.md` for the drill index.

---

## What's in `docs/`

| # | File | What it covers |
|---|------|----------------|
| 00 | `00-START-HERE.md` | **Read first.** Strategy, time budget, the 5 senior signals, communication framework, AI strategy summary |
| 01 | `01-code-review-playbook.md` | **Critical for Part 1.** WWIF format, 7 review lenses, 5-minute speed-review script, worked example with 11 findings |
| 02 | `02-react-deep-dive.md` | Hooks, closures, useEffect dependency rules, batching, reconciliation, controlled inputs, conditional rendering |
| 03 | `03-state-management.md` | The state ladder, server vs client state, Context anatomy + footguns, derived state, race conditions, storage |
| 04 | `04-security.md` | XSS hit-list, sanitization patterns, auth token storage, CSP, CORS, secret leakage, SSR script injection |
| 05 | `05-performance.md` | Render cycle, memoization (when to / when NOT to), virtualization, bundle bloat, Core Web Vitals, React 18 concurrent features (+ React 19 notes) |
| 06 | `06-resilience.md` | The four UI states, error boundaries, timeouts, retries with backoff, race conditions, optimistic updates, observability |
| 07 | `07-testing.md` | RTL query priority, what to test / not, mocking with MSW vs jest.mock, async, fake timers, coverage caveats |
| 08 | `08-nextjs-essentials.md` | App Router vs Pages, RSC, streaming + Suspense, hydration mismatches, **fetch cache change in Next 15**, Server Actions, middleware |
| 09 | `09-vue-quick-ref.md` | Vue 3 composition API, reactivity, Pinia, common bugs, React↔Vue translation table |
| 10 | `10-common-bugs-cheatsheet.md` | Fast-scan list. Re-read 20 min before the interview |
| 11 | `11-ai-strategy-antigravity.md` | How to use AI (Antigravity/Gemini) in the interview without losing the senior signal |

### Version notes
The docs mention version differences explicitly where they matter (React 18 vs 19 features, Next 14 vs 15 fetch caching, Vue 3.4 vs 3.5 watch semantics). When you open the interview repo, **check `package.json` first** so you match the version's behavior, not the latest.

---

## What's in `practice/`

Drills, not tutorials. Each category has snippets + a `SOLUTIONS.md` with reasoning.

| # | Folder | Files | Purpose |
|---|--------|-------|---------|
| 01 | `01-react-bugs/` | 10 snippets | useEffect, closures, keys, reconciliation, render bugs |
| 02 | `02-security-bugs/` | 6 snippets | XSS, token storage, eval, open redirects, SSR injection |
| 03 | `03-perf-bugs/` | 6 snippets | Re-renders, memo, virtualization, bundle bloat, images |
| 04 | `04-state-bugs/` | 5 snippets | Mutation, server state in Context, SSR, derived from props, reducer |
| 05 | `05-async-resilience/` | 5 snippets | Timeouts/retry, double-submit, error boundaries, four-states, optimistic |
| 06 | `06-testing-incomplete/` | 4 components + empty tests | RTL practice — write the tests |
| 07 | `07-half-done-features/` | 5 features | Part-2 simulation — finish + add a test |
| 08 | `08-typescript-gotchas/` | 4 snippets | any/unknown, discriminated unions, component types, narrowing |
| 09 | `09-mini-project/` | 8 source files | **Full Part-1 simulation — 25 planted bugs across files** |

---

## Suggested study path

**If you have one focused 3–4 hour block:**

1. Read `docs/00-START-HERE.md` (10 min)
2. Read `docs/01-code-review-playbook.md` (15 min)
3. Read `docs/10-common-bugs-cheatsheet.md` (10 min)
4. Drill `practice/01-react-bugs/` (45 min) — time yourself per snippet
5. Skim `docs/04-security.md` + drill `practice/02-security-bugs/` (30 min)
6. Skim `docs/05-performance.md` + drill `practice/03-perf-bugs/` (30 min)
7. **Timed Part-1 simulation: `practice/09-mini-project/` — 30 minutes** (this is the closest thing to the real interview)
8. Compare to the SOLUTIONS — figure out which lenses you missed
9. Pick one bug from the mini-project, fix it + write a test (30 min) — Part-2 simulation
10. Read `docs/11-ai-strategy-antigravity.md` (10 min) right before the interview

**If you have less than 90 minutes:**

1. `docs/00-START-HERE.md` + `docs/01-code-review-playbook.md` + `docs/10-common-bugs-cheatsheet.md` (30 min)
2. `practice/09-mini-project/` — timed (30 min)
3. Pick one bug to fix end-to-end with a test (30 min)

---

## Conventions in the docs

- **WWIF**: every finding in code review is phrased as Where / Why / Impact / Fix. The shape that interviewers consistently rate higher than vague critique.
- **🔴 🟠 🟡 prioritization**: ship-blockers / important / nice-to-have. Senior signal is grouping findings, not listing them flat.
- **The five senior signals** (from `docs/00`): read before you write, think about failure, make minimum changes, validate, know what you didn't do.

---

## Disclaimer

Material is for personal interview prep. Code is illustrative — don't ship it. Solutions show reasoning, not the only correct answer.
