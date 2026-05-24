/**
 * Serviço de Analytics e Motor de Inteligência Política.
 * Responsável por calcular KPIs e detectar anomalias comportamentais nos dados parlamentares.
 */
class AnalyticsService {
    /**
     * Calcula a taxa de presença em sessões deliberativas.
     * @param {Array} eventosDeputado - Lista de eventos vinculados ao deputado.
     * @param {number} ano - Ano de análise (padrão 2026).
     */
    calcularTaxaPresenca(eventosDeputado, ano = 2026) {
        const deliberativos = eventosDeputado.filter(e => 
            e.descricaoTipo && e.descricaoTipo.toLowerCase().includes('deliberativa')
        );

        // Estimativa razoável de sessões deliberativas no período (para 2026, ~35 sessões até o momento; 110 para anos cheios)
        let totalEstimado = 110; 
        if (ano === 2026) {
            totalEstimado = 35;
        }

        const presencas = deliberativos.length;
        const rate = totalEstimado > 0 ? Math.min(100, Math.round((presencas / totalEstimado) * 100)) : 100;

        return {
            rate: rate,
            presencas: presencas,
            total: totalEstimado,
            classificacao: this.classificarPresenca(rate)
        };
    }

    /**
     * Classifica a taxa de presença de acordo com a regra de negócio.
     */
    classificarPresenca(rate) {
        if (rate >= 85) return { texto: 'Presença regular', classe: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
        if (rate >= 65) return { texto: 'Presença moderada', classe: 'bg-amber-50 text-amber-700 border-amber-200' };
        return { texto: 'Presença crítica', classe: 'bg-red-50 text-red-700 border-red-200' };
    }

    /**
     * Calcula a média de gastos CEAP mensal e totais.
     * @param {Array} despesas - Lista de despesas do deputado.
     */
    calcularMediaGastos(despesas) {
        let total = 0;
        const mesesComGastos = new Set();

        despesas.forEach(d => {
            const valor = parseFloat(d.valorDocumento || d.valorLiquido || 0);
            total += valor;
            if (d.mes) {
                mesesComGastos.add(d.mes);
            }
        });

        const numMeses = mesesComGastos.size || 1;
        const media = total / numMeses;

        // Classificação frente à média estimada
        const MEDIA_NACIONAL = 35000;
        let classificacao = { texto: 'Gasto médio', classe: 'bg-gray-50 text-gray-700 border-gray-200' };

        if (media <= MEDIA_NACIONAL * 0.75) {
            classificacao = { texto: 'Gasto baixo', classe: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
        } else if (media > MEDIA_NACIONAL * 1.75) {
            classificacao = { texto: 'Gasto crítico', classe: 'bg-red-50 text-red-700 border-red-200' };
        } else if (media > MEDIA_NACIONAL * 1.25) {
            classificacao = { texto: 'Gasto elevado', classe: 'bg-amber-50 text-amber-700 border-amber-200' };
        }

        return {
            total: total,
            media: media,
            numMeses: numMeses,
            classificacao: classificacao
        };
    }

    /**
     * Calcula a coesão partidária do deputado com base em seus votos e as orientações.
     */
    calcularCoesaoPartidaria(votosDeputado, orientacoesVotacoes, siglaPartido) {
        if (!siglaPartido) {
            return { coesao: 100, totalComOrientacao: 0, iguais: 0, detalhes: [], classificacao: this.classificarCoesao(100) };
        }

        let totalVotadasComOrientacao = 0;
        let votosIgualOrientacao = 0;
        const detalhes = [];

        votosDeputado.forEach(v => {
            const orientacoes = orientacoesVotacoes[v.votacaoId] || [];
            
            // Busca orientação exata do partido
            const orientacaoPartido = orientacoes.find(o => 
                o.siglaPartidoBloco && o.siglaPartidoBloco.toUpperCase() === siglaPartido.toUpperCase()
            );

            const orientacaoVoto = orientacaoPartido ? orientacaoPartido.orientacaoVoto : null;

            // Se o partido orientou Sim ou Não
            if (orientacaoVoto && orientacaoVoto !== '' && orientacaoVoto !== 'Liberado') {
                const votoOriginal = v.voto;
                const votoNormalizado = this._normalizarVoto(votoOriginal);
                const orientacaoNormalizada = this._normalizarVoto(orientacaoVoto);

                if (votoNormalizado && orientacaoNormalizada) {
                    totalVotadasComOrientacao++;
                    const coeso = votoNormalizado === orientacaoNormalizada;
                    if (coeso) {
                        votosIgualOrientacao++;
                    }
                    detalhes.push({
                        votacaoId: v.votacaoId,
                        descricao: v.descricao,
                        data: v.data,
                        votoDeputado: votoOriginal,
                        orientacaoPartido: orientacaoVoto,
                        coeso: coeso
                    });
                }
            }
        });

        const coesao = totalVotadasComOrientacao > 0 
            ? Math.round((votosIgualOrientacao / totalVotadasComOrientacao) * 100)
            : 100;

        return {
            coesao: coesao,
            totalComOrientacao: totalVotadasComOrientacao,
            iguais: votosIgualOrientacao,
            detalhes: detalhes,
            classificacao: this.classificarCoesao(coesao)
        };
    }

    /**
     * Classifica a taxa de coesão de acordo com a regra de negócio.
     */
    classificarCoesao(coesao) {
        if (coesao >= 90) return { texto: 'Alta coesão', classe: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
        if (coesao >= 70) return { texto: 'Coesão moderada', classe: 'bg-amber-50 text-amber-700 border-amber-200' };
        return { texto: 'Baixa coesão', classe: 'bg-red-50 text-red-700 border-red-200' };
    }

    /**
     * Detecção de anomalias com base nos KPIs gerados.
     */
    detectarAnomalias(kpis) {
        const anomalias = [];
        const presenca = kpis.presencaRate || 0;
        const gastoMedio = kpis.gastoMedioMensal || 0;
        const coesao = kpis.coesaoRate || 0;

        const MEDIA_NACIONAL_GASTO = 35000;

        // 1. Composta: alto gasto e baixa presença
        if (gastoMedio > MEDIA_NACIONAL_GASTO * 1.5 && presenca < 70) {
            anomalias.push({
                categoria: 'alto_gasto_baixa_presenca',
                titulo: 'Alto Gasto + Baixa Presença',
                descricao: `Média mensal de gastos (R$ ${gastoMedio.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}) está acima de 1.5x a média e a presença em plenário é baixa (${presenca}%).`,
                severidade: 'critico'
            });
        }

        // 2. Gasto crítico CEAP
        if (gastoMedio > MEDIA_NACIONAL_GASTO * 1.75) {
            anomalias.push({
                categoria: 'gasto_critico_ceap',
                titulo: 'Gasto Crítico CEAP',
                descricao: `Gasto mensal médio de R$ ${gastoMedio.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})} excede em 1.75x a média nacional.`,
                severidade: 'alerta'
            });
        }

        // 3. Ausência crítica
        if (presenca < 65) {
            anomalias.push({
                categoria: 'ausencia_critica',
                titulo: 'Ausência Crítica',
                descricao: `Participação em sessões plenárias de apenas ${presenca}%, bem abaixo do limite regular.`,
                severidade: 'alerta'
            });
        }

        // 4. Coesão baixa (rebeldia/independência extrema)
        if (coesao < 70) {
            anomalias.push({
                categoria: 'coesao_baixa',
                titulo: 'Baixa Coesão Partidária',
                descricao: `Divergência partidária frequente: votou desalinhado com o líder do partido em ${100 - coesao}% das votações com orientação.`,
                severidade: 'atencao'
            });
        }

        // Calcula severidade consolidada
        let severidade = 'info';
        if (anomalias.some(a => a.severidade === 'critico')) severidade = 'critico';
        else if (anomalias.some(a => a.severidade === 'alerta')) severidade = 'alerta';
        else if (anomalias.some(a => a.severidade === 'atencao')) severidade = 'atencao';

        return {
            anomalias: anomalias,
            severidade: severidade,
            temAnomalia: anomalias.length > 0
        };
    }

    /**
     * Normaliza as strings de voto para comparação uniforme.
     */
    _normalizarVoto(voto) {
        if (!voto) return null;
        const v = voto.toLowerCase().trim();
        if (v.includes('sim')) return 'sim';
        if (v.includes('não') || v.includes('nao')) return 'nao';
        if (v.includes('abstenção') || v.includes('abstencao')) return 'abstencao';
        if (v.includes('obstrução') || v.includes('obstrucao')) return 'obstrucao';
        return null;
    }
}

// Expõe globalmente
window.analytics = new AnalyticsService();
