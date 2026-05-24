/**
 * View do Dashboard Principal (index.html)
 * Manipula DOM e renderiza os destaques e gráficos do dashboard.
 */
class DashboardView {
    constructor() {
        this.grid = document.getElementById('deputados-grid');
        this.ctxGrafico = document.getElementById('graficoPartidos')?.getContext('2d');
        this.chartInstancia = null;
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
    renderizarGrid(deputados, monitoradosIds = []) {
        if (!this.grid) return;
        this.grid.innerHTML = '';

        deputados.forEach(deputado => {
            const isMonitored = monitoradosIds.includes(deputado.id);
            const btnText = isMonitored ? "<i class='fa-solid fa-circle-check'></i> Acompanhando" : "<i class='fa-solid fa-eye'></i> Acompanhar";
            const btnClass = isMonitored 
                ? "flex items-center justify-center gap-2 bg-teal-800 hover:bg-teal-900 text-white py-2 px-2 rounded-lg text-sm font-medium transition-colors" 
                : "flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-2 rounded-lg text-sm font-medium transition-colors";

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
                    <p class="text-sm font-medium text-blue-600 mb-4">${deputado.siglaPartido} - ${deputado.siglaUf}</p>
                    
                    <div class="mt-auto grid grid-cols-2 gap-2">
                        <button id="btn-radar-${deputado.id}" class="btn-radar ${btnClass}" data-id="${deputado.id}" data-nome="${deputado.nome.replace(/"/g, '&quot;')}">
                            ${btnText}
                        </button>
                        <button class="btn-avaliar flex items-center justify-center gap-2 bg-teal-50 hover:bg-teal-100 text-teal-700 py-2 px-2 rounded-lg text-sm font-medium transition-colors" data-id="${deputado.id}" data-nome="${deputado.nome.replace(/"/g, '&quot;')}">
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
            btn.className = "btn-radar flex items-center justify-center gap-2 bg-teal-800 hover:bg-teal-900 text-white py-2 px-2 rounded-lg text-sm font-medium transition-colors";
        } else {
            btn.innerHTML = `<i class="fa-solid fa-eye"></i> Acompanhar`;
            btn.className = "btn-radar flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-2 rounded-lg text-sm font-medium transition-colors";
        }
    }

    /**
     * Renderiza o gráfico de pizza de partidos usando Chart.js.
     * @param {Array} deputados 
     */
    renderizarGraficoPartidos(deputados) {
        if (!this.ctxGrafico) return;

        const contagemPartidos = {};
        deputados.forEach(d => {
            const partido = d.siglaPartido || 'S/P';
            contagemPartidos[partido] = (contagemPartidos[partido] || 0) + 1;
        });

        const labels = Object.keys(contagemPartidos);
        const data = Object.values(contagemPartidos);

        if (this.chartInstancia) {
            this.chartInstancia.destroy();
        }

        const backgroundColors = [
            '#0f766e', // teal-700
            '#16a34a', // green-600
            '#004D40', // dark teal
            '#f59e0b', // amber-500
            '#64748b', // slate-500
            '#059669', // emerald-600
            '#0d9488', // teal-600
            '#ca8a04', // yellow-600
            '#334155', // slate-700
            '#10b981'  // emerald-500
        ];

        this.chartInstancia = new Chart(this.ctxGrafico, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors.slice(0, labels.length),
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            boxWidth: 12,
                            padding: 20,
                            font: { size: 12, weight: '500' }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return ` ${context.label}: ${value} deputado(s) (${percentage}%)`;
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
