/**
 * Write tests for UserList.
 *
 * REQUIRED:
 * 1. Loading state renders initially.
 * 2. On success with users, renders the list.
 * 3. On success with empty array, renders "No users yet".
 * 4. On error, shows error message + Retry button.
 * 5. Clicking Retry re-fetches and recovers.
 *
 * APPROACH:
 * - Mock the `./api` module's fetchUsers.
 * - For each test, set the mock's behavior (resolve / reject).
 * - Use `findBy` for async-appearing elements.
 *
 * STRETCH:
 * - Add an MSW-based version (intercept the actual fetch, leave the api module alone).
 *   Discuss trade-offs: module mock vs MSW.
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserList } from './03-userlist';

vi.mock('./api', () => ({
  fetchUsers: vi.fn(),
}));
import { fetchUsers } from './api';

describe('UserList', () => {
  beforeEach(() => {
    fetchUsers.mockReset();
  });

  // TODO: implement
});
