console.log("Página Deputados carregada");

// ==========================================
// CONFIGURAÇÕES E INICIALIZAÇÃO
// ==========================================

const PARSE_APP_ID = window.ENV.PARSE_APP_ID;
const PARSE_JS_KEY = window.ENV.PARSE_JS_KEY;

Parse.initialize(PARSE_APP_ID, PARSE_JS_KEY);
Parse.serverURL = 'https://parseapi.back4app.com/';

// DOM Elements
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

const filtroNome = document.getElementById('filtro-nome');
const filtroUf = document.getElementById('filtro-uf');
const filtroPartido = document.getElementById('filtro-partido');
const ordenarPor = document.getElementById('ordenar-por');

const grid = document.getElementById('deputados-grid');
const paginacaoInfo = document.getElementById('paginacao-info');
const btnPagAnterior = document.getElementById('btn-pag-anterior');
const btnPagProxima = document.getElementById('btn-pag-proxima');

// State Variables
let todosDeputados = [];
let deputadosFiltrados = [];
let monitoradosIds = [];
let paginaAtual = 1;
const itensPorPagina = 30;

document.addEventListener('DOMContentLoaded', async () => {
    updateAuthUI();
    await carregarDadosIniciais();

    // Event Listeners para Filtros
    if (filtroNome) filtroNome.addEventListener('input', aplicarFiltrosESort);
    if (filtroUf) filtroUf.addEventListener('change', aplicarFiltrosESort);
    if (filtroPartido) filtroPartido.addEventListener('change', aplicarFiltrosESort);
    if (ordenarPor) ordenarPor.addEventListener('change', aplicarFiltrosESort);

    // Event Listeners de Paginação
    if (btnPagAnterior) btnPagAnterior.addEventListener('click', () => mudarPagina(-1));
    if (btnPagProxima) btnPagProxima.addEventListener('click', () => mudarPagina(1));

    // Event Listeners de Auth
    if (btnLoginModal) btnLoginModal.addEventListener('click', () => {
        authModal.classList.remove('hidden');
        if (authError) authError.classList.add('hidden');
    });
    if (closeModal) closeModal.addEventListener('click', () => authModal.classList.add('hidden'));
    
    if (btnSignup) btnSignup.addEventListener('click', cadastrarUsuario);
    if (btnLogin) btnLogin.addEventListener('click', loginUsuario);
    if (btnLogout) btnLogout.addEventListener('click', logoutUsuario);
});

// ==========================================
// AUTENTICAÇÃO E SESSÃO
// ==========================================

function updateAuthUI() {
    const currentUser = Parse.User.current();
    const sessionDisplay = document.getElementById('session-display');
    
    if (currentUser) {
        if (btnLoginModal) btnLoginModal.classList.add('hidden');
        if (btnLogout) btnLogout.classList.remove('hidden');
        if (userDisplay) {
            userDisplay.classList.remove('hidden');
            userDisplay.textContent = `Olá, ${currentUser.get('username')}`;
        }
        if (sessionDisplay) sessionDisplay.textContent = currentUser.get('username');
    } else {
        if (btnLoginModal) btnLoginModal.classList.remove('hidden');
        if (btnLogout) btnLogout.classList.add('hidden');
        if (userDisplay) {
            userDisplay.classList.add('hidden');
            userDisplay.textContent = '';
        }
        if (sessionDisplay) sessionDisplay.textContent = 'Não logado';
    }
}

async function cadastrarUsuario() {
    const user = new Parse.User();
    user.set("username", authEmail.value);
    user.set("password", authPassword.value);
    user.set("email", authEmail.value);

    try {
        await user.signUp();
        authModal.classList.add('hidden');
        updateAuthUI();
        await atualizarMonitorados();
        renderizarGrid();
        alert('Conta criada com sucesso!');
    } catch (error) {
        if (authError) {
            authError.textContent = "Erro: " + error.message;
            authError.classList.remove('hidden');
        }
    }
}

async function loginUsuario() {
    try {
        await Parse.User.logIn(authEmail.value, authPassword.value);
        authModal.classList.add('hidden');
        updateAuthUI();
        await atualizarMonitorados();
        renderizarGrid();
    } catch (error) {
        if (authError) {
            authError.textContent = "Erro: " + error.message;
            authError.classList.remove('hidden');
        }
    }
}

