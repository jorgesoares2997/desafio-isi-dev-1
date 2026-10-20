import React, { useState, useEffect, useCallback } from 'react';
import { api, getApiErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { ClubDetail, PlayerInClub, TransactionsListResponse } from '../../types';
import { BuyPlayerModal } from './BuyPlayerModal';
import { SellPlayerModal } from './SellPlayerModal';
import { ClubTransactionsTab } from './ClubTransactionsTab';
import { ClubLineupTab } from './ClubLineupTab';
import { TableSkeleton } from '../common/Skeleton';
import { EmptyState } from '../common/EmptyState';
import { 
  formatDecimal, 
  formatInteger, 
  splitDateTime 
} from '../../utils/formatters';
import { 
  ShoppingCart, 
  Wallet, 
  Landmark, 
  Link2, 
  Shirt, 
  Users, 
  Check, 
  ArrowLeftRight,
  ClipboardList, 
  Clock,
  ArrowLeft,
  SearchX
} from 'lucide-react';

interface ClubDetailViewProps {
  clubId: number;
  onBack: () => void;
  initialTab?: 'squad' | 'lineup' | 'history';
  onTabChange?: (tab: 'squad' | 'lineup' | 'history') => void;
}

const POSITION_ORDER: Record<string, number> = {
  GOL: 1,
  ZAG: 2,
  LAT: 3,
  MEI: 4,
  ATA: 5,
};

const AVATAR_PALETTES = [
  { bg: 'bg-purple-100', text: 'text-purple-700' },
  { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  { bg: 'bg-cyan-100', text: 'text-cyan-700' },
  { bg: 'bg-fuchsia-100', text: 'text-fuchsia-700' },
  { bg: 'bg-rose-100', text: 'text-rose-700' },
  { bg: 'bg-violet-100', text: 'text-violet-700' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  { bg: 'bg-sky-100', text: 'text-sky-700' },
];

function getPlayerAvatar(name: string, id: number) {
  const hash = id || name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const palette = AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
  const parts = name.trim().split(/\s+/);
  const initials = parts.length >= 2 
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
  return { ...palette, initials };
}

export const ClubDetailView: React.FC<ClubDetailViewProps> = ({ 
  clubId, 
  onBack,
  initialTab = 'squad',
  onTabChange,
}) => {
  const { showToast } = useToast();
  const [club, setClub] = useState<ClubDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'squad' | 'lineup' | 'history'>(initialTab);
  const [txCount, setTxCount] = useState<number>(0);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabClick = (tab: 'squad' | 'lineup' | 'history') => {
    setActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  // Modals state
  const [isBuyOpen, setIsBuyOpen] = useState(false);
  const [sellingPlayer, setSellingPlayer] = useState<PlayerInClub | null>(null);

  const fetchClub = useCallback(async () => {
    setLoading(true);
    try {
      const [clubResp, txResp] = await Promise.all([
        api.get<ClubDetail>(`/clubs/${clubId}`),
        api.get<TransactionsListResponse>(`/clubs/${clubId}/transactions`).catch(() => null),
      ]);
      setClub(clubResp.data);
      if (txResp?.data?.data) {
        setTxCount(txResp.data.data.length);
      }
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
        <div className="h-8 bg-zinc-200 rounded w-48 animate-pulse" />
        <TableSkeleton rows={6} cols={6} />
      </div>
    );
  }

  if (!club) {
    return (
      <div className="space-y-4">
        <div className="bg-white border border-[#E4E4E7] rounded-2xl p-16 shadow-xs flex flex-col items-center justify-center text-center min-h-[380px]">
          <EmptyState
            icon={SearchX}
            title="Clube não encontrado"
            description="Clube não encontrado. O endereço pode estar errado ou o clube não existe."
            action={{
              label: 'Voltar para clubes',
              onClick: onBack,
              icon: ArrowLeft,
            }}
            className="py-0 px-0"
          />
        </div>
        <p className="text-xs text-[#686872] px-1">
          Clube inexistente: a tela mostra a mensagem e oferece o caminho de volta.
        </p>
      </div>
    );
  }

  const sortedPlayers = [...club.players].sort((a, b) => {
    const orderA = POSITION_ORDER[a.position] || 99;
    const orderB = POSITION_ORDER[b.position] || 99;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name, 'pt-BR');
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-10 rounded-xl bg-zinc-100 flex items-center justify-center font-bold text-xs text-zinc-700 tracking-wide shrink-0">
            {club.acronym}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              {club.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="border border-zinc-200 bg-zinc-50 text-zinc-600 text-xs px-2.5 py-0.5 rounded-md font-medium">
                Sigla {club.acronym}
              </span>
              <span className="border border-zinc-200 bg-zinc-50 text-zinc-600 text-xs px-2.5 py-0.5 rounded-md font-medium flex items-center gap-1.5">
                <Shirt className="w-3.5 h-3.5 text-zinc-500" />
                {club.players.length} de 12 jogadores
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsBuyOpen(true)}
          disabled={club.players.length >= 12}
          title={club.players.length >= 12 ? 'Limite de 12 atletas atingido' : 'Comprar jogadores livres'}
          className="flex items-center gap-2 bg-[#155DFC] hover:bg-[#1447E6] disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 text-white px-4 py-2.5 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer whitespace-nowrap self-end sm:self-auto"
        >
          <ShoppingCart className="w-4 h-4" />
          Comprar jogadores
        </button>
      </div>

      {/* 4 Financial & Squad Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card Caixa */}
        <div className="bg-white border border-[#E4E4E7] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#686872] font-medium">Caixa</span>
            <Wallet className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-zinc-900">
            {formatDecimal(club.cash)} <span className="text-xs font-normal text-[#686872] font-sans">moedas</span>
          </div>
          <p className="text-[11px] text-[#686872] mt-1.5">
            Só muda por compras e vendas
          </p>
        </div>

        {/* Card Valor do elenco */}
        <div className="bg-white border border-[#E4E4E7] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#686872] font-medium">Valor do elenco</span>
            <Link2 className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-zinc-900">
            {formatDecimal(club.squad_value)} <span className="text-xs font-normal text-[#686872] font-sans">moedas</span>
          </div>
          <p className="text-[11px] text-[#686872] mt-1.5">
            Soma dos valores de mercado
          </p>
        </div>

        {/* Card Patrimônio */}
        <div className="bg-white border border-[#E4E4E7] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#686872] font-medium">Patrimônio</span>
            <Landmark className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-zinc-900">
            {formatDecimal(club.net_worth)} <span className="text-xs font-normal text-[#686872] font-sans">moedas</span>
          </div>
          <p className="text-[11px] text-[#686872] mt-1.5">
            Caixa + valor do elenco
          </p>
        </div>

        {/* Card Elenco */}
        <div className="bg-white border border-[#E4E4E7] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#686872] font-medium">Elenco</span>
            <Shirt className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-zinc-900">
            {club.players.length} de 12
          </div>
          <p className="text-[11px] text-[#686872] mt-1.5">
            Limite de 12 jogadores
          </p>
        </div>
      </div>

      {/* Segmented Tabs */}
      <div className="border-b border-[#E4E4E7] flex items-center gap-8 text-sm select-none">
        <button
          type="button"
          onClick={() => handleTabClick('squad')}
          className={`pb-3.5 border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'squad'
              ? 'border-[#155DFC] text-[#155DFC] font-semibold'
              : 'border-transparent text-[#686872] hover:text-zinc-900'
          }`}
        >
          <Shirt className="w-4 h-4" />
          <span>Elenco</span>
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              activeTab === 'squad' ? 'bg-blue-100 text-[#155DFC]' : 'bg-zinc-100 text-zinc-600'
            }`}
          >
            {club.players.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick('lineup')}
          className={`pb-3.5 border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'lineup'
              ? 'border-[#155DFC] text-[#155DFC] font-semibold'
              : 'border-transparent text-[#686872] hover:text-zinc-900'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Escalação</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick('history')}
          className={`pb-3.5 border-b-2 transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'history'
              ? 'border-[#155DFC] text-[#155DFC] font-semibold'
              : 'border-transparent text-[#686872] hover:text-zinc-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Histórico</span>
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              activeTab === 'history' ? 'bg-blue-100 text-[#155DFC]' : 'bg-zinc-100 text-zinc-600'
            }`}
          >
            {txCount}
          </span>
        </button>
      </div>

      {/* Tab Content 1: Squad */}
      {activeTab === 'squad' && (
        club.players.length === 0 ? (
          /* Empty State matching Figma Screenshot 4 */
          <div className="bg-white border border-[#E4E4E7] rounded-2xl p-16 flex flex-col items-center justify-center text-center shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 mb-4">
              <Shirt className="w-7 h-7 text-zinc-400 stroke-[1.5]" />
            </div>
            <h3 className="font-semibold text-base text-zinc-900 mb-2">
              Nenhum jogador no elenco
            </h3>
            <p className="text-xs text-[#686872] max-w-md leading-relaxed mb-6">
              Compre jogadores livres para montar o elenco. O limite é de 12 jogadores, e o custo de cada compra não pode passar de 50% do caixa.
            </p>
            <button
              onClick={() => setIsBuyOpen(true)}
              className="border border-[#E4E4E7] bg-white hover:bg-zinc-50 text-zinc-700 px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-xs transition active:scale-95 cursor-pointer"
            >
              <Users className="w-4 h-4 text-zinc-500" />
              Ver jogadores livres
            </button>
          </div>
        ) : (
          /* Squad Table matching Figma Screenshot 5 */
          <div>
            <div className="bg-white border border-[#E4E4E7] rounded-2xl shadow-xs overflow-hidden p-6">
              <div className="mb-5">
                <h3 className="font-semibold text-base text-zinc-900">
                  Elenco
                </h3>
                <p className="text-xs text-[#686872] mt-0.5">
                  Ordem por posição (GOL, ZAG, LAT, MEI, ATA), depois pelo nome. Contrato calculado para uma venda agora.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="text-[12px] text-[#686872] border-b border-[#E4E4E7] bg-white font-normal select-none">
                    <tr>
                      <th className="py-3 px-4 font-normal">Jogador</th>
                      <th className="py-3 px-3 font-normal">Posição</th>
                      <th className="py-3 px-3 font-normal text-center">Overall</th>
                      <th className="py-3 px-3 font-normal">Condição</th>
                      <th className="py-3 px-3 font-normal text-right">Valor de mercado</th>
                      <th className="py-3 px-3 font-normal text-right">Valor de compra</th>
                      <th className="py-3 px-4 font-normal">Fim da fidelidade</th>
                      <th className="py-3 px-3 font-normal text-center">Dias restantes</th>
                      <th className="py-3 px-3 font-normal text-center">% de multa</th>
                      <th className="py-3 px-4 font-normal text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F4F4F5]">
                    {sortedPlayers.map((player) => {
                      const avatar = getPlayerAvatar(player.name, player.id);
                      const fidelity = splitDateTime(player.contract?.loyalty_until);
                      const penaltyRate = player.contract?.penalty_rate ?? 0;

                      return (
                        <tr key={player.id} className="hover:bg-zinc-50/80 transition-colors">
                          {/* Jogador */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${avatar.bg} ${avatar.text}`}
                              >
                                {avatar.initials}
                              </div>
                              <span className="font-medium text-xs sm:text-sm text-zinc-900">
                                {player.name}
                              </span>
                            </div>
                          </td>

                          {/* Posição */}
                          <td className="py-3.5 px-3 font-mono text-xs font-medium text-zinc-700">
                            {player.position}
                          </td>

                          {/* Overall */}
                          <td className="py-3.5 px-3 text-center font-semibold text-xs text-zinc-900">
                            {player.overall}
                          </td>

                          {/* Condição */}
                          <td className="py-3.5 px-3">
                            {player.condition === 'APTO' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80 whitespace-nowrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                Apto
                              </span>
                            )}
                            {player.condition === 'MAL_CONDICIONADO' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/80 whitespace-nowrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                                Mal condicionado
                              </span>
                            )}
                            {player.condition === 'DOENTE' && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/80 whitespace-nowrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                                Doente
                              </span>
                            )}
                          </td>

                          {/* Valor de mercado */}
                          <td className="py-3.5 px-3 text-right font-mono font-bold text-xs sm:text-sm text-zinc-900">
                            {formatDecimal(player.market_value)}
                          </td>

                          {/* Valor de compra */}
                          <td className="py-3.5 px-3 text-right font-mono text-xs text-zinc-500">
                            {formatDecimal(player.contract?.purchase_value ?? player.market_value)}
                          </td>

                          {/* Fim da fidelidade */}
                          <td className="py-3.5 px-4">
                            <div className="font-mono text-xs text-zinc-700 leading-tight">
                              {fidelity.date}
                            </div>
                            {fidelity.time && (
                              <div className="font-mono text-[11px] text-zinc-400 leading-tight mt-0.5">
                                {fidelity.time}
                              </div>
                            )}
                          </td>

                          {/* Dias restantes */}
                          <td className="py-3.5 px-3 text-center font-mono text-xs text-zinc-700">
                            {formatInteger(player.contract?.remaining_days)}
                          </td>

                          {/* % de multa */}
                          <td className="py-3.5 px-3 text-center">
                            {penaltyRate === 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-xs font-medium">
                                <Check className="w-3 h-3 text-emerald-600" />
                                0%
                              </span>
                            ) : (
                              <span
                                className={`inline-flex items-center justify-center px-2 py-0.5 rounded font-mono text-xs font-medium ${
                                  penaltyRate === 20
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {penaltyRate}%
                              </span>
                            )}
                          </td>

                          {/* Action Vender */}
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setSellingPlayer(player)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E4E7] bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium shadow-2xs transition active:scale-95 cursor-pointer whitespace-nowrap"
                            >
                              <ArrowLeftRight className="w-3.5 h-3.5 text-zinc-500" />
                              Vender
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footnote below squad table */}
            <p className="text-xs text-[#686872] mt-4 px-1">
              Valor de mercado, dias restantes e % de multa calculados para uma venda agora (12/11/2026, 15:00). A multa tem teto de 10,00.
            </p>
          </div>
        )
      )}

      {/* Tab Content 2: Escalação (Lineup) */}
      {activeTab === 'lineup' && (
        <ClubLineupTab club={club} onLineupUpdated={fetchClub} />
      )}

      {/* Tab Content 3: Histórico (Transactions) */}
      {activeTab === 'history' && (
        <ClubTransactionsTab clubId={club.id} club={club} />
      )}

      {/* Buy & Sell Modals */}
      <BuyPlayerModal
        isOpen={isBuyOpen}
        onClose={() => setIsBuyOpen(false)}
        club={club}
        onSuccess={() => {
          fetchClub();
        }}
      />

      <SellPlayerModal
        isOpen={Boolean(sellingPlayer)}
        player={sellingPlayer}
        club={club}
        onClose={() => setSellingPlayer(null)}
        onViewHistory={() => {
          setSellingPlayer(null);
          handleTabClick('history');
        }}
        onSuccess={() => fetchClub()}
      />
    </div>
  );
};
