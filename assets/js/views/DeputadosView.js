/**
 * View da Lista de Deputados (deputados.html)
 * Manipula DOM: grid de deputados, paginação, loaders e filtros.
 */
class DeputadosView {
    constructor() {
        this.grid = document.getElementById('deputados-grid');
        this.paginacaoInfo = document.getElementById('paginacao-info');
        this.btnPagAnterior = document.getElementById('btn-pag-anterior');
        this.btnPagProxima = document.getElementById('btn-pag-proxima');
        this.filtroPartido = document.getElementById('filtro-partido');
        this.filtroNome = document.getElementById('filtro-nome');
        this.filtroUf = document.getElementById('filtro-uf');
        this.ordenarPor = document.getElementById('ordenar-por');
    }

    onFiltrar(callback) {
        const trigger = () => callback();
        if (this.filtroNome) this.filtroNome.addEventListener('input', trigger);
        if (this.filtroUf) this.filtroUf.addEventListener('change', trigger);
        if (this.filtroPartido) this.filtroPartido.addEventListener('change', trigger);
        if (this.ordenarPor) this.ordenarPor.addEventListener('change', trigger);
    }

    onPaginar(callback) {
        if (this.btnPagAnterior) this.btnPagAnterior.addEventListener('click', () => callback(-1));
        if (this.btnPagProxima) this.btnPagProxima.addEventListener('click', () => callback(1));
    }

    onAcompanharClick(callback) {
        this._acompanharCallback = callback;
    }

    onAvaliarClick(callback) {
        this._avaliarCallback = callback;
    }

    getFiltros() {
        return {
            nome: (this.filtroNome?.value || '').toLowerCase().trim(),
            uf: this.filtroUf?.value || '',
            partido: this.filtroPartido?.value || '',
            ordem: this.ordenarPor?.value || 'nome'
        };
    }

    setFiltros(filtros) {
        if (this.filtroNome && filtros.nome !== undefined) this.filtroNome.value = filtros.nome;
        if (this.filtroUf && filtros.uf !== undefined) this.filtroUf.value = filtros.uf;
        if (this.filtroPartido && filtros.partido !== undefined) this.filtroPartido.value = filtros.partido;
        if (this.ordenarPor && filtros.ordem !== undefined) this.ordenarPor.value = filtros.ordem;
    }

    mostrarLoader() {
        if (!this.grid) return;
        this.grid.innerHTML = '';
        for (let i = 0; i < 8; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = 'bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col animate-pulse';
            skeleton.innerHTML = `
                <div class="pt-[120%] bg-gray-200"></div>
                <div class="p-5 flex flex-col flex-1 space-y-3">
                    <div class="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div class="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div class="grid grid-cols-2 gap-2 mt-auto">
                        <div class="h-9 bg-gray-200 rounded-lg"></div>
                        <div class="h-9 bg-gray-200 rounded-lg"></div>
                    </div>
                </div>
            `;
            this.grid.appendChild(skeleton);
        }
    }

    mostrarErro(mensagem = 'Falha ao carregar os dados.') {
        if (!this.grid) return;
        this.grid.innerHTML = `<div class="col-span-full text-center py-20 flex flex-col items-center justify-center">
            <i class="fa-solid fa-circle-exclamation text-red-400 text-3xl mb-3"></i>
            <p class="text-red-500 font-medium">${mensagem}</p>
            <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-sm font-medium transition-colors">
                <i class="fa-solid fa-rotate mr-2"></i>Tentar novamente
            </button>
        </div>`;
    }

    mostrarVazio() {
        if (!this.grid) return;
        this.grid.innerHTML = `
            <div class="col-span-full text-center py-20 flex flex-col items-center justify-center">
                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
                    <i class="fa-solid fa-magnifying-glass text-2xl"></i>
                </div>
                <h3 class="text-lg font-bold text-gray-900 mb-1">Nenhum dado encontrado</h3>
                <p class="text-gray-500 text-sm max-w-xs">Nao encontramos deputados com os filtros selecionados.</p>
            </div>
        `;
    }

    preencherFiltroPartidos(deputados) {
        if (!this.filtroPartido) return;
        
        // Limpa opções antigas exceto a primeira ("Todos os Partidos")
        while (this.filtroPartido.options.length > 1) {
            this.filtroPartido.remove(1);
        }

        if (!Array.isArray(deputados)) {
            console.error("preencherFiltroPartidos: deputados não é um array válido", deputados);
            return;
        }

        // Extrai siglas únicas dos deputados e ordena
        const siglasUnicas = [...new Set(deputados.map(d => d.siglaPartido).filter(Boolean))].sort();

        siglasUnicas.forEach(sigla => {
            const option = document.createElement('option');
            option.value = sigla;
            option.textContent = sigla;
            this.filtroPartido.appendChild(option);
        });
    }

