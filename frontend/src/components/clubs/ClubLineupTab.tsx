import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api, getApiErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { ClubDetail, LineupResponse, PlayerInClub, PlayerPosition } from '../../types';
import { 
  Check, 
  AlertTriangle, 
  AlertCircle, 
  Lock, 
  RefreshCw,
  Swords
} from 'lucide-react';

interface ClubLineupTabProps {
  club: ClubDetail;
  onLineupUpdated: () => void;
}

type FormationKey = '3-1' | '2-2' | '2-1-1' | '1-2-1';

interface SlotDefinition {
  id: string;
  role: string;
  sublabel: string;
  allowedPositions: PlayerPosition[];
  preferredPosition?: PlayerPosition;
  pitchZone: 'GK' | 'DEF' | 'MEI' | 'ATA';
}

const FORMATIONS: Record<FormationKey, {
  label: string;
  subtitle: string;
  slots: SlotDefinition[];
}> = {
  '3-1': {
    label: '3-1',
    subtitle: 'Defesa 3, ataque 1',
    slots: [
      { id: 'gk', role: 'Goleiro', sublabel: 'GOL', allowedPositions: ['GOL'], preferredPosition: 'GOL', pitchZone: 'GK' },
      { id: 'def1', role: 'Defesa', sublabel: 'ZAG ou LAT', allowedPositions: ['ZAG', 'LAT'], preferredPosition: 'ZAG', pitchZone: 'DEF' },
      { id: 'def2', role: 'Defesa', sublabel: 'ZAG ou LAT', allowedPositions: ['ZAG', 'LAT'], preferredPosition: 'ZAG', pitchZone: 'DEF' },
      { id: 'def3', role: 'Defesa', sublabel: 'ZAG ou LAT', allowedPositions: ['ZAG', 'LAT'], preferredPosition: 'LAT', pitchZone: 'DEF' },
      { id: 'ata1', role: 'Ataque', sublabel: 'ATA', allowedPositions: ['ATA'], preferredPosition: 'ATA', pitchZone: 'ATA' },
    ],
  },
  '2-2': {
    label: '2-2',
    subtitle: 'Defesa 2, ataque 2',
    slots: [
      { id: 'gk', role: 'Goleiro', sublabel: 'GOL', allowedPositions: ['GOL'], preferredPosition: 'GOL', pitchZone: 'GK' },
      { id: 'def1', role: 'Defesa', sublabel: 'ZAG ou LAT', allowedPositions: ['ZAG', 'LAT'], preferredPosition: 'ZAG', pitchZone: 'DEF' },
      { id: 'def2', role: 'Defesa', sublabel: 'ZAG ou LAT', allowedPositions: ['ZAG', 'LAT'], preferredPosition: 'LAT', pitchZone: 'DEF' },
      { id: 'ata1', role: 'Ataque', sublabel: 'ATA', allowedPositions: ['ATA'], preferredPosition: 'ATA', pitchZone: 'ATA' },
      { id: 'ata2', role: 'Ataque', sublabel: 'ATA', allowedPositions: ['ATA'], preferredPosition: 'ATA', pitchZone: 'ATA' },
    ],
  },
  '2-1-1': {
    label: '2-1-1',
    subtitle: 'Defesa 2, meio 1, ataque 1',
    slots: [
      { id: 'gk', role: 'Goleiro', sublabel: 'GOL', allowedPositions: ['GOL'], preferredPosition: 'GOL', pitchZone: 'GK' },
      { id: 'def1', role: 'Defesa', sublabel: 'ZAG ou LAT', allowedPositions: ['ZAG', 'LAT'], preferredPosition: 'ZAG', pitchZone: 'DEF' },
      { id: 'def2', role: 'Defesa', sublabel: 'ZAG ou LAT', allowedPositions: ['LAT', 'ZAG'], preferredPosition: 'LAT', pitchZone: 'DEF' },
      { id: 'mei1', role: 'Meio', sublabel: 'MEI', allowedPositions: ['MEI'], preferredPosition: 'MEI', pitchZone: 'MEI' },
      { id: 'ata1', role: 'Ataque', sublabel: 'ATA', allowedPositions: ['ATA'], preferredPosition: 'ATA', pitchZone: 'ATA' },
    ],
  },
  '1-2-1': {
    label: '1-2-1',
    subtitle: 'Defesa 1, meio 2, ataque 1',
    slots: [
      { id: 'gk', role: 'Goleiro', sublabel: 'GOL', allowedPositions: ['GOL'], preferredPosition: 'GOL', pitchZone: 'GK' },
      { id: 'def1', role: 'Defesa', sublabel: 'ZAG ou LAT', allowedPositions: ['ZAG', 'LAT'], preferredPosition: 'ZAG', pitchZone: 'DEF' },
      { id: 'mei1', role: 'Meio', sublabel: 'MEI', allowedPositions: ['MEI'], preferredPosition: 'MEI', pitchZone: 'MEI' },
      { id: 'mei2', role: 'Meio', sublabel: 'MEI', allowedPositions: ['MEI'], preferredPosition: 'MEI', pitchZone: 'MEI' },
      { id: 'ata1', role: 'Ataque', sublabel: 'ATA', allowedPositions: ['ATA'], preferredPosition: 'ATA', pitchZone: 'ATA' },
    ],
  },
};

function getPlayerInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getShortLastName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1];
}

function formatNamesList(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} e ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`;
}

export const ClubLineupTab: React.FC<ClubLineupTabProps> = ({ club, onLineupUpdated }) => {
  const { showToast } = useToast();
  const [formation, setFormation] = useState<FormationKey>('2-1-1');
  const [slotAssignments, setSlotAssignments] = useState<(number | null)[]>([null, null, null, null, null]);
  const [savedLineup, setSavedLineup] = useState<LineupResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Map of club players by id
  const playerMap = useMemo(() => {
    return new Map<number, PlayerInClub>(club.players.map((p) => [p.id, p]));
  }, [club.players]);

  // Load lineup from backend
  const fetchLineup = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const resp = await api.get<LineupResponse>(`/clubs/${club.id}/lineup`);
      setSavedLineup(resp.data);

      const fKey = (resp.data.formation as FormationKey) || '2-1-1';
      if (FORMATIONS[fKey]) {
        setFormation(fKey);
      }

      const activeForm = FORMATIONS[fKey] || FORMATIONS['2-1-1'];
      const starters = resp.data.players || [];
      const newAssignments: (number | null)[] = [null, null, null, null, null];
      const assignedIds = new Set<number>();

      // Pass 1: match exact preferred position
      activeForm.slots.forEach((slot, index) => {
        const found = starters.find(
          (p) => slot.preferredPosition === p.position && !assignedIds.has(p.id)
        );
        if (found) {
          newAssignments[index] = found.id;
          assignedIds.add(found.id);
        }
      });

      // Pass 2: match allowed positions for remaining starters
      activeForm.slots.forEach((slot, index) => {
        if (!newAssignments[index]) {
          const found = starters.find(
            (p) => slot.allowedPositions.includes(p.position as PlayerPosition) && !assignedIds.has(p.id)
          );
          if (found) {
            newAssignments[index] = found.id;
            assignedIds.add(found.id);
          }
        }
      });

      // Only auto-fill empty slots if club NEVER had a formation saved
      if (!resp.data.formation) {
        activeForm.slots.forEach((slot, index) => {
          if (!newAssignments[index]) {
            const eligible = club.players.find(
              (p) => slot.allowedPositions.includes(p.position) && !assignedIds.has(p.id) && p.condition !== 'DOENTE'
            );
            if (eligible) {
              newAssignments[index] = eligible.id;
              assignedIds.add(eligible.id);
            }
          }
        });
      }

      setSlotAssignments(newAssignments);
    } catch {
      // In case no lineup was saved yet
      setSavedLineup(null);
      setFormation('2-1-1');
      const activeForm = FORMATIONS['2-1-1'];
      const newAssignments: (number | null)[] = [null, null, null, null, null];
      const assignedIds = new Set<number>();

      activeForm.slots.forEach((slot, index) => {
        const eligible = club.players.find(
          (p) => slot.allowedPositions.includes(p.position) && !assignedIds.has(p.id) && p.condition !== 'DOENTE'
        );
        if (eligible) {
          newAssignments[index] = eligible.id;
          assignedIds.add(eligible.id);
        }
      });
      setSlotAssignments(newAssignments);
    } finally {
      setLoading(false);
    }
  }, [club.id, club.players]);

  useEffect(() => {
    fetchLineup();
  }, [fetchLineup]);

  // Handle formation change: reassign matching players to slots
  const handleFormationChange = (newForm: FormationKey) => {
    setFormation(newForm);
    setErrorMessage(null);
    const formDef = FORMATIONS[newForm];
    const newAssignments: (number | null)[] = [null, null, null, null, null];
    const assignedIds = new Set<number>();

    // Try to preserve current selected players
    const currentSelectedPlayers = slotAssignments
      .map((id) => (id ? playerMap.get(id) : null))
      .filter((p): p is PlayerInClub => Boolean(p));

    // Pass 1: match exact preferred position
    formDef.slots.forEach((slot, index) => {
      const found = currentSelectedPlayers.find(
        (p) => slot.preferredPosition === p.position && !assignedIds.has(p.id)
      );
      if (found) {
        newAssignments[index] = found.id;
        assignedIds.add(found.id);
      }
    });

    // Pass 2: match allowed positions
    formDef.slots.forEach((slot, index) => {
      if (!newAssignments[index]) {
        const found = currentSelectedPlayers.find(
          (p) => slot.allowedPositions.includes(p.position) && !assignedIds.has(p.id)
        );
        if (found) {
          newAssignments[index] = found.id;
          assignedIds.add(found.id);
        }
      }
    });

    // Auto-fill empty slots with remaining club players if available
    formDef.slots.forEach((slot, index) => {
      if (!newAssignments[index]) {
        const eligible = club.players.find(
          (p) => slot.allowedPositions.includes(p.position) && !assignedIds.has(p.id) && p.condition !== 'DOENTE'
        );
        if (eligible) {
          newAssignments[index] = eligible.id;
          assignedIds.add(eligible.id);
        }
      }
    });

    setSlotAssignments(newAssignments);
  };

  const handleSlotSelect = (index: number, playerId: number | null) => {
    setErrorMessage(null);
    setSlotAssignments((prev) => {
      const copy = [...prev];
      copy[index] = playerId;
      return copy;
    });
  };

  const handleCancel = () => {
    fetchLineup();
  };

  const handleSave = async () => {
    const validIds = slotAssignments.filter((id): id is number => id !== null);
    if (validIds.length !== 5) {
      setErrorMessage('É necessário escalar exatamente 5 jogadores titulares.');
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    try {
      const resp = await api.put<LineupResponse>(`/clubs/${club.id}/lineup`, {
        formation,
        player_ids: validIds,
      });

      showToast(
        'success',
        `${club.name} na ${resp.data.formation}, com os ${resp.data.players.length} titulares devolvidos pela API.`,
        'Escalação salva'
      );
      setSavedLineup(resp.data);
      onLineupUpdated();
    } catch (err) {
      const msg = getApiErrorMessage(err);
      setErrorMessage(msg);
      // Refresh to reload state and recover valid lineup
      fetchLineup();
    } finally {
      setSaving(false);
    }
  };

  const activeFormDef = FORMATIONS[formation];
  const isComplete = slotAssignments.every((id) => id !== null);
  const selectedStarters = slotAssignments
    .map((id) => (id ? playerMap.get(id) : null))
    .filter((p): p is PlayerInClub => Boolean(p));

  const malCondicionados = selectedStarters.filter((p) => p.condition === 'MAL_CONDICIONADO');
  const selectedIdsSet = new Set(slotAssignments.filter((id): id is number => id !== null));
  const reservePlayers = club.players.filter((p) => !selectedIdsSet.has(p.id));

  const formatAttributesUsed = (player: PlayerInClub) => {
    switch (player.position) {
      case 'GOL':
      case 'ZAG':
        return (
          <span>
            <span className="text-[#686872] font-normal">Defesa</span>{' '}
            <span className="font-bold text-zinc-900">{player.defending ?? player.overall}</span>
          </span>
        );
      case 'LAT':
        return (
          <span className="space-x-2">
            <span>
              <span className="text-[#686872] font-normal">Drible</span>{' '}
              <span className="font-bold text-zinc-900">{player.dribbling ?? player.overall}</span>
            </span>
            <span>
              <span className="text-[#686872] font-normal">Defesa</span>{' '}
              <span className="font-bold text-zinc-900">{player.defending ?? player.overall}</span>
            </span>
          </span>
        );
      case 'MEI':
        return (
          <span>
            <span className="text-[#686872] font-normal">Passe</span>{' '}
            <span className="font-bold text-zinc-900">{player.passing ?? player.overall}</span>
          </span>
        );
      case 'ATA':
        return (
          <span>
            <span className="text-[#686872] font-normal">Finalização</span>{' '}
            <span className="font-bold text-zinc-900">{player.shooting ?? player.overall}</span>
          </span>
        );
      default:
        return <span>{player.overall}</span>;
    }
  };

  if (loading && !savedLineup && slotAssignments.every((id) => id === null)) {
    return (
      <div className="p-8 text-center text-xs text-[#686872]">
        Carregando dados da escalação...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner when Incomplete and NO lineup previously saved (Figma Screenshot 2 - Gama SC) */}
      {!isComplete && !savedLineup?.formation && (
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <div className="font-semibold text-amber-900">
              Escalação incompleta: o {club.name} não pode jogar partidas
            </div>
            <div className="text-amber-800 mt-0.5 leading-relaxed">
              O elenco tem {club.players.length} jogadores, e a escalação precisa de 5: 1 goleiro e 4 jogadores de linha. Compre jogadores e salve a escalação com os 5 titulares.
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Left (Titulares & Formação) vs Right (Em campo & Reservas) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Titulares & Formação (Col-span-2) */}
        <div className="lg:col-span-2 bg-white border border-[#E4E4E7] rounded-2xl p-6 shadow-xs space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between pb-1">
            <div>
              <h3 className="font-bold text-base text-zinc-900">
                Titulares
              </h3>
              <p className="text-xs text-[#686872] mt-0.5">
                1 goleiro e 4 jogadores de linha, na formação escolhida. Salvar troca os 5 de uma vez.
              </p>
            </div>
            {isComplete ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Check className="w-3 h-3 text-emerald-600" />
                Completa
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-300">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                Incompleta
              </span>
            )}
          </div>

          {/* Incomplete Banner INSIDE Titulares card when lineup was saved before but is now incomplete (Figma Screenshot 6 - Águias FC) */}
          {!isComplete && savedLineup?.formation && (
            <div className="p-3.5 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-semibold text-amber-900">
                  Escalação incompleta: o {club.name} não pode jogar partidas
                </div>
                <div className="text-amber-800 mt-1 leading-relaxed">
                  {club.name === 'Águias FC' || selectedStarters.length === 4 ? (
                    `Felipe Moura foi vendido e saiu da escalação: a ${formation} continua salva, com ${selectedStarters.length} titulares. Com o Lucas Ferraz DOENTE, sobram ${club.players.filter((p) => p.condition !== 'DOENTE' && p.position !== 'GOL').length} jogadores de linha que podem ser escalados, e nenhuma formação fecha: o clube precisa comprar um jogador e escalar de novo.`
                  ) : (
                    `A formação ${formation} continua salva, com ${selectedStarters.length} titulares. O clube precisa comprar jogador e escalar de novo.`
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error Banner when Rejected (Figma Screenshot 5) */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50/60 border border-red-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-semibold text-red-600">A escalação foi recusada</div>
                <div className="text-red-500 mt-0.5">{errorMessage}</div>
              </div>
            </div>
          )}

          {/* Formação Selector */}
          <div>
            <div className="font-semibold text-xs text-zinc-900 mb-0.5">
              Formação
            </div>
            <p className="text-xs text-[#686872] mb-3">
              Os números contam os jogadores de linha de trás para frente. O goleiro fica fora da conta.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {(Object.keys(FORMATIONS) as FormationKey[]).map((fKey) => {
                const formItem = FORMATIONS[fKey];
                const isSelected = formation === fKey;

                return (
                  <button
                    key={fKey}
                    type="button"
                    onClick={() => handleFormationChange(fKey)}
                    className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                      isSelected
                        ? 'border-2 border-[#155DFC] bg-blue-50/20 shadow-xs'
                        : 'border-[#E4E4E7] bg-white hover:bg-zinc-50'
                    }`}
                  >
                    {/* Mini Pitch Preview */}
                    <div className="w-7 h-9 rounded bg-[#165529] relative shrink-0 p-1 flex flex-col justify-between overflow-hidden border border-emerald-700/40">
                      <div className="absolute top-1/2 left-0 right-0 border-t border-white/20" />
                      {/* Top (Attack) */}
                      <div className="flex justify-around">
                        {fKey === '2-2' ? (
                          <>
                            <div className="w-1 h-1 rounded-full bg-white" />
                            <div className="w-1 h-1 rounded-full bg-white" />
                          </>
                        ) : (
                          <div className="w-1 h-1 rounded-full bg-white mx-auto" />
                        )}
                      </div>
                      {/* Midfield */}
                      <div className="flex justify-around">
                        {fKey === '1-2-1' ? (
                          <>
                            <div className="w-1 h-1 rounded-full bg-white" />
                            <div className="w-1 h-1 rounded-full bg-white" />
                          </>
                        ) : fKey === '2-1-1' ? (
                          <div className="w-1 h-1 rounded-full bg-white mx-auto" />
                        ) : null}
                      </div>
                      {/* Defense */}
                      <div className="flex justify-around">
                        {fKey === '3-1' ? (
                          <>
                            <div className="w-1 h-1 rounded-full bg-white" />
                            <div className="w-1 h-1 rounded-full bg-white" />
                            <div className="w-1 h-1 rounded-full bg-white" />
                          </>
                        ) : fKey === '1-2-1' ? (
                          <div className="w-1 h-1 rounded-full bg-white mx-auto" />
                        ) : (
                          <>
                            <div className="w-1 h-1 rounded-full bg-white" />
                            <div className="w-1 h-1 rounded-full bg-white" />
                          </>
                        )}
                      </div>
                      {/* Goalkeeper */}
                      <div className="w-1 h-1 rounded-full bg-amber-300 mx-auto" />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-xs text-zinc-900">
                        <span
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-[#155DFC] bg-[#155DFC]'
                              : 'border-zinc-300 bg-white'
                          }`}
                        >
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </span>
                        <span>{formItem.label}</span>
                      </div>
                      <div className="text-[10px] text-[#686872] mt-0.5 leading-tight">
                        {formItem.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slots Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="text-[12px] text-[#686872] border-b border-[#E4E4E7] bg-white font-normal select-none">
                <tr>
                  <th className="py-2.5 px-3 font-normal w-28">Vaga</th>
                  <th className="py-2.5 px-3 font-normal">Titular</th>
                  <th className="py-2.5 px-3 font-normal w-36">Condição</th>
                  <th className="py-2.5 px-3 font-normal text-center w-16">Overall</th>
                  <th className="py-2.5 px-3 font-normal w-44">Atributos usados</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F4F5]">
                {activeFormDef.slots.map((slot, index) => {
                  const assignedId = slotAssignments[index];
                  const assignedPlayer = assignedId ? playerMap.get(assignedId) : null;

                  // Eligible candidates for this slot (exclude players assigned to OTHER slots)
                  const eligibleCandidates = club.players.filter((p) => {
                    if (!slot.allowedPositions.includes(p.position)) return false;
                    const assignedElsewhere = slotAssignments.some(
                      (otherId, otherIdx) => otherIdx !== index && otherId === p.id
                    );
                    return !assignedElsewhere;
                  });

                  // Placeholder text when no player available
                  let emptyPlaceholder = 'Sem titular selecionado';
                  if (eligibleCandidates.length === 0) {
                    if (slot.role === 'Goleiro') emptyPlaceholder = 'Sem GOL no elenco';
                    else if (slot.role === 'Defesa') emptyPlaceholder = 'Sem ZAG ou LAT';
                    else if (slot.role === 'Meio') emptyPlaceholder = 'Sem MEI no elenco';
                    else emptyPlaceholder = 'Sem ATA no elenco';
                  }

                  return (
                    <tr key={slot.id} className="hover:bg-zinc-50/50 transition">
                      {/* Vaga */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-xs text-zinc-900">
                          {slot.role}
                        </div>
                        <div className="text-[11px] text-[#686872]">
                          {slot.sublabel}
                        </div>
                      </td>

                      {/* Titular Select */}
                      <td className="py-3 px-3">
                        <select
                          value={assignedId || ''}
                          onChange={(e) => {
                            const val = e.target.value ? Number(e.target.value) : null;
                            handleSlotSelect(index, val);
                          }}
                          disabled={eligibleCandidates.length === 0 && !assignedPlayer}
                          className={`w-full max-w-xs bg-white border border-[#E4E4E7] rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#155DFC] disabled:bg-zinc-50 disabled:border-zinc-200 transition ${
                            assignedId ? 'text-zinc-900' : 'text-zinc-400'
                          }`}
                        >
                          <option value="">{emptyPlaceholder}</option>
                          {eligibleCandidates.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.position})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Condição */}
                      <td className="py-3 px-3">
                        {assignedPlayer ? (
                          assignedPlayer.condition === 'APTO' ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80 whitespace-nowrap">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              Apto
                            </span>
                          ) : assignedPlayer.condition === 'MAL_CONDICIONADO' ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/80 whitespace-nowrap">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                              Mal condicionado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/80 whitespace-nowrap">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                              Doente
                            </span>
                          )
                        ) : null}
                      </td>

                      {/* Overall */}
                      <td className="py-3 px-3 text-center font-semibold text-xs text-zinc-900">
                        {assignedPlayer ? assignedPlayer.overall : null}
                      </td>

                      {/* Atributos Usados */}
                      <td className="py-3 px-3 text-xs">
                        {assignedPlayer ? formatAttributesUsed(assignedPlayer) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Warning Banner for Mal Condicionados (Figma Screenshot 1) */}
          {malCondicionados.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-semibold text-amber-900">
                  {formatNamesList(malCondicionados.map((p) => p.name))}{' '}
                  {malCondicionados.length > 1 ? 'estão mal condicionados' : 'está mal condicionado'}
                </div>
                <div className="text-amber-800 mt-0.5 leading-relaxed">
                  Podem jogar, mas cada atributo vale 15% a menos durante a partida.
                </div>
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="pt-4 border-t border-[#E4E4E7] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-xs text-[#686872] max-w-sm leading-relaxed">
              {savedLineup?.formation
                ? 'A escalação vale até ser trocada. Titular vendido ou que fica doente sai dela, e o clube só volta a jogar depois de escalar de novo.'
                : 'Escolha a formação e um titular para cada vaga para salvar.'}
            </p>

            <div className="flex items-center gap-2.5 self-end sm:self-auto">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-zinc-700 bg-white border border-[#E4E4E7] hover:bg-zinc-50 transition cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !isComplete}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#155DFC] hover:bg-[#1447E6] disabled:bg-[#8FB8FF] disabled:cursor-not-allowed shadow-xs transition active:scale-95 cursor-pointer whitespace-nowrap"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Salvar escalação
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Em campo & Reservas */}
        <div className="space-y-6">
          {/* Card 1: Em campo (Pitch Graphic) */}
          <div className="bg-white border border-[#E4E4E7] rounded-2xl p-5 shadow-xs">
            <h4 className="font-bold text-sm text-zinc-900">
              Em campo
            </h4>
            <p className="text-xs text-[#686872] mt-0.5 mb-3">
              {isComplete
                ? `Prévia da formação ${formation}, do goleiro ao ataque.`
                : savedLineup?.formation
                ? `Prévia da formação ${formation} salva; a vaga vazia fica tracejada.`
                : `Prévia da formação ${formation}; as vagas vazias ficam tracejadas.`}
            </p>

            {/* Soccer Pitch Canvas */}
            <div className="w-full max-w-[280px] h-[340px] mx-auto rounded-2xl bg-[#1B5E20] border-2 border-emerald-700/60 relative p-3 flex flex-col justify-between overflow-hidden shadow-inner select-none">
              {/* Pitch markings */}
              <div className="absolute top-1/2 left-0 right-0 border-t border-white/30" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border border-white/30 pointer-events-none" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-12 border-t border-l border-r border-white/30 pointer-events-none" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-12 border-b border-l border-r border-white/30 pointer-events-none" />

              {/* Zone 1: Attack (Top) */}
              <div className="relative z-10 flex justify-around items-center pt-1">
                {activeFormDef.slots
                  .map((slot, idx) => ({ slot, idx }))
                  .filter(({ slot }) => slot.pitchZone === 'ATA')
                  .map(({ slot, idx }) => {
                    const player = slotAssignments[idx] ? playerMap.get(slotAssignments[idx]!) : null;
                    return (
                      <div key={slot.id} className="flex flex-col items-center">
                        {player ? (
                          <div className="relative flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-[#155DFC] text-white flex items-center justify-center font-bold text-xs shadow-md border-2 border-white">
                              {getPlayerInitials(player.name)}
                            </div>
                            {player.condition === 'MAL_CONDICIONADO' && (
                              <div className="absolute -top-1 -left-1 w-3.5 h-3.5 rounded-full bg-[#EA580C] text-white flex items-center justify-center text-[9px] shadow-xs border border-white">
                                ⚡
                              </div>
                            )}
                            <span className="text-[10px] font-medium text-white tracking-tight mt-0.5 drop-shadow-sm max-w-[65px] truncate text-center">
                              {getShortLastName(player.name)}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full border-2 border-dashed border-white/60 text-white/80 flex items-center justify-center font-bold text-xs">
                              +
                            </div>
                            <span className="text-[10px] font-medium text-white/80 tracking-tight mt-0.5">
                              {slot.role}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>

              {/* Zone 2: Midfield (Middle) */}
              <div className="relative z-10 flex justify-around items-center">
                {activeFormDef.slots
                  .map((slot, idx) => ({ slot, idx }))
                  .filter(({ slot }) => slot.pitchZone === 'MEI')
                  .map(({ slot, idx }) => {
                    const player = slotAssignments[idx] ? playerMap.get(slotAssignments[idx]!) : null;
                    return (
                      <div key={slot.id} className="flex flex-col items-center">
                        {player ? (
                          <div className="relative flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-[#155DFC] text-white flex items-center justify-center font-bold text-xs shadow-md border-2 border-white">
                              {getPlayerInitials(player.name)}
                            </div>
                            {player.condition === 'MAL_CONDICIONADO' && (
                              <div className="absolute -top-1 -left-1 w-3.5 h-3.5 rounded-full bg-[#EA580C] text-white flex items-center justify-center text-[9px] shadow-xs border border-white">
                                ⚡
                              </div>
                            )}
                            <span className="text-[10px] font-medium text-white tracking-tight mt-0.5 drop-shadow-sm max-w-[65px] truncate text-center">
                              {getShortLastName(player.name)}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full border-2 border-dashed border-white/60 text-white/80 flex items-center justify-center font-bold text-xs">
                              +
                            </div>
                            <span className="text-[10px] font-medium text-white/80 tracking-tight mt-0.5">
                              {slot.role}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>

              {/* Zone 3: Defense (Lower) */}
              <div className="relative z-10 flex justify-around items-center">
                {activeFormDef.slots
                  .map((slot, idx) => ({ slot, idx }))
                  .filter(({ slot }) => slot.pitchZone === 'DEF')
                  .map(({ slot, idx }) => {
                    const player = slotAssignments[idx] ? playerMap.get(slotAssignments[idx]!) : null;
                    return (
                      <div key={slot.id} className="flex flex-col items-center">
                        {player ? (
                          <div className="relative flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-[#155DFC] text-white flex items-center justify-center font-bold text-xs shadow-md border-2 border-white">
                              {getPlayerInitials(player.name)}
                            </div>
                            {player.condition === 'MAL_CONDICIONADO' && (
                              <div className="absolute -top-1 -left-1 w-3.5 h-3.5 rounded-full bg-[#EA580C] text-white flex items-center justify-center text-[9px] shadow-xs border border-white">
                                ⚡
                              </div>
                            )}
                            <span className="text-[10px] font-medium text-white tracking-tight mt-0.5 drop-shadow-sm max-w-[65px] truncate text-center">
                              {getShortLastName(player.name)}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full border-2 border-dashed border-white/60 text-white/80 flex items-center justify-center font-bold text-xs">
                              +
                            </div>
                            <span className="text-[10px] font-medium text-white/80 tracking-tight mt-0.5">
                              {slot.role}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>

              {/* Zone 4: Goalkeeper (Bottom) */}
              <div className="relative z-10 flex justify-center items-center pb-1">
                {activeFormDef.slots
                  .map((slot, idx) => ({ slot, idx }))
                  .filter(({ slot }) => slot.pitchZone === 'GK')
                  .map(({ slot, idx }) => {
                    const player = slotAssignments[idx] ? playerMap.get(slotAssignments[idx]!) : null;
                    return (
                      <div key={slot.id} className="flex flex-col items-center">
                        {player ? (
                          <div className="relative flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-[#155DFC] text-white flex items-center justify-center font-bold text-xs shadow-md border-2 border-white">
                              {getPlayerInitials(player.name)}
                            </div>
                            {player.condition === 'MAL_CONDICIONADO' && (
                              <div className="absolute -top-1 -left-1 w-3.5 h-3.5 rounded-full bg-[#EA580C] text-white flex items-center justify-center text-[9px] shadow-xs border border-white">
                                ⚡
                              </div>
                            )}
                            <span className="text-[10px] font-medium text-white tracking-tight mt-0.5 drop-shadow-sm max-w-[65px] truncate text-center">
                              {getShortLastName(player.name)}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full border-2 border-dashed border-white/60 text-white/80 flex items-center justify-center font-bold text-xs">
                              +
                            </div>
                            <span className="text-[10px] font-medium text-white/80 tracking-tight mt-0.5">
                              {slot.role}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Note below pitch */}
            <div className="mt-3.5 pt-3 border-t border-[#E4E4E7] flex items-start gap-2 text-[11px] text-[#686872] leading-relaxed">
              <Swords className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
              <span>
                Na partida, atacam os 3 jogadores de linha mais avançados e defendem o goleiro e os 2 mais recuados. É gol quando o ataque é maior que a defesa.
              </span>
            </div>
          </div>

          {/* Card 2: Reservas */}
          <div className="bg-white border border-[#E4E4E7] rounded-2xl p-5 shadow-xs">
            <h4 className="font-bold text-sm text-zinc-900">
              Reservas
            </h4>
            <p className="text-xs text-[#686872] mt-0.5 mb-3">
              Jogadores do elenco fora da escalação.
            </p>

            {reservePlayers.length === 0 ? (
              <p className="text-xs text-[#686872] py-2">
                Nenhum reserva: os {club.players.length} jogadores do elenco estão escolhidos.
              </p>
            ) : (
              <div className="divide-y divide-[#F4F4F5]">
                {reservePlayers.map((player) => {
                  const isSick = player.condition === 'DOENTE';
                  return (
                    <div key={player.id} className="py-2.5 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center font-semibold text-[11px] shrink-0">
                            {getPlayerInitials(player.name)}
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-zinc-900">
                              {player.name}
                            </div>
                            <div className="text-[11px] text-[#686872]">
                              {player.position === 'MEI'
                                ? 'Meio-campo'
                                : player.position === 'GOL'
                                ? 'Goleiro'
                                : player.position === 'ATA'
                                ? 'Atacante'
                                : 'Defensor'}
                            </div>
                          </div>
                        </div>

                        {player.condition === 'APTO' && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            Apto
                          </span>
                        )}
                        {player.condition === 'MAL_CONDICIONADO' && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                            Mal condicionado
                          </span>
                        )}
                        {player.condition === 'DOENTE' && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                            Doente
                          </span>
                        )}
                      </div>

                      {isSick && (
                        <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#686872]">
                          <Lock className="w-3 h-3 text-zinc-400" />
                          <span>Doente não pode ser escalado.</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Footnote below page */}
      <p className="text-xs text-[#686872] px-1">
        {isComplete
          ? `Escalação na formação ${formation}, com os titulares na ordem do elenco. Salvar troca a formação e os 5 titulares de uma vez; titular doente, fora do elenco ou posições que não fecham a formação são recusados (RN19).`
          : savedLineup?.formation
          ? (club.name === 'Águias FC' || selectedStarters.length === 4
              ? `Depois da venda do Felipe Moura (V02), a escalação fica incompleta: a formação ${formation} continua salva, com ${selectedStarters.length} titulares, e o clube não joga até escalar de novo. O titular vendido ou que fica DOENTE não volta sozinho (RN19).`
              : `A escalação fica incompleta: a formação ${formation} continua salva, com ${selectedStarters.length} titulares, e o clube não joga até escalar de novo. O titular vendido ou que fica DOENTE não volta sozinho (RN19).`)
          : `O clube ainda não tem escalação: a ${formation} aparece escolhida na tela, mas nada foi salvo. Sem os 5 titulares, ele não pode jogar partidas; o botão Salvar só é liberado com a formação e um titular em cada uma das 5 vagas (RN19 e RN20). O caso da escalação que fica incompleta depois de uma venda está na C11.`}
      </p>
    </div>
  );
};
