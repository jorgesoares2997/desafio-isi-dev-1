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
      return 'bg-amber-50 text-amber-800 dark:text-amber-400 border border-amber-200';
    case 'ZAG':
      return 'bg-blue-50 text-blue-800 dark:text-blue-400 border border-blue-200';
    case 'LAT':
      return 'bg-cyan-50 text-cyan-800 dark:text-cyan-400 border border-cyan-200';
    case 'MEI':
      return 'bg-emerald-50 text-emerald-800 dark:text-emerald-400 border border-emerald-200';
    case 'ATA':
      return 'bg-rose-50 text-rose-800 dark:text-rose-400 border border-rose-200';
    default:
      return 'bg-zinc-100 text-zinc-700 border border-zinc-200';
  }
}

export function getConditionBadgeClass(condition: PlayerCondition | string): string {
  switch (condition) {
    case 'APTO':
      return 'bg-emerald-50 text-emerald-800 dark:text-emerald-400 border border-emerald-200';
    case 'MAL_CONDICIONADO':
      return 'bg-amber-50 text-amber-800 dark:text-amber-400 border border-amber-200';
    case 'DOENTE':
      return 'bg-rose-50 text-rose-800 dark:text-rose-400 border border-rose-200';
    default:
      return 'bg-zinc-100 text-zinc-700 border border-zinc-200';
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
