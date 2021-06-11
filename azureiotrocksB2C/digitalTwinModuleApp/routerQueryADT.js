const express = require("express");
const adtHelper=require("./adtHelper")

function routerQueryADT(){
    this.router = express.Router();
    this.useRoute("listModelsForIDs","post")
    this.useRoute("listTwinsForIDs","post")
    this.useRoute("getRelationshipsFromTwinIDs","post")
    this.useRoute("queryOutBound","post")
}

routerQueryADT.prototype.useRoute=function(routeStr,isPost){
    this.router[(isPost)?"post":"get"]("/"+routeStr,(req,res)=>{
        this[routeStr](req,res)
    })
}

routerQueryADT.prototype.queryOutBound = async function (req, res) {
    var twinIDArr = req.body.arr;
    var knownTargetTwins = req.body.knownTargets;
    var childTwinsAndRelationsArr = []
    var promiseArr = [];
    for (var i = 0; i < twinIDArr.length; i++) {
        var twinID = twinIDArr[i];
        promiseArr.push(this.querySingleOutBound(twinID, knownTargetTwins))
    }

    var newTwins = {}
    try{
        var results = await Promise.all(promiseArr);
        results.forEach(oneSet => {
            childTwinsAndRelationsArr.push(oneSet)
            for (var twinID in oneSet.childTwins) newTwins[twinID] = 1
        })
    }catch(e){
        res.status(400).send(e.message);
        return;
    }

    //for new twins, query their relationships that will be also stored in client browser app
    var promiseArr = []
    var newTwinRelations = []
    for (var twinID in newTwins) { promiseArr.push(this.querySingleTwinRelations(twinID)) }

    try{
        var results = await Promise.all(promiseArr);
    }catch(e){
        res.status(400).send(e.message);
        return;
    }
    
    results.forEach(oneSet => {
        newTwinRelations = newTwinRelations.concat(oneSet)
    })

    var reInfo = { "childTwinsAndRelations": childTwinsAndRelationsArr, "newTwinRelations": newTwinRelations }

    res.send(reInfo)
}

routerQueryADT.prototype.querySingleOutBound = async function (twinID,knownTargetTwins) {
    try {
        var oneSet = { childTwins: {}, relationships: [] }
        var relationships = await adtHelper.ADTClient.listRelationships(twinID)
        //console.log(Date.now() + " to get all relation")
        var promiseArr = []
        for await (let page of relationships.byPage({ maxPageSize: 1000 })) { //should be only one page
            page.value.forEach((oneRel) => {
                if (knownTargetTwins[oneRel["$targetId"]] == null) {
                    promiseArr.push(adtHelper.ADTClient.getDigitalTwin(oneRel["$targetId"]))
                }
            })
            oneSet.relationships = oneSet.relationships.concat(page.value)
        }
        var results = await Promise.all(promiseArr);
        results.forEach(oneTarget => {
            oneSet.childTwins[oneTarget['body']['$dtId']] = oneTarget['body']
        })
        //console.log(Date.now() + " get all target twins")
        return oneSet;
    } catch (e) {
        throw e;
    }
}

routerQueryADT.prototype.querySingleTwinRelations = async function (twinID) {
    try{
        var oneSet = []
        var relationships = await adtHelper.ADTClient.listRelationships(twinID)
        for await (let page of relationships.byPage({ maxPageSize: 1000 })) { //it is strange that i must set maxPagesize as 1 to only have one page
            oneSet=oneSet.concat(page.value)
        }
        return oneSet;
    }catch(e){
        throw e;
    }
}

routerQueryADT.prototype.listModelsForIDs =async function(req,res) {
    try{
        var IDArr=req.body;
        var promiseArr=[]
        IDArr.forEach(oneID=>{
            promiseArr.push(adtHelper.ADTClient.getModel(oneID, true))
        })
        var results=await Promise.allSettled(promiseArr);
        var resArr=[]
        results.forEach(oneResult=>{
            if(oneResult["status"]=="fulfilled") resArr.push(oneResult.value.model)
        })

        res.send(resArr)
    }catch(e){
        res.status(400).send(e.message);
    }
}

routerQueryADT.prototype.listTwinsForIDs =async function(req,res) {
    try{
        var IDArr=req.body;
        var promiseArr=[]
        IDArr.forEach(oneID=>{
            promiseArr.push(adtHelper.ADTClient.getDigitalTwin(oneID))
        })
        var results=await Promise.allSettled(promiseArr);
        
        var resArr=[]
        results.forEach(oneResult=>{
            if(oneResult["status"]=="fulfilled") resArr.push(oneResult.value.body)
        })

        res.send(resArr)
    }catch(e){
        res.status(400).send(e.message);
    }
}

routerQueryADT.prototype.getRelationshipsFromTwinIDs =async function(req,res) {
    try{
        var twinIDArr=req.body;
        var reArr=[]
        var promiseArr=[]
    
        for(var i=0;i<twinIDArr.length;i++){
            var twinID = twinIDArr[i];
            promiseArr.push(this.querySingleTwinRelations(twinID))
        }
        var results=await Promise.all(promiseArr);
        results.forEach(oneSet=>{
            reArr=reArr.concat(oneSet)
        })
    
        res.send(reArr)
    }catch(e){
        res.status(400).send(e.message);
    }
    
}

routerQueryADT.prototype.querySingleTwinRelations = async function (twinID) {
    var oneSet = []
    var relationships = await adtHelper.ADTClient.listRelationships(twinID)
    try{
        for await (let page of relationships.byPage({ maxPageSize: 1000 })) { //it is strange that i must set maxPagesize as 1 to only have one page
            oneSet=oneSet.concat(page.value)
        }
        return oneSet;
    }catch(e){
        throw e;
    }
}



module.exports = new routerQueryADT().router