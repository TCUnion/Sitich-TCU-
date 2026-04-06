// GTM dataLayer 追蹤封裝
// GTM Container: GTM-MFHG7X7K

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

function push(data: Record<string, unknown>) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(data);
}

const SCREEN_TITLES: Record<string, string> = {
  login: '登入',
  explore: '首頁探索',
  ranking: '排行榜',
  register: '賽事報名',
  profile: '個人資料',
  'race-detail': '賽事詳情',
};

/** SPA 虛擬頁面瀏覽 */
export function trackPageView(screen: string) {
  push({
    event: 'virtual_page_view',
    page_title: SCREEN_TITLES[screen] ?? screen,
    page_path: `/${screen}`,
  });
}

/** 自訂事件 */
export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  push({ event: eventName, ...params });
}

/** 登入後設定使用者屬性（只需呼叫一次） */
export function setUserProperties(props: {
  user_id?: string;
  is_tcu_member?: boolean;
}) {
  push({ event: 'set_user_properties', ...props });
}
