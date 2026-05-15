# SOLUTIONS — Mini-project TeamSync

> 25 planted bugs/issues. Don't peek until you've done your own pass. Then check what you missed and study those patterns.

---

## 🔴 Ship-blockers (security, crash, data loss)

### B1 — XSS via `member.bio`  (MemberProfile.jsx)
```jsx
<div dangerouslySetInnerHTML={{ __html: member.bio }} />
```
`bio` is user-controlled (a member edits their own profile). Stored XSS — malicious bio runs JS in every viewer's session. Fix: sanitize with DOMPurify, or render as text.

### B2 — XSS via member.notes  (MemberProfile.jsx, api/client.js)
`notesHtml` is stored as HTML on the server (see `updateMemberNotes`). If it's later rendered with `dangerouslySetInnerHTML`, same problem. (Currently it's rendered inside a `<textarea>` which is safe — but the field NAME `notesHtml` + the storage shape signals risk. Flag for clarification.)

### B3 — Auth token in localStorage  (api/client.js)
```js
localStorage.setItem('token', data.token);
```
XSS exfilable. With B1 above, this is one compromise away from full account takeover. Fix: httpOnly+Secure+SameSite cookie set by server.

### B4 — `authedFetch` sends token to ANY URL  (api/client.js)
```js
return fetch(url, { ...opts, headers: { ...opts.headers, Authorization: `Bearer ${getToken()}` }});
```
If caller passes a third-party URL (or a misconfigured relative URL that resolves cross-origin), the token leaks. Fix: validate URL is same-origin or in allowlist.

### B5 — `dangerouslySetInnerHTML` for href without validation  (MemberProfile.jsx)
```jsx
<a href={member.website} target="_blank">
```
`javascript:` URL → click runs JS. Also `target="_blank"` without `rel="noopener noreferrer"` → tabnabbing. Fix: validate protocol; add rel.

### B6 — `member.name` crash on first render  (MemberProfile.jsx)
```jsx
<h2>{member.name}</h2>
```
`member` is `null` on first render. Whole component crashes with no error boundary → broken page. Fix: render loading state until `member` is set.

### B7 — No error boundary anywhere
A single crash (e.g. B6) takes down the entire app. Fix: wrap routes / widgets in `<ErrorBoundary>`.

### B8 — Open redirect via login flow  (App.jsx — implied)
Not present in this exact code, but if the demo login had `?next=...` that'd be an open redirect risk. Worth mentioning as a general posture concern.

---

## 🟠 Important (correctness, race conditions, perf, key UX)

### I1 — Token-restore fetch has no auth check / error handling  (App.jsx)
```jsx
fetch('/api/me', { headers: { Authorization: `Bearer ${token}` }})
  .then(r => r.json()).then(setUser);
```
- No `r.ok` check — a 401 sends `{ error: ... }` to `setUser` and the app thinks they're logged in.
- No catch — promise rejection on network failure is silent.
- Uses raw `fetch` instead of `authedFetch` — bypasses any auth helpers.

### I2 — useEffect with `[]` dep but uses `setUser` (App.jsx)
`setUser` is stable from useState so not a bug, but the effect should still handle the case where the user navigates while the request is in flight (no AbortController).

### I3 — Race condition on `memberId` change  (MemberProfile.jsx)
Click member A → fetch starts. Click member B fast → another fetch. A's response can arrive after B's, overwriting `member`. Fix: AbortController in cleanup.

### I4 — `setNotesDraft(m.notes)` clobbers user's in-progress edits  (MemberProfile.jsx)
If the activity fetch causes a setMember while user is typing notes — wait, no, this sets notes only on the first member fetch. But the second `setMember(prev => ...)` doesn't reset notes. OK. The risk: if `memberId` changes mid-typing, draft is lost. Mention.

### I5 — Activity fetch's `setMember(prev => ({...prev, activity}))`  (MemberProfile.jsx)
If member fetch hasn't resolved yet, `prev` is `null` → `null` spread → crash. Fix: guard `prev != null`.

### I6 — Two parallel fetches for related data, uncoordinated  (MemberProfile.jsx)
One loading state, two requests. UI doesn't know which loaded. Either coordinate (Promise.all) or render activity with its own loading state.

### I7 — `key={i}` in TeamList, list can be filtered  (TeamList.jsx)
Filter changes → React reuses items by index → wrong rows highlight, focus jumps. Fix: `key={m.id}`.

### I8 — `<img src={m.avatarUrl} />` no width/height, no alt  (TeamList.jsx)
CLS + a11y. Set explicit dimensions and `alt={m.name}`.

### I9 — `new Date(m.lastActive).toLocaleString()` per row, every render  (TeamList.jsx)
Hundreds of Date objects per render. Memoize per row, or precompute when team loads, or use a smaller formatter.

### I10 — `addNotification` reads stale `notifications` from closure  (AppContext.jsx)
```js
function addNotification(text) {
  setNotifications([...notifications, { id: Date.now(), text }]);
}
```
If two notifications fire fast, the second sees the same stale list and clobbers the first. Fix: `setNotifications(prev => [...prev, ...])`.

