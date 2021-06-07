const express = require("express");
const got = require('got');

function routerDigitalTwin(){
    this.router = express.Router();
    this.useRoute("fetchUserData")
    this.useRoute("importModels","isPost")
}

routerDigitalTwin.prototype.useRoute=function(routeStr,isPost){
    this.router[(isPost)?"post":"get"]("/"+routeStr,(req,res)=>{
        this[routeStr](req,res)
    })
}

routerDigitalTwin.prototype.fetchUserData =async function(req,res) {
    //fetch digital twins, dtdl models and the visualization data (from both cosmosdb and ADT )
    var reqBody={ account:req.authInfo.account}
    try{
        var {body} = await got.post(process.env.dboperationAPIURL+"queryData/userData", {json:reqBody,responseType: 'json'});
    }catch(e){
        res.status(e.response.statusCode).send(e.response.body);
        return;
    }
    
    //TODO:extract the models ID, twins ID and query models detail from ADT, skip twins detail as there maybe too many
    res.send(body)
}

routerDigitalTwin.prototype.importModels =async function(req,res) {
    try{
        await got.post(process.env.digitaltwinoperationAPIURL+"editADT/importModels", {json:req.body,responseType: 'json'});
    }catch(e){
        res.status(e.response.statusCode).send(e.response.body);
        return;
    }
    
    //store the model to cosmos DB
    var postLoad=req.body
    postLoad.account=req.authInfo.account
    try{
        await got.post(process.env.dboperationAPIURL+"insertData/newModels",{json:postLoad,responseType: 'json'});
        //task is successful
        res.status(200).end()
    }catch(e){
        res.status(e.response.statusCode).send(e.response.body);
        //roll back ADT operation by deleting those models and revert to frontend
        console.error("roll back and remove inserted model in ADT...")
        await got.post(process.env.digitaltwinoperationAPIURL+"editADT/deleteModels", {json:req.body,responseType: 'json'});
    }
}


module.exports = new routerDigitalTwin().router