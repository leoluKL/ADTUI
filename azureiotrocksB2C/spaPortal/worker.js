self.addEventListener('push', ev => {
    const data = ev.data.json();
    self.clients.matchAll().then((clients) => {
        if(!clients || clients.length==0) return;
        clients.forEach(oneClient=>{
            oneClient.postMessage(data)
        })
    })
});