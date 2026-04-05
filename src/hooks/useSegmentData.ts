import { useState, useEffect } from 'react';
import { supabase } from '../services/api';

export interface StravaSegment {
  id: number;
  strava_id: number;
  name: string;
  displayName: string;  // 活動名稱（team_races.name > segments_new.name）
  distance: number;
  average_grade: number;
  maximum_grade: number;
  elevation_low: number;
  elevation_high: number;
  total_elevation_gain: number;
  activity_type: string;
  polyline?: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  team?: string;
  og_image?: string;
  race_description?: string;
}

interface UseSegmentDataReturn {
  segments: StravaSegment[];
  isLoading: boolean;
  error: string | null;
}

export function useSegmentData(): UseSegmentDataReturn {
  const [segments, setSegments] = useState<StravaSegment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSegments() {
      try {
        setIsLoading(true);
        setError(null);

        const { data, error: segErr } = await supabase
          .from('segments_new')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: true });

        if (segErr) throw segErr;

        const { data: teamRaces } = await supabase
          .from('team_races')
          .select('segment_id, team_name, name, og_image')
          .eq('is_active', true);

        const { data: segmentMeta } = await supabase
          .from('segment_metadata')
          .select('*');

        const teamRaceMap = new Map<number, { team: string; name: string; og_image?: string }>();
        if (teamRaces) {
          teamRaces.forEach(r => {
            teamRaceMap.set(Number(r.segment_id), { team: r.team_name, name: r.name, og_image: r.og_image });
          });
        }

        const metaMap = new Map<number, Record<string, unknown>>();
        if (segmentMeta) {
          segmentMeta.forEach(m => metaMap.set(Number(m.segment_id), m));
        }

        if (data && data.length > 0) {
          const mapped: StravaSegment[] = data.map(s => {
            const raceInfo = teamRaceMap.get(Number(s.id));
            const meta = metaMap.get(Number(s.id));
            return {
              id: s.id,
              strava_id: s.strava_id || s.id,
              name: s.name,
              displayName: raceInfo?.name || s.name,
              distance: s.distance || 0,
              average_grade: s.average_grade || 0,
              maximum_grade: s.maximum_grade || 0,
              elevation_low: s.elevation_low || 0,
              elevation_high: s.elevation_high || 0,
              total_elevation_gain: s.elevation_gain || 0,
              activity_type: 'Ride',
              polyline: s.polyline,
              description: raceInfo?.name || s.description,
              start_date: s.start_date,
              end_date: s.end_date,
              team: s.team_name || (meta?.team_name as string) || raceInfo?.team,
              og_image: (meta?.og_image as string) || raceInfo?.og_image || s.og_image,
              race_description: meta?.race_description as string,
            };
          });
          setSegments(mapped);
        }
      } catch (e) {
        console.error('Error fetching segments:', e);
        setError('無法載入路段資料');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSegments();
  }, []);

  return { segments, isLoading, error };
}
