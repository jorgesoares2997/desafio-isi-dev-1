import React from 'react';
import { Modal } from '../common/Modal';
import { Player } from '../../types';
import { Check, Eye } from 'lucide-react';

interface PlayerSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  onViewDetails?: (player: Player) => void;
}

export const PlayerSuccessModal: React.FC<PlayerSuccessModalProps> = ({
  isOpen,
  onClose,
  player,
  onViewDetails,
}) => {
  if (!player) return null;

  const formatNumber = (num: number) => {
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getPositionLabel = (pos: string) => {
    switch (pos) {
      case 'GOL': return 'Goleiro';
      case 'ZAG': return 'Zagueiro';
      case 'LAT': return 'Lateral';
      case 'MEI': return 'Meio-campo';
      case 'ATA': return 'Atacante';
      default: return pos;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Jogador cadastrado"
      description={`${player.name} entrou livre e Apto. Valores em moedas, calculados pela API ao salvar.`}
      headerIcon={
        <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
          <Check className="w-4 h-4 stroke-[3]" />
        </div>
      }
      borderHeader={false}
      maxWidth="md"
    >
      <div className="space-y-4 pt-2">
        {/* Calculation Summary Card */}
        <div className="border border-[#E4E4E7] rounded-xl divide-y divide-[#E4E4E7] bg-white text-xs">
          {/* Valor Base */}
          <div className="flex items-center justify-between p-3.5">
            <div>
              <div className="font-semibold text-zinc-900">Valor base</div>
              <div className="text-[11px] text-[#686872] mt-0.5">
                Calculado no cadastro; não muda depois
              </div>
            </div>
            <div className="font-mono font-bold text-sm text-zinc-900">
              {formatNumber(player.base_value)}
            </div>
          </div>

          {/* Valor de Mercado */}
          <div className="flex items-center justify-between p-3.5">
            <div>
              <div className="font-semibold text-zinc-900">Valor de mercado</div>
              <div className="text-[11px] text-[#686872] mt-0.5">
                Com condição, agilidade e idade
              </div>
            </div>
            <div className="font-mono font-bold text-sm text-zinc-900">
              {formatNumber(player.market_value)}
            </div>
          </div>

          {/* Overall */}
          <div className="flex items-center justify-between p-3.5">
            <div>
              <div className="font-semibold text-zinc-900">Overall</div>
              <div className="text-[11px] text-[#686872] mt-0.5">
                Pelos pesos da posição {getPositionLabel(player.position)}
              </div>
            </div>
            <div className="font-mono font-bold text-sm text-zinc-900">
              {player.overall}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          {onViewDetails && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onViewDetails(player);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E4E4E7] text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-zinc-500" />
              Ver detalhes
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#155DFC] hover:bg-[#1447E6] active:scale-95 text-white shadow-2xs transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
};
