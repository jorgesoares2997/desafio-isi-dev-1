import { describe, it, expect } from 'vitest';
import { 
  formatCurrency, 
  formatDateTime, 
  getPositionBadgeClass, 
  getConditionBadgeClass, 
  getConditionLabel,
  formatConditionLabel 
} from '../utils/formatters';

describe('Formatters & Design Badges', () => {
  describe('formatCurrency', () => {
    it('formata valores em Real brasileiro com vírgula decimal e duas casas', () => {
      const formatted = formatCurrency(40);
      // Deve conter R$ e 40,00
      expect(formatted).toMatch(/R\$\s*40,00/);
    });

    it('retorna R$ 0,00 para valores nulos ou indefinidos', () => {
      expect(formatCurrency(null)).toMatch(/R\$\s*0,00/);
      expect(formatCurrency(undefined)).toMatch(/R\$\s*0,00/);
    });

    it('formata milhares com ponto separador', () => {
      const formatted = formatCurrency(1500000);
      expect(formatted).toMatch(/1\.500\.000,00/);
    });
  });

  describe('formatDateTime', () => {
    it('formata data ISO no fuso horário de Brasília (UTC-3)', () => {
      // 2026-10-15T15:30:00Z em UTC-3 deve ser 12:30
      const formatted = formatDateTime('2026-10-15T15:30:00Z');
      expect(formatted).toContain('15/10/2026');
      expect(formatted).toContain('12:30');
    });

    it('retorna traço para strings nulas ou vazias', () => {
      expect(formatDateTime(null)).toBe('-');
      expect(formatDateTime('')).toBe('-');
    });
  });

  describe('Badge Classes', () => {
    it('retorna classes de badge corretas para posições', () => {
      expect(getPositionBadgeClass('GOL')).toContain('text-amber-400');
      expect(getPositionBadgeClass('ZAG')).toContain('text-blue-400');
      expect(getPositionBadgeClass('LAT')).toContain('text-cyan-400');
      expect(getPositionBadgeClass('MEI')).toContain('text-emerald-400');
      expect(getPositionBadgeClass('ATA')).toContain('text-rose-400');
    });

    it('retorna classes de badge corretas para condições físicas', () => {
      expect(getConditionBadgeClass('APTO')).toContain('text-emerald-400');
      expect(getConditionBadgeClass('MAL_CONDICIONADO')).toContain('text-amber-400');
      expect(getConditionBadgeClass('DOENTE')).toContain('text-rose-400');
    });

    it('retorna rótulos em português com penalidades', () => {
      expect(getConditionLabel('APTO')).toBe('Apto');
      expect(getConditionLabel('MAL_CONDICIONADO')).toBe('Mal Condicionado (-15%)');
      expect(getConditionLabel('DOENTE')).toBe('Doente (Inapto)');
      expect(formatConditionLabel('APTO')).toBe('Apto');
    });
  });
});
