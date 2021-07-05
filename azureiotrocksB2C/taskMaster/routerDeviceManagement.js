const express = require("express");
const got = require('got');

function routerDeviceManagement(){
    this.router = express.Router();
    this.useRoute("changeModelIoTSettings","isPost")
    this.useRoute("provisionIoTDeviceTwin","isPost")
    this.useRoute("deprovisionIoTDeviceTwin","isPost")
}

routerDeviceManagement.prototype.useRoute=function(routeStr,isPost){
    this.router[(isPost)?"post":"get"]("/"+routeStr,(req,res)=>{
        this[routeStr](req,res)
    })
}

routerDeviceManagement.prototype.provisionIoTDeviceTwin = async function(req,res){
    
}

routerDeviceManagement.prototype.deprovisionIoTDeviceTwin = async function(req,res){
    
}

routerDeviceManagement.prototype._provisionIoTDeviceTwin = async function(twinUUID,tags,desiredInDeviceTwin,accountID){
    try{
        var provisionDevicePayload={"deviceID":twinUUID,"tags":tags,"desiredProperties":desiredInDeviceTwin}
        await got.post(process.env.iothuboperationAPIURL+"controlPlane/provisionDevice", {json:provisionDevicePayload,responseType: 'json'});

        var postLoad={account:accountID,twinID:twinUUID,updateInfo:JSON.stringify({"IoTDeviceID":twinUUID})}
        var {body} = await got.post(process.env.dboperationAPIURL+"insertData/updateTwin", {json:postLoad,responseType: 'json'});
        return body
    }catch(e){
        console.error("IoT device provisioning fails: "+ twinUUID)
    }
}

routerDeviceManagement.prototype._deprovisionIoTDeviceTwin = async function(twinUUID){
    try{
        var deprovisionDevicePayload={"deviceID":twinUUID}
        await got.post(process.env.iothuboperationAPIURL+"controlPlane/deprovisionDevice", {json:provisionDevicePayload,responseType: 'json'});

        var postLoad={account:accountID,twinID:twinUUID,updateInfo:JSON.stringify({"IoTDeviceID":twinUUID})}
        var {body} = await got.post(process.env.dboperationAPIURL+"insertData/updateTwin", {json:postLoad,responseType: 'json'});
        return body
    }catch(e){
        console.error("IoT device provisioning fails: "+ twinUUID)
    }
}


routerDeviceManagement.prototype.changeModelIoTSettings = async function(req,res){
    var postLoad=req.body;
    postLoad.account=req.authInfo.account
    
    try{
        var {body} = await got.post(process.env.dboperationAPIURL+"insertData/updateModel", {json:postLoad,responseType: 'json'});
    }catch(e){
        res.status(e.response.statusCode).send(e.response.body);
        return;
    }

    var updatedModelDoc=body.updatedModelDoc;
    var twins= body.twins //[{id:..,IoTDeviceID:...,displayName:...}...]
    var returnDBTwins=[]
    
    if(updatedModelDoc.isIoTDeviceModel){
        //provision each device to iot hub
        twins.forEach(aTwin => {
            var iotTwinID= aTwin.IoTDeviceID
            if(iotTwinID!=null && iotTwinID!="") {
                return; //the twin has been provisioned to iot hub
            }
            var twinDisplayName=aTwin.displayName
            var twinID= aTwin.id;
            var iotDeviceTags={
                "app":"azureiotrocks",
                "twinName":twinDisplayName,
                "owner":req.authInfo.account,
                "modelID":updatedModelDoc.id
            }
            var provisionedTwinDoc = this._provisionIoTDeviceTwin(twinID,iotDeviceTags,req.body.desiredInDeviceTwin,req.authInfo.account)
            returnDBTwins.push(provisionedTwinDoc)
        });
    }else{
        //deprovision each device off iot hub
        twins.forEach(aTwin => {
            var iotTwinID= aTwin.IoTDeviceID
            if(iotTwinID==null || iotTwinID=="") {
                return; //the twin has been deprovisioned off iot hub
            }
            var twinID= aTwin.id;
            var deprovisionedTwinDoc = this._deprovisionIoTDeviceTwin(twinID)
            returnDBTwins.push(deprovisionedTwinDoc)
        });
    }

    res.send({"updatedModelDoc":updatedModelDoc,"DBTwins":returnDBTwins})
}


module.exports = new routerDeviceManagement().router