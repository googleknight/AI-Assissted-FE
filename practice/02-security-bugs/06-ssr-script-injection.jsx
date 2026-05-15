/**
 * PRACTICE 06 — SSR script injection / dangerous bootstrapping
 * Difficulty: Hard
 * Time target: 3 minutes
 *
 * Task: This is a Next.js SSR layout that injects bootstrap data into a
 * <script> tag for the client to read. Find the vulnerability. Fix.
 *
 * Hint: think about what `JSON.stringify` does NOT escape.
 */

import React from 'react';

// Imagine `getServerData` returns user-controllable strings, e.g. user.bio.
async function getServerData() {
  return {
    user: { id: 1, name: 'Alice', bio: '...' },
    flags: { newUi: true },
  };
}

export default async function RootLayout({ children }) {
  const data = await getServerData();

  return (
    <html>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__BOOTSTRAP = ${JSON.stringify(data)};`,
          }}
        />
        {children}
      </body>
    </html>
  );
}

/**
 * QUESTIONS:
 * 1. Why isn't JSON.stringify safe here?
 *    Hint: try data.user.bio = "</script><script>alert(1)</script>".
 * 2. What other strings break out? (`<!--`, ` `, ...)
 * 3. Fix A: escape < to < after stringify.
 * 4. Fix B: use a library (`serialize-javascript`) that handles edge cases.
 * 5. Fix C: don't inline — pass data through a meta tag or initial fetch.
 *    Trade-off?
 */
