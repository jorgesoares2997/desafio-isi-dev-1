import { useState, useEffect, useCallback } from 'react';
import { api, getApiErrorMessage } from './services/api';
import { Club } from './types';
import { ToastProvider, useToast } from './context/ToastContext';
import { PlayerList } from './components/players/PlayerList';
import { ClubList } from './components/clubs/ClubList';
import { ClubDetailView } from './components/clubs/ClubDetailView';
import { LeagueModule } from './components/league/LeagueModule';
import { 
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
  const [activeTab, setActiveTab] = useState<'players' | 'clubs' | 'league'>('players');
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

  const handleTabChange = (tab: 'players' | 'clubs' | 'league') => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    if (tab !== 'clubs') {
      setSelectedClubId(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleTabChange('players')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/20 text-lg tracking-tight">
              P
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-lg text-white">Passe</span>
                <span className="text-[10px] font-mono text-blue-400 bg-blue-950/60 border border-blue-800/60 px-1.5 py-0.5 rounded">
                  F5
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 leading-none hidden sm:block">
                Gestão &amp; Simulação de Futebol
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-zinc-950/60 p-1 rounded-xl border border-zinc-800/80">
            <button
              onClick={() => handleTabChange('players')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'players'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
              }`}
            >
              <Users className="w-4 h-4" />
              Jogadores
            </button>

            <button
              onClick={() => handleTabChange('clubs')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'clubs'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
              }`}
            >
              <Shield className="w-4 h-4" />
              Clubes
            </button>

            <button
              onClick={() => handleTabChange('league')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'league'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
              }`}
            >
              <Trophy className="w-4 h-4" />
              Liga &amp; Simulação
            </button>
          </nav>

          {/* Right Status & Mobile Toggle */}
          <div className="flex items-center gap-3">
            {/* Status da Conexão */}
            <div className="flex items-center gap-2 text-xs px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800">
              <span
                className={`w-2 h-2 rounded-full ${
                  apiOnline === true
                    ? 'bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50'
                    : apiOnline === false
                    ? 'bg-rose-500'
                    : 'bg-amber-500'
                }`}
              />
              <span className="text-zinc-400 font-mono text-[11px] hidden sm:inline">
                API {apiOnline === true ? 'Online' : apiOnline === false ? 'Offline' : 'Verificando'}
              </span>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 transition"
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu (375px responsive support) */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-800 bg-zinc-900 px-4 py-3 space-y-1 animate-in slide-in-from-top duration-200">
            <button
              onClick={() => handleTabChange('players')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                activeTab === 'players'
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              Jogadores
            </button>
            <button
              onClick={() => handleTabChange('clubs')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                activeTab === 'clubs'
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4" />
              Clubes
            </button>
            <button
              onClick={() => handleTabChange('league')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition ${
                activeTab === 'league'
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <Trophy className="w-4 h-4" />
              Liga &amp; Simulação
            </button>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full">
        {/* Renderização Condicional de Módulos */}
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

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-4 text-center text-xs text-zinc-500 font-mono">
        <p>Passe - SENAI/PE · FASE 5 Frontend React + TypeScript + Tailwind CSS</p>
      </footer>
    </div>
  );
}

export default App;
