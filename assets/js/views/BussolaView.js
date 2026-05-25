/**
 * View da Bússola Ideológica.
 * Responsável por toda manipulação de DOM, exibição das etapas do quiz e renderização dos matches políticos.
 */
class BussolaView {
    constructor() {
        this.stepIntro = document.getElementById('step-intro');
        this.stepQuiz = document.getElementById('step-quiz');
        this.stepLoading = document.getElementById('step-loading');
        this.stepResults = document.getElementById('step-results');
        
        // Elementos do Quiz
        this.progressText = document.getElementById('quiz-progress-text');
        this.progressPercent = document.getElementById('quiz-progress-percent');
        this.progressBar = document.getElementById('quiz-progress-bar');
        this.questionCategory = document.getElementById('quiz-question-category');
        this.questionTitle = document.getElementById('quiz-question-title');
        this.questionDesc = document.getElementById('quiz-question-desc');
        this.questionContext = document.getElementById('quiz-question-context');
        
        // Botões do Quiz
        this.btnStart = document.getElementById('btn-start-quiz');
        this.btnYes = document.getElementById('btn-vote-yes');
        this.btnNo = document.getElementById('btn-vote-no');
        this.btnSkip = document.getElementById('btn-vote-skip');
        this.btnRestart = document.getElementById('btn-restart-quiz');
        
        // Loader status
        this.loadingStatus = document.getElementById('loading-status-text');
        
        // Elementos dos Resultados
        this.topMatchPhoto = document.getElementById('top-match-photo');
        this.topMatchName = document.getElementById('top-match-name');
        this.topMatchPartyUf = document.getElementById('top-match-party-uf');
        this.topMatchPercent = document.getElementById('top-match-percent');
        this.resultsGrid = document.getElementById('results-grid');
        this.filterPartido = document.getElementById('filter-partido');
        this.filterUf = document.getElementById('filter-uf');
        
        // Modal de Comparação
        this.compModal = document.getElementById('comparison-modal');
        this.compModalDeputyName = document.getElementById('comp-modal-deputy-name');
        this.compModalDeputyPartyUf = document.getElementById('comp-modal-deputy-party-uf');
        this.compTableBody = document.getElementById('comparison-table-body');
        this.btnCloseCompModal = document.getElementById('btn-close-comp-modal');
        this.btnCloseCompModalFooter = document.getElementById('btn-close-comp-modal-footer');
    }

    /**
     * Alterna a visualização para a etapa de Introdução.
     */
    mostrarIntro() {
        this.stepIntro.classList.remove('hidden');
        this.stepQuiz.classList.add('hidden');
        this.stepLoading.classList.add('hidden');
        this.stepResults.classList.add('hidden');
    }

    /**
     * Alterna a visualização para a etapa do Quiz ativo.
     */
    mostrarQuiz() {
        this.stepIntro.classList.add('hidden');
        this.stepQuiz.classList.remove('hidden');
        this.stepLoading.classList.add('hidden');
        this.stepResults.classList.add('hidden');
    }

    /**
     * Alterna a visualização para a etapa de Carregamento.
     */
    mostrarLoading(mensagem = 'Carregando votos reais de 513 parlamentares na API da Câmara...') {
        this.stepIntro.classList.add('hidden');
        this.stepQuiz.classList.add('hidden');
        this.stepLoading.classList.remove('hidden');
        this.stepResults.classList.add('hidden');
        if (this.loadingStatus) {
            this.loadingStatus.textContent = mensagem;
        }
    }

    /**
     * Alterna a visualização para a etapa de Resultados.
     */
    mostrarResultados() {
        this.stepIntro.classList.add('hidden');
        this.stepQuiz.classList.add('hidden');
        this.stepLoading.classList.add('hidden');
        this.stepResults.classList.remove('hidden');
    }

    /**
     * Atualiza a questão exibida no Quiz.
     * @param {Object} questao - Objeto contendo dados da questão.
     * @param {number} index - Índice da questão atual (0-based).
     * @param {number} total - Total de questões.
     */
    renderizarQuestao(questao, index, total) {
        const numero = index + 1;
        const porc = Math.round((index / total) * 100);
        
        if (this.progressText) this.progressText.textContent = `Questão ${numero} de ${total}`;
        if (this.progressPercent) this.progressPercent.textContent = `${porc}% concluído`;
        if (this.progressBar) this.progressBar.style.width = `${porc}%`;
        
        if (this.questionCategory) this.questionCategory.textContent = questao.categoria || 'Geral';
        if (this.questionTitle) this.questionTitle.textContent = questao.titulo;
        if (this.questionDesc) this.questionDesc.textContent = questao.ementa;
        if (this.questionContext) this.questionContext.textContent = questao.contexto;
    }

