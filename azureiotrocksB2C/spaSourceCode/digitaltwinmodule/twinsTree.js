const simpleTree=require("./simpleTree")
const modelAnalyzer=require("./modelAnalyzer")
const msalHelper = require("../msalHelper")
const globalCache = require("./globalCache")

function twinsTree(DOM, searchDOM) {
    this.tree=new simpleTree(DOM)

    this.tree.callback_afterSelectNodes=(nodesArr,mouseClickDetail)=>{
        var infoArr=[]
        nodesArr.forEach((item, index) =>{
            infoArr.push(item.leafInfo)
        });
        this.broadcastMessage({ "message": "selectNodes", info:infoArr, "mouseClickDetail":mouseClickDetail})
    }

    this.tree.callback_afterDblclickNode=(theNode)=>{
        this.broadcastMessage({ "message": "PanToNode", info:theNode.leafInfo})
    }

    this.tree.callback_afterSelectGroupNode=(nodeInfo)=>{
        this.broadcastMessage({"message":"selectGroupNode",info:nodeInfo})
    }

    this.searchBox=$('<input type="text"  placeholder="search..."/>').addClass("w3-input");
    this.searchBox.css({"outline":"none","height":"100%","width":"100%"}) 
    searchDOM.append(this.searchBox)

    this.searchBox.keyup((e)=>{
        if(e.keyCode == 13)
        {
            var aNode = this.tree.searchText($(e.target).val())
            if(aNode!=null){
                aNode.parentGroupNode.expand()
                this.tree.selectLeafNode(aNode)
                this.tree.scrollToLeafNode(aNode)
            }
        }
    });
}

twinsTree.prototype.rxMessage=function(msgPayload){
    if(msgPayload.message=="startSelection_replace") this.loadStartSelection(msgPayload.twinIDs,msgPayload.modelIDs,"replace")
    else if(msgPayload.message=="startSelection_append") this.loadStartSelection(msgPayload.twinIDs,msgPayload.modelIDs,"append")
    else if(msgPayload.message=="drawTwinsAndRelations") this.drawTwinsAndRelations(msgPayload.info)
    else if(msgPayload.message=="ADTModelsChange") this.refreshModels(msgPayload.models)
    else if(msgPayload.message=="addNewTwin") this.drawOneTwin(msgPayload.twinInfo)
    else if(msgPayload.message=="addNewTwins") {
        msgPayload.twinsInfo.forEach(oneTwinInfo=>{this.drawOneTwin(oneTwinInfo)})
    }
    else if(msgPayload.message=="twinsDeleted") this.deleteTwins(msgPayload.twinIDArr)
}

twinsTree.prototype.deleteTwins=function(twinIDArr){
    twinIDArr.forEach(twinID=>{
        this.tree.deleteLeafNode(twinID)
    })
}

twinsTree.prototype.refreshModels=function(modelsData){
    //delete all group nodes of deleted models
    this.tree.groupNodes.forEach((gnode)=>{
        if(modelsData[gnode.name]==null){
            //delete this group node
            gnode.deleteSelf()
        }
    })

    //then add all group nodes that to be added
    var currentModelNameArr=[]
    this.tree.groupNodes.forEach((gnode)=>{currentModelNameArr.push(gnode.name)})

    var actualModelNameArr=[]
    for(var ind in modelsData) actualModelNameArr.push(ind)
    actualModelNameArr.sort(function (a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()) });

    for(var i=0;i<actualModelNameArr.length;i++){
        if(i<currentModelNameArr.length && currentModelNameArr[i]==actualModelNameArr[i]) continue
        //otherwise add this group to the tree
        var newGroup=this.tree.insertGroupNode(modelsData[actualModelNameArr[i]],i)
        newGroup.shrink()
        currentModelNameArr.splice(i, 0, actualModelNameArr[i]);
    }
}


