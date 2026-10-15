import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { api, getApiErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Club, Player } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { ShoppingCart, AlertCircle } from 'lucide-react';

interface QuickBuyModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  clubs: Club[];
  onSuccess: () => void;
}

export const QuickBuyModal: React.FC<QuickBuyModalProps> = ({
  isOpen,
  onClose,
  player,
  clubs,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedClubId, setSelectedClubId] = useState<number | null>(
    clubs.length > 0 ? clubs[0].id : null
  );

  // Default loyalty: 1 year from now
  const getDefaultLoyalty = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T12:00`;
  };

  const [loyaltyInput, setLoyaltyInput] = useState(getDefaultLoyalty());

  if (!player) return null;

  const selectedClub = clubs.find((c) => c.id === selectedClubId);
  const marketValue = player.market_value;
  const fee = marketValue > 30 ? Math.round(marketValue * 0.05 * 100) / 100 : 0;
  const totalCost = marketValue + fee;
  const maxAllowedCost = selectedClub ? Math.round(selectedClub.cash * 0.5 * 100) / 100 : 0;
  const isAffordable = selectedClub ? totalCost <= maxAllowedCost : false;

  const handleBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClubId || !selectedClub) {
      showToast('error', 'Selecione um clube comprador.');
      return;
    }

    if (!isAffordable) {
      showToast(
        'error',
        `O custo total (${formatCurrency(totalCost)}) excede 50% do caixa disponível do clube (${formatCurrency(maxAllowedCost)}).`
      );
      return;
    }

    setLoading(true);
    try {
      const loyaltyUntil = `${loyaltyInput}:00-03:00`;
      await api.post(`/players/${player.id}/buy`, {
        club_id: selectedClubId,
        loyalty_until: loyaltyUntil,
      });

      showToast(
        'success',
        `Atleta ${player.name} contratado com sucesso para ${selectedClub.name}!`
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
      title="Comprar Jogador Livre"
      description={`Contrate ${player.name} para reforçar o elenco de um dos clubes da liga.`}
      maxWidth="md"
    >
      <form onSubmit={handleBuy} className="space-y-4">
        {clubs.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#686872]">
            Nenhum clube cadastrado na liga. Cadastre um clube antes de realizar contratações.
          </div>
        ) : (
          <>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Clube Comprador <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedClubId || ''}
                onChange={(e) => setSelectedClubId(Number(e.target.value))}
                className="w-full bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:border-[#155DFC] focus:bg-white transition"
                required
              >
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.acronym}) — Caixa: {formatCurrency(c.cash)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Data de Fidelidade Contratual <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={loyaltyInput}
                onChange={(e) => setLoyaltyInput(e.target.value)}
                className="w-full bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg px-3 py-2 text-xs font-mono text-zinc-900 focus:outline-none focus:border-[#155DFC] focus:bg-white transition"
                required
              />
              <p className="text-[11px] text-[#686872] mt-1">
                Horário oficial de Brasília (UTC-3). Durante este período o atleta não poderá ser transferido.
              </p>
            </div>

            {/* Financial breakdown card */}
            {selectedClub && (
              <div className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex justify-between text-zinc-600">
                  <span>Valor de Mercado do Atleta:</span>
                  <span className="font-mono font-medium">{formatCurrency(marketValue)}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Taxa da Federação (5% se &gt; 30):</span>
                  <span className="font-mono font-medium">{formatCurrency(fee)}</span>
                </div>
                <div className="border-t border-[#E4E4E7] pt-2 flex justify-between font-semibold text-zinc-900">
                  <span>Custo Total do Contrato:</span>
                  <span className="font-mono text-[#155DFC]">{formatCurrency(totalCost)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-[#686872] pt-1">
                  <span>Teto permitido (50% do caixa de {selectedClub.name}):</span>
                  <span className="font-mono">{formatCurrency(maxAllowedCost)}</span>
                </div>

                {!isAffordable && (
                  <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 p-2.5 rounded-lg text-xs mt-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      O valor total excede o teto de 50% do caixa do clube. A contratação violaria as regras financeiras da liga.
                    </span>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E4E4E7]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[#E4E4E7] text-zinc-700 hover:bg-zinc-100 text-xs font-semibold transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || clubs.length === 0 || !isAffordable}
            className="flex items-center gap-2 bg-[#155DFC] hover:bg-[#1447E6] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <ShoppingCart className="w-4 h-4" />
            {loading ? 'Processando...' : 'Confirmar Compra'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
