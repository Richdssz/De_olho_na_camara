/**
 * Serviço de Analytics e Motor de Inteligência Política.
 * Responsável por calcular KPIs e detectar anomalias comportamentais nos dados parlamentares.
 */
class AnalyticsService {
    /**
     * Calcula a taxa de presença em sessões deliberativas.
     * @param {Array} eventosDeputado - Lista de eventos vinculados ao deputado.
     * @param {number} ano - Ano de análise.
     * @param {Array} sessoesPlenario - Lista oficial de sessões deliberativas do órgão 114 (Plenário).
     */
    calcularTaxaPresenca(eventosDeputado, ano, sessoesPlenario) {
        // Quantas sessoes o Plenario da Camara teve no ano passado/corrente
        const totalSessoesOficiais = (sessoesPlenario || []).filter(e => 
            e.descricaoTipo && e.descricaoTipo.toLowerCase().includes('deliberativa')
        ).length;

        // Presencas reais cadastradas para o deputado nesses mesmos eventos
        const presencas = (eventosDeputado || []).filter(e => 
            e.descricaoTipo && e.descricaoTipo.toLowerCase().includes('deliberativa')
        ).length;

        if (totalSessoesOficiais === 0 && presencas === 0) {
            return {
                rate: 0,
                presencas: 0,
                total: 0,
                semDados: true,
                classificacao: { texto: 'Sem dados', classe: 'bg-gray-50 text-gray-700 border-gray-200' }
            };
        }

        const totalReal = Math.max(totalSessoesOficiais, presencas);
        const rate = totalReal > 0 ? Math.round((presencas / totalReal) * 100) : 0;

        return {
            rate: rate,
            presencas: presencas,
            total: totalReal,
            semDados: false,
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
            return { coesao: 0, totalComOrientacao: 0, iguais: 0, detalhes: [], classificacao: { texto: 'Sem Partido', classe: 'bg-gray-50 text-gray-700 border-gray-200' } };
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
            : 0;

        let classificacao = this.classificarCoesao(coesao);
        if (totalVotadasComOrientacao > 0 && totalVotadasComOrientacao < 3) {
            classificacao = { texto: 'Amostra Insuficiente', classe: 'bg-gray-50 text-gray-700 border-gray-200' };
        } else if (totalVotadasComOrientacao === 0) {
            classificacao = { texto: 'Sem Votos Recentes', classe: 'bg-gray-50 text-gray-700 border-gray-200' };
        }

        return {
            coesao: coesao,
            totalComOrientacao: totalVotadasComOrientacao,
            iguais: votosIgualOrientacao,
            detalhes: detalhes,
            classificacao: classificacao
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

    /**
     * Avalia as métricas do deputado e atribui badges de gamificação.
     * @param {Object} kpis - Objeto contendo presencaRate, gastoMedioMensal, coesaoRate, totalProposicoes
     */
    avaliarBadges(kpis) {
        const badges = [];
        const presenca = kpis.presencaRate || 0;
        const gasto = kpis.gastoMedioMensal || 0;
        const coesao = kpis.coesaoRate || 0;
        const proposicoes = kpis.totalProposicoes || 0;

        const MEDIA_NACIONAL_GASTO = 35000;

        // 1. Assiduidade Máxima
        if (presenca >= 95) {
            badges.push({
                id: 'assiduidade',
                icone: 'fa-solid fa-calendar-check',
                titulo: 'Presença de Ouro',
                descricao: 'Compareceu a mais de 95% das sessões deliberativas.',
                cor: 'bg-amber-100 text-amber-700 border-amber-300'
            });
        }

        // 2. Responsabilidade Fiscal
        if (gasto > 0 && gasto <= MEDIA_NACIONAL_GASTO * 0.5) {
            badges.push({
                id: 'economia',
                icone: 'fa-solid fa-piggy-bank',
                titulo: 'Economista',
                descricao: 'Gastou menos da metade da cota parlamentar média nacional.',
                cor: 'bg-emerald-100 text-emerald-700 border-emerald-300'
            });
        }

        // 3. Fiel ao Partido
        if (coesao >= 90) {
            badges.push({
                id: 'fidelidade',
                icone: 'fa-solid fa-handshake-angle',
                titulo: 'Leal ao Partido',
                descricao: 'Votou de acordo com a orientação partidária em mais de 90% das vezes.',
                cor: 'bg-blue-100 text-blue-700 border-blue-300'
            });
        }

        // 4. Autor Prolífico
        if (proposicoes >= 50) {
            badges.push({
                id: 'produtividade',
                icone: 'fa-solid fa-pen-nib',
                titulo: 'Autor Prolífico',
                descricao: 'Apresentou um alto volume de proposições legislativas.',
                cor: 'bg-purple-100 text-purple-700 border-purple-300'
            });
        }

        return badges;
    }

    /**
     * Calcula o ROI Parlamentar (custo por proposicao).
     * @param {number} totalGasto - Total gasto em cota parlamentar no periodo.
     * @param {number} totalProposicoes - Total de proposicoes apresentadas.
     */
    calcularROIParlamentar(totalGasto, totalProposicoes) {
        if (totalProposicoes === 0 || totalGasto === 0) {
            return {
                custoPorProposicao: 0,
                totalGasto: totalGasto,
                totalProposicoes: totalProposicoes,
                classificacao: { texto: 'Sem dados suficientes', classe: 'bg-gray-50 text-gray-700 border-gray-200' }
            };
        }

        const custoPorProp = totalGasto / totalProposicoes;
        let classificacao;

        if (custoPorProp < 100000) {
            classificacao = { texto: 'Alta eficiencia', classe: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
        } else if (custoPorProp <= 300000) {
            classificacao = { texto: 'Eficiencia media', classe: 'bg-amber-50 text-amber-700 border-amber-200' };
        } else {
            classificacao = { texto: 'Baixa eficiencia', classe: 'bg-red-50 text-red-700 border-red-200' };
        }

        return {
            custoPorProposicao: custoPorProp,
            totalGasto: totalGasto,
            totalProposicoes: totalProposicoes,
            classificacao: classificacao
        };
    }

    /**
     * Calcula a taxa de sucesso legislativo do deputado.
     * @param {Array} proposicoesDetalhadas - Lista de proposicoes com dados de situacao.
     */
    calcularTaxaSucessoLegislativo(proposicoesDetalhadas) {
        if (!proposicoesDetalhadas || proposicoesDetalhadas.length === 0) {
            return {
                taxa: 0,
                aprovadas: 0,
                total: 0,
                emTramitacao: 0,
                arquivadas: 0,
                classificacao: { texto: 'Sem proposicoes', classe: 'bg-gray-50 text-gray-700 border-gray-200' }
            };
        }

        let aprovadas = 0;
        let arquivadas = 0;
        let emTramitacao = 0;

        proposicoesDetalhadas.forEach(p => {
            const situacao = (p.statusProposicao && p.statusProposicao.descricaoSituacao) || '';
            const sitLower = situacao.toLowerCase();

            if (sitLower.includes('transformad') || sitLower.includes('lei') || sitLower.includes('aprovad') || sitLower.includes('promulgad')) {
                aprovadas++;
            } else if (sitLower.includes('arquivad') || sitLower.includes('rejeitad') || sitLower.includes('devolvid') || sitLower.includes('retirad')) {
                arquivadas++;
            } else {
                emTramitacao++;
            }
        });

        const total = proposicoesDetalhadas.length;
        const taxa = total > 0 ? Math.round((aprovadas / total) * 100) : 0;

        let classificacao;
        if (taxa >= 20) {
            classificacao = { texto: 'Alto sucesso', classe: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
        } else if (taxa >= 5) {
            classificacao = { texto: 'Sucesso moderado', classe: 'bg-amber-50 text-amber-700 border-amber-200' };
        } else {
            classificacao = { texto: 'Baixo sucesso', classe: 'bg-red-50 text-red-700 border-red-200' };
        }

        return {
            taxa: taxa,
            aprovadas: aprovadas,
            total: total,
            emTramitacao: emTramitacao,
            arquivadas: arquivadas,
            classificacao: classificacao
        };
    }
}

// Expoe globalmente
window.analytics = new AnalyticsService();
