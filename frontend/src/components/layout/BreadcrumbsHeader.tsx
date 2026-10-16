import React from 'react';
import { Menu, RotateCw, PanelLeft } from 'lucide-react';

interface BreadcrumbsHeaderProps {
  activeTab: 'home' | 'players' | 'clubs' | 'league';
  selectedClubName?: string;
  onNavigateToClubs?: () => void;
  onRefresh: () => void;
  onToggleSidebar: () => void;
  isSidebarCollapsed?: boolean;
  onToggleCollapseSidebar?: () => void;
  refreshing?: boolean;
}

export const BreadcrumbsHeader: React.FC<BreadcrumbsHeaderProps> = ({
  activeTab,
  selectedClubName,
  onNavigateToClubs,
  onRefresh,
  onToggleSidebar,
  isSidebarCollapsed = false,
  onToggleCollapseSidebar,
  refreshing = false,
}) => {
  return (
    <header className="h-14 border-b border-[#E4E4E7] bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      <div className="flex items-center gap-3">
        {/* Mobile Toggle Button */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 rounded-lg border border-[#E4E4E7] text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
          aria-label="Abrir menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Desktop Collapsible Sidebar Toggle Button */}
        <button
          onClick={onToggleCollapseSidebar}
          title={isSidebarCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          className="hidden lg:flex p-1.5 rounded-lg border border-[#E4E4E7] text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
          aria-label={isSidebarCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
        >
          <PanelLeft className={`w-4 h-4 transition-transform duration-200 ${isSidebarCollapsed ? 'rotate-180 text-[#155DFC]' : 'text-zinc-500'}`} />
        </button>

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
              <button
                type="button"
                onClick={onNavigateToClubs}
                className="text-[#686872] hover:text-[#155DFC] transition cursor-pointer"
              >
                Clubes
              </button>
              <span className="text-zinc-300">›</span>
              <span className="font-semibold text-zinc-900">{selectedClubName}</span>
            </>
          )}

          {activeTab === 'league' && (
            <>
              <span className="text-[#686872]">Liga</span>
              <span className="text-zinc-300">›</span>
              <span className="font-semibold text-zinc-900">Simulação &amp; Tabela</span>
            </>
          )}
        </nav>
      </div>

      {/* Right Action: Refresh Icon */}
      <button
        onClick={onRefresh}
        disabled={refreshing}
        title="Recarregar dados"
        className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
        aria-label="Atualizar dados da liga"
      >
        <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#155DFC]' : ''}`} />
      </button>
    </header>
  );
};
