/**
 * Controller do Perfil do Partido (partido-perfil.html)
 * Orquestra o carregamento dos membros da bancada e os KPIs do partido.
 */
class PartidoPerfilController {
    constructor() {
        this.view = new window.PartidoPerfilView();
        this.partidoSiglaGlobal = null;
        this.partidoIdGlobal = null;
    }

    async init() {
        console.log("PartidoPerfilController: Inicializando...");
        const urlParams = new URLSearchParams(window.location.search);
        this.partidoSiglaGlobal = urlParams.get('sigla');
        this.partidoIdGlobal = urlParams.get('id');

        if (!this.partidoSiglaGlobal) {
            this.view.mostrarErro("Sigla do partido não fornecida na URL.");
            return;
        }

        window.activeController = this;
        await this.carregarDadosPartido();
    }

    async recarregarGrid() {
        await this.carregarDadosPartido();
    }

    async carregarDadosPartido() {
        try {
            this.view.mostrarCarregamento();

            // 1. Busca todos os deputados (para filtrar os membros deste partido)
            // 2. Calcula as taxas de coesão partidária
            // 3. Busca detalhes extras do partido (se o ID estiver disponível)
            const [deputadosResp, coesaoResp, partidoInfo] = await Promise.all([
                window.DeputadoModel.listar(), // Cache de 1h
                window.PartidoModel.calcularCoesaoPartidos(3), // Cache de 1h
                this.partidoIdGlobal ? window.camaraApi.buscarPartido(this.partidoIdGlobal).catch(() => null) : Promise.resolve(null)
            ]);

            if (!deputadosResp.success) {
                this.view.mostrarErro("Falha ao carregar deputados da bancada.");
                return;
            }

            const membros = (deputadosResp.data || []).filter(d => 
                d.siglaPartido && d.siglaPartido.toUpperCase() === this.partidoSiglaGlobal.toUpperCase()
            );

            // Ordena os deputados por nome
            membros.sort((a, b) => a.nome.localeCompare(b.nome));

            const coesaoMap = coesaoResp.success ? (coesaoResp.data || {}) : {};
            const coesao = coesaoMap[this.partidoSiglaGlobal.toUpperCase()] !== undefined 
                ? coesaoMap[this.partidoSiglaGlobal.toUpperCase()] 
                : 100;

            const partidoCompleto = {
                sigla: this.partidoSiglaGlobal,
                nome: partidoInfo ? partidoInfo.nome : (membros[0] ? membros[0].siglaPartido : this.partidoSiglaGlobal),
                totalMembros: membros.length,
                coesao: coesao
            };

            this.view.preencherDadosPerfil(partidoCompleto);
            this.view.renderizarMembros(membros);
            this.view.mostrarConteudo();

        } catch (error) {
            console.error("Erro no PartidoPerfilController:", error);
            this.view.mostrarErro("Ocorreu um erro ao carregar o perfil da bancada.");
        }
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Inicializa apenas se estivermos na página de perfil do partido
    if (document.getElementById('partido-content')) {
        const controller = new PartidoPerfilController();
        controller.init();
    }
});

window.PartidoPerfilController = PartidoPerfilController;
