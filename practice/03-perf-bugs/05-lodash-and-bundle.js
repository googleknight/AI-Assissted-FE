/**
 * PRACTICE 05 — Bundle size bombs
 * Difficulty: Easy
 * Time target: 90 seconds
 *
 * Task: Audit these imports. Each line has a bundle-size or runtime issue.
 * Provide a smaller alternative.
 */

import _ from 'lodash';                                    // 1
import * as MUI from '@mui/material';                      // 2
import moment from 'moment';                               // 3
import { format } from 'date-fns';                         // 4 (this one — fine?)
import {
  Chart, ArcElement, LineController, BarController,
  LineElement, BarElement, /* ...50 imports... */
} from 'chart.js';                                         // 5
import * as Sentry from '@sentry/react';                   // 6 (loaded eagerly on initial bundle)
import { v4 as uuid } from 'uuid';                         // 7

export const tools = {
  uniq: _.uniq,
  capitalize: _.capitalize,
  isEqual: _.isEqual,
  formatDate: (d) => moment(d).format('YYYY-MM-DD'),
  id: () => uuid(),
};

/**
 * QUESTIONS:
 * 1. For each numbered line, name the issue and a fix:
 *    a. `import _ from 'lodash'` — ~70KB
 *    b. `import * as MUI` — defeats tree-shaking if not careful
 *    c. moment — 67KB + locales
 *    d. date-fns format — fine if tree-shaken (verify with bundle analyzer)
 *    e. chart.js — fine to import only needed parts, but lazy load if chart is below fold
 *    f. Sentry — should be lazy / split out of critical path
 *    g. uuid — small but if you only need it sometimes, dynamic import works
 *
 * 2. What's a "barrel file" and why can it defeat tree-shaking?
 *
 * 3. How do you VERIFY a bundle improvement (not just believe it)?
 */
