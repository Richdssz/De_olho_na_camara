class EspectroView {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        this.canvas = document.getElementById('espectroChart');
        this.loader = document.getElementById('loader');
        this.selectPartido = document.getElementById('filtro-partido');
        this.btnRecarregar = document.getElementById('btn-recarregar');
        this.chart = null;

        // Callback bindings
        this.onPartidoChange = null;
        this.onRecarregar = null;

        this._bindEvents();
    }

    _bindEvents() {
        if (this.selectPartido) {
            this.selectPartido.addEventListener('change', (e) => {
                if (this.onPartidoChange) this.onPartidoChange(e.target.value);
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

    renderizarGrafico(dadosDeputados, partidoDestaque = '') {
        if (!this.canvas) return;
        
        if (this.chart) {
            this.chart.destroy();
        }

        const dataPoints = dadosDeputados.map(dep => {
            const isDestaque = !partidoDestaque || dep.partido === partidoDestaque;
            let bgColor = 'rgba(107, 114, 128, 0.6)'; 
            
            if (isDestaque) {
                if (dep.alinhamento > 66) bgColor = 'rgba(34, 197, 94, 0.8)'; // Verde (Governo)
                else if (dep.alinhamento < 33) bgColor = 'rgba(239, 68, 68, 0.8)'; // Vermelho (Oposição)
                else bgColor = 'rgba(234, 179, 8, 0.8)'; // Amarelo (Centrão/Independente)
            } else {
                bgColor = 'rgba(209, 213, 219, 0.2)'; 
            }

            return {
                x: dep.alinhamento,
                y: dep.coesao,
                deputado: dep,
                backgroundColor: bgColor
            };
        });

        this.chart = new Chart(this.canvas, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Deputados',
                    data: dataPoints,
                    pointBackgroundColor: dataPoints.map(p => p.backgroundColor),
                    pointBorderColor: 'white',
                    pointBorderWidth: 1,
                    pointRadius: context => {
                        const isDestaque = !partidoDestaque || context.raw?.deputado?.partido === partidoDestaque;
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
