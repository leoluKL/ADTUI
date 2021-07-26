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
    this.useRoute("setLayoutSharedFlag","post")
    this.useRoute("setVisualSchemaSharedFlag","post")
}

routerInsertData.prototype.useRoute=function(routeStr,isPost){
    this.router[(isPost)?"post":"get"]("/"+routeStr,(req,res)=>{
        this[routeStr](req,res)
    })
}

routerInsertData.prototype.newModels =async function(req,res) {
    var projectID=req.body.projectID
    var models=JSON.parse(req.body.models)

    try {
        var newModelDocuments = []
        models.forEach(element => {
            var aDocument = {
                type: "DTModel", "projectID": projectID, displayName: element["displayName"]
                , creationTS: new Date().getTime(), id: element["@id"]
            }
            newModelDocuments.push(aDocument)
        });


        await cosmosdbhelper.insertRecords("dtproject", newModelDocuments)
        res.end()
    } catch (e) {
        res.status(400).send(e.message)
    }
}

routerInsertData.prototype.updateModel =async function(req,res) {
    var projectID=req.body.projectID
    var modelID=req.body.modelID
    var updateInfo=JSON.parse(req.body.updateInfo)

    try {
        var originalDocument=await cosmosdbhelper.getDocByID("dtproject","projectID",projectID,modelID)
        if(originalDocument.length==0) res.status(400).send("model "+modelID+" is not found!")
        var newModelDocument = originalDocument[0]
        for(var ind in updateInfo){
            newModelDocument[ind]=updateInfo[ind]
        }
        var updatedModelDoc=await cosmosdbhelper.insertRecord("dtproject", newModelDocument)
    } catch (e) {
        res.status(400).send(e.message)
    }

    //query out all the twins of this model and send back the twins ID
    var queryStr='SELECT c.id,c.IoTDeviceID,c.displayName FROM c where '
    queryStr+=`c.projectID='${projectID}'`
    queryStr+=` and c.modelID = '${modelID}'`
    queryStr+=` and c.type = 'DTTwin'`
    try{
        var queryResult=await cosmosdbhelper.query('dtproject',queryStr)
    }catch(e){
        res.status(400).send(e.message)
    }

    res.send({"updatedModelDoc":updatedModelDoc,"twins":queryResult})
}

routerInsertData.prototype.updateTwin =async function(req,res) {
    var projectID=req.body.projectID
    var twinID=req.body.twinID
    var updateInfo=JSON.parse(req.body.updateInfo)

    try {
        var originalDocument=await cosmosdbhelper.getDocByID("dtproject","projectID",projectID,twinID)
        if(originalDocument.length==0) res.status(400).send("twin "+twinID+" is not found!")
        var newTwinDocument = originalDocument[0]
        for(var ind in updateInfo){
            newTwinDocument[ind]=updateInfo[ind]
        }
        var updatedTwinDoc=await cosmosdbhelper.insertRecord("dtproject", newTwinDocument)
    } catch (e) {
        res.status(400).send(e.message)
    }
    res.send(updatedTwinDoc)
}


routerInsertData.prototype.newTwin =async function(req,res) {
    var projectID=req.body.projectID
    var ADTTwin=req.body.ADTTwin
    var displayName=req.body.displayName

    try {
        var aDocument = {
            type: "DTTwin", "projectID": projectID, "displayName": displayName
            , creationTS: new Date().getTime(), id: ADTTwin["$dtId"]
            ,"modelID":ADTTwin['$metadata']['$model']
        }
        await cosmosdbhelper.insertRecord("dtproject", aDocument)

        res.send(aDocument)
    } catch (e) {
        res.status(400).send(e.message)
    }
}

routerInsertData.prototype.updateVisualSchema =async function(req,res) {
    var accountID=req.body.account
    var projectID=req.body.projectID
    var visualDefinitionJson = JSON.parse(req.body.visualDefinitionJson)
    try {
        var re=await cosmosdbhelper.insertRecord("appuser",{
            id:"VisualSchema."+projectID+".default"
            ,"type":"visualSchema"
            ,"accountID":accountID
            ,"projectID":projectID
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
    var projectID=req.body.projectID
    var layouts=req.body.layouts

    try {
        for(var layoutName in layouts){
            var content=JSON.parse(layouts[layoutName])
            var re=await cosmosdbhelper.insertRecord("appuser",{
                id:"TopoSchema."+projectID+"."+layoutName
                ,"type":"Topology"
                ,"accountID":accountID
                ,"projectID":projectID
                ,"name":layoutName
                ,"detail":content
            })
        }
        res.end()
    } catch (e) {
        res.status(400).send(e.message)
    }
}

routerInsertData.prototype.strToBool= function(str){
    if(str=="true") return true
    if(str=="false") return false
    return str
}

routerInsertData.prototype.setLayoutSharedFlag= async function(req,res){
    var ownerAccount=req.body.account
    var projectID=req.body.projectID
    var layoutName=req.body.layout
    var isShared=this.strToBool(req.body.isShared)

    try {
        var originalDocument=await cosmosdbhelper.getDocByID("appuser","accountID",ownerAccount,"TopoSchema."+projectID+"."+layoutName)
        if(originalDocument.length==0) res.status(400).send("Layout "+layoutName+" is not found!")
        var newLayoutDocument = originalDocument[0]
        newLayoutDocument["isShared"]=isShared
        await cosmosdbhelper.insertRecord("appuser", newLayoutDocument)
    } catch (e) {
        res.status(400).send(e.message)
    }
    res.end()
}

routerInsertData.prototype.setVisualSchemaSharedFlag= async function(req,res){
    var ownerAccount=req.body.account
    var projectID=req.body.projectID
    var visualSchemaName=req.body.visualSchema
    var isShared=this.strToBool(req.body.isShared)

    try {
        var originalDocument=await cosmosdbhelper.getDocByID("appuser","accountID",ownerAccount,"VisualSchema."+projectID+"."+visualSchemaName)
        if(originalDocument.length==0) res.status(400).send("VisualSchema "+visualSchemaName+" is not found!")
        var newDocument = originalDocument[0]
        newDocument["isShared"]=isShared
        await cosmosdbhelper.insertRecord("appuser", newDocument)
    } catch (e) {
        res.status(400).send(e.message)
    }
    res.end()
}



module.exports = new routerInsertData().router