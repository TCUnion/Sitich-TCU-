import { useState, useEffect, useCallback } from 'react';
import { openStravaAuth, checkStravaTokenStatus, fetchAthleteProfile } from '../services/api';
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
  isLoggedIn: boolean;
  /** Supabase token 狀態（伺服器端） */
  tokenStatus: 'unknown' | 'active' | 'expired' | 'refresh_failed' | 'revoked' | 'not_found';
}

const STORAGE_KEY = 'tcu_auth';

function loadAuth(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // 忽略舊版本遺留的 accessToken 欄位
      const { accessToken: _dropped, ...rest } = parsed;
      void _dropped;
      return { ...rest, tokenStatus: 'unknown' };
    }
  } catch {}
  return { athlete: null, isLoggedIn: false, tokenStatus: 'unknown' };
}

function saveAuth(athlete: AthleteInfo, setAuth: (s: AuthState) => void) {
  const newState: AuthState = {
    athlete,
    isLoggedIn: true,
    tokenStatus: 'active',
  };
  setAuth(newState);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
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
    // OAuth redirect chain (Strava → n8n) 會讓瀏覽器把 popup 的 origin 設為 null
    // 因此改為允許 null + 已知來源，並透過 data 結構驗證合法性
    const ALLOWED_ORIGINS: (string | null)[] = [null, 'https://service.criterium.tw'];
    const handleMessage = (event: MessageEvent) => {
      if (!ALLOWED_ORIGINS.includes(event.origin as string | null)) return;
      if (event.data?.type !== 'STRAVA_AUTH_SUCCESS') return;
      const { athlete } = event.data;
      if (!athlete?.id) return;
      saveAuth(athlete, setAuth);
      trackEvent('login', { method: 'strava' });
      setUserProperties({ user_id: String(athlete.id) });
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // iOS Safari fallback：從 URL hash 讀取 athlete_id，再向 strava-proxy 取 athlete 資料
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes('athlete_id')) return;
    const params = new URLSearchParams(hash.replace(/^#\/auth\?/, ''));
    const athleteIdStr = params.get('athlete_id');
    if (!athleteIdStr) return;
    const athleteId = Number(athleteIdStr);
    if (!Number.isFinite(athleteId)) return;

    window.history.replaceState(null, '', window.location.pathname);

    fetchAthleteProfile(athleteId).then(athlete => {
      if (!athlete) return;
      saveAuth(athlete, setAuth);
      trackEvent('login', { method: 'strava_ios_fallback' });
      setUserProperties({ user_id: String(athlete.id) });
    }).catch(() => {
      // profile 取得失敗時靜默忽略，使用者可重新登入
    });
  }, []);

  const login = useCallback(() => openStravaAuth(), []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAuth({ athlete: null, isLoggedIn: false, tokenStatus: 'unknown' });
  }, []);

  return { ...auth, login, logout };
}
