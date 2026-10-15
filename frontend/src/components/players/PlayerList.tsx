import React, { useState, useEffect, useCallback } from 'react';
import { api, getApiErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Player, Club, PagedResponse } from '../../types';
import { PlayerFilters, PlayerFilterValues } from './PlayerFilters';
import { PlayerCreateModal } from './PlayerCreateModal';
import { PlayerEditModal } from './PlayerEditModal';
import { PlayerConditionModal } from './PlayerConditionModal';
import { PlayerDeleteModal } from './PlayerDeleteModal';
import { Pagination } from '../common/Pagination';
import { TableSkeleton } from '../common/Skeleton';
import { EmptyState } from '../common/EmptyState';
import { 
  formatCurrency, 
  getPositionBadgeClass, 
  getConditionBadgeClass, 
  getConditionLabel 
} from '../../utils/formatters';
import { 
  UserPlus, 
  Edit3, 
  HeartPulse, 
  Trash2, 
  Users, 
  Shield 
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
}

export const PlayerList: React.FC<PlayerListProps> = ({ clubs, onClubClick }) => {
  const { showToast } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<PlayerFilterValues>(INITIAL_FILTERS);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [conditionPlayer, setConditionPlayer] = useState<Player | null>(null);
  const [deletingPlayer, setDeletingPlayer] = useState<Player | null>(null);

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
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
      showToast('error', getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, showToast]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const handleFilterChange = (newFilters: PlayerFilterValues) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setCurrentPage(1);
  };

  const getClubName = (clubId: number | null) => {
    if (!clubId) return null;
    return clubs.find((c) => c.id === clubId);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-blue-500" />
            Mercado de Atletas
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Consulte o elenco global, valuation dinâmico e gerencie as condições dos atletas.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg shadow-blue-500/20 transition cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Novo Atleta
        </button>
      </div>

      {/* Filters Component */}
      <PlayerFilters
        clubs={clubs}
        filters={filters}
        onChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Players Data Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <TableSkeleton rows={8} cols={7} />
        ) : players.length === 0 ? (
          <EmptyState
            title="Nenhum atleta encontrado"
            description="Não encontramos jogadores para os critérios de busca selecionados. Tente ajustar seus filtros."
            action={{
              label: 'Limpar Filtros',
              onClick: handleResetFilters,
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-zinc-200">
              <thead className="bg-zinc-950/70 border-b border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-400 font-semibold select-none">
                <tr>
                  <th className="py-3.5 px-4">Atleta</th>
                  <th className="py-3.5 px-3">Posição</th>
                  <th className="py-3.5 px-3 text-center">Overall</th>
                  <th className="py-3.5 px-3 text-center">Agilidade</th>
                  <th className="py-3.5 px-3">Condição</th>
                  <th className="py-3.5 px-3 text-right">Valor Base</th>
                  <th className="py-3.5 px-3 text-right">Valor de Mercado</th>
                  <th className="py-3.5 px-3">Clube</th>
                  <th className="py-3.5 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-normal">
                {players.map((player) => {
                  const club = getClubName(player.club_id);
                  return (
                    <tr
                      key={player.id}
                      className="hover:bg-zinc-800/30 transition group"
                    >
                      {/* Name & Age */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white group-hover:text-blue-400 transition">
                          {player.name}
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          {player.age} anos · Potencial {player.potential}
                        </div>
                      </td>

                      {/* Position */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-mono font-bold ${getPositionBadgeClass(
                            player.position
                          )}`}
                        >
                          {player.position}
                        </span>
                      </td>

                      {/* Overall Highlight */}
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-950 border border-zinc-700/80 font-mono font-bold text-sm text-amber-400 shadow-inner">
                          {player.overall}
                        </span>
                      </td>

                      {/* Agility */}
                      <td className="py-3 px-3 text-center font-mono text-zinc-300">
                        {player.agility}
                      </td>

                      {/* Condition */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-medium ${getConditionBadgeClass(
                            player.condition
                          )}`}
                        >
                          {getConditionLabel(player.condition)}
                        </span>
                      </td>

                      {/* Base Value */}
                      <td className="py-3 px-3 text-right font-mono text-zinc-400">
                        {formatCurrency(player.base_value)}
                      </td>

                      {/* Market Value Highlight */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                        {formatCurrency(player.market_value)}
                      </td>

                      {/* Club */}
                      <td className="py-3 px-3">
                        {club ? (
                          <button
                            onClick={() => onClubClick && onClubClick(club.id)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800/70 hover:bg-zinc-800 border border-zinc-700 text-xs text-zinc-200 transition"
                          >
                            <Shield className="w-3.5 h-3.5 text-blue-400" />
                            <span className="font-medium truncate max-w-[120px]">{club.name}</span>
                            <span className="font-mono text-zinc-400">({club.acronym})</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-zinc-800/40 text-zinc-400 border border-zinc-700/40 text-[11px]">
                            Livre
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setEditingPlayer(player)}
                            title="Editar dados cadastrais"
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                            aria-label={`Editar ${player.name}`}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setConditionPlayer(player)}
                            title="Alterar condição física"
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition"
                            aria-label={`Alterar condição de ${player.name}`}
                          >
                            <HeartPulse className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setDeletingPlayer(player)}
                            disabled={player.club_id !== null}
                            title={
                              player.club_id !== null
                                ? 'Atleta vinculado a um clube não pode ser excluído'
                                : 'Excluir logicamente'
                            }
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
                            aria-label={`Excluir ${player.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Fixed Pagination Bar */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          limit={10}
          onPageChange={(page) => setCurrentPage(page)}
          itemName="atletas"
        />
      </div>

      {/* Modals */}
      <PlayerCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => fetchPlayers()}
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
        onClose={() => setConditionPlayer(null)}
        onSuccess={() => fetchPlayers()}
      />

      <PlayerDeleteModal
        isOpen={Boolean(deletingPlayer)}
        player={deletingPlayer}
        onClose={() => setDeletingPlayer(null)}
        onSuccess={() => fetchPlayers()}
      />
    </div>
  );
};
