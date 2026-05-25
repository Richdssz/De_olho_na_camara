/**
 * Controller do Perfil do Deputado (deputado-perfil.html)
 */
class PerfilDeputadoController {
    constructor() {
        this.view = new window.PerfilDeputadoView();
        this.deputadoIdGlobal = null;
        this.deputadoNomeGlobal = "";
        this.notaSelecionada = 0;
        this.proposicoesOriginais = [];
        this.votosMapLocal = {};
    }

    async init() {
        const urlParams = new URLSearchParams(window.location.search);
        const deputadoId = urlParams.get('id');

        if (!deputadoId) {
            this.view.mostrarErro("ID do deputado não fornecido na URL.");
            return;
        }

        this.deputadoIdGlobal = parseInt(deputadoId);

        window.activeController = this;

        this.view.onAcompanharClick(this.handleAlternarRadar.bind(this));
        this.view.onExportarClick(() => window.print());
        
        this.view.onEstrelaClick(this.handleEstrelaClick.bind(this));
        this.view.onSalvarAvaliacaoClick(this.handleSalvarAvaliacao.bind(this));
        this.view.onVotarProposicaoClick(this.handleVotarProposicao.bind(this));
        this.view.onFiltroProposicaoChange(this.handleFiltroProposicao.bind(this));
        this.view.onAbrirModalProposicaoClick(this.handleAbrirModalProposicao.bind(this));

        await this.carregarDadosDeputado(this.deputadoIdGlobal);
    }

    async carregarDadosDeputado(id) {
        try {
            this.view.mostrarCarregamento();

            // 1. Dados cadastrais
            const deputadoResp = await window.DeputadoModel.buscarDetalhes(id);
            if (!deputadoResp.success) throw new Error("Deputado não encontrado.");
            
            const deputado = deputadoResp.data;
            this.deputadoNomeGlobal = deputado.ultimoStatus.nome || deputado.nomeCivil;
            const siglaPartido = deputado.ultimoStatus.siglaPartido || "";

            this.view.preencherDadosPerfil(deputado);

            // Sincroniza radar
            await this.verificarEstadoRadar(id);

            // 2. Coletando dados complementares
            const anoCorrente = new Date().getFullYear();
            
            const [despesas, eventos, proposicoes, votacoesRecentes] = await Promise.all([
                window.camaraApi.buscarDespesas(id, anoCorrente).catch(() => []),
                window.camaraApi.buscarEventos(id, `${anoCorrente}-01-01`, `${anoCorrente}-12-31`).catch(() => []),
                window.camaraApi.buscarProposicoesAutor(id).catch(() => []),
                window.camaraApi.buscarVotacoesRecentes(15).catch(() => [])
            ]);

            this.proposicoesOriginais = proposicoes || [];

            // 3. Analytics
            const analisePresenca = window.analytics.calcularTaxaPresenca(eventos, anoCorrente);
            const analiseGastos = window.analytics.calcularMediaGastos(despesas);
            const totalProposicoes = proposicoes.length;

            // 4. Votos Nominais
            const votosDeputadoMapeados = [];
            const orientacoesMapeadas = {};

            await Promise.all(votacoesRecentes.map(async (v) => {
                try {
                    const [votosList, orientacoesList] = await Promise.all([
                        window.camaraApi.buscarVotosVotacao(v.id),
                        window.camaraApi.buscarOrientacoesVotacao(v.id)
                    ]);

                    const votoDoDeputado = votosList.find(vote => vote.deputado_ && vote.deputado_.id === id);
                    const tipoVoto = votoDoDeputado ? votoDoDeputado.tipoVoto : "Ausente";

                    votosDeputadoMapeados.push({
                        votacaoId: v.id,
                        descricao: v.descricao,
                        data: v.data,
                        voto: tipoVoto
                    });

                    orientacoesMapeadas[v.id] = orientacoesList;
                } catch (err) {
                    console.error(`Erro votação ${v.id}:`, err);
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

            // 5. Renderizar na View
            this.view.renderizarPainelKPIs(analisePresenca, analiseGastos, analiseCoesao, totalProposicoes);
            this.view.renderizarBadges(badges);
            this.view.renderizarAnomalias(analiseAnomalias);
            this.view.renderizarTabelaVotacoes(votosDeputadoMapeados, orientacoesMapeadas, siglaPartido);
            this.view.renderizarGraficos(despesas, eventos);

            // 6. Termômetro de Leis - Carregar votos comunitários para as proposições
            const propToShow = proposicoes.slice(0, 6);
            await this.renderizarProposicoesAtualizadas(propToShow);

            this.view.mostrarConteudo();

            // Carrega a seção de avaliações da Voz do Cidadão
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
            if (publicResp.success && publicResp.data) {
                const comentarios = publicResp.data;
                const totalNotas = comentarios.reduce((sum, c) => sum + c.nota, 0);
                const media = comentarios.length > 0 ? (totalNotas / comentarios.length) : 0;
                this.view.renderizarComentarios(comentarios, media);
            }
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
            console.error("Erro ao salvar avaliação:", error);
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

    handleAbrirModalProposicao(proposicaoId) {
        const p = (this.proposicoesOriginais || []).find(x => x.id === proposicaoId);
        if (!p) return;
        const votoInfo = (this.votosMapLocal || {})[p.id] || { apoios: 0, rejeicoes: 0, meuVoto: null };
        this.view.abrirModalProposicao(p, votoInfo);
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
}

window.PerfilDeputadoController = PerfilDeputadoController;

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa apenas se estivermos na página de perfil
    if (document.getElementById('profile-content')) {
        const controller = new PerfilDeputadoController();
        controller.init();
    }
});
