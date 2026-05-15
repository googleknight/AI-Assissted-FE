# Mini-project: TeamSync Dashboard

A small (~8 file) React app simulating a brownfield codebase you'd see in the interview. **It has 20+ planted bugs across correctness, security, performance, state, async, and accessibility.**

Your job: simulate Part 1 of the interview.

## How to practice

1. **Time it.** 30 minutes for review only, no implementation.
2. **Read every file.** Don't skim. Use the lenses from `01-code-review-playbook.md`.
3. **Write findings in WWIF format** (Where / Why / Impact / Fix) — in a `findings.md` next to this README, or open a scratchpad.
4. **Prioritize** them: 🔴 ship-blocker / 🟠 important / 🟡 nice-to-have.
5. **When time is up**, count your findings. Aim for ≥12 of the planted 20+.
6. **Open `SOLUTIONS.md`.** Compare. The bugs you missed are the patterns to drill.
7. **Optional Part 2:** pick ONE finding and write a fix + a test (30 minutes).

## The "app"

Imagine the user story:
> A team dashboard. Logged-in users see a list of team members, can search/filter, click into a profile to see notes (rich text), and submit feedback. The team owner can add new members.

You won't actually run it (we have no build setup) — you're reading code, not running it. If you want to run something, copy individual files into a Vite/CRA project.

## File map

```
src/
├── App.jsx                       — top-level layout, providers
├── context/
│   └── AppContext.jsx            — global state (user, team, notifications)
├── api/
│   └── client.js                 — fetch wrapper, auth
├── components/
│   ├── TeamList.jsx              — filterable list of team members
│   ├── MemberProfile.jsx         — detail view with rich-text notes
│   ├── AddMemberForm.jsx         — form to add member
│   ├── FeedbackModal.jsx         — feedback modal with draft
│   └── Header.jsx                — top bar with search + bell
└── hooks/
    └── useDebouncedValue.js      — debounce helper
```

## Rules

- No fix needs the actual build to be working — these are review exercises.
- Some bugs span files — e.g., a bad pattern in `client.js` causes a symptom in `TeamList.jsx`.
- Some are obvious; some are senior-only.
- The interviewer doesn't always tell you "find bugs" — sometimes they ask you to "implement search." During implementation, you should notice and call out the surrounding bugs.

Start with `App.jsx` and walk down.
