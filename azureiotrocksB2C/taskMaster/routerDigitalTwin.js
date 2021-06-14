const express = require("express");
const got = require('got');
const { v4:uuidv4 } = require('uuid');

function routerDigitalTwin(){
    this.router = express.Router();
    this.useRoute("fetchUserData")
    this.useRoute("importModels","isPost")
    
    this.useRoute("upsertDigitalTwin","isPost")
    this.useRoute("batchImportTwins","isPost")

    this.useRoute("listModelsForIDs","isPost")
    this.useRoute("listTwinsForIDs","isPost")
    this.useRoute("changeAttribute","isPost")
    this.useRoute("getRelationshipsFromTwinIDs","isPost")
    this.useRoute("createRelations","isPost")
    this.useRoute("queryOutBound","isPost")
    this.useRoute("queryInBound","isPost")
    this.useRoute("deleteModel","isPost")
    this.useRoute("saveVisualDefinition","isPost")
    this.useRoute("saveLayout","isPost")
    this.useRoute("deleteLayout","isPost")
    this.useRoute("deleteRelations","isPost")
    this.useRoute("deleteTwins","isPost")
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
    res.send(body)
}

routerDigitalTwin.prototype.listModelsForIDs =async function(req,res) {
    //TODO: add stricter security measure that it only query models belonging to this user
    try{
        var {body}= await got.post(process.env.digitaltwinoperationAPIURL+"queryADT/listModelsForIDs", {json:req.body,responseType: 'json'});
    }catch(e){
        res.status(e.response.statusCode).send(e.response.body);
        return;
    }
    res.send(body)
}

routerDigitalTwin.prototype.queryOutBound =async function(req,res) {
    //TODO: add stricter security measure that it only operate data belonging to this user
    try{
        var {body}= await got.post(process.env.digitaltwinoperationAPIURL+"queryADT/queryOutBound", {json:req.body,responseType: 'json'});
    }catch(e){
        res.status(e.response.statusCode).send(e.response.body);
        return;
    }
    res.send(body)
}

routerDigitalTwin.prototype.queryInBound =async function(req,res) {
    //TODO: add stricter security measure that it only operate data belonging to this user
    try{
        var {body}= await got.post(process.env.digitaltwinoperationAPIURL+"queryADT/queryInBound", {json:req.body,responseType: 'json'});
    }catch(e){
        res.status(e.response.statusCode).send(e.response.body);
        return;
    }
    res.send(body)
}

routerDigitalTwin.prototype.createRelations =async function(req,res) {
    //TODO: add stricter security measure that it only operate data belonging to this user
    try{
        var {body}= await got.post(process.env.digitaltwinoperationAPIURL+"editADT/createRelations", {json:req.body,responseType: 'json'});
    }catch(e){
        res.status(e.response.statusCode).send(e.response.body);
        return;
    }
    res.send(body)
}

routerDigitalTwin.prototype.getRelationshipsFromTwinIDs =async function(req,res) {
    //TODO: add stricter security measure that it only operate data belonging to this user
    try{
        var {body}= await got.post(process.env.digitaltwinoperationAPIURL+"queryADT/getRelationshipsFromTwinIDs", {json:req.body,responseType: 'json'});
    }catch(e){
        res.status(e.response.statusCode).send(e.response.body);
        return;
    }
    res.send(body)
}

routerDigitalTwin.prototype.deleteTwins =async function(req,res) {
    //delete the entry from cosmosDB first
    //then delete them from ADT
    //store the new twin to cosmos DB
    
    var dbReq=req.body
    dbReq.account=req.authInfo.account
    try{
        var {body}=await got.post(process.env.dboperationAPIURL+"deleteData/deleteTwins",{json:dbReq,responseType: 'json'});
    }catch(e){
        console.log(e)
    }

    try{
        var {body}= await got.post(process.env.digitaltwinoperationAPIURL+"editADT/deleteTwins", {json:req.body,responseType: 'json'});
        res.send(body)
    }catch(e){
        res.status(e.response.statusCode).send(e.response.body);
    }
}


routerDigitalTwin.prototype.listTwinsForIDs =async function(req,res) {
    //TODO: add stricter security measure that it only operate data belonging to this user
    try{
        var {body}= await got.post(process.env.digitaltwinoperationAPIURL+"queryADT/listTwinsForIDs", {json:req.body,responseType: 'json'});
    }catch(e){
        res.status(e.response.statusCode).send(e.response.body);
        return;
    }
    res.send(body)
}

