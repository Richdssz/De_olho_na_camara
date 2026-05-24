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

    mostrarLoader() {
        if (!this.grid) return;
        this.grid.innerHTML = '<p class="text-gray-500 col-span-full text-center py-20 font-medium"><i class="fa-solid fa-circle-notch fa-spin text-2xl text-teal-600 mr-2"></i>Carregando lista de deputados...</p>';
    }

    mostrarErro() {
        if (!this.grid) return;
        this.grid.innerHTML = '<p class="text-red-500 col-span-full text-center py-20 font-medium">Falha ao carregar os dados.</p>';
    }

    mostrarVazio() {
        if (!this.grid) return;
        this.grid.innerHTML = '<p class="text-gray-500 col-span-full text-center py-20 font-medium">Nenhum deputado encontrado com os filtros aplicados.</p>';
    }

    preencherFiltroPartidos(deputados) {
        if (!this.filtroPartido) return;
        
        // Limpa opções antigas exceto a primeira ("Todos os Partidos")
        while (this.filtroPartido.options.length > 1) {
            this.filtroPartido.remove(1);
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

    renderizarGrid(deputados, monitoradosIds = []) {
        if (!this.grid) return;
        this.grid.innerHTML = '';

        deputados.forEach(deputado => {
            const isMonitored = monitoradosIds.includes(deputado.id);
            const btnText = isMonitored ? "<i class='fa-solid fa-circle-check'></i> Acompanhando" : "<i class='fa-solid fa-eye'></i> Acompanhar";
            const btnClass = isMonitored 
                ? "flex items-center justify-center gap-2 bg-teal-800 hover:bg-teal-900 text-white py-2 px-2 rounded-lg text-sm font-medium transition-colors" 
                : "flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-2 rounded-lg text-sm font-medium transition-colors";

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
                    <p class="text-sm font-medium text-teal-600 mb-4">${deputado.siglaPartido} - ${deputado.siglaUf}</p>
                    
                    <div class="mt-auto grid grid-cols-2 gap-2">
                        <button class="btn-radar ${btnClass}" data-id="${deputado.id}" data-nome="${deputado.nome.replace(/"/g, '&quot;')}">
                            ${btnText}
                        </button>
                        <button class="btn-avaliar flex items-center justify-center gap-2 bg-teal-50 hover:bg-teal-100 text-teal-700 py-2 px-2 rounded-lg text-sm font-medium transition-colors" data-id="${deputado.id}" data-nome="${deputado.nome.replace(/"/g, '&quot;')}">
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
            btn.className = "btn-radar flex items-center justify-center gap-2 bg-teal-800 hover:bg-teal-900 text-white py-2 px-2 rounded-lg text-sm font-medium transition-colors";
        } else {
            btn.innerHTML = `<i class="fa-solid fa-eye"></i> Acompanhar`;
            btn.className = "btn-radar flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-2 rounded-lg text-sm font-medium transition-colors";
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
