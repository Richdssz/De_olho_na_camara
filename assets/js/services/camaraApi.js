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
    async buscarDespesas(id, ano, mes = null) {
        // Coleta o maximo de registros possivel
        const params = {
            ano: ano,
            itens: 100,
            ordem: 'ASC',
            ordenarPor: 'ano'
        };
        if (mes) {
            params.mes = mes;
        }
        const response = await this._fetch(`/deputados/${id}/despesas`, params);
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
        const dados = response.dados || [];
        
        const links = response.links || [];
        const lastLinkObj = links.find(l => l.rel === 'last');
        
        if (lastLinkObj) {
            try {
                const lastUrl = new URL(lastLinkObj.href);
                const lastPage = parseInt(lastUrl.searchParams.get('pagina')) || 1;
                
                if (lastPage > 1) {
                    const lastPageResp = await this._fetch('/proposicoes', {
                        idDeputadoAutor: idDeputadoAutor,
                        itens: 100,
                        pagina: lastPage
                    });
                    const lastPageDados = lastPageResp.dados || [];
                    const totalReal = (lastPage - 1) * 100 + lastPageDados.length;
                    
                    while (dados.length < totalReal) {
                        dados.push({});
                    }
                }
            } catch (err) {
                console.warn("[CamaraApi] Nao foi possivel ler o total real de proposicoes via link last:", err);
            }
        }
        return dados;
    }

    /**
     * Busca as votações recentes da Câmara.
     */
    async buscarVotacoesRecentes(itens = 20) {
        const hoje = new Date().toISOString().split('T')[0];
        const response = await this._fetch('/votacoes', {
            ordem: 'DESC',
            ordenarPor: 'dataHoraRegistro',
            itens: itens,
            dataInicio: '2023-01-01',
            dataFim: hoje
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
        const response = await this._fetch(`/partidos/${id}/membros`, params);
        return response.dados || [];
    }

    /**
     * Busca os votos recentes específicos de um parlamentar.
     */
    async buscarVotacoesDeputado(id, dataInicio, dataFim, itens = 20) {
        const params = { itens: itens };
        if (dataInicio) {
            params.dataInicio = dataInicio;
        }
        if (dataFim) {
            params.dataFim = dataFim;
        }
        
        const queryParams = new URLSearchParams({
            formato: 'json',
            ...params
        });
        const urlCompleta = `${this.baseUrl}/deputados/${id}/votacoes?${queryParams.toString()}`;
        
        let dados = [];
        let success = false;
        
        try {
            const response = await this._fetch(`/deputados/${id}/votacoes`, params);
            dados = response.dados || [];
            success = true;
        } catch (err) {
            console.warn(`[CamaraApi] Falha ao consultar endpoint direto do deputado. URL: ${urlCompleta}. Erro: ${err.message}`);
        }
        
        if (!success || dados.length === 0) {
            if (success) {
                console.warn(`[CamaraApi] Nenhuma votacao retornada. URL da requisicao: ${urlCompleta}`);
            }
            
            try {
                console.log(`[CamaraApi] Iniciando fallback robusto via /votacoes com filtro de Plenário...`);
                
                let chunks = [];
                if (dataInicio && dataFim) {
                    const start = new Date(dataInicio);
                    const end = new Date(dataFim);
                    let currentStart = new Date(start);
                    
                    while (currentStart <= end) {
                        let currentEnd = new Date(currentStart);
                        currentEnd.setMonth(currentEnd.getMonth() + 3);
                        currentEnd.setDate(currentEnd.getDate() - 1);
                        if (currentEnd > end) {
                            currentEnd = new Date(end);
                        }
                        
                        const startIso = currentStart.toISOString().split('T')[0];
                        const endIso = currentEnd.toISOString().split('T')[0];
                        chunks.push({ dataInicio: startIso, dataFim: endIso });
                        
                        currentStart = new Date(currentEnd);
                        currentStart.setDate(currentStart.getDate() + 1);
                    }
                } else {
                    const hoje = new Date();
                    const tresMesesAtras = new Date();
                    tresMesesAtras.setMonth(tresMesesAtras.getMonth() - 3);
                    chunks.push({
                        dataInicio: tresMesesAtras.toISOString().split('T')[0],
                        dataFim: hoje.toISOString().split('T')[0]
                    });
                }
                
                const promessas = chunks.map(chunk => 
                    this._fetch('/votacoes', {
                        dataInicio: chunk.dataInicio,
                        dataFim: chunk.dataFim,
                        itens: 100
                    }).then(res => res.dados || []).catch(() => [])
                );
                
                const resultados = await Promise.all(promessas);
                const todasVotacoes = [];
                const idsVistos = new Set();
                
                resultados.forEach(lista => {
                    lista.forEach(v => {
                        if (v.siglaOrgao === 'PLEN' && !idsVistos.has(v.id)) {
                            idsVistos.add(v.id);
                            todasVotacoes.push(v);
                        }
                    });
                });
                
                todasVotacoes.sort((a, b) => {
                    const dataA = new Date(a.dataHoraRegistro || a.data || 0);
                    const dataB = new Date(b.dataHoraRegistro || b.data || 0);
                    return dataB - dataA;
                });
                
                dados = todasVotacoes.slice(0, itens);
            } catch (fallbackErr) {
                console.error("[CamaraApi] Falha critica no fallback de votacoes:", fallbackErr);
            }
        }
        
        return dados;
    }

    /**
     * Busca os eventos/sessões deliberativas de um órgão (ex: Plenário 114) no período.
     */
    async buscarSessoesOrgao(orgaoId, dataInicio, dataFim) {
        const response = await this._fetch(`/orgaos/${orgaoId}/eventos`, {
            dataInicio: dataInicio,
            dataFim: dataFim,
            itens: 100
        });
        return response.dados || [];
    }

    /**
     * Busca as áreas temáticas de uma proposição específica.
     */
    async buscarTemasProposicao(id) {
        const response = await this._fetch(`/proposicoes/${id}/temas`);
        return response.dados || [];
    }

    /**
     * Busca os orgaos (comissoes, conselhos) dos quais um deputado e integrante.
     */
    async buscarOrgaosDeputado(id) {
        const response = await this._fetch(`/deputados/${id}/orgaos`, { itens: 100 });
        return response.dados || [];
    }

    /**
     * Busca as frentes parlamentares das quais um deputado e integrante.
     */
    async buscarFrentesDeputado(id) {
        const response = await this._fetch(`/deputados/${id}/frentes`);
        return response.dados || [];
    }

    /**
     * Busca o historico de mudancas no exercicio parlamentar de um deputado.
     */
    async buscarHistoricoDeputado(id) {
        const response = await this._fetch(`/deputados/${id}/historico`);
        return response.dados || [];
    }

    /**
     * Busca os discursos feitos por um deputado em eventos diversos.
     */
    async buscarDiscursosDeputado(id, params = {}) {
        const response = await this._fetch(`/deputados/${id}/discursos`, {
            itens: 15,
            ordenarPor: 'dataHoraInicio',
            ordem: 'DESC',
            ...params
        });
        return response.dados || [];
    }

    /**
     * Busca informacoes detalhadas sobre uma proposicao especifica.
     */
    async buscarDetalheProposicao(id) {
        const response = await this._fetch(`/proposicoes/${id}`);
        return response.dados;
    }
}

// Expõe globalmente
window.camaraApi = new CamaraApiService();
