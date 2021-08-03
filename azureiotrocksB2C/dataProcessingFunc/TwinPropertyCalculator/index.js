module.exports = async function (context, eventHubMessages) {
    var docsArr=[]
    for(var index=0;index<eventHubMessages.length;index++){
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
        }
    }
    context.bindings.outputDocToCosmosDB = JSON.stringify(docsArr);
    context.done();
};