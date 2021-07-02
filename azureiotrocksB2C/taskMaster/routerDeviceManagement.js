const express = require("express");
const got = require('got');

function routerDeviceManagement(){
    this.router = express.Router();
    this.useRoute("changeModelIoTSettings","isPost")
}

routerDeviceManagement.prototype.useRoute=function(routeStr,isPost){
    this.router[(isPost)?"post":"get"]("/"+routeStr,(req,res)=>{
        this[routeStr](req,res)
    })
}

routerDeviceManagement.prototype.changeModelIoTSettings = async function(req,res){
    var postLoad=req.body;
    postLoad.account=req.authInfo.account
    
    try{
        var {body} = await got.post(process.env.dboperationAPIURL+"insertData/updateModel", {json:postLoad,responseType: 'json'});
        res.send(body);
    }catch(e){
        res.status(e.response.statusCode).send(e.response.body);
        return;
    }

    var updatedModelDoc=body.updatedModelDoc;
    var twinsID= body.twinsID //[{id:..}...]
    
    
    /*TODO: provision iot hub device if the model is an IoT device model
    if(req.body.isIoTDevice){
        var tags={
            "app":"azureiotrocks",
            "twinName":originTwinID,
            "owner":req.authInfo.account,
            "modelID":twinInfo["$metadata"]["$model"]
        }
        var desiredInDeviceTwin= req.body.desiredInDeviceTwin
        try{
            var provisionDevicePayload={"deviceID":twinUUID,"tags":tags,"desiredProperties":desiredInDeviceTwin}
            await got.post(process.env.iothuboperationAPIURL+"controlPlane/provisionDevice", {json:provisionDevicePayload,responseType: 'json'});
            haveIoTDetail=true;
        }catch(e){
            console.error("IoT device provisioning fails: "+ twinUUID)
        }
    }
    */
}


module.exports = new routerDeviceManagement().router