const express = require("express");
const path = require('path')
const fs = require('fs')
const startLayoutFile = path.join(__dirname,"../userGeneratedFiles/layout_"); //appendix with the adt instance name

function routerLayoutStore(){
    this.router = express.Router();
    this.useRoute("readLayouts","isPost")
    this.useRoute("saveLayouts","isPost")
}

routerLayoutStore.prototype.useRoute=function(routeStr,isPost){
    this.router[(isPost)?"post":"get"]("/"+routeStr,(req,res)=>{
        this[routeStr](req,res)
    })
}

routerLayoutStore.prototype.readLayouts=function(req,res){
    var adtInstanceName=req.body.adtName
    fs.readFile(startLayoutFile+adtInstanceName+".json", (err, data) => {
        if (err) {
            res.end();
        } else {
            var data = JSON.parse(data);
            res.send(data)
        }
    })
}

routerLayoutStore.prototype.saveLayouts=function(req,res){
    var adtInstanceName=req.body.adtName
    var layouts=req.body.layouts
    fs.writeFile(startLayoutFile+adtInstanceName+".json", layouts, err => {if(err) console.log(err) });
}

module.exports = () => { return (new routerLayoutStore()).router }