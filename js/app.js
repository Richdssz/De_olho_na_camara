// ==========================================
// CONFIGURAÇÕES E INICIALIZAÇÃO
// ==========================================

// 1. Inicialização do Parse (Back4App) puxando do env.js local
const PARSE_APP_ID = window.ENV.PARSE_APP_ID;
const PARSE_JS_KEY = window.ENV.PARSE_JS_KEY;

Parse.initialize(PARSE_APP_ID, PARSE_JS_KEY);
Parse.serverURL = 'https://parseapi.back4app.com/';

// ==========================================
// AUTENTICAÇÃO E SESSÃO
// ==========================================

const authModal = document.getElementById('auth-modal');
const btnLoginModal = document.getElementById('btn-login-modal');
const closeModal = document.getElementById('close-modal');
const btnLogin = document.getElementById('btn-login');
const btnSignup = document.getElementById('btn-signup');
const btnLogout = document.getElementById('btn-logout');
const userDisplay = document.getElementById('user-display');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const authError = document.getElementById('auth-error');

// Global states
let deputadosCarregados = [];
let chartInstancia = null;

function updateAuthUI() {
    const currentUser = Parse.User.current();
    const sessionDisplay = document.getElementById('session-display');
    
    if (currentUser) {
        if(btnLoginModal) btnLoginModal.classList.add('hidden');
        if(btnLogout) btnLogout.classList.remove('hidden');
        if(userDisplay) {
            userDisplay.classList.remove('hidden');
            userDisplay.textContent = `Olá, ${currentUser.get('username')}`;
        }
        if (sessionDisplay) sessionDisplay.textContent = currentUser.get('username');
    } else {
        if(btnLoginModal) btnLoginModal.classList.remove('hidden');
        if(btnLogout) btnLogout.classList.add('hidden');
        if(userDisplay) {
            userDisplay.classList.add('hidden');
            userDisplay.textContent = '';
        }
        if (sessionDisplay) sessionDisplay.textContent = 'Não logado';
    }

    // Atualiza os estados dos botões no grid caso já tenhamos carregado os deputados
    if (deputadosCarregados.length > 0) {
        renderizarGridDeputados();
    }
}

function showError(msg) {
    if(!authError) return;
    authError.textContent = msg;
    authError.classList.remove('hidden');
}

if(btnLoginModal) btnLoginModal.addEventListener('click', () => {
    authModal.classList.remove('hidden');
    authError.classList.add('hidden');
});

if(closeModal) closeModal.addEventListener('click', () => {
    authModal.classList.add('hidden');
});

if(btnSignup) btnSignup.addEventListener('click', async () => {
    const user = new Parse.User();
    user.set("username", authEmail.value);
    user.set("password", authPassword.value);
    user.set("email", authEmail.value);

    try {
        await user.signUp();
        authModal.classList.add('hidden');
        updateAuthUI();
        alert('Conta criada com sucesso!');
    } catch (error) {
        showError("Erro: " + error.message);
    }
});

if(btnLogin) btnLogin.addEventListener('click', async () => {
    try {
        await Parse.User.logIn(authEmail.value, authPassword.value);
        authModal.classList.add('hidden');
        updateAuthUI();
    } catch (error) {
        showError("Erro: " + error.message);
    }
});

if(btnLogout) btnLogout.addEventListener('click', async () => {
    await Parse.User.logOut();
    updateAuthUI();
});

document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    buscarDeputadosIniciais();
});


// ==========================================
// FUNCIONALIDADES PRINCIPAIS
// ==========================================

/**
 * Faz fetch na API de Dados Abertos da Câmara para pegar 10 deputados iniciais.
 */
