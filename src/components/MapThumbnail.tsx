import React, { useRef, useEffect, useState } from 'react';

/** Google Encoded Polyline Algorithm decode */
export function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b: number, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : result >> 1;
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : result >> 1;
    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

const TILE = 256;
const CARTO_SUBS = ['a', 'b', 'c', 'd'];

function worldPx(lat: number, lng: number, z: number): [number, number] {
  const n = 1 << z;
  const x = (lng + 180) / 360 * n * TILE;
  const sinLat = Math.sin(lat * Math.PI / 180);
  const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * n * TILE;
  return [x, y];
}

function bestZoom(minLat: number, maxLat: number, minLng: number, maxLng: number, W: number, H: number): number {
  for (let z = 16; z >= 8; z--) {
    const [x0] = worldPx(maxLat, minLng, z);
    const [x1] = worldPx(minLat, maxLng, z);
    const [, y0] = worldPx(maxLat, minLng, z);
    const [, y1] = worldPx(minLat, maxLng, z);
    if (x1 - x0 <= W * 0.65 && y1 - y0 <= H * 0.65) return z;
  }
  return 8;
}

export function MapThumbnail({ encoded }: { encoded: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState<[number, number]>([400, 300]);
  useEffect(() => {
    const el = ref.current;
    if (el) setDims([el.clientWidth || 400, el.clientHeight || 300]);
  }, []);

  const pts = decodePolyline(encoded);
  if (pts.length < 2) return <div ref={ref} className="w-full h-full bg-[#0f1117]" />;

  const [W, H] = dims;
  const lats = pts.map(p => p[0]), lngs = pts.map(p => p[1]);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const cLat = (minLat + maxLat) / 2, cLng = (minLng + maxLng) / 2;

  const z = bestZoom(minLat, maxLat, minLng, maxLng, W, H);
  const [cx, cy] = worldPx(cLat, cLng, z);
  const left0 = cx - W / 2, top0 = cy - H / 2;

  const stx = Math.floor(left0 / TILE), etx = Math.floor((left0 + W) / TILE);
  const sty = Math.floor(top0 / TILE), ety = Math.floor((top0 + H) / TILE);

  const tiles: { tx: number; ty: number; left: number; top: number }[] = [];
  for (let ty = sty; ty <= ety; ty++)
    for (let tx = stx; tx <= etx; tx++)
      tiles.push({ tx, ty, left: tx * TILE - left0, top: ty * TILE - top0 });

  const svgPts = pts.map(([lat, lng]) => {
    const [wx, wy] = worldPx(lat, lng, z);
    return `${(wx - left0).toFixed(1)},${(wy - top0).toFixed(1)}`;
  }).join(' ');

  return (
    <div ref={ref} className="w-full h-full relative overflow-hidden bg-[#0f1117]">
      {tiles.map(({ tx, ty, left, top }) => (
        <img
          key={`${tx}-${ty}`}
          src={`https://${CARTO_SUBS[(tx + ty) % 4]}.basemaps.cartocdn.com/dark_all/${z}/${tx}/${ty}.png`}
          alt=""
          className="absolute select-none pointer-events-none"
          style={{ left, top, width: TILE, height: TILE }}
          loading="lazy"
          draggable={false}
        />
      ))}
      <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
        <polyline points={svgPts} fill="none" stroke="#FF4D00" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity="0.25" />
        <polyline points={svgPts} fill="none" stroke="#FF5500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
