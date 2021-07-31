const express = require("express");
const iothubHelper=require("./iothubHelper")

function routerControlPlane(){
    this.router = express.Router();
    this.useRoute("provisionDevice","post")
    this.useRoute("deprovisionDevice","post")
    this.useRoute("updateDeviceDesiredProperties","post")

    this.useRoute("test")
}

routerControlPlane.prototype.useRoute=function(routeStr,isPost){
    this.router[(isPost)?"post":"get"]("/"+routeStr,(req,res)=>{
        this[routeStr](req,res)
    })
}

routerControlPlane.prototype.deprovisionDevice =async function(req,res) {
    var deviceID=req.body.deviceID
    try{
        await iothubHelper.iothubRegistry.delete(deviceID)
        res.end()
    }catch(e){
        res.status(400).send(e.message)
    }
}

routerControlPlane.prototype.provisionDevice =async function(req,res) {
    var deviceID=req.body.deviceID
    var tags=req.body.tags
    var desiredProperties= req.body.desiredProperties

    /*
    try{
        try{
            await iothubHelper.iothubRegistry.get(deviceID)
        }catch(e){ //if the device is not registered yet, really provision it
            await iothubHelper.iothubRegistry.create({"deviceId":deviceID})
            await iothubHelper.iothubRegistry.updateTwin(deviceID
            ,{
                "tags":tags,
                "properties":{
                    "desired":desiredProperties
                }
            }
            ,"*")
        }
        res.end()
    }catch(e){
        res.status(400).send(e.message)
    }
    */

    try{
        try{
            await iothubHelper.iothubRegistry.get(deviceID)
        }catch(e){ //if the device is not registered yet, really provision it
            await iothubHelper.iothubRegistry.create({"deviceId":deviceID})
            await iothubHelper.iothubRegistry.updateTwin(deviceID
            ,{
                "tags":tags,
                "properties":{
                    "desired":desiredProperties
                }
            }
            ,"*")
        }
        res.send(`Device created with ID ${deviceID}. Expiry: ${iothubHelper.iothubRegistry._restApiClient._accessToken.expiresOnTimestamp}`) //
    }catch(e){
        res.status(400)
        if (Date.now() > iothubHelper.iothubRegistry._restApiClient._accessToken.expiresOnTimestamp) {
            res.send(`USED EXPIRED TOKEN (${iothubHelper.iothubRegistry._restApiClient._accessToken.expiresOnTimestamp}): ${e}`)
        } else {
            res.send(`Device create failed (${iothubHelper.iothubRegistry._restApiClient._accessToken.expiresOnTimestamp}): ${e}`)
        }
    }



}

routerControlPlane.prototype.updateDeviceDesiredProperties=async function(req,res){
    var deviceID=req.body.deviceID
    var desiredProperties= req.body.desiredProperties

    try{
        var oldDeviceTwin=await iothubHelper.iothubRegistry.getTwin(deviceID)
        var oldDesired=oldDeviceTwin.responseBody.properties.desired

        for(var ind in oldDesired){
            if(ind[0] == "$") continue; //$metadata and $version, system created key
            if(desiredProperties[ind]!=null) desiredProperties[ind] = oldDesired[ind]  //inherit the old desired value
            else desiredProperties[ind]=null //remove unused desired properties
        }

        await iothubHelper.iothubRegistry.updateTwin(deviceID
        ,{
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