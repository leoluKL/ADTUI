const express = require("express");

function routerQueryADT(adtClients){
    this.adtClients=adtClients;    
    this.router = express.Router();

    this.router.get("/listADTInstance", (req, res)=> {res.send(Object.keys(adtClients)) });

    this.useRoute("listModels")
    this.useRoute("allTwinsInfo","isPost")
    this.useRoute("oneTwinInfo","isPost")
    this.useRoute("allRelationships","isPost")
    this.useRoute("showOutBound","isPost")
    this.useRoute("showInBound","isPost")
    this.useRoute("fetchInfomation","isPost")
}

routerQueryADT.prototype.useRoute=function(routeStr,isPost){
    this.router[(isPost)?"post":"get"]("/"+routeStr,(req,res)=>{
        var adtURL=req.header("adtInstance")
        if(!adtURL) res.end()
        var adtClient = this.adtClients[adtURL]
        if (!adtClient) res.end()
        this[routeStr](adtClient,req,res)
    })
}

routerQueryADT.prototype.fetchInfomation=async function(adtClient,req,res){
    var elements=req.body.elements
    var promiseArr=[]
    elements.forEach(ele=>{
        if(ele['$sourceId']){ //query relationship
            promiseArr.push(adtClient.getRelationship(ele["$sourceId"], ele["$relationshipId"]))
        }else{ //query twin
            promiseArr.push(adtClient.getDigitalTwin(ele["$dtId"]))
        }
    })
    var results=await Promise.allSettled(promiseArr);
    var responds=[]
    results.forEach(oneRe=>{
        if(oneRe.status=="fulfilled") responds.push(oneRe.value.body)
    })
    res.send(responds)
}

routerQueryADT.prototype.listModels=async function(adtClient,req,res){
    try{
        var reArr=[]
        var models = await adtClient.listModels([], true);
        for await (const modelSet of models.byPage({ maxPageSize: 1000 })) { //should be only one page
            //reArr=modelSet.value
            modelSet.value.forEach(oneModel=>{reArr.push(oneModel.model)})
        }
        res.send(reArr)
    }catch(e){
        res.end()
    }
}

routerQueryADT.prototype.querySingleTwinRelations = async function (adtClient,twinID) {
    var oneSet = []
    var relationships = await adtClient.listRelationships(twinID)
    for await (let page of relationships.byPage({ maxPageSize: 1000 })) { //it is strange that i must set maxPagesize as 1 to only have one page
        oneSet=oneSet.concat(page.value)
    }
    return oneSet;
}

routerQueryADT.prototype.oneTwinInfo =async function(adtClient,req,res) {
    var twinID = req.body.twinID; 
    try{
        var twinInfo = await adtClient.getDigitalTwin(twinID)
        res.send(twinInfo.body)
    }catch(e){
        console.log(e)
        res.end()
    }
}

routerQueryADT.prototype.allTwinsInfo =async function(adtClient,req,res) {
    var queryStr = req.body.query; 
    try{
        var reArr=[]
        var allTwins = await adtClient.queryTwins(queryStr)
        //var counter=0
        for await (const twinSet of allTwins.byPage({ maxPageSize: 1000 })) { //should be only one page
            reArr=reArr.concat(twinSet.value)
            //counter++
        }
        //console.log(counter)
        res.send(reArr)
    }catch(e){
        console.log(e)
        res.end()
    }
}


routerQueryADT.prototype.allRelationships =async function(adtClient,req,res) {
    var twinIDArr=req.body.arr;
    var reArr=[]
    var promiseArr=[]

    for(var i=0;i<twinIDArr.length;i++){
        var twinID = twinIDArr[i];
        promiseArr.push(this.querySingleTwinRelations(adtClient,twinID))
    }
    var results=await Promise.all(promiseArr);
    results.forEach(oneSet=>{
        reArr=reArr.concat(oneSet)
    })

    res.send(reArr)
}

