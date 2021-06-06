const express = require("express");
const adtHelper=require("./adtHelper")

function routerEditADT(){
    this.router = express.Router();
    this.useRoute("importModels","isPost")
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
        res.status(200)
        res.end()
    }catch(e){
        res.statusCode = 400;
        if(e.message!=null && e.message!="") res.send(e.message)
        else res.send(e.name)
    }
}

module.exports = new routerEditADT().router