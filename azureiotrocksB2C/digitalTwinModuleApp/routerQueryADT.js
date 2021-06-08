const express = require("express");
const adtHelper=require("./adtHelper")

function routerQueryADT(){
    this.router = express.Router();
    this.useRoute("listModelsForIDs","post")
}

routerQueryADT.prototype.useRoute=function(routeStr,isPost){
    this.router[(isPost)?"post":"get"]("/"+routeStr,(req,res)=>{
        this[routeStr](req,res)
    })
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



module.exports = new routerQueryADT().router