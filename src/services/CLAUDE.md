# services/ — API 服務層

> 路徑索引：[Sitich-TCU小幫手](../../CLAUDE.md) > services/

## 模組職責

集中管理所有**外部資料來源**的存取，包含：

- **Supabase client** — PostgreSQL 資料庫查詢（路段、活動、賽事）
- **REST API** — service.criterium.tw（Strava OAuth、排行榜）

所有元件與 hook 均透過此模組取得資料，禁止在 `App.tsx` 或 hook 中直接呼叫 `fetch`。

## 檔案清單

| 檔案 | 說明 |
|------|------|
| `api.ts` | 唯一服務檔案，匯出 Supabase client 與所有 API 函式 |

## Supabase Client

```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);
```

環境變數需在 `.env.local` 設定：

```
VITE_SUPABASE_URL="https://xxxx.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJ..."
```

## API 端點

### REST API（service.criterium.tw）

| 函式 | 方法 | 路徑 | 說明 |
|------|------|------|------|
| `openStravaAuth()` | — | `/webhook/strava/auth/start` | 開啟 Strava OAuth popup，無回傳值 |
| `getLeaderboard(segmentId, token)` | GET | `/api/leaderboard/:segmentId` | 取得路段排行榜，需 Bearer token |

**API_BASE**：`https://service.criterium.tw`（n8n 服務，非後端 API）

### Supabase 資料表查詢

#### `getUpcomingCyclingEvents(limit = 10)`

```
資料表：cycling_events
條件：date >= 今天
排序：date 正序
欄位：id, title, description, date, time, distance, elevation,
      pace, max_participants, cover_image, region, tags
```

回傳型別：`CyclingEvent[]`

#### `getOfficialEvents(limit = 5)`

```
資料表：events
條件：status = 'published'
排序：event_date 倒序
欄位：id, title, title_en, status, category, event_date,
      cover_image_url, color, highlights
```

回傳型別：`OfficialEvent[]`

## 型別定義

```typescript
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
```

## 資料表關係圖

```
segments_new          ← useSegmentData 主查詢
  ↑ join via id
team_races            ← 覆寫 name / team / og_image
segment_metadata      ← 覆寫 race_description / og_image / team_name

cycling_events        ← 獨立：約騎活動
events                ← 獨立：官方賽事
```

## 關鍵設計決策

1. **單一服務檔案**：所有外部呼叫集中在 `api.ts`，便於追蹤依賴與替換後端。
2. **Supabase anon key**：前端使用匿名金鑰，敏感操作（寫入）需在 Supabase Row Level Security 層管控。
3. **Bearer token 由 useAuth 提供**：`getLeaderboard` 需呼叫方傳入 `accessToken`，服務層不直接讀取 localStorage。
4. **openStravaAuth 開 popup**：`window.open` 而非 `window.location.href`，保留 SPA 狀態。

---

> 最後由 Claude Code 更新：2026-04-04
