/**
 * View do Ranking de Economia (ranking-economia.html)
 * Manipula DOM: pódio Top 3, tabela paginada de despesas, paginação e filtros.
 */
class RankingEconomiaView {
    constructor() {
        this.loader = document.getElementById('ranking-loading');
        this.content = document.getElementById('ranking-content');
        
        // Filtros
        this.filtroPartido = document.getElementById('filtro-partido');
        this.filtroUf = document.getElementById('filtro-uf');
        this.filtroAno = document.getElementById('filtro-ano');
        
        // Listagens
        this.podioContainer = document.getElementById('ranking-podio');
        this.tableBody = document.getElementById('ranking-table-body');
        
        // Paginacao
        this.paginationInfo = document.getElementById('pagination-info');
        this.btnPrev = document.getElementById('btn-prev');
        this.btnNext = document.getElementById('btn-next');
        
        // Callbacks
        this.onFiltroChangeCallback = null;
        this.onPaginaChangeCallback = null;
        
        this._bindEvents();
    }

    _bindEvents() {
        const triggerFiltro = () => {
            if (this.onFiltroChangeCallback) {
                this.onFiltroChangeCallback({
                    partido: this.filtroPartido.value,
                    uf: this.filtroUf.value,
                    ano: parseInt(this.filtroAno.value) || 2026
                });
            }
        };

        if (this.filtroPartido) this.filtroPartido.addEventListener('change', triggerFiltro);
        if (this.filtroUf) this.filtroUf.addEventListener('change', triggerFiltro);
        if (this.filtroAno) this.filtroAno.addEventListener('change', triggerFiltro);

        if (this.btnPrev) {
            this.btnPrev.addEventListener('click', () => {
                if (this.onPaginaChangeCallback) {
                    this.onPaginaChangeCallback(-1);
                }
            });
        }
        if (this.btnNext) {
            this.btnNext.addEventListener('click', () => {
                if (this.onPaginaChangeCallback) {
                    this.onPaginaChangeCallback(1);
                }
            });
        }
    }

    configurarFiltros(onFiltroChange, onPaginaChange) {
        this.onFiltroChangeCallback = onFiltroChange;
        this.onPaginaChangeCallback = onPaginaChange;
    }

    mostrarCarregamento() {
        if (this.loader) this.loader.classList.remove('hidden');
        if (this.content) this.content.classList.add('hidden');
    }

    mostrarConteudo() {
        if (this.loader) this.loader.classList.add('hidden');
        if (this.content) this.content.classList.remove('hidden');
    }

    preencherPartidos(partidos) {
        if (!this.filtroPartido) return;
        const valorSelecionado = this.filtroPartido.value;
        this.filtroPartido.innerHTML = '<option value="">Todos os Partidos</option>' +
            partidos.map(p => `<option value="${p}">${p}</option>`).join('');
        if (valorSelecionado && partidos.includes(valorSelecionado)) {
            this.filtroPartido.value = valorSelecionado;
        }
    }

    /**
     * Atualiza a mensagem de progresso do carregamento.
     */
    atualizarProgresso(atual, total) {
        if (this.loader) {
            const textEl = this.loader.querySelector('p');
            if (textEl) {
                textEl.textContent = `Calculando despesas e montando ranking parlamentar (${atual} de ${total} deputados)...`;
            }
        }
    }

