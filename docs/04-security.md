# 04 — Frontend Security: XSS, Sanitization, Auth, Secrets

> The interview brief **explicitly mentions XSS**. This is the single biggest security risk in frontend code and the easiest issue to find in a brownfield codebase. If you spot one XSS in your review you've made a senior-level catch.

---

## XSS — what it is, why it matters, where it hides

### Three flavors

1. **Reflected XSS** — server reflects user input into HTML without escaping (`?search=<script>...`). Less common in modern SPAs.
2. **Stored XSS** — user input persisted (bio, comment, profile name) is later rendered as HTML to other users. **Most dangerous in SaaS.** A crafted comment runs JS in every viewer's browser.
3. **DOM XSS** — client JS reads user-controlled data and writes it to the DOM unsafely. The kind you'll see in a brownfield React review.

### Why XSS = game over

In the victim's browser session, attacker code can:
- Steal cookies (if not `httpOnly`).
- Steal `localStorage` tokens.
- Make authenticated requests on the user's behalf (change password, transfer funds).
- Read the DOM, including form data and PII.
- Persist (mutate stored data with the user's privileges).

There is no defense once arbitrary JS runs in your origin. Prevention is everything.

---

## Where to find XSS in React/Vue code

### React: `dangerouslySetInnerHTML`

```jsx
<div dangerouslySetInnerHTML={{ __html: user.bio }} />
```

**Always flag this in review.** Ask: is `user.bio` ever user-controlled? Is it sanitized?

Even if "bio is only admin-set," ask: is the admin trusted? Compromised admin → stored XSS against every user.

**Fixes:**
- If text only: just render `{user.bio}` — React escapes by default.
- If markdown: parse with a safe markdown lib (`react-markdown`) — it sanitizes by default but verify.
- If genuine HTML needed: sanitize with **DOMPurify** before render.

```jsx
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(user.bio) }} />
```

DOMPurify is the only widely-trusted sanitizer. Don't roll your own with regex — you will lose to XSS gotchas.

### Vue: `v-html`

```vue
<div v-html="userBio"></div>
```

Same problem. Same fix (sanitize).

### Both: dynamic `href` / `src`

```jsx
<a href={user.website}>visit</a>
<img src={user.avatarUrl} />
```

**Attack:** `user.website = "javascript:alert(document.cookie)"` → user clicks → JS runs.

**Defense:** validate the URL.

```js
function safeUrl(url) {
  try {
    const u = new URL(url, window.location.origin);
    if (!['http:', 'https:', 'mailto:'].includes(u.protocol)) return '#';
    return u.toString();
  } catch {
    return '#';
  }
}
```

### Both: setting `innerHTML` directly

```jsx
useEffect(() => {
  ref.current.innerHTML = userText; // ❌ same as dangerouslySetInnerHTML, hidden
}, [userText]);
```

Watch for indirect uses: `el.outerHTML`, `document.write`, `el.insertAdjacentHTML`.

### Both: `eval`, `new Function`, `setTimeout`/`setInterval` with strings

```js
setTimeout(userInput, 100); // ❌ if userInput is a string, it's eval'd
eval(userExpression);       // ❌ never
new Function(userCode)();   // ❌ never
```

In a brownfield codebase, `eval` is rare but `Function`/`setTimeout(string)` sneak in.

### Both: dangerouslySetInnerHTML for SSR data injection

```jsx
<script dangerouslySetInnerHTML={{ __html: `window.__INITIAL = ${JSON.stringify(data)}` }} />
```

`JSON.stringify` does NOT escape `</script>` or `<!--` or `<script>` in string values. An attacker-controlled field can break out.

**Fix:** escape unsafe chars after stringifying.
```js
const safe = JSON.stringify(data).replace(/</g, '\\u003c');
```

Or use serialize-javascript / a templating library that handles this.

---

## Trust boundaries — the mental model

Draw a line in the data flow: **trusted** vs **untrusted**.

- Anything the user types is untrusted.
- Anything the user uploads is untrusted.
- Anything that came from another user (via your backend) is untrusted.
- Anything from a third-party API is untrusted.
- URL parameters and `window.location` are untrusted (open redirect, XSS).

**Rule:** never let untrusted data cross into a code-execution context (HTML, JS, URL with scriptable protocol, CSS expressions, eval) without sanitization.

---

## CSP — Content Security Policy

A header that tells the browser "only run scripts from these origins."

```
Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.example.com; style-src 'self' 'unsafe-inline'
```

CSP is **defense in depth**. Even if XSS gets injected, the browser refuses to run it.

In an interview: if you see no CSP and the app handles sensitive data, mention it as a hardening recommendation. Don't try to design a CSP live — it's a project, not a 5-minute task.

---

## Authentication & token storage

### The choice

| Approach | XSS risk | CSRF risk | Pros | Cons |
|---|---|---|---|---|
| httpOnly cookie | ✅ safe | ⚠️ needs CSRF token / SameSite | Standard, secure | Server must set cookie; SameSite=Strict breaks some flows |
| localStorage JWT | ❌ exfilable | ✅ safe | Easy to send via Authorization header | One XSS = full account takeover |
| sessionStorage | ❌ exfilable | ✅ safe | Tab-scoped | Lost on tab close |
| In-memory (variable) | ✅ safe | ✅ safe | No persistence vector | Lost on refresh; needs refresh flow |

**Best practice today:** access tokens in memory + refresh tokens in httpOnly+Secure+SameSite cookies. The access token is short-lived; if a tab is XSS'd, the blast radius is the current session.

If you see access tokens in `localStorage`, that's a finding to flag.

### The CSRF problem (only relevant with cookie auth)

If a session cookie is sent automatically with cross-origin requests, a malicious site can submit a form to `your-api.com/transfer` and the cookie tags along. Defenses:
- `SameSite=Strict` or `SameSite=Lax` on the cookie (most modern browsers default to Lax).
- CSRF token in a header that JS must read and send (double-submit pattern).
- Don't rely on `Origin`/`Referer` alone (sometimes stripped).

---

## Secrets in client code

**Anything bundled into the JS that reaches the browser is public.**

- `process.env.API_KEY` in a webpack/vite build → it's in the JS file. Anyone can `view-source`.
- Next.js: only `NEXT_PUBLIC_*` env vars are bundled, but DO NOT put secrets there. Read the prefix as "this is public."
- Stripe publishable key, Mapbox token: OK (designed to be public).
- AWS secret, OpenAI key, Stripe secret key: never. Proxy through your backend.

**Common bug pattern in brownfield:** API key embedded in a client config file from a quick prototype, never rotated.

---

## Other vulnerabilities to scan for

### Open redirect

```js
window.location = new URLSearchParams(location.search).get('next');
```

Attacker sends `?next=https://evil.com`. After login, user is redirected to evil.com. Defense: allowlist destinations or validate same-origin.

### Prototype pollution via merge

```js
function merge(a, b) {
  for (const k in b) a[k] = b[k];
}
merge({}, JSON.parse(userInput));
// if userInput is {"__proto__": {"isAdmin": true}}, Object.prototype is polluted
```

Use safe merge libraries (`lodash` ≥4.17 has fixes, but verify) or `Object.create(null)`.

### Unsafe deserialization

```js
const config = JSON.parse(localStorage.getItem('cfg'));
// later
window[config.handler]();
```

If `config.handler` is attacker-controlled, they can call any global function. Validate against an allowlist.

### Clickjacking

Your app embedded in a hidden iframe on an attacker site to trick users into clicking. Defense: `X-Frame-Options: DENY` or CSP `frame-ancestors 'none'`.

### File upload

- Validate MIME type AND extension server-side (client validation is for UX only).
- Don't render uploaded SVG as `<img src=...>` if it can contain script — SVG can execute JS.
- Don't serve uploads from same origin without protections (or use a separate domain).

### Third-party scripts

```html
<script src="https://cdn.someanalytics.com/v1.js"></script>
```

If that CDN is compromised, attacker code runs on your origin. Defenses:
- Use Subresource Integrity (`integrity="sha384-..."` attribute).
- Self-host critical scripts.
- Pin versions.

---

## CORS — common misunderstandings

CORS is **about browsers protecting users**, not about server security. The server tells the browser "I allow these origins to read my responses."

Common misconceptions:
- "CORS prevents the request" — no. Simple requests still go through; CORS blocks reading the *response*. Preflighted requests are blocked before sending.
- "Allowing `*` is fine" — fine for public data; **fatal** with `Access-Control-Allow-Credentials: true` (browsers refuse this combo, but seeing the attempt signals confusion).
- CORS does not replace auth, CSRF protection, or input validation. It's about who can READ your responses.

In an interview, if you see `Access-Control-Allow-Origin: *` on an authenticated endpoint, flag the conceptual confusion.

---

## Forms and input validation

### Client validation = UX. Server validation = security.

```jsx
<input type="email" required maxLength={100} />
```

This is for UX. Attackers bypass it trivially with curl. Server must validate again. Never trust the client.

### Output encoding matters more than input filtering

The classic mistake: strip `<script>` from input. Attackers use `<img onerror>`, `<svg onload>`, etc. **Encode/escape at output**, don't try to allowlist input.

React/Vue do this for text content. The dangers are the explicit-HTML escape hatches.

---

## Common XSS-related interview review wins

Walk through these in a typical brownfield file:

1. Search for `dangerouslySetInnerHTML` / `v-html`. Every match = flag.
2. Search for `innerHTML =`. Every match = flag.
3. Search for `eval`, `new Function(`, `setTimeout(\``. Flag.
4. Look at every `<a href={...}` / `<img src={...}>` with dynamic value. Verify origin.
5. Look at localStorage uses. Are tokens stored? Flag.
6. Look at `.env` / config files. Any secrets? Flag.
7. Look for third-party `<script>` tags. SRI? Flag if missing.

---

## What to say (and what NOT to say) in the review

**Strong:**

> "This `dangerouslySetInnerHTML` renders user-supplied bio HTML directly. That's stored XSS — a malicious user could craft a bio that runs JS in every other user's session. The fix is sanitizing with DOMPurify or rendering as text. I'd treat this as a ship-blocker."

**Weak:**

> "Don't use `dangerouslySetInnerHTML` — it's dangerous."

The strong version shows: you know the attack class, you know the propagation (stored, multi-user), you know the fix, you've prioritized.

---

## Memorize: the XSS hit list

If you see any of these in 60 seconds of scanning, you have a finding:
- `dangerouslySetInnerHTML`
- `v-html`
- `innerHTML =`, `outerHTML =`, `insertAdjacentHTML`
- `document.write`
- `eval`
- `new Function(`
- `setTimeout(` or `setInterval(` with a string argument
- `<a href={...}` with user data and no URL validation
- localStorage of `token` / `jwt` / `auth`
- `window.location =` with user-controlled value

Next: `05-performance.md`.
