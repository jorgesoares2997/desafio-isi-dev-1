import React, { useState, useEffect, useCallback } from 'react';
import { api, getApiErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { ClubDetail, PlayerInClub } from '../../types';
import { BuyPlayerModal } from './BuyPlayerModal';
import { SellPlayerModal } from './SellPlayerModal';
import { ClubTransactionsTab } from './ClubTransactionsTab';
import { TableSkeleton } from '../common/Skeleton';
import { EmptyState } from '../common/EmptyState';
import { 
  formatCurrency, 
  formatDateTime, 
  getPositionBadgeClass, 
  getConditionBadgeClass, 
  getConditionLabel 
} from '../../utils/formatters';
import { 
  ArrowLeft, 
  ShoppingCart, 
  ArrowDownRight, 
  Wallet, 
  Users, 
  ShieldCheck, 
  Clock, 
  AlertCircle 
} from 'lucide-react';

interface ClubDetailViewProps {
  clubId: number;
  onBack: () => void;
}

export const ClubDetailView: React.FC<ClubDetailViewProps> = ({ clubId, onBack }) => {
  const { showToast } = useToast();
  const [club, setClub] = useState<ClubDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'roster' | 'transactions'>('roster');

  // Modals state
  const [isBuyOpen, setIsBuyOpen] = useState(false);
  const [sellingPlayer, setSellingPlayer] = useState<PlayerInClub | null>(null);

  const fetchClub = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await api.get<ClubDetail>(`/clubs/${clubId}`);
      setClub(resp.data);
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [clubId, showToast]);

  useEffect(() => {
    fetchClub();
  }, [fetchClub]);

  if (loading && !club) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-zinc-800 rounded w-48 animate-pulse" />
        <TableSkeleton rows={6} cols={6} />
      </div>
    );
  }

  if (!club) {
    return (
      <EmptyState
        title="Clube não encontrado"
        description="Não foi possível carregar os detalhes do clube selecionado."
        action={{ label: 'Voltar para Clubes', onClick: onBack }}
      />
    );
  }

  const isSquadFull = club.players.length >= 12;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-white border border-[#E4E4E7] text-[#686872] hover:text-zinc-900 hover:bg-zinc-50 transition shadow-2xs"
            aria-label="Voltar para a lista de clubes"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
                {club.name}
              </h2>
              <span className="px-2.5 py-0.5 rounded-md bg-[#EFF6FF] border border-blue-200 text-xs font-mono font-bold text-[#1447E6]">
                {club.acronym}
              </span>
            </div>
            <p className="text-xs text-[#686872] mt-0.5">
              Gestão de elenco, contratos de fidelidade e histórico financeiro.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsBuyOpen(true)}
          disabled={isSquadFull}
          title={isSquadFull ? 'Limite de 12 atletas no elenco atingido' : 'Comprar novo atleta'}
          className="flex items-center gap-2 bg-[#155DFC] hover:bg-[#1447E6] disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 text-white px-4 py-2.5 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
        >
          <ShoppingCart className="w-4 h-4" />
          Comprar Atleta
        </button>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E4E4E7] rounded-xl p-5 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#686872] flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-emerald-600" /> Caixa Disponível
          </span>
          <div className="text-lg sm:text-xl font-mono font-bold text-zinc-900">
            {formatCurrency(club.cash)}
          </div>
        </div>

        <div className="bg-white border border-[#E4E4E7] rounded-xl p-5 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#686872] flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#155DFC]" /> Valor do Elenco
          </span>
          <div className="text-lg sm:text-xl font-mono font-bold text-zinc-900">
            {formatCurrency(club.squad_value)}
          </div>
        </div>

        <div className="bg-white border border-[#E4E4E7] rounded-xl p-5 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#686872] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Patrimônio Líquido
          </span>
          <div className="text-lg sm:text-xl font-mono font-bold text-emerald-600">
            {formatCurrency(club.net_worth)}
          </div>
        </div>

        <div className="bg-white border border-[#E4E4E7] rounded-xl p-5 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#686872] flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#686872]" /> Tamanho do Elenco
          </span>
          <div className="text-lg sm:text-xl font-mono font-bold text-zinc-900">
            {club.players.length} / 12 atletas
          </div>
        </div>
      </div>

      {isSquadFull && (
        <div className="flex items-center gap-2 p-3 bg-[#FFFBEB] border border-[#FEE685] text-[#953D00] text-xs rounded-xl font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Limite máximo de 12 atletas atingido para este clube (RN13). Venda um jogador para liberar vaga.</span>
        </div>
      )}

      {/* Tabs Selector */}
      <div className="border-b border-[#E4E4E7] flex items-center gap-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('roster')}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'roster'
              ? 'border-[#155DFC] text-[#155DFC] font-semibold'
              : 'border-transparent text-[#686872] hover:text-zinc-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Elenco e Contratos ({club.players.length})
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`pb-3 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'transactions'
              ? 'border-[#155DFC] text-[#155DFC] font-semibold'
              : 'border-transparent text-[#686872] hover:text-zinc-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          Histórico de Transações
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'roster' ? (
        <div className="bg-white border border-[#E4E4E7] rounded-xl shadow-xs overflow-hidden">
          {club.players.length === 0 ? (
            <EmptyState
              title="Elenco vazio"
              description="Este clube ainda não possui atletas vinculados. Utilize o botão acima para contratar atletas livres."
              action={{
                label: 'Contratar Primeiro Atleta',
                onClick: () => setIsBuyOpen(true),
              }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-zinc-800">
                <thead className="bg-[#FAFAFA] border-b border-[#E4E4E7] text-[11px] uppercase tracking-wider text-[#686872] font-semibold select-none">
                  <tr>
                    <th className="py-3.5 px-4">Atleta</th>
                    <th className="py-3.5 px-3">Posição</th>
                    <th className="py-3.5 px-3 text-center">Overall</th>
                    <th className="py-3.5 px-3">Condição</th>
                    <th className="py-3.5 px-3 text-right">Valor Mercado</th>
                    <th className="py-3.5 px-3">Fim Fidelidade</th>
                    <th className="py-3.5 px-3 text-center">Dias Restantes</th>
                    <th className="py-3.5 px-3 text-center">Multa %</th>
                    <th className="py-3.5 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E4E7] font-normal">
                  {club.players.map((player) => (
                    <tr key={player.id} className="hover:bg-zinc-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-zinc-900">{player.name}</div>
                        <div className="text-[11px] text-[#686872]">{player.age} anos</div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-mono font-bold ${getPositionBadgeClass(
                            player.position
                          )}`}
                        >
                          {player.position}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#EFF6FF] border border-blue-200 font-mono font-bold text-sm text-[#1447E6]">
                          {player.overall}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-medium ${getConditionBadgeClass(
                            player.condition
                          )}`}
                        >
                          {getConditionLabel(player.condition)}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-600">
                        {formatCurrency(player.market_value)}
                      </td>

                      <td className="py-3.5 px-3 font-mono text-zinc-600 text-xs">
                        {formatDateTime(player.contract?.loyalty_until)}
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono text-zinc-600">
                        {player.contract?.remaining_days ?? '-'}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`font-mono text-xs font-semibold ${
                            (player.contract?.penalty_rate ?? 0) > 0 ? 'text-amber-600' : 'text-emerald-600'
                          }`}
                        >
                          {player.contract?.penalty_rate ?? 0}%
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSellingPlayer(player)}
                          className="flex items-center gap-1 mx-auto px-2.5 py-1 rounded-lg text-xs font-semibold text-[#9F0A0A] bg-[#FEF2F2] hover:bg-rose-100 border border-[#FECACA] transition active:scale-95"
                        >
                          <ArrowDownRight className="w-3.5 h-3.5" />
                          Vender
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <ClubTransactionsTab clubId={club.id} />
      )}

      {/* Buy & Sell Modals */}
      <BuyPlayerModal
        isOpen={isBuyOpen}
        onClose={() => setIsBuyOpen(false)}
        club={club}
        onSuccess={() => fetchClub()}
      />

      <SellPlayerModal
        isOpen={Boolean(sellingPlayer)}
        player={sellingPlayer}
        club={club}
        onClose={() => setSellingPlayer(null)}
        onSuccess={() => fetchClub()}
      />
    </div>
  );
};
