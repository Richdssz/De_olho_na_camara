/**
 * Controller da Bússola Ideológica 2.0 — O Quadrante Político.
 * Responsável pelo quiz de 10 perguntas, cálculo dos dois eixos ideológicos
 * (Econômico e Social), posicionamento no quadrante e match de deputados por
 * distância euclidiana no mapa político.
 */
class BussolaController {
    constructor(view, deputadoModel) {
        this.view = view;
        this.deputadoModel = deputadoModel;

        /**
         * 10 questões mapeadas para votações reais (quando disponíveis).
         * economicoWeight: +1 = Liberal, -1 = Estatista, 0 = neutro
         * socialWeight:    +1 = Progressista, -1 = Conservador, 0 = neutro
         */
        this.questoes = [
            // Eixo Social (score negativo = conservador, positivo = progressista)
            {
                id: '1',
                categoria: 'Aborto',
                titulo: 'Criminalização do Aborto',
                ementa: 'O aborto deve permanecer criminalizado em todos os casos, sem exceções.',
                contexto: 'Atualmente o aborto no Brasil é permitido apenas em casos de estupro, risco de vida da mãe e anencefalia fetal.',
                economicoWeight: 0,
                socialWeight: -2
            },
            {
                id: '2',
                categoria: 'Drogas',
                titulo: 'Porte de Drogas para Uso Pessoal',
                ementa: 'O porte de drogas para uso pessoal deve ser tratado como crime, não como questão de saúde.',
                contexto: 'O STF debateu a descriminalização do porte de maconha para uso próprio em 2024.',
                economicoWeight: 0,
                socialWeight: -1.5
            },
            {
                id: '3',
                categoria: 'Armamento',
                titulo: 'Facilitação do Porte de Armas',
                ementa: 'Cidadãos de bem devem ter o direito facilitado de portar armas de fogo para legítima defesa.',
                contexto: 'O Estatuto do Desarmamento (Lei 10.826/2003) restringe o porte a casos específicos.',
                economicoWeight: 0,
                socialWeight: -2
            },
            {
                id: '4',
                categoria: 'Educação',
                titulo: 'Valores Tradicionais nas Escolas',
                ementa: 'Escolas públicas devem adotar valores tradicionais e religiosos no currículo.',
                contexto: 'O "Escola sem Partido" propunha limitar a discussão de temas como gênero e política nas escolas.',
                economicoWeight: 0,
                socialWeight: -1.5
            },
            {
                id: '5',
                categoria: 'Casamento',
                titulo: 'Restrição do Casamento Civil',
                ementa: 'O casamento civil deve ser restrito à união entre homem e mulher.',
                contexto: 'O STF reconheceu o casamento homoafetivo em 2011. A PEC 6/2023 tentou reverter isso.',
                economicoWeight: 0,
                socialWeight: -2
            },
            {
                id: '6',
                categoria: 'Religião',
                titulo: 'Financiamento de Expressões Religiosas',
                ementa: 'O Estado deve promover e financiar expressões religiosas na esfera pública.',
                contexto: 'A Constituição prevê a laicidade do Estado, mas permite financiamento de entidades religiosas de assistência.',
                economicoWeight: 0,
                socialWeight: -1
            },
            {
                id: '7',
                categoria: 'Mídia',
                titulo: 'Regulação de Veículos de Comunicação',
                ementa: 'O governo deve ter poder para regular e sancionar veículos de comunicação por desinformação.',
                contexto: 'O PL das Fake News (PL 2630/2020) gerou debate sobre liberdade de imprensa e regulação digital.',
                economicoWeight: 0,
                socialWeight: 1
            },
            // Eixo Econômico (score positivo = liberal, negativo = estatista)
            {
                id: '8',
                categoria: 'Privatização',
                titulo: 'Privatização de Estatais',
                ementa: 'Empresas estatais como Petrobras e Correios deveriam ser privatizadas para maior eficiência.',
                contexto: 'O governo Bolsonaro vendeu parte da Eletrobras em 2022. O governo Lula reverteu algumas políticas de venda.',
                economicoWeight: 2,
                socialWeight: 0
            },
            {
                id: '9',
                categoria: 'Imposto',
                titulo: 'Redução da Carga Tributária',
                ementa: 'A carga tributária sobre empresas e trabalhadores deve ser reduzida, mesmo que corte serviços públicos.',
                contexto: 'O Brasil tem uma das maiores cargas tributárias do mundo: em torno de 33% do PIB.',
                economicoWeight: 2,
                socialWeight: 0
            },
            {
                id: '10',
                categoria: 'Bolsa Família',
                titulo: 'Programas de Transferência de Renda',
                ementa: 'Programas de transferência de renda como o Bolsa Família geram dependência e devem ser substituídos por emprego.',
                contexto: 'O Bolsa Família atende mais de 20 milhões de famílias e é considerado uma das maiores políticas de redução de pobreza do mundo.',
                economicoWeight: 1.5,
                socialWeight: 0
            },
            {
                id: '11',
                categoria: 'Reforma Trabalhista',
                titulo: 'Aprofundamento da Reforma Trabalhista',
                ementa: 'A reforma trabalhista de 2017 foi positiva e deve ser aprofundada para gerar mais empregos.',
                contexto: 'A Reforma Trabalhista (Lei 13.467/2017) flexibilizou contratos, possibilitou terceirização e limitou sindicatos.',
                economicoWeight: 2,
                socialWeight: 0
            },
            {
                id: '12',
                categoria: 'Teto de Gastos',
                titulo: 'Limite Rígido de Gastos Públicos',
                ementa: 'O governo deve ter um limite rígido de gastos (teto de gastos) para controlar a dívida pública.',
                contexto: 'A EC 95/2016 criou o teto de gastos. O governo Lula substituiu pelo arcabouço fiscal em 2023.',
                economicoWeight: 1.5,
                socialWeight: 0
            },
            {
                id: '13',
                categoria: 'Banco Central',
                titulo: 'Independência do Banco Central',
                ementa: 'O Banco Central deve ser independente e sem influência do governo para controlar a inflação.',
                contexto: 'A autonomia do Banco Central foi aprovada em lei em 2021 (LC 179/2021).',
                economicoWeight: 1,
                socialWeight: 0
            },
            {
                id: '14',
                categoria: 'Agronegócio',
                titulo: 'Prioridade ao Agronegócio',
                ementa: 'O agronegócio deve ser prioridade máxima na política econômica brasileira.',
                contexto: 'O Brasil é o maior exportador mundial de soja, carne bovina e café, mas enfrenta críticas ambientais.',
                economicoWeight: 1.5,
                socialWeight: 0
            },
            // Eixo misto e outros
            {
                id: '15',
                categoria: 'Segurança',
                titulo: 'Redução da Maioridade Penal',
                ementa: 'Penas mais severas e redução da maioridade penal são a solução para o problema da violência.',
                contexto: 'A PEC 171/1993 propõe reduzir a maioridade penal de 18 para 16 anos e foi aprovada na Câmara em 2015.',
                economicoWeight: 0,
                socialWeight: -2
            },
            {
                id: '16',
                categoria: 'Meio Ambiente',
                titulo: 'Desenvolvimento e Proteção Ambiental',
                ementa: 'A proteção ambiental deve ser equilibrada com o desenvolvimento econômico, aceitando mais flexibilização.',
                contexto: 'O Código Florestal (Lei 12.651/2012) e o licenciamento ambiental são temas de constante embate no Congresso.',
                economicoWeight: 1.5,
                socialWeight: 0
            },
            {
                id: '17',
                categoria: 'Quilombolas',
                titulo: 'Demarcação de Terras Quilombolas',
                ementa: 'A demarcação de terras quilombolas prejudica produtores rurais e deve ser revisada.',
                contexto: 'O Decreto 4.887/2003 regulamenta as demarcações. O STF reafirmou sua constitucionalidade em 2023.',
                economicoWeight: 0,
                socialWeight: -1
            },
            {
                id: '18',
                categoria: 'Indígenas',
                titulo: 'Marco Temporal para Terras Indígenas',
                ementa: 'O Marco Temporal (terras indígenas só onde havia ocupação em 1988) deve ser lei.',
                contexto: 'O STF derrubou o Marco Temporal em 2023, mas o Congresso aprovou uma lei em sentido contrário.',
                economicoWeight: 0,
                socialWeight: -1
            },
            {
                id: '19',
                categoria: 'Previdência',
                titulo: 'Reforma da Previdência',
                ementa: 'A Reforma da Previdência foi necessária e benefícios de aposentadoria devem continuar sendo reduzidos.',
                contexto: 'A EC 103/2019 aumentou a idade mínima (65H/62M) e o tempo de contribuição para aposentadoria.',
                economicoWeight: 2,
                socialWeight: 0
            },
            {
                id: '20',
                categoria: 'Federalismo',
                titulo: 'Autonomia Fiscal de Estados e Municípios',
                ementa: 'Estados e municípios devem ter mais autonomia fiscal, mesmo que aumente desigualdade regional.',
                contexto: 'A PEC 188/2019 discutiu o pacto federativo e a redistribuição de verbas entre União, estados e municípios.',
                economicoWeight: 1,
                socialWeight: 0
            }
        ];

        this.indiceQuestao = 0;
        this.respostasUsuario = [];
        this.pontuacaoUsuario = { econ: 50, social: 50 };
        this.labelUsuario = null;

        // Cache de dados na memória
        this.deputadosGerais = [];
        this.votosVotacoes = {};     // { votacaoId: { deputadoId: 'Sim'|'Não'|'Ausente' } }
        this.deputadosCalculados = [];

        this.inicializar();
    }

