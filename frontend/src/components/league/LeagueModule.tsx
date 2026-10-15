import React, { useState } from 'react';
import { StandingsTab } from './StandingsTab';
import { MatchSimulatorTab } from './MatchSimulatorTab';
import { LineupTab } from './LineupTab';
import { Trophy, Swords, Shield } from 'lucide-react';

export const LeagueModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'standings' | 'simulator' | 'lineup'>('standings');
  const [refreshStandingsTrigger, setRefreshStandingsTrigger] = useState(0);

  const handleMatchPlayed = () => {
    setRefreshStandingsTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Navegação entre as abas da Liga */}
      <div className="flex border-b border-zinc-800 gap-2">
        <button
          onClick={() => setActiveTab('standings')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'standings'
              ? 'border-blue-500 text-blue-400 bg-zinc-900/40'
              : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/20'
          }`}
        >
          <Trophy className="w-4 h-4" />
          Classificação
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'simulator'
              ? 'border-blue-500 text-blue-400 bg-zinc-900/40'
              : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/20'
          }`}
        >
          <Swords className="w-4 h-4" />
          Simulador de Partidas
        </button>

        <button
          onClick={() => setActiveTab('lineup')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'lineup'
              ? 'border-blue-500 text-blue-400 bg-zinc-900/40'
              : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/20'
          }`}
        >
          <Shield className="w-4 h-4" />
          Escalação Tática
        </button>
      </div>

      {/* Conteúdo da Aba Ativa */}
      <div>
        {activeTab === 'standings' && (
          <StandingsTab refreshTrigger={refreshStandingsTrigger} />
        )}
        {activeTab === 'simulator' && (
          <MatchSimulatorTab onMatchPlayed={handleMatchPlayed} />
        )}
        {activeTab === 'lineup' && (
          <LineupTab />
        )}
      </div>
    </div>
  );
};
