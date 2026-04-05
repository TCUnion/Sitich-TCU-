import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from './hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu as MenuIcon, 
  ChevronLeft, 
  Compass, 
  Trophy, 
  ClipboardCheck, 
  User as UserIcon, 
  ArrowRight, 
  Timer as TimerIcon, 
  CloudUpload as CloudIcon, 
  Hammer, 
  ShieldCheck, 
  Users, 
  UserCircle, 
  Globe, 
  Mail as MailIcon, 
  MapPin, 
  Heart, 
  Phone, 
  FileText, 
  ExternalLink, 
  Clock, 
  Edit3,
  Plus,
  ChevronRight,
  HelpCircle,
  Flame,
  Loader2,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Settings,
  Share2,
  Image as ImageIcon,
  Save,
  X,
  CalendarDays,
  Ruler,
  Sparkles,
} from 'lucide-react';

import { Screen, Challenge, User } from './types';
import { useSegmentData, StravaSegment } from './hooks/useSegmentData';
import { MapThumbnail } from './components/MapThumbnail';
import { getLeaderboard, getMyRegistrations, getMySegmentElapsedTimes, getSegmentElapsedTimes, getSegmentRegistrations, getSegmentEfforts, SegmentEffortEntry, registerChallenge, RegistrationRecord, getTCUMemberByStravaId, TCUMemberProfile, findTCUMemberByIdOrAccount, checkTcuAccountBinding, triggerMemberBindingOtp, verifyMemberOtp, confirmMemberBinding, clearMemberOtp, TCUMemberSearch, upsertSegmentMetadata } from './services/api';

interface LeaderboardEntry {
  rank?: number;
  athlete_id?: number;
  athlete_name?: string;
  athlete_profile?: string;
  elapsed_time?: number;
  start_date_local?: string;
}

function formatElapsedTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Mock Data
const MOCK_USER: User = {
  name: "林谷憲",
  team: "TCU ELITE RACING TEAM",
  rank: "1",
  personalBest: "14:22.5",
  percentile: "65%",
  avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCo0BK8-pfBghbNn5CqXC3Z4O58YFkhPTRDeW9dlQ1B7wNEQXRopavpcdtrrPJYlofEOBR1sX0Vl9sND2Gfu2ndNvSLoazeFhWhCDIFUx_dr1_wKuuOqmZ6ulk6TN3HW53DorqHI-PwPzEPk3ebiF8MmU_kdmestG4cn0OQOv1OirV3K5hHXsWBKTm33KAJC2d9gcRQL0obtfUUnLV893KaMDFrYtZmnT1fyqIf_ZG4-3oJTkj_P5JnmKtAOZxvWFHNZXHnN-qcD2OJ",
  stats: {
    timing: 80,
    road: 90,
    climbing: 70,
    criterium: 60
  }
};

const CHALLENGES: Challenge[] = [
  {
    id: '1',
    title: 'BEIHAI SUMMER CRITERIUM',
    distance: '45 KM',
    elevation: '120 M',
    image: 'https://images.unsplash.com/photo-1534787238916-9ba6764efd4f?w=800&q=80',
    status: 'hot',
    reward: '+450 PTS'
  },
  {
    id: '2',
    title: 'THE RED RIDGE',
    distance: '87 KM',
    elevation: '3,275 M',
    image: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=800&q=80',
    status: 'new'
  },
  {
    id: '3',
    title: 'EARLY MORNING MARATHON TRAINING',
    distance: '—',
    elevation: '—',
    image: 'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=800&q=80',
    status: 'live',
    participants: '2.4k 參加中',
    time: '06:30 - 08:30'
  },
  {
    id: '4',
    title: 'ENDURANCE POWER CHALLENGE',
    distance: '—',
    elevation: '—',
    image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&q=80',
    status: 'live',
    participants: '842 參加中',
    time: '進行中 01:24:12'
  }
];

export default function App() {
  const auth = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('explore');
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);

  useEffect(() => {
    if (auth.isLoggedIn && currentScreen === 'login') {
      setCurrentScreen('explore');
    }
  }, [auth.isLoggedIn]);

  const navigateTo = (screen: Screen, challenge?: Challenge) => {
    if (challenge) setSelectedChallenge(challenge);
    setCurrentScreen(screen);
    window.scrollTo(0, 0);
  };

  const avatar = auth.athlete?.profile ?? MOCK_USER.avatar;

  return (
    <div className="min-h-screen bg-surface text-on-surface font-sans selection:bg-primary selection:text-on-primary">
      <Layout
        currentScreen={currentScreen}
        onNavigate={navigateTo}
        onBack={() => navigateTo('explore')}
        avatar={avatar}
        isLoggedIn={auth.isLoggedIn}
        onLogin={auth.login}
        onLogout={auth.logout}
      >
        <AnimatePresence mode="wait">
          {currentScreen === 'login' && (
            <motion.div key="login">
              <LoginScreen onLogin={auth.login} />
            </motion.div>
          )}
          {currentScreen === 'explore' && (
            <motion.div key="explore">
              <ExploreScreen onNavigate={navigateTo} />
            </motion.div>
          )}
          {currentScreen === 'ranking' && (
            <motion.div key="ranking">
              <RankingScreen />
            </motion.div>
          )}
          {currentScreen === 'register' && (
            <motion.div key="register">
              <RegisterScreen onNavigate={navigateTo} />
            </motion.div>
          )}
          {currentScreen === 'profile' && (
            <motion.div key="profile">
              <ProfileScreen onNavigate={navigateTo} />
            </motion.div>
          )}
          {currentScreen === 'admin' && (
            <motion.div key="admin">
              <AdminScreen onNavigate={navigateTo} />
            </motion.div>
          )}
          {currentScreen === 'race-detail' && selectedChallenge && (
            <motion.div key="race-detail">
              <RaceDetailScreen challenge={selectedChallenge} onNavigate={navigateTo} />
            </motion.div>
          )}
        </AnimatePresence>
      </Layout>
    </div>
  );
}