async function buscarDeputadosIniciais() {
    console.log("⏳ Buscando deputados na API da Câmara...");
    const grid = document.getElementById('deputados-grid');
    if (!grid) return;
    
    grid.innerHTML = '<p class="text-gray-500 col-span-full text-center py-10">Carregando deputados...</p>';

    try {
        const url = 'https://dadosabertos.camara.leg.br/api/v2/deputados?ordem=ASC&ordenarPor=nome&itens=10';
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Erro na requisição: ${response.status}`);
        
        const data = await response.json();
        deputadosCarregados = data.dados;
        console.log("📊 Dados da Câmara recebidos com sucesso!");
        
        await renderizarGridDeputados();
        renderizarGraficoPartidos(deputadosCarregados);
        
    } catch (error) {
        console.error("❌ Erro ao buscar deputados:", error);
        grid.innerHTML = '<p class="text-red-500 col-span-full text-center py-10">Erro ao carregar os dados da Câmara.</p>';
    }
}

/**
 * Renderiza os cards dos deputados carregados e seus respectivos status de acompanhamento (Radar)
 */
async function renderizarGridDeputados() {
    const grid = document.getElementById('deputados-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    let monitoradosIds = [];
    const currentUser = Parse.User.current();
    if (currentUser) {
        try {
            const query = new Parse.Query("Monitoramento");
            query.equalTo("usuario", currentUser);
            const results = await query.find();
            monitoradosIds = results.map(r => r.get("deputadoId"));
        } catch (err) {
            console.error("Erro ao buscar monitorados:", err);
        }
    }
    
    deputadosCarregados.forEach(deputado => {
        const isMonitored = monitoradosIds.includes(deputado.id);
        const btnText = isMonitored ? "<span>✔️</span> Acompanhando" : "<span>👁️</span> Acompanhar";
        const btnClass = isMonitored 
            ? "flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-2 rounded-lg text-sm font-medium transition-colors" 
            : "flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-2 rounded-lg text-sm font-medium transition-colors";
            
        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col';
        
        card.innerHTML = `
            <div class="relative pt-[120%] bg-gray-200">
                <img src="${deputado.urlFoto}" alt="Foto de ${deputado.nome}" class="absolute inset-0 w-full h-full object-cover object-top" onerror="this.src='https://via.placeholder.com/150?text=Sem+Foto'">
            </div>
            <div class="p-5 flex flex-col flex-1">
                <h4 class="font-bold text-lg text-gray-900 mb-1 leading-tight">${deputado.nome}</h4>
                <p class="text-sm font-medium text-blue-600 mb-4">${deputado.siglaPartido} - ${deputado.siglaUf}</p>
                
                <div class="mt-auto grid grid-cols-2 gap-2">
                    <button id="btn-radar-${deputado.id}" onclick="adicionarAoRadar(${deputado.id}, '${deputado.nome.replace(/'/g, "\\'")}')" class="${btnClass}">
                        ${btnText}
                    </button>
                    <button onclick="abrirModalAvaliacao(${deputado.id}, '${deputado.nome.replace(/'/g, "\\'")}')" class="flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 px-2 rounded-lg text-sm font-medium transition-colors">
                        <span>⭐</span> Avaliar
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

/**
 * Desenha o gráfico de pizza/doughnut mostrando a distribuição partidária dos deputados carregados
 */
