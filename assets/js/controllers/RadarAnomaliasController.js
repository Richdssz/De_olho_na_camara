/**
 * Controller do Radar de Anomalias (radar-anomalias.html)
 * Orquestra o escaneamento de mandatos em busca de desvios comportamentais e conformidade.
 */
class RadarAnomaliasController {
    constructor() {
        this.view = new window.RadarAnomaliasView();
        this.anomaliasGerais = [];
    }

    async init() {
        console.log("RadarAnomaliasController: Inicializando...");
        window.activeController = this;
        this.view.onFiltroChange(this.handleFiltros.bind(this));
        await this.analisarMandatos();
    }

    async recarregarGrid() {
        await this.analisarMandatos();
    }

    async analisarMandatos() {
        this.view.mostrarLoader();
        try {
            // Buscamos os primeiros 12 deputados para analisar e detectar anomalias
            const depResp = await window.DeputadoModel.listar({ itens: 12 });
            if (!depResp.success) {
                this.view.mostrarErro("Não foi possível carregar a lista de deputados para análise.");
                return;
            }

            const deputados = depResp.data || [];
            this.anomaliasGerais = [];

            const anoCorrente = new Date().getFullYear();

            // Analisa cada deputado em paralelo
            await Promise.all(deputados.map(async (d) => {
                try {
                    // Busca despesas, eventos e proposições para rodar o motor de inteligência
                    const [despesas, eventos, proposicoes, votacoesRecentes] = await Promise.all([
                        window.camaraApi.buscarDespesas(d.id, anoCorrente).catch(() => []),
                        window.camaraApi.buscarEventos(d.id, `${anoCorrente}-01-01`, `${anoCorrente}-12-31`).catch(() => []),
                        window.camaraApi.buscarProposicoesAutor(d.id).catch(() => []),
                        window.camaraApi.buscarVotacoesRecentes(10).catch(() => [])
                    ]);

                    const analisePresenca = window.analytics.calcularTaxaPresenca(eventos, anoCorrente);
                    const analiseGastos = window.analytics.calcularMediaGastos(despesas);

                    // Votos Nominais
                    const votosDeputadoMapeados = [];
                    const orientacoesMapeadas = {};

                    // Mapeia votos
                    await Promise.all(votacoesRecentes.map(async (v) => {
                        try {
                            const [votosList, orientacoesList] = await Promise.all([
                                window.camaraApi.buscarVotosVotacao(v.id).catch(() => []),
                                window.camaraApi.buscarOrientacoesVotacao(v.id).catch(() => [])
                            ]);

                            const votoDoDeputado = votosList.find(vote => vote.deputado_ && vote.deputado_.id === d.id);
                            const tipoVoto = votoDoDeputado ? votoDoDeputado.tipoVoto : "Ausente";

                            votosDeputadoMapeados.push({
                                votacaoId: v.id,
                                descricao: v.descricao,
                                data: v.data,
                                voto: tipoVoto
                            });

                            orientacoesMapeadas[v.id] = orientacoesList;
                        } catch (err) {
                            // Ignora erro individual de votação
                        }
                    }));

                    const analiseCoesao = window.analytics.calcularCoesaoPartidaria(
                        votosDeputadoMapeados, 
                        orientacoesMapeadas, 
                        d.siglaPartido
                    );

                    const anomaliaInfo = window.analytics.detectarAnomalias({
                        presencaRate: analisePresenca.rate,
                        gastoMedioMensal: analiseGastos.media,
                        coesaoRate: analiseCoesao.coesao
                    });

                    if (anomaliaInfo.temAnomalia) {
                        this.anomaliasGerais.push({
                            deputado: d,
                            anomaliaInfo: anomaliaInfo
                        });
                    }
                } catch (err) {
                    console.error(`Erro ao analisar deputado ${d.nome}:`, err);
                }
            }));

            // Ordena as anomalias por severidade (crítico primeiro)
            this.anomaliasGerais.sort((a, b) => {
                const severidades = { 'critico': 3, 'alerta': 2, 'atencao': 1, 'info': 0 };
                return (severidades[b.anomaliaInfo.severidade] || 0) - (severidades[a.anomaliaInfo.severidade] || 0);
            });

            this.view.renderizarGrid(this.anomaliasGerais);

        } catch (error) {
            console.error("Erro ao rodar central de anomalias:", error);
            this.view.mostrarErro("Erro ao executar escaner de conformidade.");
        }
    }

    handleFiltros(filtros) {
        let filtrados = this.anomaliasGerais;

        // Filtro de categoria
        if (filtros.categoria) {
            filtrados = filtrados.filter(item => 
                item.anomaliaInfo.anomalias.some(a => a.categoria === filtros.categoria)
            );
        }

        // Filtro de severidade
        if (filtros.severidade) {
            filtrados = filtrados.filter(item => 
                item.anomaliaInfo.severidade === filtros.severidade
            );
        }

        this.view.renderizarGrid(filtrados);
    }
}

// Inicialização automática
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('radar-anomalias-grid')) {
        setTimeout(() => {
            const controller = new RadarAnomaliasController();
            controller.init();
        }, 100);
    }
});

window.RadarAnomaliasController = RadarAnomaliasController;
