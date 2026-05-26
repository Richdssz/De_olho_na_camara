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
                this.view.mostrarErro();
                return;
            }

            this.todosDeputados = response.data;
            this.view.preencherFiltroPartidos(this.todosDeputados);
            
            // Carregar filtros da URL se existirem
            const urlParams = new URLSearchParams(window.location.search);
            const nome = urlParams.get('nome') || '';
            const uf = urlParams.get('uf') || '';
            const partido = urlParams.get('partido') || '';
            const ordem = urlParams.get('ordem') || 'nome';
            const page = parseInt(urlParams.get('page')) || 1;

            this.view.setFiltros({ nome, uf, partido, ordem });
            this.paginaAtual = page;

            this.aplicarFiltrosESort(true);

        } catch (error) {
            console.error("DeputadosController: erro", error);
            this.view.mostrarErro();
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
        window.history.replaceState(null, '', window.location.pathname + '?' + urlParams.toString());

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

        const ratingsMap = {};
        try {
            const avaliacoesResp = await window.Back4AppService.getPublicAll("Avaliacao", {}).catch(() => []);
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
            console.error("Erro ao obter notas médias:", err);
        }

        this.view.renderizarGrid(deputadosPagina, this.monitoradosIds, ratingsMap);
        
        const totalPaginas = Math.ceil(this.deputadosFiltrados.length / this.itensPorPagina) || 1;
        this.view.atualizarPaginacaoInfo(this.deputadosFiltrados.length, this.paginaAtual, totalPaginas, this.itensPorPagina);
    }

    mudarPagina(direcao) {
        const totalPaginas = Math.ceil(this.deputadosFiltrados.length / this.itensPorPagina);
        const novaPagina = this.paginaAtual + direcao;

        if (novaPagina >= 1 && novaPagina <= totalPaginas) {
            this.paginaAtual = novaPagina;
            
            const urlParams = new URLSearchParams(window.location.search);
            urlParams.set('page', this.paginaAtual);
            window.history.replaceState(null, '', window.location.pathname + '?' + urlParams.toString());

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
    // Apenas se estivermos na página de deputados
    if (document.getElementById('deputados-grid')) {
        const controller = new DeputadosController();
        controller.init();
    }
});
