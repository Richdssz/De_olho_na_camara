/**
 * View do Comparador Lado a Lado (comparador.html)
 * Manipula DOM: seletores, abas, confrontos de métricas e gráficos Chart.js.
 */
class ComparadorView {
    constructor() {
        this.tabDeputados = document.getElementById('tab-deputados');
        this.tabPartidos = document.getElementById('tab-partidos');
        this.secaoTitulo = document.getElementById('secao-titulo');
        
        this.selectionDeputados = document.getElementById('selection-deputados');
        this.selectionPartidos = document.getElementById('selection-partidos');
        
        this.selectDeputadoA = document.getElementById('select-deputado-a');
        this.selectDeputadoB = document.getElementById('select-deputado-b');
        this.selectPartidoA = document.getElementById('select-partid-a') || document.getElementById('select-partido-a');
        this.selectPartidoB = document.getElementById('select-partid-b') || document.getElementById('select-partido-b');
        
        this.loading = document.getElementById('loading-comparacao');
        this.emptyState = document.getElementById('empty-state-comparador');
        this.content = document.getElementById('comparacao-conteudo');
        
        this.gridIdentidade = document.getElementById('comparacao-identidade');
        this.kpiRows = document.getElementById('comparacao-kpi-rows');
        this.graficosContainer = document.getElementById('comparacao-graficos-container');
        this.canvasGastos = document.getElementById('chartComparadorGastos');
        this.chartInstancia = null;
    }

    /**
     * Define listener para quando a aba de comparação muda
     * @param {Function} callback 
     */
    onTabChange(callback) {
        if (this.tabDeputados) {
            this.tabDeputados.addEventListener('click', () => callback('deputados'));
        }
        if (this.tabPartidos) {
            this.tabPartidos.addEventListener('click', () => callback('partidos'));
        }
    }

    /**
     * Define listener para quando a seleção de comparação muda
     * @param {Function} callback 
     */
    onSelecaoChange(callback) {
        const trigger = () => {
            callback({
                deputadoA: this.selectDeputadoA?.value || '',
                deputadoB: this.selectDeputadoB?.value || '',
                partidoA: this.selectPartidoA?.value || '',
                partidoB: this.selectPartidoB?.value || ''
            });
        };

        if (this.selectDeputadoA) this.selectDeputadoA.addEventListener('change', trigger);
        if (this.selectDeputadoB) this.selectDeputadoB.addEventListener('change', trigger);
        if (this.selectPartidoA) this.selectPartidoA.addEventListener('change', trigger);
        if (this.selectPartidoB) this.selectPartidoB.addEventListener('change', trigger);
    }

    /**
     * Alterna visualmente o modo da tela
     * @param {string} mode 'deputados' ou 'partidos'
     */
    setMode(mode) {
        if (mode === 'deputados') {
            this.tabDeputados.className = "px-5 py-2.5 rounded-xl font-bold text-sm bg-teal-800 text-green-400 shadow-sm transition-all flex items-center gap-2";
            this.tabPartidos.className = "px-5 py-2.5 rounded-xl font-bold text-sm bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all flex items-center gap-2";
            this.secaoTitulo.textContent = "Selecione os parlamentares para comparar";
            
            this.selectionDeputados.classList.remove('hidden');
            this.selectionPartidos.classList.add('hidden');
        } else {
            this.tabDeputados.className = "px-5 py-2.5 rounded-xl font-bold text-sm bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all flex items-center gap-2";
            this.tabPartidos.className = "px-5 py-2.5 rounded-xl font-bold text-sm bg-teal-800 text-green-400 shadow-sm transition-all flex items-center gap-2";
            this.secaoTitulo.textContent = "Selecione as bancadas partidárias para comparar";
            
            this.selectionDeputados.classList.add('hidden');
            this.selectionPartidos.classList.remove('hidden');
        }

        this.resetarVisualizacao();
    }

    resetarVisualizacao() {
        this.emptyState.classList.remove('hidden');
        this.content.classList.add('hidden');
        this.loading.classList.add('hidden');
    }

