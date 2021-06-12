const express = require("express");
const adtHelper=require("./adtHelper")

function routerEditADT(){
    this.router = express.Router();
    this.useRoute("importModels","isPost")
    this.useRoute("deleteModels","isPost")
    this.useRoute("changeAttribute","isPost")
    this.useRoute("upsertDigitalTwin","isPost")
    this.useRoute("deleteTwinWithoutConnection","isPost")
    this.useRoute("createRelations","isPost")
    this.useRoute("deleteModel","isPost")
}

routerEditADT.prototype.useRoute=function(routeStr,isPost){
    this.router[(isPost)?"post":"get"]("/"+routeStr,(req,res)=>{
        this[routeStr](req,res)
    })
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
    var models=req.body.models;
    
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