async function logoutUsuario() {
    await Parse.User.logOut();
    updateAuthUI();
    monitoradosIds = [];
    renderizarGrid();
}

// ==========================================
// CARREGAMENTO E PROCESSAMENTO DE DADOS
// ==========================================

async function carregarDadosIniciais() {
    if (grid) {
        grid.innerHTML = '<p class="text-gray-500 col-span-full text-center py-20 font-medium"><i class="fa-solid fa-circle-notch fa-spin text-2xl text-blue-500 mr-2"></i>Carregando lista completa de deputados...</p>';
    }

    try {
        // 1. Busca os IDs monitorados no Back4App se estiver logado
        await atualizarMonitorados();

        // 2. Busca todos os deputados ativos na API da Câmara (limite alto 600 para pegar todos de uma vez)
        todosDeputados = await window.camaraApi.listarDeputados({ itens: 600 });
        console.log(`📊 Total de deputados retornados: ${todosDeputados.length}`);

        // 3. Preenche filtro de Partidos
        preencherFiltroPartidos(todosDeputados);

        // 4. Inicializa o grid
        aplicarFiltrosESort();

    } catch (error) {
        console.error("Erro ao carregar dados:", error);
        if (grid) {
            grid.innerHTML = '<p class="text-red-500 col-span-full text-center py-20 font-medium">Falha ao se conectar com a API da Câmara.</p>';
        }
    }
}

async function atualizarMonitorados() {
    const currentUser = Parse.User.current();
    if (currentUser) {
        try {
            const query = new Parse.Query("Monitoramento");
            query.equalTo("usuario", currentUser);
            // Pega todos para cachear localmente no array monitoradosIds
            query.limit(1000);
            const results = await query.find();
            monitoradosIds = results.map(r => r.get("deputadoId"));
        } catch (err) {
            console.error("Erro ao buscar monitoramento do usuário:", err);
            monitoradosIds = [];
        }
    } else {
        monitoradosIds = [];
    }
}

function preencherFiltroPartidos(deputados) {
    if (!filtroPartido) return;
    
    // Extrai siglas de partido únicas e ordena
    const partidosUnicos = [...new Set(deputados.map(d => d.siglaPartido))]
        .filter(p => p)
        .sort();

    partidosUnicos.forEach(p => {
        const option = document.createElement('option');
        option.value = p;
        option.textContent = p;
        filtroPartido.appendChild(option);
    });
}

// ==========================================
// FILTRAGEM, ORDENAÇÃO E PAGINAÇÃO
// ==========================================

function aplicarFiltrosESort() {
    const nomeBusca = (filtroNome?.value || '').toLowerCase().trim();
    const ufBusca = filtroUf?.value || '';
    const partidoBusca = filtroPartido?.value || '';
    const ordem = ordenarPor?.value || 'nome';

    // 1. Filtragem
    deputadosFiltrados = todosDeputados.filter(d => {
        const nomeStatus = (d.nome || '').toLowerCase();
        const matchesNome = nomeStatus.includes(nomeBusca);
        const matchesUf = ufBusca === '' || d.siglaUf === ufBusca;
        const matchesPartido = partidoBusca === '' || d.siglaPartido === partidoBusca;
        
        return matchesNome && matchesUf && matchesPartido;
    });

    // 2. Ordenação
    deputadosFiltrados.sort((a, b) => {
        if (ordem === 'siglaPartido') {
            // Ordena por partido, e em caso de empate por nome
            const pCompare = (a.siglaPartido || '').localeCompare(b.siglaPartido || '');
            if (pCompare !== 0) return pCompare;
            return (a.nome || '').localeCompare(b.nome || '');
        }
        if (ordem === 'siglaUf') {
            // Ordena por UF, e em caso de empate por nome
            const ufCompare = (a.siglaUf || '').localeCompare(b.siglaUf || '');
            if (ufCompare !== 0) return ufCompare;
            return (a.nome || '').localeCompare(b.nome || '');
        }
        // Nome por padrão
        return (a.nome || '').localeCompare(b.nome || '');
    });

    // 3. Reset da Paginação
    paginaAtual = 1;
    renderizarGrid();
}