    renderizarGrid(deputados, monitoradosIds = [], ratingsMap = {}) {
        if (!this.grid) return;
        this.grid.innerHTML = '';

        deputados.forEach(deputado => {
            const isMonitored = monitoradosIds.includes(deputado.id);
            const btnText = isMonitored ? "<i class='fa-solid fa-circle-check'></i> Acompanhando" : "<i class='fa-solid fa-eye'></i> Acompanhar";
            const btnClass = isMonitored 
                ? "flex items-center justify-center gap-2 bg-teal-800 hover:bg-teal-900 text-white py-2 px-2 rounded-lg text-sm font-medium transition-colors" 
                : "flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-2 rounded-lg text-sm font-medium transition-colors";

            const media = ratingsMap[deputado.id];
            const ratingHTML = (media && media > 0)
                ? `<div class="flex items-center gap-1 text-sm font-bold mb-3"><i class="fa-solid fa-star text-yellow-400"></i> <span class="text-gray-700">${parseFloat(media).toFixed(1)} / 5</span></div>`
                : `<div class="mb-3"><span class="text-gray-400 text-xs font-medium">Sem avaliações</span></div>`;

            const card = document.createElement('div');
            card.className = 'bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col';
            
            card.innerHTML = `
                <a href="deputado-perfil.html?id=${deputado.id}" class="relative pt-[120%] bg-gray-200 block cursor-pointer group overflow-hidden">
                    <img src="${deputado.urlFoto}" alt="Foto de ${deputado.nome}" class="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300" onerror="this.src='https://via.placeholder.com/150?text=Sem+Foto'" loading="lazy">
                </a>
                <div class="p-5 flex flex-col flex-1">
                    <h4 class="font-bold text-lg text-gray-900 mb-1 leading-tight">
                        <a href="deputado-perfil.html?id=${deputado.id}" class="hover:text-teal-600 transition-colors">${deputado.nome}</a>
                    </h4>
                    <p class="text-sm font-medium text-teal-600 mb-2">${deputado.siglaPartido} - ${deputado.siglaUf}</p>
                    ${ratingHTML}
                    <div class="mt-auto flex flex-col gap-2">
                        <button class="btn-radar w-full flex items-center justify-center gap-2 ${isMonitored ? 'bg-teal-800 hover:bg-teal-900 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} py-2 px-3 rounded-lg text-sm font-medium transition-colors" data-id="${deputado.id}" data-nome="${deputado.nome.replace(/"/g, '&quot;')}">
                            ${btnText}
                        </button>
                        <button class="btn-avaliar w-full flex items-center justify-center gap-2 bg-teal-50 hover:bg-teal-100 text-teal-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors" data-id="${deputado.id}" data-nome="${deputado.nome.replace(/"/g, '&quot;')}">
                            <i class="fa-solid fa-star text-yellow-500"></i> Avaliar
                        </button>
                    </div>
                </div>
            `;
            this.grid.appendChild(card);
        });

        const botoesRadar = this.grid.querySelectorAll('.btn-radar');
        botoesRadar.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                const nome = e.currentTarget.getAttribute('data-nome');
                if (this._acompanharCallback) this._acompanharCallback(id, nome, e.currentTarget);
            });
        });

        const botoesAvaliar = this.grid.querySelectorAll('.btn-avaliar');
        botoesAvaliar.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.getAttribute('data-id'));
                const nome = e.currentTarget.getAttribute('data-nome');
                if (this._avaliarCallback) this._avaliarCallback(id, nome);
            });
        });
    }

    atualizarBotaoRadar(btn, acao) {
        if (!btn) return;
        if (acao === 'added') {
            btn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Acompanhando`;
            btn.className = "btn-radar w-full flex items-center justify-center gap-2 bg-teal-800 hover:bg-teal-900 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors";
        } else {
            btn.innerHTML = `<i class="fa-solid fa-eye"></i> Acompanhar`;
            btn.className = "btn-radar w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors";
        }
    }

    atualizarPaginacaoInfo(totalItens, paginaAtual, totalPaginas, itensPorPagina) {
        if (this.paginacaoInfo) {
            const inicio = totalItens === 0 ? 0 : (paginaAtual - 1) * itensPorPagina + 1;
            const fim = Math.min(paginaAtual * itensPorPagina, totalItens);
            this.paginacaoInfo.textContent = `Exibindo ${inicio}-${fim} de ${totalItens} deputados (Página ${paginaAtual} de ${totalPaginas})`;
        }

        if (this.btnPagAnterior) this.btnPagAnterior.disabled = paginaAtual === 1;
        if (this.btnPagProxima) this.btnPagProxima.disabled = paginaAtual === totalPaginas;
    }

    scrollParaTopo() {
        const main = document.querySelector('main');
        if (main) main.scrollTop = 0;
    }
}

window.DeputadosView = DeputadosView;
