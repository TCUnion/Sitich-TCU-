import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../hooks/useAuth';

// mock api，避免真的開 popup 或呼叫 Edge Function
vi.mock('../services/api', () => ({
  openStravaAuth: vi.fn(),
  checkStravaTokenStatus: vi.fn().mockResolvedValue(null),
  fetchAthleteProfile: vi.fn().mockResolvedValue(null),
}));

// mock analytics
vi.mock('../services/analytics', () => ({
  trackEvent: vi.fn(),
  setUserProperties: vi.fn(),
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
  });

  it('localStorage 有資料時恢復登入狀態', () => {
    const stored = { athlete: mockAthlete, isLoggedIn: true };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

    const { result } = renderHook(() => useAuth());
    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.athlete?.id).toBe(12345);
  });

  it('localStorage 有舊版 accessToken 時忽略該欄位', () => {
    const stored = { athlete: mockAthlete, accessToken: 'old-token', isLoggedIn: true };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

    const { result } = renderHook(() => useAuth());
    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.athlete?.id).toBe(12345);
    // accessToken 不再是 hook 回傳值
    expect('accessToken' in result.current).toBe(false);
  });
});

describe('useAuth — postMessage 認證流程', () => {
  it('收到 STRAVA_AUTH_SUCCESS 後更新狀態', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      window.dispatchEvent(new MessageEvent('message', {
        origin: 'https://service.criterium.tw',
        data: { type: 'STRAVA_AUTH_SUCCESS', athlete: mockAthlete },
      }));
    });

    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.athlete?.firstname).toBe('Test');
  });

  it('認證成功後寫入 localStorage', async () => {
    renderHook(() => useAuth());

    await act(async () => {
      window.dispatchEvent(new MessageEvent('message', {
        origin: 'https://service.criterium.tw',
        data: { type: 'STRAVA_AUTH_SUCCESS', athlete: mockAthlete },
      }));
    });

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored.isLoggedIn).toBe(true);
    expect(stored.athlete.id).toBe(12345);
    expect(stored).not.toHaveProperty('accessToken');
  });

  it('忽略非 STRAVA_AUTH_SUCCESS 的訊息', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      window.dispatchEvent(new MessageEvent('message', {
        origin: 'https://service.criterium.tw',
        data: { type: 'SOME_OTHER_EVENT', athlete: mockAthlete },
      }));
    });

    expect(result.current.isLoggedIn).toBe(false);
  });

  it('athlete 缺失時忽略訊息', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      window.dispatchEvent(new MessageEvent('message', {
        origin: 'https://service.criterium.tw',
        data: { type: 'STRAVA_AUTH_SUCCESS' },
      }));
    });

    expect(result.current.isLoggedIn).toBe(false);
  });

  it('不允許的 origin 時忽略訊息', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      window.dispatchEvent(new MessageEvent('message', {
        origin: 'https://evil.com',
        data: { type: 'STRAVA_AUTH_SUCCESS', athlete: mockAthlete },
      }));
    });

    expect(result.current.isLoggedIn).toBe(false);
  });
});

describe('useAuth — logout', () => {
  it('logout 後重設狀態並清除 localStorage', async () => {
    const stored = { athlete: mockAthlete, isLoggedIn: true };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));

    const { result } = renderHook(() => useAuth());
    expect(result.current.isLoggedIn).toBe(true);

    act(() => {
      result.current.logout();
    });

    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.athlete).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
