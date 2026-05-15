# 00 — START HERE: Strategy, Time Management & Mental Model

> This is the meta-doc. Read this first. It tells you HOW to use the rest, HOW to think during the 60 minutes, and HOW to leave the strongest signal as a senior engineer.

---

## The single most important reframe

A brownfield round is **not** a coding test. It's a **judgment test wearing coding clothes**.

What they're really measuring:
1. **Can you safely operate in a system you don't own?** (most production work is this)
2. **Do you spot risk that others miss?** (the senior premium)
3. **Do you make minimal, reversible changes?** (junior devs rewrite; seniors patch)
4. **Do you reason about failure modes out loud?** (talking through "what if this fails" is the strongest signal you can give)
5. **Do you use AI as a tool, not a crutch?** (you're driving; AI is co-pilot)

If you remember nothing else: **explain your reasoning more than you write code**.

---

## Reading order for these docs

| Order | File | When to read |
|---|---|---|
| 1 | `00-START-HERE.md` (this file) | Now |
| 2 | `01-code-review-playbook.md` | **CRITICAL** — Part 1 of interview |
| 3 | `10-common-bugs-cheatsheet.md` | **CRITICAL** — fast scan list |
| 4 | `02-react-deep-dive.md` | Core foundation |
| 5 | `03-state-management.md` | Context API is mentioned in their doc |
| 6 | `04-security.md` | They explicitly call out XSS |
| 7 | `05-performance.md` | They explicitly call out re-renders |
| 8 | `06-resilience.md` | They explicitly call out timeouts/error boundaries |
| 9 | `07-testing.md` | Required: "Add at least one new test" |
| 10 | `08-nextjs-essentials.md` | If repo turns out to be Next |
| 11 | `09-vue-quick-ref.md` | Skim only — fallback safety |
| 12 | `11-ai-strategy-antigravity.md` | Read last, just before interview |

**If you only have 2 hours**: docs 01, 10, 02, 06, 07, 11. In that order.

---

## The 60-minute time budget (Part 1: 15-20 min review, Part 2: 35-40 min code)

### Minute 0-3: Orient. DO NOT CODE.
- `ls`, `cat package.json`, look at `README.md`, look at folder structure.
- Identify: framework (React/Vue/Next), state lib (Redux/Zustand/Context), test runner (Jest/Vitest), styling.
- Run the app. Run tests. **Confirm baseline green** before touching anything.
- **Say out loud**: "I'm going to spend 3 minutes orienting before I touch code."

### Minute 3-18: Code review (Part 1)
- Use the checklist from `01-code-review-playbook.md`.
- Aim for **5-8 meaningful issues**. Quality > quantity.
- For each issue, state: **WHERE, WHY, IMPACT, FIX** (the WWIF format).
- Write them in a scratchpad / comments / a notes file. Visible to interviewer.

### Minute 18-22: Plan Part 2 before coding
- "Here's my plan: I'll fix X first because it's the root cause; then add the feature; then write a test."
- This 4-minute pause is **the strongest senior signal in the interview**. Most candidates dive in.

### Minute 22-50: Implement (Part 2)
- Smallest possible diff.
- Match existing code style — even if you'd write it differently.
- Commit-message-sized changes ("fix: ...", "feat: ...") even if there's no git.

### Minute 50-58: Test + verify
- Write the test BEFORE saying you're done.
- Run the test. Run the full suite. Open the app and click through the happy path AND the edge case.

### Minute 58-60: Wrap
- Summarize: "I fixed X by Y, added a test for Z. Things I'd do next if I had more time: A, B, C."
- The "what I'd do next" list is huge — shows you know your fix is scoped, not complete.

---

## The five senior signals (memorize these)

You should leave the interviewer with all five impressions:

1. **"They read before they wrote."**
   → Spend 3 minutes orienting. Out loud: "Let me understand the data flow first."

2. **"They thought about failure."**
   → For every change: "What happens if this network call fails? What if the user double-clicks? What if the data is empty?"

3. **"They made the minimum change."**
   → Don't refactor. Don't rename. Don't reorganize. Patch the bug, ship the feature, leave the rest.

4. **"They validated."**
   → Test passes. App still works. Edge case checked. They didn't trust the diff to be correct.

5. **"They knew what they didn't do."**
   → "I didn't add retries on the auth endpoint because that's a bigger change — I'd want to discuss the right policy with the team first."

---

## Communication framework: think OUT LOUD

You are being evaluated on **reasoning visible to the interviewer**. Silent typing is a wasted signal.

**Three phrases to use repeatedly:**

> "Before I change this, let me check..."

> "What concerns me about this code is..."

> "I'm choosing X over Y because..."

**Three phrases to NEVER say:**

> "Let me just..." (signals you're not thinking)
> "It probably works" (signals you didn't verify)
> "The AI suggested..." (you own the code; never deflect to AI)

---

## AI tool strategy (compressed — full version in doc 11)

You'll have Antigravity with Gemini Fast/Pro and limited Opus.

**Use AI for:**
- "Explain what this file does" (orientation speed-up)
- "What could go wrong in this function?" (cross-check your review)
- Boilerplate (test scaffolds, type definitions)
- Syntax for unfamiliar libraries

**Do NOT use AI for:**
- Generating fixes you haven't reasoned through first
- Anything where you'd paste output without reading every line
- "Just write the test for me" — write a skeleton yourself, ask AI to fill cases

**The interviewer is watching your prompts.** Good prompts are a signal. Bad prompts ("fix this bug") are a negative signal.

---

## Mental checklist for every change you make

Before you finish any edit, ask:

- [ ] Does this fix the **root cause** or a symptom?
- [ ] Could this break any existing test? Did I run them?
- [ ] What happens if the network is slow / fails / returns empty?
- [ ] What happens if the user does this **twice**?
- [ ] Is there a loading / error / empty state?
- [ ] If two users hit this at once, does it still work? (concurrency)
- [ ] Does this leak memory / subscriptions / timers?
- [ ] Did I add an `any` or `// @ts-ignore`? Why?
- [ ] Is there a test that would have caught this bug?

You won't tick all of these for every change. But running through the list visibly — "let me think about what happens if this fails twice in a row" — is the senior signal.

---

## What to do if you panic / get stuck

1. **Stop typing.** Push back from the keyboard.
2. **State what you know out loud.** "OK so the bug is X, the data flow is Y, I've tried Z."
3. **State what you don't know.** "I'm not sure if this hook re-runs when prop changes."
4. **Pick the smallest experiment.** Add a `console.log`. Read the React docs. Ask Gemini "when does useEffect with [dep] re-run if dep is a new object reference each render?"
5. **Time-box it.** "I'll spend 4 more minutes on this; if I'm not unstuck I'll mock it and move on."

Interviewers respect time-boxing. Junior devs rabbit-hole; seniors triage.

---

## What strong candidates do that weak ones don't

| Weak | Strong |
|---|---|
| Starts coding in minute 1 | Reads + plans for 3-5 min |
| Finds 1-2 surface bugs | Finds 5+ issues across correctness, security, perf, maintainability |
| Fixes symptoms | Fixes root causes; names the symptom-fix tradeoff if they pick symptom |
| Rewrites code that "smells" | Leaves working code alone unless it blocks the task |
| Adds tests last (or skips) | Writes test first or alongside |
| Treats AI as oracle | Treats AI as a faster but error-prone junior dev |
| Silent | Narrates reasoning |
| Says "done" | Says "done, here are 3 things I'd do next" |

---

## Final note before you read the rest

Most of what's in the other docs you already know. The point of reading them is to:
1. Refresh patterns so they come fast under pressure.
2. Build a **mental checklist** so review feels systematic, not random.
3. See concrete examples of bugs so you spot them faster in the live code.

You don't need to memorize. You need to **prime**.

Now go read `01-code-review-playbook.md`.
