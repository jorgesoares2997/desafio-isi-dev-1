import React, { useState, useEffect, useCallback } from 'react';
import { api, getApiErrorMessage } from '../../services/api';
import { Club, MatchSummary } from '../../types';
import { useToast } from '../../context/ToastContext';
import { formatDateTime } from '../../utils/formatters';
import { Swords, Plus, Shield, ChevronRight, RotateCw } from 'lucide-react';
import { EmptyState, ServerOff } from '../common/EmptyState';
import { TableSkeleton } from '../common/Skeleton';

interface MatchesListViewProps {
  clubs: Club[];
  onOpenNewMatch: () => void;
  onSelectMatch: (matchId: number) => void;
  refreshTrigger?: number;
}

export const MatchesListView: React.FC<MatchesListViewProps> = ({
  clubs,
  onOpenNewMatch,
  onSelectMatch,
  refreshTrigger = 0,
}) => {
  const { showToast } = useToast();
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedClubFilter, setSelectedClubFilter] = useState<string>('all');

  // Helper to find club acronym
  const getClubAcronym = (clubId: number, clubName: string) => {
    const found = clubs.find((c) => c.id === clubId);
    if (found?.acronym) return found.acronym;
    return clubName.slice(0, 3).toUpperCase();
  };

  // Fetch matches
  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const params = selectedClubFilter !== 'all' ? { club_id: selectedClubFilter } : undefined;
      const res = await api.get<MatchSummary[]>('/matches', { params });
      setMatches(res.data);
      setLoadError(null);
    } catch (err) {
      const msg = getApiErrorMessage(err);
      setLoadError(msg);
      showToast('error', msg);
    } finally {
      setLoading(false);
    }
  }, [selectedClubFilter, showToast]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches, refreshTrigger]);

  const latestMatch = matches.length > 0 ? matches[0] : null;

  const getResultLabel = (homeGoals: number, awayGoals: number) => {
    if (homeGoals > awayGoals) return 'Vitória do mandante';
    if (awayGoals > homeGoals) return 'Vitória do visitante';
    return 'Empate';
  };

  const formatWithComma = (isoString: string) => {
    const raw = formatDateTime(isoString);
    if (!raw.includes(',')) {
      return raw.replace(' ', ', ');
    }
    return raw;
  };

  return (
    <div className="space-y-6">
      {/* Header da Página (Figma Screenshot 1) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl border border-blue-200 bg-blue-50/70 flex items-center justify-center text-[#155DFC] shrink-0">
            <Swords className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Partidas
            </h1>
            <p className="text-xs text-[#686872] mt-0.5">
              Jogue partidas entre clubes com os 5 titulares escalados e acompanhe o histórico.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenNewMatch}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#155DFC] hover:bg-[#1447E6] text-white text-xs font-semibold shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Nova partida
        </button>
      </div>

      {loadError && matches.length === 0 ? (
        <div className="bg-white border border-[#E4E4E7] rounded-2xl p-16 shadow-xs flex flex-col items-center justify-center text-center min-h-[380px]">
          <EmptyState
            icon={ServerOff}
            title="Não foi possível carregar as partidas"
            description={loadError || 'Tente de novo. Se a API respondeu, mostre o message dela.'}
            action={{
              label: 'Tentar de novo',
              onClick: fetchMatches,
              icon: RotateCw,
            }}
            className="py-0 px-0"
          />
        </div>
      ) : loading && matches.length === 0 ? (
        <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-600 mb-4">
            <RotateCw className="w-4 h-4 animate-spin text-zinc-500" />
            <span>Carregando partidas...</span>
          </div>
          <TableSkeleton rows={5} cols={6} />
        </div>
      ) : matches.length === 0 && selectedClubFilter === 'all' ? (
        /* Image 1: Exact Empty State */
        <div className="space-y-4">
          <div className="bg-white border border-[#E4E4E7] rounded-2xl p-16 shadow-xs flex flex-col items-center justify-center text-center min-h-[380px]">
            <EmptyState
              icon={Swords}
              title="Nenhuma partida jogada"
              description="Escale os 5 titulares de dois clubes e jogue a primeira partida. O resultado aparece aqui e na classificação."
              action={{
                label: 'Nova partida',
                onClick: onOpenNewMatch,
                icon: Plus,
              }}
              className="py-0 px-0"
            />
          </div>
          <p className="text-xs text-[#686872] px-1">
            Nenhuma partida jogada ainda. A classificação continua com todos os clubes, zerados.
          </p>
        </div>
      ) : (
        <>
          {/* Seção 1: Última partida */}
          <div>
            <h2 className="text-xs font-bold text-zinc-900 mb-2">
              Última partida
            </h2>

            {latestMatch ? (
              <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Lado Esquerdo / Mandante */}
                <div className="flex-1 text-center md:text-right flex items-center justify-center md:justify-end gap-3">
                  <div>
                    <span className="font-bold text-base text-zinc-900">
                      {latestMatch.home.club_name}
                    </span>
                    <p className="text-xs text-[#686872] mt-0.5">
                      Mandante
                    </p>
                  </div>
                  <span className="bg-zinc-100 border border-[#E4E4E7] text-zinc-700 rounded-lg px-2 py-0.5 text-xs font-mono font-semibold">
                    {getClubAcronym(latestMatch.home.club_id, latestMatch.home.club_name)}
                  </span>
                </div>

                {/* Centro: Placar & Data & Resultado */}
                <div className="flex flex-col items-center justify-center shrink-0 px-4 md:px-8">
                  <div className="bg-zinc-100/90 border border-[#E4E4E7] rounded-xl px-4 py-1.5 font-bold text-xl text-zinc-900 font-sans tracking-wider">
                    {latestMatch.home.goals} × {latestMatch.away.goals}
                  </div>
                  <span className="text-xs text-[#686872] font-mono mt-1.5">
                    {formatWithComma(latestMatch.played_at)}
                  </span>
                  <span className="mt-1 bg-zinc-50 border border-[#E4E4E7] text-zinc-600 rounded-full px-3 py-0.5 text-xs font-medium">
                    {getResultLabel(latestMatch.home.goals, latestMatch.away.goals)}
                  </span>
                </div>

                {/* Lado Direito / Visitante */}
                <div className="flex-1 text-center md:text-left flex items-center justify-center md:justify-start gap-3">
                  <span className="bg-zinc-100 border border-[#E4E4E7] text-zinc-700 rounded-lg px-2 py-0.5 text-xs font-mono font-semibold">
                    {getClubAcronym(latestMatch.away.club_id, latestMatch.away.club_name)}
                  </span>
                  <div>
                    <span className="font-bold text-base text-zinc-900">
                      {latestMatch.away.club_name}
                    </span>
                    <p className="text-xs text-[#686872] mt-0.5">
                      Visitante
                    </p>
                  </div>
                </div>

                {/* Botão Ver duelos */}
                <div className="md:border-l md:border-[#E4E4E7] md:pl-6 shrink-0">
                  <button
                    onClick={() => onSelectMatch(latestMatch.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E4E4E7] bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
                  >
                    <span>Ver duelos</span>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-[#E4E4E7] rounded-2xl p-8 text-center text-xs text-[#686872] shadow-xs">
                Nenhuma partida encontrada para este filtro.
              </div>
            )}
          </div>

          {/* Seção 2: Histórico de partidas */}
          <div className="bg-white border border-[#E4E4E7] rounded-2xl shadow-xs overflow-hidden">
            {/* Card Header com Filtro de Clube */}
            <div className="p-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-zinc-900">
                  Histórico de partidas
                </h2>
                <p className="text-xs text-[#686872] mt-0.5">
                  Da mais recente para a mais antiga.
                </p>
              </div>

              {/* Select de Filtro por Clube com Ícone de Escudo */}
              <div className="relative border border-[#E4E4E7] rounded-xl px-3 py-1.5 bg-white flex items-center gap-2 hover:border-zinc-300 focus-within:border-[#155DFC] transition self-start sm:self-auto min-w-[180px]">
                <Shield className="w-4 h-4 text-[#686872] shrink-0" />
                <select
                  value={selectedClubFilter}
                  onChange={(e) => setSelectedClubFilter(e.target.value)}
                  className="w-full text-xs font-medium text-zinc-700 bg-transparent focus:outline-none cursor-pointer appearance-none pr-5"
                >
                  <option value="all">Clube: todos</option>
                  {clubs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-[10px]">
                  ▼
                </div>
              </div>
            </div>

            {/* Tabela do Histórico */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-t border-b border-[#E4E4E7] text-[#686872] font-semibold bg-white">
                    <th className="py-3 px-6">Data e hora</th>
                    <th className="py-3 px-6">Mandante</th>
                    <th className="py-3 px-6 text-center">Placar</th>
                    <th className="py-3 px-6">Visitante</th>
                    <th className="py-3 px-6 text-center">Resultado</th>
                    <th className="py-3 px-6 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E4E7]">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#686872] text-xs">
                        Carregando partidas...
                      </td>
                    </tr>
                  ) : matches.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#686872] text-xs">
                        Nenhuma partida encontrada no histórico.
                      </td>
                    </tr>
                  ) : (
                    matches.map((m) => {
                      const homeAcr = getClubAcronym(m.home.club_id, m.home.club_name);
                      const awayAcr = getClubAcronym(m.away.club_id, m.away.club_name);

                      return (
                        <tr key={m.id} className="hover:bg-zinc-50/50 transition">
                          <td className="py-3.5 px-6 text-[#686872] font-mono whitespace-nowrap">
                            {formatDateTime(m.played_at)}
                          </td>
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-zinc-900">
                                {m.home.club_name}
                              </span>
                              <span className="bg-zinc-100 border border-[#E4E4E7] text-zinc-700 rounded-md px-1.5 py-0.5 text-[10px] font-mono font-semibold">
                                {homeAcr}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-6 text-center">
                            <span className="inline-block bg-zinc-100 border border-[#E4E4E7] text-zinc-900 font-bold font-mono rounded-lg px-2.5 py-0.5 text-xs">
                              {m.home.goals} × {m.away.goals}
                            </span>
                          </td>
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-2">
                              <span className="bg-zinc-100 border border-[#E4E4E7] text-zinc-700 rounded-md px-1.5 py-0.5 text-[10px] font-mono font-semibold">
                                {awayAcr}
                              </span>
                              <span className="font-semibold text-zinc-900">
                                {m.away.club_name}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-6 text-center">
                            <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-medium bg-zinc-50 border border-[#E4E4E7] text-zinc-700">
                              {getResultLabel(m.home.goals, m.away.goals)}
                            </span>
                          </td>
                          <td className="py-3.5 px-6 text-right">
                            <button
                              onClick={() => onSelectMatch(m.id)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-700 hover:text-[#155DFC] transition cursor-pointer"
                            >
                              <span>Ver duelos</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Rodapé do Card com Contador */}
            <div className="px-6 py-3.5 border-t border-[#E4E4E7] bg-white text-xs text-[#686872]">
              {matches.length} {matches.length === 1 ? 'partida' : 'partidas'}
            </div>
          </div>

          {/* Nota de Rodapé Explicativa (Figma Screenshot 1) */}
          <p className="text-xs text-[#686872] px-1">
            Partidas da mais recente para a mais antiga, com filtro por clube. “Ver duelos” abre a partida.
          </p>
        </>
      )}
    </div>
  );
};