    /**
     * Renderiza o Pódio dos Top 3 Deputados mais econômicos.
     */
    renderizarPodio(top3) {
        if (!this.podioContainer) return;
        this.podioContainer.innerHTML = '';

        if (!top3 || top3.length === 0) {
            this.podioContainer.innerHTML = '<p class="text-gray-500 text-center col-span-3 py-4 font-semibold">Sem dados de pódio.</p>';
            return;
        }

        // Reorganizar os deputados para ter a ordem visual clássica: 2º lugar (esquerda), 1º lugar (centro), 3º lugar (direita)
        const visualOrder = [];
        if (top3[1]) visualOrder.push({ ...top3[1], pos: 2, badgeColor: 'bg-slate-200 text-slate-700', icon: 'fa-medal text-slate-400', ringColor: 'border-slate-300', podiumHeight: 'h-40 md:h-44' });
        if (top3[0]) visualOrder.push({ ...top3[0], pos: 1, badgeColor: 'bg-amber-100 text-amber-800', icon: 'fa-trophy text-amber-500', ringColor: 'border-amber-400', podiumHeight: 'h-48 md:h-56' });
        if (top3[2]) visualOrder.push({ ...top3[2], pos: 3, badgeColor: 'bg-orange-100 text-orange-800', icon: 'fa-medal text-orange-600', ringColor: 'border-orange-300', podiumHeight: 'h-36 md:h-36' });

        this.podioContainer.innerHTML = visualOrder.map(d => {
            const foto = d.urlFoto || 'https://www.camara.leg.br/tema/assets/images/foto-deputado-sem-imagem.png';
            const totalFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.totalGasto);

            return `
                <div class="flex flex-col items-center flex-1 text-center bg-white rounded-2xl border border-gray-150 p-6 shadow-sm relative overflow-hidden ${d.pos === 1 ? 'ring-2 ring-amber-400 z-10' : ''}">
                    <!-- Medalha/Troféu -->
                    <div class="absolute top-4 left-4 ${d.badgeColor} px-2.5 py-1 rounded-full text-xs font-black flex items-center gap-1">
                        <i class="fa-solid ${d.icon}"></i> ${d.pos}º Lugar
                    </div>
                    
                    <!-- Foto -->
                    <div class="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 ${d.ringColor} shadow-md mb-4 shrink-0">
                        <img src="${foto}" alt="${d.nome}" class="w-full h-full object-cover object-top">
                    </div>
                    
                    <h4 class="font-extrabold text-gray-900 text-base line-clamp-1">${d.nome}</h4>
                    <p class="text-xs text-gray-400 font-semibold mb-3">${d.siglaPartido} - ${d.siglaUf}</p>
                    
                    <div class="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 w-full">
                        <span class="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Gasto Cota CEAP</span>
                        <span class="text-base font-black text-gray-800">${totalFormatado}</span>
                    </div>

                    <a href="deputado-perfil.html?id=${d.id}" class="mt-4 text-xs font-bold text-teal-700 hover:text-teal-900 transition-colors flex items-center gap-1">
                        Ver Perfil <i class="fa-solid fa-chevron-right text-[10px]"></i>
                    </a>
                </div>
            `;
        }).join('');
    }

    /**
     * Renderiza o corpo da tabela de deputados.
     */
    renderizarTabela(deputados, indexInicio) {
        if (!this.tableBody) return;
        this.tableBody.innerHTML = '';

        if (!deputados || deputados.length === 0) {
            this.tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="py-12 text-center text-gray-500 font-medium bg-white">
                        <i class="fa-solid fa-folder-open text-3xl text-gray-300 mb-2 block"></i>
                        Nenhum parlamentar encontrado com os filtros selecionados.
                    </td>
                </tr>
            `;
            return;
        }

        this.tableBody.innerHTML = deputados.map((d, index) => {
            const posicao = indexInicio + index + 1;
            const totalFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.totalGasto);
            const foto = d.urlFoto || 'https://www.camara.leg.br/tema/assets/images/foto-deputado-sem-imagem.png';

            // Destaque para medalhas na listagem
            let medalHtml = `${posicao}º`;
            if (posicao === 1) medalHtml = '<span class="text-amber-500 font-black flex items-center justify-center gap-0.5"><i class="fa-solid fa-trophy"></i> 1º</span>';
            else if (posicao === 2) medalHtml = '<span class="text-slate-400 font-black flex items-center justify-center gap-0.5"><i class="fa-solid fa-medal"></i> 2º</span>';
            else if (posicao === 3) medalHtml = '<span class="text-orange-500 font-black flex items-center justify-center gap-0.5"><i class="fa-solid fa-medal"></i> 3º</span>';

            return `
                <tr class="hover:bg-gray-50 transition-colors">
                    <td class="py-4 px-6 text-center font-bold text-gray-700">${medalHtml}</td>
                    <td class="py-4 px-6">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full overflow-hidden border border-gray-200 shrink-0">
                                <img src="${foto}" alt="${d.nome}" class="w-full h-full object-cover object-top">
                            </div>
                            <span class="font-extrabold text-gray-900">${d.nome}</span>
                        </div>
                    </td>
                    <td class="py-4 px-6 font-semibold text-gray-650">${d.siglaPartido} - ${d.siglaUf}</td>
                    <td class="py-4 px-6 text-right font-black text-gray-800">${totalFormatado}</td>
                    <td class="py-4 px-6 text-center">
                        <a href="deputado-perfil.html?id=${d.id}" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-teal-700 text-xs font-bold rounded-xl border border-gray-150 transition-all">
                            Visualizar Análise
                        </a>
                    </td>
                </tr>
            `;
        }).join('');
    }

    /**
     * Atualiza o estado da navegação.
     */
    atualizarPaginacao(infoTotal, paginaAtual, totalPaginas, itensPorPagina) {
        if (this.paginationInfo) {
            const inicio = infoTotal === 0 ? 0 : (paginaAtual - 1) * itensPorPagina + 1;
            const fim = Math.min(paginaAtual * itensPorPagina, infoTotal);
            this.paginationInfo.textContent = `Mostrando ${inicio} a ${fim} de ${infoTotal} deputados`;
        }

        if (this.btnPrev) this.btnPrev.disabled = (paginaAtual <= 1);
        if (this.btnNext) this.btnNext.disabled = (paginaAtual >= totalPaginas);
    }
}

window.RankingEconomiaView = RankingEconomiaView;
