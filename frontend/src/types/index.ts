export type PlayerPosition = 'GOL' | 'ZAG' | 'LAT' | 'MEI' | 'ATA';
export type PlayerCondition = 'APTO' | 'MAL_CONDICIONADO' | 'DOENTE';

export interface Player {
  id: number;
  name: string;
  position: PlayerPosition;
  agility: number;
  age: number;
  condition: PlayerCondition;
  base_value: number;
  market_value: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  potential: number;
  overall: number;
  club_id: number | null;
}

export interface ContractInfo {
  purchase_value: number;
  loyalty_until: string;
  remaining_days: number;
  penalty_rate: number;
}

export interface PlayerInClub extends Player {
  contract?: ContractInfo | null;
}

export interface PageMeta {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

export interface PagedResponse<T> {
  data: T[];
  meta: PageMeta;
}

export interface Club {
  id: number;
  name: string;
  acronym: string;
  cash: number;
  squad_value: number;
  net_worth: number;
}

export interface ClubDetail extends Club {
  players: PlayerInClub[];
}

export interface Transaction {
  id: number;
  club_id: number;
  player_id: number;
  player_name: string;
  type: 'COMPRA' | 'VENDA';
  value: number;
  fee: number;
  penalty: number;
  profit: number | null;
  cash_change: number;
  created_at: string;
}

export interface TransactionsSummary {
  total_spent: number;
  total_received: number;
  total_fees: number;
  total_penalties: number;
  total_profit: number;
}

export interface TransactionsListResponse {
  data: Transaction[];
  summary: TransactionsSummary;
}

export interface SellResponse {
  id: number;
  club_id: number;
  player_id: number;
  player_name: string;
  type: string;
  value: number;
  fee: number;
  penalty: number;
  profit: number;
  cash_change: number;
  created_at: string;
  purchase_value?: number;
  remaining_days?: number;
  penalty_rate?: number;
  contract_status?: string;
  club_cash?: number;
}

export interface BuyResponse {
  id: number;
  club_id: number;
  player_id: number;
  player_name: string;
  type: string;
  value: number;
  fee: number;
  penalty: number;
  profit: number;
  cash_change: number;
  created_at: string;
  contract?: {
    id: number;
    player_id: number;
    club_id: number;
    status: string;
    loyalty_until: string;
    purchase_value: number;
  };
  club_cash: number;
}

export interface LineupResponse {
  club_id: number;
  formation: string;
  complete: boolean;
  players: Player[];
}

export interface DuelParticipant {
  player_id: number;
  player_name: string;
  position: string;
  condition: string;
  attribute: string;
  value: number;
}

export interface Duel {
  order: number;
  attacking_club_id: number;
  attacker: DuelParticipant;
  defender: DuelParticipant;
  goal: boolean;
}

export interface MatchClubInfo {
  club_id: number;
  club_name: string;
  formation: string;
  goals: number;
}

export interface MatchDetail {
  id: number;
  played_at: string;
  home: MatchClubInfo;
  away: MatchClubInfo;
  result: string;
  duels: Duel[];
}

export interface MatchSummary {
  id: number;
  played_at: string;
  home: MatchClubInfo;
  away: MatchClubInfo;
  result: string;
}

export interface Standing {
  position: number;
  club_id: number;
  club_name: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  title?: string;
}
