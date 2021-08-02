const webpush = require('web-push');
const CosmosClient = require('@azure/cosmos').CosmosClient
var azureiotrocksDBClient =null;
if(!azureiotrocksDBClient) azureiotrocksDBClient=new CosmosClient(process.env.azureiotrockscosmosdb)

const { DigitalTwinsClient } = require("@azure/digital-twins-core");
const { DefaultAzureCredential} = require("@azure/identity");
var azureiotrocksADTClient=null;
if(!azureiotrocksADTClient) azureiotrocksADTClient=new DigitalTwinsClient(process.env.ADTEndpoint, new DefaultAzureCredential())

module.exports = async function (context, IoTHubMessages) {
    webpush.setVapidDetails('mailto:leolu@microsoft.com', process.env.SERVICEWORKER_PUBLIC_VAPID_KEY, process.env.SERVICEWORKER_PRIVATE_VAPID_KEY);

    for(var index=0;index<IoTHubMessages.length;index++){
        var message=IoTHubMessages[index]
        if (!context.bindingData.systemPropertiesArray)  continue;

        var devID = context.bindingData.systemPropertiesArray[index]["iothub-connection-device-id"]
        var eventType=context.bindingData.systemPropertiesArray[index]["iothub-message-source"]
        context.log(eventType)
        if(eventType=="deviceConnectionStateEvents"){
            var allProperties=context.bindingData.propertiesArray[index]
            var opType=allProperties["opType"]
            context.log("connection state:"+opType) 
            var projectID=allProperties["project"]
            var modelID=allProperties["modelID"]
            var opTimestamp=allProperties["operationTimestamp"]
            var queryStr = `SELECT * FROM c where c.projectID='${projectID}'` // and c.${patitionKey}='${patitionKeyValue}'
            const { resources: queryResults } = await azureiotrocksDBClient.database(process.env.azureiotrockscosmosDBName).container('serverPushInfo').items.query(queryStr).fetchAll()
            for (var j = 0; j < queryResults.length; j++) {
                var oneServiceWorkerSub = queryResults[j].serviceWorkerSubscription
                const payload = JSON.stringify({ "twinID": devID, "projectID": projectID, "connectionState": opType, "time": opTimestamp });
                webpush.sendNotification(oneServiceWorkerSub, payload).catch(error => {
                    context.error(error.stack);
                });
            }
            //change cosmosDB device last connection state timestamp
            var queryStr=`SELECT * FROM c where c.id='${devID}' and c.projectID='${projectID}'`
            const { resources: twinResults } = await azureiotrocksDBClient.database(process.env.azureiotrockscosmosDBName).container('dtproject').items.query(queryStr).fetchAll()
            if(twinResults.length>0){
                var theTwinDoc=twinResults[0]
                theTwinDoc.connectStateUpdateTime=opTimestamp
                if(opType=="deviceConnected") theTwinDoc.connectState=true
                else theTwinDoc.connectState=false
                await azureiotrocksDBClient.database(process.env.azureiotrockscosmosDBName).container('dtproject').items.upsert(theTwinDoc)
            }
        }

        if(eventType=="Telemetry"){
            var allProperties=context.bindingData.propertiesArray[index]
            var projectID=allProperties["project"]
            var modelID=allProperties["modelID"]
            //query modelInfo from cosmosDB and get information of its telemetryProperties, then fetch from message and set ADT twin property
            var queryStr=`SELECT * FROM c where c.id='${modelID}' and c.projectID='${projectID}'`
            const { resources: modelResults } = await azureiotrocksDBClient.database(process.env.azureiotrockscosmosDBName).container('dtproject').items.query(queryStr).fetchAll()
            if(modelResults.length>0){
                var modelInfo=modelResults[0]
                for(var j=0;j<modelInfo.telemetryProperties.length;j++){
                    var thePath=modelInfo.telemetryProperties[j].path
                    var theValue=getValueFromJson(message,thePath)
                    if(theValue==null) continue
                    var patchADT=getADTPatchFromPath(thePath,theValue)
                    try{
                        await azureiotrocksADTClient.updateDigitalTwin(devID, patchADT)
                    }catch(e){
                        //if there is error, it is possibly because of the patch path does not exist in twin
                        //in this case, query the twin info out, and rebuild the patch
                        var twinInfo=await azureiotrocksADTClient.getDigitalTwin(devID)
                        var currentRootInfo={}
                        for(var ind in twinInfo.body){
                            if(ind=='$dtId'||ind=='$etag'||ind=='$metadata') continue
                            currentRootInfo[ind]=twinInfo.body[ind]
                        }
                        patchADT=getADTPatchFromPath(thePath,theValue,currentRootInfo)
                        await azureiotrocksADTClient.updateDigitalTwin(devID, patchADT)
                    }

                }
                
            }
        }
        
    }

    context.done();
};

function getADTPatchFromPath(path,newVal,fullRootInfo){
    var jsonPatch
    if (fullRootInfo==null || path.length == 1) {
        var str = "/"+path.join("/")
        jsonPatch = [{ "op": "add", "path": str, "value": newVal }]
    }else{
        var rootProperty = path[0]
        var patchValue = fullRootInfo[rootProperty]
        if (patchValue == null) patchValue = {}
        updateOriginObjectValue(patchValue, path.slice(1), newVal)
        var jsonPatch = [{ "op": "add", "path": "/" + rootProperty, "value": patchValue }]
    }
    return jsonPatch
}

function updateOriginObjectValue(nodeInfo, pathArr, newVal) {
    if (pathArr.length == 0) return;
    var theJson = nodeInfo
    for (var i = 0; i < pathArr.length; i++) {
        var key = pathArr[i]

        if (i == pathArr.length - 1) {
            theJson[key] = newVal
            break
        }
        if (theJson[key] == null) theJson[key] = {}
        theJson = theJson[key]
    }
}


function getValueFromJson(message,path){
    if(path.length==0) return null;
    var jsonObj=message
    for(var i=0;i<path.length;i++){
        var pathEle=path[i]
        if(jsonObj[pathEle]==null) return null
        jsonObj=jsonObj[pathEle]
    }
    return jsonObj;
}