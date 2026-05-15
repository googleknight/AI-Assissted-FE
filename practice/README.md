# Practice — Brownfield Frontend Drills

Drills for the brownfield round. Use these to **train pattern recognition** so that when you open the real codebase, bugs jump at you.

## How to use

1. **Pick a category.** Each folder targets one risk axis (react bugs, security, perf, state, async, testing, half-done features, TS, plus a mini-project).
2. **For each snippet:**
   - Read the file header — it says what to do (find bugs / complete the feature / write a test).
   - Set a timer (suggested time in each file header).
   - Try without AI first. Then optionally use AI to cross-check.
   - Write your findings in WWIF format (Where / Why / Impact / Fix) — same as you'd present to the interviewer.
3. **Check `SOLUTIONS.md`** in each folder when done.
4. **Re-do later.** Spaced repetition beats one pass.

## Folder map

| Folder | Format | What you train |
|---|---|---|
| `01-react-bugs/` | 10 single-bug snippets | Hooks, closures, keys, effects — instant-spot reflexes |
| `02-security-bugs/` | 6 snippets | XSS, tokens, eval, redirects — the security scan |
| `03-perf-bugs/` | 6 snippets | Re-renders, memo, bundle, virtualization |
| `04-state-bugs/` | 5 snippets | Context, mutation, derivation, SSR |
| `05-async-resilience/` | 5 snippets | Timeouts, retries, race conditions, error boundaries |
| `06-testing-incomplete/` | 4 components + empty test files | RTL — write the tests |
| `07-half-done-features/` | 5 partial features | Part 2 simulation — finish the work |
| `08-typescript-gotchas/` | 4 snippets | TS pitfalls |
| `09-mini-project/` | Multi-file mini app | Cross-file review — full Part 1 simulation, 15-20 bugs |

## Recommended order for one pass (~3-4 hours total)

1. `01-react-bugs` (45 min) — fundamentals first
2. `10-common-bugs-cheatsheet.md` (../ docs) — re-read 5 min
3. `02-security-bugs` (20 min)
4. `03-perf-bugs` (20 min)
5. `04-state-bugs` (20 min)
6. `05-async-resilience` (25 min)
7. **TIME BOX: `09-mini-project` (40 min)** — simulate Part 1 of the interview. Use a stopwatch.
8. `07-half-done-features` (40 min) — Part 2 simulation
9. `06-testing-incomplete` (30 min)
10. `08-typescript-gotchas` (15 min) — if you have time

## If you only have 90 minutes

1. `01-react-bugs/` — skim, do 5 fastest
2. `09-mini-project/` — full timed run
3. `07-half-done-features/` — pick one, finish it end-to-end with a test

## Practice rules

- **Use a timer.** Time pressure is the interview's hardest part.
- **Write WWIF for every finding**, even when alone. Build the muscle.
- **Don't peek at solutions** until you've genuinely tried.
- **Re-do.** First pass finds 40%. Second pass 80%.
- **AI use:** do at least the first pass without AI to test your raw skill, then use AI as a cross-check on a second pass.

## What "good" looks like

- React-bugs: spot in <60 seconds per snippet, name the principle.
- Security: spot in <30 seconds. Every XSS is instant.
- Perf: see the antipattern, predict the symptom, propose the measurement.
- Mini-project: find ≥12 of the ≥15 planted bugs in 30 minutes. Prioritize them in WWIF.

Good luck. Start with `01-react-bugs/`.
