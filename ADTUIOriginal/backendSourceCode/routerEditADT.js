const express = require("express");

function routerEditADT(adtClients){
    this.adtClients=adtClients;    
    this.router = express.Router();

    this.useRoute("changeAttribute","isPost")
    this.useRoute("importModels","isPost")
    this.useRoute("deleteModel","isPost")
    this.useRoute("upsertDigitalTwin","isPost")
    this.useRoute("batchImportTwins","isPost")
    this.useRoute("deleteTwins","isPost")
    this.useRoute("createRelations","isPost")
    this.useRoute("deleteRelations","isPost")
}


routerEditADT.prototype.deleteRelations =async function(adtClient,req,res) {
    var relations=req.body.relations;
    var promiseArr=[]
    relations.forEach(oneAction=>{
        promiseArr.push(adtClient.deleteRelationship(oneAction["srcID"],oneAction["relID"]))
    })

    var results=await Promise.allSettled(promiseArr);
    var succeedList=[]
    results.forEach((oneSet,index)=>{
        if(oneSet.status=="fulfilled") {
            succeedList.push(relations[index]) 
        }
    })
    res.send(succeedList)
}

routerEditADT.prototype.createRelations =async function(adtClient,req,res) {
    var actions=JSON.parse(req.body.actions);
    var promiseArr=[]
    actions.forEach(oneAction=>{
        promiseArr.push(adtClient.upsertRelationship(oneAction["$srcId"],oneAction["$relationshipId"],oneAction["obj"]))
    })

    var results=await Promise.allSettled(promiseArr);
    var succeedList=[]
    results.forEach((oneSet,index)=>{
        if(oneSet.status=="fulfilled") {
            //console.log(JSON.stringify(oneSet,null,2))
            succeedList.push(oneSet.value.body) 
        }
    })
    //console.log(results)
    res.send(succeedList)
}

routerEditADT.prototype.deleteTwins =async function(adtClient,req,res) {
    var twinIDArr=req.body.arr;
    var promiseArr=[]

    for(var i=0;i<twinIDArr.length;i++){
        var twinID = twinIDArr[i];
        promiseArr.push(this.deleteOneTwin(adtClient,twinID))
    }
    var results=await Promise.allSettled(promiseArr);
    var succeedList=[]
    results.forEach((oneSet,index)=>{
        if(oneSet.status=="fulfilled") succeedList.push(twinIDArr[index]) 
    })
    res.send(succeedList)
}


routerEditADT.prototype.deleteOneTwin =async function(adtClient,twinID) {
    var relationships = await adtClient.listRelationships(twinID)
    var incomingRelationship=await adtClient.listIncomingRelationships(twinID)
    var promiseArr=[]
    for await (let page of relationships.byPage({ maxPageSize: 1000 })) { //should be only one page
        page.value.forEach((oneRel) => {
            promiseArr.push(adtClient.deleteRelationship(oneRel["$sourceId"],oneRel["$relationshipId"]))
        })
    }
    for await (let page of incomingRelationship.byPage({ maxPageSize: 1000 })) { //should be only one page
        page.value.forEach((oneRel) => {
            promiseArr.push(adtClient.deleteRelationship(oneRel["sourceId"],oneRel["relationshipId"]))
        })
    }
    await Promise.allSettled(promiseArr);
    var result=adtClient.deleteDigitalTwin(twinID)
    return result;
}

routerEditADT.prototype.useRoute=function(routeStr,isPost){
    this.router[(isPost)?"post":"get"]("/"+routeStr,(req,res)=>{
        var adtURL=req.header("adtInstance")
        if(!adtURL) res.end()
        var adtClient = this.adtClients[adtURL]
        if (!adtClient) res.end()
        this[routeStr](adtClient,req,res)
    })
}

routerEditADT.prototype.batchImportTwins = async function (adtClient, req, res) {
    var promiseArr=[]
    var twins=JSON.parse(req.body.twins);
    var idArr=[]
    twins.forEach(oneTwin=>{
        idArr.push(oneTwin['$dtId'])
        promiseArr.push(adtClient.upsertDigitalTwin(oneTwin['$dtId'], JSON.stringify(oneTwin)))
    })
    var results=await Promise.allSettled(promiseArr);

    var succeedList=[]
    results.forEach((oneSet,index)=>{
        if(oneSet.status=="fulfilled") {
            //console.log(JSON.stringify(oneSet,null,2))
            succeedList.push(oneSet.value.body) 
        }
    })
    res.send(succeedList)
}

routerEditADT.prototype.upsertDigitalTwin = async function (adtClient, req, res) {
    var newTwin = req.body.newTwinJson;
    try{
        var obj=JSON.parse(newTwin)
        var twinID=obj['$dtId']
        var re = await adtClient.upsertDigitalTwin(twinID, newTwin)
        res.statusCode = 200;
        res.end()
    }catch(e){
        res.statusCode = 200;
        if(e.details && e.details.error && e.details.error.details) res.send(JSON.stringify(e.details.error.details))
        else res.send(e.message)
    }
    
    res.end()
}

routerEditADT.prototype.importModels =async function(adtClient,req,res) {
    var models=JSON.parse(req.body.models);
    try{
        re = await adtClient.createModels(models)
        res.end()
    }catch(e){
        res.statusCode = 200;
        res.send(e.message)
    }
}

routerEditADT.prototype.deleteModel =async function(adtClient,req,res) {
    var model=req.body.model;
    try{
        re = await adtClient.deleteModel(model)
        res.end()
    }catch(e){
        res.statusCode = 200;
        res.send(e.message)
    }
}

routerEditADT.prototype.changeAttribute =async function(adtClient,req,res) {
    var jsonPatch = req.body.jsonPatch; 
    var twinID= req.body.twinID; 
    var relationshipID = req.body.relationshipID;

    try{
        jsonPatch=JSON.parse(jsonPatch)
        if(relationshipID==null){
            var re = await adtClient.updateDigitalTwin(twinID, jsonPatch)
        }else{
            var re = await adtClient.updateRelationship(twinID,relationshipID,jsonPatch)
        }
        
        res.statusCode = 200;
        res.end()
    }catch(e){
        res.statusCode = 200;
        res.send(e.message)
    }
}


module.exports = (adtClients) => { return (new routerEditADT(adtClients)).router }

