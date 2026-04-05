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
} from 'lucide-react';

import { Screen, Challenge, User } from './types';
import { useSegmentData, StravaSegment } from './hooks/useSegmentData';
import { MapThumbnail } from './components/MapThumbnail';
import { getLeaderboard, getMyRegistrations, getMySegmentElapsedTimes, getSegmentRegistrations, getSegmentElapsedTimes, registerChallenge, unregisterChallenge, RegistrationRecord, getTCUMemberByStravaId, TCUMemberProfile, findTCUMemberByIdOrAccount, checkTcuAccountBinding, triggerMemberBindingOtp, verifyMemberOtp, confirmMemberBinding, clearMemberOtp, TCUMemberSearch, upsertSegmentMetadata } from './services/api';

interface LeaderboardEntry {
  rank?: number;
  athlete_id?: number;
  athlete_name?: string;
  athlete_profile?: string;
  elapsed_time?: number;
  start_date_local?: string;
}

function formatElapsedTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
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
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAfjqEHprsLubLBwLOtMXjuLlB8HMahsaznYvH36nuKfUvoB7g7oqkQ-dVjRxLqftIGKAd5Iy8A1-FTxbDAp5yI2ntYfPffWbmCBNmJX5BV6RAw8smlKbEobvJPbatCEhfmJgYzBEzu5lXm8fqNkXfoKBbuQiJfG6ThwdhYCSwzwXYLL3rheSaGIh51zIMe6k190X0rNGayVRsnelaAI7qctK5yBov_UllfnDfJ6SsZm2TwmjEe1R3XJifczDtEw7Eo9aQSI2J9dl0G',
    status: 'hot',
    reward: '+450 PTS'
  },
  {
    id: '2',
    title: 'THE RED RIDGE',
    distance: '87 KM',
    elevation: '3,275 M',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAyiYYkckDcnssqWFjSfkmjoPnNnMTLP8mxoPtcXpjHsurva96XIvG-5vWlv-HpccC6T6RjLwU0NO4Cqd7APtQJTaTE8Qt4QYS-pn_xfOOkaC7a3CG3jgPsaREiCuWxJicr40F-HSDQn_NlmRHjSG7L6Mtrw9O5lmwm-w8s0uOERuTsyPtJ8C8d59aX0lTyKYGfTmWICKt2QxAyDJoe3ScpDt0h1mmKF68sNj43QFv72zfMjELKEpytmFKpEAw9rtCTXZtMO02u7qyC',
    status: 'new'
  },
  {
    id: '3',
    title: 'EARLY MORNING MARATHON TRAINING',
    distance: '—',
    elevation: '—',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC4DvLqI7W47428A5NCztnVQVtng_6SptDuDpLzZmhaMjK0mvf3ufV1uTGajZPWQ3oN5UDsz-FKyzHhuHzU10BJt-eDY2ZJvepocMTZ0G1DfM3LjhIPpbQF6-gYTz0Ta_g_6-xGGg7jTMNHCnqLqOhF42LtTQOGzZ3Q5_ncIsD2TQo6QQn3N5h3wqz90H4Q4E-0PoNz8_I8ZC-BCfPCdvgNLE8fViOIyC9nf5H4f8KIwaqdZqzbLw1ibJUaGw7M2P8AIs67h0Lj21c-',
    status: 'live',
    participants: '2.4k 參加中',
    time: '06:30 - 08:30'
  },
  {
    id: '4',
    title: 'ENDURANCE POWER CHALLENGE',
    distance: '—',
    elevation: '—',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDetM_-jDG75bwMLojuJB7tVb-dYAbTW-xnMucBqZKbBAjzEc71yqHA064KJWKCxYJf9gVr0R_SC1vpYVD85-2MjTVcc-l3byM6YXqkdjhhTk3Uf0DU9nmPH8JNiDnPkiokcqfe6LGRhJ_LgDQpzsDI4o3s_Uq78TN8GZLu8hQ0DUNSJQ0_Lv5hmOpWj0MbnRrSeNRe5eqCa3dCqR0TOOQeKEyU7fIvleYSl6NIcFKpEAw9rtCTXZtMO02u7qyC',
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
          {isDetail ? (
            <button onClick={onBack} className="p-2 hover:bg-surface-container rounded-full transition-colors">
              <ChevronLeft className="w-6 h-6 text-on-surface" />
            </button>
          ) : (
            <button className="p-2 hover:bg-surface-container rounded-full transition-colors">
              <MenuIcon className="w-6 h-6 text-primary" />
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
                    className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20"
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
        <div className="flex justify-between items-center">
          <h3 className="text-xl italic-bold font-headline uppercase tracking-wide">進行中挑戰</h3>
          <button className="text-[10px] text-primary italic-bold uppercase">VIEW ALL</button>
        </div>

        {isLoading && (
          <div className="text-center text-on-surface/50 py-8 text-sm">載入中...</div>
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
              <button
                key={seg.id}
                onClick={() => onNavigate('race-detail', challenge)}
                className={`w-full bg-surface-container rounded-2xl overflow-hidden flex items-center gap-3 p-3 text-left transition-all active:scale-[0.98] border border-surface-container-highest/40 ${
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
                    <Clock size={10} className="shrink-0" />
                    <span>
                      {seg.distance ? `${(seg.distance / 1000).toFixed(1)} km` : '—'}
                      {' · '}
                      {seg.average_grade ? `${seg.average_grade.toFixed(1)}%` : '—'}
                    </span>
                  </div>
                </div>

                {/* 右側按鈕 */}
                <div className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-full ${isExpired ? 'bg-white/10' : 'bg-[#FC5200]'}`}>
                  <Plus size={14} className="text-white" />
                </div>
              </button>
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
        className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-primary hover:bg-primary hover:text-on-primary transition-all"
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

  // 取得報名清單 + 選填成績（合併）
  useEffect(() => {
    if (!selectedSeg) return;
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      try {
        // 主資料：所有報名者
        const regs: RegistrationRecord[] = await getSegmentRegistrations(selectedSeg.id);

        // 次要資料（優先序高→低）：segment_elapsed_times > Strava 排行榜
        const dbTimeMap = await getSegmentElapsedTimes(selectedSeg.id);

        let stravaTimeMap = new Map<number, number>();
        if (accessToken && selectedSeg.strava_id) {
          try {
            const lb = await getLeaderboard(String(selectedSeg.strava_id), accessToken);
            const lbList: LeaderboardEntry[] = Array.isArray(lb) ? lb : (lb.entries ?? []);
            lbList.forEach(e => {
              if (e.athlete_id != null && e.elapsed_time != null) {
                stravaTimeMap.set(e.athlete_id, e.elapsed_time);
              }
            });
          } catch {
            // 排行榜無法取得，僅顯示報名清單
          }
        }

        if (!cancelled) {
          // 保留報名順序作為基礎序號
          const withTime: RankingEntry[] = regs.map(r => ({
            athleteId: r.strava_athlete_id,
            name: r.athlete_name,
            profile: r.athlete_profile,
            team: r.team,
            elapsedTime: dbTimeMap.get(r.strava_athlete_id) ?? stravaTimeMap.get(r.strava_athlete_id) ?? null,
          }));
          const hasResults = withTime.some(e => e.elapsedTime !== null);
          if (hasResults) {
            // 有成績：完成者依時間正序排前，未完成者依報名順序排後
            const done = withTime.filter(e => e.elapsedTime !== null).sort((a, b) => a.elapsedTime! - b.elapsedTime!);
            const pending = withTime.filter(e => e.elapsedTime === null);
            setRankingEntries([...done, ...pending]);
          } else {
            // 無人完成：依報名順序顯示
            setRankingEntries(withTime);
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedSeg, accessToken]);

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
            <div className="text-center text-on-surface/50 py-12 text-sm">載入中...</div>
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
                isUser={entry.athleteId === athlete?.id}
              />
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
}

function ChallengerRow({ rank, name, profile, time, isUser }: { rank: string, name: string, profile?: string, time: string, isUser?: boolean }) {
  return (
    <div className={`flex items-center p-4 rounded-2xl transition-all ${isUser ? 'bg-surface-container-highest border-l-4 border-secondary shadow-lg' : 'bg-surface-container-low hover:bg-surface-container'}`}>
      <span className={`font-headline italic-bold text-2xl w-12 ${isUser ? 'text-secondary' : 'text-on-surface-variant/40'}`}>{rank}</span>
      <div className="w-10 h-10 rounded-full overflow-hidden mr-4 border border-surface-container-highest">
        {profile ? (
          <img src={profile} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant text-xs font-bold">{name.charAt(0)}</div>
        )}
      </div>
      <div className="flex-grow">
        <h4 className="text-sm font-bold text-white uppercase">{name}</h4>
        {isUser && (
          <span className="text-[8px] bg-secondary/20 text-secondary px-1.5 py-0.5 rounded font-bold uppercase">Personal Best</span>
        )}
      </div>
      <div className="text-right">
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
    setPendingId(segmentId);
    try {
      if (registeredIds.has(segmentId)) {
        await unregisterChallenge(athlete.id, segmentId);
        setRegisteredIds(prev => { const s = new Set(prev); s.delete(segmentId); return s; });
        showToast(`已取消報名：${segmentName}`);
      } else {
        const name = `${athlete.firstname} ${athlete.lastname}`.trim() || `athlete ${athlete.id}`;
        const profile = athlete.profile_medium || athlete.profile || null;
        await registerChallenge(athlete.id, name, segmentId, profile);
        setRegisteredIds(prev => new Set(prev).add(segmentId));
        showToast(`報名成功：${segmentName} 🎉`);
      }
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

  const FALLBACK_IMG = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="space-y-8"
    >
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-surface-container-highest text-white text-sm px-5 py-3 rounded-2xl shadow-2xl border border-white/10 max-w-[90vw] text-center animate-fade-in">
          {toast}
        </div>
      )}

      <header className="px-6">
        <h1 className="italic-bold font-headline text-4xl uppercase tracking-tighter text-primary">報名賽事</h1>
        <p className="text-on-surface-variant text-sm mt-1 font-medium">UPCOMING EVENTS</p>
      </header>

      {/* Carousel — active segments */}
      <section className="relative">
        <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-4 px-6 pb-4">
          {isLoading ? (
            <div className="min-w-[85vw] snap-center h-80 rounded-2xl bg-surface-container-low animate-pulse" />
          ) : active.length === 0 ? (
            <div className="min-w-[85vw] snap-center flex items-center justify-center h-48 rounded-2xl bg-surface-container-low text-on-surface-variant text-sm">
              目前無進行中挑戰
            </div>
          ) : active.map(seg => {
            const challenge = segmentToChallenge(seg);
            const daysLeft = getDaysRemaining(seg.end_date);
            return (
              <div
                key={seg.id}
                onClick={() => onNavigate('race-detail', challenge)}
                className="min-w-[85vw] snap-center relative overflow-hidden rounded-2xl bg-surface-container-low shadow-2xl group cursor-pointer"
              >
                <div className="absolute top-0 left-0 w-1.5 h-full z-10 bg-secondary" />
                <div className="h-64 w-full relative">
                  {seg.polyline ? (
                    <MapThumbnail encoded={seg.polyline} />
                  ) : (
                    <img
                      src={seg.og_image || FALLBACK_IMG}
                      alt={seg.name}
                      className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
                  {daysLeft !== null && daysLeft > 0 && (
                    <div className="absolute top-4 right-4 bg-secondary text-white text-[10px] italic-bold px-3 py-1 rounded-full uppercase tracking-widest">{daysLeft} 天</div>
                  )}
                </div>
                <div className="p-6 -mt-16 relative z-10 glass-panel mx-2 rounded-xl mb-4 shadow-xl border border-white/5">
                  <h2 className="italic-bold font-headline text-2xl mb-4 text-white uppercase">{seg.description || seg.name}</h2>
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex flex-col">
                      <span className="text-on-surface-variant text-[10px] uppercase tracking-widest">距離</span>
                      <span className="italic-bold font-headline text-2xl text-primary">{challenge.distance}</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-on-surface-variant text-[10px] uppercase tracking-widest">坡度</span>
                      <span className="italic-bold font-headline text-2xl text-white">{challenge.elevation}</span>
                    </div>
                  </div>
                  {seg.end_date && (
                    <div className="flex items-center gap-2 text-on-surface-variant text-xs mb-4">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>截止：{seg.end_date?.slice(0, 10)}</span>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={e => { e.stopPropagation(); onNavigate('race-detail', challenge); }}
                      className="flex-1 border border-white/20 text-white py-4 rounded-xl italic-bold font-headline uppercase tracking-widest active:scale-[0.98] transition-all flex justify-center items-center gap-2"
                    >
                      詳情
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleRegister(seg.id, seg.description || seg.name); }}
                      disabled={pendingId === seg.id}
                      className={`flex-1 py-4 rounded-xl italic-bold font-headline uppercase tracking-widest active:scale-[0.98] transition-all flex justify-center items-center gap-2 shadow-lg ${
                        registeredIds.has(seg.id)
                          ? 'bg-secondary/20 text-secondary border border-secondary/40'
                          : 'bg-primary text-on-primary shadow-primary/20'
                      }`}
                    >
                      {pendingId === seg.id ? '...' : registeredIds.has(seg.id) ? '已報名 ✓' : '立即報名'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* All Segments List */}
      <section className="px-6 space-y-8">
        <h3 className="italic-bold font-headline text-xl text-white uppercase tracking-widest">
          所有挑戰 <span className="text-xs text-on-surface-variant font-normal">ALL CHALLENGES</span>
        </h3>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 rounded-2xl bg-surface-container-high animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {active.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                  <span className="text-sm font-bold text-secondary uppercase tracking-wider">進行中 (Active)</span>
                </div>
                {active.map(seg => {
                  const challenge = segmentToChallenge(seg);
                  const daysLeft = getDaysRemaining(seg.end_date);
                  const isRegistered = registeredIds.has(seg.id);
                  return (
                    <div
                      key={seg.id}
                      className="bg-surface-container-high rounded-2xl p-5 border-l-4 border-secondary shadow-lg"
                    >
                      <button
                        onClick={() => onNavigate('race-detail', challenge)}
                        className="w-full text-left"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            {daysLeft !== null && <div className="bg-secondary/10 text-secondary text-[10px] font-bold px-2 py-0.5 rounded inline-block mb-2">{daysLeft} 天</div>}
                            <h4 className="italic-bold font-headline text-lg text-white leading-tight uppercase">{seg.description || seg.name}</h4>
                            {seg.end_date && <p className="text-on-surface-variant text-[10px] mt-1">截止 {seg.end_date?.slice(0, 10)}</p>}
                          </div>
                          <div className="text-right shrink-0 ml-4">
                            <div className="italic-bold font-headline text-primary text-xl">{challenge.distance}</div>
                            <div className="text-[10px] text-on-surface-variant">{challenge.elevation}</div>
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => handleRegister(seg.id, seg.description || seg.name)}
                        disabled={pendingId === seg.id}
                        className={`mt-4 w-full py-3 rounded-xl italic-bold font-headline text-sm uppercase tracking-widest active:scale-[0.98] transition-all ${
                          isRegistered
                            ? 'bg-secondary/15 text-secondary border border-secondary/30'
                            : 'bg-primary text-on-primary'
                        }`}
                      >
                        {pendingId === seg.id ? '處理中...' : isRegistered ? '已報名 ✓ 點擊取消' : '立即報名'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {expired.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-on-surface-variant" />
                  <span className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">已結束 (Ended)</span>
                </div>
                {expired.map(seg => {
                  const challenge = segmentToChallenge(seg);
                  return (
                    <button
                      key={seg.id}
                      onClick={() => onNavigate('race-detail', challenge)}
                      className="w-full bg-surface-container-high rounded-2xl p-5 opacity-50 text-left active:scale-[0.98] transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="bg-surface-container text-on-surface-variant text-[10px] font-bold px-2 py-0.5 rounded inline-block mb-2">已結束</div>
                          <h4 className="italic-bold font-headline text-lg text-white leading-tight uppercase">{seg.description || seg.name}</h4>
                          {seg.end_date && <p className="text-on-surface-variant text-[10px] mt-1">截止 {seg.end_date?.slice(0, 10)}</p>}
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <div className="italic-bold font-headline text-white text-xl">{challenge.distance}</div>
                          <div className="text-[10px] text-on-surface-variant">{challenge.elevation}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {active.length === 0 && expired.length === 0 && (
              <p className="text-on-surface-variant text-sm text-center py-8">目前無挑戰資料</p>
            )}
          </div>
        )}

        {/* Help Section */}
        <section className="bg-surface-container rounded-2xl p-6 flex items-center justify-between shadow-xl border border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-tertiary/20 flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-tertiary" />
            </div>
            <div>
              <h5 className="text-white font-bold text-sm">需要幫助？</h5>
              <p className="text-on-surface-variant text-xs">遇到報名問題嗎？</p>
            </div>
          </div>
          <button className="text-primary italic-bold font-headline text-sm border-b-2 border-primary/30 pb-0.5 hover:opacity-80 transition-all">聯絡客服</button>
        </section>
      </section>
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
            <path className="text-outline-variant" d="M 100 20 L 180 100 L 100 180 L 20 100 Z" fill="none" stroke="currentColor" strokeDasharray="2 2" strokeWidth="0.5" />
            <path className="text-outline-variant" d="M 100 40 L 160 100 L 100 160 L 40 100 Z" fill="none" stroke="currentColor" strokeDasharray="2 2" strokeWidth="0.5" />
            <path className="text-outline-variant" d="M 100 60 L 140 100 L 100 140 L 60 100 Z" fill="none" stroke="currentColor" strokeDasharray="2 2" strokeWidth="0.5" />
            <line className="text-outline-variant" stroke="currentColor" strokeWidth="0.5" x1="100" x2="100" y1="20" y2="180" />
            <line className="text-outline-variant" stroke="currentColor" strokeWidth="0.5" x1="20" x2="180" y1="100" y2="100" />
            <polygon className="drop-shadow-[0_0_8px_rgba(56,175,70,0.4)]" fill="rgba(56, 175, 70, 0.2)" points="100,28 172,100 100,164 44,100" stroke="#38af46" strokeLinejoin="round" strokeWidth="2" />
            <circle cx="100" cy="28" fill="#38af46" r="3" />
            <circle cx="172" cy="100" fill="#38af46" r="3" />
            <circle cx="100" cy="164" fill="#38af46" r="3" />
            <circle cx="44" cy="100" fill="#38af46" r="3" />
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
          <div className="text-center text-on-surface-variant text-sm py-8">載入中...</div>
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
    if (challenge.image) setMeta('og:image', challenge.image);
    return () => { document.title = 'TCU CHALLENGE'; };
  }, [challenge]);

  async function handleShare() {
    const url = window.location.href;
    const shareData = { title: challenge.title, text: `挑戰 ${challenge.title}｜${challenge.distance}`, url };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      setShareToast('連結已複製！');
      setTimeout(() => setShareToast(null), 2500);
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
      {/* Share Toast */}
      {shareToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-surface-container-high text-on-surface text-xs font-medium px-4 py-2 rounded-full shadow-lg border border-white/10">
          {shareToast}
        </div>
      )}

      {/* Hero Section */}
      <section className="relative aspect-[1200/630] w-full overflow-hidden">
        <img
          src={challenge.image || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80'}
          alt={challenge.title}
          className="w-full h-full object-cover grayscale-[0.3] brightness-[0.7]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
        {/* Share button */}
        <button
          onClick={handleShare}
          className="absolute top-14 right-4 bg-black/30 backdrop-blur-sm text-white p-2.5 rounded-full border border-white/20 hover:bg-black/50 transition-colors"
          aria-label="分享"
        >
          <Share2 className="w-4 h-4" />
        </button>
        <div className="absolute bottom-8 left-6 right-6">
          {challenge.status === 'hot' && (
            <div className="inline-flex items-center gap-2 bg-tertiary px-3 py-1 rounded-sm mb-4 shadow-lg">
              <Flame className="w-3 h-3 text-on-tertiary fill-current" />
              <span className="text-[10px] italic-bold tracking-widest text-on-tertiary font-headline uppercase">HOT</span>
            </div>
          )}
          <h2 className="text-4xl md:text-6xl font-headline italic-bold leading-tight tracking-tighter uppercase">
            {challenge.title.split(' ').map((word, i) => (
              <span key={i} className="block">{word}</span>
            ))}
          </h2>
        </div>
      </section>

      {/* Race Specs Bento Grid */}
      <section className="px-6 -mt-8 relative z-10 grid grid-cols-2 gap-4">
        <div className="bg-surface-container-low p-6 rounded-2xl border-l-4 border-secondary flex flex-col justify-between shadow-2xl">
          <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest mb-2">Distance</span>
          <div>
            <span className="text-4xl font-headline italic-bold text-on-surface">{challenge.distance.split(' ')[0]}</span>
            <span className="text-lg font-headline italic-bold text-secondary ml-1">{challenge.distance.split(' ')[1]}</span>
          </div>
        </div>
        <div className="bg-surface-container-low p-6 rounded-2xl border-l-4 border-primary flex flex-col justify-between shadow-2xl">
          <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest mb-2">Elevation</span>
          <div>
            {challenge.elevationGainM != null ? (
              <>
                <span className="text-4xl font-headline italic-bold text-on-surface">{Math.round(challenge.elevationGainM)}</span>
                <span className="text-lg font-headline italic-bold text-primary ml-1">M</span>
              </>
            ) : (
              <span className="text-4xl font-headline italic-bold text-on-surface">{challenge.elevation}</span>
            )}
          </div>
        </div>
      </section>

      {/* Stats Row */}
      <section className="px-6 mt-4 grid grid-cols-2 gap-3">
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
        <section className="px-6 mt-10">
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

      {/* Race Description */}
      {challenge.race_description && (
        <section className="px-6 mt-10 mb-12">
          <h3 className="font-headline italic-bold text-xl tracking-tight mb-4 uppercase">比賽敘述</h3>
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
        <button onClick={() => onNavigate('profile')} className="p-2 rounded-full hover:bg-white/10 transition-colors">
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
