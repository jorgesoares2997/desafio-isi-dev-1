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

function parseRoute(): {
  tab: 'home' | 'players' | 'clubs' | 'league';
  clubId: number | null;
  subtab?: 'squad' | 'lineup' | 'history';
  leagueSubtab?: 'matches' | 'standings';
  matchId?: number | null;
} {
  const path = window.location.pathname.replace(/\/+$/, '');
  if (!path || path === '' || path === '/home') {
    return { tab: 'home', clubId: null };
  }
  if (path === '/jogadores' || path === '/players') {
    return { tab: 'players', clubId: null };
  }
  if (path.startsWith('/clubes') || path.startsWith('/clubs')) {
    const parts = path.split('/').filter(Boolean);
    if (parts.length >= 2) {
      const id = parseInt(parts[1], 10);
      if (!isNaN(id)) {
        let subtab: 'squad' | 'lineup' | 'history' = 'squad';
        if (parts[2] === 'escalacao' || parts[2] === 'lineup') {
          subtab = 'lineup';
        } else if (parts[2] === 'historico' || parts[2] === 'transacoes') {
          subtab = 'history';
        }
        return { tab: 'clubs', clubId: id, subtab };
      }
    }
    return { tab: 'clubs', clubId: null };
  }
  if (path.startsWith('/partidas')) {
    const parts = path.split('/').filter(Boolean);
    if (parts.length >= 2) {
      const id = parseInt(parts[1], 10);
      if (!isNaN(id)) {
        return { tab: 'league', clubId: null, leagueSubtab: 'matches', matchId: id };
      }
    }
    return { tab: 'league', clubId: null, leagueSubtab: 'matches', matchId: null };
  }
  if (path === '/classificacao') {
    return { tab: 'league', clubId: null, leagueSubtab: 'standings', matchId: null };
  }
  if (path === '/liga') {
    return { tab: 'league', clubId: null, leagueSubtab: 'matches', matchId: null };
  }
  return { tab: 'home', clubId: null };
}

function getUrlForRoute(
  tab: 'home' | 'players' | 'clubs' | 'league',
  clubId: number | null,
  subtab?: 'squad' | 'lineup' | 'history',
  leagueSubtab?: 'matches' | 'standings',
  matchId?: number | null
): string {
  if (tab === 'home') return '/';
  if (tab === 'players') return '/jogadores';
  if (tab === 'clubs') {
    if (clubId) {
      if (subtab === 'lineup') return `/clubes/${clubId}/escalacao`;
      if (subtab === 'history') return `/clubes/${clubId}/historico`;
      return `/clubes/${clubId}`;
    }
    return '/clubes';
  }
  if (tab === 'league') {
    if (matchId) return `/partidas/${matchId}`;
    if (leagueSubtab === 'standings') return '/classificacao';
    return '/partidas';
  }
  return '/';
}

