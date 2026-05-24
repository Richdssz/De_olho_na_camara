/**
 * Controller do Meu Radar (meu-radar.html)
 * Orquestra a busca de IDs monitorados e o detalhamento via API da Câmara.
 */
class MeuRadarController {
    constructor() {
        this.view = window.MeuRadarView ? new window.MeuRadarView() : null;
        this.deputados = [];
    }

    async init() {
        console.log("MeuRadarController: Inicializando...");

        if (!this.view) {
            console.error("MeuRadarView não encontrada.");
            return;
        }

        // Verifica autenticação usando o App.js global state ou o Back4AppService
        if (!window.Back4AppService || !window.Back4AppService.getCurrentUser()) {
            this.view.mostrarErro("Você precisa estar logado para acessar o seu Radar.");
            // Opcional: Acionar modal de login aqui
            return;
        }

        this.view.onRemoverClick(this.handleRemover.bind(this));
        
        await this.carregarRadar();
    }

    async carregarRadar() {
        this.view.mostrarLoader();

        try {
            // 1. Busca IDs favoritados
            const radarResp = await window.MonitoramentoModel.listarMonitorados();
            
            if (!radarResp.success) {
                this.view.mostrarErro("Não foi possível carregar sua lista de monitoramento.");
                return;
            }

            const idsMonitorados = radarResp.data; // Array de IDs (números)

            if (!idsMonitorados || idsMonitorados.length === 0) {
                this.view.mostrarVazio();
                return;
            }

            // 2. Busca detalhes de cada ID via API da Câmara em paralelo
            // A API permite passar vários IDs (mas para não estourar a URL, vamos usar Promises.all se for muito)
            // Na API da Câmara podemos buscar detalhes unitários
            
            console.log(`Buscando detalhes de ${idsMonitorados.length} deputados...`);
            
            const promises = idsMonitorados.map(id => window.DeputadoModel.buscarPorId(id));
            const resultados = await Promise.all(promises);

            this.deputados = resultados
                .filter(res => res.success && res.data)
                .map(res => res.data);
            
            // Ordenar por nome
            this.deputados.sort((a, b) => a.nome.localeCompare(b.nome));

            if (this.deputados.length === 0) {
                this.view.mostrarVazio();
            } else {
                this.view.renderizarGrid(this.deputados);
            }

        } catch (error) {
            console.error("MeuRadarController erro:", error);
            this.view.mostrarErro("Ocorreu um erro ao processar os dados.");
        }
    }

    async handleRemover(id, nome, btnElement) {
        if (!confirm(`Deseja realmente remover ${nome} do seu radar?`)) {
            return;
        }

        btnElement.disabled = true;
        btnElement.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';

        try {
            const result = await window.MonitoramentoModel.alternarRadar(id, false);
            
            if (result.success) {
                // Atualiza a lista local e remove da View
                this.deputados = this.deputados.filter(d => d.id !== id);
                this.view.removerCardLocal(btnElement);
            } else {
                alert("Não foi possível remover o deputado. Tente novamente.");
                btnElement.disabled = false;
                btnElement.innerHTML = '<i class="fa-solid fa-trash"></i>';
            }
        } catch (error) {
            console.error("Erro ao remover do radar:", error);
            alert("Erro de conexão ao tentar remover do radar.");
            btnElement.disabled = false;
            btnElement.innerHTML = '<i class="fa-solid fa-trash"></i>';
        }
    }
}

// Inicialização automática
document.addEventListener('DOMContentLoaded', () => {
    // Garante que o App Base rodou primeiro
    setTimeout(() => {
        const controller = new MeuRadarController();
        controller.init();
    }, 100);
});

window.MeuRadarController = MeuRadarController;
