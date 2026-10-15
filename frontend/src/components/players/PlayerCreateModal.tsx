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
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Nome Completo <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Carlos Alberto Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
            <p className="text-[11px] text-zinc-500 mt-1">Mínimo 2 palavras, 3 a 100 caracteres e sem números.</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Posição <span className="text-rose-400">*</span>
            </label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value as PlayerPosition)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
            >
              <option value="GOL">Goleiro (GOL)</option>
              <option value="ZAG">Zagueiro (ZAG)</option>
              <option value="LAT">Lateral (LAT)</option>
              <option value="MEI">Meio-campo (MEI)</option>
              <option value="ATA">Atacante (ATA)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Idade (16 a 45) <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              min={16}
              max={45}
              required
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Agilidade (1 a 100) <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              min={1}
              max={age >= 35 ? 85 : 100}
              required
              value={agility}
              onChange={(e) => setAgility(Number(e.target.value))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
            />
            {age >= 35 && (
              <span className="text-[11px] text-amber-400 mt-1 block">
                Atletas com 35+ anos possuem agilidade máxima de 85.
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Potencial (1 a 99) <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              min={maxAttribute}
              max={99}
              required
              value={potential}
              onChange={(e) => setPotential(Number(e.target.value))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-blue-500"
            />
            <span className="text-[11px] text-zinc-400 mt-1 block">
              Mínimo: {maxAttribute} (maior atributo atual). {age >= 33 ? 'Para 33+ anos, deve ser exatamente igual ao maior atributo.' : ''}
            </span>
          </div>
        </div>

        {/* Technical Attributes Grid */}
        <div className="pt-3 border-t border-zinc-800">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Atributos Técnicos (1 a 99)
            </h4>
            <div className={`text-xs font-mono font-medium px-2.5 py-0.5 rounded-full ${
              sumAttributes > 480 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : 'bg-zinc-800 text-zinc-300'
            }`}>
              Soma: {sumAttributes} / 480
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Velocidade (Pace)</label>
              <input
                type="number"
                min={1}
                max={99}
                required
                value={pace}
                onChange={(e) => setPace(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Finalização (Shooting)</label>
              <input
                type="number"
                min={1}
                max={99}
                required
                value={shooting}
                onChange={(e) => setShooting(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Passe (Passing)</label>
              <input
                type="number"
                min={1}
                max={99}
                required
                value={passing}
                onChange={(e) => setPassing(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Drible (Dribbling)</label>
              <input
                type="number"
                min={1}
                max={99}
                required
                value={dribbling}
                onChange={(e) => setDribbling(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Defesa (Defending)</label>
              <input
                type="number"
                min={1}
                max={99}
                required
                value={defending}
                onChange={(e) => setDefending(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Físico (Physical)</label>
              <input
                type="number"
                min={1}
                max={99}
                required
                value={physical}
                onChange={(e) => setPhysical(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Modal Actions */}
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
            disabled={loading || sumAttributes > 480}
            className="px-5 py-2.5 rounded-xl text-xs font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-blue-500/20 active:scale-95 transition"
          >
            {loading ? 'Cadastrando...' : 'Cadastrar Atleta'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
