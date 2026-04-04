# hooks/ — 狀態管理 Hooks

> 路徑索引：[Sitich-TCU小幫手](../../CLAUDE.md) > hooks/

## 模組職責

管理應用程式的**非同步狀態**與**副作用邏輯**，將資料取得、認證管理等關注點從 `App.tsx` 分離。目前包含兩支 hook：

- `useAuth`：管理 Strava OAuth 登入狀態，透過 `postMessage` 接收 popup 回傳的 token，並以 `localStorage` 跨頁保留。
- `useSegmentData`：向 Supabase 查詢三張表並合併路段資料，供 ExploreScreen / RaceDetailScreen 使用。

## Hooks 清單

| Hook | 檔案 | 職責 | 回傳值 |
|------|------|------|--------|
| `useAuth` | `useAuth.ts` | Strava 認證狀態管理 | `{ athlete, accessToken, isLoggedIn, login(), logout() }` |
| `useSegmentData` | `useSegmentData.ts` | Supabase 路段資料查詢與合併 | `{ segments, isLoading, error }` |

## useAuth 詳解

### 介面

```typescript
// 從 Strava API 取得的運動員基本資料
export interface AthleteInfo {
  id: number;
  firstname: string;
  lastname: string;
  profile: string;          // 大頭照 URL（高解析度）
  profile_medium: string;   // 大頭照 URL（中解析度）
  city?: string;
  state?: string;
  country?: string;
}
```

### 認證流程

1. `login()` → 呼叫 `openStravaAuth()`，開啟 popup 視窗
2. Popup 完成 Strava OAuth 後，n8n webhook 傳送 `postMessage`
3. `useEffect` 中的 `handleMessage` 監聽 `STRAVA_AUTH_SUCCESS` 事件
4. 成功後更新 state 並寫入 `localStorage`（key: `tcu_auth`）
5. `logout()` 清除 localStorage 並重設 state

### 持久化

```typescript
const STORAGE_KEY = 'tcu_auth';
// 結構：{ athlete: AthleteInfo | null, accessToken: string | null, isLoggedIn: boolean }
```

頁面重新整理時從 `localStorage` 恢復狀態（`loadAuth()` 在 `useState` 初始化時執行）。

## useSegmentData 詳解

### 回傳的 StravaSegment 型別

```typescript
export interface StravaSegment {
  id: number;
  strava_id: number;
  name: string;
  distance: number;          // 公尺
  average_grade: number;     // %
  maximum_grade: number;     // %
  elevation_low: number;     // 公尺
  elevation_high: number;    // 公尺
  total_elevation_gain: number;
  activity_type: string;     // 固定為 'Ride'
  polyline?: string;         // Google Encoded Polyline
  description?: string;
  start_date?: string;
  end_date?: string;
  team?: string;
  og_image?: string;
  race_description?: string;
}
```

### 3-Table 合併邏輯

查詢順序：
1. `segments_new`（`is_active = true`，日期正序）
2. `team_races`（`is_active = true`）→ 建立 `Map<segment_id, { team, name, og_image }>`
3. `segment_metadata`（全量）→ 建立 `Map<segment_id, metadata>`

合併優先序（欄位層級）：

| 欄位 | 優先順序 |
|------|---------|
| `description` | `team_races.name` > `segments_new.description` |
| `team` | `segments_new.team_name` > `segment_metadata.team_name` > `team_races.team` |
| `og_image` | `segment_metadata.og_image` > `team_races.og_image` > `segments_new.og_image` |
| `race_description` | `segment_metadata.race_description` |

## 關鍵設計決策

1. **Popup + postMessage 而非 redirect**：避免整頁跳轉中斷 SPA 狀態，popup 完成後直接回傳 token 給父視窗。
2. **localStorage 持久化**：`tcu_auth` key 存放完整 auth state，頁面重整後無需重新登入。
3. **並行三表查詢**：`useSegmentData` 發出三次 Supabase 查詢（非 JOIN），在 JS 層做 Map 合併，彈性較高且避免複雜 SQL。
4. **活動過濾**：`segments_new` 僅取 `is_active = true` 的記錄；`team_races` 同樣只取 active 賽事。

---

> 最後由 Claude Code 更新：2026-04-04
