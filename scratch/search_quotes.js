async function main() {
    try {
        const query = encodeURIComponent('"/deputados/" "/votacoes" dados abertos camara');
        const url = `https://html.duckduckgo.com/html/?q=${query}`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const html = await response.text();
        
        // Find snippets
        const snippetRegex = /<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
        let match;
        const snippets = [];
        while ((match = snippetRegex.exec(html)) !== null) {
            snippets.push(match[1].replace(/<[^>]*>/g, '').trim());
        }
        console.log("Quotes search snippets:", snippets);
    } catch (err) {
        console.error(err);
    }
}

main();
