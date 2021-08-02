'use strict';
const globalAppSettings = require("../globalAppSettings.js");
const msalHelper=require("../msalHelper")
const deviceManagementMainToolbar = require("./deviceManagementMainToolbar")
const modelEditorDialog = require("../sharedSourceFiles/modelEditorDialog")
const modelIoTSettingDialog= require("./modelIoTSettingDialog")
const twinInfoPanel= require("./twinInfoPanel");
const modelManagerDialog = require("../sharedSourceFiles/modelManagerDialog")
const twinsList=require("./twinsList")
const newTwinDialog=require("../sharedSourceFiles/newTwinDialog");
const projectSelectionDialog=require("./projectSelectionDialog")
const serviceWorkerHelper=require("../sharedSourceFiles/serviceWorkerHelper")
const globalCache = require("../sharedSourceFiles/globalCache")

function deviceManagementUI() {
    deviceManagementMainToolbar.render()

    this.myMSALObj = new msal.PublicClientApplication(globalAppSettings.msalConfig);

    this.broadcastMessage()

    var theAccount=msalHelper.fetchAccount();
    if(theAccount==null && !globalAppSettings.isLocalTest) window.open(globalAppSettings.logoutRedirectUri,"_self")

    this.initData()
}

deviceManagementUI.prototype.initData=async function(){
    try{
        await msalHelper.reloadUserAccountData()
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
        return
    }
    projectSelectionDialog.popup()
}

deviceManagementUI.prototype.broadcastMessage=function(source,msgPayload){
    var componentsArr=[modelManagerDialog,modelEditorDialog,deviceManagementMainToolbar,twinsList,newTwinDialog,modelIoTSettingDialog,twinInfoPanel,projectSelectionDialog,serviceWorkerHelper,globalCache]

    if(source==null){
        for(var i=0;i<componentsArr.length;i++){
            var theComponent=componentsArr[i]
            this.assignBroadcastMessage(theComponent)
        }
    }else{
        for(var i=0;i<componentsArr.length;i++){
            var theComponent=componentsArr[i]
            if(theComponent.rxMessage && theComponent!=source) theComponent.rxMessage(msgPayload)
        }
    }
}
deviceManagementUI.prototype.assignBroadcastMessage=function(uiComponent){
    uiComponent.broadcastMessage=(msgObj)=>{this.broadcastMessage(uiComponent,msgObj)}
}


module.exports = new deviceManagementUI();