twinsTree.prototype.loadStartSelection=async function(twinIDs,modelIDs,replaceOrAppend){
    if(replaceOrAppend=="replace") this.tree.clearAllLeafNodes()

    //list all models, add model to twintree group node if it is not there, or remove deleted models
    try {
        var data = await msalHelper.callAPI("digitaltwin/listModelsForIDs", "POST", modelIDs)
        var tmpNameToObj = {}
        for (var i = 0; i < data.length; i++) {
            if (data[i]["displayName"] == null) data[i]["displayName"] = data[i]["@id"]
            if ($.isPlainObject(data[i]["displayName"])) {
                if (data[i]["displayName"]["en"]) data[i]["displayName"] = data[i]["displayName"]["en"]
                else data[i]["displayName"] = JSON.stringify(data[i]["displayName"])
            }
            if (tmpNameToObj[data[i]["displayName"]] != null) {
                //repeated model display name
                data[i]["displayName"] = data[i]["@id"]
            }
            tmpNameToObj[data[i]["displayName"]] = data[i]
        }
        this.refreshModels(tmpNameToObj)

        modelAnalyzer.clearAllModels();
        modelAnalyzer.addModels(data)
        modelAnalyzer.analyze();
    } catch (e) {
        alert(e.responseText)
    }
    
    //add new twins under the model group node
    try{
        var twinsdata = await msalHelper.callAPI("digitaltwin/listTwinsForIDs", "POST", twinIDs)
        var twinIDArr = []
        //check if any current leaf node does not have stored outbound relationship data yet
        this.tree.groupNodes.forEach((gNode) => {
            gNode.childLeafNodes.forEach(leafNode => {
                var nodeId = leafNode.leafInfo["$dtId"]
                if (globalCache.storedOutboundRelationships[nodeId] == null) twinIDArr.push(nodeId)
            })
        })

        for (var i = 0; i < twinsdata.length; i++) {
            twinsdata[i]["displayName"]= globalCache.twinIDMapToDisplayName[twinsdata[i]["$dtId"]]
            var groupName = globalCache.modelIDMapToName[twinsdata[i]["$metadata"]["$model"]]
            this.tree.addLeafnodeToGroup(groupName, twinsdata[i], "skipRepeat")
            twinIDArr.push(twinsdata[i]["$dtId"])
        }
        if(replaceOrAppend=="replace") this.broadcastMessage({ "message": "replaceAllTwins", info: twinsdata })
        else this.broadcastMessage({ "message": "appendAllTwins", info: twinsdata })
        //TODO:continue fetch relationships of twins
        //this.fetchAllRelationships(twinIDArr)
    } catch (e) {
        console.log(e)
        alert(e.responseText)
    }
}



twinsTree.prototype.drawTwinsAndRelations= function(data){
    data.childTwinsAndRelations.forEach(oneSet=>{
        for(var ind in oneSet.childTwins){
            var oneTwin=oneSet.childTwins[ind]
            this.drawOneTwin(oneTwin)
        }
    })
    
    //draw those known twins from the relationships
    var twinsInfo={}
    data.childTwinsAndRelations.forEach(oneSet=>{
        var relationsInfo=oneSet["relationships"]
        relationsInfo.forEach((oneRelation)=>{
            var srcID=oneRelation['$sourceId']
            var targetID=oneRelation['$targetId']
            if(globalCache.storedTwins[srcID])
                twinsInfo[srcID] = globalCache.storedTwins[srcID]
            if(globalCache.storedTwins[targetID])
                twinsInfo[targetID] = globalCache.storedTwins[targetID]    
        })
    })
    var tmpArr=[]
    for(var twinID in twinsInfo) tmpArr.push(twinsInfo[twinID])
    tmpArr.forEach(oneTwin=>{this.drawOneTwin(oneTwin)})
}

twinsTree.prototype.drawOneTwin= function(twinInfo){
    var groupName=globalCache.modelIDMapToName[twinInfo["$metadata"]["$model"]]
    this.tree.addLeafnodeToGroup(groupName,twinInfo,"skipRepeat")
}

twinsTree.prototype.fetchAllRelationships= async function(twinIDArr){
    while(twinIDArr.length>0){
        var smallArr= twinIDArr.splice(0, 100);
        var data=await this.fetchPartialRelationships(smallArr)
        if(data=="") continue;
        globalCache.storeTwinRelationships(data) //store them in global available array
        this.broadcastMessage({ "message": "drawAllRelations",info:data})
    }
}

twinsTree.prototype.fetchPartialRelationships= async function(IDArr){
    return new Promise((resolve, reject) => {
        try{
            $.post("queryADT/allRelationships",{arr:IDArr}, function (data) {
                resolve(data)
            });
        }catch(e){
            reject(e)
        }
    })
}

module.exports = twinsTree;