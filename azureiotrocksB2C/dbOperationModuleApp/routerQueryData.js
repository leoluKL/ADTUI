const express = require("express");
const cosmosdbhelper = require('./cosmosdbhelper')

function routerQueryData(){
    this.router = express.Router();
    this.useRoute("userData","post")
    this.useRoute("projectData","post")
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
    queryStr+=` and c.type IN ('user','visualSchema','Topology')`
    try{
        var queryResult=await cosmosdbhelper.query('appuser',queryStr)
        res.send(queryResult)
    }catch(e){
        res.status(400).send(e.message)
    }
    
}

routerQueryData.prototype.projectData =async function(req,res) {
    var projectID=req.body.projectID
    var queryStr='SELECT * FROM c where '
    queryStr+=`c.projectID='${projectID}'`
    try{
        var queryResult=await cosmosdbhelper.query('dtproject',queryStr)
        res.send(queryResult)
    }catch(e){
        res.status(400).send(e.message)
    }
    
}



module.exports = new routerQueryData().router