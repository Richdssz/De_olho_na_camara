// ==========================================
// CONFIGURAÇÕES E INICIALIZAÇÃO
// ==========================================

const PARSE_APP_ID = window.ENV.PARSE_APP_ID;
const PARSE_JS_KEY = window.ENV.PARSE_JS_KEY;

Parse.initialize(PARSE_APP_ID, PARSE_JS_KEY);
Parse.serverURL = 'https://parseapi.back4app.com/';

const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const profileContent = document.getElementById('profile-content');
const errorMessage = document.getElementById('error-message');

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const deputadoId = urlParams.get('id');

    if (!deputadoId) {
        showError("ID do deputado não fornecido na URL.");
        return;
    }

    carregarDadosDeputado(deputadoId);
});

function showError(msg) {
    if(loadingState) loadingState.classList.add('hidden');
    if(profileContent) profileContent.classList.add('hidden');
    if(errorState) errorState.classList.remove('hidden');
    if(errorMessage) errorMessage.textContent = msg;
    console.error("❌ " + msg);
}

async function carregarDadosDeputado(id) {
    try {
        // 1. Fetch deputado data (adding ?formato=json fixes a CORS bug on their API)
        const urlInfo = `https://dadosabertos.camara.leg.br/api/v2/deputados/${id}?formato=json`;
        const resInfo = await fetch(urlInfo);
        
        if (!resInfo.ok) throw new Error(`Erro na API (Info): ${resInfo.status}`);
        
        const dataInfo = await resInfo.json();
        const deputado = dataInfo.dados;

        preencherDadosPerfil(deputado);

        // 2. Fetch despesas do ano corrente
        const anoCorrente = new Date().getFullYear();
        const urlDespesas = `https://dadosabertos.camara.leg.br/api/v2/deputados/${id}/despesas?ano=${anoCorrente}&ordem=ASC&ordenarPor=ano&formato=json`;
        const resDespesas = await fetch(urlDespesas);
        
        if (resDespesas.ok) {
            const dataDespesas = await resDespesas.json();
            processarERenderizarDespesas(dataDespesas.dados);
        } else {
            console.error("Erro ao buscar despesas, status:", resDespesas.status);
            document.getElementById('kpi-despesas').textContent = "Indisponível";
        }

        // Mostrar conteúdo
        if(loadingState) loadingState.classList.add('hidden');
        if(profileContent) {
            profileContent.classList.remove('hidden');
            profileContent.classList.add('flex');
        }

    } catch (error) {
        showError("Falha ao carregar os dados do deputado: " + error.message);
    }
}

function preencherDadosPerfil(deputado) {
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

function processarERenderizarDespesas(despesas) {
    let total = 0;
    const gastosPorCategoria = {};

    despesas.forEach(d => {
        const valor = parseFloat(d.valorDocumento || 0);
        total += valor;

        const tipo = d.tipoDespesa || 'Outros';
        gastosPorCategoria[tipo] = (gastosPorCategoria[tipo] || 0) + valor;
    });

    // Formatar moeda BRL
    const formatter = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });

    const kpiDespesasEl = document.getElementById('kpi-despesas');
    if(kpiDespesasEl) kpiDespesasEl.textContent = formatter.format(total);

    // Preparar dados pro gráfico (ordenar por maior gasto)
    const sortedCategorias = Object.entries(gastosPorCategoria)
        .sort((a, b) => b[1] - a[1]);
        
    // Limitar às top 10 categorias para não poluir o gráfico
    const topCategorias = sortedCategorias.slice(0, 10);
    const labels = topCategorias.map(item => item[0]);
    const values = topCategorias.map(item => item[1]);

    renderizarGrafico(labels, values);
}

let chartDespesas = null;
function renderizarGrafico(labels, values) {
    const ctx = document.getElementById('graficoDespesas');
    if (!ctx) return;

    if (chartDespesas) {
        chartDespesas.destroy();
    }

    const canvasContext = ctx.getContext('2d');
    
    chartDespesas = new Chart(canvasContext, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Valor Gasto (R$)',
                data: values,
                backgroundColor: 'rgba(16, 185, 129, 0.8)', // Emerald 500 (Verde)
                hoverBackgroundColor: 'rgba(15, 118, 110, 0.9)', // Teal 700 (Azul Petróleo)
                borderRadius: 6,
                borderWidth: 0,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let val = context.raw;
                            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
                        }
                    },
                    padding: 12,
                    titleFont: { size: 14, family: 'Inter' },
                    bodyFont: { size: 14, family: 'Inter' },
                    backgroundColor: 'rgba(17, 24, 39, 0.9)', // Gray 900
                    cornerRadius: 8
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(243, 244, 246, 1)', // Gray 100
                        drawBorder: false,
                    },
                    ticks: {
                        font: { family: 'Inter', size: 12 },
                        color: '#6b7280', // Gray 500
                        callback: function(value) {
                            if (value >= 1000000) return 'R$ ' + (value / 1000000).toFixed(1) + 'M';
                            if (value >= 1000) return 'R$ ' + (value / 1000).toFixed(1) + 'k';
                            return 'R$ ' + value;
                        }
                    }
                },
                x: {
                    grid: { display: false, drawBorder: false },
                    ticks: {
                        font: { family: 'Inter', size: 11 },
                        color: '#6b7280',
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index',
            },
        }
    });
}
