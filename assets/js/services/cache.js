/**
 * Serviço de Cache Local
 * Gerencia o armazenamento no localStorage com tempo de vida (TTL).
 */
class CacheService {
    /**
     * Recupera um item do cache se ainda for válido.
     * @param {string} key 
     * @returns {any|null} Dados cacheados ou null
     */
    static getLocal(key) {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) return null;

        try {
            const item = JSON.parse(itemStr);
            const now = new Date().getTime();
            
            // Verifica se expirou
            if (now > item.expiry) {
                localStorage.removeItem(key);
                return null;
            }
            return item.value;
        } catch (e) {
            localStorage.removeItem(key);
            return null;
        }
    }

    /**
     * Salva um item no cache com TTL (Tempo de vida) em minutos.
     * @param {string} key 
     * @param {any} value 
     * @param {number} ttlMinutos 
     */
    static setLocal(key, value, ttlMinutos = 60) {
        const now = new Date().getTime();
        const item = {
            value: value,
            expiry: now + (ttlMinutos * 60 * 1000),
        };
        try {
            localStorage.setItem(key, JSON.stringify(item));
        } catch (e) {
            console.warn("Erro ao salvar no cache local (possível limite excedido):", e);
        }
    }

    static removeLocal(key) {
        localStorage.removeItem(key);
    }
}

window.CacheService = CacheService;
