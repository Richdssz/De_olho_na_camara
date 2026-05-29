/**
 * Controller da Lista de Deputados (deputados.html)
 */
class DeputadosController {
    constructor() {
        this.view = new window.DeputadosView();
        
        this.todosDeputados = [];
        this.deputadosFiltrados = [];
        this.monitoradosIds = [];
        
        this.paginaAtual = 1;
        this.itensPorPagina = 30;
    }

    async init() {
        // Registra o controller ativo globalmente
        window.activeController = this;

        // Registra os eventos na View
        this.view.onFiltrar(this.aplicarFiltrosESort.bind(this));
        this.view.onPaginar(this.mudarPagina.bind(this));
        this.view.onAcompanharClick(this.handleAcompanhar.bind(this));
        this.view.onAvaliarClick(this.handleAvaliar.bind(this));

        this.view.mostrarLoader();
        await this.carregarDadosIniciais();
    }

    async carregarDadosIniciais() {
        try {
            // Busca IDs monitorados
            if (window.Back4AppService && window.Back4AppService.getCurrentUser()) {
                const radarResp = await window.MonitoramentoModel.listarMonitorados();
                if (radarResp.success) {
                    this.monitoradosIds = radarResp.data;
                }
            }

            // Busca todos deputados
            const response = await window.DeputadoModel.listar({ itens: 600 });
            if (!response.success) {
                console.error("DeputadosController: falha ao carregar lista do DeputadoModel", response.error);
                this.view.mostrarErro(response.error || "Falha ao carregar os dados.");
                return;
            }

            this.todosDeputados = response.data || [];
            this.view.preencherFiltroPartidos(this.todosDeputados);

            // Carregar filtros da URL ou do localStorage
            const urlParams = new URLSearchParams(window.location.search);
            let nome = '';
            let uf = '';
            let partido = '';
            let ordem = 'nome';
            let page = 1;

            const hasUrlParams = urlParams.has('nome') || urlParams.has('uf') || urlParams.has('partido') || urlParams.has('ordem') || urlParams.has('page');
            if (hasUrlParams) {
                nome = urlParams.get('nome') || '';
                uf = urlParams.get('uf') || '';
                partido = urlParams.get('partido') || '';
                ordem = urlParams.get('ordem') || 'nome';
                page = parseInt(urlParams.get('page')) || 1;
            } else {
                const savedState = localStorage.getItem('deputados_state');
                if (savedState) {
                    try {
                        const parsed = JSON.parse(savedState);
                        if (parsed && typeof parsed === 'object') {
                            nome = (parsed.nome && typeof parsed.nome === 'string') ? parsed.nome.trim() : '';
                            uf = (parsed.uf && typeof parsed.uf === 'string') ? parsed.uf.trim() : '';
                            partido = (parsed.partido && typeof parsed.partido === 'string') ? parsed.partido.trim() : '';
                            ordem = (parsed.ordem && ['nome', 'siglaPartido', 'siglaUf'].includes(parsed.ordem)) ? parsed.ordem : 'nome';
                            page = Number.isFinite(parseInt(parsed.page)) && parseInt(parsed.page) > 0 ? parseInt(parsed.page) : 1;
                        }
                    } catch (e) {
                        console.error("DeputadosController: erro ao restaurar estado do localStorage, limpando:", e);
                        localStorage.removeItem('deputados_state');
                    }
                }
            }

            this.view.setFiltros({ nome, uf, partido, ordem });
            this.paginaAtual = page;

            this.aplicarFiltrosESort(true);

        } catch (error) {
            console.error("DeputadosController: erro inesperado em carregarDadosIniciais", error);
            this.view.mostrarErro(error.message || "Erro inesperado ao carregar.");
        }
    }

    aplicarFiltrosESort(isInitial = false) {
        const filtros = this.view.getFiltros();

        // Salvar filtros nos parâmetros da URL
        const urlParams = new URLSearchParams(window.location.search);
        if (filtros.nome) urlParams.set('nome', filtros.nome); else urlParams.delete('nome');
        if (filtros.uf) urlParams.set('uf', filtros.uf); else urlParams.delete('uf');
        if (filtros.partido) urlParams.set('partido', filtros.partido); else urlParams.delete('partido');
        if (filtros.ordem) urlParams.set('ordem', filtros.ordem); else urlParams.delete('ordem');

        this.deputadosFiltrados = this.todosDeputados.filter(d => {
            const nomeStatus = (d.nome || '').toLowerCase();
            const matchesNome = nomeStatus.includes(filtros.nome);
            const matchesUf = filtros.uf === '' || d.siglaUf === filtros.uf;
            const matchesPartido = filtros.partido === '' || d.siglaPartido === filtros.partido;
            return matchesNome && matchesUf && matchesPartido;
        });

        this.deputadosFiltrados.sort((a, b) => {
            if (filtros.ordem === 'siglaPartido') {
                const pCompare = (a.siglaPartido || '').localeCompare(b.siglaPartido || '');
                if (pCompare !== 0) return pCompare;
                return (a.nome || '').localeCompare(b.nome || '');
            }
            if (filtros.ordem === 'siglaUf') {
                const ufCompare = (a.siglaUf || '').localeCompare(b.siglaUf || '');
                if (ufCompare !== 0) return ufCompare;
                return (a.nome || '').localeCompare(b.nome || '');
            }
            return (a.nome || '').localeCompare(b.nome || '');
        });

        if (!isInitial) {
            this.paginaAtual = 1;
        }

        const totalPaginas = Math.ceil(this.deputadosFiltrados.length / this.itensPorPagina) || 1;
        if (this.paginaAtual > totalPaginas) {
            this.paginaAtual = 1;
        }

        urlParams.set('page', this.paginaAtual);
        try {
            window.history.replaceState(null, '', window.location.pathname + '?' + urlParams.toString());
        } catch (e) {
            console.warn("Nao foi possivel atualizar a URL via history API:", e);
        }

        // Salvar estado no localStorage
        const state = {
            nome: filtros.nome,
            uf: filtros.uf,
            partido: filtros.partido,
            ordem: filtros.ordem,
            page: this.paginaAtual
        };
        localStorage.setItem('deputados_state', JSON.stringify(state));

        this.renderizarPaginaAtual();
    }

