async function main() {
    try {
        // Let's test different parameters for organ on /votacoes
        const tests = [
            'idOrgao=114',
            'codOrgao=114',
            'orgao=114',
            'siglaOrgao=PLEN'
        ];
        
        for (const test of tests) {
            const url = `https://dadosabertos.camara.leg.br/api/v2/votacoes?${test}&itens=1`;
            const res = await fetch(url);
            console.log(`Query ${test} status:`, res.status);
            if (res.status === 200) {
                const json = await res.json();
                console.log(`Query ${test} results length:`, json.dados?.length);
            } else {
                const errJson = await res.json();
                console.log(`Query ${test} error:`, errJson);
            }
        }
    } catch (err) {
        console.error(err);
    }
}

main();
