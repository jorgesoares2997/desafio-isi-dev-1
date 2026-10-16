import React, { useState } from 'react';
import { api, getApiErrorMessage } from '../../services/api';
import { Club, MatchDetail } from '../../types';
import { Swords, Shield, Info, AlertCircle, X } from 'lucide-react';

interface NewMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  clubs: Club[];
  onSuccess: (match: MatchDetail) => void;
}

export const NewMatchModal: React.FC<NewMatchModalProps> = ({
  isOpen,
  onClose,
  clubs,
  onSuccess,
}) => {
  const [homeClubId, setHomeClubId] = useState<number | null>(
    clubs.length > 0 ? clubs[0].id : null
  );
  const [awayClubId, setAwayClubId] = useState<number | null>(
    clubs.length > 1 ? clubs[1].id : null
  );
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePlayMatch = async () => {
    if (!homeClubId || !awayClubId) {
      setErrorMessage('Selecione os dois clubes para o confronto.');
      return;
    }
    if (homeClubId === awayClubId) {
      setErrorMessage('O clube mandante e o visitante devem ser diferentes.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.post<MatchDetail>('/matches', {
        home_club_id: homeClubId,
        away_club_id: awayClubId,
      });
      onSuccess(res.data);
      onClose();
    } catch (err) {
      setErrorMessage(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-[#E4E4E7] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-zinc-900">
              Nova partida
            </h3>
            <p className="text-xs text-[#686872] mt-1">
              Escolha o mandante e o visitante. O placar sai dos atributos dos titulares, sem sorteio.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg hover:bg-zinc-100 transition cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-2 space-y-4">
          {/* Error Banner (Figma Screenshot 4) */}
          {errorMessage && (
            <div className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl p-3.5 flex items-start gap-3 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
              <div className="text-xs">
                <h4 className="font-bold text-[#9F0A0A]">
                  Não foi possível jogar a partida
                </h4>
                <p className="text-[#9F0A0A] mt-0.5">
                  {errorMessage}
                </p>
              </div>
            </div>
          )}

          {/* Mandante Field */}
          <div>
            <label className="block text-xs font-semibold text-zinc-900 mb-1.5">
              Mandante
            </label>
            <div className="relative border border-[#E4E4E7] rounded-xl px-3.5 py-2.5 bg-white flex items-center gap-2.5 hover:border-zinc-300 focus-within:border-[#155DFC] transition">
              <Shield className="w-4 h-4 text-[#686872] shrink-0" />
              <select
                value={homeClubId ?? ''}
                onChange={(e) => {
                  setHomeClubId(Number(e.target.value));
                  setErrorMessage(null);
                }}
                disabled={loading}
                className="w-full text-xs font-medium text-zinc-900 bg-transparent focus:outline-none cursor-pointer appearance-none pr-6"
              >
                {clubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name} ({club.acronym || club.name.slice(0, 3).toUpperCase()})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">
                ▼
              </div>
            </div>
            <p className="text-[11px] text-[#686872] mt-1.5">
              Faz os 3 primeiros ataques.
            </p>
          </div>

          {/* Visitante Field */}
          <div>
            <label className="block text-xs font-semibold text-zinc-900 mb-1.5">
              Visitante
            </label>
            <div className="relative border border-[#E4E4E7] rounded-xl px-3.5 py-2.5 bg-white flex items-center gap-2.5 hover:border-zinc-300 focus-within:border-[#155DFC] transition">
              <Shield className="w-4 h-4 text-[#686872] shrink-0" />
              <select
                value={awayClubId ?? ''}
                onChange={(e) => {
                  setAwayClubId(Number(e.target.value));
                  setErrorMessage(null);
                }}
                disabled={loading}
                className="w-full text-xs font-medium text-zinc-900 bg-transparent focus:outline-none cursor-pointer appearance-none pr-6"
              >
                {clubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name} ({club.acronym || club.name.slice(0, 3).toUpperCase()})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">
                ▼
              </div>
            </div>
            <p className="text-[11px] text-[#686872] mt-1.5">
              Precisa ser um clube diferente do mandante.
            </p>
          </div>

          {/* Info Box: Como sai o placar */}
          <div className="border border-[#E4E4E7] rounded-xl p-4 bg-zinc-50/50 space-y-2 mt-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-900">
              <Info className="w-4 h-4 text-[#686872] shrink-0" />
              <span>Como sai o placar</span>
            </div>
            <p className="text-[11px] text-[#686872] leading-relaxed">
              Cada time faz 3 ataques. Pela ordem do elenco, os jogadores de linha vão do 1º (o mais recuado) ao 4º (o mais avançado): o 4º enfrenta o goleiro, o 3º enfrenta o 1º e o 2º enfrenta o 2º do adversário. O atacante usa finalização (ATA), passe (MEI) ou drible (ZAG e LAT), e quem defende usa defesa. É gol só quando o ataque é maior; mal condicionado joga com 15% a menos.
            </p>
            <p className="text-[11px] text-[#686872] leading-relaxed">
              Os dois clubes precisam ter os 5 titulares escalados. A partida não mexe no caixa.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 flex items-center justify-end gap-3 border-t border-[#E4E4E7] mt-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-[#E4E4E7] text-zinc-700 text-xs font-semibold hover:bg-zinc-50 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handlePlayMatch}
            disabled={loading || homeClubId === awayClubId}
            className="px-4 py-2.5 rounded-xl bg-[#155DFC] hover:bg-[#1447E6] text-white text-xs font-semibold transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Swords className="w-4 h-4" />
            {loading ? 'Jogando...' : 'Jogar partida'}
          </button>
        </div>
      </div>
    </div>
  );
};
