/**
 * View da Lista do Meu Radar (meu-radar.html)
 * Manipula DOM: grid de deputados monitorados, loaders e empty states.
 */
class MeuRadarView {
    constructor() {
        this.grid = document.getElementById('radar-grid');
    }

    onRemoverClick(callback) {
        this._removerCallback = callback;
    }

    mostrarLoader() {
        if (!this.grid) return;
        this.grid.innerHTML = '<p class="text-gray-500 col-span-full text-center py-20 font-medium"><i class="fa-solid fa-circle-notch fa-spin text-4xl text-teal-600 mb-4 block"></i>Carregando seu radar...</p>';
    }

    mostrarErro(mensagem = "Falha ao carregar os dados do seu radar.") {
        if (!this.grid) return;
        this.grid.innerHTML = `<div class="col-span-full flex flex-col items-center justify-center py-20 text-center"><i class="fa-solid fa-triangle-exclamation text-4xl text-red-500 mb-4"></i><p class="text-gray-700 font-medium">${mensagem}</p></div>`;
    }

    mostrarVazio() {
        if (!this.grid) return;
        this.grid.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100 text-center">
                <div class="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 text-4xl mb-4">
                    <i class="fa-solid fa-satellite-dish"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-900 mb-2">Seu radar está vazio</h3>
                <p class="text-gray-500 mb-6 max-w-md">Você ainda não está acompanhando nenhum deputado. Vá para a lista de deputados e clique em "Acompanhar" para adicioná-los aqui.</p>
                <a href="deputados.html" class="bg-teal-700 hover:bg-teal-800 text-white px-6 py-3 rounded-full font-bold transition-all shadow-md flex items-center gap-2">
                    <i class="fa-solid fa-search"></i> Explorar Deputados
                </a>
            </div>
        `;
    }

    renderizarGrid(deputados) {
        if (!this.grid) return;
        this.grid.innerHTML = '';

        deputados.forEach(deputado => {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col relative group';
            
            card.innerHTML = `
                <!-- Botão Remover Absoluto -->
                <button class="btn-remover absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur text-red-500 rounded-full shadow-md flex items-center justify-center hover:bg-red-500 hover:text-white transition-all z-10 opacity-0 group-hover:opacity-100" data-id="${deputado.id}" data-nome="${deputado.nome.replace(/"/g, '&quot;')}">
                    <i class="fa-solid fa-trash"></i>
                </button>

                <a href="deputado-perfil.html?id=${deputado.id}" class="relative pt-[120%] bg-gray-200 block cursor-pointer overflow-hidden">
                    <img src="${deputado.urlFoto}" alt="Foto de ${deputado.nome}" class="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300" onerror="this.src='https://via.placeholder.com/150?text=Sem+Foto'" loading="lazy">
                    <div class="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent flex items-end p-4">
                        <span class="px-3 py-1 bg-teal-500 text-white rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
                            <i class="fa-solid fa-satellite-dish text-[10px]"></i> No Radar
                        </span>
                    </div>
                </a>
                <div class="p-5 flex flex-col flex-1">
                    <h4 class="font-bold text-lg text-gray-900 mb-1 leading-tight line-clamp-1">
                        <a href="deputado-perfil.html?id=${deputado.id}" class="hover:text-teal-600 transition-colors">${deputado.nome}</a>
                    </h4>
                    <p class="text-sm font-medium text-teal-600 mb-4">${deputado.siglaPartido} - ${deputado.siglaUf}</p>
                    
                    <div class="mt-auto grid gap-2">
                        <a href="deputado-perfil.html?id=${deputado.id}" class="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors">
                            Ver Perfil Completo
                        </a>
                    </div>
                </div>
            `;
            this.grid.appendChild(card);
        });

        const botoesRemover = this.grid.querySelectorAll('.btn-remover');
        botoesRemover.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Evita clicar no card e navegar
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                const nome = e.currentTarget.getAttribute('data-nome');
                if (this._removerCallback) this._removerCallback(id, nome, e.currentTarget);
            });
        });
    }

    removerCardLocal(btnElement) {
        if (!btnElement) return;
        const card = btnElement.closest('.bg-white');
        if (card) {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.95)';
            setTimeout(() => {
                card.remove();
                if (this.grid.children.length === 0) {
                    this.mostrarVazio();
                }
            }, 300);
        }
    }
}

window.MeuRadarView = MeuRadarView;
