# 📅 PLAN.md — Planejamento por Fases e Sprints

> Roadmap completo do De Olho na Câmara — do MVP acadêmico à plataforma nacional.

---

## FILOSOFIA DE ENTREGA

```
"Entregue pequeno. Entregue funcionando. Itere com dados reais."
```

1. **Funciona** — entrega o valor mínimo sem errar
2. **Funciona bem** — polish de UX, tratamento de edge cases
3. **Funciona bonito** — design final, animações, performance

---

## ✅ SPRINT — REFATORAÇÃO MVC *(Concluída)*

**Objetivo:** Migrar a base de código existente para a arquitetura Client-Side MVC estrita definida em `ARCHITECTURE.md`.

> Esta sprint não adiciona funcionalidade nova. Ela garante que o que já existe seja sustentável para o que vem a seguir.

### Checklist de Refatoração

#### Estrutura de diretórios
- [x] Criar pastas `assets/js/models/`, `assets/js/views/`, `assets/js/controllers/`
- [x] Mover e renomear `assets/js/pages/deputados.js` → `assets/js/controllers/DeputadosController.js`
- [x] Mover e renomear `assets/js/pages/perfil.js` → `assets/js/controllers/PerfilDeputadoController.js`
- [x] Confirmar que `assets/js/services/` está no lugar correto (já existe)

#### Extração das Views
- [x] Criar `assets/js/views/DeputadosView.js` — extrair toda manipulação de DOM de `deputados.js`
- [x] Criar `assets/js/views/PerfilDeputadoView.js` — extrair toda manipulação de DOM e Chart.js de `perfil.js`
- [x] Criar `assets/js/views/DashboardView.js` — extrair renderização do `index.html`

#### Criação dos Models
- [x] Criar `assets/js/models/DeputadoModel.js` — encapsular chamadas a `camaraApi.js` para deputados
- [x] Criar `assets/js/models/MonitoramentoModel.js` — encapsular CRUD do Back4App para `MonitoredDeputies`
- [x] Criar `assets/js/models/AvaliacaoModel.js` — encapsular CRUD do Back4App para `Avaliacao`

#### Limpeza e validação
- [x] Auditar `camaraApi.js` — garantir que é o único arquivo com `fetch()`
- [x] Auditar `back4app.js` — garantir que é o único arquivo com `Parse.Query`
- [x] Verificar que nenhuma View importa `camaraApi.js` ou `back4app.js` diretamente
- [x] Remover arquivos e pastas obsoletos que não se encaixam na nova estrutura
- [x] Testar fluxo completo: Dashboard → Listagem → Perfil → Monitoramento → Avaliação

---

## ✅ SPRINT — PROPOSIÇÕES E TERMÔMETRO DE LEIS *(Concluída)*

**Objetivo:** Exibir as proposições (projetos de lei) de autoria do deputado federal e disponibilizar botões interativos de Apoio e Rejeição para a comunidade.

- [x] Buscar proposições reais do deputado via API de Dados Abertos (`DeputadoModel.js`)
- [x] Criar o Model de Termômetro (`TermometroModel.js`) para integrar CRUD no Back4App
- [x] Adicionar o design de cards elegantes (Teal/Green) para proposições no `PerfilDeputadoView.js`
- [x] Adicionar botões interativos de "👍 Apoiar" e "👎 Rejeitar" com contagem dinâmica de votos
- [x] Validar autenticação: exigir login para poder computar ou alterar voto
- [x] Ligar eventos dinâmicos no `PerfilDeputadoController.js` para atualizar o card na hora do clique


---

## ✅ FASE 0 — FUNDAÇÃO *(Concluída)*

**Objetivo:** Estrutura pronta para codar sem impedimentos técnicos.

- [x] Criar repositório GitHub com `.gitignore` correto
- [x] Criar estrutura de pastas inicial
- [x] Criar conta e aplicação no Back4App
- [x] Configurar classes no Back4App via script (`js/setup-db.js`)
- [x] Criar `js/config.js` com credenciais do Back4App
- [x] Testar conexão Parse: `Parse.initialize()` → funcionando
- [x] Testar primeira chamada à API da Câmara: `GET /deputados`
- [x] Configurar CDNs no HTML base: Chart.js, Parse SDK, Tailwind
- [x] Criar `index.html` base com navbar, sidebar e área de conteúdo

