import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { api, getApiErrorMessage } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Player, PlayerPosition } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { User, Lock, Info, AlertCircle, AlignLeft } from 'lucide-react';

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
  const [touched, setTouched] = useState(false);

  const [name, setName] = useState('Davi Melo');
  const [position, setPosition] = useState<PlayerPosition>('MEI');
  const [age, setAge] = useState<number | string>(23);
  const [agility, setAgility] = useState<number | string>(70);

  const [pace, setPace] = useState<number | string>(66);
  const [shooting, setShooting] = useState<number | string>(62);
  const [passing, setPassing] = useState<number | string>(74);
  const [dribbling, setDribbling] = useState<number | string>(70);
  const [defending, setDefending] = useState<number | string>(48);
  const [physical, setPhysical] = useState<number | string>(58);
  const [potential, setPotential] = useState<number | string>(82);

  const numAge = Number(age);
  const numAgility = Number(agility);
  const numPace = Number(pace);
  const numShooting = Number(shooting);
  const numPassing = Number(passing);
  const numDribbling = Number(dribbling);
  const numDefending = Number(defending);
  const numPhysical = Number(physical);
  const numPotential = Number(potential);

  const sumAttributes =
    (numPace || 0) +
    (numShooting || 0) +
    (numPassing || 0) +
    (numDribbling || 0) +
    (numDefending || 0) +
    (numPhysical || 0);

  const maxAttribute = Math.max(
    numPace || 0,
    numShooting || 0,
    numPassing || 0,
    numDribbling || 0,
    numDefending || 0,
    numPhysical || 0
  );

  // Field validations
  const getNameError = () => {
    if (!name || name.trim().length === 0) return 'Informe o nome do jogador.';
    if (name.trim().length < 3 || name.trim().length > 100) return 'Use de 3 a 100 caracteres.';
    const words = name.trim().split(/\s+/);
    if (words.length < 2) return 'Use pelo menos duas palavras e sem números.';
    if (/\d/.test(name)) return 'Não use números no nome.';
    return null;
  };

  const getAgeError = () => {
    if (age === '' || isNaN(numAge)) return 'Informe a idade.';
    if (numAge < 16 || numAge > 45) return 'Use uma idade de 16 a 45 anos.';
    return null;
  };

  const getAgilityError = () => {
    if (agility === '' || isNaN(numAgility)) return 'Informe a agilidade.';
    const maxAgil = numAge >= 35 ? 85 : 100;
    if (numAgility < 1 || numAgility > maxAgil) {
      return `De 1 a 100 (até ${maxAgil} com ${numAge >= 35 ? '35 anos ou mais' : 'idade atual'}).`;
    }
    return null;
  };

  const getAttrError = (val: number | string) => {
    if (val === '' || isNaN(Number(val))) return 'Informe o valor.';
    const n = Number(val);
    if (n < 1 || n > 99) return 'Use um valor de 1 a 99.';
    return null;
  };

  const getPotentialError = () => {
    if (potential === '' || isNaN(numPotential)) return 'Informe o potencial.';
    if (numPotential < 1 || numPotential > 99) return 'Use um valor de 1 a 99.';
    if (numPotential < maxAttribute) {
      return `Potencial deve ser ≥ maior atributo (${maxAttribute}).`;
    }
    return null;
  };

  const nameError = getNameError();
  const ageError = getAgeError();
  const agilityError = getAgilityError();
  const paceError = getAttrError(pace);
  const shootingError = getAttrError(shooting);
  const passingError = getAttrError(passing);
  const dribblingError = getAttrError(dribbling);
  const defendingError = getAttrError(defending);
  const physicalError = getAttrError(physical);
  const potentialError = getPotentialError();
  const sumError = sumAttributes > 480 ? 'A soma dos atributos não pode passar de 480.' : null;

  const hasAnyError = Boolean(
    nameError ||
    ageError ||
    agilityError ||
    paceError ||
    shootingError ||
    passingError ||
    dribblingError ||
    defendingError ||
    physicalError ||
    potentialError ||
    sumError
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    if (hasAnyError) {
      showToast('error', 'Corrija os campos destacados para salvar.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        position,
        agility: numAgility,
        age: numAge,
        pace: numPace,
        shooting: numShooting,
        passing: numPassing,
        dribbling: numDribbling,
        defending: numDefending,
        physical: numPhysical,
        potential: numPotential,
      };

      const resp = await api.post<Player>('/players', payload);
      const created = resp.data;
      showToast(
        'success',
        `Atleta ${created.name} cadastrado com sucesso! Overall: ${created.overall} · Valor Base: ${formatCurrency(created.base_value)}`
      );
      onSuccess(created);
      onClose();
    } catch (err) {
      showToast('error', getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const attributeList = [
    { label: 'Velocidade', value: numPace },
    { label: 'Finalização', value: numShooting },
    { label: 'Passe', value: numPassing },
    { label: 'Drible', value: numDribbling },
    { label: 'Defesa', value: numDefending },
    { label: 'Físico', value: numPhysical },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Novo jogador"
      description={
        touched && hasAnyError
          ? 'Corrija os campos destacados para salvar.'
          : 'Preencha os dados e os indicadores técnicos. O valor base, o overall e o valor de mercado são calculados ao salvar.'
      }
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
              className={`w-full bg-white border rounded-xl pl-10 pr-3.5 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none transition ${
                touched && nameError
                  ? 'border-rose-500 focus:border-rose-600 bg-rose-50/10'
                  : 'border-[#E4E4E7] focus:border-[#155DFC]'
              }`}
            />
          </div>
          {touched && nameError ? (
            <div className="flex items-center gap-1 text-[11px] text-rose-600 mt-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{nameError}</span>
            </div>
          ) : (
            <p className="text-[11px] text-[#686872] mt-1">
              De 3 a 100 caracteres, com pelo menos duas palavras e sem números.
            </p>
          )}
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
                      ? 'border-[#155DFC] bg-[#EFF6FF] text-[#155DFC] shadow-2xs font-semibold'
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
              onChange={(e) => setAge(e.target.value)}
              className={`w-full bg-white border rounded-xl px-3.5 py-2 text-sm text-zinc-900 focus:outline-none transition ${
                touched && ageError
                  ? 'border-rose-500 focus:border-rose-600 bg-rose-50/10'
                  : 'border-[#E4E4E7] focus:border-[#155DFC]'
              }`}
            />
            {touched && ageError ? (
              <div className="flex items-center gap-1 text-[11px] text-rose-600 mt-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{ageError}</span>
              </div>
            ) : (
              <p className="text-[11px] text-[#686872] mt-1">De 16 a 45 anos.</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-900 mb-1">
              Agilidade
            </label>
            <input
              type="number"
              min={1}
              max={numAge >= 35 ? 85 : 100}
              required
              value={agility}
              onChange={(e) => setAgility(e.target.value)}
              className={`w-full bg-white border rounded-xl px-3.5 py-2 text-sm text-zinc-900 focus:outline-none transition ${
                touched && agilityError
                  ? 'border-rose-500 focus:border-rose-600 bg-rose-50/10'
                  : 'border-[#E4E4E7] focus:border-[#155DFC]'
              }`}
            />
            {touched && agilityError ? (
              <div className="flex items-center gap-1 text-[11px] text-rose-600 mt-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{agilityError}</span>
              </div>
            ) : (
              <p className="text-[11px] text-[#686872] mt-1">
                De 1 a 100 (até 85 com 35 anos ou mais).
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-900 mb-1">
              Valor base (moedas)
            </label>
            <div className="w-full bg-[#FAFAFA] border border-[#E4E4E7] rounded-xl px-3.5 py-2 text-sm text-zinc-500 flex items-center gap-1.5 cursor-not-allowed">
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
                    onChange={(e) => setPace(e.target.value)}
                    className={`w-full bg-white border rounded-lg px-2 py-1.5 text-xs text-center font-mono font-medium text-zinc-900 focus:outline-none transition ${
                      touched && paceError ? 'border-rose-500 bg-rose-50/10' : 'border-[#E4E4E7] focus:border-[#155DFC]'
                    }`}
                  />
                  {touched && paceError && (
                    <div className="flex items-center gap-0.5 text-[9px] text-rose-600 mt-0.5">
                      <AlertCircle className="w-2.5 h-2.5 shrink-0" />
                      <span>1 a 99</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#686872] mb-1">Finalização</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    required
                    value={shooting}
                    onChange={(e) => setShooting(e.target.value)}
                    className={`w-full bg-white border rounded-lg px-2 py-1.5 text-xs text-center font-mono font-medium text-zinc-900 focus:outline-none transition ${
                      touched && shootingError ? 'border-rose-500 bg-rose-50/10' : 'border-[#E4E4E7] focus:border-[#155DFC]'
                    }`}
                  />
                  {touched && shootingError && (
                    <div className="flex items-center gap-0.5 text-[9px] text-rose-600 mt-0.5">
                      <AlertCircle className="w-2.5 h-2.5 shrink-0" />
                      <span>1 a 99</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#686872] mb-1">Passe</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    required
                    value={passing}
                    onChange={(e) => setPassing(e.target.value)}
                    className={`w-full bg-white border rounded-lg px-2 py-1.5 text-xs text-center font-mono font-medium text-zinc-900 focus:outline-none transition ${
                      touched && passingError ? 'border-rose-500 bg-rose-50/10' : 'border-[#E4E4E7] focus:border-[#155DFC]'
                    }`}
                  />
                  {touched && passingError && (
                    <div className="flex items-center gap-0.5 text-[9px] text-rose-600 mt-0.5">
                      <AlertCircle className="w-2.5 h-2.5 shrink-0" />
                      <span>1 a 99</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#686872] mb-1">Drible</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    required
                    value={dribbling}
                    onChange={(e) => setDribbling(e.target.value)}
                    className={`w-full bg-white border rounded-lg px-2 py-1.5 text-xs text-center font-mono font-medium text-zinc-900 focus:outline-none transition ${
                      touched && dribblingError ? 'border-rose-500 bg-rose-50/10' : 'border-[#E4E4E7] focus:border-[#155DFC]'
                    }`}
                  />
                  {touched && dribblingError && (
                    <div className="flex items-center gap-0.5 text-[9px] text-rose-600 mt-0.5">
                      <AlertCircle className="w-2.5 h-2.5 shrink-0" />
                      <span>1 a 99</span>
                    </div>
                  )}
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
                    onChange={(e) => setDefending(e.target.value)}
                    className={`w-full bg-white border rounded-lg px-2 py-1.5 text-xs text-center font-mono font-medium text-zinc-900 focus:outline-none transition ${
                      touched && defendingError ? 'border-rose-500 bg-rose-50/10' : 'border-[#E4E4E7] focus:border-[#155DFC]'
                    }`}
                  />
                  {touched && defendingError && (
                    <div className="flex items-center gap-0.5 text-[9px] text-rose-600 mt-0.5">
                      <AlertCircle className="w-2.5 h-2.5 shrink-0" />
                      <span>1 a 99</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#686872] mb-1">Físico</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    required
                    value={physical}
                    onChange={(e) => setPhysical(e.target.value)}
                    className={`w-full bg-white border rounded-lg px-2 py-1.5 text-xs text-center font-mono font-medium text-zinc-900 focus:outline-none transition ${
                      touched && physicalError ? 'border-rose-500 bg-rose-50/10' : 'border-[#E4E4E7] focus:border-[#155DFC]'
                    }`}
                  />
                  {touched && physicalError && (
                    <div className="flex items-center gap-0.5 text-[9px] text-rose-600 mt-0.5">
                      <AlertCircle className="w-2.5 h-2.5 shrink-0" />
                      <span>1 a 99</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#686872] mb-1">Potencial</label>
                  <input
                    type="number"
                    min={maxAttribute}
                    max={99}
                    required
                    value={potential}
                    onChange={(e) => setPotential(e.target.value)}
                    className={`w-full bg-white border rounded-lg px-2 py-1.5 text-xs text-center font-mono font-medium text-zinc-900 focus:outline-none transition ${
                      touched && potentialError ? 'border-rose-500 bg-rose-50/10' : 'border-[#E4E4E7] focus:border-[#155DFC]'
                    }`}
                  />
                  {touched && potentialError ? (
                    <div className="flex items-center gap-0.5 text-[9px] text-rose-600 mt-0.5 leading-tight">
                      <AlertCircle className="w-2.5 h-2.5 shrink-0" />
                      <span>{potentialError}</span>
                    </div>
                  ) : (
                    <span className="text-[9px] text-[#686872] block leading-tight mt-0.5">
                      ≥ maior atributo; igual a ele com 33+ anos
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#686872] mb-1">Overall</label>
                  <div className="w-full bg-[#FAFAFA] border border-[#E4E4E7] rounded-lg px-1.5 py-1.5 text-xs text-zinc-500 flex items-center justify-center gap-1 cursor-not-allowed">
                    <Lock className="w-3 h-3 text-zinc-400" />
                    <span className="text-[10px]">Após salvar</span>
                  </div>
                  <span className="text-[9px] text-[#686872] block leading-tight mt-0.5">
                    Calculado automaticamente
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
            <div className="lg:col-span-5 bg-[#FAFAFA] border border-[#E4E4E7] rounded-2xl p-3.5 space-y-2.5 min-h-[190px] flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-800">
                <AlignLeft className="w-3.5 h-3.5 text-zinc-500" />
                <span>Prévia dos atributos</span>
              </div>

              {touched && hasAnyError ? (
                /* Estado quando há erros de validação - idêntico à Imagem 1 */
                <div className="flex-1 flex flex-col items-center justify-center py-6 text-center text-xs text-[#686872] space-y-2">
                  <AlignLeft className="w-6 h-6 text-zinc-300 stroke-[1.5]" />
                  <p className="max-w-[160px] text-[11px] leading-snug">
                    Corrija os valores destacados para ver a prévia.
                  </p>
                </div>
              ) : (
                /* Estado válido com barras de progresso */
                <>
                  <div className="space-y-1.5">
                    {attributeList.map((attr) => (
                      <div key={attr.label} className="flex items-center gap-2 text-xs">
                        <span className="w-16 text-[11px] text-[#686872] truncate">{attr.label}</span>
                        <div className="flex-1 h-2 bg-zinc-200 rounded-full overflow-hidden relative">
                          <div 
                            className="h-full bg-blue-100 rounded-full absolute left-0 top-0"
                            style={{ width: `${Math.min(100, (numPotential / 99) * 100)}%` }}
                          />
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
                    Faixa clara: até o potencial ({numPotential || 0}). A prévia só desenha os valores digitados; não calcula overall nem valor base.
                  </p>
                </>
              )}
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
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#155DFC] hover:bg-[#1447E6] active:scale-95 disabled:opacity-50 text-white shadow-2xs transition cursor-pointer"
            >
              {loading ? 'Salvando...' : 'Salvar jogador'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
