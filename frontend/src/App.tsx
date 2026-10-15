import { useState, useEffect, useCallback } from 'react';
import { api, getApiErrorMessage } from './services/api';
import { Club, MatchSummary, PagedResponse, Player } from './types';
import { ToastProvider, useToast } from './context/ToastContext';
import { HomeScreen } from './components/home/HomeScreen';
import { PlayerList } from './components/players/PlayerList';
import { ClubList } from './components/clubs/ClubList';
import { ClubDetailView } from './components/clubs/ClubDetailView';
import { LeagueModule } from './components/league/LeagueModule';
import { Sidebar } from './components/layout/Sidebar';
import { BreadcrumbsHeader } from './components/layout/BreadcrumbsHeader';
import { ClubCreateModal } from './components/clubs/ClubCreateModal';

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
  const [totalPlayers, setTotalPlayers] = useState(23);
  const [totalMatches, setTotalMatches] = useState(2);
  const [latestMatch, setLatestMatch] = useState<{
    home: string;
    away: string;
    homeGoals: number;
    awayGoals: number;
  } | null>({
    home: 'Delta FC',
    away: 'Águias FC',
    homeGoals: 2,
    awayGoals: 1,
  });

  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [isClubCreateOpen, setIsClubCreateOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch clubs
  const fetchClubs = useCallback(async () => {
    setLoadingClubs(true);
    try {
      const res = await api.get<Club[]>('/clubs');
      setClubs(res.data);
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    } finally {
      setLoadingClubs(false);
    }
  }, [showToast]);

  // Fetch league summary metrics (total players and matches)
  const fetchMetrics = useCallback(async () => {
    try {
      const [playersRes, matchesRes] = await Promise.all([
        api.get<PagedResponse<Player>>('/players', { params: { limit: 1 } }),
        api.get<MatchSummary[]>('/matches'),
      ]);

      if (playersRes.data?.meta?.total_items !== undefined) {
        setTotalPlayers(playersRes.data.meta.total_items);
      }

      if (Array.isArray(matchesRes.data)) {
        setTotalMatches(matchesRes.data.length);
        if (matchesRes.data.length > 0) {
          const last = matchesRes.data[matchesRes.data.length - 1];
          setLatestMatch({
            home: last.home.club_name,
            away: last.away.club_name,
            homeGoals: last.home.goals,
            awayGoals: last.away.goals,
          });
        }
      }
    } catch {
      // Use defaults if unavailable
    }
  }, []);

  const handleGlobalRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchClubs(), fetchMetrics()]);
    setRefreshing(false);
    showToast('success', 'Dados atualizados com sucesso.');
  }, [fetchClubs, fetchMetrics, showToast]);

  useEffect(() => {
    fetchClubs();
    fetchMetrics();
  }, [fetchClubs, fetchMetrics]);

  const handleSelectClub = (clubId: number) => {
    setSelectedClubId(clubId);
    setActiveTab('clubs');
    setSidebarMobileOpen(false);
  };

  const handleTabChange = (tab: 'home' | 'players' | 'clubs' | 'league') => {
    setActiveTab(tab);
    setSidebarMobileOpen(false);
    if (tab !== 'clubs') {
      setSelectedClubId(null);
    }
  };

  const selectedClub = clubs.find((c) => c.id === selectedClubId);

  // Onboarding screen: 100% full-canvas, no sidebar, no topbar
  if (activeTab === 'home') {
    return (
      <div className="min-h-screen bg-white text-zinc-900 flex flex-col font-sans selection:bg-[#155DFC] selection:text-white">
        <main className="w-full flex-1 flex flex-col justify-center">
          <HomeScreen
            onStart={() => handleTabChange('players')}
            onNavigate={(tab, clubId) => {
              handleTabChange(tab);
              if (clubId) setSelectedClubId(clubId);
            }}
          />
        </main>
      </div>
    );
  }

  // App layout with persistent Sidebar on the left and BreadcrumbsHeader on top
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 flex font-sans selection:bg-[#155DFC] selection:text-white">
      {/* Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        selectedClubId={selectedClubId}
        clubs={clubs}
        totalPlayers={totalPlayers}
        totalMatches={totalMatches}
        latestMatch={latestMatch}
        onTabChange={handleTabChange}
        onSelectClub={handleSelectClub}
        onCreateClub={() => setIsClubCreateOpen(true)}
        isOpen={sidebarMobileOpen}
        onClose={() => setSidebarMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <BreadcrumbsHeader
          activeTab={activeTab}
          selectedClubName={selectedClub?.name}
          onRefresh={handleGlobalRefresh}
          onToggleSidebar={() => setSidebarMobileOpen(true)}
          refreshing={refreshing}
        />

        <main className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-[1366px] w-full mx-auto">
          {activeTab === 'players' && (
            <PlayerList
              clubs={clubs}
              onClubClick={handleSelectClub}
              onRefreshClubs={fetchClubs}
            />
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
      </div>

      {/* Quick Club Creation Modal accessible from Sidebar (+) */}
      <ClubCreateModal
        isOpen={isClubCreateOpen}
        onClose={() => setIsClubCreateOpen(false)}
        onSuccess={() => {
          fetchClubs();
          fetchMetrics();
        }}
      />
    </div>
  );
}

export default App;