function renderizarGrid() {
    if (!grid) return;
    grid.innerHTML = '';

    if (deputadosFiltrados.length === 0) {
        grid.innerHTML = '<p class="text-gray-500 col-span-full text-center py-20 font-medium">Nenhum deputado encontrado com os filtros aplicados.</p>';
        atualizarBotoesPaginacao(0);
        return;
    }

    // Calcula fatiamento da paginação
    const indexInicio = (paginaAtual - 1) * itensPorPagina;
    const indexFim = Math.min(indexInicio + itensPorPagina, deputadosFiltrados.length);
    const deputadosPagina = deputadosFiltrados.slice(indexInicio, indexFim);

    deputadosPagina.forEach(deputado => {
        const isMonitored = monitoradosIds.includes(deputado.id);
        const btnText = isMonitored ? "<span>✔️</span> Acompanhando" : "<span>👁️</span> Acompanhar";
        const btnClass = isMonitored 
            ? "flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-2 rounded-lg text-sm font-medium transition-colors" 
            : "flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-2 rounded-lg text-sm font-medium transition-colors";

        const card = document.createElement('div');
        card.className = 'bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col';
        
        card.innerHTML = `
            <a href="deputado-perfil.html?id=${deputado.id}" class="relative pt-[120%] bg-gray-200 block cursor-pointer group overflow-hidden">
                <img src="${deputado.urlFoto}" alt="Foto de ${deputado.nome}" class="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300" onerror="this.src='https://via.placeholder.com/150?text=Sem+Foto'" loading="lazy">
            </a>
            <div class="p-5 flex flex-col flex-1">
                <h4 class="font-bold text-lg text-gray-900 mb-1 leading-tight">
                    <a href="deputado-perfil.html?id=${deputado.id}" class="hover:text-blue-600 transition-colors">${deputado.nome}</a>
                </h4>
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

    atualizarBotoesPaginacao(deputadosFiltrados.length);
}

function mudarPagina(direcao) {
    const totalPaginas = Math.ceil(deputadosFiltrados.length / itensPorPagina);
    const novaPagina = paginaAtual + direcao;

    if (novaPagina >= 1 && novaPagina <= totalPaginas) {
        paginaAtual = novaPagina;
        renderizarGrid();
        // Volta o scroll do container principal para o topo
        document.querySelector('main').scrollTop = 0;
    }
}

function atualizarBotoesPaginacao(totalItens) {
    const totalPaginas = Math.ceil(totalItens / itensPorPagina) || 1;
    
    if (paginacaoInfo) {
        const inicio = totalItens === 0 ? 0 : (paginaAtual - 1) * itensPorPagina + 1;
        const fim = Math.min(paginaAtual * itensPorPagina, totalItens);
        paginacaoInfo.textContent = `Exibindo ${inicio}-${fim} de ${totalItens} deputados (Página ${paginaAtual} de ${totalPaginas})`;
    }

    if (btnPagAnterior) btnPagAnterior.disabled = paginaAtual === 1;
    if (btnPagProxima) btnPagProxima.disabled = paginaAtual === totalPaginas;
}

// ==========================================
// CRUD OPERACIONAL - MONITORAMENTO (RADAR)
// ==========================================

window.adicionarAoRadar = async function(deputadoId, nomeDeputado) {
    const currentUser = Parse.User.current();
    if (!currentUser) {
        if (authModal) {
            authModal.classList.remove('hidden');
            if (authError) authError.classList.add('hidden');
        } else {
            alert("Acesse sua conta para utilizar o monitoramento!");
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
            // DELETE
            await existing.destroy();
            console.log(`✅ ${nomeDeputado} removido do radar.`);
            
            // Remove do cache local
            monitoradosIds = monitoradosIds.filter(id => id !== deputadoId);
            
            if (btn) {
                btn.innerHTML = `<span>👁️</span> Acompanhar`;
                btn.className = "flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-2 rounded-lg text-xs font-semibold transition-colors";
            }
        } else {
            // CREATE
            const Monitoramento = Parse.Object.extend("Monitoramento");
            const newMon = new Monitoramento();
            newMon.set("usuario", currentUser);
            newMon.set("deputadoId", deputadoId);
            newMon.set("nomeDeputado", nomeDeputado);

            await newMon.save();
            console.log(`✅ ${nomeDeputado} adicionado ao radar.`);
            
            // Adiciona ao cache local
            monitoradosIds.push(deputadoId);

            if (btn) {
                btn.innerHTML = `<span>✔️</span> Acompanhando`;
                btn.className = "flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-2 rounded-lg text-xs font-semibold transition-colors";
            }
        }
    } catch (error) {
        console.error("Erro ao alterar monitoramento:", error);
        alert("Erro técnico ao salvar monitoramento.");
    } finally {
        if (btn) btn.disabled = false;
    }
};

// ==========================================
// CRUD OPERACIONAL - AVALIAÇÃO (MODAL)
// ==========================================

const avaliacaoModal = document.getElementById('avaliacao-modal');
const closeAvaliacaoModal = document.getElementById('close-avaliacao-modal');
const btnConfirmarAvaliacao = document.getElementById('btn-confirmar-avaliacao');
const avaliacaoDeputadoNome = document.getElementById('avaliacao-deputado-nome');
const estrelas = document.querySelectorAll('.estrela-btn');
const textoNota = document.getElementById('avaliacao-nota-selecionada');

let avaliacaoAtual = { deputadoId: null, nomeDeputado: null, nota: 0 };

window.abrirModalAvaliacao = async function(deputadoId, nomeDeputado) {
    const currentUser = Parse.User.current();
    if (!currentUser) {
        if (authModal) {
            authModal.classList.remove('hidden');
            if (authError) authError.classList.add('hidden');
        } else {
            alert("Acesse sua conta para avaliar os parlamentares!");
        }
        return;
    }

    avaliacaoAtual = { deputadoId, nomeDeputado, nota: 0 };
    if (avaliacaoDeputadoNome) avaliacaoDeputadoNome.textContent = nomeDeputado;
    if (textoNota) textoNota.textContent = "Selecione uma nota";
    
    const comentarioInput = document.getElementById('avaliacao-comentario');
    if (comentarioInput) comentarioInput.value = '';

    atualizarEstrelasVisual(0);
    if (avaliacaoModal) avaliacaoModal.classList.remove('hidden');

    try {
        const query = new Parse.Query("Avaliacao");
        query.equalTo("usuario", currentUser);
        query.equalTo("deputadoId", deputadoId);
        const existing = await query.first();

        if (existing) {
            avaliacaoAtual.nota = existing.get("nota") || 0;
            atualizarEstrelasVisual(avaliacaoAtual.nota);
            if (textoNota) textoNota.textContent = `Nota selecionada: ${avaliacaoAtual.nota} estrela(s) (Avaliação anterior)`;
            if (comentarioInput) comentarioInput.value = existing.get("comentario") || '';
        }
    } catch (err) {
        console.error("Erro ao carregar avaliação do Back4App:", err);
    }
};

if (closeAvaliacaoModal) {
    closeAvaliacaoModal.addEventListener('click', () => {
        if (avaliacaoModal) avaliacaoModal.classList.add('hidden');
    });
}

estrelas.forEach(estrela => {
    estrela.addEventListener('click', (e) => {
        const nota = parseInt(e.currentTarget.getAttribute('data-nota'));
        avaliacaoAtual.nota = nota;
        atualizarEstrelasVisual(nota);
        if (textoNota) textoNota.textContent = `Nota selecionada: ${nota} estrela(s)`;
    });
});

function atualizarEstrelasVisual(nota) {
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

if (btnConfirmarAvaliacao) {
    btnConfirmarAvaliacao.addEventListener('click', salvarAvaliacao);
}

async function salvarAvaliacao() {
    if (avaliacaoAtual.nota === 0) {
        alert("Selecione uma nota de 1 a 5 antes de salvar.");
        return;
    }

    const currentUser = Parse.User.current();
    if (!currentUser) return;

    if (btnConfirmarAvaliacao) btnConfirmarAvaliacao.disabled = true;

    try {
        const query = new Parse.Query("Avaliacao");
        query.equalTo("usuario", currentUser);
        query.equalTo("deputadoId", avaliacaoAtual.deputadoId);
        let avaliacaoObj = await query.first();

        if (!avaliacaoObj) {
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
        alert(`Avaliação de ${avaliacaoAtual.nomeDeputado} salva com sucesso!`);
        
        if (avaliacaoModal) avaliacaoModal.classList.add('hidden');
    } catch (err) {
        console.error("Erro ao salvar avaliação:", err);
        alert("Erro técnico ao salvar avaliação.");
    } finally {
        if (btnConfirmarAvaliacao) btnConfirmarAvaliacao.disabled = false;
    }
}