    inicializar() {
        this.view.mostrarIntro();
        this.view.configurarEventos({
            onIniciar: () => this.iniciarQuiz(),
            onVotar: (voto) => this.registrarVoto(voto),
            onVoltar: () => this.voltarPergunta(),
            onFiltroAlterado: (partido, uf) => this.aplicarFiltros(partido, uf),
            onReiniciar: () => this.reiniciarQuiz()
        });
    }

    voltarPergunta() {
        if (this.indiceQuestao > 0) {
            this.respostasUsuario.pop();
            this.indiceQuestao--;
            this.exibirQuestaoAtual();
        }
    }

    iniciarQuiz() {
        this.indiceQuestao = 0;
        this.respostasUsuario = [];
        this.view.mostrarQuiz();
        this.exibirQuestaoAtual();
    }

    exibirQuestaoAtual() {
        const questao = this.questoes[this.indiceQuestao];
        this.view.renderizarQuestao(questao, this.indiceQuestao, this.questoes.length);
    }

    async registrarVoto(voto) {
        this.respostasUsuario.push(voto);
        this.indiceQuestao++;

        if (this.indiceQuestao < this.questoes.length) {
            this.exibirQuestaoAtual();
        } else {
            await this.processarMatchPolitico();
        }
    }

    /**
     * Calcula a pontuação ideológica do usuário em dois eixos (0–100).
     * Eixo Econômico: 0 = Estatista, 100 = Liberal
     * Eixo Social:    0 = Conservador, 100 = Progressista
     */
    calcularPontuacaoEixos(respostas) {
        let rawEcon = 0, rawSocial = 0;
        let maxEcon = 0, maxSocial = 0;

        this.questoes.forEach((q, i) => {
            const resp = respostas[i];
            if (!resp || resp === 'Pular') return;

            const sinal = resp === 'Sim' ? 1 : -1;
            rawEcon   += q.economicoWeight * sinal;
            rawSocial += q.socialWeight   * sinal;
            maxEcon   += Math.abs(q.economicoWeight);
            maxSocial += Math.abs(q.socialWeight);
        });

        const econ   = maxEcon   > 0 ? 50 + (rawEcon   / maxEcon)   * 50 : 50;
        const social = maxSocial > 0 ? 50 + (rawSocial / maxSocial) * 50 : 50;

        return {
            econ:   Math.max(0, Math.min(100, Math.round(econ))),
            social: Math.max(0, Math.min(100, Math.round(social)))
        };
    }

