import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { api, getApiErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { PlayerInClub, ClubDetail, SellResponse } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { ArrowDownRight, AlertTriangle } from 'lucide-react';

interface SellPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerInClub | null;
  club: ClubDetail;
  onSuccess: () => void;
}

export const SellPlayerModal: React.FC<SellPlayerModalProps> = ({
  isOpen,
  onClose,
  player,
  club,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sellResult, setSellResult] = useState<SellResponse | null>(null);

  if (!player) return null;

  const handleSell = async () => {
    setLoading(true);
    try {
      const resp = await api.post<SellResponse>(`/players/${player.id}/sell`);
      setSellResult(resp.data);
      showToast('success', `Atleta ${player.name} vendido com sucesso!`);
      onSuccess();
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    setSellResult(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={sellResult ? handleFinish : onClose}
      title={sellResult ? 'Resumo Financeiro da Venda' : `Vender Atleta: ${player.name}`}
      description={
        sellResult
          ? `Liquidação consolidada do atleta no clube ${club.name} (${club.acronym}).`
          : `Confirme a venda do jogador do elenco do ${club.name} e a apuração das multas rescisórias e comissões.`
      }
      maxWidth="md"
    >
      {sellResult ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5 text-xs">
            <div className="flex justify-between pb-2 border-b border-zinc-800 font-semibold text-white">
              <span>Atleta Vendido:</span>
              <span>{sellResult.player_name}</span>
            </div>

            <div className="flex justify-between text-zinc-300">
              <span>Valor de Mercado Obtido:</span>
              <span className="font-mono text-emerald-400 font-semibold">
                {formatCurrency(sellResult.value)}
              </span>
            </div>

            <div className="flex justify-between text-zinc-400">
              <span>Multa Rescisória (RN15, máx R$ 10,00):</span>
              <span className="font-mono text-rose-400">
                - {formatCurrency(sellResult.penalty)}
              </span>
            </div>

            <div className="flex justify-between text-zinc-400">
              <span>Comissão Progressiva sobre Lucro (RN16):</span>
              <span className="font-mono text-amber-400">
                - {formatCurrency(sellResult.fee)}
              </span>
            </div>

            <div className="flex justify-between text-zinc-400">
              <span>Lucro Bruto Apurado:</span>
              <span className="font-mono">
                {formatCurrency(sellResult.profit ?? 0)}
              </span>
            </div>

            <div className="flex justify-between text-zinc-100 font-bold pt-2 border-t border-zinc-800 text-sm">
              <span>Variação Líquida de Caixa:</span>
              <span className="font-mono text-emerald-400">
                + {formatCurrency(sellResult.cash_change)}
              </span>
            </div>

            <div className="flex justify-between text-zinc-400 text-[11px] pt-1">
              <span>Novo Caixa do Clube:</span>
              <span className="font-mono font-medium text-white">
                {formatCurrency(sellResult.club_cash)}
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleFinish}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 active:scale-95 transition"
            >
              Concluir
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
            <div className="flex justify-between text-zinc-300">
              <span>Posição:</span>
              <span className="font-mono font-semibold">{player.position}</span>
            </div>
            <div className="flex justify-between text-zinc-300">
              <span>Overall:</span>
              <span className="font-mono font-semibold">{player.overall}</span>
            </div>
            <div className="flex justify-between text-zinc-300">
              <span>Valor de Mercado Atual:</span>
              <span className="font-mono text-emerald-400 font-semibold">
                {formatCurrency(player.market_value)}
              </span>
            </div>
            {player.contract && (
              <>
                <div className="flex justify-between text-zinc-400">
                  <span>Fidelidade Contratual até:</span>
                  <span className="font-mono">{formatDateTime(player.contract.loyalty_until)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Dias Restantes:</span>
                  <span className="font-mono">{player.contract.remaining_days} dias</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Taxa de Multa Rescisória:</span>
                  <span className="font-mono text-amber-400">{player.contract.penalty_rate}%</span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Ao confirmar a venda, o atleta será desvinculado de qualquer escalação titular ativa e o contrato passará para situação RESCINDIDO ou ENCERRADO.
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleSell}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/20 active:scale-95 transition"
            >
              <ArrowDownRight className="w-4 h-4" />
              {loading ? 'Vendendo...' : 'Confirmar Venda'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};
