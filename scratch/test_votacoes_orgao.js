async function main() {
    try {
        console.log("Fetching detailed proposition 258057...");
        const res = await fetch("https://dadosabertos.camara.leg.br/api/v2/proposicoes/258057");
        const json = await res.json();
        console.log("Proposition 258057 details:", JSON.stringify(json.dados, null, 2));

        console.log("Fetching authors for 258057...");
        const resAutores = await fetch("https://dadosabertos.camara.leg.br/api/v2/proposicoes/258057/autores");
        const jsonAutores = await resAutores.json();
        console.log("Authors count:", jsonAutores.dados?.length);
        console.log("Authors sample:", jsonAutores.dados ? jsonAutores.dados.map(a => a.nome) : null);
    } catch (err) {
        console.error(err);
    }
}
main();
