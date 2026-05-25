async function main() {
    try {
        const response = await fetch('https://dadosabertos.camara.leg.br/swagger/api.html');
        const html = await response.text();
        console.log("api.html length:", html.length);
        
        // Let's find script files or links in the page
        const regex = /[\w/.-]+\.json/gi;
        const matches = html.match(regex);
        console.log("JSON files in api.html:", matches);
        
        // Find URLs in general
        const urls = html.match(/https?:\/\/[^\s'"`]+/g);
        console.log("HTTP URLs in api.html:", [...new Set(urls)].slice(0, 20));
    } catch (err) {
        console.error(err);
    }
}

main();
