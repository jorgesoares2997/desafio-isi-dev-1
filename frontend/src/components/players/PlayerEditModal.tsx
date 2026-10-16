import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { api, getApiErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Player, PlayerPosition } from '../../types';
import { User, Lock, AlertCircle } from 'lucide-react';

interface PlayerEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  onSuccess: (updated: Player) => void;
}

const POSITIONS: { value: PlayerPosition; label: string; sub: string }[] = [
  { value: 'GOL', label: 'GOL', sub: 'Goleiro' },
  { value: 'ZAG', label: 'ZAG', sub: 'Zagueiro' },
  { value: 'LAT', label: 'LAT', sub: 'Lateral' },
  { value: 'MEI', label: 'MEI', sub: 'Meio-campo' },
  { value: 'ATA', label: 'ATA', sub: 'Atacante' },
];

export const PlayerEditModal: React.FC<PlayerEditModalProps> = ({
  isOpen,
  onClose,
  player,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);

  const [name, setName] = useState('');
  const [position, setPosition] = useState<PlayerPosition>('MEI');
  const [age, setAge] = useState<number | string>(20);
  const [agility, setAgility] = useState<number | string>(70);

  useEffect(() => {
    if (player) {
      setName(player.name);
      setPosition(player.position);
      setAge(player.age);
      setAgility(player.agility);
      setTouched(false);
    }
  }, [player]);

  if (!player) return null;

  const isLinkedToClub = player.club_id !== null;
  const numAge = Number(age);
  const numAgility = Number(agility);

  const formatNumber = (num: number) => {
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Validations
  const getNameError = () => {
    if (!name || name.trim().length === 0) return 'Informe o nome do jogador.';
    if (name.trim().length < 3 || name.trim().length > 100) return 'Use de 3 a 100 caracteres.';
    const words = name.trim().split(/\s+/);
    if (words.length < 2) return 'Use pelo menos duas palavras e sem números.';
    if (/\d/.test(name)) return 'Não use números no nome.';
    return null;
  };

  const getAgeError = () => {
    if (age === '' || isNaN(numAge)) return 'Informe a idade.';
    if (numAge < player.age) return `A idade não pode diminuir (atual: ${player.age}).`;
    if (numAge > 45) return 'A idade máxima permitida é 45 anos.';
    return null;
  };

  const getAgilityError = () => {
    if (agility === '' || isNaN(numAgility)) return 'Informe a agilidade.';
    const maxAgil = numAge >= 35 ? 85 : 100;
    if (numAgility < 1 || numAgility > maxAgil) {
      return `De 1 a 100 (até ${maxAgil} com 35 anos ou mais).`;
    }
    return null;
  };

  const nameError = getNameError();
  const ageError = getAgeError();
  const agilityError = getAgilityError();
  const hasErrors = Boolean(nameError || ageError || agilityError);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    if (hasErrors) {
      showToast('error', 'Corrija os campos destacados para salvar.');
      return;
    }

    if (isLinkedToClub && position !== player.position) {
      showToast('error', 'Não é permitido alterar a posição de um jogador vinculado a um clube.');
      return;
    }

    setLoading(true);
    try {
      const resp = await api.put<Player>(`/players/${player.id}`, {
        name: name.trim(),
        position,
        agility: numAgility,
        age: numAge,
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
      title="Editar jogador"
      description="Edite nome, posição, idade e agilidade. Os demais dados não mudam."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Campo Nome com ícone de User */}
        <div>
          <label className="block text-xs font-semibold text-zinc-900 mb-1">
            Nome
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full bg-white border rounded-xl pl-10 pr-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none transition ${
                touched && nameError
                  ? 'border-rose-500 focus:border-rose-600 bg-rose-50/10'
                  : 'border-[#E4E4E7] focus:border-[#155DFC]'
              }`}
            />
          </div>
          {touched && nameError ? (
            <div className="flex items-center gap-1 text-[11px] text-rose-600 mt-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{nameError}</span>
            </div>
          ) : (
            <p className="text-[11px] text-[#686872] mt-1">
              De 3 a 100 caracteres, com pelo menos duas palavras e sem números.
            </p>
          )}
        </div>

        {/* Posição Radio Cards */}
        <div>
          <label className="block text-xs font-semibold text-zinc-900 mb-1.5">
            Posição
          </label>
          <div className="grid grid-cols-5 gap-2">
            {POSITIONS.map((pos) => {
              const isSelected = position === pos.value;
              const isDisabled = isLinkedToClub && pos.value !== player.position;

              return (
                <button
                  type="button"
                  key={pos.value}
                  disabled={isDisabled}
                  onClick={() => !isDisabled && setPosition(pos.value)}
                  className={`flex flex-col items-center justify-center py-2 px-1.5 rounded-xl border text-center transition ${
                    isSelected
                      ? 'border-[#155DFC] bg-[#EFF6FF] text-[#155DFC] font-semibold shadow-2xs'
                      : isDisabled
                      ? 'border-[#E4E4E7] bg-zinc-50 text-zinc-300 cursor-not-allowed opacity-40'
                      : 'border-[#E4E4E7] bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 cursor-pointer'
                  }`}
                >
                  <span className="font-bold text-xs font-mono">{pos.label}</span>
                  <span className="text-[10px] text-[#686872] mt-0.5">{pos.sub}</span>
                </button>
              );
            })}
          </div>
          {isLinkedToClub && (
            <p className="text-[11px] text-[#686872] mt-1.5">
              Jogador com clube não muda de posição: as outras posições ficam desabilitadas.
            </p>
          )}
        </div>

        {/* Idade e Agilidade */}
        <div className="grid grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-zinc-900 mb-1">
              Idade
            </label>
            <input
              type="number"
              min={player.age}
              max={45}
              required
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className={`w-full bg-white border rounded-xl px-3.5 py-2 text-sm text-zinc-900 focus:outline-none transition ${
                touched && ageError
                  ? 'border-rose-500 focus:border-rose-600 bg-rose-50/10'
                  : 'border-[#E4E4E7] focus:border-[#155DFC]'
              }`}
            />
            {touched && ageError ? (
              <div className="flex items-center gap-1 text-[11px] text-rose-600 mt-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{ageError}</span>
              </div>
            ) : (
              <p className="text-[11px] text-[#686872] mt-1">
                De 16 a 45, sem diminuir (atual: {player.age}).
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-900 mb-1">
              Agilidade
            </label>
            <input
              type="number"
              min={1}
              max={numAge >= 35 ? 85 : 100}
              required
              value={agility}
              onChange={(e) => setAgility(e.target.value)}
              className={`w-full bg-white border rounded-xl px-3.5 py-2 text-sm text-zinc-900 focus:outline-none transition ${
                touched && agilityError
                  ? 'border-rose-500 focus:border-rose-600 bg-rose-50/10'
                  : 'border-[#E4E4E7] focus:border-[#155DFC]'
              }`}
            />
            {touched && agilityError ? (
              <div className="flex items-center gap-1 text-[11px] text-rose-600 mt-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{agilityError}</span>
              </div>
            ) : (
              <p className="text-[11px] text-[#686872] mt-1">
                De 1 a 100 (até 85 com 35 anos ou mais).
              </p>
            )}
          </div>
        </div>

        {/* Readonly info box com cadeado */}
        <div className="w-full bg-[#FAFAFA] border border-[#E4E4E7] rounded-xl px-3.5 py-2.5 text-xs text-[#686872] flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span>
            Não mudam depois do cadastro: valor base ({formatNumber(player.base_value)}), indicadores e potencial.
          </span>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E4E4E7]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#155DFC] hover:bg-[#1447E6] active:scale-95 disabled:opacity-50 text-white shadow-2xs transition cursor-pointer"
          >
            {loading ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
