/**
 * View do Perfil do Deputado (deputado-perfil.html)
 */
class PerfilDeputadoView {
    constructor() {
        this.loadingState = document.getElementById('loading-state');
        this.errorState = document.getElementById('error-state');
        this.profileContent = document.getElementById('profile-content');
        this.errorMessage = document.getElementById('error-message');
        this.btnRadarPerfil = document.getElementById('btn-radar-perfil');

        this.chartDespesas = null;
        this.chartEvolucaoGastos = null;
        this.chartPresenca = null;

        this.modalVotacao = document.getElementById('detalhe-votacao-modal');
        this.closeModalVotacaoBtn = document.getElementById('close-detalhe-votacao-modal');
        
        if (this.closeModalVotacaoBtn && this.modalVotacao) {
            this.closeModalVotacaoBtn.addEventListener('click', () => this.fecharModalVotacao());
            this.modalVotacao.addEventListener('click', (e) => {
                if (e.target === this.modalVotacao) {
                    this.fecharModalVotacao();
                }
            });
        }
    }

    onAcompanharClick(callback) {
        if (this.btnRadarPerfil) {
            this.btnRadarPerfil.addEventListener('click', () => callback(this.btnRadarPerfil));
        }
    }

    mostrarCarregamento() {
        if (this.loadingState) this.loadingState.classList.remove('hidden');
        if (this.profileContent) this.profileContent.classList.add('hidden');
        if (this.errorState) this.errorState.classList.add('hidden');
    }

    mostrarErro(msg) {
        if (this.loadingState) this.loadingState.classList.add('hidden');
        if (this.profileContent) this.profileContent.classList.add('hidden');
        if (this.errorState) this.errorState.classList.remove('hidden');
        if (this.errorMessage) this.errorMessage.textContent = msg;
    }

    mostrarConteudo() {
        if (this.loadingState) this.loadingState.classList.add('hidden');
        if (this.errorState) this.errorState.classList.add('hidden');
        if (this.profileContent) {
            this.profileContent.classList.remove('hidden');
            this.profileContent.classList.add('flex');
        }
    }

    preencherDadosPerfil(deputado) {
        const ultimoStatus = deputado.ultimoStatus || {};
        const gabinete = ultimoStatus.gabinete || {};

        const fotoEl = document.getElementById('perfil-foto');
        if(fotoEl) fotoEl.src = ultimoStatus.urlFoto || 'https://via.placeholder.com/300?text=Sem+Foto';
        
        const nomeEl = document.getElementById('perfil-nome');
        if(nomeEl) nomeEl.textContent = ultimoStatus.nome || deputado.nomeCivil;
        
        const partidoEl = document.getElementById('perfil-partido');
        if(partidoEl) partidoEl.textContent = ultimoStatus.siglaPartido || 'S/P';
        
        const ufEl = document.getElementById('perfil-uf');
        if(ufEl) ufEl.textContent = ultimoStatus.siglaUf || 'N/I';
        
        const condicao = ultimoStatus.condicaoEleitoral || 'Titular';
        const statusIcon = condicao.toLowerCase() === 'titular' 
            ? '<i class="fa-solid fa-check-circle text-emerald-500"></i>' 
            : '<i class="fa-solid fa-info-circle text-blue-500"></i>';
        
        const statusEl = document.getElementById('perfil-status');
        if(statusEl) statusEl.innerHTML = `${statusIcon} ${condicao}`;

        const emailEl = document.getElementById('perfil-email');
        if(emailEl) emailEl.textContent = ultimoStatus.email || 'Não informado';
        
        const gabineteEl = document.getElementById('perfil-gabinete');
        if(gabineteEl) {
            gabineteEl.textContent = gabinete.nome 
                ? `Sala ${gabinete.sala || '-'}, Prédio ${gabinete.predio || '-'} (Tel: ${gabinete.telefone || '-'})` 
                : 'Não informado';
        }
    }

    renderizarMediaAvaliacao(media) {
        const el = document.getElementById('perfil-media-avaliacao');
        if (!el) return;
        if (!media || media === 0) {
            el.innerHTML = `<span class="text-gray-400 text-xs font-medium">Sem avaliações</span>`;
        } else {
            el.innerHTML = `<i class="fa-solid fa-star text-yellow-400"></i> <span class="text-gray-700">${parseFloat(media).toFixed(1)} / 5</span>`;
        }
    }

