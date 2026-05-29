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

        // Hemiciclo
        this.hemicicloContainer = document.getElementById('hemiciclo-container');

        // Novos elementos Financeiros
        this.filtroAno = document.getElementById('filtro-ano-partido');
        this.totalGastoBancada = document.getElementById('total-gasto-bancada');
        this.mediaGastoBancada = document.getElementById('media-gasto-bancada');
        this.anoFinanceiroDisplay = document.getElementById('ano-financeiro-display');
        this.canvasFinance = document.getElementById('financeChart');



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
            const corHex = partidoInfo.corHex || '#7f8c8d';
            
            if (partidoInfo.urlLogo) {
                this.logo.innerHTML = `
                    <img id="partido-logo-img" src="${partidoInfo.urlLogo}" alt="Logo do ${sigla}" class="w-full h-full object-contain p-1" onerror="this.onerror = null; this.outerHTML = '<div id=\\'partido-logo-img\\' class=\\'w-full h-full flex items-center justify-center font-bold text-lg text-white\\' style=\\'background: ${corHex}\\'>${sigla}</div>';">
                `;
            } else {
                this.logo.innerHTML = `
                    <div id="partido-logo-img" class="w-full h-full flex items-center justify-center font-bold text-lg text-white" style="background: ${corHex}">${sigla}</div>
                `;
            }
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
        if (this.wikiResumo) {
            this.wikiResumo.textContent = wikiData.resumo || "Resumo indisponivel.";
            this.wikiResumo.classList.remove('max-h-64', 'max-h-96', 'overflow-y-auto', 'overflow-hidden');
            this.wikiResumo.classList.add('h-auto');
        }
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
        if (!financeData || !financeData.total || financeData.total === 0) {
            if (this.totalGastoBancada) this.totalGastoBancada.textContent = 'Sem dados';
            if (this.mediaGastoBancada) this.mediaGastoBancada.textContent = 'Sem dados';
            if (this.anoFinanceiroDisplay) this.anoFinanceiroDisplay.textContent = `Ano: ${ano}`;

            if (this.canvasFinance) {
                if (this.financeChartInstance) {
                    this.financeChartInstance.destroy();
                }
                this.financeChartInstance = new Chart(this.canvasFinance, {
                    type: 'doughnut',
                    data: {
                        labels: ['Sem dados de despesas'],
                        datasets: [{
                            data: [1],
                            backgroundColor: ['rgba(229, 231, 235, 1)'],
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
            }
            return;
        }

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

    /**
     * Renderiza o gráfico de bancada estilo hemiciclo com um ponto por deputado colorido por UF.
     */
    renderizarHemiciclo(membros) {
        if (!this.hemicicloContainer) return;
        this.hemicicloContainer.innerHTML = '';

        if (!membros || membros.length === 0) {
            this.hemicicloContainer.innerHTML = '<p class="text-gray-500 text-center py-6 font-semibold">Sem parlamentares nesta bancada.</p>';
            return;
        }

        // 1. Agrupar parlamentares por UF e definir cores exclusivas por UF
        const ufCounts = {};
        membros.forEach(m => {
            if (m.siglaUf) {
                ufCounts[m.siglaUf] = (ufCounts[m.siglaUf] || 0) + 1;
            }
        });

        // Ordenar UFs por quantidade de membros
        const sortedUfs = Object.keys(ufCounts).sort((a, b) => ufCounts[b] - ufCounts[a]);

        // Cores para as UFs (cores da paleta HSL)
        const coresUfs = {};
        const paleta = [
            '#0d9488', // teal-600
            '#22c55e', // green-500
            '#3b82f6', // blue-500
            '#eab308', // yellow-500
            '#f97316', // orange-500
            '#a855f7', // purple-500
            '#ec4899', // pink-500
            '#6366f1', // indigo-500
            '#14b8a6', // teal-500
            '#4ade80', // green-400
            '#60a5fa', // blue-400
            '#facc15', // yellow-400
            '#fb923c', // orange-400
            '#c084fc', // purple-400
            '#f472b6', // pink-400
            '#818cf8', // indigo-400
            '#6b7280', // gray-500
            '#9ca3af'  // gray-400
        ];

        sortedUfs.forEach((uf, index) => {
            coresUfs[uf] = paleta[index % paleta.length];
        });

        // 2. Calcular posições no hemiciclo (semicírculo)
        const svgWidth = 600;
        const svgHeight = 320;
        const centerX = svgWidth / 2;
        const centerY = svgHeight - 40;

        const numMembros = membros.length;
        
        let numRows = 1;
        if (numMembros > 60) numRows = 4;
        else if (numMembros > 30) numRows = 3;
        else if (numMembros > 10) numRows = 2;

        const rowRadii = [];
        const baseRadius = 90;
        const rowSpacing = 45;
        for (let r = 0; r < numRows; r++) {
            rowRadii.push(baseRadius + r * rowSpacing);
        }

        const totalRadius = rowRadii.reduce((sum, r) => sum + r, 0);
        const membersPerRow = [];
        let membersDistributed = 0;

        for (let r = 0; r < numRows; r++) {
            let count = Math.round((rowRadii[r] / totalRadius) * numMembros);
            if (r === numRows - 1) {
                count = numMembros - membersDistributed;
            }
            membersPerRow.push(count);
            membersDistributed += count;
        }

        const membrosOrdenados = [...membros].sort((a, b) => {
            const indexA = sortedUfs.indexOf(a.siglaUf);
            const indexB = sortedUfs.indexOf(b.siglaUf);
            return indexA - indexB;
        });

        const dots = [];
        let memberIdx = 0;

        for (let r = 0; r < numRows; r++) {
            const count = membersPerRow[r];
            const radius = rowRadii[r];
            if (count <= 0) continue;

            const startAngle = Math.PI - 0.2;
            const endAngle = 0.2;

            for (let i = 0; i < count; i++) {
                if (memberIdx >= numMembros) break;
                
                const angle = count === 1 
                    ? Math.PI / 2 
                    : startAngle - (i / (count - 1)) * (startAngle - endAngle);

                const x = centerX + radius * Math.cos(angle);
                const y = centerY - radius * Math.sin(angle);

                dots.push({
                    x: Math.round(x * 10) / 10,
                    y: Math.round(y * 10) / 10,
                    deputado: membrosOrdenados[memberIdx]
                });

                memberIdx++;
            }
        }

        // 3. Renderizar círculos SVG
        const dotsHtml = dots.map(d => {
            const color = coresUfs[d.deputado.siglaUf] || '#7f8c8d';
            return `
                <a href="deputado-perfil.html?id=${d.deputado.id}" class="cursor-pointer">
                    <circle cx="${d.x}" cy="${d.y}" r="8" fill="${color}" stroke="white" stroke-width="1.5" class="hover:r-10 hover:stroke-teal-400 hover:stroke-2 transition-all duration-150 hemiciclo-dot">
                        <title>${d.deputado.nome} (${d.deputado.siglaPartido}-${d.deputado.siglaUf})</title>
                    </circle>
                </a>
            `;
        }).join('');

        const baseArcRadius = baseRadius - 20;
        const baseArcPath = `M ${centerX - baseArcRadius} ${centerY} A ${baseArcRadius} ${baseArcRadius} 0 0 1 ${centerX + baseArcRadius} ${centerY}`;

        const html = `
            <svg viewBox="0 0 ${svgWidth} ${svgHeight}" class="w-full max-w-[600px] h-auto">
                <path d="${baseArcPath}" fill="none" stroke="var(--borda)" stroke-width="2" stroke-dasharray="4 4" opacity="0.5"/>
                <circle cx="${centerX}" cy="${centerY}" r="12" fill="var(--bg-terciario)" stroke="var(--borda)" stroke-width="1.5"/>
                <path d="M ${centerX - 6} ${centerY - 2} L ${centerX + 6} ${centerY - 2} M ${centerX} ${centerY - 2} L ${centerX} ${centerY + 6}" stroke="var(--texto-secundario)" stroke-width="2" />
                <text x="${centerX}" y="${centerY + 25}" font-size="10" font-weight="700" fill="var(--texto-mudo)" text-anchor="middle">TRIBUNA</text>
                ${dotsHtml}
            </svg>
        `;

        // 4. Renderizar a legenda de UFs
        const legendaHtml = sortedUfs.map(uf => {
            const color = coresUfs[uf] || '#7f8c8d';
            const count = ufCounts[uf];
            const percent = ((count / numMembros) * 100).toFixed(0);
            return `
                <div class="flex items-center gap-2 bg-gray-50 border border-gray-100 dark:bg-slate-800 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm">
                    <span class="w-3 h-3 rounded-full shrink-0" style="background: ${color}"></span>
                    <span class="text-gray-700 dark:text-gray-200 font-bold">${uf}:</span>
                    <span class="text-gray-500 dark:text-gray-400">${count} (${percent}%)</span>
                </div>
            `;
        }).join('');

        this.hemicicloContainer.innerHTML = `
            <div class="flex flex-col items-center w-full gap-6">
                <div class="w-full flex justify-center">
                    ${html}
                </div>
                <div class="w-full border-t border-gray-100 dark:border-slate-800 pt-4">
                    <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-3 text-center">Bancada por Estado (UF)</p>
                    <div class="flex flex-wrap justify-center gap-3">
                        ${legendaHtml}
                    </div>
                </div>
            </div>
        `;
    }
}

window.PartidoPerfilView = PartidoPerfilView;
