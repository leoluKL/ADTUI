const express = require("express");
const cosmosdbhelper = require('./cosmosdbhelper')

function routerUserAccount(){
    this.router = express.Router();
    this.useRoute("basic","post")
    this.useRoute("checkTwinName","post")
    this.useRoute("changeOwnProjectName","post")
    this.useRoute("shareProjectTo","post")
    this.useRoute("newProjectTo","post")
    this.useRoute("deleteProjectTo","post")
    this.useRoute("notShareProjectTo","post")
}

routerUserAccount.prototype.useRoute=function(routeStr,isPost){
    this.router[(isPost)?"post":"get"]("/"+routeStr,(req,res)=>{
        this[routeStr](req,res)
    })
}

routerUserAccount.prototype.checkTwinName =async function(req,res) {
    var accountID=req.body.account
    var checkName= req.body.checkName
    var queryStr='SELECT * FROM c where '
    queryStr+=`c.accountID='${accountID}'`
    queryStr+=` and c.type='DTTwin'`
    queryStr+=` and c.displayName='${checkName}'`
    try{
        var queryResult=await cosmosdbhelper.query('appuser',queryStr)
        if(queryResult.length==0) res.send(true)
        else res.send(false)
    }catch(e){
        res.status(400).send(e.message)
    }
}

routerUserAccount.prototype.uuidv4=function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

routerUserAccount.prototype.basic =async function(req,res) {
    var accountID=req.body.account
    var idp= req.body.idp
    var queryStr='SELECT * FROM c where '
    queryStr+=`c.accountID='${accountID}'`
    queryStr+=` and c.profile.idp='${idp}'`
    try{
        var queryResult=await cosmosdbhelper.query('appuser',queryStr)
    }catch(e){
        res.status(400).send(e.message)
        return;
    }
    

    if(queryResult.length==0){
        
        var firstProjectID=this.uuidv4()
        //create the new account record in database and return it
        queryResult.push({
            "id": accountID,
            "type":"user",
            "accountID": accountID,
            "profile": {
                "country": req.body.country,
                "name": req.body.name,
                "idp": idp
            },
            "joinedProjects":[
                {"id":firstProjectID,"name":"Project 1","owner":accountID}
            ]
        })
        cosmosdbhelper.insertRecord('appuser',queryResult[0])
    }
    res.send(queryResult[0])
}

routerUserAccount.prototype.newProjectTo =async function(req,res) {
    var ownerAccount=req.body.account
    var projectID= this.uuidv4()
    var projectName=req.body.projectName
    try{
        var accountDocument=await this.getUserAccountDocument(ownerAccount)
        var newProjectInfo={"id":projectID, "name": projectName, "owner": ownerAccount,"shareWith":[] }
        accountDocument.joinedProjects.push(newProjectInfo)
        await cosmosdbhelper.insertRecord("appuser",accountDocument)
        res.send(newProjectInfo)
    }catch(e){
        res.status(400).send(e.message);
        return;
    }
}

routerUserAccount.prototype.deleteProjectTo =async function(req,res) {
    //TODO: delete all related project data
}

routerUserAccount.prototype.notShareProjectTo = async function (req, res) {
    var requestFromAccount = req.body.requestFromAccount
    var notshareToAccount = req.body.notShareToAccount
    var projectID = req.body.projectID
    if(requestFromAccount==this.notShareProjectTo){
        res.status(400).send("Can not remove accessing to own project")
        return;
    }
    
    var ownerProjectInfo=null
    try{
        var ownerAccountDocument=await this.getUserAccountDocument(requestFromAccount)
        var joinedProjects=ownerAccountDocument.joinedProjects
        for(var i=0;i<joinedProjects.length;i++){
            var oneProject=joinedProjects[i]
            if(oneProject.id==projectID){
                if(oneProject.owner==requestFromAccount) ownerProjectInfo=oneProject
                break
            }
        }
        if(ownerProjectInfo==null) throw new Error(requestFromAccount+" is not authorized to change this project"); 
    }catch(e){
        res.status(400).send(e.message);
        return;
    }
    
    
    
    try {
        try{
            var accountDocument = await this.getUserAccountDocument(notshareToAccount)
        }catch(e){ //in case the target account does not exist
            res.end()
            return
        }
        
        var joinedProjects = accountDocument.joinedProjects
        for (var i = 0; i < joinedProjects.length; i++) {
            var oneProject = joinedProjects[i]
            if (oneProject.id == projectID) {
                joinedProjects.splice(i,1)
                break
            }
        }

        var theIndex=ownerProjectInfo.shareWith.indexOf(notshareToAccount) 
        if(theIndex!=-1){
            ownerProjectInfo.shareWith.splice(theIndex,1)
            await cosmosdbhelper.insertRecord("appuser",ownerAccountDocument)
        }

        await cosmosdbhelper.insertRecord("appuser", accountDocument)
        res.end()
    } catch (e) {
        res.status(400).send(e.message);
        return;
    }
}

