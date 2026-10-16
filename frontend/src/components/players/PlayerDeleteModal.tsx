import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { api, getApiErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Player } from '../../types';
import { Trash2 } from 'lucide-react';

interface PlayerDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  onSuccess: (deletedPlayer: Player) => void;
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

export const PlayerDeleteModal: React.FC<PlayerDeleteModalProps> = ({
  isOpen,
  onClose,
  player,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  if (!player) return null;

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
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

  const palette = getAvatarColor(player.name);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/players/${player.id}`);
      showToast(
        'success',
        `${player.name} saiu da lista. Transações e partidas antigas dele continuam gravadas.`,
        'Jogador excluído'
      );
      onSuccess(player);
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
      title={`Excluir ${player.name}?`}
      description="O jogador sai da lista e da busca, mas as transações e as partidas antigas dele continuam como foram gravadas."
      maxWidth="md"
    >
      <div className="space-y-5 pt-1">
        {/* Card Central do Jogador - Idêntico à Imagem 3 */}
        <div className="flex items-center justify-between p-3.5 bg-white border border-[#E4E4E7] rounded-2xl">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-full ${palette.bg} ${palette.text} font-bold text-xs flex items-center justify-center shrink-0 select-none`}
            >
              {getInitials(player.name)}
            </div>
            <div>
              <div className="font-semibold text-zinc-900 text-sm leading-tight">
                {player.name}
              </div>
              <div className="text-xs text-[#686872] mt-0.5">
                {player.position} · {getPositionLabel(player.position)} · {player.age} anos
              </div>
            </div>
          </div>

          <div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md border border-[#E4E4E7] bg-white text-xs font-medium text-zinc-700">
              Livre
            </span>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E4E4E7]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#E40016] hover:bg-rose-700 active:scale-95 text-white shadow-2xs transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{loading ? 'Excluindo...' : 'Excluir jogador'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
