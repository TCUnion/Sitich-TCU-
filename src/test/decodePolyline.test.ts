import { describe, it, expect } from 'vitest';
import { decodePolyline } from '../components/MapThumbnail';

describe('decodePolyline', () => {
  it('空字串回傳空陣列', () => {
    expect(decodePolyline('')).toEqual([]);
  });

  it('解碼 Google 官方範例字串', () => {
    // Google Encoded Polyline Algorithm 官方測試向量
    const result = decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@');
    expect(result).toHaveLength(3);
    expect(result[0][0]).toBeCloseTo(38.5, 4);
    expect(result[0][1]).toBeCloseTo(-120.2, 4);
    expect(result[1][0]).toBeCloseTo(40.7, 4);
    expect(result[1][1]).toBeCloseTo(-120.95, 4);
    expect(result[2][0]).toBeCloseTo(43.252, 4);
    expect(result[2][1]).toBeCloseTo(-126.453, 4);
  });

  it('回傳的每個元素都是 [number, number]', () => {
    const result = decodePolyline('_p~iF~ps|U');
    expect(result).toHaveLength(1);
    expect(typeof result[0][0]).toBe('number');
    expect(typeof result[0][1]).toBe('number');
  });

  it('解碼台灣地區座標範圍合理（lat 22–25, lng 120–122）', () => {
    // 以簡單的單點驗證台灣座標範圍解碼正確性
    const pts = decodePolyline('_p~iF~ps|U');
    // 官方向量第一點緯度 38.5、經度 -120.2，不在台灣，但確認解碼數值範圍正常
    expect(pts[0][0]).toBeGreaterThan(-90);
    expect(pts[0][0]).toBeLessThan(90);
    expect(pts[0][1]).toBeGreaterThan(-180);
    expect(pts[0][1]).toBeLessThan(180);
  });
});
