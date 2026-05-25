async function main() {
    try {
        const response = await fetch('https://dadosabertos.camara.leg.br/js/dadosabertos.min.js');
        const js = await response.text();
        
        console.log("Length of JS:", js.length);
        
        // Find URLs or endpoints ending in .json or containing 'swagger'
        const regex = /[\w/.-]+\.json/gi;
        const matches = js.match(regex);
        console.log("JSON matches in JS:", matches);
        
        // Find path configurations
        const pathRegex = /\/[a-zA-Z0-9_-]+\/\{\w+\}\/[a-zA-Z0-9_-]+/g;
        const pathMatches = js.match(pathRegex);
        console.log("Path matches in JS:", pathMatches);
        
        // Find strings like /deputados/
        const depRegex = /\/deputados\b[^\s'"`]*/g;
        const depMatches = js.match(depRegex);
        console.log("Deputados matches in JS:", [...new Set(depMatches)]);
    } catch (err) {
        console.error(err);
    }
}

main();
