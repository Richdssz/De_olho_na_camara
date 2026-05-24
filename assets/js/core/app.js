console.log("App Core carregado");

// ==========================================
// AUTENTICAÇÃO E SESSÃO GLOBAIS
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
    const currentUser = window.Back4AppService ? window.Back4AppService.getCurrentUser() : null;
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
    if(authError) authError.classList.add('hidden');
});

if(closeModal) closeModal.addEventListener('click', () => {
    authModal.classList.add('hidden');
});

if(btnSignup) btnSignup.addEventListener('click', async () => {
    try {
        await window.Back4AppService.signup(authEmail.value, authPassword.value, authEmail.value);
        authModal.classList.add('hidden');
        updateAuthUI();
        alert('Conta criada com sucesso!');
        // Se houver um controller ativo com recarregarGrid, chama ele
        if (window.activeController && typeof window.activeController.recarregarGrid === 'function') {
            window.activeController.recarregarGrid();
        }
    } catch (error) {
        showError("Erro: " + error.message);
    }
});

if(btnLogin) btnLogin.addEventListener('click', async () => {
    try {
        await window.Back4AppService.login(authEmail.value, authPassword.value);
        authModal.classList.add('hidden');
        updateAuthUI();
        if (window.activeController && typeof window.activeController.recarregarGrid === 'function') {
            window.activeController.recarregarGrid();
        }
    } catch (error) {
        showError("Erro: " + error.message);
    }
});

if(btnLogout) btnLogout.addEventListener('click', async () => {
    await window.Back4AppService.logout();
    updateAuthUI();
    if (window.activeController && typeof window.activeController.recarregarGrid === 'function') {
        window.activeController.recarregarGrid();
    }
});

// ==========================================
// MODAL GERAL DE AVALIAÇÃO (DISPONÍVEL EM TODAS AS TELAS)
// ==========================================

const avaliacaoModal = document.getElementById('avaliacao-modal');
const closeAvaliacaoModal = document.getElementById('close-avaliacao-modal');
const btnConfirmarAvaliacao = document.getElementById('btn-confirmar-avaliacao');
const avaliacaoDeputadoNome = document.getElementById('avaliacao-deputado-nome');
const estrelas = document.querySelectorAll('.estrela-btn');
const textoNota = document.getElementById('avaliacao-nota-selecionada');
const comentarioInput = document.getElementById('avaliacao-comentario');

let avaliacaoAtual = { deputadoId: null, nomeDeputado: null, nota: 0 };

window.abrirModalAvaliacao = async function(deputadoId, nomeDeputado) {
    if (!window.Back4AppService || !window.Back4AppService.getCurrentUser()) {
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
    if (comentarioInput) comentarioInput.value = '';

    atualizarEstrelas(0);
    if (avaliacaoModal) avaliacaoModal.classList.remove('hidden');

    try {
        if (window.AvaliacaoModel) {
            const resp = await window.AvaliacaoModel.buscarAvaliacao(deputadoId);
            if (resp.success && resp.data.nota > 0) {
                avaliacaoAtual.nota = resp.data.nota;
                atualizarEstrelas(avaliacaoAtual.nota);
                if (textoNota) textoNota.textContent = `Nota selecionada: ${avaliacaoAtual.nota} estrela(s) (Avaliação anterior)`;
                if (comentarioInput) comentarioInput.value = resp.data.comentario || '';
            }
        }
    } catch (error) {
        console.error("Erro ao carregar avaliação do modal:", error);
    }
};

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

if(btnConfirmarAvaliacao) btnConfirmarAvaliacao.addEventListener('click', async () => {
    if (avaliacaoAtual.nota === 0) {
        alert("Selecione uma nota de 1 a 5 antes de confirmar!");
        return;
    }
    
    if (btnConfirmarAvaliacao) btnConfirmarAvaliacao.disabled = true;
    
    try {
        if (window.AvaliacaoModel) {
            const comentario = comentarioInput ? comentarioInput.value : '';
            const resp = await window.AvaliacaoModel.salvarAvaliacao(avaliacaoAtual.deputadoId, avaliacaoAtual.nomeDeputado, avaliacaoAtual.nota, comentario);
            if (resp.success) {
                alert(`Avaliação de ${avaliacaoAtual.nomeDeputado} salva com sucesso!`);
                if (avaliacaoModal) avaliacaoModal.classList.add('hidden');
            } else {
                alert("Erro ao salvar avaliação.");
            }
        }
    } catch (error) {
        console.error("Falha ao salvar avaliação:", error);
        alert('Erro ao salvar avaliação. Tente novamente.');
    } finally {
        if (btnConfirmarAvaliacao) btnConfirmarAvaliacao.disabled = false;
    }
});

document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
});

