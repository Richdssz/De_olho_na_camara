// js/setup-db.js

/**
 * Script administrativo para inicializar a estrutura do banco de dados (Schema) no Back4App usando Node.js.
 * Ele cria registros "fantasmas" com todos os campos necessários e os deleta imediatamente,
 * forçando o Parse a criar as tabelas e tipagens corretas no servidor.
 */

const Parse = require('parse/node');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Função para limpar caracteres extras de formatação JS (ex: aspas, vírgulas, espaços)
function cleanKey(val) {
    if (!val) return '';
    return val.replace(/['",\s{}]/g, '').trim();
}

// Função para tentar extrair as chaves do .env ou js/config.js caso o dotenv puro não as encontre
function getParseKeys() {
    let appId = cleanKey(process.env.PARSE_APP_ID);
    let jsKey = cleanKey(process.env.PARSE_JS_KEY);

    if (!appId || !jsKey) {
        const envPath = path.resolve(__dirname, '../.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            
            // Tenta formato padrão dotenv (PARSE_APP_ID=xxx)
            const stdAppId = envContent.match(/^PARSE_APP_ID\s*=\s*(.*)$/m);
            const stdJsKey = envContent.match(/^PARSE_JS_KEY\s*=\s*(.*)$/m);
            if (stdAppId && stdJsKey) {
                appId = cleanKey(stdAppId[1]);
                jsKey = cleanKey(stdJsKey[1]);
            } else {
                // Tenta formato JavaScript (PARSE_APP_ID: "xxx")
                const jsAppId = envContent.match(/PARSE_APP_ID\s*:\s*["']([^"']+)["']/);
                const jsJsKey = envContent.match(/PARSE_JS_KEY\s*:\s*["']([^"']+)["']/);
                if (jsAppId && jsJsKey) {
                    appId = cleanKey(jsAppId[1]);
                    jsKey = cleanKey(jsJsKey[1]);
                }
            }
        }
    }

    // Se ainda não encontrou, tenta ler de js/config.js
    if (!appId || !jsKey) {
        const configPath = path.resolve(__dirname, 'config.js');
        if (fs.existsSync(configPath)) {
            const configContent = fs.readFileSync(configPath, 'utf8');
            const jsAppId = configContent.match(/PARSE_APP_ID\s*:\s*["']([^"']+)["']/);
            const jsJsKey = configContent.match(/PARSE_JS_KEY\s*:\s*["']([^"']+)["']/);
            if (jsAppId && jsJsKey) {
                appId = cleanKey(jsAppId[1]);
                jsKey = cleanKey(jsJsKey[1]);
            }
        }
    }

    return { appId, jsKey };
}


async function inicializarEstruturaBanco() {
    const { appId, jsKey } = getParseKeys();

    if (!appId || !jsKey) {
        console.error("❌ Erro: Chaves PARSE_APP_ID ou PARSE_JS_KEY não encontradas no ambiente ou no arquivo .env.");
        process.exit(1);
    }

    // Inicializa o Parse SDK para Node.js
    Parse.initialize(appId, jsKey);
    Parse.serverURL = 'https://parseapi.back4app.com/';

    console.log("🚀 Iniciando o setup do Schema do Banco de Dados no Back4App...");

    try {
        // Criar um pointer dummy para o usuário (evita precisar de usuário real ou login para criar as colunas do tipo Pointer)
        const dummyUser = Parse.User.createWithoutData("dummy_user_id");

        // 1. Classe Monitoramento
        console.log("1/3 - Criando tabela Monitoramento...");
        const Monitoramento = Parse.Object.extend("Monitoramento");
        const objMonitoramento = new Monitoramento();
        objMonitoramento.set("usuario", dummyUser);
        objMonitoramento.set("deputadoId", 0);
        objMonitoramento.set("nomeDeputado", "Setup");
        objMonitoramento.set("notaUsuario", "Setup");
        await objMonitoramento.save();
        await objMonitoramento.destroy();
        console.log("✅ Tabela Monitoramento configurada!");

        // 2. Classe Avaliacao
        console.log("2/3 - Criando tabela Avaliacao...");
        const Avaliacao = Parse.Object.extend("Avaliacao");
        const objAvaliacao = new Avaliacao();
        objAvaliacao.set("usuario", dummyUser);
        objAvaliacao.set("deputadoId", 0);
        objAvaliacao.set("nomeDeputado", "Setup");
        objAvaliacao.set("nota", 5);
        await objAvaliacao.save();
        await objAvaliacao.destroy();
        console.log("✅ Tabela Avaliacao configurada!");

        // 3. Classe TermometroLeis
        console.log("3/3 - Criando tabela TermometroLeis...");
        const TermometroLeis = Parse.Object.extend("TermometroLeis");
        const objTermometroLeis = new TermometroLeis();
        objTermometroLeis.set("usuario", dummyUser);
        objTermometroLeis.set("proposicaoId", 0);
        objTermometroLeis.set("votoUsuario", "Apoio");
        await objTermometroLeis.save();
        await objTermometroLeis.destroy();
        console.log("✅ Tabela TermometroLeis configurada!");

        console.log("🎉 SETUP CONCLUÍDO! Todas as tabelas foram criadas no Back4App com sucesso.");
    } catch (error) {
        console.error("❌ Erro durante o setup do banco de dados:", error);
        process.exit(1);
    }
}

// Executa a função
inicializarEstruturaBanco();
