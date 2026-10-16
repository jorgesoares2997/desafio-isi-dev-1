import React, { useState, useEffect } from 'react';
import { api, getApiErrorMessage } from '../../services/api';
import { PlayerInClub, ClubDetail, SellResponse, LineupResponse } from '../../types';
import { formatDecimal } from '../../utils/formatters';
import { 
  X, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  RefreshCw, 
  ArrowLeftRight, 
  Check, 
  History 
} from 'lucide-react';

interface SellPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerInClub | null;
  club: ClubDetail;
  onSuccess: () => void;
  onViewHistory?: () => void;
}

interface ErrorState {
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

function formatFidelityDisplay(isoString?: string): string {
  if (!isoString) return '-';
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

export const SellPlayerModal: React.FC<SellPlayerModalProps> = ({
  isOpen,
  onClose,
  player,
  club,
  onSuccess,
  onViewHistory,
}) => {
  const [loading, setLoading] = useState(false);
  const [isStarter, setIsStarter] = useState(false);
  const [errorState, setErrorState] = useState<ErrorState | null>(null);
  const [sellResult, setSellResult] = useState<SellResponse | null>(null);

  // Check if player is a starter and reset state whenever modal opens
  useEffect(() => {
    if (isOpen && player) {
      setLoading(false);
      setErrorState(null);
      setSellResult(null);

      // Query lineup for starter status (RN19)
      api.get<LineupResponse>(`/clubs/${club.id}/lineup`)
        .then((res) => {
          const starter = res.data?.players?.some((p) => p.id === player.id) ?? false;
          setIsStarter(starter);
        })
        .catch(() => {
          setIsStarter(false);
        });
    }
  }, [isOpen, player, club.id]);

  if (!isOpen || !player) return null;

  const avatarPalette = getPlayerAvatar(player.name, player.id);
  const penaltyRate = player.contract?.penalty_rate ?? 0;
  const remainingDays = player.contract?.remaining_days ?? 0;

  const handleConfirmSell = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorState(null);

    try {
      const resp = await api.post<SellResponse>(`/players/${player.id}/sell`);
      setSellResult(resp.data);
      onSuccess();
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err);
      setErrorState({
        title: 'A venda foi recusada',
        message: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    setSellResult(null);
    onClose();
  };

  const handleGoToHistory = () => {
    setSellResult(null);
    onClose();
    onViewHistory?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-xl border border-zinc-200/80 w-full max-w-[540px] p-6 relative animate-scale-in">
        {/* Close Button (X) */}
        <button
          type="button"
          onClick={sellResult ? handleFinish : onClose}
          disabled={loading}
          aria-label="Fechar"
          className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-600 transition p-1 rounded-lg cursor-pointer disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        {/* State 2 & 3: Success State (Venda concluída) */}
        {sellResult ? (
          <div className="space-y-4">
            {/* Header */}
            <div>
              <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <h3 className="font-bold text-base text-zinc-900 mt-2">
                Venda concluída
              </h3>
              <p className="text-xs text-[#686872] mt-0.5">
                {sellResult.penalty === 0 && sellResult.remaining_days === 0
                  ? `${sellResult.player_name} voltou a ficar livre. A fidelidade já tinha terminado, então não houve multa.`
                  : isStarter
                  ? `${sellResult.player_name} voltou a ficar livre e saiu da escalação.`
                  : `${sellResult.player_name} voltou a ficar livre.`}
              </p>
            </div>

            {/* Receipt Table */}
            <div className="border border-[#E4E4E7] rounded-xl overflow-hidden divide-y divide-[#E4E4E7] text-xs">
              {/* Valor de compra */}
              <div className="p-3 flex items-center justify-between">
                <span className="text-zinc-800">Valor de compra</span>
                <span className="font-mono font-bold text-xs text-zinc-900">
                  {formatDecimal(sellResult.purchase_value ?? player.contract?.purchase_value ?? 0)}
                </span>
              </div>

              {/* Valor de venda */}
              <div className="p-3 flex items-center justify-between">
                <div>
                  <div className="text-zinc-800">Valor de venda</div>
                  <div className="text-[11px] text-[#686872]">Valor de mercado no momento da venda</div>
                </div>
                <div className="font-mono font-bold text-xs text-zinc-900">
                  {formatDecimal(sellResult.value)}
                </div>
              </div>

              {/* Dias restantes */}
              <div className="p-3 flex items-center justify-between">
                <span className="text-zinc-800">Dias restantes</span>
                <span className="font-mono font-bold text-xs text-zinc-900">
                  {sellResult.remaining_days ?? 0}
                </span>
              </div>

              {/* Multa */}
              <div className="p-3 flex items-center justify-between">
                <div>
                  <div className="text-zinc-800">Multa</div>
                  <div className="text-[11px] text-[#686872]">
                    {sellResult.penalty > 0
                      ? `${sellResult.penalty_rate ?? penaltyRate}% do valor de venda, com teto de 10,00`
                      : 'Fidelidade cumprida: sem multa'}
                  </div>
                </div>
                <div className="font-mono font-bold text-xs text-zinc-900">
                  {formatDecimal(sellResult.penalty)}
                </div>
              </div>

              {/* Lucro */}
              <div className="p-3 flex items-center justify-between">
                <span className="text-zinc-800">Lucro</span>
                <span
                  className={`font-mono font-bold text-xs ${
                    sellResult.profit > 0
                      ? 'text-emerald-600'
                      : sellResult.profit < 0
                      ? 'text-rose-600'
                      : 'text-zinc-900'
                  }`}
                >
                  {sellResult.profit > 0 ? `+${formatDecimal(sellResult.profit)}` : formatDecimal(sellResult.profit)}
                </span>
              </div>

              {/* Comissão */}
              <div className="p-3 flex items-center justify-between">
                <div>
                  <div className="text-zinc-800">Comissão</div>
                  <div className="text-[11px] text-[#686872]">
                    {sellResult.profit > 0
                      ? '10% do lucro até 10,00 + 20% do que passar'
                      : 'Sem lucro: sem comissão'}
                  </div>
                </div>
                <div className="font-mono font-bold text-xs text-zinc-900">
                  {formatDecimal(sellResult.fee)}
                </div>
              </div>

              {/* Crédito no caixa */}
              <div className="p-3 flex items-center justify-between">
                <div>
                  <div className="text-zinc-900 font-semibold">Crédito no caixa</div>
                  <div className="text-[11px] text-[#686872]">Valor de venda - multa - comissão</div>
                </div>
                <div className="font-mono font-bold text-xs text-zinc-900">
                  +{formatDecimal(sellResult.cash_change)}
                </div>
              </div>

              {/* Contrato */}
              <div className="p-3 flex items-center justify-between">
                <span className="text-zinc-800">Contrato</span>
                {sellResult.contract_status === 'RESCINDIDO' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    RESCINDIDO
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200 text-xs font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                    ENCERRADO
                  </span>
                )}
              </div>

              {/* Novo caixa do clube */}
              <div className="p-3 flex items-center justify-between">
                <span className="text-zinc-900 font-semibold">Novo caixa do {club.name}</span>
                <span className="font-mono font-bold text-xs text-zinc-900">
                  {formatDecimal(sellResult.club_cash ?? club.cash)}
                </span>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={handleGoToHistory}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-zinc-700 bg-white border border-[#E4E4E7] hover:bg-zinc-50 transition cursor-pointer"
              >
                <History className="w-3.5 h-3.5" />
                <span>Ver histórico</span>
              </button>

              <button
                type="button"
                onClick={handleFinish}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#155DFC] hover:bg-[#1447E6] transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        ) : (
          /* Form States: Confirmation (1), Error (4), Loading (5) */
          <div>
            {/* Header */}
            <div>
              <h3 className="font-bold text-base text-zinc-900">
                Vender {player.name}?
              </h3>
              <p className="text-xs text-[#686872] mt-0.5">
                O jogador sai do elenco do {club.name} e volta a ficar livre.
              </p>
            </div>

            {/* Error Banner (State 4) */}
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

            {/* Starter Warning Banner (State 1 & 5) */}
            {isStarter && (
              <div className="mt-4 p-3.5 rounded-xl bg-[#FFFBEB] border border-[#FEE685] flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-semibold text-[#92400E]">
                    {player.name} é titular
                  </div>
                  <div className="text-[#B45309] mt-0.5 leading-relaxed">
                    Ao vender, ele sai da escalação, e o {club.name} só volta a jogar partidas depois de escalar de novo os 5 titulares.
                  </div>
                </div>
              </div>
            )}

            {/* Player Summary Card */}
            <div className="mt-4 bg-white border border-[#E4E4E7] rounded-xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full ${avatarPalette.bg} ${avatarPalette.text} flex items-center justify-center font-bold text-xs shrink-0 select-none`}>
                  {getPlayerInitials(player.name)}
                </div>
                <div>
                  <div className="font-semibold text-zinc-900 text-xs leading-tight">
                    {player.name}
                  </div>
                  <div className="text-[11px] text-[#686872] mt-0.5">
                    {player.position} · {getPositionFullName(player.position)} · {player.age} anos
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] text-[#686872]">
                  Valor de mercado
                </div>
                <div className="font-mono font-bold text-base text-zinc-900">
                  {formatDecimal(player.market_value)}
                </div>
              </div>
            </div>

            {/* Financial Details Table */}
            <div className="mt-4 border border-[#E4E4E7] rounded-xl overflow-hidden divide-y divide-[#E4E4E7] text-xs">
              <div className="p-3 flex items-center justify-between">
                <span className="text-zinc-800">Valor de compra</span>
                <span className="font-mono font-bold text-xs text-zinc-900">
                  {formatDecimal(player.contract?.purchase_value ?? 0)}
                </span>
              </div>

              <div className="p-3 flex items-center justify-between">
                <span className="text-zinc-800">Fim da fidelidade</span>
                <span className="font-mono font-bold text-xs text-zinc-900">
                  {formatFidelityDisplay(player.contract?.loyalty_until)}
                </span>
              </div>

              <div className="p-3 flex items-center justify-between">
                <span className="text-zinc-800">Dias restantes</span>
                <span className="font-mono font-bold text-xs text-zinc-900">
                  {remainingDays}
                </span>
              </div>

              <div className="p-3 flex items-center justify-between">
                <span className="text-zinc-800">% de multa se vender agora</span>
                {penaltyRate > 0 ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-mono font-bold text-xs">
                    {penaltyRate}%
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-bold text-xs">
                    ✓ 0%
                  </span>
                )}
              </div>
            </div>

            {/* Info Box 1 */}
            <div className="mt-4 p-3 rounded-xl bg-zinc-50 border border-[#E4E4E7] flex items-start gap-2 text-xs text-[#686872]">
              <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
              <span>
                A venda é pelo valor de mercado do momento. Multa (teto de 10,00), lucro, comissão e crédito são calculados ao confirmar.
              </span>
            </div>

            {/* Info Box 2: Extra notice when loading (State 5) */}
            {loading && (
              <div className="mt-3 p-3 rounded-xl bg-zinc-50 border border-[#E4E4E7] flex items-center gap-2 text-xs text-[#686872] animate-fade-in">
                <Info className="w-4 h-4 text-zinc-400 shrink-0" />
                <span>Enviando a venda. Os botões ficam desabilitados até a resposta.</span>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="mt-5 pt-4 border-t border-[#E4E4E7] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-zinc-700 bg-white border border-[#E4E4E7] hover:bg-zinc-50 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleConfirmSell}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-xs transition cursor-pointer whitespace-nowrap ${
                  loading
                    ? 'bg-[#5D94F8] cursor-not-allowed'
                    : 'bg-[#155DFC] hover:bg-[#1447E6] active:scale-95'
                }`}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Vendendo...
                  </>
                ) : (
                  <>
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    Confirmar venda
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
