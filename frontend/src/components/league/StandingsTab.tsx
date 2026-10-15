import React, { useState, useEffect, useCallback } from 'react';
import { api, getApiErrorMessage } from '../../services/api';
import { Standing } from '../../types';
import { useToast } from '../../context/ToastContext';
import { Trophy, RefreshCw, Medal } from 'lucide-react';
import { Skeleton } from '../common/Skeleton';

interface StandingsTabProps {
  refreshTrigger?: number;
}

export const StandingsTab: React.FC<StandingsTabProps> = ({ refreshTrigger }) => {
  const { addToast } = useToast();
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStandings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Standing[]>('/standings');
      setStandings(res.data);
    } catch (err) {
      addToast('error', getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchStandings();
  }, [fetchStandings, refreshTrigger]);

  const getPositionBadge = (pos: number) => {
    if (pos === 1) {
      return (
        <span className="inline-flex items-center gap-1 font-bold text-amber-600">
          <Medal className="w-4 h-4 text-amber-500 fill-amber-500" /> 1º
        </span>
      );
    }
    if (pos === 2) {
      return (
        <span className="inline-flex items-center gap-1 font-bold text-zinc-600">
          <Medal className="w-4 h-4 text-zinc-400 fill-zinc-400" /> 2º
        </span>
      );
    }
    if (pos === 3) {
      return (
        <span className="inline-flex items-center gap-1 font-bold text-amber-700">
          <Medal className="w-4 h-4 text-amber-700 fill-amber-700" /> 3º
        </span>
      );
    }
    return <span className="font-mono text-[#686872]">{pos}º</span>;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E4E4E7] rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-semibold text-zinc-900 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Tabela de Classificação Oficial (RN21)
            </h3>
            <p className="text-xs text-[#686872] mt-1">
              Critérios de desempate: Pontos (V=3, E=1, D=0) &gt; Saldo de Gols &gt; Gols Pró &gt; Ordem Alfabética (NFD).
            </p>
          </div>

          <button
            onClick={fetchStandings}
            disabled={loading}
            className="flex items-center gap-1.5 self-start sm:self-auto text-xs font-semibold bg-white hover:bg-zinc-50 active:scale-95 text-zinc-700 px-3.5 py-2 rounded-lg border border-[#E4E4E7] shadow-2xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#155DFC]' : ''}`} />
            Atualizar Tabela
          </button>
        </div>

        {/* Tabela de Classificação com Overflow horizontal interno */}
        <div className="overflow-x-auto rounded-lg border border-[#E4E4E7]">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-[#FAFAFA] text-[#686872] text-xs uppercase tracking-wider font-semibold border-b border-[#E4E4E7]">
              <tr>
                <th className="py-3 px-4 w-16 text-center">Pos</th>
                <th className="py-3 px-4">Clube</th>
                <th className="py-3 px-3 text-center" title="Jogos Disputados">J</th>
                <th className="py-3 px-3 text-center" title="Vitórias">V</th>
                <th className="py-3 px-3 text-center" title="Empates">E</th>
                <th className="py-3 px-3 text-center" title="Derrotas">D</th>
                <th className="py-3 px-3 text-center" title="Gols Pró">GP</th>
                <th className="py-3 px-3 text-center" title="Gols Contra">GC</th>
                <th className="py-3 px-3 text-center" title="Saldo de Gols">SG</th>
                <th className="py-3 px-4 text-center font-bold text-zinc-900" title="Pontos Ganhos">PTS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E4E7] bg-white">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-8 mx-auto" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="py-3 px-3"><Skeleton className="h-4 w-6 mx-auto" /></td>
                    <td className="py-3 px-3"><Skeleton className="h-4 w-6 mx-auto" /></td>
                    <td className="py-3 px-3"><Skeleton className="h-4 w-6 mx-auto" /></td>
                    <td className="py-3 px-3"><Skeleton className="h-4 w-6 mx-auto" /></td>
                    <td className="py-3 px-3"><Skeleton className="h-4 w-6 mx-auto" /></td>
                    <td className="py-3 px-3"><Skeleton className="h-4 w-6 mx-auto" /></td>
                    <td className="py-3 px-3"><Skeleton className="h-4 w-6 mx-auto" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-8 mx-auto" /></td>
                  </tr>
                ))
              ) : standings.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-[#686872] text-xs">
                    Nenhum clube classificado ou dados não disponíveis.
                  </td>
                </tr>
              ) : (
                standings.map((s) => (
                  <tr
                    key={s.club_id}
                    className={`transition hover:bg-zinc-50/80 ${
                      s.position === 1 ? 'bg-amber-50/40' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-center">
                      {getPositionBadge(s.position)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-zinc-900">
                      {s.club_name}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-zinc-700">
                      {s.played}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-emerald-600 font-semibold">
                      {s.wins}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-[#686872]">
                      {s.draws}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-rose-600">
                      {s.losses}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-zinc-700">
                      {s.goals_for}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-zinc-700">
                      {s.goals_against}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-medium">
                      <span className={s.goal_difference > 0 ? 'text-emerald-600 font-semibold' : s.goal_difference < 0 ? 'text-[#9F0A0A] font-semibold' : 'text-[#686872]'}>
                        {s.goal_difference > 0 ? `+${s.goal_difference}` : s.goal_difference}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-black text-[#155DFC] text-base bg-[#EFF6FF]/60">
                      {s.points}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
