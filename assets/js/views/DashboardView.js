/**
 * View do Dashboard Principal (index.html)
 * Manipula DOM e renderiza os destaques e gráficos do dashboard.
 */
class DashboardView {
    constructor() {
        this.grid = document.getElementById('deputados-grid');
        this.ctxGrafico = document.getElementById('graficoPartidos')?.getContext('2d');
        this.chartInstancia = null;

        // KPIs
        this.kpiDeputados = document.getElementById('kpi-deputados');
        this.kpiTotalCeap = document.getElementById('kpi-total-ceap');
        this.kpiVotacoes = document.getElementById('kpi-votacoes');
        this.kpiPartidos = document.getElementById('kpi-partidos');
    }

    /**
     * Define o callback para quando o botão "Acompanhar" é clicado.
     * @param {Function} callback 
     */
    onAcompanharClick(callback) {
        this._acompanharCallback = callback;
    }

    /**
     * Define o callback para quando o botão "Avaliar" é clicado.
     * @param {Function} callback 
     */
    onAvaliarClick(callback) {
        this._avaliarCallback = callback;
    }

    mostrarLoader() {
        if (!this.grid) return;
        this.grid.innerHTML = '<p class="text-gray-500 col-span-full text-center py-10"><i class="fa-solid fa-circle-notch fa-spin text-2xl text-blue-500 mr-2"></i>Carregando deputados...</p>';
    }

    mostrarErro() {
        if (!this.grid) return;
        this.grid.innerHTML = '<p class="text-red-500 col-span-full text-center py-10 font-medium">Erro ao carregar os dados da Câmara.</p>';
    }

