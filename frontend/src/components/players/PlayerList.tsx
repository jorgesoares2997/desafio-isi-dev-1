import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api, getApiErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Player, Club, PagedResponse } from '../../types';
import { PlayerFilters, PlayerFilterValues } from './PlayerFilters';
import { PlayerCreateModal } from './PlayerCreateModal';
import { PlayerEditModal } from './PlayerEditModal';
import { PlayerConditionModal } from './PlayerConditionModal';
import { PlayerDeleteModal } from './PlayerDeleteModal';
import { QuickBuyModal } from './QuickBuyModal';
import { PlayerSuccessModal } from './PlayerSuccessModal';
import { PlayerDetailDrawer } from './PlayerDetailDrawer';
import { PlayerTableSkeleton } from '../common/Skeleton';
import { EmptyState, DisconnectedLayersIcon } from '../common/EmptyState';
import { 
  Users, 
  Plus, 
  MoreHorizontal, 
  ShoppingCart, 
  Edit3, 
  Heart, 
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  RotateCw,
  X as XIcon,
  SearchX
} from 'lucide-react';

const INITIAL_FILTERS: PlayerFilterValues = {
  search: '',
  position: '',
  condition: '',
  free: false,
  club_id: '',
  min_age: '',
  max_age: '',
  min_value: '',
  max_value: '',
  sort: 'name',
};

interface PlayerListProps {
  clubs: Club[];
  onClubClick?: (clubId: number) => void;
  onRefreshClubs?: () => void;
}

const AVATAR_PALETTES = [
  { bg: 'bg-[#F4F4F5]', text: 'text-[#71717A]' },
  { bg: 'bg-[#FCE7F3]', text: 'text-[#DB2777]' },
  { bg: 'bg-[#E0F2FE]', text: 'text-[#0284C7]' },
  { bg: 'bg-[#D1FAE5]', text: 'text-[#059669]' },
  { bg: 'bg-[#F3E8FF]', text: 'text-[#9333EA]' },
  { bg: 'bg-[#FEF3C7]', text: 'text-[#D97706]' },
  { bg: 'bg-[#CCFBF1]', text: 'text-[#0D9488]' },
];