### I11 — Provider value not memoized  (AppContext.jsx)
`value={{ user, setUser, team, ... }}` is a new object every render. Every consumer re-renders on every Provider render. Fix: useMemo. Bigger fix: split contexts.

### I12 — Monolithic context  (AppContext.jsx)
Search (changes per keystroke) shares a context with team data and theme. Every keystroke re-renders every consumer. Fix: split SearchContext out, or move search state into Header and pass via prop.

### I13 — `localStorage.getItem('theme')` on render in useState init  (AppContext.jsx)
Crashes in SSR. (Less critical for CSR-only, but if the app ever moves to Next this breaks.)

### I14 — `refreshTeam` discards loading/error state  (AppContext.jsx)
After add-member, refresh blindly overwrites team. No staleness handling. Better: use React Query mutation invalidation.

### I15 — Missing email validation on add member  (AddMemberForm.jsx)
`<input placeholder="Email" />` with no `type="email"` and no validation. Server probably accepts garbage. Fix: client validation + always server validation.

### I16 — Add member doesn't disable the form during submit  (AddMemberForm.jsx)
User can double-click → double API call. Fix: `disabled={submitting}` + idempotency key on server.

### I17 — Add member has no error handling  (AddMemberForm.jsx)
If `createMember` rejects, form clears silently and user thinks it worked. Fix: try/catch, show error.

### I18 — `useDebouncedValue` missing cleanup  (hooks/useDebouncedValue.js)
```js
useEffect(() => {
  const id = setTimeout(() => setDebounced(value), delay);
}, [value, delay]);
```
No `clearTimeout`. Each keystroke leaves a timer alive → setDebounced fires for every value, not just the last. Defeats debouncing. Fix:
```js
return () => clearTimeout(id);
```

### I19 — FeedbackModal unmounts on close → draft lost  (App.jsx + FeedbackModal.jsx)
`{feedbackOpen && <FeedbackModal />}` destroys state. User loses any typed feedback. Fix: lift state up, keep mounted, or persist to localStorage.

### I20 — `<li onClick>` not keyboard-accessible  (TeamList.jsx)
Should be a `<button>` inside the `<li>`, or the `<li>` needs `role="button"` + `tabIndex={0}` + keydown handler. Screen reader and keyboard users can't select members.

---

## 🟡 Nice-to-have

### N1 — `<button>` without `type="submit"` and `type="button"` distinction  (AddMemberForm, FeedbackModal)
Default is `submit`. The Cancel button in FeedbackModal will accidentally submit if placed inside a form. The "Sign out" / "Theme" buttons are fine outside forms but always specify `type` to be safe.

### N2 — Notification id collision via `Date.now()`  (AppContext.jsx)
Two notifications in the same ms collide. Use `crypto.randomUUID()`.

### N3 — No loading state when team is fetching  (TeamList.jsx, AppContext.jsx)
Empty team and "loading" are indistinguishable.

### N4 — `<small>` for email is questionable styling-as-semantics
Use CSS for sizing; `<small>` has semantic meaning (legalese, side comments).

### N5 — `aria-label` missing on the search input  (Header.jsx)
Placeholder is not a label.

### N6 — `selectedId` in App is lost on refresh
Could be in URL.

### N7 — No "no results" UI when search filters everything out  (TeamList.jsx)

### N8 — No focus management when MemberProfile opens
Keyboard users have to tab through the list to get there.

### N9 — Feedback modal has no focus trap
Tab can escape to elements behind the overlay.

### N10 — Theme stored in localStorage but never persisted on change  (AppContext.jsx)
`setTheme(...)` updates state; nothing writes back to localStorage. Refresh loses the theme.

---

## How to present these in the interview

Don't list 25 bugs in order. Group and prioritize:

> "I'll start with ship-blockers, then move to correctness, then nice-to-have. There are also several patterns I'd flag for systemic fix even if I don't list each instance.
>
> 🔴 Ship-blockers — XSS in member bio, auth token in localStorage, crash from accessing member.name before load, no error boundary anywhere. These I'd fix before any deploy.
>
> 🟠 Important — useDebouncedValue is broken (missing cleanup, so debouncing doesn't actually work), race condition on member switch, monolithic context causes re-renders on every keystroke, add-member form has no error or double-submit handling.
>
> 🟡 Polish — accessibility (li-as-button, missing labels, focus trap), missing loading/empty states, missing test coverage.
>
> Two patterns I'd address structurally rather than instance-by-instance: 1) every fetch in this codebase lacks ok-check, timeout, error state, and abort — I'd introduce a `safeFetch` wrapper or React Query. 2) The Context is doing server-state badly; I'd move team/notifications to React Query and keep Context for genuinely client-only state like theme."

That framing IS the senior signal.

---

## Scoring yourself

- 0-5 findings: re-read the playbook + cheatsheet, do react-bugs / security-bugs again.
- 6-11: Solid. Focus on the categories you missed most.
- 12-18: Strong. You're interview-ready for the review portion.
- 19+: You spotted nearly everything. Practice presenting and prioritization.

---

Now go back to the dashboard, pick one finding (say, useDebouncedValue cleanup), fix it, write a test for it. That's a complete Part-1 + Part-2 simulation.

Good luck.
