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
- [ ] Transições 

## ✅ FASE 2.3 — REFATORAÇÃO DE PARTIDOS E DEPUTADOS *(Concluída)*

**Objetivo:** Expansão do perfil do deputado e consolidação de gastos de bancada.
- [x] Integração com API da Wikipedia para resumos históricos e imagens/logos de partidos.
- [x] Consolidação de gastos de bancada por partido.
- [x] Gráfico de espectro político interno (Scatter Plot) nos perfis de partido.
- [x] Novos KPIs do deputado: ROI Parlamentar e Taxa de Sucesso Legislativo.
- [x] Seção de Órgãos, Frentes Parlamentares, Histórico e Discursos do deputado.

## ✅ SPRINT 5 — COMPARADOR LADO A LADO *(Concluída)*

**Objetivo:** Permitir comparação direta de dois deputados ou dois partidos políticos.
- [x] Criação de `comparador.html` com layout responsivo e elegante.
- [x] Integração em MVC: `ComparadorView.js` e `ComparadorController.js`.
- [x] Comparação gráfica e estatística lado a lado (Gastos, Presença, Coesão, ROI, Sucesso, Proposições).
- [x] Seleção dinâmica e inteligente com autocomplete para os deputados/partidos.
- [x] Links de navegação adicionados à sidebar de todas as páginas da plataforma.

## ✅ SPRINT 10 — MAPA DE ESPECTRO IDEOLÓGICO REAL *(Concluída)*

**Objetivo:** Exibir o espectro ideológico dos deputados baseado em dados reais de votações.
- [x] Criação de `espectro.html`, `EspectroView.js` e `EspectroController.js`.
- [x] Gráfico Scatter Plot 2D de posicionamento dos deputados (Eixo Econômico vs Eixo Social).
- [x] Classificação ideológica real baseada no alinhamento de votações com projetos selecionados.
- [x] Filtros por partido, UF e busca por nome no mapa de espectro.

## ✅ SPRINT 11 — GAMIFICAÇÃO CÍVICA *(Concluída)*

**Objetivo:** Distribuir insígnias (badges) para os deputados com base no comportamento.
- [x] Criação do motor de badges no `AnalyticsService.js` (`avaliarBadges`).
- [x] Badges implementadas: "Presença de Ouro" (>=95% presença), "Economista" (gasto <= 50% da média), "Leal ao Partido" (coesão >= 90%), "Autor Prolífico" (>= 50 proposições).
- [x] Exibição em cards flutuantes com animação de hover e tooltips descritivas no perfil do deputado.

## ✅ SPRINT 9 — BÚSSOLA IDEOLÓGICA *(Concluída)*

**Objetivo:** Um quiz de 6 a 10 perguntas baseado em votações reais de temas polêmicos da Câmara para dar match com deputados.
- [x] Criação de `bussola.html` com design premium (Teal/Green) e sem emojis.
- [x] Implementação de `BussolaView.js` para renderizar o quiz interativo e a tela de match.
- [x] Implementação de `BussolaController.js` para gerenciar o estado das respostas e realizar o match de votações.
- [x] Algoritmo de match ideológico: cruzar as respostas "Sim"/"Não" do usuário com os votos reais dos deputados e retornar ranking de afinidade.
- [x] Integrar no menu sidebar de todas as páginas da plataforma.

## 📈 FASE 2 — ACOMPANHAMENTO DO STATUS

- [x] **Fase 2.3 (Refatoração de Partidos e Deputados)** — Concluído
- [x] **Sprint 5** — Comparador lado a lado — Concluído
- [ ] **Sprint 6** — Geração de PDFs e download em CSV (por último / baixa importância)
- [ ] **Sprint 7** — Heatmap geográfico de votações por estado
- [ ] **Sprint 8** — Fórum e Termômetro da Opinião Pública (Fórum pendente, Termômetro OK)
- [x] **Sprint 9** — Bússola Ideológica (quiz + match) — Concluído
- [x] **Sprint 10** — Mapa de espectro ideológico baseado em votos reais — Concluído
- [x] **Sprint 11** — Gamificação: badges por metas de atuação parlamentar — Concluído

---

## 🤖 FASE 3 — BACKLOG DE INOVAÇÃO (IA & FUTURO)

Roadmap de longo prazo derivado de `IDEIAS.md` para expansão e escala da plataforma:
1. **Tradutor de "Politiquês" com IA** (Gemini/OpenAI) para resumir ementas de projetos de lei em termos acessíveis ao cidadão.
2. **Follow the Money V2** (Financiamento vs. Votação): integração profunda com prestação de contas do TSE para detectar conflitos de interesses.
3. **Alertas Cidadãos (Notificações)**: disparo automático de e-mails/alertas se deputados monitorados realizarem gastos elevados ou mudarem votos.
4. **Gamificação do Cidadão (Auditor Cívico)**: sistema de pontuação (XP) e níveis para recompensar usuários engajados na fiscalização pública.
5. **Heatmap de Emendas Parlamentares**: visualização no mapa de municípios indicando onde cada recurso orçamentário foi investido.
6. **Progressive Web App (PWA)**: suporte a modo offline, instalação direta no celular e VLibras para acessibilidade total.

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