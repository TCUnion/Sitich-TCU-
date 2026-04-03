import React, { useState, useEffect } from 'react';
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
  Flame
} from 'lucide-react';

import { Screen, Challenge, User } from './types';

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
  }
];

export default function App() {
  const auth = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>(() =>
    auth.isLoggedIn ? 'explore' : 'login'
  );
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
              <ProfileScreen />
            </motion.div>
          )}
          {currentScreen === 'race-detail' && selectedChallenge && (
            <motion.div key="race-detail">
              <RaceDetailScreen challenge={selectedChallenge} />
            </motion.div>
          )}
        </AnimatePresence>
      </Layout>
    </div>
  );
}

function Layout({ children, currentScreen, onNavigate, onBack, avatar }: {
  children: React.ReactNode,
  currentScreen: Screen,
  onNavigate: (screen: Screen) => void,
  onBack: () => void,
  avatar: string,
}) {
  const isLogin = currentScreen === 'login';
  const isDetail = currentScreen === 'race-detail';

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
            <div className="ml-auto w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20">
              <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
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
            label="註冊"
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

function ExploreScreen({ onNavigate }: { onNavigate: (screen: Screen, challenge?: Challenge) => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="px-4 space-y-8"
    >
      {/* Hero Section */}
      <section className="relative rounded-2xl overflow-hidden min-h-[320px] flex items-end p-6 bg-surface-container-low shadow-xl">
        <div className="absolute inset-0 z-0">
          <img 
            src={CHALLENGES[1].image} 
            alt="Hero" 
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
        </div>
        <div className="relative z-10 w-full space-y-4">
          <div className="inline-block px-3 py-1 bg-tertiary/20 text-tertiary rounded text-[10px] font-bold tracking-widest uppercase italic">
            每週精選挑戰
          </div>
          <h2 className="text-4xl italic-bold font-headline leading-tight uppercase">THE RED RIDGE</h2>
          <button 
            onClick={() => onNavigate('race-detail', CHALLENGES[1])}
            className="bg-primary text-on-primary px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20"
          >
            <span>立即註冊</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Live Events */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl italic-bold font-headline uppercase tracking-wide">進行中的活動</h3>
          <button className="text-[10px] text-primary italic-bold uppercase">VIEW ALL</button>
        </div>
        <div className="space-y-4">
          <EventCard 
            title="Early Morning Marathon Training"
            participants="2.4k 參加中"
            time="06:30 - 08:30"
            image="https://lh3.googleusercontent.com/aida-public/AB6AXuC4DvLqI7W47428A5NCztnVQVtng_6SptDuDpLzZmhaMjK0mvf3ufV1uTGajZPWQ3oN5UDsz-FKyzHhuHzU10BJt-eDY2ZJvepocMTZ0G1DfM3LjhIPpbQF6-gYTz0Ta_g_6-xGGg7jTMNHCnqLqOhF42LtTQOGzZ3Q5_ncIsD2TQo6QQn3N5h3wqz90H4Q4E-0PoNz8_I8ZC-BCfPCdvgNLE8fViOIyC9nf5H4f8KIwaqdZqzbLw1ibJUaGw7M2P8AIs67h0Lj21c-"
          />
          <EventCard 
            title="Endurance Power Challenge"
            participants="842 參加中"
            time="進行中 01:24:12"
            image="https://lh3.googleusercontent.com/aida-public/AB6AXuDetM_-jDG75bwMLojuJB7tVb-dYAbTW-xnMucBqZKbBAjzEc71yqHA064KJWKCxYJf9gVr0R_SC1vpYVD85-2MjTVcc-l3byM6YXqkdjhhTk3Uf0DU9nmPH8JNiDnPkiokcqfe6LGRhJ_LgDQpzsDI4o3s_Uq78TN8GZLu8hQ0DUNSJQ0_Lv5hmOpWj0MbnRrSeNRe5eqCa3dCqR0TOOQeKEyU7fIvleYSl6NIcFKqDr7V9tBYH3ZNEbRYZ58W4WHsaOWLcqkERsBD"
            isTimer
          />
        </div>
      </section>
    </motion.div>
  );
}

function EventCard({ title, participants, time, image, isTimer }: { title: string, participants: string, time: string, image: string, isTimer?: boolean }) {
  return (
    <div className="relative bg-surface-container-high rounded-2xl overflow-hidden flex items-center p-4 gap-4 shadow-md border border-surface-container-highest/50">
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
      <button className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-primary hover:bg-primary hover:text-on-primary transition-all">
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
}

function RankingScreen() {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="px-4"
    >
      {/* Event Carousel */}
      <section className="mb-6">
        <div className="flex overflow-x-auto gap-4 hide-scrollbar py-2 snap-x">
          <div className="flex-none w-72 h-40 relative rounded-2xl overflow-hidden snap-center group cursor-pointer shadow-lg">
            <img src={CHALLENGES[1].image} alt="Active" className="absolute inset-0 w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute bottom-4 left-4">
              <p className="text-tertiary font-headline italic-bold text-xs uppercase tracking-widest mb-1">Active Challenge</p>
              <h3 className="text-white font-headline italic-bold text-xl uppercase">The Red Ridge</h3>
            </div>
          </div>
          <div className="flex-none w-72 h-40 relative rounded-2xl overflow-hidden snap-center opacity-60 shadow-lg">
            <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAbLWgqWcTZ_-mV7f9W7F-n2A7qAQn-1BBM23OujJASMJGXktVXIhPdLf_AjaNdeL8PH8B6Rvu6PG_TOIoKV2i9p3PbwGnEKvKogOPDDOWCCctQT9pN6oWJdGVeeiW4-bmHTKPhhD_mTKD4qgwLaSt4iyfdW2z5TiR12x0qmjyqPHqaZxVlWttO3tuKj9blX0Qju-7gkE3fMfOJLAuD1xGtTjWeP3SBPnSj1XBsP4pOvYIvhEyueIv69K2rS02tvpPt2ZTUS5HWcCtY" alt="Locked" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute bottom-4 left-4">
              <p className="text-on-surface-variant font-headline italic-bold text-xs uppercase tracking-widest mb-1">Locked</p>
              <h3 className="text-white font-headline italic-bold text-xl uppercase">Taipei Pass</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Filter */}
      <section className="mb-8 overflow-x-auto hide-scrollbar flex gap-2 py-1">
        <button className="px-5 py-2 rounded-full text-xs font-bold bg-secondary text-on-secondary border border-secondary shadow-lg shadow-secondary/20">進行中的賽事</button>
        <button className="px-5 py-2 rounded-full text-xs font-bold bg-surface-container text-on-surface-variant border border-outline/20">歷史賽事</button>
        <button className="px-5 py-2 rounded-full text-xs font-bold bg-surface-container text-on-surface-variant border border-outline/20">全部賽事</button>
      </section>

      {/* User Rank Hero */}
      <section className="flex flex-col items-center mb-10">
        <div className="relative mb-8">
          <div className="w-44 h-44 rounded-full border-4 border-primary flex items-center justify-center p-2 shadow-[0_0_30px_rgba(253,228,43,0.3)]">
            <div className="w-full h-full rounded-full overflow-hidden border-4 border-surface-container">
              <img src={MOCK_USER.avatar} alt="User" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-primary text-on-primary font-headline italic-bold text-2xl px-8 py-1.5 rounded-full kinetic-slant shadow-xl">
            RANK #1
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full">
          <div className="bg-surface-container-low p-5 rounded-2xl border-l-4 border-secondary flex flex-col justify-between shadow-lg">
            <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-tighter">個人最佳時間</span>
            <div className="mt-2">
              <span className="text-2xl font-headline italic-bold text-white">{MOCK_USER.personalBest}</span>
            </div>
          </div>
          <div className="bg-surface-container-low p-5 rounded-2xl border-l-4 border-tertiary flex flex-col justify-between shadow-lg">
            <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-tighter">目前百分比排名</span>
            <div className="mt-2">
              <span className="text-2xl font-headline italic-bold text-white">{MOCK_USER.percentile}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Challengers List */}
      <section className="mb-12">
        <div className="flex justify-between items-end mb-6 px-2">
          <h2 className="font-headline italic-bold text-xl uppercase tracking-wider text-secondary">CHALLENGERS</h2>
          <span className="text-[10px] text-on-surface-variant uppercase font-medium">Weekly Reset: 2d 14h</span>
        </div>
        <div className="space-y-3">
          <ChallengerRow rank="04" name="Chen Wei-Ming" bike="Scott Foil RC" time="14:45.2" />
          <ChallengerRow rank="05" name="YOU (LEO)" bike="Personal Best" time="14:58.8" isUser />
          <ChallengerRow rank="06" name="Lin Jia-Yi" bike="Specialized Tarmac SL8" time="15:02.1" />
        </div>
      </section>
    </motion.div>
  );
}

