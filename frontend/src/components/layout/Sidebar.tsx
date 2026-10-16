import React from 'react';
import { 
  Users, 
  Shield, 
  Swords, 
  Trophy, 
  Plus, 
  Clock, 
  X,
  ListOrdered 
} from 'lucide-react';
import { Club } from '../../types';

interface SidebarProps {
  activeTab: 'home' | 'players' | 'clubs' | 'league';
  selectedClubId: number | null;
  clubs: Club[];
  totalPlayers: number;
  totalMatches: number;
  latestMatch: { home: string; away: string; homeGoals: number; awayGoals: number } | null;
  onTabChange: (tab: 'home' | 'players' | 'clubs' | 'league') => void;
  onSelectClub: (clubId: number) => void;
  onCreateClub: () => void;
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  selectedClubId,
  clubs,
  totalPlayers,
  totalMatches,
  latestMatch,
  onTabChange,
  onSelectClub,
  onCreateClub,
  isOpen,
  onClose,
  isCollapsed = false,
}) => {
  const sidebarContent = (
    <aside className="w-64 h-full bg-[#FAFAFA] border-r border-[#E4E4E7] flex flex-col justify-between select-none">
      {/* Top Part: Brand + Nav Sections */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        
        {/* Brand / Logo */}
        <div 
          onClick={() => { onTabChange('home'); onClose(); }}
          className="flex items-center gap-3 cursor-pointer group px-2"
        >
          <img 
            src="/logo.png" 
            alt="Passe Logo" 
            className="w-9 h-9 rounded-xl object-contain shadow-2xs group-hover:scale-105 transition-transform" 
          />
          <div>
            <span className="font-bold tracking-tight text-base text-zinc-900 group-hover:text-[#155DFC] transition-colors">
              Passe
            </span>
            <p className="text-[11px] text-[#686872] leading-none">
              Gestão da liga
            </p>
          </div>
        </div>

        {/* Section 1: Mercado */}
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-[#686872] uppercase tracking-wider px-2 mb-1.5">
            Mercado
          </p>
          
          <button
            onClick={() => { onTabChange('players'); onClose(); }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'players'
                ? 'bg-white text-zinc-900 border border-[#E4E4E7] shadow-xs'
                : 'text-[#686872] hover:text-zinc-900 hover:bg-zinc-200/50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Users className={`w-4 h-4 ${activeTab === 'players' ? 'text-[#155DFC]' : 'text-[#686872]'}`} />
              <span>Jogadores</span>
            </div>
            <span className="font-mono text-[11px] text-[#686872]">
              {totalPlayers}
            </span>
          </button>

          <button
            onClick={() => { onTabChange('clubs'); onClose(); }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'clubs' && selectedClubId === null
                ? 'bg-white text-zinc-900 border border-[#E4E4E7] shadow-xs'
                : 'text-[#686872] hover:text-zinc-900 hover:bg-zinc-200/50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Shield className={`w-4 h-4 ${activeTab === 'clubs' && selectedClubId === null ? 'text-[#155DFC]' : 'text-[#686872]'}`} />
              <span>Clubes</span>
            </div>
            <span className="font-mono text-[11px] text-[#686872]">
              {clubs.length}
            </span>
          </button>
        </div>

        {/* Section 2: Liga */}
        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-[#686872] uppercase tracking-wider px-2 mb-1.5">
            Liga
          </p>

          <button
            onClick={() => { onTabChange('league'); onClose(); }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'league'
                ? 'bg-white text-zinc-900 border border-[#E4E4E7] shadow-xs'
                : 'text-[#686872] hover:text-zinc-900 hover:bg-zinc-200/50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Swords className={`w-4 h-4 ${activeTab === 'league' ? 'text-[#155DFC]' : 'text-[#686872]'}`} />
              <span>Partidas</span>
            </div>
            <span className="font-mono text-[11px] text-[#686872]">
              {totalMatches}
            </span>
          </button>

          <button
            onClick={() => { onTabChange('league'); onClose(); }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#686872] hover:text-zinc-900 hover:bg-zinc-200/50 transition"
          >
            <div className="flex items-center gap-2.5">
              <ListOrdered className="w-4 h-4 text-[#686872]" />
              <span>Classificação</span>
            </div>
          </button>
        </div>

        {/* Section 3: Clubes Dinâmicos */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 mb-1.5">
            <span className="text-[11px] font-semibold text-[#686872] uppercase tracking-wider">
              Clubes
            </span>
            <button
              onClick={onCreateClub}
              title="Cadastrar Novo Clube"
              className="w-5 h-5 flex items-center justify-center rounded-md text-[#686872] hover:text-[#155DFC] hover:bg-white transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-0.5">
            {clubs.map((club) => {
              const isSelected = activeTab === 'clubs' && selectedClubId === club.id;
              const initialLetter = club.name ? club.name.charAt(0).toUpperCase() : 'C';

              return (
                <button
                  key={club.id}
                  onClick={() => { onSelectClub(club.id); onClose(); }}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                    isSelected
                      ? 'bg-white text-zinc-900 border border-[#E4E4E7] shadow-2xs font-semibold'
                      : 'text-[#686872] hover:text-zinc-900 hover:bg-zinc-200/40'
                  }`}
                >
                  <span className="w-5 h-5 rounded-md bg-white border border-[#E4E4E7] flex items-center justify-center font-bold text-[10px] text-zinc-700 shrink-0">
                    {initialLetter}
                  </span>
                  <span className="truncate text-left">{club.name}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Bottom Part: Widget da Liga e Fuso de Brasília */}
      <div className="p-4 border-t border-[#E4E4E7] space-y-3">
        {/* Widget Card */}
        <div className="bg-white border border-[#E4E4E7] rounded-xl p-3 shadow-2xs space-y-2.5">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600 shrink-0 mt-0.5">
              <Trophy className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <p className="font-semibold text-xs text-zinc-900 leading-tight">
                Liga Fictícia 2026
              </p>
              <p className="text-[11px] text-[#686872] mt-0.5">
                {clubs.length} clubes · {totalPlayers} jogadores
              </p>
            </div>
          </div>

          <div className="border-t border-[#E4E4E7]/70 pt-2 flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600 shrink-0 mt-0.5">
              <Swords className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="font-semibold text-xs text-zinc-900 leading-tight">
                Última partida
              </p>
              <p className="text-[11px] text-[#686872] mt-0.5 truncate max-w-[150px]">
                {latestMatch 
                  ? `${latestMatch.home} ${latestMatch.homeGoals} × ${latestMatch.awayGoals} ${latestMatch.away}`
                  : 'Nenhuma partida ainda'}
              </p>
            </div>
          </div>
        </div>

        {/* Fuso Horário de Brasília */}
        <div className="flex items-center gap-1.5 text-[11px] text-[#686872] px-1">
          <Clock className="w-3.5 h-3.5" />
          <span>Horário de Brasília (UTC-3)</span>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar with smooth collapse transition */}
      <div 
        className={`hidden lg:block shrink-0 h-screen sticky top-0 transition-all duration-300 ease-in-out overflow-hidden ${
          isCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-64 opacity-100'
        }`}
      >
        {sidebarContent}
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div 
            onClick={onClose}
            className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs transition-opacity" 
          />
          <div className="relative z-10 h-full flex flex-col">
            <div className="absolute top-3 right-3 z-20">
              <button 
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white border border-[#E4E4E7] text-zinc-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
