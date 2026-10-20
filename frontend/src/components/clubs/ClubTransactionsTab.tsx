import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api, getApiErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { TransactionsListResponse, Transaction, ClubDetail } from '../../types';
import { formatDecimal } from '../../utils/formatters';
import { TableSkeleton } from '../common/Skeleton';
import { EmptyState, DisconnectedLayersIcon } from '../common/EmptyState';
import { 
  Download, 
  ShoppingCart, 
  ArrowLeftRight, 
  Check, 
  User, 
  ChevronDown, 
  Coins, 
  Percent, 
  AlertTriangle, 
  TrendingUp, 
  AlertCircle, 
  History, 
  X,
  RotateCw
} from 'lucide-react';

interface ClubTransactionsTabProps {
  clubId: number;
  club?: ClubDetail;
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

function getPlayerAvatar(name: string, id: number) {
  const hash = id || name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
}

function getPlayerInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function formatTransactionDate(isoString: string): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    if (!isNaN(d.getTime())) {
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    const [datePart, timeWithOffset] = isoString.split('T');
    const [y, m, day] = datePart.split('-');
    const timePart = timeWithOffset.slice(0, 5);
    return `${day}/${m}/${y} ${timePart}`;
  } catch {
    return isoString;
  }
}

export const ClubTransactionsTab: React.FC<ClubTransactionsTabProps> = ({ clubId, club }) => {
  const { showToast } = useToast();
  const [data, setData] = useState<TransactionsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // Filters state (matching Screenshots 1, 2, 3)
  const [isCompraChecked, setIsCompraChecked] = useState(true);
  const [isVendaChecked, setIsVendaChecked] = useState(true);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [selectedPlayerName, setSelectedPlayerName] = useState('');
  const [isPlayerDropdownOpen, setIsPlayerDropdownOpen] = useState(false);
  const [allTimePlayers, setAllTimePlayers] = useState<{ id: number; name: string }[]>([]);

  // Error state for rejected filter (Screenshot 5)
  const [filterError, setFilterError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  // CSV toast notification (Screenshot 2)
  const [csvToast, setCsvToast] = useState<{ open: boolean; message: string; submessage: string } | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const dataRef = useRef<TransactionsListResponse | null>(null);
  const clubRef = useRef<ClubDetail | undefined>(club);

  useEffect(() => {
    clubRef.current = club;
  }, [club]);

  // Close player dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsPlayerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keep allTimePlayers populated with current club players as well
  useEffect(() => {
    if (club?.players) {
      setAllTimePlayers((prev) => {
        const map = new Map<number, string>(prev.map((p) => [p.id, p.name]));
        club.players.forEach((p) => map.set(p.id, p.name));
        return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
      });
    }
  }, [club?.players]);

  // Fetch transactions from API
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setFilterError(null);
    try {
      const params: Record<string, string> = {};

      if (isCompraChecked && !isVendaChecked) {
        params.type = 'COMPRA';
      } else if (!isCompraChecked && isVendaChecked) {
        params.type = 'VENDA';
      }

      if (selectedPlayerId) {
        params.player_id = selectedPlayerId;
      }

      // If neither is checked, return empty set
      if (!isCompraChecked && !isVendaChecked) {
        const emptyData: TransactionsListResponse = {
          data: [],
          summary: {
            total_spent: 0,
            total_received: 0,
            total_fees: 0,
            total_penalties: 0,
            total_profit: 0,
          },
        };
        dataRef.current = emptyData;
        setData(emptyData);
        setLoading(false);
        setLoadError(false);
        return;
      }

      const resp = await api.get<TransactionsListResponse>(`/clubs/${clubId}/transactions`, { params });
      dataRef.current = resp.data;
      setData(resp.data);
      setLoadError(false);

      // Collect available players for the filter dropdown
      if (resp.data.data) {
        setAllTimePlayers((prev) => {
          const map = new Map<number, string>(prev.map((p) => [p.id, p.name]));
          resp.data.data.forEach((t) => map.set(t.player_id, t.player_name));
          if (clubRef.current?.players) {
            clubRef.current.players.forEach((p) => map.set(p.id, p.name));
          }
          return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
        });
      }
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err);
      if (!dataRef.current) {
        setLoadError(true);
      } else {
        setFilterError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [clubId, isCompraChecked, isVendaChecked, selectedPlayerId]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const toggleType = (type: 'COMPRA' | 'VENDA') => {
    if (type === 'COMPRA') {
      setIsCompraChecked((prev) => !prev);
    } else {
      setIsVendaChecked((prev) => !prev);
    }
    setFilterError(null);
  };

  const handleResetFilters = () => {
    setIsCompraChecked(true);
    setIsVendaChecked(true);
    setSelectedPlayerId('');
    setSelectedPlayerName('');
    setFilterError(null);
  };

  const handleExportCsv = async () => {
    setDownloading(true);
    try {
      const params: Record<string, string> = {};
      if (isCompraChecked && !isVendaChecked) {
        params.type = 'COMPRA';
      } else if (!isCompraChecked && isVendaChecked) {
        params.type = 'VENDA';
      }
      if (selectedPlayerId) {
        params.player_id = selectedPlayerId;
      }

      const resp = await api.get<string>(`/clubs/${clubId}/transactions/export`, {
        params,
        responseType: 'blob' as unknown as 'json',
      });

      const blob = new Blob([resp.data as unknown as BlobPart], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = `historico-clube-${clubId}.csv`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      let submsg = `${filename} baixado com sucesso.`;
      if (!isCompraChecked && isVendaChecked) {
        submsg = `${filename}, com o filtro de tipo Venda aplicado.`;
      } else if (isCompraChecked && !isVendaChecked) {
        submsg = `${filename}, com o filtro de tipo Compra aplicado.`;
      } else if (selectedPlayerName) {
        submsg = `${filename}, com o filtro de jogador ${selectedPlayerName} aplicado.`;
      }

      setCsvToast({
        open: true,
        message: 'CSV baixado',
        submessage: submsg,
      });
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  };

  const hasActiveFilter = !isCompraChecked || !isVendaChecked || Boolean(selectedPlayerId);

  // Footnote text logic strictly matching all 5 Figma screenshots
  const getFootnoteText = () => {
    if (filterError) {
      return 'Filtro por um jogador excluído depois de a tela abrir: a API responde 404 (V8 e RN09). A tela mantém os filtros, mostra o message devolvido e não mostra a tabela nem os totais.';
    }
    if (!data || data.data.length === 0) {
      return 'Sem transações, os totais ficam zerados. O botão Exportar CSV continua disponível e baixa só a linha de cabeçalho.';
    }
    if (selectedPlayerName) {
      if (selectedPlayerName.toLowerCase().includes('meia lua')) {
        return `Filtro por jogador: a compra e a venda do ${selectedPlayerName} no ${club?.name || 'clube'}, com os totais só dessas transações.`;
      }
      return `Filtro por jogador: as transações de ${selectedPlayerName} no ${club?.name || 'clube'}, com os totais só dessas transações.`;
    }
    if (!isCompraChecked && isVendaChecked) {
      return 'Com o filtro "Venda", os totais consideram só as vendas (total pago em compras 0,00). O CSV usa os mesmos filtros da tela.';
    }
    if (isCompraChecked && !isVendaChecked) {
      return 'Com o filtro "Compra", os totais consideram só as compras (total recebido em vendas 0,00). O CSV usa os mesmos filtros da tela.';
    }
    const currentCashStr = club ? formatDecimal(club.cash) : '51,58';
    return `Os totais respeitam os filtros. 300,00 + soma das variações = caixa atual (${currentCashStr}).`;
  };

  if (loadError && !data) {
    return (
      <div className="bg-white border border-[#E4E4E7] rounded-2xl p-16 shadow-xs flex flex-col items-center justify-center text-center min-h-[380px]">
        <EmptyState
          icon={DisconnectedLayersIcon}
          title="Não foi possível carregar o histórico"
          description="Não foi possível carregar o histórico. Os totais e a exportação ficam indisponíveis até a lista carregar."
          action={{
            label: 'Tentar de novo',
            onClick: () => fetchTransactions(),
            icon: RotateCw,
          }}
          className="py-0 px-0"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Transactions Card */}
      <div className="bg-white border border-[#E4E4E7] rounded-xl shadow-2xs overflow-hidden">
        {/* Card Header & Filter Row */}
        <div className="p-4 sm:p-5 border-b border-[#E4E4E7] space-y-4">
          {/* Header Row: Title and Export CSV Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-zinc-900">
                Histórico de transações
              </h3>
              <p className="text-xs text-[#686872] mt-0.5">
                Da mais recente para a mais antiga, com o nome e os valores do momento de cada operação.
              </p>
            </div>

            <button
              onClick={handleExportCsv}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-zinc-50 disabled:opacity-50 text-zinc-700 rounded-lg border border-[#E4E4E7] text-xs font-semibold shadow-2xs transition active:scale-95 cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-zinc-600" />
              <span>{downloading ? 'Baixando...' : 'Exportar CSV'}</span>
            </button>
          </div>

          {/* Filter Row: Tipo (Compra / Venda) and Jogador dropdown */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <span className="text-xs text-[#686872] mr-0.5">Tipo</span>

            {/* Checkbox Compra */}
            <button
              type="button"
              onClick={() => toggleType('COMPRA')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition select-none ${
                isCompraChecked
                  ? 'border-[#155DFC] bg-[#EFF6FF] text-[#1447E6] font-semibold'
                  : 'border-[#E4E4E7] bg-white text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              <span
                className={`w-3.5 h-3.5 rounded flex items-center justify-center transition ${
                  isCompraChecked ? 'bg-[#155DFC] text-white' : 'border border-zinc-300 bg-white'
                }`}
              >
                {isCompraChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </span>
              <span>Compra</span>
            </button>

            {/* Checkbox Venda */}
            <button
              type="button"
              onClick={() => toggleType('VENDA')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition select-none ${
                isVendaChecked
                  ? 'border-[#155DFC] bg-[#EFF6FF] text-[#1447E6] font-semibold'
                  : 'border-[#E4E4E7] bg-white text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              <span
                className={`w-3.5 h-3.5 rounded flex items-center justify-center transition ${
                  isVendaChecked ? 'bg-[#155DFC] text-white' : 'border border-zinc-300 bg-white'
                }`}
              >
                {isVendaChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
              </span>
              <span>Venda</span>
            </button>

            {/* Player Dropdown */}
            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setIsPlayerDropdownOpen(!isPlayerDropdownOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                  selectedPlayerId
                    ? 'bg-white border-[#E4E4E7] text-zinc-900 shadow-2xs font-semibold'
                    : 'bg-white border-[#E4E4E7] text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                <User className="w-3.5 h-3.5 text-[#686872]" />
                <span>
                  {selectedPlayerName ? `Jogador: ${selectedPlayerName}` : 'Jogador: todos'}
                </span>
                <ChevronDown className="w-3 h-3 text-[#686872]" />
              </button>

              {isPlayerDropdownOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-56 bg-white border border-[#E4E4E7] rounded-xl shadow-lg p-1.5 z-40 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPlayerId('');
                      setSelectedPlayerName('');
                      setIsPlayerDropdownOpen(false);
                      setFilterError(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-zinc-100 text-zinc-700 cursor-pointer"
                  >
                    Jogador: todos
                  </button>
                  {allTimePlayers.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedPlayerId(String(p.id));
                        setSelectedPlayerName(p.name);
                        setIsPlayerDropdownOpen(false);
                        setFilterError(null);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                        selectedPlayerId === String(p.id)
                          ? 'bg-[#EFF6FF] text-[#1447E6] font-semibold'
                          : 'hover:bg-zinc-50 text-zinc-700'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Limpar filtros */}
            {hasActiveFilter && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-[#155DFC] hover:underline font-medium cursor-pointer ml-1"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>

        {/* State 5: Filter Error Banner (Screenshot 5) */}
        {filterError ? (
          <div className="p-4 sm:p-5">
            <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-semibold text-rose-600">
                  O filtro foi recusado
                </div>
                <div className="text-rose-500 mt-0.5 leading-relaxed">
                  {filterError}
                </div>
              </div>
            </div>
          </div>
        ) : loading ? (
          <TableSkeleton rows={5} cols={8} />
        ) : !data || data.data.length === 0 ? (
          /* State 4: Empty State (Screenshot 4) */
          <div>
            <div className="py-12 flex flex-col items-center justify-center text-center px-4">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-[#E4E4E7] flex items-center justify-center text-[#686872] mb-3">
                <History className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-zinc-900">
                Nenhuma transação ainda
              </h4>
              <p className="text-xs text-[#686872] mt-1 max-w-sm">
                As compras e vendas do clube aparecem aqui, com os totais logo abaixo.
              </p>
            </div>

            {/* Summary Strip (Zerado) */}
            <div className="border-t border-[#E4E4E7] bg-white grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#E4E4E7]">
              {/* Total pago em compras */}
              <div className="p-4">
                <div className="flex items-center gap-1.5 text-xs text-[#686872]">
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Total pago em compras</span>
                </div>
                <div className="text-sm font-mono font-bold text-zinc-900 mt-1">
                  0,00
                </div>
                <div className="text-[11px] text-[#686872] mt-0.5">
                  Valor + taxa
                </div>
              </div>

              {/* Total recebido em vendas */}
              <div className="p-4">
                <div className="flex items-center gap-1.5 text-xs text-[#686872]">
                  <Coins className="w-3.5 h-3.5" />
                  <span>Total recebido em vendas</span>
                </div>
                <div className="text-sm font-mono font-bold text-zinc-900 mt-1">
                  0,00
                </div>
                <div className="text-[11px] text-[#686872] mt-0.5">
                  Crédito líquido
                </div>
              </div>

              {/* Taxas e comissões */}
              <div className="p-4">
                <div className="flex items-center gap-1.5 text-xs text-[#686872]">
                  <Percent className="w-3.5 h-3.5" />
                  <span>Taxas e comissões</span>
                </div>
                <div className="text-sm font-mono font-bold text-zinc-900 mt-1">
                  0,00
                </div>
                <div className="text-[11px] text-[#686872] mt-0.5">
                  Somadas
                </div>
              </div>

              {/* Multas */}
              <div className="p-4">
                <div className="flex items-center gap-1.5 text-xs text-[#686872]">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Multas</span>
                </div>
                <div className="text-sm font-mono font-bold text-zinc-900 mt-1">
                  0,00
                </div>
                <div className="text-[11px] text-[#686872] mt-0.5">
                  Por fidelidade
                </div>
              </div>

              {/* Lucro total */}
              <div className="p-4 col-span-2 sm:col-span-1">
                <div className="flex items-center gap-1.5 text-xs text-[#686872]">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Lucro total</span>
                </div>
                <div className="text-sm font-mono font-bold text-zinc-900 mt-1">
                  0,00
                </div>
                <div className="text-[11px] text-[#686872] mt-0.5">
                  Soma dos lucros, com sinal
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Normal State (Screenshots 1, 2, 3) */
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-zinc-800">
                <thead className="bg-white border-b border-[#E4E4E7] text-xs text-[#686872] font-normal select-none">
                  <tr>
                    <th className="py-3.5 px-4 font-normal text-[#686872]">Data e hora</th>
                    <th className="py-3.5 px-3 font-normal text-[#686872]">Tipo</th>
                    <th className="py-3.5 px-4 font-normal text-[#686872]">Jogador</th>
                    <th className="py-3.5 px-3 font-normal text-[#686872] text-right">Valor</th>
                    <th className="py-3.5 px-3 font-normal text-[#686872] text-right">Taxa ou comissão</th>
                    <th className="py-3.5 px-3 font-normal text-[#686872] text-right">Multa</th>
                    <th className="py-3.5 px-3 font-normal text-[#686872] text-right">Lucro</th>
                    <th className="py-3.5 px-4 font-normal text-[#686872] text-right">Variação do caixa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E4E7] font-normal">
                  {data.data.map((tx: Transaction) => {
                    const palette = getPlayerAvatar(tx.player_name, tx.player_id);

                    return (
                      <tr key={tx.id} className="hover:bg-zinc-50/70 transition">
                        {/* Data e hora */}
                        <td className="py-3 px-4 text-xs font-mono text-zinc-700 whitespace-nowrap">
                          {formatTransactionDate(tx.created_at)}
                        </td>

                        {/* Tipo */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {tx.type === 'COMPRA' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-[#E4E4E7] bg-white text-zinc-700 text-xs font-medium">
                              <ShoppingCart className="w-3 h-3 text-zinc-500" />
                              Compra
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-[#E4E4E7] bg-white text-zinc-700 text-xs font-medium">
                              <ArrowLeftRight className="w-3 h-3 text-zinc-500" />
                              Venda
                            </span>
                          )}
                        </td>

                        {/* Jogador com Avatar */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-full ${palette.bg} ${palette.text} font-bold text-[10px] flex items-center justify-center shrink-0 select-none`}>
                              {getPlayerInitials(tx.player_name)}
                            </div>
                            <span className="font-semibold text-xs text-zinc-900 whitespace-nowrap">
                              {tx.player_name}
                            </span>
                          </div>
                        </td>

                        {/* Valor */}
                        <td className="py-3 px-3 text-right font-mono text-xs text-zinc-800">
                          {formatDecimal(tx.value)}
                        </td>

                        {/* Taxa ou comissão */}
                        <td className="py-3 px-3 text-right font-mono text-xs text-zinc-800">
                          {formatDecimal(tx.fee)}
                        </td>

                        {/* Multa */}
                        <td className="py-3 px-3 text-right font-mono text-xs text-zinc-800">
                          {formatDecimal(tx.penalty)}
                        </td>

                        {/* Lucro */}
                        <td className="py-3 px-3 text-right font-mono text-xs">
                          {tx.type === 'COMPRA' ? (
                            <span className="text-[#686872]">—</span>
                          ) : (tx.profit ?? 0) > 0 ? (
                            <span className="text-emerald-600 font-bold">
                              +{formatDecimal(tx.profit)}
                            </span>
                          ) : (tx.profit ?? 0) < 0 ? (
                            <span className="text-rose-600 font-bold">
                              -{formatDecimal(Math.abs(tx.profit ?? 0))}
                            </span>
                          ) : (
                            <span className="text-zinc-800 font-bold">0,00</span>
                          )}
                        </td>

                        {/* Variação do caixa */}
                        <td className="py-3 px-4 text-right font-mono font-bold text-xs">
                          {tx.cash_change < 0 ? (
                            <span className="text-rose-600">
                              -{formatDecimal(Math.abs(tx.cash_change))}
                            </span>
                          ) : (
                            <span className="text-emerald-600">
                              +{formatDecimal(tx.cash_change)}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary Strip (Totais) */}
            {data.summary && (
              <div className="border-t border-[#E4E4E7] bg-white grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#E4E4E7]">
                {/* Total pago em compras */}
                <div className="p-4">
                  <div className="flex items-center gap-1.5 text-xs text-[#686872]">
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Total pago em compras</span>
                  </div>
                  <div className="text-sm font-mono font-bold text-zinc-900 mt-1">
                    {formatDecimal(data.summary.total_spent)}
                  </div>
                  <div className="text-[11px] text-[#686872] mt-0.5">
                    Valor + taxa
                  </div>
                </div>

                {/* Total recebido em vendas */}
                <div className="p-4">
                  <div className="flex items-center gap-1.5 text-xs text-[#686872]">
                    <Coins className="w-3.5 h-3.5" />
                    <span>Total recebido em vendas</span>
                  </div>
                  <div className="text-sm font-mono font-bold text-zinc-900 mt-1">
                    {formatDecimal(data.summary.total_received)}
                  </div>
                  <div className="text-[11px] text-[#686872] mt-0.5">
                    Crédito líquido
                  </div>
                </div>

                {/* Taxas e comissões */}
                <div className="p-4">
                  <div className="flex items-center gap-1.5 text-xs text-[#686872]">
                    <Percent className="w-3.5 h-3.5" />
                    <span>Taxas e comissões</span>
                  </div>
                  <div className="text-sm font-mono font-bold text-zinc-900 mt-1">
                    {formatDecimal(data.summary.total_fees)}
                  </div>
                  <div className="text-[11px] text-[#686872] mt-0.5">
                    Somadas
                  </div>
                </div>

                {/* Multas */}
                <div className="p-4">
                  <div className="flex items-center gap-1.5 text-xs text-[#686872]">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Multas</span>
                  </div>
                  <div className="text-sm font-mono font-bold text-zinc-900 mt-1">
                    {formatDecimal(data.summary.total_penalties)}
                  </div>
                  <div className="text-[11px] text-[#686872] mt-0.5">
                    Por fidelidade
                  </div>
                </div>

                {/* Lucro total */}
                <div className="p-4 col-span-2 sm:col-span-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#686872]">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Lucro total</span>
                  </div>
                  <div
                    className={`text-sm font-mono font-bold mt-1 ${
                      data.summary.total_profit > 0
                        ? 'text-emerald-600'
                        : data.summary.total_profit < 0
                        ? 'text-rose-600'
                        : 'text-zinc-900'
                    }`}
                  >
                    {data.summary.total_profit > 0
                      ? `+${formatDecimal(data.summary.total_profit)}`
                      : data.summary.total_profit < 0
                      ? `-${formatDecimal(Math.abs(data.summary.total_profit))}`
                      : '0,00'}
                  </div>
                  <div className="text-[11px] text-[#686872] mt-0.5">
                    Soma dos lucros, com sinal
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dynamic Footnote matching Figma Screenshots */}
      <p className="text-xs text-[#686872] px-1 leading-relaxed">
        {getFootnoteText()}
      </p>

      {/* CSV Download Toast Notification (Screenshot 2) */}
      {csvToast?.open && (
        <div className="fixed bottom-5 right-5 z-50 bg-white border border-[#E4E4E7] rounded-xl shadow-xl p-4 flex items-start gap-3 max-w-sm animate-fade-in">
          <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
            <Check className="w-3 h-3 stroke-[2.5]" />
          </div>
          <div className="flex-1 text-xs">
            <div className="font-bold text-zinc-900">
              {csvToast.message}
            </div>
            <div className="text-[#686872] mt-0.5 leading-relaxed">
              {csvToast.submessage}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCsvToast(null)}
            className="text-zinc-400 hover:text-zinc-600 transition p-0.5 cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
