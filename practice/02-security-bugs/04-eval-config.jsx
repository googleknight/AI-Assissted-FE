/**
 * PRACTICE 04 — eval and friends
 * Difficulty: Easy
 * Time target: 60 seconds
 *
 * Task: Spot every code-execution sink. Three are present. Each is a CVE
 * waiting to happen.
 */

import { useEffect, useState } from 'react';

export function DynamicWidget({ widgetConfig }) {
  const [result, setResult] = useState(null);

  useEffect(() => {
    const formula = widgetConfig.formula;
    const compute = new Function('x', `return ${formula}`);
    setResult(compute(10));

    setTimeout(widgetConfig.onMountedJs, 100);

    if (widgetConfig.expression) {
      // legacy dynamic eval — left over from a hackathon
      // eslint-disable-next-line no-eval
      eval(widgetConfig.expression);
    }
  }, [widgetConfig]);

  return <div>Result: {result}</div>;
}

/**
 * QUESTIONS:
 * 1. Identify the three code-execution sinks.
 * 2. What if widgetConfig is loaded from a backend that admins edit?
 *    Why is that not a defense?
 * 3. Replace each with a safe, declarative alternative.
 *    (Hint: small parser / allowlisted operations / function references, not strings.)
 */
