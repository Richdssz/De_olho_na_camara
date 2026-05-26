class PerfilDeputadoController {
    constructor() {
        this.view = new window.PerfilDeputadoView();
        this.deputadoIdGlobal = null;
        this.deputadoNomeGlobal = "";
        this.notaSelecionada = 0;
        this.proposicoesOriginais = [];
        this.votosMapLocal = {};
        this.anoAnalise = 2026;
        this.mesAnalise = null; // null = todos os meses
    }

    async init() {
        const urlParams = new URLSearchParams(window.location.search);
        const deputadoId = urlParams.get('id');

        if (!deputadoId) {
            this.view.mostrarErro("ID do deputado nao fornecido na URL.");
            return;
        }

        this.deputadoIdGlobal = parseInt(deputadoId);

        window.activeController = this;

        this.view.onAcompanharClick(this.handleAlternarRadar.bind(this));
        this.view.onEnviarOpiniaoClick(this.handleEnviarOpiniao.bind(this));
        
        this.view.onEstrelaClick(this.handleEstrelaClick.bind(this));
        this.view.onSalvarAvaliacaoClick(this.handleSalvarAvaliacao.bind(this));
        this.view.onApagarComentarioClick(this.handleApagarAvaliacao.bind(this));
        this.view.onFiltroAnoChange(this.handleFiltroAnoGlobal.bind(this));
        this.view.onVotarProposicaoClick(this.handleVotarProposicao.bind(this));
        this.view.onFiltroProposicaoChange(this.handleFiltroProposicao.bind(this));
        this.view.onAbrirModalProposicaoClick(this.handleAbrirModalProposicao.bind(this));
        this.view.onVotacaoClick(this.handleVotacaoClick.bind(this));

        await this.carregarDadosDeputado(this.deputadoIdGlobal);
    }

    async carregarDadosDeputado(id) {
        try {
            this.view.mostrarCarregamento();

            // 1. Dados cadastrais
            const deputadoResp = await window.DeputadoModel.buscarDetalhes(id);
            if (!deputadoResp.success) throw new Error("Deputado nao encontrado.");
            
            const deputado = deputadoResp.data;
            this.deputadoNomeGlobal = deputado.ultimoStatus.nome || deputado.nomeCivil;
            const siglaPartido = deputado.ultimoStatus.siglaPartido || "";
            const siglaUf = deputado.ultimoStatus.siglaUf || "";

            this.view.preencherDadosPerfil(deputado);

            // Sincroniza radar
            await this.verificarEstadoRadar(id);

            // 2. Coletando dados complementares
            const anoCorrente = this.anoAnalise;
            const mesCorrente = this.mesAnalise;

            // Define intervalo de datas baseado no filtro
            let dataInicio, dataFim;
            if (mesCorrente) {
                const mesStr = String(mesCorrente).padStart(2, '0');
                dataInicio = `${anoCorrente}-${mesStr}-01`;
                // Ultimo dia do mesa
                const ultimoDia = new Date(anoCorrente, mesCorrente, 0).getDate();
                dataFim = `${anoCorrente}-${mesStr}-${ultimoDia}`;
            } else {
                dataInicio = `${anoCorrente}-01-01`;
                dataFim = `${anoCorrente}-12-31`;
            }
            
            const [despesas, eventosDeputadoResp, proposicoes, votacoesRaw, sessoesPlenario, orgaos, frentes, historico, discursos, beneficiosResp] = await Promise.all([
                window.camaraApi.buscarDespesas(id, anoCorrente, mesCorrente).catch(() => []),
                window.DeputadoModel.buscarEventos(id, dataInicio, dataFim).catch(() => ({ success: false, data: [] })),
                window.camaraApi.buscarProposicoesAutor(id).catch(() => []),
                window.camaraApi._fetch('/votacoes', {
                    idOrgao: 114,
                    ordem: 'DESC',
                    ordenarPor: 'dataHoraRegistro',
                    itens: 15,
                    dataInicio: '2023-01-01',
                    dataFim: new Date().toISOString().slice(0, 10)
                }).catch(() => ({ dados: [] })),
                window.camaraApi.buscarSessoesOrgao(180, dataInicio, dataFim).catch(() => []),
                window.camaraApi.buscarOrgaosDeputado(id).catch(() => []),
                window.camaraApi.buscarFrentesDeputado(id).catch(() => []),
                window.camaraApi.buscarHistoricoDeputado(id).catch(() => []),
                window.camaraApi.buscarDiscursosDeputado(id, {
                    dataInicio: dataInicio,
                    dataFim: dataFim
                }).catch(() => []),
                window.DeputadoModel.buscarBeneficios(id, siglaUf).catch(() => ({ success: false, data: null }))
            ]);

            const eventosDeputado = eventosDeputadoResp.success ? (eventosDeputadoResp.data || []) : [];
            this.proposicoesOriginais = proposicoes || [];

            // 3. Analytics
            const analisePresenca = window.analytics.calcularTaxaPresenca(eventosDeputado, anoCorrente, sessoesPlenario);
            const analiseGastos = window.analytics.calcularMediaGastos(despesas);
            const totalProposicoes = proposicoes.length;

            // 4. Votos Nominais - buscando ultimas votacoes do Plenario e cruzando votos
            const votosDeputadoMapeados = [];
            const orientacoesMapeadas = {};

            const votacoesPlenario = (votacoesRaw.dados || []).filter(v => v.siglaOrgao === 'PLEN' || v.idOrgao === 114 || v.idOrgao === 180).slice(0, 15);

            await Promise.all((votacoesPlenario || []).map(async (v) => {
                try {
                    const [votosList, orientacoesList, detalheVot] = await Promise.all([
                        window.camaraApi.buscarVotosVotacao(v.id).catch(() => []),
                        window.camaraApi.buscarOrientacoesVotacao(v.id).catch(() => []),
                        window.camaraApi._fetch(`/votacoes/${v.id}`).catch(() => null)
                    ]);

                    const votoDoDeputado = (votosList || []).find(vote => {
                        const dep = vote.deputado || vote.deputado_;
                        return dep && dep.id === id;
                    });
                    const tipoVoto = votoDoDeputado ? votoDoDeputado.tipoVoto : "Ausente";

                    let proposicaoId = null;
                    if (detalheVot && detalheVot.dados) {
                        const propAfetadas = detalheVot.dados.proposicoesAfetadas || [];
                        if (propAfetadas.length > 0) {
                            proposicaoId = propAfetadas[0].id;
                        } else if (detalheVot.dados.ultimaApresentacaoProposicao?.uriProposicaoCitada) {
                            const match = detalheVot.dados.ultimaApresentacaoProposicao.uriProposicaoCitada.match(/\/proposicoes\/(\d+)/);
                            if (match) proposicaoId = parseInt(match[1]);
                        }
                    }

                    votosDeputadoMapeados.push({
                        votacaoId: v.id,
                        descricao: v.descricao || "Votacao em Plenario",
                        data: v.dataHoraRegistro || v.data,
                        voto: tipoVoto,
                        proposicaoId: proposicaoId
                    });

                    orientacoesMapeadas[v.id] = orientacoesList || [];
                } catch (err) {
                    console.error('Erro buscando votos/orientacoes da votacao ' + v.id + ':', err);
                }
            }));

            const analiseCoesao = window.analytics.calcularCoesaoPartidaria(votosDeputadoMapeados, orientacoesMapeadas, siglaPartido);
            
            const analiseAnomalias = window.analytics.detectarAnomalias({
                presencaRate: analisePresenca.rate,
                gastoMedioMensal: analiseGastos.media,
                coesaoRate: analiseCoesao.coesao
            });

            const badges = window.analytics.avaliarBadges({
                presencaRate: analisePresenca.rate,
                gastoMedioMensal: analiseGastos.media,
                coesaoRate: analiseCoesao.coesao,
                totalProposicoes: totalProposicoes
            });

            // 4.1 ROI Parlamentar
            const analiseROI = window.analytics.calcularROIParlamentar(analiseGastos.total, totalProposicoes);

            // 4.2 Taxa de Sucesso Legislativo (busca detalhes das proposicoes em paralelo, limitando a 20)
            let analiseSucesso = null;
            try {
                const propParaDetalhar = proposicoes.slice(0, 20);
                const detalhes = await Promise.all(
                    propParaDetalhar.map(p =>
                        window.camaraApi.buscarDetalheProposicao(p.id).catch(() => null)
                    )
                );
                const detalhesValidos = detalhes.filter(d => d !== null);
                analiseSucesso = window.analytics.calcularTaxaSucessoLegislativo(detalhesValidos);
            } catch (err) {
                console.error('Erro ao calcular taxa de sucesso legislativo:', err);
                analiseSucesso = window.analytics.calcularTaxaSucessoLegislativo([]);
            }

            // 5. Renderizar na View
            this.view.renderizarPainelKPIs(analisePresenca, analiseGastos, analiseCoesao, totalProposicoes, analiseROI, analiseSucesso);
            this.kpisGlobais = {
                nome: this.deputadoNomeGlobal,
                partido: siglaPartido,
                totalGasto: analiseGastos.total,
                presenca: analisePresenca.rate,
                totalProposicoes: totalProposicoes
            };
            this.view.renderizarBadges(badges);
            this.view.renderizarAnomalias(analiseAnomalias);
            this.view.renderizarTabelaVotacoes(votosDeputadoMapeados, orientacoesMapeadas, siglaPartido);
            this.view.renderizarGraficos(despesas, eventosDeputado, sessoesPlenario);
            this.view.renderizarBeneficios(beneficiosResp.success ? beneficiosResp.data : null);
            this.view.renderizarBeneficiosRH(orgaos, frentes, historico);
            this.view.renderizarDiscursos(discursos);

            // 5.1 Atualizar Links de Transparencia
            const urlCamara = `https://www.camara.leg.br/deputados/${id}`;
            const linkDespesas = document.getElementById('link-transparencia-despesas');
            if (linkDespesas) linkDespesas.href = urlCamara;
            const linkPresenca = document.getElementById('link-transparencia-presenca');
            if (linkPresenca) linkPresenca.href = urlCamara;
            const linkVotacoes = document.getElementById('link-transparencia-votacoes');
            if (linkVotacoes) linkVotacoes.href = urlCamara;
            const linkBeneficios = document.getElementById('link-transparencia-beneficios');
            if (linkBeneficios) linkBeneficios.href = urlCamara;

            // 6. Termometro de Leis
            const propToShow = proposicoes.slice(0, 6);
            await this.renderizarProposicoesAtualizadas(propToShow);

            this.view.mostrarConteudo();

            // Carrega a secao de avaliacoes da Voz do Cidadao
            await this.carregarAvaliacoes(id);
        } catch (error) {
            console.error("Erro no perfil:", error);
            this.view.mostrarErro("Falha ao processar e carregar dados do perfil: " + error.message);
        }
    }

    async verificarEstadoRadar(id) {
        if (!window.Back4AppService || !window.Back4AppService.getCurrentUser()) return;
        const radarResp = await window.MonitoramentoModel.listarMonitorados();
        if (radarResp.success) {
            const isMonitored = radarResp.data.includes(id);
            this.view.atualizarBotaoRadar(this.view.btnRadarPerfil, isMonitored);
        }
    }

    async handleAlternarRadar(btn) {
        if (!this.deputadoIdGlobal) return;

        if (!window.Back4AppService.getCurrentUser()) {
            const authModal = document.getElementById('auth-modal');
            if (authModal) authModal.classList.remove('hidden');
            else alert("Acesse sua conta para utilizar o monitoramento!");
            return;
        }

        btn.disabled = true;
        try {
            const resp = await window.MonitoramentoModel.alternarRadar(this.deputadoIdGlobal, this.deputadoNomeGlobal);
            if (resp.success) {
                const isMonitored = resp.data.action === 'added';
                this.view.atualizarBotaoRadar(btn, isMonitored);
            }
        } catch (error) {
            alert("Erro ao alterar o radar.");
        } finally {
            btn.disabled = false;
        }
    }

    async carregarAvaliacoes(id) {
        try {
            // 1. Carregar avaliação do próprio usuário (se logado)
            if (window.Back4AppService && window.Back4AppService.getCurrentUser()) {
                const minhaResp = await window.AvaliacaoModel.buscarAvaliacao(id);
                if (minhaResp.success && minhaResp.data) {
                    this.notaSelecionada = minhaResp.data.nota || 0;
                    this.view.preencherMinhaAvaliacao(this.notaSelecionada, minhaResp.data.comentario);
                }
            } else {
                // Se não logado, limpa os campos de avaliação
                this.notaSelecionada = 0;
                this.view.preencherMinhaAvaliacao(0, "");
            }

            // 2. Carregar todas as avaliações públicas (comentários)
            const publicResp = await window.AvaliacaoModel.listarPorDeputado(id);
            let media = 0;
            let comentarios = [];
            if (publicResp.success && publicResp.data) {
                comentarios = publicResp.data;
                const totalNotas = comentarios.reduce((sum, c) => sum + c.nota, 0);
                media = comentarios.length > 0 ? (totalNotas / comentarios.length) : 0;
                this.view.renderizarComentarios(comentarios, media);
            }
            this.view.renderizarMediaAvaliacao(media);
        } catch (error) {
            console.error("Erro ao carregar avaliações no PerfilDeputadoController:", error);
        }
    }

    handleEstrelaClick(nota) {
        this.notaSelecionada = nota;
        this.view.atualizarEstrelasPerfil(nota);
        this.view.mostrarErroAvaliacao(null);
    }

    async handleSalvarAvaliacao(comentario) {
        if (!window.Back4AppService || !window.Back4AppService.getCurrentUser()) {
            this.view.mostrarErroAvaliacao("Você precisa estar logado para avaliar.");
            // Abre o modal de login automaticamente
            const authModal = document.getElementById('auth-modal');
            if (authModal) {
                authModal.classList.remove('hidden');
            }
            return;
        }

        if (this.notaSelecionada === 0) {
            this.view.mostrarErroAvaliacao("Por favor, selecione uma nota de 1 a 5 estrelas.");
            return;
        }

        const btn = document.getElementById('btn-salvar-avaliacao-perfil');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Enviando...';
        }

        this.view.mostrarErroAvaliacao(null);

        try {
            const resp = await window.AvaliacaoModel.salvarAvaliacao(
                this.deputadoIdGlobal,
                this.deputadoNomeGlobal,
                this.notaSelecionada,
                comentario
            );

            if (resp.success) {
                await this.carregarAvaliacoes(this.deputadoIdGlobal);
                alert("Sua avaliação foi salva com sucesso!");
            } else {
                this.view.mostrarErroAvaliacao("Não foi possível salvar sua avaliação: " + (resp.error || "Erro desconhecido"));
            }
        } catch (error) {
            console.error("Erro detalhado ao salvar avaliação:", error);
            this.view.mostrarErroAvaliacao("Erro de conexão ao tentar salvar.");
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = 'Enviar Avaliação';
            }
        }
    }

    async recarregarGrid() {
        if (this.deputadoIdGlobal) {
            await this.verificarEstadoRadar(this.deputadoIdGlobal);
            await this.carregarAvaliacoes(this.deputadoIdGlobal);
            // Recarrega as proposições para atualizar o voto do usuário atual
            try {
                const propToShow = this.proposicoesOriginais.slice(0, 6);
                await this.renderizarProposicoesAtualizadas(propToShow);
            } catch (err) {
                console.error("Erro ao recarregar proposições no login/logout:", err);
            }
        }
    }

    async renderizarProposicoesAtualizadas(proposicoes) {
        const votosMap = {};
        await Promise.all(proposicoes.map(async (p) => {
            const resp = await window.TermometroModel.buscarVotosProposicao(p.id);
            if (resp.success) {
                votosMap[p.id] = resp.data;
            }
        }));
        this.votosMapLocal = { ...this.votosMapLocal, ...votosMap };
        this.view.renderizarProposicoes(proposicoes, votosMap);
    }

    async handleFiltroProposicao(tipo, ano) {
        let filtradas = this.proposicoesOriginais || [];
        if (tipo) {
            filtradas = filtradas.filter(p => p.siglaTipo === tipo);
        }
        if (ano) {
            filtradas = filtradas.filter(p => parseInt(p.ano) === parseInt(ano));
        }
        
        const container = document.getElementById('proposicoes-container');
        if (container) container.innerHTML = '<p class="text-gray-500 col-span-full text-center py-10 font-medium"><i class="fa-solid fa-circle-notch fa-spin text-teal-600 mb-2 text-2xl"></i><br>Filtrando proposições...</p>';

        const propToShow = filtradas.slice(0, 6);
        await this.renderizarProposicoesAtualizadas(propToShow);
    }

    async handleAbrirModalProposicao(proposicaoId) {
        const p = (this.proposicoesOriginais || []).find(x => x.id === proposicaoId);
        if (!p) return;
        const votoInfo = (this.votosMapLocal || {})[p.id] || { apoios: 0, rejeicoes: 0, meuVoto: null };
        this.view.abrirModalProposicao(p, votoInfo);

        // Carrega os temas em segundo plano da API
        try {
            const temasEl = document.getElementById('modal-prop-tema');
            if (temasEl) {
                temasEl.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin text-teal-600"></i> Buscando temas...';
                const temas = await window.camaraApi.buscarTemasProposicao(p.id);
                const temasText = temas.map(t => t.tema).join(', ') || 'Geral';
                temasEl.textContent = temasText;
            }
        } catch (err) {
            console.error("Erro ao carregar temas:", err);
            const temasEl = document.getElementById('modal-prop-tema');
            if (temasEl) temasEl.textContent = 'Geral';
        }
    }

    async handleFiltroAnoGlobal(ano, mes) {
        this.anoAnalise = ano;
        this.mesAnalise = mes || null;
        if (this.deputadoIdGlobal) {
            await this.carregarDadosDeputado(this.deputadoIdGlobal);
        }
    }

    async handleApagarAvaliacao() {
        if (!this.deputadoIdGlobal) return;
        try {
            const resp = await window.AvaliacaoModel.apagarAvaliacao(this.deputadoIdGlobal);
            if (resp.success) {
                this.notaSelecionada = 0;
                this.view.preencherMinhaAvaliacao(0, "");
                await this.carregarAvaliacoes(this.deputadoIdGlobal);
                alert("Sua avaliação foi excluída com sucesso!");
            } else {
                alert("Não foi possível excluir a avaliação: " + (resp.error || "Erro desconhecido"));
            }
        } catch (error) {
            console.error("Erro ao apagar avaliação:", error);
            alert("Erro de conexão ao tentar apagar.");
        }
    }

    async handleVotarProposicao(proposicaoId, voto, btn, isFromModal) {
        if (!window.Back4AppService || !window.Back4AppService.getCurrentUser()) {
            // Abre o modal de login automaticamente
            const authModal = document.getElementById('auth-modal');
            if (authModal) {
                authModal.classList.remove('hidden');
            } else {
                alert("Você precisa estar logado para opinar sobre as leis!");
            }
            return;
        }

        // Desabilita os botões do card temporariamente
        const wrapper = document.getElementById(`votos-wrapper-${proposicaoId}`);
        let originalHTML = "";
        if (wrapper) {
            originalHTML = wrapper.innerHTML;
            wrapper.innerHTML = '<span class="text-xs text-gray-500 font-medium"><i class="fa-solid fa-circle-notch fa-spin"></i> Processando...</span>';
        }

        try {
            const resp = await window.TermometroModel.votarProposicao(proposicaoId, voto);
            if (resp.success) {
                // Sucesso! Busca os totais atualizados para esta proposição e atualiza apenas o card
                const totalResp = await window.TermometroModel.buscarVotosProposicao(proposicaoId);
                if (totalResp.success) {
                    const { apoios, rejeicoes, meuVoto } = totalResp.data;
                    if (this.votosMapLocal) this.votosMapLocal[proposicaoId] = totalResp.data;
                    this.view.atualizarVotosCard(proposicaoId, apoios, rejeicoes, meuVoto);
                    if (isFromModal) {
                        this.view.atualizarTermometroModal(proposicaoId, totalResp.data);
                    }
                }
            } else {
                alert("Erro ao computar voto: " + (resp.error || "Tente novamente."));
                if (wrapper) wrapper.innerHTML = originalHTML;
            }
        } catch (error) {
            console.error("Erro ao votar proposição:", error);
            alert("Erro de conexão. Tente novamente.");
            if (wrapper) wrapper.innerHTML = originalHTML;
        }
    }

    async handleVotacaoClick(votacaoId, proposicaoId) {
        this.view.abrirModalVotacaoLoading();

        try {
            const votosList = await window.camaraApi.buscarVotosVotacao(votacaoId).catch(() => []);
            const placar = { sim: 0, nao: 0, abstencao: 0 };
            votosList.forEach(v => {
                const votoNorm = v.tipoVoto ? v.tipoVoto.toLowerCase() : '';
                if (votoNorm === 'sim') placar.sim++;
                else if (votoNorm === 'não' || votoNorm === 'nao') placar.nao++;
                else if (votoNorm === 'abstenção' || votoNorm === 'abstencao') placar.abstencao++;
            });

            let propDetails = null;
            let autoresText = 'Não informado';

            let realPropId = proposicaoId;
            if (!realPropId) {
                const detalheVot = await window.camaraApi._fetch(`/votacoes/${votacaoId}`).catch(() => null);
                if (detalheVot && detalheVot.dados) {
                    const propAfetadas = detalheVot.dados.proposicoesAfetadas || [];
                    if (propAfetadas.length > 0) {
                        realPropId = propAfetadas[0].id;
                    } else if (detalheVot.dados.ultimaApresentacaoProposicao?.uriProposicaoCitada) {
                        const match = detalheVot.dados.ultimaApresentacaoProposicao.uriProposicaoCitada.match(/\/proposicoes\/(\d+)/);
                        if (match) realPropId = parseInt(match[1]);
                    }
                }
            }

            if (realPropId) {
                const propResp = await window.camaraApi._fetch(`/proposicoes/${realPropId}`).catch(() => null);
                if (propResp && propResp.dados) {
                    propDetails = propResp.dados;
                }

                const autoresResp = await window.camaraApi._fetch(`/proposicoes/${realPropId}/autores`).catch(() => null);
                if (autoresResp && autoresResp.dados) {
                    autoresText = autoresResp.dados.map(a => a.nome).join(', ') || 'Não informado';
                }
            }

            this.view.renderizarModalVotacao(votacaoId, propDetails, placar, autoresText, realPropId);
            
            if (realPropId) {
                const opinioesResp = await window.TermometroModel.listarOpinioes(realPropId).catch(() => ({ success: false, data: [] }));
                this.view.renderizarOpinioesForum(opinioesResp.success ? opinioesResp.data : [], realPropId);
            } else {
                this.view.renderizarOpinioesForum([], null);
            }
        } catch (err) {
            console.error('Erro ao carregar detalhes da votação:', err);
            this.view.fecharModalVotacao();
            alert("Erro ao carregar detalhes da votação.");
        }
    }

    async handleEnviarOpiniao(proposicaoId, texto) {
        const currentUser = window.Back4AppService.getCurrentUser();
        if (!currentUser) {
            alert("Você precisa estar logado para enviar uma opinião.");
            return;
        }

        try {
            const resp = await window.TermometroModel.enviarOpiniao(proposicaoId, texto);
            if (resp.success) {
                const opinioesResp = await window.TermometroModel.listarOpinioes(proposicaoId).catch(() => ({ success: false, data: [] }));
                this.view.renderizarOpinioesForum(opinioesResp.success ? opinioesResp.data : [], proposicaoId);
            } else {
                alert("Erro ao enviar opinião: " + resp.error);
            }
        } catch (error) {
            console.error("Erro ao processar envio de opinião:", error);
            alert("Erro ao enviar opinião. Tente novamente.");
        }
    }
}

window.PerfilDeputadoController = PerfilDeputadoController;

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa apenas se estivermos na página de perfil
    if (document.getElementById('profile-content')) {
        const controller = new PerfilDeputadoController();
        controller.init();
    }
});
