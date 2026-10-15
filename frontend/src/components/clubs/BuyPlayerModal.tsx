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
          <div className="py-8 text-center text-xs text-zinc-400">Carregando atletas livres...</div>
        ) : freePlayers.length === 0 ? (
          <div className="py-6 text-center text-xs text-zinc-400">
            Nenhum atleta livre disponível no momento para transferência.
          </div>
        ) : (
          <>
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Atleta Livre Disponível <span className="text-rose-400">*</span>
              </label>
              <select
                value={selectedPlayerId || ''}
                onChange={(e) => setSelectedPlayerId(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
              >
                {freePlayers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.position}) · Overall: {p.overall} · {formatCurrency(p.market_value)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Término do Período de Fidelidade <span className="text-rose-400">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={loyaltyInput}
                onChange={(e) => setLoyaltyInput(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Data futura com limite de até 1095 dias (3 anos). Horário de Brasília.
              </p>
            </div>

            {/* Financial Breakdown Preview */}
            {selectedPlayer && (
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <span className="font-medium text-zinc-300 flex items-center gap-1.5">
                    <span className={`px-1.5 py-0.5 rounded border text-[10px] font-mono ${getPositionBadgeClass(selectedPlayer.position)}`}>
                      {selectedPlayer.position}
                    </span>
                    {selectedPlayer.name}
                  </span>
                  <span className="font-mono text-zinc-200">{formatCurrency(marketValue)}</span>
                </div>

                <div className="flex justify-between text-zinc-400">
                  <span>Taxa de Transferência (5% se &gt; R$ 30,00):</span>
                  <span className="font-mono">{formatCurrency(fee)}</span>
                </div>

                <div className="flex justify-between text-zinc-100 font-semibold pt-1 border-t border-zinc-800/60">
                  <span>Custo Total da Compra:</span>
                  <span className="font-mono text-emerald-400">{formatCurrency(totalCost)}</span>
                </div>

                <div className="flex justify-between text-zinc-400 text-[11px]">
                  <span>Caixa Atual do Clube:</span>
                  <span className="font-mono">{formatCurrency(club.cash)}</span>
                </div>

                <div className="flex justify-between text-zinc-400 text-[11px]">
                  <span>Teto Máximo Permitido (50% do caixa):</span>
                  <span className="font-mono">{formatCurrency(maxAllowedCost)}</span>
                </div>

                {!isAffordable ? (
                  <div className="flex items-start gap-2 pt-2 text-rose-400 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Bloqueado: O custo total excede o limite de 50% do caixa disponível.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 pt-1 text-emerald-400 font-medium text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Operação aprovada pelo regulamento financeiro.</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !isAffordable || !selectedPlayerId}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-lg shadow-emerald-500/20 active:scale-95 transition"
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
