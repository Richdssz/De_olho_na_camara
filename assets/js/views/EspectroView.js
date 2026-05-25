class EspectroView {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        this.canvas = document.getElementById('espectroChart');
        this.loader = document.getElementById('loader');
        this.selectPartido = document.getElementById('filtro-partido');
        this.selectDeputado = document.getElementById('filtro-deputado');
        this.modoExibicao = document.getElementById('modo-exibicao');
        this.btnRecarregar = document.getElementById('btn-recarregar');
        this.chart = null;

        // Callback bindings
        this.onPartidoChange = null;
        this.onDeputadoChange = null;
        this.onModoChange = null;
        this.onRecarregar = null;

        this._bindEvents();
    }

    _bindEvents() {
        if (this.selectPartido) {
            this.selectPartido.addEventListener('change', (e) => {
                if (this.onPartidoChange) this.onPartidoChange(e.target.value);
            });
        }
        if (this.selectDeputado) {
            this.selectDeputado.addEventListener('change', (e) => {
                if (this.onDeputadoChange) this.onDeputadoChange(e.target.value);
            });
        }
        if (this.modoExibicao) {
            this.modoExibicao.addEventListener('change', (e) => {
                if (this.onModoChange) this.onModoChange(e.target.value);
            });
        }
        if (this.btnRecarregar) {
            this.btnRecarregar.addEventListener('click', () => {
                if (this.onRecarregar) this.onRecarregar();
            });
        }
    }

    mostrarLoader() {
        if (this.loader) this.loader.classList.remove('hidden');
    }

    ocultarLoader() {
        if (this.loader) this.loader.classList.add('hidden');
    }

    renderizarSelectPartidos(partidos) {
        if (!this.selectPartido) return;
        
        this.selectPartido.innerHTML = '<option value="">Todos os Partidos</option>';
        
        partidos.forEach(partido => {
            const option = document.createElement('option');
            option.value = partido.sigla;
            option.textContent = partido.sigla;
            this.selectPartido.appendChild(option);
        });
    }

    renderizarSelectDeputados(deputados) {
        if (!this.selectDeputado) return;
        
        this.selectDeputado.innerHTML = '<option value="">Todos os Deputados</option>';
        
        // Ordena por nome
        const ordenados = [...deputados].sort((a, b) => a.nome.localeCompare(b.nome));
        
        ordenados.forEach(dep => {
            const option = document.createElement('option');
            option.value = dep.id;
            option.textContent = `${dep.nome} (${dep.partido})`;
            this.selectDeputado.appendChild(option);
        });
    }

    renderizarGrafico(dadosDeputados, partidoDestaque = '', deputadoDestaque = '', modo = 'destacar') {
        if (!this.canvas) return;
        
        if (this.chart) {
            this.chart.destroy();
        }

        // Filtra a lista se o modo for "isolar"
        let dadosExibidos = dadosDeputados;
        if (modo === 'isolar') {
            if (partidoDestaque) {
                dadosExibidos = dadosExibidos.filter(dep => dep.partido === partidoDestaque);
            }
            if (deputadoDestaque) {
                const idDep = parseInt(deputadoDestaque);
                dadosExibidos = dadosExibidos.filter(dep => dep.id === idDep);
            }
        }

        const dataPoints = dadosExibidos.map(dep => {
            let isDestaque = true;
            
            if (modo === 'destacar') {
                if (partidoDestaque && dep.partido !== partidoDestaque) {
                    isDestaque = false;
                }
                if (deputadoDestaque && dep.id !== parseInt(deputadoDestaque)) {
                    isDestaque = false;
                }
            }

            let bgColor = 'rgba(107, 114, 128, 0.6)'; 
            
            if (isDestaque) {
                if (dep.alinhamento > 66) bgColor = 'rgba(34, 197, 94, 0.85)'; // Verde (Governo)
                else if (dep.alinhamento < 33) bgColor = 'rgba(239, 68, 68, 0.85)'; // Vermelho (Oposição)
                else bgColor = 'rgba(234, 179, 8, 0.85)'; // Amarelo (Centrão/Independente)
            } else {
                bgColor = 'rgba(209, 213, 219, 0.15)'; 
            }

            return {
                x: dep.alinhamento,
                y: dep.coesao,
                deputado: dep,
                backgroundColor: bgColor,
                isDestaque: isDestaque
            };
        });

        this.chart = new Chart(this.canvas, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Deputados',
                    data: dataPoints,
                    pointBackgroundColor: dataPoints.map(p => p.backgroundColor),
                    pointBorderColor: dataPoints.map(p => p.isDestaque ? 'white' : 'transparent'),
                    pointBorderWidth: 1,
                    pointRadius: context => {
                        if (!context.raw) return 4;
                        const isDestaque = context.raw.isDestaque;
                        const idDeputado = context.raw.deputado?.id;
                        if (deputadoDestaque && idDeputado === parseInt(deputadoDestaque)) {
                            return 10; // Destaca bastante o deputado individual
                        }
                        return isDestaque ? 6 : 3;
                    },
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                onClick: (e, elements) => {
                    if (elements && elements.length > 0) {
                        const el = elements[0];
                        const dataPoint = this.chart.data.datasets[el.datasetIndex].data[el.index];
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
                            text: 'Alinhamento com o Governo (%)',
                            font: { size: 14, weight: 'bold' }
                        }
                    },
                    y: {
                        min: 0,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Coesão Partidária (%)',
                            font: { size: 14, weight: 'bold' }
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
                                    `Alinhamento: ${dep.alinhamento.toFixed(1)}%`,
                                    `Coesão: ${dep.coesao.toFixed(1)}%`
                                ];
                            }
                        }
                    }
                }
            }
        });
    }
}
