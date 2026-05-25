async function main() {
    try {
        // Let's fetch the swagger home page and look for the JSON URL
        const response = await fetch('https://dadosabertos.camara.leg.br/swagger/');
        const html = await response.text();
        console.log("Swagger home page length:", html.length);
        
        // Search for ".json" or ".yaml" or ".yml"
        const regex = /["']([^"']+\.json|[^"']+\.yaml|[^"']+\.yml)["']/gi;
        const matches = html.match(regex) || [];
        console.log("Matches:", matches);
    } catch (err) {
        console.error(err);
    }
}

main();
