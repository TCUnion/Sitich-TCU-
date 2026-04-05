import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Supabase 鏈式查詢模擬工具 ---
function createChain(result: { data: unknown; error: unknown }) {
  const promise = Promise.resolve(result);
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'order', 'in', 'gt', 'gte', 'lte', 'limit', 'like', 'insert', 'update', 'delete', 'upsert'];
  methods.forEach(m => { chain[m] = () => chain; });
  chain['maybeSingle'] = () => Promise.resolve(result);
  chain['then'] = (promise as Promise<unknown>).then.bind(promise);
  chain['catch'] = (promise as Promise<unknown>).catch.bind(promise);
  return chain;
}

// mock @supabase/supabase-js，讓 api.ts 內部的 supabase.from 也被攔截
const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ from: mockFrom }),
}));

import { getSegmentRankMap, getMySegmentBestEfforts, getUpcomingCyclingEvents } from '../services/api';

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================
// getUpcomingCyclingEvents
// ============================================================
describe('getUpcomingCyclingEvents', () => {
  const MOCK_EVENTS = [
    { id: 'evt-5',                       title: '136縣道練車團',                              date: '2026-04-05', time: '06:00', distance: 30,  elevation: 200, pace: '中', max_participants: 20, cover_image: null, region: '南投', tags: [] },
    { id: 'evt-1775032024703-rr2z1',      title: '2026 DEDA Ride 國王盃：中寮約騎大挑戰',    date: '2026-04-12', time: '07:00', distance: 60,  elevation: 800, pace: '快', max_participants: 50, cover_image: null, region: '南投', tags: ['挑戰賽'] },
    { id: 'evt-6',                        title: '日月潭環湖輕騎行',                           date: '2026-04-13', time: '08:00', distance: 35,  elevation: 300, pace: '輕鬆', max_participants: 30, cover_image: null, region: '南投', tags: [] },
  ];

  it('回傳的清單包含 4/12 活動', async () => {
    mockFrom.mockReturnValue(createChain({ data: MOCK_EVENTS, error: null }));
    const events = await getUpcomingCyclingEvents();
    const apr12 = events.find(e => e.date === '2026-04-12');
    expect(apr12).toBeDefined();
    expect(apr12?.title).toBe('2026 DEDA Ride 國王盃：中寮約騎大挑戰');
    expect(apr12?.time).toBe('07:00');
  });

  it('Supabase 回傳錯誤時 throw', async () => {
    mockFrom.mockReturnValue(createChain({ data: null, error: new Error('DB error') }));
    await expect(getUpcomingCyclingEvents()).rejects.toThrow('DB error');
  });

  it('無資料時回傳空陣列', async () => {
    mockFrom.mockReturnValue(createChain({ data: null, error: null }));
    const events = await getUpcomingCyclingEvents();
    expect(events).toEqual([]);
  });

  it('回傳筆數不超過 limit', async () => {
    mockFrom.mockReturnValue(createChain({ data: MOCK_EVENTS.slice(0, 2), error: null }));
    const events = await getUpcomingCyclingEvents(2);
    expect(events.length).toBeLessThanOrEqual(2);
  });
});

// ============================================================
// getSegmentRankMap
// ============================================================
describe('getSegmentRankMap', () => {
  it('空 segmentIds 陣列直接回傳空 Map', async () => {
    const result = await getSegmentRankMap([], new Map());
    expect(result.size).toBe(0);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('自己最快時名次為 1', async () => {
    // 資料庫回傳 2 筆成績：100, 200
    mockFrom.mockReturnValue(createChain({
      data: [
        { segment_id: 1, elapsed_time: 100 },
        { segment_id: 1, elapsed_time: 200 },
      ],
      error: null,
    }));

    const myTimes = new Map([[1, 90]]); // 自己 90 秒，比 100 和 200 都快
    const result = await getSegmentRankMap([1], myTimes);

    expect(result.get(1)?.rank).toBe(1);
    expect(result.get(1)?.total).toBe(2);
  });

  it('自己最慢時名次為 total + 1', async () => {
    mockFrom.mockReturnValue(createChain({
      data: [
        { segment_id: 1, elapsed_time: 100 },
        { segment_id: 1, elapsed_time: 150 },
      ],
      error: null,
    }));

    const myTimes = new Map([[1, 200]]); // 自己 200 秒，比兩筆都慢
    const result = await getSegmentRankMap([1], myTimes);

    expect(result.get(1)?.rank).toBe(3);
    expect(result.get(1)?.total).toBe(2);
  });

  it('某路段無個人成績時跳過該路段', async () => {
    mockFrom.mockReturnValue(createChain({
      data: [{ segment_id: 1, elapsed_time: 100 }],
      error: null,
    }));

    const myTimes = new Map<number, number>(); // 沒有成績
    const result = await getSegmentRankMap([1], myTimes);

    expect(result.has(1)).toBe(false);
  });
});

// ============================================================
// getMySegmentBestEfforts
// ============================================================
describe('getMySegmentBestEfforts', () => {
  it('單筆成績正確存入 Map', async () => {
    mockFrom.mockReturnValue(createChain({
      data: [{ segment_id: 10, elapsed_time: 300, activity_id: 999 }],
      error: null,
    }));

    const result = await getMySegmentBestEfforts(123);

    expect(result.size).toBe(1);
    expect(result.get(10)?.elapsedTime).toBe(300);
    expect(result.get(10)?.activityId).toBe(999);
    expect(result.get(10)?.count).toBe(1);
  });

  it('多筆同路段成績保留最快時間', async () => {
    mockFrom.mockReturnValue(createChain({
      data: [
        { segment_id: 10, elapsed_time: 300, activity_id: 1 },
        { segment_id: 10, elapsed_time: 250, activity_id: 2 },
        { segment_id: 10, elapsed_time: 280, activity_id: 3 },
      ],
      error: null,
    }));

    const result = await getMySegmentBestEfforts(123);

    expect(result.get(10)?.elapsedTime).toBe(250);
    expect(result.get(10)?.activityId).toBe(2);
  });

  it('多筆同路段成績累計 count', async () => {
    mockFrom.mockReturnValue(createChain({
      data: [
        { segment_id: 10, elapsed_time: 300, activity_id: 1 },
        { segment_id: 10, elapsed_time: 250, activity_id: 2 },
        { segment_id: 10, elapsed_time: 280, activity_id: 3 },
      ],
      error: null,
    }));

    const result = await getMySegmentBestEfforts(123);

    expect(result.get(10)?.count).toBe(3);
  });

  it('多個不同路段各自存入 Map', async () => {
    mockFrom.mockReturnValue(createChain({
      data: [
        { segment_id: 10, elapsed_time: 300, activity_id: 1 },
        { segment_id: 20, elapsed_time: 400, activity_id: 2 },
      ],
      error: null,
    }));

    const result = await getMySegmentBestEfforts(123);

    expect(result.size).toBe(2);
    expect(result.get(10)?.elapsedTime).toBe(300);
    expect(result.get(20)?.elapsedTime).toBe(400);
  });

  it('資料為空時回傳空 Map', async () => {
    mockFrom.mockReturnValue(createChain({ data: [], error: null }));
    const result = await getMySegmentBestEfforts(123);
    expect(result.size).toBe(0);
  });
});
