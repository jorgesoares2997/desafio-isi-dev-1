import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { api, getApiErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Player, PlayerPosition } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface PlayerCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newPlayer: Player) => void;
}

export const PlayerCreateModal: React.FC<PlayerCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [position, setPosition] = useState<PlayerPosition>('MEI');
  const [age, setAge] = useState(22);
  const [agility, setAgility] = useState(75);

  const [pace, setPace] = useState(60);
  const [shooting, setShooting] = useState(60);
  const [passing, setPassing] = useState(60);
  const [dribbling, setDribbling] = useState(60);
  const [defending, setDefending] = useState(60);
  const [physical, setPhysical] = useState(60);
  const [potential, setPotential] = useState(75);

  const sumAttributes = pace + shooting + passing + dribbling + defending + physical;
  const maxAttribute = Math.max(pace, shooting, passing, dribbling, defending, physical);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name,
        position,
        agility,
        age,
        pace,
        shooting,
        passing,
        dribbling,
        defending,
        physical,
        potential,
      };

      const resp = await api.post<Player>('/players', payload);
      const created = resp.data;
      showToast(
        'success',
        `Atleta ${created.name} cadastrado com sucesso! Overall: ${created.overall} · Valor Base: ${formatCurrency(created.base_value)}`
      );
      onSuccess(created);
      onClose();
      // Reset form
      setName('');
      setPosition('MEI');
      setAge(22);
      setAgility(75);
      setPace(60);
      setShooting(60);
      setPassing(60);
      setDribbling(60);
      setDefending(60);
      setPhysical(60);
      setPotential(75);
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
      title="Cadastrar Novo Atleta"
      description="Informe os dados e atributos técnicos do jogador. O cálculo de overall e valor é automático."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Nome Completo <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Carlos Alberto Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg px-3.5 py-2.5 text-sm text-zinc-900 placeholder-[#686872] focus:outline-none focus:border-[#155DFC] focus:bg-white transition"
            />
            <p className="text-[11px] text-[#686872] mt-1">Mínimo 2 palavras, 3 a 100 caracteres e sem números.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Posição <span className="text-rose-500">*</span>
            </label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value as PlayerPosition)}
              className="w-full bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg px-3 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-[#155DFC] focus:bg-white transition"
            >
              <option value="GOL">Goleiro (GOL)</option>
              <option value="ZAG">Zagueiro (ZAG)</option>
              <option value="LAT">Lateral (LAT)</option>
              <option value="MEI">Meio-campo (MEI)</option>
              <option value="ATA">Atacante (ATA)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Idade (16 a 45) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={16}
              max={45}
              required
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg px-3.5 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-[#155DFC] focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Agilidade (1 a 100) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              max={age >= 35 ? 85 : 100}
              required
              value={agility}
              onChange={(e) => setAgility(Number(e.target.value))}
              className="w-full bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg px-3.5 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-[#155DFC] focus:bg-white transition"
            />
            {age >= 35 && (
              <span className="text-[11px] text-amber-600 mt-1 block">
                Atletas com 35+ anos possuem agilidade máxima de 85.
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Potencial (1 a 99) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min={maxAttribute}
              max={99}
              required
              value={potential}
              onChange={(e) => setPotential(Number(e.target.value))}
              className="w-full bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg px-3.5 py-2.5 text-sm text-zinc-900 focus:outline-none focus:border-[#155DFC] focus:bg-white transition"
            />
            <span className="text-[11px] text-[#686872] mt-1 block">
              Mínimo: {maxAttribute} (maior atributo atual). {age >= 33 ? 'Para 33+ anos, deve ser exatamente igual ao maior atributo.' : ''}
            </span>
          </div>
        </div>

        {/* Technical Attributes Grid */}
        <div className="pt-3 border-t border-[#E4E4E7]">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
              Atributos Técnicos (1 a 99)
            </h4>
            <div className={`text-xs font-mono font-medium px-2.5 py-0.5 rounded-full ${
              sumAttributes > 480 ? 'bg-[#FEF2F2] text-[#9F0A0A] border border-[#FECACA]' : 'bg-zinc-100 text-zinc-700'
            }`}>
              Soma: {sumAttributes} / 480
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#686872] mb-1">Velocidade (Pace)</label>
              <input
                type="number"
                min={1}
                max={99}
                required
                value={pace}
                onChange={(e) => setPace(Number(e.target.value))}
                className="w-full bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-[#155DFC] focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#686872] mb-1">Finalização (Shooting)</label>
              <input
                type="number"
                min={1}
                max={99}
                required
                value={shooting}
                onChange={(e) => setShooting(Number(e.target.value))}
                className="w-full bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-[#155DFC] focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#686872] mb-1">Passe (Passing)</label>
              <input
                type="number"
                min={1}
                max={99}
                required
                value={passing}
                onChange={(e) => setPassing(Number(e.target.value))}
                className="w-full bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-[#155DFC] focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#686872] mb-1">Drible (Dribbling)</label>
              <input
                type="number"
                min={1}
                max={99}
                required
                value={dribbling}
                onChange={(e) => setDribbling(Number(e.target.value))}
                className="w-full bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-[#155DFC] focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#686872] mb-1">Defesa (Defending)</label>
              <input
                type="number"
                min={1}
                max={99}
                required
                value={defending}
                onChange={(e) => setDefending(Number(e.target.value))}
                className="w-full bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-[#155DFC] focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#686872] mb-1">Físico (Physical)</label>
              <input
                type="number"
                min={1}
                max={99}
                required
                value={physical}
                onChange={(e) => setPhysical(Number(e.target.value))}
                className="w-full bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:border-[#155DFC] focus:bg-white transition"
              />
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E4E4E7]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-[#686872] hover:text-zinc-900 hover:bg-zinc-100 transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || sumAttributes > 480}
            className="px-5 py-2.5 rounded-lg text-xs font-semibold bg-[#155DFC] hover:bg-[#1447E6] disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-xs active:scale-95 transition"
          >
            {loading ? 'Cadastrando...' : 'Cadastrar Atleta'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
