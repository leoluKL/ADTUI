const express = require("express");
const cosmosdbhelper = require('./cosmosdbhelper')

function routerUserAccount(){
    this.router = express.Router();
    this.useRoute("basic","post")
    this.useRoute("checkTwinName","post")
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
        function uuidv4() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
        var firstProjectID=uuidv4()
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



module.exports = new routerUserAccount().router