import { useState, useEffect, useCallback } from 'react';
import { api, getApiErrorMessage } from './services/api';
import { Club } from './types';
import { ToastProvider, useToast } from './context/ToastContext';
import { HomeScreen } from './components/home/HomeScreen';
import { PlayerList } from './components/players/PlayerList';
import { ClubList } from './components/clubs/ClubList';
import { ClubDetailView } from './components/clubs/ClubDetailView';
import { LeagueModule } from './components/league/LeagueModule';
import { 
  Home,
  Users, 
  Shield, 
  Trophy, 
  Menu, 
  X 
} from 'lucide-react';

export function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}

function MainApp() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'home' | 'players' | 'clubs' | 'league'>('home');
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);

  const [clubs, setClubs] = useState<Club[]>([]);
  const [loadingClubs, setLoadingClubs] = useState(false);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Carregar clubes para disponibilizar em filtros e na aba de clubes
  const fetchClubs = useCallback(async () => {
    setLoadingClubs(true);
    try {
      const res = await api.get<Club[]>('/clubs');
      setClubs(res.data);
      setApiOnline(true);
    } catch (err) {
      setApiOnline(false);
      showToast('error', getApiErrorMessage(err));
    } finally {
      setLoadingClubs(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  const handleSelectClub = (clubId: number) => {
    setSelectedClubId(clubId);
    setActiveTab('clubs');
    setMobileMenuOpen(false);
  };

  const handleTabChange = (tab: 'home' | 'players' | 'clubs' | 'league') => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    if (tab !== 'clubs') {
      setSelectedClubId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 flex flex-col font-sans selection:bg-[#155DFC] selection:text-white">
      {/* Top Header - Oculto na tela de onboarding */}
      {activeTab !== 'home' && (
        <header className="border-b border-[#E4E4E7] bg-white/95 backdrop-blur sticky top-0 z-40 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleTabChange('home')}>
              <img 
                src="/logo.png" 
                alt="Passe Logo" 
                className="w-9 h-9 rounded-xl object-contain shadow-md shadow-blue-500/20" 
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold tracking-tight text-lg text-zinc-900">Passe</span>
                  <span className="text-[10px] font-mono font-semibold text-[#155DFC] bg-[#EFF6FF] border border-blue-200 px-1.5 py-0.5 rounded">
                    F5
                  </span>
                </div>
                <p className="text-[11px] text-[#686872] leading-none hidden sm:block">
                  Gestão &amp; Simulação de Futebol
                </p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 bg-[#F4F4F5] p-1 rounded-xl border border-[#E4E4E7]">
              <button
                onClick={() => handleTabChange('home')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-[#686872] hover:text-zinc-900 hover:bg-zinc-200/60 transition"
              >
                <Home className="w-4 h-4" />
                Início
              </button>

              <button
                onClick={() => handleTabChange('players')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'players'
                    ? 'bg-[#155DFC] text-white shadow-xs'
                    : 'text-[#686872] hover:text-zinc-900 hover:bg-zinc-200/60'
                }`}
              >
                <Users className="w-4 h-4" />
                Jogadores
              </button>

              <button
                onClick={() => handleTabChange('clubs')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'clubs'
                    ? 'bg-[#155DFC] text-white shadow-xs'
                    : 'text-[#686872] hover:text-zinc-900 hover:bg-zinc-200/60'
                }`}
              >
                <Shield className="w-4 h-4" />
                Clubes
              </button>

              <button
                onClick={() => handleTabChange('league')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'league'
                    ? 'bg-[#155DFC] text-white shadow-xs'
                    : 'text-[#686872] hover:text-zinc-900 hover:bg-zinc-200/60'
                }`}
              >
                <Trophy className="w-4 h-4" />
                Liga &amp; Simulação
              </button>
            </nav>

            {/* Right Status & Mobile Toggle */}
            <div className="flex items-center gap-3">
              {/* Status da Conexão */}
              <div className="flex items-center gap-2 text-xs px-2.5 py-1 rounded-full bg-white border border-[#E4E4E7] shadow-2xs">
                <span
                  className={`w-2 h-2 rounded-full ${
                    apiOnline === true
                      ? 'bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50'
                      : apiOnline === false
                      ? 'bg-rose-500'
                      : 'bg-amber-500'
                  }`}
                />
                <span className="text-[#686872] font-mono text-[11px] hidden sm:inline">
                  API {apiOnline === true ? 'Online' : apiOnline === false ? 'Offline' : 'Verificando'}
                </span>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg bg-white text-zinc-600 hover:text-zinc-900 border border-[#E4E4E7] transition shadow-2xs"
                aria-label="Abrir menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Dropdown Menu (375px responsive support) */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-[#E4E4E7] bg-white px-4 py-3 space-y-1 shadow-md animate-in slide-in-from-top duration-200">
              <button
                onClick={() => handleTabChange('home')}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-[#686872] hover:bg-zinc-100 hover:text-zinc-900 transition"
              >
                <Home className="w-4 h-4" />
                Início
              </button>
              <button
                onClick={() => handleTabChange('players')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                  activeTab === 'players'
                    ? 'bg-[#155DFC] text-white'
                    : 'text-[#686872] hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                <Users className="w-4 h-4" />
                Jogadores
              </button>
              <button
                onClick={() => handleTabChange('clubs')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                  activeTab === 'clubs'
                    ? 'bg-[#155DFC] text-white'
                    : 'text-[#686872] hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                <Shield className="w-4 h-4" />
                Clubes
              </button>
              <button
                onClick={() => handleTabChange('league')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                  activeTab === 'league'
                    ? 'bg-[#155DFC] text-white'
                    : 'text-[#686872] hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                <Trophy className="w-4 h-4" />
                Liga &amp; Simulação
              </button>
            </div>
          )}
        </header>
      )}

      {/* Main Container */}
      <main className={activeTab === 'home' ? 'w-full flex-1 flex flex-col justify-center' : 'max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full'}>
        {/* Renderização Condicional de Módulos */}
        {activeTab === 'home' && (
          <HomeScreen
            onStart={() => handleTabChange('players')}
            onNavigate={(tab, clubId) => {
              handleTabChange(tab);
              if (clubId) setSelectedClubId(clubId);
            }}
          />
        )}

        {activeTab === 'players' && (
          <PlayerList clubs={clubs} onClubClick={handleSelectClub} />
        )}

        {activeTab === 'clubs' && (
          selectedClubId ? (
            <ClubDetailView
              clubId={selectedClubId}
              onBack={() => {
                setSelectedClubId(null);
                fetchClubs();
              }}
            />
          ) : (
            <ClubList
              clubs={clubs}
              loading={loadingClubs}
              onRefresh={fetchClubs}
              onSelectClub={handleSelectClub}
            />
          )
        )}

        {activeTab === 'league' && (
          <LeagueModule />
        )}
      </main>

      {/* Footer - Oculto na tela de onboarding */}
      {activeTab !== 'home' && (
        <footer className="border-t border-[#E4E4E7] bg-white py-4 text-center text-xs text-[#686872] font-mono">
          <p>Passe - SENAI/PE · FASE 5 Frontend React + TypeScript + Tailwind CSS</p>
        </footer>
      )}
    </div>
  );
}

export default App;
