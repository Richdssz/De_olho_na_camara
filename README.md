# 👁️ De Olho na Câmara 🇧🇷

**Transparência legislativa para o cidadão brasileiro.**

> _"Acompanhe o que está sendo votado e como o seu dinheiro é gasto — sem jargões e sem complicações."_

[![Status](https://img.shields.io/badge/status-em%20desenvolvimento-yellow)]()
[![API](https://img.shields.io/badge/API-Câmara%20dos%20Deputados-green)]()
[![Stack](https://img.shields.io/badge/stack-HTML%20|%20Tailwind%20|%20Vanilla%20JS%20|%20Chart.js%20|%20Back4App-blue)]()
[![Licença](https://img.shields.io/badge/licença-MIT-lightgrey)]()

---

## Visão Geral

O **De Olho na Câmara** é uma plataforma de auditoria legislativa 100% Client-Side que transforma os dados brutos da [API oficial da Câmara dos Deputados](https://dadosabertos.camara.leg.br/) em visualizações claras, análises automáticas e engajamento cidadão.

A plataforma responde perguntas que qualquer brasileiro deveria poder fazer:

- *Meu deputado aparece para votar?*
- *Quanto ele gastou com a cota parlamentar este mês?*
- *O partido dele vota de forma unida ou cada um faz o que quer?*
- *Quais parlamentares apresentam padrões fora do normal?*

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Marcacao | HTML5 semantico |
| Estilizacao | Tailwind CSS 3.x (CDN) |
| Logica | Vanilla JavaScript ES6+ (arquitetura MVC) |
| Graficos | Chart.js 4.x (CDN) |
| Banco / Auth | Back4App via Parse JS SDK (CDN) |
| Dados legislativos | API publica da Camara dos Deputados (CC BY 4.0) |
| Dados ideologicos / historicos | API publica da Wikipedia (pt.wikipedia.org) |

---

## Como rodar localmente

### Pré-requisitos

- Navegador moderno (Chrome 90+, Firefox 88+, Edge 90+)
- Conta gratuita no [Back4App](https://www.back4app.com/)
- Editor com servidor local (VS Code + extensão Live Server recomendado)

### Passo 1 — Clone o repositório

```bash
git clone https://github.com/Richdssz/De_olho_na_camara.git
cd De_olho_na_camara
```

### Passo 2 — Configure as credenciais

Crie o arquivo `assets/js/core/config.js` (está no `.gitignore` — nunca commitar):

```javascript
// assets/js/core/config.js
const CONFIG = {
  BACK4APP: {
    APP_ID:     'SUA_APP_ID_AQUI',
    JS_KEY:     'SUA_JS_KEY_AQUI',
    SERVER_URL: 'https://parseapi.back4app.com/',
  },
  CAMARA_API: {
    BASE_URL:  'https://dadosabertos.camara.leg.br/api/v2',
    CACHE_TTL: 60, // minutos
  },
};
```

### Passo 3 — Crie as classes no Back4App

No painel do Back4App, crie as seguintes classes manualmente:

- `Monitoramento`
- `Avaliacao`
- `TermometroLeis`
- `PartidoAsset`

O schema completo de cada classe está em [ARCHITECTURE.md](file:///c:/Users/richd/Projetos/De_olho_na_camara/ARCHITECTURE.md).

### Passo 4 — Inicie o servidor local

```bash
# VS Code: clique em "Go Live" na barra inferior
# Python:
python -m http.server 8080
# Node.js:
npx serve .
```

### Passo 5 — Acesse

```
http://localhost:8080
```

---

## Documentação técnica

| Arquivo | Conteúdo |
|---|---|
| [AI_CONTEXT.md](file:///c:/Users/richd/Projetos/De_olho_na_camara/AI_CONTEXT.md) | Stack, paleta, regras de código e domínio político |
| [ARCHITECTURE.md](file:///c:/Users/richd/Projetos/De_olho_na_camara/ARCHITECTURE.md) | Arquitetura MVC, árvore de diretórios e esquema do banco |
| [Planos-fix/](file:///c:/Users/richd/Projetos/De_olho_na_camara/Planos-fix) | Sprints, checklists e progresso do projeto detalhado em blocos |
| [API_DOCUMENTAÇÃO.md](file:///c:/Users/richd/Projetos/De_olho_na_camara/API_DOCUMENTAÇÃO.md) | Referência de todos os endpoints utilizados |

---

## Licença

MIT © 2026 — De Olho na Câmara

*Todos os dados exibidos são de domínio público, obtidos da API oficial da Câmara dos Deputados sob licença CC BY 4.0. Nenhum dado é alterado ou fabricado.*