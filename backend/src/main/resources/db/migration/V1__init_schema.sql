-- ====================================================================
-- Migration: V1__init_schema.sql
-- Description: Schema inicial com as 7 tabelas obrigatorias do sistema Passe
-- Regra Critica: Sem colunas calculadas em tempo de execucao (overall, valor_mercado, etc.)
-- ====================================================================

-- 1. Tabela: clubes
CREATE TABLE clubes (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    sigla VARCHAR(10) NOT NULL,
    caixa NUMERIC(12, 2) NOT NULL DEFAULT 300.00,
    formacao VARCHAR(10),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_clubes_sigla UNIQUE (sigla)
);

-- Unicidade de nome: case-insensitive, mas sensivel a acentos
CREATE UNIQUE INDEX uq_clubes_nome_lower ON clubes (LOWER(TRIM(nome)));

-- 2. Tabela: jogadores
CREATE TABLE jogadores (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    posicao VARCHAR(10) NOT NULL,
    agilidade INTEGER NOT NULL,
    idade INTEGER NOT NULL,
    valor_base NUMERIC(10, 2) NOT NULL,
    condicao VARCHAR(20) NOT NULL DEFAULT 'APTO',
    clube_id BIGINT REFERENCES clubes(id) ON DELETE SET NULL,
    velocidade INTEGER NOT NULL,
    finalizacao INTEGER NOT NULL,
    passe INTEGER NOT NULL,
    drible INTEGER NOT NULL,
    defesa INTEGER NOT NULL,
    fisico INTEGER NOT NULL,
    potencial INTEGER NOT NULL,
    excluido_em TIMESTAMPTZ,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_jogadores_clube_id ON jogadores (clube_id);
CREATE INDEX idx_jogadores_posicao ON jogadores (posicao);
CREATE INDEX idx_jogadores_condicao ON jogadores (condicao);
CREATE INDEX idx_jogadores_excluido_em ON jogadores (excluido_em);

-- 3. Tabela: contratos
CREATE TABLE contratos (
    id BIGSERIAL PRIMARY KEY,
    jogador_id BIGINT NOT NULL REFERENCES jogadores(id),
    clube_id BIGINT NOT NULL REFERENCES clubes(id),
    valor_compra NUMERIC(10, 2) NOT NULL,
    fidelidade_ate TIMESTAMPTZ NOT NULL,
    situacao VARCHAR(20) NOT NULL,
    iniciado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    encerrado_em TIMESTAMPTZ
);

CREATE INDEX idx_contratos_jogador_id ON contratos (jogador_id);
CREATE INDEX idx_contratos_clube_id ON contratos (clube_id);
CREATE INDEX idx_contratos_situacao ON contratos (situacao);

-- 4. Tabela: transacoes
CREATE TABLE transacoes (
    id BIGSERIAL PRIMARY KEY,
    clube_id BIGINT NOT NULL REFERENCES clubes(id),
    jogador_id BIGINT NOT NULL REFERENCES jogadores(id),
    nome_jogador VARCHAR(100) NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    valor NUMERIC(10, 2) NOT NULL,
    taxa NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    multa NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    lucro NUMERIC(10, 2),
    variacao_caixa NUMERIC(10, 2) NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transacoes_clube_id ON transacoes (clube_id);
CREATE INDEX idx_transacoes_jogador_id ON transacoes (jogador_id);
CREATE INDEX idx_transacoes_tipo ON transacoes (tipo);
CREATE INDEX idx_transacoes_criado_em ON transacoes (criado_em);

-- 5. Tabela: escalacoes (PK composta (clube_id, jogador_id) e jogador_id UNIQUE)
CREATE TABLE escalacoes (
    clube_id BIGINT NOT NULL REFERENCES clubes(id) ON DELETE CASCADE,
    jogador_id BIGINT NOT NULL UNIQUE REFERENCES jogadores(id) ON DELETE CASCADE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (clube_id, jogador_id)
);

CREATE INDEX idx_escalacoes_clube_id ON escalacoes (clube_id);

-- 6. Tabela: partidas
CREATE TABLE partidas (
    id BIGSERIAL PRIMARY KEY,
    mandante_id BIGINT NOT NULL REFERENCES clubes(id),
    visitante_id BIGINT NOT NULL REFERENCES clubes(id),
    gols_mandante INTEGER NOT NULL,
    gols_visitante INTEGER NOT NULL,
    formacao_mandante VARCHAR(10) NOT NULL,
    formacao_visitante VARCHAR(10) NOT NULL,
    jogada_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_partidas_mandante_id ON partidas (mandante_id);
CREATE INDEX idx_partidas_visitante_id ON partidas (visitante_id);
CREATE INDEX idx_partidas_jogada_em ON partidas (jogada_em);

-- 7. Tabela: duelos_partida
CREATE TABLE duelos_partida (
    id BIGSERIAL PRIMARY KEY,
    partida_id BIGINT NOT NULL REFERENCES partidas(id) ON DELETE CASCADE,
    ordem INTEGER NOT NULL,
    clube_atacante_id BIGINT NOT NULL REFERENCES clubes(id),
    atacante_id BIGINT NOT NULL REFERENCES jogadores(id),
    defensor_id BIGINT NOT NULL REFERENCES jogadores(id),
    nome_atacante VARCHAR(100) NOT NULL,
    nome_defensor VARCHAR(100) NOT NULL,
    posicao_atacante VARCHAR(10) NOT NULL,
    posicao_defensor VARCHAR(10) NOT NULL,
    condicao_atacante VARCHAR(20) NOT NULL,
    condicao_defensor VARCHAR(20) NOT NULL,
    atributo_ataque VARCHAR(30) NOT NULL,
    atributo_defesa VARCHAR(30) NOT NULL,
    valor_ataque INTEGER NOT NULL,
    valor_defesa INTEGER NOT NULL,
    gol BOOLEAN NOT NULL
);

CREATE INDEX idx_duelos_partida_id ON duelos_partida (partida_id);