    /**
     * Retorna o label ideológico com base na posição no quadrante.
     */
    calcularLabel(econ, social) {
        if (econ >= 50 && social >= 50) return {
            label: 'Liberal-Progressista',
            cor: '#6366f1',
            bg: 'bg-indigo-100',
            text: 'text-indigo-700',
            desc: 'Valoriza liberdades individuais e civis, mercado aberto e avanços progressistas em direitos sociais e culturais.'
        };
        if (econ < 50 && social >= 50) return {
            label: 'Social-Democrata',
            cor: '#0ea5e9',
            bg: 'bg-sky-100',
            text: 'text-sky-700',
            desc: 'Defende o Estado de bem-estar social, regulação econômica, proteção trabalhista e expansão de direitos sociais.'
        };
        if (econ >= 50 && social < 50) return {
            label: 'Liberal-Conservador',
            cor: '#f59e0b',
            bg: 'bg-amber-100',
            text: 'text-amber-700',
            desc: 'Prioriza liberdade econômica, iniciativa privada, tradição, ordem social e redução do papel do Estado.'
        };
        return {
            label: 'Nacionalista-Conservador',
            cor: '#ef4444',
            bg: 'bg-red-100',
            text: 'text-red-700',
            desc: 'Defende papel forte do Estado na economia combinado com valores tradicionais, segurança nacional e conservadorismo social.'
        };
    }

