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
            // 1. Busca os primeiros deputados
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

            // 3. Renderiza a tela
            this.view.renderizarGrid(this.deputadosAtuais, monitoradosIds);
            this.view.renderizarGraficoPartidos(this.deputadosAtuais);

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
        this.view.renderizarGrid(this.deputadosAtuais, monitoradosIds);
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
