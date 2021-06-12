const express = require("express");
const cosmosdbhelper = require('./cosmosdbhelper')

function routerDeleteData(){
    this.router = express.Router();
    this.useRoute("deleteModel","post")
}

routerDeleteData.prototype.useRoute=function(routeStr,isPost){
    this.router[(isPost)?"post":"get"]("/"+routeStr,(req,res)=>{
        this[routeStr](req,res)
    })
}

routerDeleteData.prototype.deleteModel =async function(req,res) {
    var accountID=req.body.account
    var modelID=req.body.model

    try {
        await cosmosdbhelper.deleteRecord("appuser",accountID,modelID)
        res.end()
    } catch (e) {
        console.log(e)
        res.status(400).send(e.message)
    }
}


module.exports = new routerDeleteData().router