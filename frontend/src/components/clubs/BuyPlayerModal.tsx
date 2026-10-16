import React, { useState, useEffect } from 'react';
import { api, getApiErrorMessage } from '../../services/api';
import { Club, Player, PagedResponse, BuyResponse } from '../../types';
import { formatDecimal } from '../../utils/formatters';
import { 
  X, 
  ShoppingCart, 
  AlertCircle, 
  RefreshCw, 
  RotateCw, 
  Info, 
  Calendar, 
  Clock, 
  Check, 
  ChevronDown 
} from 'lucide-react';

interface BuyPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  club: Club;
  onSuccess: () => void;
}

interface ErrorState {
  type: 'network' | 'rejected';
  title: string;
  message: string;
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

function getPositionFullName(position: string): string {
  switch (position) {
    case 'GOL': return 'Goleiro';
    case 'ZAG': return 'Zagueiro';
    case 'LAT': return 'Lateral';
    case 'MEI': return 'Meio-campo';
    case 'ATA': return 'Atacante';
    default: return position;
  }
}

function parseDateTimeToIso(dateStr: string, timeStr: string): string {
  const parts = dateStr.trim().split('/');
  let year = '';
  let month = '';
  let day = '';
  if (parts.length === 3) {
    day = parts[0].padStart(2, '0');
    month = parts[1].padStart(2, '0');
    year = parts[2];
  } else {
    year = '2027';
    month = '11';
    day = '12';
  }

  const cleanTime = timeStr.trim() || '15:00';
  const timeWithSec = cleanTime.length === 5 ? `${cleanTime}:00` : cleanTime;
  return `${year}-${month}-${day}T${timeWithSec}-03:00`;
}

function formatLoyaltyDisplay(isoString?: string): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (!isNaN(d.getTime())) {
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    const [datePart, timeWithOffset] = isoString.split('T');
    const [y, m, day] = datePart.split('-');
    const timePart = timeWithOffset.slice(0, 5);
    return `${day}/${m}/${y}, ${timePart}`;
  } catch {
    return isoString;
  }
}