    renderizarPainelKPIs(presenca, gastos, coesao, proposicoes, roi, sucesso) {
        const presencaEl = document.getElementById('kpi-presenca');
        const badgePresenca = document.getElementById('badge-presenca');
        if (presencaEl) {
            presencaEl.textContent = presenca.semDados ? 'Sem dados' : `${presenca.rate}%`;
        }
        if (badgePresenca) {
            if (presenca.semDados) {
                badgePresenca.textContent = 'Sem sessões deliberativas no período';
                badgePresenca.className = 'px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-gray-50 text-gray-700 border-gray-200';
            } else {
                const ausencias = Math.max(0, presenca.total - presenca.presencas);
                badgePresenca.textContent = `${presenca.presencas} presenças, ${ausencias} ausências de ${presenca.total} sessões - ${presenca.classificacao.texto}`;
                badgePresenca.className = `px-2.5 py-0.5 rounded-full text-xs font-semibold border ${presenca.classificacao.classe}`;
            }
        }

        const gastoEl = document.getElementById('kpi-gasto-medio');
        const badgeGasto = document.getElementById('badge-gasto-medio');
        if (gastoEl) {
            gastoEl.textContent = gastos.media.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }
        if (badgeGasto) {
            badgeGasto.textContent = `${gastos.classificacao.texto} (Total: ${gastos.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`;
            badgeGasto.className = `px-2.5 py-0.5 rounded-full text-xs font-semibold border ${gastos.classificacao.classe}`;
        }

        const coesaoEl = document.getElementById('kpi-coesao');
        const badgeCoesao = document.getElementById('badge-coesao');
        if (coesaoEl) {
            coesaoEl.textContent = (coesao && coesao.totalComOrientacao > 0) ? `${coesao.coesao}%` : 'Sem dados';
        }
        if (badgeCoesao) {
            if (coesao && coesao.totalComOrientacao > 0) {
                badgeCoesao.textContent = `${coesao.iguais} de ${coesao.totalComOrientacao} alinhados - ${coesao.classificacao.texto}`;
                badgeCoesao.className = `px-2.5 py-0.5 rounded-full text-xs font-semibold border ${coesao.classificacao.classe}`;
            } else {
                badgeCoesao.textContent = 'Sem votacoes recentes';
                badgeCoesao.className = 'px-2.5 py-0.5 rounded-full text-xs font-semibold border bg-gray-50 text-gray-700 border-gray-200';
            }
        }

        const proposicoesEl = document.getElementById('kpi-proposicoes');
        if (proposicoesEl) {
            proposicoesEl.textContent = (proposicoes !== undefined && proposicoes !== null) ? proposicoes : 'Sem dados';
        }

        // ROI Parlamentar
        const roiEl = document.getElementById('kpi-roi');
        const badgeRoi = document.getElementById('badge-roi');
        if (roi && roiEl) {
            roiEl.textContent = roi.custoPorProposicao > 0
                ? roi.custoPorProposicao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                : 'N/D';
        }
        if (roi && badgeRoi) {
            badgeRoi.textContent = `Custo por proposicao - ${roi.classificacao.texto}`;
            badgeRoi.className = `px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roi.classificacao.classe}`;
        }

        // Taxa de Sucesso Legislativo
        const sucessoEl = document.getElementById('kpi-sucesso');
        const badgeSucesso = document.getElementById('badge-sucesso');
        if (sucesso && sucessoEl) {
            sucessoEl.textContent = `${sucesso.taxa}%`;
        }
        if (sucesso && badgeSucesso) {
            badgeSucesso.textContent = `${sucesso.aprovadas} aprovadas de ${sucesso.total} - ${sucesso.classificacao.texto}`;
            badgeSucesso.className = `px-2.5 py-0.5 rounded-full text-xs font-semibold border ${sucesso.classificacao.classe}`;
        }
    }

    renderizarBadges(badges) {
        const container = document.getElementById('badges-container');
        if (!container) return;
        
        if (!badges || badges.length === 0) {
            container.innerHTML = '';
            return;
        }

        container.innerHTML = badges.map(b => `
            <div class="flex items-center gap-2 px-3 py-1.5 rounded-full border ${b.cor} text-sm font-semibold shadow-sm cursor-help transition-transform hover:scale-105" title="${b.descricao}">
                <i class="${b.icone}"></i> ${b.titulo}
            </div>
        `).join('');
    }

    renderizarAnomalias(anomaliaInfo) {
        const banner = document.getElementById('anomalia-banner');
        if (!banner) return;

        if (!anomaliaInfo.temAnomalia) {
            banner.innerHTML = `
                <div class="bg-emerald-50 border border-emerald-200 text-emerald-800 p-5 rounded-2xl flex items-center gap-4">
                    <div class="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-lg">
                        <i class="fa-solid fa-shield-halved"></i>
                    </div>
                    <div>
                        <h4 class="font-bold text-base">Ficha Limpa de Comportamento</h4>
                        <p class="text-sm text-emerald-700">Nenhum comportamento atípico ou anomalia composta de presença/gasto foi detectada para este parlamentar.</p>
                    </div>
                </div>
            `;
            banner.classList.remove('hidden');
            return;
        }

        let alertColors = 'bg-amber-50 border-amber-200 text-amber-900';
        let iconColors = 'bg-amber-100 text-amber-600';
        let icon = 'fa-solid fa-triangle-exclamation';

        if (anomaliaInfo.severidade === 'critico') {
            alertColors = 'bg-red-50 border-red-200 text-red-950';
            iconColors = 'bg-red-100 text-red-600';
            icon = 'fa-solid fa-circle-exclamation';
        }

        let anomaliasHTML = anomaliaInfo.anomalias.map(a => `
            <div class="mt-2 text-sm leading-relaxed border-l-2 pl-3 ${a.severidade === 'critico' ? 'border-red-400 text-red-800' : 'border-amber-400 text-amber-800'}">
                <strong>${a.titulo}:</strong> ${a.descricao}
            </div>
        `).join('');

        banner.innerHTML = `
            <div class="${alertColors} border p-5 rounded-2xl flex flex-col sm:flex-row gap-4 print-card">
                <div class="w-12 h-12 rounded-full ${iconColors} flex items-center justify-center text-xl shrink-0">
                    <i class="${icon}"></i>
                </div>
                <div>
                    <h4 class="font-extrabold text-base uppercase tracking-wider">Comportamentos de Risco / Anomalia Detectada</h4>
                    <p class="text-sm opacity-90 mb-2">Este deputado apresenta métricas de atuação atípicas em relação aos padrões médios legislativos:</p>
                    <div class="space-y-1">${anomaliasHTML}</div>
                </div>
            </div>
        `;
        banner.classList.remove('hidden');
    }

