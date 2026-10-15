# ⚽ Passe · Gestão de Mercado e Liga

> **Desafio Técnico SENAI/PE · Processo Seletivo Desenvolvedor Fullstack I (CÓD. 237)**  
> **FASE 1:** Infraestrutura, Orquestração Docker, Banco Relacional (PostgreSQL 16 + Flyway) e Setup Base (Spring Boot 3 + React/Vite/Tailwind).

---

## 📌 Sumário
- [1. Visão Geral](#1-visão-geral)
- [2. Pré-requisitos](#2-pré-requisitos)
- [3. Criação e Reset do Banco de Dados](#3-criação-e-reset-do-banco-de-dados)
- [4. Execução do Projeto](#4-execução-do-projeto)
  - [4.1 Orquestração Completa com Docker (Recomendado)](#41-orquestração-completa-com-docker-recomendado)
  - [4.2 Execução Local (Sem Docker para Aplicação)](#42-execução-local-sem-docker-para-aplicação)
- [5. Testes Automatizados (Critério B5)](#5-testes-automatizados-critério-b5)
- [6. Variáveis de Ambiente](#6-variáveis-de-ambiente)
- [7. Arquitetura e Decisões Técnicas](#7-arquitetura-e-decisões-técnicas)
  - [7.1 Schema Relacional e Migrations Flyway](#71-schema-relacional-e-migrations-flyway)
  - [7.2 Padronização de Datas e Fuso Horário](#72-padronização-de-datas-e-fuso-horário)
  - [7.3 Tratamento Centralizado de Erros](#73-tratamento-centralizado-de-erros)
  - [7.4 Registro de Logs](#74-registro-de-logs)
  - [7.5 Documentação Interativa OpenAPI / Swagger](#75-documentação-interativa-openapi--swagger)
  - [7.6 Inspeção de Design via Figma MCP](#76-inspeção-de-design-via-figma-mcp)
- [8. Funcionalidades Não Implementadas](#8-funcionalidades-não-implementadas)
- [9. Uso de Inteligência Artificial](#9-uso-de-inteligência-artificial)

---

## 1. Visão Geral

A plataforma **Passe** é um sistema completo para gestão de mercado da liga de futebol de 5 e partidas, atendendo estritamente a todas as regras de negócio do regulamento do SENAI/PE.

- **Backend:** Java 21 LTS, Spring Boot 3.3.4, Spring Data JPA, Hibernate, Bean Validation, Flyway, Jackson, SpringDoc OpenAPI.
- **Frontend:** React 19 / 18+, TypeScript, Vite, Tailwind CSS v4, Axios, Lucide Icons, Tipografia Geist.
- **Banco de Dados:** PostgreSQL 16 (via Docker).
- **Contexto Base da API:** `/api/v1`
- **Fuso Horário:** Horário oficial de Brasília (`America/Sao_Paulo` / `-03:00`).

---

## 2. Pré-requisitos

Para executar e testar o projeto localmente:
- **Docker** 24+ e **Docker Compose** v2.20+
- **Java 21 LTS** (ex.: OpenJDK 21)
- **Maven 3.9+** (ou utilizar o wrapper `./mvnw` incluso na pasta `backend/`)
- **Node.js 20 LTS ou 22 LTS** e **npm 10+**
- **Git**

---

## 3. Criação e Reset do Banco de Dados

O banco de dados é inicializado automaticamente pelo Docker Compose e as migrations são aplicadas de forma transacional pelo **Flyway** na inicialização do backend.

### Criar o banco de dados:
```bash
docker compose up -d db
```

### Recriar o banco do zero (apagar dados e recriar vazio):
```bash
docker compose down -v
docker compose up -d db
```
> O banco começa vazio, sem dados mockados, criando exatamente as **7 tabelas obrigatórias** e a tabela de controle de versão `flyway_schema_history`.

---

## 4. Execução do Projeto

### 4.1 Orquestração Completa com Docker (Recomendado)
Um único comando sobe o banco de dados, compila o backend e frontend em multi-stage builds e expõe os serviços:

```bash
docker compose up --build -d
```

- **Frontend (Interface):** [http://localhost:5173](http://localhost:5173)
- **Backend (API REST):** [http://localhost:8080/api/v1](http://localhost:8080/api/v1)
- **Documentação Swagger/OpenAPI:** [http://localhost:8080/api/v1/swagger-ui.html](http://localhost:8080/api/v1/swagger-ui.html)
- **Verificação de Healthcheck da API:** [http://localhost:8080/api/v1/health](http://localhost:8080/api/v1/health)

Para parar os containers:
```bash
docker compose down
```

### 4.2 Execução Local (Sem Docker para Aplicação)

1. **Suba o banco de dados:**
   ```bash
   docker compose up -d db
   ```

2. **Inicie o backend:**
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```
   *(API disponível em `http://localhost:8080/api/v1`)*

3. **Inicie o frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *(Interface disponível em `http://localhost:5173`)*

---

## 5. Testes Automatizados e Qualidade de Código (Critério B5)

A plataforma conta com uma suíte abrangente de **96 testes automatizados** utilizando **JUnit 5**, **AssertJ** e **MockMvc**, executados de forma 100% autônoma (sem modo watch) e sem qualquer falha:

```bash
cd backend
./mvnw clean test
```

### Cobertura do Core de Negócio:
1. **Valuation & Overall (RN02 a RN06):**
   - Teste unitário exato de todos os 10 cenários da tabela oficial do edital para cálculo de valor de mercado (`APTO`, `MAL_CONDICIONADO`, `DOENTE`, bônus/penalidades de agilidade e idade, teto de desconto de `-40%` e piso de `1,00`).
   - Média ponderada posicional dos 6 atributos técnicos e cálculo do valor base.
2. **Ciclo Completo de Mercado e Transferências (RN13, RN15, RN16):**
   - Taxa de transferência de 5% sobre valores > 30,00 e bloqueio em custos > 50% do caixa disponível.
   - Multa rescisória de fidelidade com teto de 10,00 e comissão progressiva sobre o lucro na venda.
   - Desvinculação imediata do jogador da escalação ao ser vendido ou ao ter condição física alterada para `DOENTE` (RN19).
   - Bloqueio de recompra de atleta vendido anteriormente pelo mesmo clube.
3. **Simulação Oficial de Partidas (RN20) e Classificação (RN21):**
   - Execução da partida de referência do edital (**Águias FC 1 x 2 Delta FC**) com verificação exata dos 6 duelos táticos e penalidade de 15% para jogador `MAL_CONDICIONADO`.
   - Recusa com HTTP `409 Conflict` quando um clube tentar disputar partida com escalação incompleta.
   - Classificação dinâmica em `GET /api/v1/standings` ordenada por pontos (V=3, E=1, D=0), saldo de gols, gols pró e desempate alfabético Unicode NFD.

### Verificação de Lint e Formatação de Código (Spotless):
O projeto conta com o plugin **Spotless** configurado no `pom.xml` para garantia de estilo de código:

```bash
# Validar conformidade sem alterar arquivos
mvn spotless:check

# Aplicar formatação automaticamente quando necessário
mvn spotless:apply
```

---

## 6. Variáveis de Ambiente

O arquivo `.env.example` na raiz do projeto documenta todas as variáveis configuráveis:

```env
# Figma Design Inspection
FIGMA_PERSONAL_ACCESS_TOKEN=seu_token_aqui
FIGMA_PROJECT_URL=https://www.figma.com/design/oevjrS0eaqL3VHSvKYB8GS/Passe
FIGMA_FILE_ID=oevjrS0eaqL3VHSvKYB8GS

# Banco de Dados PostgreSQL
POSTGRES_DB=mercado_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/mercado_db

# CORS & Frontend
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
VITE_API_URL=/api/v1
```

---

## 7. Arquitetura e Decisões Técnicas

### 7.1 Schema Relacional e Migrations Flyway
Localizado em `backend/src/main/resources/db/migration/V1__init_schema.sql`, o script cria as **7 tabelas obrigatórias** em snake_case:
1. `clubes`: `id`, `nome`, `sigla`, `caixa`, `formacao`, `criado_em`.
   - Restrição: `sigla` UNIQUE e `LOWER(TRIM(nome))` UNIQUE (case-insensitive, mas sensível a acentos).
2. `jogadores`: `id`, `nome`, `posicao`, `agilidade`, `idade`, `valor_base`, `condicao`, `clube_id`, `velocidade`, `finalizacao`, `passe`, `drible`, `defesa`, `fisico`, `potencial`, `excluido_em`, `criado_em`, `atualizado_em`.
3. `contratos`: `id`, `jogador_id`, `clube_id`, `valor_compra`, `fidelidade_ate`, `situacao`, `iniciado_em`, `encerrado_em`.
4. `transacoes`: `id`, `clube_id`, `jogador_id`, `nome_jogador`, `tipo`, `valor`, `taxa`, `multa`, `lucro`, `variacao_caixa`, `criado_em`.
5. `escalacoes`: `clube_id`, `jogador_id`, `criado_em`.
   - PK composta `(clube_id, jogador_id)` e restrição UNIQUE em `jogador_id`.
6. `partidas`: `id`, `mandante_id`, `visitante_id`, `gols_mandante`, `gols_visitante`, `formacao_mandante`, `formacao_visitante`, `jogada_em`.
7. `duelos_partida`: `id`, `partida_id`, `ordem`, `clube_atacante_id`, `atacante_id`, `defensor_id`, `nome_atacante`, `nome_defensor`, `posicao_atacante`, `posicao_defensor`, `condicao_atacante`, `condicao_defensor`, `atributo_ataque`, `atributo_defesa`, `valor_ataque`, `valor_defesa`, `gol`.

> **REGRA CRÍTICA DE SCHEMA:** Nenhuma coluna de dados calculados em tempo de execução foi adicionada às tabelas (`overall`, `valor_mercado`, `valor_elenco`, `patrimonio`, `dias_restantes`, `multa_rescisoria`, pontos ou posições da tabela).

### 7.2 Padronização de Datas e Fuso Horário
- Configurado via Jackson Custom Serializers/Deserializers em `JacksonConfig.java`.
- Todas as saídas de data/hora utilizam `America/Sao_Paulo` (`-03:00`) no formato ISO-8601 `yyyy-MM-dd'T'HH:mm:ss-03:00`.

### 7.3 Tratamento Centralizado de Erros
Implementado em `GlobalExceptionHandler.java` com `@RestControllerAdvice`:
- Retorno estritamente no formato `{ "message": "..." }`, sem campos adicionais nem stack traces.
- `400 Bad Request`: Validações de payload, conversões de tipo e parâmetros inválidos.
- `404 Not Found`: Entidades não encontradas ou excluídas logicamente (`excluido_em IS NOT NULL`).
- `409 Conflict`: Conflitos de regra de negócio (saldo insuficiente, limite de elenco, jogador não livre, recompra proibida) e integridade de chave única.

### 7.4 Registro de Logs Estruturados (SLF4J / Logback)
- Implementado em `RequestLoggingFilter.java` através de `OncePerRequestFilter`.
- Utiliza a biblioteca SLF4J / Logback nativa do ecossistema Spring Boot.
- Registra para cada requisição: data/hora no fuso de Brasília, método HTTP, caminho completo (URI com query params), status code HTTP e tempo de resposta em milissegundos.

### 7.5 Documentação Interativa OpenAPI / Swagger
- Integrado via `springdoc-openapi-starter-webmvc-ui` (v2.6.0) com metadados configurados em `OpenApiConfig.java`.
- Documentação interativa disponível diretamente em:
  - `http://localhost:8080/swagger-ui.html` (e `/api/v1/swagger-ui.html`)
  - `http://localhost:8080/v3/api-docs` (e `/api/v1/v3/api-docs`)
- Todos os endpoints e DTOs estão anotados com tags, resumos, descrições detalhadas e esquemas de erros padronizados.

### 7.6 Inspeção de Design via Figma MCP
- Integrado com o projeto Figma oficial (`oevjrS0eaqL3VHSvKYB8GS`).
- A interface utiliza as especificações do design system do arquivo Figma: fonte Geist, tokens de sombra (`shadow-xs` a `shadow-lg`), paleta de cores neutras e azuis e cards de métricas.

---

## 8. Funcionalidades Não Implementadas

- **FASE 1 Concluída com Sucesso:** Toda a infraestrutura base, Docker, migrations Flyway, configuração do Spring Boot, cliente HTTP com interceptores e design base do frontend foram implementados e validados.
- **Próximas Fases (Fases 2 a 5):** Os endpoints de negócio específicos de listagem com filtros combinados, cálculo dinâmico de overall, endpoints transacionais de compra e venda com multa rescisória, escalação de 5 titulares e motor de duelos da partida serão entregues nas respectivas fases do cronograma.

---

## 9. Uso de Inteligência Artificial

- **Ferramenta Utilizada:** Google Antigravity / Gemini 3.8 Flash.
- **Escopo do Uso:** A ferramenta foi utilizada como assistente de engenharia para estruturação do scaffold de arquitetura inicial, geração de migrations DDL com validação de constraints, configuração do interceptor Axios de extração de mensagens de erro e implementação dos testes automatizados para as regras RN02 a RN05.
- **Validação Humana e Autônoma:** Todos os arquivos gerados foram inspecionados, compilados via Maven e validados com testes unitários e de integração sobre instâncias reais do PostgreSQL 16 via Docker Compose.
# desafio-isi-dev-1
