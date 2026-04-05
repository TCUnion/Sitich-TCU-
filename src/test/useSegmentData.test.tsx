import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// --- Supabase 鏈式查詢模擬工具 ---
function createChain(result: { data: unknown; error: unknown }) {
  const promise = Promise.resolve(result);
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'order', 'in', 'gt', 'gte', 'lte', 'limit'];
  methods.forEach(m => { chain[m] = () => chain; });
  chain['maybeSingle'] = () => Promise.resolve(result);
  chain['then'] = (promise as Promise<unknown>).then.bind(promise);
  chain['catch'] = (promise as Promise<unknown>).catch.bind(promise);
  return chain;
}

const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock('../services/api', () => ({
  supabase: { from: mockFrom },
}));

import { useSegmentData } from '../hooks/useSegmentData';

// 基礎路段資料
const baseSegment = {
  id: 1,
  strava_id: 100,
  name: 'Segment Name',
  description: 'Segment Description',
  distance: 5000,
  average_grade: 3.5,
  maximum_grade: 8.0,
  elevation_low: 100,
  elevation_high: 300,
  elevation_gain: 200,
  polyline: 'abc',
  start_date: '2024-01-01',
  end_date: '2024-06-30',
  team_name: null,
  og_image: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

// 設置三表查詢的 mock（按呼叫順序：segments_new → team_races → segment_metadata）
function setupMocks(
  segments: unknown[],
  teamRaces: unknown[],
  segmentMeta: unknown[],
  segError: unknown = null,
) {
  mockFrom
    .mockReturnValueOnce(createChain({ data: segments, error: segError }))
    .mockReturnValueOnce(createChain({ data: teamRaces, error: null }))
    .mockReturnValueOnce(createChain({ data: segmentMeta, error: null }));
}

describe('useSegmentData — loading 狀態', () => {
  it('初始 isLoading 為 true', () => {
    setupMocks([baseSegment], [], []);
    const { result } = renderHook(() => useSegmentData());
    expect(result.current.isLoading).toBe(true);
  });

  it('資料載入後 isLoading 變為 false', async () => {
    setupMocks([baseSegment], [], []);
    const { result } = renderHook(() => useSegmentData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });
});

describe('useSegmentData — displayName 合併優先序', () => {
  it('有 team_races.name 時使用 team_races.name', async () => {
    setupMocks(
      [baseSegment],
      [{ segment_id: 1, team_name: 'TCU', name: 'Race Name', og_image: null }],
      [],
    );
    const { result } = renderHook(() => useSegmentData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.segments[0].displayName).toBe('Race Name');
  });

  it('無 team_races 時使用 segments_new.description', async () => {
    setupMocks([{ ...baseSegment, description: 'My Description' }], [], []);
    const { result } = renderHook(() => useSegmentData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.segments[0].displayName).toBe('My Description');
  });

  it('無 team_races 且無 description 時 fallback 至 name', async () => {
    setupMocks([{ ...baseSegment, description: null }], [], []);
    const { result } = renderHook(() => useSegmentData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.segments[0].displayName).toBe('Segment Name');
  });
});

describe('useSegmentData — og_image 合併優先序', () => {
  it('segment_metadata.og_image 最優先', async () => {
    setupMocks(
      [{ ...baseSegment, og_image: 'seg_img.jpg' }],
      [{ segment_id: 1, team_name: 'TCU', name: 'R', og_image: 'race_img.jpg' }],
      [{ segment_id: 1, og_image: 'meta_img.jpg', race_description: null, team_name: null }],
    );
    const { result } = renderHook(() => useSegmentData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.segments[0].og_image).toBe('meta_img.jpg');
  });

  it('無 metadata.og_image 時使用 team_races.og_image', async () => {
    setupMocks(
      [{ ...baseSegment, og_image: 'seg_img.jpg' }],
      [{ segment_id: 1, team_name: 'TCU', name: 'R', og_image: 'race_img.jpg' }],
      [{ segment_id: 1, og_image: null, race_description: null, team_name: null }],
    );
    const { result } = renderHook(() => useSegmentData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.segments[0].og_image).toBe('race_img.jpg');
  });
});

describe('useSegmentData — team 合併優先序', () => {
  it('segments_new.team_name 最優先', async () => {
    setupMocks(
      [{ ...baseSegment, team_name: 'From Segment' }],
      [{ segment_id: 1, team_name: 'From Race', name: 'R', og_image: null }],
      [{ segment_id: 1, og_image: null, race_description: null, team_name: 'From Meta' }],
    );
    const { result } = renderHook(() => useSegmentData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.segments[0].team).toBe('From Segment');
  });

  it('無 segments_new.team_name 時用 segment_metadata.team_name', async () => {
    setupMocks(
      [{ ...baseSegment, team_name: null }],
      [{ segment_id: 1, team_name: 'From Race', name: 'R', og_image: null }],
      [{ segment_id: 1, og_image: null, race_description: null, team_name: 'From Meta' }],
    );
    const { result } = renderHook(() => useSegmentData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.segments[0].team).toBe('From Meta');
  });
});

describe('useSegmentData — 錯誤處理', () => {
  it('segments_new 查詢失敗時設定 error 訊息', async () => {
    setupMocks([], [], [], new Error('DB Error'));
    const { result } = renderHook(() => useSegmentData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe('無法載入路段資料');
    expect(result.current.segments).toHaveLength(0);
  });
});

describe('useSegmentData — 空資料', () => {
  it('資料庫回傳空陣列時 segments 為空', async () => {
    setupMocks([], [], []);
    const { result } = renderHook(() => useSegmentData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.segments).toHaveLength(0);
    expect(result.current.error).toBeNull();
  });
});
