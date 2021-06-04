const express = require("express");
const got = require('got');

function routerDigitalTwin(){
    this.router = express.Router();
    this.useRoute("fetchUserData")
}

routerDigitalTwin.prototype.useRoute=function(routeStr,isPost){
    this.router[(isPost)?"post":"get"]("/"+routeStr,(req,res)=>{
        this[routeStr](req,res)
    })
}

routerDigitalTwin.prototype.fetchUserData =async function(req,res) {
    //fetch digital twins, dtdl models and the visualization data (from both cosmosdb and ADT )
    var url = process.env.dboperationAPIURL
    var reqBody={
		account:req.authInfo.emails[0]
	}
    var {body} = await got.post(url+"queryData/userData", {json:reqBody,responseType: 'json'});

    //TODO:extract the models ID, twins ID and query models detail from ADT, skip twins detail as there maybe too many
    res.send(body)
}


module.exports = new routerDigitalTwin().router