    preencherSelectsDeputados(deputados) {
        if (!this.selectDeputadoA || !this.selectDeputadoB) return;
        
        const fragmentA = document.createDocumentFragment();
        const fragmentB = document.createDocumentFragment();
        
        const optDefaultA = document.createElement('option');
        optDefaultA.value = "";
        optDefaultA.textContent = "Selecione o Deputado A...";
        fragmentA.appendChild(optDefaultA);

        const optDefaultB = document.createElement('option');
        optDefaultB.value = "";
        optDefaultB.textContent = "Selecione o Deputado B...";
        fragmentB.appendChild(optDefaultB);

        deputados.forEach(d => {
            const label = `${d.nome} (${d.siglaPartido}-${d.siglaUf})`;
            
            const optA = document.createElement('option');
            optA.value = d.id;
            optA.textContent = label;
            fragmentA.appendChild(optA);

            const optB = document.createElement('option');
            optB.value = d.id;
            optB.textContent = label;
            fragmentB.appendChild(optB);
        });

        this.selectDeputadoA.innerHTML = '';
        this.selectDeputadoB.innerHTML = '';
        
        this.selectDeputadoA.appendChild(fragmentA);
        this.selectDeputadoB.appendChild(fragmentB);
    }

    preencherSelectsPartidos(partidos) {
        if (!this.selectPartidoA || !this.selectPartidoB) return;
        
        const fragmentA = document.createDocumentFragment();
        const fragmentB = document.createDocumentFragment();
        
        const optDefaultA = document.createElement('option');
        optDefaultA.value = "";
        optDefaultA.textContent = "Selecione o Partido A...";
        fragmentA.appendChild(optDefaultA);

        const optDefaultB = document.createElement('option');
        optDefaultB.value = "";
        optDefaultB.textContent = "Selecione o Partido B...";
        fragmentB.appendChild(optDefaultB);

        partidos.forEach(p => {
            const label = `${p.sigla} - ${p.nome}`;
            
            const optA = document.createElement('option');
            optA.value = p.sigla;
            optA.textContent = label;
            fragmentA.appendChild(optA);

            const optB = document.createElement('option');
            optB.value = p.sigla;
            optB.textContent = label;
            fragmentB.appendChild(optB);
        });

        this.selectPartidoA.innerHTML = '';
        this.selectPartidoB.innerHTML = '';
        
        this.selectPartidoA.appendChild(fragmentA);
        this.selectPartidoB.appendChild(fragmentB);
    }

    mostrarLoader() {
        this.emptyState.classList.add('hidden');
        this.content.classList.add('hidden');
        this.loading.classList.remove('hidden');
    }

    mostrarErro() {
        this.loading.classList.add('hidden');
        this.emptyState.classList.remove('hidden');
        this.content.classList.add('hidden');
    }

