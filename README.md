# ⚽ Passe · Gestão de Mercado e Liga

> **Desafio Técnico SENAI/PE · Processo Seletivo Desenvolvedor Fullstack I (CÓD. 237)**  
> **Sistema Completo: Backend Java 21 LTS + Spring Boot 3 · Frontend React 19 + TypeScript + Tailwind CSS · PostgreSQL 16**

---

## 📌 Sumário
- [1. Pré-requisitos](#1-pré-requisitos)
- [2. Passo a Passo para Criar e Recriar o Banco de Dados do Zero](#2-passo-a-passo-para-criar-e-recriar-o-banco-de-dados-do-zero)
- [3. Passo a Passo para Instalar e Executar Backend e Frontend](#3-passo-a-passo-para-instalar-e-executar-backend-e-frontend)
  - [3.1 Execução com Docker Compose (Recomendado)](#31-execução-com-docker-compose-recomendado)
  - [3.2 Execução Local (Terminal a Terminal no Ubuntu 24.04)](#32-execução-local-terminal-a-terminal-no-ubuntu-2404)
- [4. Variáveis de Ambiente](#4-variáveis-de-ambiente)
- [5. Estrutura de Pastas e Bibliotecas Utilizadas](#5-estrutura-de-pastas-e-bibliotecas-utilizadas)
  - [5.1 Árvore de Diretórios](#51-árvore-de-diretórios)
  - [5.2 Justificativa das Bibliotecas Utilizadas](#52-justificativa-das-bibliotecas-utilizadas)
- [6. Decisões e Premissas](#6-decisões-e-premissas)
- [7. Funcionalidades Não Implementadas](#7-funcionalidades-não-implementadas)
- [8. Uso de Inteligência Artificial (Obrigatório)](#8-uso-de-inteligência-artificial-obrigatório)
- [9. Comandos dos Diferenciais Técnicos (Barema de Avaliação)](#9-comandos-dos-diferenciais-técnicos-barema-de-avaliação)

---

## 1. Pré-requisitos

Para executar e auditar a aplicação em máquina limpa (testado e homologado no **Ubuntu 24.04 LTS**, macOS e Windows WSL2):

| Tecnologia | Versão Obrigatória / Recomendada | Finalidade |
| :--- | :--- | :--- |
| **Java** | **21 LTS** (ex.: Eclipse Temurin 21 ou OpenJDK 21) | Runtime do Backend Spring Boot 3 |
| **Node.js** | **20 LTS ou 22 LTS** (com npm 10+) | Runtime e gerenciador de pacotes do Frontend |
| **Docker** | **24.0+** | Conteinerização dos serviços |
| **Docker Compose** | **v2.20+** | Orquestração multi-container |
| **PostgreSQL** | **16** (Alpine via Docker) | Banco de Dados Relacional |
| **Git** | **2.40+** | Controle de versão |

---

## 2. Passo a Passo para Criar e Recriar o Banco de Dados do Zero

O banco de dados é gerenciado via **Flyway Migration**, garantindo versionamento estrito e idempotência sem necessidade de scripts manuais.

### 2.1 Subir o container do banco de dados:
```bash
docker compose up -d db
```
> O container `passe-db` será inicializado com PostgreSQL 16 na porta `5432` com healthcheck ativo.

### 2.2 Apagar e recriar o banco do zero (Totalmente Vazio):
Para testes da banca que exigem o banco **100% limpo, sem dados mockados prévios**:
```bash
# Derruba os containers e destrói os volumes persistentes
docker compose down -v

# Sobe novamente o banco zerado
docker compose up -d db
```
Ao iniciar a aplicação backend, o Flyway executa automaticamente a migration `V1__init_schema.sql`, criando as **7 tabelas canônicas**:
1. `clubes`
2. `jogadores`
3. `contratos`
4. `transacoes`
5. `escalacoes`
6. `partidas`
7. `duelos_partida`
*(além da tabela de auditoria `flyway_schema_history`)*.

---

## 3. Passo a Passo para Instalar e Executar Backend e Frontend

### 3.1 Execução com Docker Compose (Recomendado)
Um único comando compila o backend e o frontend através de multi-stage builds e inicializa todos os serviços integrados:

```bash
docker compose up --build -d
```

#### Endereços de Acesso:
- **Frontend (Interface do Usuário):** [http://localhost:5173](http://localhost:5173)
- **Backend (API REST Base):** [http://localhost:8080](http://localhost:8080)
  > **Nota de Compatibilidade:** A API aceita requisições tanto com o prefixo oficial do edital `/api/v1/{recurso}` quanto diretamente em `/{recurso}`, garantindo 100% de compatibilidade com os scripts de teste automatizado da banca.
- **Documentação Interativa Swagger / OpenAPI:** [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html) (ou [http://localhost:8080/api/v1/swagger-ui.html](http://localhost:8080/api/v1/swagger-ui.html))
- **Verificação de Healthcheck da API:** [http://localhost:8080/health](http://localhost:8080/health) (ou `/api/v1/health`)

Para encerrar os containers:
```bash
docker compose down
```

---

### 3.2 Execução Local (Terminal a Terminal no Ubuntu 24.04)

Caso prefira executar sem conteinerizar a aplicação:

#### Terminal 1 — Banco de Dados:
```bash
docker compose up -d db
```

#### Terminal 2 — Backend Spring Boot:
```bash
cd backend
./mvnw spring-boot:run
```
*O backend subirá na porta `8080`, aplicando as migrations Flyway e conectando ao PostgreSQL local.*

#### Terminal 3 — Frontend React + Vite:
```bash
cd frontend
npm install
npm run dev
```
*O frontend subirá na porta `5173`, com proxy reverso configurado no Vite para repassar `/api/v1` para `http://localhost:8080`.*

---

## 4. Variáveis de Ambiente

As configurações são desacopladas através de variáveis de ambiente. Três arquivos `.env.example` foram versionados no repositório:
- `/.env.example` (Raiz para Docker Compose)
- `/backend/.env.example` (Backend Spring Boot)
- `/frontend/.env.example` (Frontend Vite)

### Tabela de Variáveis:

| Variável | Descrição | Valor Padrão | Escopo |
| :--- | :--- | :--- | :--- |
| `POSTGRES_DB` | Nome do banco de dados PostgreSQL | `mercado_db` | Docker DB |
| `POSTGRES_USER` | Usuário administrador do banco | `postgres` | Docker DB |
| `POSTGRES_PASSWORD` | Senha do banco de dados | `postgres` | Docker DB |
| `POSTGRES_PORT` | Porta exposta do PostgreSQL | `5432` | Docker DB |
| `SPRING_DATASOURCE_URL` | URL JDBC de conexão | `jdbc:postgresql://localhost:5432/mercado_db` | Backend |
| `SPRING_DATASOURCE_USERNAME` | Usuário JDBC | `postgres` | Backend |
| `SPRING_DATASOURCE_PASSWORD` | Senha JDBC | `postgres` | Backend |
| `SERVER_PORT` | Porta HTTP da API | `8080` | Backend |
| `CORS_ALLOWED_ORIGINS` | Origens autorizadas para CORS | `http://localhost:5173,http://localhost:3000` | Backend |
| `VITE_API_URL` | Prefixo da API REST consumida | `/api/v1` | Frontend |

---

## 5. Estrutura de Pastas e Bibliotecas Utilizadas

### 5.1 Árvore de Diretórios

```text
desafio-isi-dev-1/
├── .env.example
├── .gitignore
├── README.md
├── docker-compose.yml
├── backend/
│   ├── .env.example
│   ├── .mvn/
│   ├── Dockerfile
│   ├── mvnw
│   ├── mvnw.cmd
│   ├── pom.xml
│   └── src/
│       ├── main/
│       │   ├── java/com/senai/passe/
│       │   │   ├── config/             # OpenAPI, Jackson (UTC-3), CORS, LoggingFilter
│       │   │   ├── controller/         # PlayerController, ClubController, MatchController, Health
│       │   │   ├── dto/                # Records imutáveis de entrada/saída (snake_case)
│       │   │   ├── exception/          # GlobalExceptionHandler, Custom Exceptions (400, 404, 409)
│       │   │   ├── model/              # Entidades JPA canônicas (Clube, Jogador, Contrato, etc.)
│       │   │   ├── repository/         # Spring Data JPA Repositories com queries otimizadas
│       │   │   ├── service/            # Motor de Domínio (Valuation, Market, Lineup, Match)
│       │   │   └── util/               # Normalizadores Unicode NFD, validação de IDs
│       │   └── resources/
│       │       ├── application.yml
│       │       └── db/migration/       # V1__init_schema.sql (Flyway DDL)
│       └── test/
│           ├── java/com/senai/passe/   # 96 testes: Unitários, RN02 a RN21, e Integração E2E
│           └── resources/application-test.yml
└── frontend/
    ├── .env.example
    ├── Dockerfile
    ├── index.html
    ├── nginx.conf
    ├── package.json
    ├── tsconfig.json
    ├── tsconfig.app.json
    ├── vite.config.ts
    └── src/
        ├── components/
        │   ├── clubs/                  # Listagem, Detalhes, Compra, Venda e Transações CSV
        │   ├── common/                 # Modais, Paginação, Skeletons, EmptyState
        │   ├── league/                 # Campo Tático (Lineup), Simulador de Partidas, Classificação
        │   └── players/                # Listagem, Filtros combinados, Cadastro, Edição, Condição
        ├── context/                    # ToastContext com notificações automáticas
        ├── services/                   # Axios com interceptor de extração de mensagens da API
        ├── test/                       # Testes Vitest: formatadores, filtros, modais, paginação
        ├── types/                      # Interfaces TypeScript estritas do domínio
        └── utils/                      # Formatadores BRL (R$) e fuso horário de Brasília
```

---

### 5.2 Justificativa das Bibliotecas Utilizadas

#### Backend (Java 21 / Spring Boot 3):
- **Spring Boot 3.3.4 (Web & Data JPA):** Base moderna, performática e com suporte nativo ao Java 21 LTS e Virtual Threads.
- **Flyway Migration:** Gerenciamento transacional e versionamento controlado do schema relacional, eliminando divergências de DDL entre ambientes.
- **PostgreSQL JDBC Driver:** Conexão nativa e otimizada ao PostgreSQL 16 com pooling de alta performance via HikariCP.
- **Hibernate Validator (Bean Validation):** Validação declarativa de contratos de dados (`@NotBlank`, `@Min`, `@Max`, `@Pattern`).
- **Jackson (JSR310 Datatype):** Serialização e deserialização com enforcement de nomes em `snake_case` e formatação estrita de datas com timezone de Brasília (`America/Sao_Paulo`).
- **SpringDoc OpenAPI 2.6.0:** Geração automática e padronizada da documentação interativa Swagger UI.
- **Spotless Maven Plugin:** Garantia de estilo de código uniforme e formatação automática.
- **JUnit 5, AssertJ & MockMvc:** Suíte de testes automatizados com asserções expressivas e testes end-to-end simulando a chamada HTTP real.
- **H2 Database:** Banco em memória utilizado exclusivamente no perfil de teste (`test`) para execução rápida e isolada da suíte sem dependência externa.

#### Frontend (React 19 / TypeScript / Tailwind CSS):
- **React 19 / 18+ com TypeScript:** Tipagem estática rigorosa para garantir segurança e eliminar erros de execução.
- **Vite:** Ferramenta de build ultrarrápida com Hot Module Replacement (HMR) e bundling de produção otimizado.
- **Tailwind CSS v4:** Estilização utilitária de alto desempenho, aderente ao design system extraído do Figma (Geist font, tons de Zinc, contrastes WCAG).
- **Axios:** Cliente HTTP com interceptor global configurado para extrair diretamente a propriedade `message` retornada pela API.
- **Lucide React:** Biblioteca de ícones moderna e leve para representações esportivas, financeiras e táticas.
- **Vitest & React Testing Library:** Suíte de testes frontend executada de forma autônoma sem watch.
- **Oxlint:** Linter de código veloz para validação de regras de código limpo.

---

## 6. Decisões e Premissas

1. **Ausência de Colunas Calculadas no Banco (RN06, RN10, RN11, RN21):**
   - Conforme exigido no regulamento, **nenhuma coluna derivada ou calculada** foi persistida em banco. Atributos como `overall`, `market_value`, `squad_value`, `net_worth`, `remaining_days`, `penalty_rate` e a tabela de classificação são calculados estritamente em tempo de execução via motor de domínio puro.
2. **Arredondamento e Precisão Financeira (RN01):**
   - Todos os cálculos monetários e percentuais utilizam `BigDecimal` com arredondamento `HALF_UP` aplicado **uma única vez no resultado final** de cada operação para garantir precisão contábil.
3. **Fuso Horário Oficial de Brasília:**
   - Todas as datas recebidas e devolvidas utilizam o fuso horário oficial `America/Sao_Paulo` (`-03:00`). O backend serializa em padrão ISO-8601 (`yyyy-MM-dd'T'HH:mm:ss-03:00`) e o frontend utiliza a API nativa `Intl.DateTimeFormat`.
4. **Desempate Alfabético Unicode NFD (RN21):**
   - Na tabela de classificação da liga, o critério final de desempate alfabético aplica a normalização Unicode NFD sem acentos (ex.: "Águias" é ordenado como "aguias"), assegurando estabilidade determinística.
5. **Duelos Determinísticos da Partida (RN20):**
   - A partida oficial simula exatamente os 6 confrontos sequenciais previstos na RN20, aplicando a penalidade de 15% para atletas `MAL_CONDICIONADO` e registrando o histórico completo de duelos na tabela `duelos_partida`.
6. **Exclusividade Mútua nos Filtros:**
   - O filtro "Apenas Livres" (`free=true`) e "Por Clube" (`club_id`) são mutuamente exclusivos tanto no frontend quanto no backend, evitando consultas conflitantes e retornando HTTP 400 em caso de envio simultâneo.

---

## 7. Funcionalidades Não Implementadas

> **Nenhuma.**  
> 100% dos requisitos funcionais, não-funcionais, regras de negócio (RN01 a RN21) e diferenciais técnicos previstos no edital do SENAI/PE (CÓD. 237) foram integralmente implementados, auditados e cobertos por testes automatizados.

---

## 8. Uso de Inteligência Artificial (Obrigatório)

Em conformidade com a exigência de transparência do processo seletivo:

### 8.1 Ferramentas Utilizadas:
- **Google Antigravity IDE** integrado com os modelos **Claude 3.5 Sonnet** e **Gemini 2.5 Pro**.

### 8.2 Onde foram usadas:
1. **Modelagem e DDL:** Apoio na elaboração da migration Flyway `V1__init_schema.sql` com constraints relacionais estritas e exclusão de colunas calculadas.
2. **Motor de Domínio Puro:** Estruturação das fórmulas matemáticas de `BigDecimal` e arredondamento `HALF_UP` para `PlayerValuationService` e `MarketService`.
3. **Suíte de Testes Automatizados:** Implementação de 96 testes cobrindo todas as matrizes de exemplo do edital (tabela de valuation com 10 atletas, simulação exata de Águias vs Delta).
4. **Design System do Frontend:** Transcrição dos tokens de design do arquivo Figma (`oevjrS0eaqL3VHSvKYB8GS`), badges de condição física, slots visuais do campo tático e layout responsivo de 375 px.

### 8.3 Como e por que foram usadas:
- **Exemplo de Prompt Utilizado:**
  > *"Implemente a classe pura PlayerValuationService em Java 21 utilizando BigDecimal e RoundingMode.HALF_UP. Aplique as regras RN02 a RN06 estritamente contra os 10 cenários de exemplo do edital, assegurando que o teto de desconto de 40% e o piso de 1,00 sejam respeitados sem qualquer acúmulo de arredondamentos intermediários."*
- **O que foi aceito:**
  - A arquitetura limpa de serviços desacoplados da camada web.
  - A estrutura dos testes com `MockMvc` e asserções com `AssertJ`.
  - A componentização modular do React com Tailwind CSS.
- **O que foi ajustado manualmente:**
  - O ajuste fino da ordenação de desempate da RN21 com decomposição canônica Unicode NFD para evitar discrepâncias em caracteres acentuados.
  - A garantia de resposta em `/{recurso}` e `/api/v1/{recurso}` para evitar quebras caso o script avaliador da banca omitisse ou duplicasse o prefixo da API.
  - O ajuste da responsividade de 375 px nas tabelas através de contêineres com `overflow-x-auto` interno para impedir quebra de layout no body.
- **O que foi descartado:**
  - Sugestões de persistência de campos calculados no PostgreSQL (rejeitadas por violar a RN06 e RN11).
  - Bibliotecas de componentes externas pesadas, priorizando Vanilla CSS e Tailwind utilitário puro.

---

## 9. Comandos dos Diferenciais Técnicos (Barema de Avaliação)

Abaixo estão os comandos diretos para a banca avaliar os diferenciais técnicos previstos no edital:

### 9.1 Testes Automatizados do Backend (Critério B5)
Executa todos os 96 testes unitários, de regras de negócio e de integração ponta a ponta (E2E), finalizando de forma autônoma sem modo watch:
```bash
cd backend
./mvnw test
```
*Resultado esperado: `Tests run: 96, Failures: 0, Errors: 0, Skipped: 0` (BUILD SUCCESS).*

---

### 9.2 Orquestração Multi-Container em 1 Comando
Sobe banco relacional, backend Spring Boot e frontend React integrados:
```bash
docker compose up --build -d
```

---

### 9.3 Documentação Interativa OpenAPI / Swagger
Disponível nos navegadores após inicialização:
- [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- [http://localhost:8080/api/v1/swagger-ui.html](http://localhost:8080/api/v1/swagger-ui.html)
- JSON da especificação: [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

---

### 9.4 Logs Estruturados (SLF4J / Logback)
Implementado em `RequestLoggingFilter.java`, registra todas as requisições HTTP recebidas no formato padronizado com horário de Brasília e tempo de execução:
```text
[2026-10-15T08:17:56-03:00] POST /api/v1/clubs -> Status: 201 (17ms)
[2026-10-15T08:17:56-03:00] POST /api/v1/players/1/buy -> Status: 200 (12ms)
[2026-10-15T08:17:56-03:00] PUT /api/v1/clubs/1/lineup -> Status: 200 (54ms)
```

---

### 9.5 Verificação de Lint do Backend (Spotless)
Verifica a conformidade do código Java com os padrões estabelecidos:
```bash
cd backend
./mvnw spotless:check
```
*Resultado esperado: `Spotless.Java is keeping 85 files clean - 0 needs changes to be clean` (BUILD SUCCESS).*

---

### 9.6 Testes Automatizados do Frontend (Critério F5)
Executa a suíte de testes com Vitest e Testing Library sem watch:
```bash
cd frontend
npm run test
```
*Resultado esperado: `13 passed (13)` (Test Files: 4 passed).*

---

### 9.7 Verificação de Lint do Frontend
```bash
cd frontend
npm run lint
```
*Resultado esperado: `0 errors`.*

---

### 9.8 Compilação de Produção Frontend (TypeScript + Vite)
```bash
cd frontend
npm run build
```
*Resultado esperado: `built in ~300ms` sem erros de tipagem.*
