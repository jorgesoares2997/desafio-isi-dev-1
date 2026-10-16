import React, { useState, useRef, useEffect } from 'react';
import { Club } from '../../types';
import { ClubCreateModal } from './ClubCreateModal';
import { EmptyState } from '../common/EmptyState';
import { TableSkeleton } from '../common/Skeleton';
import { formatDecimal } from '../../utils/formatters';
import { 
  Shield, 
  Plus, 
  ChevronRight, 
  ChevronDown, 
  ArrowUpDown, 
  Check 
} from 'lucide-react';

interface ClubListProps {
  clubs: Club[];
  loading: boolean;
  onRefresh: () => void;
  onSelectClub: (clubId: number) => void;
}

export const ClubList: React.FC<ClubListProps> = ({
  clubs,
  loading,
  onRefresh,
  onSelectClub,
}) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [sortOption, setSortOption] = useState<'name' | 'net_worth_desc' | 'net_worth_asc'>('net_worth_desc');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  // Close sort dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sortedClubs = [...clubs].sort((a, b) => {
    if (sortOption === 'name') {
      return a.name.localeCompare(b.name, 'pt-BR');
    }
    if (sortOption === 'net_worth_desc') {
      const diff = b.net_worth - a.net_worth;
      return diff !== 0 ? diff : a.name.localeCompare(b.name, 'pt-BR');
    }
    const diff = a.net_worth - b.net_worth;
    return diff !== 0 ? diff : a.name.localeCompare(b.name, 'pt-BR');
  });

  const getSortLabel = (opt: 'name' | 'net_worth_desc' | 'net_worth_asc') => {
    switch (opt) {
      case 'name':
        return 'nome';
      case 'net_worth_desc':
        return 'patrimônio (maior para o menor)';
      case 'net_worth_asc':
        return 'patrimônio (menor para o maior)';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50/60 border border-blue-200 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6 text-[#155DFC] stroke-[1.5]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Clubes
            </h1>
            <p className="text-xs text-[#686872] mt-0.5">
              Cada clube começa com 300,00 em caixa e sem jogadores. A liga aceita no máximo 20 clubes.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 bg-[#155DFC] hover:bg-[#1447E6] active:scale-95 text-white px-4 py-2.5 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer whitespace-nowrap self-end sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Novo clube
        </button>
      </div>

      {/* Main Card Container */}
      <div className="bg-white border border-[#E4E4E7] rounded-2xl shadow-xs overflow-visible">
        {/* Controls Bar */}
        <div className="px-6 py-3.5 border-b border-[#E4E4E7] flex flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-xs text-zinc-900">
              {clubs.length} clubes
            </span>
            <span className="text-xs text-[#686872]">
              {clubs.length} de 20
            </span>
          </div>

          {/* Sort Dropdown */}
          <div className="relative" ref={sortRef}>
            <button
              type="button"
              onClick={() => setIsSortOpen((prev) => !prev)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E4E4E7] bg-white hover:bg-zinc-50 text-xs text-zinc-800 transition cursor-pointer select-none"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
              <span>Ordenar: {getSortLabel(sortOption)}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ${isSortOpen ? 'rotate-180' : ''}`} />
            </button>

            {isSortOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-[#E4E4E7] rounded-xl shadow-lg py-1.5 z-40 text-xs animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 text-[11px] font-medium text-[#686872]">
                  Ordenar por
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSortOption('name');
                    setIsSortOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-zinc-50 text-zinc-800 transition cursor-pointer"
                >
                  <span className="w-4 flex items-center justify-center text-zinc-900">
                    {sortOption === 'name' && <Check className="w-3.5 h-3.5" />}
                  </span>
                  <span>Nome</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSortOption('net_worth_desc');
                    setIsSortOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-zinc-50 text-zinc-800 transition cursor-pointer"
                >
                  <span className="w-4 flex items-center justify-center text-zinc-900">
                    {sortOption === 'net_worth_desc' && <Check className="w-3.5 h-3.5" />}
                  </span>
                  <span>Patrimônio (maior para o menor)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSortOption('net_worth_asc');
                    setIsSortOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-zinc-50 text-zinc-800 transition cursor-pointer"
                >
                  <span className="w-4 flex items-center justify-center text-zinc-900">
                    {sortOption === 'net_worth_asc' && <Check className="w-3.5 h-3.5" />}
                  </span>
                  <span>Patrimônio (menor para o maior)</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Clubs Table / Loading / Empty */}
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={6} cols={6} />
          </div>
        ) : sortedClubs.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="Nenhum clube cadastrado"
              description="A liga ainda não possui clubes. Clique em 'Novo clube' para cadastrar a primeira agremiação esportiva com 300,00 de caixa inicial."
              action={{
                label: 'Criar primeiro clube',
                onClick: () => setIsCreateOpen(true),
              }}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="text-[12px] text-[#686872] border-b border-[#E4E4E7] bg-white font-normal select-none">
                <tr>
                  <th className="py-3.5 px-6 font-normal">Clube</th>
                  <th className="py-3.5 px-4 font-normal">Sigla</th>
                  <th className="py-3.5 px-4 font-normal text-right">Caixa</th>
                  <th className="py-3.5 px-4 font-normal text-right">Valor do elenco</th>
                  <th className="py-3.5 px-4 font-normal text-right">Patrimônio</th>
                  <th className="py-3.5 px-6 font-normal text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F4F5]">
                {sortedClubs.map((club) => (
                  <tr
                    key={club.id}
                    onClick={() => onSelectClub(club.id)}
                    className="hover:bg-zinc-50/80 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-7 rounded-lg bg-zinc-100 flex items-center justify-center font-semibold text-[11px] text-zinc-700 tracking-wide shrink-0">
                          {club.acronym}
                        </div>
                        <span className="font-medium text-xs sm:text-sm text-zinc-900 group-hover:text-[#155DFC] transition">
                          {club.name}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs text-zinc-600">
                      {club.acronym}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs sm:text-sm text-zinc-800 text-right">
                      {formatDecimal(club.cash)}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs sm:text-sm text-zinc-800 text-right">
                      {formatDecimal(club.squad_value)}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs sm:text-sm font-bold text-zinc-900 text-right">
                      {formatDecimal(club.net_worth)}
                    </td>

                    <td className="py-3.5 px-6 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-700 group-hover:text-[#155DFC] transition">
                        Ver clube
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dynamic Footnote */}
      <p className="text-xs text-[#686872] px-1">
        Clubes pelo nome por padrão ou pelo patrimônio, do maior para o menor, com empate desfeito pelo nome.
      </p>

      {/* Modal de Criação */}
      <ClubCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(newClub) => {
          onRefresh();
          onSelectClub(newClub.id);
        }}
      />
    </div>
  );
};
