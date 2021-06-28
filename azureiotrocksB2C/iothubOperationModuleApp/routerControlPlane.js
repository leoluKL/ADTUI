const express = require("express");
const iothubHelper=require("./iothubHelper")

function routerControlPlane(){
    this.router = express.Router();
    this.useRoute("provisionDevice","post")

    this.useRoute("test")
}

routerControlPlane.prototype.useRoute=function(routeStr,isPost){
    this.router[(isPost)?"post":"get"]("/"+routeStr,(req,res)=>{
        this[routeStr](req,res)
    })
}

routerControlPlane.prototype.provisionDevice =async function(req,res) {
    var deviceID=req.body.deviceID
    var tags=req.body.tags
    var desiredProperties= req.body.desiredProperties

    try{
        await iothubHelper.iothubRegistry.create({"deviceId":deviceID})
        await iothubHelper.iothubRegistry.updateTwin(deviceID
        ,{
            "tags":tags,
            "properties":{
                "desired":desiredProperties
            }
        }
        ,"*")
        res.end()
    }catch(e){
        res.status(400).send(e.message)
    }
    
}

routerControlPlane.prototype.test=async function(req,res){
    var re= await iothubHelper.iothubRegistry.list()
    var devices=re.responseBody
    var arr=[]
    devices.forEach(oneDevice=>{
        arr.push(oneDevice.deviceId)
        arr.push(oneDevice.authentication)
    })
    res.send(arr)

    //test adding a device registry
    //var re = await iothubHelper.iothubRegistry.create({"deviceId":"devtest1"})
    //console.log(re)
    //var re = await iothubHelper.iothubRegistry.delete("devtest1")
    //console.log(re.responseBody)

    //var re=await iothubHelper.iothubRegistry.getTwin("ttt")
    //console.log(re.responseBody)

    /*
    var re= await iothubHelper.iothubRegistry.updateTwin('ttt'
        ,{
            "tags":{"app":"azureiotrocks"},
            "properties":{
                "desired":{"prop1":100}
            }
        }
        ,"*")
    console.log(re.responseBody)
    */

}


module.exports = new routerControlPlane().router