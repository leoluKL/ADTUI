const simpleTree=require("./simpleTree")
const modelAnalyzer=require("./modelAnalyzer")

function twinsTree(DOM, searchDOM) {
    this.tree=new simpleTree(DOM)
    this.modelIDMapToName={}

    this.tree.callback_afterSelectNodes=(nodesArr)=>{
        var infoArr=[]
        nodesArr.forEach((item, index) =>{
            infoArr.push(item.leafInfo)
        });
        this.broadcastMessage({ "message": "selectNodes", info:infoArr})
    }

    this.tree.callback_afterDblclickNode=(theNode)=>{
        this.broadcastMessage({ "message": "PanToNode", info:theNode.leafInfo})
    }

    this.tree.callback_afterSelectGroupNode=(nodeInfo)=>{
        this.broadcastMessage({"message":"selectGroupNode",info:nodeInfo})
    }

    this.searchBox=$('<input type="text"/>').addClass("ui-corner-all");
    this.searchBox.css({"border":"solid 1px grey","height":"calc(100% - 4px)","width":"calc(100% - 7px)"})
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
    if(msgPayload.message=="ADTDatasourceChange") this.refreshContent(msgPayload.query, msgPayload.twins)
    else if(msgPayload.message=="drawTwinsAndRelations") this.drawTwinsAndRelations(msgPayload.info)
    else if(msgPayload.message=="ADTModelsChange") this.refreshModels(msgPayload.models)
    else if(msgPayload.message=="addNewTwin") this.drawOneTwin(msgPayload.twinInfo)
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

twinsTree.prototype.refreshContent=function(twinQueryStr,twinsData){
    var theTree= this.tree;
    theTree.removeAllNodes()
    for(var id in this.modelIDMapToName) delete this.modelIDMapToName[id]

    //query to get all models
    $.get("queryADT/listModels", (data, status) => {
        var tmpNameArr=[]
        var tmpNameToObj={}
        for(var i=0;i<data.length;i++){
            this.modelIDMapToName[data[i]["@id"]]=data[i]["displayName"]
            tmpNameArr.push(data[i]["displayName"])
            tmpNameToObj[data[i]["displayName"]]=data[i]
        }
        tmpNameArr.sort(function (a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()) });
        tmpNameArr.forEach(modelName=>{
            var newGroup=theTree.addGroupNode(tmpNameToObj[modelName])
            newGroup.shrink()
        })
        modelAnalyzer.clearAllModels();
        modelAnalyzer.addModels(data)
        modelAnalyzer.analyze();

        if(twinsData!=null) this.renderAllTwins(twinsData)
        else{
            $.post("queryADT/allTwinsInfo",{query:twinQueryStr}, (data)=> {
                this.renderAllTwins(data)
            })
        }
        
    })
}

twinsTree.prototype.drawTwinsAndRelations= function(data){
    data.forEach(oneSet=>{
        for(var ind in oneSet.childTwins){
            var oneTwin=oneSet.childTwins[ind]
            this.drawOneTwin(oneTwin)
        }
    })
}
twinsTree.prototype.drawOneTwin= function(twinInfo){
    var groupName=this.modelIDMapToName[twinInfo["$metadata"]["$model"]]
    this.tree.addLeafnodeToGroup(groupName,twinInfo,"skipRepeat")
}

twinsTree.prototype.renderAllTwins= function(data){
    var twinIDArr=[]
    this.broadcastMessage({ "message": "refreshAllTwin",info:data})
    for(var i=0;i<data.length;i++){
        var groupName=this.modelIDMapToName[data[i]["$metadata"]["$model"]]
        this.tree.addLeafnodeToGroup(groupName,data[i])
        twinIDArr.push(data[i]["$dtId"])
    }
    this.fetchAllRelationships(twinIDArr)
}

twinsTree.prototype.fetchAllRelationships= async function(twinIDArr){
    while(twinIDArr.length>0){
        var smallArr= twinIDArr.splice(0, 50);
        var data=await this.fetchPartialRelationships(smallArr)
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