(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const moduleSwitchDialog=require("../sharedSourceFiles/moduleSwitchDialog")
const modelManagerDialog = require("../sharedSourceFiles/modelManagerDialog")

function deviceManagementMainToolbar() {
}

deviceManagementMainToolbar.prototype.render = function () {
    this.modelIOBtn=$('<a class="w3-bar-item w3-button" href="#">Models</a>')

    $("#MainToolbar").empty()
    $("#MainToolbar").append(moduleSwitchDialog.modulesSidebar)
    $("#MainToolbar").append(moduleSwitchDialog.modulesSwitchButton,this.modelIOBtn)

    modelManagerDialog.showRelationVisualizationSettings=false
    this.modelIOBtn.on("click",()=>{ modelManagerDialog.popup() })
}

module.exports = new deviceManagementMainToolbar();
},{"../sharedSourceFiles/modelManagerDialog":10,"../sharedSourceFiles/moduleSwitchDialog":11}],2:[function(require,module,exports){
'use strict';
const globalAppSettings = require("../globalAppSettings.js");
const msalHelper=require("../msalHelper")
const deviceManagementMainToolbar = require("./deviceManagementMainToolbar")
const modelEditorDialog = require("../sharedSourceFiles/modelEditorDialog")
const modelManagerDialog = require("../sharedSourceFiles/modelManagerDialog")
const globalCache=require("../sharedSourceFiles/globalCache")
const twinsList=require("./twinsList")

function deviceManagementUI() {
    this.twinsList= new twinsList($("#TwinsList"))
    deviceManagementMainToolbar.render()

    this.myMSALObj = new msal.PublicClientApplication(globalAppSettings.msalConfig);

    this.broadcastMessage()

    var theAccount=msalHelper.fetchAccount();
    if(theAccount==null && !globalAppSettings.isLocalTest) window.open(globalAppSettings.logoutRedirectUri,"_self")

    globalCache.loadUserData().then(re=>{
        if(globalCache.DBModelsArr.length==0){
            //TODO: if there is no model at all, prompt user to create his first model
        }else{
            this.twinsList.refill()
        }
    })
}

deviceManagementUI.prototype.broadcastMessage=function(source,msgPayload){
    var componentsArr=[modelManagerDialog,modelEditorDialog,deviceManagementMainToolbar,this.twinsList]

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
},{"../globalAppSettings.js":5,"../msalHelper":6,"../sharedSourceFiles/globalCache":7,"../sharedSourceFiles/modelEditorDialog":9,"../sharedSourceFiles/modelManagerDialog":10,"./deviceManagementMainToolbar":1,"./twinsList":4}],3:[function(require,module,exports){
const globalCache = require("../sharedSourceFiles/globalCache");

function singleModelTwinsList(singleDBModel,parentTwinsList) {
    this.parentTwinsList=parentTwinsList
    this.info=singleDBModel
    this.childTwins={}
    this.name=singleDBModel.displayName;
    this.createDOM()
}

singleModelTwinsList.prototype.createDOM=function(){
    this.DOM=$("<div></div>")
    this.parentTwinsList.DOM.append(this.DOM)

    this.headerDOM=$('<button class="w3-button w3-block w3-light-grey w3-left-align w3-border-bottom"></button>')

    this.listDOM=$('<div class="w3-container w3-hide w3-border w3-padding-16"></div>')
    this.DOM.append(this.headerDOM,this.listDOM)

    this.headerDOM.on("click",(evt)=> {
        if(this.listDOM.hasClass("w3-show")) this.shrink()
        else this.expand()
        return false;
    });

    //fill in the twins under this model
    var twins=[]
    globalCache.DBTwinsArr.forEach(aTwin=>{
        if(aTwin.modelID==this.info.id) twins.push(aTwin)
    })
    twins.sort(function (a, b) { 
        var aName=a.displayName.toLowerCase()
        var bName=b.displayName.toLowerCase()
        return aName.localeCompare(bName) 
    });
    twins.forEach(aTwin=>{
        this.childTwins[aTwin.id]=new singleTwinIcon(aTwin,this)
    })

    this.refreshName()
}

singleModelTwinsList.prototype.expand=function(){
    this.listDOM.addClass("w3-show")
}
singleModelTwinsList.prototype.shrink=function(){
    this.listDOM.removeClass("w3-show")
}

singleModelTwinsList.prototype.refreshName=function(){
    this.headerDOM.empty()
    var nameDiv=$("<div class='w3-text-dark-gray' style='display:inline;padding-right:3px;vertical-align:middle;font-weight:bold;color:darkgray'></div>")
    nameDiv.text(this.name)

    var countTwins=0
    var countIoTDevices=0
    for(var ind in this.childTwins) {
        countTwins++
        if(this.childTwins[ind].twinInfo["IoTDeviceID"]!=null) countIoTDevices++
    }
    var numberlabel=$("<label class='w3-orange' style='display:inline;font-size:9px;padding:2px 4px;font-weight:normal;border-radius: 2px;'>"+countTwins+" twins</label>")
    var numberlabel2=$("<label class='w3-lime' style='display:inline;font-size:9px;padding:2px 4px;font-weight:normal;border-radius: 2px;'>"+countIoTDevices+" IoT Devices</label>")
    
    var addButton= $('<button class="w3-bar-item w3-button w3-red w3-hover-amber w3-right" style="margin-top:2px;font-size:1.2em;padding:4px 8px">+</button>')
    addButton.on("click",(e)=>{
        this.expand()
        return false
    })

    this.headerDOM.append(nameDiv,numberlabel,numberlabel2,addButton)
}

singleModelTwinsList.prototype.refreshTwinsIcon=function(){
    for(var twinID in this.childTwins) this.childTwins[twinID].redrawIcon()
}


//--------------------------------------------------------------------------------------

function singleTwinIcon(singleDBTwin,parentModelTwins) {
    this.twinInfo=singleDBTwin
    this.parentModelTwins=parentModelTwins
    this.DOM=$("<div class='w3-hover-amber'  style='width:80px;float:left;height:100px;margin:8px;cursor:default'/>")

    this.IoTLable=$("<div style='width:30%;text-align:center;border-radius: 3px;margin:5px 35%;height:15px;font-weight:bold;font-size:80%'>IoT</div>")

    this.iconDOM=$("<div style='width:30px;height:30px;margin:0 auto;margin-top:10px;position:relative'></div>")
    this.nameDOM=$("<div style='word-break: break-word;width:100%;text-align:center;margin-top:5px'>"+this.twinInfo.displayName+"</div>")
    this.redrawIcon()
    this.redrawIoTState()
    parentModelTwins.listDOM.append(this.DOM)
    this.DOM.append(this.IoTLable, this.iconDOM,this.nameDOM)
}

singleTwinIcon.prototype.redrawIoTState=function(){
    this.IoTLable.addClass("w3-gray")
    this.IoTLable.removeClass("w3-lime")
    this.IoTLable.css("opacity",0)

    if(this.twinInfo.IoTDeviceID!=null) {
        this.IoTLable.css("opacity",100) //use opacity to control so it holds its place even when it is no visible
        if(this.twinInfo.connectState) {
            this.IoTLable.removeClass("w3-gray")
            this.IoTLable.addClass("w3-lime")
        }
    }
}

singleTwinIcon.prototype.redrawIcon=function(){
    this.iconDOM.empty()
    var modelID= this.twinInfo.modelID;

    var visualJson=globalCache.visualDefinition["default"]
    var fillColor="gray"
    if(visualJson[modelID].color) fillColor=visualJson[modelID].color
    var dimension=30;
    if(visualJson[modelID].dimensionRatio){
        dimension*=parseFloat(visualJson[modelID].dimensionRatio)
        this.iconDOM.css({"width":dimension+"px","height":dimension+"px"})
    } 
    var shape="ellipse"
    if(visualJson[modelID].shape) shape=visualJson[modelID].shape
    var avarta=null
    if(visualJson[modelID].avarta) avarta=visualJson[modelID].avarta

    var imgSrc=this.shapeSvg(shape,fillColor)

    this.iconDOM.append($("<img src='data:image/svg+xml;utf8,"+imgSrc+"'></img>"))
    if(avarta){
        var avartaimg=$("<img style='position:absolute;left:0px;width:60%;margin:20%' src='"+avarta+"'></img>")
        this.iconDOM.append(avartaimg)
    }
    this.nameDOM.text()
}


singleTwinIcon.prototype.shapeSvg=function(shape,color){//round-rectangle":"▉","hexagon
    if(shape=="ellipse"){
        return '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" version="1.1" ><circle cx="50" cy="50" r="50"  fill="'+color+'"/></svg>'
    }else if(shape=="hexagon"){
        return '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" version="1.1" ><polygon points="50 0, 93.3 25, 93.3 75, 50 100, 6.7 75, 6.7 25"  fill="'+color+'" /></svg>'
    }else if(shape=="round-rectangle"){
        return '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" version="1.1" ><rect x="10" y="10" rx="10" ry="10" width="80" height="80" fill="'+color+'" /></svg>'
    }
}

module.exports = singleModelTwinsList;
},{"../sharedSourceFiles/globalCache":7}],4:[function(require,module,exports){
const msalHelper = require("../msalHelper")
const globalCache = require("../sharedSourceFiles/globalCache")
const singleModelTwinsList=require("./singleModelTwinsList")


function twinsList(DOM) {
    this.DOM=DOM
    this.singleModelTwinsListSet={}
}

twinsList.prototype.refill=function(){
    this.DOM.empty()
    for(var ind in this.singleModelTwinsListSet) delete this.singleModelTwinsListSet[ind]
    globalCache.DBModelsArr.forEach(oneModel=>{
        this.singleModelTwinsListSet[oneModel.id]=new singleModelTwinsList(oneModel,this,this.DOM)
    })
}

twinsList.prototype.rxMessage=function(msgPayload){
    if(msgPayload.message=="visualDefinitionChange"){
        if(msgPayload.modelID) this.singleModelTwinsListSet[msgPayload.modelID].refreshTwinsIcon()
    }
}

module.exports = twinsList;
},{"../msalHelper":6,"../sharedSourceFiles/globalCache":7,"./singleModelTwinsList":3}],5:[function(require,module,exports){
const signupsigninname="B2C_1_singupsignin_spaapp1"
const b2cTenantName="azureiotb2c"

const url = new URL(window.location.href);

var strArr=window.location.href.split("?")
var isLocalTest=(strArr.indexOf("test=1")!=-1)

const globalAppSettings={
    "b2cSignUpSignInName": signupsigninname,
    "b2cScope_taskmaster":"https://"+b2cTenantName+".onmicrosoft.com/taskmastermodule/operation",
    "b2cScope_functions":"https://"+b2cTenantName+".onmicrosoft.com/azureiotrocksfunctions/basic",
    "logoutRedirectUri": url.origin+"/spaindex.html",
    "msalConfig":{
        auth: {
            clientId: "f4693be5-601b-4d0e-9208-c35d9ad62387",
            authority: "https://"+b2cTenantName+".b2clogin.com/"+b2cTenantName+".onmicrosoft.com/"+signupsigninname,
            knownAuthorities: [b2cTenantName+".b2clogin.com"],
            redirectUri: window.location.href
        },
        cache: {
            cacheLocation: "sessionStorage", 
            storeAuthStateInCookie: false
        },
        system: {
            loggerOptions: {
                loggerCallback: (level, message, containsPii) => {}
            }
        }
    },
    "isLocalTest":isLocalTest,
    "taskMasterAPIURI":((isLocalTest)?"http://localhost:5002/":"https://azureiotrockstaskmastermodule.azurewebsites.net/"),
    "functionsAPIURI":"https://azureiotrocksfunctions.azurewebsites.net/api/"
}

module.exports = globalAppSettings;
},{}],6:[function(require,module,exports){
const globalAppSettings=require("./globalAppSettings")

function msalHelper(){
    this.myMSALObj = new msal.PublicClientApplication(globalAppSettings.msalConfig);
}

msalHelper.prototype.signIn=async function(){
    try{
        var response= await this.myMSALObj.loginPopup({ scopes:[]  }) //globalAppSettings.b2cScopes
        if (response != null){
            this.setAccount(response.account)
            return response.account
        } 
        else  return this.fetchAccount()
    }catch(e){
        if(e.errorCode!="user_cancelled") console.log(e)
    }
}

msalHelper.prototype.setAccount=function(theAccount){
    if(theAccount==null)return;
    this.accountId = theAccount.homeAccountId;
    this.accountName = theAccount.username;
    this.userName=theAccount.name;
}

msalHelper.prototype.fetchAccount=function(noAnimation){
    const currentAccounts = this.myMSALObj.getAllAccounts();
    if (currentAccounts.length < 1) return;
    var foundAccount=null;
    for(var i=0;i<currentAccounts.length;i++){
        var anAccount= currentAccounts[i]
        if(anAccount.homeAccountId.toUpperCase().includes(globalAppSettings.b2cSignUpSignInName.toUpperCase())
            && anAccount.idTokenClaims.iss.toUpperCase().includes(globalAppSettings.msalConfig.auth.knownAuthorities[0].toUpperCase())
            && anAccount.idTokenClaims.aud === globalAppSettings.msalConfig.auth.clientId
        ){
            foundAccount= anAccount;
        }
    }
    this.setAccount(foundAccount)
    return foundAccount;
}


msalHelper.prototype.callAzureFunctionsService=async function(APIString,RESTMethod,payload){
    var headersObj={}
    var token=await this.getToken(globalAppSettings.b2cScope_functions)
    headersObj["Authorization"]=`Bearer ${token}`
    return new Promise((resolve, reject) => {
        var ajaxContent={
            type: RESTMethod || 'GET',
            "headers":headersObj,
            url: globalAppSettings.functionsAPIURI+APIString,
            contentType: "application/json; charset=utf-8",
            crossDomain: true,
            success: function (responseData, textStatus, jqXHR) {
                resolve(responseData)
            },
            error: function (responseData, textStatus, errorThrown) {
                reject(responseData)
            }
        }
        if(RESTMethod=="POST") ajaxContent.data= JSON.stringify(payload)
        $.ajax(ajaxContent);
    })
}

msalHelper.prototype.callAPI=async function(APIString,RESTMethod,payload){
    var headersObj={}
    if(!globalAppSettings.isLocalTest){
        try{
            var token=await this.getToken(globalAppSettings.b2cScope_taskmaster)
        }catch(e){
            window.open(globalAppSettings.logoutRedirectUri,"_self")
        }
        
        headersObj["Authorization"]=`Bearer ${token}`
    }

    return new Promise((resolve, reject) => {
        var ajaxContent={
            type: RESTMethod || 'GET',
            "headers":headersObj,
            url: globalAppSettings.taskMasterAPIURI+APIString,
            contentType: "application/json; charset=utf-8",
            crossDomain: true,
            success: function (responseData, textStatus, jqXHR) {
                resolve(responseData)
            },
            error: function (responseData, textStatus, errorThrown) {
                reject(responseData)
            }
        }
        if(RESTMethod=="POST") ajaxContent.data= JSON.stringify(payload)
        $.ajax(ajaxContent);
    })
}

msalHelper.prototype.getToken=async function(b2cScope){
    try{
        if(this.storedToken==null) this.storedToken={}
        if(this.storedToken[b2cScope]!=null){
            var currTime=parseInt(new Date().getTime()/1000)
            if(currTime+60 < this.storedToken[b2cScope].expire) return this.storedToken[b2cScope].accessToken
        }
        var tokenRequest={
            scopes: [b2cScope],
            forceRefresh: false, // Set this to "true" to skip a cached token and go to the server to get a new token
            account: this.myMSALObj.getAccountByHomeId(this.accountId)
        }
    
        var response = await this.myMSALObj.acquireTokenSilent(tokenRequest)
        if (!response.accessToken || response.accessToken === "") {
            throw new msal.InteractionRequiredAuthError;
        }
        this.storedToken[b2cScope]={"accessToken":response.accessToken,"expire":response.idTokenClaims.exp}
    }catch(error){
        if (error instanceof msal.InteractionRequiredAuthError) {
            // fallback to interaction when silent call fails
            var response=await this.myMSALObj.acquireTokenPopup(tokenRequest)
        } else {
            throw error;
        }
    }

    return response.accessToken;
}

module.exports = new msalHelper();
},{"./globalAppSettings":5}],7:[function(require,module,exports){
const msalHelper=require("../msalHelper")
const modelAnalyzer=require("./modelAnalyzer")

function globalCache(){
    this.storedOutboundRelationships = {}
    this.storedTwins = {}
    //stored data, seperately from ADT service and from cosmosDB service
    this.DBModelsArr = []
    this.modelIDMapToName={}
    this.modelNameMapToID={}

    this.DBTwinsArr = []
    this.twinIDMapToDisplayName={}

    this.currentLayoutName=null
    this.layoutJSON={}

    this.visualDefinition={"default":{}}
}

globalCache.prototype.loadUserData = async function () {
    try{
        var res=await msalHelper.callAPI("digitaltwin/fetchUserData")
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
        return;
    }
    var dbtwins=[]
    var dbmodels=[]
    res.forEach(element => {
        if(element.type=="visualSchema") {
            //TODO: now there is only one "default" schema to use
            this.visualDefinition[element.name]=element.detail
        }else if(element.type=="Topology") {
            this.layoutJSON[element.name]=element.detail
        }else if(element.type=="DTModel") dbmodels.push(element)
        else if(element.type=="DTTwin") dbtwins.push(element)
    });
    this.storeDBTwinsArr(dbtwins)
    this.storeDBModelsArr(dbmodels)
    //query detail of all models
    for(var ind in this.modelIDMapToName) delete this.modelIDMapToName[ind]
    for(var ind in this.modelNameMapToID) delete this.modelNameMapToID[ind]
    var modelIDs=[]
    this.DBModelsArr.forEach(oneModel=>{modelIDs.push(oneModel["id"])})
    try {
        var data = await msalHelper.callAPI("digitaltwin/listModelsForIDs", "POST", modelIDs)
        var tmpNameToObj = {}
        for (var i = 0; i < data.length; i++) {
            if (data[i]["displayName"] == null) data[i]["displayName"] = data[i]["@id"]
            if ($.isPlainObject(data[i]["displayName"])) {
                if (data[i]["displayName"]["en"]) data[i]["displayName"] = data[i]["displayName"]["en"]
                else data[i]["displayName"] = JSON.stringify(data[i]["displayName"])
            }
            if (tmpNameToObj[data[i]["displayName"]] != null) {
                //repeated model display name
                data[i]["displayName"] = data[i]["@id"]
            }
            tmpNameToObj[data[i]["displayName"]] = data[i]

            this.modelIDMapToName[data[i]["@id"]]=data[i]["displayName"]
            this.modelNameMapToID[data[i]["displayName"]]=data[i]["@id"]
        }
        modelAnalyzer.clearAllModels();
        modelAnalyzer.addModels(data)
        modelAnalyzer.analyze();
    } catch (e) {
        console.log(e)
        if(e.responseText) alert(e.responseText)
    }
}

globalCache.prototype.storeADTTwins=function(twinsData){
    twinsData.forEach((oneNode)=>{this.storeSingleADTTwin(oneNode)});
}

globalCache.prototype.storeSingleADTTwin=function(oneNode){
    this.storedTwins[oneNode["$dtId"]] = oneNode
    oneNode["displayName"]= this.twinIDMapToDisplayName[oneNode["$dtId"]]
}


globalCache.prototype.storeSingleDBTwin=function(DBTwin){
    for(var i=0;i<this.DBTwinsArr.length;i++){
        var oneDBTwin=this.DBTwinsArr[i]
        if(oneDBTwin["id"]==DBTwin["id"]){
            this.DBTwinsArr.splice(i,1)
            break;
        }
    }
    this.DBTwinsArr.push(DBTwin)

    this.twinIDMapToDisplayName[DBTwin["id"]]=DBTwin["displayName"]
}

globalCache.prototype.storeDBTwinsArr=function(DBTwinsArr){
    this.DBTwinsArr.length=0
    this.DBTwinsArr=this.DBTwinsArr.concat(DBTwinsArr)
    for(var ind in this.twinIDMapToDisplayName) delete this.twinIDMapToDisplayName[ind]
    this.DBTwinsArr.forEach(oneDBTwin=>{
        this.twinIDMapToDisplayName[oneDBTwin["id"]]=oneDBTwin["displayName"]
    })
}

globalCache.prototype.storeDBModelsArr=function(DBModelsArr){
    this.DBModelsArr.length=0
    this.DBModelsArr=this.DBModelsArr.concat(DBModelsArr)
    this.DBModelsArr.sort(function (a, b) { 
        var aName=a.displayName.toLowerCase()
        var bName=b.displayName.toLowerCase()
        return aName.localeCompare(bName) 
    });
}


globalCache.prototype.storeTwinRelationships=function(relationsData){
    relationsData.forEach((oneRelationship)=>{
        var twinID=oneRelationship['$sourceId']
        this.storedOutboundRelationships[twinID]=[]
    })

    relationsData.forEach((oneRelationship)=>{
        this.storedOutboundRelationships[oneRelationship['$sourceId']].push(oneRelationship)
    })
}

globalCache.prototype.storeTwinRelationships_append=function(relationsData){
    relationsData.forEach((oneRelationship)=>{
        if(!this.storedOutboundRelationships[oneRelationship['$sourceId']])
            this.storedOutboundRelationships[oneRelationship['$sourceId']]=[]
        this.storedOutboundRelationships[oneRelationship['$sourceId']].push(oneRelationship)
    })
}

globalCache.prototype.storeTwinRelationships_remove=function(relationsData){
    relationsData.forEach((oneRelationship)=>{
        var srcID=oneRelationship["srcID"]
        if(this.storedOutboundRelationships[srcID]){
            var arr=this.storedOutboundRelationships[srcID]
            for(var i=0;i<arr.length;i++){
                if(arr[i]['$relationshipId']==oneRelationship["relID"]){
                    arr.splice(i,1)
                    break;
                }
            }
        }
    })
}

module.exports = new globalCache();
},{"../msalHelper":6,"./modelAnalyzer":8}],8:[function(require,module,exports){
//This is a singleton class

function modelAnalyzer(){
    this.DTDLModels={}
    this.relationshipTypes={}
}

modelAnalyzer.prototype.clearAllModels=function(){
    //console.log("clear all model info")
    for(var id in this.DTDLModels) delete this.DTDLModels[id]
}

modelAnalyzer.prototype.resetAllModels=function(arr){
    for(var modelID in this.DTDLModels){
        var jsonStr=this.DTDLModels[modelID]["original"]
        this.DTDLModels[modelID]=JSON.parse(jsonStr)
        this.DTDLModels[modelID]["original"]=jsonStr
    }
}


modelAnalyzer.prototype.addModels=function(arr){
    arr.forEach((ele)=>{
        var modelID= ele["@id"]
        ele["original"]=JSON.stringify(ele)
        this.DTDLModels[modelID]=ele
    })
}


modelAnalyzer.prototype.recordAllBaseClasses= function (parentObj, baseClassID) {
    var baseClass = this.DTDLModels[baseClassID]
    if (baseClass == null) return;

    parentObj[baseClassID]=1

    var furtherBaseClassIDs = baseClass.extends;
    if (furtherBaseClassIDs == null) return;
    if(Array.isArray(furtherBaseClassIDs)) var tmpArr=furtherBaseClassIDs
    else tmpArr=[furtherBaseClassIDs]
    tmpArr.forEach((eachBase) => { this.recordAllBaseClasses(parentObj, eachBase) })
}

modelAnalyzer.prototype.expandEditablePropertiesFromBaseClass = function (parentObj, baseClassID) {
    var baseClass = this.DTDLModels[baseClassID]
    if (baseClass == null) return;
    if (baseClass.editableProperties) {
        for (var ind in baseClass.editableProperties) parentObj[ind] = baseClass.editableProperties[ind]
    }
    var furtherBaseClassIDs = baseClass.extends;
    if (furtherBaseClassIDs == null) return;
    if(Array.isArray(furtherBaseClassIDs)) var tmpArr=furtherBaseClassIDs
    else tmpArr=[furtherBaseClassIDs]
    tmpArr.forEach((eachBase) => { this.expandEditablePropertiesFromBaseClass(parentObj, eachBase) })
}

modelAnalyzer.prototype.expandValidRelationshipTypesFromBaseClass = function (parentObj, baseClassID) {
    var baseClass = this.DTDLModels[baseClassID]
    if (baseClass == null) return;
    if (baseClass.validRelationships) {
        for (var ind in baseClass.validRelationships) {
            if(parentObj[ind]==null) parentObj[ind] = this.relationshipTypes[ind][baseClassID]
        }
    }
    var furtherBaseClassIDs = baseClass.extends;
    if (furtherBaseClassIDs == null) return;
    if(Array.isArray(furtherBaseClassIDs)) var tmpArr=furtherBaseClassIDs
    else tmpArr=[furtherBaseClassIDs]
    tmpArr.forEach((eachBase) => { this.expandValidRelationshipTypesFromBaseClass(parentObj, eachBase) })
}

modelAnalyzer.prototype.expandEditableProperties=function(parentObj,dataInfo,embeddedSchema){
    dataInfo.forEach((oneContent)=>{
        if(oneContent["@type"]=="Relationship") return;
        if(oneContent["@type"]=="Property"
        ||(Array.isArray(oneContent["@type"]) && oneContent["@type"].includes("Property"))
        || oneContent["@type"]==null) {
            if(typeof(oneContent["schema"]) != 'object' && embeddedSchema[oneContent["schema"]]!=null) oneContent["schema"]=embeddedSchema[oneContent["schema"]]

            if(typeof(oneContent["schema"]) === 'object' && oneContent["schema"]["@type"]=="Object"){
                var newParent={}
                parentObj[oneContent["name"]]=newParent
                this.expandEditableProperties(newParent,oneContent["schema"]["fields"],embeddedSchema)
            }else if(typeof(oneContent["schema"]) === 'object' && oneContent["schema"]["@type"]=="Enum"){
                parentObj[oneContent["name"]]=oneContent["schema"]["enumValues"]
            }else{
                parentObj[oneContent["name"]]=oneContent["schema"]
            }           
        }
    })
}


modelAnalyzer.prototype.analyze=function(){
    //console.log("analyze model info")
    //analyze all relationship types
    for (var id in this.relationshipTypes) delete this.relationshipTypes[id]
    for (var modelID in this.DTDLModels) {
        var ele = this.DTDLModels[modelID]
        var embeddedSchema = {}
        if (ele.schemas) {
            var tempArr;
            if (Array.isArray(ele.schemas)) tempArr = ele.schemas
            else tempArr = [ele.schemas]
            tempArr.forEach((ele) => {
                embeddedSchema[ele["@id"]] = ele
            })
        }

        var contentArr = ele.contents
        if (!contentArr) continue;
        contentArr.forEach((oneContent) => {
            if (oneContent["@type"] == "Relationship") {
                if(!this.relationshipTypes[oneContent["name"]]) this.relationshipTypes[oneContent["name"]]= {}
                this.relationshipTypes[oneContent["name"]][modelID] = oneContent
                oneContent.editableRelationshipProperties = {}
                if (Array.isArray(oneContent.properties)) {
                    this.expandEditableProperties(oneContent.editableRelationshipProperties, oneContent.properties, embeddedSchema)
                }
            }
        })
    }

    //analyze each model's property that can be edited
    for(var modelID in this.DTDLModels){ //expand possible embedded schema to editableProperties, also extract possible relationship types for this model
        var ele=this.DTDLModels[modelID]
        var embeddedSchema={}
        if(ele.schemas){
            var tempArr;
            if(Array.isArray(ele.schemas)) tempArr=ele.schemas
            else tempArr=[ele.schemas]
            tempArr.forEach((ele)=>{
                embeddedSchema[ele["@id"]]=ele
            })
        }
        ele.editableProperties={}
        ele.validRelationships={}
        ele.includedComponents=[]
        ele.allBaseClasses={}
        if(Array.isArray(ele.contents)){
            this.expandEditableProperties(ele.editableProperties,ele.contents,embeddedSchema)

            ele.contents.forEach((oneContent)=>{
                if(oneContent["@type"]=="Relationship") {
                    ele.validRelationships[oneContent["name"]]=this.relationshipTypes[oneContent["name"]][modelID]
                }
            })
        }
    }

    for(var modelID in this.DTDLModels){//expand component properties
        var ele=this.DTDLModels[modelID]
        if(Array.isArray(ele.contents)){
            ele.contents.forEach(oneContent=>{
                if(oneContent["@type"]=="Component"){
                    var componentName=oneContent["name"]
                    var componentClass=oneContent["schema"]
                    ele.editableProperties[componentName]={}
                    this.expandEditablePropertiesFromBaseClass(ele.editableProperties[componentName],componentClass)
                    ele.includedComponents.push(componentName)
                } 
            })
        }
    }

    for(var modelID in this.DTDLModels){//expand base class properties to editableProperties and valid relationship types to validRelationships
        var ele=this.DTDLModels[modelID]
        var baseClassIDs=ele.extends;
        if(baseClassIDs==null) continue;
        if(Array.isArray(baseClassIDs)) var tmpArr=baseClassIDs
        else tmpArr=[baseClassIDs]
        tmpArr.forEach((eachBase)=>{
            this.recordAllBaseClasses(ele.allBaseClasses,eachBase)
            this.expandEditablePropertiesFromBaseClass(ele.editableProperties,eachBase)
            this.expandValidRelationshipTypesFromBaseClass(ele.validRelationships,eachBase)
        })
    }

    //console.log(this.DTDLModels)
    //console.log(this.relationshipTypes)
}


module.exports = new modelAnalyzer();
},{}],9:[function(require,module,exports){
const modelAnalyzer=require("./modelAnalyzer")
const simpleSelectMenu= require("./simpleSelectMenu")
const msalHelper=require("../msalHelper")
const globalCache = require("./globalCache")

function modelEditorDialog() {
    if(!this.DOM){
        this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:99" class="w3-card-2"></div>')
        $("body").append(this.DOM)
        this.DOM.hide()
    }
}

modelEditorDialog.prototype.popup = async function() {
    this.DOM.show()
    this.DOM.empty()
    this.contentDOM = $('<div style="width:665px"></div>')
    this.DOM.append(this.contentDOM)
    this.contentDOM.append($('<div style="height:40px" class="w3-bar w3-red"><div class="w3-bar-item" style="font-size:1.5em">Digital Twin Model Editor</div></div>'))
    var closeButton = $('<button class="w3-bar-item w3-button w3-right" style="font-size:2em;padding-top:4px">×</button>')
    this.contentDOM.children(':first').append(closeButton)
    closeButton.on("click", () => { this.DOM.hide() })

    var buttonRow=$('<div  style="height:40px" class="w3-bar"></div>')
    this.contentDOM.append(buttonRow)
    var importButton =$('<button class="w3-button w3-card w3-deep-orange w3-hover-light-green w3-right" style="height:100%">Import</button>')
    buttonRow.append(importButton)

    importButton.on("click", async () => {F
        var modelToBeImported = [this.dtdlobj]
        try {
            var response = await msalHelper.callAPI("digitaltwin/importModels", "POST", { "models": JSON.stringify(modelToBeImported) })

            alert("Model \"" + this.dtdlobj["displayName"] + "\" is created!")
            this.broadcastMessage({ "message": "ADTModelEdited" })
            modelAnalyzer.addModels(modelToBeImported) //add so immediatley the list can show the new models
            this.popup() //refresh content
        }catch(e){
            console.log(e)
            if(e.responseText) alert(e.responseText)
        }        
    })

    var lable=$('<div class="w3-bar-item w3-opacity" style="padding-right:5px;font-size:1.2em;">Model Template</div>')
    buttonRow.append(lable)
    var modelTemplateSelector=new simpleSelectMenu(" ",{withBorder:1,fontSize:"1.2em",colorClass:"w3-light-gray",buttonCSS:{"padding":"5px 10px"},"optionListHeight":300})
    buttonRow.append(modelTemplateSelector.DOM)
    modelTemplateSelector.callBack_clickOption=(optionText,optionValue)=>{
        modelTemplateSelector.changeName(optionText)
        this.chooseTemplate(optionValue)
    }
    modelTemplateSelector.addOption("New Model...","New")
    for(var modelName in modelAnalyzer.DTDLModels){
        modelTemplateSelector.addOption(modelName)
    }

    var panelHeight="450px"
    var row2=$('<div class="w3-cell-row" style="margin:2px"></div>')
    this.contentDOM.append(row2)
    var leftSpan=$('<div class="w3-card" style="padding:5px;width:330px;padding-right:5px;height:'+panelHeight+';overflow:auto"></div>')
    row2.append(leftSpan)
    this.leftSpan=leftSpan

    var rightSpan=$('<div class="w3-container w3-cell"></div>')
    row2.append(rightSpan) 
    var dtdlScriptPanel=$('<div class="w3-card-2 w3-white" style="overflow:auto;margin-top:2px;width:310px;height:'+panelHeight+'"></div>')
    rightSpan.append(dtdlScriptPanel)
    this.dtdlScriptPanel=dtdlScriptPanel

    modelTemplateSelector.triggerOptionIndex(0)
}

modelEditorDialog.prototype.chooseTemplate=function(tempalteName){
    if(tempalteName!="New"){
        this.dtdlobj=JSON.parse(modelAnalyzer.DTDLModels[tempalteName]["original"])
    }else{
        this.dtdlobj = {
            "@id": "dtmi:aNameSpace:aModelID;1",
            "@context": ["dtmi:dtdl:context;2"],
            "@type": "Interface",
            "displayName": "New Model",
            "contents": [
                {
                    "@type": "Property",
                    "name": "attribute1",
                    "schema": "double"
                },{
                    "@type": "Relationship",
                    "name": "link"
                }
            ]
        }
    }
    this.leftSpan.empty()

    this.refreshDTDL()
    this.leftSpan.append($('<div class="w3-bar"><div class="w3-bar-item w3-tooltip" style="font-size:1.2em;padding-left:2px;font-weight:bold;color:gray">Model ID & Name<p style="position:absolute;text-align:left;font-weight:normal;top:-10px;width:200px" class="w3-text w3-tag w3-tiny">model ID contains namespace, a model string and a version number</p></div></div>'))
    new idRow(this.dtdlobj,this.leftSpan,()=>{this.refreshDTDL()})
    new displayNameRow(this.dtdlobj,this.leftSpan,()=>{this.refreshDTDL()})

    if(!this.dtdlobj["contents"])this.dtdlobj["contents"]=[]
    new parametersRow(this.dtdlobj["contents"],this.leftSpan,()=>{this.refreshDTDL()},this.DOM.offset())
    new relationsRow(this.dtdlobj["contents"],this.leftSpan,()=>{this.refreshDTDL()},this.DOM.offset())
    new componentsRow(this.dtdlobj["contents"],this.leftSpan,()=>{this.refreshDTDL()})

    if(!this.dtdlobj["extends"])this.dtdlobj["extends"]=[]
    new baseClassesRow(this.dtdlobj["extends"],this.leftSpan,()=>{this.refreshDTDL()})
}

modelEditorDialog.prototype.refreshDTDL=function(){
    this.dtdlScriptPanel.empty()
    this.dtdlScriptPanel.append($('<div style="height:20px;width:100px" class="w3-bar w3-gray">Generated DTDL</div>'))
    this.dtdlScriptPanel.append($('<pre style="color:gray">'+JSON.stringify(this.dtdlobj,null,2)+'</pre>'))
}

module.exports = new modelEditorDialog();


function baseClassesRow(dtdlObj,parentDOM,refreshDTDLF){
    var rowDOM=$('<div class="w3-bar"><div class="w3-bar-item  w3-tooltip" style="font-size:1.2em;padding-left:2px;font-weight:bold;color:gray">Base Classes<p style="position:absolute;text-align:left;top:-10px;font-weight:normal;width:200px" class="w3-text w3-tag w3-tiny">Base class model\'s parameters and relationship type are inherited</p></div></div>')

    var addButton = $('<button class="w3-bar-item w3-button w3-red w3-hover-amber" style="margin-top:2px;font-size:1.2em;padding:4px">+</button>')
    rowDOM.append(addButton)
    parentDOM.append(rowDOM)
    var contentDOM=$('<div style="padding-left:10px"></div>')
    rowDOM.append(contentDOM)
    addButton.on("click",()=>{
        var newObj = "unknown"
        dtdlObj.push(newObj)
        new singleBaseclassRow(newObj,contentDOM,refreshDTDLF,dtdlObj)
        refreshDTDLF()
    })
    //check existed content initially from template and trigger their drawing
    dtdlObj.forEach(element => {
        new singleBaseclassRow(element,contentDOM,refreshDTDLF,dtdlObj)
    });
}

function singleBaseclassRow(dtdlObj,parentDOM,refreshDTDLF,parentDtdlObj){
    var DOM = $('<div class="w3-cell-row"></div>')
    var baseClassNameInput=$('<input type="text" style="outline:none;display:inline;width:220px;padding:4px"  placeholder="base model id"/>').addClass("w3-bar-item w3-input w3-border");
    var removeButton = $('<button class="w3-bar-item w3-button w3-hover-amber" style="color:gray;margin-left:3px;margin-top:2px;font-size:1.2em;padding:2px"><i class="fa fa-trash fa-lg"></i></button>')
    DOM.append(baseClassNameInput,removeButton)

    removeButton.on("click",()=>{
        for (var i =0;i< parentDtdlObj.length; i++) {
            if (parentDtdlObj[i] == dtdlObj) {
                parentDtdlObj.splice(i, 1);
                break;
            }
        }
        DOM.remove()
        refreshDTDLF()
    })

    parentDOM.append(DOM)

    baseClassNameInput.val(dtdlObj)
    baseClassNameInput.on("change",()=>{
        for (var i =0;i< parentDtdlObj.length; i++) {
            if (parentDtdlObj[i] == dtdlObj) {
                parentDtdlObj[i]=baseClassNameInput.val()
                break;
            }
        }
        refreshDTDLF()
    })
}

function componentsRow(dtdlObj,parentDOM,refreshDTDLF){
    var rowDOM=$('<div class="w3-bar"><div class="w3-bar-item  w3-tooltip" style="font-size:1.2em;padding-left:2px;font-weight:bold;color:gray">Components<p style="position:absolute;text-align:left;top:-10px;font-weight:normal;width:200px" class="w3-text w3-tag w3-tiny">Component model\'s parameters are embedded under a name</p></div></div>')

    var addButton = $('<button class="w3-bar-item w3-button w3-red w3-hover-amber" style="margin-top:2px;font-size:1.2em;padding:4px">+</button>')
    rowDOM.append(addButton)
    parentDOM.append(rowDOM)
    var contentDOM=$('<div style="padding-left:10px"></div>')
    rowDOM.append(contentDOM)

    addButton.on("click",()=>{
        var newObj = {
            "@type": "Component",
            "name": "SomeComponent",
            "schema":"dtmi:someComponentModel;1"
        }
        dtdlObj.push(newObj)
        new singleComponentRow(newObj,contentDOM,refreshDTDLF,dtdlObj)
        refreshDTDLF()
    })
    //check existed content initially from template and trigger their drawing
    dtdlObj.forEach(element => {
        if(element["@type"]!="Component") return
        new singleComponentRow(element,contentDOM,refreshDTDLF,dtdlObj)
    });
}

function singleComponentRow(dtdlObj,parentDOM,refreshDTDLF,parentDtdlObj){
    var DOM = $('<div class="w3-cell-row"></div>')
    var componentNameInput=$('<input type="text" style="outline:none;display:inline;width:100px;padding:4px"  placeholder="component name"/>').addClass("w3-bar-item w3-input w3-border");
    var schemaInput=$('<input type="text" style="outline:none;display:inline;width:160px;padding:4px"  placeholder="component model id..."/>').addClass("w3-bar-item w3-input w3-border");
    var removeButton = $('<button class="w3-bar-item w3-button w3-hover-amber" style="color:gray;margin-left:3px;margin-top:2px;font-size:1.2em;padding:2px"><i class="fa fa-trash fa-lg"></i></button>')
    DOM.append(componentNameInput,schemaInput,removeButton)

    removeButton.on("click",()=>{
        for (var i =0;i< parentDtdlObj.length; i++) {
            if (parentDtdlObj[i] === dtdlObj) {
                parentDtdlObj.splice(i, 1);
                break;
            }
        }
        DOM.remove()
        refreshDTDLF()
    })

    parentDOM.append(DOM)

    componentNameInput.val(dtdlObj["name"])
    schemaInput.val(dtdlObj["schema"]||"")

    componentNameInput.on("change",()=>{
        dtdlObj["name"]=componentNameInput.val()
        refreshDTDLF()
    })
    schemaInput.on("change",()=>{
        dtdlObj["schema"]=schemaInput.val()
        refreshDTDLF()
    })
}

function relationsRow(dtdlObj,parentDOM,refreshDTDLF,dialogOffset){
    var rowDOM=$('<div class="w3-bar"><div class="w3-bar-item w3-tooltip" style="font-size:1.2em;padding-left:2px;font-weight:bold;color:gray">Relationship Types<p style="position:absolute;text-align:left;top:-10px;font-weight:normal;width:200px" class="w3-text w3-tag w3-tiny">Relationship can have its own parameters</p></div></div>')


    var addButton = $('<button class="w3-bar-item w3-button w3-red w3-hover-amber" style="margin-top:2px;font-size:1.2em;padding:4px">+</button>')
    rowDOM.append(addButton)
    parentDOM.append(rowDOM)
    var contentDOM=$('<div style="padding-left:10px"></div>')
    rowDOM.append(contentDOM)

    addButton.on("click",()=>{
        var newObj = {
            "@type": "Relationship",
            "name": "relation1",
        }
        dtdlObj.push(newObj)
        new singleRelationTypeRow(newObj,contentDOM,refreshDTDLF,dtdlObj,dialogOffset)
        refreshDTDLF()
    })

    //check existed content initially from template and trigger their drawing
    dtdlObj.forEach(element => {
        if(element["@type"]!="Relationship") return
        new singleRelationTypeRow(element,contentDOM,refreshDTDLF,dtdlObj,dialogOffset)
    });
}

function singleRelationTypeRow(dtdlObj,parentDOM,refreshDTDLF,parentDtdlObj,dialogOffset){
    var DOM = $('<div class="w3-cell-row"></div>')
    var relationNameInput=$('<input type="text" style="outline:none;display:inline;width:90px;padding:4px"  placeholder="relation name"/>').addClass("w3-bar-item w3-input w3-border");
    var targetModelID=$('<input type="text" style="outline:none;display:inline;width:140px;padding:4px"  placeholder="(optional)target model"/>').addClass("w3-bar-item w3-input w3-border");
    var addButton = $('<button class="w3-bar-item w3-button w3-hover-amber" style="color:gray;margin-left:3px;margin-top:2px;font-size:1.2em;padding:2px"><i class="fa fa-cog fa-lg"></i></button>')
    var removeButton = $('<button class="w3-bar-item w3-button w3-hover-amber" style="color:gray;margin-left:3px;margin-top:2px;font-size:1.2em;padding:2px"><i class="fa fa-trash fa-lg"></i></button>')
    DOM.append(relationNameInput,targetModelID,addButton,removeButton)

    removeButton.on("click",()=>{
        for (var i =0;i< parentDtdlObj.length; i++) {
            if (parentDtdlObj[i] === dtdlObj) {
                parentDtdlObj.splice(i, 1);
                break;
            }
        }
        DOM.remove()
        refreshDTDLF()
    })

    var contentDOM=$('<div style="padding-left:10px"></div>')
    DOM.append(contentDOM)
    parentDOM.append(DOM)

    relationNameInput.val(dtdlObj["name"])
    targetModelID.val(dtdlObj["target"]||"")

    addButton.on("click",()=>{
        if(! dtdlObj["properties"]) dtdlObj["properties"]=[]
        var newObj = {
            "name": "newP",
            "schema": "double"
        }
        dtdlObj["properties"].push(newObj)
        new singleParameterRow(newObj,contentDOM,refreshDTDLF,dtdlObj["properties"],null,dialogOffset)
        refreshDTDLF()
    })

    relationNameInput.on("change",()=>{
        dtdlObj["name"]=relationNameInput.val()
        refreshDTDLF()
    })
    targetModelID.on("change",()=>{
        if(targetModelID.val()=="") delete dtdlObj["target"]
        else dtdlObj["target"]=targetModelID.val()
        refreshDTDLF()
    })
    if(dtdlObj["properties"] && dtdlObj["properties"].length>0){
        var properties=dtdlObj["properties"]
        properties.forEach(oneProperty=>{
            new singleParameterRow(oneProperty,contentDOM,refreshDTDLF,dtdlObj["properties"],null,dialogOffset)
        })
    }
}

function parametersRow(dtdlObj,parentDOM,refreshDTDLF,dialogOffset){
    var rowDOM=$('<div class="w3-bar"><div class="w3-bar-item" style="font-size:1.2em;padding-left:2px;font-weight:bold;color:gray">Parameters</div></div>')
    var addButton = $('<button class="w3-bar-item w3-button w3-red w3-hover-amber" style="margin-top:2px;font-size:1.2em;padding:4px">+</button>')
    rowDOM.append(addButton)
    parentDOM.append(rowDOM)
    var contentDOM=$('<div style="padding-left:10px"></div>')
    rowDOM.append(contentDOM)
    addButton.on("click",()=>{
        var newObj = {
            "@type": "Property",
            "name": "newP",
            "schema": "double"
        }
        dtdlObj.push(newObj)
        new singleParameterRow(newObj,contentDOM,refreshDTDLF,dtdlObj,"topLevel",dialogOffset)
        refreshDTDLF()
    })

    //check existed content initially from template and trigger their drawing
    dtdlObj.forEach(element => {
        if(element["@type"]!="Property") return
        new singleParameterRow(element,contentDOM,refreshDTDLF,dtdlObj,"topLevel",dialogOffset)
    });
}

function singleParameterRow(dtdlObj,parentDOM,refreshDTDLF,parentDtdlObj,topLevel,dialogOffset){
    var DOM = $('<div class="w3-cell-row"></div>')
    var parameterNameInput=$('<input type="text" style="outline:none;display:inline;width:100px;padding:4px"  placeholder="parameter name"/>').addClass("w3-bar-item w3-input w3-border");
    var enumValueInput=$('<input type="text" style="outline:none;display:inline;width:100px;padding:4px"  placeholder="str1,str2,..."/>').addClass("w3-bar-item w3-input w3-border");
    var addButton = $('<button class="w3-bar-item w3-button w3-hover-amber" style="color:gray;margin-left:3px;margin-top:2px;font-size:1.2em;padding:2px"><i class="fa fa-plus fa-lg"></i></button>')
    var removeButton = $('<button class="w3-bar-item w3-button w3-hover-amber" style="color:gray;margin-left:3px;margin-top:2px;font-size:1.2em;padding:2px"><i class="fa fa-trash fa-lg"></i></button>')
    var ptypeSelector=new simpleSelectMenu(" ",{withBorder:1,fontSize:"1em",colorClass:"w3-light-gray w3-bar-item",buttonCSS:{"padding":"4px 5px"},"optionListHeight":300,"isClickable":1,"optionListMarginTop":-150,"optionListMarginLeft":60,
    "adjustPositionAnchor":dialogOffset})
    ptypeSelector.addOptionArr(["Enum","Object","boolean","date","dateTime","double","duration","float","integer","long","string","time"])
    DOM.append(parameterNameInput,ptypeSelector.DOM,enumValueInput,addButton,removeButton)

    removeButton.on("click",()=>{
        for (var i =0;i< parentDtdlObj.length; i++) {
            if (parentDtdlObj[i] === dtdlObj) {
                parentDtdlObj.splice(i, 1);
                break;
            }
        }
        DOM.remove()
        refreshDTDLF()
    })
    
    var contentDOM=$('<div style="padding-left:10px"></div>')
    DOM.append(contentDOM)
    parentDOM.append(DOM)

    parameterNameInput.val(dtdlObj["name"])
    ptypeSelector.callBack_clickOption=(optionText,optionValue,realMouseClick)=>{
        ptypeSelector.changeName(optionText)
        contentDOM.empty()//clear all content dom content
        if(realMouseClick){
            for(var ind in dtdlObj) delete dtdlObj[ind]    //clear all object content
            if(topLevel) dtdlObj["@type"]="Property"
            dtdlObj["name"]=parameterNameInput.val()
        } 
        if(optionText=="Enum"){
            enumValueInput.val("")
            enumValueInput.show();
            addButton.hide()
            if(realMouseClick) dtdlObj["schema"]={"@type": "Enum","valueSchema": "string"}
        }else if(optionText=="Object"){
            enumValueInput.hide();
            addButton.show()
            if(realMouseClick) dtdlObj["schema"]={"@type": "Object"}
        }else{
            if(realMouseClick) dtdlObj["schema"]=optionText
            enumValueInput.hide();
            addButton.hide()
        }
        refreshDTDLF()
    }
    addButton.on("click",()=>{
        if(! dtdlObj["schema"]["fields"]) dtdlObj["schema"]["fields"]=[]
        var newObj = {
            "name": "newP",
            "schema": "double"
        }
        dtdlObj["schema"]["fields"].push(newObj)
        new singleParameterRow(newObj,contentDOM,refreshDTDLF,dtdlObj["schema"]["fields"],null,dialogOffset)
        refreshDTDLF()
    })

    parameterNameInput.on("change",()=>{
        dtdlObj["name"]=parameterNameInput.val()
        refreshDTDLF()
    })
    enumValueInput.on("change",()=>{
        var valueArr=enumValueInput.val().split(",")
        dtdlObj["schema"]["enumValues"]=[]
        valueArr.forEach(aVal=>{
            dtdlObj["schema"]["enumValues"].push({
                "name": aVal.replace(" ",""), //remove all the space in name
                "enumValue": aVal
              })
        })
        refreshDTDLF()
    })
    if(typeof(dtdlObj["schema"]) != 'object') var schema=dtdlObj["schema"]
    else schema=dtdlObj["schema"]["@type"]
    ptypeSelector.triggerOptionValue(schema)
    if(schema=="Enum"){
        var enumArr=dtdlObj["schema"]["enumValues"]
        if(enumArr!=null){
            var inputStr=""
            enumArr.forEach(oneEnumValue=>{inputStr+=oneEnumValue.enumValue+","})
            inputStr=inputStr.slice(0, -1)//remove the last ","
            enumValueInput.val(inputStr)
        }
    }else if(schema=="Object"){
        var fields=dtdlObj["schema"]["fields"]
        fields.forEach(oneField=>{
            new singleParameterRow(oneField,contentDOM,refreshDTDLF,dtdlObj["schema"]["fields"],null,dialogOffset)
        })
    }
}


function idRow(dtdlObj,parentDOM,refreshDTDLF){
    var DOM = $('<div class="w3-cell-row"></div>')
    var label1=$('<div class="w3-opacity" style="display:inline">dtmi:</div>')
    var domainInput=$('<input type="text" style="outline:none;display:inline;width:80px;padding:4px"  placeholder="Namespace"/>').addClass("w3-input w3-border");
    var modelIDInput=$('<input type="text" style="outline:none;display:inline;width:140px;padding:4px"  placeholder="ModelID"/>').addClass("w3-input w3-border");
    var versionInput=$('<input type="text" style="outline:none;display:inline;width:60px;padding:4px"  placeholder="version"/>').addClass("w3-input w3-border");
    DOM.append(label1,domainInput,$('<div class="w3-opacity" style="display:inline">:</div>'),modelIDInput,$('<div class="w3-opacity" style="display:inline">;</div>'),versionInput)
    parentDOM.append(DOM)

    var valueChange=()=>{
        var str=`dtmi:${domainInput.val()}:${modelIDInput.val()};${versionInput.val()}`
        dtdlObj["@id"]=str
        refreshDTDLF()
    }
    domainInput.on("change",valueChange)
    modelIDInput.on("change",valueChange)
    versionInput.on("change",valueChange)

    var str=dtdlObj["@id"]
    if(str!="" && str!=null){
        var arr1=str.split(";")
        if(arr1.length!=2) return;
        versionInput.val(arr1[1])
        var arr2=arr1[0].split(":")
        domainInput.val(arr2[1])
        arr2.shift(); arr2.shift()
        modelIDInput.val(arr2.join(":"))
    }
}

function displayNameRow(dtdlObj,parentDOM,refreshDTDLF){
    var DOM = $('<div class="w3-cell-row"></div>')
    var label1=$('<div class="w3-opacity" style="display:inline">Display Name:</div>')
    var nameInput=$('<input type="text" style="outline:none;display:inline;width:150px;padding:4px"  placeholder="ModelID"/>').addClass("w3-input w3-border");
    DOM.append(label1,nameInput)
    parentDOM.append(DOM)
    var valueChange=()=>{
        dtdlObj["displayName"]=nameInput.val()
        refreshDTDLF()
    }
    nameInput.on("change",valueChange)
    var str=dtdlObj["displayName"]
    if(str!="" && str!=null) nameInput.val(str)
}
},{"../msalHelper":6,"./globalCache":7,"./modelAnalyzer":8,"./simpleSelectMenu":13}],10:[function(require,module,exports){
const modelAnalyzer=require("./modelAnalyzer")
const simpleTree= require("./simpleTree")
const simpleConfirmDialog = require("./simpleConfirmDialog")
const modelEditorDialog = require("./modelEditorDialog")
const globalCache = require("./globalCache")
const msalHelper=require("../msalHelper")

function modelManagerDialog() {
    if(!this.DOM){
        this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:99" class="w3-card-2"></div>')
        this.DOM.css("overflow","hidden")
        $("body").append(this.DOM)
        this.DOM.hide()
    }
    this.showRelationVisualizationSettings=true;
}


modelManagerDialog.prototype.popup = async function() {
    this.DOM.show()
    this.DOM.empty()
    this.contentDOM = $('<div style="width:650px"></div>')
    this.DOM.append(this.contentDOM)
    this.contentDOM.append($('<div style="height:40px" class="w3-bar w3-red"><div class="w3-bar-item" style="font-size:1.5em">Digital Twin Models</div></div>'))
    var closeButton = $('<button class="w3-bar-item w3-button w3-right" style="font-size:2em;padding-top:4px">×</button>')
    this.contentDOM.children(':first').append(closeButton)
    closeButton.on("click", () => { this.DOM.hide() })

    var importModelsBtn = $('<button class="w3-button w3-card w3-deep-orange w3-hover-light-green" style="height:100%">Import</button>')
    var actualImportModelsBtn =$('<input type="file" name="modelFiles" multiple="multiple" style="display:none"></input>')
    var modelEditorBtn = $('<button class="w3-button w3-card w3-deep-orange w3-hover-light-green" style="height:100%">Create Model</button>')
    var exportModelBtn = $('<button class="w3-button w3-card w3-deep-orange w3-hover-light-green" style="height:100%">Export All Models</button>')
    this.contentDOM.children(':first').append(importModelsBtn,actualImportModelsBtn, modelEditorBtn,exportModelBtn)
    importModelsBtn.on("click", ()=>{
        actualImportModelsBtn.trigger('click');
    });
    actualImportModelsBtn.change(async (evt)=>{
        var files = evt.target.files; // FileList object
        await this.readModelFilesContentAndImport(files)
        actualImportModelsBtn.val("")
    })
    modelEditorBtn.on("click",()=>{
        this.DOM.hide()
        modelEditorDialog.popup()
    })
    exportModelBtn.on("click", () => {
        var modelArr=[]
        for(var modelID in modelAnalyzer.DTDLModels) modelArr.push(JSON.parse(modelAnalyzer.DTDLModels[modelID]["original"]))
        var pom = $("<a></a>")
        pom.attr('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(modelArr)));
        pom.attr('download', "exportModels.json");
        pom[0].click()
    })

    var row2=$('<div class="w3-cell-row" style="margin-top:2px"></div>')
    this.contentDOM.append(row2)
    var leftSpan=$('<div class="w3-cell" style="width:240px;padding-right:5px"></div>')
    row2.append(leftSpan)
    leftSpan.append($('<div style="height:30px" class="w3-bar w3-red"><div class="w3-bar-item" style="">Models</div></div>'))
    
    var modelList = $('<ul class="w3-ul w3-hoverable">')
    modelList.css({"overflow-x":"hidden","overflow-y":"auto","height":"420px", "border":"solid 1px lightgray"})
    leftSpan.append(modelList)
    this.modelList = modelList;
    
    var rightSpan=$('<div class="w3-container w3-cell" style="padding:0px"></div>')
    row2.append(rightSpan) 
    var panelCardOut=$('<div class="w3-card-2 w3-white" style="margin-top:2px"></div>')

    this.modelButtonBar=$('<div class="w3-bar" style="height:35px"></div>')
    panelCardOut.append(this.modelButtonBar)

    rightSpan.append(panelCardOut)
    var panelCard=$('<div style="width:410px;height:412px;overflow:auto;margin-top:2px"></div>')
    panelCardOut.append(panelCard)
    this.panelCard=panelCard;

    this.modelButtonBar.empty()
    panelCard.html("<a style='display:block;font-style:italic;color:gray;padding-left:5px'>Choose a model to view infomration</a>")

    this.listModels()
}

modelManagerDialog.prototype.resizeImgFile = async function(theFile,max_size) {
    return new Promise((resolve, reject) => {
        try {
            var reader = new FileReader();
            var tmpImg = new Image();
            reader.onload = () => {
                tmpImg.onload =  ()=> {
                    var canvas = document.createElement('canvas')
                    var width = tmpImg.width
                    var height = tmpImg.height;
                    if (width > height) {
                        if (width > max_size) {
                            height *= max_size / width;
                            width = max_size;
                        }
                    } else {
                        if (height > max_size) {
                            width *= max_size / height;
                            height = max_size;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    canvas.getContext('2d').drawImage(tmpImg, 0, 0, width, height);
                    var dataUrl = canvas.toDataURL('image/png');
                    resolve(dataUrl)
                }
                tmpImg.src = reader.result;
            }
            reader.readAsDataURL(theFile);
        } catch (e) {
            reject(e)
        }
    })
}

modelManagerDialog.prototype.fillRightSpan=async function(modelID){
    this.panelCard.empty()
    this.modelButtonBar.empty()

    var delBtn = $('<button style="margin-bottom:2px" class="w3-button w3-light-gray w3-hover-pink w3-border-right">Delete Model</button>')
    this.modelButtonBar.append(delBtn)


    var importPicBtn = $('<button class="w3-button w3-light-gray w3-hover-amber w3-border-right">Upload Avarta</button>')
    var actualImportPicBtn = $('<input type="file" name="img" style="display:none"></input>')
    var clearAvartaBtn = $('<button class="w3-button w3-light-gray w3-hover-pink w3-border-right">Clear Avarta</button>')
    this.modelButtonBar.append(importPicBtn, actualImportPicBtn, clearAvartaBtn)
    importPicBtn.on("click", () => {
        actualImportPicBtn.trigger('click');
    });

    actualImportPicBtn.change(async (evt) => {
        var files = evt.target.files; // FileList object
        var theFile = files[0]

        if (theFile.type == "image/svg+xml") {
            var str = await this.readOneFile(theFile)
            var dataUrl = 'data:image/svg+xml;utf8,' + encodeURIComponent(str);
        } else if (theFile.type.match('image.*')) {
            var dataUrl = await this.resizeImgFile(theFile, 70)
        } else {
            var confirmDialogDiv = new simpleConfirmDialog()
            confirmDialogDiv.show({ width: "200px" },
                {
                    title: "Note"
                    , content: "Please import image file (png,jpg,svg and so on)"
                    , buttons: [{ colorClass: "w3-gray", text: "Ok", "clickFunc": () => { confirmDialogDiv.close() } }]
                }
            )
        }
        if (this.avartaImg) this.avartaImg.attr("src", dataUrl)

        var visualJson = globalCache.visualDefinition["default"]
        if (!visualJson[modelID]) visualJson[modelID] = {}
        visualJson[modelID].avarta = dataUrl
        this.saveVisualDefinition()
        this.broadcastMessage({ "message": "visualDefinitionChange", "modelID": modelID, "avarta": dataUrl })
        this.refreshModelTreeLabel()
        actualImportPicBtn.val("")
    })

    clearAvartaBtn.on("click", () => {
        var visualJson = globalCache.visualDefinition["default"]
        if (visualJson[modelID]) delete visualJson[modelID].avarta
        if (this.avartaImg) this.avartaImg.removeAttr('src');
        this.saveVisualDefinition()
        this.broadcastMessage({ "message": "visualDefinitionChange", "modelID": modelID, "noAvarta": true })
        this.refreshModelTreeLabel()
    });

    
    delBtn.on("click",()=>{
        var confirmDialogDiv = new simpleConfirmDialog()

        //check how many twins are under this model ID
        var numberOfTwins=0
        globalCache.DBTwinsArr.forEach(oneDBTwin=>{
            if(oneDBTwin["modelID"]==modelID) numberOfTwins++
        })

        var contentStr="This will DELETE model \"" + modelID + "\". "
        contentStr+="(There "+((numberOfTwins>1)?("are "+numberOfTwins+" twins"):("is "+numberOfTwins+" twin") ) + " of this model."
        if(numberOfTwins>0) contentStr+=" You may still delete the model, but please import a model with this modelID to ensure normal operation)"
        else contentStr+=")"
        confirmDialogDiv.show(
            { width: "350px" },
            {
                title: "Warning"
                , content: contentStr
                , buttons: [
                    {
                        colorClass: "w3-red w3-hover-pink", text: "Confirm", "clickFunc": async () => {
                            confirmDialogDiv.close();
                            try{
                                await msalHelper.callAPI("digitaltwin/deleteModel", "POST", { "model": modelID })
                                delete modelAnalyzer.DTDLModels[modelID]
                                this.tree.deleteLeafNode(globalCache.modelIDMapToName[modelID])
                                this.broadcastMessage({ "message": "ADTModelsChange"})
                                this.panelCard.empty()
                                //TODO: clear the visualization setting of this deleted model
                                /*
                                if (globalCache.visualDefinition["default"][modelID]) {
                                    delete globalCache.visualDefinition["default"][modelID]
                                    this.saveVisualDefinition()
                                }*/
                            }catch(e){
                                console.log(e)
                                if(e.responseText) alert(e.responseText)
                            }   
                        }
                    },
                    {
                        colorClass: "w3-gray", text: "Cancel", "clickFunc": () => {
                            confirmDialogDiv.close()
                        }
                    }
                ]
            }
        )
        
    })
    
    var VisualizationDOM=this.addAPartInRightSpan("Visualization")
    var editablePropertiesDOM=this.addAPartInRightSpan("Editable Properties And Relationships")
    var baseClassesDOM=this.addAPartInRightSpan("Base Classes")
    var originalDefinitionDOM=this.addAPartInRightSpan("Original Definition")

    var str=JSON.stringify(JSON.parse(modelAnalyzer.DTDLModels[modelID]["original"]),null,2)
    originalDefinitionDOM.append($('<pre id="json">'+str+'</pre>'))

    var edittableProperties=modelAnalyzer.DTDLModels[modelID].editableProperties
    this.fillEditableProperties(edittableProperties,editablePropertiesDOM)
    var validRelationships=modelAnalyzer.DTDLModels[modelID].validRelationships
    this.fillRelationshipInfo(validRelationships,editablePropertiesDOM)

    this.fillVisualization(modelID,VisualizationDOM)

    this.fillBaseClasses(modelAnalyzer.DTDLModels[modelID].allBaseClasses,baseClassesDOM) 
}

modelManagerDialog.prototype.refreshModelTreeLabel=function(){
    if(this.tree.selectedNodes.length>0) this.tree.selectedNodes[0].redrawLabel()
}

modelManagerDialog.prototype.fillBaseClasses=function(baseClasses,parentDom){
    for(var ind in baseClasses){
        var keyDiv= $("<label style='display:block;padding:.1em'>"+ind+"</label>")
        parentDom.append(keyDiv)
    }
}

modelManagerDialog.prototype.fillVisualization=function(modelID,parentDom){
    var modelJson=modelAnalyzer.DTDLModels[modelID];
    var aTable=$("<table style='width:100%'></table>")
    aTable.html('<tr><td></td><td></td></tr>')
    parentDom.append(aTable) 

    var leftPart=aTable.find("td:first")
    var rightPart=aTable.find("td:nth-child(2)")
    rightPart.css({"width":"50px","height":"50px","border":"solid 1px lightGray"})
    
    var avartaImg=$("<img style='height:45px'></img>")
    rightPart.append(avartaImg)
    var visualJson=globalCache.visualDefinition["default"]
    if(visualJson && visualJson[modelID] && visualJson[modelID].avarta) avartaImg.attr('src',visualJson[modelID].avarta)
    this.avartaImg=avartaImg;
    this.addOneVisualizationRow(modelID,leftPart)

    if(this.showRelationVisualizationSettings){
        for(var ind in modelJson.validRelationships){
            this.addOneVisualizationRow(modelID,leftPart,ind)
        }
    }
}
modelManagerDialog.prototype.addOneVisualizationRow=function(modelID,parentDom,relatinshipName){
    if(relatinshipName==null) var nameStr="◯" //visual for node
    else nameStr="⟜ "+relatinshipName
    var containerDiv=$("<div style='padding-bottom:8px'></div>")
    parentDom.append(containerDiv)
    var contentDOM=$("<label style='margin-right:10px'>"+nameStr+"</label>")
    containerDiv.append(contentDOM)

    var definedColor=null
    var definedShape=null
    var definedDimensionRatio=null
    var definedEdgeWidth=null
    var visualJson=globalCache.visualDefinition["default"]
    if(relatinshipName==null){
        if(visualJson[modelID] && visualJson[modelID].color) definedColor=visualJson[modelID].color
        if(visualJson[modelID] && visualJson[modelID].shape) definedShape=visualJson[modelID].shape
        if(visualJson[modelID] && visualJson[modelID].dimensionRatio) definedDimensionRatio=visualJson[modelID].dimensionRatio
    }else{
        if (visualJson[modelID] && visualJson[modelID]["rels"] && visualJson[modelID]["rels"][relatinshipName]) {
            if (visualJson[modelID]["rels"][relatinshipName].color) definedColor = visualJson[modelID]["rels"][relatinshipName].color
            if (visualJson[modelID]["rels"][relatinshipName].shape) definedShape = visualJson[modelID]["rels"][relatinshipName].shape
            if(visualJson[modelID]["rels"][relatinshipName].edgeWidth) definedEdgeWidth=visualJson[modelID]["rels"][relatinshipName].edgeWidth
        }
    }

    var colorSelector=$('<select class="w3-border" style="outline:none;width:75px"></select>')
    containerDiv.append(colorSelector)
    var colorArr=["Black","LightGray","Red","Green","Blue","Bisque","Brown","Coral","Crimson","DodgerBlue","Gold"]
    colorArr.forEach((oneColorCode)=>{
        var anOption=$("<option value='"+oneColorCode+"'>"+oneColorCode+"▧</option>")
        colorSelector.append(anOption)
        anOption.css("color",oneColorCode)
    })
    if(definedColor!=null) {
        colorSelector.val(definedColor)
        colorSelector.css("color",definedColor)
    }
    colorSelector.change((eve)=>{
        var selectColorCode=eve.target.value
        colorSelector.css("color",selectColorCode)
        var visualJson=globalCache.visualDefinition["default"]

        if(!visualJson[modelID]) visualJson[modelID]={}
        if(!relatinshipName) {
            visualJson[modelID].color=selectColorCode
            this.broadcastMessage({ "message": "visualDefinitionChange", "modelID":modelID,"color":selectColorCode })
            this.refreshModelTreeLabel()
        }else{
            if(!visualJson[modelID]["rels"]) visualJson[modelID]["rels"]={}
            if(!visualJson[modelID]["rels"][relatinshipName]) visualJson[modelID]["rels"][relatinshipName]={}
            visualJson[modelID]["rels"][relatinshipName].color=selectColorCode
            this.broadcastMessage({ "message": "visualDefinitionChange", "srcModelID":modelID,"relationshipName":relatinshipName,"color":selectColorCode })
        }
        this.saveVisualDefinition()
    })
    var shapeSelector = $('<select class="w3-border" style="outline:none"></select>')
    containerDiv.append(shapeSelector)
    if(relatinshipName==null){
        shapeSelector.append($("<option value='ellipse'>◯</option>"))
        shapeSelector.append($("<option value='round-rectangle' style='font-size:120%'>▢</option>"))
        shapeSelector.append($("<option value='hexagon' style='font-size:130%'>⬡</option>"))
    }else{
        shapeSelector.append($("<option value='solid'>→</option>"))
        shapeSelector.append($("<option value='dotted'>⇢</option>"))
    }
    if(definedShape!=null) {
        shapeSelector.val(definedShape)
    }
    shapeSelector.change((eve)=>{
        var selectShape=eve.target.value
        var visualJson = globalCache.visualDefinition["default"]

        if(!visualJson[modelID]) visualJson[modelID]={}
        if(!relatinshipName) {
            visualJson[modelID].shape=selectShape
            this.broadcastMessage({ "message": "visualDefinitionChange", "modelID":modelID,"shape":selectShape })
            this.refreshModelTreeLabel()
        }else{
            if(!visualJson[modelID]["rels"]) visualJson[modelID]["rels"]={}
            if(!visualJson[modelID]["rels"][relatinshipName]) visualJson[modelID]["rels"][relatinshipName]={}
            visualJson[modelID]["rels"][relatinshipName].shape=selectShape
            this.broadcastMessage({ "message": "visualDefinitionChange", "srcModelID":modelID,"relationshipName":relatinshipName,"shape":selectShape })
        }
        this.saveVisualDefinition()
    })

    var sizeAdjustSelector = $('<select class="w3-border" style="outline:none;width:110px"></select>')
    if(relatinshipName==null){
        for(var f=0.2;f<2;f+=0.2){
            var val=f.toFixed(1)+""
            sizeAdjustSelector.append($("<option value="+val+">dimension*"+val+"</option>"))
        }
        if(definedDimensionRatio!=null) sizeAdjustSelector.val(definedDimensionRatio)
        else sizeAdjustSelector.val("1.0")
    }else{
        sizeAdjustSelector.css("width","80px")
        for(var f=0.5;f<=4;f+=0.5){
            var val=f.toFixed(1)+""
            sizeAdjustSelector.append($("<option value="+val+">width *"+val+"</option>"))
        }
        if(definedEdgeWidth!=null) sizeAdjustSelector.val(definedEdgeWidth)
        else sizeAdjustSelector.val("2.0")
    }
    containerDiv.append(sizeAdjustSelector)

    
    sizeAdjustSelector.change((eve)=>{
        var chooseVal=eve.target.value
        var visualJson = globalCache.visualDefinition["default"]

        if(!relatinshipName) {
            if(!visualJson[modelID]) visualJson[modelID]={}
            visualJson[modelID].dimensionRatio=chooseVal
            this.broadcastMessage({ "message": "visualDefinitionChange", "modelID":modelID,"dimensionRatio":chooseVal })
        }else{
            if(!visualJson[modelID]["rels"]) visualJson[modelID]["rels"]={}
            if(!visualJson[modelID]["rels"][relatinshipName]) visualJson[modelID]["rels"][relatinshipName]={}
            visualJson[modelID]["rels"][relatinshipName].edgeWidth=chooseVal
            this.broadcastMessage({ "message": "visualDefinitionChange", "srcModelID":modelID,"relationshipName":relatinshipName,"edgeWidth":chooseVal })
        }
        this.saveVisualDefinition()
    })
    
}

modelManagerDialog.prototype.saveVisualDefinition=async function(){
    try{
        await msalHelper.callAPI("digitaltwin/saveVisualDefinition", "POST", {"visualDefinitionJson":JSON.stringify(globalCache.visualDefinition["default"])})
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
    }
}

modelManagerDialog.prototype.fillRelationshipInfo=function(validRelationships,parentDom){
    for(var ind in validRelationships){
        var keyDiv= $("<label style='display:inline;padding:.1em .3em .1em .3em;margin-right:.3em'>"+ind+"</label>")
        parentDom.append(keyDiv)
        keyDiv.css("padding-top",".1em")
        var label=$("<label style='display:inline;background-color:yellowgreen;color:white;font-size:9px;padding:2px'></label>")
        label.text("Relationship")
        parentDom.append(label)
        if(validRelationships[ind].target){
            var label1=$("<label style='display:inline;background-color:yellowgreen;color:white;font-size:9px;padding:2px;margin-left:2px'></label>")
            label1.text(validRelationships[ind].target)
            parentDom.append(label1)
        }
        var contentDOM=$("<label></label>")
        contentDOM.css("display","block")
        contentDOM.css("padding-left","1em")
        parentDom.append(contentDOM)
        this.fillEditableProperties(validRelationships[ind].editableRelationshipProperties, contentDOM)
    }
}

modelManagerDialog.prototype.fillEditableProperties=function(jsonInfo,parentDom){
    for(var ind in jsonInfo){
        var keyDiv= $("<label style='display:block'><div style='display:inline;padding:.1em .3em .1em .3em;margin-right:.3em'>"+ind+"</div></label>")
        parentDom.append(keyDiv)
        keyDiv.css("padding-top",".1em")

        if(Array.isArray(jsonInfo[ind])){
            var contentDOM=$("<label></label>")
            contentDOM.text("enum")
            contentDOM.css({"background-color":"darkGray","color":"white","fontSize":"9px","padding":'2px'})
            keyDiv.append(contentDOM)

            var valueArr=[]
            jsonInfo[ind].forEach(ele=>{valueArr.push(ele.enumValue)})
            var label1=$("<label></label>")
            label1.css({"background-color":"darkGray","color":"white","fontSize":"9px","padding":'2px',"margin-left":"2px"})
            label1.text(valueArr.join())
            keyDiv.append(label1)
        }else if(typeof(jsonInfo[ind])==="object") {
            var contentDOM=$("<label></label>")
            contentDOM.css("display","block")
            contentDOM.css("padding-left","1em")
            this.fillEditableProperties(jsonInfo[ind],contentDOM)
            keyDiv.append(contentDOM)
        }else {
            var contentDOM=$("<label></label>")
            contentDOM.text(jsonInfo[ind])
            contentDOM.css({"background-color":"darkGray","color":"white","fontSize":"9px","padding":'2px'})
            keyDiv.append(contentDOM)
        }
    }
}


modelManagerDialog.prototype.addAPartInRightSpan=function(partName){
    var headerDOM=$('<button class="w3-button w3-block w3-light-grey w3-left-align" style="font-weight:bold"></button>')
    headerDOM.text(partName)
    var listDOM=$('<div class="w3-container w3-hide w3-border w3-show" style="background-color:white"></div>')
    this.panelCard.append(headerDOM,listDOM)

    headerDOM.on("click",(evt)=> {
        if(listDOM.hasClass("w3-show")) listDOM.removeClass("w3-show")
        else listDOM.addClass("w3-show")
 
        return false;
    });
    
    return listDOM;
}

modelManagerDialog.prototype.readModelFilesContentAndImport=async function(files){
    // files is a FileList of File objects. List some properties.
    var fileContentArr=[]
    for (var i = 0, f; f = files[i]; i++) {
        // Only process json files.
        if (f.type!="application/json") continue;
        try{
            var str= await this.readOneFile(f)
            var obj=JSON.parse(str)
            if(Array.isArray(obj)) fileContentArr=fileContentArr.concat(obj)
            else fileContentArr.push(obj)
        }catch(err){
            alert(err)
        }
    }
    if(fileContentArr.length==0) return;
    try {
        var response = await msalHelper.callAPI("digitaltwin/importModels", "POST", {"models":JSON.stringify(fileContentArr)})
        this.listModels("shouldBroadCast")
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
    }  
}

modelManagerDialog.prototype.readOneFile= async function(aFile){
    return new Promise((resolve, reject) => {
        try{
            var reader = new FileReader();
            reader.onload = ()=> {
                resolve(reader.result)
            };
            reader.readAsText(aFile);
        }catch(e){
            reject(e)
        }
    })
}


modelManagerDialog.prototype.listModels=async function(shouldBroadcast){
    this.modelList.empty()
    await globalCache.loadUserData()

    if(jQuery.isEmptyObject(modelAnalyzer.DTDLModels)){
        var zeroModelItem=$('<li style="font-size:0.9em">zero model record. Please import...</li>')
        this.modelList.append(zeroModelItem)
        zeroModelItem.css("cursor","default")
    }else{
        this.tree = new simpleTree(this.modelList, {
            "leafNameProperty": "displayName"
            , "noMultipleSelectAllowed": true, "hideEmptyGroup": true
        })

        this.tree.options.leafNodeIconFunc = (ln) => {
            var modelClass = ln.leafInfo["@id"]
            var colorCode = "gray"
            var shape = "ellipse"
            var avatar = null
            if (globalCache.visualDefinition["default"][modelClass]) {
                var visualJson = globalCache.visualDefinition["default"][modelClass]
                var colorCode = visualJson.color || "gray"
                var shape = visualJson.shape || "ellipse"
                var avarta = visualJson.avarta
            }
            var fontsize = { "ellipse": "font-size:130%", "round-rectangle": "font-size:60%;padding-left:2px", "hexagon": "font-size:90%" }[shape]
            shape = { "ellipse": "●", "round-rectangle": "▉", "hexagon": "⬢" }[shape]

            var lblHTML = "<label style='display:inline;color:" + colorCode + ";" + fontsize + ";font-weight:normal;vertical-align:middle;border-radius: 2px;'>" + shape + "</label>"

            if (avarta) lblHTML += "<img src='" + avarta + "' style='height:20px'/>"

            return $(lblHTML)
        }

        this.tree.callback_afterSelectNodes = (nodesArr, mouseClickDetail) => {
            var theNode = nodesArr[0]
            this.fillRightSpan(theNode.leafInfo["@id"])
        }

        var groupNameList = {}
        for (var modelID in modelAnalyzer.DTDLModels) groupNameList[this.modelNameToGroupName(modelID)] = 1
        var modelgroupSortArr = Object.keys(groupNameList)
        modelgroupSortArr.sort(function (a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()) });
        modelgroupSortArr.forEach(oneGroupName => {
            var gn=this.tree.addGroupNode({ displayName: oneGroupName })
            gn.expand()
        })

        for (var modelID in modelAnalyzer.DTDLModels) {
            var gn = this.modelNameToGroupName(modelID)
            this.tree.addLeafnodeToGroup(gn, JSON.parse(modelAnalyzer.DTDLModels[modelID]["original"]))
        }

        this.tree.sortAllLeaves()
    }
    
    if(shouldBroadcast) this.broadcastMessage({ "message": "ADTModelsChange"})
}

modelManagerDialog.prototype.modelNameToGroupName=function(modelName){
    var nameParts=modelName.split(":")
    if(nameParts.length>=2)  return nameParts[1]
    else return "Others"
}

modelManagerDialog.prototype.rxMessage=function(msgPayload){
    if(msgPayload.message=="ADTModelEdited") this.listModels("shouldBroadcast")
}


module.exports = new modelManagerDialog();
},{"../msalHelper":6,"./globalCache":7,"./modelAnalyzer":8,"./modelEditorDialog":9,"./simpleConfirmDialog":12,"./simpleTree":14}],11:[function(require,module,exports){
function moduleSwitchDialog(){
    this.modulesSidebar=$('<div class="w3-sidebar w3-bar-block w3-white w3-animate-left w3-card-4" style="display:none;height:160px;width:240px;overflow:hidden"><div style="height:40px" class="w3-bar w3-red"><button class="w3-bar-item w3-button w3-left w3-hover-amber" style="font-size:2em;padding-top:4px;width:55px">☰</button><div class="w3-bar-item" style="font-size:1.5em;width:70px;float:left;cursor:default">Open</div></div><a href="#" class="w3-bar-item w3-button w3-medium"><img src="faviconiothub.ico" style="width:25px;margin-right:10px"></img>Device Management</a><a href="#" class="w3-bar-item w3-button w3-medium"><img src="favicondigitaltwin.ico" style="width:25px;margin-right:10px"></img>Digital Twin</a><a href="#" class="w3-bar-item w3-button w3-medium"><img src="faviconeventlog.ico" style="width:25px;margin-right:10px"></img>Event Log</a></div>')
    
    this.modulesSwitchButton=$('<a class="w3-bar-item w3-button" href="#">☰</a>')
    
    this.modulesSwitchButton.on("click",()=>{ this.modulesSidebar.css("display","block") })
    this.modulesSidebar.children(':first').on("click",()=>{this.modulesSidebar.css("display","none")})
    
    var allModeuls=this.modulesSidebar.children("a")
    $(allModeuls[0]).on("click",()=>{
        window.open("devicemanagement.html", "_blank")
        this.modulesSidebar.css("display","none")
    })
    $(allModeuls[1]).on("click",()=>{
        window.open("digitaltwinmodule.html", "_blank")
        this.modulesSidebar.css("display","none")
    })
    $(allModeuls[2]).on("click",()=>{
        window.open("eventlogmodule.html", "_blank")
        this.modulesSidebar.css("display","none")
    })
}

module.exports = new moduleSwitchDialog();
},{}],12:[function(require,module,exports){
function simpleConfirmDialog(){
    this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:102" class="w3-card-4"></div>')
    //this.DOM.css("overflow","hidden")
}

simpleConfirmDialog.prototype.show=function(cssOptions,otherOptions){
    this.DOM.css(cssOptions)
    this.DOM.append($('<div style="height:40px" class="w3-bar w3-red"><div class="w3-bar-item" style="font-size:1.2em">' + otherOptions.title + '</div></div>'))
    var closeButton = $('<button class="w3-bar-item w3-button w3-right" style="font-size:2em;padding-top:4px">×</button>')
    this.DOM.children(':first').append(closeButton)
    closeButton.on("click", () => { this.close() })

    var dialogDiv=$('<div class="w3-container" style="margin-top:10px;margin-bottom:10px"></div>')
    dialogDiv.text(otherOptions.content)
    this.DOM.append(dialogDiv)
    this.dialogDiv=dialogDiv

    this.bottomBar=$('<div class="w3-bar"></div>')
    this.DOM.append(this.bottomBar)

    otherOptions.buttons.forEach(btn=>{
        var aButton=$('<button class="w3-button w3-right '+(btn.colorClass||"")+'" style="margin-right:2px;margin-left:2px">'+btn.text+'</button>')
        aButton.on("click",()=> { btn.clickFunc()  }  )
        this.bottomBar.append(aButton)    
    })
    $("body").append(this.DOM)
}

simpleConfirmDialog.prototype.close=function(){
    this.DOM.remove()
}

module.exports = simpleConfirmDialog;
},{}],13:[function(require,module,exports){
function simpleSelectMenu(buttonName,options){
    options=options||{} //{isClickable:1,withBorder:1,fontSize:"",colorClass:"",buttonCSS:""}
    if(options.isClickable){
        this.isClickable=true
        this.DOM=$('<div class="w3-dropdown-click"></div>')
    }else{
        this.DOM=$('<div class="w3-dropdown-hover "></div>')
        this.DOM.on("mouseover",(e)=>{
            this.adjustDropDownPosition()
        })
    }
    
    this.button=$('<button class="w3-button" style="outline: none;"><a>'+buttonName+'</a><a style="font-weight:bold;padding-left:2px"></a><i class="fa fa-caret-down" style="padding-left:3px"></i></button>')
    if(options.withBorder) this.button.addClass("w3-border")
    if(options.fontSize) this.DOM.css("font-size",options.fontSize)
    if(options.colorClass) this.button.addClass(options.colorClass)
    if(options.width) this.button.css("width",options.width)
    if(options.buttonCSS) this.button.css(options.buttonCSS)
    if(options.adjustPositionAnchor) this.adjustPositionAnchor=options.adjustPositionAnchor

    this.optionContentDOM=$('<div class="w3-dropdown-content w3-bar-block w3-card-4"></div>')
    if(options.optionListHeight) this.optionContentDOM.css({height:options.optionListHeight+"px","overflow-y":"auto","overflow-x":"visible"})
    if(options.optionListMarginTop) this.optionContentDOM.css({"margin-top":options.optionListMarginTop+"px"})
    if(options.optionListMarginLeft) this.optionContentDOM.css({"margin-left":options.optionListMarginLeft+"px"})
    
    this.DOM.append(this.button,this.optionContentDOM)
    this.curSelectVal=null;

    if(options.isClickable){
        this.button.on("click",(e)=>{
            this.adjustDropDownPosition()
            if(this.optionContentDOM.hasClass("w3-show"))  this.optionContentDOM.removeClass("w3-show")
            else this.optionContentDOM.addClass("w3-show")
        })    
    }
}

simpleSelectMenu.prototype.adjustDropDownPosition=function(){
    if(!this.adjustPositionAnchor) return;
    var offset=this.DOM.offset()
    var newTop=offset.top-this.adjustPositionAnchor.top
    var newLeft=offset.left-this.adjustPositionAnchor.left
    this.optionContentDOM.css({"top":newTop+"px","left":newLeft+"px"})
}

simpleSelectMenu.prototype.findOption=function(optionValue){
    var options=this.optionContentDOM.children()
    for(var i=0;i<options.length;i++){
        var anOption=$(options[i])
        if(optionValue==anOption.data("optionValue")){
            return {"text":anOption.text(),"value":anOption.data("optionValue")}
        }
    }
}

simpleSelectMenu.prototype.addOptionArr=function(arr){
    arr.forEach(element => {
        this.addOption(element)
    });
}

simpleSelectMenu.prototype.addOption=function(optionText,optionValue){
    var optionItem=$('<a href="#" class="w3-bar-item w3-button">'+optionText+'</a>')
    this.optionContentDOM.append(optionItem)
    optionItem.data("optionValue",optionValue||optionText)
    optionItem.on('click',(e)=>{
        this.curSelectVal=optionItem.data("optionValue")
        if(this.isClickable){
            this.optionContentDOM.removeClass("w3-show")
        }else{
            this.DOM.removeClass('w3-dropdown-hover')
            this.DOM.addClass('w3-dropdown-click')
            setTimeout(() => { //this is to hide the drop down menu after click
                this.DOM.addClass('w3-dropdown-hover')
                this.DOM.removeClass('w3-dropdown-click')
            }, 100);
        }
        this.callBack_clickOption(optionText,optionItem.data("optionValue"),"realMouseClick")
    })
}

simpleSelectMenu.prototype.changeName=function(nameStr1,nameStr2){
    this.button.children(":first").text(nameStr1)
    this.button.children().eq(1).text(nameStr2)
}

simpleSelectMenu.prototype.triggerOptionIndex=function(optionIndex){
    var theOption=this.optionContentDOM.children().eq(optionIndex)
    if(theOption.length==0) {
        this.curSelectVal=null;
        this.callBack_clickOption(null,null)
        return;
    }
    this.curSelectVal=theOption.data("optionValue")
    this.callBack_clickOption(theOption.text(),theOption.data("optionValue"))
}
simpleSelectMenu.prototype.triggerOptionValue=function(optionValue){
    var re=this.findOption(optionValue)
    if(re==null){
        this.curSelectVal=null
        this.callBack_clickOption(null,null)
    }else{
        this.curSelectVal=re.value
        this.callBack_clickOption(re.text,re.value)
    }
}


simpleSelectMenu.prototype.clearOptions=function(optionText,optionValue){
    this.optionContentDOM.empty()
    this.curSelectVal=null;
}

simpleSelectMenu.prototype.callBack_clickOption=function(optiontext,optionValue,realMouseClick){

}

module.exports = simpleSelectMenu;
},{}],14:[function(require,module,exports){
'use strict';

function simpleTree(DOM,options){
    this.DOM=DOM
    this.groupNodes=[] //each group header is one node
    this.selectedNodes=[];
    this.options=options || {}
}

simpleTree.prototype.scrollToLeafNode=function(aNode){
    var scrollTop=this.DOM.scrollTop()
    var treeHeight=this.DOM.height()
    var nodePosition=aNode.DOM.position().top //which does not consider parent DOM's scroll height
    //console.log(scrollTop,treeHeight,nodePosition)
    if(treeHeight-50<nodePosition){
        this.DOM.scrollTop(scrollTop + nodePosition-(treeHeight-50)) 
    }else if(nodePosition<50){
        this.DOM.scrollTop(scrollTop + (nodePosition-50)) 
    }
}

simpleTree.prototype.clearAllLeafNodes=function(){
    this.groupNodes.forEach((gNode)=>{
        gNode.listDOM.empty()
        gNode.childLeafNodes.length=0
        gNode.refreshName()
    })
}

simpleTree.prototype.firstLeafNode=function(){
    if(this.groupNodes.length==0) return null;
    var firstLeafNode=null;
    this.groupNodes.forEach(aGroupNode=>{
        if(firstLeafNode!=null) return;
        if(aGroupNode.childLeafNodes.length>0) firstLeafNode=aGroupNode.childLeafNodes[0]
    })

    return firstLeafNode
}

simpleTree.prototype.nextGroupNode=function(aGroupNode){
    if(aGroupNode==null) return;
    var index=this.groupNodes.indexOf(aGroupNode)
    if(this.groupNodes.length-1>index){
        return this.groupNodes[index+1]
    }else{ //rotate backward to first group node
        return this.groupNodes[0] 
    }
}

simpleTree.prototype.nextLeafNode=function(aLeafNode){
    if(aLeafNode==null) return;
    var aGroupNode=aLeafNode.parentGroupNode
    var index=aGroupNode.childLeafNodes.indexOf(aLeafNode)
    if(aGroupNode.childLeafNodes.length-1>index){
        //next node is in same group
        return aGroupNode.childLeafNodes[index+1]
    }else{
        //find next group first node
        while(true){
            var nextGroupNode = this.nextGroupNode(aGroupNode)
            if(nextGroupNode.childLeafNodes.length==0){
                aGroupNode=nextGroupNode
            }else{
                return nextGroupNode.childLeafNodes[0]
            }
        }
    }
}

simpleTree.prototype.searchText=function(str){
    if(str=="") return null;
    //search from current select item the next leaf item contains the text
    var regex = new RegExp(str, 'i');
    var startNode
    if(this.selectedNodes.length==0) {
        startNode=this.firstLeafNode()
        if(startNode==null) return;
        var theStr=startNode.name;
        if(theStr.match(regex)!=null){
            //find target node 
            return startNode
        }
    }else startNode=this.selectedNodes[0]

    if(startNode==null) return null;
    
    var fromNode=startNode;
    while(true){
        var nextNode=this.nextLeafNode(fromNode)
        if(nextNode==startNode) return null;
        var nextNodeStr=nextNode.name;
        if(nextNodeStr.match(regex)!=null){
            //find target node
            return nextNode
        }else{
            fromNode=nextNode;
        }
    }    
}


simpleTree.prototype.addLeafnodeToGroup=function(groupName,obj,skipRepeat){
    var aGroupNode=this.findGroupNode(groupName)
    if(aGroupNode == null) return;
    aGroupNode.addNode(obj,skipRepeat)
}

simpleTree.prototype.removeAllNodes=function(){
    this.groupNodes.length=0;
    this.selectedNodes.length=0;
    this.DOM.empty()
}

simpleTree.prototype.findGroupNode=function(groupName){
    var foundGroupNode=null
    this.groupNodes.forEach(aGroupNode=>{
        if(aGroupNode.name==groupName){
            foundGroupNode=aGroupNode
            return;
        }
    })
    return foundGroupNode;
}

simpleTree.prototype.delGroupNode=function(gnode){
    gnode.deleteSelf()
}

simpleTree.prototype.deleteLeafNode=function(nodeName){
    var findLeafNode=null
    this.groupNodes.forEach((gNode)=>{
        if(findLeafNode!=null) return;
        gNode.childLeafNodes.forEach((aLeaf)=>{
            if(aLeaf.name==nodeName){
                findLeafNode=aLeaf
                return;
            }
        })
    })
    if(findLeafNode==null) return;
    findLeafNode.deleteSelf()
}


simpleTree.prototype.insertGroupNode=function(obj,index){
    var aNewGroupNode = new simpleTreeGroupNode(this,obj)
    var existGroupNode= this.findGroupNode(aNewGroupNode.name)
    if(existGroupNode!=null) return;
    this.groupNodes.splice(index, 0, aNewGroupNode);

    if(index==0){
        this.DOM.append(aNewGroupNode.headerDOM)
        this.DOM.append(aNewGroupNode.listDOM)
    }else{
        var prevGroupNode=this.groupNodes[index-1]
        aNewGroupNode.headerDOM.insertAfter(prevGroupNode.listDOM)
        aNewGroupNode.listDOM.insertAfter(aNewGroupNode.headerDOM)
    }

    return aNewGroupNode;
}

simpleTree.prototype.addGroupNode=function(obj){
    var aNewGroupNode = new simpleTreeGroupNode(this,obj)
    var existGroupNode= this.findGroupNode(aNewGroupNode.name)
    if(existGroupNode!=null) return existGroupNode;
    this.groupNodes.push(aNewGroupNode);
    this.DOM.append(aNewGroupNode.headerDOM)
    this.DOM.append(aNewGroupNode.listDOM)
    return aNewGroupNode;
}

simpleTree.prototype.selectLeafNode=function(leafNode,mouseClickDetail){
    this.selectLeafNodeArr([leafNode],mouseClickDetail)
}
simpleTree.prototype.appendLeafNodeToSelection=function(leafNode){
    if(this.options.noMultipleSelectAllowed){
        this.selectLeafNode(leafNode)
        return;
    } 
    var newArr=[].concat(this.selectedNodes)
    newArr.push(leafNode)
    this.selectLeafNodeArr(newArr)
}

simpleTree.prototype.selectGroupNode=function(groupNode){
    if(this.callback_afterSelectGroupNode) this.callback_afterSelectGroupNode(groupNode.info)
}

simpleTree.prototype.selectLeafNodeArr=function(leafNodeArr,mouseClickDetail){
    for(var i=0;i<this.selectedNodes.length;i++){
        this.selectedNodes[i].dim()
    }
    this.selectedNodes.length=0;
    this.selectedNodes=this.selectedNodes.concat(leafNodeArr)
    for(var i=0;i<this.selectedNodes.length;i++){
        this.selectedNodes[i].highlight()
    }

    if(this.callback_afterSelectNodes) this.callback_afterSelectNodes(this.selectedNodes,mouseClickDetail)
}

simpleTree.prototype.dblClickNode=function(theNode){
    if(this.callback_afterDblclickNode) this.callback_afterDblclickNode(theNode)
}

simpleTree.prototype.sortAllLeaves=function(){
    this.groupNodes.forEach(oneGroupNode=>{oneGroupNode.sortNodesByName()})
}

//----------------------------------tree group node---------------
function simpleTreeGroupNode(parentTree,obj){
    this.parentTree=parentTree
    this.info=obj
    this.childLeafNodes=[] //it's child leaf nodes array
    this.name=obj.displayName;
    this.createDOM()
}

simpleTreeGroupNode.prototype.refreshName=function(){
    this.headerDOM.empty()
    var nameDiv=$("<div style='display:inline;padding-right:3px;vertical-align:middle'></div>")
    nameDiv.text(this.name)
    
    if(this.childLeafNodes.length>0) lblColor="w3-lime"
    else var lblColor="w3-gray" 
    this.headerDOM.css("font-weight","bold")

    if(this.parentTree.options.groupNodeIconFunc){
        var iconLabel=this.parentTree.options.groupNodeIconFunc(this)
        this.headerDOM.append(iconLabel)
    }
    var numberlabel=$("<label class='"+lblColor+"' style='display:inline;font-size:9px;padding:2px 4px;font-weight:normal;border-radius: 2px;'>"+this.childLeafNodes.length+"</label>")
    this.headerDOM.append(nameDiv,numberlabel)


    if(this.parentTree.options.groupNodeTailButtonFunc){
        var tailButton=this.parentTree.options.groupNodeTailButtonFunc(this)
        this.headerDOM.append(tailButton)
    }

    this.checkOptionHideEmptyGroup()

}
simpleTreeGroupNode.prototype.checkOptionHideEmptyGroup=function(){
    if (this.parentTree.options.hideEmptyGroup && this.childLeafNodes.length == 0) {
        this.shrink()
        this.headerDOM.hide()
        if (this.listDOM) this.listDOM.hide()
    } else {
        this.headerDOM.show()
        if (this.listDOM) this.listDOM.show()
    }

}
simpleTreeGroupNode.prototype.deleteSelf = function () {
    this.headerDOM.remove()
    this.listDOM.remove()
    var parentArr = this.parentTree.groupNodes
    const index = parentArr.indexOf(this);
    if (index > -1) parentArr.splice(index, 1);
}

simpleTreeGroupNode.prototype.createDOM=function(){
    this.headerDOM=$('<button class="w3-button w3-block w3-light-grey w3-left-align w3-border-bottom" style="position:relative"></button>')
    this.refreshName()
    this.listDOM=$('<div class="w3-container w3-hide w3-border"></div>')

    this.headerDOM.on("click",(evt)=> {
        if(this.listDOM.hasClass("w3-show")) this.listDOM.removeClass("w3-show")
        else this.listDOM.addClass("w3-show")

        this.parentTree.selectGroupNode(this)    
        return false;
    });
}

simpleTreeGroupNode.prototype.isOpen=function(){
    return  this.listDOM.hasClass("w3-show")
}


simpleTreeGroupNode.prototype.expand=function(){
    if(this.listDOM) this.listDOM.addClass("w3-show")
}

simpleTreeGroupNode.prototype.shrink=function(){
    if(this.listDOM) this.listDOM.removeClass("w3-show")
}

simpleTreeGroupNode.prototype.sortNodesByName=function(){
    var treeOptions=this.parentTree.options
    if(treeOptions.leafNameProperty) var leafNameProperty=treeOptions.leafNameProperty
    else leafNameProperty="$dtId"
    this.childLeafNodes.sort(function (a, b) { 
        var aName=a.name.toLowerCase()
        var bName=b.name.toLowerCase()
        return aName.localeCompare(bName) 
    });
    //this.listDOM.empty() //NOTE: Can not delete those leaf node otherwise the event handle is lost
    this.childLeafNodes.forEach(oneLeaf=>{this.listDOM.append(oneLeaf.DOM)})
}

simpleTreeGroupNode.prototype.addNode=function(obj,skipRepeat){
    var treeOptions=this.parentTree.options
    if(treeOptions.leafNameProperty) var leafNameProperty=treeOptions.leafNameProperty
    else leafNameProperty="$dtId"

    if(skipRepeat){
        var foundRepeat=false;
        this.childLeafNodes.forEach(aNode=>{
            if(aNode.name==obj[leafNameProperty]) {
                foundRepeat=true
                return;
            }
        })
        if(foundRepeat) return;
    }

    var aNewNode = new simpleTreeLeafNode(this,obj)
    this.childLeafNodes.push(aNewNode)
    this.refreshName()
    this.listDOM.append(aNewNode.DOM)
}

//----------------------------------tree leaf node------------------
function simpleTreeLeafNode(parentGroupNode,obj){
    this.parentGroupNode=parentGroupNode
    this.leafInfo=obj;

    var treeOptions=this.parentGroupNode.parentTree.options
    if(treeOptions.leafNameProperty) this.name=this.leafInfo[treeOptions.leafNameProperty]
    else this.name=this.leafInfo["$dtId"]

    this.createLeafNodeDOM()
}

simpleTreeLeafNode.prototype.deleteSelf = function () {
    this.DOM.remove()
    var gNode = this.parentGroupNode
    const index = gNode.childLeafNodes.indexOf(this);
    if (index > -1) gNode.childLeafNodes.splice(index, 1);
    gNode.refreshName()
}

simpleTreeLeafNode.prototype.createLeafNodeDOM=function(){
    this.DOM=$('<button class="w3-button w3-white" style="display:block;text-align:left;width:98%"></button>')
    this.redrawLabel()
    var clickF=(e)=>{
        this.highlight();
        var clickDetail=e.detail
        if (e.ctrlKey) {
            this.parentGroupNode.parentTree.appendLeafNodeToSelection(this)
        }else{
            this.parentGroupNode.parentTree.selectLeafNode(this,e.detail)
        }
    }
    this.DOM.on("click",(e)=>{clickF(e)})

    this.DOM.on("dblclick",(e)=>{
        this.parentGroupNode.parentTree.dblClickNode(this)
    })
}

simpleTreeLeafNode.prototype.redrawLabel=function(){
    this.DOM.empty()
    if(this.parentGroupNode.parentTree.options.leafNodeIconFunc){
        var iconLabel=this.parentGroupNode.parentTree.options.leafNodeIconFunc(this)
        this.DOM.append(iconLabel)
    }

    var nameDiv=$("<div style='display:inline;padding-right:3px;vertical-align:middle'></div>")
    nameDiv.text(this.name)
    this.DOM.append(nameDiv)
}
simpleTreeLeafNode.prototype.highlight=function(){
    this.DOM.addClass("w3-orange")
    this.DOM.addClass("w3-hover-amber")
    this.DOM.removeClass("w3-white")
}
simpleTreeLeafNode.prototype.dim=function(){
    this.DOM.removeClass("w3-orange")
    this.DOM.removeClass("w3-hover-amber")
    this.DOM.addClass("w3-white")
}


module.exports = simpleTree;
},{}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9zcGFTb3VyY2VDb2RlL2RldmljZW1hbmFnZW1lbnRtb2R1bGUvZGV2aWNlTWFuYWdlbWVudE1haW5Ub29sYmFyLmpzIiwiLi4vc3BhU291cmNlQ29kZS9kZXZpY2VtYW5hZ2VtZW50bW9kdWxlL2RldmljZU1hbmFnZW1lbnRVSS5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvZGV2aWNlbWFuYWdlbWVudG1vZHVsZS9zaW5nbGVNb2RlbFR3aW5zTGlzdC5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvZGV2aWNlbWFuYWdlbWVudG1vZHVsZS90d2luc0xpc3QuanMiLCIuLi9zcGFTb3VyY2VDb2RlL2dsb2JhbEFwcFNldHRpbmdzLmpzIiwiLi4vc3BhU291cmNlQ29kZS9tc2FsSGVscGVyLmpzIiwiLi4vc3BhU291cmNlQ29kZS9zaGFyZWRTb3VyY2VGaWxlcy9nbG9iYWxDYWNoZS5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvc2hhcmVkU291cmNlRmlsZXMvbW9kZWxBbmFseXplci5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvc2hhcmVkU291cmNlRmlsZXMvbW9kZWxFZGl0b3JEaWFsb2cuanMiLCIuLi9zcGFTb3VyY2VDb2RlL3NoYXJlZFNvdXJjZUZpbGVzL21vZGVsTWFuYWdlckRpYWxvZy5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvc2hhcmVkU291cmNlRmlsZXMvbW9kdWxlU3dpdGNoRGlhbG9nLmpzIiwiLi4vc3BhU291cmNlQ29kZS9zaGFyZWRTb3VyY2VGaWxlcy9zaW1wbGVDb25maXJtRGlhbG9nLmpzIiwiLi4vc3BhU291cmNlQ29kZS9zaGFyZWRTb3VyY2VGaWxlcy9zaW1wbGVTZWxlY3RNZW51LmpzIiwiLi4vc3BhU291cmNlQ29kZS9zaGFyZWRTb3VyY2VGaWxlcy9zaW1wbGVUcmVlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbGxCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJjb25zdCBtb2R1bGVTd2l0Y2hEaWFsb2c9cmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL21vZHVsZVN3aXRjaERpYWxvZ1wiKVxyXG5jb25zdCBtb2RlbE1hbmFnZXJEaWFsb2cgPSByZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvbW9kZWxNYW5hZ2VyRGlhbG9nXCIpXHJcblxyXG5mdW5jdGlvbiBkZXZpY2VNYW5hZ2VtZW50TWFpblRvb2xiYXIoKSB7XHJcbn1cclxuXHJcbmRldmljZU1hbmFnZW1lbnRNYWluVG9vbGJhci5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5tb2RlbElPQnRuPSQoJzxhIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uXCIgaHJlZj1cIiNcIj5Nb2RlbHM8L2E+JylcclxuXHJcbiAgICAkKFwiI01haW5Ub29sYmFyXCIpLmVtcHR5KClcclxuICAgICQoXCIjTWFpblRvb2xiYXJcIikuYXBwZW5kKG1vZHVsZVN3aXRjaERpYWxvZy5tb2R1bGVzU2lkZWJhcilcclxuICAgICQoXCIjTWFpblRvb2xiYXJcIikuYXBwZW5kKG1vZHVsZVN3aXRjaERpYWxvZy5tb2R1bGVzU3dpdGNoQnV0dG9uLHRoaXMubW9kZWxJT0J0bilcclxuXHJcbiAgICBtb2RlbE1hbmFnZXJEaWFsb2cuc2hvd1JlbGF0aW9uVmlzdWFsaXphdGlvblNldHRpbmdzPWZhbHNlXHJcbiAgICB0aGlzLm1vZGVsSU9CdG4ub24oXCJjbGlja1wiLCgpPT57IG1vZGVsTWFuYWdlckRpYWxvZy5wb3B1cCgpIH0pXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IGRldmljZU1hbmFnZW1lbnRNYWluVG9vbGJhcigpOyIsIid1c2Ugc3RyaWN0JztcclxuY29uc3QgZ2xvYmFsQXBwU2V0dGluZ3MgPSByZXF1aXJlKFwiLi4vZ2xvYmFsQXBwU2V0dGluZ3MuanNcIik7XHJcbmNvbnN0IG1zYWxIZWxwZXI9cmVxdWlyZShcIi4uL21zYWxIZWxwZXJcIilcclxuY29uc3QgZGV2aWNlTWFuYWdlbWVudE1haW5Ub29sYmFyID0gcmVxdWlyZShcIi4vZGV2aWNlTWFuYWdlbWVudE1haW5Ub29sYmFyXCIpXHJcbmNvbnN0IG1vZGVsRWRpdG9yRGlhbG9nID0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL21vZGVsRWRpdG9yRGlhbG9nXCIpXHJcbmNvbnN0IG1vZGVsTWFuYWdlckRpYWxvZyA9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9tb2RlbE1hbmFnZXJEaWFsb2dcIilcclxuY29uc3QgZ2xvYmFsQ2FjaGU9cmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL2dsb2JhbENhY2hlXCIpXHJcbmNvbnN0IHR3aW5zTGlzdD1yZXF1aXJlKFwiLi90d2luc0xpc3RcIilcclxuXHJcbmZ1bmN0aW9uIGRldmljZU1hbmFnZW1lbnRVSSgpIHtcclxuICAgIHRoaXMudHdpbnNMaXN0PSBuZXcgdHdpbnNMaXN0KCQoXCIjVHdpbnNMaXN0XCIpKVxyXG4gICAgZGV2aWNlTWFuYWdlbWVudE1haW5Ub29sYmFyLnJlbmRlcigpXHJcblxyXG4gICAgdGhpcy5teU1TQUxPYmogPSBuZXcgbXNhbC5QdWJsaWNDbGllbnRBcHBsaWNhdGlvbihnbG9iYWxBcHBTZXR0aW5ncy5tc2FsQ29uZmlnKTtcclxuXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoKVxyXG5cclxuICAgIHZhciB0aGVBY2NvdW50PW1zYWxIZWxwZXIuZmV0Y2hBY2NvdW50KCk7XHJcbiAgICBpZih0aGVBY2NvdW50PT1udWxsICYmICFnbG9iYWxBcHBTZXR0aW5ncy5pc0xvY2FsVGVzdCkgd2luZG93Lm9wZW4oZ2xvYmFsQXBwU2V0dGluZ3MubG9nb3V0UmVkaXJlY3RVcmksXCJfc2VsZlwiKVxyXG5cclxuICAgIGdsb2JhbENhY2hlLmxvYWRVc2VyRGF0YSgpLnRoZW4ocmU9PntcclxuICAgICAgICBpZihnbG9iYWxDYWNoZS5EQk1vZGVsc0Fyci5sZW5ndGg9PTApe1xyXG4gICAgICAgICAgICAvL1RPRE86IGlmIHRoZXJlIGlzIG5vIG1vZGVsIGF0IGFsbCwgcHJvbXB0IHVzZXIgdG8gY3JlYXRlIGhpcyBmaXJzdCBtb2RlbFxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICB0aGlzLnR3aW5zTGlzdC5yZWZpbGwoKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1cclxuXHJcbmRldmljZU1hbmFnZW1lbnRVSS5wcm90b3R5cGUuYnJvYWRjYXN0TWVzc2FnZT1mdW5jdGlvbihzb3VyY2UsbXNnUGF5bG9hZCl7XHJcbiAgICB2YXIgY29tcG9uZW50c0Fycj1bbW9kZWxNYW5hZ2VyRGlhbG9nLG1vZGVsRWRpdG9yRGlhbG9nLGRldmljZU1hbmFnZW1lbnRNYWluVG9vbGJhcix0aGlzLnR3aW5zTGlzdF1cclxuXHJcbiAgICBpZihzb3VyY2U9PW51bGwpe1xyXG4gICAgICAgIGZvcih2YXIgaT0wO2k8Y29tcG9uZW50c0Fyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgdmFyIHRoZUNvbXBvbmVudD1jb21wb25lbnRzQXJyW2ldXHJcbiAgICAgICAgICAgIHRoaXMuYXNzaWduQnJvYWRjYXN0TWVzc2FnZSh0aGVDb21wb25lbnQpXHJcbiAgICAgICAgfVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgZm9yKHZhciBpPTA7aTxjb21wb25lbnRzQXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICB2YXIgdGhlQ29tcG9uZW50PWNvbXBvbmVudHNBcnJbaV1cclxuICAgICAgICAgICAgaWYodGhlQ29tcG9uZW50LnJ4TWVzc2FnZSAmJiB0aGVDb21wb25lbnQhPXNvdXJjZSkgdGhlQ29tcG9uZW50LnJ4TWVzc2FnZShtc2dQYXlsb2FkKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5kZXZpY2VNYW5hZ2VtZW50VUkucHJvdG90eXBlLmFzc2lnbkJyb2FkY2FzdE1lc3NhZ2U9ZnVuY3Rpb24odWlDb21wb25lbnQpe1xyXG4gICAgdWlDb21wb25lbnQuYnJvYWRjYXN0TWVzc2FnZT0obXNnT2JqKT0+e3RoaXMuYnJvYWRjYXN0TWVzc2FnZSh1aUNvbXBvbmVudCxtc2dPYmopfVxyXG59XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgZGV2aWNlTWFuYWdlbWVudFVJKCk7IiwiY29uc3QgZ2xvYmFsQ2FjaGUgPSByZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvZ2xvYmFsQ2FjaGVcIik7XHJcblxyXG5mdW5jdGlvbiBzaW5nbGVNb2RlbFR3aW5zTGlzdChzaW5nbGVEQk1vZGVsLHBhcmVudFR3aW5zTGlzdCkge1xyXG4gICAgdGhpcy5wYXJlbnRUd2luc0xpc3Q9cGFyZW50VHdpbnNMaXN0XHJcbiAgICB0aGlzLmluZm89c2luZ2xlREJNb2RlbFxyXG4gICAgdGhpcy5jaGlsZFR3aW5zPXt9XHJcbiAgICB0aGlzLm5hbWU9c2luZ2xlREJNb2RlbC5kaXNwbGF5TmFtZTtcclxuICAgIHRoaXMuY3JlYXRlRE9NKClcclxufVxyXG5cclxuc2luZ2xlTW9kZWxUd2luc0xpc3QucHJvdG90eXBlLmNyZWF0ZURPTT1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5ET009JChcIjxkaXY+PC9kaXY+XCIpXHJcbiAgICB0aGlzLnBhcmVudFR3aW5zTGlzdC5ET00uYXBwZW5kKHRoaXMuRE9NKVxyXG5cclxuICAgIHRoaXMuaGVhZGVyRE9NPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYmxvY2sgdzMtbGlnaHQtZ3JleSB3My1sZWZ0LWFsaWduIHczLWJvcmRlci1ib3R0b21cIj48L2J1dHRvbj4nKVxyXG5cclxuICAgIHRoaXMubGlzdERPTT0kKCc8ZGl2IGNsYXNzPVwidzMtY29udGFpbmVyIHczLWhpZGUgdzMtYm9yZGVyIHczLXBhZGRpbmctMTZcIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKHRoaXMuaGVhZGVyRE9NLHRoaXMubGlzdERPTSlcclxuXHJcbiAgICB0aGlzLmhlYWRlckRPTS5vbihcImNsaWNrXCIsKGV2dCk9PiB7XHJcbiAgICAgICAgaWYodGhpcy5saXN0RE9NLmhhc0NsYXNzKFwidzMtc2hvd1wiKSkgdGhpcy5zaHJpbmsoKVxyXG4gICAgICAgIGVsc2UgdGhpcy5leHBhbmQoKVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vZmlsbCBpbiB0aGUgdHdpbnMgdW5kZXIgdGhpcyBtb2RlbFxyXG4gICAgdmFyIHR3aW5zPVtdXHJcbiAgICBnbG9iYWxDYWNoZS5EQlR3aW5zQXJyLmZvckVhY2goYVR3aW49PntcclxuICAgICAgICBpZihhVHdpbi5tb2RlbElEPT10aGlzLmluZm8uaWQpIHR3aW5zLnB1c2goYVR3aW4pXHJcbiAgICB9KVxyXG4gICAgdHdpbnMuc29ydChmdW5jdGlvbiAoYSwgYikgeyBcclxuICAgICAgICB2YXIgYU5hbWU9YS5kaXNwbGF5TmFtZS50b0xvd2VyQ2FzZSgpXHJcbiAgICAgICAgdmFyIGJOYW1lPWIuZGlzcGxheU5hbWUudG9Mb3dlckNhc2UoKVxyXG4gICAgICAgIHJldHVybiBhTmFtZS5sb2NhbGVDb21wYXJlKGJOYW1lKSBcclxuICAgIH0pO1xyXG4gICAgdHdpbnMuZm9yRWFjaChhVHdpbj0+e1xyXG4gICAgICAgIHRoaXMuY2hpbGRUd2luc1thVHdpbi5pZF09bmV3IHNpbmdsZVR3aW5JY29uKGFUd2luLHRoaXMpXHJcbiAgICB9KVxyXG5cclxuICAgIHRoaXMucmVmcmVzaE5hbWUoKVxyXG59XHJcblxyXG5zaW5nbGVNb2RlbFR3aW5zTGlzdC5wcm90b3R5cGUuZXhwYW5kPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLmxpc3RET00uYWRkQ2xhc3MoXCJ3My1zaG93XCIpXHJcbn1cclxuc2luZ2xlTW9kZWxUd2luc0xpc3QucHJvdG90eXBlLnNocmluaz1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5saXN0RE9NLnJlbW92ZUNsYXNzKFwidzMtc2hvd1wiKVxyXG59XHJcblxyXG5zaW5nbGVNb2RlbFR3aW5zTGlzdC5wcm90b3R5cGUucmVmcmVzaE5hbWU9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuaGVhZGVyRE9NLmVtcHR5KClcclxuICAgIHZhciBuYW1lRGl2PSQoXCI8ZGl2IGNsYXNzPSd3My10ZXh0LWRhcmstZ3JheScgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO3BhZGRpbmctcmlnaHQ6M3B4O3ZlcnRpY2FsLWFsaWduOm1pZGRsZTtmb250LXdlaWdodDpib2xkO2NvbG9yOmRhcmtncmF5Jz48L2Rpdj5cIilcclxuICAgIG5hbWVEaXYudGV4dCh0aGlzLm5hbWUpXHJcblxyXG4gICAgdmFyIGNvdW50VHdpbnM9MFxyXG4gICAgdmFyIGNvdW50SW9URGV2aWNlcz0wXHJcbiAgICBmb3IodmFyIGluZCBpbiB0aGlzLmNoaWxkVHdpbnMpIHtcclxuICAgICAgICBjb3VudFR3aW5zKytcclxuICAgICAgICBpZih0aGlzLmNoaWxkVHdpbnNbaW5kXS50d2luSW5mb1tcIklvVERldmljZUlEXCJdIT1udWxsKSBjb3VudElvVERldmljZXMrK1xyXG4gICAgfVxyXG4gICAgdmFyIG51bWJlcmxhYmVsPSQoXCI8bGFiZWwgY2xhc3M9J3czLW9yYW5nZScgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO2ZvbnQtc2l6ZTo5cHg7cGFkZGluZzoycHggNHB4O2ZvbnQtd2VpZ2h0Om5vcm1hbDtib3JkZXItcmFkaXVzOiAycHg7Jz5cIitjb3VudFR3aW5zK1wiIHR3aW5zPC9sYWJlbD5cIilcclxuICAgIHZhciBudW1iZXJsYWJlbDI9JChcIjxsYWJlbCBjbGFzcz0ndzMtbGltZScgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO2ZvbnQtc2l6ZTo5cHg7cGFkZGluZzoycHggNHB4O2ZvbnQtd2VpZ2h0Om5vcm1hbDtib3JkZXItcmFkaXVzOiAycHg7Jz5cIitjb3VudElvVERldmljZXMrXCIgSW9UIERldmljZXM8L2xhYmVsPlwiKVxyXG4gICAgXHJcbiAgICB2YXIgYWRkQnV0dG9uPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJlZCB3My1ob3Zlci1hbWJlciB3My1yaWdodFwiIHN0eWxlPVwibWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6NHB4IDhweFwiPis8L2J1dHRvbj4nKVxyXG4gICAgYWRkQnV0dG9uLm9uKFwiY2xpY2tcIiwoZSk9PntcclxuICAgICAgICB0aGlzLmV4cGFuZCgpXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlXHJcbiAgICB9KVxyXG5cclxuICAgIHRoaXMuaGVhZGVyRE9NLmFwcGVuZChuYW1lRGl2LG51bWJlcmxhYmVsLG51bWJlcmxhYmVsMixhZGRCdXR0b24pXHJcbn1cclxuXHJcbnNpbmdsZU1vZGVsVHdpbnNMaXN0LnByb3RvdHlwZS5yZWZyZXNoVHdpbnNJY29uPWZ1bmN0aW9uKCl7XHJcbiAgICBmb3IodmFyIHR3aW5JRCBpbiB0aGlzLmNoaWxkVHdpbnMpIHRoaXMuY2hpbGRUd2luc1t0d2luSURdLnJlZHJhd0ljb24oKVxyXG59XHJcblxyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cclxuZnVuY3Rpb24gc2luZ2xlVHdpbkljb24oc2luZ2xlREJUd2luLHBhcmVudE1vZGVsVHdpbnMpIHtcclxuICAgIHRoaXMudHdpbkluZm89c2luZ2xlREJUd2luXHJcbiAgICB0aGlzLnBhcmVudE1vZGVsVHdpbnM9cGFyZW50TW9kZWxUd2luc1xyXG4gICAgdGhpcy5ET009JChcIjxkaXYgY2xhc3M9J3czLWhvdmVyLWFtYmVyJyAgc3R5bGU9J3dpZHRoOjgwcHg7ZmxvYXQ6bGVmdDtoZWlnaHQ6MTAwcHg7bWFyZ2luOjhweDtjdXJzb3I6ZGVmYXVsdCcvPlwiKVxyXG5cclxuICAgIHRoaXMuSW9UTGFibGU9JChcIjxkaXYgc3R5bGU9J3dpZHRoOjMwJTt0ZXh0LWFsaWduOmNlbnRlcjtib3JkZXItcmFkaXVzOiAzcHg7bWFyZ2luOjVweCAzNSU7aGVpZ2h0OjE1cHg7Zm9udC13ZWlnaHQ6Ym9sZDtmb250LXNpemU6ODAlJz5Jb1Q8L2Rpdj5cIilcclxuXHJcbiAgICB0aGlzLmljb25ET009JChcIjxkaXYgc3R5bGU9J3dpZHRoOjMwcHg7aGVpZ2h0OjMwcHg7bWFyZ2luOjAgYXV0bzttYXJnaW4tdG9wOjEwcHg7cG9zaXRpb246cmVsYXRpdmUnPjwvZGl2PlwiKVxyXG4gICAgdGhpcy5uYW1lRE9NPSQoXCI8ZGl2IHN0eWxlPSd3b3JkLWJyZWFrOiBicmVhay13b3JkO3dpZHRoOjEwMCU7dGV4dC1hbGlnbjpjZW50ZXI7bWFyZ2luLXRvcDo1cHgnPlwiK3RoaXMudHdpbkluZm8uZGlzcGxheU5hbWUrXCI8L2Rpdj5cIilcclxuICAgIHRoaXMucmVkcmF3SWNvbigpXHJcbiAgICB0aGlzLnJlZHJhd0lvVFN0YXRlKClcclxuICAgIHBhcmVudE1vZGVsVHdpbnMubGlzdERPTS5hcHBlbmQodGhpcy5ET00pXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQodGhpcy5Jb1RMYWJsZSwgdGhpcy5pY29uRE9NLHRoaXMubmFtZURPTSlcclxufVxyXG5cclxuc2luZ2xlVHdpbkljb24ucHJvdG90eXBlLnJlZHJhd0lvVFN0YXRlPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLklvVExhYmxlLmFkZENsYXNzKFwidzMtZ3JheVwiKVxyXG4gICAgdGhpcy5Jb1RMYWJsZS5yZW1vdmVDbGFzcyhcInczLWxpbWVcIilcclxuICAgIHRoaXMuSW9UTGFibGUuY3NzKFwib3BhY2l0eVwiLDApXHJcblxyXG4gICAgaWYodGhpcy50d2luSW5mby5Jb1REZXZpY2VJRCE9bnVsbCkge1xyXG4gICAgICAgIHRoaXMuSW9UTGFibGUuY3NzKFwib3BhY2l0eVwiLDEwMCkgLy91c2Ugb3BhY2l0eSB0byBjb250cm9sIHNvIGl0IGhvbGRzIGl0cyBwbGFjZSBldmVuIHdoZW4gaXQgaXMgbm8gdmlzaWJsZVxyXG4gICAgICAgIGlmKHRoaXMudHdpbkluZm8uY29ubmVjdFN0YXRlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuSW9UTGFibGUucmVtb3ZlQ2xhc3MoXCJ3My1ncmF5XCIpXHJcbiAgICAgICAgICAgIHRoaXMuSW9UTGFibGUuYWRkQ2xhc3MoXCJ3My1saW1lXCIpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5zaW5nbGVUd2luSWNvbi5wcm90b3R5cGUucmVkcmF3SWNvbj1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5pY29uRE9NLmVtcHR5KClcclxuICAgIHZhciBtb2RlbElEPSB0aGlzLnR3aW5JbmZvLm1vZGVsSUQ7XHJcblxyXG4gICAgdmFyIHZpc3VhbEpzb249Z2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltcImRlZmF1bHRcIl1cclxuICAgIHZhciBmaWxsQ29sb3I9XCJncmF5XCJcclxuICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF0uY29sb3IpIGZpbGxDb2xvcj12aXN1YWxKc29uW21vZGVsSURdLmNvbG9yXHJcbiAgICB2YXIgZGltZW5zaW9uPTMwO1xyXG4gICAgaWYodmlzdWFsSnNvblttb2RlbElEXS5kaW1lbnNpb25SYXRpbyl7XHJcbiAgICAgICAgZGltZW5zaW9uKj1wYXJzZUZsb2F0KHZpc3VhbEpzb25bbW9kZWxJRF0uZGltZW5zaW9uUmF0aW8pXHJcbiAgICAgICAgdGhpcy5pY29uRE9NLmNzcyh7XCJ3aWR0aFwiOmRpbWVuc2lvbitcInB4XCIsXCJoZWlnaHRcIjpkaW1lbnNpb24rXCJweFwifSlcclxuICAgIH0gXHJcbiAgICB2YXIgc2hhcGU9XCJlbGxpcHNlXCJcclxuICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF0uc2hhcGUpIHNoYXBlPXZpc3VhbEpzb25bbW9kZWxJRF0uc2hhcGVcclxuICAgIHZhciBhdmFydGE9bnVsbFxyXG4gICAgaWYodmlzdWFsSnNvblttb2RlbElEXS5hdmFydGEpIGF2YXJ0YT12aXN1YWxKc29uW21vZGVsSURdLmF2YXJ0YVxyXG5cclxuICAgIHZhciBpbWdTcmM9dGhpcy5zaGFwZVN2ZyhzaGFwZSxmaWxsQ29sb3IpXHJcblxyXG4gICAgdGhpcy5pY29uRE9NLmFwcGVuZCgkKFwiPGltZyBzcmM9J2RhdGE6aW1hZ2Uvc3ZnK3htbDt1dGY4LFwiK2ltZ1NyYytcIic+PC9pbWc+XCIpKVxyXG4gICAgaWYoYXZhcnRhKXtcclxuICAgICAgICB2YXIgYXZhcnRhaW1nPSQoXCI8aW1nIHN0eWxlPSdwb3NpdGlvbjphYnNvbHV0ZTtsZWZ0OjBweDt3aWR0aDo2MCU7bWFyZ2luOjIwJScgc3JjPSdcIithdmFydGErXCInPjwvaW1nPlwiKVxyXG4gICAgICAgIHRoaXMuaWNvbkRPTS5hcHBlbmQoYXZhcnRhaW1nKVxyXG4gICAgfVxyXG4gICAgdGhpcy5uYW1lRE9NLnRleHQoKVxyXG59XHJcblxyXG5cclxuc2luZ2xlVHdpbkljb24ucHJvdG90eXBlLnNoYXBlU3ZnPWZ1bmN0aW9uKHNoYXBlLGNvbG9yKXsvL3JvdW5kLXJlY3RhbmdsZVwiOlwi4paJXCIsXCJoZXhhZ29uXHJcbiAgICBpZihzaGFwZT09XCJlbGxpcHNlXCIpe1xyXG4gICAgICAgIHJldHVybiAnPHN2ZyB4bWxuczpzdmc9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDEwMCAxMDBcIiBmaWxsPVwibm9uZVwiIHZlcnNpb249XCIxLjFcIiA+PGNpcmNsZSBjeD1cIjUwXCIgY3k9XCI1MFwiIHI9XCI1MFwiICBmaWxsPVwiJytjb2xvcisnXCIvPjwvc3ZnPidcclxuICAgIH1lbHNlIGlmKHNoYXBlPT1cImhleGFnb25cIil7XHJcbiAgICAgICAgcmV0dXJuICc8c3ZnIHhtbG5zOnN2Zz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHZpZXdCb3g9XCIwIDAgMTAwIDEwMFwiIGZpbGw9XCJub25lXCIgdmVyc2lvbj1cIjEuMVwiID48cG9seWdvbiBwb2ludHM9XCI1MCAwLCA5My4zIDI1LCA5My4zIDc1LCA1MCAxMDAsIDYuNyA3NSwgNi43IDI1XCIgIGZpbGw9XCInK2NvbG9yKydcIiAvPjwvc3ZnPidcclxuICAgIH1lbHNlIGlmKHNoYXBlPT1cInJvdW5kLXJlY3RhbmdsZVwiKXtcclxuICAgICAgICByZXR1cm4gJzxzdmcgeG1sbnM6c3ZnPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAxMDAgMTAwXCIgZmlsbD1cIm5vbmVcIiB2ZXJzaW9uPVwiMS4xXCIgPjxyZWN0IHg9XCIxMFwiIHk9XCIxMFwiIHJ4PVwiMTBcIiByeT1cIjEwXCIgd2lkdGg9XCI4MFwiIGhlaWdodD1cIjgwXCIgZmlsbD1cIicrY29sb3IrJ1wiIC8+PC9zdmc+J1xyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHNpbmdsZU1vZGVsVHdpbnNMaXN0OyIsImNvbnN0IG1zYWxIZWxwZXIgPSByZXF1aXJlKFwiLi4vbXNhbEhlbHBlclwiKVxyXG5jb25zdCBnbG9iYWxDYWNoZSA9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9nbG9iYWxDYWNoZVwiKVxyXG5jb25zdCBzaW5nbGVNb2RlbFR3aW5zTGlzdD1yZXF1aXJlKFwiLi9zaW5nbGVNb2RlbFR3aW5zTGlzdFwiKVxyXG5cclxuXHJcbmZ1bmN0aW9uIHR3aW5zTGlzdChET00pIHtcclxuICAgIHRoaXMuRE9NPURPTVxyXG4gICAgdGhpcy5zaW5nbGVNb2RlbFR3aW5zTGlzdFNldD17fVxyXG59XHJcblxyXG50d2luc0xpc3QucHJvdG90eXBlLnJlZmlsbD1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5ET00uZW1wdHkoKVxyXG4gICAgZm9yKHZhciBpbmQgaW4gdGhpcy5zaW5nbGVNb2RlbFR3aW5zTGlzdFNldCkgZGVsZXRlIHRoaXMuc2luZ2xlTW9kZWxUd2luc0xpc3RTZXRbaW5kXVxyXG4gICAgZ2xvYmFsQ2FjaGUuREJNb2RlbHNBcnIuZm9yRWFjaChvbmVNb2RlbD0+e1xyXG4gICAgICAgIHRoaXMuc2luZ2xlTW9kZWxUd2luc0xpc3RTZXRbb25lTW9kZWwuaWRdPW5ldyBzaW5nbGVNb2RlbFR3aW5zTGlzdChvbmVNb2RlbCx0aGlzLHRoaXMuRE9NKVxyXG4gICAgfSlcclxufVxyXG5cclxudHdpbnNMaXN0LnByb3RvdHlwZS5yeE1lc3NhZ2U9ZnVuY3Rpb24obXNnUGF5bG9hZCl7XHJcbiAgICBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwidmlzdWFsRGVmaW5pdGlvbkNoYW5nZVwiKXtcclxuICAgICAgICBpZihtc2dQYXlsb2FkLm1vZGVsSUQpIHRoaXMuc2luZ2xlTW9kZWxUd2luc0xpc3RTZXRbbXNnUGF5bG9hZC5tb2RlbElEXS5yZWZyZXNoVHdpbnNJY29uKClcclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB0d2luc0xpc3Q7IiwiY29uc3Qgc2lnbnVwc2lnbmlubmFtZT1cIkIyQ18xX3Npbmd1cHNpZ25pbl9zcGFhcHAxXCJcclxuY29uc3QgYjJjVGVuYW50TmFtZT1cImF6dXJlaW90YjJjXCJcclxuXHJcbmNvbnN0IHVybCA9IG5ldyBVUkwod2luZG93LmxvY2F0aW9uLmhyZWYpO1xyXG5cclxudmFyIHN0ckFycj13aW5kb3cubG9jYXRpb24uaHJlZi5zcGxpdChcIj9cIilcclxudmFyIGlzTG9jYWxUZXN0PShzdHJBcnIuaW5kZXhPZihcInRlc3Q9MVwiKSE9LTEpXHJcblxyXG5jb25zdCBnbG9iYWxBcHBTZXR0aW5ncz17XHJcbiAgICBcImIyY1NpZ25VcFNpZ25Jbk5hbWVcIjogc2lnbnVwc2lnbmlubmFtZSxcclxuICAgIFwiYjJjU2NvcGVfdGFza21hc3RlclwiOlwiaHR0cHM6Ly9cIitiMmNUZW5hbnROYW1lK1wiLm9ubWljcm9zb2Z0LmNvbS90YXNrbWFzdGVybW9kdWxlL29wZXJhdGlvblwiLFxyXG4gICAgXCJiMmNTY29wZV9mdW5jdGlvbnNcIjpcImh0dHBzOi8vXCIrYjJjVGVuYW50TmFtZStcIi5vbm1pY3Jvc29mdC5jb20vYXp1cmVpb3Ryb2Nrc2Z1bmN0aW9ucy9iYXNpY1wiLFxyXG4gICAgXCJsb2dvdXRSZWRpcmVjdFVyaVwiOiB1cmwub3JpZ2luK1wiL3NwYWluZGV4Lmh0bWxcIixcclxuICAgIFwibXNhbENvbmZpZ1wiOntcclxuICAgICAgICBhdXRoOiB7XHJcbiAgICAgICAgICAgIGNsaWVudElkOiBcImY0NjkzYmU1LTYwMWItNGQwZS05MjA4LWMzNWQ5YWQ2MjM4N1wiLFxyXG4gICAgICAgICAgICBhdXRob3JpdHk6IFwiaHR0cHM6Ly9cIitiMmNUZW5hbnROYW1lK1wiLmIyY2xvZ2luLmNvbS9cIitiMmNUZW5hbnROYW1lK1wiLm9ubWljcm9zb2Z0LmNvbS9cIitzaWdudXBzaWduaW5uYW1lLFxyXG4gICAgICAgICAgICBrbm93bkF1dGhvcml0aWVzOiBbYjJjVGVuYW50TmFtZStcIi5iMmNsb2dpbi5jb21cIl0sXHJcbiAgICAgICAgICAgIHJlZGlyZWN0VXJpOiB3aW5kb3cubG9jYXRpb24uaHJlZlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY2FjaGU6IHtcclxuICAgICAgICAgICAgY2FjaGVMb2NhdGlvbjogXCJzZXNzaW9uU3RvcmFnZVwiLCBcclxuICAgICAgICAgICAgc3RvcmVBdXRoU3RhdGVJbkNvb2tpZTogZmFsc2VcclxuICAgICAgICB9LFxyXG4gICAgICAgIHN5c3RlbToge1xyXG4gICAgICAgICAgICBsb2dnZXJPcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICBsb2dnZXJDYWxsYmFjazogKGxldmVsLCBtZXNzYWdlLCBjb250YWluc1BpaSkgPT4ge31cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcImlzTG9jYWxUZXN0XCI6aXNMb2NhbFRlc3QsXHJcbiAgICBcInRhc2tNYXN0ZXJBUElVUklcIjooKGlzTG9jYWxUZXN0KT9cImh0dHA6Ly9sb2NhbGhvc3Q6NTAwMi9cIjpcImh0dHBzOi8vYXp1cmVpb3Ryb2Nrc3Rhc2ttYXN0ZXJtb2R1bGUuYXp1cmV3ZWJzaXRlcy5uZXQvXCIpLFxyXG4gICAgXCJmdW5jdGlvbnNBUElVUklcIjpcImh0dHBzOi8vYXp1cmVpb3Ryb2Nrc2Z1bmN0aW9ucy5henVyZXdlYnNpdGVzLm5ldC9hcGkvXCJcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBnbG9iYWxBcHBTZXR0aW5nczsiLCJjb25zdCBnbG9iYWxBcHBTZXR0aW5ncz1yZXF1aXJlKFwiLi9nbG9iYWxBcHBTZXR0aW5nc1wiKVxyXG5cclxuZnVuY3Rpb24gbXNhbEhlbHBlcigpe1xyXG4gICAgdGhpcy5teU1TQUxPYmogPSBuZXcgbXNhbC5QdWJsaWNDbGllbnRBcHBsaWNhdGlvbihnbG9iYWxBcHBTZXR0aW5ncy5tc2FsQ29uZmlnKTtcclxufVxyXG5cclxubXNhbEhlbHBlci5wcm90b3R5cGUuc2lnbkluPWFzeW5jIGZ1bmN0aW9uKCl7XHJcbiAgICB0cnl7XHJcbiAgICAgICAgdmFyIHJlc3BvbnNlPSBhd2FpdCB0aGlzLm15TVNBTE9iai5sb2dpblBvcHVwKHsgc2NvcGVzOltdICB9KSAvL2dsb2JhbEFwcFNldHRpbmdzLmIyY1Njb3Blc1xyXG4gICAgICAgIGlmIChyZXNwb25zZSAhPSBudWxsKXtcclxuICAgICAgICAgICAgdGhpcy5zZXRBY2NvdW50KHJlc3BvbnNlLmFjY291bnQpXHJcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5hY2NvdW50XHJcbiAgICAgICAgfSBcclxuICAgICAgICBlbHNlICByZXR1cm4gdGhpcy5mZXRjaEFjY291bnQoKVxyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIGlmKGUuZXJyb3JDb2RlIT1cInVzZXJfY2FuY2VsbGVkXCIpIGNvbnNvbGUubG9nKGUpXHJcbiAgICB9XHJcbn1cclxuXHJcbm1zYWxIZWxwZXIucHJvdG90eXBlLnNldEFjY291bnQ9ZnVuY3Rpb24odGhlQWNjb3VudCl7XHJcbiAgICBpZih0aGVBY2NvdW50PT1udWxsKXJldHVybjtcclxuICAgIHRoaXMuYWNjb3VudElkID0gdGhlQWNjb3VudC5ob21lQWNjb3VudElkO1xyXG4gICAgdGhpcy5hY2NvdW50TmFtZSA9IHRoZUFjY291bnQudXNlcm5hbWU7XHJcbiAgICB0aGlzLnVzZXJOYW1lPXRoZUFjY291bnQubmFtZTtcclxufVxyXG5cclxubXNhbEhlbHBlci5wcm90b3R5cGUuZmV0Y2hBY2NvdW50PWZ1bmN0aW9uKG5vQW5pbWF0aW9uKXtcclxuICAgIGNvbnN0IGN1cnJlbnRBY2NvdW50cyA9IHRoaXMubXlNU0FMT2JqLmdldEFsbEFjY291bnRzKCk7XHJcbiAgICBpZiAoY3VycmVudEFjY291bnRzLmxlbmd0aCA8IDEpIHJldHVybjtcclxuICAgIHZhciBmb3VuZEFjY291bnQ9bnVsbDtcclxuICAgIGZvcih2YXIgaT0wO2k8Y3VycmVudEFjY291bnRzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBhbkFjY291bnQ9IGN1cnJlbnRBY2NvdW50c1tpXVxyXG4gICAgICAgIGlmKGFuQWNjb3VudC5ob21lQWNjb3VudElkLnRvVXBwZXJDYXNlKCkuaW5jbHVkZXMoZ2xvYmFsQXBwU2V0dGluZ3MuYjJjU2lnblVwU2lnbkluTmFtZS50b1VwcGVyQ2FzZSgpKVxyXG4gICAgICAgICAgICAmJiBhbkFjY291bnQuaWRUb2tlbkNsYWltcy5pc3MudG9VcHBlckNhc2UoKS5pbmNsdWRlcyhnbG9iYWxBcHBTZXR0aW5ncy5tc2FsQ29uZmlnLmF1dGgua25vd25BdXRob3JpdGllc1swXS50b1VwcGVyQ2FzZSgpKVxyXG4gICAgICAgICAgICAmJiBhbkFjY291bnQuaWRUb2tlbkNsYWltcy5hdWQgPT09IGdsb2JhbEFwcFNldHRpbmdzLm1zYWxDb25maWcuYXV0aC5jbGllbnRJZFxyXG4gICAgICAgICl7XHJcbiAgICAgICAgICAgIGZvdW5kQWNjb3VudD0gYW5BY2NvdW50O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMuc2V0QWNjb3VudChmb3VuZEFjY291bnQpXHJcbiAgICByZXR1cm4gZm91bmRBY2NvdW50O1xyXG59XHJcblxyXG5cclxubXNhbEhlbHBlci5wcm90b3R5cGUuY2FsbEF6dXJlRnVuY3Rpb25zU2VydmljZT1hc3luYyBmdW5jdGlvbihBUElTdHJpbmcsUkVTVE1ldGhvZCxwYXlsb2FkKXtcclxuICAgIHZhciBoZWFkZXJzT2JqPXt9XHJcbiAgICB2YXIgdG9rZW49YXdhaXQgdGhpcy5nZXRUb2tlbihnbG9iYWxBcHBTZXR0aW5ncy5iMmNTY29wZV9mdW5jdGlvbnMpXHJcbiAgICBoZWFkZXJzT2JqW1wiQXV0aG9yaXphdGlvblwiXT1gQmVhcmVyICR7dG9rZW59YFxyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICB2YXIgYWpheENvbnRlbnQ9e1xyXG4gICAgICAgICAgICB0eXBlOiBSRVNUTWV0aG9kIHx8ICdHRVQnLFxyXG4gICAgICAgICAgICBcImhlYWRlcnNcIjpoZWFkZXJzT2JqLFxyXG4gICAgICAgICAgICB1cmw6IGdsb2JhbEFwcFNldHRpbmdzLmZ1bmN0aW9uc0FQSVVSSStBUElTdHJpbmcsXHJcbiAgICAgICAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIixcclxuICAgICAgICAgICAgY3Jvc3NEb21haW46IHRydWUsXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChyZXNwb25zZURhdGEsIHRleHRTdGF0dXMsIGpxWEhSKSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3BvbnNlRGF0YSlcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uIChyZXNwb25zZURhdGEsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKSB7XHJcbiAgICAgICAgICAgICAgICByZWplY3QocmVzcG9uc2VEYXRhKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKFJFU1RNZXRob2Q9PVwiUE9TVFwiKSBhamF4Q29udGVudC5kYXRhPSBKU09OLnN0cmluZ2lmeShwYXlsb2FkKVxyXG4gICAgICAgICQuYWpheChhamF4Q29udGVudCk7XHJcbiAgICB9KVxyXG59XHJcblxyXG5tc2FsSGVscGVyLnByb3RvdHlwZS5jYWxsQVBJPWFzeW5jIGZ1bmN0aW9uKEFQSVN0cmluZyxSRVNUTWV0aG9kLHBheWxvYWQpe1xyXG4gICAgdmFyIGhlYWRlcnNPYmo9e31cclxuICAgIGlmKCFnbG9iYWxBcHBTZXR0aW5ncy5pc0xvY2FsVGVzdCl7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICB2YXIgdG9rZW49YXdhaXQgdGhpcy5nZXRUb2tlbihnbG9iYWxBcHBTZXR0aW5ncy5iMmNTY29wZV90YXNrbWFzdGVyKVxyXG4gICAgICAgIH1jYXRjaChlKXtcclxuICAgICAgICAgICAgd2luZG93Lm9wZW4oZ2xvYmFsQXBwU2V0dGluZ3MubG9nb3V0UmVkaXJlY3RVcmksXCJfc2VsZlwiKVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBoZWFkZXJzT2JqW1wiQXV0aG9yaXphdGlvblwiXT1gQmVhcmVyICR7dG9rZW59YFxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgdmFyIGFqYXhDb250ZW50PXtcclxuICAgICAgICAgICAgdHlwZTogUkVTVE1ldGhvZCB8fCAnR0VUJyxcclxuICAgICAgICAgICAgXCJoZWFkZXJzXCI6aGVhZGVyc09iaixcclxuICAgICAgICAgICAgdXJsOiBnbG9iYWxBcHBTZXR0aW5ncy50YXNrTWFzdGVyQVBJVVJJK0FQSVN0cmluZyxcclxuICAgICAgICAgICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiLFxyXG4gICAgICAgICAgICBjcm9zc0RvbWFpbjogdHJ1ZSxcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKHJlc3BvbnNlRGF0YSwgdGV4dFN0YXR1cywganFYSFIpIHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUocmVzcG9uc2VEYXRhKVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKHJlc3BvbnNlRGF0YSwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pIHtcclxuICAgICAgICAgICAgICAgIHJlamVjdChyZXNwb25zZURhdGEpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoUkVTVE1ldGhvZD09XCJQT1NUXCIpIGFqYXhDb250ZW50LmRhdGE9IEpTT04uc3RyaW5naWZ5KHBheWxvYWQpXHJcbiAgICAgICAgJC5hamF4KGFqYXhDb250ZW50KTtcclxuICAgIH0pXHJcbn1cclxuXHJcbm1zYWxIZWxwZXIucHJvdG90eXBlLmdldFRva2VuPWFzeW5jIGZ1bmN0aW9uKGIyY1Njb3BlKXtcclxuICAgIHRyeXtcclxuICAgICAgICBpZih0aGlzLnN0b3JlZFRva2VuPT1udWxsKSB0aGlzLnN0b3JlZFRva2VuPXt9XHJcbiAgICAgICAgaWYodGhpcy5zdG9yZWRUb2tlbltiMmNTY29wZV0hPW51bGwpe1xyXG4gICAgICAgICAgICB2YXIgY3VyclRpbWU9cGFyc2VJbnQobmV3IERhdGUoKS5nZXRUaW1lKCkvMTAwMClcclxuICAgICAgICAgICAgaWYoY3VyclRpbWUrNjAgPCB0aGlzLnN0b3JlZFRva2VuW2IyY1Njb3BlXS5leHBpcmUpIHJldHVybiB0aGlzLnN0b3JlZFRva2VuW2IyY1Njb3BlXS5hY2Nlc3NUb2tlblxyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgdG9rZW5SZXF1ZXN0PXtcclxuICAgICAgICAgICAgc2NvcGVzOiBbYjJjU2NvcGVdLFxyXG4gICAgICAgICAgICBmb3JjZVJlZnJlc2g6IGZhbHNlLCAvLyBTZXQgdGhpcyB0byBcInRydWVcIiB0byBza2lwIGEgY2FjaGVkIHRva2VuIGFuZCBnbyB0byB0aGUgc2VydmVyIHRvIGdldCBhIG5ldyB0b2tlblxyXG4gICAgICAgICAgICBhY2NvdW50OiB0aGlzLm15TVNBTE9iai5nZXRBY2NvdW50QnlIb21lSWQodGhpcy5hY2NvdW50SWQpXHJcbiAgICAgICAgfVxyXG4gICAgXHJcbiAgICAgICAgdmFyIHJlc3BvbnNlID0gYXdhaXQgdGhpcy5teU1TQUxPYmouYWNxdWlyZVRva2VuU2lsZW50KHRva2VuUmVxdWVzdClcclxuICAgICAgICBpZiAoIXJlc3BvbnNlLmFjY2Vzc1Rva2VuIHx8IHJlc3BvbnNlLmFjY2Vzc1Rva2VuID09PSBcIlwiKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBtc2FsLkludGVyYWN0aW9uUmVxdWlyZWRBdXRoRXJyb3I7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuc3RvcmVkVG9rZW5bYjJjU2NvcGVdPXtcImFjY2Vzc1Rva2VuXCI6cmVzcG9uc2UuYWNjZXNzVG9rZW4sXCJleHBpcmVcIjpyZXNwb25zZS5pZFRva2VuQ2xhaW1zLmV4cH1cclxuICAgIH1jYXRjaChlcnJvcil7XHJcbiAgICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgbXNhbC5JbnRlcmFjdGlvblJlcXVpcmVkQXV0aEVycm9yKSB7XHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrIHRvIGludGVyYWN0aW9uIHdoZW4gc2lsZW50IGNhbGwgZmFpbHNcclxuICAgICAgICAgICAgdmFyIHJlc3BvbnNlPWF3YWl0IHRoaXMubXlNU0FMT2JqLmFjcXVpcmVUb2tlblBvcHVwKHRva2VuUmVxdWVzdClcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc3BvbnNlLmFjY2Vzc1Rva2VuO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBtc2FsSGVscGVyKCk7IiwiY29uc3QgbXNhbEhlbHBlcj1yZXF1aXJlKFwiLi4vbXNhbEhlbHBlclwiKVxyXG5jb25zdCBtb2RlbEFuYWx5emVyPXJlcXVpcmUoXCIuL21vZGVsQW5hbHl6ZXJcIilcclxuXHJcbmZ1bmN0aW9uIGdsb2JhbENhY2hlKCl7XHJcbiAgICB0aGlzLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwcyA9IHt9XHJcbiAgICB0aGlzLnN0b3JlZFR3aW5zID0ge31cclxuICAgIC8vc3RvcmVkIGRhdGEsIHNlcGVyYXRlbHkgZnJvbSBBRFQgc2VydmljZSBhbmQgZnJvbSBjb3Ntb3NEQiBzZXJ2aWNlXHJcbiAgICB0aGlzLkRCTW9kZWxzQXJyID0gW11cclxuICAgIHRoaXMubW9kZWxJRE1hcFRvTmFtZT17fVxyXG4gICAgdGhpcy5tb2RlbE5hbWVNYXBUb0lEPXt9XHJcblxyXG4gICAgdGhpcy5EQlR3aW5zQXJyID0gW11cclxuICAgIHRoaXMudHdpbklETWFwVG9EaXNwbGF5TmFtZT17fVxyXG5cclxuICAgIHRoaXMuY3VycmVudExheW91dE5hbWU9bnVsbFxyXG4gICAgdGhpcy5sYXlvdXRKU09OPXt9XHJcblxyXG4gICAgdGhpcy52aXN1YWxEZWZpbml0aW9uPXtcImRlZmF1bHRcIjp7fX1cclxufVxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLmxvYWRVc2VyRGF0YSA9IGFzeW5jIGZ1bmN0aW9uICgpIHtcclxuICAgIHRyeXtcclxuICAgICAgICB2YXIgcmVzPWF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2ZldGNoVXNlckRhdGFcIilcclxuICAgIH1jYXRjaChlKXtcclxuICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB2YXIgZGJ0d2lucz1bXVxyXG4gICAgdmFyIGRibW9kZWxzPVtdXHJcbiAgICByZXMuZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICBpZihlbGVtZW50LnR5cGU9PVwidmlzdWFsU2NoZW1hXCIpIHtcclxuICAgICAgICAgICAgLy9UT0RPOiBub3cgdGhlcmUgaXMgb25seSBvbmUgXCJkZWZhdWx0XCIgc2NoZW1hIHRvIHVzZVxyXG4gICAgICAgICAgICB0aGlzLnZpc3VhbERlZmluaXRpb25bZWxlbWVudC5uYW1lXT1lbGVtZW50LmRldGFpbFxyXG4gICAgICAgIH1lbHNlIGlmKGVsZW1lbnQudHlwZT09XCJUb3BvbG9neVwiKSB7XHJcbiAgICAgICAgICAgIHRoaXMubGF5b3V0SlNPTltlbGVtZW50Lm5hbWVdPWVsZW1lbnQuZGV0YWlsXHJcbiAgICAgICAgfWVsc2UgaWYoZWxlbWVudC50eXBlPT1cIkRUTW9kZWxcIikgZGJtb2RlbHMucHVzaChlbGVtZW50KVxyXG4gICAgICAgIGVsc2UgaWYoZWxlbWVudC50eXBlPT1cIkRUVHdpblwiKSBkYnR3aW5zLnB1c2goZWxlbWVudClcclxuICAgIH0pO1xyXG4gICAgdGhpcy5zdG9yZURCVHdpbnNBcnIoZGJ0d2lucylcclxuICAgIHRoaXMuc3RvcmVEQk1vZGVsc0FycihkYm1vZGVscylcclxuICAgIC8vcXVlcnkgZGV0YWlsIG9mIGFsbCBtb2RlbHNcclxuICAgIGZvcih2YXIgaW5kIGluIHRoaXMubW9kZWxJRE1hcFRvTmFtZSkgZGVsZXRlIHRoaXMubW9kZWxJRE1hcFRvTmFtZVtpbmRdXHJcbiAgICBmb3IodmFyIGluZCBpbiB0aGlzLm1vZGVsTmFtZU1hcFRvSUQpIGRlbGV0ZSB0aGlzLm1vZGVsTmFtZU1hcFRvSURbaW5kXVxyXG4gICAgdmFyIG1vZGVsSURzPVtdXHJcbiAgICB0aGlzLkRCTW9kZWxzQXJyLmZvckVhY2gob25lTW9kZWw9Pnttb2RlbElEcy5wdXNoKG9uZU1vZGVsW1wiaWRcIl0pfSlcclxuICAgIHRyeSB7XHJcbiAgICAgICAgdmFyIGRhdGEgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9saXN0TW9kZWxzRm9ySURzXCIsIFwiUE9TVFwiLCBtb2RlbElEcylcclxuICAgICAgICB2YXIgdG1wTmFtZVRvT2JqID0ge31cclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKGRhdGFbaV1bXCJkaXNwbGF5TmFtZVwiXSA9PSBudWxsKSBkYXRhW2ldW1wiZGlzcGxheU5hbWVcIl0gPSBkYXRhW2ldW1wiQGlkXCJdXHJcbiAgICAgICAgICAgIGlmICgkLmlzUGxhaW5PYmplY3QoZGF0YVtpXVtcImRpc3BsYXlOYW1lXCJdKSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGRhdGFbaV1bXCJkaXNwbGF5TmFtZVwiXVtcImVuXCJdKSBkYXRhW2ldW1wiZGlzcGxheU5hbWVcIl0gPSBkYXRhW2ldW1wiZGlzcGxheU5hbWVcIl1bXCJlblwiXVxyXG4gICAgICAgICAgICAgICAgZWxzZSBkYXRhW2ldW1wiZGlzcGxheU5hbWVcIl0gPSBKU09OLnN0cmluZ2lmeShkYXRhW2ldW1wiZGlzcGxheU5hbWVcIl0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRtcE5hbWVUb09ialtkYXRhW2ldW1wiZGlzcGxheU5hbWVcIl1dICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIC8vcmVwZWF0ZWQgbW9kZWwgZGlzcGxheSBuYW1lXHJcbiAgICAgICAgICAgICAgICBkYXRhW2ldW1wiZGlzcGxheU5hbWVcIl0gPSBkYXRhW2ldW1wiQGlkXCJdXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdG1wTmFtZVRvT2JqW2RhdGFbaV1bXCJkaXNwbGF5TmFtZVwiXV0gPSBkYXRhW2ldXHJcblxyXG4gICAgICAgICAgICB0aGlzLm1vZGVsSURNYXBUb05hbWVbZGF0YVtpXVtcIkBpZFwiXV09ZGF0YVtpXVtcImRpc3BsYXlOYW1lXCJdXHJcbiAgICAgICAgICAgIHRoaXMubW9kZWxOYW1lTWFwVG9JRFtkYXRhW2ldW1wiZGlzcGxheU5hbWVcIl1dPWRhdGFbaV1bXCJAaWRcIl1cclxuICAgICAgICB9XHJcbiAgICAgICAgbW9kZWxBbmFseXplci5jbGVhckFsbE1vZGVscygpO1xyXG4gICAgICAgIG1vZGVsQW5hbHl6ZXIuYWRkTW9kZWxzKGRhdGEpXHJcbiAgICAgICAgbW9kZWxBbmFseXplci5hbmFseXplKCk7XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICB9XHJcbn1cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZUFEVFR3aW5zPWZ1bmN0aW9uKHR3aW5zRGF0YSl7XHJcbiAgICB0d2luc0RhdGEuZm9yRWFjaCgob25lTm9kZSk9Pnt0aGlzLnN0b3JlU2luZ2xlQURUVHdpbihvbmVOb2RlKX0pO1xyXG59XHJcblxyXG5nbG9iYWxDYWNoZS5wcm90b3R5cGUuc3RvcmVTaW5nbGVBRFRUd2luPWZ1bmN0aW9uKG9uZU5vZGUpe1xyXG4gICAgdGhpcy5zdG9yZWRUd2luc1tvbmVOb2RlW1wiJGR0SWRcIl1dID0gb25lTm9kZVxyXG4gICAgb25lTm9kZVtcImRpc3BsYXlOYW1lXCJdPSB0aGlzLnR3aW5JRE1hcFRvRGlzcGxheU5hbWVbb25lTm9kZVtcIiRkdElkXCJdXVxyXG59XHJcblxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLnN0b3JlU2luZ2xlREJUd2luPWZ1bmN0aW9uKERCVHdpbil7XHJcbiAgICBmb3IodmFyIGk9MDtpPHRoaXMuREJUd2luc0Fyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIgb25lREJUd2luPXRoaXMuREJUd2luc0FycltpXVxyXG4gICAgICAgIGlmKG9uZURCVHdpbltcImlkXCJdPT1EQlR3aW5bXCJpZFwiXSl7XHJcbiAgICAgICAgICAgIHRoaXMuREJUd2luc0Fyci5zcGxpY2UoaSwxKVxyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLkRCVHdpbnNBcnIucHVzaChEQlR3aW4pXHJcblxyXG4gICAgdGhpcy50d2luSURNYXBUb0Rpc3BsYXlOYW1lW0RCVHdpbltcImlkXCJdXT1EQlR3aW5bXCJkaXNwbGF5TmFtZVwiXVxyXG59XHJcblxyXG5nbG9iYWxDYWNoZS5wcm90b3R5cGUuc3RvcmVEQlR3aW5zQXJyPWZ1bmN0aW9uKERCVHdpbnNBcnIpe1xyXG4gICAgdGhpcy5EQlR3aW5zQXJyLmxlbmd0aD0wXHJcbiAgICB0aGlzLkRCVHdpbnNBcnI9dGhpcy5EQlR3aW5zQXJyLmNvbmNhdChEQlR3aW5zQXJyKVxyXG4gICAgZm9yKHZhciBpbmQgaW4gdGhpcy50d2luSURNYXBUb0Rpc3BsYXlOYW1lKSBkZWxldGUgdGhpcy50d2luSURNYXBUb0Rpc3BsYXlOYW1lW2luZF1cclxuICAgIHRoaXMuREJUd2luc0Fyci5mb3JFYWNoKG9uZURCVHdpbj0+e1xyXG4gICAgICAgIHRoaXMudHdpbklETWFwVG9EaXNwbGF5TmFtZVtvbmVEQlR3aW5bXCJpZFwiXV09b25lREJUd2luW1wiZGlzcGxheU5hbWVcIl1cclxuICAgIH0pXHJcbn1cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZURCTW9kZWxzQXJyPWZ1bmN0aW9uKERCTW9kZWxzQXJyKXtcclxuICAgIHRoaXMuREJNb2RlbHNBcnIubGVuZ3RoPTBcclxuICAgIHRoaXMuREJNb2RlbHNBcnI9dGhpcy5EQk1vZGVsc0Fyci5jb25jYXQoREJNb2RlbHNBcnIpXHJcbiAgICB0aGlzLkRCTW9kZWxzQXJyLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgXHJcbiAgICAgICAgdmFyIGFOYW1lPWEuZGlzcGxheU5hbWUudG9Mb3dlckNhc2UoKVxyXG4gICAgICAgIHZhciBiTmFtZT1iLmRpc3BsYXlOYW1lLnRvTG93ZXJDYXNlKClcclxuICAgICAgICByZXR1cm4gYU5hbWUubG9jYWxlQ29tcGFyZShiTmFtZSkgXHJcbiAgICB9KTtcclxufVxyXG5cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzPWZ1bmN0aW9uKHJlbGF0aW9uc0RhdGEpe1xyXG4gICAgcmVsYXRpb25zRGF0YS5mb3JFYWNoKChvbmVSZWxhdGlvbnNoaXApPT57XHJcbiAgICAgICAgdmFyIHR3aW5JRD1vbmVSZWxhdGlvbnNoaXBbJyRzb3VyY2VJZCddXHJcbiAgICAgICAgdGhpcy5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbdHdpbklEXT1bXVxyXG4gICAgfSlcclxuXHJcbiAgICByZWxhdGlvbnNEYXRhLmZvckVhY2goKG9uZVJlbGF0aW9uc2hpcCk9PntcclxuICAgICAgICB0aGlzLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tvbmVSZWxhdGlvbnNoaXBbJyRzb3VyY2VJZCddXS5wdXNoKG9uZVJlbGF0aW9uc2hpcClcclxuICAgIH0pXHJcbn1cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzX2FwcGVuZD1mdW5jdGlvbihyZWxhdGlvbnNEYXRhKXtcclxuICAgIHJlbGF0aW9uc0RhdGEuZm9yRWFjaCgob25lUmVsYXRpb25zaGlwKT0+e1xyXG4gICAgICAgIGlmKCF0aGlzLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tvbmVSZWxhdGlvbnNoaXBbJyRzb3VyY2VJZCddXSlcclxuICAgICAgICAgICAgdGhpcy5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbb25lUmVsYXRpb25zaGlwWyckc291cmNlSWQnXV09W11cclxuICAgICAgICB0aGlzLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tvbmVSZWxhdGlvbnNoaXBbJyRzb3VyY2VJZCddXS5wdXNoKG9uZVJlbGF0aW9uc2hpcClcclxuICAgIH0pXHJcbn1cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzX3JlbW92ZT1mdW5jdGlvbihyZWxhdGlvbnNEYXRhKXtcclxuICAgIHJlbGF0aW9uc0RhdGEuZm9yRWFjaCgob25lUmVsYXRpb25zaGlwKT0+e1xyXG4gICAgICAgIHZhciBzcmNJRD1vbmVSZWxhdGlvbnNoaXBbXCJzcmNJRFwiXVxyXG4gICAgICAgIGlmKHRoaXMuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW3NyY0lEXSl7XHJcbiAgICAgICAgICAgIHZhciBhcnI9dGhpcy5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbc3JjSURdXHJcbiAgICAgICAgICAgIGZvcih2YXIgaT0wO2k8YXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICAgICAgaWYoYXJyW2ldWyckcmVsYXRpb25zaGlwSWQnXT09b25lUmVsYXRpb25zaGlwW1wicmVsSURcIl0pe1xyXG4gICAgICAgICAgICAgICAgICAgIGFyci5zcGxpY2UoaSwxKVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgZ2xvYmFsQ2FjaGUoKTsiLCIvL1RoaXMgaXMgYSBzaW5nbGV0b24gY2xhc3NcclxuXHJcbmZ1bmN0aW9uIG1vZGVsQW5hbHl6ZXIoKXtcclxuICAgIHRoaXMuRFRETE1vZGVscz17fVxyXG4gICAgdGhpcy5yZWxhdGlvbnNoaXBUeXBlcz17fVxyXG59XHJcblxyXG5tb2RlbEFuYWx5emVyLnByb3RvdHlwZS5jbGVhckFsbE1vZGVscz1mdW5jdGlvbigpe1xyXG4gICAgLy9jb25zb2xlLmxvZyhcImNsZWFyIGFsbCBtb2RlbCBpbmZvXCIpXHJcbiAgICBmb3IodmFyIGlkIGluIHRoaXMuRFRETE1vZGVscykgZGVsZXRlIHRoaXMuRFRETE1vZGVsc1tpZF1cclxufVxyXG5cclxubW9kZWxBbmFseXplci5wcm90b3R5cGUucmVzZXRBbGxNb2RlbHM9ZnVuY3Rpb24oYXJyKXtcclxuICAgIGZvcih2YXIgbW9kZWxJRCBpbiB0aGlzLkRURExNb2RlbHMpe1xyXG4gICAgICAgIHZhciBqc29uU3RyPXRoaXMuRFRETE1vZGVsc1ttb2RlbElEXVtcIm9yaWdpbmFsXCJdXHJcbiAgICAgICAgdGhpcy5EVERMTW9kZWxzW21vZGVsSURdPUpTT04ucGFyc2UoanNvblN0cilcclxuICAgICAgICB0aGlzLkRURExNb2RlbHNbbW9kZWxJRF1bXCJvcmlnaW5hbFwiXT1qc29uU3RyXHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5tb2RlbEFuYWx5emVyLnByb3RvdHlwZS5hZGRNb2RlbHM9ZnVuY3Rpb24oYXJyKXtcclxuICAgIGFyci5mb3JFYWNoKChlbGUpPT57XHJcbiAgICAgICAgdmFyIG1vZGVsSUQ9IGVsZVtcIkBpZFwiXVxyXG4gICAgICAgIGVsZVtcIm9yaWdpbmFsXCJdPUpTT04uc3RyaW5naWZ5KGVsZSlcclxuICAgICAgICB0aGlzLkRURExNb2RlbHNbbW9kZWxJRF09ZWxlXHJcbiAgICB9KVxyXG59XHJcblxyXG5cclxubW9kZWxBbmFseXplci5wcm90b3R5cGUucmVjb3JkQWxsQmFzZUNsYXNzZXM9IGZ1bmN0aW9uIChwYXJlbnRPYmosIGJhc2VDbGFzc0lEKSB7XHJcbiAgICB2YXIgYmFzZUNsYXNzID0gdGhpcy5EVERMTW9kZWxzW2Jhc2VDbGFzc0lEXVxyXG4gICAgaWYgKGJhc2VDbGFzcyA9PSBudWxsKSByZXR1cm47XHJcblxyXG4gICAgcGFyZW50T2JqW2Jhc2VDbGFzc0lEXT0xXHJcblxyXG4gICAgdmFyIGZ1cnRoZXJCYXNlQ2xhc3NJRHMgPSBiYXNlQ2xhc3MuZXh0ZW5kcztcclxuICAgIGlmIChmdXJ0aGVyQmFzZUNsYXNzSURzID09IG51bGwpIHJldHVybjtcclxuICAgIGlmKEFycmF5LmlzQXJyYXkoZnVydGhlckJhc2VDbGFzc0lEcykpIHZhciB0bXBBcnI9ZnVydGhlckJhc2VDbGFzc0lEc1xyXG4gICAgZWxzZSB0bXBBcnI9W2Z1cnRoZXJCYXNlQ2xhc3NJRHNdXHJcbiAgICB0bXBBcnIuZm9yRWFjaCgoZWFjaEJhc2UpID0+IHsgdGhpcy5yZWNvcmRBbGxCYXNlQ2xhc3NlcyhwYXJlbnRPYmosIGVhY2hCYXNlKSB9KVxyXG59XHJcblxyXG5tb2RlbEFuYWx5emVyLnByb3RvdHlwZS5leHBhbmRFZGl0YWJsZVByb3BlcnRpZXNGcm9tQmFzZUNsYXNzID0gZnVuY3Rpb24gKHBhcmVudE9iaiwgYmFzZUNsYXNzSUQpIHtcclxuICAgIHZhciBiYXNlQ2xhc3MgPSB0aGlzLkRURExNb2RlbHNbYmFzZUNsYXNzSURdXHJcbiAgICBpZiAoYmFzZUNsYXNzID09IG51bGwpIHJldHVybjtcclxuICAgIGlmIChiYXNlQ2xhc3MuZWRpdGFibGVQcm9wZXJ0aWVzKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaW5kIGluIGJhc2VDbGFzcy5lZGl0YWJsZVByb3BlcnRpZXMpIHBhcmVudE9ialtpbmRdID0gYmFzZUNsYXNzLmVkaXRhYmxlUHJvcGVydGllc1tpbmRdXHJcbiAgICB9XHJcbiAgICB2YXIgZnVydGhlckJhc2VDbGFzc0lEcyA9IGJhc2VDbGFzcy5leHRlbmRzO1xyXG4gICAgaWYgKGZ1cnRoZXJCYXNlQ2xhc3NJRHMgPT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgaWYoQXJyYXkuaXNBcnJheShmdXJ0aGVyQmFzZUNsYXNzSURzKSkgdmFyIHRtcEFycj1mdXJ0aGVyQmFzZUNsYXNzSURzXHJcbiAgICBlbHNlIHRtcEFycj1bZnVydGhlckJhc2VDbGFzc0lEc11cclxuICAgIHRtcEFyci5mb3JFYWNoKChlYWNoQmFzZSkgPT4geyB0aGlzLmV4cGFuZEVkaXRhYmxlUHJvcGVydGllc0Zyb21CYXNlQ2xhc3MocGFyZW50T2JqLCBlYWNoQmFzZSkgfSlcclxufVxyXG5cclxubW9kZWxBbmFseXplci5wcm90b3R5cGUuZXhwYW5kVmFsaWRSZWxhdGlvbnNoaXBUeXBlc0Zyb21CYXNlQ2xhc3MgPSBmdW5jdGlvbiAocGFyZW50T2JqLCBiYXNlQ2xhc3NJRCkge1xyXG4gICAgdmFyIGJhc2VDbGFzcyA9IHRoaXMuRFRETE1vZGVsc1tiYXNlQ2xhc3NJRF1cclxuICAgIGlmIChiYXNlQ2xhc3MgPT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgaWYgKGJhc2VDbGFzcy52YWxpZFJlbGF0aW9uc2hpcHMpIHtcclxuICAgICAgICBmb3IgKHZhciBpbmQgaW4gYmFzZUNsYXNzLnZhbGlkUmVsYXRpb25zaGlwcykge1xyXG4gICAgICAgICAgICBpZihwYXJlbnRPYmpbaW5kXT09bnVsbCkgcGFyZW50T2JqW2luZF0gPSB0aGlzLnJlbGF0aW9uc2hpcFR5cGVzW2luZF1bYmFzZUNsYXNzSURdXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdmFyIGZ1cnRoZXJCYXNlQ2xhc3NJRHMgPSBiYXNlQ2xhc3MuZXh0ZW5kcztcclxuICAgIGlmIChmdXJ0aGVyQmFzZUNsYXNzSURzID09IG51bGwpIHJldHVybjtcclxuICAgIGlmKEFycmF5LmlzQXJyYXkoZnVydGhlckJhc2VDbGFzc0lEcykpIHZhciB0bXBBcnI9ZnVydGhlckJhc2VDbGFzc0lEc1xyXG4gICAgZWxzZSB0bXBBcnI9W2Z1cnRoZXJCYXNlQ2xhc3NJRHNdXHJcbiAgICB0bXBBcnIuZm9yRWFjaCgoZWFjaEJhc2UpID0+IHsgdGhpcy5leHBhbmRWYWxpZFJlbGF0aW9uc2hpcFR5cGVzRnJvbUJhc2VDbGFzcyhwYXJlbnRPYmosIGVhY2hCYXNlKSB9KVxyXG59XHJcblxyXG5tb2RlbEFuYWx5emVyLnByb3RvdHlwZS5leHBhbmRFZGl0YWJsZVByb3BlcnRpZXM9ZnVuY3Rpb24ocGFyZW50T2JqLGRhdGFJbmZvLGVtYmVkZGVkU2NoZW1hKXtcclxuICAgIGRhdGFJbmZvLmZvckVhY2goKG9uZUNvbnRlbnQpPT57XHJcbiAgICAgICAgaWYob25lQ29udGVudFtcIkB0eXBlXCJdPT1cIlJlbGF0aW9uc2hpcFwiKSByZXR1cm47XHJcbiAgICAgICAgaWYob25lQ29udGVudFtcIkB0eXBlXCJdPT1cIlByb3BlcnR5XCJcclxuICAgICAgICB8fChBcnJheS5pc0FycmF5KG9uZUNvbnRlbnRbXCJAdHlwZVwiXSkgJiYgb25lQ29udGVudFtcIkB0eXBlXCJdLmluY2x1ZGVzKFwiUHJvcGVydHlcIikpXHJcbiAgICAgICAgfHwgb25lQ29udGVudFtcIkB0eXBlXCJdPT1udWxsKSB7XHJcbiAgICAgICAgICAgIGlmKHR5cGVvZihvbmVDb250ZW50W1wic2NoZW1hXCJdKSAhPSAnb2JqZWN0JyAmJiBlbWJlZGRlZFNjaGVtYVtvbmVDb250ZW50W1wic2NoZW1hXCJdXSE9bnVsbCkgb25lQ29udGVudFtcInNjaGVtYVwiXT1lbWJlZGRlZFNjaGVtYVtvbmVDb250ZW50W1wic2NoZW1hXCJdXVxyXG5cclxuICAgICAgICAgICAgaWYodHlwZW9mKG9uZUNvbnRlbnRbXCJzY2hlbWFcIl0pID09PSAnb2JqZWN0JyAmJiBvbmVDb250ZW50W1wic2NoZW1hXCJdW1wiQHR5cGVcIl09PVwiT2JqZWN0XCIpe1xyXG4gICAgICAgICAgICAgICAgdmFyIG5ld1BhcmVudD17fVxyXG4gICAgICAgICAgICAgICAgcGFyZW50T2JqW29uZUNvbnRlbnRbXCJuYW1lXCJdXT1uZXdQYXJlbnRcclxuICAgICAgICAgICAgICAgIHRoaXMuZXhwYW5kRWRpdGFibGVQcm9wZXJ0aWVzKG5ld1BhcmVudCxvbmVDb250ZW50W1wic2NoZW1hXCJdW1wiZmllbGRzXCJdLGVtYmVkZGVkU2NoZW1hKVxyXG4gICAgICAgICAgICB9ZWxzZSBpZih0eXBlb2Yob25lQ29udGVudFtcInNjaGVtYVwiXSkgPT09ICdvYmplY3QnICYmIG9uZUNvbnRlbnRbXCJzY2hlbWFcIl1bXCJAdHlwZVwiXT09XCJFbnVtXCIpe1xyXG4gICAgICAgICAgICAgICAgcGFyZW50T2JqW29uZUNvbnRlbnRbXCJuYW1lXCJdXT1vbmVDb250ZW50W1wic2NoZW1hXCJdW1wiZW51bVZhbHVlc1wiXVxyXG4gICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgIHBhcmVudE9ialtvbmVDb250ZW50W1wibmFtZVwiXV09b25lQ29udGVudFtcInNjaGVtYVwiXVxyXG4gICAgICAgICAgICB9ICAgICAgICAgICBcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG59XHJcblxyXG5cclxubW9kZWxBbmFseXplci5wcm90b3R5cGUuYW5hbHl6ZT1mdW5jdGlvbigpe1xyXG4gICAgLy9jb25zb2xlLmxvZyhcImFuYWx5emUgbW9kZWwgaW5mb1wiKVxyXG4gICAgLy9hbmFseXplIGFsbCByZWxhdGlvbnNoaXAgdHlwZXNcclxuICAgIGZvciAodmFyIGlkIGluIHRoaXMucmVsYXRpb25zaGlwVHlwZXMpIGRlbGV0ZSB0aGlzLnJlbGF0aW9uc2hpcFR5cGVzW2lkXVxyXG4gICAgZm9yICh2YXIgbW9kZWxJRCBpbiB0aGlzLkRURExNb2RlbHMpIHtcclxuICAgICAgICB2YXIgZWxlID0gdGhpcy5EVERMTW9kZWxzW21vZGVsSURdXHJcbiAgICAgICAgdmFyIGVtYmVkZGVkU2NoZW1hID0ge31cclxuICAgICAgICBpZiAoZWxlLnNjaGVtYXMpIHtcclxuICAgICAgICAgICAgdmFyIHRlbXBBcnI7XHJcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGVsZS5zY2hlbWFzKSkgdGVtcEFyciA9IGVsZS5zY2hlbWFzXHJcbiAgICAgICAgICAgIGVsc2UgdGVtcEFyciA9IFtlbGUuc2NoZW1hc11cclxuICAgICAgICAgICAgdGVtcEFyci5mb3JFYWNoKChlbGUpID0+IHtcclxuICAgICAgICAgICAgICAgIGVtYmVkZGVkU2NoZW1hW2VsZVtcIkBpZFwiXV0gPSBlbGVcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBjb250ZW50QXJyID0gZWxlLmNvbnRlbnRzXHJcbiAgICAgICAgaWYgKCFjb250ZW50QXJyKSBjb250aW51ZTtcclxuICAgICAgICBjb250ZW50QXJyLmZvckVhY2goKG9uZUNvbnRlbnQpID0+IHtcclxuICAgICAgICAgICAgaWYgKG9uZUNvbnRlbnRbXCJAdHlwZVwiXSA9PSBcIlJlbGF0aW9uc2hpcFwiKSB7XHJcbiAgICAgICAgICAgICAgICBpZighdGhpcy5yZWxhdGlvbnNoaXBUeXBlc1tvbmVDb250ZW50W1wibmFtZVwiXV0pIHRoaXMucmVsYXRpb25zaGlwVHlwZXNbb25lQ29udGVudFtcIm5hbWVcIl1dPSB7fVxyXG4gICAgICAgICAgICAgICAgdGhpcy5yZWxhdGlvbnNoaXBUeXBlc1tvbmVDb250ZW50W1wibmFtZVwiXV1bbW9kZWxJRF0gPSBvbmVDb250ZW50XHJcbiAgICAgICAgICAgICAgICBvbmVDb250ZW50LmVkaXRhYmxlUmVsYXRpb25zaGlwUHJvcGVydGllcyA9IHt9XHJcbiAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShvbmVDb250ZW50LnByb3BlcnRpZXMpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5leHBhbmRFZGl0YWJsZVByb3BlcnRpZXMob25lQ29udGVudC5lZGl0YWJsZVJlbGF0aW9uc2hpcFByb3BlcnRpZXMsIG9uZUNvbnRlbnQucHJvcGVydGllcywgZW1iZWRkZWRTY2hlbWEpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIC8vYW5hbHl6ZSBlYWNoIG1vZGVsJ3MgcHJvcGVydHkgdGhhdCBjYW4gYmUgZWRpdGVkXHJcbiAgICBmb3IodmFyIG1vZGVsSUQgaW4gdGhpcy5EVERMTW9kZWxzKXsgLy9leHBhbmQgcG9zc2libGUgZW1iZWRkZWQgc2NoZW1hIHRvIGVkaXRhYmxlUHJvcGVydGllcywgYWxzbyBleHRyYWN0IHBvc3NpYmxlIHJlbGF0aW9uc2hpcCB0eXBlcyBmb3IgdGhpcyBtb2RlbFxyXG4gICAgICAgIHZhciBlbGU9dGhpcy5EVERMTW9kZWxzW21vZGVsSURdXHJcbiAgICAgICAgdmFyIGVtYmVkZGVkU2NoZW1hPXt9XHJcbiAgICAgICAgaWYoZWxlLnNjaGVtYXMpe1xyXG4gICAgICAgICAgICB2YXIgdGVtcEFycjtcclxuICAgICAgICAgICAgaWYoQXJyYXkuaXNBcnJheShlbGUuc2NoZW1hcykpIHRlbXBBcnI9ZWxlLnNjaGVtYXNcclxuICAgICAgICAgICAgZWxzZSB0ZW1wQXJyPVtlbGUuc2NoZW1hc11cclxuICAgICAgICAgICAgdGVtcEFyci5mb3JFYWNoKChlbGUpPT57XHJcbiAgICAgICAgICAgICAgICBlbWJlZGRlZFNjaGVtYVtlbGVbXCJAaWRcIl1dPWVsZVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbGUuZWRpdGFibGVQcm9wZXJ0aWVzPXt9XHJcbiAgICAgICAgZWxlLnZhbGlkUmVsYXRpb25zaGlwcz17fVxyXG4gICAgICAgIGVsZS5pbmNsdWRlZENvbXBvbmVudHM9W11cclxuICAgICAgICBlbGUuYWxsQmFzZUNsYXNzZXM9e31cclxuICAgICAgICBpZihBcnJheS5pc0FycmF5KGVsZS5jb250ZW50cykpe1xyXG4gICAgICAgICAgICB0aGlzLmV4cGFuZEVkaXRhYmxlUHJvcGVydGllcyhlbGUuZWRpdGFibGVQcm9wZXJ0aWVzLGVsZS5jb250ZW50cyxlbWJlZGRlZFNjaGVtYSlcclxuXHJcbiAgICAgICAgICAgIGVsZS5jb250ZW50cy5mb3JFYWNoKChvbmVDb250ZW50KT0+e1xyXG4gICAgICAgICAgICAgICAgaWYob25lQ29udGVudFtcIkB0eXBlXCJdPT1cIlJlbGF0aW9uc2hpcFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlLnZhbGlkUmVsYXRpb25zaGlwc1tvbmVDb250ZW50W1wibmFtZVwiXV09dGhpcy5yZWxhdGlvbnNoaXBUeXBlc1tvbmVDb250ZW50W1wibmFtZVwiXV1bbW9kZWxJRF1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZm9yKHZhciBtb2RlbElEIGluIHRoaXMuRFRETE1vZGVscyl7Ly9leHBhbmQgY29tcG9uZW50IHByb3BlcnRpZXNcclxuICAgICAgICB2YXIgZWxlPXRoaXMuRFRETE1vZGVsc1ttb2RlbElEXVxyXG4gICAgICAgIGlmKEFycmF5LmlzQXJyYXkoZWxlLmNvbnRlbnRzKSl7XHJcbiAgICAgICAgICAgIGVsZS5jb250ZW50cy5mb3JFYWNoKG9uZUNvbnRlbnQ9PntcclxuICAgICAgICAgICAgICAgIGlmKG9uZUNvbnRlbnRbXCJAdHlwZVwiXT09XCJDb21wb25lbnRcIil7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvbXBvbmVudE5hbWU9b25lQ29udGVudFtcIm5hbWVcIl1cclxuICAgICAgICAgICAgICAgICAgICB2YXIgY29tcG9uZW50Q2xhc3M9b25lQ29udGVudFtcInNjaGVtYVwiXVxyXG4gICAgICAgICAgICAgICAgICAgIGVsZS5lZGl0YWJsZVByb3BlcnRpZXNbY29tcG9uZW50TmFtZV09e31cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmV4cGFuZEVkaXRhYmxlUHJvcGVydGllc0Zyb21CYXNlQ2xhc3MoZWxlLmVkaXRhYmxlUHJvcGVydGllc1tjb21wb25lbnROYW1lXSxjb21wb25lbnRDbGFzcylcclxuICAgICAgICAgICAgICAgICAgICBlbGUuaW5jbHVkZWRDb21wb25lbnRzLnB1c2goY29tcG9uZW50TmFtZSlcclxuICAgICAgICAgICAgICAgIH0gXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZvcih2YXIgbW9kZWxJRCBpbiB0aGlzLkRURExNb2RlbHMpey8vZXhwYW5kIGJhc2UgY2xhc3MgcHJvcGVydGllcyB0byBlZGl0YWJsZVByb3BlcnRpZXMgYW5kIHZhbGlkIHJlbGF0aW9uc2hpcCB0eXBlcyB0byB2YWxpZFJlbGF0aW9uc2hpcHNcclxuICAgICAgICB2YXIgZWxlPXRoaXMuRFRETE1vZGVsc1ttb2RlbElEXVxyXG4gICAgICAgIHZhciBiYXNlQ2xhc3NJRHM9ZWxlLmV4dGVuZHM7XHJcbiAgICAgICAgaWYoYmFzZUNsYXNzSURzPT1udWxsKSBjb250aW51ZTtcclxuICAgICAgICBpZihBcnJheS5pc0FycmF5KGJhc2VDbGFzc0lEcykpIHZhciB0bXBBcnI9YmFzZUNsYXNzSURzXHJcbiAgICAgICAgZWxzZSB0bXBBcnI9W2Jhc2VDbGFzc0lEc11cclxuICAgICAgICB0bXBBcnIuZm9yRWFjaCgoZWFjaEJhc2UpPT57XHJcbiAgICAgICAgICAgIHRoaXMucmVjb3JkQWxsQmFzZUNsYXNzZXMoZWxlLmFsbEJhc2VDbGFzc2VzLGVhY2hCYXNlKVxyXG4gICAgICAgICAgICB0aGlzLmV4cGFuZEVkaXRhYmxlUHJvcGVydGllc0Zyb21CYXNlQ2xhc3MoZWxlLmVkaXRhYmxlUHJvcGVydGllcyxlYWNoQmFzZSlcclxuICAgICAgICAgICAgdGhpcy5leHBhbmRWYWxpZFJlbGF0aW9uc2hpcFR5cGVzRnJvbUJhc2VDbGFzcyhlbGUudmFsaWRSZWxhdGlvbnNoaXBzLGVhY2hCYXNlKVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcblxyXG4gICAgLy9jb25zb2xlLmxvZyh0aGlzLkRURExNb2RlbHMpXHJcbiAgICAvL2NvbnNvbGUubG9nKHRoaXMucmVsYXRpb25zaGlwVHlwZXMpXHJcbn1cclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBtb2RlbEFuYWx5emVyKCk7IiwiY29uc3QgbW9kZWxBbmFseXplcj1yZXF1aXJlKFwiLi9tb2RlbEFuYWx5emVyXCIpXHJcbmNvbnN0IHNpbXBsZVNlbGVjdE1lbnU9IHJlcXVpcmUoXCIuL3NpbXBsZVNlbGVjdE1lbnVcIilcclxuY29uc3QgbXNhbEhlbHBlcj1yZXF1aXJlKFwiLi4vbXNhbEhlbHBlclwiKVxyXG5jb25zdCBnbG9iYWxDYWNoZSA9IHJlcXVpcmUoXCIuL2dsb2JhbENhY2hlXCIpXHJcblxyXG5mdW5jdGlvbiBtb2RlbEVkaXRvckRpYWxvZygpIHtcclxuICAgIGlmKCF0aGlzLkRPTSl7XHJcbiAgICAgICAgdGhpcy5ET00gPSAkKCc8ZGl2IHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dG9wOjUwJTtiYWNrZ3JvdW5kLWNvbG9yOndoaXRlO2xlZnQ6NTAlO3RyYW5zZm9ybTogdHJhbnNsYXRlWCgtNTAlKSB0cmFuc2xhdGVZKC01MCUpO3otaW5kZXg6OTlcIiBjbGFzcz1cInczLWNhcmQtMlwiPjwvZGl2PicpXHJcbiAgICAgICAgJChcImJvZHlcIikuYXBwZW5kKHRoaXMuRE9NKVxyXG4gICAgICAgIHRoaXMuRE9NLmhpZGUoKVxyXG4gICAgfVxyXG59XHJcblxyXG5tb2RlbEVkaXRvckRpYWxvZy5wcm90b3R5cGUucG9wdXAgPSBhc3luYyBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMuRE9NLnNob3coKVxyXG4gICAgdGhpcy5ET00uZW1wdHkoKVxyXG4gICAgdGhpcy5jb250ZW50RE9NID0gJCgnPGRpdiBzdHlsZT1cIndpZHRoOjY2NXB4XCI+PC9kaXY+JylcclxuICAgIHRoaXMuRE9NLmFwcGVuZCh0aGlzLmNvbnRlbnRET00pXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6NDBweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiZm9udC1zaXplOjEuNWVtXCI+RGlnaXRhbCBUd2luIE1vZGVsIEVkaXRvcjwvZGl2PjwvZGl2PicpKVxyXG4gICAgdmFyIGNsb3NlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yaWdodFwiIHN0eWxlPVwiZm9udC1zaXplOjJlbTtwYWRkaW5nLXRvcDo0cHhcIj7DlzwvYnV0dG9uPicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZChjbG9zZUJ1dHRvbilcclxuICAgIGNsb3NlQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLkRPTS5oaWRlKCkgfSlcclxuXHJcbiAgICB2YXIgYnV0dG9uUm93PSQoJzxkaXYgIHN0eWxlPVwiaGVpZ2h0OjQwcHhcIiBjbGFzcz1cInczLWJhclwiPjwvZGl2PicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKGJ1dHRvblJvdylcclxuICAgIHZhciBpbXBvcnRCdXR0b24gPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtY2FyZCB3My1kZWVwLW9yYW5nZSB3My1ob3Zlci1saWdodC1ncmVlbiB3My1yaWdodFwiIHN0eWxlPVwiaGVpZ2h0OjEwMCVcIj5JbXBvcnQ8L2J1dHRvbj4nKVxyXG4gICAgYnV0dG9uUm93LmFwcGVuZChpbXBvcnRCdXR0b24pXHJcblxyXG4gICAgaW1wb3J0QnV0dG9uLm9uKFwiY2xpY2tcIiwgYXN5bmMgKCkgPT4ge0ZcclxuICAgICAgICB2YXIgbW9kZWxUb0JlSW1wb3J0ZWQgPSBbdGhpcy5kdGRsb2JqXVxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHZhciByZXNwb25zZSA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2ltcG9ydE1vZGVsc1wiLCBcIlBPU1RcIiwgeyBcIm1vZGVsc1wiOiBKU09OLnN0cmluZ2lmeShtb2RlbFRvQmVJbXBvcnRlZCkgfSlcclxuXHJcbiAgICAgICAgICAgIGFsZXJ0KFwiTW9kZWwgXFxcIlwiICsgdGhpcy5kdGRsb2JqW1wiZGlzcGxheU5hbWVcIl0gKyBcIlxcXCIgaXMgY3JlYXRlZCFcIilcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiQURUTW9kZWxFZGl0ZWRcIiB9KVxyXG4gICAgICAgICAgICBtb2RlbEFuYWx5emVyLmFkZE1vZGVscyhtb2RlbFRvQmVJbXBvcnRlZCkgLy9hZGQgc28gaW1tZWRpYXRsZXkgdGhlIGxpc3QgY2FuIHNob3cgdGhlIG5ldyBtb2RlbHNcclxuICAgICAgICAgICAgdGhpcy5wb3B1cCgpIC8vcmVmcmVzaCBjb250ZW50XHJcbiAgICAgICAgfWNhdGNoKGUpe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICAgICAgfSAgICAgICAgXHJcbiAgICB9KVxyXG5cclxuICAgIHZhciBsYWJsZT0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtb3BhY2l0eVwiIHN0eWxlPVwicGFkZGluZy1yaWdodDo1cHg7Zm9udC1zaXplOjEuMmVtO1wiPk1vZGVsIFRlbXBsYXRlPC9kaXY+JylcclxuICAgIGJ1dHRvblJvdy5hcHBlbmQobGFibGUpXHJcbiAgICB2YXIgbW9kZWxUZW1wbGF0ZVNlbGVjdG9yPW5ldyBzaW1wbGVTZWxlY3RNZW51KFwiIFwiLHt3aXRoQm9yZGVyOjEsZm9udFNpemU6XCIxLjJlbVwiLGNvbG9yQ2xhc3M6XCJ3My1saWdodC1ncmF5XCIsYnV0dG9uQ1NTOntcInBhZGRpbmdcIjpcIjVweCAxMHB4XCJ9LFwib3B0aW9uTGlzdEhlaWdodFwiOjMwMH0pXHJcbiAgICBidXR0b25Sb3cuYXBwZW5kKG1vZGVsVGVtcGxhdGVTZWxlY3Rvci5ET00pXHJcbiAgICBtb2RlbFRlbXBsYXRlU2VsZWN0b3IuY2FsbEJhY2tfY2xpY2tPcHRpb249KG9wdGlvblRleHQsb3B0aW9uVmFsdWUpPT57XHJcbiAgICAgICAgbW9kZWxUZW1wbGF0ZVNlbGVjdG9yLmNoYW5nZU5hbWUob3B0aW9uVGV4dClcclxuICAgICAgICB0aGlzLmNob29zZVRlbXBsYXRlKG9wdGlvblZhbHVlKVxyXG4gICAgfVxyXG4gICAgbW9kZWxUZW1wbGF0ZVNlbGVjdG9yLmFkZE9wdGlvbihcIk5ldyBNb2RlbC4uLlwiLFwiTmV3XCIpXHJcbiAgICBmb3IodmFyIG1vZGVsTmFtZSBpbiBtb2RlbEFuYWx5emVyLkRURExNb2RlbHMpe1xyXG4gICAgICAgIG1vZGVsVGVtcGxhdGVTZWxlY3Rvci5hZGRPcHRpb24obW9kZWxOYW1lKVxyXG4gICAgfVxyXG5cclxuICAgIHZhciBwYW5lbEhlaWdodD1cIjQ1MHB4XCJcclxuICAgIHZhciByb3cyPSQoJzxkaXYgY2xhc3M9XCJ3My1jZWxsLXJvd1wiIHN0eWxlPVwibWFyZ2luOjJweFwiPjwvZGl2PicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKHJvdzIpXHJcbiAgICB2YXIgbGVmdFNwYW49JCgnPGRpdiBjbGFzcz1cInczLWNhcmRcIiBzdHlsZT1cInBhZGRpbmc6NXB4O3dpZHRoOjMzMHB4O3BhZGRpbmctcmlnaHQ6NXB4O2hlaWdodDonK3BhbmVsSGVpZ2h0Kyc7b3ZlcmZsb3c6YXV0b1wiPjwvZGl2PicpXHJcbiAgICByb3cyLmFwcGVuZChsZWZ0U3BhbilcclxuICAgIHRoaXMubGVmdFNwYW49bGVmdFNwYW5cclxuXHJcbiAgICB2YXIgcmlnaHRTcGFuPSQoJzxkaXYgY2xhc3M9XCJ3My1jb250YWluZXIgdzMtY2VsbFwiPjwvZGl2PicpXHJcbiAgICByb3cyLmFwcGVuZChyaWdodFNwYW4pIFxyXG4gICAgdmFyIGR0ZGxTY3JpcHRQYW5lbD0kKCc8ZGl2IGNsYXNzPVwidzMtY2FyZC0yIHczLXdoaXRlXCIgc3R5bGU9XCJvdmVyZmxvdzphdXRvO21hcmdpbi10b3A6MnB4O3dpZHRoOjMxMHB4O2hlaWdodDonK3BhbmVsSGVpZ2h0KydcIj48L2Rpdj4nKVxyXG4gICAgcmlnaHRTcGFuLmFwcGVuZChkdGRsU2NyaXB0UGFuZWwpXHJcbiAgICB0aGlzLmR0ZGxTY3JpcHRQYW5lbD1kdGRsU2NyaXB0UGFuZWxcclxuXHJcbiAgICBtb2RlbFRlbXBsYXRlU2VsZWN0b3IudHJpZ2dlck9wdGlvbkluZGV4KDApXHJcbn1cclxuXHJcbm1vZGVsRWRpdG9yRGlhbG9nLnByb3RvdHlwZS5jaG9vc2VUZW1wbGF0ZT1mdW5jdGlvbih0ZW1wYWx0ZU5hbWUpe1xyXG4gICAgaWYodGVtcGFsdGVOYW1lIT1cIk5ld1wiKXtcclxuICAgICAgICB0aGlzLmR0ZGxvYmo9SlNPTi5wYXJzZShtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbdGVtcGFsdGVOYW1lXVtcIm9yaWdpbmFsXCJdKVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgdGhpcy5kdGRsb2JqID0ge1xyXG4gICAgICAgICAgICBcIkBpZFwiOiBcImR0bWk6YU5hbWVTcGFjZTphTW9kZWxJRDsxXCIsXHJcbiAgICAgICAgICAgIFwiQGNvbnRleHRcIjogW1wiZHRtaTpkdGRsOmNvbnRleHQ7MlwiXSxcclxuICAgICAgICAgICAgXCJAdHlwZVwiOiBcIkludGVyZmFjZVwiLFxyXG4gICAgICAgICAgICBcImRpc3BsYXlOYW1lXCI6IFwiTmV3IE1vZGVsXCIsXHJcbiAgICAgICAgICAgIFwiY29udGVudHNcIjogW1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiQHR5cGVcIjogXCJQcm9wZXJ0eVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwibmFtZVwiOiBcImF0dHJpYnV0ZTFcIixcclxuICAgICAgICAgICAgICAgICAgICBcInNjaGVtYVwiOiBcImRvdWJsZVwiXHJcbiAgICAgICAgICAgICAgICB9LHtcclxuICAgICAgICAgICAgICAgICAgICBcIkB0eXBlXCI6IFwiUmVsYXRpb25zaGlwXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJuYW1lXCI6IFwibGlua1wiXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLmxlZnRTcGFuLmVtcHR5KClcclxuXHJcbiAgICB0aGlzLnJlZnJlc2hEVERMKClcclxuICAgIHRoaXMubGVmdFNwYW4uYXBwZW5kKCQoJzxkaXYgY2xhc3M9XCJ3My1iYXJcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtdG9vbHRpcFwiIHN0eWxlPVwiZm9udC1zaXplOjEuMmVtO3BhZGRpbmctbGVmdDoycHg7Zm9udC13ZWlnaHQ6Ym9sZDtjb2xvcjpncmF5XCI+TW9kZWwgSUQgJiBOYW1lPHAgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0ZXh0LWFsaWduOmxlZnQ7Zm9udC13ZWlnaHQ6bm9ybWFsO3RvcDotMTBweDt3aWR0aDoyMDBweFwiIGNsYXNzPVwidzMtdGV4dCB3My10YWcgdzMtdGlueVwiPm1vZGVsIElEIGNvbnRhaW5zIG5hbWVzcGFjZSwgYSBtb2RlbCBzdHJpbmcgYW5kIGEgdmVyc2lvbiBudW1iZXI8L3A+PC9kaXY+PC9kaXY+JykpXHJcbiAgICBuZXcgaWRSb3codGhpcy5kdGRsb2JqLHRoaXMubGVmdFNwYW4sKCk9Pnt0aGlzLnJlZnJlc2hEVERMKCl9KVxyXG4gICAgbmV3IGRpc3BsYXlOYW1lUm93KHRoaXMuZHRkbG9iaix0aGlzLmxlZnRTcGFuLCgpPT57dGhpcy5yZWZyZXNoRFRETCgpfSlcclxuXHJcbiAgICBpZighdGhpcy5kdGRsb2JqW1wiY29udGVudHNcIl0pdGhpcy5kdGRsb2JqW1wiY29udGVudHNcIl09W11cclxuICAgIG5ldyBwYXJhbWV0ZXJzUm93KHRoaXMuZHRkbG9ialtcImNvbnRlbnRzXCJdLHRoaXMubGVmdFNwYW4sKCk9Pnt0aGlzLnJlZnJlc2hEVERMKCl9LHRoaXMuRE9NLm9mZnNldCgpKVxyXG4gICAgbmV3IHJlbGF0aW9uc1Jvdyh0aGlzLmR0ZGxvYmpbXCJjb250ZW50c1wiXSx0aGlzLmxlZnRTcGFuLCgpPT57dGhpcy5yZWZyZXNoRFRETCgpfSx0aGlzLkRPTS5vZmZzZXQoKSlcclxuICAgIG5ldyBjb21wb25lbnRzUm93KHRoaXMuZHRkbG9ialtcImNvbnRlbnRzXCJdLHRoaXMubGVmdFNwYW4sKCk9Pnt0aGlzLnJlZnJlc2hEVERMKCl9KVxyXG5cclxuICAgIGlmKCF0aGlzLmR0ZGxvYmpbXCJleHRlbmRzXCJdKXRoaXMuZHRkbG9ialtcImV4dGVuZHNcIl09W11cclxuICAgIG5ldyBiYXNlQ2xhc3Nlc1Jvdyh0aGlzLmR0ZGxvYmpbXCJleHRlbmRzXCJdLHRoaXMubGVmdFNwYW4sKCk9Pnt0aGlzLnJlZnJlc2hEVERMKCl9KVxyXG59XHJcblxyXG5tb2RlbEVkaXRvckRpYWxvZy5wcm90b3R5cGUucmVmcmVzaERUREw9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuZHRkbFNjcmlwdFBhbmVsLmVtcHR5KClcclxuICAgIHRoaXMuZHRkbFNjcmlwdFBhbmVsLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwiaGVpZ2h0OjIwcHg7d2lkdGg6MTAwcHhcIiBjbGFzcz1cInczLWJhciB3My1ncmF5XCI+R2VuZXJhdGVkIERUREw8L2Rpdj4nKSlcclxuICAgIHRoaXMuZHRkbFNjcmlwdFBhbmVsLmFwcGVuZCgkKCc8cHJlIHN0eWxlPVwiY29sb3I6Z3JheVwiPicrSlNPTi5zdHJpbmdpZnkodGhpcy5kdGRsb2JqLG51bGwsMikrJzwvcHJlPicpKVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBtb2RlbEVkaXRvckRpYWxvZygpO1xyXG5cclxuXHJcbmZ1bmN0aW9uIGJhc2VDbGFzc2VzUm93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRil7XHJcbiAgICB2YXIgcm93RE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXJcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW0gIHczLXRvb2x0aXBcIiBzdHlsZT1cImZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nLWxlZnQ6MnB4O2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6Z3JheVwiPkJhc2UgQ2xhc3NlczxwIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dGV4dC1hbGlnbjpsZWZ0O3RvcDotMTBweDtmb250LXdlaWdodDpub3JtYWw7d2lkdGg6MjAwcHhcIiBjbGFzcz1cInczLXRleHQgdzMtdGFnIHczLXRpbnlcIj5CYXNlIGNsYXNzIG1vZGVsXFwncyBwYXJhbWV0ZXJzIGFuZCByZWxhdGlvbnNoaXAgdHlwZSBhcmUgaW5oZXJpdGVkPC9wPjwvZGl2PjwvZGl2PicpXHJcblxyXG4gICAgdmFyIGFkZEJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmVkIHczLWhvdmVyLWFtYmVyXCIgc3R5bGU9XCJtYXJnaW4tdG9wOjJweDtmb250LXNpemU6MS4yZW07cGFkZGluZzo0cHhcIj4rPC9idXR0b24+JylcclxuICAgIHJvd0RPTS5hcHBlbmQoYWRkQnV0dG9uKVxyXG4gICAgcGFyZW50RE9NLmFwcGVuZChyb3dET00pXHJcbiAgICB2YXIgY29udGVudERPTT0kKCc8ZGl2IHN0eWxlPVwicGFkZGluZy1sZWZ0OjEwcHhcIj48L2Rpdj4nKVxyXG4gICAgcm93RE9NLmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgYWRkQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIHZhciBuZXdPYmogPSBcInVua25vd25cIlxyXG4gICAgICAgIGR0ZGxPYmoucHVzaChuZXdPYmopXHJcbiAgICAgICAgbmV3IHNpbmdsZUJhc2VjbGFzc1JvdyhuZXdPYmosY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9iailcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuICAgIC8vY2hlY2sgZXhpc3RlZCBjb250ZW50IGluaXRpYWxseSBmcm9tIHRlbXBsYXRlIGFuZCB0cmlnZ2VyIHRoZWlyIGRyYXdpbmdcclxuICAgIGR0ZGxPYmouZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICBuZXcgc2luZ2xlQmFzZWNsYXNzUm93KGVsZW1lbnQsY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9iailcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzaW5nbGVCYXNlY2xhc3NSb3coZHRkbE9iaixwYXJlbnRET00scmVmcmVzaERURExGLHBhcmVudER0ZGxPYmope1xyXG4gICAgdmFyIERPTSA9ICQoJzxkaXYgY2xhc3M9XCJ3My1jZWxsLXJvd1wiPjwvZGl2PicpXHJcbiAgICB2YXIgYmFzZUNsYXNzTmFtZUlucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjIyMHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwiYmFzZSBtb2RlbCBpZFwiLz4nKS5hZGRDbGFzcyhcInczLWJhci1pdGVtIHczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIHZhciByZW1vdmVCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWhvdmVyLWFtYmVyXCIgc3R5bGU9XCJjb2xvcjpncmF5O21hcmdpbi1sZWZ0OjNweDttYXJnaW4tdG9wOjJweDtmb250LXNpemU6MS4yZW07cGFkZGluZzoycHhcIj48aSBjbGFzcz1cImZhIGZhLXRyYXNoIGZhLWxnXCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICBET00uYXBwZW5kKGJhc2VDbGFzc05hbWVJbnB1dCxyZW1vdmVCdXR0b24pXHJcblxyXG4gICAgcmVtb3ZlQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIGZvciAodmFyIGkgPTA7aTwgcGFyZW50RHRkbE9iai5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAocGFyZW50RHRkbE9ialtpXSA9PSBkdGRsT2JqKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnREdGRsT2JqLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIERPTS5yZW1vdmUoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG5cclxuICAgIHBhcmVudERPTS5hcHBlbmQoRE9NKVxyXG5cclxuICAgIGJhc2VDbGFzc05hbWVJbnB1dC52YWwoZHRkbE9iailcclxuICAgIGJhc2VDbGFzc05hbWVJbnB1dC5vbihcImNoYW5nZVwiLCgpPT57XHJcbiAgICAgICAgZm9yICh2YXIgaSA9MDtpPCBwYXJlbnREdGRsT2JqLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChwYXJlbnREdGRsT2JqW2ldID09IGR0ZGxPYmopIHtcclxuICAgICAgICAgICAgICAgIHBhcmVudER0ZGxPYmpbaV09YmFzZUNsYXNzTmFtZUlucHV0LnZhbCgpXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxufVxyXG5cclxuZnVuY3Rpb24gY29tcG9uZW50c1JvdyhkdGRsT2JqLHBhcmVudERPTSxyZWZyZXNoRFRETEYpe1xyXG4gICAgdmFyIHJvd0RPTT0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtICB3My10b29sdGlwXCIgc3R5bGU9XCJmb250LXNpemU6MS4yZW07cGFkZGluZy1sZWZ0OjJweDtmb250LXdlaWdodDpib2xkO2NvbG9yOmdyYXlcIj5Db21wb25lbnRzPHAgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0ZXh0LWFsaWduOmxlZnQ7dG9wOi0xMHB4O2ZvbnQtd2VpZ2h0Om5vcm1hbDt3aWR0aDoyMDBweFwiIGNsYXNzPVwidzMtdGV4dCB3My10YWcgdzMtdGlueVwiPkNvbXBvbmVudCBtb2RlbFxcJ3MgcGFyYW1ldGVycyBhcmUgZW1iZWRkZWQgdW5kZXIgYSBuYW1lPC9wPjwvZGl2PjwvZGl2PicpXHJcblxyXG4gICAgdmFyIGFkZEJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmVkIHczLWhvdmVyLWFtYmVyXCIgc3R5bGU9XCJtYXJnaW4tdG9wOjJweDtmb250LXNpemU6MS4yZW07cGFkZGluZzo0cHhcIj4rPC9idXR0b24+JylcclxuICAgIHJvd0RPTS5hcHBlbmQoYWRkQnV0dG9uKVxyXG4gICAgcGFyZW50RE9NLmFwcGVuZChyb3dET00pXHJcbiAgICB2YXIgY29udGVudERPTT0kKCc8ZGl2IHN0eWxlPVwicGFkZGluZy1sZWZ0OjEwcHhcIj48L2Rpdj4nKVxyXG4gICAgcm93RE9NLmFwcGVuZChjb250ZW50RE9NKVxyXG5cclxuICAgIGFkZEJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICB2YXIgbmV3T2JqID0ge1xyXG4gICAgICAgICAgICBcIkB0eXBlXCI6IFwiQ29tcG9uZW50XCIsXHJcbiAgICAgICAgICAgIFwibmFtZVwiOiBcIlNvbWVDb21wb25lbnRcIixcclxuICAgICAgICAgICAgXCJzY2hlbWFcIjpcImR0bWk6c29tZUNvbXBvbmVudE1vZGVsOzFcIlxyXG4gICAgICAgIH1cclxuICAgICAgICBkdGRsT2JqLnB1c2gobmV3T2JqKVxyXG4gICAgICAgIG5ldyBzaW5nbGVDb21wb25lbnRSb3cobmV3T2JqLGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmopXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcbiAgICAvL2NoZWNrIGV4aXN0ZWQgY29udGVudCBpbml0aWFsbHkgZnJvbSB0ZW1wbGF0ZSBhbmQgdHJpZ2dlciB0aGVpciBkcmF3aW5nXHJcbiAgICBkdGRsT2JqLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgaWYoZWxlbWVudFtcIkB0eXBlXCJdIT1cIkNvbXBvbmVudFwiKSByZXR1cm5cclxuICAgICAgICBuZXcgc2luZ2xlQ29tcG9uZW50Um93KGVsZW1lbnQsY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9iailcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzaW5nbGVDb21wb25lbnRSb3coZHRkbE9iaixwYXJlbnRET00scmVmcmVzaERURExGLHBhcmVudER0ZGxPYmope1xyXG4gICAgdmFyIERPTSA9ICQoJzxkaXYgY2xhc3M9XCJ3My1jZWxsLXJvd1wiPjwvZGl2PicpXHJcbiAgICB2YXIgY29tcG9uZW50TmFtZUlucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjEwMHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwiY29tcG9uZW50IG5hbWVcIi8+JykuYWRkQ2xhc3MoXCJ3My1iYXItaXRlbSB3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICB2YXIgc2NoZW1hSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmU7d2lkdGg6MTYwcHg7cGFkZGluZzo0cHhcIiAgcGxhY2Vob2xkZXI9XCJjb21wb25lbnQgbW9kZWwgaWQuLi5cIi8+JykuYWRkQ2xhc3MoXCJ3My1iYXItaXRlbSB3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICB2YXIgcmVtb3ZlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwiY29sb3I6Z3JheTttYXJnaW4tbGVmdDozcHg7bWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6MnB4XCI+PGkgY2xhc3M9XCJmYSBmYS10cmFzaCBmYS1sZ1wiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgRE9NLmFwcGVuZChjb21wb25lbnROYW1lSW5wdXQsc2NoZW1hSW5wdXQscmVtb3ZlQnV0dG9uKVxyXG5cclxuICAgIHJlbW92ZUJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICBmb3IgKHZhciBpID0wO2k8IHBhcmVudER0ZGxPYmoubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHBhcmVudER0ZGxPYmpbaV0gPT09IGR0ZGxPYmopIHtcclxuICAgICAgICAgICAgICAgIHBhcmVudER0ZGxPYmouc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgRE9NLnJlbW92ZSgpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcblxyXG4gICAgcGFyZW50RE9NLmFwcGVuZChET00pXHJcblxyXG4gICAgY29tcG9uZW50TmFtZUlucHV0LnZhbChkdGRsT2JqW1wibmFtZVwiXSlcclxuICAgIHNjaGVtYUlucHV0LnZhbChkdGRsT2JqW1wic2NoZW1hXCJdfHxcIlwiKVxyXG5cclxuICAgIGNvbXBvbmVudE5hbWVJbnB1dC5vbihcImNoYW5nZVwiLCgpPT57XHJcbiAgICAgICAgZHRkbE9ialtcIm5hbWVcIl09Y29tcG9uZW50TmFtZUlucHV0LnZhbCgpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcbiAgICBzY2hlbWFJbnB1dC5vbihcImNoYW5nZVwiLCgpPT57XHJcbiAgICAgICAgZHRkbE9ialtcInNjaGVtYVwiXT1zY2hlbWFJbnB1dC52YWwoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG59XHJcblxyXG5mdW5jdGlvbiByZWxhdGlvbnNSb3coZHRkbE9iaixwYXJlbnRET00scmVmcmVzaERURExGLGRpYWxvZ09mZnNldCl7XHJcbiAgICB2YXIgcm93RE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXJcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtdG9vbHRpcFwiIHN0eWxlPVwiZm9udC1zaXplOjEuMmVtO3BhZGRpbmctbGVmdDoycHg7Zm9udC13ZWlnaHQ6Ym9sZDtjb2xvcjpncmF5XCI+UmVsYXRpb25zaGlwIFR5cGVzPHAgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0ZXh0LWFsaWduOmxlZnQ7dG9wOi0xMHB4O2ZvbnQtd2VpZ2h0Om5vcm1hbDt3aWR0aDoyMDBweFwiIGNsYXNzPVwidzMtdGV4dCB3My10YWcgdzMtdGlueVwiPlJlbGF0aW9uc2hpcCBjYW4gaGF2ZSBpdHMgb3duIHBhcmFtZXRlcnM8L3A+PC9kaXY+PC9kaXY+JylcclxuXHJcblxyXG4gICAgdmFyIGFkZEJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmVkIHczLWhvdmVyLWFtYmVyXCIgc3R5bGU9XCJtYXJnaW4tdG9wOjJweDtmb250LXNpemU6MS4yZW07cGFkZGluZzo0cHhcIj4rPC9idXR0b24+JylcclxuICAgIHJvd0RPTS5hcHBlbmQoYWRkQnV0dG9uKVxyXG4gICAgcGFyZW50RE9NLmFwcGVuZChyb3dET00pXHJcbiAgICB2YXIgY29udGVudERPTT0kKCc8ZGl2IHN0eWxlPVwicGFkZGluZy1sZWZ0OjEwcHhcIj48L2Rpdj4nKVxyXG4gICAgcm93RE9NLmFwcGVuZChjb250ZW50RE9NKVxyXG5cclxuICAgIGFkZEJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICB2YXIgbmV3T2JqID0ge1xyXG4gICAgICAgICAgICBcIkB0eXBlXCI6IFwiUmVsYXRpb25zaGlwXCIsXHJcbiAgICAgICAgICAgIFwibmFtZVwiOiBcInJlbGF0aW9uMVwiLFxyXG4gICAgICAgIH1cclxuICAgICAgICBkdGRsT2JqLnB1c2gobmV3T2JqKVxyXG4gICAgICAgIG5ldyBzaW5nbGVSZWxhdGlvblR5cGVSb3cobmV3T2JqLGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmosZGlhbG9nT2Zmc2V0KVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG5cclxuICAgIC8vY2hlY2sgZXhpc3RlZCBjb250ZW50IGluaXRpYWxseSBmcm9tIHRlbXBsYXRlIGFuZCB0cmlnZ2VyIHRoZWlyIGRyYXdpbmdcclxuICAgIGR0ZGxPYmouZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICBpZihlbGVtZW50W1wiQHR5cGVcIl0hPVwiUmVsYXRpb25zaGlwXCIpIHJldHVyblxyXG4gICAgICAgIG5ldyBzaW5nbGVSZWxhdGlvblR5cGVSb3coZWxlbWVudCxjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqLGRpYWxvZ09mZnNldClcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzaW5nbGVSZWxhdGlvblR5cGVSb3coZHRkbE9iaixwYXJlbnRET00scmVmcmVzaERURExGLHBhcmVudER0ZGxPYmosZGlhbG9nT2Zmc2V0KXtcclxuICAgIHZhciBET00gPSAkKCc8ZGl2IGNsYXNzPVwidzMtY2VsbC1yb3dcIj48L2Rpdj4nKVxyXG4gICAgdmFyIHJlbGF0aW9uTmFtZUlucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjkwcHg7cGFkZGluZzo0cHhcIiAgcGxhY2Vob2xkZXI9XCJyZWxhdGlvbiBuYW1lXCIvPicpLmFkZENsYXNzKFwidzMtYmFyLWl0ZW0gdzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgdmFyIHRhcmdldE1vZGVsSUQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmU7d2lkdGg6MTQwcHg7cGFkZGluZzo0cHhcIiAgcGxhY2Vob2xkZXI9XCIob3B0aW9uYWwpdGFyZ2V0IG1vZGVsXCIvPicpLmFkZENsYXNzKFwidzMtYmFyLWl0ZW0gdzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgdmFyIGFkZEJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cImNvbG9yOmdyYXk7bWFyZ2luLWxlZnQ6M3B4O21hcmdpbi10b3A6MnB4O2ZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjJweFwiPjxpIGNsYXNzPVwiZmEgZmEtY29nIGZhLWxnXCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICB2YXIgcmVtb3ZlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwiY29sb3I6Z3JheTttYXJnaW4tbGVmdDozcHg7bWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6MnB4XCI+PGkgY2xhc3M9XCJmYSBmYS10cmFzaCBmYS1sZ1wiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgRE9NLmFwcGVuZChyZWxhdGlvbk5hbWVJbnB1dCx0YXJnZXRNb2RlbElELGFkZEJ1dHRvbixyZW1vdmVCdXR0b24pXHJcblxyXG4gICAgcmVtb3ZlQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIGZvciAodmFyIGkgPTA7aTwgcGFyZW50RHRkbE9iai5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAocGFyZW50RHRkbE9ialtpXSA9PT0gZHRkbE9iaikge1xyXG4gICAgICAgICAgICAgICAgcGFyZW50RHRkbE9iai5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBET00ucmVtb3ZlKClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuXHJcbiAgICB2YXIgY29udGVudERPTT0kKCc8ZGl2IHN0eWxlPVwicGFkZGluZy1sZWZ0OjEwcHhcIj48L2Rpdj4nKVxyXG4gICAgRE9NLmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgcGFyZW50RE9NLmFwcGVuZChET00pXHJcblxyXG4gICAgcmVsYXRpb25OYW1lSW5wdXQudmFsKGR0ZGxPYmpbXCJuYW1lXCJdKVxyXG4gICAgdGFyZ2V0TW9kZWxJRC52YWwoZHRkbE9ialtcInRhcmdldFwiXXx8XCJcIilcclxuXHJcbiAgICBhZGRCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgaWYoISBkdGRsT2JqW1wicHJvcGVydGllc1wiXSkgZHRkbE9ialtcInByb3BlcnRpZXNcIl09W11cclxuICAgICAgICB2YXIgbmV3T2JqID0ge1xyXG4gICAgICAgICAgICBcIm5hbWVcIjogXCJuZXdQXCIsXHJcbiAgICAgICAgICAgIFwic2NoZW1hXCI6IFwiZG91YmxlXCJcclxuICAgICAgICB9XHJcbiAgICAgICAgZHRkbE9ialtcInByb3BlcnRpZXNcIl0ucHVzaChuZXdPYmopXHJcbiAgICAgICAgbmV3IHNpbmdsZVBhcmFtZXRlclJvdyhuZXdPYmosY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9ialtcInByb3BlcnRpZXNcIl0sbnVsbCxkaWFsb2dPZmZzZXQpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcblxyXG4gICAgcmVsYXRpb25OYW1lSW5wdXQub24oXCJjaGFuZ2VcIiwoKT0+e1xyXG4gICAgICAgIGR0ZGxPYmpbXCJuYW1lXCJdPXJlbGF0aW9uTmFtZUlucHV0LnZhbCgpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcbiAgICB0YXJnZXRNb2RlbElELm9uKFwiY2hhbmdlXCIsKCk9PntcclxuICAgICAgICBpZih0YXJnZXRNb2RlbElELnZhbCgpPT1cIlwiKSBkZWxldGUgZHRkbE9ialtcInRhcmdldFwiXVxyXG4gICAgICAgIGVsc2UgZHRkbE9ialtcInRhcmdldFwiXT10YXJnZXRNb2RlbElELnZhbCgpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcbiAgICBpZihkdGRsT2JqW1wicHJvcGVydGllc1wiXSAmJiBkdGRsT2JqW1wicHJvcGVydGllc1wiXS5sZW5ndGg+MCl7XHJcbiAgICAgICAgdmFyIHByb3BlcnRpZXM9ZHRkbE9ialtcInByb3BlcnRpZXNcIl1cclxuICAgICAgICBwcm9wZXJ0aWVzLmZvckVhY2gob25lUHJvcGVydHk9PntcclxuICAgICAgICAgICAgbmV3IHNpbmdsZVBhcmFtZXRlclJvdyhvbmVQcm9wZXJ0eSxjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqW1wicHJvcGVydGllc1wiXSxudWxsLGRpYWxvZ09mZnNldClcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBwYXJhbWV0ZXJzUm93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRixkaWFsb2dPZmZzZXQpe1xyXG4gICAgdmFyIHJvd0RPTT0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtXCIgc3R5bGU9XCJmb250LXNpemU6MS4yZW07cGFkZGluZy1sZWZ0OjJweDtmb250LXdlaWdodDpib2xkO2NvbG9yOmdyYXlcIj5QYXJhbWV0ZXJzPC9kaXY+PC9kaXY+JylcclxuICAgIHZhciBhZGRCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJlZCB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwibWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6NHB4XCI+KzwvYnV0dG9uPicpXHJcbiAgICByb3dET00uYXBwZW5kKGFkZEJ1dHRvbilcclxuICAgIHBhcmVudERPTS5hcHBlbmQocm93RE9NKVxyXG4gICAgdmFyIGNvbnRlbnRET009JCgnPGRpdiBzdHlsZT1cInBhZGRpbmctbGVmdDoxMHB4XCI+PC9kaXY+JylcclxuICAgIHJvd0RPTS5hcHBlbmQoY29udGVudERPTSlcclxuICAgIGFkZEJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICB2YXIgbmV3T2JqID0ge1xyXG4gICAgICAgICAgICBcIkB0eXBlXCI6IFwiUHJvcGVydHlcIixcclxuICAgICAgICAgICAgXCJuYW1lXCI6IFwibmV3UFwiLFxyXG4gICAgICAgICAgICBcInNjaGVtYVwiOiBcImRvdWJsZVwiXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGR0ZGxPYmoucHVzaChuZXdPYmopXHJcbiAgICAgICAgbmV3IHNpbmdsZVBhcmFtZXRlclJvdyhuZXdPYmosY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9iaixcInRvcExldmVsXCIsZGlhbG9nT2Zmc2V0KVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG5cclxuICAgIC8vY2hlY2sgZXhpc3RlZCBjb250ZW50IGluaXRpYWxseSBmcm9tIHRlbXBsYXRlIGFuZCB0cmlnZ2VyIHRoZWlyIGRyYXdpbmdcclxuICAgIGR0ZGxPYmouZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICBpZihlbGVtZW50W1wiQHR5cGVcIl0hPVwiUHJvcGVydHlcIikgcmV0dXJuXHJcbiAgICAgICAgbmV3IHNpbmdsZVBhcmFtZXRlclJvdyhlbGVtZW50LGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmosXCJ0b3BMZXZlbFwiLGRpYWxvZ09mZnNldClcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzaW5nbGVQYXJhbWV0ZXJSb3coZHRkbE9iaixwYXJlbnRET00scmVmcmVzaERURExGLHBhcmVudER0ZGxPYmosdG9wTGV2ZWwsZGlhbG9nT2Zmc2V0KXtcclxuICAgIHZhciBET00gPSAkKCc8ZGl2IGNsYXNzPVwidzMtY2VsbC1yb3dcIj48L2Rpdj4nKVxyXG4gICAgdmFyIHBhcmFtZXRlck5hbWVJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDoxMDBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cInBhcmFtZXRlciBuYW1lXCIvPicpLmFkZENsYXNzKFwidzMtYmFyLWl0ZW0gdzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgdmFyIGVudW1WYWx1ZUlucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjEwMHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwic3RyMSxzdHIyLC4uLlwiLz4nKS5hZGRDbGFzcyhcInczLWJhci1pdGVtIHczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIHZhciBhZGRCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWhvdmVyLWFtYmVyXCIgc3R5bGU9XCJjb2xvcjpncmF5O21hcmdpbi1sZWZ0OjNweDttYXJnaW4tdG9wOjJweDtmb250LXNpemU6MS4yZW07cGFkZGluZzoycHhcIj48aSBjbGFzcz1cImZhIGZhLXBsdXMgZmEtbGdcIj48L2k+PC9idXR0b24+JylcclxuICAgIHZhciByZW1vdmVCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWhvdmVyLWFtYmVyXCIgc3R5bGU9XCJjb2xvcjpncmF5O21hcmdpbi1sZWZ0OjNweDttYXJnaW4tdG9wOjJweDtmb250LXNpemU6MS4yZW07cGFkZGluZzoycHhcIj48aSBjbGFzcz1cImZhIGZhLXRyYXNoIGZhLWxnXCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICB2YXIgcHR5cGVTZWxlY3Rvcj1uZXcgc2ltcGxlU2VsZWN0TWVudShcIiBcIix7d2l0aEJvcmRlcjoxLGZvbnRTaXplOlwiMWVtXCIsY29sb3JDbGFzczpcInczLWxpZ2h0LWdyYXkgdzMtYmFyLWl0ZW1cIixidXR0b25DU1M6e1wicGFkZGluZ1wiOlwiNHB4IDVweFwifSxcIm9wdGlvbkxpc3RIZWlnaHRcIjozMDAsXCJpc0NsaWNrYWJsZVwiOjEsXCJvcHRpb25MaXN0TWFyZ2luVG9wXCI6LTE1MCxcIm9wdGlvbkxpc3RNYXJnaW5MZWZ0XCI6NjAsXHJcbiAgICBcImFkanVzdFBvc2l0aW9uQW5jaG9yXCI6ZGlhbG9nT2Zmc2V0fSlcclxuICAgIHB0eXBlU2VsZWN0b3IuYWRkT3B0aW9uQXJyKFtcIkVudW1cIixcIk9iamVjdFwiLFwiYm9vbGVhblwiLFwiZGF0ZVwiLFwiZGF0ZVRpbWVcIixcImRvdWJsZVwiLFwiZHVyYXRpb25cIixcImZsb2F0XCIsXCJpbnRlZ2VyXCIsXCJsb25nXCIsXCJzdHJpbmdcIixcInRpbWVcIl0pXHJcbiAgICBET00uYXBwZW5kKHBhcmFtZXRlck5hbWVJbnB1dCxwdHlwZVNlbGVjdG9yLkRPTSxlbnVtVmFsdWVJbnB1dCxhZGRCdXR0b24scmVtb3ZlQnV0dG9uKVxyXG5cclxuICAgIHJlbW92ZUJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICBmb3IgKHZhciBpID0wO2k8IHBhcmVudER0ZGxPYmoubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHBhcmVudER0ZGxPYmpbaV0gPT09IGR0ZGxPYmopIHtcclxuICAgICAgICAgICAgICAgIHBhcmVudER0ZGxPYmouc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgRE9NLnJlbW92ZSgpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcbiAgICBcclxuICAgIHZhciBjb250ZW50RE9NPSQoJzxkaXYgc3R5bGU9XCJwYWRkaW5nLWxlZnQ6MTBweFwiPjwvZGl2PicpXHJcbiAgICBET00uYXBwZW5kKGNvbnRlbnRET00pXHJcbiAgICBwYXJlbnRET00uYXBwZW5kKERPTSlcclxuXHJcbiAgICBwYXJhbWV0ZXJOYW1lSW5wdXQudmFsKGR0ZGxPYmpbXCJuYW1lXCJdKVxyXG4gICAgcHR5cGVTZWxlY3Rvci5jYWxsQmFja19jbGlja09wdGlvbj0ob3B0aW9uVGV4dCxvcHRpb25WYWx1ZSxyZWFsTW91c2VDbGljayk9PntcclxuICAgICAgICBwdHlwZVNlbGVjdG9yLmNoYW5nZU5hbWUob3B0aW9uVGV4dClcclxuICAgICAgICBjb250ZW50RE9NLmVtcHR5KCkvL2NsZWFyIGFsbCBjb250ZW50IGRvbSBjb250ZW50XHJcbiAgICAgICAgaWYocmVhbE1vdXNlQ2xpY2spe1xyXG4gICAgICAgICAgICBmb3IodmFyIGluZCBpbiBkdGRsT2JqKSBkZWxldGUgZHRkbE9ialtpbmRdICAgIC8vY2xlYXIgYWxsIG9iamVjdCBjb250ZW50XHJcbiAgICAgICAgICAgIGlmKHRvcExldmVsKSBkdGRsT2JqW1wiQHR5cGVcIl09XCJQcm9wZXJ0eVwiXHJcbiAgICAgICAgICAgIGR0ZGxPYmpbXCJuYW1lXCJdPXBhcmFtZXRlck5hbWVJbnB1dC52YWwoKVxyXG4gICAgICAgIH0gXHJcbiAgICAgICAgaWYob3B0aW9uVGV4dD09XCJFbnVtXCIpe1xyXG4gICAgICAgICAgICBlbnVtVmFsdWVJbnB1dC52YWwoXCJcIilcclxuICAgICAgICAgICAgZW51bVZhbHVlSW5wdXQuc2hvdygpO1xyXG4gICAgICAgICAgICBhZGRCdXR0b24uaGlkZSgpXHJcbiAgICAgICAgICAgIGlmKHJlYWxNb3VzZUNsaWNrKSBkdGRsT2JqW1wic2NoZW1hXCJdPXtcIkB0eXBlXCI6IFwiRW51bVwiLFwidmFsdWVTY2hlbWFcIjogXCJzdHJpbmdcIn1cclxuICAgICAgICB9ZWxzZSBpZihvcHRpb25UZXh0PT1cIk9iamVjdFwiKXtcclxuICAgICAgICAgICAgZW51bVZhbHVlSW5wdXQuaGlkZSgpO1xyXG4gICAgICAgICAgICBhZGRCdXR0b24uc2hvdygpXHJcbiAgICAgICAgICAgIGlmKHJlYWxNb3VzZUNsaWNrKSBkdGRsT2JqW1wic2NoZW1hXCJdPXtcIkB0eXBlXCI6IFwiT2JqZWN0XCJ9XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIGlmKHJlYWxNb3VzZUNsaWNrKSBkdGRsT2JqW1wic2NoZW1hXCJdPW9wdGlvblRleHRcclxuICAgICAgICAgICAgZW51bVZhbHVlSW5wdXQuaGlkZSgpO1xyXG4gICAgICAgICAgICBhZGRCdXR0b24uaGlkZSgpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9XHJcbiAgICBhZGRCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgaWYoISBkdGRsT2JqW1wic2NoZW1hXCJdW1wiZmllbGRzXCJdKSBkdGRsT2JqW1wic2NoZW1hXCJdW1wiZmllbGRzXCJdPVtdXHJcbiAgICAgICAgdmFyIG5ld09iaiA9IHtcclxuICAgICAgICAgICAgXCJuYW1lXCI6IFwibmV3UFwiLFxyXG4gICAgICAgICAgICBcInNjaGVtYVwiOiBcImRvdWJsZVwiXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGR0ZGxPYmpbXCJzY2hlbWFcIl1bXCJmaWVsZHNcIl0ucHVzaChuZXdPYmopXHJcbiAgICAgICAgbmV3IHNpbmdsZVBhcmFtZXRlclJvdyhuZXdPYmosY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9ialtcInNjaGVtYVwiXVtcImZpZWxkc1wiXSxudWxsLGRpYWxvZ09mZnNldClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuXHJcbiAgICBwYXJhbWV0ZXJOYW1lSW5wdXQub24oXCJjaGFuZ2VcIiwoKT0+e1xyXG4gICAgICAgIGR0ZGxPYmpbXCJuYW1lXCJdPXBhcmFtZXRlck5hbWVJbnB1dC52YWwoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgZW51bVZhbHVlSW5wdXQub24oXCJjaGFuZ2VcIiwoKT0+e1xyXG4gICAgICAgIHZhciB2YWx1ZUFycj1lbnVtVmFsdWVJbnB1dC52YWwoKS5zcGxpdChcIixcIilcclxuICAgICAgICBkdGRsT2JqW1wic2NoZW1hXCJdW1wiZW51bVZhbHVlc1wiXT1bXVxyXG4gICAgICAgIHZhbHVlQXJyLmZvckVhY2goYVZhbD0+e1xyXG4gICAgICAgICAgICBkdGRsT2JqW1wic2NoZW1hXCJdW1wiZW51bVZhbHVlc1wiXS5wdXNoKHtcclxuICAgICAgICAgICAgICAgIFwibmFtZVwiOiBhVmFsLnJlcGxhY2UoXCIgXCIsXCJcIiksIC8vcmVtb3ZlIGFsbCB0aGUgc3BhY2UgaW4gbmFtZVxyXG4gICAgICAgICAgICAgICAgXCJlbnVtVmFsdWVcIjogYVZhbFxyXG4gICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSlcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuICAgIGlmKHR5cGVvZihkdGRsT2JqW1wic2NoZW1hXCJdKSAhPSAnb2JqZWN0JykgdmFyIHNjaGVtYT1kdGRsT2JqW1wic2NoZW1hXCJdXHJcbiAgICBlbHNlIHNjaGVtYT1kdGRsT2JqW1wic2NoZW1hXCJdW1wiQHR5cGVcIl1cclxuICAgIHB0eXBlU2VsZWN0b3IudHJpZ2dlck9wdGlvblZhbHVlKHNjaGVtYSlcclxuICAgIGlmKHNjaGVtYT09XCJFbnVtXCIpe1xyXG4gICAgICAgIHZhciBlbnVtQXJyPWR0ZGxPYmpbXCJzY2hlbWFcIl1bXCJlbnVtVmFsdWVzXCJdXHJcbiAgICAgICAgaWYoZW51bUFyciE9bnVsbCl7XHJcbiAgICAgICAgICAgIHZhciBpbnB1dFN0cj1cIlwiXHJcbiAgICAgICAgICAgIGVudW1BcnIuZm9yRWFjaChvbmVFbnVtVmFsdWU9PntpbnB1dFN0cis9b25lRW51bVZhbHVlLmVudW1WYWx1ZStcIixcIn0pXHJcbiAgICAgICAgICAgIGlucHV0U3RyPWlucHV0U3RyLnNsaWNlKDAsIC0xKS8vcmVtb3ZlIHRoZSBsYXN0IFwiLFwiXHJcbiAgICAgICAgICAgIGVudW1WYWx1ZUlucHV0LnZhbChpbnB1dFN0cilcclxuICAgICAgICB9XHJcbiAgICB9ZWxzZSBpZihzY2hlbWE9PVwiT2JqZWN0XCIpe1xyXG4gICAgICAgIHZhciBmaWVsZHM9ZHRkbE9ialtcInNjaGVtYVwiXVtcImZpZWxkc1wiXVxyXG4gICAgICAgIGZpZWxkcy5mb3JFYWNoKG9uZUZpZWxkPT57XHJcbiAgICAgICAgICAgIG5ldyBzaW5nbGVQYXJhbWV0ZXJSb3cob25lRmllbGQsY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9ialtcInNjaGVtYVwiXVtcImZpZWxkc1wiXSxudWxsLGRpYWxvZ09mZnNldClcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG59XHJcblxyXG5cclxuZnVuY3Rpb24gaWRSb3coZHRkbE9iaixwYXJlbnRET00scmVmcmVzaERURExGKXtcclxuICAgIHZhciBET00gPSAkKCc8ZGl2IGNsYXNzPVwidzMtY2VsbC1yb3dcIj48L2Rpdj4nKVxyXG4gICAgdmFyIGxhYmVsMT0kKCc8ZGl2IGNsYXNzPVwidzMtb3BhY2l0eVwiIHN0eWxlPVwiZGlzcGxheTppbmxpbmVcIj5kdG1pOjwvZGl2PicpXHJcbiAgICB2YXIgZG9tYWluSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmU7d2lkdGg6ODBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cIk5hbWVzcGFjZVwiLz4nKS5hZGRDbGFzcyhcInczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIHZhciBtb2RlbElESW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmU7d2lkdGg6MTQwcHg7cGFkZGluZzo0cHhcIiAgcGxhY2Vob2xkZXI9XCJNb2RlbElEXCIvPicpLmFkZENsYXNzKFwidzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgdmFyIHZlcnNpb25JbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDo2MHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwidmVyc2lvblwiLz4nKS5hZGRDbGFzcyhcInczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIERPTS5hcHBlbmQobGFiZWwxLGRvbWFpbklucHV0LCQoJzxkaXYgY2xhc3M9XCJ3My1vcGFjaXR5XCIgc3R5bGU9XCJkaXNwbGF5OmlubGluZVwiPjo8L2Rpdj4nKSxtb2RlbElESW5wdXQsJCgnPGRpdiBjbGFzcz1cInczLW9wYWNpdHlcIiBzdHlsZT1cImRpc3BsYXk6aW5saW5lXCI+OzwvZGl2PicpLHZlcnNpb25JbnB1dClcclxuICAgIHBhcmVudERPTS5hcHBlbmQoRE9NKVxyXG5cclxuICAgIHZhciB2YWx1ZUNoYW5nZT0oKT0+e1xyXG4gICAgICAgIHZhciBzdHI9YGR0bWk6JHtkb21haW5JbnB1dC52YWwoKX06JHttb2RlbElESW5wdXQudmFsKCl9OyR7dmVyc2lvbklucHV0LnZhbCgpfWBcclxuICAgICAgICBkdGRsT2JqW1wiQGlkXCJdPXN0clxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9XHJcbiAgICBkb21haW5JbnB1dC5vbihcImNoYW5nZVwiLHZhbHVlQ2hhbmdlKVxyXG4gICAgbW9kZWxJRElucHV0Lm9uKFwiY2hhbmdlXCIsdmFsdWVDaGFuZ2UpXHJcbiAgICB2ZXJzaW9uSW5wdXQub24oXCJjaGFuZ2VcIix2YWx1ZUNoYW5nZSlcclxuXHJcbiAgICB2YXIgc3RyPWR0ZGxPYmpbXCJAaWRcIl1cclxuICAgIGlmKHN0ciE9XCJcIiAmJiBzdHIhPW51bGwpe1xyXG4gICAgICAgIHZhciBhcnIxPXN0ci5zcGxpdChcIjtcIilcclxuICAgICAgICBpZihhcnIxLmxlbmd0aCE9MikgcmV0dXJuO1xyXG4gICAgICAgIHZlcnNpb25JbnB1dC52YWwoYXJyMVsxXSlcclxuICAgICAgICB2YXIgYXJyMj1hcnIxWzBdLnNwbGl0KFwiOlwiKVxyXG4gICAgICAgIGRvbWFpbklucHV0LnZhbChhcnIyWzFdKVxyXG4gICAgICAgIGFycjIuc2hpZnQoKTsgYXJyMi5zaGlmdCgpXHJcbiAgICAgICAgbW9kZWxJRElucHV0LnZhbChhcnIyLmpvaW4oXCI6XCIpKVxyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBkaXNwbGF5TmFtZVJvdyhkdGRsT2JqLHBhcmVudERPTSxyZWZyZXNoRFRETEYpe1xyXG4gICAgdmFyIERPTSA9ICQoJzxkaXYgY2xhc3M9XCJ3My1jZWxsLXJvd1wiPjwvZGl2PicpXHJcbiAgICB2YXIgbGFiZWwxPSQoJzxkaXYgY2xhc3M9XCJ3My1vcGFjaXR5XCIgc3R5bGU9XCJkaXNwbGF5OmlubGluZVwiPkRpc3BsYXkgTmFtZTo8L2Rpdj4nKVxyXG4gICAgdmFyIG5hbWVJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDoxNTBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cIk1vZGVsSURcIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICBET00uYXBwZW5kKGxhYmVsMSxuYW1lSW5wdXQpXHJcbiAgICBwYXJlbnRET00uYXBwZW5kKERPTSlcclxuICAgIHZhciB2YWx1ZUNoYW5nZT0oKT0+e1xyXG4gICAgICAgIGR0ZGxPYmpbXCJkaXNwbGF5TmFtZVwiXT1uYW1lSW5wdXQudmFsKClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfVxyXG4gICAgbmFtZUlucHV0Lm9uKFwiY2hhbmdlXCIsdmFsdWVDaGFuZ2UpXHJcbiAgICB2YXIgc3RyPWR0ZGxPYmpbXCJkaXNwbGF5TmFtZVwiXVxyXG4gICAgaWYoc3RyIT1cIlwiICYmIHN0ciE9bnVsbCkgbmFtZUlucHV0LnZhbChzdHIpXHJcbn0iLCJjb25zdCBtb2RlbEFuYWx5emVyPXJlcXVpcmUoXCIuL21vZGVsQW5hbHl6ZXJcIilcclxuY29uc3Qgc2ltcGxlVHJlZT0gcmVxdWlyZShcIi4vc2ltcGxlVHJlZVwiKVxyXG5jb25zdCBzaW1wbGVDb25maXJtRGlhbG9nID0gcmVxdWlyZShcIi4vc2ltcGxlQ29uZmlybURpYWxvZ1wiKVxyXG5jb25zdCBtb2RlbEVkaXRvckRpYWxvZyA9IHJlcXVpcmUoXCIuL21vZGVsRWRpdG9yRGlhbG9nXCIpXHJcbmNvbnN0IGdsb2JhbENhY2hlID0gcmVxdWlyZShcIi4vZ2xvYmFsQ2FjaGVcIilcclxuY29uc3QgbXNhbEhlbHBlcj1yZXF1aXJlKFwiLi4vbXNhbEhlbHBlclwiKVxyXG5cclxuZnVuY3Rpb24gbW9kZWxNYW5hZ2VyRGlhbG9nKCkge1xyXG4gICAgaWYoIXRoaXMuRE9NKXtcclxuICAgICAgICB0aGlzLkRPTSA9ICQoJzxkaXYgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO2JhY2tncm91bmQtY29sb3I6d2hpdGU7bGVmdDo1MCU7dHJhbnNmb3JtOiB0cmFuc2xhdGVYKC01MCUpIHRyYW5zbGF0ZVkoLTUwJSk7ei1pbmRleDo5OVwiIGNsYXNzPVwidzMtY2FyZC0yXCI+PC9kaXY+JylcclxuICAgICAgICB0aGlzLkRPTS5jc3MoXCJvdmVyZmxvd1wiLFwiaGlkZGVuXCIpXHJcbiAgICAgICAgJChcImJvZHlcIikuYXBwZW5kKHRoaXMuRE9NKVxyXG4gICAgICAgIHRoaXMuRE9NLmhpZGUoKVxyXG4gICAgfVxyXG4gICAgdGhpcy5zaG93UmVsYXRpb25WaXN1YWxpemF0aW9uU2V0dGluZ3M9dHJ1ZTtcclxufVxyXG5cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUucG9wdXAgPSBhc3luYyBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMuRE9NLnNob3coKVxyXG4gICAgdGhpcy5ET00uZW1wdHkoKVxyXG4gICAgdGhpcy5jb250ZW50RE9NID0gJCgnPGRpdiBzdHlsZT1cIndpZHRoOjY1MHB4XCI+PC9kaXY+JylcclxuICAgIHRoaXMuRE9NLmFwcGVuZCh0aGlzLmNvbnRlbnRET00pXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6NDBweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiZm9udC1zaXplOjEuNWVtXCI+RGlnaXRhbCBUd2luIE1vZGVsczwvZGl2PjwvZGl2PicpKVxyXG4gICAgdmFyIGNsb3NlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yaWdodFwiIHN0eWxlPVwiZm9udC1zaXplOjJlbTtwYWRkaW5nLXRvcDo0cHhcIj7DlzwvYnV0dG9uPicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZChjbG9zZUJ1dHRvbilcclxuICAgIGNsb3NlQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLkRPTS5oaWRlKCkgfSlcclxuXHJcbiAgICB2YXIgaW1wb3J0TW9kZWxzQnRuID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1jYXJkIHczLWRlZXAtb3JhbmdlIHczLWhvdmVyLWxpZ2h0LWdyZWVuXCIgc3R5bGU9XCJoZWlnaHQ6MTAwJVwiPkltcG9ydDwvYnV0dG9uPicpXHJcbiAgICB2YXIgYWN0dWFsSW1wb3J0TW9kZWxzQnRuID0kKCc8aW5wdXQgdHlwZT1cImZpbGVcIiBuYW1lPVwibW9kZWxGaWxlc1wiIG11bHRpcGxlPVwibXVsdGlwbGVcIiBzdHlsZT1cImRpc3BsYXk6bm9uZVwiPjwvaW5wdXQ+JylcclxuICAgIHZhciBtb2RlbEVkaXRvckJ0biA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtY2FyZCB3My1kZWVwLW9yYW5nZSB3My1ob3Zlci1saWdodC1ncmVlblwiIHN0eWxlPVwiaGVpZ2h0OjEwMCVcIj5DcmVhdGUgTW9kZWw8L2J1dHRvbj4nKVxyXG4gICAgdmFyIGV4cG9ydE1vZGVsQnRuID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1jYXJkIHczLWRlZXAtb3JhbmdlIHczLWhvdmVyLWxpZ2h0LWdyZWVuXCIgc3R5bGU9XCJoZWlnaHQ6MTAwJVwiPkV4cG9ydCBBbGwgTW9kZWxzPC9idXR0b24+JylcclxuICAgIHRoaXMuY29udGVudERPTS5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKGltcG9ydE1vZGVsc0J0bixhY3R1YWxJbXBvcnRNb2RlbHNCdG4sIG1vZGVsRWRpdG9yQnRuLGV4cG9ydE1vZGVsQnRuKVxyXG4gICAgaW1wb3J0TW9kZWxzQnRuLm9uKFwiY2xpY2tcIiwgKCk9PntcclxuICAgICAgICBhY3R1YWxJbXBvcnRNb2RlbHNCdG4udHJpZ2dlcignY2xpY2snKTtcclxuICAgIH0pO1xyXG4gICAgYWN0dWFsSW1wb3J0TW9kZWxzQnRuLmNoYW5nZShhc3luYyAoZXZ0KT0+e1xyXG4gICAgICAgIHZhciBmaWxlcyA9IGV2dC50YXJnZXQuZmlsZXM7IC8vIEZpbGVMaXN0IG9iamVjdFxyXG4gICAgICAgIGF3YWl0IHRoaXMucmVhZE1vZGVsRmlsZXNDb250ZW50QW5kSW1wb3J0KGZpbGVzKVxyXG4gICAgICAgIGFjdHVhbEltcG9ydE1vZGVsc0J0bi52YWwoXCJcIilcclxuICAgIH0pXHJcbiAgICBtb2RlbEVkaXRvckJ0bi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICB0aGlzLkRPTS5oaWRlKClcclxuICAgICAgICBtb2RlbEVkaXRvckRpYWxvZy5wb3B1cCgpXHJcbiAgICB9KVxyXG4gICAgZXhwb3J0TW9kZWxCdG4ub24oXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgICAgdmFyIG1vZGVsQXJyPVtdXHJcbiAgICAgICAgZm9yKHZhciBtb2RlbElEIGluIG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVscykgbW9kZWxBcnIucHVzaChKU09OLnBhcnNlKG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXVtcIm9yaWdpbmFsXCJdKSlcclxuICAgICAgICB2YXIgcG9tID0gJChcIjxhPjwvYT5cIilcclxuICAgICAgICBwb20uYXR0cignaHJlZicsICdkYXRhOnRleHQvcGxhaW47Y2hhcnNldD11dGYtOCwnICsgZW5jb2RlVVJJQ29tcG9uZW50KEpTT04uc3RyaW5naWZ5KG1vZGVsQXJyKSkpO1xyXG4gICAgICAgIHBvbS5hdHRyKCdkb3dubG9hZCcsIFwiZXhwb3J0TW9kZWxzLmpzb25cIik7XHJcbiAgICAgICAgcG9tWzBdLmNsaWNrKClcclxuICAgIH0pXHJcblxyXG4gICAgdmFyIHJvdzI9JCgnPGRpdiBjbGFzcz1cInczLWNlbGwtcm93XCIgc3R5bGU9XCJtYXJnaW4tdG9wOjJweFwiPjwvZGl2PicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKHJvdzIpXHJcbiAgICB2YXIgbGVmdFNwYW49JCgnPGRpdiBjbGFzcz1cInczLWNlbGxcIiBzdHlsZT1cIndpZHRoOjI0MHB4O3BhZGRpbmctcmlnaHQ6NXB4XCI+PC9kaXY+JylcclxuICAgIHJvdzIuYXBwZW5kKGxlZnRTcGFuKVxyXG4gICAgbGVmdFNwYW4uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6MzBweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiXCI+TW9kZWxzPC9kaXY+PC9kaXY+JykpXHJcbiAgICBcclxuICAgIHZhciBtb2RlbExpc3QgPSAkKCc8dWwgY2xhc3M9XCJ3My11bCB3My1ob3ZlcmFibGVcIj4nKVxyXG4gICAgbW9kZWxMaXN0LmNzcyh7XCJvdmVyZmxvdy14XCI6XCJoaWRkZW5cIixcIm92ZXJmbG93LXlcIjpcImF1dG9cIixcImhlaWdodFwiOlwiNDIwcHhcIiwgXCJib3JkZXJcIjpcInNvbGlkIDFweCBsaWdodGdyYXlcIn0pXHJcbiAgICBsZWZ0U3Bhbi5hcHBlbmQobW9kZWxMaXN0KVxyXG4gICAgdGhpcy5tb2RlbExpc3QgPSBtb2RlbExpc3Q7XHJcbiAgICBcclxuICAgIHZhciByaWdodFNwYW49JCgnPGRpdiBjbGFzcz1cInczLWNvbnRhaW5lciB3My1jZWxsXCIgc3R5bGU9XCJwYWRkaW5nOjBweFwiPjwvZGl2PicpXHJcbiAgICByb3cyLmFwcGVuZChyaWdodFNwYW4pIFxyXG4gICAgdmFyIHBhbmVsQ2FyZE91dD0kKCc8ZGl2IGNsYXNzPVwidzMtY2FyZC0yIHczLXdoaXRlXCIgc3R5bGU9XCJtYXJnaW4tdG9wOjJweFwiPjwvZGl2PicpXHJcblxyXG4gICAgdGhpcy5tb2RlbEJ1dHRvbkJhcj0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCIgc3R5bGU9XCJoZWlnaHQ6MzVweFwiPjwvZGl2PicpXHJcbiAgICBwYW5lbENhcmRPdXQuYXBwZW5kKHRoaXMubW9kZWxCdXR0b25CYXIpXHJcblxyXG4gICAgcmlnaHRTcGFuLmFwcGVuZChwYW5lbENhcmRPdXQpXHJcbiAgICB2YXIgcGFuZWxDYXJkPSQoJzxkaXYgc3R5bGU9XCJ3aWR0aDo0MTBweDtoZWlnaHQ6NDEycHg7b3ZlcmZsb3c6YXV0bzttYXJnaW4tdG9wOjJweFwiPjwvZGl2PicpXHJcbiAgICBwYW5lbENhcmRPdXQuYXBwZW5kKHBhbmVsQ2FyZClcclxuICAgIHRoaXMucGFuZWxDYXJkPXBhbmVsQ2FyZDtcclxuXHJcbiAgICB0aGlzLm1vZGVsQnV0dG9uQmFyLmVtcHR5KClcclxuICAgIHBhbmVsQ2FyZC5odG1sKFwiPGEgc3R5bGU9J2Rpc3BsYXk6YmxvY2s7Zm9udC1zdHlsZTppdGFsaWM7Y29sb3I6Z3JheTtwYWRkaW5nLWxlZnQ6NXB4Jz5DaG9vc2UgYSBtb2RlbCB0byB2aWV3IGluZm9tcmF0aW9uPC9hPlwiKVxyXG5cclxuICAgIHRoaXMubGlzdE1vZGVscygpXHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUucmVzaXplSW1nRmlsZSA9IGFzeW5jIGZ1bmN0aW9uKHRoZUZpbGUsbWF4X3NpemUpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XHJcbiAgICAgICAgICAgIHZhciB0bXBJbWcgPSBuZXcgSW1hZ2UoKTtcclxuICAgICAgICAgICAgcmVhZGVyLm9ubG9hZCA9ICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRtcEltZy5vbmxvYWQgPSAgKCk9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHdpZHRoID0gdG1wSW1nLndpZHRoXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGhlaWdodCA9IHRtcEltZy5oZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHdpZHRoID4gaGVpZ2h0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3aWR0aCA+IG1heF9zaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQgKj0gbWF4X3NpemUgLyB3aWR0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoID0gbWF4X3NpemU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGVpZ2h0ID4gbWF4X3NpemUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoICo9IG1heF9zaXplIC8gaGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ID0gbWF4X3NpemU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgY2FudmFzLndpZHRoID0gd2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FudmFzLmhlaWdodCA9IGhlaWdodDtcclxuICAgICAgICAgICAgICAgICAgICBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKS5kcmF3SW1hZ2UodG1wSW1nLCAwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZGF0YVVybCA9IGNhbnZhcy50b0RhdGFVUkwoJ2ltYWdlL3BuZycpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZGF0YVVybClcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRtcEltZy5zcmMgPSByZWFkZXIucmVzdWx0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKHRoZUZpbGUpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgcmVqZWN0KGUpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5maWxsUmlnaHRTcGFuPWFzeW5jIGZ1bmN0aW9uKG1vZGVsSUQpe1xyXG4gICAgdGhpcy5wYW5lbENhcmQuZW1wdHkoKVxyXG4gICAgdGhpcy5tb2RlbEJ1dHRvbkJhci5lbXB0eSgpXHJcblxyXG4gICAgdmFyIGRlbEJ0biA9ICQoJzxidXR0b24gc3R5bGU9XCJtYXJnaW4tYm90dG9tOjJweFwiIGNsYXNzPVwidzMtYnV0dG9uIHczLWxpZ2h0LWdyYXkgdzMtaG92ZXItcGluayB3My1ib3JkZXItcmlnaHRcIj5EZWxldGUgTW9kZWw8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5tb2RlbEJ1dHRvbkJhci5hcHBlbmQoZGVsQnRuKVxyXG5cclxuXHJcbiAgICB2YXIgaW1wb3J0UGljQnRuID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1saWdodC1ncmF5IHczLWhvdmVyLWFtYmVyIHczLWJvcmRlci1yaWdodFwiPlVwbG9hZCBBdmFydGE8L2J1dHRvbj4nKVxyXG4gICAgdmFyIGFjdHVhbEltcG9ydFBpY0J0biA9ICQoJzxpbnB1dCB0eXBlPVwiZmlsZVwiIG5hbWU9XCJpbWdcIiBzdHlsZT1cImRpc3BsYXk6bm9uZVwiPjwvaW5wdXQ+JylcclxuICAgIHZhciBjbGVhckF2YXJ0YUJ0biA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtbGlnaHQtZ3JheSB3My1ob3Zlci1waW5rIHczLWJvcmRlci1yaWdodFwiPkNsZWFyIEF2YXJ0YTwvYnV0dG9uPicpXHJcbiAgICB0aGlzLm1vZGVsQnV0dG9uQmFyLmFwcGVuZChpbXBvcnRQaWNCdG4sIGFjdHVhbEltcG9ydFBpY0J0biwgY2xlYXJBdmFydGFCdG4pXHJcbiAgICBpbXBvcnRQaWNCdG4ub24oXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgICAgYWN0dWFsSW1wb3J0UGljQnRuLnRyaWdnZXIoJ2NsaWNrJyk7XHJcbiAgICB9KTtcclxuXHJcbiAgICBhY3R1YWxJbXBvcnRQaWNCdG4uY2hhbmdlKGFzeW5jIChldnQpID0+IHtcclxuICAgICAgICB2YXIgZmlsZXMgPSBldnQudGFyZ2V0LmZpbGVzOyAvLyBGaWxlTGlzdCBvYmplY3RcclxuICAgICAgICB2YXIgdGhlRmlsZSA9IGZpbGVzWzBdXHJcblxyXG4gICAgICAgIGlmICh0aGVGaWxlLnR5cGUgPT0gXCJpbWFnZS9zdmcreG1sXCIpIHtcclxuICAgICAgICAgICAgdmFyIHN0ciA9IGF3YWl0IHRoaXMucmVhZE9uZUZpbGUodGhlRmlsZSlcclxuICAgICAgICAgICAgdmFyIGRhdGFVcmwgPSAnZGF0YTppbWFnZS9zdmcreG1sO3V0ZjgsJyArIGVuY29kZVVSSUNvbXBvbmVudChzdHIpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAodGhlRmlsZS50eXBlLm1hdGNoKCdpbWFnZS4qJykpIHtcclxuICAgICAgICAgICAgdmFyIGRhdGFVcmwgPSBhd2FpdCB0aGlzLnJlc2l6ZUltZ0ZpbGUodGhlRmlsZSwgNzApXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdmFyIGNvbmZpcm1EaWFsb2dEaXYgPSBuZXcgc2ltcGxlQ29uZmlybURpYWxvZygpXHJcbiAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuc2hvdyh7IHdpZHRoOiBcIjIwMHB4XCIgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogXCJOb3RlXCJcclxuICAgICAgICAgICAgICAgICAgICAsIGNvbnRlbnQ6IFwiUGxlYXNlIGltcG9ydCBpbWFnZSBmaWxlIChwbmcsanBnLHN2ZyBhbmQgc28gb24pXCJcclxuICAgICAgICAgICAgICAgICAgICAsIGJ1dHRvbnM6IFt7IGNvbG9yQ2xhc3M6IFwidzMtZ3JheVwiLCB0ZXh0OiBcIk9rXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHsgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpIH0gfV1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5hdmFydGFJbWcpIHRoaXMuYXZhcnRhSW1nLmF0dHIoXCJzcmNcIiwgZGF0YVVybClcclxuXHJcbiAgICAgICAgdmFyIHZpc3VhbEpzb24gPSBnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW1wiZGVmYXVsdFwiXVxyXG4gICAgICAgIGlmICghdmlzdWFsSnNvblttb2RlbElEXSkgdmlzdWFsSnNvblttb2RlbElEXSA9IHt9XHJcbiAgICAgICAgdmlzdWFsSnNvblttb2RlbElEXS5hdmFydGEgPSBkYXRhVXJsXHJcbiAgICAgICAgdGhpcy5zYXZlVmlzdWFsRGVmaW5pdGlvbigpXHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwidmlzdWFsRGVmaW5pdGlvbkNoYW5nZVwiLCBcIm1vZGVsSURcIjogbW9kZWxJRCwgXCJhdmFydGFcIjogZGF0YVVybCB9KVxyXG4gICAgICAgIHRoaXMucmVmcmVzaE1vZGVsVHJlZUxhYmVsKClcclxuICAgICAgICBhY3R1YWxJbXBvcnRQaWNCdG4udmFsKFwiXCIpXHJcbiAgICB9KVxyXG5cclxuICAgIGNsZWFyQXZhcnRhQnRuLm9uKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgIHZhciB2aXN1YWxKc29uID0gZ2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltcImRlZmF1bHRcIl1cclxuICAgICAgICBpZiAodmlzdWFsSnNvblttb2RlbElEXSkgZGVsZXRlIHZpc3VhbEpzb25bbW9kZWxJRF0uYXZhcnRhXHJcbiAgICAgICAgaWYgKHRoaXMuYXZhcnRhSW1nKSB0aGlzLmF2YXJ0YUltZy5yZW1vdmVBdHRyKCdzcmMnKTtcclxuICAgICAgICB0aGlzLnNhdmVWaXN1YWxEZWZpbml0aW9uKClcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJ2aXN1YWxEZWZpbml0aW9uQ2hhbmdlXCIsIFwibW9kZWxJRFwiOiBtb2RlbElELCBcIm5vQXZhcnRhXCI6IHRydWUgfSlcclxuICAgICAgICB0aGlzLnJlZnJlc2hNb2RlbFRyZWVMYWJlbCgpXHJcbiAgICB9KTtcclxuXHJcbiAgICBcclxuICAgIGRlbEJ0bi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICB2YXIgY29uZmlybURpYWxvZ0RpdiA9IG5ldyBzaW1wbGVDb25maXJtRGlhbG9nKClcclxuXHJcbiAgICAgICAgLy9jaGVjayBob3cgbWFueSB0d2lucyBhcmUgdW5kZXIgdGhpcyBtb2RlbCBJRFxyXG4gICAgICAgIHZhciBudW1iZXJPZlR3aW5zPTBcclxuICAgICAgICBnbG9iYWxDYWNoZS5EQlR3aW5zQXJyLmZvckVhY2gob25lREJUd2luPT57XHJcbiAgICAgICAgICAgIGlmKG9uZURCVHdpbltcIm1vZGVsSURcIl09PW1vZGVsSUQpIG51bWJlck9mVHdpbnMrK1xyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIHZhciBjb250ZW50U3RyPVwiVGhpcyB3aWxsIERFTEVURSBtb2RlbCBcXFwiXCIgKyBtb2RlbElEICsgXCJcXFwiLiBcIlxyXG4gICAgICAgIGNvbnRlbnRTdHIrPVwiKFRoZXJlIFwiKygobnVtYmVyT2ZUd2lucz4xKT8oXCJhcmUgXCIrbnVtYmVyT2ZUd2lucytcIiB0d2luc1wiKTooXCJpcyBcIitudW1iZXJPZlR3aW5zK1wiIHR3aW5cIikgKSArIFwiIG9mIHRoaXMgbW9kZWwuXCJcclxuICAgICAgICBpZihudW1iZXJPZlR3aW5zPjApIGNvbnRlbnRTdHIrPVwiIFlvdSBtYXkgc3RpbGwgZGVsZXRlIHRoZSBtb2RlbCwgYnV0IHBsZWFzZSBpbXBvcnQgYSBtb2RlbCB3aXRoIHRoaXMgbW9kZWxJRCB0byBlbnN1cmUgbm9ybWFsIG9wZXJhdGlvbilcIlxyXG4gICAgICAgIGVsc2UgY29udGVudFN0cis9XCIpXCJcclxuICAgICAgICBjb25maXJtRGlhbG9nRGl2LnNob3coXHJcbiAgICAgICAgICAgIHsgd2lkdGg6IFwiMzUwcHhcIiB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogXCJXYXJuaW5nXCJcclxuICAgICAgICAgICAgICAgICwgY29udGVudDogY29udGVudFN0clxyXG4gICAgICAgICAgICAgICAgLCBidXR0b25zOiBbXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvckNsYXNzOiBcInczLXJlZCB3My1ob3Zlci1waW5rXCIsIHRleHQ6IFwiQ29uZmlybVwiLCBcImNsaWNrRnVuY1wiOiBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vZGVsZXRlTW9kZWxcIiwgXCJQT1NUXCIsIHsgXCJtb2RlbFwiOiBtb2RlbElEIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJlZS5kZWxldGVMZWFmTm9kZShnbG9iYWxDYWNoZS5tb2RlbElETWFwVG9OYW1lW21vZGVsSURdKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcIkFEVE1vZGVsc0NoYW5nZVwifSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBhbmVsQ2FyZC5lbXB0eSgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9UT0RPOiBjbGVhciB0aGUgdmlzdWFsaXphdGlvbiBzZXR0aW5nIG9mIHRoaXMgZGVsZXRlZCBtb2RlbFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdW21vZGVsSURdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW1wiZGVmYXVsdFwiXVttb2RlbElEXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNhdmVWaXN1YWxEZWZpbml0aW9uKClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9Ki9cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1jYXRjaChlKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvckNsYXNzOiBcInczLWdyYXlcIiwgdGV4dDogXCJDYW5jZWxcIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICApXHJcbiAgICAgICAgXHJcbiAgICB9KVxyXG4gICAgXHJcbiAgICB2YXIgVmlzdWFsaXphdGlvbkRPTT10aGlzLmFkZEFQYXJ0SW5SaWdodFNwYW4oXCJWaXN1YWxpemF0aW9uXCIpXHJcbiAgICB2YXIgZWRpdGFibGVQcm9wZXJ0aWVzRE9NPXRoaXMuYWRkQVBhcnRJblJpZ2h0U3BhbihcIkVkaXRhYmxlIFByb3BlcnRpZXMgQW5kIFJlbGF0aW9uc2hpcHNcIilcclxuICAgIHZhciBiYXNlQ2xhc3Nlc0RPTT10aGlzLmFkZEFQYXJ0SW5SaWdodFNwYW4oXCJCYXNlIENsYXNzZXNcIilcclxuICAgIHZhciBvcmlnaW5hbERlZmluaXRpb25ET009dGhpcy5hZGRBUGFydEluUmlnaHRTcGFuKFwiT3JpZ2luYWwgRGVmaW5pdGlvblwiKVxyXG5cclxuICAgIHZhciBzdHI9SlNPTi5zdHJpbmdpZnkoSlNPTi5wYXJzZShtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF1bXCJvcmlnaW5hbFwiXSksbnVsbCwyKVxyXG4gICAgb3JpZ2luYWxEZWZpbml0aW9uRE9NLmFwcGVuZCgkKCc8cHJlIGlkPVwianNvblwiPicrc3RyKyc8L3ByZT4nKSlcclxuXHJcbiAgICB2YXIgZWRpdHRhYmxlUHJvcGVydGllcz1tb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF0uZWRpdGFibGVQcm9wZXJ0aWVzXHJcbiAgICB0aGlzLmZpbGxFZGl0YWJsZVByb3BlcnRpZXMoZWRpdHRhYmxlUHJvcGVydGllcyxlZGl0YWJsZVByb3BlcnRpZXNET00pXHJcbiAgICB2YXIgdmFsaWRSZWxhdGlvbnNoaXBzPW1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXS52YWxpZFJlbGF0aW9uc2hpcHNcclxuICAgIHRoaXMuZmlsbFJlbGF0aW9uc2hpcEluZm8odmFsaWRSZWxhdGlvbnNoaXBzLGVkaXRhYmxlUHJvcGVydGllc0RPTSlcclxuXHJcbiAgICB0aGlzLmZpbGxWaXN1YWxpemF0aW9uKG1vZGVsSUQsVmlzdWFsaXphdGlvbkRPTSlcclxuXHJcbiAgICB0aGlzLmZpbGxCYXNlQ2xhc3Nlcyhtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF0uYWxsQmFzZUNsYXNzZXMsYmFzZUNsYXNzZXNET00pIFxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLnJlZnJlc2hNb2RlbFRyZWVMYWJlbD1mdW5jdGlvbigpe1xyXG4gICAgaWYodGhpcy50cmVlLnNlbGVjdGVkTm9kZXMubGVuZ3RoPjApIHRoaXMudHJlZS5zZWxlY3RlZE5vZGVzWzBdLnJlZHJhd0xhYmVsKClcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5maWxsQmFzZUNsYXNzZXM9ZnVuY3Rpb24oYmFzZUNsYXNzZXMscGFyZW50RG9tKXtcclxuICAgIGZvcih2YXIgaW5kIGluIGJhc2VDbGFzc2VzKXtcclxuICAgICAgICB2YXIga2V5RGl2PSAkKFwiPGxhYmVsIHN0eWxlPSdkaXNwbGF5OmJsb2NrO3BhZGRpbmc6LjFlbSc+XCIraW5kK1wiPC9sYWJlbD5cIilcclxuICAgICAgICBwYXJlbnREb20uYXBwZW5kKGtleURpdilcclxuICAgIH1cclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5maWxsVmlzdWFsaXphdGlvbj1mdW5jdGlvbihtb2RlbElELHBhcmVudERvbSl7XHJcbiAgICB2YXIgbW9kZWxKc29uPW1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXTtcclxuICAgIHZhciBhVGFibGU9JChcIjx0YWJsZSBzdHlsZT0nd2lkdGg6MTAwJSc+PC90YWJsZT5cIilcclxuICAgIGFUYWJsZS5odG1sKCc8dHI+PHRkPjwvdGQ+PHRkPjwvdGQ+PC90cj4nKVxyXG4gICAgcGFyZW50RG9tLmFwcGVuZChhVGFibGUpIFxyXG5cclxuICAgIHZhciBsZWZ0UGFydD1hVGFibGUuZmluZChcInRkOmZpcnN0XCIpXHJcbiAgICB2YXIgcmlnaHRQYXJ0PWFUYWJsZS5maW5kKFwidGQ6bnRoLWNoaWxkKDIpXCIpXHJcbiAgICByaWdodFBhcnQuY3NzKHtcIndpZHRoXCI6XCI1MHB4XCIsXCJoZWlnaHRcIjpcIjUwcHhcIixcImJvcmRlclwiOlwic29saWQgMXB4IGxpZ2h0R3JheVwifSlcclxuICAgIFxyXG4gICAgdmFyIGF2YXJ0YUltZz0kKFwiPGltZyBzdHlsZT0naGVpZ2h0OjQ1cHgnPjwvaW1nPlwiKVxyXG4gICAgcmlnaHRQYXJ0LmFwcGVuZChhdmFydGFJbWcpXHJcbiAgICB2YXIgdmlzdWFsSnNvbj1nbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW1wiZGVmYXVsdFwiXVxyXG4gICAgaWYodmlzdWFsSnNvbiAmJiB2aXN1YWxKc29uW21vZGVsSURdICYmIHZpc3VhbEpzb25bbW9kZWxJRF0uYXZhcnRhKSBhdmFydGFJbWcuYXR0cignc3JjJyx2aXN1YWxKc29uW21vZGVsSURdLmF2YXJ0YSlcclxuICAgIHRoaXMuYXZhcnRhSW1nPWF2YXJ0YUltZztcclxuICAgIHRoaXMuYWRkT25lVmlzdWFsaXphdGlvblJvdyhtb2RlbElELGxlZnRQYXJ0KVxyXG5cclxuICAgIGlmKHRoaXMuc2hvd1JlbGF0aW9uVmlzdWFsaXphdGlvblNldHRpbmdzKXtcclxuICAgICAgICBmb3IodmFyIGluZCBpbiBtb2RlbEpzb24udmFsaWRSZWxhdGlvbnNoaXBzKXtcclxuICAgICAgICAgICAgdGhpcy5hZGRPbmVWaXN1YWxpemF0aW9uUm93KG1vZGVsSUQsbGVmdFBhcnQsaW5kKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLmFkZE9uZVZpc3VhbGl6YXRpb25Sb3c9ZnVuY3Rpb24obW9kZWxJRCxwYXJlbnREb20scmVsYXRpbnNoaXBOYW1lKXtcclxuICAgIGlmKHJlbGF0aW5zaGlwTmFtZT09bnVsbCkgdmFyIG5hbWVTdHI9XCLil69cIiAvL3Zpc3VhbCBmb3Igbm9kZVxyXG4gICAgZWxzZSBuYW1lU3RyPVwi4p+cIFwiK3JlbGF0aW5zaGlwTmFtZVxyXG4gICAgdmFyIGNvbnRhaW5lckRpdj0kKFwiPGRpdiBzdHlsZT0ncGFkZGluZy1ib3R0b206OHB4Jz48L2Rpdj5cIilcclxuICAgIHBhcmVudERvbS5hcHBlbmQoY29udGFpbmVyRGl2KVxyXG4gICAgdmFyIGNvbnRlbnRET009JChcIjxsYWJlbCBzdHlsZT0nbWFyZ2luLXJpZ2h0OjEwcHgnPlwiK25hbWVTdHIrXCI8L2xhYmVsPlwiKVxyXG4gICAgY29udGFpbmVyRGl2LmFwcGVuZChjb250ZW50RE9NKVxyXG5cclxuICAgIHZhciBkZWZpbmVkQ29sb3I9bnVsbFxyXG4gICAgdmFyIGRlZmluZWRTaGFwZT1udWxsXHJcbiAgICB2YXIgZGVmaW5lZERpbWVuc2lvblJhdGlvPW51bGxcclxuICAgIHZhciBkZWZpbmVkRWRnZVdpZHRoPW51bGxcclxuICAgIHZhciB2aXN1YWxKc29uPWdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdXHJcbiAgICBpZihyZWxhdGluc2hpcE5hbWU9PW51bGwpe1xyXG4gICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF0gJiYgdmlzdWFsSnNvblttb2RlbElEXS5jb2xvcikgZGVmaW5lZENvbG9yPXZpc3VhbEpzb25bbW9kZWxJRF0uY29sb3JcclxuICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdICYmIHZpc3VhbEpzb25bbW9kZWxJRF0uc2hhcGUpIGRlZmluZWRTaGFwZT12aXN1YWxKc29uW21vZGVsSURdLnNoYXBlXHJcbiAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXSAmJiB2aXN1YWxKc29uW21vZGVsSURdLmRpbWVuc2lvblJhdGlvKSBkZWZpbmVkRGltZW5zaW9uUmF0aW89dmlzdWFsSnNvblttb2RlbElEXS5kaW1lbnNpb25SYXRpb1xyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgaWYgKHZpc3VhbEpzb25bbW9kZWxJRF0gJiYgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl0gJiYgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXSkge1xyXG4gICAgICAgICAgICBpZiAodmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXS5jb2xvcikgZGVmaW5lZENvbG9yID0gdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXS5jb2xvclxyXG4gICAgICAgICAgICBpZiAodmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXS5zaGFwZSkgZGVmaW5lZFNoYXBlID0gdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXS5zaGFwZVxyXG4gICAgICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdLmVkZ2VXaWR0aCkgZGVmaW5lZEVkZ2VXaWR0aD12aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdLmVkZ2VXaWR0aFxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB2YXIgY29sb3JTZWxlY3Rvcj0kKCc8c2VsZWN0IGNsYXNzPVwidzMtYm9yZGVyXCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7d2lkdGg6NzVweFwiPjwvc2VsZWN0PicpXHJcbiAgICBjb250YWluZXJEaXYuYXBwZW5kKGNvbG9yU2VsZWN0b3IpXHJcbiAgICB2YXIgY29sb3JBcnI9W1wiQmxhY2tcIixcIkxpZ2h0R3JheVwiLFwiUmVkXCIsXCJHcmVlblwiLFwiQmx1ZVwiLFwiQmlzcXVlXCIsXCJCcm93blwiLFwiQ29yYWxcIixcIkNyaW1zb25cIixcIkRvZGdlckJsdWVcIixcIkdvbGRcIl1cclxuICAgIGNvbG9yQXJyLmZvckVhY2goKG9uZUNvbG9yQ29kZSk9PntcclxuICAgICAgICB2YXIgYW5PcHRpb249JChcIjxvcHRpb24gdmFsdWU9J1wiK29uZUNvbG9yQ29kZStcIic+XCIrb25lQ29sb3JDb2RlK1wi4panPC9vcHRpb24+XCIpXHJcbiAgICAgICAgY29sb3JTZWxlY3Rvci5hcHBlbmQoYW5PcHRpb24pXHJcbiAgICAgICAgYW5PcHRpb24uY3NzKFwiY29sb3JcIixvbmVDb2xvckNvZGUpXHJcbiAgICB9KVxyXG4gICAgaWYoZGVmaW5lZENvbG9yIT1udWxsKSB7XHJcbiAgICAgICAgY29sb3JTZWxlY3Rvci52YWwoZGVmaW5lZENvbG9yKVxyXG4gICAgICAgIGNvbG9yU2VsZWN0b3IuY3NzKFwiY29sb3JcIixkZWZpbmVkQ29sb3IpXHJcbiAgICB9XHJcbiAgICBjb2xvclNlbGVjdG9yLmNoYW5nZSgoZXZlKT0+e1xyXG4gICAgICAgIHZhciBzZWxlY3RDb2xvckNvZGU9ZXZlLnRhcmdldC52YWx1ZVxyXG4gICAgICAgIGNvbG9yU2VsZWN0b3IuY3NzKFwiY29sb3JcIixzZWxlY3RDb2xvckNvZGUpXHJcbiAgICAgICAgdmFyIHZpc3VhbEpzb249Z2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltcImRlZmF1bHRcIl1cclxuXHJcbiAgICAgICAgaWYoIXZpc3VhbEpzb25bbW9kZWxJRF0pIHZpc3VhbEpzb25bbW9kZWxJRF09e31cclxuICAgICAgICBpZighcmVsYXRpbnNoaXBOYW1lKSB7XHJcbiAgICAgICAgICAgIHZpc3VhbEpzb25bbW9kZWxJRF0uY29sb3I9c2VsZWN0Q29sb3JDb2RlXHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIiwgXCJtb2RlbElEXCI6bW9kZWxJRCxcImNvbG9yXCI6c2VsZWN0Q29sb3JDb2RlIH0pXHJcbiAgICAgICAgICAgIHRoaXMucmVmcmVzaE1vZGVsVHJlZUxhYmVsKClcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgaWYoIXZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdKSB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXT17fVxyXG4gICAgICAgICAgICBpZighdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXSkgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXT17fVxyXG4gICAgICAgICAgICB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdLmNvbG9yPXNlbGVjdENvbG9yQ29kZVxyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJ2aXN1YWxEZWZpbml0aW9uQ2hhbmdlXCIsIFwic3JjTW9kZWxJRFwiOm1vZGVsSUQsXCJyZWxhdGlvbnNoaXBOYW1lXCI6cmVsYXRpbnNoaXBOYW1lLFwiY29sb3JcIjpzZWxlY3RDb2xvckNvZGUgfSlcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zYXZlVmlzdWFsRGVmaW5pdGlvbigpXHJcbiAgICB9KVxyXG4gICAgdmFyIHNoYXBlU2VsZWN0b3IgPSAkKCc8c2VsZWN0IGNsYXNzPVwidzMtYm9yZGVyXCIgc3R5bGU9XCJvdXRsaW5lOm5vbmVcIj48L3NlbGVjdD4nKVxyXG4gICAgY29udGFpbmVyRGl2LmFwcGVuZChzaGFwZVNlbGVjdG9yKVxyXG4gICAgaWYocmVsYXRpbnNoaXBOYW1lPT1udWxsKXtcclxuICAgICAgICBzaGFwZVNlbGVjdG9yLmFwcGVuZCgkKFwiPG9wdGlvbiB2YWx1ZT0nZWxsaXBzZSc+4pevPC9vcHRpb24+XCIpKVxyXG4gICAgICAgIHNoYXBlU2VsZWN0b3IuYXBwZW5kKCQoXCI8b3B0aW9uIHZhbHVlPSdyb3VuZC1yZWN0YW5nbGUnIHN0eWxlPSdmb250LXNpemU6MTIwJSc+4paiPC9vcHRpb24+XCIpKVxyXG4gICAgICAgIHNoYXBlU2VsZWN0b3IuYXBwZW5kKCQoXCI8b3B0aW9uIHZhbHVlPSdoZXhhZ29uJyBzdHlsZT0nZm9udC1zaXplOjEzMCUnPuKsoTwvb3B0aW9uPlwiKSlcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHNoYXBlU2VsZWN0b3IuYXBwZW5kKCQoXCI8b3B0aW9uIHZhbHVlPSdzb2xpZCc+4oaSPC9vcHRpb24+XCIpKVxyXG4gICAgICAgIHNoYXBlU2VsZWN0b3IuYXBwZW5kKCQoXCI8b3B0aW9uIHZhbHVlPSdkb3R0ZWQnPuKHojwvb3B0aW9uPlwiKSlcclxuICAgIH1cclxuICAgIGlmKGRlZmluZWRTaGFwZSE9bnVsbCkge1xyXG4gICAgICAgIHNoYXBlU2VsZWN0b3IudmFsKGRlZmluZWRTaGFwZSlcclxuICAgIH1cclxuICAgIHNoYXBlU2VsZWN0b3IuY2hhbmdlKChldmUpPT57XHJcbiAgICAgICAgdmFyIHNlbGVjdFNoYXBlPWV2ZS50YXJnZXQudmFsdWVcclxuICAgICAgICB2YXIgdmlzdWFsSnNvbiA9IGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdXHJcblxyXG4gICAgICAgIGlmKCF2aXN1YWxKc29uW21vZGVsSURdKSB2aXN1YWxKc29uW21vZGVsSURdPXt9XHJcbiAgICAgICAgaWYoIXJlbGF0aW5zaGlwTmFtZSkge1xyXG4gICAgICAgICAgICB2aXN1YWxKc29uW21vZGVsSURdLnNoYXBlPXNlbGVjdFNoYXBlXHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIiwgXCJtb2RlbElEXCI6bW9kZWxJRCxcInNoYXBlXCI6c2VsZWN0U2hhcGUgfSlcclxuICAgICAgICAgICAgdGhpcy5yZWZyZXNoTW9kZWxUcmVlTGFiZWwoKVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBpZighdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl0pIHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdPXt9XHJcbiAgICAgICAgICAgIGlmKCF2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdKSB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdPXt9XHJcbiAgICAgICAgICAgIHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0uc2hhcGU9c2VsZWN0U2hhcGVcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwidmlzdWFsRGVmaW5pdGlvbkNoYW5nZVwiLCBcInNyY01vZGVsSURcIjptb2RlbElELFwicmVsYXRpb25zaGlwTmFtZVwiOnJlbGF0aW5zaGlwTmFtZSxcInNoYXBlXCI6c2VsZWN0U2hhcGUgfSlcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zYXZlVmlzdWFsRGVmaW5pdGlvbigpXHJcbiAgICB9KVxyXG5cclxuICAgIHZhciBzaXplQWRqdXN0U2VsZWN0b3IgPSAkKCc8c2VsZWN0IGNsYXNzPVwidzMtYm9yZGVyXCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7d2lkdGg6MTEwcHhcIj48L3NlbGVjdD4nKVxyXG4gICAgaWYocmVsYXRpbnNoaXBOYW1lPT1udWxsKXtcclxuICAgICAgICBmb3IodmFyIGY9MC4yO2Y8MjtmKz0wLjIpe1xyXG4gICAgICAgICAgICB2YXIgdmFsPWYudG9GaXhlZCgxKStcIlwiXHJcbiAgICAgICAgICAgIHNpemVBZGp1c3RTZWxlY3Rvci5hcHBlbmQoJChcIjxvcHRpb24gdmFsdWU9XCIrdmFsK1wiPmRpbWVuc2lvbipcIit2YWwrXCI8L29wdGlvbj5cIikpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKGRlZmluZWREaW1lbnNpb25SYXRpbyE9bnVsbCkgc2l6ZUFkanVzdFNlbGVjdG9yLnZhbChkZWZpbmVkRGltZW5zaW9uUmF0aW8pXHJcbiAgICAgICAgZWxzZSBzaXplQWRqdXN0U2VsZWN0b3IudmFsKFwiMS4wXCIpXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICBzaXplQWRqdXN0U2VsZWN0b3IuY3NzKFwid2lkdGhcIixcIjgwcHhcIilcclxuICAgICAgICBmb3IodmFyIGY9MC41O2Y8PTQ7Zis9MC41KXtcclxuICAgICAgICAgICAgdmFyIHZhbD1mLnRvRml4ZWQoMSkrXCJcIlxyXG4gICAgICAgICAgICBzaXplQWRqdXN0U2VsZWN0b3IuYXBwZW5kKCQoXCI8b3B0aW9uIHZhbHVlPVwiK3ZhbCtcIj53aWR0aCAqXCIrdmFsK1wiPC9vcHRpb24+XCIpKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZihkZWZpbmVkRWRnZVdpZHRoIT1udWxsKSBzaXplQWRqdXN0U2VsZWN0b3IudmFsKGRlZmluZWRFZGdlV2lkdGgpXHJcbiAgICAgICAgZWxzZSBzaXplQWRqdXN0U2VsZWN0b3IudmFsKFwiMi4wXCIpXHJcbiAgICB9XHJcbiAgICBjb250YWluZXJEaXYuYXBwZW5kKHNpemVBZGp1c3RTZWxlY3RvcilcclxuXHJcbiAgICBcclxuICAgIHNpemVBZGp1c3RTZWxlY3Rvci5jaGFuZ2UoKGV2ZSk9PntcclxuICAgICAgICB2YXIgY2hvb3NlVmFsPWV2ZS50YXJnZXQudmFsdWVcclxuICAgICAgICB2YXIgdmlzdWFsSnNvbiA9IGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdXHJcblxyXG4gICAgICAgIGlmKCFyZWxhdGluc2hpcE5hbWUpIHtcclxuICAgICAgICAgICAgaWYoIXZpc3VhbEpzb25bbW9kZWxJRF0pIHZpc3VhbEpzb25bbW9kZWxJRF09e31cclxuICAgICAgICAgICAgdmlzdWFsSnNvblttb2RlbElEXS5kaW1lbnNpb25SYXRpbz1jaG9vc2VWYWxcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwidmlzdWFsRGVmaW5pdGlvbkNoYW5nZVwiLCBcIm1vZGVsSURcIjptb2RlbElELFwiZGltZW5zaW9uUmF0aW9cIjpjaG9vc2VWYWwgfSlcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgaWYoIXZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdKSB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXT17fVxyXG4gICAgICAgICAgICBpZighdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXSkgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXT17fVxyXG4gICAgICAgICAgICB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdLmVkZ2VXaWR0aD1jaG9vc2VWYWxcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwidmlzdWFsRGVmaW5pdGlvbkNoYW5nZVwiLCBcInNyY01vZGVsSURcIjptb2RlbElELFwicmVsYXRpb25zaGlwTmFtZVwiOnJlbGF0aW5zaGlwTmFtZSxcImVkZ2VXaWR0aFwiOmNob29zZVZhbCB9KVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnNhdmVWaXN1YWxEZWZpbml0aW9uKClcclxuICAgIH0pXHJcbiAgICBcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5zYXZlVmlzdWFsRGVmaW5pdGlvbj1hc3luYyBmdW5jdGlvbigpe1xyXG4gICAgdHJ5e1xyXG4gICAgICAgIGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL3NhdmVWaXN1YWxEZWZpbml0aW9uXCIsIFwiUE9TVFwiLCB7XCJ2aXN1YWxEZWZpbml0aW9uSnNvblwiOkpTT04uc3RyaW5naWZ5KGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdKX0pXHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuZmlsbFJlbGF0aW9uc2hpcEluZm89ZnVuY3Rpb24odmFsaWRSZWxhdGlvbnNoaXBzLHBhcmVudERvbSl7XHJcbiAgICBmb3IodmFyIGluZCBpbiB2YWxpZFJlbGF0aW9uc2hpcHMpe1xyXG4gICAgICAgIHZhciBrZXlEaXY9ICQoXCI8bGFiZWwgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO3BhZGRpbmc6LjFlbSAuM2VtIC4xZW0gLjNlbTttYXJnaW4tcmlnaHQ6LjNlbSc+XCIraW5kK1wiPC9sYWJlbD5cIilcclxuICAgICAgICBwYXJlbnREb20uYXBwZW5kKGtleURpdilcclxuICAgICAgICBrZXlEaXYuY3NzKFwicGFkZGluZy10b3BcIixcIi4xZW1cIilcclxuICAgICAgICB2YXIgbGFiZWw9JChcIjxsYWJlbCBzdHlsZT0nZGlzcGxheTppbmxpbmU7YmFja2dyb3VuZC1jb2xvcjp5ZWxsb3dncmVlbjtjb2xvcjp3aGl0ZTtmb250LXNpemU6OXB4O3BhZGRpbmc6MnB4Jz48L2xhYmVsPlwiKVxyXG4gICAgICAgIGxhYmVsLnRleHQoXCJSZWxhdGlvbnNoaXBcIilcclxuICAgICAgICBwYXJlbnREb20uYXBwZW5kKGxhYmVsKVxyXG4gICAgICAgIGlmKHZhbGlkUmVsYXRpb25zaGlwc1tpbmRdLnRhcmdldCl7XHJcbiAgICAgICAgICAgIHZhciBsYWJlbDE9JChcIjxsYWJlbCBzdHlsZT0nZGlzcGxheTppbmxpbmU7YmFja2dyb3VuZC1jb2xvcjp5ZWxsb3dncmVlbjtjb2xvcjp3aGl0ZTtmb250LXNpemU6OXB4O3BhZGRpbmc6MnB4O21hcmdpbi1sZWZ0OjJweCc+PC9sYWJlbD5cIilcclxuICAgICAgICAgICAgbGFiZWwxLnRleHQodmFsaWRSZWxhdGlvbnNoaXBzW2luZF0udGFyZ2V0KVxyXG4gICAgICAgICAgICBwYXJlbnREb20uYXBwZW5kKGxhYmVsMSlcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGNvbnRlbnRET009JChcIjxsYWJlbD48L2xhYmVsPlwiKVxyXG4gICAgICAgIGNvbnRlbnRET00uY3NzKFwiZGlzcGxheVwiLFwiYmxvY2tcIilcclxuICAgICAgICBjb250ZW50RE9NLmNzcyhcInBhZGRpbmctbGVmdFwiLFwiMWVtXCIpXHJcbiAgICAgICAgcGFyZW50RG9tLmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgICAgIHRoaXMuZmlsbEVkaXRhYmxlUHJvcGVydGllcyh2YWxpZFJlbGF0aW9uc2hpcHNbaW5kXS5lZGl0YWJsZVJlbGF0aW9uc2hpcFByb3BlcnRpZXMsIGNvbnRlbnRET00pXHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuZmlsbEVkaXRhYmxlUHJvcGVydGllcz1mdW5jdGlvbihqc29uSW5mbyxwYXJlbnREb20pe1xyXG4gICAgZm9yKHZhciBpbmQgaW4ganNvbkluZm8pe1xyXG4gICAgICAgIHZhciBrZXlEaXY9ICQoXCI8bGFiZWwgc3R5bGU9J2Rpc3BsYXk6YmxvY2snPjxkaXYgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO3BhZGRpbmc6LjFlbSAuM2VtIC4xZW0gLjNlbTttYXJnaW4tcmlnaHQ6LjNlbSc+XCIraW5kK1wiPC9kaXY+PC9sYWJlbD5cIilcclxuICAgICAgICBwYXJlbnREb20uYXBwZW5kKGtleURpdilcclxuICAgICAgICBrZXlEaXYuY3NzKFwicGFkZGluZy10b3BcIixcIi4xZW1cIilcclxuXHJcbiAgICAgICAgaWYoQXJyYXkuaXNBcnJheShqc29uSW5mb1tpbmRdKSl7XHJcbiAgICAgICAgICAgIHZhciBjb250ZW50RE9NPSQoXCI8bGFiZWw+PC9sYWJlbD5cIilcclxuICAgICAgICAgICAgY29udGVudERPTS50ZXh0KFwiZW51bVwiKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLmNzcyh7XCJiYWNrZ3JvdW5kLWNvbG9yXCI6XCJkYXJrR3JheVwiLFwiY29sb3JcIjpcIndoaXRlXCIsXCJmb250U2l6ZVwiOlwiOXB4XCIsXCJwYWRkaW5nXCI6JzJweCd9KVxyXG4gICAgICAgICAgICBrZXlEaXYuYXBwZW5kKGNvbnRlbnRET00pXHJcblxyXG4gICAgICAgICAgICB2YXIgdmFsdWVBcnI9W11cclxuICAgICAgICAgICAganNvbkluZm9baW5kXS5mb3JFYWNoKGVsZT0+e3ZhbHVlQXJyLnB1c2goZWxlLmVudW1WYWx1ZSl9KVxyXG4gICAgICAgICAgICB2YXIgbGFiZWwxPSQoXCI8bGFiZWw+PC9sYWJlbD5cIilcclxuICAgICAgICAgICAgbGFiZWwxLmNzcyh7XCJiYWNrZ3JvdW5kLWNvbG9yXCI6XCJkYXJrR3JheVwiLFwiY29sb3JcIjpcIndoaXRlXCIsXCJmb250U2l6ZVwiOlwiOXB4XCIsXCJwYWRkaW5nXCI6JzJweCcsXCJtYXJnaW4tbGVmdFwiOlwiMnB4XCJ9KVxyXG4gICAgICAgICAgICBsYWJlbDEudGV4dCh2YWx1ZUFyci5qb2luKCkpXHJcbiAgICAgICAgICAgIGtleURpdi5hcHBlbmQobGFiZWwxKVxyXG4gICAgICAgIH1lbHNlIGlmKHR5cGVvZihqc29uSW5mb1tpbmRdKT09PVwib2JqZWN0XCIpIHtcclxuICAgICAgICAgICAgdmFyIGNvbnRlbnRET009JChcIjxsYWJlbD48L2xhYmVsPlwiKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLmNzcyhcImRpc3BsYXlcIixcImJsb2NrXCIpXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwicGFkZGluZy1sZWZ0XCIsXCIxZW1cIilcclxuICAgICAgICAgICAgdGhpcy5maWxsRWRpdGFibGVQcm9wZXJ0aWVzKGpzb25JbmZvW2luZF0sY29udGVudERPTSlcclxuICAgICAgICAgICAga2V5RGl2LmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgICAgIH1lbHNlIHtcclxuICAgICAgICAgICAgdmFyIGNvbnRlbnRET009JChcIjxsYWJlbD48L2xhYmVsPlwiKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLnRleHQoanNvbkluZm9baW5kXSlcclxuICAgICAgICAgICAgY29udGVudERPTS5jc3Moe1wiYmFja2dyb3VuZC1jb2xvclwiOlwiZGFya0dyYXlcIixcImNvbG9yXCI6XCJ3aGl0ZVwiLFwiZm9udFNpemVcIjpcIjlweFwiLFwicGFkZGluZ1wiOicycHgnfSlcclxuICAgICAgICAgICAga2V5RGl2LmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuYWRkQVBhcnRJblJpZ2h0U3Bhbj1mdW5jdGlvbihwYXJ0TmFtZSl7XHJcbiAgICB2YXIgaGVhZGVyRE9NPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYmxvY2sgdzMtbGlnaHQtZ3JleSB3My1sZWZ0LWFsaWduXCIgc3R5bGU9XCJmb250LXdlaWdodDpib2xkXCI+PC9idXR0b24+JylcclxuICAgIGhlYWRlckRPTS50ZXh0KHBhcnROYW1lKVxyXG4gICAgdmFyIGxpc3RET009JCgnPGRpdiBjbGFzcz1cInczLWNvbnRhaW5lciB3My1oaWRlIHczLWJvcmRlciB3My1zaG93XCIgc3R5bGU9XCJiYWNrZ3JvdW5kLWNvbG9yOndoaXRlXCI+PC9kaXY+JylcclxuICAgIHRoaXMucGFuZWxDYXJkLmFwcGVuZChoZWFkZXJET00sbGlzdERPTSlcclxuXHJcbiAgICBoZWFkZXJET00ub24oXCJjbGlja1wiLChldnQpPT4ge1xyXG4gICAgICAgIGlmKGxpc3RET00uaGFzQ2xhc3MoXCJ3My1zaG93XCIpKSBsaXN0RE9NLnJlbW92ZUNsYXNzKFwidzMtc2hvd1wiKVxyXG4gICAgICAgIGVsc2UgbGlzdERPTS5hZGRDbGFzcyhcInczLXNob3dcIilcclxuIFxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICByZXR1cm4gbGlzdERPTTtcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5yZWFkTW9kZWxGaWxlc0NvbnRlbnRBbmRJbXBvcnQ9YXN5bmMgZnVuY3Rpb24oZmlsZXMpe1xyXG4gICAgLy8gZmlsZXMgaXMgYSBGaWxlTGlzdCBvZiBGaWxlIG9iamVjdHMuIExpc3Qgc29tZSBwcm9wZXJ0aWVzLlxyXG4gICAgdmFyIGZpbGVDb250ZW50QXJyPVtdXHJcbiAgICBmb3IgKHZhciBpID0gMCwgZjsgZiA9IGZpbGVzW2ldOyBpKyspIHtcclxuICAgICAgICAvLyBPbmx5IHByb2Nlc3MganNvbiBmaWxlcy5cclxuICAgICAgICBpZiAoZi50eXBlIT1cImFwcGxpY2F0aW9uL2pzb25cIikgY29udGludWU7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICB2YXIgc3RyPSBhd2FpdCB0aGlzLnJlYWRPbmVGaWxlKGYpXHJcbiAgICAgICAgICAgIHZhciBvYmo9SlNPTi5wYXJzZShzdHIpXHJcbiAgICAgICAgICAgIGlmKEFycmF5LmlzQXJyYXkob2JqKSkgZmlsZUNvbnRlbnRBcnI9ZmlsZUNvbnRlbnRBcnIuY29uY2F0KG9iailcclxuICAgICAgICAgICAgZWxzZSBmaWxlQ29udGVudEFyci5wdXNoKG9iailcclxuICAgICAgICB9Y2F0Y2goZXJyKXtcclxuICAgICAgICAgICAgYWxlcnQoZXJyKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmKGZpbGVDb250ZW50QXJyLmxlbmd0aD09MCkgcmV0dXJuO1xyXG4gICAgdHJ5IHtcclxuICAgICAgICB2YXIgcmVzcG9uc2UgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9pbXBvcnRNb2RlbHNcIiwgXCJQT1NUXCIsIHtcIm1vZGVsc1wiOkpTT04uc3RyaW5naWZ5KGZpbGVDb250ZW50QXJyKX0pXHJcbiAgICAgICAgdGhpcy5saXN0TW9kZWxzKFwic2hvdWxkQnJvYWRDYXN0XCIpXHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICB9ICBcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5yZWFkT25lRmlsZT0gYXN5bmMgZnVuY3Rpb24oYUZpbGUpe1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xyXG4gICAgICAgICAgICByZWFkZXIub25sb2FkID0gKCk9PiB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlYWRlci5yZXN1bHQpXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHJlYWRlci5yZWFkQXNUZXh0KGFGaWxlKTtcclxuICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIHJlamVjdChlKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1cclxuXHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLmxpc3RNb2RlbHM9YXN5bmMgZnVuY3Rpb24oc2hvdWxkQnJvYWRjYXN0KXtcclxuICAgIHRoaXMubW9kZWxMaXN0LmVtcHR5KClcclxuICAgIGF3YWl0IGdsb2JhbENhY2hlLmxvYWRVc2VyRGF0YSgpXHJcblxyXG4gICAgaWYoalF1ZXJ5LmlzRW1wdHlPYmplY3QobW9kZWxBbmFseXplci5EVERMTW9kZWxzKSl7XHJcbiAgICAgICAgdmFyIHplcm9Nb2RlbEl0ZW09JCgnPGxpIHN0eWxlPVwiZm9udC1zaXplOjAuOWVtXCI+emVybyBtb2RlbCByZWNvcmQuIFBsZWFzZSBpbXBvcnQuLi48L2xpPicpXHJcbiAgICAgICAgdGhpcy5tb2RlbExpc3QuYXBwZW5kKHplcm9Nb2RlbEl0ZW0pXHJcbiAgICAgICAgemVyb01vZGVsSXRlbS5jc3MoXCJjdXJzb3JcIixcImRlZmF1bHRcIilcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHRoaXMudHJlZSA9IG5ldyBzaW1wbGVUcmVlKHRoaXMubW9kZWxMaXN0LCB7XHJcbiAgICAgICAgICAgIFwibGVhZk5hbWVQcm9wZXJ0eVwiOiBcImRpc3BsYXlOYW1lXCJcclxuICAgICAgICAgICAgLCBcIm5vTXVsdGlwbGVTZWxlY3RBbGxvd2VkXCI6IHRydWUsIFwiaGlkZUVtcHR5R3JvdXBcIjogdHJ1ZVxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIHRoaXMudHJlZS5vcHRpb25zLmxlYWZOb2RlSWNvbkZ1bmMgPSAobG4pID0+IHtcclxuICAgICAgICAgICAgdmFyIG1vZGVsQ2xhc3MgPSBsbi5sZWFmSW5mb1tcIkBpZFwiXVxyXG4gICAgICAgICAgICB2YXIgY29sb3JDb2RlID0gXCJncmF5XCJcclxuICAgICAgICAgICAgdmFyIHNoYXBlID0gXCJlbGxpcHNlXCJcclxuICAgICAgICAgICAgdmFyIGF2YXRhciA9IG51bGxcclxuICAgICAgICAgICAgaWYgKGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdW21vZGVsQ2xhc3NdKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdmlzdWFsSnNvbiA9IGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdW21vZGVsQ2xhc3NdXHJcbiAgICAgICAgICAgICAgICB2YXIgY29sb3JDb2RlID0gdmlzdWFsSnNvbi5jb2xvciB8fCBcImdyYXlcIlxyXG4gICAgICAgICAgICAgICAgdmFyIHNoYXBlID0gdmlzdWFsSnNvbi5zaGFwZSB8fCBcImVsbGlwc2VcIlxyXG4gICAgICAgICAgICAgICAgdmFyIGF2YXJ0YSA9IHZpc3VhbEpzb24uYXZhcnRhXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIGZvbnRzaXplID0geyBcImVsbGlwc2VcIjogXCJmb250LXNpemU6MTMwJVwiLCBcInJvdW5kLXJlY3RhbmdsZVwiOiBcImZvbnQtc2l6ZTo2MCU7cGFkZGluZy1sZWZ0OjJweFwiLCBcImhleGFnb25cIjogXCJmb250LXNpemU6OTAlXCIgfVtzaGFwZV1cclxuICAgICAgICAgICAgc2hhcGUgPSB7IFwiZWxsaXBzZVwiOiBcIuKXj1wiLCBcInJvdW5kLXJlY3RhbmdsZVwiOiBcIuKWiVwiLCBcImhleGFnb25cIjogXCLirKJcIiB9W3NoYXBlXVxyXG5cclxuICAgICAgICAgICAgdmFyIGxibEhUTUwgPSBcIjxsYWJlbCBzdHlsZT0nZGlzcGxheTppbmxpbmU7Y29sb3I6XCIgKyBjb2xvckNvZGUgKyBcIjtcIiArIGZvbnRzaXplICsgXCI7Zm9udC13ZWlnaHQ6bm9ybWFsO3ZlcnRpY2FsLWFsaWduOm1pZGRsZTtib3JkZXItcmFkaXVzOiAycHg7Jz5cIiArIHNoYXBlICsgXCI8L2xhYmVsPlwiXHJcblxyXG4gICAgICAgICAgICBpZiAoYXZhcnRhKSBsYmxIVE1MICs9IFwiPGltZyBzcmM9J1wiICsgYXZhcnRhICsgXCInIHN0eWxlPSdoZWlnaHQ6MjBweCcvPlwiXHJcblxyXG4gICAgICAgICAgICByZXR1cm4gJChsYmxIVE1MKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy50cmVlLmNhbGxiYWNrX2FmdGVyU2VsZWN0Tm9kZXMgPSAobm9kZXNBcnIsIG1vdXNlQ2xpY2tEZXRhaWwpID0+IHtcclxuICAgICAgICAgICAgdmFyIHRoZU5vZGUgPSBub2Rlc0FyclswXVxyXG4gICAgICAgICAgICB0aGlzLmZpbGxSaWdodFNwYW4odGhlTm9kZS5sZWFmSW5mb1tcIkBpZFwiXSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBncm91cE5hbWVMaXN0ID0ge31cclxuICAgICAgICBmb3IgKHZhciBtb2RlbElEIGluIG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVscykgZ3JvdXBOYW1lTGlzdFt0aGlzLm1vZGVsTmFtZVRvR3JvdXBOYW1lKG1vZGVsSUQpXSA9IDFcclxuICAgICAgICB2YXIgbW9kZWxncm91cFNvcnRBcnIgPSBPYmplY3Qua2V5cyhncm91cE5hbWVMaXN0KVxyXG4gICAgICAgIG1vZGVsZ3JvdXBTb3J0QXJyLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEudG9Mb3dlckNhc2UoKS5sb2NhbGVDb21wYXJlKGIudG9Mb3dlckNhc2UoKSkgfSk7XHJcbiAgICAgICAgbW9kZWxncm91cFNvcnRBcnIuZm9yRWFjaChvbmVHcm91cE5hbWUgPT4ge1xyXG4gICAgICAgICAgICB2YXIgZ249dGhpcy50cmVlLmFkZEdyb3VwTm9kZSh7IGRpc3BsYXlOYW1lOiBvbmVHcm91cE5hbWUgfSlcclxuICAgICAgICAgICAgZ24uZXhwYW5kKClcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICBmb3IgKHZhciBtb2RlbElEIGluIG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVscykge1xyXG4gICAgICAgICAgICB2YXIgZ24gPSB0aGlzLm1vZGVsTmFtZVRvR3JvdXBOYW1lKG1vZGVsSUQpXHJcbiAgICAgICAgICAgIHRoaXMudHJlZS5hZGRMZWFmbm9kZVRvR3JvdXAoZ24sIEpTT04ucGFyc2UobW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdW1wib3JpZ2luYWxcIl0pKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy50cmVlLnNvcnRBbGxMZWF2ZXMoKVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBpZihzaG91bGRCcm9hZGNhc3QpIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcIkFEVE1vZGVsc0NoYW5nZVwifSlcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5tb2RlbE5hbWVUb0dyb3VwTmFtZT1mdW5jdGlvbihtb2RlbE5hbWUpe1xyXG4gICAgdmFyIG5hbWVQYXJ0cz1tb2RlbE5hbWUuc3BsaXQoXCI6XCIpXHJcbiAgICBpZihuYW1lUGFydHMubGVuZ3RoPj0yKSAgcmV0dXJuIG5hbWVQYXJ0c1sxXVxyXG4gICAgZWxzZSByZXR1cm4gXCJPdGhlcnNcIlxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLnJ4TWVzc2FnZT1mdW5jdGlvbihtc2dQYXlsb2FkKXtcclxuICAgIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJBRFRNb2RlbEVkaXRlZFwiKSB0aGlzLmxpc3RNb2RlbHMoXCJzaG91bGRCcm9hZGNhc3RcIilcclxufVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IG1vZGVsTWFuYWdlckRpYWxvZygpOyIsImZ1bmN0aW9uIG1vZHVsZVN3aXRjaERpYWxvZygpe1xyXG4gICAgdGhpcy5tb2R1bGVzU2lkZWJhcj0kKCc8ZGl2IGNsYXNzPVwidzMtc2lkZWJhciB3My1iYXItYmxvY2sgdzMtd2hpdGUgdzMtYW5pbWF0ZS1sZWZ0IHczLWNhcmQtNFwiIHN0eWxlPVwiZGlzcGxheTpub25lO2hlaWdodDoxNjBweDt3aWR0aDoyNDBweDtvdmVyZmxvdzpoaWRkZW5cIj48ZGl2IHN0eWxlPVwiaGVpZ2h0OjQwcHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWxlZnQgdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cImZvbnQtc2l6ZToyZW07cGFkZGluZy10b3A6NHB4O3dpZHRoOjU1cHhcIj7imLA8L2J1dHRvbj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cImZvbnQtc2l6ZToxLjVlbTt3aWR0aDo3MHB4O2Zsb2F0OmxlZnQ7Y3Vyc29yOmRlZmF1bHRcIj5PcGVuPC9kaXY+PC9kaXY+PGEgaHJlZj1cIiNcIiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1tZWRpdW1cIj48aW1nIHNyYz1cImZhdmljb25pb3RodWIuaWNvXCIgc3R5bGU9XCJ3aWR0aDoyNXB4O21hcmdpbi1yaWdodDoxMHB4XCI+PC9pbWc+RGV2aWNlIE1hbmFnZW1lbnQ8L2E+PGEgaHJlZj1cIiNcIiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1tZWRpdW1cIj48aW1nIHNyYz1cImZhdmljb25kaWdpdGFsdHdpbi5pY29cIiBzdHlsZT1cIndpZHRoOjI1cHg7bWFyZ2luLXJpZ2h0OjEwcHhcIj48L2ltZz5EaWdpdGFsIFR3aW48L2E+PGEgaHJlZj1cIiNcIiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1tZWRpdW1cIj48aW1nIHNyYz1cImZhdmljb25ldmVudGxvZy5pY29cIiBzdHlsZT1cIndpZHRoOjI1cHg7bWFyZ2luLXJpZ2h0OjEwcHhcIj48L2ltZz5FdmVudCBMb2c8L2E+PC9kaXY+JylcclxuICAgIFxyXG4gICAgdGhpcy5tb2R1bGVzU3dpdGNoQnV0dG9uPSQoJzxhIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uXCIgaHJlZj1cIiNcIj7imLA8L2E+JylcclxuICAgIFxyXG4gICAgdGhpcy5tb2R1bGVzU3dpdGNoQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+eyB0aGlzLm1vZHVsZXNTaWRlYmFyLmNzcyhcImRpc3BsYXlcIixcImJsb2NrXCIpIH0pXHJcbiAgICB0aGlzLm1vZHVsZXNTaWRlYmFyLmNoaWxkcmVuKCc6Zmlyc3QnKS5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLm1vZHVsZXNTaWRlYmFyLmNzcyhcImRpc3BsYXlcIixcIm5vbmVcIil9KVxyXG4gICAgXHJcbiAgICB2YXIgYWxsTW9kZXVscz10aGlzLm1vZHVsZXNTaWRlYmFyLmNoaWxkcmVuKFwiYVwiKVxyXG4gICAgJChhbGxNb2RldWxzWzBdKS5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICB3aW5kb3cub3BlbihcImRldmljZW1hbmFnZW1lbnQuaHRtbFwiLCBcIl9ibGFua1wiKVxyXG4gICAgICAgIHRoaXMubW9kdWxlc1NpZGViYXIuY3NzKFwiZGlzcGxheVwiLFwibm9uZVwiKVxyXG4gICAgfSlcclxuICAgICQoYWxsTW9kZXVsc1sxXSkub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgd2luZG93Lm9wZW4oXCJkaWdpdGFsdHdpbm1vZHVsZS5odG1sXCIsIFwiX2JsYW5rXCIpXHJcbiAgICAgICAgdGhpcy5tb2R1bGVzU2lkZWJhci5jc3MoXCJkaXNwbGF5XCIsXCJub25lXCIpXHJcbiAgICB9KVxyXG4gICAgJChhbGxNb2RldWxzWzJdKS5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICB3aW5kb3cub3BlbihcImV2ZW50bG9nbW9kdWxlLmh0bWxcIiwgXCJfYmxhbmtcIilcclxuICAgICAgICB0aGlzLm1vZHVsZXNTaWRlYmFyLmNzcyhcImRpc3BsYXlcIixcIm5vbmVcIilcclxuICAgIH0pXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IG1vZHVsZVN3aXRjaERpYWxvZygpOyIsImZ1bmN0aW9uIHNpbXBsZUNvbmZpcm1EaWFsb2coKXtcclxuICAgIHRoaXMuRE9NID0gJCgnPGRpdiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7YmFja2dyb3VuZC1jb2xvcjp3aGl0ZTtsZWZ0OjUwJTt0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSkgdHJhbnNsYXRlWSgtNTAlKTt6LWluZGV4OjEwMlwiIGNsYXNzPVwidzMtY2FyZC00XCI+PC9kaXY+JylcclxuICAgIC8vdGhpcy5ET00uY3NzKFwib3ZlcmZsb3dcIixcImhpZGRlblwiKVxyXG59XHJcblxyXG5zaW1wbGVDb25maXJtRGlhbG9nLnByb3RvdHlwZS5zaG93PWZ1bmN0aW9uKGNzc09wdGlvbnMsb3RoZXJPcHRpb25zKXtcclxuICAgIHRoaXMuRE9NLmNzcyhjc3NPcHRpb25zKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6NDBweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiZm9udC1zaXplOjEuMmVtXCI+JyArIG90aGVyT3B0aW9ucy50aXRsZSArICc8L2Rpdj48L2Rpdj4nKSlcclxuICAgIHZhciBjbG9zZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmlnaHRcIiBzdHlsZT1cImZvbnQtc2l6ZToyZW07cGFkZGluZy10b3A6NHB4XCI+w5c8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5ET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZChjbG9zZUJ1dHRvbilcclxuICAgIGNsb3NlQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLmNsb3NlKCkgfSlcclxuXHJcbiAgICB2YXIgZGlhbG9nRGl2PSQoJzxkaXYgY2xhc3M9XCJ3My1jb250YWluZXJcIiBzdHlsZT1cIm1hcmdpbi10b3A6MTBweDttYXJnaW4tYm90dG9tOjEwcHhcIj48L2Rpdj4nKVxyXG4gICAgZGlhbG9nRGl2LnRleHQob3RoZXJPcHRpb25zLmNvbnRlbnQpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQoZGlhbG9nRGl2KVxyXG4gICAgdGhpcy5kaWFsb2dEaXY9ZGlhbG9nRGl2XHJcblxyXG4gICAgdGhpcy5ib3R0b21CYXI9JCgnPGRpdiBjbGFzcz1cInczLWJhclwiPjwvZGl2PicpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQodGhpcy5ib3R0b21CYXIpXHJcblxyXG4gICAgb3RoZXJPcHRpb25zLmJ1dHRvbnMuZm9yRWFjaChidG49PntcclxuICAgICAgICB2YXIgYUJ1dHRvbj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLXJpZ2h0ICcrKGJ0bi5jb2xvckNsYXNzfHxcIlwiKSsnXCIgc3R5bGU9XCJtYXJnaW4tcmlnaHQ6MnB4O21hcmdpbi1sZWZ0OjJweFwiPicrYnRuLnRleHQrJzwvYnV0dG9uPicpXHJcbiAgICAgICAgYUJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PiB7IGJ0bi5jbGlja0Z1bmMoKSAgfSAgKVxyXG4gICAgICAgIHRoaXMuYm90dG9tQmFyLmFwcGVuZChhQnV0dG9uKSAgICBcclxuICAgIH0pXHJcbiAgICAkKFwiYm9keVwiKS5hcHBlbmQodGhpcy5ET00pXHJcbn1cclxuXHJcbnNpbXBsZUNvbmZpcm1EaWFsb2cucHJvdG90eXBlLmNsb3NlPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLkRPTS5yZW1vdmUoKVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHNpbXBsZUNvbmZpcm1EaWFsb2c7IiwiZnVuY3Rpb24gc2ltcGxlU2VsZWN0TWVudShidXR0b25OYW1lLG9wdGlvbnMpe1xyXG4gICAgb3B0aW9ucz1vcHRpb25zfHx7fSAvL3tpc0NsaWNrYWJsZToxLHdpdGhCb3JkZXI6MSxmb250U2l6ZTpcIlwiLGNvbG9yQ2xhc3M6XCJcIixidXR0b25DU1M6XCJcIn1cclxuICAgIGlmKG9wdGlvbnMuaXNDbGlja2FibGUpe1xyXG4gICAgICAgIHRoaXMuaXNDbGlja2FibGU9dHJ1ZVxyXG4gICAgICAgIHRoaXMuRE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1kcm9wZG93bi1jbGlja1wiPjwvZGl2PicpXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB0aGlzLkRPTT0kKCc8ZGl2IGNsYXNzPVwidzMtZHJvcGRvd24taG92ZXIgXCI+PC9kaXY+JylcclxuICAgICAgICB0aGlzLkRPTS5vbihcIm1vdXNlb3ZlclwiLChlKT0+e1xyXG4gICAgICAgICAgICB0aGlzLmFkanVzdERyb3BEb3duUG9zaXRpb24oKVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHRoaXMuYnV0dG9uPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b25cIiBzdHlsZT1cIm91dGxpbmU6IG5vbmU7XCI+PGE+JytidXR0b25OYW1lKyc8L2E+PGEgc3R5bGU9XCJmb250LXdlaWdodDpib2xkO3BhZGRpbmctbGVmdDoycHhcIj48L2E+PGkgY2xhc3M9XCJmYSBmYS1jYXJldC1kb3duXCIgc3R5bGU9XCJwYWRkaW5nLWxlZnQ6M3B4XCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICBpZihvcHRpb25zLndpdGhCb3JkZXIpIHRoaXMuYnV0dG9uLmFkZENsYXNzKFwidzMtYm9yZGVyXCIpXHJcbiAgICBpZihvcHRpb25zLmZvbnRTaXplKSB0aGlzLkRPTS5jc3MoXCJmb250LXNpemVcIixvcHRpb25zLmZvbnRTaXplKVxyXG4gICAgaWYob3B0aW9ucy5jb2xvckNsYXNzKSB0aGlzLmJ1dHRvbi5hZGRDbGFzcyhvcHRpb25zLmNvbG9yQ2xhc3MpXHJcbiAgICBpZihvcHRpb25zLndpZHRoKSB0aGlzLmJ1dHRvbi5jc3MoXCJ3aWR0aFwiLG9wdGlvbnMud2lkdGgpXHJcbiAgICBpZihvcHRpb25zLmJ1dHRvbkNTUykgdGhpcy5idXR0b24uY3NzKG9wdGlvbnMuYnV0dG9uQ1NTKVxyXG4gICAgaWYob3B0aW9ucy5hZGp1c3RQb3NpdGlvbkFuY2hvcikgdGhpcy5hZGp1c3RQb3NpdGlvbkFuY2hvcj1vcHRpb25zLmFkanVzdFBvc2l0aW9uQW5jaG9yXHJcblxyXG4gICAgdGhpcy5vcHRpb25Db250ZW50RE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1kcm9wZG93bi1jb250ZW50IHczLWJhci1ibG9jayB3My1jYXJkLTRcIj48L2Rpdj4nKVxyXG4gICAgaWYob3B0aW9ucy5vcHRpb25MaXN0SGVpZ2h0KSB0aGlzLm9wdGlvbkNvbnRlbnRET00uY3NzKHtoZWlnaHQ6b3B0aW9ucy5vcHRpb25MaXN0SGVpZ2h0K1wicHhcIixcIm92ZXJmbG93LXlcIjpcImF1dG9cIixcIm92ZXJmbG93LXhcIjpcInZpc2libGVcIn0pXHJcbiAgICBpZihvcHRpb25zLm9wdGlvbkxpc3RNYXJnaW5Ub3ApIHRoaXMub3B0aW9uQ29udGVudERPTS5jc3Moe1wibWFyZ2luLXRvcFwiOm9wdGlvbnMub3B0aW9uTGlzdE1hcmdpblRvcCtcInB4XCJ9KVxyXG4gICAgaWYob3B0aW9ucy5vcHRpb25MaXN0TWFyZ2luTGVmdCkgdGhpcy5vcHRpb25Db250ZW50RE9NLmNzcyh7XCJtYXJnaW4tbGVmdFwiOm9wdGlvbnMub3B0aW9uTGlzdE1hcmdpbkxlZnQrXCJweFwifSlcclxuICAgIFxyXG4gICAgdGhpcy5ET00uYXBwZW5kKHRoaXMuYnV0dG9uLHRoaXMub3B0aW9uQ29udGVudERPTSlcclxuICAgIHRoaXMuY3VyU2VsZWN0VmFsPW51bGw7XHJcblxyXG4gICAgaWYob3B0aW9ucy5pc0NsaWNrYWJsZSl7XHJcbiAgICAgICAgdGhpcy5idXR0b24ub24oXCJjbGlja1wiLChlKT0+e1xyXG4gICAgICAgICAgICB0aGlzLmFkanVzdERyb3BEb3duUG9zaXRpb24oKVxyXG4gICAgICAgICAgICBpZih0aGlzLm9wdGlvbkNvbnRlbnRET00uaGFzQ2xhc3MoXCJ3My1zaG93XCIpKSAgdGhpcy5vcHRpb25Db250ZW50RE9NLnJlbW92ZUNsYXNzKFwidzMtc2hvd1wiKVxyXG4gICAgICAgICAgICBlbHNlIHRoaXMub3B0aW9uQ29udGVudERPTS5hZGRDbGFzcyhcInczLXNob3dcIilcclxuICAgICAgICB9KSAgICBcclxuICAgIH1cclxufVxyXG5cclxuc2ltcGxlU2VsZWN0TWVudS5wcm90b3R5cGUuYWRqdXN0RHJvcERvd25Qb3NpdGlvbj1mdW5jdGlvbigpe1xyXG4gICAgaWYoIXRoaXMuYWRqdXN0UG9zaXRpb25BbmNob3IpIHJldHVybjtcclxuICAgIHZhciBvZmZzZXQ9dGhpcy5ET00ub2Zmc2V0KClcclxuICAgIHZhciBuZXdUb3A9b2Zmc2V0LnRvcC10aGlzLmFkanVzdFBvc2l0aW9uQW5jaG9yLnRvcFxyXG4gICAgdmFyIG5ld0xlZnQ9b2Zmc2V0LmxlZnQtdGhpcy5hZGp1c3RQb3NpdGlvbkFuY2hvci5sZWZ0XHJcbiAgICB0aGlzLm9wdGlvbkNvbnRlbnRET00uY3NzKHtcInRvcFwiOm5ld1RvcCtcInB4XCIsXCJsZWZ0XCI6bmV3TGVmdCtcInB4XCJ9KVxyXG59XHJcblxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS5maW5kT3B0aW9uPWZ1bmN0aW9uKG9wdGlvblZhbHVlKXtcclxuICAgIHZhciBvcHRpb25zPXRoaXMub3B0aW9uQ29udGVudERPTS5jaGlsZHJlbigpXHJcbiAgICBmb3IodmFyIGk9MDtpPG9wdGlvbnMubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIGFuT3B0aW9uPSQob3B0aW9uc1tpXSlcclxuICAgICAgICBpZihvcHRpb25WYWx1ZT09YW5PcHRpb24uZGF0YShcIm9wdGlvblZhbHVlXCIpKXtcclxuICAgICAgICAgICAgcmV0dXJuIHtcInRleHRcIjphbk9wdGlvbi50ZXh0KCksXCJ2YWx1ZVwiOmFuT3B0aW9uLmRhdGEoXCJvcHRpb25WYWx1ZVwiKX1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbnNpbXBsZVNlbGVjdE1lbnUucHJvdG90eXBlLmFkZE9wdGlvbkFycj1mdW5jdGlvbihhcnIpe1xyXG4gICAgYXJyLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgdGhpcy5hZGRPcHRpb24oZWxlbWVudClcclxuICAgIH0pO1xyXG59XHJcblxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS5hZGRPcHRpb249ZnVuY3Rpb24ob3B0aW9uVGV4dCxvcHRpb25WYWx1ZSl7XHJcbiAgICB2YXIgb3B0aW9uSXRlbT0kKCc8YSBocmVmPVwiI1wiIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uXCI+JytvcHRpb25UZXh0Kyc8L2E+JylcclxuICAgIHRoaXMub3B0aW9uQ29udGVudERPTS5hcHBlbmQob3B0aW9uSXRlbSlcclxuICAgIG9wdGlvbkl0ZW0uZGF0YShcIm9wdGlvblZhbHVlXCIsb3B0aW9uVmFsdWV8fG9wdGlvblRleHQpXHJcbiAgICBvcHRpb25JdGVtLm9uKCdjbGljaycsKGUpPT57XHJcbiAgICAgICAgdGhpcy5jdXJTZWxlY3RWYWw9b3B0aW9uSXRlbS5kYXRhKFwib3B0aW9uVmFsdWVcIilcclxuICAgICAgICBpZih0aGlzLmlzQ2xpY2thYmxlKXtcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25Db250ZW50RE9NLnJlbW92ZUNsYXNzKFwidzMtc2hvd1wiKVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICB0aGlzLkRPTS5yZW1vdmVDbGFzcygndzMtZHJvcGRvd24taG92ZXInKVxyXG4gICAgICAgICAgICB0aGlzLkRPTS5hZGRDbGFzcygndzMtZHJvcGRvd24tY2xpY2snKVxyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHsgLy90aGlzIGlzIHRvIGhpZGUgdGhlIGRyb3AgZG93biBtZW51IGFmdGVyIGNsaWNrXHJcbiAgICAgICAgICAgICAgICB0aGlzLkRPTS5hZGRDbGFzcygndzMtZHJvcGRvd24taG92ZXInKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5ET00ucmVtb3ZlQ2xhc3MoJ3czLWRyb3Bkb3duLWNsaWNrJylcclxuICAgICAgICAgICAgfSwgMTAwKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5jYWxsQmFja19jbGlja09wdGlvbihvcHRpb25UZXh0LG9wdGlvbkl0ZW0uZGF0YShcIm9wdGlvblZhbHVlXCIpLFwicmVhbE1vdXNlQ2xpY2tcIilcclxuICAgIH0pXHJcbn1cclxuXHJcbnNpbXBsZVNlbGVjdE1lbnUucHJvdG90eXBlLmNoYW5nZU5hbWU9ZnVuY3Rpb24obmFtZVN0cjEsbmFtZVN0cjIpe1xyXG4gICAgdGhpcy5idXR0b24uY2hpbGRyZW4oXCI6Zmlyc3RcIikudGV4dChuYW1lU3RyMSlcclxuICAgIHRoaXMuYnV0dG9uLmNoaWxkcmVuKCkuZXEoMSkudGV4dChuYW1lU3RyMilcclxufVxyXG5cclxuc2ltcGxlU2VsZWN0TWVudS5wcm90b3R5cGUudHJpZ2dlck9wdGlvbkluZGV4PWZ1bmN0aW9uKG9wdGlvbkluZGV4KXtcclxuICAgIHZhciB0aGVPcHRpb249dGhpcy5vcHRpb25Db250ZW50RE9NLmNoaWxkcmVuKCkuZXEob3B0aW9uSW5kZXgpXHJcbiAgICBpZih0aGVPcHRpb24ubGVuZ3RoPT0wKSB7XHJcbiAgICAgICAgdGhpcy5jdXJTZWxlY3RWYWw9bnVsbDtcclxuICAgICAgICB0aGlzLmNhbGxCYWNrX2NsaWNrT3B0aW9uKG51bGwsbnVsbClcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB0aGlzLmN1clNlbGVjdFZhbD10aGVPcHRpb24uZGF0YShcIm9wdGlvblZhbHVlXCIpXHJcbiAgICB0aGlzLmNhbGxCYWNrX2NsaWNrT3B0aW9uKHRoZU9wdGlvbi50ZXh0KCksdGhlT3B0aW9uLmRhdGEoXCJvcHRpb25WYWx1ZVwiKSlcclxufVxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS50cmlnZ2VyT3B0aW9uVmFsdWU9ZnVuY3Rpb24ob3B0aW9uVmFsdWUpe1xyXG4gICAgdmFyIHJlPXRoaXMuZmluZE9wdGlvbihvcHRpb25WYWx1ZSlcclxuICAgIGlmKHJlPT1udWxsKXtcclxuICAgICAgICB0aGlzLmN1clNlbGVjdFZhbD1udWxsXHJcbiAgICAgICAgdGhpcy5jYWxsQmFja19jbGlja09wdGlvbihudWxsLG51bGwpXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB0aGlzLmN1clNlbGVjdFZhbD1yZS52YWx1ZVxyXG4gICAgICAgIHRoaXMuY2FsbEJhY2tfY2xpY2tPcHRpb24ocmUudGV4dCxyZS52YWx1ZSlcclxuICAgIH1cclxufVxyXG5cclxuXHJcbnNpbXBsZVNlbGVjdE1lbnUucHJvdG90eXBlLmNsZWFyT3B0aW9ucz1mdW5jdGlvbihvcHRpb25UZXh0LG9wdGlvblZhbHVlKXtcclxuICAgIHRoaXMub3B0aW9uQ29udGVudERPTS5lbXB0eSgpXHJcbiAgICB0aGlzLmN1clNlbGVjdFZhbD1udWxsO1xyXG59XHJcblxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS5jYWxsQmFja19jbGlja09wdGlvbj1mdW5jdGlvbihvcHRpb250ZXh0LG9wdGlvblZhbHVlLHJlYWxNb3VzZUNsaWNrKXtcclxuXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gc2ltcGxlU2VsZWN0TWVudTsiLCIndXNlIHN0cmljdCc7XHJcblxyXG5mdW5jdGlvbiBzaW1wbGVUcmVlKERPTSxvcHRpb25zKXtcclxuICAgIHRoaXMuRE9NPURPTVxyXG4gICAgdGhpcy5ncm91cE5vZGVzPVtdIC8vZWFjaCBncm91cCBoZWFkZXIgaXMgb25lIG5vZGVcclxuICAgIHRoaXMuc2VsZWN0ZWROb2Rlcz1bXTtcclxuICAgIHRoaXMub3B0aW9ucz1vcHRpb25zIHx8IHt9XHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLnNjcm9sbFRvTGVhZk5vZGU9ZnVuY3Rpb24oYU5vZGUpe1xyXG4gICAgdmFyIHNjcm9sbFRvcD10aGlzLkRPTS5zY3JvbGxUb3AoKVxyXG4gICAgdmFyIHRyZWVIZWlnaHQ9dGhpcy5ET00uaGVpZ2h0KClcclxuICAgIHZhciBub2RlUG9zaXRpb249YU5vZGUuRE9NLnBvc2l0aW9uKCkudG9wIC8vd2hpY2ggZG9lcyBub3QgY29uc2lkZXIgcGFyZW50IERPTSdzIHNjcm9sbCBoZWlnaHRcclxuICAgIC8vY29uc29sZS5sb2coc2Nyb2xsVG9wLHRyZWVIZWlnaHQsbm9kZVBvc2l0aW9uKVxyXG4gICAgaWYodHJlZUhlaWdodC01MDxub2RlUG9zaXRpb24pe1xyXG4gICAgICAgIHRoaXMuRE9NLnNjcm9sbFRvcChzY3JvbGxUb3AgKyBub2RlUG9zaXRpb24tKHRyZWVIZWlnaHQtNTApKSBcclxuICAgIH1lbHNlIGlmKG5vZGVQb3NpdGlvbjw1MCl7XHJcbiAgICAgICAgdGhpcy5ET00uc2Nyb2xsVG9wKHNjcm9sbFRvcCArIChub2RlUG9zaXRpb24tNTApKSBcclxuICAgIH1cclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuY2xlYXJBbGxMZWFmTm9kZXM9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5mb3JFYWNoKChnTm9kZSk9PntcclxuICAgICAgICBnTm9kZS5saXN0RE9NLmVtcHR5KClcclxuICAgICAgICBnTm9kZS5jaGlsZExlYWZOb2Rlcy5sZW5ndGg9MFxyXG4gICAgICAgIGdOb2RlLnJlZnJlc2hOYW1lKClcclxuICAgIH0pXHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmZpcnN0TGVhZk5vZGU9ZnVuY3Rpb24oKXtcclxuICAgIGlmKHRoaXMuZ3JvdXBOb2Rlcy5sZW5ndGg9PTApIHJldHVybiBudWxsO1xyXG4gICAgdmFyIGZpcnN0TGVhZk5vZGU9bnVsbDtcclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5mb3JFYWNoKGFHcm91cE5vZGU9PntcclxuICAgICAgICBpZihmaXJzdExlYWZOb2RlIT1udWxsKSByZXR1cm47XHJcbiAgICAgICAgaWYoYUdyb3VwTm9kZS5jaGlsZExlYWZOb2Rlcy5sZW5ndGg+MCkgZmlyc3RMZWFmTm9kZT1hR3JvdXBOb2RlLmNoaWxkTGVhZk5vZGVzWzBdXHJcbiAgICB9KVxyXG5cclxuICAgIHJldHVybiBmaXJzdExlYWZOb2RlXHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLm5leHRHcm91cE5vZGU9ZnVuY3Rpb24oYUdyb3VwTm9kZSl7XHJcbiAgICBpZihhR3JvdXBOb2RlPT1udWxsKSByZXR1cm47XHJcbiAgICB2YXIgaW5kZXg9dGhpcy5ncm91cE5vZGVzLmluZGV4T2YoYUdyb3VwTm9kZSlcclxuICAgIGlmKHRoaXMuZ3JvdXBOb2Rlcy5sZW5ndGgtMT5pbmRleCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ3JvdXBOb2Rlc1tpbmRleCsxXVxyXG4gICAgfWVsc2V7IC8vcm90YXRlIGJhY2t3YXJkIHRvIGZpcnN0IGdyb3VwIG5vZGVcclxuICAgICAgICByZXR1cm4gdGhpcy5ncm91cE5vZGVzWzBdIFxyXG4gICAgfVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5uZXh0TGVhZk5vZGU9ZnVuY3Rpb24oYUxlYWZOb2RlKXtcclxuICAgIGlmKGFMZWFmTm9kZT09bnVsbCkgcmV0dXJuO1xyXG4gICAgdmFyIGFHcm91cE5vZGU9YUxlYWZOb2RlLnBhcmVudEdyb3VwTm9kZVxyXG4gICAgdmFyIGluZGV4PWFHcm91cE5vZGUuY2hpbGRMZWFmTm9kZXMuaW5kZXhPZihhTGVhZk5vZGUpXHJcbiAgICBpZihhR3JvdXBOb2RlLmNoaWxkTGVhZk5vZGVzLmxlbmd0aC0xPmluZGV4KXtcclxuICAgICAgICAvL25leHQgbm9kZSBpcyBpbiBzYW1lIGdyb3VwXHJcbiAgICAgICAgcmV0dXJuIGFHcm91cE5vZGUuY2hpbGRMZWFmTm9kZXNbaW5kZXgrMV1cclxuICAgIH1lbHNle1xyXG4gICAgICAgIC8vZmluZCBuZXh0IGdyb3VwIGZpcnN0IG5vZGVcclxuICAgICAgICB3aGlsZSh0cnVlKXtcclxuICAgICAgICAgICAgdmFyIG5leHRHcm91cE5vZGUgPSB0aGlzLm5leHRHcm91cE5vZGUoYUdyb3VwTm9kZSlcclxuICAgICAgICAgICAgaWYobmV4dEdyb3VwTm9kZS5jaGlsZExlYWZOb2Rlcy5sZW5ndGg9PTApe1xyXG4gICAgICAgICAgICAgICAgYUdyb3VwTm9kZT1uZXh0R3JvdXBOb2RlXHJcbiAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5leHRHcm91cE5vZGUuY2hpbGRMZWFmTm9kZXNbMF1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuc2VhcmNoVGV4dD1mdW5jdGlvbihzdHIpe1xyXG4gICAgaWYoc3RyPT1cIlwiKSByZXR1cm4gbnVsbDtcclxuICAgIC8vc2VhcmNoIGZyb20gY3VycmVudCBzZWxlY3QgaXRlbSB0aGUgbmV4dCBsZWFmIGl0ZW0gY29udGFpbnMgdGhlIHRleHRcclxuICAgIHZhciByZWdleCA9IG5ldyBSZWdFeHAoc3RyLCAnaScpO1xyXG4gICAgdmFyIHN0YXJ0Tm9kZVxyXG4gICAgaWYodGhpcy5zZWxlY3RlZE5vZGVzLmxlbmd0aD09MCkge1xyXG4gICAgICAgIHN0YXJ0Tm9kZT10aGlzLmZpcnN0TGVhZk5vZGUoKVxyXG4gICAgICAgIGlmKHN0YXJ0Tm9kZT09bnVsbCkgcmV0dXJuO1xyXG4gICAgICAgIHZhciB0aGVTdHI9c3RhcnROb2RlLm5hbWU7XHJcbiAgICAgICAgaWYodGhlU3RyLm1hdGNoKHJlZ2V4KSE9bnVsbCl7XHJcbiAgICAgICAgICAgIC8vZmluZCB0YXJnZXQgbm9kZSBcclxuICAgICAgICAgICAgcmV0dXJuIHN0YXJ0Tm9kZVxyXG4gICAgICAgIH1cclxuICAgIH1lbHNlIHN0YXJ0Tm9kZT10aGlzLnNlbGVjdGVkTm9kZXNbMF1cclxuXHJcbiAgICBpZihzdGFydE5vZGU9PW51bGwpIHJldHVybiBudWxsO1xyXG4gICAgXHJcbiAgICB2YXIgZnJvbU5vZGU9c3RhcnROb2RlO1xyXG4gICAgd2hpbGUodHJ1ZSl7XHJcbiAgICAgICAgdmFyIG5leHROb2RlPXRoaXMubmV4dExlYWZOb2RlKGZyb21Ob2RlKVxyXG4gICAgICAgIGlmKG5leHROb2RlPT1zdGFydE5vZGUpIHJldHVybiBudWxsO1xyXG4gICAgICAgIHZhciBuZXh0Tm9kZVN0cj1uZXh0Tm9kZS5uYW1lO1xyXG4gICAgICAgIGlmKG5leHROb2RlU3RyLm1hdGNoKHJlZ2V4KSE9bnVsbCl7XHJcbiAgICAgICAgICAgIC8vZmluZCB0YXJnZXQgbm9kZVxyXG4gICAgICAgICAgICByZXR1cm4gbmV4dE5vZGVcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgZnJvbU5vZGU9bmV4dE5vZGU7XHJcbiAgICAgICAgfVxyXG4gICAgfSAgICBcclxufVxyXG5cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmFkZExlYWZub2RlVG9Hcm91cD1mdW5jdGlvbihncm91cE5hbWUsb2JqLHNraXBSZXBlYXQpe1xyXG4gICAgdmFyIGFHcm91cE5vZGU9dGhpcy5maW5kR3JvdXBOb2RlKGdyb3VwTmFtZSlcclxuICAgIGlmKGFHcm91cE5vZGUgPT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgYUdyb3VwTm9kZS5hZGROb2RlKG9iaixza2lwUmVwZWF0KVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5yZW1vdmVBbGxOb2Rlcz1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5ncm91cE5vZGVzLmxlbmd0aD0wO1xyXG4gICAgdGhpcy5zZWxlY3RlZE5vZGVzLmxlbmd0aD0wO1xyXG4gICAgdGhpcy5ET00uZW1wdHkoKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5maW5kR3JvdXBOb2RlPWZ1bmN0aW9uKGdyb3VwTmFtZSl7XHJcbiAgICB2YXIgZm91bmRHcm91cE5vZGU9bnVsbFxyXG4gICAgdGhpcy5ncm91cE5vZGVzLmZvckVhY2goYUdyb3VwTm9kZT0+e1xyXG4gICAgICAgIGlmKGFHcm91cE5vZGUubmFtZT09Z3JvdXBOYW1lKXtcclxuICAgICAgICAgICAgZm91bmRHcm91cE5vZGU9YUdyb3VwTm9kZVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuICAgIHJldHVybiBmb3VuZEdyb3VwTm9kZTtcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuZGVsR3JvdXBOb2RlPWZ1bmN0aW9uKGdub2RlKXtcclxuICAgIGdub2RlLmRlbGV0ZVNlbGYoKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5kZWxldGVMZWFmTm9kZT1mdW5jdGlvbihub2RlTmFtZSl7XHJcbiAgICB2YXIgZmluZExlYWZOb2RlPW51bGxcclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5mb3JFYWNoKChnTm9kZSk9PntcclxuICAgICAgICBpZihmaW5kTGVhZk5vZGUhPW51bGwpIHJldHVybjtcclxuICAgICAgICBnTm9kZS5jaGlsZExlYWZOb2Rlcy5mb3JFYWNoKChhTGVhZik9PntcclxuICAgICAgICAgICAgaWYoYUxlYWYubmFtZT09bm9kZU5hbWUpe1xyXG4gICAgICAgICAgICAgICAgZmluZExlYWZOb2RlPWFMZWFmXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgfSlcclxuICAgIGlmKGZpbmRMZWFmTm9kZT09bnVsbCkgcmV0dXJuO1xyXG4gICAgZmluZExlYWZOb2RlLmRlbGV0ZVNlbGYoKVxyXG59XHJcblxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuaW5zZXJ0R3JvdXBOb2RlPWZ1bmN0aW9uKG9iaixpbmRleCl7XHJcbiAgICB2YXIgYU5ld0dyb3VwTm9kZSA9IG5ldyBzaW1wbGVUcmVlR3JvdXBOb2RlKHRoaXMsb2JqKVxyXG4gICAgdmFyIGV4aXN0R3JvdXBOb2RlPSB0aGlzLmZpbmRHcm91cE5vZGUoYU5ld0dyb3VwTm9kZS5uYW1lKVxyXG4gICAgaWYoZXhpc3RHcm91cE5vZGUhPW51bGwpIHJldHVybjtcclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5zcGxpY2UoaW5kZXgsIDAsIGFOZXdHcm91cE5vZGUpO1xyXG5cclxuICAgIGlmKGluZGV4PT0wKXtcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQoYU5ld0dyb3VwTm9kZS5oZWFkZXJET00pXHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKGFOZXdHcm91cE5vZGUubGlzdERPTSlcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHZhciBwcmV2R3JvdXBOb2RlPXRoaXMuZ3JvdXBOb2Rlc1tpbmRleC0xXVxyXG4gICAgICAgIGFOZXdHcm91cE5vZGUuaGVhZGVyRE9NLmluc2VydEFmdGVyKHByZXZHcm91cE5vZGUubGlzdERPTSlcclxuICAgICAgICBhTmV3R3JvdXBOb2RlLmxpc3RET00uaW5zZXJ0QWZ0ZXIoYU5ld0dyb3VwTm9kZS5oZWFkZXJET00pXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGFOZXdHcm91cE5vZGU7XHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmFkZEdyb3VwTm9kZT1mdW5jdGlvbihvYmope1xyXG4gICAgdmFyIGFOZXdHcm91cE5vZGUgPSBuZXcgc2ltcGxlVHJlZUdyb3VwTm9kZSh0aGlzLG9iailcclxuICAgIHZhciBleGlzdEdyb3VwTm9kZT0gdGhpcy5maW5kR3JvdXBOb2RlKGFOZXdHcm91cE5vZGUubmFtZSlcclxuICAgIGlmKGV4aXN0R3JvdXBOb2RlIT1udWxsKSByZXR1cm4gZXhpc3RHcm91cE5vZGU7XHJcbiAgICB0aGlzLmdyb3VwTm9kZXMucHVzaChhTmV3R3JvdXBOb2RlKTtcclxuICAgIHRoaXMuRE9NLmFwcGVuZChhTmV3R3JvdXBOb2RlLmhlYWRlckRPTSlcclxuICAgIHRoaXMuRE9NLmFwcGVuZChhTmV3R3JvdXBOb2RlLmxpc3RET00pXHJcbiAgICByZXR1cm4gYU5ld0dyb3VwTm9kZTtcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuc2VsZWN0TGVhZk5vZGU9ZnVuY3Rpb24obGVhZk5vZGUsbW91c2VDbGlja0RldGFpbCl7XHJcbiAgICB0aGlzLnNlbGVjdExlYWZOb2RlQXJyKFtsZWFmTm9kZV0sbW91c2VDbGlja0RldGFpbClcclxufVxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5hcHBlbmRMZWFmTm9kZVRvU2VsZWN0aW9uPWZ1bmN0aW9uKGxlYWZOb2RlKXtcclxuICAgIGlmKHRoaXMub3B0aW9ucy5ub011bHRpcGxlU2VsZWN0QWxsb3dlZCl7XHJcbiAgICAgICAgdGhpcy5zZWxlY3RMZWFmTm9kZShsZWFmTm9kZSlcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9IFxyXG4gICAgdmFyIG5ld0Fycj1bXS5jb25jYXQodGhpcy5zZWxlY3RlZE5vZGVzKVxyXG4gICAgbmV3QXJyLnB1c2gobGVhZk5vZGUpXHJcbiAgICB0aGlzLnNlbGVjdExlYWZOb2RlQXJyKG5ld0FycilcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuc2VsZWN0R3JvdXBOb2RlPWZ1bmN0aW9uKGdyb3VwTm9kZSl7XHJcbiAgICBpZih0aGlzLmNhbGxiYWNrX2FmdGVyU2VsZWN0R3JvdXBOb2RlKSB0aGlzLmNhbGxiYWNrX2FmdGVyU2VsZWN0R3JvdXBOb2RlKGdyb3VwTm9kZS5pbmZvKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5zZWxlY3RMZWFmTm9kZUFycj1mdW5jdGlvbihsZWFmTm9kZUFycixtb3VzZUNsaWNrRGV0YWlsKXtcclxuICAgIGZvcih2YXIgaT0wO2k8dGhpcy5zZWxlY3RlZE5vZGVzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHRoaXMuc2VsZWN0ZWROb2Rlc1tpXS5kaW0oKVxyXG4gICAgfVxyXG4gICAgdGhpcy5zZWxlY3RlZE5vZGVzLmxlbmd0aD0wO1xyXG4gICAgdGhpcy5zZWxlY3RlZE5vZGVzPXRoaXMuc2VsZWN0ZWROb2Rlcy5jb25jYXQobGVhZk5vZGVBcnIpXHJcbiAgICBmb3IodmFyIGk9MDtpPHRoaXMuc2VsZWN0ZWROb2Rlcy5sZW5ndGg7aSsrKXtcclxuICAgICAgICB0aGlzLnNlbGVjdGVkTm9kZXNbaV0uaGlnaGxpZ2h0KClcclxuICAgIH1cclxuXHJcbiAgICBpZih0aGlzLmNhbGxiYWNrX2FmdGVyU2VsZWN0Tm9kZXMpIHRoaXMuY2FsbGJhY2tfYWZ0ZXJTZWxlY3ROb2Rlcyh0aGlzLnNlbGVjdGVkTm9kZXMsbW91c2VDbGlja0RldGFpbClcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuZGJsQ2xpY2tOb2RlPWZ1bmN0aW9uKHRoZU5vZGUpe1xyXG4gICAgaWYodGhpcy5jYWxsYmFja19hZnRlckRibGNsaWNrTm9kZSkgdGhpcy5jYWxsYmFja19hZnRlckRibGNsaWNrTm9kZSh0aGVOb2RlKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5zb3J0QWxsTGVhdmVzPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLmdyb3VwTm9kZXMuZm9yRWFjaChvbmVHcm91cE5vZGU9PntvbmVHcm91cE5vZGUuc29ydE5vZGVzQnlOYW1lKCl9KVxyXG59XHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS10cmVlIGdyb3VwIG5vZGUtLS0tLS0tLS0tLS0tLS1cclxuZnVuY3Rpb24gc2ltcGxlVHJlZUdyb3VwTm9kZShwYXJlbnRUcmVlLG9iail7XHJcbiAgICB0aGlzLnBhcmVudFRyZWU9cGFyZW50VHJlZVxyXG4gICAgdGhpcy5pbmZvPW9ialxyXG4gICAgdGhpcy5jaGlsZExlYWZOb2Rlcz1bXSAvL2l0J3MgY2hpbGQgbGVhZiBub2RlcyBhcnJheVxyXG4gICAgdGhpcy5uYW1lPW9iai5kaXNwbGF5TmFtZTtcclxuICAgIHRoaXMuY3JlYXRlRE9NKClcclxufVxyXG5cclxuc2ltcGxlVHJlZUdyb3VwTm9kZS5wcm90b3R5cGUucmVmcmVzaE5hbWU9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuaGVhZGVyRE9NLmVtcHR5KClcclxuICAgIHZhciBuYW1lRGl2PSQoXCI8ZGl2IHN0eWxlPSdkaXNwbGF5OmlubGluZTtwYWRkaW5nLXJpZ2h0OjNweDt2ZXJ0aWNhbC1hbGlnbjptaWRkbGUnPjwvZGl2PlwiKVxyXG4gICAgbmFtZURpdi50ZXh0KHRoaXMubmFtZSlcclxuICAgIFxyXG4gICAgaWYodGhpcy5jaGlsZExlYWZOb2Rlcy5sZW5ndGg+MCkgbGJsQ29sb3I9XCJ3My1saW1lXCJcclxuICAgIGVsc2UgdmFyIGxibENvbG9yPVwidzMtZ3JheVwiIFxyXG4gICAgdGhpcy5oZWFkZXJET00uY3NzKFwiZm9udC13ZWlnaHRcIixcImJvbGRcIilcclxuXHJcbiAgICBpZih0aGlzLnBhcmVudFRyZWUub3B0aW9ucy5ncm91cE5vZGVJY29uRnVuYyl7XHJcbiAgICAgICAgdmFyIGljb25MYWJlbD10aGlzLnBhcmVudFRyZWUub3B0aW9ucy5ncm91cE5vZGVJY29uRnVuYyh0aGlzKVxyXG4gICAgICAgIHRoaXMuaGVhZGVyRE9NLmFwcGVuZChpY29uTGFiZWwpXHJcbiAgICB9XHJcbiAgICB2YXIgbnVtYmVybGFiZWw9JChcIjxsYWJlbCBjbGFzcz0nXCIrbGJsQ29sb3IrXCInIHN0eWxlPSdkaXNwbGF5OmlubGluZTtmb250LXNpemU6OXB4O3BhZGRpbmc6MnB4IDRweDtmb250LXdlaWdodDpub3JtYWw7Ym9yZGVyLXJhZGl1czogMnB4Oyc+XCIrdGhpcy5jaGlsZExlYWZOb2Rlcy5sZW5ndGgrXCI8L2xhYmVsPlwiKVxyXG4gICAgdGhpcy5oZWFkZXJET00uYXBwZW5kKG5hbWVEaXYsbnVtYmVybGFiZWwpXHJcblxyXG5cclxuICAgIGlmKHRoaXMucGFyZW50VHJlZS5vcHRpb25zLmdyb3VwTm9kZVRhaWxCdXR0b25GdW5jKXtcclxuICAgICAgICB2YXIgdGFpbEJ1dHRvbj10aGlzLnBhcmVudFRyZWUub3B0aW9ucy5ncm91cE5vZGVUYWlsQnV0dG9uRnVuYyh0aGlzKVxyXG4gICAgICAgIHRoaXMuaGVhZGVyRE9NLmFwcGVuZCh0YWlsQnV0dG9uKVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuY2hlY2tPcHRpb25IaWRlRW1wdHlHcm91cCgpXHJcblxyXG59XHJcbnNpbXBsZVRyZWVHcm91cE5vZGUucHJvdG90eXBlLmNoZWNrT3B0aW9uSGlkZUVtcHR5R3JvdXA9ZnVuY3Rpb24oKXtcclxuICAgIGlmICh0aGlzLnBhcmVudFRyZWUub3B0aW9ucy5oaWRlRW1wdHlHcm91cCAmJiB0aGlzLmNoaWxkTGVhZk5vZGVzLmxlbmd0aCA9PSAwKSB7XHJcbiAgICAgICAgdGhpcy5zaHJpbmsoKVxyXG4gICAgICAgIHRoaXMuaGVhZGVyRE9NLmhpZGUoKVxyXG4gICAgICAgIGlmICh0aGlzLmxpc3RET00pIHRoaXMubGlzdERPTS5oaWRlKClcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5oZWFkZXJET00uc2hvdygpXHJcbiAgICAgICAgaWYgKHRoaXMubGlzdERPTSkgdGhpcy5saXN0RE9NLnNob3coKVxyXG4gICAgfVxyXG5cclxufVxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5kZWxldGVTZWxmID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5oZWFkZXJET00ucmVtb3ZlKClcclxuICAgIHRoaXMubGlzdERPTS5yZW1vdmUoKVxyXG4gICAgdmFyIHBhcmVudEFyciA9IHRoaXMucGFyZW50VHJlZS5ncm91cE5vZGVzXHJcbiAgICBjb25zdCBpbmRleCA9IHBhcmVudEFyci5pbmRleE9mKHRoaXMpO1xyXG4gICAgaWYgKGluZGV4ID4gLTEpIHBhcmVudEFyci5zcGxpY2UoaW5kZXgsIDEpO1xyXG59XHJcblxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5jcmVhdGVET009ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuaGVhZGVyRE9NPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYmxvY2sgdzMtbGlnaHQtZ3JleSB3My1sZWZ0LWFsaWduIHczLWJvcmRlci1ib3R0b21cIiBzdHlsZT1cInBvc2l0aW9uOnJlbGF0aXZlXCI+PC9idXR0b24+JylcclxuICAgIHRoaXMucmVmcmVzaE5hbWUoKVxyXG4gICAgdGhpcy5saXN0RE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1jb250YWluZXIgdzMtaGlkZSB3My1ib3JkZXJcIj48L2Rpdj4nKVxyXG5cclxuICAgIHRoaXMuaGVhZGVyRE9NLm9uKFwiY2xpY2tcIiwoZXZ0KT0+IHtcclxuICAgICAgICBpZih0aGlzLmxpc3RET00uaGFzQ2xhc3MoXCJ3My1zaG93XCIpKSB0aGlzLmxpc3RET00ucmVtb3ZlQ2xhc3MoXCJ3My1zaG93XCIpXHJcbiAgICAgICAgZWxzZSB0aGlzLmxpc3RET00uYWRkQ2xhc3MoXCJ3My1zaG93XCIpXHJcblxyXG4gICAgICAgIHRoaXMucGFyZW50VHJlZS5zZWxlY3RHcm91cE5vZGUodGhpcykgICAgXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbnNpbXBsZVRyZWVHcm91cE5vZGUucHJvdG90eXBlLmlzT3Blbj1mdW5jdGlvbigpe1xyXG4gICAgcmV0dXJuICB0aGlzLmxpc3RET00uaGFzQ2xhc3MoXCJ3My1zaG93XCIpXHJcbn1cclxuXHJcblxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5leHBhbmQ9ZnVuY3Rpb24oKXtcclxuICAgIGlmKHRoaXMubGlzdERPTSkgdGhpcy5saXN0RE9NLmFkZENsYXNzKFwidzMtc2hvd1wiKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5zaHJpbms9ZnVuY3Rpb24oKXtcclxuICAgIGlmKHRoaXMubGlzdERPTSkgdGhpcy5saXN0RE9NLnJlbW92ZUNsYXNzKFwidzMtc2hvd1wiKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5zb3J0Tm9kZXNCeU5hbWU9ZnVuY3Rpb24oKXtcclxuICAgIHZhciB0cmVlT3B0aW9ucz10aGlzLnBhcmVudFRyZWUub3B0aW9uc1xyXG4gICAgaWYodHJlZU9wdGlvbnMubGVhZk5hbWVQcm9wZXJ0eSkgdmFyIGxlYWZOYW1lUHJvcGVydHk9dHJlZU9wdGlvbnMubGVhZk5hbWVQcm9wZXJ0eVxyXG4gICAgZWxzZSBsZWFmTmFtZVByb3BlcnR5PVwiJGR0SWRcIlxyXG4gICAgdGhpcy5jaGlsZExlYWZOb2Rlcy5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7IFxyXG4gICAgICAgIHZhciBhTmFtZT1hLm5hbWUudG9Mb3dlckNhc2UoKVxyXG4gICAgICAgIHZhciBiTmFtZT1iLm5hbWUudG9Mb3dlckNhc2UoKVxyXG4gICAgICAgIHJldHVybiBhTmFtZS5sb2NhbGVDb21wYXJlKGJOYW1lKSBcclxuICAgIH0pO1xyXG4gICAgLy90aGlzLmxpc3RET00uZW1wdHkoKSAvL05PVEU6IENhbiBub3QgZGVsZXRlIHRob3NlIGxlYWYgbm9kZSBvdGhlcndpc2UgdGhlIGV2ZW50IGhhbmRsZSBpcyBsb3N0XHJcbiAgICB0aGlzLmNoaWxkTGVhZk5vZGVzLmZvckVhY2gob25lTGVhZj0+e3RoaXMubGlzdERPTS5hcHBlbmQob25lTGVhZi5ET00pfSlcclxufVxyXG5cclxuc2ltcGxlVHJlZUdyb3VwTm9kZS5wcm90b3R5cGUuYWRkTm9kZT1mdW5jdGlvbihvYmosc2tpcFJlcGVhdCl7XHJcbiAgICB2YXIgdHJlZU9wdGlvbnM9dGhpcy5wYXJlbnRUcmVlLm9wdGlvbnNcclxuICAgIGlmKHRyZWVPcHRpb25zLmxlYWZOYW1lUHJvcGVydHkpIHZhciBsZWFmTmFtZVByb3BlcnR5PXRyZWVPcHRpb25zLmxlYWZOYW1lUHJvcGVydHlcclxuICAgIGVsc2UgbGVhZk5hbWVQcm9wZXJ0eT1cIiRkdElkXCJcclxuXHJcbiAgICBpZihza2lwUmVwZWF0KXtcclxuICAgICAgICB2YXIgZm91bmRSZXBlYXQ9ZmFsc2U7XHJcbiAgICAgICAgdGhpcy5jaGlsZExlYWZOb2Rlcy5mb3JFYWNoKGFOb2RlPT57XHJcbiAgICAgICAgICAgIGlmKGFOb2RlLm5hbWU9PW9ialtsZWFmTmFtZVByb3BlcnR5XSkge1xyXG4gICAgICAgICAgICAgICAgZm91bmRSZXBlYXQ9dHJ1ZVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICBpZihmb3VuZFJlcGVhdCkgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBhTmV3Tm9kZSA9IG5ldyBzaW1wbGVUcmVlTGVhZk5vZGUodGhpcyxvYmopXHJcbiAgICB0aGlzLmNoaWxkTGVhZk5vZGVzLnB1c2goYU5ld05vZGUpXHJcbiAgICB0aGlzLnJlZnJlc2hOYW1lKClcclxuICAgIHRoaXMubGlzdERPTS5hcHBlbmQoYU5ld05vZGUuRE9NKVxyXG59XHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS10cmVlIGxlYWYgbm9kZS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5mdW5jdGlvbiBzaW1wbGVUcmVlTGVhZk5vZGUocGFyZW50R3JvdXBOb2RlLG9iail7XHJcbiAgICB0aGlzLnBhcmVudEdyb3VwTm9kZT1wYXJlbnRHcm91cE5vZGVcclxuICAgIHRoaXMubGVhZkluZm89b2JqO1xyXG5cclxuICAgIHZhciB0cmVlT3B0aW9ucz10aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLm9wdGlvbnNcclxuICAgIGlmKHRyZWVPcHRpb25zLmxlYWZOYW1lUHJvcGVydHkpIHRoaXMubmFtZT10aGlzLmxlYWZJbmZvW3RyZWVPcHRpb25zLmxlYWZOYW1lUHJvcGVydHldXHJcbiAgICBlbHNlIHRoaXMubmFtZT10aGlzLmxlYWZJbmZvW1wiJGR0SWRcIl1cclxuXHJcbiAgICB0aGlzLmNyZWF0ZUxlYWZOb2RlRE9NKClcclxufVxyXG5cclxuc2ltcGxlVHJlZUxlYWZOb2RlLnByb3RvdHlwZS5kZWxldGVTZWxmID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5ET00ucmVtb3ZlKClcclxuICAgIHZhciBnTm9kZSA9IHRoaXMucGFyZW50R3JvdXBOb2RlXHJcbiAgICBjb25zdCBpbmRleCA9IGdOb2RlLmNoaWxkTGVhZk5vZGVzLmluZGV4T2YodGhpcyk7XHJcbiAgICBpZiAoaW5kZXggPiAtMSkgZ05vZGUuY2hpbGRMZWFmTm9kZXMuc3BsaWNlKGluZGV4LCAxKTtcclxuICAgIGdOb2RlLnJlZnJlc2hOYW1lKClcclxufVxyXG5cclxuc2ltcGxlVHJlZUxlYWZOb2RlLnByb3RvdHlwZS5jcmVhdGVMZWFmTm9kZURPTT1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5ET009JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My13aGl0ZVwiIHN0eWxlPVwiZGlzcGxheTpibG9jazt0ZXh0LWFsaWduOmxlZnQ7d2lkdGg6OTglXCI+PC9idXR0b24+JylcclxuICAgIHRoaXMucmVkcmF3TGFiZWwoKVxyXG4gICAgdmFyIGNsaWNrRj0oZSk9PntcclxuICAgICAgICB0aGlzLmhpZ2hsaWdodCgpO1xyXG4gICAgICAgIHZhciBjbGlja0RldGFpbD1lLmRldGFpbFxyXG4gICAgICAgIGlmIChlLmN0cmxLZXkpIHtcclxuICAgICAgICAgICAgdGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5hcHBlbmRMZWFmTm9kZVRvU2VsZWN0aW9uKHRoaXMpXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUuc2VsZWN0TGVhZk5vZGUodGhpcyxlLmRldGFpbClcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLkRPTS5vbihcImNsaWNrXCIsKGUpPT57Y2xpY2tGKGUpfSlcclxuXHJcbiAgICB0aGlzLkRPTS5vbihcImRibGNsaWNrXCIsKGUpPT57XHJcbiAgICAgICAgdGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5kYmxDbGlja05vZGUodGhpcylcclxuICAgIH0pXHJcbn1cclxuXHJcbnNpbXBsZVRyZWVMZWFmTm9kZS5wcm90b3R5cGUucmVkcmF3TGFiZWw9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuRE9NLmVtcHR5KClcclxuICAgIGlmKHRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUub3B0aW9ucy5sZWFmTm9kZUljb25GdW5jKXtcclxuICAgICAgICB2YXIgaWNvbkxhYmVsPXRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUub3B0aW9ucy5sZWFmTm9kZUljb25GdW5jKHRoaXMpXHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKGljb25MYWJlbClcclxuICAgIH1cclxuXHJcbiAgICB2YXIgbmFtZURpdj0kKFwiPGRpdiBzdHlsZT0nZGlzcGxheTppbmxpbmU7cGFkZGluZy1yaWdodDozcHg7dmVydGljYWwtYWxpZ246bWlkZGxlJz48L2Rpdj5cIilcclxuICAgIG5hbWVEaXYudGV4dCh0aGlzLm5hbWUpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQobmFtZURpdilcclxufVxyXG5zaW1wbGVUcmVlTGVhZk5vZGUucHJvdG90eXBlLmhpZ2hsaWdodD1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5ET00uYWRkQ2xhc3MoXCJ3My1vcmFuZ2VcIilcclxuICAgIHRoaXMuRE9NLmFkZENsYXNzKFwidzMtaG92ZXItYW1iZXJcIilcclxuICAgIHRoaXMuRE9NLnJlbW92ZUNsYXNzKFwidzMtd2hpdGVcIilcclxufVxyXG5zaW1wbGVUcmVlTGVhZk5vZGUucHJvdG90eXBlLmRpbT1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5ET00ucmVtb3ZlQ2xhc3MoXCJ3My1vcmFuZ2VcIilcclxuICAgIHRoaXMuRE9NLnJlbW92ZUNsYXNzKFwidzMtaG92ZXItYW1iZXJcIilcclxuICAgIHRoaXMuRE9NLmFkZENsYXNzKFwidzMtd2hpdGVcIilcclxufVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gc2ltcGxlVHJlZTsiXX0=
