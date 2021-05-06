const express = require("express");

function routerQueryADT(adtClients){
    this.adtClients=adtClients;    
    this.router = express.Router();

    this.router.get("/listADTInstance", (req, res)=> {res.send(Object.keys(adtClients)) });

    this.useRoute("listModels")
    this.useRoute("allTwinsInfo","isPost")
    this.useRoute("allRelationships","isPost")
    this.useRoute("addOutBound","isPost")
    this.useRoute("addInBound","isPost")
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

routerQueryADT.prototype.querySingleOutBound = async function (adtClient,twinID) {
    var oneSet = []
    var relationships = await adtClient.listRelationships(twinID)
    for await (let page of relationships.byPage({ maxPageSize: 1000 })) { //it is strange that i must set maxPagesize as 1 to only have one page
        oneSet=oneSet.concat(page.value)
    }
    return oneSet;
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
        promiseArr.push(this.querySingleOutBound(adtClient,twinID))
    }
    var results=await Promise.all(promiseArr);
    results.forEach(oneSet=>{
        reArr=reArr.concat(oneSet)
    })

    res.send(reArr)
}

routerQueryADT.prototype.addInBound =async function(adtClient,req,res) {
    var twinIDArr=req.body.arr;
    var reArr=[]
    var promiseArr=[];
    for(var i=0;i<twinIDArr.length;i++){
        var twinID = twinIDArr[i];
        promiseArr.push(this.addSingleInBound(adtClient,twinID))
    }

    var results=await Promise.all(promiseArr);
    results.forEach(oneSet=>{
        reArr.push(oneSet)
    })

    res.send(reArr)
}

routerQueryADT.prototype.addSingleInBound = async function (adtClient,twinID) {
    var oneSet = { childTwins: {}, relationships: [] }
    var relationships = await adtClient.listIncomingRelationships(twinID)
    var promiseArr=[]
    for await (let page of relationships.byPage({ maxPageSize: 1000 })) { //should be only one page
        page.value.forEach((oneRel) => {
            promiseArr.push(adtClient.getDigitalTwin(oneRel["sourceId"]))
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

routerQueryADT.prototype.addOutBound =async function(adtClient,req,res) {
    var twinIDArr=req.body.arr;
    var reArr=[]
    var promiseArr=[];
    for(var i=0;i<twinIDArr.length;i++){
        var twinID = twinIDArr[i];
        promiseArr.push(this.addSingleOutBound(adtClient,twinID))
    }

    var results=await Promise.all(promiseArr);
    results.forEach(oneSet=>{
        reArr.push(oneSet)
    })

    res.send(reArr)
}

routerQueryADT.prototype.addSingleOutBound = async function (adtClient,twinID) {
    var oneSet = { childTwins: {}, relationships: [] }
    var relationships = await adtClient.listRelationships(twinID)
    //console.log(Date.now() + " to get all relation")
    var promiseArr=[]
    for await (let page of relationships.byPage({ maxPageSize: 1000 })) { //should be only one page
        page.value.forEach((oneRel) => {
            promiseArr.push(adtClient.getDigitalTwin(oneRel["$targetId"]))
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