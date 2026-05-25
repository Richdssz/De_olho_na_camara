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
                        const deputado = vote.deputado || vote.deputado_;
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
                    : null;
            }

            if (window.CacheService) {
                window.CacheService.setLocal(cacheKey, resultado, 60); // Cache de 1h
            }
            return this._formatResponse(true, resultado, 'api');
        } catch (error) {
            console.error("[PartidoModel] Erro ao calcular coesao partidaria:", error);
            return this._formatResponse(false, {}, 'api', error.message);
        }
    }

    /**
     * Busca dados historicos, ideologia e espectro politico de um partido na Wikipedia.
     * @param {string} sigla 
     * @param {string} nomeCompleto 
     */
    static async buscarDadosWikipedia(sigla, nomeCompleto) {
        const cacheKey = `partido_wiki_${sigla.toUpperCase()}`;
        const cached = window.CacheService ? window.CacheService.getLocal(cacheKey) : null;

        if (cached) {
            return this._formatResponse(true, cached, 'cache');
        }

        const fallback = FALLBACK_IDEOLOGIAS[sigla.toUpperCase()] || { ideologia: 'Nao documentada', espectro: 'Nao documentado' };

        try {
            console.log(`[PartidoModel] Buscando dados na Wikipedia para o partido ${sigla}...`);
            const queryTerm = `${nomeCompleto} partido politico`;
            const searchUrl = `https://pt.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(queryTerm)}&format=json&origin=*`;

            const searchRes = await fetch(searchUrl).then(r => r.json());
            const searchResults = searchRes?.query?.search || [];

            if (searchResults.length === 0) {
                throw new Error("Nenhum resultado encontrado para a busca.");
            }

            const pageTitle = searchResults[0].title;
            const detailUrl = `https://pt.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages&piprop=original&exintro=true&explaintext=true&titles=${encodeURIComponent(pageTitle)}&format=json&origin=*`;

            const detailRes = await fetch(detailUrl).then(r => r.json());
            const pages = detailRes?.query?.pages || {};
            const pageId = Object.keys(pages)[0];

            if (pageId === "-1") {
                throw new Error("Pagina nao encontrada no detalhe.");
            }

            const pageData = pages[pageId];
            const extract = pageData.extract || "";

            // Limpeza de colchetes e referências no resumo
            const cleanExtract = extract
                .replace(/\[\d+\]/g, "")
                .replace(/[\[\]]/g, "")
                .trim();

            const result = {
                resumo: cleanExtract || "Resumo historico indisponivel na Wikipedia.",
                ideologia: fallback.ideologia,
                espectro: fallback.espectro,
                logoUrl: pageData.original?.source || null,
                font: `https://pt.wikipedia.org/wiki/${encodeURIComponent(pageTitle)}`
            };

            if (window.CacheService) {
                window.CacheService.setLocal(cacheKey, result, 720); // Cache de 12 horas
            }

            return this._formatResponse(true, result, 'wikipedia_api');
        } catch (error) {
            console.warn(`[PartidoModel] Wikipedia falhou para ${sigla}, usando fallback:`, error);
            const result = {
                resumo: `Informacoes historicas do partido ${sigla} (${nomeCompleto}). (Dados carregados localmente devido a falha de conexao com a Wikipedia).`,
                ideologia: fallback.ideologia,
                espectro: fallback.espectro,
                font: `https://pt.wikipedia.org/wiki/${encodeURIComponent(nomeCompleto)}`
            };
            return this._formatResponse(true, result, 'fallback');
        }
    }

    /**
     * Calcula as despesas totais de todos os deputados da bancada para um ano.
     * @param {Array} membros - Lista de deputados da bancada.
     * @param {number} ano 
     */
    static async calcularDespesasBancada(membros, ano) {
        const cacheKey = `partido_despesas_${membros.map(m => m.id).join('_')}_${ano}`;
        const cached = window.CacheService ? window.CacheService.getLocal(cacheKey) : null;

        if (cached) {
            return this._formatResponse(true, cached, 'cache');
        }

        try {
            console.log(`[PartidoModel] Calculando despesas consolidadas para ${membros.length} deputados em ${ano}...`);
            
            // Busca as despesas de todos os membros em paralelo (usa cache do DeputadoModel)
            const despesasPromessas = membros.map(m => 
                window.DeputadoModel.buscarDespesas(m.id, ano)
                    .then(res => res.success ? res.data : [])
                    .catch(() => [])
            );

            const resultadosDespesas = await Promise.all(despesasPromessas);

            let totalBancada = 0;
            const porTipo = {};
            const porMes = {};

            resultadosDespesas.forEach(despesasDeputado => {
                despesasDeputado.forEach(d => {
                    const valor = d.valorLiquido || d.valorDocumento || 0;
                    totalBancada += valor;

                    // Agrupa por tipo
                    const tipo = d.tipoDespesa || "Outros";
                    porTipo[tipo] = (porTipo[tipo] || 0) + valor;

                    // Agrupa por mes
                    const mes = d.mes || 0;
                    porMes[mes] = (porMes[mes] || 0) + valor;
                });
            });

            const resultado = {
                total: totalBancada,
                porTipo,
                porMes,
                mediaPorDeputado: membros.length > 0 ? (totalBancada / membros.length) : 0
            };

            if (window.CacheService) {
                window.CacheService.setLocal(cacheKey, resultado, 60); // Cache de 1h
            }

            return this._formatResponse(true, resultado, 'api');
        } catch (error) {
            console.error("[PartidoModel] Erro ao calcular despesas da bancada:", error);
            return this._formatResponse(false, { total: 0, porTipo: {}, porMes: {}, mediaPorDeputado: 0 }, 'api', error.message);
        }
    }
}

