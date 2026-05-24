/**
 * Serviço de Integração com o Back4App (Parse SDK).
 * ÚNICO arquivo autorizado a chamar métodos diretos do Parse (Parse.Query, Parse.Object, etc).
 */
class Back4AppService {
    /**
     * Inicializa o SDK do Parse.
     */
    static init() {
        if (!window.ENV || !window.ENV.PARSE_APP_ID || !window.ENV.PARSE_JS_KEY) {
            console.error("Variáveis de ambiente do Parse ausentes.");
            return;
        }
        Parse.initialize(window.ENV.PARSE_APP_ID, window.ENV.PARSE_JS_KEY);
        Parse.serverURL = 'https://parseapi.back4app.com/';
        console.log("Back4App Service inicializado.");
    }

    // ==========================================
    // AUTENTICAÇÃO
    // ==========================================
    static getCurrentUser() {
        return Parse.User.current();
    }

    static async login(username, password) {
        return await Parse.User.logIn(username, password);
    }

    static async signup(username, password, email) {
        const user = new Parse.User();
        user.set("username", username);
        user.set("password", password);
        user.set("email", email || username);
        return await user.signUp();
    }

    static async logout() {
        return await Parse.User.logOut();
    }

    // ==========================================
    // MÉTODOS GENÉRICOS DE DADOS
    // ==========================================
    
    /**
     * Auxiliar para tratar erros do Parse, como token de sessão inválido (código 209).
     */
    static async _handleParseError(error) {
        if (error && error.code === 209) {
            console.warn("⚠️ Sessão inválida do Parse (Token expirado/inválido). Deslogando usuário local...");
            try {
                await Parse.User.logOut();
            } catch (e) {
                console.error("Erro ao efetuar logOut após token inválido:", e);
            }
            if (window.updateAuthUI) {
                window.updateAuthUI();
            } else if (typeof updateAuthUI === 'function') {
                updateAuthUI();
            }
            // Recarrega a página ou a UI ativa para sincronizar
            if (window.activeController && typeof window.activeController.recarregarGrid === 'function') {
                window.activeController.recarregarGrid();
            }
        }
        throw error;
    }

    /**
     * Busca um único registro de uma classe baseado em uma chave/valor e usuário logado.
     */
    static async getFirst(className, conditions = {}) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) throw new Error("Usuário não logado");

        try {
            const query = new Parse.Query(className);
            query.equalTo("usuario", currentUser);
            
            for (const [key, value] of Object.entries(conditions)) {
                query.equalTo(key, value);
            }
            
            return await query.first();
        } catch (error) {
            return await this._handleParseError(error);
        }
    }

    /**
     * Busca todos os registros de uma classe baseados em condições e usuário logado.
     */
    static async getAll(className, conditions = {}, limit = 1000) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) throw new Error("Usuário não logado");

        try {
            const query = new Parse.Query(className);
            query.equalTo("usuario", currentUser);
            
            for (const [key, value] of Object.entries(conditions)) {
                query.equalTo(key, value);
            }
            
            query.limit(limit);
            return await query.find();
        } catch (error) {
            return await this._handleParseError(error);
        }
    }

    /**
     * Salva um objeto Parse (novo ou existente).
     */
    static async saveObj(parseObject) {
        try {
            return await parseObject.save();
        } catch (error) {
            return await this._handleParseError(error);
        }
    }

    /**
     * Deleta um objeto Parse.
     */
    static async deleteObj(parseObject) {
        try {
            return await parseObject.destroy();
        } catch (error) {
            return await this._handleParseError(error);
        }
    }

    /**
     * Cria uma nova instância de um Parse.Object para a classe dada.
     */
    static createObj(className) {
        const ParseClass = Parse.Object.extend(className);
        return new ParseClass();
    }

    /**
     * Busca todos os registros de uma classe de forma pública (sem restrição ao usuário logado).
     */
    static async getPublicAll(className, conditions = {}, limit = 1000) {
        try {
            const query = new Parse.Query(className);
            
            for (const [key, value] of Object.entries(conditions)) {
                query.equalTo(key, value);
            }
            
            query.limit(limit);
            query.include("usuario");
            query.descending("createdAt");
            
            return await query.find();
        } catch (error) {
            return await this._handleParseError(error);
        }
    }
}

// Inicializa automaticamente se carregado
Back4AppService.init();

window.Back4AppService = Back4AppService;
