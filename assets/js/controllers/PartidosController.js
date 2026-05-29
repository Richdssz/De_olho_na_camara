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

            // Une as informações dos partidos e busca logos oficiais via Back4App PartidoAsset
            const partidosCompletos = await Promise.all(partidos.map(async (p) => {
                const siglaUpper = p.sigla.toUpperCase();
                const totalMembros = membrosPorPartido[siglaUpper] || 0;
                
                if (totalMembros === 0) return null;

                const urlLogo = await window.PartidoModel.buscarLogo(p.sigla);
                const fallbackData = window.PartidoModel.getFallbackData(p.sigla);
                const corHex = fallbackData?.corHex || '#7f8c8d';

                return {
                    id: p.id,
                    sigla: p.sigla,
                    nome: p.nome,
                    urlLogo: urlLogo,
                    corHex: corHex,
                    totalMembros: totalMembros,
                    coesao: coesaoMap[siglaUpper] !== undefined ? coesaoMap[siglaUpper] : null
                };
            }));

            const partidosAtivos = partidosCompletos.filter(Boolean);

            // Ordena pelo maior numero de membros na bancada
            partidosAtivos.sort((a, b) => b.totalMembros - a.totalMembros);

            this.partidosOriginais = partidosAtivos;

            // Carrega valor inicial da URL ou localStorage
            const urlParams = new URLSearchParams(window.location.search);
            let busca = urlParams.get('busca');
            if (busca === null) {
                busca = localStorage.getItem('partidos_state') || '';
            }
            const inputBusca = document.getElementById('busca-partido');
            if (inputBusca && busca) {
                inputBusca.value = busca;
            }

            this.view.renderizarHemiciclo(partidosAtivos);
            
            if (busca) {
                const query = busca.toLowerCase().trim();
                const filtrados = partidosAtivos.filter(p => 
                    p.sigla.toLowerCase().includes(query) || 
                    p.nome.toLowerCase().includes(query)
                );
                this.view.renderizarGrid(filtrados);
            } else {
                this.view.renderizarGrid(partidosAtivos);
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
                localStorage.setItem('partidos_state', query);
            } else {
                urlParams.delete('busca');
                localStorage.removeItem('partidos_state');
            }
            try {
                window.history.replaceState(null, '', window.location.pathname + '?' + urlParams.toString());
            } catch (e) {
                console.warn("Nao foi possivel atualizar a URL via history API:", e);
            }

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
