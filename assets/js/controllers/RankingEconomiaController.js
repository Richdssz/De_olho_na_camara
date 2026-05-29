/**
 * Controller do Ranking de Economia (ranking-economia.html)
 * Calcula consolidado da cota CEAP por deputado e ordena de forma crescente (mais econômico primeiro).
 */
class RankingEconomiaController {
    constructor() {
        this.view = new window.RankingEconomiaView();
        
        this.todosDeputados = [];
        this.rankingCalculado = [];
        this.rankingFiltrado = [];
        
        this.anoAtual = 2026;
        this.partidoFiltro = '';
        this.ufFiltro = '';
        
        this.paginaAtual = 1;
        this.itensPorPagina = 10;
    }

    async init() {
        this.view.configurarFiltros(
            this.handleFiltroAlterado.bind(this),
            this.handlePaginaAlterada.bind(this)
        );

        // Restaurar estado salvo se houver
        const savedState = localStorage.getItem('ranking_economia_state');
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                this.anoAtual = parsed.ano || 2026;
                this.partidoFiltro = parsed.partido || '';
                this.ufFiltro = parsed.uf || '';
                this.paginaAtual = parsed.page || 1;

                if (this.view.filtroAno) this.view.filtroAno.value = this.anoAtual;
                if (this.view.filtroPartido) this.view.filtroPartido.value = this.partidoFiltro;
                if (this.view.filtroUf) this.view.filtroUf.value = this.ufFiltro;
            } catch (e) {
                console.error("Erro ao carregar ranking_economia_state:", e);
            }
        }

        this.view.mostrarCarregamento();
        await this.carregarDadosIniciais();
    }

    async carregarDadosIniciais() {
        try {
            // 1. Obter todos deputados ativos (57ª Legislatura)
            const listResp = await window.DeputadoModel.listarTodos();
            if (!listResp || listResp.length === 0) {
                console.error("RankingEconomiaController: Sem lista de deputados");
                this.todosDeputados = [];
            } else {
                this.todosDeputados = listResp;
            }

            // Preencher dropdown de partidos
            const partidos = [...new Set(this.todosDeputados.map(d => d.siglaPartido).filter(Boolean))].sort();
            this.view.preencherPartidos(partidos);

            // 2. Calcular ranking para o ano padrão/restaurado
            await this.calcularRanking(this.anoAtual);

        } catch (error) {
            console.error("RankingEconomiaController: erro init", error);
            this.view.mostrarCarregamento();
        }
    }

    /**
     * Calcula as despesas totais de todos os deputados ativos em lotes para evitar rate limiting.
     * Utiliza cache consolidado no localStorage de 2h.
     */
    async calcularRanking(ano) {
        this.view.mostrarCarregamento();

        const cacheKey = `ranking_economia_consolidado_${ano}`;
        const cached = window.CacheService ? window.CacheService.getLocal(cacheKey) : null;
        if (cached && Array.isArray(cached) && cached.length > 0) {
            console.log(`[RankingEconomiaController] Carregado ranking do cache para o ano ${ano}`);
            this.rankingCalculado = cached;
            this.aplicarFiltrosEExibir(true);
            return;
        }

        const deputadosAnalise = this.todosDeputados;
        const totalDeputados = deputadosAnalise.length;
        this.rankingCalculado = [];

        if (totalDeputados === 0) {
            this.aplicarFiltrosEExibir(true);
            return;
        }

        try {
            const chunkSize = 15;
            const delayMs = 120;

            for (let i = 0; i < totalDeputados; i += chunkSize) {
                const chunk = deputadosAnalise.slice(i, i + chunkSize);
                this.view.atualizarProgresso(i, totalDeputados);

                const promessas = chunk.map(dep => 
                    window.DeputadoModel.buscarDespesas(dep.id, ano)
                        .then(res => {
                            const despesas = res.success ? (res.data || []) : [];
                            const total = despesas.reduce((acc, d) => acc + (d.valorLiquido || d.valorDocumento || 0), 0);
                            return {
                                id: dep.id,
                                nome: dep.nome,
                                siglaPartido: dep.siglaPartido,
                                siglaUf: dep.siglaUf,
                                urlFoto: dep.urlFoto,
                                totalGasto: total
                            };
                        })
                        .catch(() => ({
                            id: dep.id,
                            nome: dep.nome,
                            siglaPartido: dep.siglaPartido,
                            siglaUf: dep.siglaUf,
                            urlFoto: dep.urlFoto,
                            totalGasto: 0
                        }))
                );

                const chunkResultados = await Promise.all(promessas);
                this.rankingCalculado.push(...chunkResultados);

                if (i + chunkSize < totalDeputados) {
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                }
            }

            // Exibir 100% completo
            this.view.atualizarProgresso(totalDeputados, totalDeputados);

            // Ordena crescentemente pelo total de despesas (menor gasto = mais econômico)
            this.rankingCalculado.sort((a, b) => a.totalGasto - b.totalGasto);

            // Cache consolidado por 2 horas (120 minutos)
            if (window.CacheService && this.rankingCalculado.length > 0) {
                window.CacheService.setLocal(cacheKey, this.rankingCalculado, 120);
            }

            this.aplicarFiltrosEExibir(true);

        } catch (err) {
            console.error("Erro ao calcular despesas consolidado do ranking:", err);
            this.view.mostrarConteudo();
        }
    }

    salvarEstado() {
        const state = {
            ano: this.anoAtual,
            partido: this.partidoFiltro,
            uf: this.ufFiltro,
            page: this.paginaAtual
        };
        localStorage.setItem('ranking_economia_state', JSON.stringify(state));
    }

    aplicarFiltrosEExibir(isInitial = false) {
        this.rankingFiltrado = this.rankingCalculado.filter(d => {
            const matchesPartido = !this.partidoFiltro || d.siglaPartido === this.partidoFiltro;
            const matchesUf = !this.ufFiltro || d.siglaUf === this.ufFiltro;
            return matchesPartido && matchesUf;
        });

        if (!isInitial) {
            this.paginaAtual = 1;
        }
        this.renderizarResultados();
        this.salvarEstado();
    }

    renderizarResultados() {
        // Top 3 do ranking filtrado
        const top3 = this.rankingFiltrado.slice(0, 3);
        this.view.renderizarPodio(top3);

        // Listagem da tabela (com paginação)
        const totalItens = this.rankingFiltrado.length;
        const totalPaginas = Math.ceil(totalItens / this.itensPorPagina) || 1;

        if (this.paginaAtual > totalPaginas) {
            this.paginaAtual = 1;
        }

        const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
        const fim = Math.min(inicio + this.itensPorPagina, totalItens);
        const itensPagina = this.rankingFiltrado.slice(inicio, fim);

        this.view.renderizarTabela(itensPagina, inicio);
        this.view.atualizarPaginacao(totalItens, this.paginaAtual, totalPaginas, this.itensPorPagina);
        this.view.mostrarConteudo();
    }

    async handleFiltroAlterado(filtros) {
        this.partidoFiltro = filtros.partido;
        this.ufFiltro = filtros.uf;

        if (filtros.ano !== this.anoAtual) {
            this.anoAtual = filtros.ano;
            await this.calcularRanking(this.anoAtual);
        } else {
            this.aplicarFiltrosEExibir();
        }
    }

    handlePaginaAlterada(direcao) {
        const totalItens = this.rankingFiltrado.length;
        const totalPaginas = Math.ceil(totalItens / this.itensPorPagina) || 1;
        const novaPagina = this.paginaAtual + direcao;

        if (novaPagina >= 1 && novaPagina <= totalPaginas) {
            this.paginaAtual = novaPagina;
            this.renderizarResultados();
            this.salvarEstado();
        }
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('ranking-table-body')) {
        const controller = new RankingEconomiaController();
        controller.init();
    }
});

window.RankingEconomiaController = RankingEconomiaController;