function ChallengerRow({ rank, name, bike, time, isUser }: { rank: string, name: string, bike: string, time: string, isUser?: boolean }) {
  return (
    <div className={`flex items-center p-4 rounded-2xl transition-all ${isUser ? 'bg-surface-container-highest border-l-4 border-secondary shadow-lg' : 'bg-surface-container-low hover:bg-surface-container'}`}>
      <span className={`font-headline italic-bold text-2xl w-12 ${isUser ? 'text-secondary' : 'text-on-surface-variant/40'}`}>{rank}</span>
      <div className="w-10 h-10 rounded-full overflow-hidden mr-4 border border-surface-container-highest">
        <img src={`https://i.pravatar.cc/150?u=${name}`} alt={name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-grow">
        <h4 className="text-sm font-bold text-white uppercase">{name}</h4>
        {isUser ? (
          <span className="text-[8px] bg-secondary/20 text-secondary px-1.5 py-0.5 rounded font-bold uppercase">Personal Best</span>
        ) : (
          <p className="text-xs text-on-surface-variant">{bike}</p>
        )}
      </div>
      <div className="text-right">
        <span className={`text-sm font-headline italic-bold ${isUser ? 'text-secondary' : 'text-white'}`}>{time}</span>
      </div>
    </div>
  );
}

function RegisterScreen({ onNavigate }: { onNavigate: (screen: Screen, challenge?: Challenge) => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="space-y-8"
    >
      <header className="px-6">
        <h1 className="italic-bold font-headline text-4xl uppercase tracking-tighter text-primary">報名賽事</h1>
        <p className="text-on-surface-variant text-sm mt-1 font-medium">UPCOMING EVENTS</p>
      </header>

      {/* Carousel */}
      <section className="relative">
        <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-4 px-6 pb-4">
          {CHALLENGES.map(challenge => (
            <div 
              key={challenge.id}
              onClick={() => onNavigate('race-detail', challenge)}
              className="min-w-[85vw] snap-center relative overflow-hidden rounded-2xl bg-surface-container-low shadow-2xl group cursor-pointer"
            >
              <div className={`absolute top-0 left-0 w-1.5 h-full z-10 ${challenge.status === 'hot' ? 'bg-secondary' : 'bg-tertiary'}`} />
              <div className="h-64 w-full relative">
                <img src={challenge.image} alt={challenge.title} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
                {challenge.status === 'hot' && (
                  <div className="absolute top-4 right-4 bg-tertiary text-white text-[10px] italic-bold px-3 py-1 rounded-full uppercase tracking-widest">熱門</div>
                )}
              </div>
              <div className="p-6 -mt-16 relative z-10 glass-panel mx-2 rounded-xl mb-4 shadow-xl border border-white/5">
                <h2 className="italic-bold font-headline text-2xl mb-4 text-white uppercase">{challenge.title}</h2>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex flex-col">
                    <span className="text-on-surface-variant text-[10px] uppercase tracking-widest">距離</span>
                    <span className="italic-bold font-headline text-2xl text-primary">{challenge.distance}</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-on-surface-variant text-[10px] uppercase tracking-widest">爬升</span>
                    <span className="italic-bold font-headline text-2xl text-white">{challenge.elevation}</span>
                  </div>
                </div>
                <button className="w-full bg-primary text-on-primary py-4 rounded-xl italic-bold font-headline uppercase tracking-widest active:scale-[0.98] transition-all flex justify-center items-center gap-2 shadow-lg shadow-primary/20">
                  查看詳情
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* All Events List */}
      <section className="px-6 space-y-8">
        <h3 className="italic-bold font-headline text-xl text-white uppercase tracking-widest">所有賽事 <span className="text-xs text-on-surface-variant font-normal">ALL EVENTS</span></h3>
        
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span className="text-sm font-bold text-secondary uppercase tracking-wider">進行中 (Ongoing)</span>
            </div>
            <div className="bg-surface-container-high rounded-2xl p-5 border-l-4 border-secondary shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <div className="bg-secondary/10 text-secondary text-[10px] font-bold px-2 py-0.5 rounded inline-block mb-2">LIVE</div>
                  <h4 className="italic-bold font-headline text-lg text-white leading-tight uppercase">Taichung Urban Dash</h4>
                  <p className="text-on-surface-variant text-[10px] mt-1">2024.08.10 - 2024.08.15</p>
                </div>
                <div className="text-right">
                  <div className="italic-bold font-headline text-primary text-xl">30 KM</div>
                  <div className="text-[10px] text-on-surface-variant">45 M ELEV</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-tertiary" />
              <span className="text-sm font-bold text-tertiary uppercase tracking-wider">待報名 (Open for Registration)</span>
            </div>
            <div className="bg-surface-container-high rounded-2xl p-5 border-l-4 border-tertiary shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="italic-bold font-headline text-lg text-white leading-tight uppercase">Central Mountain Challenge</h4>
                  <p className="text-primary text-[10px] font-bold mt-1">報名中：即日起 - 10.01</p>
                </div>
                <div className="text-right">
                  <div className="italic-bold font-headline text-primary text-xl">160 KM</div>
                  <div className="text-[10px] text-on-surface-variant uppercase">2,100 M ELEV</div>
                </div>
              </div>
            </div>
          </div>
        </div>

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

function ProfileScreen() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="px-5 max-w-md mx-auto pb-12"
    >
      {/* Radar Chart Section */}
      <section className="relative flex flex-col items-center mb-10">
        <div className="relative w-72 h-72 flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 200 200">
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
            <text className="font-bold" fill="white" fontSize="10" textAnchor="start" x="185" y="103">公路</text>
            <text className="font-bold" fill="white" fontSize="10" textAnchor="middle" x="100" y="195">登山</text>
            <text className="font-bold" fill="white" fontSize="10" textAnchor="end" x="15" y="103">繞圈</text>
            <text className="font-bold" fill="white" fontSize="10" textAnchor="middle" x="100" y="15">計時</text>
          </svg>
        </div>
        <div className="mt-6 text-center">
          <h2 className="font-headline italic-bold text-4xl uppercase tracking-tight text-primary">{MOCK_USER.name}</h2>
          <p className="text-on-surface-variant text-sm mt-1 uppercase tracking-widest">{MOCK_USER.team}</p>
        </div>
      </section>

      {/* Member Profile */}
      <section className="mb-10 space-y-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="bg-secondary p-3 rounded-2xl shadow-lg shadow-secondary/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-headline italic-bold text-2xl uppercase text-on-surface">TCU 會員資料</h3>
              <span className="bg-secondary/20 text-secondary text-[10px] font-bold px-2 py-0.5 rounded border border-secondary/30">付費車隊管理員</span>
            </div>
            <p className="text-on-surface-variant text-[10px] mt-0.5 tracking-wider"># TCU-ZVNRQONH9COQY4KQ</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <UserIcon className="w-4 h-4" />
              <span className="text-xs font-medium">基本資料</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ProfileItem label="真實姓名" value={`${MOCK_USER.name} (憲哥)`} />
              <ProfileItem label="所屬車隊" value="憲動工作室" icon={<Users className="w-3 h-3 text-secondary" />} />
              <ProfileItem label="性別 / 生日" value="男 | 1974-02-06" icon={<UserCircle className="w-3 h-3 text-secondary" />} />
              <ProfileItem label="國籍 / 身分證號" value="Taiwan | Y12****973" icon={<Globe className="w-3 h-3 text-secondary" />} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <MailIcon className="w-4 h-4" />
              <span className="text-xs font-medium">聯絡資訊</span>
            </div>
            <div className="bg-surface-container-high rounded-2xl p-5 border border-white/5 space-y-4 shadow-lg">
              <div>
                <p className="text-[10px] text-on-surface-variant uppercase mb-1">電子郵件</p>
                <div className="flex items-center gap-2">
                  <MailIcon className="w-4 h-4 text-secondary" />
                  <p className="text-sm">samkhlin@gmail.com</p>
                </div>
              </div>
              <div className="pt-4 border-t border-white/5">
                <p className="text-[10px] text-on-surface-variant uppercase mb-1">通訊地址</p>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-secondary" />
                  <p className="text-sm">408台中市南屯區東興路三段257號6樓之5</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-error/10 border border-error/20 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-4 h-4 text-error fill-current" />
              <span className="text-[10px] font-bold text-error uppercase tracking-wider">緊急聯絡人</span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-on-surface">葉** <span className="bg-error/20 text-error text-[10px] px-1.5 py-0.5 rounded ml-1">朋友</span></p>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-error" />
                <p className="text-sm italic-bold font-headline text-error">09*******40</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <FileText className="w-4 h-4" />
              <span className="text-xs font-medium">個人簡介 & 技能</span>
            </div>
            <div className="bg-surface-container-high rounded-2xl p-6 border border-white/5 shadow-lg">
              <p className="text-xs text-on-surface/80 leading-relaxed mb-6">
                在台灣真的想晉身國際舞台的未來青年精英。不要再執著於沒有激情的高山賽事，它永遠只有一套劇本。但繞圈賽永遠沒有劇本。但是有鑒於繞圈賽的心理與技術能力門檻高，所以這次採用能力組與零報名費的方式，讓全台車友可以參加人生的第一場繞圈賽。就跟寫程式一樣，「Hello world」是你學程式的第一堂課。麻糍埔繞圈賽的第一堂就是由這個『Hello! Criterium』開始。
              </p>
              <div className="pt-4 border-t border-white/5 flex items-center gap-2 text-[10px] text-on-surface-variant">
                <ExternalLink className="w-3 h-3" />
                <span>若要修正能力分組，請前往 </span>
                <button className="text-secondary underline font-bold">能力分組正確維護</button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 mt-12">
          <div className="flex justify-between items-center text-[10px] text-on-surface-variant/60">
            <div className="flex items-center gap-1.5">
              <Edit3 className="w-3 h-3" />
              <span>若需修改個人資料，請前往 <button className="underline">TCU 會員中心</button></span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>每日 08:00 更新</span>
            </div>
          </div>
          <button className="w-full bg-secondary/10 border border-secondary/30 text-secondary py-4 rounded-2xl italic-bold font-headline uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg hover:bg-secondary/20">
            完成 / 前往 DASHBOARD
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
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

function RaceDetailScreen({ challenge }: { challenge: Challenge }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-32"
    >
      {/* Hero Section */}
      <section className="relative h-[400px] w-full overflow-hidden">
        <img 
          src={challenge.image} 
          alt={challenge.title} 
          className="w-full h-full object-cover grayscale-[0.4] brightness-[0.6]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
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
            <span className="text-4xl font-headline italic-bold text-on-surface">{challenge.elevation.split(' ')[0]}</span>
            <span className="text-lg font-headline italic-bold text-primary ml-1">{challenge.elevation.split(' ')[1]}</span>
          </div>
        </div>
      </section>

      {/* Elevation Profile */}
      <section className="px-6 mt-10">
        <div className="bg-surface-container rounded-2xl p-6 relative overflow-hidden shadow-xl border border-white/5">
          <div className="flex justify-between items-end mb-8">
            <h3 className="font-headline italic-bold text-xl tracking-tight uppercase">海拔剖面圖</h3>
            <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">Vertical Gain</span>
          </div>
          <div className="h-32 flex items-end gap-1.5">
            {[20, 35, 60, 85, 100, 70, 40, 25, 15].map((h, i) => (
              <div key={i} className="flex-1 bg-secondary/10 rounded-t-lg relative group overflow-hidden" style={{ height: `${h}%` }}>
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: '100%' }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="absolute bottom-0 w-full bg-secondary opacity-40 group-hover:opacity-100 transition-all" 
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-6 text-[10px] text-on-surface-variant font-medium">
            <span>START 0KM</span>
            <span>MID 22.5KM</span>
            <span>FINISH 45KM</span>
          </div>
        </div>
      </section>

      {/* Reward Section */}
      <section className="px-6 mt-10">
        <div className="bg-surface-container-highest rounded-2xl p-6 border-l-4 border-tertiary flex items-center justify-between shadow-xl">
          <div>
            <h3 className="font-headline italic-bold text-lg tracking-tight uppercase">Race Reward</h3>
            <p className="text-xs text-on-surface-variant">完成挑戰即可獲取</p>
          </div>
          <div className="text-right">
            <span className="text-3xl font-headline italic-bold text-secondary tracking-tighter">{challenge.reward || '+450 PTS'}</span>
          </div>
        </div>
      </section>

      {/* Rules */}
      <section className="px-6 mt-10 mb-12">
        <h3 className="font-headline italic-bold text-xl tracking-tight mb-6 uppercase">賽事規則 / RULES</h3>
        <div className="space-y-4">
          <RuleItem icon={<CloudIcon className="text-secondary" />} title="Must use Strava for tracking" desc="必須使用 Strava 紀錄行程，且數據需公開。" />
          <RuleItem icon={<Hammer className="text-primary" />} title="Helmet is mandatory" desc="為了您的安全，全程必須佩戴安全帽。" />
          <RuleItem icon={<TimerIcon className="text-tertiary" />} title="Finish within 3 hours" desc="請在 3 小時內完成比賽以符合積分資格。" />
        </div>
      </section>

      {/* Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-surface to-transparent z-50">
        <button className="w-full bg-secondary hover:bg-secondary/90 text-on-secondary py-5 rounded-2xl font-headline italic-bold text-xl uppercase tracking-wider shadow-[0_20px_40px_rgba(134,252,136,0.2)] active:scale-95 transition-all">
          立即報名 (CONFIRM REGISTRATION)
        </button>
      </div>
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
