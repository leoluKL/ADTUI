const msalHelper = require("../msalHelper")
const globalCache = require("../sharedSourceFiles/globalCache")
const singleModelTwinsList=require("./singleModelTwinsList")


function twinsList(DOM) {
    this.DOM=DOM
    this.singleModelTwinsListSet={}
}

twinsList.prototype.refill=function(){
    this.DOM.empty()
    for(var ind in this.singleModelTwinsListSet) delete this.singleModelTwinsListSet[ind]
    globalCache.DBModelsArr.forEach(oneModel=>{
        this.singleModelTwinsListSet[oneModel.id]=new singleModelTwinsList(oneModel,this,this.DOM)
    })
}

twinsList.prototype.rxMessage=function(msgPayload){
    if(msgPayload.message=="visualDefinitionChange"){
        if(msgPayload.modelID) this.singleModelTwinsListSet[msgPayload.modelID].refreshTwinsIcon()
    }
}

module.exports = twinsList;