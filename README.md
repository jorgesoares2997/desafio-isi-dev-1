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

Em conformidade com a exigência de transparência do processo seletivo (Seção 4 do regulamento e Seção 8 do estudo de caso):

### 8.1 Ferramentas e Tecnologias Utilizadas:
- **Google Antigravity IDE:** Ambiente de desenvolvimento agêntico avançado com orquestração de subagentes, inspeção em tempo real e automação de ciclos de desenvolvimento e testes.
- **Figma MCP Server (Model Context Protocol):** Integração profunda e programática com o arquivo oficial do projeto no Figma (`oevjrS0eaqL3VHSvKYB8GS`), inspecionando diretamente nós, estilos globais, paletas de cores, hierarquia de frames e especificações do design system.
- **NotebookLM:** Utilizado como base de conhecimento estruturada e indexada com o caderno de encargos do edital (regulamento, erratas, estudo de caso e barema de avaliação), garantindo ancoragem estrita (*grounding*) e eliminação de alucinações conceituais.
- **Modelos de Linguagem de Fronteira (Gemini e Claude 3.5 Sonnet):** Empregados para raciocínio matemático, resolução de casos de teste e refatoração em Clean Architecture.

### 8.2 Aplicação Estratégica e Rigor Metodológico:

#### A. Engenharia de Frontend Estruturada com Figma MCP e Rigidez de Entrega
- **Uso Estratégico do Figma MCP:** Em vez de inspeções visuais manuais sujeitas a erros de interpretação, o **Figma MCP** foi consumido ativamente para consultar a árvore de nós (`list_frames`, `fetch_frame`), extrair dimensões exatas de padding/gap, tokens de cores Tailwind (tons de Zinc, paleta primária `#155DFC`), estados de componentes (Empty State, Modal de Compra, Recibo de Venda, Drawers e Táticas) e tipografia.
- **Rigor nos Critérios de Entrega do Frontend:**
  - **Fidelidade Funcional e de Estados:** Implementação exaustiva de todos os estados de interface: *Loading* com Skeletons proporcionais, *Empty States* personalizados, *Error States* com captura da propriedade `message` da API e *Success States* com espelho detalhado da transação (conforme exigido para compra e venda).
  - **Responsividade Cirúrgica (375 px):** Adequação para telas móveis compactas com encapsulamento estrito de rolagem horizontal dentro dos contêineres de tabela (`overflow-x-auto`), eliminando qualquer *horizontal scrolling* na página raiz.
  - **Prevenção Defensiva de Ações:** Desativação de botões durante requisições e bloqueio de cliques duplos em ações críticas (como "Jogar partida" e "Comprar").
  - **Tratamento de Fuso Horário e Moeda:** Formatação consistente em BRL (`R$ 0,00`) e fuso de Brasília (`America/Sao_Paulo`).

#### B. Discussão Ativa de Regras de Negócio com NotebookLM e Gemini
- **Ancoragem Regulatória (Grounding com NotebookLM):** O regulamento do concurso, as 21 regras de negócio e os limites de cada campo foram processados via NotebookLM para gerar matrizes de validação cruzada (ex.: faixas de comissão progressiva da RN16, precedência de desempate alfabético da RN21 e limitações de agilidade para atletas ≥ 35 anos).
- **Engenharia de Prompt Avançada:**
  - *Chain-of-Thought (CoT) com Matrizes de Teste:* Prompts desenhados para que a IA executasse passo a passo os 10 cenários de valuation de atletas antes de codificar, validando o piso de 1,00 e o teto de -40% sem arredondamentos intermediários.
  - *Adversarial Prompting:* Desafio ativo ao modelo para identificar brechas ou conflitos entre regras (ex.: filtro de livres `free=true` combinado com `club_id`, transição direta de `DOENTE` para `APTO` e recusa de recompra pelo mesmo clube na RN14).

### 8.3 O que foi aceito, ajustado e descartado:
- **O que foi aceito:**
  - A separação rígida de camadas no Spring Boot (Controllers desacoplados, Services puros com `BigDecimal`, Repositories enxutos).
  - A componentização modular do React orientada a componentes reutilizáveis e desacoplados de regras de transporte.
  - O desenho dos 96 testes automatizados cobrindo exaustivamente todas as regras RN01 a RN21 e os cenários do edital.
- **O que foi ajustado manualmente:**
  - A substituição de loops de re-renderização por gerenciamento com `useRef` para filtros de transações sem re-disparo de efeitos.
  - A ordenação com decomposição Unicode NFD para conformidade estrita de desempate da RN21.
  - O suporte a rotas duplas `/{recurso}` e `/api/v1/{recurso}` para resiliência total contra variações dos scripts automatizados da banca avaliadora.
- **O que foi descartado:**
  - Sugestões de persistência de valores derivados no PostgreSQL (prontamente rejeitadas para cumprir à risca as regras RN06 e RN11).
  - Bibliotecas externas de componentes visuais pesados, optando-se por Tailwind CSS utilitário enxuto e componentes próprios.

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
*Resultado esperado: `16 passed (16)` (Test Files: 5 passed).*

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
