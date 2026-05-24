/**
 * Serviço de Integração com a API de Dados Abertos da Câmara dos Deputados.
 * Oferece métodos utilitários para buscar informações sobre deputados, despesas, votações e eventos.
 */
class CamaraApiService {
    constructor() {
        this.baseUrl = 'https://dadosabertos.camara.leg.br/api/v2';
    }

    /**
     * Helper genérico para requisições HTTP GET.
     */
    async _fetch(endpoint, params = {}) {
        const queryParams = new URLSearchParams({
            formato: 'json',
            ...params
        });
        const url = `${this.baseUrl}${endpoint}?${queryParams.toString()}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Erro na requisição à API da Câmara (${response.status}): ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`❌ Erro no fetch para ${url}:`, error);
            throw error;
        }
    }

    /**
     * Busca dados cadastrais e status do mandato de um deputado específico.
     */
    async buscarDeputado(id) {
        const response = await this._fetch(`/deputados/${id}`);
        return response.dados;
    }

    /**
     * Busca as despesas de cota parlamentar (CEAP) de um deputado para um ano específico.
     */
    async buscarDespesas(id, ano) {
        // Coleta o máximo de registros possível
        const response = await this._fetch(`/deputados/${id}/despesas`, {
            ano: ano,
            itens: 100,
            ordem: 'ASC',
            ordenarPor: 'ano'
        });
        return response.dados || [];
    }

    /**
     * Busca todos os eventos associados ao deputado dentro de um intervalo de datas.
     */
    async buscarEventos(id, dataInicio, dataFim) {
        const response = await this._fetch(`/deputados/${id}/eventos`, {
            dataInicio: dataInicio,
            dataFim: dataFim,
            itens: 100
        });
        return response.dados || [];
    }

    /**
     * Busca as proposições das quais o deputado é autor.
     */
    async buscarProposicoesAutor(idDeputadoAutor) {
        const response = await this._fetch('/proposicoes', {
            idDeputadoAutor: idDeputadoAutor,
            itens: 100
        });
        return response.dados || [];
    }

    /**
     * Busca as votações recentes da Câmara.
     */
    async buscarVotacoesRecentes(itens = 20) {
        const response = await this._fetch('/votacoes', {
            ordem: 'DESC',
            ordenarPor: 'dataHoraRegistro',
            itens: itens
        });
        return response.dados || [];
    }

    /**
     * Busca os votos nominais de uma votação específica.
     */
    async buscarVotosVotacao(votacaoId) {
        try {
            const response = await this._fetch(`/votacoes/${votacaoId}/votos`);
            return response.dados || [];
        } catch (err) {
            // Em caso de votação simbólica ou erro, retorna array vazio
            console.warn(`Aviso ao buscar votos da votação ${votacaoId}:`, err.message);
            return [];
        }
    }

    /**
     * Busca as orientações de bancada/partido de uma votação específica.
     */
    async buscarOrientacoesVotacao(votacaoId) {
        try {
            const response = await this._fetch(`/votacoes/${votacaoId}/orientacoes`);
            return response.dados || [];
        } catch (err) {
            console.warn(`Aviso ao buscar orientações da votação ${votacaoId}:`, err.message);
            return [];
        }
    }

    /**
     * Busca a lista geral de deputados ativos.
     */
    async listarDeputados(params = {}) {
        const response = await this._fetch('/deputados', {
            ordem: 'ASC',
            ordenarPor: 'nome',
            ...params
        });
        return response.dados || [];
    }

    /**
     * Busca a lista geral de partidos políticos ativos.
     */
    async listarPartidos(params = {}) {
        const response = await this._fetch('/partidos', {
            ordem: 'ASC',
            ordenarPor: 'sigla',
            ...params
        });
        return response.dados || [];
    }

    /**
     * Busca os detalhes de um partido específico pelo seu ID.
     */
    async buscarPartido(id) {
        const response = await this._fetch(`/partidos/${id}`);
        return response.dados;
    }

    /**
     * Busca a lista dos parlamentares de um partido durante um período.
     */
    async buscarMembrosPartido(id, params = {}) {
        const response = await this._fetch(`/partidos/${id}/membros`, {
            ...params
        });
        return response.dados || [];
    }
}

// Expõe globalmente
window.camaraApi = new CamaraApiService();