    renderizarTabelaVotacoes(votos, orientacoes, siglaPartido) {
        const corpo = document.getElementById('tabela-votacoes-corpo');
        if (!corpo) return;

        if (votos.length === 0) {
            corpo.innerHTML = `
                <tr>
                    <td colspan="5" class="py-10 text-center text-gray-500 font-medium">Nenhuma votacao registrada neste periodo</td>
                </tr>
            `;
            return;
        }

        votos.sort((a, b) => new Date(b.data) - new Date(a.data));
        corpo.innerHTML = '';

        votos.forEach(v => {
            const orientacoesList = orientacoes[v.votacaoId] || [];
            // Busca orientacao: primeiro por sigla exata, depois por federacao que contem a sigla
            const siglaUpper = (siglaPartido || '').toUpperCase();
            let orientacaoPartido = orientacoesList.find(o =>
                o.siglaPartidoBloco && o.siglaPartidoBloco.toUpperCase() === siglaUpper
            );
            if (!orientacaoPartido) {
                orientacaoPartido = orientacoesList.find(o =>
                    o.siglaPartidoBloco && o.siglaPartidoBloco.toUpperCase().includes(siglaUpper)
                );
            }
            const orientacaoVoto = orientacaoPartido ? (orientacaoPartido.orientacaoVoto || '') : '';

            let badgeVotoClass = 'bg-gray-100 text-gray-700 border-gray-200';
            let votoTexto = v.voto || 'Ausente';
            if (v.voto === 'Sim') badgeVotoClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
            else if (v.voto === 'Não' || v.voto === 'Nao') badgeVotoClass = 'bg-red-50 text-red-700 border-red-200';
            else if (v.voto === 'Abstenção' || v.voto === 'Abstencao') badgeVotoClass = 'bg-yellow-50 text-yellow-700 border-yellow-200';
            else if (v.voto === 'Obstrução' || v.voto === 'Obstrucao') badgeVotoClass = 'bg-amber-50 text-amber-700 border-amber-200';
            else if (v.voto === 'Ausente') badgeVotoClass = 'bg-gray-200 text-gray-600 border-gray-300';

            let orientacaoExibicao = '-';
            if (orientacaoPartido) {
                orientacaoExibicao = orientacaoVoto || 'Sem Orientação';
            } else {
                orientacaoExibicao = 'Sem Orientação';
            }

            let badgeAlinhamentoHTML = `<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">Sem Dados</span>`;

            if (orientacaoPartido && orientacaoVoto && orientacaoVoto !== 'Liberado') {
                const votoNormalizado = window.analytics._normalizarVoto(v.voto);
                const orientacaoNormalizada = window.analytics._normalizarVoto(orientacaoVoto);

                if (votoNormalizado && orientacaoNormalizada) {
                    if (votoNormalizado === orientacaoNormalizada) {
                        badgeAlinhamentoHTML = `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><i class="fa-solid fa-circle-check"></i> Alinhado</span>`;
                    } else {
                        badgeAlinhamentoHTML = `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200"><i class="fa-solid fa-circle-xmark"></i> Divergente</span>`;
                    }
                }
            } else if (orientacaoPartido && orientacaoVoto === 'Liberado') {
                badgeAlinhamentoHTML = `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">Partido Liberou</span>`;
            }

            const dataFormatada = v.data ? new Date(v.data).toLocaleDateString('pt-BR') : '-';

            const tr = document.createElement('tr');
            tr.className = 'hover:bg-teal-50/40 cursor-pointer transition border-b border-gray-100';
            tr.innerHTML = `
                <td class="py-4 px-6 font-semibold text-gray-600">${dataFormatada}</td>
                <td class="py-4 px-6 pr-8 font-medium text-gray-900 leading-snug">${v.descricao}</td>
                <td class="py-4 px-6 text-center">
                    <span class="px-2.5 py-1 rounded-lg text-xs font-semibold border ${badgeVotoClass}">${votoTexto}</span>
                </td>
                <td class="py-4 px-6 text-center font-semibold text-gray-700">${orientacaoExibicao}</td>
                <td class="py-4 px-6 text-center">${badgeAlinhamentoHTML}</td>
            `;
            tr.addEventListener('click', () => {
                if (this._onVotacaoClickCallback) {
                    this._onVotacaoClickCallback(v.votacaoId, v.proposicaoId);
                }
            });
            corpo.appendChild(tr);
        });
    }

    renderizarGraficos(despesas, eventos, sessoesPlenario) {
        const gastosPorCategoria = {};
        despesas.forEach(d => {
            const valor = parseFloat(d.valorDocumento || d.valorLiquido || 0);
            const tipo = d.tipoDespesa || 'Outros';
            gastosPorCategoria[tipo] = (gastosPorCategoria[tipo] || 0) + valor;
        });

        const sortedCategorias = Object.entries(gastosPorCategoria).sort((a, b) => b[1] - a[1]).slice(0, 8);
        const catLabels = sortedCategorias.map(item => item[0]);
        const catValues = sortedCategorias.map(item => item[1]);

        this._renderizarGraficoCategorias(catLabels, catValues);

        const gastosMensais = Array(12).fill(0);
        despesas.forEach(d => {
            if (d.mes && d.mes >= 1 && d.mes <= 12) {
                gastosMensais[d.mes - 1] += parseFloat(d.valorDocumento || d.valorLiquido || 0);
            }
        });

        const labelsMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        this._renderizarGraficoEvolucaoMensal(labelsMeses, gastosMensais);

        const presencaMensal = Array(12).fill(0);
        eventos.filter(e => e.descricaoTipo && e.descricaoTipo.toLowerCase().includes('deliberativa')).forEach(e => {
            const dataStr = e.dataHoraInicio;
            if (dataStr) {
                const mes = new Date(dataStr).getMonth();
                if (mes >= 0 && mes <= 11) {
                    presencaMensal[mes]++;
                }
            }
        });

        // Calcula dinamicamente as sessões oficiais deliberativas ocorridas no plenário por mês
        const sessoesPlanejadasMes = Array(12).fill(0);
        (sessoesPlenario || []).filter(e => 
            e.descricaoTipo && e.descricaoTipo.toLowerCase().includes('deliberativa')
        ).forEach(e => {
            const dataStr = e.dataHoraInicio;
            if (dataStr) {
                const mes = new Date(dataStr).getMonth();
                if (mes >= 0 && mes <= 11) {
                    sessoesPlanejadasMes[mes]++;
                }
            }
        });

        // Garante consistência estatística (sessões ocorridas nunca é menor que presenças reais do deputado)
        for (let i = 0; i < 12; i++) {
            sessoesPlanejadasMes[i] = Math.max(sessoesPlanejadasMes[i], presencaMensal[i]);
        }

        this._renderizarGraficoPresenca(labelsMeses, presencaMensal, sessoesPlanejadasMes);
    }

