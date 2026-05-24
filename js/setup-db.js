// js/setup-db.js

/**
 * Script utilitário para inicializar a estrutura do banco de dados (Schema) no Back4App.
 * Ele cria registros "fantasmas" com todos os campos necessários e os deleta imediatamente,
 * forçando o Parse a criar as tabelas e tipagens corretas no servidor.
 */
async function inicializarEstruturaBanco() {
    const currentUser = Parse.User.current();
    
    if (!currentUser) {
        alert("Erro: Você precisa criar uma conta e fazer login primeiro para inicializar o banco de dados.");
        console.error("Tentativa de inicializar BD sem usuário logado.");
        return;
    }

    console.log("🚀 Iniciando o setup do Schema do Banco de Dados...");
    
    try {
        // 1. Classe Monitoramento
        console.log("1/3 - Criando tabela Monitoramento...");
        const Monitoramento = Parse.Object.extend("Monitoramento");
        const objMonitoramento = new Monitoramento();
        objMonitoramento.set("usuario", currentUser);
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
        objAvaliacao.set("usuario", currentUser);
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
        objTermometroLeis.set("usuario", currentUser);
        objTermometroLeis.set("proposicaoId", 0);
        objTermometroLeis.set("votoUsuario", "Apoio");
        await objTermometroLeis.save();
        await objTermometroLeis.destroy();
        console.log("✅ Tabela TermometroLeis configurada!");

        console.log("🎉 SETUP CONCLUÍDO! Todas as tabelas foram criadas no Back4App com sucesso.");
        alert("Sucesso! Estrutura do banco inicializada no Back4App.");

    } catch (error) {
        console.error("❌ Erro durante o setup do banco de dados:", error);
        alert("Erro ao inicializar o banco de dados. Verifique o console.");
    }
}

// Expõe a função globalmente para poder ser chamada no console
window.inicializarEstruturaBanco = inicializarEstruturaBanco;