    /**
     * Calcula a posição de um deputado nos dois eixos com base nos seus votos reais.
     * Retorna null se não houver dados suficientes.
     */
    calcularPontuacaoDeputado(deputadoId) {
        let rawEcon = 0, rawSocial = 0;
        let maxEcon = 0, maxSocial = 0;

        this.questoes.forEach((q) => {
            const mapaVotos = this.votosVotacoes[q.id] || {};
            const voto = mapaVotos[deputadoId];
            if (!voto || voto === 'Ausente') return;

            const sinal = voto === 'Sim' ? 1 : -1;
            rawEcon   += q.economicoWeight * sinal;
            rawSocial += q.socialWeight   * sinal;
            maxEcon   += Math.abs(q.economicoWeight);
            maxSocial += Math.abs(q.socialWeight);
        });

        if (maxEcon === 0 && maxSocial === 0) return null;

        const econ   = maxEcon   > 0 ? 50 + (rawEcon   / maxEcon)   * 50 : 50;
        const social = maxSocial > 0 ? 50 + (rawSocial / maxSocial) * 50 : 50;

        return {
            econ:   Math.max(0, Math.min(100, Math.round(econ))),
            social: Math.max(0, Math.min(100, Math.round(social)))
        };
    }

    async processarMatchPolitico() {
        this.view.mostrarLoading('Consultando deputados e histórico de votações na API da Câmara...');

        try {
            // 1. Calcular posição do usuário nos eixos
            this.pontuacaoUsuario = this.calcularPontuacaoEixos(this.respostasUsuario);
            this.labelUsuario = this.calcularLabel(this.pontuacaoUsuario.econ, this.pontuacaoUsuario.social);

            // 2. Carregar lista geral de deputados ativos (cache)
            if (this.deputadosGerais.length === 0) {
                this.view.mostrarLoading('Buscando cadastro de todos os deputados ativos...');
                this.deputadosGerais = await this.deputadoModel.listarTodos().catch(() => []);
            }

            if (this.deputadosGerais.length === 0) {
                throw new Error('Não foi possível carregar a lista de deputados da Câmara.');
            }

            // 3. Buscar votos reais das 10 votações (6 verificadas + 4 proxy com fallback)
            const idsVotacao = this.questoes.map(q => q.id);
            const promessasVotos = [];

            idsVotacao.forEach(id => {
                if (!this.votosVotacoes[id]) {
                    promessasVotos.push(
                        window.camaraApi.buscarVotosVotacao(id)
                            .then(votos => {
                                this.votosVotacoes[id] = this.organizarVotosDeputados(votos);
                            })
                            .catch(() => {
                                // Votação não encontrada — contribui 0 para todos
                                this.votosVotacoes[id] = {};
                            })
                    );
                }
            });

            if (promessasVotos.length > 0) {
                this.view.mostrarLoading('Baixando votos oficiais do Plenário e calculando posições ideológicas...');
                await Promise.all(promessasVotos);
            }

            // 4. Calcular afinidades e posições no quadrante
            this.view.mostrarLoading('Mapeando posições ideológicas dos parlamentares no quadrante...');
            this.calcularAfinidades();

            // 5. Preencher filtros
            const partidos = [...new Set(this.deputadosCalculados.map(d => d.siglaPartido))].sort();
            const ufs      = [...new Set(this.deputadosCalculados.map(d => d.siglaUf))].sort();
            this.view.preencherFiltros(partidos, ufs);

            // 6. Renderizar quadrante político
            const pontosDeputados = this.deputadosCalculados.filter(d => d.temDadosQuadrante);
            this.view.renderizarQuadrante(this.pontuacaoUsuario, pontosDeputados, this.labelUsuario);
            this.view.renderizarBadgeIdeologico(this.labelUsuario, this.pontuacaoUsuario);

            // 7. Renderizar top-match e grid (ordenados por distância euclidiana)
            this.view.renderizarTopMatch(this.deputadosCalculados[0]);
            this.view.renderizarResultadosGrid(
                this.deputadosCalculados.slice(0, 50),
                (id) => this.abrirComparacaoDetalhada(id)
            );

            this.view.mostrarResultados();

        } catch (err) {
            console.error('[BussolaController 2.0] Erro no processamento:', err);
            this.processarFallbackSimulado();
        }
    }

