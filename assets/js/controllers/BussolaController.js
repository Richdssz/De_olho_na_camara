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
            {
                id: '2263446-95',
                categoria: 'Assistência Social',
                titulo: 'Expansão de Programas de Renda Básica',
                ementa: 'Ampliar a renda básica e criar programas de proteção social dedicados a famílias em extrema vulnerabilidade lideradas por mães solo.',
                contexto: 'PL 4.733/2020 — votação no Plenário da Câmara dos Deputados.',
                economicoWeight: -1,
                socialWeight: 0.5
            },
            {
                id: '2531924-53',
                categoria: 'Reforma do Estado',
                titulo: 'Meritocracia e Avaliação no Serviço Público',
                ementa: 'Instituir novas diretrizes rígidas de avaliação de desempenho e estabilidade de servidores públicos civis da União, revisando a estabilidade automática.',
                contexto: 'PL 3.240/2025 — votação do Substitutivo na Comissão de Administração e Serviço Público.',
                economicoWeight: 1,
                socialWeight: -0.5
            },
            {
                id: '258057-111',
                categoria: 'Economia Popular',
                titulo: 'Fomento a Cooperativas e Agricultura Familiar',
                ementa: 'Criar regime especial de fomento tributário e linhas de microcrédito subsidiadas para cooperativas, economia solidária e agricultura familiar.',
                contexto: 'PL 3.801/2004 — votação da Emenda do Senado Federal ao Projeto de Lei.',
                economicoWeight: -1,
                socialWeight: 0.5
            },
            {
                id: '2613731-42',
                categoria: 'Regulação Digital',
                titulo: 'Responsabilização de Plataformas Digitais por Conteúdo',
                ementa: 'Responsabilizar grandes plataformas e marketplaces solidariamente por fraudes, desinformação e conteúdo prejudicial publicado por terceiros.',
                contexto: 'PL 1.625/2026 — Subemenda Substitutiva da Comissão de Defesa do Consumidor.',
                economicoWeight: -0.5,
                socialWeight: 1
            },
            {
                id: '2516808-62',
                categoria: 'Meio Ambiente',
                titulo: 'Licenciamento Ambiental Mais Rígido',
                ementa: 'Aumentar o rigor do licenciamento ambiental em florestas nativas e proibir a flexibilização automática de licenças por estados e municípios.',
                contexto: 'PL 2.564/2025 — votação do Substitutivo na Comissão de Meio Ambiente e Desenvolvimento Sustentável.',
                economicoWeight: -0.5,
                socialWeight: 1
            },
            {
                id: '2562764-38',
                categoria: 'Cultura e Identidade',
                titulo: 'Cotas de Incentivo Cultural Regional',
                ementa: 'Criar cota de incentivos e destinação de verba tributária do fomento cultural para produções fora dos grandes centros metropolitanos do Sudeste.',
                contexto: 'PL 4.689/2025 — votação do Substitutivo adotado pela relatora da Comissão de Cultura.',
                economicoWeight: -0.5,
                socialWeight: 0.5
            },
            {
                id: '2609878-55', // Proxy — pode não retornar dados; fallback = votosVotacoes[id] = {}
                categoria: 'Segurança Pública',
                titulo: 'Flexibilização do Porte de Armas para Cidadãos',
                ementa: 'Ampliar o direito ao porte de armas de fogo para cidadãos comuns fora das forças de segurança, reduzindo restrições do Estatuto do Desarmamento.',
                contexto: 'Debates sobre o Estatuto do Desarmamento e PLs correlatos votados na Câmara dos Deputados.',
                economicoWeight: 0,
                socialWeight: -1
            },
            {
                id: '2473339-28', // Proxy — pode não retornar dados
                categoria: 'Economia',
                titulo: 'Privatização de Empresas Estatais',
                ementa: 'Avançar com o programa de privatizações de empresas estatais estratégicas, transferindo sua gestão e capital para a iniciativa privada.',
                contexto: 'Debate sobre o programa de privatizações e PLs de desestatização na Câmara dos Deputados.',
                economicoWeight: 1,
                socialWeight: 0
            },
            {
                id: '2398403-41', // Proxy — pode não retornar dados
                categoria: 'Direitos e Igualdade',
                titulo: 'Cotas Raciais em Universidades Públicas',
                ementa: 'Manter e ampliar o sistema de cotas raciais como política afirmativa permanente de acesso ao ensino superior público.',
                contexto: 'Revisão da Lei de Cotas (Lei 12.711/2012) e PLs de ampliação e permanência do programa.',
                economicoWeight: 0,
                socialWeight: 1
            },
            {
                id: '2487612-33', // Proxy — pode não retornar dados
                categoria: 'Segurança e Justiça',
                titulo: 'Redução da Maioridade Penal para 16 Anos',
                ementa: 'Permitir que adolescentes com 16 anos ou mais sejam julgados como adultos em crimes de alta gravidade como homicídio e tráfico de drogas.',
                contexto: 'PEC 33/2012 e propostas correlatas debatidas no Plenário da Câmara dos Deputados.',
                economicoWeight: 0,
                socialWeight: -1
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
            onFiltroAlterado: (partido, uf) => this.aplicarFiltros(partido, uf),
            onReiniciar: () => this.reiniciarQuiz()
        });
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
     * Calcula matchPercent (votos em comum), posição nos eixos e distância euclidiana
     * para cada deputado ativo.
     */
    calcularAfinidades() {
        const userEcon   = this.pontuacaoUsuario.econ;
        const userSocial = this.pontuacaoUsuario.social;

        this.deputadosCalculados = this.deputadosGerais.map(dep => {
            // matchPercent: percentual de concordância direta de votos
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
            const matchPercent = questoesValidas > 0
                ? Math.round((coincidencias / questoesValidas) * 100)
                : 0;

            // Posição no quadrante baseada em votos reais do deputado
            const posQuadrante     = this.calcularPontuacaoDeputado(dep.id);
            const temDadosQuadrante = posQuadrante !== null;
            const econScore  = temDadosQuadrante ? posQuadrante.econ   : 50;
            const socialScore = temDadosQuadrante ? posQuadrante.social : 50;

            // Distância euclidiana do usuário no espaço 2D
            const distancia = Math.sqrt(
                Math.pow(userEcon - econScore, 2) + Math.pow(userSocial - socialScore, 2)
            );

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
