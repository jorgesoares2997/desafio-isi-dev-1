import React, { useState, useEffect } from 'react';
import { Search, Filter, RotateCcw } from 'lucide-react';
import { Club } from '../../types';

export interface PlayerFilterValues {
  search: string;
  position: string;
  condition: string;
  free: boolean;
  club_id: string;
  min_age: string;
  max_age: string;
  min_value: string;
  max_value: string;
  sort: string;
}

interface PlayerFiltersProps {
  clubs: Club[];
  filters: PlayerFilterValues;
  onChange: (filters: PlayerFilterValues) => void;
  onReset: () => void;
}

export const PlayerFilters: React.FC<PlayerFiltersProps> = ({
  clubs,
  filters,
  onChange,
  onReset,
}) => {
  const [searchInput, setSearchInput] = useState(filters.search);
  const [isExpanded, setIsExpanded] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onChange({ ...filters, search: searchInput });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput, filters, onChange]);

  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  const handleFreeToggle = (checked: boolean) => {
    onChange({
      ...filters,
      free: checked,
      club_id: checked ? '' : filters.club_id,
    });
  };

  const handleClubChange = (clubId: string) => {
    onChange({
      ...filters,
      club_id: clubId,
      free: clubId ? false : filters.free,
    });
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
      {/* Search and Primary Quick Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar atletas por nome..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-medium transition ${
              isExpanded || filters.min_age || filters.max_age || filters.min_value || filters.max_value || filters.club_id
                ? 'bg-blue-600/10 border-blue-500/40 text-blue-400'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filtros Avançados
          </button>

          <button
            type="button"
            onClick={onReset}
            title="Limpar todos os filtros"
            className="p-2.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            aria-label="Limpar filtros"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Basic Filter Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 border-t border-zinc-800/60">
        <div>
          <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
            Posição
          </label>
          <select
            value={filters.position}
            onChange={(e) => onChange({ ...filters, position: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
          >
            <option value="">Todas</option>
            <option value="GOL">Goleiro (GOL)</option>
            <option value="ZAG">Zagueiro (ZAG)</option>
            <option value="LAT">Lateral (LAT)</option>
            <option value="MEI">Meio-campo (MEI)</option>
            <option value="ATA">Atacante (ATA)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
            Condição
          </label>
          <select
            value={filters.condition}
            onChange={(e) => onChange({ ...filters, condition: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
          >
            <option value="">Todas</option>
            <option value="APTO">Apto</option>
            <option value="MAL_CONDICIONADO">Mal Condicionado</option>
            <option value="DOENTE">Doente</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
            Ordenação
          </label>
          <select
            value={filters.sort}
            onChange={(e) => onChange({ ...filters, sort: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
          >
            <option value="name">Nome (A-Z)</option>
            <option value="value_desc">Maior Valor de Mercado</option>
            <option value="value_asc">Menor Valor de Mercado</option>
            <option value="age_asc">Mais Jovem</option>
            <option value="age_desc">Mais Velho</option>
            <option value="position">Posição (GOL, ZAG, LAT, MEI, ATA)</option>
          </select>
        </div>

        <div className="flex flex-col justify-end">
          <label
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs cursor-pointer select-none transition ${
              filters.free
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-medium'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
            } ${filters.club_id ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <input
              type="checkbox"
              checked={filters.free}
              disabled={Boolean(filters.club_id)}
              onChange={(e) => handleFreeToggle(e.target.checked)}
              className="rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-0"
            />
            Apenas Livres
          </label>
        </div>
      </div>

      {/* Advanced Filter Collapse */}
      {isExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-zinc-800/60 animate-in fade-in duration-200">
          <div>
            <label htmlFor="club-filter-select" className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
              Clube
            </label>
            <select
              id="club-filter-select"
              value={filters.club_id}
              disabled={filters.free}
              onChange={(e) => handleClubChange(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 disabled:opacity-40"
            >
              <option value="">Todos os Clubes</option>
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.acronym})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
              Faixa de Idade
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Mín"
                min="16"
                max="45"
                value={filters.min_age}
                onChange={(e) => onChange({ ...filters, min_age: e.target.value })}
                className="w-1/2 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
              />
              <span className="text-zinc-500 text-xs">-</span>
              <input
                type="number"
                placeholder="Máx"
                min="16"
                max="45"
                value={filters.max_age}
                onChange={(e) => onChange({ ...filters, max_age: e.target.value })}
                className="w-1/2 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
              Faixa de Valor (R$)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Mín"
                step="0.01"
                min="0"
                value={filters.min_value}
                onChange={(e) => onChange({ ...filters, min_value: e.target.value })}
                className="w-1/2 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
              />
              <span className="text-zinc-500 text-xs">-</span>
              <input
                type="number"
                placeholder="Máx"
                step="0.01"
                min="0"
                value={filters.max_value}
                onChange={(e) => onChange({ ...filters, max_value: e.target.value })}
                className="w-1/2 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
