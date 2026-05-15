# 01 — Code Review Playbook (Part 1 of the interview)

> The first 15-20 minutes are a structured code review. This doc gives you a **systematic checklist** so you don't randomly walk the code — you scan it across known risk categories. Strong candidates find ≥5 issues.

---

## How to communicate every finding: the WWIF format

For every issue you flag:

- **WHERE** — file + line, or "in the `useEffect` on line 42"
- **WHY** — the underlying engineering principle violated
- **IMPACT** — what breaks in production, for whom, how often
- **FIX** — at least a sketch (you don't have to implement)

**Bad finding:** "This component re-renders too much."

**Good finding:** "In `Sidebar.tsx:42`, the `useEffect` dep array contains an object literal `{ id }` — that's a new reference every render, so the effect fires every render. Impact: we re-fetch user data on every parent state change, which means the avatar flickers and we hammer the API. Fix: destructure `id` into a primitive and use `[id]` as the dep, or memoize the object with `useMemo`."

That's a 4x stronger signal in 2x the words.

---

## The seven review lenses (run through ALL of them)

Walk the code through each lens. Most candidates only do 1-2.

### Lens 1: Correctness
Does the code do what it claims?
- Off-by-one errors (pagination, slicing arrays)
- Mishandled empty arrays / null / undefined
- Wrong comparison (`==` vs `===`, NaN, truthy of `0`/`""`)
- Conditional logic that doesn't cover all branches
- Async race conditions (stale responses overwriting fresh ones)
- Floating-point money math
- Date/timezone handling (using `new Date()` without UTC awareness)

### Lens 2: Reliability / failure modes
What happens when things go wrong?
- No `try/catch` around `fetch` / `await`
- No timeout on network calls
- No retry, or naive infinite retry
- No loading / error / empty UI state
- Promise unhandled rejection
- Unbounded growth (subscriptions that aren't cleaned up, growing arrays in state)
- Crashes that take down the whole tree (need error boundary)

### Lens 3: Security
The interview doc explicitly calls out XSS — scan for this hard.
- `dangerouslySetInnerHTML` with unsanitized input
- `v-html` in Vue with user content
- `eval` / `new Function` / `setTimeout(string)`
- User content rendered into `href` (`javascript:`) or `src`
- Secrets / API keys in client code (`.env` without `NEXT_PUBLIC_` consideration)
- Auth tokens in `localStorage` (vulnerable to XSS exfil)
- CORS misconfig that allows `*` for credentialed requests
- Missing CSRF tokens on state-changing requests
- SQL/template injection if you see raw string concat into queries
- Open redirects (`window.location = userInput`)

### Lens 4: Performance
The interview doc explicitly calls out unnecessary re-renders.
- Inline object/array/function props (`onClick={() => ...}`, `style={{...}}`) on memoized children
- `useEffect` with object/array deps recreated each render
- Lists without `key`, or `key={index}` when list reorders
- Filter/map/sort recomputed every render instead of memoized
- Large lists without virtualization
- Synchronous heavy work on main thread
- Re-fetching identical data on every navigation (no cache)
- Bundle bloat: importing a whole library for one function (`import _ from 'lodash'`)
- Images without `width`/`height` (causes CLS) or unoptimized format
- N+1 fetch pattern in a component (each list item fires its own request)

### Lens 5: Maintainability
- Deep prop drilling (>3 levels) where Context or a store would be cleaner
- God components (>300 lines, multiple responsibilities)
- Hardcoded magic numbers / strings
- Inconsistent naming (`userId` here, `user_id` there)
- Mixed concerns (data fetching + UI + business logic in one component)
- Duplicated logic across files (DRY violation)
- Comments explaining WHAT instead of WHY
- TypeScript `any` or `as unknown as Foo` casts
- Missing TS types on public API surface
- Dead code / commented-out blocks

### Lens 6: Accessibility (often forgotten — easy win)
- `<div onClick>` instead of `<button>`
- Missing `alt` on images
- Form inputs without `<label>` association
- Color-only signals (red text only, no icon)
- Focus trap missing in modal
- Missing `aria-*` on custom widgets
- Heading hierarchy skips (h1 → h3)
- Tab order broken

### Lens 7: Observability / debuggability
- No error logging (errors swallowed in `catch`)
- No analytics on critical paths
- `console.log` left in code
- Errors logged without context (just the message, no request ID)
- No way to tell from logs whether a failure was network, auth, or app bug

---

## The 5-minute speed-review script

When time is tight, follow this exact sequence:

### Step 1 (1 min): Map the data flow
- Where does data enter? (`fetch`, `axios`, `useQuery`, props, context)
- Where does it live? (`useState`, context, Zustand, Redux)
- Who reads it? (which components consume which slices)

Draw it mentally: `API → fetch hook → context → component → UI`. Each arrow is a place a bug could live.

### Step 2 (2 min): Hot spots
Open these files first in this order:
1. The root data provider / context
2. The form / input components (user input = security risk)
3. The list rendering component (perf risk)
4. The "edit" / "submit" path (correctness + security)
5. `package.json` (look for outdated/risky deps, missing scripts)

### Step 3 (2 min): Tests
- What's covered? What ISN'T?
- Empty / error / loading states usually aren't.
- Edge cases (very long strings, special characters, simultaneous actions) usually aren't.
- That's where you'll add YOUR test.

---

## A worked example: reviewing this snippet

```jsx
function UserProfile({ userId }) {
  const [user, setUser] = useState();
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(r => r.json())
      .then(setUser);
    fetch(`/api/users/${userId}/posts`)
      .then(r => r.json())
      .then(setPosts);
  }, [userId]);

  return (
    <div>
      <h1>{user.name}</h1>
      <div dangerouslySetInnerHTML={{ __html: user.bio }} />
      {posts.map(p => <div onClick={() => alert(p.id)}>{p.title}</div>)}
    </div>
  );
}
```

Issues a senior should find in 60 seconds:

| # | Lens | Issue | Impact | Fix sketch |
|---|---|---|---|---|
| 1 | Correctness | `user` is undefined on first render but `user.name` accesses it → crash | App crashes on first paint of profile page | Render loading state if `!user` |
| 2 | Reliability | No `try/catch` on fetches → unhandled rejection on network failure | Silent failure, user sees blank page, no error reported | Wrap in try/catch, show error UI |
| 3 | Reliability | No loading state | User stares at blank screen | Add `isLoading` |
| 4 | Reliability | No abort on unmount → stale `setUser` after navigation → React warning + memory leak | Memory leaks; stale data flashes on re-mount | `AbortController` + cleanup |
| 5 | Reliability | Race condition: if `userId` changes mid-fetch, posts can resolve out of order, second user's posts could be set first then overwritten | User B sees user A's posts briefly | Track latest request id, ignore stale |
| 6 | Security | `dangerouslySetInnerHTML` on `user.bio` — bio is user-controlled → stored XSS | Account takeover via crafted bio | Sanitize with DOMPurify, or render as text |
| 7 | Perf | `onClick={() => alert(p.id)}` creates new fn each render → if `div` were memoized, breaks memo | Minor unless list grows; teaches the pattern | Hoist handler or use event delegation |
| 8 | Correctness | List has no `key` prop | React warning + bad reconciliation when reordering | Add `key={p.id}` |
| 9 | A11y | `div onClick` is not keyboard-accessible | Keyboard users can't activate | Use `<button>` |
| 10 | Maintainability | Two `fetch` calls for related data are not coordinated → no shared loading state, harder to extend | Bug-prone as it grows | Extract into a custom hook `useUserProfile(userId)` |
| 11 | Observability | Errors swallowed silently | Can't debug in prod | Log on failure |

**That's 11 findings in a tiny snippet.** You won't find all 11 in 15 minutes — but the discipline of scanning each lens means you'll find 6-8 instead of the 2-3 most candidates find.

---

## Common rookie review mistakes

- **Stylistic nitpicks first.** "I'd rename this variable." Don't lead with this. Lead with correctness + security.
- **Refactoring suggestions.** "I'd extract this into 3 components." Out of scope unless asked.
- **Vague impact.** "This could be a problem." Always quantify: "When the list is >100 items, this becomes ~500ms slower because..."
- **No prioritization.** List them ranked: ship-blockers, important, nice-to-have. Senior signal.
- **Missing root causes.** "The fetch fails sometimes" — dig: why? Network? Timing? Auth? Wrong URL?

---

## The "what would I ship today" hierarchy

When you present findings, group them:

**🔴 Ship-blockers** (security, data loss, crashes for normal users)
**🟠 Important** (correctness in edge cases, perf on common paths)
**🟡 Nice-to-have** (maintainability, a11y polish, naming)

This grouping IS the senior signal. It tells the interviewer: "I've worked in real prod environments where you can't fix everything."

---

## A scratchpad template (open a notes file or comment block at the top of any file)

```
=== REVIEW NOTES ===

🔴 BLOCKERS
1. [file:line] XSS via dangerouslySetInnerHTML — fix by sanitizing
2. [file:line] Crash on undefined user — needs loading state

🟠 IMPORTANT
3. [file:line] Race condition on userId change — abort previous
4. [file:line] No retry / no timeout on critical fetch
5. [file:line] List re-renders every keystroke because filter not memoized

🟡 NICE-TO-HAVE
6. [file:line] Magic number `500` — extract as constant
7. [file:line] `div onClick` should be `<button>`

QUESTIONS
- Is there a global error boundary somewhere I missed?
- Is the auth token in localStorage intentional? (XSS exfil risk)
```

Show this to the interviewer. It's a visible artifact of your review.

---

## What to say while reviewing (talking points)

> "Let me start by mapping the data flow before I judge any code."

> "I'm going to walk through this with a few lenses: correctness, reliability, security, perf, maintainability."

> "This is the kind of pattern that's fine in isolation but breaks under concurrent updates — let me flag that."

> "I'd ship a fix for this today; this one I'd put in next sprint."

> "I'm seeing a symptom here. Let me trace upstream before I decide."

These sound rehearsed in writing. **They will land naturally if you've internalized the framework.**

Now go to `10-common-bugs-cheatsheet.md` for the fast-scan list of specific bugs.
