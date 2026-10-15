import React, { useState, useEffect, useCallback } from 'react';
import { api, getApiErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { TransactionsListResponse, Transaction } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { TableSkeleton } from '../common/Skeleton';
import { EmptyState } from '../common/EmptyState';
import { 
  Download, 
  ArrowUpRight, 
  ArrowDownRight, 
  Receipt, 
  TrendingUp, 
  ShieldAlert 
} from 'lucide-react';

interface ClubTransactionsTabProps {
  clubId: number;
}

export const ClubTransactionsTab: React.FC<ClubTransactionsTabProps> = ({ clubId }) => {
  const { showToast } = useToast();
  const [data, setData] = useState<TransactionsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [playerFilter, setPlayerFilter] = useState('');

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (typeFilter) params.type = typeFilter;
      if (playerFilter) params.player_id = playerFilter;

      const resp = await api.get<TransactionsListResponse>(`/clubs/${clubId}/transactions`, { params });
      setData(resp.data);
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [clubId, typeFilter, playerFilter, showToast]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleExportCsv = async () => {
    setDownloading(true);
    try {
      const params: Record<string, string> = {};
      if (typeFilter) params.type = typeFilter;
      if (playerFilter) params.player_id = playerFilter;

      const resp = await api.get<string>(`/clubs/${clubId}/transactions/export`, {
        params,
        responseType: 'blob' as unknown as 'json',
      });

      const blob = new Blob([resp.data as unknown as BlobPart], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transacoes_clube_${clubId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      showToast('success', 'Relatório CSV exportado com sucesso!');
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    } finally {
      setDownloading(false);
    }
  };

  // Distinct players for filter
  const distinctPlayers = Array.from(
    new Map(data?.data.map((t) => [t.player_id, t.player_name]) || []).entries()
  );

  return (
    <div className="space-y-6">
      {/* Top Filter & Export Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-[#E4E4E7] p-4 rounded-xl shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg px-3 py-2 text-xs text-zinc-800 focus:outline-none focus:border-[#155DFC] focus:bg-white"
            >
              <option value="">Todos os Tipos</option>
              <option value="COMPRA">Apenas Compras</option>
              <option value="VENDA">Apenas Vendas</option>
            </select>
          </div>

          <div>
            <select
              value={playerFilter}
              onChange={(e) => setPlayerFilter(e.target.value)}
              className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg px-3 py-2 text-xs text-zinc-800 focus:outline-none focus:border-[#155DFC] focus:bg-white"
            >
              <option value="">Todos os Atletas</option>
              {distinctPlayers.map(([pid, pname]) => (
                <option key={pid} value={pid}>
                  {pname}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleExportCsv}
          disabled={downloading || !data?.data.length}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-700 rounded-lg border border-[#E4E4E7] text-xs font-semibold shadow-2xs transition active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          {downloading ? 'Gerando CSV...' : 'Exportar CSV'}
        </button>
      </div>

      {/* Financial Summary Cards */}
      {data?.summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-white border border-[#E4E4E7] rounded-xl p-4 space-y-1 shadow-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#686872] flex items-center gap-1.5">
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" /> Total Gasto
            </span>
            <div className="text-base sm:text-lg font-mono font-bold text-zinc-900">
              {formatCurrency(data.summary.total_spent)}
            </div>
          </div>

          <div className="bg-white border border-[#E4E4E7] rounded-xl p-4 space-y-1 shadow-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#686872] flex items-center gap-1.5">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" /> Total Recebido
            </span>
            <div className="text-base sm:text-lg font-mono font-bold text-emerald-600">
              {formatCurrency(data.summary.total_received)}
            </div>
          </div>

          <div className="bg-white border border-[#E4E4E7] rounded-xl p-4 space-y-1 shadow-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#686872] flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-[#155DFC]" /> Taxas Pagas
            </span>
            <div className="text-base sm:text-lg font-mono font-bold text-[#155DFC]">
              {formatCurrency(data.summary.total_fees)}
            </div>
          </div>

          <div className="bg-white border border-[#E4E4E7] rounded-xl p-4 space-y-1 shadow-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#686872] flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Multas Pagas
            </span>
            <div className="text-base sm:text-lg font-mono font-bold text-amber-600">
              {formatCurrency(data.summary.total_penalties)}
            </div>
          </div>

          <div className="col-span-2 lg:col-span-1 bg-white border border-[#E4E4E7] rounded-xl p-4 space-y-1 shadow-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#686872] flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Lucro Líquido
            </span>
            <div className="text-base sm:text-lg font-mono font-bold text-emerald-600">
              {formatCurrency(data.summary.total_profit)}
            </div>
          </div>
        </div>
      )}

      {/* Transactions Data Table */}
      <div className="bg-white border border-[#E4E4E7] rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <TableSkeleton rows={5} cols={8} />
        ) : !data || data.data.length === 0 ? (
          <EmptyState
            title="Nenhuma transação registrada"
            description="Este clube ainda não realizou compras ou vendas de atletas."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-zinc-800">
              <thead className="bg-[#FAFAFA] border-b border-[#E4E4E7] text-[11px] uppercase tracking-wider text-[#686872] font-semibold select-none">
                <tr>
                  <th className="py-3 px-4">Data / Hora</th>
                  <th className="py-3 px-3">Tipo</th>
                  <th className="py-3 px-4">Jogador</th>
                  <th className="py-3 px-3 text-right">Valor</th>
                  <th className="py-3 px-3 text-right">Taxa / Com.</th>
                  <th className="py-3 px-3 text-right">Multa</th>
                  <th className="py-3 px-3 text-right">Lucro</th>
                  <th className="py-3 px-4 text-right">Variação de Caixa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E4E7] font-normal">
                {data.data.map((tx: Transaction) => (
                  <tr key={tx.id} className="hover:bg-zinc-50/80 transition">
                    <td className="py-3 px-4 text-xs font-mono text-[#686872]">
                      {formatDateTime(tx.created_at)}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          tx.type === 'COMPRA'
                            ? 'bg-[#EFF6FF] text-[#1447E6] border-blue-200'
                            : 'bg-[#F0FDF4] text-[#016630] border-[#B9F8CF]'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-semibold text-zinc-900">{tx.player_name}</td>

                    <td className="py-3 px-3 text-right font-mono text-zinc-700">
                      {formatCurrency(tx.value)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-[#686872]">
                      {tx.fee > 0 ? formatCurrency(tx.fee) : '-'}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-[#686872]">
                      {tx.penalty > 0 ? formatCurrency(tx.penalty) : '-'}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-[#686872]">
                      {tx.profit !== null && tx.profit !== undefined ? formatCurrency(tx.profit) : '-'}
                    </td>

                    <td
                      className={`py-3 px-4 text-right font-mono font-bold ${
                        tx.cash_change >= 0 ? 'text-emerald-600' : 'text-[#9F0A0A]'
                      }`}
                    >
                      {tx.cash_change >= 0 ? `+ ${formatCurrency(tx.cash_change)}` : formatCurrency(tx.cash_change)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
