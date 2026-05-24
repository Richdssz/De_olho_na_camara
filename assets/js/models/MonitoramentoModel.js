/**
 * Model de Monitoramento (Radar)
 * Responsável pelo CRUD de deputados monitorados no Back4App.
 * Sempre retorna { success, data, source, timestamp, error }.
 */
class MonitoramentoModel {
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
     * Busca todos os IDs monitorados pelo usuário logado.
     * @returns {Promise<Object>}
     */
    static async listarMonitorados() {
        try {
            const results = await window.Back4AppService.getAll("Monitoramento");
            const data = results.map(r => r.get("deputadoId"));
            return this._formatResponse(true, data, 'db');
        } catch (error) {
            return this._formatResponse(false, [], 'db', error.message);
        }
    }

    /**
     * Alterna o monitoramento de um deputado (Create ou Delete).
     * @param {number} deputadoId 
     * @param {string} nomeDeputado 
     * @returns {Promise<Object>} Retorna se a ação final foi "added" ou "removed".
     */
    static async alternarRadar(deputadoId, nomeDeputado) {
        try {
            const existing = await window.Back4AppService.getFirst("Monitoramento", { deputadoId });
            
            if (existing) {
                // DELETE
                await window.Back4AppService.deleteObj(existing);
                return this._formatResponse(true, { action: "removed", deputadoId }, 'db');
            } else {
                // CREATE
                const monitoramento = window.Back4AppService.createObj("Monitoramento");
                const currentUser = window.Back4AppService.getCurrentUser();
                
                monitoramento.set("usuario", currentUser);
                monitoramento.set("deputadoId", deputadoId);
                monitoramento.set("nomeDeputado", nomeDeputado);
                
                await window.Back4AppService.saveObj(monitoramento);
                return this._formatResponse(true, { action: "added", deputadoId }, 'db');
            }
        } catch (error) {
            return this._formatResponse(false, null, 'db', error.message);
        }
    }
}

window.MonitoramentoModel = MonitoramentoModel;
