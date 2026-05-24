/**
 * Model de Deputados
 * Responsável por buscar e formatar dados dos deputados da API da Câmara.
 * Não manipula DOM. Sempre retorna { success, data, source, timestamp, error }.
 */
class DeputadoModel {
    /**
     * Formata a resposta padrão do Model.
     */
    static _formatResponse(success, data = null, source = 'api', error = null) {
        return {
            success,
            data,
            source,
            timestamp: new Date(),
            error
        };
    }

    /**
     * Lista deputados com filtros opcionais (com cache).
     * @param {Object} filtros 
     * @returns {Promise<Object>}
     */
    static async listar(filtros = {}) {
        const cacheKey = `deputados_lista_${JSON.stringify(filtros)}`;
        const cached = window.CacheService ? window.CacheService.getLocal(cacheKey) : null;
        
        if (cached) {
            return this._formatResponse(true, cached, 'cache');
        }

        try {
            const data = await window.camaraApi.listarDeputados(filtros);
            if (window.CacheService) {
                window.CacheService.setLocal(cacheKey, data, 60); // Cache de 1h
            }
            return this._formatResponse(true, data, 'api');
        } catch (error) {
            return this._formatResponse(false, null, 'api', error.message);
        }
    }

    /**
     * Busca os detalhes de um deputado específico.
     * @param {number} id 
     * @returns {Promise<Object>}
     */
    static async buscarDetalhes(id) {
        const cacheKey = `deputado_detalhe_${id}`;
        const cached = window.CacheService ? window.CacheService.getLocal(cacheKey) : null;

        if (cached) {
            return this._formatResponse(true, cached, 'cache');
        }

        try {
            const data = await window.camaraApi.buscarDeputado(id);
            if (window.CacheService) {
                window.CacheService.setLocal(cacheKey, data, 60);
            }
            return this._formatResponse(true, data, 'api');
        } catch (error) {
            return this._formatResponse(false, null, 'api', error.message);
        }
    }

    /**
     * Busca as despesas de um deputado para um ano específico.
     * @param {number} id 
     * @param {number} ano 
     * @returns {Promise<Object>}
     */
    static async buscarDespesas(id, ano) {
        const cacheKey = `deputado_despesas_${id}_${ano}`;
        const cached = window.CacheService ? window.CacheService.getLocal(cacheKey) : null;

        if (cached) {
            return this._formatResponse(true, cached, 'cache');
        }

        try {
            const data = await window.camaraApi.buscarDespesas(id, ano);
            if (window.CacheService) {
                window.CacheService.setLocal(cacheKey, data, 60);
            }
            return this._formatResponse(true, data, 'api');
        } catch (error) {
            return this._formatResponse(false, null, 'api', error.message);
        }
    }

    /**
     * Busca proposições das quais o deputado é autor.
     * @param {number} id 
     * @returns {Promise<Object>}
     */
    static async buscarProposicoes(id) {
        const cacheKey = `deputado_proposicoes_${id}`;
        const cached = window.CacheService ? window.CacheService.getLocal(cacheKey) : null;

        if (cached) {
            return this._formatResponse(true, cached, 'cache');
        }

        try {
            const data = await window.camaraApi.buscarProposicoesAutor(id);
            if (window.CacheService) {
                window.CacheService.setLocal(cacheKey, data, 60);
            }
            return this._formatResponse(true, data, 'api');
        } catch (error) {
            return this._formatResponse(false, null, 'api', error.message);
        }
    }
}

window.DeputadoModel = DeputadoModel;
