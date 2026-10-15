import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { api, getApiErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Player, PlayerPosition } from '../../types';

interface PlayerEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  onSuccess: (updated: Player) => void;
}

export const PlayerEditModal: React.FC<PlayerEditModalProps> = ({
  isOpen,
  onClose,
  player,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [position, setPosition] = useState<PlayerPosition>('MEI');
  const [age, setAge] = useState(20);
  const [agility, setAgility] = useState(70);

  useEffect(() => {
    if (player) {
      setName(player.name);
      setPosition(player.position);
      setAge(player.age);
      setAgility(player.agility);
    }
  }, [player]);

  if (!player) return null;

  const isLinkedToClub = player.club_id !== null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (age < player.age) {
      showToast('error', `A idade atual (${player.age}) não pode ser diminuída.`);
      return;
    }
    if (isLinkedToClub && position !== player.position) {
      showToast('error', 'Não é permitido alterar a posição de um jogador vinculado a um clube.');
      return;
    }

    setLoading(true);
    try {
      const resp = await api.put<Player>(`/players/${player.id}`, {
        name,
        position,
        agility,
        age,
      });
      showToast('success', `Atleta ${resp.data.name} atualizado com sucesso!`);
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
      title={`Editar Atleta: ${player.name}`}
      description="Atualize as informações cadastrais do atleta respeitando as restrições contratuais."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-zinc-700 mb-1">
            Nome Completo <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg px-3.5 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-[#155DFC] focus:bg-white transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-700 mb-1">
            Posição {isLinkedToClub && <span className="text-[#686872] font-normal">(Bloqueada por vínculo)</span>}
          </label>
          <select
            value={position}
            disabled={isLinkedToClub}
            onChange={(e) => setPosition(e.target.value as PlayerPosition)}
            className="w-full bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-[#155DFC] focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <option value="GOL">Goleiro (GOL)</option>
            <option value="ZAG">Zagueiro (ZAG)</option>
            <option value="LAT">Lateral (LAT)</option>
            <option value="MEI">Meio-campo (MEI)</option>
            <option value="ATA">Atacante (ATA)</option>
          </select>
          {isLinkedToClub && (
            <p className="text-[11px] text-amber-600 mt-1">
              Atletas com vínculo ativo a um clube não podem ter sua posição alterada.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Idade (Mínimo {player.age})
            </label>
            <input
              type="number"
              min={player.age}
              max={45}
              required
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-[#155DFC] focus:bg-white transition"
            />
            <p className="text-[11px] text-[#686872] mt-1">Regressão de idade proibida.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Agilidade (1 a {age >= 35 ? 85 : 100})
            </label>
            <input
              type="number"
              min={1}
              max={age >= 35 ? 85 : 100}
              required
              value={agility}
              onChange={(e) => setAgility(Number(e.target.value))}
              className="w-full bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-[#155DFC] focus:bg-white transition"
            />
          </div>
        </div>

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
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
