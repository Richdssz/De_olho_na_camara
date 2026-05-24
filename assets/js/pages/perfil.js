console.log("Página Perfil carregada");

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
const btnRadarPerfil = document.getElementById('btn-radar-perfil');
const btnExportar = document.getElementById('btn-exportar');

let deputadoIdGlobal = null;
let deputadoNomeGlobal = "";
let chartDespesas = null;
let chartEvolucaoGastos = null;
let chartPresenca = null;

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const deputadoId = urlParams.get('id');

    if (!deputadoId) {
        showError("ID do deputado não fornecido na URL.");
        return;
    }

    deputadoIdGlobal = parseInt(deputadoId);
    carregarDadosDeputado(deputadoIdGlobal);

    // Event Listeners
    if (btnRadarPerfil) {
        btnRadarPerfil.addEventListener('click', alternarRadar);
    }
    if (btnExportar) {
        btnExportar.addEventListener('click', () => window.print());
    }
});

function showError(msg) {
    if(loadingState) loadingState.classList.add('hidden');
    if(profileContent) profileContent.classList.add('hidden');
    if(errorState) errorState.classList.remove('hidden');
    if(errorMessage) errorMessage.textContent = msg;
    console.error("❌ " + msg);
}

/**
 * Carrega concorrentemente todas as informações do deputado da API da Câmara e calcula métricas.
 */
async function carregarDadosDeputado(id) {
    try {
        console.log(`⏳ Iniciando carregamento do deputado ${id}...`);
        
        // 1. Dados cadastrais do deputado (bloqueante inicial para termos a siglaPartido e nome)
        const deputado = await window.camaraApi.buscarDeputado(id);
        if (!deputado) {
            throw new Error("Deputado não encontrado.");
        }
        deputadoNomeGlobal = deputado.ultimoStatus.nome;
        const siglaPartido = deputado.ultimoStatus.siglaPartido || "";

        // Preenche cadastro na tela
        preencherDadosPerfil(deputado);
        
        // Sincroniza estado do botão do radar
        await verificarEstadoRadar(id);

        // 2. Chamadas paralelas para despesas, eventos, proposições e votações recentes
        const anoCorrente = new Date().getFullYear();
        console.log(`⏳ Coletando dados adicionais em paralelo...`);
        
        const [despesas, eventos, proposicoes, votacoesRecentes] = await Promise.all([
            window.camaraApi.buscarDespesas(id, anoCorrente).catch(err => { console.error("Erro despesas:", err); return []; }),
            window.camaraApi.buscarEventos(id, `${anoCorrente}-01-01`, `${anoCorrente}-12-31`).catch(err => { console.error("Erro eventos:", err); return []; }),
            window.camaraApi.buscarProposicoesAutor(id).catch(err => { console.error("Erro proposições:", err); return []; }),
            window.camaraApi.buscarVotacoesRecentes(15).catch(err => { console.error("Erro votações:", err); return []; })
        ]);

        console.log(`✅ Dados principais carregados. Processando estatísticas...`);

        // 3. Cálculos de Presença, Gastos e Proposições
        const analisePresenca = window.analytics.calcularTaxaPresenca(eventos, anoCorrente);
        const analiseGastos = window.analytics.calcularMediaGastos(despesas);
        const totalProposicoes = proposicoes.length;

        // 4. Coleta dos votos individuais e orientações para as votações recentes de forma assíncrona
        console.log(`⏳ Buscando votos nominais do deputado nas últimas votações...`);
        const votosDeputadoMapeados = [];
        const orientacoesMapeadas = {};

        // Fazemos a chamada dos votos e orientações para as últimas 15 votações em paralelo
        await Promise.all(votacoesRecentes.map(async (v) => {
            try {
                const [votosList, orientacoesList] = await Promise.all([
                    window.camaraApi.buscarVotosVotacao(v.id),
                    window.camaraApi.buscarOrientacoesVotacao(v.id)
                ]);

                // Encontra se nosso deputado registrou voto nessa votação
                const votoDoDeputado = votosList.find(vote => 
                    vote.deputado_ && vote.deputado_.id === id
                );

                const tipoVoto = votoDoDeputado ? votoDoDeputado.tipoVoto : "Ausente";

                votosDeputadoMapeados.push({
                    votacaoId: v.id,
                    descricao: v.descricao,
                    data: v.data,
                    voto: tipoVoto
                });

                orientacoesMapeadas[v.id] = orientacoesList;
            } catch (err) {
                console.error(`Erro ao processar detalhes da votação ${v.id}:`, err);
            }
        }));

        // 5. Cálculo da coesão partidária
        const analiseCoesao = window.analytics.calcularCoesaoPartidaria(votosDeputadoMapeados, orientacoesMapeadas, siglaPartido);

        // 6. Detecção de Anomalias
        const analiseAnomalias = window.analytics.detectarAnomalias({
            presencaRate: analisePresenca.rate,
            gastoMedioMensal: analiseGastos.media,
            coesaoRate: analiseCoesao.coesao
        });

        // 7. Atualizar a UI com os dados calculados e anomalias
        renderizarPainelKPIs(analisePresenca, analiseGastos, analiseCoesao, totalProposicoes);
        renderizarAnomalias(analiseAnomalias);
        renderizarTabelaVotacoes(votosDeputadoMapeados, orientacoesMapeadas, siglaPartido);
        
        // 8. Renderizar Gráficos
        processarERenderizarGraficos(despesas, eventos, analisePresenca.total);

        // Ocultar Loading e Exibir Dashboard
        if(loadingState) loadingState.classList.add('hidden');
        if(profileContent) {
            profileContent.classList.remove('hidden');
            profileContent.classList.add('flex');
        }

    } catch (error) {
        showError("Falha ao processar e carregar dados do perfil: " + error.message);
    }
}

