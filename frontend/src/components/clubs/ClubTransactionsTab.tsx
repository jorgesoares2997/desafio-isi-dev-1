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
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl shadow-xl">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
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
              className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
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
          className="flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-100 rounded-xl border border-zinc-700 text-xs font-semibold transition active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          {downloading ? 'Gerando CSV...' : 'Exportar CSV'}
        </button>
      </div>

      {/* Financial Summary Cards */}
      {data?.summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" /> Total Gasto
            </span>
            <div className="text-base sm:text-lg font-mono font-bold text-white">
              {formatCurrency(data.summary.total_spent)}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" /> Total Recebido
            </span>
            <div className="text-base sm:text-lg font-mono font-bold text-emerald-400">
              {formatCurrency(data.summary.total_received)}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-blue-400" /> Taxas Pagas
            </span>
            <div className="text-base sm:text-lg font-mono font-bold text-blue-400">
              {formatCurrency(data.summary.total_fees)}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> Multas Pagas
            </span>
            <div className="text-base sm:text-lg font-mono font-bold text-amber-400">
              {formatCurrency(data.summary.total_penalties)}
            </div>
          </div>

          <div className="col-span-2 lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-1">
            <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Lucro Líquido
            </span>
            <div className="text-base sm:text-lg font-mono font-bold text-emerald-300">
              {formatCurrency(data.summary.total_profit)}
            </div>
          </div>
        </div>
      )}

      {/* Transactions Data Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <TableSkeleton rows={5} cols={8} />
        ) : !data || data.data.length === 0 ? (
          <EmptyState
            title="Nenhuma transação registrada"
            description="Este clube ainda não realizou compras ou vendas de atletas."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-zinc-200">
              <thead className="bg-zinc-950/70 border-b border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-400 font-semibold select-none">
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
              <tbody className="divide-y divide-zinc-800/60 font-normal">
                {data.data.map((tx: Transaction) => (
                  <tr key={tx.id} className="hover:bg-zinc-800/30 transition">
                    <td className="py-3 px-4 text-xs font-mono text-zinc-400">
                      {formatDateTime(tx.created_at)}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          tx.type === 'COMPRA'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-medium text-white">{tx.player_name}</td>

                    <td className="py-3 px-3 text-right font-mono text-zinc-300">
                      {formatCurrency(tx.value)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-zinc-400">
                      {tx.fee > 0 ? formatCurrency(tx.fee) : '-'}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-zinc-400">
                      {tx.penalty > 0 ? formatCurrency(tx.penalty) : '-'}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-zinc-400">
                      {tx.profit !== null && tx.profit !== undefined ? formatCurrency(tx.profit) : '-'}
                    </td>

                    <td
                      className={`py-3 px-4 text-right font-mono font-bold ${
                        tx.cash_change >= 0 ? 'text-emerald-400' : 'text-rose-400'
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