    /**
     * Preenche os dropdowns de filtro na tela de resultados.
     */
    preencherFiltros(partidos, ufs) {
        if (this.filterPartido) {
            this.filterPartido.innerHTML = '<option value="">Todos os Partidos</option>' + 
                partidos.map(p => `<option value="${p}">${p}</option>`).join('');
        }
        if (this.filterUf) {
            this.filterUf.innerHTML = '<option value="">Todos os Estados</option>' + 
                ufs.map(uf => `<option value="${uf}">${uf}</option>`).join('');
        }
    }

    /**
     * Renderiza o deputado destaque no "Match de Ouro".
     */
    renderizarTopMatch(deputado) {
        if (!deputado) return;
        
        if (this.topMatchPhoto) {
            this.topMatchPhoto.src = deputado.urlFoto || 'https://www.camara.leg.br/tema/assets/images/foto-deputado-sem-imagem.png';
            this.topMatchPhoto.alt = deputado.nome;
        }
        if (this.topMatchName) this.topMatchName.textContent = deputado.nome;
        if (this.topMatchPartyUf) this.topMatchPartyUf.textContent = `${deputado.siglaPartido || 'Sem Partido'} - ${deputado.siglaUf || 'DF'}`;
        if (this.topMatchPercent) this.topMatchPercent.textContent = `${deputado.matchPercent}%`;
    }

