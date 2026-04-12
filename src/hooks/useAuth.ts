import { useState, useEffect, useCallback } from 'react';
import { openStravaAuth, storeStravaToken, checkStravaTokenStatus } from '../services/api';
import { trackEvent, setUserProperties } from '../services/analytics';

export interface AthleteInfo {
  id: number;
  firstname: string;
  lastname: string;
  profile: string;
  profile_medium: string;
  city?: string;
  state?: string;
  country?: string;
}

interface AuthState {
  athlete: AthleteInfo | null;
  accessToken: string | null;
  isLoggedIn: boolean;
  /** 新 Supabase token 狀態 */
  tokenStatus: 'unknown' | 'active' | 'expired' | 'refresh_failed' | 'revoked' | 'not_found';
}

const STORAGE_KEY = 'tcu_auth';

function loadAuth(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...parsed, tokenStatus: 'unknown' };
    }
  } catch {}
  return { athlete: null, accessToken: null, isLoggedIn: false, tokenStatus: 'unknown' };
}

function saveAuth(
  access_token: string,
  athlete: AthleteInfo,
  setAuth: (s: AuthState) => void,
  extra?: { refresh_token?: string; expires_at?: number },
) {
  const newState: AuthState = {
    athlete,
    accessToken: access_token,
    isLoggedIn: true,
    tokenStatus: 'active',
  };
  setAuth(newState);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));

  // 非阻塞：將 token 同步到新 Supabase（集中管理）
  storeStravaToken({
    access_token,
    refresh_token: extra?.refresh_token,
    expires_at: extra?.expires_at,
    athlete,
    source_project: 'STRAVA TCU',
  }).catch(() => {
    // 靜默失敗：新系統儲存失敗不影響登入體驗
  });
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>(loadAuth);

  // 啟動時檢查新 Supabase 的 token 狀態
  useEffect(() => {
    if (!auth.athlete?.id) return;
    checkStravaTokenStatus(auth.athlete.id).then(status => {
      if (!status) return;
      if (status.exists) {
        setAuth(prev => ({
          ...prev,
          tokenStatus: status.token_status === 'active'
            ? (status.is_expired ? 'expired' : 'active')
            : (status.token_status as AuthState['tokenStatus']) ?? 'unknown',
        }));
      } else {
        setAuth(prev => ({ ...prev, tokenStatus: 'not_found' }));
      }
    }).catch(() => {
      // 新系統不可用時不影響舊流程
    });
  }, [auth.athlete?.id]);

  // postMessage 流程（桌面 / Android popup）
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'STRAVA_AUTH_SUCCESS') return;
      const { access_token, athlete, refresh_token, expires_at } = event.data;
      if (!access_token || !athlete) return;
      saveAuth(access_token, athlete, setAuth, { refresh_token, expires_at });
      trackEvent('login', { method: 'strava' });
      setUserProperties({ user_id: String(athlete.id) });
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // iOS Safari fallback：從 URL hash 讀取 redirect 帶回的 token
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes('auth_token')) return;
    const params = new URLSearchParams(hash.replace(/^#\/auth\?/, ''));
    const access_token = params.get('auth_token');
    const athleteRaw = params.get('athlete');
    if (!access_token || !athleteRaw) return;
    try {
      const athlete: AthleteInfo = JSON.parse(athleteRaw);
      const refresh_token = params.get('refresh_token') ?? undefined;
      const expires_at = params.get('expires_at') ? Number(params.get('expires_at')) : undefined;
      saveAuth(access_token, athlete, setAuth, { refresh_token, expires_at });
      window.history.replaceState(null, '', window.location.pathname);
      trackEvent('login', { method: 'strava_ios_fallback' });
      setUserProperties({ user_id: String(athlete.id) });
    } catch {}
  }, []);

  const login = useCallback(() => openStravaAuth(), []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAuth({ athlete: null, accessToken: null, isLoggedIn: false, tokenStatus: 'unknown' });
  }, []);

  return { ...auth, login, logout };
}
