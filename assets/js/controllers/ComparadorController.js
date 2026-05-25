/**
 * Controller do Comparador Lado a Lado (comparador.html)
 * Gerencia a lógica de seleção de deputados/partidos, busca de dados e orquestração da comparação.
 */
class ComparadorController {
    constructor() {
        this.view = new window.ComparadorView();
        this.mode = 'deputados';
        this.deputadosAtivos = [];
        this.partidosAtivos = [];
    }

    async init() {
        console.log("ComparadorController: Inicializando...");
        window.activeController = this;
        
        this.view.mostrarLoader();
        
        // Registrar callbacks
        this.view.onTabChange(mode => this.handleTabChange(mode));
        this.view.onSelecaoChange(selections => this.handleSelecaoChange(selections));

        await this.carregarDadosIniciais();
    }

    async recarregarGrid() {
        // Método exigido para integração com o app.js na autenticação
        console.log("ComparadorController: Recarregando dados após alteração de autenticação...");
        const selections = {
            deputadoA: this.view.selectDeputadoA?.value || '',
            deputadoB: this.view.selectDeputadoB?.value || '',
            partidoA: this.view.selectPartidoA?.value || '',
            partidoB: this.view.selectPartidoB?.value || ''
        };
        await this.handleSelecaoChange(selections);
    }

    async carregarDadosIniciais() {
        try {
            // Buscar dados usando os Models com cache de 1h
            const [depResp, partResp] = await Promise.all([
                window.DeputadoModel.listar(),
                window.PartidoModel.listar()
            ]);

            this.deputadosAtivos = depResp.success ? (depResp.data || []) : [];
            const partidosRaw = partResp.success ? (partResp.data || []) : [];

            // Filtrar e preencher a lista de partidos que possuem membros na legislatura ativa
            const membrosPorPartido = {};
            this.deputadosAtivos.forEach(d => {
                if (d.siglaPartido) {
                    const sigla = d.siglaPartido.toUpperCase();
                    membrosPorPartido[sigla] = (membrosPorPartido[sigla] || 0) + 1;
                }
            });

            this.partidosAtivos = partidosRaw
                .map(p => {
                    const siglaUpper = p.sigla.toUpperCase();
                    return {
                        id: p.id,
                        sigla: p.sigla,
                        nome: p.nome,
                        totalMembros: membrosPorPartido[siglaUpper] || 0
                    };
                })
                .filter(p => p.totalMembros > 0)
                .sort((a, b) => b.totalMembros - a.totalMembros);

            this.view.preencherSelectsDeputados(this.deputadosAtivos);
            this.view.preencherSelectsPartidos(this.partidosAtivos);
            
            this.view.resetarVisualizacao();
        } catch (error) {
            console.error("Erro ao carregar dados iniciais:", error);
            this.view.mostrarErro();
        }
    }

    handleTabChange(mode) {
        if (this.mode === mode) return;
        this.mode = mode;
        this.view.setMode(mode);
    }

    async handleSelecaoChange(selections) {
        if (this.mode === 'deputados') {
            const idA = selections.deputadoA;
            const idB = selections.deputadoB;

            if (!idA || !idB) {
                this.view.resetarVisualizacao();
                return;
            }

            if (idA === idB) {
                alert("Por favor, selecione deputados diferentes para comparar.");
                this.view.resetarVisualizacao();
                return;
            }

            await this.compararDeputados(parseInt(idA), parseInt(idB));
        } else {
            const siglaA = selections.partidoA;
            const siglaB = selections.partidoB;

            if (!siglaA || !siglaB) {
                this.view.resetarVisualizacao();
                return;
            }

            if (siglaA === siglaB) {
                alert("Por favor, selecione partidos diferentes para comparar.");
                this.view.resetarVisualizacao();
                return;
            }

            await this.compararPartidos(siglaA, siglaB);
        }
    }

    async compararDeputados(idA, idB) {
        this.view.mostrarLoader();

        try {
            // Busca dados básicos do perfil dos modelos ativos
            const depAObj = this.deputadosAtivos.find(d => d.id === idA);
            const depBObj = this.deputadosAtivos.find(d => d.id === idB);

            if (!depAObj || !depBObj) {
                this.view.mostrarErro();
                return;
            }

            // Coleta dados em paralelo para ambos os deputados
            const [statsA, statsB] = await Promise.all([
                this.buscarEstatísticasDeputado(idA, depAObj.siglaPartido),
                this.buscarEstatísticasDeputado(idB, depBObj.siglaPartido)
            ]);

            // Renderizar confronto
            this.view.renderizarComparacaoDeputados(
                depAObj, statsA.kpi, statsA.rating,
                depBObj, statsB.kpi, statsB.rating
            );

            // Mapeia e junta os gastos por categoria para gerar o gráfico lado a lado
            const categoriasA = {};
            const categoriasB = {};

            statsA.despesas.forEach(d => {
                const cat = d.tipoDespesa || 'Outros';
                categoriasA[cat] = (categoriasA[cat] || 0) + (d.valorDocumento || 0);
            });

            statsB.despesas.forEach(d => {
                const cat = d.tipoDespesa || 'Outros';
                categoriasB[cat] = (categoriasB[cat] || 0) + (d.valorDocumento || 0);
            });

            // Extrai as categorias únicas mais expressivas (top 5 de maior soma consolidada)
            const todasCategorias = [...new Set([...Object.keys(categoriasA), ...Object.keys(categoriasB)])];
            todasCategorias.sort((a, b) => {
                const somaA = (categoriasA[a] || 0) + (categoriasB[a] || 0);
                const somab = (categoriasA[b] || 0) + (categoriasB[b] || 0);
                return somab - somaA;
            });

            const topCategorias = todasCategorias.slice(0, 5);
            const valoresA = topCategorias.map(cat => categoriasA[cat] || 0);
            const valoresB = topCategorias.map(cat => categoriasB[cat] || 0);

            // Abrevia os títulos das categorias para caber bem no gráfico
            const topCategoriasAbreviadas = topCategorias.map(cat => {
                if (cat.length > 25) return cat.substring(0, 22) + '...';
                return cat;
            });

            this.view.renderizarGraficoGastos(
                topCategoriasAbreviadas,
                valoresA, depAObj.nome,
                valoresB, depBObj.nome
            );

        } catch (error) {
            console.error("Erro na comparação de deputados:", error);
            this.view.mostrarErro();
        }
    }

