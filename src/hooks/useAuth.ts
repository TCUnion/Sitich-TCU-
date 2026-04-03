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

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>(loadAuth);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== 'STRAVA_AUTH_SUCCESS') return;
      const { access_token, athlete } = event.data;
      if (!access_token || !athlete) return;
      const newState: AuthState = { athlete, accessToken: access_token, isLoggedIn: true };
      setAuth(newState);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const login = () => openStravaAuth();

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAuth({ athlete: null, accessToken: null, isLoggedIn: false });
  };

  return { ...auth, login, logout };
}
