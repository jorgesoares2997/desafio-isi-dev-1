import React from 'react';
import { RotateCw } from 'lucide-react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => {
  return <div className={`bg-zinc-200/70 rounded animate-pulse ${className}`} />;
};

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 6 }) => {
  return (
    <div className="w-full space-y-3 p-4 animate-pulse">
      <div className="h-10 bg-zinc-200/80 rounded-lg w-full" />
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className="h-9 bg-zinc-100 rounded-md flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export const PlayerTableSkeleton: React.FC = () => {
  return (
    <div>
      {/* Top Bar with Spinner and Right Skeleton Block (Figma Screenshot 1) */}
      <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[#E4E4E7]">
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-600">
          <RotateCw className="w-4 h-4 animate-spin text-zinc-500" />
          <span>Carregando jogadores...</span>
        </div>
        <div className="w-36 h-7 bg-zinc-100 rounded-xl animate-pulse" />
      </div>

      {/* Table Header */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#E4E4E7] text-[#686872] bg-white select-none">
              <th className="py-3.5 px-4 font-normal text-[#686872]">Jogador</th>
              <th className="py-3.5 px-3 font-normal text-[#686872]">Posição</th>
              <th className="py-3.5 px-3 font-normal text-[#686872] text-center">Overall</th>
              <th className="py-3.5 px-3 font-normal text-[#686872]">Agilidade</th>
              <th className="py-3.5 px-3 font-normal text-[#686872] text-center">Idade</th>
              <th className="py-3.5 px-3 font-normal text-[#686872]">Condição</th>
              <th className="py-3.5 px-3 font-normal text-[#686872] text-right">Valor base</th>
              <th className="py-3.5 px-3 font-normal text-[#686872] text-right">Valor de mercado</th>
              <th className="py-3.5 px-4 font-normal text-[#686872]">Clube</th>
              <th className="py-3.5 px-4 text-right w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E4E7] animate-pulse">
            {Array.from({ length: 8 }).map((_, r) => (
              <tr key={r}>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-zinc-100 shrink-0" />
                    <div className="h-3.5 w-28 bg-zinc-100 rounded-md" />
                  </div>
                </td>
                <td className="py-3.5 px-3">
                  <div className="h-4 w-8 rounded-md bg-zinc-100" />
                </td>
                <td className="py-3.5 px-3 text-center">
                  <div className="h-3.5 w-5 rounded bg-zinc-100 mx-auto" />
                </td>
                <td className="py-3.5 px-3">
                  <div className="h-3.5 w-10 rounded bg-zinc-100" />
                </td>
                <td className="py-3.5 px-3 text-center">
                  <div className="h-3.5 w-5 rounded bg-zinc-100 mx-auto" />
                </td>
                <td className="py-3.5 px-3">
                  <div className="h-4 w-16 rounded-full bg-zinc-100" />
                </td>
                <td className="py-3.5 px-3 text-right">
                  <div className="h-3.5 w-12 rounded bg-zinc-100 ml-auto" />
                </td>
                <td className="py-3.5 px-3 text-right">
                  <div className="h-3.5 w-14 rounded bg-zinc-100 ml-auto" />
                </td>
                <td className="py-3.5 px-4">
                  <div className="h-3.5 w-14 rounded bg-zinc-100" />
                </td>
                <td className="py-3.5 px-4 text-right">
                  <div className="h-6 w-6 rounded-md bg-zinc-100 ml-auto" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white border border-[#E4E4E7] rounded-xl p-5 space-y-4 animate-pulse shadow-xs">
          <div className="flex justify-between items-center">
            <div className="h-5 bg-zinc-200 rounded w-1/3" />
            <div className="h-6 w-12 bg-zinc-200 rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-zinc-100 rounded w-2/3" />
            <div className="h-4 bg-zinc-100 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
};