    async buscarEstatísticasDeputado(id, siglaPartido) {
        const anoCorrente = new Date().getFullYear();

        const [despesas, eventos, proposicoes, votacoesRecentes, publicResp] = await Promise.all([
            window.camaraApi.buscarDespesas(id, anoCorrente).catch(() => []),
            window.camaraApi.buscarEventos(id, `${anoCorrente}-01-01`, `${anoCorrente}-12-31`).catch(() => []),
            window.camaraApi.buscarProposicoesAutor(id).catch(() => []),
            window.camaraApi.buscarVotacoesRecentes(5).catch(() => []),
            window.AvaliacaoModel.listarPorDeputado(id).catch(() => ({ success: false, data: [] }))
        ]);

        // Analytics
        const analisePresenca = window.analytics.calcularTaxaPresenca(eventos, anoCorrente);
        const analiseGastos = window.analytics.calcularMediaGastos(despesas);
        const totalProposicoes = proposicoes.length;

        // Votos Nominais para Coesão (limite de 5 votações para performance excelente)
        const votosDeputadoMapeados = [];
        const orientacoesMapeadas = {};

        await Promise.all(votacoesRecentes.map(async (v) => {
            try {
                const [votosList, orientacoesList] = await Promise.all([
                    window.camaraApi.buscarVotosVotacao(v.id).catch(() => []),
                    window.camaraApi.buscarOrientacoesVotacao(v.id).catch(() => [])
                ]);

                const votoDoDeputado = votosList.find(vote => {
                    const dep = vote.deputado || vote.deputado_;
                    return dep && dep.id === id;
                });
                const tipoVoto = votoDoDeputado ? votoDoDeputado.tipoVoto : "Ausente";

                votosDeputadoMapeados.push({
                    votacaoId: v.id,
                    voto: tipoVoto
                });

                orientacoesMapeadas[v.id] = orientacoesList;
            } catch (err) {
                console.error(err);
            }
        }));

        const analiseCoesao = window.analytics.calcularCoesaoPartidaria(votosDeputadoMapeados, orientacoesMapeadas, siglaPartido);

        // Média de Avaliações
        let rating = 0;
        if (publicResp.success && publicResp.data.length > 0) {
            const sum = publicResp.data.reduce((acc, curr) => acc + curr.nota, 0);
            rating = sum / publicResp.data.length;
        }

        return {
            kpi: {
                presenca: analisePresenca.rate,
                gastoMedio: analiseGastos.media,
                totalProposicoes: totalProposicoes,
                coesao: analiseCoesao.coesao
            },
            rating,
            despesas
        };
    }

    async compararPartidos(siglaA, siglaB) {
        this.view.mostrarLoader();

        try {
            const partA = this.partidosAtivos.find(p => p.sigla.toUpperCase() === siglaA.toUpperCase());
            const partB = this.partidosAtivos.find(p => p.sigla.toUpperCase() === siglaB.toUpperCase());

            if (!partA || !partB) {
                this.view.mostrarErro();
                return;
            }

            // Calcula coesão dos partidos
            const coesaoResp = await window.PartidoModel.calcularCoesaoPartidos(3);
            const coesaoMap = coesaoResp.success ? (coesaoResp.data || {}) : {};

            const siglaUpperA = siglaA.toUpperCase();
            const siglaUpperB = siglaB.toUpperCase();

            const dataA = {
                membrosCount: partA.totalMembros,
                coesao: coesaoMap[siglaUpperA] !== undefined ? coesaoMap[siglaUpperA] : null
            };

            const dataB = {
                membrosCount: partB.totalMembros,
                coesao: coesaoMap[siglaUpperB] !== undefined ? coesaoMap[siglaUpperB] : null
            };

            this.view.renderizarComparacaoPartidos(partA, dataA, partB, dataB);

        } catch (error) {
            console.error("Erro na comparação de partidos:", error);
            this.view.mostrarErro();
        }
    }
}

// Inicialização automática
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const view = new window.ComparadorView();
        const controller = new ComparadorController(view);
        controller.init();
    }, 100);
});

window.ComparadorController = ComparadorController;