    /**
     * Renderiza o confronto de dois deputados
     */
    renderizarComparacaoDeputados(depA, statsA, ratingA, depB, statsB, ratingB) {
        this.loading.classList.add('hidden');
        this.emptyState.classList.add('hidden');
        this.content.classList.remove('hidden');
        this.graficosContainer.classList.remove('hidden');

        // 1. Renderizar Identidades
        this.gridIdentidade.innerHTML = `
            <!-- Deputado A -->
            <div class="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-5 shadow-sm">
                <div class="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 shrink-0 shadow-inner">
                    <img src="${depA.urlFoto}" alt="Foto de ${depA.nome}" class="w-full h-full object-cover object-top" onerror="this.src='https://via.placeholder.com/150?text=Sem+Foto'">
                </div>
                <div class="flex-1">
                    <span class="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 text-xs font-bold border border-teal-100 uppercase tracking-wide">
                        Deputado A
                    </span>
                    <h4 class="font-extrabold text-xl text-gray-900 mt-1 mb-1 leading-tight">${depA.nome}</h4>
                    <p class="text-sm font-semibold text-teal-600">${depA.siglaPartido} - ${depA.siglaUf}</p>
                </div>
            </div>
            
            <!-- Deputado B -->
            <div class="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-5 shadow-sm">
                <div class="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 shrink-0 shadow-inner">
                    <img src="${depB.urlFoto}" alt="Foto de ${depB.nome}" class="w-full h-full object-cover object-top" onerror="this.src='https://via.placeholder.com/150?text=Sem+Foto'">
                </div>
                <div class="flex-1">
                    <span class="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 text-xs font-bold border border-teal-100 uppercase tracking-wide">
                        Deputado B
                    </span>
                    <h4 class="font-extrabold text-xl text-gray-900 mt-1 mb-1 leading-tight">${depB.nome}</h4>
                    <p class="text-sm font-semibold text-teal-600">${depB.siglaPartido} - ${depB.siglaUf}</p>
                </div>
            </div>
        `;

        // 2. Confronto de Métricas (Tabela)
        // Mapear métricas
        const metricas = [
            {
                titulo: "Presença Plenária",
                desc: "Assiduidade em votações",
                valA: statsA.presenca,
                valB: statsB.presenca,
                format: v => `${v.toFixed(1)}%`,
                comparar: (a, b) => a - b // quanto maior melhor
            },
            {
                titulo: "Gastos CEAP Médios",
                desc: "Despesa média mensal autodeclarada",
                valA: statsA.gastoMedio,
                valB: statsB.gastoMedio,
                format: v => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                comparar: (a, b) => b - a // quanto menor melhor!
            },
            {
                titulo: "Total de Proposições",
                desc: "Projetos de autoria legislativa",
                valA: statsA.totalProposicoes,
                valB: statsB.totalProposicoes,
                format: v => `${v} projeto(s)`,
                comparar: (a, b) => a - b // quanto maior melhor
            },
            {
                titulo: "Coesão Partidária",
                desc: "Alinhamento de voto com a legenda",
                valA: statsA.coesao,
                valB: statsB.coesao,
                format: v => `${v.toFixed(1)}%`,
                comparar: (a, b) => a - b // quanto maior melhor
            },
            {
                titulo: "Nota da Comunidade",
                desc: "Média de estrelas dadas no painel",
                valA: ratingA,
                valB: ratingB,
                format: v => v > 0 ? `<i class="fa-solid fa-star text-yellow-500 mr-1"></i>${v.toFixed(1)} / 5.0` : "Sem avaliações",
                comparar: (a, b) => a - b // quanto maior melhor
            }
        ];

        this.kpiRows.innerHTML = '';
        metricas.forEach(m => {
            const diff = m.comparar(m.valA, m.valB);
            
            let classA = "border-gray-200 bg-gray-50 text-gray-700";
            let classB = "border-gray-200 bg-gray-50 text-gray-700";
            
            if (diff > 0.001) {
                // A venceu
                classA = "border-green-300 bg-green-50 text-green-800 font-bold";
                classB = "border-gray-100 bg-gray-50/50 text-gray-400";
            } else if (diff < -0.001) {
                // B venceu
                classA = "border-gray-100 bg-gray-50/50 text-gray-400";
                classB = "border-green-300 bg-green-50 text-green-800 font-bold";
            } else {
                // Empate
                classA = "border-gray-200 bg-gray-50 text-gray-600";
                classB = "border-gray-200 bg-gray-50 text-gray-600";
            }

            const row = document.createElement('div');
            row.className = "grid grid-cols-1 md:grid-cols-3 items-center gap-4 border-b border-gray-100/70 pb-4 last:border-b-0 last:pb-0";
            row.innerHTML = `
                <div class="text-left">
                    <h5 class="text-sm font-bold text-gray-900">${m.titulo}</h5>
                    <p class="text-xs text-gray-400 font-medium">${m.desc}</p>
                </div>
                <div class="flex md:col-span-2 items-center justify-between gap-4">
                    <!-- Valor A -->
                    <div class="flex-1 text-center py-3.5 px-4 rounded-xl border ${classA}">
                        ${m.format(m.valA)}
                    </div>
                    
                    <div class="text-xs font-bold text-gray-300 uppercase tracking-widest no-print">VS</div>
                    
                    <!-- Valor B -->
                    <div class="flex-1 text-center py-3.5 px-4 rounded-xl border ${classB}">
                        ${m.format(m.valB)}
                    </div>
                </div>
            `;
            this.kpiRows.appendChild(row);
        });
    }

