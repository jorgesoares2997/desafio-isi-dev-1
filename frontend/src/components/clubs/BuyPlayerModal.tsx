import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { api, getApiErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Club, Player, PagedResponse } from '../../types';
import { formatCurrency, getPositionBadgeClass } from '../../utils/formatters';
import { ShoppingCart, AlertCircle, CheckCircle2 } from 'lucide-react';

interface BuyPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  club: Club;
  onSuccess: () => void;
}

export const BuyPlayerModal: React.FC<BuyPlayerModalProps> = ({
  isOpen,
  onClose,
  club,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetchingPlayers, setFetchingPlayers] = useState(true);
  const [freePlayers, setFreePlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);

  // Default loyalty: 1 year from now
  const getDefaultLoyalty = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T12:00`;
  };

  const [loyaltyInput, setLoyaltyInput] = useState(getDefaultLoyalty());

  useEffect(() => {
    if (isOpen) {
      setFetchingPlayers(true);
      api
        .get<PagedResponse<Player>>('/players', { params: { free: 'true', limit: 50, sort: 'value_desc' } })
        .then((res) => {
          setFreePlayers(res.data.data);
          if (res.data.data.length > 0) {
            setSelectedPlayerId(res.data.data[0].id);
          }
        })
        .catch((err) => {
          showToast('error', getApiErrorMessage(err));
        })
        .finally(() => {
          setFetchingPlayers(false);
        });
    }
  }, [isOpen, showToast]);

  const selectedPlayer = freePlayers.find((p) => p.id === selectedPlayerId);

  // Calculation breakdown
  const marketValue = selectedPlayer?.market_value ?? 0;
  const fee = marketValue > 30 ? Math.round(marketValue * 0.05 * 100) / 100 : 0;
  const totalCost = marketValue + fee;
  const maxAllowedCost = Math.round(club.cash * 0.5 * 100) / 100;
  const isAffordable = totalCost <= maxAllowedCost;

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerId || !selectedPlayer) return;

    if (!isAffordable) {
      showToast('error', `O custo total (${formatCurrency(totalCost)}) excede 50% do caixa disponível (${formatCurrency(maxAllowedCost)}).`);
      return;
    }

    setLoading(true);
    try {
      // Ensure ISO string with Brasília offset -03:00
      const loyaltyUntil = `${loyaltyInput}:00-03:00`;
      await api.post(`/players/${selectedPlayerId}/buy`, {
        club_id: club.id,
        loyalty_until: loyaltyUntil,
      });

      showToast(
        'success',
        `Atleta ${selectedPlayer.name} adquirido com sucesso por ${formatCurrency(marketValue)} (+ taxa de ${formatCurrency(fee)})!`
      );
      onSuccess();
      onClose();
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Comprar Atleta para ${club.name}`}
      description="Selecione um atleta livre no mercado e estipule a data de fidelidade contratual."
      maxWidth="lg"
    >
      <form onSubmit={handleBuy} className="space-y-4">
        {fetchingPlayers ? (
          <div className="py-8 text-center text-xs text-[#686872]">Carregando atletas livres...</div>
        ) : freePlayers.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#686872]">
            Nenhum atleta livre disponível no momento para transferência.
          </div>
        ) : (
          <>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Atleta Livre Disponível <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedPlayerId || ''}
                onChange={(e) => setSelectedPlayerId(Number(e.target.value))}
                className="w-full bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#155DFC] focus:bg-white transition"
              >
                {freePlayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.position}) · Overall: {p.overall} · {formatCurrency(p.market_value)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Término do Período de Fidelidade <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={loyaltyInput}
                onChange={(e) => setLoyaltyInput(e.target.value)}
                className="w-full bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg px-3.5 py-2 text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-[#155DFC] focus:bg-white transition"
              />
              <p className="text-[11px] text-[#686872] mt-1">
                Data futura com limite de até 1095 dias (3 anos). Horário de Brasília.
              </p>
            </div>

            {/* Financial Breakdown Preview */}
            {selectedPlayer && (
              <div className="p-4 rounded-xl bg-zinc-50 border border-[#E4E4E7] space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#E4E4E7]">
                  <span className="font-semibold text-zinc-800 flex items-center gap-1.5">
                    <span className={`px-1.5 py-0.5 rounded border text-[10px] font-mono ${getPositionBadgeClass(selectedPlayer.position)}`}>
                      {selectedPlayer.position}
                    </span>
                    {selectedPlayer.name}
                  </span>
                  <span className="font-mono text-zinc-800 font-semibold">{formatCurrency(marketValue)}</span>
                </div>

                <div className="flex justify-between text-[#686872]">
                  <span>Taxa de Transferência (5% se &gt; R$ 30,00):</span>
                  <span className="font-mono text-zinc-700">{formatCurrency(fee)}</span>
                </div>

                <div className="flex justify-between text-zinc-900 font-semibold pt-1 border-t border-[#E4E4E7]">
                  <span>Custo Total da Compra:</span>
                  <span className="font-mono text-[#155DFC] font-bold">{formatCurrency(totalCost)}</span>
                </div>

                <div className="flex justify-between text-[#686872] text-[11px]">
                  <span>Caixa Atual do Clube:</span>
                  <span className="font-mono text-zinc-700">{formatCurrency(club.cash)}</span>
                </div>

                <div className="flex justify-between text-[#686872] text-[11px]">
                  <span>Teto Máximo Permitido (50% do caixa):</span>
                  <span className="font-mono text-zinc-700">{formatCurrency(maxAllowedCost)}</span>
                </div>

                {!isAffordable ? (
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-[#9F0A0A] font-medium text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Bloqueado: O custo total excede o limite de 50% do caixa disponível.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-[#F0FDF4] border border-[#B9F8CF] text-[#016630] font-medium text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Operação aprovada pelo regulamento financeiro.</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E4E4E7]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-[#686872] hover:text-zinc-900 hover:bg-zinc-100 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !isAffordable || !selectedPlayerId}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold bg-[#155DFC] hover:bg-[#1447E6] disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-xs active:scale-95 transition"
              >
                <ShoppingCart className="w-4 h-4" />
                {loading ? 'Processando...' : 'Confirmar Compra'}
              </button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
};
