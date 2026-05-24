# 👁️ DE OLHO NA CÂMARA 🇧🇷

### Transparência Legislativa sem Complicações

> _"Acompanhe o que está sendo votado hoje e como o seu dinheiro é gasto, sem jargões e sem complicações."_

[![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)]()
[![API](https://img.shields.io/badge/API-Câmara%20dos%20Deputados-green)]()
[![Stack](https://img.shields.io/badge/stack-HTML%20%7C%20CSS%20%7C%20JS%20%7C%20Chart.js%20%7C%20Back4App-blue)]()
[![Licença](https://img.shields.io/badge/licença-MIT-lightgrey)]()

---

## 📌 Visão do Projeto

O **De Olho na Câmara** é uma plataforma de transparência e auditoria legislativa 100% Client-Side que transforma os dados brutos da API oficial da Câmara dos Deputados em visualizações claras, análises automáticas e engajamento cidadão anônimo e sem atritos.

Não é um simples painel de consulta. É uma **lupa digital sobre o Congresso Nacional**.

A plataforma foi concebida para ser o que o cidadão brasileiro sempre precisou: uma ferramenta que responde perguntas reais como:

- _"Meu deputado aparece para votar?"_
- _"Quanto ele gastou com a cota parlamentar esse mês?"_
- _"O partido dele vota de forma unida ou cada um faz o que quer?"_
- _"Quais partidos aprovam mais projetos de saúde?"_
- _"Onde o deputado divergiu da orientação do próprio partido?"_

---

## 🎯 Proposta de Valor

| Para quem      | O que entrega                                                   |
| -------------- | --------------------------------------------------------------- |
| Cidadão comum  | Entender o que o seu deputado faz com linguagem simples         |
| Jornalista     | Dados cruzados prontos para pauta: gastos + presença + votações |
| Pesquisador    | Exportação de dados históricos e análises comparativas          |
| Educador       | Ferramenta didática sobre funcionamento do Congresso            |
| Startup cívica | Base para produto SaaS de monitoramento legislativo             |

---

## ✨ Diferenciais

- **Termômetro Cidadão**: o usuário vota (👍 Apoio ou 👎 Rejeito) nas leis em pauta, gerando gráficos Chart.js que comparam a aprovação popular com a votação real.
- **Fricção Zero**: sem logins ou senhas. Você entra e já começa a monitorar através de sessões anônimas baseadas em UUID (`sessionId`).
- **Linguagem acessível**: informações em português claro, sem juridiquês
- **Design institucional moderno**: visual de credibilidade e impacto, usando cores Azul Petróleo e Verde.
- **Arquitetura 100% Client-Side**: roda rápido diretamente no navegador, comunicando-se direto com a API e o Back4App.

---

## 🚀 Funcionalidades

### MVP (Versão 1.0)

- [ ] Dashboard principal com Placar do Dia e Top 3 Gastadores do Mês
- [ ] Listagem e busca de deputados por estado, partido e nome
- [ ] Perfil de cada deputado com cruzamento de dados (presença vs CEAP)
- [ ] Listagem de partidos com perfil e análise de coesão
- [ ] Visualização de proposições e Termômetro Cidadão (Apoio/Rejeito)
- [ ] CRUD no Meu Radar (salvo na classe Monitoramento do Back4App usando sessionId)
- [ ] Gráficos interativos com Chart.js

### Versão 1.5

- [ ] Comparador de partidos lado a lado
- [ ] Mapa político de alinhamentos
- [ ] Detalhes de votações individuais (quem votou o quê)
- [ ] Sistema de relatórios exportáveis
- [ ] Painel de alertas personalizados

### Versão 2.0 (Futura)

- [ ] Comparativo histórico expandido
- [ ] Novos formatos de visualização Chart.js
- [ ] Dashboard segmentado por estado
- [ ] Melhorias de acessibilidade e performance UI

---

## 🛠️ Stack Técnico

### Frontend

```
HTML5           → Estrutura semântica
CSS3 + Tailwind → Estilização e responsividade
JavaScript ES6+ → Lógica de negócio e interação
Chart.js 4.x    → Todas as visualizações de dados
```

### Backend / Banco de Dados

```
Back4App (Parse SDK)  → Banco de dados, autenticação e API REST
Parse JavaScript SDK  → Client-side SDK para operações CRUD
```

### Integrações Externas

```
API Câmara dos Deputados  → Dados legislativos oficiais
  ↳ dadosabertos.camara.leg.br/swagger/api.html
```

### Ferramentas de Desenvolvimento

```
Git + GitHub    → Versionamento
VS Code         → IDE principal
Postman         → Testes de API
```

---

## 📁 Estrutura do Projeto

```
de-olho-na-camara/
│
├── index.html                    # Dashboard principal
├── README.md
├── AI_CONTEXT.md
├── ARCHITECTURE.md
├── PLAN.md
│
├── pages/
│   ├── deputados.html            # Listagem de deputados
│   ├── deputado-perfil.html      # Perfil individual
│   ├── partidos.html             # Listagem de partidos
│   ├── partido-perfil.html       # Perfil do partido
│   ├── proposicoes.html          # Proposições legislativas
│   ├── votacao-detalhes.html     # Detalhes de uma votação
│   ├── radar-anomalias.html      # Radar de irregularidades
│   ├── comparador.html           # Comparador de partidos
│   ├── mapa-politico.html        # Mapa de alinhamentos
│   ├── relatorios.html           # Central de relatórios
│   └── sobre.html                # Sobre o projeto
│
├── assets/
│   ├── css/
│   │   ├── main.css              # Estilos globais
│   │   ├── components.css        # Componentes reutilizáveis
│   │   └── themes.css            # Variáveis de tema
│   ├── js/
│   │   ├── core/
│   │   │   ├── app.js            # Bootstrap da aplicação
│   │   │   ├── router.js         # Roteamento client-side
│   │   │   └── state.js          # Estado global da aplicação
│   │   ├── services/
│   │   │   ├── camaraApi.js      # Cliente da API da Câmara
│   │   │   ├── back4app.js       # Cliente do Back4App
│   │   │   ├── cache.js          # Gerenciamento de cache
│   │   │   └── analytics.js      # Motor de análise política
│   │   ├── components/
│   │   │   ├── navbar.js         # Barra de navegação
│   │   │   ├── sidebar.js        # Menu lateral
│   │   │   ├── deputadoCard.js   # Card de deputado
│   │   │   ├── partidoCard.js    # Card de partido
│   │   │   ├── kpiCard.js        # Card de KPI
│   │   │   ├── alertaBadge.js    # Badge de alerta
│   │   │   └── modal.js          # Modais genéricos
│   │   ├── charts/
│   │   │   ├── barChart.js       # Gráficos de barras
│   │   │   ├── lineChart.js      # Gráficos de linha
│   │   │   ├── pieChart.js       # Gráficos de pizza/donut
│   │   │   ├── radarChart.js     # Gráficos radar
│   │   │   ├── heatmapChart.js   # Mapas de calor
│   │   │   └── scatterChart.js   # Gráficos de dispersão
│   │   └── pages/
│   │       ├── dashboard.js      # Lógica do dashboard
│   │       ├── deputados.js      # Lógica da listagem
│   │       ├── perfil.js         # Lógica do perfil
│   │       ├── partidos.js       # Lógica de partidos
│   │       └── anomalias.js      # Lógica do radar
│   └── img/
│       ├── logo.svg
│       ├── bandeira.svg
│       └── icons/
│
└── docs/
    ├── screens/
    │   ├── 01_dashboard.md
    │   ├── 02_deputados.md
    │   ├── 03_perfil_deputado.md
    │   ├── 04_partidos.md
    │   ├── 05_perfil_partido.md
    │   ├── 06_proposicoes.md
    │   ├── 07_detalhes_votacao.md
    │   ├── 08_radar_anomalias.md
    │   ├── 09_relatorios.md
    │   ├── 10_comparador_partidos.md
    │   ├── 11_mapa_politico.md
    │   ├── 12_sobre.md
    │   └── 13_painel_admin.md
    ├── charts.md
    ├── analytics.md
    ├── ui-system.md
    └── future-features.md
```

---

## ⚙️ Instalação e Configuração

### Pré-requisitos

- Navegador moderno (Chrome 90+, Firefox 88+, Edge 90+)
- Conta gratuita no [Back4App](https://www.back4app.com/)
- Editor de código (VS Code recomendado)
- Servidor local (Live Server, XAMPP ou similar)

### Passo 1 — Clone o repositório

```bash
git clone https://github.com/seu-usuario/raio-do-plenario.git
cd raio-do-plenario
```

### Passo 2 — Configure o Back4App

1. Crie uma aplicação no Back4App
2. Copie o `Application ID` e `JavaScript Key`
3. Crie o arquivo `assets/js/core/config.js`:

```javascript
// assets/js/core/config.js
const CONFIG = {
  BACK4APP: {
    APP_ID: "SUA_APP_ID_AQUI",
    JS_KEY: "SUA_JS_KEY_AQUI",
    SERVER_URL: "https://parseapi.back4app.com/",
  },
  CAMARA_API: {
    BASE_URL: "https://dadosabertos.camara.leg.br/api/v2",
    CACHE_TTL: 3600, // 1 hora em segundos
  },
  APP: {
    NAME: "De Olho na Câmara",
    VERSION: "1.0.0",
    DEBUG: false,
  },
};
```

### Passo 3 — Crie as classes no Back4App

No painel do Back4App, crie as seguintes classes (tabelas):

```
Monitoramento
TermometroLeis
```

> Veja o schema completo em `ARCHITECTURE.md`

### Passo 4 — Inicie o servidor local

```bash
# Com VS Code + Live Server: clique em "Go Live"
# Com Python:
python -m http.server 8080
# Com Node.js:
npx serve .
```

### Passo 5 — Acesse

```
http://localhost:8080
```

---

## 🗺️ Roadmap

```
Sprint 1 (Dias 1-2)  → Fundação
  ✅ Estrutura de pastas
  ✅ Configuração Back4App
  ✅ Serviço camaraApi.js
  ✅ Serviço cache.js
  ✅ Dashboard principal (KPIs + 2 gráficos)
  ✅ CRUD de deputados monitorados

Sprint 2 (Dias 2-3)  → Conteúdo
  ✅ Listagem de deputados
  ✅ Perfil de deputado (presença + gastos + votações)
  ✅ Listagem de partidos
  ✅ Gráficos de coesão partidária

Sprint 3 (Dias 3-4)  → Inteligência
  ✅ Motor de análise (analytics.js)
  ✅ Radar de anomalias
  ✅ Badges de alerta automáticos
  ✅ Relatório básico

Sprint 4 (Futuro)    → Plataforma
  ⬜ Comparador de partidos
  ⬜ Mapa político
  ⬜ Sistema de notificações
  ⬜ Export PDF/CSV
  ⬜ API própria
```

---

## 🎓 Contexto Acadêmico

Este projeto foi desenvolvido como trabalho final da disciplina de **Desenvolvimento Web** com foco em:

- Consumo de APIs REST públicas
- Persistência de dados com BaaS (Backend as a Service)
- Visualização de dados com Chart.js
- Arquitetura frontend escalável
- UX/UI orientado a dados

**Instituição:** [Nome da Faculdade]
**Disciplina:** Desenvolvimento de Interfaces Web
**Entrega:** 28 de maio de 2026
**Aluno:** [Seu Nome]

---

## 📊 Dados e Transparência

Todos os dados exibidos pela plataforma são de **domínio público**, obtidos da [API oficial da Câmara dos Deputados](https://dadosabertos.camara.leg.br/) sob licença [Creative Commons Atribuição 4.0 Internacional (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/deed.pt_BR).

Nenhum dado é alterado ou fabricado. A plataforma é uma camada de visualização e análise sobre dados governamentais oficiais.

---

## 🤝 Contribuição

Pull requests são bem-vindos. Para mudanças grandes, abra uma issue primeiro para discutir o que você gostaria de mudar.

---

## 📄 Licença

MIT © 2026 — De Olho na Câmara

---

_"A transparência não é favor — é direito. O De Olho na Câmara é a ferramenta."_ 👁️
