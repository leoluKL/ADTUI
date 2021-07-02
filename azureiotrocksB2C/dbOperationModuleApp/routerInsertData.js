const express = require("express");
const cosmosdbhelper = require('./cosmosdbhelper')

function routerInsertData(){
    this.router = express.Router();
    this.useRoute("newModels","post")
    this.useRoute("updateModel","post")
    this.useRoute("updateTwin","post")
    this.useRoute("newTwin","post")
    this.useRoute("updateVisualSchema","post")
    this.useRoute("updateTopologySchema","post")
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

routerInsertData.prototype.updateModel =async function(req,res) {
    var accountID=req.body.account
    var modelID=req.body.modelID
    var updateInfo=JSON.parse(req.body.updateInfo)

    try {
        var originalDocument=await cosmosdbhelper.getDocByID("appuser","accountID",accountID,modelID)
        if(originalDocument.length==0) res.status(400).send("model "+modelID+" is not found!")
        var newModelDocument = originalDocument[0]
        for(var ind in updateInfo){
            newModelDocument[ind]=updateInfo[ind]
        }
        var updatedModelDoc=await cosmosdbhelper.insertRecord("appuser", newModelDocument)
    } catch (e) {
        res.status(400).send(e.message)
    }

    //query out all the twins of this model and send back the twins ID
    var queryStr='SELECT c.id,c.IoTDeviceID,c.displayName FROM c where '
    queryStr+=`c.accountID='${accountID}'`
    queryStr+=` and c.modelID = '${modelID}'`
    queryStr+=` and c.type = 'DTTwin'`
    try{
        var queryResult=await cosmosdbhelper.query('appuser',queryStr)
    }catch(e){
        res.status(400).send(e.message)
    }

    res.send({"updatedModelDoc":updatedModelDoc,"twins":queryResult})
}

routerInsertData.prototype.updateTwin =async function(req,res) {
    var accountID=req.body.account
    var twinID=req.body.twinID
    var updateInfo=JSON.parse(req.body.updateInfo)

    try {
        var originalDocument=await cosmosdbhelper.getDocByID("appuser","accountID",accountID,twinID)
        if(originalDocument.length==0) res.status(400).send("twin "+twinID+" is not found!")
        var newTwinDocument = originalDocument[0]
        for(var ind in updateInfo){
            newTwinDocument[ind]=updateInfo[ind]
        }
        var updatedTwinDoc=await cosmosdbhelper.insertRecord("appuser", newTwinDocument)
    } catch (e) {
        res.status(400).send(e.message)
    }
    res.send(updatedTwinDoc)
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
        await cosmosdbhelper.insertRecord("appuser", aDocument)

        res.send(aDocument)
    } catch (e) {
        res.status(400).send(e.message)
    }
}

routerInsertData.prototype.updateVisualSchema =async function(req,res) {
    var accountID=req.body.account
    var visualDefinitionJson = JSON.parse(req.body.visualDefinitionJson)
    try {
        var re=await cosmosdbhelper.insertRecord("appuser",{
            id:"VisualSchema.default"
            ,"type":"visualSchema"
            ,"accountID":accountID
            ,"name":"default"
            ,"detail":visualDefinitionJson
        })
        res.end()
    } catch (e) {
        res.status(400).send(e.message)
    }
}

routerInsertData.prototype.updateTopologySchema =async function(req,res) {
    var accountID=req.body.account
    var layouts=req.body.layouts

    try {
        for(var layoutName in layouts){
            var content=JSON.parse(layouts[layoutName])
            var re=await cosmosdbhelper.insertRecord("appuser",{
                id:"TopoSchema."+layoutName
                ,"type":"Topology"
                ,"accountID":accountID
                ,"name":layoutName
                ,"detail":content
            })
        }
        res.end()
    } catch (e) {
        res.status(400).send(e.message)
    }
}





module.exports = new routerInsertData().router