/**
 * Preenche os dados cadastrais principais no header do perfil.
 */
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

/**
 * Preenche os valores calculados nos 4 KPI Cards superiores.
 */
function renderizarPainelKPIs(presenca, gastos, coesao, proposicoes) {
    // 1. Presença
    const presencaEl = document.getElementById('kpi-presenca');
    const badgePresenca = document.getElementById('badge-presenca');
    if (presencaEl) presencaEl.textContent = `${presenca.rate}%`;
    if (badgePresenca) {
        badgePresenca.textContent = `${presenca.presencas} de ${presenca.total} sessões - ${presenca.classificacao.texto}`;
        badgePresenca.className = `px-2.5 py-0.5 rounded-full text-xs font-semibold border ${presenca.classificacao.classe}`;
    }

    // 2. Gastos
    const gastoEl = document.getElementById('kpi-gasto-medio');
    const badgeGasto = document.getElementById('badge-gasto-medio');
    if (gastoEl) {
        gastoEl.textContent = gastos.media.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    if (badgeGasto) {
        badgeGasto.textContent = `${gastos.classificacao.texto} (Total: ${gastos.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})`;
        badgeGasto.className = `px-2.5 py-0.5 rounded-full text-xs font-semibold border ${gastos.classificacao.classe}`;
    }

    // 3. Coesão
    const coesaoEl = document.getElementById('kpi-coesao');
    const badgeCoesao = document.getElementById('badge-coesao');
    if (coesaoEl) coesaoEl.textContent = `${coesao.coesao}%`;
    if (badgeCoesao) {
        badgeCoesao.textContent = `${coesao.iguais} de ${coesao.totalComOrientacao} alinhados - ${coesao.classificacao.texto}`;
        badgeCoesao.className = `px-2.5 py-0.5 rounded-full text-xs font-semibold border ${coesao.classificacao.classe}`;
    }

    // 4. Proposições
    const proposicoesEl = document.getElementById('kpi-proposicoes');
    if (proposicoesEl) proposicoesEl.textContent = proposicoes;
}

/**
 * Renderiza o painel/banner de anomalias detectadas.
 */
function renderizarAnomalias(anomaliaInfo) {
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
                <h4 class="font-extrabold text-base uppercase tracking-wider">⚠️ Comportamentos de Risco / Anomalia Detectada</h4>
                <p class="text-sm opacity-90 mb-2">Este deputado apresenta métricas de atuação atípicas em relação aos padrões médios legislativos:</p>
                <div class="space-y-1">${anomaliasHTML}</div>
            </div>
        </div>
    `;
    banner.classList.remove('hidden');
}

/**
 * Renderiza a tabela das últimas 15 votações nominais ocorridas no Plenário.
 */
function renderizarTabelaVotacoes(votos, orientacoes, siglaPartido) {
    const corpo = document.getElementById('tabela-votacoes-corpo');
    if (!corpo) return;

    if (votos.length === 0) {
        corpo.innerHTML = `
            <tr>
                <td colspan="5" class="py-10 text-center text-gray-500 font-medium">Nenhuma votação nominal recente encontrada para este deputado.</td>
            </tr>
        `;
        return;
    }

    // Ordenar por data decrescente
    votos.sort((a, b) => new Date(b.data) - new Date(a.data));

    corpo.innerHTML = '';

    votos.forEach(v => {
        // Encontrar orientação do partido
        const orientacoesList = orientacoes[v.votacaoId] || [];
        const orientacaoPartido = orientacoesList.find(o => 
            o.siglaPartidoBloco && o.siglaPartidoBloco.toUpperCase() === siglaPartido.toUpperCase()
        );
        const orientacaoVoto = orientacaoPartido ? orientacaoPartido.orientacaoVoto : 'Liberado';

        // Determinar badge do voto do deputado
        let badgeVotoClass = 'bg-gray-100 text-gray-700 border-gray-200';
        let votoTexto = v.voto;
        if (v.voto === 'Sim') badgeVotoClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        else if (v.voto === 'Não') badgeVotoClass = 'bg-red-50 text-red-700 border-red-200';
        else if (v.voto === 'Abstenção') badgeVotoClass = 'bg-yellow-50 text-yellow-700 border-yellow-200';
        else if (v.voto === 'Ausente') badgeVotoClass = 'bg-gray-200 text-gray-600 border-gray-300';

        // Determinar alinhamento
        let badgeAlinhamentoHTML = `<span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">Sem Orientação</span>`;
        
        if (orientacaoVoto && orientacaoVoto !== '' && orientacaoVoto !== 'Liberado') {
            const votoNormalizado = window.analytics._normalizarVoto(v.voto);
            const orientacaoNormalizada = window.analytics._normalizarVoto(orientacaoVoto);
            
            if (votoNormalizado && orientacaoNormalizada) {
                if (votoNormalizado === orientacaoNormalizada) {
                    badgeAlinhamentoHTML = `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><i class="fa-solid fa-circle-check"></i> Alinhado</span>`;
                } else {
                    badgeAlinhamentoHTML = `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200"><i class="fa-solid fa-circle-xmark"></i> Divergente</span>`;
                }
            }
        }

        const dataFormatada = new Date(v.data).toLocaleDateString('pt-BR');

        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50 transition border-b border-gray-100';
        tr.innerHTML = `
            <td class="py-4 px-6 font-semibold text-gray-600">${dataFormatada}</td>
            <td class="py-4 px-6 pr-8 font-medium text-gray-900 leading-snug">${v.descricao}</td>
            <td class="py-4 px-6 text-center">
                <span class="px-2.5 py-1 rounded-lg text-xs font-semibold border ${badgeVotoClass}">${votoTexto}</span>
            </td>
            <td class="py-4 px-6 text-center font-semibold text-gray-700">${orientacaoVoto || '-'}</td>
            <td class="py-4 px-6 text-center">${badgeAlinhamentoHTML}</td>
        `;
        corpo.appendChild(tr);
    });
}