function Layout({ children, currentScreen, onNavigate, onBack, avatar, isLoggedIn, onLogin, onLogout }: {
  children: React.ReactNode,
  currentScreen: Screen,
  onNavigate: (screen: Screen) => void,
  onBack: () => void,
  avatar: string,
  isLoggedIn: boolean,
  onLogin: () => void,
  onLogout: () => void,
}) {
  const isLogin = currentScreen === 'login';
  const isDetail = currentScreen === 'race-detail';
  const [showMenu, setShowMenu] = React.useState(false);

  if (isLogin) {
    return <div className="flex flex-col min-h-screen">{children}</div>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top App Bar */}
      <header className="fixed top-0 w-full z-50 flex items-center px-4 h-16 bg-surface/90 backdrop-blur-md border-b border-surface-container">
        <div className="flex items-center gap-4 w-full">
          {isDetail && (
            <button onClick={onBack} className="w-11 h-11 flex items-center justify-center hover:bg-surface-container rounded-full transition-colors">
              <ChevronLeft className="w-6 h-6 text-on-surface" />
            </button>
          )}
          <h1 className="text-2xl font-headline italic-bold uppercase text-primary tracking-tighter">
            TCU CHALLENGE
          </h1>
          {!isDetail && (
            <div className="ml-auto relative">
              {isLoggedIn ? (
                <>
                  <button
                    onClick={() => setShowMenu(v => !v)}
                    className="w-11 h-11 rounded-full overflow-hidden border-2 border-primary/20"
                  >
                    <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                  </button>
                  {showMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                      <div className="absolute right-0 top-12 z-50 bg-surface-container rounded-2xl shadow-xl overflow-hidden min-w-[120px]">
                        <button
                          onClick={() => { setShowMenu(false); onLogout(); }}
                          className="w-full px-4 py-3 text-sm text-left text-error hover:bg-error/10 transition-colors"
                        >
                          登出
                        </button>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <button
                  onClick={onLogin}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-on-primary text-xs font-semibold"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                  </svg>
                  登入
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow pt-16 pb-24">
        {children}
      </main>

      {/* Bottom Navigation */}
      {!isDetail && (
        <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center px-4 py-3 h-20 bg-surface/90 backdrop-blur-xl border-t border-surface-container rounded-t-2xl shadow-2xl">
          <NavButton
            active={currentScreen === 'explore'}
            onClick={() => onNavigate('explore')}
            icon={<Compass className="w-6 h-6" />}
            label="探索"
          />
          <NavButton
            active={currentScreen === 'ranking'}
            onClick={() => onNavigate('ranking')}
            icon={<Trophy className="w-6 h-6" />}
            label="排名"
          />
          <NavButton
            active={currentScreen === 'register'}
            onClick={() => onNavigate('register')}
            icon={<ClipboardCheck className="w-6 h-6" />}
            label="報名"
          />
          <NavButton
            active={currentScreen === 'profile'}
            onClick={() => onNavigate('profile')}
            icon={<UserIcon className="w-6 h-6" />}
            label="個人"
          />
        </nav>
      )}
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center transition-all duration-300 ${active ? 'text-primary scale-110 font-bold' : 'text-on-surface-variant hover:text-secondary'}`}
    >
      <div className={`${active ? 'fill-current' : ''}`}>
        {icon}
      </div>
      <span className="text-[10px] font-medium mt-1">{label}</span>
    </button>
  );
}

// --- Screens ---

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="flex flex-col min-h-screen bg-surface items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-8">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
            <Flame className="w-8 h-8 text-on-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-on-surface tracking-tight">TCU CHALLENGE</h1>
            <p className="text-sm text-on-surface-variant mt-1">自行車挑戰社群平台</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-center text-on-surface-variant text-sm leading-relaxed">
          連結你的 Strava 帳號，<br />加入 TCU 挑戰賽、追蹤成績、與車友競技。
        </p>

        {/* Connect Button */}
        <button
          onClick={onLogin}
          className="w-full flex items-center justify-center gap-3 bg-[#FC4C02] hover:bg-[#e04402] active:bg-[#c93d02] text-white font-semibold py-4 rounded-2xl transition-colors shadow-lg"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
          </svg>
          使用 Strava 登入
        </button>

        <p className="text-xs text-on-surface-variant text-center">
          登入即表示你同意 TCU 服務條款與隱私政策
        </p>
      </div>
    </div>
  );
}

/** 計算剩餘天數；負數 = 已過期；null = 無結束日期 */
function getDaysRemaining(endDate?: string): number | null {
  if (!endDate) return null;
  try {
    const end = new Date(endDate);
    if (isNaN(end.getTime())) return null;
    return Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
}

function segmentToChallenge(s: StravaSegment): Challenge {
  return {
    id: String(s.id),
    title: s.description || s.name,
    distance: s.distance ? `${(s.distance / 1000).toFixed(1)} km` : '—',
    elevation: s.average_grade ? `${s.average_grade.toFixed(1)}%` : '—',
    image: s.og_image ?? '',
    status: 'live',
    participants: s.team,
    time: s.end_date,
    distanceM: s.distance,
    elevationGainM: s.total_elevation_gain,
    elevationLow: s.elevation_low,
    elevationHigh: s.elevation_high,
    stravaId: s.strava_id,
    polyline: s.polyline,
    startDate: s.start_date,
    race_description: s.race_description,
  };
}

function ExploreScreen({ onNavigate }: { onNavigate: (screen: Screen, challenge?: Challenge) => void }) {
  const { segments, isLoading } = useSegmentData();
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  async function handleCardShare(e: React.MouseEvent, seg: StravaSegment) {
    e.stopPropagation();
    const ch = segmentToChallenge(seg);
    const shareUrl = `${window.location.origin}/?s=${seg.strava_id}`;

    const stripMd = (md: string) => md
      .replace(/#{1,6}\s+/g, '')
      .replace(/\*\*(.+?)\*\*/gs, '$1')
      .replace(/\*(.+?)\*/gs, '$1')
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')
      .replace(/^[-*]\s+/gm, '• ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    const fmtDate = (d: string) => {
      const dt = new Date(d);
      return isNaN(dt.getTime()) ? d : `${dt.getMonth() + 1}/${dt.getDate()}`;
    };
    const dateRange = ch.startDate && ch.time
      ? `${fmtDate(ch.startDate)} – ${fmtDate(ch.time)}`
      : ch.time ? `截止 ${fmtDate(ch.time)}` : '';

    const lines: string[] = [];
    lines.push(`🏆 ${ch.title}`);
    lines.push('');
    if (dateRange) lines.push(`📅 活動期間：${dateRange}`);
    if (ch.distance) lines.push(`🚴 距離：${ch.distance}`);
    if (ch.elevation) lines.push(`⛰️ 爬升：${ch.elevation}`);
    if (ch.race_description) {
      lines.push('');
      lines.push(stripMd(ch.race_description));
    }
    lines.push('');
    lines.push(`🔗 ${shareUrl}`);
    lines.push('');
    lines.push('#TCUChallenge #自行車挑戰 #台灣自行車 #Cycling #Taiwan');

    const shareText = lines.join('\n');
    try {
      await navigator.clipboard.writeText(shareText);
      setShareToast('已複製！可貼到任何地方分享 🎉');
      setCopiedUrl(shareText);
    } catch {
      setShareToast('複製失敗，請手動複製連結');
      setCopiedUrl(null);
    }
  }

  // 深度連結：?s=<stravaId> → 直接開啟對應賽事詳情
  useEffect(() => {
    if (isLoading || segments.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const segId = params.get('s');
    if (!segId || !/^\d+$/.test(segId)) return;
    const matched = segments.find(s => String(s.strava_id) === segId);
    if (matched) {
      // 清除 URL param 避免重複觸發
      const cleanUrl = window.location.pathname;
      window.history.replaceState(null, '', cleanUrl);
      onNavigate('race-detail', segmentToChallenge(matched));
    }
  }, [isLoading, segments, onNavigate]);

  const sorted = [...segments].sort((a, b) => {
    const dA = getDaysRemaining(a.end_date) ?? 999;
    const dB = getDaysRemaining(b.end_date) ?? 999;
    return dB - dA;
  });

  const featuredSeg = sorted.find(s => {
    const d = getDaysRemaining(s.end_date);
    return d === null || d > 0;
  }) ?? sorted[0] ?? null;
  const featuredChallenge = featuredSeg ? segmentToChallenge(featuredSeg) : null;
  const heroImg = featuredSeg?.og_image || CHALLENGES[1].image;
  const heroTitle = featuredChallenge?.title || 'THE RED RIDGE';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="px-4 space-y-8"
    >
      {/* Share Modal */}
      {shareToast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6">
          <div className="bg-surface-container-high rounded-2xl shadow-2xl border border-white/10 px-6 py-6 w-full max-w-sm flex flex-col items-center gap-4">
            <Sparkles className="w-8 h-8 text-primary" />
            <p className="text-on-surface text-sm font-medium text-center">{shareToast}</p>
            {copiedUrl && (
              <div className="w-full bg-black/30 rounded-xl px-4 py-3 border border-white/10 max-h-52 overflow-y-auto">
                <pre className="text-on-surface/60 text-xs whitespace-pre-wrap break-words font-sans leading-relaxed">{copiedUrl}</pre>
              </div>
            )}
            <button
              onClick={() => { setShareToast(null); setCopiedUrl(null); }}
              className="mt-2 px-6 py-2 rounded-full bg-primary text-on-primary text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              關閉
            </button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative rounded-2xl overflow-hidden aspect-[1200/630] flex items-end p-6 bg-surface-container-low shadow-xl">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImg}
            alt="Hero"
            className="w-full h-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/30 to-transparent" />
        </div>
        <div className="relative z-10 w-full space-y-4">
          <div className="inline-block px-3 py-1 bg-tertiary/20 text-tertiary rounded text-[10px] font-bold tracking-widest uppercase italic">
            精選挑戰
          </div>
          <h2 className="text-4xl italic-bold font-headline leading-tight uppercase">{heroTitle}</h2>
          {featuredChallenge && (
            <button
              onClick={() => onNavigate('race-detail', featuredChallenge)}
              className="bg-primary text-on-primary px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20"
            >
              <span>查看詳情</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </section>

      {/* Segments */}
      <section className="space-y-4">
        <h3 className="text-xl italic-bold font-headline uppercase tracking-wide">進行中挑戰</h3>

        {isLoading && (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-full bg-surface-container rounded-2xl overflow-hidden flex items-center gap-3 p-3 animate-pulse">
                <div className="w-[72px] h-[72px] rounded-xl bg-surface-container-high shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-2.5 bg-surface-container-high rounded w-1/3" />
                  <div className="h-3 bg-surface-container-high rounded w-3/4" />
                  <div className="h-2.5 bg-surface-container-high rounded w-1/2" />
                </div>
                <div className="w-11 h-11 rounded-full bg-surface-container-high shrink-0" />
              </div>
            ))}
          </div>
        )}
        {!isLoading && sorted.length === 0 && (
          <div className="text-center text-on-surface/50 py-8 text-sm">目前無進行中挑戰</div>
        )}

        <div className="flex flex-col gap-3">
          {sorted.map(seg => {
            const daysRemaining = getDaysRemaining(seg.end_date);
            const isExpired = daysRemaining !== null && daysRemaining <= 0;
            const challenge = segmentToChallenge(seg);

            return (
              <div
                key={seg.id}
                onClick={() => onNavigate('race-detail', challenge)}
                role="button"
                tabIndex={0}
                className={`w-full bg-surface-container rounded-2xl overflow-hidden flex items-center gap-3 p-3 text-left transition-all active:scale-[0.98] border border-surface-container-highest/40 cursor-pointer ${
                  isExpired ? 'opacity-40 grayscale' : 'card-glow'
                }`}
              >
                {/* 左側縮圖 */}
                <div className="w-[72px] h-[72px] rounded-xl overflow-hidden shrink-0">
                  {seg.polyline ? (
                    <MapThumbnail encoded={seg.polyline} />
                  ) : seg.og_image ? (
                    <img src={seg.og_image} alt={seg.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-[#0f1117]" />
                  )}
                </div>

                {/* 中間資訊 */}
                <div className="flex-1 min-w-0 space-y-1">
                  {/* 標籤列 */}
                  <div className="flex items-center gap-1.5">
                    {isExpired ? (
                      <span className="text-[9px] font-bold text-white/60 bg-white/10 px-2 py-0.5 rounded-full">
                        已結束
                      </span>
                    ) : daysRemaining !== null ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full text-emerald-300 bg-emerald-900/40 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                        <Clock size={8} />
                        {daysRemaining}天
                      </span>
                    ) : null}
                    {!isExpired && seg.team && (
                      <span className="text-[9px] font-bold text-white bg-[#FC5200]/80 px-1.5 py-0.5 rounded-full">
                        {seg.team}
                      </span>
                    )}
                  </div>

                  {/* 標題 */}
                  <h3 className="text-[13px] font-bold leading-snug truncate">
                    {seg.description || seg.name}
                  </h3>

                  {/* 距離 · 坡度 */}
                  <div className="flex items-center gap-1 text-[11px] text-on-surface-variant">
                    <Ruler size={10} className="shrink-0" />
                    <span>
                      {seg.distance ? `${(seg.distance / 1000).toFixed(1)} km` : '—'}
                      {' · '}
                      {seg.average_grade ? `${seg.average_grade.toFixed(1)}%` : '—'}
                    </span>
                  </div>

                  {/* 日期 */}
                  {(seg.start_date || seg.end_date) && (() => {
                    const fmt = (d: string) => {
                      const dt = new Date(d);
                      return isNaN(dt.getTime()) ? d : `${dt.getMonth() + 1}/${dt.getDate()}`;
                    };
                    const s = seg.start_date ? fmt(seg.start_date) : null;
                    const e = seg.end_date ? fmt(seg.end_date) : null;
                    const label = s && e && s !== e ? `${s} – ${e}` : (s || e);
                    return (
                      <div className="flex items-center gap-1 text-[10px] text-on-surface-variant/70">
                        <CalendarDays size={9} className="shrink-0" />
                        <span>{label}</span>
                      </div>
                    );
                  })()}
                </div>

                {/* 右側分享按鈕 */}
                <button
                  onClick={(e) => handleCardShare(e, seg)}
                  className="w-11 h-11 shrink-0 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                  aria-label="分享"
                >
                  <Share2 size={14} className="text-white/70" />
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </motion.div>
  );
}

function EventCard({ title, participants, time, image, isTimer, onClick }: { title: string, participants: string, time: string, image: string, isTimer?: boolean, onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="relative bg-surface-container-high rounded-2xl overflow-hidden flex items-center p-4 gap-4 shadow-md border border-surface-container-highest/50 cursor-pointer active:scale-[0.98] transition-transform"
    >
      <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
        <img src={image} alt={title} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="bg-secondary text-on-secondary text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">LIVE</span>
          <span className="text-[10px] text-on-surface-variant font-medium">{participants}</span>
        </div>
        <h4 className="text-sm font-bold leading-snug">{title}</h4>
        <div className="flex items-center text-[10px] text-on-surface-variant italic">
          {isTimer ? <TimerIcon className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
          {time}
        </div>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onClick?.(); }}
        className="w-11 h-11 rounded-full bg-surface-variant flex items-center justify-center text-primary hover:bg-primary hover:text-on-primary transition-all shrink-0"
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
}

interface RankingEntry {
  athleteId: number;
  name: string;
  profile: string | null;
  team: string;
  elapsedTime: number | null; // null = 未完成
  avgWatts: number | null;
  attemptCount: number;
  activityId: number | null;
}

function RankingScreen() {
  const { accessToken, athlete, isLoggedIn } = useAuth();
  const { segments } = useSegmentData();
  const [selectedSeg, setSelectedSeg] = useState<typeof segments[0] | null>(null);
  const [rankingEntries, setRankingEntries] = useState<RankingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 自動選取第一個進行中路段
  useEffect(() => {
    if (segments.length > 0 && !selectedSeg) {
      const active = segments.find(s => {
        const d = getDaysRemaining(s.end_date);
        return d === null || d > 0;
      }) ?? segments[0];
      setSelectedSeg(active);
    }
  }, [segments, selectedSeg]);

  // 取得報名清單 + segment_efforts_v2 成績（合併，fallback segment_elapsed_times）
  useEffect(() => {
    if (!selectedSeg) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        const [regs, { bestEfforts, attemptCounts }, elapsedTimesMap] = await Promise.all([
          getSegmentRegistrations(selectedSeg.id),
          getSegmentEfforts(
            selectedSeg.strava_id,
            selectedSeg.start_date ?? undefined,
            selectedSeg.end_date ?? undefined,
          ),
          getSegmentElapsedTimes(selectedSeg.id),
        ]);

        if (!cancelled) {
          const withTime: RankingEntry[] = regs.map((r: RegistrationRecord) => {
            const effort: SegmentEffortEntry | undefined = bestEfforts.get(r.strava_athlete_id);
            // fallback: segment_elapsed_times（無瓦數/次數資訊但覆蓋更廣）
            const fallbackTime = elapsedTimesMap.get(r.strava_athlete_id) ?? null;
            const elapsedTime = effort ? effort.elapsed_time : fallbackTime;
            return {
              athleteId: r.strava_athlete_id,
              name: r.athlete_name,
              profile: r.athlete_profile,
              team: r.team,
              elapsedTime,
              avgWatts: effort?.average_watts ?? null,
              attemptCount: attemptCounts.get(r.strava_athlete_id) ?? 0,
              activityId: effort?.activity_id ?? null,
            };
          });
          const hasResults = withTime.some(e => e.elapsedTime !== null);
          if (hasResults) {
            const done = withTime.filter(e => e.elapsedTime !== null).sort((a, b) => a.elapsedTime! - b.elapsedTime!);
            const pending = withTime.filter(e => e.elapsedTime === null);
            setRankingEntries([...done, ...pending]);
          } else {
            setRankingEntries(withTime);
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedSeg]);

  const completedCount = rankingEntries.filter(e => e.elapsedTime !== null).length;
  const myEntry = rankingEntries.find(e => e.athleteId === athlete?.id);
  const myRank = myEntry ? rankingEntries.indexOf(myEntry) + 1 : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="px-4"
    >
      {/* 路段選擇器：進行中 / 歷史挑戰 */}
      {(() => {
        const activeSegs = segments.filter(s => { const d = getDaysRemaining(s.end_date); return d === null || d > 0; });
        const pastSegs   = segments.filter(s => { const d = getDaysRemaining(s.end_date); return d !== null && d <= 0; });
        const TabBtn = ({ seg }: { seg: typeof segments[0] }) => (
          <button
            key={seg.id}
            onClick={() => setSelectedSeg(seg)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              selectedSeg?.id === seg.id
                ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
                : 'bg-surface-container text-on-surface-variant border border-outline/20'
            }`}
          >
            {seg.description || seg.name}
          </button>
        );
        return (
          <div className="mb-6 space-y-3">
            {activeSegs.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-2 px-1">進行中</p>
                <div className="-mx-4 px-4 overflow-x-auto hide-scrollbar flex gap-2 py-1">
                  {activeSegs.map(seg => <TabBtn key={seg.id} seg={seg} />)}
                </div>
              </div>
            )}
            {pastSegs.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50 mb-2 px-1">歷史挑戰</p>
                <div className="-mx-4 px-4 overflow-x-auto hide-scrollbar flex gap-2 py-1">
                  {pastSegs.map(seg => <TabBtn key={seg.id} seg={seg} />)}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* 未登入提示 */}
      {!isLoggedIn && (
        <div className="text-center text-on-surface/50 py-16 text-sm space-y-2">
          <Trophy className="w-10 h-10 mx-auto opacity-30" />
          <p>請先登入 Strava 以查看排行榜</p>
        </div>
      )}

      {/* 個人排名 Hero */}
      {isLoggedIn && myEntry && (
        <section className="flex flex-col items-center mb-10">
          <div className="relative mb-4">
            <div className="w-44 h-44 rounded-full border-4 border-primary flex items-center justify-center p-2 shadow-[0_0_30px_rgba(253,228,43,0.3)]">
              <div className="w-full h-full rounded-full overflow-hidden border-4 border-surface-container">
                <img src={athlete?.profile ?? myEntry.profile ?? undefined} alt="Me" className="w-full h-full object-cover" />
              </div>
            </div>
            {myEntry.elapsedTime !== null && (
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-primary text-on-primary font-headline italic-bold text-2xl px-8 py-1.5 rounded-full kinetic-slant shadow-xl whitespace-nowrap">
                RANK #{myRank}
              </div>
            )}
          </div>
          {myEntry.elapsedTime === null && (
            <span className="text-xs text-on-surface-variant/60 font-medium tracking-widest uppercase mb-4">已報名・尚未完成</span>
          )}

          <div className="grid grid-cols-2 gap-4 w-full mt-4">
            <div className="bg-surface-container-low p-5 rounded-2xl border-l-4 border-secondary flex flex-col justify-between shadow-lg">
              <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-tighter">個人最佳時間</span>
              <div className="mt-2">
                <span className="text-2xl font-headline italic-bold text-white">
                  {myEntry.elapsedTime !== null ? formatElapsedTime(myEntry.elapsedTime) : '未完成'}
                </span>
              </div>
            </div>
            <div className="bg-surface-container-low p-5 rounded-2xl border-l-4 border-tertiary flex flex-col justify-between shadow-lg">
              <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-tighter">完成 / 報名</span>
              <div className="mt-2">
                <span className="text-2xl font-headline italic-bold text-white">
                  {completedCount} / {rankingEntries.length}
                </span>
              </div>
            </div>
          </div>
          {(myEntry.avgWatts || myEntry.attemptCount > 0) && (
            <div className="grid grid-cols-2 gap-4 w-full mt-3">
              {myEntry.avgWatts != null && (
                <div className="bg-surface-container-low p-4 rounded-2xl border-l-4 border-primary/60 shadow">
                  <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-tighter">均功率</span>
                  <div className="mt-1">
                    <span className="text-xl font-headline italic-bold text-white">{myEntry.avgWatts} <span className="text-xs font-normal text-on-surface-variant">W</span></span>
                  </div>
                </div>
              )}
              {myEntry.attemptCount > 0 && (
                <div className="bg-surface-container-low p-4 rounded-2xl border-l-4 border-primary/60 shadow">
                  <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-tighter">挑戰次數</span>
                  <div className="mt-1">
                    <span className="text-xl font-headline italic-bold text-white">{myEntry.attemptCount}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* 排行榜列表 */}
      {isLoggedIn && (
        <section className="mb-12">
          <div className="flex justify-between items-end mb-6 px-2">
            <h2 className="font-headline italic-bold text-xl uppercase tracking-wider text-secondary">CHALLENGERS</h2>
            {rankingEntries.length > 0 && (
              <span className="text-[10px] text-on-surface-variant uppercase font-medium">{rankingEntries.length} 名車手</span>
            )}
          </div>

          {isLoading && (
            <div className="space-y-3">
              {[0, 1, 2, 4].map(i => (
                <div key={i} className="flex items-center p-4 rounded-2xl bg-surface-container-low animate-pulse gap-4">
                  <div className="w-12 h-6 bg-surface-container-high rounded" />
                  <div className="w-10 h-10 rounded-full bg-surface-container-high" />
                  <div className="flex-1 h-4 bg-surface-container-high rounded w-1/2" />
                  <div className="w-16 h-4 bg-surface-container-high rounded" />
                </div>
              ))}
            </div>
          )}
          {!isLoading && rankingEntries.length === 0 && (
            <div className="text-center text-on-surface/50 py-12 text-sm">尚無報名者</div>
          )}

          <div className="space-y-3">
            {rankingEntries.map((entry, i) => (
              <ChallengerRow
                key={entry.athleteId}
                rank={String(i + 1).padStart(2, '0')}
                name={entry.name}
                profile={entry.profile ?? undefined}
                time={entry.elapsedTime !== null ? formatElapsedTime(entry.elapsedTime) : '未完成'}
                watts={entry.avgWatts ?? undefined}
                attemptCount={entry.attemptCount}
                isUser={entry.athleteId === athlete?.id}
              />
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
}

function ChallengerRow({ rank, name, profile, time, watts, attemptCount, isUser }: {
  rank: string;
  name: string;
  profile?: string;
  time: string;
  watts?: number;
  attemptCount?: number;
  isUser?: boolean;
}) {
  return (
    <div className={`flex items-center p-4 rounded-2xl transition-all cursor-pointer ${isUser ? 'bg-surface-container-highest border-l-4 border-secondary shadow-lg' : 'bg-surface-container-low hover:bg-surface-container'}`}>
      <span className={`font-headline italic-bold text-2xl w-12 shrink-0 ${isUser ? 'text-secondary' : 'text-on-surface-variant/40'}`}>{rank}</span>
      <div className="w-10 h-10 rounded-full overflow-hidden mr-3 border border-surface-container-highest shrink-0">
        {profile ? (
          <img src={profile} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant text-xs font-bold">{name.charAt(0)}</div>
        )}
      </div>
      <div className="flex-grow min-w-0">
        <h4 className="text-sm font-bold text-white uppercase truncate">{name}</h4>
        <div className="flex items-center gap-2 mt-0.5">
          {watts != null && (
            <span className="text-[10px] text-on-surface-variant/70">{watts}W</span>
          )}
          {attemptCount != null && attemptCount > 1 && (
            <span className="text-[10px] text-on-surface-variant/50">×{attemptCount}</span>
          )}
        </div>
      </div>
      <div className="text-right shrink-0 ml-2">
        <span className={`text-sm font-headline italic-bold ${isUser ? 'text-secondary' : 'text-white'}`}>{time}</span>
      </div>
    </div>
  );
}

function RegisterScreen({ onNavigate }: { onNavigate: (screen: Screen, challenge?: Challenge) => void }) {
  const { segments, isLoading } = useSegmentData();
  const { athlete, isLoggedIn } = useAuth();
  const [registeredIds, setRegisteredIds] = useState<Set<number>>(new Set());
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!athlete?.id) return;
    getMyRegistrations(athlete.id).then(ids => setRegisteredIds(new Set(ids)));
  }, [athlete?.id]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function handleRegister(segmentId: number, segmentName: string) {
    if (!isLoggedIn || !athlete) {
      showToast('請先登入 Strava 再報名');
      return;
    }
    if (registeredIds.has(segmentId)) return;
    setPendingId(segmentId);
    try {
      const name = `${athlete.firstname} ${athlete.lastname}`.trim() || `athlete ${athlete.id}`;
      const profile = athlete.profile_medium || athlete.profile || null;
      await registerChallenge(athlete.id, name, segmentId, profile);
      setRegisteredIds(prev => new Set(prev).add(segmentId));
      showToast(`報名成功：${segmentName} 🎉`);
    } catch {
      showToast('操作失敗，請稍後再試');
    } finally {
      setPendingId(null);
    }
  }

  const sorted = [...segments].sort((a, b) => {
    const dA = getDaysRemaining(a.end_date) ?? 999;
    const dB = getDaysRemaining(b.end_date) ?? 999;
    return dB - dA;
  });

  const active = sorted.filter(s => {
    const d = getDaysRemaining(s.end_date);
    return d === null || d > 0;
  });
  const expired = sorted.filter(s => {
    const d = getDaysRemaining(s.end_date);
    return d !== null && d <= 0;
  });

  const FALLBACK_IMG = 'https://images.unsplash.com/photo-1534787238916-9ba6764efd4f?w=800&q=80';

  const fmt = (d: string) => {
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? d : `${dt.getMonth() + 1}/${dt.getDate()}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="pb-20"
    >
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-surface-container-highest text-white text-sm px-5 py-3 rounded-2xl shadow-2xl border border-white/10 max-w-[90vw] text-center animate-fade-in">
          {toast}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4 px-6 pt-6">
          {[1, 2].map(i => <div key={i} className="h-48 rounded-2xl bg-surface-container-low animate-pulse" />)}
        </div>
      ) : sorted.length === 0 ? (
        <p className="text-on-surface-variant text-sm text-center py-16">目前無挑戰資料</p>
      ) : (
        <div className="divide-y divide-white/5">
          {sorted.map(seg => {
            const challenge = segmentToChallenge(seg);
            const daysLeft = getDaysRemaining(seg.end_date);
            const isExpired = daysLeft !== null && daysLeft <= 0;
            const isRegistered = registeredIds.has(seg.id);

            const dateLabel = (() => {
              const s = seg.start_date ? fmt(seg.start_date) : null;
              const e = seg.end_date ? fmt(seg.end_date) : null;
              if (s && e && s !== e) return `${s} – ${e}`;
              return s || e || null;
            })();

            return (
              <article key={seg.id} className={`px-4 pt-4 pb-8 ${isExpired ? 'opacity-40 grayscale' : ''}`}>
                {/* HERO */}
                <div
                  className="rounded-2xl overflow-hidden aspect-[1200/630] relative cursor-pointer"
                  onClick={() => onNavigate('race-detail', challenge)}
                >
                  <img
                    src={seg.og_image || FALLBACK_IMG}
                    alt={seg.description || seg.name}
                    className="w-full h-full object-cover brightness-[0.85]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 flex gap-2">
                    {isExpired ? (
                      <span className="text-[9px] font-bold text-white/70 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">已結束</span>
                    ) : daysLeft !== null ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2.5 py-1 rounded-full text-emerald-300 bg-emerald-900/60 backdrop-blur-sm shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                        <Clock size={8} />{daysLeft} 天
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* 標題 */}
                <div
                  className="mt-3 bg-surface-container rounded-2xl px-5 py-4 cursor-pointer"
                  onClick={() => onNavigate('race-detail', challenge)}
                >
                  <h2 className="font-headline italic-bold text-2xl leading-tight tracking-tighter uppercase">
                    {(seg.description || seg.name).split(' ').map((word, i) => (
                      <span key={i} className="block">{word}</span>
                    ))}
                  </h2>
                  {dateLabel && (
                    <div className="flex items-center gap-1.5 mt-2 text-[11px] text-on-surface-variant">
                      <CalendarDays size={10} className="shrink-0" />
                      <span>{dateLabel}</span>
                    </div>
                  )}
                </div>

                {/* 內文 */}
                {seg.race_description && (
                  <div className="mt-3 bg-surface-container rounded-2xl px-5 py-4">
                    <div className="prose prose-invert prose-sm max-w-none text-on-surface-variant leading-relaxed space-y-3
                      [&_h1]:text-on-surface [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2
                      [&_h2]:text-on-surface [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2
                      [&_h3]:text-on-surface [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1
                      [&_p]:mb-3 [&_p]:leading-relaxed
                      [&_strong]:text-on-surface [&_strong]:font-semibold
                      [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1
                      [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1
                      [&_li]:leading-relaxed
                      [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:text-primary [&_blockquote]:italic [&_blockquote]:my-3
                      [&_hr]:border-white/10 [&_hr]:my-4">
                      <ReactMarkdown>{seg.race_description}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* Distance / Elevation */}
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="bg-surface-container p-5 rounded-2xl border-l-4 border-secondary">
                    <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest block mb-1">Distance</span>
                    <span className="text-3xl font-headline italic-bold text-on-surface">{challenge.distance.split(' ')[0]}</span>
                    <span className="text-base font-headline italic-bold text-secondary ml-1">{challenge.distance.split(' ')[1]}</span>
                  </div>
                  <div className="bg-surface-container p-5 rounded-2xl border-l-4 border-primary">
                    <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest block mb-1">Elevation</span>
                    {challenge.elevationGainM != null ? (
                      <>
                        <span className="text-3xl font-headline italic-bold text-on-surface">{Math.round(challenge.elevationGainM)}</span>
                        <span className="text-base font-headline italic-bold text-primary ml-1">M</span>
                      </>
                    ) : (
                      <span className="text-3xl font-headline italic-bold text-on-surface">{challenge.elevation}</span>
                    )}
                  </div>
                </div>

                {/* Register Button */}
                {!isExpired && (
                  <div className="mt-3">
                    <button
                      onClick={() => !isRegistered && handleRegister(seg.id, seg.description || seg.name)}
                      disabled={pendingId === seg.id || isRegistered}
                      className={`w-full py-5 rounded-2xl font-headline italic-bold text-xl uppercase tracking-wider transition-all flex justify-center items-center gap-2 ${
                        isRegistered
                          ? 'bg-secondary/15 text-secondary border border-secondary/40 cursor-default'
                          : 'bg-secondary text-on-secondary shadow-[0_20px_40px_rgba(134,252,136,0.2)] active:scale-[0.98]'
                      }`}
                    >
                      {pendingId === seg.id ? '處理中...' : isRegistered ? '已報名 ✓' : '立即報名 (CONFIRM REGISTRATION)'}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

const ADMIN_ATHLETE_IDS = (import.meta.env.VITE_ADMIN_ATHLETE_IDS ?? '').split(',').map((s: string) => Number(s.trim())).filter(Boolean);

function ProfileScreen({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const { athlete } = useAuth();
  const isAdmin = athlete ? ADMIN_ATHLETE_IDS.includes(athlete.id) : false;
  const { segments } = useSegmentData();
  const [mySegmentIds, setMySegmentIds] = useState<number[]>([]);
  const [myTimesMap, setMyTimesMap] = useState<Map<number, number>>(new Map());
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [tcuMember, setTcuMember] = useState<TCUMemberProfile | null>(null);
  const [bindingStep, setBindingStep] = useState<'input' | 'otp' | 'success'>('input');
  const [bindingInput, setBindingInput] = useState('');
  const [bindingMemberData, setBindingMemberData] = useState<TCUMemberSearch | null>(null);
  const [bindingOtp, setBindingOtp] = useState('');
  const [bindingLoading, setBindingLoading] = useState(false);
  const [bindingError, setBindingError] = useState('');

  useEffect(() => {
    if (!athlete) return;
    setLoadingRecords(true);
    Promise.all([
      getMyRegistrations(athlete.id),
      getMySegmentElapsedTimes(athlete.id),
      getTCUMemberByStravaId(athlete.id),
    ]).then(([ids, times, tcu]) => {
      setMySegmentIds(ids);
      setMyTimesMap(times);
      setTcuMember(tcu);
    }).finally(() => setLoadingRecords(false));
  }, [athlete?.id]);

  const refreshTcuMember = async () => {
    if (!athlete) return;
    const tcu = await getTCUMemberByStravaId(athlete.id);
    setTcuMember(tcu);
  };

  const handleBindingSubmit = async () => {
    if (!athlete || !bindingInput.trim()) return;
    setBindingLoading(true);
    setBindingError('');
    try {
      const member = await findTCUMemberByIdOrAccount(bindingInput.trim());
      if (!member) {
        setBindingError('查無此會員資料。請先至 https://www.tsu.com.tw/ 進行註冊。系統每天早上 9 點更新會員資料，請於更新後再試一次。');
        return;
      }
      setBindingMemberData(member);

      // 先查此 TCU 帳號是否已綁定
      const boundStravaId = await checkTcuAccountBinding(member.account, member.email);
      if (boundStravaId !== null) {
        if (boundStravaId === String(athlete.id)) {
          // 已綁定到當前帳號 → 直接視為成功
          setBindingStep('success');
          await refreshTcuMember();
          window.dispatchEvent(new Event('tcu-binding-success'));
        } else {
          setBindingError('此 TCU 帳號已綁定其他 Strava 帳號，無法重複綁定。');
        }
        return;
      }

      const res = await triggerMemberBindingOtp(
        member.email,
        member.real_name ?? member.name ?? '',
        athlete.id,
        bindingInput.trim(),
      );
      if (res.already_bound) {
        setBindingStep('success');
        await refreshTcuMember();
        window.dispatchEvent(new Event('tcu-binding-success'));
      } else {
        setBindingStep('otp');
      }
    } catch (e) {
      setBindingError('發送驗證碼失敗，請稍後再試。');
    } finally {
      setBindingLoading(false);
    }
  };

  const handleOtpVerify = async () => {
    if (!athlete || !bindingMemberData || !bindingOtp.trim()) return;
    setBindingLoading(true);
    setBindingError('');
    try {
      const valid = await verifyMemberOtp(bindingMemberData.email, bindingOtp.trim());
      if (!valid) {
        setBindingError('驗證碼錯誤，請重新輸入。');
        return;
      }
      await confirmMemberBinding(
        bindingMemberData.email,
        athlete.id,
        bindingMemberData.account ?? '',
        bindingMemberData.real_name ?? bindingMemberData.name ?? '',
      );
      await clearMemberOtp(bindingMemberData.email);
      setBindingStep('success');
      await refreshTcuMember();
      window.dispatchEvent(new Event('tcu-binding-success'));
    } catch (e) {
      setBindingError('綁定失敗，請稍後再試。');
    } finally {
      setBindingLoading(false);
    }
  };

  const mySegments = segments.filter(s => mySegmentIds.includes(s.id));
  const displayName = athlete ? `${athlete.firstname} ${athlete.lastname}` : '—';
  const displayAvatar = athlete?.profile_medium ?? athlete?.profile ?? MOCK_USER.avatar;
  const tcuAvatarUrl = tcuMember?.tcu_id ? `https://www.tsu.com.tw/upload-files/avatars/${tcuMember.tcu_id}.jpg` : null;
  const locationStr = [athlete?.city, athlete?.country].filter(Boolean).join(', ');

  // 解析 skills 字串 → 雷達圖分數（A=6 B=5 C=4 D=3 E=2 Y=1）
  const gradeToScore: Record<string, number> = { A: 6, B: 5, C: 4, D: 3, E: 2, Y: 1 };
  const parseSkills = (skills: string | null | undefined) => {
    const map: Record<string, number> = {};
    if (!skills) return map;
    skills.split('\n').forEach(line => {
      const [key, grade] = line.split('：');
      if (key && grade) map[key.trim()] = gradeToScore[grade.trim().toUpperCase()] ?? 0;
    });
    return map;
  };
  const skillScores = parseSkills(tcuMember?.skills);
  // 四軸對應 key（center=100, maxRadius=80, radius = score*80/6）
  // 最小半徑 32 避免低分點落入頭像圓圈（約 radius 28 SVG 單位）內
  const radarR = (key: string) => { const s = skillScores[key] ?? 0; return s > 0 ? Math.max(32, s * 80 / 6) : 0; };
  const r計時 = radarR('計時賽TT');
  const r公路 = radarR('公路賽');
  const r登山 = radarR('公路登山');
  const r繞圈 = radarR('公路繞圈');
  const hasSkills = r計時 + r公路 + r登山 + r繞圈 > 0;
  // SVG 頂/右/底/左點
  const pt計時  = { x: 100,          y: 100 - r計時 };
  const pt公路  = { x: 100 + r公路,  y: 100 };
  const pt登山  = { x: 100,          y: 100 + r登山 };
  const pt繞圈  = { x: 100 - r繞圈,  y: 100 };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="px-5 max-w-md mx-auto pb-12"
    >
      {/* Header: Radar Chart + Profile Picture */}
      <section className="relative flex flex-col items-center mb-10">
        <div className="relative w-72 h-72 flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 200 200" overflow="visible">
            {/* 6 concentric diamond rings: 6=outer(80px) → 1=inner(13px) */}
            <path className="text-outline-variant" d="M 100 20 L 180 100 L 100 180 L 20 100 Z" fill="none" stroke="currentColor" strokeDasharray="2 2" strokeWidth="0.5" />
            <path className="text-outline-variant" d="M 100 33 L 167 100 L 100 167 L 33 100 Z" fill="none" stroke="currentColor" strokeDasharray="2 2" strokeWidth="0.5" />
            <path className="text-outline-variant" d="M 100 47 L 153 100 L 100 153 L 47 100 Z" fill="none" stroke="currentColor" strokeDasharray="2 2" strokeWidth="0.5" />
            <path className="text-outline-variant" d="M 100 60 L 140 100 L 100 140 L 60 100 Z" fill="none" stroke="currentColor" strokeDasharray="2 2" strokeWidth="0.5" />
            <path className="text-outline-variant" d="M 100 73 L 127 100 L 100 127 L 73 100 Z" fill="none" stroke="currentColor" strokeDasharray="2 2" strokeWidth="0.5" />
            <path className="text-outline-variant" d="M 100 87 L 113 100 L 100 113 L 87 100 Z" fill="none" stroke="currentColor" strokeDasharray="2 2" strokeWidth="0.5" />
            {/* Ring labels 6→1 along the right side of the top axis */}
            <text fill="rgba(255,255,255,0.45)" fontSize="6" textAnchor="start" x="103" y="23">6</text>
            <text fill="rgba(255,255,255,0.45)" fontSize="6" textAnchor="start" x="103" y="36">5</text>
            <text fill="rgba(255,255,255,0.45)" fontSize="6" textAnchor="start" x="103" y="50">4</text>
            <text fill="rgba(255,255,255,0.45)" fontSize="6" textAnchor="start" x="103" y="63">3</text>
            <text fill="rgba(255,255,255,0.45)" fontSize="6" textAnchor="start" x="103" y="76">2</text>
            <text fill="rgba(255,255,255,0.45)" fontSize="6" textAnchor="start" x="103" y="90">1</text>
            <line className="text-outline-variant" stroke="currentColor" strokeWidth="0.5" x1="100" x2="100" y1="20" y2="180" />
            <line className="text-outline-variant" stroke="currentColor" strokeWidth="0.5" x1="20" x2="180" y1="100" y2="100" />
            {hasSkills && (
              <>
                <polygon
                  className="drop-shadow-[0_0_8px_rgba(56,175,70,0.4)]"
                  fill="rgba(56, 175, 70, 0.2)"
                  points={`${pt計時.x},${pt計時.y} ${pt公路.x},${pt公路.y} ${pt登山.x},${pt登山.y} ${pt繞圈.x},${pt繞圈.y}`}
                  stroke="#38af46" strokeLinejoin="round" strokeWidth="2"
                />
                <circle cx={pt計時.x} cy={pt計時.y} fill="#38af46" r="3" />
                <circle cx={pt公路.x} cy={pt公路.y} fill="#38af46" r="3" />
                <circle cx={pt登山.x} cy={pt登山.y} fill="#38af46" r="3" />
                <circle cx={pt繞圈.x} cy={pt繞圈.y} fill="#38af46" r="3" />
              </>
            )}
            <text fill="white" fontSize="10" fontWeight="bold" textAnchor="start" x="185" y="104">公路</text>
            <text fill="white" fontSize="10" fontWeight="bold" textAnchor="middle" x="100" y="212">登山</text>
            <text fill="white" fontSize="10" fontWeight="bold" textAnchor="end" x="15" y="104">繞圈</text>
            <text fill="white" fontSize="10" fontWeight="bold" textAnchor="middle" x="100" y="10">計時</text>
          </svg>
          {/* Real Strava profile picture centered on radar */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <img
              src={tcuAvatarUrl ?? displayAvatar}
              alt={displayName}
              className="w-20 h-20 rounded-full border-2 border-primary object-cover shadow-xl"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = displayAvatar; }}
            />
          </div>
        </div>
        <div className="mt-6 text-center">
          <h2 className="font-headline italic-bold text-4xl uppercase tracking-tight text-primary">{displayName}</h2>
          {locationStr && (
            <p className="text-on-surface-variant text-xs mt-1 flex items-center justify-center gap-1">
              <MapPin className="w-3 h-3" />{locationStr}
            </p>
          )}
          <p className="text-on-surface-variant text-[10px] mt-1 uppercase tracking-widest">
            Strava #{athlete?.id ?? '—'}
          </p>
          {Object.keys(skillScores).length > 0 && (
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3">
              {Object.entries(skillScores).map(([key, score]) => {
                const grade = Object.entries(gradeToScore).find(([, v]) => v === score)?.[0] ?? '—';
                return (
                  <span key={key} className="text-xs text-on-surface-variant">
                    {key} <span className="text-primary font-bold">{grade}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 我的挑戰記錄 */}
      <section className="mb-10">
        <div className="flex items-center gap-2 text-on-surface-variant mb-4">
          <Trophy className="w-4 h-4" />
          <span className="text-xs font-medium">我的挑戰記錄</span>
          <span className="ml-auto text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{mySegmentIds.length} 場</span>
        </div>
        {loadingRecords ? (
          <div className="space-y-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="bg-surface-container-high rounded-2xl p-4 border border-white/5 flex items-center gap-4 animate-pulse">
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-surface-container-highest rounded w-3/4" />
                  <div className="h-2.5 bg-surface-container-highest rounded w-1/2" />
                </div>
                <div className="w-16 h-6 bg-surface-container-highest rounded-full shrink-0" />
              </div>
            ))}
          </div>
        ) : mySegments.length === 0 ? (
          <div className="bg-surface-container-high rounded-2xl p-6 text-center border border-white/5">
            <ClipboardCheck className="w-8 h-8 text-on-surface-variant/40 mx-auto mb-3" />
            <p className="text-on-surface-variant text-sm">尚未報名任何挑戰</p>
          </div>
        ) : (
          <div className="space-y-3">
            {mySegments.map(seg => {
              const elapsedTime = myTimesMap.get(seg.id) ?? null;
              const now = new Date();
              const endDate = seg.end_date ? new Date(seg.end_date) : null;
              const isActive = !endDate || endDate >= now;
              return (
                <div key={seg.id} className="bg-surface-container-high rounded-2xl p-4 border border-white/5 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm leading-snug">{seg.name}</p>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">
                      {seg.distance ? `${(seg.distance / 1000).toFixed(1)} km` : '—'}
                      {seg.end_date && ` · 截止 ${new Date(seg.end_date).toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric' })}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {elapsedTime !== null ? (
                      <>
                        <p className="font-headline italic-bold text-primary text-lg">{formatElapsedTime(elapsedTime)}</p>
                        <p className="text-[10px] text-on-surface-variant">完賽</p>
                      </>
                    ) : (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${isActive ? 'bg-tertiary/20 text-tertiary' : 'bg-outline-variant/20 text-on-surface-variant'}`}>
                        {isActive ? '進行中' : '未完成'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* TCU 會員資料 */}
      <section className="mb-10 space-y-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="bg-secondary p-3 rounded-2xl shadow-lg shadow-secondary/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-headline italic-bold text-2xl uppercase text-on-surface">TCU 會員資料</h3>
            <p className="text-on-surface-variant text-[10px] mt-0.5 tracking-wider">Strava ID: {athlete?.id ?? '—'}</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* 基本資料 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <UserIcon className="w-4 h-4" />
              <span className="text-xs font-medium">基本資料</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ProfileItem
                label="真實姓名"
                value={tcuMember
                  ? `${tcuMember.real_name ?? tcuMember.name ?? '—'}${tcuMember.nickname ? `（${tcuMember.nickname}）` : ''}`
                  : displayName}
              />
              <ProfileItem label="所屬車隊" value={tcuMember?.team ?? '—'} icon={<Users className="w-3 h-3 text-secondary" />} />
              {(tcuMember?.gender || tcuMember?.birthday) && (
                <ProfileItem
                  label="性別 / 生日"
                  value={[
                    tcuMember.gender === 'Male' ? '男' : tcuMember.gender === 'Female' ? '女' : tcuMember.gender,
                    tcuMember.birthday,
                  ].filter(Boolean).join('  |  ')}
                  icon={<UserCircle className="w-3 h-3 text-secondary" />}
                />
              )}
              {(tcuMember?.nationality || tcuMember?.tcu_id) && (
                <ProfileItem
                  label="國籍 / 身分證號"
                  value={[tcuMember?.nationality, tcuMember?.tcu_id].filter(Boolean).join('  |  ')}
                  icon={<Globe className="w-3 h-3 text-secondary" />}
                />
              )}
              {tcuMember?.member_type && <ProfileItem label="會員類型" value={tcuMember.member_type} />}
            </div>
          </div>

          {/* 聯絡資訊 */}
          {tcuMember && (tcuMember.email || tcuMember.phone || tcuMember.address) && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-on-surface-variant">
                <Phone className="w-4 h-4" />
                <span className="text-xs font-medium">聯絡資訊</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {tcuMember.email && (
                  <ProfileItem label="電子郵件" value={tcuMember.email} icon={<MailIcon className="w-3 h-3 text-secondary" />} />
                )}
                {tcuMember.phone && (
                  <ProfileItem label="電話" value={tcuMember.phone} icon={<Phone className="w-3 h-3 text-secondary" />} />
                )}
                {tcuMember.address && (
                  <div className="col-span-2">
                    <ProfileItem label="通訊地址" value={tcuMember.address} icon={<MapPin className="w-3 h-3 text-secondary" />} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 緊急聯絡人 */}
          {tcuMember && tcuMember.emergency_contact && (
            <div className="bg-surface-container-high rounded-2xl p-4 border border-red-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-4 h-4 text-red-400" />
                <span className="text-xs font-medium text-red-400">緊急聯絡人</span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-medium text-on-surface">{tcuMember.emergency_contact ? tcuMember.emergency_contact.charAt(0) + '**' : ''}</span>
                {tcuMember.emergency_contact_relation && (
                  <span className="text-[10px] bg-secondary/20 text-secondary px-2 py-0.5 rounded-full">{tcuMember.emergency_contact_relation}</span>
                )}
                {tcuMember.emergency_contact_phone && (
                  <span className="text-xs text-on-surface-variant flex items-center gap-1">
                    <Phone className="w-3 h-3" />{tcuMember.emergency_contact_phone.slice(0, 4) + '****' + tcuMember.emergency_contact_phone.slice(-4)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* 個人簡介 */}
          {tcuMember && tcuMember.self_introduction && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-on-surface-variant">
                <FileText className="w-4 h-4" />
                <span className="text-xs font-medium">個人簡介</span>
              </div>
              <div className="bg-surface-container-high rounded-2xl p-4 border border-white/5">
                <p className="text-xs text-on-surface-variant/90 leading-relaxed whitespace-pre-line">
                  {tcuMember.self_introduction}
                </p>
              </div>
            </div>
          )}

          {!tcuMember && (
            <div className="bg-surface-container-high rounded-2xl p-5 border border-white/5 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <UserCheck className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium">綁定 TCU 帳號</span>
              </div>

              {bindingStep === 'input' && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-on-surface-variant/80 leading-relaxed">
                    輸入 TCU 帳號或會員編號，即可同步真實姓名、車隊與會員資料。
                  </p>
                  <input
                    type="text"
                    value={bindingInput}
                    onChange={e => { setBindingInput(e.target.value); setBindingError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleBindingSubmit()}
                    placeholder="TCU 帳號 或 會員編號"
                    className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm border border-white/10 focus:outline-none focus:border-primary/50 placeholder-on-surface-variant/40"
                  />
                  {bindingError && (
                    <div className="flex items-start gap-2 text-error text-xs leading-relaxed">
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>{bindingError}</span>
                    </div>
                  )}
                  <button
                    onClick={handleBindingSubmit}
                    disabled={bindingLoading || !bindingInput.trim()}
                    className="w-full bg-primary text-on-primary py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-40 active:scale-95 transition-all"
                  >
                    {bindingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    {bindingLoading ? '查詢中…' : '下一步'}
                  </button>
                </div>
              )}

              {bindingStep === 'otp' && bindingMemberData && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-on-surface-variant/80 leading-relaxed">
                    驗證碼已寄至 <span className="text-primary font-medium">{bindingMemberData.email}</span>，請輸入 6 位數驗證碼。
                  </p>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={bindingOtp}
                    onChange={e => { setBindingOtp(e.target.value.replace(/\D/g, '')); setBindingError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleOtpVerify()}
                    placeholder="6 位數驗證碼"
                    className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm border border-white/10 focus:outline-none focus:border-primary/50 placeholder-on-surface-variant/40 tracking-widest text-center"
                  />
                  {bindingError && (
                    <div className="flex items-start gap-2 text-error text-xs">
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      <span>{bindingError}</span>
                    </div>
                  )}
                  <button
                    onClick={handleOtpVerify}
                    disabled={bindingLoading || bindingOtp.length < 6}
                    className="w-full bg-primary text-on-primary py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-40 active:scale-95 transition-all"
                  >
                    {bindingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    {bindingLoading ? '驗證中…' : '確認綁定'}
                  </button>
                  <button
                    onClick={() => { setBindingStep('input'); setBindingOtp(''); setBindingError(''); }}
                    className="text-xs text-on-surface-variant/60 text-center hover:text-on-surface-variant transition-colors"
                  >
                    重新輸入帳號
                  </button>
                </div>
              )}

              {bindingStep === 'success' && (
                <div className="flex flex-col items-center gap-3 py-2">
                  <CheckCircle2 className="w-10 h-10 text-primary" />
                  <p className="text-sm font-medium">綁定成功！</p>
                  <p className="text-xs text-on-surface-variant/80 text-center">
                    TCU 會員資料已同步，頁面將自動更新。
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {tcuMember && (
          <div className="flex flex-col gap-4 mt-8">
            <div className="flex justify-end items-center text-[10px] text-on-surface-variant/60">
              <Clock className="w-3 h-3 mr-1" />
              <span>每日 08:00 更新</span>
            </div>
            <a href="https://www.tsu.com.tw/member-data/profile" target="_blank" rel="noopener noreferrer" className="w-full bg-secondary/10 border border-secondary/30 text-secondary py-4 rounded-2xl italic-bold font-headline uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg hover:bg-secondary/20">
              前往 TCU 會員中心
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        )}
        {isAdmin && (
          <div className="mt-6">
            <button
              onClick={() => onNavigate('admin')}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-white/10 bg-surface-container text-on-surface-variant text-xs hover:bg-surface-container-high transition-colors"
            >
              <Settings className="w-4 h-4" />
              後台管理
            </button>
          </div>
        )}
      </section>
    </motion.div>
  );
}

function ProfileItem({ label, value, icon }: { label: string, value: string, icon?: React.ReactNode }) {
  return (
    <div className="bg-surface-container-high rounded-2xl p-4 border border-white/5 shadow-md">
      <p className="text-[10px] text-on-surface-variant uppercase mb-1 tracking-wider">{label}</p>
      <div className="flex items-center gap-2">
        {icon}
        <p className="font-medium text-sm truncate">{value}</p>
      </div>
    </div>
  );
}

function RaceDetailScreen({ challenge, onNavigate }: { challenge: Challenge; onNavigate: (screen: Screen) => void }) {
  const { accessToken, athlete, isLoggedIn } = useAuth();
  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // 動態更新 OG meta tags
  useEffect(() => {
    const title = `${challenge.title} | TCU CHALLENGE`;
    document.title = title;
    const setMeta = (property: string, content: string) => {
      let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute('property', property); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };
    setMeta('og:title', title);
    setMeta('og:description', challenge.reward || 'TCU 自行車挑戰賽');
    if (challenge.image) {
      setMeta('og:image', challenge.image);
      setMeta('og:image:width', '1200');
      setMeta('og:image:height', '630');
    }
    return () => { document.title = 'TCU CHALLENGE'; };
  }, [challenge]);

  async function handleShare() {
    const shareUrl = challenge.stravaId
      ? `${window.location.origin}/?s=${challenge.stravaId}`
      : window.location.href;

    // strip markdown for plain text
    const stripMd = (md: string) => md
      .replace(/#{1,6}\s+/g, '')
      .replace(/\*\*(.+?)\*\*/gs, '$1')
      .replace(/\*(.+?)\*/gs, '$1')
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')
      .replace(/^[-*]\s+/gm, '• ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    const fmtDate = (d: string) => {
      const dt = new Date(d);
      return isNaN(dt.getTime()) ? d : `${dt.getMonth() + 1}/${dt.getDate()}`;
    };
    const dateRange = challenge.startDate && challenge.time
      ? `${fmtDate(challenge.startDate)} – ${fmtDate(challenge.time)}`
      : challenge.time ? `截止 ${fmtDate(challenge.time)}` : '';

    const lines: string[] = [];
    lines.push(`🏆 ${challenge.title}`);
    lines.push('');
    if (dateRange) lines.push(`📅 活動期間：${dateRange}`);
    if (challenge.distance) lines.push(`🚴 距離：${challenge.distance}`);
    if (challenge.elevation) lines.push(`⛰️ 爬升：${challenge.elevation}`);
    if (challenge.race_description) {
      lines.push('');
      lines.push(stripMd(challenge.race_description));
    }
    lines.push('');
    lines.push(`🔗 ${shareUrl}`);
    lines.push('');
    lines.push('#TCUChallenge #自行車挑戰 #台灣自行車 #Cycling #Taiwan');

    const shareText = lines.join('\n');

    try {
      await navigator.clipboard.writeText(shareText);
      setShareToast('已複製！可貼到任何地方分享 🎉');
      setCopiedUrl(shareText);
    } catch {
      setShareToast('複製失敗，請手動複製連結');
      setCopiedUrl(null);
    }
  }

  useEffect(() => {
    if (!challenge.stravaId) return;
    const token = accessToken ?? '';
    getLeaderboard(String(challenge.stravaId), token)
      .then((data: unknown) => {
        const list: LeaderboardEntry[] = Array.isArray(data) ? data : ((data as { entries?: LeaderboardEntry[] }).entries ?? []);
        setLeaderboardEntries(list);
      })
      .catch(() => {});
  }, [challenge.stravaId, accessToken]);

  const personalBest = isLoggedIn && athlete
    ? leaderboardEntries.find(e => e.athlete_id === athlete.id)
    : undefined;

  const daysRemaining = getDaysRemaining(challenge.time);

  function formatDateRange(start?: string, end?: string): string {
    const fmt = (d: string) => {
      const dt = new Date(d);
      return isNaN(dt.getTime()) ? d : `${dt.getMonth() + 1}/${dt.getDate()}`;
    };
    if (start && end) return `${fmt(start)} – ${fmt(end)}`;
    if (end) return `截止 ${fmt(end)}`;
    return '—';
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-32"
    >
      {/* Share Modal */}
      {shareToast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-6">
          <div className="bg-surface-container-high rounded-2xl shadow-2xl border border-white/10 px-6 py-6 w-full max-w-sm flex flex-col items-center gap-4">
            <Sparkles className="w-8 h-8 text-primary" />
            <p className="text-on-surface text-sm font-medium text-center">{shareToast}</p>
            {copiedUrl && (
              <div className="w-full bg-black/30 rounded-xl px-4 py-3 border border-white/10 max-h-52 overflow-y-auto">
                <pre className="text-on-surface/60 text-xs whitespace-pre-wrap break-words font-sans leading-relaxed">{copiedUrl}</pre>
              </div>
            )}
            <button
              onClick={() => { setShareToast(null); setCopiedUrl(null); }}
              className="mt-1 px-6 py-2 rounded-full bg-primary text-on-primary text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              關閉
            </button>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="mx-4 mt-4 rounded-2xl overflow-hidden aspect-[1200/630] relative">
        <img
          src={challenge.image || 'https://images.unsplash.com/photo-1534787238916-9ba6764efd4f?w=800&q=80'}
          alt={challenge.title}
          className="w-full h-full object-cover grayscale-[0.3] brightness-[0.7]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        {challenge.status === 'hot' && (
          <div className="absolute top-3 left-3 inline-flex items-center gap-2 bg-tertiary px-3 py-1 rounded-sm shadow-lg">
            <Flame className="w-3 h-3 text-on-tertiary fill-current" />
            <span className="text-[10px] italic-bold tracking-widest text-on-tertiary font-headline uppercase">HOT</span>
          </div>
        )}
      </section>

      {/* 標題 */}
      <div className="mx-4 mt-3 bg-surface-container rounded-2xl px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-2xl font-headline italic-bold leading-tight tracking-tighter uppercase flex-1">
            {challenge.title.split(' ').map((word, i) => (
              <span key={i} className="block">{word}</span>
            ))}
          </h2>
          <button
            onClick={handleShare}
            className="shrink-0 mt-0.5 w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
            aria-label="分享"
          >
            <Share2 className="w-4 h-4 text-on-surface-variant" />
          </button>
        </div>
        {(challenge.startDate || challenge.time) && (
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-on-surface-variant">
            <CalendarDays size={10} className="shrink-0" />
            <span>{formatDateRange(challenge.startDate, challenge.time)}</span>
          </div>
        )}
      </div>

      {/* 內文 */}
      {challenge.race_description && (
        <div className="mx-4 mt-3 bg-surface-container rounded-2xl px-5 py-4">
          <div className="prose prose-invert prose-sm max-w-none text-on-surface-variant leading-relaxed space-y-3
            [&_h1]:text-on-surface [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2
            [&_h2]:text-on-surface [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2
            [&_h3]:text-on-surface [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1
            [&_p]:mb-3 [&_p]:leading-relaxed
            [&_strong]:text-on-surface [&_strong]:font-semibold
            [&_em]:text-on-surface-variant
            [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1
            [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1
            [&_li]:leading-relaxed
            [&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:text-primary [&_blockquote]:italic [&_blockquote]:my-3
            [&_hr]:border-white/10 [&_hr]:my-4">
            <ReactMarkdown>{challenge.race_description}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* Distance / Elevation */}
      <section className="mx-4 mt-3 grid grid-cols-2 gap-3">
        <div className="bg-surface-container p-5 rounded-2xl border-l-4 border-secondary">
          <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest block mb-1">Distance</span>
          <span className="text-3xl font-headline italic-bold text-on-surface">{challenge.distance.split(' ')[0]}</span>
          <span className="text-base font-headline italic-bold text-secondary ml-1">{challenge.distance.split(' ')[1]}</span>
        </div>
        <div className="bg-surface-container p-5 rounded-2xl border-l-4 border-primary">
          <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest block mb-1">Elevation</span>
          {challenge.elevationGainM != null ? (
            <>
              <span className="text-3xl font-headline italic-bold text-on-surface">{Math.round(challenge.elevationGainM)}</span>
              <span className="text-base font-headline italic-bold text-primary ml-1">M</span>
            </>
          ) : (
            <span className="text-3xl font-headline italic-bold text-on-surface">{challenge.elevation}</span>
          )}
        </div>
      </section>

      {/* Stats Row */}
      <section className="mx-4 mt-3 grid grid-cols-2 gap-3">
        <div className="bg-surface-container rounded-xl p-4 border border-white/5">
          <p className="text-[9px] text-on-surface-variant uppercase tracking-widest mb-1">日期</p>
          <p className="text-sm font-bold text-on-surface">{formatDateRange(challenge.startDate, challenge.time)}</p>
        </div>
        <div className="bg-surface-container rounded-xl p-4 border border-white/5">
          <p className="text-[9px] text-on-surface-variant uppercase tracking-widest mb-1">剩餘時間</p>
          <p className="text-sm font-bold text-on-surface">
            {daysRemaining === null ? '—' : daysRemaining <= 0 ? '已結束' : `${daysRemaining} 天`}
          </p>
        </div>
        <div className="bg-surface-container rounded-xl p-4 border border-white/5">
          <p className="text-[9px] text-on-surface-variant uppercase tracking-widest mb-1">完成人數</p>
          <p className="text-sm font-bold text-on-surface">
            {leaderboardEntries.length > 0 ? `${leaderboardEntries.length} 人` : '—'}
          </p>
        </div>
        <div className="bg-surface-container rounded-xl p-4 border border-white/5">
          <p className="text-[9px] text-on-surface-variant uppercase tracking-widest mb-1">最佳成績</p>
          <p className="text-sm font-bold text-on-surface">
            {personalBest?.elapsed_time != null
              ? formatElapsedTime(personalBest.elapsed_time)
              : isLoggedIn ? '未完賽' : '—'}
          </p>
        </div>
      </section>

      {/* Route Map */}
      {challenge.polyline && (
        <section className="mx-4 mt-3">
          <div className="bg-surface-container rounded-2xl overflow-hidden shadow-xl border border-white/5">
            <div className="flex justify-between items-center px-6 pt-5 pb-3">
              <h3 className="font-headline italic-bold text-xl tracking-tight uppercase">路線地圖</h3>
              {challenge.stravaId ? (
                <a
                  href={`https://www.strava.com/segments/${challenge.stravaId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[10px] text-[#FC4C02] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity"
                >
                  <ExternalLink className="w-3 h-3" />
                  在 Strava 查看
                </a>
              ) : (
                <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">Segment Route</span>
              )}
            </div>
            <div className="w-full h-64">
              <MapThumbnail encoded={challenge.polyline} />
            </div>
          </div>
        </section>
      )}

      {/* Sticky Footer */}
      {(daysRemaining === null || daysRemaining > 0) && (
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-surface to-transparent z-50">
          <button onClick={() => onNavigate('register')} className="w-full bg-secondary hover:bg-secondary/90 text-on-secondary py-5 rounded-2xl font-headline italic-bold text-xl uppercase tracking-wider shadow-[0_20px_40px_rgba(134,252,136,0.2)] active:scale-95 transition-all">
            立即報名 (CONFIRM REGISTRATION)
          </button>
        </div>
      )}
    </motion.div>
  );
}

function RuleItem({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex items-start gap-4 bg-surface-container-low p-5 rounded-2xl shadow-md border border-white/5">
      <div className="mt-1">{icon}</div>
      <div>
        <p className="text-on-surface font-bold text-sm">{title}</p>
        <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function AdminScreen({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const { segments } = useSegmentData();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [ogImage, setOgImage] = useState('');
  const [raceDesc, setRaceDesc] = useState('');
  const [teamName, setTeamName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const selected = segments.find(s => s.id === selectedId);

  function handleSelect(seg: StravaSegment) {
    setSelectedId(seg.id);
    setOgImage(seg.og_image ?? '');
    setRaceDesc(seg.race_description ?? '');
    setTeamName(seg.team ?? '');
    setSaveMsg(null);
  }

  async function handleSave() {
    if (!selectedId) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      await upsertSegmentMetadata(selectedId, {
        og_image: ogImage || undefined,
        race_description: raceDesc || undefined,
        team_name: teamName || undefined,
      });
      setSaveMsg('儲存成功 ✓');
    } catch {
      setSaveMsg('儲存失敗，請再試一次');
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pb-32">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-surface/90 backdrop-blur border-b border-white/5 flex items-center gap-3 px-4 py-4">
        <button onClick={() => onNavigate('profile')} className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors cursor-pointer">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-headline italic-bold text-lg uppercase tracking-tight">後台管理</h1>
      </div>

      <div className="px-4 mt-6 space-y-6">
        {/* Segment selector */}
        <div>
          <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-3">選擇路段</p>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {segments.map(seg => (
              <button
                key={seg.id}
                onClick={() => handleSelect(seg)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors ${
                  selectedId === seg.id
                    ? 'bg-primary/15 border-primary/40 text-on-surface'
                    : 'bg-surface-container border-white/5 text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span className="font-medium">{seg.displayName}</span>
                {seg.team && <span className="text-[10px] ml-2 text-on-surface-variant">{seg.team}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Edit form */}
        {selected && (
          <div className="space-y-4">
            <div className="h-px bg-white/5" />
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">編輯：{selected.displayName}</p>

            {/* OG Image URL */}
            <div>
              <label className="flex items-center gap-1.5 text-[10px] text-on-surface-variant uppercase tracking-widest mb-2">
                <ImageIcon className="w-3 h-3" />
                活動圖片 URL（og:image）
              </label>
              <input
                type="url"
                value={ogImage}
                onChange={e => setOgImage(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm border border-white/10 focus:outline-none focus:border-primary/50 placeholder-on-surface-variant/40"
              />
              {ogImage && (
                <div className="mt-2 rounded-xl overflow-hidden border border-white/10 aspect-[1200/630]">
                  <img src={ogImage} alt="og preview" className="w-full h-full object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              )}
            </div>

            {/* Team Name */}
            <div>
              <label className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-2 block">車隊名稱</label>
              <input
                type="text"
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                placeholder="TCU ELITE"
                className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm border border-white/10 focus:outline-none focus:border-primary/50 placeholder-on-surface-variant/40"
              />
            </div>

            {/* Race Description */}
            <div>
              <label className="text-[10px] text-on-surface-variant uppercase tracking-widest mb-2 block">賽事說明</label>
              <textarea
                value={raceDesc}
                onChange={e => setRaceDesc(e.target.value)}
                placeholder="賽事簡介、規則、注意事項…"
                rows={5}
                className="w-full bg-surface-container rounded-xl px-4 py-3 text-sm border border-white/10 focus:outline-none focus:border-primary/50 placeholder-on-surface-variant/40 resize-none"
              />
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-primary text-on-primary py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? '儲存中…' : '儲存'}
            </button>

            {saveMsg && (
              <p className={`text-center text-xs ${saveMsg.includes('成功') ? 'text-secondary' : 'text-error'}`}>
                {saveMsg}
              </p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
