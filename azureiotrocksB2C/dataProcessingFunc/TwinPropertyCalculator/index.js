const webpush = require('web-push');
const CosmosClient = require('@azure/cosmos').CosmosClient
var azureiotrocksDBClient =null;
if(!azureiotrocksDBClient) azureiotrocksDBClient=new CosmosClient(process.env.azureiotrockscosmosdb)
const { DigitalTwinsClient } = require("@azure/digital-twins-core");
const { DefaultAzureCredential} = require("@azure/identity");
var azureiotrocksADTClient=null;
if(!azureiotrocksADTClient) azureiotrocksADTClient=new DigitalTwinsClient(process.env.ADTEndpoint, new DefaultAzureCredential())

module.exports = async function (context, eventHubMessages) {
    webpush.setVapidDetails('mailto:leolu@microsoft.com', process.env.SERVICEWORKER_PUBLIC_VAPID_KEY, process.env.SERVICEWORKER_PRIVATE_VAPID_KEY);
    var docsArr=[]
    for(var index=0;index<eventHubMessages.length;index++){
        //console.log("----Start of event processing-----")
        var message=eventHubMessages[index]
        if(!message["patch"]) continue;
        var eventSubject=context.bindingData.propertiesArray[index]["cloudEvents:subject"]
        var eventTime=context.bindingData.propertiesArray[index]["cloudEvents:time"]
        
        
        for(var j=0;j<message["patch"].length;j++){
            var onePatch=message["patch"][j]
            var newDoc={}
            newDoc["twinID"]=eventSubject
            newDoc["time"]=eventTime
            newDoc["type"]="property"
            newDoc["path"]=onePatch["path"]
            newDoc["value"]=onePatch["value"]
            docsArr.push(newDoc)
            //console.log("observe:"+eventSubject+" change "+onePatch["path"]+" to value "+onePatch["value"])
            var thePath=onePatch["path"].split("/")
            if(thePath[0]=="") thePath.shift()
            liveMonitorValueChange(newDoc["twinID"],thePath,newDoc["value"],eventTime)
            propagateOneValuePatch(newDoc["twinID"],thePath,newDoc["value"])
        }
    }
    
    context.bindings.outputDocToCosmosDB = JSON.stringify(docsArr);
    context.done();
};

async function liveMonitorValueChange(twinID,propertyPath,newValue,eventTime){
    console.log("webpush:"+twinID+"."+propertyPath.join(".")+" value "+newValue)
    //query container 'serverPushInfo', if there is record with this twinID(pID) and propertyPath, push value infomartion to it
    var propertyPath=propertyPath.join(".")
    var allRecords=await queryDB('serverPushInfo',`select * from c where c.pID='${twinID}' and c.propertyPath='${propertyPath}'`)
    const payload = JSON.stringify({ "twinID": twinID,  "propertyPath": propertyPath, "value":newValue, "time": eventTime });
    allRecords.forEach((oneRecord)=>{
        webpush.sendNotification(oneRecord.serviceWorkerSubscription, payload).catch(error => {});
    })
}

async function propagateOneValuePatch(triggerTwinID,triggerPropertyPath,triggerPropertyValue){
    var twinsToBeRecalculate=await getInfluencedTwins(triggerTwinID,triggerPropertyPath,triggerPropertyValue)
    twinsToBeRecalculate.forEach(oneTargetTwin=>{
        recalculateTwin(oneTargetTwin)
    })
}

