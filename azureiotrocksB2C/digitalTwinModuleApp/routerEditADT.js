const express = require("express");
const adtHelper=require("./adtHelper")

function routerEditADT(){
    this.router = express.Router();
    this.useRoute("importModels","isPost")
    this.useRoute("deleteModels","isPost")
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

routerEditADT.prototype.deleteModels =async function(req,res) {
    var models=req.body.models;
    
    try{
        models.forEach(element => {
            await adtHelper.ADTClient.deleteModel(element["@id"])
        });
        res.status(200).end()
    }catch(e){
        res.status(400).send(e.message);
    }
}

module.exports = new routerEditADT().router