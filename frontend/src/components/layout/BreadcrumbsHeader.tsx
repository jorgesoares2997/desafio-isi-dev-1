import React from 'react';
import { Menu, RotateCw, PanelLeft } from 'lucide-react';

interface BreadcrumbsHeaderProps {
  activeTab: 'home' | 'players' | 'clubs' | 'league';
  selectedClubName?: string;
  onRefresh: () => void;
  onToggleSidebar: () => void;
  refreshing?: boolean;
}

export const BreadcrumbsHeader: React.FC<BreadcrumbsHeaderProps> = ({
  activeTab,
  selectedClubName,
  onRefresh,
  onToggleSidebar,
  refreshing = false,
}) => {
  return (
    <header className="h-14 border-b border-[#E4E4E7] bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      <div className="flex items-center gap-3">
        {/* Mobile Toggle Button */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 rounded-lg border border-[#E4E4E7] text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition"
          aria-label="Abrir menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Panel Left Icon */}
        <div className="hidden sm:flex text-zinc-400">
          <PanelLeft className="w-4 h-4" />
        </div>

        {/* Breadcrumb Path */}
        <nav className="flex items-center gap-1.5 text-xs text-[#686872]">
          {activeTab === 'players' && (
            <>
              <span className="text-[#686872]">Mercado</span>
              <span className="text-zinc-300">›</span>
              <span className="font-semibold text-zinc-900">Jogadores</span>
            </>
          )}

          {activeTab === 'clubs' && !selectedClubName && (
            <>
              <span className="text-[#686872]">Mercado</span>
              <span className="text-zinc-300">›</span>
              <span className="font-semibold text-zinc-900">Clubes</span>
            </>
          )}

          {activeTab === 'clubs' && selectedClubName && (
            <>
              <span className="text-[#686872]">Mercado</span>
              <span className="text-zinc-300">›</span>
              <span className="text-[#686872]">Clubes</span>
              <span className="text-zinc-300">›</span>
              <span className="font-semibold text-zinc-900">{selectedClubName}</span>
            </>
          )}

          {activeTab === 'league' && (
            <>
              <span className="text-[#686872]">Liga</span>
              <span className="text-zinc-300">›</span>
              <span className="font-semibold text-zinc-900">Partidas &amp; Classificação</span>
            </>
          )}
        </nav>
      </div>

      {/* Right Actions: Refresh */}
      <button
        onClick={onRefresh}
        title="Atualizar dados"
        disabled={refreshing}
        className="p-2 rounded-lg border border-[#E4E4E7] bg-white hover:bg-zinc-50 active:scale-95 text-zinc-600 hover:text-zinc-900 transition shadow-2xs cursor-pointer"
        aria-label="Atualizar dados"
      >
        <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#155DFC]' : ''}`} />
      </button>
    </header>
  );
};