/**
 * Organiza os dados brutos de despesas e presença para gerar os 3 gráficos Chart.js.
 */
function processarERenderizarGraficos(despesas, eventos, totalSessoesChamber) {
    // --- GRÁFICO 1: CATEGORIA DE GASTOS (Doughnut) ---
    const gastosPorCategoria = {};
    despesas.forEach(d => {
        const valor = parseFloat(d.valorDocumento || d.valorLiquido || 0);
        const tipo = d.tipoDespesa || 'Outros';
        gastosPorCategoria[tipo] = (gastosPorCategoria[tipo] || 0) + valor;
    });

    const sortedCategorias = Object.entries(gastosPorCategoria).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const catLabels = sortedCategorias.map(item => item[0]);
    const catValues = sortedCategorias.map(item => item[1]);

    renderizarGraficoCategorias(catLabels, catValues);

    // --- GRÁFICO 2: EVOLUÇÃO MENSAL DE GASTOS (Line) ---
    const gastosMensais = Array(12).fill(0);
    despesas.forEach(d => {
        if (d.mes && d.mes >= 1 && d.mes <= 12) {
            gastosMensais[d.mes - 1] += parseFloat(d.valorDocumento || d.valorLiquido || 0);
        }
    });

    const labelsMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    renderizarGraficoEvolucaoMensal(labelsMeses, gastosMensais);

    // --- GRÁFICO 3: REGISTRO DE SESSÕES DELIBERATIVAS POR MÊS (Bar) ---
    // Contar sessões do deputado por mês
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

    // Média de sessões esperadas por mês (ex: Jan recesso, Fev ~8, Mar ~10, Abr ~10, Mai ~10, etc.)
    // Vamos desenhar um gráfico de barras comparando presença com estimativa
    const sessoesPlanejadasMes = [0, 8, 10, 10, 10, 10, 8, 0, 10, 10, 10, 4];
    renderizarGraficoPresenca(labelsMeses, presencaMensal, sessoesPlanejadasMes);
}