routerUserAccount.prototype.shareProjectTo =async function(req,res) {
    var requestFromAccount=req.body.requestFromAccount
    var shareToAccount=req.body.shareToAccount
    var projectID= req.body.projectID

    var ownerProjectInfo=null
    try{
        var ownerAccountDocument=await this.getUserAccountDocument(requestFromAccount)
        var joinedProjects=ownerAccountDocument.joinedProjects
        for(var i=0;i<joinedProjects.length;i++){
            var oneProject=joinedProjects[i]
            if(oneProject.id==projectID){
                if(oneProject.owner==requestFromAccount) ownerProjectInfo=oneProject
                break
            }
        }
        if(ownerProjectInfo==null) throw new Error(requestFromAccount+" is not authorized to change this project"); 
    }catch(e){
        res.status(400).send(e.message);
        return;
    }

    try{
        var projectName=ownerProjectInfo.name
        var accountDocument=await this.getUserAccountDocument(shareToAccount)
        
        var joinedProjects=accountDocument.joinedProjects
        for(var i=0;i<joinedProjects.length;i++){
            var oneProject=joinedProjects[i]
            if(oneProject.id==projectID){
                res.end() //it is already shared to the target account
                return;
            }
        }
        ownerProjectInfo.shareWith.push(shareToAccount)
        accountDocument.joinedProjects.push( {"id":projectID, "name": projectName, "owner": requestFromAccount })
        await cosmosdbhelper.insertRecord("appuser",accountDocument)
        await cosmosdbhelper.insertRecord("appuser",ownerAccountDocument)
        res.end()
    }catch(e){
        res.status(400).send(e.message);
        return;
    }
}


routerUserAccount.prototype.getUserAccountDocument =async function(accountID) {
    var queryStr='SELECT * FROM c where '
    queryStr+=`c.accountID='${accountID}'`
    try{
        var queryResult=await cosmosdbhelper.query('appuser',queryStr)
        if(queryResult.length==0) throw new Error("account "+accountID+" does not exist"); 
        var wholeDocument=queryResult[0]
        return wholeDocument
    }catch(e){
        throw e
    }
}

routerUserAccount.prototype.getProjectNameIfAccountOwnProject =async function(accountID,projectID) {
    var projectName=null
    try{
        var accountDocument=await this.getUserAccountDocument(accountID)
        var joinedProjects=accountDocument.joinedProjects
        for(var i=0;i<joinedProjects.length;i++){
            var oneProject=joinedProjects[i]
            if(oneProject.id==projectID){
                if(oneProject.owner==accountID) projectName=oneProject.name
                break
            }
        }
    }catch(e){
        throw e
    }
    return projectName;
}

routerUserAccount.prototype.changeOwnProjectName =async function(req,res) {
    var requestFromAccount=req.body.requestFromAccount
    var projectID= req.body.projectID
    var accountIDs=req.body.accounts
    accountIDs.push(requestFromAccount)
    var newName=req.body.newProjectName
    try{
        var projectName=await this.getProjectNameIfAccountOwnProject(requestFromAccount,projectID)
        if(projectName==null){
            res.status(400).send(requestFromAccount+" is not authorized to change this project")
            return;
        }
    }catch(e){
        res.status(400).send(e.message);
        return;
    }
    var promiseArr=[]
    accountIDs.forEach(oneAccount=>{
        oneAccount=oneAccount.toLowerCase();
        promiseArr.push(this.changeProjectNameInOneAccount(oneAccount,projectID,newName))
    })
    try{
        var results=await Promise.allSettled(promiseArr);
        res.end()
    }catch(e){
        res.status(400).send(e.message);
    }
}

routerUserAccount.prototype.changeProjectNameInOneAccount =async function(accountID,projectID,newName) {
    try{
        var wholeDocument=await this.getUserAccountDocument(accountID)
        var joinedProjects=wholeDocument.joinedProjects
        for(var i=0;i<joinedProjects.length;i++){
            var oneProject=joinedProjects[i]
            if(oneProject.id==projectID){
                oneProject.name=newName
                break
            }
        }

        await cosmosdbhelper.insertRecord("appuser",wholeDocument)
    }catch(e){
        throw e
    }
}


module.exports = new routerUserAccount().router