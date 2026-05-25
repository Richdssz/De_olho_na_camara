async function main() {
    try {
        console.log("Listando ultimas 150 votacoes (com filtro JS por PLEN)...");
        const url = `https://dadosabertos.camara.leg.br/api/v2/votacoes?itens=150&ordem=desc&ordenarPor=dataHoraRegistro`;
        const res = await fetch(url).then(r => r.json());
        const votacoes = res.dados || [];
        
        console.log(`Encontradas ${votacoes.length} votacoes na API.`);
        const plen = votacoes.filter(v => v.siglaOrgao === 'PLEN');
        console.log(`Filtradas ${plen.length} votacoes de Plenário.`);
        
        plen.forEach((v, index) => {
            console.log(`${index + 1}. ID: ${v.id} | Data: ${v.dataHoraRegistro || v.data} | Desc: ${v.descricao}`);
        });
    } catch (e) {
        console.error(e);
    }
}

main();
