async function main() {
    try {
        const query = encodeURIComponent('site:dadosabertos.camara.leg.br openapi.json OR swagger.json');
        const url = `https://html.duckduckgo.com/html/?q=${query}`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const html = await response.text();
        console.log("Response status:", response.status);
        
        // Find URLs in the HTML
        const hrefRegex = /href="([^"]+)"/g;
        let match;
        const urls = [];
        while ((match = hrefRegex.exec(html)) !== null) {
            const u = match[1];
            if (u.includes('dadosabertos') || u.includes('swagger') || u.includes('openapi')) {
                urls.push(u);
            }
        }
        console.log("Found URLs in DDG search:", [...new Set(urls)].slice(0, 30));
    } catch (err) {
        console.error(err);
    }
}

main();
