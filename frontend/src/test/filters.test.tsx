import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerFilters, PlayerFilterValues } from '../components/players/PlayerFilters';
import { Club } from '../types';

const mockClubs: Club[] = [
  { id: 1, name: 'Flamengo', acronym: 'FLA', cash: 1000000, squad_value: 5000000, net_worth: 6000000 },
  { id: 2, name: 'Palmeiras', acronym: 'PAL', cash: 1200000, squad_value: 4800000, net_worth: 6000000 },
];

const initialFilters: PlayerFilterValues = {
  search: '',
  position: '',
  condition: '',
  free: false,
  club_id: '',
  min_age: '',
  max_age: '',
  min_value: '',
  max_value: '',
  sort: 'name',
};

describe('PlayerFilters Component', () => {
  it('renderiza o campo de busca e filtros corretamente', () => {
    const onChange = vi.fn();
    const onReset = vi.fn();

    render(
      <PlayerFilters
        clubs={mockClubs}
        filters={initialFilters}
        onChange={onChange}
        onReset={onReset}
      />
    );

    expect(screen.getByPlaceholderText(/Buscar atletas por nome/i)).toBeInTheDocument();
  });

  it('impede envio simultâneo de free=true e club_id garantindo exclusividade mútua', () => {
    const onChange = vi.fn();
    const onReset = vi.fn();

    const { rerender } = render(
      <PlayerFilters
        clubs={mockClubs}
        filters={{ ...initialFilters, free: false, club_id: '' }}
        onChange={onChange}
        onReset={onReset}
      />
    );

    // Expandir filtros avançados
    const filterToggleBtn = screen.getByRole('button', { name: /Filtros Avançados/i });
    fireEvent.click(filterToggleBtn);

    // Ao selecionar um clube, free deve ser desmarcado
    const clubSelect = screen.getByLabelText(/^Clube$/i);
    fireEvent.change(clubSelect, { target: { value: '1' } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        club_id: '1',
        free: false,
      })
    );

    // Agora renderizar com club_id selecionado e clicar em "Apenas Livres"
    rerender(
      <PlayerFilters
        clubs={mockClubs}
        filters={{ ...initialFilters, free: false, club_id: '1' }}
        onChange={onChange}
        onReset={onReset}
      />
    );

    const freeCheckbox = screen.getByLabelText(/Apenas Livres/i);
    fireEvent.click(freeCheckbox);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        free: true,
        club_id: '',
      })
    );
  });
});
