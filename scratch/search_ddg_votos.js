async function main() {
    try {
        const query = encodeURIComponent('site:dadosabertos.camara.leg.br/api/v2 deputados votos OR votacoes');
        const url = `https://html.duckduckgo.com/html/?q=${query}`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const html = await response.text();
        
        const regex = /https?:\/\/dadosabertos.camara.leg.br\/api\/v2\/[^\s"'\)]+/g;
        const matches = html.match(regex) || [];
        console.log("Matched URLs in DDG search:", [...new Set(matches)]);
        
        // Let's also print search result titles
        const titleRegex = /<a class="result__url"[^>]*>([\s\S]*?)<\/a>/gi;
        let match;
        const titles = [];
        while ((match = titleRegex.exec(html)) !== null) {
            titles.push(match[1].replace(/<[^>]*>/g, '').trim());
        }
        console.log("Titles:", titles);
    } catch (err) {
        console.error(err);
    }
}

main();
