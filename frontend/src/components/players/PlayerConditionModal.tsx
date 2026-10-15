import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { api, getApiErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Player, PlayerCondition } from '../../types';
import { AlertTriangle } from 'lucide-react';

interface PlayerConditionModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  onSuccess: (updated: Player) => void;
}

export const PlayerConditionModal: React.FC<PlayerConditionModalProps> = ({
  isOpen,
  onClose,
  player,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [condition, setCondition] = useState<PlayerCondition>('APTO');

  useEffect(() => {
    if (player) {
      setCondition(player.condition);
    }
  }, [player]);

  if (!player) return null;

  const isCurrentDoente = player.condition === 'DOENTE';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCurrentDoente && condition === 'APTO') {
      showToast('error', 'A transição direta de DOENTE para APTO é proibida pelo regulamento.');
      return;
    }

    setLoading(true);
    try {
      const resp = await api.patch<Player>(`/players/${player.id}/condition`, {
        condition,
      });
      showToast('success', `Condição física do atleta atualizada para: ${condition}`);
      onSuccess(resp.data);
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
      title={`Condição Física: ${player.name}`}
      description={`Condição atual: ${player.condition}. Defina o novo estado físico do atleta.`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-700 mb-2">
            Selecione a Nova Condição
          </label>
          <div className="grid grid-cols-1 gap-2.5">
            <label
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                condition === 'APTO'
                  ? 'bg-[#F0FDF4] border-[#B9F8CF] text-[#016630]'
                  : 'bg-white border-[#E4E4E7] text-zinc-800 hover:bg-zinc-50'
              } ${isCurrentDoente ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <input
                type="radio"
                name="condition"
                value="APTO"
                disabled={isCurrentDoente}
                checked={condition === 'APTO'}
                onChange={() => setCondition('APTO')}
                className="mt-1"
              />
              <div>
                <span className="font-semibold text-sm block">Apto</span>
                <span className="text-xs text-[#686872]">
                  Sem penalidades. Valor de mercado pleno (100%).
                </span>
                {isCurrentDoente && (
                  <span className="text-[11px] text-[#9F0A0A] font-medium block mt-1">
                    Bloqueado: Atleta doente deve transitar antes para Mal Condicionado.
                  </span>
                )}
              </div>
            </label>

            <label
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                condition === 'MAL_CONDICIONADO'
                  ? 'bg-[#FFFBEB] border-[#FEE685] text-[#953D00]'
                  : 'bg-white border-[#E4E4E7] text-zinc-800 hover:bg-zinc-50'
              }`}
            >
              <input
                type="radio"
                name="condition"
                value="MAL_CONDICIONADO"
                checked={condition === 'MAL_CONDICIONADO'}
                onChange={() => setCondition('MAL_CONDICIONADO')}
                className="mt-1"
              />
              <div>
                <span className="font-semibold text-sm block">Mal Condicionado</span>
                <span className="text-xs text-[#686872]">
                  Desconto de 15% no valor de mercado e redução de 15% nos duelos da partida.
                </span>
              </div>
            </label>

            <label
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                condition === 'DOENTE'
                  ? 'bg-[#FEF2F2] border-[#FECACA] text-[#9F0A0A]'
                  : 'bg-white border-[#E4E4E7] text-zinc-800 hover:bg-zinc-50'
              }`}
            >
              <input
                type="radio"
                name="condition"
                value="DOENTE"
                checked={condition === 'DOENTE'}
                onChange={() => setCondition('DOENTE')}
                className="mt-1"
              />
              <div>
                <span className="font-semibold text-sm block">Doente</span>
                <span className="text-xs text-[#686872]">
                  Desconto de 30% no valor de mercado. Inapto para escalações e partidas.
                </span>
              </div>
            </label>
          </div>
        </div>

        {condition === 'DOENTE' && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#FFFBEB] border border-[#FEE685] text-[#953D00] text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <strong>Atenção (RN19):</strong> Caso este atleta seja titular em algum clube, ele será imediatamente desvinculado da escalação ativa.
            </span>
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
            disabled={loading}
            className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-[#155DFC] hover:bg-[#1447E6] text-white shadow-xs active:scale-95 transition"
          >
            {loading ? 'Atualizando...' : 'Confirmar Condição'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
