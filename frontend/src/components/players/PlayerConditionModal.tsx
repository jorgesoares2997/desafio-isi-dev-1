import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { api, getApiErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Player, PlayerCondition } from '../../types';
import { Lock } from 'lucide-react';

interface PlayerConditionModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  onSuccess: (updated: Player) => void;
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
      // Default to next valid condition if current is DOENTE
      if (player.condition === 'DOENTE') {
        setCondition('MAL_CONDICIONADO');
      } else {
        setCondition(player.condition);
      }
    }
  }, [player]);

  if (!player) return null;

  const isCurrentDoente = player.condition === 'DOENTE';

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
      title="Alterar condição física"
      description="A condição muda o desconto do valor de mercado, recalculado ao salvar."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Player Header Card */}
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
            {player.condition === 'APTO' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#00813A] border border-emerald-200 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00813A]" />
                Apto
              </span>
            )}
            {player.condition === 'MAL_CONDICIONADO' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-[#B45309] border border-amber-200 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                Mal condicionado
              </span>
            )}
            {player.condition === 'DOENTE' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 text-[#E40016] border border-rose-200 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E40016]" />
                Doente
              </span>
            )}
          </div>
        </div>

        {/* 3 Radio Options */}
        <div className="space-y-2.5">
          {/* Option 1: Apto */}
          <div
            onClick={() => !isCurrentDoente && setCondition('APTO')}
            className={`flex items-start gap-3 p-3.5 rounded-2xl border transition ${
              isCurrentDoente
                ? 'border-[#E4E4E7] bg-white text-zinc-400 opacity-60 cursor-not-allowed'
                : condition === 'APTO'
                ? 'border-[#155DFC] bg-blue-50/15 shadow-2xs cursor-pointer'
                : 'border-[#E4E4E7] bg-white hover:border-zinc-300 cursor-pointer'
            }`}
          >
            <div className="mt-0.5">
              <input
                type="radio"
                name="condition"
                value="APTO"
                disabled={isCurrentDoente}
                checked={condition === 'APTO'}
                onChange={() => setCondition('APTO')}
                className="w-4 h-4 text-[#155DFC] border-zinc-300 focus:ring-0 cursor-pointer"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-zinc-900">Apto</span>
                {player.condition === 'APTO' && (
                  <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 text-[10px] font-medium">
                    Atual
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#686872] mt-0.5">
                Sem desconto por condição.
              </p>
              {isCurrentDoente && (
                <div className="flex items-center gap-1 text-[11px] text-[#686872] mt-1">
                  <Lock className="w-3 h-3 text-zinc-400" />
                  <span>De Doente não passa direto para Apto.</span>
                </div>
              )}
            </div>
          </div>

          {/* Option 2: Mal condicionado */}
          <div
            onClick={() => setCondition('MAL_CONDICIONADO')}
            className={`flex items-start gap-3 p-3.5 rounded-2xl border transition cursor-pointer ${
              condition === 'MAL_CONDICIONADO'
                ? 'border-[#155DFC] bg-blue-50/15 shadow-2xs'
                : 'border-[#E4E4E7] bg-white hover:border-zinc-300'
            }`}
          >
            <div className="mt-0.5">
              <input
                type="radio"
                name="condition"
                value="MAL_CONDICIONADO"
                checked={condition === 'MAL_CONDICIONADO'}
                onChange={() => setCondition('MAL_CONDICIONADO')}
                className="w-4 h-4 text-[#155DFC] border-zinc-300 focus:ring-0 cursor-pointer"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-zinc-900">Mal condicionado</span>
                {player.condition === 'MAL_CONDICIONADO' && (
                  <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 text-[10px] font-medium">
                    Atual
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#686872] mt-0.5 leading-relaxed">
                Desconto de 15%. Agilidade de 80 a 100 corta pela metade; de 1 a 30 soma 10 pontos.
              </p>
            </div>
          </div>

          {/* Option 3: Doente */}
          <div
            onClick={() => setCondition('DOENTE')}
            className={`flex items-start gap-3 p-3.5 rounded-2xl border transition cursor-pointer ${
              condition === 'DOENTE'
                ? 'border-[#155DFC] bg-blue-50/15 shadow-2xs'
                : 'border-[#E4E4E7] bg-white hover:border-zinc-300'
            }`}
          >
            <div className="mt-0.5">
              <input
                type="radio"
                name="condition"
                value="DOENTE"
                checked={condition === 'DOENTE'}
                onChange={() => setCondition('DOENTE')}
                className="w-4 h-4 text-[#155DFC] border-zinc-300 focus:ring-0 cursor-pointer"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-zinc-900">Doente</span>
                {player.condition === 'DOENTE' && (
                  <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 text-[10px] font-medium">
                    Atual
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#686872] mt-0.5 leading-relaxed">
                Desconto de 30%, com o mesmo ajuste de agilidade.
              </p>
            </div>
          </div>
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
            {loading ? 'Salvando...' : 'Salvar condição'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