    async renderizarPaginaAtual() {
        if (this.deputadosFiltrados.length === 0) {
            this.view.mostrarVazio();
            this.view.atualizarPaginacaoInfo(0, 1, 1, this.itensPorPagina);
            return;
        }

        const indexInicio = (this.paginaAtual - 1) * this.itensPorPagina;
        const indexFim = Math.min(indexInicio + this.itensPorPagina, this.deputadosFiltrados.length);
        const deputadosPagina = this.deputadosFiltrados.slice(indexInicio, indexFim);

        // Renderiza o grid IMEDIATAMENTE (sem esperar ratings do Back4App)
        this.view.renderizarGrid(deputadosPagina, this.monitoradosIds, {});

        const totalPaginas = Math.ceil(this.deputadosFiltrados.length / this.itensPorPagina) || 1;
        this.view.atualizarPaginacaoInfo(this.deputadosFiltrados.length, this.paginaAtual, totalPaginas, this.itensPorPagina);

        // Busca ratings em segundo plano e atualiza o grid quando disponível
        this._carregarRatingsGrid(deputadosPagina);
    }

    async _carregarRatingsGrid(deputadosPagina) {
        const ratingsMap = {};
        try {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Timeout ao buscar avaliações")), 8000)
            );
            const fetchPromise = window.Back4AppService
                ? window.Back4AppService.getPublicAll("Avaliacao", {}).catch(() => [])
                : Promise.resolve([]);

            const avaliacoesResp = await Promise.race([fetchPromise, timeoutPromise]).catch(() => []);
            if (!Array.isArray(avaliacoesResp)) {
                throw new Error("Resposta de avaliações não é um array");
            }
            avaliacoesResp.forEach(item => {
                const depId = item.get("deputadoId");
                const nota = item.get("nota") || 0;
                if (!ratingsMap[depId]) {
                    ratingsMap[depId] = { total: 0, count: 0 };
                }
                ratingsMap[depId].total += nota;
                ratingsMap[depId].count++;
            });
            Object.keys(ratingsMap).forEach(id => {
                ratingsMap[id] = ratingsMap[id].total / ratingsMap[id].count;
            });
        } catch (err) {
            console.error("Erro ao obter notas medias:", err);
        }

        // Re-renderiza o grid com as notas (se houver alguma)
        if (Object.keys(ratingsMap).length > 0) {
            this.view.renderizarGrid(deputadosPagina, this.monitoradosIds, ratingsMap);
        }
    }

    mudarPagina(direcao) {
        const totalPaginas = Math.ceil(this.deputadosFiltrados.length / this.itensPorPagina);
        const novaPagina = this.paginaAtual + direcao;

        if (novaPagina >= 1 && novaPagina <= totalPaginas) {
            this.paginaAtual = novaPagina;
            
            const urlParams = new URLSearchParams(window.location.search);
            urlParams.set('page', this.paginaAtual);
            try {
                window.history.replaceState(null, '', window.location.pathname + '?' + urlParams.toString());
            } catch (e) {
                console.warn("Nao foi possivel atualizar a URL via history API:", e);
            }

            // Salvar estado no localStorage
            const filtros = this.view.getFiltros();
            const state = {
                nome: filtros.nome,
                uf: filtros.uf,
                partido: filtros.partido,
                ordem: filtros.ordem,
                page: this.paginaAtual
            };
            localStorage.setItem('deputados_state', JSON.stringify(state));

            this.renderizarPaginaAtual();
            this.view.scrollParaTopo();
        }
    }

    async handleAcompanhar(deputadoId, nomeDeputado, btnElement) {
        if (!window.Back4AppService.getCurrentUser()) {
            const authModal = document.getElementById('auth-modal');
            if (authModal) authModal.classList.remove('hidden');
            else alert("Acesse sua conta para utilizar o monitoramento!");
            return;
        }

        btnElement.disabled = true;
        try {
            const resp = await window.MonitoramentoModel.alternarRadar(deputadoId, nomeDeputado);
            if (resp.success) {
                this.view.atualizarBotaoRadar(btnElement, resp.data.action);
                if (resp.data.action === 'added') {
                    this.monitoradosIds.push(deputadoId);
                } else {
                    this.monitoradosIds = this.monitoradosIds.filter(id => id !== deputadoId);
                }
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
            else alert("Acesse sua conta para avaliar os parlamentares!");
            return;
        }

        if (typeof window.abrirModalAvaliacao === 'function') {
            window.abrirModalAvaliacao(deputadoId, nomeDeputado);
        }
    }
}

window.DeputadosController = DeputadosController;

document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('deputados-grid')) return;

    try {
        const controller = new DeputadosController();
        controller.init().catch(err => {
            console.error("DeputadosController: falha critica na inicializacao:", err);
            const grid = document.getElementById('deputados-grid');
            if (grid) {
                grid.innerHTML = '<p class="text-red-500 col-span-full text-center py-20 font-medium">Erro inesperado ao inicializar a pagina. Recarregue ou tente novamente.</p>';
            }
        });
    } catch (err) {
        console.error("DeputadosController: erro sincrono na construcao:", err);
    }
});
