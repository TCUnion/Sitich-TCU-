import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../hooks/useAuth';

// mock openStravaAuth，避免真的開 popup
vi.mock('../services/api', () => ({
  openStravaAuth: vi.fn(),
}));

const STORAGE_KEY = 'tcu_auth';

const mockAthlete = {
  id: 12345,
  firstname: 'Test',
  lastname: 'User',
  profile: 'https://example.com/avatar.jpg',
  profile_medium: 'https://example.com/avatar_medium.jpg',
};

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('useAuth — 初始狀態', () => {
  it('未登入時回傳預設值', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.athlete).toBeNull();
    expect(result.current.accessToken).toBeNull();
  });

  it('localStorage 有資料時恢復登入狀態', () => {
    const stored = { athlete: mockAthlete, accessToken: 'token-abc', isLoggedIn: true };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

    const { result } = renderHook(() => useAuth());
    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.accessToken).toBe('token-abc');
    expect(result.current.athlete?.id).toBe(12345);
  });
});

describe('useAuth — postMessage 認證流程', () => {
  it('收到 STRAVA_AUTH_SUCCESS 後更新狀態', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'STRAVA_AUTH_SUCCESS', access_token: 'token-xyz', athlete: mockAthlete },
      }));
    });

    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.accessToken).toBe('token-xyz');
    expect(result.current.athlete?.firstname).toBe('Test');
  });

  it('認證成功後寫入 localStorage', async () => {
    renderHook(() => useAuth());

    await act(async () => {
      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'STRAVA_AUTH_SUCCESS', access_token: 'token-xyz', athlete: mockAthlete },
      }));
    });

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.isLoggedIn).toBe(true);
    expect(stored.accessToken).toBe('token-xyz');
  });

  it('忽略非 STRAVA_AUTH_SUCCESS 的訊息', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'SOME_OTHER_EVENT', access_token: 'token-xyz', athlete: mockAthlete },
      }));
    });

    expect(result.current.isLoggedIn).toBe(false);
  });

  it('access_token 缺失時忽略訊息', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'STRAVA_AUTH_SUCCESS', athlete: mockAthlete },
      }));
    });

    expect(result.current.isLoggedIn).toBe(false);
  });

  it('athlete 缺失時忽略訊息', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'STRAVA_AUTH_SUCCESS', access_token: 'token-xyz' },
      }));
    });

    expect(result.current.isLoggedIn).toBe(false);
  });
});

describe('useAuth — logout', () => {
  it('logout 後重設狀態並清除 localStorage', async () => {
    const stored = { athlete: mockAthlete, accessToken: 'token-abc', isLoggedIn: true };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

    const { result } = renderHook(() => useAuth());
    expect(result.current.isLoggedIn).toBe(true);

    act(() => {
      result.current.logout();
    });

    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.athlete).toBeNull();
    expect(result.current.accessToken).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
