/**
 * Controller de Partidos (partidos.html)
 * Orquestra a busca de partidos, quantidade de membros e cálculos de coesão partidária.
 */
class PartidosController {
    constructor() {
        this.view = new window.PartidosView();
    }

    async init() {
        console.log("PartidosController: Inicializando...");
        window.activeController = this;
        await this.carregarPartidos();
    }

    async recarregarGrid() {
        await this.carregarPartidos();
    }

    async carregarPartidos() {
        this.view.mostrarLoader();

        try {
            // Busca partidos e deputados (para contar membros por bancada) e o calculo de coesão
            const [partidosResp, deputadosResp, coesaoResp] = await Promise.all([
                window.PartidoModel.listar(),
                window.DeputadoModel.listar(), // Utiliza cache de 1h
                window.PartidoModel.calcularCoesaoPartidos(3) // Utiliza cache de 1h
            ]);

            if (!partidosResp.success) {
                this.view.mostrarErro("Não foi possível carregar a lista de partidos.");
                return;
            }

            const partidos = partidosResp.data || [];
            const deputados = deputadosResp.success ? (deputadosResp.data || []) : [];
            const coesaoMap = coesaoResp.success ? (coesaoResp.data || {}) : {};

            // Agrupa total de deputados por sigla de partido
            const membrosPorPartido = {};
            deputados.forEach(d => {
                if (d.siglaPartido) {
                    const sigla = d.siglaPartido.toUpperCase();
                    membrosPorPartido[sigla] = (membrosPorPartido[sigla] || 0) + 1;
                }
            });

            // Une as informações dos partidos
            const partidosCompletos = partidos
                .map(p => {
                    const siglaUpper = p.sigla.toUpperCase();
                    return {
                        id: p.id,
                        sigla: p.sigla,
                        nome: p.nome,
                        totalMembros: membrosPorPartido[siglaUpper] || 0,
                        coesao: coesaoMap[siglaUpper] !== undefined ? coesaoMap[siglaUpper] : 100
                    };
                })
                // Filtramos apenas os partidos que têm pelo menos 1 membro na legislatura ativa
                .filter(p => p.totalMembros > 0);

            // Ordena pelo maior número de membros na bancada
            partidosCompletos.sort((a, b) => b.totalMembros - a.totalMembros);

            this.view.renderizarGrid(partidosCompletos);

        } catch (error) {
            console.error("Erro no PartidosController:", error);
            this.view.mostrarErro("Ocorreu um erro ao processar os dados dos partidos.");
        }
    }
}

// Inicialização automática
document.addEventListener('DOMContentLoaded', () => {
    // Garante que o App Base rodou primeiro
    setTimeout(() => {
        const controller = new PartidosController();
        controller.init();
    }, 100);
});

window.PartidosController = PartidosController;
