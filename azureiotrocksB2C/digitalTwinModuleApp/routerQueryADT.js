const express = require("express");
const adtHelper=require("./adtHelper")

function routerQueryADT(){
    this.router = express.Router();
    this.useRoute("listModelsForIDs","post")
    this.useRoute("listTwinsForIDs","post")
    this.useRoute("getRelationshipsFromTwinIDs","post")
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
        var twinIDArr=req.body.arr;
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
        return e;
    }
}



module.exports = new routerQueryADT().router