async function recalculateTwin(twinID) {
    //console.log("recalculate "+twinID)
    //query all inputs value and scripts, do eval
    var allRecords=await queryDB('twincalculation',`select * from c where c.twinID='${twinID}'`)
    var formulaScript=null;
    var emptySelfValue=null;
    var _twinVal={}

    for(var i=0;i<allRecords.length;i++){
        var oneRecourd=allRecords[i]
        if(oneRecourd.type=="formula"){
            formulaScript=oneRecourd.actualScript
            emptySelfValue=oneRecourd.baseValueTemplate
            break;
        }
    }
    _twinVal[twinID]=emptySelfValue
    for(var i=0;i<allRecords.length;i++){
        var oneRecourd=allRecords[i]
        if(oneRecourd.type=="value"){
            var path=oneRecourd.path
            var value=oneRecourd.value
            var properTwinID=oneRecourd.id.split('.')[0]
            _twinVal[properTwinID]=createOjb(_twinVal[properTwinID],path,value)
        }
    }

    var evalStr=formulaScript+"\n_twinVal"
    var result=eval(evalStr) // jshint ignore:line
    
    //find out the change in self twin
    var selfValue=_twinVal[twinID]
    var startPath=[]
    var allPatches=[]
    generateAllADTPatches(selfValue,startPath,allPatches,twinID)

    for(var i=0;i<allPatches.length;i++){
        var onePatch=allPatches[i]
        //console.log("generate a patch:"+JSON.stringify(onePatch))
        var patchADT=getADTPatchFromPath(onePatch.path,onePatch.value)
        try{
            await azureiotrocksADTClient.updateDigitalTwin(onePatch.twinID, patchADT)
        }catch(e){
            //if there is error, it is possibly because of the patch path does not exist in twin
            //in this case, query the twin info out, and rebuild the patch
            var twinInfo=await azureiotrocksADTClient.getDigitalTwin(onePatch.twinID)
            var currentRootInfo={}
            for(var ind in twinInfo.body){
                if(ind=='$dtId'||ind=='$etag'||ind=='$metadata') continue
                currentRootInfo[ind]=twinInfo.body[ind]
            }
            patchADT=getADTPatchFromPath(onePatch.path,onePatch.value,currentRootInfo)
            await azureiotrocksADTClient.updateDigitalTwin(onePatch.twinID, patchADT)
        }
    }
}

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

function generateAllADTPatches(valueObj,pathArr,allPatches,twinID){
    for(var ind in valueObj){
        var newPath=pathArr.concat([ind])
        if(typeof(valueObj[ind])==="object"){
            generateAllADTPatches(valueObj[ind],newPath,allPatches,twinID)
        }else{
            allPatches.push({
                "twinID":twinID,
                "path":newPath,
                "value":valueObj[ind]
            })
        }
    }
}


function createOjb(originalObj,path,value){
    originalObj=originalObj||{}
    var rootObj=originalObj
    for(var i=0;i<path.length-1;i++){
        rootObj[path[i]]={}
        rootObj=rootObj[path[i]]
    } 
    rootObj[path[path.length-1]]=value
    return originalObj
}

async function getInfluencedTwins(twinID,changingProperty,newValue){
    //look for any twins that might be influenced by this twin
    var targetTwins=await queryDB('twincalculation',`select c.id from c where c.type='influence' and c.twinID='${twinID}'`)
    
    //check if there is "value" type record in those targettwins patition, that means this property change should really trigger the change in the target twins
    var trulyInfluencedTwins=[]
    var valueRecordID=twinID+"."+changingProperty.join(".")

    for(var i=0;i<targetTwins.length;i++){
        var aTarget=targetTwins[i]
        var theTargetID= aTarget.id
        var oldValueRecord=await queryDB('twincalculation',`select * from c where c.type='value' and c.twinID='${theTargetID}' and c.id='${valueRecordID}'`)
        if(oldValueRecord.length==0) continue;
        trulyInfluencedTwins.push(theTargetID)
        //also write this new value into database
        var newValueDoc=oldValueRecord[0] //should only exist not more than 1 record
        newValueDoc.value=newValue
        await insertRecord('twincalculation',newValueDoc)
    }
    return trulyInfluencedTwins
}

async function queryDB(containerID, queryStr) {
    try {
        const { resources: queryResults } = await azureiotrocksDBClient.database(process.env.azureiotrockscosmosDBName).container(containerID).items.query(queryStr).fetchAll()
        return queryResults;
    } catch (e) {
        throw e;
    }
}

async function insertRecord(containerID,docObj){ //using upsert so it is both update and create-if-not-exist
    try{
        const { item } = await azureiotrocksDBClient.database(process.env.azureiotrockscosmosDBName).container(containerID).items.upsert(docObj)
        return docObj;
    }catch(e){
        throw e;
    }
}

async function insertRecords(containerID,docsArr){
    try{
        var promiseArr=[]
        docsArr.forEach(oneDoc=>{
            promiseArr.push(insertRecord(containerID,oneDoc))
        })
        var results=await Promise.allSettled(promiseArr);
    }catch(e){
        throw e;
    }
}