    _renderizarGraficoCategorias(labels, values) {
        const ctx = document.getElementById('graficoDespesas');
        if (!ctx) return;
        if (this.chartDespesas) this.chartDespesas.destroy();

        const colors = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6'];
        this.chartDespesas = new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 10, font: { family: 'Inter', size: 11 } } },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ` R$ ${context.raw.toLocaleString('pt-BR', {maximumFractionDigits:2})}`;
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }

    _renderizarGraficoEvolucaoMensal(labels, values) {
        const ctx = document.getElementById('graficoEvolucaoGastos');
        if (!ctx) return;
        if (this.chartEvolucaoGastos) this.chartEvolucaoGastos.destroy();

        this.chartEvolucaoGastos = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Cota Gasta (R$)',
                    data: values,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 4,
                    pointBackgroundColor: '#3b82f6'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { callback: function(value) { return 'R$ ' + (value/1000).toFixed(0) + 'k'; } }
                    }
                }
            }
        });
    }

    _renderizarGraficoPresenca(labels, presencas, totais) {
        const ctx = document.getElementById('graficoPresenca');
        if (!ctx) return;
        if (this.chartPresenca) this.chartPresenca.destroy();

        const totalSessoes = totais.reduce((a, b) => a + b, 0);
        const canvasContainer = ctx.parentElement;
        const noDataOverlayId = 'graficoPresenca-no-data';
        let overlay = document.getElementById(noDataOverlayId);

        if (totalSessoes === 0) {
            ctx.classList.add('hidden');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = noDataOverlayId;
                overlay.className = 'flex flex-col items-center justify-center h-full text-gray-500 font-medium py-10';
                overlay.innerHTML = `
                    <i class="fa-solid fa-chart-bar text-gray-300 text-3xl mb-2"></i>
                    <span>Sem dados de presença para o período selecionado</span>
                `;
                canvasContainer.appendChild(overlay);
            } else {
                overlay.classList.remove('hidden');
            }
            return;
        } else {
            ctx.classList.remove('hidden');
            if (overlay) {
                overlay.classList.add('hidden');
            }
        }

        const ausencias = totais.map((t, idx) => Math.max(0, t - presencas[idx]));

        this.chartPresenca = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Presenças Registradas',
                        data: presencas,
                        backgroundColor: '#10b981',
                        borderRadius: 4
                    },
                    {
                        label: 'Ausências Registradas',
                        data: ausencias,
                        backgroundColor: '#ef4444',
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top', labels: { boxWidth: 12, font: { family: 'Inter' } } } },
                scales: { y: { beginAtZero: true, ticks: { stepSize: 2 } } }
            }
        });
    }

    atualizarBotaoRadar(btn, isMonitored) {
        if (!btn) return;
        if (isMonitored) {
            btn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Acompanhando no Radar`;
            btn.className = "flex items-center justify-center gap-2 bg-teal-800 hover:bg-teal-900 text-white py-2.5 px-6 rounded-lg text-sm font-semibold transition-all shadow-sm";
        } else {
            btn.innerHTML = `<i class="fa-solid fa-eye"></i> Acompanhar no Radar`;
            btn.className = "flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 px-6 rounded-lg text-sm font-semibold transition-all";
        }
    }

    onApagarComentarioClick(callback) {
        this._onApagarComentarioCallback = callback;
    }

    onFiltroAnoChange(callback) {
        const selectAno = document.getElementById('global-filtro-ano');
        const selectMes = document.getElementById('global-filtro-mes');

        const handler = () => {
            const ano = selectAno ? parseInt(selectAno.value) : 2026;
            const mes = selectMes && selectMes.value ? parseInt(selectMes.value) : null;
            callback(ano, mes);
        };

        if (selectAno) selectAno.addEventListener('change', handler);
        if (selectMes) selectMes.addEventListener('change', handler);
    }

    onSalvarAvaliacaoClick(callback) {
        const btn = document.getElementById('btn-salvar-avaliacao-perfil');
        if (btn) {
            btn.addEventListener('click', () => {
                const comentario = document.getElementById('perfil-comentario').value;
                callback(comentario);
            });
        }
    }

    onEstrelaClick(callback) {
        const estrelas = document.querySelectorAll('.estrela-perfil-btn');
        estrelas.forEach(estrela => {
            estrela.addEventListener('click', (e) => {
                const nota = parseInt(e.currentTarget.getAttribute('data-nota'));
                callback(nota);
            });
        });
    }

    atualizarEstrelasPerfil(nota) {
        const estrelas = document.querySelectorAll('.estrela-perfil-btn');
        estrelas.forEach(estrela => {
            const valor = parseInt(estrela.getAttribute('data-nota'));
            if (valor <= nota) {
                estrela.classList.remove('text-gray-300');
                estrela.classList.add('text-yellow-400');
            } else {
                estrela.classList.add('text-gray-300');
                estrela.classList.remove('text-yellow-400');
            }
        });
    }

    mostrarErroAvaliacao(msg) {
        const errEl = document.getElementById('perfil-avaliacao-erro');
        if (errEl) {
            if (msg) {
                errEl.textContent = msg;
                errEl.classList.remove('hidden');
            } else {
                errEl.classList.add('hidden');
            }
        }
    }

    renderizarComentarios(comentarios, media) {
        const container = document.getElementById('comentarios-container');
        const mediaLabel = document.getElementById('media-avaliacao-label');
        
        if (mediaLabel) {
            mediaLabel.textContent = media > 0 
                ? `Média: ${media.toFixed(1)} / 5 ★` 
                : "Sem avaliações";
        }

        if (!container) return;

        if (comentarios.length === 0) {
            container.innerHTML = `<p class="text-gray-500 text-center py-10 font-medium">Nenhuma avaliação enviada para este deputado.</p>`;
            return;
        }

        const currentUser = window.Back4AppService ? window.Back4AppService.getCurrentUser() : null;
        const currentUsername = currentUser ? currentUser.get("username") : null;

        container.innerHTML = '';
        comentarios.forEach(c => {
            const dateStr = c.createdAt 
                ? new Date(c.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                : '-';
            
            const estrelasHTML = Array(5).fill(0).map((_, i) => `
                <i class="fa-solid fa-star text-sm ${i < c.nota ? 'text-yellow-400' : 'text-gray-200'}"></i>
            `).join('');

            const isOwnComment = currentUsername && c.username === currentUsername;
            let ownCommentActionsHTML = "";

            if (isOwnComment) {
                ownCommentActionsHTML = `
                    <div class="flex justify-between items-center mt-1 border-t border-gray-200/50 pt-2 no-print">
                        <span class="text-xs text-teal-600 font-bold flex items-center gap-1"><i class="fa-solid fa-user-pen"></i> Sua avaliação</span>
                        <div class="flex gap-3">
                            <button class="text-teal-600 hover:text-teal-800 font-bold text-xs flex items-center gap-1 btn-editar-comentario" data-nota="${c.nota}" data-comentario="${c.comentario.replace(/"/g, '&quot;')}">
                                <i class="fa-solid fa-pen text-[10px]"></i> Editar
                            </button>
                            <button class="text-red-500 hover:text-red-700 font-bold text-xs flex items-center gap-1 btn-apagar-comentario">
                                <i class="fa-solid fa-trash text-[10px]"></i> Apagar
                            </button>
                        </div>
                    </div>
                `;
            }

            const div = document.createElement('div');
            div.className = 'p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-2';
            div.innerHTML = `
                <div class="flex justify-between items-center">
                    <span class="font-bold text-gray-800 text-sm">${c.username}</span>
                    <span class="text-xs text-gray-400 font-medium">${dateStr}</span>
                </div>
                <div class="flex gap-1">${estrelasHTML}</div>
                <p class="text-sm text-gray-600 font-medium leading-relaxed break-words">${c.comentario || '<span class="italic text-gray-400">Sem comentário escrito.</span>'}</p>
                ${ownCommentActionsHTML}
            `;
            container.appendChild(div);
        });

        // Setup event listeners para deletar
        container.querySelectorAll('.btn-apagar-comentario').forEach(btn => {
            btn.addEventListener('click', () => {
                if (confirm("Tem certeza que deseja apagar sua avaliação? Isso removerá sua nota e comentário permanentemente.")) {
                    if (this._onApagarComentarioCallback) this._onApagarComentarioCallback();
                }
            });
        });

        // Setup event listeners para editar
        container.querySelectorAll('.btn-editar-comentario').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const nota = parseInt(e.currentTarget.getAttribute('data-nota'));
                const comentario = e.currentTarget.getAttribute('data-comentario');
                
                this.preencherMinhaAvaliacao(nota, comentario);
                
                const formEl = document.getElementById('perfil-estrelas-container');
                if (formEl) {
                    formEl.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    preencherMinhaAvaliacao(nota, comentario) {
        this.atualizarEstrelasPerfil(nota);
        const commentEl = document.getElementById('perfil-comentario');
        if (commentEl) commentEl.value = comentario || '';
    }

    renderizarProposicoes(proposicoes, votosMap) {
        const container = document.getElementById('proposicoes-container');
        if (!container) return;

        if (proposicoes.length === 0) {
            container.innerHTML = `<p class="text-gray-500 col-span-full text-center py-10 font-medium">Nenhum projeto de lei recente encontrado para este deputado.</p>`;
            return;
        }

        // Mostra no máximo 6 proposições recentes
        const propToShow = proposicoes.slice(0, 6);

        container.innerHTML = '';
        propToShow.forEach(p => {
            const dateStr = p.dataEnvio || p.dataApresentacao || p.data || '';
            const dataFormatada = dateStr 
                ? new Date(dateStr).toLocaleDateString('pt-BR')
                : '-';

            const votoInfo = votosMap[p.id] || { apoios: 0, rejeicoes: 0, meuVoto: null };
            const apoios = votoInfo.apoios;
            const rejeicoes = votoInfo.rejeicoes;
            const meuVoto = votoInfo.meuVoto;

            let btnApoiarClass = 'bg-white text-green-700 border-green-200 hover:bg-green-50';
            if (meuVoto === "Apoio") {
                btnApoiarClass = 'bg-green-600 text-white border-green-600 hover:bg-green-700';
            }

            let btnRejeitarClass = 'bg-white text-red-700 border-red-200 hover:bg-red-50';
            if (meuVoto === "Rejeito") {
                btnRejeitarClass = 'bg-red-600 text-white border-red-600 hover:bg-red-700';
            }

            const div = document.createElement('div');
            div.className = 'bg-gray-50 p-5 rounded-2xl border border-gray-100 flex flex-col justify-between hover:shadow-md transition';
            div.innerHTML = `
                <div>
                    <div class="flex justify-between items-start mb-2">
                        <span class="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-bold border border-teal-100">
                            ${p.siglaTipo} ${p.numero}/${p.ano}
                        </span>
                        <span class="text-xs text-gray-400 font-semibold">${dataFormatada}</span>
                    </div>
                    <p class="text-sm font-semibold text-gray-900 mb-3 line-clamp-3 leading-relaxed cursor-pointer hover:text-teal-600 transition prop-title-click" data-id="${p.id}" title="Clique para ler a ementa completa">
                        ${p.ementa}
                    </p>
                </div>
                
                <!-- Termômetro de Votos -->
                <div class="border-t border-gray-200/60 pt-4 mt-2 flex items-center justify-between">
                    <span class="text-xs text-gray-400 font-bold uppercase tracking-wider">Termômetro</span>
                    <div class="flex gap-2" id="votos-wrapper-${p.id}">
                        <!-- Botão Apoiar -->
                        <button class="btn-votar flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${btnApoiarClass}" data-id="${p.id}" data-voto="Apoio">
                            <i class="fa-solid fa-thumbs-up"></i> Apoiar <span class="bg-white/80 text-gray-700 px-2 py-0.5 rounded-full text-[10px] ml-0.5" id="apoio-count-${p.id}">${apoios}</span>
                        </button>
                        <!-- Botão Rejeitar -->
                        <button class="btn-votar flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${btnRejeitarClass}" data-id="${p.id}" data-voto="Rejeito">
                            <i class="fa-solid fa-thumbs-down"></i> Rejeitar <span class="bg-white/80 text-gray-700 px-2 py-0.5 rounded-full text-[10px] ml-0.5" id="rejeito-count-${p.id}">${rejeicoes}</span>
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(div);
        });

        // Event listener setup
        if (this._onVotoCallback) {
            const botoesVoto = container.querySelectorAll('.btn-votar');
            botoesVoto.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = parseInt(e.currentTarget.getAttribute('data-id'));
                    const voto = e.currentTarget.getAttribute('data-voto');
                    this._onVotoCallback(id, voto, e.currentTarget);
                });
            });
        }

        if (this._onAbrirModalCallback) {
            const titles = container.querySelectorAll('.prop-title-click');
            titles.forEach(t => {
                t.addEventListener('click', (e) => {
                    const id = parseInt(e.currentTarget.getAttribute('data-id'));
                    this._onAbrirModalCallback(id);
                });
            });
        }
    }

    onVotarProposicaoClick(callback) {
        this._onVotoCallback = callback;
    }

    atualizarVotosCard(proposicaoId, apoios, rejeicoes, meuVoto) {
        const wrapper = document.getElementById(`votos-wrapper-${proposicaoId}`);
        if (!wrapper) return;

        let btnApoiarClass = 'bg-white text-green-700 border-green-200 hover:bg-green-50';
        if (meuVoto === "Apoio") {
            btnApoiarClass = 'bg-green-600 text-white border-green-600 hover:bg-green-700';
        }

        let btnRejeitarClass = 'bg-white text-red-700 border-red-200 hover:bg-red-50';
        if (meuVoto === "Rejeito") {
            btnRejeitarClass = 'bg-red-600 text-white border-red-600 hover:bg-red-700';
        }

        wrapper.innerHTML = `
            <!-- Botão Apoiar -->
            <button class="btn-votar flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${btnApoiarClass}" data-id="${proposicaoId}" data-voto="Apoio">
                <i class="fa-solid fa-thumbs-up"></i> Apoiar <span class="bg-white/80 text-gray-700 px-2 py-0.5 rounded-full text-[10px] ml-0.5" id="apoio-count-${proposicaoId}">${apoios}</span>
            </button>
            <!-- Botão Rejeitar -->
            <button class="btn-votar flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${btnRejeitarClass}" data-id="${proposicaoId}" data-voto="Rejeito">
                <i class="fa-solid fa-thumbs-down"></i> Rejeitar <span class="bg-white/80 text-gray-700 px-2 py-0.5 rounded-full text-[10px] ml-0.5" id="rejeito-count-${proposicaoId}">${rejeicoes}</span>
            </button>
        `;

        // Re-bind listeners
        const buttons = wrapper.querySelectorAll('.btn-votar');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                const voto = e.currentTarget.getAttribute('data-voto');
                if (this._onVotoCallback) {
                    this._onVotoCallback(id, voto, e.currentTarget);
                }
            });
        });
    }

    onFiltroProposicaoChange(callback) {
        const selectTipo = document.getElementById('filtro-tipo-proposicao');
        const selectAno = document.getElementById('filtro-ano-proposicao');
        
        const handler = () => {
            const tipo = selectTipo ? selectTipo.value : '';
            const ano = selectAno ? selectAno.value : '';
            callback(tipo, ano);
        };

        if (selectTipo) selectTipo.addEventListener('change', handler);
        if (selectAno) selectAno.addEventListener('change', handler);
    }

    onAbrirModalProposicaoClick(callback) {
        this._onAbrirModalCallback = callback;
    }

    abrirModalProposicao(p, votoInfo) {
        const modal = document.getElementById('proposicao-modal');
        if (!modal) return;
        
        document.getElementById('modal-prop-sigla').textContent = `${p.siglaTipo} ${p.numero}/${p.ano}`;
        document.getElementById('modal-prop-ementa').textContent = p.ementa;
        
        const dateStr = p.dataEnvio || p.dataApresentacao || p.data || '';
        document.getElementById('modal-prop-data').textContent = dateStr ? new Date(dateStr).toLocaleDateString('pt-BR') : '-';
        document.getElementById('modal-prop-tema').textContent = p.ementa.length > 50 ? 'Geral' : '-';
        document.getElementById('modal-prop-link').href = `https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=${p.id}`;

        this.atualizarTermometroModal(p.id, votoInfo);

        modal.classList.remove('hidden');

        const fechar = document.getElementById('close-proposicao-modal');
        const fecharFn = () => modal.classList.add('hidden');
        fechar.onclick = fecharFn;
        modal.onclick = (e) => { if (e.target === modal) fecharFn(); };
    }

    atualizarTermometroModal(proposicaoId, votoInfo) {
        const termo = document.getElementById('modal-prop-termometro');
        if (!termo) return;

        const apoios = votoInfo.apoios;
        const rejeicoes = votoInfo.rejeicoes;
        const meuVoto = votoInfo.meuVoto;

        let btnApoiarClass = 'bg-white text-green-700 border-green-200 hover:bg-green-50';
        if (meuVoto === "Apoio") btnApoiarClass = 'bg-green-600 text-white border-green-600 hover:bg-green-700';

        let btnRejeitarClass = 'bg-white text-red-700 border-red-200 hover:bg-red-50';
        if (meuVoto === "Rejeito") btnRejeitarClass = 'bg-red-600 text-white border-red-600 hover:bg-red-700';

        termo.innerHTML = `
            <button class="btn-votar-modal flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all border ${btnApoiarClass} shadow-sm" data-id="${proposicaoId}" data-voto="Apoio">
                <i class="fa-solid fa-thumbs-up"></i> Apoiar <span class="bg-white/80 text-gray-700 px-2.5 py-0.5 rounded-full text-xs ml-1" id="modal-apoio-count">${apoios}</span>
            </button>
            <button class="btn-votar-modal flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all border ${btnRejeitarClass} shadow-sm" data-id="${proposicaoId}" data-voto="Rejeito">
                <i class="fa-solid fa-thumbs-down"></i> Rejeitar <span class="bg-white/80 text-gray-700 px-2.5 py-0.5 rounded-full text-xs ml-1" id="modal-rejeito-count">${rejeicoes}</span>
            </button>
        `;

        if (this._onVotoCallback) {
            termo.querySelectorAll('.btn-votar-modal').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = parseInt(e.currentTarget.getAttribute('data-id'));
                    const voto = e.currentTarget.getAttribute('data-voto');
                    this._onVotoCallback(id, voto, e.currentTarget, true); // true = isFromModal
                });
            });
        }
    }

    renderizarBeneficiosRH(orgaos, frentes, historico) {
        // Orgaos e Comissoes
        const orgaosContainer = document.getElementById('orgaos-container');
        const orgaosCount = document.getElementById('orgaos-count');
        if (orgaosCount) orgaosCount.textContent = orgaos ? orgaos.length : 0;

        if (orgaosContainer) {
            if (!orgaos || orgaos.length === 0) {
                orgaosContainer.innerHTML = '<p class="text-gray-400 text-center py-4 font-medium text-sm">Nenhum orgao encontrado.</p>';
            } else {
                orgaosContainer.innerHTML = orgaos.map(o => {
                    const titulo = o.titulo || o.nomeOrgao || 'Sem titulo';
                    const sigla = o.siglaOrgao || '';
                    const cargo = o.titulo || '';
                    const nomeOrgao = o.nomeOrgao || sigla;
                    return `
                        <div class="p-3 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-sm transition">
                            <div class="flex items-center gap-2">
                                <span class="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">${sigla}</span>
                                <span class="text-sm font-semibold text-gray-800 truncate" title="${nomeOrgao}">${nomeOrgao}</span>
                            </div>
                            ${cargo ? `<p class="text-xs text-gray-500 mt-1 pl-1">${cargo}</p>` : ''}
                        </div>
                    `;
                }).join('');
            }
        }

        // Frentes Parlamentares
        const frentesContainer = document.getElementById('frentes-container');
        const frentesCount = document.getElementById('frentes-count');
        if (frentesCount) frentesCount.textContent = frentes ? frentes.length : 0;

        if (frentesContainer) {
            if (!frentes || frentes.length === 0) {
                frentesContainer.innerHTML = '<p class="text-gray-400 text-center py-4 font-medium text-sm">Nenhuma frente parlamentar encontrada.</p>';
            } else {
                frentesContainer.innerHTML = frentes.map(f => {
                    const titulo = f.titulo || 'Frente sem titulo';
                    return `
                        <div class="p-3 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-sm transition">
                            <p class="text-sm font-semibold text-gray-800 leading-snug">${titulo}</p>
                        </div>
                    `;
                }).join('');
            }
        }

        // Historico Parlamentar
        const historicoContainer = document.getElementById('historico-container');
        if (historicoContainer) {
            if (!historico || historico.length === 0) {
                historicoContainer.innerHTML = '<p class="text-gray-400 text-center py-4 font-medium text-sm">Nenhum registro de historico encontrado.</p>';
            } else {
                historicoContainer.innerHTML = historico.map(h => {
                    const dataInicio = h.dataHoraInicio ? new Date(h.dataHoraInicio).toLocaleDateString('pt-BR') : '-';
                    const dataFim = h.dataHoraFim ? new Date(h.dataHoraFim).toLocaleDateString('pt-BR') : 'Atual';
                    const situacao = h.descricaoStatus || h.situacao || '';
                    const condicao = h.condicaoEleitoral || '';
                    const partido = h.siglaPartidoBloco || '';
                    const uf = h.siglaUfRepresentacaoAtual || '';

                    return `
                        <div class="p-3 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-sm transition">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    ${partido ? `<span class="text-xs font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full border border-violet-100">${partido}</span>` : ''}
                                    ${uf ? `<span class="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">${uf}</span>` : ''}
                                </div>
                                <span class="text-xs text-gray-400 font-medium">${dataInicio} - ${dataFim}</span>
                            </div>
                            ${situacao ? `<p class="text-xs text-gray-600 mt-1">${situacao} ${condicao ? '(' + condicao + ')' : ''}</p>` : ''}
                        </div>
                    `;
                }).join('');
            }
        }
    }

    onVotacaoClick(callback) {
        this._onVotacaoClickCallback = callback;
    }

    abrirModalVotacaoLoading() {
        if (!this.modalVotacao) return;
        this.modalVotacao.classList.remove('hidden');

        const titulo = document.getElementById('modal-vot-titulo');
        const ementa = document.getElementById('modal-vot-ementa');
        const autores = document.getElementById('modal-vot-autores');
        const placarSim = document.getElementById('modal-vot-placar-sim');
        const placarNao = document.getElementById('modal-vot-placar-nao');
        const placarAbst = document.getElementById('modal-vot-placar-abst');
        const link = document.getElementById('modal-vot-link');

        if (titulo) titulo.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin text-teal-600"></i> Carregando...';
        if (ementa) ementa.textContent = 'Buscando detalhes do projeto na Câmara...';
        if (autores) autores.textContent = 'Buscando autores...';
        if (placarSim) placarSim.textContent = '-';
        if (placarNao) placarNao.textContent = '-';
        if (placarAbst) placarAbst.textContent = '-';
        if (link) link.classList.add('hidden');
    }

    renderizarModalVotacao(votacaoId, prop, placar, autores, realPropId) {
        if (!this.modalVotacao) return;

        const titulo = document.getElementById('modal-vot-titulo');
        const ementa = document.getElementById('modal-vot-ementa');
        const autoresEl = document.getElementById('modal-vot-autores');
        const placarSim = document.getElementById('modal-vot-placar-sim');
        const placarNao = document.getElementById('modal-vot-placar-nao');
        const placarAbst = document.getElementById('modal-vot-placar-abst');
        const link = document.getElementById('modal-vot-link');

        if (prop) {
            const sigla = prop.siglaTipo || 'Votação';
            const num = prop.numero ? ` ${prop.numero}` : '';
            const ano = prop.ano ? `/${prop.ano}` : '';
            if (titulo) titulo.textContent = `${sigla}${num}${ano}`;
            if (ementa) ementa.textContent = prop.ementa || 'Sem ementa cadastrada.';
        } else {
            if (titulo) titulo.textContent = `Votação ${votacaoId}`;
            if (ementa) ementa.textContent = 'Não foi possível encontrar uma proposição diretamente associada.';
        }

        if (autoresEl) autoresEl.textContent = autores || 'Não informado';

        if (placarSim) placarSim.textContent = placar.sim || 0;
        if (placarNao) placarNao.textContent = placar.nao || 0;
        if (placarAbst) placarAbst.textContent = placar.abstencao || 0;

        if (link && realPropId) {
            link.href = `https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao=${realPropId}`;
            link.classList.remove('hidden');
        } else if (link) {
            link.classList.add('hidden');
        }
    }

    onEnviarOpiniaoClick(callback) {
        const btnEl = document.getElementById('btn-enviar-opiniao');
        const inputEl = document.getElementById('forum-opiniao-input');
        
        const triggerCallback = () => {
            const listaEl = document.getElementById('forum-opinioes-lista');
            const proposicaoId = listaEl ? listaEl.dataset.proposicaoId : null;
            const texto = inputEl ? inputEl.value.trim() : '';
            if (proposicaoId && texto) {
                callback(proposicaoId, texto);
            } else if (!texto) {
                alert("Por favor, digite sua opinião.");
            }
        };

        if (btnEl) {
            btnEl.addEventListener('click', triggerCallback);
        }
        if (inputEl) {
            inputEl.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    triggerCallback();
                }
            });
        }
    }

    renderizarOpinioesForum(opinioes, realPropId) {
        const inputEl = document.getElementById('forum-opiniao-input');
        const btnEl = document.getElementById('btn-enviar-opiniao');
        const listaEl = document.getElementById('forum-opinioes-lista');

        if (!listaEl) return;

        if (inputEl) inputEl.value = '';

        if (!realPropId) {
            if (inputEl) inputEl.disabled = true;
            if (btnEl) btnEl.disabled = true;
            listaEl.innerHTML = '<p class="text-gray-500 text-xs text-center py-4">Sem proposicao associada para opinar.</p>';
            return;
        }

        if (inputEl) inputEl.disabled = false;
        if (btnEl) btnEl.disabled = false;

        listaEl.dataset.proposicaoId = realPropId;

        if (!opinioes || opinioes.length === 0) {
            listaEl.innerHTML = '<p class="text-gray-400 text-xs text-center py-4">Nenhuma opiniao enviada ainda. Seja o primeiro a comentar!</p>';
            return;
        }

        listaEl.innerHTML = '';
        opinioes.forEach(op => {
            const dateStr = op.createdAt ? new Date(op.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '';
            
            const itemEl = document.createElement('div');
            itemEl.className = 'bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs flex flex-col gap-1';
            itemEl.innerHTML = `
                <div class="flex justify-between items-center text-gray-500 font-bold">
                    <span><i class="fa-solid fa-user text-teal-600"></i> ${op.usuario}</span>
                    <span>${dateStr}</span>
                </div>
                <p class="text-gray-850 font-medium leading-relaxed">${op.texto}</p>
            `;
            listaEl.appendChild(itemEl);
        });
    }

    renderizarBeneficios(beneficios) {
        const secretariosEl = document.getElementById('benef-secretarios');
        const salarioEl = document.getElementById('benef-salario');
        const auxilioEl = document.getElementById('benef-auxilio');
        const imovelEl = document.getElementById('benef-imovel');
        const viagensEl = document.getElementById('benef-viagens');
        const passaporteEl = document.getElementById('benef-passaporte');
        const emendasValorEl = document.getElementById('benef-emendas-valor');
        const emendasStatusEl = document.getElementById('benef-emendas-status');

        if (secretariosEl) {
            secretariosEl.textContent = beneficios 
                ? `${beneficios.secretariosAtivos} comissionado(s) (Ativos: ${beneficios.secretariosAtivos} / Total: ${beneficios.secretariosTotal})` 
                : 'Sem dados';
        }

        if (salarioEl) {
            salarioEl.textContent = beneficios 
                ? beneficios.salarioBruto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) 
                : 'Sem dados';
        }

        if (auxilioEl) {
            auxilioEl.textContent = beneficios ? beneficios.auxilioMoradia : 'Sem dados';
        }

        if (imovelEl) {
            imovelEl.textContent = beneficios ? beneficios.imovelFuncional : 'Sem dados';
        }

        if (viagensEl) {
            viagensEl.textContent = beneficios 
                ? `${beneficios.missoesCount} viagem(ns)` 
                : 'Sem dados';
        }

        if (passaporteEl) {
            passaporteEl.textContent = beneficios ? beneficios.passaporte : 'Sem dados';
        }

        if (emendasValorEl) {
            emendasValorEl.textContent = beneficios 
                ? beneficios.emendasValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) 
                : 'Sem dados';
        }

        if (emendasStatusEl && beneficios) {
            emendasStatusEl.textContent = beneficios.emendasStatus;
            let badgeClass = 'bg-gray-50 text-gray-700 border-gray-200';
            if (beneficios.emendasStatus.includes('100%')) {
                badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
            } else if (beneficios.emendasStatus.includes('Execucao')) {
                badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
            } else {
                badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
            }
            emendasStatusEl.className = `text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badgeClass}`;
        }
    }

    fecharModalVotacao() {
        if (this.modalVotacao) {
            this.modalVotacao.classList.add('hidden');
        }
    }
}

window.PerfilDeputadoView = PerfilDeputadoView;
