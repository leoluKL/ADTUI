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
    var {body} = await got.post(process.env.dboperationAPIURL+"queryData/userData", {json:reqBody,responseType: 'json'});

    //TODO:extract the models ID, twins ID and query models detail from ADT, skip twins detail as there maybe too many
    res.send(body)
}

routerDigitalTwin.prototype.importModels =async function(req,res) {
    var resFromdtAPI = await got.post(process.env.digitaltwinoperationAPIURL+"editADT/importModels", {json:req.body,responseType: 'json'});

    if(resFromdtAPI.statusCode!=200){
        //fail, return the response body to frontend
        res.status(resFromdtAPI.statusCode);
        res.send(resFromdtAPI.body);
    }else{
        //store the model to cosmos DB
        var postLoad=req.body
        postLoad.account=req.authInfo.account
        var resFromdbAPI= await got.post(process.env.dboperationAPIURL+"inertData/newModels",{json:postLoad,responseType: 'json'});
        if(resFromdtAPI.statusCode!=200){
            //roll back ADT operation by deleting those models and revert to frontend
        }else{
            res.status(200)
            res.end()
        }
    }
}


module.exports = new routerDigitalTwin().router