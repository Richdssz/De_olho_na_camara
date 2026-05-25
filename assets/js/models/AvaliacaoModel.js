/**
 * Model de Avaliação
 * Responsável pelo CRUD de avaliações no Back4App.
 * Sempre retorna { success, data, source, timestamp, error }.
 */
class AvaliacaoModel {
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
     * Busca a avaliação do usuário logado para um deputado específico.
     * @param {number} deputadoId 
     * @returns {Promise<Object>}
     */
    static async buscarAvaliacao(deputadoId) {
        try {
            const existing = await window.Back4AppService.getFirst("Avaliacao", { deputadoId });
            if (existing) {
                const data = {
                    nota: existing.get("nota") || 0,
                    comentario: existing.get("comentario") || ''
                };
                return this._formatResponse(true, data, 'db');
            }
            return this._formatResponse(true, { nota: 0, comentario: '' }, 'db');
        } catch (error) {
            return this._formatResponse(false, null, 'db', error.message);
        }
    }

    /**
     * Salva ou atualiza a avaliação de um deputado (Create ou Update).
     * @param {number} deputadoId 
     * @param {string} nomeDeputado 
     * @param {number} nota 
     * @param {string} comentario 
     * @returns {Promise<Object>}
     */
    static async salvarAvaliacao(deputadoId, nomeDeputado, nota, comentario) {
        try {
            let avaliacaoObj = await window.Back4AppService.getFirst("Avaliacao", { deputadoId });
            
            if (!avaliacaoObj) {
                avaliacaoObj = window.Back4AppService.createObj("Avaliacao");
                const currentUser = window.Back4AppService.getCurrentUser();
                
                avaliacaoObj.set("usuario", currentUser);
                avaliacaoObj.set("deputadoId", deputadoId);
                avaliacaoObj.set("nomeDeputado", nomeDeputado);
            }
            
            avaliacaoObj.set("nota", nota);
            avaliacaoObj.set("comentario", comentario);
            
            await window.Back4AppService.saveObj(avaliacaoObj);
            
            return this._formatResponse(true, { deputadoId, nota, comentario }, 'db');
        } catch (error) {
            return this._formatResponse(false, null, 'db', error.message);
        }
    }

    /**
     * Busca todas as avaliações públicas de um deputado específico.
     * @param {number} deputadoId 
     * @returns {Promise<Object>}
     */
    static async listarPorDeputado(deputadoId) {
        try {
            const results = await window.Back4AppService.getPublicAll("Avaliacao", { deputadoId });
            const data = results.map(r => {
                const userObj = r.get("usuario");
                return {
                    id: r.id,
                    username: userObj ? userObj.get("username") : "Cidadão Anônimo",
                    nota: r.get("nota") || 0,
                    comentario: r.get("comentario") || "",
                    createdAt: r.createdAt
                };
            });
            return this._formatResponse(true, data, 'db');
        } catch (error) {
            return this._formatResponse(false, [], 'db', error.message);
        }
    }

    /**
     * Apaga a avaliação do usuário logado para um deputado específico.
     * @param {number} deputadoId 
     * @returns {Promise<Object>}
     */
    static async apagarAvaliacao(deputadoId) {
        try {
            const avaliacaoObj = await window.Back4AppService.getFirst("Avaliacao", { deputadoId });
            if (avaliacaoObj) {
                await window.Back4AppService.deleteObj(avaliacaoObj);
                return this._formatResponse(true, null, 'db');
            }
            return this._formatResponse(false, null, 'db', "Avaliação não encontrada.");
        } catch (error) {
            return this._formatResponse(false, null, 'db', error.message);
        }
    }
}

window.AvaliacaoModel = AvaliacaoModel;
