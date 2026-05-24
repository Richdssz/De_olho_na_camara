# 📅 PLAN.md — Planejamento por Fases e Sprints

> Roadmap completo do De Olho na Câmara — do MVP acadêmico à plataforma nacional.

---

## FILOSOFIA DE ENTREGA

```
"Entregue pequeno. Entregue funcionando. Itere com dados reais."
```

O planejamento segue a regra dos três estágios:

1. **Funciona** — entrega o valor mínimo sem errar
2. **Funciona bem** — polish de UX, tratamento de edge cases
3. **Funciona bonito** — design final, animações, performance

---

## 📌 FASE 0 — FUNDAÇÃO (Concluído)

**Objetivo:** Estrutura pronta para codar sem impedimentos técnicos

### Checklist de Setup

- [x] Criar repositório GitHub com `.gitignore` correto (protegendo `.env` e `js/config.js`)
- [x] Criar estrutura de pastas conforme `README.md`
- [x] Criar conta e aplicação no Back4App
- [x] Configurar chaves no arquivo administrativo de ambiente e inicializar as 3 tabelas no Back4App (`Monitoramento`, `Avaliacao` e `TermometroLeis`) via script local em Node.js (`js/setup-db.js`)
- [x] Criar `js/config.js` com credenciais do Back4App
- [x] Testar conexão Parse: `Parse.initialize()` → integrado e funcionando
- [x] Testar primeira chamada à API da Câmara: `GET /deputados`
- [x] Configurar CDNs no HTML base: Chart.js, Parse SDK, Tailwind
- [x] Criar `index.html` base com navbar, sidebar e área de conteúdo

---

## 🏗️ SPRINT 1 — MVP DO DASHBOARD (Concluído)

**Objetivo:** Dashboard principal funcionando com dados reais e CRUD operacional completo

### Checklist de Implementação

#### Serviços Base e Interface
- [x] Integrar a API de Dados Abertos da Câmara (`buscarDeputadosIniciais()` trazendo foto, nome, partido e UF)
- [x] Renderizar cards dinamicamente na interface usando Tailwind CSS
- [x] Estruturar autenticação nativa com `Parse.User` (cadastro e login em modal dedicado)
- [x] Exibir status de autenticação atualizado na barra lateral e header

#### Gráficos (Chart.js)
- [x] Adicionar canvas de gráficos na seção "Estatísticas do Plenário"
- [x] Implementar gráfico `doughnut` exibindo a distribuição partidária dos deputados carregados em tela com tooltips e porcentagens

#### CRUD Operacional
- [x] **CREATE / DELETE (Acompanhar):** Toggle do radar vinculando deputado ao usuário atual (salva ou remove da classe `Monitoramento` no Back4App) e alterando dinamicamente o estado visual do botão ("Acompanhar" vs "Acompanhando")
- [x] **CREATE / READ / UPDATE (Avaliar):** Modal de avaliação de deputados com estrelas de 1 a 5 e anotação/comentário opcional. Recupera dados existentes ao abrir o modal (READ) e realiza inserção (CREATE) ou atualização (UPDATE) na classe `Avaliacao` do Back4App

### Entregável do Sprint

```
✅ Dashboard integrado com a API oficial da Câmara dos Deputados.
✅ Sistema de login real funcional e reativo.
✅ Gráfico estatístico do Chart.js operacional em tela.
✅ Ações de acompanhamento (Radar) e avaliação (estrelas + comentário) persistindo no Back4App.
```

---

## 📊 SPRINT 2 — PERFIL DO DEPUTADO (Próximo Objetivo Imediato)

**Objetivo:** A tela mais importante do sistema — análise individual completa do parlamentar

### Tarefas

#### Serviços Adicionais

- [ ] `camaraApi.js` + `buscarVotacoesDeputado()`, `buscarEventosDeputado()`
- [ ] `analytics.js` — `calcularTaxaPresenca()`, `calcularMediaGastos()`, `detectarAnomalias()`

#### Página `deputado-perfil.html`

- [ ] Header com foto, nome, partido, estado e badge de status do mandato
- [ ] **4 KPI Cards:** Presença %, Gasto médio mensal, Coesão partidária %, Total de proposições
- [ ] **Badge de anomalia** (se detectada, aparece em destaque: "⚠️ Anomalia detectada")
- [ ] Gráfico 1: **Gastos CEAP** por mês (últimos 12 meses)
- [ ] Gráfico 2: **Taxa de presença** ao longo do tempo (últimos meses)
- [ ] Gráfico 3: **Categorias de gasto** (distribuição por tipo de despesa via Chart.js)
- [ ] Tabela: Últimas 20 votações do deputado com resultado (Sim/Não/Ausente)
- [ ] Botão "Acompanhar no Radar" direto do perfil
- [ ] Export de relatório individual

#### Página `deputados.html` (listagem completa)

- [ ] Grid completo de deputados com filtros por UF, Partido e Nome
- [ ] Ordenação flexível (por presença, por gastos, etc.)
- [ ] Paginação dos resultados da API da Câmara

---

## 🎯 SPRINT 3 — PARTIDOS E INTELIGÊNCIA (Médio Prazo)

**Objetivo:** Análises partidárias e motor de inteligência política

### Tarefas

#### Serviços de Analytics Partidário

- [ ] `listarPartidos()`, `buscarMembrosPartido()`
- [ ] Calcular coesão interna partidária e alinhamento de bancadas

#### Páginas de Análise

- [ ] `partidos.html` — listagem de siglas partidárias com número de membros e taxa de coesão
- [ ] `partido-perfil.html` — análise detalhada do partido (gráfico radar ideológico, gastos acumulados, coesão ao longo do tempo)
- [ ] `radar-anomalias.html` — centralizadores de despesas e anomalias de presença/gasto da Câmara

---

## 🌟 SPRINT 4 — POLISH E APRESENTAÇÃO (Polimento e Deploy)

**Objetivo:** Produto polido, responsivo, sem erros e deploy em ambiente de produção

- [ ] **Interface & UX:** Skeleton loaders para chamadas de API, estados vazios estilizados e transições suaves
- [ ] **Página "Sobre o Projeto":** Missão, documentação de APIs integradas e licenças
- [ ] **Deploy Público:** Publicar dashboard no GitHub Pages ou Vercel
- [ ] Apresentação e homologação final do MVP

---

## 📈 FASE 2 — PÓS-FACULDADE (Futuro)

### Sprint 5 — Comparadores
- [ ] Comparar dois parlamentares ou partidos lado a lado

### Sprint 6 — Relatórios
- [ ] Geração de PDFs consolidados e downloads em CSV

### Sprint 7 — Mapa Político
- [ ] Heatmap geográfico de votações e representações partidárias

---

## 📊 MÉTRICAS DE SUCESSO DO MVP

| Métrica               | Meta                      |
| --------------------- | ------------------------- |
| Telas implementadas   | Mínimo 6                  |
| Gráficos Chart.js     | Mínimo 5 tipos diferentes |
| Operações CRUD        | Todas as 4 funcionando    |
| APIs integradas       | API Câmara + Back4App     |
| Anomalias detectáveis | Mínimo 3 tipos            |
| Tempo de carregamento | < 3 segundos              |
| Erros no console      | Zero críticos             |
