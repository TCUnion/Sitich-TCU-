# components/ — 共用元件

> 路徑索引：[Sitich-TCU小幫手](../../CLAUDE.md) > components/

## 模組職責

存放**可重用的 UI 元件**，這些元件不屬於特定 Screen，而是可跨畫面共享的視覺或功能單元。

目前包含一個元件：`MapThumbnail`，用於在賽事卡片或詳情頁面顯示靜態路段地圖。

## 元件清單

| 元件 | 檔案 | 職責 |
|------|------|------|
| `MapThumbnail` | `MapThumbnail.tsx` | 根據 Google Encoded Polyline 渲染靜態地圖縮圖（CartoDB tiles + SVG 路線疊加） |
| `decodePolyline` | `MapThumbnail.tsx` | 工具函式：解碼 Google Encoded Polyline 為座標陣列（同檔案匯出） |

## MapThumbnail 技術細節

### Props 介面

```typescript
function MapThumbnail({ encoded }: { encoded: string })
// encoded：Google Encoded Polyline 字串（來自 Supabase segments_new.polyline）
```

### 渲染流程

1. **解碼 polyline**：`decodePolyline(encoded)` → `[lat, lng][]`
2. **計算邊界框**：取所有點的 min/max lat/lng
3. **選擇縮放等級**：`bestZoom()` 從 z=16 往下找，確保路線在容器內的 65% 以內
4. **計算地圖中心**：邊界框中心點 → Web Mercator 像素座標
5. **計算需要的 tile 範圍**：根據容器尺寸和中心位置決定起終 tile index
6. **渲染 CartoDB 底圖**：`dark_all` 風格，使用 `a/b/c/d` 四個 sub-domain 輪流請求分散負載
7. **SVG 疊加路線**：雙層 polyline（外層橙色半透明作光暈，內層橙色實線）

### 地圖投影公式（Web Mercator）

```typescript
// 經緯度 → 世界像素座標
function worldPx(lat: number, lng: number, z: number): [number, number] {
  const n = 1 << z;
  const x = (lng + 180) / 360 * n * TILE;
  const sinLat = Math.sin(lat * Math.PI / 180);
  const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * n * TILE;
  return [x, y];
}
```

### CartoDB Tile URL 格式

```
https://{sub}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png
sub = ['a', 'b', 'c', 'd'][(tx + ty) % 4]
```

### SVG 路線樣式

| 層次 | stroke | strokeWidth | opacity | 效果 |
|------|--------|-------------|---------|------|
| 外層（光暈）| `#FF4D00` | 5 | 0.25 | 橙色光暈 |
| 內層（主線）| `#FF5500` | 2 | 1.0 | 橙色實線 |

### decodePolyline 工具函式

實作 Google Encoded Polyline Algorithm Format（RFC），可獨立匯入：

```typescript
import { decodePolyline } from '../components/MapThumbnail';
const points = decodePolyline(encoded); // → [[lat, lng], ...]
```

### 使用範例

```tsx
import { MapThumbnail } from '../components/MapThumbnail';

// 在賽事卡片中
{segment.polyline && (
  <div className="w-full h-40 rounded-xl overflow-hidden">
    <MapThumbnail encoded={segment.polyline} />
  </div>
)}
```

### 邊界情況處理

- `polyline` 為空字串或解碼後點數 < 2：顯示純黑背景 `div`（`bg-[#0f1117]`）
- 容器尺寸未初始化：預設使用 400×300 px，`useEffect` 讀取後更新

## 關鍵設計決策

1. **純靜態地圖**：不引入 Leaflet / Mapbox，用 `img` + `svg` 疊加實現，打包體積極小。
2. **CartoDB dark_all**：與應用程式深色主題一致，無需 API key。
3. **sub-domain 輪流**：`(tx + ty) % 4` 分散到四個 CDN 節點，避免單一來源限流。
4. **`bestZoom` 由大到小**：從 z=16 往下找，確保路線不超出容器（65% 裕度），而非從小到大浪費解析度。
5. **雙層 SVG**：光暈 + 實線組合，在深色底圖上視覺效果更好。

---

> 最後由 Claude Code 更新：2026-04-04
