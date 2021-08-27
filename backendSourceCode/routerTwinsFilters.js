const express = require("express");
const path = require('path')
const fs = require('fs')
const startFilterFile = path.join(__dirname,"../userGeneratedFiles/startFilters.txt");

function routerTwinsFilters(){
    this.router = express.Router();
    this.useRoute("readStartFilters")
    this.useRoute("saveStartFilters","isPost")
}

routerTwinsFilters.prototype.useRoute=function(routeStr,isPost){
    this.router[(isPost)?"post":"get"]("/"+routeStr,(req,res)=>{
        this[routeStr](req,res)
    })
}

routerTwinsFilters.prototype.readStartFilters=function(req,res){
    fs.readFile(startFilterFile, (err, data) => {
        if (err) {
            res.end();
        } else {
            var data = JSON.parse(data);
            res.send(data)
        }
    })
}

routerTwinsFilters.prototype.saveStartFilters=function(req,res){
    var filters=req.body.filters
    fs.writeFile(startFilterFile, JSON.stringify(filters), err => {if(err) console.log(err) });
}

module.exports = () => { return (new routerTwinsFilters()).router }