import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NewMatchModal } from '../components/league/NewMatchModal';
import { MatchDetailView } from '../components/league/MatchDetailView';
import { StandingsTab } from '../components/league/StandingsTab';
import { ToastProvider } from '../context/ToastContext';
import { Club, MatchDetail } from '../types';

const mockClubs: Club[] = [
  { id: 1, name: 'Delta FC', acronym: 'DEL', cash: 1000000, squad_value: 0, net_worth: 1000000 },
  { id: 2, name: 'Águias FC', acronym: 'AGU', cash: 1200000, squad_value: 0, net_worth: 1200000 },
];

const mockMatchDetail: MatchDetail = {
  id: 1,
  played_at: '2026-11-11T20:00:00Z',
  home: {
    club_id: 1,
    club_name: 'Delta FC',
    formation: '2-1-1',
    goals: 2,
  },
  away: {
    club_id: 2,
    club_name: 'Águias FC',
    formation: '2-1-1',
    goals: 1,
  },
  result: 'MANDANTE',
  duels: [
    {
      order: 1,
      attacking_club_id: 1,
      attacker: {
        player_id: 10,
        player_name: 'Gabriel Antunes',
        position: 'ATA',
        condition: 'BOM',
        attribute: 'shooting',
        value: 81,
      },
      defender: {
        player_id: 20,
        player_name: 'Bruno Tavares',
        position: 'GOL',
        condition: 'BOM',
        attribute: 'defending',
        value: 77,
      },
      goal: true,
    },
    {
      order: 2,
      attacking_club_id: 1,
      attacker: {
        player_id: 11,
        player_name: 'Meia Lua',
        position: 'MEI',
        condition: 'BOM',
        attribute: 'passing',
        value: 82,
      },
      defender: {
        player_id: 21,
        player_name: 'Felipe Moura',
        position: 'ZAG',
        condition: 'BOM',
        attribute: 'defending',
        value: 83,
      },
      goal: false,
    },
    {
      order: 3,
      attacking_club_id: 1,
      attacker: {
        player_id: 12,
        player_name: 'Kauã Ribeiro',
        position: 'LAT',
        condition: 'BOM',
        attribute: 'dribbling',
        value: 75,
      },
      defender: {
        player_id: 22,
        player_name: 'Diego Ramos',
        position: 'LAT',
        condition: 'MAL_CONDICIONADO',
        attribute: 'defending',
        value: 56,
      },
      goal: true,
    },
    {
      order: 4,
      attacking_club_id: 2,
      attacker: {
        player_id: 23,
        player_name: 'João Silva',
        position: 'ATA',
        condition: 'BOM',
        attribute: 'shooting',
        value: 79,
      },
      defender: {
        player_id: 13,
        player_name: 'André Lacerda',
        position: 'GOL',
        condition: 'BOM',
        attribute: 'defending',
        value: 74,
      },
      goal: true,
    },
    {
      order: 5,
      attacking_club_id: 2,
      attacker: {
        player_id: 24,
        player_name: 'Sávio Lima',
        position: 'MEI',
        condition: 'MAL_CONDICIONADO',
        attribute: 'passing',
        value: 60,
      },
      defender: {
        player_id: 14,
        player_name: 'Danilo Freitas',
        position: 'ZAG',
        condition: 'MAL_CONDICIONADO',
        attribute: 'defending',
        value: 67,
      },
      goal: false,
    },
    {
      order: 6,
      attacking_club_id: 2,
      attacker: {
        player_id: 22,
        player_name: 'Diego Ramos',
        position: 'LAT',
        condition: 'MAL_CONDICIONADO',
        attribute: 'dribbling',
        value: 63,
      },
      defender: {
        player_id: 12,
        player_name: 'Kauã Ribeiro',
        position: 'LAT',
        condition: 'BOM',
        attribute: 'defending',
        value: 63,
      },
      goal: false,
    },
  ],
};

describe('League Components Tests', () => {
  it('NewMatchModal renders fields and explainer info box', () => {
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    render(
      <ToastProvider>
        <NewMatchModal
          isOpen={true}
          onClose={onClose}
          clubs={mockClubs}
          onSuccess={onSuccess}
        />
      </ToastProvider>
    );

    expect(screen.getByText('Nova partida')).toBeInTheDocument();
    expect(screen.getByText('Como sai o placar')).toBeInTheDocument();
    expect(screen.getByText(/Faz os 3 primeiros ataques/i)).toBeInTheDocument();
    expect(screen.getByText(/Precisa ser um clube diferente do mandante/i)).toBeInTheDocument();
  });

  it('MatchDetailView renders match header, pitch section, and duels table', () => {
    const onBack = vi.fn();

    render(
      <ToastProvider>
        <MatchDetailView
          match={mockMatchDetail}
          clubs={mockClubs}
          onBack={onBack}
          isJustPlayed={true}
        />
      </ToastProvider>
    );

    // Toast
    expect(screen.getByText('Partida jogada')).toBeInTheDocument();

    // Pitch card
    expect(screen.getByText('Em campo')).toBeInTheDocument();
    expect(screen.getByText('Mal condicionado')).toBeInTheDocument();
    expect(screen.getByText('Gol no duelo')).toBeInTheDocument();

    // Duels card
    expect(screen.getByText('Duelos')).toBeInTheDocument();
    expect(screen.getByText(/Ataques do Delta FC \(mandante\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Ataques do Águias FC \(visitante\)/i)).toBeInTheDocument();
  });

  it('StandingsTab renders standings header and ranking criteria', () => {
    render(
      <ToastProvider>
        <StandingsTab
          clubs={mockClubs}
          onOpenNewMatch={vi.fn()}
          onNavigateToMatches={vi.fn()}
        />
      </ToastProvider>
    );

    expect(screen.getByText('Classificação')).toBeInTheDocument();
    expect(screen.getByText('Ordem da tabela')).toBeInTheDocument();
    expect(screen.getByText('Mais pontos')).toBeInTheDocument();
    expect(screen.getByText('Maior saldo de gols')).toBeInTheDocument();
    expect(screen.getByText('Mais gols marcados')).toBeInTheDocument();
    expect(screen.getByText('Nome do clube, de A a Z')).toBeInTheDocument();
  });
});
