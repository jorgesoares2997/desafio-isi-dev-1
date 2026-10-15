import React, { useState } from 'react';
import { Club } from '../../types';
import { ClubCreateModal } from './ClubCreateModal';
import { EmptyState } from '../common/EmptyState';
import { formatCurrency } from '../../utils/formatters';
import { 
  Shield, 
  Plus, 
  ChevronRight, 
  TrendingUp, 
  Wallet, 
  Users 
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
  const [sortOption, setSortOption] = useState<'name' | 'net_worth_desc' | 'net_worth_asc'>('name');

  const sortedClubs = [...clubs].sort((a, b) => {
    if (sortOption === 'name') {
      return a.name.localeCompare(b.name, 'pt-BR');
    }
    if (sortOption === 'net_worth_desc') {
      return b.net_worth - a.net_worth;
    }
    return a.net_worth - b.net_worth;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-[#155DFC]" />
            Clubes e Finanças
          </h2>
          <p className="text-xs sm:text-sm text-[#686872] mt-1">
            Gestão patrimonial, saldo em caixa (RN10) e elencos da liga.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as 'name' | 'net_worth_desc' | 'net_worth_asc')}
            className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg px-3 py-2.5 text-xs text-zinc-800 focus:outline-none focus:border-[#155DFC] focus:bg-white"
          >
            <option value="name">Ordenar por Nome (A-Z)</option>
            <option value="net_worth_desc">Maior Patrimônio Líquido</option>
            <option value="net_worth_asc">Menor Patrimônio Líquido</option>
          </select>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 bg-[#155DFC] hover:bg-[#1447E6] active:scale-95 text-white px-4 py-2.5 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Novo Clube
          </button>
        </div>
      </div>

      {/* Clubs Grid Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-[#E4E4E7] rounded-xl p-5 space-y-4 animate-pulse shadow-xs">
              <div className="flex justify-between items-center">
                <div className="h-5 bg-zinc-200 rounded w-1/2" />
                <div className="h-6 w-12 bg-zinc-200 rounded-lg" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-zinc-100 rounded w-3/4" />
                <div className="h-4 bg-zinc-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : sortedClubs.length === 0 ? (
        <EmptyState
          title="Nenhum clube cadastrado"
          description="A liga ainda não possui clubes. Clique em 'Novo Clube' para cadastrar a primeira agremiação esportiva com R$ 300,00 de caixa inicial."
          action={{
            label: 'Criar Primeiro Clube',
            onClick: () => setIsCreateOpen(true),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedClubs.map((club) => (
            <div
              key={club.id}
              onClick={() => onSelectClub(club.id)}
              className="bg-white hover:bg-zinc-50/80 border border-[#E4E4E7] hover:border-zinc-300 rounded-xl p-5 shadow-xs transition-all duration-200 cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#155DFC] flex items-center justify-center font-bold text-white shadow-2xs">
                      {club.acronym}
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-900 group-hover:text-[#155DFC] transition tracking-tight">
                        {club.name}
                      </h3>
                      <span className="text-[11px] font-mono text-[#686872]">
                        ID: {club.id}
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-md bg-[#EFF6FF] border border-blue-200 text-xs font-mono font-bold text-[#1447E6]">
                    {club.acronym}
                  </span>
                </div>

                <div className="space-y-2 pt-3 border-t border-[#E4E4E7] text-xs">
                  <div className="flex justify-between items-center text-[#686872]">
                    <span className="flex items-center gap-1.5">
                      <Wallet className="w-3.5 h-3.5 text-zinc-400" /> Caixa Atual:
                    </span>
                    <span className="font-mono text-zinc-800 font-semibold">
                      {formatCurrency(club.cash)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[#686872]">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-zinc-400" /> Valor do Elenco:
                    </span>
                    <span className="font-mono text-zinc-800 font-semibold">
                      {formatCurrency(club.squad_value)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-zinc-900 pt-2 border-t border-[#E4E4E7] font-semibold">
                    <span className="flex items-center gap-1.5 text-emerald-700">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Patrimônio Líquido:
                    </span>
                    <span className="font-mono text-emerald-600 font-bold text-sm">
                      {formatCurrency(club.net_worth)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E4E4E7] flex items-center justify-between text-xs text-[#155DFC] font-semibold group-hover:translate-x-0.5 transition">
                <span>Ver Elenco e Transações</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Criação */}
      <ClubCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => onRefresh()}
      />
    </div>
  );
};
