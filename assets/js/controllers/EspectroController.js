class EspectroController {
    constructor() {
        this.view = new EspectroView('main');
        this.dadosDeputados = [];
        this.partidoDestaque = '';
        this.deputadoDestaque = '';
        this.modoExibicao = 'destacar';

        this.view.onPartidoChange = this.handlePartidoChange.bind(this);
        this.view.onDeputadoChange = this.handleDeputadoChange.bind(this);
        this.view.onModoChange = this.handleModoChange.bind(this);
        this.view.onRecarregar = this.loadData.bind(this);
    }

    async init() {
        await this.loadPartidos();
        await this.loadData();
    }

    async loadPartidos() {
        const resultado = await PartidoModel.listarPartidos();
        if (resultado.success) {
            this.view.renderizarSelectPartidos(resultado.data);
        }
    }

    async loadData() {
        this.view.mostrarLoader();
        try {
            const resultado = await DeputadoModel.listar();
            if (resultado.success) {
                this.dadosDeputados = this.gerarAnaliseIdeologicaSimulada(resultado.data);
                this.view.renderizarSelectDeputados(this.dadosDeputados);
                this.atualizarGrafico();
            }
        } catch (error) {
            console.error('Erro ao carregar dados do espectro:', error);
        } finally {
            this.view.ocultarLoader();
        }
    }

    handlePartidoChange(siglaPartido) {
        this.partidoDestaque = siglaPartido;
        this.atualizarGrafico();
    }

    handleDeputadoChange(idDeputado) {
        this.deputadoDestaque = idDeputado;
        this.atualizarGrafico();
    }

    handleModoChange(modo) {
        this.modoExibicao = modo;
        this.atualizarGrafico();
    }

    atualizarGrafico() {
        this.view.renderizarGrafico(
            this.dadosDeputados,
            this.partidoDestaque,
            this.deputadoDestaque,
            this.modoExibicao
        );
    }

    gerarAnaliseIdeologicaSimulada(deputados) {
        // Simulação matemática para MVP Client-side.
        // O ideal é o backend calcular varrendo os arquivos CSV/JSON de votos.
        const tendenciaBase = {
            'PT': { alinhamento: 95, coesao: 90 },
            'PCdoB': { alinhamento: 98, coesao: 95 },
            'PV': { alinhamento: 90, coesao: 85 },
            'PSOL': { alinhamento: 80, coesao: 85 },
            'PDT': { alinhamento: 75, coesao: 70 },
            'PSB': { alinhamento: 85, coesao: 80 },
            'REDE': { alinhamento: 70, coesao: 80 },
            'MDB': { alinhamento: 60, coesao: 60 },
            'PSD': { alinhamento: 65, coesao: 65 },
            'UNIÃO': { alinhamento: 40, coesao: 55 },
            'PP': { alinhamento: 45, coesao: 60 },
            'REPUBLICANOS': { alinhamento: 35, coesao: 70 },
            'PSDB': { alinhamento: 30, coesao: 65 },
            'PL': { alinhamento: 10, coesao: 85 },
            'NOVO': { alinhamento: 5, coesao: 95 }
        };

        return deputados.map(dep => {
            const tendencia = tendenciaBase[dep.siglaPartido] || { alinhamento: 50, coesao: 50 };
            
            const fatorRuido = (100 - tendencia.coesao) / 2;
            let alinhamentoReal = tendencia.alinhamento + (Math.random() * fatorRuido * 2 - fatorRuido);
            let coesaoReal = tendencia.coesao + (Math.random() * 10 - 5);
            
            alinhamentoReal = Math.max(0, Math.min(100, alinhamentoReal));
            coesaoReal = Math.max(0, Math.min(100, coesaoReal));

            return {
                id: dep.id,
                nome: dep.nome,
                partido: dep.siglaPartido,
                estado: dep.siglaUf,
                fotoUrl: dep.urlFoto,
                alinhamento: alinhamentoReal,
                coesao: coesaoReal
            };
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const controller = new EspectroController();
    controller.init();
});