    /**
     * Renderiza a lista de deputados no grid inicial.
     * @param {Array} deputados 
     * @param {Array} monitoradosIds 
     */
    renderizarGrid(deputados, monitoradosIds = [], ratingsMap = {}) {
        if (!this.grid) return;
        this.grid.innerHTML = '';

        deputados.forEach(deputado => {
            const isMonitored = monitoradosIds.includes(deputado.id);
            const btnText = isMonitored ? "<i class='fa-solid fa-circle-check'></i> Acompanhando" : "<i class='fa-solid fa-eye'></i> Acompanhar";
            const btnClass = isMonitored 
                ? "flex items-center justify-center gap-2 bg-teal-800 hover:bg-teal-900 text-white py-2 px-2 rounded-lg text-sm font-medium transition-colors" 
                : "flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-2 rounded-lg text-sm font-medium transition-colors";

            const media = ratingsMap[deputado.id];
            const ratingHTML = (media && media > 0)
                ? `<div class="flex items-center gap-1 text-sm font-bold mb-3"><i class="fa-solid fa-star text-yellow-400"></i> <span class="text-gray-700">${parseFloat(media).toFixed(1)} / 5</span></div>`
                : `<div class="mb-3"><span class="text-gray-400 text-xs font-medium">Sem avaliações</span></div>`;

            const card = document.createElement('div');
            card.className = 'bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col';
            
            card.innerHTML = `
                <a href="deputado-perfil.html?id=${deputado.id}" class="relative pt-[120%] bg-gray-200 block cursor-pointer group overflow-hidden">
                    <img src="${deputado.urlFoto}" alt="Foto de ${deputado.nome}" class="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300" onerror="this.src='https://via.placeholder.com/150?text=Sem+Foto'">
                </a>
                <div class="p-5 flex flex-col flex-1">
                    <h4 class="font-bold text-lg text-gray-900 mb-1 leading-tight">
                        <a href="deputado-perfil.html?id=${deputado.id}" class="hover:text-blue-600 transition-colors">${deputado.nome}</a>
                    </h4>
                    <p class="text-sm font-medium text-blue-600 mb-2">${deputado.siglaPartido} - ${deputado.siglaUf}</p>
                    ${ratingHTML}
                    <div class="mt-auto flex flex-col gap-2">
                        <button id="btn-radar-${deputado.id}" class="btn-radar w-full flex items-center justify-center gap-2 ${isMonitored ? 'bg-teal-800 hover:bg-teal-900 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} py-2 px-3 rounded-lg text-sm font-medium transition-colors" data-id="${deputado.id}" data-nome="${deputado.nome.replace(/"/g, '&quot;')}">
                            ${btnText}
                        </button>
                        <button class="btn-avaliar w-full flex items-center justify-center gap-2 bg-teal-50 hover:bg-teal-100 text-teal-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors" data-id="${deputado.id}" data-nome="${deputado.nome.replace(/"/g, '&quot;')}">
                            <i class="fa-solid fa-star text-yellow-500"></i> Avaliar
                        </button>
                    </div>
                </div>
            `;
            this.grid.appendChild(card);
        });

        // Registrar os eventos internamente
        const botoesRadar = this.grid.querySelectorAll('.btn-radar');
        botoesRadar.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                const nome = e.currentTarget.getAttribute('data-nome');
                if (this._acompanharCallback) this._acompanharCallback(id, nome, e.currentTarget);
            });
        });

        const botoesAvaliar = this.grid.querySelectorAll('.btn-avaliar');
        botoesAvaliar.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                const nome = e.currentTarget.getAttribute('data-nome');
                if (this._avaliarCallback) this._avaliarCallback(id, nome);
            });
        });
    }

    /**
     * Atualiza visualmente o botão do radar (sem recarregar o grid).
     * @param {HTMLElement} btn 
     * @param {string} acao 'added' ou 'removed'
     */
    atualizarBotaoRadar(btn, acao) {
        if (!btn) return;
        if (acao === 'added') {
            btn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Acompanhando`;
            btn.className = "btn-radar w-full flex items-center justify-center gap-2 bg-teal-800 hover:bg-teal-900 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors";
        } else {
            btn.innerHTML = `<i class="fa-solid fa-eye"></i> Acompanhar`;
            btn.className = "btn-radar w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors";
        }
    }

    /**
     * Renderiza os 4 KPIs no topo do painel.
     */
    renderizarKPIs(dados) {
        if (this.kpiDeputados) this.kpiDeputados.textContent = dados.totalDeputados || '0';
        if (this.kpiTotalCeap) {
            const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(dados.totalCeap || 0);
            this.kpiTotalCeap.textContent = formatted;
        }
        if (this.kpiVotacoes) this.kpiVotacoes.textContent = dados.totalVotacoes || '0';
        if (this.kpiPartidos) this.kpiPartidos.textContent = dados.totalPartidos || '0';
    }

    /**
     * Renderiza o gráfico de pizza de partidos usando Chart.js com todos os partidos e cores oficiais.
     * @param {Array} deputados 
     */
    renderizarGraficoPartidos(deputados) {
        if (!this.ctxGrafico) return;

        const contagemPartidos = {};
        deputados.forEach(d => {
            const partido = d.siglaPartido || 'S/P';
            contagemPartidos[partido] = (contagemPartidos[partido] || 0) + 1;
        });

        // Ordenar do maior para o menor número de membros
        const partidosOrdenados = Object.keys(contagemPartidos).sort((a, b) => contagemPartidos[b] - contagemPartidos[a]);
        
        const labels = partidosOrdenados;
        const data = partidosOrdenados.map(p => contagemPartidos[p]);

        const fullNames = partidosOrdenados.map(p => {
            const fallback = window.PartidoModel.getFallbackData(p);
            return fallback ? fallback.nomeCompleto : p;
        });

        const backgroundColors = partidosOrdenados.map(p => {
            const fallback = window.PartidoModel.getFallbackData(p);
            return fallback ? fallback.corHex : '#7f8c8d';
        });

        if (this.chartInstancia) {
            this.chartInstancia.destroy();
        }

        this.chartInstancia = new Chart(this.ctxGrafico, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    borderWidth: 1,
                    borderColor: 'var(--bg-secundario)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 8,
                            padding: 10,
                            color: 'var(--texto-secundario)',
                            font: { size: 9, weight: '500' }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const idx = context.dataIndex;
                                const sigla = labels[idx];
                                const fullName = fullNames[idx];
                                const val = context.raw;
                                const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                                const percentage = ((val / total) * 100).toFixed(1);
                                return ` ${fullName} (${sigla}): ${val} deputado(s) (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '65%'
            }
        });
    }
}

window.DashboardView = DashboardView;
