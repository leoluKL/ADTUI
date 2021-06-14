const express = require("express");
const adtHelper=require("./adtHelper")

function routerEditADT(){
    this.router = express.Router();
    this.useRoute("importModels","isPost")
    this.useRoute("deleteModels","isPost")
    this.useRoute("changeAttribute","isPost")
    this.useRoute("upsertDigitalTwin","isPost")
    this.useRoute("batchImportTwins","isPost")
    this.useRoute("deleteTwinWithoutConnection","isPost")
    this.useRoute("createRelations","isPost")
    this.useRoute("deleteModel","isPost")
    this.useRoute("deleteRelations","isPost")
    this.useRoute("deleteTwins","isPost")
}

routerEditADT.prototype.useRoute=function(routeStr,isPost){
    this.router[(isPost)?"post":"get"]("/"+routeStr,(req,res)=>{
        this[routeStr](req,res)
    })
}

routerEditADT.prototype.batchImportTwins =async function(req,res) {
    var promiseArr=[]
    var twins=JSON.parse(req.body.twins);
    var idArr=[]
    twins.forEach(oneTwin=>{
        idArr.push(oneTwin['$dtId'])
        promiseArr.push(adtHelper.ADTClient.upsertDigitalTwin(oneTwin['$dtId'], JSON.stringify(oneTwin)))
    })

    try{
        var results=await Promise.allSettled(promiseArr);
        var succeedList=[]
        results.forEach((oneSet,index)=>{
            if(oneSet.status=="fulfilled") {
                //console.log(JSON.stringify(oneSet,null,2))
                succeedList.push(oneSet.value.body) 
            }
        })
        res.send(succeedList)
    }catch(e){
        res.status(400).send(e.message)
    }
}

routerEditADT.prototype.upsertDigitalTwin =async function(req,res) {
    var newTwin = req.body.newTwinJson;
    try{
        var obj=JSON.parse(newTwin)
        var twinID=obj['$dtId']
        var re = await adtHelper.ADTClient.upsertDigitalTwin(twinID, newTwin)
        res.send(re.body)
    }catch(e){
        res.status(400).send(e.message);
    }
}

routerEditADT.prototype.deleteModel =async function(req,res) {
    var model=req.body.model;
    try{
        re = await adtHelper.ADTClient.deleteModel(model)
        res.end()
    }catch(e){
        res.status(400).send(e.message);
    }
}

routerEditADT.prototype.deleteRelations =async function(req,res) {
    var relations=req.body.relations;
    var promiseArr=[]
    relations.forEach(oneAction=>{
        promiseArr.push(adtHelper.ADTClient.deleteRelationship(oneAction["srcID"],oneAction["relID"]))
    })

    try{
        var results=await Promise.allSettled(promiseArr);
        var succeedList=[]
        results.forEach((oneSet,index)=>{
            if(oneSet.status=="fulfilled") {
                succeedList.push(relations[index]) 
            }
        })
        res.send(succeedList)
    }catch(e){
        res.status(400).send(e.message);
    }
}

routerEditADT.prototype.deleteTwins =async function(req,res) {
    var twinIDArr=req.body.arr;
    
    try {
        //get all the relationships and delete those first
        var getRelationsPromiseArr = []
        for (var i = 0; i < twinIDArr.length; i++) {
            var twinID = twinIDArr[i];
            getRelationsPromiseArr.push(this.getOneTwinAllRelations(twinID))
        }
        var allRelationships = {}
        var results = await Promise.allSettled(getRelationsPromiseArr);
        results.forEach((oneSet, index) => {
            if (oneSet.status == "fulfilled") {
                oneSet.value.forEach(oneRel => {
                    allRelationships[oneRel["relID"]] = oneRel
                })
            }
        })

        var deleteRelationsPromiseArr = []
        for (var relID in allRelationships) {
            var oneRel = allRelationships[relID]
            deleteRelationsPromiseArr.push(adtHelper.ADTClient.deleteRelationship(oneRel["srcID"], oneRel["relID"]))
        }
        await Promise.allSettled(deleteRelationsPromiseArr);


        var promiseArr = []
        for (var i = 0; i < twinIDArr.length; i++) {
            var twinID = twinIDArr[i];
            promiseArr.push(adtHelper.ADTClient.deleteDigitalTwin(twinID))
        }

        var results = await Promise.allSettled(promiseArr);
        var succeedList = []
        results.forEach((oneSet, index) => {
            if (oneSet.status == "fulfilled") succeedList.push(twinIDArr[index])
        })
        res.send(succeedList)
    }catch (e) {
        console.log(e)
        throw e;
    }
}

