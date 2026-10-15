import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { api, getApiErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Player } from '../../types';
import { AlertCircle } from 'lucide-react';

interface PlayerDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  onSuccess: (deletedId: number) => void;
}

export const PlayerDeleteModal: React.FC<PlayerDeleteModalProps> = ({
  isOpen,
  onClose,
  player,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  if (!player) return null;

  const handleDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/players/${player.id}`);
      showToast('success', `Atleta ${player.name} excluído logicamente com sucesso.`);
      onSuccess(player.id);
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
      title="Excluir Atleta"
      description="Esta ação realizará a exclusão lógica do jogador do sistema."
      maxWidth="sm"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-[#9F0A0A] text-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-[#E40016]" />
          <div>
            Você tem certeza que deseja excluir o atleta{' '}
            <strong className="text-zinc-900">{player.name}</strong>?
            <p className="mt-1 text-[#686872]">
              Apenas atletas livres de vínculo contratual podem ser excluídos.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E4E4E7]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-[#686872] hover:text-zinc-900 hover:bg-zinc-100 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleDelete}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#E40016] hover:bg-rose-700 text-white shadow-xs active:scale-95 transition"
          >
            {loading ? 'Excluindo...' : 'Confirmar Exclusão'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
