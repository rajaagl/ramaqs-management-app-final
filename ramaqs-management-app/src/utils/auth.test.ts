import { afterEach, describe, expect, it } from 'vitest';

import {
  getRefreshToken,
  getToken,
  getUserFromStorage,
  isAuthenticated,
  isTokenExpired,
  logout,
  setRefreshToken,
  setToken,
  setUserInStorage,
} from './auth';

afterEach(() => {
  localStorage.clear();
});

function tokenWithExpiry(exp: number) {
  const payload = btoa(JSON.stringify({ exp }));
  return `header.${payload}.signature`;
}

describe('auth storage', () => {
  it('stores and clears the complete session', () => {
    setToken('access-token');
    setRefreshToken('refresh-token');
    setUserInStorage({ id: 'u-1', nom: 'Ramaqs' });

    expect(isAuthenticated()).toBe(true);
    expect(getToken()).toBe('access-token');
    expect(getRefreshToken()).toBe('refresh-token');
    expect(getUserFromStorage()).toEqual({ id: 'u-1', nom: 'Ramaqs' });

    logout();

    expect(isAuthenticated()).toBe(false);
    expect(getToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(getUserFromStorage()).toBeNull();
  });

  it('detects expired and malformed access tokens', () => {
    setToken(tokenWithExpiry(Math.floor(Date.now() / 1000) - 1));
    expect(isTokenExpired()).toBe(true);

    setToken(tokenWithExpiry(Math.floor(Date.now() / 1000) + 3600));
    expect(isTokenExpired()).toBe(false);

    setToken('not-a-jwt');
    expect(isTokenExpired()).toBe(true);
  });
});
