import React, { useEffect } from 'react';
import { Player, Club } from '../../types';
import { 
  X, 
  Link as LinkIcon, 
  Tag, 
  BarChart2, 
  TrendingUp, 
  Edit3, 
  Heart, 
  ShoppingCart
} from 'lucide-react';

interface PlayerDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  clubs?: Club[];
  onEdit?: (player: Player) => void;
  onChangeCondition?: (player: Player) => void;
  onBuy?: (player: Player) => void;
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

export const PlayerDetailDrawer: React.FC<PlayerDetailDrawerProps> = ({
  isOpen,
  onClose,
  player,
  clubs = [],
  onEdit,
  onChangeCondition,
  onBuy,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !player) return null;

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
    <div className="fixed inset-0 z-50 flex justify-end select-none">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-zinc-950/20 backdrop-blur-xs animate-in fade-in duration-200"
      />

      {/* Slide-over Drawer - Idêntico à Imagem 2 */}
      <div className="relative z-10 w-full sm:w-[480px] bg-white border-l border-[#E4E4E7] h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
        
        {/* Conteúdo Superior */}
        <div className="p-6 space-y-6">
          
          {/* Header do Jogador com Avatar e Badges */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-full ${palette.bg} ${palette.text} font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs`}
              >
                {getInitials(player.name)}
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-zinc-900 leading-tight">
                  {player.name}
                </h2>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md border border-zinc-200 bg-white text-[11px] font-mono font-medium text-zinc-700">
                    {player.position}
                  </span>

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

                  {club ? (
                    <span className="inline-flex items-center gap-1 text-xs text-zinc-700 font-medium">
                      <span className="px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-600 font-mono text-[10px] font-bold">
                        {club.acronym}
                      </span>
                      {club.name}
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-500 font-normal">
                      Livre
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition -mr-1"
              aria-label="Fechar gaveta"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Grid 2x2 com os 4 Cards de Métricas */}
          <div className="grid grid-cols-2 gap-3">
            {/* Card 1: Valor de mercado */}
            <div className="p-3.5 bg-white border border-[#E4E4E7] rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-xs">Valor de mercado</span>
                <LinkIcon className="w-3.5 h-3.5 text-zinc-400" />
              </div>
              <div className="my-1.5 font-mono font-bold text-2xl text-zinc-900 tracking-tight">
                {formatNumber(player.market_value)}
              </div>
              <span className="text-[11px] text-[#686872]">
                Calculado automaticamente
              </span>
            </div>

            {/* Card 2: Valor base */}
            <div className="p-3.5 bg-white border border-[#E4E4E7] rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-xs">Valor base</span>
                <Tag className="w-3.5 h-3.5 text-zinc-400" />
              </div>
              <div className="my-1.5 font-mono font-bold text-2xl text-zinc-900 tracking-tight">
                {formatNumber(player.base_value)}
              </div>
              <span className="text-[11px] text-[#686872]">
                Calculado no cadastro
              </span>
            </div>

            {/* Card 3: Overall */}
            <div className="p-3.5 bg-white border border-[#E4E4E7] rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-xs">Overall</span>
                <BarChart2 className="w-3.5 h-3.5 text-zinc-400" />
              </div>
              <div className="my-1.5 font-mono font-bold text-2xl text-zinc-900 tracking-tight">
                {player.overall}
              </div>
              <span className="text-[11px] text-[#686872]">
                Calculado pela posição
              </span>
            </div>

            {/* Card 4: Potencial */}
            <div className="p-3.5 bg-white border border-[#E4E4E7] rounded-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-xs">Potencial</span>
                <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
              </div>
              <div className="my-1.5 font-mono font-bold text-2xl text-zinc-900 tracking-tight">
                {player.potential}
              </div>
              <span className="text-[11px] text-[#686872]">
                Informado no cadastro
              </span>
            </div>
          </div>

          {/* Seção Indicadores Técnicos */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900">
                Indicadores técnicos
              </h3>
              <span className="text-xs text-zinc-400">
                Escala de 1 a 99
              </span>
            </div>

            <div className="space-y-2">
              {attributes.map((attr) => (
                <div key={attr.label} className="flex items-center gap-3 text-xs">
                  <span className="w-20 text-xs text-[#686872]">{attr.label}</span>
                  <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden relative">
                    {/* Faixa mais clara até o potencial */}
                    <div 
                      className="h-full bg-blue-100 rounded-full absolute left-0 top-0"
                      style={{ width: `${Math.min(100, (player.potential / 99) * 100)}%` }}
                    />
                    {/* Faixa azul sólida do valor */}
                    <div 
                      className="h-full bg-[#155DFC] rounded-full relative z-10"
                      style={{ width: `${Math.min(100, (attr.value / 99) * 100)}%` }}
                    />
                  </div>
                  <span className="font-mono font-bold text-xs text-zinc-900 w-5 text-right">
                    {attr.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Legenda das barras */}
            <div className="flex items-center gap-4 pt-1.5 text-[11px] text-[#686872]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#155DFC]" />
                <span>Valor do atributo</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-blue-200" />
                <span>Até o potencial ({player.potential}), que nenhum atributo passa</span>
              </div>
            </div>
          </div>

          {/* Lista com Idade, Agilidade e Clube */}
          <div className="divide-y divide-[#E4E4E7] border-t border-b border-[#E4E4E7] py-1 text-xs">
            <div className="flex items-center justify-between py-2.5">
              <span className="text-[#686872]">Idade</span>
              <span className="font-medium text-zinc-900">{player.age} anos</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-[#686872]">Agilidade</span>
              <span className="font-mono font-medium text-zinc-900">{player.agility}</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-[#686872]">Clube</span>
              <span className="font-medium text-zinc-900">
                {club ? `${club.name} (${club.acronym})` : 'Livre'}
              </span>
            </div>
          </div>
        </div>

        {/* Rodapé com Botões de Ação */}
        <div className="p-6 border-t border-[#E4E4E7] bg-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(player);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E4E4E7] text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-zinc-500" />
                <span>Editar</span>
              </button>
            )}

            {onChangeCondition && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onChangeCondition(player);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E4E4E7] text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition cursor-pointer"
              >
                <Heart className="w-3.5 h-3.5 text-zinc-500" />
                <span>Alterar condição</span>
              </button>
            )}
          </div>

          {player.club_id === null && onBuy && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onBuy(player);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#155DFC] hover:bg-[#1447E6] active:scale-95 text-white font-semibold text-xs shadow-2xs transition cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Comprar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