function MainApp() {
  const { showToast } = useToast();
  const initial = parseRoute();
  const [activeTab, setActiveTab] = useState<'home' | 'players' | 'clubs' | 'league'>(initial.tab);
  const [selectedClubId, setSelectedClubId] = useState<number | null>(initial.clubId);
  const [clubSubtab, setClubSubtab] = useState<'squad' | 'lineup' | 'history' | undefined>(initial.subtab);
  const [leagueSubtab, setLeagueSubtab] = useState<'matches' | 'standings'>(initial.leagueSubtab || 'matches');
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(initial.matchId || null);
  const [viewingMatchTitle, setViewingMatchTitle] = useState<string | undefined>(undefined);

  const [clubs, setClubs] = useState<Club[]>([]);
  const [loadingClubs, setLoadingClubs] = useState(false);
  const [clubsError, setClubsError] = useState<string | null>(null);
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isClubCreateOpen, setIsClubCreateOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const navigateTo = useCallback(
    (
      tab: 'home' | 'players' | 'clubs' | 'league',
      clubId: number | null = null,
      subtab?: 'squad' | 'lineup' | 'history',
      lSubtab?: 'matches' | 'standings',
      mId?: number | null
    ) => {
      setActiveTab(tab);
      setSelectedClubId(clubId);
      setClubSubtab(subtab);
      setLeagueSubtab(lSubtab || 'matches');
      setSelectedMatchId(mId || null);
      if (!mId) setViewingMatchTitle(undefined);
      setSidebarMobileOpen(false);
      const url = getUrlForRoute(tab, clubId, subtab, lSubtab, mId);
      if (window.location.pathname !== url) {
        window.history.pushState(null, '', url);
      }
    },
    []
  );

  useEffect(() => {
    const handlePopState = () => {
      const route = parseRoute();
      setActiveTab(route.tab);
      setSelectedClubId(route.clubId);
      setClubSubtab(route.subtab);
      setLeagueSubtab(route.leagueSubtab || 'matches');
      setSelectedMatchId(route.matchId || null);
      if (!route.matchId) setViewingMatchTitle(undefined);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Fetch clubs
  const fetchClubs = useCallback(async () => {
    setLoadingClubs(true);
    setClubsError(null);
    try {
      const res = await api.get<Club[]>('/clubs');
      setClubs(res.data);
      setClubsError(null);
    } catch (err) {
      const msg = getApiErrorMessage(err);
      setClubsError(msg);
      showToast('error', msg);
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
          const last = matchesRes.data[0];
          setLatestMatch({
            home: last.home.club_name,
            away: last.away.club_name,
            homeGoals: last.home.goals,
            awayGoals: last.away.goals,
          });
        } else {
          setLatestMatch(null);
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
    navigateTo('clubs', clubId, 'squad');
  };

  const handleTabChange = (
    tab: 'home' | 'players' | 'clubs' | 'league',
    lSubtab?: 'matches' | 'standings'
  ) => {
    if (tab === 'league') {
      navigateTo('league', null, undefined, lSubtab || 'matches', null);
    } else {
      navigateTo(tab, null);
    }
  };

  const selectedClub = clubs.find((c) => c.id === selectedClubId);

  // Onboarding screen: 100% full-canvas, no sidebar, no topbar
  if (activeTab === 'home') {
    return (
      <div className="min-h-screen bg-white text-zinc-900 flex flex-col font-sans selection:bg-[#155DFC] selection:text-white">
        <main className="w-full flex-1 flex flex-col justify-center">
          <HomeScreen
            onStart={() => navigateTo('players', null)}
            onNavigate={(tab, clubId) => {
              if (tab === 'clubs' && clubId) {
                navigateTo('clubs', clubId, 'squad');
              } else {
                navigateTo(tab, null);
              }
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
        leagueSubtab={leagueSubtab}
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
        isCollapsed={isSidebarCollapsed}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <BreadcrumbsHeader
          activeTab={activeTab}
          selectedClubName={selectedClub ? selectedClub.name : (selectedClubId ? `Clube ${selectedClubId}` : undefined)}
          leagueSubtab={leagueSubtab}
          viewingMatchTitle={viewingMatchTitle}
          onNavigateToClubs={() => navigateTo('clubs', null)}
          onNavigateToMatches={() => navigateTo('league', null, undefined, 'matches', null)}
          onRefresh={handleGlobalRefresh}
          onToggleSidebar={() => setSidebarMobileOpen(true)}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleCollapseSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
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
                initialTab={clubSubtab || 'squad'}
                onTabChange={(tab) => navigateTo('clubs', selectedClubId, tab)}
                onBack={() => {
                  navigateTo('clubs', null);
                  fetchClubs();
                }}
              />
            ) : (
              <ClubList
                clubs={clubs}
                loading={loadingClubs}
                error={clubsError}
                onRefresh={fetchClubs}
                onSelectClub={handleSelectClub}
              />
            )
          )}

          {activeTab === 'league' && (
            <LeagueModule
              clubs={clubs}
              activeSubtab={leagueSubtab}
              selectedMatchId={selectedMatchId}
              onNavigateToMatches={() => navigateTo('league', null, undefined, 'matches', null)}
              onNavigateToStandings={() => navigateTo('league', null, undefined, 'standings', null)}
              onSelectMatch={(mId) => navigateTo('league', null, undefined, 'matches', mId)}
              onMatchDetailLoaded={(match) => {
                if (match) {
                  setViewingMatchTitle(`${match.home.club_name} ${match.home.goals} × ${match.away.goals} ${match.away.club_name}`);
                } else {
                  setViewingMatchTitle(undefined);
                }
              }}
              onMatchPlayedNotification={() => {
                fetchMetrics();
              }}
            />
          )}
        </main>
      </div>

      {/* Quick Club Creation Modal accessible from Sidebar (+) */}
      <ClubCreateModal
        isOpen={isClubCreateOpen}
        onClose={() => setIsClubCreateOpen(false)}
        onSuccess={(newClub) => {
          fetchClubs();
          fetchMetrics();
          navigateTo('clubs', newClub.id, 'squad');
        }}
      />
    </div>
  );
}

export default App;
