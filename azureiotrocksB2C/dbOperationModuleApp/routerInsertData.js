const express = require("express");
const cosmosdbhelper = require('./cosmosdbhelper')

function routerInsertData(){
    this.router = express.Router();
    this.useRoute("newModels","post")
    this.useRoute("newTwin","post")
}

routerInsertData.prototype.useRoute=function(routeStr,isPost){
    this.router[(isPost)?"post":"get"]("/"+routeStr,(req,res)=>{
        this[routeStr](req,res)
    })
}

routerInsertData.prototype.newModels =async function(req,res) {
    var accountID=req.body.account
    var models=JSON.parse(req.body.models)

    try {
        var newModelDocuments = []
        models.forEach(element => {
            var aDocument = {
                type: "DTModel", "accountID": accountID, displayName: element["displayName"]
                , creationTS: new Date().getTime(), id: element["@id"]
            }
            newModelDocuments.push(aDocument)
        });


        await cosmosdbhelper.insertRecords("appuser", newModelDocuments)
        res.end()
    } catch (e) {
        res.status(400).send(e.message)
    }
}

routerInsertData.prototype.newTwin =async function(req,res) {
    var accountID=req.body.account
    var ADTTwin=req.body.ADTTwin
    var displayName=req.body.displayName

    try {
        var aDocument = {
            type: "DTTwin", "accountID": accountID, "displayName": displayName
            , creationTS: new Date().getTime(), id: ADTTwin["$dtId"]
            ,"modelID":ADTTwin['$metadata']['$model']
        }
        var re = await cosmosdbhelper.insertRecord("appuser", aDocument)
        res.send(aDocument)
    } catch (e) {
        res.status(400).send(e.message)
    }
}



module.exports = new routerInsertData().router