# 🏗️ ARCHITECTURE.md — Planta Baixa do Sistema MVC

> Documento de arquitetura oficial do De Olho na Câmara.
> Versão: 2.0.0 | Padrão: Client-Side MVC em Vanilla JS

---

## 1. O QUE É CLIENT-SIDE MVC NESTE PROJETO

Em vez de um framework que aplica MVC automaticamente, aqui **nós mesmos impomos a disciplina** dividindo cada funcionalidade em três arquivos com papéis fixos e intransferíveis.

```
┌──────────────────────────────────────────────────────────────────┐
│                     BROWSER (Client-Side)                        │
│                                                                  │
│  ┌─────────────┐    ┌──────────────────┐    ┌─────────────────┐ │
│  │   M O D E L │    │  C O N T R O L L │    │   V I E W       │ │
│  │             │◄───│       E R        │───►│                 │ │
│  │  Dados e    │    │                  │    │  DOM e eventos  │ │
│  │  APIs       │───►│  Orquestra tudo  │◄───│                 │ │
│  └─────────────┘    └──────────────────┘    └─────────────────┘ │
│         │                                                        │
│         │ fetch()                                                │
└─────────┼────────────────────────────────────────────────────────┘
          │
  ┌───────▼────────┐     ┌──────────────────────┐
  │ API da Câmara  │     │  Back4App (Parse SDK) │
  │ (Leitura)      │     │  (CRUD do usuário)    │
  └────────────────┘     └──────────────────────┘
```

---

## 2. PAPEL DE CADA CAMADA — DEFINIÇÃO EXATA

### MODEL — "O que sao os dados"

**Responsabilidade unica:** Toda comunicacao com o mundo externo.

- Chama `CamaraApiService` para buscar dados legislativos.
- Chama a API publica da Wikipedia (pt.wikipedia.org) para obter resumo historico, espectro e ideologia de partidos (usada especificamente como fallback no Model dos Partidos para suprir a ausencia de dados ideologicos e historicos na API da Camara).
- Chama `Parse SDK` para ler/escrever no Back4App.
- Chama `CacheService` para otimizar requisicoes.
- **NUNCA** acessa `document`, `querySelector` ou qualquer elemento do DOM.
- **NUNCA** conhece como os dados serao exibidos.
- Retorna sempre o formato padrao `{ success, data, source, timestamp, error }`.

```
assets/js/models/
  DeputadoModel.js       ← busca e processa dados de deputados
  PartidoModel.js        ← busca e processa dados de partidos
  VotacaoModel.js        ← busca votações e orientações
  MonitoramentoModel.js  ← CRUD de deputados monitorados (Back4App)
  AvaliacaoModel.js      ← CRUD de avaliações (Back4App)
```

### 🎨 VIEW — "Como os dados aparecem"

**Responsabilidade única:** Tudo que o usuário vê e toca.

- Renderiza HTML dinamicamente via template strings.
- Cria e destrói instâncias de Chart.js.
- Escuta eventos do DOM (`click`, `input`, `submit`…).
- Quando o usuário age, **notifica o Controller** via callback — não chama API.
- **NUNCA** usa `fetch()` ou chama Parse diretamente.
- **NUNCA** contém regras de negócio ou cálculos de KPI.

```
assets/js/views/
  DeputadosView.js         ← renderiza grid e filtros da listagem
  PerfilDeputadoView.js    ← renderiza KPIs, gráficos e tabela do perfil
  DashboardView.js         ← renderiza o painel principal
  RadarView.js             ← renderiza cards de anomalias
  PartidosView.js          ← renderiza listagem de partidos
```

### 🎛️ CONTROLLER — "Quem dirige o fluxo"

**Responsabilidade única:** Orquestrar Model e View.

- Inicializa a View e registra os callbacks de eventos.
- Chama o Model para obter dados.
- Passa os dados recebidos para a View renderizar.
- Trata erros e decide o que mostrar em caso de falha.
- **NUNCA** renderiza HTML diretamente.
- **NUNCA** chama `fetch()` ou Parse diretamente.

