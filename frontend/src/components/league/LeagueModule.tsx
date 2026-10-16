import React, { useState, useEffect } from 'react';
import { api, getApiErrorMessage } from '../../services/api';
import { Club, MatchDetail } from '../../types';
import { useToast } from '../../context/ToastContext';
import { MatchesListView } from './MatchesListView';
import { MatchDetailView } from './MatchDetailView';
import { StandingsTab } from './StandingsTab';
import { NewMatchModal } from './NewMatchModal';

interface LeagueModuleProps {
  clubs: Club[];
  activeSubtab: 'matches' | 'standings';
  selectedMatchId: number | null;
  onNavigateToMatches: () => void;
  onNavigateToStandings?: () => void;
  onSelectMatch: (matchId: number) => void;
  onMatchDetailLoaded?: (match: MatchDetail | null) => void;
  onMatchPlayedNotification?: () => void;
}

export const LeagueModule: React.FC<LeagueModuleProps> = ({
  clubs,
  activeSubtab,
  selectedMatchId,
  onNavigateToMatches,
  onSelectMatch,
  onMatchDetailLoaded,
  onMatchPlayedNotification,
}) => {
  const { showToast } = useToast();
  const [selectedMatch, setSelectedMatch] = useState<MatchDetail | null>(null);
  const [loadingMatch, setLoadingMatch] = useState(false);
  const [isNewMatchOpen, setIsNewMatchOpen] = useState(false);
  const [isJustPlayed, setIsJustPlayed] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch match details when selectedMatchId changes
  useEffect(() => {
    if (!selectedMatchId) {
      setSelectedMatch(null);
      if (onMatchDetailLoaded) onMatchDetailLoaded(null);
      return;
    }

    // If we already have the match loaded (e.g., from direct creation), avoid refetching
    if (selectedMatch && selectedMatch.id === selectedMatchId) {
      if (onMatchDetailLoaded) onMatchDetailLoaded(selectedMatch);
      return;
    }

    let isMounted = true;
    setLoadingMatch(true);

    api
      .get<MatchDetail>(`/matches/${selectedMatchId}`)
      .then((res) => {
        if (isMounted) {
          setSelectedMatch(res.data);
          if (onMatchDetailLoaded) onMatchDetailLoaded(res.data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          showToast('error', getApiErrorMessage(err));
          onNavigateToMatches();
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoadingMatch(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedMatchId, onMatchDetailLoaded, onNavigateToMatches, showToast]);

  const handleMatchCreated = (newMatch: MatchDetail) => {
    setSelectedMatch(newMatch);
    setIsJustPlayed(true);
    setRefreshTrigger((prev) => prev + 1);
    onSelectMatch(newMatch.id);
    if (onMatchPlayedNotification) {
      onMatchPlayedNotification();
    }
  };

  const handleBackToMatches = () => {
    setIsJustPlayed(false);
    setSelectedMatch(null);
    onNavigateToMatches();
  };

  // If viewing match detail
  if (selectedMatchId && selectedMatch) {
    return (
      <>
        <MatchDetailView
          match={selectedMatch}
          clubs={clubs}
          onBack={handleBackToMatches}
          isJustPlayed={isJustPlayed}
        />
        <NewMatchModal
          isOpen={isNewMatchOpen}
          onClose={() => setIsNewMatchOpen(false)}
          clubs={clubs}
          onSuccess={handleMatchCreated}
        />
      </>
    );
  }

  if (selectedMatchId && loadingMatch) {
    return (
      <div className="bg-white border border-[#E4E4E7] rounded-2xl p-12 text-center text-xs text-[#686872] shadow-xs">
        Carregando detalhes do confronto...
      </div>
    );
  }

  return (
    <>
      {activeSubtab === 'standings' ? (
        <StandingsTab
          clubs={clubs}
          onOpenNewMatch={() => setIsNewMatchOpen(true)}
          onNavigateToMatches={onNavigateToMatches}
          refreshTrigger={refreshTrigger}
        />
      ) : (
        <MatchesListView
          clubs={clubs}
          onOpenNewMatch={() => setIsNewMatchOpen(true)}
          onSelectMatch={(id) => {
            setIsJustPlayed(false);
            onSelectMatch(id);
          }}
          refreshTrigger={refreshTrigger}
        />
      )}

      {/* Modal Nova Partida acessível de ambas as abas */}
      <NewMatchModal
        isOpen={isNewMatchOpen}
        onClose={() => setIsNewMatchOpen(false)}
        clubs={clubs}
        onSuccess={handleMatchCreated}
      />
    </>
  );
};