---

## ✅ SPRINT 1 — MVP DO DASHBOARD *(Concluída)*

**Objetivo:** Dashboard principal funcionando com dados reais e CRUD operacional.

- [x] Criação da Landing Page Institucional (index.html raiz)
- [x] Renomear antigo index para `pages/dashboard.html`
- [x] Integrar API da Câmara (`buscarDeputadosIniciais()` com foto, nome, partido, UF)
- [x] Renderizar cards dinamicamente com Tailwind CSS
- [x] Autenticação com `Parse.User` (cadastro e login em modal)
- [x] Exibir status de autenticação na sidebar e header
- [x] Gráfico `doughnut` de distribuição partidária (Chart.js)
- [x] **CREATE/DELETE** — Toggle de monitoramento (classe `Monitoramento` no Back4App)
- [x] **CREATE/READ/UPDATE** — Modal de avaliação com estrelas (1–5) e comentário

---

## ✅ SPRINT 2 — PERFIL DO DEPUTADO *(Concluída)*

**Objetivo:** Tela de análise individual completa do parlamentar.

- [x] `camaraApi.js` com `buscarVotacoesDeputado()` e `buscarEventosDeputado()`
- [x] `analytics.js` com `calcularTaxaPresenca()`, `calcularMediaGastos()`, `detectarAnomalias()`
- [x] Página `deputado-perfil.html` com:
  - [x] Header: foto, nome, partido, estado, badge de status
  - [x] 4 KPI Cards: Presença %, Gasto médio, Coesão partidária %, Total de proposições
  - [x] Badge de anomalia composta (⚠️ quando detectada)
  - [x] Gráfico de Gastos CEAP por mês (últimos 12 meses)
  - [x] Gráfico de Taxa de presença ao longo do tempo
  - [x] Gráfico de Categorias de gasto
  - [x] Tabela: últimas 20 votações (Sim / Não / Ausente)
  - [x] Botão "Acompanhar no Radar" direto do perfil
  - [x] Export de relatório individual
- [x] Página `deputados.html` com filtros por UF, Partido e Nome
- [x] Ordenação flexível e paginação

---

## ✅ SPRINT 3 — PARTIDOS E INTELIGÊNCIA *(Concluída)*

**Objetivo:** Análises partidárias e motor de inteligência política.

- [x] `PartidoModel.js` com `listarPartidos()`, `buscarMembrosPartido()`
- [x] Calcular coesão interna partidária e alinhamento entre bancadas
- [x] `partidos.html` — listagem com número de membros e taxa de coesão
- [x] `partido-perfil.html` — análise detalhada da bancada do partido
- [x] `radar-anomalias.html` — centralizador de despesas e anomalias da Câmara

---

## 🕐 SPRINT 4 — POLISH E DEPLOY *(Em Progresso)*

**Objetivo:** Produto polido, responsivo, sem erros e publicado.

- [ ] Skeleton loaders para todas as chamadas de API
- [ ] Estados vazios estilizados (zero resultados, erro de rede)
- [ ] Transições e micro-animações suaves
- [x] Página `sobre.html` com missão, APIs e licenças
- [ ] Deploy público no GitHub Pages ou Vercel
- [ ] Testes manuais em mobile (responsividade)
- [x] Zero erros críticos no console

---

## 📈 FASE 2

- [x] **Fase 2.3 (Refatoracao de Partidos e Deputados)** — Expansao do Perfil do Deputado e Refatoracao Completa de Partidos (Integracao Wikipedia, Consolidacao de Gastos de Bancada, Logos Oficiais e Scatter Plot de Espectro Interno)
- [x] **Sprint 5** — Comparador lado a lado de dois parlamentares ou partidos
- [ ] **Sprint 6** — Geracao de PDFs e download em CSV(por ultimo(baixa importancia))
- [ ] **Sprint 7** — Heatmap geografico de votacoes por estado
- [/] **Sprint 8** — Forum e Termometro da Opiniao Publica em proposicoes (Termometro implementado)
- [ ] **Sprint 9** — Bussola Ideologica (quiz + algoritmo de match com politicos)
- [x] **Sprint 10** — Mapa de espectro ideologico baseado em votos reais
- [x] **Sprint 11** — Gamificacao: badges por metas de atuacao parlamentar

