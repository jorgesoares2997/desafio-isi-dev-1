import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { api, getApiErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Club } from '../../types';
import { Shield, Wallet, AlertCircle } from 'lucide-react';

interface ClubCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newClub: Club) => void;
}

export const ClubCreateModal: React.FC<ClubCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [acronym, setAcronym] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClose = () => {
    setErrorMessage(null);
    setName('');
    setAcronym('');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const resp = await api.post<Club>('/clubs', {
        name: name.trim(),
        acronym: acronym.trim().toUpperCase(),
      });
      showToast('success', `${resp.data.name} (${resp.data.acronym}) começa com 300,00 em caixa.`, 'Clube criado');
      onSuccess(resp.data);
      handleClose();
    } catch (err) {
      const msg = getApiErrorMessage(err);
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Novo clube"
      description="Informe o nome e a sigla do clube."
      borderHeader={false}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error Alert matching Figma Screenshot 3 */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-50/60 border border-red-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div className="text-xs">
              <div className="font-semibold text-red-600">Não foi possível criar o clube</div>
              <div className="text-red-500 mt-0.5">{errorMessage}</div>
            </div>
          </div>
        )}

        {/* Input Nome */}
        <div>
          <label className="block text-xs font-semibold text-zinc-900 mb-1.5">
            Nome
          </label>
          <div className="relative">
            <Shield className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              required
              placeholder="Ex: Porto Futebol Clube"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              className={`w-full bg-white border ${
                errorMessage ? 'border-red-400 focus:border-red-500' : 'border-[#E4E4E7] focus:border-[#155DFC]'
              } rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-zinc-900 placeholder-[#686872] focus:outline-none transition`}
            />
          </div>
          <p className="text-[11px] text-[#686872] mt-1.5 leading-relaxed">
            De 3 a 60 caracteres e de 2 a 5 palavras; só letras, espaços, hífen e ponto. Não pode repetir outro clube.
          </p>
        </div>

        {/* Input Sigla */}
        <div>
          <label className="block text-xs font-semibold text-zinc-900 mb-1.5">
            Sigla
          </label>
          <input
            type="text"
            required
            maxLength={3}
            placeholder="Ex: PFC"
            value={acronym}
            onChange={(e) => {
              setAcronym(e.target.value.toUpperCase());
              if (errorMessage) setErrorMessage(null);
            }}
            className="w-full bg-white border border-[#E4E4E7] rounded-xl px-3.5 py-2.5 text-xs font-mono uppercase text-zinc-900 placeholder-[#686872] focus:outline-none focus:border-[#155DFC] transition"
          />
          <p className="text-[11px] text-[#686872] mt-1.5 leading-relaxed">
            3 letras de A a Z, maiúsculas, que aparecem no nome nessa ordem; a primeira é a primeira letra do nome.
          </p>
        </div>

        {/* Info Box */}
        <div className="p-3 bg-zinc-50/70 border border-[#E4E4E7] rounded-xl flex items-center gap-2.5">
          <Wallet className="w-4 h-4 text-zinc-500 shrink-0" />
          <span className="text-xs text-zinc-600">
            O clube começa com 300,00 em caixa e sem jogadores.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-zinc-700 bg-white border border-[#E4E4E7] hover:bg-zinc-50 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !name.trim() || acronym.trim().length !== 3}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#155DFC] hover:bg-[#1447E6] disabled:opacity-50 text-white shadow-xs active:scale-95 transition cursor-pointer"
          >
            {loading ? 'Criando...' : 'Criar clube'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
