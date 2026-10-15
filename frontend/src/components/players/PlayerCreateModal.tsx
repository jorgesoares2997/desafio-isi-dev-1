import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { api, getApiErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Player, PlayerPosition } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { User, Lock, SlidersHorizontal, Info } from 'lucide-react';

interface PlayerCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newPlayer: Player) => void;
}

const POSITIONS: { value: PlayerPosition; label: string; sub: string }[] = [
  { value: 'GOL', label: 'GOL', sub: 'Goleiro' },
  { value: 'ZAG', label: 'ZAG', sub: 'Zagueiro' },
  { value: 'LAT', label: 'LAT', sub: 'Lateral' },
  { value: 'MEI', label: 'MEI', sub: 'Meio-campo' },
  { value: 'ATA', label: 'ATA', sub: 'Atacante' },
];

export const PlayerCreateModal: React.FC<PlayerCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [position, setPosition] = useState<PlayerPosition>('MEI');
  const [age, setAge] = useState(23);
  const [agility, setAgility] = useState(70);

  const [pace, setPace] = useState(66);
  const [shooting, setShooting] = useState(62);
  const [passing, setPassing] = useState(74);
  const [dribbling, setDribbling] = useState(70);
  const [defending, setDefending] = useState(48);
  const [physical, setPhysical] = useState(58);
  const [potential, setPotential] = useState(82);

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
      setAge(23);
      setAgility(70);
      setPace(66);
      setShooting(62);
      setPassing(74);
      setDribbling(70);
      setDefending(48);
      setPhysical(58);
      setPotential(82);
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const attributeList = [
    { label: 'Velocidade', value: pace },
    { label: 'Finalização', value: shooting },
    { label: 'Passe', value: passing },
    { label: 'Drible', value: dribbling },
    { label: 'Defesa', value: defending },
    { label: 'Físico', value: physical },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Novo jogador"
      description="Preencha os dados e os indicadores técnicos. O valor base, o overall e o valor de mercado são calculados ao salvar."
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Campo Nome */}
        <div>
          <label className="block text-xs font-semibold text-zinc-900 mb-1">
            Nome
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              placeholder="Ex: Davi Melo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-[#E4E4E7] rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-[#155DFC] transition"
            />
          </div>
          <p className="text-[11px] text-[#686872] mt-1">
            De 3 a 100 caracteres, com pelo menos duas palavras e sem números.
          </p>
        </div>

        {/* Posição Radio Cards */}
        <div>
          <label className="block text-xs font-semibold text-zinc-900 mb-1.5">
            Posição
          </label>
          <div className="grid grid-cols-5 gap-2.5">
            {POSITIONS.map((pos) => {
              const isSelected = position === pos.value;
              return (
                <button
                  type="button"
                  key={pos.value}
                  onClick={() => setPosition(pos.value)}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border text-center transition cursor-pointer ${
                    isSelected
                      ? 'border-[#155DFC] bg-[#EFF6FF] text-[#155DFC] shadow-2xs'
                      : 'border-[#E4E4E7] bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'
                  }`}
                >
                  <span className="font-bold text-xs font-mono">{pos.label}</span>
                  <span className="text-[10px] text-[#686872] mt-0.5">{pos.sub}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Idade, Agilidade e Valor Base */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-zinc-900 mb-1">
              Idade
            </label>
            <input
              type="number"
              min={16}
              max={45}
              required
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              className="w-full bg-white border border-[#E4E4E7] rounded-xl px-3.5 py-2 text-sm text-zinc-900 focus:outline-none focus:border-[#155DFC] transition"
            />
            <p className="text-[11px] text-[#686872] mt-1">De 16 a 45 anos.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-900 mb-1">
              Agilidade
            </label>
            <input
              type="number"
              min={1}
              max={age >= 35 ? 85 : 100}
              required
              value={agility}
              onChange={(e) => setAgility(Number(e.target.value))}
              className="w-full bg-white border border-[#E4E4E7] rounded-xl px-3.5 py-2 text-sm text-zinc-900 focus:outline-none focus:border-[#155DFC] transition"
            />
            <p className="text-[11px] text-[#686872] mt-1">De 1 a 100 (até 85 com 35 anos ou mais).</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-900 mb-1">
              Valor base (moedas)
            </label>
            <div className="w-full bg-[#F4F4F5] border border-[#E4E4E7] rounded-xl px-3.5 py-2 text-sm text-zinc-500 flex items-center gap-1.5 cursor-not-allowed">
              <Lock className="w-3.5 h-3.5 text-zinc-400" />
              <span>Após salvar</span>
            </div>
            <p className="text-[11px] text-[#686872] mt-1">Calculado no cadastro.</p>
          </div>
        </div>

        {/* Indicadores Técnicos + Prévia */}
        <div className="pt-2 border-t border-[#E4E4E7]">
          <h4 className="text-xs font-semibold text-zinc-900 mb-0.5">
            Indicadores técnicos
          </h4>
          <p className="text-[11px] text-[#686872] mb-3">
            Seis atributos e o potencial, de 1 a 99. Não mudam depois do cadastro; a soma dos seis atributos não pode passar de 480.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Lado Esquerdo: Inputs de Atributos */}
            <div className="lg:col-span-7 space-y-3">
              {/* Linha 1: 4 Atributos */}
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-[#686872] mb-1">Velocidade</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    required
                    value={pace}
                    onChange={(e) => setPace(Number(e.target.value))}
                    className="w-full bg-white border border-[#E4E4E7] rounded-lg px-2 py-1.5 text-xs text-center font-mono font-medium text-zinc-900 focus:outline-none focus:border-[#155DFC] transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#686872] mb-1">Finalização</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    required
                    value={shooting}
                    onChange={(e) => setShooting(Number(e.target.value))}
                    className="w-full bg-white border border-[#E4E4E7] rounded-lg px-2 py-1.5 text-xs text-center font-mono font-medium text-zinc-900 focus:outline-none focus:border-[#155DFC] transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#686872] mb-1">Passe</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    required
                    value={passing}
                    onChange={(e) => setPassing(Number(e.target.value))}
                    className="w-full bg-white border border-[#E4E4E7] rounded-lg px-2 py-1.5 text-xs text-center font-mono font-medium text-zinc-900 focus:outline-none focus:border-[#155DFC] transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#686872] mb-1">Drible</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    required
                    value={dribbling}
                    onChange={(e) => setDribbling(Number(e.target.value))}
                    className="w-full bg-white border border-[#E4E4E7] rounded-lg px-2 py-1.5 text-xs text-center font-mono font-medium text-zinc-900 focus:outline-none focus:border-[#155DFC] transition"
                  />
                </div>
              </div>

              {/* Linha 2: Defesa, Físico, Potencial e Overall */}
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-[#686872] mb-1">Defesa</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    required
                    value={defending}
                    onChange={(e) => setDefending(Number(e.target.value))}
                    className="w-full bg-white border border-[#E4E4E7] rounded-lg px-2 py-1.5 text-xs text-center font-mono font-medium text-zinc-900 focus:outline-none focus:border-[#155DFC] transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#686872] mb-1">Físico</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    required
                    value={physical}
                    onChange={(e) => setPhysical(Number(e.target.value))}
                    className="w-full bg-white border border-[#E4E4E7] rounded-lg px-2 py-1.5 text-xs text-center font-mono font-medium text-zinc-900 focus:outline-none focus:border-[#155DFC] transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#686872] mb-1">Potencial</label>
                  <input
                    type="number"
                    min={maxAttribute}
                    max={99}
                    required
                    value={potential}
                    onChange={(e) => setPotential(Number(e.target.value))}
                    className="w-full bg-white border border-[#E4E4E7] rounded-lg px-2 py-1.5 text-xs text-center font-mono font-medium text-zinc-900 focus:outline-none focus:border-[#155DFC] transition"
                  />
                  <span className="text-[9px] text-[#686872] block leading-tight mt-0.5">
                    ≥ maior atributo
                  </span>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#686872] mb-1">Overall</label>
                  <div className="w-full bg-[#F4F4F5] border border-[#E4E4E7] rounded-lg px-1.5 py-1.5 text-xs text-zinc-500 flex items-center justify-center gap-1 cursor-not-allowed">
                    <Lock className="w-3 h-3 text-zinc-400" />
                    <span className="text-[10px]">Salvar</span>
                  </div>
                  <span className="text-[9px] text-[#686872] block leading-tight mt-0.5">
                    Automático
                  </span>
                </div>
              </div>

              {/* Indicador de Soma de Atributos */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[11px] text-[#686872]">
                  Soma dos 6 atributos:
                </span>
                <span className={`font-mono font-bold text-xs ${
                  sumAttributes > 480 ? 'text-[#9F0A0A]' : 'text-zinc-800'
                }`}>
                  {sumAttributes} / 480
                </span>
              </div>
            </div>

            {/* Lado Direito: Card Prévia dos Atributos */}
            <div className="lg:col-span-5 bg-[#FAFAFA] border border-[#E4E4E7] rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#155DFC]" />
                <span>Prévia dos atributos</span>
              </div>

              <div className="space-y-1.5">
                {attributeList.map((attr) => (
                  <div key={attr.label} className="flex items-center gap-2 text-xs">
                    <span className="w-20 text-[11px] text-[#686872] truncate">{attr.label}</span>
                    <div className="flex-1 h-2 bg-zinc-200 rounded-full overflow-hidden relative">
                      {/* Faixa clara até o potencial */}
                      <div 
                        className="h-full bg-blue-100 rounded-full absolute left-0 top-0"
                        style={{ width: `${Math.min(100, (potential / 99) * 100)}%` }}
                      />
                      {/* Faixa sólida do atributo */}
                      <div 
                        className="h-full bg-[#155DFC] rounded-full relative z-10 transition-all duration-300"
                        style={{ width: `${Math.min(100, (attr.value / 99) * 100)}%` }}
                      />
                    </div>
                    <span className="font-mono text-[11px] font-bold text-zinc-800 w-5 text-right">
                      {attr.value}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-[10px] text-[#686872] leading-tight pt-1 border-t border-[#E4E4E7]/60">
                Faixa clara: até o potencial ({potential}). A prévia só desenha os valores digitados; não calcula overall nem valor base.
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé com Aviso e Ações */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#E4E4E7]">
          <div className="flex items-center gap-1.5 text-xs text-[#686872]">
            <Info className="w-4 h-4 text-[#155DFC]" />
            <span>O jogador começa livre e Apto.</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#686872] hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || sumAttributes > 480}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#155DFC] hover:bg-[#1447E6] disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-xs active:scale-95 transition cursor-pointer"
            >
              {loading ? 'Salvando...' : 'Salvar jogador'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