```
assets/js/controllers/
  DeputadosController.js         ← orquestra listagem e filtros
  PerfilDeputadoController.js    ← orquestra perfil completo
  DashboardController.js         ← orquestra dashboard principal
  RadarController.js             ← orquestra radar de anomalias
  PartidosController.js          ← orquestra listagem de partidos
```

---

## 3. SERVIÇOS DE SUPORTE (não são M, V nem C)

Serviços são utilitários usados **pelo Model**. Eles não têm papel MVC — são infraestrutura.

```
assets/js/services/
  camaraApi.js   ← cliente HTTP da API da Câmara (único lugar com fetch())
  back4app.js    ← wrapper do Parse SDK (único lugar com Parse.Query, etc.)
  cache.js       ← localStorage + invalidação por TTL
  analytics.js   ← cálculos de KPI, coesão, presença, anomalias
```

---

## 4. ÁRVORE DE DIRETÓRIOS OFICIAL

> Esta é a estrutura canônica. Nenhum arquivo JS de lógica vai em outro lugar.

```
de-olho-na-camara/
│
├── index.html                         # Dashboard principal
│
├── pages/
│   ├── deputados.html                 # Listagem de deputados
│   ├── deputado-perfil.html           # Perfil individual do deputado
│   ├── partidos.html                  # Listagem de partidos
│   ├── partido-perfil.html            # Perfil do partido
│   ├── radar-anomalias.html           # Radar de irregularidades
│   └── sobre.html                     # Sobre o projeto
│
├── assets/
│   │
│   ├── css/
│   │   ├── main.css                   # Variáveis CSS e reset global
│   │   └── components.css             # Estilos de componentes reutilizáveis
│   │
│   └── js/
│       │
│       ├── core/                      # Infraestrutura da aplicação
│       │   ├── app.js                 # Bootstrap: inicializa Parse, router e página atual
│       │   ├── config.js              # Credenciais Back4App (em .gitignore)
│       │   └── router.js              # Roteamento entre páginas (opcional)
│       │
│       ├── services/                  # Serviços de infraestrutura (usados pelo Model)
│       │   ├── camaraApi.js           # ÚNICO arquivo que faz fetch() à API da Câmara
│       │   ├── back4app.js            # ÚNICO arquivo que usa Parse SDK diretamente
│       │   ├── cache.js               # Gerência de localStorage e TTL
│       │   └── analytics.js           # Cálculos: presença, coesão, anomalias, KPIs
│       │
│       ├── models/                    # Camada de dados (MODEL)
│       │   ├── DeputadoModel.js       # Dados de deputados (perfil, gastos, votações)
│       │   ├── PartidoModel.js        # Dados de partidos e coesão
│       │   ├── VotacaoModel.js        # Votações, votos individuais, orientações
│       │   ├── MonitoramentoModel.js  # CRUD: deputados monitorados (Back4App)
│       │   └── AvaliacaoModel.js      # CRUD: avaliações dos usuários (Back4App)
│       │
│       ├── views/                     # Camada de apresentação (VIEW)
│       │   ├── DashboardView.js       # Renderiza o painel principal
│       │   ├── DeputadosView.js       # Renderiza grid, filtros e paginação
│       │   ├── PerfilDeputadoView.js  # Renderiza KPIs, gráficos, tabela de votos
│       │   ├── PartidosView.js        # Renderiza listagem de partidos
│       │   └── RadarView.js           # Renderiza cards de anomalias
│       │
│       └── controllers/               # Camada de orquestração (CONTROLLER)
│           ├── DashboardController.js
│           ├── DeputadosController.js
│           ├── PerfilDeputadoController.js
│           ├── PartidosController.js
│           └── RadarController.js
│
├── docs/
│   └── (documentação de telas e decisões técnicas)
│
├── AI_CONTEXT.md                      # A Constituição do projeto
├── ARCHITECTURE.md                    # Este arquivo
├── PLAN.md                            # Sprints e checklist de progresso
├── README.md                          # Visão geral e como rodar
└── API_DOCUMENTAÇÃO.md                # Fonte da verdade sobre endpoints
```

---

