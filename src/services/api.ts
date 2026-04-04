import { createClient } from '@supabase/supabase-js';

const API_BASE = 'https://service.criterium.tw';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);

export function openStravaAuth(): void {
  window.open(
    `${API_BASE}/webhook/strava/auth/start`,
    'strava-auth',
    'width=600,height=700,left=200,top=100'
  );
}

export async function getLeaderboard(segmentId: string, token: string) {
  const res = await fetch(`${API_BASE}/api/leaderboard/${segmentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  return res.json();
}

export interface CyclingEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  distance: number;
  elevation: number;
  pace: string;
  max_participants: number;
  cover_image: string | null;
  region: string;
  tags: string[];
}

export interface OfficialEvent {
  id: string;
  title: string;
  title_en: string;
  status: string;
  category: string;
  event_date: string;
  cover_image_url: string | null;
  color: string | null;
  highlights: { label: string; content: string }[];
}

/** 取得近期約騎活動（今日起，日期正序，最多 10 筆） */
export async function getUpcomingCyclingEvents(limit = 10): Promise<CyclingEvent[]> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('cycling_events')
    .select('id, title, description, date, time, distance, elevation, pace, max_participants, cover_image, region, tags')
    .gte('date', today)
    .order('date', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

/** 取得指定運動員的報名路段 ID 清單 */
export async function getMyRegistrations(athleteId: number): Promise<number[]> {
  const { data } = await supabase
    .from('registrations')
    .select('segment_id')
    .eq('strava_athlete_id', athleteId);
  return (data ?? []).map(r => Number(r.segment_id));
}

/** 報名挑戰 */
export async function registerChallenge(
  athleteId: number,
  athleteName: string,
  segmentId: number,
  athleteProfile?: string | null,
  team?: string,
  tcuId?: string | null,
): Promise<void> {
  const { error } = await supabase
    .from('registrations')
    .upsert({
      id: crypto.randomUUID(),
      strava_athlete_id: athleteId,
      athlete_name: athleteName,
      segment_id: segmentId,
      athlete_profile: athleteProfile ?? null,
      team: team ?? '',
      tcu_id: tcuId ?? null,
      status: 'approved',
    });
  if (error) throw error;
}

export interface RegistrationRecord {
  strava_athlete_id: number;
  athlete_name: string;
  athlete_profile: string | null;
  team: string;
}

/** 取得指定路段的所有報名者（依報名時間正序） */
export async function getSegmentRegistrations(segmentId: number): Promise<RegistrationRecord[]> {
  const { data } = await supabase
    .from('registrations')
    .select('strava_athlete_id, athlete_name, athlete_profile, team')
    .eq('segment_id', segmentId)
    .order('registered_at', { ascending: true, nullsFirst: false });
  return (data ?? []) as RegistrationRecord[];
}

/** 取得指定路段的成績（來自 segment_elapsed_times 表） */
export async function getSegmentElapsedTimes(segmentId: number): Promise<Map<number, number>> {
  const { data } = await supabase
    .from('segment_elapsed_times')
    .select('strava_athlete_id, elapsed_time')
    .eq('segment_id', segmentId);
  const map = new Map<number, number>();
  (data ?? []).forEach(r => map.set(Number(r.strava_athlete_id), Number(r.elapsed_time)));
  return map;
}

/** 取得指定運動員在所有路段的成績（segment_id → elapsed_time） */
export async function getMySegmentElapsedTimes(athleteId: number): Promise<Map<number, number>> {
  const { data } = await supabase
    .from('segment_elapsed_times')
    .select('segment_id, elapsed_time')
    .eq('strava_athlete_id', athleteId);
  const map = new Map<number, number>();
  (data ?? []).forEach(r => map.set(Number(r.segment_id), Number(r.elapsed_time)));
  return map;
}

/** 取消報名 */
export async function unregisterChallenge(athleteId: number, segmentId: number): Promise<void> {
  const { error } = await supabase
    .from('registrations')
    .delete()
    .eq('strava_athlete_id', athleteId)
    .eq('segment_id', segmentId);
  if (error) throw error;
}

export interface TCUMemberProfile {
  email: string;
  real_name: string | null;
  name: string | null;
  account: string | null;
  nickname: string | null;
  team: string | null;
  tcu_id: string | null;
  member_type: string | null;
  profile_photo: string | null;
  gender: string | null;
  birthday: string | null;
  nationality: string | null;
  phone: string | null;
  address: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  emergency_relation: string | null;
  self_introduction: string | null;
  self_intro: string | null;
  skills: string | null;
}

/** 透過 Strava athlete ID 查詢 TCU 會員資料（兩步查詢：bindings → tcu_members） */
export async function getTCUMemberByStravaId(athleteId: number): Promise<TCUMemberProfile | null> {
  const { data: bindings } = await supabase
    .from('strava_member_bindings')
    .select('tcu_member_email, tcu_account')
    .eq('strava_id', String(athleteId))
    .limit(1);
  if (!bindings || bindings.length === 0) return null;
  const { tcu_member_email, tcu_account } = bindings[0];
  let query = supabase
    .from('tcu_members')
    .select('email, real_name, name, account, nickname, team, tcu_id, member_type, profile_photo, gender, birthday, nationality, phone, address, emergency_contact, emergency_phone, emergency_relation, self_introduction, self_intro, skills');
  if (tcu_account) {
    query = query.eq('account', tcu_account);
  } else if (tcu_member_email) {
    query = query.eq('email', tcu_member_email);
  } else {
    return null;
  }
  const { data } = await query.limit(1);
  return data?.[0] ?? null;
}

/** 取得官方賽事（published，日期倒序） */
export async function getOfficialEvents(limit = 5): Promise<OfficialEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select('id, title, title_en, status, category, event_date, cover_image_url, color, highlights')
    .eq('status', 'published')
    .order('event_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}
