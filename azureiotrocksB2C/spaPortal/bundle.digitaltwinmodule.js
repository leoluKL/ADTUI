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
    //test if the account is really usable
    msalHelper.getToken().then(res=>{
        //console.log(res)
    }).catch(e=>{
        window.open(globalAppSettings.logoutRedirectUri,"_self")
    })


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
},{"../globalAppSettings.js":15,"../msalHelper":16,"./editLayoutDialog":2,"./globalCache":3,"./infoPanel":4,"./mainToolbar":5,"./modelEditorDialog":7,"./modelManagerDialog":8,"./startSelectionDialog":12,"./topologyDOM.js":13,"./twinsTree":14}],2:[function(require,module,exports){
const simpleSelectMenu= require("./simpleSelectMenu")
const simpleConfirmDialog = require("./simpleConfirmDialog")
const globalCache=require("./globalCache")

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
    var saveAsNewBtn=$('<button class="w3-button w3-green w3-hover-light-green">Save As New</button>')
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
    this.broadcastMessage({ "message": "saveLayout", "layoutName": layoutName, "adtName":this.getCurADTName() })
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
            , content: "Please confirm deleting layout \"" + layoutName + "\"?"
            , buttons:[
                {
                    colorClass: "w3-red w3-hover-pink", text: "Confirm", "clickFunc": () => {
                        delete globalCache.layoutJSON[layoutName]
                        if (layoutName == globalCache.currentLayoutName) globalCache.currentLayoutName = null
                        this.broadcastMessage({ "message": "layoutsUpdated" })
                        $.post("layout/saveLayouts", { "adtName": this.getCurADTName(), "layouts": JSON.stringify(globalCache.layoutJSON) })
                        confirmDialogDiv.close();
                        this.refillOptions()
                        this.switchLayoutSelector.triggerOptionIndex(0)
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
},{"./globalCache":3,"./simpleConfirmDialog":9,"./simpleSelectMenu":10}],3:[function(require,module,exports){
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
},{"../msalHelper":16,"./modelAnalyzer":6}],4:[function(require,module,exports){
const modelAnalyzer = require("./modelAnalyzer");
const simpleSelectMenu= require("./simpleSelectMenu")
const simpleConfirmDialog = require("./simpleConfirmDialog")
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
    }else if(msgPayload.message=="selectNodes"){
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
    }else if(msgPayload.message=="selectGroupNode"){
        this.DOM.empty()
        var modelID = msgPayload.info["@id"]
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

    var twinsImportResult= await this.batchImportTwins(importTwins)
    twinsImportResult.forEach(data=>{
        globalCache.storeSingleADTTwin(data)
    })
    this.broadcastMessage({ "message": "addNewTwins",twinsInfo:twinsImportResult})

    var relationsImportResult=await this.batchImportRelations(importRelations)
    globalCache.storeTwinRelationships_append(relationsImportResult)
    this.broadcastMessage({ "message": "drawAllRelations",info:relationsImportResult})

    var numOfTwins=twinsImportResult.length
    var numOfRelations=relationsImportResult.length
    var str="Add "+numOfTwins+ " node"+((numOfTwins<=1)?"":"s")+", "+numOfRelations+" relationship"+((numOfRelations<=1)?"":"s")
    var confirmDialogDiv = new simpleConfirmDialog()
    confirmDialogDiv.show(
        { width: "200px" },
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

infoPanel.prototype.batchImportTwins=async function(twins){
    return new Promise((resolve, reject) => {
        if(twins.length==0) resolve([])
        try{
            $.post("editADT/batchImportTwins",{"twins":JSON.stringify(twins)}, (data)=> {
                if (data == "") data=[]
                resolve(data)
            });
        }catch(e){
            reject(e)
        }
    })
}

infoPanel.prototype.batchImportRelations=async function(relations){
    return new Promise((resolve, reject) => {
        if(relations.length==0) resolve([])
        try{
            $.post("editADT/createRelations",{"actions":JSON.stringify(relations)}, (data)=> {
                if (data == "") data=[]
                resolve(data)
            });
        }catch(e){
            reject(e)
        }
    })
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
    if(this.selectedObjects.length==1) this.rxMessage({ "message": "selectNodes", info: this.selectedObjects })

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
                    colorClass: "w3-red w3-hover-pink", text: "Confirm", "clickFunc": () => {
                        if (twinIDArr.length > 0) this.deleteTwins(twinIDArr)
                        if (relationsArr.length > 0) this.deleteRelations(relationsArr)
                        confirmDialogDiv.close()
                        this.DOM.empty()
                        this.drawButtons(null)
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
        var result=await this.deletePartialTwins(smallArr)

        result.forEach((oneID)=>{
            delete globalCache.storedTwins[oneID]
            delete globalCache.storedOutboundRelationships[oneID]
        });

        this.broadcastMessage({ "message": "twinsDeleted",twinIDArr:result})
    }
}

infoPanel.prototype.deletePartialTwins= async function(IDArr){
    return new Promise((resolve, reject) => {
        try{
            $.post("editADT/deleteTwins",{arr:IDArr}, function (data) {
                if(data=="") data=[]
                resolve(data)
            });
        }catch(e){
            reject(e)
        }
    })
}


infoPanel.prototype.deleteRelations=async function(relationsArr){
    var arr=[]
    relationsArr.forEach(oneRelation=>{
        arr.push({srcID:oneRelation['$sourceId'],relID:oneRelation['$relationshipId']})
    })
    $.post("editADT/deleteRelations",{"relations":arr},  (data)=> { 
        if(data=="") data=[];
        globalCache.storeTwinRelationships_remove(data)
        this.broadcastMessage({ "message": "relationsDeleted","relations":data})
    });
    
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
},{"../msalHelper":16,"./globalCache":3,"./modelAnalyzer":6,"./simpleConfirmDialog":9,"./simpleSelectMenu":10}],5:[function(require,module,exports){
const startSelectionDialog = require("./startSelectionDialog")
const modelManagerDialog = require("./modelManagerDialog")
const editLayoutDialog= require("./editLayoutDialog")
const simpleSelectMenu= require("./simpleSelectMenu")


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


    this.switchLayoutSelector=new simpleSelectMenu("Layout")

    $("#mainToolBar").empty()
    $("#mainToolBar").append(this.switchADTInstanceBtn,this.modelIOBtn,this.showForgeViewBtn,this.showGISViewBtn
        ,this.switchLayoutSelector.DOM,this.editLayoutBtn)

    this.switchADTInstanceBtn.on("click",()=>{ startSelectionDialog.popup() })
    this.modelIOBtn.on("click",()=>{ modelManagerDialog.popup() })
    this.editLayoutBtn.on("click",()=>{ editLayoutDialog.popup() })


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
},{"./editLayoutDialog":2,"./modelManagerDialog":8,"./simpleSelectMenu":10,"./startSelectionDialog":12}],6:[function(require,module,exports){
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
                "name": aVal,
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
},{"../msalHelper":16,"./globalCache":3,"./modelAnalyzer":6,"./simpleSelectMenu":10}],8:[function(require,module,exports){
const modelAnalyzer=require("./modelAnalyzer")
const startSelectionDialog = require("./startSelectionDialog")
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
    var exportModelBtn = $('<button class="w3-button w3-card w3-deep-orange w3-hover-light-green" style="height:100%">Download Models</button>')
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
        var dataUrl= await this.resizeImgFile(theFile,70)
        if(this.avartaImg) this.avartaImg.attr("src",dataUrl)

        var visualJson=globalCache.visualDefinition["default"]
        if(!visualJson[modelID]) visualJson[modelID]={}
        visualJson[modelID].avarta=dataUrl
        this.saveVisualDefinition()
        this.broadcastMessage({ "message": "visualDefinitionChange", "modelID":modelID,"avarta":dataUrl })
        actualImportPicBtn.val("")
    })

    clearAvartaBtn.on("click", ()=>{
        var visualJson=globalCache.visualDefinition["default"]
        if(visualJson[modelID]) delete visualJson[modelID].avarta 
        if(this.avartaImg) this.avartaImg.removeAttr('src');
        this.saveVisualDefinition()
        this.broadcastMessage({ "message": "visualDefinitionChange", "modelID":modelID,"noAvarta":true })
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
    
    var avartaImg=$("<img></img>")
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
    var visualJson=globalCache.visualDefinition["default"]
    if(relatinshipName==null){
        if(visualJson[modelID] && visualJson[modelID].color) definedColor=visualJson[modelID].color
        if(visualJson[modelID] && visualJson[modelID].shape) definedShape=visualJson[modelID].shape
    }else{
        if (visualJson[modelID] && visualJson[modelID]["rels"] && visualJson[modelID]["rels"][relatinshipName]) {
            if (visualJson[modelID]["rels"][relatinshipName].color) definedColor = visualJson[modelID]["rels"][relatinshipName].color
            if (visualJson[modelID]["rels"][relatinshipName].shape) definedShape = visualJson[modelID]["rels"][relatinshipName].shape
        }
    }

    var colorSelector=$('<select class="w3-border" style="outline:none"></select>')
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
        }else{
            if(!visualJson[modelID]["rels"]) visualJson[modelID]["rels"]={}
            if(!visualJson[modelID]["rels"][relatinshipName]) visualJson[modelID]["rels"][relatinshipName]={}
            visualJson[modelID]["rels"][relatinshipName].shape=selectShape
            this.broadcastMessage({ "message": "visualDefinitionChange", "srcModelID":modelID,"relationshipName":relatinshipName,"shape":selectShape })
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
        var label=$("<label style='display:inline;background-color:yellowgreen;color:white;font-size:9px;padding:2px'>Relationship type</label>")
        parentDom.append(label)
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

        var contentDOM=$("<label></label>")
        if(Array.isArray(jsonInfo[ind])){
            contentDOM.text("enum")
            contentDOM.css({"background-color":"darkGray","color":"white","fontSize":"9px","padding":'2px'})
        }else if(typeof(jsonInfo[ind])==="object") {
            contentDOM.css("display","block")
            contentDOM.css("padding-left","1em")
            this.fillEditableProperties(jsonInfo[ind],contentDOM)
        }else {
            contentDOM.text(jsonInfo[ind])
            contentDOM.css({"background-color":"darkGray","color":"white","fontSize":"9px","padding":'2px'})
        }
        keyDiv.append(contentDOM)
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
        this.tree = new simpleTree(this.modelList, { "leafNameProperty": "displayName"
            , "noMultipleSelectAllowed": true,"hideEmptyGroup":true })

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
},{"../msalHelper":16,"./globalCache":3,"./modelAnalyzer":6,"./modelEditorDialog":7,"./simpleConfirmDialog":9,"./simpleTree":11,"./startSelectionDialog":12}],9:[function(require,module,exports){
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
},{}],10:[function(require,module,exports){
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
},{}],11:[function(require,module,exports){
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
    var nameDiv=$("<div style='display:inline;padding-right:3px'></div>")
    nameDiv.text(this.name)
    var lblColor="gray"
    if(this.childLeafNodes.length>0) {
        lblColor="yellowgreen"
        this.headerDOM.css("font-weight","bold")
    }else{
        this.headerDOM.css("font-weight","normal")
    } 

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
    this.listDOM.addClass("w3-show")
}

simpleTreeGroupNode.prototype.shrink=function(){
    this.listDOM.removeClass("w3-show")
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
    this.DOM=$('<button class="w3-button w3-white" style="display:block;text-align:left;width:98%">'+this.name+'</button>')
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
},{}],12:[function(require,module,exports){
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
    closeButton.on("click", () => { this.closeDialog() })

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
},{"../msalHelper":16,"./globalCache":3}],13:[function(require,module,exports){
'use strict';

const modelAnalyzer = require("./modelAnalyzer");
const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
});
const simpleSelectMenu = require("./simpleSelectMenu")
const simpleConfirmDialog = require("./simpleConfirmDialog")
const globalCache = require("./globalCache")
const msalHelper=require("../msalHelper")

function topologyDOM(DOM){
    this.DOM=DOM
    this.defaultNodeSize=30
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
            }},{selector: 'edge.hover',
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
    this.broadcastMessage({ "message": "selectNodes", "info": [info] })
}

topologyDOM.prototype.mouseOutFunction= function (e) {
    this.selectFunction()
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
    this.broadcastMessage({ "message": "selectNodes", info: re })

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

topologyDOM.prototype.deleteRelations=function(relations){
    relations.forEach(oneRelation=>{
        var srcID=oneRelation["srcID"]
        var relationID=oneRelation["relID"]
        var theNode=this.core.filter('[id = "'+srcID+'"]');
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
        this.core.$('[id = "'+twinID+'"]').remove()
    })   
}

topologyDOM.prototype.animateANode=function(twin){
    var curDimension= this.getNodeSizeInCurrentZoom()
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
        if(visualJson[modelID].rels){
            for(var relationshipName in visualJson[modelID].rels)
                if(visualJson[modelID]["rels"][relationshipName].color){
                    this.updateRelationshipColor(modelID,relationshipName,visualJson[modelID]["rels"][relationshipName].color)
                }
                if(visualJson[modelID]["rels"][relationshipName].shape){
                    this.updateRelationshipShape(modelID,relationshipName,visualJson[modelID]["rels"][relationshipName].shape)
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
    else if(msgPayload.message=="selectNodes"){
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
        } 
        else{
            if(msgPayload.color) this.updateModelTwinColor(msgPayload.modelID,msgPayload.color)
            else if(msgPayload.shape) this.updateModelTwinShape(msgPayload.modelID,msgPayload.shape)
            else if(msgPayload.avarta) this.updateModelAvarta(msgPayload.modelID,msgPayload.avarta)
            else if(msgPayload.noAvarta)  this.updateModelAvarta(msgPayload.modelID,null)
        } 
    }else if(msgPayload.message=="twinsDeleted") this.deleteTwins(msgPayload.twinIDArr)
    else if(msgPayload.message=="relationsDeleted") this.deleteRelations(msgPayload.relations)
    else if(msgPayload.message=="connectTo"){ this.startTargetNodeMode("connectTo")   }
    else if(msgPayload.message=="connectFrom"){ this.startTargetNodeMode("connectFrom")   }
    else if(msgPayload.message=="addSelectOutbound"){ this.selectOutboundNodes()   }
    else if(msgPayload.message=="addSelectInbound"){ this.selectInboundNodes()   }
    else if(msgPayload.message=="hideSelectedNodes"){ this.hideSelectedNodes()   }
    else if(msgPayload.message=="COSESelectedNodes"){ this.COSESelectedNodes()   }
    else if(msgPayload.message=="saveLayout"){ this.saveLayout(msgPayload.layoutName,msgPayload.adtName)   }
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
        var theNode=this.core.filter('[id = "'+srcID+'"]');
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



topologyDOM.prototype.saveLayout = function (layoutName,adtName) {
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

    $.post("layout/saveLayouts",{"adtName":adtName,"layouts":JSON.stringify(globalCache.layoutJSON)})
    this.broadcastMessage({ "message": "layoutsUpdated"})
}

topologyDOM.prototype.numberPrecision = function (number) {
    if(Array.isArray(number)){
        for(var i=0;i<number.length;i++){
            number[i] = this.numberPrecision(number[i])
        }
        return number
    }else
    return parseFloat(formatter.format(number))
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
            resultActions.push({from:fromNode.data().originalInfo["$dtId"] ,to:toNode.data().originalInfo["$dtId"],connect:connectionTypes[0]})
            switchTypeSelector.callBack_clickOption=(optionText,optionValue)=>{
                resultActions[index][2]=optionText
                switchTypeSelector.changeName(optionText)
            }
            switchTypeSelector.triggerOptionIndex(0)
        }else if(connectionTypes.length==1){
            resultActions.push({from:fromNode.data().originalInfo["$dtId"] ,to:toNode.data().originalInfo["$dtId"],connect:connectionTypes[0]})
            label.css("color","green")
            label.html("Add <b>"+connectionTypes[0]+"</b> connection from <b>"+fromNode.id()+"</b> to <b>"+toNode.id()+"</b>") 
        }
        confirmDialogDiv.dialogDiv.append(label)
    })
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
},{"../msalHelper":16,"./globalCache":3,"./modelAnalyzer":6,"./simpleConfirmDialog":9,"./simpleSelectMenu":10}],14:[function(require,module,exports){
const simpleTree=require("./simpleTree")
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
        var fontsize={"ellipse":"130%","round-rectangle":"90%","hexagon":"120%"}[shape]
        shape={"ellipse":"●","round-rectangle":"▉","hexagon":"⬢"}[shape]
        
        var lblHTML="<label style='display:inline;color:"+colorCode+";font-size:"+fontsize+";font-weight:normal;border-radius: 2px;'>"+shape+"</label>"

        if(avarta) lblHTML+="<img src='"+avarta+"' style='height:20px'/>"

        return $(lblHTML)
    }

    this.tree.callback_afterSelectNodes=(nodesArr,mouseClickDetail)=>{
        var infoArr=[]
        nodesArr.forEach((item, index) =>{
            infoArr.push(item.leafInfo)
        });
        this.broadcastMessage({ "message": "selectNodes", info:infoArr, "mouseClickDetail":mouseClickDetail})
    }

    this.tree.callback_afterDblclickNode=(theNode)=>{
        this.broadcastMessage({ "message": "PanToNode", info:theNode.leafInfo})
    }

    this.tree.callback_afterSelectGroupNode=(nodeInfo)=>{
        this.broadcastMessage({"message":"selectGroupNode",info:nodeInfo})
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
        this.tree.deleteLeafNode(twinID)
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
},{"../msalHelper":16,"./globalCache":3,"./modelAnalyzer":6,"./simpleTree":11}],15:[function(require,module,exports){
const signupsigninname="B2C_1_singupsignin_spaapp1"
const b2cTenantName="azureiotb2c"

const url = new URL(window.location.href);

var strArr=window.location.href.split("?")
var isLocalTest=(strArr.indexOf("test=1")!=-1)

const globalAppSettings={
    "b2cSignUpSignInName": signupsigninname,
    "b2cScopes":["https://"+b2cTenantName+".onmicrosoft.com/taskmastermodule/operation"],
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
    "taskMasterAPIURI":((isLocalTest)?"http://localhost:5002/":"https://azureiotrockstaskmastermodule.azurewebsites.net/")
}

module.exports = globalAppSettings;
},{}],16:[function(require,module,exports){
const globalAppSettings=require("./globalAppSettings")

function msalHelper(){
    this.myMSALObj = new msal.PublicClientApplication(globalAppSettings.msalConfig);
}

msalHelper.prototype.signIn=async function(){
    try{
        var response= await this.myMSALObj.loginPopup({ scopes: globalAppSettings.b2cScopes })
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

msalHelper.prototype.callAPI=async function(APIString,RESTMethod,payload){
    var headersObj={}
    if(!globalAppSettings.isLocalTest){
        var token=await this.getToken()
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

msalHelper.prototype.getToken=async function(){
    try{
        if(this.storedToken!=null){
            var currTime=parseInt(new Date().getTime()/1000)
            if(currTime+60 < this.storedTokenExp) return this.storedToken
        }
        var tokenRequest={
            scopes: globalAppSettings.b2cScopes,
            forceRefresh: false, // Set this to "true" to skip a cached token and go to the server to get a new token
            account: this.myMSALObj.getAccountByHomeId(this.accountId)
        }
    
        var response = await this.myMSALObj.acquireTokenSilent(tokenRequest)
        if (!response.accessToken || response.accessToken === "") {
            throw new msal.InteractionRequiredAuthError;
        }

        this.storedToken=response.accessToken
        this.storedTokenExp=response.idTokenClaims.exp
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
},{"./globalAppSettings":15}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9zcGFTb3VyY2VDb2RlL2RpZ2l0YWx0d2lubW9kdWxlL2RpZ2l0YWx0d2lubW9kdWxlVUkuanMiLCIuLi9zcGFTb3VyY2VDb2RlL2RpZ2l0YWx0d2lubW9kdWxlL2VkaXRMYXlvdXREaWFsb2cuanMiLCIuLi9zcGFTb3VyY2VDb2RlL2RpZ2l0YWx0d2lubW9kdWxlL2dsb2JhbENhY2hlLmpzIiwiLi4vc3BhU291cmNlQ29kZS9kaWdpdGFsdHdpbm1vZHVsZS9pbmZvUGFuZWwuanMiLCIuLi9zcGFTb3VyY2VDb2RlL2RpZ2l0YWx0d2lubW9kdWxlL21haW5Ub29sYmFyLmpzIiwiLi4vc3BhU291cmNlQ29kZS9kaWdpdGFsdHdpbm1vZHVsZS9tb2RlbEFuYWx5emVyLmpzIiwiLi4vc3BhU291cmNlQ29kZS9kaWdpdGFsdHdpbm1vZHVsZS9tb2RlbEVkaXRvckRpYWxvZy5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvZGlnaXRhbHR3aW5tb2R1bGUvbW9kZWxNYW5hZ2VyRGlhbG9nLmpzIiwiLi4vc3BhU291cmNlQ29kZS9kaWdpdGFsdHdpbm1vZHVsZS9zaW1wbGVDb25maXJtRGlhbG9nLmpzIiwiLi4vc3BhU291cmNlQ29kZS9kaWdpdGFsdHdpbm1vZHVsZS9zaW1wbGVTZWxlY3RNZW51LmpzIiwiLi4vc3BhU291cmNlQ29kZS9kaWdpdGFsdHdpbm1vZHVsZS9zaW1wbGVUcmVlLmpzIiwiLi4vc3BhU291cmNlQ29kZS9kaWdpdGFsdHdpbm1vZHVsZS9zdGFydFNlbGVjdGlvbkRpYWxvZy5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvZGlnaXRhbHR3aW5tb2R1bGUvdG9wb2xvZ3lET00uanMiLCIuLi9zcGFTb3VyY2VDb2RlL2RpZ2l0YWx0d2lubW9kdWxlL3R3aW5zVHJlZS5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvZ2xvYmFsQXBwU2V0dGluZ3MuanMiLCIuLi9zcGFTb3VyY2VDb2RlL21zYWxIZWxwZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9JQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMXVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZlQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDblhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiJ3VzZSBzdHJpY3QnO1xyXG5jb25zdCB0b3BvbG9neURPTT1yZXF1aXJlKFwiLi90b3BvbG9neURPTS5qc1wiKVxyXG5jb25zdCB0d2luc1RyZWU9cmVxdWlyZShcIi4vdHdpbnNUcmVlXCIpXHJcbmNvbnN0IHN0YXJ0U2VsZWN0aW9uRGlhbG9nID0gcmVxdWlyZShcIi4vc3RhcnRTZWxlY3Rpb25EaWFsb2dcIilcclxuY29uc3QgbW9kZWxNYW5hZ2VyRGlhbG9nID0gcmVxdWlyZShcIi4vbW9kZWxNYW5hZ2VyRGlhbG9nXCIpXHJcbmNvbnN0IG1vZGVsRWRpdG9yRGlhbG9nID0gcmVxdWlyZShcIi4vbW9kZWxFZGl0b3JEaWFsb2dcIilcclxuY29uc3QgZWRpdExheW91dERpYWxvZyA9IHJlcXVpcmUoXCIuL2VkaXRMYXlvdXREaWFsb2dcIilcclxuY29uc3QgbWFpblRvb2xiYXIgPSByZXF1aXJlKFwiLi9tYWluVG9vbGJhclwiKVxyXG5jb25zdCBpbmZvUGFuZWw9IHJlcXVpcmUoXCIuL2luZm9QYW5lbFwiKTtcclxuY29uc3QgZ2xvYmFsQXBwU2V0dGluZ3MgPSByZXF1aXJlKFwiLi4vZ2xvYmFsQXBwU2V0dGluZ3MuanNcIik7XHJcbmNvbnN0IG1zYWxIZWxwZXI9cmVxdWlyZShcIi4uL21zYWxIZWxwZXJcIilcclxuY29uc3QgZ2xvYmFsQ2FjaGU9cmVxdWlyZShcIi4vZ2xvYmFsQ2FjaGVcIilcclxuXHJcbmZ1bmN0aW9uIGRpZ2l0YWx0d2lubW9kdWxlVUkoKSB7XHJcbiAgICB0aGlzLmluaXRVSUxheW91dCgpXHJcblxyXG4gICAgdGhpcy50d2luc1RyZWU9IG5ldyB0d2luc1RyZWUoJChcIiN0cmVlSG9sZGVyXCIpLCQoXCIjdHJlZVNlYXJjaFwiKSlcclxuICAgIFxyXG4gICAgbWFpblRvb2xiYXIucmVuZGVyKClcclxuICAgIHRoaXMudG9wb2xvZ3lJbnN0YW5jZT1uZXcgdG9wb2xvZ3lET00oJCgnI2NhbnZhcycpKVxyXG4gICAgdGhpcy50b3BvbG9neUluc3RhbmNlLmluaXQoKVxyXG5cclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSgpIC8vaW5pdGlhbGl6ZSBhbGwgdWkgY29tcG9uZW50cyB0byBoYXZlIHRoZSBicm9hZGNhc3QgY2FwYWJpbGl0eVxyXG5cclxuICAgIC8vdHJ5IGlmIGl0IGFscmVhZHkgQjJDIHNpZ25lZCBpbiwgaWYgbm90IGdvaW5nIGJhY2sgdG8gdGhlIHN0YXJ0IHBhZ2VcclxuICAgIHRoaXMubXlNU0FMT2JqID0gbmV3IG1zYWwuUHVibGljQ2xpZW50QXBwbGljYXRpb24oZ2xvYmFsQXBwU2V0dGluZ3MubXNhbENvbmZpZyk7XHJcblxyXG5cclxuICAgIHZhciB0aGVBY2NvdW50PW1zYWxIZWxwZXIuZmV0Y2hBY2NvdW50KCk7XHJcbiAgICBpZih0aGVBY2NvdW50PT1udWxsICYmICFnbG9iYWxBcHBTZXR0aW5ncy5pc0xvY2FsVGVzdCkgd2luZG93Lm9wZW4oZ2xvYmFsQXBwU2V0dGluZ3MubG9nb3V0UmVkaXJlY3RVcmksXCJfc2VsZlwiKVxyXG4gICAgLy90ZXN0IGlmIHRoZSBhY2NvdW50IGlzIHJlYWxseSB1c2FibGVcclxuICAgIG1zYWxIZWxwZXIuZ2V0VG9rZW4oKS50aGVuKHJlcz0+e1xyXG4gICAgICAgIC8vY29uc29sZS5sb2cocmVzKVxyXG4gICAgfSkuY2F0Y2goZT0+e1xyXG4gICAgICAgIHdpbmRvdy5vcGVuKGdsb2JhbEFwcFNldHRpbmdzLmxvZ291dFJlZGlyZWN0VXJpLFwiX3NlbGZcIilcclxuICAgIH0pXHJcblxyXG5cclxuICAgIGdsb2JhbENhY2hlLmxvYWRVc2VyRGF0YSgpLnRoZW4ocmU9PntcclxuICAgICAgICBpZihnbG9iYWxDYWNoZS5EQk1vZGVsc0Fyci5sZW5ndGg9PTApe1xyXG4gICAgICAgICAgICAvL2RpcmVjdGx5IHBvcHVwIHRvIG1vZGVsIG1hbmFnZW1lbnQgZGlhbG9nIGFsbG93IHVzZXIgaW1wb3J0IG9yIGNyZWF0ZSBtb2RlbFxyXG4gICAgICAgICAgICBtb2RlbE1hbmFnZXJEaWFsb2cucG9wdXAoKVxyXG4gICAgICAgICAgICAvL3BvcCB1cCB3ZWxjb21lIHNjcmVlblxyXG4gICAgICAgICAgICB2YXIgcG9wV2luPSQoJzxkaXYgY2xhc3M9XCJ3My1ibHVlIHczLWNhcmQtNCB3My1wYWRkaW5nLWxhcmdlXCIgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO2JhY2tncm91bmQtY29sb3I6d2hpdGU7bGVmdDo1MCU7dHJhbnNmb3JtOiB0cmFuc2xhdGVYKC01MCUpIHRyYW5zbGF0ZVkoLTUwJSk7ei1pbmRleDoxMDU7d2lkdGg6NDAwcHg7Y3Vyc29yOmRlZmF1bHRcIj48L2Rpdj4nKVxyXG4gICAgICAgICAgICBwb3BXaW4uaHRtbChgV2VsY29tZSwgJHttc2FsSGVscGVyLnVzZXJOYW1lfSEgRmlyc3RseSwgeW91IG1heSBjb25zaWRlciBpbXBvcnRpbmcgYSBmZXcgdHdpbiBtb2RlbCBmaWxlcyBvciBjcmVhdGluZyB0d2luIG1vZGVscyBmcm9tIHNjcmF0Y2guIDxici8+PGJyLz5DbGljayB0byBjb250aW51ZS4uLmApXHJcbiAgICAgICAgICAgICQoXCJib2R5XCIpLmFwcGVuZChwb3BXaW4pXHJcbiAgICAgICAgICAgIHBvcFdpbi5vbihcImNsaWNrXCIsKCk9Pntwb3BXaW4ucmVtb3ZlKCl9KVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBzdGFydFNlbGVjdGlvbkRpYWxvZy5wb3B1cCgpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh0aGlzLHsgXCJtZXNzYWdlXCI6IFwidmlzdWFsRGVmaW5pdGlvblJlZnJlc2hcIn0pXHJcblxyXG4gICAgfSlcclxufVxyXG5cclxuZGlnaXRhbHR3aW5tb2R1bGVVSS5wcm90b3R5cGUuYnJvYWRjYXN0TWVzc2FnZT1mdW5jdGlvbihzb3VyY2UsbXNnUGF5bG9hZCl7XHJcbiAgICB2YXIgY29tcG9uZW50c0Fycj1bdGhpcy50d2luc1RyZWUsc3RhcnRTZWxlY3Rpb25EaWFsb2csbW9kZWxNYW5hZ2VyRGlhbG9nLG1vZGVsRWRpdG9yRGlhbG9nLGVkaXRMYXlvdXREaWFsb2csXHJcbiAgICAgICAgIG1haW5Ub29sYmFyLHRoaXMudG9wb2xvZ3lJbnN0YW5jZSxpbmZvUGFuZWxdXHJcblxyXG4gICAgaWYoc291cmNlPT1udWxsKXtcclxuICAgICAgICBmb3IodmFyIGk9MDtpPGNvbXBvbmVudHNBcnIubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgIHZhciB0aGVDb21wb25lbnQ9Y29tcG9uZW50c0FycltpXVxyXG4gICAgICAgICAgICB0aGlzLmFzc2lnbkJyb2FkY2FzdE1lc3NhZ2UodGhlQ29tcG9uZW50KVxyXG4gICAgICAgIH1cclxuICAgIH1lbHNle1xyXG4gICAgICAgIGZvcih2YXIgaT0wO2k8Y29tcG9uZW50c0Fyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgdmFyIHRoZUNvbXBvbmVudD1jb21wb25lbnRzQXJyW2ldXHJcbiAgICAgICAgICAgIGlmKHRoZUNvbXBvbmVudC5yeE1lc3NhZ2UgJiYgdGhlQ29tcG9uZW50IT1zb3VyY2UpIHRoZUNvbXBvbmVudC5yeE1lc3NhZ2UobXNnUGF5bG9hZClcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmRpZ2l0YWx0d2lubW9kdWxlVUkucHJvdG90eXBlLmFzc2lnbkJyb2FkY2FzdE1lc3NhZ2U9ZnVuY3Rpb24odWlDb21wb25lbnQpe1xyXG4gICAgdWlDb21wb25lbnQuYnJvYWRjYXN0TWVzc2FnZT0obXNnT2JqKT0+e3RoaXMuYnJvYWRjYXN0TWVzc2FnZSh1aUNvbXBvbmVudCxtc2dPYmopfVxyXG59XHJcblxyXG5kaWdpdGFsdHdpbm1vZHVsZVVJLnByb3RvdHlwZS5pbml0VUlMYXlvdXQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgbXlMYXlvdXQgPSAkKCdib2R5JykubGF5b3V0KHtcclxuICAgICAgICAvL1x0cmVmZXJlbmNlIG9ubHkgLSB0aGVzZSBvcHRpb25zIGFyZSBOT1QgcmVxdWlyZWQgYmVjYXVzZSAndHJ1ZScgaXMgdGhlIGRlZmF1bHRcclxuICAgICAgICBjbG9zYWJsZTogdHJ1ZVx0Ly8gcGFuZSBjYW4gb3BlbiAmIGNsb3NlXHJcbiAgICAgICAgLCByZXNpemFibGU6IHRydWVcdC8vIHdoZW4gb3BlbiwgcGFuZSBjYW4gYmUgcmVzaXplZCBcclxuICAgICAgICAsIHNsaWRhYmxlOiB0cnVlXHQvLyB3aGVuIGNsb3NlZCwgcGFuZSBjYW4gJ3NsaWRlJyBvcGVuIG92ZXIgb3RoZXIgcGFuZXMgLSBjbG9zZXMgb24gbW91c2Utb3V0XHJcbiAgICAgICAgLCBsaXZlUGFuZVJlc2l6aW5nOiB0cnVlXHJcblxyXG4gICAgICAgIC8vXHRzb21lIHJlc2l6aW5nL3RvZ2dsaW5nIHNldHRpbmdzXHJcbiAgICAgICAgLCBub3J0aF9fc2xpZGFibGU6IGZhbHNlXHQvLyBPVkVSUklERSB0aGUgcGFuZS1kZWZhdWx0IG9mICdzbGlkYWJsZT10cnVlJ1xyXG4gICAgICAgIC8vLCBub3J0aF9fdG9nZ2xlckxlbmd0aF9jbG9zZWQ6ICcxMDAlJ1x0Ly8gdG9nZ2xlLWJ1dHRvbiBpcyBmdWxsLXdpZHRoIG9mIHJlc2l6ZXItYmFyXHJcbiAgICAgICAgLCBub3J0aF9fc3BhY2luZ19jbG9zZWQ6IDZcdFx0Ly8gYmlnIHJlc2l6ZXItYmFyIHdoZW4gb3BlbiAoemVybyBoZWlnaHQpXHJcbiAgICAgICAgLCBub3J0aF9fc3BhY2luZ19vcGVuOjBcclxuICAgICAgICAsIG5vcnRoX19yZXNpemFibGU6IGZhbHNlXHQvLyBPVkVSUklERSB0aGUgcGFuZS1kZWZhdWx0IG9mICdyZXNpemFibGU9dHJ1ZSdcclxuICAgICAgICAsIG5vcnRoX19jbG9zYWJsZTogZmFsc2VcclxuICAgICAgICAsIHdlc3RfX2Nsb3NhYmxlOiBmYWxzZVxyXG4gICAgICAgICwgZWFzdF9fY2xvc2FibGU6IGZhbHNlXHJcbiAgICAgICAgXHJcblxyXG4gICAgICAgIC8vXHRzb21lIHBhbmUtc2l6ZSBzZXR0aW5nc1xyXG4gICAgICAgICwgd2VzdF9fbWluU2l6ZTogMTAwXHJcbiAgICAgICAgLCBlYXN0X19zaXplOiAzMDBcclxuICAgICAgICAsIGVhc3RfX21pblNpemU6IDIwMFxyXG4gICAgICAgICwgZWFzdF9fbWF4U2l6ZTogLjUgLy8gNTAlIG9mIGxheW91dCB3aWR0aFxyXG4gICAgICAgICwgY2VudGVyX19taW5XaWR0aDogMTAwXHJcbiAgICAgICAgLGVhc3RfX2Nsb3NhYmxlOiBmYWxzZVxyXG4gICAgICAgICx3ZXN0X19jbG9zYWJsZTogZmFsc2VcclxuICAgICAgICAsZWFzdF9faW5pdENsb3NlZDpcdHRydWVcclxuICAgIH0pO1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICpcdERJU0FCTEUgVEVYVC1TRUxFQ1RJT04gV0hFTiBEUkFHR0lORyAob3IgZXZlbiBfdHJ5aW5nXyB0byBkcmFnISlcclxuICAgICAqXHR0aGlzIGZ1bmN0aW9uYWxpdHkgd2lsbCBiZSBpbmNsdWRlZCBpbiBSQzMwLjgwXHJcbiAgICAgKi9cclxuICAgICQubGF5b3V0LmRpc2FibGVUZXh0U2VsZWN0aW9uID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkZCA9ICQoZG9jdW1lbnQpXHJcbiAgICAgICAgICAgICwgcyA9ICd0ZXh0U2VsZWN0aW9uRGlzYWJsZWQnXHJcbiAgICAgICAgICAgICwgeCA9ICd0ZXh0U2VsZWN0aW9uSW5pdGlhbGl6ZWQnXHJcbiAgICAgICAgICAgIDtcclxuICAgICAgICBpZiAoJC5mbi5kaXNhYmxlU2VsZWN0aW9uKSB7XHJcbiAgICAgICAgICAgIGlmICghJGQuZGF0YSh4KSkgLy8gZG9jdW1lbnQgaGFzbid0IGJlZW4gaW5pdGlhbGl6ZWQgeWV0XHJcbiAgICAgICAgICAgICAgICAkZC5vbignbW91c2V1cCcsICQubGF5b3V0LmVuYWJsZVRleHRTZWxlY3Rpb24pLmRhdGEoeCwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIGlmICghJGQuZGF0YShzKSlcclxuICAgICAgICAgICAgICAgICRkLmRpc2FibGVTZWxlY3Rpb24oKS5kYXRhKHMsIHRydWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvL2NvbnNvbGUubG9nKCckLmxheW91dC5kaXNhYmxlVGV4dFNlbGVjdGlvbicpO1xyXG4gICAgfTtcclxuICAgICQubGF5b3V0LmVuYWJsZVRleHRTZWxlY3Rpb24gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICRkID0gJChkb2N1bWVudClcclxuICAgICAgICAgICAgLCBzID0gJ3RleHRTZWxlY3Rpb25EaXNhYmxlZCc7XHJcbiAgICAgICAgaWYgKCQuZm4uZW5hYmxlU2VsZWN0aW9uICYmICRkLmRhdGEocykpXHJcbiAgICAgICAgICAgICRkLmVuYWJsZVNlbGVjdGlvbigpLmRhdGEocywgZmFsc2UpO1xyXG4gICAgICAgIC8vY29uc29sZS5sb2coJyQubGF5b3V0LmVuYWJsZVRleHRTZWxlY3Rpb24nKTtcclxuICAgIH07XHJcbiAgICAkKFwiLnVpLWxheW91dC1yZXNpemVyLW5vcnRoXCIpLmhpZGUoKVxyXG4gICAgJChcIi51aS1sYXlvdXQtd2VzdFwiKS5jc3MoXCJib3JkZXItcmlnaHRcIixcInNvbGlkIDFweCBsaWdodEdyYXlcIilcclxuICAgICQoXCIudWktbGF5b3V0LXdlc3RcIikuYWRkQ2xhc3MoXCJ3My1jYXJkXCIpXHJcbn1cclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBkaWdpdGFsdHdpbm1vZHVsZVVJKCk7IiwiY29uc3Qgc2ltcGxlU2VsZWN0TWVudT0gcmVxdWlyZShcIi4vc2ltcGxlU2VsZWN0TWVudVwiKVxyXG5jb25zdCBzaW1wbGVDb25maXJtRGlhbG9nID0gcmVxdWlyZShcIi4vc2ltcGxlQ29uZmlybURpYWxvZ1wiKVxyXG5jb25zdCBnbG9iYWxDYWNoZT1yZXF1aXJlKFwiLi9nbG9iYWxDYWNoZVwiKVxyXG5cclxuZnVuY3Rpb24gZWRpdExheW91dERpYWxvZygpIHtcclxuICAgIGlmKCF0aGlzLkRPTSl7XHJcbiAgICAgICAgdGhpcy5ET00gPSAkKCc8ZGl2IHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dG9wOjUwJTtiYWNrZ3JvdW5kLWNvbG9yOndoaXRlO2xlZnQ6NTAlO3RyYW5zZm9ybTogdHJhbnNsYXRlWCgtNTAlKSB0cmFuc2xhdGVZKC01MCUpO3otaW5kZXg6MTAxXCIgY2xhc3M9XCJ3My1jYXJkLTJcIj48L2Rpdj4nKVxyXG4gICAgICAgICQoXCJib2R5XCIpLmFwcGVuZCh0aGlzLkRPTSlcclxuICAgICAgICB0aGlzLkRPTS5oaWRlKClcclxuICAgIH1cclxufVxyXG5cclxuZWRpdExheW91dERpYWxvZy5wcm90b3R5cGUucmVmaWxsT3B0aW9ucyA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuY2xlYXJPcHRpb25zKClcclxuICAgIFxyXG4gICAgZm9yKHZhciBpbmQgaW4gZ2xvYmFsQ2FjaGUubGF5b3V0SlNPTil7XHJcbiAgICAgICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5hZGRPcHRpb24oaW5kKVxyXG4gICAgfVxyXG59XHJcblxyXG5lZGl0TGF5b3V0RGlhbG9nLnByb3RvdHlwZS5wb3B1cCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMuRE9NLnNob3coKVxyXG4gICAgdGhpcy5ET00uZW1wdHkoKVxyXG5cclxuICAgIHRoaXMuRE9NLmNzcyh7XCJ3aWR0aFwiOlwiMzIwcHhcIixcInBhZGRpbmctYm90dG9tXCI6XCIzcHhcIn0pXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQoJCgnPGRpdiBzdHlsZT1cImhlaWdodDo0MHB4O21hcmdpbi1ib3R0b206MnB4XCIgY2xhc3M9XCJ3My1iYXIgdzMtcmVkXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtXCIgc3R5bGU9XCJmb250LXNpemU6MS4yZW1cIj5MYXlvdXQ8L2Rpdj48L2Rpdj4nKSlcclxuICAgIHZhciBjbG9zZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmlnaHRcIiBzdHlsZT1cImZvbnQtc2l6ZToyZW07cGFkZGluZy10b3A6NHB4XCI+w5c8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5ET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZChjbG9zZUJ1dHRvbilcclxuICAgIGNsb3NlQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLkRPTS5oaWRlKCkgfSlcclxuXHJcbiAgICB2YXIgbmFtZUlucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lOyB3aWR0aDoxODBweDsgZGlzcGxheTppbmxpbmU7bWFyZ2luLWxlZnQ6MnB4O21hcmdpbi1yaWdodDoycHhcIiAgcGxhY2Vob2xkZXI9XCJGaWxsIGluIGEgbmV3IGxheW91dCBuYW1lLi4uXCIvPicpLmFkZENsYXNzKFwidzMtaW5wdXQgdzMtYm9yZGVyXCIpOyAgIFxyXG4gICAgdGhpcy5ET00uYXBwZW5kKG5hbWVJbnB1dClcclxuICAgIHZhciBzYXZlQXNOZXdCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ncmVlbiB3My1ob3Zlci1saWdodC1ncmVlblwiPlNhdmUgQXMgTmV3PC9idXR0b24+JylcclxuICAgIHRoaXMuRE9NLmFwcGVuZChzYXZlQXNOZXdCdG4pXHJcbiAgICBzYXZlQXNOZXdCdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5zYXZlSW50b0xheW91dChuYW1lSW5wdXQudmFsKCkpfSlcclxuXHJcblxyXG4gICAgaWYoIWpRdWVyeS5pc0VtcHR5T2JqZWN0KGdsb2JhbENhY2hlLmxheW91dEpTT04pKXtcclxuICAgICAgICB2YXIgbGJsPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXIgdzMtcGFkZGluZy0xNlwiIHN0eWxlPVwidGV4dC1hbGlnbjpjZW50ZXI7XCI+LSBPUiAtPC9kaXY+JylcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQobGJsKSBcclxuICAgICAgICB2YXIgc3dpdGNoTGF5b3V0U2VsZWN0b3I9bmV3IHNpbXBsZVNlbGVjdE1lbnUoXCJcIix7Zm9udFNpemU6XCIxZW1cIixjb2xvckNsYXNzOlwidzMtbGlnaHQtZ3JheVwiLHdpZHRoOlwiMTIwcHhcIn0pXHJcbiAgICAgICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvcj1zd2l0Y2hMYXlvdXRTZWxlY3RvclxyXG4gICAgICAgIHRoaXMucmVmaWxsT3B0aW9ucygpXHJcbiAgICAgICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jYWxsQmFja19jbGlja09wdGlvbj0ob3B0aW9uVGV4dCxvcHRpb25WYWx1ZSk9PntcclxuICAgICAgICAgICAgaWYob3B0aW9uVGV4dD09bnVsbCkgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jaGFuZ2VOYW1lKFwiIFwiKVxyXG4gICAgICAgICAgICBlbHNlIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuY2hhbmdlTmFtZShvcHRpb25UZXh0KVxyXG4gICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgdmFyIHNhdmVBc0J0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWdyZWVuIHczLWhvdmVyLWxpZ2h0LWdyZWVuXCIgc3R5bGU9XCJtYXJnaW4tbGVmdDoycHg7bWFyZ2luLXJpZ2h0OjVweFwiPlNhdmUgQXM8L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBkZWxldGVCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1yZWQgdzMtaG92ZXItcGlua1wiIHN0eWxlPVwibWFyZ2luLWxlZnQ6NXB4XCI+RGVsZXRlIExheW91dDwvYnV0dG9uPicpXHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKHNhdmVBc0J0bixzd2l0Y2hMYXlvdXRTZWxlY3Rvci5ET00sZGVsZXRlQnRuKVxyXG4gICAgICAgIHNhdmVBc0J0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLnNhdmVJbnRvTGF5b3V0KHN3aXRjaExheW91dFNlbGVjdG9yLmN1clNlbGVjdFZhbCl9KVxyXG4gICAgICAgIGRlbGV0ZUJ0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLmRlbGV0ZUxheW91dChzd2l0Y2hMYXlvdXRTZWxlY3Rvci5jdXJTZWxlY3RWYWwpfSlcclxuXHJcbiAgICAgICAgaWYoZ2xvYmFsQ2FjaGUuY3VycmVudExheW91dE5hbWUhPW51bGwpe1xyXG4gICAgICAgICAgICBzd2l0Y2hMYXlvdXRTZWxlY3Rvci50cmlnZ2VyT3B0aW9uVmFsdWUoZ2xvYmFsQ2FjaGUuY3VycmVudExheW91dE5hbWUpXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHN3aXRjaExheW91dFNlbGVjdG9yLnRyaWdnZXJPcHRpb25JbmRleCgwKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZWRpdExheW91dERpYWxvZy5wcm90b3R5cGUuc2F2ZUludG9MYXlvdXQgPSBmdW5jdGlvbiAobGF5b3V0TmFtZSkge1xyXG4gICAgaWYobGF5b3V0TmFtZT09XCJcIiB8fCBsYXlvdXROYW1lPT1udWxsKXtcclxuICAgICAgICBhbGVydChcIlBsZWFzZSBjaG9vc2UgdGFyZ2V0IGxheW91dCBOYW1lXCIpXHJcbiAgICAgICAgcmV0dXJuXHJcbiAgICB9XHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJzYXZlTGF5b3V0XCIsIFwibGF5b3V0TmFtZVwiOiBsYXlvdXROYW1lLCBcImFkdE5hbWVcIjp0aGlzLmdldEN1ckFEVE5hbWUoKSB9KVxyXG4gICAgdGhpcy5ET00uaGlkZSgpXHJcbn1cclxuXHJcblxyXG5lZGl0TGF5b3V0RGlhbG9nLnByb3RvdHlwZS5kZWxldGVMYXlvdXQgPSBmdW5jdGlvbiAobGF5b3V0TmFtZSkge1xyXG4gICAgaWYobGF5b3V0TmFtZT09XCJcIiB8fCBsYXlvdXROYW1lPT1udWxsKXtcclxuICAgICAgICBhbGVydChcIlBsZWFzZSBjaG9vc2UgdGFyZ2V0IGxheW91dCBOYW1lXCIpXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBjb25maXJtRGlhbG9nRGl2PW5ldyBzaW1wbGVDb25maXJtRGlhbG9nKClcclxuXHJcbiAgICBjb25maXJtRGlhbG9nRGl2LnNob3coXHJcbiAgICAgICAgeyB3aWR0aDogXCIyNTBweFwiIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJDb25maXJtXCJcclxuICAgICAgICAgICAgLCBjb250ZW50OiBcIlBsZWFzZSBjb25maXJtIGRlbGV0aW5nIGxheW91dCBcXFwiXCIgKyBsYXlvdXROYW1lICsgXCJcXFwiP1wiXHJcbiAgICAgICAgICAgICwgYnV0dG9uczpbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1yZWQgdzMtaG92ZXItcGlua1wiLCB0ZXh0OiBcIkNvbmZpcm1cIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgZ2xvYmFsQ2FjaGUubGF5b3V0SlNPTltsYXlvdXROYW1lXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobGF5b3V0TmFtZSA9PSBnbG9iYWxDYWNoZS5jdXJyZW50TGF5b3V0TmFtZSkgZ2xvYmFsQ2FjaGUuY3VycmVudExheW91dE5hbWUgPSBudWxsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImxheW91dHNVcGRhdGVkXCIgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgJC5wb3N0KFwibGF5b3V0L3NhdmVMYXlvdXRzXCIsIHsgXCJhZHROYW1lXCI6IHRoaXMuZ2V0Q3VyQURUTmFtZSgpLCBcImxheW91dHNcIjogSlNPTi5zdHJpbmdpZnkoZ2xvYmFsQ2FjaGUubGF5b3V0SlNPTikgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlZmlsbE9wdGlvbnMoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLnRyaWdnZXJPcHRpb25JbmRleCgwKVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1ncmF5XCIsdGV4dDogXCJDYW5jZWxcIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKClcclxuICAgICAgICAgICAgICAgIH19XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9XHJcbiAgICApXHJcblxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBlZGl0TGF5b3V0RGlhbG9nKCk7IiwiY29uc3QgbXNhbEhlbHBlcj1yZXF1aXJlKFwiLi4vbXNhbEhlbHBlclwiKVxyXG5jb25zdCBtb2RlbEFuYWx5emVyPXJlcXVpcmUoXCIuL21vZGVsQW5hbHl6ZXJcIilcclxuXHJcbmZ1bmN0aW9uIGdsb2JhbENhY2hlKCl7XHJcbiAgICB0aGlzLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwcyA9IHt9XHJcbiAgICB0aGlzLnN0b3JlZFR3aW5zID0ge31cclxuICAgIC8vc3RvcmVkIGRhdGEsIHNlcGVyYXRlbHkgZnJvbSBBRFQgc2VydmljZSBhbmQgZnJvbSBjb3Ntb3NEQiBzZXJ2aWNlXHJcbiAgICB0aGlzLkRCTW9kZWxzQXJyID0gW11cclxuICAgIHRoaXMubW9kZWxJRE1hcFRvTmFtZT17fVxyXG4gICAgdGhpcy5tb2RlbE5hbWVNYXBUb0lEPXt9XHJcblxyXG4gICAgdGhpcy5EQlR3aW5zQXJyID0gW11cclxuICAgIHRoaXMudHdpbklETWFwVG9EaXNwbGF5TmFtZT17fVxyXG5cclxuICAgIHRoaXMuY3VycmVudExheW91dE5hbWU9bnVsbFxyXG4gICAgdGhpcy5sYXlvdXRKU09OPXt9XHJcblxyXG4gICAgdGhpcy52aXN1YWxEZWZpbml0aW9uPXtcImRlZmF1bHRcIjp7fX1cclxufVxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLmxvYWRVc2VyRGF0YSA9IGFzeW5jIGZ1bmN0aW9uICgpIHtcclxuICAgIHRyeXtcclxuICAgICAgICB2YXIgcmVzPWF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2ZldGNoVXNlckRhdGFcIilcclxuICAgIH1jYXRjaChlKXtcclxuICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB2YXIgZGJ0d2lucz1bXVxyXG4gICAgdmFyIGRibW9kZWxzPVtdXHJcbiAgICByZXMuZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICBpZihlbGVtZW50LnR5cGU9PVwidmlzdWFsU2NoZW1hXCIpIHtcclxuICAgICAgICAgICAgLy9UT0RPOiBub3cgdGhlcmUgaXMgb25seSBvbmUgXCJkZWZhdWx0XCIgc2NoZW1hIHRvIHVzZVxyXG4gICAgICAgICAgICB0aGlzLnZpc3VhbERlZmluaXRpb25bZWxlbWVudC5uYW1lXT1lbGVtZW50LmRldGFpbFxyXG4gICAgICAgIH1lbHNlIGlmKGVsZW1lbnQudHlwZT09XCJEVE1vZGVsXCIpIGRibW9kZWxzLnB1c2goZWxlbWVudClcclxuICAgICAgICBlbHNlIGlmKGVsZW1lbnQudHlwZT09XCJEVFR3aW5cIikgZGJ0d2lucy5wdXNoKGVsZW1lbnQpXHJcbiAgICB9KTtcclxuICAgIHRoaXMuc3RvcmVEQlR3aW5zQXJyKGRidHdpbnMpXHJcbiAgICB0aGlzLnN0b3JlREJNb2RlbHNBcnIoZGJtb2RlbHMpXHJcbiAgICAvL3F1ZXJ5IGRldGFpbCBvZiBhbGwgbW9kZWxzXHJcbiAgICBmb3IodmFyIGluZCBpbiB0aGlzLm1vZGVsSURNYXBUb05hbWUpIGRlbGV0ZSB0aGlzLm1vZGVsSURNYXBUb05hbWVbaW5kXVxyXG4gICAgZm9yKHZhciBpbmQgaW4gdGhpcy5tb2RlbE5hbWVNYXBUb0lEKSBkZWxldGUgdGhpcy5tb2RlbE5hbWVNYXBUb0lEW2luZF1cclxuICAgIHZhciBtb2RlbElEcz1bXVxyXG4gICAgdGhpcy5EQk1vZGVsc0Fyci5mb3JFYWNoKG9uZU1vZGVsPT57bW9kZWxJRHMucHVzaChvbmVNb2RlbFtcImlkXCJdKX0pXHJcbiAgICB0cnkge1xyXG4gICAgICAgIHZhciBkYXRhID0gYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vbGlzdE1vZGVsc0ZvcklEc1wiLCBcIlBPU1RcIiwgbW9kZWxJRHMpXHJcbiAgICAgICAgdmFyIHRtcE5hbWVUb09iaiA9IHt9XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChkYXRhW2ldW1wiZGlzcGxheU5hbWVcIl0gPT0gbnVsbCkgZGF0YVtpXVtcImRpc3BsYXlOYW1lXCJdID0gZGF0YVtpXVtcIkBpZFwiXVxyXG4gICAgICAgICAgICBpZiAoJC5pc1BsYWluT2JqZWN0KGRhdGFbaV1bXCJkaXNwbGF5TmFtZVwiXSkpIHtcclxuICAgICAgICAgICAgICAgIGlmIChkYXRhW2ldW1wiZGlzcGxheU5hbWVcIl1bXCJlblwiXSkgZGF0YVtpXVtcImRpc3BsYXlOYW1lXCJdID0gZGF0YVtpXVtcImRpc3BsYXlOYW1lXCJdW1wiZW5cIl1cclxuICAgICAgICAgICAgICAgIGVsc2UgZGF0YVtpXVtcImRpc3BsYXlOYW1lXCJdID0gSlNPTi5zdHJpbmdpZnkoZGF0YVtpXVtcImRpc3BsYXlOYW1lXCJdKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0bXBOYW1lVG9PYmpbZGF0YVtpXVtcImRpc3BsYXlOYW1lXCJdXSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAvL3JlcGVhdGVkIG1vZGVsIGRpc3BsYXkgbmFtZVxyXG4gICAgICAgICAgICAgICAgZGF0YVtpXVtcImRpc3BsYXlOYW1lXCJdID0gZGF0YVtpXVtcIkBpZFwiXVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRtcE5hbWVUb09ialtkYXRhW2ldW1wiZGlzcGxheU5hbWVcIl1dID0gZGF0YVtpXVxyXG5cclxuICAgICAgICAgICAgdGhpcy5tb2RlbElETWFwVG9OYW1lW2RhdGFbaV1bXCJAaWRcIl1dPWRhdGFbaV1bXCJkaXNwbGF5TmFtZVwiXVxyXG4gICAgICAgICAgICB0aGlzLm1vZGVsTmFtZU1hcFRvSURbZGF0YVtpXVtcImRpc3BsYXlOYW1lXCJdXT1kYXRhW2ldW1wiQGlkXCJdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIG1vZGVsQW5hbHl6ZXIuY2xlYXJBbGxNb2RlbHMoKTtcclxuICAgICAgICBtb2RlbEFuYWx5emVyLmFkZE1vZGVscyhkYXRhKVxyXG4gICAgICAgIG1vZGVsQW5hbHl6ZXIuYW5hbHl6ZSgpO1xyXG4gICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgfVxyXG59XHJcblxyXG5nbG9iYWxDYWNoZS5wcm90b3R5cGUuc3RvcmVBRFRUd2lucz1mdW5jdGlvbih0d2luc0RhdGEpe1xyXG4gICAgdHdpbnNEYXRhLmZvckVhY2goKG9uZU5vZGUpPT57dGhpcy5zdG9yZVNpbmdsZUFEVFR3aW4ob25lTm9kZSl9KTtcclxufVxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLnN0b3JlU2luZ2xlQURUVHdpbj1mdW5jdGlvbihvbmVOb2RlKXtcclxuICAgIHRoaXMuc3RvcmVkVHdpbnNbb25lTm9kZVtcIiRkdElkXCJdXSA9IG9uZU5vZGVcclxuICAgIG9uZU5vZGVbXCJkaXNwbGF5TmFtZVwiXT0gdGhpcy50d2luSURNYXBUb0Rpc3BsYXlOYW1lW29uZU5vZGVbXCIkZHRJZFwiXV1cclxufVxyXG5cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZVNpbmdsZURCVHdpbj1mdW5jdGlvbihEQlR3aW4pe1xyXG4gICAgZm9yKHZhciBpPTA7aTx0aGlzLkRCVHdpbnNBcnIubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIG9uZURCVHdpbj10aGlzLkRCVHdpbnNBcnJbaV1cclxuICAgICAgICBpZihvbmVEQlR3aW5bXCJpZFwiXT09REJUd2luW1wiaWRcIl0pe1xyXG4gICAgICAgICAgICB0aGlzLkRCVHdpbnNBcnIuc3BsaWNlKGksMSlcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdGhpcy5EQlR3aW5zQXJyLnB1c2goREJUd2luKVxyXG5cclxuICAgIHRoaXMudHdpbklETWFwVG9EaXNwbGF5TmFtZVtEQlR3aW5bXCJpZFwiXV09REJUd2luW1wiZGlzcGxheU5hbWVcIl1cclxufVxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLnN0b3JlREJUd2luc0Fycj1mdW5jdGlvbihEQlR3aW5zQXJyKXtcclxuICAgIHRoaXMuREJUd2luc0Fyci5sZW5ndGg9MFxyXG4gICAgdGhpcy5EQlR3aW5zQXJyPXRoaXMuREJUd2luc0Fyci5jb25jYXQoREJUd2luc0FycilcclxuICAgIGZvcih2YXIgaW5kIGluIHRoaXMudHdpbklETWFwVG9EaXNwbGF5TmFtZSkgZGVsZXRlIHRoaXMudHdpbklETWFwVG9EaXNwbGF5TmFtZVtpbmRdXHJcbiAgICB0aGlzLkRCVHdpbnNBcnIuZm9yRWFjaChvbmVEQlR3aW49PntcclxuICAgICAgICB0aGlzLnR3aW5JRE1hcFRvRGlzcGxheU5hbWVbb25lREJUd2luW1wiaWRcIl1dPW9uZURCVHdpbltcImRpc3BsYXlOYW1lXCJdXHJcbiAgICB9KVxyXG59XHJcblxyXG5nbG9iYWxDYWNoZS5wcm90b3R5cGUuc3RvcmVEQk1vZGVsc0Fycj1mdW5jdGlvbihEQk1vZGVsc0Fycil7XHJcbiAgICB0aGlzLkRCTW9kZWxzQXJyLmxlbmd0aD0wXHJcbiAgICB0aGlzLkRCTW9kZWxzQXJyPXRoaXMuREJNb2RlbHNBcnIuY29uY2F0KERCTW9kZWxzQXJyKVxyXG59XHJcblxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLnN0b3JlVHdpblJlbGF0aW9uc2hpcHM9ZnVuY3Rpb24ocmVsYXRpb25zRGF0YSl7XHJcbiAgICByZWxhdGlvbnNEYXRhLmZvckVhY2goKG9uZVJlbGF0aW9uc2hpcCk9PntcclxuICAgICAgICB2YXIgdHdpbklEPW9uZVJlbGF0aW9uc2hpcFsnJHNvdXJjZUlkJ11cclxuICAgICAgICB0aGlzLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1t0d2luSURdPVtdXHJcbiAgICB9KVxyXG5cclxuICAgIHJlbGF0aW9uc0RhdGEuZm9yRWFjaCgob25lUmVsYXRpb25zaGlwKT0+e1xyXG4gICAgICAgIHRoaXMuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW29uZVJlbGF0aW9uc2hpcFsnJHNvdXJjZUlkJ11dLnB1c2gob25lUmVsYXRpb25zaGlwKVxyXG4gICAgfSlcclxufVxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLnN0b3JlVHdpblJlbGF0aW9uc2hpcHNfYXBwZW5kPWZ1bmN0aW9uKHJlbGF0aW9uc0RhdGEpe1xyXG4gICAgcmVsYXRpb25zRGF0YS5mb3JFYWNoKChvbmVSZWxhdGlvbnNoaXApPT57XHJcbiAgICAgICAgaWYoIXRoaXMuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW29uZVJlbGF0aW9uc2hpcFsnJHNvdXJjZUlkJ11dKVxyXG4gICAgICAgICAgICB0aGlzLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tvbmVSZWxhdGlvbnNoaXBbJyRzb3VyY2VJZCddXT1bXVxyXG4gICAgICAgIHRoaXMuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW29uZVJlbGF0aW9uc2hpcFsnJHNvdXJjZUlkJ11dLnB1c2gob25lUmVsYXRpb25zaGlwKVxyXG4gICAgfSlcclxufVxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLnN0b3JlVHdpblJlbGF0aW9uc2hpcHNfcmVtb3ZlPWZ1bmN0aW9uKHJlbGF0aW9uc0RhdGEpe1xyXG4gICAgcmVsYXRpb25zRGF0YS5mb3JFYWNoKChvbmVSZWxhdGlvbnNoaXApPT57XHJcbiAgICAgICAgdmFyIHNyY0lEPW9uZVJlbGF0aW9uc2hpcFtcInNyY0lEXCJdXHJcbiAgICAgICAgaWYodGhpcy5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbc3JjSURdKXtcclxuICAgICAgICAgICAgdmFyIGFycj10aGlzLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tzcmNJRF1cclxuICAgICAgICAgICAgZm9yKHZhciBpPTA7aTxhcnIubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgICAgICBpZihhcnJbaV1bJyRyZWxhdGlvbnNoaXBJZCddPT1vbmVSZWxhdGlvbnNoaXBbXCJyZWxJRFwiXSl7XHJcbiAgICAgICAgICAgICAgICAgICAgYXJyLnNwbGljZShpLDEpXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBnbG9iYWxDYWNoZSgpOyIsImNvbnN0IG1vZGVsQW5hbHl6ZXIgPSByZXF1aXJlKFwiLi9tb2RlbEFuYWx5emVyXCIpO1xyXG5jb25zdCBzaW1wbGVTZWxlY3RNZW51PSByZXF1aXJlKFwiLi9zaW1wbGVTZWxlY3RNZW51XCIpXHJcbmNvbnN0IHNpbXBsZUNvbmZpcm1EaWFsb2cgPSByZXF1aXJlKFwiLi9zaW1wbGVDb25maXJtRGlhbG9nXCIpXHJcbmNvbnN0IGdsb2JhbENhY2hlID0gcmVxdWlyZShcIi4vZ2xvYmFsQ2FjaGVcIilcclxuY29uc3QgbXNhbEhlbHBlciA9IHJlcXVpcmUoXCIuLi9tc2FsSGVscGVyXCIpXHJcblxyXG5mdW5jdGlvbiBpbmZvUGFuZWwoKSB7XHJcbiAgICB0aGlzLmNvbnRpbmVyRE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1jYXJkXCIgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt6LWluZGV4OjkwO3JpZ2h0OjBweDt0b3A6NTAlO2hlaWdodDo3MCU7d2lkdGg6MzAwcHg7dHJhbnNmb3JtOiB0cmFuc2xhdGVZKC01MCUpO1wiPjwvZGl2PicpXHJcbiAgICB0aGlzLmNvbnRpbmVyRE9NLmhpZGUoKVxyXG4gICAgdGhpcy5jb250aW5lckRPTS5hcHBlbmQoJCgnPGRpdiBzdHlsZT1cImhlaWdodDo1MHB4XCIgY2xhc3M9XCJ3My1iYXIgdzMtcmVkXCI+PC9kaXY+JykpXHJcblxyXG4gICAgdGhpcy5jbG9zZUJ1dHRvbjE9JCgnPGJ1dHRvbiBzdHlsZT1cImhlaWdodDoxMDAlXCIgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b25cIj48aSBjbGFzcz1cImZhIGZhLWluZm8tY2lyY2xlIGZhLTJ4XCIgc3R5bGU9XCJwYWRkaW5nOjJweFwiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5jbG9zZUJ1dHRvbjI9JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yaWdodFwiIHN0eWxlPVwiZm9udC1zaXplOjJlbVwiPsOXPC9idXR0b24+JylcclxuICAgIHRoaXMuY29udGluZXJET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZCh0aGlzLmNsb3NlQnV0dG9uMSx0aGlzLmNsb3NlQnV0dG9uMikgXHJcblxyXG4gICAgdGhpcy5pc01pbmltaXplZD1mYWxzZTtcclxuICAgIHZhciBidXR0b25BbmltPSgpPT57XHJcbiAgICAgICAgaWYoIXRoaXMuaXNNaW5pbWl6ZWQpe1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRpbmVyRE9NLmFuaW1hdGUoe1xyXG4gICAgICAgICAgICAgICAgcmlnaHQ6IFwiLTI1MHB4XCIsXHJcbiAgICAgICAgICAgICAgICBoZWlnaHQ6XCI1MHB4XCJcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgdGhpcy5pc01pbmltaXplZD10cnVlO1xyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRpbmVyRE9NLmFuaW1hdGUoe1xyXG4gICAgICAgICAgICAgICAgcmlnaHQ6IFwiMHB4XCIsXHJcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IFwiNzAlXCJcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgdGhpcy5pc01pbmltaXplZD1mYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLmNsb3NlQnV0dG9uMS5vbihcImNsaWNrXCIsYnV0dG9uQW5pbSlcclxuICAgIHRoaXMuY2xvc2VCdXR0b24yLm9uKFwiY2xpY2tcIixidXR0b25BbmltKVxyXG5cclxuICAgIHRoaXMuRE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1jb250YWluZXJcIiBzdHlsZT1cInBvc3Rpb246YWJzb2x1dGU7dG9wOjUwcHg7aGVpZ2h0OmNhbGMoMTAwJSAtIDUwcHgpO292ZXJmbG93OmF1dG9cIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5jb250aW5lckRPTS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIsXCJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuOClcIilcclxuICAgIHRoaXMuY29udGluZXJET00uaG92ZXIoKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuY29udGluZXJET00uY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiLCBcInJnYmEoMjU1LCAyNTUsIDI1NSwgMSlcIilcclxuICAgIH0sICgpID0+IHtcclxuICAgICAgICB0aGlzLmNvbnRpbmVyRE9NLmNzcyhcImJhY2tncm91bmQtY29sb3JcIiwgXCJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuOClcIilcclxuICAgIH0pO1xyXG4gICAgdGhpcy5jb250aW5lckRPTS5hcHBlbmQodGhpcy5ET00pXHJcbiAgICAkKCdib2R5JykuYXBwZW5kKHRoaXMuY29udGluZXJET00pXHJcbiAgICB0aGlzLkRPTS5odG1sKFwiPGEgc3R5bGU9J2Rpc3BsYXk6YmxvY2s7Zm9udC1zdHlsZTppdGFsaWM7Y29sb3I6Z3JheSc+Q2hvb3NlIHR3aW5zIG9yIHJlbGF0aW9uc2hpcHMgdG8gdmlldyBpbmZvbXJhdGlvbjwvYT48YSBzdHlsZT0nZGlzcGxheTpibG9jaztmb250LXN0eWxlOml0YWxpYztjb2xvcjpncmF5O3BhZGRpbmctdG9wOjIwcHgnPlByZXNzIHNoaWZ0IGtleSB0byBzZWxlY3QgbXVsdGlwbGUgaW4gdG9wb2xvZ3kgdmlldzwvYT48YSBzdHlsZT0nZGlzcGxheTpibG9jaztmb250LXN0eWxlOml0YWxpYztjb2xvcjpncmF5O3BhZGRpbmctdG9wOjIwcHg7cGFkZGluZy1ib3R0b206MjBweCc+UHJlc3MgY3RybCBrZXkgdG8gc2VsZWN0IG11bHRpcGxlIGluIHRyZWUgdmlldzwvYT48YSBzdHlsZT0nZGlzcGxheTpibG9jaztmb250LXN0eWxlOml0YWxpYztjb2xvcjpncmF5O3BhZGRpbmctdG9wOjIwcHg7cGFkZGluZy1ib3R0b206NXB4Jz5JbXBvcnQgdHdpbnMgZGF0YSBieSBjbGlja2luZyBidXR0b24gYmVsb3c8L2E+XCIpXHJcblxyXG4gICAgdGhpcy5kcmF3QnV0dG9ucyhudWxsKVxyXG4gICAgdGhpcy5zZWxlY3RlZE9iamVjdHM9bnVsbDtcclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5yeE1lc3NhZ2U9ZnVuY3Rpb24obXNnUGF5bG9hZCl7XHJcbiAgICBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwic3RhcnRTZWxlY3Rpb25EaWFsb2dfY2xvc2VkXCIpe1xyXG4gICAgICAgIGlmKCF0aGlzLmNvbnRpbmVyRE9NLmlzKFwiOnZpc2libGVcIikpIHtcclxuICAgICAgICAgICAgdGhpcy5jb250aW5lckRPTS5zaG93KClcclxuICAgICAgICAgICAgdGhpcy5jb250aW5lckRPTS5hZGRDbGFzcyhcInczLWFuaW1hdGUtcmlnaHRcIilcclxuICAgICAgICB9XHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwic2VsZWN0Tm9kZXNcIil7XHJcbiAgICAgICAgdGhpcy5ET00uZW1wdHkoKVxyXG4gICAgICAgIHZhciBhcnI9bXNnUGF5bG9hZC5pbmZvO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmKGFycj09bnVsbCB8fCBhcnIubGVuZ3RoPT0wKXtcclxuICAgICAgICAgICAgdGhpcy5kcmF3QnV0dG9ucyhudWxsKVxyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkT2JqZWN0cz1bXTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnNlbGVjdGVkT2JqZWN0cz1hcnI7XHJcbiAgICAgICAgaWYoYXJyLmxlbmd0aD09MSl7XHJcbiAgICAgICAgICAgIHZhciBzaW5nbGVFbGVtZW50SW5mbz1hcnJbMF07XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZihzaW5nbGVFbGVtZW50SW5mb1tcIiRkdElkXCJdKXsvLyBzZWxlY3QgYSBub2RlXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyYXdCdXR0b25zKFwic2luZ2xlTm9kZVwiKVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvL2luc3RlYWQgb2YgZHJhdyB0aGUgJGR0SWQsIGRyYXcgZGlzcGxheSBuYW1lIGluc3RlYWRcclxuICAgICAgICAgICAgICAgIC8vdGhpcy5kcmF3U3RhdGljSW5mbyh0aGlzLkRPTSx7XCIkZHRJZFwiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJGR0SWRcIl19LFwiMWVtXCIsXCIxM3B4XCIpXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyYXdTdGF0aWNJbmZvKHRoaXMuRE9NLHtcIm5hbWVcIjpzaW5nbGVFbGVtZW50SW5mb1tcImRpc3BsYXlOYW1lXCJdfSxcIjFlbVwiLFwiMTNweFwiKVxyXG5cclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgbW9kZWxOYW1lPXNpbmdsZUVsZW1lbnRJbmZvWyckbWV0YWRhdGEnXVsnJG1vZGVsJ11cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgaWYobW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsTmFtZV0pe1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhd0VkaXRhYmxlKHRoaXMuRE9NLG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbE5hbWVdLmVkaXRhYmxlUHJvcGVydGllcyxzaW5nbGVFbGVtZW50SW5mbyxbXSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vaW5zdGVhZCBvZiBkcmF3aW5nIHRoZSBvcmlnaW5hbCBpbmZvbXJhdGlvbiwgZHJhdyBtb3JlIG1lYW5pbmdmdWwgb25lXHJcbiAgICAgICAgICAgICAgICAvL3RoaXMuZHJhd1N0YXRpY0luZm8odGhpcy5ET00se1wiJGV0YWdcIjpzaW5nbGVFbGVtZW50SW5mb1tcIiRldGFnXCJdLFwiJG1ldGFkYXRhXCI6c2luZ2xlRWxlbWVudEluZm9bXCIkbWV0YWRhdGFcIl19LFwiMWVtXCIsXCIxMHB4XCIpXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyYXdTdGF0aWNJbmZvKHRoaXMuRE9NLHtcIk1vZGVsXCI6c2luZ2xlRWxlbWVudEluZm9bXCIkbWV0YWRhdGFcIl1bXCIkbW9kZWxcIl19LFwiMWVtXCIsXCIxMHB4XCIpXHJcbiAgICAgICAgICAgICAgICBmb3IodmFyIGluZCBpbiBzaW5nbGVFbGVtZW50SW5mb1tcIiRtZXRhZGF0YVwiXSl7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoaW5kID09IFwiJG1vZGVsXCIpIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0bXBPYmo9e31cclxuICAgICAgICAgICAgICAgICAgICB0bXBPYmpbaW5kXT1zaW5nbGVFbGVtZW50SW5mb1tcIiRtZXRhZGF0YVwiXVtpbmRdXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmF3U3RhdGljSW5mbyh0aGlzLkRPTSx0bXBPYmosXCIxZW1cIixcIjEwcHhcIilcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfWVsc2UgaWYoc2luZ2xlRWxlbWVudEluZm9bXCIkc291cmNlSWRcIl0pe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3QnV0dG9ucyhcInNpbmdsZVJlbGF0aW9uc2hpcFwiKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3U3RhdGljSW5mbyh0aGlzLkRPTSx7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJGcm9tXCI6Z2xvYmFsQ2FjaGUudHdpbklETWFwVG9EaXNwbGF5TmFtZVtzaW5nbGVFbGVtZW50SW5mb1tcIiRzb3VyY2VJZFwiXV0sXHJcbiAgICAgICAgICAgICAgICAgICAgXCJUb1wiOmdsb2JhbENhY2hlLnR3aW5JRE1hcFRvRGlzcGxheU5hbWVbc2luZ2xlRWxlbWVudEluZm9bXCIkdGFyZ2V0SWRcIl1dLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiUmVsYXRpb25zaGlwIFR5cGVcIjpzaW5nbGVFbGVtZW50SW5mb1tcIiRyZWxhdGlvbnNoaXBOYW1lXCJdXHJcbiAgICAgICAgICAgICAgICAgICAgLy8sXCIkcmVsYXRpb25zaGlwSWRcIjpzaW5nbGVFbGVtZW50SW5mb1tcIiRyZWxhdGlvbnNoaXBJZFwiXVxyXG4gICAgICAgICAgICAgICAgfSxcIjFlbVwiLFwiMTNweFwiKVxyXG4gICAgICAgICAgICAgICAgdmFyIHJlbGF0aW9uc2hpcE5hbWU9c2luZ2xlRWxlbWVudEluZm9bXCIkcmVsYXRpb25zaGlwTmFtZVwiXVxyXG4gICAgICAgICAgICAgICAgdmFyIHNvdXJjZU1vZGVsPXNpbmdsZUVsZW1lbnRJbmZvW1wic291cmNlTW9kZWxcIl1cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3RWRpdGFibGUodGhpcy5ET00sdGhpcy5nZXRSZWxhdGlvblNoaXBFZGl0YWJsZVByb3BlcnRpZXMocmVsYXRpb25zaGlwTmFtZSxzb3VyY2VNb2RlbCksc2luZ2xlRWxlbWVudEluZm8sW10pXHJcbiAgICAgICAgICAgICAgICBmb3IodmFyIGluZCBpbiBzaW5nbGVFbGVtZW50SW5mb1tcIiRtZXRhZGF0YVwiXSl7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRtcE9iaj17fVxyXG4gICAgICAgICAgICAgICAgICAgIHRtcE9ialtpbmRdPXNpbmdsZUVsZW1lbnRJbmZvW1wiJG1ldGFkYXRhXCJdW2luZF1cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYXdTdGF0aWNJbmZvKHRoaXMuRE9NLHRtcE9iaixcIjFlbVwiLFwiMTBweFwiKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy90aGlzLmRyYXdTdGF0aWNJbmZvKHRoaXMuRE9NLHtcIiRldGFnXCI6c2luZ2xlRWxlbWVudEluZm9bXCIkZXRhZ1wiXX0sXCIxZW1cIixcIjEwcHhcIixcIkRhcmtHcmF5XCIpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9ZWxzZSBpZihhcnIubGVuZ3RoPjEpe1xyXG4gICAgICAgICAgICB0aGlzLmRyYXdCdXR0b25zKFwibXVsdGlwbGVcIilcclxuICAgICAgICAgICAgdGhpcy5kcmF3TXVsdGlwbGVPYmooKVxyXG4gICAgICAgIH1cclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJzZWxlY3RHcm91cE5vZGVcIil7XHJcbiAgICAgICAgdGhpcy5ET00uZW1wdHkoKVxyXG4gICAgICAgIHZhciBtb2RlbElEID0gbXNnUGF5bG9hZC5pbmZvW1wiQGlkXCJdXHJcbiAgICAgICAgaWYoIW1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXSkgcmV0dXJuO1xyXG4gICAgICAgIHZhciB0d2luSnNvbiA9IHtcclxuICAgICAgICAgICAgXCIkbWV0YWRhdGFcIjoge1xyXG4gICAgICAgICAgICAgICAgXCIkbW9kZWxcIjogbW9kZWxJRFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBhZGRCdG4gPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtZ3JlZW4gdzMtaG92ZXItbGlnaHQtZ3JlZW4gdzMtbWFyZ2luXCI+QWRkIFR3aW48L2J1dHRvbj4nKVxyXG4gICAgICAgIHRoaXMuRE9NLmFwcGVuZChhZGRCdG4pXHJcblxyXG4gICAgICAgIGFkZEJ0bi5vbihcImNsaWNrXCIsKGUpID0+IHtcclxuICAgICAgICAgICAgaWYoIXR3aW5Kc29uW1wiJGR0SWRcIl18fHR3aW5Kc29uW1wiJGR0SWRcIl09PVwiXCIpe1xyXG4gICAgICAgICAgICAgICAgYWxlcnQoXCJQbGVhc2UgZmlsbCBpbiBuYW1lIGZvciB0aGUgbmV3IGRpZ2l0YWwgdHdpblwiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgY29tcG9uZW50c05hbWVBcnI9bW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdLmluY2x1ZGVkQ29tcG9uZW50c1xyXG4gICAgICAgICAgICBjb21wb25lbnRzTmFtZUFyci5mb3JFYWNoKG9uZUNvbXBvbmVudE5hbWU9PnsgLy9hZHQgc2VydmljZSByZXF1ZXN0aW5nIGFsbCBjb21wb25lbnQgYXBwZWFyIGJ5IG1hbmRhdG9yeVxyXG4gICAgICAgICAgICAgICAgaWYodHdpbkpzb25bb25lQ29tcG9uZW50TmFtZV09PW51bGwpdHdpbkpzb25bb25lQ29tcG9uZW50TmFtZV09e31cclxuICAgICAgICAgICAgICAgIHR3aW5Kc29uW29uZUNvbXBvbmVudE5hbWVdW1wiJG1ldGFkYXRhXCJdPSB7fVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB0aGlzLmFkZFR3aW4odHdpbkpzb24pXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgdGhpcy5kcmF3U3RhdGljSW5mbyh0aGlzLkRPTSx7XHJcbiAgICAgICAgICAgIFwiTW9kZWxcIjptb2RlbElEXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgYWRkQnRuLmRhdGEoXCJ0d2luSnNvblwiLHR3aW5Kc29uKVxyXG4gICAgICAgIHZhciBjb3B5UHJvcGVydHk9SlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF0uZWRpdGFibGVQcm9wZXJ0aWVzKSlcclxuICAgICAgICBjb3B5UHJvcGVydHlbJyRkdElkJ109XCJzdHJpbmdcIlxyXG4gICAgICAgIHRoaXMuZHJhd0VkaXRhYmxlKHRoaXMuRE9NLGNvcHlQcm9wZXJ0eSx0d2luSnNvbixbXSxcIm5ld1R3aW5cIilcclxuICAgICAgICAvL2NvbnNvbGUubG9nKG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXSkgXHJcbiAgICB9XHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuYWRkVHdpbj1hc3luYyBmdW5jdGlvbih0d2luSnNvbil7XHJcbiAgICAvL2FzayB0YXNrbWFzdGVyIHRvIGFkZCB0aGUgdHdpblxyXG4gICAgdHJ5e1xyXG4gICAgICAgIHZhciBkYXRhID0gYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vdXBzZXJ0RGlnaXRhbFR3aW5cIiwgXCJQT1NUXCIsICB7XCJuZXdUd2luSnNvblwiOkpTT04uc3RyaW5naWZ5KHR3aW5Kc29uKX0pXHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICB9XHJcblxyXG4gICAgZ2xvYmFsQ2FjaGUuc3RvcmVTaW5nbGVEQlR3aW4oZGF0YS5EQlR3aW4pXHJcbiAgICAvL3N1Y2Nlc3NmdWwgZWRpdGluZywgdXBkYXRlIHRoZSBub2RlIG9yaWdpbmFsIGluZm9cclxuICAgIHZhciBrZXlMYWJlbCA9IHRoaXMuRE9NLmZpbmQoJyNORVdUV0lOX0lETGFiZWwnKVxyXG4gICAgdmFyIElESW5wdXQgPSBrZXlMYWJlbC5maW5kKFwiaW5wdXRcIilcclxuICAgIGlmIChJRElucHV0KSBJRElucHV0LnZhbChcIlwiKVxyXG4gICAgXHJcbiAgICBnbG9iYWxDYWNoZS5zdG9yZVNpbmdsZUFEVFR3aW4oZGF0YS5BRFRUd2luKVxyXG4gICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiYWRkTmV3VHdpblwiLCB0d2luSW5mbzogZGF0YS5BRFRUd2luIH0pXHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZ2V0UmVsYXRpb25TaGlwRWRpdGFibGVQcm9wZXJ0aWVzPWZ1bmN0aW9uKHJlbGF0aW9uc2hpcE5hbWUsc291cmNlTW9kZWwpe1xyXG4gICAgaWYoIW1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1tzb3VyY2VNb2RlbF0gfHwgIW1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1tzb3VyY2VNb2RlbF0udmFsaWRSZWxhdGlvbnNoaXBzW3JlbGF0aW9uc2hpcE5hbWVdKSByZXR1cm5cclxuICAgIHJldHVybiBtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbc291cmNlTW9kZWxdLnZhbGlkUmVsYXRpb25zaGlwc1tyZWxhdGlvbnNoaXBOYW1lXS5lZGl0YWJsZVJlbGF0aW9uc2hpcFByb3BlcnRpZXNcclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5kcmF3QnV0dG9ucz1mdW5jdGlvbihzZWxlY3RUeXBlKXtcclxuICAgIHZhciBpbXBCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ibHVlXCI+PGkgY2xhc3M9XCJmYSBmYS1hcnJvdy1jaXJjbGUtby1kb3duXCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICB2YXIgYWN0dWFsSW1wb3J0VHdpbnNCdG4gPSQoJzxpbnB1dCB0eXBlPVwiZmlsZVwiIG5hbWU9XCJtb2RlbEZpbGVzXCIgbXVsdGlwbGU9XCJtdWx0aXBsZVwiIHN0eWxlPVwiZGlzcGxheTpub25lXCI+PC9pbnB1dD4nKVxyXG4gICAgaWYoc2VsZWN0VHlwZSE9bnVsbCl7XHJcbiAgICAgICAgdmFyIHJlZnJlc2hCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ibGFja1wiPjxpIGNsYXNzPVwiZmEgZmEtcmVmcmVzaFwiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBleHBCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ncmVlblwiPjxpIGNsYXNzPVwiZmEgZmEtYXJyb3ctY2lyY2xlLW8tdXBcIj48L2k+PC9idXR0b24+JykgICAgXHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKHJlZnJlc2hCdG4sZXhwQnRuLGltcEJ0bixhY3R1YWxJbXBvcnRUd2luc0J0bilcclxuICAgICAgICByZWZyZXNoQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMucmVmcmVzaEluZm9tYXRpb24oKX0pXHJcbiAgICAgICAgZXhwQnRuLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgICAgICAvL2ZpbmQgb3V0IHRoZSB0d2lucyBpbiBzZWxlY3Rpb24gYW5kIHRoZWlyIGNvbm5lY3Rpb25zIChmaWx0ZXIgYm90aCBzcmMgYW5kIHRhcmdldCB3aXRoaW4gdGhlIHNlbGVjdGVkIHR3aW5zKVxyXG4gICAgICAgICAgICAvL2FuZCBleHBvcnQgdGhlbVxyXG4gICAgICAgICAgICB0aGlzLmV4cG9ydFNlbGVjdGVkKClcclxuICAgICAgICB9KSAgICBcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHRoaXMuRE9NLmFwcGVuZChpbXBCdG4sYWN0dWFsSW1wb3J0VHdpbnNCdG4pXHJcbiAgICB9XHJcbiAgICBcclxuICAgIGltcEJ0bi5vbihcImNsaWNrXCIsKCk9PnthY3R1YWxJbXBvcnRUd2luc0J0bi50cmlnZ2VyKCdjbGljaycpO30pXHJcbiAgICBhY3R1YWxJbXBvcnRUd2luc0J0bi5jaGFuZ2UoYXN5bmMgKGV2dCk9PntcclxuICAgICAgICB2YXIgZmlsZXMgPSBldnQudGFyZ2V0LmZpbGVzOyAvLyBGaWxlTGlzdCBvYmplY3RcclxuICAgICAgICBhd2FpdCB0aGlzLnJlYWRUd2luc0ZpbGVzQ29udGVudEFuZEltcG9ydChmaWxlcylcclxuICAgICAgICBhY3R1YWxJbXBvcnRUd2luc0J0bi52YWwoXCJcIilcclxuICAgIH0pXHJcbiAgICBpZihzZWxlY3RUeXBlPT1udWxsKSByZXR1cm47XHJcblxyXG4gICAgaWYoc2VsZWN0VHlwZT09XCJzaW5nbGVSZWxhdGlvbnNoaXBcIil7XHJcbiAgICAgICAgdmFyIGRlbEJ0biA9ICAkKCc8YnV0dG9uIHN0eWxlPVwid2lkdGg6NTAlXCIgY2xhc3M9XCJ3My1idXR0b24gdzMtcmVkIHczLWhvdmVyLXBpbmsgdzMtYm9yZGVyXCI+RGVsZXRlIEFsbDwvYnV0dG9uPicpXHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKGRlbEJ0bilcclxuICAgICAgICBkZWxCdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5kZWxldGVTZWxlY3RlZCgpfSlcclxuICAgIH1lbHNlIGlmKHNlbGVjdFR5cGU9PVwic2luZ2xlTm9kZVwiIHx8IHNlbGVjdFR5cGU9PVwibXVsdGlwbGVcIil7XHJcbiAgICAgICAgdmFyIGRlbEJ0biA9ICQoJzxidXR0b24gc3R5bGU9XCJ3aWR0aDo1MCVcIiBjbGFzcz1cInczLWJ1dHRvbiB3My1yZWQgdzMtaG92ZXItcGluayB3My1ib3JkZXJcIj5EZWxldGUgQWxsPC9idXR0b24+JylcclxuICAgICAgICB2YXIgY29ubmVjdFRvQnRuID0kKCc8YnV0dG9uIHN0eWxlPVwid2lkdGg6NDUlXCIgIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiPkNvbm5lY3QgdG88L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBjb25uZWN0RnJvbUJ0biA9ICQoJzxidXR0b24gc3R5bGU9XCJ3aWR0aDo0NSVcIiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj5Db25uZWN0IGZyb208L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBzaG93SW5ib3VuZEJ0biA9ICQoJzxidXR0b24gIHN0eWxlPVwid2lkdGg6NDUlXCIgY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+UXVlcnkgSW5ib3VuZDwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIHNob3dPdXRCb3VuZEJ0biA9ICQoJzxidXR0b24gc3R5bGU9XCJ3aWR0aDo0NSVcIiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj5RdWVyeSBPdXRib3VuZDwvYnV0dG9uPicpXHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKGRlbEJ0biwgY29ubmVjdFRvQnRuLGNvbm5lY3RGcm9tQnRuICwgc2hvd0luYm91bmRCdG4sIHNob3dPdXRCb3VuZEJ0bilcclxuICAgIFxyXG4gICAgICAgIHNob3dPdXRCb3VuZEJ0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLnNob3dPdXRCb3VuZCgpfSlcclxuICAgICAgICBzaG93SW5ib3VuZEJ0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLnNob3dJbkJvdW5kKCl9KSAgXHJcbiAgICAgICAgY29ubmVjdFRvQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImNvbm5lY3RUb1wifSkgfSlcclxuICAgICAgICBjb25uZWN0RnJvbUJ0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJjb25uZWN0RnJvbVwifSkgfSlcclxuXHJcbiAgICAgICAgZGVsQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuZGVsZXRlU2VsZWN0ZWQoKX0pXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHZhciBudW1PZk5vZGUgPSAwO1xyXG4gICAgdmFyIGFycj10aGlzLnNlbGVjdGVkT2JqZWN0cztcclxuICAgIGFyci5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIGlmIChlbGVtZW50WyckZHRJZCddKSBudW1PZk5vZGUrK1xyXG4gICAgfSk7XHJcbiAgICBpZihudW1PZk5vZGU+MCl7XHJcbiAgICAgICAgdmFyIHNlbGVjdEluYm91bmRCdG4gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiPitTZWxlY3QgSW5ib3VuZDwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIHNlbGVjdE91dEJvdW5kQnRuID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj4rU2VsZWN0IE91dGJvdW5kPC9idXR0b24+JylcclxuICAgICAgICB2YXIgY29zZUxheW91dEJ0bj0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj5DT1NFIFZpZXc8L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBoaWRlQnRuPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiPkhpZGU8L2J1dHRvbj4nKVxyXG4gICAgICAgIHRoaXMuRE9NLmFwcGVuZChzZWxlY3RJbmJvdW5kQnRuLCBzZWxlY3RPdXRCb3VuZEJ0bixjb3NlTGF5b3V0QnRuLGhpZGVCdG4pXHJcblxyXG4gICAgICAgIHNlbGVjdEluYm91bmRCdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5icm9hZGNhc3RNZXNzYWdlKHtcIm1lc3NhZ2VcIjogXCJhZGRTZWxlY3RJbmJvdW5kXCJ9KX0pXHJcbiAgICAgICAgc2VsZWN0T3V0Qm91bmRCdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5icm9hZGNhc3RNZXNzYWdlKHtcIm1lc3NhZ2VcIjogXCJhZGRTZWxlY3RPdXRib3VuZFwifSl9KVxyXG4gICAgICAgIGNvc2VMYXlvdXRCdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5icm9hZGNhc3RNZXNzYWdlKHtcIm1lc3NhZ2VcIjogXCJDT1NFU2VsZWN0ZWROb2Rlc1wifSl9KVxyXG4gICAgICAgIGhpZGVCdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5icm9hZGNhc3RNZXNzYWdlKHtcIm1lc3NhZ2VcIjogXCJoaWRlU2VsZWN0ZWROb2Rlc1wifSl9KVxyXG4gICAgfVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmV4cG9ydFNlbGVjdGVkPWFzeW5jIGZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgYXJyPXRoaXMuc2VsZWN0ZWRPYmplY3RzO1xyXG4gICAgaWYoYXJyLmxlbmd0aD09MCkgcmV0dXJuO1xyXG4gICAgdmFyIHR3aW5JREFycj1bXVxyXG4gICAgdmFyIHR3aW5Ub0JlU3RvcmVkPVtdXHJcbiAgICB2YXIgdHdpbklEcz17fVxyXG4gICAgYXJyLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgaWYgKGVsZW1lbnRbJyRzb3VyY2VJZCddKSByZXR1cm5cclxuICAgICAgICB0d2luSURBcnIucHVzaChlbGVtZW50WyckZHRJZCddKVxyXG4gICAgICAgIHZhciBhbkV4cFR3aW49e31cclxuICAgICAgICBhbkV4cFR3aW5bXCIkbWV0YWRhdGFcIl09e1wiJG1vZGVsXCI6ZWxlbWVudFtcIiRtZXRhZGF0YVwiXVtcIiRtb2RlbFwiXX1cclxuICAgICAgICBmb3IodmFyIGluZCBpbiBlbGVtZW50KXtcclxuICAgICAgICAgICAgaWYoaW5kPT1cIiRtZXRhZGF0YVwiIHx8IGluZD09XCIkZXRhZ1wiKSBjb250aW51ZSBcclxuICAgICAgICAgICAgZWxzZSBhbkV4cFR3aW5baW5kXT1lbGVtZW50W2luZF1cclxuICAgICAgICB9XHJcbiAgICAgICAgdHdpblRvQmVTdG9yZWQucHVzaChhbkV4cFR3aW4pXHJcbiAgICAgICAgdHdpbklEc1tlbGVtZW50WyckZHRJZCddXT0xXHJcbiAgICB9KTtcclxuICAgIHZhciByZWxhdGlvbnNUb0JlU3RvcmVkPVtdXHJcbiAgICB0d2luSURBcnIuZm9yRWFjaChvbmVJRD0+e1xyXG4gICAgICAgIHZhciByZWxhdGlvbnM9Z2xvYmFsQ2FjaGUuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW29uZUlEXVxyXG4gICAgICAgIGlmKCFyZWxhdGlvbnMpIHJldHVybjtcclxuICAgICAgICByZWxhdGlvbnMuZm9yRWFjaChvbmVSZWxhdGlvbj0+e1xyXG4gICAgICAgICAgICB2YXIgdGFyZ2V0SUQ9b25lUmVsYXRpb25bXCIkdGFyZ2V0SWRcIl1cclxuICAgICAgICAgICAgaWYodHdpbklEc1t0YXJnZXRJRF0pIHtcclxuICAgICAgICAgICAgICAgIHZhciBvYmo9e31cclxuICAgICAgICAgICAgICAgIGZvcih2YXIgaW5kIGluIG9uZVJlbGF0aW9uKXtcclxuICAgICAgICAgICAgICAgICAgICBpZihpbmQgPT1cIiRldGFnXCJ8fGluZCA9PVwiJHJlbGF0aW9uc2hpcElkXCJ8fGluZCA9PVwiJHNvdXJjZUlkXCJ8fGluZCA9PVwic291cmNlTW9kZWxcIikgY29udGludWVcclxuICAgICAgICAgICAgICAgICAgICBvYmpbaW5kXT1vbmVSZWxhdGlvbltpbmRdXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB2YXIgb25lQWN0aW9uPXtcIiRzcmNJZFwiOm9uZUlELFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiJHJlbGF0aW9uc2hpcElkXCI6b25lUmVsYXRpb25bXCIkcmVsYXRpb25zaGlwSWRcIl0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJvYmpcIjpvYmp9XHJcbiAgICAgICAgICAgICAgICByZWxhdGlvbnNUb0JlU3RvcmVkLnB1c2gob25lQWN0aW9uKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgIH0pXHJcbiAgICB2YXIgZmluYWxKU09OPXtcInR3aW5zXCI6dHdpblRvQmVTdG9yZWQsXCJyZWxhdGlvbnNcIjpyZWxhdGlvbnNUb0JlU3RvcmVkfVxyXG4gICAgdmFyIHBvbSA9ICQoXCI8YT48L2E+XCIpXHJcbiAgICBwb20uYXR0cignaHJlZicsICdkYXRhOnRleHQvcGxhaW47Y2hhcnNldD11dGYtOCwnICsgZW5jb2RlVVJJQ29tcG9uZW50KEpTT04uc3RyaW5naWZ5KGZpbmFsSlNPTikpKTtcclxuICAgIHBvbS5hdHRyKCdkb3dubG9hZCcsIFwiZXhwb3J0VHdpbnNEYXRhLmpzb25cIik7XHJcbiAgICBwb21bMF0uY2xpY2soKVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLnJlYWRPbmVGaWxlPSBhc3luYyBmdW5jdGlvbihhRmlsZSl7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XHJcbiAgICAgICAgICAgIHJlYWRlci5vbmxvYWQgPSAoKT0+IHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUocmVhZGVyLnJlc3VsdClcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgcmVhZGVyLnJlYWRBc1RleHQoYUZpbGUpO1xyXG4gICAgICAgIH1jYXRjaChlKXtcclxuICAgICAgICAgICAgcmVqZWN0KGUpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufVxyXG5pbmZvUGFuZWwucHJvdG90eXBlLnJlYWRUd2luc0ZpbGVzQ29udGVudEFuZEltcG9ydD1hc3luYyBmdW5jdGlvbihmaWxlcyl7XHJcbiAgICB2YXIgaW1wb3J0VHdpbnM9W11cclxuICAgIHZhciBpbXBvcnRSZWxhdGlvbnM9W11cclxuICAgIGZvciAodmFyIGkgPSAwLCBmOyBmID0gZmlsZXNbaV07IGkrKykge1xyXG4gICAgICAgIC8vIE9ubHkgcHJvY2VzcyBqc29uIGZpbGVzLlxyXG4gICAgICAgIGlmIChmLnR5cGUhPVwiYXBwbGljYXRpb24vanNvblwiKSBjb250aW51ZTtcclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgIHZhciBzdHI9IGF3YWl0IHRoaXMucmVhZE9uZUZpbGUoZilcclxuICAgICAgICAgICAgdmFyIG9iaj1KU09OLnBhcnNlKHN0cilcclxuICAgICAgICAgICAgaWYob2JqLnR3aW5zKSBpbXBvcnRUd2lucz1pbXBvcnRUd2lucy5jb25jYXQob2JqLnR3aW5zKVxyXG4gICAgICAgICAgICBpZihvYmoucmVsYXRpb25zKSBpbXBvcnRSZWxhdGlvbnM9aW1wb3J0UmVsYXRpb25zLmNvbmNhdChvYmoucmVsYXRpb25zKVxyXG4gICAgICAgIH1jYXRjaChlcnIpe1xyXG4gICAgICAgICAgICBhbGVydChlcnIpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHZhciB0d2luc0ltcG9ydFJlc3VsdD0gYXdhaXQgdGhpcy5iYXRjaEltcG9ydFR3aW5zKGltcG9ydFR3aW5zKVxyXG4gICAgdHdpbnNJbXBvcnRSZXN1bHQuZm9yRWFjaChkYXRhPT57XHJcbiAgICAgICAgZ2xvYmFsQ2FjaGUuc3RvcmVTaW5nbGVBRFRUd2luKGRhdGEpXHJcbiAgICB9KVxyXG4gICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiYWRkTmV3VHdpbnNcIix0d2luc0luZm86dHdpbnNJbXBvcnRSZXN1bHR9KVxyXG5cclxuICAgIHZhciByZWxhdGlvbnNJbXBvcnRSZXN1bHQ9YXdhaXQgdGhpcy5iYXRjaEltcG9ydFJlbGF0aW9ucyhpbXBvcnRSZWxhdGlvbnMpXHJcbiAgICBnbG9iYWxDYWNoZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzX2FwcGVuZChyZWxhdGlvbnNJbXBvcnRSZXN1bHQpXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJkcmF3QWxsUmVsYXRpb25zXCIsaW5mbzpyZWxhdGlvbnNJbXBvcnRSZXN1bHR9KVxyXG5cclxuICAgIHZhciBudW1PZlR3aW5zPXR3aW5zSW1wb3J0UmVzdWx0Lmxlbmd0aFxyXG4gICAgdmFyIG51bU9mUmVsYXRpb25zPXJlbGF0aW9uc0ltcG9ydFJlc3VsdC5sZW5ndGhcclxuICAgIHZhciBzdHI9XCJBZGQgXCIrbnVtT2ZUd2lucysgXCIgbm9kZVwiKygobnVtT2ZUd2luczw9MSk/XCJcIjpcInNcIikrXCIsIFwiK251bU9mUmVsYXRpb25zK1wiIHJlbGF0aW9uc2hpcFwiKygobnVtT2ZSZWxhdGlvbnM8PTEpP1wiXCI6XCJzXCIpXHJcbiAgICB2YXIgY29uZmlybURpYWxvZ0RpdiA9IG5ldyBzaW1wbGVDb25maXJtRGlhbG9nKClcclxuICAgIGNvbmZpcm1EaWFsb2dEaXYuc2hvdyhcclxuICAgICAgICB7IHdpZHRoOiBcIjIwMHB4XCIgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIkltcG9ydCBSZXN1bHRcIlxyXG4gICAgICAgICAgICAsIGNvbnRlbnQ6c3RyXHJcbiAgICAgICAgICAgICwgYnV0dG9uczogW1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtZ3JheVwiLCB0ZXh0OiBcIk9rXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfVxyXG4gICAgKVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmJhdGNoSW1wb3J0VHdpbnM9YXN5bmMgZnVuY3Rpb24odHdpbnMpe1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICBpZih0d2lucy5sZW5ndGg9PTApIHJlc29sdmUoW10pXHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICAkLnBvc3QoXCJlZGl0QURUL2JhdGNoSW1wb3J0VHdpbnNcIix7XCJ0d2luc1wiOkpTT04uc3RyaW5naWZ5KHR3aW5zKX0sIChkYXRhKT0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChkYXRhID09IFwiXCIpIGRhdGE9W11cclxuICAgICAgICAgICAgICAgIHJlc29sdmUoZGF0YSlcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfWNhdGNoKGUpe1xyXG4gICAgICAgICAgICByZWplY3QoZSlcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmJhdGNoSW1wb3J0UmVsYXRpb25zPWFzeW5jIGZ1bmN0aW9uKHJlbGF0aW9ucyl7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIGlmKHJlbGF0aW9ucy5sZW5ndGg9PTApIHJlc29sdmUoW10pXHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICAkLnBvc3QoXCJlZGl0QURUL2NyZWF0ZVJlbGF0aW9uc1wiLHtcImFjdGlvbnNcIjpKU09OLnN0cmluZ2lmeShyZWxhdGlvbnMpfSwgKGRhdGEpPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGRhdGEgPT0gXCJcIikgZGF0YT1bXVxyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShkYXRhKVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIHJlamVjdChlKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUucmVmcmVzaEluZm9tYXRpb249YXN5bmMgZnVuY3Rpb24oKXtcclxuICAgIHZhciB0d2luSURzPVtdXHJcbiAgICB0aGlzLnNlbGVjdGVkT2JqZWN0cy5mb3JFYWNoKG9uZUl0ZW09PnsgIGlmKG9uZUl0ZW1bJyRkdElkJ10pIHR3aW5JRHMucHVzaChvbmVJdGVtWyckZHRJZCddKSAgfSlcclxuICAgIHRyeXtcclxuICAgICAgICB2YXIgdHdpbnNkYXRhID0gYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vbGlzdFR3aW5zRm9ySURzXCIsIFwiUE9TVFwiLCB0d2luSURzKVxyXG4gICAgICAgIHR3aW5zZGF0YS5mb3JFYWNoKG9uZVJlPT57XHJcbiAgICAgICAgICAgIHZhciB0d2luSUQ9IG9uZVJlWyckZHRJZCddXHJcbiAgICAgICAgICAgIGlmKGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3R3aW5JRF0hPW51bGwpe1xyXG4gICAgICAgICAgICAgICAgZm9yKHZhciBpbmQgaW4gb25lUmUpICBnbG9iYWxDYWNoZS5zdG9yZVNpbmdsZUFEVFR3aW4ob25lUmVbaW5kXSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICB9XHJcblxyXG4gICAgd2hpbGUodHdpbklEcy5sZW5ndGg+MCl7XHJcbiAgICAgICAgdmFyIHNtYWxsQXJyPSB0d2luSURzLnNwbGljZSgwLCAxMDApO1xyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICAgdmFyIGRhdGEgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9nZXRSZWxhdGlvbnNoaXBzRnJvbVR3aW5JRHNcIiwgXCJQT1NUXCIsIHNtYWxsQXJyKVxyXG4gICAgICAgICAgICBpZiAoZGF0YSA9PSBcIlwiKSBjb250aW51ZTtcclxuICAgICAgICAgICAgZ2xvYmFsQ2FjaGUuc3RvcmVUd2luUmVsYXRpb25zaGlwcyhkYXRhKSAvL3N0b3JlIHRoZW0gaW4gZ2xvYmFsIGF2YWlsYWJsZSBhcnJheVxyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJkcmF3QWxsUmVsYXRpb25zXCIsIGluZm86IGRhdGEgfSlcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBpZih0aGlzLnNlbGVjdGVkT2JqZWN0cy5sZW5ndGg9PTEpIHRoaXMucnhNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwic2VsZWN0Tm9kZXNcIiwgaW5mbzogdGhpcy5zZWxlY3RlZE9iamVjdHMgfSlcclxuXHJcbn1cclxuXHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmRlbGV0ZVNlbGVjdGVkPWFzeW5jIGZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgYXJyPXRoaXMuc2VsZWN0ZWRPYmplY3RzO1xyXG4gICAgaWYoYXJyLmxlbmd0aD09MCkgcmV0dXJuO1xyXG4gICAgdmFyIHJlbGF0aW9uc0Fycj1bXVxyXG4gICAgdmFyIHR3aW5JREFycj1bXVxyXG4gICAgdmFyIHR3aW5JRHM9e31cclxuICAgIGFyci5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIGlmIChlbGVtZW50Wyckc291cmNlSWQnXSkgcmVsYXRpb25zQXJyLnB1c2goZWxlbWVudCk7XHJcbiAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgdHdpbklEQXJyLnB1c2goZWxlbWVudFsnJGR0SWQnXSlcclxuICAgICAgICAgICAgdHdpbklEc1tlbGVtZW50WyckZHRJZCddXT0xXHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBmb3IodmFyIGk9cmVsYXRpb25zQXJyLmxlbmd0aC0xO2k+PTA7aS0tKXsgLy9jbGVhciB0aG9zZSByZWxhdGlvbnNoaXBzIHRoYXQgYXJlIGdvaW5nIHRvIGJlIGRlbGV0ZWQgYWZ0ZXIgdHdpbnMgZGVsZXRpbmdcclxuICAgICAgICB2YXIgc3JjSWQ9ICByZWxhdGlvbnNBcnJbaV1bJyRzb3VyY2VJZCddXHJcbiAgICAgICAgdmFyIHRhcmdldElkID0gcmVsYXRpb25zQXJyW2ldWyckdGFyZ2V0SWQnXVxyXG4gICAgICAgIGlmKHR3aW5JRHNbc3JjSWRdIT1udWxsIHx8IHR3aW5JRHNbdGFyZ2V0SWRdIT1udWxsKXtcclxuICAgICAgICAgICAgcmVsYXRpb25zQXJyLnNwbGljZShpLDEpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdmFyIGNvbmZpcm1EaWFsb2dEaXYgPSBuZXcgc2ltcGxlQ29uZmlybURpYWxvZygpXHJcbiAgICB2YXIgZGlhbG9nU3RyPVwiXCJcclxuICAgIHZhciB0d2luTnVtYmVyPXR3aW5JREFyci5sZW5ndGg7XHJcbiAgICB2YXIgcmVsYXRpb25zTnVtYmVyID0gcmVsYXRpb25zQXJyLmxlbmd0aDtcclxuICAgIGlmKHR3aW5OdW1iZXI+MCkgZGlhbG9nU3RyID0gIHR3aW5OdW1iZXIrXCIgdHdpblwiKygodHdpbk51bWJlcj4xKT9cInNcIjpcIlwiKSArIFwiICh3aXRoIGNvbm5lY3RlZCByZWxhdGlvbnMpXCJcclxuICAgIGlmKHR3aW5OdW1iZXI+MCAmJiByZWxhdGlvbnNOdW1iZXI+MCkgZGlhbG9nU3RyKz1cIiBhbmQgYWRkaXRpb25hbCBcIlxyXG4gICAgaWYocmVsYXRpb25zTnVtYmVyPjApIGRpYWxvZ1N0ciArPSAgcmVsYXRpb25zTnVtYmVyK1wiIHJlbGF0aW9uXCIrKChyZWxhdGlvbnNOdW1iZXI+MSk/XCJzXCI6XCJcIiApXHJcbiAgICBkaWFsb2dTdHIrPVwiIHdpbGwgYmUgZGVsZXRlZC4gUGxlYXNlIGNvbmZpcm1cIlxyXG4gICAgY29uZmlybURpYWxvZ0Rpdi5zaG93KFxyXG4gICAgICAgIHsgd2lkdGg6IFwiMzUwcHhcIiB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGl0bGU6IFwiQ29uZmlybVwiXHJcbiAgICAgICAgICAgICwgY29udGVudDpkaWFsb2dTdHJcclxuICAgICAgICAgICAgLCBidXR0b25zOiBbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1yZWQgdzMtaG92ZXItcGlua1wiLCB0ZXh0OiBcIkNvbmZpcm1cIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHdpbklEQXJyLmxlbmd0aCA+IDApIHRoaXMuZGVsZXRlVHdpbnModHdpbklEQXJyKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVsYXRpb25zQXJyLmxlbmd0aCA+IDApIHRoaXMuZGVsZXRlUmVsYXRpb25zKHJlbGF0aW9uc0FycilcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuRE9NLmVtcHR5KClcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmF3QnV0dG9ucyhudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1ncmF5XCIsIHRleHQ6IFwiQ2FuY2VsXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfVxyXG4gICAgKVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmRlbGV0ZVR3aW5zPWFzeW5jIGZ1bmN0aW9uKHR3aW5JREFycil7ICAgXHJcbiAgICB3aGlsZSh0d2luSURBcnIubGVuZ3RoPjApe1xyXG4gICAgICAgIHZhciBzbWFsbEFycj0gdHdpbklEQXJyLnNwbGljZSgwLCAxMDApO1xyXG4gICAgICAgIHZhciByZXN1bHQ9YXdhaXQgdGhpcy5kZWxldGVQYXJ0aWFsVHdpbnMoc21hbGxBcnIpXHJcblxyXG4gICAgICAgIHJlc3VsdC5mb3JFYWNoKChvbmVJRCk9PntcclxuICAgICAgICAgICAgZGVsZXRlIGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW29uZUlEXVxyXG4gICAgICAgICAgICBkZWxldGUgZ2xvYmFsQ2FjaGUuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW29uZUlEXVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJ0d2luc0RlbGV0ZWRcIix0d2luSURBcnI6cmVzdWx0fSlcclxuICAgIH1cclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5kZWxldGVQYXJ0aWFsVHdpbnM9IGFzeW5jIGZ1bmN0aW9uKElEQXJyKXtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICAkLnBvc3QoXCJlZGl0QURUL2RlbGV0ZVR3aW5zXCIse2FycjpJREFycn0sIGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICBpZihkYXRhPT1cIlwiKSBkYXRhPVtdXHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKGRhdGEpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1jYXRjaChlKXtcclxuICAgICAgICAgICAgcmVqZWN0KGUpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufVxyXG5cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZGVsZXRlUmVsYXRpb25zPWFzeW5jIGZ1bmN0aW9uKHJlbGF0aW9uc0Fycil7XHJcbiAgICB2YXIgYXJyPVtdXHJcbiAgICByZWxhdGlvbnNBcnIuZm9yRWFjaChvbmVSZWxhdGlvbj0+e1xyXG4gICAgICAgIGFyci5wdXNoKHtzcmNJRDpvbmVSZWxhdGlvblsnJHNvdXJjZUlkJ10scmVsSUQ6b25lUmVsYXRpb25bJyRyZWxhdGlvbnNoaXBJZCddfSlcclxuICAgIH0pXHJcbiAgICAkLnBvc3QoXCJlZGl0QURUL2RlbGV0ZVJlbGF0aW9uc1wiLHtcInJlbGF0aW9uc1wiOmFycn0sICAoZGF0YSk9PiB7IFxyXG4gICAgICAgIGlmKGRhdGE9PVwiXCIpIGRhdGE9W107XHJcbiAgICAgICAgZ2xvYmFsQ2FjaGUuc3RvcmVUd2luUmVsYXRpb25zaGlwc19yZW1vdmUoZGF0YSlcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJyZWxhdGlvbnNEZWxldGVkXCIsXCJyZWxhdGlvbnNcIjpkYXRhfSlcclxuICAgIH0pO1xyXG4gICAgXHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuc2hvd091dEJvdW5kPWFzeW5jIGZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgYXJyPXRoaXMuc2VsZWN0ZWRPYmplY3RzO1xyXG4gICAgdmFyIHR3aW5JREFycj1bXVxyXG4gICAgYXJyLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgaWYgKGVsZW1lbnRbJyRzb3VyY2VJZCddKSByZXR1cm47XHJcbiAgICAgICAgdHdpbklEQXJyLnB1c2goZWxlbWVudFsnJGR0SWQnXSlcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICB3aGlsZSh0d2luSURBcnIubGVuZ3RoPjApe1xyXG4gICAgICAgIHZhciBzbWFsbEFyciA9IHR3aW5JREFyci5zcGxpY2UoMCwgMTAwKTtcclxuXHJcbiAgICAgICAgdmFyIGtub3duVGFyZ2V0VHdpbnMgPSB7fVxyXG4gICAgICAgIHNtYWxsQXJyLmZvckVhY2gob25lSUQgPT4ge1xyXG4gICAgICAgICAgICBrbm93blRhcmdldFR3aW5zW29uZUlEXSA9IDEgLy9pdHNlbGYgYWxzbyBpcyBrbm93blxyXG4gICAgICAgICAgICB2YXIgb3V0Qm91bmRSZWxhdGlvbiA9IGdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tvbmVJRF1cclxuICAgICAgICAgICAgaWYgKG91dEJvdW5kUmVsYXRpb24pIHtcclxuICAgICAgICAgICAgICAgIG91dEJvdW5kUmVsYXRpb24uZm9yRWFjaChvbmVSZWxhdGlvbiA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRhcmdldElEID0gb25lUmVsYXRpb25bXCIkdGFyZ2V0SWRcIl1cclxuICAgICAgICAgICAgICAgICAgICBpZiAoZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbdGFyZ2V0SURdICE9IG51bGwpIGtub3duVGFyZ2V0VHdpbnNbdGFyZ2V0SURdID0gMVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICAgdmFyIGRhdGEgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9xdWVyeU91dEJvdW5kXCIsIFwiUE9TVFwiLCAgeyBhcnI6IHNtYWxsQXJyLCBcImtub3duVGFyZ2V0c1wiOiBrbm93blRhcmdldFR3aW5zIH0pXHJcbiAgICAgICAgICAgIC8vbmV3IHR3aW4ncyByZWxhdGlvbnNoaXAgc2hvdWxkIGJlIHN0b3JlZCBhcyB3ZWxsXHJcbiAgICAgICAgICAgIGdsb2JhbENhY2hlLnN0b3JlVHdpblJlbGF0aW9uc2hpcHMoZGF0YS5uZXdUd2luUmVsYXRpb25zKVxyXG4gICAgICAgICAgICBkYXRhLmNoaWxkVHdpbnNBbmRSZWxhdGlvbnMuZm9yRWFjaChvbmVTZXQ9PntcclxuICAgICAgICAgICAgICAgIGZvcih2YXIgaW5kIGluIG9uZVNldC5jaGlsZFR3aW5zKXtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgb25lVHdpbj1vbmVTZXQuY2hpbGRUd2luc1tpbmRdXHJcbiAgICAgICAgICAgICAgICAgICAgZ2xvYmFsQ2FjaGUuc3RvcmVTaW5nbGVBRFRUd2luKG9uZVR3aW4pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImRyYXdUd2luc0FuZFJlbGF0aW9uc1wiLGluZm86ZGF0YX0pXHJcbiAgICAgICAgfWNhdGNoKGUpe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLnNob3dJbkJvdW5kPWFzeW5jIGZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgYXJyPXRoaXMuc2VsZWN0ZWRPYmplY3RzO1xyXG4gICAgdmFyIHR3aW5JREFycj1bXVxyXG4gICAgYXJyLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgaWYgKGVsZW1lbnRbJyRzb3VyY2VJZCddKSByZXR1cm47XHJcbiAgICAgICAgdHdpbklEQXJyLnB1c2goZWxlbWVudFsnJGR0SWQnXSlcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICB3aGlsZSh0d2luSURBcnIubGVuZ3RoPjApe1xyXG4gICAgICAgIHZhciBzbWFsbEFycj0gdHdpbklEQXJyLnNwbGljZSgwLCAxMDApO1xyXG4gICAgICAgIHZhciBrbm93blNvdXJjZVR3aW5zID0ge31cclxuICAgICAgICB2YXIgSUREaWN0ID0ge31cclxuICAgICAgICBzbWFsbEFyci5mb3JFYWNoKG9uZUlEID0+IHtcclxuICAgICAgICAgICAgSUREaWN0W29uZUlEXSA9IDFcclxuICAgICAgICAgICAga25vd25Tb3VyY2VUd2luc1tvbmVJRF0gPSAxIC8vaXRzZWxmIGFsc28gaXMga25vd25cclxuICAgICAgICB9KVxyXG4gICAgICAgIGZvciAodmFyIHR3aW5JRCBpbiBnbG9iYWxDYWNoZS5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHMpIHtcclxuICAgICAgICAgICAgdmFyIHJlbGF0aW9ucyA9IGdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1t0d2luSURdXHJcbiAgICAgICAgICAgIHJlbGF0aW9ucy5mb3JFYWNoKG9uZVJlbGF0aW9uID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciB0YXJnZXRJRCA9IG9uZVJlbGF0aW9uWyckdGFyZ2V0SWQnXVxyXG4gICAgICAgICAgICAgICAgdmFyIHNyY0lEID0gb25lUmVsYXRpb25bJyRzb3VyY2VJZCddXHJcbiAgICAgICAgICAgICAgICBpZiAoSUREaWN0W3RhcmdldElEXSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3NyY0lEXSAhPSBudWxsKSBrbm93blNvdXJjZVR3aW5zW3NyY0lEXSA9IDFcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICAgdmFyIGRhdGEgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9xdWVyeUluQm91bmRcIiwgXCJQT1NUXCIsICB7IGFycjogc21hbGxBcnIsIFwia25vd25Tb3VyY2VzXCI6IGtub3duU291cmNlVHdpbnMgfSlcclxuICAgICAgICAgICAgLy9uZXcgdHdpbidzIHJlbGF0aW9uc2hpcCBzaG91bGQgYmUgc3RvcmVkIGFzIHdlbGxcclxuICAgICAgICAgICAgZ2xvYmFsQ2FjaGUuc3RvcmVUd2luUmVsYXRpb25zaGlwcyhkYXRhLm5ld1R3aW5SZWxhdGlvbnMpXHJcbiAgICAgICAgICAgIGRhdGEuY2hpbGRUd2luc0FuZFJlbGF0aW9ucy5mb3JFYWNoKG9uZVNldD0+e1xyXG4gICAgICAgICAgICAgICAgZm9yKHZhciBpbmQgaW4gb25lU2V0LmNoaWxkVHdpbnMpe1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBvbmVUd2luPW9uZVNldC5jaGlsZFR3aW5zW2luZF1cclxuICAgICAgICAgICAgICAgICAgICBnbG9iYWxDYWNoZS5zdG9yZVNpbmdsZUFEVFR3aW4ob25lVHdpbilcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiZHJhd1R3aW5zQW5kUmVsYXRpb25zXCIsaW5mbzpkYXRhfSlcclxuICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZHJhd011bHRpcGxlT2JqPWZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgbnVtT2ZFZGdlID0gMDtcclxuICAgIHZhciBudW1PZk5vZGUgPSAwO1xyXG4gICAgdmFyIGFycj10aGlzLnNlbGVjdGVkT2JqZWN0cztcclxuICAgIGlmKGFycj09bnVsbCkgcmV0dXJuO1xyXG4gICAgYXJyLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgaWYgKGVsZW1lbnRbJyRzb3VyY2VJZCddKSBudW1PZkVkZ2UrK1xyXG4gICAgICAgIGVsc2UgbnVtT2ZOb2RlKytcclxuICAgIH0pO1xyXG4gICAgdmFyIHRleHREaXY9JChcIjxsYWJlbCBzdHlsZT0nZGlzcGxheTpibG9jazttYXJnaW4tdG9wOjEwcHgnPjwvbGFiZWw+XCIpXHJcbiAgICB0ZXh0RGl2LnRleHQobnVtT2ZOb2RlKyBcIiBub2RlXCIrKChudW1PZk5vZGU8PTEpP1wiXCI6XCJzXCIpK1wiLCBcIitudW1PZkVkZ2UrXCIgcmVsYXRpb25zaGlwXCIrKChudW1PZkVkZ2U8PTEpP1wiXCI6XCJzXCIpKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKHRleHREaXYpXHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZHJhd1N0YXRpY0luZm89ZnVuY3Rpb24ocGFyZW50LGpzb25JbmZvLHBhZGRpbmdUb3AsZm9udFNpemUpe1xyXG4gICAgZm9yKHZhciBpbmQgaW4ganNvbkluZm8pe1xyXG4gICAgICAgIHZhciBrZXlEaXY9ICQoXCI8bGFiZWwgc3R5bGU9J2Rpc3BsYXk6YmxvY2snPjxkaXYgY2xhc3M9J3czLWJvcmRlcicgc3R5bGU9J2JhY2tncm91bmQtY29sb3I6I2Y2ZjZmNjtkaXNwbGF5OmlubGluZTtwYWRkaW5nOi4xZW0gLjNlbSAuMWVtIC4zZW07bWFyZ2luLXJpZ2h0Oi4zZW0nPlwiK2luZCtcIjwvZGl2PjwvbGFiZWw+XCIpXHJcbiAgICAgICAga2V5RGl2LmNzcyh7XCJmb250U2l6ZVwiOmZvbnRTaXplLFwiY29sb3JcIjpcImRhcmtHcmF5XCJ9KVxyXG4gICAgICAgIHBhcmVudC5hcHBlbmQoa2V5RGl2KVxyXG4gICAgICAgIGtleURpdi5jc3MoXCJwYWRkaW5nLXRvcFwiLHBhZGRpbmdUb3ApXHJcblxyXG4gICAgICAgIHZhciBjb250ZW50RE9NPSQoXCI8bGFiZWw+PC9sYWJlbD5cIilcclxuICAgICAgICBpZih0eXBlb2YoanNvbkluZm9baW5kXSk9PT1cIm9iamVjdFwiKSB7XHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwiZGlzcGxheVwiLFwiYmxvY2tcIilcclxuICAgICAgICAgICAgY29udGVudERPTS5jc3MoXCJwYWRkaW5nLWxlZnRcIixcIjFlbVwiKVxyXG4gICAgICAgICAgICB0aGlzLmRyYXdTdGF0aWNJbmZvKGNvbnRlbnRET00sanNvbkluZm9baW5kXSxcIi41ZW1cIixmb250U2l6ZSlcclxuICAgICAgICB9ZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwicGFkZGluZy10b3BcIixcIi4yZW1cIilcclxuICAgICAgICAgICAgY29udGVudERPTS50ZXh0KGpzb25JbmZvW2luZF0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnRlbnRET00uY3NzKHtcImZvbnRTaXplXCI6Zm9udFNpemUsXCJjb2xvclwiOlwiYmxhY2tcIn0pXHJcbiAgICAgICAga2V5RGl2LmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgfVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmRyYXdFZGl0YWJsZT1mdW5jdGlvbihwYXJlbnQsanNvbkluZm8sb3JpZ2luRWxlbWVudEluZm8scGF0aEFycixpc05ld1R3aW4pe1xyXG4gICAgaWYoanNvbkluZm89PW51bGwpIHJldHVybjtcclxuICAgIGZvcih2YXIgaW5kIGluIGpzb25JbmZvKXtcclxuICAgICAgICB2YXIga2V5RGl2PSAkKFwiPGxhYmVsIHN0eWxlPSdkaXNwbGF5OmJsb2NrJz48ZGl2IHN0eWxlPSdkaXNwbGF5OmlubGluZTtwYWRkaW5nOi4xZW0gLjNlbSAuMWVtIC4zZW07IGZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6YmxhY2snPlwiK2luZCtcIjwvZGl2PjwvbGFiZWw+XCIpXHJcbiAgICAgICAgaWYoaXNOZXdUd2luKXtcclxuICAgICAgICAgICAgaWYoaW5kPT1cIiRkdElkXCIpIHtcclxuICAgICAgICAgICAgICAgIHBhcmVudC5wcmVwZW5kKGtleURpdilcclxuICAgICAgICAgICAgICAgIGtleURpdi5hdHRyKCdpZCcsJ05FV1RXSU5fSURMYWJlbCcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgcGFyZW50LmFwcGVuZChrZXlEaXYpXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHBhcmVudC5hcHBlbmQoa2V5RGl2KVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBrZXlEaXYuY3NzKFwicGFkZGluZy10b3BcIixcIi4zZW1cIikgXHJcblxyXG4gICAgICAgIHZhciBjb250ZW50RE9NPSQoXCI8bGFiZWwgc3R5bGU9J3BhZGRpbmctdG9wOi4yZW0nPjwvbGFiZWw+XCIpXHJcbiAgICAgICAgdmFyIG5ld1BhdGg9cGF0aEFyci5jb25jYXQoW2luZF0pXHJcbiAgICAgICAgaWYoQXJyYXkuaXNBcnJheShqc29uSW5mb1tpbmRdKSl7XHJcbiAgICAgICAgICAgIHRoaXMuZHJhd0Ryb3Bkb3duT3B0aW9uKGNvbnRlbnRET00sbmV3UGF0aCxqc29uSW5mb1tpbmRdLGlzTmV3VHdpbixvcmlnaW5FbGVtZW50SW5mbylcclxuICAgICAgICB9ZWxzZSBpZih0eXBlb2YoanNvbkluZm9baW5kXSk9PT1cIm9iamVjdFwiKSB7XHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwiZGlzcGxheVwiLFwiYmxvY2tcIilcclxuICAgICAgICAgICAgY29udGVudERPTS5jc3MoXCJwYWRkaW5nLWxlZnRcIixcIjFlbVwiKVxyXG4gICAgICAgICAgICB0aGlzLmRyYXdFZGl0YWJsZShjb250ZW50RE9NLGpzb25JbmZvW2luZF0sb3JpZ2luRWxlbWVudEluZm8sbmV3UGF0aCxpc05ld1R3aW4pXHJcbiAgICAgICAgfWVsc2Uge1xyXG4gICAgICAgICAgICB2YXIgYUlucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwicGFkZGluZzoycHg7d2lkdGg6NTAlO291dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZVwiIHBsYWNlaG9sZGVyPVwidHlwZTogJytqc29uSW5mb1tpbmRdKydcIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dCB3My1ib3JkZXJcIik7ICBcclxuICAgICAgICAgICAgY29udGVudERPTS5hcHBlbmQoYUlucHV0KVxyXG4gICAgICAgICAgICB2YXIgdmFsPXRoaXMuc2VhcmNoVmFsdWUob3JpZ2luRWxlbWVudEluZm8sbmV3UGF0aClcclxuICAgICAgICAgICAgaWYodmFsIT1udWxsKSBhSW5wdXQudmFsKHZhbClcclxuICAgICAgICAgICAgYUlucHV0LmRhdGEoXCJwYXRoXCIsIG5ld1BhdGgpXHJcbiAgICAgICAgICAgIGFJbnB1dC5kYXRhKFwiZGF0YVR5cGVcIiwganNvbkluZm9baW5kXSlcclxuICAgICAgICAgICAgYUlucHV0LmNoYW5nZSgoZSk9PntcclxuICAgICAgICAgICAgICAgIHRoaXMuZWRpdERUUHJvcGVydHkob3JpZ2luRWxlbWVudEluZm8sJChlLnRhcmdldCkuZGF0YShcInBhdGhcIiksJChlLnRhcmdldCkudmFsKCksJChlLnRhcmdldCkuZGF0YShcImRhdGFUeXBlXCIpLGlzTmV3VHdpbilcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICAgICAga2V5RGl2LmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgfVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmRyYXdEcm9wZG93bk9wdGlvbj1mdW5jdGlvbihjb250ZW50RE9NLG5ld1BhdGgsdmFsdWVBcnIsaXNOZXdUd2luLG9yaWdpbkVsZW1lbnRJbmZvKXtcclxuICAgIHZhciBhU2VsZWN0TWVudT1uZXcgc2ltcGxlU2VsZWN0TWVudShcIlwiLHtidXR0b25DU1M6e1wicGFkZGluZ1wiOlwiNHB4IDE2cHhcIn19KVxyXG4gICAgY29udGVudERPTS5hcHBlbmQoYVNlbGVjdE1lbnUuRE9NKVxyXG4gICAgYVNlbGVjdE1lbnUuRE9NLmRhdGEoXCJwYXRoXCIsIG5ld1BhdGgpXHJcbiAgICB2YWx1ZUFyci5mb3JFYWNoKChvbmVPcHRpb24pPT57XHJcbiAgICAgICAgdmFyIHN0ciA9b25lT3B0aW9uW1wiZGlzcGxheU5hbWVcIl0gIHx8IG9uZU9wdGlvbltcImVudW1WYWx1ZVwiXSBcclxuICAgICAgICBhU2VsZWN0TWVudS5hZGRPcHRpb24oc3RyKVxyXG4gICAgfSlcclxuICAgIGFTZWxlY3RNZW51LmNhbGxCYWNrX2NsaWNrT3B0aW9uPShvcHRpb25UZXh0LG9wdGlvblZhbHVlLHJlYWxNb3VzZUNsaWNrKT0+e1xyXG4gICAgICAgIGFTZWxlY3RNZW51LmNoYW5nZU5hbWUob3B0aW9uVGV4dClcclxuICAgICAgICBpZihyZWFsTW91c2VDbGljaykgdGhpcy5lZGl0RFRQcm9wZXJ0eShvcmlnaW5FbGVtZW50SW5mbyxhU2VsZWN0TWVudS5ET00uZGF0YShcInBhdGhcIiksb3B0aW9uVmFsdWUsXCJzdHJpbmdcIixpc05ld1R3aW4pXHJcbiAgICB9XHJcbiAgICB2YXIgdmFsPXRoaXMuc2VhcmNoVmFsdWUob3JpZ2luRWxlbWVudEluZm8sbmV3UGF0aClcclxuICAgIGlmKHZhbCE9bnVsbCl7XHJcbiAgICAgICAgYVNlbGVjdE1lbnUudHJpZ2dlck9wdGlvblZhbHVlKHZhbClcclxuICAgIH0gICAgXHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZWRpdERUUHJvcGVydHk9YXN5bmMgZnVuY3Rpb24ob3JpZ2luRWxlbWVudEluZm8scGF0aCxuZXdWYWwsZGF0YVR5cGUsaXNOZXdUd2luKXtcclxuICAgIGlmKFtcImRvdWJsZVwiLFwiYm9vbGVhblwiLFwiZmxvYXRcIixcImludGVnZXJcIixcImxvbmdcIl0uaW5jbHVkZXMoZGF0YVR5cGUpKSBuZXdWYWw9TnVtYmVyKG5ld1ZhbClcclxuXHJcbiAgICAvL3sgXCJvcFwiOiBcImFkZFwiLCBcInBhdGhcIjogXCIveFwiLCBcInZhbHVlXCI6IDMwIH1cclxuICAgIGlmKGlzTmV3VHdpbil7XHJcbiAgICAgICAgdGhpcy51cGRhdGVPcmlnaW5PYmplY3RWYWx1ZShvcmlnaW5FbGVtZW50SW5mbyxwYXRoLG5ld1ZhbClcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBpZihwYXRoLmxlbmd0aD09MSl7XHJcbiAgICAgICAgdmFyIHN0cj1cIlwiXHJcbiAgICAgICAgcGF0aC5mb3JFYWNoKHNlZ21lbnQ9PntzdHIrPVwiL1wiK3NlZ21lbnR9KVxyXG4gICAgICAgIHZhciBqc29uUGF0Y2g9WyB7IFwib3BcIjogXCJhZGRcIiwgXCJwYXRoXCI6IHN0ciwgXCJ2YWx1ZVwiOiBuZXdWYWx9IF1cclxuICAgIH1lbHNle1xyXG4gICAgICAgIC8vaXQgaXMgYSBwcm9wZXJ0eSBpbnNpZGUgYSBvYmplY3QgdHlwZSBvZiByb290IHByb3BlcnR5LHVwZGF0ZSB0aGUgd2hvbGUgcm9vdCBwcm9wZXJ0eVxyXG4gICAgICAgIHZhciByb290UHJvcGVydHk9cGF0aFswXVxyXG4gICAgICAgIHZhciBwYXRjaFZhbHVlPSBvcmlnaW5FbGVtZW50SW5mb1tyb290UHJvcGVydHldXHJcbiAgICAgICAgaWYocGF0Y2hWYWx1ZT09bnVsbCkgcGF0Y2hWYWx1ZT17fVxyXG4gICAgICAgIGVsc2UgcGF0Y2hWYWx1ZT1KU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHBhdGNoVmFsdWUpKSAvL21ha2UgYSBjb3B5XHJcbiAgICAgICAgdGhpcy51cGRhdGVPcmlnaW5PYmplY3RWYWx1ZShwYXRjaFZhbHVlLHBhdGguc2xpY2UoMSksbmV3VmFsKVxyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBqc29uUGF0Y2g9WyB7IFwib3BcIjogXCJhZGRcIiwgXCJwYXRoXCI6IFwiL1wiK3Jvb3RQcm9wZXJ0eSwgXCJ2YWx1ZVwiOiBwYXRjaFZhbHVlfSBdXHJcbiAgICB9XHJcblxyXG4gICAgaWYob3JpZ2luRWxlbWVudEluZm9bXCIkZHRJZFwiXSl7IC8vZWRpdCBhIG5vZGUgcHJvcGVydHlcclxuICAgICAgICB2YXIgdHdpbklEID0gb3JpZ2luRWxlbWVudEluZm9bXCIkZHRJZFwiXVxyXG4gICAgICAgIHZhciBwYXlMb2FkPXtcImpzb25QYXRjaFwiOkpTT04uc3RyaW5naWZ5KGpzb25QYXRjaCksXCJ0d2luSURcIjp0d2luSUR9XHJcbiAgICB9ZWxzZSBpZihvcmlnaW5FbGVtZW50SW5mb1tcIiRyZWxhdGlvbnNoaXBJZFwiXSl7IC8vZWRpdCBhIHJlbGF0aW9uc2hpcCBwcm9wZXJ0eVxyXG4gICAgICAgIHZhciB0d2luSUQgPSBvcmlnaW5FbGVtZW50SW5mb1tcIiRzb3VyY2VJZFwiXVxyXG4gICAgICAgIHZhciByZWxhdGlvbnNoaXBJRCA9IG9yaWdpbkVsZW1lbnRJbmZvW1wiJHJlbGF0aW9uc2hpcElkXCJdXHJcbiAgICAgICAgdmFyIHBheUxvYWQ9e1wianNvblBhdGNoXCI6SlNPTi5zdHJpbmdpZnkoanNvblBhdGNoKSxcInR3aW5JRFwiOnR3aW5JRCxcInJlbGF0aW9uc2hpcElEXCI6cmVsYXRpb25zaGlwSUR9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIFxyXG4gICAgdHJ5e1xyXG4gICAgICAgIGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2NoYW5nZUF0dHJpYnV0ZVwiLCBcIlBPU1RcIiwgcGF5TG9hZClcclxuICAgICAgICB0aGlzLnVwZGF0ZU9yaWdpbk9iamVjdFZhbHVlKG9yaWdpbkVsZW1lbnRJbmZvLHBhdGgsbmV3VmFsKVxyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgfVxyXG4gICAgXHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUudXBkYXRlT3JpZ2luT2JqZWN0VmFsdWU9ZnVuY3Rpb24obm9kZUluZm8scGF0aEFycixuZXdWYWwpe1xyXG4gICAgaWYocGF0aEFyci5sZW5ndGg9PTApIHJldHVybjtcclxuICAgIHZhciB0aGVKc29uPW5vZGVJbmZvXHJcbiAgICBmb3IodmFyIGk9MDtpPHBhdGhBcnIubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIGtleT1wYXRoQXJyW2ldXHJcblxyXG4gICAgICAgIGlmKGk9PXBhdGhBcnIubGVuZ3RoLTEpe1xyXG4gICAgICAgICAgICB0aGVKc29uW2tleV09bmV3VmFsXHJcbiAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKHRoZUpzb25ba2V5XT09bnVsbCkgdGhlSnNvbltrZXldPXt9XHJcbiAgICAgICAgdGhlSnNvbj10aGVKc29uW2tleV1cclxuICAgIH1cclxuICAgIHJldHVyblxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLnNlYXJjaFZhbHVlPWZ1bmN0aW9uKG9yaWdpbkVsZW1lbnRJbmZvLHBhdGhBcnIpe1xyXG4gICAgaWYocGF0aEFyci5sZW5ndGg9PTApIHJldHVybiBudWxsO1xyXG4gICAgdmFyIHRoZUpzb249b3JpZ2luRWxlbWVudEluZm9cclxuICAgIGZvcih2YXIgaT0wO2k8cGF0aEFyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIga2V5PXBhdGhBcnJbaV1cclxuICAgICAgICB0aGVKc29uPXRoZUpzb25ba2V5XVxyXG4gICAgICAgIGlmKHRoZUpzb249PW51bGwpIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoZUpzb24gLy9pdCBzaG91bGQgYmUgdGhlIGZpbmFsIHZhbHVlXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IGluZm9QYW5lbCgpOyIsImNvbnN0IHN0YXJ0U2VsZWN0aW9uRGlhbG9nID0gcmVxdWlyZShcIi4vc3RhcnRTZWxlY3Rpb25EaWFsb2dcIilcclxuY29uc3QgbW9kZWxNYW5hZ2VyRGlhbG9nID0gcmVxdWlyZShcIi4vbW9kZWxNYW5hZ2VyRGlhbG9nXCIpXHJcbmNvbnN0IGVkaXRMYXlvdXREaWFsb2c9IHJlcXVpcmUoXCIuL2VkaXRMYXlvdXREaWFsb2dcIilcclxuY29uc3Qgc2ltcGxlU2VsZWN0TWVudT0gcmVxdWlyZShcIi4vc2ltcGxlU2VsZWN0TWVudVwiKVxyXG5cclxuXHJcbmZ1bmN0aW9uIG1haW5Ub29sYmFyKCkge1xyXG59XHJcblxyXG5tYWluVG9vbGJhci5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgJChcIiNtYWluVG9vbEJhclwiKS5hZGRDbGFzcyhcInczLWJhciB3My1yZWRcIilcclxuICAgICQoXCIjbWFpblRvb2xCYXJcIikuY3NzKHtcInotaW5kZXhcIjoxMDAsXCJvdmVyZmxvd1wiOlwidmlzaWJsZVwifSlcclxuXHJcbiAgICB0aGlzLnN3aXRjaEFEVEluc3RhbmNlQnRuPSQoJzxhIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uXCIgaHJlZj1cIiNcIj5Tb3VyY2U8L2E+JylcclxuICAgIHRoaXMubW9kZWxJT0J0bj0kKCc8YSBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvblwiIGhyZWY9XCIjXCI+TW9kZWxzPC9hPicpXHJcbiAgICB0aGlzLnNob3dGb3JnZVZpZXdCdG49JCgnPGEgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtaG92ZXItbm9uZSB3My10ZXh0LWxpZ2h0LWdyZXkgdzMtaG92ZXItdGV4dC1saWdodC1ncmV5XCIgc3R5bGU9XCJvcGFjaXR5Oi4zNVwiIGhyZWY9XCIjXCI+Rm9yZ2VWaWV3PC9hPicpXHJcbiAgICB0aGlzLnNob3dHSVNWaWV3QnRuPSQoJzxhIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWhvdmVyLW5vbmUgdzMtdGV4dC1saWdodC1ncmV5IHczLWhvdmVyLXRleHQtbGlnaHQtZ3JleVwiIHN0eWxlPVwib3BhY2l0eTouMzVcIiBocmVmPVwiI1wiPkdJU1ZpZXc8L2E+JylcclxuICAgIHRoaXMuZWRpdExheW91dEJ0bj0kKCc8YSBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvblwiIGhyZWY9XCIjXCI+PGkgY2xhc3M9XCJmYSBmYS1lZGl0XCI+PC9pPjwvYT4nKVxyXG5cclxuXHJcbiAgICB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yPW5ldyBzaW1wbGVTZWxlY3RNZW51KFwiTGF5b3V0XCIpXHJcblxyXG4gICAgJChcIiNtYWluVG9vbEJhclwiKS5lbXB0eSgpXHJcbiAgICAkKFwiI21haW5Ub29sQmFyXCIpLmFwcGVuZCh0aGlzLnN3aXRjaEFEVEluc3RhbmNlQnRuLHRoaXMubW9kZWxJT0J0bix0aGlzLnNob3dGb3JnZVZpZXdCdG4sdGhpcy5zaG93R0lTVmlld0J0blxyXG4gICAgICAgICx0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLkRPTSx0aGlzLmVkaXRMYXlvdXRCdG4pXHJcblxyXG4gICAgdGhpcy5zd2l0Y2hBRFRJbnN0YW5jZUJ0bi5vbihcImNsaWNrXCIsKCk9Pnsgc3RhcnRTZWxlY3Rpb25EaWFsb2cucG9wdXAoKSB9KVxyXG4gICAgdGhpcy5tb2RlbElPQnRuLm9uKFwiY2xpY2tcIiwoKT0+eyBtb2RlbE1hbmFnZXJEaWFsb2cucG9wdXAoKSB9KVxyXG4gICAgdGhpcy5lZGl0TGF5b3V0QnRuLm9uKFwiY2xpY2tcIiwoKT0+eyBlZGl0TGF5b3V0RGlhbG9nLnBvcHVwKCkgfSlcclxuXHJcblxyXG4gICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jYWxsQmFja19jbGlja09wdGlvbj0ob3B0aW9uVGV4dCxvcHRpb25WYWx1ZSk9PntcclxuICAgICAgICBnbG9iYWxDYWNoZS5jdXJyZW50TGF5b3V0TmFtZT1vcHRpb25WYWx1ZVxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImxheW91dENoYW5nZVwifSlcclxuICAgICAgICBpZihvcHRpb25WYWx1ZT09XCJbTkFdXCIpIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuY2hhbmdlTmFtZShcIkxheW91dFwiLFwiXCIpXHJcbiAgICAgICAgZWxzZSB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmNoYW5nZU5hbWUoXCJMYXlvdXQ6XCIsb3B0aW9uVGV4dClcclxuICAgIH1cclxufVxyXG5cclxubWFpblRvb2xiYXIucHJvdG90eXBlLnVwZGF0ZUxheW91dFNlbGVjdG9yID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGN1clNlbGVjdD10aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmN1clNlbGVjdFZhbFxyXG4gICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jbGVhck9wdGlvbnMoKVxyXG4gICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5hZGRPcHRpb24oJ1tObyBMYXlvdXQgU3BlY2lmaWVkXScsJ1tOQV0nKVxyXG5cclxuICAgIGZvciAodmFyIGluZCBpbiBnbG9iYWxDYWNoZS5sYXlvdXRKU09OKSB7XHJcbiAgICAgICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5hZGRPcHRpb24oaW5kKVxyXG4gICAgfVxyXG5cclxuICAgIGlmKGN1clNlbGVjdCE9bnVsbCAmJiB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmZpbmRPcHRpb24oY3VyU2VsZWN0KT09bnVsbCkgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jaGFuZ2VOYW1lKFwiTGF5b3V0XCIsXCJcIilcclxufVxyXG5cclxubWFpblRvb2xiYXIucHJvdG90eXBlLnJ4TWVzc2FnZT1mdW5jdGlvbihtc2dQYXlsb2FkKXtcclxuICAgIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJsYXlvdXRzVXBkYXRlZFwiKSB7XHJcbiAgICAgICAgdGhpcy51cGRhdGVMYXlvdXRTZWxlY3RvcigpXHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IG1haW5Ub29sYmFyKCk7IiwiLy9UaGlzIGlzIGEgc2luZ2xldG9uIGNsYXNzXHJcblxyXG5mdW5jdGlvbiBtb2RlbEFuYWx5emVyKCl7XHJcbiAgICB0aGlzLkRURExNb2RlbHM9e31cclxuICAgIHRoaXMucmVsYXRpb25zaGlwVHlwZXM9e31cclxufVxyXG5cclxubW9kZWxBbmFseXplci5wcm90b3R5cGUuY2xlYXJBbGxNb2RlbHM9ZnVuY3Rpb24oKXtcclxuICAgIC8vY29uc29sZS5sb2coXCJjbGVhciBhbGwgbW9kZWwgaW5mb1wiKVxyXG4gICAgZm9yKHZhciBpZCBpbiB0aGlzLkRURExNb2RlbHMpIGRlbGV0ZSB0aGlzLkRURExNb2RlbHNbaWRdXHJcbn1cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLnJlc2V0QWxsTW9kZWxzPWZ1bmN0aW9uKGFycil7XHJcbiAgICBmb3IodmFyIG1vZGVsSUQgaW4gdGhpcy5EVERMTW9kZWxzKXtcclxuICAgICAgICB2YXIganNvblN0cj10aGlzLkRURExNb2RlbHNbbW9kZWxJRF1bXCJvcmlnaW5hbFwiXVxyXG4gICAgICAgIHRoaXMuRFRETE1vZGVsc1ttb2RlbElEXT1KU09OLnBhcnNlKGpzb25TdHIpXHJcbiAgICAgICAgdGhpcy5EVERMTW9kZWxzW21vZGVsSURdW1wib3JpZ2luYWxcIl09anNvblN0clxyXG4gICAgfVxyXG59XHJcblxyXG5cclxubW9kZWxBbmFseXplci5wcm90b3R5cGUuYWRkTW9kZWxzPWZ1bmN0aW9uKGFycil7XHJcbiAgICBhcnIuZm9yRWFjaCgoZWxlKT0+e1xyXG4gICAgICAgIHZhciBtb2RlbElEPSBlbGVbXCJAaWRcIl1cclxuICAgICAgICBlbGVbXCJvcmlnaW5hbFwiXT1KU09OLnN0cmluZ2lmeShlbGUpXHJcbiAgICAgICAgdGhpcy5EVERMTW9kZWxzW21vZGVsSURdPWVsZVxyXG4gICAgfSlcclxufVxyXG5cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLnJlY29yZEFsbEJhc2VDbGFzc2VzPSBmdW5jdGlvbiAocGFyZW50T2JqLCBiYXNlQ2xhc3NJRCkge1xyXG4gICAgdmFyIGJhc2VDbGFzcyA9IHRoaXMuRFRETE1vZGVsc1tiYXNlQ2xhc3NJRF1cclxuICAgIGlmIChiYXNlQ2xhc3MgPT0gbnVsbCkgcmV0dXJuO1xyXG5cclxuICAgIHBhcmVudE9ialtiYXNlQ2xhc3NJRF09MVxyXG5cclxuICAgIHZhciBmdXJ0aGVyQmFzZUNsYXNzSURzID0gYmFzZUNsYXNzLmV4dGVuZHM7XHJcbiAgICBpZiAoZnVydGhlckJhc2VDbGFzc0lEcyA9PSBudWxsKSByZXR1cm47XHJcbiAgICBpZihBcnJheS5pc0FycmF5KGZ1cnRoZXJCYXNlQ2xhc3NJRHMpKSB2YXIgdG1wQXJyPWZ1cnRoZXJCYXNlQ2xhc3NJRHNcclxuICAgIGVsc2UgdG1wQXJyPVtmdXJ0aGVyQmFzZUNsYXNzSURzXVxyXG4gICAgdG1wQXJyLmZvckVhY2goKGVhY2hCYXNlKSA9PiB7IHRoaXMucmVjb3JkQWxsQmFzZUNsYXNzZXMocGFyZW50T2JqLCBlYWNoQmFzZSkgfSlcclxufVxyXG5cclxubW9kZWxBbmFseXplci5wcm90b3R5cGUuZXhwYW5kRWRpdGFibGVQcm9wZXJ0aWVzRnJvbUJhc2VDbGFzcyA9IGZ1bmN0aW9uIChwYXJlbnRPYmosIGJhc2VDbGFzc0lEKSB7XHJcbiAgICB2YXIgYmFzZUNsYXNzID0gdGhpcy5EVERMTW9kZWxzW2Jhc2VDbGFzc0lEXVxyXG4gICAgaWYgKGJhc2VDbGFzcyA9PSBudWxsKSByZXR1cm47XHJcbiAgICBpZiAoYmFzZUNsYXNzLmVkaXRhYmxlUHJvcGVydGllcykge1xyXG4gICAgICAgIGZvciAodmFyIGluZCBpbiBiYXNlQ2xhc3MuZWRpdGFibGVQcm9wZXJ0aWVzKSBwYXJlbnRPYmpbaW5kXSA9IGJhc2VDbGFzcy5lZGl0YWJsZVByb3BlcnRpZXNbaW5kXVxyXG4gICAgfVxyXG4gICAgdmFyIGZ1cnRoZXJCYXNlQ2xhc3NJRHMgPSBiYXNlQ2xhc3MuZXh0ZW5kcztcclxuICAgIGlmIChmdXJ0aGVyQmFzZUNsYXNzSURzID09IG51bGwpIHJldHVybjtcclxuICAgIGlmKEFycmF5LmlzQXJyYXkoZnVydGhlckJhc2VDbGFzc0lEcykpIHZhciB0bXBBcnI9ZnVydGhlckJhc2VDbGFzc0lEc1xyXG4gICAgZWxzZSB0bXBBcnI9W2Z1cnRoZXJCYXNlQ2xhc3NJRHNdXHJcbiAgICB0bXBBcnIuZm9yRWFjaCgoZWFjaEJhc2UpID0+IHsgdGhpcy5leHBhbmRFZGl0YWJsZVByb3BlcnRpZXNGcm9tQmFzZUNsYXNzKHBhcmVudE9iaiwgZWFjaEJhc2UpIH0pXHJcbn1cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLmV4cGFuZFZhbGlkUmVsYXRpb25zaGlwVHlwZXNGcm9tQmFzZUNsYXNzID0gZnVuY3Rpb24gKHBhcmVudE9iaiwgYmFzZUNsYXNzSUQpIHtcclxuICAgIHZhciBiYXNlQ2xhc3MgPSB0aGlzLkRURExNb2RlbHNbYmFzZUNsYXNzSURdXHJcbiAgICBpZiAoYmFzZUNsYXNzID09IG51bGwpIHJldHVybjtcclxuICAgIGlmIChiYXNlQ2xhc3MudmFsaWRSZWxhdGlvbnNoaXBzKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaW5kIGluIGJhc2VDbGFzcy52YWxpZFJlbGF0aW9uc2hpcHMpIHtcclxuICAgICAgICAgICAgaWYocGFyZW50T2JqW2luZF09PW51bGwpIHBhcmVudE9ialtpbmRdID0gdGhpcy5yZWxhdGlvbnNoaXBUeXBlc1tpbmRdW2Jhc2VDbGFzc0lEXVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHZhciBmdXJ0aGVyQmFzZUNsYXNzSURzID0gYmFzZUNsYXNzLmV4dGVuZHM7XHJcbiAgICBpZiAoZnVydGhlckJhc2VDbGFzc0lEcyA9PSBudWxsKSByZXR1cm47XHJcbiAgICBpZihBcnJheS5pc0FycmF5KGZ1cnRoZXJCYXNlQ2xhc3NJRHMpKSB2YXIgdG1wQXJyPWZ1cnRoZXJCYXNlQ2xhc3NJRHNcclxuICAgIGVsc2UgdG1wQXJyPVtmdXJ0aGVyQmFzZUNsYXNzSURzXVxyXG4gICAgdG1wQXJyLmZvckVhY2goKGVhY2hCYXNlKSA9PiB7IHRoaXMuZXhwYW5kVmFsaWRSZWxhdGlvbnNoaXBUeXBlc0Zyb21CYXNlQ2xhc3MocGFyZW50T2JqLCBlYWNoQmFzZSkgfSlcclxufVxyXG5cclxubW9kZWxBbmFseXplci5wcm90b3R5cGUuZXhwYW5kRWRpdGFibGVQcm9wZXJ0aWVzPWZ1bmN0aW9uKHBhcmVudE9iaixkYXRhSW5mbyxlbWJlZGRlZFNjaGVtYSl7XHJcbiAgICBkYXRhSW5mby5mb3JFYWNoKChvbmVDb250ZW50KT0+e1xyXG4gICAgICAgIGlmKG9uZUNvbnRlbnRbXCJAdHlwZVwiXT09XCJSZWxhdGlvbnNoaXBcIikgcmV0dXJuO1xyXG4gICAgICAgIGlmKG9uZUNvbnRlbnRbXCJAdHlwZVwiXT09XCJQcm9wZXJ0eVwiXHJcbiAgICAgICAgfHwoQXJyYXkuaXNBcnJheShvbmVDb250ZW50W1wiQHR5cGVcIl0pICYmIG9uZUNvbnRlbnRbXCJAdHlwZVwiXS5pbmNsdWRlcyhcIlByb3BlcnR5XCIpKVxyXG4gICAgICAgIHx8IG9uZUNvbnRlbnRbXCJAdHlwZVwiXT09bnVsbCkge1xyXG4gICAgICAgICAgICBpZih0eXBlb2Yob25lQ29udGVudFtcInNjaGVtYVwiXSkgIT0gJ29iamVjdCcgJiYgZW1iZWRkZWRTY2hlbWFbb25lQ29udGVudFtcInNjaGVtYVwiXV0hPW51bGwpIG9uZUNvbnRlbnRbXCJzY2hlbWFcIl09ZW1iZWRkZWRTY2hlbWFbb25lQ29udGVudFtcInNjaGVtYVwiXV1cclxuXHJcbiAgICAgICAgICAgIGlmKHR5cGVvZihvbmVDb250ZW50W1wic2NoZW1hXCJdKSA9PT0gJ29iamVjdCcgJiYgb25lQ29udGVudFtcInNjaGVtYVwiXVtcIkB0eXBlXCJdPT1cIk9iamVjdFwiKXtcclxuICAgICAgICAgICAgICAgIHZhciBuZXdQYXJlbnQ9e31cclxuICAgICAgICAgICAgICAgIHBhcmVudE9ialtvbmVDb250ZW50W1wibmFtZVwiXV09bmV3UGFyZW50XHJcbiAgICAgICAgICAgICAgICB0aGlzLmV4cGFuZEVkaXRhYmxlUHJvcGVydGllcyhuZXdQYXJlbnQsb25lQ29udGVudFtcInNjaGVtYVwiXVtcImZpZWxkc1wiXSxlbWJlZGRlZFNjaGVtYSlcclxuICAgICAgICAgICAgfWVsc2UgaWYodHlwZW9mKG9uZUNvbnRlbnRbXCJzY2hlbWFcIl0pID09PSAnb2JqZWN0JyAmJiBvbmVDb250ZW50W1wic2NoZW1hXCJdW1wiQHR5cGVcIl09PVwiRW51bVwiKXtcclxuICAgICAgICAgICAgICAgIHBhcmVudE9ialtvbmVDb250ZW50W1wibmFtZVwiXV09b25lQ29udGVudFtcInNjaGVtYVwiXVtcImVudW1WYWx1ZXNcIl1cclxuICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnRPYmpbb25lQ29udGVudFtcIm5hbWVcIl1dPW9uZUNvbnRlbnRbXCJzY2hlbWFcIl1cclxuICAgICAgICAgICAgfSAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufVxyXG5cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLmFuYWx5emU9ZnVuY3Rpb24oKXtcclxuICAgIC8vY29uc29sZS5sb2coXCJhbmFseXplIG1vZGVsIGluZm9cIilcclxuICAgIC8vYW5hbHl6ZSBhbGwgcmVsYXRpb25zaGlwIHR5cGVzXHJcbiAgICBmb3IgKHZhciBpZCBpbiB0aGlzLnJlbGF0aW9uc2hpcFR5cGVzKSBkZWxldGUgdGhpcy5yZWxhdGlvbnNoaXBUeXBlc1tpZF1cclxuICAgIGZvciAodmFyIG1vZGVsSUQgaW4gdGhpcy5EVERMTW9kZWxzKSB7XHJcbiAgICAgICAgdmFyIGVsZSA9IHRoaXMuRFRETE1vZGVsc1ttb2RlbElEXVxyXG4gICAgICAgIHZhciBlbWJlZGRlZFNjaGVtYSA9IHt9XHJcbiAgICAgICAgaWYgKGVsZS5zY2hlbWFzKSB7XHJcbiAgICAgICAgICAgIHZhciB0ZW1wQXJyO1xyXG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShlbGUuc2NoZW1hcykpIHRlbXBBcnIgPSBlbGUuc2NoZW1hc1xyXG4gICAgICAgICAgICBlbHNlIHRlbXBBcnIgPSBbZWxlLnNjaGVtYXNdXHJcbiAgICAgICAgICAgIHRlbXBBcnIuZm9yRWFjaCgoZWxlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBlbWJlZGRlZFNjaGVtYVtlbGVbXCJAaWRcIl1dID0gZWxlXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgY29udGVudEFyciA9IGVsZS5jb250ZW50c1xyXG4gICAgICAgIGlmICghY29udGVudEFycikgY29udGludWU7XHJcbiAgICAgICAgY29udGVudEFyci5mb3JFYWNoKChvbmVDb250ZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChvbmVDb250ZW50W1wiQHR5cGVcIl0gPT0gXCJSZWxhdGlvbnNoaXBcIikge1xyXG4gICAgICAgICAgICAgICAgaWYoIXRoaXMucmVsYXRpb25zaGlwVHlwZXNbb25lQ29udGVudFtcIm5hbWVcIl1dKSB0aGlzLnJlbGF0aW9uc2hpcFR5cGVzW29uZUNvbnRlbnRbXCJuYW1lXCJdXT0ge31cclxuICAgICAgICAgICAgICAgIHRoaXMucmVsYXRpb25zaGlwVHlwZXNbb25lQ29udGVudFtcIm5hbWVcIl1dW21vZGVsSURdID0gb25lQ29udGVudFxyXG4gICAgICAgICAgICAgICAgb25lQ29udGVudC5lZGl0YWJsZVJlbGF0aW9uc2hpcFByb3BlcnRpZXMgPSB7fVxyXG4gICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkob25lQ29udGVudC5wcm9wZXJ0aWVzKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXhwYW5kRWRpdGFibGVQcm9wZXJ0aWVzKG9uZUNvbnRlbnQuZWRpdGFibGVSZWxhdGlvbnNoaXBQcm9wZXJ0aWVzLCBvbmVDb250ZW50LnByb3BlcnRpZXMsIGVtYmVkZGVkU2NoZW1hKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICAvL2FuYWx5emUgZWFjaCBtb2RlbCdzIHByb3BlcnR5IHRoYXQgY2FuIGJlIGVkaXRlZFxyXG4gICAgZm9yKHZhciBtb2RlbElEIGluIHRoaXMuRFRETE1vZGVscyl7IC8vZXhwYW5kIHBvc3NpYmxlIGVtYmVkZGVkIHNjaGVtYSB0byBlZGl0YWJsZVByb3BlcnRpZXMsIGFsc28gZXh0cmFjdCBwb3NzaWJsZSByZWxhdGlvbnNoaXAgdHlwZXMgZm9yIHRoaXMgbW9kZWxcclxuICAgICAgICB2YXIgZWxlPXRoaXMuRFRETE1vZGVsc1ttb2RlbElEXVxyXG4gICAgICAgIHZhciBlbWJlZGRlZFNjaGVtYT17fVxyXG4gICAgICAgIGlmKGVsZS5zY2hlbWFzKXtcclxuICAgICAgICAgICAgdmFyIHRlbXBBcnI7XHJcbiAgICAgICAgICAgIGlmKEFycmF5LmlzQXJyYXkoZWxlLnNjaGVtYXMpKSB0ZW1wQXJyPWVsZS5zY2hlbWFzXHJcbiAgICAgICAgICAgIGVsc2UgdGVtcEFycj1bZWxlLnNjaGVtYXNdXHJcbiAgICAgICAgICAgIHRlbXBBcnIuZm9yRWFjaCgoZWxlKT0+e1xyXG4gICAgICAgICAgICAgICAgZW1iZWRkZWRTY2hlbWFbZWxlW1wiQGlkXCJdXT1lbGVcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxlLmVkaXRhYmxlUHJvcGVydGllcz17fVxyXG4gICAgICAgIGVsZS52YWxpZFJlbGF0aW9uc2hpcHM9e31cclxuICAgICAgICBlbGUuaW5jbHVkZWRDb21wb25lbnRzPVtdXHJcbiAgICAgICAgZWxlLmFsbEJhc2VDbGFzc2VzPXt9XHJcbiAgICAgICAgaWYoQXJyYXkuaXNBcnJheShlbGUuY29udGVudHMpKXtcclxuICAgICAgICAgICAgdGhpcy5leHBhbmRFZGl0YWJsZVByb3BlcnRpZXMoZWxlLmVkaXRhYmxlUHJvcGVydGllcyxlbGUuY29udGVudHMsZW1iZWRkZWRTY2hlbWEpXHJcblxyXG4gICAgICAgICAgICBlbGUuY29udGVudHMuZm9yRWFjaCgob25lQ29udGVudCk9PntcclxuICAgICAgICAgICAgICAgIGlmKG9uZUNvbnRlbnRbXCJAdHlwZVwiXT09XCJSZWxhdGlvbnNoaXBcIikge1xyXG4gICAgICAgICAgICAgICAgICAgIGVsZS52YWxpZFJlbGF0aW9uc2hpcHNbb25lQ29udGVudFtcIm5hbWVcIl1dPXRoaXMucmVsYXRpb25zaGlwVHlwZXNbb25lQ29udGVudFtcIm5hbWVcIl1dW21vZGVsSURdXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZvcih2YXIgbW9kZWxJRCBpbiB0aGlzLkRURExNb2RlbHMpey8vZXhwYW5kIGNvbXBvbmVudCBwcm9wZXJ0aWVzXHJcbiAgICAgICAgdmFyIGVsZT10aGlzLkRURExNb2RlbHNbbW9kZWxJRF1cclxuICAgICAgICBpZihBcnJheS5pc0FycmF5KGVsZS5jb250ZW50cykpe1xyXG4gICAgICAgICAgICBlbGUuY29udGVudHMuZm9yRWFjaChvbmVDb250ZW50PT57XHJcbiAgICAgICAgICAgICAgICBpZihvbmVDb250ZW50W1wiQHR5cGVcIl09PVwiQ29tcG9uZW50XCIpe1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjb21wb25lbnROYW1lPW9uZUNvbnRlbnRbXCJuYW1lXCJdXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvbXBvbmVudENsYXNzPW9uZUNvbnRlbnRbXCJzY2hlbWFcIl1cclxuICAgICAgICAgICAgICAgICAgICBlbGUuZWRpdGFibGVQcm9wZXJ0aWVzW2NvbXBvbmVudE5hbWVdPXt9XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5leHBhbmRFZGl0YWJsZVByb3BlcnRpZXNGcm9tQmFzZUNsYXNzKGVsZS5lZGl0YWJsZVByb3BlcnRpZXNbY29tcG9uZW50TmFtZV0sY29tcG9uZW50Q2xhc3MpXHJcbiAgICAgICAgICAgICAgICAgICAgZWxlLmluY2x1ZGVkQ29tcG9uZW50cy5wdXNoKGNvbXBvbmVudE5hbWUpXHJcbiAgICAgICAgICAgICAgICB9IFxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmb3IodmFyIG1vZGVsSUQgaW4gdGhpcy5EVERMTW9kZWxzKXsvL2V4cGFuZCBiYXNlIGNsYXNzIHByb3BlcnRpZXMgdG8gZWRpdGFibGVQcm9wZXJ0aWVzIGFuZCB2YWxpZCByZWxhdGlvbnNoaXAgdHlwZXMgdG8gdmFsaWRSZWxhdGlvbnNoaXBzXHJcbiAgICAgICAgdmFyIGVsZT10aGlzLkRURExNb2RlbHNbbW9kZWxJRF1cclxuICAgICAgICB2YXIgYmFzZUNsYXNzSURzPWVsZS5leHRlbmRzO1xyXG4gICAgICAgIGlmKGJhc2VDbGFzc0lEcz09bnVsbCkgY29udGludWU7XHJcbiAgICAgICAgaWYoQXJyYXkuaXNBcnJheShiYXNlQ2xhc3NJRHMpKSB2YXIgdG1wQXJyPWJhc2VDbGFzc0lEc1xyXG4gICAgICAgIGVsc2UgdG1wQXJyPVtiYXNlQ2xhc3NJRHNdXHJcbiAgICAgICAgdG1wQXJyLmZvckVhY2goKGVhY2hCYXNlKT0+e1xyXG4gICAgICAgICAgICB0aGlzLnJlY29yZEFsbEJhc2VDbGFzc2VzKGVsZS5hbGxCYXNlQ2xhc3NlcyxlYWNoQmFzZSlcclxuICAgICAgICAgICAgdGhpcy5leHBhbmRFZGl0YWJsZVByb3BlcnRpZXNGcm9tQmFzZUNsYXNzKGVsZS5lZGl0YWJsZVByb3BlcnRpZXMsZWFjaEJhc2UpXHJcbiAgICAgICAgICAgIHRoaXMuZXhwYW5kVmFsaWRSZWxhdGlvbnNoaXBUeXBlc0Zyb21CYXNlQ2xhc3MoZWxlLnZhbGlkUmVsYXRpb25zaGlwcyxlYWNoQmFzZSlcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIC8vY29uc29sZS5sb2codGhpcy5EVERMTW9kZWxzKVxyXG4gICAgLy9jb25zb2xlLmxvZyh0aGlzLnJlbGF0aW9uc2hpcFR5cGVzKVxyXG59XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgbW9kZWxBbmFseXplcigpOyIsImNvbnN0IG1vZGVsQW5hbHl6ZXI9cmVxdWlyZShcIi4vbW9kZWxBbmFseXplclwiKVxyXG5jb25zdCBzaW1wbGVTZWxlY3RNZW51PSByZXF1aXJlKFwiLi9zaW1wbGVTZWxlY3RNZW51XCIpXHJcbmNvbnN0IG1zYWxIZWxwZXI9cmVxdWlyZShcIi4uL21zYWxIZWxwZXJcIilcclxuY29uc3QgZ2xvYmFsQ2FjaGUgPSByZXF1aXJlKFwiLi9nbG9iYWxDYWNoZVwiKVxyXG5cclxuZnVuY3Rpb24gbW9kZWxFZGl0b3JEaWFsb2coKSB7XHJcbiAgICBpZighdGhpcy5ET00pe1xyXG4gICAgICAgIHRoaXMuRE9NID0gJCgnPGRpdiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7YmFja2dyb3VuZC1jb2xvcjp3aGl0ZTtsZWZ0OjUwJTt0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSkgdHJhbnNsYXRlWSgtNTAlKTt6LWluZGV4Ojk5XCIgY2xhc3M9XCJ3My1jYXJkLTJcIj48L2Rpdj4nKVxyXG4gICAgICAgICQoXCJib2R5XCIpLmFwcGVuZCh0aGlzLkRPTSlcclxuICAgICAgICB0aGlzLkRPTS5oaWRlKClcclxuICAgIH1cclxufVxyXG5cclxubW9kZWxFZGl0b3JEaWFsb2cucHJvdG90eXBlLnBvcHVwID0gYXN5bmMgZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLkRPTS5zaG93KClcclxuICAgIHRoaXMuRE9NLmVtcHR5KClcclxuICAgIHRoaXMuY29udGVudERPTSA9ICQoJzxkaXYgc3R5bGU9XCJ3aWR0aDo2NjVweFwiPjwvZGl2PicpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQodGhpcy5jb250ZW50RE9NKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwiaGVpZ2h0OjQwcHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cImZvbnQtc2l6ZToxLjVlbVwiPkRpZ2l0YWwgVHdpbiBNb2RlbCBFZGl0b3I8L2Rpdj48L2Rpdj4nKSlcclxuICAgIHZhciBjbG9zZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmlnaHRcIiBzdHlsZT1cImZvbnQtc2l6ZToyZW07cGFkZGluZy10b3A6NHB4XCI+w5c8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmNoaWxkcmVuKCc6Zmlyc3QnKS5hcHBlbmQoY2xvc2VCdXR0b24pXHJcbiAgICBjbG9zZUJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5ET00uaGlkZSgpIH0pXHJcblxyXG4gICAgdmFyIGJ1dHRvblJvdz0kKCc8ZGl2ICBzdHlsZT1cImhlaWdodDo0MHB4XCIgY2xhc3M9XCJ3My1iYXJcIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmFwcGVuZChidXR0b25Sb3cpXHJcbiAgICB2YXIgaW1wb3J0QnV0dG9uID0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWNhcmQgdzMtZGVlcC1vcmFuZ2UgdzMtaG92ZXItbGlnaHQtZ3JlZW4gdzMtcmlnaHRcIiBzdHlsZT1cImhlaWdodDoxMDAlXCI+SW1wb3J0PC9idXR0b24+JylcclxuICAgIGJ1dHRvblJvdy5hcHBlbmQoaW1wb3J0QnV0dG9uKVxyXG5cclxuICAgIGltcG9ydEJ1dHRvbi5vbihcImNsaWNrXCIsIGFzeW5jICgpID0+IHtGXHJcbiAgICAgICAgdmFyIG1vZGVsVG9CZUltcG9ydGVkID0gW3RoaXMuZHRkbG9ial1cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICB2YXIgcmVzcG9uc2UgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9pbXBvcnRNb2RlbHNcIiwgXCJQT1NUXCIsIHsgXCJtb2RlbHNcIjogSlNPTi5zdHJpbmdpZnkobW9kZWxUb0JlSW1wb3J0ZWQpIH0pXHJcblxyXG4gICAgICAgICAgICBhbGVydChcIk1vZGVsIFxcXCJcIiArIHRoaXMuZHRkbG9ialtcImRpc3BsYXlOYW1lXCJdICsgXCJcXFwiIGlzIGNyZWF0ZWQhXCIpXHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcIkFEVE1vZGVsRWRpdGVkXCIgfSlcclxuICAgICAgICAgICAgbW9kZWxBbmFseXplci5hZGRNb2RlbHMobW9kZWxUb0JlSW1wb3J0ZWQpIC8vYWRkIHNvIGltbWVkaWF0bGV5IHRoZSBsaXN0IGNhbiBzaG93IHRoZSBuZXcgbW9kZWxzXHJcbiAgICAgICAgICAgIHRoaXMucG9wdXAoKSAvL3JlZnJlc2ggY29udGVudFxyXG4gICAgICAgIH1jYXRjaChlKXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgIH0gICAgICAgIFxyXG4gICAgfSlcclxuXHJcbiAgICB2YXIgbGFibGU9JCgnPGRpdiBjbGFzcz1cInczLWJhci1pdGVtIHczLW9wYWNpdHlcIiBzdHlsZT1cInBhZGRpbmctcmlnaHQ6NXB4O2ZvbnQtc2l6ZToxLjJlbTtcIj5Nb2RlbCBUZW1wbGF0ZTwvZGl2PicpXHJcbiAgICBidXR0b25Sb3cuYXBwZW5kKGxhYmxlKVxyXG4gICAgdmFyIG1vZGVsVGVtcGxhdGVTZWxlY3Rvcj1uZXcgc2ltcGxlU2VsZWN0TWVudShcIiBcIix7d2l0aEJvcmRlcjoxLGZvbnRTaXplOlwiMS4yZW1cIixjb2xvckNsYXNzOlwidzMtbGlnaHQtZ3JheVwiLGJ1dHRvbkNTUzp7XCJwYWRkaW5nXCI6XCI1cHggMTBweFwifSxcIm9wdGlvbkxpc3RIZWlnaHRcIjozMDB9KVxyXG4gICAgYnV0dG9uUm93LmFwcGVuZChtb2RlbFRlbXBsYXRlU2VsZWN0b3IuRE9NKVxyXG4gICAgbW9kZWxUZW1wbGF0ZVNlbGVjdG9yLmNhbGxCYWNrX2NsaWNrT3B0aW9uPShvcHRpb25UZXh0LG9wdGlvblZhbHVlKT0+e1xyXG4gICAgICAgIG1vZGVsVGVtcGxhdGVTZWxlY3Rvci5jaGFuZ2VOYW1lKG9wdGlvblRleHQpXHJcbiAgICAgICAgdGhpcy5jaG9vc2VUZW1wbGF0ZShvcHRpb25WYWx1ZSlcclxuICAgIH1cclxuICAgIG1vZGVsVGVtcGxhdGVTZWxlY3Rvci5hZGRPcHRpb24oXCJOZXcgTW9kZWwuLi5cIixcIk5ld1wiKVxyXG4gICAgZm9yKHZhciBtb2RlbE5hbWUgaW4gbW9kZWxBbmFseXplci5EVERMTW9kZWxzKXtcclxuICAgICAgICBtb2RlbFRlbXBsYXRlU2VsZWN0b3IuYWRkT3B0aW9uKG1vZGVsTmFtZSlcclxuICAgIH1cclxuXHJcbiAgICB2YXIgcGFuZWxIZWlnaHQ9XCI0NTBweFwiXHJcbiAgICB2YXIgcm93Mj0kKCc8ZGl2IGNsYXNzPVwidzMtY2VsbC1yb3dcIiBzdHlsZT1cIm1hcmdpbjoycHhcIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmFwcGVuZChyb3cyKVxyXG4gICAgdmFyIGxlZnRTcGFuPSQoJzxkaXYgY2xhc3M9XCJ3My1jYXJkXCIgc3R5bGU9XCJwYWRkaW5nOjVweDt3aWR0aDozMzBweDtwYWRkaW5nLXJpZ2h0OjVweDtoZWlnaHQ6JytwYW5lbEhlaWdodCsnO292ZXJmbG93OmF1dG9cIj48L2Rpdj4nKVxyXG4gICAgcm93Mi5hcHBlbmQobGVmdFNwYW4pXHJcbiAgICB0aGlzLmxlZnRTcGFuPWxlZnRTcGFuXHJcblxyXG4gICAgdmFyIHJpZ2h0U3Bhbj0kKCc8ZGl2IGNsYXNzPVwidzMtY29udGFpbmVyIHczLWNlbGxcIj48L2Rpdj4nKVxyXG4gICAgcm93Mi5hcHBlbmQocmlnaHRTcGFuKSBcclxuICAgIHZhciBkdGRsU2NyaXB0UGFuZWw9JCgnPGRpdiBjbGFzcz1cInczLWNhcmQtMiB3My13aGl0ZVwiIHN0eWxlPVwib3ZlcmZsb3c6YXV0bzttYXJnaW4tdG9wOjJweDt3aWR0aDozMTBweDtoZWlnaHQ6JytwYW5lbEhlaWdodCsnXCI+PC9kaXY+JylcclxuICAgIHJpZ2h0U3Bhbi5hcHBlbmQoZHRkbFNjcmlwdFBhbmVsKVxyXG4gICAgdGhpcy5kdGRsU2NyaXB0UGFuZWw9ZHRkbFNjcmlwdFBhbmVsXHJcblxyXG4gICAgbW9kZWxUZW1wbGF0ZVNlbGVjdG9yLnRyaWdnZXJPcHRpb25JbmRleCgwKVxyXG59XHJcblxyXG5tb2RlbEVkaXRvckRpYWxvZy5wcm90b3R5cGUuY2hvb3NlVGVtcGxhdGU9ZnVuY3Rpb24odGVtcGFsdGVOYW1lKXtcclxuICAgIGlmKHRlbXBhbHRlTmFtZSE9XCJOZXdcIil7XHJcbiAgICAgICAgdGhpcy5kdGRsb2JqPUpTT04ucGFyc2UobW9kZWxBbmFseXplci5EVERMTW9kZWxzW3RlbXBhbHRlTmFtZV1bXCJvcmlnaW5hbFwiXSlcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHRoaXMuZHRkbG9iaiA9IHtcclxuICAgICAgICAgICAgXCJAaWRcIjogXCJkdG1pOmFOYW1lU3BhY2U6YU1vZGVsSUQ7MVwiLFxyXG4gICAgICAgICAgICBcIkBjb250ZXh0XCI6IFtcImR0bWk6ZHRkbDpjb250ZXh0OzJcIl0sXHJcbiAgICAgICAgICAgIFwiQHR5cGVcIjogXCJJbnRlcmZhY2VcIixcclxuICAgICAgICAgICAgXCJkaXNwbGF5TmFtZVwiOiBcIk5ldyBNb2RlbFwiLFxyXG4gICAgICAgICAgICBcImNvbnRlbnRzXCI6IFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBcIkB0eXBlXCI6IFwiUHJvcGVydHlcIixcclxuICAgICAgICAgICAgICAgICAgICBcIm5hbWVcIjogXCJhdHRyaWJ1dGUxXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJzY2hlbWFcIjogXCJkb3VibGVcIlxyXG4gICAgICAgICAgICAgICAgfSx7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJAdHlwZVwiOiBcIlJlbGF0aW9uc2hpcFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwibmFtZVwiOiBcImxpbmtcIlxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdGhpcy5sZWZ0U3Bhbi5lbXB0eSgpXHJcblxyXG4gICAgdGhpcy5yZWZyZXNoRFRETCgpXHJcbiAgICB0aGlzLmxlZnRTcGFuLmFwcGVuZCgkKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtIHczLXRvb2x0aXBcIiBzdHlsZT1cImZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nLWxlZnQ6MnB4O2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6Z3JheVwiPk1vZGVsIElEICYgTmFtZTxwIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dGV4dC1hbGlnbjpsZWZ0O2ZvbnQtd2VpZ2h0Om5vcm1hbDt0b3A6LTEwcHg7d2lkdGg6MjAwcHhcIiBjbGFzcz1cInczLXRleHQgdzMtdGFnIHczLXRpbnlcIj5tb2RlbCBJRCBjb250YWlucyBuYW1lc3BhY2UsIGEgbW9kZWwgc3RyaW5nIGFuZCBhIHZlcnNpb24gbnVtYmVyPC9wPjwvZGl2PjwvZGl2PicpKVxyXG4gICAgbmV3IGlkUm93KHRoaXMuZHRkbG9iaix0aGlzLmxlZnRTcGFuLCgpPT57dGhpcy5yZWZyZXNoRFRETCgpfSlcclxuICAgIG5ldyBkaXNwbGF5TmFtZVJvdyh0aGlzLmR0ZGxvYmosdGhpcy5sZWZ0U3BhbiwoKT0+e3RoaXMucmVmcmVzaERUREwoKX0pXHJcblxyXG4gICAgaWYoIXRoaXMuZHRkbG9ialtcImNvbnRlbnRzXCJdKXRoaXMuZHRkbG9ialtcImNvbnRlbnRzXCJdPVtdXHJcbiAgICBuZXcgcGFyYW1ldGVyc1Jvdyh0aGlzLmR0ZGxvYmpbXCJjb250ZW50c1wiXSx0aGlzLmxlZnRTcGFuLCgpPT57dGhpcy5yZWZyZXNoRFRETCgpfSx0aGlzLkRPTS5vZmZzZXQoKSlcclxuICAgIG5ldyByZWxhdGlvbnNSb3codGhpcy5kdGRsb2JqW1wiY29udGVudHNcIl0sdGhpcy5sZWZ0U3BhbiwoKT0+e3RoaXMucmVmcmVzaERUREwoKX0sdGhpcy5ET00ub2Zmc2V0KCkpXHJcbiAgICBuZXcgY29tcG9uZW50c1Jvdyh0aGlzLmR0ZGxvYmpbXCJjb250ZW50c1wiXSx0aGlzLmxlZnRTcGFuLCgpPT57dGhpcy5yZWZyZXNoRFRETCgpfSlcclxuXHJcbiAgICBpZighdGhpcy5kdGRsb2JqW1wiZXh0ZW5kc1wiXSl0aGlzLmR0ZGxvYmpbXCJleHRlbmRzXCJdPVtdXHJcbiAgICBuZXcgYmFzZUNsYXNzZXNSb3codGhpcy5kdGRsb2JqW1wiZXh0ZW5kc1wiXSx0aGlzLmxlZnRTcGFuLCgpPT57dGhpcy5yZWZyZXNoRFRETCgpfSlcclxufVxyXG5cclxubW9kZWxFZGl0b3JEaWFsb2cucHJvdG90eXBlLnJlZnJlc2hEVERMPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLmR0ZGxTY3JpcHRQYW5lbC5lbXB0eSgpXHJcbiAgICB0aGlzLmR0ZGxTY3JpcHRQYW5lbC5hcHBlbmQoJCgnPGRpdiBzdHlsZT1cImhlaWdodDoyMHB4O3dpZHRoOjEwMHB4XCIgY2xhc3M9XCJ3My1iYXIgdzMtZ3JheVwiPkdlbmVyYXRlZCBEVERMPC9kaXY+JykpXHJcbiAgICB0aGlzLmR0ZGxTY3JpcHRQYW5lbC5hcHBlbmQoJCgnPHByZSBzdHlsZT1cImNvbG9yOmdyYXlcIj4nK0pTT04uc3RyaW5naWZ5KHRoaXMuZHRkbG9iaixudWxsLDIpKyc8L3ByZT4nKSlcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgbW9kZWxFZGl0b3JEaWFsb2coKTtcclxuXHJcblxyXG5mdW5jdGlvbiBiYXNlQ2xhc3Nlc1JvdyhkdGRsT2JqLHBhcmVudERPTSxyZWZyZXNoRFRETEYpe1xyXG4gICAgdmFyIHJvd0RPTT0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtICB3My10b29sdGlwXCIgc3R5bGU9XCJmb250LXNpemU6MS4yZW07cGFkZGluZy1sZWZ0OjJweDtmb250LXdlaWdodDpib2xkO2NvbG9yOmdyYXlcIj5CYXNlIENsYXNzZXM8cCBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RleHQtYWxpZ246bGVmdDt0b3A6LTEwcHg7Zm9udC13ZWlnaHQ6bm9ybWFsO3dpZHRoOjIwMHB4XCIgY2xhc3M9XCJ3My10ZXh0IHczLXRhZyB3My10aW55XCI+QmFzZSBjbGFzcyBtb2RlbFxcJ3MgcGFyYW1ldGVycyBhbmQgcmVsYXRpb25zaGlwIHR5cGUgYXJlIGluaGVyaXRlZDwvcD48L2Rpdj48L2Rpdj4nKVxyXG5cclxuICAgIHZhciBhZGRCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJlZCB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwibWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6NHB4XCI+KzwvYnV0dG9uPicpXHJcbiAgICByb3dET00uYXBwZW5kKGFkZEJ1dHRvbilcclxuICAgIHBhcmVudERPTS5hcHBlbmQocm93RE9NKVxyXG4gICAgdmFyIGNvbnRlbnRET009JCgnPGRpdiBzdHlsZT1cInBhZGRpbmctbGVmdDoxMHB4XCI+PC9kaXY+JylcclxuICAgIHJvd0RPTS5hcHBlbmQoY29udGVudERPTSlcclxuICAgIGFkZEJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICB2YXIgbmV3T2JqID0gXCJ1bmtub3duXCJcclxuICAgICAgICBkdGRsT2JqLnB1c2gobmV3T2JqKVxyXG4gICAgICAgIG5ldyBzaW5nbGVCYXNlY2xhc3NSb3cobmV3T2JqLGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmopXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcbiAgICAvL2NoZWNrIGV4aXN0ZWQgY29udGVudCBpbml0aWFsbHkgZnJvbSB0ZW1wbGF0ZSBhbmQgdHJpZ2dlciB0aGVpciBkcmF3aW5nXHJcbiAgICBkdGRsT2JqLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgbmV3IHNpbmdsZUJhc2VjbGFzc1JvdyhlbGVtZW50LGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmopXHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2luZ2xlQmFzZWNsYXNzUm93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRixwYXJlbnREdGRsT2JqKXtcclxuICAgIHZhciBET00gPSAkKCc8ZGl2IGNsYXNzPVwidzMtY2VsbC1yb3dcIj48L2Rpdj4nKVxyXG4gICAgdmFyIGJhc2VDbGFzc05hbWVJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDoyMjBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cImJhc2UgbW9kZWwgaWRcIi8+JykuYWRkQ2xhc3MoXCJ3My1iYXItaXRlbSB3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICB2YXIgcmVtb3ZlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwiY29sb3I6Z3JheTttYXJnaW4tbGVmdDozcHg7bWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6MnB4XCI+PGkgY2xhc3M9XCJmYSBmYS10cmFzaCBmYS1sZ1wiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgRE9NLmFwcGVuZChiYXNlQ2xhc3NOYW1lSW5wdXQscmVtb3ZlQnV0dG9uKVxyXG5cclxuICAgIHJlbW92ZUJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICBmb3IgKHZhciBpID0wO2k8IHBhcmVudER0ZGxPYmoubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHBhcmVudER0ZGxPYmpbaV0gPT0gZHRkbE9iaikge1xyXG4gICAgICAgICAgICAgICAgcGFyZW50RHRkbE9iai5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBET00ucmVtb3ZlKClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuXHJcbiAgICBwYXJlbnRET00uYXBwZW5kKERPTSlcclxuXHJcbiAgICBiYXNlQ2xhc3NOYW1lSW5wdXQudmFsKGR0ZGxPYmopXHJcbiAgICBiYXNlQ2xhc3NOYW1lSW5wdXQub24oXCJjaGFuZ2VcIiwoKT0+e1xyXG4gICAgICAgIGZvciAodmFyIGkgPTA7aTwgcGFyZW50RHRkbE9iai5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAocGFyZW50RHRkbE9ialtpXSA9PSBkdGRsT2JqKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnREdGRsT2JqW2ldPWJhc2VDbGFzc05hbWVJbnB1dC52YWwoKVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNvbXBvbmVudHNSb3coZHRkbE9iaixwYXJlbnRET00scmVmcmVzaERURExGKXtcclxuICAgIHZhciByb3dET009JCgnPGRpdiBjbGFzcz1cInczLWJhclwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbSAgdzMtdG9vbHRpcFwiIHN0eWxlPVwiZm9udC1zaXplOjEuMmVtO3BhZGRpbmctbGVmdDoycHg7Zm9udC13ZWlnaHQ6Ym9sZDtjb2xvcjpncmF5XCI+Q29tcG9uZW50czxwIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dGV4dC1hbGlnbjpsZWZ0O3RvcDotMTBweDtmb250LXdlaWdodDpub3JtYWw7d2lkdGg6MjAwcHhcIiBjbGFzcz1cInczLXRleHQgdzMtdGFnIHczLXRpbnlcIj5Db21wb25lbnQgbW9kZWxcXCdzIHBhcmFtZXRlcnMgYXJlIGVtYmVkZGVkIHVuZGVyIGEgbmFtZTwvcD48L2Rpdj48L2Rpdj4nKVxyXG5cclxuICAgIHZhciBhZGRCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJlZCB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwibWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6NHB4XCI+KzwvYnV0dG9uPicpXHJcbiAgICByb3dET00uYXBwZW5kKGFkZEJ1dHRvbilcclxuICAgIHBhcmVudERPTS5hcHBlbmQocm93RE9NKVxyXG4gICAgdmFyIGNvbnRlbnRET009JCgnPGRpdiBzdHlsZT1cInBhZGRpbmctbGVmdDoxMHB4XCI+PC9kaXY+JylcclxuICAgIHJvd0RPTS5hcHBlbmQoY29udGVudERPTSlcclxuXHJcbiAgICBhZGRCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgdmFyIG5ld09iaiA9IHtcclxuICAgICAgICAgICAgXCJAdHlwZVwiOiBcIkNvbXBvbmVudFwiLFxyXG4gICAgICAgICAgICBcIm5hbWVcIjogXCJTb21lQ29tcG9uZW50XCIsXHJcbiAgICAgICAgICAgIFwic2NoZW1hXCI6XCJkdG1pOnNvbWVDb21wb25lbnRNb2RlbDsxXCJcclxuICAgICAgICB9XHJcbiAgICAgICAgZHRkbE9iai5wdXNoKG5ld09iailcclxuICAgICAgICBuZXcgc2luZ2xlQ29tcG9uZW50Um93KG5ld09iaixjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgLy9jaGVjayBleGlzdGVkIGNvbnRlbnQgaW5pdGlhbGx5IGZyb20gdGVtcGxhdGUgYW5kIHRyaWdnZXIgdGhlaXIgZHJhd2luZ1xyXG4gICAgZHRkbE9iai5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIGlmKGVsZW1lbnRbXCJAdHlwZVwiXSE9XCJDb21wb25lbnRcIikgcmV0dXJuXHJcbiAgICAgICAgbmV3IHNpbmdsZUNvbXBvbmVudFJvdyhlbGVtZW50LGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmopXHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2luZ2xlQ29tcG9uZW50Um93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRixwYXJlbnREdGRsT2JqKXtcclxuICAgIHZhciBET00gPSAkKCc8ZGl2IGNsYXNzPVwidzMtY2VsbC1yb3dcIj48L2Rpdj4nKVxyXG4gICAgdmFyIGNvbXBvbmVudE5hbWVJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDoxMDBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cImNvbXBvbmVudCBuYW1lXCIvPicpLmFkZENsYXNzKFwidzMtYmFyLWl0ZW0gdzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgdmFyIHNjaGVtYUlucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjE2MHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwiY29tcG9uZW50IG1vZGVsIGlkLi4uXCIvPicpLmFkZENsYXNzKFwidzMtYmFyLWl0ZW0gdzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgdmFyIHJlbW92ZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cImNvbG9yOmdyYXk7bWFyZ2luLWxlZnQ6M3B4O21hcmdpbi10b3A6MnB4O2ZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjJweFwiPjxpIGNsYXNzPVwiZmEgZmEtdHJhc2ggZmEtbGdcIj48L2k+PC9idXR0b24+JylcclxuICAgIERPTS5hcHBlbmQoY29tcG9uZW50TmFtZUlucHV0LHNjaGVtYUlucHV0LHJlbW92ZUJ1dHRvbilcclxuXHJcbiAgICByZW1vdmVCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgZm9yICh2YXIgaSA9MDtpPCBwYXJlbnREdGRsT2JqLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChwYXJlbnREdGRsT2JqW2ldID09PSBkdGRsT2JqKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnREdGRsT2JqLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIERPTS5yZW1vdmUoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG5cclxuICAgIHBhcmVudERPTS5hcHBlbmQoRE9NKVxyXG5cclxuICAgIGNvbXBvbmVudE5hbWVJbnB1dC52YWwoZHRkbE9ialtcIm5hbWVcIl0pXHJcbiAgICBzY2hlbWFJbnB1dC52YWwoZHRkbE9ialtcInNjaGVtYVwiXXx8XCJcIilcclxuXHJcbiAgICBjb21wb25lbnROYW1lSW5wdXQub24oXCJjaGFuZ2VcIiwoKT0+e1xyXG4gICAgICAgIGR0ZGxPYmpbXCJuYW1lXCJdPWNvbXBvbmVudE5hbWVJbnB1dC52YWwoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgc2NoZW1hSW5wdXQub24oXCJjaGFuZ2VcIiwoKT0+e1xyXG4gICAgICAgIGR0ZGxPYmpbXCJzY2hlbWFcIl09c2NoZW1hSW5wdXQudmFsKClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxufVxyXG5cclxuZnVuY3Rpb24gcmVsYXRpb25zUm93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRixkaWFsb2dPZmZzZXQpe1xyXG4gICAgdmFyIHJvd0RPTT0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtIHczLXRvb2x0aXBcIiBzdHlsZT1cImZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nLWxlZnQ6MnB4O2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6Z3JheVwiPlJlbGF0aW9uc2hpcCBUeXBlczxwIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dGV4dC1hbGlnbjpsZWZ0O3RvcDotMTBweDtmb250LXdlaWdodDpub3JtYWw7d2lkdGg6MjAwcHhcIiBjbGFzcz1cInczLXRleHQgdzMtdGFnIHczLXRpbnlcIj5SZWxhdGlvbnNoaXAgY2FuIGhhdmUgaXRzIG93biBwYXJhbWV0ZXJzPC9wPjwvZGl2PjwvZGl2PicpXHJcblxyXG5cclxuICAgIHZhciBhZGRCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJlZCB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwibWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6NHB4XCI+KzwvYnV0dG9uPicpXHJcbiAgICByb3dET00uYXBwZW5kKGFkZEJ1dHRvbilcclxuICAgIHBhcmVudERPTS5hcHBlbmQocm93RE9NKVxyXG4gICAgdmFyIGNvbnRlbnRET009JCgnPGRpdiBzdHlsZT1cInBhZGRpbmctbGVmdDoxMHB4XCI+PC9kaXY+JylcclxuICAgIHJvd0RPTS5hcHBlbmQoY29udGVudERPTSlcclxuXHJcbiAgICBhZGRCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgdmFyIG5ld09iaiA9IHtcclxuICAgICAgICAgICAgXCJAdHlwZVwiOiBcIlJlbGF0aW9uc2hpcFwiLFxyXG4gICAgICAgICAgICBcIm5hbWVcIjogXCJyZWxhdGlvbjFcIixcclxuICAgICAgICB9XHJcbiAgICAgICAgZHRkbE9iai5wdXNoKG5ld09iailcclxuICAgICAgICBuZXcgc2luZ2xlUmVsYXRpb25UeXBlUm93KG5ld09iaixjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqLGRpYWxvZ09mZnNldClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuXHJcbiAgICAvL2NoZWNrIGV4aXN0ZWQgY29udGVudCBpbml0aWFsbHkgZnJvbSB0ZW1wbGF0ZSBhbmQgdHJpZ2dlciB0aGVpciBkcmF3aW5nXHJcbiAgICBkdGRsT2JqLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgaWYoZWxlbWVudFtcIkB0eXBlXCJdIT1cIlJlbGF0aW9uc2hpcFwiKSByZXR1cm5cclxuICAgICAgICBuZXcgc2luZ2xlUmVsYXRpb25UeXBlUm93KGVsZW1lbnQsY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9iaixkaWFsb2dPZmZzZXQpXHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2luZ2xlUmVsYXRpb25UeXBlUm93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRixwYXJlbnREdGRsT2JqLGRpYWxvZ09mZnNldCl7XHJcbiAgICB2YXIgRE9NID0gJCgnPGRpdiBjbGFzcz1cInczLWNlbGwtcm93XCI+PC9kaXY+JylcclxuICAgIHZhciByZWxhdGlvbk5hbWVJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDo5MHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwicmVsYXRpb24gbmFtZVwiLz4nKS5hZGRDbGFzcyhcInczLWJhci1pdGVtIHczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIHZhciB0YXJnZXRNb2RlbElEPSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjE0MHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwiKG9wdGlvbmFsKXRhcmdldCBtb2RlbFwiLz4nKS5hZGRDbGFzcyhcInczLWJhci1pdGVtIHczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIHZhciBhZGRCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWhvdmVyLWFtYmVyXCIgc3R5bGU9XCJjb2xvcjpncmF5O21hcmdpbi1sZWZ0OjNweDttYXJnaW4tdG9wOjJweDtmb250LXNpemU6MS4yZW07cGFkZGluZzoycHhcIj48aSBjbGFzcz1cImZhIGZhLWNvZyBmYS1sZ1wiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgdmFyIHJlbW92ZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cImNvbG9yOmdyYXk7bWFyZ2luLWxlZnQ6M3B4O21hcmdpbi10b3A6MnB4O2ZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjJweFwiPjxpIGNsYXNzPVwiZmEgZmEtdHJhc2ggZmEtbGdcIj48L2k+PC9idXR0b24+JylcclxuICAgIERPTS5hcHBlbmQocmVsYXRpb25OYW1lSW5wdXQsdGFyZ2V0TW9kZWxJRCxhZGRCdXR0b24scmVtb3ZlQnV0dG9uKVxyXG5cclxuICAgIHJlbW92ZUJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICBmb3IgKHZhciBpID0wO2k8IHBhcmVudER0ZGxPYmoubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHBhcmVudER0ZGxPYmpbaV0gPT09IGR0ZGxPYmopIHtcclxuICAgICAgICAgICAgICAgIHBhcmVudER0ZGxPYmouc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgRE9NLnJlbW92ZSgpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcblxyXG4gICAgdmFyIGNvbnRlbnRET009JCgnPGRpdiBzdHlsZT1cInBhZGRpbmctbGVmdDoxMHB4XCI+PC9kaXY+JylcclxuICAgIERPTS5hcHBlbmQoY29udGVudERPTSlcclxuICAgIHBhcmVudERPTS5hcHBlbmQoRE9NKVxyXG5cclxuICAgIHJlbGF0aW9uTmFtZUlucHV0LnZhbChkdGRsT2JqW1wibmFtZVwiXSlcclxuICAgIHRhcmdldE1vZGVsSUQudmFsKGR0ZGxPYmpbXCJ0YXJnZXRcIl18fFwiXCIpXHJcblxyXG4gICAgYWRkQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIGlmKCEgZHRkbE9ialtcInByb3BlcnRpZXNcIl0pIGR0ZGxPYmpbXCJwcm9wZXJ0aWVzXCJdPVtdXHJcbiAgICAgICAgdmFyIG5ld09iaiA9IHtcclxuICAgICAgICAgICAgXCJuYW1lXCI6IFwibmV3UFwiLFxyXG4gICAgICAgICAgICBcInNjaGVtYVwiOiBcImRvdWJsZVwiXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGR0ZGxPYmpbXCJwcm9wZXJ0aWVzXCJdLnB1c2gobmV3T2JqKVxyXG4gICAgICAgIG5ldyBzaW5nbGVQYXJhbWV0ZXJSb3cobmV3T2JqLGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmpbXCJwcm9wZXJ0aWVzXCJdLG51bGwsZGlhbG9nT2Zmc2V0KVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG5cclxuICAgIHJlbGF0aW9uTmFtZUlucHV0Lm9uKFwiY2hhbmdlXCIsKCk9PntcclxuICAgICAgICBkdGRsT2JqW1wibmFtZVwiXT1yZWxhdGlvbk5hbWVJbnB1dC52YWwoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgdGFyZ2V0TW9kZWxJRC5vbihcImNoYW5nZVwiLCgpPT57XHJcbiAgICAgICAgaWYodGFyZ2V0TW9kZWxJRC52YWwoKT09XCJcIikgZGVsZXRlIGR0ZGxPYmpbXCJ0YXJnZXRcIl1cclxuICAgICAgICBlbHNlIGR0ZGxPYmpbXCJ0YXJnZXRcIl09dGFyZ2V0TW9kZWxJRC52YWwoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgaWYoZHRkbE9ialtcInByb3BlcnRpZXNcIl0gJiYgZHRkbE9ialtcInByb3BlcnRpZXNcIl0ubGVuZ3RoPjApe1xyXG4gICAgICAgIHZhciBwcm9wZXJ0aWVzPWR0ZGxPYmpbXCJwcm9wZXJ0aWVzXCJdXHJcbiAgICAgICAgcHJvcGVydGllcy5mb3JFYWNoKG9uZVByb3BlcnR5PT57XHJcbiAgICAgICAgICAgIG5ldyBzaW5nbGVQYXJhbWV0ZXJSb3cob25lUHJvcGVydHksY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9ialtcInByb3BlcnRpZXNcIl0sbnVsbCxkaWFsb2dPZmZzZXQpXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gcGFyYW1ldGVyc1JvdyhkdGRsT2JqLHBhcmVudERPTSxyZWZyZXNoRFRETEYsZGlhbG9nT2Zmc2V0KXtcclxuICAgIHZhciByb3dET009JCgnPGRpdiBjbGFzcz1cInczLWJhclwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiZm9udC1zaXplOjEuMmVtO3BhZGRpbmctbGVmdDoycHg7Zm9udC13ZWlnaHQ6Ym9sZDtjb2xvcjpncmF5XCI+UGFyYW1ldGVyczwvZGl2PjwvZGl2PicpXHJcbiAgICB2YXIgYWRkQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yZWQgdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cIm1hcmdpbi10b3A6MnB4O2ZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjRweFwiPis8L2J1dHRvbj4nKVxyXG4gICAgcm93RE9NLmFwcGVuZChhZGRCdXR0b24pXHJcbiAgICBwYXJlbnRET00uYXBwZW5kKHJvd0RPTSlcclxuICAgIHZhciBjb250ZW50RE9NPSQoJzxkaXYgc3R5bGU9XCJwYWRkaW5nLWxlZnQ6MTBweFwiPjwvZGl2PicpXHJcbiAgICByb3dET00uYXBwZW5kKGNvbnRlbnRET00pXHJcbiAgICBhZGRCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgdmFyIG5ld09iaiA9IHtcclxuICAgICAgICAgICAgXCJAdHlwZVwiOiBcIlByb3BlcnR5XCIsXHJcbiAgICAgICAgICAgIFwibmFtZVwiOiBcIm5ld1BcIixcclxuICAgICAgICAgICAgXCJzY2hlbWFcIjogXCJkb3VibGVcIlxyXG4gICAgICAgIH1cclxuICAgICAgICBkdGRsT2JqLnB1c2gobmV3T2JqKVxyXG4gICAgICAgIG5ldyBzaW5nbGVQYXJhbWV0ZXJSb3cobmV3T2JqLGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmosXCJ0b3BMZXZlbFwiLGRpYWxvZ09mZnNldClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuXHJcbiAgICAvL2NoZWNrIGV4aXN0ZWQgY29udGVudCBpbml0aWFsbHkgZnJvbSB0ZW1wbGF0ZSBhbmQgdHJpZ2dlciB0aGVpciBkcmF3aW5nXHJcbiAgICBkdGRsT2JqLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgaWYoZWxlbWVudFtcIkB0eXBlXCJdIT1cIlByb3BlcnR5XCIpIHJldHVyblxyXG4gICAgICAgIG5ldyBzaW5nbGVQYXJhbWV0ZXJSb3coZWxlbWVudCxjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqLFwidG9wTGV2ZWxcIixkaWFsb2dPZmZzZXQpXHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2luZ2xlUGFyYW1ldGVyUm93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRixwYXJlbnREdGRsT2JqLHRvcExldmVsLGRpYWxvZ09mZnNldCl7XHJcbiAgICB2YXIgRE9NID0gJCgnPGRpdiBjbGFzcz1cInczLWNlbGwtcm93XCI+PC9kaXY+JylcclxuICAgIHZhciBwYXJhbWV0ZXJOYW1lSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmU7d2lkdGg6MTAwcHg7cGFkZGluZzo0cHhcIiAgcGxhY2Vob2xkZXI9XCJwYXJhbWV0ZXIgbmFtZVwiLz4nKS5hZGRDbGFzcyhcInczLWJhci1pdGVtIHczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIHZhciBlbnVtVmFsdWVJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDoxMDBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cInN0cjEsc3RyMiwuLi5cIi8+JykuYWRkQ2xhc3MoXCJ3My1iYXItaXRlbSB3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICB2YXIgYWRkQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwiY29sb3I6Z3JheTttYXJnaW4tbGVmdDozcHg7bWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6MnB4XCI+PGkgY2xhc3M9XCJmYSBmYS1wbHVzIGZhLWxnXCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICB2YXIgcmVtb3ZlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwiY29sb3I6Z3JheTttYXJnaW4tbGVmdDozcHg7bWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6MnB4XCI+PGkgY2xhc3M9XCJmYSBmYS10cmFzaCBmYS1sZ1wiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgdmFyIHB0eXBlU2VsZWN0b3I9bmV3IHNpbXBsZVNlbGVjdE1lbnUoXCIgXCIse3dpdGhCb3JkZXI6MSxmb250U2l6ZTpcIjFlbVwiLGNvbG9yQ2xhc3M6XCJ3My1saWdodC1ncmF5IHczLWJhci1pdGVtXCIsYnV0dG9uQ1NTOntcInBhZGRpbmdcIjpcIjRweCA1cHhcIn0sXCJvcHRpb25MaXN0SGVpZ2h0XCI6MzAwLFwiaXNDbGlja2FibGVcIjoxLFwib3B0aW9uTGlzdE1hcmdpblRvcFwiOi0xNTAsXCJvcHRpb25MaXN0TWFyZ2luTGVmdFwiOjYwLFxyXG4gICAgXCJhZGp1c3RQb3NpdGlvbkFuY2hvclwiOmRpYWxvZ09mZnNldH0pXHJcbiAgICBwdHlwZVNlbGVjdG9yLmFkZE9wdGlvbkFycihbXCJFbnVtXCIsXCJPYmplY3RcIixcImJvb2xlYW5cIixcImRhdGVcIixcImRhdGVUaW1lXCIsXCJkb3VibGVcIixcImR1cmF0aW9uXCIsXCJmbG9hdFwiLFwiaW50ZWdlclwiLFwibG9uZ1wiLFwic3RyaW5nXCIsXCJ0aW1lXCJdKVxyXG4gICAgRE9NLmFwcGVuZChwYXJhbWV0ZXJOYW1lSW5wdXQscHR5cGVTZWxlY3Rvci5ET00sZW51bVZhbHVlSW5wdXQsYWRkQnV0dG9uLHJlbW92ZUJ1dHRvbilcclxuXHJcbiAgICByZW1vdmVCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgZm9yICh2YXIgaSA9MDtpPCBwYXJlbnREdGRsT2JqLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChwYXJlbnREdGRsT2JqW2ldID09PSBkdGRsT2JqKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnREdGRsT2JqLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIERPTS5yZW1vdmUoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgXHJcbiAgICB2YXIgY29udGVudERPTT0kKCc8ZGl2IHN0eWxlPVwicGFkZGluZy1sZWZ0OjEwcHhcIj48L2Rpdj4nKVxyXG4gICAgRE9NLmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgcGFyZW50RE9NLmFwcGVuZChET00pXHJcblxyXG4gICAgcGFyYW1ldGVyTmFtZUlucHV0LnZhbChkdGRsT2JqW1wibmFtZVwiXSlcclxuICAgIHB0eXBlU2VsZWN0b3IuY2FsbEJhY2tfY2xpY2tPcHRpb249KG9wdGlvblRleHQsb3B0aW9uVmFsdWUscmVhbE1vdXNlQ2xpY2spPT57XHJcbiAgICAgICAgcHR5cGVTZWxlY3Rvci5jaGFuZ2VOYW1lKG9wdGlvblRleHQpXHJcbiAgICAgICAgY29udGVudERPTS5lbXB0eSgpLy9jbGVhciBhbGwgY29udGVudCBkb20gY29udGVudFxyXG4gICAgICAgIGlmKHJlYWxNb3VzZUNsaWNrKXtcclxuICAgICAgICAgICAgZm9yKHZhciBpbmQgaW4gZHRkbE9iaikgZGVsZXRlIGR0ZGxPYmpbaW5kXSAgICAvL2NsZWFyIGFsbCBvYmplY3QgY29udGVudFxyXG4gICAgICAgICAgICBpZih0b3BMZXZlbCkgZHRkbE9ialtcIkB0eXBlXCJdPVwiUHJvcGVydHlcIlxyXG4gICAgICAgICAgICBkdGRsT2JqW1wibmFtZVwiXT1wYXJhbWV0ZXJOYW1lSW5wdXQudmFsKClcclxuICAgICAgICB9IFxyXG4gICAgICAgIGlmKG9wdGlvblRleHQ9PVwiRW51bVwiKXtcclxuICAgICAgICAgICAgZW51bVZhbHVlSW5wdXQudmFsKFwiXCIpXHJcbiAgICAgICAgICAgIGVudW1WYWx1ZUlucHV0LnNob3coKTtcclxuICAgICAgICAgICAgYWRkQnV0dG9uLmhpZGUoKVxyXG4gICAgICAgICAgICBpZihyZWFsTW91c2VDbGljaykgZHRkbE9ialtcInNjaGVtYVwiXT17XCJAdHlwZVwiOiBcIkVudW1cIixcInZhbHVlU2NoZW1hXCI6IFwic3RyaW5nXCJ9XHJcbiAgICAgICAgfWVsc2UgaWYob3B0aW9uVGV4dD09XCJPYmplY3RcIil7XHJcbiAgICAgICAgICAgIGVudW1WYWx1ZUlucHV0LmhpZGUoKTtcclxuICAgICAgICAgICAgYWRkQnV0dG9uLnNob3coKVxyXG4gICAgICAgICAgICBpZihyZWFsTW91c2VDbGljaykgZHRkbE9ialtcInNjaGVtYVwiXT17XCJAdHlwZVwiOiBcIk9iamVjdFwifVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBpZihyZWFsTW91c2VDbGljaykgZHRkbE9ialtcInNjaGVtYVwiXT1vcHRpb25UZXh0XHJcbiAgICAgICAgICAgIGVudW1WYWx1ZUlucHV0LmhpZGUoKTtcclxuICAgICAgICAgICAgYWRkQnV0dG9uLmhpZGUoKVxyXG4gICAgICAgIH1cclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfVxyXG4gICAgYWRkQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIGlmKCEgZHRkbE9ialtcInNjaGVtYVwiXVtcImZpZWxkc1wiXSkgZHRkbE9ialtcInNjaGVtYVwiXVtcImZpZWxkc1wiXT1bXVxyXG4gICAgICAgIHZhciBuZXdPYmogPSB7XHJcbiAgICAgICAgICAgIFwibmFtZVwiOiBcIm5ld1BcIixcclxuICAgICAgICAgICAgXCJzY2hlbWFcIjogXCJkb3VibGVcIlxyXG4gICAgICAgIH1cclxuICAgICAgICBkdGRsT2JqW1wic2NoZW1hXCJdW1wiZmllbGRzXCJdLnB1c2gobmV3T2JqKVxyXG4gICAgICAgIG5ldyBzaW5nbGVQYXJhbWV0ZXJSb3cobmV3T2JqLGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmpbXCJzY2hlbWFcIl1bXCJmaWVsZHNcIl0sbnVsbCxkaWFsb2dPZmZzZXQpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcblxyXG4gICAgcGFyYW1ldGVyTmFtZUlucHV0Lm9uKFwiY2hhbmdlXCIsKCk9PntcclxuICAgICAgICBkdGRsT2JqW1wibmFtZVwiXT1wYXJhbWV0ZXJOYW1lSW5wdXQudmFsKClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuICAgIGVudW1WYWx1ZUlucHV0Lm9uKFwiY2hhbmdlXCIsKCk9PntcclxuICAgICAgICB2YXIgdmFsdWVBcnI9ZW51bVZhbHVlSW5wdXQudmFsKCkuc3BsaXQoXCIsXCIpXHJcbiAgICAgICAgZHRkbE9ialtcInNjaGVtYVwiXVtcImVudW1WYWx1ZXNcIl09W11cclxuICAgICAgICB2YWx1ZUFyci5mb3JFYWNoKGFWYWw9PntcclxuICAgICAgICAgICAgZHRkbE9ialtcInNjaGVtYVwiXVtcImVudW1WYWx1ZXNcIl0ucHVzaCh7XHJcbiAgICAgICAgICAgICAgICBcIm5hbWVcIjogYVZhbCxcclxuICAgICAgICAgICAgICAgIFwiZW51bVZhbHVlXCI6IGFWYWxcclxuICAgICAgICAgICAgICB9KVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcbiAgICBpZih0eXBlb2YoZHRkbE9ialtcInNjaGVtYVwiXSkgIT0gJ29iamVjdCcpIHZhciBzY2hlbWE9ZHRkbE9ialtcInNjaGVtYVwiXVxyXG4gICAgZWxzZSBzY2hlbWE9ZHRkbE9ialtcInNjaGVtYVwiXVtcIkB0eXBlXCJdXHJcbiAgICBwdHlwZVNlbGVjdG9yLnRyaWdnZXJPcHRpb25WYWx1ZShzY2hlbWEpXHJcbiAgICBpZihzY2hlbWE9PVwiRW51bVwiKXtcclxuICAgICAgICB2YXIgZW51bUFycj1kdGRsT2JqW1wic2NoZW1hXCJdW1wiZW51bVZhbHVlc1wiXVxyXG4gICAgICAgIGlmKGVudW1BcnIhPW51bGwpe1xyXG4gICAgICAgICAgICB2YXIgaW5wdXRTdHI9XCJcIlxyXG4gICAgICAgICAgICBlbnVtQXJyLmZvckVhY2gob25lRW51bVZhbHVlPT57aW5wdXRTdHIrPW9uZUVudW1WYWx1ZS5lbnVtVmFsdWUrXCIsXCJ9KVxyXG4gICAgICAgICAgICBpbnB1dFN0cj1pbnB1dFN0ci5zbGljZSgwLCAtMSkvL3JlbW92ZSB0aGUgbGFzdCBcIixcIlxyXG4gICAgICAgICAgICBlbnVtVmFsdWVJbnB1dC52YWwoaW5wdXRTdHIpXHJcbiAgICAgICAgfVxyXG4gICAgfWVsc2UgaWYoc2NoZW1hPT1cIk9iamVjdFwiKXtcclxuICAgICAgICB2YXIgZmllbGRzPWR0ZGxPYmpbXCJzY2hlbWFcIl1bXCJmaWVsZHNcIl1cclxuICAgICAgICBmaWVsZHMuZm9yRWFjaChvbmVGaWVsZD0+e1xyXG4gICAgICAgICAgICBuZXcgc2luZ2xlUGFyYW1ldGVyUm93KG9uZUZpZWxkLGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmpbXCJzY2hlbWFcIl1bXCJmaWVsZHNcIl0sbnVsbCxkaWFsb2dPZmZzZXQpXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxufVxyXG5cclxuXHJcbmZ1bmN0aW9uIGlkUm93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRil7XHJcbiAgICB2YXIgRE9NID0gJCgnPGRpdiBjbGFzcz1cInczLWNlbGwtcm93XCI+PC9kaXY+JylcclxuICAgIHZhciBsYWJlbDE9JCgnPGRpdiBjbGFzcz1cInczLW9wYWNpdHlcIiBzdHlsZT1cImRpc3BsYXk6aW5saW5lXCI+ZHRtaTo8L2Rpdj4nKVxyXG4gICAgdmFyIGRvbWFpbklucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjgwcHg7cGFkZGluZzo0cHhcIiAgcGxhY2Vob2xkZXI9XCJOYW1lc3BhY2VcIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICB2YXIgbW9kZWxJRElucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjE0MHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwiTW9kZWxJRFwiLz4nKS5hZGRDbGFzcyhcInczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIHZhciB2ZXJzaW9uSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmU7d2lkdGg6NjBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cInZlcnNpb25cIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICBET00uYXBwZW5kKGxhYmVsMSxkb21haW5JbnB1dCwkKCc8ZGl2IGNsYXNzPVwidzMtb3BhY2l0eVwiIHN0eWxlPVwiZGlzcGxheTppbmxpbmVcIj46PC9kaXY+JyksbW9kZWxJRElucHV0LCQoJzxkaXYgY2xhc3M9XCJ3My1vcGFjaXR5XCIgc3R5bGU9XCJkaXNwbGF5OmlubGluZVwiPjs8L2Rpdj4nKSx2ZXJzaW9uSW5wdXQpXHJcbiAgICBwYXJlbnRET00uYXBwZW5kKERPTSlcclxuXHJcbiAgICB2YXIgdmFsdWVDaGFuZ2U9KCk9PntcclxuICAgICAgICB2YXIgc3RyPWBkdG1pOiR7ZG9tYWluSW5wdXQudmFsKCl9OiR7bW9kZWxJRElucHV0LnZhbCgpfTske3ZlcnNpb25JbnB1dC52YWwoKX1gXHJcbiAgICAgICAgZHRkbE9ialtcIkBpZFwiXT1zdHJcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfVxyXG4gICAgZG9tYWluSW5wdXQub24oXCJjaGFuZ2VcIix2YWx1ZUNoYW5nZSlcclxuICAgIG1vZGVsSURJbnB1dC5vbihcImNoYW5nZVwiLHZhbHVlQ2hhbmdlKVxyXG4gICAgdmVyc2lvbklucHV0Lm9uKFwiY2hhbmdlXCIsdmFsdWVDaGFuZ2UpXHJcblxyXG4gICAgdmFyIHN0cj1kdGRsT2JqW1wiQGlkXCJdXHJcbiAgICBpZihzdHIhPVwiXCIgJiYgc3RyIT1udWxsKXtcclxuICAgICAgICB2YXIgYXJyMT1zdHIuc3BsaXQoXCI7XCIpXHJcbiAgICAgICAgaWYoYXJyMS5sZW5ndGghPTIpIHJldHVybjtcclxuICAgICAgICB2ZXJzaW9uSW5wdXQudmFsKGFycjFbMV0pXHJcbiAgICAgICAgdmFyIGFycjI9YXJyMVswXS5zcGxpdChcIjpcIilcclxuICAgICAgICBkb21haW5JbnB1dC52YWwoYXJyMlsxXSlcclxuICAgICAgICBhcnIyLnNoaWZ0KCk7IGFycjIuc2hpZnQoKVxyXG4gICAgICAgIG1vZGVsSURJbnB1dC52YWwoYXJyMi5qb2luKFwiOlwiKSlcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZGlzcGxheU5hbWVSb3coZHRkbE9iaixwYXJlbnRET00scmVmcmVzaERURExGKXtcclxuICAgIHZhciBET00gPSAkKCc8ZGl2IGNsYXNzPVwidzMtY2VsbC1yb3dcIj48L2Rpdj4nKVxyXG4gICAgdmFyIGxhYmVsMT0kKCc8ZGl2IGNsYXNzPVwidzMtb3BhY2l0eVwiIHN0eWxlPVwiZGlzcGxheTppbmxpbmVcIj5EaXNwbGF5IE5hbWU6PC9kaXY+JylcclxuICAgIHZhciBuYW1lSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmU7d2lkdGg6MTUwcHg7cGFkZGluZzo0cHhcIiAgcGxhY2Vob2xkZXI9XCJNb2RlbElEXCIvPicpLmFkZENsYXNzKFwidzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgRE9NLmFwcGVuZChsYWJlbDEsbmFtZUlucHV0KVxyXG4gICAgcGFyZW50RE9NLmFwcGVuZChET00pXHJcbiAgICB2YXIgdmFsdWVDaGFuZ2U9KCk9PntcclxuICAgICAgICBkdGRsT2JqW1wiZGlzcGxheU5hbWVcIl09bmFtZUlucHV0LnZhbCgpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH1cclxuICAgIG5hbWVJbnB1dC5vbihcImNoYW5nZVwiLHZhbHVlQ2hhbmdlKVxyXG4gICAgdmFyIHN0cj1kdGRsT2JqW1wiZGlzcGxheU5hbWVcIl1cclxuICAgIGlmKHN0ciE9XCJcIiAmJiBzdHIhPW51bGwpIG5hbWVJbnB1dC52YWwoc3RyKVxyXG59IiwiY29uc3QgbW9kZWxBbmFseXplcj1yZXF1aXJlKFwiLi9tb2RlbEFuYWx5emVyXCIpXHJcbmNvbnN0IHN0YXJ0U2VsZWN0aW9uRGlhbG9nID0gcmVxdWlyZShcIi4vc3RhcnRTZWxlY3Rpb25EaWFsb2dcIilcclxuY29uc3Qgc2ltcGxlVHJlZT0gcmVxdWlyZShcIi4vc2ltcGxlVHJlZVwiKVxyXG5jb25zdCBzaW1wbGVDb25maXJtRGlhbG9nID0gcmVxdWlyZShcIi4vc2ltcGxlQ29uZmlybURpYWxvZ1wiKVxyXG5jb25zdCBtb2RlbEVkaXRvckRpYWxvZyA9IHJlcXVpcmUoXCIuL21vZGVsRWRpdG9yRGlhbG9nXCIpXHJcbmNvbnN0IGdsb2JhbENhY2hlID0gcmVxdWlyZShcIi4vZ2xvYmFsQ2FjaGVcIilcclxuY29uc3QgbXNhbEhlbHBlcj1yZXF1aXJlKFwiLi4vbXNhbEhlbHBlclwiKVxyXG5cclxuZnVuY3Rpb24gbW9kZWxNYW5hZ2VyRGlhbG9nKCkge1xyXG4gICAgaWYoIXRoaXMuRE9NKXtcclxuICAgICAgICB0aGlzLkRPTSA9ICQoJzxkaXYgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO2JhY2tncm91bmQtY29sb3I6d2hpdGU7bGVmdDo1MCU7dHJhbnNmb3JtOiB0cmFuc2xhdGVYKC01MCUpIHRyYW5zbGF0ZVkoLTUwJSk7ei1pbmRleDo5OVwiIGNsYXNzPVwidzMtY2FyZC0yXCI+PC9kaXY+JylcclxuICAgICAgICB0aGlzLkRPTS5jc3MoXCJvdmVyZmxvd1wiLFwiaGlkZGVuXCIpXHJcbiAgICAgICAgJChcImJvZHlcIikuYXBwZW5kKHRoaXMuRE9NKVxyXG4gICAgICAgIHRoaXMuRE9NLmhpZGUoKVxyXG4gICAgfVxyXG59XHJcblxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5wb3B1cCA9IGFzeW5jIGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5ET00uc2hvdygpXHJcbiAgICB0aGlzLkRPTS5lbXB0eSgpXHJcbiAgICB0aGlzLmNvbnRlbnRET00gPSAkKCc8ZGl2IHN0eWxlPVwid2lkdGg6NjUwcHhcIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKHRoaXMuY29udGVudERPTSlcclxuICAgIHRoaXMuY29udGVudERPTS5hcHBlbmQoJCgnPGRpdiBzdHlsZT1cImhlaWdodDo0MHB4XCIgY2xhc3M9XCJ3My1iYXIgdzMtcmVkXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtXCIgc3R5bGU9XCJmb250LXNpemU6MS41ZW1cIj5EaWdpdGFsIFR3aW4gTW9kZWxzPC9kaXY+PC9kaXY+JykpXHJcbiAgICB2YXIgY2xvc2VCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJpZ2h0XCIgc3R5bGU9XCJmb250LXNpemU6MmVtO3BhZGRpbmctdG9wOjRweFwiPsOXPC9idXR0b24+JylcclxuICAgIHRoaXMuY29udGVudERPTS5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKGNsb3NlQnV0dG9uKVxyXG4gICAgY2xvc2VCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMuRE9NLmhpZGUoKSB9KVxyXG5cclxuICAgIHZhciBpbXBvcnRNb2RlbHNCdG4gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWNhcmQgdzMtZGVlcC1vcmFuZ2UgdzMtaG92ZXItbGlnaHQtZ3JlZW5cIiBzdHlsZT1cImhlaWdodDoxMDAlXCI+SW1wb3J0PC9idXR0b24+JylcclxuICAgIHZhciBhY3R1YWxJbXBvcnRNb2RlbHNCdG4gPSQoJzxpbnB1dCB0eXBlPVwiZmlsZVwiIG5hbWU9XCJtb2RlbEZpbGVzXCIgbXVsdGlwbGU9XCJtdWx0aXBsZVwiIHN0eWxlPVwiZGlzcGxheTpub25lXCI+PC9pbnB1dD4nKVxyXG4gICAgdmFyIG1vZGVsRWRpdG9yQnRuID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1jYXJkIHczLWRlZXAtb3JhbmdlIHczLWhvdmVyLWxpZ2h0LWdyZWVuXCIgc3R5bGU9XCJoZWlnaHQ6MTAwJVwiPkNyZWF0ZSBNb2RlbDwvYnV0dG9uPicpXHJcbiAgICB2YXIgZXhwb3J0TW9kZWxCdG4gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWNhcmQgdzMtZGVlcC1vcmFuZ2UgdzMtaG92ZXItbGlnaHQtZ3JlZW5cIiBzdHlsZT1cImhlaWdodDoxMDAlXCI+RG93bmxvYWQgTW9kZWxzPC9idXR0b24+JylcclxuICAgIHRoaXMuY29udGVudERPTS5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKGltcG9ydE1vZGVsc0J0bixhY3R1YWxJbXBvcnRNb2RlbHNCdG4sIG1vZGVsRWRpdG9yQnRuLGV4cG9ydE1vZGVsQnRuKVxyXG4gICAgaW1wb3J0TW9kZWxzQnRuLm9uKFwiY2xpY2tcIiwgKCk9PntcclxuICAgICAgICBhY3R1YWxJbXBvcnRNb2RlbHNCdG4udHJpZ2dlcignY2xpY2snKTtcclxuICAgIH0pO1xyXG4gICAgYWN0dWFsSW1wb3J0TW9kZWxzQnRuLmNoYW5nZShhc3luYyAoZXZ0KT0+e1xyXG4gICAgICAgIHZhciBmaWxlcyA9IGV2dC50YXJnZXQuZmlsZXM7IC8vIEZpbGVMaXN0IG9iamVjdFxyXG4gICAgICAgIGF3YWl0IHRoaXMucmVhZE1vZGVsRmlsZXNDb250ZW50QW5kSW1wb3J0KGZpbGVzKVxyXG4gICAgICAgIGFjdHVhbEltcG9ydE1vZGVsc0J0bi52YWwoXCJcIilcclxuICAgIH0pXHJcbiAgICBtb2RlbEVkaXRvckJ0bi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICB0aGlzLkRPTS5oaWRlKClcclxuICAgICAgICBtb2RlbEVkaXRvckRpYWxvZy5wb3B1cCgpXHJcbiAgICB9KVxyXG4gICAgZXhwb3J0TW9kZWxCdG4ub24oXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgICAgdmFyIG1vZGVsQXJyPVtdXHJcbiAgICAgICAgZm9yKHZhciBtb2RlbElEIGluIG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVscykgbW9kZWxBcnIucHVzaChKU09OLnBhcnNlKG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXVtcIm9yaWdpbmFsXCJdKSlcclxuICAgICAgICB2YXIgcG9tID0gJChcIjxhPjwvYT5cIilcclxuICAgICAgICBwb20uYXR0cignaHJlZicsICdkYXRhOnRleHQvcGxhaW47Y2hhcnNldD11dGYtOCwnICsgZW5jb2RlVVJJQ29tcG9uZW50KEpTT04uc3RyaW5naWZ5KG1vZGVsQXJyKSkpO1xyXG4gICAgICAgIHBvbS5hdHRyKCdkb3dubG9hZCcsIFwiZXhwb3J0TW9kZWxzLmpzb25cIik7XHJcbiAgICAgICAgcG9tWzBdLmNsaWNrKClcclxuICAgIH0pXHJcblxyXG4gICAgdmFyIHJvdzI9JCgnPGRpdiBjbGFzcz1cInczLWNlbGwtcm93XCIgc3R5bGU9XCJtYXJnaW4tdG9wOjJweFwiPjwvZGl2PicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKHJvdzIpXHJcbiAgICB2YXIgbGVmdFNwYW49JCgnPGRpdiBjbGFzcz1cInczLWNlbGxcIiBzdHlsZT1cIndpZHRoOjI0MHB4O3BhZGRpbmctcmlnaHQ6NXB4XCI+PC9kaXY+JylcclxuICAgIHJvdzIuYXBwZW5kKGxlZnRTcGFuKVxyXG4gICAgbGVmdFNwYW4uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6MzBweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiXCI+TW9kZWxzPC9kaXY+PC9kaXY+JykpXHJcbiAgICBcclxuICAgIHZhciBtb2RlbExpc3QgPSAkKCc8dWwgY2xhc3M9XCJ3My11bCB3My1ob3ZlcmFibGVcIj4nKVxyXG4gICAgbW9kZWxMaXN0LmNzcyh7XCJvdmVyZmxvdy14XCI6XCJoaWRkZW5cIixcIm92ZXJmbG93LXlcIjpcImF1dG9cIixcImhlaWdodFwiOlwiNDIwcHhcIiwgXCJib3JkZXJcIjpcInNvbGlkIDFweCBsaWdodGdyYXlcIn0pXHJcbiAgICBsZWZ0U3Bhbi5hcHBlbmQobW9kZWxMaXN0KVxyXG4gICAgdGhpcy5tb2RlbExpc3QgPSBtb2RlbExpc3Q7XHJcbiAgICBcclxuICAgIHZhciByaWdodFNwYW49JCgnPGRpdiBjbGFzcz1cInczLWNvbnRhaW5lciB3My1jZWxsXCIgc3R5bGU9XCJwYWRkaW5nOjBweFwiPjwvZGl2PicpXHJcbiAgICByb3cyLmFwcGVuZChyaWdodFNwYW4pIFxyXG4gICAgdmFyIHBhbmVsQ2FyZE91dD0kKCc8ZGl2IGNsYXNzPVwidzMtY2FyZC0yIHczLXdoaXRlXCIgc3R5bGU9XCJtYXJnaW4tdG9wOjJweFwiPjwvZGl2PicpXHJcblxyXG4gICAgdGhpcy5tb2RlbEJ1dHRvbkJhcj0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCIgc3R5bGU9XCJoZWlnaHQ6MzVweFwiPjwvZGl2PicpXHJcbiAgICBwYW5lbENhcmRPdXQuYXBwZW5kKHRoaXMubW9kZWxCdXR0b25CYXIpXHJcblxyXG4gICAgcmlnaHRTcGFuLmFwcGVuZChwYW5lbENhcmRPdXQpXHJcbiAgICB2YXIgcGFuZWxDYXJkPSQoJzxkaXYgc3R5bGU9XCJ3aWR0aDo0MTBweDtoZWlnaHQ6NDEycHg7b3ZlcmZsb3c6YXV0bzttYXJnaW4tdG9wOjJweFwiPjwvZGl2PicpXHJcbiAgICBwYW5lbENhcmRPdXQuYXBwZW5kKHBhbmVsQ2FyZClcclxuICAgIHRoaXMucGFuZWxDYXJkPXBhbmVsQ2FyZDtcclxuXHJcbiAgICB0aGlzLm1vZGVsQnV0dG9uQmFyLmVtcHR5KClcclxuICAgIHBhbmVsQ2FyZC5odG1sKFwiPGEgc3R5bGU9J2Rpc3BsYXk6YmxvY2s7Zm9udC1zdHlsZTppdGFsaWM7Y29sb3I6Z3JheTtwYWRkaW5nLWxlZnQ6NXB4Jz5DaG9vc2UgYSBtb2RlbCB0byB2aWV3IGluZm9tcmF0aW9uPC9hPlwiKVxyXG5cclxuICAgIHRoaXMubGlzdE1vZGVscygpXHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUucmVzaXplSW1nRmlsZSA9IGFzeW5jIGZ1bmN0aW9uKHRoZUZpbGUsbWF4X3NpemUpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XHJcbiAgICAgICAgICAgIHZhciB0bXBJbWcgPSBuZXcgSW1hZ2UoKTtcclxuICAgICAgICAgICAgcmVhZGVyLm9ubG9hZCA9ICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRtcEltZy5vbmxvYWQgPSAgKCk9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHdpZHRoID0gdG1wSW1nLndpZHRoXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGhlaWdodCA9IHRtcEltZy5oZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHdpZHRoID4gaGVpZ2h0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3aWR0aCA+IG1heF9zaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQgKj0gbWF4X3NpemUgLyB3aWR0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoID0gbWF4X3NpemU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGVpZ2h0ID4gbWF4X3NpemUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoICo9IG1heF9zaXplIC8gaGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ID0gbWF4X3NpemU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgY2FudmFzLndpZHRoID0gd2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FudmFzLmhlaWdodCA9IGhlaWdodDtcclxuICAgICAgICAgICAgICAgICAgICBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKS5kcmF3SW1hZ2UodG1wSW1nLCAwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZGF0YVVybCA9IGNhbnZhcy50b0RhdGFVUkwoJ2ltYWdlL3BuZycpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZGF0YVVybClcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRtcEltZy5zcmMgPSByZWFkZXIucmVzdWx0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKHRoZUZpbGUpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgcmVqZWN0KGUpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5maWxsUmlnaHRTcGFuPWFzeW5jIGZ1bmN0aW9uKG1vZGVsSUQpe1xyXG4gICAgdGhpcy5wYW5lbENhcmQuZW1wdHkoKVxyXG4gICAgdGhpcy5tb2RlbEJ1dHRvbkJhci5lbXB0eSgpXHJcblxyXG4gICAgdmFyIGRlbEJ0biA9ICQoJzxidXR0b24gc3R5bGU9XCJtYXJnaW4tYm90dG9tOjJweFwiIGNsYXNzPVwidzMtYnV0dG9uIHczLWxpZ2h0LWdyYXkgdzMtaG92ZXItcGluayB3My1ib3JkZXItcmlnaHRcIj5EZWxldGUgTW9kZWw8L2J1dHRvbj4nKVxyXG4gICAgdmFyIGltcG9ydFBpY0J0biA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtbGlnaHQtZ3JheSB3My1ob3Zlci1hbWJlciB3My1ib3JkZXItcmlnaHRcIj5VcGxvYWQgQXZhcnRhPC9idXR0b24+JylcclxuICAgIHZhciBhY3R1YWxJbXBvcnRQaWNCdG4gPSQoJzxpbnB1dCB0eXBlPVwiZmlsZVwiIG5hbWU9XCJpbWdcIiBzdHlsZT1cImRpc3BsYXk6bm9uZVwiPjwvaW5wdXQ+JylcclxuICAgIHZhciBjbGVhckF2YXJ0YUJ0biA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtbGlnaHQtZ3JheSB3My1ob3Zlci1waW5rIHczLWJvcmRlci1yaWdodFwiPkNsZWFyIEF2YXJ0YTwvYnV0dG9uPicpXHJcbiAgICB0aGlzLm1vZGVsQnV0dG9uQmFyLmFwcGVuZChkZWxCdG4saW1wb3J0UGljQnRuLGFjdHVhbEltcG9ydFBpY0J0bixjbGVhckF2YXJ0YUJ0bilcclxuXHJcbiAgICBpbXBvcnRQaWNCdG4ub24oXCJjbGlja1wiLCAoKT0+e1xyXG4gICAgICAgIGFjdHVhbEltcG9ydFBpY0J0bi50cmlnZ2VyKCdjbGljaycpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgYWN0dWFsSW1wb3J0UGljQnRuLmNoYW5nZShhc3luYyAoZXZ0KT0+e1xyXG4gICAgICAgIHZhciBmaWxlcyA9IGV2dC50YXJnZXQuZmlsZXM7IC8vIEZpbGVMaXN0IG9iamVjdFxyXG4gICAgICAgIHZhciB0aGVGaWxlPWZpbGVzWzBdXHJcbiAgICAgICAgdmFyIGRhdGFVcmw9IGF3YWl0IHRoaXMucmVzaXplSW1nRmlsZSh0aGVGaWxlLDcwKVxyXG4gICAgICAgIGlmKHRoaXMuYXZhcnRhSW1nKSB0aGlzLmF2YXJ0YUltZy5hdHRyKFwic3JjXCIsZGF0YVVybClcclxuXHJcbiAgICAgICAgdmFyIHZpc3VhbEpzb249Z2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltcImRlZmF1bHRcIl1cclxuICAgICAgICBpZighdmlzdWFsSnNvblttb2RlbElEXSkgdmlzdWFsSnNvblttb2RlbElEXT17fVxyXG4gICAgICAgIHZpc3VhbEpzb25bbW9kZWxJRF0uYXZhcnRhPWRhdGFVcmxcclxuICAgICAgICB0aGlzLnNhdmVWaXN1YWxEZWZpbml0aW9uKClcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJ2aXN1YWxEZWZpbml0aW9uQ2hhbmdlXCIsIFwibW9kZWxJRFwiOm1vZGVsSUQsXCJhdmFydGFcIjpkYXRhVXJsIH0pXHJcbiAgICAgICAgYWN0dWFsSW1wb3J0UGljQnRuLnZhbChcIlwiKVxyXG4gICAgfSlcclxuXHJcbiAgICBjbGVhckF2YXJ0YUJ0bi5vbihcImNsaWNrXCIsICgpPT57XHJcbiAgICAgICAgdmFyIHZpc3VhbEpzb249Z2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltcImRlZmF1bHRcIl1cclxuICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdKSBkZWxldGUgdmlzdWFsSnNvblttb2RlbElEXS5hdmFydGEgXHJcbiAgICAgICAgaWYodGhpcy5hdmFydGFJbWcpIHRoaXMuYXZhcnRhSW1nLnJlbW92ZUF0dHIoJ3NyYycpO1xyXG4gICAgICAgIHRoaXMuc2F2ZVZpc3VhbERlZmluaXRpb24oKVxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIiwgXCJtb2RlbElEXCI6bW9kZWxJRCxcIm5vQXZhcnRhXCI6dHJ1ZSB9KVxyXG4gICAgfSk7XHJcblxyXG5cclxuICAgIGRlbEJ0bi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICB2YXIgY29uZmlybURpYWxvZ0RpdiA9IG5ldyBzaW1wbGVDb25maXJtRGlhbG9nKClcclxuXHJcbiAgICAgICAgLy9jaGVjayBob3cgbWFueSB0d2lucyBhcmUgdW5kZXIgdGhpcyBtb2RlbCBJRFxyXG4gICAgICAgIHZhciBudW1iZXJPZlR3aW5zPTBcclxuICAgICAgICBnbG9iYWxDYWNoZS5EQlR3aW5zQXJyLmZvckVhY2gob25lREJUd2luPT57XHJcbiAgICAgICAgICAgIGlmKG9uZURCVHdpbltcIm1vZGVsSURcIl09PW1vZGVsSUQpIG51bWJlck9mVHdpbnMrK1xyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIHZhciBjb250ZW50U3RyPVwiVGhpcyB3aWxsIERFTEVURSBtb2RlbCBcXFwiXCIgKyBtb2RlbElEICsgXCJcXFwiLiBcIlxyXG4gICAgICAgIGNvbnRlbnRTdHIrPVwiKFRoZXJlIFwiKygobnVtYmVyT2ZUd2lucz4xKT8oXCJhcmUgXCIrbnVtYmVyT2ZUd2lucytcIiB0d2luc1wiKTooXCJpcyBcIitudW1iZXJPZlR3aW5zK1wiIHR3aW5cIikgKSArIFwiIG9mIHRoaXMgbW9kZWwuXCJcclxuICAgICAgICBpZihudW1iZXJPZlR3aW5zPjApIGNvbnRlbnRTdHIrPVwiIFlvdSBtYXkgc3RpbGwgZGVsZXRlIHRoZSBtb2RlbCwgYnV0IHBsZWFzZSBpbXBvcnQgYSBtb2RlbCB3aXRoIHRoaXMgbW9kZWxJRCB0byBlbnN1cmUgbm9ybWFsIG9wZXJhdGlvbilcIlxyXG4gICAgICAgIGVsc2UgY29udGVudFN0cis9XCIpXCJcclxuICAgICAgICBjb25maXJtRGlhbG9nRGl2LnNob3coXHJcbiAgICAgICAgICAgIHsgd2lkdGg6IFwiMzUwcHhcIiB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogXCJXYXJuaW5nXCJcclxuICAgICAgICAgICAgICAgICwgY29udGVudDogY29udGVudFN0clxyXG4gICAgICAgICAgICAgICAgLCBidXR0b25zOiBbXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvckNsYXNzOiBcInczLXJlZCB3My1ob3Zlci1waW5rXCIsIHRleHQ6IFwiQ29uZmlybVwiLCBcImNsaWNrRnVuY1wiOiBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vZGVsZXRlTW9kZWxcIiwgXCJQT1NUXCIsIHsgXCJtb2RlbFwiOiBtb2RlbElEIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudHJlZS5kZWxldGVMZWFmTm9kZShnbG9iYWxDYWNoZS5tb2RlbElETWFwVG9OYW1lW21vZGVsSURdKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcIkFEVE1vZGVsc0NoYW5nZVwifSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBhbmVsQ2FyZC5lbXB0eSgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9UT0RPOiBjbGVhciB0aGUgdmlzdWFsaXphdGlvbiBzZXR0aW5nIG9mIHRoaXMgZGVsZXRlZCBtb2RlbFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8qXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdW21vZGVsSURdKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW1wiZGVmYXVsdFwiXVttb2RlbElEXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNhdmVWaXN1YWxEZWZpbml0aW9uKClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9Ki9cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1jYXRjaChlKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvckNsYXNzOiBcInczLWdyYXlcIiwgdGV4dDogXCJDYW5jZWxcIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICApXHJcbiAgICAgICAgXHJcbiAgICB9KVxyXG4gICAgXHJcbiAgICB2YXIgVmlzdWFsaXphdGlvbkRPTT10aGlzLmFkZEFQYXJ0SW5SaWdodFNwYW4oXCJWaXN1YWxpemF0aW9uXCIpXHJcbiAgICB2YXIgZWRpdGFibGVQcm9wZXJ0aWVzRE9NPXRoaXMuYWRkQVBhcnRJblJpZ2h0U3BhbihcIkVkaXRhYmxlIFByb3BlcnRpZXMgQW5kIFJlbGF0aW9uc2hpcHNcIilcclxuICAgIHZhciBiYXNlQ2xhc3Nlc0RPTT10aGlzLmFkZEFQYXJ0SW5SaWdodFNwYW4oXCJCYXNlIENsYXNzZXNcIilcclxuICAgIHZhciBvcmlnaW5hbERlZmluaXRpb25ET009dGhpcy5hZGRBUGFydEluUmlnaHRTcGFuKFwiT3JpZ2luYWwgRGVmaW5pdGlvblwiKVxyXG5cclxuICAgIHZhciBzdHI9SlNPTi5zdHJpbmdpZnkoSlNPTi5wYXJzZShtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF1bXCJvcmlnaW5hbFwiXSksbnVsbCwyKVxyXG4gICAgb3JpZ2luYWxEZWZpbml0aW9uRE9NLmFwcGVuZCgkKCc8cHJlIGlkPVwianNvblwiPicrc3RyKyc8L3ByZT4nKSlcclxuXHJcbiAgICB2YXIgZWRpdHRhYmxlUHJvcGVydGllcz1tb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF0uZWRpdGFibGVQcm9wZXJ0aWVzXHJcbiAgICB0aGlzLmZpbGxFZGl0YWJsZVByb3BlcnRpZXMoZWRpdHRhYmxlUHJvcGVydGllcyxlZGl0YWJsZVByb3BlcnRpZXNET00pXHJcbiAgICB2YXIgdmFsaWRSZWxhdGlvbnNoaXBzPW1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXS52YWxpZFJlbGF0aW9uc2hpcHNcclxuICAgIHRoaXMuZmlsbFJlbGF0aW9uc2hpcEluZm8odmFsaWRSZWxhdGlvbnNoaXBzLGVkaXRhYmxlUHJvcGVydGllc0RPTSlcclxuXHJcbiAgICB0aGlzLmZpbGxWaXN1YWxpemF0aW9uKG1vZGVsSUQsVmlzdWFsaXphdGlvbkRPTSlcclxuXHJcbiAgICB0aGlzLmZpbGxCYXNlQ2xhc3Nlcyhtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF0uYWxsQmFzZUNsYXNzZXMsYmFzZUNsYXNzZXNET00pIFxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLmZpbGxCYXNlQ2xhc3Nlcz1mdW5jdGlvbihiYXNlQ2xhc3NlcyxwYXJlbnREb20pe1xyXG4gICAgZm9yKHZhciBpbmQgaW4gYmFzZUNsYXNzZXMpe1xyXG4gICAgICAgIHZhciBrZXlEaXY9ICQoXCI8bGFiZWwgc3R5bGU9J2Rpc3BsYXk6YmxvY2s7cGFkZGluZzouMWVtJz5cIitpbmQrXCI8L2xhYmVsPlwiKVxyXG4gICAgICAgIHBhcmVudERvbS5hcHBlbmQoa2V5RGl2KVxyXG4gICAgfVxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLmZpbGxWaXN1YWxpemF0aW9uPWZ1bmN0aW9uKG1vZGVsSUQscGFyZW50RG9tKXtcclxuICAgIHZhciBtb2RlbEpzb249bW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdO1xyXG4gICAgdmFyIGFUYWJsZT0kKFwiPHRhYmxlIHN0eWxlPSd3aWR0aDoxMDAlJz48L3RhYmxlPlwiKVxyXG4gICAgYVRhYmxlLmh0bWwoJzx0cj48dGQ+PC90ZD48dGQ+PC90ZD48L3RyPicpXHJcbiAgICBwYXJlbnREb20uYXBwZW5kKGFUYWJsZSkgXHJcblxyXG4gICAgdmFyIGxlZnRQYXJ0PWFUYWJsZS5maW5kKFwidGQ6Zmlyc3RcIilcclxuICAgIHZhciByaWdodFBhcnQ9YVRhYmxlLmZpbmQoXCJ0ZDpudGgtY2hpbGQoMilcIilcclxuICAgIHJpZ2h0UGFydC5jc3Moe1wid2lkdGhcIjpcIjUwcHhcIixcImhlaWdodFwiOlwiNTBweFwiLFwiYm9yZGVyXCI6XCJzb2xpZCAxcHggbGlnaHRHcmF5XCJ9KVxyXG4gICAgXHJcbiAgICB2YXIgYXZhcnRhSW1nPSQoXCI8aW1nPjwvaW1nPlwiKVxyXG4gICAgcmlnaHRQYXJ0LmFwcGVuZChhdmFydGFJbWcpXHJcbiAgICB2YXIgdmlzdWFsSnNvbj1nbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW1wiZGVmYXVsdFwiXVxyXG4gICAgaWYodmlzdWFsSnNvbiAmJiB2aXN1YWxKc29uW21vZGVsSURdICYmIHZpc3VhbEpzb25bbW9kZWxJRF0uYXZhcnRhKSBhdmFydGFJbWcuYXR0cignc3JjJyx2aXN1YWxKc29uW21vZGVsSURdLmF2YXJ0YSlcclxuICAgIHRoaXMuYXZhcnRhSW1nPWF2YXJ0YUltZztcclxuXHJcbiAgICBcclxuICAgIHRoaXMuYWRkT25lVmlzdWFsaXphdGlvblJvdyhtb2RlbElELGxlZnRQYXJ0KVxyXG4gICAgZm9yKHZhciBpbmQgaW4gbW9kZWxKc29uLnZhbGlkUmVsYXRpb25zaGlwcyl7XHJcbiAgICAgICAgdGhpcy5hZGRPbmVWaXN1YWxpemF0aW9uUm93KG1vZGVsSUQsbGVmdFBhcnQsaW5kKVxyXG4gICAgfVxyXG59XHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuYWRkT25lVmlzdWFsaXphdGlvblJvdz1mdW5jdGlvbihtb2RlbElELHBhcmVudERvbSxyZWxhdGluc2hpcE5hbWUpe1xyXG4gICAgaWYocmVsYXRpbnNoaXBOYW1lPT1udWxsKSB2YXIgbmFtZVN0cj1cIuKXr1wiIC8vdmlzdWFsIGZvciBub2RlXHJcbiAgICBlbHNlIG5hbWVTdHI9XCLin5wgXCIrcmVsYXRpbnNoaXBOYW1lXHJcbiAgICB2YXIgY29udGFpbmVyRGl2PSQoXCI8ZGl2IHN0eWxlPSdwYWRkaW5nLWJvdHRvbTo4cHgnPjwvZGl2PlwiKVxyXG4gICAgcGFyZW50RG9tLmFwcGVuZChjb250YWluZXJEaXYpXHJcbiAgICB2YXIgY29udGVudERPTT0kKFwiPGxhYmVsIHN0eWxlPSdtYXJnaW4tcmlnaHQ6MTBweCc+XCIrbmFtZVN0citcIjwvbGFiZWw+XCIpXHJcbiAgICBjb250YWluZXJEaXYuYXBwZW5kKGNvbnRlbnRET00pXHJcblxyXG4gICAgdmFyIGRlZmluZWRDb2xvcj1udWxsXHJcbiAgICB2YXIgZGVmaW5lZFNoYXBlPW51bGxcclxuICAgIHZhciB2aXN1YWxKc29uPWdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdXHJcbiAgICBpZihyZWxhdGluc2hpcE5hbWU9PW51bGwpe1xyXG4gICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF0gJiYgdmlzdWFsSnNvblttb2RlbElEXS5jb2xvcikgZGVmaW5lZENvbG9yPXZpc3VhbEpzb25bbW9kZWxJRF0uY29sb3JcclxuICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdICYmIHZpc3VhbEpzb25bbW9kZWxJRF0uc2hhcGUpIGRlZmluZWRTaGFwZT12aXN1YWxKc29uW21vZGVsSURdLnNoYXBlXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICBpZiAodmlzdWFsSnNvblttb2RlbElEXSAmJiB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXSAmJiB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdKSB7XHJcbiAgICAgICAgICAgIGlmICh2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdLmNvbG9yKSBkZWZpbmVkQ29sb3IgPSB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdLmNvbG9yXHJcbiAgICAgICAgICAgIGlmICh2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdLnNoYXBlKSBkZWZpbmVkU2hhcGUgPSB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdLnNoYXBlXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHZhciBjb2xvclNlbGVjdG9yPSQoJzxzZWxlY3QgY2xhc3M9XCJ3My1ib3JkZXJcIiBzdHlsZT1cIm91dGxpbmU6bm9uZVwiPjwvc2VsZWN0PicpXHJcbiAgICBjb250YWluZXJEaXYuYXBwZW5kKGNvbG9yU2VsZWN0b3IpXHJcbiAgICB2YXIgY29sb3JBcnI9W1wiQmxhY2tcIixcIkxpZ2h0R3JheVwiLFwiUmVkXCIsXCJHcmVlblwiLFwiQmx1ZVwiLFwiQmlzcXVlXCIsXCJCcm93blwiLFwiQ29yYWxcIixcIkNyaW1zb25cIixcIkRvZGdlckJsdWVcIixcIkdvbGRcIl1cclxuICAgIGNvbG9yQXJyLmZvckVhY2goKG9uZUNvbG9yQ29kZSk9PntcclxuICAgICAgICB2YXIgYW5PcHRpb249JChcIjxvcHRpb24gdmFsdWU9J1wiK29uZUNvbG9yQ29kZStcIic+XCIrb25lQ29sb3JDb2RlK1wi4panPC9vcHRpb24+XCIpXHJcbiAgICAgICAgY29sb3JTZWxlY3Rvci5hcHBlbmQoYW5PcHRpb24pXHJcbiAgICAgICAgYW5PcHRpb24uY3NzKFwiY29sb3JcIixvbmVDb2xvckNvZGUpXHJcbiAgICB9KVxyXG4gICAgaWYoZGVmaW5lZENvbG9yIT1udWxsKSB7XHJcbiAgICAgICAgY29sb3JTZWxlY3Rvci52YWwoZGVmaW5lZENvbG9yKVxyXG4gICAgICAgIGNvbG9yU2VsZWN0b3IuY3NzKFwiY29sb3JcIixkZWZpbmVkQ29sb3IpXHJcbiAgICB9XHJcbiAgICBjb2xvclNlbGVjdG9yLmNoYW5nZSgoZXZlKT0+e1xyXG4gICAgICAgIHZhciBzZWxlY3RDb2xvckNvZGU9ZXZlLnRhcmdldC52YWx1ZVxyXG4gICAgICAgIGNvbG9yU2VsZWN0b3IuY3NzKFwiY29sb3JcIixzZWxlY3RDb2xvckNvZGUpXHJcbiAgICAgICAgdmFyIHZpc3VhbEpzb249Z2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltcImRlZmF1bHRcIl1cclxuXHJcbiAgICAgICAgaWYoIXZpc3VhbEpzb25bbW9kZWxJRF0pIHZpc3VhbEpzb25bbW9kZWxJRF09e31cclxuICAgICAgICBpZighcmVsYXRpbnNoaXBOYW1lKSB7XHJcbiAgICAgICAgICAgIHZpc3VhbEpzb25bbW9kZWxJRF0uY29sb3I9c2VsZWN0Q29sb3JDb2RlXHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIiwgXCJtb2RlbElEXCI6bW9kZWxJRCxcImNvbG9yXCI6c2VsZWN0Q29sb3JDb2RlIH0pXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIGlmKCF2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXSkgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl09e31cclxuICAgICAgICAgICAgaWYoIXZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0pIHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV09e31cclxuICAgICAgICAgICAgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXS5jb2xvcj1zZWxlY3RDb2xvckNvZGVcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwidmlzdWFsRGVmaW5pdGlvbkNoYW5nZVwiLCBcInNyY01vZGVsSURcIjptb2RlbElELFwicmVsYXRpb25zaGlwTmFtZVwiOnJlbGF0aW5zaGlwTmFtZSxcImNvbG9yXCI6c2VsZWN0Q29sb3JDb2RlIH0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuc2F2ZVZpc3VhbERlZmluaXRpb24oKVxyXG4gICAgfSlcclxuICAgIHZhciBzaGFwZVNlbGVjdG9yID0gJCgnPHNlbGVjdCBjbGFzcz1cInczLWJvcmRlclwiIHN0eWxlPVwib3V0bGluZTpub25lXCI+PC9zZWxlY3Q+JylcclxuICAgIGNvbnRhaW5lckRpdi5hcHBlbmQoc2hhcGVTZWxlY3RvcilcclxuICAgIGlmKHJlbGF0aW5zaGlwTmFtZT09bnVsbCl7XHJcbiAgICAgICAgc2hhcGVTZWxlY3Rvci5hcHBlbmQoJChcIjxvcHRpb24gdmFsdWU9J2VsbGlwc2UnPuKXrzwvb3B0aW9uPlwiKSlcclxuICAgICAgICBzaGFwZVNlbGVjdG9yLmFwcGVuZCgkKFwiPG9wdGlvbiB2YWx1ZT0ncm91bmQtcmVjdGFuZ2xlJyBzdHlsZT0nZm9udC1zaXplOjEyMCUnPuKWojwvb3B0aW9uPlwiKSlcclxuICAgICAgICBzaGFwZVNlbGVjdG9yLmFwcGVuZCgkKFwiPG9wdGlvbiB2YWx1ZT0naGV4YWdvbicgc3R5bGU9J2ZvbnQtc2l6ZToxMzAlJz7irKE8L29wdGlvbj5cIikpXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICBzaGFwZVNlbGVjdG9yLmFwcGVuZCgkKFwiPG9wdGlvbiB2YWx1ZT0nc29saWQnPuKGkjwvb3B0aW9uPlwiKSlcclxuICAgICAgICBzaGFwZVNlbGVjdG9yLmFwcGVuZCgkKFwiPG9wdGlvbiB2YWx1ZT0nZG90dGVkJz7ih6I8L29wdGlvbj5cIikpXHJcbiAgICB9XHJcbiAgICBpZihkZWZpbmVkU2hhcGUhPW51bGwpIHtcclxuICAgICAgICBzaGFwZVNlbGVjdG9yLnZhbChkZWZpbmVkU2hhcGUpXHJcbiAgICB9XHJcbiAgICBzaGFwZVNlbGVjdG9yLmNoYW5nZSgoZXZlKT0+e1xyXG4gICAgICAgIHZhciBzZWxlY3RTaGFwZT1ldmUudGFyZ2V0LnZhbHVlXHJcbiAgICAgICAgdmFyIHZpc3VhbEpzb24gPSBnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW1wiZGVmYXVsdFwiXVxyXG5cclxuICAgICAgICBpZighdmlzdWFsSnNvblttb2RlbElEXSkgdmlzdWFsSnNvblttb2RlbElEXT17fVxyXG4gICAgICAgIGlmKCFyZWxhdGluc2hpcE5hbWUpIHtcclxuICAgICAgICAgICAgdmlzdWFsSnNvblttb2RlbElEXS5zaGFwZT1zZWxlY3RTaGFwZVxyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJ2aXN1YWxEZWZpbml0aW9uQ2hhbmdlXCIsIFwibW9kZWxJRFwiOm1vZGVsSUQsXCJzaGFwZVwiOnNlbGVjdFNoYXBlIH0pXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIGlmKCF2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXSkgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl09e31cclxuICAgICAgICAgICAgaWYoIXZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0pIHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV09e31cclxuICAgICAgICAgICAgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXS5zaGFwZT1zZWxlY3RTaGFwZVxyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJ2aXN1YWxEZWZpbml0aW9uQ2hhbmdlXCIsIFwic3JjTW9kZWxJRFwiOm1vZGVsSUQsXCJyZWxhdGlvbnNoaXBOYW1lXCI6cmVsYXRpbnNoaXBOYW1lLFwic2hhcGVcIjpzZWxlY3RTaGFwZSB9KVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnNhdmVWaXN1YWxEZWZpbml0aW9uKClcclxuICAgIH0pXHJcbiAgICBcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5zYXZlVmlzdWFsRGVmaW5pdGlvbj1hc3luYyBmdW5jdGlvbigpe1xyXG4gICAgdHJ5e1xyXG4gICAgICAgIGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL3NhdmVWaXN1YWxEZWZpbml0aW9uXCIsIFwiUE9TVFwiLCB7XCJ2aXN1YWxEZWZpbml0aW9uSnNvblwiOkpTT04uc3RyaW5naWZ5KGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdKX0pXHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuZmlsbFJlbGF0aW9uc2hpcEluZm89ZnVuY3Rpb24odmFsaWRSZWxhdGlvbnNoaXBzLHBhcmVudERvbSl7XHJcbiAgICBmb3IodmFyIGluZCBpbiB2YWxpZFJlbGF0aW9uc2hpcHMpe1xyXG4gICAgICAgIHZhciBrZXlEaXY9ICQoXCI8bGFiZWwgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO3BhZGRpbmc6LjFlbSAuM2VtIC4xZW0gLjNlbTttYXJnaW4tcmlnaHQ6LjNlbSc+XCIraW5kK1wiPC9sYWJlbD5cIilcclxuICAgICAgICBwYXJlbnREb20uYXBwZW5kKGtleURpdilcclxuICAgICAgICBrZXlEaXYuY3NzKFwicGFkZGluZy10b3BcIixcIi4xZW1cIilcclxuICAgICAgICB2YXIgbGFiZWw9JChcIjxsYWJlbCBzdHlsZT0nZGlzcGxheTppbmxpbmU7YmFja2dyb3VuZC1jb2xvcjp5ZWxsb3dncmVlbjtjb2xvcjp3aGl0ZTtmb250LXNpemU6OXB4O3BhZGRpbmc6MnB4Jz5SZWxhdGlvbnNoaXAgdHlwZTwvbGFiZWw+XCIpXHJcbiAgICAgICAgcGFyZW50RG9tLmFwcGVuZChsYWJlbClcclxuICAgICAgICB2YXIgY29udGVudERPTT0kKFwiPGxhYmVsPjwvbGFiZWw+XCIpXHJcbiAgICAgICAgY29udGVudERPTS5jc3MoXCJkaXNwbGF5XCIsXCJibG9ja1wiKVxyXG4gICAgICAgIGNvbnRlbnRET00uY3NzKFwicGFkZGluZy1sZWZ0XCIsXCIxZW1cIilcclxuICAgICAgICBwYXJlbnREb20uYXBwZW5kKGNvbnRlbnRET00pXHJcbiAgICAgICAgdGhpcy5maWxsRWRpdGFibGVQcm9wZXJ0aWVzKHZhbGlkUmVsYXRpb25zaGlwc1tpbmRdLmVkaXRhYmxlUmVsYXRpb25zaGlwUHJvcGVydGllcywgY29udGVudERPTSlcclxuICAgIH1cclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5maWxsRWRpdGFibGVQcm9wZXJ0aWVzPWZ1bmN0aW9uKGpzb25JbmZvLHBhcmVudERvbSl7XHJcbiAgICBmb3IodmFyIGluZCBpbiBqc29uSW5mbyl7XHJcbiAgICAgICAgdmFyIGtleURpdj0gJChcIjxsYWJlbCBzdHlsZT0nZGlzcGxheTpibG9jayc+PGRpdiBzdHlsZT0nZGlzcGxheTppbmxpbmU7cGFkZGluZzouMWVtIC4zZW0gLjFlbSAuM2VtO21hcmdpbi1yaWdodDouM2VtJz5cIitpbmQrXCI8L2Rpdj48L2xhYmVsPlwiKVxyXG4gICAgICAgIHBhcmVudERvbS5hcHBlbmQoa2V5RGl2KVxyXG4gICAgICAgIGtleURpdi5jc3MoXCJwYWRkaW5nLXRvcFwiLFwiLjFlbVwiKVxyXG5cclxuICAgICAgICB2YXIgY29udGVudERPTT0kKFwiPGxhYmVsPjwvbGFiZWw+XCIpXHJcbiAgICAgICAgaWYoQXJyYXkuaXNBcnJheShqc29uSW5mb1tpbmRdKSl7XHJcbiAgICAgICAgICAgIGNvbnRlbnRET00udGV4dChcImVudW1cIilcclxuICAgICAgICAgICAgY29udGVudERPTS5jc3Moe1wiYmFja2dyb3VuZC1jb2xvclwiOlwiZGFya0dyYXlcIixcImNvbG9yXCI6XCJ3aGl0ZVwiLFwiZm9udFNpemVcIjpcIjlweFwiLFwicGFkZGluZ1wiOicycHgnfSlcclxuICAgICAgICB9ZWxzZSBpZih0eXBlb2YoanNvbkluZm9baW5kXSk9PT1cIm9iamVjdFwiKSB7XHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwiZGlzcGxheVwiLFwiYmxvY2tcIilcclxuICAgICAgICAgICAgY29udGVudERPTS5jc3MoXCJwYWRkaW5nLWxlZnRcIixcIjFlbVwiKVxyXG4gICAgICAgICAgICB0aGlzLmZpbGxFZGl0YWJsZVByb3BlcnRpZXMoanNvbkluZm9baW5kXSxjb250ZW50RE9NKVxyXG4gICAgICAgIH1lbHNlIHtcclxuICAgICAgICAgICAgY29udGVudERPTS50ZXh0KGpzb25JbmZvW2luZF0pXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKHtcImJhY2tncm91bmQtY29sb3JcIjpcImRhcmtHcmF5XCIsXCJjb2xvclwiOlwid2hpdGVcIixcImZvbnRTaXplXCI6XCI5cHhcIixcInBhZGRpbmdcIjonMnB4J30pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGtleURpdi5hcHBlbmQoY29udGVudERPTSlcclxuICAgIH1cclxufVxyXG5cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuYWRkQVBhcnRJblJpZ2h0U3Bhbj1mdW5jdGlvbihwYXJ0TmFtZSl7XHJcbiAgICB2YXIgaGVhZGVyRE9NPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYmxvY2sgdzMtbGlnaHQtZ3JleSB3My1sZWZ0LWFsaWduXCIgc3R5bGU9XCJmb250LXdlaWdodDpib2xkXCI+PC9idXR0b24+JylcclxuICAgIGhlYWRlckRPTS50ZXh0KHBhcnROYW1lKVxyXG4gICAgdmFyIGxpc3RET009JCgnPGRpdiBjbGFzcz1cInczLWNvbnRhaW5lciB3My1oaWRlIHczLWJvcmRlciB3My1zaG93XCIgc3R5bGU9XCJiYWNrZ3JvdW5kLWNvbG9yOndoaXRlXCI+PC9kaXY+JylcclxuICAgIHRoaXMucGFuZWxDYXJkLmFwcGVuZChoZWFkZXJET00sbGlzdERPTSlcclxuXHJcbiAgICBoZWFkZXJET00ub24oXCJjbGlja1wiLChldnQpPT4ge1xyXG4gICAgICAgIGlmKGxpc3RET00uaGFzQ2xhc3MoXCJ3My1zaG93XCIpKSBsaXN0RE9NLnJlbW92ZUNsYXNzKFwidzMtc2hvd1wiKVxyXG4gICAgICAgIGVsc2UgbGlzdERPTS5hZGRDbGFzcyhcInczLXNob3dcIilcclxuIFxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICByZXR1cm4gbGlzdERPTTtcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5yZWFkTW9kZWxGaWxlc0NvbnRlbnRBbmRJbXBvcnQ9YXN5bmMgZnVuY3Rpb24oZmlsZXMpe1xyXG4gICAgLy8gZmlsZXMgaXMgYSBGaWxlTGlzdCBvZiBGaWxlIG9iamVjdHMuIExpc3Qgc29tZSBwcm9wZXJ0aWVzLlxyXG4gICAgdmFyIGZpbGVDb250ZW50QXJyPVtdXHJcbiAgICBmb3IgKHZhciBpID0gMCwgZjsgZiA9IGZpbGVzW2ldOyBpKyspIHtcclxuICAgICAgICAvLyBPbmx5IHByb2Nlc3MganNvbiBmaWxlcy5cclxuICAgICAgICBpZiAoZi50eXBlIT1cImFwcGxpY2F0aW9uL2pzb25cIikgY29udGludWU7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICB2YXIgc3RyPSBhd2FpdCB0aGlzLnJlYWRPbmVGaWxlKGYpXHJcbiAgICAgICAgICAgIHZhciBvYmo9SlNPTi5wYXJzZShzdHIpXHJcbiAgICAgICAgICAgIGlmKEFycmF5LmlzQXJyYXkob2JqKSkgZmlsZUNvbnRlbnRBcnI9ZmlsZUNvbnRlbnRBcnIuY29uY2F0KG9iailcclxuICAgICAgICAgICAgZWxzZSBmaWxlQ29udGVudEFyci5wdXNoKG9iailcclxuICAgICAgICB9Y2F0Y2goZXJyKXtcclxuICAgICAgICAgICAgYWxlcnQoZXJyKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmKGZpbGVDb250ZW50QXJyLmxlbmd0aD09MCkgcmV0dXJuO1xyXG4gICAgdHJ5IHtcclxuICAgICAgICB2YXIgcmVzcG9uc2UgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9pbXBvcnRNb2RlbHNcIiwgXCJQT1NUXCIsIHtcIm1vZGVsc1wiOkpTT04uc3RyaW5naWZ5KGZpbGVDb250ZW50QXJyKX0pXHJcbiAgICAgICAgdGhpcy5saXN0TW9kZWxzKFwic2hvdWxkQnJvYWRDYXN0XCIpXHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICB9ICBcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5yZWFkT25lRmlsZT0gYXN5bmMgZnVuY3Rpb24oYUZpbGUpe1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xyXG4gICAgICAgICAgICByZWFkZXIub25sb2FkID0gKCk9PiB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlYWRlci5yZXN1bHQpXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHJlYWRlci5yZWFkQXNUZXh0KGFGaWxlKTtcclxuICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIHJlamVjdChlKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1cclxuXHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLmxpc3RNb2RlbHM9YXN5bmMgZnVuY3Rpb24oc2hvdWxkQnJvYWRjYXN0KXtcclxuICAgIHRoaXMubW9kZWxMaXN0LmVtcHR5KClcclxuICAgIGF3YWl0IGdsb2JhbENhY2hlLmxvYWRVc2VyRGF0YSgpXHJcblxyXG4gICAgaWYoalF1ZXJ5LmlzRW1wdHlPYmplY3QobW9kZWxBbmFseXplci5EVERMTW9kZWxzKSl7XHJcbiAgICAgICAgdmFyIHplcm9Nb2RlbEl0ZW09JCgnPGxpIHN0eWxlPVwiZm9udC1zaXplOjAuOWVtXCI+emVybyBtb2RlbCByZWNvcmQuIFBsZWFzZSBpbXBvcnQuLi48L2xpPicpXHJcbiAgICAgICAgdGhpcy5tb2RlbExpc3QuYXBwZW5kKHplcm9Nb2RlbEl0ZW0pXHJcbiAgICAgICAgemVyb01vZGVsSXRlbS5jc3MoXCJjdXJzb3JcIixcImRlZmF1bHRcIilcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHRoaXMudHJlZSA9IG5ldyBzaW1wbGVUcmVlKHRoaXMubW9kZWxMaXN0LCB7IFwibGVhZk5hbWVQcm9wZXJ0eVwiOiBcImRpc3BsYXlOYW1lXCJcclxuICAgICAgICAgICAgLCBcIm5vTXVsdGlwbGVTZWxlY3RBbGxvd2VkXCI6IHRydWUsXCJoaWRlRW1wdHlHcm91cFwiOnRydWUgfSlcclxuXHJcbiAgICAgICAgdGhpcy50cmVlLmNhbGxiYWNrX2FmdGVyU2VsZWN0Tm9kZXMgPSAobm9kZXNBcnIsIG1vdXNlQ2xpY2tEZXRhaWwpID0+IHtcclxuICAgICAgICAgICAgdmFyIHRoZU5vZGUgPSBub2Rlc0FyclswXVxyXG4gICAgICAgICAgICB0aGlzLmZpbGxSaWdodFNwYW4odGhlTm9kZS5sZWFmSW5mb1tcIkBpZFwiXSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBncm91cE5hbWVMaXN0ID0ge31cclxuICAgICAgICBmb3IgKHZhciBtb2RlbElEIGluIG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVscykgZ3JvdXBOYW1lTGlzdFt0aGlzLm1vZGVsTmFtZVRvR3JvdXBOYW1lKG1vZGVsSUQpXSA9IDFcclxuICAgICAgICB2YXIgbW9kZWxncm91cFNvcnRBcnIgPSBPYmplY3Qua2V5cyhncm91cE5hbWVMaXN0KVxyXG4gICAgICAgIG1vZGVsZ3JvdXBTb3J0QXJyLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEudG9Mb3dlckNhc2UoKS5sb2NhbGVDb21wYXJlKGIudG9Mb3dlckNhc2UoKSkgfSk7XHJcbiAgICAgICAgbW9kZWxncm91cFNvcnRBcnIuZm9yRWFjaChvbmVHcm91cE5hbWUgPT4ge1xyXG4gICAgICAgICAgICB2YXIgZ249dGhpcy50cmVlLmFkZEdyb3VwTm9kZSh7IGRpc3BsYXlOYW1lOiBvbmVHcm91cE5hbWUgfSlcclxuICAgICAgICAgICAgZ24uZXhwYW5kKClcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICBmb3IgKHZhciBtb2RlbElEIGluIG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVscykge1xyXG4gICAgICAgICAgICB2YXIgZ24gPSB0aGlzLm1vZGVsTmFtZVRvR3JvdXBOYW1lKG1vZGVsSUQpXHJcbiAgICAgICAgICAgIHRoaXMudHJlZS5hZGRMZWFmbm9kZVRvR3JvdXAoZ24sIEpTT04ucGFyc2UobW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdW1wib3JpZ2luYWxcIl0pKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy50cmVlLnNvcnRBbGxMZWF2ZXMoKVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBpZihzaG91bGRCcm9hZGNhc3QpIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcIkFEVE1vZGVsc0NoYW5nZVwifSlcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5tb2RlbE5hbWVUb0dyb3VwTmFtZT1mdW5jdGlvbihtb2RlbE5hbWUpe1xyXG4gICAgdmFyIG5hbWVQYXJ0cz1tb2RlbE5hbWUuc3BsaXQoXCI6XCIpXHJcbiAgICBpZihuYW1lUGFydHMubGVuZ3RoPj0yKSAgcmV0dXJuIG5hbWVQYXJ0c1sxXVxyXG4gICAgZWxzZSByZXR1cm4gXCJPdGhlcnNcIlxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLnJ4TWVzc2FnZT1mdW5jdGlvbihtc2dQYXlsb2FkKXtcclxuICAgIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJBRFRNb2RlbEVkaXRlZFwiKSB0aGlzLmxpc3RNb2RlbHMoXCJzaG91bGRCcm9hZGNhc3RcIilcclxufVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IG1vZGVsTWFuYWdlckRpYWxvZygpOyIsImZ1bmN0aW9uIHNpbXBsZUNvbmZpcm1EaWFsb2coKXtcclxuICAgIHRoaXMuRE9NID0gJCgnPGRpdiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7YmFja2dyb3VuZC1jb2xvcjp3aGl0ZTtsZWZ0OjUwJTt0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSkgdHJhbnNsYXRlWSgtNTAlKTt6LWluZGV4OjEwMlwiIGNsYXNzPVwidzMtY2FyZC00XCI+PC9kaXY+JylcclxuICAgIC8vdGhpcy5ET00uY3NzKFwib3ZlcmZsb3dcIixcImhpZGRlblwiKVxyXG59XHJcblxyXG5zaW1wbGVDb25maXJtRGlhbG9nLnByb3RvdHlwZS5zaG93PWZ1bmN0aW9uKGNzc09wdGlvbnMsb3RoZXJPcHRpb25zKXtcclxuICAgIHRoaXMuRE9NLmNzcyhjc3NPcHRpb25zKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6NDBweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiZm9udC1zaXplOjEuMmVtXCI+JyArIG90aGVyT3B0aW9ucy50aXRsZSArICc8L2Rpdj48L2Rpdj4nKSlcclxuICAgIHZhciBjbG9zZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmlnaHRcIiBzdHlsZT1cImZvbnQtc2l6ZToyZW07cGFkZGluZy10b3A6NHB4XCI+w5c8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5ET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZChjbG9zZUJ1dHRvbilcclxuICAgIGNsb3NlQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLmNsb3NlKCkgfSlcclxuXHJcbiAgICB2YXIgZGlhbG9nRGl2PSQoJzxkaXYgY2xhc3M9XCJ3My1jb250YWluZXJcIiBzdHlsZT1cIm1hcmdpbi10b3A6MTBweDttYXJnaW4tYm90dG9tOjEwcHhcIj48L2Rpdj4nKVxyXG4gICAgZGlhbG9nRGl2LnRleHQob3RoZXJPcHRpb25zLmNvbnRlbnQpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQoZGlhbG9nRGl2KVxyXG4gICAgdGhpcy5kaWFsb2dEaXY9ZGlhbG9nRGl2XHJcblxyXG4gICAgdGhpcy5ib3R0b21CYXI9JCgnPGRpdiBjbGFzcz1cInczLWJhclwiPjwvZGl2PicpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQodGhpcy5ib3R0b21CYXIpXHJcblxyXG4gICAgb3RoZXJPcHRpb25zLmJ1dHRvbnMuZm9yRWFjaChidG49PntcclxuICAgICAgICB2YXIgYUJ1dHRvbj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLXJpZ2h0ICcrKGJ0bi5jb2xvckNsYXNzfHxcIlwiKSsnXCIgc3R5bGU9XCJtYXJnaW4tcmlnaHQ6MnB4O21hcmdpbi1sZWZ0OjJweFwiPicrYnRuLnRleHQrJzwvYnV0dG9uPicpXHJcbiAgICAgICAgYUJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PiB7IGJ0bi5jbGlja0Z1bmMoKSAgfSAgKVxyXG4gICAgICAgIHRoaXMuYm90dG9tQmFyLmFwcGVuZChhQnV0dG9uKSAgICBcclxuICAgIH0pXHJcbiAgICAkKFwiYm9keVwiKS5hcHBlbmQodGhpcy5ET00pXHJcbn1cclxuXHJcbnNpbXBsZUNvbmZpcm1EaWFsb2cucHJvdG90eXBlLmNsb3NlPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLkRPTS5yZW1vdmUoKVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHNpbXBsZUNvbmZpcm1EaWFsb2c7IiwiZnVuY3Rpb24gc2ltcGxlU2VsZWN0TWVudShidXR0b25OYW1lLG9wdGlvbnMpe1xyXG4gICAgb3B0aW9ucz1vcHRpb25zfHx7fSAvL3tpc0NsaWNrYWJsZToxLHdpdGhCb3JkZXI6MSxmb250U2l6ZTpcIlwiLGNvbG9yQ2xhc3M6XCJcIixidXR0b25DU1M6XCJcIn1cclxuICAgIGlmKG9wdGlvbnMuaXNDbGlja2FibGUpe1xyXG4gICAgICAgIHRoaXMuaXNDbGlja2FibGU9dHJ1ZVxyXG4gICAgICAgIHRoaXMuRE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1kcm9wZG93bi1jbGlja1wiPjwvZGl2PicpXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB0aGlzLkRPTT0kKCc8ZGl2IGNsYXNzPVwidzMtZHJvcGRvd24taG92ZXIgXCI+PC9kaXY+JylcclxuICAgICAgICB0aGlzLkRPTS5vbihcIm1vdXNlb3ZlclwiLChlKT0+e1xyXG4gICAgICAgICAgICB0aGlzLmFkanVzdERyb3BEb3duUG9zaXRpb24oKVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHRoaXMuYnV0dG9uPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b25cIiBzdHlsZT1cIm91dGxpbmU6IG5vbmU7XCI+PGE+JytidXR0b25OYW1lKyc8L2E+PGEgc3R5bGU9XCJmb250LXdlaWdodDpib2xkO3BhZGRpbmctbGVmdDoycHhcIj48L2E+PGkgY2xhc3M9XCJmYSBmYS1jYXJldC1kb3duXCIgc3R5bGU9XCJwYWRkaW5nLWxlZnQ6M3B4XCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICBpZihvcHRpb25zLndpdGhCb3JkZXIpIHRoaXMuYnV0dG9uLmFkZENsYXNzKFwidzMtYm9yZGVyXCIpXHJcbiAgICBpZihvcHRpb25zLmZvbnRTaXplKSB0aGlzLkRPTS5jc3MoXCJmb250LXNpemVcIixvcHRpb25zLmZvbnRTaXplKVxyXG4gICAgaWYob3B0aW9ucy5jb2xvckNsYXNzKSB0aGlzLmJ1dHRvbi5hZGRDbGFzcyhvcHRpb25zLmNvbG9yQ2xhc3MpXHJcbiAgICBpZihvcHRpb25zLndpZHRoKSB0aGlzLmJ1dHRvbi5jc3MoXCJ3aWR0aFwiLG9wdGlvbnMud2lkdGgpXHJcbiAgICBpZihvcHRpb25zLmJ1dHRvbkNTUykgdGhpcy5idXR0b24uY3NzKG9wdGlvbnMuYnV0dG9uQ1NTKVxyXG4gICAgaWYob3B0aW9ucy5hZGp1c3RQb3NpdGlvbkFuY2hvcikgdGhpcy5hZGp1c3RQb3NpdGlvbkFuY2hvcj1vcHRpb25zLmFkanVzdFBvc2l0aW9uQW5jaG9yXHJcblxyXG4gICAgdGhpcy5vcHRpb25Db250ZW50RE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1kcm9wZG93bi1jb250ZW50IHczLWJhci1ibG9jayB3My1jYXJkLTRcIj48L2Rpdj4nKVxyXG4gICAgaWYob3B0aW9ucy5vcHRpb25MaXN0SGVpZ2h0KSB0aGlzLm9wdGlvbkNvbnRlbnRET00uY3NzKHtoZWlnaHQ6b3B0aW9ucy5vcHRpb25MaXN0SGVpZ2h0K1wicHhcIixcIm92ZXJmbG93LXlcIjpcImF1dG9cIixcIm92ZXJmbG93LXhcIjpcInZpc2libGVcIn0pXHJcbiAgICBpZihvcHRpb25zLm9wdGlvbkxpc3RNYXJnaW5Ub3ApIHRoaXMub3B0aW9uQ29udGVudERPTS5jc3Moe1wibWFyZ2luLXRvcFwiOm9wdGlvbnMub3B0aW9uTGlzdE1hcmdpblRvcCtcInB4XCJ9KVxyXG4gICAgaWYob3B0aW9ucy5vcHRpb25MaXN0TWFyZ2luTGVmdCkgdGhpcy5vcHRpb25Db250ZW50RE9NLmNzcyh7XCJtYXJnaW4tbGVmdFwiOm9wdGlvbnMub3B0aW9uTGlzdE1hcmdpbkxlZnQrXCJweFwifSlcclxuICAgIFxyXG4gICAgdGhpcy5ET00uYXBwZW5kKHRoaXMuYnV0dG9uLHRoaXMub3B0aW9uQ29udGVudERPTSlcclxuICAgIHRoaXMuY3VyU2VsZWN0VmFsPW51bGw7XHJcblxyXG4gICAgaWYob3B0aW9ucy5pc0NsaWNrYWJsZSl7XHJcbiAgICAgICAgdGhpcy5idXR0b24ub24oXCJjbGlja1wiLChlKT0+e1xyXG4gICAgICAgICAgICB0aGlzLmFkanVzdERyb3BEb3duUG9zaXRpb24oKVxyXG4gICAgICAgICAgICBpZih0aGlzLm9wdGlvbkNvbnRlbnRET00uaGFzQ2xhc3MoXCJ3My1zaG93XCIpKSAgdGhpcy5vcHRpb25Db250ZW50RE9NLnJlbW92ZUNsYXNzKFwidzMtc2hvd1wiKVxyXG4gICAgICAgICAgICBlbHNlIHRoaXMub3B0aW9uQ29udGVudERPTS5hZGRDbGFzcyhcInczLXNob3dcIilcclxuICAgICAgICB9KSAgICBcclxuICAgIH1cclxufVxyXG5cclxuc2ltcGxlU2VsZWN0TWVudS5wcm90b3R5cGUuYWRqdXN0RHJvcERvd25Qb3NpdGlvbj1mdW5jdGlvbigpe1xyXG4gICAgaWYoIXRoaXMuYWRqdXN0UG9zaXRpb25BbmNob3IpIHJldHVybjtcclxuICAgIHZhciBvZmZzZXQ9dGhpcy5ET00ub2Zmc2V0KClcclxuICAgIHZhciBuZXdUb3A9b2Zmc2V0LnRvcC10aGlzLmFkanVzdFBvc2l0aW9uQW5jaG9yLnRvcFxyXG4gICAgdmFyIG5ld0xlZnQ9b2Zmc2V0LmxlZnQtdGhpcy5hZGp1c3RQb3NpdGlvbkFuY2hvci5sZWZ0XHJcbiAgICB0aGlzLm9wdGlvbkNvbnRlbnRET00uY3NzKHtcInRvcFwiOm5ld1RvcCtcInB4XCIsXCJsZWZ0XCI6bmV3TGVmdCtcInB4XCJ9KVxyXG59XHJcblxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS5maW5kT3B0aW9uPWZ1bmN0aW9uKG9wdGlvblZhbHVlKXtcclxuICAgIHZhciBvcHRpb25zPXRoaXMub3B0aW9uQ29udGVudERPTS5jaGlsZHJlbigpXHJcbiAgICBmb3IodmFyIGk9MDtpPG9wdGlvbnMubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIGFuT3B0aW9uPSQob3B0aW9uc1tpXSlcclxuICAgICAgICBpZihvcHRpb25WYWx1ZT09YW5PcHRpb24uZGF0YShcIm9wdGlvblZhbHVlXCIpKXtcclxuICAgICAgICAgICAgcmV0dXJuIHtcInRleHRcIjphbk9wdGlvbi50ZXh0KCksXCJ2YWx1ZVwiOmFuT3B0aW9uLmRhdGEoXCJvcHRpb25WYWx1ZVwiKX1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbnNpbXBsZVNlbGVjdE1lbnUucHJvdG90eXBlLmFkZE9wdGlvbkFycj1mdW5jdGlvbihhcnIpe1xyXG4gICAgYXJyLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgdGhpcy5hZGRPcHRpb24oZWxlbWVudClcclxuICAgIH0pO1xyXG59XHJcblxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS5hZGRPcHRpb249ZnVuY3Rpb24ob3B0aW9uVGV4dCxvcHRpb25WYWx1ZSl7XHJcbiAgICB2YXIgb3B0aW9uSXRlbT0kKCc8YSBocmVmPVwiI1wiIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uXCI+JytvcHRpb25UZXh0Kyc8L2E+JylcclxuICAgIHRoaXMub3B0aW9uQ29udGVudERPTS5hcHBlbmQob3B0aW9uSXRlbSlcclxuICAgIG9wdGlvbkl0ZW0uZGF0YShcIm9wdGlvblZhbHVlXCIsb3B0aW9uVmFsdWV8fG9wdGlvblRleHQpXHJcbiAgICBvcHRpb25JdGVtLm9uKCdjbGljaycsKGUpPT57XHJcbiAgICAgICAgdGhpcy5jdXJTZWxlY3RWYWw9b3B0aW9uSXRlbS5kYXRhKFwib3B0aW9uVmFsdWVcIilcclxuICAgICAgICBpZih0aGlzLmlzQ2xpY2thYmxlKXtcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25Db250ZW50RE9NLnJlbW92ZUNsYXNzKFwidzMtc2hvd1wiKVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICB0aGlzLkRPTS5yZW1vdmVDbGFzcygndzMtZHJvcGRvd24taG92ZXInKVxyXG4gICAgICAgICAgICB0aGlzLkRPTS5hZGRDbGFzcygndzMtZHJvcGRvd24tY2xpY2snKVxyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHsgLy90aGlzIGlzIHRvIGhpZGUgdGhlIGRyb3AgZG93biBtZW51IGFmdGVyIGNsaWNrXHJcbiAgICAgICAgICAgICAgICB0aGlzLkRPTS5hZGRDbGFzcygndzMtZHJvcGRvd24taG92ZXInKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5ET00ucmVtb3ZlQ2xhc3MoJ3czLWRyb3Bkb3duLWNsaWNrJylcclxuICAgICAgICAgICAgfSwgMTAwKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5jYWxsQmFja19jbGlja09wdGlvbihvcHRpb25UZXh0LG9wdGlvbkl0ZW0uZGF0YShcIm9wdGlvblZhbHVlXCIpLFwicmVhbE1vdXNlQ2xpY2tcIilcclxuICAgIH0pXHJcbn1cclxuXHJcbnNpbXBsZVNlbGVjdE1lbnUucHJvdG90eXBlLmNoYW5nZU5hbWU9ZnVuY3Rpb24obmFtZVN0cjEsbmFtZVN0cjIpe1xyXG4gICAgdGhpcy5idXR0b24uY2hpbGRyZW4oXCI6Zmlyc3RcIikudGV4dChuYW1lU3RyMSlcclxuICAgIHRoaXMuYnV0dG9uLmNoaWxkcmVuKCkuZXEoMSkudGV4dChuYW1lU3RyMilcclxufVxyXG5cclxuc2ltcGxlU2VsZWN0TWVudS5wcm90b3R5cGUudHJpZ2dlck9wdGlvbkluZGV4PWZ1bmN0aW9uKG9wdGlvbkluZGV4KXtcclxuICAgIHZhciB0aGVPcHRpb249dGhpcy5vcHRpb25Db250ZW50RE9NLmNoaWxkcmVuKCkuZXEob3B0aW9uSW5kZXgpXHJcbiAgICBpZih0aGVPcHRpb24ubGVuZ3RoPT0wKSB7XHJcbiAgICAgICAgdGhpcy5jdXJTZWxlY3RWYWw9bnVsbDtcclxuICAgICAgICB0aGlzLmNhbGxCYWNrX2NsaWNrT3B0aW9uKG51bGwsbnVsbClcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB0aGlzLmN1clNlbGVjdFZhbD10aGVPcHRpb24uZGF0YShcIm9wdGlvblZhbHVlXCIpXHJcbiAgICB0aGlzLmNhbGxCYWNrX2NsaWNrT3B0aW9uKHRoZU9wdGlvbi50ZXh0KCksdGhlT3B0aW9uLmRhdGEoXCJvcHRpb25WYWx1ZVwiKSlcclxufVxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS50cmlnZ2VyT3B0aW9uVmFsdWU9ZnVuY3Rpb24ob3B0aW9uVmFsdWUpe1xyXG4gICAgdmFyIHJlPXRoaXMuZmluZE9wdGlvbihvcHRpb25WYWx1ZSlcclxuICAgIGlmKHJlPT1udWxsKXtcclxuICAgICAgICB0aGlzLmN1clNlbGVjdFZhbD1udWxsXHJcbiAgICAgICAgdGhpcy5jYWxsQmFja19jbGlja09wdGlvbihudWxsLG51bGwpXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB0aGlzLmN1clNlbGVjdFZhbD1yZS52YWx1ZVxyXG4gICAgICAgIHRoaXMuY2FsbEJhY2tfY2xpY2tPcHRpb24ocmUudGV4dCxyZS52YWx1ZSlcclxuICAgIH1cclxufVxyXG5cclxuXHJcbnNpbXBsZVNlbGVjdE1lbnUucHJvdG90eXBlLmNsZWFyT3B0aW9ucz1mdW5jdGlvbihvcHRpb25UZXh0LG9wdGlvblZhbHVlKXtcclxuICAgIHRoaXMub3B0aW9uQ29udGVudERPTS5lbXB0eSgpXHJcbiAgICB0aGlzLmN1clNlbGVjdFZhbD1udWxsO1xyXG59XHJcblxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS5jYWxsQmFja19jbGlja09wdGlvbj1mdW5jdGlvbihvcHRpb250ZXh0LG9wdGlvblZhbHVlLHJlYWxNb3VzZUNsaWNrKXtcclxuXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gc2ltcGxlU2VsZWN0TWVudTsiLCIndXNlIHN0cmljdCc7XHJcblxyXG5mdW5jdGlvbiBzaW1wbGVUcmVlKERPTSxvcHRpb25zKXtcclxuICAgIHRoaXMuRE9NPURPTVxyXG4gICAgdGhpcy5ncm91cE5vZGVzPVtdIC8vZWFjaCBncm91cCBoZWFkZXIgaXMgb25lIG5vZGVcclxuICAgIHRoaXMuc2VsZWN0ZWROb2Rlcz1bXTtcclxuICAgIHRoaXMub3B0aW9ucz1vcHRpb25zIHx8IHt9XHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLnNjcm9sbFRvTGVhZk5vZGU9ZnVuY3Rpb24oYU5vZGUpe1xyXG4gICAgdmFyIHNjcm9sbFRvcD10aGlzLkRPTS5zY3JvbGxUb3AoKVxyXG4gICAgdmFyIHRyZWVIZWlnaHQ9dGhpcy5ET00uaGVpZ2h0KClcclxuICAgIHZhciBub2RlUG9zaXRpb249YU5vZGUuRE9NLnBvc2l0aW9uKCkudG9wIC8vd2hpY2ggZG9lcyBub3QgY29uc2lkZXIgcGFyZW50IERPTSdzIHNjcm9sbCBoZWlnaHRcclxuICAgIC8vY29uc29sZS5sb2coc2Nyb2xsVG9wLHRyZWVIZWlnaHQsbm9kZVBvc2l0aW9uKVxyXG4gICAgaWYodHJlZUhlaWdodC01MDxub2RlUG9zaXRpb24pe1xyXG4gICAgICAgIHRoaXMuRE9NLnNjcm9sbFRvcChzY3JvbGxUb3AgKyBub2RlUG9zaXRpb24tKHRyZWVIZWlnaHQtNTApKSBcclxuICAgIH1lbHNlIGlmKG5vZGVQb3NpdGlvbjw1MCl7XHJcbiAgICAgICAgdGhpcy5ET00uc2Nyb2xsVG9wKHNjcm9sbFRvcCArIChub2RlUG9zaXRpb24tNTApKSBcclxuICAgIH1cclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuY2xlYXJBbGxMZWFmTm9kZXM9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5mb3JFYWNoKChnTm9kZSk9PntcclxuICAgICAgICBnTm9kZS5saXN0RE9NLmVtcHR5KClcclxuICAgICAgICBnTm9kZS5jaGlsZExlYWZOb2Rlcy5sZW5ndGg9MFxyXG4gICAgICAgIGdOb2RlLnJlZnJlc2hOYW1lKClcclxuICAgIH0pXHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmZpcnN0TGVhZk5vZGU9ZnVuY3Rpb24oKXtcclxuICAgIGlmKHRoaXMuZ3JvdXBOb2Rlcy5sZW5ndGg9PTApIHJldHVybiBudWxsO1xyXG4gICAgdmFyIGZpcnN0TGVhZk5vZGU9bnVsbDtcclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5mb3JFYWNoKGFHcm91cE5vZGU9PntcclxuICAgICAgICBpZihmaXJzdExlYWZOb2RlIT1udWxsKSByZXR1cm47XHJcbiAgICAgICAgaWYoYUdyb3VwTm9kZS5jaGlsZExlYWZOb2Rlcy5sZW5ndGg+MCkgZmlyc3RMZWFmTm9kZT1hR3JvdXBOb2RlLmNoaWxkTGVhZk5vZGVzWzBdXHJcbiAgICB9KVxyXG5cclxuICAgIHJldHVybiBmaXJzdExlYWZOb2RlXHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLm5leHRHcm91cE5vZGU9ZnVuY3Rpb24oYUdyb3VwTm9kZSl7XHJcbiAgICBpZihhR3JvdXBOb2RlPT1udWxsKSByZXR1cm47XHJcbiAgICB2YXIgaW5kZXg9dGhpcy5ncm91cE5vZGVzLmluZGV4T2YoYUdyb3VwTm9kZSlcclxuICAgIGlmKHRoaXMuZ3JvdXBOb2Rlcy5sZW5ndGgtMT5pbmRleCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ3JvdXBOb2Rlc1tpbmRleCsxXVxyXG4gICAgfWVsc2V7IC8vcm90YXRlIGJhY2t3YXJkIHRvIGZpcnN0IGdyb3VwIG5vZGVcclxuICAgICAgICByZXR1cm4gdGhpcy5ncm91cE5vZGVzWzBdIFxyXG4gICAgfVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5uZXh0TGVhZk5vZGU9ZnVuY3Rpb24oYUxlYWZOb2RlKXtcclxuICAgIGlmKGFMZWFmTm9kZT09bnVsbCkgcmV0dXJuO1xyXG4gICAgdmFyIGFHcm91cE5vZGU9YUxlYWZOb2RlLnBhcmVudEdyb3VwTm9kZVxyXG4gICAgdmFyIGluZGV4PWFHcm91cE5vZGUuY2hpbGRMZWFmTm9kZXMuaW5kZXhPZihhTGVhZk5vZGUpXHJcbiAgICBpZihhR3JvdXBOb2RlLmNoaWxkTGVhZk5vZGVzLmxlbmd0aC0xPmluZGV4KXtcclxuICAgICAgICAvL25leHQgbm9kZSBpcyBpbiBzYW1lIGdyb3VwXHJcbiAgICAgICAgcmV0dXJuIGFHcm91cE5vZGUuY2hpbGRMZWFmTm9kZXNbaW5kZXgrMV1cclxuICAgIH1lbHNle1xyXG4gICAgICAgIC8vZmluZCBuZXh0IGdyb3VwIGZpcnN0IG5vZGVcclxuICAgICAgICB3aGlsZSh0cnVlKXtcclxuICAgICAgICAgICAgdmFyIG5leHRHcm91cE5vZGUgPSB0aGlzLm5leHRHcm91cE5vZGUoYUdyb3VwTm9kZSlcclxuICAgICAgICAgICAgaWYobmV4dEdyb3VwTm9kZS5jaGlsZExlYWZOb2Rlcy5sZW5ndGg9PTApe1xyXG4gICAgICAgICAgICAgICAgYUdyb3VwTm9kZT1uZXh0R3JvdXBOb2RlXHJcbiAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5leHRHcm91cE5vZGUuY2hpbGRMZWFmTm9kZXNbMF1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuc2VhcmNoVGV4dD1mdW5jdGlvbihzdHIpe1xyXG4gICAgaWYoc3RyPT1cIlwiKSByZXR1cm4gbnVsbDtcclxuICAgIC8vc2VhcmNoIGZyb20gY3VycmVudCBzZWxlY3QgaXRlbSB0aGUgbmV4dCBsZWFmIGl0ZW0gY29udGFpbnMgdGhlIHRleHRcclxuICAgIHZhciByZWdleCA9IG5ldyBSZWdFeHAoc3RyLCAnaScpO1xyXG4gICAgdmFyIHN0YXJ0Tm9kZVxyXG4gICAgaWYodGhpcy5zZWxlY3RlZE5vZGVzLmxlbmd0aD09MCkge1xyXG4gICAgICAgIHN0YXJ0Tm9kZT10aGlzLmZpcnN0TGVhZk5vZGUoKVxyXG4gICAgICAgIGlmKHN0YXJ0Tm9kZT09bnVsbCkgcmV0dXJuO1xyXG4gICAgICAgIHZhciB0aGVTdHI9c3RhcnROb2RlLm5hbWU7XHJcbiAgICAgICAgaWYodGhlU3RyLm1hdGNoKHJlZ2V4KSE9bnVsbCl7XHJcbiAgICAgICAgICAgIC8vZmluZCB0YXJnZXQgbm9kZSBcclxuICAgICAgICAgICAgcmV0dXJuIHN0YXJ0Tm9kZVxyXG4gICAgICAgIH1cclxuICAgIH1lbHNlIHN0YXJ0Tm9kZT10aGlzLnNlbGVjdGVkTm9kZXNbMF1cclxuXHJcbiAgICBpZihzdGFydE5vZGU9PW51bGwpIHJldHVybiBudWxsO1xyXG4gICAgXHJcbiAgICB2YXIgZnJvbU5vZGU9c3RhcnROb2RlO1xyXG4gICAgd2hpbGUodHJ1ZSl7XHJcbiAgICAgICAgdmFyIG5leHROb2RlPXRoaXMubmV4dExlYWZOb2RlKGZyb21Ob2RlKVxyXG4gICAgICAgIGlmKG5leHROb2RlPT1zdGFydE5vZGUpIHJldHVybiBudWxsO1xyXG4gICAgICAgIHZhciBuZXh0Tm9kZVN0cj1uZXh0Tm9kZS5uYW1lO1xyXG4gICAgICAgIGlmKG5leHROb2RlU3RyLm1hdGNoKHJlZ2V4KSE9bnVsbCl7XHJcbiAgICAgICAgICAgIC8vZmluZCB0YXJnZXQgbm9kZVxyXG4gICAgICAgICAgICByZXR1cm4gbmV4dE5vZGVcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgZnJvbU5vZGU9bmV4dE5vZGU7XHJcbiAgICAgICAgfVxyXG4gICAgfSAgICBcclxufVxyXG5cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmFkZExlYWZub2RlVG9Hcm91cD1mdW5jdGlvbihncm91cE5hbWUsb2JqLHNraXBSZXBlYXQpe1xyXG4gICAgdmFyIGFHcm91cE5vZGU9dGhpcy5maW5kR3JvdXBOb2RlKGdyb3VwTmFtZSlcclxuICAgIGlmKGFHcm91cE5vZGUgPT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgYUdyb3VwTm9kZS5hZGROb2RlKG9iaixza2lwUmVwZWF0KVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5yZW1vdmVBbGxOb2Rlcz1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5ncm91cE5vZGVzLmxlbmd0aD0wO1xyXG4gICAgdGhpcy5zZWxlY3RlZE5vZGVzLmxlbmd0aD0wO1xyXG4gICAgdGhpcy5ET00uZW1wdHkoKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5maW5kR3JvdXBOb2RlPWZ1bmN0aW9uKGdyb3VwTmFtZSl7XHJcbiAgICB2YXIgZm91bmRHcm91cE5vZGU9bnVsbFxyXG4gICAgdGhpcy5ncm91cE5vZGVzLmZvckVhY2goYUdyb3VwTm9kZT0+e1xyXG4gICAgICAgIGlmKGFHcm91cE5vZGUubmFtZT09Z3JvdXBOYW1lKXtcclxuICAgICAgICAgICAgZm91bmRHcm91cE5vZGU9YUdyb3VwTm9kZVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuICAgIHJldHVybiBmb3VuZEdyb3VwTm9kZTtcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuZGVsR3JvdXBOb2RlPWZ1bmN0aW9uKGdub2RlKXtcclxuICAgIGdub2RlLmRlbGV0ZVNlbGYoKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5kZWxldGVMZWFmTm9kZT1mdW5jdGlvbihub2RlTmFtZSl7XHJcbiAgICB2YXIgZmluZExlYWZOb2RlPW51bGxcclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5mb3JFYWNoKChnTm9kZSk9PntcclxuICAgICAgICBpZihmaW5kTGVhZk5vZGUhPW51bGwpIHJldHVybjtcclxuICAgICAgICBnTm9kZS5jaGlsZExlYWZOb2Rlcy5mb3JFYWNoKChhTGVhZik9PntcclxuICAgICAgICAgICAgaWYoYUxlYWYubmFtZT09bm9kZU5hbWUpe1xyXG4gICAgICAgICAgICAgICAgZmluZExlYWZOb2RlPWFMZWFmXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgfSlcclxuICAgIGlmKGZpbmRMZWFmTm9kZT09bnVsbCkgcmV0dXJuO1xyXG4gICAgZmluZExlYWZOb2RlLmRlbGV0ZVNlbGYoKVxyXG59XHJcblxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuaW5zZXJ0R3JvdXBOb2RlPWZ1bmN0aW9uKG9iaixpbmRleCl7XHJcbiAgICB2YXIgYU5ld0dyb3VwTm9kZSA9IG5ldyBzaW1wbGVUcmVlR3JvdXBOb2RlKHRoaXMsb2JqKVxyXG4gICAgdmFyIGV4aXN0R3JvdXBOb2RlPSB0aGlzLmZpbmRHcm91cE5vZGUoYU5ld0dyb3VwTm9kZS5uYW1lKVxyXG4gICAgaWYoZXhpc3RHcm91cE5vZGUhPW51bGwpIHJldHVybjtcclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5zcGxpY2UoaW5kZXgsIDAsIGFOZXdHcm91cE5vZGUpO1xyXG5cclxuICAgIGlmKGluZGV4PT0wKXtcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQoYU5ld0dyb3VwTm9kZS5oZWFkZXJET00pXHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKGFOZXdHcm91cE5vZGUubGlzdERPTSlcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHZhciBwcmV2R3JvdXBOb2RlPXRoaXMuZ3JvdXBOb2Rlc1tpbmRleC0xXVxyXG4gICAgICAgIGFOZXdHcm91cE5vZGUuaGVhZGVyRE9NLmluc2VydEFmdGVyKHByZXZHcm91cE5vZGUubGlzdERPTSlcclxuICAgICAgICBhTmV3R3JvdXBOb2RlLmxpc3RET00uaW5zZXJ0QWZ0ZXIoYU5ld0dyb3VwTm9kZS5oZWFkZXJET00pXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGFOZXdHcm91cE5vZGU7XHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmFkZEdyb3VwTm9kZT1mdW5jdGlvbihvYmope1xyXG4gICAgdmFyIGFOZXdHcm91cE5vZGUgPSBuZXcgc2ltcGxlVHJlZUdyb3VwTm9kZSh0aGlzLG9iailcclxuICAgIHZhciBleGlzdEdyb3VwTm9kZT0gdGhpcy5maW5kR3JvdXBOb2RlKGFOZXdHcm91cE5vZGUubmFtZSlcclxuICAgIGlmKGV4aXN0R3JvdXBOb2RlIT1udWxsKSByZXR1cm4gZXhpc3RHcm91cE5vZGU7XHJcbiAgICB0aGlzLmdyb3VwTm9kZXMucHVzaChhTmV3R3JvdXBOb2RlKTtcclxuICAgIHRoaXMuRE9NLmFwcGVuZChhTmV3R3JvdXBOb2RlLmhlYWRlckRPTSlcclxuICAgIHRoaXMuRE9NLmFwcGVuZChhTmV3R3JvdXBOb2RlLmxpc3RET00pXHJcbiAgICByZXR1cm4gYU5ld0dyb3VwTm9kZTtcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuc2VsZWN0TGVhZk5vZGU9ZnVuY3Rpb24obGVhZk5vZGUsbW91c2VDbGlja0RldGFpbCl7XHJcbiAgICB0aGlzLnNlbGVjdExlYWZOb2RlQXJyKFtsZWFmTm9kZV0sbW91c2VDbGlja0RldGFpbClcclxufVxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5hcHBlbmRMZWFmTm9kZVRvU2VsZWN0aW9uPWZ1bmN0aW9uKGxlYWZOb2RlKXtcclxuICAgIGlmKHRoaXMub3B0aW9ucy5ub011bHRpcGxlU2VsZWN0QWxsb3dlZCl7XHJcbiAgICAgICAgdGhpcy5zZWxlY3RMZWFmTm9kZShsZWFmTm9kZSlcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9IFxyXG4gICAgdmFyIG5ld0Fycj1bXS5jb25jYXQodGhpcy5zZWxlY3RlZE5vZGVzKVxyXG4gICAgbmV3QXJyLnB1c2gobGVhZk5vZGUpXHJcbiAgICB0aGlzLnNlbGVjdExlYWZOb2RlQXJyKG5ld0FycilcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuc2VsZWN0R3JvdXBOb2RlPWZ1bmN0aW9uKGdyb3VwTm9kZSl7XHJcbiAgICBpZih0aGlzLmNhbGxiYWNrX2FmdGVyU2VsZWN0R3JvdXBOb2RlKSB0aGlzLmNhbGxiYWNrX2FmdGVyU2VsZWN0R3JvdXBOb2RlKGdyb3VwTm9kZS5pbmZvKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5zZWxlY3RMZWFmTm9kZUFycj1mdW5jdGlvbihsZWFmTm9kZUFycixtb3VzZUNsaWNrRGV0YWlsKXtcclxuICAgIGZvcih2YXIgaT0wO2k8dGhpcy5zZWxlY3RlZE5vZGVzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHRoaXMuc2VsZWN0ZWROb2Rlc1tpXS5kaW0oKVxyXG4gICAgfVxyXG4gICAgdGhpcy5zZWxlY3RlZE5vZGVzLmxlbmd0aD0wO1xyXG4gICAgdGhpcy5zZWxlY3RlZE5vZGVzPXRoaXMuc2VsZWN0ZWROb2Rlcy5jb25jYXQobGVhZk5vZGVBcnIpXHJcbiAgICBmb3IodmFyIGk9MDtpPHRoaXMuc2VsZWN0ZWROb2Rlcy5sZW5ndGg7aSsrKXtcclxuICAgICAgICB0aGlzLnNlbGVjdGVkTm9kZXNbaV0uaGlnaGxpZ2h0KClcclxuICAgIH1cclxuXHJcbiAgICBpZih0aGlzLmNhbGxiYWNrX2FmdGVyU2VsZWN0Tm9kZXMpIHRoaXMuY2FsbGJhY2tfYWZ0ZXJTZWxlY3ROb2Rlcyh0aGlzLnNlbGVjdGVkTm9kZXMsbW91c2VDbGlja0RldGFpbClcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuZGJsQ2xpY2tOb2RlPWZ1bmN0aW9uKHRoZU5vZGUpe1xyXG4gICAgaWYodGhpcy5jYWxsYmFja19hZnRlckRibGNsaWNrTm9kZSkgdGhpcy5jYWxsYmFja19hZnRlckRibGNsaWNrTm9kZSh0aGVOb2RlKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5zb3J0QWxsTGVhdmVzPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLmdyb3VwTm9kZXMuZm9yRWFjaChvbmVHcm91cE5vZGU9PntvbmVHcm91cE5vZGUuc29ydE5vZGVzQnlOYW1lKCl9KVxyXG59XHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS10cmVlIGdyb3VwIG5vZGUtLS0tLS0tLS0tLS0tLS1cclxuZnVuY3Rpb24gc2ltcGxlVHJlZUdyb3VwTm9kZShwYXJlbnRUcmVlLG9iail7XHJcbiAgICB0aGlzLnBhcmVudFRyZWU9cGFyZW50VHJlZVxyXG4gICAgdGhpcy5pbmZvPW9ialxyXG4gICAgdGhpcy5jaGlsZExlYWZOb2Rlcz1bXSAvL2l0J3MgY2hpbGQgbGVhZiBub2RlcyBhcnJheVxyXG4gICAgdGhpcy5uYW1lPW9iai5kaXNwbGF5TmFtZTtcclxuICAgIHRoaXMuY3JlYXRlRE9NKClcclxufVxyXG5cclxuc2ltcGxlVHJlZUdyb3VwTm9kZS5wcm90b3R5cGUucmVmcmVzaE5hbWU9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuaGVhZGVyRE9NLmVtcHR5KClcclxuICAgIHZhciBuYW1lRGl2PSQoXCI8ZGl2IHN0eWxlPSdkaXNwbGF5OmlubGluZTtwYWRkaW5nLXJpZ2h0OjNweCc+PC9kaXY+XCIpXHJcbiAgICBuYW1lRGl2LnRleHQodGhpcy5uYW1lKVxyXG4gICAgdmFyIGxibENvbG9yPVwiZ3JheVwiXHJcbiAgICBpZih0aGlzLmNoaWxkTGVhZk5vZGVzLmxlbmd0aD4wKSB7XHJcbiAgICAgICAgbGJsQ29sb3I9XCJ5ZWxsb3dncmVlblwiXHJcbiAgICAgICAgdGhpcy5oZWFkZXJET00uY3NzKFwiZm9udC13ZWlnaHRcIixcImJvbGRcIilcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHRoaXMuaGVhZGVyRE9NLmNzcyhcImZvbnQtd2VpZ2h0XCIsXCJub3JtYWxcIilcclxuICAgIH0gXHJcblxyXG4gICAgaWYodGhpcy5wYXJlbnRUcmVlLm9wdGlvbnMuZ3JvdXBOb2RlSWNvbkZ1bmMpe1xyXG4gICAgICAgIHZhciBpY29uTGFiZWw9dGhpcy5wYXJlbnRUcmVlLm9wdGlvbnMuZ3JvdXBOb2RlSWNvbkZ1bmModGhpcylcclxuICAgICAgICB0aGlzLmhlYWRlckRPTS5hcHBlbmQoaWNvbkxhYmVsKVxyXG4gICAgfVxyXG4gICAgdmFyIG51bWJlcmxhYmVsPSQoXCI8bGFiZWwgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO2JhY2tncm91bmQtY29sb3I6XCIrbGJsQ29sb3JcclxuICAgICAgICArXCI7Y29sb3I6d2hpdGU7Zm9udC1zaXplOjlweDtwYWRkaW5nOjJweCA0cHg7Zm9udC13ZWlnaHQ6bm9ybWFsO2JvcmRlci1yYWRpdXM6IDJweDsnPlwiK3RoaXMuY2hpbGRMZWFmTm9kZXMubGVuZ3RoK1wiPC9sYWJlbD5cIilcclxuICAgIHRoaXMuaGVhZGVyRE9NLmFwcGVuZChuYW1lRGl2LG51bWJlcmxhYmVsKVxyXG4gICAgdGhpcy5jaGVja09wdGlvbkhpZGVFbXB0eUdyb3VwKClcclxuXHJcbn1cclxuc2ltcGxlVHJlZUdyb3VwTm9kZS5wcm90b3R5cGUuY2hlY2tPcHRpb25IaWRlRW1wdHlHcm91cD1mdW5jdGlvbigpe1xyXG4gICAgaWYgKHRoaXMucGFyZW50VHJlZS5vcHRpb25zLmhpZGVFbXB0eUdyb3VwICYmIHRoaXMuY2hpbGRMZWFmTm9kZXMubGVuZ3RoID09IDApIHtcclxuICAgICAgICB0aGlzLmhlYWRlckRPTS5oaWRlKClcclxuICAgICAgICBpZiAodGhpcy5saXN0RE9NKSB0aGlzLmxpc3RET00uaGlkZSgpXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuaGVhZGVyRE9NLnNob3coKVxyXG4gICAgICAgIGlmICh0aGlzLmxpc3RET00pIHRoaXMubGlzdERPTS5zaG93KClcclxuICAgIH1cclxuXHJcbn1cclxuc2ltcGxlVHJlZUdyb3VwTm9kZS5wcm90b3R5cGUuZGVsZXRlU2VsZiA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMuaGVhZGVyRE9NLnJlbW92ZSgpXHJcbiAgICB0aGlzLmxpc3RET00ucmVtb3ZlKClcclxuICAgIHZhciBwYXJlbnRBcnIgPSB0aGlzLnBhcmVudFRyZWUuZ3JvdXBOb2Rlc1xyXG4gICAgY29uc3QgaW5kZXggPSBwYXJlbnRBcnIuaW5kZXhPZih0aGlzKTtcclxuICAgIGlmIChpbmRleCA+IC0xKSBwYXJlbnRBcnIuc3BsaWNlKGluZGV4LCAxKTtcclxufVxyXG5cclxuc2ltcGxlVHJlZUdyb3VwTm9kZS5wcm90b3R5cGUuY3JlYXRlRE9NPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLmhlYWRlckRPTT0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJsb2NrIHczLWxpZ2h0LWdyZXkgdzMtbGVmdC1hbGlnblwiPjwvYnV0dG9uPicpXHJcbiAgICB0aGlzLnJlZnJlc2hOYW1lKClcclxuICAgIHRoaXMubGlzdERPTT0kKCc8ZGl2IGNsYXNzPVwidzMtY29udGFpbmVyIHczLWhpZGUgdzMtYm9yZGVyXCI+PC9kaXY+JylcclxuXHJcbiAgICB0aGlzLmhlYWRlckRPTS5vbihcImNsaWNrXCIsKGV2dCk9PiB7XHJcbiAgICAgICAgaWYodGhpcy5saXN0RE9NLmhhc0NsYXNzKFwidzMtc2hvd1wiKSkgdGhpcy5saXN0RE9NLnJlbW92ZUNsYXNzKFwidzMtc2hvd1wiKVxyXG4gICAgICAgIGVsc2UgdGhpcy5saXN0RE9NLmFkZENsYXNzKFwidzMtc2hvd1wiKVxyXG5cclxuICAgICAgICB0aGlzLnBhcmVudFRyZWUuc2VsZWN0R3JvdXBOb2RlKHRoaXMpICAgIFxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5pc09wZW49ZnVuY3Rpb24oKXtcclxuICAgIHJldHVybiAgdGhpcy5saXN0RE9NLmhhc0NsYXNzKFwidzMtc2hvd1wiKVxyXG59XHJcblxyXG5cclxuc2ltcGxlVHJlZUdyb3VwTm9kZS5wcm90b3R5cGUuZXhwYW5kPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLmxpc3RET00uYWRkQ2xhc3MoXCJ3My1zaG93XCIpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWVHcm91cE5vZGUucHJvdG90eXBlLnNocmluaz1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5saXN0RE9NLnJlbW92ZUNsYXNzKFwidzMtc2hvd1wiKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5zb3J0Tm9kZXNCeU5hbWU9ZnVuY3Rpb24oKXtcclxuICAgIHZhciB0cmVlT3B0aW9ucz10aGlzLnBhcmVudFRyZWUub3B0aW9uc1xyXG4gICAgaWYodHJlZU9wdGlvbnMubGVhZk5hbWVQcm9wZXJ0eSkgdmFyIGxlYWZOYW1lUHJvcGVydHk9dHJlZU9wdGlvbnMubGVhZk5hbWVQcm9wZXJ0eVxyXG4gICAgZWxzZSBsZWFmTmFtZVByb3BlcnR5PVwiJGR0SWRcIlxyXG4gICAgdGhpcy5jaGlsZExlYWZOb2Rlcy5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7IFxyXG4gICAgICAgIHZhciBhTmFtZT1hLm5hbWUudG9Mb3dlckNhc2UoKVxyXG4gICAgICAgIHZhciBiTmFtZT1iLm5hbWUudG9Mb3dlckNhc2UoKVxyXG4gICAgICAgIHJldHVybiBhTmFtZS5sb2NhbGVDb21wYXJlKGJOYW1lKSBcclxuICAgIH0pO1xyXG4gICAgLy90aGlzLmxpc3RET00uZW1wdHkoKSAvL05PVEU6IENhbiBub3QgZGVsZXRlIHRob3NlIGxlYWYgbm9kZSBvdGhlcndpc2UgdGhlIGV2ZW50IGhhbmRsZSBpcyBsb3N0XHJcbiAgICB0aGlzLmNoaWxkTGVhZk5vZGVzLmZvckVhY2gob25lTGVhZj0+e3RoaXMubGlzdERPTS5hcHBlbmQob25lTGVhZi5ET00pfSlcclxufVxyXG5cclxuc2ltcGxlVHJlZUdyb3VwTm9kZS5wcm90b3R5cGUuYWRkTm9kZT1mdW5jdGlvbihvYmosc2tpcFJlcGVhdCl7XHJcbiAgICB2YXIgdHJlZU9wdGlvbnM9dGhpcy5wYXJlbnRUcmVlLm9wdGlvbnNcclxuICAgIGlmKHRyZWVPcHRpb25zLmxlYWZOYW1lUHJvcGVydHkpIHZhciBsZWFmTmFtZVByb3BlcnR5PXRyZWVPcHRpb25zLmxlYWZOYW1lUHJvcGVydHlcclxuICAgIGVsc2UgbGVhZk5hbWVQcm9wZXJ0eT1cIiRkdElkXCJcclxuXHJcbiAgICBpZihza2lwUmVwZWF0KXtcclxuICAgICAgICB2YXIgZm91bmRSZXBlYXQ9ZmFsc2U7XHJcbiAgICAgICAgdGhpcy5jaGlsZExlYWZOb2Rlcy5mb3JFYWNoKGFOb2RlPT57XHJcbiAgICAgICAgICAgIGlmKGFOb2RlLm5hbWU9PW9ialtsZWFmTmFtZVByb3BlcnR5XSkge1xyXG4gICAgICAgICAgICAgICAgZm91bmRSZXBlYXQ9dHJ1ZVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICBpZihmb3VuZFJlcGVhdCkgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBhTmV3Tm9kZSA9IG5ldyBzaW1wbGVUcmVlTGVhZk5vZGUodGhpcyxvYmopXHJcbiAgICB0aGlzLmNoaWxkTGVhZk5vZGVzLnB1c2goYU5ld05vZGUpXHJcbiAgICB0aGlzLnJlZnJlc2hOYW1lKClcclxuICAgIHRoaXMubGlzdERPTS5hcHBlbmQoYU5ld05vZGUuRE9NKVxyXG59XHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS10cmVlIGxlYWYgbm9kZS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5mdW5jdGlvbiBzaW1wbGVUcmVlTGVhZk5vZGUocGFyZW50R3JvdXBOb2RlLG9iail7XHJcbiAgICB0aGlzLnBhcmVudEdyb3VwTm9kZT1wYXJlbnRHcm91cE5vZGVcclxuICAgIHRoaXMubGVhZkluZm89b2JqO1xyXG5cclxuICAgIHZhciB0cmVlT3B0aW9ucz10aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLm9wdGlvbnNcclxuICAgIGlmKHRyZWVPcHRpb25zLmxlYWZOYW1lUHJvcGVydHkpIHRoaXMubmFtZT10aGlzLmxlYWZJbmZvW3RyZWVPcHRpb25zLmxlYWZOYW1lUHJvcGVydHldXHJcbiAgICBlbHNlIHRoaXMubmFtZT10aGlzLmxlYWZJbmZvW1wiJGR0SWRcIl1cclxuXHJcbiAgICB0aGlzLmNyZWF0ZUxlYWZOb2RlRE9NKClcclxufVxyXG5cclxuc2ltcGxlVHJlZUxlYWZOb2RlLnByb3RvdHlwZS5kZWxldGVTZWxmID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5ET00ucmVtb3ZlKClcclxuICAgIHZhciBnTm9kZSA9IHRoaXMucGFyZW50R3JvdXBOb2RlXHJcbiAgICBjb25zdCBpbmRleCA9IGdOb2RlLmNoaWxkTGVhZk5vZGVzLmluZGV4T2YodGhpcyk7XHJcbiAgICBpZiAoaW5kZXggPiAtMSkgZ05vZGUuY2hpbGRMZWFmTm9kZXMuc3BsaWNlKGluZGV4LCAxKTtcclxuICAgIGdOb2RlLnJlZnJlc2hOYW1lKClcclxufVxyXG5cclxuc2ltcGxlVHJlZUxlYWZOb2RlLnByb3RvdHlwZS5jcmVhdGVMZWFmTm9kZURPTT1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5ET009JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My13aGl0ZVwiIHN0eWxlPVwiZGlzcGxheTpibG9jazt0ZXh0LWFsaWduOmxlZnQ7d2lkdGg6OTglXCI+Jyt0aGlzLm5hbWUrJzwvYnV0dG9uPicpXHJcbiAgICB2YXIgY2xpY2tGPShlKT0+e1xyXG4gICAgICAgIHRoaXMuaGlnaGxpZ2h0KCk7XHJcbiAgICAgICAgdmFyIGNsaWNrRGV0YWlsPWUuZGV0YWlsXHJcbiAgICAgICAgaWYgKGUuY3RybEtleSkge1xyXG4gICAgICAgICAgICB0aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLmFwcGVuZExlYWZOb2RlVG9TZWxlY3Rpb24odGhpcylcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgdGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5zZWxlY3RMZWFmTm9kZSh0aGlzLGUuZGV0YWlsKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMuRE9NLm9uKFwiY2xpY2tcIiwoZSk9PntjbGlja0YoZSl9KVxyXG5cclxuICAgIHRoaXMuRE9NLm9uKFwiZGJsY2xpY2tcIiwoZSk9PntcclxuICAgICAgICB0aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLmRibENsaWNrTm9kZSh0aGlzKVxyXG4gICAgfSlcclxufVxyXG5zaW1wbGVUcmVlTGVhZk5vZGUucHJvdG90eXBlLmhpZ2hsaWdodD1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5ET00uYWRkQ2xhc3MoXCJ3My1vcmFuZ2VcIilcclxuICAgIHRoaXMuRE9NLmFkZENsYXNzKFwidzMtaG92ZXItYW1iZXJcIilcclxuICAgIHRoaXMuRE9NLnJlbW92ZUNsYXNzKFwidzMtd2hpdGVcIilcclxufVxyXG5zaW1wbGVUcmVlTGVhZk5vZGUucHJvdG90eXBlLmRpbT1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5ET00ucmVtb3ZlQ2xhc3MoXCJ3My1vcmFuZ2VcIilcclxuICAgIHRoaXMuRE9NLnJlbW92ZUNsYXNzKFwidzMtaG92ZXItYW1iZXJcIilcclxuICAgIHRoaXMuRE9NLmFkZENsYXNzKFwidzMtd2hpdGVcIilcclxufVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gc2ltcGxlVHJlZTsiLCJjb25zdCBtc2FsSGVscGVyPXJlcXVpcmUoXCIuLi9tc2FsSGVscGVyXCIpXHJcbmNvbnN0IHsgREJUd2luc0FyciB9ID0gcmVxdWlyZShcIi4vZ2xvYmFsQ2FjaGVcIilcclxuY29uc3QgZ2xvYmFsQ2FjaGU9cmVxdWlyZShcIi4vZ2xvYmFsQ2FjaGVcIilcclxuXHJcbmZ1bmN0aW9uIHN0YXJ0U2VsZWN0aW9uRGlhbG9nKCkge1xyXG4gICAgaWYoIXRoaXMuRE9NKXtcclxuICAgICAgICB0aGlzLkRPTSA9ICQoJzxkaXYgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO2JhY2tncm91bmQtY29sb3I6d2hpdGU7bGVmdDo1MCU7dHJhbnNmb3JtOiB0cmFuc2xhdGVYKC01MCUpIHRyYW5zbGF0ZVkoLTUwJSk7ei1pbmRleDo5OVwiIGNsYXNzPVwidzMtY2FyZC0yXCI+PC9kaXY+JylcclxuICAgICAgICAkKFwiYm9keVwiKS5hcHBlbmQodGhpcy5ET00pXHJcbiAgICAgICAgdGhpcy5ET00uaGlkZSgpXHJcbiAgICB9XHJcbn1cclxuXHJcbnN0YXJ0U2VsZWN0aW9uRGlhbG9nLnByb3RvdHlwZS5wb3B1cCA9IGFzeW5jIGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5ET00uc2hvdygpXHJcbiAgICB0aGlzLkRPTS5lbXB0eSgpXHJcbiAgICB0aGlzLmNvbnRlbnRET00gPSAkKCc8ZGl2IHN0eWxlPVwid2lkdGg6NjY1cHhcIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKHRoaXMuY29udGVudERPTSlcclxuICAgIHRoaXMuY29udGVudERPTS5hcHBlbmQoJCgnPGRpdiBzdHlsZT1cImhlaWdodDo0MHB4XCIgY2xhc3M9XCJ3My1iYXIgdzMtcmVkXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtXCIgc3R5bGU9XCJmb250LXNpemU6MS41ZW1cIj5TZWxlY3QgVHdpbnM8L2Rpdj48L2Rpdj4nKSlcclxuICAgIHZhciBjbG9zZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmlnaHRcIiBzdHlsZT1cImZvbnQtc2l6ZToyZW07cGFkZGluZy10b3A6NHB4XCI+w5c8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmNoaWxkcmVuKCc6Zmlyc3QnKS5hcHBlbmQoY2xvc2VCdXR0b24pXHJcblxyXG4gICAgdGhpcy5idXR0b25Ib2xkZXIgPSAkKFwiPGRpdiBzdHlsZT0naGVpZ2h0OjEwMCUnPjwvZGl2PlwiKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmNoaWxkcmVuKCc6Zmlyc3QnKS5hcHBlbmQodGhpcy5idXR0b25Ib2xkZXIpXHJcbiAgICBjbG9zZUJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5jbG9zZURpYWxvZygpIH0pXHJcblxyXG4gICAgdmFyIHJlcGxhY2VCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWNhcmQgdzMtZGVlcC1vcmFuZ2UgdzMtaG92ZXItZ3JlZW5cIiBzdHlsZT1cImhlaWdodDoxMDAlOyBtYXJnaW4tcmlnaHQ6OHB4XCI+UmVwbGFjZSBBbGwgRGF0YTwvYnV0dG9uPicpXHJcbiAgICB2YXIgYXBwZW5kQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1jYXJkIHczLWRlZXAtb3JhbmdlIHczLWhvdmVyLWdyZWVuXCIgc3R5bGU9XCJoZWlnaHQ6MTAwJVwiPkFwcGVuZCBEYXRhPC9idXR0b24+JylcclxuXHJcbiAgICByZXBsYWNlQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLnVzZVN0YXJ0U2VsZWN0aW9uKFwicmVwbGFjZVwiKSB9KVxyXG4gICAgYXBwZW5kQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLnVzZVN0YXJ0U2VsZWN0aW9uKFwiYXBwZW5kXCIpIH0pXHJcbiAgICB0aGlzLmJ1dHRvbkhvbGRlci5hcHBlbmQocmVwbGFjZUJ1dHRvbiwgYXBwZW5kQnV0dG9uKVxyXG5cclxuICAgIHZhciBwYW5lbEhlaWdodD00NTBcclxuICAgIHZhciByb3cyPSQoJzxkaXYgY2xhc3M9XCJ3My1jZWxsLXJvd1wiPjwvZGl2PicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKHJvdzIpXHJcbiAgICB2YXIgbGVmdFNwYW49JCgnPGRpdiBzdHlsZT1cInBhZGRpbmc6NXB4O3dpZHRoOjIzMHB4O3BhZGRpbmctcmlnaHQ6NXB4O292ZXJmbG93OmhpZGRlblwiPjwvZGl2PicpXHJcbiAgICByb3cyLmFwcGVuZChsZWZ0U3BhbilcclxuICAgIHRoaXMubGVmdFNwYW49bGVmdFNwYW5cclxuXHJcbiAgICB2YXIgcmlnaHRTcGFuPSQoJzxkaXYgY2xhc3M9XCJ3My1jb250YWluZXIgdzMtY2VsbFwiIHN0eWxlPVwicGFkZGluZy10b3A6MTBweDtcIj48L2Rpdj4nKVxyXG4gICAgcm93Mi5hcHBlbmQocmlnaHRTcGFuKSBcclxuICAgIHJpZ2h0U3Bhbi5hcHBlbmQoJCgnPGRpdiBjbGFzcz1cInczLWNvbnRhaW5lciB3My1jYXJkXCIgc3R5bGU9XCJjb2xvcjpncmF5O2hlaWdodDonKyhwYW5lbEhlaWdodC0xMCkrJ3B4O292ZXJmbG93OmF1dG87d2lkdGg6NDEwcHg7XCI+PC9kaXY+JykpXHJcbiAgICB2YXIgc2VsZWN0ZWRUd2luc0RPTT0kKFwiPHRhYmxlIHN0eWxlPSd3aWR0aDoxMDAlJz48L3RhYmxlPlwiKVxyXG4gICAgc2VsZWN0ZWRUd2luc0RPTS5jc3Moe1wiYm9yZGVyLWNvbGxhcHNlXCI6XCJjb2xsYXBzZVwifSlcclxuICAgIHJpZ2h0U3Bhbi5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKHNlbGVjdGVkVHdpbnNET00pXHJcbiAgICB0aGlzLnNlbGVjdGVkVHdpbnNET009c2VsZWN0ZWRUd2luc0RPTSBcclxuXHJcbiAgICB0aGlzLmxlZnRTcGFuLmFwcGVuZCgkKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtIHczLXRvb2x0aXBcIiBzdHlsZT1cImZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nLWxlZnQ6MnB4O2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6Z3JheVwiPlNlbGVjdCBUd2lucyBmcm9tPHAgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0ZXh0LWFsaWduOmxlZnQ7Zm9udC13ZWlnaHQ6bm9ybWFsO3RvcDotMTBweDt3aWR0aDoyMDBweFwiIGNsYXNzPVwidzMtdGV4dCB3My10YWcgdzMtdGlueVwiPmNob29zZSBvbmUgb3IgbW9yZSBtb2RlbHM8L3A+PC9kaXY+PC9kaXY+JykpXHJcblxyXG4gICAgdGhpcy5tb2RlbHNDaGVja0JveGVzPSQoJzxmb3JtIGNsYXNzPVwidzMtY29udGFpbmVyIHczLWJvcmRlclwiIHN0eWxlPVwiaGVpZ2h0OicrKHBhbmVsSGVpZ2h0LTQwKSsncHg7b3ZlcmZsb3c6YXV0b1wiPjwvZm9ybT4nKVxyXG4gICAgbGVmdFNwYW4uYXBwZW5kKHRoaXMubW9kZWxzQ2hlY2tCb3hlcylcclxuICAgIHRoaXMuZmlsbEF2YWlsYWJsZU1vZGVscygpXHJcblxyXG4gICAgdGhpcy5saXN0VHdpbnMoKVxyXG59XHJcblxyXG5zdGFydFNlbGVjdGlvbkRpYWxvZy5wcm90b3R5cGUuY2xvc2VEaWFsb2c9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuRE9NLmhpZGUoKVxyXG4gICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwic3RhcnRTZWxlY3Rpb25EaWFsb2dfY2xvc2VkXCJ9KVxyXG59XHJcblxyXG5zdGFydFNlbGVjdGlvbkRpYWxvZy5wcm90b3R5cGUuZmlsbEF2YWlsYWJsZU1vZGVscyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5tb2RlbHNDaGVja0JveGVzLmFwcGVuZCgnPGlucHV0IGNsYXNzPVwidzMtY2hlY2tcIiB0eXBlPVwiY2hlY2tib3hcIiBpZD1cIkFMTFwiPjxsYWJlbCBzdHlsZT1cInBhZGRpbmctbGVmdDo1cHhcIj48Yj5BTEw8L2I+PC9sYWJlbD48cC8+JylcclxuICAgIGdsb2JhbENhY2hlLkRCTW9kZWxzQXJyLmZvckVhY2gob25lTW9kZWw9PntcclxuICAgICAgICB2YXIgbW9kZWxOYW1lPW9uZU1vZGVsW1wiZGlzcGxheU5hbWVcIl1cclxuICAgICAgICB2YXIgbW9kZWxJRD1vbmVNb2RlbFtcImlkXCJdXHJcbiAgICAgICAgdGhpcy5tb2RlbHNDaGVja0JveGVzLmFwcGVuZChgPGlucHV0IGNsYXNzPVwidzMtY2hlY2tcIiB0eXBlPVwiY2hlY2tib3hcIiBpZD1cIiR7bW9kZWxJRH1cIj48bGFiZWwgc3R5bGU9XCJwYWRkaW5nLWxlZnQ6NXB4XCI+JHttb2RlbE5hbWV9PC9sYWJlbD48cC8+YClcclxuICAgIH0pXHJcbiAgICB0aGlzLm1vZGVsc0NoZWNrQm94ZXMub24oXCJjaGFuZ2VcIiwoZXZ0KT0+e1xyXG4gICAgICAgIGlmKCQoZXZ0LnRhcmdldCkuYXR0cihcImlkXCIpPT1cIkFMTFwiKXtcclxuICAgICAgICAgICAgLy9zZWxlY3QgYWxsIHRoZSBvdGhlciBpbnB1dFxyXG4gICAgICAgICAgICB2YXIgdmFsPSQoZXZ0LnRhcmdldCkucHJvcChcImNoZWNrZWRcIilcclxuICAgICAgICAgICAgdGhpcy5tb2RlbHNDaGVja0JveGVzLmNoaWxkcmVuKCdpbnB1dCcpLmVhY2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgJCh0aGlzKS5wcm9wKFwiY2hlY2tlZFwiLHZhbClcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMubGlzdFR3aW5zKClcclxuICAgIH0pXHJcbn1cclxuXHJcbnN0YXJ0U2VsZWN0aW9uRGlhbG9nLnByb3RvdHlwZS5nZXRTZWxlY3RlZFR3aW5zPWZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgcmVBcnI9W11cclxuICAgIHZhciBjaG9zZW5Nb2RlbHM9e31cclxuICAgIHRoaXMubW9kZWxzQ2hlY2tCb3hlcy5jaGlsZHJlbignaW5wdXQnKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBpZighJCh0aGlzKS5wcm9wKFwiY2hlY2tlZFwiKSkgcmV0dXJuO1xyXG4gICAgICAgIGlmKCQodGhpcykuYXR0cihcImlkXCIpPT1cIkFMTFwiKSByZXR1cm47XHJcbiAgICAgICAgY2hvc2VuTW9kZWxzWyQodGhpcykuYXR0cihcImlkXCIpXT0xXHJcbiAgICB9KTtcclxuICAgIGdsb2JhbENhY2hlLkRCVHdpbnNBcnIuZm9yRWFjaChhVHdpbj0+e1xyXG4gICAgICAgIGlmKGNob3Nlbk1vZGVsc1thVHdpbltcIm1vZGVsSURcIl1dKSAgcmVBcnIucHVzaChhVHdpbilcclxuICAgIH0pXHJcbiAgICByZXR1cm4gcmVBcnI7XHJcbn1cclxuXHJcbnN0YXJ0U2VsZWN0aW9uRGlhbG9nLnByb3RvdHlwZS5saXN0VHdpbnM9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuc2VsZWN0ZWRUd2luc0RPTS5lbXB0eSgpXHJcbiAgICB2YXIgdHI9JCgnPHRyPjx0ZCBzdHlsZT1cImJvcmRlci1yaWdodDpzb2xpZCAxcHggbGlnaHRncmV5O2JvcmRlci1ib3R0b206c29saWQgMXB4IGxpZ2h0Z3JleTtmb250LXdlaWdodDpib2xkXCI+SUQ8L3RkPjx0ZCBzdHlsZT1cImJvcmRlci1ib3R0b206c29saWQgMXB4IGxpZ2h0Z3JleTtmb250LXdlaWdodDpib2xkXCI+TU9ERUw8L3RkPjwvdHI+JylcclxuICAgIHRoaXMuc2VsZWN0ZWRUd2luc0RPTS5hcHBlbmQodHIpXHJcblxyXG4gICAgdmFyIHNlbGVjdGVkVHdpbnM9dGhpcy5nZXRTZWxlY3RlZFR3aW5zKClcclxuICAgIHNlbGVjdGVkVHdpbnMuZm9yRWFjaChhVHdpbj0+e1xyXG4gICAgICAgIHZhciB0cj0kKCc8dHI+PHRkIHN0eWxlPVwiYm9yZGVyLXJpZ2h0OnNvbGlkIDFweCBsaWdodGdyZXk7Ym9yZGVyLWJvdHRvbTpzb2xpZCAxcHggbGlnaHRncmV5XCI+JythVHdpbltcImRpc3BsYXlOYW1lXCJdKyc8L3RkPjx0ZCBzdHlsZT1cImJvcmRlci1ib3R0b206c29saWQgMXB4IGxpZ2h0Z3JleVwiPicrYVR3aW5bJ21vZGVsSUQnXSsnPC90ZD48L3RyPicpXHJcbiAgICAgICAgdGhpcy5zZWxlY3RlZFR3aW5zRE9NLmFwcGVuZCh0cilcclxuICAgIH0pXHJcbiAgICBpZihzZWxlY3RlZFR3aW5zLmxlbmd0aD09MCl7XHJcbiAgICAgICAgdmFyIHRyPSQoJzx0cj48dGQgc3R5bGU9XCJjb2xvcjpncmF5XCI+emVybyByZWNvcmQ8L3RkPjx0ZD48L3RkPjwvdHI+JylcclxuICAgICAgICB0aGlzLnNlbGVjdGVkVHdpbnNET00uYXBwZW5kKHRyKSAgICBcclxuICAgIH1cclxufVxyXG5cclxuXHJcbnN0YXJ0U2VsZWN0aW9uRGlhbG9nLnByb3RvdHlwZS51c2VTdGFydFNlbGVjdGlvbj1mdW5jdGlvbihhY3Rpb24pe1xyXG4gICAgdmFyIHNlbGVjdGVkVHdpbnM9dGhpcy5nZXRTZWxlY3RlZFR3aW5zKClcclxuICAgIHZhciB0d2luSURzPVtdXHJcbiAgICBzZWxlY3RlZFR3aW5zLmZvckVhY2goYVR3aW49Pnt0d2luSURzLnB1c2goYVR3aW5bXCJpZFwiXSl9KVxyXG5cclxuICAgIHZhciBtb2RlbElEcz1bXVxyXG4gICAgZ2xvYmFsQ2FjaGUuREJNb2RlbHNBcnIuZm9yRWFjaChvbmVNb2RlbD0+e21vZGVsSURzLnB1c2gob25lTW9kZWxbXCJpZFwiXSl9KVxyXG5cclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInN0YXJ0U2VsZWN0aW9uX1wiK2FjdGlvbiwgXCJ0d2luSURzXCI6IHR3aW5JRHMsXCJtb2RlbElEc1wiOm1vZGVsSURzIH0pXHJcbiAgICB0aGlzLmNsb3NlRGlhbG9nKClcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgc3RhcnRTZWxlY3Rpb25EaWFsb2coKTsiLCIndXNlIHN0cmljdCc7XHJcblxyXG5jb25zdCBtb2RlbEFuYWx5emVyID0gcmVxdWlyZShcIi4vbW9kZWxBbmFseXplclwiKTtcclxuY29uc3QgZm9ybWF0dGVyID0gbmV3IEludGwuTnVtYmVyRm9ybWF0KCdlbi1VUycsIHtcclxuICAgIG1pbmltdW1GcmFjdGlvbkRpZ2l0czogMyxcclxuICAgIG1heGltdW1GcmFjdGlvbkRpZ2l0czogMyxcclxufSk7XHJcbmNvbnN0IHNpbXBsZVNlbGVjdE1lbnUgPSByZXF1aXJlKFwiLi9zaW1wbGVTZWxlY3RNZW51XCIpXHJcbmNvbnN0IHNpbXBsZUNvbmZpcm1EaWFsb2cgPSByZXF1aXJlKFwiLi9zaW1wbGVDb25maXJtRGlhbG9nXCIpXHJcbmNvbnN0IGdsb2JhbENhY2hlID0gcmVxdWlyZShcIi4vZ2xvYmFsQ2FjaGVcIilcclxuY29uc3QgbXNhbEhlbHBlcj1yZXF1aXJlKFwiLi4vbXNhbEhlbHBlclwiKVxyXG5cclxuZnVuY3Rpb24gdG9wb2xvZ3lET00oRE9NKXtcclxuICAgIHRoaXMuRE9NPURPTVxyXG4gICAgdGhpcy5kZWZhdWx0Tm9kZVNpemU9MzBcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmluaXQ9ZnVuY3Rpb24oKXtcclxuICAgIGN5dG9zY2FwZS53YXJuaW5ncyhmYWxzZSkgIFxyXG4gICAgdGhpcy5jb3JlID0gY3l0b3NjYXBlKHtcclxuICAgICAgICBjb250YWluZXI6ICB0aGlzLkRPTVswXSwgLy8gY29udGFpbmVyIHRvIHJlbmRlciBpblxyXG5cclxuICAgICAgICAvLyBpbml0aWFsIHZpZXdwb3J0IHN0YXRlOlxyXG4gICAgICAgIHpvb206IDEsXHJcbiAgICAgICAgcGFuOiB7IHg6IDAsIHk6IDAgfSxcclxuXHJcbiAgICAgICAgLy8gaW50ZXJhY3Rpb24gb3B0aW9uczpcclxuICAgICAgICBtaW5ab29tOiAwLjEsXHJcbiAgICAgICAgbWF4Wm9vbTogMTAsXHJcbiAgICAgICAgem9vbWluZ0VuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgdXNlclpvb21pbmdFbmFibGVkOiB0cnVlLFxyXG4gICAgICAgIHBhbm5pbmdFbmFibGVkOiB0cnVlLFxyXG4gICAgICAgIHVzZXJQYW5uaW5nRW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICBib3hTZWxlY3Rpb25FbmFibGVkOiB0cnVlLFxyXG4gICAgICAgIHNlbGVjdGlvblR5cGU6ICdzaW5nbGUnLFxyXG4gICAgICAgIHRvdWNoVGFwVGhyZXNob2xkOiA4LFxyXG4gICAgICAgIGRlc2t0b3BUYXBUaHJlc2hvbGQ6IDQsXHJcbiAgICAgICAgYXV0b2xvY2s6IGZhbHNlLFxyXG4gICAgICAgIGF1dG91bmdyYWJpZnk6IGZhbHNlLFxyXG4gICAgICAgIGF1dG91bnNlbGVjdGlmeTogZmFsc2UsXHJcblxyXG4gICAgICAgIC8vIHJlbmRlcmluZyBvcHRpb25zOlxyXG4gICAgICAgIGhlYWRsZXNzOiBmYWxzZSxcclxuICAgICAgICBzdHlsZUVuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgaGlkZUVkZ2VzT25WaWV3cG9ydDogZmFsc2UsXHJcbiAgICAgICAgdGV4dHVyZU9uVmlld3BvcnQ6IGZhbHNlLFxyXG4gICAgICAgIG1vdGlvbkJsdXI6IGZhbHNlLFxyXG4gICAgICAgIG1vdGlvbkJsdXJPcGFjaXR5OiAwLjIsXHJcbiAgICAgICAgd2hlZWxTZW5zaXRpdml0eTogMC4zLFxyXG4gICAgICAgIHBpeGVsUmF0aW86ICdhdXRvJyxcclxuXHJcbiAgICAgICAgZWxlbWVudHM6IFtdLCAvLyBsaXN0IG9mIGdyYXBoIGVsZW1lbnRzIHRvIHN0YXJ0IHdpdGhcclxuXHJcbiAgICAgICAgc3R5bGU6IFsgLy8gdGhlIHN0eWxlc2hlZXQgZm9yIHRoZSBncmFwaFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxlY3RvcjogJ25vZGUnLFxyXG4gICAgICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICBcIndpZHRoXCI6dGhpcy5kZWZhdWx0Tm9kZVNpemUsXCJoZWlnaHRcIjp0aGlzLmRlZmF1bHROb2RlU2l6ZSxcclxuICAgICAgICAgICAgICAgICAgICAnbGFiZWwnOiAnZGF0YShpZCknLFxyXG4gICAgICAgICAgICAgICAgICAgICdvcGFjaXR5JzowLjksXHJcbiAgICAgICAgICAgICAgICAgICAgJ2ZvbnQtc2l6ZSc6XCIxMnB4XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgJ2ZvbnQtZmFtaWx5JzonR2VuZXZhLCBBcmlhbCwgSGVsdmV0aWNhLCBzYW5zLXNlcmlmJ1xyXG4gICAgICAgICAgICAgICAgICAgIC8vLCdiYWNrZ3JvdW5kLWltYWdlJzogZnVuY3Rpb24oZWxlKXsgcmV0dXJuIFwiaW1hZ2VzL2NhdC5wbmdcIjsgfVxyXG4gICAgICAgICAgICAgICAgICAgIC8vLCdiYWNrZ3JvdW5kLWZpdCc6J2NvbnRhaW4nIC8vY292ZXJcclxuICAgICAgICAgICAgICAgICAgICAvLydiYWNrZ3JvdW5kLWNvbG9yJzogZnVuY3Rpb24oIGVsZSApeyByZXR1cm4gZWxlLmRhdGEoJ2JnJykgfVxyXG4gICAgICAgICAgICAgICAgICAgICwnYmFja2dyb3VuZC13aWR0aCc6JzcwJSdcclxuICAgICAgICAgICAgICAgICAgICAsJ2JhY2tncm91bmQtaGVpZ2h0JzonNzAlJ1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxlY3RvcjogJ2VkZ2UnLFxyXG4gICAgICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAnd2lkdGgnOjIsXHJcbiAgICAgICAgICAgICAgICAgICAgJ2xpbmUtY29sb3InOiAnIzg4OCcsXHJcbiAgICAgICAgICAgICAgICAgICAgJ3RhcmdldC1hcnJvdy1jb2xvcic6ICcjNTU1JyxcclxuICAgICAgICAgICAgICAgICAgICAndGFyZ2V0LWFycm93LXNoYXBlJzogJ3RyaWFuZ2xlJyxcclxuICAgICAgICAgICAgICAgICAgICAnY3VydmUtc3R5bGUnOiAnYmV6aWVyJyxcclxuICAgICAgICAgICAgICAgICAgICAnYXJyb3ctc2NhbGUnOjAuNlxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7c2VsZWN0b3I6ICdlZGdlOnNlbGVjdGVkJyxcclxuICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6IDMsXHJcbiAgICAgICAgICAgICAgICAnbGluZS1jb2xvcic6ICdyZWQnLFxyXG4gICAgICAgICAgICAgICAgJ3RhcmdldC1hcnJvdy1jb2xvcic6ICdyZWQnLFxyXG4gICAgICAgICAgICAgICAgJ3NvdXJjZS1hcnJvdy1jb2xvcic6ICdyZWQnXHJcbiAgICAgICAgICAgIH19LFxyXG4gICAgICAgICAgICB7c2VsZWN0b3I6ICdub2RlOnNlbGVjdGVkJyxcclxuICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICdib3JkZXItY29sb3InOlwicmVkXCIsXHJcbiAgICAgICAgICAgICAgICAnYm9yZGVyLXdpZHRoJzoyLFxyXG4gICAgICAgICAgICAgICAgJ2JhY2tncm91bmQtY29sb3InOiAnR3JheSdcclxuICAgICAgICAgICAgfX0sXHJcbiAgICAgICAgICAgIHtzZWxlY3RvcjogJ25vZGUuaG92ZXInLFxyXG4gICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgJ2JhY2tncm91bmQtYmxhY2tlbic6MC41XHJcbiAgICAgICAgICAgIH19LHtzZWxlY3RvcjogJ2VkZ2UuaG92ZXInLFxyXG4gICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzo1XHJcbiAgICAgICAgICAgIH19XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIF1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vY3l0b3NjYXBlIGVkZ2UgZWRpdGluZyBwbHVnLWluXHJcbiAgICB0aGlzLmNvcmUuZWRnZUVkaXRpbmcoe1xyXG4gICAgICAgIHVuZG9hYmxlOiB0cnVlLFxyXG4gICAgICAgIGJlbmRSZW1vdmFsU2Vuc2l0aXZpdHk6IDE2LFxyXG4gICAgICAgIGVuYWJsZU11bHRpcGxlQW5jaG9yUmVtb3ZhbE9wdGlvbjogdHJ1ZSxcclxuICAgICAgICBzdGlja3lBbmNob3JUb2xlcmVuY2U6IDIwLFxyXG4gICAgICAgIGFuY2hvclNoYXBlU2l6ZUZhY3RvcjogNSxcclxuICAgICAgICBlbmFibGVBbmNob3JTaXplTm90SW1wYWN0Qnlab29tOnRydWUsXHJcbiAgICAgICAgZW5hYmxlUmVtb3ZlQW5jaG9yTWlkT2ZOZWFyTGluZTpmYWxzZSxcclxuICAgICAgICBlbmFibGVDcmVhdGVBbmNob3JPbkRyYWc6ZmFsc2VcclxuICAgIH0pO1xyXG5cclxuICAgIFxyXG4gICAgdGhpcy5jb3JlLmJveFNlbGVjdGlvbkVuYWJsZWQodHJ1ZSlcclxuXHJcblxyXG4gICAgdGhpcy5jb3JlLm9uKCd0YXBzZWxlY3QnLCAoKT0+e3RoaXMuc2VsZWN0RnVuY3Rpb24oKX0pO1xyXG4gICAgdGhpcy5jb3JlLm9uKCd0YXB1bnNlbGVjdCcsICgpPT57dGhpcy5zZWxlY3RGdW5jdGlvbigpfSk7XHJcblxyXG4gICAgdGhpcy5jb3JlLm9uKCdib3hlbmQnLChlKT0+ey8vcHV0IGluc2lkZSBib3hlbmQgZXZlbnQgdG8gdHJpZ2dlciBvbmx5IG9uZSB0aW1lLCBhbmQgcmVwbGVhdGx5IGFmdGVyIGVhY2ggYm94IHNlbGVjdFxyXG4gICAgICAgIHRoaXMuY29yZS5vbmUoJ2JveHNlbGVjdCcsKCk9Pnt0aGlzLnNlbGVjdEZ1bmN0aW9uKCl9KVxyXG4gICAgfSlcclxuXHJcbiAgICB0aGlzLmNvcmUub24oJ2N4dHRhcCcsKGUpPT57XHJcbiAgICAgICAgdGhpcy5jYW5jZWxUYXJnZXROb2RlTW9kZSgpXHJcbiAgICB9KVxyXG5cclxuICAgIHRoaXMuY29yZS5vbignbW91c2VvdmVyJyxlPT57XHJcblxyXG4gICAgICAgIHRoaXMubW91c2VPdmVyRnVuY3Rpb24oZSlcclxuICAgIH0pXHJcbiAgICB0aGlzLmNvcmUub24oJ21vdXNlb3V0JyxlPT57XHJcbiAgICAgICAgdGhpcy5tb3VzZU91dEZ1bmN0aW9uKGUpXHJcbiAgICB9KVxyXG4gICAgXHJcbiAgICB0aGlzLmNvcmUub24oJ3pvb20nLChlKT0+e1xyXG4gICAgICAgIHZhciBmcz10aGlzLmdldEZvbnRTaXplSW5DdXJyZW50Wm9vbSgpO1xyXG4gICAgICAgIHZhciBkaW1lbnNpb249dGhpcy5nZXROb2RlU2l6ZUluQ3VycmVudFpvb20oKTtcclxuICAgICAgICB0aGlzLmNvcmUuc3R5bGUoKVxyXG4gICAgICAgICAgICAuc2VsZWN0b3IoJ25vZGUnKVxyXG4gICAgICAgICAgICAuc3R5bGUoeyAnZm9udC1zaXplJzogZnMsIHdpZHRoOiBkaW1lbnNpb24sIGhlaWdodDogZGltZW5zaW9uIH0pXHJcbiAgICAgICAgICAgIC51cGRhdGUoKVxyXG4gICAgICAgIHRoaXMuY29yZS5zdHlsZSgpXHJcbiAgICAgICAgICAgIC5zZWxlY3Rvcignbm9kZTpzZWxlY3RlZCcpXHJcbiAgICAgICAgICAgIC5zdHlsZSh7ICdib3JkZXItd2lkdGgnOiBNYXRoLmNlaWwoZGltZW5zaW9uIC8gMTUpIH0pXHJcbiAgICAgICAgICAgIC51cGRhdGUoKVxyXG4gICAgfSlcclxuXHJcbiAgICB2YXIgaW5zdGFuY2UgPSB0aGlzLmNvcmUuZWRnZUVkaXRpbmcoJ2dldCcpO1xyXG4gICAgdmFyIHRhcGRyYWdIYW5kbGVyPShlKSA9PiB7XHJcbiAgICAgICAgaW5zdGFuY2Uua2VlcEFuY2hvcnNBYnNvbHV0ZVBvc2l0aW9uRHVyaW5nTW92aW5nKClcclxuICAgICAgICBpZihlLnRhcmdldC5pc05vZGUgJiYgZS50YXJnZXQuaXNOb2RlKCkpIHRoaXMuZHJhZ2dpbmdOb2RlPWUudGFyZ2V0XHJcbiAgICAgICAgdGhpcy5zbWFydFBvc2l0aW9uTm9kZShlLnBvc2l0aW9uKVxyXG4gICAgfVxyXG4gICAgdmFyIHNldE9uZVRpbWVHcmFiID0gKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuY29yZS5vbmNlKFwiZ3JhYlwiLCAoZSkgPT4ge1xyXG4gICAgICAgICAgICB2YXIgZHJhZ2dpbmdOb2RlcyA9IHRoaXMuY29yZS5jb2xsZWN0aW9uKClcclxuICAgICAgICAgICAgaWYgKGUudGFyZ2V0LmlzTm9kZSgpKSBkcmFnZ2luZ05vZGVzLm1lcmdlKGUudGFyZ2V0KVxyXG4gICAgICAgICAgICB2YXIgYXJyID0gdGhpcy5jb3JlLiQoXCI6c2VsZWN0ZWRcIilcclxuICAgICAgICAgICAgYXJyLmZvckVhY2goKGVsZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGVsZS5pc05vZGUoKSkgZHJhZ2dpbmdOb2Rlcy5tZXJnZShlbGUpXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIGluc3RhbmNlLnN0b3JlQW5jaG9yc0Fic29sdXRlUG9zaXRpb24oZHJhZ2dpbmdOb2RlcylcclxuICAgICAgICAgICAgdGhpcy5jb3JlLm9uKFwidGFwZHJhZ1wiLHRhcGRyYWdIYW5kbGVyIClcclxuICAgICAgICAgICAgc2V0T25lVGltZUZyZWUoKVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbiAgICB2YXIgc2V0T25lVGltZUZyZWUgPSAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5jb3JlLm9uY2UoXCJmcmVlXCIsIChlKSA9PiB7XHJcbiAgICAgICAgICAgIHZhciBpbnN0YW5jZSA9IHRoaXMuY29yZS5lZGdlRWRpdGluZygnZ2V0Jyk7XHJcbiAgICAgICAgICAgIGluc3RhbmNlLnJlc2V0QW5jaG9yc0Fic29sdXRlUG9zaXRpb24oKVxyXG4gICAgICAgICAgICB0aGlzLmRyYWdnaW5nTm9kZT1udWxsXHJcbiAgICAgICAgICAgIHNldE9uZVRpbWVHcmFiKClcclxuICAgICAgICAgICAgdGhpcy5jb3JlLnJlbW92ZUxpc3RlbmVyKFwidGFwZHJhZ1wiLHRhcGRyYWdIYW5kbGVyKVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbiAgICBzZXRPbmVUaW1lR3JhYigpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5zbWFydFBvc2l0aW9uTm9kZSA9IGZ1bmN0aW9uIChtb3VzZVBvc2l0aW9uKSB7XHJcbiAgICB2YXIgem9vbUxldmVsPXRoaXMuY29yZS56b29tKClcclxuICAgIGlmKCF0aGlzLmRyYWdnaW5nTm9kZSkgcmV0dXJuXHJcbiAgICAvL2NvbXBhcmluZyBub2RlcyBzZXQ6IGl0cyBjb25uZWN0ZnJvbSBub2RlcyBhbmQgdGhlaXIgY29ubmVjdHRvIG5vZGVzLCBpdHMgY29ubmVjdHRvIG5vZGVzIGFuZCB0aGVpciBjb25uZWN0ZnJvbSBub2Rlc1xyXG4gICAgdmFyIGluY29tZXJzPXRoaXMuZHJhZ2dpbmdOb2RlLmluY29tZXJzKClcclxuICAgIHZhciBvdXRlckZyb21JbmNvbT0gaW5jb21lcnMub3V0Z29lcnMoKVxyXG4gICAgdmFyIG91dGVyPXRoaXMuZHJhZ2dpbmdOb2RlLm91dGdvZXJzKClcclxuICAgIHZhciBpbmNvbUZyb21PdXRlcj1vdXRlci5pbmNvbWVycygpXHJcbiAgICB2YXIgbW9uaXRvclNldD1pbmNvbWVycy51bmlvbihvdXRlckZyb21JbmNvbSkudW5pb24ob3V0ZXIpLnVuaW9uKGluY29tRnJvbU91dGVyKS5maWx0ZXIoJ25vZGUnKS51bm1lcmdlKHRoaXMuZHJhZ2dpbmdOb2RlKVxyXG5cclxuICAgIHZhciByZXR1cm5FeHBlY3RlZFBvcz0oZGlmZkFycixwb3NBcnIpPT57XHJcbiAgICAgICAgdmFyIG1pbkRpc3RhbmNlPU1hdGgubWluKC4uLmRpZmZBcnIpXHJcbiAgICAgICAgaWYobWluRGlzdGFuY2Uqem9vbUxldmVsIDwgMTApICByZXR1cm4gcG9zQXJyW2RpZmZBcnIuaW5kZXhPZihtaW5EaXN0YW5jZSldXHJcbiAgICAgICAgZWxzZSByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgeERpZmY9W11cclxuICAgIHZhciB4UG9zPVtdXHJcbiAgICB2YXIgeURpZmY9W11cclxuICAgIHZhciB5UG9zPVtdXHJcbiAgICBtb25pdG9yU2V0LmZvckVhY2goKGVsZSk9PntcclxuICAgICAgICB4RGlmZi5wdXNoKE1hdGguYWJzKGVsZS5wb3NpdGlvbigpLngtbW91c2VQb3NpdGlvbi54KSlcclxuICAgICAgICB4UG9zLnB1c2goZWxlLnBvc2l0aW9uKCkueClcclxuICAgICAgICB5RGlmZi5wdXNoKE1hdGguYWJzKGVsZS5wb3NpdGlvbigpLnktbW91c2VQb3NpdGlvbi55KSlcclxuICAgICAgICB5UG9zLnB1c2goZWxlLnBvc2l0aW9uKCkueSlcclxuICAgIH0pXHJcbiAgICB2YXIgcHJlZlg9cmV0dXJuRXhwZWN0ZWRQb3MoeERpZmYseFBvcylcclxuICAgIHZhciBwcmVmWT1yZXR1cm5FeHBlY3RlZFBvcyh5RGlmZix5UG9zKVxyXG4gICAgaWYocHJlZlghPW51bGwpIHtcclxuICAgICAgICB0aGlzLmRyYWdnaW5nTm9kZS5wb3NpdGlvbigneCcsIHByZWZYKTtcclxuICAgIH1cclxuICAgIGlmKHByZWZZIT1udWxsKSB7XHJcbiAgICAgICAgdGhpcy5kcmFnZ2luZ05vZGUucG9zaXRpb24oJ3knLCBwcmVmWSk7XHJcbiAgICB9XHJcbiAgICAvL2NvbnNvbGUubG9nKFwiLS0tLVwiKVxyXG4gICAgLy9tb25pdG9yU2V0LmZvckVhY2goKGVsZSk9Pntjb25zb2xlLmxvZyhlbGUuaWQoKSl9KVxyXG4gICAgLy9jb25zb2xlLmxvZyhtb25pdG9yU2V0LnNpemUoKSlcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLm1vdXNlT3ZlckZ1bmN0aW9uPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgaWYoIWUudGFyZ2V0LmRhdGEpIHJldHVyblxyXG4gICAgdmFyIGluZm89ZS50YXJnZXQuZGF0YSgpLm9yaWdpbmFsSW5mb1xyXG4gICAgaWYoaW5mbz09bnVsbCkgcmV0dXJuO1xyXG4gICAgaWYodGhpcy5sYXN0SG92ZXJUYXJnZXQpIHRoaXMubGFzdEhvdmVyVGFyZ2V0LnJlbW92ZUNsYXNzKFwiaG92ZXJcIilcclxuICAgIHRoaXMubGFzdEhvdmVyVGFyZ2V0PWUudGFyZ2V0XHJcbiAgICBlLnRhcmdldC5hZGRDbGFzcyhcImhvdmVyXCIpXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJzZWxlY3ROb2Rlc1wiLCBcImluZm9cIjogW2luZm9dIH0pXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5tb3VzZU91dEZ1bmN0aW9uPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgdGhpcy5zZWxlY3RGdW5jdGlvbigpXHJcbiAgICBpZih0aGlzLmxhc3RIb3ZlclRhcmdldCl7XHJcbiAgICAgICAgdGhpcy5sYXN0SG92ZXJUYXJnZXQucmVtb3ZlQ2xhc3MoXCJob3ZlclwiKVxyXG4gICAgICAgIHRoaXMubGFzdEhvdmVyVGFyZ2V0PW51bGw7XHJcbiAgICB9IFxyXG5cclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnNlbGVjdEZ1bmN0aW9uID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGFyciA9IHRoaXMuY29yZS4kKFwiOnNlbGVjdGVkXCIpXHJcbiAgICBpZiAoYXJyLmxlbmd0aCA9PSAwKSByZXR1cm5cclxuICAgIHZhciByZSA9IFtdXHJcbiAgICBhcnIuZm9yRWFjaCgoZWxlKSA9PiB7IHJlLnB1c2goZWxlLmRhdGEoKS5vcmlnaW5hbEluZm8pIH0pXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJzZWxlY3ROb2Rlc1wiLCBpbmZvOiByZSB9KVxyXG5cclxuICAgIC8vZm9yIGRlYnVnZ2luZyBwdXJwb3NlXHJcbiAgICAvL2Fyci5mb3JFYWNoKChlbGUpPT57XHJcbiAgICAvLyAgY29uc29sZS5sb2coXCJcIilcclxuICAgIC8vfSlcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmdldEZvbnRTaXplSW5DdXJyZW50Wm9vbT1mdW5jdGlvbigpe1xyXG4gICAgdmFyIGN1clpvb209dGhpcy5jb3JlLnpvb20oKVxyXG4gICAgaWYoY3VyWm9vbT4xKXtcclxuICAgICAgICB2YXIgbWF4RlM9MTJcclxuICAgICAgICB2YXIgbWluRlM9NVxyXG4gICAgICAgIHZhciByYXRpbz0gKG1heEZTL21pbkZTLTEpLzkqKGN1clpvb20tMSkrMVxyXG4gICAgICAgIHZhciBmcz1NYXRoLmNlaWwobWF4RlMvcmF0aW8pXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB2YXIgbWF4RlM9MTIwXHJcbiAgICAgICAgdmFyIG1pbkZTPTEyXHJcbiAgICAgICAgdmFyIHJhdGlvPSAobWF4RlMvbWluRlMtMSkvOSooMS9jdXJab29tLTEpKzFcclxuICAgICAgICB2YXIgZnM9TWF0aC5jZWlsKG1pbkZTKnJhdGlvKVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZzO1xyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuZ2V0Tm9kZVNpemVJbkN1cnJlbnRab29tPWZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgY3VyWm9vbT10aGlzLmNvcmUuem9vbSgpXHJcbiAgICBpZihjdXJab29tPjEpey8vc2NhbGUgdXAgYnV0IG5vdCB0b28gbXVjaFxyXG4gICAgICAgIHZhciByYXRpbz0gKGN1clpvb20tMSkqKDItMSkvOSsxXHJcbiAgICAgICAgcmV0dXJuIE1hdGguY2VpbCh0aGlzLmRlZmF1bHROb2RlU2l6ZS9yYXRpbylcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHZhciByYXRpbz0gKDEvY3VyWm9vbS0xKSooNC0xKS85KzFcclxuICAgICAgICByZXR1cm4gTWF0aC5jZWlsKHRoaXMuZGVmYXVsdE5vZGVTaXplKnJhdGlvKVxyXG4gICAgfVxyXG59XHJcblxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnVwZGF0ZU1vZGVsQXZhcnRhPWZ1bmN0aW9uKG1vZGVsSUQsZGF0YVVybCl7XHJcbiAgICB0cnl7XHJcbiAgICAgICAgdGhpcy5jb3JlLnN0eWxlKCkgXHJcbiAgICAgICAgLnNlbGVjdG9yKCdub2RlW21vZGVsSUQgPSBcIicrbW9kZWxJRCsnXCJdJylcclxuICAgICAgICAuc3R5bGUoeydiYWNrZ3JvdW5kLWltYWdlJzogZGF0YVVybH0pXHJcbiAgICAgICAgLnVwZGF0ZSgpICAgXHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgXHJcbiAgICB9XHJcbiAgICBcclxufVxyXG50b3BvbG9neURPTS5wcm90b3R5cGUudXBkYXRlTW9kZWxUd2luQ29sb3I9ZnVuY3Rpb24obW9kZWxJRCxjb2xvckNvZGUpe1xyXG4gICAgdGhpcy5jb3JlLnN0eWxlKClcclxuICAgICAgICAuc2VsZWN0b3IoJ25vZGVbbW9kZWxJRCA9IFwiJyttb2RlbElEKydcIl0nKVxyXG4gICAgICAgIC5zdHlsZSh7J2JhY2tncm91bmQtY29sb3InOiBjb2xvckNvZGV9KVxyXG4gICAgICAgIC51cGRhdGUoKSAgIFxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUudXBkYXRlTW9kZWxUd2luU2hhcGU9ZnVuY3Rpb24obW9kZWxJRCxzaGFwZSl7XHJcbiAgICB0aGlzLmNvcmUuc3R5bGUoKVxyXG4gICAgICAgIC5zZWxlY3Rvcignbm9kZVttb2RlbElEID0gXCInK21vZGVsSUQrJ1wiXScpXHJcbiAgICAgICAgLnN0eWxlKHsnc2hhcGUnOiBzaGFwZX0pXHJcbiAgICAgICAgLnVwZGF0ZSgpICAgXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS51cGRhdGVSZWxhdGlvbnNoaXBDb2xvcj1mdW5jdGlvbihzcmNNb2RlbElELHJlbGF0aW9uc2hpcE5hbWUsY29sb3JDb2RlKXtcclxuICAgIHRoaXMuY29yZS5zdHlsZSgpXHJcbiAgICAgICAgLnNlbGVjdG9yKCdlZGdlW3NvdXJjZU1vZGVsID0gXCInK3NyY01vZGVsSUQrJ1wiXVtyZWxhdGlvbnNoaXBOYW1lID0gXCInK3JlbGF0aW9uc2hpcE5hbWUrJ1wiXScpXHJcbiAgICAgICAgLnN0eWxlKHsnbGluZS1jb2xvcic6IGNvbG9yQ29kZX0pXHJcbiAgICAgICAgLnVwZGF0ZSgpICAgXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS51cGRhdGVSZWxhdGlvbnNoaXBTaGFwZT1mdW5jdGlvbihzcmNNb2RlbElELHJlbGF0aW9uc2hpcE5hbWUsc2hhcGUpe1xyXG4gICAgdGhpcy5jb3JlLnN0eWxlKClcclxuICAgICAgICAuc2VsZWN0b3IoJ2VkZ2Vbc291cmNlTW9kZWwgPSBcIicrc3JjTW9kZWxJRCsnXCJdW3JlbGF0aW9uc2hpcE5hbWUgPSBcIicrcmVsYXRpb25zaGlwTmFtZSsnXCJdJylcclxuICAgICAgICAuc3R5bGUoeydsaW5lLXN0eWxlJzogc2hhcGV9KVxyXG4gICAgICAgIC51cGRhdGUoKSAgIFxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuZGVsZXRlUmVsYXRpb25zPWZ1bmN0aW9uKHJlbGF0aW9ucyl7XHJcbiAgICByZWxhdGlvbnMuZm9yRWFjaChvbmVSZWxhdGlvbj0+e1xyXG4gICAgICAgIHZhciBzcmNJRD1vbmVSZWxhdGlvbltcInNyY0lEXCJdXHJcbiAgICAgICAgdmFyIHJlbGF0aW9uSUQ9b25lUmVsYXRpb25bXCJyZWxJRFwiXVxyXG4gICAgICAgIHZhciB0aGVOb2RlPXRoaXMuY29yZS5maWx0ZXIoJ1tpZCA9IFwiJytzcmNJRCsnXCJdJyk7XHJcbiAgICAgICAgdmFyIGVkZ2VzPXRoZU5vZGUuY29ubmVjdGVkRWRnZXMoKS50b0FycmF5KClcclxuICAgICAgICBmb3IodmFyIGk9MDtpPGVkZ2VzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICB2YXIgYW5FZGdlPWVkZ2VzW2ldXHJcbiAgICAgICAgICAgIGlmKGFuRWRnZS5kYXRhKFwib3JpZ2luYWxJbmZvXCIpW1wiJHJlbGF0aW9uc2hpcElkXCJdPT1yZWxhdGlvbklEKXtcclxuICAgICAgICAgICAgICAgIGFuRWRnZS5yZW1vdmUoKVxyXG4gICAgICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pICAgXHJcbn1cclxuXHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuZGVsZXRlVHdpbnM9ZnVuY3Rpb24odHdpbklEQXJyKXtcclxuICAgIHR3aW5JREFyci5mb3JFYWNoKHR3aW5JRD0+e1xyXG4gICAgICAgIHRoaXMuY29yZS4kKCdbaWQgPSBcIicrdHdpbklEKydcIl0nKS5yZW1vdmUoKVxyXG4gICAgfSkgICBcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmFuaW1hdGVBTm9kZT1mdW5jdGlvbih0d2luKXtcclxuICAgIHZhciBjdXJEaW1lbnNpb249IHRoaXMuZ2V0Tm9kZVNpemVJbkN1cnJlbnRab29tKClcclxuICAgIHR3aW4uYW5pbWF0ZSh7XHJcbiAgICAgICAgc3R5bGU6IHsgJ2hlaWdodCc6IGN1ckRpbWVuc2lvbioyLCd3aWR0aCc6IGN1ckRpbWVuc2lvbioyIH0sXHJcbiAgICAgICAgZHVyYXRpb246IDIwMFxyXG4gICAgfSk7XHJcblxyXG4gICAgc2V0VGltZW91dCgoKT0+e1xyXG4gICAgICAgIHR3aW4uYW5pbWF0ZSh7XHJcbiAgICAgICAgICAgIHN0eWxlOiB7ICdoZWlnaHQnOiBjdXJEaW1lbnNpb24sJ3dpZHRoJzogY3VyRGltZW5zaW9uIH0sXHJcbiAgICAgICAgICAgIGR1cmF0aW9uOiAyMDBcclxuICAgICAgICAgICAgLGNvbXBsZXRlOigpPT57XHJcbiAgICAgICAgICAgICAgICB0d2luLnJlbW92ZVN0eWxlKCkgLy9tdXN0IHJlbW92ZSB0aGUgc3R5bGUgYWZ0ZXIgYW5pbWF0aW9uLCBvdGhlcndpc2UgdGhleSB3aWxsIGhhdmUgdGhlaXIgb3duIHN0eWxlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH0sMjAwKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuZHJhd1R3aW5zPWZ1bmN0aW9uKHR3aW5zRGF0YSxhbmltYXRpb24pe1xyXG4gICAgdmFyIGFycj1bXVxyXG4gICAgZm9yKHZhciBpPTA7aTx0d2luc0RhdGEubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIG9yaWdpbmFsSW5mbz10d2luc0RhdGFbaV07XHJcbiAgICAgICAgdmFyIG5ld05vZGU9e2RhdGE6e30sZ3JvdXA6XCJub2Rlc1wifVxyXG4gICAgICAgIG5ld05vZGUuZGF0YVtcIm9yaWdpbmFsSW5mb1wiXT0gb3JpZ2luYWxJbmZvO1xyXG4gICAgICAgIG5ld05vZGUuZGF0YVtcImlkXCJdPW9yaWdpbmFsSW5mb1snZGlzcGxheU5hbWUnXVxyXG4gICAgICAgIHZhciBtb2RlbElEPW9yaWdpbmFsSW5mb1snJG1ldGFkYXRhJ11bJyRtb2RlbCddXHJcbiAgICAgICAgbmV3Tm9kZS5kYXRhW1wibW9kZWxJRFwiXT1tb2RlbElEXHJcbiAgICAgICAgYXJyLnB1c2gobmV3Tm9kZSlcclxuICAgIH1cclxuXHJcbiAgICB2YXIgZWxlcyA9IHRoaXMuY29yZS5hZGQoYXJyKVxyXG4gICAgaWYoZWxlcy5zaXplKCk9PTApIHJldHVybiBlbGVzXHJcbiAgICB0aGlzLm5vUG9zaXRpb25fZ3JpZChlbGVzKVxyXG4gICAgaWYoYW5pbWF0aW9uKXtcclxuICAgICAgICBlbGVzLmZvckVhY2goKGVsZSk9PnsgdGhpcy5hbmltYXRlQU5vZGUoZWxlKSB9KVxyXG4gICAgfVxyXG5cclxuICAgIC8vaWYgdGhlcmUgaXMgY3VycmVudGx5IGEgbGF5b3V0IHRoZXJlLCBhcHBseSBpdFxyXG4gICAgdGhpcy5hcHBseU5ld0xheW91dCgpXHJcblxyXG4gICAgcmV0dXJuIGVsZXNcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmRyYXdSZWxhdGlvbnM9ZnVuY3Rpb24ocmVsYXRpb25zRGF0YSl7XHJcbiAgICB2YXIgcmVsYXRpb25JbmZvQXJyPVtdXHJcbiAgICBmb3IodmFyIGk9MDtpPHJlbGF0aW9uc0RhdGEubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIG9yaWdpbmFsSW5mbz1yZWxhdGlvbnNEYXRhW2ldO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciB0aGVJRD1vcmlnaW5hbEluZm9bJyRyZWxhdGlvbnNoaXBOYW1lJ10rXCJfXCIrb3JpZ2luYWxJbmZvWyckcmVsYXRpb25zaGlwSWQnXVxyXG4gICAgICAgIHZhciBhUmVsYXRpb249e2RhdGE6e30sZ3JvdXA6XCJlZGdlc1wifVxyXG4gICAgICAgIGFSZWxhdGlvbi5kYXRhW1wib3JpZ2luYWxJbmZvXCJdPW9yaWdpbmFsSW5mb1xyXG4gICAgICAgIGFSZWxhdGlvbi5kYXRhW1wiaWRcIl09dGhlSURcclxuICAgICAgICBhUmVsYXRpb24uZGF0YVtcInNvdXJjZVwiXT1nbG9iYWxDYWNoZS50d2luSURNYXBUb0Rpc3BsYXlOYW1lW29yaWdpbmFsSW5mb1snJHNvdXJjZUlkJ11dXHJcbiAgICAgICAgYVJlbGF0aW9uLmRhdGFbXCJ0YXJnZXRcIl09Z2xvYmFsQ2FjaGUudHdpbklETWFwVG9EaXNwbGF5TmFtZVtvcmlnaW5hbEluZm9bJyR0YXJnZXRJZCddXVxyXG5cclxuXHJcbiAgICAgICAgaWYodGhpcy5jb3JlLiQoXCIjXCIrYVJlbGF0aW9uLmRhdGFbXCJzb3VyY2VcIl0pLmxlbmd0aD09MCB8fCB0aGlzLmNvcmUuJChcIiNcIithUmVsYXRpb24uZGF0YVtcInRhcmdldFwiXSkubGVuZ3RoPT0wKSBjb250aW51ZVxyXG4gICAgICAgIHZhciBzb3VyY2VOb2RlPXRoaXMuY29yZS4kKFwiI1wiK2FSZWxhdGlvbi5kYXRhW1wic291cmNlXCJdKVxyXG4gICAgICAgIHZhciBzb3VyY2VNb2RlbD1zb3VyY2VOb2RlWzBdLmRhdGEoXCJvcmlnaW5hbEluZm9cIilbJyRtZXRhZGF0YSddWyckbW9kZWwnXVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vYWRkIGFkZGl0aW9uYWwgc291cmNlIG5vZGUgaW5mb3JtYXRpb24gdG8gdGhlIG9yaWdpbmFsIHJlbGF0aW9uc2hpcCBpbmZvcm1hdGlvblxyXG4gICAgICAgIG9yaWdpbmFsSW5mb1snc291cmNlTW9kZWwnXT1zb3VyY2VNb2RlbFxyXG4gICAgICAgIGFSZWxhdGlvbi5kYXRhW1wic291cmNlTW9kZWxcIl09c291cmNlTW9kZWxcclxuICAgICAgICBhUmVsYXRpb24uZGF0YVtcInJlbGF0aW9uc2hpcE5hbWVcIl09b3JpZ2luYWxJbmZvWyckcmVsYXRpb25zaGlwTmFtZSddXHJcblxyXG4gICAgICAgIHZhciBleGlzdEVkZ2U9dGhpcy5jb3JlLiQoJ2VkZ2VbaWQgPSBcIicrdGhlSUQrJ1wiXScpXHJcbiAgICAgICAgaWYoZXhpc3RFZGdlLnNpemUoKT4wKSB7XHJcbiAgICAgICAgICAgIGV4aXN0RWRnZS5kYXRhKFwib3JpZ2luYWxJbmZvXCIsb3JpZ2luYWxJbmZvKVxyXG4gICAgICAgICAgICBjb250aW51ZTsgIC8vbm8gbmVlZCB0byBkcmF3IGl0XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZWxhdGlvbkluZm9BcnIucHVzaChhUmVsYXRpb24pXHJcbiAgICB9XHJcbiAgICBpZihyZWxhdGlvbkluZm9BcnIubGVuZ3RoPT0wKSByZXR1cm4gbnVsbDtcclxuXHJcbiAgICB2YXIgZWRnZXM9dGhpcy5jb3JlLmFkZChyZWxhdGlvbkluZm9BcnIpXHJcbiAgICByZXR1cm4gZWRnZXNcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnJldmlld1N0b3JlZFJlbGF0aW9uc2hpcHNUb0RyYXc9ZnVuY3Rpb24oKXtcclxuICAgIC8vY2hlY2sgdGhlIHN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwcyBhZ2FpbiBhbmQgbWF5YmUgc29tZSBvZiB0aGVtIGNhbiBiZSBkcmF3biBub3cgc2luY2UgdGFyZ2V0Tm9kZSBpcyBhdmFpbGFibGVcclxuICAgIHZhciBzdG9yZWRSZWxhdGlvbkFycj1bXVxyXG4gICAgZm9yKHZhciB0d2luSUQgaW4gZ2xvYmFsQ2FjaGUuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzKXtcclxuICAgICAgICBzdG9yZWRSZWxhdGlvbkFycj1zdG9yZWRSZWxhdGlvbkFyci5jb25jYXQoZ2xvYmFsQ2FjaGUuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW3R3aW5JRF0pXHJcbiAgICB9XHJcbiAgICB0aGlzLmRyYXdSZWxhdGlvbnMoc3RvcmVkUmVsYXRpb25BcnIpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5kcmF3VHdpbnNBbmRSZWxhdGlvbnM9ZnVuY3Rpb24oZGF0YSl7XHJcbiAgICB2YXIgdHdpbnNBbmRSZWxhdGlvbnM9ZGF0YS5jaGlsZFR3aW5zQW5kUmVsYXRpb25zXHJcblxyXG4gICAgLy9kcmF3IHRob3NlIG5ldyB0d2lucyBmaXJzdFxyXG4gICAgdHdpbnNBbmRSZWxhdGlvbnMuZm9yRWFjaChvbmVTZXQ9PntcclxuICAgICAgICB2YXIgdHdpbkluZm9BcnI9W11cclxuICAgICAgICBmb3IodmFyIGluZCBpbiBvbmVTZXQuY2hpbGRUd2lucykgdHdpbkluZm9BcnIucHVzaChvbmVTZXQuY2hpbGRUd2luc1tpbmRdKVxyXG4gICAgICAgIHZhciBlbGVzPXRoaXMuZHJhd1R3aW5zKHR3aW5JbmZvQXJyLFwiYW5pbWF0aW9uXCIpXHJcbiAgICB9KVxyXG5cclxuICAgIC8vZHJhdyB0aG9zZSBrbm93biB0d2lucyBmcm9tIHRoZSByZWxhdGlvbnNoaXBzXHJcbiAgICB2YXIgdHdpbnNJbmZvPXt9XHJcbiAgICB0d2luc0FuZFJlbGF0aW9ucy5mb3JFYWNoKG9uZVNldD0+e1xyXG4gICAgICAgIHZhciByZWxhdGlvbnNJbmZvPW9uZVNldFtcInJlbGF0aW9uc2hpcHNcIl1cclxuICAgICAgICByZWxhdGlvbnNJbmZvLmZvckVhY2goKG9uZVJlbGF0aW9uKT0+e1xyXG4gICAgICAgICAgICB2YXIgc3JjSUQ9b25lUmVsYXRpb25bJyRzb3VyY2VJZCddXHJcbiAgICAgICAgICAgIHZhciB0YXJnZXRJRD1vbmVSZWxhdGlvblsnJHRhcmdldElkJ11cclxuICAgICAgICAgICAgaWYoZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbc3JjSURdKVxyXG4gICAgICAgICAgICAgICAgdHdpbnNJbmZvW3NyY0lEXSA9IGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3NyY0lEXVxyXG4gICAgICAgICAgICBpZihnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1t0YXJnZXRJRF0pXHJcbiAgICAgICAgICAgICAgICB0d2luc0luZm9bdGFyZ2V0SURdID0gZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbdGFyZ2V0SURdICAgIFxyXG4gICAgICAgIH0pXHJcbiAgICB9KVxyXG4gICAgdmFyIHRtcEFycj1bXVxyXG4gICAgZm9yKHZhciB0d2luSUQgaW4gdHdpbnNJbmZvKSB0bXBBcnIucHVzaCh0d2luc0luZm9bdHdpbklEXSlcclxuICAgIHRoaXMuZHJhd1R3aW5zKHRtcEFycilcclxuXHJcbiAgICAvL3RoZW4gY2hlY2sgYWxsIHN0b3JlZCByZWxhdGlvbnNoaXBzIGFuZCBkcmF3IGlmIGl0IGNhbiBiZSBkcmF3blxyXG4gICAgdGhpcy5yZXZpZXdTdG9yZWRSZWxhdGlvbnNoaXBzVG9EcmF3KClcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmFwcGx5VmlzdWFsRGVmaW5pdGlvbj1mdW5jdGlvbigpe1xyXG4gICAgdmFyIHZpc3VhbEpzb249Z2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltcImRlZmF1bHRcIl1cclxuICAgIGlmKHZpc3VhbEpzb249PW51bGwpIHJldHVybjtcclxuICAgIGZvcih2YXIgbW9kZWxJRCBpbiB2aXN1YWxKc29uKXtcclxuICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdLmNvbG9yKSB0aGlzLnVwZGF0ZU1vZGVsVHdpbkNvbG9yKG1vZGVsSUQsdmlzdWFsSnNvblttb2RlbElEXS5jb2xvcilcclxuICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdLnNoYXBlKSB0aGlzLnVwZGF0ZU1vZGVsVHdpblNoYXBlKG1vZGVsSUQsdmlzdWFsSnNvblttb2RlbElEXS5zaGFwZSlcclxuICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdLmF2YXJ0YSkgdGhpcy51cGRhdGVNb2RlbEF2YXJ0YShtb2RlbElELHZpc3VhbEpzb25bbW9kZWxJRF0uYXZhcnRhKVxyXG4gICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF0ucmVscyl7XHJcbiAgICAgICAgICAgIGZvcih2YXIgcmVsYXRpb25zaGlwTmFtZSBpbiB2aXN1YWxKc29uW21vZGVsSURdLnJlbHMpXHJcbiAgICAgICAgICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGlvbnNoaXBOYW1lXS5jb2xvcil7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVSZWxhdGlvbnNoaXBDb2xvcihtb2RlbElELHJlbGF0aW9uc2hpcE5hbWUsdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpb25zaGlwTmFtZV0uY29sb3IpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGlvbnNoaXBOYW1lXS5zaGFwZSl7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy51cGRhdGVSZWxhdGlvbnNoaXBTaGFwZShtb2RlbElELHJlbGF0aW9uc2hpcE5hbWUsdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpb25zaGlwTmFtZV0uc2hhcGUpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUucnhNZXNzYWdlPWZ1bmN0aW9uKG1zZ1BheWxvYWQpe1xyXG4gICAgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInN0YXJ0U2VsZWN0aW9uX3JlcGxhY2VcIil7XHJcbiAgICAgICAgdGhpcy5jb3JlLm5vZGVzKCkucmVtb3ZlKClcclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJyZXBsYWNlQWxsVHdpbnNcIikge1xyXG4gICAgICAgIHRoaXMuY29yZS5ub2RlcygpLnJlbW92ZSgpXHJcbiAgICAgICAgdmFyIGVsZXM9IHRoaXMuZHJhd1R3aW5zKG1zZ1BheWxvYWQuaW5mbylcclxuICAgICAgICB0aGlzLmNvcmUuY2VudGVyKGVsZXMpXHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwidmlzdWFsRGVmaW5pdGlvblJlZnJlc2hcIikge1xyXG4gICAgICAgIHRoaXMuYXBwbHlWaXN1YWxEZWZpbml0aW9uKClcclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJhcHBlbmRBbGxUd2luc1wiKSB7XHJcbiAgICAgICAgdmFyIGVsZXM9IHRoaXMuZHJhd1R3aW5zKG1zZ1BheWxvYWQuaW5mbyxcImFuaW1hdGVcIilcclxuICAgICAgICB0aGlzLmNvcmUuY2VudGVyKGVsZXMpXHJcbiAgICAgICAgdGhpcy5yZXZpZXdTdG9yZWRSZWxhdGlvbnNoaXBzVG9EcmF3KClcclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJkcmF3QWxsUmVsYXRpb25zXCIpe1xyXG4gICAgICAgIHZhciBlZGdlcz0gdGhpcy5kcmF3UmVsYXRpb25zKG1zZ1BheWxvYWQuaW5mbylcclxuICAgICAgICBpZihlZGdlcyE9bnVsbCkge1xyXG4gICAgICAgICAgICBpZihnbG9iYWxDYWNoZS5jdXJyZW50TGF5b3V0TmFtZT09bnVsbCkgIHRoaXMubm9Qb3NpdGlvbl9jb3NlKClcclxuICAgICAgICB9XHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiYWRkTmV3VHdpblwiKSB7XHJcbiAgICAgICAgdGhpcy5kcmF3VHdpbnMoW21zZ1BheWxvYWQudHdpbkluZm9dLFwiYW5pbWF0aW9uXCIpXHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiYWRkTmV3VHdpbnNcIikge1xyXG4gICAgICAgIHRoaXMuZHJhd1R3aW5zKG1zZ1BheWxvYWQudHdpbnNJbmZvLFwiYW5pbWF0aW9uXCIpXHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiZHJhd1R3aW5zQW5kUmVsYXRpb25zXCIpIHRoaXMuZHJhd1R3aW5zQW5kUmVsYXRpb25zKG1zZ1BheWxvYWQuaW5mbylcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInNlbGVjdE5vZGVzXCIpe1xyXG4gICAgICAgIHRoaXMuY29yZS5ub2RlcygpLnVuc2VsZWN0KClcclxuICAgICAgICB0aGlzLmNvcmUuZWRnZXMoKS51bnNlbGVjdCgpXHJcbiAgICAgICAgdmFyIGFycj1tc2dQYXlsb2FkLmluZm87XHJcbiAgICAgICAgdmFyIG1vdXNlQ2xpY2tEZXRhaWw9bXNnUGF5bG9hZC5tb3VzZUNsaWNrRGV0YWlsO1xyXG4gICAgICAgIGFyci5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgICAgICB2YXIgYVR3aW49IHRoaXMuY29yZS5ub2RlcyhcIiNcIitlbGVtZW50WydkaXNwbGF5TmFtZSddKVxyXG4gICAgICAgICAgICBhVHdpbi5zZWxlY3QoKVxyXG4gICAgICAgICAgICBpZihtb3VzZUNsaWNrRGV0YWlsIT0yKSB0aGlzLmFuaW1hdGVBTm9kZShhVHdpbikgLy9pZ25vcmUgZG91YmxlIGNsaWNrIHNlY29uZCBjbGlja1xyXG4gICAgICAgIH0pO1xyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cIlBhblRvTm9kZVwiKXtcclxuICAgICAgICB2YXIgbm9kZUluZm89IG1zZ1BheWxvYWQuaW5mbztcclxuICAgICAgICB2YXIgdG9wb05vZGU9IHRoaXMuY29yZS5ub2RlcyhcIiNcIitub2RlSW5mb1tcIiRkdElkXCJdKVxyXG4gICAgICAgIGlmKHRvcG9Ob2RlKXtcclxuICAgICAgICAgICAgdGhpcy5jb3JlLmNlbnRlcih0b3BvTm9kZSlcclxuICAgICAgICB9XHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwidmlzdWFsRGVmaW5pdGlvbkNoYW5nZVwiKXtcclxuICAgICAgICBpZihtc2dQYXlsb2FkLnNyY01vZGVsSUQpe1xyXG4gICAgICAgICAgICBpZihtc2dQYXlsb2FkLmNvbG9yKSB0aGlzLnVwZGF0ZVJlbGF0aW9uc2hpcENvbG9yKG1zZ1BheWxvYWQuc3JjTW9kZWxJRCxtc2dQYXlsb2FkLnJlbGF0aW9uc2hpcE5hbWUsbXNnUGF5bG9hZC5jb2xvcilcclxuICAgICAgICAgICAgZWxzZSBpZihtc2dQYXlsb2FkLnNoYXBlKSB0aGlzLnVwZGF0ZVJlbGF0aW9uc2hpcFNoYXBlKG1zZ1BheWxvYWQuc3JjTW9kZWxJRCxtc2dQYXlsb2FkLnJlbGF0aW9uc2hpcE5hbWUsbXNnUGF5bG9hZC5zaGFwZSlcclxuICAgICAgICB9IFxyXG4gICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgIGlmKG1zZ1BheWxvYWQuY29sb3IpIHRoaXMudXBkYXRlTW9kZWxUd2luQ29sb3IobXNnUGF5bG9hZC5tb2RlbElELG1zZ1BheWxvYWQuY29sb3IpXHJcbiAgICAgICAgICAgIGVsc2UgaWYobXNnUGF5bG9hZC5zaGFwZSkgdGhpcy51cGRhdGVNb2RlbFR3aW5TaGFwZShtc2dQYXlsb2FkLm1vZGVsSUQsbXNnUGF5bG9hZC5zaGFwZSlcclxuICAgICAgICAgICAgZWxzZSBpZihtc2dQYXlsb2FkLmF2YXJ0YSkgdGhpcy51cGRhdGVNb2RlbEF2YXJ0YShtc2dQYXlsb2FkLm1vZGVsSUQsbXNnUGF5bG9hZC5hdmFydGEpXHJcbiAgICAgICAgICAgIGVsc2UgaWYobXNnUGF5bG9hZC5ub0F2YXJ0YSkgIHRoaXMudXBkYXRlTW9kZWxBdmFydGEobXNnUGF5bG9hZC5tb2RlbElELG51bGwpXHJcbiAgICAgICAgfSBcclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJ0d2luc0RlbGV0ZWRcIikgdGhpcy5kZWxldGVUd2lucyhtc2dQYXlsb2FkLnR3aW5JREFycilcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInJlbGF0aW9uc0RlbGV0ZWRcIikgdGhpcy5kZWxldGVSZWxhdGlvbnMobXNnUGF5bG9hZC5yZWxhdGlvbnMpXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJjb25uZWN0VG9cIil7IHRoaXMuc3RhcnRUYXJnZXROb2RlTW9kZShcImNvbm5lY3RUb1wiKSAgIH1cclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImNvbm5lY3RGcm9tXCIpeyB0aGlzLnN0YXJ0VGFyZ2V0Tm9kZU1vZGUoXCJjb25uZWN0RnJvbVwiKSAgIH1cclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImFkZFNlbGVjdE91dGJvdW5kXCIpeyB0aGlzLnNlbGVjdE91dGJvdW5kTm9kZXMoKSAgIH1cclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImFkZFNlbGVjdEluYm91bmRcIil7IHRoaXMuc2VsZWN0SW5ib3VuZE5vZGVzKCkgICB9XHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJoaWRlU2VsZWN0ZWROb2Rlc1wiKXsgdGhpcy5oaWRlU2VsZWN0ZWROb2RlcygpICAgfVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiQ09TRVNlbGVjdGVkTm9kZXNcIil7IHRoaXMuQ09TRVNlbGVjdGVkTm9kZXMoKSAgIH1cclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInNhdmVMYXlvdXRcIil7IHRoaXMuc2F2ZUxheW91dChtc2dQYXlsb2FkLmxheW91dE5hbWUsbXNnUGF5bG9hZC5hZHROYW1lKSAgIH1cclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImxheW91dENoYW5nZVwiKXsgdGhpcy5hcHBseU5ld0xheW91dCgpICAgfVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuYXBwbHlOZXdMYXlvdXQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgbGF5b3V0TmFtZT1nbG9iYWxDYWNoZS5jdXJyZW50TGF5b3V0TmFtZVxyXG4gICAgXHJcbiAgICB2YXIgbGF5b3V0RGV0YWlsPSBnbG9iYWxDYWNoZS5sYXlvdXRKU09OW2xheW91dE5hbWVdXHJcbiAgICBcclxuICAgIC8vcmVtb3ZlIGFsbCBiZW5kaW5nIGVkZ2UgXHJcbiAgICB0aGlzLmNvcmUuZWRnZXMoKS5mb3JFYWNoKG9uZUVkZ2U9PntcclxuICAgICAgICBvbmVFZGdlLnJlbW92ZUNsYXNzKCdlZGdlYmVuZGVkaXRpbmctaGFzYmVuZHBvaW50cycpXHJcbiAgICAgICAgb25lRWRnZS5yZW1vdmVDbGFzcygnZWRnZWNvbnRyb2xlZGl0aW5nLWhhc2NvbnRyb2xwb2ludHMnKVxyXG4gICAgfSlcclxuICAgIFxyXG4gICAgaWYobGF5b3V0RGV0YWlsPT1udWxsKSByZXR1cm47XHJcbiAgICBcclxuICAgIHZhciBzdG9yZWRQb3NpdGlvbnM9e31cclxuICAgIGZvcih2YXIgaW5kIGluIGxheW91dERldGFpbCl7XHJcbiAgICAgICAgc3RvcmVkUG9zaXRpb25zW2luZF09e1xyXG4gICAgICAgICAgICB4OmxheW91dERldGFpbFtpbmRdWzBdXHJcbiAgICAgICAgICAgICx5OmxheW91dERldGFpbFtpbmRdWzFdXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdmFyIG5ld0xheW91dD10aGlzLmNvcmUubGF5b3V0KHtcclxuICAgICAgICBuYW1lOiAncHJlc2V0JyxcclxuICAgICAgICBwb3NpdGlvbnM6c3RvcmVkUG9zaXRpb25zLFxyXG4gICAgICAgIGZpdDpmYWxzZSxcclxuICAgICAgICBhbmltYXRlOiB0cnVlLFxyXG4gICAgICAgIGFuaW1hdGlvbkR1cmF0aW9uOiAzMDAsXHJcbiAgICB9KVxyXG4gICAgbmV3TGF5b3V0LnJ1bigpXHJcblxyXG4gICAgLy9yZXN0b3JlIGVkZ2VzIGJlbmRpbmcgb3IgY29udHJvbCBwb2ludHNcclxuICAgIHZhciBlZGdlUG9pbnRzRGljdD1sYXlvdXREZXRhaWxbXCJlZGdlc1wiXVxyXG4gICAgaWYoZWRnZVBvaW50c0RpY3Q9PW51bGwpcmV0dXJuO1xyXG4gICAgZm9yKHZhciBzcmNJRCBpbiBlZGdlUG9pbnRzRGljdCl7XHJcbiAgICAgICAgZm9yKHZhciByZWxhdGlvbnNoaXBJRCBpbiBlZGdlUG9pbnRzRGljdFtzcmNJRF0pe1xyXG4gICAgICAgICAgICB2YXIgb2JqPWVkZ2VQb2ludHNEaWN0W3NyY0lEXVtyZWxhdGlvbnNoaXBJRF1cclxuICAgICAgICAgICAgdGhpcy5hcHBseUVkZ2VCZW5kY29udHJvbFBvaW50cyhzcmNJRCxyZWxhdGlvbnNoaXBJRCxvYmpbXCJjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHNcIl1cclxuICAgICAgICAgICAgLG9ialtcImN5ZWRnZWJlbmRlZGl0aW5nRGlzdGFuY2VzXCJdLG9ialtcImN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0c1wiXSxvYmpbXCJjeWVkZ2Vjb250cm9sZWRpdGluZ0Rpc3RhbmNlc1wiXSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5hcHBseUVkZ2VCZW5kY29udHJvbFBvaW50cyA9IGZ1bmN0aW9uIChzcmNJRCxyZWxhdGlvbnNoaXBJRFxyXG4gICAgLGN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0cyxjeWVkZ2ViZW5kZWRpdGluZ0Rpc3RhbmNlcyxjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHMsY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXMpIHtcclxuICAgICAgICB2YXIgdGhlTm9kZT10aGlzLmNvcmUuZmlsdGVyKCdbaWQgPSBcIicrc3JjSUQrJ1wiXScpO1xyXG4gICAgICAgIHZhciBlZGdlcz10aGVOb2RlLmNvbm5lY3RlZEVkZ2VzKCkudG9BcnJheSgpXHJcbiAgICAgICAgZm9yKHZhciBpPTA7aTxlZGdlcy5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgdmFyIGFuRWRnZT1lZGdlc1tpXVxyXG4gICAgICAgICAgICBpZihhbkVkZ2UuZGF0YShcIm9yaWdpbmFsSW5mb1wiKVtcIiRyZWxhdGlvbnNoaXBJZFwiXT09cmVsYXRpb25zaGlwSUQpe1xyXG4gICAgICAgICAgICAgICAgaWYoY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzKXtcclxuICAgICAgICAgICAgICAgICAgICBhbkVkZ2UuZGF0YShcImN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0c1wiLGN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0cylcclxuICAgICAgICAgICAgICAgICAgICBhbkVkZ2UuZGF0YShcImN5ZWRnZWJlbmRlZGl0aW5nRGlzdGFuY2VzXCIsY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXMpXHJcbiAgICAgICAgICAgICAgICAgICAgYW5FZGdlLmFkZENsYXNzKCdlZGdlYmVuZGVkaXRpbmctaGFzYmVuZHBvaW50cycpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYoY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzKXtcclxuICAgICAgICAgICAgICAgICAgICBhbkVkZ2UuZGF0YShcImN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0c1wiLGN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cylcclxuICAgICAgICAgICAgICAgICAgICBhbkVkZ2UuZGF0YShcImN5ZWRnZWNvbnRyb2xlZGl0aW5nRGlzdGFuY2VzXCIsY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXMpXHJcbiAgICAgICAgICAgICAgICAgICAgYW5FZGdlLmFkZENsYXNzKCdlZGdlY29udHJvbGVkaXRpbmctaGFzY29udHJvbHBvaW50cycpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBicmVha1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG59XHJcblxyXG5cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5zYXZlTGF5b3V0ID0gZnVuY3Rpb24gKGxheW91dE5hbWUsYWR0TmFtZSkge1xyXG4gICAgdmFyIGxheW91dERpY3Q9Z2xvYmFsQ2FjaGUubGF5b3V0SlNPTltsYXlvdXROYW1lXVxyXG4gICAgaWYoIWxheW91dERpY3Qpe1xyXG4gICAgICAgIGxheW91dERpY3Q9Z2xvYmFsQ2FjaGUubGF5b3V0SlNPTltsYXlvdXROYW1lXT17fVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBpZih0aGlzLmNvcmUubm9kZXMoKS5zaXplKCk9PTApIHJldHVybjtcclxuXHJcbiAgICAvL3N0b3JlIG5vZGVzIHBvc2l0aW9uXHJcbiAgICB0aGlzLmNvcmUubm9kZXMoKS5mb3JFYWNoKG9uZU5vZGU9PntcclxuICAgICAgICB2YXIgcG9zaXRpb249b25lTm9kZS5wb3NpdGlvbigpXHJcbiAgICAgICAgbGF5b3V0RGljdFtvbmVOb2RlLmlkKCldPVt0aGlzLm51bWJlclByZWNpc2lvbihwb3NpdGlvblsneCddKSx0aGlzLm51bWJlclByZWNpc2lvbihwb3NpdGlvblsneSddKV1cclxuICAgIH0pXHJcblxyXG4gICAgLy9zdG9yZSBhbnkgZWRnZSBiZW5kaW5nIHBvaW50cyBvciBjb250cm9saW5nIHBvaW50c1xyXG5cclxuICAgIGlmKGxheW91dERpY3QuZWRnZXM9PW51bGwpIGxheW91dERpY3QuZWRnZXM9e31cclxuICAgIHZhciBlZGdlRWRpdEluc3RhbmNlPSB0aGlzLmNvcmUuZWRnZUVkaXRpbmcoJ2dldCcpO1xyXG4gICAgdGhpcy5jb3JlLmVkZ2VzKCkuZm9yRWFjaChvbmVFZGdlPT57XHJcbiAgICAgICAgdmFyIHNyY0lEPW9uZUVkZ2UuZGF0YShcIm9yaWdpbmFsSW5mb1wiKVtcIiRzb3VyY2VJZFwiXVxyXG4gICAgICAgIHZhciByZWxhdGlvbnNoaXBJRD1vbmVFZGdlLmRhdGEoXCJvcmlnaW5hbEluZm9cIilbXCIkcmVsYXRpb25zaGlwSWRcIl1cclxuICAgICAgICB2YXIgY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzPW9uZUVkZ2UuZGF0YSgnY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzJylcclxuICAgICAgICB2YXIgY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXM9b25lRWRnZS5kYXRhKCdjeWVkZ2ViZW5kZWRpdGluZ0Rpc3RhbmNlcycpXHJcbiAgICAgICAgdmFyIGN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cz1vbmVFZGdlLmRhdGEoJ2N5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cycpXHJcbiAgICAgICAgdmFyIGN5ZWRnZWNvbnRyb2xlZGl0aW5nRGlzdGFuY2VzPW9uZUVkZ2UuZGF0YSgnY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXMnKVxyXG4gICAgICAgIGlmKCFjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHMgJiYgIWN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cykgcmV0dXJuO1xyXG5cclxuICAgICAgICBpZihsYXlvdXREaWN0LmVkZ2VzW3NyY0lEXT09bnVsbClsYXlvdXREaWN0LmVkZ2VzW3NyY0lEXT17fVxyXG4gICAgICAgIGxheW91dERpY3QuZWRnZXNbc3JjSURdW3JlbGF0aW9uc2hpcElEXT17fVxyXG4gICAgICAgIGlmKGN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0cyAmJiBjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHMubGVuZ3RoPjApIHtcclxuICAgICAgICAgICAgbGF5b3V0RGljdC5lZGdlc1tzcmNJRF1bcmVsYXRpb25zaGlwSURdW1wiY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzXCJdPXRoaXMubnVtYmVyUHJlY2lzaW9uKGN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0cylcclxuICAgICAgICAgICAgbGF5b3V0RGljdC5lZGdlc1tzcmNJRF1bcmVsYXRpb25zaGlwSURdW1wiY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXNcIl09dGhpcy5udW1iZXJQcmVjaXNpb24oY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXMpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKGN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cyAmJiBjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHMubGVuZ3RoPjApIHtcclxuICAgICAgICAgICAgbGF5b3V0RGljdC5lZGdlc1tzcmNJRF1bcmVsYXRpb25zaGlwSURdW1wiY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzXCJdPXRoaXMubnVtYmVyUHJlY2lzaW9uKGN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cylcclxuICAgICAgICAgICAgbGF5b3V0RGljdC5lZGdlc1tzcmNJRF1bcmVsYXRpb25zaGlwSURdW1wiY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXNcIl09dGhpcy5udW1iZXJQcmVjaXNpb24oY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXMpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuXHJcbiAgICAkLnBvc3QoXCJsYXlvdXQvc2F2ZUxheW91dHNcIix7XCJhZHROYW1lXCI6YWR0TmFtZSxcImxheW91dHNcIjpKU09OLnN0cmluZ2lmeShnbG9iYWxDYWNoZS5sYXlvdXRKU09OKX0pXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJsYXlvdXRzVXBkYXRlZFwifSlcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLm51bWJlclByZWNpc2lvbiA9IGZ1bmN0aW9uIChudW1iZXIpIHtcclxuICAgIGlmKEFycmF5LmlzQXJyYXkobnVtYmVyKSl7XHJcbiAgICAgICAgZm9yKHZhciBpPTA7aTxudW1iZXIubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgIG51bWJlcltpXSA9IHRoaXMubnVtYmVyUHJlY2lzaW9uKG51bWJlcltpXSlcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bWJlclxyXG4gICAgfWVsc2VcclxuICAgIHJldHVybiBwYXJzZUZsb2F0KGZvcm1hdHRlci5mb3JtYXQobnVtYmVyKSlcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLkNPU0VTZWxlY3RlZE5vZGVzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHNlbGVjdGVkPXRoaXMuY29yZS4kKCc6c2VsZWN0ZWQnKVxyXG4gICAgdGhpcy5ub1Bvc2l0aW9uX2Nvc2Uoc2VsZWN0ZWQpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5oaWRlU2VsZWN0ZWROb2RlcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBzZWxlY3RlZE5vZGVzPXRoaXMuY29yZS5ub2RlcygnOnNlbGVjdGVkJylcclxuICAgIHNlbGVjdGVkTm9kZXMucmVtb3ZlKClcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnNlbGVjdEluYm91bmROb2RlcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBzZWxlY3RlZE5vZGVzPXRoaXMuY29yZS5ub2RlcygnOnNlbGVjdGVkJylcclxuICAgIHZhciBlbGVzPXRoaXMuY29yZS5ub2RlcygpLmVkZ2VzVG8oc2VsZWN0ZWROb2Rlcykuc291cmNlcygpXHJcbiAgICBlbGVzLmZvckVhY2goKGVsZSk9PnsgdGhpcy5hbmltYXRlQU5vZGUoZWxlKSB9KVxyXG4gICAgZWxlcy5zZWxlY3QoKVxyXG4gICAgdGhpcy5zZWxlY3RGdW5jdGlvbigpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5zZWxlY3RPdXRib3VuZE5vZGVzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHNlbGVjdGVkTm9kZXM9dGhpcy5jb3JlLm5vZGVzKCc6c2VsZWN0ZWQnKVxyXG4gICAgdmFyIGVsZXM9c2VsZWN0ZWROb2Rlcy5lZGdlc1RvKHRoaXMuY29yZS5ub2RlcygpKS50YXJnZXRzKClcclxuICAgIGVsZXMuZm9yRWFjaCgoZWxlKT0+eyB0aGlzLmFuaW1hdGVBTm9kZShlbGUpIH0pXHJcbiAgICBlbGVzLnNlbGVjdCgpXHJcbiAgICB0aGlzLnNlbGVjdEZ1bmN0aW9uKClcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmFkZENvbm5lY3Rpb25zID0gZnVuY3Rpb24gKHRhcmdldE5vZGUpIHtcclxuICAgIHZhciB0aGVDb25uZWN0TW9kZT10aGlzLnRhcmdldE5vZGVNb2RlXHJcbiAgICB2YXIgc3JjTm9kZUFycj10aGlzLmNvcmUubm9kZXMoXCI6c2VsZWN0ZWRcIilcclxuXHJcbiAgICB2YXIgcHJlcGFyYXRpb25JbmZvPVtdXHJcblxyXG4gICAgc3JjTm9kZUFyci5mb3JFYWNoKHRoZU5vZGU9PntcclxuICAgICAgICB2YXIgY29ubmVjdGlvblR5cGVzXHJcbiAgICAgICAgaWYodGhlQ29ubmVjdE1vZGU9PVwiY29ubmVjdFRvXCIpIHtcclxuICAgICAgICAgICAgY29ubmVjdGlvblR5cGVzPXRoaXMuY2hlY2tBdmFpbGFibGVDb25uZWN0aW9uVHlwZSh0aGVOb2RlLmRhdGEoXCJtb2RlbElEXCIpLHRhcmdldE5vZGUuZGF0YShcIm1vZGVsSURcIikpXHJcbiAgICAgICAgICAgIHByZXBhcmF0aW9uSW5mby5wdXNoKHtmcm9tOnRoZU5vZGUsdG86dGFyZ2V0Tm9kZSxjb25uZWN0OmNvbm5lY3Rpb25UeXBlc30pXHJcbiAgICAgICAgfWVsc2UgaWYodGhlQ29ubmVjdE1vZGU9PVwiY29ubmVjdEZyb21cIikge1xyXG4gICAgICAgICAgICBjb25uZWN0aW9uVHlwZXM9dGhpcy5jaGVja0F2YWlsYWJsZUNvbm5lY3Rpb25UeXBlKHRhcmdldE5vZGUuZGF0YShcIm1vZGVsSURcIiksdGhlTm9kZS5kYXRhKFwibW9kZWxJRFwiKSlcclxuICAgICAgICAgICAgcHJlcGFyYXRpb25JbmZvLnB1c2goe3RvOnRoZU5vZGUsZnJvbTp0YXJnZXROb2RlLGNvbm5lY3Q6Y29ubmVjdGlvblR5cGVzfSlcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG4gICAgLy9UT0RPOiBjaGVjayBpZiBpdCBpcyBuZWVkZWQgdG8gcG9wdXAgZGlhbG9nLCBpZiBhbGwgY29ubmVjdGlvbiBpcyBkb2FibGUgYW5kIG9ubHkgb25lIHR5cGUgdG8gdXNlLCBubyBuZWVkIHRvIHNob3cgZGlhbG9nXHJcbiAgICB0aGlzLnNob3dDb25uZWN0aW9uRGlhbG9nKHByZXBhcmF0aW9uSW5mbylcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnNob3dDb25uZWN0aW9uRGlhbG9nID0gZnVuY3Rpb24gKHByZXBhcmF0aW9uSW5mbykge1xyXG4gICAgdmFyIGNvbmZpcm1EaWFsb2dEaXYgPSBuZXcgc2ltcGxlQ29uZmlybURpYWxvZygpXHJcbiAgICB2YXIgcmVzdWx0QWN0aW9ucz1bXVxyXG4gICAgY29uZmlybURpYWxvZ0Rpdi5zaG93KFxyXG4gICAgICAgIHsgd2lkdGg6IFwiNDUwcHhcIiB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGl0bGU6IFwiQWRkIGNvbm5lY3Rpb25zXCJcclxuICAgICAgICAgICAgLCBjb250ZW50OiBcIlwiXHJcbiAgICAgICAgICAgICwgYnV0dG9uczogW1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtcmVkIHczLWhvdmVyLXBpbmtcIiwgdGV4dDogXCJDb25maXJtXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNyZWF0ZUNvbm5lY3Rpb25zKHJlc3VsdEFjdGlvbnMpXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xvckNsYXNzOiBcInczLWdyYXlcIiwgdGV4dDogXCJDYW5jZWxcIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKClcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9XHJcbiAgICApXHJcbiAgICBjb25maXJtRGlhbG9nRGl2LmRpYWxvZ0Rpdi5lbXB0eSgpXHJcbiAgICBwcmVwYXJhdGlvbkluZm8uZm9yRWFjaCgob25lUm93LGluZGV4KT0+e1xyXG4gICAgICAgIHZhciBmcm9tTm9kZT1vbmVSb3cuZnJvbVxyXG4gICAgICAgIHZhciB0b05vZGU9b25lUm93LnRvXHJcbiAgICAgICAgdmFyIGNvbm5lY3Rpb25UeXBlcz1vbmVSb3cuY29ubmVjdFxyXG4gICAgICAgIHZhciBsYWJlbD0kKCc8bGFiZWwgc3R5bGU9XCJkaXNwbGF5OmJsb2NrO21hcmdpbi1ib3R0b206MnB4XCI+PC9sYWJlbD4nKVxyXG4gICAgICAgIGlmKGNvbm5lY3Rpb25UeXBlcy5sZW5ndGg9PTApe1xyXG4gICAgICAgICAgICBsYWJlbC5jc3MoXCJjb2xvclwiLFwicmVkXCIpXHJcbiAgICAgICAgICAgIGxhYmVsLmh0bWwoXCJObyB1c2FibGUgY29ubmVjdGlvbiB0eXBlIGZyb20gPGI+XCIrZnJvbU5vZGUuaWQoKStcIjwvYj4gdG8gPGI+XCIrdG9Ob2RlLmlkKCkrXCI8L2I+XCIpXHJcbiAgICAgICAgfWVsc2UgaWYoY29ubmVjdGlvblR5cGVzLmxlbmd0aD4xKXsgXHJcbiAgICAgICAgICAgIGxhYmVsLmh0bWwoXCJGcm9tIDxiPlwiK2Zyb21Ob2RlLmlkKCkrXCI8L2I+IHRvIDxiPlwiK3RvTm9kZS5pZCgpK1wiPC9iPlwiKSBcclxuICAgICAgICAgICAgdmFyIHN3aXRjaFR5cGVTZWxlY3Rvcj1uZXcgc2ltcGxlU2VsZWN0TWVudShcIiBcIilcclxuICAgICAgICAgICAgbGFiZWwucHJlcGVuZChzd2l0Y2hUeXBlU2VsZWN0b3IuRE9NKVxyXG4gICAgICAgICAgICBjb25uZWN0aW9uVHlwZXMuZm9yRWFjaChvbmVUeXBlPT57XHJcbiAgICAgICAgICAgICAgICBzd2l0Y2hUeXBlU2VsZWN0b3IuYWRkT3B0aW9uKG9uZVR5cGUpXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIHJlc3VsdEFjdGlvbnMucHVzaCh7ZnJvbTpmcm9tTm9kZS5kYXRhKCkub3JpZ2luYWxJbmZvW1wiJGR0SWRcIl0gLHRvOnRvTm9kZS5kYXRhKCkub3JpZ2luYWxJbmZvW1wiJGR0SWRcIl0sY29ubmVjdDpjb25uZWN0aW9uVHlwZXNbMF19KVxyXG4gICAgICAgICAgICBzd2l0Y2hUeXBlU2VsZWN0b3IuY2FsbEJhY2tfY2xpY2tPcHRpb249KG9wdGlvblRleHQsb3B0aW9uVmFsdWUpPT57XHJcbiAgICAgICAgICAgICAgICByZXN1bHRBY3Rpb25zW2luZGV4XVsyXT1vcHRpb25UZXh0XHJcbiAgICAgICAgICAgICAgICBzd2l0Y2hUeXBlU2VsZWN0b3IuY2hhbmdlTmFtZShvcHRpb25UZXh0KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHN3aXRjaFR5cGVTZWxlY3Rvci50cmlnZ2VyT3B0aW9uSW5kZXgoMClcclxuICAgICAgICB9ZWxzZSBpZihjb25uZWN0aW9uVHlwZXMubGVuZ3RoPT0xKXtcclxuICAgICAgICAgICAgcmVzdWx0QWN0aW9ucy5wdXNoKHtmcm9tOmZyb21Ob2RlLmRhdGEoKS5vcmlnaW5hbEluZm9bXCIkZHRJZFwiXSAsdG86dG9Ob2RlLmRhdGEoKS5vcmlnaW5hbEluZm9bXCIkZHRJZFwiXSxjb25uZWN0OmNvbm5lY3Rpb25UeXBlc1swXX0pXHJcbiAgICAgICAgICAgIGxhYmVsLmNzcyhcImNvbG9yXCIsXCJncmVlblwiKVxyXG4gICAgICAgICAgICBsYWJlbC5odG1sKFwiQWRkIDxiPlwiK2Nvbm5lY3Rpb25UeXBlc1swXStcIjwvYj4gY29ubmVjdGlvbiBmcm9tIDxiPlwiK2Zyb21Ob2RlLmlkKCkrXCI8L2I+IHRvIDxiPlwiK3RvTm9kZS5pZCgpK1wiPC9iPlwiKSBcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5kaWFsb2dEaXYuYXBwZW5kKGxhYmVsKVxyXG4gICAgfSlcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmNyZWF0ZUNvbm5lY3Rpb25zID0gYXN5bmMgZnVuY3Rpb24gKHJlc3VsdEFjdGlvbnMpIHtcclxuICAgIC8vIGZvciBlYWNoIHJlc3VsdEFjdGlvbnMsIGNhbGN1bGF0ZSB0aGUgYXBwZW5kaXggaW5kZXgsIHRvIGF2b2lkIHNhbWUgSUQgaXMgdXNlZCBmb3IgZXhpc3RlZCBjb25uZWN0aW9uc1xyXG4gICAgZnVuY3Rpb24gdXVpZHY0KCkge1xyXG4gICAgICAgIHJldHVybiAneHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIGZ1bmN0aW9uIChjKSB7XHJcbiAgICAgICAgICAgIHZhciByID0gTWF0aC5yYW5kb20oKSAqIDE2IHwgMCwgdiA9IGMgPT0gJ3gnID8gciA6IChyICYgMHgzIHwgMHg4KTtcclxuICAgICAgICAgICAgcmV0dXJuIHYudG9TdHJpbmcoMTYpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBmaW5hbEFjdGlvbnM9W11cclxuICAgIHJlc3VsdEFjdGlvbnMuZm9yRWFjaChvbmVBY3Rpb249PntcclxuICAgICAgICB2YXIgb25lRmluYWxBY3Rpb249e31cclxuICAgICAgICBvbmVGaW5hbEFjdGlvbltcIiRzcmNJZFwiXT1vbmVBY3Rpb25bXCJmcm9tXCJdXHJcbiAgICAgICAgb25lRmluYWxBY3Rpb25bXCIkcmVsYXRpb25zaGlwSWRcIl09dXVpZHY0KCk7XHJcbiAgICAgICAgb25lRmluYWxBY3Rpb25bXCJvYmpcIl09e1xyXG4gICAgICAgICAgICBcIiR0YXJnZXRJZFwiOiBvbmVBY3Rpb25bXCJ0b1wiXSxcclxuICAgICAgICAgICAgXCIkcmVsYXRpb25zaGlwTmFtZVwiOiBvbmVBY3Rpb25bXCJjb25uZWN0XCJdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZpbmFsQWN0aW9ucy5wdXNoKG9uZUZpbmFsQWN0aW9uKVxyXG4gICAgfSlcclxuICAgIHRyeXtcclxuICAgICAgICB2YXIgZGF0YSA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2NyZWF0ZVJlbGF0aW9uc1wiLCBcIlBPU1RcIiwgIHthY3Rpb25zOkpTT04uc3RyaW5naWZ5KGZpbmFsQWN0aW9ucyl9KVxyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgfVxyXG4gICAgZ2xvYmFsQ2FjaGUuc3RvcmVUd2luUmVsYXRpb25zaGlwc19hcHBlbmQoZGF0YSlcclxuICAgIHRoaXMuZHJhd1JlbGF0aW9ucyhkYXRhKVxyXG59XHJcblxyXG5cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5jaGVja0F2YWlsYWJsZUNvbm5lY3Rpb25UeXBlID0gZnVuY3Rpb24gKGZyb21Ob2RlTW9kZWwsdG9Ob2RlTW9kZWwpIHtcclxuICAgIHZhciByZT1bXVxyXG4gICAgdmFyIHZhbGlkUmVsYXRpb25zaGlwcz1tb2RlbEFuYWx5emVyLkRURExNb2RlbHNbZnJvbU5vZGVNb2RlbF0udmFsaWRSZWxhdGlvbnNoaXBzXHJcbiAgICB2YXIgdG9Ob2RlQmFzZUNsYXNzZXM9bW9kZWxBbmFseXplci5EVERMTW9kZWxzW3RvTm9kZU1vZGVsXS5hbGxCYXNlQ2xhc3Nlc1xyXG4gICAgaWYodmFsaWRSZWxhdGlvbnNoaXBzKXtcclxuICAgICAgICBmb3IodmFyIHJlbGF0aW9uTmFtZSBpbiB2YWxpZFJlbGF0aW9uc2hpcHMpe1xyXG4gICAgICAgICAgICB2YXIgdGhlUmVsYXRpb25UeXBlPXZhbGlkUmVsYXRpb25zaGlwc1tyZWxhdGlvbk5hbWVdXHJcbiAgICAgICAgICAgIGlmKHRoZVJlbGF0aW9uVHlwZS50YXJnZXQ9PW51bGxcclxuICAgICAgICAgICAgICAgICB8fCB0aGVSZWxhdGlvblR5cGUudGFyZ2V0PT10b05vZGVNb2RlbFxyXG4gICAgICAgICAgICAgICAgIHx8dG9Ob2RlQmFzZUNsYXNzZXNbdGhlUmVsYXRpb25UeXBlLnRhcmdldF0hPW51bGwpIHJlLnB1c2gocmVsYXRpb25OYW1lKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiByZVxyXG59XHJcblxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnN0YXJ0VGFyZ2V0Tm9kZU1vZGUgPSBmdW5jdGlvbiAobW9kZSkge1xyXG4gICAgdGhpcy5jb3JlLmF1dG91bnNlbGVjdGlmeSggdHJ1ZSApO1xyXG4gICAgdGhpcy5jb3JlLmNvbnRhaW5lcigpLnN0eWxlLmN1cnNvciA9ICdjcm9zc2hhaXInO1xyXG4gICAgdGhpcy50YXJnZXROb2RlTW9kZT1tb2RlO1xyXG4gICAgJChkb2N1bWVudCkua2V5ZG93bigoZXZlbnQpID0+IHtcclxuICAgICAgICBpZiAoZXZlbnQua2V5Q29kZSA9PSAyNykgdGhpcy5jYW5jZWxUYXJnZXROb2RlTW9kZSgpXHJcbiAgICB9KTtcclxuXHJcbiAgICB0aGlzLmNvcmUubm9kZXMoKS5vbignY2xpY2snLCAoZSk9PntcclxuICAgICAgICB2YXIgY2xpY2tlZE5vZGUgPSBlLnRhcmdldDtcclxuICAgICAgICB0aGlzLmFkZENvbm5lY3Rpb25zKGNsaWNrZWROb2RlKVxyXG4gICAgICAgIC8vZGVsYXkgYSBzaG9ydCB3aGlsZSBzbyBub2RlIHNlbGVjdGlvbiB3aWxsIG5vdCBiZSBjaGFuZ2VkIHRvIHRoZSBjbGlja2VkIHRhcmdldCBub2RlXHJcbiAgICAgICAgc2V0VGltZW91dCgoKT0+e3RoaXMuY2FuY2VsVGFyZ2V0Tm9kZU1vZGUoKX0sNTApXHJcblxyXG4gICAgfSk7XHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5jYW5jZWxUYXJnZXROb2RlTW9kZT1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy50YXJnZXROb2RlTW9kZT1udWxsO1xyXG4gICAgdGhpcy5jb3JlLmNvbnRhaW5lcigpLnN0eWxlLmN1cnNvciA9ICdkZWZhdWx0JztcclxuICAgICQoZG9jdW1lbnQpLm9mZigna2V5ZG93bicpO1xyXG4gICAgdGhpcy5jb3JlLm5vZGVzKCkub2ZmKFwiY2xpY2tcIilcclxuICAgIHRoaXMuY29yZS5hdXRvdW5zZWxlY3RpZnkoIGZhbHNlICk7XHJcbn1cclxuXHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUubm9Qb3NpdGlvbl9ncmlkPWZ1bmN0aW9uKGVsZXMpe1xyXG4gICAgdmFyIG5ld0xheW91dCA9IGVsZXMubGF5b3V0KHtcclxuICAgICAgICBuYW1lOiAnZ3JpZCcsXHJcbiAgICAgICAgYW5pbWF0ZTogZmFsc2UsXHJcbiAgICAgICAgZml0OmZhbHNlXHJcbiAgICB9KSBcclxuICAgIG5ld0xheW91dC5ydW4oKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUubm9Qb3NpdGlvbl9jb3NlPWZ1bmN0aW9uKGVsZXMpe1xyXG4gICAgaWYoZWxlcz09bnVsbCkgZWxlcz10aGlzLmNvcmUuZWxlbWVudHMoKVxyXG5cclxuICAgIHZhciBuZXdMYXlvdXQgPWVsZXMubGF5b3V0KHtcclxuICAgICAgICBuYW1lOiAnY29zZScsXHJcbiAgICAgICAgYW5pbWF0ZTogdHJ1ZSxcclxuICAgICAgICBncmF2aXR5OjEsXHJcbiAgICAgICAgYW5pbWF0ZTogZmFsc2VcclxuICAgICAgICAsZml0OmZhbHNlXHJcbiAgICB9KSBcclxuICAgIG5ld0xheW91dC5ydW4oKVxyXG4gICAgdGhpcy5jb3JlLmNlbnRlcihlbGVzKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUubm9Qb3NpdGlvbl9jb25jZW50cmljPWZ1bmN0aW9uKGVsZXMsYm94KXtcclxuICAgIGlmKGVsZXM9PW51bGwpIGVsZXM9dGhpcy5jb3JlLmVsZW1lbnRzKClcclxuICAgIHZhciBuZXdMYXlvdXQgPWVsZXMubGF5b3V0KHtcclxuICAgICAgICBuYW1lOiAnY29uY2VudHJpYycsXHJcbiAgICAgICAgYW5pbWF0ZTogZmFsc2UsXHJcbiAgICAgICAgZml0OmZhbHNlLFxyXG4gICAgICAgIG1pbk5vZGVTcGFjaW5nOjYwLFxyXG4gICAgICAgIGdyYXZpdHk6MSxcclxuICAgICAgICBib3VuZGluZ0JveDpib3hcclxuICAgIH0pIFxyXG4gICAgbmV3TGF5b3V0LnJ1bigpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5sYXlvdXRXaXRoTm9kZVBvc2l0aW9uPWZ1bmN0aW9uKG5vZGVQb3NpdGlvbil7XHJcbiAgICB2YXIgbmV3TGF5b3V0ID0gdGhpcy5jb3JlLmxheW91dCh7XHJcbiAgICAgICAgbmFtZTogJ3ByZXNldCcsXHJcbiAgICAgICAgcG9zaXRpb25zOiBub2RlUG9zaXRpb24sXHJcbiAgICAgICAgYW5pbWF0ZTogZmFsc2UsIC8vIHdoZXRoZXIgdG8gdHJhbnNpdGlvbiB0aGUgbm9kZSBwb3NpdGlvbnNcclxuICAgICAgICBhbmltYXRpb25EdXJhdGlvbjogNTAwLCAvLyBkdXJhdGlvbiBvZiBhbmltYXRpb24gaW4gbXMgaWYgZW5hYmxlZFxyXG4gICAgfSlcclxuICAgIG5ld0xheW91dC5ydW4oKVxyXG59XHJcblxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gdG9wb2xvZ3lET007IiwiY29uc3Qgc2ltcGxlVHJlZT1yZXF1aXJlKFwiLi9zaW1wbGVUcmVlXCIpXHJcbmNvbnN0IG1vZGVsQW5hbHl6ZXI9cmVxdWlyZShcIi4vbW9kZWxBbmFseXplclwiKVxyXG5jb25zdCBtc2FsSGVscGVyID0gcmVxdWlyZShcIi4uL21zYWxIZWxwZXJcIilcclxuY29uc3QgZ2xvYmFsQ2FjaGUgPSByZXF1aXJlKFwiLi9nbG9iYWxDYWNoZVwiKVxyXG5cclxuZnVuY3Rpb24gdHdpbnNUcmVlKERPTSwgc2VhcmNoRE9NKSB7XHJcbiAgICB0aGlzLnRyZWU9bmV3IHNpbXBsZVRyZWUoRE9NLHtcImxlYWZOYW1lUHJvcGVydHlcIjpcImRpc3BsYXlOYW1lXCJ9KVxyXG5cclxuICAgIHRoaXMudHJlZS5vcHRpb25zLmdyb3VwTm9kZUljb25GdW5jPShnbik9PntcclxuICAgICAgICB2YXIgbW9kZWxDbGFzcz1nbi5pbmZvW1wiQGlkXCJdXHJcbiAgICAgICAgdmFyIGNvbG9yQ29kZT1cImdyYXlcIlxyXG4gICAgICAgIHZhciBzaGFwZT1cImVsbGlwc2VcIlxyXG4gICAgICAgIHZhciBhdmF0YXI9bnVsbFxyXG4gICAgICAgIGlmKGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdW21vZGVsQ2xhc3NdKXtcclxuICAgICAgICAgICAgdmFyIHZpc3VhbEpzb24gPWdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdW21vZGVsQ2xhc3NdXHJcbiAgICAgICAgICAgIHZhciBjb2xvckNvZGU9IHZpc3VhbEpzb24uY29sb3IgfHwgXCJncmF5XCJcclxuICAgICAgICAgICAgdmFyIHNoYXBlPSAgdmlzdWFsSnNvbi5zaGFwZSB8fCBcImVsbGlwc2VcIlxyXG4gICAgICAgICAgICB2YXIgYXZhcnRhPSB2aXN1YWxKc29uLmF2YXJ0YSBcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIGZvbnRzaXplPXtcImVsbGlwc2VcIjpcIjEzMCVcIixcInJvdW5kLXJlY3RhbmdsZVwiOlwiOTAlXCIsXCJoZXhhZ29uXCI6XCIxMjAlXCJ9W3NoYXBlXVxyXG4gICAgICAgIHNoYXBlPXtcImVsbGlwc2VcIjpcIuKXj1wiLFwicm91bmQtcmVjdGFuZ2xlXCI6XCLilolcIixcImhleGFnb25cIjpcIuKsolwifVtzaGFwZV1cclxuICAgICAgICBcclxuICAgICAgICB2YXIgbGJsSFRNTD1cIjxsYWJlbCBzdHlsZT0nZGlzcGxheTppbmxpbmU7Y29sb3I6XCIrY29sb3JDb2RlK1wiO2ZvbnQtc2l6ZTpcIitmb250c2l6ZStcIjtmb250LXdlaWdodDpub3JtYWw7Ym9yZGVyLXJhZGl1czogMnB4Oyc+XCIrc2hhcGUrXCI8L2xhYmVsPlwiXHJcblxyXG4gICAgICAgIGlmKGF2YXJ0YSkgbGJsSFRNTCs9XCI8aW1nIHNyYz0nXCIrYXZhcnRhK1wiJyBzdHlsZT0naGVpZ2h0OjIwcHgnLz5cIlxyXG5cclxuICAgICAgICByZXR1cm4gJChsYmxIVE1MKVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMudHJlZS5jYWxsYmFja19hZnRlclNlbGVjdE5vZGVzPShub2Rlc0Fycixtb3VzZUNsaWNrRGV0YWlsKT0+e1xyXG4gICAgICAgIHZhciBpbmZvQXJyPVtdXHJcbiAgICAgICAgbm9kZXNBcnIuZm9yRWFjaCgoaXRlbSwgaW5kZXgpID0+e1xyXG4gICAgICAgICAgICBpbmZvQXJyLnB1c2goaXRlbS5sZWFmSW5mbylcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJzZWxlY3ROb2Rlc1wiLCBpbmZvOmluZm9BcnIsIFwibW91c2VDbGlja0RldGFpbFwiOm1vdXNlQ2xpY2tEZXRhaWx9KVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMudHJlZS5jYWxsYmFja19hZnRlckRibGNsaWNrTm9kZT0odGhlTm9kZSk9PntcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJQYW5Ub05vZGVcIiwgaW5mbzp0aGVOb2RlLmxlYWZJbmZvfSlcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnRyZWUuY2FsbGJhY2tfYWZ0ZXJTZWxlY3RHcm91cE5vZGU9KG5vZGVJbmZvKT0+e1xyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7XCJtZXNzYWdlXCI6XCJzZWxlY3RHcm91cE5vZGVcIixpbmZvOm5vZGVJbmZvfSlcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnNlYXJjaEJveD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiAgcGxhY2Vob2xkZXI9XCJzZWFyY2guLi5cIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dFwiKTtcclxuICAgIHRoaXMuc2VhcmNoQm94LmNzcyh7XCJvdXRsaW5lXCI6XCJub25lXCIsXCJoZWlnaHRcIjpcIjEwMCVcIixcIndpZHRoXCI6XCIxMDAlXCJ9KSBcclxuICAgIHNlYXJjaERPTS5hcHBlbmQodGhpcy5zZWFyY2hCb3gpXHJcbiAgICB2YXIgaGlkZU9yU2hvd0VtcHR5R3JvdXA9JCgnPGJ1dHRvbiBzdHlsZT1cImhlaWdodDoyMHB4O2JvcmRlcjpub25lO3BhZGRpbmctbGVmdDoycHhcIiBjbGFzcz1cInczLWJsb2NrIHczLXRpbnkgdzMtaG92ZXItcmVkIHczLWFtYmVyXCI+SGlkZSBFbXB0eSBNb2RlbHM8L2J1dHRvbj4nKVxyXG4gICAgc2VhcmNoRE9NLmFwcGVuZChoaWRlT3JTaG93RW1wdHlHcm91cClcclxuICAgIERPTS5jc3MoXCJ0b3BcIixcIjUwcHhcIilcclxuICAgIGhpZGVPclNob3dFbXB0eUdyb3VwLmF0dHIoXCJzdGF0dXNcIixcInNob3dcIilcclxuICAgIGhpZGVPclNob3dFbXB0eUdyb3VwLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIGlmKGhpZGVPclNob3dFbXB0eUdyb3VwLmF0dHIoXCJzdGF0dXNcIik9PVwic2hvd1wiKXtcclxuICAgICAgICAgICAgaGlkZU9yU2hvd0VtcHR5R3JvdXAuYXR0cihcInN0YXR1c1wiLFwiaGlkZVwiKVxyXG4gICAgICAgICAgICBoaWRlT3JTaG93RW1wdHlHcm91cC50ZXh0KFwiU2hvdyBFbXB0eSBNb2RlbHNcIilcclxuICAgICAgICAgICAgdGhpcy50cmVlLm9wdGlvbnMuaGlkZUVtcHR5R3JvdXA9dHJ1ZVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBoaWRlT3JTaG93RW1wdHlHcm91cC5hdHRyKFwic3RhdHVzXCIsXCJzaG93XCIpXHJcbiAgICAgICAgICAgIGhpZGVPclNob3dFbXB0eUdyb3VwLnRleHQoXCJIaWRlIEVtcHR5IE1vZGVsc1wiKVxyXG4gICAgICAgICAgICBkZWxldGUgdGhpcy50cmVlLm9wdGlvbnMuaGlkZUVtcHR5R3JvdXBcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy50cmVlLmdyb3VwTm9kZXMuZm9yRWFjaChvbmVHcm91cE5vZGU9PntvbmVHcm91cE5vZGUuY2hlY2tPcHRpb25IaWRlRW1wdHlHcm91cCgpfSlcclxuICAgIH0pXHJcbiAgICB0aGlzLnNlYXJjaEJveC5rZXl1cCgoZSk9PntcclxuICAgICAgICBpZihlLmtleUNvZGUgPT0gMTMpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB2YXIgYU5vZGUgPSB0aGlzLnRyZWUuc2VhcmNoVGV4dCgkKGUudGFyZ2V0KS52YWwoKSlcclxuICAgICAgICAgICAgaWYoYU5vZGUhPW51bGwpe1xyXG4gICAgICAgICAgICAgICAgYU5vZGUucGFyZW50R3JvdXBOb2RlLmV4cGFuZCgpXHJcbiAgICAgICAgICAgICAgICB0aGlzLnRyZWUuc2VsZWN0TGVhZk5vZGUoYU5vZGUpXHJcbiAgICAgICAgICAgICAgICB0aGlzLnRyZWUuc2Nyb2xsVG9MZWFmTm9kZShhTm9kZSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcblxyXG50d2luc1RyZWUucHJvdG90eXBlLnJ4TWVzc2FnZT1mdW5jdGlvbihtc2dQYXlsb2FkKXtcclxuICAgIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJzdGFydFNlbGVjdGlvbl9yZXBsYWNlXCIpIHRoaXMubG9hZFN0YXJ0U2VsZWN0aW9uKG1zZ1BheWxvYWQudHdpbklEcyxtc2dQYXlsb2FkLm1vZGVsSURzLFwicmVwbGFjZVwiKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwic3RhcnRTZWxlY3Rpb25fYXBwZW5kXCIpIHRoaXMubG9hZFN0YXJ0U2VsZWN0aW9uKG1zZ1BheWxvYWQudHdpbklEcyxtc2dQYXlsb2FkLm1vZGVsSURzLFwiYXBwZW5kXCIpXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJkcmF3VHdpbnNBbmRSZWxhdGlvbnNcIikgdGhpcy5kcmF3VHdpbnNBbmRSZWxhdGlvbnMobXNnUGF5bG9hZC5pbmZvKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiQURUTW9kZWxzQ2hhbmdlXCIpIHRoaXMucmVmcmVzaE1vZGVscygpXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJhZGROZXdUd2luXCIpIHRoaXMuZHJhd09uZVR3aW4obXNnUGF5bG9hZC50d2luSW5mbylcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImFkZE5ld1R3aW5zXCIpIHtcclxuICAgICAgICBtc2dQYXlsb2FkLnR3aW5zSW5mby5mb3JFYWNoKG9uZVR3aW5JbmZvPT57dGhpcy5kcmF3T25lVHdpbihvbmVUd2luSW5mbyl9KVxyXG4gICAgfVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwidHdpbnNEZWxldGVkXCIpIHRoaXMuZGVsZXRlVHdpbnMobXNnUGF5bG9hZC50d2luSURBcnIpXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJ2aXN1YWxEZWZpbml0aW9uQ2hhbmdlXCIpe1xyXG4gICAgICAgIGlmKCFtc2dQYXlsb2FkLnNyY01vZGVsSUQpeyAvLyBjaGFuZ2UgbW9kZWwgY2xhc3MgdmlzdWFsaXphdGlvblxyXG4gICAgICAgICAgICB0aGlzLnRyZWUuZ3JvdXBOb2Rlcy5mb3JFYWNoKGduPT57Z24ucmVmcmVzaE5hbWUoKX0pXHJcbiAgICAgICAgfSBcclxuICAgIH1cclxufVxyXG5cclxudHdpbnNUcmVlLnByb3RvdHlwZS5kZWxldGVUd2lucz1mdW5jdGlvbih0d2luSURBcnIpe1xyXG4gICAgdHdpbklEQXJyLmZvckVhY2godHdpbklEPT57XHJcbiAgICAgICAgdGhpcy50cmVlLmRlbGV0ZUxlYWZOb2RlKHR3aW5JRClcclxuICAgIH0pXHJcbn1cclxuXHJcbnR3aW5zVHJlZS5wcm90b3R5cGUucmVmcmVzaE1vZGVscz1mdW5jdGlvbigpe1xyXG4gICAgdmFyIG1vZGVsc0RhdGE9e31cclxuICAgIGZvcih2YXIgbW9kZWxJRCBpbiBtb2RlbEFuYWx5emVyLkRURExNb2RlbHMpe1xyXG4gICAgICAgIHZhciBvbmVNb2RlbD1tb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF1cclxuICAgICAgICBtb2RlbHNEYXRhW29uZU1vZGVsW1wiZGlzcGxheU5hbWVcIl1dID0gb25lTW9kZWxcclxuICAgIH1cclxuICAgIC8vZGVsZXRlIGFsbCBncm91cCBub2RlcyBvZiBkZWxldGVkIG1vZGVsc1xyXG4gICAgdGhpcy50cmVlLmdyb3VwTm9kZXMuZm9yRWFjaCgoZ25vZGUpPT57XHJcbiAgICAgICAgaWYobW9kZWxzRGF0YVtnbm9kZS5uYW1lXT09bnVsbCl7XHJcbiAgICAgICAgICAgIC8vZGVsZXRlIHRoaXMgZ3JvdXAgbm9kZVxyXG4gICAgICAgICAgICBnbm9kZS5kZWxldGVTZWxmKClcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG5cclxuICAgIC8vdGhlbiBhZGQgYWxsIGdyb3VwIG5vZGVzIHRoYXQgdG8gYmUgYWRkZWRcclxuICAgIHZhciBjdXJyZW50TW9kZWxOYW1lQXJyPVtdXHJcbiAgICB0aGlzLnRyZWUuZ3JvdXBOb2Rlcy5mb3JFYWNoKChnbm9kZSk9PntjdXJyZW50TW9kZWxOYW1lQXJyLnB1c2goZ25vZGUubmFtZSl9KVxyXG5cclxuICAgIHZhciBhY3R1YWxNb2RlbE5hbWVBcnI9W11cclxuICAgIGZvcih2YXIgaW5kIGluIG1vZGVsc0RhdGEpIGFjdHVhbE1vZGVsTmFtZUFyci5wdXNoKGluZClcclxuICAgIGFjdHVhbE1vZGVsTmFtZUFyci5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhLnRvTG93ZXJDYXNlKCkubG9jYWxlQ29tcGFyZShiLnRvTG93ZXJDYXNlKCkpIH0pO1xyXG5cclxuICAgIGZvcih2YXIgaT0wO2k8YWN0dWFsTW9kZWxOYW1lQXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIGlmKGk8Y3VycmVudE1vZGVsTmFtZUFyci5sZW5ndGggJiYgY3VycmVudE1vZGVsTmFtZUFycltpXT09YWN0dWFsTW9kZWxOYW1lQXJyW2ldKSBjb250aW51ZVxyXG4gICAgICAgIC8vb3RoZXJ3aXNlIGFkZCB0aGlzIGdyb3VwIHRvIHRoZSB0cmVlXHJcbiAgICAgICAgdmFyIG5ld0dyb3VwPXRoaXMudHJlZS5pbnNlcnRHcm91cE5vZGUobW9kZWxzRGF0YVthY3R1YWxNb2RlbE5hbWVBcnJbaV1dLGkpXHJcbiAgICAgICAgbmV3R3JvdXAuc2hyaW5rKClcclxuICAgICAgICBjdXJyZW50TW9kZWxOYW1lQXJyLnNwbGljZShpLCAwLCBhY3R1YWxNb2RlbE5hbWVBcnJbaV0pO1xyXG4gICAgfVxyXG59XHJcblxyXG5cclxudHdpbnNUcmVlLnByb3RvdHlwZS5sb2FkU3RhcnRTZWxlY3Rpb249YXN5bmMgZnVuY3Rpb24odHdpbklEcyxtb2RlbElEcyxyZXBsYWNlT3JBcHBlbmQpe1xyXG4gICAgaWYocmVwbGFjZU9yQXBwZW5kPT1cInJlcGxhY2VcIikgdGhpcy50cmVlLmNsZWFyQWxsTGVhZk5vZGVzKClcclxuXHJcbiAgICBcclxuICAgIHRoaXMucmVmcmVzaE1vZGVscygpXHJcbiAgICBcclxuICAgIC8vYWRkIG5ldyB0d2lucyB1bmRlciB0aGUgbW9kZWwgZ3JvdXAgbm9kZVxyXG4gICAgdHJ5e1xyXG4gICAgICAgIHZhciB0d2luc2RhdGEgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9saXN0VHdpbnNGb3JJRHNcIiwgXCJQT1NUXCIsIHR3aW5JRHMpXHJcbiAgICAgICAgdmFyIHR3aW5JREFyciA9IFtdXHJcbiAgICAgICAgLy9jaGVjayBpZiBhbnkgY3VycmVudCBsZWFmIG5vZGUgZG9lcyBub3QgaGF2ZSBzdG9yZWQgb3V0Ym91bmQgcmVsYXRpb25zaGlwIGRhdGEgeWV0XHJcbiAgICAgICAgdGhpcy50cmVlLmdyb3VwTm9kZXMuZm9yRWFjaCgoZ05vZGUpID0+IHtcclxuICAgICAgICAgICAgZ05vZGUuY2hpbGRMZWFmTm9kZXMuZm9yRWFjaChsZWFmTm9kZSA9PiB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbm9kZUlkID0gbGVhZk5vZGUubGVhZkluZm9bXCIkZHRJZFwiXVxyXG4gICAgICAgICAgICAgICAgaWYgKGdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tub2RlSWRdID09IG51bGwpIHR3aW5JREFyci5wdXNoKG5vZGVJZClcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICBnbG9iYWxDYWNoZS5zdG9yZUFEVFR3aW5zKHR3aW5zZGF0YSlcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHR3aW5zZGF0YS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgZ3JvdXBOYW1lID0gZ2xvYmFsQ2FjaGUubW9kZWxJRE1hcFRvTmFtZVt0d2luc2RhdGFbaV1bXCIkbWV0YWRhdGFcIl1bXCIkbW9kZWxcIl1dXHJcbiAgICAgICAgICAgIHRoaXMudHJlZS5hZGRMZWFmbm9kZVRvR3JvdXAoZ3JvdXBOYW1lLCB0d2luc2RhdGFbaV0sIFwic2tpcFJlcGVhdFwiKVxyXG4gICAgICAgICAgICB0d2luSURBcnIucHVzaCh0d2luc2RhdGFbaV1bXCIkZHRJZFwiXSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYocmVwbGFjZU9yQXBwZW5kPT1cInJlcGxhY2VcIikgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwicmVwbGFjZUFsbFR3aW5zXCIsIGluZm86IHR3aW5zZGF0YSB9KVxyXG4gICAgICAgIGVsc2UgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiYXBwZW5kQWxsVHdpbnNcIiwgaW5mbzogdHdpbnNkYXRhIH0pXHJcbiAgICAgICAgXHJcblxyXG4gICAgICAgIHRoaXMuZmV0Y2hBbGxSZWxhdGlvbnNoaXBzKHR3aW5JREFycilcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgIH1cclxufVxyXG5cclxuXHJcblxyXG50d2luc1RyZWUucHJvdG90eXBlLmRyYXdUd2luc0FuZFJlbGF0aW9ucz0gZnVuY3Rpb24oZGF0YSl7XHJcbiAgICBkYXRhLmNoaWxkVHdpbnNBbmRSZWxhdGlvbnMuZm9yRWFjaChvbmVTZXQ9PntcclxuICAgICAgICBmb3IodmFyIGluZCBpbiBvbmVTZXQuY2hpbGRUd2lucyl7XHJcbiAgICAgICAgICAgIHZhciBvbmVUd2luPW9uZVNldC5jaGlsZFR3aW5zW2luZF1cclxuICAgICAgICAgICAgdGhpcy5kcmF3T25lVHdpbihvbmVUd2luKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbiAgICBcclxuICAgIC8vZHJhdyB0aG9zZSBrbm93biB0d2lucyBmcm9tIHRoZSByZWxhdGlvbnNoaXBzXHJcbiAgICB2YXIgdHdpbnNJbmZvPXt9XHJcbiAgICBkYXRhLmNoaWxkVHdpbnNBbmRSZWxhdGlvbnMuZm9yRWFjaChvbmVTZXQ9PntcclxuICAgICAgICB2YXIgcmVsYXRpb25zSW5mbz1vbmVTZXRbXCJyZWxhdGlvbnNoaXBzXCJdXHJcbiAgICAgICAgcmVsYXRpb25zSW5mby5mb3JFYWNoKChvbmVSZWxhdGlvbik9PntcclxuICAgICAgICAgICAgdmFyIHNyY0lEPW9uZVJlbGF0aW9uWyckc291cmNlSWQnXVxyXG4gICAgICAgICAgICB2YXIgdGFyZ2V0SUQ9b25lUmVsYXRpb25bJyR0YXJnZXRJZCddXHJcbiAgICAgICAgICAgIGlmKGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3NyY0lEXSlcclxuICAgICAgICAgICAgICAgIHR3aW5zSW5mb1tzcmNJRF0gPSBnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1tzcmNJRF1cclxuICAgICAgICAgICAgaWYoZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbdGFyZ2V0SURdKVxyXG4gICAgICAgICAgICAgICAgdHdpbnNJbmZvW3RhcmdldElEXSA9IGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3RhcmdldElEXSAgICBcclxuICAgICAgICB9KVxyXG4gICAgfSlcclxuICAgIHZhciB0bXBBcnI9W11cclxuICAgIGZvcih2YXIgdHdpbklEIGluIHR3aW5zSW5mbykgdG1wQXJyLnB1c2godHdpbnNJbmZvW3R3aW5JRF0pXHJcbiAgICB0bXBBcnIuZm9yRWFjaChvbmVUd2luPT57dGhpcy5kcmF3T25lVHdpbihvbmVUd2luKX0pXHJcbn1cclxuXHJcbnR3aW5zVHJlZS5wcm90b3R5cGUuZHJhd09uZVR3aW49IGZ1bmN0aW9uKHR3aW5JbmZvKXtcclxuICAgIHZhciBncm91cE5hbWU9Z2xvYmFsQ2FjaGUubW9kZWxJRE1hcFRvTmFtZVt0d2luSW5mb1tcIiRtZXRhZGF0YVwiXVtcIiRtb2RlbFwiXV1cclxuICAgIHRoaXMudHJlZS5hZGRMZWFmbm9kZVRvR3JvdXAoZ3JvdXBOYW1lLHR3aW5JbmZvLFwic2tpcFJlcGVhdFwiKVxyXG59XHJcblxyXG50d2luc1RyZWUucHJvdG90eXBlLmZldGNoQWxsUmVsYXRpb25zaGlwcz0gYXN5bmMgZnVuY3Rpb24odHdpbklEQXJyKXtcclxuICAgIHdoaWxlKHR3aW5JREFyci5sZW5ndGg+MCl7XHJcbiAgICAgICAgdmFyIHNtYWxsQXJyPSB0d2luSURBcnIuc3BsaWNlKDAsIDEwMCk7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICB2YXIgZGF0YSA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2dldFJlbGF0aW9uc2hpcHNGcm9tVHdpbklEc1wiLCBcIlBPU1RcIiwgc21hbGxBcnIpXHJcbiAgICAgICAgICAgIGlmIChkYXRhID09IFwiXCIpIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICBnbG9iYWxDYWNoZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzKGRhdGEpIC8vc3RvcmUgdGhlbSBpbiBnbG9iYWwgYXZhaWxhYmxlIGFycmF5XHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImRyYXdBbGxSZWxhdGlvbnNcIiwgaW5mbzogZGF0YSB9KVxyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB0d2luc1RyZWU7IiwiY29uc3Qgc2lnbnVwc2lnbmlubmFtZT1cIkIyQ18xX3Npbmd1cHNpZ25pbl9zcGFhcHAxXCJcclxuY29uc3QgYjJjVGVuYW50TmFtZT1cImF6dXJlaW90YjJjXCJcclxuXHJcbmNvbnN0IHVybCA9IG5ldyBVUkwod2luZG93LmxvY2F0aW9uLmhyZWYpO1xyXG5cclxudmFyIHN0ckFycj13aW5kb3cubG9jYXRpb24uaHJlZi5zcGxpdChcIj9cIilcclxudmFyIGlzTG9jYWxUZXN0PShzdHJBcnIuaW5kZXhPZihcInRlc3Q9MVwiKSE9LTEpXHJcblxyXG5jb25zdCBnbG9iYWxBcHBTZXR0aW5ncz17XHJcbiAgICBcImIyY1NpZ25VcFNpZ25Jbk5hbWVcIjogc2lnbnVwc2lnbmlubmFtZSxcclxuICAgIFwiYjJjU2NvcGVzXCI6W1wiaHR0cHM6Ly9cIitiMmNUZW5hbnROYW1lK1wiLm9ubWljcm9zb2Z0LmNvbS90YXNrbWFzdGVybW9kdWxlL29wZXJhdGlvblwiXSxcclxuICAgIFwibG9nb3V0UmVkaXJlY3RVcmlcIjogdXJsLm9yaWdpbitcIi9zcGFpbmRleC5odG1sXCIsXHJcbiAgICBcIm1zYWxDb25maWdcIjp7XHJcbiAgICAgICAgYXV0aDoge1xyXG4gICAgICAgICAgICBjbGllbnRJZDogXCJmNDY5M2JlNS02MDFiLTRkMGUtOTIwOC1jMzVkOWFkNjIzODdcIixcclxuICAgICAgICAgICAgYXV0aG9yaXR5OiBcImh0dHBzOi8vXCIrYjJjVGVuYW50TmFtZStcIi5iMmNsb2dpbi5jb20vXCIrYjJjVGVuYW50TmFtZStcIi5vbm1pY3Jvc29mdC5jb20vXCIrc2lnbnVwc2lnbmlubmFtZSxcclxuICAgICAgICAgICAga25vd25BdXRob3JpdGllczogW2IyY1RlbmFudE5hbWUrXCIuYjJjbG9naW4uY29tXCJdLFxyXG4gICAgICAgICAgICByZWRpcmVjdFVyaTogd2luZG93LmxvY2F0aW9uLmhyZWZcclxuICAgICAgICB9LFxyXG4gICAgICAgIGNhY2hlOiB7XHJcbiAgICAgICAgICAgIGNhY2hlTG9jYXRpb246IFwic2Vzc2lvblN0b3JhZ2VcIiwgXHJcbiAgICAgICAgICAgIHN0b3JlQXV0aFN0YXRlSW5Db29raWU6IGZhbHNlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBzeXN0ZW06IHtcclxuICAgICAgICAgICAgbG9nZ2VyT3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgbG9nZ2VyQ2FsbGJhY2s6IChsZXZlbCwgbWVzc2FnZSwgY29udGFpbnNQaWkpID0+IHt9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgXCJpc0xvY2FsVGVzdFwiOmlzTG9jYWxUZXN0LFxyXG4gICAgXCJ0YXNrTWFzdGVyQVBJVVJJXCI6KChpc0xvY2FsVGVzdCk/XCJodHRwOi8vbG9jYWxob3N0OjUwMDIvXCI6XCJodHRwczovL2F6dXJlaW90cm9ja3N0YXNrbWFzdGVybW9kdWxlLmF6dXJld2Vic2l0ZXMubmV0L1wiKVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGdsb2JhbEFwcFNldHRpbmdzOyIsImNvbnN0IGdsb2JhbEFwcFNldHRpbmdzPXJlcXVpcmUoXCIuL2dsb2JhbEFwcFNldHRpbmdzXCIpXHJcblxyXG5mdW5jdGlvbiBtc2FsSGVscGVyKCl7XHJcbiAgICB0aGlzLm15TVNBTE9iaiA9IG5ldyBtc2FsLlB1YmxpY0NsaWVudEFwcGxpY2F0aW9uKGdsb2JhbEFwcFNldHRpbmdzLm1zYWxDb25maWcpO1xyXG59XHJcblxyXG5tc2FsSGVscGVyLnByb3RvdHlwZS5zaWduSW49YXN5bmMgZnVuY3Rpb24oKXtcclxuICAgIHRyeXtcclxuICAgICAgICB2YXIgcmVzcG9uc2U9IGF3YWl0IHRoaXMubXlNU0FMT2JqLmxvZ2luUG9wdXAoeyBzY29wZXM6IGdsb2JhbEFwcFNldHRpbmdzLmIyY1Njb3BlcyB9KVxyXG4gICAgICAgIGlmIChyZXNwb25zZSAhPSBudWxsKXtcclxuICAgICAgICAgICAgdGhpcy5zZXRBY2NvdW50KHJlc3BvbnNlLmFjY291bnQpXHJcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5hY2NvdW50XHJcbiAgICAgICAgfSBcclxuICAgICAgICBlbHNlICByZXR1cm4gdGhpcy5mZXRjaEFjY291bnQoKVxyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIGlmKGUuZXJyb3JDb2RlIT1cInVzZXJfY2FuY2VsbGVkXCIpIGNvbnNvbGUubG9nKGUpXHJcbiAgICB9XHJcbn1cclxuXHJcbm1zYWxIZWxwZXIucHJvdG90eXBlLnNldEFjY291bnQ9ZnVuY3Rpb24odGhlQWNjb3VudCl7XHJcbiAgICBpZih0aGVBY2NvdW50PT1udWxsKXJldHVybjtcclxuICAgIHRoaXMuYWNjb3VudElkID0gdGhlQWNjb3VudC5ob21lQWNjb3VudElkO1xyXG4gICAgdGhpcy5hY2NvdW50TmFtZSA9IHRoZUFjY291bnQudXNlcm5hbWU7XHJcbiAgICB0aGlzLnVzZXJOYW1lPXRoZUFjY291bnQubmFtZTtcclxufVxyXG5cclxubXNhbEhlbHBlci5wcm90b3R5cGUuZmV0Y2hBY2NvdW50PWZ1bmN0aW9uKG5vQW5pbWF0aW9uKXtcclxuICAgIGNvbnN0IGN1cnJlbnRBY2NvdW50cyA9IHRoaXMubXlNU0FMT2JqLmdldEFsbEFjY291bnRzKCk7XHJcbiAgICBpZiAoY3VycmVudEFjY291bnRzLmxlbmd0aCA8IDEpIHJldHVybjtcclxuICAgIHZhciBmb3VuZEFjY291bnQ9bnVsbDtcclxuICAgIGZvcih2YXIgaT0wO2k8Y3VycmVudEFjY291bnRzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBhbkFjY291bnQ9IGN1cnJlbnRBY2NvdW50c1tpXVxyXG4gICAgICAgIGlmKGFuQWNjb3VudC5ob21lQWNjb3VudElkLnRvVXBwZXJDYXNlKCkuaW5jbHVkZXMoZ2xvYmFsQXBwU2V0dGluZ3MuYjJjU2lnblVwU2lnbkluTmFtZS50b1VwcGVyQ2FzZSgpKVxyXG4gICAgICAgICAgICAmJiBhbkFjY291bnQuaWRUb2tlbkNsYWltcy5pc3MudG9VcHBlckNhc2UoKS5pbmNsdWRlcyhnbG9iYWxBcHBTZXR0aW5ncy5tc2FsQ29uZmlnLmF1dGgua25vd25BdXRob3JpdGllc1swXS50b1VwcGVyQ2FzZSgpKVxyXG4gICAgICAgICAgICAmJiBhbkFjY291bnQuaWRUb2tlbkNsYWltcy5hdWQgPT09IGdsb2JhbEFwcFNldHRpbmdzLm1zYWxDb25maWcuYXV0aC5jbGllbnRJZFxyXG4gICAgICAgICl7XHJcbiAgICAgICAgICAgIGZvdW5kQWNjb3VudD0gYW5BY2NvdW50O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMuc2V0QWNjb3VudChmb3VuZEFjY291bnQpXHJcbiAgICByZXR1cm4gZm91bmRBY2NvdW50O1xyXG59XHJcblxyXG5tc2FsSGVscGVyLnByb3RvdHlwZS5jYWxsQVBJPWFzeW5jIGZ1bmN0aW9uKEFQSVN0cmluZyxSRVNUTWV0aG9kLHBheWxvYWQpe1xyXG4gICAgdmFyIGhlYWRlcnNPYmo9e31cclxuICAgIGlmKCFnbG9iYWxBcHBTZXR0aW5ncy5pc0xvY2FsVGVzdCl7XHJcbiAgICAgICAgdmFyIHRva2VuPWF3YWl0IHRoaXMuZ2V0VG9rZW4oKVxyXG4gICAgICAgIGhlYWRlcnNPYmpbXCJBdXRob3JpemF0aW9uXCJdPWBCZWFyZXIgJHt0b2tlbn1gXHJcbiAgICB9XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIHZhciBhamF4Q29udGVudD17XHJcbiAgICAgICAgICAgIHR5cGU6IFJFU1RNZXRob2QgfHwgJ0dFVCcsXHJcbiAgICAgICAgICAgIFwiaGVhZGVyc1wiOmhlYWRlcnNPYmosXHJcbiAgICAgICAgICAgIHVybDogZ2xvYmFsQXBwU2V0dGluZ3MudGFza01hc3RlckFQSVVSSStBUElTdHJpbmcsXHJcbiAgICAgICAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIixcclxuICAgICAgICAgICAgY3Jvc3NEb21haW46IHRydWUsXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChyZXNwb25zZURhdGEsIHRleHRTdGF0dXMsIGpxWEhSKSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3BvbnNlRGF0YSlcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uIChyZXNwb25zZURhdGEsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKSB7XHJcbiAgICAgICAgICAgICAgICByZWplY3QocmVzcG9uc2VEYXRhKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKFJFU1RNZXRob2Q9PVwiUE9TVFwiKSBhamF4Q29udGVudC5kYXRhPSBKU09OLnN0cmluZ2lmeShwYXlsb2FkKVxyXG4gICAgICAgICQuYWpheChhamF4Q29udGVudCk7XHJcbiAgICB9KVxyXG59XHJcblxyXG5tc2FsSGVscGVyLnByb3RvdHlwZS5nZXRUb2tlbj1hc3luYyBmdW5jdGlvbigpe1xyXG4gICAgdHJ5e1xyXG4gICAgICAgIGlmKHRoaXMuc3RvcmVkVG9rZW4hPW51bGwpe1xyXG4gICAgICAgICAgICB2YXIgY3VyclRpbWU9cGFyc2VJbnQobmV3IERhdGUoKS5nZXRUaW1lKCkvMTAwMClcclxuICAgICAgICAgICAgaWYoY3VyclRpbWUrNjAgPCB0aGlzLnN0b3JlZFRva2VuRXhwKSByZXR1cm4gdGhpcy5zdG9yZWRUb2tlblxyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgdG9rZW5SZXF1ZXN0PXtcclxuICAgICAgICAgICAgc2NvcGVzOiBnbG9iYWxBcHBTZXR0aW5ncy5iMmNTY29wZXMsXHJcbiAgICAgICAgICAgIGZvcmNlUmVmcmVzaDogZmFsc2UsIC8vIFNldCB0aGlzIHRvIFwidHJ1ZVwiIHRvIHNraXAgYSBjYWNoZWQgdG9rZW4gYW5kIGdvIHRvIHRoZSBzZXJ2ZXIgdG8gZ2V0IGEgbmV3IHRva2VuXHJcbiAgICAgICAgICAgIGFjY291bnQ6IHRoaXMubXlNU0FMT2JqLmdldEFjY291bnRCeUhvbWVJZCh0aGlzLmFjY291bnRJZClcclxuICAgICAgICB9XHJcbiAgICBcclxuICAgICAgICB2YXIgcmVzcG9uc2UgPSBhd2FpdCB0aGlzLm15TVNBTE9iai5hY3F1aXJlVG9rZW5TaWxlbnQodG9rZW5SZXF1ZXN0KVxyXG4gICAgICAgIGlmICghcmVzcG9uc2UuYWNjZXNzVG9rZW4gfHwgcmVzcG9uc2UuYWNjZXNzVG9rZW4gPT09IFwiXCIpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IG1zYWwuSW50ZXJhY3Rpb25SZXF1aXJlZEF1dGhFcnJvcjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuc3RvcmVkVG9rZW49cmVzcG9uc2UuYWNjZXNzVG9rZW5cclxuICAgICAgICB0aGlzLnN0b3JlZFRva2VuRXhwPXJlc3BvbnNlLmlkVG9rZW5DbGFpbXMuZXhwXHJcbiAgICB9Y2F0Y2goZXJyb3Ipe1xyXG4gICAgICAgIGlmIChlcnJvciBpbnN0YW5jZW9mIG1zYWwuSW50ZXJhY3Rpb25SZXF1aXJlZEF1dGhFcnJvcikge1xyXG4gICAgICAgICAgICAvLyBmYWxsYmFjayB0byBpbnRlcmFjdGlvbiB3aGVuIHNpbGVudCBjYWxsIGZhaWxzXHJcbiAgICAgICAgICAgIHZhciByZXNwb25zZT1hd2FpdCB0aGlzLm15TVNBTE9iai5hY3F1aXJlVG9rZW5Qb3B1cCh0b2tlblJlcXVlc3QpXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhyb3cgZXJyb3I7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXNwb25zZS5hY2Nlc3NUb2tlbjtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgbXNhbEhlbHBlcigpOyJdfQ==
