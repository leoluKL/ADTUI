const fs = require('fs');
const got = require('got');

function azureMapCreatorHelper(){
    this.subscriptionKey="jmQb_cjjgpEXq1wB6eRjsQHojUfI2XxgUpbAhiFqBtc"
}


azureMapCreatorHelper.prototype.deleteDataset=async function(datasetID){
    var commandURL=this.completeURL(`datasets/${datasetID}?`)
    const response = await got(commandURL,{"method":"DELETE",responseType: 'json'})
    console.log(response.statusCode)
    if(response.statusCode==204) return;
    else throw new Error("internal error:"+response.statusCode)
}

azureMapCreatorHelper.prototype.listDataset=async function(){
    var queryURL=this.completeURL('datasets?')
    const response = await got(queryURL, {responseType: 'json' });
    if(response.statusCode==200) return response.body;
    else throw new Error("internal error")
}

azureMapCreatorHelper.prototype.listFeatureStateSets=async function(){    
    var queryURL=this.completeURL('featureStateSets?')
    const response = await got(queryURL, {responseType: 'json' });
    if(response.statusCode==200) return response.body;
    else throw new Error("internal error")
}

azureMapCreatorHelper.prototype.deleteTileset=async function(tilesetID){
    var commandURL=this.completeURL(`tilesets/${tilesetID}?`)
    const response = await got(commandURL,{"method":"DELETE",responseType: 'json'})
    console.log(response.statusCode)
    if(response.statusCode==204) return;
    else throw new Error("internal error:"+response.statusCode)
}

azureMapCreatorHelper.prototype.listTileset=async function(){    
    var queryURL=this.completeURL('tilesets?')
    const response = await got(queryURL, {responseType: 'json' });
    if(response.statusCode==200) return response.body;
    else throw new Error("internal error")
}

azureMapCreatorHelper.prototype.importDWGZip=async function(fileName){
    try{
        var uploadUDID= await this.uploadAndConvert(fileName)   //var uploadUDID="341df846-6c9c-c600-addf-a49e64bd4455"
        var convertID= await this.convertDWG(uploadUDID)      //var convertID="122ad2ae-723d-154b-1a26-85bed64248cc"
        var datasetId= await this.createDataSet(convertID)     //   var datasetId="e74249ed-ac42-10b6-d4f7-0f4d921e70e6"
        var tileSetId= await this.generateTileset(datasetId)  //   var tileSetId="bbd63ae1-f22c-7a26-6d6f-f3f8d53f3105"
        console.log("dataset ID:"+datasetId)
        console.log("tileset ID:"+tileSetId)
    }catch(e){
        console.log(e)
    }
}

azureMapCreatorHelper.prototype.uploadAndConvert=async function(fileName){
    var uploadURL=this.completeURL('mapData?dataFormat=zip&')
    const response = await got.post(uploadURL, {
      body: fs.createReadStream(fileName)
      ,headers: { "Content-Type": "application/octet-stream"}
    });
  
    var uploadUDID = await this.checkVerificationURL(response,"upload")
    return uploadUDID
}

azureMapCreatorHelper.prototype.convertDWG = async function (uploadUDID) {
    var uploadURL = this.completeURL('conversions?outputOntology=facility-2.0&udid=' + uploadUDID + "&")
    const response = await got.post(uploadURL, { json: {} });
    var resultID = await this.checkVerificationURL(response, "convertDWG")
    return resultID
}

azureMapCreatorHelper.prototype.createDataSet=async function(conversionID){
    var createDatasetURL=this.completeURL('datasets?conversionId='+conversionID+"&")
    const response = await got.post(createDatasetURL, { json: {} });
    var resultID = await this.checkVerificationURL(response,"createDataSet")
    return resultID
}

azureMapCreatorHelper.prototype.generateTileset=async function(datasetID){
    var generateTilesettURL=this.completeURL('tilesets?datasetId='+datasetID+"&")
    const response = await got.post(generateTilesettURL, { json: {} });
    var resultID = await this.checkVerificationURL(response,"generateTileset")
    return resultID
}

//IOT relevant feature: feature state set
azureMapCreatorHelper.prototype.createFeatureStateSet= async function(datasetID,stateSetJSON){
    var createStatesetURL=this.completeURL('featureStateSets?datasetId='+datasetID+"&")
    const response = await got.post(createStatesetURL, {json: stateSetJSON,responseType: 'json' });
    if(response.statusCode==200) return response.body.statesetId;
    else throw new Error("Fail to create feature state set")
}

azureMapCreatorHelper.prototype.completeURL=function(apiPart){
    return 'https://us.atlas.microsoft.com/'+apiPart+'api-version=2.0&subscription-key='+this.subscriptionKey
}

azureMapCreatorHelper.prototype.checkVerificationURL=function(response,descriptionStr){    
    return new Promise((resolve, reject) => {
        var verificationURL=response.headers["operation-location"]
        if(response.statusCode!=202) reject(new Error(descriptionStr+" failed!"))

        var repeatCounter = 0
        var intervaljob = setInterval(async () => {
            var response = await got(verificationURL + '&subscription-key=' + this.subscriptionKey)
            var responseObj = JSON.parse(response.body)
            console.log(descriptionStr + ":" + responseObj["status"])
            if (responseObj["status"] == "Succeeded") {
                clearInterval(intervaljob)
                //console.log(response.headers['resource-location'])
                //console.log(typeof(response.headers))
                var ResultUploadResourceLocation =response.headers['resource-location']
                var resultId = ResultUploadResourceLocation.split("/").slice(-1)[0].split("?")[0]
                resolve(resultId)
            } if (responseObj["status"] == "Failed") {
                
                console.log(JSON.stringify(responseObj.error.details))
                clearInterval(intervaljob)
                reject(new Error(descriptionStr + " failed!"))
            }
            repeatCounter++
            if (repeatCounter > 2500) {
                reject(new Error("Verify " + descriptionStr + " time out!"))
                clearInterval(intervaljob)
            }
        }, 2000)
    })
}

module.exports = new azureMapCreatorHelper();