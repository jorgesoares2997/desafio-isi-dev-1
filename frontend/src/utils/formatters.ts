import { PlayerCondition, PlayerPosition } from '../types';

export function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDateTime(isoString: string | undefined | null): string {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
}

export function getPositionBadgeClass(position: PlayerPosition | string): string {
  switch (position) {
    case 'GOL':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    case 'ZAG':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    case 'LAT':
      return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
    case 'MEI':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    case 'ATA':
      return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    default:
      return 'bg-zinc-800 text-zinc-300 border-zinc-700';
  }
}

export function getConditionBadgeClass(condition: PlayerCondition | string): string {
  switch (condition) {
    case 'APTO':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    case 'MAL_CONDICIONADO':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    case 'DOENTE':
      return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    default:
      return 'bg-zinc-800 text-zinc-300 border-zinc-700';
  }
}

export function getConditionLabel(condition: PlayerCondition | string): string {
  switch (condition) {
    case 'APTO':
      return 'Apto';
    case 'MAL_CONDICIONADO':
      return 'Mal Condicionado (-15%)';
    case 'DOENTE':
      return 'Doente (Inapto)';
    default:
      return condition;
  }
}

export const formatConditionLabel = getConditionLabel;
