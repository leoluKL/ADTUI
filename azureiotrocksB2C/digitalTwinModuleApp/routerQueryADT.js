const express = require("express");
const adtHelper=require("./adtHelper")

function routerQueryADT(){
    this.router = express.Router();
    this.useRoute("listModels")
}

routerQueryADT.prototype.useRoute=function(routeStr,isPost){
    this.router[(isPost)?"post":"get"]("/"+routeStr,(req,res)=>{
        this[routeStr](req,res)
    })
}

routerQueryADT.prototype.listModels =async function(req,res) {
    try{
        var reArr=[]
        var models = await adtHelper.ADTClient.listModels([], true);
        for await (const modelSet of models.byPage({ maxPageSize: 1000 })) { //should be only one page
            //reArr=modelSet.value
            modelSet.value.forEach(oneModel=>{reArr.push(oneModel.model)})
        }
        res.send(reArr)
    }catch(e){
        res.end()
    }
}



module.exports = new routerQueryADT().router