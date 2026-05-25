/**
 * View do Perfil do Partido (partido-perfil.html)
 * Manipula DOM: cabeçalho do partido, lista de membros da bancada.
 */
class PartidoPerfilView {
    constructor() {
        this.loadingState = document.getElementById('loading-state');
        this.errorState = document.getElementById('error-state');
        this.partidoContent = document.getElementById('partido-content');
        this.errorMessage = document.getElementById('error-message');
        
        this.logo = document.getElementById('partido-logo-perfil');
        this.nome = document.getElementById('partido-nome-perfil');
        this.membrosCount = document.getElementById('partido-membros-count');
        this.coesaoBadge = document.getElementById('partido-coesao-badge');
        this.grid = document.getElementById('membros-grid');

        // Novos elementos da Wikipedia
        this.wikiEspectro = document.getElementById('partido-espectro');
        this.wikiIdeologia = document.getElementById('partido-ideologia');
        this.wikiResumo = document.getElementById('partido-resumo-wiki');
        this.wikiLink = document.getElementById('wiki-link');

        // Novos elementos Financeiros
        this.filtroAno = document.getElementById('filtro-ano-partido');
        this.totalGastoBancada = document.getElementById('total-gasto-bancada');
        this.mediaGastoBancada = document.getElementById('media-gasto-bancada');
        this.anoFinanceiroDisplay = document.getElementById('ano-financeiro-display');
        this.canvasFinance = document.getElementById('financeChart');

        // Grafico de espectro ideologico interno
        this.canvasEspectroInterno = document.getElementById('espectroInternoChart');

        // Instancias de Chart.js
        this.financeChartInstance = null;
        this.espectroChartInstance = null;

        // Callbacks
        this.onFiltroAnoChange = null;

        this._bindEvents();
    }

    _bindEvents() {
        if (this.filtroAno) {
            this.filtroAno.addEventListener('change', (e) => {
                if (this.onFiltroAnoChange) {
                    this.onFiltroAnoChange(e.target.value);
                }
            });
        }
    }

    mostrarCarregamento() {
        if (this.loadingState) this.loadingState.classList.remove('hidden');
        if (this.partidoContent) this.partidoContent.classList.add('hidden');
        if (this.errorState) this.errorState.classList.add('hidden');
    }

    mostrarErro(msg) {
        if (this.loadingState) this.loadingState.classList.add('hidden');
        if (this.partidoContent) this.partidoContent.classList.add('hidden');
        if (this.errorState) this.errorState.classList.remove('hidden');
        if (this.errorMessage) this.errorMessage.textContent = msg;
    }

    mostrarConteudo() {
        if (this.loadingState) this.loadingState.classList.add('hidden');
        if (this.errorState) this.errorState.classList.add('hidden');
        if (this.partidoContent) {
            this.partidoContent.classList.remove('hidden');
            this.partidoContent.classList.add('flex');
        }
    }