const FALLBACK_IDEOLOGIAS = {
    'PT': { ideologia: 'Socialismo democratico, Social-democracia', espectro: 'Esquerda a Centro-esquerda' },
    'PL': { ideologia: 'Conservadorismo, Liberalismo economico', espectro: 'Direita' },
    'MDB': { ideologia: 'Centrismo, Catch-all', espectro: 'Centro' },
    'PSD': { ideologia: 'Centrismo, Liberalismo social', espectro: 'Centro' },
    'UNIAO': { ideologia: 'Conservadorismo liberal, Liberalismo', espectro: 'Centro-direita a Direita' },
    'PP': { ideologia: 'Conservadorismo, Direita crista', espectro: 'Direita' },
    'REPUBLICANOS': { ideologia: 'Conservadorismo social, Democracia crista', espectro: 'Direita' },
    'PODE': { ideologia: 'Democracia crista, Populismo', espectro: 'Centro a Centro-direita' },
    'PDT': { ideologia: 'Trabalhismo, Social-democracia', espectro: 'Centro-esquerda' },
    'PSB': { ideologia: 'Social-democracia, Socialismo criativo', espectro: 'Centro-esquerda a Esquerda' },
    'PSOL': { ideologia: 'Socialismo democratico, Anticapitalismo', espectro: 'Esquerda a Extrema-esquerda' },
    'AVANTE': { ideologia: 'Centrismo, Populismo', espectro: 'Centro' },
    'SOLIDARIEDADE': { ideologia: 'Sindicalismo, Social-democracia', espectro: 'Centro a Centro-esquerda' },
    'PATRIOTA': { ideologia: 'Conservadorismo, Nacionalismo', espectro: 'Direita' },
    'NOVO': { ideologia: 'Liberalismo classico, Libertarianismo', espectro: 'Direita' },
    'PCdoB': { ideologia: 'Comunismo, Marxismo-leninismo', espectro: 'Esquerda' },
    'CIDADANIA': { ideologia: 'Social-democracia, Terceira via', espectro: 'Centro a Centro-esquerda' },
    'PV': { ideologia: 'Ambientalismo, Verde', espectro: 'Centro-esquerda' },
    'REDE': { ideologia: 'Sustentabilidade, Social-democracia', espectro: 'Centro-esquerda' },
    'PSDB': { ideologia: 'Social-democracia, Centrismo', espectro: 'Centro a Centro-esquerda' }
};

window.PartidoModel = PartidoModel;
