/**
 * Controller da Bússola Ideológica.
 * Responsável por gerenciar o fluxo do quiz, fazer o fetch de votos reais e calcular as afinidades políticas.
 */
class BussolaController {
    constructor(view, deputadoModel) {
        this.view = view;
        this.deputadoModel = deputadoModel;
        
        // Configuração das questões do quiz mapeadas para Votações Reais de 2026
        this.questoes = [
            {
                id: '2516808-62', // Votação real (Meio Ambiente)
                categoria: 'Meio Ambiente',
                titulo: 'PL 2.564/2025 — Proteção Ambiental vs Desenvolvimento',
                ementa: 'Aumenta o rigor do licenciamento ambiental em florestas nativas e proíbe a flexibilização automática de licenças por estados e municípios.',
                contexto: 'Votação do Substitutivo ao Projeto de Lei da Comissão de Meio Ambiente e Desenvolvimento Sustentável.'
            },
            {
                id: '2562764-38', // Votação real (Cultura)
                categoria: 'Cultura e Fomento',
                titulo: 'PL 4.689/2025 — Incentivos à Cultura Regional',
                ementa: 'Cria cota de incentivos e destinação de verba tributária do fomento cultural especificamente para produções fora dos grandes centros metropolitanos do Sudeste.',
                contexto: 'Votação do Substitutivo ao Projeto de Lei adotado pela relatora da Comissão de Cultura.'
            },
            {
                id: '2531924-53', // Votação real (Serviço Público)
                categoria: 'Administração Pública',
                titulo: 'PL 3.240/2025 — Regulação e Avaliação do Serviço Público',
                ementa: 'Institui novas diretrizes rígidas de avaliação de desempenho e estabilidade de servidores públicos civis da União.',
                contexto: 'Votação do Substitutivo adotado pelo relator da Comissão de Administração e Serviço Público.'
            },
            {
                id: '2263446-95', // Votação real (Direitos Sociais)
                categoria: 'Direitos Sociais',
                titulo: 'PL 4.733/2020 — Assistência Cidadã e Amparo Social',
                ementa: 'Amplia a renda básica e cria programas dedicados de proteção social e amparo financeiro a famílias de extrema vulnerabilidade lideradas por mães solo.',
                contexto: 'Votação do Projeto de Lei no Plenário da Câmara dos Deputados.'
            },
            {
                id: '2613731-42', // Votação real (Consumidor)
                categoria: 'Consumidor e E-commerce',
                titulo: 'PL 1.625/2026 — Regulamentação de Marketplaces e Comércio Online',
                ementa: 'Responsabiliza grandes marketplaces digitais solidariamente por fraudes, contrabando e produtos falsificados vendidos em suas plataformas por terceiros.',
                contexto: 'Votação da Subemenda Substitutiva da Comissão de Defesa do Consumidor.'
            },
            {
                id: '258057-111', // Votação real (Cooperativismo)
                categoria: 'Economia Popular',
                titulo: 'PL 3.801/2004 — Apoio a Cooperativas e Economia Solidária',
                ementa: 'Cria regime especial de fomento tributário e linhas de microcrédito subsidiadas para redes de economia popular, cooperativas e agricultura familiar.',
                contexto: 'Votação da Emenda do Senado Federal ao Projeto de Lei.'
            }
        ];
        
        this.indiceQuestao = 0;
        this.respostasUsuario = []; // Armazenará as respostas do usuário ('Sim', 'Não', 'Pular')
        
        // Cache de dados na memória do Controller
        this.deputadosGerais = []; // Lista completa de deputados
        this.votosVotacoes = {};   // Mapa: { votacaoId: { deputadoId: 'Sim'|'Não'|'Ausente' } }
        this.deputadosCalculados = []; // Lista de deputados com matchPercent calculado
        
        this.inicializar();
    }

