const CosmosClient = require('@azure/cosmos').CosmosClient

function cosmosdbhelper() {
    const options = {
        endpoint: process.env.cosmosDBEndpoint,
        key: process.env.dbkey
    };

    this.client = new CosmosClient(options)
}

cosmosdbhelper.prototype.query = async function (containerID,queryStr) {
    try{
        const { resources: queryResults } = await this.client.database(process.env.cosmosDBName).container(containerID).items.query(queryStr).fetchAll()
        return queryResults;
    }catch(e){
        throw e;
    }
    
}

cosmosdbhelper.prototype.insertRecord=async function (containerID,docObj){
    try{
        const { item } = await this.client.database(process.env.cosmosDBName).container(containerID).items.upsert(docObj)
        return item;
    }catch(e){
        throw e;
    }
}

cosmosdbhelper.prototype.insertRecords=async function (containerID,docsArr){
    try{
        var promiseArr=[]
        docsArr.forEach(oneDoc=>{
            promiseArr.push(this.insertRecord(containerID,oneDoc))
        })
        var results=await Promise.allSettled(promiseArr);
    }catch(e){
        throw e;
    }
}

cosmosdbhelper.prototype.deleteRecord=async function(containerID,partitionFieldValue,documentID){
    try{
        var re=await this.client.database(process.env.cosmosDBName).container(containerID).item(documentID, partitionFieldValue)
        .delete()
    }catch(e){
        throw e;
    }
}


module.exports = new cosmosdbhelper();