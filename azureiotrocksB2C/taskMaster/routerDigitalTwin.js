const express = require("express");
const got = require('got');
const { v4:uuidv4 } = require('uuid');

function routerDigitalTwin(){
    this.router = express.Router();
    this.useRoute("fetchUserData")
    this.useRoute("importModels","isPost")
    this.useRoute("upsertDigitalTwin","isPost")
    this.useRoute("listModelsForIDs","isPost")
    this.useRoute("listTwinsForIDs","isPost")
    this.useRoute("changeAttribute","isPost")
    this.useRoute("getRelationshipsFromTwinIDs","isPost")
    this.useRoute("createRelations","isPost")
    this.useRoute("queryOutBound","isPost")
    this.useRoute("queryInBound","isPost")
    this.useRoute("deleteModel","isPost")
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

routerDigitalTwin.prototype.listModelsForIDs =async function(req,res) {
    try{
        var {body}= await got.post(process.env.digitaltwinoperationAPIURL+"queryADT/listModelsForIDs", {json:req.body,responseType: 'json'});
    }catch(e){
        res.status(e.response.statusCode).send(e.response.body);
        return;
    }
    res.send(body)
}

routerDigitalTwin.prototype.queryOutBound =async function(req,res) {
    try{
        var {body}= await got.post(process.env.digitaltwinoperationAPIURL+"queryADT/queryOutBound", {json:req.body,responseType: 'json'});
    }catch(e){
        res.status(e.response.statusCode).send(e.response.body);
        return;
    }
    res.send(body)
}

routerDigitalTwin.prototype.queryInBound =async function(req,res) {
    try{
        var {body}= await got.post(process.env.digitaltwinoperationAPIURL+"queryADT/queryInBound", {json:req.body,responseType: 'json'});
    }catch(e){
        res.status(e.response.statusCode).send(e.response.body);
        return;
    }
    res.send(body)
}

routerDigitalTwin.prototype.createRelations =async function(req,res) {
    try{
        var {body}= await got.post(process.env.digitaltwinoperationAPIURL+"editADT/createRelations", {json:req.body,responseType: 'json'});
    }catch(e){
        res.status(e.response.statusCode).send(e.response.body);
        return;
    }
    res.send(body)
}

routerDigitalTwin.prototype.getRelationshipsFromTwinIDs =async function(req,res) {
    try{
        var {body}= await got.post(process.env.digitaltwinoperationAPIURL+"queryADT/getRelationshipsFromTwinIDs", {json:req.body,responseType: 'json'});
    }catch(e){
        res.status(e.response.statusCode).send(e.response.body);
        return;
    }
    res.send(body)
}



routerDigitalTwin.prototype.listTwinsForIDs =async function(req,res) {
    try{
        var {body}= await got.post(process.env.digitaltwinoperationAPIURL+"queryADT/listTwinsForIDs", {json:req.body,responseType: 'json'});
    }catch(e){
        res.status(e.response.statusCode).send(e.response.body);
        return;
    }
    res.send(body)
}

routerDigitalTwin.prototype.changeAttribute =async function(req,res) {
    try{
        var {body}= await got.post(process.env.digitaltwinoperationAPIURL+"editADT/changeAttribute", {json:req.body});
    }catch(e){
        console.log(e.response)
        res.status(e.response.statusCode).send(e.response.body);
        return;
    }
    res.send(body)
}


routerDigitalTwin.prototype.upsertDigitalTwin =async function(req,res) {
    //check the twin name uniqueness in user name space
    //if successful, generate UUID and create twin in ADT
    //if successful, then store the twin to cosmosDB as well
    //if not successful, then roll back by deleting the twin from ADT
    var twinInfo=JSON.parse(req.body.newTwinJson);
    var originTwinID=twinInfo['$dtId']
    var queryTwinNameUnique={}
    queryTwinNameUnique.account=req.authInfo.account
    queryTwinNameUnique.checkName=originTwinID

    try{
        var re= await got.post(process.env.dboperationAPIURL+"userAccount/checkTwinName",{json:queryTwinNameUnique});
        //task is successful
        if(re.body!="true") {
            res.status(400).send({"responseText":"Twin name is not unique!"})
            return;
        }
    }catch(e){
        res.status(e.response.statusCode).send(e.response.body);
        return;
    }

    //generate UUID and create twin in ADT
    var twinUUID=uuidv4();
    twinInfo['$dtId'] = twinUUID
    var createTwinPayload={"newTwinJson":JSON.stringify(twinInfo)}
    try{
        var createTwinRe = await got.post(process.env.digitaltwinoperationAPIURL+"editADT/upsertDigitalTwin", {json:createTwinPayload,responseType: 'json'});
    }catch(e){
        res.status(e.response.statusCode).send(e.response.body);
        return;
    }

    var newTwinInADT=createTwinRe.body

    //store the new twin to cosmos DB
    var postLoad={"ADTTwin":newTwinInADT,"displayName":originTwinID}
    postLoad.account=req.authInfo.account

    try{
        var DBTwin=await got.post(process.env.dboperationAPIURL+"insertData/newTwin",{json:postLoad,responseType: 'json'});
        //task is successful
        res.status(200).send({
            "DBTwin":DBTwin.body,
            "ADTTwin":newTwinInADT
        })
    }catch(e){
        res.status(e.response.statusCode).send(e.response.body);
        //roll back ADT operation by deleting the twin
        console.error("roll back twin creation for "+originTwinID)
        await got.post(process.env.digitaltwinoperationAPIURL+"editADT/deleteTwinWithoutConnection", {json:{"twinID":twinUUID}});
    }    
}


routerDigitalTwin.prototype.deleteModel =async function(req,res) {
    try{
        await got.post(process.env.digitaltwinoperationAPIURL+"editADT/deleteModel", {json:req.body});
    }catch(e){
        console.log(e.response.body);
    }

    var dbReq={"model":req.body.model, "account":req.authInfo.account}
    try{
        await got.post(process.env.dboperationAPIURL+"deleteData/deleteModel",{json:dbReq});
        //task is successful
        res.status(200).end()
    }catch(e){
        res.status(e.response.statusCode).send(e.response.body);
        //TODO: What should be done if model is deteled in ADT but not in cosmosDB?
    }
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