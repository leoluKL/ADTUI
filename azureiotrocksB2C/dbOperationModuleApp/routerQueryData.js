const express = require("express");
const cosmosdbhelper = require('./cosmosdbhelper')

function routerQueryData(){
    this.router = express.Router();
    this.useRoute("userData","post")
    this.useRoute("projectModels","post")
    this.useRoute("projectTwinsAndVisual","post")
}

routerQueryData.prototype.useRoute=function(routeStr,isPost){
    this.router[(isPost)?"post":"get"]("/"+routeStr,(req,res)=>{
        this[routeStr](req,res)
    })
}

routerQueryData.prototype.userData =async function(req,res) {
    var accountID=req.body.account
    var queryStr='SELECT * FROM c where '
    queryStr+=`c.accountID='${accountID}'`
    queryStr+=` and c.type ='user'`
    try{
        var queryResult=await cosmosdbhelper.query('appuser',queryStr)
        res.send(queryResult)
    }catch(e){
        res.status(400).send(e.message)
    }
}

routerQueryData.prototype.projectTwinsAndVisual =async function(req,res) {
    var projectID=req.body.projectID
    var accountID=req.body.account
    var projectOwner=req.body.projectOwner


    var originalAccountDocument=await cosmosdbhelper.getDocByID("appuser","accountID",projectOwner,projectOwner)
    if(originalAccountDocument.length==0) res.status(400).send("Internal Error")
    originalAccountDocument=originalAccountDocument[0]
    var allUsers=[accountID]
    for(var i=0;i<originalAccountDocument.joinedProjects.length;i++){
        var oneProject=originalAccountDocument.joinedProjects[i]
        if(oneProject.id==projectID){
            allUsers=oneProject.shareWith
            allUsers.push(projectOwner)
            break;
        }
    }
    

    var queryStr='SELECT * FROM c where '
    queryStr+=`c.projectID='${projectID}'`
    queryStr+=` and c.type ='DTTwin'`
    var resultArr=[]
    try{
        var queryResult=await cosmosdbhelper.query('dtproject',queryStr)
        resultArr=resultArr.concat(queryResult)
    }catch(e){
        res.status(400).send(e.message)
    }

    for(var i=0;i<allUsers.length;i++){
        var oneAccount=allUsers[i]
        var queryStr='SELECT * FROM c where '
        queryStr+=`c.accountID='${oneAccount}'`
        queryStr+=` and c.projectID='${projectID}'`
        queryStr+=` and c.type IN ('visualSchema','Topology')`
        
        if(oneAccount!=accountID) queryStr+=` and c.isShared =true`
        
        try{
            var queryResult=await cosmosdbhelper.query('appuser',queryStr)
            resultArr=resultArr.concat(queryResult)
        }catch(e){
        }
    }

    res.send(resultArr)
}
    
routerQueryData.prototype.projectModels =async function(req,res) {
    var projectID=req.body.projectID
    var queryStr='SELECT * FROM c where '
    queryStr+=`c.projectID='${projectID}'`
    queryStr+=` and c.type ='DTModel'`
    try{
        var queryResult=await cosmosdbhelper.query('dtproject',queryStr)
        res.send(queryResult)
    }catch(e){
        res.status(400).send(e.message)
    }
}



module.exports = new routerQueryData().router