export const BuyPlayerModal: React.FC<BuyPlayerModalProps> = ({
  isOpen,
  onClose,
  club,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [fetchingPlayers, setFetchingPlayers] = useState(true);
  const [freePlayers, setFreePlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [dateInput, setDateInput] = useState('12/11/2027');
  const [timeInput, setTimeInput] = useState('15:00');
  const [errorState, setErrorState] = useState<ErrorState | null>(null);
  const [successData, setSuccessData] = useState<BuyResponse | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFetchingPlayers(true);
      setErrorState(null);
      setSuccessData(null);
      setDateInput('12/11/2027');
      setTimeInput('15:00');

      api
        .get<PagedResponse<Player>>('/players', { params: { free: 'true', limit: 50, sort: 'name' } })
        .then((res) => {
          setFreePlayers(res.data.data);
          if (res.data.data.length > 0) {
            setSelectedPlayerId(res.data.data[0].id);
          }
        })
        .catch((err) => {
          setErrorState({
            type: 'rejected',
            title: 'Erro ao carregar jogadores',
            message: getApiErrorMessage(err),
          });
        })
        .finally(() => {
          setFetchingPlayers(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedPlayer = freePlayers.find((p) => p.id === selectedPlayerId);
  const avatarPalette = selectedPlayer ? getPlayerAvatar(selectedPlayer.name, selectedPlayer.id) : AVATAR_PALETTES[0];

  const handleConfirmBuy = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedPlayerId || !selectedPlayer) return;

    setLoading(true);
    setErrorState(null);

    try {
      const loyaltyUntil = parseDateTimeToIso(dateInput, timeInput);
      const resp = await api.post<BuyResponse>(`/players/${selectedPlayerId}/buy`, {
        club_id: club.id,
        loyalty_until: loyaltyUntil,
      });

      setSuccessData(resp.data);
      onSuccess();
    } catch (err: unknown) {
      const isNetwork = !err || (typeof err === 'object' && ('code' in err) && (err as { code?: string }).code === 'ERR_NETWORK') || (typeof err === 'object' && !('response' in err));
      const msg = getApiErrorMessage(err);

      if (isNetwork) {
        setErrorState({
          type: 'network',
          title: 'Sem conexão',
          message: 'A compra não foi confirmada. Verifique a conexão e tente de novo.',
        });
      } else {
        setErrorState({
          type: 'rejected',
          title: 'Compra recusada',
          message: msg,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-zinc-200/80 w-full max-w-[540px] p-6 relative animate-scale-in">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-600 transition p-1 rounded-lg cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* State 5: Success State */}
        {successData ? (
          <div className="space-y-4">
            <div>
              <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <h3 className="font-bold text-base text-zinc-900 mt-2">
                Compra concluída
              </h3>
              <p className="text-xs text-[#686872] mt-0.5">
                {selectedPlayer?.name} agora é do {club.name}.
              </p>
            </div>

            <div className="border border-[#E4E4E7] rounded-xl overflow-hidden divide-y divide-[#E4E4E7] text-xs">
              <div className="p-3 flex items-center justify-between">
                <div>
                  <div className="text-zinc-800">Valor</div>
                  <div className="text-[11px] text-[#686872]">Valor de mercado no momento da compra</div>
                </div>
                <div className="font-mono font-bold text-xs text-zinc-900">
                  {formatDecimal(successData.value)}
                </div>
              </div>

              <div className="p-3 flex items-center justify-between">
                <div>
                  <div className="text-zinc-800">Taxa</div>
                  <div className="text-[11px] text-[#686872]">
                    {successData.fee > 0 ? '5% do valor, porque passa de 30,00' : 'Isento de taxa (valor até 30,00)'}
                  </div>
                </div>
                <div className="font-mono font-bold text-xs text-zinc-900">
                  {formatDecimal(successData.fee)}
                </div>
              </div>

              <div className="p-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-zinc-900">Custo total</div>
                  <div className="text-[11px] text-[#686872]">Valor + taxa</div>
                </div>
                <div className="font-mono font-bold text-xs text-zinc-900">
                  {formatDecimal(successData.value + successData.fee)}
                </div>
              </div>

              <div className="p-3 flex items-center justify-between">
                <div className="text-zinc-800">Fim da fidelidade</div>
                <div className="font-mono font-medium text-xs text-zinc-900">
                  {formatLoyaltyDisplay(successData.contract?.loyalty_until || parseDateTimeToIso(dateInput, timeInput))}
                </div>
              </div>

              <div className="p-3 flex items-center justify-between">
                <div className="text-zinc-800">Contrato</div>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  ATIVO
                </span>
              </div>

              <div className="p-3 flex items-center justify-between">
                <div className="font-semibold text-zinc-900">
                  Novo caixa do {club.name}
                </div>
                <div className="font-mono font-bold text-xs text-zinc-900">
                  {formatDecimal(successData.club_cash)}
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#155DFC] hover:bg-[#1447E6] transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div>
              <h3 className="font-bold text-base text-zinc-900">
                Comprar jogador
              </h3>
              <p className="text-xs text-[#686872] mt-0.5">
                Escolha o jogador livre e até quando vai a fidelidade do contrato para {club.name}.
              </p>
            </div>

            {errorState && (
              <div className="mt-4 p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-semibold text-rose-600">
                    {errorState.title}
                  </div>
                  <div className="text-rose-500 mt-0.5 leading-relaxed">
                    {errorState.message}
                  </div>
                </div>
              </div>
            )}

            {fetchingPlayers ? (
              <div className="py-12 text-center text-xs text-[#686872]">
                Carregando jogadores livres...
              </div>
            ) : freePlayers.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#686872]">
                Nenhum jogador livre disponível no mercado.
              </div>
            ) : (
              <>
                {/* Player Card */}
                {selectedPlayer && (
                  <div className="mt-4 bg-white border border-[#E4E4E7] rounded-xl p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full ${avatarPalette.bg} ${avatarPalette.text} flex items-center justify-center font-bold text-xs shrink-0`}>
                        {getPlayerInitials(selectedPlayer.name)}
                      </div>
                      <div>
                        <div className="font-semibold text-xs text-zinc-900">
                          {selectedPlayer.name}
                        </div>
                        <div className="text-[11px] text-[#686872] mt-0.5">
                          {selectedPlayer.position} · {getPositionFullName(selectedPlayer.position)} · {selectedPlayer.age} anos
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-[#686872]">
                        Valor de mercado
                      </div>
                      <div className="font-mono font-bold text-base text-zinc-900">
                        {formatDecimal(selectedPlayer.market_value)}
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleConfirmBuy} className="mt-4 space-y-4">
                  {/* Select Player */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-900 mb-1.5">
                      Jogador livre
                    </label>
                    <div className="relative">
                      <select
                        value={selectedPlayerId || ''}
                        onChange={(e) => {
                          setSelectedPlayerId(Number(e.target.value));
                          setErrorState(null);
                        }}
                        disabled={loading}
                        className="w-full bg-white border border-[#E4E4E7] rounded-lg px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-[#155DFC] disabled:bg-zinc-50 transition appearance-none cursor-pointer pr-8"
                      >
                        {freePlayers.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.position}) · valor {formatDecimal(p.market_value)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <p className="text-[11px] text-[#686872] mt-1.5">
                      Caixa atual: {formatDecimal(club.cash)}. O custo total (valor + taxa) pode ir até 50% do caixa.
                    </p>
                  </div>

                  {/* Fim da fidelidade */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-900 mb-1.5">
                      Fim da fidelidade
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative flex items-center">
                        <Calendar className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
                        <input
                          type="text"
                          value={dateInput}
                          onChange={(e) => {
                            setDateInput(e.target.value);
                            setErrorState(null);
                          }}
                          disabled={loading}
                          placeholder="DD/MM/AAAA"
                          className="w-full pl-9 pr-3 py-2 bg-white border border-[#E4E4E7] rounded-lg text-xs font-mono text-zinc-900 focus:outline-none focus:border-[#155DFC] disabled:bg-zinc-50 transition"
                        />
                      </div>

                      <div className="w-28 relative flex items-center">
                        <Clock className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
                        <input
                          type="text"
                          value={timeInput}
                          onChange={(e) => {
                            setTimeInput(e.target.value);
                            setErrorState(null);
                          }}
                          disabled={loading}
                          placeholder="HH:MM"
                          className="w-full pl-9 pr-3 py-2 bg-white border border-[#E4E4E7] rounded-lg text-xs font-mono text-zinc-900 focus:outline-none focus:border-[#155DFC] disabled:bg-zinc-50 transition"
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-[#686872] mt-1.5">
                      Depois do momento da compra e até 1.095 dias. Horário de Brasília; enviado com o fuso (-03:00).
                    </p>
                  </div>

                  {/* Informational Boxes */}
                  <div className="space-y-2">
                    <div className="p-3 rounded-xl bg-zinc-50/70 border border-[#E4E4E7] flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                      <span className="text-[11px] text-[#686872] leading-relaxed">
                        A taxa é de 5% do valor de mercado, só quando ele passa de 30,00. Taxa, custo e novo caixa são calculados ao confirmar.
                      </span>
                    </div>

                    {loading && (
                      <div className="p-3 rounded-xl bg-zinc-50/70 border border-[#E4E4E7] flex items-start gap-2.5 animate-fade-in">
                        <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                        <span className="text-[11px] text-[#686872] leading-relaxed">
                          Enviando a compra. Os botões ficam desabilitados até a resposta.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Footer Controls */}
                  <div className="pt-4 border-t border-[#E4E4E7] flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={loading}
                      className="px-4 py-2 rounded-lg text-xs font-semibold text-zinc-700 bg-white border border-[#E4E4E7] hover:bg-zinc-50 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      disabled={loading || !selectedPlayerId}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-xs transition cursor-pointer whitespace-nowrap ${
                        loading
                          ? 'bg-[#5D94F8] cursor-not-allowed'
                          : 'bg-[#155DFC] hover:bg-[#1447E6] active:scale-95'
                      }`}
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Comprando..
                        </>
                      ) : errorState?.type === 'network' ? (
                        <>
                          <RotateCw className="w-3.5 h-3.5" />
                          Tentar de novo
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-3.5 h-3.5" />
                          Confirmar compra
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
