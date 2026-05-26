const https = require('https');

function get(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'Accept': 'application/json' } }, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function test() {
    try {
        const start = '2026-02-01';
        const end = '2026-02-28';
        console.log(`Fetching plenary events for organ 180 from ${start} to ${end}...`);
        const orgUrl = `https://dadosabertos.camara.leg.br/api/v2/orgaos/180/eventos?dataInicio=${start}&dataFim=${end}&itens=100`;
        const orgEvents = await get(orgUrl);

        console.log(`Plenary 180 events count: ${orgEvents.dados ? orgEvents.dados.length : 0}`);
        const orgDelib = (orgEvents.dados || []).filter(e => e.descricaoTipo && e.descricaoTipo.toLowerCase().includes('deliberativa'));
        console.log(`Plenary 180 deliberative events: ${orgDelib.length}`);
        console.log("Plenary 180 deliberative events details:", orgDelib.map(e => ({ id: e.id, situacao: e.situacao, data: e.dataHoraInicio })));
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