    preencherDadosPerfil(partidoInfo) {
        if (this.logo) {
            this.logo.className = "w-16 h-16 bg-white rounded-2xl flex items-center justify-center border border-gray-200 shrink-0 overflow-hidden";
            const sigla = partidoInfo.sigla;
            const placeholder = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='24' fill='%23f0fdf4'/><text x='50' y='55' font-family='Arial,sans-serif' font-size='28' font-weight='bold' fill='%230f766e' text-anchor='middle' dominant-baseline='middle'>${sigla}</text></svg>`;
            
            this.logo.innerHTML = `
                <img id="partido-logo-img" src="${partidoInfo.urlLogo || ''}" alt="Logo do ${sigla}" class="w-full h-full object-contain p-1" onerror="if (this.dataset.wikiLogo && this.src !== this.dataset.wikiLogo) { this.src = this.dataset.wikiLogo; } else { this.onerror = null; this.outerHTML = '<div id=\\'partido-logo-img\\' class=\\'w-full h-full bg-teal-50 flex items-center justify-center text-teal-700 font-bold border border-teal-100\\'>${sigla}</div>'; }">
            `;
        }
        if (this.nome) this.nome.textContent = partidoInfo.nome || partidoInfo.sigla;
        if (this.membrosCount) this.membrosCount.textContent = partidoInfo.totalMembros;

        if (this.coesaoBadge) {
            let coesaoBadgeClass = 'bg-gray-100 text-gray-700 border-gray-200';
            let coesaoTexto = 'Sem dados';

            if (partidoInfo.coesao !== undefined && partidoInfo.coesao !== null) {
                if (partidoInfo.coesao >= 90) {
                    coesaoBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    coesaoTexto = `${partidoInfo.coesao}% (Alta)`;
                } else if (partidoInfo.coesao >= 70) {
                    coesaoBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
                    coesaoTexto = `${partidoInfo.coesao}% (Média)`;
                } else {
                    coesaoBadgeClass = 'bg-red-50 text-red-700 border-red-200';
                    coesaoTexto = `${partidoInfo.coesao}% (Baixa)`;
                }
            }
            this.coesaoBadge.textContent = coesaoTexto;
            this.coesaoBadge.className = `inline-block mt-0.5 px-3 py-0.5 rounded-full text-sm font-bold border ${coesaoBadgeClass}`;
        }
    }

    renderizarMembros(membros) {
        if (!this.grid) return;
        this.grid.innerHTML = '';

        if (membros.length === 0) {
            this.grid.innerHTML = `<p class="text-gray-500 col-span-full text-center py-10 font-medium">Nenhum membro ativo encontrado para este partido.</p>`;
            return;
        }

        membros.forEach(m => {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col relative group';
            card.innerHTML = `
                <a href="deputado-perfil.html?id=${m.id}" class="relative pt-[120%] bg-gray-200 block cursor-pointer overflow-hidden">
                    <img src="${m.urlFoto}" alt="Foto de ${m.nome}" class="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300" onerror="this.src='https://via.placeholder.com/150?text=Sem+Foto'" loading="lazy">
                </a>
                <div class="p-5 flex flex-col flex-1">
                    <h4 class="font-bold text-base text-gray-900 mb-1 leading-tight line-clamp-1">
                        <a href="deputado-perfil.html?id=${m.id}" class="hover:text-teal-600 transition-colors">${m.nome}</a>
                    </h4>
                    <p class="text-xs font-semibold text-teal-600 mb-4">${m.siglaPartido} - ${m.siglaUf}</p>
                    
                    <div class="mt-auto">
                        <a href="deputado-perfil.html?id=${m.id}" class="flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-600 py-2 px-3 rounded-xl text-xs font-semibold transition-colors">
                            Ver Análise Completa
                        </a>
                    </div>
                </div>
            `;
            this.grid.appendChild(card);
        });
    }

    preencherWikipedia(wikiData) {
        if (this.wikiEspectro) this.wikiEspectro.textContent = wikiData.espectro || "Nao documentado";
        if (this.wikiIdeologia) this.wikiIdeologia.textContent = wikiData.ideologia || "Nao documentada";
        if (this.wikiResumo) this.wikiResumo.textContent = wikiData.resumo || "Resumo indisponivel.";
        if (this.wikiLink && wikiData.font) {
            this.wikiLink.href = wikiData.font;
            this.wikiLink.classList.remove('hidden');
        }

        const logoImg = document.getElementById('partido-logo-img');
        if (logoImg && wikiData.logoUrl) {
            logoImg.dataset.wikiLogo = wikiData.logoUrl;
            const sigla = logoImg.alt ? logoImg.alt.replace("Logo do ", "") : (logoImg.textContent || '');
            
            if (logoImg.tagName === 'DIV' || !logoImg.src || logoImg.src.endsWith('undefined') || logoImg.src === window.location.href || logoImg.src.includes('svg+xml')) {
                const parent = logoImg.parentNode;
                if (parent) {
                    parent.innerHTML = `<img id="partido-logo-img" src="${wikiData.logoUrl}" alt="Logo do ${sigla}" class="w-full h-full object-contain p-1" onerror="this.onerror = null; this.outerHTML = '<div id=\\'partido-logo-img\\' class=\\'w-full h-full bg-teal-50 flex items-center justify-center text-teal-700 font-bold border border-teal-100\\'>${sigla}</div>';">`;
                }
            }
        }
    }

    mostrarLoaderFinancas() {
        if (this.totalGastoBancada) this.totalGastoBancada.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-xs"></i>';
        if (this.mediaGastoBancada) this.mediaGastoBancada.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-xs"></i>';
    }

    preencherDadosFinanceiros(financeData, ano) {
        if (this.totalGastoBancada) {
            this.totalGastoBancada.textContent = financeData.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }
        if (this.mediaGastoBancada) {
            this.mediaGastoBancada.textContent = financeData.mediaPorDeputado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }
        if (this.anoFinanceiroDisplay) {
            this.anoFinanceiroDisplay.textContent = `Ano: ${ano}`;
        }

        // Renderizar grafico de rosquinha (doughnut) das categorias de despesas
        if (this.canvasFinance) {
            if (this.financeChartInstance) {
                this.financeChartInstance.destroy();
            }

            const categorias = Object.keys(financeData.porTipo || {});
            const valores = Object.values(financeData.porTipo || {});

            if (valores.length === 0) {
                this.financeChartInstance = new Chart(this.canvasFinance, {
                    type: 'doughnut',
                    data: {
                        labels: ['Sem dados de despesas'],
                        datasets: [{
                            data: [1],
                            backgroundColor: ['rgba(229, 231, 235, 1)'], // gray-200
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        circumference: 180,
                        rotation: -90,
                        plugins: {
                            legend: { position: 'right', labels: { boxWidth: 12, font: { size: 10 } } },
                            tooltip: { callbacks: { label: () => 'Sem dados' } }
                        }
                    }
                });
                return;
            }

            // Seleciona top 5 categorias e agrupa o restante em "Outras Despesas"
            const dataList = categorias.map((cat, idx) => ({ cat, val: valores[idx] }));
            dataList.sort((a, b) => b.val - a.val);

            const topCategories = [];
            const topValues = [];
            let outrosValor = 0;

            dataList.forEach((item, idx) => {
                if (idx < 5) {
                    topCategories.push(item.cat);
                    topValues.push(item.val);
                } else {
                    outrosValor += item.val;
                }
            });

            if (outrosValor > 0) {
                topCategories.push("Outras Despesas");
                topValues.push(outrosValor);
            }

            this.financeChartInstance = new Chart(this.canvasFinance, {
                type: 'doughnut',
                data: {
                    labels: topCategories,
                    datasets: [{
                        data: topValues,
                        backgroundColor: [
                            'rgba(13, 148, 136, 0.8)',
                            'rgba(34, 197, 94, 0.8)',
                            'rgba(59, 130, 246, 0.8)',
                            'rgba(234, 179, 8, 0.8)',
                            'rgba(249, 115, 22, 0.8)',
                            'rgba(156, 163, 175, 0.8)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    circumference: 180,
                    rotation: -90,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                boxWidth: 12,
                                font: { size: 10 }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const val = context.raw || 0;
                                    return `${context.label}: ${val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    renderizarEspectroInterno(membrosEspectro) {
        if (!this.canvasEspectroInterno) return;

        if (this.espectroChartInstance) {
            this.espectroChartInstance.destroy();
        }

        const dataPoints = membrosEspectro.map(dep => {
            let bgColor = 'rgba(107, 114, 128, 0.8)';
            if (dep.alinhamento > 66) bgColor = 'rgba(34, 197, 94, 0.85)';
            else if (dep.alinhamento < 33) bgColor = 'rgba(239, 68, 68, 0.85)';
            else bgColor = 'rgba(234, 179, 8, 0.85)';

            return {
                x: dep.coesao,
                y: dep.alinhamento,
                deputado: dep,
                backgroundColor: bgColor
            };
        });

        this.espectroChartInstance = new Chart(this.canvasEspectroInterno, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Deputados',
                    data: dataPoints,
                    pointBackgroundColor: dataPoints.map(p => p.backgroundColor),
                    pointBorderColor: 'white',
                    pointBorderWidth: 1,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                onClick: (e, elements) => {
                    if (elements && elements.length > 0) {
                        const el = elements[0];
                        const dataPoint = this.espectroChartInstance.data.datasets[el.datasetIndex].data[el.index];
                        if (dataPoint && dataPoint.deputado && dataPoint.deputado.id) {
                            window.location.href = `deputado-perfil.html?id=${dataPoint.deputado.id}`;
                        }
                    }
                },
                scales: {
                    x: {
                        min: 0,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Coesao Partidaria (%)',
                            font: { size: 12, weight: 'bold' }
                        }
                    },
                    y: {
                        min: 0,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Alinhamento com o Governo (%)',
                            font: { size: 12, weight: 'bold' }
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const dep = context.raw.deputado;
                                return `${dep.nome} (${dep.partido}-${dep.estado})`;
                            },
                            afterLabel: (context) => {
                                const dep = context.raw.deputado;
                                return [
                                    `Coesao Partidaria: ${dep.coesao.toFixed(1)}%`,
                                    `Alinhamento Governo: ${dep.alinhamento.toFixed(1)}%`
                                ];
                            }
                        }
                    }
                }
            }
        });
    }
}

window.PartidoPerfilView = PartidoPerfilView;
