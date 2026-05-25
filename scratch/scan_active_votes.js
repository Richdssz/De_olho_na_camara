async function main() {
    try {
        const id = 204528; // Adriana Ventura
        const dataInicio = "2024-05-01";
        const dataFim = "2024-05-15";
        
        // 1. Fetch general votacoes in the period
        const url = `https://dadosabertos.camara.leg.br/api/v2/votacoes?dataInicio=${dataInicio}&dataFim=${dataFim}&itens=100`;
        const res = await fetch(url).then(r => r.json());
        const votacoes = res.dados || [];
        
        // Filter to PLEN (Plenário)
        const plenVotacoes = votacoes.filter(v => v.siglaOrgao === 'PLEN');
        console.log(`Found ${plenVotacoes.length} Plenário votações`);
        
        for (const v of plenVotacoes) {
            const votosUrl = `https://dadosabertos.camara.leg.br/api/v2/votacoes/${v.id}/votos`;
            const votosRes = await fetch(votosUrl).then(r => r.json());
            const votosList = votosRes.dados || [];
            
            const votoDoDeputado = votosList.find(vote => {
                const dep = vote.deputado || vote.deputado_;
                return dep && dep.id === id;
            });
            
            if (votoDoDeputado) {
                console.log(`Found active vote in ${v.id} (${v.descricao.substring(0, 40)}...): ${votoDoDeputado.tipoVoto}`);
            }
        }
    } catch (err) {
        console.error(err);
    }
}

main();
