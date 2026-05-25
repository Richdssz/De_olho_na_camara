/**
 * View da Listagem de Partidos (partidos.html)
 * Manipula DOM: grade de partidos, loaders e classificações de coesão.
 */
class PartidosView {
    constructor() {
        this.grid = document.getElementById('partidos-grid');
    }

    mostrarLoader() {
        if (!this.grid) return;
        this.grid.innerHTML = `
            <p class="text-gray-500 col-span-full text-center py-20 font-medium">
                <i class="fa-solid fa-circle-notch fa-spin text-4xl text-teal-600 mb-4 block"></i>
                Carregando estatísticas dos partidos...
            </p>
        `;
    }

    mostrarErro(mensagem = "Falha ao carregar os partidos políticos.") {
        if (!this.grid) return;
        this.grid.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-20 text-center">
                <i class="fa-solid fa-triangle-exclamation text-4xl text-red-500 mb-4"></i>
                <p class="text-gray-700 font-medium">${mensagem}</p>
            </div>
        `;
    }

    renderizarGrid(partidos) {
        if (!this.grid) return;
        this.grid.innerHTML = '';

        if (partidos.length === 0) {
            this.grid.innerHTML = `<p class="text-gray-500 col-span-full text-center py-10 font-medium">Nenhum partido encontrado.</p>`;
            return;
        }

        partidos.forEach(p => {
            let coesaoBadgeClass = 'bg-gray-100 text-gray-700 border-gray-200';
            let coesaoTexto = 'Sem dados';

            if (p.coesao !== undefined && p.coesao !== null) {
                if (p.coesao >= 90) {
                    coesaoBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    coesaoTexto = `Coesão: ${p.coesao}% (Alta)`;
                } else if (p.coesao >= 70) {
                    coesaoBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
                    coesaoTexto = `Coesão: ${p.coesao}% (Média)`;
                } else {
                    coesaoBadgeClass = 'bg-red-50 text-red-700 border-red-200';
                    coesaoTexto = `Coesão: ${p.coesao}% (Baixa)`;
                }
            }

            const placeholder = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='24' fill='%23f0fdf4'/><text x='50' y='55' font-family='Arial,sans-serif' font-size='28' font-weight='bold' fill='%230f766e' text-anchor='middle' dominant-baseline='middle'>${p.sigla}</text></svg>`;

            const card = document.createElement('div');
            card.className = 'bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative group';
            card.innerHTML = `
                <div>
                    <div class="flex justify-between items-start mb-4">
                        <div class="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center border border-gray-150 bg-white shrink-0">
                            <img src="${p.urlLogo || ''}" alt="Logo do ${p.sigla}" class="w-full h-full object-contain p-1" onerror="this.onerror=null; this.outerHTML='<div class=\\'w-full h-full bg-teal-50 flex items-center justify-center text-teal-700 font-bold text-xs border border-teal-100\\'>${p.sigla}</div>';">
                        </div>
                        <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold border ${coesaoBadgeClass}">
                            ${coesaoTexto}
                        </span>
                    </div>
                    
                    <h3 class="font-bold text-lg text-gray-900 mb-1 leading-snug group-hover:text-teal-600 transition-colors line-clamp-1" title="${p.nome}">
                        ${p.nome}
                    </h3>
                    <p class="text-sm text-gray-500 mb-6">Legislatura Mandato 57</p>
                </div>

                <div class="border-t border-gray-100 pt-4 flex justify-between items-center mt-auto">
                    <div>
                        <p class="text-xs text-gray-400 font-bold uppercase tracking-wider">Membros Bancada</p>
                        <p class="text-base font-bold text-gray-700">${p.totalMembros} Deputado(s)</p>
                    </div>
                    
                    <a href="partido-perfil.html?sigla=${p.sigla}&id=${p.id}" class="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-teal-600 group-hover:text-white transition-all shadow-sm">
                        <i class="fa-solid fa-arrow-right"></i>
                    </a>
                </div>
            `;
            this.grid.appendChild(card);
        });
    }
}

window.PartidosView = PartidosView;
