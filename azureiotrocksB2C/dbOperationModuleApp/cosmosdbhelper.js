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

cosmosdbhelper.prototype.getDocByID = async function (containerID,patitionKey,patitionKeyValue,itemID) {
    var queryStr='SELECT * FROM c where '
    queryStr+=`c.id='${itemID}' and c.${patitionKey}='${patitionKeyValue}'`
    try{
        var re=await this.query(containerID,queryStr)
        return re;
    }catch(e){
        throw e;
    }
}


cosmosdbhelper.prototype.insertRecord=async function (containerID,docObj){ //using upsert so it is both update and create-if-not-exist
    try{
        const { item } = await this.client.database(process.env.cosmosDBName).container(containerID).items.upsert(docObj)
        return docObj;
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

cosmosdbhelper.prototype.deleteAllRecordsInAPartition=async function(containerID,patitionKey,patitionKeyValue){
    var queryStr='SELECT c.id FROM c where '
    queryStr+=`c.${patitionKey}='${patitionKeyValue}'`
    try{
        var docsArr=await this.query(containerID,queryStr)
    }catch(e){
        throw e;
    }

    try{
        var promiseArr=[]
        docsArr.forEach(oneDoc=>{
            promiseArr.push(this.deleteRecord(containerID,patitionKeyValue,oneDoc.id))
        })
        var results=await Promise.allSettled(promiseArr);
    }catch(e){
        throw e;
    }
}

cosmosdbhelper.prototype.deleteAllRecordsByQuery=async function(queryStr,containerID){
    //the querystr must return "docID" and "patitionValue" fields
    try{
        var docsArr=await this.query(containerID,queryStr)
    }catch(e){
        throw e;
    }
    try{
        var promiseArr=[]
        docsArr.forEach(oneDoc=>{
            promiseArr.push(this.deleteRecord(containerID,oneDoc.patitionValue,oneDoc.docID))
        })
        var results=await Promise.allSettled(promiseArr);
    }catch(e){
        throw e;
    }
}


module.exports = new cosmosdbhelper();