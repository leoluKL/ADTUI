const msalHelper=require("../msalHelper")
const globalCache = require("../sharedSourceFiles/globalCache");

function serviceWorkerHelper(){
    this.projectID=null
    this.listAllLiveMonitor={}
    setInterval(()=>{
        if(this.projectID==null) return;
        this.subscribeImportantEvent(this.projectID)

        for(var ind in this.listAllLiveMonitor){
            var aLiveProperty=this.listAllLiveMonitor[ind]
            this.subscribeLiveProperty(aLiveProperty.twinID,aLiveProperty.propertyPath)
        }

    },8*60*1000) //every 8 minute renew the service worker subscription
}

serviceWorkerHelper.prototype.subscribeImportantEvent = async function (projectID) {    
    var subscription=await this.createSubscription()
    if(subscription==null) return;
    try {
        var payload={
            type:'events',
            serviceWorkerSubscription:JSON.stringify(subscription)
        }
        msalHelper.callAPI("digitaltwin/serviceWorkerSubscription", "POST", payload, "withProjectID")
    } catch (e) {
        console.log(e)
    }
}

serviceWorkerHelper.prototype.subscribeLiveProperty = async function (twinID,propertyPath) {    
    var subscription=await this.createSubscription()
    if(subscription==null) return;
    try {
        var payload={
            type:'propertyValue',
            serviceWorkerSubscription:JSON.stringify(subscription),
            twinID:twinID,
            propertyPath:propertyPath
        }
        msalHelper.callAPI("digitaltwin/serviceWorkerSubscription", "POST", payload, "withProjectID")
    } catch (e) {
        console.log(e)
    }
}

serviceWorkerHelper.prototype.createSubscription = async function () {
    if (!('serviceWorker' in navigator)) return null;
    //this public key should be the one used in backend server side for pushing message (in azureiotrocksfunction)
    const publicVapidKey = 'BCxvFqk0czIkCTblAMy80fMWTj2WaAkeXCyp98-S2MiVrTL59u046eLRrTBImo9ZCWAQ3Yqj_7PwEOuyhDmC-WY';
    var subscription = null
    try {
        const registration = await navigator.serviceWorker.register('/worker.js', { scope: '/' });
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: publicVapidKey
        });
        navigator.serviceWorker.onmessage = (e)=> {
            this.processLiveMessage(e.data)
            this.broadcastMessage({ "message": "liveData","body":e.data })
        };
    } catch (e) {
        console.log(e)
    }
    return subscription;
}

serviceWorkerHelper.prototype.processLiveMessage=function(msgBody){
    console.log(msgBody)
    if(msgBody.connectionState && msgBody.projectID==globalCache.currentProjectID){
        var twinID=msgBody.twinID
        var twinDBInfo=globalCache.DBTwins[twinID]
        if(msgBody.connectionState=="deviceConnected") twinDBInfo.connectState=true
        else twinDBInfo.connectState=false
        //console.log(msgBody)
    }
}

serviceWorkerHelper.prototype.rxMessage=function(msgPayload){
    if(msgPayload.message=="projectIsChanged"){
        for(var ind in this.listAllLiveMonitor) delete this.listAllLiveMonitor[ind]
        this.projectID=msgPayload.projectID
        this.subscribeImportantEvent(msgPayload.projectID)
    }else if(msgPayload.message=="addLiveMonitor"){
        var str=msgPayload.twinID+"."+msgPayload.propertyPath.join(".")
        this.listAllLiveMonitor[str]=msgPayload
        this.subscribeLiveProperty(msgPayload.twinID,msgPayload.propertyPath)
    }else if(msgPayload.message=="removeLiveMonitor"){
        var str=msgPayload.twinID+"."+msgPayload.propertyPath.join(".")
        delete this.listAllLiveMonitor[str]
    }
}

module.exports = new serviceWorkerHelper();