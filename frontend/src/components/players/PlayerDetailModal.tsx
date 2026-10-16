import React from 'react';
import { Modal } from '../common/Modal';
import { Player, Club } from '../../types';
import { 
  Shield, 
  SlidersHorizontal,
  ShoppingCart
} from 'lucide-react';

interface PlayerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  clubs?: Club[];
  onBuy?: (player: Player) => void;
  onEdit?: (player: Player) => void;
  onChangeCondition?: (player: Player) => void;
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

export const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({
  isOpen,
  onClose,
  player,
  clubs = [],
  onBuy,
}) => {
  if (!player) return null;

  const formatNumber = (num: number) => {
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

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

  const club = player.club_id ? clubs.find((c) => c.id === player.club_id) : null;
  const palette = getAvatarColor(player.name);

  const attributes = [
    { label: 'Velocidade', value: player.pace },
    { label: 'Finalização', value: player.shooting },
    { label: 'Passe', value: player.passing },
    { label: 'Drible', value: player.dribbling },
    { label: 'Defesa', value: player.defending },
    { label: 'Físico', value: player.physical },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalhes do Jogador"
      description="Perfil completo, indicadores técnicos e situação contratual."
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Header Profile Card */}
        <div className="flex items-center justify-between p-4 bg-[#FAFAFA] border border-[#E4E4E7] rounded-2xl">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-full ${palette.bg} ${palette.text} font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs`}
            >
              {getInitials(player.name)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-zinc-900 text-base leading-tight">
                  {player.name}
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md border border-zinc-200 bg-white text-[11px] font-mono font-medium text-zinc-700">
                  {player.position}
                </span>
              </div>
              <p className="text-xs text-[#686872] mt-0.5">
                {getPositionLabel(player.position)} · {player.age} anos · Agilidade {player.agility}
              </p>
            </div>
          </div>

          {/* Condition Badge */}
          <div>
            {player.condition === 'APTO' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#00813A] border border-emerald-200 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00813A]" />
                Apto
              </span>
            )}
            {player.condition === 'MAL_CONDICIONADO' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-[#B45309] border border-amber-200 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                Mal condicionado
              </span>
            )}
            {player.condition === 'DOENTE' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-[#E40016] border border-rose-200 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E40016]" />
                Doente
              </span>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 bg-white border border-[#E4E4E7] rounded-xl">
            <span className="text-[11px] text-[#686872] block">Overall</span>
            <span className="text-xl font-bold text-zinc-900 font-mono mt-0.5 block">
              {player.overall}
            </span>
          </div>

          <div className="p-3 bg-white border border-[#E4E4E7] rounded-xl">
            <span className="text-[11px] text-[#686872] block">Potencial</span>
            <span className="text-xl font-bold text-[#155DFC] font-mono mt-0.5 block">
              {player.potential}
            </span>
          </div>

          <div className="p-3 bg-white border border-[#E4E4E7] rounded-xl">
            <span className="text-[11px] text-[#686872] block">Valor Base</span>
            <span className="text-sm font-semibold text-[#686872] font-mono mt-1.5 block">
              R$ {formatNumber(player.base_value)}
            </span>
          </div>

          <div className="p-3 bg-white border border-[#E4E4E7] rounded-xl">
            <span className="text-[11px] text-[#686872] block">Valor de Mercado</span>
            <span className="text-sm font-bold text-zinc-900 font-mono mt-1.5 block">
              R$ {formatNumber(player.market_value)}
            </span>
          </div>
        </div>

        {/* Technical Attributes Progress */}
        <div className="p-4 bg-[#FAFAFA] border border-[#E4E4E7] rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-800">
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-4 h-4 text-[#155DFC]" />
              <span>Indicadores Técnicos (1 a 99)</span>
            </div>
            <span className="text-[11px] text-[#686872] font-normal">
              Potencial: <strong className="text-zinc-900">{player.potential}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
            {attributes.map((attr) => (
              <div key={attr.label} className="flex items-center gap-2 text-xs">
                <span className="w-20 text-[11px] text-[#686872] truncate">{attr.label}</span>
                <div className="flex-1 h-2 bg-zinc-200 rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-blue-100 rounded-full absolute left-0 top-0"
                    style={{ width: `${Math.min(100, (player.potential / 99) * 100)}%` }}
                  />
                  <div
                    className="h-full bg-[#155DFC] rounded-full relative z-10"
                    style={{ width: `${Math.min(100, (attr.value / 99) * 100)}%` }}
                  />
                </div>
                <span className="font-mono text-[11px] font-bold text-zinc-800 w-5 text-right">
                  {attr.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Club / Vinculo Info */}
        <div className="flex items-center justify-between p-3.5 bg-white border border-[#E4E4E7] rounded-xl text-xs">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-zinc-400" />
            <span className="text-[#686872]">Vínculo atual:</span>
            {club ? (
              <span className="font-semibold text-zinc-900">
                {club.name} ({club.acronym})
              </span>
            ) : (
              <span className="text-zinc-600 font-medium">Livre no mercado</span>
            )}
          </div>

          {!club && onBuy && (
            <button
              onClick={() => {
                onClose();
                onBuy(player);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#155DFC] hover:bg-[#1447E6] text-white font-semibold text-xs transition cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Comprar Atleta
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-[#E4E4E7]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-zinc-800 transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
};
