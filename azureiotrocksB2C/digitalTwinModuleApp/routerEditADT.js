const express = require("express");
const adtHelper=require("./adtHelper")

function routerEditADT(){
    this.router = express.Router();
    this.useRoute("importModels","isPost")
    this.useRoute("deleteModels","isPost")
    this.useRoute("changeAttribute","isPost")
}

routerEditADT.prototype.useRoute=function(routeStr,isPost){
    this.router[(isPost)?"post":"get"]("/"+routeStr,(req,res)=>{
        this[routeStr](req,res)
    })
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