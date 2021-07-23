const express = require("express");
const got = require('got');
const jwt = require('njwt')

function routerAccountManagement(){
    this.router = express.Router();
    this.useRoute("fetchUserAccount")
    this.useRoute("fetchUserData")
    this.useRoute("changeOwnProjectName","post")
    this.useRoute("shareProjectTo","post")
    this.useRoute("newProjectTo","post")
    this.useRoute("deleteProjectTo","post")
    this.useRoute("notShareProjectTo","post")
    this.useRoute("setProjectDefaultLayout","post")
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
    //TODO: delete whole project....
    res.status(400).send("Deleting project is not available yet");
}

routerAccountManagement.prototype.fetchUserAccount =async function(req,res) { //this is for main UI interface, not going into any functionality module (digital twin, device management etc.) yet
    //var url = "http://localhost:5001/"
    var reqBody={
		account:req.authInfo.account,
        name:req.authInfo.name,
        country:req.authInfo.country,
        idp:req.authInfo.idp
	}
    try{
        var {body} = await got.post(process.env.dboperationAPIURL+"userAccount/basic", {json:reqBody,responseType: 'json'});
        res.send(body)
    }catch(e){
        res.status(e.response.statusCode).send(e.response.body);
    }  
}

routerAccountManagement.prototype.fetchUserData =async function(req,res) {
    //fetch user account infomation and generate JWT of the joined projects
    var reqBody={ account:req.authInfo.account}
    try{
        var {body} = await got.post(process.env.dboperationAPIURL+"queryData/userData", {json:reqBody,responseType: 'json'});
    }catch(e){
        res.status(e.response.statusCode).send(e.response.body);
        return;
    }

    //get the joinedProject JWT and send it back to frontend
    var userDetail=null
    for(var i=0;i<body.length;i++){
        if(body[i].type=="user") {
            userDetail=body[i]
            break;
        }
    }
    if(userDetail && userDetail.joinedProjects){
        var projects=userDetail.joinedProjects
        var projectClaim={"availableProjects":{}}
        projects.forEach(oneProject=>{
            projectClaim.availableProjects[oneProject.id]=oneProject
        })
        const token = jwt.create(projectClaim, process.env.joinedProjectsJWTCreateSecret)
        token.setExpiration(new Date().getTime() + 3600*1000)
        body.push({type:"joinedProjectsToken","jwt":token.compact()})
    }

    res.send(body)
}

routerAccountManagement.prototype.setProjectDefaultLayout =async function(req,res) {
    var reqBody=req.body
    reqBody.account=req.authInfo.account
    try{
        await got.post(process.env.dboperationAPIURL+"userAccount/setDefaultLayout", {json:reqBody,responseType: 'json'});
        res.end()
    }catch(e){
        res.status(e.response.statusCode).send(e.response.body);
    }  
}


module.exports = new routerAccountManagement().router