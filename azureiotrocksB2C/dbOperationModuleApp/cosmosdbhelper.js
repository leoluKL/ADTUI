const CosmosClient = require('@azure/cosmos').CosmosClient

function cosmosdbhelper() {
    const options = {
        endpoint: process.env.cosmosDBEndpoint,
        key: process.env.dbkey
    };

    this.client = new CosmosClient(options)
}

cosmosdbhelper.prototype.query = async function (containerID,queryStr) {
    const { resources: queryResults } = await this.client.database(process.env.cosmosDBName).container(containerID).items.query(queryStr).fetchAll()
    return queryResults;
}

cosmosdbhelper.prototype.insertRecord=async function (containerID,docObj){
    const { item } = await this.client.database(process.env.cosmosDBName).container(containerID).items.upsert(docObj)
    return item;
}

module.exports = new cosmosdbhelper();