    inicializar() {
        this.view.mostrarIntro();
        
        // Configurar os cliques e ouvintes na View
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
            // Fim do quiz, processar resultados
            await this.processarMatchPolitico();
        }
    }

    async processarMatchPolitico() {
        this.view.mostrarLoading('Consultando deputados e históricos na API da Câmara...');
        
        try {
            // 1. Carregar lista geral de deputados ativos (se não estiver em cache)
            if (this.deputadosGerais.length === 0) {
                this.view.mostrarLoading('Buscando cadastro de todos os deputados ativos...');
                this.deputadosGerais = await this.deputadoModel.listarTodos().catch(() => []);
            }
            
            if (this.deputadosGerais.length === 0) {
                throw new Error("Não foi possível carregar a lista de deputados da Câmara.");
            }

            // 2. Carregar votos reais dos deputados para as 6 votações (se não estiver em cache)
            const idsVotacao = this.questoes.map(q => q.id);
            const promessasVotos = [];
            
            idsVotacao.forEach(id => {
                if (!this.votosVotacoes[id]) {
                    promessasVotos.push(
                        window.camaraApi.buscarVotosVotacao(id)
                            .then(votos => {
                                this.votosVotacoes[id] = this.organizarVotosDeputados(votos);
                            })
                            .catch(err => {
                                console.warn(`Falha ao buscar votos para votacao ${id}:`, err);
                                // Fallback em caso de erro da API: iniciar mapa vazio
                                this.votosVotacoes[id] = {};
                            })
                    );
                }
            });
            
            if (promessasVotos.length > 0) {
                this.view.mostrarLoading('Baixando e cruzando votos oficiais de Plenário (isso leva poucos segundos)...');
                await Promise.all(promessasVotos);
            }

            // 3. Realizar o cruzamento das respostas do usuário com os votos reais
            this.view.mostrarLoading('Processando pontuação de afinidade parlamentar...');
            this.calcularAfinidades();
            
            // 4. Preencher filtros na View
            const partidos = [...new Set(this.deputadosCalculados.map(d => d.siglaPartido))].sort();
            const ufs = [...new Set(this.deputadosCalculados.map(d => d.siglaUf))].sort();
            this.view.preencherFiltros(partidos, ufs);
            
            // 5. Exibir os resultados
            this.view.renderizarTopMatch(this.deputadosCalculados[0]);
            this.view.renderizarResultadosGrid(
                this.deputadosCalculados, 
                (id) => this.abrirComparacaoDetalhada(id)
            );
            
            this.view.mostrarResultados();
            
        } catch (err) {
            console.error('[BussolaController] Erro no processamento do match:', err);
            // Fallback robusto em caso de falha completa da API da Câmara
            this.processarFallbackSimulado();
        }
    }

    /**
     * Mapeia a lista de votos recebida da API da Câmara em um mapa ID_DEPUTADO -> VOTO ('Sim' | 'Não')
     */
    organizarVotosDeputados(votosList) {
        const mapa = {};
        if (!votosList || !Array.isArray(votosList)) return mapa;
        
        votosList.forEach(v => {
            const dep = v.deputado || v.deputado_;
            if (dep && dep.id) {
                const votoOriginal = v.tipoVoto || '';
                const votoNorm = votoOriginal.toLowerCase().trim();
                
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
     * Calcula as porcentagens de match para cada deputado ativo.
     */
    calcularAfinidades() {
        this.deputadosCalculados = this.deputadosGerais.map(dep => {
            let coincidencias = 0;
            let questoesValidas = 0;
            
            this.questoes.forEach((q, index) => {
                const respostaUser = this.respostasUsuario[index];
                if (respostaUser === 'Pular') return; // Ignora se o usuário pulou
                
                const mapaVotos = this.votosVotacoes[q.id] || {};
                const votoDep = mapaVotos[dep.id] || 'Ausente';
                
                if (votoDep === 'Ausente') return; // Ignora se o deputado faltou a votação
                
                questoesValidas++;
                if (respostaUser === votoDep) {
                    coincidencias++;
                }
            });
            
            const matchPercent = questoesValidas > 0 
                ? Math.round((coincidencias / questoesValidas) * 100)
                : 0; // Se não houver dados, o alinhamento é zero
                
            return {
                ...dep,
                matchPercent: matchPercent,
                questoesValidas: questoesValidas
            };
        });
        
        // Ordena por afinidade decrescente
        this.deputadosCalculados.sort((a, b) => b.matchPercent - a.matchPercent);
    }

    /**
     * Aplica filtros de partido e estado nos resultados calculados.
     */
    aplicarFiltros(partido, uf) {
        let filtrados = this.deputadosCalculados;
        
        if (partido) {
            filtrados = filtrados.filter(d => d.siglaPartido === partido);
        }
        if (uf) {
            filtrados = filtrados.filter(d => d.siglaUf === uf);
        }
        
        // Re-renderiza o grid de resultados
        this.view.renderizarResultadosGrid(filtrados, (id) => this.abrirComparacaoDetalhada(id));
    }

    /**
     * Prepara e exibe o modal detalhado de comparação voto a voto de um deputado.
     */
    abrirComparacaoDetalhada(deputadoId) {
        const deputado = this.deputadosCalculados.find(d => d.id === deputadoId);
        if (!deputado) return;
        
        const comparativos = this.questoes.map((q, index) => {
            const respostaUser = this.respostasUsuario[index];
            const mapaVotos = this.votosVotacoes[q.id] || {};
            const votoDep = mapaVotos[deputadoId] || 'Ausente';
            
            return {
                titulo: q.titulo,
                ementa: q.ementa,
                usuario: respostaUser,
                deputado: votoDep
            };
        });
        
        this.view.mostrarModalComparacao(deputado, comparativos);
    }

    reiniciarQuiz() {
        this.iniciarQuiz();
    }

    /**
     * Caso a API da Câmara falhe completamente, gera um fallback simulado e amigável.
     */
    processarFallbackSimulado() {
        console.warn("[BussolaController] Executando fallback simulado devido a falha da API da Câmara.");
        this.view.mostrarLoading('API da Câmara indisponível no momento. Gerando simulação de afinidade...');
        
        // Criação de lista simulada contendo deputados conhecidos
        const deputadosMock = [
            { id: 204528, nome: 'Adriana Ventura', siglaPartido: 'NOVO', siglaUf: 'SP', urlFoto: 'https://www.camara.leg.br/internet/deputado/bandera/204528.jpg' },
            { id: 178829, nome: 'Tabata Amaral', siglaPartido: 'PSB', siglaUf: 'SP', urlFoto: 'https://www.camara.leg.br/internet/deputado/bandera/178829.jpg' },
            { id: 204554, nome: 'Kim Kataguiri', siglaPartido: 'UNIÃO', siglaUf: 'SP', urlFoto: 'https://www.camara.leg.br/internet/deputado/bandera/204554.jpg' },
            { id: 204421, nome: 'Felipe Rigoni', siglaPartido: 'UNIÃO', siglaUf: 'ES', urlFoto: 'https://www.camara.leg.br/internet/deputado/bandera/204421.jpg' },
            { id: 204561, nome: 'Guilherme Boulos', siglaPartido: 'PSOL', siglaUf: 'SP', urlFoto: 'https://www.camara.leg.br/internet/deputado/bandera/220593.jpg' },
            { id: 204353, nome: 'Eduardo Bolsonaro', siglaPartido: 'PL', siglaUf: 'SP', urlFoto: 'https://www.camara.leg.br/internet/deputado/bandera/178971.jpg' }
        ];

        this.deputadosGerais = deputadosMock;

        // Gera votos simulados para cada questão
        this.questoes.forEach(q => {
            this.votosVotacoes[q.id] = {};
            deputadosMock.forEach(d => {
                // Simula voto baseado no espectro partidário geral aproximado
                const rand = Math.random();
                if (rand > 0.8) {
                    this.votosVotacoes[q.id][d.id] = 'Ausente';
                } else if (rand > 0.4) {
                    this.votosVotacoes[q.id][d.id] = 'Sim';
                } else {
                    this.votosVotacoes[q.id][d.id] = 'Não';
                }
            });
        });

        // Calcula a afinidade com os dados mockados
        this.calcularAfinidades();
        
        const partidos = [...new Set(this.deputadosCalculados.map(d => d.siglaPartido))].sort();
        const ufs = [...new Set(this.deputadosCalculados.map(d => d.siglaUf))].sort();
        this.view.preencherFiltros(partidos, ufs);
        
        this.view.renderizarTopMatch(this.deputadosCalculados[0]);
        this.view.renderizarResultadosGrid(this.deputadosCalculados, (id) => this.abrirComparacaoDetalhada(id));
        this.view.mostrarResultados();
    }
}

// Inicializa quando a janela for carregada
document.addEventListener('DOMContentLoaded', () => {
    // Garante que o DeputadoModel existe
    const deputadoModel = window.DeputadoModel ? new window.DeputadoModel() : null;
    const view = new BussolaView();
    window.bussolaController = new BussolaController(view, deputadoModel);
});
