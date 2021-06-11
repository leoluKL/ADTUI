const express = require("express");
const adtHelper=require("./adtHelper")

function routerQueryADT(){
    this.router = express.Router();
    this.useRoute("listModelsForIDs","post")
    this.useRoute("listTwinsForIDs","post")
    this.useRoute("getRelationshipsFromTwinIDs","post")
    this.useRoute("queryOutBound","post")
    this.useRoute("queryInBound","post")
}

routerQueryADT.prototype.useRoute=function(routeStr,isPost){
    this.router[(isPost)?"post":"get"]("/"+routeStr,(req,res)=>{
        this[routeStr](req,res)
    })
}

routerQueryADT.prototype.queryInBound = async function (req, res) {
    var twinIDArr=req.body.arr;
    var knownSourceTwins= req.body.knownSources;
    var childTwinsAndRelationsArr=[]
    var promiseArr=[];
    for(var i=0;i<twinIDArr.length;i++){
        var twinID = twinIDArr[i];
        promiseArr.push(this.querySingleInBound(twinID,knownSourceTwins))
    }

    var newTwins={}
    try{
        var results=await Promise.allSettled(promiseArr);
        results.forEach(oneSet=>{
            if(oneSet["status"]!="fulfilled") return;
            oneSet=oneSet.value;
            childTwinsAndRelationsArr.push(oneSet)
            for(var twinID in oneSet.childTwins) newTwins[twinID]=1
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
        var results = await Promise.allSettled(promiseArr);
    }catch(e){
        res.status(400).send(e.message);
        return;
    }
    results.forEach(oneSet => {
        if(oneSet["status"]!="fulfilled") return;
        oneSet=oneSet.value;
        newTwinRelations = newTwinRelations.concat(oneSet)
    })
    var reInfo={"childTwinsAndRelations":childTwinsAndRelationsArr,"newTwinRelations":newTwinRelations}

    res.send(reInfo)
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
        var results = await Promise.allSettled(promiseArr);
        results.forEach(oneSet => {
            if(oneSet["status"]!="fulfilled") return;
            oneSet=oneSet.value;
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
        var results = await Promise.allSettled(promiseArr);
    }catch(e){
        res.status(400).send(e.message);
        return;
    }
    
    results.forEach(oneSet => {
        if(oneSet["status"]!="fulfilled") return;
        oneSet=oneSet.value;
        newTwinRelations = newTwinRelations.concat(oneSet)
    })

    var reInfo = { "childTwinsAndRelations": childTwinsAndRelationsArr, "newTwinRelations": newTwinRelations }

    res.send(reInfo)
}

routerQueryADT.prototype.querySingleInBound = async function (twinID,knownSourceTwins) {
    try{
        var oneSet = { childTwins: {}, relationships: [] }
        var relationships = await adtHelper.ADTClient.listIncomingRelationships(twinID)
        var promiseArr=[]
        for await (let page of relationships.byPage({ maxPageSize: 1000 })) { //should be only one page
            page.value.forEach((oneRel) => {
                if(knownSourceTwins[oneRel["sourceId"]]==null){
                    promiseArr.push(adtHelper.ADTClient.getDigitalTwin(oneRel["sourceId"]))
                }
                promiseArr.push(adtHelper.ADTClient.getRelationship(oneRel["sourceId"], oneRel["relationshipId"]))
            })
        }
        var results=await Promise.allSettled(promiseArr);
        results.forEach(oneResult=>{
            if(oneResult["status"]!="fulfilled") return;
            oneResult=oneResult.value;
            if(oneResult.body['$relationshipId']) oneSet.relationships.push(oneResult.body)
            else oneSet.childTwins[oneResult.body['$dtId']]=oneResult.body
        })
        return oneSet;
    }catch (e) {
        console.log(e)
        throw e;
    }
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
        var results = await Promise.allSettled(promiseArr);
        results.forEach(oneTarget => {
            if(oneTarget["status"]!="fulfilled") return;
            oneTarget=oneTarget.value;
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
        var results=await Promise.allSettled(promiseArr);
        results.forEach(oneSet=>{
            if(oneSet["status"]!="fulfilled") return;
            oneSet=oneSet.value;
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