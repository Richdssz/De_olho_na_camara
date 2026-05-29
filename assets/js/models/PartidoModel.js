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
     * Limpa marcações wiki de um texto.
     */
    static limparTextoWiki(texto) {
        if (!texto) return 'Não informado';
        return texto
            .replace(/\{\{[^}]+\}\}/g, '')           // remove {{templates}}
            .replace(/\[\[([^|\]]+\|)?([^\]]+)\]\]/g, '$2') // [[link|texto]] → texto
            .replace(/'{2,3}/g, '')                   // remove '' e '''
            .replace(/\s+/g, ' ')
            .trim()
            || 'Não informado';
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

        const fallback = FALLBACK_IDEOLOGIAS[sigla.toUpperCase()] || { ideologia: 'Sem ideologia oficial', espectro: 'Sem espectro político definido' };

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
            const cleanExtract = this.limparTextoWiki(extract.replace(/\[\d+\]/g, "").replace(/[\[\]]/g, ""));
            const cleanIdeologia = this.limparTextoWiki(fallback.ideologia);
            const cleanEspectro = this.limparTextoWiki(fallback.espectro);

            const result = {
                resumo: cleanExtract === 'Não informado' ? "Resumo historico indisponivel na Wikipedia." : cleanExtract,
                ideologia: cleanIdeologia,
                espectro: cleanEspectro,
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
                ideologia: this.limparTextoWiki(fallback.ideologia),
                espectro: this.limparTextoWiki(fallback.espectro),
                font: `https://pt.wikipedia.org/wiki/${encodeURIComponent(nomeCompleto)}`
            };
            return this._formatResponse(true, result, 'fallback');
        }
    }

    /**
     * Busca o logo do partido no Back4App (classe PartidoAsset).
     * Se a base estiver vazia, auto-popula a base uma vez no Back4App.
     */
    static async buscarLogo(sigla) {
        if (!sigla) return null;
        const siglaUpper = sigla.toUpperCase().trim();

        // Tentar ler do Cache local primeiro
        const cacheKey = `partido_logo_b4a_${siglaUpper}`;
        const cached = window.CacheService ? window.CacheService.getLocal(cacheKey) : null;
        if (cached) return cached;

        try {
            const query = new Parse.Query('PartidoAsset');
            query.equalTo('sigla', siglaUpper);
            let resultado = await query.first();

            // Auto-popular se a base de dados estiver vazia
            if (!resultado) {
                const countQuery = new Parse.Query('PartidoAsset');
                const total = await countQuery.count().catch(() => 0);
                if (total === 0) {
                    console.log("[PartidoModel] Classe PartidoAsset está vazia no Back4App. Auto-populando...");
                    await this.inicializarPartidoAssetsNoBack4App();
                    resultado = await query.first().catch(() => null);
                }
            }

            if (resultado && resultado.get('logoUrl')) {
                const logoUrl = resultado.get('logoUrl');
                if (window.CacheService) {
                    window.CacheService.setLocal(cacheKey, logoUrl, 1440); // 24h
                }
                return logoUrl;
            }
        } catch (e) {
            console.warn("[PartidoModel] Erro ao consultar PartidoAsset no Back4App:", e);
        }
        return null;
    }

    /**
     * Inicializa a tabela PartidoAsset com os partidos padrão e suas cores hexadecimais.
     */
    static async inicializarPartidoAssetsNoBack4App() {
        try {
            const PartidoAsset = Parse.Object.extend('PartidoAsset');
            const partidos = [
                { sigla: 'PT',           nomeCompleto: 'Partido dos Trabalhadores',               corHex: '#ED1C24' },
                { sigla: 'PL',           nomeCompleto: 'Partido Liberal',                         corHex: '#003087' },
                { sigla: 'PP',           nomeCompleto: 'Progressistas',                           corHex: '#1E7C45' },
                { sigla: 'MDB',          nomeCompleto: 'Movimento Democrático Brasileiro',        corHex: '#003F87' },
                { sigla: 'UNIÃO',        nomeCompleto: 'União Brasil',                            corHex: '#006847' },
                { sigla: 'UNIAO',        nomeCompleto: 'União Brasil',                            corHex: '#006847' },
                { sigla: 'PSD',          nomeCompleto: 'Partido Social Democrático',              corHex: '#00A859' },
                { sigla: 'REPUBLICANOS', nomeCompleto: 'Republicanos',                            corHex: '#0047BA' },
                { sigla: 'PDT',          nomeCompleto: 'Partido Democrático Trabalhista',         corHex: '#ED1C24' },
                { sigla: 'PSDB',         nomeCompleto: 'Partido da Social Democracia Brasileira', corHex: '#0080C9' },
                { sigla: 'NOVO',         nomeCompleto: 'Partido Novo',                            corHex: '#F7941D' },
                { sigla: 'PSOL',         nomeCompleto: 'Partido Socialismo e Liberdade',          corHex: '#FEE800' },
                { sigla: 'PODE',         nomeCompleto: 'Podemos',                                 corHex: '#29ABE2' },
                { sigla: 'PCdoB',        nomeCompleto: 'Partido Comunista do Brasil',             corHex: '#D2232A' },
                { sigla: 'PCDOB',        nomeCompleto: 'Partido Comunista do Brasil',             corHex: '#D2232A' },
                { sigla: 'PSB',          nomeCompleto: 'Partido Socialista Brasileiro',           corHex: '#F7941D' },
                { sigla: 'AVANTE',       nomeCompleto: 'Avante',                                  corHex: '#F7941D' },
                { sigla: 'SOLIDARIEDADE',nomeCompleto: 'Solidariedade',                           corHex: '#E87722' },
                { sigla: 'CIDADANIA',    nomeCompleto: 'Cidadania',                               corHex: '#009846' },
                { sigla: 'PRD',          nomeCompleto: 'Partido Renovação Democrática',           corHex: '#003087' },
                { sigla: 'PV',           nomeCompleto: 'Partido Verde',                           corHex: '#008000' },
                { sigla: 'REDE',         nomeCompleto: 'Rede Sustentabilidade',                   corHex: '#008080' },
                { sigla: 'DC',           nomeCompleto: 'Democracia Cristã',                       corHex: '#003087' },
                { sigla: 'MISSÃO',       nomeCompleto: 'Partido Missão',                          corHex: '#7f8c8d' },
                { sigla: 'MISSAO',       nomeCompleto: 'Partido Missão',                          corHex: '#7f8c8d' }
            ];

            const acl = new Parse.ACL();
            acl.setPublicReadAccess(true);
            acl.setPublicWriteAccess(true); // Permitir escrita inicial se criada pela primeira vez de forma anônima

            const promessas = partidos.map(p => {
                const obj = new PartidoAsset();
                obj.set('sigla', p.sigla);
                obj.set('nomeCompleto', p.nomeCompleto);
                obj.set('corHex', p.corHex);
                obj.set('logoUrl', null);
                obj.set('ativo', true);
                obj.setACL(acl);
                return obj.save();
            });

            await Promise.all(promessas);
            console.log("[PartidoModel] PartidoAsset inicializado com sucesso no Back4App.");
        } catch (e) {
            console.error("[PartidoModel] Falha ao auto-popular PartidoAsset no Back4App:", e);
        }
    }

    /**
     * Calculates combined expenses for all active deputies of the party for a given year.
     * @param {Array} membros - List of party members.
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

    /**
     * Retorna os dados de fallback de um partido (ideologia, espectro, corHex).
     */
    static getFallbackData(sigla) {
        if (!sigla) return null;
        return FALLBACK_IDEOLOGIAS[sigla.toUpperCase().trim()] || null;
    }
}

