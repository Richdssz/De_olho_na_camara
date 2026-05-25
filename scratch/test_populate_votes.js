async function main() {
    try {
        const id = 204379; // Acácio Favacho
        const dataInicio = "2024-05-01";
        const dataFim = "2024-05-15";
        
        // 1. Fetch general votacoes in the period
        const url = `https://dadosabertos.camara.leg.br/api/v2/votacoes?dataInicio=${dataInicio}&dataFim=${dataFim}&itens=100`;
        const res = await fetch(url).then(r => r.json());
        const votacoes = res.dados || [];
        
        // Filter to PLEN (Plenário)
        const plenVotacoes = votacoes.filter(v => v.siglaOrgao === 'PLEN');
        console.log(`Found ${plenVotacoes.length} Plenário votações`);
        
        const votosDeputadoMapeados = [];
        
        // For the first 3 votações, fetch votes and see if we can find the deputy's vote
        for (const v of plenVotacoes.slice(0, 3)) {
            console.log(`Fetching votes for voting ${v.id} (${v.descricao.substring(0, 50)}...)`);
            const votosUrl = `https://dadosabertos.camara.leg.br/api/v2/votacoes/${v.id}/votos`;
            const votosRes = await fetch(votosUrl).then(r => r.json());
            const votosList = votosRes.dados || [];
            
            const votoDoDeputado = votosList.find(vote => {
                const dep = vote.deputado || vote.deputado_;
                return dep && dep.id === id;
            });
            
            const tipoVoto = votoDoDeputado ? votoDoDeputado.tipoVoto : "Ausente";
            console.log(`Deputy vote: ${tipoVoto}`);
            
            votosDeputadoMapeados.push({
                id: v.id,
                descricao: v.descricao,
                voto: tipoVoto
            });
        }
        
        console.log("Results:", votosDeputadoMapeados);
    } catch (err) {
        console.error(err);
    }
}

main();
