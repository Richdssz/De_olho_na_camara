/**
 * Controller do Dashboard Principal (index.html)
 * Orquestra chamadas ao Model (Deputados, Monitoramento) e passa para a View.
 */
class DashboardController {
    constructor() {
        this.view = new window.DashboardView();
        this.deputadosAtuais = [];
    }

    async init() {
        // Registra callbacks da View
        this.view.onAcompanharClick(this.handleAcompanhar.bind(this));
        this.view.onAvaliarClick(this.handleAvaliar.bind(this));

        // Inicia carregamento
        this.view.mostrarLoader();
        await this.carregarDados();
    }

    async carregarDados() {
        try {
            // 1. Busca todos os deputados ativos para estatísticas globais
            const todosDeputados = await window.DeputadoModel.listarTodos();
            const totalDeputados = todosDeputados.length || 513;

            // Busca os 10 destacados para o grid
            const response = await window.DeputadoModel.listar({ itens: 10 });
            if (!response.success) {
                this.view.mostrarErro();
                return;
            }
            this.deputadosAtuais = response.data;

            // 2. Busca o que o usuário já acompanha no radar
            let monitoradosIds = [];
            if (window.Back4AppService && window.Back4AppService.getCurrentUser()) {
                const radarResp = await window.MonitoramentoModel.listarMonitorados();
                if (radarResp.success) {
                    monitoradosIds = radarResp.data;
                }
            }

            // 3. Busca notas médias
            const ratingsMap = {};
            try {
                const avaliacoesResp = await window.Back4AppService.getPublicAll("Avaliacao", {}).catch(() => []);
                avaliacoesResp.forEach(item => {
                    const depId = item.get("deputadoId");
                    const nota = item.get("nota") || 0;
                    if (!ratingsMap[depId]) {
                        ratingsMap[depId] = { total: 0, count: 0 };
                    }
                    ratingsMap[depId].total += nota;
                    ratingsMap[depId].count++;
                });
                Object.keys(ratingsMap).forEach(id => {
                    ratingsMap[id] = ratingsMap[id].total / ratingsMap[id].count;
                });
            } catch (err) {
                console.error("Erro ao obter notas médias:", err);
            }

            // 4. Calcular KPIs
            // CEAP: Somar despesas a partir do cache do ranking se disponível, senão estimar
            let totalCeap = 0;
            const cachedRanking = window.CacheService ? window.CacheService.getLocal('ranking_economia_consolidado_2026') : null;
            if (cachedRanking && Array.isArray(cachedRanking)) {
                totalCeap = cachedRanking.reduce((sum, d) => sum + (d.totalGasto || 0), 0);
            } else {
                const mesAtual = new Date().getMonth() + 1;
                totalCeap = totalDeputados * 38500 * mesAtual;
            }

            // Votações no ano atual
            let totalVotacoes = 0;
            try {
                const anoAtual = new Date().getFullYear();
                const dataInicio = `${anoAtual}-01-01`;
                const dataFim = new Date().toISOString().split('T')[0];
                const resVot = await window.camaraApi._fetch('/votacoes', {
                    dataInicio,
                    dataFim,
                    itens: 100
                });
                const dadosVot = resVot.dados || [];
                const linksVot = resVot.links || [];
                const lastLink = linksVot.find(l => l.rel === 'last');
                if (lastLink) {
                    const lastUrl = new URL(lastLink.href);
                    const lastPage = parseInt(lastUrl.searchParams.get('pagina')) || 1;
                    totalVotacoes = (lastPage - 1) * 100 + dadosVot.length;
                } else {
                    totalVotacoes = dadosVot.length;
                }
            } catch (e) {
                console.error("Erro ao buscar votações para KPI:", e);
                totalVotacoes = 142;
            }

            // Partidos representados
            const partidosComDeputados = new Set(todosDeputados.map(d => d.siglaPartido).filter(Boolean));
            const totalPartidos = partidosComDeputados.size || 20;

            // 5. Renderiza a tela
            this.view.renderizarKPIs({
                totalDeputados,
                totalCeap,
                totalVotacoes,
                totalPartidos
            });
            this.view.renderizarGrid(this.deputadosAtuais, monitoradosIds, ratingsMap);
            this.view.renderizarGraficoPartidos(todosDeputados);

        } catch (error) {
            console.error("DashboardController: erro ao carregar dados", error);
            this.view.mostrarErro();
        }
    }

    /**
     * Recarrega o grid (útil após login/logout para atualizar os botões)
     */
    async recarregarGrid() {
        if (this.deputadosAtuais.length === 0) return;
        
        let monitoradosIds = [];
        if (window.Back4AppService && window.Back4AppService.getCurrentUser()) {
            const radarResp = await window.MonitoramentoModel.listarMonitorados();
            if (radarResp.success) {
                monitoradosIds = radarResp.data;
            }
        }
        
        const ratingsMap = {};
        try {
            const avaliacoesResp = await window.Back4AppService.getPublicAll("Avaliacao", {}).catch(() => []);
            avaliacoesResp.forEach(item => {
                const depId = item.get("deputadoId");
                const nota = item.get("nota") || 0;
                if (!ratingsMap[depId]) {
                    ratingsMap[depId] = { total: 0, count: 0 };
                }
                ratingsMap[depId].total += nota;
                ratingsMap[depId].count++;
            });
            Object.keys(ratingsMap).forEach(id => {
                ratingsMap[id] = ratingsMap[id].total / ratingsMap[id].count;
            });
        } catch (err) {
            console.error("Erro ao obter notas médias:", err);
        }

        this.view.renderizarGrid(this.deputadosAtuais, monitoradosIds, ratingsMap);
    }

    async handleAcompanhar(deputadoId, nomeDeputado, btnElement) {
        if (!window.Back4AppService.getCurrentUser()) {
            // Invoca abertura de modal de login (responsabilidade de app.js)
            const authModal = document.getElementById('auth-modal');
            if (authModal) authModal.classList.remove('hidden');
            else alert("Você precisa fazer login para acompanhar deputados!");
            return;
        }

        btnElement.disabled = true;
        try {
            const resp = await window.MonitoramentoModel.alternarRadar(deputadoId, nomeDeputado);
            if (resp.success) {
                this.view.atualizarBotaoRadar(btnElement, resp.data.action);
            } else {
                alert("Erro ao alterar o radar.");
            }
        } finally {
            btnElement.disabled = false;
        }
    }

    handleAvaliar(deputadoId, nomeDeputado) {
        if (!window.Back4AppService.getCurrentUser()) {
            const authModal = document.getElementById('auth-modal');
            if (authModal) authModal.classList.remove('hidden');
            else alert("Você precisa fazer login para avaliar deputados!");
            return;
        }

        // Chama o método global do app.js que manipula o modal de avaliação
        if (typeof window.abrirModalAvaliacao === 'function') {
            window.abrirModalAvaliacao(deputadoId, nomeDeputado);
        }
    }
}

window.DashboardController = DashboardController;

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa apenas se estivermos na página de dashboard
    if (document.getElementById('graficoPartidos') && document.getElementById('deputados-grid')) {
        const controller = new DashboardController();
        window.activeController = controller; // Para o app.js poder recarregar a grid
        controller.init();
    }
});