routerDigitalTwin.prototype.changeAttribute =async function(req,res) {
    //TODO: add stricter security measure that it only operate data belonging to this user
    try{
        var {body}= await got.post(process.env.digitaltwinoperationAPIURL+"editADT/changeAttribute", {json:req.body});
    }catch(e){
        console.log(e.response)
        res.status(e.response.statusCode).send(e.response.body);
        return;
    }
    res.send(body)
}


routerDigitalTwin.prototype.batchImportTwins =async function(req,res) {
    //query all twin name in user name space, and check the imported twin names are unique
    var reqBody={ account:req.authInfo.account}
    try{
        var {body} = await got.post(process.env.dboperationAPIURL+"queryData/userData", {json:reqBody,responseType: 'json'});
    }catch(e){
        res.status(e.response.statusCode).send(e.response.body);
        return;
    }
    var usedTwinName={}
    body.forEach(oneDoc=>{
        if(oneDoc["type"]=='DTTwin') usedTwinName[oneDoc['displayName']]=1
    })
    
    var importTwins=JSON.parse(req.body.twins)
    var duplicateName=[]
    importTwins.forEach(oneImportTwin=>{
        var twinName=oneImportTwin["displayName"]
        if(usedTwinName[twinName]) duplicateName.push(twinName)
    })

    if(duplicateName.length>0){
        res.status(400).send("Twin name confliction:"+duplicateName.join(" "))
        return;
    }

    var twinIDtoDisplayName={}
    importTwins.forEach(oneImportTwin=>{
        twinIDtoDisplayName[oneImportTwin["$dtId"]]=oneImportTwin["displayName"]
        delete oneImportTwin["displayName"]
    })

    try{
        var {body} = await got.post(process.env.digitaltwinoperationAPIURL+"editADT/batchImportTwins", 
            {json:{"twins":JSON.stringify(importTwins)},responseType: 'json'});
    }catch(e){
        res.status(e.response.statusCode).send(e.response.body);
        return;
    }

    var ADTTwins_imported=body
    var DBTwins_imported=[]
    var promiseArr=[]
    ADTTwins_imported.forEach(adtTwin=>{
        var postLoad={"ADTTwin":adtTwin,"displayName":twinIDtoDisplayName[adtTwin["$dtId"]]}
        postLoad.account=req.authInfo.account
        promiseArr.push(got.post(process.env.dboperationAPIURL+"insertData/newTwin",{json:postLoad,responseType: 'json'}))
    })
    try{
        var results=await Promise.allSettled(promiseArr);
        results.forEach((oneSet,index)=>{
            if(oneSet.status=="fulfilled") {
                DBTwins_imported.push(oneSet.value.body) 
            }
        })
    }catch(e){
        res.status(400).send(e.message);
        //TODO: roll back ADT twins
    }

    res.send({"ADTTwins":JSON.stringify(ADTTwins_imported),"DBTwins":JSON.stringify(DBTwins_imported)})
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
            res.status(400).send("Twin name is not unique!")
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

routerDigitalTwin.prototype.deleteRelations =async function(req,res) {
    //TODO: add stricter security measure that it only operate data belonging to this user
    var dtPayload=req.body
    try{
        var {body} = await got.post(process.env.digitaltwinoperationAPIURL+"editADT/deleteRelations", {json:dtPayload,responseType: 'json'});
    }catch(e){
        res.status(e.response.statusCode).send(e.response.body);
        return;
    }
    res.send(body)
}


routerDigitalTwin.prototype.deleteLayout =async function(req,res) {
    var dbReq={"layoutName":req.body.layoutName, "account":req.authInfo.account}
    try{
        await got.post(process.env.dboperationAPIURL+"deleteData/deleteTopologySchema",{json:dbReq});
        //task is successful
        res.status(200).end()
    }catch(e){
        res.status(e.response.statusCode).send(e.response.body);
        //TODO: What should be done if model is deteled in ADT but not in cosmosDB?
    }
}



routerDigitalTwin.prototype.deleteModel =async function(req,res) {
    //TODO: add stricter security measure that it only operate data belonging to this user
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

routerDigitalTwin.prototype.saveVisualDefinition =async function(req,res) {
    var reqBody=req.body
    reqBody.account=req.authInfo.account
    
    try{
        await got.post(process.env.dboperationAPIURL+"insertData/updateVisualSchema", {json:reqBody});
        res.end()
    }catch(e){
        res.status(e.response.statusCode).send(e.response.body);
    }
}

routerDigitalTwin.prototype.saveLayout =async function(req,res) {
    var reqBody=req.body
    reqBody.account=req.authInfo.account
    
    try{
        await got.post(process.env.dboperationAPIURL+"insertData/updateTopologySchema", {json:reqBody});
        res.end()
    }catch(e){
        res.status(e.response.statusCode).send(e.response.body);
    }
}




module.exports = new routerDigitalTwin().router