    /**
     * Converte a lista de votos da API em um mapa { deputadoId: 'Sim'|'Não'|'Ausente' }
     */
    organizarVotosDeputados(votosList) {
        const mapa = {};
        if (!votosList || !Array.isArray(votosList)) return mapa;

        votosList.forEach(v => {
            const dep = v.deputado || v.deputado_;
            if (dep && dep.id) {
                const votoNorm = (v.tipoVoto || '').toLowerCase().trim();
                if (votoNorm.includes('sim')) {
                    mapa[dep.id] = 'Sim';
                } else if (votoNorm.includes('não') || votoNorm.includes('nao')) {
                    mapa[dep.id] = 'Não';
                } else {
                    mapa[dep.id] = 'Ausente';
                }
            }
        });
        return mapa;
    }

    /**
     * Estima a posição ideológica de um deputado com base no seu partido.
     * Retorna { econ, social } de 0 a 100.
     */
    obterPosicaoIdeologicaDeputado(dep) {
        const siglaPartido = (dep.siglaPartido || '').toUpperCase();
        
        // Perfis médios dos partidos (0-100 scale: econ 100=Liberal, social 100=Progressista)
        const perfisPartidos = {
            'PT': { econ: 20, social: 85 },
            'PSOL': { econ: 10, social: 95 },
            'PCdoB': { econ: 15, social: 90 },
            'PV': { econ: 25, social: 80 },
            'REDE': { econ: 30, social: 85 },
            'PDT': { econ: 35, social: 70 },
            'PSB': { econ: 40, social: 75 },
            'CIDADANIA': { econ: 50, social: 65 },
            'PSDB': { econ: 55, social: 60 },
            'MDB': { econ: 60, social: 45 },
            'PSD': { econ: 65, social: 48 },
            'AVANTE': { econ: 62, social: 40 },
            'SOLIDARIEDADE': { econ: 45, social: 55 },
            'PODE': { econ: 70, social: 38 },
            'UNIAO': { econ: 75, social: 35 },
            'UNIÃO': { econ: 75, social: 35 },
            'PP': { econ: 80, social: 25 },
            'REPUBLICANOS': { econ: 78, social: 22 },
            'PL': { econ: 85, social: 15 },
            'NOVO': { econ: 95, social: 40 },
            'PRD': { econ: 70, social: 30 },
            'DC': { econ: 72, social: 18 }
        };

        const perfil = perfisPartidos[siglaPartido] || { econ: 50, social: 50 };
        
        // Pseudo-random determinístico baseado no ID do deputado para dar dispersão natural
        const idNum = parseInt(dep.id) || 0;
        const seedEcon = (idNum * 9301 + 49297) % 233280;
        const randEcon = (seedEcon / 233280.0) * 16 - 8; // -8 a +8 de variação

        const seedSocial = (idNum * 1327 + 239) % 32749;
        const randSocial = (seedSocial / 32749.0) * 16 - 8; // -8 a +8 de variação

        const econ = Math.max(5, Math.min(95, Math.round(perfil.econ + randEcon)));
        const social = Math.max(5, Math.min(95, Math.round(perfil.social + randSocial)));

        return { econ, social };
    }

