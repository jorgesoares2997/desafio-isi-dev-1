import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  onPageChange: (page: number) => void;
  itemName?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  limit,
  onPageChange,
  itemName = 'itens',
}) => {
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 border-t border-[#E4E4E7] text-sm text-[#686872]">
      <div>
        Mostrando <span className="font-semibold text-zinc-900">{startItem}</span> a{' '}
        <span className="font-semibold text-zinc-900">{endItem}</span> de{' '}
        <span className="font-semibold text-zinc-900">{totalItems}</span> {itemName}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E4E4E7] bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed transition text-xs font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </button>

        <span className="px-3 py-1.5 text-xs font-mono font-medium text-zinc-700 bg-[#FAFAFA] rounded-lg border border-[#E4E4E7]">
          {currentPage} / {totalPages || 1}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#E4E4E7] bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed transition text-xs font-medium"
        >
          Próxima
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