routerEditADT.prototype.getOneTwinAllRelations =async function(twinID) {
    var relationships = await adtHelper.ADTClient.listRelationships(twinID)
    var incomingRelationship = await adtHelper.ADTClient.listIncomingRelationships(twinID)

    var allRelationships = []
    for await (let page of relationships.byPage({ maxPageSize: 1000 })) { //should be only one page
        page.value.forEach((oneRel) => {
            allRelationships.push({ "srcID": oneRel["$sourceId"], "relID": oneRel["$relationshipId"] }) 
        })
    }
    for await (let page of incomingRelationship.byPage({ maxPageSize: 1000 })) { //should be only one page
        page.value.forEach((oneRel) => {
            allRelationships.push({ "srcID": oneRel["sourceId"], "relID": oneRel["relationshipId"] }) 
        })
    }
    return allRelationships
}

routerEditADT.prototype.deleteOneTwin =async function(twinID) {
    try{
        var relationships = await adtHelper.ADTClient.listRelationships(twinID)
        var incomingRelationship=await adtHelper.ADTClient.listIncomingRelationships(twinID)

        var allRelationships={}
        for await (let page of relationships.byPage({ maxPageSize: 1000 })) { //should be only one page
            page.value.forEach((oneRel) => {
                allRelationships[oneRel["$relationshipId"]]={"srcID":oneRel["$sourceId"],"relID":oneRel["$relationshipId"]}
            })
        }
        for await (let page of incomingRelationship.byPage({ maxPageSize: 1000 })) { //should be only one page
            page.value.forEach((oneRel) => {
                allRelationships[oneRel["$relationshipId"]]={"srcID":oneRel["$sourceId"],"relID":oneRel["$relationshipId"]}
            })
        }

        var promiseArr=[]
        for(var relID in allRelationships){
            var oneItem= allRelationships[relID]
            promiseArr.push(adtHelper.ADTClient.deleteRelationship(oneItem["srcID"],oneItem["relID"]))
        }
        await Promise.allSettled(promiseArr);
        await adtHelper.ADTClient.deleteDigitalTwin(twinID)
    }catch (e) {
        console.log(e)
        throw e;
    }
}


routerEditADT.prototype.createRelations =async function(req,res) {
    var actions=JSON.parse(req.body.actions);
    var promiseArr=[]
    actions.forEach(oneAction=>{
        promiseArr.push(adtHelper.ADTClient.upsertRelationship(oneAction["$srcId"],oneAction["$relationshipId"],oneAction["obj"]))
    })

    try{
        var results=await Promise.allSettled(promiseArr);
        var succeedList=[]
        results.forEach((oneSet,index)=>{
            if(oneSet.status=="fulfilled") {
                //console.log(JSON.stringify(oneSet,null,2))
                succeedList.push(oneSet.value.body) 
            }
        })
        res.send(succeedList)
    }catch(e){
        res.status(400).send(e.message);
    }
    
}

routerEditADT.prototype.deleteTwinWithoutConnection =async function(req,res) {
    var twinID = req.body.twinID;
    try{
        var result=await adtHelper.ADTClient.deleteDigitalTwin(twinID)
        res.end()
    }catch(e){
        res.status(400).send(e.message);
    }
}

routerEditADT.prototype.importModels =async function(req,res) {
    var models=JSON.parse(req.body.models);
    
    try{
        re = await adtHelper.ADTClient.createModels(models)
        res.status(200).end()
    }catch(e){
        res.status(400).send(e.message);
    }
}

routerEditADT.prototype.changeAttribute =async function(req,res) {
    var jsonPatch = req.body.jsonPatch; 
    var twinID= req.body.twinID; 
    var relationshipID = req.body.relationshipID;

    try{
        jsonPatch=JSON.parse(jsonPatch)
        if(relationshipID==null){
            var re = await adtHelper.ADTClient.updateDigitalTwin(twinID, jsonPatch)
        }else{
            var re = await adtHelper.ADTClient.updateRelationship(twinID,relationshipID,jsonPatch)
        }
        res.status(200).end()
    }catch(e){
        res.status(400).send(e.message);
    }
}


routerEditADT.prototype.deleteModels =async function(req,res) {
    var models=req.body.models;
    
    try{
        models.forEach(async element => {
            await adtHelper.ADTClient.deleteModel(element["@id"])
        });
        res.status(200).end()
    }catch(e){
        res.status(400).send(e.message);
    }
}

module.exports = new routerEditADT().router