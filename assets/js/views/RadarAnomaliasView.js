/**
 * View da Central de Alertas e Anomalias (radar-anomalias.html)
 * Manipula DOM: grade de anomalias, badges e filtros de severidade/categoria.
 */
class RadarAnomaliasView {
    constructor() {
        this.grid = document.getElementById('radar-anomalias-grid');
        this.filtroCategoria = document.getElementById('filtro-anomalia-categoria');
        this.filtroSeveridade = document.getElementById('filtro-anomalia-severidade');
    }

    onFiltroChange(callback) {
        if (this.filtroCategoria) {
            this.filtroCategoria.addEventListener('change', () => {
                callback({
                    categoria: this.filtroCategoria.value,
                    severidade: this.filtroSeveridade ? this.filtroSeveridade.value : ''
                });
            });
        }
        if (this.filtroSeveridade) {
            this.filtroSeveridade.addEventListener('change', () => {
                callback({
                    categoria: this.filtroCategoria ? this.filtroCategoria.value : '',
                    severidade: this.filtroSeveridade.value
                });
            });
        }
    }

    mostrarLoader() {
        if (!this.grid) return;
        this.grid.innerHTML = `
            <p class="text-gray-500 col-span-full text-center py-20 font-medium">
                <i class="fa-solid fa-circle-notch fa-spin text-4xl text-teal-600 mb-4 block"></i>
                Analisando e comparando mandatos na base de dados...
            </p>
        `;
    }

    mostrarErro(mensagem = "Falha ao analisar as anomalias dos deputados.") {
        if (!this.grid) return;
        this.grid.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-20 text-center">
                <i class="fa-solid fa-triangle-exclamation text-4xl text-red-500 mb-4"></i>
                <p class="text-gray-700 font-medium">${mensagem}</p>
            </div>
        `;
    }

    renderizarGrid(deputadosComAnomalias) {
        if (!this.grid) return;
        this.grid.innerHTML = '';

        if (deputadosComAnomalias.length === 0) {
            this.grid.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100 text-center">
                    <div class="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-3xl mb-4">
                        <i class="fa-solid fa-shield-halved"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-900 mb-1">Nenhuma anomalia encontrada</h3>
                    <p class="text-gray-500 max-w-sm">Todos os deputados analisados para este filtro encontram-se dentro dos padrões de conformidade esperados.</p>
                </div>
            `;
            return;
        }

        deputadosComAnomalias.forEach(item => {
            const d = item.deputado;
            const aInfo = item.anomaliaInfo;

            let borderClass = 'border-gray-100';
            let bgClass = 'bg-white';
            
            if (aInfo.severidade === 'critico') {
                borderClass = 'border-red-200';
                bgClass = 'bg-red-50/20';
            } else if (aInfo.severidade === 'alerta') {
                borderClass = 'border-amber-200';
                bgClass = 'bg-amber-50/20';
            }

            const anomaliasListHTML = aInfo.anomalias.map(a => {
                let badgeColor = 'bg-gray-100 text-gray-700 border-gray-200';
                if (a.severidade === 'critico') badgeColor = 'bg-red-50 text-red-700 border-red-200';
                else if (a.severidade === 'alerta') badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
                else if (a.severidade === 'atencao') badgeColor = 'bg-yellow-50 text-yellow-700 border-yellow-200';

                return `
                    <div class="p-3 bg-white rounded-xl border border-gray-100 flex flex-col gap-1.5 shadow-sm">
                        <div class="flex justify-between items-center">
                            <span class="text-sm font-bold text-gray-800">${a.titulo}</span>
                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeColor}">${a.severidade.toUpperCase()}</span>
                        </div>
                        <p class="text-xs text-gray-500 leading-relaxed font-medium">${a.descricao}</p>
                    </div>
                `;
            }).join('');

            const card = document.createElement('div');
            card.className = `rounded-2xl border ${borderClass} ${bgClass} p-5 flex flex-col md:flex-row gap-5 shadow-sm hover:shadow-md transition-shadow relative`;
            card.innerHTML = `
                <!-- Foto e Info Básica -->
                <div class="flex md:flex-col items-center gap-4 shrink-0 w-full md:w-32 text-center">
                    <a href="deputado-perfil.html?id=${d.id}" class="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border border-gray-200 bg-gray-100 block shrink-0 shadow-sm">
                        <img src="${d.urlFoto}" alt="Foto de ${d.nome}" class="w-full h-full object-cover object-top hover:scale-105 transition-transform" onerror="this.src='https://via.placeholder.com/150?text=Deputado'">
                    </a>
                    <div>
                        <h4 class="font-extrabold text-base text-gray-900 leading-tight">
                            <a href="deputado-perfil.html?id=${d.id}" class="hover:text-teal-600 transition-colors">${d.nome}</a>
                        </h4>
                        <span class="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 text-xs font-bold border border-teal-100">
                            ${d.siglaPartido} - ${d.siglaUf}
                        </span>
                    </div>
                </div>

                <!-- Detalhes das Anomalias -->
                <div class="flex-1 flex flex-col justify-between gap-4">
                    <div class="space-y-2.5">
                        ${anomaliasListHTML}
                    </div>

                    <div class="flex justify-end mt-auto pt-2 border-t border-gray-100/60">
                        <a href="deputado-perfil.html?id=${d.id}" class="flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-800 transition-colors">
                            Ver Dossiê Completo <i class="fa-solid fa-arrow-right"></i>
                        </a>
                    </div>
                </div>
            `;
            this.grid.appendChild(card);
        });
    }
}

window.RadarAnomaliasView = RadarAnomaliasView;
