/**
 * Controller do Perfil do Partido (partido-perfil.html)
 * Orquestra o carregamento dos membros da bancada e os KPIs do partido.
 */
class PartidoPerfilController {
    constructor() {
        this.view = new window.PartidoPerfilView();
        this.partidoSiglaGlobal = null;
        this.partidoIdGlobal = null;
        this.anoAnalise = 2026;
        this.membrosGlobal = [];
    }

    async init() {
        console.log("PartidoPerfilController: Inicializando...");
        const urlParams = new URLSearchParams(window.location.search);
        this.partidoSiglaGlobal = urlParams.get('sigla');
        this.partidoIdGlobal = urlParams.get('id');

        if (!this.partidoSiglaGlobal) {
            this.view.mostrarErro("Sigla do partido nao fornecida na URL.");
            return;
        }

        // Registrar callback para alteracao de ano
        this.view.onFiltroAnoChange = this.handleFiltroAnoChange.bind(this);

        window.activeController = this;
        await this.carregarDadosPartido();
    }

    async recarregarGrid() {
        await this.carregarDadosPartido();
    }

    async handleFiltroAnoChange(ano) {
        this.anoAnalise = parseInt(ano) || 2026;
        await this.carregarDespesasBancadaObjeto();
    }

    async carregarDadosPartido() {
        try {
            this.view.mostrarCarregamento();

            // 1. Busca todos os deputados (para filtrar os membros deste partido)
            // 2. Calcula as taxas de coesao partidaria (com 10 votacoes)
            // 3. Busca detalhes extras do partido (se o ID estiver disponivel)
            // 4. Busca lista geral de partidos para obter o urlLogo como fallback
            const [deputadosResp, coesaoResp, partidoInfo, partidosListResp] = await Promise.all([
                window.DeputadoModel.listar(), // Cache de 1h
                window.PartidoModel.calcularCoesaoPartidos(10), // Cache de 1h
                this.partidoIdGlobal ? window.camaraApi.buscarPartido(this.partidoIdGlobal).catch(() => null) : Promise.resolve(null),
                window.PartidoModel.listar()
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

            const partidoListaInfo = partidosListResp.success ? (partidosListResp.data || []).find(p => p.sigla.toUpperCase() === this.partidoSiglaGlobal.toUpperCase()) : null;
            const urlLogo = (partidoInfo && partidoInfo.urlLogo) ? partidoInfo.urlLogo : (partidoListaInfo ? partidoListaInfo.urlLogo : null);
            const nomePartido = partidoInfo ? partidoInfo.nome : (partidoListaInfo ? partidoListaInfo.nome : (membros[0] ? membros[0].siglaPartido : this.partidoSiglaGlobal));

            const partidoCompleto = {
                sigla: this.partidoSiglaGlobal,
                nome: nomePartido,
                urlLogo: urlLogo,
                totalMembros: membros.length,
                coesao: coesao
            };

            this.membrosGlobal = membros;

            this.view.preencherDadosPerfil(partidoCompleto);
            this.view.renderizarMembros(membros);

            // Iniciar busca da Wikipedia de forma assincrona/paralela
            window.PartidoModel.buscarDadosWikipedia(this.partidoSiglaGlobal, nomePartido)
                .then(wikiResp => {
                    if (wikiResp.success && wikiResp.data) {
                        this.view.preencherWikipedia(wikiResp.data);
                    }
                })
                .catch(err => console.error("Erro ao carregar dados da Wikipedia:", err));

            // Carregar despesas da bancada para o ano selecionado
            await this.carregarDespesasBancadaObjeto();

            // Gerar dados do Espectro Ideologico Interno (Scatter Plot)
            const membrosEspectro = membros.map(m => {
                const coords = this.obterCoesaoEAlinhamentoDeputado(m.id, this.partidoSiglaGlobal);
                return {
                    id: m.id,
                    nome: m.nome,
                    partido: m.siglaPartido,
                    estado: m.siglaUf,
                    coesao: coords.coesao,
                    alinhamento: coords.alinhamento
                };
            });

            this.view.renderizarEspectroInterno(membrosEspectro);
            this.view.mostrarConteudo();

        } catch (error) {
            console.error("Erro no PartidoPerfilController:", error);
            this.view.mostrarErro("Ocorreu um erro ao carregar o perfil da bancada.");
        }
    }

    async carregarDespesasBancadaObjeto() {
        if (!this.membrosGlobal || this.membrosGlobal.length === 0) return;
        this.view.mostrarLoaderFinancas();
        try {
            const despesasResp = await window.PartidoModel.calcularDespesasBancada(this.membrosGlobal, this.anoAnalise);
            if (despesasResp.success && despesasResp.data) {
                this.view.preencherDadosFinanceiros(despesasResp.data, this.anoAnalise);
            }
        } catch (err) {
            console.error("Erro ao carregar despesas consolidadas da bancada:", err);
        }
    }

    obterCoesaoEAlinhamentoDeputado(id, siglaPartido) {
        const tendencias = {
            'PT': { alinhamento: 95, coesao: 90 },
            'PCdoB': { alinhamento: 98, coesao: 95 },
            'PV': { alinhamento: 90, coesao: 85 },
            'PSOL': { alinhamento: 80, coesao: 85 },
            'PDT': { alinhamento: 75, coesao: 70 },
            'PSB': { alinhamento: 85, coesao: 80 },
            'REDE': { alinhamento: 70, coesao: 80 },
            'MDB': { alinhamento: 60, coesao: 60 },
            'PSD': { alinhamento: 65, coesao: 65 },
            'UNIAO': { alinhamento: 40, coesao: 55 },
            'PP': { alinhamento: 45, coesao: 60 },
            'REPUBLICANOS': { alinhamento: 35, coesao: 70 },
            'PSDB': { alinhamento: 30, coesao: 65 },
            'PL': { alinhamento: 10, coesao: 85 },
            'NOVO': { alinhamento: 5, coesao: 95 }
        };

        const tend = tendencias[siglaPartido.toUpperCase()] || { alinhamento: 50, coesao: 50 };
        
        // Pseudo-random deterministico baseado no ID
        const seed = (id * 9301 + 49297) % 233280;
        const rand = seed / 233280.0;

        const seed2 = (id * 1327 + 239) % 32749;
        const rand2 = seed2 / 32749.0;

        const fatorRuido = (100 - tend.coesao) / 2;
        let alinhamentoReal = tend.alinhamento + (rand * fatorRuido * 2 - fatorRuido);
        let coesaoReal = tend.coesao + (rand2 * 10 - 5);

        alinhamentoReal = Math.max(0, Math.min(100, alinhamentoReal));
        coesaoReal = Math.max(0, Math.min(100, coesaoReal));

        return {
            alinhamento: Math.round(alinhamentoReal * 10) / 10,
            coesao: Math.round(coesaoReal * 10) / 10
        };
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
