import React, { useState, useEffect, useCallback } from 'react';
import { api, getApiErrorMessage } from '../../services/api';
import { Club, ClubDetail, LineupResponse, PlayerInClub } from '../../types';
import { getConditionBadgeClass, getPositionBadgeClass, formatConditionLabel } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { Shield, AlertTriangle, CheckCircle, Save, RefreshCw, UserX } from 'lucide-react';

interface FormationRequirement {
  gol: number;
  def: number; // ZAG or LAT
  mei: number;
  ata: number;
}

const FORMATION_REQUIREMENTS: Record<string, FormationRequirement> = {
  '3-1': { gol: 1, def: 3, mei: 0, ata: 1 },
  '2-2': { gol: 1, def: 2, mei: 0, ata: 2 },
  '2-1-1': { gol: 1, def: 2, mei: 1, ata: 1 },
  '1-2-1': { gol: 1, def: 1, mei: 2, ata: 1 },
};

export const LineupTab: React.FC = () => {
  const { addToast } = useToast();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);
  const [clubDetail, setClubDetail] = useState<ClubDetail | null>(null);
  const [lineup, setLineup] = useState<LineupResponse | null>(null);

  const [formation, setFormation] = useState<string>('3-1');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);

  const [loadingClubs, setLoadingClubs] = useState(false);
  const [loadingClubData, setLoadingClubData] = useState(false);
  const [saving, setSaving] = useState(false);

  // Carregar lista de clubes
  const fetchClubs = useCallback(async () => {
    setLoadingClubs(true);
    try {
      const res = await api.get<Club[]>('/clubs');
      setClubs(res.data);
      if (res.data.length > 0 && selectedClubId === null) {
        setSelectedClubId(res.data[0].id);
      }
    } catch (err) {
      addToast('error', getApiErrorMessage(err));
    } finally {
      setLoadingClubs(false);
    }
  }, [addToast, selectedClubId]);

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  // Carregar detalhes do clube e escalação ao mudar de clube
  useEffect(() => {
    if (!selectedClubId) return;

    let isMounted = true;
    const fetchClubInfo = async () => {
      setLoadingClubData(true);
      try {
        const [clubRes, lineupRes] = await Promise.all([
          api.get<ClubDetail>(`/clubs/${selectedClubId}`),
          api.get<LineupResponse>(`/clubs/${selectedClubId}/lineup`),
        ]);

        if (!isMounted) return;
        setClubDetail(clubRes.data);
        setLineup(lineupRes.data);

        if (lineupRes.data.formation && FORMATION_REQUIREMENTS[lineupRes.data.formation]) {
          setFormation(lineupRes.data.formation);
        }

        if (lineupRes.data.players && lineupRes.data.players.length > 0) {
          setSelectedPlayerIds(lineupRes.data.players.map((p) => p.id));
        } else {
          setSelectedPlayerIds([]);
        }
      } catch (err) {
        if (isMounted) {
          addToast('error', getApiErrorMessage(err));
        }
      } finally {
        if (isMounted) {
          setLoadingClubData(false);
        }
      }
    };

    fetchClubInfo();
    return () => {
      isMounted = false;
    };
  }, [selectedClubId, addToast]);

  // Contagem de posições dos jogadores selecionados
  const getSelectedCounts = () => {
    if (!clubDetail) return { gol: 0, def: 0, mei: 0, ata: 0, total: 0 };
    const selected = clubDetail.players.filter((p) => selectedPlayerIds.includes(p.id));

    let gol = 0;
    let def = 0;
    let mei = 0;
    let ata = 0;

    selected.forEach((p) => {
      const pos = p.position.toUpperCase();
      if (pos === 'GOL') gol++;
      else if (pos === 'ZAG' || pos === 'LAT') def++;
      else if (pos === 'MEI') mei++;
      else if (pos === 'ATA') ata++;
    });

    return { gol, def, mei, ata, total: selected.length };
  };

  const counts = getSelectedCounts();
  const req = FORMATION_REQUIREMENTS[formation] || { gol: 1, def: 3, mei: 0, ata: 1 };

  const isFormationSatisfied =
    counts.gol === req.gol &&
    counts.def === req.def &&
    counts.mei === req.mei &&
    counts.ata === req.ata &&
    counts.total === 5;

  const handleTogglePlayer = (player: PlayerInClub) => {
    if (player.condition === 'DOENTE') {
      addToast('error', 'Jogadores DOENTES não podem ser escalados (RN19).');
      return;
    }

    if (selectedPlayerIds.includes(player.id)) {
      setSelectedPlayerIds(selectedPlayerIds.filter((id) => id !== player.id));
    } else {
      if (selectedPlayerIds.length >= 5) {
        addToast('info', 'A escalação titular permite no máximo 5 jogadores.');
        return;
      }
      setSelectedPlayerIds([...selectedPlayerIds, player.id]);
    }
  };

  const handleSaveLineup = async () => {
    if (!selectedClubId) return;
    if (selectedPlayerIds.length !== 5) {
      addToast('error', 'Selecione exatamente 5 jogadores titulares.');
      return;
    }
    if (!isFormationSatisfied) {
      addToast('error', `A seleção atual não cumpre o esquema tático ${formation}.`);
      return;
    }

    setSaving(true);
    try {
      const res = await api.put<LineupResponse>(`/clubs/${selectedClubId}/lineup`, {
        formation,
        player_ids: selectedPlayerIds,
      });
      setLineup(res.data);
      addToast('success', 'Escalação tática atualizada com sucesso!');
    } catch (err) {
      addToast('error', getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  // Jogadores selecionados ordenados para exibição no campo tático
  const selectedPlayersList = clubDetail
    ? clubDetail.players.filter((p) => selectedPlayerIds.includes(p.id))
    : [];

  const golPlayers = selectedPlayersList.filter((p) => p.position === 'GOL');
  const defPlayers = selectedPlayersList.filter((p) => p.position === 'ZAG' || p.position === 'LAT');
  const meiPlayers = selectedPlayersList.filter((p) => p.position === 'MEI');
  const ataPlayers = selectedPlayersList.filter((p) => p.position === 'ATA');

  return (
    <div className="space-y-6">
      {/* Controles de Topo: Seleção de Clube e Esquema */}
      <div className="bg-white border border-[#E4E4E7] rounded-xl p-4 sm:p-6 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Seletor de Clube */}
          <div>
            <label htmlFor="club-select" className="block text-xs font-semibold uppercase tracking-wider text-[#686872] mb-2">
              Selecione o Clube
            </label>
            <select
              id="club-select"
              value={selectedClubId || ''}
              onChange={(e) => setSelectedClubId(Number(e.target.value))}
              disabled={loadingClubs || clubs.length === 0}
              className="w-full bg-[#FAFAFA] border border-[#E4E4E7] text-zinc-900 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#155DFC] focus:bg-white transition"
            >
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.acronym})
                </option>
              ))}
            </select>
          </div>

          {/* Seletor de Formação */}
          <div>
            <label htmlFor="formation-select" className="block text-xs font-semibold uppercase tracking-wider text-[#686872] mb-2">
              Esquema Tático
            </label>
            <select
              id="formation-select"
              value={formation}
              onChange={(e) => setFormation(e.target.value)}
              className="w-full bg-[#FAFAFA] border border-[#E4E4E7] text-zinc-900 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#155DFC] focus:bg-white transition"
            >
              <option value="3-1">3-1 (1 GOL, 3 DEF, 1 ATA)</option>
              <option value="2-2">2-2 (1 GOL, 2 DEF, 2 ATA)</option>
              <option value="2-1-1">2-1-1 (1 GOL, 2 DEF, 1 MEI, 1 ATA)</option>
              <option value="1-2-1">1-2-1 (1 GOL, 1 DEF, 2 MEI, 1 ATA)</option>
            </select>
          </div>

          {/* Botão de Salvar */}
          <div>
            <button
              onClick={handleSaveLineup}
              disabled={saving || !isFormationSatisfied}
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-sm transition ${
                isFormationSatisfied
                  ? 'bg-[#155DFC] hover:bg-[#1447E6] text-white shadow-xs active:scale-[0.98]'
                  : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
              }`}
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar Escalação
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status da Escalação */}
        <div className="mt-4 pt-4 border-t border-[#E4E4E7] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#686872]">Status da Escalação:</span>
            {lineup?.complete ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F0FDF4] border border-[#B9F8CF] text-[#016630]">
                <CheckCircle className="w-3.5 h-3.5" />
                Completa e Apta
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FEF2F2] border border-[#FECACA] text-[#9F0A0A]">
                <AlertTriangle className="w-3.5 h-3.5" />
                Incompleta / Inapta
              </span>
            )}
          </div>

          {/* Contador de slots */}
          <div className="flex flex-wrap items-center gap-3 font-mono font-medium">
            <span className={counts.gol === req.gol ? 'text-emerald-700' : 'text-amber-700'}>
              GOL: {counts.gol}/{req.gol}
            </span>
            <span className="text-zinc-300">|</span>
            <span className={counts.def === req.def ? 'text-emerald-700' : 'text-amber-700'}>
              DEF: {counts.def}/{req.def}
            </span>
            {req.mei > 0 && (
              <>
                <span className="text-zinc-300">|</span>
                <span className={counts.mei === req.mei ? 'text-emerald-700' : 'text-amber-700'}>
                  MEI: {counts.mei}/{req.mei}
                </span>
              </>
            )}
            <span className="text-zinc-300">|</span>
            <span className={counts.ata === req.ata ? 'text-emerald-700' : 'text-amber-700'}>
              ATA: {counts.ata}/{req.ata}
            </span>
            <span className="text-zinc-300">|</span>
            <span className={counts.total === 5 ? 'text-emerald-700 font-bold' : 'text-[#686872]'}>
              Total: {counts.total}/5
            </span>
          </div>
        </div>
      </div>

      {/* Alerta de Escalação Incompleta */}
      {!lineup?.complete && (
        <div className="p-4 rounded-xl bg-[#FFFBEB] border border-[#FEE685] text-[#953D00] flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
          <div className="text-sm">
            <span className="font-semibold">Clube inapto para partidas oficiais:</span> Este clube não
            possui 5 titulares válidos escalados no esquema compatível. Defina e salve os titulares
            abaixo para liberar a disputa de jogos.
          </div>
        </div>
      )}

      {/* Conteúdo Principal: Campo Tático + Lista do Elenco */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Campo Tático Visual (5 colunas no desktop) */}
        <div className="lg:col-span-5 bg-white border border-[#E4E4E7] rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-xs">
          <h3 className="text-sm font-semibold text-zinc-900 mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#155DFC]" />
            Campo Tático ({formation})
          </h3>

          {/* Pitch do Campo com Estilização de Gramado */}
          <div className="relative w-full aspect-[3/4] bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-900 border-2 border-emerald-600/50 rounded-xl p-4 flex flex-col justify-between overflow-hidden shadow-inner">
            {/* Linhas do Campo */}
            <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-[1px] bg-emerald-400/30" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border border-emerald-400/30" />
            <div className="absolute inset-x-8 top-0 h-14 border-b border-x border-emerald-400/30 rounded-b-md" />
            <div className="absolute inset-x-8 bottom-0 h-14 border-t border-x border-emerald-400/30 rounded-t-md" />

            {/* Linha de Ataque */}
            <div className="relative z-10 flex justify-around items-center pt-2">
              {Array.from({ length: req.ata }).map((_, idx) => {
                const player = ataPlayers[idx];
                return (
                  <TacticalSlot
                    key={`ata-${idx}`}
                    posLabel="ATA"
                    player={player}
                    onRemove={player ? () => handleTogglePlayer(player) : undefined}
                  />
                );
              })}
            </div>

            {/* Linha de Meio-campo (se houver) */}
            {req.mei > 0 && (
              <div className="relative z-10 flex justify-around items-center my-auto">
                {Array.from({ length: req.mei }).map((_, idx) => {
                  const player = meiPlayers[idx];
                  return (
                    <TacticalSlot
                      key={`mei-${idx}`}
                      posLabel="MEI"
                      player={player}
                      onRemove={player ? () => handleTogglePlayer(player) : undefined}
                    />
                  );
                })}
              </div>
            )}

            {/* Linha de Defesa */}
            <div className="relative z-10 flex justify-around items-center py-2">
              {Array.from({ length: req.def }).map((_, idx) => {
                const player = defPlayers[idx];
                return (
                  <TacticalSlot
                    key={`def-${idx}`}
                    posLabel="DEF"
                    player={player}
                    onRemove={player ? () => handleTogglePlayer(player) : undefined}
                  />
                );
              })}
            </div>

            {/* Goleiro */}
            <div className="relative z-10 flex justify-center items-center pb-2">
              <TacticalSlot
                posLabel="GOL"
                player={golPlayers[0]}
                onRemove={golPlayers[0] ? () => handleTogglePlayer(golPlayers[0]) : undefined}
              />
            </div>
          </div>
        </div>

        {/* Lista de Jogadores do Elenco para Seleção */}
        <div className="lg:col-span-7 bg-white border border-[#E4E4E7] rounded-xl p-4 sm:p-5 flex flex-col shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Elenco Disponível</h3>
              <p className="text-xs text-[#686872]">
                Selecione até 5 jogadores de acordo com os requisitos da formação ({formation}).
              </p>
            </div>
            <span className="text-xs font-mono text-zinc-700 bg-zinc-100 px-2.5 py-1 rounded">
              {clubDetail?.players.length || 0} Atletas
            </span>
          </div>

          {loadingClubData ? (
            <div className="py-16 text-center text-[#686872]">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#155DFC]" />
              Carregando elenco do clube...
            </div>
          ) : !clubDetail || clubDetail.players.length === 0 ? (
            <div className="py-12 text-center text-[#686872] text-sm">
              Nenhum jogador no elenco deste clube. Compre atletas livres para poder escalar.
            </div>
          ) : (
            <div className="overflow-x-auto flex-1 max-h-[500px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#FAFAFA] text-[#686872] sticky top-0 uppercase tracking-wider text-[11px] border-b border-[#E4E4E7]">
                  <tr>
                    <th className="py-2.5 px-3">Escalar</th>
                    <th className="py-2.5 px-3">Jogador</th>
                    <th className="py-2.5 px-2">Pos</th>
                    <th className="py-2.5 px-2 text-center">OVR</th>
                    <th className="py-2.5 px-2">Condição</th>
                    <th className="py-2.5 px-3 text-right">Idade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E4E7]">
                  {clubDetail.players.map((player) => {
                    const isSelected = selectedPlayerIds.includes(player.id);
                    const isSick = player.condition === 'DOENTE';

                    return (
                      <tr
                        key={player.id}
                        onClick={() => !isSick && handleTogglePlayer(player)}
                        className={`transition cursor-pointer ${
                          isSick
                            ? 'opacity-40 bg-zinc-100 cursor-not-allowed'
                            : isSelected
                            ? 'bg-[#EFF6FF] hover:bg-blue-100/60'
                            : 'hover:bg-zinc-50/80'
                        }`}
                      >
                        <td className="py-2 px-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isSick}
                            onChange={() => !isSick && handleTogglePlayer(player)}
                            className="w-4 h-4 rounded border-[#E4E4E7] text-[#155DFC] focus:ring-0 cursor-pointer disabled:cursor-not-allowed"
                          />
                        </td>
                        <td className="py-2 px-3 font-semibold text-zinc-900">
                          <div className="flex items-center gap-1.5">
                            {player.name}
                            {isSick && (
                              <span title="Jogador DOENTE não pode ser escalado" className="text-rose-600">
                                <UserX className="w-3.5 h-3.5 inline" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getPositionBadgeClass(player.position)}`}>
                            {player.position}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center font-bold text-[#155DFC]">
                          {player.overall}
                        </td>
                        <td className="py-2 px-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${getConditionBadgeClass(player.condition)}`}>
                            {formatConditionLabel(player.condition)}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right text-[#686872] font-mono">
                          {player.age} anos
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente de Slot no Campo Tático
interface TacticalSlotProps {
  posLabel: string;
  player?: PlayerInClub;
  onRemove?: () => void;
}

const TacticalSlot: React.FC<TacticalSlotProps> = ({ posLabel, player, onRemove }) => {
  if (!player) {
    return (
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 rounded-full border-2 border-dashed border-emerald-400/50 bg-emerald-950/40 flex items-center justify-center text-[10px] font-bold text-emerald-300 shadow-sm">
          {posLabel}
        </div>
        <span className="text-[10px] text-emerald-400/70 mt-1 font-mono">Vazio</span>
      </div>
    );
  }

  return (
    <div
      onClick={onRemove}
      title="Clique para remover da escalação"
      className="flex flex-col items-center cursor-pointer group"
    >
      <div className="relative w-12 h-12 rounded-full bg-zinc-900 border-2 border-blue-400 flex flex-col items-center justify-center shadow-lg group-hover:border-rose-400 transition">
        <span className="text-[11px] font-extrabold text-blue-300 group-hover:hidden">
          {player.overall}
        </span>
        <span className="text-[10px] font-bold text-zinc-400 group-hover:hidden">
          {player.position}
        </span>
        <span className="hidden group-hover:block text-[10px] font-bold text-rose-400">
          Remover
        </span>
      </div>
      <span className="text-[10px] font-medium text-zinc-200 mt-1 max-w-[70px] truncate text-center">
        {player.name}
      </span>
    </div>
  );
};
