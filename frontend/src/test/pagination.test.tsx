import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from '../components/common/Pagination';

describe('Pagination Component', () => {
  it('exibe contagem total de itens e página atual retornados pelo meta', () => {
    const onPageChange = vi.fn();

    render(
      <Pagination
        currentPage={1}
        totalPages={5}
        totalItems={48}
        limit={10}
        onPageChange={onPageChange}
        itemName="atletas"
      />
    );

    expect(screen.getByText(/Mostrando/i)).toHaveTextContent('Mostrando 1 a 10 de 48 atletas');
    expect(screen.getByText('1 / 5')).toBeInTheDocument();
  });

  it('desabilita o botão anterior na primeira página e próxima na última', () => {
    const onPageChange = vi.fn();

    const { rerender } = render(
      <Pagination
        currentPage={1}
        totalPages={3}
        totalItems={25}
        limit={10}
        onPageChange={onPageChange}
      />
    );

    const prevBtn = screen.getByRole('button', { name: /Anterior/i });
    const nextBtn = screen.getByRole('button', { name: /Próxima/i });

    expect(prevBtn).toBeDisabled();
    expect(nextBtn).toBeEnabled();

    fireEvent.click(nextBtn);
    expect(onPageChange).toHaveBeenCalledWith(2);

    // Página final
    rerender(
      <Pagination
        currentPage={3}
        totalPages={3}
        totalItems={25}
        limit={10}
        onPageChange={onPageChange}
      />
    );

    expect(screen.getByRole('button', { name: /Próxima/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Anterior/i })).toBeEnabled();
  });
});
