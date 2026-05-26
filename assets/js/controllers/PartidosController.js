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
                window.PartidoModel.calcularCoesaoPartidos(10) // Utiliza cache de 1h
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
                        urlLogo: p.urlLogo,
                        totalMembros: membrosPorPartido[siglaUpper] || 0,
                        coesao: coesaoMap[siglaUpper] !== undefined ? coesaoMap[siglaUpper] : null
                    };
                })
                // Filtramos apenas os partidos que têm pelo menos 1 membro na legislatura ativa
                .filter(p => p.totalMembros > 0);

            // Ordena pelo maior numero de membros na bancada
            partidosCompletos.sort((a, b) => b.totalMembros - a.totalMembros);

            this.partidosOriginais = partidosCompletos;

            // Carrega valor inicial da URL
            const urlParams = new URLSearchParams(window.location.search);
            const busca = urlParams.get('busca') || '';
            const inputBusca = document.getElementById('busca-partido');
            if (inputBusca && busca) {
                inputBusca.value = busca;
            }

            this.view.renderizarHemiciclo(partidosCompletos);
            
            if (busca) {
                const query = busca.toLowerCase().trim();
                const filtrados = partidosCompletos.filter(p => 
                    p.sigla.toLowerCase().includes(query) || 
                    p.nome.toLowerCase().includes(query)
                );
                this.view.renderizarGrid(filtrados);
            } else {
                this.view.renderizarGrid(partidosCompletos);
            }

            this.setupFiltro();

        } catch (error) {
            console.error("Erro no PartidosController:", error);
            this.view.mostrarErro("Ocorreu um erro ao processar os dados dos partidos.");
        }
    }

    setupFiltro() {
        const inputBusca = document.getElementById('busca-partido');
        if (!inputBusca) return;

        // Evita multiplos event listeners ao recarregar
        inputBusca.replaceWith(inputBusca.cloneNode(true));
        const novoInputBusca = document.getElementById('busca-partido');

        novoInputBusca.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            
            const urlParams = new URLSearchParams(window.location.search);
            if (query) {
                urlParams.set('busca', query);
            } else {
                urlParams.delete('busca');
            }
            window.history.replaceState(null, '', window.location.pathname + '?' + urlParams.toString());

            if (!query) {
                this.view.renderizarGrid(this.partidosOriginais);
                return;
            }

            const filtrados = this.partidosOriginais.filter(p => 
                p.sigla.toLowerCase().includes(query) || 
                p.nome.toLowerCase().includes(query)
            );
            this.view.renderizarGrid(filtrados);
        });
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
