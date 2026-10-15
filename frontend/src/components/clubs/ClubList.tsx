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
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Shield className="w-6 h-6 text-blue-500" />
            Clubes e Finanças
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Gestão patrimonial, saldo em caixa (RN10) e elencos da liga.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as 'name' | 'net_worth_desc' | 'net_worth_asc')}
            className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
          >
            <option value="name">Ordenar por Nome (A-Z)</option>
            <option value="net_worth_desc">Maior Patrimônio Líquido</option>
            <option value="net_worth_asc">Menor Patrimônio Líquido</option>
          </select>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg shadow-blue-500/20 transition cursor-pointer whitespace-nowrap"
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
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4 animate-pulse">
              <div className="flex justify-between items-center">
                <div className="h-5 bg-zinc-800 rounded w-1/2" />
                <div className="h-6 w-12 bg-zinc-800 rounded-lg" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-zinc-800/60 rounded w-3/4" />
                <div className="h-4 bg-zinc-800/60 rounded w-1/2" />
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
              className="bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-5 shadow-xl transition-all duration-200 cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/10">
                      {club.acronym}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-blue-400 transition tracking-tight">
                        {club.name}
                      </h3>
                      <span className="text-[11px] font-mono text-zinc-400">
                        ID: {club.id}
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-xs font-mono font-bold text-blue-400">
                    {club.acronym}
                  </span>
                </div>

                <div className="space-y-2 pt-3 border-t border-zinc-800/60 text-xs">
                  <div className="flex justify-between items-center text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <Wallet className="w-3.5 h-3.5 text-zinc-500" /> Caixa Atual:
                    </span>
                    <span className="font-mono text-zinc-200 font-medium">
                      {formatCurrency(club.cash)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-zinc-400">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-zinc-500" /> Valor do Elenco:
                    </span>
                    <span className="font-mono text-zinc-200 font-medium">
                      {formatCurrency(club.squad_value)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-zinc-200 pt-2 border-t border-zinc-800/40 font-semibold">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <TrendingUp className="w-3.5 h-3.5" /> Patrimônio Líquido:
                    </span>
                    <span className="font-mono text-emerald-400 text-sm">
                      {formatCurrency(club.net_worth)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-blue-400 font-medium group-hover:translate-x-0.5 transition">
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