    /**
     * Renderiza o confronto de dois partidos
     */
    renderizarComparacaoPartidos(partA, dataA, partB, dataB) {
        this.loading.classList.add('hidden');
        this.emptyState.classList.add('hidden');
        this.content.classList.remove('hidden');
        this.graficosContainer.classList.add('hidden'); // Ocultar gastos mensais já que não é comparável de forma simples

        // 1. Renderizar Identidades de Partido
        this.gridIdentidade.innerHTML = `
            <!-- Partido A -->
            <div class="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-5 shadow-sm">
                <div class="w-16 h-16 bg-teal-50 text-teal-700 rounded-2xl flex items-center justify-center text-2xl font-extrabold border border-teal-100 shrink-0">
                    ${partA.sigla}
                </div>
                <div class="flex-1">
                    <span class="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 text-xs font-bold border border-teal-100 uppercase tracking-wide">
                        Partido A
                    </span>
                    <h4 class="font-extrabold text-xl text-gray-900 mt-1 mb-1 leading-tight">${partA.sigla}</h4>
                    <p class="text-sm font-medium text-gray-500 truncate max-w-[200px]">${partA.nome}</p>
                </div>
            </div>
            
            <!-- Partido B -->
            <div class="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-5 shadow-sm">
                <div class="w-16 h-16 bg-teal-50 text-teal-700 rounded-2xl flex items-center justify-center text-2xl font-extrabold border border-teal-100 shrink-0">
                    ${partB.sigla}
                </div>
                <div class="flex-1">
                    <span class="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 text-xs font-bold border border-teal-100 uppercase tracking-wide">
                        Partido B
                    </span>
                    <h4 class="font-extrabold text-xl text-gray-900 mt-1 mb-1 leading-tight">${partB.sigla}</h4>
                    <p class="text-sm font-medium text-gray-500 truncate max-w-[200px]">${partB.nome}</p>
                </div>
            </div>
        `;

        // 2. Confrontar KPIs de Partido
        const metricas = [
            {
                titulo: "Tamanho da Bancada",
                desc: "Total de deputados federais afiliados",
                valA: dataA.membrosCount,
                valB: dataB.membrosCount,
                format: v => `${v} deputado(s)`,
                comparar: (a, b) => a - b
            },
            {
                titulo: "Coesão Partidária",
                desc: "Percentual médio de alinhamento com a bancada",
                valA: dataA.coesao,
                valB: dataB.coesao,
                format: v => `${v.toFixed(1)}%`,
                comparar: (a, b) => a - b
            }
        ];

        this.kpiRows.innerHTML = '';
        metricas.forEach(m => {
            const diff = m.comparar(m.valA, m.valB);
            
            let classA = "border-gray-200 bg-gray-50 text-gray-700";
            let classB = "border-gray-200 bg-gray-50 text-gray-700";
            
            if (diff > 0.001) {
                classA = "border-green-300 bg-green-50 text-green-800 font-bold";
                classB = "border-gray-100 bg-gray-50/50 text-gray-400";
            } else if (diff < -0.001) {
                classA = "border-gray-100 bg-gray-50/50 text-gray-400";
                classB = "border-green-300 bg-green-50 text-green-800 font-bold";
            }

            const row = document.createElement('div');
            row.className = "grid grid-cols-1 md:grid-cols-3 items-center gap-4 border-b border-gray-100/70 pb-4 last:border-b-0 last:pb-0";
            row.innerHTML = `
                <div class="text-left">
                    <h5 class="text-sm font-bold text-gray-900">${m.titulo}</h5>
                    <p class="text-xs text-gray-400 font-medium">${m.desc}</p>
                </div>
                <div class="flex md:col-span-2 items-center justify-between gap-4">
                    <!-- Valor A -->
                    <div class="flex-1 text-center py-3.5 px-4 rounded-xl border ${classA}">
                        ${m.format(m.valA)}
                    </div>
                    
                    <div class="text-xs font-bold text-gray-300 uppercase tracking-widest no-print">VS</div>
                    
                    <!-- Valor B -->
                    <div class="flex-1 text-center py-3.5 px-4 rounded-xl border ${classB}">
                        ${m.format(m.valB)}
                    </div>
                </div>
            `;
            this.kpiRows.appendChild(row);
        });
    }

    /**
     * Renderiza o gráfico de gastos mensais/categorias
     */
    renderizarGraficoGastos(categoriasLabels, valoresA, labelA, valoresB, labelB) {
        if (!this.canvasGastos) return;

        const ctx = this.canvasGastos.getContext('2d');
        if (this.chartInstancia) {
            this.chartInstancia.destroy();
        }

        this.chartInstancia = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: categoriasLabels,
                datasets: [
                    {
                        label: labelA,
                        data: valoresA,
                        backgroundColor: '#0f766e', // teal-700
                        borderRadius: 6,
                        borderWidth: 0
                    },
                    {
                        label: labelB,
                        data: valoresB,
                        backgroundColor: '#16a34a', // green-600
                        borderRadius: 6,
                        borderWidth: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { font: { family: 'Inter', weight: '500' } }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return ` ${context.dataset.label}: R$ ${context.raw.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                            }
                        }
                    }
                },
                scales: {
                    x: { ticks: { font: { family: 'Inter', size: 10 } } },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            font: { family: 'Inter' },
                            callback: function(value) {
                                return `R$ ${value.toLocaleString('pt-BR')}`;
                            }
                        }
                    }
                }
            }
        });
    }
}

window.ComparadorView = ComparadorView;
