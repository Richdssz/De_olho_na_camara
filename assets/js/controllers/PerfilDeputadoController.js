/**
 * Controller do Perfil do Deputado (deputado-perfil.html)
 */
class PerfilDeputadoController {
    constructor() {
        this.view = new window.PerfilDeputadoView();
        this.deputadoIdGlobal = null;
        this.deputadoNomeGlobal = "";
    }

    async init() {
        const urlParams = new URLSearchParams(window.location.search);
        const deputadoId = urlParams.get('id');

        if (!deputadoId) {
            this.view.mostrarErro("ID do deputado não fornecido na URL.");
            return;
        }

        this.deputadoIdGlobal = parseInt(deputadoId);

        this.view.onAcompanharClick(this.handleAlternarRadar.bind(this));
        this.view.onExportarClick(() => window.print());

        await this.carregarDadosDeputado(this.deputadoIdGlobal);
    }

    async carregarDadosDeputado(id) {
        try {
            this.view.mostrarCarregamento();

            // 1. Dados cadastrais
            const deputadoResp = await window.DeputadoModel.buscarDetalhes(id);
            if (!deputadoResp.success) throw new Error("Deputado não encontrado.");
            
            const deputado = deputadoResp.data;
            this.deputadoNomeGlobal = deputado.ultimoStatus.nome || deputado.nomeCivil;
            const siglaPartido = deputado.ultimoStatus.siglaPartido || "";

            this.view.preencherDadosPerfil(deputado);

            // Sincroniza radar
            await this.verificarEstadoRadar(id);

            // 2. Coletando dados complementares
            const anoCorrente = new Date().getFullYear();
            
            const [despesas, eventos, proposicoes, votacoesRecentes] = await Promise.all([
                window.camaraApi.buscarDespesas(id, anoCorrente).catch(() => []),
                window.camaraApi.buscarEventos(id, `${anoCorrente}-01-01`, `${anoCorrente}-12-31`).catch(() => []),
                window.camaraApi.buscarProposicoesAutor(id).catch(() => []),
                window.camaraApi.buscarVotacoesRecentes(15).catch(() => [])
            ]);

            // 3. Analytics
            const analisePresenca = window.analytics.calcularTaxaPresenca(eventos, anoCorrente);
            const analiseGastos = window.analytics.calcularMediaGastos(despesas);
            const totalProposicoes = proposicoes.length;

            // 4. Votos Nominais
            const votosDeputadoMapeados = [];
            const orientacoesMapeadas = {};

            await Promise.all(votacoesRecentes.map(async (v) => {
                try {
                    const [votosList, orientacoesList] = await Promise.all([
                        window.camaraApi.buscarVotosVotacao(v.id),
                        window.camaraApi.buscarOrientacoesVotacao(v.id)
                    ]);

                    const votoDoDeputado = votosList.find(vote => vote.deputado_ && vote.deputado_.id === id);
                    const tipoVoto = votoDoDeputado ? votoDoDeputado.tipoVoto : "Ausente";

                    votosDeputadoMapeados.push({
                        votacaoId: v.id,
                        descricao: v.descricao,
                        data: v.data,
                        voto: tipoVoto
                    });

                    orientacoesMapeadas[v.id] = orientacoesList;
                } catch (err) {
                    console.error(`Erro votação ${v.id}:`, err);
                }
            }));

            const analiseCoesao = window.analytics.calcularCoesaoPartidaria(votosDeputadoMapeados, orientacoesMapeadas, siglaPartido);
            
            const analiseAnomalias = window.analytics.detectarAnomalias({
                presencaRate: analisePresenca.rate,
                gastoMedioMensal: analiseGastos.media,
                coesaoRate: analiseCoesao.coesao
            });

            // 5. Renderizar na View
            this.view.renderizarPainelKPIs(analisePresenca, analiseGastos, analiseCoesao, totalProposicoes);
            this.view.renderizarAnomalias(analiseAnomalias);
            this.view.renderizarTabelaVotacoes(votosDeputadoMapeados, orientacoesMapeadas, siglaPartido);
            this.view.renderizarGraficos(despesas, eventos);

            this.view.mostrarConteudo();
        } catch (error) {
            console.error("Erro no perfil:", error);
            this.view.mostrarErro("Falha ao processar e carregar dados do perfil: " + error.message);
        }
    }

    async verificarEstadoRadar(id) {
        if (!window.Back4AppService || !window.Back4AppService.getCurrentUser()) return;
        const radarResp = await window.MonitoramentoModel.listarMonitorados();
        if (radarResp.success) {
            const isMonitored = radarResp.data.includes(id);
            this.view.atualizarBotaoRadar(this.view.btnRadarPerfil, isMonitored);
        }
    }

    async handleAlternarRadar(btn) {
        if (!this.deputadoIdGlobal) return;

        if (!window.Back4AppService.getCurrentUser()) {
            const authModal = document.getElementById('auth-modal');
            if (authModal) authModal.classList.remove('hidden');
            else alert("Acesse sua conta para utilizar o monitoramento!");
            return;
        }

        btn.disabled = true;
        try {
            const resp = await window.MonitoramentoModel.alternarRadar(this.deputadoIdGlobal, this.deputadoNomeGlobal);
            if (resp.success) {
                const isMonitored = resp.data.action === 'added';
                this.view.atualizarBotaoRadar(btn, isMonitored);
            }
        } catch (error) {
            alert("Erro ao alterar o radar.");
        } finally {
            btn.disabled = false;
        }
    }
}

window.PerfilDeputadoController = PerfilDeputadoController;

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa apenas se estivermos na página de perfil
    if (document.getElementById('profile-content')) {
        const controller = new PerfilDeputadoController();
        controller.init();
    }
});