function renderizarGraficoPartidos(deputados) {
    const ctx = document.getElementById('graficoPartidos')?.getContext('2d');
    if (!ctx) return;

    // Conta deputados por partido
    const contagemPartidos = {};
    deputados.forEach(d => {
        const partido = d.siglaPartido || 'S/P';
        contagemPartidos[partido] = (contagemPartidos[partido] || 0) + 1;
    });

    const labels = Object.keys(contagemPartidos);
    const data = Object.values(contagemPartidos);

    // Destrói gráfico antigo se existir
    if (chartInstancia) {
        chartInstancia.destroy();
    }

    // Paleta de cores moderna (Tailwind HSL adaptada)
    const backgroundColors = [
        '#3b82f6', // blue
        '#ef4444', // red
        '#10b981', // emerald
        '#f59e0b', // amber
        '#8b5cf6', // violet
        '#ec4899', // pink
        '#06b6d4', // cyan
        '#f97316', // orange
        '#64748b', // slate
        '#14b8a6'  // teal
    ];

    chartInstancia = new Chart(ctx, {
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
                        font: {
                            family: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                            size: 12,
                            weight: '500'
                        }
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

/**
 * Alterna a presença de um deputado no Radar (Classe Monitoramento no Back4App)
 * CRUD: CREATE / DELETE
 */
async function adicionarAoRadar(deputadoId, nomeDeputado) {
    console.log(`⏳ Alternando radar para ${nomeDeputado} (ID: ${deputadoId})...`);
    
    const currentUser = Parse.User.current();
    if (!currentUser) {
        if (authModal) {
            authModal.classList.remove('hidden');
            if (authError) authError.classList.add('hidden');
        } else {
            alert("Você precisa fazer login para acompanhar deputados!");
        }
        return;
    }
    
    const btn = document.getElementById(`btn-radar-${deputadoId}`);
    if (btn) btn.disabled = true;
    
    try {
        const query = new Parse.Query("Monitoramento");
        query.equalTo("usuario", currentUser);
        query.equalTo("deputadoId", deputadoId);
        const existing = await query.first();
        
        if (existing) {
            // Se já está no radar, deleta (DELETE)
            await existing.destroy();
            console.log(`✅ ${nomeDeputado} removido do radar.`);
            
            if (btn) {
                btn.innerHTML = `<span>👁️</span> Acompanhar`;
                btn.className = "flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-2 rounded-lg text-sm font-medium transition-colors";
            }
        } else {
            // Se não está, adiciona (CREATE)
            const Monitoramento = Parse.Object.extend("Monitoramento");
            const monitoramento = new Monitoramento();
            
            monitoramento.set("usuario", currentUser);
            monitoramento.set("deputadoId", deputadoId);
            monitoramento.set("nomeDeputado", nomeDeputado);
            
            await monitoramento.save();
            console.log(`✅ ${nomeDeputado} adicionado ao radar.`);
            
            if (btn) {
                btn.innerHTML = `<span>✔️</span> Acompanhando`;
                btn.className = "flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-2 rounded-lg text-sm font-medium transition-colors";
            }
        }
        
    } catch (error) {
        console.error('❌ Erro ao atualizar radar: ', error.message);
        alert('Erro ao atualizar seu radar. Tente novamente.');
    } finally {
        if (btn) btn.disabled = false;
    }
}

// ==========================================
// AVALIAÇÃO DE DEPUTADOS (CRUD Parse)
// ==========================================

const avaliacaoModal = document.getElementById('avaliacao-modal');
const closeAvaliacaoModal = document.getElementById('close-avaliacao-modal');
const btnConfirmarAvaliacao = document.getElementById('btn-confirmar-avaliacao');
const avaliacaoDeputadoNome = document.getElementById('avaliacao-deputado-nome');
const estrelas = document.querySelectorAll('.estrela-btn');
const textoNota = document.getElementById('avaliacao-nota-selecionada');

let avaliacaoAtual = { deputadoId: null, nomeDeputado: null, nota: 0 };

/**
 * Abre o modal de avaliação e carrega dados existentes do usuário logado se houver (READ)
 */
async function abrirModalAvaliacao(deputadoId, nomeDeputado) {
    const currentUser = Parse.User.current();
    if (!currentUser) {
        if (authModal) {
            authModal.classList.remove('hidden');
            if (authError) authError.classList.add('hidden');
        } else {
            alert("Você precisa fazer login para avaliar um deputado!");
        }
        return;
    }
    
    avaliacaoAtual = { deputadoId, nomeDeputado, nota: 0 };
    if (avaliacaoDeputadoNome) avaliacaoDeputadoNome.textContent = nomeDeputado;
    if (textoNota) textoNota.textContent = "Selecione uma nota";
    
    const comentarioInput = document.getElementById('avaliacao-comentario');
    if (comentarioInput) comentarioInput.value = '';

    atualizarEstrelas(0);
    
    if (avaliacaoModal) avaliacaoModal.classList.remove('hidden');

    try {
        // Busca se existe uma avaliação cadastrada anteriormente por este usuário para este deputado (READ)
        const query = new Parse.Query("Avaliacao");
        query.equalTo("usuario", currentUser);
        query.equalTo("deputadoId", deputadoId);
        const existing = await query.first();
        
        if (existing) {
            avaliacaoAtual.nota = existing.get("nota") || 0;
            atualizarEstrelas(avaliacaoAtual.nota);
            if (textoNota && avaliacaoAtual.nota > 0) {
                textoNota.textContent = `Nota selecionada: ${avaliacaoAtual.nota} estrela(s) (Avaliação anterior)`;
            }
            if (comentarioInput) {
                comentarioInput.value = existing.get("comentario") || '';
            }
        }
    } catch (error) {
        console.error("Erro ao buscar avaliação existente:", error);
    }
}

if(closeAvaliacaoModal) closeAvaliacaoModal.addEventListener('click', () => {
    if (avaliacaoModal) avaliacaoModal.classList.add('hidden');
});

estrelas.forEach(estrela => {
    estrela.addEventListener('click', (e) => {
        const nota = parseInt(e.currentTarget.getAttribute('data-nota'));
        avaliacaoAtual.nota = nota;
        atualizarEstrelas(nota);
        if (textoNota) textoNota.textContent = `Nota selecionada: ${nota} estrela(s)`;
    });
});

function atualizarEstrelas(nota) {
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

if(btnConfirmarAvaliacao) btnConfirmarAvaliacao.addEventListener('click', salvarAvaliacao);

/**
 * Salva ou atualiza a avaliação (CRUD: CREATE / UPDATE)
 */
async function salvarAvaliacao() {
    if (avaliacaoAtual.nota === 0) {
        alert("Selecione uma nota de 1 a 5 antes de confirmar!");
        return;
    }
    
    const currentUser = Parse.User.current();
    if (!currentUser) return;
    
    if (btnConfirmarAvaliacao) btnConfirmarAvaliacao.disabled = true;
    
    try {
        console.log(`⏳ Salvando avaliação para ${avaliacaoAtual.nomeDeputado}...`);
        
        // Busca se existe registro para fazer UPDATE ou CREATE
        const query = new Parse.Query("Avaliacao");
        query.equalTo("usuario", currentUser);
        query.equalTo("deputadoId", avaliacaoAtual.deputadoId);
        let avaliacaoObj = await query.first();
        
        if (!avaliacaoObj) {
            // CREATE
            const Avaliacao = Parse.Object.extend("Avaliacao");
            avaliacaoObj = new Avaliacao();
            avaliacaoObj.set("usuario", currentUser);
            avaliacaoObj.set("deputadoId", avaliacaoAtual.deputadoId);
            avaliacaoObj.set("nomeDeputado", avaliacaoAtual.nomeDeputado);
        }
        
        const comentarioText = document.getElementById('avaliacao-comentario')?.value || '';
        avaliacaoObj.set("nota", avaliacaoAtual.nota);
        avaliacaoObj.set("comentario", comentarioText);
        
        await avaliacaoObj.save();
        
        console.log('✅ Avaliação salva/atualizada com sucesso no Back4App!');
        alert(`Avaliação de ${avaliacaoAtual.nomeDeputado} salva com sucesso!`);
        
        if (avaliacaoModal) avaliacaoModal.classList.add('hidden');
        
    } catch (error) {
        console.error('❌ Falha ao salvar avaliação: ', error.message);
        alert('Erro ao salvar avaliação. Tente novamente.');
    } finally {
        if (btnConfirmarAvaliacao) btnConfirmarAvaliacao.disabled = false;
    }
}
