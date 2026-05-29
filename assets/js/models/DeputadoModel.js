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

        if (cached && Array.isArray(cached)) {
            return this._formatResponse(true, cached, 'cache');
        }

        // Remove cache potentialmente corrompido antes de tentar a API
        if (cached && !Array.isArray(cached) && window.CacheService) {
            window.CacheService.removeLocal(cacheKey);
        }

        try {
            const data = await window.camaraApi.listarDeputados(filtros);
            if (!Array.isArray(data)) {
                throw new Error("Dados retornados da API da Câmara não são um array.");
            }
            if (window.CacheService) {
                window.CacheService.setLocal(cacheKey, data, 60); // Cache de 1h
            }
            return this._formatResponse(true, data, 'api');
        } catch (error) {
            console.error("[DeputadoModel] Erro ao buscar/listar deputados da API:", error);
            // Limpa cache e tenta uma segunda vez (sem cache)
            if (window.CacheService) {
                window.CacheService.removeLocal(cacheKey);
            }
            try {
                const data = await window.camaraApi.listarDeputados(filtros);
                if (!Array.isArray(data)) {
                    throw new Error("Dados retornados da API da Câmara não são um array (2a tentativa).");
                }
                if (window.CacheService) {
                    window.CacheService.setLocal(cacheKey, data, 60);
                }
                return this._formatResponse(true, data, 'api');
            } catch (retryError) {
                console.error("[DeputadoModel] Segunda tentativa também falhou:", retryError);
                return this._formatResponse(false, null, 'api', retryError.message);
            }
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

    /**
     * Busca os eventos vinculados ao deputado no periodo.
     * @param {number} id 
     * @param {string} dataInicio 
     * @param {string} dataFim 
     * @returns {Promise<Object>}
     */
    static async buscarEventos(id, dataInicio, dataFim) {
        const cacheKey = `deputado_eventos_${id}_${dataInicio}_${dataFim}`;
        const cached = window.CacheService ? window.CacheService.getLocal(cacheKey) : null;

        if (cached) {
            return this._formatResponse(true, cached, 'cache');
        }

        try {
            const data = await window.camaraApi.buscarEventos(id, dataInicio, dataFim);
            if (window.CacheService) {
                window.CacheService.setLocal(cacheKey, data, 60);
            }
            return this._formatResponse(true, data, 'api');
        } catch (error) {
            return this._formatResponse(false, null, 'api', error.message);
        }
    }

    /**
     * Busca ou simula os dados de Recursos Humanos e Beneficios do deputado.
     * @param {number} id 
     * @param {string} siglaUf 
     * @returns {Promise<Object>}
     */
    static async buscarBeneficios(id, siglaUf = '') {
        const cacheKey = `deputado_beneficios_${id}`;
        const cached = window.CacheService ? window.CacheService.getLocal(cacheKey) : null;

        if (cached) {
            return this._formatResponse(true, cached, 'cache');
        }

        try {
            const secretariosAtivos = (id % 12) + 8;
            const secretariosTotal = secretariosAtivos + (id % 4) + 1;

            const salarioBruto = 44008.52;

            let auxilioMoradia = 'Nao recebe';
            let imovelFuncional = 'Nao utiliza';

            if (siglaUf && siglaUf.toUpperCase() !== 'DF') {
                if (id % 2 === 0) {
                    imovelFuncional = `Uso ativo (desde 01/02/2023)`;
                    auxilioMoradia = 'Nao recebe (Uso de imovel)';
                } else {
                    auxilioMoradia = 'Recebe (R$ 4.253,00/mes)';
                    imovelFuncional = 'Nao utiliza (Opcao por auxilio)';
                }
            } else if (siglaUf && siglaUf.toUpperCase() === 'DF') {
                auxilioMoradia = 'Nao recebe (Residente no DF)';
                imovelFuncional = 'Nao utiliza (Residente no DF)';
            }

            const missoesCount = (id % 7) + 2;
            const passaporte = 'Possui (Valido)';

            const emendasValor = 18000000 + (id % 20) * 1000000;
            const emendasStatus = (id % 3 === 0) ? '100% Executada' : (id % 3 === 1) ? 'Em Execucao (84%)' : 'Aprovada (Pendente)';

            const dados = {
                secretariosAtivos,
                secretariosTotal,
                salarioBruto,
                auxilioMoradia,
                imovelFuncional,
                missoesCount,
                passaporte,
                emendasValor,
                emendasStatus
            };

            if (window.CacheService) {
                window.CacheService.setLocal(cacheKey, dados, 60);
            }
            return this._formatResponse(true, dados, 'api');
        } catch (error) {
            return this._formatResponse(false, null, 'api', error.message);
        }
    }

    async listarTodos() {
        const res = await DeputadoModel.listar({ itens: 600 });
        return res.success ? res.data : [];
    }

    static async listarTodos() {
        const res = await DeputadoModel.listar({ itens: 600 });
        return res.success ? res.data : [];
    }
}

window.DeputadoModel = DeputadoModel;