## 5. FLUXO MVC COMPLETO — EXEMPLO REAL

**Cenário:** Usuário abre `deputados.html` e filtra por UF "PE".

```
[1] deputados.html carrega
    └── <script src="../assets/js/controllers/DeputadosController.js">

[2] DeputadosController.init()
    ├── cria new DeputadosView('#app')
    ├── registra: view.onFiltrar = this.handleFiltrar.bind(this)
    └── chama this.handleFiltrar({}) para carga inicial

[3] handleFiltrar({ uf: 'PE' })  ← chamado pelo Controller
    ├── view.mostrarLoader()
    ├── const resultado = await DeputadoModel.listar({ siglaUf: 'PE' })
    └── view.renderizarCards(resultado.data)

[4] DeputadoModel.listar({ siglaUf: 'PE' })
    ├── verifica CacheService.getLocal('deputados_PE')
    ├── se miss: chama CamaraApiService.listarDeputados({ siglaUf: 'PE' })
    └── retorna { success: true, data: [...], source: 'api', ... }

[5] DeputadosView.renderizarCards(deputados)
    ├── limpa o container
    ├── gera HTML via template string para cada deputado
    └── injeta no DOM — FIM

[6] Usuário clica no botão "PE" de novo (toggle)
    └── view dispara: this.onFiltrar({ uf: '' })
        └── volta para [3]
```

---

## 6. BANCO DE DADOS — ESQUEMA DAS CLASSES BACK4APP

### `MonitoredDeputies`

| Campo | Tipo | Descrição |
|---|---|---|
| `user` | Pointer\<\_User\> | Dono do monitoramento |
| `deputadoId` | Number | ID na API da Câmara |
| `nome` | String | Nome completo |
| `partido` | String | Sigla do partido |
| `estado` | String | UF |
| `fotoUrl` | String | URL da foto oficial |
| `ativo` | Boolean | Monitoramento ativo? |
| `notaUsuario` | String | Anotação pessoal |

**ACL:** somente o `user` dono pode ler e escrever.

### `Avaliacao`

| Campo | Tipo | Descrição |
|---|---|---|
| `usuario` | Pointer\<\_User\> | Quem avaliou |
| `deputadoId` | Number | ID na API da Câmara |
| `nota` | Number | 1 a 5 |
| `comentario` | String | Texto livre |

**Índice unique:** `usuario` + `deputadoId` (um usuário avalia cada deputado uma vez).

### `TermometroLeis`

| Campo | Tipo | Descrição |
|---|---|---|
| `proposicaoId` | Number | ID da proposição na API |
| `sessionId` | String | UUID anônimo do visitante |
| `voto` | String | `'apoio'` ou `'rejeito'` |

---

## 7. ESTRATÉGIA DE CACHE

```
L1 — Variável JS em memória     → TTL: duração da sessão (mais rápido)
L2 — localStorage               → TTL: 60 minutos (padrão)
L3 — API da Câmara              → fonte da verdade (sempre o fallback final)
```

```javascript
// Padrão de uso no Model:
async listar(filtros) {
  const cacheKey = `deputados_${JSON.stringify(filtros)}`;
  const cached = CacheService.getLocal(cacheKey);
  if (cached) return { success: true, data: cached, source: 'cache' };

  const data = await CamaraApiService.listarDeputados(filtros);
  CacheService.setLocal(cacheKey, data, 60);
  return { success: true, data, source: 'api' };
}
```

---

## 8. REGRAS DE INTEGRAÇÃO COM CHART.JS

- Toda instância de Chart.js é criada e destruída **dentro de uma View**.
- Antes de criar um novo gráfico, sempre destruir o anterior no mesmo canvas:

```javascript
// Dentro de PerfilDeputadoView.js
renderizarGraficoGastos(dados) {
  if (this._chartGastos) this._chartGastos.destroy(); // evita memory leak
  this._chartGastos = new Chart(this.canvasGastos, { type: 'bar', data: dados });
}
```

- Os dados para o gráfico chegam **já formatados pelo Controller** — a View não transforma dados brutos.

---

_Documento vivo. Atualizar a cada mudança arquitetural significativa._