async function main() {
    try {
        const pageTitle = "Partido dos Trabalhadores";
        const url = `https://pt.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages&piprop=original&exintro=true&explaintext=true&format=json&titles=${encodeURIComponent(pageTitle)}&origin=*`;
        const res = await fetch(url).then(r => r.json());
        console.log(JSON.stringify(res, null, 2));
    } catch (err) {
        console.error(err);
    }
}

main();
