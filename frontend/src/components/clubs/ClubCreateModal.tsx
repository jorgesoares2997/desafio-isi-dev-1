import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { api, getApiErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Club } from '../../types';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const resp = await api.post<Club>('/clubs', {
        name,
        acronym: acronym.trim().toUpperCase(),
      });
      showToast('success', `Clube ${resp.data.name} (${resp.data.acronym}) criado com sucesso! Caixa inicial: R$ 300,00.`);
      onSuccess(resp.data);
      onClose();
      setName('');
      setAcronym('');
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cadastrar Novo Clube"
      description="Crie um novo clube na liga. O caixa nasce automaticamente com R$ 300,00 (RN10)."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">
            Nome do Clube <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Ex: Porto Futebol Clube"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
          <p className="text-[11px] text-zinc-500 mt-1">
            3 a 60 caracteres, 2 a 5 palavras. Apenas letras, espaços, hífen e ponto.
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1">
            Sigla do Clube (Acrônimo) <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            required
            maxLength={3}
            placeholder="Ex: PFC"
            value={acronym}
            onChange={(e) => setAcronym(e.target.value.toUpperCase())}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm font-mono tracking-widest uppercase text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
          <p className="text-[11px] text-zinc-500 mt-1">
            Exatamente 3 letras maiúsculas que aparecem no nome nessa ordem, iniciando com a 1ª letra.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !name.trim() || acronym.trim().length !== 3}
            className="px-5 py-2.5 rounded-xl text-xs font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white shadow-lg shadow-blue-500/20 active:scale-95 transition"
          >
            {loading ? 'Cadastrando...' : 'Criar Clube'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
