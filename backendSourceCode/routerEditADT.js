const express = require("express");

function routerEditADT(adtClients){
    this.adtClients=adtClients;    
    this.router = express.Router();

    this.useRoute("changeAttribute","isPost")
    this.useRoute("importModels","isPost")
    this.useRoute("deleteModel","isPost")
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

routerEditADT.prototype.importModels =async function(adtClient,req,res) {
    var models=req.body.models;
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