function renderizarGraficoCategorias(labels, values) {
    const ctx = document.getElementById('graficoDespesas');
    if (!ctx) return;

    if (chartDespesas) chartDespesas.destroy();

    const colors = [
        '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6'
    ];

    chartDespesas = new Chart(ctx.getContext('2d'), {
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
                legend: {
                    position: 'bottom',
                    labels: { boxWidth: 10, font: { family: 'Inter', size: 11 } }
                },
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

function renderizarGraficoEvolucaoMensal(labels, values) {
    const ctx = document.getElementById('graficoEvolucaoGastos');
    if (!ctx) return;

    if (chartEvolucaoGastos) chartEvolucaoGastos.destroy();

    chartEvolucaoGastos = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Cota Gasta (R$)',
                data: values,
                borderColor: '#3b82f6', // Blue 500
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
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) { return 'R$ ' + (value/1000).toFixed(0) + 'k'; }
                    }
                }
            }
        }
    });
}

function renderizarGraficoPresenca(labels, presencas, totais) {
    const ctx = document.getElementById('graficoPresenca');
    if (!ctx) return;

    if (chartPresenca) chartPresenca.destroy();

    chartPresenca = new Chart(ctx.getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Presenças Registradas',
                    data: presencas,
                    backgroundColor: '#10b981', // Emerald 500
                    borderRadius: 4
                },
                {
                    label: 'Sessões Ocorridas (Estimado)',
                    data: totais,
                    backgroundColor: 'rgba(229, 231, 235, 0.8)', // Gray 200
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top', labels: { boxWidth: 12, font: { family: 'Inter' } } }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 2 }
                }
            }
        }
    });
}

// ==========================================
// CRUD OPERACIONAL - MONITORAMENTO (RADAR)
// ==========================================

/**
 * Verifica no Back4App se o deputado já está no radar do usuário logado e atualiza a UI.
 */
async function verificarEstadoRadar(deputadoId) {
    if (!btnRadarPerfil) return;
    
    const currentUser = Parse.User.current();
    if (!currentUser) {
        btnRadarPerfil.innerHTML = `<span>👁️</span> Acompanhar no Radar`;
        btnRadarPerfil.className = "flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 px-6 rounded-lg text-sm font-semibold transition-all";
        return;
    }

    try {
        const query = new Parse.Query("Monitoramento");
        query.equalTo("usuario", currentUser);
        query.equalTo("deputadoId", deputadoId);
        const match = await query.first();

        if (match) {
            btnRadarPerfil.innerHTML = `<span>✔️</span> Acompanhando no Radar`;
            btnRadarPerfil.className = "flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-6 rounded-lg text-sm font-semibold transition-all shadow-sm";
        } else {
            btnRadarPerfil.innerHTML = `<span>👁️</span> Acompanhar no Radar`;
            btnRadarPerfil.className = "flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 px-6 rounded-lg text-sm font-semibold transition-all";
        }
    } catch (err) {
        console.error("Erro ao verificar radar do perfil:", err);
    }
}

/**
 * Cria ou Deleta a linha correspondente ao deputado monitorado (CREATE / DELETE)
 */
async function alternarRadar() {
    if (!deputadoIdGlobal) return;
    
    const currentUser = Parse.User.current();
    if (!currentUser) {
        alert("Você precisa estar logado para monitorar parlamentares!");
        return;
    }

    if (btnRadarPerfil) btnRadarPerfil.disabled = true;

    try {
        const query = new Parse.Query("Monitoramento");
        query.equalTo("usuario", currentUser);
        query.equalTo("deputadoId", deputadoIdGlobal);
        const existing = await query.first();

        if (existing) {
            // DELETE
            await existing.destroy();
            console.log(`✅ ${deputadoNomeGlobal} removido do radar.`);
            if (btnRadarPerfil) {
                btnRadarPerfil.innerHTML = `<span>👁️</span> Acompanhar no Radar`;
                btnRadarPerfil.className = "flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 px-6 rounded-lg text-sm font-semibold transition-all";
            }
        } else {
            // CREATE
            const Monitoramento = Parse.Object.extend("Monitoramento");
            const newMon = new Monitoramento();
            newMon.set("usuario", currentUser);
            newMon.set("deputadoId", deputadoIdGlobal);
            newMon.set("nomeDeputado", deputadoNomeGlobal);

            await newMon.save();
            console.log(`✅ ${deputadoNomeGlobal} adicionado ao radar.`);
            if (btnRadarPerfil) {
                btnRadarPerfil.innerHTML = `<span>✔️</span> Acompanhando no Radar`;
                btnRadarPerfil.className = "flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-6 rounded-lg text-sm font-semibold transition-all shadow-sm";
            }
        }
    } catch (error) {
        console.error("Erro ao alternar radar no perfil:", error);
        alert("Erro técnico ao salvar monitoramento. Tente novamente.");
    } finally {
        if (btnRadarPerfil) btnRadarPerfil.disabled = false;
    }
}
