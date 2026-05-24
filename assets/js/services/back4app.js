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
     * Busca um único registro de uma classe baseado em uma chave/valor e usuário logado.
     */
    static async getFirst(className, conditions = {}) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) throw new Error("Usuário não logado");

        const query = new Parse.Query(className);
        query.equalTo("usuario", currentUser);
        
        for (const [key, value] of Object.entries(conditions)) {
            query.equalTo(key, value);
        }
        
        return await query.first();
    }

    /**
     * Busca todos os registros de uma classe baseados em condições e usuário logado.
     */
    static async getAll(className, conditions = {}, limit = 1000) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) throw new Error("Usuário não logado");

        const query = new Parse.Query(className);
        query.equalTo("usuario", currentUser);
        
        for (const [key, value] of Object.entries(conditions)) {
            query.equalTo(key, value);
        }
        
        query.limit(limit);
        return await query.find();
    }

    /**
     * Salva um objeto Parse (novo ou existente).
     */
    static async saveObj(parseObject) {
        return await parseObject.save();
    }

    /**
     * Deleta um objeto Parse.
     */
    static async deleteObj(parseObject) {
        return await parseObject.destroy();
    }

    /**
     * Cria uma nova instância de um Parse.Object para a classe dada.
     */
    static createObj(className) {
        const ParseClass = Parse.Object.extend(className);
        return new ParseClass();
    }
}

// Inicializa automaticamente se carregado
Back4AppService.init();

window.Back4AppService = Back4AppService;