routerQueryADT.prototype.showInBound =async function(adtClient,req,res) {
    var twinIDArr=req.body.arr;
    var knownSourceTwins= req.body.knownSources;
    var childTwinsAndRelationsArr=[]
    var promiseArr=[];
    for(var i=0;i<twinIDArr.length;i++){
        var twinID = twinIDArr[i];
        promiseArr.push(this.showSingleInBound(adtClient,twinID,knownSourceTwins))
    }

    var results=await Promise.all(promiseArr);
    var newTwins={}
    results.forEach(oneSet=>{
        childTwinsAndRelationsArr.push(oneSet)
        for(var twinID in oneSet.childTwins) newTwins[twinID]=1
    })

    //for new twins, query their relationships that will be also stored in client browser app
    var promiseArr = []
    var newTwinRelations = []
    for (var twinID in newTwins) { promiseArr.push(this.querySingleTwinRelations(adtClient, twinID)) }
    var results = await Promise.all(promiseArr);
    results.forEach(oneSet => {
        newTwinRelations = newTwinRelations.concat(oneSet)
    })
    var reInfo={"childTwinsAndRelations":childTwinsAndRelationsArr,"newTwinRelations":newTwinRelations}

    res.send(reInfo)
}

routerQueryADT.prototype.showSingleInBound = async function (adtClient,twinID,knownSourceTwins) {
    var oneSet = { childTwins: {}, relationships: [] }
    var relationships = await adtClient.listIncomingRelationships(twinID)
    var promiseArr=[]
    for await (let page of relationships.byPage({ maxPageSize: 1000 })) { //should be only one page
        page.value.forEach((oneRel) => {
            if(knownSourceTwins[oneRel["sourceId"]]==null){
                promiseArr.push(adtClient.getDigitalTwin(oneRel["sourceId"]))
            }
            promiseArr.push(adtClient.getRelationship(oneRel["sourceId"], oneRel["relationshipId"]))
        })
    }
    var results=await Promise.all(promiseArr);
    results.forEach(oneResult=>{
        if(oneResult.body['$relationshipId']) oneSet.relationships.push(oneResult.body)
        else oneSet.childTwins[oneResult.body['$dtId']]=oneResult.body
    })
    return oneSet;
}

routerQueryADT.prototype.showOutBound =async function(adtClient,req,res) {
    var twinIDArr=req.body.arr;
    var knownTargetTwins= req.body.knownTargets;
    var childTwinsAndRelationsArr=[]
    var promiseArr=[];
    for(var i=0;i<twinIDArr.length;i++){
        var twinID = twinIDArr[i];
        promiseArr.push(this.showSingleOutBound(adtClient,twinID,knownTargetTwins))
    }

    var results=await Promise.all(promiseArr);
    var newTwins={}
    results.forEach(oneSet=>{
        childTwinsAndRelationsArr.push(oneSet)
        for(var twinID in oneSet.childTwins) newTwins[twinID]=1
    })

    //for new twins, query their relationships that will be also stored in client browser app
    var promiseArr=[]
    var newTwinRelations=[]
    for(var twinID in newTwins){ promiseArr.push(this.querySingleTwinRelations(adtClient,twinID)) }
    var results=await Promise.all(promiseArr);
    results.forEach(oneSet=>{
        newTwinRelations=newTwinRelations.concat(oneSet)
    })

    var reInfo={"childTwinsAndRelations":childTwinsAndRelationsArr,"newTwinRelations":newTwinRelations}

    res.send(reInfo)
}

routerQueryADT.prototype.showSingleOutBound = async function (adtClient,twinID,knownTargetTwins) {
    var oneSet = { childTwins: {}, relationships: [] }
    var relationships = await adtClient.listRelationships(twinID)
    //console.log(Date.now() + " to get all relation")
    var promiseArr=[]
    for await (let page of relationships.byPage({ maxPageSize: 1000 })) { //should be only one page
        page.value.forEach((oneRel) => {
            if(knownTargetTwins[oneRel["$targetId"]]==null){
                promiseArr.push(adtClient.getDigitalTwin(oneRel["$targetId"]))
            }
        })
        oneSet.relationships=oneSet.relationships.concat(page.value)
    }
    var results=await Promise.all(promiseArr);
    results.forEach(oneTarget=>{
        oneSet.childTwins[oneTarget['body']['$dtId']]=oneTarget['body']
    })
    //console.log(Date.now() + " get all target twins")
    return oneSet;
}

module.exports = (adtClients) => { return (new routerQueryADT(adtClients)).router }


//that T.position, position is the relationship name
/*
var twins = await adtClient.queryTwins("SELECT T,CT,R from DIGITALTWINS T JOIN CT RELATED T.position R where T.$metadata.$model='dtmi:ADTUILayoutParent;1' and T.$dtId='default'")
for await (const twin of twins) {
    console.log("one row -----------------")
    console.log(twin);
}
*/