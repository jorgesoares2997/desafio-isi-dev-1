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
      <div className="flex border-b border-[#E4E4E7] gap-2">
        <button
          onClick={() => setActiveTab('standings')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'standings'
              ? 'border-[#155DFC] text-[#155DFC] bg-white'
              : 'border-transparent text-[#686872] hover:text-zinc-900 hover:bg-zinc-100/60'
          }`}
        >
          <Trophy className="w-4 h-4" />
          Classificação
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'simulator'
              ? 'border-[#155DFC] text-[#155DFC] bg-white'
              : 'border-transparent text-[#686872] hover:text-zinc-900 hover:bg-zinc-100/60'
          }`}
        >
          <Swords className="w-4 h-4" />
          Simulador de Partidas
        </button>

        <button
          onClick={() => setActiveTab('lineup')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'lineup'
              ? 'border-[#155DFC] text-[#155DFC] bg-white'
              : 'border-transparent text-[#686872] hover:text-zinc-900 hover:bg-zinc-100/60'
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
