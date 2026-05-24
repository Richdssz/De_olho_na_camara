/**
 * Model do Termômetro de Leis (TermometroLeis)
 * Responsável pelo CRUD de votos comunitários em proposições no Back4App.
 * Sempre retorna { success, data, source, timestamp, error }.
 */
class TermometroModel {
    /**
     * Formata a resposta padrão do Model.
     */
    static _formatResponse(success, data = null, source = 'db', error = null) {
        return {
            success,
            data,
            source,
            timestamp: new Date(),
            error
        };
    }

    /**
     * Vota em uma proposição (Apoio ou Rejeito).
     * @param {number} proposicaoId 
     * @param {string} voto "Apoio" ou "Rejeito"
     * @returns {Promise<Object>}
     */
    static async votarProposicao(proposicaoId, voto) {
        try {
            const currentUser = window.Back4AppService.getCurrentUser();
            if (!currentUser) throw new Error("Você precisa estar logado para votar.");

            // Busca o voto existente do usuário logado para esta proposição
            let votoObj = await window.Back4AppService.getFirst("TermometroLeis", { proposicaoId });

            if (votoObj) {
                const votoAtual = votoObj.get("votoUsuario");
                if (votoAtual === voto) {
                    // Clicou de novo no mesmo botão: remove o voto
                    await window.Back4AppService.deleteObj(votoObj);
                    return this._formatResponse(true, { action: "removed", voto: null }, 'db');
                } else {
                    // Clicou no botão oposto: altera o voto
                    votoObj.set("votoUsuario", voto);
                    await window.Back4AppService.saveObj(votoObj);
                    return this._formatResponse(true, { action: "updated", voto }, 'db');
                }
            } else {
                // Cria um novo voto
                const novoVotoObj = window.Back4AppService.createObj("TermometroLeis");
                novoVotoObj.set("usuario", currentUser);
                novoVotoObj.set("proposicaoId", proposicaoId);
                novoVotoObj.set("votoUsuario", voto);
                
                await window.Back4AppService.saveObj(novoVotoObj);
                return this._formatResponse(true, { action: "added", voto }, 'db');
            }
        } catch (error) {
            console.error("[TermometroModel] Erro ao votar:", error);
            return this._formatResponse(false, null, 'db', error.message);
        }
    }

    /**
     * Busca os votos totais de uma proposição.
     * @param {number} proposicaoId 
     * @returns {Promise<Object>}
     */
    static async buscarVotosProposicao(proposicaoId) {
        try {
            const results = await window.Back4AppService.getPublicAll("TermometroLeis", { proposicaoId });
            
            let apoios = 0;
            let rejeicoes = 0;
            let meuVoto = null;

            const currentUser = window.Back4AppService.getCurrentUser();

            results.forEach(r => {
                const votoVal = r.get("votoUsuario");
                if (votoVal === "Apoio") apoios++;
                else if (votoVal === "Rejeito") rejeicoes++;

                const userObj = r.get("usuario");
                if (currentUser && userObj && userObj.id === currentUser.id) {
                    meuVoto = votoVal;
                }
            });

            return this._formatResponse(true, { apoios, rejeicoes, meuVoto }, 'db');
        } catch (error) {
            console.error(`[TermometroModel] Erro ao buscar votos da proposição ${proposicaoId}:`, error);
            return this._formatResponse(false, { apoios: 0, rejeicoes: 0, meuVoto: null }, 'db', error.message);
        }
    }
}

window.TermometroModel = TermometroModel;
