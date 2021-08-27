const express = require("express");
const path = require('path')
const fs = require('fs')
const visualDefinitionFile = path.join(__dirname,"../userGeneratedFiles/legend.json");

function routerVisualDefinition(){
    this.router = express.Router();
    this.useRoute("readVisualDefinition")
    this.useRoute("saveVisualDefinition","isPost")
}

routerVisualDefinition.prototype.useRoute=function(routeStr,isPost){
    this.router[(isPost)?"post":"get"]("/"+routeStr,(req,res)=>{
        this[routeStr](req,res)
    })
}

routerVisualDefinition.prototype.readVisualDefinition=function(req,res){
    fs.readFile(visualDefinitionFile, (err, data) => {
        if (err) {
            res.end();
        } else {
            var data = JSON.parse(data);
            res.send(data)
        }
    })
}

routerVisualDefinition.prototype.saveVisualDefinition=function(req,res){
    var visualDefinitionJson=req.body.visualDefinitionJson
    fs.writeFile(visualDefinitionFile, JSON.stringify(visualDefinitionJson), err => {if(err) console.log(err) });
    res.end()
}

module.exports = () => { return (new routerVisualDefinition()).router }