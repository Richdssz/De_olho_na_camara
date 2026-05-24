/**
 * View do Perfil do Partido (partido-perfil.html)
 * Manipula DOM: cabeçalho do partido, lista de membros da bancada.
 */
class PartidoPerfilView {
    constructor() {
        this.loadingState = document.getElementById('loading-state');
        this.errorState = document.getElementById('error-state');
        this.partidoContent = document.getElementById('partido-content');
        this.errorMessage = document.getElementById('error-message');
        
        this.logo = document.getElementById('partido-logo-perfil');
        this.nome = document.getElementById('partido-nome-perfil');
        this.membrosCount = document.getElementById('partido-membros-count');
        this.coesaoBadge = document.getElementById('partido-coesao-badge');
        this.grid = document.getElementById('membros-grid');
    }

    mostrarCarregamento() {
        if (this.loadingState) this.loadingState.classList.remove('hidden');
        if (this.partidoContent) this.partidoContent.classList.add('hidden');
        if (this.errorState) this.errorState.classList.add('hidden');
    }

    mostrarErro(msg) {
        if (this.loadingState) this.loadingState.classList.add('hidden');
        if (this.partidoContent) this.partidoContent.classList.add('hidden');
        if (this.errorState) this.errorState.classList.remove('hidden');
        if (this.errorMessage) this.errorMessage.textContent = msg;
    }

    mostrarConteudo() {
        if (this.loadingState) this.loadingState.classList.add('hidden');
        if (this.errorState) this.errorState.classList.add('hidden');
        if (this.partidoContent) {
            this.partidoContent.classList.remove('hidden');
            this.partidoContent.classList.add('flex');
        }
    }

    preencherDadosPerfil(partidoInfo) {
        if (this.logo) this.logo.textContent = partidoInfo.sigla;
        if (this.nome) this.nome.textContent = partidoInfo.nome || partidoInfo.sigla;
        if (this.membrosCount) this.membrosCount.textContent = partidoInfo.totalMembros;

        if (this.coesaoBadge) {
            let coesaoBadgeClass = 'bg-gray-100 text-gray-700 border-gray-200';
            let coesaoTexto = 'Sem Votos';

            if (partidoInfo.coesao !== undefined) {
                if (partidoInfo.coesao >= 90) {
                    coesaoBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    coesaoTexto = `${partidoInfo.coesao}% (Alta)`;
                } else if (partidoInfo.coesao >= 70) {
                    coesaoBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
                    coesaoTexto = `${partidoInfo.coesao}% (Média)`;
                } else {
                    coesaoBadgeClass = 'bg-red-50 text-red-700 border-red-200';
                    coesaoTexto = `${partidoInfo.coesao}% (Baixa)`;
                }
            }
            this.coesaoBadge.textContent = coesaoTexto;
            this.coesaoBadge.className = `inline-block mt-0.5 px-3 py-0.5 rounded-full text-sm font-bold border ${coesaoBadgeClass}`;
        }
    }

    renderizarMembros(membros) {
        if (!this.grid) return;
        this.grid.innerHTML = '';

        if (membros.length === 0) {
            this.grid.innerHTML = `<p class="text-gray-500 col-span-full text-center py-10 font-medium">Nenhum membro ativo encontrado para este partido.</p>`;
            return;
        }

        membros.forEach(m => {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col relative group';
            card.innerHTML = `
                <a href="deputado-perfil.html?id=${m.id}" class="relative pt-[120%] bg-gray-200 block cursor-pointer overflow-hidden">
                    <img src="${m.urlFoto}" alt="Foto de ${m.nome}" class="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300" onerror="this.src='https://via.placeholder.com/150?text=Sem+Foto'" loading="lazy">
                </a>
                <div class="p-5 flex flex-col flex-1">
                    <h4 class="font-bold text-base text-gray-900 mb-1 leading-tight line-clamp-1">
                        <a href="deputado-perfil.html?id=${m.id}" class="hover:text-teal-600 transition-colors">${m.nome}</a>
                    </h4>
                    <p class="text-xs font-semibold text-teal-600 mb-4">${m.siglaPartido} - ${m.siglaUf}</p>
                    
                    <div class="mt-auto">
                        <a href="deputado-perfil.html?id=${m.id}" class="flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-600 py-2 px-3 rounded-xl text-xs font-semibold transition-colors">
                            Ver Análise Completa
                        </a>
                    </div>
                </div>
            `;
            this.grid.appendChild(card);
        });
    }
}

window.PartidoPerfilView = PartidoPerfilView;
