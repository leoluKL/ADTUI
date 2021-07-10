const express = require("express");
const got = require('got');

function routerAccountManagement(){
    this.router = express.Router();
    this.useRoute("fetchUserAccount")
    this.useRoute("changeOwnProjectName","post")
    this.useRoute("shareProjectTo","post")
    this.useRoute("newProjectTo","post")
    this.useRoute("deleteProjectTo","post")
    this.useRoute("notShareProjectTo","post")
}

routerAccountManagement.prototype.useRoute=function(routeStr,isPost){
    this.router[(isPost)?"post":"get"]("/"+routeStr,(req,res)=>{
        this[routeStr](req,res)
    })
}

routerAccountManagement.prototype.changeOwnProjectName =async function(req,res) {
    var reqBody=req.body
    reqBody.requestFromAccount=req.authInfo.account
    try{
        var {body} = await got.post(process.env.dboperationAPIURL+"userAccount/changeOwnProjectName", {json:reqBody,responseType: 'json'});
        res.send(body)
    }catch(e){
        res.status(e.response.statusCode).send(e.response.body);
    }  
}

routerAccountManagement.prototype.shareProjectTo =async function(req,res) {
    var reqBody=req.body
    reqBody.requestFromAccount=req.authInfo.account
    try{
        var {body} = await got.post(process.env.dboperationAPIURL+"userAccount/shareProjectTo", {json:reqBody,responseType: 'json'});
        res.send(body)
    }catch(e){
        res.status(e.response.statusCode).send(e.response.body);
    }  
}
routerAccountManagement.prototype.newProjectTo =async function(req,res) {
    var reqBody=req.body
    reqBody.account=req.authInfo.account
    try{
        var {body} = await got.post(process.env.dboperationAPIURL+"userAccount/newProjectTo", {json:reqBody,responseType: 'json'});
        res.send(body)
    }catch(e){
        res.status(e.response.statusCode).send(e.response.body);
    }  
}

routerAccountManagement.prototype.notShareProjectTo =async function(req,res) {
    var reqBody=req.body
    reqBody.requestFromAccount=req.authInfo.account
    try{
        var {body} = await got.post(process.env.dboperationAPIURL+"userAccount/notShareProjectTo", {json:reqBody,responseType: 'json'});
        res.send(body)
    }catch(e){
        res.status(e.response.statusCode).send(e.response.body);
    }  
}

routerAccountManagement.prototype.deleteProjectTo =async function(req,res) {
    //TODO:
    res.status(400).send("Deleting project is not available yet");
}

routerAccountManagement.prototype.fetchUserAccount =async function(req,res) {
    //var url = "http://localhost:5001/"
    var url = process.env.dboperationAPIURL
    var reqBody={
		account:req.authInfo.account,
        name:req.authInfo.name,
        country:req.authInfo.country,
        idp:req.authInfo.idp
	}
    try{
        var {body} = await got.post(url+"userAccount/basic", {json:reqBody,responseType: 'json'});
        res.send(body)
    }catch(e){
        res.status(e.response.statusCode).send(e.response.body);
    }  
}



module.exports = new routerAccountManagement().router