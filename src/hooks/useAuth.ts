import { useState, useEffect } from 'react';
import { openStravaAuth } from '../services/api';

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
}

const STORAGE_KEY = 'tcu_auth';

function loadAuth(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { athlete: null, accessToken: null, isLoggedIn: false };
}

function saveAuth(access_token: string, athlete: AthleteInfo, setAuth: (s: AuthState) => void) {
  const newState: AuthState = { athlete, accessToken: access_token, isLoggedIn: true };
  setAuth(newState);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>(loadAuth);

  // postMessage 流程（桌面 / Android popup）
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'STRAVA_AUTH_SUCCESS') return;
      const { access_token, athlete } = event.data;
      if (!access_token || !athlete) return;
      saveAuth(access_token, athlete, setAuth);
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
      saveAuth(access_token, athlete, setAuth);
      window.history.replaceState(null, '', window.location.pathname);
    } catch {}
  }, []);

  const login = () => openStravaAuth();

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAuth({ athlete: null, accessToken: null, isLoggedIn: false });
  };

  return { ...auth, login, logout };
}
