async function main() {
    try {
        const query = encodeURIComponent('site:dadosabertos.camara.leg.br "deputados" votes OR votacoes OR votos');
        const url = `https://html.duckduckgo.com/html/?q=${query}`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const html = await response.text();
        
        // Extract all occurrences of paths containing /deputados/
        const regex = /\/deputados\/[^<\s"'\)]+/g;
        const matches = html.match(regex) || [];
        console.log("Matched paths in DDG search:", [...new Set(matches)]);
    } catch (err) {
        console.error(err);
    }
}

main();
