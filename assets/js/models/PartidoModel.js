/**
 * Model de Partidos
 * Responsável por buscar partidos e calcular o índice de coesão interna.
 * Sempre retorna { success, data, source, timestamp, error }.
 */
class PartidoModel {
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
     * Lista todos os partidos da legislatura atual (57) usando cache.
     */
    static async listar() {
        const cacheKey = 'partidos_lista_57';
        const cached = window.CacheService ? window.CacheService.getLocal(cacheKey) : null;

        if (cached) {
            return this._formatResponse(true, cached, 'cache');
        }

        try {
            const data = await window.camaraApi.listarPartidos({ idLegislatura: 57, itens: 100 });
            if (window.CacheService) {
                window.CacheService.setLocal(cacheKey, data, 180); // Cache de 3h
            }
            return this._formatResponse(true, data, 'api');
        } catch (error) {
            console.error("[PartidoModel] Erro ao listar partidos:", error);
            return this._formatResponse(false, null, 'api', error.message);
        }
    }

    /**
     * Calcula a coesão partidária de todos os partidos com base em votações recentes.
     * @param {number} numVotacoes 
     */
    static async calcularCoesaoPartidos(numVotacoes = 3) {
        const cacheKey = `partidos_coesao_stats_${numVotacoes}`;
        const cached = window.CacheService ? window.CacheService.getLocal(cacheKey) : null;

        if (cached) {
            return this._formatResponse(true, cached, 'cache');
        }

        try {
            console.log(`[PartidoModel] Calculando coesão partidária com base em ${numVotacoes} votações...`);
            const votacoes = await window.camaraApi.buscarVotacoesRecentes(numVotacoes);
            const coesaoMap = {};

            await Promise.all(votacoes.map(async (v) => {
                try {
                    const [orientacoes, votos] = await Promise.all([
                        window.camaraApi.buscarOrientacoesVotacao(v.id).catch(() => []),
                        window.camaraApi.buscarVotosVotacao(v.id).catch(() => [])
                    ]);

                    const orientacaoPorPartido = {};
                    orientacoes.forEach(o => {
                        if (o.siglaPartidoBloco && o.orientacaoVoto) {
                            orientacaoPorPartido[o.siglaPartidoBloco.toUpperCase()] = o.orientacaoVoto;
                        }
                    });

                    votos.forEach(vote => {
                        const deputado = vote.deputado_;
                        if (!deputado || !deputado.siglaPartido) return;

                        const partido = deputado.siglaPartido.toUpperCase();
                        const orientacao = orientacaoPorPartido[partido];

                        if (orientacao && orientacao !== 'Liberado') {
                            const votoVal = vote.tipoVoto;
                            const votoNorm = window.analytics ? window.analytics._normalizarVoto(votoVal) : null;
                            const orientNorm = window.analytics ? window.analytics._normalizarVoto(orientacao) : null;

                            if (votoNorm && orientNorm) {
                                if (!coesaoMap[partido]) {
                                    coesaoMap[partido] = { total: 0, alinhados: 0 };
                                }
                                coesaoMap[partido].total++;
                                if (votoNorm === orientNorm) {
                                    coesaoMap[partido].alinhados++;
                                }
                            }
                        }
                    });
                } catch (e) {
                    console.error(`[PartidoModel] Erro ao processar coesão para votação ${v.id}:`, e);
                }
            }));

            const resultado = {};
            for (const [partido, stats] of Object.entries(coesaoMap)) {
                resultado[partido] = stats.total > 0 
                    ? Math.round((stats.alinhados / stats.total) * 100)
                    : 100;
            }

            if (window.CacheService) {
                window.CacheService.setLocal(cacheKey, resultado, 60); // Cache de 1h
            }
            return this._formatResponse(true, resultado, 'api');
        } catch (error) {
            console.error("[PartidoModel] Erro ao calcular coesão partidária:", error);
            return this._formatResponse(false, {}, 'api', error.message);
        }
    }
}

window.PartidoModel = PartidoModel;