    /**
     * Renderiza a listagem de deputados no grid de resultados.
     * @param {Array} deputados - Lista de deputados com matchPercent calculado.
     * @param {Function} onVerComparacaoCallback - Função de callback para abrir detalhes.
     */
    renderizarResultadosGrid(deputados, onVerComparacaoCallback) {
        if (!this.resultsGrid) return;
        
        if (deputados.length === 0) {
            this.resultsGrid.innerHTML = `
                <div class="col-span-full bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-500 shadow-sm">
                    <i class="fa-solid fa-folder-open text-4xl text-gray-300 mb-3"></i>
                    <p class="font-semibold">Nenhum deputado encontrado com estes filtros.</p>
                </div>
            `;
            return;
        }

        this.resultsGrid.innerHTML = deputados.map(d => {
            const foto = d.urlFoto || 'https://www.camara.leg.br/tema/assets/images/foto-deputado-sem-imagem.png';
            
            // Cor base do alinhamento
            let progressColor = 'bg-rose-500';
            let textColor = 'text-rose-600';
            if (d.matchPercent >= 80) {
                progressColor = 'bg-emerald-600';
                textColor = 'text-emerald-600';
            } else if (d.matchPercent >= 50) {
                progressColor = 'bg-amber-500';
                textColor = 'text-amber-600';
            }

            return `
                <div class="bg-white rounded-2xl border border-gray-150 p-5 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4">
                    <div class="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-gray-200">
                        <img src="${foto}" alt="${d.nome}" class="w-full h-full object-cover">
                    </div>
                    
                    <div class="flex-1 min-w-0 space-y-1">
                        <div class="flex justify-between items-start gap-2">
                            <div>
                                <h4 class="font-extrabold text-gray-900 text-sm truncate" title="${d.nome}">${d.nome}</h4>
                                <p class="text-xs text-gray-400 font-semibold">${d.siglaPartido} - ${d.siglaUf}</p>
                            </div>
                            <span class="text-lg font-black shrink-0 ${textColor}">${d.matchPercent}%</span>
                        </div>
                        
                        <!-- Barra de Alinhamento -->
                        <div class="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div class="${progressColor} h-full" style="width: ${d.matchPercent}%;"></div>
                        </div>
                        
                        <!-- Ações do Card -->
                        <div class="flex justify-between items-center pt-2 gap-2">
                            <button class="btn-ver-comp text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 transition-colors" data-id="${d.id}">
                                <i class="fa-solid fa-code-compare text-[10px]"></i> Ver Votos
                            </button>
                            <a href="deputado-perfil.html?id=${d.id}" class="text-xs font-bold text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors">
                                Perfil <i class="fa-solid fa-chevron-right text-[9px]"></i>
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Ligar eventos para os botões de comparação de votos
        const botoes = this.resultsGrid.querySelectorAll('.btn-ver-comp');
        botoes.forEach(btn => {
            btn.addEventListener('click', () => {
                const id = parseInt(btn.getAttribute('data-id'));
                onVerComparacaoCallback(id);
            });
        });
    }

    /**
     * Exibe o modal detalhado de comparação.
     * @param {Object} deputado - Objeto do deputado.
     * @param {Array} comparativos - Array de objetos comparativos de cada pergunta.
     */
    mostrarModalComparacao(deputado, comparativos) {
        if (!this.compModal) return;
        
        if (this.compModalDeputyName) this.compModalDeputyName.textContent = deputado.nome;
        if (this.compModalDeputyPartyUf) this.compModalDeputyPartyUf.textContent = `${deputado.siglaPartido} - ${deputado.siglaUf}`;
        
        if (this.compTableBody) {
            this.compTableBody.innerHTML = comparativos.map(c => {
                // Formatação do voto do usuário
                let cidClass = 'bg-gray-100 text-gray-600 border-gray-200';
                let cidIcon = 'fa-solid fa-forward';
                if (c.usuario === 'Sim') {
                    cidClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    cidIcon = 'fa-solid fa-thumbs-up';
                } else if (c.usuario === 'Não') {
                    cidClass = 'bg-rose-50 text-rose-700 border-rose-200';
                    cidIcon = 'fa-solid fa-thumbs-down';
                }

                // Formatação do voto do deputado
                let depClass = 'bg-gray-100 text-gray-500 border-gray-200';
                let depIcon = 'fa-solid fa-circle-question';
                if (c.deputado === 'Sim') {
                    depClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    depIcon = 'fa-solid fa-thumbs-up';
                } else if (c.deputado === 'Não') {
                    depClass = 'bg-rose-50 text-rose-700 border-rose-200';
                    depIcon = 'fa-solid fa-thumbs-down';
                } else if (c.deputado === 'Ausente') {
                    depClass = 'bg-gray-200 text-gray-500 border-gray-300';
                    depIcon = 'fa-solid fa-user-slash';
                }

                // Resultado de afinidade da linha
                let resultHTML = '<span class="text-gray-400 font-semibold">-</span>';
                if (c.usuario !== 'Pular' && c.deputado !== 'Ausente') {
                    if (c.usuario === c.deputado) {
                        resultHTML = '<span class="px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200 font-bold text-[10px]"><i class="fa-solid fa-check"></i> Igual</span>';
                    } else {
                        resultHTML = '<span class="px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-bold text-[10px]"><i class="fa-solid fa-xmark"></i> Diferente</span>';
                    }
                }

                return `
                    <tr class="hover:bg-gray-50/50">
                        <td class="py-4 pr-4">
                            <div class="font-extrabold text-gray-900 text-sm leading-tight">${c.titulo}</div>
                            <div class="text-[11px] text-gray-400 font-medium mt-1 truncate max-w-[280px]" title="${c.ementa}">${c.ementa}</div>
                        </td>
                        <td class="py-4 px-4 text-center">
                            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${cidClass}">
                                <i class="${cidIcon} text-[10px]"></i> ${c.usuario}
                            </span>
                        </td>
                        <td class="py-4 px-4 text-center">
                            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${depClass}">
                                <i class="${depIcon} text-[10px]"></i> ${c.deputado}
                            </span>
                        </td>
                        <td class="py-4 text-center">
                            ${resultHTML}
                        </td>
                    </tr>
                `;
            }).join('');
        }
        
        this.compModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Bloquear scroll da página por baixo
    }

    /**
     * Fecha o modal detalhado de comparação.
     */
    fecharModalComparacao() {
        if (!this.compModal) return;
        this.compModal.classList.add('hidden');
        document.body.style.overflow = ''; // Restaurar scroll
    }

    /**
     * Liga os ouvintes de eventos da interface.
     */
    configurarEventos({ onIniciar, onVotar, onFiltroAlterado, onReiniciar }) {
        if (this.btnStart) {
            this.btnStart.addEventListener('click', onIniciar);
        }
        
        if (this.btnYes) {
            this.btnYes.addEventListener('click', () => onVotar('Sim'));
        }
        if (this.btnNo) {
            this.btnNo.addEventListener('click', () => onVotar('Não'));
        }
        if (this.btnSkip) {
            this.btnSkip.addEventListener('click', () => onVotar('Pular'));
        }
        
        if (this.filterPartido) {
            this.filterPartido.addEventListener('change', () => {
                onFiltroAlterado(this.filterPartido.value, this.filterUf ? this.filterUf.value : '');
            });
        }
        if (this.filterUf) {
            this.filterUf.addEventListener('change', () => {
                onFiltroAlterado(this.filterPartido ? this.filterPartido.value : '', this.filterUf.value);
            });
        }
        
        if (this.btnRestart) {
            this.btnRestart.addEventListener('click', onReiniciar);
        }
        
        // Eventos de fechar o modal
        if (this.btnCloseCompModal) {
            this.btnCloseCompModal.addEventListener('click', () => this.fecharModalComparacao());
        }
        if (this.btnCloseCompModalFooter) {
            this.btnCloseCompModalFooter.addEventListener('click', () => this.fecharModalComparacao());
        }
        if (this.compModal) {
            this.compModal.addEventListener('click', (e) => {
                if (e.target === this.compModal) {
                    this.fecharModalComparacao();
                }
            });
        }
    }
}
window.BussolaView = BussolaView;