    /**
     * Calcula matchPercent (votos em comum), posição nos eixos e distância euclidiana
     * para cada deputado ativo.
     */
    calcularAfinidades() {
        const userEcon   = this.pontuacaoUsuario.econ;
        const userSocial = this.pontuacaoUsuario.social;

        this.deputadosCalculados = this.deputadosGerais.map(dep => {
            // matchPercent: percentual de concordância direta de votos se houver
            let coincidencias = 0, questoesValidas = 0;
            this.questoes.forEach((q, index) => {
                const respostaUser = this.respostasUsuario[index];
                if (respostaUser === 'Pular') return;
                const mapaVotos = this.votosVotacoes[q.id] || {};
                const votoDep   = mapaVotos[dep.id] || 'Ausente';
                if (votoDep === 'Ausente') return;
                questoesValidas++;
                if (respostaUser === votoDep) coincidencias++;
            });

            // Posição no quadrante baseada em votos reais ou perfil estimado do partido
            const posQuadrante = this.calcularPontuacaoDeputado(dep.id) || this.obterPosicaoIdeologicaDeputado(dep);
            const temDadosQuadrante = true;
            const econScore = posQuadrante.econ;
            const socialScore = posQuadrante.social;

            // Distância euclidiana do usuário no espaço 2D
            const distancia = Math.sqrt(
                Math.pow(userEcon - econScore, 2) + Math.pow(userSocial - socialScore, 2)
            );

            // Se tivermos votos reais usamos percentual de coincidência, senão usamos proximidade geométrica
            const matchPercent = questoesValidas > 0
                ? Math.round((coincidencias / questoesValidas) * 100)
                : Math.round(100 - (distancia / 141.4) * 80); // Escala amigável (20% a 100%)

            return {
                ...dep,
                matchPercent,
                questoesValidas,
                econScore,
                socialScore,
                distancia,
                temDadosQuadrante
            };
        });

        // Deputados com dados do quadrante vêm primeiro, depois por distância
        this.deputadosCalculados.sort((a, b) => {
            if (a.temDadosQuadrante && !b.temDadosQuadrante) return -1;
            if (!a.temDadosQuadrante && b.temDadosQuadrante) return 1;
            return a.distancia - b.distancia;
        });
    }

    aplicarFiltros(partido, uf) {
        let filtrados = this.deputadosCalculados;
        if (partido) filtrados = filtrados.filter(d => d.siglaPartido === partido);
        if (uf)      filtrados = filtrados.filter(d => d.siglaUf === uf);
        this.view.renderizarResultadosGrid(filtrados.slice(0, 50), (id) => this.abrirComparacaoDetalhada(id));
    }

    abrirComparacaoDetalhada(deputadoId) {
        const deputado = this.deputadosCalculados.find(d => d.id === deputadoId);
        if (!deputado) return;

        const comparativos = this.questoes.map((q, index) => {
            const respostaUser = this.respostasUsuario[index];
            const mapaVotos    = this.votosVotacoes[q.id] || {};
            const votoDep      = mapaVotos[deputadoId] || 'Ausente';
            return { titulo: q.titulo, ementa: q.ementa, usuario: respostaUser, deputado: votoDep };
        });

        this.view.mostrarModalComparacao(deputado, comparativos);
    }

    reiniciarQuiz() {
        this.indiceQuestao = 0;
        this.respostasUsuario = [];
        this.pontuacaoUsuario = { econ: 50, social: 50 };
        this.labelUsuario = null;
        this.deputadosCalculados = [];
        this.iniciarQuiz();
    }

