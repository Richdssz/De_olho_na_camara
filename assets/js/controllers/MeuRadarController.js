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

        window.activeController = this;

        // Verifica autenticação usando o App.js global state ou o Back4AppService
        if (!window.Back4AppService || !window.Back4AppService.getCurrentUser()) {
            this.view.mostrarErro("Você precisa estar logado para acessar o seu Radar.");
            // Exibir modal de login automaticamente
            const authModal = document.getElementById('auth-modal');
            if (authModal) {
                authModal.classList.remove('hidden');
            }
            return;
        }

        this.view.onRemoverClick(this.handleRemover.bind(this));
        
        await this.carregarRadar();
    }

    async recarregarGrid() {
        await this.carregarRadar();
    }

    async carregarRadar() {
        this.view.mostrarLoader();

        try {
            // 1. Busca IDs favoritados
            const radarResp = await window.MonitoramentoModel.listarMonitorados();
            
            if (!radarResp.success) {
                console.error("Erro ao carregar monitoramento do banco:", radarResp.error);
                this.view.mostrarErro("Não foi possível carregar sua lista de monitoramento.");
                return;
            }

            const idsMonitorados = radarResp.data; // Array de IDs (números)

            if (!idsMonitorados || idsMonitorados.length === 0) {
                this.view.mostrarVazio();
                return;
            }

            // 2. Busca detalhes de cada ID via API da Câmara em paralelo
            console.log(`Buscando detalhes de ${idsMonitorados.length} deputados...`);
            
            const promises = idsMonitorados.map(id => 
                window.DeputadoModel.buscarDetalhes(id)
                    .catch(err => {
                        console.error(`[MeuRadarController] Erro ao carregar detalhes do deputado ${id}:`, err);
                        return { success: false, error: err.message };
                    })
            );
            const resultados = await Promise.all(promises);

            this.deputados = resultados
                .filter(res => res.success && res.data)
                .map(res => {
                    const d = res.data;
                    const u = d.ultimoStatus || {};
                    return {
                        id: d.id,
                        nome: u.nome || d.nomeCivil || "",
                        siglaPartido: u.siglaPartido || "",
                        siglaUf: u.siglaUf || "",
                        urlFoto: u.urlFoto || ""
                    };
                });
            
            // Ordenar por nome
            this.deputados.sort((a, b) => a.nome.localeCompare(b.nome));

            if (this.deputados.length === 0) {
                this.view.mostrarVazio();
            } else {
                this.view.renderizarGrid(this.deputados);
            }

        } catch (error) {
            console.error("MeuRadarController erro crucial no carregarRadar:", error);
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
