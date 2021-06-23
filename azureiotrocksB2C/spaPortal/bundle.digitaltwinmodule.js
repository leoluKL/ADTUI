(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';
const topologyDOM=require("./topologyDOM.js")
const twinsTree=require("./twinsTree")
const startSelectionDialog = require("./startSelectionDialog")
const modelManagerDialog = require("./modelManagerDialog")
const modelEditorDialog = require("./modelEditorDialog")
const editLayoutDialog = require("./editLayoutDialog")
const mainToolbar = require("./mainToolbar")
const infoPanel= require("./infoPanel");
const globalAppSettings = require("../globalAppSettings.js");
const msalHelper=require("../msalHelper")
const globalCache=require("./globalCache")

function digitaltwinmoduleUI() {
    this.initUILayout()

    this.twinsTree= new twinsTree($("#treeHolder"),$("#treeSearch"))
    
    mainToolbar.render()
    this.topologyInstance=new topologyDOM($('#canvas'))
    this.topologyInstance.init()

    this.broadcastMessage() //initialize all ui components to have the broadcast capability

    //try if it already B2C signed in, if not going back to the start page
    this.myMSALObj = new msal.PublicClientApplication(globalAppSettings.msalConfig);


    var theAccount=msalHelper.fetchAccount();
    if(theAccount==null && !globalAppSettings.isLocalTest) window.open(globalAppSettings.logoutRedirectUri,"_self")

    globalCache.loadUserData().then(re=>{
        if(globalCache.DBModelsArr.length==0){
            //directly popup to model management dialog allow user import or create model
            modelManagerDialog.popup()
            //pop up welcome screen
            var popWin=$('<div class="w3-blue w3-card-4 w3-padding-large" style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:105;width:400px;cursor:default"></div>')
            popWin.html(`Welcome, ${msalHelper.userName}! Firstly, you may consider importing a few twin model files or creating twin models from scratch. <br/><br/>Click to continue...`)
            $("body").append(popWin)
            popWin.on("click",()=>{popWin.remove()})
        }else{
            startSelectionDialog.popup()
        }
        this.broadcastMessage(this,{ "message": "visualDefinitionRefresh"})
        this.broadcastMessage(this,{ "message": "layoutsUpdated"})
    })
}

digitaltwinmoduleUI.prototype.broadcastMessage=function(source,msgPayload){
    var componentsArr=[this.twinsTree,startSelectionDialog,modelManagerDialog,modelEditorDialog,editLayoutDialog,
         mainToolbar,this.topologyInstance,infoPanel]

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

digitaltwinmoduleUI.prototype.assignBroadcastMessage=function(uiComponent){
    uiComponent.broadcastMessage=(msgObj)=>{this.broadcastMessage(uiComponent,msgObj)}
}

digitaltwinmoduleUI.prototype.initUILayout = function () {
    var myLayout = $('body').layout({
        //	reference only - these options are NOT required because 'true' is the default
        closable: true	// pane can open & close
        , resizable: true	// when open, pane can be resized 
        , slidable: true	// when closed, pane can 'slide' open over other panes - closes on mouse-out
        , livePaneResizing: true

        //	some resizing/toggling settings
        , north__slidable: false	// OVERRIDE the pane-default of 'slidable=true'
        //, north__togglerLength_closed: '100%'	// toggle-button is full-width of resizer-bar
        , north__spacing_closed: 6		// big resizer-bar when open (zero height)
        , north__spacing_open:0
        , north__resizable: false	// OVERRIDE the pane-default of 'resizable=true'
        , north__closable: false
        , west__closable: false
        , east__closable: false
        

        //	some pane-size settings
        , west__minSize: 100
        , east__size: 300
        , east__minSize: 200
        , east__maxSize: .5 // 50% of layout width
        , center__minWidth: 100
        ,east__closable: false
        ,west__closable: false
        ,east__initClosed:	true
    });


    /*
     *	DISABLE TEXT-SELECTION WHEN DRAGGING (or even _trying_ to drag!)
     *	this functionality will be included in RC30.80
     */
    $.layout.disableTextSelection = function () {
        var $d = $(document)
            , s = 'textSelectionDisabled'
            , x = 'textSelectionInitialized'
            ;
        if ($.fn.disableSelection) {
            if (!$d.data(x)) // document hasn't been initialized yet
                $d.on('mouseup', $.layout.enableTextSelection).data(x, true);
            if (!$d.data(s))
                $d.disableSelection().data(s, true);
        }
        //console.log('$.layout.disableTextSelection');
    };
    $.layout.enableTextSelection = function () {
        var $d = $(document)
            , s = 'textSelectionDisabled';
        if ($.fn.enableSelection && $d.data(s))
            $d.enableSelection().data(s, false);
        //console.log('$.layout.enableTextSelection');
    };
    $(".ui-layout-resizer-north").hide()
    $(".ui-layout-west").css("border-right","solid 1px lightGray")
    $(".ui-layout-west").addClass("w3-card")
}


module.exports = new digitaltwinmoduleUI();
},{"../globalAppSettings.js":12,"../msalHelper":13,"./editLayoutDialog":2,"./globalCache":3,"./infoPanel":4,"./mainToolbar":5,"./modelEditorDialog":7,"./modelManagerDialog":8,"./startSelectionDialog":9,"./topologyDOM.js":10,"./twinsTree":11}],2:[function(require,module,exports){
const simpleSelectMenu= require("../sharedSourceFiles/simpleSelectMenu")
const simpleConfirmDialog = require("../sharedSourceFiles/simpleConfirmDialog")
const globalCache=require("./globalCache")
const msalHelper=require("../msalHelper")

function editLayoutDialog() {
    if(!this.DOM){
        this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:101" class="w3-card-2"></div>')
        $("body").append(this.DOM)
        this.DOM.hide()
    }
}

editLayoutDialog.prototype.refillOptions = function () {
    this.switchLayoutSelector.clearOptions()
    
    for(var ind in globalCache.layoutJSON){
        this.switchLayoutSelector.addOption(ind)
    }
}

editLayoutDialog.prototype.popup = function () {
    this.DOM.show()
    this.DOM.empty()

    this.DOM.css({"width":"320px","padding-bottom":"3px"})
    this.DOM.append($('<div style="height:40px;margin-bottom:2px" class="w3-bar w3-red"><div class="w3-bar-item" style="font-size:1.2em">Layout</div></div>'))
    var closeButton = $('<button class="w3-bar-item w3-button w3-right" style="font-size:2em;padding-top:4px">×</button>')
    this.DOM.children(':first').append(closeButton)
    closeButton.on("click", () => { this.DOM.hide() })

    var nameInput=$('<input type="text" style="outline:none; width:180px; display:inline;margin-left:2px;margin-right:2px"  placeholder="Fill in a new layout name..."/>').addClass("w3-input w3-border");   
    this.DOM.append(nameInput)
    var saveAsNewBtn=$('<button class="w3-button w3-green w3-hover-light-green">Save New Layout</button>')
    this.DOM.append(saveAsNewBtn)
    saveAsNewBtn.on("click",()=>{this.saveIntoLayout(nameInput.val())})


    if(!jQuery.isEmptyObject(globalCache.layoutJSON)){
        var lbl=$('<div class="w3-bar w3-padding-16" style="text-align:center;">- OR -</div>')
        this.DOM.append(lbl) 
        var switchLayoutSelector=new simpleSelectMenu("",{fontSize:"1em",colorClass:"w3-light-gray",width:"120px"})
        this.switchLayoutSelector=switchLayoutSelector
        this.refillOptions()
        this.switchLayoutSelector.callBack_clickOption=(optionText,optionValue)=>{
            if(optionText==null) this.switchLayoutSelector.changeName(" ")
            else this.switchLayoutSelector.changeName(optionText)
        }
            
        var saveAsBtn=$('<button class="w3-button w3-green w3-hover-light-green" style="margin-left:2px;margin-right:5px">Save As</button>')
        var deleteBtn=$('<button class="w3-button w3-red w3-hover-pink" style="margin-left:5px">Delete Layout</button>')
        this.DOM.append(saveAsBtn,switchLayoutSelector.DOM,deleteBtn)
        saveAsBtn.on("click",()=>{this.saveIntoLayout(switchLayoutSelector.curSelectVal)})
        deleteBtn.on("click",()=>{this.deleteLayout(switchLayoutSelector.curSelectVal)})

        if(globalCache.currentLayoutName!=null){
            switchLayoutSelector.triggerOptionValue(globalCache.currentLayoutName)
        }else{
            switchLayoutSelector.triggerOptionIndex(0)
        }
    }
}

editLayoutDialog.prototype.saveIntoLayout = function (layoutName) {
    if(layoutName=="" || layoutName==null){
        alert("Please choose target layout Name")
        return
    }
    this.broadcastMessage({ "message": "saveLayout", "layoutName": layoutName})
    this.DOM.hide()
}


editLayoutDialog.prototype.deleteLayout = function (layoutName) {
    if(layoutName=="" || layoutName==null){
        alert("Please choose target layout Name")
        return;
    }

    var confirmDialogDiv=new simpleConfirmDialog()

    confirmDialogDiv.show(
        { width: "250px" },
        {
            title: "Confirm"
            , content: "Confirm deleting layout \"" + layoutName + "\"?"
            , buttons:[
                {
                    colorClass: "w3-red w3-hover-pink", text: "Confirm", "clickFunc": async () => {
                        delete globalCache.layoutJSON[layoutName]
                        if (layoutName == globalCache.currentLayoutName) globalCache.currentLayoutName = null
                        confirmDialogDiv.close()
                        this.broadcastMessage({ "message": "layoutsUpdated"})
                        this.refillOptions()
                        this.switchLayoutSelector.triggerOptionIndex(0)
                        try{
                            await msalHelper.callAPI("digitaltwin/deleteLayout", "POST", { "layoutName": layoutName })
                        }catch(e){
                            console.log(e)
                            if(e.responseText) alert(e.responseText)
                        }
                    }
                },
                {
                    colorClass: "w3-gray",text: "Cancel", "clickFunc": () => {
                        confirmDialogDiv.close()
                }}
            ]
        }
    )

}

module.exports = new editLayoutDialog();
},{"../msalHelper":13,"../sharedSourceFiles/simpleConfirmDialog":15,"../sharedSourceFiles/simpleSelectMenu":16,"./globalCache":3}],3:[function(require,module,exports){
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
},{"../msalHelper":13,"./modelAnalyzer":6}],4:[function(require,module,exports){
const modelAnalyzer = require("./modelAnalyzer");
const simpleSelectMenu= require("../sharedSourceFiles/simpleSelectMenu")
const simpleConfirmDialog = require("../sharedSourceFiles/simpleConfirmDialog")
const globalCache = require("./globalCache")
const msalHelper = require("../msalHelper")

function infoPanel() {
    this.continerDOM=$('<div class="w3-card" style="position:absolute;z-index:90;right:0px;top:50%;height:70%;width:300px;transform: translateY(-50%);"></div>')
    this.continerDOM.hide()
    this.continerDOM.append($('<div style="height:50px" class="w3-bar w3-red"></div>'))

    this.closeButton1=$('<button style="height:100%" class="w3-bar-item w3-button"><i class="fa fa-info-circle fa-2x" style="padding:2px"></i></button>')
    this.closeButton2=$('<button class="w3-bar-item w3-button w3-right" style="font-size:2em">×</button>')
    this.continerDOM.children(':first').append(this.closeButton1,this.closeButton2) 

    this.isMinimized=false;
    var buttonAnim=()=>{
        if(!this.isMinimized){
            this.continerDOM.animate({
                right: "-250px",
                height:"50px"
            })
            this.isMinimized=true;
        }else{
            this.continerDOM.animate({
                right: "0px",
                height: "70%"
            })
            this.isMinimized=false;
        }
    }
    this.closeButton1.on("click",buttonAnim)
    this.closeButton2.on("click",buttonAnim)

    this.DOM=$('<div class="w3-container" style="postion:absolute;top:50px;height:calc(100% - 50px);overflow:auto"></div>')
    this.continerDOM.css("background-color","rgba(255, 255, 255, 0.8)")
    this.continerDOM.hover(() => {
        this.continerDOM.css("background-color", "rgba(255, 255, 255, 1)")
    }, () => {
        this.continerDOM.css("background-color", "rgba(255, 255, 255, 0.8)")
    });
    this.continerDOM.append(this.DOM)
    $('body').append(this.continerDOM)
    this.DOM.html("<a style='display:block;font-style:italic;color:gray'>Choose twins or relationships to view infomration</a><a style='display:block;font-style:italic;color:gray;padding-top:20px'>Press shift key to select multiple in topology view</a><a style='display:block;font-style:italic;color:gray;padding-top:20px;padding-bottom:20px'>Press ctrl key to select multiple in tree view</a><a style='display:block;font-style:italic;color:gray;padding-top:20px;padding-bottom:5px'>Import twins data by clicking button below</a>")

    this.drawButtons(null)
    this.selectedObjects=null;
}

infoPanel.prototype.rxMessage=function(msgPayload){
    if(msgPayload.message=="startSelectionDialog_closed"){
        if(!this.continerDOM.is(":visible")) {
            this.continerDOM.show()
            this.continerDOM.addClass("w3-animate-right")
        }
    }else if(msgPayload.message=="showInfoSelectedNodes"){
        this.DOM.empty()
        var arr=msgPayload.info;
        
        if(arr==null || arr.length==0){
            this.drawButtons(null)
            this.selectedObjects=[];
            return;
        }
        this.selectedObjects=arr;
        if(arr.length==1){
            var singleElementInfo=arr[0];
            
            if(singleElementInfo["$dtId"]){// select a node
                this.drawButtons("singleNode")
                
                //instead of draw the $dtId, draw display name instead
                //this.drawStaticInfo(this.DOM,{"$dtId":singleElementInfo["$dtId"]},"1em","13px")
                this.drawStaticInfo(this.DOM,{"name":singleElementInfo["displayName"]},"1em","13px")


                var modelName=singleElementInfo['$metadata']['$model']
                
                if(modelAnalyzer.DTDLModels[modelName]){
                    this.drawEditable(this.DOM,modelAnalyzer.DTDLModels[modelName].editableProperties,singleElementInfo,[])
                }
                //instead of drawing the original infomration, draw more meaningful one
                //this.drawStaticInfo(this.DOM,{"$etag":singleElementInfo["$etag"],"$metadata":singleElementInfo["$metadata"]},"1em","10px")
                this.drawStaticInfo(this.DOM,{"Model":singleElementInfo["$metadata"]["$model"]},"1em","10px")
                for(var ind in singleElementInfo["$metadata"]){
                    if(ind == "$model") continue;
                    var tmpObj={}
                    tmpObj[ind]=singleElementInfo["$metadata"][ind]
                    this.drawStaticInfo(this.DOM,tmpObj,"1em","10px")
                }
            }else if(singleElementInfo["$sourceId"]){
                this.drawButtons("singleRelationship")
                this.drawStaticInfo(this.DOM,{
                    "From":globalCache.twinIDMapToDisplayName[singleElementInfo["$sourceId"]],
                    "To":globalCache.twinIDMapToDisplayName[singleElementInfo["$targetId"]],
                    "Relationship Type":singleElementInfo["$relationshipName"]
                    //,"$relationshipId":singleElementInfo["$relationshipId"]
                },"1em","13px")
                var relationshipName=singleElementInfo["$relationshipName"]
                var sourceModel=singleElementInfo["sourceModel"]
                
                this.drawEditable(this.DOM,this.getRelationShipEditableProperties(relationshipName,sourceModel),singleElementInfo,[])
                for(var ind in singleElementInfo["$metadata"]){
                    var tmpObj={}
                    tmpObj[ind]=singleElementInfo["$metadata"][ind]
                    this.drawStaticInfo(this.DOM,tmpObj,"1em","10px")
                }
                //this.drawStaticInfo(this.DOM,{"$etag":singleElementInfo["$etag"]},"1em","10px","DarkGray")
            }
        }else if(arr.length>1){
            this.drawButtons("multiple")
            this.drawMultipleObj()
        }
    }else if(msgPayload.message=="showInfoGroupNode"){
        this.DOM.empty()
        
        var modelID = msgPayload.info["@id"]
        globalCache.showingCreateTwinModelID=modelID
        if(!modelAnalyzer.DTDLModels[modelID]) return;
        var twinJson = {
            "$metadata": {
                "$model": modelID
            }
        }
        var addBtn =$('<button class="w3-button w3-green w3-hover-light-green w3-margin">Add Twin</button>')
        this.DOM.append(addBtn)

        addBtn.on("click",(e) => {
            if(!twinJson["$dtId"]||twinJson["$dtId"]==""){
                alert("Please fill in name for the new digital twin")
                return;
            }

            var componentsNameArr=modelAnalyzer.DTDLModels[modelID].includedComponents
            componentsNameArr.forEach(oneComponentName=>{ //adt service requesting all component appear by mandatory
                if(twinJson[oneComponentName]==null)twinJson[oneComponentName]={}
                twinJson[oneComponentName]["$metadata"]= {}
            })
            this.addTwin(twinJson)
        })

        this.drawStaticInfo(this.DOM,{
            "Model":modelID
        })

        addBtn.data("twinJson",twinJson)
        var copyProperty=JSON.parse(JSON.stringify(modelAnalyzer.DTDLModels[modelID].editableProperties))
        copyProperty['$dtId']="string"
        this.drawEditable(this.DOM,copyProperty,twinJson,[],"newTwin")
        //console.log(modelAnalyzer.DTDLModels[modelID]) 
    }
}

infoPanel.prototype.addTwin=async function(twinJson){
    //ask taskmaster to add the twin
    try{
        var data = await msalHelper.callAPI("digitaltwin/upsertDigitalTwin", "POST",  {"newTwinJson":JSON.stringify(twinJson)})
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
    }

    globalCache.storeSingleDBTwin(data.DBTwin)
    //successful editing, update the node original info
    var keyLabel = this.DOM.find('#NEWTWIN_IDLabel')
    var IDInput = keyLabel.find("input")
    if (IDInput) IDInput.val("")
    
    globalCache.storeSingleADTTwin(data.ADTTwin)
    this.broadcastMessage({ "message": "addNewTwin", twinInfo: data.ADTTwin })
}

infoPanel.prototype.getRelationShipEditableProperties=function(relationshipName,sourceModel){
    if(!modelAnalyzer.DTDLModels[sourceModel] || !modelAnalyzer.DTDLModels[sourceModel].validRelationships[relationshipName]) return
    return modelAnalyzer.DTDLModels[sourceModel].validRelationships[relationshipName].editableRelationshipProperties
}

infoPanel.prototype.drawButtons=function(selectType){
    var impBtn=$('<button class="w3-bar-item w3-button w3-blue"><i class="fa fa-arrow-circle-o-down"></i></button>')
    var actualImportTwinsBtn =$('<input type="file" name="modelFiles" multiple="multiple" style="display:none"></input>')
    if(selectType!=null){
        var refreshBtn=$('<button class="w3-bar-item w3-button w3-black"><i class="fa fa-refresh"></i></button>')
        var expBtn=$('<button class="w3-bar-item w3-button w3-green"><i class="fa fa-arrow-circle-o-up"></i></button>')    
        this.DOM.append(refreshBtn,expBtn,impBtn,actualImportTwinsBtn)
        refreshBtn.on("click",()=>{this.refreshInfomation()})
        expBtn.on("click",()=>{
            //find out the twins in selection and their connections (filter both src and target within the selected twins)
            //and export them
            this.exportSelected()
        })    
    }else{
        this.DOM.append(impBtn,actualImportTwinsBtn)
    }
    
    impBtn.on("click",()=>{actualImportTwinsBtn.trigger('click');})
    actualImportTwinsBtn.change(async (evt)=>{
        var files = evt.target.files; // FileList object
        await this.readTwinsFilesContentAndImport(files)
        actualImportTwinsBtn.val("")
    })
    if(selectType==null) return;

    if(selectType=="singleRelationship"){
        var delBtn =  $('<button style="width:50%" class="w3-button w3-red w3-hover-pink w3-border">Delete All</button>')
        this.DOM.append(delBtn)
        delBtn.on("click",()=>{this.deleteSelected()})
    }else if(selectType=="singleNode" || selectType=="multiple"){
        var delBtn = $('<button style="width:50%" class="w3-button w3-red w3-hover-pink w3-border">Delete All</button>')
        var connectToBtn =$('<button style="width:45%"  class="w3-button w3-border">Connect to</button>')
        var connectFromBtn = $('<button style="width:45%" class="w3-button w3-border">Connect from</button>')
        var showInboundBtn = $('<button  style="width:45%" class="w3-button w3-border">Query Inbound</button>')
        var showOutBoundBtn = $('<button style="width:45%" class="w3-button w3-border">Query Outbound</button>')
        
        this.DOM.append(delBtn, connectToBtn,connectFromBtn , showInboundBtn, showOutBoundBtn)
    
        showOutBoundBtn.on("click",()=>{this.showOutBound()})
        showInboundBtn.on("click",()=>{this.showInBound()})  
        connectToBtn.on("click",()=>{this.broadcastMessage({ "message": "connectTo"}) })
        connectFromBtn.on("click",()=>{this.broadcastMessage({ "message": "connectFrom"}) })

        delBtn.on("click",()=>{this.deleteSelected()})
    }
    
    var numOfNode = 0;
    var arr=this.selectedObjects;
    arr.forEach(element => {
        if (element['$dtId']) numOfNode++
    });
    if(numOfNode>0){
        var selectInboundBtn = $('<button class="w3-button w3-border">+Select Inbound</button>')
        var selectOutBoundBtn = $('<button class="w3-button w3-border">+Select Outbound</button>')
        var coseLayoutBtn= $('<button class="w3-button w3-border">COSE View</button>')
        var hideBtn= $('<button class="w3-button w3-border">Hide</button>')
        this.DOM.append(selectInboundBtn, selectOutBoundBtn,coseLayoutBtn,hideBtn)

        selectInboundBtn.on("click",()=>{this.broadcastMessage({"message": "addSelectInbound"})})
        selectOutBoundBtn.on("click",()=>{this.broadcastMessage({"message": "addSelectOutbound"})})
        coseLayoutBtn.on("click",()=>{this.broadcastMessage({"message": "COSESelectedNodes"})})
        hideBtn.on("click",()=>{this.broadcastMessage({"message": "hideSelectedNodes"})})
    }
}

infoPanel.prototype.exportSelected=async function(){
    var arr=this.selectedObjects;
    if(arr.length==0) return;
    var twinIDArr=[]
    var twinToBeStored=[]
    var twinIDs={}
    arr.forEach(element => {
        if (element['$sourceId']) return
        twinIDArr.push(element['$dtId'])
        var anExpTwin={}
        anExpTwin["$metadata"]={"$model":element["$metadata"]["$model"]}
        for(var ind in element){
            if(ind=="$metadata" || ind=="$etag") continue 
            else anExpTwin[ind]=element[ind]
        }
        twinToBeStored.push(anExpTwin)
        twinIDs[element['$dtId']]=1
    });
    var relationsToBeStored=[]
    twinIDArr.forEach(oneID=>{
        var relations=globalCache.storedOutboundRelationships[oneID]
        if(!relations) return;
        relations.forEach(oneRelation=>{
            var targetID=oneRelation["$targetId"]
            if(twinIDs[targetID]) {
                var obj={}
                for(var ind in oneRelation){
                    if(ind =="$etag"||ind =="$relationshipId"||ind =="$sourceId"||ind =="sourceModel") continue
                    obj[ind]=oneRelation[ind]
                }
                var oneAction={"$srcId":oneID,
                                "$relationshipId":oneRelation["$relationshipId"],
                                "obj":obj}
                relationsToBeStored.push(oneAction)
            }
        })
    })
    var finalJSON={"twins":twinToBeStored,"relations":relationsToBeStored}
    var pom = $("<a></a>")
    pom.attr('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(finalJSON)));
    pom.attr('download', "exportTwinsData.json");
    pom[0].click()
}

infoPanel.prototype.readOneFile= async function(aFile){
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

infoPanel.prototype.readTwinsFilesContentAndImport=async function(files){
    var importTwins=[]
    var importRelations=[]
    for (var i = 0, f; f = files[i]; i++) {
        // Only process json files.
        if (f.type!="application/json") continue;
        try{
            var str= await this.readOneFile(f)
            var obj=JSON.parse(str)
            if(obj.twins) importTwins=importTwins.concat(obj.twins)
            if(obj.relations) importRelations=importRelations.concat(obj.relations)
        }catch(err){
            alert(err)
        }
    }

    function uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    var oldTwinID2NewID={}
    importTwins.forEach(oneTwin=>{
        var oldID= oneTwin["$dtId"]
        var newID=uuidv4();
        oldTwinID2NewID[oldID]=newID
        oneTwin["$dtId"]=newID
    })

    for(var i=importRelations.length-1;i>=0;i--){
        var oneRel=importRelations[i]
        if(oldTwinID2NewID[oneRel["$srcId"]]==null || oldTwinID2NewID[oneRel["obj"]["$targetId"]]==null){
            importRelations.splice(i,1)
        } else{
            oneRel["$srcId"]=oldTwinID2NewID[oneRel["$srcId"]]
            oneRel["obj"]["$targetId"]=oldTwinID2NewID[oneRel["obj"]["$targetId"]]
            oneRel["$relationshipId"]=uuidv4();
        }
    }


    try{
        var re = await msalHelper.callAPI("digitaltwin/batchImportTwins", "POST", {"twins":JSON.stringify(importTwins)})
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
        return;
    }

    re.DBTwins=JSON.parse(re.DBTwins)
    re.ADTTwins=JSON.parse(re.ADTTwins)
    re.DBTwins.forEach(DBTwin=>{ globalCache.storeSingleDBTwin(DBTwin) })
    var adtTwins=[]
    re.ADTTwins.forEach(ADTTwin=>{
        globalCache.storeSingleADTTwin(ADTTwin)
        adtTwins.push(ADTTwin)
    })

    this.broadcastMessage({ "message": "addNewTwins", "twinsInfo": adtTwins })

    //continue to import relations
    try{
        var relationsImported = await msalHelper.callAPI("digitaltwin/createRelations", "POST",  {actions:JSON.stringify(importRelations)})
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
    }
    globalCache.storeTwinRelationships_append(relationsImported)
    this.broadcastMessage({ "message": "drawAllRelations",info:relationsImported})

    var numOfTwins=adtTwins.length
    var numOfRelations=relationsImported.length
    var str="Add "+numOfTwins+ " node"+((numOfTwins<=1)?"":"s")+` (from ${importTwins.length})`
    str+=" and "+numOfRelations+" relationship"+((numOfRelations<=1)?"":"s")+` (from ${importRelations.length})`
    var confirmDialogDiv = new simpleConfirmDialog()
    confirmDialogDiv.show(
        { width: "400px" },
        {
            title: "Import Result"
            , content:str
            , buttons: [
                {
                    colorClass: "w3-gray", text: "Ok", "clickFunc": () => {
                        confirmDialogDiv.close()
                    }
                }
            ]
        }
    )
    
}

infoPanel.prototype.refreshInfomation=async function(){
    var twinIDs=[]
    this.selectedObjects.forEach(oneItem=>{  if(oneItem['$dtId']) twinIDs.push(oneItem['$dtId'])  })
    try{
        var twinsdata = await msalHelper.callAPI("digitaltwin/listTwinsForIDs", "POST", twinIDs)
        twinsdata.forEach(oneRe=>{
            var twinID= oneRe['$dtId']
            if(globalCache.storedTwins[twinID]!=null){
                for(var ind in oneRe)  globalCache.storeSingleADTTwin(oneRe[ind])
            }
        })
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
    }

    while(twinIDs.length>0){
        var smallArr= twinIDs.splice(0, 100);
        try{
            var data = await msalHelper.callAPI("digitaltwin/getRelationshipsFromTwinIDs", "POST", smallArr)
            if (data == "") continue;
            globalCache.storeTwinRelationships(data) //store them in global available array
            this.broadcastMessage({ "message": "drawAllRelations", info: data })
        } catch (e) {
            console.log(e)
            if(e.responseText) alert(e.responseText)
        }
    }
    //redraw infopanel if needed
    if(this.selectedObjects.length==1) this.rxMessage({ "message": "showInfoSelectedNodes", info: this.selectedObjects })

}


infoPanel.prototype.deleteSelected=async function(){
    var arr=this.selectedObjects;
    if(arr.length==0) return;
    var relationsArr=[]
    var twinIDArr=[]
    var twinIDs={}
    arr.forEach(element => {
        if (element['$sourceId']) relationsArr.push(element);
        else{
            twinIDArr.push(element['$dtId'])
            twinIDs[element['$dtId']]=1
        }
    });
    for(var i=relationsArr.length-1;i>=0;i--){ //clear those relationships that are going to be deleted after twins deleting
        var srcId=  relationsArr[i]['$sourceId']
        var targetId = relationsArr[i]['$targetId']
        if(twinIDs[srcId]!=null || twinIDs[targetId]!=null){
            relationsArr.splice(i,1)
        }
    }
    var confirmDialogDiv = new simpleConfirmDialog()
    var dialogStr=""
    var twinNumber=twinIDArr.length;
    var relationsNumber = relationsArr.length;
    if(twinNumber>0) dialogStr =  twinNumber+" twin"+((twinNumber>1)?"s":"") + " (with connected relations)"
    if(twinNumber>0 && relationsNumber>0) dialogStr+=" and additional "
    if(relationsNumber>0) dialogStr +=  relationsNumber+" relation"+((relationsNumber>1)?"s":"" )
    dialogStr+=" will be deleted. Please confirm"
    confirmDialogDiv.show(
        { width: "350px" },
        {
            title: "Confirm"
            , content:dialogStr
            , buttons: [
                {
                    colorClass: "w3-red w3-hover-pink", text: "Confirm", "clickFunc": async () => {
                        confirmDialogDiv.close()
                        this.DOM.empty()
                        this.drawButtons(null)
                        if (relationsArr.length > 0) await this.deleteRelations(relationsArr)
                        if (twinIDArr.length > 0) await this.deleteTwins(twinIDArr)
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
}

infoPanel.prototype.deleteTwins=async function(twinIDArr){   
    while(twinIDArr.length>0){
        var smallArr= twinIDArr.splice(0, 100);
        
        try{
            var result = await msalHelper.callAPI("digitaltwin/deleteTwins", "POST", {arr:smallArr})
            result.forEach((oneID)=>{
                delete globalCache.storedTwins[oneID]
                delete globalCache.storedOutboundRelationships[oneID]
            });
            this.broadcastMessage({ "message": "twinsDeleted",twinIDArr:result})
        }catch(e){
            console.log(e)
            if(e.responseText) alert(e.responseText)
        }
    }
}

infoPanel.prototype.deleteRelations=async function(relationsArr){
    var arr=[]
    relationsArr.forEach(oneRelation=>{
        arr.push({srcID:oneRelation['$sourceId'],relID:oneRelation['$relationshipId']})
    })
    try{
        var data = await msalHelper.callAPI("digitaltwin/deleteRelations", "POST", {"relations":arr})
        globalCache.storeTwinRelationships_remove(data)
        this.broadcastMessage({ "message": "relationsDeleted","relations":data})
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
    }
}

infoPanel.prototype.showOutBound=async function(){
    var arr=this.selectedObjects;
    var twinIDArr=[]
    arr.forEach(element => {
        if (element['$sourceId']) return;
        twinIDArr.push(element['$dtId'])
    });
    
    while(twinIDArr.length>0){
        var smallArr = twinIDArr.splice(0, 100);

        var knownTargetTwins = {}
        smallArr.forEach(oneID => {
            knownTargetTwins[oneID] = 1 //itself also is known
            var outBoundRelation = globalCache.storedOutboundRelationships[oneID]
            if (outBoundRelation) {
                outBoundRelation.forEach(oneRelation => {
                    var targetID = oneRelation["$targetId"]
                    if (globalCache.storedTwins[targetID] != null) knownTargetTwins[targetID] = 1
                })
            }
        })

        try{
            var data = await msalHelper.callAPI("digitaltwin/queryOutBound", "POST",  { arr: smallArr, "knownTargets": knownTargetTwins })
            //new twin's relationship should be stored as well
            globalCache.storeTwinRelationships(data.newTwinRelations)
            data.childTwinsAndRelations.forEach(oneSet=>{
                for(var ind in oneSet.childTwins){
                    var oneTwin=oneSet.childTwins[ind]
                    globalCache.storeSingleADTTwin(oneTwin)
                }
            })
            this.broadcastMessage({ "message": "drawTwinsAndRelations",info:data})
        }catch(e){
            console.log(e)
            if(e.responseText) alert(e.responseText)
        }
    }
}

infoPanel.prototype.showInBound=async function(){
    var arr=this.selectedObjects;
    var twinIDArr=[]
    arr.forEach(element => {
        if (element['$sourceId']) return;
        twinIDArr.push(element['$dtId'])
    });
    
    while(twinIDArr.length>0){
        var smallArr= twinIDArr.splice(0, 100);
        var knownSourceTwins = {}
        var IDDict = {}
        smallArr.forEach(oneID => {
            IDDict[oneID] = 1
            knownSourceTwins[oneID] = 1 //itself also is known
        })
        for (var twinID in globalCache.storedOutboundRelationships) {
            var relations = globalCache.storedOutboundRelationships[twinID]
            relations.forEach(oneRelation => {
                var targetID = oneRelation['$targetId']
                var srcID = oneRelation['$sourceId']
                if (IDDict[targetID] != null) {
                    if (globalCache.storedTwins[srcID] != null) knownSourceTwins[srcID] = 1
                }
            })
        }

        try{
            var data = await msalHelper.callAPI("digitaltwin/queryInBound", "POST",  { arr: smallArr, "knownSources": knownSourceTwins })
            //new twin's relationship should be stored as well
            globalCache.storeTwinRelationships(data.newTwinRelations)
            data.childTwinsAndRelations.forEach(oneSet=>{
                for(var ind in oneSet.childTwins){
                    var oneTwin=oneSet.childTwins[ind]
                    globalCache.storeSingleADTTwin(oneTwin)
                }
            })
            this.broadcastMessage({ "message": "drawTwinsAndRelations",info:data})
        }catch(e){
            console.log(e)
            if(e.responseText) alert(e.responseText)
        }
    }
}

infoPanel.prototype.drawMultipleObj=function(){
    var numOfEdge = 0;
    var numOfNode = 0;
    var arr=this.selectedObjects;
    if(arr==null) return;
    arr.forEach(element => {
        if (element['$sourceId']) numOfEdge++
        else numOfNode++
    });
    var textDiv=$("<label style='display:block;margin-top:10px'></label>")
    textDiv.text(numOfNode+ " node"+((numOfNode<=1)?"":"s")+", "+numOfEdge+" relationship"+((numOfEdge<=1)?"":"s"))
    this.DOM.append(textDiv)
}

infoPanel.prototype.drawStaticInfo=function(parent,jsonInfo,paddingTop,fontSize){
    for(var ind in jsonInfo){
        var keyDiv= $("<label style='display:block'><div class='w3-border' style='background-color:#f6f6f6;display:inline;padding:.1em .3em .1em .3em;margin-right:.3em'>"+ind+"</div></label>")
        keyDiv.css({"fontSize":fontSize,"color":"darkGray"})
        parent.append(keyDiv)
        keyDiv.css("padding-top",paddingTop)

        var contentDOM=$("<label></label>")
        if(typeof(jsonInfo[ind])==="object") {
            contentDOM.css("display","block")
            contentDOM.css("padding-left","1em")
            this.drawStaticInfo(contentDOM,jsonInfo[ind],".5em",fontSize)
        }else {
            contentDOM.css("padding-top",".2em")
            contentDOM.text(jsonInfo[ind])
        }
        contentDOM.css({"fontSize":fontSize,"color":"black"})
        keyDiv.append(contentDOM)
    }
}

infoPanel.prototype.drawEditable=function(parent,jsonInfo,originElementInfo,pathArr,isNewTwin){
    if(jsonInfo==null) return;
    for(var ind in jsonInfo){
        var keyDiv= $("<label style='display:block'><div style='display:inline;padding:.1em .3em .1em .3em; font-weight:bold;color:black'>"+ind+"</div></label>")
        if(isNewTwin){
            if(ind=="$dtId") {
                parent.prepend(keyDiv)
                keyDiv.attr('id','NEWTWIN_IDLabel');
            }
            else parent.append(keyDiv)
        }else{
            parent.append(keyDiv)
        }
        
        keyDiv.css("padding-top",".3em") 

        var contentDOM=$("<label style='padding-top:.2em'></label>")
        var newPath=pathArr.concat([ind])
        if(Array.isArray(jsonInfo[ind])){
            this.drawDropdownOption(contentDOM,newPath,jsonInfo[ind],isNewTwin,originElementInfo)
        }else if(typeof(jsonInfo[ind])==="object") {
            contentDOM.css("display","block")
            contentDOM.css("padding-left","1em")
            this.drawEditable(contentDOM,jsonInfo[ind],originElementInfo,newPath,isNewTwin)
        }else {
            var aInput=$('<input type="text" style="padding:2px;width:50%;outline:none;display:inline" placeholder="type: '+jsonInfo[ind]+'"/>').addClass("w3-input w3-border");  
            contentDOM.append(aInput)
            var val=this.searchValue(originElementInfo,newPath)
            if(val!=null) aInput.val(val)
            aInput.data("path", newPath)
            aInput.data("dataType", jsonInfo[ind])
            aInput.change((e)=>{
                this.editDTProperty(originElementInfo,$(e.target).data("path"),$(e.target).val(),$(e.target).data("dataType"),isNewTwin)
            })
        }
        keyDiv.append(contentDOM)
    }
}

infoPanel.prototype.drawDropdownOption=function(contentDOM,newPath,valueArr,isNewTwin,originElementInfo){
    var aSelectMenu=new simpleSelectMenu("",{buttonCSS:{"padding":"4px 16px"}})
    contentDOM.append(aSelectMenu.DOM)
    aSelectMenu.DOM.data("path", newPath)
    valueArr.forEach((oneOption)=>{
        var str =oneOption["displayName"]  || oneOption["enumValue"] 
        aSelectMenu.addOption(str)
    })
    aSelectMenu.callBack_clickOption=(optionText,optionValue,realMouseClick)=>{
        aSelectMenu.changeName(optionText)
        if(realMouseClick) this.editDTProperty(originElementInfo,aSelectMenu.DOM.data("path"),optionValue,"string",isNewTwin)
    }
    var val=this.searchValue(originElementInfo,newPath)
    if(val!=null){
        aSelectMenu.triggerOptionValue(val)
    }    
}

infoPanel.prototype.editDTProperty=async function(originElementInfo,path,newVal,dataType,isNewTwin){
    if(["double","boolean","float","integer","long"].includes(dataType)) newVal=Number(newVal)

    //{ "op": "add", "path": "/x", "value": 30 }
    if(isNewTwin){
        this.updateOriginObjectValue(originElementInfo,path,newVal)
        return;
    }
    if(path.length==1){
        var str=""
        path.forEach(segment=>{str+="/"+segment})
        var jsonPatch=[ { "op": "add", "path": str, "value": newVal} ]
    }else{
        //it is a property inside a object type of root property,update the whole root property
        var rootProperty=path[0]
        var patchValue= originElementInfo[rootProperty]
        if(patchValue==null) patchValue={}
        else patchValue=JSON.parse(JSON.stringify(patchValue)) //make a copy
        this.updateOriginObjectValue(patchValue,path.slice(1),newVal)
        
        var jsonPatch=[ { "op": "add", "path": "/"+rootProperty, "value": patchValue} ]
    }

    if(originElementInfo["$dtId"]){ //edit a node property
        var twinID = originElementInfo["$dtId"]
        var payLoad={"jsonPatch":JSON.stringify(jsonPatch),"twinID":twinID}
    }else if(originElementInfo["$relationshipId"]){ //edit a relationship property
        var twinID = originElementInfo["$sourceId"]
        var relationshipID = originElementInfo["$relationshipId"]
        var payLoad={"jsonPatch":JSON.stringify(jsonPatch),"twinID":twinID,"relationshipID":relationshipID}
    }
    
    
    try{
        await msalHelper.callAPI("digitaltwin/changeAttribute", "POST", payLoad)
        this.updateOriginObjectValue(originElementInfo,path,newVal)
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
    }
    
}

infoPanel.prototype.updateOriginObjectValue=function(nodeInfo,pathArr,newVal){
    if(pathArr.length==0) return;
    var theJson=nodeInfo
    for(var i=0;i<pathArr.length;i++){
        var key=pathArr[i]

        if(i==pathArr.length-1){
            theJson[key]=newVal
            break
        }
        if(theJson[key]==null) theJson[key]={}
        theJson=theJson[key]
    }
    return
}

infoPanel.prototype.searchValue=function(originElementInfo,pathArr){
    if(pathArr.length==0) return null;
    var theJson=originElementInfo
    for(var i=0;i<pathArr.length;i++){
        var key=pathArr[i]
        theJson=theJson[key]
        if(theJson==null) return null;
    }
    return theJson //it should be the final value
}

module.exports = new infoPanel();
},{"../msalHelper":13,"../sharedSourceFiles/simpleConfirmDialog":15,"../sharedSourceFiles/simpleSelectMenu":16,"./globalCache":3,"./modelAnalyzer":6}],5:[function(require,module,exports){
const startSelectionDialog = require("./startSelectionDialog")
const modelManagerDialog = require("./modelManagerDialog")
const editLayoutDialog= require("./editLayoutDialog")
const simpleSelectMenu= require("../sharedSourceFiles/simpleSelectMenu")
const globalCache = require("./globalCache")
const moduleSwitchDialog=require("../sharedSourceFiles/moduleSwitchDialog")

function mainToolbar() {
}

mainToolbar.prototype.render = function () {
    $("#mainToolBar").addClass("w3-bar w3-red")
    $("#mainToolBar").css({"z-index":100,"overflow":"visible"})

    this.switchADTInstanceBtn=$('<a class="w3-bar-item w3-button" href="#">Source</a>')
    this.modelIOBtn=$('<a class="w3-bar-item w3-button" href="#">Models</a>')
    this.showForgeViewBtn=$('<a class="w3-bar-item w3-button w3-hover-none w3-text-light-grey w3-hover-text-light-grey" style="opacity:.35" href="#">ForgeView</a>')
    this.showGISViewBtn=$('<a class="w3-bar-item w3-button w3-hover-none w3-text-light-grey w3-hover-text-light-grey" style="opacity:.35" href="#">GISView</a>')
    this.editLayoutBtn=$('<a class="w3-bar-item w3-button" href="#"><i class="fa fa-edit"></i></a>')

    this.testSignalRBtn=$('<a class="w3-bar-item w3-button w3-amber" href="#">Test SignalR</a>')
    this.testSendSignalRBtn=$('<a class="w3-bar-item w3-button w3-amber" href="#">send SignalR message</a>')


    this.switchLayoutSelector=new simpleSelectMenu("Layout")

    $("#mainToolBar").empty()
    $("#mainToolBar").append(moduleSwitchDialog.modulesSidebar)
    $("#mainToolBar").append(moduleSwitchDialog.modulesSwitchButton, this.switchADTInstanceBtn,this.modelIOBtn,this.showForgeViewBtn,this.showGISViewBtn
        ,this.switchLayoutSelector.DOM,this.editLayoutBtn)
        //,this.testSignalRBtn,this.testSendSignalRBtn

    this.switchADTInstanceBtn.on("click",()=>{ startSelectionDialog.popup() })
    this.modelIOBtn.on("click",()=>{ modelManagerDialog.popup() })
    this.editLayoutBtn.on("click",()=>{ editLayoutDialog.popup() })


    this.testSendSignalRBtn.on("click",async ()=>{
        const msalHelper=require("../msalHelper")
        var re = await msalHelper.callAzureFunctionsService("messages","POST",{
            recipient: "5eb81f5f-fd9e-481d-996b-4d0b9536f477",
            text: "how do you do"
          })
    })
    this.testSignalRBtn.on("click",async ()=>{
        const msalHelper=require("../msalHelper")
        var signalRInfo = await msalHelper.callAzureFunctionsService("negotiate?name=ff","GET")
        const connection = new signalR.HubConnectionBuilder()
        .withUrl(signalRInfo.url, {accessTokenFactory: () => signalRInfo.accessToken})
        //.configureLogging(signalR.LogLevel.Information)
        .configureLogging(signalR.LogLevel.Warning)
        .build();
        console.log(signalRInfo.accessToken)

        connection.on('newMessage', (message)=>{
            console.log(message)
        });
        connection.onclose(() => console.log('disconnected'));
        console.log('connecting...');
        connection.start()
          .then(() => console.log('connected!'))
          .catch(console.error);
    })


    this.switchLayoutSelector.callBack_clickOption=(optionText,optionValue)=>{
        globalCache.currentLayoutName=optionValue
        this.broadcastMessage({ "message": "layoutChange"})
        if(optionValue=="[NA]") this.switchLayoutSelector.changeName("Layout","")
        else this.switchLayoutSelector.changeName("Layout:",optionText)
    }
}

mainToolbar.prototype.updateLayoutSelector = function () {
    var curSelect=this.switchLayoutSelector.curSelectVal
    this.switchLayoutSelector.clearOptions()
    this.switchLayoutSelector.addOption('[No Layout Specified]','[NA]')

    for (var ind in globalCache.layoutJSON) {
        this.switchLayoutSelector.addOption(ind)
    }

    if(curSelect!=null && this.switchLayoutSelector.findOption(curSelect)==null) this.switchLayoutSelector.changeName("Layout","")
}

mainToolbar.prototype.rxMessage=function(msgPayload){
    if(msgPayload.message=="layoutsUpdated") {
        this.updateLayoutSelector()
    }
}

module.exports = new mainToolbar();
},{"../msalHelper":13,"../sharedSourceFiles/moduleSwitchDialog":14,"../sharedSourceFiles/simpleSelectMenu":16,"./editLayoutDialog":2,"./globalCache":3,"./modelManagerDialog":8,"./startSelectionDialog":9}],6:[function(require,module,exports){
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
},{}],7:[function(require,module,exports){
const modelAnalyzer=require("./modelAnalyzer")
const simpleSelectMenu= require("../sharedSourceFiles/simpleSelectMenu")
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
},{"../msalHelper":13,"../sharedSourceFiles/simpleSelectMenu":16,"./globalCache":3,"./modelAnalyzer":6}],8:[function(require,module,exports){
const modelAnalyzer=require("./modelAnalyzer")
const simpleTree= require("../sharedSourceFiles/simpleTree")
const simpleConfirmDialog = require("../sharedSourceFiles/simpleConfirmDialog")
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
    var importPicBtn = $('<button class="w3-button w3-light-gray w3-hover-amber w3-border-right">Upload Avarta</button>')
    var actualImportPicBtn =$('<input type="file" name="img" style="display:none"></input>')
    var clearAvartaBtn = $('<button class="w3-button w3-light-gray w3-hover-pink w3-border-right">Clear Avarta</button>')
    this.modelButtonBar.append(delBtn,importPicBtn,actualImportPicBtn,clearAvartaBtn)

    importPicBtn.on("click", ()=>{
        actualImportPicBtn.trigger('click');
    });

    actualImportPicBtn.change(async (evt)=>{
        var files = evt.target.files; // FileList object
        var theFile=files[0]
        
        if(theFile.type=="image/svg+xml"){
            var str= await this.readOneFile(theFile)
            var dataUrl='data:image/svg+xml;utf8,' + encodeURIComponent(str);
        }else if(theFile.type.match('image.*')){
            var dataUrl= await this.resizeImgFile(theFile,70)
        } else {
            var confirmDialogDiv=new simpleConfirmDialog()
            confirmDialogDiv.show({ width: "200px" },
                {
                    title: "Note"
                    , content: "Please import image file (png,jpg,svg and so on)"
                    , buttons: [{colorClass:"w3-gray",text:"Ok","clickFunc":()=>{confirmDialogDiv.close()}}]
                }
            )
        }
        if(this.avartaImg) this.avartaImg.attr("src",dataUrl)

        var visualJson=globalCache.visualDefinition["default"]
        if(!visualJson[modelID]) visualJson[modelID]={}
        visualJson[modelID].avarta=dataUrl
        this.saveVisualDefinition()
        this.broadcastMessage({ "message": "visualDefinitionChange", "modelID":modelID,"avarta":dataUrl })
        this.refreshModelTreeLabel()
        actualImportPicBtn.val("")
    })

    clearAvartaBtn.on("click", ()=>{
        var visualJson=globalCache.visualDefinition["default"]
        if(visualJson[modelID]) delete visualJson[modelID].avarta 
        if(this.avartaImg) this.avartaImg.removeAttr('src');
        this.saveVisualDefinition()
        this.broadcastMessage({ "message": "visualDefinitionChange", "modelID":modelID,"noAvarta":true })
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
    for(var ind in modelJson.validRelationships){
        this.addOneVisualizationRow(modelID,leftPart,ind)
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
},{"../msalHelper":13,"../sharedSourceFiles/simpleConfirmDialog":15,"../sharedSourceFiles/simpleTree":17,"./globalCache":3,"./modelAnalyzer":6,"./modelEditorDialog":7}],9:[function(require,module,exports){
const globalAppSettings = require("../globalAppSettings")
const msalHelper=require("../msalHelper")
const { DBTwinsArr } = require("./globalCache")
const globalCache=require("./globalCache")

function startSelectionDialog() {
    if(!this.DOM){
        this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:99" class="w3-card-2"></div>')
        $("body").append(this.DOM)
        this.DOM.hide()
    }
}

startSelectionDialog.prototype.popup = async function() {
    this.DOM.show()
    this.DOM.empty()
    this.contentDOM = $('<div style="width:665px"></div>')
    this.DOM.append(this.contentDOM)
    this.contentDOM.append($('<div style="height:40px" class="w3-bar w3-red"><div class="w3-bar-item" style="font-size:1.5em">Select Twins</div></div>'))
    var closeButton = $('<button class="w3-bar-item w3-button w3-right" style="font-size:2em;padding-top:4px">×</button>')
    this.contentDOM.children(':first').append(closeButton)

    this.buttonHolder = $("<div style='height:100%'></div>")
    this.contentDOM.children(':first').append(this.buttonHolder)
    closeButton.on("click", () => {
        this.useStartSelection("append")
        this.closeDialog() 
    })

    var replaceButton = $('<button class="w3-button w3-card w3-deep-orange w3-hover-green" style="height:100%; margin-right:8px">Replace All Data</button>')
    var appendButton = $('<button class="w3-button w3-card w3-deep-orange w3-hover-green" style="height:100%">Append Data</button>')

    replaceButton.on("click", () => { this.useStartSelection("replace") })
    appendButton.on("click", () => { this.useStartSelection("append") })
    this.buttonHolder.append(replaceButton, appendButton)

    var panelHeight=450
    var row2=$('<div class="w3-cell-row"></div>')
    this.contentDOM.append(row2)
    var leftSpan=$('<div style="padding:5px;width:230px;padding-right:5px;overflow:hidden"></div>')
    row2.append(leftSpan)
    this.leftSpan=leftSpan

    var rightSpan=$('<div class="w3-container w3-cell" style="padding-top:10px;"></div>')
    row2.append(rightSpan) 
    rightSpan.append($('<div class="w3-container w3-card" style="color:gray;height:'+(panelHeight-10)+'px;overflow:auto;width:410px;"></div>'))
    var selectedTwinsDOM=$("<table style='width:100%'></table>")
    selectedTwinsDOM.css({"border-collapse":"collapse"})
    rightSpan.children(':first').append(selectedTwinsDOM)
    this.selectedTwinsDOM=selectedTwinsDOM 

    this.leftSpan.append($('<div class="w3-bar"><div class="w3-bar-item w3-tooltip" style="font-size:1.2em;padding-left:2px;font-weight:bold;color:gray">Select Twins from<p style="position:absolute;text-align:left;font-weight:normal;top:-10px;width:200px" class="w3-text w3-tag w3-tiny">choose one or more models</p></div></div>'))

    this.modelsCheckBoxes=$('<form class="w3-container w3-border" style="height:'+(panelHeight-40)+'px;overflow:auto"></form>')
    leftSpan.append(this.modelsCheckBoxes)
    this.fillAvailableModels()

    this.listTwins()
}

startSelectionDialog.prototype.closeDialog=function(){
    this.DOM.hide()
    this.broadcastMessage({ "message": "startSelectionDialog_closed"})
}

startSelectionDialog.prototype.fillAvailableModels = function() {
    this.modelsCheckBoxes.append('<input class="w3-check" type="checkbox" id="ALL"><label style="padding-left:5px"><b>ALL</b></label><p/>')
    globalCache.DBModelsArr.forEach(oneModel=>{
        var modelName=oneModel["displayName"]
        var modelID=oneModel["id"]
        this.modelsCheckBoxes.append(`<input class="w3-check" type="checkbox" id="${modelID}"><label style="padding-left:5px">${modelName}</label><p/>`)
    })
    this.modelsCheckBoxes.on("change",(evt)=>{
        if($(evt.target).attr("id")=="ALL"){
            //select all the other input
            var val=$(evt.target).prop("checked")
            this.modelsCheckBoxes.children('input').each(function () {
                $(this).prop("checked",val)
            });
        }
        this.listTwins()
    })
}

startSelectionDialog.prototype.getSelectedTwins=function(){
    var reArr=[]
    var chosenModels={}
    this.modelsCheckBoxes.children('input').each(function () {
        if(!$(this).prop("checked")) return;
        if($(this).attr("id")=="ALL") return;
        chosenModels[$(this).attr("id")]=1
    });
    globalCache.DBTwinsArr.forEach(aTwin=>{
        if(chosenModels[aTwin["modelID"]])  reArr.push(aTwin)
    })
    return reArr;
}

startSelectionDialog.prototype.listTwins=function(){
    this.selectedTwinsDOM.empty()
    var tr=$('<tr><td style="border-right:solid 1px lightgrey;border-bottom:solid 1px lightgrey;font-weight:bold">ID</td><td style="border-bottom:solid 1px lightgrey;font-weight:bold">MODEL</td></tr>')
    this.selectedTwinsDOM.append(tr)

    var selectedTwins=this.getSelectedTwins()
    selectedTwins.forEach(aTwin=>{
        var tr=$('<tr><td style="border-right:solid 1px lightgrey;border-bottom:solid 1px lightgrey">'+aTwin["displayName"]+'</td><td style="border-bottom:solid 1px lightgrey">'+aTwin['modelID']+'</td></tr>')
        this.selectedTwinsDOM.append(tr)
    })
    if(selectedTwins.length==0){
        var tr=$('<tr><td style="color:gray">zero record</td><td></td></tr>')
        this.selectedTwinsDOM.append(tr)    
    }
}


startSelectionDialog.prototype.useStartSelection=function(action){
    var selectedTwins=this.getSelectedTwins()
    var twinIDs=[]
    selectedTwins.forEach(aTwin=>{twinIDs.push(aTwin["id"])})

    var modelIDs=[]
    globalCache.DBModelsArr.forEach(oneModel=>{modelIDs.push(oneModel["id"])})

    this.broadcastMessage({ "message": "startSelection_"+action, "twinIDs": twinIDs,"modelIDs":modelIDs })
    this.closeDialog()
}

module.exports = new startSelectionDialog();
},{"../globalAppSettings":12,"../msalHelper":13,"./globalCache":3}],10:[function(require,module,exports){
'use strict';

const modelAnalyzer = require("./modelAnalyzer");
const simpleSelectMenu = require("../sharedSourceFiles/simpleSelectMenu")
const simpleConfirmDialog = require("../sharedSourceFiles/simpleConfirmDialog")
const globalCache = require("./globalCache")
const msalHelper=require("../msalHelper")

function topologyDOM(DOM){
    this.DOM=DOM
    this.defaultNodeSize=30
    this.nodeSizeModelAdjustmentRatio={}
}

topologyDOM.prototype.init=function(){
    cytoscape.warnings(false)  
    this.core = cytoscape({
        container:  this.DOM[0], // container to render in

        // initial viewport state:
        zoom: 1,
        pan: { x: 0, y: 0 },

        // interaction options:
        minZoom: 0.1,
        maxZoom: 10,
        zoomingEnabled: true,
        userZoomingEnabled: true,
        panningEnabled: true,
        userPanningEnabled: true,
        boxSelectionEnabled: true,
        selectionType: 'single',
        touchTapThreshold: 8,
        desktopTapThreshold: 4,
        autolock: false,
        autoungrabify: false,
        autounselectify: false,

        // rendering options:
        headless: false,
        styleEnabled: true,
        hideEdgesOnViewport: false,
        textureOnViewport: false,
        motionBlur: false,
        motionBlurOpacity: 0.2,
        wheelSensitivity: 0.3,
        pixelRatio: 'auto',

        elements: [], // list of graph elements to start with

        style: [ // the stylesheet for the graph
            {
                selector: 'node',
                style: {
                    "width":this.defaultNodeSize,"height":this.defaultNodeSize,
                    'label': 'data(id)',
                    'opacity':0.9,
                    'font-size':"12px",
                    'font-family':'Geneva, Arial, Helvetica, sans-serif'
                    //,'background-image': function(ele){ return "images/cat.png"; }
                    //,'background-fit':'contain' //cover
                    //'background-color': function( ele ){ return ele.data('bg') }
                    ,'background-width':'70%'
                    ,'background-height':'70%'
                }
            },
            {
                selector: 'edge',
                style: {
                    'width':2,
                    'line-color': '#888',
                    'target-arrow-color': '#555',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier',
                    'arrow-scale':0.6
                }
            },
            {selector: 'edge:selected',
            style: {
                'width': 3,
                'line-color': 'red',
                'target-arrow-color': 'red',
                'source-arrow-color': 'red'
            }},
            {selector: 'node:selected',
            style: {
                'border-color':"red",
                'border-width':2,
                'background-color': 'Gray'
            }},
            {selector: 'node.hover',
            style: {
                'background-blacken':0.5
            }}
            
            ,{selector: 'edge.hover',
            style: {
                'width':5
            }}
            
        ]
    });

    //cytoscape edge editing plug-in
    this.core.edgeEditing({
        undoable: true,
        bendRemovalSensitivity: 16,
        enableMultipleAnchorRemovalOption: true,
        stickyAnchorTolerence: 20,
        anchorShapeSizeFactor: 5,
        enableAnchorSizeNotImpactByZoom:true,
        enableRemoveAnchorMidOfNearLine:false,
        enableCreateAnchorOnDrag:false
    });

    
    this.core.boxSelectionEnabled(true)


    this.core.on('tapselect', ()=>{this.selectFunction()});
    this.core.on('tapunselect', ()=>{this.selectFunction()});

    this.core.on('boxend',(e)=>{//put inside boxend event to trigger only one time, and repleatly after each box select
        this.core.one('boxselect',()=>{this.selectFunction()})
    })

    this.core.on('cxttap',(e)=>{
        this.cancelTargetNodeMode()
    })

    this.core.on('mouseover',e=>{

        this.mouseOverFunction(e)
    })
    this.core.on('mouseout',e=>{
        this.mouseOutFunction(e)
    })
    
    this.core.on('zoom',(e)=>{
        var fs=this.getFontSizeInCurrentZoom();
        var dimension=this.getNodeSizeInCurrentZoom();
        this.core.style()
            .selector('node')
            .style({ 'font-size': fs, width: dimension, height: dimension })
            .update()
        for (var modelID in this.nodeSizeModelAdjustmentRatio) {
            var newDimension = Math.ceil(this.nodeSizeModelAdjustmentRatio[modelID] * dimension)
            this.core.style()
                .selector('node[modelID = "' + modelID + '"]')
                .style({ width: newDimension, height: newDimension })
                .update()
        }
        this.core.style()
            .selector('node:selected')
            .style({ 'border-width': Math.ceil(dimension / 15) })
            .update()
    })

    var instance = this.core.edgeEditing('get');
    var tapdragHandler=(e) => {
        instance.keepAnchorsAbsolutePositionDuringMoving()
        if(e.target.isNode && e.target.isNode()) this.draggingNode=e.target
        this.smartPositionNode(e.position)
    }
    var setOneTimeGrab = () => {
        this.core.once("grab", (e) => {
            var draggingNodes = this.core.collection()
            if (e.target.isNode()) draggingNodes.merge(e.target)
            var arr = this.core.$(":selected")
            arr.forEach((ele) => {
                if (ele.isNode()) draggingNodes.merge(ele)
            })
            instance.storeAnchorsAbsolutePosition(draggingNodes)
            this.core.on("tapdrag",tapdragHandler )
            setOneTimeFree()
        })
    }
    var setOneTimeFree = () => {
        this.core.once("free", (e) => {
            var instance = this.core.edgeEditing('get');
            instance.resetAnchorsAbsolutePosition()
            this.draggingNode=null
            setOneTimeGrab()
            this.core.removeListener("tapdrag",tapdragHandler)
        })
    }
    setOneTimeGrab()
    this.core.trigger("zoom")
}

topologyDOM.prototype.smartPositionNode = function (mousePosition) {
    var zoomLevel=this.core.zoom()
    if(!this.draggingNode) return
    //comparing nodes set: its connectfrom nodes and their connectto nodes, its connectto nodes and their connectfrom nodes
    var incomers=this.draggingNode.incomers()
    var outerFromIncom= incomers.outgoers()
    var outer=this.draggingNode.outgoers()
    var incomFromOuter=outer.incomers()
    var monitorSet=incomers.union(outerFromIncom).union(outer).union(incomFromOuter).filter('node').unmerge(this.draggingNode)

    var returnExpectedPos=(diffArr,posArr)=>{
        var minDistance=Math.min(...diffArr)
        if(minDistance*zoomLevel < 10)  return posArr[diffArr.indexOf(minDistance)]
        else return null;
    }

    var xDiff=[]
    var xPos=[]
    var yDiff=[]
    var yPos=[]
    monitorSet.forEach((ele)=>{
        xDiff.push(Math.abs(ele.position().x-mousePosition.x))
        xPos.push(ele.position().x)
        yDiff.push(Math.abs(ele.position().y-mousePosition.y))
        yPos.push(ele.position().y)
    })
    var prefX=returnExpectedPos(xDiff,xPos)
    var prefY=returnExpectedPos(yDiff,yPos)
    if(prefX!=null) {
        this.draggingNode.position('x', prefX);
    }
    if(prefY!=null) {
        this.draggingNode.position('y', prefY);
    }
    //console.log("----")
    //monitorSet.forEach((ele)=>{console.log(ele.id())})
    //console.log(monitorSet.size())
}

topologyDOM.prototype.mouseOverFunction= function (e) {
    if(!e.target.data) return
    
    var info=e.target.data().originalInfo
    if(info==null) return;
    if(this.lastHoverTarget) this.lastHoverTarget.removeClass("hover")
    this.lastHoverTarget=e.target
    e.target.addClass("hover")
    this.broadcastMessage({ "message": "showInfoSelectedNodes", "info": [info] })
}

topologyDOM.prototype.mouseOutFunction= function (e) {
    if(globalCache.showingCreateTwinModelID){
        this.broadcastMessage({ "message": "showInfoGroupNode", "info": {"@id":globalCache.showingCreateTwinModelID} })
    }else{
        this.selectFunction()
    }
    if(this.lastHoverTarget){
        this.lastHoverTarget.removeClass("hover")
        this.lastHoverTarget=null;
    } 

}

topologyDOM.prototype.selectFunction = function () {
    var arr = this.core.$(":selected")
    if (arr.length == 0) return
    var re = []
    arr.forEach((ele) => { re.push(ele.data().originalInfo) })
    globalCache.showingCreateTwinModelID=null; 
    this.broadcastMessage({ "message": "showInfoSelectedNodes", info: re })

    //for debugging purpose
    //arr.forEach((ele)=>{
    //  console.log("")
    //})
}

topologyDOM.prototype.getFontSizeInCurrentZoom=function(){
    var curZoom=this.core.zoom()
    if(curZoom>1){
        var maxFS=12
        var minFS=5
        var ratio= (maxFS/minFS-1)/9*(curZoom-1)+1
        var fs=Math.ceil(maxFS/ratio)
    }else{
        var maxFS=120
        var minFS=12
        var ratio= (maxFS/minFS-1)/9*(1/curZoom-1)+1
        var fs=Math.ceil(minFS*ratio)
    }
    return fs;
}

topologyDOM.prototype.getNodeSizeInCurrentZoom=function(){
    var curZoom=this.core.zoom()
    if(curZoom>1){//scale up but not too much
        var ratio= (curZoom-1)*(2-1)/9+1
        return Math.ceil(this.defaultNodeSize/ratio)
    }else{
        var ratio= (1/curZoom-1)*(4-1)/9+1
        return Math.ceil(this.defaultNodeSize*ratio)
    }
}


topologyDOM.prototype.updateModelAvarta=function(modelID,dataUrl){
    try{
        this.core.style() 
        .selector('node[modelID = "'+modelID+'"]')
        .style({'background-image': dataUrl})
        .update()   
    }catch(e){
        
    }
    
}
topologyDOM.prototype.updateModelTwinColor=function(modelID,colorCode){
    this.core.style()
        .selector('node[modelID = "'+modelID+'"]')
        .style({'background-color': colorCode})
        .update()   
}

topologyDOM.prototype.updateModelTwinShape=function(modelID,shape){
    this.core.style()
        .selector('node[modelID = "'+modelID+'"]')
        .style({'shape': shape})
        .update()   
}
topologyDOM.prototype.updateModelTwinDimension=function(modelID,dimensionRatio){
    this.nodeSizeModelAdjustmentRatio[modelID]=parseFloat(dimensionRatio)
    this.core.trigger("zoom")
}

topologyDOM.prototype.updateRelationshipColor=function(srcModelID,relationshipName,colorCode){
    this.core.style()
        .selector('edge[sourceModel = "'+srcModelID+'"][relationshipName = "'+relationshipName+'"]')
        .style({'line-color': colorCode})
        .update()   
}

topologyDOM.prototype.updateRelationshipShape=function(srcModelID,relationshipName,shape){
    this.core.style()
        .selector('edge[sourceModel = "'+srcModelID+'"][relationshipName = "'+relationshipName+'"]')
        .style({'line-style': shape})
        .update()   
}
topologyDOM.prototype.updateRelationshipWidth=function(srcModelID,relationshipName,edgeWidth){
    this.core.style()
        .selector('edge[sourceModel = "'+srcModelID+'"][relationshipName = "'+relationshipName+'"]')
        .style({'width':parseFloat(edgeWidth)})
        .update()   
    this.core.style()
        .selector('edge:selected[sourceModel = "'+srcModelID+'"][relationshipName = "'+relationshipName+'"]')
        .style({'width':parseFloat(edgeWidth)+1,'line-color': 'red'})
        .update()   
    this.core.style()
        .selector('edge.hover[sourceModel = "'+srcModelID+'"][relationshipName = "'+relationshipName+'"]')
        .style({'width':parseFloat(edgeWidth)+2})
        .update()   
}

topologyDOM.prototype.deleteRelations=function(relations){
    relations.forEach(oneRelation=>{
        var srcID=oneRelation["srcID"]
        var relationID=oneRelation["relID"]
        var theNodeName=globalCache.twinIDMapToDisplayName[srcID]
        var theNode=this.core.filter('[id = "'+theNodeName+'"]');
        var edges=theNode.connectedEdges().toArray()
        for(var i=0;i<edges.length;i++){
            var anEdge=edges[i]
            if(anEdge.data("originalInfo")["$relationshipId"]==relationID){
                anEdge.remove()
                break
            }
        }
    })   
}


topologyDOM.prototype.deleteTwins=function(twinIDArr){
    twinIDArr.forEach(twinID=>{
        var twinDisplayName=globalCache.twinIDMapToDisplayName[twinID]
        this.core.$('[id = "'+twinDisplayName+'"]').remove()
    })   
}

topologyDOM.prototype.animateANode=function(twin){
    var curDimension= twin.width()
    twin.animate({
        style: { 'height': curDimension*2,'width': curDimension*2 },
        duration: 200
    });

    setTimeout(()=>{
        twin.animate({
            style: { 'height': curDimension,'width': curDimension },
            duration: 200
            ,complete:()=>{
                twin.removeStyle() //must remove the style after animation, otherwise they will have their own style
            }
        });
    },200)
}

topologyDOM.prototype.drawTwins=function(twinsData,animation){
    var arr=[]
    for(var i=0;i<twinsData.length;i++){
        var originalInfo=twinsData[i];
        var newNode={data:{},group:"nodes"}
        newNode.data["originalInfo"]= originalInfo;
        newNode.data["id"]=originalInfo['displayName']
        var modelID=originalInfo['$metadata']['$model']
        newNode.data["modelID"]=modelID
        arr.push(newNode)
    }

    var eles = this.core.add(arr)
    if(eles.size()==0) return eles
    this.noPosition_grid(eles)
    if(animation){
        eles.forEach((ele)=>{ this.animateANode(ele) })
    }

    //if there is currently a layout there, apply it
    this.applyNewLayout()

    return eles
}

topologyDOM.prototype.drawRelations=function(relationsData){
    var relationInfoArr=[]
    for(var i=0;i<relationsData.length;i++){
        var originalInfo=relationsData[i];
        
        var theID=originalInfo['$relationshipName']+"_"+originalInfo['$relationshipId']
        var aRelation={data:{},group:"edges"}
        aRelation.data["originalInfo"]=originalInfo
        aRelation.data["id"]=theID
        aRelation.data["source"]=globalCache.twinIDMapToDisplayName[originalInfo['$sourceId']]
        aRelation.data["target"]=globalCache.twinIDMapToDisplayName[originalInfo['$targetId']]


        if(this.core.$("#"+aRelation.data["source"]).length==0 || this.core.$("#"+aRelation.data["target"]).length==0) continue
        var sourceNode=this.core.$("#"+aRelation.data["source"])
        var sourceModel=sourceNode[0].data("originalInfo")['$metadata']['$model']
        
        //add additional source node information to the original relationship information
        originalInfo['sourceModel']=sourceModel
        aRelation.data["sourceModel"]=sourceModel
        aRelation.data["relationshipName"]=originalInfo['$relationshipName']

        var existEdge=this.core.$('edge[id = "'+theID+'"]')
        if(existEdge.size()>0) {
            existEdge.data("originalInfo",originalInfo)
            continue;  //no need to draw it
        }

        relationInfoArr.push(aRelation)
    }
    if(relationInfoArr.length==0) return null;

    var edges=this.core.add(relationInfoArr)
    return edges
}

topologyDOM.prototype.reviewStoredRelationshipsToDraw=function(){
    //check the storedOutboundRelationships again and maybe some of them can be drawn now since targetNode is available
    var storedRelationArr=[]
    for(var twinID in globalCache.storedOutboundRelationships){
        storedRelationArr=storedRelationArr.concat(globalCache.storedOutboundRelationships[twinID])
    }
    this.drawRelations(storedRelationArr)
}

topologyDOM.prototype.drawTwinsAndRelations=function(data){
    var twinsAndRelations=data.childTwinsAndRelations

    //draw those new twins first
    twinsAndRelations.forEach(oneSet=>{
        var twinInfoArr=[]
        for(var ind in oneSet.childTwins) twinInfoArr.push(oneSet.childTwins[ind])
        var eles=this.drawTwins(twinInfoArr,"animation")
    })

    //draw those known twins from the relationships
    var twinsInfo={}
    twinsAndRelations.forEach(oneSet=>{
        var relationsInfo=oneSet["relationships"]
        relationsInfo.forEach((oneRelation)=>{
            var srcID=oneRelation['$sourceId']
            var targetID=oneRelation['$targetId']
            if(globalCache.storedTwins[srcID])
                twinsInfo[srcID] = globalCache.storedTwins[srcID]
            if(globalCache.storedTwins[targetID])
                twinsInfo[targetID] = globalCache.storedTwins[targetID]    
        })
    })
    var tmpArr=[]
    for(var twinID in twinsInfo) tmpArr.push(twinsInfo[twinID])
    this.drawTwins(tmpArr)

    //then check all stored relationships and draw if it can be drawn
    this.reviewStoredRelationshipsToDraw()
}

topologyDOM.prototype.applyVisualDefinition=function(){
    var visualJson=globalCache.visualDefinition["default"]
    if(visualJson==null) return;
    for(var modelID in visualJson){
        if(visualJson[modelID].color) this.updateModelTwinColor(modelID,visualJson[modelID].color)
        if(visualJson[modelID].shape) this.updateModelTwinShape(modelID,visualJson[modelID].shape)
        if(visualJson[modelID].avarta) this.updateModelAvarta(modelID,visualJson[modelID].avarta)
        if(visualJson[modelID].dimensionRatio) this.updateModelTwinDimension(modelID,visualJson[modelID].dimensionRatio)
        if(visualJson[modelID].rels){
            for(var relationshipName in visualJson[modelID].rels){
                if(visualJson[modelID]["rels"][relationshipName].color){
                    this.updateRelationshipColor(modelID,relationshipName,visualJson[modelID]["rels"][relationshipName].color)
                }
                if(visualJson[modelID]["rels"][relationshipName].shape){
                    this.updateRelationshipShape(modelID,relationshipName,visualJson[modelID]["rels"][relationshipName].shape)
                }
                if(visualJson[modelID]["rels"][relationshipName].edgeWidth){
                    this.updateRelationshipWidth(modelID,relationshipName,visualJson[modelID]["rels"][relationshipName].edgeWidth)
                }
            }
        }
    }
}

topologyDOM.prototype.rxMessage=function(msgPayload){
    if(msgPayload.message=="startSelection_replace"){
        this.core.nodes().remove()
    }else if(msgPayload.message=="replaceAllTwins") {
        this.core.nodes().remove()
        var eles= this.drawTwins(msgPayload.info)
        this.core.center(eles)
    }else if(msgPayload.message=="visualDefinitionRefresh") {
        this.applyVisualDefinition()
    }else if(msgPayload.message=="appendAllTwins") {
        var eles= this.drawTwins(msgPayload.info,"animate")
        this.core.center(eles)
        this.reviewStoredRelationshipsToDraw()
    }else if(msgPayload.message=="drawAllRelations"){
        var edges= this.drawRelations(msgPayload.info)
        if(edges!=null) {
            if(globalCache.currentLayoutName==null)  this.noPosition_cose()
        }
    }else if(msgPayload.message=="addNewTwin") {
        this.drawTwins([msgPayload.twinInfo],"animation")
    }else if(msgPayload.message=="addNewTwins") {
        this.drawTwins(msgPayload.twinsInfo,"animation")
    }else if(msgPayload.message=="drawTwinsAndRelations") this.drawTwinsAndRelations(msgPayload.info)
    else if(msgPayload.message=="showInfoSelectedNodes"){ //from selecting twins in the twintree
        this.core.nodes().unselect()
        this.core.edges().unselect()
        var arr=msgPayload.info;
        var mouseClickDetail=msgPayload.mouseClickDetail;
        arr.forEach(element => {
            var aTwin= this.core.nodes("#"+element['displayName'])
            aTwin.select()
            if(mouseClickDetail!=2) this.animateANode(aTwin) //ignore double click second click
        });
    }else if(msgPayload.message=="PanToNode"){
        var nodeInfo= msgPayload.info;
        var topoNode= this.core.nodes("#"+nodeInfo["$dtId"])
        if(topoNode){
            this.core.center(topoNode)
        }
    }else if(msgPayload.message=="visualDefinitionChange"){
        if(msgPayload.srcModelID){
            if(msgPayload.color) this.updateRelationshipColor(msgPayload.srcModelID,msgPayload.relationshipName,msgPayload.color)
            else if(msgPayload.shape) this.updateRelationshipShape(msgPayload.srcModelID,msgPayload.relationshipName,msgPayload.shape)
            else if(msgPayload.edgeWidth) this.updateRelationshipWidth(msgPayload.srcModelID,msgPayload.relationshipName,msgPayload.edgeWidth)
        } 
        else{
            if(msgPayload.color) this.updateModelTwinColor(msgPayload.modelID,msgPayload.color)
            else if(msgPayload.shape) this.updateModelTwinShape(msgPayload.modelID,msgPayload.shape)
            else if(msgPayload.avarta) this.updateModelAvarta(msgPayload.modelID,msgPayload.avarta)
            else if(msgPayload.noAvarta)  this.updateModelAvarta(msgPayload.modelID,null)
            else if(msgPayload.dimensionRatio)  this.updateModelTwinDimension(msgPayload.modelID,msgPayload.dimensionRatio)
        } 
    }else if(msgPayload.message=="twinsDeleted") this.deleteTwins(msgPayload.twinIDArr)
    else if(msgPayload.message=="relationsDeleted") this.deleteRelations(msgPayload.relations)
    else if(msgPayload.message=="connectTo"){ this.startTargetNodeMode("connectTo")   }
    else if(msgPayload.message=="connectFrom"){ this.startTargetNodeMode("connectFrom")   }
    else if(msgPayload.message=="addSelectOutbound"){ this.selectOutboundNodes()   }
    else if(msgPayload.message=="addSelectInbound"){ this.selectInboundNodes()   }
    else if(msgPayload.message=="hideSelectedNodes"){ this.hideSelectedNodes()   }
    else if(msgPayload.message=="COSESelectedNodes"){ this.COSESelectedNodes()   }
    else if(msgPayload.message=="saveLayout"){ this.saveLayout(msgPayload.layoutName)   }
    else if(msgPayload.message=="layoutChange"){ this.applyNewLayout()   }
}

topologyDOM.prototype.applyNewLayout = function () {
    var layoutName=globalCache.currentLayoutName
    
    var layoutDetail= globalCache.layoutJSON[layoutName]
    
    //remove all bending edge 
    this.core.edges().forEach(oneEdge=>{
        oneEdge.removeClass('edgebendediting-hasbendpoints')
        oneEdge.removeClass('edgecontrolediting-hascontrolpoints')
    })
    
    if(layoutDetail==null) return;
    
    var storedPositions={}
    for(var ind in layoutDetail){
        storedPositions[ind]={
            x:layoutDetail[ind][0]
            ,y:layoutDetail[ind][1]
        }
    }
    var newLayout=this.core.layout({
        name: 'preset',
        positions:storedPositions,
        fit:false,
        animate: true,
        animationDuration: 300,
    })
    newLayout.run()

    //restore edges bending or control points
    var edgePointsDict=layoutDetail["edges"]
    if(edgePointsDict==null)return;
    for(var srcID in edgePointsDict){
        for(var relationshipID in edgePointsDict[srcID]){
            var obj=edgePointsDict[srcID][relationshipID]
            this.applyEdgeBendcontrolPoints(srcID,relationshipID,obj["cyedgebendeditingWeights"]
            ,obj["cyedgebendeditingDistances"],obj["cyedgecontroleditingWeights"],obj["cyedgecontroleditingDistances"])
        }
    }
}

topologyDOM.prototype.applyEdgeBendcontrolPoints = function (srcID,relationshipID
    ,cyedgebendeditingWeights,cyedgebendeditingDistances,cyedgecontroleditingWeights,cyedgecontroleditingDistances) {
        var nodeName=globalCache.twinIDMapToDisplayName[srcID]
        var theNode=this.core.filter('[id = "'+nodeName+'"]');
        var edges=theNode.connectedEdges().toArray()
        for(var i=0;i<edges.length;i++){
            var anEdge=edges[i]
            if(anEdge.data("originalInfo")["$relationshipId"]==relationshipID){
                if(cyedgebendeditingWeights){
                    anEdge.data("cyedgebendeditingWeights",cyedgebendeditingWeights)
                    anEdge.data("cyedgebendeditingDistances",cyedgebendeditingDistances)
                    anEdge.addClass('edgebendediting-hasbendpoints');
                }
                if(cyedgecontroleditingWeights){
                    anEdge.data("cyedgecontroleditingWeights",cyedgecontroleditingWeights)
                    anEdge.data("cyedgecontroleditingDistances",cyedgecontroleditingDistances)
                    anEdge.addClass('edgecontrolediting-hascontrolpoints');
                }
                
                break
            }
        }
}



topologyDOM.prototype.saveLayout = async function (layoutName) {
    var layoutDict=globalCache.layoutJSON[layoutName]
    if(!layoutDict){
        layoutDict=globalCache.layoutJSON[layoutName]={}
    }
    
    if(this.core.nodes().size()==0) return;

    //store nodes position
    this.core.nodes().forEach(oneNode=>{
        var position=oneNode.position()
        layoutDict[oneNode.id()]=[this.numberPrecision(position['x']),this.numberPrecision(position['y'])]
    })

    //store any edge bending points or controling points

    if(layoutDict.edges==null) layoutDict.edges={}
    var edgeEditInstance= this.core.edgeEditing('get');
    this.core.edges().forEach(oneEdge=>{
        var srcID=oneEdge.data("originalInfo")["$sourceId"]
        var relationshipID=oneEdge.data("originalInfo")["$relationshipId"]
        var cyedgebendeditingWeights=oneEdge.data('cyedgebendeditingWeights')
        var cyedgebendeditingDistances=oneEdge.data('cyedgebendeditingDistances')
        var cyedgecontroleditingWeights=oneEdge.data('cyedgecontroleditingWeights')
        var cyedgecontroleditingDistances=oneEdge.data('cyedgecontroleditingDistances')
        if(!cyedgebendeditingWeights && !cyedgecontroleditingWeights) return;

        if(layoutDict.edges[srcID]==null)layoutDict.edges[srcID]={}
        layoutDict.edges[srcID][relationshipID]={}
        if(cyedgebendeditingWeights && cyedgebendeditingWeights.length>0) {
            layoutDict.edges[srcID][relationshipID]["cyedgebendeditingWeights"]=this.numberPrecision(cyedgebendeditingWeights)
            layoutDict.edges[srcID][relationshipID]["cyedgebendeditingDistances"]=this.numberPrecision(cyedgebendeditingDistances)
        }
        if(cyedgecontroleditingWeights && cyedgecontroleditingWeights.length>0) {
            layoutDict.edges[srcID][relationshipID]["cyedgecontroleditingWeights"]=this.numberPrecision(cyedgecontroleditingWeights)
            layoutDict.edges[srcID][relationshipID]["cyedgecontroleditingDistances"]=this.numberPrecision(cyedgecontroleditingDistances)
        }
    })

    var saveLayoutObj={"layouts":{}}
    saveLayoutObj["layouts"][layoutName]=JSON.stringify(layoutDict)
    try{
        await msalHelper.callAPI("digitaltwin/saveLayout", "POST", saveLayoutObj)
        this.broadcastMessage({ "message": "layoutsUpdated","layoutName":layoutName})
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
    }
}

topologyDOM.prototype.numberPrecision = function (number) {
    if(Array.isArray(number)){
        for(var i=0;i<number.length;i++){
            number[i] = this.numberPrecision(number[i])
        }
        return number
    }else
    return parseFloat(number.toFixed(3))
}

topologyDOM.prototype.COSESelectedNodes = function () {
    var selected=this.core.$(':selected')
    this.noPosition_cose(selected)
}

topologyDOM.prototype.hideSelectedNodes = function () {
    var selectedNodes=this.core.nodes(':selected')
    selectedNodes.remove()
}

topologyDOM.prototype.selectInboundNodes = function () {
    var selectedNodes=this.core.nodes(':selected')
    var eles=this.core.nodes().edgesTo(selectedNodes).sources()
    eles.forEach((ele)=>{ this.animateANode(ele) })
    eles.select()
    this.selectFunction()
}

topologyDOM.prototype.selectOutboundNodes = function () {
    var selectedNodes=this.core.nodes(':selected')
    var eles=selectedNodes.edgesTo(this.core.nodes()).targets()
    eles.forEach((ele)=>{ this.animateANode(ele) })
    eles.select()
    this.selectFunction()
}

topologyDOM.prototype.addConnections = function (targetNode) {
    var theConnectMode=this.targetNodeMode
    var srcNodeArr=this.core.nodes(":selected")

    var preparationInfo=[]

    srcNodeArr.forEach(theNode=>{
        var connectionTypes
        if(theConnectMode=="connectTo") {
            connectionTypes=this.checkAvailableConnectionType(theNode.data("modelID"),targetNode.data("modelID"))
            preparationInfo.push({from:theNode,to:targetNode,connect:connectionTypes})
        }else if(theConnectMode=="connectFrom") {
            connectionTypes=this.checkAvailableConnectionType(targetNode.data("modelID"),theNode.data("modelID"))
            preparationInfo.push({to:theNode,from:targetNode,connect:connectionTypes})
        }
    })
    //TODO: check if it is needed to popup dialog, if all connection is doable and only one type to use, no need to show dialog
    this.showConnectionDialog(preparationInfo)
}

topologyDOM.prototype.showConnectionDialog = function (preparationInfo) {
    var confirmDialogDiv = new simpleConfirmDialog()
    var resultActions=[]
    confirmDialogDiv.show(
        { width: "450px" },
        {
            title: "Add connections"
            , content: ""
            , buttons: [
                {
                    colorClass: "w3-red w3-hover-pink", text: "Confirm", "clickFunc": () => {
                        confirmDialogDiv.close();
                        this.createConnections(resultActions)
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
    confirmDialogDiv.dialogDiv.empty()
    preparationInfo.forEach((oneRow,index)=>{
        resultActions.push(this.createOneConnectionAdjustRow(oneRow,confirmDialogDiv))
    })
}

topologyDOM.prototype.createOneConnectionAdjustRow = function (oneRow,confirmDialogDiv) {
    var returnObj={}
    var fromNode=oneRow.from
    var toNode=oneRow.to
    var connectionTypes=oneRow.connect
    var label=$('<label style="display:block;margin-bottom:2px"></label>')
    if(connectionTypes.length==0){
        label.css("color","red")
        label.html("No usable connection type from <b>"+fromNode.id()+"</b> to <b>"+toNode.id()+"</b>")
    }else if(connectionTypes.length>1){ 
        label.html("From <b>"+fromNode.id()+"</b> to <b>"+toNode.id()+"</b>") 
        var switchTypeSelector=new simpleSelectMenu(" ")
        label.prepend(switchTypeSelector.DOM)
        connectionTypes.forEach(oneType=>{
            switchTypeSelector.addOption(oneType)
        })
        returnObj["from"]=fromNode.id()
        returnObj["to"]=toNode.id()
        returnObj["connect"]=connectionTypes[0]
        switchTypeSelector.callBack_clickOption=(optionText,optionValue)=>{
            returnObj["connect"]=optionText
            switchTypeSelector.changeName(optionText)
        }
        switchTypeSelector.triggerOptionIndex(0)
    }else if(connectionTypes.length==1){
        returnObj["from"]=fromNode.id()
        returnObj["to"]=toNode.id()
        returnObj["connect"]=connectionTypes[0]
        label.css("color","green")
        label.html("Add <b>"+connectionTypes[0]+"</b> connection from <b>"+fromNode.id()+"</b> to <b>"+toNode.id()+"</b>") 
    }
    confirmDialogDiv.dialogDiv.append(label)
    return returnObj;
}

topologyDOM.prototype.createConnections = async function (resultActions) {
    // for each resultActions, calculate the appendix index, to avoid same ID is used for existed connections
    function uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    var finalActions=[]
    resultActions.forEach(oneAction=>{
        var oneFinalAction={}
        oneFinalAction["$srcId"]=oneAction["from"]
        oneFinalAction["$relationshipId"]=uuidv4();
        oneFinalAction["obj"]={
            "$targetId": oneAction["to"],
            "$relationshipName": oneAction["connect"]
        }
        finalActions.push(oneFinalAction)
    })
    try{
        var data = await msalHelper.callAPI("digitaltwin/createRelations", "POST",  {actions:JSON.stringify(finalActions)})
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
    }
    globalCache.storeTwinRelationships_append(data)
    this.drawRelations(data)
}



topologyDOM.prototype.checkAvailableConnectionType = function (fromNodeModel,toNodeModel) {
    var re=[]
    var validRelationships=modelAnalyzer.DTDLModels[fromNodeModel].validRelationships
    var toNodeBaseClasses=modelAnalyzer.DTDLModels[toNodeModel].allBaseClasses
    if(validRelationships){
        for(var relationName in validRelationships){
            var theRelationType=validRelationships[relationName]
            if(theRelationType.target==null
                 || theRelationType.target==toNodeModel
                 ||toNodeBaseClasses[theRelationType.target]!=null) re.push(relationName)
        }
    }
    return re
}


topologyDOM.prototype.startTargetNodeMode = function (mode) {
    this.core.autounselectify( true );
    this.core.container().style.cursor = 'crosshair';
    this.targetNodeMode=mode;
    $(document).keydown((event) => {
        if (event.keyCode == 27) this.cancelTargetNodeMode()
    });

    this.core.nodes().on('click', (e)=>{
        var clickedNode = e.target;
        this.addConnections(clickedNode)
        //delay a short while so node selection will not be changed to the clicked target node
        setTimeout(()=>{this.cancelTargetNodeMode()},50)

    });
}

topologyDOM.prototype.cancelTargetNodeMode=function(){
    this.targetNodeMode=null;
    this.core.container().style.cursor = 'default';
    $(document).off('keydown');
    this.core.nodes().off("click")
    this.core.autounselectify( false );
}


topologyDOM.prototype.noPosition_grid=function(eles){
    var newLayout = eles.layout({
        name: 'grid',
        animate: false,
        fit:false
    }) 
    newLayout.run()
}

topologyDOM.prototype.noPosition_cose=function(eles){
    if(eles==null) eles=this.core.elements()

    var newLayout =eles.layout({
        name: 'cose',
        animate: true,
        gravity:1,
        animate: false
        ,fit:false
    }) 
    newLayout.run()
    this.core.center(eles)
}

topologyDOM.prototype.noPosition_concentric=function(eles,box){
    if(eles==null) eles=this.core.elements()
    var newLayout =eles.layout({
        name: 'concentric',
        animate: false,
        fit:false,
        minNodeSpacing:60,
        gravity:1,
        boundingBox:box
    }) 
    newLayout.run()
}

topologyDOM.prototype.layoutWithNodePosition=function(nodePosition){
    var newLayout = this.core.layout({
        name: 'preset',
        positions: nodePosition,
        animate: false, // whether to transition the node positions
        animationDuration: 500, // duration of animation in ms if enabled
    })
    newLayout.run()
}



module.exports = topologyDOM;
},{"../msalHelper":13,"../sharedSourceFiles/simpleConfirmDialog":15,"../sharedSourceFiles/simpleSelectMenu":16,"./globalCache":3,"./modelAnalyzer":6}],11:[function(require,module,exports){
const simpleTree=require("../sharedSourceFiles/simpleTree")
const modelAnalyzer=require("./modelAnalyzer")
const msalHelper = require("../msalHelper")
const globalCache = require("./globalCache")

function twinsTree(DOM, searchDOM) {
    this.tree=new simpleTree(DOM,{"leafNameProperty":"displayName"})

    this.tree.options.groupNodeIconFunc=(gn)=>{
        var modelClass=gn.info["@id"]
        var colorCode="gray"
        var shape="ellipse"
        var avatar=null
        if(globalCache.visualDefinition["default"][modelClass]){
            var visualJson =globalCache.visualDefinition["default"][modelClass]
            var colorCode= visualJson.color || "gray"
            var shape=  visualJson.shape || "ellipse"
            var avarta= visualJson.avarta 
        }
        var fontsize={"ellipse":"font-size:130%","round-rectangle":"font-size:60%;padding-left:2px","hexagon":"font-size:90%"}[shape]
        shape={"ellipse":"●","round-rectangle":"▉","hexagon":"⬢"}[shape]
        
        var lblHTML="<label style='display:inline;color:"+colorCode+";"+fontsize+";font-weight:normal;vertical-align:middle;border-radius: 2px;'>"+shape+"</label>"

        if(avarta) lblHTML+="<img src='"+avarta+"' style='height:20px'/>"

        return $(lblHTML)
    }

    this.tree.callback_afterSelectNodes=(nodesArr,mouseClickDetail)=>{
        var infoArr=[]
        nodesArr.forEach((item, index) =>{
            infoArr.push(item.leafInfo)
        });
        globalCache.showingCreateTwinModelID=null; 
        this.broadcastMessage({ "message": "showInfoSelectedNodes", info:infoArr, "mouseClickDetail":mouseClickDetail})
    }

    this.tree.callback_afterDblclickNode=(theNode)=>{
        this.broadcastMessage({ "message": "PanToNode", info:theNode.leafInfo})
    }

    this.tree.callback_afterSelectGroupNode=(nodeInfo)=>{
        this.broadcastMessage({"message":"showInfoGroupNode",info:nodeInfo})
    }

    this.searchBox=$('<input type="text"  placeholder="search..."/>').addClass("w3-input");
    this.searchBox.css({"outline":"none","height":"100%","width":"100%"}) 
    searchDOM.append(this.searchBox)
    var hideOrShowEmptyGroup=$('<button style="height:20px;border:none;padding-left:2px" class="w3-block w3-tiny w3-hover-red w3-amber">Hide Empty Models</button>')
    searchDOM.append(hideOrShowEmptyGroup)
    DOM.css("top","50px")
    hideOrShowEmptyGroup.attr("status","show")
    hideOrShowEmptyGroup.on("click",()=>{
        if(hideOrShowEmptyGroup.attr("status")=="show"){
            hideOrShowEmptyGroup.attr("status","hide")
            hideOrShowEmptyGroup.text("Show Empty Models")
            this.tree.options.hideEmptyGroup=true
        }else{
            hideOrShowEmptyGroup.attr("status","show")
            hideOrShowEmptyGroup.text("Hide Empty Models")
            delete this.tree.options.hideEmptyGroup
        }
        this.tree.groupNodes.forEach(oneGroupNode=>{oneGroupNode.checkOptionHideEmptyGroup()})
    })
    this.searchBox.keyup((e)=>{
        if(e.keyCode == 13)
        {
            var aNode = this.tree.searchText($(e.target).val())
            if(aNode!=null){
                aNode.parentGroupNode.expand()
                this.tree.selectLeafNode(aNode)
                this.tree.scrollToLeafNode(aNode)
            }
        }
    });
}

twinsTree.prototype.rxMessage=function(msgPayload){
    if(msgPayload.message=="startSelection_replace") this.loadStartSelection(msgPayload.twinIDs,msgPayload.modelIDs,"replace")
    else if(msgPayload.message=="startSelection_append") this.loadStartSelection(msgPayload.twinIDs,msgPayload.modelIDs,"append")
    else if(msgPayload.message=="drawTwinsAndRelations") this.drawTwinsAndRelations(msgPayload.info)
    else if(msgPayload.message=="ADTModelsChange") this.refreshModels()
    else if(msgPayload.message=="addNewTwin") this.drawOneTwin(msgPayload.twinInfo)
    else if(msgPayload.message=="addNewTwins") {
        msgPayload.twinsInfo.forEach(oneTwinInfo=>{this.drawOneTwin(oneTwinInfo)})
    }
    else if(msgPayload.message=="twinsDeleted") this.deleteTwins(msgPayload.twinIDArr)
    else if(msgPayload.message=="visualDefinitionChange"){
        if(!msgPayload.srcModelID){ // change model class visualization
            this.tree.groupNodes.forEach(gn=>{gn.refreshName()})
        } 
    }
}

twinsTree.prototype.deleteTwins=function(twinIDArr){
    twinIDArr.forEach(twinID=>{
        var twinDisplayName=globalCache.twinIDMapToDisplayName[twinID]
        this.tree.deleteLeafNode(twinDisplayName)
    })
}

twinsTree.prototype.refreshModels=function(){
    var modelsData={}
    for(var modelID in modelAnalyzer.DTDLModels){
        var oneModel=modelAnalyzer.DTDLModels[modelID]
        modelsData[oneModel["displayName"]] = oneModel
    }
    //delete all group nodes of deleted models
    this.tree.groupNodes.forEach((gnode)=>{
        if(modelsData[gnode.name]==null){
            //delete this group node
            gnode.deleteSelf()
        }
    })

    //then add all group nodes that to be added
    var currentModelNameArr=[]
    this.tree.groupNodes.forEach((gnode)=>{currentModelNameArr.push(gnode.name)})

    var actualModelNameArr=[]
    for(var ind in modelsData) actualModelNameArr.push(ind)
    actualModelNameArr.sort(function (a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()) });

    for(var i=0;i<actualModelNameArr.length;i++){
        if(i<currentModelNameArr.length && currentModelNameArr[i]==actualModelNameArr[i]) continue
        //otherwise add this group to the tree
        var newGroup=this.tree.insertGroupNode(modelsData[actualModelNameArr[i]],i)
        newGroup.shrink()
        currentModelNameArr.splice(i, 0, actualModelNameArr[i]);
    }
}


twinsTree.prototype.loadStartSelection=async function(twinIDs,modelIDs,replaceOrAppend){
    if(replaceOrAppend=="replace") this.tree.clearAllLeafNodes()

    
    this.refreshModels()
    
    //add new twins under the model group node
    try{
        var twinsdata = await msalHelper.callAPI("digitaltwin/listTwinsForIDs", "POST", twinIDs)
        var twinIDArr = []
        //check if any current leaf node does not have stored outbound relationship data yet
        this.tree.groupNodes.forEach((gNode) => {
            gNode.childLeafNodes.forEach(leafNode => {
                var nodeId = leafNode.leafInfo["$dtId"]
                if (globalCache.storedOutboundRelationships[nodeId] == null) twinIDArr.push(nodeId)
            })
        })

        globalCache.storeADTTwins(twinsdata)
        for (var i = 0; i < twinsdata.length; i++) {
            var groupName = globalCache.modelIDMapToName[twinsdata[i]["$metadata"]["$model"]]
            this.tree.addLeafnodeToGroup(groupName, twinsdata[i], "skipRepeat")
            twinIDArr.push(twinsdata[i]["$dtId"])
        }
        if(replaceOrAppend=="replace") this.broadcastMessage({ "message": "replaceAllTwins", info: twinsdata })
        else this.broadcastMessage({ "message": "appendAllTwins", info: twinsdata })
        

        this.fetchAllRelationships(twinIDArr)
    } catch (e) {
        console.log(e)
        if(e.responseText) alert(e.responseText)
    }
}



twinsTree.prototype.drawTwinsAndRelations= function(data){
    data.childTwinsAndRelations.forEach(oneSet=>{
        for(var ind in oneSet.childTwins){
            var oneTwin=oneSet.childTwins[ind]
            this.drawOneTwin(oneTwin)
        }
    })
    
    //draw those known twins from the relationships
    var twinsInfo={}
    data.childTwinsAndRelations.forEach(oneSet=>{
        var relationsInfo=oneSet["relationships"]
        relationsInfo.forEach((oneRelation)=>{
            var srcID=oneRelation['$sourceId']
            var targetID=oneRelation['$targetId']
            if(globalCache.storedTwins[srcID])
                twinsInfo[srcID] = globalCache.storedTwins[srcID]
            if(globalCache.storedTwins[targetID])
                twinsInfo[targetID] = globalCache.storedTwins[targetID]    
        })
    })
    var tmpArr=[]
    for(var twinID in twinsInfo) tmpArr.push(twinsInfo[twinID])
    tmpArr.forEach(oneTwin=>{this.drawOneTwin(oneTwin)})
}

twinsTree.prototype.drawOneTwin= function(twinInfo){
    var groupName=globalCache.modelIDMapToName[twinInfo["$metadata"]["$model"]]
    this.tree.addLeafnodeToGroup(groupName,twinInfo,"skipRepeat")
}

twinsTree.prototype.fetchAllRelationships= async function(twinIDArr){
    while(twinIDArr.length>0){
        var smallArr= twinIDArr.splice(0, 100);
        try{
            var data = await msalHelper.callAPI("digitaltwin/getRelationshipsFromTwinIDs", "POST", smallArr)
            if (data == "") continue;
            globalCache.storeTwinRelationships(data) //store them in global available array
            this.broadcastMessage({ "message": "drawAllRelations", info: data })
        } catch (e) {
            console.log(e)
            if(e.responseText) alert(e.responseText)
        }
    }
}

module.exports = twinsTree;
},{"../msalHelper":13,"../sharedSourceFiles/simpleTree":17,"./globalCache":3,"./modelAnalyzer":6}],12:[function(require,module,exports){
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
},{}],13:[function(require,module,exports){
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
},{"./globalAppSettings":12}],14:[function(require,module,exports){
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
},{}],15:[function(require,module,exports){
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
},{}],16:[function(require,module,exports){
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
},{}],17:[function(require,module,exports){
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
    
    if(this.childLeafNodes.length>0) lblColor="yellowgreen"
    else var lblColor="gray" 
    this.headerDOM.css("font-weight","bold")

    if(this.parentTree.options.groupNodeIconFunc){
        var iconLabel=this.parentTree.options.groupNodeIconFunc(this)
        this.headerDOM.append(iconLabel)
    }
    var numberlabel=$("<label style='display:inline;background-color:"+lblColor
        +";color:white;font-size:9px;padding:2px 4px;font-weight:normal;border-radius: 2px;'>"+this.childLeafNodes.length+"</label>")
    this.headerDOM.append(nameDiv,numberlabel)
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
    this.headerDOM=$('<button class="w3-button w3-block w3-light-grey w3-left-align"></button>')
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
},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9zcGFTb3VyY2VDb2RlL2RpZ2l0YWx0d2lubW9kdWxlL2RpZ2l0YWx0d2lubW9kdWxlVUkuanMiLCIuLi9zcGFTb3VyY2VDb2RlL2RpZ2l0YWx0d2lubW9kdWxlL2VkaXRMYXlvdXREaWFsb2cuanMiLCIuLi9zcGFTb3VyY2VDb2RlL2RpZ2l0YWx0d2lubW9kdWxlL2dsb2JhbENhY2hlLmpzIiwiLi4vc3BhU291cmNlQ29kZS9kaWdpdGFsdHdpbm1vZHVsZS9pbmZvUGFuZWwuanMiLCIuLi9zcGFTb3VyY2VDb2RlL2RpZ2l0YWx0d2lubW9kdWxlL21haW5Ub29sYmFyLmpzIiwiLi4vc3BhU291cmNlQ29kZS9kaWdpdGFsdHdpbm1vZHVsZS9tb2RlbEFuYWx5emVyLmpzIiwiLi4vc3BhU291cmNlQ29kZS9kaWdpdGFsdHdpbm1vZHVsZS9tb2RlbEVkaXRvckRpYWxvZy5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvZGlnaXRhbHR3aW5tb2R1bGUvbW9kZWxNYW5hZ2VyRGlhbG9nLmpzIiwiLi4vc3BhU291cmNlQ29kZS9kaWdpdGFsdHdpbm1vZHVsZS9zdGFydFNlbGVjdGlvbkRpYWxvZy5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvZGlnaXRhbHR3aW5tb2R1bGUvdG9wb2xvZ3lET00uanMiLCIuLi9zcGFTb3VyY2VDb2RlL2RpZ2l0YWx0d2lubW9kdWxlL3R3aW5zVHJlZS5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvZ2xvYmFsQXBwU2V0dGluZ3MuanMiLCIuLi9zcGFTb3VyY2VDb2RlL21zYWxIZWxwZXIuanMiLCIuLi9zcGFTb3VyY2VDb2RlL3NoYXJlZFNvdXJjZUZpbGVzL21vZHVsZVN3aXRjaERpYWxvZy5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvc2hhcmVkU291cmNlRmlsZXMvc2ltcGxlQ29uZmlybURpYWxvZy5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvc2hhcmVkU291cmNlRmlsZXMvc2ltcGxlU2VsZWN0TWVudS5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvc2hhcmVkU291cmNlRmlsZXMvc2ltcGxlVHJlZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3p2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOWtCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy82QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIid1c2Ugc3RyaWN0JztcclxuY29uc3QgdG9wb2xvZ3lET009cmVxdWlyZShcIi4vdG9wb2xvZ3lET00uanNcIilcclxuY29uc3QgdHdpbnNUcmVlPXJlcXVpcmUoXCIuL3R3aW5zVHJlZVwiKVxyXG5jb25zdCBzdGFydFNlbGVjdGlvbkRpYWxvZyA9IHJlcXVpcmUoXCIuL3N0YXJ0U2VsZWN0aW9uRGlhbG9nXCIpXHJcbmNvbnN0IG1vZGVsTWFuYWdlckRpYWxvZyA9IHJlcXVpcmUoXCIuL21vZGVsTWFuYWdlckRpYWxvZ1wiKVxyXG5jb25zdCBtb2RlbEVkaXRvckRpYWxvZyA9IHJlcXVpcmUoXCIuL21vZGVsRWRpdG9yRGlhbG9nXCIpXHJcbmNvbnN0IGVkaXRMYXlvdXREaWFsb2cgPSByZXF1aXJlKFwiLi9lZGl0TGF5b3V0RGlhbG9nXCIpXHJcbmNvbnN0IG1haW5Ub29sYmFyID0gcmVxdWlyZShcIi4vbWFpblRvb2xiYXJcIilcclxuY29uc3QgaW5mb1BhbmVsPSByZXF1aXJlKFwiLi9pbmZvUGFuZWxcIik7XHJcbmNvbnN0IGdsb2JhbEFwcFNldHRpbmdzID0gcmVxdWlyZShcIi4uL2dsb2JhbEFwcFNldHRpbmdzLmpzXCIpO1xyXG5jb25zdCBtc2FsSGVscGVyPXJlcXVpcmUoXCIuLi9tc2FsSGVscGVyXCIpXHJcbmNvbnN0IGdsb2JhbENhY2hlPXJlcXVpcmUoXCIuL2dsb2JhbENhY2hlXCIpXHJcblxyXG5mdW5jdGlvbiBkaWdpdGFsdHdpbm1vZHVsZVVJKCkge1xyXG4gICAgdGhpcy5pbml0VUlMYXlvdXQoKVxyXG5cclxuICAgIHRoaXMudHdpbnNUcmVlPSBuZXcgdHdpbnNUcmVlKCQoXCIjdHJlZUhvbGRlclwiKSwkKFwiI3RyZWVTZWFyY2hcIikpXHJcbiAgICBcclxuICAgIG1haW5Ub29sYmFyLnJlbmRlcigpXHJcbiAgICB0aGlzLnRvcG9sb2d5SW5zdGFuY2U9bmV3IHRvcG9sb2d5RE9NKCQoJyNjYW52YXMnKSlcclxuICAgIHRoaXMudG9wb2xvZ3lJbnN0YW5jZS5pbml0KClcclxuXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoKSAvL2luaXRpYWxpemUgYWxsIHVpIGNvbXBvbmVudHMgdG8gaGF2ZSB0aGUgYnJvYWRjYXN0IGNhcGFiaWxpdHlcclxuXHJcbiAgICAvL3RyeSBpZiBpdCBhbHJlYWR5IEIyQyBzaWduZWQgaW4sIGlmIG5vdCBnb2luZyBiYWNrIHRvIHRoZSBzdGFydCBwYWdlXHJcbiAgICB0aGlzLm15TVNBTE9iaiA9IG5ldyBtc2FsLlB1YmxpY0NsaWVudEFwcGxpY2F0aW9uKGdsb2JhbEFwcFNldHRpbmdzLm1zYWxDb25maWcpO1xyXG5cclxuXHJcbiAgICB2YXIgdGhlQWNjb3VudD1tc2FsSGVscGVyLmZldGNoQWNjb3VudCgpO1xyXG4gICAgaWYodGhlQWNjb3VudD09bnVsbCAmJiAhZ2xvYmFsQXBwU2V0dGluZ3MuaXNMb2NhbFRlc3QpIHdpbmRvdy5vcGVuKGdsb2JhbEFwcFNldHRpbmdzLmxvZ291dFJlZGlyZWN0VXJpLFwiX3NlbGZcIilcclxuXHJcbiAgICBnbG9iYWxDYWNoZS5sb2FkVXNlckRhdGEoKS50aGVuKHJlPT57XHJcbiAgICAgICAgaWYoZ2xvYmFsQ2FjaGUuREJNb2RlbHNBcnIubGVuZ3RoPT0wKXtcclxuICAgICAgICAgICAgLy9kaXJlY3RseSBwb3B1cCB0byBtb2RlbCBtYW5hZ2VtZW50IGRpYWxvZyBhbGxvdyB1c2VyIGltcG9ydCBvciBjcmVhdGUgbW9kZWxcclxuICAgICAgICAgICAgbW9kZWxNYW5hZ2VyRGlhbG9nLnBvcHVwKClcclxuICAgICAgICAgICAgLy9wb3AgdXAgd2VsY29tZSBzY3JlZW5cclxuICAgICAgICAgICAgdmFyIHBvcFdpbj0kKCc8ZGl2IGNsYXNzPVwidzMtYmx1ZSB3My1jYXJkLTQgdzMtcGFkZGluZy1sYXJnZVwiIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dG9wOjUwJTtiYWNrZ3JvdW5kLWNvbG9yOndoaXRlO2xlZnQ6NTAlO3RyYW5zZm9ybTogdHJhbnNsYXRlWCgtNTAlKSB0cmFuc2xhdGVZKC01MCUpO3otaW5kZXg6MTA1O3dpZHRoOjQwMHB4O2N1cnNvcjpkZWZhdWx0XCI+PC9kaXY+JylcclxuICAgICAgICAgICAgcG9wV2luLmh0bWwoYFdlbGNvbWUsICR7bXNhbEhlbHBlci51c2VyTmFtZX0hIEZpcnN0bHksIHlvdSBtYXkgY29uc2lkZXIgaW1wb3J0aW5nIGEgZmV3IHR3aW4gbW9kZWwgZmlsZXMgb3IgY3JlYXRpbmcgdHdpbiBtb2RlbHMgZnJvbSBzY3JhdGNoLiA8YnIvPjxici8+Q2xpY2sgdG8gY29udGludWUuLi5gKVxyXG4gICAgICAgICAgICAkKFwiYm9keVwiKS5hcHBlbmQocG9wV2luKVxyXG4gICAgICAgICAgICBwb3BXaW4ub24oXCJjbGlja1wiLCgpPT57cG9wV2luLnJlbW92ZSgpfSlcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgc3RhcnRTZWxlY3Rpb25EaWFsb2cucG9wdXAoKVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UodGhpcyx7IFwibWVzc2FnZVwiOiBcInZpc3VhbERlZmluaXRpb25SZWZyZXNoXCJ9KVxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh0aGlzLHsgXCJtZXNzYWdlXCI6IFwibGF5b3V0c1VwZGF0ZWRcIn0pXHJcbiAgICB9KVxyXG59XHJcblxyXG5kaWdpdGFsdHdpbm1vZHVsZVVJLnByb3RvdHlwZS5icm9hZGNhc3RNZXNzYWdlPWZ1bmN0aW9uKHNvdXJjZSxtc2dQYXlsb2FkKXtcclxuICAgIHZhciBjb21wb25lbnRzQXJyPVt0aGlzLnR3aW5zVHJlZSxzdGFydFNlbGVjdGlvbkRpYWxvZyxtb2RlbE1hbmFnZXJEaWFsb2csbW9kZWxFZGl0b3JEaWFsb2csZWRpdExheW91dERpYWxvZyxcclxuICAgICAgICAgbWFpblRvb2xiYXIsdGhpcy50b3BvbG9neUluc3RhbmNlLGluZm9QYW5lbF1cclxuXHJcbiAgICBpZihzb3VyY2U9PW51bGwpe1xyXG4gICAgICAgIGZvcih2YXIgaT0wO2k8Y29tcG9uZW50c0Fyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgdmFyIHRoZUNvbXBvbmVudD1jb21wb25lbnRzQXJyW2ldXHJcbiAgICAgICAgICAgIHRoaXMuYXNzaWduQnJvYWRjYXN0TWVzc2FnZSh0aGVDb21wb25lbnQpXHJcbiAgICAgICAgfVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgZm9yKHZhciBpPTA7aTxjb21wb25lbnRzQXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICB2YXIgdGhlQ29tcG9uZW50PWNvbXBvbmVudHNBcnJbaV1cclxuICAgICAgICAgICAgaWYodGhlQ29tcG9uZW50LnJ4TWVzc2FnZSAmJiB0aGVDb21wb25lbnQhPXNvdXJjZSkgdGhlQ29tcG9uZW50LnJ4TWVzc2FnZShtc2dQYXlsb2FkKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZGlnaXRhbHR3aW5tb2R1bGVVSS5wcm90b3R5cGUuYXNzaWduQnJvYWRjYXN0TWVzc2FnZT1mdW5jdGlvbih1aUNvbXBvbmVudCl7XHJcbiAgICB1aUNvbXBvbmVudC5icm9hZGNhc3RNZXNzYWdlPShtc2dPYmopPT57dGhpcy5icm9hZGNhc3RNZXNzYWdlKHVpQ29tcG9uZW50LG1zZ09iail9XHJcbn1cclxuXHJcbmRpZ2l0YWx0d2lubW9kdWxlVUkucHJvdG90eXBlLmluaXRVSUxheW91dCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBteUxheW91dCA9ICQoJ2JvZHknKS5sYXlvdXQoe1xyXG4gICAgICAgIC8vXHRyZWZlcmVuY2Ugb25seSAtIHRoZXNlIG9wdGlvbnMgYXJlIE5PVCByZXF1aXJlZCBiZWNhdXNlICd0cnVlJyBpcyB0aGUgZGVmYXVsdFxyXG4gICAgICAgIGNsb3NhYmxlOiB0cnVlXHQvLyBwYW5lIGNhbiBvcGVuICYgY2xvc2VcclxuICAgICAgICAsIHJlc2l6YWJsZTogdHJ1ZVx0Ly8gd2hlbiBvcGVuLCBwYW5lIGNhbiBiZSByZXNpemVkIFxyXG4gICAgICAgICwgc2xpZGFibGU6IHRydWVcdC8vIHdoZW4gY2xvc2VkLCBwYW5lIGNhbiAnc2xpZGUnIG9wZW4gb3ZlciBvdGhlciBwYW5lcyAtIGNsb3NlcyBvbiBtb3VzZS1vdXRcclxuICAgICAgICAsIGxpdmVQYW5lUmVzaXppbmc6IHRydWVcclxuXHJcbiAgICAgICAgLy9cdHNvbWUgcmVzaXppbmcvdG9nZ2xpbmcgc2V0dGluZ3NcclxuICAgICAgICAsIG5vcnRoX19zbGlkYWJsZTogZmFsc2VcdC8vIE9WRVJSSURFIHRoZSBwYW5lLWRlZmF1bHQgb2YgJ3NsaWRhYmxlPXRydWUnXHJcbiAgICAgICAgLy8sIG5vcnRoX190b2dnbGVyTGVuZ3RoX2Nsb3NlZDogJzEwMCUnXHQvLyB0b2dnbGUtYnV0dG9uIGlzIGZ1bGwtd2lkdGggb2YgcmVzaXplci1iYXJcclxuICAgICAgICAsIG5vcnRoX19zcGFjaW5nX2Nsb3NlZDogNlx0XHQvLyBiaWcgcmVzaXplci1iYXIgd2hlbiBvcGVuICh6ZXJvIGhlaWdodClcclxuICAgICAgICAsIG5vcnRoX19zcGFjaW5nX29wZW46MFxyXG4gICAgICAgICwgbm9ydGhfX3Jlc2l6YWJsZTogZmFsc2VcdC8vIE9WRVJSSURFIHRoZSBwYW5lLWRlZmF1bHQgb2YgJ3Jlc2l6YWJsZT10cnVlJ1xyXG4gICAgICAgICwgbm9ydGhfX2Nsb3NhYmxlOiBmYWxzZVxyXG4gICAgICAgICwgd2VzdF9fY2xvc2FibGU6IGZhbHNlXHJcbiAgICAgICAgLCBlYXN0X19jbG9zYWJsZTogZmFsc2VcclxuICAgICAgICBcclxuXHJcbiAgICAgICAgLy9cdHNvbWUgcGFuZS1zaXplIHNldHRpbmdzXHJcbiAgICAgICAgLCB3ZXN0X19taW5TaXplOiAxMDBcclxuICAgICAgICAsIGVhc3RfX3NpemU6IDMwMFxyXG4gICAgICAgICwgZWFzdF9fbWluU2l6ZTogMjAwXHJcbiAgICAgICAgLCBlYXN0X19tYXhTaXplOiAuNSAvLyA1MCUgb2YgbGF5b3V0IHdpZHRoXHJcbiAgICAgICAgLCBjZW50ZXJfX21pbldpZHRoOiAxMDBcclxuICAgICAgICAsZWFzdF9fY2xvc2FibGU6IGZhbHNlXHJcbiAgICAgICAgLHdlc3RfX2Nsb3NhYmxlOiBmYWxzZVxyXG4gICAgICAgICxlYXN0X19pbml0Q2xvc2VkOlx0dHJ1ZVxyXG4gICAgfSk7XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKlx0RElTQUJMRSBURVhULVNFTEVDVElPTiBXSEVOIERSQUdHSU5HIChvciBldmVuIF90cnlpbmdfIHRvIGRyYWchKVxyXG4gICAgICpcdHRoaXMgZnVuY3Rpb25hbGl0eSB3aWxsIGJlIGluY2x1ZGVkIGluIFJDMzAuODBcclxuICAgICAqL1xyXG4gICAgJC5sYXlvdXQuZGlzYWJsZVRleHRTZWxlY3Rpb24gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICRkID0gJChkb2N1bWVudClcclxuICAgICAgICAgICAgLCBzID0gJ3RleHRTZWxlY3Rpb25EaXNhYmxlZCdcclxuICAgICAgICAgICAgLCB4ID0gJ3RleHRTZWxlY3Rpb25Jbml0aWFsaXplZCdcclxuICAgICAgICAgICAgO1xyXG4gICAgICAgIGlmICgkLmZuLmRpc2FibGVTZWxlY3Rpb24pIHtcclxuICAgICAgICAgICAgaWYgKCEkZC5kYXRhKHgpKSAvLyBkb2N1bWVudCBoYXNuJ3QgYmVlbiBpbml0aWFsaXplZCB5ZXRcclxuICAgICAgICAgICAgICAgICRkLm9uKCdtb3VzZXVwJywgJC5sYXlvdXQuZW5hYmxlVGV4dFNlbGVjdGlvbikuZGF0YSh4LCB0cnVlKTtcclxuICAgICAgICAgICAgaWYgKCEkZC5kYXRhKHMpKVxyXG4gICAgICAgICAgICAgICAgJGQuZGlzYWJsZVNlbGVjdGlvbigpLmRhdGEocywgdHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vY29uc29sZS5sb2coJyQubGF5b3V0LmRpc2FibGVUZXh0U2VsZWN0aW9uJyk7XHJcbiAgICB9O1xyXG4gICAgJC5sYXlvdXQuZW5hYmxlVGV4dFNlbGVjdGlvbiA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJGQgPSAkKGRvY3VtZW50KVxyXG4gICAgICAgICAgICAsIHMgPSAndGV4dFNlbGVjdGlvbkRpc2FibGVkJztcclxuICAgICAgICBpZiAoJC5mbi5lbmFibGVTZWxlY3Rpb24gJiYgJGQuZGF0YShzKSlcclxuICAgICAgICAgICAgJGQuZW5hYmxlU2VsZWN0aW9uKCkuZGF0YShzLCBmYWxzZSk7XHJcbiAgICAgICAgLy9jb25zb2xlLmxvZygnJC5sYXlvdXQuZW5hYmxlVGV4dFNlbGVjdGlvbicpO1xyXG4gICAgfTtcclxuICAgICQoXCIudWktbGF5b3V0LXJlc2l6ZXItbm9ydGhcIikuaGlkZSgpXHJcbiAgICAkKFwiLnVpLWxheW91dC13ZXN0XCIpLmNzcyhcImJvcmRlci1yaWdodFwiLFwic29saWQgMXB4IGxpZ2h0R3JheVwiKVxyXG4gICAgJChcIi51aS1sYXlvdXQtd2VzdFwiKS5hZGRDbGFzcyhcInczLWNhcmRcIilcclxufVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IGRpZ2l0YWx0d2lubW9kdWxlVUkoKTsiLCJjb25zdCBzaW1wbGVTZWxlY3RNZW51PSByZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvc2ltcGxlU2VsZWN0TWVudVwiKVxyXG5jb25zdCBzaW1wbGVDb25maXJtRGlhbG9nID0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL3NpbXBsZUNvbmZpcm1EaWFsb2dcIilcclxuY29uc3QgZ2xvYmFsQ2FjaGU9cmVxdWlyZShcIi4vZ2xvYmFsQ2FjaGVcIilcclxuY29uc3QgbXNhbEhlbHBlcj1yZXF1aXJlKFwiLi4vbXNhbEhlbHBlclwiKVxyXG5cclxuZnVuY3Rpb24gZWRpdExheW91dERpYWxvZygpIHtcclxuICAgIGlmKCF0aGlzLkRPTSl7XHJcbiAgICAgICAgdGhpcy5ET00gPSAkKCc8ZGl2IHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dG9wOjUwJTtiYWNrZ3JvdW5kLWNvbG9yOndoaXRlO2xlZnQ6NTAlO3RyYW5zZm9ybTogdHJhbnNsYXRlWCgtNTAlKSB0cmFuc2xhdGVZKC01MCUpO3otaW5kZXg6MTAxXCIgY2xhc3M9XCJ3My1jYXJkLTJcIj48L2Rpdj4nKVxyXG4gICAgICAgICQoXCJib2R5XCIpLmFwcGVuZCh0aGlzLkRPTSlcclxuICAgICAgICB0aGlzLkRPTS5oaWRlKClcclxuICAgIH1cclxufVxyXG5cclxuZWRpdExheW91dERpYWxvZy5wcm90b3R5cGUucmVmaWxsT3B0aW9ucyA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuY2xlYXJPcHRpb25zKClcclxuICAgIFxyXG4gICAgZm9yKHZhciBpbmQgaW4gZ2xvYmFsQ2FjaGUubGF5b3V0SlNPTil7XHJcbiAgICAgICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5hZGRPcHRpb24oaW5kKVxyXG4gICAgfVxyXG59XHJcblxyXG5lZGl0TGF5b3V0RGlhbG9nLnByb3RvdHlwZS5wb3B1cCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMuRE9NLnNob3coKVxyXG4gICAgdGhpcy5ET00uZW1wdHkoKVxyXG5cclxuICAgIHRoaXMuRE9NLmNzcyh7XCJ3aWR0aFwiOlwiMzIwcHhcIixcInBhZGRpbmctYm90dG9tXCI6XCIzcHhcIn0pXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQoJCgnPGRpdiBzdHlsZT1cImhlaWdodDo0MHB4O21hcmdpbi1ib3R0b206MnB4XCIgY2xhc3M9XCJ3My1iYXIgdzMtcmVkXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtXCIgc3R5bGU9XCJmb250LXNpemU6MS4yZW1cIj5MYXlvdXQ8L2Rpdj48L2Rpdj4nKSlcclxuICAgIHZhciBjbG9zZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmlnaHRcIiBzdHlsZT1cImZvbnQtc2l6ZToyZW07cGFkZGluZy10b3A6NHB4XCI+w5c8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5ET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZChjbG9zZUJ1dHRvbilcclxuICAgIGNsb3NlQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLkRPTS5oaWRlKCkgfSlcclxuXHJcbiAgICB2YXIgbmFtZUlucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lOyB3aWR0aDoxODBweDsgZGlzcGxheTppbmxpbmU7bWFyZ2luLWxlZnQ6MnB4O21hcmdpbi1yaWdodDoycHhcIiAgcGxhY2Vob2xkZXI9XCJGaWxsIGluIGEgbmV3IGxheW91dCBuYW1lLi4uXCIvPicpLmFkZENsYXNzKFwidzMtaW5wdXQgdzMtYm9yZGVyXCIpOyAgIFxyXG4gICAgdGhpcy5ET00uYXBwZW5kKG5hbWVJbnB1dClcclxuICAgIHZhciBzYXZlQXNOZXdCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ncmVlbiB3My1ob3Zlci1saWdodC1ncmVlblwiPlNhdmUgTmV3IExheW91dDwvYnV0dG9uPicpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQoc2F2ZUFzTmV3QnRuKVxyXG4gICAgc2F2ZUFzTmV3QnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuc2F2ZUludG9MYXlvdXQobmFtZUlucHV0LnZhbCgpKX0pXHJcblxyXG5cclxuICAgIGlmKCFqUXVlcnkuaXNFbXB0eU9iamVjdChnbG9iYWxDYWNoZS5sYXlvdXRKU09OKSl7XHJcbiAgICAgICAgdmFyIGxibD0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyIHczLXBhZGRpbmctMTZcIiBzdHlsZT1cInRleHQtYWxpZ246Y2VudGVyO1wiPi0gT1IgLTwvZGl2PicpXHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKGxibCkgXHJcbiAgICAgICAgdmFyIHN3aXRjaExheW91dFNlbGVjdG9yPW5ldyBzaW1wbGVTZWxlY3RNZW51KFwiXCIse2ZvbnRTaXplOlwiMWVtXCIsY29sb3JDbGFzczpcInczLWxpZ2h0LWdyYXlcIix3aWR0aDpcIjEyMHB4XCJ9KVxyXG4gICAgICAgIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3I9c3dpdGNoTGF5b3V0U2VsZWN0b3JcclxuICAgICAgICB0aGlzLnJlZmlsbE9wdGlvbnMoKVxyXG4gICAgICAgIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuY2FsbEJhY2tfY2xpY2tPcHRpb249KG9wdGlvblRleHQsb3B0aW9uVmFsdWUpPT57XHJcbiAgICAgICAgICAgIGlmKG9wdGlvblRleHQ9PW51bGwpIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuY2hhbmdlTmFtZShcIiBcIilcclxuICAgICAgICAgICAgZWxzZSB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmNoYW5nZU5hbWUob3B0aW9uVGV4dClcclxuICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIHZhciBzYXZlQXNCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ncmVlbiB3My1ob3Zlci1saWdodC1ncmVlblwiIHN0eWxlPVwibWFyZ2luLWxlZnQ6MnB4O21hcmdpbi1yaWdodDo1cHhcIj5TYXZlIEFzPC9idXR0b24+JylcclxuICAgICAgICB2YXIgZGVsZXRlQnRuPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtcmVkIHczLWhvdmVyLXBpbmtcIiBzdHlsZT1cIm1hcmdpbi1sZWZ0OjVweFwiPkRlbGV0ZSBMYXlvdXQ8L2J1dHRvbj4nKVxyXG4gICAgICAgIHRoaXMuRE9NLmFwcGVuZChzYXZlQXNCdG4sc3dpdGNoTGF5b3V0U2VsZWN0b3IuRE9NLGRlbGV0ZUJ0bilcclxuICAgICAgICBzYXZlQXNCdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5zYXZlSW50b0xheW91dChzd2l0Y2hMYXlvdXRTZWxlY3Rvci5jdXJTZWxlY3RWYWwpfSlcclxuICAgICAgICBkZWxldGVCdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5kZWxldGVMYXlvdXQoc3dpdGNoTGF5b3V0U2VsZWN0b3IuY3VyU2VsZWN0VmFsKX0pXHJcblxyXG4gICAgICAgIGlmKGdsb2JhbENhY2hlLmN1cnJlbnRMYXlvdXROYW1lIT1udWxsKXtcclxuICAgICAgICAgICAgc3dpdGNoTGF5b3V0U2VsZWN0b3IudHJpZ2dlck9wdGlvblZhbHVlKGdsb2JhbENhY2hlLmN1cnJlbnRMYXlvdXROYW1lKVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBzd2l0Y2hMYXlvdXRTZWxlY3Rvci50cmlnZ2VyT3B0aW9uSW5kZXgoMClcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmVkaXRMYXlvdXREaWFsb2cucHJvdG90eXBlLnNhdmVJbnRvTGF5b3V0ID0gZnVuY3Rpb24gKGxheW91dE5hbWUpIHtcclxuICAgIGlmKGxheW91dE5hbWU9PVwiXCIgfHwgbGF5b3V0TmFtZT09bnVsbCl7XHJcbiAgICAgICAgYWxlcnQoXCJQbGVhc2UgY2hvb3NlIHRhcmdldCBsYXlvdXQgTmFtZVwiKVxyXG4gICAgICAgIHJldHVyblxyXG4gICAgfVxyXG4gICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwic2F2ZUxheW91dFwiLCBcImxheW91dE5hbWVcIjogbGF5b3V0TmFtZX0pXHJcbiAgICB0aGlzLkRPTS5oaWRlKClcclxufVxyXG5cclxuXHJcbmVkaXRMYXlvdXREaWFsb2cucHJvdG90eXBlLmRlbGV0ZUxheW91dCA9IGZ1bmN0aW9uIChsYXlvdXROYW1lKSB7XHJcbiAgICBpZihsYXlvdXROYW1lPT1cIlwiIHx8IGxheW91dE5hbWU9PW51bGwpe1xyXG4gICAgICAgIGFsZXJ0KFwiUGxlYXNlIGNob29zZSB0YXJnZXQgbGF5b3V0IE5hbWVcIilcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGNvbmZpcm1EaWFsb2dEaXY9bmV3IHNpbXBsZUNvbmZpcm1EaWFsb2coKVxyXG5cclxuICAgIGNvbmZpcm1EaWFsb2dEaXYuc2hvdyhcclxuICAgICAgICB7IHdpZHRoOiBcIjI1MHB4XCIgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIkNvbmZpcm1cIlxyXG4gICAgICAgICAgICAsIGNvbnRlbnQ6IFwiQ29uZmlybSBkZWxldGluZyBsYXlvdXQgXFxcIlwiICsgbGF5b3V0TmFtZSArIFwiXFxcIj9cIlxyXG4gICAgICAgICAgICAsIGJ1dHRvbnM6W1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtcmVkIHczLWhvdmVyLXBpbmtcIiwgdGV4dDogXCJDb25maXJtXCIsIFwiY2xpY2tGdW5jXCI6IGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGdsb2JhbENhY2hlLmxheW91dEpTT05bbGF5b3V0TmFtZV1cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxheW91dE5hbWUgPT0gZ2xvYmFsQ2FjaGUuY3VycmVudExheW91dE5hbWUpIGdsb2JhbENhY2hlLmN1cnJlbnRMYXlvdXROYW1lID0gbnVsbFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKClcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwibGF5b3V0c1VwZGF0ZWRcIn0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVmaWxsT3B0aW9ucygpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IudHJpZ2dlck9wdGlvbkluZGV4KDApXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2RlbGV0ZUxheW91dFwiLCBcIlBPU1RcIiwgeyBcImxheW91dE5hbWVcIjogbGF5b3V0TmFtZSB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xvckNsYXNzOiBcInczLWdyYXlcIix0ZXh0OiBcIkNhbmNlbFwiLCBcImNsaWNrRnVuY1wiOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKVxyXG4gICAgICAgICAgICAgICAgfX1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH1cclxuICAgIClcclxuXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IGVkaXRMYXlvdXREaWFsb2coKTsiLCJjb25zdCBtc2FsSGVscGVyPXJlcXVpcmUoXCIuLi9tc2FsSGVscGVyXCIpXHJcbmNvbnN0IG1vZGVsQW5hbHl6ZXI9cmVxdWlyZShcIi4vbW9kZWxBbmFseXplclwiKVxyXG5cclxuZnVuY3Rpb24gZ2xvYmFsQ2FjaGUoKXtcclxuICAgIHRoaXMuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzID0ge31cclxuICAgIHRoaXMuc3RvcmVkVHdpbnMgPSB7fVxyXG4gICAgLy9zdG9yZWQgZGF0YSwgc2VwZXJhdGVseSBmcm9tIEFEVCBzZXJ2aWNlIGFuZCBmcm9tIGNvc21vc0RCIHNlcnZpY2VcclxuICAgIHRoaXMuREJNb2RlbHNBcnIgPSBbXVxyXG4gICAgdGhpcy5tb2RlbElETWFwVG9OYW1lPXt9XHJcbiAgICB0aGlzLm1vZGVsTmFtZU1hcFRvSUQ9e31cclxuXHJcbiAgICB0aGlzLkRCVHdpbnNBcnIgPSBbXVxyXG4gICAgdGhpcy50d2luSURNYXBUb0Rpc3BsYXlOYW1lPXt9XHJcblxyXG4gICAgdGhpcy5jdXJyZW50TGF5b3V0TmFtZT1udWxsXHJcbiAgICB0aGlzLmxheW91dEpTT049e31cclxuXHJcbiAgICB0aGlzLnZpc3VhbERlZmluaXRpb249e1wiZGVmYXVsdFwiOnt9fVxyXG59XHJcblxyXG5nbG9iYWxDYWNoZS5wcm90b3R5cGUubG9hZFVzZXJEYXRhID0gYXN5bmMgZnVuY3Rpb24gKCkge1xyXG4gICAgdHJ5e1xyXG4gICAgICAgIHZhciByZXM9YXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vZmV0Y2hVc2VyRGF0YVwiKVxyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHZhciBkYnR3aW5zPVtdXHJcbiAgICB2YXIgZGJtb2RlbHM9W11cclxuICAgIHJlcy5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIGlmKGVsZW1lbnQudHlwZT09XCJ2aXN1YWxTY2hlbWFcIikge1xyXG4gICAgICAgICAgICAvL1RPRE86IG5vdyB0aGVyZSBpcyBvbmx5IG9uZSBcImRlZmF1bHRcIiBzY2hlbWEgdG8gdXNlXHJcbiAgICAgICAgICAgIHRoaXMudmlzdWFsRGVmaW5pdGlvbltlbGVtZW50Lm5hbWVdPWVsZW1lbnQuZGV0YWlsXHJcbiAgICAgICAgfWVsc2UgaWYoZWxlbWVudC50eXBlPT1cIlRvcG9sb2d5XCIpIHtcclxuICAgICAgICAgICAgdGhpcy5sYXlvdXRKU09OW2VsZW1lbnQubmFtZV09ZWxlbWVudC5kZXRhaWxcclxuICAgICAgICB9ZWxzZSBpZihlbGVtZW50LnR5cGU9PVwiRFRNb2RlbFwiKSBkYm1vZGVscy5wdXNoKGVsZW1lbnQpXHJcbiAgICAgICAgZWxzZSBpZihlbGVtZW50LnR5cGU9PVwiRFRUd2luXCIpIGRidHdpbnMucHVzaChlbGVtZW50KVxyXG4gICAgfSk7XHJcbiAgICB0aGlzLnN0b3JlREJUd2luc0FycihkYnR3aW5zKVxyXG4gICAgdGhpcy5zdG9yZURCTW9kZWxzQXJyKGRibW9kZWxzKVxyXG4gICAgLy9xdWVyeSBkZXRhaWwgb2YgYWxsIG1vZGVsc1xyXG4gICAgZm9yKHZhciBpbmQgaW4gdGhpcy5tb2RlbElETWFwVG9OYW1lKSBkZWxldGUgdGhpcy5tb2RlbElETWFwVG9OYW1lW2luZF1cclxuICAgIGZvcih2YXIgaW5kIGluIHRoaXMubW9kZWxOYW1lTWFwVG9JRCkgZGVsZXRlIHRoaXMubW9kZWxOYW1lTWFwVG9JRFtpbmRdXHJcbiAgICB2YXIgbW9kZWxJRHM9W11cclxuICAgIHRoaXMuREJNb2RlbHNBcnIuZm9yRWFjaChvbmVNb2RlbD0+e21vZGVsSURzLnB1c2gob25lTW9kZWxbXCJpZFwiXSl9KVxyXG4gICAgdHJ5IHtcclxuICAgICAgICB2YXIgZGF0YSA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2xpc3RNb2RlbHNGb3JJRHNcIiwgXCJQT1NUXCIsIG1vZGVsSURzKVxyXG4gICAgICAgIHZhciB0bXBOYW1lVG9PYmogPSB7fVxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAoZGF0YVtpXVtcImRpc3BsYXlOYW1lXCJdID09IG51bGwpIGRhdGFbaV1bXCJkaXNwbGF5TmFtZVwiXSA9IGRhdGFbaV1bXCJAaWRcIl1cclxuICAgICAgICAgICAgaWYgKCQuaXNQbGFpbk9iamVjdChkYXRhW2ldW1wiZGlzcGxheU5hbWVcIl0pKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGF0YVtpXVtcImRpc3BsYXlOYW1lXCJdW1wiZW5cIl0pIGRhdGFbaV1bXCJkaXNwbGF5TmFtZVwiXSA9IGRhdGFbaV1bXCJkaXNwbGF5TmFtZVwiXVtcImVuXCJdXHJcbiAgICAgICAgICAgICAgICBlbHNlIGRhdGFbaV1bXCJkaXNwbGF5TmFtZVwiXSA9IEpTT04uc3RyaW5naWZ5KGRhdGFbaV1bXCJkaXNwbGF5TmFtZVwiXSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodG1wTmFtZVRvT2JqW2RhdGFbaV1bXCJkaXNwbGF5TmFtZVwiXV0gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgLy9yZXBlYXRlZCBtb2RlbCBkaXNwbGF5IG5hbWVcclxuICAgICAgICAgICAgICAgIGRhdGFbaV1bXCJkaXNwbGF5TmFtZVwiXSA9IGRhdGFbaV1bXCJAaWRcIl1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0bXBOYW1lVG9PYmpbZGF0YVtpXVtcImRpc3BsYXlOYW1lXCJdXSA9IGRhdGFbaV1cclxuXHJcbiAgICAgICAgICAgIHRoaXMubW9kZWxJRE1hcFRvTmFtZVtkYXRhW2ldW1wiQGlkXCJdXT1kYXRhW2ldW1wiZGlzcGxheU5hbWVcIl1cclxuICAgICAgICAgICAgdGhpcy5tb2RlbE5hbWVNYXBUb0lEW2RhdGFbaV1bXCJkaXNwbGF5TmFtZVwiXV09ZGF0YVtpXVtcIkBpZFwiXVxyXG4gICAgICAgIH1cclxuICAgICAgICBtb2RlbEFuYWx5emVyLmNsZWFyQWxsTW9kZWxzKCk7XHJcbiAgICAgICAgbW9kZWxBbmFseXplci5hZGRNb2RlbHMoZGF0YSlcclxuICAgICAgICBtb2RlbEFuYWx5emVyLmFuYWx5emUoKTtcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgIH1cclxufVxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLnN0b3JlQURUVHdpbnM9ZnVuY3Rpb24odHdpbnNEYXRhKXtcclxuICAgIHR3aW5zRGF0YS5mb3JFYWNoKChvbmVOb2RlKT0+e3RoaXMuc3RvcmVTaW5nbGVBRFRUd2luKG9uZU5vZGUpfSk7XHJcbn1cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZVNpbmdsZUFEVFR3aW49ZnVuY3Rpb24ob25lTm9kZSl7XHJcbiAgICB0aGlzLnN0b3JlZFR3aW5zW29uZU5vZGVbXCIkZHRJZFwiXV0gPSBvbmVOb2RlXHJcbiAgICBvbmVOb2RlW1wiZGlzcGxheU5hbWVcIl09IHRoaXMudHdpbklETWFwVG9EaXNwbGF5TmFtZVtvbmVOb2RlW1wiJGR0SWRcIl1dXHJcbn1cclxuXHJcblxyXG5nbG9iYWxDYWNoZS5wcm90b3R5cGUuc3RvcmVTaW5nbGVEQlR3aW49ZnVuY3Rpb24oREJUd2luKXtcclxuICAgIGZvcih2YXIgaT0wO2k8dGhpcy5EQlR3aW5zQXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBvbmVEQlR3aW49dGhpcy5EQlR3aW5zQXJyW2ldXHJcbiAgICAgICAgaWYob25lREJUd2luW1wiaWRcIl09PURCVHdpbltcImlkXCJdKXtcclxuICAgICAgICAgICAgdGhpcy5EQlR3aW5zQXJyLnNwbGljZShpLDEpXHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMuREJUd2luc0Fyci5wdXNoKERCVHdpbilcclxuXHJcbiAgICB0aGlzLnR3aW5JRE1hcFRvRGlzcGxheU5hbWVbREJUd2luW1wiaWRcIl1dPURCVHdpbltcImRpc3BsYXlOYW1lXCJdXHJcbn1cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZURCVHdpbnNBcnI9ZnVuY3Rpb24oREJUd2luc0Fycil7XHJcbiAgICB0aGlzLkRCVHdpbnNBcnIubGVuZ3RoPTBcclxuICAgIHRoaXMuREJUd2luc0Fycj10aGlzLkRCVHdpbnNBcnIuY29uY2F0KERCVHdpbnNBcnIpXHJcbiAgICBmb3IodmFyIGluZCBpbiB0aGlzLnR3aW5JRE1hcFRvRGlzcGxheU5hbWUpIGRlbGV0ZSB0aGlzLnR3aW5JRE1hcFRvRGlzcGxheU5hbWVbaW5kXVxyXG4gICAgdGhpcy5EQlR3aW5zQXJyLmZvckVhY2gob25lREJUd2luPT57XHJcbiAgICAgICAgdGhpcy50d2luSURNYXBUb0Rpc3BsYXlOYW1lW29uZURCVHdpbltcImlkXCJdXT1vbmVEQlR3aW5bXCJkaXNwbGF5TmFtZVwiXVxyXG4gICAgfSlcclxufVxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLnN0b3JlREJNb2RlbHNBcnI9ZnVuY3Rpb24oREJNb2RlbHNBcnIpe1xyXG4gICAgdGhpcy5EQk1vZGVsc0Fyci5sZW5ndGg9MFxyXG4gICAgdGhpcy5EQk1vZGVsc0Fycj10aGlzLkRCTW9kZWxzQXJyLmNvbmNhdChEQk1vZGVsc0FycilcclxufVxyXG5cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzPWZ1bmN0aW9uKHJlbGF0aW9uc0RhdGEpe1xyXG4gICAgcmVsYXRpb25zRGF0YS5mb3JFYWNoKChvbmVSZWxhdGlvbnNoaXApPT57XHJcbiAgICAgICAgdmFyIHR3aW5JRD1vbmVSZWxhdGlvbnNoaXBbJyRzb3VyY2VJZCddXHJcbiAgICAgICAgdGhpcy5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbdHdpbklEXT1bXVxyXG4gICAgfSlcclxuXHJcbiAgICByZWxhdGlvbnNEYXRhLmZvckVhY2goKG9uZVJlbGF0aW9uc2hpcCk9PntcclxuICAgICAgICB0aGlzLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tvbmVSZWxhdGlvbnNoaXBbJyRzb3VyY2VJZCddXS5wdXNoKG9uZVJlbGF0aW9uc2hpcClcclxuICAgIH0pXHJcbn1cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzX2FwcGVuZD1mdW5jdGlvbihyZWxhdGlvbnNEYXRhKXtcclxuICAgIHJlbGF0aW9uc0RhdGEuZm9yRWFjaCgob25lUmVsYXRpb25zaGlwKT0+e1xyXG4gICAgICAgIGlmKCF0aGlzLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tvbmVSZWxhdGlvbnNoaXBbJyRzb3VyY2VJZCddXSlcclxuICAgICAgICAgICAgdGhpcy5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbb25lUmVsYXRpb25zaGlwWyckc291cmNlSWQnXV09W11cclxuICAgICAgICB0aGlzLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tvbmVSZWxhdGlvbnNoaXBbJyRzb3VyY2VJZCddXS5wdXNoKG9uZVJlbGF0aW9uc2hpcClcclxuICAgIH0pXHJcbn1cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzX3JlbW92ZT1mdW5jdGlvbihyZWxhdGlvbnNEYXRhKXtcclxuICAgIHJlbGF0aW9uc0RhdGEuZm9yRWFjaCgob25lUmVsYXRpb25zaGlwKT0+e1xyXG4gICAgICAgIHZhciBzcmNJRD1vbmVSZWxhdGlvbnNoaXBbXCJzcmNJRFwiXVxyXG4gICAgICAgIGlmKHRoaXMuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW3NyY0lEXSl7XHJcbiAgICAgICAgICAgIHZhciBhcnI9dGhpcy5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbc3JjSURdXHJcbiAgICAgICAgICAgIGZvcih2YXIgaT0wO2k8YXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICAgICAgaWYoYXJyW2ldWyckcmVsYXRpb25zaGlwSWQnXT09b25lUmVsYXRpb25zaGlwW1wicmVsSURcIl0pe1xyXG4gICAgICAgICAgICAgICAgICAgIGFyci5zcGxpY2UoaSwxKVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgZ2xvYmFsQ2FjaGUoKTsiLCJjb25zdCBtb2RlbEFuYWx5emVyID0gcmVxdWlyZShcIi4vbW9kZWxBbmFseXplclwiKTtcclxuY29uc3Qgc2ltcGxlU2VsZWN0TWVudT0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL3NpbXBsZVNlbGVjdE1lbnVcIilcclxuY29uc3Qgc2ltcGxlQ29uZmlybURpYWxvZyA9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9zaW1wbGVDb25maXJtRGlhbG9nXCIpXHJcbmNvbnN0IGdsb2JhbENhY2hlID0gcmVxdWlyZShcIi4vZ2xvYmFsQ2FjaGVcIilcclxuY29uc3QgbXNhbEhlbHBlciA9IHJlcXVpcmUoXCIuLi9tc2FsSGVscGVyXCIpXHJcblxyXG5mdW5jdGlvbiBpbmZvUGFuZWwoKSB7XHJcbiAgICB0aGlzLmNvbnRpbmVyRE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1jYXJkXCIgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt6LWluZGV4OjkwO3JpZ2h0OjBweDt0b3A6NTAlO2hlaWdodDo3MCU7d2lkdGg6MzAwcHg7dHJhbnNmb3JtOiB0cmFuc2xhdGVZKC01MCUpO1wiPjwvZGl2PicpXHJcbiAgICB0aGlzLmNvbnRpbmVyRE9NLmhpZGUoKVxyXG4gICAgdGhpcy5jb250aW5lckRPTS5hcHBlbmQoJCgnPGRpdiBzdHlsZT1cImhlaWdodDo1MHB4XCIgY2xhc3M9XCJ3My1iYXIgdzMtcmVkXCI+PC9kaXY+JykpXHJcblxyXG4gICAgdGhpcy5jbG9zZUJ1dHRvbjE9JCgnPGJ1dHRvbiBzdHlsZT1cImhlaWdodDoxMDAlXCIgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b25cIj48aSBjbGFzcz1cImZhIGZhLWluZm8tY2lyY2xlIGZhLTJ4XCIgc3R5bGU9XCJwYWRkaW5nOjJweFwiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5jbG9zZUJ1dHRvbjI9JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yaWdodFwiIHN0eWxlPVwiZm9udC1zaXplOjJlbVwiPsOXPC9idXR0b24+JylcclxuICAgIHRoaXMuY29udGluZXJET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZCh0aGlzLmNsb3NlQnV0dG9uMSx0aGlzLmNsb3NlQnV0dG9uMikgXHJcblxyXG4gICAgdGhpcy5pc01pbmltaXplZD1mYWxzZTtcclxuICAgIHZhciBidXR0b25BbmltPSgpPT57XHJcbiAgICAgICAgaWYoIXRoaXMuaXNNaW5pbWl6ZWQpe1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRpbmVyRE9NLmFuaW1hdGUoe1xyXG4gICAgICAgICAgICAgICAgcmlnaHQ6IFwiLTI1MHB4XCIsXHJcbiAgICAgICAgICAgICAgICBoZWlnaHQ6XCI1MHB4XCJcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgdGhpcy5pc01pbmltaXplZD10cnVlO1xyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRpbmVyRE9NLmFuaW1hdGUoe1xyXG4gICAgICAgICAgICAgICAgcmlnaHQ6IFwiMHB4XCIsXHJcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IFwiNzAlXCJcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgdGhpcy5pc01pbmltaXplZD1mYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLmNsb3NlQnV0dG9uMS5vbihcImNsaWNrXCIsYnV0dG9uQW5pbSlcclxuICAgIHRoaXMuY2xvc2VCdXR0b24yLm9uKFwiY2xpY2tcIixidXR0b25BbmltKVxyXG5cclxuICAgIHRoaXMuRE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1jb250YWluZXJcIiBzdHlsZT1cInBvc3Rpb246YWJzb2x1dGU7dG9wOjUwcHg7aGVpZ2h0OmNhbGMoMTAwJSAtIDUwcHgpO292ZXJmbG93OmF1dG9cIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5jb250aW5lckRPTS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIsXCJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuOClcIilcclxuICAgIHRoaXMuY29udGluZXJET00uaG92ZXIoKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuY29udGluZXJET00uY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiLCBcInJnYmEoMjU1LCAyNTUsIDI1NSwgMSlcIilcclxuICAgIH0sICgpID0+IHtcclxuICAgICAgICB0aGlzLmNvbnRpbmVyRE9NLmNzcyhcImJhY2tncm91bmQtY29sb3JcIiwgXCJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuOClcIilcclxuICAgIH0pO1xyXG4gICAgdGhpcy5jb250aW5lckRPTS5hcHBlbmQodGhpcy5ET00pXHJcbiAgICAkKCdib2R5JykuYXBwZW5kKHRoaXMuY29udGluZXJET00pXHJcbiAgICB0aGlzLkRPTS5odG1sKFwiPGEgc3R5bGU9J2Rpc3BsYXk6YmxvY2s7Zm9udC1zdHlsZTppdGFsaWM7Y29sb3I6Z3JheSc+Q2hvb3NlIHR3aW5zIG9yIHJlbGF0aW9uc2hpcHMgdG8gdmlldyBpbmZvbXJhdGlvbjwvYT48YSBzdHlsZT0nZGlzcGxheTpibG9jaztmb250LXN0eWxlOml0YWxpYztjb2xvcjpncmF5O3BhZGRpbmctdG9wOjIwcHgnPlByZXNzIHNoaWZ0IGtleSB0byBzZWxlY3QgbXVsdGlwbGUgaW4gdG9wb2xvZ3kgdmlldzwvYT48YSBzdHlsZT0nZGlzcGxheTpibG9jaztmb250LXN0eWxlOml0YWxpYztjb2xvcjpncmF5O3BhZGRpbmctdG9wOjIwcHg7cGFkZGluZy1ib3R0b206MjBweCc+UHJlc3MgY3RybCBrZXkgdG8gc2VsZWN0IG11bHRpcGxlIGluIHRyZWUgdmlldzwvYT48YSBzdHlsZT0nZGlzcGxheTpibG9jaztmb250LXN0eWxlOml0YWxpYztjb2xvcjpncmF5O3BhZGRpbmctdG9wOjIwcHg7cGFkZGluZy1ib3R0b206NXB4Jz5JbXBvcnQgdHdpbnMgZGF0YSBieSBjbGlja2luZyBidXR0b24gYmVsb3c8L2E+XCIpXHJcblxyXG4gICAgdGhpcy5kcmF3QnV0dG9ucyhudWxsKVxyXG4gICAgdGhpcy5zZWxlY3RlZE9iamVjdHM9bnVsbDtcclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5yeE1lc3NhZ2U9ZnVuY3Rpb24obXNnUGF5bG9hZCl7XHJcbiAgICBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwic3RhcnRTZWxlY3Rpb25EaWFsb2dfY2xvc2VkXCIpe1xyXG4gICAgICAgIGlmKCF0aGlzLmNvbnRpbmVyRE9NLmlzKFwiOnZpc2libGVcIikpIHtcclxuICAgICAgICAgICAgdGhpcy5jb250aW5lckRPTS5zaG93KClcclxuICAgICAgICAgICAgdGhpcy5jb250aW5lckRPTS5hZGRDbGFzcyhcInczLWFuaW1hdGUtcmlnaHRcIilcclxuICAgICAgICB9XHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwic2hvd0luZm9TZWxlY3RlZE5vZGVzXCIpe1xyXG4gICAgICAgIHRoaXMuRE9NLmVtcHR5KClcclxuICAgICAgICB2YXIgYXJyPW1zZ1BheWxvYWQuaW5mbztcclxuICAgICAgICBcclxuICAgICAgICBpZihhcnI9PW51bGwgfHwgYXJyLmxlbmd0aD09MCl7XHJcbiAgICAgICAgICAgIHRoaXMuZHJhd0J1dHRvbnMobnVsbClcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZE9iamVjdHM9W107XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zZWxlY3RlZE9iamVjdHM9YXJyO1xyXG4gICAgICAgIGlmKGFyci5sZW5ndGg9PTEpe1xyXG4gICAgICAgICAgICB2YXIgc2luZ2xlRWxlbWVudEluZm89YXJyWzBdO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYoc2luZ2xlRWxlbWVudEluZm9bXCIkZHRJZFwiXSl7Ly8gc2VsZWN0IGEgbm9kZVxyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3QnV0dG9ucyhcInNpbmdsZU5vZGVcIilcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy9pbnN0ZWFkIG9mIGRyYXcgdGhlICRkdElkLCBkcmF3IGRpc3BsYXkgbmFtZSBpbnN0ZWFkXHJcbiAgICAgICAgICAgICAgICAvL3RoaXMuZHJhd1N0YXRpY0luZm8odGhpcy5ET00se1wiJGR0SWRcIjpzaW5nbGVFbGVtZW50SW5mb1tcIiRkdElkXCJdfSxcIjFlbVwiLFwiMTNweFwiKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3U3RhdGljSW5mbyh0aGlzLkRPTSx7XCJuYW1lXCI6c2luZ2xlRWxlbWVudEluZm9bXCJkaXNwbGF5TmFtZVwiXX0sXCIxZW1cIixcIjEzcHhcIilcclxuXHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIG1vZGVsTmFtZT1zaW5nbGVFbGVtZW50SW5mb1snJG1ldGFkYXRhJ11bJyRtb2RlbCddXHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGlmKG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbE5hbWVdKXtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYXdFZGl0YWJsZSh0aGlzLkRPTSxtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxOYW1lXS5lZGl0YWJsZVByb3BlcnRpZXMsc2luZ2xlRWxlbWVudEluZm8sW10pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvL2luc3RlYWQgb2YgZHJhd2luZyB0aGUgb3JpZ2luYWwgaW5mb21yYXRpb24sIGRyYXcgbW9yZSBtZWFuaW5nZnVsIG9uZVxyXG4gICAgICAgICAgICAgICAgLy90aGlzLmRyYXdTdGF0aWNJbmZvKHRoaXMuRE9NLHtcIiRldGFnXCI6c2luZ2xlRWxlbWVudEluZm9bXCIkZXRhZ1wiXSxcIiRtZXRhZGF0YVwiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJG1ldGFkYXRhXCJdfSxcIjFlbVwiLFwiMTBweFwiKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3U3RhdGljSW5mbyh0aGlzLkRPTSx7XCJNb2RlbFwiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJG1ldGFkYXRhXCJdW1wiJG1vZGVsXCJdfSxcIjFlbVwiLFwiMTBweFwiKVxyXG4gICAgICAgICAgICAgICAgZm9yKHZhciBpbmQgaW4gc2luZ2xlRWxlbWVudEluZm9bXCIkbWV0YWRhdGFcIl0pe1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKGluZCA9PSBcIiRtb2RlbFwiKSBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdG1wT2JqPXt9XHJcbiAgICAgICAgICAgICAgICAgICAgdG1wT2JqW2luZF09c2luZ2xlRWxlbWVudEluZm9bXCIkbWV0YWRhdGFcIl1baW5kXVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhd1N0YXRpY0luZm8odGhpcy5ET00sdG1wT2JqLFwiMWVtXCIsXCIxMHB4XCIpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1lbHNlIGlmKHNpbmdsZUVsZW1lbnRJbmZvW1wiJHNvdXJjZUlkXCJdKXtcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhd0J1dHRvbnMoXCJzaW5nbGVSZWxhdGlvbnNoaXBcIilcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhd1N0YXRpY0luZm8odGhpcy5ET00se1xyXG4gICAgICAgICAgICAgICAgICAgIFwiRnJvbVwiOmdsb2JhbENhY2hlLnR3aW5JRE1hcFRvRGlzcGxheU5hbWVbc2luZ2xlRWxlbWVudEluZm9bXCIkc291cmNlSWRcIl1dLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiVG9cIjpnbG9iYWxDYWNoZS50d2luSURNYXBUb0Rpc3BsYXlOYW1lW3NpbmdsZUVsZW1lbnRJbmZvW1wiJHRhcmdldElkXCJdXSxcclxuICAgICAgICAgICAgICAgICAgICBcIlJlbGF0aW9uc2hpcCBUeXBlXCI6c2luZ2xlRWxlbWVudEluZm9bXCIkcmVsYXRpb25zaGlwTmFtZVwiXVxyXG4gICAgICAgICAgICAgICAgICAgIC8vLFwiJHJlbGF0aW9uc2hpcElkXCI6c2luZ2xlRWxlbWVudEluZm9bXCIkcmVsYXRpb25zaGlwSWRcIl1cclxuICAgICAgICAgICAgICAgIH0sXCIxZW1cIixcIjEzcHhcIilcclxuICAgICAgICAgICAgICAgIHZhciByZWxhdGlvbnNoaXBOYW1lPXNpbmdsZUVsZW1lbnRJbmZvW1wiJHJlbGF0aW9uc2hpcE5hbWVcIl1cclxuICAgICAgICAgICAgICAgIHZhciBzb3VyY2VNb2RlbD1zaW5nbGVFbGVtZW50SW5mb1tcInNvdXJjZU1vZGVsXCJdXHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhd0VkaXRhYmxlKHRoaXMuRE9NLHRoaXMuZ2V0UmVsYXRpb25TaGlwRWRpdGFibGVQcm9wZXJ0aWVzKHJlbGF0aW9uc2hpcE5hbWUsc291cmNlTW9kZWwpLHNpbmdsZUVsZW1lbnRJbmZvLFtdKVxyXG4gICAgICAgICAgICAgICAgZm9yKHZhciBpbmQgaW4gc2luZ2xlRWxlbWVudEluZm9bXCIkbWV0YWRhdGFcIl0pe1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0bXBPYmo9e31cclxuICAgICAgICAgICAgICAgICAgICB0bXBPYmpbaW5kXT1zaW5nbGVFbGVtZW50SW5mb1tcIiRtZXRhZGF0YVwiXVtpbmRdXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmF3U3RhdGljSW5mbyh0aGlzLkRPTSx0bXBPYmosXCIxZW1cIixcIjEwcHhcIilcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vdGhpcy5kcmF3U3RhdGljSW5mbyh0aGlzLkRPTSx7XCIkZXRhZ1wiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJGV0YWdcIl19LFwiMWVtXCIsXCIxMHB4XCIsXCJEYXJrR3JheVwiKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfWVsc2UgaWYoYXJyLmxlbmd0aD4xKXtcclxuICAgICAgICAgICAgdGhpcy5kcmF3QnV0dG9ucyhcIm11bHRpcGxlXCIpXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd011bHRpcGxlT2JqKClcclxuICAgICAgICB9XHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwic2hvd0luZm9Hcm91cE5vZGVcIil7XHJcbiAgICAgICAgdGhpcy5ET00uZW1wdHkoKVxyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBtb2RlbElEID0gbXNnUGF5bG9hZC5pbmZvW1wiQGlkXCJdXHJcbiAgICAgICAgZ2xvYmFsQ2FjaGUuc2hvd2luZ0NyZWF0ZVR3aW5Nb2RlbElEPW1vZGVsSURcclxuICAgICAgICBpZighbW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdKSByZXR1cm47XHJcbiAgICAgICAgdmFyIHR3aW5Kc29uID0ge1xyXG4gICAgICAgICAgICBcIiRtZXRhZGF0YVwiOiB7XHJcbiAgICAgICAgICAgICAgICBcIiRtb2RlbFwiOiBtb2RlbElEXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGFkZEJ0biA9JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ncmVlbiB3My1ob3Zlci1saWdodC1ncmVlbiB3My1tYXJnaW5cIj5BZGQgVHdpbjwvYnV0dG9uPicpXHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKGFkZEJ0bilcclxuXHJcbiAgICAgICAgYWRkQnRuLm9uKFwiY2xpY2tcIiwoZSkgPT4ge1xyXG4gICAgICAgICAgICBpZighdHdpbkpzb25bXCIkZHRJZFwiXXx8dHdpbkpzb25bXCIkZHRJZFwiXT09XCJcIil7XHJcbiAgICAgICAgICAgICAgICBhbGVydChcIlBsZWFzZSBmaWxsIGluIG5hbWUgZm9yIHRoZSBuZXcgZGlnaXRhbCB0d2luXCIpXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBjb21wb25lbnRzTmFtZUFycj1tb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF0uaW5jbHVkZWRDb21wb25lbnRzXHJcbiAgICAgICAgICAgIGNvbXBvbmVudHNOYW1lQXJyLmZvckVhY2gob25lQ29tcG9uZW50TmFtZT0+eyAvL2FkdCBzZXJ2aWNlIHJlcXVlc3RpbmcgYWxsIGNvbXBvbmVudCBhcHBlYXIgYnkgbWFuZGF0b3J5XHJcbiAgICAgICAgICAgICAgICBpZih0d2luSnNvbltvbmVDb21wb25lbnROYW1lXT09bnVsbCl0d2luSnNvbltvbmVDb21wb25lbnROYW1lXT17fVxyXG4gICAgICAgICAgICAgICAgdHdpbkpzb25bb25lQ29tcG9uZW50TmFtZV1bXCIkbWV0YWRhdGFcIl09IHt9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIHRoaXMuYWRkVHdpbih0d2luSnNvbilcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICB0aGlzLmRyYXdTdGF0aWNJbmZvKHRoaXMuRE9NLHtcclxuICAgICAgICAgICAgXCJNb2RlbFwiOm1vZGVsSURcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICBhZGRCdG4uZGF0YShcInR3aW5Kc29uXCIsdHdpbkpzb24pXHJcbiAgICAgICAgdmFyIGNvcHlQcm9wZXJ0eT1KU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXS5lZGl0YWJsZVByb3BlcnRpZXMpKVxyXG4gICAgICAgIGNvcHlQcm9wZXJ0eVsnJGR0SWQnXT1cInN0cmluZ1wiXHJcbiAgICAgICAgdGhpcy5kcmF3RWRpdGFibGUodGhpcy5ET00sY29weVByb3BlcnR5LHR3aW5Kc29uLFtdLFwibmV3VHdpblwiKVxyXG4gICAgICAgIC8vY29uc29sZS5sb2cobW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdKSBcclxuICAgIH1cclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5hZGRUd2luPWFzeW5jIGZ1bmN0aW9uKHR3aW5Kc29uKXtcclxuICAgIC8vYXNrIHRhc2ttYXN0ZXIgdG8gYWRkIHRoZSB0d2luXHJcbiAgICB0cnl7XHJcbiAgICAgICAgdmFyIGRhdGEgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi91cHNlcnREaWdpdGFsVHdpblwiLCBcIlBPU1RcIiwgIHtcIm5ld1R3aW5Kc29uXCI6SlNPTi5zdHJpbmdpZnkodHdpbkpzb24pfSlcclxuICAgIH1jYXRjaChlKXtcclxuICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgIH1cclxuXHJcbiAgICBnbG9iYWxDYWNoZS5zdG9yZVNpbmdsZURCVHdpbihkYXRhLkRCVHdpbilcclxuICAgIC8vc3VjY2Vzc2Z1bCBlZGl0aW5nLCB1cGRhdGUgdGhlIG5vZGUgb3JpZ2luYWwgaW5mb1xyXG4gICAgdmFyIGtleUxhYmVsID0gdGhpcy5ET00uZmluZCgnI05FV1RXSU5fSURMYWJlbCcpXHJcbiAgICB2YXIgSURJbnB1dCA9IGtleUxhYmVsLmZpbmQoXCJpbnB1dFwiKVxyXG4gICAgaWYgKElESW5wdXQpIElESW5wdXQudmFsKFwiXCIpXHJcbiAgICBcclxuICAgIGdsb2JhbENhY2hlLnN0b3JlU2luZ2xlQURUVHdpbihkYXRhLkFEVFR3aW4pXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJhZGROZXdUd2luXCIsIHR3aW5JbmZvOiBkYXRhLkFEVFR3aW4gfSlcclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5nZXRSZWxhdGlvblNoaXBFZGl0YWJsZVByb3BlcnRpZXM9ZnVuY3Rpb24ocmVsYXRpb25zaGlwTmFtZSxzb3VyY2VNb2RlbCl7XHJcbiAgICBpZighbW9kZWxBbmFseXplci5EVERMTW9kZWxzW3NvdXJjZU1vZGVsXSB8fCAhbW9kZWxBbmFseXplci5EVERMTW9kZWxzW3NvdXJjZU1vZGVsXS52YWxpZFJlbGF0aW9uc2hpcHNbcmVsYXRpb25zaGlwTmFtZV0pIHJldHVyblxyXG4gICAgcmV0dXJuIG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1tzb3VyY2VNb2RlbF0udmFsaWRSZWxhdGlvbnNoaXBzW3JlbGF0aW9uc2hpcE5hbWVdLmVkaXRhYmxlUmVsYXRpb25zaGlwUHJvcGVydGllc1xyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmRyYXdCdXR0b25zPWZ1bmN0aW9uKHNlbGVjdFR5cGUpe1xyXG4gICAgdmFyIGltcEJ0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWJsdWVcIj48aSBjbGFzcz1cImZhIGZhLWFycm93LWNpcmNsZS1vLWRvd25cIj48L2k+PC9idXR0b24+JylcclxuICAgIHZhciBhY3R1YWxJbXBvcnRUd2luc0J0biA9JCgnPGlucHV0IHR5cGU9XCJmaWxlXCIgbmFtZT1cIm1vZGVsRmlsZXNcIiBtdWx0aXBsZT1cIm11bHRpcGxlXCIgc3R5bGU9XCJkaXNwbGF5Om5vbmVcIj48L2lucHV0PicpXHJcbiAgICBpZihzZWxlY3RUeXBlIT1udWxsKXtcclxuICAgICAgICB2YXIgcmVmcmVzaEJ0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWJsYWNrXCI+PGkgY2xhc3M9XCJmYSBmYS1yZWZyZXNoXCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIGV4cEJ0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWdyZWVuXCI+PGkgY2xhc3M9XCJmYSBmYS1hcnJvdy1jaXJjbGUtby11cFwiPjwvaT48L2J1dHRvbj4nKSAgICBcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQocmVmcmVzaEJ0bixleHBCdG4saW1wQnRuLGFjdHVhbEltcG9ydFR3aW5zQnRuKVxyXG4gICAgICAgIHJlZnJlc2hCdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5yZWZyZXNoSW5mb21hdGlvbigpfSlcclxuICAgICAgICBleHBCdG4ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgICAgIC8vZmluZCBvdXQgdGhlIHR3aW5zIGluIHNlbGVjdGlvbiBhbmQgdGhlaXIgY29ubmVjdGlvbnMgKGZpbHRlciBib3RoIHNyYyBhbmQgdGFyZ2V0IHdpdGhpbiB0aGUgc2VsZWN0ZWQgdHdpbnMpXHJcbiAgICAgICAgICAgIC8vYW5kIGV4cG9ydCB0aGVtXHJcbiAgICAgICAgICAgIHRoaXMuZXhwb3J0U2VsZWN0ZWQoKVxyXG4gICAgICAgIH0pICAgIFxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKGltcEJ0bixhY3R1YWxJbXBvcnRUd2luc0J0bilcclxuICAgIH1cclxuICAgIFxyXG4gICAgaW1wQnRuLm9uKFwiY2xpY2tcIiwoKT0+e2FjdHVhbEltcG9ydFR3aW5zQnRuLnRyaWdnZXIoJ2NsaWNrJyk7fSlcclxuICAgIGFjdHVhbEltcG9ydFR3aW5zQnRuLmNoYW5nZShhc3luYyAoZXZ0KT0+e1xyXG4gICAgICAgIHZhciBmaWxlcyA9IGV2dC50YXJnZXQuZmlsZXM7IC8vIEZpbGVMaXN0IG9iamVjdFxyXG4gICAgICAgIGF3YWl0IHRoaXMucmVhZFR3aW5zRmlsZXNDb250ZW50QW5kSW1wb3J0KGZpbGVzKVxyXG4gICAgICAgIGFjdHVhbEltcG9ydFR3aW5zQnRuLnZhbChcIlwiKVxyXG4gICAgfSlcclxuICAgIGlmKHNlbGVjdFR5cGU9PW51bGwpIHJldHVybjtcclxuXHJcbiAgICBpZihzZWxlY3RUeXBlPT1cInNpbmdsZVJlbGF0aW9uc2hpcFwiKXtcclxuICAgICAgICB2YXIgZGVsQnRuID0gICQoJzxidXR0b24gc3R5bGU9XCJ3aWR0aDo1MCVcIiBjbGFzcz1cInczLWJ1dHRvbiB3My1yZWQgdzMtaG92ZXItcGluayB3My1ib3JkZXJcIj5EZWxldGUgQWxsPC9idXR0b24+JylcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQoZGVsQnRuKVxyXG4gICAgICAgIGRlbEJ0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLmRlbGV0ZVNlbGVjdGVkKCl9KVxyXG4gICAgfWVsc2UgaWYoc2VsZWN0VHlwZT09XCJzaW5nbGVOb2RlXCIgfHwgc2VsZWN0VHlwZT09XCJtdWx0aXBsZVwiKXtcclxuICAgICAgICB2YXIgZGVsQnRuID0gJCgnPGJ1dHRvbiBzdHlsZT1cIndpZHRoOjUwJVwiIGNsYXNzPVwidzMtYnV0dG9uIHczLXJlZCB3My1ob3Zlci1waW5rIHczLWJvcmRlclwiPkRlbGV0ZSBBbGw8L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBjb25uZWN0VG9CdG4gPSQoJzxidXR0b24gc3R5bGU9XCJ3aWR0aDo0NSVcIiAgY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+Q29ubmVjdCB0bzwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIGNvbm5lY3RGcm9tQnRuID0gJCgnPGJ1dHRvbiBzdHlsZT1cIndpZHRoOjQ1JVwiIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiPkNvbm5lY3QgZnJvbTwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIHNob3dJbmJvdW5kQnRuID0gJCgnPGJ1dHRvbiAgc3R5bGU9XCJ3aWR0aDo0NSVcIiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj5RdWVyeSBJbmJvdW5kPC9idXR0b24+JylcclxuICAgICAgICB2YXIgc2hvd091dEJvdW5kQnRuID0gJCgnPGJ1dHRvbiBzdHlsZT1cIndpZHRoOjQ1JVwiIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiPlF1ZXJ5IE91dGJvdW5kPC9idXR0b24+JylcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQoZGVsQnRuLCBjb25uZWN0VG9CdG4sY29ubmVjdEZyb21CdG4gLCBzaG93SW5ib3VuZEJ0biwgc2hvd091dEJvdW5kQnRuKVxyXG4gICAgXHJcbiAgICAgICAgc2hvd091dEJvdW5kQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuc2hvd091dEJvdW5kKCl9KVxyXG4gICAgICAgIHNob3dJbmJvdW5kQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuc2hvd0luQm91bmQoKX0pICBcclxuICAgICAgICBjb25uZWN0VG9CdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiY29ubmVjdFRvXCJ9KSB9KVxyXG4gICAgICAgIGNvbm5lY3RGcm9tQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImNvbm5lY3RGcm9tXCJ9KSB9KVxyXG5cclxuICAgICAgICBkZWxCdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5kZWxldGVTZWxlY3RlZCgpfSlcclxuICAgIH1cclxuICAgIFxyXG4gICAgdmFyIG51bU9mTm9kZSA9IDA7XHJcbiAgICB2YXIgYXJyPXRoaXMuc2VsZWN0ZWRPYmplY3RzO1xyXG4gICAgYXJyLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgaWYgKGVsZW1lbnRbJyRkdElkJ10pIG51bU9mTm9kZSsrXHJcbiAgICB9KTtcclxuICAgIGlmKG51bU9mTm9kZT4wKXtcclxuICAgICAgICB2YXIgc2VsZWN0SW5ib3VuZEJ0biA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+K1NlbGVjdCBJbmJvdW5kPC9idXR0b24+JylcclxuICAgICAgICB2YXIgc2VsZWN0T3V0Qm91bmRCdG4gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiPitTZWxlY3QgT3V0Ym91bmQ8L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBjb3NlTGF5b3V0QnRuPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiPkNPU0UgVmlldzwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIGhpZGVCdG49ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+SGlkZTwvYnV0dG9uPicpXHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKHNlbGVjdEluYm91bmRCdG4sIHNlbGVjdE91dEJvdW5kQnRuLGNvc2VMYXlvdXRCdG4saGlkZUJ0bilcclxuXHJcbiAgICAgICAgc2VsZWN0SW5ib3VuZEJ0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLmJyb2FkY2FzdE1lc3NhZ2Uoe1wibWVzc2FnZVwiOiBcImFkZFNlbGVjdEluYm91bmRcIn0pfSlcclxuICAgICAgICBzZWxlY3RPdXRCb3VuZEJ0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLmJyb2FkY2FzdE1lc3NhZ2Uoe1wibWVzc2FnZVwiOiBcImFkZFNlbGVjdE91dGJvdW5kXCJ9KX0pXHJcbiAgICAgICAgY29zZUxheW91dEJ0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLmJyb2FkY2FzdE1lc3NhZ2Uoe1wibWVzc2FnZVwiOiBcIkNPU0VTZWxlY3RlZE5vZGVzXCJ9KX0pXHJcbiAgICAgICAgaGlkZUJ0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLmJyb2FkY2FzdE1lc3NhZ2Uoe1wibWVzc2FnZVwiOiBcImhpZGVTZWxlY3RlZE5vZGVzXCJ9KX0pXHJcbiAgICB9XHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZXhwb3J0U2VsZWN0ZWQ9YXN5bmMgZnVuY3Rpb24oKXtcclxuICAgIHZhciBhcnI9dGhpcy5zZWxlY3RlZE9iamVjdHM7XHJcbiAgICBpZihhcnIubGVuZ3RoPT0wKSByZXR1cm47XHJcbiAgICB2YXIgdHdpbklEQXJyPVtdXHJcbiAgICB2YXIgdHdpblRvQmVTdG9yZWQ9W11cclxuICAgIHZhciB0d2luSURzPXt9XHJcbiAgICBhcnIuZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICBpZiAoZWxlbWVudFsnJHNvdXJjZUlkJ10pIHJldHVyblxyXG4gICAgICAgIHR3aW5JREFyci5wdXNoKGVsZW1lbnRbJyRkdElkJ10pXHJcbiAgICAgICAgdmFyIGFuRXhwVHdpbj17fVxyXG4gICAgICAgIGFuRXhwVHdpbltcIiRtZXRhZGF0YVwiXT17XCIkbW9kZWxcIjplbGVtZW50W1wiJG1ldGFkYXRhXCJdW1wiJG1vZGVsXCJdfVxyXG4gICAgICAgIGZvcih2YXIgaW5kIGluIGVsZW1lbnQpe1xyXG4gICAgICAgICAgICBpZihpbmQ9PVwiJG1ldGFkYXRhXCIgfHwgaW5kPT1cIiRldGFnXCIpIGNvbnRpbnVlIFxyXG4gICAgICAgICAgICBlbHNlIGFuRXhwVHdpbltpbmRdPWVsZW1lbnRbaW5kXVxyXG4gICAgICAgIH1cclxuICAgICAgICB0d2luVG9CZVN0b3JlZC5wdXNoKGFuRXhwVHdpbilcclxuICAgICAgICB0d2luSURzW2VsZW1lbnRbJyRkdElkJ11dPTFcclxuICAgIH0pO1xyXG4gICAgdmFyIHJlbGF0aW9uc1RvQmVTdG9yZWQ9W11cclxuICAgIHR3aW5JREFyci5mb3JFYWNoKG9uZUlEPT57XHJcbiAgICAgICAgdmFyIHJlbGF0aW9ucz1nbG9iYWxDYWNoZS5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbb25lSURdXHJcbiAgICAgICAgaWYoIXJlbGF0aW9ucykgcmV0dXJuO1xyXG4gICAgICAgIHJlbGF0aW9ucy5mb3JFYWNoKG9uZVJlbGF0aW9uPT57XHJcbiAgICAgICAgICAgIHZhciB0YXJnZXRJRD1vbmVSZWxhdGlvbltcIiR0YXJnZXRJZFwiXVxyXG4gICAgICAgICAgICBpZih0d2luSURzW3RhcmdldElEXSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIG9iaj17fVxyXG4gICAgICAgICAgICAgICAgZm9yKHZhciBpbmQgaW4gb25lUmVsYXRpb24pe1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKGluZCA9PVwiJGV0YWdcInx8aW5kID09XCIkcmVsYXRpb25zaGlwSWRcInx8aW5kID09XCIkc291cmNlSWRcInx8aW5kID09XCJzb3VyY2VNb2RlbFwiKSBjb250aW51ZVxyXG4gICAgICAgICAgICAgICAgICAgIG9ialtpbmRdPW9uZVJlbGF0aW9uW2luZF1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHZhciBvbmVBY3Rpb249e1wiJHNyY0lkXCI6b25lSUQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCIkcmVsYXRpb25zaGlwSWRcIjpvbmVSZWxhdGlvbltcIiRyZWxhdGlvbnNoaXBJZFwiXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm9ialwiOm9ian1cclxuICAgICAgICAgICAgICAgIHJlbGF0aW9uc1RvQmVTdG9yZWQucHVzaChvbmVBY3Rpb24pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgfSlcclxuICAgIHZhciBmaW5hbEpTT049e1widHdpbnNcIjp0d2luVG9CZVN0b3JlZCxcInJlbGF0aW9uc1wiOnJlbGF0aW9uc1RvQmVTdG9yZWR9XHJcbiAgICB2YXIgcG9tID0gJChcIjxhPjwvYT5cIilcclxuICAgIHBvbS5hdHRyKCdocmVmJywgJ2RhdGE6dGV4dC9wbGFpbjtjaGFyc2V0PXV0Zi04LCcgKyBlbmNvZGVVUklDb21wb25lbnQoSlNPTi5zdHJpbmdpZnkoZmluYWxKU09OKSkpO1xyXG4gICAgcG9tLmF0dHIoJ2Rvd25sb2FkJywgXCJleHBvcnRUd2luc0RhdGEuanNvblwiKTtcclxuICAgIHBvbVswXS5jbGljaygpXHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUucmVhZE9uZUZpbGU9IGFzeW5jIGZ1bmN0aW9uKGFGaWxlKXtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcclxuICAgICAgICAgICAgcmVhZGVyLm9ubG9hZCA9ICgpPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZWFkZXIucmVzdWx0KVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICByZWFkZXIucmVhZEFzVGV4dChhRmlsZSk7XHJcbiAgICAgICAgfWNhdGNoKGUpe1xyXG4gICAgICAgICAgICByZWplY3QoZSlcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLnJlYWRUd2luc0ZpbGVzQ29udGVudEFuZEltcG9ydD1hc3luYyBmdW5jdGlvbihmaWxlcyl7XHJcbiAgICB2YXIgaW1wb3J0VHdpbnM9W11cclxuICAgIHZhciBpbXBvcnRSZWxhdGlvbnM9W11cclxuICAgIGZvciAodmFyIGkgPSAwLCBmOyBmID0gZmlsZXNbaV07IGkrKykge1xyXG4gICAgICAgIC8vIE9ubHkgcHJvY2VzcyBqc29uIGZpbGVzLlxyXG4gICAgICAgIGlmIChmLnR5cGUhPVwiYXBwbGljYXRpb24vanNvblwiKSBjb250aW51ZTtcclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgIHZhciBzdHI9IGF3YWl0IHRoaXMucmVhZE9uZUZpbGUoZilcclxuICAgICAgICAgICAgdmFyIG9iaj1KU09OLnBhcnNlKHN0cilcclxuICAgICAgICAgICAgaWYob2JqLnR3aW5zKSBpbXBvcnRUd2lucz1pbXBvcnRUd2lucy5jb25jYXQob2JqLnR3aW5zKVxyXG4gICAgICAgICAgICBpZihvYmoucmVsYXRpb25zKSBpbXBvcnRSZWxhdGlvbnM9aW1wb3J0UmVsYXRpb25zLmNvbmNhdChvYmoucmVsYXRpb25zKVxyXG4gICAgICAgIH1jYXRjaChlcnIpe1xyXG4gICAgICAgICAgICBhbGVydChlcnIpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZ1bmN0aW9uIHV1aWR2NCgpIHtcclxuICAgICAgICByZXR1cm4gJ3h4eHh4eHh4LXh4eHgtNHh4eC15eHh4LXh4eHh4eHh4eHh4eCcucmVwbGFjZSgvW3h5XS9nLCBmdW5jdGlvbiAoYykge1xyXG4gICAgICAgICAgICB2YXIgciA9IE1hdGgucmFuZG9tKCkgKiAxNiB8IDAsIHYgPSBjID09ICd4JyA/IHIgOiAociAmIDB4MyB8IDB4OCk7XHJcbiAgICAgICAgICAgIHJldHVybiB2LnRvU3RyaW5nKDE2KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIHZhciBvbGRUd2luSUQyTmV3SUQ9e31cclxuICAgIGltcG9ydFR3aW5zLmZvckVhY2gob25lVHdpbj0+e1xyXG4gICAgICAgIHZhciBvbGRJRD0gb25lVHdpbltcIiRkdElkXCJdXHJcbiAgICAgICAgdmFyIG5ld0lEPXV1aWR2NCgpO1xyXG4gICAgICAgIG9sZFR3aW5JRDJOZXdJRFtvbGRJRF09bmV3SURcclxuICAgICAgICBvbmVUd2luW1wiJGR0SWRcIl09bmV3SURcclxuICAgIH0pXHJcblxyXG4gICAgZm9yKHZhciBpPWltcG9ydFJlbGF0aW9ucy5sZW5ndGgtMTtpPj0wO2ktLSl7XHJcbiAgICAgICAgdmFyIG9uZVJlbD1pbXBvcnRSZWxhdGlvbnNbaV1cclxuICAgICAgICBpZihvbGRUd2luSUQyTmV3SURbb25lUmVsW1wiJHNyY0lkXCJdXT09bnVsbCB8fCBvbGRUd2luSUQyTmV3SURbb25lUmVsW1wib2JqXCJdW1wiJHRhcmdldElkXCJdXT09bnVsbCl7XHJcbiAgICAgICAgICAgIGltcG9ydFJlbGF0aW9ucy5zcGxpY2UoaSwxKVxyXG4gICAgICAgIH0gZWxzZXtcclxuICAgICAgICAgICAgb25lUmVsW1wiJHNyY0lkXCJdPW9sZFR3aW5JRDJOZXdJRFtvbmVSZWxbXCIkc3JjSWRcIl1dXHJcbiAgICAgICAgICAgIG9uZVJlbFtcIm9ialwiXVtcIiR0YXJnZXRJZFwiXT1vbGRUd2luSUQyTmV3SURbb25lUmVsW1wib2JqXCJdW1wiJHRhcmdldElkXCJdXVxyXG4gICAgICAgICAgICBvbmVSZWxbXCIkcmVsYXRpb25zaGlwSWRcIl09dXVpZHY0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcbiAgICB0cnl7XHJcbiAgICAgICAgdmFyIHJlID0gYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vYmF0Y2hJbXBvcnRUd2luc1wiLCBcIlBPU1RcIiwge1widHdpbnNcIjpKU09OLnN0cmluZ2lmeShpbXBvcnRUd2lucyl9KVxyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICByZS5EQlR3aW5zPUpTT04ucGFyc2UocmUuREJUd2lucylcclxuICAgIHJlLkFEVFR3aW5zPUpTT04ucGFyc2UocmUuQURUVHdpbnMpXHJcbiAgICByZS5EQlR3aW5zLmZvckVhY2goREJUd2luPT57IGdsb2JhbENhY2hlLnN0b3JlU2luZ2xlREJUd2luKERCVHdpbikgfSlcclxuICAgIHZhciBhZHRUd2lucz1bXVxyXG4gICAgcmUuQURUVHdpbnMuZm9yRWFjaChBRFRUd2luPT57XHJcbiAgICAgICAgZ2xvYmFsQ2FjaGUuc3RvcmVTaW5nbGVBRFRUd2luKEFEVFR3aW4pXHJcbiAgICAgICAgYWR0VHdpbnMucHVzaChBRFRUd2luKVxyXG4gICAgfSlcclxuXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJhZGROZXdUd2luc1wiLCBcInR3aW5zSW5mb1wiOiBhZHRUd2lucyB9KVxyXG5cclxuICAgIC8vY29udGludWUgdG8gaW1wb3J0IHJlbGF0aW9uc1xyXG4gICAgdHJ5e1xyXG4gICAgICAgIHZhciByZWxhdGlvbnNJbXBvcnRlZCA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2NyZWF0ZVJlbGF0aW9uc1wiLCBcIlBPU1RcIiwgIHthY3Rpb25zOkpTT04uc3RyaW5naWZ5KGltcG9ydFJlbGF0aW9ucyl9KVxyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgfVxyXG4gICAgZ2xvYmFsQ2FjaGUuc3RvcmVUd2luUmVsYXRpb25zaGlwc19hcHBlbmQocmVsYXRpb25zSW1wb3J0ZWQpXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJkcmF3QWxsUmVsYXRpb25zXCIsaW5mbzpyZWxhdGlvbnNJbXBvcnRlZH0pXHJcblxyXG4gICAgdmFyIG51bU9mVHdpbnM9YWR0VHdpbnMubGVuZ3RoXHJcbiAgICB2YXIgbnVtT2ZSZWxhdGlvbnM9cmVsYXRpb25zSW1wb3J0ZWQubGVuZ3RoXHJcbiAgICB2YXIgc3RyPVwiQWRkIFwiK251bU9mVHdpbnMrIFwiIG5vZGVcIisoKG51bU9mVHdpbnM8PTEpP1wiXCI6XCJzXCIpK2AgKGZyb20gJHtpbXBvcnRUd2lucy5sZW5ndGh9KWBcclxuICAgIHN0cis9XCIgYW5kIFwiK251bU9mUmVsYXRpb25zK1wiIHJlbGF0aW9uc2hpcFwiKygobnVtT2ZSZWxhdGlvbnM8PTEpP1wiXCI6XCJzXCIpK2AgKGZyb20gJHtpbXBvcnRSZWxhdGlvbnMubGVuZ3RofSlgXHJcbiAgICB2YXIgY29uZmlybURpYWxvZ0RpdiA9IG5ldyBzaW1wbGVDb25maXJtRGlhbG9nKClcclxuICAgIGNvbmZpcm1EaWFsb2dEaXYuc2hvdyhcclxuICAgICAgICB7IHdpZHRoOiBcIjQwMHB4XCIgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIkltcG9ydCBSZXN1bHRcIlxyXG4gICAgICAgICAgICAsIGNvbnRlbnQ6c3RyXHJcbiAgICAgICAgICAgICwgYnV0dG9uczogW1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtZ3JheVwiLCB0ZXh0OiBcIk9rXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfVxyXG4gICAgKVxyXG4gICAgXHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUucmVmcmVzaEluZm9tYXRpb249YXN5bmMgZnVuY3Rpb24oKXtcclxuICAgIHZhciB0d2luSURzPVtdXHJcbiAgICB0aGlzLnNlbGVjdGVkT2JqZWN0cy5mb3JFYWNoKG9uZUl0ZW09PnsgIGlmKG9uZUl0ZW1bJyRkdElkJ10pIHR3aW5JRHMucHVzaChvbmVJdGVtWyckZHRJZCddKSAgfSlcclxuICAgIHRyeXtcclxuICAgICAgICB2YXIgdHdpbnNkYXRhID0gYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vbGlzdFR3aW5zRm9ySURzXCIsIFwiUE9TVFwiLCB0d2luSURzKVxyXG4gICAgICAgIHR3aW5zZGF0YS5mb3JFYWNoKG9uZVJlPT57XHJcbiAgICAgICAgICAgIHZhciB0d2luSUQ9IG9uZVJlWyckZHRJZCddXHJcbiAgICAgICAgICAgIGlmKGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3R3aW5JRF0hPW51bGwpe1xyXG4gICAgICAgICAgICAgICAgZm9yKHZhciBpbmQgaW4gb25lUmUpICBnbG9iYWxDYWNoZS5zdG9yZVNpbmdsZUFEVFR3aW4ob25lUmVbaW5kXSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICB9XHJcblxyXG4gICAgd2hpbGUodHdpbklEcy5sZW5ndGg+MCl7XHJcbiAgICAgICAgdmFyIHNtYWxsQXJyPSB0d2luSURzLnNwbGljZSgwLCAxMDApO1xyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICAgdmFyIGRhdGEgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9nZXRSZWxhdGlvbnNoaXBzRnJvbVR3aW5JRHNcIiwgXCJQT1NUXCIsIHNtYWxsQXJyKVxyXG4gICAgICAgICAgICBpZiAoZGF0YSA9PSBcIlwiKSBjb250aW51ZTtcclxuICAgICAgICAgICAgZ2xvYmFsQ2FjaGUuc3RvcmVUd2luUmVsYXRpb25zaGlwcyhkYXRhKSAvL3N0b3JlIHRoZW0gaW4gZ2xvYmFsIGF2YWlsYWJsZSBhcnJheVxyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJkcmF3QWxsUmVsYXRpb25zXCIsIGluZm86IGRhdGEgfSlcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICAvL3JlZHJhdyBpbmZvcGFuZWwgaWYgbmVlZGVkXHJcbiAgICBpZih0aGlzLnNlbGVjdGVkT2JqZWN0cy5sZW5ndGg9PTEpIHRoaXMucnhNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwic2hvd0luZm9TZWxlY3RlZE5vZGVzXCIsIGluZm86IHRoaXMuc2VsZWN0ZWRPYmplY3RzIH0pXHJcblxyXG59XHJcblxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5kZWxldGVTZWxlY3RlZD1hc3luYyBmdW5jdGlvbigpe1xyXG4gICAgdmFyIGFycj10aGlzLnNlbGVjdGVkT2JqZWN0cztcclxuICAgIGlmKGFyci5sZW5ndGg9PTApIHJldHVybjtcclxuICAgIHZhciByZWxhdGlvbnNBcnI9W11cclxuICAgIHZhciB0d2luSURBcnI9W11cclxuICAgIHZhciB0d2luSURzPXt9XHJcbiAgICBhcnIuZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICBpZiAoZWxlbWVudFsnJHNvdXJjZUlkJ10pIHJlbGF0aW9uc0Fyci5wdXNoKGVsZW1lbnQpO1xyXG4gICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgIHR3aW5JREFyci5wdXNoKGVsZW1lbnRbJyRkdElkJ10pXHJcbiAgICAgICAgICAgIHR3aW5JRHNbZWxlbWVudFsnJGR0SWQnXV09MVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgZm9yKHZhciBpPXJlbGF0aW9uc0Fyci5sZW5ndGgtMTtpPj0wO2ktLSl7IC8vY2xlYXIgdGhvc2UgcmVsYXRpb25zaGlwcyB0aGF0IGFyZSBnb2luZyB0byBiZSBkZWxldGVkIGFmdGVyIHR3aW5zIGRlbGV0aW5nXHJcbiAgICAgICAgdmFyIHNyY0lkPSAgcmVsYXRpb25zQXJyW2ldWyckc291cmNlSWQnXVxyXG4gICAgICAgIHZhciB0YXJnZXRJZCA9IHJlbGF0aW9uc0FycltpXVsnJHRhcmdldElkJ11cclxuICAgICAgICBpZih0d2luSURzW3NyY0lkXSE9bnVsbCB8fCB0d2luSURzW3RhcmdldElkXSE9bnVsbCl7XHJcbiAgICAgICAgICAgIHJlbGF0aW9uc0Fyci5zcGxpY2UoaSwxKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHZhciBjb25maXJtRGlhbG9nRGl2ID0gbmV3IHNpbXBsZUNvbmZpcm1EaWFsb2coKVxyXG4gICAgdmFyIGRpYWxvZ1N0cj1cIlwiXHJcbiAgICB2YXIgdHdpbk51bWJlcj10d2luSURBcnIubGVuZ3RoO1xyXG4gICAgdmFyIHJlbGF0aW9uc051bWJlciA9IHJlbGF0aW9uc0Fyci5sZW5ndGg7XHJcbiAgICBpZih0d2luTnVtYmVyPjApIGRpYWxvZ1N0ciA9ICB0d2luTnVtYmVyK1wiIHR3aW5cIisoKHR3aW5OdW1iZXI+MSk/XCJzXCI6XCJcIikgKyBcIiAod2l0aCBjb25uZWN0ZWQgcmVsYXRpb25zKVwiXHJcbiAgICBpZih0d2luTnVtYmVyPjAgJiYgcmVsYXRpb25zTnVtYmVyPjApIGRpYWxvZ1N0cis9XCIgYW5kIGFkZGl0aW9uYWwgXCJcclxuICAgIGlmKHJlbGF0aW9uc051bWJlcj4wKSBkaWFsb2dTdHIgKz0gIHJlbGF0aW9uc051bWJlcitcIiByZWxhdGlvblwiKygocmVsYXRpb25zTnVtYmVyPjEpP1wic1wiOlwiXCIgKVxyXG4gICAgZGlhbG9nU3RyKz1cIiB3aWxsIGJlIGRlbGV0ZWQuIFBsZWFzZSBjb25maXJtXCJcclxuICAgIGNvbmZpcm1EaWFsb2dEaXYuc2hvdyhcclxuICAgICAgICB7IHdpZHRoOiBcIjM1MHB4XCIgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIkNvbmZpcm1cIlxyXG4gICAgICAgICAgICAsIGNvbnRlbnQ6ZGlhbG9nU3RyXHJcbiAgICAgICAgICAgICwgYnV0dG9uczogW1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtcmVkIHczLWhvdmVyLXBpbmtcIiwgdGV4dDogXCJDb25maXJtXCIsIFwiY2xpY2tGdW5jXCI6IGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuRE9NLmVtcHR5KClcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmF3QnV0dG9ucyhudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVsYXRpb25zQXJyLmxlbmd0aCA+IDApIGF3YWl0IHRoaXMuZGVsZXRlUmVsYXRpb25zKHJlbGF0aW9uc0FycilcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR3aW5JREFyci5sZW5ndGggPiAwKSBhd2FpdCB0aGlzLmRlbGV0ZVR3aW5zKHR3aW5JREFycilcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtZ3JheVwiLCB0ZXh0OiBcIkNhbmNlbFwiLCBcImNsaWNrRnVuY1wiOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH1cclxuICAgIClcclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5kZWxldGVUd2lucz1hc3luYyBmdW5jdGlvbih0d2luSURBcnIpeyAgIFxyXG4gICAgd2hpbGUodHdpbklEQXJyLmxlbmd0aD4wKXtcclxuICAgICAgICB2YXIgc21hbGxBcnI9IHR3aW5JREFyci5zcGxpY2UoMCwgMTAwKTtcclxuICAgICAgICBcclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9kZWxldGVUd2luc1wiLCBcIlBPU1RcIiwge2FycjpzbWFsbEFycn0pXHJcbiAgICAgICAgICAgIHJlc3VsdC5mb3JFYWNoKChvbmVJRCk9PntcclxuICAgICAgICAgICAgICAgIGRlbGV0ZSBnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1tvbmVJRF1cclxuICAgICAgICAgICAgICAgIGRlbGV0ZSBnbG9iYWxDYWNoZS5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbb25lSURdXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJ0d2luc0RlbGV0ZWRcIix0d2luSURBcnI6cmVzdWx0fSlcclxuICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZGVsZXRlUmVsYXRpb25zPWFzeW5jIGZ1bmN0aW9uKHJlbGF0aW9uc0Fycil7XHJcbiAgICB2YXIgYXJyPVtdXHJcbiAgICByZWxhdGlvbnNBcnIuZm9yRWFjaChvbmVSZWxhdGlvbj0+e1xyXG4gICAgICAgIGFyci5wdXNoKHtzcmNJRDpvbmVSZWxhdGlvblsnJHNvdXJjZUlkJ10scmVsSUQ6b25lUmVsYXRpb25bJyRyZWxhdGlvbnNoaXBJZCddfSlcclxuICAgIH0pXHJcbiAgICB0cnl7XHJcbiAgICAgICAgdmFyIGRhdGEgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9kZWxldGVSZWxhdGlvbnNcIiwgXCJQT1NUXCIsIHtcInJlbGF0aW9uc1wiOmFycn0pXHJcbiAgICAgICAgZ2xvYmFsQ2FjaGUuc3RvcmVUd2luUmVsYXRpb25zaGlwc19yZW1vdmUoZGF0YSlcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJyZWxhdGlvbnNEZWxldGVkXCIsXCJyZWxhdGlvbnNcIjpkYXRhfSlcclxuICAgIH1jYXRjaChlKXtcclxuICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgIH1cclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5zaG93T3V0Qm91bmQ9YXN5bmMgZnVuY3Rpb24oKXtcclxuICAgIHZhciBhcnI9dGhpcy5zZWxlY3RlZE9iamVjdHM7XHJcbiAgICB2YXIgdHdpbklEQXJyPVtdXHJcbiAgICBhcnIuZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICBpZiAoZWxlbWVudFsnJHNvdXJjZUlkJ10pIHJldHVybjtcclxuICAgICAgICB0d2luSURBcnIucHVzaChlbGVtZW50WyckZHRJZCddKVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHdoaWxlKHR3aW5JREFyci5sZW5ndGg+MCl7XHJcbiAgICAgICAgdmFyIHNtYWxsQXJyID0gdHdpbklEQXJyLnNwbGljZSgwLCAxMDApO1xyXG5cclxuICAgICAgICB2YXIga25vd25UYXJnZXRUd2lucyA9IHt9XHJcbiAgICAgICAgc21hbGxBcnIuZm9yRWFjaChvbmVJRCA9PiB7XHJcbiAgICAgICAgICAgIGtub3duVGFyZ2V0VHdpbnNbb25lSURdID0gMSAvL2l0c2VsZiBhbHNvIGlzIGtub3duXHJcbiAgICAgICAgICAgIHZhciBvdXRCb3VuZFJlbGF0aW9uID0gZ2xvYmFsQ2FjaGUuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW29uZUlEXVxyXG4gICAgICAgICAgICBpZiAob3V0Qm91bmRSZWxhdGlvbikge1xyXG4gICAgICAgICAgICAgICAgb3V0Qm91bmRSZWxhdGlvbi5mb3JFYWNoKG9uZVJlbGF0aW9uID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0SUQgPSBvbmVSZWxhdGlvbltcIiR0YXJnZXRJZFwiXVxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1t0YXJnZXRJRF0gIT0gbnVsbCkga25vd25UYXJnZXRUd2luc1t0YXJnZXRJRF0gPSAxXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICB2YXIgZGF0YSA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL3F1ZXJ5T3V0Qm91bmRcIiwgXCJQT1NUXCIsICB7IGFycjogc21hbGxBcnIsIFwia25vd25UYXJnZXRzXCI6IGtub3duVGFyZ2V0VHdpbnMgfSlcclxuICAgICAgICAgICAgLy9uZXcgdHdpbidzIHJlbGF0aW9uc2hpcCBzaG91bGQgYmUgc3RvcmVkIGFzIHdlbGxcclxuICAgICAgICAgICAgZ2xvYmFsQ2FjaGUuc3RvcmVUd2luUmVsYXRpb25zaGlwcyhkYXRhLm5ld1R3aW5SZWxhdGlvbnMpXHJcbiAgICAgICAgICAgIGRhdGEuY2hpbGRUd2luc0FuZFJlbGF0aW9ucy5mb3JFYWNoKG9uZVNldD0+e1xyXG4gICAgICAgICAgICAgICAgZm9yKHZhciBpbmQgaW4gb25lU2V0LmNoaWxkVHdpbnMpe1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBvbmVUd2luPW9uZVNldC5jaGlsZFR3aW5zW2luZF1cclxuICAgICAgICAgICAgICAgICAgICBnbG9iYWxDYWNoZS5zdG9yZVNpbmdsZUFEVFR3aW4ob25lVHdpbilcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiZHJhd1R3aW5zQW5kUmVsYXRpb25zXCIsaW5mbzpkYXRhfSlcclxuICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuc2hvd0luQm91bmQ9YXN5bmMgZnVuY3Rpb24oKXtcclxuICAgIHZhciBhcnI9dGhpcy5zZWxlY3RlZE9iamVjdHM7XHJcbiAgICB2YXIgdHdpbklEQXJyPVtdXHJcbiAgICBhcnIuZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICBpZiAoZWxlbWVudFsnJHNvdXJjZUlkJ10pIHJldHVybjtcclxuICAgICAgICB0d2luSURBcnIucHVzaChlbGVtZW50WyckZHRJZCddKVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHdoaWxlKHR3aW5JREFyci5sZW5ndGg+MCl7XHJcbiAgICAgICAgdmFyIHNtYWxsQXJyPSB0d2luSURBcnIuc3BsaWNlKDAsIDEwMCk7XHJcbiAgICAgICAgdmFyIGtub3duU291cmNlVHdpbnMgPSB7fVxyXG4gICAgICAgIHZhciBJRERpY3QgPSB7fVxyXG4gICAgICAgIHNtYWxsQXJyLmZvckVhY2gob25lSUQgPT4ge1xyXG4gICAgICAgICAgICBJRERpY3Rbb25lSURdID0gMVxyXG4gICAgICAgICAgICBrbm93blNvdXJjZVR3aW5zW29uZUlEXSA9IDEgLy9pdHNlbGYgYWxzbyBpcyBrbm93blxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgZm9yICh2YXIgdHdpbklEIGluIGdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwcykge1xyXG4gICAgICAgICAgICB2YXIgcmVsYXRpb25zID0gZ2xvYmFsQ2FjaGUuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW3R3aW5JRF1cclxuICAgICAgICAgICAgcmVsYXRpb25zLmZvckVhY2gob25lUmVsYXRpb24gPT4ge1xyXG4gICAgICAgICAgICAgICAgdmFyIHRhcmdldElEID0gb25lUmVsYXRpb25bJyR0YXJnZXRJZCddXHJcbiAgICAgICAgICAgICAgICB2YXIgc3JjSUQgPSBvbmVSZWxhdGlvblsnJHNvdXJjZUlkJ11cclxuICAgICAgICAgICAgICAgIGlmIChJRERpY3RbdGFyZ2V0SURdICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbc3JjSURdICE9IG51bGwpIGtub3duU291cmNlVHdpbnNbc3JjSURdID0gMVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICB2YXIgZGF0YSA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL3F1ZXJ5SW5Cb3VuZFwiLCBcIlBPU1RcIiwgIHsgYXJyOiBzbWFsbEFyciwgXCJrbm93blNvdXJjZXNcIjoga25vd25Tb3VyY2VUd2lucyB9KVxyXG4gICAgICAgICAgICAvL25ldyB0d2luJ3MgcmVsYXRpb25zaGlwIHNob3VsZCBiZSBzdG9yZWQgYXMgd2VsbFxyXG4gICAgICAgICAgICBnbG9iYWxDYWNoZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzKGRhdGEubmV3VHdpblJlbGF0aW9ucylcclxuICAgICAgICAgICAgZGF0YS5jaGlsZFR3aW5zQW5kUmVsYXRpb25zLmZvckVhY2gob25lU2V0PT57XHJcbiAgICAgICAgICAgICAgICBmb3IodmFyIGluZCBpbiBvbmVTZXQuY2hpbGRUd2lucyl7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9uZVR3aW49b25lU2V0LmNoaWxkVHdpbnNbaW5kXVxyXG4gICAgICAgICAgICAgICAgICAgIGdsb2JhbENhY2hlLnN0b3JlU2luZ2xlQURUVHdpbihvbmVUd2luKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJkcmF3VHdpbnNBbmRSZWxhdGlvbnNcIixpbmZvOmRhdGF9KVxyXG4gICAgICAgIH1jYXRjaChlKXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5kcmF3TXVsdGlwbGVPYmo9ZnVuY3Rpb24oKXtcclxuICAgIHZhciBudW1PZkVkZ2UgPSAwO1xyXG4gICAgdmFyIG51bU9mTm9kZSA9IDA7XHJcbiAgICB2YXIgYXJyPXRoaXMuc2VsZWN0ZWRPYmplY3RzO1xyXG4gICAgaWYoYXJyPT1udWxsKSByZXR1cm47XHJcbiAgICBhcnIuZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICBpZiAoZWxlbWVudFsnJHNvdXJjZUlkJ10pIG51bU9mRWRnZSsrXHJcbiAgICAgICAgZWxzZSBudW1PZk5vZGUrK1xyXG4gICAgfSk7XHJcbiAgICB2YXIgdGV4dERpdj0kKFwiPGxhYmVsIHN0eWxlPSdkaXNwbGF5OmJsb2NrO21hcmdpbi10b3A6MTBweCc+PC9sYWJlbD5cIilcclxuICAgIHRleHREaXYudGV4dChudW1PZk5vZGUrIFwiIG5vZGVcIisoKG51bU9mTm9kZTw9MSk/XCJcIjpcInNcIikrXCIsIFwiK251bU9mRWRnZStcIiByZWxhdGlvbnNoaXBcIisoKG51bU9mRWRnZTw9MSk/XCJcIjpcInNcIikpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQodGV4dERpdilcclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5kcmF3U3RhdGljSW5mbz1mdW5jdGlvbihwYXJlbnQsanNvbkluZm8scGFkZGluZ1RvcCxmb250U2l6ZSl7XHJcbiAgICBmb3IodmFyIGluZCBpbiBqc29uSW5mbyl7XHJcbiAgICAgICAgdmFyIGtleURpdj0gJChcIjxsYWJlbCBzdHlsZT0nZGlzcGxheTpibG9jayc+PGRpdiBjbGFzcz0ndzMtYm9yZGVyJyBzdHlsZT0nYmFja2dyb3VuZC1jb2xvcjojZjZmNmY2O2Rpc3BsYXk6aW5saW5lO3BhZGRpbmc6LjFlbSAuM2VtIC4xZW0gLjNlbTttYXJnaW4tcmlnaHQ6LjNlbSc+XCIraW5kK1wiPC9kaXY+PC9sYWJlbD5cIilcclxuICAgICAgICBrZXlEaXYuY3NzKHtcImZvbnRTaXplXCI6Zm9udFNpemUsXCJjb2xvclwiOlwiZGFya0dyYXlcIn0pXHJcbiAgICAgICAgcGFyZW50LmFwcGVuZChrZXlEaXYpXHJcbiAgICAgICAga2V5RGl2LmNzcyhcInBhZGRpbmctdG9wXCIscGFkZGluZ1RvcClcclxuXHJcbiAgICAgICAgdmFyIGNvbnRlbnRET009JChcIjxsYWJlbD48L2xhYmVsPlwiKVxyXG4gICAgICAgIGlmKHR5cGVvZihqc29uSW5mb1tpbmRdKT09PVwib2JqZWN0XCIpIHtcclxuICAgICAgICAgICAgY29udGVudERPTS5jc3MoXCJkaXNwbGF5XCIsXCJibG9ja1wiKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLmNzcyhcInBhZGRpbmctbGVmdFwiLFwiMWVtXCIpXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd1N0YXRpY0luZm8oY29udGVudERPTSxqc29uSW5mb1tpbmRdLFwiLjVlbVwiLGZvbnRTaXplKVxyXG4gICAgICAgIH1lbHNlIHtcclxuICAgICAgICAgICAgY29udGVudERPTS5jc3MoXCJwYWRkaW5nLXRvcFwiLFwiLjJlbVwiKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLnRleHQoanNvbkluZm9baW5kXSlcclxuICAgICAgICB9XHJcbiAgICAgICAgY29udGVudERPTS5jc3Moe1wiZm9udFNpemVcIjpmb250U2l6ZSxcImNvbG9yXCI6XCJibGFja1wifSlcclxuICAgICAgICBrZXlEaXYuYXBwZW5kKGNvbnRlbnRET00pXHJcbiAgICB9XHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZHJhd0VkaXRhYmxlPWZ1bmN0aW9uKHBhcmVudCxqc29uSW5mbyxvcmlnaW5FbGVtZW50SW5mbyxwYXRoQXJyLGlzTmV3VHdpbil7XHJcbiAgICBpZihqc29uSW5mbz09bnVsbCkgcmV0dXJuO1xyXG4gICAgZm9yKHZhciBpbmQgaW4ganNvbkluZm8pe1xyXG4gICAgICAgIHZhciBrZXlEaXY9ICQoXCI8bGFiZWwgc3R5bGU9J2Rpc3BsYXk6YmxvY2snPjxkaXYgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO3BhZGRpbmc6LjFlbSAuM2VtIC4xZW0gLjNlbTsgZm9udC13ZWlnaHQ6Ym9sZDtjb2xvcjpibGFjayc+XCIraW5kK1wiPC9kaXY+PC9sYWJlbD5cIilcclxuICAgICAgICBpZihpc05ld1R3aW4pe1xyXG4gICAgICAgICAgICBpZihpbmQ9PVwiJGR0SWRcIikge1xyXG4gICAgICAgICAgICAgICAgcGFyZW50LnByZXBlbmQoa2V5RGl2KVxyXG4gICAgICAgICAgICAgICAga2V5RGl2LmF0dHIoJ2lkJywnTkVXVFdJTl9JRExhYmVsJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBwYXJlbnQuYXBwZW5kKGtleURpdilcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgcGFyZW50LmFwcGVuZChrZXlEaXYpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGtleURpdi5jc3MoXCJwYWRkaW5nLXRvcFwiLFwiLjNlbVwiKSBcclxuXHJcbiAgICAgICAgdmFyIGNvbnRlbnRET009JChcIjxsYWJlbCBzdHlsZT0ncGFkZGluZy10b3A6LjJlbSc+PC9sYWJlbD5cIilcclxuICAgICAgICB2YXIgbmV3UGF0aD1wYXRoQXJyLmNvbmNhdChbaW5kXSlcclxuICAgICAgICBpZihBcnJheS5pc0FycmF5KGpzb25JbmZvW2luZF0pKXtcclxuICAgICAgICAgICAgdGhpcy5kcmF3RHJvcGRvd25PcHRpb24oY29udGVudERPTSxuZXdQYXRoLGpzb25JbmZvW2luZF0saXNOZXdUd2luLG9yaWdpbkVsZW1lbnRJbmZvKVxyXG4gICAgICAgIH1lbHNlIGlmKHR5cGVvZihqc29uSW5mb1tpbmRdKT09PVwib2JqZWN0XCIpIHtcclxuICAgICAgICAgICAgY29udGVudERPTS5jc3MoXCJkaXNwbGF5XCIsXCJibG9ja1wiKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLmNzcyhcInBhZGRpbmctbGVmdFwiLFwiMWVtXCIpXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd0VkaXRhYmxlKGNvbnRlbnRET00sanNvbkluZm9baW5kXSxvcmlnaW5FbGVtZW50SW5mbyxuZXdQYXRoLGlzTmV3VHdpbilcclxuICAgICAgICB9ZWxzZSB7XHJcbiAgICAgICAgICAgIHZhciBhSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJwYWRkaW5nOjJweDt3aWR0aDo1MCU7b3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lXCIgcGxhY2Vob2xkZXI9XCJ0eXBlOiAnK2pzb25JbmZvW2luZF0rJ1wiLz4nKS5hZGRDbGFzcyhcInczLWlucHV0IHczLWJvcmRlclwiKTsgIFxyXG4gICAgICAgICAgICBjb250ZW50RE9NLmFwcGVuZChhSW5wdXQpXHJcbiAgICAgICAgICAgIHZhciB2YWw9dGhpcy5zZWFyY2hWYWx1ZShvcmlnaW5FbGVtZW50SW5mbyxuZXdQYXRoKVxyXG4gICAgICAgICAgICBpZih2YWwhPW51bGwpIGFJbnB1dC52YWwodmFsKVxyXG4gICAgICAgICAgICBhSW5wdXQuZGF0YShcInBhdGhcIiwgbmV3UGF0aClcclxuICAgICAgICAgICAgYUlucHV0LmRhdGEoXCJkYXRhVHlwZVwiLCBqc29uSW5mb1tpbmRdKVxyXG4gICAgICAgICAgICBhSW5wdXQuY2hhbmdlKChlKT0+e1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lZGl0RFRQcm9wZXJ0eShvcmlnaW5FbGVtZW50SW5mbywkKGUudGFyZ2V0KS5kYXRhKFwicGF0aFwiKSwkKGUudGFyZ2V0KS52YWwoKSwkKGUudGFyZ2V0KS5kYXRhKFwiZGF0YVR5cGVcIiksaXNOZXdUd2luKVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgICAgICBrZXlEaXYuYXBwZW5kKGNvbnRlbnRET00pXHJcbiAgICB9XHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZHJhd0Ryb3Bkb3duT3B0aW9uPWZ1bmN0aW9uKGNvbnRlbnRET00sbmV3UGF0aCx2YWx1ZUFycixpc05ld1R3aW4sb3JpZ2luRWxlbWVudEluZm8pe1xyXG4gICAgdmFyIGFTZWxlY3RNZW51PW5ldyBzaW1wbGVTZWxlY3RNZW51KFwiXCIse2J1dHRvbkNTUzp7XCJwYWRkaW5nXCI6XCI0cHggMTZweFwifX0pXHJcbiAgICBjb250ZW50RE9NLmFwcGVuZChhU2VsZWN0TWVudS5ET00pXHJcbiAgICBhU2VsZWN0TWVudS5ET00uZGF0YShcInBhdGhcIiwgbmV3UGF0aClcclxuICAgIHZhbHVlQXJyLmZvckVhY2goKG9uZU9wdGlvbik9PntcclxuICAgICAgICB2YXIgc3RyID1vbmVPcHRpb25bXCJkaXNwbGF5TmFtZVwiXSAgfHwgb25lT3B0aW9uW1wiZW51bVZhbHVlXCJdIFxyXG4gICAgICAgIGFTZWxlY3RNZW51LmFkZE9wdGlvbihzdHIpXHJcbiAgICB9KVxyXG4gICAgYVNlbGVjdE1lbnUuY2FsbEJhY2tfY2xpY2tPcHRpb249KG9wdGlvblRleHQsb3B0aW9uVmFsdWUscmVhbE1vdXNlQ2xpY2spPT57XHJcbiAgICAgICAgYVNlbGVjdE1lbnUuY2hhbmdlTmFtZShvcHRpb25UZXh0KVxyXG4gICAgICAgIGlmKHJlYWxNb3VzZUNsaWNrKSB0aGlzLmVkaXREVFByb3BlcnR5KG9yaWdpbkVsZW1lbnRJbmZvLGFTZWxlY3RNZW51LkRPTS5kYXRhKFwicGF0aFwiKSxvcHRpb25WYWx1ZSxcInN0cmluZ1wiLGlzTmV3VHdpbilcclxuICAgIH1cclxuICAgIHZhciB2YWw9dGhpcy5zZWFyY2hWYWx1ZShvcmlnaW5FbGVtZW50SW5mbyxuZXdQYXRoKVxyXG4gICAgaWYodmFsIT1udWxsKXtcclxuICAgICAgICBhU2VsZWN0TWVudS50cmlnZ2VyT3B0aW9uVmFsdWUodmFsKVxyXG4gICAgfSAgICBcclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5lZGl0RFRQcm9wZXJ0eT1hc3luYyBmdW5jdGlvbihvcmlnaW5FbGVtZW50SW5mbyxwYXRoLG5ld1ZhbCxkYXRhVHlwZSxpc05ld1R3aW4pe1xyXG4gICAgaWYoW1wiZG91YmxlXCIsXCJib29sZWFuXCIsXCJmbG9hdFwiLFwiaW50ZWdlclwiLFwibG9uZ1wiXS5pbmNsdWRlcyhkYXRhVHlwZSkpIG5ld1ZhbD1OdW1iZXIobmV3VmFsKVxyXG5cclxuICAgIC8veyBcIm9wXCI6IFwiYWRkXCIsIFwicGF0aFwiOiBcIi94XCIsIFwidmFsdWVcIjogMzAgfVxyXG4gICAgaWYoaXNOZXdUd2luKXtcclxuICAgICAgICB0aGlzLnVwZGF0ZU9yaWdpbk9iamVjdFZhbHVlKG9yaWdpbkVsZW1lbnRJbmZvLHBhdGgsbmV3VmFsKVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGlmKHBhdGgubGVuZ3RoPT0xKXtcclxuICAgICAgICB2YXIgc3RyPVwiXCJcclxuICAgICAgICBwYXRoLmZvckVhY2goc2VnbWVudD0+e3N0cis9XCIvXCIrc2VnbWVudH0pXHJcbiAgICAgICAgdmFyIGpzb25QYXRjaD1bIHsgXCJvcFwiOiBcImFkZFwiLCBcInBhdGhcIjogc3RyLCBcInZhbHVlXCI6IG5ld1ZhbH0gXVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgLy9pdCBpcyBhIHByb3BlcnR5IGluc2lkZSBhIG9iamVjdCB0eXBlIG9mIHJvb3QgcHJvcGVydHksdXBkYXRlIHRoZSB3aG9sZSByb290IHByb3BlcnR5XHJcbiAgICAgICAgdmFyIHJvb3RQcm9wZXJ0eT1wYXRoWzBdXHJcbiAgICAgICAgdmFyIHBhdGNoVmFsdWU9IG9yaWdpbkVsZW1lbnRJbmZvW3Jvb3RQcm9wZXJ0eV1cclxuICAgICAgICBpZihwYXRjaFZhbHVlPT1udWxsKSBwYXRjaFZhbHVlPXt9XHJcbiAgICAgICAgZWxzZSBwYXRjaFZhbHVlPUpTT04ucGFyc2UoSlNPTi5zdHJpbmdpZnkocGF0Y2hWYWx1ZSkpIC8vbWFrZSBhIGNvcHlcclxuICAgICAgICB0aGlzLnVwZGF0ZU9yaWdpbk9iamVjdFZhbHVlKHBhdGNoVmFsdWUscGF0aC5zbGljZSgxKSxuZXdWYWwpXHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGpzb25QYXRjaD1bIHsgXCJvcFwiOiBcImFkZFwiLCBcInBhdGhcIjogXCIvXCIrcm9vdFByb3BlcnR5LCBcInZhbHVlXCI6IHBhdGNoVmFsdWV9IF1cclxuICAgIH1cclxuXHJcbiAgICBpZihvcmlnaW5FbGVtZW50SW5mb1tcIiRkdElkXCJdKXsgLy9lZGl0IGEgbm9kZSBwcm9wZXJ0eVxyXG4gICAgICAgIHZhciB0d2luSUQgPSBvcmlnaW5FbGVtZW50SW5mb1tcIiRkdElkXCJdXHJcbiAgICAgICAgdmFyIHBheUxvYWQ9e1wianNvblBhdGNoXCI6SlNPTi5zdHJpbmdpZnkoanNvblBhdGNoKSxcInR3aW5JRFwiOnR3aW5JRH1cclxuICAgIH1lbHNlIGlmKG9yaWdpbkVsZW1lbnRJbmZvW1wiJHJlbGF0aW9uc2hpcElkXCJdKXsgLy9lZGl0IGEgcmVsYXRpb25zaGlwIHByb3BlcnR5XHJcbiAgICAgICAgdmFyIHR3aW5JRCA9IG9yaWdpbkVsZW1lbnRJbmZvW1wiJHNvdXJjZUlkXCJdXHJcbiAgICAgICAgdmFyIHJlbGF0aW9uc2hpcElEID0gb3JpZ2luRWxlbWVudEluZm9bXCIkcmVsYXRpb25zaGlwSWRcIl1cclxuICAgICAgICB2YXIgcGF5TG9hZD17XCJqc29uUGF0Y2hcIjpKU09OLnN0cmluZ2lmeShqc29uUGF0Y2gpLFwidHdpbklEXCI6dHdpbklELFwicmVsYXRpb25zaGlwSURcIjpyZWxhdGlvbnNoaXBJRH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgXHJcbiAgICB0cnl7XHJcbiAgICAgICAgYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vY2hhbmdlQXR0cmlidXRlXCIsIFwiUE9TVFwiLCBwYXlMb2FkKVxyXG4gICAgICAgIHRoaXMudXBkYXRlT3JpZ2luT2JqZWN0VmFsdWUob3JpZ2luRWxlbWVudEluZm8scGF0aCxuZXdWYWwpXHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICB9XHJcbiAgICBcclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS51cGRhdGVPcmlnaW5PYmplY3RWYWx1ZT1mdW5jdGlvbihub2RlSW5mbyxwYXRoQXJyLG5ld1ZhbCl7XHJcbiAgICBpZihwYXRoQXJyLmxlbmd0aD09MCkgcmV0dXJuO1xyXG4gICAgdmFyIHRoZUpzb249bm9kZUluZm9cclxuICAgIGZvcih2YXIgaT0wO2k8cGF0aEFyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIga2V5PXBhdGhBcnJbaV1cclxuXHJcbiAgICAgICAgaWYoaT09cGF0aEFyci5sZW5ndGgtMSl7XHJcbiAgICAgICAgICAgIHRoZUpzb25ba2V5XT1uZXdWYWxcclxuICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYodGhlSnNvbltrZXldPT1udWxsKSB0aGVKc29uW2tleV09e31cclxuICAgICAgICB0aGVKc29uPXRoZUpzb25ba2V5XVxyXG4gICAgfVxyXG4gICAgcmV0dXJuXHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuc2VhcmNoVmFsdWU9ZnVuY3Rpb24ob3JpZ2luRWxlbWVudEluZm8scGF0aEFycil7XHJcbiAgICBpZihwYXRoQXJyLmxlbmd0aD09MCkgcmV0dXJuIG51bGw7XHJcbiAgICB2YXIgdGhlSnNvbj1vcmlnaW5FbGVtZW50SW5mb1xyXG4gICAgZm9yKHZhciBpPTA7aTxwYXRoQXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBrZXk9cGF0aEFycltpXVxyXG4gICAgICAgIHRoZUpzb249dGhlSnNvbltrZXldXHJcbiAgICAgICAgaWYodGhlSnNvbj09bnVsbCkgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhlSnNvbiAvL2l0IHNob3VsZCBiZSB0aGUgZmluYWwgdmFsdWVcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgaW5mb1BhbmVsKCk7IiwiY29uc3Qgc3RhcnRTZWxlY3Rpb25EaWFsb2cgPSByZXF1aXJlKFwiLi9zdGFydFNlbGVjdGlvbkRpYWxvZ1wiKVxyXG5jb25zdCBtb2RlbE1hbmFnZXJEaWFsb2cgPSByZXF1aXJlKFwiLi9tb2RlbE1hbmFnZXJEaWFsb2dcIilcclxuY29uc3QgZWRpdExheW91dERpYWxvZz0gcmVxdWlyZShcIi4vZWRpdExheW91dERpYWxvZ1wiKVxyXG5jb25zdCBzaW1wbGVTZWxlY3RNZW51PSByZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvc2ltcGxlU2VsZWN0TWVudVwiKVxyXG5jb25zdCBnbG9iYWxDYWNoZSA9IHJlcXVpcmUoXCIuL2dsb2JhbENhY2hlXCIpXHJcbmNvbnN0IG1vZHVsZVN3aXRjaERpYWxvZz1yZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvbW9kdWxlU3dpdGNoRGlhbG9nXCIpXHJcblxyXG5mdW5jdGlvbiBtYWluVG9vbGJhcigpIHtcclxufVxyXG5cclxubWFpblRvb2xiYXIucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICQoXCIjbWFpblRvb2xCYXJcIikuYWRkQ2xhc3MoXCJ3My1iYXIgdzMtcmVkXCIpXHJcbiAgICAkKFwiI21haW5Ub29sQmFyXCIpLmNzcyh7XCJ6LWluZGV4XCI6MTAwLFwib3ZlcmZsb3dcIjpcInZpc2libGVcIn0pXHJcblxyXG4gICAgdGhpcy5zd2l0Y2hBRFRJbnN0YW5jZUJ0bj0kKCc8YSBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvblwiIGhyZWY9XCIjXCI+U291cmNlPC9hPicpXHJcbiAgICB0aGlzLm1vZGVsSU9CdG49JCgnPGEgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b25cIiBocmVmPVwiI1wiPk1vZGVsczwvYT4nKVxyXG4gICAgdGhpcy5zaG93Rm9yZ2VWaWV3QnRuPSQoJzxhIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWhvdmVyLW5vbmUgdzMtdGV4dC1saWdodC1ncmV5IHczLWhvdmVyLXRleHQtbGlnaHQtZ3JleVwiIHN0eWxlPVwib3BhY2l0eTouMzVcIiBocmVmPVwiI1wiPkZvcmdlVmlldzwvYT4nKVxyXG4gICAgdGhpcy5zaG93R0lTVmlld0J0bj0kKCc8YSBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ob3Zlci1ub25lIHczLXRleHQtbGlnaHQtZ3JleSB3My1ob3Zlci10ZXh0LWxpZ2h0LWdyZXlcIiBzdHlsZT1cIm9wYWNpdHk6LjM1XCIgaHJlZj1cIiNcIj5HSVNWaWV3PC9hPicpXHJcbiAgICB0aGlzLmVkaXRMYXlvdXRCdG49JCgnPGEgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b25cIiBocmVmPVwiI1wiPjxpIGNsYXNzPVwiZmEgZmEtZWRpdFwiPjwvaT48L2E+JylcclxuXHJcbiAgICB0aGlzLnRlc3RTaWduYWxSQnRuPSQoJzxhIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWFtYmVyXCIgaHJlZj1cIiNcIj5UZXN0IFNpZ25hbFI8L2E+JylcclxuICAgIHRoaXMudGVzdFNlbmRTaWduYWxSQnRuPSQoJzxhIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWFtYmVyXCIgaHJlZj1cIiNcIj5zZW5kIFNpZ25hbFIgbWVzc2FnZTwvYT4nKVxyXG5cclxuXHJcbiAgICB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yPW5ldyBzaW1wbGVTZWxlY3RNZW51KFwiTGF5b3V0XCIpXHJcblxyXG4gICAgJChcIiNtYWluVG9vbEJhclwiKS5lbXB0eSgpXHJcbiAgICAkKFwiI21haW5Ub29sQmFyXCIpLmFwcGVuZChtb2R1bGVTd2l0Y2hEaWFsb2cubW9kdWxlc1NpZGViYXIpXHJcbiAgICAkKFwiI21haW5Ub29sQmFyXCIpLmFwcGVuZChtb2R1bGVTd2l0Y2hEaWFsb2cubW9kdWxlc1N3aXRjaEJ1dHRvbiwgdGhpcy5zd2l0Y2hBRFRJbnN0YW5jZUJ0bix0aGlzLm1vZGVsSU9CdG4sdGhpcy5zaG93Rm9yZ2VWaWV3QnRuLHRoaXMuc2hvd0dJU1ZpZXdCdG5cclxuICAgICAgICAsdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5ET00sdGhpcy5lZGl0TGF5b3V0QnRuKVxyXG4gICAgICAgIC8vLHRoaXMudGVzdFNpZ25hbFJCdG4sdGhpcy50ZXN0U2VuZFNpZ25hbFJCdG5cclxuXHJcbiAgICB0aGlzLnN3aXRjaEFEVEluc3RhbmNlQnRuLm9uKFwiY2xpY2tcIiwoKT0+eyBzdGFydFNlbGVjdGlvbkRpYWxvZy5wb3B1cCgpIH0pXHJcbiAgICB0aGlzLm1vZGVsSU9CdG4ub24oXCJjbGlja1wiLCgpPT57IG1vZGVsTWFuYWdlckRpYWxvZy5wb3B1cCgpIH0pXHJcbiAgICB0aGlzLmVkaXRMYXlvdXRCdG4ub24oXCJjbGlja1wiLCgpPT57IGVkaXRMYXlvdXREaWFsb2cucG9wdXAoKSB9KVxyXG5cclxuXHJcbiAgICB0aGlzLnRlc3RTZW5kU2lnbmFsUkJ0bi5vbihcImNsaWNrXCIsYXN5bmMgKCk9PntcclxuICAgICAgICBjb25zdCBtc2FsSGVscGVyPXJlcXVpcmUoXCIuLi9tc2FsSGVscGVyXCIpXHJcbiAgICAgICAgdmFyIHJlID0gYXdhaXQgbXNhbEhlbHBlci5jYWxsQXp1cmVGdW5jdGlvbnNTZXJ2aWNlKFwibWVzc2FnZXNcIixcIlBPU1RcIix7XHJcbiAgICAgICAgICAgIHJlY2lwaWVudDogXCI1ZWI4MWY1Zi1mZDllLTQ4MWQtOTk2Yi00ZDBiOTUzNmY0NzdcIixcclxuICAgICAgICAgICAgdGV4dDogXCJob3cgZG8geW91IGRvXCJcclxuICAgICAgICAgIH0pXHJcbiAgICB9KVxyXG4gICAgdGhpcy50ZXN0U2lnbmFsUkJ0bi5vbihcImNsaWNrXCIsYXN5bmMgKCk9PntcclxuICAgICAgICBjb25zdCBtc2FsSGVscGVyPXJlcXVpcmUoXCIuLi9tc2FsSGVscGVyXCIpXHJcbiAgICAgICAgdmFyIHNpZ25hbFJJbmZvID0gYXdhaXQgbXNhbEhlbHBlci5jYWxsQXp1cmVGdW5jdGlvbnNTZXJ2aWNlKFwibmVnb3RpYXRlP25hbWU9ZmZcIixcIkdFVFwiKVxyXG4gICAgICAgIGNvbnN0IGNvbm5lY3Rpb24gPSBuZXcgc2lnbmFsUi5IdWJDb25uZWN0aW9uQnVpbGRlcigpXHJcbiAgICAgICAgLndpdGhVcmwoc2lnbmFsUkluZm8udXJsLCB7YWNjZXNzVG9rZW5GYWN0b3J5OiAoKSA9PiBzaWduYWxSSW5mby5hY2Nlc3NUb2tlbn0pXHJcbiAgICAgICAgLy8uY29uZmlndXJlTG9nZ2luZyhzaWduYWxSLkxvZ0xldmVsLkluZm9ybWF0aW9uKVxyXG4gICAgICAgIC5jb25maWd1cmVMb2dnaW5nKHNpZ25hbFIuTG9nTGV2ZWwuV2FybmluZylcclxuICAgICAgICAuYnVpbGQoKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhzaWduYWxSSW5mby5hY2Nlc3NUb2tlbilcclxuXHJcbiAgICAgICAgY29ubmVjdGlvbi5vbignbmV3TWVzc2FnZScsIChtZXNzYWdlKT0+e1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhtZXNzYWdlKVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGNvbm5lY3Rpb24ub25jbG9zZSgoKSA9PiBjb25zb2xlLmxvZygnZGlzY29ubmVjdGVkJykpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdjb25uZWN0aW5nLi4uJyk7XHJcbiAgICAgICAgY29ubmVjdGlvbi5zdGFydCgpXHJcbiAgICAgICAgICAudGhlbigoKSA9PiBjb25zb2xlLmxvZygnY29ubmVjdGVkIScpKVxyXG4gICAgICAgICAgLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xyXG4gICAgfSlcclxuXHJcblxyXG4gICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jYWxsQmFja19jbGlja09wdGlvbj0ob3B0aW9uVGV4dCxvcHRpb25WYWx1ZSk9PntcclxuICAgICAgICBnbG9iYWxDYWNoZS5jdXJyZW50TGF5b3V0TmFtZT1vcHRpb25WYWx1ZVxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImxheW91dENoYW5nZVwifSlcclxuICAgICAgICBpZihvcHRpb25WYWx1ZT09XCJbTkFdXCIpIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuY2hhbmdlTmFtZShcIkxheW91dFwiLFwiXCIpXHJcbiAgICAgICAgZWxzZSB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmNoYW5nZU5hbWUoXCJMYXlvdXQ6XCIsb3B0aW9uVGV4dClcclxuICAgIH1cclxufVxyXG5cclxubWFpblRvb2xiYXIucHJvdG90eXBlLnVwZGF0ZUxheW91dFNlbGVjdG9yID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGN1clNlbGVjdD10aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmN1clNlbGVjdFZhbFxyXG4gICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jbGVhck9wdGlvbnMoKVxyXG4gICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5hZGRPcHRpb24oJ1tObyBMYXlvdXQgU3BlY2lmaWVkXScsJ1tOQV0nKVxyXG5cclxuICAgIGZvciAodmFyIGluZCBpbiBnbG9iYWxDYWNoZS5sYXlvdXRKU09OKSB7XHJcbiAgICAgICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5hZGRPcHRpb24oaW5kKVxyXG4gICAgfVxyXG5cclxuICAgIGlmKGN1clNlbGVjdCE9bnVsbCAmJiB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmZpbmRPcHRpb24oY3VyU2VsZWN0KT09bnVsbCkgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jaGFuZ2VOYW1lKFwiTGF5b3V0XCIsXCJcIilcclxufVxyXG5cclxubWFpblRvb2xiYXIucHJvdG90eXBlLnJ4TWVzc2FnZT1mdW5jdGlvbihtc2dQYXlsb2FkKXtcclxuICAgIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJsYXlvdXRzVXBkYXRlZFwiKSB7XHJcbiAgICAgICAgdGhpcy51cGRhdGVMYXlvdXRTZWxlY3RvcigpXHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IG1haW5Ub29sYmFyKCk7IiwiLy9UaGlzIGlzIGEgc2luZ2xldG9uIGNsYXNzXHJcblxyXG5mdW5jdGlvbiBtb2RlbEFuYWx5emVyKCl7XHJcbiAgICB0aGlzLkRURExNb2RlbHM9e31cclxuICAgIHRoaXMucmVsYXRpb25zaGlwVHlwZXM9e31cclxufVxyXG5cclxubW9kZWxBbmFseXplci5wcm90b3R5cGUuY2xlYXJBbGxNb2RlbHM9ZnVuY3Rpb24oKXtcclxuICAgIC8vY29uc29sZS5sb2coXCJjbGVhciBhbGwgbW9kZWwgaW5mb1wiKVxyXG4gICAgZm9yKHZhciBpZCBpbiB0aGlzLkRURExNb2RlbHMpIGRlbGV0ZSB0aGlzLkRURExNb2RlbHNbaWRdXHJcbn1cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLnJlc2V0QWxsTW9kZWxzPWZ1bmN0aW9uKGFycil7XHJcbiAgICBmb3IodmFyIG1vZGVsSUQgaW4gdGhpcy5EVERMTW9kZWxzKXtcclxuICAgICAgICB2YXIganNvblN0cj10aGlzLkRURExNb2RlbHNbbW9kZWxJRF1bXCJvcmlnaW5hbFwiXVxyXG4gICAgICAgIHRoaXMuRFRETE1vZGVsc1ttb2RlbElEXT1KU09OLnBhcnNlKGpzb25TdHIpXHJcbiAgICAgICAgdGhpcy5EVERMTW9kZWxzW21vZGVsSURdW1wib3JpZ2luYWxcIl09anNvblN0clxyXG4gICAgfVxyXG59XHJcblxyXG5cclxubW9kZWxBbmFseXplci5wcm90b3R5cGUuYWRkTW9kZWxzPWZ1bmN0aW9uKGFycil7XHJcbiAgICBhcnIuZm9yRWFjaCgoZWxlKT0+e1xyXG4gICAgICAgIHZhciBtb2RlbElEPSBlbGVbXCJAaWRcIl1cclxuICAgICAgICBlbGVbXCJvcmlnaW5hbFwiXT1KU09OLnN0cmluZ2lmeShlbGUpXHJcbiAgICAgICAgdGhpcy5EVERMTW9kZWxzW21vZGVsSURdPWVsZVxyXG4gICAgfSlcclxufVxyXG5cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLnJlY29yZEFsbEJhc2VDbGFzc2VzPSBmdW5jdGlvbiAocGFyZW50T2JqLCBiYXNlQ2xhc3NJRCkge1xyXG4gICAgdmFyIGJhc2VDbGFzcyA9IHRoaXMuRFRETE1vZGVsc1tiYXNlQ2xhc3NJRF1cclxuICAgIGlmIChiYXNlQ2xhc3MgPT0gbnVsbCkgcmV0dXJuO1xyXG5cclxuICAgIHBhcmVudE9ialtiYXNlQ2xhc3NJRF09MVxyXG5cclxuICAgIHZhciBmdXJ0aGVyQmFzZUNsYXNzSURzID0gYmFzZUNsYXNzLmV4dGVuZHM7XHJcbiAgICBpZiAoZnVydGhlckJhc2VDbGFzc0lEcyA9PSBudWxsKSByZXR1cm47XHJcbiAgICBpZihBcnJheS5pc0FycmF5KGZ1cnRoZXJCYXNlQ2xhc3NJRHMpKSB2YXIgdG1wQXJyPWZ1cnRoZXJCYXNlQ2xhc3NJRHNcclxuICAgIGVsc2UgdG1wQXJyPVtmdXJ0aGVyQmFzZUNsYXNzSURzXVxyXG4gICAgdG1wQXJyLmZvckVhY2goKGVhY2hCYXNlKSA9PiB7IHRoaXMucmVjb3JkQWxsQmFzZUNsYXNzZXMocGFyZW50T2JqLCBlYWNoQmFzZSkgfSlcclxufVxyXG5cclxubW9kZWxBbmFseXplci5wcm90b3R5cGUuZXhwYW5kRWRpdGFibGVQcm9wZXJ0aWVzRnJvbUJhc2VDbGFzcyA9IGZ1bmN0aW9uIChwYXJlbnRPYmosIGJhc2VDbGFzc0lEKSB7XHJcbiAgICB2YXIgYmFzZUNsYXNzID0gdGhpcy5EVERMTW9kZWxzW2Jhc2VDbGFzc0lEXVxyXG4gICAgaWYgKGJhc2VDbGFzcyA9PSBudWxsKSByZXR1cm47XHJcbiAgICBpZiAoYmFzZUNsYXNzLmVkaXRhYmxlUHJvcGVydGllcykge1xyXG4gICAgICAgIGZvciAodmFyIGluZCBpbiBiYXNlQ2xhc3MuZWRpdGFibGVQcm9wZXJ0aWVzKSBwYXJlbnRPYmpbaW5kXSA9IGJhc2VDbGFzcy5lZGl0YWJsZVByb3BlcnRpZXNbaW5kXVxyXG4gICAgfVxyXG4gICAgdmFyIGZ1cnRoZXJCYXNlQ2xhc3NJRHMgPSBiYXNlQ2xhc3MuZXh0ZW5kcztcclxuICAgIGlmIChmdXJ0aGVyQmFzZUNsYXNzSURzID09IG51bGwpIHJldHVybjtcclxuICAgIGlmKEFycmF5LmlzQXJyYXkoZnVydGhlckJhc2VDbGFzc0lEcykpIHZhciB0bXBBcnI9ZnVydGhlckJhc2VDbGFzc0lEc1xyXG4gICAgZWxzZSB0bXBBcnI9W2Z1cnRoZXJCYXNlQ2xhc3NJRHNdXHJcbiAgICB0bXBBcnIuZm9yRWFjaCgoZWFjaEJhc2UpID0+IHsgdGhpcy5leHBhbmRFZGl0YWJsZVByb3BlcnRpZXNGcm9tQmFzZUNsYXNzKHBhcmVudE9iaiwgZWFjaEJhc2UpIH0pXHJcbn1cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLmV4cGFuZFZhbGlkUmVsYXRpb25zaGlwVHlwZXNGcm9tQmFzZUNsYXNzID0gZnVuY3Rpb24gKHBhcmVudE9iaiwgYmFzZUNsYXNzSUQpIHtcclxuICAgIHZhciBiYXNlQ2xhc3MgPSB0aGlzLkRURExNb2RlbHNbYmFzZUNsYXNzSURdXHJcbiAgICBpZiAoYmFzZUNsYXNzID09IG51bGwpIHJldHVybjtcclxuICAgIGlmIChiYXNlQ2xhc3MudmFsaWRSZWxhdGlvbnNoaXBzKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaW5kIGluIGJhc2VDbGFzcy52YWxpZFJlbGF0aW9uc2hpcHMpIHtcclxuICAgICAgICAgICAgaWYocGFyZW50T2JqW2luZF09PW51bGwpIHBhcmVudE9ialtpbmRdID0gdGhpcy5yZWxhdGlvbnNoaXBUeXBlc1tpbmRdW2Jhc2VDbGFzc0lEXVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHZhciBmdXJ0aGVyQmFzZUNsYXNzSURzID0gYmFzZUNsYXNzLmV4dGVuZHM7XHJcbiAgICBpZiAoZnVydGhlckJhc2VDbGFzc0lEcyA9PSBudWxsKSByZXR1cm47XHJcbiAgICBpZihBcnJheS5pc0FycmF5KGZ1cnRoZXJCYXNlQ2xhc3NJRHMpKSB2YXIgdG1wQXJyPWZ1cnRoZXJCYXNlQ2xhc3NJRHNcclxuICAgIGVsc2UgdG1wQXJyPVtmdXJ0aGVyQmFzZUNsYXNzSURzXVxyXG4gICAgdG1wQXJyLmZvckVhY2goKGVhY2hCYXNlKSA9PiB7IHRoaXMuZXhwYW5kVmFsaWRSZWxhdGlvbnNoaXBUeXBlc0Zyb21CYXNlQ2xhc3MocGFyZW50T2JqLCBlYWNoQmFzZSkgfSlcclxufVxyXG5cclxubW9kZWxBbmFseXplci5wcm90b3R5cGUuZXhwYW5kRWRpdGFibGVQcm9wZXJ0aWVzPWZ1bmN0aW9uKHBhcmVudE9iaixkYXRhSW5mbyxlbWJlZGRlZFNjaGVtYSl7XHJcbiAgICBkYXRhSW5mby5mb3JFYWNoKChvbmVDb250ZW50KT0+e1xyXG4gICAgICAgIGlmKG9uZUNvbnRlbnRbXCJAdHlwZVwiXT09XCJSZWxhdGlvbnNoaXBcIikgcmV0dXJuO1xyXG4gICAgICAgIGlmKG9uZUNvbnRlbnRbXCJAdHlwZVwiXT09XCJQcm9wZXJ0eVwiXHJcbiAgICAgICAgfHwoQXJyYXkuaXNBcnJheShvbmVDb250ZW50W1wiQHR5cGVcIl0pICYmIG9uZUNvbnRlbnRbXCJAdHlwZVwiXS5pbmNsdWRlcyhcIlByb3BlcnR5XCIpKVxyXG4gICAgICAgIHx8IG9uZUNvbnRlbnRbXCJAdHlwZVwiXT09bnVsbCkge1xyXG4gICAgICAgICAgICBpZih0eXBlb2Yob25lQ29udGVudFtcInNjaGVtYVwiXSkgIT0gJ29iamVjdCcgJiYgZW1iZWRkZWRTY2hlbWFbb25lQ29udGVudFtcInNjaGVtYVwiXV0hPW51bGwpIG9uZUNvbnRlbnRbXCJzY2hlbWFcIl09ZW1iZWRkZWRTY2hlbWFbb25lQ29udGVudFtcInNjaGVtYVwiXV1cclxuXHJcbiAgICAgICAgICAgIGlmKHR5cGVvZihvbmVDb250ZW50W1wic2NoZW1hXCJdKSA9PT0gJ29iamVjdCcgJiYgb25lQ29udGVudFtcInNjaGVtYVwiXVtcIkB0eXBlXCJdPT1cIk9iamVjdFwiKXtcclxuICAgICAgICAgICAgICAgIHZhciBuZXdQYXJlbnQ9e31cclxuICAgICAgICAgICAgICAgIHBhcmVudE9ialtvbmVDb250ZW50W1wibmFtZVwiXV09bmV3UGFyZW50XHJcbiAgICAgICAgICAgICAgICB0aGlzLmV4cGFuZEVkaXRhYmxlUHJvcGVydGllcyhuZXdQYXJlbnQsb25lQ29udGVudFtcInNjaGVtYVwiXVtcImZpZWxkc1wiXSxlbWJlZGRlZFNjaGVtYSlcclxuICAgICAgICAgICAgfWVsc2UgaWYodHlwZW9mKG9uZUNvbnRlbnRbXCJzY2hlbWFcIl0pID09PSAnb2JqZWN0JyAmJiBvbmVDb250ZW50W1wic2NoZW1hXCJdW1wiQHR5cGVcIl09PVwiRW51bVwiKXtcclxuICAgICAgICAgICAgICAgIHBhcmVudE9ialtvbmVDb250ZW50W1wibmFtZVwiXV09b25lQ29udGVudFtcInNjaGVtYVwiXVtcImVudW1WYWx1ZXNcIl1cclxuICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnRPYmpbb25lQ29udGVudFtcIm5hbWVcIl1dPW9uZUNvbnRlbnRbXCJzY2hlbWFcIl1cclxuICAgICAgICAgICAgfSAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufVxyXG5cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLmFuYWx5emU9ZnVuY3Rpb24oKXtcclxuICAgIC8vY29uc29sZS5sb2coXCJhbmFseXplIG1vZGVsIGluZm9cIilcclxuICAgIC8vYW5hbHl6ZSBhbGwgcmVsYXRpb25zaGlwIHR5cGVzXHJcbiAgICBmb3IgKHZhciBpZCBpbiB0aGlzLnJlbGF0aW9uc2hpcFR5cGVzKSBkZWxldGUgdGhpcy5yZWxhdGlvbnNoaXBUeXBlc1tpZF1cclxuICAgIGZvciAodmFyIG1vZGVsSUQgaW4gdGhpcy5EVERMTW9kZWxzKSB7XHJcbiAgICAgICAgdmFyIGVsZSA9IHRoaXMuRFRETE1vZGVsc1ttb2RlbElEXVxyXG4gICAgICAgIHZhciBlbWJlZGRlZFNjaGVtYSA9IHt9XHJcbiAgICAgICAgaWYgKGVsZS5zY2hlbWFzKSB7XHJcbiAgICAgICAgICAgIHZhciB0ZW1wQXJyO1xyXG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShlbGUuc2NoZW1hcykpIHRlbXBBcnIgPSBlbGUuc2NoZW1hc1xyXG4gICAgICAgICAgICBlbHNlIHRlbXBBcnIgPSBbZWxlLnNjaGVtYXNdXHJcbiAgICAgICAgICAgIHRlbXBBcnIuZm9yRWFjaCgoZWxlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBlbWJlZGRlZFNjaGVtYVtlbGVbXCJAaWRcIl1dID0gZWxlXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgY29udGVudEFyciA9IGVsZS5jb250ZW50c1xyXG4gICAgICAgIGlmICghY29udGVudEFycikgY29udGludWU7XHJcbiAgICAgICAgY29udGVudEFyci5mb3JFYWNoKChvbmVDb250ZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChvbmVDb250ZW50W1wiQHR5cGVcIl0gPT0gXCJSZWxhdGlvbnNoaXBcIikge1xyXG4gICAgICAgICAgICAgICAgaWYoIXRoaXMucmVsYXRpb25zaGlwVHlwZXNbb25lQ29udGVudFtcIm5hbWVcIl1dKSB0aGlzLnJlbGF0aW9uc2hpcFR5cGVzW29uZUNvbnRlbnRbXCJuYW1lXCJdXT0ge31cclxuICAgICAgICAgICAgICAgIHRoaXMucmVsYXRpb25zaGlwVHlwZXNbb25lQ29udGVudFtcIm5hbWVcIl1dW21vZGVsSURdID0gb25lQ29udGVudFxyXG4gICAgICAgICAgICAgICAgb25lQ29udGVudC5lZGl0YWJsZVJlbGF0aW9uc2hpcFByb3BlcnRpZXMgPSB7fVxyXG4gICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkob25lQ29udGVudC5wcm9wZXJ0aWVzKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXhwYW5kRWRpdGFibGVQcm9wZXJ0aWVzKG9uZUNvbnRlbnQuZWRpdGFibGVSZWxhdGlvbnNoaXBQcm9wZXJ0aWVzLCBvbmVDb250ZW50LnByb3BlcnRpZXMsIGVtYmVkZGVkU2NoZW1hKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICAvL2FuYWx5emUgZWFjaCBtb2RlbCdzIHByb3BlcnR5IHRoYXQgY2FuIGJlIGVkaXRlZFxyXG4gICAgZm9yKHZhciBtb2RlbElEIGluIHRoaXMuRFRETE1vZGVscyl7IC8vZXhwYW5kIHBvc3NpYmxlIGVtYmVkZGVkIHNjaGVtYSB0byBlZGl0YWJsZVByb3BlcnRpZXMsIGFsc28gZXh0cmFjdCBwb3NzaWJsZSByZWxhdGlvbnNoaXAgdHlwZXMgZm9yIHRoaXMgbW9kZWxcclxuICAgICAgICB2YXIgZWxlPXRoaXMuRFRETE1vZGVsc1ttb2RlbElEXVxyXG4gICAgICAgIHZhciBlbWJlZGRlZFNjaGVtYT17fVxyXG4gICAgICAgIGlmKGVsZS5zY2hlbWFzKXtcclxuICAgICAgICAgICAgdmFyIHRlbXBBcnI7XHJcbiAgICAgICAgICAgIGlmKEFycmF5LmlzQXJyYXkoZWxlLnNjaGVtYXMpKSB0ZW1wQXJyPWVsZS5zY2hlbWFzXHJcbiAgICAgICAgICAgIGVsc2UgdGVtcEFycj1bZWxlLnNjaGVtYXNdXHJcbiAgICAgICAgICAgIHRlbXBBcnIuZm9yRWFjaCgoZWxlKT0+e1xyXG4gICAgICAgICAgICAgICAgZW1iZWRkZWRTY2hlbWFbZWxlW1wiQGlkXCJdXT1lbGVcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxlLmVkaXRhYmxlUHJvcGVydGllcz17fVxyXG4gICAgICAgIGVsZS52YWxpZFJlbGF0aW9uc2hpcHM9e31cclxuICAgICAgICBlbGUuaW5jbHVkZWRDb21wb25lbnRzPVtdXHJcbiAgICAgICAgZWxlLmFsbEJhc2VDbGFzc2VzPXt9XHJcbiAgICAgICAgaWYoQXJyYXkuaXNBcnJheShlbGUuY29udGVudHMpKXtcclxuICAgICAgICAgICAgdGhpcy5leHBhbmRFZGl0YWJsZVByb3BlcnRpZXMoZWxlLmVkaXRhYmxlUHJvcGVydGllcyxlbGUuY29udGVudHMsZW1iZWRkZWRTY2hlbWEpXHJcblxyXG4gICAgICAgICAgICBlbGUuY29udGVudHMuZm9yRWFjaCgob25lQ29udGVudCk9PntcclxuICAgICAgICAgICAgICAgIGlmKG9uZUNvbnRlbnRbXCJAdHlwZVwiXT09XCJSZWxhdGlvbnNoaXBcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIGVsZS52YWxpZFJlbGF0aW9uc2hpcHNbb25lQ29udGVudFtcIm5hbWVcIl1dPXRoaXMucmVsYXRpb25zaGlwVHlwZXNbb25lQ29udGVudFtcIm5hbWVcIl1dW21vZGVsSURdXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZvcih2YXIgbW9kZWxJRCBpbiB0aGlzLkRURExNb2RlbHMpey8vZXhwYW5kIGNvbXBvbmVudCBwcm9wZXJ0aWVzXHJcbiAgICAgICAgdmFyIGVsZT10aGlzLkRURExNb2RlbHNbbW9kZWxJRF1cclxuICAgICAgICBpZihBcnJheS5pc0FycmF5KGVsZS5jb250ZW50cykpe1xyXG4gICAgICAgICAgICBlbGUuY29udGVudHMuZm9yRWFjaChvbmVDb250ZW50PT57XHJcbiAgICAgICAgICAgICAgICBpZihvbmVDb250ZW50W1wiQHR5cGVcIl09PVwiQ29tcG9uZW50XCIpe1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjb21wb25lbnROYW1lPW9uZUNvbnRlbnRbXCJuYW1lXCJdXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvbXBvbmVudENsYXNzPW9uZUNvbnRlbnRbXCJzY2hlbWFcIl1cclxuICAgICAgICAgICAgICAgICAgICBlbGUuZWRpdGFibGVQcm9wZXJ0aWVzW2NvbXBvbmVudE5hbWVdPXt9XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5leHBhbmRFZGl0YWJsZVByb3BlcnRpZXNGcm9tQmFzZUNsYXNzKGVsZS5lZGl0YWJsZVByb3BlcnRpZXNbY29tcG9uZW50TmFtZV0sY29tcG9uZW50Q2xhc3MpXHJcbiAgICAgICAgICAgICAgICAgICAgZWxlLmluY2x1ZGVkQ29tcG9uZW50cy5wdXNoKGNvbXBvbmVudE5hbWUpXHJcbiAgICAgICAgICAgICAgICB9IFxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmb3IodmFyIG1vZGVsSUQgaW4gdGhpcy5EVERMTW9kZWxzKXsvL2V4cGFuZCBiYXNlIGNsYXNzIHByb3BlcnRpZXMgdG8gZWRpdGFibGVQcm9wZXJ0aWVzIGFuZCB2YWxpZCByZWxhdGlvbnNoaXAgdHlwZXMgdG8gdmFsaWRSZWxhdGlvbnNoaXBzXHJcbiAgICAgICAgdmFyIGVsZT10aGlzLkRURExNb2RlbHNbbW9kZWxJRF1cclxuICAgICAgICB2YXIgYmFzZUNsYXNzSURzPWVsZS5leHRlbmRzO1xyXG4gICAgICAgIGlmKGJhc2VDbGFzc0lEcz09bnVsbCkgY29udGludWU7XHJcbiAgICAgICAgaWYoQXJyYXkuaXNBcnJheShiYXNlQ2xhc3NJRHMpKSB2YXIgdG1wQXJyPWJhc2VDbGFzc0lEc1xyXG4gICAgICAgIGVsc2UgdG1wQXJyPVtiYXNlQ2xhc3NJRHNdXHJcbiAgICAgICAgdG1wQXJyLmZvckVhY2goKGVhY2hCYXNlKT0+e1xyXG4gICAgICAgICAgICB0aGlzLnJlY29yZEFsbEJhc2VDbGFzc2VzKGVsZS5hbGxCYXNlQ2xhc3NlcyxlYWNoQmFzZSlcclxuICAgICAgICAgICAgdGhpcy5leHBhbmRFZGl0YWJsZVByb3BlcnRpZXNGcm9tQmFzZUNsYXNzKGVsZS5lZGl0YWJsZVByb3BlcnRpZXMsZWFjaEJhc2UpXHJcbiAgICAgICAgICAgIHRoaXMuZXhwYW5kVmFsaWRSZWxhdGlvbnNoaXBUeXBlc0Zyb21CYXNlQ2xhc3MoZWxlLnZhbGlkUmVsYXRpb25zaGlwcyxlYWNoQmFzZSlcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIC8vY29uc29sZS5sb2codGhpcy5EVERMTW9kZWxzKVxyXG4gICAgLy9jb25zb2xlLmxvZyh0aGlzLnJlbGF0aW9uc2hpcFR5cGVzKVxyXG59XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgbW9kZWxBbmFseXplcigpOyIsImNvbnN0IG1vZGVsQW5hbHl6ZXI9cmVxdWlyZShcIi4vbW9kZWxBbmFseXplclwiKVxyXG5jb25zdCBzaW1wbGVTZWxlY3RNZW51PSByZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvc2ltcGxlU2VsZWN0TWVudVwiKVxyXG5jb25zdCBtc2FsSGVscGVyPXJlcXVpcmUoXCIuLi9tc2FsSGVscGVyXCIpXHJcbmNvbnN0IGdsb2JhbENhY2hlID0gcmVxdWlyZShcIi4vZ2xvYmFsQ2FjaGVcIilcclxuXHJcbmZ1bmN0aW9uIG1vZGVsRWRpdG9yRGlhbG9nKCkge1xyXG4gICAgaWYoIXRoaXMuRE9NKXtcclxuICAgICAgICB0aGlzLkRPTSA9ICQoJzxkaXYgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO2JhY2tncm91bmQtY29sb3I6d2hpdGU7bGVmdDo1MCU7dHJhbnNmb3JtOiB0cmFuc2xhdGVYKC01MCUpIHRyYW5zbGF0ZVkoLTUwJSk7ei1pbmRleDo5OVwiIGNsYXNzPVwidzMtY2FyZC0yXCI+PC9kaXY+JylcclxuICAgICAgICAkKFwiYm9keVwiKS5hcHBlbmQodGhpcy5ET00pXHJcbiAgICAgICAgdGhpcy5ET00uaGlkZSgpXHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZGVsRWRpdG9yRGlhbG9nLnByb3RvdHlwZS5wb3B1cCA9IGFzeW5jIGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5ET00uc2hvdygpXHJcbiAgICB0aGlzLkRPTS5lbXB0eSgpXHJcbiAgICB0aGlzLmNvbnRlbnRET00gPSAkKCc8ZGl2IHN0eWxlPVwid2lkdGg6NjY1cHhcIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKHRoaXMuY29udGVudERPTSlcclxuICAgIHRoaXMuY29udGVudERPTS5hcHBlbmQoJCgnPGRpdiBzdHlsZT1cImhlaWdodDo0MHB4XCIgY2xhc3M9XCJ3My1iYXIgdzMtcmVkXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtXCIgc3R5bGU9XCJmb250LXNpemU6MS41ZW1cIj5EaWdpdGFsIFR3aW4gTW9kZWwgRWRpdG9yPC9kaXY+PC9kaXY+JykpXHJcbiAgICB2YXIgY2xvc2VCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJpZ2h0XCIgc3R5bGU9XCJmb250LXNpemU6MmVtO3BhZGRpbmctdG9wOjRweFwiPsOXPC9idXR0b24+JylcclxuICAgIHRoaXMuY29udGVudERPTS5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKGNsb3NlQnV0dG9uKVxyXG4gICAgY2xvc2VCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMuRE9NLmhpZGUoKSB9KVxyXG5cclxuICAgIHZhciBidXR0b25Sb3c9JCgnPGRpdiAgc3R5bGU9XCJoZWlnaHQ6NDBweFwiIGNsYXNzPVwidzMtYmFyXCI+PC9kaXY+JylcclxuICAgIHRoaXMuY29udGVudERPTS5hcHBlbmQoYnV0dG9uUm93KVxyXG4gICAgdmFyIGltcG9ydEJ1dHRvbiA9JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1jYXJkIHczLWRlZXAtb3JhbmdlIHczLWhvdmVyLWxpZ2h0LWdyZWVuIHczLXJpZ2h0XCIgc3R5bGU9XCJoZWlnaHQ6MTAwJVwiPkltcG9ydDwvYnV0dG9uPicpXHJcbiAgICBidXR0b25Sb3cuYXBwZW5kKGltcG9ydEJ1dHRvbilcclxuXHJcbiAgICBpbXBvcnRCdXR0b24ub24oXCJjbGlja1wiLCBhc3luYyAoKSA9PiB7RlxyXG4gICAgICAgIHZhciBtb2RlbFRvQmVJbXBvcnRlZCA9IFt0aGlzLmR0ZGxvYmpdXHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgdmFyIHJlc3BvbnNlID0gYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vaW1wb3J0TW9kZWxzXCIsIFwiUE9TVFwiLCB7IFwibW9kZWxzXCI6IEpTT04uc3RyaW5naWZ5KG1vZGVsVG9CZUltcG9ydGVkKSB9KVxyXG5cclxuICAgICAgICAgICAgYWxlcnQoXCJNb2RlbCBcXFwiXCIgKyB0aGlzLmR0ZGxvYmpbXCJkaXNwbGF5TmFtZVwiXSArIFwiXFxcIiBpcyBjcmVhdGVkIVwiKVxyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJBRFRNb2RlbEVkaXRlZFwiIH0pXHJcbiAgICAgICAgICAgIG1vZGVsQW5hbHl6ZXIuYWRkTW9kZWxzKG1vZGVsVG9CZUltcG9ydGVkKSAvL2FkZCBzbyBpbW1lZGlhdGxleSB0aGUgbGlzdCBjYW4gc2hvdyB0aGUgbmV3IG1vZGVsc1xyXG4gICAgICAgICAgICB0aGlzLnBvcHVwKCkgLy9yZWZyZXNoIGNvbnRlbnRcclxuICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgICAgICB9ICAgICAgICBcclxuICAgIH0pXHJcblxyXG4gICAgdmFyIGxhYmxlPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1vcGFjaXR5XCIgc3R5bGU9XCJwYWRkaW5nLXJpZ2h0OjVweDtmb250LXNpemU6MS4yZW07XCI+TW9kZWwgVGVtcGxhdGU8L2Rpdj4nKVxyXG4gICAgYnV0dG9uUm93LmFwcGVuZChsYWJsZSlcclxuICAgIHZhciBtb2RlbFRlbXBsYXRlU2VsZWN0b3I9bmV3IHNpbXBsZVNlbGVjdE1lbnUoXCIgXCIse3dpdGhCb3JkZXI6MSxmb250U2l6ZTpcIjEuMmVtXCIsY29sb3JDbGFzczpcInczLWxpZ2h0LWdyYXlcIixidXR0b25DU1M6e1wicGFkZGluZ1wiOlwiNXB4IDEwcHhcIn0sXCJvcHRpb25MaXN0SGVpZ2h0XCI6MzAwfSlcclxuICAgIGJ1dHRvblJvdy5hcHBlbmQobW9kZWxUZW1wbGF0ZVNlbGVjdG9yLkRPTSlcclxuICAgIG1vZGVsVGVtcGxhdGVTZWxlY3Rvci5jYWxsQmFja19jbGlja09wdGlvbj0ob3B0aW9uVGV4dCxvcHRpb25WYWx1ZSk9PntcclxuICAgICAgICBtb2RlbFRlbXBsYXRlU2VsZWN0b3IuY2hhbmdlTmFtZShvcHRpb25UZXh0KVxyXG4gICAgICAgIHRoaXMuY2hvb3NlVGVtcGxhdGUob3B0aW9uVmFsdWUpXHJcbiAgICB9XHJcbiAgICBtb2RlbFRlbXBsYXRlU2VsZWN0b3IuYWRkT3B0aW9uKFwiTmV3IE1vZGVsLi4uXCIsXCJOZXdcIilcclxuICAgIGZvcih2YXIgbW9kZWxOYW1lIGluIG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVscyl7XHJcbiAgICAgICAgbW9kZWxUZW1wbGF0ZVNlbGVjdG9yLmFkZE9wdGlvbihtb2RlbE5hbWUpXHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHBhbmVsSGVpZ2h0PVwiNDUwcHhcIlxyXG4gICAgdmFyIHJvdzI9JCgnPGRpdiBjbGFzcz1cInczLWNlbGwtcm93XCIgc3R5bGU9XCJtYXJnaW46MnB4XCI+PC9kaXY+JylcclxuICAgIHRoaXMuY29udGVudERPTS5hcHBlbmQocm93MilcclxuICAgIHZhciBsZWZ0U3Bhbj0kKCc8ZGl2IGNsYXNzPVwidzMtY2FyZFwiIHN0eWxlPVwicGFkZGluZzo1cHg7d2lkdGg6MzMwcHg7cGFkZGluZy1yaWdodDo1cHg7aGVpZ2h0OicrcGFuZWxIZWlnaHQrJztvdmVyZmxvdzphdXRvXCI+PC9kaXY+JylcclxuICAgIHJvdzIuYXBwZW5kKGxlZnRTcGFuKVxyXG4gICAgdGhpcy5sZWZ0U3Bhbj1sZWZ0U3BhblxyXG5cclxuICAgIHZhciByaWdodFNwYW49JCgnPGRpdiBjbGFzcz1cInczLWNvbnRhaW5lciB3My1jZWxsXCI+PC9kaXY+JylcclxuICAgIHJvdzIuYXBwZW5kKHJpZ2h0U3BhbikgXHJcbiAgICB2YXIgZHRkbFNjcmlwdFBhbmVsPSQoJzxkaXYgY2xhc3M9XCJ3My1jYXJkLTIgdzMtd2hpdGVcIiBzdHlsZT1cIm92ZXJmbG93OmF1dG87bWFyZ2luLXRvcDoycHg7d2lkdGg6MzEwcHg7aGVpZ2h0OicrcGFuZWxIZWlnaHQrJ1wiPjwvZGl2PicpXHJcbiAgICByaWdodFNwYW4uYXBwZW5kKGR0ZGxTY3JpcHRQYW5lbClcclxuICAgIHRoaXMuZHRkbFNjcmlwdFBhbmVsPWR0ZGxTY3JpcHRQYW5lbFxyXG5cclxuICAgIG1vZGVsVGVtcGxhdGVTZWxlY3Rvci50cmlnZ2VyT3B0aW9uSW5kZXgoMClcclxufVxyXG5cclxubW9kZWxFZGl0b3JEaWFsb2cucHJvdG90eXBlLmNob29zZVRlbXBsYXRlPWZ1bmN0aW9uKHRlbXBhbHRlTmFtZSl7XHJcbiAgICBpZih0ZW1wYWx0ZU5hbWUhPVwiTmV3XCIpe1xyXG4gICAgICAgIHRoaXMuZHRkbG9iaj1KU09OLnBhcnNlKG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1t0ZW1wYWx0ZU5hbWVdW1wib3JpZ2luYWxcIl0pXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB0aGlzLmR0ZGxvYmogPSB7XHJcbiAgICAgICAgICAgIFwiQGlkXCI6IFwiZHRtaTphTmFtZVNwYWNlOmFNb2RlbElEOzFcIixcclxuICAgICAgICAgICAgXCJAY29udGV4dFwiOiBbXCJkdG1pOmR0ZGw6Y29udGV4dDsyXCJdLFxyXG4gICAgICAgICAgICBcIkB0eXBlXCI6IFwiSW50ZXJmYWNlXCIsXHJcbiAgICAgICAgICAgIFwiZGlzcGxheU5hbWVcIjogXCJOZXcgTW9kZWxcIixcclxuICAgICAgICAgICAgXCJjb250ZW50c1wiOiBbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJAdHlwZVwiOiBcIlByb3BlcnR5XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJuYW1lXCI6IFwiYXR0cmlidXRlMVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwic2NoZW1hXCI6IFwiZG91YmxlXCJcclxuICAgICAgICAgICAgICAgIH0se1xyXG4gICAgICAgICAgICAgICAgICAgIFwiQHR5cGVcIjogXCJSZWxhdGlvbnNoaXBcIixcclxuICAgICAgICAgICAgICAgICAgICBcIm5hbWVcIjogXCJsaW5rXCJcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMubGVmdFNwYW4uZW1wdHkoKVxyXG5cclxuICAgIHRoaXMucmVmcmVzaERUREwoKVxyXG4gICAgdGhpcy5sZWZ0U3Bhbi5hcHBlbmQoJCgnPGRpdiBjbGFzcz1cInczLWJhclwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbSB3My10b29sdGlwXCIgc3R5bGU9XCJmb250LXNpemU6MS4yZW07cGFkZGluZy1sZWZ0OjJweDtmb250LXdlaWdodDpib2xkO2NvbG9yOmdyYXlcIj5Nb2RlbCBJRCAmIE5hbWU8cCBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RleHQtYWxpZ246bGVmdDtmb250LXdlaWdodDpub3JtYWw7dG9wOi0xMHB4O3dpZHRoOjIwMHB4XCIgY2xhc3M9XCJ3My10ZXh0IHczLXRhZyB3My10aW55XCI+bW9kZWwgSUQgY29udGFpbnMgbmFtZXNwYWNlLCBhIG1vZGVsIHN0cmluZyBhbmQgYSB2ZXJzaW9uIG51bWJlcjwvcD48L2Rpdj48L2Rpdj4nKSlcclxuICAgIG5ldyBpZFJvdyh0aGlzLmR0ZGxvYmosdGhpcy5sZWZ0U3BhbiwoKT0+e3RoaXMucmVmcmVzaERUREwoKX0pXHJcbiAgICBuZXcgZGlzcGxheU5hbWVSb3codGhpcy5kdGRsb2JqLHRoaXMubGVmdFNwYW4sKCk9Pnt0aGlzLnJlZnJlc2hEVERMKCl9KVxyXG5cclxuICAgIGlmKCF0aGlzLmR0ZGxvYmpbXCJjb250ZW50c1wiXSl0aGlzLmR0ZGxvYmpbXCJjb250ZW50c1wiXT1bXVxyXG4gICAgbmV3IHBhcmFtZXRlcnNSb3codGhpcy5kdGRsb2JqW1wiY29udGVudHNcIl0sdGhpcy5sZWZ0U3BhbiwoKT0+e3RoaXMucmVmcmVzaERUREwoKX0sdGhpcy5ET00ub2Zmc2V0KCkpXHJcbiAgICBuZXcgcmVsYXRpb25zUm93KHRoaXMuZHRkbG9ialtcImNvbnRlbnRzXCJdLHRoaXMubGVmdFNwYW4sKCk9Pnt0aGlzLnJlZnJlc2hEVERMKCl9LHRoaXMuRE9NLm9mZnNldCgpKVxyXG4gICAgbmV3IGNvbXBvbmVudHNSb3codGhpcy5kdGRsb2JqW1wiY29udGVudHNcIl0sdGhpcy5sZWZ0U3BhbiwoKT0+e3RoaXMucmVmcmVzaERUREwoKX0pXHJcblxyXG4gICAgaWYoIXRoaXMuZHRkbG9ialtcImV4dGVuZHNcIl0pdGhpcy5kdGRsb2JqW1wiZXh0ZW5kc1wiXT1bXVxyXG4gICAgbmV3IGJhc2VDbGFzc2VzUm93KHRoaXMuZHRkbG9ialtcImV4dGVuZHNcIl0sdGhpcy5sZWZ0U3BhbiwoKT0+e3RoaXMucmVmcmVzaERUREwoKX0pXHJcbn1cclxuXHJcbm1vZGVsRWRpdG9yRGlhbG9nLnByb3RvdHlwZS5yZWZyZXNoRFRETD1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5kdGRsU2NyaXB0UGFuZWwuZW1wdHkoKVxyXG4gICAgdGhpcy5kdGRsU2NyaXB0UGFuZWwuYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6MjBweDt3aWR0aDoxMDBweFwiIGNsYXNzPVwidzMtYmFyIHczLWdyYXlcIj5HZW5lcmF0ZWQgRFRETDwvZGl2PicpKVxyXG4gICAgdGhpcy5kdGRsU2NyaXB0UGFuZWwuYXBwZW5kKCQoJzxwcmUgc3R5bGU9XCJjb2xvcjpncmF5XCI+JytKU09OLnN0cmluZ2lmeSh0aGlzLmR0ZGxvYmosbnVsbCwyKSsnPC9wcmU+JykpXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IG1vZGVsRWRpdG9yRGlhbG9nKCk7XHJcblxyXG5cclxuZnVuY3Rpb24gYmFzZUNsYXNzZXNSb3coZHRkbE9iaixwYXJlbnRET00scmVmcmVzaERURExGKXtcclxuICAgIHZhciByb3dET009JCgnPGRpdiBjbGFzcz1cInczLWJhclwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbSAgdzMtdG9vbHRpcFwiIHN0eWxlPVwiZm9udC1zaXplOjEuMmVtO3BhZGRpbmctbGVmdDoycHg7Zm9udC13ZWlnaHQ6Ym9sZDtjb2xvcjpncmF5XCI+QmFzZSBDbGFzc2VzPHAgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0ZXh0LWFsaWduOmxlZnQ7dG9wOi0xMHB4O2ZvbnQtd2VpZ2h0Om5vcm1hbDt3aWR0aDoyMDBweFwiIGNsYXNzPVwidzMtdGV4dCB3My10YWcgdzMtdGlueVwiPkJhc2UgY2xhc3MgbW9kZWxcXCdzIHBhcmFtZXRlcnMgYW5kIHJlbGF0aW9uc2hpcCB0eXBlIGFyZSBpbmhlcml0ZWQ8L3A+PC9kaXY+PC9kaXY+JylcclxuXHJcbiAgICB2YXIgYWRkQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yZWQgdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cIm1hcmdpbi10b3A6MnB4O2ZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjRweFwiPis8L2J1dHRvbj4nKVxyXG4gICAgcm93RE9NLmFwcGVuZChhZGRCdXR0b24pXHJcbiAgICBwYXJlbnRET00uYXBwZW5kKHJvd0RPTSlcclxuICAgIHZhciBjb250ZW50RE9NPSQoJzxkaXYgc3R5bGU9XCJwYWRkaW5nLWxlZnQ6MTBweFwiPjwvZGl2PicpXHJcbiAgICByb3dET00uYXBwZW5kKGNvbnRlbnRET00pXHJcbiAgICBhZGRCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgdmFyIG5ld09iaiA9IFwidW5rbm93blwiXHJcbiAgICAgICAgZHRkbE9iai5wdXNoKG5ld09iailcclxuICAgICAgICBuZXcgc2luZ2xlQmFzZWNsYXNzUm93KG5ld09iaixjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgLy9jaGVjayBleGlzdGVkIGNvbnRlbnQgaW5pdGlhbGx5IGZyb20gdGVtcGxhdGUgYW5kIHRyaWdnZXIgdGhlaXIgZHJhd2luZ1xyXG4gICAgZHRkbE9iai5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIG5ldyBzaW5nbGVCYXNlY2xhc3NSb3coZWxlbWVudCxjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqKVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNpbmdsZUJhc2VjbGFzc1JvdyhkdGRsT2JqLHBhcmVudERPTSxyZWZyZXNoRFRETEYscGFyZW50RHRkbE9iail7XHJcbiAgICB2YXIgRE9NID0gJCgnPGRpdiBjbGFzcz1cInczLWNlbGwtcm93XCI+PC9kaXY+JylcclxuICAgIHZhciBiYXNlQ2xhc3NOYW1lSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmU7d2lkdGg6MjIwcHg7cGFkZGluZzo0cHhcIiAgcGxhY2Vob2xkZXI9XCJiYXNlIG1vZGVsIGlkXCIvPicpLmFkZENsYXNzKFwidzMtYmFyLWl0ZW0gdzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgdmFyIHJlbW92ZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cImNvbG9yOmdyYXk7bWFyZ2luLWxlZnQ6M3B4O21hcmdpbi10b3A6MnB4O2ZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjJweFwiPjxpIGNsYXNzPVwiZmEgZmEtdHJhc2ggZmEtbGdcIj48L2k+PC9idXR0b24+JylcclxuICAgIERPTS5hcHBlbmQoYmFzZUNsYXNzTmFtZUlucHV0LHJlbW92ZUJ1dHRvbilcclxuXHJcbiAgICByZW1vdmVCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgZm9yICh2YXIgaSA9MDtpPCBwYXJlbnREdGRsT2JqLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChwYXJlbnREdGRsT2JqW2ldID09IGR0ZGxPYmopIHtcclxuICAgICAgICAgICAgICAgIHBhcmVudER0ZGxPYmouc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgRE9NLnJlbW92ZSgpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcblxyXG4gICAgcGFyZW50RE9NLmFwcGVuZChET00pXHJcblxyXG4gICAgYmFzZUNsYXNzTmFtZUlucHV0LnZhbChkdGRsT2JqKVxyXG4gICAgYmFzZUNsYXNzTmFtZUlucHV0Lm9uKFwiY2hhbmdlXCIsKCk9PntcclxuICAgICAgICBmb3IgKHZhciBpID0wO2k8IHBhcmVudER0ZGxPYmoubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHBhcmVudER0ZGxPYmpbaV0gPT0gZHRkbE9iaikge1xyXG4gICAgICAgICAgICAgICAgcGFyZW50RHRkbE9ialtpXT1iYXNlQ2xhc3NOYW1lSW5wdXQudmFsKClcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG59XHJcblxyXG5mdW5jdGlvbiBjb21wb25lbnRzUm93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRil7XHJcbiAgICB2YXIgcm93RE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXJcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW0gIHczLXRvb2x0aXBcIiBzdHlsZT1cImZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nLWxlZnQ6MnB4O2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6Z3JheVwiPkNvbXBvbmVudHM8cCBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RleHQtYWxpZ246bGVmdDt0b3A6LTEwcHg7Zm9udC13ZWlnaHQ6bm9ybWFsO3dpZHRoOjIwMHB4XCIgY2xhc3M9XCJ3My10ZXh0IHczLXRhZyB3My10aW55XCI+Q29tcG9uZW50IG1vZGVsXFwncyBwYXJhbWV0ZXJzIGFyZSBlbWJlZGRlZCB1bmRlciBhIG5hbWU8L3A+PC9kaXY+PC9kaXY+JylcclxuXHJcbiAgICB2YXIgYWRkQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yZWQgdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cIm1hcmdpbi10b3A6MnB4O2ZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjRweFwiPis8L2J1dHRvbj4nKVxyXG4gICAgcm93RE9NLmFwcGVuZChhZGRCdXR0b24pXHJcbiAgICBwYXJlbnRET00uYXBwZW5kKHJvd0RPTSlcclxuICAgIHZhciBjb250ZW50RE9NPSQoJzxkaXYgc3R5bGU9XCJwYWRkaW5nLWxlZnQ6MTBweFwiPjwvZGl2PicpXHJcbiAgICByb3dET00uYXBwZW5kKGNvbnRlbnRET00pXHJcblxyXG4gICAgYWRkQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIHZhciBuZXdPYmogPSB7XHJcbiAgICAgICAgICAgIFwiQHR5cGVcIjogXCJDb21wb25lbnRcIixcclxuICAgICAgICAgICAgXCJuYW1lXCI6IFwiU29tZUNvbXBvbmVudFwiLFxyXG4gICAgICAgICAgICBcInNjaGVtYVwiOlwiZHRtaTpzb21lQ29tcG9uZW50TW9kZWw7MVwiXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGR0ZGxPYmoucHVzaChuZXdPYmopXHJcbiAgICAgICAgbmV3IHNpbmdsZUNvbXBvbmVudFJvdyhuZXdPYmosY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9iailcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuICAgIC8vY2hlY2sgZXhpc3RlZCBjb250ZW50IGluaXRpYWxseSBmcm9tIHRlbXBsYXRlIGFuZCB0cmlnZ2VyIHRoZWlyIGRyYXdpbmdcclxuICAgIGR0ZGxPYmouZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICBpZihlbGVtZW50W1wiQHR5cGVcIl0hPVwiQ29tcG9uZW50XCIpIHJldHVyblxyXG4gICAgICAgIG5ldyBzaW5nbGVDb21wb25lbnRSb3coZWxlbWVudCxjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqKVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNpbmdsZUNvbXBvbmVudFJvdyhkdGRsT2JqLHBhcmVudERPTSxyZWZyZXNoRFRETEYscGFyZW50RHRkbE9iail7XHJcbiAgICB2YXIgRE9NID0gJCgnPGRpdiBjbGFzcz1cInczLWNlbGwtcm93XCI+PC9kaXY+JylcclxuICAgIHZhciBjb21wb25lbnROYW1lSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmU7d2lkdGg6MTAwcHg7cGFkZGluZzo0cHhcIiAgcGxhY2Vob2xkZXI9XCJjb21wb25lbnQgbmFtZVwiLz4nKS5hZGRDbGFzcyhcInczLWJhci1pdGVtIHczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIHZhciBzY2hlbWFJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDoxNjBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cImNvbXBvbmVudCBtb2RlbCBpZC4uLlwiLz4nKS5hZGRDbGFzcyhcInczLWJhci1pdGVtIHczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIHZhciByZW1vdmVCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWhvdmVyLWFtYmVyXCIgc3R5bGU9XCJjb2xvcjpncmF5O21hcmdpbi1sZWZ0OjNweDttYXJnaW4tdG9wOjJweDtmb250LXNpemU6MS4yZW07cGFkZGluZzoycHhcIj48aSBjbGFzcz1cImZhIGZhLXRyYXNoIGZhLWxnXCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICBET00uYXBwZW5kKGNvbXBvbmVudE5hbWVJbnB1dCxzY2hlbWFJbnB1dCxyZW1vdmVCdXR0b24pXHJcblxyXG4gICAgcmVtb3ZlQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIGZvciAodmFyIGkgPTA7aTwgcGFyZW50RHRkbE9iai5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAocGFyZW50RHRkbE9ialtpXSA9PT0gZHRkbE9iaikge1xyXG4gICAgICAgICAgICAgICAgcGFyZW50RHRkbE9iai5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBET00ucmVtb3ZlKClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuXHJcbiAgICBwYXJlbnRET00uYXBwZW5kKERPTSlcclxuXHJcbiAgICBjb21wb25lbnROYW1lSW5wdXQudmFsKGR0ZGxPYmpbXCJuYW1lXCJdKVxyXG4gICAgc2NoZW1hSW5wdXQudmFsKGR0ZGxPYmpbXCJzY2hlbWFcIl18fFwiXCIpXHJcblxyXG4gICAgY29tcG9uZW50TmFtZUlucHV0Lm9uKFwiY2hhbmdlXCIsKCk9PntcclxuICAgICAgICBkdGRsT2JqW1wibmFtZVwiXT1jb21wb25lbnROYW1lSW5wdXQudmFsKClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuICAgIHNjaGVtYUlucHV0Lm9uKFwiY2hhbmdlXCIsKCk9PntcclxuICAgICAgICBkdGRsT2JqW1wic2NoZW1hXCJdPXNjaGVtYUlucHV0LnZhbCgpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlbGF0aW9uc1JvdyhkdGRsT2JqLHBhcmVudERPTSxyZWZyZXNoRFRETEYsZGlhbG9nT2Zmc2V0KXtcclxuICAgIHZhciByb3dET009JCgnPGRpdiBjbGFzcz1cInczLWJhclwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbSB3My10b29sdGlwXCIgc3R5bGU9XCJmb250LXNpemU6MS4yZW07cGFkZGluZy1sZWZ0OjJweDtmb250LXdlaWdodDpib2xkO2NvbG9yOmdyYXlcIj5SZWxhdGlvbnNoaXAgVHlwZXM8cCBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RleHQtYWxpZ246bGVmdDt0b3A6LTEwcHg7Zm9udC13ZWlnaHQ6bm9ybWFsO3dpZHRoOjIwMHB4XCIgY2xhc3M9XCJ3My10ZXh0IHczLXRhZyB3My10aW55XCI+UmVsYXRpb25zaGlwIGNhbiBoYXZlIGl0cyBvd24gcGFyYW1ldGVyczwvcD48L2Rpdj48L2Rpdj4nKVxyXG5cclxuXHJcbiAgICB2YXIgYWRkQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yZWQgdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cIm1hcmdpbi10b3A6MnB4O2ZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjRweFwiPis8L2J1dHRvbj4nKVxyXG4gICAgcm93RE9NLmFwcGVuZChhZGRCdXR0b24pXHJcbiAgICBwYXJlbnRET00uYXBwZW5kKHJvd0RPTSlcclxuICAgIHZhciBjb250ZW50RE9NPSQoJzxkaXYgc3R5bGU9XCJwYWRkaW5nLWxlZnQ6MTBweFwiPjwvZGl2PicpXHJcbiAgICByb3dET00uYXBwZW5kKGNvbnRlbnRET00pXHJcblxyXG4gICAgYWRkQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIHZhciBuZXdPYmogPSB7XHJcbiAgICAgICAgICAgIFwiQHR5cGVcIjogXCJSZWxhdGlvbnNoaXBcIixcclxuICAgICAgICAgICAgXCJuYW1lXCI6IFwicmVsYXRpb24xXCIsXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGR0ZGxPYmoucHVzaChuZXdPYmopXHJcbiAgICAgICAgbmV3IHNpbmdsZVJlbGF0aW9uVHlwZVJvdyhuZXdPYmosY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9iaixkaWFsb2dPZmZzZXQpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcblxyXG4gICAgLy9jaGVjayBleGlzdGVkIGNvbnRlbnQgaW5pdGlhbGx5IGZyb20gdGVtcGxhdGUgYW5kIHRyaWdnZXIgdGhlaXIgZHJhd2luZ1xyXG4gICAgZHRkbE9iai5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIGlmKGVsZW1lbnRbXCJAdHlwZVwiXSE9XCJSZWxhdGlvbnNoaXBcIikgcmV0dXJuXHJcbiAgICAgICAgbmV3IHNpbmdsZVJlbGF0aW9uVHlwZVJvdyhlbGVtZW50LGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmosZGlhbG9nT2Zmc2V0KVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNpbmdsZVJlbGF0aW9uVHlwZVJvdyhkdGRsT2JqLHBhcmVudERPTSxyZWZyZXNoRFRETEYscGFyZW50RHRkbE9iaixkaWFsb2dPZmZzZXQpe1xyXG4gICAgdmFyIERPTSA9ICQoJzxkaXYgY2xhc3M9XCJ3My1jZWxsLXJvd1wiPjwvZGl2PicpXHJcbiAgICB2YXIgcmVsYXRpb25OYW1lSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmU7d2lkdGg6OTBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cInJlbGF0aW9uIG5hbWVcIi8+JykuYWRkQ2xhc3MoXCJ3My1iYXItaXRlbSB3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICB2YXIgdGFyZ2V0TW9kZWxJRD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDoxNDBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cIihvcHRpb25hbCl0YXJnZXQgbW9kZWxcIi8+JykuYWRkQ2xhc3MoXCJ3My1iYXItaXRlbSB3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICB2YXIgYWRkQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwiY29sb3I6Z3JheTttYXJnaW4tbGVmdDozcHg7bWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6MnB4XCI+PGkgY2xhc3M9XCJmYSBmYS1jb2cgZmEtbGdcIj48L2k+PC9idXR0b24+JylcclxuICAgIHZhciByZW1vdmVCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWhvdmVyLWFtYmVyXCIgc3R5bGU9XCJjb2xvcjpncmF5O21hcmdpbi1sZWZ0OjNweDttYXJnaW4tdG9wOjJweDtmb250LXNpemU6MS4yZW07cGFkZGluZzoycHhcIj48aSBjbGFzcz1cImZhIGZhLXRyYXNoIGZhLWxnXCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICBET00uYXBwZW5kKHJlbGF0aW9uTmFtZUlucHV0LHRhcmdldE1vZGVsSUQsYWRkQnV0dG9uLHJlbW92ZUJ1dHRvbilcclxuXHJcbiAgICByZW1vdmVCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgZm9yICh2YXIgaSA9MDtpPCBwYXJlbnREdGRsT2JqLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChwYXJlbnREdGRsT2JqW2ldID09PSBkdGRsT2JqKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnREdGRsT2JqLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIERPTS5yZW1vdmUoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG5cclxuICAgIHZhciBjb250ZW50RE9NPSQoJzxkaXYgc3R5bGU9XCJwYWRkaW5nLWxlZnQ6MTBweFwiPjwvZGl2PicpXHJcbiAgICBET00uYXBwZW5kKGNvbnRlbnRET00pXHJcbiAgICBwYXJlbnRET00uYXBwZW5kKERPTSlcclxuXHJcbiAgICByZWxhdGlvbk5hbWVJbnB1dC52YWwoZHRkbE9ialtcIm5hbWVcIl0pXHJcbiAgICB0YXJnZXRNb2RlbElELnZhbChkdGRsT2JqW1widGFyZ2V0XCJdfHxcIlwiKVxyXG5cclxuICAgIGFkZEJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICBpZighIGR0ZGxPYmpbXCJwcm9wZXJ0aWVzXCJdKSBkdGRsT2JqW1wicHJvcGVydGllc1wiXT1bXVxyXG4gICAgICAgIHZhciBuZXdPYmogPSB7XHJcbiAgICAgICAgICAgIFwibmFtZVwiOiBcIm5ld1BcIixcclxuICAgICAgICAgICAgXCJzY2hlbWFcIjogXCJkb3VibGVcIlxyXG4gICAgICAgIH1cclxuICAgICAgICBkdGRsT2JqW1wicHJvcGVydGllc1wiXS5wdXNoKG5ld09iailcclxuICAgICAgICBuZXcgc2luZ2xlUGFyYW1ldGVyUm93KG5ld09iaixjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqW1wicHJvcGVydGllc1wiXSxudWxsLGRpYWxvZ09mZnNldClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuXHJcbiAgICByZWxhdGlvbk5hbWVJbnB1dC5vbihcImNoYW5nZVwiLCgpPT57XHJcbiAgICAgICAgZHRkbE9ialtcIm5hbWVcIl09cmVsYXRpb25OYW1lSW5wdXQudmFsKClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuICAgIHRhcmdldE1vZGVsSUQub24oXCJjaGFuZ2VcIiwoKT0+e1xyXG4gICAgICAgIGlmKHRhcmdldE1vZGVsSUQudmFsKCk9PVwiXCIpIGRlbGV0ZSBkdGRsT2JqW1widGFyZ2V0XCJdXHJcbiAgICAgICAgZWxzZSBkdGRsT2JqW1widGFyZ2V0XCJdPXRhcmdldE1vZGVsSUQudmFsKClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuICAgIGlmKGR0ZGxPYmpbXCJwcm9wZXJ0aWVzXCJdICYmIGR0ZGxPYmpbXCJwcm9wZXJ0aWVzXCJdLmxlbmd0aD4wKXtcclxuICAgICAgICB2YXIgcHJvcGVydGllcz1kdGRsT2JqW1wicHJvcGVydGllc1wiXVxyXG4gICAgICAgIHByb3BlcnRpZXMuZm9yRWFjaChvbmVQcm9wZXJ0eT0+e1xyXG4gICAgICAgICAgICBuZXcgc2luZ2xlUGFyYW1ldGVyUm93KG9uZVByb3BlcnR5LGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmpbXCJwcm9wZXJ0aWVzXCJdLG51bGwsZGlhbG9nT2Zmc2V0KVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHBhcmFtZXRlcnNSb3coZHRkbE9iaixwYXJlbnRET00scmVmcmVzaERURExGLGRpYWxvZ09mZnNldCl7XHJcbiAgICB2YXIgcm93RE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXJcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cImZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nLWxlZnQ6MnB4O2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6Z3JheVwiPlBhcmFtZXRlcnM8L2Rpdj48L2Rpdj4nKVxyXG4gICAgdmFyIGFkZEJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmVkIHczLWhvdmVyLWFtYmVyXCIgc3R5bGU9XCJtYXJnaW4tdG9wOjJweDtmb250LXNpemU6MS4yZW07cGFkZGluZzo0cHhcIj4rPC9idXR0b24+JylcclxuICAgIHJvd0RPTS5hcHBlbmQoYWRkQnV0dG9uKVxyXG4gICAgcGFyZW50RE9NLmFwcGVuZChyb3dET00pXHJcbiAgICB2YXIgY29udGVudERPTT0kKCc8ZGl2IHN0eWxlPVwicGFkZGluZy1sZWZ0OjEwcHhcIj48L2Rpdj4nKVxyXG4gICAgcm93RE9NLmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgYWRkQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIHZhciBuZXdPYmogPSB7XHJcbiAgICAgICAgICAgIFwiQHR5cGVcIjogXCJQcm9wZXJ0eVwiLFxyXG4gICAgICAgICAgICBcIm5hbWVcIjogXCJuZXdQXCIsXHJcbiAgICAgICAgICAgIFwic2NoZW1hXCI6IFwiZG91YmxlXCJcclxuICAgICAgICB9XHJcbiAgICAgICAgZHRkbE9iai5wdXNoKG5ld09iailcclxuICAgICAgICBuZXcgc2luZ2xlUGFyYW1ldGVyUm93KG5ld09iaixjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqLFwidG9wTGV2ZWxcIixkaWFsb2dPZmZzZXQpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcblxyXG4gICAgLy9jaGVjayBleGlzdGVkIGNvbnRlbnQgaW5pdGlhbGx5IGZyb20gdGVtcGxhdGUgYW5kIHRyaWdnZXIgdGhlaXIgZHJhd2luZ1xyXG4gICAgZHRkbE9iai5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIGlmKGVsZW1lbnRbXCJAdHlwZVwiXSE9XCJQcm9wZXJ0eVwiKSByZXR1cm5cclxuICAgICAgICBuZXcgc2luZ2xlUGFyYW1ldGVyUm93KGVsZW1lbnQsY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9iaixcInRvcExldmVsXCIsZGlhbG9nT2Zmc2V0KVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNpbmdsZVBhcmFtZXRlclJvdyhkdGRsT2JqLHBhcmVudERPTSxyZWZyZXNoRFRETEYscGFyZW50RHRkbE9iaix0b3BMZXZlbCxkaWFsb2dPZmZzZXQpe1xyXG4gICAgdmFyIERPTSA9ICQoJzxkaXYgY2xhc3M9XCJ3My1jZWxsLXJvd1wiPjwvZGl2PicpXHJcbiAgICB2YXIgcGFyYW1ldGVyTmFtZUlucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjEwMHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwicGFyYW1ldGVyIG5hbWVcIi8+JykuYWRkQ2xhc3MoXCJ3My1iYXItaXRlbSB3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICB2YXIgZW51bVZhbHVlSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmU7d2lkdGg6MTAwcHg7cGFkZGluZzo0cHhcIiAgcGxhY2Vob2xkZXI9XCJzdHIxLHN0cjIsLi4uXCIvPicpLmFkZENsYXNzKFwidzMtYmFyLWl0ZW0gdzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgdmFyIGFkZEJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cImNvbG9yOmdyYXk7bWFyZ2luLWxlZnQ6M3B4O21hcmdpbi10b3A6MnB4O2ZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjJweFwiPjxpIGNsYXNzPVwiZmEgZmEtcGx1cyBmYS1sZ1wiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgdmFyIHJlbW92ZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cImNvbG9yOmdyYXk7bWFyZ2luLWxlZnQ6M3B4O21hcmdpbi10b3A6MnB4O2ZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjJweFwiPjxpIGNsYXNzPVwiZmEgZmEtdHJhc2ggZmEtbGdcIj48L2k+PC9idXR0b24+JylcclxuICAgIHZhciBwdHlwZVNlbGVjdG9yPW5ldyBzaW1wbGVTZWxlY3RNZW51KFwiIFwiLHt3aXRoQm9yZGVyOjEsZm9udFNpemU6XCIxZW1cIixjb2xvckNsYXNzOlwidzMtbGlnaHQtZ3JheSB3My1iYXItaXRlbVwiLGJ1dHRvbkNTUzp7XCJwYWRkaW5nXCI6XCI0cHggNXB4XCJ9LFwib3B0aW9uTGlzdEhlaWdodFwiOjMwMCxcImlzQ2xpY2thYmxlXCI6MSxcIm9wdGlvbkxpc3RNYXJnaW5Ub3BcIjotMTUwLFwib3B0aW9uTGlzdE1hcmdpbkxlZnRcIjo2MCxcclxuICAgIFwiYWRqdXN0UG9zaXRpb25BbmNob3JcIjpkaWFsb2dPZmZzZXR9KVxyXG4gICAgcHR5cGVTZWxlY3Rvci5hZGRPcHRpb25BcnIoW1wiRW51bVwiLFwiT2JqZWN0XCIsXCJib29sZWFuXCIsXCJkYXRlXCIsXCJkYXRlVGltZVwiLFwiZG91YmxlXCIsXCJkdXJhdGlvblwiLFwiZmxvYXRcIixcImludGVnZXJcIixcImxvbmdcIixcInN0cmluZ1wiLFwidGltZVwiXSlcclxuICAgIERPTS5hcHBlbmQocGFyYW1ldGVyTmFtZUlucHV0LHB0eXBlU2VsZWN0b3IuRE9NLGVudW1WYWx1ZUlucHV0LGFkZEJ1dHRvbixyZW1vdmVCdXR0b24pXHJcblxyXG4gICAgcmVtb3ZlQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIGZvciAodmFyIGkgPTA7aTwgcGFyZW50RHRkbE9iai5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAocGFyZW50RHRkbE9ialtpXSA9PT0gZHRkbE9iaikge1xyXG4gICAgICAgICAgICAgICAgcGFyZW50RHRkbE9iai5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBET00ucmVtb3ZlKClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuICAgIFxyXG4gICAgdmFyIGNvbnRlbnRET009JCgnPGRpdiBzdHlsZT1cInBhZGRpbmctbGVmdDoxMHB4XCI+PC9kaXY+JylcclxuICAgIERPTS5hcHBlbmQoY29udGVudERPTSlcclxuICAgIHBhcmVudERPTS5hcHBlbmQoRE9NKVxyXG5cclxuICAgIHBhcmFtZXRlck5hbWVJbnB1dC52YWwoZHRkbE9ialtcIm5hbWVcIl0pXHJcbiAgICBwdHlwZVNlbGVjdG9yLmNhbGxCYWNrX2NsaWNrT3B0aW9uPShvcHRpb25UZXh0LG9wdGlvblZhbHVlLHJlYWxNb3VzZUNsaWNrKT0+e1xyXG4gICAgICAgIHB0eXBlU2VsZWN0b3IuY2hhbmdlTmFtZShvcHRpb25UZXh0KVxyXG4gICAgICAgIGNvbnRlbnRET00uZW1wdHkoKS8vY2xlYXIgYWxsIGNvbnRlbnQgZG9tIGNvbnRlbnRcclxuICAgICAgICBpZihyZWFsTW91c2VDbGljayl7XHJcbiAgICAgICAgICAgIGZvcih2YXIgaW5kIGluIGR0ZGxPYmopIGRlbGV0ZSBkdGRsT2JqW2luZF0gICAgLy9jbGVhciBhbGwgb2JqZWN0IGNvbnRlbnRcclxuICAgICAgICAgICAgaWYodG9wTGV2ZWwpIGR0ZGxPYmpbXCJAdHlwZVwiXT1cIlByb3BlcnR5XCJcclxuICAgICAgICAgICAgZHRkbE9ialtcIm5hbWVcIl09cGFyYW1ldGVyTmFtZUlucHV0LnZhbCgpXHJcbiAgICAgICAgfSBcclxuICAgICAgICBpZihvcHRpb25UZXh0PT1cIkVudW1cIil7XHJcbiAgICAgICAgICAgIGVudW1WYWx1ZUlucHV0LnZhbChcIlwiKVxyXG4gICAgICAgICAgICBlbnVtVmFsdWVJbnB1dC5zaG93KCk7XHJcbiAgICAgICAgICAgIGFkZEJ1dHRvbi5oaWRlKClcclxuICAgICAgICAgICAgaWYocmVhbE1vdXNlQ2xpY2spIGR0ZGxPYmpbXCJzY2hlbWFcIl09e1wiQHR5cGVcIjogXCJFbnVtXCIsXCJ2YWx1ZVNjaGVtYVwiOiBcInN0cmluZ1wifVxyXG4gICAgICAgIH1lbHNlIGlmKG9wdGlvblRleHQ9PVwiT2JqZWN0XCIpe1xyXG4gICAgICAgICAgICBlbnVtVmFsdWVJbnB1dC5oaWRlKCk7XHJcbiAgICAgICAgICAgIGFkZEJ1dHRvbi5zaG93KClcclxuICAgICAgICAgICAgaWYocmVhbE1vdXNlQ2xpY2spIGR0ZGxPYmpbXCJzY2hlbWFcIl09e1wiQHR5cGVcIjogXCJPYmplY3RcIn1cclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgaWYocmVhbE1vdXNlQ2xpY2spIGR0ZGxPYmpbXCJzY2hlbWFcIl09b3B0aW9uVGV4dFxyXG4gICAgICAgICAgICBlbnVtVmFsdWVJbnB1dC5oaWRlKCk7XHJcbiAgICAgICAgICAgIGFkZEJ1dHRvbi5oaWRlKClcclxuICAgICAgICB9XHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH1cclxuICAgIGFkZEJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICBpZighIGR0ZGxPYmpbXCJzY2hlbWFcIl1bXCJmaWVsZHNcIl0pIGR0ZGxPYmpbXCJzY2hlbWFcIl1bXCJmaWVsZHNcIl09W11cclxuICAgICAgICB2YXIgbmV3T2JqID0ge1xyXG4gICAgICAgICAgICBcIm5hbWVcIjogXCJuZXdQXCIsXHJcbiAgICAgICAgICAgIFwic2NoZW1hXCI6IFwiZG91YmxlXCJcclxuICAgICAgICB9XHJcbiAgICAgICAgZHRkbE9ialtcInNjaGVtYVwiXVtcImZpZWxkc1wiXS5wdXNoKG5ld09iailcclxuICAgICAgICBuZXcgc2luZ2xlUGFyYW1ldGVyUm93KG5ld09iaixjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqW1wic2NoZW1hXCJdW1wiZmllbGRzXCJdLG51bGwsZGlhbG9nT2Zmc2V0KVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG5cclxuICAgIHBhcmFtZXRlck5hbWVJbnB1dC5vbihcImNoYW5nZVwiLCgpPT57XHJcbiAgICAgICAgZHRkbE9ialtcIm5hbWVcIl09cGFyYW1ldGVyTmFtZUlucHV0LnZhbCgpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcbiAgICBlbnVtVmFsdWVJbnB1dC5vbihcImNoYW5nZVwiLCgpPT57XHJcbiAgICAgICAgdmFyIHZhbHVlQXJyPWVudW1WYWx1ZUlucHV0LnZhbCgpLnNwbGl0KFwiLFwiKVxyXG4gICAgICAgIGR0ZGxPYmpbXCJzY2hlbWFcIl1bXCJlbnVtVmFsdWVzXCJdPVtdXHJcbiAgICAgICAgdmFsdWVBcnIuZm9yRWFjaChhVmFsPT57XHJcbiAgICAgICAgICAgIGR0ZGxPYmpbXCJzY2hlbWFcIl1bXCJlbnVtVmFsdWVzXCJdLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgXCJuYW1lXCI6IGFWYWwucmVwbGFjZShcIiBcIixcIlwiKSwgLy9yZW1vdmUgYWxsIHRoZSBzcGFjZSBpbiBuYW1lXHJcbiAgICAgICAgICAgICAgICBcImVudW1WYWx1ZVwiOiBhVmFsXHJcbiAgICAgICAgICAgICAgfSlcclxuICAgICAgICB9KVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgaWYodHlwZW9mKGR0ZGxPYmpbXCJzY2hlbWFcIl0pICE9ICdvYmplY3QnKSB2YXIgc2NoZW1hPWR0ZGxPYmpbXCJzY2hlbWFcIl1cclxuICAgIGVsc2Ugc2NoZW1hPWR0ZGxPYmpbXCJzY2hlbWFcIl1bXCJAdHlwZVwiXVxyXG4gICAgcHR5cGVTZWxlY3Rvci50cmlnZ2VyT3B0aW9uVmFsdWUoc2NoZW1hKVxyXG4gICAgaWYoc2NoZW1hPT1cIkVudW1cIil7XHJcbiAgICAgICAgdmFyIGVudW1BcnI9ZHRkbE9ialtcInNjaGVtYVwiXVtcImVudW1WYWx1ZXNcIl1cclxuICAgICAgICBpZihlbnVtQXJyIT1udWxsKXtcclxuICAgICAgICAgICAgdmFyIGlucHV0U3RyPVwiXCJcclxuICAgICAgICAgICAgZW51bUFyci5mb3JFYWNoKG9uZUVudW1WYWx1ZT0+e2lucHV0U3RyKz1vbmVFbnVtVmFsdWUuZW51bVZhbHVlK1wiLFwifSlcclxuICAgICAgICAgICAgaW5wdXRTdHI9aW5wdXRTdHIuc2xpY2UoMCwgLTEpLy9yZW1vdmUgdGhlIGxhc3QgXCIsXCJcclxuICAgICAgICAgICAgZW51bVZhbHVlSW5wdXQudmFsKGlucHV0U3RyKVxyXG4gICAgICAgIH1cclxuICAgIH1lbHNlIGlmKHNjaGVtYT09XCJPYmplY3RcIil7XHJcbiAgICAgICAgdmFyIGZpZWxkcz1kdGRsT2JqW1wic2NoZW1hXCJdW1wiZmllbGRzXCJdXHJcbiAgICAgICAgZmllbGRzLmZvckVhY2gob25lRmllbGQ9PntcclxuICAgICAgICAgICAgbmV3IHNpbmdsZVBhcmFtZXRlclJvdyhvbmVGaWVsZCxjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqW1wic2NoZW1hXCJdW1wiZmllbGRzXCJdLG51bGwsZGlhbG9nT2Zmc2V0KVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5mdW5jdGlvbiBpZFJvdyhkdGRsT2JqLHBhcmVudERPTSxyZWZyZXNoRFRETEYpe1xyXG4gICAgdmFyIERPTSA9ICQoJzxkaXYgY2xhc3M9XCJ3My1jZWxsLXJvd1wiPjwvZGl2PicpXHJcbiAgICB2YXIgbGFiZWwxPSQoJzxkaXYgY2xhc3M9XCJ3My1vcGFjaXR5XCIgc3R5bGU9XCJkaXNwbGF5OmlubGluZVwiPmR0bWk6PC9kaXY+JylcclxuICAgIHZhciBkb21haW5JbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDo4MHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwiTmFtZXNwYWNlXCIvPicpLmFkZENsYXNzKFwidzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgdmFyIG1vZGVsSURJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDoxNDBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cIk1vZGVsSURcIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICB2YXIgdmVyc2lvbklucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjYwcHg7cGFkZGluZzo0cHhcIiAgcGxhY2Vob2xkZXI9XCJ2ZXJzaW9uXCIvPicpLmFkZENsYXNzKFwidzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgRE9NLmFwcGVuZChsYWJlbDEsZG9tYWluSW5wdXQsJCgnPGRpdiBjbGFzcz1cInczLW9wYWNpdHlcIiBzdHlsZT1cImRpc3BsYXk6aW5saW5lXCI+OjwvZGl2PicpLG1vZGVsSURJbnB1dCwkKCc8ZGl2IGNsYXNzPVwidzMtb3BhY2l0eVwiIHN0eWxlPVwiZGlzcGxheTppbmxpbmVcIj47PC9kaXY+JyksdmVyc2lvbklucHV0KVxyXG4gICAgcGFyZW50RE9NLmFwcGVuZChET00pXHJcblxyXG4gICAgdmFyIHZhbHVlQ2hhbmdlPSgpPT57XHJcbiAgICAgICAgdmFyIHN0cj1gZHRtaToke2RvbWFpbklucHV0LnZhbCgpfToke21vZGVsSURJbnB1dC52YWwoKX07JHt2ZXJzaW9uSW5wdXQudmFsKCl9YFxyXG4gICAgICAgIGR0ZGxPYmpbXCJAaWRcIl09c3RyXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH1cclxuICAgIGRvbWFpbklucHV0Lm9uKFwiY2hhbmdlXCIsdmFsdWVDaGFuZ2UpXHJcbiAgICBtb2RlbElESW5wdXQub24oXCJjaGFuZ2VcIix2YWx1ZUNoYW5nZSlcclxuICAgIHZlcnNpb25JbnB1dC5vbihcImNoYW5nZVwiLHZhbHVlQ2hhbmdlKVxyXG5cclxuICAgIHZhciBzdHI9ZHRkbE9ialtcIkBpZFwiXVxyXG4gICAgaWYoc3RyIT1cIlwiICYmIHN0ciE9bnVsbCl7XHJcbiAgICAgICAgdmFyIGFycjE9c3RyLnNwbGl0KFwiO1wiKVxyXG4gICAgICAgIGlmKGFycjEubGVuZ3RoIT0yKSByZXR1cm47XHJcbiAgICAgICAgdmVyc2lvbklucHV0LnZhbChhcnIxWzFdKVxyXG4gICAgICAgIHZhciBhcnIyPWFycjFbMF0uc3BsaXQoXCI6XCIpXHJcbiAgICAgICAgZG9tYWluSW5wdXQudmFsKGFycjJbMV0pXHJcbiAgICAgICAgYXJyMi5zaGlmdCgpOyBhcnIyLnNoaWZ0KClcclxuICAgICAgICBtb2RlbElESW5wdXQudmFsKGFycjIuam9pbihcIjpcIikpXHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRpc3BsYXlOYW1lUm93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRil7XHJcbiAgICB2YXIgRE9NID0gJCgnPGRpdiBjbGFzcz1cInczLWNlbGwtcm93XCI+PC9kaXY+JylcclxuICAgIHZhciBsYWJlbDE9JCgnPGRpdiBjbGFzcz1cInczLW9wYWNpdHlcIiBzdHlsZT1cImRpc3BsYXk6aW5saW5lXCI+RGlzcGxheSBOYW1lOjwvZGl2PicpXHJcbiAgICB2YXIgbmFtZUlucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjE1MHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwiTW9kZWxJRFwiLz4nKS5hZGRDbGFzcyhcInczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIERPTS5hcHBlbmQobGFiZWwxLG5hbWVJbnB1dClcclxuICAgIHBhcmVudERPTS5hcHBlbmQoRE9NKVxyXG4gICAgdmFyIHZhbHVlQ2hhbmdlPSgpPT57XHJcbiAgICAgICAgZHRkbE9ialtcImRpc3BsYXlOYW1lXCJdPW5hbWVJbnB1dC52YWwoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9XHJcbiAgICBuYW1lSW5wdXQub24oXCJjaGFuZ2VcIix2YWx1ZUNoYW5nZSlcclxuICAgIHZhciBzdHI9ZHRkbE9ialtcImRpc3BsYXlOYW1lXCJdXHJcbiAgICBpZihzdHIhPVwiXCIgJiYgc3RyIT1udWxsKSBuYW1lSW5wdXQudmFsKHN0cilcclxufSIsImNvbnN0IG1vZGVsQW5hbHl6ZXI9cmVxdWlyZShcIi4vbW9kZWxBbmFseXplclwiKVxyXG5jb25zdCBzaW1wbGVUcmVlPSByZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvc2ltcGxlVHJlZVwiKVxyXG5jb25zdCBzaW1wbGVDb25maXJtRGlhbG9nID0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL3NpbXBsZUNvbmZpcm1EaWFsb2dcIilcclxuY29uc3QgbW9kZWxFZGl0b3JEaWFsb2cgPSByZXF1aXJlKFwiLi9tb2RlbEVkaXRvckRpYWxvZ1wiKVxyXG5jb25zdCBnbG9iYWxDYWNoZSA9IHJlcXVpcmUoXCIuL2dsb2JhbENhY2hlXCIpXHJcbmNvbnN0IG1zYWxIZWxwZXI9cmVxdWlyZShcIi4uL21zYWxIZWxwZXJcIilcclxuXHJcbmZ1bmN0aW9uIG1vZGVsTWFuYWdlckRpYWxvZygpIHtcclxuICAgIGlmKCF0aGlzLkRPTSl7XHJcbiAgICAgICAgdGhpcy5ET00gPSAkKCc8ZGl2IHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dG9wOjUwJTtiYWNrZ3JvdW5kLWNvbG9yOndoaXRlO2xlZnQ6NTAlO3RyYW5zZm9ybTogdHJhbnNsYXRlWCgtNTAlKSB0cmFuc2xhdGVZKC01MCUpO3otaW5kZXg6OTlcIiBjbGFzcz1cInczLWNhcmQtMlwiPjwvZGl2PicpXHJcbiAgICAgICAgdGhpcy5ET00uY3NzKFwib3ZlcmZsb3dcIixcImhpZGRlblwiKVxyXG4gICAgICAgICQoXCJib2R5XCIpLmFwcGVuZCh0aGlzLkRPTSlcclxuICAgICAgICB0aGlzLkRPTS5oaWRlKClcclxuICAgIH1cclxufVxyXG5cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUucG9wdXAgPSBhc3luYyBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMuRE9NLnNob3coKVxyXG4gICAgdGhpcy5ET00uZW1wdHkoKVxyXG4gICAgdGhpcy5jb250ZW50RE9NID0gJCgnPGRpdiBzdHlsZT1cIndpZHRoOjY1MHB4XCI+PC9kaXY+JylcclxuICAgIHRoaXMuRE9NLmFwcGVuZCh0aGlzLmNvbnRlbnRET00pXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6NDBweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiZm9udC1zaXplOjEuNWVtXCI+RGlnaXRhbCBUd2luIE1vZGVsczwvZGl2PjwvZGl2PicpKVxyXG4gICAgdmFyIGNsb3NlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yaWdodFwiIHN0eWxlPVwiZm9udC1zaXplOjJlbTtwYWRkaW5nLXRvcDo0cHhcIj7DlzwvYnV0dG9uPicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZChjbG9zZUJ1dHRvbilcclxuICAgIGNsb3NlQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLkRPTS5oaWRlKCkgfSlcclxuXHJcbiAgICB2YXIgaW1wb3J0TW9kZWxzQnRuID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1jYXJkIHczLWRlZXAtb3JhbmdlIHczLWhvdmVyLWxpZ2h0LWdyZWVuXCIgc3R5bGU9XCJoZWlnaHQ6MTAwJVwiPkltcG9ydDwvYnV0dG9uPicpXHJcbiAgICB2YXIgYWN0dWFsSW1wb3J0TW9kZWxzQnRuID0kKCc8aW5wdXQgdHlwZT1cImZpbGVcIiBuYW1lPVwibW9kZWxGaWxlc1wiIG11bHRpcGxlPVwibXVsdGlwbGVcIiBzdHlsZT1cImRpc3BsYXk6bm9uZVwiPjwvaW5wdXQ+JylcclxuICAgIHZhciBtb2RlbEVkaXRvckJ0biA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtY2FyZCB3My1kZWVwLW9yYW5nZSB3My1ob3Zlci1saWdodC1ncmVlblwiIHN0eWxlPVwiaGVpZ2h0OjEwMCVcIj5DcmVhdGUgTW9kZWw8L2J1dHRvbj4nKVxyXG4gICAgdmFyIGV4cG9ydE1vZGVsQnRuID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1jYXJkIHczLWRlZXAtb3JhbmdlIHczLWhvdmVyLWxpZ2h0LWdyZWVuXCIgc3R5bGU9XCJoZWlnaHQ6MTAwJVwiPkV4cG9ydCBBbGwgTW9kZWxzPC9idXR0b24+JylcclxuICAgIHRoaXMuY29udGVudERPTS5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKGltcG9ydE1vZGVsc0J0bixhY3R1YWxJbXBvcnRNb2RlbHNCdG4sIG1vZGVsRWRpdG9yQnRuLGV4cG9ydE1vZGVsQnRuKVxyXG4gICAgaW1wb3J0TW9kZWxzQnRuLm9uKFwiY2xpY2tcIiwgKCk9PntcclxuICAgICAgICBhY3R1YWxJbXBvcnRNb2RlbHNCdG4udHJpZ2dlcignY2xpY2snKTtcclxuICAgIH0pO1xyXG4gICAgYWN0dWFsSW1wb3J0TW9kZWxzQnRuLmNoYW5nZShhc3luYyAoZXZ0KT0+e1xyXG4gICAgICAgIHZhciBmaWxlcyA9IGV2dC50YXJnZXQuZmlsZXM7IC8vIEZpbGVMaXN0IG9iamVjdFxyXG4gICAgICAgIGF3YWl0IHRoaXMucmVhZE1vZGVsRmlsZXNDb250ZW50QW5kSW1wb3J0KGZpbGVzKVxyXG4gICAgICAgIGFjdHVhbEltcG9ydE1vZGVsc0J0bi52YWwoXCJcIilcclxuICAgIH0pXHJcbiAgICBtb2RlbEVkaXRvckJ0bi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICB0aGlzLkRPTS5oaWRlKClcclxuICAgICAgICBtb2RlbEVkaXRvckRpYWxvZy5wb3B1cCgpXHJcbiAgICB9KVxyXG4gICAgZXhwb3J0TW9kZWxCdG4ub24oXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgICAgdmFyIG1vZGVsQXJyPVtdXHJcbiAgICAgICAgZm9yKHZhciBtb2RlbElEIGluIG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVscykgbW9kZWxBcnIucHVzaChKU09OLnBhcnNlKG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXVtcIm9yaWdpbmFsXCJdKSlcclxuICAgICAgICB2YXIgcG9tID0gJChcIjxhPjwvYT5cIilcclxuICAgICAgICBwb20uYXR0cignaHJlZicsICdkYXRhOnRleHQvcGxhaW47Y2hhcnNldD11dGYtOCwnICsgZW5jb2RlVVJJQ29tcG9uZW50KEpTT04uc3RyaW5naWZ5KG1vZGVsQXJyKSkpO1xyXG4gICAgICAgIHBvbS5hdHRyKCdkb3dubG9hZCcsIFwiZXhwb3J0TW9kZWxzLmpzb25cIik7XHJcbiAgICAgICAgcG9tWzBdLmNsaWNrKClcclxuICAgIH0pXHJcblxyXG4gICAgdmFyIHJvdzI9JCgnPGRpdiBjbGFzcz1cInczLWNlbGwtcm93XCIgc3R5bGU9XCJtYXJnaW4tdG9wOjJweFwiPjwvZGl2PicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKHJvdzIpXHJcbiAgICB2YXIgbGVmdFNwYW49JCgnPGRpdiBjbGFzcz1cInczLWNlbGxcIiBzdHlsZT1cIndpZHRoOjI0MHB4O3BhZGRpbmctcmlnaHQ6NXB4XCI+PC9kaXY+JylcclxuICAgIHJvdzIuYXBwZW5kKGxlZnRTcGFuKVxyXG4gICAgbGVmdFNwYW4uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6MzBweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiXCI+TW9kZWxzPC9kaXY+PC9kaXY+JykpXHJcbiAgICBcclxuICAgIHZhciBtb2RlbExpc3QgPSAkKCc8dWwgY2xhc3M9XCJ3My11bCB3My1ob3ZlcmFibGVcIj4nKVxyXG4gICAgbW9kZWxMaXN0LmNzcyh7XCJvdmVyZmxvdy14XCI6XCJoaWRkZW5cIixcIm92ZXJmbG93LXlcIjpcImF1dG9cIixcImhlaWdodFwiOlwiNDIwcHhcIiwgXCJib3JkZXJcIjpcInNvbGlkIDFweCBsaWdodGdyYXlcIn0pXHJcbiAgICBsZWZ0U3Bhbi5hcHBlbmQobW9kZWxMaXN0KVxyXG4gICAgdGhpcy5tb2RlbExpc3QgPSBtb2RlbExpc3Q7XHJcbiAgICBcclxuICAgIHZhciByaWdodFNwYW49JCgnPGRpdiBjbGFzcz1cInczLWNvbnRhaW5lciB3My1jZWxsXCIgc3R5bGU9XCJwYWRkaW5nOjBweFwiPjwvZGl2PicpXHJcbiAgICByb3cyLmFwcGVuZChyaWdodFNwYW4pIFxyXG4gICAgdmFyIHBhbmVsQ2FyZE91dD0kKCc8ZGl2IGNsYXNzPVwidzMtY2FyZC0yIHczLXdoaXRlXCIgc3R5bGU9XCJtYXJnaW4tdG9wOjJweFwiPjwvZGl2PicpXHJcblxyXG4gICAgdGhpcy5tb2RlbEJ1dHRvbkJhcj0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCIgc3R5bGU9XCJoZWlnaHQ6MzVweFwiPjwvZGl2PicpXHJcbiAgICBwYW5lbENhcmRPdXQuYXBwZW5kKHRoaXMubW9kZWxCdXR0b25CYXIpXHJcblxyXG4gICAgcmlnaHRTcGFuLmFwcGVuZChwYW5lbENhcmRPdXQpXHJcbiAgICB2YXIgcGFuZWxDYXJkPSQoJzxkaXYgc3R5bGU9XCJ3aWR0aDo0MTBweDtoZWlnaHQ6NDEycHg7b3ZlcmZsb3c6YXV0bzttYXJnaW4tdG9wOjJweFwiPjwvZGl2PicpXHJcbiAgICBwYW5lbENhcmRPdXQuYXBwZW5kKHBhbmVsQ2FyZClcclxuICAgIHRoaXMucGFuZWxDYXJkPXBhbmVsQ2FyZDtcclxuXHJcbiAgICB0aGlzLm1vZGVsQnV0dG9uQmFyLmVtcHR5KClcclxuICAgIHBhbmVsQ2FyZC5odG1sKFwiPGEgc3R5bGU9J2Rpc3BsYXk6YmxvY2s7Zm9udC1zdHlsZTppdGFsaWM7Y29sb3I6Z3JheTtwYWRkaW5nLWxlZnQ6NXB4Jz5DaG9vc2UgYSBtb2RlbCB0byB2aWV3IGluZm9tcmF0aW9uPC9hPlwiKVxyXG5cclxuICAgIHRoaXMubGlzdE1vZGVscygpXHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUucmVzaXplSW1nRmlsZSA9IGFzeW5jIGZ1bmN0aW9uKHRoZUZpbGUsbWF4X3NpemUpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XHJcbiAgICAgICAgICAgIHZhciB0bXBJbWcgPSBuZXcgSW1hZ2UoKTtcclxuICAgICAgICAgICAgcmVhZGVyLm9ubG9hZCA9ICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRtcEltZy5vbmxvYWQgPSAgKCk9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHdpZHRoID0gdG1wSW1nLndpZHRoXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGhlaWdodCA9IHRtcEltZy5oZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHdpZHRoID4gaGVpZ2h0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3aWR0aCA+IG1heF9zaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQgKj0gbWF4X3NpemUgLyB3aWR0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoID0gbWF4X3NpemU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGVpZ2h0ID4gbWF4X3NpemUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoICo9IG1heF9zaXplIC8gaGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ID0gbWF4X3NpemU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgY2FudmFzLndpZHRoID0gd2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FudmFzLmhlaWdodCA9IGhlaWdodDtcclxuICAgICAgICAgICAgICAgICAgICBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKS5kcmF3SW1hZ2UodG1wSW1nLCAwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZGF0YVVybCA9IGNhbnZhcy50b0RhdGFVUkwoJ2ltYWdlL3BuZycpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZGF0YVVybClcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRtcEltZy5zcmMgPSByZWFkZXIucmVzdWx0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKHRoZUZpbGUpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgcmVqZWN0KGUpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5maWxsUmlnaHRTcGFuPWFzeW5jIGZ1bmN0aW9uKG1vZGVsSUQpe1xyXG4gICAgdGhpcy5wYW5lbENhcmQuZW1wdHkoKVxyXG4gICAgdGhpcy5tb2RlbEJ1dHRvbkJhci5lbXB0eSgpXHJcblxyXG4gICAgdmFyIGRlbEJ0biA9ICQoJzxidXR0b24gc3R5bGU9XCJtYXJnaW4tYm90dG9tOjJweFwiIGNsYXNzPVwidzMtYnV0dG9uIHczLWxpZ2h0LWdyYXkgdzMtaG92ZXItcGluayB3My1ib3JkZXItcmlnaHRcIj5EZWxldGUgTW9kZWw8L2J1dHRvbj4nKVxyXG4gICAgdmFyIGltcG9ydFBpY0J0biA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtbGlnaHQtZ3JheSB3My1ob3Zlci1hbWJlciB3My1ib3JkZXItcmlnaHRcIj5VcGxvYWQgQXZhcnRhPC9idXR0b24+JylcclxuICAgIHZhciBhY3R1YWxJbXBvcnRQaWNCdG4gPSQoJzxpbnB1dCB0eXBlPVwiZmlsZVwiIG5hbWU9XCJpbWdcIiBzdHlsZT1cImRpc3BsYXk6bm9uZVwiPjwvaW5wdXQ+JylcclxuICAgIHZhciBjbGVhckF2YXJ0YUJ0biA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtbGlnaHQtZ3JheSB3My1ob3Zlci1waW5rIHczLWJvcmRlci1yaWdodFwiPkNsZWFyIEF2YXJ0YTwvYnV0dG9uPicpXHJcbiAgICB0aGlzLm1vZGVsQnV0dG9uQmFyLmFwcGVuZChkZWxCdG4saW1wb3J0UGljQnRuLGFjdHVhbEltcG9ydFBpY0J0bixjbGVhckF2YXJ0YUJ0bilcclxuXHJcbiAgICBpbXBvcnRQaWNCdG4ub24oXCJjbGlja1wiLCAoKT0+e1xyXG4gICAgICAgIGFjdHVhbEltcG9ydFBpY0J0bi50cmlnZ2VyKCdjbGljaycpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgYWN0dWFsSW1wb3J0UGljQnRuLmNoYW5nZShhc3luYyAoZXZ0KT0+e1xyXG4gICAgICAgIHZhciBmaWxlcyA9IGV2dC50YXJnZXQuZmlsZXM7IC8vIEZpbGVMaXN0IG9iamVjdFxyXG4gICAgICAgIHZhciB0aGVGaWxlPWZpbGVzWzBdXHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYodGhlRmlsZS50eXBlPT1cImltYWdlL3N2Zyt4bWxcIil7XHJcbiAgICAgICAgICAgIHZhciBzdHI9IGF3YWl0IHRoaXMucmVhZE9uZUZpbGUodGhlRmlsZSlcclxuICAgICAgICAgICAgdmFyIGRhdGFVcmw9J2RhdGE6aW1hZ2Uvc3ZnK3htbDt1dGY4LCcgKyBlbmNvZGVVUklDb21wb25lbnQoc3RyKTtcclxuICAgICAgICB9ZWxzZSBpZih0aGVGaWxlLnR5cGUubWF0Y2goJ2ltYWdlLionKSl7XHJcbiAgICAgICAgICAgIHZhciBkYXRhVXJsPSBhd2FpdCB0aGlzLnJlc2l6ZUltZ0ZpbGUodGhlRmlsZSw3MClcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB2YXIgY29uZmlybURpYWxvZ0Rpdj1uZXcgc2ltcGxlQ29uZmlybURpYWxvZygpXHJcbiAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuc2hvdyh7IHdpZHRoOiBcIjIwMHB4XCIgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogXCJOb3RlXCJcclxuICAgICAgICAgICAgICAgICAgICAsIGNvbnRlbnQ6IFwiUGxlYXNlIGltcG9ydCBpbWFnZSBmaWxlIChwbmcsanBnLHN2ZyBhbmQgc28gb24pXCJcclxuICAgICAgICAgICAgICAgICAgICAsIGJ1dHRvbnM6IFt7Y29sb3JDbGFzczpcInczLWdyYXlcIix0ZXh0OlwiT2tcIixcImNsaWNrRnVuY1wiOigpPT57Y29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpfX1dXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIClcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYodGhpcy5hdmFydGFJbWcpIHRoaXMuYXZhcnRhSW1nLmF0dHIoXCJzcmNcIixkYXRhVXJsKVxyXG5cclxuICAgICAgICB2YXIgdmlzdWFsSnNvbj1nbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW1wiZGVmYXVsdFwiXVxyXG4gICAgICAgIGlmKCF2aXN1YWxKc29uW21vZGVsSURdKSB2aXN1YWxKc29uW21vZGVsSURdPXt9XHJcbiAgICAgICAgdmlzdWFsSnNvblttb2RlbElEXS5hdmFydGE9ZGF0YVVybFxyXG4gICAgICAgIHRoaXMuc2F2ZVZpc3VhbERlZmluaXRpb24oKVxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIiwgXCJtb2RlbElEXCI6bW9kZWxJRCxcImF2YXJ0YVwiOmRhdGFVcmwgfSlcclxuICAgICAgICB0aGlzLnJlZnJlc2hNb2RlbFRyZWVMYWJlbCgpXHJcbiAgICAgICAgYWN0dWFsSW1wb3J0UGljQnRuLnZhbChcIlwiKVxyXG4gICAgfSlcclxuXHJcbiAgICBjbGVhckF2YXJ0YUJ0bi5vbihcImNsaWNrXCIsICgpPT57XHJcbiAgICAgICAgdmFyIHZpc3VhbEpzb249Z2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltcImRlZmF1bHRcIl1cclxuICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdKSBkZWxldGUgdmlzdWFsSnNvblttb2RlbElEXS5hdmFydGEgXHJcbiAgICAgICAgaWYodGhpcy5hdmFydGFJbWcpIHRoaXMuYXZhcnRhSW1nLnJlbW92ZUF0dHIoJ3NyYycpO1xyXG4gICAgICAgIHRoaXMuc2F2ZVZpc3VhbERlZmluaXRpb24oKVxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIiwgXCJtb2RlbElEXCI6bW9kZWxJRCxcIm5vQXZhcnRhXCI6dHJ1ZSB9KVxyXG4gICAgICAgIHRoaXMucmVmcmVzaE1vZGVsVHJlZUxhYmVsKClcclxuICAgIH0pO1xyXG5cclxuXHJcbiAgICBkZWxCdG4ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgdmFyIGNvbmZpcm1EaWFsb2dEaXYgPSBuZXcgc2ltcGxlQ29uZmlybURpYWxvZygpXHJcblxyXG4gICAgICAgIC8vY2hlY2sgaG93IG1hbnkgdHdpbnMgYXJlIHVuZGVyIHRoaXMgbW9kZWwgSURcclxuICAgICAgICB2YXIgbnVtYmVyT2ZUd2lucz0wXHJcbiAgICAgICAgZ2xvYmFsQ2FjaGUuREJUd2luc0Fyci5mb3JFYWNoKG9uZURCVHdpbj0+e1xyXG4gICAgICAgICAgICBpZihvbmVEQlR3aW5bXCJtb2RlbElEXCJdPT1tb2RlbElEKSBudW1iZXJPZlR3aW5zKytcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICB2YXIgY29udGVudFN0cj1cIlRoaXMgd2lsbCBERUxFVEUgbW9kZWwgXFxcIlwiICsgbW9kZWxJRCArIFwiXFxcIi4gXCJcclxuICAgICAgICBjb250ZW50U3RyKz1cIihUaGVyZSBcIisoKG51bWJlck9mVHdpbnM+MSk/KFwiYXJlIFwiK251bWJlck9mVHdpbnMrXCIgdHdpbnNcIik6KFwiaXMgXCIrbnVtYmVyT2ZUd2lucytcIiB0d2luXCIpICkgKyBcIiBvZiB0aGlzIG1vZGVsLlwiXHJcbiAgICAgICAgaWYobnVtYmVyT2ZUd2lucz4wKSBjb250ZW50U3RyKz1cIiBZb3UgbWF5IHN0aWxsIGRlbGV0ZSB0aGUgbW9kZWwsIGJ1dCBwbGVhc2UgaW1wb3J0IGEgbW9kZWwgd2l0aCB0aGlzIG1vZGVsSUQgdG8gZW5zdXJlIG5vcm1hbCBvcGVyYXRpb24pXCJcclxuICAgICAgICBlbHNlIGNvbnRlbnRTdHIrPVwiKVwiXHJcbiAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5zaG93KFxyXG4gICAgICAgICAgICB7IHdpZHRoOiBcIjM1MHB4XCIgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdGl0bGU6IFwiV2FybmluZ1wiXHJcbiAgICAgICAgICAgICAgICAsIGNvbnRlbnQ6IGNvbnRlbnRTdHJcclxuICAgICAgICAgICAgICAgICwgYnV0dG9uczogW1xyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1yZWQgdzMtaG92ZXItcGlua1wiLCB0ZXh0OiBcIkNvbmZpcm1cIiwgXCJjbGlja0Z1bmNcIjogYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2RlbGV0ZU1vZGVsXCIsIFwiUE9TVFwiLCB7IFwibW9kZWxcIjogbW9kZWxJRCB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRyZWUuZGVsZXRlTGVhZk5vZGUoZ2xvYmFsQ2FjaGUubW9kZWxJRE1hcFRvTmFtZVttb2RlbElEXSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJBRFRNb2RlbHNDaGFuZ2VcIn0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5wYW5lbENhcmQuZW1wdHkoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vVE9ETzogY2xlYXIgdGhlIHZpc3VhbGl6YXRpb24gc2V0dGluZyBvZiB0aGlzIGRlbGV0ZWQgbW9kZWxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvKlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW1wiZGVmYXVsdFwiXVttb2RlbElEXSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgZ2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltcImRlZmF1bHRcIl1bbW9kZWxJRF1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zYXZlVmlzdWFsRGVmaW5pdGlvbigpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSovXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9ICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1ncmF5XCIsIHRleHQ6IFwiQ2FuY2VsXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgKVxyXG4gICAgICAgIFxyXG4gICAgfSlcclxuICAgIFxyXG4gICAgdmFyIFZpc3VhbGl6YXRpb25ET009dGhpcy5hZGRBUGFydEluUmlnaHRTcGFuKFwiVmlzdWFsaXphdGlvblwiKVxyXG4gICAgdmFyIGVkaXRhYmxlUHJvcGVydGllc0RPTT10aGlzLmFkZEFQYXJ0SW5SaWdodFNwYW4oXCJFZGl0YWJsZSBQcm9wZXJ0aWVzIEFuZCBSZWxhdGlvbnNoaXBzXCIpXHJcbiAgICB2YXIgYmFzZUNsYXNzZXNET009dGhpcy5hZGRBUGFydEluUmlnaHRTcGFuKFwiQmFzZSBDbGFzc2VzXCIpXHJcbiAgICB2YXIgb3JpZ2luYWxEZWZpbml0aW9uRE9NPXRoaXMuYWRkQVBhcnRJblJpZ2h0U3BhbihcIk9yaWdpbmFsIERlZmluaXRpb25cIilcclxuXHJcbiAgICB2YXIgc3RyPUpTT04uc3RyaW5naWZ5KEpTT04ucGFyc2UobW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdW1wib3JpZ2luYWxcIl0pLG51bGwsMilcclxuICAgIG9yaWdpbmFsRGVmaW5pdGlvbkRPTS5hcHBlbmQoJCgnPHByZSBpZD1cImpzb25cIj4nK3N0cisnPC9wcmU+JykpXHJcblxyXG4gICAgdmFyIGVkaXR0YWJsZVByb3BlcnRpZXM9bW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdLmVkaXRhYmxlUHJvcGVydGllc1xyXG4gICAgdGhpcy5maWxsRWRpdGFibGVQcm9wZXJ0aWVzKGVkaXR0YWJsZVByb3BlcnRpZXMsZWRpdGFibGVQcm9wZXJ0aWVzRE9NKVxyXG4gICAgdmFyIHZhbGlkUmVsYXRpb25zaGlwcz1tb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF0udmFsaWRSZWxhdGlvbnNoaXBzXHJcbiAgICB0aGlzLmZpbGxSZWxhdGlvbnNoaXBJbmZvKHZhbGlkUmVsYXRpb25zaGlwcyxlZGl0YWJsZVByb3BlcnRpZXNET00pXHJcblxyXG4gICAgdGhpcy5maWxsVmlzdWFsaXphdGlvbihtb2RlbElELFZpc3VhbGl6YXRpb25ET00pXHJcblxyXG4gICAgdGhpcy5maWxsQmFzZUNsYXNzZXMobW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdLmFsbEJhc2VDbGFzc2VzLGJhc2VDbGFzc2VzRE9NKSBcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5yZWZyZXNoTW9kZWxUcmVlTGFiZWw9ZnVuY3Rpb24oKXtcclxuICAgIGlmKHRoaXMudHJlZS5zZWxlY3RlZE5vZGVzLmxlbmd0aD4wKSB0aGlzLnRyZWUuc2VsZWN0ZWROb2Rlc1swXS5yZWRyYXdMYWJlbCgpXHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuZmlsbEJhc2VDbGFzc2VzPWZ1bmN0aW9uKGJhc2VDbGFzc2VzLHBhcmVudERvbSl7XHJcbiAgICBmb3IodmFyIGluZCBpbiBiYXNlQ2xhc3Nlcyl7XHJcbiAgICAgICAgdmFyIGtleURpdj0gJChcIjxsYWJlbCBzdHlsZT0nZGlzcGxheTpibG9jaztwYWRkaW5nOi4xZW0nPlwiK2luZCtcIjwvbGFiZWw+XCIpXHJcbiAgICAgICAgcGFyZW50RG9tLmFwcGVuZChrZXlEaXYpXHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuZmlsbFZpc3VhbGl6YXRpb249ZnVuY3Rpb24obW9kZWxJRCxwYXJlbnREb20pe1xyXG4gICAgdmFyIG1vZGVsSnNvbj1tb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF07XHJcbiAgICB2YXIgYVRhYmxlPSQoXCI8dGFibGUgc3R5bGU9J3dpZHRoOjEwMCUnPjwvdGFibGU+XCIpXHJcbiAgICBhVGFibGUuaHRtbCgnPHRyPjx0ZD48L3RkPjx0ZD48L3RkPjwvdHI+JylcclxuICAgIHBhcmVudERvbS5hcHBlbmQoYVRhYmxlKSBcclxuXHJcbiAgICB2YXIgbGVmdFBhcnQ9YVRhYmxlLmZpbmQoXCJ0ZDpmaXJzdFwiKVxyXG4gICAgdmFyIHJpZ2h0UGFydD1hVGFibGUuZmluZChcInRkOm50aC1jaGlsZCgyKVwiKVxyXG4gICAgcmlnaHRQYXJ0LmNzcyh7XCJ3aWR0aFwiOlwiNTBweFwiLFwiaGVpZ2h0XCI6XCI1MHB4XCIsXCJib3JkZXJcIjpcInNvbGlkIDFweCBsaWdodEdyYXlcIn0pXHJcbiAgICBcclxuICAgIHZhciBhdmFydGFJbWc9JChcIjxpbWcgc3R5bGU9J2hlaWdodDo0NXB4Jz48L2ltZz5cIilcclxuICAgIHJpZ2h0UGFydC5hcHBlbmQoYXZhcnRhSW1nKVxyXG4gICAgdmFyIHZpc3VhbEpzb249Z2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltcImRlZmF1bHRcIl1cclxuICAgIGlmKHZpc3VhbEpzb24gJiYgdmlzdWFsSnNvblttb2RlbElEXSAmJiB2aXN1YWxKc29uW21vZGVsSURdLmF2YXJ0YSkgYXZhcnRhSW1nLmF0dHIoJ3NyYycsdmlzdWFsSnNvblttb2RlbElEXS5hdmFydGEpXHJcbiAgICB0aGlzLmF2YXJ0YUltZz1hdmFydGFJbWc7XHJcblxyXG4gICAgXHJcbiAgICB0aGlzLmFkZE9uZVZpc3VhbGl6YXRpb25Sb3cobW9kZWxJRCxsZWZ0UGFydClcclxuICAgIGZvcih2YXIgaW5kIGluIG1vZGVsSnNvbi52YWxpZFJlbGF0aW9uc2hpcHMpe1xyXG4gICAgICAgIHRoaXMuYWRkT25lVmlzdWFsaXphdGlvblJvdyhtb2RlbElELGxlZnRQYXJ0LGluZClcclxuICAgIH1cclxufVxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLmFkZE9uZVZpc3VhbGl6YXRpb25Sb3c9ZnVuY3Rpb24obW9kZWxJRCxwYXJlbnREb20scmVsYXRpbnNoaXBOYW1lKXtcclxuICAgIGlmKHJlbGF0aW5zaGlwTmFtZT09bnVsbCkgdmFyIG5hbWVTdHI9XCLil69cIiAvL3Zpc3VhbCBmb3Igbm9kZVxyXG4gICAgZWxzZSBuYW1lU3RyPVwi4p+cIFwiK3JlbGF0aW5zaGlwTmFtZVxyXG4gICAgdmFyIGNvbnRhaW5lckRpdj0kKFwiPGRpdiBzdHlsZT0ncGFkZGluZy1ib3R0b206OHB4Jz48L2Rpdj5cIilcclxuICAgIHBhcmVudERvbS5hcHBlbmQoY29udGFpbmVyRGl2KVxyXG4gICAgdmFyIGNvbnRlbnRET009JChcIjxsYWJlbCBzdHlsZT0nbWFyZ2luLXJpZ2h0OjEwcHgnPlwiK25hbWVTdHIrXCI8L2xhYmVsPlwiKVxyXG4gICAgY29udGFpbmVyRGl2LmFwcGVuZChjb250ZW50RE9NKVxyXG5cclxuICAgIHZhciBkZWZpbmVkQ29sb3I9bnVsbFxyXG4gICAgdmFyIGRlZmluZWRTaGFwZT1udWxsXHJcbiAgICB2YXIgZGVmaW5lZERpbWVuc2lvblJhdGlvPW51bGxcclxuICAgIHZhciBkZWZpbmVkRWRnZVdpZHRoPW51bGxcclxuICAgIHZhciB2aXN1YWxKc29uPWdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdXHJcbiAgICBpZihyZWxhdGluc2hpcE5hbWU9PW51bGwpe1xyXG4gICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF0gJiYgdmlzdWFsSnNvblttb2RlbElEXS5jb2xvcikgZGVmaW5lZENvbG9yPXZpc3VhbEpzb25bbW9kZWxJRF0uY29sb3JcclxuICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdICYmIHZpc3VhbEpzb25bbW9kZWxJRF0uc2hhcGUpIGRlZmluZWRTaGFwZT12aXN1YWxKc29uW21vZGVsSURdLnNoYXBlXHJcbiAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXSAmJiB2aXN1YWxKc29uW21vZGVsSURdLmRpbWVuc2lvblJhdGlvKSBkZWZpbmVkRGltZW5zaW9uUmF0aW89dmlzdWFsSnNvblttb2RlbElEXS5kaW1lbnNpb25SYXRpb1xyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgaWYgKHZpc3VhbEpzb25bbW9kZWxJRF0gJiYgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl0gJiYgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXSkge1xyXG4gICAgICAgICAgICBpZiAodmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXS5jb2xvcikgZGVmaW5lZENvbG9yID0gdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXS5jb2xvclxyXG4gICAgICAgICAgICBpZiAodmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXS5zaGFwZSkgZGVmaW5lZFNoYXBlID0gdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXS5zaGFwZVxyXG4gICAgICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdLmVkZ2VXaWR0aCkgZGVmaW5lZEVkZ2VXaWR0aD12aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdLmVkZ2VXaWR0aFxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB2YXIgY29sb3JTZWxlY3Rvcj0kKCc8c2VsZWN0IGNsYXNzPVwidzMtYm9yZGVyXCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7d2lkdGg6NzVweFwiPjwvc2VsZWN0PicpXHJcbiAgICBjb250YWluZXJEaXYuYXBwZW5kKGNvbG9yU2VsZWN0b3IpXHJcbiAgICB2YXIgY29sb3JBcnI9W1wiQmxhY2tcIixcIkxpZ2h0R3JheVwiLFwiUmVkXCIsXCJHcmVlblwiLFwiQmx1ZVwiLFwiQmlzcXVlXCIsXCJCcm93blwiLFwiQ29yYWxcIixcIkNyaW1zb25cIixcIkRvZGdlckJsdWVcIixcIkdvbGRcIl1cclxuICAgIGNvbG9yQXJyLmZvckVhY2goKG9uZUNvbG9yQ29kZSk9PntcclxuICAgICAgICB2YXIgYW5PcHRpb249JChcIjxvcHRpb24gdmFsdWU9J1wiK29uZUNvbG9yQ29kZStcIic+XCIrb25lQ29sb3JDb2RlK1wi4panPC9vcHRpb24+XCIpXHJcbiAgICAgICAgY29sb3JTZWxlY3Rvci5hcHBlbmQoYW5PcHRpb24pXHJcbiAgICAgICAgYW5PcHRpb24uY3NzKFwiY29sb3JcIixvbmVDb2xvckNvZGUpXHJcbiAgICB9KVxyXG4gICAgaWYoZGVmaW5lZENvbG9yIT1udWxsKSB7XHJcbiAgICAgICAgY29sb3JTZWxlY3Rvci52YWwoZGVmaW5lZENvbG9yKVxyXG4gICAgICAgIGNvbG9yU2VsZWN0b3IuY3NzKFwiY29sb3JcIixkZWZpbmVkQ29sb3IpXHJcbiAgICB9XHJcbiAgICBjb2xvclNlbGVjdG9yLmNoYW5nZSgoZXZlKT0+e1xyXG4gICAgICAgIHZhciBzZWxlY3RDb2xvckNvZGU9ZXZlLnRhcmdldC52YWx1ZVxyXG4gICAgICAgIGNvbG9yU2VsZWN0b3IuY3NzKFwiY29sb3JcIixzZWxlY3RDb2xvckNvZGUpXHJcbiAgICAgICAgdmFyIHZpc3VhbEpzb249Z2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltcImRlZmF1bHRcIl1cclxuXHJcbiAgICAgICAgaWYoIXZpc3VhbEpzb25bbW9kZWxJRF0pIHZpc3VhbEpzb25bbW9kZWxJRF09e31cclxuICAgICAgICBpZighcmVsYXRpbnNoaXBOYW1lKSB7XHJcbiAgICAgICAgICAgIHZpc3VhbEpzb25bbW9kZWxJRF0uY29sb3I9c2VsZWN0Q29sb3JDb2RlXHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIiwgXCJtb2RlbElEXCI6bW9kZWxJRCxcImNvbG9yXCI6c2VsZWN0Q29sb3JDb2RlIH0pXHJcbiAgICAgICAgICAgIHRoaXMucmVmcmVzaE1vZGVsVHJlZUxhYmVsKClcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgaWYoIXZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdKSB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXT17fVxyXG4gICAgICAgICAgICBpZighdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXSkgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXT17fVxyXG4gICAgICAgICAgICB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdLmNvbG9yPXNlbGVjdENvbG9yQ29kZVxyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJ2aXN1YWxEZWZpbml0aW9uQ2hhbmdlXCIsIFwic3JjTW9kZWxJRFwiOm1vZGVsSUQsXCJyZWxhdGlvbnNoaXBOYW1lXCI6cmVsYXRpbnNoaXBOYW1lLFwiY29sb3JcIjpzZWxlY3RDb2xvckNvZGUgfSlcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zYXZlVmlzdWFsRGVmaW5pdGlvbigpXHJcbiAgICB9KVxyXG4gICAgdmFyIHNoYXBlU2VsZWN0b3IgPSAkKCc8c2VsZWN0IGNsYXNzPVwidzMtYm9yZGVyXCIgc3R5bGU9XCJvdXRsaW5lOm5vbmVcIj48L3NlbGVjdD4nKVxyXG4gICAgY29udGFpbmVyRGl2LmFwcGVuZChzaGFwZVNlbGVjdG9yKVxyXG4gICAgaWYocmVsYXRpbnNoaXBOYW1lPT1udWxsKXtcclxuICAgICAgICBzaGFwZVNlbGVjdG9yLmFwcGVuZCgkKFwiPG9wdGlvbiB2YWx1ZT0nZWxsaXBzZSc+4pevPC9vcHRpb24+XCIpKVxyXG4gICAgICAgIHNoYXBlU2VsZWN0b3IuYXBwZW5kKCQoXCI8b3B0aW9uIHZhbHVlPSdyb3VuZC1yZWN0YW5nbGUnIHN0eWxlPSdmb250LXNpemU6MTIwJSc+4paiPC9vcHRpb24+XCIpKVxyXG4gICAgICAgIHNoYXBlU2VsZWN0b3IuYXBwZW5kKCQoXCI8b3B0aW9uIHZhbHVlPSdoZXhhZ29uJyBzdHlsZT0nZm9udC1zaXplOjEzMCUnPuKsoTwvb3B0aW9uPlwiKSlcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHNoYXBlU2VsZWN0b3IuYXBwZW5kKCQoXCI8b3B0aW9uIHZhbHVlPSdzb2xpZCc+4oaSPC9vcHRpb24+XCIpKVxyXG4gICAgICAgIHNoYXBlU2VsZWN0b3IuYXBwZW5kKCQoXCI8b3B0aW9uIHZhbHVlPSdkb3R0ZWQnPuKHojwvb3B0aW9uPlwiKSlcclxuICAgIH1cclxuICAgIGlmKGRlZmluZWRTaGFwZSE9bnVsbCkge1xyXG4gICAgICAgIHNoYXBlU2VsZWN0b3IudmFsKGRlZmluZWRTaGFwZSlcclxuICAgIH1cclxuICAgIHNoYXBlU2VsZWN0b3IuY2hhbmdlKChldmUpPT57XHJcbiAgICAgICAgdmFyIHNlbGVjdFNoYXBlPWV2ZS50YXJnZXQudmFsdWVcclxuICAgICAgICB2YXIgdmlzdWFsSnNvbiA9IGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdXHJcblxyXG4gICAgICAgIGlmKCF2aXN1YWxKc29uW21vZGVsSURdKSB2aXN1YWxKc29uW21vZGVsSURdPXt9XHJcbiAgICAgICAgaWYoIXJlbGF0aW5zaGlwTmFtZSkge1xyXG4gICAgICAgICAgICB2aXN1YWxKc29uW21vZGVsSURdLnNoYXBlPXNlbGVjdFNoYXBlXHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIiwgXCJtb2RlbElEXCI6bW9kZWxJRCxcInNoYXBlXCI6c2VsZWN0U2hhcGUgfSlcclxuICAgICAgICAgICAgdGhpcy5yZWZyZXNoTW9kZWxUcmVlTGFiZWwoKVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBpZighdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl0pIHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdPXt9XHJcbiAgICAgICAgICAgIGlmKCF2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdKSB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdPXt9XHJcbiAgICAgICAgICAgIHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0uc2hhcGU9c2VsZWN0U2hhcGVcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwidmlzdWFsRGVmaW5pdGlvbkNoYW5nZVwiLCBcInNyY01vZGVsSURcIjptb2RlbElELFwicmVsYXRpb25zaGlwTmFtZVwiOnJlbGF0aW5zaGlwTmFtZSxcInNoYXBlXCI6c2VsZWN0U2hhcGUgfSlcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zYXZlVmlzdWFsRGVmaW5pdGlvbigpXHJcbiAgICB9KVxyXG5cclxuICAgIHZhciBzaXplQWRqdXN0U2VsZWN0b3IgPSAkKCc8c2VsZWN0IGNsYXNzPVwidzMtYm9yZGVyXCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7d2lkdGg6MTEwcHhcIj48L3NlbGVjdD4nKVxyXG4gICAgaWYocmVsYXRpbnNoaXBOYW1lPT1udWxsKXtcclxuICAgICAgICBmb3IodmFyIGY9MC4yO2Y8MjtmKz0wLjIpe1xyXG4gICAgICAgICAgICB2YXIgdmFsPWYudG9GaXhlZCgxKStcIlwiXHJcbiAgICAgICAgICAgIHNpemVBZGp1c3RTZWxlY3Rvci5hcHBlbmQoJChcIjxvcHRpb24gdmFsdWU9XCIrdmFsK1wiPmRpbWVuc2lvbipcIit2YWwrXCI8L29wdGlvbj5cIikpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKGRlZmluZWREaW1lbnNpb25SYXRpbyE9bnVsbCkgc2l6ZUFkanVzdFNlbGVjdG9yLnZhbChkZWZpbmVkRGltZW5zaW9uUmF0aW8pXHJcbiAgICAgICAgZWxzZSBzaXplQWRqdXN0U2VsZWN0b3IudmFsKFwiMS4wXCIpXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICBzaXplQWRqdXN0U2VsZWN0b3IuY3NzKFwid2lkdGhcIixcIjgwcHhcIilcclxuICAgICAgICBmb3IodmFyIGY9MC41O2Y8PTQ7Zis9MC41KXtcclxuICAgICAgICAgICAgdmFyIHZhbD1mLnRvRml4ZWQoMSkrXCJcIlxyXG4gICAgICAgICAgICBzaXplQWRqdXN0U2VsZWN0b3IuYXBwZW5kKCQoXCI8b3B0aW9uIHZhbHVlPVwiK3ZhbCtcIj53aWR0aCAqXCIrdmFsK1wiPC9vcHRpb24+XCIpKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZihkZWZpbmVkRWRnZVdpZHRoIT1udWxsKSBzaXplQWRqdXN0U2VsZWN0b3IudmFsKGRlZmluZWRFZGdlV2lkdGgpXHJcbiAgICAgICAgZWxzZSBzaXplQWRqdXN0U2VsZWN0b3IudmFsKFwiMi4wXCIpXHJcbiAgICB9XHJcbiAgICBjb250YWluZXJEaXYuYXBwZW5kKHNpemVBZGp1c3RTZWxlY3RvcilcclxuXHJcbiAgICBcclxuICAgIHNpemVBZGp1c3RTZWxlY3Rvci5jaGFuZ2UoKGV2ZSk9PntcclxuICAgICAgICB2YXIgY2hvb3NlVmFsPWV2ZS50YXJnZXQudmFsdWVcclxuICAgICAgICB2YXIgdmlzdWFsSnNvbiA9IGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdXHJcblxyXG4gICAgICAgIGlmKCFyZWxhdGluc2hpcE5hbWUpIHtcclxuICAgICAgICAgICAgaWYoIXZpc3VhbEpzb25bbW9kZWxJRF0pIHZpc3VhbEpzb25bbW9kZWxJRF09e31cclxuICAgICAgICAgICAgdmlzdWFsSnNvblttb2RlbElEXS5kaW1lbnNpb25SYXRpbz1jaG9vc2VWYWxcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwidmlzdWFsRGVmaW5pdGlvbkNoYW5nZVwiLCBcIm1vZGVsSURcIjptb2RlbElELFwiZGltZW5zaW9uUmF0aW9cIjpjaG9vc2VWYWwgfSlcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgaWYoIXZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdKSB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXT17fVxyXG4gICAgICAgICAgICBpZighdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXSkgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXT17fVxyXG4gICAgICAgICAgICB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdLmVkZ2VXaWR0aD1jaG9vc2VWYWxcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwidmlzdWFsRGVmaW5pdGlvbkNoYW5nZVwiLCBcInNyY01vZGVsSURcIjptb2RlbElELFwicmVsYXRpb25zaGlwTmFtZVwiOnJlbGF0aW5zaGlwTmFtZSxcImVkZ2VXaWR0aFwiOmNob29zZVZhbCB9KVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnNhdmVWaXN1YWxEZWZpbml0aW9uKClcclxuICAgIH0pXHJcbiAgICBcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5zYXZlVmlzdWFsRGVmaW5pdGlvbj1hc3luYyBmdW5jdGlvbigpe1xyXG4gICAgdHJ5e1xyXG4gICAgICAgIGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL3NhdmVWaXN1YWxEZWZpbml0aW9uXCIsIFwiUE9TVFwiLCB7XCJ2aXN1YWxEZWZpbml0aW9uSnNvblwiOkpTT04uc3RyaW5naWZ5KGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdKX0pXHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuZmlsbFJlbGF0aW9uc2hpcEluZm89ZnVuY3Rpb24odmFsaWRSZWxhdGlvbnNoaXBzLHBhcmVudERvbSl7XHJcbiAgICBmb3IodmFyIGluZCBpbiB2YWxpZFJlbGF0aW9uc2hpcHMpe1xyXG4gICAgICAgIHZhciBrZXlEaXY9ICQoXCI8bGFiZWwgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO3BhZGRpbmc6LjFlbSAuM2VtIC4xZW0gLjNlbTttYXJnaW4tcmlnaHQ6LjNlbSc+XCIraW5kK1wiPC9sYWJlbD5cIilcclxuICAgICAgICBwYXJlbnREb20uYXBwZW5kKGtleURpdilcclxuICAgICAgICBrZXlEaXYuY3NzKFwicGFkZGluZy10b3BcIixcIi4xZW1cIilcclxuICAgICAgICB2YXIgbGFiZWw9JChcIjxsYWJlbCBzdHlsZT0nZGlzcGxheTppbmxpbmU7YmFja2dyb3VuZC1jb2xvcjp5ZWxsb3dncmVlbjtjb2xvcjp3aGl0ZTtmb250LXNpemU6OXB4O3BhZGRpbmc6MnB4Jz48L2xhYmVsPlwiKVxyXG4gICAgICAgIGxhYmVsLnRleHQoXCJSZWxhdGlvbnNoaXBcIilcclxuICAgICAgICBwYXJlbnREb20uYXBwZW5kKGxhYmVsKVxyXG4gICAgICAgIGlmKHZhbGlkUmVsYXRpb25zaGlwc1tpbmRdLnRhcmdldCl7XHJcbiAgICAgICAgICAgIHZhciBsYWJlbDE9JChcIjxsYWJlbCBzdHlsZT0nZGlzcGxheTppbmxpbmU7YmFja2dyb3VuZC1jb2xvcjp5ZWxsb3dncmVlbjtjb2xvcjp3aGl0ZTtmb250LXNpemU6OXB4O3BhZGRpbmc6MnB4O21hcmdpbi1sZWZ0OjJweCc+PC9sYWJlbD5cIilcclxuICAgICAgICAgICAgbGFiZWwxLnRleHQodmFsaWRSZWxhdGlvbnNoaXBzW2luZF0udGFyZ2V0KVxyXG4gICAgICAgICAgICBwYXJlbnREb20uYXBwZW5kKGxhYmVsMSlcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGNvbnRlbnRET009JChcIjxsYWJlbD48L2xhYmVsPlwiKVxyXG4gICAgICAgIGNvbnRlbnRET00uY3NzKFwiZGlzcGxheVwiLFwiYmxvY2tcIilcclxuICAgICAgICBjb250ZW50RE9NLmNzcyhcInBhZGRpbmctbGVmdFwiLFwiMWVtXCIpXHJcbiAgICAgICAgcGFyZW50RG9tLmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgICAgIHRoaXMuZmlsbEVkaXRhYmxlUHJvcGVydGllcyh2YWxpZFJlbGF0aW9uc2hpcHNbaW5kXS5lZGl0YWJsZVJlbGF0aW9uc2hpcFByb3BlcnRpZXMsIGNvbnRlbnRET00pXHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuZmlsbEVkaXRhYmxlUHJvcGVydGllcz1mdW5jdGlvbihqc29uSW5mbyxwYXJlbnREb20pe1xyXG4gICAgZm9yKHZhciBpbmQgaW4ganNvbkluZm8pe1xyXG4gICAgICAgIHZhciBrZXlEaXY9ICQoXCI8bGFiZWwgc3R5bGU9J2Rpc3BsYXk6YmxvY2snPjxkaXYgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO3BhZGRpbmc6LjFlbSAuM2VtIC4xZW0gLjNlbTttYXJnaW4tcmlnaHQ6LjNlbSc+XCIraW5kK1wiPC9kaXY+PC9sYWJlbD5cIilcclxuICAgICAgICBwYXJlbnREb20uYXBwZW5kKGtleURpdilcclxuICAgICAgICBrZXlEaXYuY3NzKFwicGFkZGluZy10b3BcIixcIi4xZW1cIilcclxuXHJcbiAgICAgICAgaWYoQXJyYXkuaXNBcnJheShqc29uSW5mb1tpbmRdKSl7XHJcbiAgICAgICAgICAgIHZhciBjb250ZW50RE9NPSQoXCI8bGFiZWw+PC9sYWJlbD5cIilcclxuICAgICAgICAgICAgY29udGVudERPTS50ZXh0KFwiZW51bVwiKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLmNzcyh7XCJiYWNrZ3JvdW5kLWNvbG9yXCI6XCJkYXJrR3JheVwiLFwiY29sb3JcIjpcIndoaXRlXCIsXCJmb250U2l6ZVwiOlwiOXB4XCIsXCJwYWRkaW5nXCI6JzJweCd9KVxyXG4gICAgICAgICAgICBrZXlEaXYuYXBwZW5kKGNvbnRlbnRET00pXHJcblxyXG4gICAgICAgICAgICB2YXIgdmFsdWVBcnI9W11cclxuICAgICAgICAgICAganNvbkluZm9baW5kXS5mb3JFYWNoKGVsZT0+e3ZhbHVlQXJyLnB1c2goZWxlLmVudW1WYWx1ZSl9KVxyXG4gICAgICAgICAgICB2YXIgbGFiZWwxPSQoXCI8bGFiZWw+PC9sYWJlbD5cIilcclxuICAgICAgICAgICAgbGFiZWwxLmNzcyh7XCJiYWNrZ3JvdW5kLWNvbG9yXCI6XCJkYXJrR3JheVwiLFwiY29sb3JcIjpcIndoaXRlXCIsXCJmb250U2l6ZVwiOlwiOXB4XCIsXCJwYWRkaW5nXCI6JzJweCcsXCJtYXJnaW4tbGVmdFwiOlwiMnB4XCJ9KVxyXG4gICAgICAgICAgICBsYWJlbDEudGV4dCh2YWx1ZUFyci5qb2luKCkpXHJcbiAgICAgICAgICAgIGtleURpdi5hcHBlbmQobGFiZWwxKVxyXG4gICAgICAgIH1lbHNlIGlmKHR5cGVvZihqc29uSW5mb1tpbmRdKT09PVwib2JqZWN0XCIpIHtcclxuICAgICAgICAgICAgdmFyIGNvbnRlbnRET009JChcIjxsYWJlbD48L2xhYmVsPlwiKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLmNzcyhcImRpc3BsYXlcIixcImJsb2NrXCIpXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwicGFkZGluZy1sZWZ0XCIsXCIxZW1cIilcclxuICAgICAgICAgICAgdGhpcy5maWxsRWRpdGFibGVQcm9wZXJ0aWVzKGpzb25JbmZvW2luZF0sY29udGVudERPTSlcclxuICAgICAgICAgICAga2V5RGl2LmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgICAgIH1lbHNlIHtcclxuICAgICAgICAgICAgdmFyIGNvbnRlbnRET009JChcIjxsYWJlbD48L2xhYmVsPlwiKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLnRleHQoanNvbkluZm9baW5kXSlcclxuICAgICAgICAgICAgY29udGVudERPTS5jc3Moe1wiYmFja2dyb3VuZC1jb2xvclwiOlwiZGFya0dyYXlcIixcImNvbG9yXCI6XCJ3aGl0ZVwiLFwiZm9udFNpemVcIjpcIjlweFwiLFwicGFkZGluZ1wiOicycHgnfSlcclxuICAgICAgICAgICAga2V5RGl2LmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuYWRkQVBhcnRJblJpZ2h0U3Bhbj1mdW5jdGlvbihwYXJ0TmFtZSl7XHJcbiAgICB2YXIgaGVhZGVyRE9NPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYmxvY2sgdzMtbGlnaHQtZ3JleSB3My1sZWZ0LWFsaWduXCIgc3R5bGU9XCJmb250LXdlaWdodDpib2xkXCI+PC9idXR0b24+JylcclxuICAgIGhlYWRlckRPTS50ZXh0KHBhcnROYW1lKVxyXG4gICAgdmFyIGxpc3RET009JCgnPGRpdiBjbGFzcz1cInczLWNvbnRhaW5lciB3My1oaWRlIHczLWJvcmRlciB3My1zaG93XCIgc3R5bGU9XCJiYWNrZ3JvdW5kLWNvbG9yOndoaXRlXCI+PC9kaXY+JylcclxuICAgIHRoaXMucGFuZWxDYXJkLmFwcGVuZChoZWFkZXJET00sbGlzdERPTSlcclxuXHJcbiAgICBoZWFkZXJET00ub24oXCJjbGlja1wiLChldnQpPT4ge1xyXG4gICAgICAgIGlmKGxpc3RET00uaGFzQ2xhc3MoXCJ3My1zaG93XCIpKSBsaXN0RE9NLnJlbW92ZUNsYXNzKFwidzMtc2hvd1wiKVxyXG4gICAgICAgIGVsc2UgbGlzdERPTS5hZGRDbGFzcyhcInczLXNob3dcIilcclxuIFxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICByZXR1cm4gbGlzdERPTTtcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5yZWFkTW9kZWxGaWxlc0NvbnRlbnRBbmRJbXBvcnQ9YXN5bmMgZnVuY3Rpb24oZmlsZXMpe1xyXG4gICAgLy8gZmlsZXMgaXMgYSBGaWxlTGlzdCBvZiBGaWxlIG9iamVjdHMuIExpc3Qgc29tZSBwcm9wZXJ0aWVzLlxyXG4gICAgdmFyIGZpbGVDb250ZW50QXJyPVtdXHJcbiAgICBmb3IgKHZhciBpID0gMCwgZjsgZiA9IGZpbGVzW2ldOyBpKyspIHtcclxuICAgICAgICAvLyBPbmx5IHByb2Nlc3MganNvbiBmaWxlcy5cclxuICAgICAgICBpZiAoZi50eXBlIT1cImFwcGxpY2F0aW9uL2pzb25cIikgY29udGludWU7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICB2YXIgc3RyPSBhd2FpdCB0aGlzLnJlYWRPbmVGaWxlKGYpXHJcbiAgICAgICAgICAgIHZhciBvYmo9SlNPTi5wYXJzZShzdHIpXHJcbiAgICAgICAgICAgIGlmKEFycmF5LmlzQXJyYXkob2JqKSkgZmlsZUNvbnRlbnRBcnI9ZmlsZUNvbnRlbnRBcnIuY29uY2F0KG9iailcclxuICAgICAgICAgICAgZWxzZSBmaWxlQ29udGVudEFyci5wdXNoKG9iailcclxuICAgICAgICB9Y2F0Y2goZXJyKXtcclxuICAgICAgICAgICAgYWxlcnQoZXJyKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmKGZpbGVDb250ZW50QXJyLmxlbmd0aD09MCkgcmV0dXJuO1xyXG4gICAgdHJ5IHtcclxuICAgICAgICB2YXIgcmVzcG9uc2UgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9pbXBvcnRNb2RlbHNcIiwgXCJQT1NUXCIsIHtcIm1vZGVsc1wiOkpTT04uc3RyaW5naWZ5KGZpbGVDb250ZW50QXJyKX0pXHJcbiAgICAgICAgdGhpcy5saXN0TW9kZWxzKFwic2hvdWxkQnJvYWRDYXN0XCIpXHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICB9ICBcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5yZWFkT25lRmlsZT0gYXN5bmMgZnVuY3Rpb24oYUZpbGUpe1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xyXG4gICAgICAgICAgICByZWFkZXIub25sb2FkID0gKCk9PiB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlYWRlci5yZXN1bHQpXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHJlYWRlci5yZWFkQXNUZXh0KGFGaWxlKTtcclxuICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIHJlamVjdChlKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1cclxuXHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLmxpc3RNb2RlbHM9YXN5bmMgZnVuY3Rpb24oc2hvdWxkQnJvYWRjYXN0KXtcclxuICAgIHRoaXMubW9kZWxMaXN0LmVtcHR5KClcclxuICAgIGF3YWl0IGdsb2JhbENhY2hlLmxvYWRVc2VyRGF0YSgpXHJcblxyXG4gICAgaWYoalF1ZXJ5LmlzRW1wdHlPYmplY3QobW9kZWxBbmFseXplci5EVERMTW9kZWxzKSl7XHJcbiAgICAgICAgdmFyIHplcm9Nb2RlbEl0ZW09JCgnPGxpIHN0eWxlPVwiZm9udC1zaXplOjAuOWVtXCI+emVybyBtb2RlbCByZWNvcmQuIFBsZWFzZSBpbXBvcnQuLi48L2xpPicpXHJcbiAgICAgICAgdGhpcy5tb2RlbExpc3QuYXBwZW5kKHplcm9Nb2RlbEl0ZW0pXHJcbiAgICAgICAgemVyb01vZGVsSXRlbS5jc3MoXCJjdXJzb3JcIixcImRlZmF1bHRcIilcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHRoaXMudHJlZSA9IG5ldyBzaW1wbGVUcmVlKHRoaXMubW9kZWxMaXN0LCB7XHJcbiAgICAgICAgICAgIFwibGVhZk5hbWVQcm9wZXJ0eVwiOiBcImRpc3BsYXlOYW1lXCJcclxuICAgICAgICAgICAgLCBcIm5vTXVsdGlwbGVTZWxlY3RBbGxvd2VkXCI6IHRydWUsIFwiaGlkZUVtcHR5R3JvdXBcIjogdHJ1ZVxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIHRoaXMudHJlZS5vcHRpb25zLmxlYWZOb2RlSWNvbkZ1bmMgPSAobG4pID0+IHtcclxuICAgICAgICAgICAgdmFyIG1vZGVsQ2xhc3MgPSBsbi5sZWFmSW5mb1tcIkBpZFwiXVxyXG4gICAgICAgICAgICB2YXIgY29sb3JDb2RlID0gXCJncmF5XCJcclxuICAgICAgICAgICAgdmFyIHNoYXBlID0gXCJlbGxpcHNlXCJcclxuICAgICAgICAgICAgdmFyIGF2YXRhciA9IG51bGxcclxuICAgICAgICAgICAgaWYgKGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdW21vZGVsQ2xhc3NdKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdmlzdWFsSnNvbiA9IGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdW21vZGVsQ2xhc3NdXHJcbiAgICAgICAgICAgICAgICB2YXIgY29sb3JDb2RlID0gdmlzdWFsSnNvbi5jb2xvciB8fCBcImdyYXlcIlxyXG4gICAgICAgICAgICAgICAgdmFyIHNoYXBlID0gdmlzdWFsSnNvbi5zaGFwZSB8fCBcImVsbGlwc2VcIlxyXG4gICAgICAgICAgICAgICAgdmFyIGF2YXJ0YSA9IHZpc3VhbEpzb24uYXZhcnRhXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIGZvbnRzaXplID0geyBcImVsbGlwc2VcIjogXCJmb250LXNpemU6MTMwJVwiLCBcInJvdW5kLXJlY3RhbmdsZVwiOiBcImZvbnQtc2l6ZTo2MCU7cGFkZGluZy1sZWZ0OjJweFwiLCBcImhleGFnb25cIjogXCJmb250LXNpemU6OTAlXCIgfVtzaGFwZV1cclxuICAgICAgICAgICAgc2hhcGUgPSB7IFwiZWxsaXBzZVwiOiBcIuKXj1wiLCBcInJvdW5kLXJlY3RhbmdsZVwiOiBcIuKWiVwiLCBcImhleGFnb25cIjogXCLirKJcIiB9W3NoYXBlXVxyXG5cclxuICAgICAgICAgICAgdmFyIGxibEhUTUwgPSBcIjxsYWJlbCBzdHlsZT0nZGlzcGxheTppbmxpbmU7Y29sb3I6XCIgKyBjb2xvckNvZGUgKyBcIjtcIiArIGZvbnRzaXplICsgXCI7Zm9udC13ZWlnaHQ6bm9ybWFsO3ZlcnRpY2FsLWFsaWduOm1pZGRsZTtib3JkZXItcmFkaXVzOiAycHg7Jz5cIiArIHNoYXBlICsgXCI8L2xhYmVsPlwiXHJcblxyXG4gICAgICAgICAgICBpZiAoYXZhcnRhKSBsYmxIVE1MICs9IFwiPGltZyBzcmM9J1wiICsgYXZhcnRhICsgXCInIHN0eWxlPSdoZWlnaHQ6MjBweCcvPlwiXHJcblxyXG4gICAgICAgICAgICByZXR1cm4gJChsYmxIVE1MKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy50cmVlLmNhbGxiYWNrX2FmdGVyU2VsZWN0Tm9kZXMgPSAobm9kZXNBcnIsIG1vdXNlQ2xpY2tEZXRhaWwpID0+IHtcclxuICAgICAgICAgICAgdmFyIHRoZU5vZGUgPSBub2Rlc0FyclswXVxyXG4gICAgICAgICAgICB0aGlzLmZpbGxSaWdodFNwYW4odGhlTm9kZS5sZWFmSW5mb1tcIkBpZFwiXSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBncm91cE5hbWVMaXN0ID0ge31cclxuICAgICAgICBmb3IgKHZhciBtb2RlbElEIGluIG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVscykgZ3JvdXBOYW1lTGlzdFt0aGlzLm1vZGVsTmFtZVRvR3JvdXBOYW1lKG1vZGVsSUQpXSA9IDFcclxuICAgICAgICB2YXIgbW9kZWxncm91cFNvcnRBcnIgPSBPYmplY3Qua2V5cyhncm91cE5hbWVMaXN0KVxyXG4gICAgICAgIG1vZGVsZ3JvdXBTb3J0QXJyLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEudG9Mb3dlckNhc2UoKS5sb2NhbGVDb21wYXJlKGIudG9Mb3dlckNhc2UoKSkgfSk7XHJcbiAgICAgICAgbW9kZWxncm91cFNvcnRBcnIuZm9yRWFjaChvbmVHcm91cE5hbWUgPT4ge1xyXG4gICAgICAgICAgICB2YXIgZ249dGhpcy50cmVlLmFkZEdyb3VwTm9kZSh7IGRpc3BsYXlOYW1lOiBvbmVHcm91cE5hbWUgfSlcclxuICAgICAgICAgICAgZ24uZXhwYW5kKClcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICBmb3IgKHZhciBtb2RlbElEIGluIG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVscykge1xyXG4gICAgICAgICAgICB2YXIgZ24gPSB0aGlzLm1vZGVsTmFtZVRvR3JvdXBOYW1lKG1vZGVsSUQpXHJcbiAgICAgICAgICAgIHRoaXMudHJlZS5hZGRMZWFmbm9kZVRvR3JvdXAoZ24sIEpTT04ucGFyc2UobW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdW1wib3JpZ2luYWxcIl0pKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy50cmVlLnNvcnRBbGxMZWF2ZXMoKVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBpZihzaG91bGRCcm9hZGNhc3QpIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcIkFEVE1vZGVsc0NoYW5nZVwifSlcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5tb2RlbE5hbWVUb0dyb3VwTmFtZT1mdW5jdGlvbihtb2RlbE5hbWUpe1xyXG4gICAgdmFyIG5hbWVQYXJ0cz1tb2RlbE5hbWUuc3BsaXQoXCI6XCIpXHJcbiAgICBpZihuYW1lUGFydHMubGVuZ3RoPj0yKSAgcmV0dXJuIG5hbWVQYXJ0c1sxXVxyXG4gICAgZWxzZSByZXR1cm4gXCJPdGhlcnNcIlxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLnJ4TWVzc2FnZT1mdW5jdGlvbihtc2dQYXlsb2FkKXtcclxuICAgIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJBRFRNb2RlbEVkaXRlZFwiKSB0aGlzLmxpc3RNb2RlbHMoXCJzaG91bGRCcm9hZGNhc3RcIilcclxufVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IG1vZGVsTWFuYWdlckRpYWxvZygpOyIsImNvbnN0IGdsb2JhbEFwcFNldHRpbmdzID0gcmVxdWlyZShcIi4uL2dsb2JhbEFwcFNldHRpbmdzXCIpXHJcbmNvbnN0IG1zYWxIZWxwZXI9cmVxdWlyZShcIi4uL21zYWxIZWxwZXJcIilcclxuY29uc3QgeyBEQlR3aW5zQXJyIH0gPSByZXF1aXJlKFwiLi9nbG9iYWxDYWNoZVwiKVxyXG5jb25zdCBnbG9iYWxDYWNoZT1yZXF1aXJlKFwiLi9nbG9iYWxDYWNoZVwiKVxyXG5cclxuZnVuY3Rpb24gc3RhcnRTZWxlY3Rpb25EaWFsb2coKSB7XHJcbiAgICBpZighdGhpcy5ET00pe1xyXG4gICAgICAgIHRoaXMuRE9NID0gJCgnPGRpdiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7YmFja2dyb3VuZC1jb2xvcjp3aGl0ZTtsZWZ0OjUwJTt0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSkgdHJhbnNsYXRlWSgtNTAlKTt6LWluZGV4Ojk5XCIgY2xhc3M9XCJ3My1jYXJkLTJcIj48L2Rpdj4nKVxyXG4gICAgICAgICQoXCJib2R5XCIpLmFwcGVuZCh0aGlzLkRPTSlcclxuICAgICAgICB0aGlzLkRPTS5oaWRlKClcclxuICAgIH1cclxufVxyXG5cclxuc3RhcnRTZWxlY3Rpb25EaWFsb2cucHJvdG90eXBlLnBvcHVwID0gYXN5bmMgZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLkRPTS5zaG93KClcclxuICAgIHRoaXMuRE9NLmVtcHR5KClcclxuICAgIHRoaXMuY29udGVudERPTSA9ICQoJzxkaXYgc3R5bGU9XCJ3aWR0aDo2NjVweFwiPjwvZGl2PicpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQodGhpcy5jb250ZW50RE9NKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwiaGVpZ2h0OjQwcHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cImZvbnQtc2l6ZToxLjVlbVwiPlNlbGVjdCBUd2luczwvZGl2PjwvZGl2PicpKVxyXG4gICAgdmFyIGNsb3NlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yaWdodFwiIHN0eWxlPVwiZm9udC1zaXplOjJlbTtwYWRkaW5nLXRvcDo0cHhcIj7DlzwvYnV0dG9uPicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZChjbG9zZUJ1dHRvbilcclxuXHJcbiAgICB0aGlzLmJ1dHRvbkhvbGRlciA9ICQoXCI8ZGl2IHN0eWxlPSdoZWlnaHQ6MTAwJSc+PC9kaXY+XCIpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZCh0aGlzLmJ1dHRvbkhvbGRlcilcclxuICAgIGNsb3NlQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgIHRoaXMudXNlU3RhcnRTZWxlY3Rpb24oXCJhcHBlbmRcIilcclxuICAgICAgICB0aGlzLmNsb3NlRGlhbG9nKCkgXHJcbiAgICB9KVxyXG5cclxuICAgIHZhciByZXBsYWNlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1jYXJkIHczLWRlZXAtb3JhbmdlIHczLWhvdmVyLWdyZWVuXCIgc3R5bGU9XCJoZWlnaHQ6MTAwJTsgbWFyZ2luLXJpZ2h0OjhweFwiPlJlcGxhY2UgQWxsIERhdGE8L2J1dHRvbj4nKVxyXG4gICAgdmFyIGFwcGVuZEJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtY2FyZCB3My1kZWVwLW9yYW5nZSB3My1ob3Zlci1ncmVlblwiIHN0eWxlPVwiaGVpZ2h0OjEwMCVcIj5BcHBlbmQgRGF0YTwvYnV0dG9uPicpXHJcblxyXG4gICAgcmVwbGFjZUJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHsgdGhpcy51c2VTdGFydFNlbGVjdGlvbihcInJlcGxhY2VcIikgfSlcclxuICAgIGFwcGVuZEJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHsgdGhpcy51c2VTdGFydFNlbGVjdGlvbihcImFwcGVuZFwiKSB9KVxyXG4gICAgdGhpcy5idXR0b25Ib2xkZXIuYXBwZW5kKHJlcGxhY2VCdXR0b24sIGFwcGVuZEJ1dHRvbilcclxuXHJcbiAgICB2YXIgcGFuZWxIZWlnaHQ9NDUwXHJcbiAgICB2YXIgcm93Mj0kKCc8ZGl2IGNsYXNzPVwidzMtY2VsbC1yb3dcIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmFwcGVuZChyb3cyKVxyXG4gICAgdmFyIGxlZnRTcGFuPSQoJzxkaXYgc3R5bGU9XCJwYWRkaW5nOjVweDt3aWR0aDoyMzBweDtwYWRkaW5nLXJpZ2h0OjVweDtvdmVyZmxvdzpoaWRkZW5cIj48L2Rpdj4nKVxyXG4gICAgcm93Mi5hcHBlbmQobGVmdFNwYW4pXHJcbiAgICB0aGlzLmxlZnRTcGFuPWxlZnRTcGFuXHJcblxyXG4gICAgdmFyIHJpZ2h0U3Bhbj0kKCc8ZGl2IGNsYXNzPVwidzMtY29udGFpbmVyIHczLWNlbGxcIiBzdHlsZT1cInBhZGRpbmctdG9wOjEwcHg7XCI+PC9kaXY+JylcclxuICAgIHJvdzIuYXBwZW5kKHJpZ2h0U3BhbikgXHJcbiAgICByaWdodFNwYW4uYXBwZW5kKCQoJzxkaXYgY2xhc3M9XCJ3My1jb250YWluZXIgdzMtY2FyZFwiIHN0eWxlPVwiY29sb3I6Z3JheTtoZWlnaHQ6JysocGFuZWxIZWlnaHQtMTApKydweDtvdmVyZmxvdzphdXRvO3dpZHRoOjQxMHB4O1wiPjwvZGl2PicpKVxyXG4gICAgdmFyIHNlbGVjdGVkVHdpbnNET009JChcIjx0YWJsZSBzdHlsZT0nd2lkdGg6MTAwJSc+PC90YWJsZT5cIilcclxuICAgIHNlbGVjdGVkVHdpbnNET00uY3NzKHtcImJvcmRlci1jb2xsYXBzZVwiOlwiY29sbGFwc2VcIn0pXHJcbiAgICByaWdodFNwYW4uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZChzZWxlY3RlZFR3aW5zRE9NKVxyXG4gICAgdGhpcy5zZWxlY3RlZFR3aW5zRE9NPXNlbGVjdGVkVHdpbnNET00gXHJcblxyXG4gICAgdGhpcy5sZWZ0U3Bhbi5hcHBlbmQoJCgnPGRpdiBjbGFzcz1cInczLWJhclwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbSB3My10b29sdGlwXCIgc3R5bGU9XCJmb250LXNpemU6MS4yZW07cGFkZGluZy1sZWZ0OjJweDtmb250LXdlaWdodDpib2xkO2NvbG9yOmdyYXlcIj5TZWxlY3QgVHdpbnMgZnJvbTxwIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dGV4dC1hbGlnbjpsZWZ0O2ZvbnQtd2VpZ2h0Om5vcm1hbDt0b3A6LTEwcHg7d2lkdGg6MjAwcHhcIiBjbGFzcz1cInczLXRleHQgdzMtdGFnIHczLXRpbnlcIj5jaG9vc2Ugb25lIG9yIG1vcmUgbW9kZWxzPC9wPjwvZGl2PjwvZGl2PicpKVxyXG5cclxuICAgIHRoaXMubW9kZWxzQ2hlY2tCb3hlcz0kKCc8Zm9ybSBjbGFzcz1cInczLWNvbnRhaW5lciB3My1ib3JkZXJcIiBzdHlsZT1cImhlaWdodDonKyhwYW5lbEhlaWdodC00MCkrJ3B4O292ZXJmbG93OmF1dG9cIj48L2Zvcm0+JylcclxuICAgIGxlZnRTcGFuLmFwcGVuZCh0aGlzLm1vZGVsc0NoZWNrQm94ZXMpXHJcbiAgICB0aGlzLmZpbGxBdmFpbGFibGVNb2RlbHMoKVxyXG5cclxuICAgIHRoaXMubGlzdFR3aW5zKClcclxufVxyXG5cclxuc3RhcnRTZWxlY3Rpb25EaWFsb2cucHJvdG90eXBlLmNsb3NlRGlhbG9nPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLkRPTS5oaWRlKClcclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInN0YXJ0U2VsZWN0aW9uRGlhbG9nX2Nsb3NlZFwifSlcclxufVxyXG5cclxuc3RhcnRTZWxlY3Rpb25EaWFsb2cucHJvdG90eXBlLmZpbGxBdmFpbGFibGVNb2RlbHMgPSBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMubW9kZWxzQ2hlY2tCb3hlcy5hcHBlbmQoJzxpbnB1dCBjbGFzcz1cInczLWNoZWNrXCIgdHlwZT1cImNoZWNrYm94XCIgaWQ9XCJBTExcIj48bGFiZWwgc3R5bGU9XCJwYWRkaW5nLWxlZnQ6NXB4XCI+PGI+QUxMPC9iPjwvbGFiZWw+PHAvPicpXHJcbiAgICBnbG9iYWxDYWNoZS5EQk1vZGVsc0Fyci5mb3JFYWNoKG9uZU1vZGVsPT57XHJcbiAgICAgICAgdmFyIG1vZGVsTmFtZT1vbmVNb2RlbFtcImRpc3BsYXlOYW1lXCJdXHJcbiAgICAgICAgdmFyIG1vZGVsSUQ9b25lTW9kZWxbXCJpZFwiXVxyXG4gICAgICAgIHRoaXMubW9kZWxzQ2hlY2tCb3hlcy5hcHBlbmQoYDxpbnB1dCBjbGFzcz1cInczLWNoZWNrXCIgdHlwZT1cImNoZWNrYm94XCIgaWQ9XCIke21vZGVsSUR9XCI+PGxhYmVsIHN0eWxlPVwicGFkZGluZy1sZWZ0OjVweFwiPiR7bW9kZWxOYW1lfTwvbGFiZWw+PHAvPmApXHJcbiAgICB9KVxyXG4gICAgdGhpcy5tb2RlbHNDaGVja0JveGVzLm9uKFwiY2hhbmdlXCIsKGV2dCk9PntcclxuICAgICAgICBpZigkKGV2dC50YXJnZXQpLmF0dHIoXCJpZFwiKT09XCJBTExcIil7XHJcbiAgICAgICAgICAgIC8vc2VsZWN0IGFsbCB0aGUgb3RoZXIgaW5wdXRcclxuICAgICAgICAgICAgdmFyIHZhbD0kKGV2dC50YXJnZXQpLnByb3AoXCJjaGVja2VkXCIpXHJcbiAgICAgICAgICAgIHRoaXMubW9kZWxzQ2hlY2tCb3hlcy5jaGlsZHJlbignaW5wdXQnKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICQodGhpcykucHJvcChcImNoZWNrZWRcIix2YWwpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmxpc3RUd2lucygpXHJcbiAgICB9KVxyXG59XHJcblxyXG5zdGFydFNlbGVjdGlvbkRpYWxvZy5wcm90b3R5cGUuZ2V0U2VsZWN0ZWRUd2lucz1mdW5jdGlvbigpe1xyXG4gICAgdmFyIHJlQXJyPVtdXHJcbiAgICB2YXIgY2hvc2VuTW9kZWxzPXt9XHJcbiAgICB0aGlzLm1vZGVsc0NoZWNrQm94ZXMuY2hpbGRyZW4oJ2lucHV0JykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYoISQodGhpcykucHJvcChcImNoZWNrZWRcIikpIHJldHVybjtcclxuICAgICAgICBpZigkKHRoaXMpLmF0dHIoXCJpZFwiKT09XCJBTExcIikgcmV0dXJuO1xyXG4gICAgICAgIGNob3Nlbk1vZGVsc1skKHRoaXMpLmF0dHIoXCJpZFwiKV09MVxyXG4gICAgfSk7XHJcbiAgICBnbG9iYWxDYWNoZS5EQlR3aW5zQXJyLmZvckVhY2goYVR3aW49PntcclxuICAgICAgICBpZihjaG9zZW5Nb2RlbHNbYVR3aW5bXCJtb2RlbElEXCJdXSkgIHJlQXJyLnB1c2goYVR3aW4pXHJcbiAgICB9KVxyXG4gICAgcmV0dXJuIHJlQXJyO1xyXG59XHJcblxyXG5zdGFydFNlbGVjdGlvbkRpYWxvZy5wcm90b3R5cGUubGlzdFR3aW5zPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLnNlbGVjdGVkVHdpbnNET00uZW1wdHkoKVxyXG4gICAgdmFyIHRyPSQoJzx0cj48dGQgc3R5bGU9XCJib3JkZXItcmlnaHQ6c29saWQgMXB4IGxpZ2h0Z3JleTtib3JkZXItYm90dG9tOnNvbGlkIDFweCBsaWdodGdyZXk7Zm9udC13ZWlnaHQ6Ym9sZFwiPklEPC90ZD48dGQgc3R5bGU9XCJib3JkZXItYm90dG9tOnNvbGlkIDFweCBsaWdodGdyZXk7Zm9udC13ZWlnaHQ6Ym9sZFwiPk1PREVMPC90ZD48L3RyPicpXHJcbiAgICB0aGlzLnNlbGVjdGVkVHdpbnNET00uYXBwZW5kKHRyKVxyXG5cclxuICAgIHZhciBzZWxlY3RlZFR3aW5zPXRoaXMuZ2V0U2VsZWN0ZWRUd2lucygpXHJcbiAgICBzZWxlY3RlZFR3aW5zLmZvckVhY2goYVR3aW49PntcclxuICAgICAgICB2YXIgdHI9JCgnPHRyPjx0ZCBzdHlsZT1cImJvcmRlci1yaWdodDpzb2xpZCAxcHggbGlnaHRncmV5O2JvcmRlci1ib3R0b206c29saWQgMXB4IGxpZ2h0Z3JleVwiPicrYVR3aW5bXCJkaXNwbGF5TmFtZVwiXSsnPC90ZD48dGQgc3R5bGU9XCJib3JkZXItYm90dG9tOnNvbGlkIDFweCBsaWdodGdyZXlcIj4nK2FUd2luWydtb2RlbElEJ10rJzwvdGQ+PC90cj4nKVxyXG4gICAgICAgIHRoaXMuc2VsZWN0ZWRUd2luc0RPTS5hcHBlbmQodHIpXHJcbiAgICB9KVxyXG4gICAgaWYoc2VsZWN0ZWRUd2lucy5sZW5ndGg9PTApe1xyXG4gICAgICAgIHZhciB0cj0kKCc8dHI+PHRkIHN0eWxlPVwiY29sb3I6Z3JheVwiPnplcm8gcmVjb3JkPC90ZD48dGQ+PC90ZD48L3RyPicpXHJcbiAgICAgICAgdGhpcy5zZWxlY3RlZFR3aW5zRE9NLmFwcGVuZCh0cikgICAgXHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5zdGFydFNlbGVjdGlvbkRpYWxvZy5wcm90b3R5cGUudXNlU3RhcnRTZWxlY3Rpb249ZnVuY3Rpb24oYWN0aW9uKXtcclxuICAgIHZhciBzZWxlY3RlZFR3aW5zPXRoaXMuZ2V0U2VsZWN0ZWRUd2lucygpXHJcbiAgICB2YXIgdHdpbklEcz1bXVxyXG4gICAgc2VsZWN0ZWRUd2lucy5mb3JFYWNoKGFUd2luPT57dHdpbklEcy5wdXNoKGFUd2luW1wiaWRcIl0pfSlcclxuXHJcbiAgICB2YXIgbW9kZWxJRHM9W11cclxuICAgIGdsb2JhbENhY2hlLkRCTW9kZWxzQXJyLmZvckVhY2gob25lTW9kZWw9Pnttb2RlbElEcy5wdXNoKG9uZU1vZGVsW1wiaWRcIl0pfSlcclxuXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJzdGFydFNlbGVjdGlvbl9cIithY3Rpb24sIFwidHdpbklEc1wiOiB0d2luSURzLFwibW9kZWxJRHNcIjptb2RlbElEcyB9KVxyXG4gICAgdGhpcy5jbG9zZURpYWxvZygpXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IHN0YXJ0U2VsZWN0aW9uRGlhbG9nKCk7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuY29uc3QgbW9kZWxBbmFseXplciA9IHJlcXVpcmUoXCIuL21vZGVsQW5hbHl6ZXJcIik7XHJcbmNvbnN0IHNpbXBsZVNlbGVjdE1lbnUgPSByZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvc2ltcGxlU2VsZWN0TWVudVwiKVxyXG5jb25zdCBzaW1wbGVDb25maXJtRGlhbG9nID0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL3NpbXBsZUNvbmZpcm1EaWFsb2dcIilcclxuY29uc3QgZ2xvYmFsQ2FjaGUgPSByZXF1aXJlKFwiLi9nbG9iYWxDYWNoZVwiKVxyXG5jb25zdCBtc2FsSGVscGVyPXJlcXVpcmUoXCIuLi9tc2FsSGVscGVyXCIpXHJcblxyXG5mdW5jdGlvbiB0b3BvbG9neURPTShET00pe1xyXG4gICAgdGhpcy5ET009RE9NXHJcbiAgICB0aGlzLmRlZmF1bHROb2RlU2l6ZT0zMFxyXG4gICAgdGhpcy5ub2RlU2l6ZU1vZGVsQWRqdXN0bWVudFJhdGlvPXt9XHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5pbml0PWZ1bmN0aW9uKCl7XHJcbiAgICBjeXRvc2NhcGUud2FybmluZ3MoZmFsc2UpICBcclxuICAgIHRoaXMuY29yZSA9IGN5dG9zY2FwZSh7XHJcbiAgICAgICAgY29udGFpbmVyOiAgdGhpcy5ET01bMF0sIC8vIGNvbnRhaW5lciB0byByZW5kZXIgaW5cclxuXHJcbiAgICAgICAgLy8gaW5pdGlhbCB2aWV3cG9ydCBzdGF0ZTpcclxuICAgICAgICB6b29tOiAxLFxyXG4gICAgICAgIHBhbjogeyB4OiAwLCB5OiAwIH0sXHJcblxyXG4gICAgICAgIC8vIGludGVyYWN0aW9uIG9wdGlvbnM6XHJcbiAgICAgICAgbWluWm9vbTogMC4xLFxyXG4gICAgICAgIG1heFpvb206IDEwLFxyXG4gICAgICAgIHpvb21pbmdFbmFibGVkOiB0cnVlLFxyXG4gICAgICAgIHVzZXJab29taW5nRW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICBwYW5uaW5nRW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICB1c2VyUGFubmluZ0VuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgYm94U2VsZWN0aW9uRW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICBzZWxlY3Rpb25UeXBlOiAnc2luZ2xlJyxcclxuICAgICAgICB0b3VjaFRhcFRocmVzaG9sZDogOCxcclxuICAgICAgICBkZXNrdG9wVGFwVGhyZXNob2xkOiA0LFxyXG4gICAgICAgIGF1dG9sb2NrOiBmYWxzZSxcclxuICAgICAgICBhdXRvdW5ncmFiaWZ5OiBmYWxzZSxcclxuICAgICAgICBhdXRvdW5zZWxlY3RpZnk6IGZhbHNlLFxyXG5cclxuICAgICAgICAvLyByZW5kZXJpbmcgb3B0aW9uczpcclxuICAgICAgICBoZWFkbGVzczogZmFsc2UsXHJcbiAgICAgICAgc3R5bGVFbmFibGVkOiB0cnVlLFxyXG4gICAgICAgIGhpZGVFZGdlc09uVmlld3BvcnQ6IGZhbHNlLFxyXG4gICAgICAgIHRleHR1cmVPblZpZXdwb3J0OiBmYWxzZSxcclxuICAgICAgICBtb3Rpb25CbHVyOiBmYWxzZSxcclxuICAgICAgICBtb3Rpb25CbHVyT3BhY2l0eTogMC4yLFxyXG4gICAgICAgIHdoZWVsU2Vuc2l0aXZpdHk6IDAuMyxcclxuICAgICAgICBwaXhlbFJhdGlvOiAnYXV0bycsXHJcblxyXG4gICAgICAgIGVsZW1lbnRzOiBbXSwgLy8gbGlzdCBvZiBncmFwaCBlbGVtZW50cyB0byBzdGFydCB3aXRoXHJcblxyXG4gICAgICAgIHN0eWxlOiBbIC8vIHRoZSBzdHlsZXNoZWV0IGZvciB0aGUgZ3JhcGhcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZWN0b3I6ICdub2RlJyxcclxuICAgICAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJ3aWR0aFwiOnRoaXMuZGVmYXVsdE5vZGVTaXplLFwiaGVpZ2h0XCI6dGhpcy5kZWZhdWx0Tm9kZVNpemUsXHJcbiAgICAgICAgICAgICAgICAgICAgJ2xhYmVsJzogJ2RhdGEoaWQpJyxcclxuICAgICAgICAgICAgICAgICAgICAnb3BhY2l0eSc6MC45LFxyXG4gICAgICAgICAgICAgICAgICAgICdmb250LXNpemUnOlwiMTJweFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICdmb250LWZhbWlseSc6J0dlbmV2YSwgQXJpYWwsIEhlbHZldGljYSwgc2Fucy1zZXJpZidcclxuICAgICAgICAgICAgICAgICAgICAvLywnYmFja2dyb3VuZC1pbWFnZSc6IGZ1bmN0aW9uKGVsZSl7IHJldHVybiBcImltYWdlcy9jYXQucG5nXCI7IH1cclxuICAgICAgICAgICAgICAgICAgICAvLywnYmFja2dyb3VuZC1maXQnOidjb250YWluJyAvL2NvdmVyXHJcbiAgICAgICAgICAgICAgICAgICAgLy8nYmFja2dyb3VuZC1jb2xvcic6IGZ1bmN0aW9uKCBlbGUgKXsgcmV0dXJuIGVsZS5kYXRhKCdiZycpIH1cclxuICAgICAgICAgICAgICAgICAgICAsJ2JhY2tncm91bmQtd2lkdGgnOic3MCUnXHJcbiAgICAgICAgICAgICAgICAgICAgLCdiYWNrZ3JvdW5kLWhlaWdodCc6JzcwJSdcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZWN0b3I6ICdlZGdlJyxcclxuICAgICAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgJ3dpZHRoJzoyLFxyXG4gICAgICAgICAgICAgICAgICAgICdsaW5lLWNvbG9yJzogJyM4ODgnLFxyXG4gICAgICAgICAgICAgICAgICAgICd0YXJnZXQtYXJyb3ctY29sb3InOiAnIzU1NScsXHJcbiAgICAgICAgICAgICAgICAgICAgJ3RhcmdldC1hcnJvdy1zaGFwZSc6ICd0cmlhbmdsZScsXHJcbiAgICAgICAgICAgICAgICAgICAgJ2N1cnZlLXN0eWxlJzogJ2JlemllcicsXHJcbiAgICAgICAgICAgICAgICAgICAgJ2Fycm93LXNjYWxlJzowLjZcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge3NlbGVjdG9yOiAnZWRnZTpzZWxlY3RlZCcsXHJcbiAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAnd2lkdGgnOiAzLFxyXG4gICAgICAgICAgICAgICAgJ2xpbmUtY29sb3InOiAncmVkJyxcclxuICAgICAgICAgICAgICAgICd0YXJnZXQtYXJyb3ctY29sb3InOiAncmVkJyxcclxuICAgICAgICAgICAgICAgICdzb3VyY2UtYXJyb3ctY29sb3InOiAncmVkJ1xyXG4gICAgICAgICAgICB9fSxcclxuICAgICAgICAgICAge3NlbGVjdG9yOiAnbm9kZTpzZWxlY3RlZCcsXHJcbiAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAnYm9yZGVyLWNvbG9yJzpcInJlZFwiLFxyXG4gICAgICAgICAgICAgICAgJ2JvcmRlci13aWR0aCc6MixcclxuICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kLWNvbG9yJzogJ0dyYXknXHJcbiAgICAgICAgICAgIH19LFxyXG4gICAgICAgICAgICB7c2VsZWN0b3I6ICdub2RlLmhvdmVyJyxcclxuICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kLWJsYWNrZW4nOjAuNVxyXG4gICAgICAgICAgICB9fVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLHtzZWxlY3RvcjogJ2VkZ2UuaG92ZXInLFxyXG4gICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzo1XHJcbiAgICAgICAgICAgIH19XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIF1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vY3l0b3NjYXBlIGVkZ2UgZWRpdGluZyBwbHVnLWluXHJcbiAgICB0aGlzLmNvcmUuZWRnZUVkaXRpbmcoe1xyXG4gICAgICAgIHVuZG9hYmxlOiB0cnVlLFxyXG4gICAgICAgIGJlbmRSZW1vdmFsU2Vuc2l0aXZpdHk6IDE2LFxyXG4gICAgICAgIGVuYWJsZU11bHRpcGxlQW5jaG9yUmVtb3ZhbE9wdGlvbjogdHJ1ZSxcclxuICAgICAgICBzdGlja3lBbmNob3JUb2xlcmVuY2U6IDIwLFxyXG4gICAgICAgIGFuY2hvclNoYXBlU2l6ZUZhY3RvcjogNSxcclxuICAgICAgICBlbmFibGVBbmNob3JTaXplTm90SW1wYWN0Qnlab29tOnRydWUsXHJcbiAgICAgICAgZW5hYmxlUmVtb3ZlQW5jaG9yTWlkT2ZOZWFyTGluZTpmYWxzZSxcclxuICAgICAgICBlbmFibGVDcmVhdGVBbmNob3JPbkRyYWc6ZmFsc2VcclxuICAgIH0pO1xyXG5cclxuICAgIFxyXG4gICAgdGhpcy5jb3JlLmJveFNlbGVjdGlvbkVuYWJsZWQodHJ1ZSlcclxuXHJcblxyXG4gICAgdGhpcy5jb3JlLm9uKCd0YXBzZWxlY3QnLCAoKT0+e3RoaXMuc2VsZWN0RnVuY3Rpb24oKX0pO1xyXG4gICAgdGhpcy5jb3JlLm9uKCd0YXB1bnNlbGVjdCcsICgpPT57dGhpcy5zZWxlY3RGdW5jdGlvbigpfSk7XHJcblxyXG4gICAgdGhpcy5jb3JlLm9uKCdib3hlbmQnLChlKT0+ey8vcHV0IGluc2lkZSBib3hlbmQgZXZlbnQgdG8gdHJpZ2dlciBvbmx5IG9uZSB0aW1lLCBhbmQgcmVwbGVhdGx5IGFmdGVyIGVhY2ggYm94IHNlbGVjdFxyXG4gICAgICAgIHRoaXMuY29yZS5vbmUoJ2JveHNlbGVjdCcsKCk9Pnt0aGlzLnNlbGVjdEZ1bmN0aW9uKCl9KVxyXG4gICAgfSlcclxuXHJcbiAgICB0aGlzLmNvcmUub24oJ2N4dHRhcCcsKGUpPT57XHJcbiAgICAgICAgdGhpcy5jYW5jZWxUYXJnZXROb2RlTW9kZSgpXHJcbiAgICB9KVxyXG5cclxuICAgIHRoaXMuY29yZS5vbignbW91c2VvdmVyJyxlPT57XHJcblxyXG4gICAgICAgIHRoaXMubW91c2VPdmVyRnVuY3Rpb24oZSlcclxuICAgIH0pXHJcbiAgICB0aGlzLmNvcmUub24oJ21vdXNlb3V0JyxlPT57XHJcbiAgICAgICAgdGhpcy5tb3VzZU91dEZ1bmN0aW9uKGUpXHJcbiAgICB9KVxyXG4gICAgXHJcbiAgICB0aGlzLmNvcmUub24oJ3pvb20nLChlKT0+e1xyXG4gICAgICAgIHZhciBmcz10aGlzLmdldEZvbnRTaXplSW5DdXJyZW50Wm9vbSgpO1xyXG4gICAgICAgIHZhciBkaW1lbnNpb249dGhpcy5nZXROb2RlU2l6ZUluQ3VycmVudFpvb20oKTtcclxuICAgICAgICB0aGlzLmNvcmUuc3R5bGUoKVxyXG4gICAgICAgICAgICAuc2VsZWN0b3IoJ25vZGUnKVxyXG4gICAgICAgICAgICAuc3R5bGUoeyAnZm9udC1zaXplJzogZnMsIHdpZHRoOiBkaW1lbnNpb24sIGhlaWdodDogZGltZW5zaW9uIH0pXHJcbiAgICAgICAgICAgIC51cGRhdGUoKVxyXG4gICAgICAgIGZvciAodmFyIG1vZGVsSUQgaW4gdGhpcy5ub2RlU2l6ZU1vZGVsQWRqdXN0bWVudFJhdGlvKSB7XHJcbiAgICAgICAgICAgIHZhciBuZXdEaW1lbnNpb24gPSBNYXRoLmNlaWwodGhpcy5ub2RlU2l6ZU1vZGVsQWRqdXN0bWVudFJhdGlvW21vZGVsSURdICogZGltZW5zaW9uKVxyXG4gICAgICAgICAgICB0aGlzLmNvcmUuc3R5bGUoKVxyXG4gICAgICAgICAgICAgICAgLnNlbGVjdG9yKCdub2RlW21vZGVsSUQgPSBcIicgKyBtb2RlbElEICsgJ1wiXScpXHJcbiAgICAgICAgICAgICAgICAuc3R5bGUoeyB3aWR0aDogbmV3RGltZW5zaW9uLCBoZWlnaHQ6IG5ld0RpbWVuc2lvbiB9KVxyXG4gICAgICAgICAgICAgICAgLnVwZGF0ZSgpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuY29yZS5zdHlsZSgpXHJcbiAgICAgICAgICAgIC5zZWxlY3Rvcignbm9kZTpzZWxlY3RlZCcpXHJcbiAgICAgICAgICAgIC5zdHlsZSh7ICdib3JkZXItd2lkdGgnOiBNYXRoLmNlaWwoZGltZW5zaW9uIC8gMTUpIH0pXHJcbiAgICAgICAgICAgIC51cGRhdGUoKVxyXG4gICAgfSlcclxuXHJcbiAgICB2YXIgaW5zdGFuY2UgPSB0aGlzLmNvcmUuZWRnZUVkaXRpbmcoJ2dldCcpO1xyXG4gICAgdmFyIHRhcGRyYWdIYW5kbGVyPShlKSA9PiB7XHJcbiAgICAgICAgaW5zdGFuY2Uua2VlcEFuY2hvcnNBYnNvbHV0ZVBvc2l0aW9uRHVyaW5nTW92aW5nKClcclxuICAgICAgICBpZihlLnRhcmdldC5pc05vZGUgJiYgZS50YXJnZXQuaXNOb2RlKCkpIHRoaXMuZHJhZ2dpbmdOb2RlPWUudGFyZ2V0XHJcbiAgICAgICAgdGhpcy5zbWFydFBvc2l0aW9uTm9kZShlLnBvc2l0aW9uKVxyXG4gICAgfVxyXG4gICAgdmFyIHNldE9uZVRpbWVHcmFiID0gKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuY29yZS5vbmNlKFwiZ3JhYlwiLCAoZSkgPT4ge1xyXG4gICAgICAgICAgICB2YXIgZHJhZ2dpbmdOb2RlcyA9IHRoaXMuY29yZS5jb2xsZWN0aW9uKClcclxuICAgICAgICAgICAgaWYgKGUudGFyZ2V0LmlzTm9kZSgpKSBkcmFnZ2luZ05vZGVzLm1lcmdlKGUudGFyZ2V0KVxyXG4gICAgICAgICAgICB2YXIgYXJyID0gdGhpcy5jb3JlLiQoXCI6c2VsZWN0ZWRcIilcclxuICAgICAgICAgICAgYXJyLmZvckVhY2goKGVsZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGVsZS5pc05vZGUoKSkgZHJhZ2dpbmdOb2Rlcy5tZXJnZShlbGUpXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIGluc3RhbmNlLnN0b3JlQW5jaG9yc0Fic29sdXRlUG9zaXRpb24oZHJhZ2dpbmdOb2RlcylcclxuICAgICAgICAgICAgdGhpcy5jb3JlLm9uKFwidGFwZHJhZ1wiLHRhcGRyYWdIYW5kbGVyIClcclxuICAgICAgICAgICAgc2V0T25lVGltZUZyZWUoKVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbiAgICB2YXIgc2V0T25lVGltZUZyZWUgPSAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5jb3JlLm9uY2UoXCJmcmVlXCIsIChlKSA9PiB7XHJcbiAgICAgICAgICAgIHZhciBpbnN0YW5jZSA9IHRoaXMuY29yZS5lZGdlRWRpdGluZygnZ2V0Jyk7XHJcbiAgICAgICAgICAgIGluc3RhbmNlLnJlc2V0QW5jaG9yc0Fic29sdXRlUG9zaXRpb24oKVxyXG4gICAgICAgICAgICB0aGlzLmRyYWdnaW5nTm9kZT1udWxsXHJcbiAgICAgICAgICAgIHNldE9uZVRpbWVHcmFiKClcclxuICAgICAgICAgICAgdGhpcy5jb3JlLnJlbW92ZUxpc3RlbmVyKFwidGFwZHJhZ1wiLHRhcGRyYWdIYW5kbGVyKVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbiAgICBzZXRPbmVUaW1lR3JhYigpXHJcbiAgICB0aGlzLmNvcmUudHJpZ2dlcihcInpvb21cIilcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnNtYXJ0UG9zaXRpb25Ob2RlID0gZnVuY3Rpb24gKG1vdXNlUG9zaXRpb24pIHtcclxuICAgIHZhciB6b29tTGV2ZWw9dGhpcy5jb3JlLnpvb20oKVxyXG4gICAgaWYoIXRoaXMuZHJhZ2dpbmdOb2RlKSByZXR1cm5cclxuICAgIC8vY29tcGFyaW5nIG5vZGVzIHNldDogaXRzIGNvbm5lY3Rmcm9tIG5vZGVzIGFuZCB0aGVpciBjb25uZWN0dG8gbm9kZXMsIGl0cyBjb25uZWN0dG8gbm9kZXMgYW5kIHRoZWlyIGNvbm5lY3Rmcm9tIG5vZGVzXHJcbiAgICB2YXIgaW5jb21lcnM9dGhpcy5kcmFnZ2luZ05vZGUuaW5jb21lcnMoKVxyXG4gICAgdmFyIG91dGVyRnJvbUluY29tPSBpbmNvbWVycy5vdXRnb2VycygpXHJcbiAgICB2YXIgb3V0ZXI9dGhpcy5kcmFnZ2luZ05vZGUub3V0Z29lcnMoKVxyXG4gICAgdmFyIGluY29tRnJvbU91dGVyPW91dGVyLmluY29tZXJzKClcclxuICAgIHZhciBtb25pdG9yU2V0PWluY29tZXJzLnVuaW9uKG91dGVyRnJvbUluY29tKS51bmlvbihvdXRlcikudW5pb24oaW5jb21Gcm9tT3V0ZXIpLmZpbHRlcignbm9kZScpLnVubWVyZ2UodGhpcy5kcmFnZ2luZ05vZGUpXHJcblxyXG4gICAgdmFyIHJldHVybkV4cGVjdGVkUG9zPShkaWZmQXJyLHBvc0Fycik9PntcclxuICAgICAgICB2YXIgbWluRGlzdGFuY2U9TWF0aC5taW4oLi4uZGlmZkFycilcclxuICAgICAgICBpZihtaW5EaXN0YW5jZSp6b29tTGV2ZWwgPCAxMCkgIHJldHVybiBwb3NBcnJbZGlmZkFyci5pbmRleE9mKG1pbkRpc3RhbmNlKV1cclxuICAgICAgICBlbHNlIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciB4RGlmZj1bXVxyXG4gICAgdmFyIHhQb3M9W11cclxuICAgIHZhciB5RGlmZj1bXVxyXG4gICAgdmFyIHlQb3M9W11cclxuICAgIG1vbml0b3JTZXQuZm9yRWFjaCgoZWxlKT0+e1xyXG4gICAgICAgIHhEaWZmLnB1c2goTWF0aC5hYnMoZWxlLnBvc2l0aW9uKCkueC1tb3VzZVBvc2l0aW9uLngpKVxyXG4gICAgICAgIHhQb3MucHVzaChlbGUucG9zaXRpb24oKS54KVxyXG4gICAgICAgIHlEaWZmLnB1c2goTWF0aC5hYnMoZWxlLnBvc2l0aW9uKCkueS1tb3VzZVBvc2l0aW9uLnkpKVxyXG4gICAgICAgIHlQb3MucHVzaChlbGUucG9zaXRpb24oKS55KVxyXG4gICAgfSlcclxuICAgIHZhciBwcmVmWD1yZXR1cm5FeHBlY3RlZFBvcyh4RGlmZix4UG9zKVxyXG4gICAgdmFyIHByZWZZPXJldHVybkV4cGVjdGVkUG9zKHlEaWZmLHlQb3MpXHJcbiAgICBpZihwcmVmWCE9bnVsbCkge1xyXG4gICAgICAgIHRoaXMuZHJhZ2dpbmdOb2RlLnBvc2l0aW9uKCd4JywgcHJlZlgpO1xyXG4gICAgfVxyXG4gICAgaWYocHJlZlkhPW51bGwpIHtcclxuICAgICAgICB0aGlzLmRyYWdnaW5nTm9kZS5wb3NpdGlvbigneScsIHByZWZZKTtcclxuICAgIH1cclxuICAgIC8vY29uc29sZS5sb2coXCItLS0tXCIpXHJcbiAgICAvL21vbml0b3JTZXQuZm9yRWFjaCgoZWxlKT0+e2NvbnNvbGUubG9nKGVsZS5pZCgpKX0pXHJcbiAgICAvL2NvbnNvbGUubG9nKG1vbml0b3JTZXQuc2l6ZSgpKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUubW91c2VPdmVyRnVuY3Rpb249IGZ1bmN0aW9uIChlKSB7XHJcbiAgICBpZighZS50YXJnZXQuZGF0YSkgcmV0dXJuXHJcbiAgICBcclxuICAgIHZhciBpbmZvPWUudGFyZ2V0LmRhdGEoKS5vcmlnaW5hbEluZm9cclxuICAgIGlmKGluZm89PW51bGwpIHJldHVybjtcclxuICAgIGlmKHRoaXMubGFzdEhvdmVyVGFyZ2V0KSB0aGlzLmxhc3RIb3ZlclRhcmdldC5yZW1vdmVDbGFzcyhcImhvdmVyXCIpXHJcbiAgICB0aGlzLmxhc3RIb3ZlclRhcmdldD1lLnRhcmdldFxyXG4gICAgZS50YXJnZXQuYWRkQ2xhc3MoXCJob3ZlclwiKVxyXG4gICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwic2hvd0luZm9TZWxlY3RlZE5vZGVzXCIsIFwiaW5mb1wiOiBbaW5mb10gfSlcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLm1vdXNlT3V0RnVuY3Rpb249IGZ1bmN0aW9uIChlKSB7XHJcbiAgICBpZihnbG9iYWxDYWNoZS5zaG93aW5nQ3JlYXRlVHdpbk1vZGVsSUQpe1xyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInNob3dJbmZvR3JvdXBOb2RlXCIsIFwiaW5mb1wiOiB7XCJAaWRcIjpnbG9iYWxDYWNoZS5zaG93aW5nQ3JlYXRlVHdpbk1vZGVsSUR9IH0pXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB0aGlzLnNlbGVjdEZ1bmN0aW9uKClcclxuICAgIH1cclxuICAgIGlmKHRoaXMubGFzdEhvdmVyVGFyZ2V0KXtcclxuICAgICAgICB0aGlzLmxhc3RIb3ZlclRhcmdldC5yZW1vdmVDbGFzcyhcImhvdmVyXCIpXHJcbiAgICAgICAgdGhpcy5sYXN0SG92ZXJUYXJnZXQ9bnVsbDtcclxuICAgIH0gXHJcblxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuc2VsZWN0RnVuY3Rpb24gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgYXJyID0gdGhpcy5jb3JlLiQoXCI6c2VsZWN0ZWRcIilcclxuICAgIGlmIChhcnIubGVuZ3RoID09IDApIHJldHVyblxyXG4gICAgdmFyIHJlID0gW11cclxuICAgIGFyci5mb3JFYWNoKChlbGUpID0+IHsgcmUucHVzaChlbGUuZGF0YSgpLm9yaWdpbmFsSW5mbykgfSlcclxuICAgIGdsb2JhbENhY2hlLnNob3dpbmdDcmVhdGVUd2luTW9kZWxJRD1udWxsOyBcclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInNob3dJbmZvU2VsZWN0ZWROb2Rlc1wiLCBpbmZvOiByZSB9KVxyXG5cclxuICAgIC8vZm9yIGRlYnVnZ2luZyBwdXJwb3NlXHJcbiAgICAvL2Fyci5mb3JFYWNoKChlbGUpPT57XHJcbiAgICAvLyAgY29uc29sZS5sb2coXCJcIilcclxuICAgIC8vfSlcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmdldEZvbnRTaXplSW5DdXJyZW50Wm9vbT1mdW5jdGlvbigpe1xyXG4gICAgdmFyIGN1clpvb209dGhpcy5jb3JlLnpvb20oKVxyXG4gICAgaWYoY3VyWm9vbT4xKXtcclxuICAgICAgICB2YXIgbWF4RlM9MTJcclxuICAgICAgICB2YXIgbWluRlM9NVxyXG4gICAgICAgIHZhciByYXRpbz0gKG1heEZTL21pbkZTLTEpLzkqKGN1clpvb20tMSkrMVxyXG4gICAgICAgIHZhciBmcz1NYXRoLmNlaWwobWF4RlMvcmF0aW8pXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB2YXIgbWF4RlM9MTIwXHJcbiAgICAgICAgdmFyIG1pbkZTPTEyXHJcbiAgICAgICAgdmFyIHJhdGlvPSAobWF4RlMvbWluRlMtMSkvOSooMS9jdXJab29tLTEpKzFcclxuICAgICAgICB2YXIgZnM9TWF0aC5jZWlsKG1pbkZTKnJhdGlvKVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZzO1xyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuZ2V0Tm9kZVNpemVJbkN1cnJlbnRab29tPWZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgY3VyWm9vbT10aGlzLmNvcmUuem9vbSgpXHJcbiAgICBpZihjdXJab29tPjEpey8vc2NhbGUgdXAgYnV0IG5vdCB0b28gbXVjaFxyXG4gICAgICAgIHZhciByYXRpbz0gKGN1clpvb20tMSkqKDItMSkvOSsxXHJcbiAgICAgICAgcmV0dXJuIE1hdGguY2VpbCh0aGlzLmRlZmF1bHROb2RlU2l6ZS9yYXRpbylcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHZhciByYXRpbz0gKDEvY3VyWm9vbS0xKSooNC0xKS85KzFcclxuICAgICAgICByZXR1cm4gTWF0aC5jZWlsKHRoaXMuZGVmYXVsdE5vZGVTaXplKnJhdGlvKVxyXG4gICAgfVxyXG59XHJcblxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnVwZGF0ZU1vZGVsQXZhcnRhPWZ1bmN0aW9uKG1vZGVsSUQsZGF0YVVybCl7XHJcbiAgICB0cnl7XHJcbiAgICAgICAgdGhpcy5jb3JlLnN0eWxlKCkgXHJcbiAgICAgICAgLnNlbGVjdG9yKCdub2RlW21vZGVsSUQgPSBcIicrbW9kZWxJRCsnXCJdJylcclxuICAgICAgICAuc3R5bGUoeydiYWNrZ3JvdW5kLWltYWdlJzogZGF0YVVybH0pXHJcbiAgICAgICAgLnVwZGF0ZSgpICAgXHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgXHJcbiAgICB9XHJcbiAgICBcclxufVxyXG50b3BvbG9neURPTS5wcm90b3R5cGUudXBkYXRlTW9kZWxUd2luQ29sb3I9ZnVuY3Rpb24obW9kZWxJRCxjb2xvckNvZGUpe1xyXG4gICAgdGhpcy5jb3JlLnN0eWxlKClcclxuICAgICAgICAuc2VsZWN0b3IoJ25vZGVbbW9kZWxJRCA9IFwiJyttb2RlbElEKydcIl0nKVxyXG4gICAgICAgIC5zdHlsZSh7J2JhY2tncm91bmQtY29sb3InOiBjb2xvckNvZGV9KVxyXG4gICAgICAgIC51cGRhdGUoKSAgIFxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUudXBkYXRlTW9kZWxUd2luU2hhcGU9ZnVuY3Rpb24obW9kZWxJRCxzaGFwZSl7XHJcbiAgICB0aGlzLmNvcmUuc3R5bGUoKVxyXG4gICAgICAgIC5zZWxlY3Rvcignbm9kZVttb2RlbElEID0gXCInK21vZGVsSUQrJ1wiXScpXHJcbiAgICAgICAgLnN0eWxlKHsnc2hhcGUnOiBzaGFwZX0pXHJcbiAgICAgICAgLnVwZGF0ZSgpICAgXHJcbn1cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnVwZGF0ZU1vZGVsVHdpbkRpbWVuc2lvbj1mdW5jdGlvbihtb2RlbElELGRpbWVuc2lvblJhdGlvKXtcclxuICAgIHRoaXMubm9kZVNpemVNb2RlbEFkanVzdG1lbnRSYXRpb1ttb2RlbElEXT1wYXJzZUZsb2F0KGRpbWVuc2lvblJhdGlvKVxyXG4gICAgdGhpcy5jb3JlLnRyaWdnZXIoXCJ6b29tXCIpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS51cGRhdGVSZWxhdGlvbnNoaXBDb2xvcj1mdW5jdGlvbihzcmNNb2RlbElELHJlbGF0aW9uc2hpcE5hbWUsY29sb3JDb2RlKXtcclxuICAgIHRoaXMuY29yZS5zdHlsZSgpXHJcbiAgICAgICAgLnNlbGVjdG9yKCdlZGdlW3NvdXJjZU1vZGVsID0gXCInK3NyY01vZGVsSUQrJ1wiXVtyZWxhdGlvbnNoaXBOYW1lID0gXCInK3JlbGF0aW9uc2hpcE5hbWUrJ1wiXScpXHJcbiAgICAgICAgLnN0eWxlKHsnbGluZS1jb2xvcic6IGNvbG9yQ29kZX0pXHJcbiAgICAgICAgLnVwZGF0ZSgpICAgXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS51cGRhdGVSZWxhdGlvbnNoaXBTaGFwZT1mdW5jdGlvbihzcmNNb2RlbElELHJlbGF0aW9uc2hpcE5hbWUsc2hhcGUpe1xyXG4gICAgdGhpcy5jb3JlLnN0eWxlKClcclxuICAgICAgICAuc2VsZWN0b3IoJ2VkZ2Vbc291cmNlTW9kZWwgPSBcIicrc3JjTW9kZWxJRCsnXCJdW3JlbGF0aW9uc2hpcE5hbWUgPSBcIicrcmVsYXRpb25zaGlwTmFtZSsnXCJdJylcclxuICAgICAgICAuc3R5bGUoeydsaW5lLXN0eWxlJzogc2hhcGV9KVxyXG4gICAgICAgIC51cGRhdGUoKSAgIFxyXG59XHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS51cGRhdGVSZWxhdGlvbnNoaXBXaWR0aD1mdW5jdGlvbihzcmNNb2RlbElELHJlbGF0aW9uc2hpcE5hbWUsZWRnZVdpZHRoKXtcclxuICAgIHRoaXMuY29yZS5zdHlsZSgpXHJcbiAgICAgICAgLnNlbGVjdG9yKCdlZGdlW3NvdXJjZU1vZGVsID0gXCInK3NyY01vZGVsSUQrJ1wiXVtyZWxhdGlvbnNoaXBOYW1lID0gXCInK3JlbGF0aW9uc2hpcE5hbWUrJ1wiXScpXHJcbiAgICAgICAgLnN0eWxlKHsnd2lkdGgnOnBhcnNlRmxvYXQoZWRnZVdpZHRoKX0pXHJcbiAgICAgICAgLnVwZGF0ZSgpICAgXHJcbiAgICB0aGlzLmNvcmUuc3R5bGUoKVxyXG4gICAgICAgIC5zZWxlY3RvcignZWRnZTpzZWxlY3RlZFtzb3VyY2VNb2RlbCA9IFwiJytzcmNNb2RlbElEKydcIl1bcmVsYXRpb25zaGlwTmFtZSA9IFwiJytyZWxhdGlvbnNoaXBOYW1lKydcIl0nKVxyXG4gICAgICAgIC5zdHlsZSh7J3dpZHRoJzpwYXJzZUZsb2F0KGVkZ2VXaWR0aCkrMSwnbGluZS1jb2xvcic6ICdyZWQnfSlcclxuICAgICAgICAudXBkYXRlKCkgICBcclxuICAgIHRoaXMuY29yZS5zdHlsZSgpXHJcbiAgICAgICAgLnNlbGVjdG9yKCdlZGdlLmhvdmVyW3NvdXJjZU1vZGVsID0gXCInK3NyY01vZGVsSUQrJ1wiXVtyZWxhdGlvbnNoaXBOYW1lID0gXCInK3JlbGF0aW9uc2hpcE5hbWUrJ1wiXScpXHJcbiAgICAgICAgLnN0eWxlKHsnd2lkdGgnOnBhcnNlRmxvYXQoZWRnZVdpZHRoKSsyfSlcclxuICAgICAgICAudXBkYXRlKCkgICBcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmRlbGV0ZVJlbGF0aW9ucz1mdW5jdGlvbihyZWxhdGlvbnMpe1xyXG4gICAgcmVsYXRpb25zLmZvckVhY2gob25lUmVsYXRpb249PntcclxuICAgICAgICB2YXIgc3JjSUQ9b25lUmVsYXRpb25bXCJzcmNJRFwiXVxyXG4gICAgICAgIHZhciByZWxhdGlvbklEPW9uZVJlbGF0aW9uW1wicmVsSURcIl1cclxuICAgICAgICB2YXIgdGhlTm9kZU5hbWU9Z2xvYmFsQ2FjaGUudHdpbklETWFwVG9EaXNwbGF5TmFtZVtzcmNJRF1cclxuICAgICAgICB2YXIgdGhlTm9kZT10aGlzLmNvcmUuZmlsdGVyKCdbaWQgPSBcIicrdGhlTm9kZU5hbWUrJ1wiXScpO1xyXG4gICAgICAgIHZhciBlZGdlcz10aGVOb2RlLmNvbm5lY3RlZEVkZ2VzKCkudG9BcnJheSgpXHJcbiAgICAgICAgZm9yKHZhciBpPTA7aTxlZGdlcy5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgdmFyIGFuRWRnZT1lZGdlc1tpXVxyXG4gICAgICAgICAgICBpZihhbkVkZ2UuZGF0YShcIm9yaWdpbmFsSW5mb1wiKVtcIiRyZWxhdGlvbnNoaXBJZFwiXT09cmVsYXRpb25JRCl7XHJcbiAgICAgICAgICAgICAgICBhbkVkZ2UucmVtb3ZlKClcclxuICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KSAgIFxyXG59XHJcblxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmRlbGV0ZVR3aW5zPWZ1bmN0aW9uKHR3aW5JREFycil7XHJcbiAgICB0d2luSURBcnIuZm9yRWFjaCh0d2luSUQ9PntcclxuICAgICAgICB2YXIgdHdpbkRpc3BsYXlOYW1lPWdsb2JhbENhY2hlLnR3aW5JRE1hcFRvRGlzcGxheU5hbWVbdHdpbklEXVxyXG4gICAgICAgIHRoaXMuY29yZS4kKCdbaWQgPSBcIicrdHdpbkRpc3BsYXlOYW1lKydcIl0nKS5yZW1vdmUoKVxyXG4gICAgfSkgICBcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmFuaW1hdGVBTm9kZT1mdW5jdGlvbih0d2luKXtcclxuICAgIHZhciBjdXJEaW1lbnNpb249IHR3aW4ud2lkdGgoKVxyXG4gICAgdHdpbi5hbmltYXRlKHtcclxuICAgICAgICBzdHlsZTogeyAnaGVpZ2h0JzogY3VyRGltZW5zaW9uKjIsJ3dpZHRoJzogY3VyRGltZW5zaW9uKjIgfSxcclxuICAgICAgICBkdXJhdGlvbjogMjAwXHJcbiAgICB9KTtcclxuXHJcbiAgICBzZXRUaW1lb3V0KCgpPT57XHJcbiAgICAgICAgdHdpbi5hbmltYXRlKHtcclxuICAgICAgICAgICAgc3R5bGU6IHsgJ2hlaWdodCc6IGN1ckRpbWVuc2lvbiwnd2lkdGgnOiBjdXJEaW1lbnNpb24gfSxcclxuICAgICAgICAgICAgZHVyYXRpb246IDIwMFxyXG4gICAgICAgICAgICAsY29tcGxldGU6KCk9PntcclxuICAgICAgICAgICAgICAgIHR3aW4ucmVtb3ZlU3R5bGUoKSAvL211c3QgcmVtb3ZlIHRoZSBzdHlsZSBhZnRlciBhbmltYXRpb24sIG90aGVyd2lzZSB0aGV5IHdpbGwgaGF2ZSB0aGVpciBvd24gc3R5bGVcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSwyMDApXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5kcmF3VHdpbnM9ZnVuY3Rpb24odHdpbnNEYXRhLGFuaW1hdGlvbil7XHJcbiAgICB2YXIgYXJyPVtdXHJcbiAgICBmb3IodmFyIGk9MDtpPHR3aW5zRGF0YS5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIgb3JpZ2luYWxJbmZvPXR3aW5zRGF0YVtpXTtcclxuICAgICAgICB2YXIgbmV3Tm9kZT17ZGF0YTp7fSxncm91cDpcIm5vZGVzXCJ9XHJcbiAgICAgICAgbmV3Tm9kZS5kYXRhW1wib3JpZ2luYWxJbmZvXCJdPSBvcmlnaW5hbEluZm87XHJcbiAgICAgICAgbmV3Tm9kZS5kYXRhW1wiaWRcIl09b3JpZ2luYWxJbmZvWydkaXNwbGF5TmFtZSddXHJcbiAgICAgICAgdmFyIG1vZGVsSUQ9b3JpZ2luYWxJbmZvWyckbWV0YWRhdGEnXVsnJG1vZGVsJ11cclxuICAgICAgICBuZXdOb2RlLmRhdGFbXCJtb2RlbElEXCJdPW1vZGVsSURcclxuICAgICAgICBhcnIucHVzaChuZXdOb2RlKVxyXG4gICAgfVxyXG5cclxuICAgIHZhciBlbGVzID0gdGhpcy5jb3JlLmFkZChhcnIpXHJcbiAgICBpZihlbGVzLnNpemUoKT09MCkgcmV0dXJuIGVsZXNcclxuICAgIHRoaXMubm9Qb3NpdGlvbl9ncmlkKGVsZXMpXHJcbiAgICBpZihhbmltYXRpb24pe1xyXG4gICAgICAgIGVsZXMuZm9yRWFjaCgoZWxlKT0+eyB0aGlzLmFuaW1hdGVBTm9kZShlbGUpIH0pXHJcbiAgICB9XHJcblxyXG4gICAgLy9pZiB0aGVyZSBpcyBjdXJyZW50bHkgYSBsYXlvdXQgdGhlcmUsIGFwcGx5IGl0XHJcbiAgICB0aGlzLmFwcGx5TmV3TGF5b3V0KClcclxuXHJcbiAgICByZXR1cm4gZWxlc1xyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuZHJhd1JlbGF0aW9ucz1mdW5jdGlvbihyZWxhdGlvbnNEYXRhKXtcclxuICAgIHZhciByZWxhdGlvbkluZm9BcnI9W11cclxuICAgIGZvcih2YXIgaT0wO2k8cmVsYXRpb25zRGF0YS5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIgb3JpZ2luYWxJbmZvPXJlbGF0aW9uc0RhdGFbaV07XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIHRoZUlEPW9yaWdpbmFsSW5mb1snJHJlbGF0aW9uc2hpcE5hbWUnXStcIl9cIitvcmlnaW5hbEluZm9bJyRyZWxhdGlvbnNoaXBJZCddXHJcbiAgICAgICAgdmFyIGFSZWxhdGlvbj17ZGF0YTp7fSxncm91cDpcImVkZ2VzXCJ9XHJcbiAgICAgICAgYVJlbGF0aW9uLmRhdGFbXCJvcmlnaW5hbEluZm9cIl09b3JpZ2luYWxJbmZvXHJcbiAgICAgICAgYVJlbGF0aW9uLmRhdGFbXCJpZFwiXT10aGVJRFxyXG4gICAgICAgIGFSZWxhdGlvbi5kYXRhW1wic291cmNlXCJdPWdsb2JhbENhY2hlLnR3aW5JRE1hcFRvRGlzcGxheU5hbWVbb3JpZ2luYWxJbmZvWyckc291cmNlSWQnXV1cclxuICAgICAgICBhUmVsYXRpb24uZGF0YVtcInRhcmdldFwiXT1nbG9iYWxDYWNoZS50d2luSURNYXBUb0Rpc3BsYXlOYW1lW29yaWdpbmFsSW5mb1snJHRhcmdldElkJ11dXHJcblxyXG5cclxuICAgICAgICBpZih0aGlzLmNvcmUuJChcIiNcIithUmVsYXRpb24uZGF0YVtcInNvdXJjZVwiXSkubGVuZ3RoPT0wIHx8IHRoaXMuY29yZS4kKFwiI1wiK2FSZWxhdGlvbi5kYXRhW1widGFyZ2V0XCJdKS5sZW5ndGg9PTApIGNvbnRpbnVlXHJcbiAgICAgICAgdmFyIHNvdXJjZU5vZGU9dGhpcy5jb3JlLiQoXCIjXCIrYVJlbGF0aW9uLmRhdGFbXCJzb3VyY2VcIl0pXHJcbiAgICAgICAgdmFyIHNvdXJjZU1vZGVsPXNvdXJjZU5vZGVbMF0uZGF0YShcIm9yaWdpbmFsSW5mb1wiKVsnJG1ldGFkYXRhJ11bJyRtb2RlbCddXHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9hZGQgYWRkaXRpb25hbCBzb3VyY2Ugbm9kZSBpbmZvcm1hdGlvbiB0byB0aGUgb3JpZ2luYWwgcmVsYXRpb25zaGlwIGluZm9ybWF0aW9uXHJcbiAgICAgICAgb3JpZ2luYWxJbmZvWydzb3VyY2VNb2RlbCddPXNvdXJjZU1vZGVsXHJcbiAgICAgICAgYVJlbGF0aW9uLmRhdGFbXCJzb3VyY2VNb2RlbFwiXT1zb3VyY2VNb2RlbFxyXG4gICAgICAgIGFSZWxhdGlvbi5kYXRhW1wicmVsYXRpb25zaGlwTmFtZVwiXT1vcmlnaW5hbEluZm9bJyRyZWxhdGlvbnNoaXBOYW1lJ11cclxuXHJcbiAgICAgICAgdmFyIGV4aXN0RWRnZT10aGlzLmNvcmUuJCgnZWRnZVtpZCA9IFwiJyt0aGVJRCsnXCJdJylcclxuICAgICAgICBpZihleGlzdEVkZ2Uuc2l6ZSgpPjApIHtcclxuICAgICAgICAgICAgZXhpc3RFZGdlLmRhdGEoXCJvcmlnaW5hbEluZm9cIixvcmlnaW5hbEluZm8pXHJcbiAgICAgICAgICAgIGNvbnRpbnVlOyAgLy9ubyBuZWVkIHRvIGRyYXcgaXRcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlbGF0aW9uSW5mb0Fyci5wdXNoKGFSZWxhdGlvbilcclxuICAgIH1cclxuICAgIGlmKHJlbGF0aW9uSW5mb0Fyci5sZW5ndGg9PTApIHJldHVybiBudWxsO1xyXG5cclxuICAgIHZhciBlZGdlcz10aGlzLmNvcmUuYWRkKHJlbGF0aW9uSW5mb0FycilcclxuICAgIHJldHVybiBlZGdlc1xyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUucmV2aWV3U3RvcmVkUmVsYXRpb25zaGlwc1RvRHJhdz1mdW5jdGlvbigpe1xyXG4gICAgLy9jaGVjayB0aGUgc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzIGFnYWluIGFuZCBtYXliZSBzb21lIG9mIHRoZW0gY2FuIGJlIGRyYXduIG5vdyBzaW5jZSB0YXJnZXROb2RlIGlzIGF2YWlsYWJsZVxyXG4gICAgdmFyIHN0b3JlZFJlbGF0aW9uQXJyPVtdXHJcbiAgICBmb3IodmFyIHR3aW5JRCBpbiBnbG9iYWxDYWNoZS5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHMpe1xyXG4gICAgICAgIHN0b3JlZFJlbGF0aW9uQXJyPXN0b3JlZFJlbGF0aW9uQXJyLmNvbmNhdChnbG9iYWxDYWNoZS5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbdHdpbklEXSlcclxuICAgIH1cclxuICAgIHRoaXMuZHJhd1JlbGF0aW9ucyhzdG9yZWRSZWxhdGlvbkFycilcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmRyYXdUd2luc0FuZFJlbGF0aW9ucz1mdW5jdGlvbihkYXRhKXtcclxuICAgIHZhciB0d2luc0FuZFJlbGF0aW9ucz1kYXRhLmNoaWxkVHdpbnNBbmRSZWxhdGlvbnNcclxuXHJcbiAgICAvL2RyYXcgdGhvc2UgbmV3IHR3aW5zIGZpcnN0XHJcbiAgICB0d2luc0FuZFJlbGF0aW9ucy5mb3JFYWNoKG9uZVNldD0+e1xyXG4gICAgICAgIHZhciB0d2luSW5mb0Fycj1bXVxyXG4gICAgICAgIGZvcih2YXIgaW5kIGluIG9uZVNldC5jaGlsZFR3aW5zKSB0d2luSW5mb0Fyci5wdXNoKG9uZVNldC5jaGlsZFR3aW5zW2luZF0pXHJcbiAgICAgICAgdmFyIGVsZXM9dGhpcy5kcmF3VHdpbnModHdpbkluZm9BcnIsXCJhbmltYXRpb25cIilcclxuICAgIH0pXHJcblxyXG4gICAgLy9kcmF3IHRob3NlIGtub3duIHR3aW5zIGZyb20gdGhlIHJlbGF0aW9uc2hpcHNcclxuICAgIHZhciB0d2luc0luZm89e31cclxuICAgIHR3aW5zQW5kUmVsYXRpb25zLmZvckVhY2gob25lU2V0PT57XHJcbiAgICAgICAgdmFyIHJlbGF0aW9uc0luZm89b25lU2V0W1wicmVsYXRpb25zaGlwc1wiXVxyXG4gICAgICAgIHJlbGF0aW9uc0luZm8uZm9yRWFjaCgob25lUmVsYXRpb24pPT57XHJcbiAgICAgICAgICAgIHZhciBzcmNJRD1vbmVSZWxhdGlvblsnJHNvdXJjZUlkJ11cclxuICAgICAgICAgICAgdmFyIHRhcmdldElEPW9uZVJlbGF0aW9uWyckdGFyZ2V0SWQnXVxyXG4gICAgICAgICAgICBpZihnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1tzcmNJRF0pXHJcbiAgICAgICAgICAgICAgICB0d2luc0luZm9bc3JjSURdID0gZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbc3JjSURdXHJcbiAgICAgICAgICAgIGlmKGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3RhcmdldElEXSlcclxuICAgICAgICAgICAgICAgIHR3aW5zSW5mb1t0YXJnZXRJRF0gPSBnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1t0YXJnZXRJRF0gICAgXHJcbiAgICAgICAgfSlcclxuICAgIH0pXHJcbiAgICB2YXIgdG1wQXJyPVtdXHJcbiAgICBmb3IodmFyIHR3aW5JRCBpbiB0d2luc0luZm8pIHRtcEFyci5wdXNoKHR3aW5zSW5mb1t0d2luSURdKVxyXG4gICAgdGhpcy5kcmF3VHdpbnModG1wQXJyKVxyXG5cclxuICAgIC8vdGhlbiBjaGVjayBhbGwgc3RvcmVkIHJlbGF0aW9uc2hpcHMgYW5kIGRyYXcgaWYgaXQgY2FuIGJlIGRyYXduXHJcbiAgICB0aGlzLnJldmlld1N0b3JlZFJlbGF0aW9uc2hpcHNUb0RyYXcoKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuYXBwbHlWaXN1YWxEZWZpbml0aW9uPWZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgdmlzdWFsSnNvbj1nbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW1wiZGVmYXVsdFwiXVxyXG4gICAgaWYodmlzdWFsSnNvbj09bnVsbCkgcmV0dXJuO1xyXG4gICAgZm9yKHZhciBtb2RlbElEIGluIHZpc3VhbEpzb24pe1xyXG4gICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF0uY29sb3IpIHRoaXMudXBkYXRlTW9kZWxUd2luQ29sb3IobW9kZWxJRCx2aXN1YWxKc29uW21vZGVsSURdLmNvbG9yKVxyXG4gICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF0uc2hhcGUpIHRoaXMudXBkYXRlTW9kZWxUd2luU2hhcGUobW9kZWxJRCx2aXN1YWxKc29uW21vZGVsSURdLnNoYXBlKVxyXG4gICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF0uYXZhcnRhKSB0aGlzLnVwZGF0ZU1vZGVsQXZhcnRhKG1vZGVsSUQsdmlzdWFsSnNvblttb2RlbElEXS5hdmFydGEpXHJcbiAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXS5kaW1lbnNpb25SYXRpbykgdGhpcy51cGRhdGVNb2RlbFR3aW5EaW1lbnNpb24obW9kZWxJRCx2aXN1YWxKc29uW21vZGVsSURdLmRpbWVuc2lvblJhdGlvKVxyXG4gICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF0ucmVscyl7XHJcbiAgICAgICAgICAgIGZvcih2YXIgcmVsYXRpb25zaGlwTmFtZSBpbiB2aXN1YWxKc29uW21vZGVsSURdLnJlbHMpe1xyXG4gICAgICAgICAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpb25zaGlwTmFtZV0uY29sb3Ipe1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlUmVsYXRpb25zaGlwQ29sb3IobW9kZWxJRCxyZWxhdGlvbnNoaXBOYW1lLHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW9uc2hpcE5hbWVdLmNvbG9yKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpb25zaGlwTmFtZV0uc2hhcGUpe1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlUmVsYXRpb25zaGlwU2hhcGUobW9kZWxJRCxyZWxhdGlvbnNoaXBOYW1lLHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW9uc2hpcE5hbWVdLnNoYXBlKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpb25zaGlwTmFtZV0uZWRnZVdpZHRoKXtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVJlbGF0aW9uc2hpcFdpZHRoKG1vZGVsSUQscmVsYXRpb25zaGlwTmFtZSx2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGlvbnNoaXBOYW1lXS5lZGdlV2lkdGgpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5yeE1lc3NhZ2U9ZnVuY3Rpb24obXNnUGF5bG9hZCl7XHJcbiAgICBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwic3RhcnRTZWxlY3Rpb25fcmVwbGFjZVwiKXtcclxuICAgICAgICB0aGlzLmNvcmUubm9kZXMoKS5yZW1vdmUoKVxyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInJlcGxhY2VBbGxUd2luc1wiKSB7XHJcbiAgICAgICAgdGhpcy5jb3JlLm5vZGVzKCkucmVtb3ZlKClcclxuICAgICAgICB2YXIgZWxlcz0gdGhpcy5kcmF3VHdpbnMobXNnUGF5bG9hZC5pbmZvKVxyXG4gICAgICAgIHRoaXMuY29yZS5jZW50ZXIoZWxlcylcclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJ2aXN1YWxEZWZpbml0aW9uUmVmcmVzaFwiKSB7XHJcbiAgICAgICAgdGhpcy5hcHBseVZpc3VhbERlZmluaXRpb24oKVxyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImFwcGVuZEFsbFR3aW5zXCIpIHtcclxuICAgICAgICB2YXIgZWxlcz0gdGhpcy5kcmF3VHdpbnMobXNnUGF5bG9hZC5pbmZvLFwiYW5pbWF0ZVwiKVxyXG4gICAgICAgIHRoaXMuY29yZS5jZW50ZXIoZWxlcylcclxuICAgICAgICB0aGlzLnJldmlld1N0b3JlZFJlbGF0aW9uc2hpcHNUb0RyYXcoKVxyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImRyYXdBbGxSZWxhdGlvbnNcIil7XHJcbiAgICAgICAgdmFyIGVkZ2VzPSB0aGlzLmRyYXdSZWxhdGlvbnMobXNnUGF5bG9hZC5pbmZvKVxyXG4gICAgICAgIGlmKGVkZ2VzIT1udWxsKSB7XHJcbiAgICAgICAgICAgIGlmKGdsb2JhbENhY2hlLmN1cnJlbnRMYXlvdXROYW1lPT1udWxsKSAgdGhpcy5ub1Bvc2l0aW9uX2Nvc2UoKVxyXG4gICAgICAgIH1cclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJhZGROZXdUd2luXCIpIHtcclxuICAgICAgICB0aGlzLmRyYXdUd2lucyhbbXNnUGF5bG9hZC50d2luSW5mb10sXCJhbmltYXRpb25cIilcclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJhZGROZXdUd2luc1wiKSB7XHJcbiAgICAgICAgdGhpcy5kcmF3VHdpbnMobXNnUGF5bG9hZC50d2luc0luZm8sXCJhbmltYXRpb25cIilcclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJkcmF3VHdpbnNBbmRSZWxhdGlvbnNcIikgdGhpcy5kcmF3VHdpbnNBbmRSZWxhdGlvbnMobXNnUGF5bG9hZC5pbmZvKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwic2hvd0luZm9TZWxlY3RlZE5vZGVzXCIpeyAvL2Zyb20gc2VsZWN0aW5nIHR3aW5zIGluIHRoZSB0d2ludHJlZVxyXG4gICAgICAgIHRoaXMuY29yZS5ub2RlcygpLnVuc2VsZWN0KClcclxuICAgICAgICB0aGlzLmNvcmUuZWRnZXMoKS51bnNlbGVjdCgpXHJcbiAgICAgICAgdmFyIGFycj1tc2dQYXlsb2FkLmluZm87XHJcbiAgICAgICAgdmFyIG1vdXNlQ2xpY2tEZXRhaWw9bXNnUGF5bG9hZC5tb3VzZUNsaWNrRGV0YWlsO1xyXG4gICAgICAgIGFyci5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgICAgICB2YXIgYVR3aW49IHRoaXMuY29yZS5ub2RlcyhcIiNcIitlbGVtZW50WydkaXNwbGF5TmFtZSddKVxyXG4gICAgICAgICAgICBhVHdpbi5zZWxlY3QoKVxyXG4gICAgICAgICAgICBpZihtb3VzZUNsaWNrRGV0YWlsIT0yKSB0aGlzLmFuaW1hdGVBTm9kZShhVHdpbikgLy9pZ25vcmUgZG91YmxlIGNsaWNrIHNlY29uZCBjbGlja1xyXG4gICAgICAgIH0pO1xyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cIlBhblRvTm9kZVwiKXtcclxuICAgICAgICB2YXIgbm9kZUluZm89IG1zZ1BheWxvYWQuaW5mbztcclxuICAgICAgICB2YXIgdG9wb05vZGU9IHRoaXMuY29yZS5ub2RlcyhcIiNcIitub2RlSW5mb1tcIiRkdElkXCJdKVxyXG4gICAgICAgIGlmKHRvcG9Ob2RlKXtcclxuICAgICAgICAgICAgdGhpcy5jb3JlLmNlbnRlcih0b3BvTm9kZSlcclxuICAgICAgICB9XHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwidmlzdWFsRGVmaW5pdGlvbkNoYW5nZVwiKXtcclxuICAgICAgICBpZihtc2dQYXlsb2FkLnNyY01vZGVsSUQpe1xyXG4gICAgICAgICAgICBpZihtc2dQYXlsb2FkLmNvbG9yKSB0aGlzLnVwZGF0ZVJlbGF0aW9uc2hpcENvbG9yKG1zZ1BheWxvYWQuc3JjTW9kZWxJRCxtc2dQYXlsb2FkLnJlbGF0aW9uc2hpcE5hbWUsbXNnUGF5bG9hZC5jb2xvcilcclxuICAgICAgICAgICAgZWxzZSBpZihtc2dQYXlsb2FkLnNoYXBlKSB0aGlzLnVwZGF0ZVJlbGF0aW9uc2hpcFNoYXBlKG1zZ1BheWxvYWQuc3JjTW9kZWxJRCxtc2dQYXlsb2FkLnJlbGF0aW9uc2hpcE5hbWUsbXNnUGF5bG9hZC5zaGFwZSlcclxuICAgICAgICAgICAgZWxzZSBpZihtc2dQYXlsb2FkLmVkZ2VXaWR0aCkgdGhpcy51cGRhdGVSZWxhdGlvbnNoaXBXaWR0aChtc2dQYXlsb2FkLnNyY01vZGVsSUQsbXNnUGF5bG9hZC5yZWxhdGlvbnNoaXBOYW1lLG1zZ1BheWxvYWQuZWRnZVdpZHRoKVxyXG4gICAgICAgIH0gXHJcbiAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgaWYobXNnUGF5bG9hZC5jb2xvcikgdGhpcy51cGRhdGVNb2RlbFR3aW5Db2xvcihtc2dQYXlsb2FkLm1vZGVsSUQsbXNnUGF5bG9hZC5jb2xvcilcclxuICAgICAgICAgICAgZWxzZSBpZihtc2dQYXlsb2FkLnNoYXBlKSB0aGlzLnVwZGF0ZU1vZGVsVHdpblNoYXBlKG1zZ1BheWxvYWQubW9kZWxJRCxtc2dQYXlsb2FkLnNoYXBlKVxyXG4gICAgICAgICAgICBlbHNlIGlmKG1zZ1BheWxvYWQuYXZhcnRhKSB0aGlzLnVwZGF0ZU1vZGVsQXZhcnRhKG1zZ1BheWxvYWQubW9kZWxJRCxtc2dQYXlsb2FkLmF2YXJ0YSlcclxuICAgICAgICAgICAgZWxzZSBpZihtc2dQYXlsb2FkLm5vQXZhcnRhKSAgdGhpcy51cGRhdGVNb2RlbEF2YXJ0YShtc2dQYXlsb2FkLm1vZGVsSUQsbnVsbClcclxuICAgICAgICAgICAgZWxzZSBpZihtc2dQYXlsb2FkLmRpbWVuc2lvblJhdGlvKSAgdGhpcy51cGRhdGVNb2RlbFR3aW5EaW1lbnNpb24obXNnUGF5bG9hZC5tb2RlbElELG1zZ1BheWxvYWQuZGltZW5zaW9uUmF0aW8pXHJcbiAgICAgICAgfSBcclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJ0d2luc0RlbGV0ZWRcIikgdGhpcy5kZWxldGVUd2lucyhtc2dQYXlsb2FkLnR3aW5JREFycilcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInJlbGF0aW9uc0RlbGV0ZWRcIikgdGhpcy5kZWxldGVSZWxhdGlvbnMobXNnUGF5bG9hZC5yZWxhdGlvbnMpXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJjb25uZWN0VG9cIil7IHRoaXMuc3RhcnRUYXJnZXROb2RlTW9kZShcImNvbm5lY3RUb1wiKSAgIH1cclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImNvbm5lY3RGcm9tXCIpeyB0aGlzLnN0YXJ0VGFyZ2V0Tm9kZU1vZGUoXCJjb25uZWN0RnJvbVwiKSAgIH1cclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImFkZFNlbGVjdE91dGJvdW5kXCIpeyB0aGlzLnNlbGVjdE91dGJvdW5kTm9kZXMoKSAgIH1cclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImFkZFNlbGVjdEluYm91bmRcIil7IHRoaXMuc2VsZWN0SW5ib3VuZE5vZGVzKCkgICB9XHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJoaWRlU2VsZWN0ZWROb2Rlc1wiKXsgdGhpcy5oaWRlU2VsZWN0ZWROb2RlcygpICAgfVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiQ09TRVNlbGVjdGVkTm9kZXNcIil7IHRoaXMuQ09TRVNlbGVjdGVkTm9kZXMoKSAgIH1cclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInNhdmVMYXlvdXRcIil7IHRoaXMuc2F2ZUxheW91dChtc2dQYXlsb2FkLmxheW91dE5hbWUpICAgfVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwibGF5b3V0Q2hhbmdlXCIpeyB0aGlzLmFwcGx5TmV3TGF5b3V0KCkgICB9XHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5hcHBseU5ld0xheW91dCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBsYXlvdXROYW1lPWdsb2JhbENhY2hlLmN1cnJlbnRMYXlvdXROYW1lXHJcbiAgICBcclxuICAgIHZhciBsYXlvdXREZXRhaWw9IGdsb2JhbENhY2hlLmxheW91dEpTT05bbGF5b3V0TmFtZV1cclxuICAgIFxyXG4gICAgLy9yZW1vdmUgYWxsIGJlbmRpbmcgZWRnZSBcclxuICAgIHRoaXMuY29yZS5lZGdlcygpLmZvckVhY2gob25lRWRnZT0+e1xyXG4gICAgICAgIG9uZUVkZ2UucmVtb3ZlQ2xhc3MoJ2VkZ2ViZW5kZWRpdGluZy1oYXNiZW5kcG9pbnRzJylcclxuICAgICAgICBvbmVFZGdlLnJlbW92ZUNsYXNzKCdlZGdlY29udHJvbGVkaXRpbmctaGFzY29udHJvbHBvaW50cycpXHJcbiAgICB9KVxyXG4gICAgXHJcbiAgICBpZihsYXlvdXREZXRhaWw9PW51bGwpIHJldHVybjtcclxuICAgIFxyXG4gICAgdmFyIHN0b3JlZFBvc2l0aW9ucz17fVxyXG4gICAgZm9yKHZhciBpbmQgaW4gbGF5b3V0RGV0YWlsKXtcclxuICAgICAgICBzdG9yZWRQb3NpdGlvbnNbaW5kXT17XHJcbiAgICAgICAgICAgIHg6bGF5b3V0RGV0YWlsW2luZF1bMF1cclxuICAgICAgICAgICAgLHk6bGF5b3V0RGV0YWlsW2luZF1bMV1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB2YXIgbmV3TGF5b3V0PXRoaXMuY29yZS5sYXlvdXQoe1xyXG4gICAgICAgIG5hbWU6ICdwcmVzZXQnLFxyXG4gICAgICAgIHBvc2l0aW9uczpzdG9yZWRQb3NpdGlvbnMsXHJcbiAgICAgICAgZml0OmZhbHNlLFxyXG4gICAgICAgIGFuaW1hdGU6IHRydWUsXHJcbiAgICAgICAgYW5pbWF0aW9uRHVyYXRpb246IDMwMCxcclxuICAgIH0pXHJcbiAgICBuZXdMYXlvdXQucnVuKClcclxuXHJcbiAgICAvL3Jlc3RvcmUgZWRnZXMgYmVuZGluZyBvciBjb250cm9sIHBvaW50c1xyXG4gICAgdmFyIGVkZ2VQb2ludHNEaWN0PWxheW91dERldGFpbFtcImVkZ2VzXCJdXHJcbiAgICBpZihlZGdlUG9pbnRzRGljdD09bnVsbClyZXR1cm47XHJcbiAgICBmb3IodmFyIHNyY0lEIGluIGVkZ2VQb2ludHNEaWN0KXtcclxuICAgICAgICBmb3IodmFyIHJlbGF0aW9uc2hpcElEIGluIGVkZ2VQb2ludHNEaWN0W3NyY0lEXSl7XHJcbiAgICAgICAgICAgIHZhciBvYmo9ZWRnZVBvaW50c0RpY3Rbc3JjSURdW3JlbGF0aW9uc2hpcElEXVxyXG4gICAgICAgICAgICB0aGlzLmFwcGx5RWRnZUJlbmRjb250cm9sUG9pbnRzKHNyY0lELHJlbGF0aW9uc2hpcElELG9ialtcImN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0c1wiXVxyXG4gICAgICAgICAgICAsb2JqW1wiY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXNcIl0sb2JqW1wiY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzXCJdLG9ialtcImN5ZWRnZWNvbnRyb2xlZGl0aW5nRGlzdGFuY2VzXCJdKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmFwcGx5RWRnZUJlbmRjb250cm9sUG9pbnRzID0gZnVuY3Rpb24gKHNyY0lELHJlbGF0aW9uc2hpcElEXHJcbiAgICAsY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzLGN5ZWRnZWJlbmRlZGl0aW5nRGlzdGFuY2VzLGN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cyxjeWVkZ2Vjb250cm9sZWRpdGluZ0Rpc3RhbmNlcykge1xyXG4gICAgICAgIHZhciBub2RlTmFtZT1nbG9iYWxDYWNoZS50d2luSURNYXBUb0Rpc3BsYXlOYW1lW3NyY0lEXVxyXG4gICAgICAgIHZhciB0aGVOb2RlPXRoaXMuY29yZS5maWx0ZXIoJ1tpZCA9IFwiJytub2RlTmFtZSsnXCJdJyk7XHJcbiAgICAgICAgdmFyIGVkZ2VzPXRoZU5vZGUuY29ubmVjdGVkRWRnZXMoKS50b0FycmF5KClcclxuICAgICAgICBmb3IodmFyIGk9MDtpPGVkZ2VzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICB2YXIgYW5FZGdlPWVkZ2VzW2ldXHJcbiAgICAgICAgICAgIGlmKGFuRWRnZS5kYXRhKFwib3JpZ2luYWxJbmZvXCIpW1wiJHJlbGF0aW9uc2hpcElkXCJdPT1yZWxhdGlvbnNoaXBJRCl7XHJcbiAgICAgICAgICAgICAgICBpZihjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHMpe1xyXG4gICAgICAgICAgICAgICAgICAgIGFuRWRnZS5kYXRhKFwiY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzXCIsY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzKVxyXG4gICAgICAgICAgICAgICAgICAgIGFuRWRnZS5kYXRhKFwiY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXNcIixjeWVkZ2ViZW5kZWRpdGluZ0Rpc3RhbmNlcylcclxuICAgICAgICAgICAgICAgICAgICBhbkVkZ2UuYWRkQ2xhc3MoJ2VkZ2ViZW5kZWRpdGluZy1oYXNiZW5kcG9pbnRzJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZihjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHMpe1xyXG4gICAgICAgICAgICAgICAgICAgIGFuRWRnZS5kYXRhKFwiY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzXCIsY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzKVxyXG4gICAgICAgICAgICAgICAgICAgIGFuRWRnZS5kYXRhKFwiY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXNcIixjeWVkZ2Vjb250cm9sZWRpdGluZ0Rpc3RhbmNlcylcclxuICAgICAgICAgICAgICAgICAgICBhbkVkZ2UuYWRkQ2xhc3MoJ2VkZ2Vjb250cm9sZWRpdGluZy1oYXNjb250cm9scG9pbnRzJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbn1cclxuXHJcblxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnNhdmVMYXlvdXQgPSBhc3luYyBmdW5jdGlvbiAobGF5b3V0TmFtZSkge1xyXG4gICAgdmFyIGxheW91dERpY3Q9Z2xvYmFsQ2FjaGUubGF5b3V0SlNPTltsYXlvdXROYW1lXVxyXG4gICAgaWYoIWxheW91dERpY3Qpe1xyXG4gICAgICAgIGxheW91dERpY3Q9Z2xvYmFsQ2FjaGUubGF5b3V0SlNPTltsYXlvdXROYW1lXT17fVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBpZih0aGlzLmNvcmUubm9kZXMoKS5zaXplKCk9PTApIHJldHVybjtcclxuXHJcbiAgICAvL3N0b3JlIG5vZGVzIHBvc2l0aW9uXHJcbiAgICB0aGlzLmNvcmUubm9kZXMoKS5mb3JFYWNoKG9uZU5vZGU9PntcclxuICAgICAgICB2YXIgcG9zaXRpb249b25lTm9kZS5wb3NpdGlvbigpXHJcbiAgICAgICAgbGF5b3V0RGljdFtvbmVOb2RlLmlkKCldPVt0aGlzLm51bWJlclByZWNpc2lvbihwb3NpdGlvblsneCddKSx0aGlzLm51bWJlclByZWNpc2lvbihwb3NpdGlvblsneSddKV1cclxuICAgIH0pXHJcblxyXG4gICAgLy9zdG9yZSBhbnkgZWRnZSBiZW5kaW5nIHBvaW50cyBvciBjb250cm9saW5nIHBvaW50c1xyXG5cclxuICAgIGlmKGxheW91dERpY3QuZWRnZXM9PW51bGwpIGxheW91dERpY3QuZWRnZXM9e31cclxuICAgIHZhciBlZGdlRWRpdEluc3RhbmNlPSB0aGlzLmNvcmUuZWRnZUVkaXRpbmcoJ2dldCcpO1xyXG4gICAgdGhpcy5jb3JlLmVkZ2VzKCkuZm9yRWFjaChvbmVFZGdlPT57XHJcbiAgICAgICAgdmFyIHNyY0lEPW9uZUVkZ2UuZGF0YShcIm9yaWdpbmFsSW5mb1wiKVtcIiRzb3VyY2VJZFwiXVxyXG4gICAgICAgIHZhciByZWxhdGlvbnNoaXBJRD1vbmVFZGdlLmRhdGEoXCJvcmlnaW5hbEluZm9cIilbXCIkcmVsYXRpb25zaGlwSWRcIl1cclxuICAgICAgICB2YXIgY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzPW9uZUVkZ2UuZGF0YSgnY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzJylcclxuICAgICAgICB2YXIgY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXM9b25lRWRnZS5kYXRhKCdjeWVkZ2ViZW5kZWRpdGluZ0Rpc3RhbmNlcycpXHJcbiAgICAgICAgdmFyIGN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cz1vbmVFZGdlLmRhdGEoJ2N5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cycpXHJcbiAgICAgICAgdmFyIGN5ZWRnZWNvbnRyb2xlZGl0aW5nRGlzdGFuY2VzPW9uZUVkZ2UuZGF0YSgnY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXMnKVxyXG4gICAgICAgIGlmKCFjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHMgJiYgIWN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cykgcmV0dXJuO1xyXG5cclxuICAgICAgICBpZihsYXlvdXREaWN0LmVkZ2VzW3NyY0lEXT09bnVsbClsYXlvdXREaWN0LmVkZ2VzW3NyY0lEXT17fVxyXG4gICAgICAgIGxheW91dERpY3QuZWRnZXNbc3JjSURdW3JlbGF0aW9uc2hpcElEXT17fVxyXG4gICAgICAgIGlmKGN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0cyAmJiBjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHMubGVuZ3RoPjApIHtcclxuICAgICAgICAgICAgbGF5b3V0RGljdC5lZGdlc1tzcmNJRF1bcmVsYXRpb25zaGlwSURdW1wiY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzXCJdPXRoaXMubnVtYmVyUHJlY2lzaW9uKGN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0cylcclxuICAgICAgICAgICAgbGF5b3V0RGljdC5lZGdlc1tzcmNJRF1bcmVsYXRpb25zaGlwSURdW1wiY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXNcIl09dGhpcy5udW1iZXJQcmVjaXNpb24oY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXMpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKGN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cyAmJiBjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHMubGVuZ3RoPjApIHtcclxuICAgICAgICAgICAgbGF5b3V0RGljdC5lZGdlc1tzcmNJRF1bcmVsYXRpb25zaGlwSURdW1wiY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzXCJdPXRoaXMubnVtYmVyUHJlY2lzaW9uKGN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cylcclxuICAgICAgICAgICAgbGF5b3V0RGljdC5lZGdlc1tzcmNJRF1bcmVsYXRpb25zaGlwSURdW1wiY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXNcIl09dGhpcy5udW1iZXJQcmVjaXNpb24oY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXMpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuXHJcbiAgICB2YXIgc2F2ZUxheW91dE9iaj17XCJsYXlvdXRzXCI6e319XHJcbiAgICBzYXZlTGF5b3V0T2JqW1wibGF5b3V0c1wiXVtsYXlvdXROYW1lXT1KU09OLnN0cmluZ2lmeShsYXlvdXREaWN0KVxyXG4gICAgdHJ5e1xyXG4gICAgICAgIGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL3NhdmVMYXlvdXRcIiwgXCJQT1NUXCIsIHNhdmVMYXlvdXRPYmopXHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwibGF5b3V0c1VwZGF0ZWRcIixcImxheW91dE5hbWVcIjpsYXlvdXROYW1lfSlcclxuICAgIH1jYXRjaChlKXtcclxuICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgIH1cclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLm51bWJlclByZWNpc2lvbiA9IGZ1bmN0aW9uIChudW1iZXIpIHtcclxuICAgIGlmKEFycmF5LmlzQXJyYXkobnVtYmVyKSl7XHJcbiAgICAgICAgZm9yKHZhciBpPTA7aTxudW1iZXIubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgIG51bWJlcltpXSA9IHRoaXMubnVtYmVyUHJlY2lzaW9uKG51bWJlcltpXSlcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bWJlclxyXG4gICAgfWVsc2VcclxuICAgIHJldHVybiBwYXJzZUZsb2F0KG51bWJlci50b0ZpeGVkKDMpKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuQ09TRVNlbGVjdGVkTm9kZXMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgc2VsZWN0ZWQ9dGhpcy5jb3JlLiQoJzpzZWxlY3RlZCcpXHJcbiAgICB0aGlzLm5vUG9zaXRpb25fY29zZShzZWxlY3RlZClcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmhpZGVTZWxlY3RlZE5vZGVzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHNlbGVjdGVkTm9kZXM9dGhpcy5jb3JlLm5vZGVzKCc6c2VsZWN0ZWQnKVxyXG4gICAgc2VsZWN0ZWROb2Rlcy5yZW1vdmUoKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuc2VsZWN0SW5ib3VuZE5vZGVzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHNlbGVjdGVkTm9kZXM9dGhpcy5jb3JlLm5vZGVzKCc6c2VsZWN0ZWQnKVxyXG4gICAgdmFyIGVsZXM9dGhpcy5jb3JlLm5vZGVzKCkuZWRnZXNUbyhzZWxlY3RlZE5vZGVzKS5zb3VyY2VzKClcclxuICAgIGVsZXMuZm9yRWFjaCgoZWxlKT0+eyB0aGlzLmFuaW1hdGVBTm9kZShlbGUpIH0pXHJcbiAgICBlbGVzLnNlbGVjdCgpXHJcbiAgICB0aGlzLnNlbGVjdEZ1bmN0aW9uKClcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnNlbGVjdE91dGJvdW5kTm9kZXMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgc2VsZWN0ZWROb2Rlcz10aGlzLmNvcmUubm9kZXMoJzpzZWxlY3RlZCcpXHJcbiAgICB2YXIgZWxlcz1zZWxlY3RlZE5vZGVzLmVkZ2VzVG8odGhpcy5jb3JlLm5vZGVzKCkpLnRhcmdldHMoKVxyXG4gICAgZWxlcy5mb3JFYWNoKChlbGUpPT57IHRoaXMuYW5pbWF0ZUFOb2RlKGVsZSkgfSlcclxuICAgIGVsZXMuc2VsZWN0KClcclxuICAgIHRoaXMuc2VsZWN0RnVuY3Rpb24oKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuYWRkQ29ubmVjdGlvbnMgPSBmdW5jdGlvbiAodGFyZ2V0Tm9kZSkge1xyXG4gICAgdmFyIHRoZUNvbm5lY3RNb2RlPXRoaXMudGFyZ2V0Tm9kZU1vZGVcclxuICAgIHZhciBzcmNOb2RlQXJyPXRoaXMuY29yZS5ub2RlcyhcIjpzZWxlY3RlZFwiKVxyXG5cclxuICAgIHZhciBwcmVwYXJhdGlvbkluZm89W11cclxuXHJcbiAgICBzcmNOb2RlQXJyLmZvckVhY2godGhlTm9kZT0+e1xyXG4gICAgICAgIHZhciBjb25uZWN0aW9uVHlwZXNcclxuICAgICAgICBpZih0aGVDb25uZWN0TW9kZT09XCJjb25uZWN0VG9cIikge1xyXG4gICAgICAgICAgICBjb25uZWN0aW9uVHlwZXM9dGhpcy5jaGVja0F2YWlsYWJsZUNvbm5lY3Rpb25UeXBlKHRoZU5vZGUuZGF0YShcIm1vZGVsSURcIiksdGFyZ2V0Tm9kZS5kYXRhKFwibW9kZWxJRFwiKSlcclxuICAgICAgICAgICAgcHJlcGFyYXRpb25JbmZvLnB1c2goe2Zyb206dGhlTm9kZSx0bzp0YXJnZXROb2RlLGNvbm5lY3Q6Y29ubmVjdGlvblR5cGVzfSlcclxuICAgICAgICB9ZWxzZSBpZih0aGVDb25uZWN0TW9kZT09XCJjb25uZWN0RnJvbVwiKSB7XHJcbiAgICAgICAgICAgIGNvbm5lY3Rpb25UeXBlcz10aGlzLmNoZWNrQXZhaWxhYmxlQ29ubmVjdGlvblR5cGUodGFyZ2V0Tm9kZS5kYXRhKFwibW9kZWxJRFwiKSx0aGVOb2RlLmRhdGEoXCJtb2RlbElEXCIpKVxyXG4gICAgICAgICAgICBwcmVwYXJhdGlvbkluZm8ucHVzaCh7dG86dGhlTm9kZSxmcm9tOnRhcmdldE5vZGUsY29ubmVjdDpjb25uZWN0aW9uVHlwZXN9KVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbiAgICAvL1RPRE86IGNoZWNrIGlmIGl0IGlzIG5lZWRlZCB0byBwb3B1cCBkaWFsb2csIGlmIGFsbCBjb25uZWN0aW9uIGlzIGRvYWJsZSBhbmQgb25seSBvbmUgdHlwZSB0byB1c2UsIG5vIG5lZWQgdG8gc2hvdyBkaWFsb2dcclxuICAgIHRoaXMuc2hvd0Nvbm5lY3Rpb25EaWFsb2cocHJlcGFyYXRpb25JbmZvKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuc2hvd0Nvbm5lY3Rpb25EaWFsb2cgPSBmdW5jdGlvbiAocHJlcGFyYXRpb25JbmZvKSB7XHJcbiAgICB2YXIgY29uZmlybURpYWxvZ0RpdiA9IG5ldyBzaW1wbGVDb25maXJtRGlhbG9nKClcclxuICAgIHZhciByZXN1bHRBY3Rpb25zPVtdXHJcbiAgICBjb25maXJtRGlhbG9nRGl2LnNob3coXHJcbiAgICAgICAgeyB3aWR0aDogXCI0NTBweFwiIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJBZGQgY29ubmVjdGlvbnNcIlxyXG4gICAgICAgICAgICAsIGNvbnRlbnQ6IFwiXCJcclxuICAgICAgICAgICAgLCBidXR0b25zOiBbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1yZWQgdzMtaG92ZXItcGlua1wiLCB0ZXh0OiBcIkNvbmZpcm1cIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY3JlYXRlQ29ubmVjdGlvbnMocmVzdWx0QWN0aW9ucylcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtZ3JheVwiLCB0ZXh0OiBcIkNhbmNlbFwiLCBcImNsaWNrRnVuY1wiOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH1cclxuICAgIClcclxuICAgIGNvbmZpcm1EaWFsb2dEaXYuZGlhbG9nRGl2LmVtcHR5KClcclxuICAgIHByZXBhcmF0aW9uSW5mby5mb3JFYWNoKChvbmVSb3csaW5kZXgpPT57XHJcbiAgICAgICAgcmVzdWx0QWN0aW9ucy5wdXNoKHRoaXMuY3JlYXRlT25lQ29ubmVjdGlvbkFkanVzdFJvdyhvbmVSb3csY29uZmlybURpYWxvZ0RpdikpXHJcbiAgICB9KVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuY3JlYXRlT25lQ29ubmVjdGlvbkFkanVzdFJvdyA9IGZ1bmN0aW9uIChvbmVSb3csY29uZmlybURpYWxvZ0Rpdikge1xyXG4gICAgdmFyIHJldHVybk9iaj17fVxyXG4gICAgdmFyIGZyb21Ob2RlPW9uZVJvdy5mcm9tXHJcbiAgICB2YXIgdG9Ob2RlPW9uZVJvdy50b1xyXG4gICAgdmFyIGNvbm5lY3Rpb25UeXBlcz1vbmVSb3cuY29ubmVjdFxyXG4gICAgdmFyIGxhYmVsPSQoJzxsYWJlbCBzdHlsZT1cImRpc3BsYXk6YmxvY2s7bWFyZ2luLWJvdHRvbToycHhcIj48L2xhYmVsPicpXHJcbiAgICBpZihjb25uZWN0aW9uVHlwZXMubGVuZ3RoPT0wKXtcclxuICAgICAgICBsYWJlbC5jc3MoXCJjb2xvclwiLFwicmVkXCIpXHJcbiAgICAgICAgbGFiZWwuaHRtbChcIk5vIHVzYWJsZSBjb25uZWN0aW9uIHR5cGUgZnJvbSA8Yj5cIitmcm9tTm9kZS5pZCgpK1wiPC9iPiB0byA8Yj5cIit0b05vZGUuaWQoKStcIjwvYj5cIilcclxuICAgIH1lbHNlIGlmKGNvbm5lY3Rpb25UeXBlcy5sZW5ndGg+MSl7IFxyXG4gICAgICAgIGxhYmVsLmh0bWwoXCJGcm9tIDxiPlwiK2Zyb21Ob2RlLmlkKCkrXCI8L2I+IHRvIDxiPlwiK3RvTm9kZS5pZCgpK1wiPC9iPlwiKSBcclxuICAgICAgICB2YXIgc3dpdGNoVHlwZVNlbGVjdG9yPW5ldyBzaW1wbGVTZWxlY3RNZW51KFwiIFwiKVxyXG4gICAgICAgIGxhYmVsLnByZXBlbmQoc3dpdGNoVHlwZVNlbGVjdG9yLkRPTSlcclxuICAgICAgICBjb25uZWN0aW9uVHlwZXMuZm9yRWFjaChvbmVUeXBlPT57XHJcbiAgICAgICAgICAgIHN3aXRjaFR5cGVTZWxlY3Rvci5hZGRPcHRpb24ob25lVHlwZSlcclxuICAgICAgICB9KVxyXG4gICAgICAgIHJldHVybk9ialtcImZyb21cIl09ZnJvbU5vZGUuaWQoKVxyXG4gICAgICAgIHJldHVybk9ialtcInRvXCJdPXRvTm9kZS5pZCgpXHJcbiAgICAgICAgcmV0dXJuT2JqW1wiY29ubmVjdFwiXT1jb25uZWN0aW9uVHlwZXNbMF1cclxuICAgICAgICBzd2l0Y2hUeXBlU2VsZWN0b3IuY2FsbEJhY2tfY2xpY2tPcHRpb249KG9wdGlvblRleHQsb3B0aW9uVmFsdWUpPT57XHJcbiAgICAgICAgICAgIHJldHVybk9ialtcImNvbm5lY3RcIl09b3B0aW9uVGV4dFxyXG4gICAgICAgICAgICBzd2l0Y2hUeXBlU2VsZWN0b3IuY2hhbmdlTmFtZShvcHRpb25UZXh0KVxyXG4gICAgICAgIH1cclxuICAgICAgICBzd2l0Y2hUeXBlU2VsZWN0b3IudHJpZ2dlck9wdGlvbkluZGV4KDApXHJcbiAgICB9ZWxzZSBpZihjb25uZWN0aW9uVHlwZXMubGVuZ3RoPT0xKXtcclxuICAgICAgICByZXR1cm5PYmpbXCJmcm9tXCJdPWZyb21Ob2RlLmlkKClcclxuICAgICAgICByZXR1cm5PYmpbXCJ0b1wiXT10b05vZGUuaWQoKVxyXG4gICAgICAgIHJldHVybk9ialtcImNvbm5lY3RcIl09Y29ubmVjdGlvblR5cGVzWzBdXHJcbiAgICAgICAgbGFiZWwuY3NzKFwiY29sb3JcIixcImdyZWVuXCIpXHJcbiAgICAgICAgbGFiZWwuaHRtbChcIkFkZCA8Yj5cIitjb25uZWN0aW9uVHlwZXNbMF0rXCI8L2I+IGNvbm5lY3Rpb24gZnJvbSA8Yj5cIitmcm9tTm9kZS5pZCgpK1wiPC9iPiB0byA8Yj5cIit0b05vZGUuaWQoKStcIjwvYj5cIikgXHJcbiAgICB9XHJcbiAgICBjb25maXJtRGlhbG9nRGl2LmRpYWxvZ0Rpdi5hcHBlbmQobGFiZWwpXHJcbiAgICByZXR1cm4gcmV0dXJuT2JqO1xyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuY3JlYXRlQ29ubmVjdGlvbnMgPSBhc3luYyBmdW5jdGlvbiAocmVzdWx0QWN0aW9ucykge1xyXG4gICAgLy8gZm9yIGVhY2ggcmVzdWx0QWN0aW9ucywgY2FsY3VsYXRlIHRoZSBhcHBlbmRpeCBpbmRleCwgdG8gYXZvaWQgc2FtZSBJRCBpcyB1c2VkIGZvciBleGlzdGVkIGNvbm5lY3Rpb25zXHJcbiAgICBmdW5jdGlvbiB1dWlkdjQoKSB7XHJcbiAgICAgICAgcmV0dXJuICd4eHh4eHh4eC14eHh4LTR4eHgteXh4eC14eHh4eHh4eHh4eHgnLnJlcGxhY2UoL1t4eV0vZywgZnVuY3Rpb24gKGMpIHtcclxuICAgICAgICAgICAgdmFyIHIgPSBNYXRoLnJhbmRvbSgpICogMTYgfCAwLCB2ID0gYyA9PSAneCcgPyByIDogKHIgJiAweDMgfCAweDgpO1xyXG4gICAgICAgICAgICByZXR1cm4gdi50b1N0cmluZygxNik7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGZpbmFsQWN0aW9ucz1bXVxyXG4gICAgcmVzdWx0QWN0aW9ucy5mb3JFYWNoKG9uZUFjdGlvbj0+e1xyXG4gICAgICAgIHZhciBvbmVGaW5hbEFjdGlvbj17fVxyXG4gICAgICAgIG9uZUZpbmFsQWN0aW9uW1wiJHNyY0lkXCJdPW9uZUFjdGlvbltcImZyb21cIl1cclxuICAgICAgICBvbmVGaW5hbEFjdGlvbltcIiRyZWxhdGlvbnNoaXBJZFwiXT11dWlkdjQoKTtcclxuICAgICAgICBvbmVGaW5hbEFjdGlvbltcIm9ialwiXT17XHJcbiAgICAgICAgICAgIFwiJHRhcmdldElkXCI6IG9uZUFjdGlvbltcInRvXCJdLFxyXG4gICAgICAgICAgICBcIiRyZWxhdGlvbnNoaXBOYW1lXCI6IG9uZUFjdGlvbltcImNvbm5lY3RcIl1cclxuICAgICAgICB9XHJcbiAgICAgICAgZmluYWxBY3Rpb25zLnB1c2gob25lRmluYWxBY3Rpb24pXHJcbiAgICB9KVxyXG4gICAgdHJ5e1xyXG4gICAgICAgIHZhciBkYXRhID0gYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vY3JlYXRlUmVsYXRpb25zXCIsIFwiUE9TVFwiLCAge2FjdGlvbnM6SlNPTi5zdHJpbmdpZnkoZmluYWxBY3Rpb25zKX0pXHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICB9XHJcbiAgICBnbG9iYWxDYWNoZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzX2FwcGVuZChkYXRhKVxyXG4gICAgdGhpcy5kcmF3UmVsYXRpb25zKGRhdGEpXHJcbn1cclxuXHJcblxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmNoZWNrQXZhaWxhYmxlQ29ubmVjdGlvblR5cGUgPSBmdW5jdGlvbiAoZnJvbU5vZGVNb2RlbCx0b05vZGVNb2RlbCkge1xyXG4gICAgdmFyIHJlPVtdXHJcbiAgICB2YXIgdmFsaWRSZWxhdGlvbnNoaXBzPW1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1tmcm9tTm9kZU1vZGVsXS52YWxpZFJlbGF0aW9uc2hpcHNcclxuICAgIHZhciB0b05vZGVCYXNlQ2xhc3Nlcz1tb2RlbEFuYWx5emVyLkRURExNb2RlbHNbdG9Ob2RlTW9kZWxdLmFsbEJhc2VDbGFzc2VzXHJcbiAgICBpZih2YWxpZFJlbGF0aW9uc2hpcHMpe1xyXG4gICAgICAgIGZvcih2YXIgcmVsYXRpb25OYW1lIGluIHZhbGlkUmVsYXRpb25zaGlwcyl7XHJcbiAgICAgICAgICAgIHZhciB0aGVSZWxhdGlvblR5cGU9dmFsaWRSZWxhdGlvbnNoaXBzW3JlbGF0aW9uTmFtZV1cclxuICAgICAgICAgICAgaWYodGhlUmVsYXRpb25UeXBlLnRhcmdldD09bnVsbFxyXG4gICAgICAgICAgICAgICAgIHx8IHRoZVJlbGF0aW9uVHlwZS50YXJnZXQ9PXRvTm9kZU1vZGVsXHJcbiAgICAgICAgICAgICAgICAgfHx0b05vZGVCYXNlQ2xhc3Nlc1t0aGVSZWxhdGlvblR5cGUudGFyZ2V0XSE9bnVsbCkgcmUucHVzaChyZWxhdGlvbk5hbWUpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlXHJcbn1cclxuXHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuc3RhcnRUYXJnZXROb2RlTW9kZSA9IGZ1bmN0aW9uIChtb2RlKSB7XHJcbiAgICB0aGlzLmNvcmUuYXV0b3Vuc2VsZWN0aWZ5KCB0cnVlICk7XHJcbiAgICB0aGlzLmNvcmUuY29udGFpbmVyKCkuc3R5bGUuY3Vyc29yID0gJ2Nyb3NzaGFpcic7XHJcbiAgICB0aGlzLnRhcmdldE5vZGVNb2RlPW1vZGU7XHJcbiAgICAkKGRvY3VtZW50KS5rZXlkb3duKChldmVudCkgPT4ge1xyXG4gICAgICAgIGlmIChldmVudC5rZXlDb2RlID09IDI3KSB0aGlzLmNhbmNlbFRhcmdldE5vZGVNb2RlKClcclxuICAgIH0pO1xyXG5cclxuICAgIHRoaXMuY29yZS5ub2RlcygpLm9uKCdjbGljaycsIChlKT0+e1xyXG4gICAgICAgIHZhciBjbGlja2VkTm9kZSA9IGUudGFyZ2V0O1xyXG4gICAgICAgIHRoaXMuYWRkQ29ubmVjdGlvbnMoY2xpY2tlZE5vZGUpXHJcbiAgICAgICAgLy9kZWxheSBhIHNob3J0IHdoaWxlIHNvIG5vZGUgc2VsZWN0aW9uIHdpbGwgbm90IGJlIGNoYW5nZWQgdG8gdGhlIGNsaWNrZWQgdGFyZ2V0IG5vZGVcclxuICAgICAgICBzZXRUaW1lb3V0KCgpPT57dGhpcy5jYW5jZWxUYXJnZXROb2RlTW9kZSgpfSw1MClcclxuXHJcbiAgICB9KTtcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmNhbmNlbFRhcmdldE5vZGVNb2RlPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLnRhcmdldE5vZGVNb2RlPW51bGw7XHJcbiAgICB0aGlzLmNvcmUuY29udGFpbmVyKCkuc3R5bGUuY3Vyc29yID0gJ2RlZmF1bHQnO1xyXG4gICAgJChkb2N1bWVudCkub2ZmKCdrZXlkb3duJyk7XHJcbiAgICB0aGlzLmNvcmUubm9kZXMoKS5vZmYoXCJjbGlja1wiKVxyXG4gICAgdGhpcy5jb3JlLmF1dG91bnNlbGVjdGlmeSggZmFsc2UgKTtcclxufVxyXG5cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5ub1Bvc2l0aW9uX2dyaWQ9ZnVuY3Rpb24oZWxlcyl7XHJcbiAgICB2YXIgbmV3TGF5b3V0ID0gZWxlcy5sYXlvdXQoe1xyXG4gICAgICAgIG5hbWU6ICdncmlkJyxcclxuICAgICAgICBhbmltYXRlOiBmYWxzZSxcclxuICAgICAgICBmaXQ6ZmFsc2VcclxuICAgIH0pIFxyXG4gICAgbmV3TGF5b3V0LnJ1bigpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5ub1Bvc2l0aW9uX2Nvc2U9ZnVuY3Rpb24oZWxlcyl7XHJcbiAgICBpZihlbGVzPT1udWxsKSBlbGVzPXRoaXMuY29yZS5lbGVtZW50cygpXHJcblxyXG4gICAgdmFyIG5ld0xheW91dCA9ZWxlcy5sYXlvdXQoe1xyXG4gICAgICAgIG5hbWU6ICdjb3NlJyxcclxuICAgICAgICBhbmltYXRlOiB0cnVlLFxyXG4gICAgICAgIGdyYXZpdHk6MSxcclxuICAgICAgICBhbmltYXRlOiBmYWxzZVxyXG4gICAgICAgICxmaXQ6ZmFsc2VcclxuICAgIH0pIFxyXG4gICAgbmV3TGF5b3V0LnJ1bigpXHJcbiAgICB0aGlzLmNvcmUuY2VudGVyKGVsZXMpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5ub1Bvc2l0aW9uX2NvbmNlbnRyaWM9ZnVuY3Rpb24oZWxlcyxib3gpe1xyXG4gICAgaWYoZWxlcz09bnVsbCkgZWxlcz10aGlzLmNvcmUuZWxlbWVudHMoKVxyXG4gICAgdmFyIG5ld0xheW91dCA9ZWxlcy5sYXlvdXQoe1xyXG4gICAgICAgIG5hbWU6ICdjb25jZW50cmljJyxcclxuICAgICAgICBhbmltYXRlOiBmYWxzZSxcclxuICAgICAgICBmaXQ6ZmFsc2UsXHJcbiAgICAgICAgbWluTm9kZVNwYWNpbmc6NjAsXHJcbiAgICAgICAgZ3Jhdml0eToxLFxyXG4gICAgICAgIGJvdW5kaW5nQm94OmJveFxyXG4gICAgfSkgXHJcbiAgICBuZXdMYXlvdXQucnVuKClcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmxheW91dFdpdGhOb2RlUG9zaXRpb249ZnVuY3Rpb24obm9kZVBvc2l0aW9uKXtcclxuICAgIHZhciBuZXdMYXlvdXQgPSB0aGlzLmNvcmUubGF5b3V0KHtcclxuICAgICAgICBuYW1lOiAncHJlc2V0JyxcclxuICAgICAgICBwb3NpdGlvbnM6IG5vZGVQb3NpdGlvbixcclxuICAgICAgICBhbmltYXRlOiBmYWxzZSwgLy8gd2hldGhlciB0byB0cmFuc2l0aW9uIHRoZSBub2RlIHBvc2l0aW9uc1xyXG4gICAgICAgIGFuaW1hdGlvbkR1cmF0aW9uOiA1MDAsIC8vIGR1cmF0aW9uIG9mIGFuaW1hdGlvbiBpbiBtcyBpZiBlbmFibGVkXHJcbiAgICB9KVxyXG4gICAgbmV3TGF5b3V0LnJ1bigpXHJcbn1cclxuXHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB0b3BvbG9neURPTTsiLCJjb25zdCBzaW1wbGVUcmVlPXJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9zaW1wbGVUcmVlXCIpXHJcbmNvbnN0IG1vZGVsQW5hbHl6ZXI9cmVxdWlyZShcIi4vbW9kZWxBbmFseXplclwiKVxyXG5jb25zdCBtc2FsSGVscGVyID0gcmVxdWlyZShcIi4uL21zYWxIZWxwZXJcIilcclxuY29uc3QgZ2xvYmFsQ2FjaGUgPSByZXF1aXJlKFwiLi9nbG9iYWxDYWNoZVwiKVxyXG5cclxuZnVuY3Rpb24gdHdpbnNUcmVlKERPTSwgc2VhcmNoRE9NKSB7XHJcbiAgICB0aGlzLnRyZWU9bmV3IHNpbXBsZVRyZWUoRE9NLHtcImxlYWZOYW1lUHJvcGVydHlcIjpcImRpc3BsYXlOYW1lXCJ9KVxyXG5cclxuICAgIHRoaXMudHJlZS5vcHRpb25zLmdyb3VwTm9kZUljb25GdW5jPShnbik9PntcclxuICAgICAgICB2YXIgbW9kZWxDbGFzcz1nbi5pbmZvW1wiQGlkXCJdXHJcbiAgICAgICAgdmFyIGNvbG9yQ29kZT1cImdyYXlcIlxyXG4gICAgICAgIHZhciBzaGFwZT1cImVsbGlwc2VcIlxyXG4gICAgICAgIHZhciBhdmF0YXI9bnVsbFxyXG4gICAgICAgIGlmKGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdW21vZGVsQ2xhc3NdKXtcclxuICAgICAgICAgICAgdmFyIHZpc3VhbEpzb24gPWdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdW21vZGVsQ2xhc3NdXHJcbiAgICAgICAgICAgIHZhciBjb2xvckNvZGU9IHZpc3VhbEpzb24uY29sb3IgfHwgXCJncmF5XCJcclxuICAgICAgICAgICAgdmFyIHNoYXBlPSAgdmlzdWFsSnNvbi5zaGFwZSB8fCBcImVsbGlwc2VcIlxyXG4gICAgICAgICAgICB2YXIgYXZhcnRhPSB2aXN1YWxKc29uLmF2YXJ0YSBcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGZvbnRzaXplPXtcImVsbGlwc2VcIjpcImZvbnQtc2l6ZToxMzAlXCIsXCJyb3VuZC1yZWN0YW5nbGVcIjpcImZvbnQtc2l6ZTo2MCU7cGFkZGluZy1sZWZ0OjJweFwiLFwiaGV4YWdvblwiOlwiZm9udC1zaXplOjkwJVwifVtzaGFwZV1cclxuICAgICAgICBzaGFwZT17XCJlbGxpcHNlXCI6XCLil49cIixcInJvdW5kLXJlY3RhbmdsZVwiOlwi4paJXCIsXCJoZXhhZ29uXCI6XCLirKJcIn1bc2hhcGVdXHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGxibEhUTUw9XCI8bGFiZWwgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO2NvbG9yOlwiK2NvbG9yQ29kZStcIjtcIitmb250c2l6ZStcIjtmb250LXdlaWdodDpub3JtYWw7dmVydGljYWwtYWxpZ246bWlkZGxlO2JvcmRlci1yYWRpdXM6IDJweDsnPlwiK3NoYXBlK1wiPC9sYWJlbD5cIlxyXG5cclxuICAgICAgICBpZihhdmFydGEpIGxibEhUTUwrPVwiPGltZyBzcmM9J1wiK2F2YXJ0YStcIicgc3R5bGU9J2hlaWdodDoyMHB4Jy8+XCJcclxuXHJcbiAgICAgICAgcmV0dXJuICQobGJsSFRNTClcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnRyZWUuY2FsbGJhY2tfYWZ0ZXJTZWxlY3ROb2Rlcz0obm9kZXNBcnIsbW91c2VDbGlja0RldGFpbCk9PntcclxuICAgICAgICB2YXIgaW5mb0Fycj1bXVxyXG4gICAgICAgIG5vZGVzQXJyLmZvckVhY2goKGl0ZW0sIGluZGV4KSA9PntcclxuICAgICAgICAgICAgaW5mb0Fyci5wdXNoKGl0ZW0ubGVhZkluZm8pXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgZ2xvYmFsQ2FjaGUuc2hvd2luZ0NyZWF0ZVR3aW5Nb2RlbElEPW51bGw7IFxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInNob3dJbmZvU2VsZWN0ZWROb2Rlc1wiLCBpbmZvOmluZm9BcnIsIFwibW91c2VDbGlja0RldGFpbFwiOm1vdXNlQ2xpY2tEZXRhaWx9KVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMudHJlZS5jYWxsYmFja19hZnRlckRibGNsaWNrTm9kZT0odGhlTm9kZSk9PntcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJQYW5Ub05vZGVcIiwgaW5mbzp0aGVOb2RlLmxlYWZJbmZvfSlcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnRyZWUuY2FsbGJhY2tfYWZ0ZXJTZWxlY3RHcm91cE5vZGU9KG5vZGVJbmZvKT0+e1xyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7XCJtZXNzYWdlXCI6XCJzaG93SW5mb0dyb3VwTm9kZVwiLGluZm86bm9kZUluZm99KVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuc2VhcmNoQm94PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiICBwbGFjZWhvbGRlcj1cInNlYXJjaC4uLlwiLz4nKS5hZGRDbGFzcyhcInczLWlucHV0XCIpO1xyXG4gICAgdGhpcy5zZWFyY2hCb3guY3NzKHtcIm91dGxpbmVcIjpcIm5vbmVcIixcImhlaWdodFwiOlwiMTAwJVwiLFwid2lkdGhcIjpcIjEwMCVcIn0pIFxyXG4gICAgc2VhcmNoRE9NLmFwcGVuZCh0aGlzLnNlYXJjaEJveClcclxuICAgIHZhciBoaWRlT3JTaG93RW1wdHlHcm91cD0kKCc8YnV0dG9uIHN0eWxlPVwiaGVpZ2h0OjIwcHg7Ym9yZGVyOm5vbmU7cGFkZGluZy1sZWZ0OjJweFwiIGNsYXNzPVwidzMtYmxvY2sgdzMtdGlueSB3My1ob3Zlci1yZWQgdzMtYW1iZXJcIj5IaWRlIEVtcHR5IE1vZGVsczwvYnV0dG9uPicpXHJcbiAgICBzZWFyY2hET00uYXBwZW5kKGhpZGVPclNob3dFbXB0eUdyb3VwKVxyXG4gICAgRE9NLmNzcyhcInRvcFwiLFwiNTBweFwiKVxyXG4gICAgaGlkZU9yU2hvd0VtcHR5R3JvdXAuYXR0cihcInN0YXR1c1wiLFwic2hvd1wiKVxyXG4gICAgaGlkZU9yU2hvd0VtcHR5R3JvdXAub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgaWYoaGlkZU9yU2hvd0VtcHR5R3JvdXAuYXR0cihcInN0YXR1c1wiKT09XCJzaG93XCIpe1xyXG4gICAgICAgICAgICBoaWRlT3JTaG93RW1wdHlHcm91cC5hdHRyKFwic3RhdHVzXCIsXCJoaWRlXCIpXHJcbiAgICAgICAgICAgIGhpZGVPclNob3dFbXB0eUdyb3VwLnRleHQoXCJTaG93IEVtcHR5IE1vZGVsc1wiKVxyXG4gICAgICAgICAgICB0aGlzLnRyZWUub3B0aW9ucy5oaWRlRW1wdHlHcm91cD10cnVlXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIGhpZGVPclNob3dFbXB0eUdyb3VwLmF0dHIoXCJzdGF0dXNcIixcInNob3dcIilcclxuICAgICAgICAgICAgaGlkZU9yU2hvd0VtcHR5R3JvdXAudGV4dChcIkhpZGUgRW1wdHkgTW9kZWxzXCIpXHJcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnRyZWUub3B0aW9ucy5oaWRlRW1wdHlHcm91cFxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnRyZWUuZ3JvdXBOb2Rlcy5mb3JFYWNoKG9uZUdyb3VwTm9kZT0+e29uZUdyb3VwTm9kZS5jaGVja09wdGlvbkhpZGVFbXB0eUdyb3VwKCl9KVxyXG4gICAgfSlcclxuICAgIHRoaXMuc2VhcmNoQm94LmtleXVwKChlKT0+e1xyXG4gICAgICAgIGlmKGUua2V5Q29kZSA9PSAxMylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBhTm9kZSA9IHRoaXMudHJlZS5zZWFyY2hUZXh0KCQoZS50YXJnZXQpLnZhbCgpKVxyXG4gICAgICAgICAgICBpZihhTm9kZSE9bnVsbCl7XHJcbiAgICAgICAgICAgICAgICBhTm9kZS5wYXJlbnRHcm91cE5vZGUuZXhwYW5kKClcclxuICAgICAgICAgICAgICAgIHRoaXMudHJlZS5zZWxlY3RMZWFmTm9kZShhTm9kZSlcclxuICAgICAgICAgICAgICAgIHRoaXMudHJlZS5zY3JvbGxUb0xlYWZOb2RlKGFOb2RlKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbnR3aW5zVHJlZS5wcm90b3R5cGUucnhNZXNzYWdlPWZ1bmN0aW9uKG1zZ1BheWxvYWQpe1xyXG4gICAgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInN0YXJ0U2VsZWN0aW9uX3JlcGxhY2VcIikgdGhpcy5sb2FkU3RhcnRTZWxlY3Rpb24obXNnUGF5bG9hZC50d2luSURzLG1zZ1BheWxvYWQubW9kZWxJRHMsXCJyZXBsYWNlXCIpXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJzdGFydFNlbGVjdGlvbl9hcHBlbmRcIikgdGhpcy5sb2FkU3RhcnRTZWxlY3Rpb24obXNnUGF5bG9hZC50d2luSURzLG1zZ1BheWxvYWQubW9kZWxJRHMsXCJhcHBlbmRcIilcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImRyYXdUd2luc0FuZFJlbGF0aW9uc1wiKSB0aGlzLmRyYXdUd2luc0FuZFJlbGF0aW9ucyhtc2dQYXlsb2FkLmluZm8pXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJBRFRNb2RlbHNDaGFuZ2VcIikgdGhpcy5yZWZyZXNoTW9kZWxzKClcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImFkZE5ld1R3aW5cIikgdGhpcy5kcmF3T25lVHdpbihtc2dQYXlsb2FkLnR3aW5JbmZvKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiYWRkTmV3VHdpbnNcIikge1xyXG4gICAgICAgIG1zZ1BheWxvYWQudHdpbnNJbmZvLmZvckVhY2gob25lVHdpbkluZm89Pnt0aGlzLmRyYXdPbmVUd2luKG9uZVR3aW5JbmZvKX0pXHJcbiAgICB9XHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJ0d2luc0RlbGV0ZWRcIikgdGhpcy5kZWxldGVUd2lucyhtc2dQYXlsb2FkLnR3aW5JREFycilcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIil7XHJcbiAgICAgICAgaWYoIW1zZ1BheWxvYWQuc3JjTW9kZWxJRCl7IC8vIGNoYW5nZSBtb2RlbCBjbGFzcyB2aXN1YWxpemF0aW9uXHJcbiAgICAgICAgICAgIHRoaXMudHJlZS5ncm91cE5vZGVzLmZvckVhY2goZ249Pntnbi5yZWZyZXNoTmFtZSgpfSlcclxuICAgICAgICB9IFxyXG4gICAgfVxyXG59XHJcblxyXG50d2luc1RyZWUucHJvdG90eXBlLmRlbGV0ZVR3aW5zPWZ1bmN0aW9uKHR3aW5JREFycil7XHJcbiAgICB0d2luSURBcnIuZm9yRWFjaCh0d2luSUQ9PntcclxuICAgICAgICB2YXIgdHdpbkRpc3BsYXlOYW1lPWdsb2JhbENhY2hlLnR3aW5JRE1hcFRvRGlzcGxheU5hbWVbdHdpbklEXVxyXG4gICAgICAgIHRoaXMudHJlZS5kZWxldGVMZWFmTm9kZSh0d2luRGlzcGxheU5hbWUpXHJcbiAgICB9KVxyXG59XHJcblxyXG50d2luc1RyZWUucHJvdG90eXBlLnJlZnJlc2hNb2RlbHM9ZnVuY3Rpb24oKXtcclxuICAgIHZhciBtb2RlbHNEYXRhPXt9XHJcbiAgICBmb3IodmFyIG1vZGVsSUQgaW4gbW9kZWxBbmFseXplci5EVERMTW9kZWxzKXtcclxuICAgICAgICB2YXIgb25lTW9kZWw9bW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdXHJcbiAgICAgICAgbW9kZWxzRGF0YVtvbmVNb2RlbFtcImRpc3BsYXlOYW1lXCJdXSA9IG9uZU1vZGVsXHJcbiAgICB9XHJcbiAgICAvL2RlbGV0ZSBhbGwgZ3JvdXAgbm9kZXMgb2YgZGVsZXRlZCBtb2RlbHNcclxuICAgIHRoaXMudHJlZS5ncm91cE5vZGVzLmZvckVhY2goKGdub2RlKT0+e1xyXG4gICAgICAgIGlmKG1vZGVsc0RhdGFbZ25vZGUubmFtZV09PW51bGwpe1xyXG4gICAgICAgICAgICAvL2RlbGV0ZSB0aGlzIGdyb3VwIG5vZGVcclxuICAgICAgICAgICAgZ25vZGUuZGVsZXRlU2VsZigpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuXHJcbiAgICAvL3RoZW4gYWRkIGFsbCBncm91cCBub2RlcyB0aGF0IHRvIGJlIGFkZGVkXHJcbiAgICB2YXIgY3VycmVudE1vZGVsTmFtZUFycj1bXVxyXG4gICAgdGhpcy50cmVlLmdyb3VwTm9kZXMuZm9yRWFjaCgoZ25vZGUpPT57Y3VycmVudE1vZGVsTmFtZUFyci5wdXNoKGdub2RlLm5hbWUpfSlcclxuXHJcbiAgICB2YXIgYWN0dWFsTW9kZWxOYW1lQXJyPVtdXHJcbiAgICBmb3IodmFyIGluZCBpbiBtb2RlbHNEYXRhKSBhY3R1YWxNb2RlbE5hbWVBcnIucHVzaChpbmQpXHJcbiAgICBhY3R1YWxNb2RlbE5hbWVBcnIuc29ydChmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYS50b0xvd2VyQ2FzZSgpLmxvY2FsZUNvbXBhcmUoYi50b0xvd2VyQ2FzZSgpKSB9KTtcclxuXHJcbiAgICBmb3IodmFyIGk9MDtpPGFjdHVhbE1vZGVsTmFtZUFyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICBpZihpPGN1cnJlbnRNb2RlbE5hbWVBcnIubGVuZ3RoICYmIGN1cnJlbnRNb2RlbE5hbWVBcnJbaV09PWFjdHVhbE1vZGVsTmFtZUFycltpXSkgY29udGludWVcclxuICAgICAgICAvL290aGVyd2lzZSBhZGQgdGhpcyBncm91cCB0byB0aGUgdHJlZVxyXG4gICAgICAgIHZhciBuZXdHcm91cD10aGlzLnRyZWUuaW5zZXJ0R3JvdXBOb2RlKG1vZGVsc0RhdGFbYWN0dWFsTW9kZWxOYW1lQXJyW2ldXSxpKVxyXG4gICAgICAgIG5ld0dyb3VwLnNocmluaygpXHJcbiAgICAgICAgY3VycmVudE1vZGVsTmFtZUFyci5zcGxpY2UoaSwgMCwgYWN0dWFsTW9kZWxOYW1lQXJyW2ldKTtcclxuICAgIH1cclxufVxyXG5cclxuXHJcbnR3aW5zVHJlZS5wcm90b3R5cGUubG9hZFN0YXJ0U2VsZWN0aW9uPWFzeW5jIGZ1bmN0aW9uKHR3aW5JRHMsbW9kZWxJRHMscmVwbGFjZU9yQXBwZW5kKXtcclxuICAgIGlmKHJlcGxhY2VPckFwcGVuZD09XCJyZXBsYWNlXCIpIHRoaXMudHJlZS5jbGVhckFsbExlYWZOb2RlcygpXHJcblxyXG4gICAgXHJcbiAgICB0aGlzLnJlZnJlc2hNb2RlbHMoKVxyXG4gICAgXHJcbiAgICAvL2FkZCBuZXcgdHdpbnMgdW5kZXIgdGhlIG1vZGVsIGdyb3VwIG5vZGVcclxuICAgIHRyeXtcclxuICAgICAgICB2YXIgdHdpbnNkYXRhID0gYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vbGlzdFR3aW5zRm9ySURzXCIsIFwiUE9TVFwiLCB0d2luSURzKVxyXG4gICAgICAgIHZhciB0d2luSURBcnIgPSBbXVxyXG4gICAgICAgIC8vY2hlY2sgaWYgYW55IGN1cnJlbnQgbGVhZiBub2RlIGRvZXMgbm90IGhhdmUgc3RvcmVkIG91dGJvdW5kIHJlbGF0aW9uc2hpcCBkYXRhIHlldFxyXG4gICAgICAgIHRoaXMudHJlZS5ncm91cE5vZGVzLmZvckVhY2goKGdOb2RlKSA9PiB7XHJcbiAgICAgICAgICAgIGdOb2RlLmNoaWxkTGVhZk5vZGVzLmZvckVhY2gobGVhZk5vZGUgPT4ge1xyXG4gICAgICAgICAgICAgICAgdmFyIG5vZGVJZCA9IGxlYWZOb2RlLmxlYWZJbmZvW1wiJGR0SWRcIl1cclxuICAgICAgICAgICAgICAgIGlmIChnbG9iYWxDYWNoZS5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbbm9kZUlkXSA9PSBudWxsKSB0d2luSURBcnIucHVzaChub2RlSWQpXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgZ2xvYmFsQ2FjaGUuc3RvcmVBRFRUd2lucyh0d2luc2RhdGEpXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0d2luc2RhdGEubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdmFyIGdyb3VwTmFtZSA9IGdsb2JhbENhY2hlLm1vZGVsSURNYXBUb05hbWVbdHdpbnNkYXRhW2ldW1wiJG1ldGFkYXRhXCJdW1wiJG1vZGVsXCJdXVxyXG4gICAgICAgICAgICB0aGlzLnRyZWUuYWRkTGVhZm5vZGVUb0dyb3VwKGdyb3VwTmFtZSwgdHdpbnNkYXRhW2ldLCBcInNraXBSZXBlYXRcIilcclxuICAgICAgICAgICAgdHdpbklEQXJyLnB1c2godHdpbnNkYXRhW2ldW1wiJGR0SWRcIl0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKHJlcGxhY2VPckFwcGVuZD09XCJyZXBsYWNlXCIpIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInJlcGxhY2VBbGxUd2luc1wiLCBpbmZvOiB0d2luc2RhdGEgfSlcclxuICAgICAgICBlbHNlIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImFwcGVuZEFsbFR3aW5zXCIsIGluZm86IHR3aW5zZGF0YSB9KVxyXG4gICAgICAgIFxyXG5cclxuICAgICAgICB0aGlzLmZldGNoQWxsUmVsYXRpb25zaGlwcyh0d2luSURBcnIpXHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5cclxudHdpbnNUcmVlLnByb3RvdHlwZS5kcmF3VHdpbnNBbmRSZWxhdGlvbnM9IGZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgZGF0YS5jaGlsZFR3aW5zQW5kUmVsYXRpb25zLmZvckVhY2gob25lU2V0PT57XHJcbiAgICAgICAgZm9yKHZhciBpbmQgaW4gb25lU2V0LmNoaWxkVHdpbnMpe1xyXG4gICAgICAgICAgICB2YXIgb25lVHdpbj1vbmVTZXQuY2hpbGRUd2luc1tpbmRdXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd09uZVR3aW4ob25lVHdpbilcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG4gICAgXHJcbiAgICAvL2RyYXcgdGhvc2Uga25vd24gdHdpbnMgZnJvbSB0aGUgcmVsYXRpb25zaGlwc1xyXG4gICAgdmFyIHR3aW5zSW5mbz17fVxyXG4gICAgZGF0YS5jaGlsZFR3aW5zQW5kUmVsYXRpb25zLmZvckVhY2gob25lU2V0PT57XHJcbiAgICAgICAgdmFyIHJlbGF0aW9uc0luZm89b25lU2V0W1wicmVsYXRpb25zaGlwc1wiXVxyXG4gICAgICAgIHJlbGF0aW9uc0luZm8uZm9yRWFjaCgob25lUmVsYXRpb24pPT57XHJcbiAgICAgICAgICAgIHZhciBzcmNJRD1vbmVSZWxhdGlvblsnJHNvdXJjZUlkJ11cclxuICAgICAgICAgICAgdmFyIHRhcmdldElEPW9uZVJlbGF0aW9uWyckdGFyZ2V0SWQnXVxyXG4gICAgICAgICAgICBpZihnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1tzcmNJRF0pXHJcbiAgICAgICAgICAgICAgICB0d2luc0luZm9bc3JjSURdID0gZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbc3JjSURdXHJcbiAgICAgICAgICAgIGlmKGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3RhcmdldElEXSlcclxuICAgICAgICAgICAgICAgIHR3aW5zSW5mb1t0YXJnZXRJRF0gPSBnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1t0YXJnZXRJRF0gICAgXHJcbiAgICAgICAgfSlcclxuICAgIH0pXHJcbiAgICB2YXIgdG1wQXJyPVtdXHJcbiAgICBmb3IodmFyIHR3aW5JRCBpbiB0d2luc0luZm8pIHRtcEFyci5wdXNoKHR3aW5zSW5mb1t0d2luSURdKVxyXG4gICAgdG1wQXJyLmZvckVhY2gob25lVHdpbj0+e3RoaXMuZHJhd09uZVR3aW4ob25lVHdpbil9KVxyXG59XHJcblxyXG50d2luc1RyZWUucHJvdG90eXBlLmRyYXdPbmVUd2luPSBmdW5jdGlvbih0d2luSW5mbyl7XHJcbiAgICB2YXIgZ3JvdXBOYW1lPWdsb2JhbENhY2hlLm1vZGVsSURNYXBUb05hbWVbdHdpbkluZm9bXCIkbWV0YWRhdGFcIl1bXCIkbW9kZWxcIl1dXHJcbiAgICB0aGlzLnRyZWUuYWRkTGVhZm5vZGVUb0dyb3VwKGdyb3VwTmFtZSx0d2luSW5mbyxcInNraXBSZXBlYXRcIilcclxufVxyXG5cclxudHdpbnNUcmVlLnByb3RvdHlwZS5mZXRjaEFsbFJlbGF0aW9uc2hpcHM9IGFzeW5jIGZ1bmN0aW9uKHR3aW5JREFycil7XHJcbiAgICB3aGlsZSh0d2luSURBcnIubGVuZ3RoPjApe1xyXG4gICAgICAgIHZhciBzbWFsbEFycj0gdHdpbklEQXJyLnNwbGljZSgwLCAxMDApO1xyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICAgdmFyIGRhdGEgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9nZXRSZWxhdGlvbnNoaXBzRnJvbVR3aW5JRHNcIiwgXCJQT1NUXCIsIHNtYWxsQXJyKVxyXG4gICAgICAgICAgICBpZiAoZGF0YSA9PSBcIlwiKSBjb250aW51ZTtcclxuICAgICAgICAgICAgZ2xvYmFsQ2FjaGUuc3RvcmVUd2luUmVsYXRpb25zaGlwcyhkYXRhKSAvL3N0b3JlIHRoZW0gaW4gZ2xvYmFsIGF2YWlsYWJsZSBhcnJheVxyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJkcmF3QWxsUmVsYXRpb25zXCIsIGluZm86IGRhdGEgfSlcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gdHdpbnNUcmVlOyIsImNvbnN0IHNpZ251cHNpZ25pbm5hbWU9XCJCMkNfMV9zaW5ndXBzaWduaW5fc3BhYXBwMVwiXHJcbmNvbnN0IGIyY1RlbmFudE5hbWU9XCJhenVyZWlvdGIyY1wiXHJcblxyXG5jb25zdCB1cmwgPSBuZXcgVVJMKHdpbmRvdy5sb2NhdGlvbi5ocmVmKTtcclxuXHJcbnZhciBzdHJBcnI9d2luZG93LmxvY2F0aW9uLmhyZWYuc3BsaXQoXCI/XCIpXHJcbnZhciBpc0xvY2FsVGVzdD0oc3RyQXJyLmluZGV4T2YoXCJ0ZXN0PTFcIikhPS0xKVxyXG5cclxuY29uc3QgZ2xvYmFsQXBwU2V0dGluZ3M9e1xyXG4gICAgXCJiMmNTaWduVXBTaWduSW5OYW1lXCI6IHNpZ251cHNpZ25pbm5hbWUsXHJcbiAgICBcImIyY1Njb3BlX3Rhc2ttYXN0ZXJcIjpcImh0dHBzOi8vXCIrYjJjVGVuYW50TmFtZStcIi5vbm1pY3Jvc29mdC5jb20vdGFza21hc3Rlcm1vZHVsZS9vcGVyYXRpb25cIixcclxuICAgIFwiYjJjU2NvcGVfZnVuY3Rpb25zXCI6XCJodHRwczovL1wiK2IyY1RlbmFudE5hbWUrXCIub25taWNyb3NvZnQuY29tL2F6dXJlaW90cm9ja3NmdW5jdGlvbnMvYmFzaWNcIixcclxuICAgIFwibG9nb3V0UmVkaXJlY3RVcmlcIjogdXJsLm9yaWdpbitcIi9zcGFpbmRleC5odG1sXCIsXHJcbiAgICBcIm1zYWxDb25maWdcIjp7XHJcbiAgICAgICAgYXV0aDoge1xyXG4gICAgICAgICAgICBjbGllbnRJZDogXCJmNDY5M2JlNS02MDFiLTRkMGUtOTIwOC1jMzVkOWFkNjIzODdcIixcclxuICAgICAgICAgICAgYXV0aG9yaXR5OiBcImh0dHBzOi8vXCIrYjJjVGVuYW50TmFtZStcIi5iMmNsb2dpbi5jb20vXCIrYjJjVGVuYW50TmFtZStcIi5vbm1pY3Jvc29mdC5jb20vXCIrc2lnbnVwc2lnbmlubmFtZSxcclxuICAgICAgICAgICAga25vd25BdXRob3JpdGllczogW2IyY1RlbmFudE5hbWUrXCIuYjJjbG9naW4uY29tXCJdLFxyXG4gICAgICAgICAgICByZWRpcmVjdFVyaTogd2luZG93LmxvY2F0aW9uLmhyZWZcclxuICAgICAgICB9LFxyXG4gICAgICAgIGNhY2hlOiB7XHJcbiAgICAgICAgICAgIGNhY2hlTG9jYXRpb246IFwic2Vzc2lvblN0b3JhZ2VcIiwgXHJcbiAgICAgICAgICAgIHN0b3JlQXV0aFN0YXRlSW5Db29raWU6IGZhbHNlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBzeXN0ZW06IHtcclxuICAgICAgICAgICAgbG9nZ2VyT3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgbG9nZ2VyQ2FsbGJhY2s6IChsZXZlbCwgbWVzc2FnZSwgY29udGFpbnNQaWkpID0+IHt9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgXCJpc0xvY2FsVGVzdFwiOmlzTG9jYWxUZXN0LFxyXG4gICAgXCJ0YXNrTWFzdGVyQVBJVVJJXCI6KChpc0xvY2FsVGVzdCk/XCJodHRwOi8vbG9jYWxob3N0OjUwMDIvXCI6XCJodHRwczovL2F6dXJlaW90cm9ja3N0YXNrbWFzdGVybW9kdWxlLmF6dXJld2Vic2l0ZXMubmV0L1wiKSxcclxuICAgIFwiZnVuY3Rpb25zQVBJVVJJXCI6XCJodHRwczovL2F6dXJlaW90cm9ja3NmdW5jdGlvbnMuYXp1cmV3ZWJzaXRlcy5uZXQvYXBpL1wiXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZ2xvYmFsQXBwU2V0dGluZ3M7IiwiY29uc3QgZ2xvYmFsQXBwU2V0dGluZ3M9cmVxdWlyZShcIi4vZ2xvYmFsQXBwU2V0dGluZ3NcIilcclxuXHJcbmZ1bmN0aW9uIG1zYWxIZWxwZXIoKXtcclxuICAgIHRoaXMubXlNU0FMT2JqID0gbmV3IG1zYWwuUHVibGljQ2xpZW50QXBwbGljYXRpb24oZ2xvYmFsQXBwU2V0dGluZ3MubXNhbENvbmZpZyk7XHJcbn1cclxuXHJcbm1zYWxIZWxwZXIucHJvdG90eXBlLnNpZ25Jbj1hc3luYyBmdW5jdGlvbigpe1xyXG4gICAgdHJ5e1xyXG4gICAgICAgIHZhciByZXNwb25zZT0gYXdhaXQgdGhpcy5teU1TQUxPYmoubG9naW5Qb3B1cCh7IHNjb3BlczpbXSAgfSkgLy9nbG9iYWxBcHBTZXR0aW5ncy5iMmNTY29wZXNcclxuICAgICAgICBpZiAocmVzcG9uc2UgIT0gbnVsbCl7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0QWNjb3VudChyZXNwb25zZS5hY2NvdW50KVxyXG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuYWNjb3VudFxyXG4gICAgICAgIH0gXHJcbiAgICAgICAgZWxzZSAgcmV0dXJuIHRoaXMuZmV0Y2hBY2NvdW50KClcclxuICAgIH1jYXRjaChlKXtcclxuICAgICAgICBpZihlLmVycm9yQ29kZSE9XCJ1c2VyX2NhbmNlbGxlZFwiKSBjb25zb2xlLmxvZyhlKVxyXG4gICAgfVxyXG59XHJcblxyXG5tc2FsSGVscGVyLnByb3RvdHlwZS5zZXRBY2NvdW50PWZ1bmN0aW9uKHRoZUFjY291bnQpe1xyXG4gICAgaWYodGhlQWNjb3VudD09bnVsbClyZXR1cm47XHJcbiAgICB0aGlzLmFjY291bnRJZCA9IHRoZUFjY291bnQuaG9tZUFjY291bnRJZDtcclxuICAgIHRoaXMuYWNjb3VudE5hbWUgPSB0aGVBY2NvdW50LnVzZXJuYW1lO1xyXG4gICAgdGhpcy51c2VyTmFtZT10aGVBY2NvdW50Lm5hbWU7XHJcbn1cclxuXHJcbm1zYWxIZWxwZXIucHJvdG90eXBlLmZldGNoQWNjb3VudD1mdW5jdGlvbihub0FuaW1hdGlvbil7XHJcbiAgICBjb25zdCBjdXJyZW50QWNjb3VudHMgPSB0aGlzLm15TVNBTE9iai5nZXRBbGxBY2NvdW50cygpO1xyXG4gICAgaWYgKGN1cnJlbnRBY2NvdW50cy5sZW5ndGggPCAxKSByZXR1cm47XHJcbiAgICB2YXIgZm91bmRBY2NvdW50PW51bGw7XHJcbiAgICBmb3IodmFyIGk9MDtpPGN1cnJlbnRBY2NvdW50cy5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIgYW5BY2NvdW50PSBjdXJyZW50QWNjb3VudHNbaV1cclxuICAgICAgICBpZihhbkFjY291bnQuaG9tZUFjY291bnRJZC50b1VwcGVyQ2FzZSgpLmluY2x1ZGVzKGdsb2JhbEFwcFNldHRpbmdzLmIyY1NpZ25VcFNpZ25Jbk5hbWUudG9VcHBlckNhc2UoKSlcclxuICAgICAgICAgICAgJiYgYW5BY2NvdW50LmlkVG9rZW5DbGFpbXMuaXNzLnRvVXBwZXJDYXNlKCkuaW5jbHVkZXMoZ2xvYmFsQXBwU2V0dGluZ3MubXNhbENvbmZpZy5hdXRoLmtub3duQXV0aG9yaXRpZXNbMF0udG9VcHBlckNhc2UoKSlcclxuICAgICAgICAgICAgJiYgYW5BY2NvdW50LmlkVG9rZW5DbGFpbXMuYXVkID09PSBnbG9iYWxBcHBTZXR0aW5ncy5tc2FsQ29uZmlnLmF1dGguY2xpZW50SWRcclxuICAgICAgICApe1xyXG4gICAgICAgICAgICBmb3VuZEFjY291bnQ9IGFuQWNjb3VudDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLnNldEFjY291bnQoZm91bmRBY2NvdW50KVxyXG4gICAgcmV0dXJuIGZvdW5kQWNjb3VudDtcclxufVxyXG5cclxuXHJcbm1zYWxIZWxwZXIucHJvdG90eXBlLmNhbGxBenVyZUZ1bmN0aW9uc1NlcnZpY2U9YXN5bmMgZnVuY3Rpb24oQVBJU3RyaW5nLFJFU1RNZXRob2QscGF5bG9hZCl7XHJcbiAgICB2YXIgaGVhZGVyc09iaj17fVxyXG4gICAgdmFyIHRva2VuPWF3YWl0IHRoaXMuZ2V0VG9rZW4oZ2xvYmFsQXBwU2V0dGluZ3MuYjJjU2NvcGVfZnVuY3Rpb25zKVxyXG4gICAgaGVhZGVyc09ialtcIkF1dGhvcml6YXRpb25cIl09YEJlYXJlciAke3Rva2VufWBcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgdmFyIGFqYXhDb250ZW50PXtcclxuICAgICAgICAgICAgdHlwZTogUkVTVE1ldGhvZCB8fCAnR0VUJyxcclxuICAgICAgICAgICAgXCJoZWFkZXJzXCI6aGVhZGVyc09iaixcclxuICAgICAgICAgICAgdXJsOiBnbG9iYWxBcHBTZXR0aW5ncy5mdW5jdGlvbnNBUElVUkkrQVBJU3RyaW5nLFxyXG4gICAgICAgICAgICBjb250ZW50VHlwZTogXCJhcHBsaWNhdGlvbi9qc29uOyBjaGFyc2V0PXV0Zi04XCIsXHJcbiAgICAgICAgICAgIGNyb3NzRG9tYWluOiB0cnVlLFxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAocmVzcG9uc2VEYXRhLCB0ZXh0U3RhdHVzLCBqcVhIUikge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZXNwb25zZURhdGEpXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAocmVzcG9uc2VEYXRhLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikge1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KHJlc3BvbnNlRGF0YSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZihSRVNUTWV0aG9kPT1cIlBPU1RcIikgYWpheENvbnRlbnQuZGF0YT0gSlNPTi5zdHJpbmdpZnkocGF5bG9hZClcclxuICAgICAgICAkLmFqYXgoYWpheENvbnRlbnQpO1xyXG4gICAgfSlcclxufVxyXG5cclxubXNhbEhlbHBlci5wcm90b3R5cGUuY2FsbEFQST1hc3luYyBmdW5jdGlvbihBUElTdHJpbmcsUkVTVE1ldGhvZCxwYXlsb2FkKXtcclxuICAgIHZhciBoZWFkZXJzT2JqPXt9XHJcbiAgICBpZighZ2xvYmFsQXBwU2V0dGluZ3MuaXNMb2NhbFRlc3Qpe1xyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICAgdmFyIHRva2VuPWF3YWl0IHRoaXMuZ2V0VG9rZW4oZ2xvYmFsQXBwU2V0dGluZ3MuYjJjU2NvcGVfdGFza21hc3RlcilcclxuICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIHdpbmRvdy5vcGVuKGdsb2JhbEFwcFNldHRpbmdzLmxvZ291dFJlZGlyZWN0VXJpLFwiX3NlbGZcIilcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgaGVhZGVyc09ialtcIkF1dGhvcml6YXRpb25cIl09YEJlYXJlciAke3Rva2VufWBcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIHZhciBhamF4Q29udGVudD17XHJcbiAgICAgICAgICAgIHR5cGU6IFJFU1RNZXRob2QgfHwgJ0dFVCcsXHJcbiAgICAgICAgICAgIFwiaGVhZGVyc1wiOmhlYWRlcnNPYmosXHJcbiAgICAgICAgICAgIHVybDogZ2xvYmFsQXBwU2V0dGluZ3MudGFza01hc3RlckFQSVVSSStBUElTdHJpbmcsXHJcbiAgICAgICAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIixcclxuICAgICAgICAgICAgY3Jvc3NEb21haW46IHRydWUsXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChyZXNwb25zZURhdGEsIHRleHRTdGF0dXMsIGpxWEhSKSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3BvbnNlRGF0YSlcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uIChyZXNwb25zZURhdGEsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKSB7XHJcbiAgICAgICAgICAgICAgICByZWplY3QocmVzcG9uc2VEYXRhKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKFJFU1RNZXRob2Q9PVwiUE9TVFwiKSBhamF4Q29udGVudC5kYXRhPSBKU09OLnN0cmluZ2lmeShwYXlsb2FkKVxyXG4gICAgICAgICQuYWpheChhamF4Q29udGVudCk7XHJcbiAgICB9KVxyXG59XHJcblxyXG5tc2FsSGVscGVyLnByb3RvdHlwZS5nZXRUb2tlbj1hc3luYyBmdW5jdGlvbihiMmNTY29wZSl7XHJcbiAgICB0cnl7XHJcbiAgICAgICAgaWYodGhpcy5zdG9yZWRUb2tlbj09bnVsbCkgdGhpcy5zdG9yZWRUb2tlbj17fVxyXG4gICAgICAgIGlmKHRoaXMuc3RvcmVkVG9rZW5bYjJjU2NvcGVdIT1udWxsKXtcclxuICAgICAgICAgICAgdmFyIGN1cnJUaW1lPXBhcnNlSW50KG5ldyBEYXRlKCkuZ2V0VGltZSgpLzEwMDApXHJcbiAgICAgICAgICAgIGlmKGN1cnJUaW1lKzYwIDwgdGhpcy5zdG9yZWRUb2tlbltiMmNTY29wZV0uZXhwaXJlKSByZXR1cm4gdGhpcy5zdG9yZWRUb2tlbltiMmNTY29wZV0uYWNjZXNzVG9rZW5cclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHRva2VuUmVxdWVzdD17XHJcbiAgICAgICAgICAgIHNjb3BlczogW2IyY1Njb3BlXSxcclxuICAgICAgICAgICAgZm9yY2VSZWZyZXNoOiBmYWxzZSwgLy8gU2V0IHRoaXMgdG8gXCJ0cnVlXCIgdG8gc2tpcCBhIGNhY2hlZCB0b2tlbiBhbmQgZ28gdG8gdGhlIHNlcnZlciB0byBnZXQgYSBuZXcgdG9rZW5cclxuICAgICAgICAgICAgYWNjb3VudDogdGhpcy5teU1TQUxPYmouZ2V0QWNjb3VudEJ5SG9tZUlkKHRoaXMuYWNjb3VudElkKVxyXG4gICAgICAgIH1cclxuICAgIFxyXG4gICAgICAgIHZhciByZXNwb25zZSA9IGF3YWl0IHRoaXMubXlNU0FMT2JqLmFjcXVpcmVUb2tlblNpbGVudCh0b2tlblJlcXVlc3QpXHJcbiAgICAgICAgaWYgKCFyZXNwb25zZS5hY2Nlc3NUb2tlbiB8fCByZXNwb25zZS5hY2Nlc3NUb2tlbiA9PT0gXCJcIikge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgbXNhbC5JbnRlcmFjdGlvblJlcXVpcmVkQXV0aEVycm9yO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnN0b3JlZFRva2VuW2IyY1Njb3BlXT17XCJhY2Nlc3NUb2tlblwiOnJlc3BvbnNlLmFjY2Vzc1Rva2VuLFwiZXhwaXJlXCI6cmVzcG9uc2UuaWRUb2tlbkNsYWltcy5leHB9XHJcbiAgICB9Y2F0Y2goZXJyb3Ipe1xyXG4gICAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIG1zYWwuSW50ZXJhY3Rpb25SZXF1aXJlZEF1dGhFcnJvcikge1xyXG4gICAgICAgICAgICAvLyBmYWxsYmFjayB0byBpbnRlcmFjdGlvbiB3aGVuIHNpbGVudCBjYWxsIGZhaWxzXHJcbiAgICAgICAgICAgIHZhciByZXNwb25zZT1hd2FpdCB0aGlzLm15TVNBTE9iai5hY3F1aXJlVG9rZW5Qb3B1cCh0b2tlblJlcXVlc3QpXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXNwb25zZS5hY2Nlc3NUb2tlbjtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgbXNhbEhlbHBlcigpOyIsImZ1bmN0aW9uIG1vZHVsZVN3aXRjaERpYWxvZygpe1xyXG4gICAgdGhpcy5tb2R1bGVzU2lkZWJhcj0kKCc8ZGl2IGNsYXNzPVwidzMtc2lkZWJhciB3My1iYXItYmxvY2sgdzMtd2hpdGUgdzMtYW5pbWF0ZS1sZWZ0IHczLWNhcmQtNFwiIHN0eWxlPVwiZGlzcGxheTpub25lO2hlaWdodDoxNjBweDt3aWR0aDoyNDBweDtvdmVyZmxvdzpoaWRkZW5cIj48ZGl2IHN0eWxlPVwiaGVpZ2h0OjQwcHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWxlZnQgdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cImZvbnQtc2l6ZToyZW07cGFkZGluZy10b3A6NHB4O3dpZHRoOjU1cHhcIj7imLA8L2J1dHRvbj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cImZvbnQtc2l6ZToxLjVlbTt3aWR0aDo3MHB4O2Zsb2F0OmxlZnQ7Y3Vyc29yOmRlZmF1bHRcIj5PcGVuPC9kaXY+PC9kaXY+PGEgaHJlZj1cIiNcIiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1tZWRpdW1cIj48aW1nIHNyYz1cImZhdmljb25pb3RodWIuaWNvXCIgc3R5bGU9XCJ3aWR0aDoyNXB4O21hcmdpbi1yaWdodDoxMHB4XCI+PC9pbWc+RGV2aWNlIE1hbmFnZW1lbnQ8L2E+PGEgaHJlZj1cIiNcIiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1tZWRpdW1cIj48aW1nIHNyYz1cImZhdmljb25kaWdpdGFsdHdpbi5pY29cIiBzdHlsZT1cIndpZHRoOjI1cHg7bWFyZ2luLXJpZ2h0OjEwcHhcIj48L2ltZz5EaWdpdGFsIFR3aW48L2E+PGEgaHJlZj1cIiNcIiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1tZWRpdW1cIj48aW1nIHNyYz1cImZhdmljb25ldmVudGxvZy5pY29cIiBzdHlsZT1cIndpZHRoOjI1cHg7bWFyZ2luLXJpZ2h0OjEwcHhcIj48L2ltZz5FdmVudCBMb2c8L2E+PC9kaXY+JylcclxuICAgIFxyXG4gICAgdGhpcy5tb2R1bGVzU3dpdGNoQnV0dG9uPSQoJzxhIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uXCIgaHJlZj1cIiNcIj7imLA8L2E+JylcclxuICAgIFxyXG4gICAgdGhpcy5tb2R1bGVzU3dpdGNoQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+eyB0aGlzLm1vZHVsZXNTaWRlYmFyLmNzcyhcImRpc3BsYXlcIixcImJsb2NrXCIpIH0pXHJcbiAgICB0aGlzLm1vZHVsZXNTaWRlYmFyLmNoaWxkcmVuKCc6Zmlyc3QnKS5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLm1vZHVsZXNTaWRlYmFyLmNzcyhcImRpc3BsYXlcIixcIm5vbmVcIil9KVxyXG4gICAgXHJcbiAgICB2YXIgYWxsTW9kZXVscz10aGlzLm1vZHVsZXNTaWRlYmFyLmNoaWxkcmVuKFwiYVwiKVxyXG4gICAgJChhbGxNb2RldWxzWzBdKS5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICB3aW5kb3cub3BlbihcImRldmljZW1hbmFnZW1lbnQuaHRtbFwiLCBcIl9ibGFua1wiKVxyXG4gICAgICAgIHRoaXMubW9kdWxlc1NpZGViYXIuY3NzKFwiZGlzcGxheVwiLFwibm9uZVwiKVxyXG4gICAgfSlcclxuICAgICQoYWxsTW9kZXVsc1sxXSkub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgd2luZG93Lm9wZW4oXCJkaWdpdGFsdHdpbm1vZHVsZS5odG1sXCIsIFwiX2JsYW5rXCIpXHJcbiAgICAgICAgdGhpcy5tb2R1bGVzU2lkZWJhci5jc3MoXCJkaXNwbGF5XCIsXCJub25lXCIpXHJcbiAgICB9KVxyXG4gICAgJChhbGxNb2RldWxzWzJdKS5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICB3aW5kb3cub3BlbihcImV2ZW50bG9nbW9kdWxlLmh0bWxcIiwgXCJfYmxhbmtcIilcclxuICAgICAgICB0aGlzLm1vZHVsZXNTaWRlYmFyLmNzcyhcImRpc3BsYXlcIixcIm5vbmVcIilcclxuICAgIH0pXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IG1vZHVsZVN3aXRjaERpYWxvZygpOyIsImZ1bmN0aW9uIHNpbXBsZUNvbmZpcm1EaWFsb2coKXtcclxuICAgIHRoaXMuRE9NID0gJCgnPGRpdiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7YmFja2dyb3VuZC1jb2xvcjp3aGl0ZTtsZWZ0OjUwJTt0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSkgdHJhbnNsYXRlWSgtNTAlKTt6LWluZGV4OjEwMlwiIGNsYXNzPVwidzMtY2FyZC00XCI+PC9kaXY+JylcclxuICAgIC8vdGhpcy5ET00uY3NzKFwib3ZlcmZsb3dcIixcImhpZGRlblwiKVxyXG59XHJcblxyXG5zaW1wbGVDb25maXJtRGlhbG9nLnByb3RvdHlwZS5zaG93PWZ1bmN0aW9uKGNzc09wdGlvbnMsb3RoZXJPcHRpb25zKXtcclxuICAgIHRoaXMuRE9NLmNzcyhjc3NPcHRpb25zKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6NDBweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiZm9udC1zaXplOjEuMmVtXCI+JyArIG90aGVyT3B0aW9ucy50aXRsZSArICc8L2Rpdj48L2Rpdj4nKSlcclxuICAgIHZhciBjbG9zZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmlnaHRcIiBzdHlsZT1cImZvbnQtc2l6ZToyZW07cGFkZGluZy10b3A6NHB4XCI+w5c8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5ET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZChjbG9zZUJ1dHRvbilcclxuICAgIGNsb3NlQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLmNsb3NlKCkgfSlcclxuXHJcbiAgICB2YXIgZGlhbG9nRGl2PSQoJzxkaXYgY2xhc3M9XCJ3My1jb250YWluZXJcIiBzdHlsZT1cIm1hcmdpbi10b3A6MTBweDttYXJnaW4tYm90dG9tOjEwcHhcIj48L2Rpdj4nKVxyXG4gICAgZGlhbG9nRGl2LnRleHQob3RoZXJPcHRpb25zLmNvbnRlbnQpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQoZGlhbG9nRGl2KVxyXG4gICAgdGhpcy5kaWFsb2dEaXY9ZGlhbG9nRGl2XHJcblxyXG4gICAgdGhpcy5ib3R0b21CYXI9JCgnPGRpdiBjbGFzcz1cInczLWJhclwiPjwvZGl2PicpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQodGhpcy5ib3R0b21CYXIpXHJcblxyXG4gICAgb3RoZXJPcHRpb25zLmJ1dHRvbnMuZm9yRWFjaChidG49PntcclxuICAgICAgICB2YXIgYUJ1dHRvbj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLXJpZ2h0ICcrKGJ0bi5jb2xvckNsYXNzfHxcIlwiKSsnXCIgc3R5bGU9XCJtYXJnaW4tcmlnaHQ6MnB4O21hcmdpbi1sZWZ0OjJweFwiPicrYnRuLnRleHQrJzwvYnV0dG9uPicpXHJcbiAgICAgICAgYUJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PiB7IGJ0bi5jbGlja0Z1bmMoKSAgfSAgKVxyXG4gICAgICAgIHRoaXMuYm90dG9tQmFyLmFwcGVuZChhQnV0dG9uKSAgICBcclxuICAgIH0pXHJcbiAgICAkKFwiYm9keVwiKS5hcHBlbmQodGhpcy5ET00pXHJcbn1cclxuXHJcbnNpbXBsZUNvbmZpcm1EaWFsb2cucHJvdG90eXBlLmNsb3NlPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLkRPTS5yZW1vdmUoKVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHNpbXBsZUNvbmZpcm1EaWFsb2c7IiwiZnVuY3Rpb24gc2ltcGxlU2VsZWN0TWVudShidXR0b25OYW1lLG9wdGlvbnMpe1xyXG4gICAgb3B0aW9ucz1vcHRpb25zfHx7fSAvL3tpc0NsaWNrYWJsZToxLHdpdGhCb3JkZXI6MSxmb250U2l6ZTpcIlwiLGNvbG9yQ2xhc3M6XCJcIixidXR0b25DU1M6XCJcIn1cclxuICAgIGlmKG9wdGlvbnMuaXNDbGlja2FibGUpe1xyXG4gICAgICAgIHRoaXMuaXNDbGlja2FibGU9dHJ1ZVxyXG4gICAgICAgIHRoaXMuRE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1kcm9wZG93bi1jbGlja1wiPjwvZGl2PicpXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB0aGlzLkRPTT0kKCc8ZGl2IGNsYXNzPVwidzMtZHJvcGRvd24taG92ZXIgXCI+PC9kaXY+JylcclxuICAgICAgICB0aGlzLkRPTS5vbihcIm1vdXNlb3ZlclwiLChlKT0+e1xyXG4gICAgICAgICAgICB0aGlzLmFkanVzdERyb3BEb3duUG9zaXRpb24oKVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHRoaXMuYnV0dG9uPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b25cIiBzdHlsZT1cIm91dGxpbmU6IG5vbmU7XCI+PGE+JytidXR0b25OYW1lKyc8L2E+PGEgc3R5bGU9XCJmb250LXdlaWdodDpib2xkO3BhZGRpbmctbGVmdDoycHhcIj48L2E+PGkgY2xhc3M9XCJmYSBmYS1jYXJldC1kb3duXCIgc3R5bGU9XCJwYWRkaW5nLWxlZnQ6M3B4XCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICBpZihvcHRpb25zLndpdGhCb3JkZXIpIHRoaXMuYnV0dG9uLmFkZENsYXNzKFwidzMtYm9yZGVyXCIpXHJcbiAgICBpZihvcHRpb25zLmZvbnRTaXplKSB0aGlzLkRPTS5jc3MoXCJmb250LXNpemVcIixvcHRpb25zLmZvbnRTaXplKVxyXG4gICAgaWYob3B0aW9ucy5jb2xvckNsYXNzKSB0aGlzLmJ1dHRvbi5hZGRDbGFzcyhvcHRpb25zLmNvbG9yQ2xhc3MpXHJcbiAgICBpZihvcHRpb25zLndpZHRoKSB0aGlzLmJ1dHRvbi5jc3MoXCJ3aWR0aFwiLG9wdGlvbnMud2lkdGgpXHJcbiAgICBpZihvcHRpb25zLmJ1dHRvbkNTUykgdGhpcy5idXR0b24uY3NzKG9wdGlvbnMuYnV0dG9uQ1NTKVxyXG4gICAgaWYob3B0aW9ucy5hZGp1c3RQb3NpdGlvbkFuY2hvcikgdGhpcy5hZGp1c3RQb3NpdGlvbkFuY2hvcj1vcHRpb25zLmFkanVzdFBvc2l0aW9uQW5jaG9yXHJcblxyXG4gICAgdGhpcy5vcHRpb25Db250ZW50RE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1kcm9wZG93bi1jb250ZW50IHczLWJhci1ibG9jayB3My1jYXJkLTRcIj48L2Rpdj4nKVxyXG4gICAgaWYob3B0aW9ucy5vcHRpb25MaXN0SGVpZ2h0KSB0aGlzLm9wdGlvbkNvbnRlbnRET00uY3NzKHtoZWlnaHQ6b3B0aW9ucy5vcHRpb25MaXN0SGVpZ2h0K1wicHhcIixcIm92ZXJmbG93LXlcIjpcImF1dG9cIixcIm92ZXJmbG93LXhcIjpcInZpc2libGVcIn0pXHJcbiAgICBpZihvcHRpb25zLm9wdGlvbkxpc3RNYXJnaW5Ub3ApIHRoaXMub3B0aW9uQ29udGVudERPTS5jc3Moe1wibWFyZ2luLXRvcFwiOm9wdGlvbnMub3B0aW9uTGlzdE1hcmdpblRvcCtcInB4XCJ9KVxyXG4gICAgaWYob3B0aW9ucy5vcHRpb25MaXN0TWFyZ2luTGVmdCkgdGhpcy5vcHRpb25Db250ZW50RE9NLmNzcyh7XCJtYXJnaW4tbGVmdFwiOm9wdGlvbnMub3B0aW9uTGlzdE1hcmdpbkxlZnQrXCJweFwifSlcclxuICAgIFxyXG4gICAgdGhpcy5ET00uYXBwZW5kKHRoaXMuYnV0dG9uLHRoaXMub3B0aW9uQ29udGVudERPTSlcclxuICAgIHRoaXMuY3VyU2VsZWN0VmFsPW51bGw7XHJcblxyXG4gICAgaWYob3B0aW9ucy5pc0NsaWNrYWJsZSl7XHJcbiAgICAgICAgdGhpcy5idXR0b24ub24oXCJjbGlja1wiLChlKT0+e1xyXG4gICAgICAgICAgICB0aGlzLmFkanVzdERyb3BEb3duUG9zaXRpb24oKVxyXG4gICAgICAgICAgICBpZih0aGlzLm9wdGlvbkNvbnRlbnRET00uaGFzQ2xhc3MoXCJ3My1zaG93XCIpKSAgdGhpcy5vcHRpb25Db250ZW50RE9NLnJlbW92ZUNsYXNzKFwidzMtc2hvd1wiKVxyXG4gICAgICAgICAgICBlbHNlIHRoaXMub3B0aW9uQ29udGVudERPTS5hZGRDbGFzcyhcInczLXNob3dcIilcclxuICAgICAgICB9KSAgICBcclxuICAgIH1cclxufVxyXG5cclxuc2ltcGxlU2VsZWN0TWVudS5wcm90b3R5cGUuYWRqdXN0RHJvcERvd25Qb3NpdGlvbj1mdW5jdGlvbigpe1xyXG4gICAgaWYoIXRoaXMuYWRqdXN0UG9zaXRpb25BbmNob3IpIHJldHVybjtcclxuICAgIHZhciBvZmZzZXQ9dGhpcy5ET00ub2Zmc2V0KClcclxuICAgIHZhciBuZXdUb3A9b2Zmc2V0LnRvcC10aGlzLmFkanVzdFBvc2l0aW9uQW5jaG9yLnRvcFxyXG4gICAgdmFyIG5ld0xlZnQ9b2Zmc2V0LmxlZnQtdGhpcy5hZGp1c3RQb3NpdGlvbkFuY2hvci5sZWZ0XHJcbiAgICB0aGlzLm9wdGlvbkNvbnRlbnRET00uY3NzKHtcInRvcFwiOm5ld1RvcCtcInB4XCIsXCJsZWZ0XCI6bmV3TGVmdCtcInB4XCJ9KVxyXG59XHJcblxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS5maW5kT3B0aW9uPWZ1bmN0aW9uKG9wdGlvblZhbHVlKXtcclxuICAgIHZhciBvcHRpb25zPXRoaXMub3B0aW9uQ29udGVudERPTS5jaGlsZHJlbigpXHJcbiAgICBmb3IodmFyIGk9MDtpPG9wdGlvbnMubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIGFuT3B0aW9uPSQob3B0aW9uc1tpXSlcclxuICAgICAgICBpZihvcHRpb25WYWx1ZT09YW5PcHRpb24uZGF0YShcIm9wdGlvblZhbHVlXCIpKXtcclxuICAgICAgICAgICAgcmV0dXJuIHtcInRleHRcIjphbk9wdGlvbi50ZXh0KCksXCJ2YWx1ZVwiOmFuT3B0aW9uLmRhdGEoXCJvcHRpb25WYWx1ZVwiKX1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbnNpbXBsZVNlbGVjdE1lbnUucHJvdG90eXBlLmFkZE9wdGlvbkFycj1mdW5jdGlvbihhcnIpe1xyXG4gICAgYXJyLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgdGhpcy5hZGRPcHRpb24oZWxlbWVudClcclxuICAgIH0pO1xyXG59XHJcblxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS5hZGRPcHRpb249ZnVuY3Rpb24ob3B0aW9uVGV4dCxvcHRpb25WYWx1ZSl7XHJcbiAgICB2YXIgb3B0aW9uSXRlbT0kKCc8YSBocmVmPVwiI1wiIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uXCI+JytvcHRpb25UZXh0Kyc8L2E+JylcclxuICAgIHRoaXMub3B0aW9uQ29udGVudERPTS5hcHBlbmQob3B0aW9uSXRlbSlcclxuICAgIG9wdGlvbkl0ZW0uZGF0YShcIm9wdGlvblZhbHVlXCIsb3B0aW9uVmFsdWV8fG9wdGlvblRleHQpXHJcbiAgICBvcHRpb25JdGVtLm9uKCdjbGljaycsKGUpPT57XHJcbiAgICAgICAgdGhpcy5jdXJTZWxlY3RWYWw9b3B0aW9uSXRlbS5kYXRhKFwib3B0aW9uVmFsdWVcIilcclxuICAgICAgICBpZih0aGlzLmlzQ2xpY2thYmxlKXtcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25Db250ZW50RE9NLnJlbW92ZUNsYXNzKFwidzMtc2hvd1wiKVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICB0aGlzLkRPTS5yZW1vdmVDbGFzcygndzMtZHJvcGRvd24taG92ZXInKVxyXG4gICAgICAgICAgICB0aGlzLkRPTS5hZGRDbGFzcygndzMtZHJvcGRvd24tY2xpY2snKVxyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHsgLy90aGlzIGlzIHRvIGhpZGUgdGhlIGRyb3AgZG93biBtZW51IGFmdGVyIGNsaWNrXHJcbiAgICAgICAgICAgICAgICB0aGlzLkRPTS5hZGRDbGFzcygndzMtZHJvcGRvd24taG92ZXInKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5ET00ucmVtb3ZlQ2xhc3MoJ3czLWRyb3Bkb3duLWNsaWNrJylcclxuICAgICAgICAgICAgfSwgMTAwKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5jYWxsQmFja19jbGlja09wdGlvbihvcHRpb25UZXh0LG9wdGlvbkl0ZW0uZGF0YShcIm9wdGlvblZhbHVlXCIpLFwicmVhbE1vdXNlQ2xpY2tcIilcclxuICAgIH0pXHJcbn1cclxuXHJcbnNpbXBsZVNlbGVjdE1lbnUucHJvdG90eXBlLmNoYW5nZU5hbWU9ZnVuY3Rpb24obmFtZVN0cjEsbmFtZVN0cjIpe1xyXG4gICAgdGhpcy5idXR0b24uY2hpbGRyZW4oXCI6Zmlyc3RcIikudGV4dChuYW1lU3RyMSlcclxuICAgIHRoaXMuYnV0dG9uLmNoaWxkcmVuKCkuZXEoMSkudGV4dChuYW1lU3RyMilcclxufVxyXG5cclxuc2ltcGxlU2VsZWN0TWVudS5wcm90b3R5cGUudHJpZ2dlck9wdGlvbkluZGV4PWZ1bmN0aW9uKG9wdGlvbkluZGV4KXtcclxuICAgIHZhciB0aGVPcHRpb249dGhpcy5vcHRpb25Db250ZW50RE9NLmNoaWxkcmVuKCkuZXEob3B0aW9uSW5kZXgpXHJcbiAgICBpZih0aGVPcHRpb24ubGVuZ3RoPT0wKSB7XHJcbiAgICAgICAgdGhpcy5jdXJTZWxlY3RWYWw9bnVsbDtcclxuICAgICAgICB0aGlzLmNhbGxCYWNrX2NsaWNrT3B0aW9uKG51bGwsbnVsbClcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB0aGlzLmN1clNlbGVjdFZhbD10aGVPcHRpb24uZGF0YShcIm9wdGlvblZhbHVlXCIpXHJcbiAgICB0aGlzLmNhbGxCYWNrX2NsaWNrT3B0aW9uKHRoZU9wdGlvbi50ZXh0KCksdGhlT3B0aW9uLmRhdGEoXCJvcHRpb25WYWx1ZVwiKSlcclxufVxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS50cmlnZ2VyT3B0aW9uVmFsdWU9ZnVuY3Rpb24ob3B0aW9uVmFsdWUpe1xyXG4gICAgdmFyIHJlPXRoaXMuZmluZE9wdGlvbihvcHRpb25WYWx1ZSlcclxuICAgIGlmKHJlPT1udWxsKXtcclxuICAgICAgICB0aGlzLmN1clNlbGVjdFZhbD1udWxsXHJcbiAgICAgICAgdGhpcy5jYWxsQmFja19jbGlja09wdGlvbihudWxsLG51bGwpXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB0aGlzLmN1clNlbGVjdFZhbD1yZS52YWx1ZVxyXG4gICAgICAgIHRoaXMuY2FsbEJhY2tfY2xpY2tPcHRpb24ocmUudGV4dCxyZS52YWx1ZSlcclxuICAgIH1cclxufVxyXG5cclxuXHJcbnNpbXBsZVNlbGVjdE1lbnUucHJvdG90eXBlLmNsZWFyT3B0aW9ucz1mdW5jdGlvbihvcHRpb25UZXh0LG9wdGlvblZhbHVlKXtcclxuICAgIHRoaXMub3B0aW9uQ29udGVudERPTS5lbXB0eSgpXHJcbiAgICB0aGlzLmN1clNlbGVjdFZhbD1udWxsO1xyXG59XHJcblxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS5jYWxsQmFja19jbGlja09wdGlvbj1mdW5jdGlvbihvcHRpb250ZXh0LG9wdGlvblZhbHVlLHJlYWxNb3VzZUNsaWNrKXtcclxuXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gc2ltcGxlU2VsZWN0TWVudTsiLCIndXNlIHN0cmljdCc7XHJcblxyXG5mdW5jdGlvbiBzaW1wbGVUcmVlKERPTSxvcHRpb25zKXtcclxuICAgIHRoaXMuRE9NPURPTVxyXG4gICAgdGhpcy5ncm91cE5vZGVzPVtdIC8vZWFjaCBncm91cCBoZWFkZXIgaXMgb25lIG5vZGVcclxuICAgIHRoaXMuc2VsZWN0ZWROb2Rlcz1bXTtcclxuICAgIHRoaXMub3B0aW9ucz1vcHRpb25zIHx8IHt9XHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLnNjcm9sbFRvTGVhZk5vZGU9ZnVuY3Rpb24oYU5vZGUpe1xyXG4gICAgdmFyIHNjcm9sbFRvcD10aGlzLkRPTS5zY3JvbGxUb3AoKVxyXG4gICAgdmFyIHRyZWVIZWlnaHQ9dGhpcy5ET00uaGVpZ2h0KClcclxuICAgIHZhciBub2RlUG9zaXRpb249YU5vZGUuRE9NLnBvc2l0aW9uKCkudG9wIC8vd2hpY2ggZG9lcyBub3QgY29uc2lkZXIgcGFyZW50IERPTSdzIHNjcm9sbCBoZWlnaHRcclxuICAgIC8vY29uc29sZS5sb2coc2Nyb2xsVG9wLHRyZWVIZWlnaHQsbm9kZVBvc2l0aW9uKVxyXG4gICAgaWYodHJlZUhlaWdodC01MDxub2RlUG9zaXRpb24pe1xyXG4gICAgICAgIHRoaXMuRE9NLnNjcm9sbFRvcChzY3JvbGxUb3AgKyBub2RlUG9zaXRpb24tKHRyZWVIZWlnaHQtNTApKSBcclxuICAgIH1lbHNlIGlmKG5vZGVQb3NpdGlvbjw1MCl7XHJcbiAgICAgICAgdGhpcy5ET00uc2Nyb2xsVG9wKHNjcm9sbFRvcCArIChub2RlUG9zaXRpb24tNTApKSBcclxuICAgIH1cclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuY2xlYXJBbGxMZWFmTm9kZXM9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5mb3JFYWNoKChnTm9kZSk9PntcclxuICAgICAgICBnTm9kZS5saXN0RE9NLmVtcHR5KClcclxuICAgICAgICBnTm9kZS5jaGlsZExlYWZOb2Rlcy5sZW5ndGg9MFxyXG4gICAgICAgIGdOb2RlLnJlZnJlc2hOYW1lKClcclxuICAgIH0pXHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmZpcnN0TGVhZk5vZGU9ZnVuY3Rpb24oKXtcclxuICAgIGlmKHRoaXMuZ3JvdXBOb2Rlcy5sZW5ndGg9PTApIHJldHVybiBudWxsO1xyXG4gICAgdmFyIGZpcnN0TGVhZk5vZGU9bnVsbDtcclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5mb3JFYWNoKGFHcm91cE5vZGU9PntcclxuICAgICAgICBpZihmaXJzdExlYWZOb2RlIT1udWxsKSByZXR1cm47XHJcbiAgICAgICAgaWYoYUdyb3VwTm9kZS5jaGlsZExlYWZOb2Rlcy5sZW5ndGg+MCkgZmlyc3RMZWFmTm9kZT1hR3JvdXBOb2RlLmNoaWxkTGVhZk5vZGVzWzBdXHJcbiAgICB9KVxyXG5cclxuICAgIHJldHVybiBmaXJzdExlYWZOb2RlXHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLm5leHRHcm91cE5vZGU9ZnVuY3Rpb24oYUdyb3VwTm9kZSl7XHJcbiAgICBpZihhR3JvdXBOb2RlPT1udWxsKSByZXR1cm47XHJcbiAgICB2YXIgaW5kZXg9dGhpcy5ncm91cE5vZGVzLmluZGV4T2YoYUdyb3VwTm9kZSlcclxuICAgIGlmKHRoaXMuZ3JvdXBOb2Rlcy5sZW5ndGgtMT5pbmRleCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ3JvdXBOb2Rlc1tpbmRleCsxXVxyXG4gICAgfWVsc2V7IC8vcm90YXRlIGJhY2t3YXJkIHRvIGZpcnN0IGdyb3VwIG5vZGVcclxuICAgICAgICByZXR1cm4gdGhpcy5ncm91cE5vZGVzWzBdIFxyXG4gICAgfVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5uZXh0TGVhZk5vZGU9ZnVuY3Rpb24oYUxlYWZOb2RlKXtcclxuICAgIGlmKGFMZWFmTm9kZT09bnVsbCkgcmV0dXJuO1xyXG4gICAgdmFyIGFHcm91cE5vZGU9YUxlYWZOb2RlLnBhcmVudEdyb3VwTm9kZVxyXG4gICAgdmFyIGluZGV4PWFHcm91cE5vZGUuY2hpbGRMZWFmTm9kZXMuaW5kZXhPZihhTGVhZk5vZGUpXHJcbiAgICBpZihhR3JvdXBOb2RlLmNoaWxkTGVhZk5vZGVzLmxlbmd0aC0xPmluZGV4KXtcclxuICAgICAgICAvL25leHQgbm9kZSBpcyBpbiBzYW1lIGdyb3VwXHJcbiAgICAgICAgcmV0dXJuIGFHcm91cE5vZGUuY2hpbGRMZWFmTm9kZXNbaW5kZXgrMV1cclxuICAgIH1lbHNle1xyXG4gICAgICAgIC8vZmluZCBuZXh0IGdyb3VwIGZpcnN0IG5vZGVcclxuICAgICAgICB3aGlsZSh0cnVlKXtcclxuICAgICAgICAgICAgdmFyIG5leHRHcm91cE5vZGUgPSB0aGlzLm5leHRHcm91cE5vZGUoYUdyb3VwTm9kZSlcclxuICAgICAgICAgICAgaWYobmV4dEdyb3VwTm9kZS5jaGlsZExlYWZOb2Rlcy5sZW5ndGg9PTApe1xyXG4gICAgICAgICAgICAgICAgYUdyb3VwTm9kZT1uZXh0R3JvdXBOb2RlXHJcbiAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5leHRHcm91cE5vZGUuY2hpbGRMZWFmTm9kZXNbMF1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuc2VhcmNoVGV4dD1mdW5jdGlvbihzdHIpe1xyXG4gICAgaWYoc3RyPT1cIlwiKSByZXR1cm4gbnVsbDtcclxuICAgIC8vc2VhcmNoIGZyb20gY3VycmVudCBzZWxlY3QgaXRlbSB0aGUgbmV4dCBsZWFmIGl0ZW0gY29udGFpbnMgdGhlIHRleHRcclxuICAgIHZhciByZWdleCA9IG5ldyBSZWdFeHAoc3RyLCAnaScpO1xyXG4gICAgdmFyIHN0YXJ0Tm9kZVxyXG4gICAgaWYodGhpcy5zZWxlY3RlZE5vZGVzLmxlbmd0aD09MCkge1xyXG4gICAgICAgIHN0YXJ0Tm9kZT10aGlzLmZpcnN0TGVhZk5vZGUoKVxyXG4gICAgICAgIGlmKHN0YXJ0Tm9kZT09bnVsbCkgcmV0dXJuO1xyXG4gICAgICAgIHZhciB0aGVTdHI9c3RhcnROb2RlLm5hbWU7XHJcbiAgICAgICAgaWYodGhlU3RyLm1hdGNoKHJlZ2V4KSE9bnVsbCl7XHJcbiAgICAgICAgICAgIC8vZmluZCB0YXJnZXQgbm9kZSBcclxuICAgICAgICAgICAgcmV0dXJuIHN0YXJ0Tm9kZVxyXG4gICAgICAgIH1cclxuICAgIH1lbHNlIHN0YXJ0Tm9kZT10aGlzLnNlbGVjdGVkTm9kZXNbMF1cclxuXHJcbiAgICBpZihzdGFydE5vZGU9PW51bGwpIHJldHVybiBudWxsO1xyXG4gICAgXHJcbiAgICB2YXIgZnJvbU5vZGU9c3RhcnROb2RlO1xyXG4gICAgd2hpbGUodHJ1ZSl7XHJcbiAgICAgICAgdmFyIG5leHROb2RlPXRoaXMubmV4dExlYWZOb2RlKGZyb21Ob2RlKVxyXG4gICAgICAgIGlmKG5leHROb2RlPT1zdGFydE5vZGUpIHJldHVybiBudWxsO1xyXG4gICAgICAgIHZhciBuZXh0Tm9kZVN0cj1uZXh0Tm9kZS5uYW1lO1xyXG4gICAgICAgIGlmKG5leHROb2RlU3RyLm1hdGNoKHJlZ2V4KSE9bnVsbCl7XHJcbiAgICAgICAgICAgIC8vZmluZCB0YXJnZXQgbm9kZVxyXG4gICAgICAgICAgICByZXR1cm4gbmV4dE5vZGVcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgZnJvbU5vZGU9bmV4dE5vZGU7XHJcbiAgICAgICAgfVxyXG4gICAgfSAgICBcclxufVxyXG5cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmFkZExlYWZub2RlVG9Hcm91cD1mdW5jdGlvbihncm91cE5hbWUsb2JqLHNraXBSZXBlYXQpe1xyXG4gICAgdmFyIGFHcm91cE5vZGU9dGhpcy5maW5kR3JvdXBOb2RlKGdyb3VwTmFtZSlcclxuICAgIGlmKGFHcm91cE5vZGUgPT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgYUdyb3VwTm9kZS5hZGROb2RlKG9iaixza2lwUmVwZWF0KVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5yZW1vdmVBbGxOb2Rlcz1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5ncm91cE5vZGVzLmxlbmd0aD0wO1xyXG4gICAgdGhpcy5zZWxlY3RlZE5vZGVzLmxlbmd0aD0wO1xyXG4gICAgdGhpcy5ET00uZW1wdHkoKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5maW5kR3JvdXBOb2RlPWZ1bmN0aW9uKGdyb3VwTmFtZSl7XHJcbiAgICB2YXIgZm91bmRHcm91cE5vZGU9bnVsbFxyXG4gICAgdGhpcy5ncm91cE5vZGVzLmZvckVhY2goYUdyb3VwTm9kZT0+e1xyXG4gICAgICAgIGlmKGFHcm91cE5vZGUubmFtZT09Z3JvdXBOYW1lKXtcclxuICAgICAgICAgICAgZm91bmRHcm91cE5vZGU9YUdyb3VwTm9kZVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuICAgIHJldHVybiBmb3VuZEdyb3VwTm9kZTtcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuZGVsR3JvdXBOb2RlPWZ1bmN0aW9uKGdub2RlKXtcclxuICAgIGdub2RlLmRlbGV0ZVNlbGYoKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5kZWxldGVMZWFmTm9kZT1mdW5jdGlvbihub2RlTmFtZSl7XHJcbiAgICB2YXIgZmluZExlYWZOb2RlPW51bGxcclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5mb3JFYWNoKChnTm9kZSk9PntcclxuICAgICAgICBpZihmaW5kTGVhZk5vZGUhPW51bGwpIHJldHVybjtcclxuICAgICAgICBnTm9kZS5jaGlsZExlYWZOb2Rlcy5mb3JFYWNoKChhTGVhZik9PntcclxuICAgICAgICAgICAgaWYoYUxlYWYubmFtZT09bm9kZU5hbWUpe1xyXG4gICAgICAgICAgICAgICAgZmluZExlYWZOb2RlPWFMZWFmXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgfSlcclxuICAgIGlmKGZpbmRMZWFmTm9kZT09bnVsbCkgcmV0dXJuO1xyXG4gICAgZmluZExlYWZOb2RlLmRlbGV0ZVNlbGYoKVxyXG59XHJcblxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuaW5zZXJ0R3JvdXBOb2RlPWZ1bmN0aW9uKG9iaixpbmRleCl7XHJcbiAgICB2YXIgYU5ld0dyb3VwTm9kZSA9IG5ldyBzaW1wbGVUcmVlR3JvdXBOb2RlKHRoaXMsb2JqKVxyXG4gICAgdmFyIGV4aXN0R3JvdXBOb2RlPSB0aGlzLmZpbmRHcm91cE5vZGUoYU5ld0dyb3VwTm9kZS5uYW1lKVxyXG4gICAgaWYoZXhpc3RHcm91cE5vZGUhPW51bGwpIHJldHVybjtcclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5zcGxpY2UoaW5kZXgsIDAsIGFOZXdHcm91cE5vZGUpO1xyXG5cclxuICAgIGlmKGluZGV4PT0wKXtcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQoYU5ld0dyb3VwTm9kZS5oZWFkZXJET00pXHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKGFOZXdHcm91cE5vZGUubGlzdERPTSlcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHZhciBwcmV2R3JvdXBOb2RlPXRoaXMuZ3JvdXBOb2Rlc1tpbmRleC0xXVxyXG4gICAgICAgIGFOZXdHcm91cE5vZGUuaGVhZGVyRE9NLmluc2VydEFmdGVyKHByZXZHcm91cE5vZGUubGlzdERPTSlcclxuICAgICAgICBhTmV3R3JvdXBOb2RlLmxpc3RET00uaW5zZXJ0QWZ0ZXIoYU5ld0dyb3VwTm9kZS5oZWFkZXJET00pXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGFOZXdHcm91cE5vZGU7XHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmFkZEdyb3VwTm9kZT1mdW5jdGlvbihvYmope1xyXG4gICAgdmFyIGFOZXdHcm91cE5vZGUgPSBuZXcgc2ltcGxlVHJlZUdyb3VwTm9kZSh0aGlzLG9iailcclxuICAgIHZhciBleGlzdEdyb3VwTm9kZT0gdGhpcy5maW5kR3JvdXBOb2RlKGFOZXdHcm91cE5vZGUubmFtZSlcclxuICAgIGlmKGV4aXN0R3JvdXBOb2RlIT1udWxsKSByZXR1cm4gZXhpc3RHcm91cE5vZGU7XHJcbiAgICB0aGlzLmdyb3VwTm9kZXMucHVzaChhTmV3R3JvdXBOb2RlKTtcclxuICAgIHRoaXMuRE9NLmFwcGVuZChhTmV3R3JvdXBOb2RlLmhlYWRlckRPTSlcclxuICAgIHRoaXMuRE9NLmFwcGVuZChhTmV3R3JvdXBOb2RlLmxpc3RET00pXHJcbiAgICByZXR1cm4gYU5ld0dyb3VwTm9kZTtcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuc2VsZWN0TGVhZk5vZGU9ZnVuY3Rpb24obGVhZk5vZGUsbW91c2VDbGlja0RldGFpbCl7XHJcbiAgICB0aGlzLnNlbGVjdExlYWZOb2RlQXJyKFtsZWFmTm9kZV0sbW91c2VDbGlja0RldGFpbClcclxufVxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5hcHBlbmRMZWFmTm9kZVRvU2VsZWN0aW9uPWZ1bmN0aW9uKGxlYWZOb2RlKXtcclxuICAgIGlmKHRoaXMub3B0aW9ucy5ub011bHRpcGxlU2VsZWN0QWxsb3dlZCl7XHJcbiAgICAgICAgdGhpcy5zZWxlY3RMZWFmTm9kZShsZWFmTm9kZSlcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9IFxyXG4gICAgdmFyIG5ld0Fycj1bXS5jb25jYXQodGhpcy5zZWxlY3RlZE5vZGVzKVxyXG4gICAgbmV3QXJyLnB1c2gobGVhZk5vZGUpXHJcbiAgICB0aGlzLnNlbGVjdExlYWZOb2RlQXJyKG5ld0FycilcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuc2VsZWN0R3JvdXBOb2RlPWZ1bmN0aW9uKGdyb3VwTm9kZSl7XHJcbiAgICBpZih0aGlzLmNhbGxiYWNrX2FmdGVyU2VsZWN0R3JvdXBOb2RlKSB0aGlzLmNhbGxiYWNrX2FmdGVyU2VsZWN0R3JvdXBOb2RlKGdyb3VwTm9kZS5pbmZvKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5zZWxlY3RMZWFmTm9kZUFycj1mdW5jdGlvbihsZWFmTm9kZUFycixtb3VzZUNsaWNrRGV0YWlsKXtcclxuICAgIGZvcih2YXIgaT0wO2k8dGhpcy5zZWxlY3RlZE5vZGVzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHRoaXMuc2VsZWN0ZWROb2Rlc1tpXS5kaW0oKVxyXG4gICAgfVxyXG4gICAgdGhpcy5zZWxlY3RlZE5vZGVzLmxlbmd0aD0wO1xyXG4gICAgdGhpcy5zZWxlY3RlZE5vZGVzPXRoaXMuc2VsZWN0ZWROb2Rlcy5jb25jYXQobGVhZk5vZGVBcnIpXHJcbiAgICBmb3IodmFyIGk9MDtpPHRoaXMuc2VsZWN0ZWROb2Rlcy5sZW5ndGg7aSsrKXtcclxuICAgICAgICB0aGlzLnNlbGVjdGVkTm9kZXNbaV0uaGlnaGxpZ2h0KClcclxuICAgIH1cclxuXHJcbiAgICBpZih0aGlzLmNhbGxiYWNrX2FmdGVyU2VsZWN0Tm9kZXMpIHRoaXMuY2FsbGJhY2tfYWZ0ZXJTZWxlY3ROb2Rlcyh0aGlzLnNlbGVjdGVkTm9kZXMsbW91c2VDbGlja0RldGFpbClcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuZGJsQ2xpY2tOb2RlPWZ1bmN0aW9uKHRoZU5vZGUpe1xyXG4gICAgaWYodGhpcy5jYWxsYmFja19hZnRlckRibGNsaWNrTm9kZSkgdGhpcy5jYWxsYmFja19hZnRlckRibGNsaWNrTm9kZSh0aGVOb2RlKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5zb3J0QWxsTGVhdmVzPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLmdyb3VwTm9kZXMuZm9yRWFjaChvbmVHcm91cE5vZGU9PntvbmVHcm91cE5vZGUuc29ydE5vZGVzQnlOYW1lKCl9KVxyXG59XHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS10cmVlIGdyb3VwIG5vZGUtLS0tLS0tLS0tLS0tLS1cclxuZnVuY3Rpb24gc2ltcGxlVHJlZUdyb3VwTm9kZShwYXJlbnRUcmVlLG9iail7XHJcbiAgICB0aGlzLnBhcmVudFRyZWU9cGFyZW50VHJlZVxyXG4gICAgdGhpcy5pbmZvPW9ialxyXG4gICAgdGhpcy5jaGlsZExlYWZOb2Rlcz1bXSAvL2l0J3MgY2hpbGQgbGVhZiBub2RlcyBhcnJheVxyXG4gICAgdGhpcy5uYW1lPW9iai5kaXNwbGF5TmFtZTtcclxuICAgIHRoaXMuY3JlYXRlRE9NKClcclxufVxyXG5cclxuc2ltcGxlVHJlZUdyb3VwTm9kZS5wcm90b3R5cGUucmVmcmVzaE5hbWU9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuaGVhZGVyRE9NLmVtcHR5KClcclxuICAgIHZhciBuYW1lRGl2PSQoXCI8ZGl2IHN0eWxlPSdkaXNwbGF5OmlubGluZTtwYWRkaW5nLXJpZ2h0OjNweDt2ZXJ0aWNhbC1hbGlnbjptaWRkbGUnPjwvZGl2PlwiKVxyXG4gICAgbmFtZURpdi50ZXh0KHRoaXMubmFtZSlcclxuICAgIFxyXG4gICAgaWYodGhpcy5jaGlsZExlYWZOb2Rlcy5sZW5ndGg+MCkgbGJsQ29sb3I9XCJ5ZWxsb3dncmVlblwiXHJcbiAgICBlbHNlIHZhciBsYmxDb2xvcj1cImdyYXlcIiBcclxuICAgIHRoaXMuaGVhZGVyRE9NLmNzcyhcImZvbnQtd2VpZ2h0XCIsXCJib2xkXCIpXHJcblxyXG4gICAgaWYodGhpcy5wYXJlbnRUcmVlLm9wdGlvbnMuZ3JvdXBOb2RlSWNvbkZ1bmMpe1xyXG4gICAgICAgIHZhciBpY29uTGFiZWw9dGhpcy5wYXJlbnRUcmVlLm9wdGlvbnMuZ3JvdXBOb2RlSWNvbkZ1bmModGhpcylcclxuICAgICAgICB0aGlzLmhlYWRlckRPTS5hcHBlbmQoaWNvbkxhYmVsKVxyXG4gICAgfVxyXG4gICAgdmFyIG51bWJlcmxhYmVsPSQoXCI8bGFiZWwgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO2JhY2tncm91bmQtY29sb3I6XCIrbGJsQ29sb3JcclxuICAgICAgICArXCI7Y29sb3I6d2hpdGU7Zm9udC1zaXplOjlweDtwYWRkaW5nOjJweCA0cHg7Zm9udC13ZWlnaHQ6bm9ybWFsO2JvcmRlci1yYWRpdXM6IDJweDsnPlwiK3RoaXMuY2hpbGRMZWFmTm9kZXMubGVuZ3RoK1wiPC9sYWJlbD5cIilcclxuICAgIHRoaXMuaGVhZGVyRE9NLmFwcGVuZChuYW1lRGl2LG51bWJlcmxhYmVsKVxyXG4gICAgdGhpcy5jaGVja09wdGlvbkhpZGVFbXB0eUdyb3VwKClcclxuXHJcbn1cclxuc2ltcGxlVHJlZUdyb3VwTm9kZS5wcm90b3R5cGUuY2hlY2tPcHRpb25IaWRlRW1wdHlHcm91cD1mdW5jdGlvbigpe1xyXG4gICAgaWYgKHRoaXMucGFyZW50VHJlZS5vcHRpb25zLmhpZGVFbXB0eUdyb3VwICYmIHRoaXMuY2hpbGRMZWFmTm9kZXMubGVuZ3RoID09IDApIHtcclxuICAgICAgICB0aGlzLnNocmluaygpXHJcbiAgICAgICAgdGhpcy5oZWFkZXJET00uaGlkZSgpXHJcbiAgICAgICAgaWYgKHRoaXMubGlzdERPTSkgdGhpcy5saXN0RE9NLmhpZGUoKVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmhlYWRlckRPTS5zaG93KClcclxuICAgICAgICBpZiAodGhpcy5saXN0RE9NKSB0aGlzLmxpc3RET00uc2hvdygpXHJcbiAgICB9XHJcblxyXG59XHJcbnNpbXBsZVRyZWVHcm91cE5vZGUucHJvdG90eXBlLmRlbGV0ZVNlbGYgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLmhlYWRlckRPTS5yZW1vdmUoKVxyXG4gICAgdGhpcy5saXN0RE9NLnJlbW92ZSgpXHJcbiAgICB2YXIgcGFyZW50QXJyID0gdGhpcy5wYXJlbnRUcmVlLmdyb3VwTm9kZXNcclxuICAgIGNvbnN0IGluZGV4ID0gcGFyZW50QXJyLmluZGV4T2YodGhpcyk7XHJcbiAgICBpZiAoaW5kZXggPiAtMSkgcGFyZW50QXJyLnNwbGljZShpbmRleCwgMSk7XHJcbn1cclxuXHJcbnNpbXBsZVRyZWVHcm91cE5vZGUucHJvdG90eXBlLmNyZWF0ZURPTT1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5oZWFkZXJET009JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ibG9jayB3My1saWdodC1ncmV5IHczLWxlZnQtYWxpZ25cIj48L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5yZWZyZXNoTmFtZSgpXHJcbiAgICB0aGlzLmxpc3RET009JCgnPGRpdiBjbGFzcz1cInczLWNvbnRhaW5lciB3My1oaWRlIHczLWJvcmRlclwiPjwvZGl2PicpXHJcblxyXG4gICAgdGhpcy5oZWFkZXJET00ub24oXCJjbGlja1wiLChldnQpPT4ge1xyXG4gICAgICAgIGlmKHRoaXMubGlzdERPTS5oYXNDbGFzcyhcInczLXNob3dcIikpIHRoaXMubGlzdERPTS5yZW1vdmVDbGFzcyhcInczLXNob3dcIilcclxuICAgICAgICBlbHNlIHRoaXMubGlzdERPTS5hZGRDbGFzcyhcInczLXNob3dcIilcclxuXHJcbiAgICAgICAgdGhpcy5wYXJlbnRUcmVlLnNlbGVjdEdyb3VwTm9kZSh0aGlzKSAgICBcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxufVxyXG5cclxuc2ltcGxlVHJlZUdyb3VwTm9kZS5wcm90b3R5cGUuaXNPcGVuPWZ1bmN0aW9uKCl7XHJcbiAgICByZXR1cm4gIHRoaXMubGlzdERPTS5oYXNDbGFzcyhcInczLXNob3dcIilcclxufVxyXG5cclxuXHJcbnNpbXBsZVRyZWVHcm91cE5vZGUucHJvdG90eXBlLmV4cGFuZD1mdW5jdGlvbigpe1xyXG4gICAgaWYodGhpcy5saXN0RE9NKSB0aGlzLmxpc3RET00uYWRkQ2xhc3MoXCJ3My1zaG93XCIpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWVHcm91cE5vZGUucHJvdG90eXBlLnNocmluaz1mdW5jdGlvbigpe1xyXG4gICAgaWYodGhpcy5saXN0RE9NKSB0aGlzLmxpc3RET00ucmVtb3ZlQ2xhc3MoXCJ3My1zaG93XCIpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWVHcm91cE5vZGUucHJvdG90eXBlLnNvcnROb2Rlc0J5TmFtZT1mdW5jdGlvbigpe1xyXG4gICAgdmFyIHRyZWVPcHRpb25zPXRoaXMucGFyZW50VHJlZS5vcHRpb25zXHJcbiAgICBpZih0cmVlT3B0aW9ucy5sZWFmTmFtZVByb3BlcnR5KSB2YXIgbGVhZk5hbWVQcm9wZXJ0eT10cmVlT3B0aW9ucy5sZWFmTmFtZVByb3BlcnR5XHJcbiAgICBlbHNlIGxlYWZOYW1lUHJvcGVydHk9XCIkZHRJZFwiXHJcbiAgICB0aGlzLmNoaWxkTGVhZk5vZGVzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgXHJcbiAgICAgICAgdmFyIGFOYW1lPWEubmFtZS50b0xvd2VyQ2FzZSgpXHJcbiAgICAgICAgdmFyIGJOYW1lPWIubmFtZS50b0xvd2VyQ2FzZSgpXHJcbiAgICAgICAgcmV0dXJuIGFOYW1lLmxvY2FsZUNvbXBhcmUoYk5hbWUpIFxyXG4gICAgfSk7XHJcbiAgICAvL3RoaXMubGlzdERPTS5lbXB0eSgpIC8vTk9URTogQ2FuIG5vdCBkZWxldGUgdGhvc2UgbGVhZiBub2RlIG90aGVyd2lzZSB0aGUgZXZlbnQgaGFuZGxlIGlzIGxvc3RcclxuICAgIHRoaXMuY2hpbGRMZWFmTm9kZXMuZm9yRWFjaChvbmVMZWFmPT57dGhpcy5saXN0RE9NLmFwcGVuZChvbmVMZWFmLkRPTSl9KVxyXG59XHJcblxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5hZGROb2RlPWZ1bmN0aW9uKG9iaixza2lwUmVwZWF0KXtcclxuICAgIHZhciB0cmVlT3B0aW9ucz10aGlzLnBhcmVudFRyZWUub3B0aW9uc1xyXG4gICAgaWYodHJlZU9wdGlvbnMubGVhZk5hbWVQcm9wZXJ0eSkgdmFyIGxlYWZOYW1lUHJvcGVydHk9dHJlZU9wdGlvbnMubGVhZk5hbWVQcm9wZXJ0eVxyXG4gICAgZWxzZSBsZWFmTmFtZVByb3BlcnR5PVwiJGR0SWRcIlxyXG5cclxuICAgIGlmKHNraXBSZXBlYXQpe1xyXG4gICAgICAgIHZhciBmb3VuZFJlcGVhdD1mYWxzZTtcclxuICAgICAgICB0aGlzLmNoaWxkTGVhZk5vZGVzLmZvckVhY2goYU5vZGU9PntcclxuICAgICAgICAgICAgaWYoYU5vZGUubmFtZT09b2JqW2xlYWZOYW1lUHJvcGVydHldKSB7XHJcbiAgICAgICAgICAgICAgICBmb3VuZFJlcGVhdD10cnVlXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIGlmKGZvdW5kUmVwZWF0KSByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGFOZXdOb2RlID0gbmV3IHNpbXBsZVRyZWVMZWFmTm9kZSh0aGlzLG9iailcclxuICAgIHRoaXMuY2hpbGRMZWFmTm9kZXMucHVzaChhTmV3Tm9kZSlcclxuICAgIHRoaXMucmVmcmVzaE5hbWUoKVxyXG4gICAgdGhpcy5saXN0RE9NLmFwcGVuZChhTmV3Tm9kZS5ET00pXHJcbn1cclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLXRyZWUgbGVhZiBub2RlLS0tLS0tLS0tLS0tLS0tLS0tXHJcbmZ1bmN0aW9uIHNpbXBsZVRyZWVMZWFmTm9kZShwYXJlbnRHcm91cE5vZGUsb2JqKXtcclxuICAgIHRoaXMucGFyZW50R3JvdXBOb2RlPXBhcmVudEdyb3VwTm9kZVxyXG4gICAgdGhpcy5sZWFmSW5mbz1vYmo7XHJcblxyXG4gICAgdmFyIHRyZWVPcHRpb25zPXRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUub3B0aW9uc1xyXG4gICAgaWYodHJlZU9wdGlvbnMubGVhZk5hbWVQcm9wZXJ0eSkgdGhpcy5uYW1lPXRoaXMubGVhZkluZm9bdHJlZU9wdGlvbnMubGVhZk5hbWVQcm9wZXJ0eV1cclxuICAgIGVsc2UgdGhpcy5uYW1lPXRoaXMubGVhZkluZm9bXCIkZHRJZFwiXVxyXG5cclxuICAgIHRoaXMuY3JlYXRlTGVhZk5vZGVET00oKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlTGVhZk5vZGUucHJvdG90eXBlLmRlbGV0ZVNlbGYgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLkRPTS5yZW1vdmUoKVxyXG4gICAgdmFyIGdOb2RlID0gdGhpcy5wYXJlbnRHcm91cE5vZGVcclxuICAgIGNvbnN0IGluZGV4ID0gZ05vZGUuY2hpbGRMZWFmTm9kZXMuaW5kZXhPZih0aGlzKTtcclxuICAgIGlmIChpbmRleCA+IC0xKSBnTm9kZS5jaGlsZExlYWZOb2Rlcy5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgZ05vZGUucmVmcmVzaE5hbWUoKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlTGVhZk5vZGUucHJvdG90eXBlLmNyZWF0ZUxlYWZOb2RlRE9NPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLkRPTT0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLXdoaXRlXCIgc3R5bGU9XCJkaXNwbGF5OmJsb2NrO3RleHQtYWxpZ246bGVmdDt3aWR0aDo5OCVcIj48L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5yZWRyYXdMYWJlbCgpXHJcbiAgICB2YXIgY2xpY2tGPShlKT0+e1xyXG4gICAgICAgIHRoaXMuaGlnaGxpZ2h0KCk7XHJcbiAgICAgICAgdmFyIGNsaWNrRGV0YWlsPWUuZGV0YWlsXHJcbiAgICAgICAgaWYgKGUuY3RybEtleSkge1xyXG4gICAgICAgICAgICB0aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLmFwcGVuZExlYWZOb2RlVG9TZWxlY3Rpb24odGhpcylcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgdGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5zZWxlY3RMZWFmTm9kZSh0aGlzLGUuZGV0YWlsKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMuRE9NLm9uKFwiY2xpY2tcIiwoZSk9PntjbGlja0YoZSl9KVxyXG5cclxuICAgIHRoaXMuRE9NLm9uKFwiZGJsY2xpY2tcIiwoZSk9PntcclxuICAgICAgICB0aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLmRibENsaWNrTm9kZSh0aGlzKVxyXG4gICAgfSlcclxufVxyXG5cclxuc2ltcGxlVHJlZUxlYWZOb2RlLnByb3RvdHlwZS5yZWRyYXdMYWJlbD1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5ET00uZW1wdHkoKVxyXG4gICAgaWYodGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5vcHRpb25zLmxlYWZOb2RlSWNvbkZ1bmMpe1xyXG4gICAgICAgIHZhciBpY29uTGFiZWw9dGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5vcHRpb25zLmxlYWZOb2RlSWNvbkZ1bmModGhpcylcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQoaWNvbkxhYmVsKVxyXG4gICAgfVxyXG5cclxuICAgIHZhciBuYW1lRGl2PSQoXCI8ZGl2IHN0eWxlPSdkaXNwbGF5OmlubGluZTtwYWRkaW5nLXJpZ2h0OjNweDt2ZXJ0aWNhbC1hbGlnbjptaWRkbGUnPjwvZGl2PlwiKVxyXG4gICAgbmFtZURpdi50ZXh0KHRoaXMubmFtZSlcclxuICAgIHRoaXMuRE9NLmFwcGVuZChuYW1lRGl2KVxyXG59XHJcbnNpbXBsZVRyZWVMZWFmTm9kZS5wcm90b3R5cGUuaGlnaGxpZ2h0PWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLkRPTS5hZGRDbGFzcyhcInczLW9yYW5nZVwiKVxyXG4gICAgdGhpcy5ET00uYWRkQ2xhc3MoXCJ3My1ob3Zlci1hbWJlclwiKVxyXG4gICAgdGhpcy5ET00ucmVtb3ZlQ2xhc3MoXCJ3My13aGl0ZVwiKVxyXG59XHJcbnNpbXBsZVRyZWVMZWFmTm9kZS5wcm90b3R5cGUuZGltPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLkRPTS5yZW1vdmVDbGFzcyhcInczLW9yYW5nZVwiKVxyXG4gICAgdGhpcy5ET00ucmVtb3ZlQ2xhc3MoXCJ3My1ob3Zlci1hbWJlclwiKVxyXG4gICAgdGhpcy5ET00uYWRkQ2xhc3MoXCJ3My13aGl0ZVwiKVxyXG59XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBzaW1wbGVUcmVlOyJdfQ==