const FALLBACK_IDEOLOGIAS = {
    'PT': { ideologia: 'Socialismo democrático, Social-democracia', espectro: 'Esquerda a Centro-esquerda', corHex: '#ED1C24' },
    'PL': { ideologia: 'Conservadorismo, Liberalismo econômico', espectro: 'Direita', corHex: '#003087' },
    'MDB': { ideologia: 'Centrismo, Catch-all', espectro: 'Centro', corHex: '#003F87' },
    'PSD': { ideologia: 'Centrismo, Liberalismo social', espectro: 'Centro', corHex: '#00A859' },
    'UNIAO': { ideologia: 'Conservadorismo liberal, Liberalismo', espectro: 'Centro-direita a Direita', corHex: '#006847' },
    'UNIÃO': { ideologia: 'Conservadorismo liberal, Liberalismo', espectro: 'Centro-direita a Direita', corHex: '#006847' },
    'PP': { ideologia: 'Conservadorismo, Direita cristã', espectro: 'Direita', corHex: '#1E7C45' },
    'REPUBLICANOS': { ideologia: 'Conservadorismo social, Democracia cristã', espectro: 'Direita', corHex: '#0047BA' },
    'PODE': { ideologia: 'Democracia cristã, Populismo', espectro: 'Centro a Centro-direita', corHex: '#29ABE2' },
    'PDT': { ideologia: 'Trabalhismo, Social-democracia', espectro: 'Centro-esquerda', corHex: '#ED1C24' },
    'PSB': { ideologia: 'Social-democracia, Socialismo criativo', espectro: 'Centro-esquerda a Esquerda', corHex: '#F7941D' },
    'PSOL': { ideologia: 'Socialismo democrático, Anticapitalismo', espectro: 'Esquerda a Extrema-esquerda', corHex: '#FEE800' },
    'AVANTE': { ideologia: 'Centrismo, Populismo', espectro: 'Centro', corHex: '#F7941D' },
    'SOLIDARIEDADE': { ideologia: 'Sindicalismo, Social-democracia', espectro: 'Centro a Centro-esquerda', corHex: '#E87722' },
    'PATRIOTA': { ideologia: 'Conservadorismo, Nacionalismo', espectro: 'Direita', corHex: '#7f8c8d' },
    'NOVO': { ideologia: 'Liberalismo clássico, Libertarianismo', espectro: 'Direita', corHex: '#F7941D' },
    'PCdoB': { ideologia: 'Comunismo, Marxismo-leninismo', espectro: 'Esquerda', corHex: '#D2232A' },
    'PCDOB': { ideologia: 'Comunismo, Marxismo-leninismo', espectro: 'Esquerda', corHex: '#D2232A' },
    'CIDADANIA': { ideologia: 'Social-democracia, Terceira via', espectro: 'Centro a Centro-esquerda', corHex: '#009846' },
    'PV': { ideologia: 'Ambientalismo, Verde', espectro: 'Centro-esquerda', corHex: '#008000' },
    'REDE': { ideologia: 'Sustentabilidade, Social-democracia', espectro: 'Centro-esquerda', corHex: '#008080' },
    'PSDB': { ideologia: 'Social-democracia, Centrismo', espectro: 'Centro a Centro-esquerda', corHex: '#0080C9' },
    'PRD': { ideologia: 'Centrismo, Populismo', espectro: 'Centro', corHex: '#003087' },
    'DC': { ideologia: 'Democracia Cristã', espectro: 'Centro', corHex: '#003087' },
    'MISSÃO': { ideologia: 'Sem ideologia oficial', espectro: 'Sem espectro definido', corHex: '#7f8c8d' },
    'MISSAO': { ideologia: 'Sem ideologia oficial', espectro: 'Sem espectro definido', corHex: '#7f8c8d' }
};

window.PartidoModel = PartidoModel;
