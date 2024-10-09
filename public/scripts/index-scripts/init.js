// Get server owner and print it in the web page tittle
export function getServerOwner(){
    fetch('/api/getOwner')
    .then(response => response.json())
    .then(data => {
        document.title = `Real time - ${data.owner}`;
    })
    .catch(error => console.error('Error fetching owner:', error));
}