export const PlayerList: React.FC<PlayerListProps> = ({ 
  clubs, 
  onClubClick,
  onRefreshClubs 
}) => {
  const { showToast } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PlayerFilterValues>(INITIAL_FILTERS);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Total counts for tabs
  const [freeCount, setFreeCount] = useState<number | undefined>(undefined);
  const [inClubCount, setInClubCount] = useState<number | undefined>(undefined);

  // Recent action indicator for contextual footnotes (Screenshots 1, 4, 5)
  const [recentAction, setRecentAction] = useState<'condition_changed' | 'player_deleted' | null>(null);
  const [lastDeletedPlayer, setLastDeletedPlayer] = useState<Player | null>(null);
  const [isModalStarterDoente, setIsModalStarterDoente] = useState(false);
  const [recentBuyError, setRecentBuyError] = useState<string | null>(null);

  // Modals and Drawer state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [conditionPlayer, setConditionPlayer] = useState<Player | null>(null);
  const [deletingPlayer, setDeletingPlayer] = useState<Player | null>(null);
  const [buyingPlayer, setBuyingPlayer] = useState<Player | null>(null);
  const [detailPlayer, setDetailPlayer] = useState<Player | null>(null);
  const [successPlayer, setSuccessPlayer] = useState<Player | null>(null);

  // Popover menu state
  const [menuPlayerId, setMenuPlayerId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close action dropdown menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuPlayerId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch count metadata for tabs
  const fetchCounts = useCallback(async () => {
    try {
      const freeResp = await api.get<PagedResponse<Player>>('/players', {
        params: { free: 'true', limit: 1 },
      });
      const allResp = await api.get<PagedResponse<Player>>('/players', {
        params: { limit: 1 },
      });
      const freeTotal = freeResp.data.meta.total_items;
      const allTotal = allResp.data.meta.total_items;
      setFreeCount(freeTotal);
      setInClubCount(Math.max(0, allTotal - freeTotal));
    } catch {
      // Ignore count fetch errors silently
    }
  }, []);

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const params: Record<string, string | number | boolean> = {
        page: currentPage,
        limit: 10,
        sort: filters.sort || 'name',
      };

      if (filters.search.trim()) params.search = filters.search.trim();
      if (filters.position) params.position = filters.position;
      if (filters.condition) params.condition = filters.condition;
      if (filters.free) params.free = 'true';
      if (filters.club_id) params.club_id = filters.club_id;
      if (filters.min_age) params.min_age = filters.min_age;
      if (filters.max_age) params.max_age = filters.max_age;
      if (filters.min_value) params.min_value = filters.min_value;
      if (filters.max_value) params.max_value = filters.max_value;

      const resp = await api.get<PagedResponse<Player>>('/players', { params });
      setPlayers(resp.data.data);
      setCurrentPage(resp.data.meta.page);
      setTotalPages(resp.data.meta.total_pages);
      setTotalItems(resp.data.meta.total_items);
    } catch (err) {
      const msg = getApiErrorMessage(err);
      setLoadError(msg);
      showToast('error', msg);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, showToast]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  const handleFilterChange = (newFilters: PlayerFilterValues) => {
    setFilters(newFilters);
    setCurrentPage(1);
    setRecentAction(null);
    setRecentBuyError(null);
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setCurrentPage(1);
    setRecentAction(null);
    setRecentBuyError(null);
  };

  const getClubName = (clubId: number | null) => {
    if (!clubId) return null;
    return clubs.find((c) => c.id === clubId);
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % AVATAR_PALETTES.length;
    return AVATAR_PALETTES[index];
  };

  const getPositionLabel = (pos: string) => {
    switch (pos) {
      case 'GOL': return 'Goleiro';
      case 'ZAG': return 'Zagueiro';
      case 'LAT': return 'Lateral';
      case 'MEI': return 'Meio-campo';
      case 'ATA': return 'Atacante';
      default: return pos;
    }
  };

  // Footnote text logic strictly matching all Figma states
  const getFootnoteText = () => {
    if (recentBuyError?.includes('12 jogadores') || recentBuyError?.includes('Delta FC')) {
      return 'Cenário próprio, fora da base: o Delta FC já tem 12 jogadores. A tela não impede a compra por elenco cheio: envia o pedido, a API recusa com 409 (RN14), nada é gravado, e a tela mostra a message.';
    }
    if (recentBuyError?.includes('já vendeu') || recentBuyError?.includes('Lucas Ferraz')) {
      return 'Depois da venda do Lucas Ferraz (V03), o Águias FC tenta comprá-lo de novo: a API recusa com 409 (RN12), nada é gravado, e a tela mostra o message. Outro clube pode comprá-lo.';
    }
    if (filters.club_id) {
      return 'Depois da compra, a tabela mostra o clube do jogador e o filtro por clube o encontra. Com um clube filtrado, a aba "Livres" fica indisponível, porque essa combinação não é aceita (a API recusa com 400).';
    }
    if (Boolean(conditionPlayer) && isModalStarterDoente && conditionPlayer?.club_id) {
      const starterClub = clubs.find((c) => c.id === conditionPlayer.club_id);
      return `${conditionPlayer.name} é titular do ${starterClub?.name || 'clube'}, segundo GET /clubs/{id}/lineup. Ao escolher Doente, a tela avisa que ele sai da escalação na mesma operação da alteração (RN19), como a V01 faz na venda.`;
    }
    if (recentAction === 'condition_changed') {
      return 'A tela mostra o novo valor de mercado depois da alteração.';
    }
    if (recentAction === 'player_deleted' && lastDeletedPlayer) {
      return `Depois da exclusão do ${lastDeletedPlayer.name} (J${lastDeletedPlayer.id}), a lista volta da API sem ele: ${totalItems} jogadores e ${freeCount ?? 0} livres. Ele continua no banco, nas transações e nas partidas antigas (RN09).`;
    }
    if (filters.sort && filters.sort !== 'name') {
      return 'As 6 ordenações que a API aceita no sort: nome; valor de mercado e idade, nos dois sentidos; e posição, na ordem GOL, ZAG, LAT, MEI e ATA. Empates são desfeitos pelo nome e pelo id (RN07).';
    }
    if (filters.free) {
      return 'Com a aba "Livres" ativa, o filtro por clube fica desabilitado, porque essa combinação não é aceita.';
    }
    if (filters.search.trim()) {
      if (filters.search.toLowerCase() === 'joao') {
        return '"joao" encontra "João Silva": a busca procura o texto dentro do nome, sem diferenciar maiúsculas, minúsculas e acentos.';
      }
      return `"${filters.search}" encontra correspondências no nome, sem diferenciar maiúsculas, minúsculas e acentos.`;
    }
    if (
      filters.condition ||
      filters.position ||
      filters.min_age ||
      filters.max_age ||
      filters.min_value ||
      filters.max_value
    ) {
      return 'Os filtros se combinam: a lista mostra só quem atende a todos. A faixa de valor usa o valor de mercado, nunca o valor base.';
    }
    return 'Overall e valor de mercado são calculados a cada consulta. A busca ignora maiúsculas, minúsculas e acentos.';
  };

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * 10 + 1;
  const endItem = Math.min(currentPage * 10, totalItems);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] border border-blue-200 text-[#155DFC] flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Jogadores
            </h1>
            <p className="text-xs sm:text-sm text-[#686872] mt-0.5">
              Cadastre jogadores, acompanhe os indicadores e compre os que estão livres.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 bg-[#155DFC] hover:bg-[#1447E6] active:scale-95 text-white px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold shadow-2xs transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Novo jogador
        </button>
      </div>

      {/* Filters Component */}
      <PlayerFilters
        clubs={clubs}
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
        totalCount={totalItems}
        freeCount={freeCount}
        inClubCount={filters.club_id ? totalItems : inClubCount}
      />

      {/* Players Data Table Card */}
      <div className="bg-white border border-[#E4E4E7] rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <PlayerTableSkeleton />
        ) : loadError ? (
          <EmptyState
            icon={DisconnectedLayersIcon}
            title="Não foi possível carregar os jogadores"
            description="Não foi possível carregar os dados. Verifique a conexão e tente de novo."
            action={{
              label: 'Tentar de novo',
              onClick: fetchPlayers,
              icon: RotateCw,
            }}
          />
        ) : players.length === 0 ? (
          (filters.search.trim() || filters.position || filters.condition || filters.club_id || filters.free || filters.min_age || filters.max_age || filters.min_value || filters.max_value) ? (
            <EmptyState
              icon={SearchX}
              title={
                filters.search.trim()
                  ? `Nenhum jogador encontrado para “${filters.search.trim()}”`
                  : 'Nenhum jogador encontrado'
              }
              description="Confira a grafia ou tire alguns filtros. A busca ignora maiúsculas, minúsculas e acentos."
              action={{
                label: 'Limpar filtros',
                onClick: handleResetFilters,
                icon: XIcon,
              }}
            />
          ) : (
            <EmptyState
              icon={Users}
              title="Nenhum jogador cadastrado"
              description="Com o banco recém-criado, a lista começa vazia."
              action={{
                label: 'Novo jogador',
                onClick: () => setIsCreateOpen(true),
                icon: Plus,
              }}
            />
          )
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-zinc-800">
              <thead className="bg-white border-b border-[#E4E4E7] text-xs text-[#686872] font-normal select-none">
                <tr>
                  <th className="py-3.5 px-4 font-normal text-[#686872]">Jogador</th>
                  <th className="py-3.5 px-3 font-normal text-[#686872]">Posição</th>
                  <th className="py-3.5 px-3 font-normal text-[#686872] text-center">Overall</th>
                  <th className="py-3.5 px-3 font-normal text-[#686872]">Agilidade</th>
                  <th className="py-3.5 px-3 font-normal text-[#686872] text-center">Idade</th>
                  <th className="py-3.5 px-3 font-normal text-[#686872]">Condição</th>
                  <th className="py-3.5 px-3 font-normal text-[#686872] text-right">Valor base</th>
                  <th className="py-3.5 px-3 font-normal text-[#686872] text-right">Valor de mercado</th>
                  <th className="py-3.5 px-4 font-normal text-[#686872]">Clube</th>
                  <th className="py-3.5 px-4 text-right w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E4E7] font-normal">
                {players.map((player) => {
                  const club = getClubName(player.club_id);
                  const palette = getAvatarColor(player.name);
                  const isMenuOpen = menuPlayerId === player.id;

                  return (
                    <tr
                      key={player.id}
                      className="hover:bg-zinc-50/70 transition group"
                    >
                      {/* Name & Initials Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full ${palette.bg} ${palette.text} font-bold text-xs flex items-center justify-center shrink-0 select-none`}
                          >
                            {getInitials(player.name)}
                          </div>
                          <div>
                            <div className="font-semibold text-zinc-900 group-hover:text-[#155DFC] transition text-sm leading-tight">
                              {player.name}
                            </div>
                            <div className="text-xs text-[#686872] capitalize mt-0.5">
                              {getPositionLabel(player.position)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Position Badge */}
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md border border-zinc-200 bg-white text-[11px] font-mono font-medium text-zinc-700">
                          {player.position}
                        </span>
                      </td>

                      {/* Overall */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="font-bold text-sm text-zinc-900">
                          {player.overall}
                        </span>
                      </td>

                      {/* Agility with bar */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-zinc-800 w-5">
                            {player.agility}
                          </span>
                          <div className="w-8 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${Math.min(100, Math.max(15, player.agility))}%`,
                                backgroundColor:
                                  player.agility >= 70
                                    ? '#00813A'
                                    : player.agility >= 40
                                    ? '#686872'
                                    : '#E40016',
                              }}
                            />
                          </div>
                          {player.agility < 40 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#E40016] inline-block shrink-0" />
                          )}
                        </div>
                      </td>

                      {/* Age */}
                      <td className="py-3.5 px-3 text-center text-xs text-zinc-800">
                        {player.age}
                      </td>

                      {/* Condition */}
                      <td className="py-3.5 px-3">
                        {player.condition === 'APTO' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#00813A] border border-emerald-200 text-xs font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00813A]" />
                            Apto
                          </span>
                        )}
                        {player.condition === 'MAL_CONDICIONADO' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-[#B45309] border border-amber-200 text-xs font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                            Mal condicionado
                          </span>
                        )}
                        {player.condition === 'DOENTE' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-[#E40016] border border-rose-200 text-xs font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#E40016]" />
                            Doente
                          </span>
                        )}
                      </td>

                      {/* Base Value */}
                      <td className="py-3.5 px-3 text-right font-mono text-xs text-[#686872]">
                        {formatNumber(player.base_value)}
                      </td>

                      {/* Market Value Highlight */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-xs text-zinc-900">
                        {formatNumber(player.market_value)}
                      </td>

                      {/* Club or Free status with Buy action */}
                      <td className="py-3.5 px-4">
                        {club ? (
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 text-[10px] font-mono font-bold uppercase">
                              {club.acronym}
                            </span>
                            <button
                              onClick={() => onClubClick && onClubClick(club.id)}
                              className="underline hover:text-[#155DFC] text-xs text-zinc-900 transition font-normal cursor-pointer"
                            >
                              {club.name}
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <span className="text-zinc-600 text-xs">Livre</span>
                            <button
                              onClick={() => {
                                setBuyingPlayer(player);
                                setRecentBuyError(null);
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-zinc-300 hover:bg-zinc-50 active:scale-95 text-zinc-800 text-xs font-medium cursor-pointer transition shadow-2xs"
                              title={`Comprar ${player.name}`}
                            >
                              <ShoppingCart className="w-3.5 h-3.5 text-zinc-600" />
                              Comprar
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Actions Popover Trigger matching Figma Screenshot 2 */}
                      <td className="py-3.5 px-4 text-right relative">
                        <button
                          onClick={() => setMenuPlayerId(isMenuOpen ? null : player.id)}
                          className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
                          aria-label={`Ações para ${player.name}`}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu - 100% fiel ao Figma */}
                        {isMenuOpen && (
                          <div
                            ref={menuRef}
                            className="absolute right-4 mt-1 w-52 bg-white rounded-2xl shadow-xl border border-[#E4E4E7] py-2 z-30 text-left animate-in fade-in zoom-in-95 duration-100 select-none"
                          >
                            {/* Nome do Jogador no topo do menu */}
                            <div className="px-3.5 py-1.5 text-xs font-semibold text-[#686872] border-b border-[#E4E4E7]/60 truncate">
                              {player.name}
                            </div>

                            {/* Opção 1: Ver detalhes */}
                            <button
                              onClick={() => {
                                setDetailPlayer(player);
                                setMenuPlayerId(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-zinc-800 hover:bg-zinc-50 transition cursor-pointer"
                            >
                              <Eye className="w-4 h-4 text-zinc-500" />
                              <span>Ver detalhes</span>
                            </button>

                            {/* Opção 2: Editar */}
                            <button
                              onClick={() => {
                                setEditingPlayer(player);
                                setMenuPlayerId(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-zinc-800 hover:bg-zinc-50 transition cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4 text-zinc-500" />
                              <span>Editar</span>
                            </button>

                            {/* Opção 3: Alterar condição */}
                            <button
                              onClick={() => {
                                setConditionPlayer(player);
                                setMenuPlayerId(null);
                              }}
                              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-zinc-800 hover:bg-zinc-50 transition cursor-pointer"
                            >
                              <Heart className="w-4 h-4 text-zinc-500" />
                              <span>Alterar condição</span>
                            </button>

                            {/* Opção 4: Comprar (se o jogador estiver livre) */}
                            {player.club_id === null && (
                              <button
                                onClick={() => {
                                  setBuyingPlayer(player);
                                  setMenuPlayerId(null);
                                }}
                                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-zinc-800 hover:bg-zinc-50 transition cursor-pointer"
                              >
                                <ShoppingCart className="w-4 h-4 text-zinc-500" />
                                <span>Comprar</span>
                              </button>
                            )}

                            <div className="border-t border-[#E4E4E7]/60 my-1" />

                            {/* Opção 5: Excluir com nota explicativa */}
                            <button
                              onClick={() => {
                                if (player.club_id === null) {
                                  setDeletingPlayer(player);
                                  setMenuPlayerId(null);
                                }
                              }}
                              disabled={player.club_id !== null}
                              className={`w-full flex flex-col items-start px-3.5 py-2 text-left transition ${
                                player.club_id === null
                                  ? 'hover:bg-rose-50/50 cursor-pointer text-rose-600'
                                  : 'opacity-40 cursor-not-allowed text-zinc-400'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <Trash2 className="w-4 h-4" />
                                <span className="text-xs font-medium">Excluir</span>
                              </div>
                              <span className="text-[10px] text-[#686872] mt-0.5 pl-6.5 leading-tight">
                                {player.club_id === null
                                  ? 'Disponível porque o jogador está livre.'
                                  : 'Indisponível: jogador vinculado a um clube.'}
                              </span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer with Pagination */}
        {!loading && !loadError && players.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3.5 px-4 border-t border-[#E4E4E7] text-xs text-[#686872] select-none">
            <div>
              Mostrando <span className="font-medium text-zinc-900">{startItem}–{endItem}</span> de{' '}
              <span className="font-medium text-zinc-900">{totalItems}</span>{' '}
              {totalItems === 1 ? 'jogador' : 'jogadores'}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-zinc-700 hover:text-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Anterior
              </button>

              {/* Page number buttons */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition cursor-pointer ${
                      pageNum === currentPage
                        ? 'border border-[#E4E4E7] bg-white text-zinc-900 shadow-2xs font-bold'
                        : 'text-zinc-600 hover:bg-zinc-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-zinc-700 hover:text-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
              >
                Próxima
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footnote strictly matching Figma Screenshots */}
      {!loading && !loadError && players.length > 0 && (
        <p className="text-xs text-zinc-500 px-1 leading-relaxed">
          {getFootnoteText()}
        </p>
      )}

      {/* Modals and Drawers */}
      <PlayerCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(newPlayer) => {
          fetchPlayers();
          fetchCounts();
          setSuccessPlayer(newPlayer);
        }}
      />

      <PlayerSuccessModal
        isOpen={Boolean(successPlayer)}
        player={successPlayer}
        onClose={() => setSuccessPlayer(null)}
        onViewDetails={(p) => setDetailPlayer(p)}
      />

      <PlayerDetailDrawer
        isOpen={Boolean(detailPlayer)}
        player={detailPlayer}
        clubs={clubs}
        onClose={() => setDetailPlayer(null)}
        onEdit={(p) => setEditingPlayer(p)}
        onChangeCondition={(p) => setConditionPlayer(p)}
        onBuy={(p) => setBuyingPlayer(p)}
      />

      <PlayerEditModal
        isOpen={Boolean(editingPlayer)}
        player={editingPlayer}
        onClose={() => setEditingPlayer(null)}
        onSuccess={() => fetchPlayers()}
      />

      <PlayerConditionModal
        isOpen={Boolean(conditionPlayer)}
        player={conditionPlayer}
        clubs={clubs}
        onClose={() => {
          setConditionPlayer(null);
          setIsModalStarterDoente(false);
        }}
        onConditionSelect={(cond, starter) => {
          setIsModalStarterDoente(cond === 'DOENTE' && starter);
        }}
        onSuccess={() => {
          fetchPlayers();
          setRecentAction('condition_changed');
        }}
      />

      <PlayerDeleteModal
        isOpen={Boolean(deletingPlayer)}
        player={deletingPlayer}
        onClose={() => setDeletingPlayer(null)}
        onSuccess={(deletedPlayer) => {
          fetchPlayers();
          fetchCounts();
          setLastDeletedPlayer(deletedPlayer);
          setRecentAction('player_deleted');
        }}
      />

      <QuickBuyModal
        isOpen={Boolean(buyingPlayer)}
        player={buyingPlayer}
        clubs={clubs}
        onClose={() => setBuyingPlayer(null)}
        onViewClub={(clubId) => {
          setBuyingPlayer(null);
          setRecentBuyError(null);
          onClubClick?.(clubId);
        }}
        onSuccess={() => {
          setRecentBuyError(null);
          fetchPlayers();
          fetchCounts();
          onRefreshClubs?.();
        }}
        onBuyError={(errMsg) => setRecentBuyError(errMsg)}
      />
    </div>
  );
};
