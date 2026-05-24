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
    try {
        const url = 'https://dadosabertos.camara.leg.br/api/v2/deputados?ordem=ASC&ordenarPor=nome&itens=10';
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Erro na requisição: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("📊 Dados da Câmara recebidos com sucesso!");
        console.log(data.dados);
        
    } catch (error) {
        console.error("❌ Erro ao buscar deputados:", error);
    }
}

/**
 * Salva um deputado no Radar (Classe Monitoramento no Back4App)
 * vinculado ao Session ID do usuário.
 */
async function adicionarAoRadar(deputadoId, nomeDeputado) {
    console.log(`⏳ Adicionando deputado ${nomeDeputado} ao radar...`);
    
    try {
        const Monitoramento = Parse.Object.extend("Monitoramento");
        const monitoramento = new Monitoramento();
        
        const currentUser = Parse.User.current();
        if (!currentUser) throw new Error("Usuário não logado.");
        
        monitoramento.set("usuario", currentUser);
        monitoramento.set("deputadoId", deputadoId);
        monitoramento.set("nomeDeputado", nomeDeputado);
        
        const resultado = await monitoramento.save();
        console.log('✅ Deputado adicionado com sucesso ao radar!', resultado.id);
        
    } catch (error) {
        console.error('❌ Falha ao salvar no Back4App: ', error.message);
    }
}

// Para testar via console:
// adicionarAoRadar(204536, "TABATA AMARAL");