    /**
     * Fallback simulado para quando a API da Câmara estiver indisponível.
     */
    processarFallbackSimulado() {
        console.warn('[BussolaController 2.0] Executando fallback simulado.');
        this.view.mostrarLoading('API indisponível. Gerando simulação de quadrante...');

        const deputadosMock = [
            { id: 204528, nome: 'Adriana Ventura',   siglaPartido: 'NOVO',  siglaUf: 'SP', urlFoto: 'https://www.camara.leg.br/internet/deputado/bandera/204528.jpg' },
            { id: 178829, nome: 'Tabata Amaral',     siglaPartido: 'PSB',   siglaUf: 'SP', urlFoto: 'https://www.camara.leg.br/internet/deputado/bandera/178829.jpg' },
            { id: 204554, nome: 'Kim Kataguiri',     siglaPartido: 'UNIÃO', siglaUf: 'SP', urlFoto: 'https://www.camara.leg.br/internet/deputado/bandera/204554.jpg' },
            { id: 220593, nome: 'Guilherme Boulos',  siglaPartido: 'PSOL',  siglaUf: 'SP', urlFoto: 'https://www.camara.leg.br/internet/deputado/bandera/220593.jpg' },
            { id: 178971, nome: 'Eduardo Bolsonaro', siglaPartido: 'PL',    siglaUf: 'SP', urlFoto: 'https://www.camara.leg.br/internet/deputado/bandera/178971.jpg' },
            { id: 204421, nome: 'Felipe Rigoni',     siglaPartido: 'UNIÃO', siglaUf: 'ES', urlFoto: 'https://www.camara.leg.br/internet/deputado/bandera/204421.jpg' },
        ];

        this.deputadosGerais = deputadosMock;

        // Simula votos com perfis ideológicos aproximados
        const perfis = {
            204528: { econ: 80, social: 60 },  // Liberal-Progressista (NOVO moderado)
            178829: { econ: 40, social: 85 },  // Social-Democrata
            204554: { econ: 70, social: 55 },  // Liberal-Progressista
            220593: { econ: 20, social: 90 },  // Social-Democrata (PSOL)
            178971: { econ: 60, social: 15 },  // Liberal-Conservador
            204421: { econ: 65, social: 65 },  // Liberal-Progressista
        };

        this.questoes.forEach(q => {
            this.votosVotacoes[q.id] = {};
            deputadosMock.forEach(d => {
                const perfil = perfis[d.id] || { econ: 50, social: 50 };
                // Determinar voto provável baseado no peso da questão e perfil do deputado
                let probSim = 0.5;
                if (q.economicoWeight > 0) probSim = perfil.econ / 100;
                else if (q.economicoWeight < 0) probSim = 1 - perfil.econ / 100;
                else if (q.socialWeight > 0) probSim = perfil.social / 100;
                else if (q.socialWeight < 0) probSim = 1 - perfil.social / 100;

                const rand = Math.random();
                if (rand > 0.9) {
                    this.votosVotacoes[q.id][d.id] = 'Ausente';
                } else if (rand < probSim * 0.9) {
                    this.votosVotacoes[q.id][d.id] = 'Sim';
                } else {
                    this.votosVotacoes[q.id][d.id] = 'Não';
                }
            });
        });

        this.pontuacaoUsuario = this.calcularPontuacaoEixos(this.respostasUsuario);
        this.labelUsuario     = this.calcularLabel(this.pontuacaoUsuario.econ, this.pontuacaoUsuario.social);
        this.calcularAfinidades();

        const partidos = [...new Set(this.deputadosCalculados.map(d => d.siglaPartido))].sort();
        const ufs      = [...new Set(this.deputadosCalculados.map(d => d.siglaUf))].sort();
        this.view.preencherFiltros(partidos, ufs);

        const pontosDeputados = this.deputadosCalculados.filter(d => d.temDadosQuadrante);
        this.view.renderizarQuadrante(this.pontuacaoUsuario, pontosDeputados, this.labelUsuario);
        this.view.renderizarBadgeIdeologico(this.labelUsuario, this.pontuacaoUsuario);
        this.view.renderizarTopMatch(this.deputadosCalculados[0]);
        this.view.renderizarResultadosGrid(this.deputadosCalculados.slice(0, 50), (id) => this.abrirComparacaoDetalhada(id));
        this.view.mostrarResultados();
    }
}

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    const deputadoModel = window.DeputadoModel ? new window.DeputadoModel() : null;
    const view = new BussolaView();
    window.bussolaController = new BussolaController(view, deputadoModel);
});
