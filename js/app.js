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
    
    // Mostra loading state (opcional)
    grid.innerHTML = '<p class="text-gray-500 col-span-full text-center py-10">Carregando deputados...</p>';

    try {
        const url = 'https://dadosabertos.camara.leg.br/api/v2/deputados?ordem=ASC&ordenarPor=nome&itens=10';
        const response = await fetch(url);
        
        if (!response.ok) throw new Error(`Erro na requisição: ${response.status}`);
        
        const data = await response.json();
        console.log("📊 Dados da Câmara recebidos com sucesso!");
        
        // Limpa o grid
        grid.innerHTML = '';
        
        // Itera e injeta os cards
        data.dados.forEach(deputado => {
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
                        <button onclick="adicionarAoRadar(${deputado.id}, '${deputado.nome.replace(/'/g, "\\'")}')" class="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-2 rounded-lg text-sm font-medium transition-colors">
                            <span>👁️</span> Acompanhar
                        </button>
                        <button onclick="abrirModalAvaliacao(${deputado.id}, '${deputado.nome.replace(/'/g, "\\'")}')" class="flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 px-2 rounded-lg text-sm font-medium transition-colors">
                            <span>⭐</span> Avaliar
                        </button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
        
    } catch (error) {
        console.error("❌ Erro ao buscar deputados:", error);
        grid.innerHTML = '<p class="text-red-500 col-span-full text-center py-10">Erro ao carregar os dados da Câmara.</p>';
    }
}

/**
 * Salva um deputado no Radar (Classe Monitoramento no Back4App)
 * vinculado ao Session ID do usuário.
 */
async function adicionarAoRadar(deputadoId, nomeDeputado) {
    console.log(`⏳ Adicionando deputado ${nomeDeputado} (ID: ${deputadoId}) ao radar...`);
    
    try {
        const currentUser = Parse.User.current();
        if (!currentUser) {
            alert("Faça login para acompanhar deputados!");
            return;
        }
        
        const Monitoramento = Parse.Object.extend("Monitoramento");
        const monitoramento = new Monitoramento();
        
        monitoramento.set("usuario", currentUser);
        monitoramento.set("deputadoId", deputadoId);
        monitoramento.set("nomeDeputado", nomeDeputado);
        
        const resultado = await monitoramento.save();
        console.log('✅ Deputado adicionado com sucesso ao radar!', resultado.id);
        alert(`${nomeDeputado} adicionado ao seu radar!`);
        
    } catch (error) {
        console.error('❌ Falha ao salvar no Back4App: ', error.message);
        alert('Erro ao salvar no radar. Tente novamente.');
    }
}

/**
 * STUB: Abrir Modal de Avaliação
 * A lógica do Parse SDK (CRUD da classe Avaliacao) entrará aqui no próximo passo.
 */
function abrirModalAvaliacao(deputadoId, nomeDeputado) {
    console.log(`⭐ Abrir avaliação para ${nomeDeputado} (ID: ${deputadoId})`);
    
    const currentUser = Parse.User.current();
    if (!currentUser) {
        alert("Você precisa fazer login para avaliar um deputado!");
        return;
    }
    
    alert(`O modal de avaliação para ${nomeDeputado} será implementado na próxima fase!\n\nAqui faremos o CREATE/UPDATE na classe Avaliacao no Back4App.`);
}
