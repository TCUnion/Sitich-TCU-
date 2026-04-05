/**
 * Cloudflare Pages Middleware
 * 針對 ?s=<stravaId> 請求，從 Supabase 取回挑戰資料並注入正確的 OG meta tags，
 * 讓 Facebook / Line / Twitter 等社群爬蟲能讀到每場賽事的標題、描述與封面圖。
 */
const DEFAULT_IMAGE = 'https://db.criterium.tw/storage/v1/object/public/og-images/12/1775351843621.jpg';
const SITE_URL      = 'https://strava.criterium.tw';

/** HTML 屬性安全轉義 */
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** 把 OG / Twitter meta 注入 HTML */
function injectOG(html, { title, description, image, ogUrl }) {
  const t = esc(title);
  const d = esc(description);
  const i = esc(image);
  const u = esc(ogUrl);
  return html
    .replace(/(<meta property="og:title"\s+content=")[^"]*(")/,       `$1${t}$2`)
    .replace(/(<meta property="og:description"\s+content=")[^"]*(")/,  `$1${d}$2`)
    .replace(/(<meta property="og:image"\s+content=")[^"]*(")/,        `$1${i}$2`)
    .replace(/(<meta property="og:url"\s+content=")[^"]*(")/,          `$1${u}$2`)
    .replace(/(<meta name="twitter:title"\s+content=")[^"]*(")/,       `$1${t}$2`)
    .replace(/(<meta name="twitter:description"\s+content=")[^"]*(")/,`$1${d}$2`)
    .replace(/(<meta name="twitter:image"\s+content=")[^"]*(")/,       `$1${i}$2`);
}

/** 從三張表合併出 OG 資料（同 useSegmentData 優先序） */
async function fetchSegmentOG(supabaseUrl, headers, segId) {
  // 1. 先查 segments_new（用 strava_id），取得 DB id
  const segRes = await fetch(
    `${supabaseUrl}/rest/v1/segments_new?strava_id=eq.${segId}&select=id,name,distance,og_image&limit=1`,
    { headers }
  );
  const segArr = await segRes.json();
  const seg = segArr[0] ?? {};
  if (!seg.name) return null;

  const dbId = seg.id;

  // 2. 用 DB id 查 team_races 和 segment_metadata（並行）
  const [teamRes, metaRes] = await Promise.all([
    fetch(`${supabaseUrl}/rest/v1/team_races?segment_id=eq.${dbId}&select=name,og_image&limit=1`, { headers }),
    fetch(`${supabaseUrl}/rest/v1/segment_metadata?segment_id=eq.${dbId}&select=race_description,og_image,team_name&limit=1`, { headers }),
  ]);
  const [teamArr, metaArr] = await Promise.all([teamRes.json(), metaRes.json()]);
  const team = teamArr[0] ?? {};
  const meta = metaArr[0] ?? {};

  const title      = team.name ?? seg.name ?? 'TCU CHALLENGE';
  const distanceKm = seg.distance ? `${(seg.distance / 1000).toFixed(1)} km` : '';
  const description = meta.race_description
    ? `${meta.race_description}${distanceKm ? ` | ${distanceKm}` : ''}`
    : `挑戰 ${title}${distanceKm ? `，距離 ${distanceKm}` : ''}。立即報名 TCU 自行車挑戰！`;
  const image = meta.og_image ?? team.og_image ?? seg.og_image ?? DEFAULT_IMAGE;
  return { title, description, image };
}

/** 取精選挑戰（end_date 最近且仍有效的第一筆） */
async function fetchFeaturedOG(supabaseUrl, headers) {
  const today = new Date().toISOString().slice(0, 10);
  // 先抓 segments_new（is_active，end_date 正序），取得 id 和 strava_id
  const segRes = await fetch(
    `${supabaseUrl}/rest/v1/segments_new?is_active=eq.true&select=id,strava_id,name,distance,og_image,end_date&order=end_date.asc&limit=20`,
    { headers }
  );
  const segs = await segRes.json();

  // 找第一個 end_date >= today（或無 end_date）的路段
  const featured = (segs ?? []).find(s => !s.end_date || s.end_date >= today) ?? segs?.[0];
  if (!featured) return null;

  // 用 DB id 查 team_races
  const teamRes = await fetch(
    `${supabaseUrl}/rest/v1/team_races?segment_id=eq.${featured.id}&select=name,og_image&limit=1`,
    { headers }
  );
  const teamArr = await teamRes.json();
  const team = teamArr?.[0] ?? {};

  const title       = team.name ?? featured.name ?? 'TCU CHALLENGE';
  const distanceKm  = featured.distance ? `${(featured.distance / 1000).toFixed(1)} km` : '';
  const description = `挑戰 ${title}${distanceKm ? `，距離 ${distanceKm}` : ''}。立即報名 TCU 自行車挑戰！`;
  const image       = team.og_image ?? featured.og_image ?? DEFAULT_IMAGE;
  return { title, description, image, stravaId: featured.strava_id };
}

export async function onRequest(context) {
  const url    = new URL(context.request.url);
  const segId  = url.searchParams.get('s');
  const isRoot = url.pathname === '/' || url.pathname === '';

  // 非 HTML 頁面一律 pass-through（資源、API…）
  if (!isRoot && !segId) return context.next();

  const SUPABASE_URL = context.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY = context.env.VITE_SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) return context.next();

  const dbHeaders = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
  };

  try {
    let ogData = null;
    let ogUrl  = SITE_URL + '/';

    if (segId && /^\d+$/.test(segId)) {
      // --- 個別挑戰分享 ---
      const data = await fetchSegmentOG(SUPABASE_URL, dbHeaders, segId);
      if (data) {
        ogData = data;
        ogUrl  = `${SITE_URL}/?s=${segId}`;
      }
    } else if (isRoot) {
      // --- 主頁：顯示精選挑戰 OG ---
      const featured = await fetchFeaturedOG(SUPABASE_URL, dbHeaders);
      if (featured) {
        ogData = featured;
        // 主頁 og:url 仍指向首頁（不帶 ?s=）
      }
    }

    if (!ogData) return context.next();

    const response    = await context.next();
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('text/html')) return response;

    let html = await response.text();
    html = injectOG(html, {
      title:       `${ogData.title} | TCU CHALLENGE`,
      description: ogData.description,
      image:       ogData.image,
      ogUrl,
    });

    const newHeaders = new Headers(response.headers);
    newHeaders.set('content-type', 'text/html; charset=utf-8');
    return new Response(html, { status: response.status, headers: newHeaders });
  } catch {
    return context.next();
  }
}