### 🧠 Módulo de Inteligência de Gastos e Eficiência (Fase 2)

Este módulo introduz novas ferramentas analíticas de auditoria cidadã, cruzando dados financeiros com a atuação legislativa real para medir a eficiência dos parlamentares.

#### 1. ROI Parlamentar (Custo-Efetividade)
Cruzamento do valor total gasto em cota parlamentar (escritório, viagens) com a produtividade real (quantidade de PLs e PECs propostos e efetivamente aprovados).
- **Arquitetura e Integração (API da Câmara):**
  - Obter despesas via `GET /deputados/{id}/despesas` para totalizar os gastos.
  - Obter proposições via `GET /proposicoes?siglaTipo=PL,PEC&idDeputadoAutor={id}`.
  - Verificar a situação da proposição usando o `codSituacao` retornado em `GET /proposicoes/{id}` ou mapeado através de `GET /referencias/proposicoes/codSituacao` para confirmar o que virou norma jurídica.

#### 2. Raio-X de Gastos (Follow the Money)
Categorização visual de onde o dinheiro da cota está indo (marketing, aluguel, passagens aéreas) usando gráficos com Chart.js.
- **Arquitetura e Integração (API da Câmara):**
  - Agregar despesas por categoria usando `GET /deputados/{id}/despesas` e o campo `tipoDespesa`.
  - Usar `GET /referencias/deputados/tipoDespesa` para mapeamento padronizado de tipos de despesas se necessário.
  - Componentização visual: Renderizar com Chart.js (`doughnut` ou `polarArea`) dentro de `assets/js/views/PerfilDeputadoView.js`.

#### 3. Ranking de Economia
Um placar listando os deputados mais econômicos, cruzando a economia com a taxa de presença para não premiar parlamentares que não gastam simplesmente por serem ausentes.
- **Arquitetura e Integração (API da Câmara):**
  - **Dados Financeiros:** Consumir os arquivos de dados abertos em lote `http://www.camara.leg.br/cotas/Ano-{ano}.csv.zip` para calcular de forma ágil a média de todos os deputados (Backend/Workers ou Caching estruturado).
  - **Dados de Presença:** Download em lote `http://dadosabertos.camara.leg.br/arquivos/eventosPresencaDeputados/json/eventosPresencaDeputados-{ano}.json` (ou consumir iterativamente `/deputados/{id}/eventos`).
  - Lógica: Atribuir pesos que penalizam ausências no ranking de menor gasto.

#### 4. Taxa de Sucesso Legislativo
Indicador de quantas leis o deputado propôs que realmente viraram lei versus as que foram arquivadas.
- **Arquitetura e Integração (API da Câmara):**
  - Listar todas as propostas com `GET /proposicoes?idDeputadoAutor={id}`.
  - Mapear a situação de cada uma consultando `GET /referencias/proposicoes/codSituacao` e `GET /referencias/situacoesProposicao`.
  - Cálculo percentual: `(Projetos Aprovados / Total de Projetos Apresentados) * 100`, exposto em formato de termômetro de performance ou gauge chart.

---

## 📊 MÉTRICAS DE SUCESSO DO MVP

| Métrica | Meta |
|---|---|
| Telas implementadas | Mínimo 6 |
| Gráficos Chart.js | Mínimo 5 tipos diferentes |
| Operações CRUD | Todas as 4 (Create, Read, Update, Delete) |
| APIs integradas | API Câmara + Back4App |
| Anomalias detectáveis | Mínimo 3 tipos |
| Tempo de carregamento | < 3 segundos |
| Erros críticos no console | Zero |
| Arquitetura | MVC estrito validado em code review |