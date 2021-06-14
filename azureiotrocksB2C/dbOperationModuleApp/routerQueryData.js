const express = require("express");
const cosmosdbhelper = require('./cosmosdbhelper')

function routerQueryData(){
    this.router = express.Router();
    this.useRoute("userData","post")
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
    queryStr+=` and c.type IN ('DTModel', 'DTTwin','visualSchema','Topology')`
    try{
        var queryResult=await cosmosdbhelper.query('appuser',queryStr)
        res.send(queryResult)
    }catch(e){
        res.status(400).send(e.message)
    }
    
}



module.exports = new routerQueryData().router