(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';
const topologyDOM=require("./topologyDOM.js")
const twinsTree=require("./twinsTree")
const startSelectionDialog = require("./startSelectionDialog")
const modelManagerDialog = require("../sharedSourceFiles/modelManagerDialog")
const modelEditorDialog = require("../sharedSourceFiles/modelEditorDialog")
const editLayoutDialog = require("./editLayoutDialog")
const mainToolbar = require("./mainToolbar")
const infoPanel= require("./infoPanel");
const globalAppSettings = require("../globalAppSettings.js");
const msalHelper=require("../msalHelper")
const globalCache=require("../sharedSourceFiles/globalCache")
const IoTDeviceTwinDialog=require("../sharedSourceFiles/IoTDeviceTwinDialog");

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
         mainToolbar,this.topologyInstance,infoPanel,IoTDeviceTwinDialog]

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
},{"../globalAppSettings.js":8,"../msalHelper":9,"../sharedSourceFiles/IoTDeviceTwinDialog":10,"../sharedSourceFiles/globalCache":11,"../sharedSourceFiles/modelEditorDialog":13,"../sharedSourceFiles/modelManagerDialog":14,"./editLayoutDialog":2,"./infoPanel":3,"./mainToolbar":4,"./startSelectionDialog":5,"./topologyDOM.js":6,"./twinsTree":7}],2:[function(require,module,exports){
const simpleSelectMenu= require("../sharedSourceFiles/simpleSelectMenu")
const simpleConfirmDialog = require("../sharedSourceFiles/simpleConfirmDialog")
const globalCache=require("../sharedSourceFiles/globalCache")
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
},{"../msalHelper":9,"../sharedSourceFiles/globalCache":11,"../sharedSourceFiles/simpleConfirmDialog":16,"../sharedSourceFiles/simpleSelectMenu":17}],3:[function(require,module,exports){
const modelAnalyzer = require("../sharedSourceFiles/modelAnalyzer");
const simpleSelectMenu= require("../sharedSourceFiles/simpleSelectMenu")
const simpleConfirmDialog = require("../sharedSourceFiles/simpleConfirmDialog")
const globalCache = require("../sharedSourceFiles/globalCache")
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
    }
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
        this.DOM.html("<a style='display:block;font-style:italic;color:gray'>Choose twins or relationships to view infomration</a><a style='display:block;font-style:italic;color:gray;padding-top:20px'>Press shift key to select multiple in topology view</a><a style='display:block;font-style:italic;color:gray;padding-top:20px;padding-bottom:20px'>Press ctrl key to select multiple in tree view</a><a style='display:block;font-style:italic;color:gray;padding-top:20px;padding-bottom:5px'>Import twins data by clicking button below</a>")
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

infoPanel.prototype.drawEditable=function(parent,jsonInfo,originElementInfo,pathArr){
    if(jsonInfo==null) return;
    for(var ind in jsonInfo){
        var keyDiv= $("<label style='display:block'><div style='display:inline;padding:.1em .3em .1em .3em; font-weight:bold;color:black'>"+ind+"</div></label>")
        parent.append(keyDiv)
        
        keyDiv.css("padding-top",".3em") 

        var contentDOM=$("<label style='padding-top:.2em'></label>")
        var newPath=pathArr.concat([ind])
        if(Array.isArray(jsonInfo[ind])){
            this.drawDropdownOption(contentDOM,newPath,jsonInfo[ind],originElementInfo)
        }else if(typeof(jsonInfo[ind])==="object") {
            contentDOM.css("display","block")
            contentDOM.css("padding-left","1em")
            this.drawEditable(contentDOM,jsonInfo[ind],originElementInfo,newPath)
        }else {
            var aInput=$('<input type="text" style="padding:2px;width:50%;outline:none;display:inline" placeholder="type: '+jsonInfo[ind]+'"/>').addClass("w3-input w3-border");  
            contentDOM.append(aInput)
            var val=this.searchValue(originElementInfo,newPath)
            if(val!=null) aInput.val(val)
            aInput.data("path", newPath)
            aInput.data("dataType", jsonInfo[ind])
            aInput.change((e)=>{
                this.editDTProperty(originElementInfo,$(e.target).data("path"),$(e.target).val(),$(e.target).data("dataType"))
            })
        }
        keyDiv.append(contentDOM)
    }
}

infoPanel.prototype.drawDropdownOption=function(contentDOM,newPath,valueArr,originElementInfo){
    var aSelectMenu=new simpleSelectMenu("",{buttonCSS:{"padding":"4px 16px"}})
    contentDOM.append(aSelectMenu.DOM)
    aSelectMenu.DOM.data("path", newPath)
    valueArr.forEach((oneOption)=>{
        var str =oneOption["displayName"]  || oneOption["enumValue"] 
        aSelectMenu.addOption(str)
    })
    aSelectMenu.callBack_clickOption=(optionText,optionValue,realMouseClick)=>{
        aSelectMenu.changeName(optionText)
        if(realMouseClick) this.editDTProperty(originElementInfo,aSelectMenu.DOM.data("path"),optionValue,"string")
    }
    var val=this.searchValue(originElementInfo,newPath)
    if(val!=null){
        aSelectMenu.triggerOptionValue(val)
    }    
}

infoPanel.prototype.editDTProperty=async function(originElementInfo,path,newVal,dataType){
    if(["double","boolean","float","integer","long"].includes(dataType)) newVal=Number(newVal)

    //{ "op": "add", "path": "/x", "value": 30 }
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
},{"../msalHelper":9,"../sharedSourceFiles/globalCache":11,"../sharedSourceFiles/modelAnalyzer":12,"../sharedSourceFiles/simpleConfirmDialog":16,"../sharedSourceFiles/simpleSelectMenu":17}],4:[function(require,module,exports){
const startSelectionDialog = require("./startSelectionDialog")
const modelManagerDialog = require("../sharedSourceFiles/modelManagerDialog")
const editLayoutDialog= require("./editLayoutDialog")
const simpleSelectMenu= require("../sharedSourceFiles/simpleSelectMenu")
const globalCache = require("../sharedSourceFiles/globalCache")
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
},{"../msalHelper":9,"../sharedSourceFiles/globalCache":11,"../sharedSourceFiles/modelManagerDialog":14,"../sharedSourceFiles/moduleSwitchDialog":15,"../sharedSourceFiles/simpleSelectMenu":17,"./editLayoutDialog":2,"./startSelectionDialog":5}],5:[function(require,module,exports){
const globalAppSettings = require("../globalAppSettings")
const msalHelper=require("../msalHelper")
const globalCache = require("../sharedSourceFiles/globalCache")

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
},{"../globalAppSettings":8,"../msalHelper":9,"../sharedSourceFiles/globalCache":11}],6:[function(require,module,exports){
'use strict';

const modelAnalyzer = require("../sharedSourceFiles/modelAnalyzer");
const simpleSelectMenu = require("../sharedSourceFiles/simpleSelectMenu")
const simpleConfirmDialog = require("../sharedSourceFiles/simpleConfirmDialog")
const globalCache = require("../sharedSourceFiles/globalCache")
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
                'source-arrow-color': 'red',
                'line-fill':"linear-gradient",
                'line-gradient-stop-colors':['cyan', 'magenta', 'yellow'],
                'line-gradient-stop-positions':['0%','70%','100%']
            }},
            {selector: 'node:selected',
            style: {
                'border-color':"red",
                'border-width':2,
                'background-fill':'radial-gradient',
                'background-gradient-stop-colors':['cyan', 'magenta', 'yellow'],
                'background-gradient-stop-positions':['0%','50%','60%']
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
    this.selectFunction()
    if(this.lastHoverTarget){
        this.lastHoverTarget.removeClass("hover")
        this.lastHoverTarget=null;
    } 

}

topologyDOM.prototype.selectFunction = function () {
    var arr = this.core.$(":selected")
    var re = []
    arr.forEach((ele) => { re.push(ele.data().originalInfo) })
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
    if(shape=="hexagon"){
        this.core.style()
        .selector('node[modelID = "'+modelID+'"]')
        .style({'shape': 'polygon','shape-polygon-points':[0,-1,0.866,-0.5,0.866,0.5,0,1,-0.866,0.5,-0.866,-0.5]})
        .update()   
    }else{
        this.core.style()
        .selector('node[modelID = "'+modelID+'"]')
        .style({'shape': shape})
        .update()   
    }
    
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
        .style({'width':parseFloat(edgeWidth)+3})
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
        var nodeInfo= msgPayload.twinInfo;
        var nodeName= globalCache.twinIDMapToDisplayName[nodeInfo["$dtId"]]
        var topoNode= this.core.nodes("#"+nodeName)
        if(topoNode){
            var position=topoNode.renderedPosition()
            this.core.panBy({x:-position.x+200,y:-position.y+50})
            topoNode.select()
            this.selectFunction()
        }
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
        var nodeName= globalCache.twinIDMapToDisplayName[nodeInfo["$dtId"]]
        var topoNode= this.core.nodes("#"+nodeName)
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
},{"../msalHelper":9,"../sharedSourceFiles/globalCache":11,"../sharedSourceFiles/modelAnalyzer":12,"../sharedSourceFiles/simpleConfirmDialog":16,"../sharedSourceFiles/simpleSelectMenu":17}],7:[function(require,module,exports){
const simpleTree=require("../sharedSourceFiles/simpleTree")
const modelAnalyzer=require("../sharedSourceFiles/modelAnalyzer")
const msalHelper = require("../msalHelper")
const globalCache = require("../sharedSourceFiles/globalCache")
const IoTDeviceTwinDialog=require("../sharedSourceFiles/IoTDeviceTwinDialog");

function twinsTree(DOM, searchDOM) {
    this.tree=new simpleTree(DOM,{"leafNameProperty":"displayName"})

    this.tree.options.groupNodeIconFunc=(gn)=>{
        var modelClass=gn.info["@id"]
        var colorCode="darkGray"
        var shape="ellipse"
        var avarta=null
        var dimension=20;
        if(globalCache.visualDefinition["default"][modelClass]){
            var visualJson =globalCache.visualDefinition["default"][modelClass]
            var colorCode= visualJson.color || "darkGray"
            var shape=  visualJson.shape || "ellipse"
            var avarta= visualJson.avarta 
            if(visualJson.dimensionRatio) dimension*=parseFloat(visualJson.dimensionRatio)
        }

        var iconDOM=$("<div style='width:"+dimension+"px;height:"+dimension+"px;float:left;position:relative'></div>")
        var imgSrc=encodeURIComponent(this.shapeSvg(shape,colorCode))
        iconDOM.append($("<img src='data:image/svg+xml;utf8,"+imgSrc+"'></img>"))
        if(avarta){
            var avartaimg=$("<img style='position:absolute;left:0px;width:60%;margin:20%' src='"+avarta+"'></img>")
            iconDOM.append(avartaimg)
        }
        return iconDOM
    }

    this.tree.options.groupNodeTailButtonFunc = (gn) => {
        var addButton = $('<button class="w3-bar-item w3-button w3-red w3-hover-amber" style="font-size:1.2em;padding:4px 8px;position:absolute;top:50%;height:27px; right:10px;transform:translateY(-50%)">+</button>')
        addButton.on("click", (e) => {
            gn.expand()
            IoTDeviceTwinDialog.popup({
                "$metadata": {
                    "$model": gn.info["@id"]
                }
            })
            return false
        })
        return addButton;
    }

    this.tree.callback_afterSelectNodes=(nodesArr,mouseClickDetail)=>{
        var infoArr=[]
        nodesArr.forEach((item, index) =>{
            infoArr.push(item.leafInfo)
        });
        this.broadcastMessage({ "message": "showInfoSelectedNodes", info:infoArr, "mouseClickDetail":mouseClickDetail})
    }

    this.tree.callback_afterDblclickNode=(theNode)=>{
        this.broadcastMessage({ "message": "PanToNode", info:theNode.leafInfo})
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

twinsTree.prototype.shapeSvg=function(shape,color){
    if(shape=="ellipse"){
        return '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" version="1.1" ><circle cx="50" cy="50" r="50"  fill="'+color+'"/></svg>'
    }else if(shape=="hexagon"){
        return '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" version="1.1" ><polygon points="50 0, 93.3 25, 93.3 75, 50 100, 6.7 75, 6.7 25"  fill="'+color+'" /></svg>'
    }else if(shape=="round-rectangle"){
        return '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" version="1.1" ><rect x="10" y="10" rx="10" ry="10" width="80" height="80" fill="'+color+'" /></svg>'
    }
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
},{"../msalHelper":9,"../sharedSourceFiles/IoTDeviceTwinDialog":10,"../sharedSourceFiles/globalCache":11,"../sharedSourceFiles/modelAnalyzer":12,"../sharedSourceFiles/simpleTree":18}],8:[function(require,module,exports){
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
},{}],9:[function(require,module,exports){
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
},{"./globalAppSettings":8}],10:[function(require,module,exports){
const modelAnalyzer=require("./modelAnalyzer")
const simpleSelectMenu= require("./simpleSelectMenu")
const msalHelper=require("../msalHelper")
const globalCache=require("./globalCache")

function IoTDeviceTwinDialog() {
    if(!this.DOM){
        this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:99" class="w3-card-2"></div>')
        $("body").append(this.DOM)
        this.DOM.hide()
    }
}

IoTDeviceTwinDialog.prototype.popup = async function(twinInfo,iotDeviceInfo) {
    this.originalTwinInfo=JSON.parse(JSON.stringify(twinInfo))
    this.twinInfo=twinInfo
    this.iotDeviceInfo=iotDeviceInfo
    this.DOM.show()
    this.DOM.empty()
    this.contentDOM = $('<div style="width:605px"></div>')
    this.DOM.append(this.contentDOM)
    this.contentDOM.append($('<div style="height:40px" class="w3-bar w3-red"><div class="w3-bar-item" style="font-size:1.5em">Digital Twin Editor</div></div>'))
    var closeButton = $('<button class="w3-bar-item w3-button w3-right" style="font-size:2em;padding-top:4px">×</button>')
    this.contentDOM.children(':first').append(closeButton)
    closeButton.on("click", () => { this.DOM.hide() })

    if(!twinInfo["$dtId"]){
        var btnText="Add"//this is for creating new twin
        var btnText2="Add & Close"
        this.isCreatingTwin=true
        var okButton = $('<button class="w3-button w3-card w3-green w3-hover-light-green" style="height:100%">'+btnText+'</button>')    
        this.contentDOM.children(':first').append(okButton)
        okButton.on("click", async () => {this.addNewTwin()})    
    } 
    else{
        btnText2="Save" //this is when editing a existed twin
    } 
    
    var secondButton = $('<button class="w3-button w3-card w3-green w3-hover-light-green" style="height:100%;margin-left:5px">'+btnText2+'</button>')    
    this.contentDOM.children(':first').append(secondButton)

    if(!twinInfo["$dtId"]){
        secondButton.on("click", async () => {this.addNewTwin("CloseDialog")})
    }else{
        secondButton.on("click", async () => {this.saveTwin()})
    }
    

    var firstRow=$('<div class="w3-cell-row" style="padding-bottom:10px"></div>')
    this.contentDOM.append(firstRow)
    var topLeftDom=$('<div class="w3-container w3-cell" style=""></div>')
    var topRightDom=$('<div class="w3-container w3-cell" style="width:320px;padding-left:0px;padding-right:0px" />')
    firstRow.append(topLeftDom,topRightDom)

    this.sampleTelemetryDiv=$('<div class="w3-border" style="margin:5px;height:100px;position:relative;overflow:auto" />')
    this.sampleTelemetryDiv.append($('<div style="padding:2px;right:0px;position:absolute;font-size:9px" class="w3-dark-gray">Telemetry Format Sample</div>'))
    topRightDom.append(this.sampleTelemetryDiv)
    this.sampleTelemetryDiv.hide()
    
    var IDLableDiv= $("<div class='w3-padding' style='display:inline;font-weight:bold;color:black'>Twin ID</div>")
    var IDInput=$('<input type="text" style="margin:8px 0;padding:2px;width:150px;outline:none;display:inline" placeholder="ID"/>').addClass("w3-input w3-border");
    this.IDInput=IDInput 
    var modelID=twinInfo["$metadata"]["$model"]
    var modelLableDiv= $("<div class='w3-padding' style='display:inline;font-weight:bold;color:black'>Model</div>")
    var modelInput=$('<div type="text" style="margin:8px 0;padding:2px;display:inline"/>').text(modelID);  
    topLeftDom.append($("<div/>").append(IDLableDiv,IDInput))
    topLeftDom.append($("<div/>").append(modelLableDiv,modelInput))
    IDInput.change((e)=>{
        this.twinInfo["$dtId"]=$(e.target).val()
    })

    var isIoTCheck= $('<input class="w3-margin w3-check" style="width:20px" type="checkbox">')
    var isIoTText = $('<label class="w3-dark-gray" style="padding:2px 8px;font-size:1.2em;border-radius: 3px;"> This is NOT a IoT Device</label>')
    this.isIoTCheck=isIoTCheck
    topLeftDom.append(isIoTCheck,isIoTText)


    var dialogDOM=$('<div />')
    this.contentDOM.append(dialogDOM)

    
    var editableProperties=modelAnalyzer.DTDLModels[modelID].editableProperties
    if($.isEmptyObject(editableProperties)){
        var titleTable=$('<div>Warning: There is no propertie in this model to map with a IoT device</div>')
    }else{
        var titleTable=$('<table style="width:100%" cellspacing="0px" cellpadding="0px"></table>')
        titleTable.append($('<tr><td style="font-weight:bold; width:220px">IoT Setting</td><td style="font-weight:bold">Parameter Tree</td></tr>'))
        titleTable.hide() 
    }

    dialogDOM.append($("<div class='w3-container'/>").append(titleTable))

    var IoTSettingDiv=$("<div class='w3-container w3-border' style='width:100%;max-height:300px;overflow:auto'></div>")
    this.IoTSettingDiv=IoTSettingDiv
    IoTSettingDiv.hide()
    dialogDOM.append(IoTSettingDiv)
    this.drawIoTSettings()

    isIoTCheck.on("change",(e)=>{
        if(isIoTCheck.prop('checked')) {
            var theHeight= IoTSettingDiv.height()
            isIoTText.removeClass("w3-dark-gray").addClass("w3-lime")
            isIoTText.text("This is a IoT Device")

            if(!this.iotDeviceInfo) this.iotDeviceInfo={}
            if(e.isTrigger){ // it is from programmaticaltrigger
                IoTSettingDiv.css("height",theHeight+10+"px")
                titleTable.show()
                IoTSettingDiv.show()    
                this.sampleTelemetryDiv.show()
            }else{
                IoTSettingDiv.css("height","0px")
                titleTable.show()
                IoTSettingDiv.show()
                IoTSettingDiv.animate({"height":theHeight+10+"px"})
                this.sampleTelemetryDiv.fadeIn()
            }
        }else {
            this.iotDeviceInfo=null;
            isIoTText.removeClass("w3-lime").addClass("w3-dark-gray")
            isIoTText.text("This is NOT a IoT Device")
            if(e.isTrigger){ // it is from programmaticaltrigger
                IoTSettingDiv.css("height","");
                IoTSettingDiv.hide();
                titleTable.hide()
                this.sampleTelemetryDiv.hide()    
            }else{
                IoTSettingDiv.animate({"height":"0px"},()=>{IoTSettingDiv.css("height","");IoTSettingDiv.hide();titleTable.hide()})
                this.sampleTelemetryDiv.fadeOut()    
            }
        }
    })

    if(this.iotDeviceInfo){
        isIoTCheck.prop( "checked", true );
        isIoTCheck.trigger("change")    
    }
}

IoTDeviceTwinDialog.prototype.saveTwin= async function(){
    //TODO: save the twin change
}

IoTDeviceTwinDialog.prototype.addNewTwin = async function(closeDialog) {
    if(!this.twinInfo["$dtId"]||this.twinInfo["$dtId"]==""){
        alert("Please fill in name for the new digital twin")
        return;
    }
    var modelID=this.twinInfo["$metadata"]["$model"]
    var componentsNameArr=modelAnalyzer.DTDLModels[modelID].includedComponents
    componentsNameArr.forEach(oneComponentName=>{ //adt service requesting all component appear by mandatory
        if(this.twinInfo[oneComponentName]==null)this.twinInfo[oneComponentName]={}
        this.twinInfo[oneComponentName]["$metadata"]= {}
    })

    //ask taskmaster to add the twin
    try{
        var postBody= {"newTwinJson":JSON.stringify(this.twinInfo)}
        if(this.iotDeviceInfo) postBody.iotDeviceInfo= JSON.stringify(this.iotDeviceInfo)
        var data = await msalHelper.callAPI("digitaltwin/upsertDigitalTwin", "POST", postBody )
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
    }

    globalCache.storeSingleDBTwin(data.DBTwin)    
    globalCache.storeSingleADTTwin(data.ADTTwin)

    //it should select the new node in the tree, and move topology view to show the new node (note not blocked by the dialog itself)
    this.broadcastMessage({ "message": "addNewTwin", twinInfo: data.ADTTwin })

    if(closeDialog)this.DOM.hide()
    else{
        //clear the input editbox
        if(this.iotDeviceInfo) this.popup(this.originalTwinInfo,{})
        else this.popup(this.originalTwinInfo)
    }
    
}

IoTDeviceTwinDialog.prototype.drawIoTSettings = async function() {
    var modelID=this.twinInfo["$metadata"]["$model"]
    var modelDetail= modelAnalyzer.DTDLModels[modelID]
    this.copyModelEditableProperty=JSON.parse(JSON.stringify(modelDetail.editableProperties))
    this.iotSettingsArr=[]
    
    var iotTable=$('<table style="width:100%" cellspacing="0px" cellpadding="0px"></table>')
    this.IoTSettingDiv.append(iotTable)

    var initialPathArr=[]
    this.allSelectMenu=[]
    this.drawEditable(iotTable,this.copyModelEditableProperty,initialPathArr,[])

    this.IoTSettingDiv.on("click",()=>{this.shrinkAllSelectMenu()})
    this.IoTSettingDiv.on("scroll",()=>{this.shrinkAllSelectMenu()})
}

IoTDeviceTwinDialog.prototype.shrinkAllSelectMenu = async function() {
    this.allSelectMenu.forEach(selectmenu=>{
        selectmenu.shrink()
    })
}

IoTDeviceTwinDialog.prototype.drawEditable = async function(parentTable,jsonInfo,pathArr,lastRootNodeRecord) {
    if(jsonInfo==null) return;
    var arr=[]
    for(var ind in jsonInfo) arr.push(ind)

    for(var theIndex=0;theIndex<arr.length;theIndex++){
        if(theIndex==arr.length-1) lastRootNodeRecord[pathArr.length] =true;
        
        var ind = arr[theIndex]
        var tr=$("<tr/>")
        var leftTD=$("<td style='width:220px'/>")
        var rightTD=$("<td style='height:30px'/>")
        tr.append(leftTD,rightTD)
        parentTable.append(tr)
        
        
        for(var i=0;i<pathArr.length;i++){
            if(!lastRootNodeRecord[i]) rightTD.append(this.treeLineDiv(2))
            else rightTD.append(this.treeLineDiv(4))
        }

        if(theIndex==arr.length-1) rightTD.append(this.treeLineDiv(3))
        else rightTD.append(this.treeLineDiv(1))

        var pNameDiv=$("<div style='display:inline;line-height:28px;margin-left:3px'>"+ind+"</div>")
        rightTD.append(pNameDiv)
        var newPath=pathArr.concat([ind])

        if(Array.isArray(jsonInfo[ind])){ //it is a enumerator
            var typeDOM=$("<label class='w3-dark-gray' style='font-size:9px;padding:2px;margin-left:5px'>enum</label>")
            rightTD.append(typeDOM)
            var valueArr=[]
            jsonInfo[ind].forEach(ele=>{valueArr.push(ele.enumValue)})
            var label1=$("<label class='w3-dark-gray' style='font-size:9px;padding:2px;margin-left:2px'>"+valueArr.join()+"</label>")
            rightTD.append(label1)
            var IoTsettingObj={"type":"","path":newPath,"ptype":"enumerator"}
            this.iotSettingsArr.push(IoTsettingObj)
            this.drawIoTSelectDropdown(leftTD,IoTsettingObj,pNameDiv)
        }else if(typeof(jsonInfo[ind])==="object") {
            this.drawEditable(parentTable,jsonInfo[ind],newPath,lastRootNodeRecord)
        }else {
            var IoTsettingObj={"type":"","path":newPath,"ptype":jsonInfo[ind]}
            this.iotSettingsArr.push(IoTsettingObj)
            this.drawIoTSelectDropdown(leftTD,IoTsettingObj,pNameDiv)
            var typeDOM=$("<label class='w3-dark-gray' style='font-size:9px;padding:2px;margin-left:5px'>"+jsonInfo[ind]+"</label>")
            rightTD.append(typeDOM)
        } 
    }
}

IoTDeviceTwinDialog.prototype.drawIoTSelectDropdown=function(td,IoTsettingObj,pNameDiv){
    var aSelectMenu = new simpleSelectMenu(""
        , {
            "isClickable": true, "withBorder": true
            , buttonCSS: { "padding": "4px 16px", width: "210px" }
            ,"optionListMarginTop":80,"optionListMarginLeft":210
            ,"adjustPositionAnchor":this.DOM.offset()
        }
    )
    aSelectMenu.callBack_beforeClickExpand=()=>{
        this.shrinkAllSelectMenu()
    }
    this.allSelectMenu.push(aSelectMenu)
    td.append(aSelectMenu.rowDOM)
    aSelectMenu.addOption("NOT IoT Device parameter","NONE")
    aSelectMenu.addOption("IoT Device Telemetry","telemetry","w3-lime")
    aSelectMenu.addOption("IoT Device Desired Property","desired","w3-amber")
    aSelectMenu.addOption("IoT Device Report Property","report","w3-blue")

    aSelectMenu.callBack_clickOption=(optionText,optionValue,realMouseClick,colorClass)=>{
        IoTsettingObj["type"]=optionValue
        aSelectMenu.changeName(optionText)
        if(colorClass){
            aSelectMenu.button.attr('class', 'w3-button w3-border '+colorClass);
            pNameDiv.attr('class', colorClass);
        } else{
            aSelectMenu.button.attr('class', 'w3-button w3-border')   
            pNameDiv.attr('class', '');
        }
        if(realMouseClick) this.refreshIoTTelemetrySample()
    }
    aSelectMenu.triggerOptionIndex(0)
}

IoTDeviceTwinDialog.prototype.refreshIoTTelemetrySample = function(){
    var sampleObj={}
    
    this.iotSettingsArr.forEach(onep=>{
        if(onep.type!="telemetry") return;
        var pathArr=onep.path
        var ptype=onep.ptype
        
        var theRoot=sampleObj
        for(var i=0;i<pathArr.length;i++){
            var str=pathArr[i]
            if(i==pathArr.length-1) {
                //["Enum","Object","boolean","date","dateTime","double","duration","float","integer","long","string","time"]
                var valueSample
                if(ptype=="enumerator" || ptype=="string") valueSample="stringValue"
                else if(ptype=="boolean") valueSample = true
                else if(ptype=="dateTime")  valueSample = new Date().toISOString()
                else if(ptype=="date")  valueSample = (new Date().toISOString()).split("T")[0]
                else if(ptype=="double" || ptype=="float")  valueSample =1.1
                else if(ptype=="duration") valueSample="PT16H30M"
                else if(ptype=="integer" || ptype=="long") valueSample=1
                else if(ptype=="time") valueSample ="T"+((new Date().toISOString()).split("T")[1])
                else valueSample="Unknown"
                theRoot[str]=valueSample
            }else{
                if(!theRoot[str])theRoot[str]={}
                theRoot=theRoot[str]
            }
        }
    })

    var label=this.sampleTelemetryDiv.find(':first-child');
    var script= $('<pre style="color:gray;margin:0px">'+JSON.stringify(sampleObj,null,2)+'</pre>')
    this.sampleTelemetryDiv.empty().append(label,script)
}

IoTDeviceTwinDialog.prototype.treeLineDiv = function(typeNumber) {
    var reDiv=$('<div style="margin-left:10px;width:15px;height: 100%;float: left"></div>')
    if(typeNumber==1){
        reDiv.append($('<div class="w3-border-bottom w3-border-left" style="width:100%;height:50%;"></div><div class="w3-border-left" style="width:100%;height:50%;"></div>'))
    }else if(typeNumber==2){
        reDiv.append($('<div class="w3-border-left" style="width:100%;height:50%;"></div><div class="w3-border-left" style="width:100%;height:50%;"></div>'))
    }else if(typeNumber==3){
        reDiv.append($('<div class="w3-border-bottom w3-border-left" style="width:100%;height:50%;">'))
    }else if(typeNumber==4){
        
    }
    return reDiv
}

module.exports = new IoTDeviceTwinDialog();
},{"../msalHelper":9,"./globalCache":11,"./modelAnalyzer":12,"./simpleSelectMenu":17}],11:[function(require,module,exports){
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
},{"../msalHelper":9,"./modelAnalyzer":12}],12:[function(require,module,exports){
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
},{}],13:[function(require,module,exports){
const modelAnalyzer=require("./modelAnalyzer")
const simpleSelectMenu= require("./simpleSelectMenu")
const msalHelper=require("../msalHelper")
const globalCache = require("./globalCache")

function modelEditorDialog() {
    if(!this.DOM){
        this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:100" class="w3-card-2"></div>')
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

    importButton.on("click", async () => {
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
},{"../msalHelper":9,"./globalCache":11,"./modelAnalyzer":12,"./simpleSelectMenu":17}],14:[function(require,module,exports){
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
    var colorArr=["darkGray","Black","LightGray","Red","Green","Blue","Bisque","Brown","Coral","Crimson","DodgerBlue","Gold"]
    colorArr.forEach((oneColorCode)=>{
        var anOption=$("<option value='"+oneColorCode+"'>"+oneColorCode+"▧</option>")
        colorSelector.append(anOption)
        anOption.css("color",oneColorCode)
    })
    if(definedColor!=null) {
        colorSelector.val(definedColor)
        colorSelector.css("color",definedColor)
    }else{
        colorSelector.css("color","darkGray")
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
        var label=$("<label class='w3-lime' style='display:inline;font-size:9px;padding:2px'></label>")
        label.text("Relationship")
        parentDom.append(label)
        if(validRelationships[ind].target){
            var label1=$("<label class='w3-lime' style='display:inline;font-size:9px;padding:2px;margin-left:2px'></label>")
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
            var contentDOM=$("<label class='w3-dark-gray' ></label>")
            contentDOM.text("enum")
            contentDOM.css({"fontSize":"9px","padding":'2px'})
            keyDiv.append(contentDOM)

            var valueArr=[]
            jsonInfo[ind].forEach(ele=>{valueArr.push(ele.enumValue)})
            var label1=$("<label class='w3-dark-gray' ></label>")
            label1.css({"fontSize":"9px","padding":'2px',"margin-left":"2px"})
            label1.text(valueArr.join())
            keyDiv.append(label1)
        }else if(typeof(jsonInfo[ind])==="object") {
            var contentDOM=$("<label></label>")
            contentDOM.css("display","block")
            contentDOM.css("padding-left","1em")
            this.fillEditableProperties(jsonInfo[ind],contentDOM)
            keyDiv.append(contentDOM)
        }else {
            var contentDOM=$("<label class='w3-dark-gray' ></label>")
            contentDOM.text(jsonInfo[ind])
            contentDOM.css({"fontSize":"9px","padding":'2px'})
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
            var colorCode = "darkGray"
            var shape = "ellipse"
            var avarta = null
            var dimension=20;
            if (globalCache.visualDefinition["default"][modelClass]) {
                var visualJson = globalCache.visualDefinition["default"][modelClass]
                var colorCode = visualJson.color || "darkGray"
                var shape = visualJson.shape || "ellipse"
                var avarta = visualJson.avarta
                if(visualJson.dimensionRatio) dimension*=parseFloat(visualJson.dimensionRatio)
            }

            var iconDOM=$("<div style='width:"+dimension+"px;height:"+dimension+"px;float:left;position:relative'></div>")
            var imgSrc=encodeURIComponent(this.shapeSvg(shape,colorCode))
            iconDOM.append($("<img src='data:image/svg+xml;utf8,"+imgSrc+"'></img>"))
            if(avarta){
                var avartaimg=$("<img style='position:absolute;left:0px;width:60%;margin:20%' src='"+avarta+"'></img>")
                iconDOM.append(avartaimg)
            }
            return iconDOM
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

modelManagerDialog.prototype.shapeSvg=function(shape,color){
    if(shape=="ellipse"){
        return '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" version="1.1" ><circle cx="50" cy="50" r="50"  fill="'+color+'"/></svg>'
    }else if(shape=="hexagon"){
        return '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" version="1.1" ><polygon points="50 0, 93.3 25, 93.3 75, 50 100, 6.7 75, 6.7 25"  fill="'+color+'" /></svg>'
    }else if(shape=="round-rectangle"){
        return '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" version="1.1" ><rect x="10" y="10" rx="10" ry="10" width="80" height="80" fill="'+color+'" /></svg>'
    }
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
},{"../msalHelper":9,"./globalCache":11,"./modelAnalyzer":12,"./modelEditorDialog":13,"./simpleConfirmDialog":16,"./simpleTree":18}],15:[function(require,module,exports){
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
},{}],16:[function(require,module,exports){
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
},{}],17:[function(require,module,exports){
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


    //it seems that the select menu only can show outside of a parent scrollable dom when it is inside a w3-bar item... not very sure about why 
    var rowDOM=$('<div class="w3-bar"></div>')
    this.rowDOM=rowDOM
    this.rowDOM.append(this.DOM)
    
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
            else{
                this.callBack_beforeClickExpand()
                this.optionContentDOM.addClass("w3-show")
            } 
            return false;
        })    
    }
}

simpleSelectMenu.prototype.shrink=function(){
    if(this.optionContentDOM.hasClass("w3-show"))  this.optionContentDOM.removeClass("w3-show")
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

simpleSelectMenu.prototype.addOption=function(optionText,optionValue,colorClass){
    var optionItem=$('<a href="#" class="w3-bar-item w3-button">'+optionText+'</a>')
    if(colorClass) optionItem.addClass(colorClass)
    this.optionContentDOM.append(optionItem)
    optionItem.data("optionValue",optionValue||optionText)
    optionItem.data("optionColorClass",colorClass)
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
        this.callBack_clickOption(optionText,optionItem.data("optionValue"),"realMouseClick",colorClass)
        return false
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
    this.callBack_clickOption(theOption.text(),theOption.data("optionValue"),null,theOption.data("optionColorClass"))
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

simpleSelectMenu.prototype.callBack_beforeClickExpand=function(optiontext,optionValue,realMouseClick){
}


module.exports = simpleSelectMenu;
},{}],18:[function(require,module,exports){
'use strict';

function simpleTree(DOM,options){
    this.DOM=DOM
    this.groupNodes=[] //each group header is one node
    this.selectedNodes=[];
    this.options=options || {}

    this.lastClickedNode=null;
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
    this.lastClickedNode=null
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

simpleTree.prototype.getAllLeafNodeArr=function(){
    var allLeaf=[]
    this.groupNodes.forEach(gn=>{
        allLeaf=allLeaf.concat(gn.childLeafNodes)
    })
    return allLeaf;
}


simpleTree.prototype.addLeafnodeToGroup=function(groupName,obj,skipRepeat){
    var aGroupNode=this.findGroupNode(groupName)
    if(aGroupNode == null) return;
    aGroupNode.addNode(obj,skipRepeat)
}

simpleTree.prototype.removeAllNodes=function(){
    this.lastClickedNode=null
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
    this.lastClickedNode=null
    gnode.deleteSelf()
}

simpleTree.prototype.deleteLeafNode=function(nodeName){
    this.lastClickedNode=null
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
    var newArr=[].concat(this.selectedNodes)
    newArr.push(leafNode)
    this.selectLeafNodeArr(newArr)
}

simpleTree.prototype.addNodeArrayToSelection=function(arr){
    var newArr = this.selectedNodes
    var filterArr=arr.filter((item) => newArr.indexOf(item) < 0)
    newArr = newArr.concat(filterArr)
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
    var nameDiv=$("<div style='display:inline;padding-left:5px;padding-right:3px;vertical-align:middle'></div>")
    nameDiv.text(this.name)
    
    if(this.childLeafNodes.length>0) lblColor="w3-lime"
    else var lblColor="w3-gray" 
    this.headerDOM.css("font-weight","bold")

    
    if(this.parentTree.options.groupNodeIconFunc){
        var iconLabel=this.parentTree.options.groupNodeIconFunc(this)
        this.headerDOM.append(iconLabel)
        var rowHeight=iconLabel.height()
        nameDiv.css("line-height",rowHeight+"px")
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
    this.listDOM=$('<div class="w3-container w3-hide w3-border w3-padding-16"></div>')

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

simpleTreeLeafNode.prototype.clickSelf=function(mouseClickDetail){
    this.parentGroupNode.parentTree.lastClickedNode=this;
    this.parentGroupNode.parentTree.selectLeafNode(this,mouseClickDetail)
}

simpleTreeLeafNode.prototype.createLeafNodeDOM=function(){
    this.DOM=$('<button class="w3-button w3-white" style="display:block;text-align:left;width:98%"></button>')
    this.redrawLabel()


    var clickF=(e)=>{
        this.highlight();
        var clickDetail=e.detail
        if (e.ctrlKey) {
            if(this.parentGroupNode.parentTree.options.noMultipleSelectAllowed){
                this.clickSelf()
                return;
            }
            this.parentGroupNode.parentTree.appendLeafNodeToSelection(this)
            this.parentGroupNode.parentTree.lastClickedNode=this;
        }else if(e.shiftKey){
            if(this.parentGroupNode.parentTree.options.noMultipleSelectAllowed){
                this.clickSelf()
                return;
            }
            if(this.parentGroupNode.parentTree.lastClickedNode==null){
                this.clickSelf()
            }else{
                var allLeafNodeArr=this.parentGroupNode.parentTree.getAllLeafNodeArr()
                var index1 = allLeafNodeArr.indexOf(this.parentGroupNode.parentTree.lastClickedNode)
                var index2 = allLeafNodeArr.indexOf(this)
                if(index1==-1 || index2==-1){
                    this.clickSelf()
                }else{
                    //select all leaf between
                    var lowerI= Math.min(index1,index2)
                    var higherI= Math.max(index1,index2)
                    
                    var middleArr=allLeafNodeArr.slice(lowerI,higherI)                  
                    middleArr.push(allLeafNodeArr[higherI])
                    this.parentGroupNode.parentTree.addNodeArrayToSelection(middleArr)
                }
            }
        }else{
            this.clickSelf(clickDetail)
        }
    }
    this.DOM.on("click",(e)=>{clickF(e)})

    this.DOM.on("dblclick",(e)=>{
        this.parentGroupNode.parentTree.dblClickNode(this)
    })
}

simpleTreeLeafNode.prototype.redrawLabel=function(){
    this.DOM.empty()

    var nameDiv=$("<div style='display:inline;padding-left:5px;padding-right:3px;vertical-align:middle'></div>")
    nameDiv.text(this.name)

    if(this.parentGroupNode.parentTree.options.leafNodeIconFunc){
        var iconLabel=this.parentGroupNode.parentTree.options.leafNodeIconFunc(this)
        this.DOM.append(iconLabel)
        var rowHeight=iconLabel.height()
        nameDiv.css("line-height",rowHeight+"px")
    }
    
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9zcGFTb3VyY2VDb2RlL2RpZ2l0YWx0d2lubW9kdWxlL2RpZ2l0YWx0d2lubW9kdWxlVUkuanMiLCIuLi9zcGFTb3VyY2VDb2RlL2RpZ2l0YWx0d2lubW9kdWxlL2VkaXRMYXlvdXREaWFsb2cuanMiLCIuLi9zcGFTb3VyY2VDb2RlL2RpZ2l0YWx0d2lubW9kdWxlL2luZm9QYW5lbC5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvZGlnaXRhbHR3aW5tb2R1bGUvbWFpblRvb2xiYXIuanMiLCIuLi9zcGFTb3VyY2VDb2RlL2RpZ2l0YWx0d2lubW9kdWxlL3N0YXJ0U2VsZWN0aW9uRGlhbG9nLmpzIiwiLi4vc3BhU291cmNlQ29kZS9kaWdpdGFsdHdpbm1vZHVsZS90b3BvbG9neURPTS5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvZGlnaXRhbHR3aW5tb2R1bGUvdHdpbnNUcmVlLmpzIiwiLi4vc3BhU291cmNlQ29kZS9nbG9iYWxBcHBTZXR0aW5ncy5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvbXNhbEhlbHBlci5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvc2hhcmVkU291cmNlRmlsZXMvSW9URGV2aWNlVHdpbkRpYWxvZy5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvc2hhcmVkU291cmNlRmlsZXMvZ2xvYmFsQ2FjaGUuanMiLCIuLi9zcGFTb3VyY2VDb2RlL3NoYXJlZFNvdXJjZUZpbGVzL21vZGVsQW5hbHl6ZXIuanMiLCIuLi9zcGFTb3VyY2VDb2RlL3NoYXJlZFNvdXJjZUZpbGVzL21vZGVsRWRpdG9yRGlhbG9nLmpzIiwiLi4vc3BhU291cmNlQ29kZS9zaGFyZWRTb3VyY2VGaWxlcy9tb2RlbE1hbmFnZXJEaWFsb2cuanMiLCIuLi9zcGFTb3VyY2VDb2RlL3NoYXJlZFNvdXJjZUZpbGVzL21vZHVsZVN3aXRjaERpYWxvZy5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvc2hhcmVkU291cmNlRmlsZXMvc2ltcGxlQ29uZmlybURpYWxvZy5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvc2hhcmVkU291cmNlRmlsZXMvc2ltcGxlU2VsZWN0TWVudS5qcyIsIi4uL3NwYVNvdXJjZUNvZGUvc2hhcmVkU291cmNlRmlsZXMvc2ltcGxlVHJlZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoOEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDalBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaG1CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIndXNlIHN0cmljdCc7XHJcbmNvbnN0IHRvcG9sb2d5RE9NPXJlcXVpcmUoXCIuL3RvcG9sb2d5RE9NLmpzXCIpXHJcbmNvbnN0IHR3aW5zVHJlZT1yZXF1aXJlKFwiLi90d2luc1RyZWVcIilcclxuY29uc3Qgc3RhcnRTZWxlY3Rpb25EaWFsb2cgPSByZXF1aXJlKFwiLi9zdGFydFNlbGVjdGlvbkRpYWxvZ1wiKVxyXG5jb25zdCBtb2RlbE1hbmFnZXJEaWFsb2cgPSByZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvbW9kZWxNYW5hZ2VyRGlhbG9nXCIpXHJcbmNvbnN0IG1vZGVsRWRpdG9yRGlhbG9nID0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL21vZGVsRWRpdG9yRGlhbG9nXCIpXHJcbmNvbnN0IGVkaXRMYXlvdXREaWFsb2cgPSByZXF1aXJlKFwiLi9lZGl0TGF5b3V0RGlhbG9nXCIpXHJcbmNvbnN0IG1haW5Ub29sYmFyID0gcmVxdWlyZShcIi4vbWFpblRvb2xiYXJcIilcclxuY29uc3QgaW5mb1BhbmVsPSByZXF1aXJlKFwiLi9pbmZvUGFuZWxcIik7XHJcbmNvbnN0IGdsb2JhbEFwcFNldHRpbmdzID0gcmVxdWlyZShcIi4uL2dsb2JhbEFwcFNldHRpbmdzLmpzXCIpO1xyXG5jb25zdCBtc2FsSGVscGVyPXJlcXVpcmUoXCIuLi9tc2FsSGVscGVyXCIpXHJcbmNvbnN0IGdsb2JhbENhY2hlPXJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9nbG9iYWxDYWNoZVwiKVxyXG5jb25zdCBJb1REZXZpY2VUd2luRGlhbG9nPXJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9Jb1REZXZpY2VUd2luRGlhbG9nXCIpO1xyXG5cclxuZnVuY3Rpb24gZGlnaXRhbHR3aW5tb2R1bGVVSSgpIHtcclxuICAgIHRoaXMuaW5pdFVJTGF5b3V0KClcclxuXHJcbiAgICB0aGlzLnR3aW5zVHJlZT0gbmV3IHR3aW5zVHJlZSgkKFwiI3RyZWVIb2xkZXJcIiksJChcIiN0cmVlU2VhcmNoXCIpKVxyXG4gICAgXHJcbiAgICBtYWluVG9vbGJhci5yZW5kZXIoKVxyXG4gICAgdGhpcy50b3BvbG9neUluc3RhbmNlPW5ldyB0b3BvbG9neURPTSgkKCcjY2FudmFzJykpXHJcbiAgICB0aGlzLnRvcG9sb2d5SW5zdGFuY2UuaW5pdCgpXHJcblxyXG4gICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKCkgLy9pbml0aWFsaXplIGFsbCB1aSBjb21wb25lbnRzIHRvIGhhdmUgdGhlIGJyb2FkY2FzdCBjYXBhYmlsaXR5XHJcblxyXG4gICAgLy90cnkgaWYgaXQgYWxyZWFkeSBCMkMgc2lnbmVkIGluLCBpZiBub3QgZ29pbmcgYmFjayB0byB0aGUgc3RhcnQgcGFnZVxyXG4gICAgdGhpcy5teU1TQUxPYmogPSBuZXcgbXNhbC5QdWJsaWNDbGllbnRBcHBsaWNhdGlvbihnbG9iYWxBcHBTZXR0aW5ncy5tc2FsQ29uZmlnKTtcclxuXHJcblxyXG4gICAgdmFyIHRoZUFjY291bnQ9bXNhbEhlbHBlci5mZXRjaEFjY291bnQoKTtcclxuICAgIGlmKHRoZUFjY291bnQ9PW51bGwgJiYgIWdsb2JhbEFwcFNldHRpbmdzLmlzTG9jYWxUZXN0KSB3aW5kb3cub3BlbihnbG9iYWxBcHBTZXR0aW5ncy5sb2dvdXRSZWRpcmVjdFVyaSxcIl9zZWxmXCIpXHJcblxyXG4gICAgZ2xvYmFsQ2FjaGUubG9hZFVzZXJEYXRhKCkudGhlbihyZT0+e1xyXG4gICAgICAgIGlmKGdsb2JhbENhY2hlLkRCTW9kZWxzQXJyLmxlbmd0aD09MCl7XHJcbiAgICAgICAgICAgIC8vZGlyZWN0bHkgcG9wdXAgdG8gbW9kZWwgbWFuYWdlbWVudCBkaWFsb2cgYWxsb3cgdXNlciBpbXBvcnQgb3IgY3JlYXRlIG1vZGVsXHJcbiAgICAgICAgICAgIG1vZGVsTWFuYWdlckRpYWxvZy5wb3B1cCgpXHJcbiAgICAgICAgICAgIC8vcG9wIHVwIHdlbGNvbWUgc2NyZWVuXHJcbiAgICAgICAgICAgIHZhciBwb3BXaW49JCgnPGRpdiBjbGFzcz1cInczLWJsdWUgdzMtY2FyZC00IHczLXBhZGRpbmctbGFyZ2VcIiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7YmFja2dyb3VuZC1jb2xvcjp3aGl0ZTtsZWZ0OjUwJTt0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSkgdHJhbnNsYXRlWSgtNTAlKTt6LWluZGV4OjEwNTt3aWR0aDo0MDBweDtjdXJzb3I6ZGVmYXVsdFwiPjwvZGl2PicpXHJcbiAgICAgICAgICAgIHBvcFdpbi5odG1sKGBXZWxjb21lLCAke21zYWxIZWxwZXIudXNlck5hbWV9ISBGaXJzdGx5LCB5b3UgbWF5IGNvbnNpZGVyIGltcG9ydGluZyBhIGZldyB0d2luIG1vZGVsIGZpbGVzIG9yIGNyZWF0aW5nIHR3aW4gbW9kZWxzIGZyb20gc2NyYXRjaC4gPGJyLz48YnIvPkNsaWNrIHRvIGNvbnRpbnVlLi4uYClcclxuICAgICAgICAgICAgJChcImJvZHlcIikuYXBwZW5kKHBvcFdpbilcclxuICAgICAgICAgICAgcG9wV2luLm9uKFwiY2xpY2tcIiwoKT0+e3BvcFdpbi5yZW1vdmUoKX0pXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHN0YXJ0U2VsZWN0aW9uRGlhbG9nLnBvcHVwKClcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHRoaXMseyBcIm1lc3NhZ2VcIjogXCJ2aXN1YWxEZWZpbml0aW9uUmVmcmVzaFwifSlcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UodGhpcyx7IFwibWVzc2FnZVwiOiBcImxheW91dHNVcGRhdGVkXCJ9KVxyXG4gICAgfSlcclxufVxyXG5cclxuZGlnaXRhbHR3aW5tb2R1bGVVSS5wcm90b3R5cGUuYnJvYWRjYXN0TWVzc2FnZT1mdW5jdGlvbihzb3VyY2UsbXNnUGF5bG9hZCl7XHJcbiAgICB2YXIgY29tcG9uZW50c0Fycj1bdGhpcy50d2luc1RyZWUsc3RhcnRTZWxlY3Rpb25EaWFsb2csbW9kZWxNYW5hZ2VyRGlhbG9nLG1vZGVsRWRpdG9yRGlhbG9nLGVkaXRMYXlvdXREaWFsb2csXHJcbiAgICAgICAgIG1haW5Ub29sYmFyLHRoaXMudG9wb2xvZ3lJbnN0YW5jZSxpbmZvUGFuZWwsSW9URGV2aWNlVHdpbkRpYWxvZ11cclxuXHJcbiAgICBpZihzb3VyY2U9PW51bGwpe1xyXG4gICAgICAgIGZvcih2YXIgaT0wO2k8Y29tcG9uZW50c0Fyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgdmFyIHRoZUNvbXBvbmVudD1jb21wb25lbnRzQXJyW2ldXHJcbiAgICAgICAgICAgIHRoaXMuYXNzaWduQnJvYWRjYXN0TWVzc2FnZSh0aGVDb21wb25lbnQpXHJcbiAgICAgICAgfVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgZm9yKHZhciBpPTA7aTxjb21wb25lbnRzQXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICB2YXIgdGhlQ29tcG9uZW50PWNvbXBvbmVudHNBcnJbaV1cclxuICAgICAgICAgICAgaWYodGhlQ29tcG9uZW50LnJ4TWVzc2FnZSAmJiB0aGVDb21wb25lbnQhPXNvdXJjZSkgdGhlQ29tcG9uZW50LnJ4TWVzc2FnZShtc2dQYXlsb2FkKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZGlnaXRhbHR3aW5tb2R1bGVVSS5wcm90b3R5cGUuYXNzaWduQnJvYWRjYXN0TWVzc2FnZT1mdW5jdGlvbih1aUNvbXBvbmVudCl7XHJcbiAgICB1aUNvbXBvbmVudC5icm9hZGNhc3RNZXNzYWdlPShtc2dPYmopPT57dGhpcy5icm9hZGNhc3RNZXNzYWdlKHVpQ29tcG9uZW50LG1zZ09iail9XHJcbn1cclxuXHJcbmRpZ2l0YWx0d2lubW9kdWxlVUkucHJvdG90eXBlLmluaXRVSUxheW91dCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBteUxheW91dCA9ICQoJ2JvZHknKS5sYXlvdXQoe1xyXG4gICAgICAgIC8vXHRyZWZlcmVuY2Ugb25seSAtIHRoZXNlIG9wdGlvbnMgYXJlIE5PVCByZXF1aXJlZCBiZWNhdXNlICd0cnVlJyBpcyB0aGUgZGVmYXVsdFxyXG4gICAgICAgIGNsb3NhYmxlOiB0cnVlXHQvLyBwYW5lIGNhbiBvcGVuICYgY2xvc2VcclxuICAgICAgICAsIHJlc2l6YWJsZTogdHJ1ZVx0Ly8gd2hlbiBvcGVuLCBwYW5lIGNhbiBiZSByZXNpemVkIFxyXG4gICAgICAgICwgc2xpZGFibGU6IHRydWVcdC8vIHdoZW4gY2xvc2VkLCBwYW5lIGNhbiAnc2xpZGUnIG9wZW4gb3ZlciBvdGhlciBwYW5lcyAtIGNsb3NlcyBvbiBtb3VzZS1vdXRcclxuICAgICAgICAsIGxpdmVQYW5lUmVzaXppbmc6IHRydWVcclxuXHJcbiAgICAgICAgLy9cdHNvbWUgcmVzaXppbmcvdG9nZ2xpbmcgc2V0dGluZ3NcclxuICAgICAgICAsIG5vcnRoX19zbGlkYWJsZTogZmFsc2VcdC8vIE9WRVJSSURFIHRoZSBwYW5lLWRlZmF1bHQgb2YgJ3NsaWRhYmxlPXRydWUnXHJcbiAgICAgICAgLy8sIG5vcnRoX190b2dnbGVyTGVuZ3RoX2Nsb3NlZDogJzEwMCUnXHQvLyB0b2dnbGUtYnV0dG9uIGlzIGZ1bGwtd2lkdGggb2YgcmVzaXplci1iYXJcclxuICAgICAgICAsIG5vcnRoX19zcGFjaW5nX2Nsb3NlZDogNlx0XHQvLyBiaWcgcmVzaXplci1iYXIgd2hlbiBvcGVuICh6ZXJvIGhlaWdodClcclxuICAgICAgICAsIG5vcnRoX19zcGFjaW5nX29wZW46MFxyXG4gICAgICAgICwgbm9ydGhfX3Jlc2l6YWJsZTogZmFsc2VcdC8vIE9WRVJSSURFIHRoZSBwYW5lLWRlZmF1bHQgb2YgJ3Jlc2l6YWJsZT10cnVlJ1xyXG4gICAgICAgICwgbm9ydGhfX2Nsb3NhYmxlOiBmYWxzZVxyXG4gICAgICAgICwgd2VzdF9fY2xvc2FibGU6IGZhbHNlXHJcbiAgICAgICAgLCBlYXN0X19jbG9zYWJsZTogZmFsc2VcclxuICAgICAgICBcclxuXHJcbiAgICAgICAgLy9cdHNvbWUgcGFuZS1zaXplIHNldHRpbmdzXHJcbiAgICAgICAgLCB3ZXN0X19taW5TaXplOiAxMDBcclxuICAgICAgICAsIGVhc3RfX3NpemU6IDMwMFxyXG4gICAgICAgICwgZWFzdF9fbWluU2l6ZTogMjAwXHJcbiAgICAgICAgLCBlYXN0X19tYXhTaXplOiAuNSAvLyA1MCUgb2YgbGF5b3V0IHdpZHRoXHJcbiAgICAgICAgLCBjZW50ZXJfX21pbldpZHRoOiAxMDBcclxuICAgICAgICAsZWFzdF9fY2xvc2FibGU6IGZhbHNlXHJcbiAgICAgICAgLHdlc3RfX2Nsb3NhYmxlOiBmYWxzZVxyXG4gICAgICAgICxlYXN0X19pbml0Q2xvc2VkOlx0dHJ1ZVxyXG4gICAgfSk7XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKlx0RElTQUJMRSBURVhULVNFTEVDVElPTiBXSEVOIERSQUdHSU5HIChvciBldmVuIF90cnlpbmdfIHRvIGRyYWchKVxyXG4gICAgICpcdHRoaXMgZnVuY3Rpb25hbGl0eSB3aWxsIGJlIGluY2x1ZGVkIGluIFJDMzAuODBcclxuICAgICAqL1xyXG4gICAgJC5sYXlvdXQuZGlzYWJsZVRleHRTZWxlY3Rpb24gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICRkID0gJChkb2N1bWVudClcclxuICAgICAgICAgICAgLCBzID0gJ3RleHRTZWxlY3Rpb25EaXNhYmxlZCdcclxuICAgICAgICAgICAgLCB4ID0gJ3RleHRTZWxlY3Rpb25Jbml0aWFsaXplZCdcclxuICAgICAgICAgICAgO1xyXG4gICAgICAgIGlmICgkLmZuLmRpc2FibGVTZWxlY3Rpb24pIHtcclxuICAgICAgICAgICAgaWYgKCEkZC5kYXRhKHgpKSAvLyBkb2N1bWVudCBoYXNuJ3QgYmVlbiBpbml0aWFsaXplZCB5ZXRcclxuICAgICAgICAgICAgICAgICRkLm9uKCdtb3VzZXVwJywgJC5sYXlvdXQuZW5hYmxlVGV4dFNlbGVjdGlvbikuZGF0YSh4LCB0cnVlKTtcclxuICAgICAgICAgICAgaWYgKCEkZC5kYXRhKHMpKVxyXG4gICAgICAgICAgICAgICAgJGQuZGlzYWJsZVNlbGVjdGlvbigpLmRhdGEocywgdHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vY29uc29sZS5sb2coJyQubGF5b3V0LmRpc2FibGVUZXh0U2VsZWN0aW9uJyk7XHJcbiAgICB9O1xyXG4gICAgJC5sYXlvdXQuZW5hYmxlVGV4dFNlbGVjdGlvbiA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJGQgPSAkKGRvY3VtZW50KVxyXG4gICAgICAgICAgICAsIHMgPSAndGV4dFNlbGVjdGlvbkRpc2FibGVkJztcclxuICAgICAgICBpZiAoJC5mbi5lbmFibGVTZWxlY3Rpb24gJiYgJGQuZGF0YShzKSlcclxuICAgICAgICAgICAgJGQuZW5hYmxlU2VsZWN0aW9uKCkuZGF0YShzLCBmYWxzZSk7XHJcbiAgICAgICAgLy9jb25zb2xlLmxvZygnJC5sYXlvdXQuZW5hYmxlVGV4dFNlbGVjdGlvbicpO1xyXG4gICAgfTtcclxuICAgICQoXCIudWktbGF5b3V0LXJlc2l6ZXItbm9ydGhcIikuaGlkZSgpXHJcbiAgICAkKFwiLnVpLWxheW91dC13ZXN0XCIpLmNzcyhcImJvcmRlci1yaWdodFwiLFwic29saWQgMXB4IGxpZ2h0R3JheVwiKVxyXG4gICAgJChcIi51aS1sYXlvdXQtd2VzdFwiKS5hZGRDbGFzcyhcInczLWNhcmRcIilcclxufVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IGRpZ2l0YWx0d2lubW9kdWxlVUkoKTsiLCJjb25zdCBzaW1wbGVTZWxlY3RNZW51PSByZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvc2ltcGxlU2VsZWN0TWVudVwiKVxyXG5jb25zdCBzaW1wbGVDb25maXJtRGlhbG9nID0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL3NpbXBsZUNvbmZpcm1EaWFsb2dcIilcclxuY29uc3QgZ2xvYmFsQ2FjaGU9cmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL2dsb2JhbENhY2hlXCIpXHJcbmNvbnN0IG1zYWxIZWxwZXI9cmVxdWlyZShcIi4uL21zYWxIZWxwZXJcIilcclxuXHJcbmZ1bmN0aW9uIGVkaXRMYXlvdXREaWFsb2coKSB7XHJcbiAgICBpZighdGhpcy5ET00pe1xyXG4gICAgICAgIHRoaXMuRE9NID0gJCgnPGRpdiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7YmFja2dyb3VuZC1jb2xvcjp3aGl0ZTtsZWZ0OjUwJTt0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSkgdHJhbnNsYXRlWSgtNTAlKTt6LWluZGV4OjEwMVwiIGNsYXNzPVwidzMtY2FyZC0yXCI+PC9kaXY+JylcclxuICAgICAgICAkKFwiYm9keVwiKS5hcHBlbmQodGhpcy5ET00pXHJcbiAgICAgICAgdGhpcy5ET00uaGlkZSgpXHJcbiAgICB9XHJcbn1cclxuXHJcbmVkaXRMYXlvdXREaWFsb2cucHJvdG90eXBlLnJlZmlsbE9wdGlvbnMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmNsZWFyT3B0aW9ucygpXHJcbiAgICBcclxuICAgIGZvcih2YXIgaW5kIGluIGdsb2JhbENhY2hlLmxheW91dEpTT04pe1xyXG4gICAgICAgIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuYWRkT3B0aW9uKGluZClcclxuICAgIH1cclxufVxyXG5cclxuZWRpdExheW91dERpYWxvZy5wcm90b3R5cGUucG9wdXAgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLkRPTS5zaG93KClcclxuICAgIHRoaXMuRE9NLmVtcHR5KClcclxuXHJcbiAgICB0aGlzLkRPTS5jc3Moe1wid2lkdGhcIjpcIjMyMHB4XCIsXCJwYWRkaW5nLWJvdHRvbVwiOlwiM3B4XCJ9KVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6NDBweDttYXJnaW4tYm90dG9tOjJweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiZm9udC1zaXplOjEuMmVtXCI+TGF5b3V0PC9kaXY+PC9kaXY+JykpXHJcbiAgICB2YXIgY2xvc2VCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJpZ2h0XCIgc3R5bGU9XCJmb250LXNpemU6MmVtO3BhZGRpbmctdG9wOjRweFwiPsOXPC9idXR0b24+JylcclxuICAgIHRoaXMuRE9NLmNoaWxkcmVuKCc6Zmlyc3QnKS5hcHBlbmQoY2xvc2VCdXR0b24pXHJcbiAgICBjbG9zZUJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5ET00uaGlkZSgpIH0pXHJcblxyXG4gICAgdmFyIG5hbWVJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTsgd2lkdGg6MTgwcHg7IGRpc3BsYXk6aW5saW5lO21hcmdpbi1sZWZ0OjJweDttYXJnaW4tcmlnaHQ6MnB4XCIgIHBsYWNlaG9sZGVyPVwiRmlsbCBpbiBhIG5ldyBsYXlvdXQgbmFtZS4uLlwiLz4nKS5hZGRDbGFzcyhcInczLWlucHV0IHczLWJvcmRlclwiKTsgICBcclxuICAgIHRoaXMuRE9NLmFwcGVuZChuYW1lSW5wdXQpXHJcbiAgICB2YXIgc2F2ZUFzTmV3QnRuPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtZ3JlZW4gdzMtaG92ZXItbGlnaHQtZ3JlZW5cIj5TYXZlIE5ldyBMYXlvdXQ8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKHNhdmVBc05ld0J0bilcclxuICAgIHNhdmVBc05ld0J0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLnNhdmVJbnRvTGF5b3V0KG5hbWVJbnB1dC52YWwoKSl9KVxyXG5cclxuXHJcbiAgICBpZighalF1ZXJ5LmlzRW1wdHlPYmplY3QoZ2xvYmFsQ2FjaGUubGF5b3V0SlNPTikpe1xyXG4gICAgICAgIHZhciBsYmw9JCgnPGRpdiBjbGFzcz1cInczLWJhciB3My1wYWRkaW5nLTE2XCIgc3R5bGU9XCJ0ZXh0LWFsaWduOmNlbnRlcjtcIj4tIE9SIC08L2Rpdj4nKVxyXG4gICAgICAgIHRoaXMuRE9NLmFwcGVuZChsYmwpIFxyXG4gICAgICAgIHZhciBzd2l0Y2hMYXlvdXRTZWxlY3Rvcj1uZXcgc2ltcGxlU2VsZWN0TWVudShcIlwiLHtmb250U2l6ZTpcIjFlbVwiLGNvbG9yQ2xhc3M6XCJ3My1saWdodC1ncmF5XCIsd2lkdGg6XCIxMjBweFwifSlcclxuICAgICAgICB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yPXN3aXRjaExheW91dFNlbGVjdG9yXHJcbiAgICAgICAgdGhpcy5yZWZpbGxPcHRpb25zKClcclxuICAgICAgICB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmNhbGxCYWNrX2NsaWNrT3B0aW9uPShvcHRpb25UZXh0LG9wdGlvblZhbHVlKT0+e1xyXG4gICAgICAgICAgICBpZihvcHRpb25UZXh0PT1udWxsKSB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmNoYW5nZU5hbWUoXCIgXCIpXHJcbiAgICAgICAgICAgIGVsc2UgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jaGFuZ2VOYW1lKG9wdGlvblRleHQpXHJcbiAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICB2YXIgc2F2ZUFzQnRuPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtZ3JlZW4gdzMtaG92ZXItbGlnaHQtZ3JlZW5cIiBzdHlsZT1cIm1hcmdpbi1sZWZ0OjJweDttYXJnaW4tcmlnaHQ6NXB4XCI+U2F2ZSBBczwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIGRlbGV0ZUJ0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLXJlZCB3My1ob3Zlci1waW5rXCIgc3R5bGU9XCJtYXJnaW4tbGVmdDo1cHhcIj5EZWxldGUgTGF5b3V0PC9idXR0b24+JylcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQoc2F2ZUFzQnRuLHN3aXRjaExheW91dFNlbGVjdG9yLkRPTSxkZWxldGVCdG4pXHJcbiAgICAgICAgc2F2ZUFzQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuc2F2ZUludG9MYXlvdXQoc3dpdGNoTGF5b3V0U2VsZWN0b3IuY3VyU2VsZWN0VmFsKX0pXHJcbiAgICAgICAgZGVsZXRlQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuZGVsZXRlTGF5b3V0KHN3aXRjaExheW91dFNlbGVjdG9yLmN1clNlbGVjdFZhbCl9KVxyXG5cclxuICAgICAgICBpZihnbG9iYWxDYWNoZS5jdXJyZW50TGF5b3V0TmFtZSE9bnVsbCl7XHJcbiAgICAgICAgICAgIHN3aXRjaExheW91dFNlbGVjdG9yLnRyaWdnZXJPcHRpb25WYWx1ZShnbG9iYWxDYWNoZS5jdXJyZW50TGF5b3V0TmFtZSlcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgc3dpdGNoTGF5b3V0U2VsZWN0b3IudHJpZ2dlck9wdGlvbkluZGV4KDApXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5lZGl0TGF5b3V0RGlhbG9nLnByb3RvdHlwZS5zYXZlSW50b0xheW91dCA9IGZ1bmN0aW9uIChsYXlvdXROYW1lKSB7XHJcbiAgICBpZihsYXlvdXROYW1lPT1cIlwiIHx8IGxheW91dE5hbWU9PW51bGwpe1xyXG4gICAgICAgIGFsZXJ0KFwiUGxlYXNlIGNob29zZSB0YXJnZXQgbGF5b3V0IE5hbWVcIilcclxuICAgICAgICByZXR1cm5cclxuICAgIH1cclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInNhdmVMYXlvdXRcIiwgXCJsYXlvdXROYW1lXCI6IGxheW91dE5hbWV9KVxyXG4gICAgdGhpcy5ET00uaGlkZSgpXHJcbn1cclxuXHJcblxyXG5lZGl0TGF5b3V0RGlhbG9nLnByb3RvdHlwZS5kZWxldGVMYXlvdXQgPSBmdW5jdGlvbiAobGF5b3V0TmFtZSkge1xyXG4gICAgaWYobGF5b3V0TmFtZT09XCJcIiB8fCBsYXlvdXROYW1lPT1udWxsKXtcclxuICAgICAgICBhbGVydChcIlBsZWFzZSBjaG9vc2UgdGFyZ2V0IGxheW91dCBOYW1lXCIpXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBjb25maXJtRGlhbG9nRGl2PW5ldyBzaW1wbGVDb25maXJtRGlhbG9nKClcclxuXHJcbiAgICBjb25maXJtRGlhbG9nRGl2LnNob3coXHJcbiAgICAgICAgeyB3aWR0aDogXCIyNTBweFwiIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJDb25maXJtXCJcclxuICAgICAgICAgICAgLCBjb250ZW50OiBcIkNvbmZpcm0gZGVsZXRpbmcgbGF5b3V0IFxcXCJcIiArIGxheW91dE5hbWUgKyBcIlxcXCI/XCJcclxuICAgICAgICAgICAgLCBidXR0b25zOltcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xvckNsYXNzOiBcInczLXJlZCB3My1ob3Zlci1waW5rXCIsIHRleHQ6IFwiQ29uZmlybVwiLCBcImNsaWNrRnVuY1wiOiBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBnbG9iYWxDYWNoZS5sYXlvdXRKU09OW2xheW91dE5hbWVdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChsYXlvdXROYW1lID09IGdsb2JhbENhY2hlLmN1cnJlbnRMYXlvdXROYW1lKSBnbG9iYWxDYWNoZS5jdXJyZW50TGF5b3V0TmFtZSA9IG51bGxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImxheW91dHNVcGRhdGVkXCJ9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlZmlsbE9wdGlvbnMoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLnRyaWdnZXJPcHRpb25JbmRleCgwKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9kZWxldGVMYXlvdXRcIiwgXCJQT1NUXCIsIHsgXCJsYXlvdXROYW1lXCI6IGxheW91dE5hbWUgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgfWNhdGNoKGUpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1ncmF5XCIsdGV4dDogXCJDYW5jZWxcIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKClcclxuICAgICAgICAgICAgICAgIH19XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9XHJcbiAgICApXHJcblxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBlZGl0TGF5b3V0RGlhbG9nKCk7IiwiY29uc3QgbW9kZWxBbmFseXplciA9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9tb2RlbEFuYWx5emVyXCIpO1xyXG5jb25zdCBzaW1wbGVTZWxlY3RNZW51PSByZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvc2ltcGxlU2VsZWN0TWVudVwiKVxyXG5jb25zdCBzaW1wbGVDb25maXJtRGlhbG9nID0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL3NpbXBsZUNvbmZpcm1EaWFsb2dcIilcclxuY29uc3QgZ2xvYmFsQ2FjaGUgPSByZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvZ2xvYmFsQ2FjaGVcIilcclxuY29uc3QgbXNhbEhlbHBlciA9IHJlcXVpcmUoXCIuLi9tc2FsSGVscGVyXCIpXHJcblxyXG5mdW5jdGlvbiBpbmZvUGFuZWwoKSB7XHJcbiAgICB0aGlzLmNvbnRpbmVyRE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1jYXJkXCIgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt6LWluZGV4OjkwO3JpZ2h0OjBweDt0b3A6NTAlO2hlaWdodDo3MCU7d2lkdGg6MzAwcHg7dHJhbnNmb3JtOiB0cmFuc2xhdGVZKC01MCUpO1wiPjwvZGl2PicpXHJcbiAgICB0aGlzLmNvbnRpbmVyRE9NLmhpZGUoKVxyXG4gICAgdGhpcy5jb250aW5lckRPTS5hcHBlbmQoJCgnPGRpdiBzdHlsZT1cImhlaWdodDo1MHB4XCIgY2xhc3M9XCJ3My1iYXIgdzMtcmVkXCI+PC9kaXY+JykpXHJcblxyXG4gICAgdGhpcy5jbG9zZUJ1dHRvbjE9JCgnPGJ1dHRvbiBzdHlsZT1cImhlaWdodDoxMDAlXCIgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b25cIj48aSBjbGFzcz1cImZhIGZhLWluZm8tY2lyY2xlIGZhLTJ4XCIgc3R5bGU9XCJwYWRkaW5nOjJweFwiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5jbG9zZUJ1dHRvbjI9JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yaWdodFwiIHN0eWxlPVwiZm9udC1zaXplOjJlbVwiPsOXPC9idXR0b24+JylcclxuICAgIHRoaXMuY29udGluZXJET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZCh0aGlzLmNsb3NlQnV0dG9uMSx0aGlzLmNsb3NlQnV0dG9uMikgXHJcblxyXG4gICAgdGhpcy5pc01pbmltaXplZD1mYWxzZTtcclxuICAgIHZhciBidXR0b25BbmltPSgpPT57XHJcbiAgICAgICAgaWYoIXRoaXMuaXNNaW5pbWl6ZWQpe1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRpbmVyRE9NLmFuaW1hdGUoe1xyXG4gICAgICAgICAgICAgICAgcmlnaHQ6IFwiLTI1MHB4XCIsXHJcbiAgICAgICAgICAgICAgICBoZWlnaHQ6XCI1MHB4XCJcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgdGhpcy5pc01pbmltaXplZD10cnVlO1xyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRpbmVyRE9NLmFuaW1hdGUoe1xyXG4gICAgICAgICAgICAgICAgcmlnaHQ6IFwiMHB4XCIsXHJcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IFwiNzAlXCJcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgdGhpcy5pc01pbmltaXplZD1mYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLmNsb3NlQnV0dG9uMS5vbihcImNsaWNrXCIsYnV0dG9uQW5pbSlcclxuICAgIHRoaXMuY2xvc2VCdXR0b24yLm9uKFwiY2xpY2tcIixidXR0b25BbmltKVxyXG5cclxuICAgIHRoaXMuRE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1jb250YWluZXJcIiBzdHlsZT1cInBvc3Rpb246YWJzb2x1dGU7dG9wOjUwcHg7aGVpZ2h0OmNhbGMoMTAwJSAtIDUwcHgpO292ZXJmbG93OmF1dG9cIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5jb250aW5lckRPTS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIsXCJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuOClcIilcclxuICAgIHRoaXMuY29udGluZXJET00uaG92ZXIoKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuY29udGluZXJET00uY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiLCBcInJnYmEoMjU1LCAyNTUsIDI1NSwgMSlcIilcclxuICAgIH0sICgpID0+IHtcclxuICAgICAgICB0aGlzLmNvbnRpbmVyRE9NLmNzcyhcImJhY2tncm91bmQtY29sb3JcIiwgXCJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuOClcIilcclxuICAgIH0pO1xyXG4gICAgdGhpcy5jb250aW5lckRPTS5hcHBlbmQodGhpcy5ET00pXHJcbiAgICAkKCdib2R5JykuYXBwZW5kKHRoaXMuY29udGluZXJET00pXHJcblxyXG4gICAgdGhpcy5kcmF3QnV0dG9ucyhudWxsKVxyXG4gICAgdGhpcy5zZWxlY3RlZE9iamVjdHM9bnVsbDtcclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5yeE1lc3NhZ2U9ZnVuY3Rpb24obXNnUGF5bG9hZCl7XHJcbiAgICBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwic3RhcnRTZWxlY3Rpb25EaWFsb2dfY2xvc2VkXCIpe1xyXG4gICAgICAgIGlmKCF0aGlzLmNvbnRpbmVyRE9NLmlzKFwiOnZpc2libGVcIikpIHtcclxuICAgICAgICAgICAgdGhpcy5jb250aW5lckRPTS5zaG93KClcclxuICAgICAgICAgICAgdGhpcy5jb250aW5lckRPTS5hZGRDbGFzcyhcInczLWFuaW1hdGUtcmlnaHRcIilcclxuICAgICAgICB9XHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwic2hvd0luZm9TZWxlY3RlZE5vZGVzXCIpe1xyXG4gICAgICAgIHRoaXMuRE9NLmVtcHR5KClcclxuICAgICAgICB2YXIgYXJyPW1zZ1BheWxvYWQuaW5mbztcclxuICAgICAgICBcclxuICAgICAgICBpZihhcnI9PW51bGwgfHwgYXJyLmxlbmd0aD09MCl7XHJcbiAgICAgICAgICAgIHRoaXMuZHJhd0J1dHRvbnMobnVsbClcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZE9iamVjdHM9W107XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zZWxlY3RlZE9iamVjdHM9YXJyO1xyXG4gICAgICAgIGlmKGFyci5sZW5ndGg9PTEpe1xyXG4gICAgICAgICAgICB2YXIgc2luZ2xlRWxlbWVudEluZm89YXJyWzBdO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYoc2luZ2xlRWxlbWVudEluZm9bXCIkZHRJZFwiXSl7Ly8gc2VsZWN0IGEgbm9kZVxyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3QnV0dG9ucyhcInNpbmdsZU5vZGVcIilcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy9pbnN0ZWFkIG9mIGRyYXcgdGhlICRkdElkLCBkcmF3IGRpc3BsYXkgbmFtZSBpbnN0ZWFkXHJcbiAgICAgICAgICAgICAgICAvL3RoaXMuZHJhd1N0YXRpY0luZm8odGhpcy5ET00se1wiJGR0SWRcIjpzaW5nbGVFbGVtZW50SW5mb1tcIiRkdElkXCJdfSxcIjFlbVwiLFwiMTNweFwiKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3U3RhdGljSW5mbyh0aGlzLkRPTSx7XCJuYW1lXCI6c2luZ2xlRWxlbWVudEluZm9bXCJkaXNwbGF5TmFtZVwiXX0sXCIxZW1cIixcIjEzcHhcIilcclxuXHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIG1vZGVsTmFtZT1zaW5nbGVFbGVtZW50SW5mb1snJG1ldGFkYXRhJ11bJyRtb2RlbCddXHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGlmKG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbE5hbWVdKXtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYXdFZGl0YWJsZSh0aGlzLkRPTSxtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxOYW1lXS5lZGl0YWJsZVByb3BlcnRpZXMsc2luZ2xlRWxlbWVudEluZm8sW10pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAvL2luc3RlYWQgb2YgZHJhd2luZyB0aGUgb3JpZ2luYWwgaW5mb21yYXRpb24sIGRyYXcgbW9yZSBtZWFuaW5nZnVsIG9uZVxyXG4gICAgICAgICAgICAgICAgLy90aGlzLmRyYXdTdGF0aWNJbmZvKHRoaXMuRE9NLHtcIiRldGFnXCI6c2luZ2xlRWxlbWVudEluZm9bXCIkZXRhZ1wiXSxcIiRtZXRhZGF0YVwiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJG1ldGFkYXRhXCJdfSxcIjFlbVwiLFwiMTBweFwiKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3U3RhdGljSW5mbyh0aGlzLkRPTSx7XCJNb2RlbFwiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJG1ldGFkYXRhXCJdW1wiJG1vZGVsXCJdfSxcIjFlbVwiLFwiMTBweFwiKVxyXG4gICAgICAgICAgICAgICAgZm9yKHZhciBpbmQgaW4gc2luZ2xlRWxlbWVudEluZm9bXCIkbWV0YWRhdGFcIl0pe1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKGluZCA9PSBcIiRtb2RlbFwiKSBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdG1wT2JqPXt9XHJcbiAgICAgICAgICAgICAgICAgICAgdG1wT2JqW2luZF09c2luZ2xlRWxlbWVudEluZm9bXCIkbWV0YWRhdGFcIl1baW5kXVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhd1N0YXRpY0luZm8odGhpcy5ET00sdG1wT2JqLFwiMWVtXCIsXCIxMHB4XCIpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1lbHNlIGlmKHNpbmdsZUVsZW1lbnRJbmZvW1wiJHNvdXJjZUlkXCJdKXtcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhd0J1dHRvbnMoXCJzaW5nbGVSZWxhdGlvbnNoaXBcIilcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhd1N0YXRpY0luZm8odGhpcy5ET00se1xyXG4gICAgICAgICAgICAgICAgICAgIFwiRnJvbVwiOmdsb2JhbENhY2hlLnR3aW5JRE1hcFRvRGlzcGxheU5hbWVbc2luZ2xlRWxlbWVudEluZm9bXCIkc291cmNlSWRcIl1dLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiVG9cIjpnbG9iYWxDYWNoZS50d2luSURNYXBUb0Rpc3BsYXlOYW1lW3NpbmdsZUVsZW1lbnRJbmZvW1wiJHRhcmdldElkXCJdXSxcclxuICAgICAgICAgICAgICAgICAgICBcIlJlbGF0aW9uc2hpcCBUeXBlXCI6c2luZ2xlRWxlbWVudEluZm9bXCIkcmVsYXRpb25zaGlwTmFtZVwiXVxyXG4gICAgICAgICAgICAgICAgICAgIC8vLFwiJHJlbGF0aW9uc2hpcElkXCI6c2luZ2xlRWxlbWVudEluZm9bXCIkcmVsYXRpb25zaGlwSWRcIl1cclxuICAgICAgICAgICAgICAgIH0sXCIxZW1cIixcIjEzcHhcIilcclxuICAgICAgICAgICAgICAgIHZhciByZWxhdGlvbnNoaXBOYW1lPXNpbmdsZUVsZW1lbnRJbmZvW1wiJHJlbGF0aW9uc2hpcE5hbWVcIl1cclxuICAgICAgICAgICAgICAgIHZhciBzb3VyY2VNb2RlbD1zaW5nbGVFbGVtZW50SW5mb1tcInNvdXJjZU1vZGVsXCJdXHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhd0VkaXRhYmxlKHRoaXMuRE9NLHRoaXMuZ2V0UmVsYXRpb25TaGlwRWRpdGFibGVQcm9wZXJ0aWVzKHJlbGF0aW9uc2hpcE5hbWUsc291cmNlTW9kZWwpLHNpbmdsZUVsZW1lbnRJbmZvLFtdKVxyXG4gICAgICAgICAgICAgICAgZm9yKHZhciBpbmQgaW4gc2luZ2xlRWxlbWVudEluZm9bXCIkbWV0YWRhdGFcIl0pe1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0bXBPYmo9e31cclxuICAgICAgICAgICAgICAgICAgICB0bXBPYmpbaW5kXT1zaW5nbGVFbGVtZW50SW5mb1tcIiRtZXRhZGF0YVwiXVtpbmRdXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmF3U3RhdGljSW5mbyh0aGlzLkRPTSx0bXBPYmosXCIxZW1cIixcIjEwcHhcIilcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vdGhpcy5kcmF3U3RhdGljSW5mbyh0aGlzLkRPTSx7XCIkZXRhZ1wiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJGV0YWdcIl19LFwiMWVtXCIsXCIxMHB4XCIsXCJEYXJrR3JheVwiKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfWVsc2UgaWYoYXJyLmxlbmd0aD4xKXtcclxuICAgICAgICAgICAgdGhpcy5kcmF3QnV0dG9ucyhcIm11bHRpcGxlXCIpXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd011bHRpcGxlT2JqKClcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZ2V0UmVsYXRpb25TaGlwRWRpdGFibGVQcm9wZXJ0aWVzPWZ1bmN0aW9uKHJlbGF0aW9uc2hpcE5hbWUsc291cmNlTW9kZWwpe1xyXG4gICAgaWYoIW1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1tzb3VyY2VNb2RlbF0gfHwgIW1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1tzb3VyY2VNb2RlbF0udmFsaWRSZWxhdGlvbnNoaXBzW3JlbGF0aW9uc2hpcE5hbWVdKSByZXR1cm5cclxuICAgIHJldHVybiBtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbc291cmNlTW9kZWxdLnZhbGlkUmVsYXRpb25zaGlwc1tyZWxhdGlvbnNoaXBOYW1lXS5lZGl0YWJsZVJlbGF0aW9uc2hpcFByb3BlcnRpZXNcclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5kcmF3QnV0dG9ucz1mdW5jdGlvbihzZWxlY3RUeXBlKXtcclxuICAgIHZhciBpbXBCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ibHVlXCI+PGkgY2xhc3M9XCJmYSBmYS1hcnJvdy1jaXJjbGUtby1kb3duXCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICB2YXIgYWN0dWFsSW1wb3J0VHdpbnNCdG4gPSQoJzxpbnB1dCB0eXBlPVwiZmlsZVwiIG5hbWU9XCJtb2RlbEZpbGVzXCIgbXVsdGlwbGU9XCJtdWx0aXBsZVwiIHN0eWxlPVwiZGlzcGxheTpub25lXCI+PC9pbnB1dD4nKVxyXG4gICAgaWYoc2VsZWN0VHlwZSE9bnVsbCl7XHJcbiAgICAgICAgdmFyIHJlZnJlc2hCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ibGFja1wiPjxpIGNsYXNzPVwiZmEgZmEtcmVmcmVzaFwiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBleHBCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ncmVlblwiPjxpIGNsYXNzPVwiZmEgZmEtYXJyb3ctY2lyY2xlLW8tdXBcIj48L2k+PC9idXR0b24+JykgICAgXHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKHJlZnJlc2hCdG4sZXhwQnRuLGltcEJ0bixhY3R1YWxJbXBvcnRUd2luc0J0bilcclxuICAgICAgICByZWZyZXNoQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMucmVmcmVzaEluZm9tYXRpb24oKX0pXHJcbiAgICAgICAgZXhwQnRuLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgICAgICAvL2ZpbmQgb3V0IHRoZSB0d2lucyBpbiBzZWxlY3Rpb24gYW5kIHRoZWlyIGNvbm5lY3Rpb25zIChmaWx0ZXIgYm90aCBzcmMgYW5kIHRhcmdldCB3aXRoaW4gdGhlIHNlbGVjdGVkIHR3aW5zKVxyXG4gICAgICAgICAgICAvL2FuZCBleHBvcnQgdGhlbVxyXG4gICAgICAgICAgICB0aGlzLmV4cG9ydFNlbGVjdGVkKClcclxuICAgICAgICB9KSAgICBcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHRoaXMuRE9NLmh0bWwoXCI8YSBzdHlsZT0nZGlzcGxheTpibG9jaztmb250LXN0eWxlOml0YWxpYztjb2xvcjpncmF5Jz5DaG9vc2UgdHdpbnMgb3IgcmVsYXRpb25zaGlwcyB0byB2aWV3IGluZm9tcmF0aW9uPC9hPjxhIHN0eWxlPSdkaXNwbGF5OmJsb2NrO2ZvbnQtc3R5bGU6aXRhbGljO2NvbG9yOmdyYXk7cGFkZGluZy10b3A6MjBweCc+UHJlc3Mgc2hpZnQga2V5IHRvIHNlbGVjdCBtdWx0aXBsZSBpbiB0b3BvbG9neSB2aWV3PC9hPjxhIHN0eWxlPSdkaXNwbGF5OmJsb2NrO2ZvbnQtc3R5bGU6aXRhbGljO2NvbG9yOmdyYXk7cGFkZGluZy10b3A6MjBweDtwYWRkaW5nLWJvdHRvbToyMHB4Jz5QcmVzcyBjdHJsIGtleSB0byBzZWxlY3QgbXVsdGlwbGUgaW4gdHJlZSB2aWV3PC9hPjxhIHN0eWxlPSdkaXNwbGF5OmJsb2NrO2ZvbnQtc3R5bGU6aXRhbGljO2NvbG9yOmdyYXk7cGFkZGluZy10b3A6MjBweDtwYWRkaW5nLWJvdHRvbTo1cHgnPkltcG9ydCB0d2lucyBkYXRhIGJ5IGNsaWNraW5nIGJ1dHRvbiBiZWxvdzwvYT5cIilcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQoaW1wQnRuLGFjdHVhbEltcG9ydFR3aW5zQnRuKVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBpbXBCdG4ub24oXCJjbGlja1wiLCgpPT57YWN0dWFsSW1wb3J0VHdpbnNCdG4udHJpZ2dlcignY2xpY2snKTt9KVxyXG4gICAgYWN0dWFsSW1wb3J0VHdpbnNCdG4uY2hhbmdlKGFzeW5jIChldnQpPT57XHJcbiAgICAgICAgdmFyIGZpbGVzID0gZXZ0LnRhcmdldC5maWxlczsgLy8gRmlsZUxpc3Qgb2JqZWN0XHJcbiAgICAgICAgYXdhaXQgdGhpcy5yZWFkVHdpbnNGaWxlc0NvbnRlbnRBbmRJbXBvcnQoZmlsZXMpXHJcbiAgICAgICAgYWN0dWFsSW1wb3J0VHdpbnNCdG4udmFsKFwiXCIpXHJcbiAgICB9KVxyXG4gICAgaWYoc2VsZWN0VHlwZT09bnVsbCkgcmV0dXJuO1xyXG5cclxuICAgIGlmKHNlbGVjdFR5cGU9PVwic2luZ2xlUmVsYXRpb25zaGlwXCIpe1xyXG4gICAgICAgIHZhciBkZWxCdG4gPSAgJCgnPGJ1dHRvbiBzdHlsZT1cIndpZHRoOjUwJVwiIGNsYXNzPVwidzMtYnV0dG9uIHczLXJlZCB3My1ob3Zlci1waW5rIHczLWJvcmRlclwiPkRlbGV0ZSBBbGw8L2J1dHRvbj4nKVxyXG4gICAgICAgIHRoaXMuRE9NLmFwcGVuZChkZWxCdG4pXHJcbiAgICAgICAgZGVsQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuZGVsZXRlU2VsZWN0ZWQoKX0pXHJcbiAgICB9ZWxzZSBpZihzZWxlY3RUeXBlPT1cInNpbmdsZU5vZGVcIiB8fCBzZWxlY3RUeXBlPT1cIm11bHRpcGxlXCIpe1xyXG4gICAgICAgIHZhciBkZWxCdG4gPSAkKCc8YnV0dG9uIHN0eWxlPVwid2lkdGg6NTAlXCIgY2xhc3M9XCJ3My1idXR0b24gdzMtcmVkIHczLWhvdmVyLXBpbmsgdzMtYm9yZGVyXCI+RGVsZXRlIEFsbDwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIGNvbm5lY3RUb0J0biA9JCgnPGJ1dHRvbiBzdHlsZT1cIndpZHRoOjQ1JVwiICBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj5Db25uZWN0IHRvPC9idXR0b24+JylcclxuICAgICAgICB2YXIgY29ubmVjdEZyb21CdG4gPSAkKCc8YnV0dG9uIHN0eWxlPVwid2lkdGg6NDUlXCIgY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+Q29ubmVjdCBmcm9tPC9idXR0b24+JylcclxuICAgICAgICB2YXIgc2hvd0luYm91bmRCdG4gPSAkKCc8YnV0dG9uICBzdHlsZT1cIndpZHRoOjQ1JVwiIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiPlF1ZXJ5IEluYm91bmQ8L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBzaG93T3V0Qm91bmRCdG4gPSAkKCc8YnV0dG9uIHN0eWxlPVwid2lkdGg6NDUlXCIgY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+UXVlcnkgT3V0Ym91bmQ8L2J1dHRvbj4nKVxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuRE9NLmFwcGVuZChkZWxCdG4sIGNvbm5lY3RUb0J0bixjb25uZWN0RnJvbUJ0biAsIHNob3dJbmJvdW5kQnRuLCBzaG93T3V0Qm91bmRCdG4pXHJcbiAgICBcclxuICAgICAgICBzaG93T3V0Qm91bmRCdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5zaG93T3V0Qm91bmQoKX0pXHJcbiAgICAgICAgc2hvd0luYm91bmRCdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5zaG93SW5Cb3VuZCgpfSkgIFxyXG4gICAgICAgIGNvbm5lY3RUb0J0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJjb25uZWN0VG9cIn0pIH0pXHJcbiAgICAgICAgY29ubmVjdEZyb21CdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiY29ubmVjdEZyb21cIn0pIH0pXHJcblxyXG4gICAgICAgIGRlbEJ0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLmRlbGV0ZVNlbGVjdGVkKCl9KVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICB2YXIgbnVtT2ZOb2RlID0gMDtcclxuICAgIHZhciBhcnI9dGhpcy5zZWxlY3RlZE9iamVjdHM7XHJcbiAgICBhcnIuZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICBpZiAoZWxlbWVudFsnJGR0SWQnXSkgbnVtT2ZOb2RlKytcclxuICAgIH0pO1xyXG4gICAgaWYobnVtT2ZOb2RlPjApe1xyXG4gICAgICAgIHZhciBzZWxlY3RJbmJvdW5kQnRuID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj4rU2VsZWN0IEluYm91bmQ8L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBzZWxlY3RPdXRCb3VuZEJ0biA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+K1NlbGVjdCBPdXRib3VuZDwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIGNvc2VMYXlvdXRCdG49ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+Q09TRSBWaWV3PC9idXR0b24+JylcclxuICAgICAgICB2YXIgaGlkZUJ0bj0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj5IaWRlPC9idXR0b24+JylcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQoc2VsZWN0SW5ib3VuZEJ0biwgc2VsZWN0T3V0Qm91bmRCdG4sY29zZUxheW91dEJ0bixoaWRlQnRuKVxyXG5cclxuICAgICAgICBzZWxlY3RJbmJvdW5kQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuYnJvYWRjYXN0TWVzc2FnZSh7XCJtZXNzYWdlXCI6IFwiYWRkU2VsZWN0SW5ib3VuZFwifSl9KVxyXG4gICAgICAgIHNlbGVjdE91dEJvdW5kQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuYnJvYWRjYXN0TWVzc2FnZSh7XCJtZXNzYWdlXCI6IFwiYWRkU2VsZWN0T3V0Ym91bmRcIn0pfSlcclxuICAgICAgICBjb3NlTGF5b3V0QnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuYnJvYWRjYXN0TWVzc2FnZSh7XCJtZXNzYWdlXCI6IFwiQ09TRVNlbGVjdGVkTm9kZXNcIn0pfSlcclxuICAgICAgICBoaWRlQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuYnJvYWRjYXN0TWVzc2FnZSh7XCJtZXNzYWdlXCI6IFwiaGlkZVNlbGVjdGVkTm9kZXNcIn0pfSlcclxuICAgIH1cclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5leHBvcnRTZWxlY3RlZD1hc3luYyBmdW5jdGlvbigpe1xyXG4gICAgdmFyIGFycj10aGlzLnNlbGVjdGVkT2JqZWN0cztcclxuICAgIGlmKGFyci5sZW5ndGg9PTApIHJldHVybjtcclxuICAgIHZhciB0d2luSURBcnI9W11cclxuICAgIHZhciB0d2luVG9CZVN0b3JlZD1bXVxyXG4gICAgdmFyIHR3aW5JRHM9e31cclxuICAgIGFyci5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIGlmIChlbGVtZW50Wyckc291cmNlSWQnXSkgcmV0dXJuXHJcbiAgICAgICAgdHdpbklEQXJyLnB1c2goZWxlbWVudFsnJGR0SWQnXSlcclxuICAgICAgICB2YXIgYW5FeHBUd2luPXt9XHJcbiAgICAgICAgYW5FeHBUd2luW1wiJG1ldGFkYXRhXCJdPXtcIiRtb2RlbFwiOmVsZW1lbnRbXCIkbWV0YWRhdGFcIl1bXCIkbW9kZWxcIl19XHJcbiAgICAgICAgZm9yKHZhciBpbmQgaW4gZWxlbWVudCl7XHJcbiAgICAgICAgICAgIGlmKGluZD09XCIkbWV0YWRhdGFcIiB8fCBpbmQ9PVwiJGV0YWdcIikgY29udGludWUgXHJcbiAgICAgICAgICAgIGVsc2UgYW5FeHBUd2luW2luZF09ZWxlbWVudFtpbmRdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHR3aW5Ub0JlU3RvcmVkLnB1c2goYW5FeHBUd2luKVxyXG4gICAgICAgIHR3aW5JRHNbZWxlbWVudFsnJGR0SWQnXV09MVxyXG4gICAgfSk7XHJcbiAgICB2YXIgcmVsYXRpb25zVG9CZVN0b3JlZD1bXVxyXG4gICAgdHdpbklEQXJyLmZvckVhY2gob25lSUQ9PntcclxuICAgICAgICB2YXIgcmVsYXRpb25zPWdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tvbmVJRF1cclxuICAgICAgICBpZighcmVsYXRpb25zKSByZXR1cm47XHJcbiAgICAgICAgcmVsYXRpb25zLmZvckVhY2gob25lUmVsYXRpb249PntcclxuICAgICAgICAgICAgdmFyIHRhcmdldElEPW9uZVJlbGF0aW9uW1wiJHRhcmdldElkXCJdXHJcbiAgICAgICAgICAgIGlmKHR3aW5JRHNbdGFyZ2V0SURdKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgb2JqPXt9XHJcbiAgICAgICAgICAgICAgICBmb3IodmFyIGluZCBpbiBvbmVSZWxhdGlvbil7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoaW5kID09XCIkZXRhZ1wifHxpbmQgPT1cIiRyZWxhdGlvbnNoaXBJZFwifHxpbmQgPT1cIiRzb3VyY2VJZFwifHxpbmQgPT1cInNvdXJjZU1vZGVsXCIpIGNvbnRpbnVlXHJcbiAgICAgICAgICAgICAgICAgICAgb2JqW2luZF09b25lUmVsYXRpb25baW5kXVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdmFyIG9uZUFjdGlvbj17XCIkc3JjSWRcIjpvbmVJRCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIiRyZWxhdGlvbnNoaXBJZFwiOm9uZVJlbGF0aW9uW1wiJHJlbGF0aW9uc2hpcElkXCJdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwib2JqXCI6b2JqfVxyXG4gICAgICAgICAgICAgICAgcmVsYXRpb25zVG9CZVN0b3JlZC5wdXNoKG9uZUFjdGlvbilcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICB9KVxyXG4gICAgdmFyIGZpbmFsSlNPTj17XCJ0d2luc1wiOnR3aW5Ub0JlU3RvcmVkLFwicmVsYXRpb25zXCI6cmVsYXRpb25zVG9CZVN0b3JlZH1cclxuICAgIHZhciBwb20gPSAkKFwiPGE+PC9hPlwiKVxyXG4gICAgcG9tLmF0dHIoJ2hyZWYnLCAnZGF0YTp0ZXh0L3BsYWluO2NoYXJzZXQ9dXRmLTgsJyArIGVuY29kZVVSSUNvbXBvbmVudChKU09OLnN0cmluZ2lmeShmaW5hbEpTT04pKSk7XHJcbiAgICBwb20uYXR0cignZG93bmxvYWQnLCBcImV4cG9ydFR3aW5zRGF0YS5qc29uXCIpO1xyXG4gICAgcG9tWzBdLmNsaWNrKClcclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5yZWFkT25lRmlsZT0gYXN5bmMgZnVuY3Rpb24oYUZpbGUpe1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xyXG4gICAgICAgICAgICByZWFkZXIub25sb2FkID0gKCk9PiB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlYWRlci5yZXN1bHQpXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHJlYWRlci5yZWFkQXNUZXh0KGFGaWxlKTtcclxuICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIHJlamVjdChlKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUucmVhZFR3aW5zRmlsZXNDb250ZW50QW5kSW1wb3J0PWFzeW5jIGZ1bmN0aW9uKGZpbGVzKXtcclxuICAgIHZhciBpbXBvcnRUd2lucz1bXVxyXG4gICAgdmFyIGltcG9ydFJlbGF0aW9ucz1bXVxyXG4gICAgZm9yICh2YXIgaSA9IDAsIGY7IGYgPSBmaWxlc1tpXTsgaSsrKSB7XHJcbiAgICAgICAgLy8gT25seSBwcm9jZXNzIGpzb24gZmlsZXMuXHJcbiAgICAgICAgaWYgKGYudHlwZSE9XCJhcHBsaWNhdGlvbi9qc29uXCIpIGNvbnRpbnVlO1xyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICAgdmFyIHN0cj0gYXdhaXQgdGhpcy5yZWFkT25lRmlsZShmKVxyXG4gICAgICAgICAgICB2YXIgb2JqPUpTT04ucGFyc2Uoc3RyKVxyXG4gICAgICAgICAgICBpZihvYmoudHdpbnMpIGltcG9ydFR3aW5zPWltcG9ydFR3aW5zLmNvbmNhdChvYmoudHdpbnMpXHJcbiAgICAgICAgICAgIGlmKG9iai5yZWxhdGlvbnMpIGltcG9ydFJlbGF0aW9ucz1pbXBvcnRSZWxhdGlvbnMuY29uY2F0KG9iai5yZWxhdGlvbnMpXHJcbiAgICAgICAgfWNhdGNoKGVycil7XHJcbiAgICAgICAgICAgIGFsZXJ0KGVycilcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gdXVpZHY0KCkge1xyXG4gICAgICAgIHJldHVybiAneHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIGZ1bmN0aW9uIChjKSB7XHJcbiAgICAgICAgICAgIHZhciByID0gTWF0aC5yYW5kb20oKSAqIDE2IHwgMCwgdiA9IGMgPT0gJ3gnID8gciA6IChyICYgMHgzIHwgMHg4KTtcclxuICAgICAgICAgICAgcmV0dXJuIHYudG9TdHJpbmcoMTYpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgdmFyIG9sZFR3aW5JRDJOZXdJRD17fVxyXG4gICAgaW1wb3J0VHdpbnMuZm9yRWFjaChvbmVUd2luPT57XHJcbiAgICAgICAgdmFyIG9sZElEPSBvbmVUd2luW1wiJGR0SWRcIl1cclxuICAgICAgICB2YXIgbmV3SUQ9dXVpZHY0KCk7XHJcbiAgICAgICAgb2xkVHdpbklEMk5ld0lEW29sZElEXT1uZXdJRFxyXG4gICAgICAgIG9uZVR3aW5bXCIkZHRJZFwiXT1uZXdJRFxyXG4gICAgfSlcclxuXHJcbiAgICBmb3IodmFyIGk9aW1wb3J0UmVsYXRpb25zLmxlbmd0aC0xO2k+PTA7aS0tKXtcclxuICAgICAgICB2YXIgb25lUmVsPWltcG9ydFJlbGF0aW9uc1tpXVxyXG4gICAgICAgIGlmKG9sZFR3aW5JRDJOZXdJRFtvbmVSZWxbXCIkc3JjSWRcIl1dPT1udWxsIHx8IG9sZFR3aW5JRDJOZXdJRFtvbmVSZWxbXCJvYmpcIl1bXCIkdGFyZ2V0SWRcIl1dPT1udWxsKXtcclxuICAgICAgICAgICAgaW1wb3J0UmVsYXRpb25zLnNwbGljZShpLDEpXHJcbiAgICAgICAgfSBlbHNle1xyXG4gICAgICAgICAgICBvbmVSZWxbXCIkc3JjSWRcIl09b2xkVHdpbklEMk5ld0lEW29uZVJlbFtcIiRzcmNJZFwiXV1cclxuICAgICAgICAgICAgb25lUmVsW1wib2JqXCJdW1wiJHRhcmdldElkXCJdPW9sZFR3aW5JRDJOZXdJRFtvbmVSZWxbXCJvYmpcIl1bXCIkdGFyZ2V0SWRcIl1dXHJcbiAgICAgICAgICAgIG9uZVJlbFtcIiRyZWxhdGlvbnNoaXBJZFwiXT11dWlkdjQoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHRyeXtcclxuICAgICAgICB2YXIgcmUgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9iYXRjaEltcG9ydFR3aW5zXCIsIFwiUE9TVFwiLCB7XCJ0d2luc1wiOkpTT04uc3RyaW5naWZ5KGltcG9ydFR3aW5zKX0pXHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHJlLkRCVHdpbnM9SlNPTi5wYXJzZShyZS5EQlR3aW5zKVxyXG4gICAgcmUuQURUVHdpbnM9SlNPTi5wYXJzZShyZS5BRFRUd2lucylcclxuICAgIHJlLkRCVHdpbnMuZm9yRWFjaChEQlR3aW49PnsgZ2xvYmFsQ2FjaGUuc3RvcmVTaW5nbGVEQlR3aW4oREJUd2luKSB9KVxyXG4gICAgdmFyIGFkdFR3aW5zPVtdXHJcbiAgICByZS5BRFRUd2lucy5mb3JFYWNoKEFEVFR3aW49PntcclxuICAgICAgICBnbG9iYWxDYWNoZS5zdG9yZVNpbmdsZUFEVFR3aW4oQURUVHdpbilcclxuICAgICAgICBhZHRUd2lucy5wdXNoKEFEVFR3aW4pXHJcbiAgICB9KVxyXG5cclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImFkZE5ld1R3aW5zXCIsIFwidHdpbnNJbmZvXCI6IGFkdFR3aW5zIH0pXHJcblxyXG4gICAgLy9jb250aW51ZSB0byBpbXBvcnQgcmVsYXRpb25zXHJcbiAgICB0cnl7XHJcbiAgICAgICAgdmFyIHJlbGF0aW9uc0ltcG9ydGVkID0gYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vY3JlYXRlUmVsYXRpb25zXCIsIFwiUE9TVFwiLCAge2FjdGlvbnM6SlNPTi5zdHJpbmdpZnkoaW1wb3J0UmVsYXRpb25zKX0pXHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICB9XHJcbiAgICBnbG9iYWxDYWNoZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzX2FwcGVuZChyZWxhdGlvbnNJbXBvcnRlZClcclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImRyYXdBbGxSZWxhdGlvbnNcIixpbmZvOnJlbGF0aW9uc0ltcG9ydGVkfSlcclxuXHJcbiAgICB2YXIgbnVtT2ZUd2lucz1hZHRUd2lucy5sZW5ndGhcclxuICAgIHZhciBudW1PZlJlbGF0aW9ucz1yZWxhdGlvbnNJbXBvcnRlZC5sZW5ndGhcclxuICAgIHZhciBzdHI9XCJBZGQgXCIrbnVtT2ZUd2lucysgXCIgbm9kZVwiKygobnVtT2ZUd2luczw9MSk/XCJcIjpcInNcIikrYCAoZnJvbSAke2ltcG9ydFR3aW5zLmxlbmd0aH0pYFxyXG4gICAgc3RyKz1cIiBhbmQgXCIrbnVtT2ZSZWxhdGlvbnMrXCIgcmVsYXRpb25zaGlwXCIrKChudW1PZlJlbGF0aW9uczw9MSk/XCJcIjpcInNcIikrYCAoZnJvbSAke2ltcG9ydFJlbGF0aW9ucy5sZW5ndGh9KWBcclxuICAgIHZhciBjb25maXJtRGlhbG9nRGl2ID0gbmV3IHNpbXBsZUNvbmZpcm1EaWFsb2coKVxyXG4gICAgY29uZmlybURpYWxvZ0Rpdi5zaG93KFxyXG4gICAgICAgIHsgd2lkdGg6IFwiNDAwcHhcIiB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGl0bGU6IFwiSW1wb3J0IFJlc3VsdFwiXHJcbiAgICAgICAgICAgICwgY29udGVudDpzdHJcclxuICAgICAgICAgICAgLCBidXR0b25zOiBbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1ncmF5XCIsIHRleHQ6IFwiT2tcIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKClcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9XHJcbiAgICApXHJcbiAgICBcclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5yZWZyZXNoSW5mb21hdGlvbj1hc3luYyBmdW5jdGlvbigpe1xyXG4gICAgdmFyIHR3aW5JRHM9W11cclxuICAgIHRoaXMuc2VsZWN0ZWRPYmplY3RzLmZvckVhY2gob25lSXRlbT0+eyAgaWYob25lSXRlbVsnJGR0SWQnXSkgdHdpbklEcy5wdXNoKG9uZUl0ZW1bJyRkdElkJ10pICB9KVxyXG4gICAgdHJ5e1xyXG4gICAgICAgIHZhciB0d2luc2RhdGEgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9saXN0VHdpbnNGb3JJRHNcIiwgXCJQT1NUXCIsIHR3aW5JRHMpXHJcbiAgICAgICAgdHdpbnNkYXRhLmZvckVhY2gob25lUmU9PntcclxuICAgICAgICAgICAgdmFyIHR3aW5JRD0gb25lUmVbJyRkdElkJ11cclxuICAgICAgICAgICAgaWYoZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbdHdpbklEXSE9bnVsbCl7XHJcbiAgICAgICAgICAgICAgICBmb3IodmFyIGluZCBpbiBvbmVSZSkgIGdsb2JhbENhY2hlLnN0b3JlU2luZ2xlQURUVHdpbihvbmVSZVtpbmRdKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgIH1jYXRjaChlKXtcclxuICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgIH1cclxuXHJcbiAgICB3aGlsZSh0d2luSURzLmxlbmd0aD4wKXtcclxuICAgICAgICB2YXIgc21hbGxBcnI9IHR3aW5JRHMuc3BsaWNlKDAsIDEwMCk7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICB2YXIgZGF0YSA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2dldFJlbGF0aW9uc2hpcHNGcm9tVHdpbklEc1wiLCBcIlBPU1RcIiwgc21hbGxBcnIpXHJcbiAgICAgICAgICAgIGlmIChkYXRhID09IFwiXCIpIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICBnbG9iYWxDYWNoZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzKGRhdGEpIC8vc3RvcmUgdGhlbSBpbiBnbG9iYWwgYXZhaWxhYmxlIGFycmF5XHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImRyYXdBbGxSZWxhdGlvbnNcIiwgaW5mbzogZGF0YSB9KVxyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIC8vcmVkcmF3IGluZm9wYW5lbCBpZiBuZWVkZWRcclxuICAgIGlmKHRoaXMuc2VsZWN0ZWRPYmplY3RzLmxlbmd0aD09MSkgdGhpcy5yeE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJzaG93SW5mb1NlbGVjdGVkTm9kZXNcIiwgaW5mbzogdGhpcy5zZWxlY3RlZE9iamVjdHMgfSlcclxuXHJcbn1cclxuXHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmRlbGV0ZVNlbGVjdGVkPWFzeW5jIGZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgYXJyPXRoaXMuc2VsZWN0ZWRPYmplY3RzO1xyXG4gICAgaWYoYXJyLmxlbmd0aD09MCkgcmV0dXJuO1xyXG4gICAgdmFyIHJlbGF0aW9uc0Fycj1bXVxyXG4gICAgdmFyIHR3aW5JREFycj1bXVxyXG4gICAgdmFyIHR3aW5JRHM9e31cclxuICAgIGFyci5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIGlmIChlbGVtZW50Wyckc291cmNlSWQnXSkgcmVsYXRpb25zQXJyLnB1c2goZWxlbWVudCk7XHJcbiAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgdHdpbklEQXJyLnB1c2goZWxlbWVudFsnJGR0SWQnXSlcclxuICAgICAgICAgICAgdHdpbklEc1tlbGVtZW50WyckZHRJZCddXT0xXHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBmb3IodmFyIGk9cmVsYXRpb25zQXJyLmxlbmd0aC0xO2k+PTA7aS0tKXsgLy9jbGVhciB0aG9zZSByZWxhdGlvbnNoaXBzIHRoYXQgYXJlIGdvaW5nIHRvIGJlIGRlbGV0ZWQgYWZ0ZXIgdHdpbnMgZGVsZXRpbmdcclxuICAgICAgICB2YXIgc3JjSWQ9ICByZWxhdGlvbnNBcnJbaV1bJyRzb3VyY2VJZCddXHJcbiAgICAgICAgdmFyIHRhcmdldElkID0gcmVsYXRpb25zQXJyW2ldWyckdGFyZ2V0SWQnXVxyXG4gICAgICAgIGlmKHR3aW5JRHNbc3JjSWRdIT1udWxsIHx8IHR3aW5JRHNbdGFyZ2V0SWRdIT1udWxsKXtcclxuICAgICAgICAgICAgcmVsYXRpb25zQXJyLnNwbGljZShpLDEpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdmFyIGNvbmZpcm1EaWFsb2dEaXYgPSBuZXcgc2ltcGxlQ29uZmlybURpYWxvZygpXHJcbiAgICB2YXIgZGlhbG9nU3RyPVwiXCJcclxuICAgIHZhciB0d2luTnVtYmVyPXR3aW5JREFyci5sZW5ndGg7XHJcbiAgICB2YXIgcmVsYXRpb25zTnVtYmVyID0gcmVsYXRpb25zQXJyLmxlbmd0aDtcclxuICAgIGlmKHR3aW5OdW1iZXI+MCkgZGlhbG9nU3RyID0gIHR3aW5OdW1iZXIrXCIgdHdpblwiKygodHdpbk51bWJlcj4xKT9cInNcIjpcIlwiKSArIFwiICh3aXRoIGNvbm5lY3RlZCByZWxhdGlvbnMpXCJcclxuICAgIGlmKHR3aW5OdW1iZXI+MCAmJiByZWxhdGlvbnNOdW1iZXI+MCkgZGlhbG9nU3RyKz1cIiBhbmQgYWRkaXRpb25hbCBcIlxyXG4gICAgaWYocmVsYXRpb25zTnVtYmVyPjApIGRpYWxvZ1N0ciArPSAgcmVsYXRpb25zTnVtYmVyK1wiIHJlbGF0aW9uXCIrKChyZWxhdGlvbnNOdW1iZXI+MSk/XCJzXCI6XCJcIiApXHJcbiAgICBkaWFsb2dTdHIrPVwiIHdpbGwgYmUgZGVsZXRlZC4gUGxlYXNlIGNvbmZpcm1cIlxyXG4gICAgY29uZmlybURpYWxvZ0Rpdi5zaG93KFxyXG4gICAgICAgIHsgd2lkdGg6IFwiMzUwcHhcIiB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGl0bGU6IFwiQ29uZmlybVwiXHJcbiAgICAgICAgICAgICwgY29udGVudDpkaWFsb2dTdHJcclxuICAgICAgICAgICAgLCBidXR0b25zOiBbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1yZWQgdzMtaG92ZXItcGlua1wiLCB0ZXh0OiBcIkNvbmZpcm1cIiwgXCJjbGlja0Z1bmNcIjogYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKClcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5ET00uZW1wdHkoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYXdCdXR0b25zKG51bGwpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZWxhdGlvbnNBcnIubGVuZ3RoID4gMCkgYXdhaXQgdGhpcy5kZWxldGVSZWxhdGlvbnMocmVsYXRpb25zQXJyKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHdpbklEQXJyLmxlbmd0aCA+IDApIGF3YWl0IHRoaXMuZGVsZXRlVHdpbnModHdpbklEQXJyKVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1ncmF5XCIsIHRleHQ6IFwiQ2FuY2VsXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfVxyXG4gICAgKVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmRlbGV0ZVR3aW5zPWFzeW5jIGZ1bmN0aW9uKHR3aW5JREFycil7ICAgXHJcbiAgICB3aGlsZSh0d2luSURBcnIubGVuZ3RoPjApe1xyXG4gICAgICAgIHZhciBzbWFsbEFycj0gdHdpbklEQXJyLnNwbGljZSgwLCAxMDApO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2RlbGV0ZVR3aW5zXCIsIFwiUE9TVFwiLCB7YXJyOnNtYWxsQXJyfSlcclxuICAgICAgICAgICAgcmVzdWx0LmZvckVhY2goKG9uZUlEKT0+e1xyXG4gICAgICAgICAgICAgICAgZGVsZXRlIGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW29uZUlEXVxyXG4gICAgICAgICAgICAgICAgZGVsZXRlIGdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tvbmVJRF1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInR3aW5zRGVsZXRlZFwiLHR3aW5JREFycjpyZXN1bHR9KVxyXG4gICAgICAgIH1jYXRjaChlKXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5kZWxldGVSZWxhdGlvbnM9YXN5bmMgZnVuY3Rpb24ocmVsYXRpb25zQXJyKXtcclxuICAgIHZhciBhcnI9W11cclxuICAgIHJlbGF0aW9uc0Fyci5mb3JFYWNoKG9uZVJlbGF0aW9uPT57XHJcbiAgICAgICAgYXJyLnB1c2goe3NyY0lEOm9uZVJlbGF0aW9uWyckc291cmNlSWQnXSxyZWxJRDpvbmVSZWxhdGlvblsnJHJlbGF0aW9uc2hpcElkJ119KVxyXG4gICAgfSlcclxuICAgIHRyeXtcclxuICAgICAgICB2YXIgZGF0YSA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2RlbGV0ZVJlbGF0aW9uc1wiLCBcIlBPU1RcIiwge1wicmVsYXRpb25zXCI6YXJyfSlcclxuICAgICAgICBnbG9iYWxDYWNoZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzX3JlbW92ZShkYXRhKVxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInJlbGF0aW9uc0RlbGV0ZWRcIixcInJlbGF0aW9uc1wiOmRhdGF9KVxyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgfVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLnNob3dPdXRCb3VuZD1hc3luYyBmdW5jdGlvbigpe1xyXG4gICAgdmFyIGFycj10aGlzLnNlbGVjdGVkT2JqZWN0cztcclxuICAgIHZhciB0d2luSURBcnI9W11cclxuICAgIGFyci5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIGlmIChlbGVtZW50Wyckc291cmNlSWQnXSkgcmV0dXJuO1xyXG4gICAgICAgIHR3aW5JREFyci5wdXNoKGVsZW1lbnRbJyRkdElkJ10pXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgd2hpbGUodHdpbklEQXJyLmxlbmd0aD4wKXtcclxuICAgICAgICB2YXIgc21hbGxBcnIgPSB0d2luSURBcnIuc3BsaWNlKDAsIDEwMCk7XHJcblxyXG4gICAgICAgIHZhciBrbm93blRhcmdldFR3aW5zID0ge31cclxuICAgICAgICBzbWFsbEFyci5mb3JFYWNoKG9uZUlEID0+IHtcclxuICAgICAgICAgICAga25vd25UYXJnZXRUd2luc1tvbmVJRF0gPSAxIC8vaXRzZWxmIGFsc28gaXMga25vd25cclxuICAgICAgICAgICAgdmFyIG91dEJvdW5kUmVsYXRpb24gPSBnbG9iYWxDYWNoZS5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbb25lSURdXHJcbiAgICAgICAgICAgIGlmIChvdXRCb3VuZFJlbGF0aW9uKSB7XHJcbiAgICAgICAgICAgICAgICBvdXRCb3VuZFJlbGF0aW9uLmZvckVhY2gob25lUmVsYXRpb24gPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB0YXJnZXRJRCA9IG9uZVJlbGF0aW9uW1wiJHRhcmdldElkXCJdXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3RhcmdldElEXSAhPSBudWxsKSBrbm93blRhcmdldFR3aW5zW3RhcmdldElEXSA9IDFcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vcXVlcnlPdXRCb3VuZFwiLCBcIlBPU1RcIiwgIHsgYXJyOiBzbWFsbEFyciwgXCJrbm93blRhcmdldHNcIjoga25vd25UYXJnZXRUd2lucyB9KVxyXG4gICAgICAgICAgICAvL25ldyB0d2luJ3MgcmVsYXRpb25zaGlwIHNob3VsZCBiZSBzdG9yZWQgYXMgd2VsbFxyXG4gICAgICAgICAgICBnbG9iYWxDYWNoZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzKGRhdGEubmV3VHdpblJlbGF0aW9ucylcclxuICAgICAgICAgICAgZGF0YS5jaGlsZFR3aW5zQW5kUmVsYXRpb25zLmZvckVhY2gob25lU2V0PT57XHJcbiAgICAgICAgICAgICAgICBmb3IodmFyIGluZCBpbiBvbmVTZXQuY2hpbGRUd2lucyl7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9uZVR3aW49b25lU2V0LmNoaWxkVHdpbnNbaW5kXVxyXG4gICAgICAgICAgICAgICAgICAgIGdsb2JhbENhY2hlLnN0b3JlU2luZ2xlQURUVHdpbihvbmVUd2luKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJkcmF3VHdpbnNBbmRSZWxhdGlvbnNcIixpbmZvOmRhdGF9KVxyXG4gICAgICAgIH1jYXRjaChlKXtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5zaG93SW5Cb3VuZD1hc3luYyBmdW5jdGlvbigpe1xyXG4gICAgdmFyIGFycj10aGlzLnNlbGVjdGVkT2JqZWN0cztcclxuICAgIHZhciB0d2luSURBcnI9W11cclxuICAgIGFyci5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIGlmIChlbGVtZW50Wyckc291cmNlSWQnXSkgcmV0dXJuO1xyXG4gICAgICAgIHR3aW5JREFyci5wdXNoKGVsZW1lbnRbJyRkdElkJ10pXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgd2hpbGUodHdpbklEQXJyLmxlbmd0aD4wKXtcclxuICAgICAgICB2YXIgc21hbGxBcnI9IHR3aW5JREFyci5zcGxpY2UoMCwgMTAwKTtcclxuICAgICAgICB2YXIga25vd25Tb3VyY2VUd2lucyA9IHt9XHJcbiAgICAgICAgdmFyIElERGljdCA9IHt9XHJcbiAgICAgICAgc21hbGxBcnIuZm9yRWFjaChvbmVJRCA9PiB7XHJcbiAgICAgICAgICAgIElERGljdFtvbmVJRF0gPSAxXHJcbiAgICAgICAgICAgIGtub3duU291cmNlVHdpbnNbb25lSURdID0gMSAvL2l0c2VsZiBhbHNvIGlzIGtub3duXHJcbiAgICAgICAgfSlcclxuICAgICAgICBmb3IgKHZhciB0d2luSUQgaW4gZ2xvYmFsQ2FjaGUuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzKSB7XHJcbiAgICAgICAgICAgIHZhciByZWxhdGlvbnMgPSBnbG9iYWxDYWNoZS5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbdHdpbklEXVxyXG4gICAgICAgICAgICByZWxhdGlvbnMuZm9yRWFjaChvbmVSZWxhdGlvbiA9PiB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0SUQgPSBvbmVSZWxhdGlvblsnJHRhcmdldElkJ11cclxuICAgICAgICAgICAgICAgIHZhciBzcmNJRCA9IG9uZVJlbGF0aW9uWyckc291cmNlSWQnXVxyXG4gICAgICAgICAgICAgICAgaWYgKElERGljdFt0YXJnZXRJRF0gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1tzcmNJRF0gIT0gbnVsbCkga25vd25Tb3VyY2VUd2luc1tzcmNJRF0gPSAxXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgIHZhciBkYXRhID0gYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vcXVlcnlJbkJvdW5kXCIsIFwiUE9TVFwiLCAgeyBhcnI6IHNtYWxsQXJyLCBcImtub3duU291cmNlc1wiOiBrbm93blNvdXJjZVR3aW5zIH0pXHJcbiAgICAgICAgICAgIC8vbmV3IHR3aW4ncyByZWxhdGlvbnNoaXAgc2hvdWxkIGJlIHN0b3JlZCBhcyB3ZWxsXHJcbiAgICAgICAgICAgIGdsb2JhbENhY2hlLnN0b3JlVHdpblJlbGF0aW9uc2hpcHMoZGF0YS5uZXdUd2luUmVsYXRpb25zKVxyXG4gICAgICAgICAgICBkYXRhLmNoaWxkVHdpbnNBbmRSZWxhdGlvbnMuZm9yRWFjaChvbmVTZXQ9PntcclxuICAgICAgICAgICAgICAgIGZvcih2YXIgaW5kIGluIG9uZVNldC5jaGlsZFR3aW5zKXtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgb25lVHdpbj1vbmVTZXQuY2hpbGRUd2luc1tpbmRdXHJcbiAgICAgICAgICAgICAgICAgICAgZ2xvYmFsQ2FjaGUuc3RvcmVTaW5nbGVBRFRUd2luKG9uZVR3aW4pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImRyYXdUd2luc0FuZFJlbGF0aW9uc1wiLGluZm86ZGF0YX0pXHJcbiAgICAgICAgfWNhdGNoKGUpe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmRyYXdNdWx0aXBsZU9iaj1mdW5jdGlvbigpe1xyXG4gICAgdmFyIG51bU9mRWRnZSA9IDA7XHJcbiAgICB2YXIgbnVtT2ZOb2RlID0gMDtcclxuICAgIHZhciBhcnI9dGhpcy5zZWxlY3RlZE9iamVjdHM7XHJcbiAgICBpZihhcnI9PW51bGwpIHJldHVybjtcclxuICAgIGFyci5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIGlmIChlbGVtZW50Wyckc291cmNlSWQnXSkgbnVtT2ZFZGdlKytcclxuICAgICAgICBlbHNlIG51bU9mTm9kZSsrXHJcbiAgICB9KTtcclxuICAgIHZhciB0ZXh0RGl2PSQoXCI8bGFiZWwgc3R5bGU9J2Rpc3BsYXk6YmxvY2s7bWFyZ2luLXRvcDoxMHB4Jz48L2xhYmVsPlwiKVxyXG4gICAgdGV4dERpdi50ZXh0KG51bU9mTm9kZSsgXCIgbm9kZVwiKygobnVtT2ZOb2RlPD0xKT9cIlwiOlwic1wiKStcIiwgXCIrbnVtT2ZFZGdlK1wiIHJlbGF0aW9uc2hpcFwiKygobnVtT2ZFZGdlPD0xKT9cIlwiOlwic1wiKSlcclxuICAgIHRoaXMuRE9NLmFwcGVuZCh0ZXh0RGl2KVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmRyYXdTdGF0aWNJbmZvPWZ1bmN0aW9uKHBhcmVudCxqc29uSW5mbyxwYWRkaW5nVG9wLGZvbnRTaXplKXtcclxuICAgIGZvcih2YXIgaW5kIGluIGpzb25JbmZvKXtcclxuICAgICAgICB2YXIga2V5RGl2PSAkKFwiPGxhYmVsIHN0eWxlPSdkaXNwbGF5OmJsb2NrJz48ZGl2IGNsYXNzPSd3My1ib3JkZXInIHN0eWxlPSdiYWNrZ3JvdW5kLWNvbG9yOiNmNmY2ZjY7ZGlzcGxheTppbmxpbmU7cGFkZGluZzouMWVtIC4zZW0gLjFlbSAuM2VtO21hcmdpbi1yaWdodDouM2VtJz5cIitpbmQrXCI8L2Rpdj48L2xhYmVsPlwiKVxyXG4gICAgICAgIGtleURpdi5jc3Moe1wiZm9udFNpemVcIjpmb250U2l6ZSxcImNvbG9yXCI6XCJkYXJrR3JheVwifSlcclxuICAgICAgICBwYXJlbnQuYXBwZW5kKGtleURpdilcclxuICAgICAgICBrZXlEaXYuY3NzKFwicGFkZGluZy10b3BcIixwYWRkaW5nVG9wKVxyXG5cclxuICAgICAgICB2YXIgY29udGVudERPTT0kKFwiPGxhYmVsPjwvbGFiZWw+XCIpXHJcbiAgICAgICAgaWYodHlwZW9mKGpzb25JbmZvW2luZF0pPT09XCJvYmplY3RcIikge1xyXG4gICAgICAgICAgICBjb250ZW50RE9NLmNzcyhcImRpc3BsYXlcIixcImJsb2NrXCIpXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwicGFkZGluZy1sZWZ0XCIsXCIxZW1cIilcclxuICAgICAgICAgICAgdGhpcy5kcmF3U3RhdGljSW5mbyhjb250ZW50RE9NLGpzb25JbmZvW2luZF0sXCIuNWVtXCIsZm9udFNpemUpXHJcbiAgICAgICAgfWVsc2Uge1xyXG4gICAgICAgICAgICBjb250ZW50RE9NLmNzcyhcInBhZGRpbmctdG9wXCIsXCIuMmVtXCIpXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00udGV4dChqc29uSW5mb1tpbmRdKVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb250ZW50RE9NLmNzcyh7XCJmb250U2l6ZVwiOmZvbnRTaXplLFwiY29sb3JcIjpcImJsYWNrXCJ9KVxyXG4gICAgICAgIGtleURpdi5hcHBlbmQoY29udGVudERPTSlcclxuICAgIH1cclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5kcmF3RWRpdGFibGU9ZnVuY3Rpb24ocGFyZW50LGpzb25JbmZvLG9yaWdpbkVsZW1lbnRJbmZvLHBhdGhBcnIpe1xyXG4gICAgaWYoanNvbkluZm89PW51bGwpIHJldHVybjtcclxuICAgIGZvcih2YXIgaW5kIGluIGpzb25JbmZvKXtcclxuICAgICAgICB2YXIga2V5RGl2PSAkKFwiPGxhYmVsIHN0eWxlPSdkaXNwbGF5OmJsb2NrJz48ZGl2IHN0eWxlPSdkaXNwbGF5OmlubGluZTtwYWRkaW5nOi4xZW0gLjNlbSAuMWVtIC4zZW07IGZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6YmxhY2snPlwiK2luZCtcIjwvZGl2PjwvbGFiZWw+XCIpXHJcbiAgICAgICAgcGFyZW50LmFwcGVuZChrZXlEaXYpXHJcbiAgICAgICAgXHJcbiAgICAgICAga2V5RGl2LmNzcyhcInBhZGRpbmctdG9wXCIsXCIuM2VtXCIpIFxyXG5cclxuICAgICAgICB2YXIgY29udGVudERPTT0kKFwiPGxhYmVsIHN0eWxlPSdwYWRkaW5nLXRvcDouMmVtJz48L2xhYmVsPlwiKVxyXG4gICAgICAgIHZhciBuZXdQYXRoPXBhdGhBcnIuY29uY2F0KFtpbmRdKVxyXG4gICAgICAgIGlmKEFycmF5LmlzQXJyYXkoanNvbkluZm9baW5kXSkpe1xyXG4gICAgICAgICAgICB0aGlzLmRyYXdEcm9wZG93bk9wdGlvbihjb250ZW50RE9NLG5ld1BhdGgsanNvbkluZm9baW5kXSxvcmlnaW5FbGVtZW50SW5mbylcclxuICAgICAgICB9ZWxzZSBpZih0eXBlb2YoanNvbkluZm9baW5kXSk9PT1cIm9iamVjdFwiKSB7XHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwiZGlzcGxheVwiLFwiYmxvY2tcIilcclxuICAgICAgICAgICAgY29udGVudERPTS5jc3MoXCJwYWRkaW5nLWxlZnRcIixcIjFlbVwiKVxyXG4gICAgICAgICAgICB0aGlzLmRyYXdFZGl0YWJsZShjb250ZW50RE9NLGpzb25JbmZvW2luZF0sb3JpZ2luRWxlbWVudEluZm8sbmV3UGF0aClcclxuICAgICAgICB9ZWxzZSB7XHJcbiAgICAgICAgICAgIHZhciBhSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJwYWRkaW5nOjJweDt3aWR0aDo1MCU7b3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lXCIgcGxhY2Vob2xkZXI9XCJ0eXBlOiAnK2pzb25JbmZvW2luZF0rJ1wiLz4nKS5hZGRDbGFzcyhcInczLWlucHV0IHczLWJvcmRlclwiKTsgIFxyXG4gICAgICAgICAgICBjb250ZW50RE9NLmFwcGVuZChhSW5wdXQpXHJcbiAgICAgICAgICAgIHZhciB2YWw9dGhpcy5zZWFyY2hWYWx1ZShvcmlnaW5FbGVtZW50SW5mbyxuZXdQYXRoKVxyXG4gICAgICAgICAgICBpZih2YWwhPW51bGwpIGFJbnB1dC52YWwodmFsKVxyXG4gICAgICAgICAgICBhSW5wdXQuZGF0YShcInBhdGhcIiwgbmV3UGF0aClcclxuICAgICAgICAgICAgYUlucHV0LmRhdGEoXCJkYXRhVHlwZVwiLCBqc29uSW5mb1tpbmRdKVxyXG4gICAgICAgICAgICBhSW5wdXQuY2hhbmdlKChlKT0+e1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lZGl0RFRQcm9wZXJ0eShvcmlnaW5FbGVtZW50SW5mbywkKGUudGFyZ2V0KS5kYXRhKFwicGF0aFwiKSwkKGUudGFyZ2V0KS52YWwoKSwkKGUudGFyZ2V0KS5kYXRhKFwiZGF0YVR5cGVcIikpXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGtleURpdi5hcHBlbmQoY29udGVudERPTSlcclxuICAgIH1cclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5kcmF3RHJvcGRvd25PcHRpb249ZnVuY3Rpb24oY29udGVudERPTSxuZXdQYXRoLHZhbHVlQXJyLG9yaWdpbkVsZW1lbnRJbmZvKXtcclxuICAgIHZhciBhU2VsZWN0TWVudT1uZXcgc2ltcGxlU2VsZWN0TWVudShcIlwiLHtidXR0b25DU1M6e1wicGFkZGluZ1wiOlwiNHB4IDE2cHhcIn19KVxyXG4gICAgY29udGVudERPTS5hcHBlbmQoYVNlbGVjdE1lbnUuRE9NKVxyXG4gICAgYVNlbGVjdE1lbnUuRE9NLmRhdGEoXCJwYXRoXCIsIG5ld1BhdGgpXHJcbiAgICB2YWx1ZUFyci5mb3JFYWNoKChvbmVPcHRpb24pPT57XHJcbiAgICAgICAgdmFyIHN0ciA9b25lT3B0aW9uW1wiZGlzcGxheU5hbWVcIl0gIHx8IG9uZU9wdGlvbltcImVudW1WYWx1ZVwiXSBcclxuICAgICAgICBhU2VsZWN0TWVudS5hZGRPcHRpb24oc3RyKVxyXG4gICAgfSlcclxuICAgIGFTZWxlY3RNZW51LmNhbGxCYWNrX2NsaWNrT3B0aW9uPShvcHRpb25UZXh0LG9wdGlvblZhbHVlLHJlYWxNb3VzZUNsaWNrKT0+e1xyXG4gICAgICAgIGFTZWxlY3RNZW51LmNoYW5nZU5hbWUob3B0aW9uVGV4dClcclxuICAgICAgICBpZihyZWFsTW91c2VDbGljaykgdGhpcy5lZGl0RFRQcm9wZXJ0eShvcmlnaW5FbGVtZW50SW5mbyxhU2VsZWN0TWVudS5ET00uZGF0YShcInBhdGhcIiksb3B0aW9uVmFsdWUsXCJzdHJpbmdcIilcclxuICAgIH1cclxuICAgIHZhciB2YWw9dGhpcy5zZWFyY2hWYWx1ZShvcmlnaW5FbGVtZW50SW5mbyxuZXdQYXRoKVxyXG4gICAgaWYodmFsIT1udWxsKXtcclxuICAgICAgICBhU2VsZWN0TWVudS50cmlnZ2VyT3B0aW9uVmFsdWUodmFsKVxyXG4gICAgfSAgICBcclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5lZGl0RFRQcm9wZXJ0eT1hc3luYyBmdW5jdGlvbihvcmlnaW5FbGVtZW50SW5mbyxwYXRoLG5ld1ZhbCxkYXRhVHlwZSl7XHJcbiAgICBpZihbXCJkb3VibGVcIixcImJvb2xlYW5cIixcImZsb2F0XCIsXCJpbnRlZ2VyXCIsXCJsb25nXCJdLmluY2x1ZGVzKGRhdGFUeXBlKSkgbmV3VmFsPU51bWJlcihuZXdWYWwpXHJcblxyXG4gICAgLy97IFwib3BcIjogXCJhZGRcIiwgXCJwYXRoXCI6IFwiL3hcIiwgXCJ2YWx1ZVwiOiAzMCB9XHJcbiAgICBpZihwYXRoLmxlbmd0aD09MSl7XHJcbiAgICAgICAgdmFyIHN0cj1cIlwiXHJcbiAgICAgICAgcGF0aC5mb3JFYWNoKHNlZ21lbnQ9PntzdHIrPVwiL1wiK3NlZ21lbnR9KVxyXG4gICAgICAgIHZhciBqc29uUGF0Y2g9WyB7IFwib3BcIjogXCJhZGRcIiwgXCJwYXRoXCI6IHN0ciwgXCJ2YWx1ZVwiOiBuZXdWYWx9IF1cclxuICAgIH1lbHNle1xyXG4gICAgICAgIC8vaXQgaXMgYSBwcm9wZXJ0eSBpbnNpZGUgYSBvYmplY3QgdHlwZSBvZiByb290IHByb3BlcnR5LHVwZGF0ZSB0aGUgd2hvbGUgcm9vdCBwcm9wZXJ0eVxyXG4gICAgICAgIHZhciByb290UHJvcGVydHk9cGF0aFswXVxyXG4gICAgICAgIHZhciBwYXRjaFZhbHVlPSBvcmlnaW5FbGVtZW50SW5mb1tyb290UHJvcGVydHldXHJcbiAgICAgICAgaWYocGF0Y2hWYWx1ZT09bnVsbCkgcGF0Y2hWYWx1ZT17fVxyXG4gICAgICAgIGVsc2UgcGF0Y2hWYWx1ZT1KU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHBhdGNoVmFsdWUpKSAvL21ha2UgYSBjb3B5XHJcbiAgICAgICAgdGhpcy51cGRhdGVPcmlnaW5PYmplY3RWYWx1ZShwYXRjaFZhbHVlLHBhdGguc2xpY2UoMSksbmV3VmFsKVxyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBqc29uUGF0Y2g9WyB7IFwib3BcIjogXCJhZGRcIiwgXCJwYXRoXCI6IFwiL1wiK3Jvb3RQcm9wZXJ0eSwgXCJ2YWx1ZVwiOiBwYXRjaFZhbHVlfSBdXHJcbiAgICB9XHJcblxyXG4gICAgaWYob3JpZ2luRWxlbWVudEluZm9bXCIkZHRJZFwiXSl7IC8vZWRpdCBhIG5vZGUgcHJvcGVydHlcclxuICAgICAgICB2YXIgdHdpbklEID0gb3JpZ2luRWxlbWVudEluZm9bXCIkZHRJZFwiXVxyXG4gICAgICAgIHZhciBwYXlMb2FkPXtcImpzb25QYXRjaFwiOkpTT04uc3RyaW5naWZ5KGpzb25QYXRjaCksXCJ0d2luSURcIjp0d2luSUR9XHJcbiAgICB9ZWxzZSBpZihvcmlnaW5FbGVtZW50SW5mb1tcIiRyZWxhdGlvbnNoaXBJZFwiXSl7IC8vZWRpdCBhIHJlbGF0aW9uc2hpcCBwcm9wZXJ0eVxyXG4gICAgICAgIHZhciB0d2luSUQgPSBvcmlnaW5FbGVtZW50SW5mb1tcIiRzb3VyY2VJZFwiXVxyXG4gICAgICAgIHZhciByZWxhdGlvbnNoaXBJRCA9IG9yaWdpbkVsZW1lbnRJbmZvW1wiJHJlbGF0aW9uc2hpcElkXCJdXHJcbiAgICAgICAgdmFyIHBheUxvYWQ9e1wianNvblBhdGNoXCI6SlNPTi5zdHJpbmdpZnkoanNvblBhdGNoKSxcInR3aW5JRFwiOnR3aW5JRCxcInJlbGF0aW9uc2hpcElEXCI6cmVsYXRpb25zaGlwSUR9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIFxyXG4gICAgdHJ5e1xyXG4gICAgICAgIGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2NoYW5nZUF0dHJpYnV0ZVwiLCBcIlBPU1RcIiwgcGF5TG9hZClcclxuICAgICAgICB0aGlzLnVwZGF0ZU9yaWdpbk9iamVjdFZhbHVlKG9yaWdpbkVsZW1lbnRJbmZvLHBhdGgsbmV3VmFsKVxyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgfVxyXG4gICAgXHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUudXBkYXRlT3JpZ2luT2JqZWN0VmFsdWU9ZnVuY3Rpb24obm9kZUluZm8scGF0aEFycixuZXdWYWwpe1xyXG4gICAgaWYocGF0aEFyci5sZW5ndGg9PTApIHJldHVybjtcclxuICAgIHZhciB0aGVKc29uPW5vZGVJbmZvXHJcbiAgICBmb3IodmFyIGk9MDtpPHBhdGhBcnIubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIGtleT1wYXRoQXJyW2ldXHJcblxyXG4gICAgICAgIGlmKGk9PXBhdGhBcnIubGVuZ3RoLTEpe1xyXG4gICAgICAgICAgICB0aGVKc29uW2tleV09bmV3VmFsXHJcbiAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKHRoZUpzb25ba2V5XT09bnVsbCkgdGhlSnNvbltrZXldPXt9XHJcbiAgICAgICAgdGhlSnNvbj10aGVKc29uW2tleV1cclxuICAgIH1cclxuICAgIHJldHVyblxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLnNlYXJjaFZhbHVlPWZ1bmN0aW9uKG9yaWdpbkVsZW1lbnRJbmZvLHBhdGhBcnIpe1xyXG4gICAgaWYocGF0aEFyci5sZW5ndGg9PTApIHJldHVybiBudWxsO1xyXG4gICAgdmFyIHRoZUpzb249b3JpZ2luRWxlbWVudEluZm9cclxuICAgIGZvcih2YXIgaT0wO2k8cGF0aEFyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIga2V5PXBhdGhBcnJbaV1cclxuICAgICAgICB0aGVKc29uPXRoZUpzb25ba2V5XVxyXG4gICAgICAgIGlmKHRoZUpzb249PW51bGwpIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoZUpzb24gLy9pdCBzaG91bGQgYmUgdGhlIGZpbmFsIHZhbHVlXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IGluZm9QYW5lbCgpOyIsImNvbnN0IHN0YXJ0U2VsZWN0aW9uRGlhbG9nID0gcmVxdWlyZShcIi4vc3RhcnRTZWxlY3Rpb25EaWFsb2dcIilcclxuY29uc3QgbW9kZWxNYW5hZ2VyRGlhbG9nID0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL21vZGVsTWFuYWdlckRpYWxvZ1wiKVxyXG5jb25zdCBlZGl0TGF5b3V0RGlhbG9nPSByZXF1aXJlKFwiLi9lZGl0TGF5b3V0RGlhbG9nXCIpXHJcbmNvbnN0IHNpbXBsZVNlbGVjdE1lbnU9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9zaW1wbGVTZWxlY3RNZW51XCIpXHJcbmNvbnN0IGdsb2JhbENhY2hlID0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL2dsb2JhbENhY2hlXCIpXHJcbmNvbnN0IG1vZHVsZVN3aXRjaERpYWxvZz1yZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvbW9kdWxlU3dpdGNoRGlhbG9nXCIpXHJcblxyXG5mdW5jdGlvbiBtYWluVG9vbGJhcigpIHtcclxufVxyXG5cclxubWFpblRvb2xiYXIucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICQoXCIjbWFpblRvb2xCYXJcIikuYWRkQ2xhc3MoXCJ3My1iYXIgdzMtcmVkXCIpXHJcbiAgICAkKFwiI21haW5Ub29sQmFyXCIpLmNzcyh7XCJ6LWluZGV4XCI6MTAwLFwib3ZlcmZsb3dcIjpcInZpc2libGVcIn0pXHJcblxyXG4gICAgdGhpcy5zd2l0Y2hBRFRJbnN0YW5jZUJ0bj0kKCc8YSBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvblwiIGhyZWY9XCIjXCI+U291cmNlPC9hPicpXHJcbiAgICB0aGlzLm1vZGVsSU9CdG49JCgnPGEgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b25cIiBocmVmPVwiI1wiPk1vZGVsczwvYT4nKVxyXG4gICAgdGhpcy5zaG93Rm9yZ2VWaWV3QnRuPSQoJzxhIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWhvdmVyLW5vbmUgdzMtdGV4dC1saWdodC1ncmV5IHczLWhvdmVyLXRleHQtbGlnaHQtZ3JleVwiIHN0eWxlPVwib3BhY2l0eTouMzVcIiBocmVmPVwiI1wiPkZvcmdlVmlldzwvYT4nKVxyXG4gICAgdGhpcy5zaG93R0lTVmlld0J0bj0kKCc8YSBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ob3Zlci1ub25lIHczLXRleHQtbGlnaHQtZ3JleSB3My1ob3Zlci10ZXh0LWxpZ2h0LWdyZXlcIiBzdHlsZT1cIm9wYWNpdHk6LjM1XCIgaHJlZj1cIiNcIj5HSVNWaWV3PC9hPicpXHJcbiAgICB0aGlzLmVkaXRMYXlvdXRCdG49JCgnPGEgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b25cIiBocmVmPVwiI1wiPjxpIGNsYXNzPVwiZmEgZmEtZWRpdFwiPjwvaT48L2E+JylcclxuXHJcbiAgICB0aGlzLnRlc3RTaWduYWxSQnRuPSQoJzxhIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWFtYmVyXCIgaHJlZj1cIiNcIj5UZXN0IFNpZ25hbFI8L2E+JylcclxuICAgIHRoaXMudGVzdFNlbmRTaWduYWxSQnRuPSQoJzxhIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWFtYmVyXCIgaHJlZj1cIiNcIj5zZW5kIFNpZ25hbFIgbWVzc2FnZTwvYT4nKVxyXG5cclxuXHJcbiAgICB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yPW5ldyBzaW1wbGVTZWxlY3RNZW51KFwiTGF5b3V0XCIpXHJcblxyXG4gICAgJChcIiNtYWluVG9vbEJhclwiKS5lbXB0eSgpXHJcbiAgICAkKFwiI21haW5Ub29sQmFyXCIpLmFwcGVuZChtb2R1bGVTd2l0Y2hEaWFsb2cubW9kdWxlc1NpZGViYXIpXHJcbiAgICAkKFwiI21haW5Ub29sQmFyXCIpLmFwcGVuZChtb2R1bGVTd2l0Y2hEaWFsb2cubW9kdWxlc1N3aXRjaEJ1dHRvbiwgdGhpcy5zd2l0Y2hBRFRJbnN0YW5jZUJ0bix0aGlzLm1vZGVsSU9CdG4sdGhpcy5zaG93Rm9yZ2VWaWV3QnRuLHRoaXMuc2hvd0dJU1ZpZXdCdG5cclxuICAgICAgICAsdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5ET00sdGhpcy5lZGl0TGF5b3V0QnRuKVxyXG4gICAgICAgIC8vLHRoaXMudGVzdFNpZ25hbFJCdG4sdGhpcy50ZXN0U2VuZFNpZ25hbFJCdG5cclxuXHJcbiAgICB0aGlzLnN3aXRjaEFEVEluc3RhbmNlQnRuLm9uKFwiY2xpY2tcIiwoKT0+eyBzdGFydFNlbGVjdGlvbkRpYWxvZy5wb3B1cCgpIH0pXHJcbiAgICB0aGlzLm1vZGVsSU9CdG4ub24oXCJjbGlja1wiLCgpPT57IG1vZGVsTWFuYWdlckRpYWxvZy5wb3B1cCgpIH0pXHJcbiAgICB0aGlzLmVkaXRMYXlvdXRCdG4ub24oXCJjbGlja1wiLCgpPT57IGVkaXRMYXlvdXREaWFsb2cucG9wdXAoKSB9KVxyXG5cclxuXHJcbiAgICB0aGlzLnRlc3RTZW5kU2lnbmFsUkJ0bi5vbihcImNsaWNrXCIsYXN5bmMgKCk9PntcclxuICAgICAgICBjb25zdCBtc2FsSGVscGVyPXJlcXVpcmUoXCIuLi9tc2FsSGVscGVyXCIpXHJcbiAgICAgICAgdmFyIHJlID0gYXdhaXQgbXNhbEhlbHBlci5jYWxsQXp1cmVGdW5jdGlvbnNTZXJ2aWNlKFwibWVzc2FnZXNcIixcIlBPU1RcIix7XHJcbiAgICAgICAgICAgIHJlY2lwaWVudDogXCI1ZWI4MWY1Zi1mZDllLTQ4MWQtOTk2Yi00ZDBiOTUzNmY0NzdcIixcclxuICAgICAgICAgICAgdGV4dDogXCJob3cgZG8geW91IGRvXCJcclxuICAgICAgICAgIH0pXHJcbiAgICB9KVxyXG4gICAgdGhpcy50ZXN0U2lnbmFsUkJ0bi5vbihcImNsaWNrXCIsYXN5bmMgKCk9PntcclxuICAgICAgICBjb25zdCBtc2FsSGVscGVyPXJlcXVpcmUoXCIuLi9tc2FsSGVscGVyXCIpXHJcbiAgICAgICAgdmFyIHNpZ25hbFJJbmZvID0gYXdhaXQgbXNhbEhlbHBlci5jYWxsQXp1cmVGdW5jdGlvbnNTZXJ2aWNlKFwibmVnb3RpYXRlP25hbWU9ZmZcIixcIkdFVFwiKVxyXG4gICAgICAgIGNvbnN0IGNvbm5lY3Rpb24gPSBuZXcgc2lnbmFsUi5IdWJDb25uZWN0aW9uQnVpbGRlcigpXHJcbiAgICAgICAgLndpdGhVcmwoc2lnbmFsUkluZm8udXJsLCB7YWNjZXNzVG9rZW5GYWN0b3J5OiAoKSA9PiBzaWduYWxSSW5mby5hY2Nlc3NUb2tlbn0pXHJcbiAgICAgICAgLy8uY29uZmlndXJlTG9nZ2luZyhzaWduYWxSLkxvZ0xldmVsLkluZm9ybWF0aW9uKVxyXG4gICAgICAgIC5jb25maWd1cmVMb2dnaW5nKHNpZ25hbFIuTG9nTGV2ZWwuV2FybmluZylcclxuICAgICAgICAuYnVpbGQoKTtcclxuICAgICAgICBjb25zb2xlLmxvZyhzaWduYWxSSW5mby5hY2Nlc3NUb2tlbilcclxuXHJcbiAgICAgICAgY29ubmVjdGlvbi5vbignbmV3TWVzc2FnZScsIChtZXNzYWdlKT0+e1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhtZXNzYWdlKVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGNvbm5lY3Rpb24ub25jbG9zZSgoKSA9PiBjb25zb2xlLmxvZygnZGlzY29ubmVjdGVkJykpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdjb25uZWN0aW5nLi4uJyk7XHJcbiAgICAgICAgY29ubmVjdGlvbi5zdGFydCgpXHJcbiAgICAgICAgICAudGhlbigoKSA9PiBjb25zb2xlLmxvZygnY29ubmVjdGVkIScpKVxyXG4gICAgICAgICAgLmNhdGNoKGNvbnNvbGUuZXJyb3IpO1xyXG4gICAgfSlcclxuXHJcblxyXG4gICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jYWxsQmFja19jbGlja09wdGlvbj0ob3B0aW9uVGV4dCxvcHRpb25WYWx1ZSk9PntcclxuICAgICAgICBnbG9iYWxDYWNoZS5jdXJyZW50TGF5b3V0TmFtZT1vcHRpb25WYWx1ZVxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImxheW91dENoYW5nZVwifSlcclxuICAgICAgICBpZihvcHRpb25WYWx1ZT09XCJbTkFdXCIpIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuY2hhbmdlTmFtZShcIkxheW91dFwiLFwiXCIpXHJcbiAgICAgICAgZWxzZSB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmNoYW5nZU5hbWUoXCJMYXlvdXQ6XCIsb3B0aW9uVGV4dClcclxuICAgIH1cclxufVxyXG5cclxubWFpblRvb2xiYXIucHJvdG90eXBlLnVwZGF0ZUxheW91dFNlbGVjdG9yID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGN1clNlbGVjdD10aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmN1clNlbGVjdFZhbFxyXG4gICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jbGVhck9wdGlvbnMoKVxyXG4gICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5hZGRPcHRpb24oJ1tObyBMYXlvdXQgU3BlY2lmaWVkXScsJ1tOQV0nKVxyXG5cclxuICAgIGZvciAodmFyIGluZCBpbiBnbG9iYWxDYWNoZS5sYXlvdXRKU09OKSB7XHJcbiAgICAgICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5hZGRPcHRpb24oaW5kKVxyXG4gICAgfVxyXG5cclxuICAgIGlmKGN1clNlbGVjdCE9bnVsbCAmJiB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmZpbmRPcHRpb24oY3VyU2VsZWN0KT09bnVsbCkgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jaGFuZ2VOYW1lKFwiTGF5b3V0XCIsXCJcIilcclxufVxyXG5cclxubWFpblRvb2xiYXIucHJvdG90eXBlLnJ4TWVzc2FnZT1mdW5jdGlvbihtc2dQYXlsb2FkKXtcclxuICAgIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJsYXlvdXRzVXBkYXRlZFwiKSB7XHJcbiAgICAgICAgdGhpcy51cGRhdGVMYXlvdXRTZWxlY3RvcigpXHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IG1haW5Ub29sYmFyKCk7IiwiY29uc3QgZ2xvYmFsQXBwU2V0dGluZ3MgPSByZXF1aXJlKFwiLi4vZ2xvYmFsQXBwU2V0dGluZ3NcIilcclxuY29uc3QgbXNhbEhlbHBlcj1yZXF1aXJlKFwiLi4vbXNhbEhlbHBlclwiKVxyXG5jb25zdCBnbG9iYWxDYWNoZSA9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9nbG9iYWxDYWNoZVwiKVxyXG5cclxuZnVuY3Rpb24gc3RhcnRTZWxlY3Rpb25EaWFsb2coKSB7XHJcbiAgICBpZighdGhpcy5ET00pe1xyXG4gICAgICAgIHRoaXMuRE9NID0gJCgnPGRpdiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7YmFja2dyb3VuZC1jb2xvcjp3aGl0ZTtsZWZ0OjUwJTt0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSkgdHJhbnNsYXRlWSgtNTAlKTt6LWluZGV4Ojk5XCIgY2xhc3M9XCJ3My1jYXJkLTJcIj48L2Rpdj4nKVxyXG4gICAgICAgICQoXCJib2R5XCIpLmFwcGVuZCh0aGlzLkRPTSlcclxuICAgICAgICB0aGlzLkRPTS5oaWRlKClcclxuICAgIH1cclxufVxyXG5cclxuc3RhcnRTZWxlY3Rpb25EaWFsb2cucHJvdG90eXBlLnBvcHVwID0gYXN5bmMgZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLkRPTS5zaG93KClcclxuICAgIHRoaXMuRE9NLmVtcHR5KClcclxuICAgIHRoaXMuY29udGVudERPTSA9ICQoJzxkaXYgc3R5bGU9XCJ3aWR0aDo2NjVweFwiPjwvZGl2PicpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQodGhpcy5jb250ZW50RE9NKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwiaGVpZ2h0OjQwcHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cImZvbnQtc2l6ZToxLjVlbVwiPlNlbGVjdCBUd2luczwvZGl2PjwvZGl2PicpKVxyXG4gICAgdmFyIGNsb3NlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yaWdodFwiIHN0eWxlPVwiZm9udC1zaXplOjJlbTtwYWRkaW5nLXRvcDo0cHhcIj7DlzwvYnV0dG9uPicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZChjbG9zZUJ1dHRvbilcclxuXHJcbiAgICB0aGlzLmJ1dHRvbkhvbGRlciA9ICQoXCI8ZGl2IHN0eWxlPSdoZWlnaHQ6MTAwJSc+PC9kaXY+XCIpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZCh0aGlzLmJ1dHRvbkhvbGRlcilcclxuICAgIGNsb3NlQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgIHRoaXMudXNlU3RhcnRTZWxlY3Rpb24oXCJhcHBlbmRcIilcclxuICAgICAgICB0aGlzLmNsb3NlRGlhbG9nKCkgXHJcbiAgICB9KVxyXG5cclxuICAgIHZhciByZXBsYWNlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1jYXJkIHczLWRlZXAtb3JhbmdlIHczLWhvdmVyLWdyZWVuXCIgc3R5bGU9XCJoZWlnaHQ6MTAwJTsgbWFyZ2luLXJpZ2h0OjhweFwiPlJlcGxhY2UgQWxsIERhdGE8L2J1dHRvbj4nKVxyXG4gICAgdmFyIGFwcGVuZEJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtY2FyZCB3My1kZWVwLW9yYW5nZSB3My1ob3Zlci1ncmVlblwiIHN0eWxlPVwiaGVpZ2h0OjEwMCVcIj5BcHBlbmQgRGF0YTwvYnV0dG9uPicpXHJcblxyXG4gICAgcmVwbGFjZUJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHsgdGhpcy51c2VTdGFydFNlbGVjdGlvbihcInJlcGxhY2VcIikgfSlcclxuICAgIGFwcGVuZEJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHsgdGhpcy51c2VTdGFydFNlbGVjdGlvbihcImFwcGVuZFwiKSB9KVxyXG4gICAgdGhpcy5idXR0b25Ib2xkZXIuYXBwZW5kKHJlcGxhY2VCdXR0b24sIGFwcGVuZEJ1dHRvbilcclxuXHJcbiAgICB2YXIgcGFuZWxIZWlnaHQ9NDUwXHJcbiAgICB2YXIgcm93Mj0kKCc8ZGl2IGNsYXNzPVwidzMtY2VsbC1yb3dcIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmFwcGVuZChyb3cyKVxyXG4gICAgdmFyIGxlZnRTcGFuPSQoJzxkaXYgc3R5bGU9XCJwYWRkaW5nOjVweDt3aWR0aDoyMzBweDtwYWRkaW5nLXJpZ2h0OjVweDtvdmVyZmxvdzpoaWRkZW5cIj48L2Rpdj4nKVxyXG4gICAgcm93Mi5hcHBlbmQobGVmdFNwYW4pXHJcbiAgICB0aGlzLmxlZnRTcGFuPWxlZnRTcGFuXHJcblxyXG4gICAgdmFyIHJpZ2h0U3Bhbj0kKCc8ZGl2IGNsYXNzPVwidzMtY29udGFpbmVyIHczLWNlbGxcIiBzdHlsZT1cInBhZGRpbmctdG9wOjEwcHg7XCI+PC9kaXY+JylcclxuICAgIHJvdzIuYXBwZW5kKHJpZ2h0U3BhbikgXHJcbiAgICByaWdodFNwYW4uYXBwZW5kKCQoJzxkaXYgY2xhc3M9XCJ3My1jb250YWluZXIgdzMtY2FyZFwiIHN0eWxlPVwiY29sb3I6Z3JheTtoZWlnaHQ6JysocGFuZWxIZWlnaHQtMTApKydweDtvdmVyZmxvdzphdXRvO3dpZHRoOjQxMHB4O1wiPjwvZGl2PicpKVxyXG4gICAgdmFyIHNlbGVjdGVkVHdpbnNET009JChcIjx0YWJsZSBzdHlsZT0nd2lkdGg6MTAwJSc+PC90YWJsZT5cIilcclxuICAgIHNlbGVjdGVkVHdpbnNET00uY3NzKHtcImJvcmRlci1jb2xsYXBzZVwiOlwiY29sbGFwc2VcIn0pXHJcbiAgICByaWdodFNwYW4uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZChzZWxlY3RlZFR3aW5zRE9NKVxyXG4gICAgdGhpcy5zZWxlY3RlZFR3aW5zRE9NPXNlbGVjdGVkVHdpbnNET00gXHJcblxyXG4gICAgdGhpcy5sZWZ0U3Bhbi5hcHBlbmQoJCgnPGRpdiBjbGFzcz1cInczLWJhclwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbSB3My10b29sdGlwXCIgc3R5bGU9XCJmb250LXNpemU6MS4yZW07cGFkZGluZy1sZWZ0OjJweDtmb250LXdlaWdodDpib2xkO2NvbG9yOmdyYXlcIj5TZWxlY3QgVHdpbnMgZnJvbTxwIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dGV4dC1hbGlnbjpsZWZ0O2ZvbnQtd2VpZ2h0Om5vcm1hbDt0b3A6LTEwcHg7d2lkdGg6MjAwcHhcIiBjbGFzcz1cInczLXRleHQgdzMtdGFnIHczLXRpbnlcIj5jaG9vc2Ugb25lIG9yIG1vcmUgbW9kZWxzPC9wPjwvZGl2PjwvZGl2PicpKVxyXG5cclxuICAgIHRoaXMubW9kZWxzQ2hlY2tCb3hlcz0kKCc8Zm9ybSBjbGFzcz1cInczLWNvbnRhaW5lciB3My1ib3JkZXJcIiBzdHlsZT1cImhlaWdodDonKyhwYW5lbEhlaWdodC00MCkrJ3B4O292ZXJmbG93OmF1dG9cIj48L2Zvcm0+JylcclxuICAgIGxlZnRTcGFuLmFwcGVuZCh0aGlzLm1vZGVsc0NoZWNrQm94ZXMpXHJcbiAgICB0aGlzLmZpbGxBdmFpbGFibGVNb2RlbHMoKVxyXG5cclxuICAgIHRoaXMubGlzdFR3aW5zKClcclxufVxyXG5cclxuc3RhcnRTZWxlY3Rpb25EaWFsb2cucHJvdG90eXBlLmNsb3NlRGlhbG9nPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLkRPTS5oaWRlKClcclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInN0YXJ0U2VsZWN0aW9uRGlhbG9nX2Nsb3NlZFwifSlcclxufVxyXG5cclxuc3RhcnRTZWxlY3Rpb25EaWFsb2cucHJvdG90eXBlLmZpbGxBdmFpbGFibGVNb2RlbHMgPSBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMubW9kZWxzQ2hlY2tCb3hlcy5hcHBlbmQoJzxpbnB1dCBjbGFzcz1cInczLWNoZWNrXCIgdHlwZT1cImNoZWNrYm94XCIgaWQ9XCJBTExcIj48bGFiZWwgc3R5bGU9XCJwYWRkaW5nLWxlZnQ6NXB4XCI+PGI+QUxMPC9iPjwvbGFiZWw+PHAvPicpXHJcbiAgICBnbG9iYWxDYWNoZS5EQk1vZGVsc0Fyci5mb3JFYWNoKG9uZU1vZGVsPT57XHJcbiAgICAgICAgdmFyIG1vZGVsTmFtZT1vbmVNb2RlbFtcImRpc3BsYXlOYW1lXCJdXHJcbiAgICAgICAgdmFyIG1vZGVsSUQ9b25lTW9kZWxbXCJpZFwiXVxyXG4gICAgICAgIHRoaXMubW9kZWxzQ2hlY2tCb3hlcy5hcHBlbmQoYDxpbnB1dCBjbGFzcz1cInczLWNoZWNrXCIgdHlwZT1cImNoZWNrYm94XCIgaWQ9XCIke21vZGVsSUR9XCI+PGxhYmVsIHN0eWxlPVwicGFkZGluZy1sZWZ0OjVweFwiPiR7bW9kZWxOYW1lfTwvbGFiZWw+PHAvPmApXHJcbiAgICB9KVxyXG4gICAgdGhpcy5tb2RlbHNDaGVja0JveGVzLm9uKFwiY2hhbmdlXCIsKGV2dCk9PntcclxuICAgICAgICBpZigkKGV2dC50YXJnZXQpLmF0dHIoXCJpZFwiKT09XCJBTExcIil7XHJcbiAgICAgICAgICAgIC8vc2VsZWN0IGFsbCB0aGUgb3RoZXIgaW5wdXRcclxuICAgICAgICAgICAgdmFyIHZhbD0kKGV2dC50YXJnZXQpLnByb3AoXCJjaGVja2VkXCIpXHJcbiAgICAgICAgICAgIHRoaXMubW9kZWxzQ2hlY2tCb3hlcy5jaGlsZHJlbignaW5wdXQnKS5lYWNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICQodGhpcykucHJvcChcImNoZWNrZWRcIix2YWwpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmxpc3RUd2lucygpXHJcbiAgICB9KVxyXG59XHJcblxyXG5zdGFydFNlbGVjdGlvbkRpYWxvZy5wcm90b3R5cGUuZ2V0U2VsZWN0ZWRUd2lucz1mdW5jdGlvbigpe1xyXG4gICAgdmFyIHJlQXJyPVtdXHJcbiAgICB2YXIgY2hvc2VuTW9kZWxzPXt9XHJcbiAgICB0aGlzLm1vZGVsc0NoZWNrQm94ZXMuY2hpbGRyZW4oJ2lucHV0JykuZWFjaChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgaWYoISQodGhpcykucHJvcChcImNoZWNrZWRcIikpIHJldHVybjtcclxuICAgICAgICBpZigkKHRoaXMpLmF0dHIoXCJpZFwiKT09XCJBTExcIikgcmV0dXJuO1xyXG4gICAgICAgIGNob3Nlbk1vZGVsc1skKHRoaXMpLmF0dHIoXCJpZFwiKV09MVxyXG4gICAgfSk7XHJcbiAgICBnbG9iYWxDYWNoZS5EQlR3aW5zQXJyLmZvckVhY2goYVR3aW49PntcclxuICAgICAgICBpZihjaG9zZW5Nb2RlbHNbYVR3aW5bXCJtb2RlbElEXCJdXSkgIHJlQXJyLnB1c2goYVR3aW4pXHJcbiAgICB9KVxyXG4gICAgcmV0dXJuIHJlQXJyO1xyXG59XHJcblxyXG5zdGFydFNlbGVjdGlvbkRpYWxvZy5wcm90b3R5cGUubGlzdFR3aW5zPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLnNlbGVjdGVkVHdpbnNET00uZW1wdHkoKVxyXG4gICAgdmFyIHRyPSQoJzx0cj48dGQgc3R5bGU9XCJib3JkZXItcmlnaHQ6c29saWQgMXB4IGxpZ2h0Z3JleTtib3JkZXItYm90dG9tOnNvbGlkIDFweCBsaWdodGdyZXk7Zm9udC13ZWlnaHQ6Ym9sZFwiPklEPC90ZD48dGQgc3R5bGU9XCJib3JkZXItYm90dG9tOnNvbGlkIDFweCBsaWdodGdyZXk7Zm9udC13ZWlnaHQ6Ym9sZFwiPk1PREVMPC90ZD48L3RyPicpXHJcbiAgICB0aGlzLnNlbGVjdGVkVHdpbnNET00uYXBwZW5kKHRyKVxyXG5cclxuICAgIHZhciBzZWxlY3RlZFR3aW5zPXRoaXMuZ2V0U2VsZWN0ZWRUd2lucygpXHJcbiAgICBzZWxlY3RlZFR3aW5zLmZvckVhY2goYVR3aW49PntcclxuICAgICAgICB2YXIgdHI9JCgnPHRyPjx0ZCBzdHlsZT1cImJvcmRlci1yaWdodDpzb2xpZCAxcHggbGlnaHRncmV5O2JvcmRlci1ib3R0b206c29saWQgMXB4IGxpZ2h0Z3JleVwiPicrYVR3aW5bXCJkaXNwbGF5TmFtZVwiXSsnPC90ZD48dGQgc3R5bGU9XCJib3JkZXItYm90dG9tOnNvbGlkIDFweCBsaWdodGdyZXlcIj4nK2FUd2luWydtb2RlbElEJ10rJzwvdGQ+PC90cj4nKVxyXG4gICAgICAgIHRoaXMuc2VsZWN0ZWRUd2luc0RPTS5hcHBlbmQodHIpXHJcbiAgICB9KVxyXG4gICAgaWYoc2VsZWN0ZWRUd2lucy5sZW5ndGg9PTApe1xyXG4gICAgICAgIHZhciB0cj0kKCc8dHI+PHRkIHN0eWxlPVwiY29sb3I6Z3JheVwiPnplcm8gcmVjb3JkPC90ZD48dGQ+PC90ZD48L3RyPicpXHJcbiAgICAgICAgdGhpcy5zZWxlY3RlZFR3aW5zRE9NLmFwcGVuZCh0cikgICAgXHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5zdGFydFNlbGVjdGlvbkRpYWxvZy5wcm90b3R5cGUudXNlU3RhcnRTZWxlY3Rpb249ZnVuY3Rpb24oYWN0aW9uKXtcclxuICAgIHZhciBzZWxlY3RlZFR3aW5zPXRoaXMuZ2V0U2VsZWN0ZWRUd2lucygpXHJcbiAgICB2YXIgdHdpbklEcz1bXVxyXG4gICAgc2VsZWN0ZWRUd2lucy5mb3JFYWNoKGFUd2luPT57dHdpbklEcy5wdXNoKGFUd2luW1wiaWRcIl0pfSlcclxuXHJcbiAgICB2YXIgbW9kZWxJRHM9W11cclxuICAgIGdsb2JhbENhY2hlLkRCTW9kZWxzQXJyLmZvckVhY2gob25lTW9kZWw9Pnttb2RlbElEcy5wdXNoKG9uZU1vZGVsW1wiaWRcIl0pfSlcclxuXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJzdGFydFNlbGVjdGlvbl9cIithY3Rpb24sIFwidHdpbklEc1wiOiB0d2luSURzLFwibW9kZWxJRHNcIjptb2RlbElEcyB9KVxyXG4gICAgdGhpcy5jbG9zZURpYWxvZygpXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IHN0YXJ0U2VsZWN0aW9uRGlhbG9nKCk7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuY29uc3QgbW9kZWxBbmFseXplciA9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9tb2RlbEFuYWx5emVyXCIpO1xyXG5jb25zdCBzaW1wbGVTZWxlY3RNZW51ID0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL3NpbXBsZVNlbGVjdE1lbnVcIilcclxuY29uc3Qgc2ltcGxlQ29uZmlybURpYWxvZyA9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9zaW1wbGVDb25maXJtRGlhbG9nXCIpXHJcbmNvbnN0IGdsb2JhbENhY2hlID0gcmVxdWlyZShcIi4uL3NoYXJlZFNvdXJjZUZpbGVzL2dsb2JhbENhY2hlXCIpXHJcbmNvbnN0IG1zYWxIZWxwZXI9cmVxdWlyZShcIi4uL21zYWxIZWxwZXJcIilcclxuXHJcbmZ1bmN0aW9uIHRvcG9sb2d5RE9NKERPTSl7XHJcbiAgICB0aGlzLkRPTT1ET01cclxuICAgIHRoaXMuZGVmYXVsdE5vZGVTaXplPTMwXHJcbiAgICB0aGlzLm5vZGVTaXplTW9kZWxBZGp1c3RtZW50UmF0aW89e31cclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmluaXQ9ZnVuY3Rpb24oKXtcclxuICAgIGN5dG9zY2FwZS53YXJuaW5ncyhmYWxzZSkgIFxyXG4gICAgdGhpcy5jb3JlID0gY3l0b3NjYXBlKHtcclxuICAgICAgICBjb250YWluZXI6ICB0aGlzLkRPTVswXSwgLy8gY29udGFpbmVyIHRvIHJlbmRlciBpblxyXG5cclxuICAgICAgICAvLyBpbml0aWFsIHZpZXdwb3J0IHN0YXRlOlxyXG4gICAgICAgIHpvb206IDEsXHJcbiAgICAgICAgcGFuOiB7IHg6IDAsIHk6IDAgfSxcclxuXHJcbiAgICAgICAgLy8gaW50ZXJhY3Rpb24gb3B0aW9uczpcclxuICAgICAgICBtaW5ab29tOiAwLjEsXHJcbiAgICAgICAgbWF4Wm9vbTogMTAsXHJcbiAgICAgICAgem9vbWluZ0VuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgdXNlclpvb21pbmdFbmFibGVkOiB0cnVlLFxyXG4gICAgICAgIHBhbm5pbmdFbmFibGVkOiB0cnVlLFxyXG4gICAgICAgIHVzZXJQYW5uaW5nRW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICBib3hTZWxlY3Rpb25FbmFibGVkOiB0cnVlLFxyXG4gICAgICAgIHNlbGVjdGlvblR5cGU6ICdzaW5nbGUnLFxyXG4gICAgICAgIHRvdWNoVGFwVGhyZXNob2xkOiA4LFxyXG4gICAgICAgIGRlc2t0b3BUYXBUaHJlc2hvbGQ6IDQsXHJcbiAgICAgICAgYXV0b2xvY2s6IGZhbHNlLFxyXG4gICAgICAgIGF1dG91bmdyYWJpZnk6IGZhbHNlLFxyXG4gICAgICAgIGF1dG91bnNlbGVjdGlmeTogZmFsc2UsXHJcblxyXG4gICAgICAgIC8vIHJlbmRlcmluZyBvcHRpb25zOlxyXG4gICAgICAgIGhlYWRsZXNzOiBmYWxzZSxcclxuICAgICAgICBzdHlsZUVuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgaGlkZUVkZ2VzT25WaWV3cG9ydDogZmFsc2UsXHJcbiAgICAgICAgdGV4dHVyZU9uVmlld3BvcnQ6IGZhbHNlLFxyXG4gICAgICAgIG1vdGlvbkJsdXI6IGZhbHNlLFxyXG4gICAgICAgIG1vdGlvbkJsdXJPcGFjaXR5OiAwLjIsXHJcbiAgICAgICAgd2hlZWxTZW5zaXRpdml0eTogMC4zLFxyXG4gICAgICAgIHBpeGVsUmF0aW86ICdhdXRvJyxcclxuXHJcbiAgICAgICAgZWxlbWVudHM6IFtdLCAvLyBsaXN0IG9mIGdyYXBoIGVsZW1lbnRzIHRvIHN0YXJ0IHdpdGhcclxuXHJcbiAgICAgICAgc3R5bGU6IFsgLy8gdGhlIHN0eWxlc2hlZXQgZm9yIHRoZSBncmFwaFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxlY3RvcjogJ25vZGUnLFxyXG4gICAgICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICBcIndpZHRoXCI6dGhpcy5kZWZhdWx0Tm9kZVNpemUsXCJoZWlnaHRcIjp0aGlzLmRlZmF1bHROb2RlU2l6ZSxcclxuICAgICAgICAgICAgICAgICAgICAnbGFiZWwnOiAnZGF0YShpZCknLFxyXG4gICAgICAgICAgICAgICAgICAgICdvcGFjaXR5JzowLjksXHJcbiAgICAgICAgICAgICAgICAgICAgJ2ZvbnQtc2l6ZSc6XCIxMnB4XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgJ2ZvbnQtZmFtaWx5JzonR2VuZXZhLCBBcmlhbCwgSGVsdmV0aWNhLCBzYW5zLXNlcmlmJ1xyXG4gICAgICAgICAgICAgICAgICAgIC8vLCdiYWNrZ3JvdW5kLWltYWdlJzogZnVuY3Rpb24oZWxlKXsgcmV0dXJuIFwiaW1hZ2VzL2NhdC5wbmdcIjsgfVxyXG4gICAgICAgICAgICAgICAgICAgIC8vLCdiYWNrZ3JvdW5kLWZpdCc6J2NvbnRhaW4nIC8vY292ZXJcclxuICAgICAgICAgICAgICAgICAgICAvLydiYWNrZ3JvdW5kLWNvbG9yJzogZnVuY3Rpb24oIGVsZSApeyByZXR1cm4gZWxlLmRhdGEoJ2JnJykgfVxyXG4gICAgICAgICAgICAgICAgICAgICwnYmFja2dyb3VuZC13aWR0aCc6JzcwJSdcclxuICAgICAgICAgICAgICAgICAgICAsJ2JhY2tncm91bmQtaGVpZ2h0JzonNzAlJ1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxlY3RvcjogJ2VkZ2UnLFxyXG4gICAgICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAnd2lkdGgnOjIsXHJcbiAgICAgICAgICAgICAgICAgICAgJ2xpbmUtY29sb3InOiAnIzg4OCcsXHJcbiAgICAgICAgICAgICAgICAgICAgJ3RhcmdldC1hcnJvdy1jb2xvcic6ICcjNTU1JyxcclxuICAgICAgICAgICAgICAgICAgICAndGFyZ2V0LWFycm93LXNoYXBlJzogJ3RyaWFuZ2xlJyxcclxuICAgICAgICAgICAgICAgICAgICAnY3VydmUtc3R5bGUnOiAnYmV6aWVyJyxcclxuICAgICAgICAgICAgICAgICAgICAnYXJyb3ctc2NhbGUnOjAuNlxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7c2VsZWN0b3I6ICdlZGdlOnNlbGVjdGVkJyxcclxuICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6IDMsXHJcbiAgICAgICAgICAgICAgICAnbGluZS1jb2xvcic6ICdyZWQnLFxyXG4gICAgICAgICAgICAgICAgJ3RhcmdldC1hcnJvdy1jb2xvcic6ICdyZWQnLFxyXG4gICAgICAgICAgICAgICAgJ3NvdXJjZS1hcnJvdy1jb2xvcic6ICdyZWQnLFxyXG4gICAgICAgICAgICAgICAgJ2xpbmUtZmlsbCc6XCJsaW5lYXItZ3JhZGllbnRcIixcclxuICAgICAgICAgICAgICAgICdsaW5lLWdyYWRpZW50LXN0b3AtY29sb3JzJzpbJ2N5YW4nLCAnbWFnZW50YScsICd5ZWxsb3cnXSxcclxuICAgICAgICAgICAgICAgICdsaW5lLWdyYWRpZW50LXN0b3AtcG9zaXRpb25zJzpbJzAlJywnNzAlJywnMTAwJSddXHJcbiAgICAgICAgICAgIH19LFxyXG4gICAgICAgICAgICB7c2VsZWN0b3I6ICdub2RlOnNlbGVjdGVkJyxcclxuICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICdib3JkZXItY29sb3InOlwicmVkXCIsXHJcbiAgICAgICAgICAgICAgICAnYm9yZGVyLXdpZHRoJzoyLFxyXG4gICAgICAgICAgICAgICAgJ2JhY2tncm91bmQtZmlsbCc6J3JhZGlhbC1ncmFkaWVudCcsXHJcbiAgICAgICAgICAgICAgICAnYmFja2dyb3VuZC1ncmFkaWVudC1zdG9wLWNvbG9ycyc6WydjeWFuJywgJ21hZ2VudGEnLCAneWVsbG93J10sXHJcbiAgICAgICAgICAgICAgICAnYmFja2dyb3VuZC1ncmFkaWVudC1zdG9wLXBvc2l0aW9ucyc6WycwJScsJzUwJScsJzYwJSddXHJcbiAgICAgICAgICAgIH19LFxyXG4gICAgICAgICAgICB7c2VsZWN0b3I6ICdub2RlLmhvdmVyJyxcclxuICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kLWJsYWNrZW4nOjAuNVxyXG4gICAgICAgICAgICB9fVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLHtzZWxlY3RvcjogJ2VkZ2UuaG92ZXInLFxyXG4gICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzo1XHJcbiAgICAgICAgICAgIH19XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIF1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vY3l0b3NjYXBlIGVkZ2UgZWRpdGluZyBwbHVnLWluXHJcbiAgICB0aGlzLmNvcmUuZWRnZUVkaXRpbmcoe1xyXG4gICAgICAgIHVuZG9hYmxlOiB0cnVlLFxyXG4gICAgICAgIGJlbmRSZW1vdmFsU2Vuc2l0aXZpdHk6IDE2LFxyXG4gICAgICAgIGVuYWJsZU11bHRpcGxlQW5jaG9yUmVtb3ZhbE9wdGlvbjogdHJ1ZSxcclxuICAgICAgICBzdGlja3lBbmNob3JUb2xlcmVuY2U6IDIwLFxyXG4gICAgICAgIGFuY2hvclNoYXBlU2l6ZUZhY3RvcjogNSxcclxuICAgICAgICBlbmFibGVBbmNob3JTaXplTm90SW1wYWN0Qnlab29tOnRydWUsXHJcbiAgICAgICAgZW5hYmxlUmVtb3ZlQW5jaG9yTWlkT2ZOZWFyTGluZTpmYWxzZSxcclxuICAgICAgICBlbmFibGVDcmVhdGVBbmNob3JPbkRyYWc6ZmFsc2VcclxuICAgIH0pO1xyXG5cclxuICAgIFxyXG4gICAgdGhpcy5jb3JlLmJveFNlbGVjdGlvbkVuYWJsZWQodHJ1ZSlcclxuXHJcblxyXG4gICAgdGhpcy5jb3JlLm9uKCd0YXBzZWxlY3QnLCAoKT0+e3RoaXMuc2VsZWN0RnVuY3Rpb24oKX0pO1xyXG4gICAgdGhpcy5jb3JlLm9uKCd0YXB1bnNlbGVjdCcsICgpPT57dGhpcy5zZWxlY3RGdW5jdGlvbigpfSk7XHJcblxyXG4gICAgdGhpcy5jb3JlLm9uKCdib3hlbmQnLChlKT0+ey8vcHV0IGluc2lkZSBib3hlbmQgZXZlbnQgdG8gdHJpZ2dlciBvbmx5IG9uZSB0aW1lLCBhbmQgcmVwbGVhdGx5IGFmdGVyIGVhY2ggYm94IHNlbGVjdFxyXG4gICAgICAgIHRoaXMuY29yZS5vbmUoJ2JveHNlbGVjdCcsKCk9Pnt0aGlzLnNlbGVjdEZ1bmN0aW9uKCl9KVxyXG4gICAgfSlcclxuXHJcbiAgICB0aGlzLmNvcmUub24oJ2N4dHRhcCcsKGUpPT57XHJcbiAgICAgICAgdGhpcy5jYW5jZWxUYXJnZXROb2RlTW9kZSgpXHJcbiAgICB9KVxyXG5cclxuICAgIHRoaXMuY29yZS5vbignbW91c2VvdmVyJyxlPT57XHJcblxyXG4gICAgICAgIHRoaXMubW91c2VPdmVyRnVuY3Rpb24oZSlcclxuICAgIH0pXHJcbiAgICB0aGlzLmNvcmUub24oJ21vdXNlb3V0JyxlPT57XHJcbiAgICAgICAgdGhpcy5tb3VzZU91dEZ1bmN0aW9uKGUpXHJcbiAgICB9KVxyXG4gICAgXHJcbiAgICB0aGlzLmNvcmUub24oJ3pvb20nLChlKT0+e1xyXG4gICAgICAgIHZhciBmcz10aGlzLmdldEZvbnRTaXplSW5DdXJyZW50Wm9vbSgpO1xyXG4gICAgICAgIHZhciBkaW1lbnNpb249dGhpcy5nZXROb2RlU2l6ZUluQ3VycmVudFpvb20oKTtcclxuICAgICAgICB0aGlzLmNvcmUuc3R5bGUoKVxyXG4gICAgICAgICAgICAuc2VsZWN0b3IoJ25vZGUnKVxyXG4gICAgICAgICAgICAuc3R5bGUoeyAnZm9udC1zaXplJzogZnMsIHdpZHRoOiBkaW1lbnNpb24sIGhlaWdodDogZGltZW5zaW9uIH0pXHJcbiAgICAgICAgICAgIC51cGRhdGUoKVxyXG4gICAgICAgIGZvciAodmFyIG1vZGVsSUQgaW4gdGhpcy5ub2RlU2l6ZU1vZGVsQWRqdXN0bWVudFJhdGlvKSB7XHJcbiAgICAgICAgICAgIHZhciBuZXdEaW1lbnNpb24gPSBNYXRoLmNlaWwodGhpcy5ub2RlU2l6ZU1vZGVsQWRqdXN0bWVudFJhdGlvW21vZGVsSURdICogZGltZW5zaW9uKVxyXG4gICAgICAgICAgICB0aGlzLmNvcmUuc3R5bGUoKVxyXG4gICAgICAgICAgICAgICAgLnNlbGVjdG9yKCdub2RlW21vZGVsSUQgPSBcIicgKyBtb2RlbElEICsgJ1wiXScpXHJcbiAgICAgICAgICAgICAgICAuc3R5bGUoeyB3aWR0aDogbmV3RGltZW5zaW9uLCBoZWlnaHQ6IG5ld0RpbWVuc2lvbiB9KVxyXG4gICAgICAgICAgICAgICAgLnVwZGF0ZSgpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuY29yZS5zdHlsZSgpXHJcbiAgICAgICAgICAgIC5zZWxlY3Rvcignbm9kZTpzZWxlY3RlZCcpXHJcbiAgICAgICAgICAgIC5zdHlsZSh7ICdib3JkZXItd2lkdGgnOiBNYXRoLmNlaWwoZGltZW5zaW9uIC8gMTUpIH0pXHJcbiAgICAgICAgICAgIC51cGRhdGUoKVxyXG4gICAgfSlcclxuXHJcbiAgICB2YXIgaW5zdGFuY2UgPSB0aGlzLmNvcmUuZWRnZUVkaXRpbmcoJ2dldCcpO1xyXG4gICAgdmFyIHRhcGRyYWdIYW5kbGVyPShlKSA9PiB7XHJcbiAgICAgICAgaW5zdGFuY2Uua2VlcEFuY2hvcnNBYnNvbHV0ZVBvc2l0aW9uRHVyaW5nTW92aW5nKClcclxuICAgICAgICBpZihlLnRhcmdldC5pc05vZGUgJiYgZS50YXJnZXQuaXNOb2RlKCkpIHRoaXMuZHJhZ2dpbmdOb2RlPWUudGFyZ2V0XHJcbiAgICAgICAgdGhpcy5zbWFydFBvc2l0aW9uTm9kZShlLnBvc2l0aW9uKVxyXG4gICAgfVxyXG4gICAgdmFyIHNldE9uZVRpbWVHcmFiID0gKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuY29yZS5vbmNlKFwiZ3JhYlwiLCAoZSkgPT4ge1xyXG4gICAgICAgICAgICB2YXIgZHJhZ2dpbmdOb2RlcyA9IHRoaXMuY29yZS5jb2xsZWN0aW9uKClcclxuICAgICAgICAgICAgaWYgKGUudGFyZ2V0LmlzTm9kZSgpKSBkcmFnZ2luZ05vZGVzLm1lcmdlKGUudGFyZ2V0KVxyXG4gICAgICAgICAgICB2YXIgYXJyID0gdGhpcy5jb3JlLiQoXCI6c2VsZWN0ZWRcIilcclxuICAgICAgICAgICAgYXJyLmZvckVhY2goKGVsZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGVsZS5pc05vZGUoKSkgZHJhZ2dpbmdOb2Rlcy5tZXJnZShlbGUpXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIGluc3RhbmNlLnN0b3JlQW5jaG9yc0Fic29sdXRlUG9zaXRpb24oZHJhZ2dpbmdOb2RlcylcclxuICAgICAgICAgICAgdGhpcy5jb3JlLm9uKFwidGFwZHJhZ1wiLHRhcGRyYWdIYW5kbGVyIClcclxuICAgICAgICAgICAgc2V0T25lVGltZUZyZWUoKVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbiAgICB2YXIgc2V0T25lVGltZUZyZWUgPSAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5jb3JlLm9uY2UoXCJmcmVlXCIsIChlKSA9PiB7XHJcbiAgICAgICAgICAgIHZhciBpbnN0YW5jZSA9IHRoaXMuY29yZS5lZGdlRWRpdGluZygnZ2V0Jyk7XHJcbiAgICAgICAgICAgIGluc3RhbmNlLnJlc2V0QW5jaG9yc0Fic29sdXRlUG9zaXRpb24oKVxyXG4gICAgICAgICAgICB0aGlzLmRyYWdnaW5nTm9kZT1udWxsXHJcbiAgICAgICAgICAgIHNldE9uZVRpbWVHcmFiKClcclxuICAgICAgICAgICAgdGhpcy5jb3JlLnJlbW92ZUxpc3RlbmVyKFwidGFwZHJhZ1wiLHRhcGRyYWdIYW5kbGVyKVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbiAgICBzZXRPbmVUaW1lR3JhYigpXHJcbiAgICB0aGlzLmNvcmUudHJpZ2dlcihcInpvb21cIilcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnNtYXJ0UG9zaXRpb25Ob2RlID0gZnVuY3Rpb24gKG1vdXNlUG9zaXRpb24pIHtcclxuICAgIHZhciB6b29tTGV2ZWw9dGhpcy5jb3JlLnpvb20oKVxyXG4gICAgaWYoIXRoaXMuZHJhZ2dpbmdOb2RlKSByZXR1cm5cclxuICAgIC8vY29tcGFyaW5nIG5vZGVzIHNldDogaXRzIGNvbm5lY3Rmcm9tIG5vZGVzIGFuZCB0aGVpciBjb25uZWN0dG8gbm9kZXMsIGl0cyBjb25uZWN0dG8gbm9kZXMgYW5kIHRoZWlyIGNvbm5lY3Rmcm9tIG5vZGVzXHJcbiAgICB2YXIgaW5jb21lcnM9dGhpcy5kcmFnZ2luZ05vZGUuaW5jb21lcnMoKVxyXG4gICAgdmFyIG91dGVyRnJvbUluY29tPSBpbmNvbWVycy5vdXRnb2VycygpXHJcbiAgICB2YXIgb3V0ZXI9dGhpcy5kcmFnZ2luZ05vZGUub3V0Z29lcnMoKVxyXG4gICAgdmFyIGluY29tRnJvbU91dGVyPW91dGVyLmluY29tZXJzKClcclxuICAgIHZhciBtb25pdG9yU2V0PWluY29tZXJzLnVuaW9uKG91dGVyRnJvbUluY29tKS51bmlvbihvdXRlcikudW5pb24oaW5jb21Gcm9tT3V0ZXIpLmZpbHRlcignbm9kZScpLnVubWVyZ2UodGhpcy5kcmFnZ2luZ05vZGUpXHJcblxyXG4gICAgdmFyIHJldHVybkV4cGVjdGVkUG9zPShkaWZmQXJyLHBvc0Fycik9PntcclxuICAgICAgICB2YXIgbWluRGlzdGFuY2U9TWF0aC5taW4oLi4uZGlmZkFycilcclxuICAgICAgICBpZihtaW5EaXN0YW5jZSp6b29tTGV2ZWwgPCAxMCkgIHJldHVybiBwb3NBcnJbZGlmZkFyci5pbmRleE9mKG1pbkRpc3RhbmNlKV1cclxuICAgICAgICBlbHNlIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciB4RGlmZj1bXVxyXG4gICAgdmFyIHhQb3M9W11cclxuICAgIHZhciB5RGlmZj1bXVxyXG4gICAgdmFyIHlQb3M9W11cclxuICAgIG1vbml0b3JTZXQuZm9yRWFjaCgoZWxlKT0+e1xyXG4gICAgICAgIHhEaWZmLnB1c2goTWF0aC5hYnMoZWxlLnBvc2l0aW9uKCkueC1tb3VzZVBvc2l0aW9uLngpKVxyXG4gICAgICAgIHhQb3MucHVzaChlbGUucG9zaXRpb24oKS54KVxyXG4gICAgICAgIHlEaWZmLnB1c2goTWF0aC5hYnMoZWxlLnBvc2l0aW9uKCkueS1tb3VzZVBvc2l0aW9uLnkpKVxyXG4gICAgICAgIHlQb3MucHVzaChlbGUucG9zaXRpb24oKS55KVxyXG4gICAgfSlcclxuICAgIHZhciBwcmVmWD1yZXR1cm5FeHBlY3RlZFBvcyh4RGlmZix4UG9zKVxyXG4gICAgdmFyIHByZWZZPXJldHVybkV4cGVjdGVkUG9zKHlEaWZmLHlQb3MpXHJcbiAgICBpZihwcmVmWCE9bnVsbCkge1xyXG4gICAgICAgIHRoaXMuZHJhZ2dpbmdOb2RlLnBvc2l0aW9uKCd4JywgcHJlZlgpO1xyXG4gICAgfVxyXG4gICAgaWYocHJlZlkhPW51bGwpIHtcclxuICAgICAgICB0aGlzLmRyYWdnaW5nTm9kZS5wb3NpdGlvbigneScsIHByZWZZKTtcclxuICAgIH1cclxuICAgIC8vY29uc29sZS5sb2coXCItLS0tXCIpXHJcbiAgICAvL21vbml0b3JTZXQuZm9yRWFjaCgoZWxlKT0+e2NvbnNvbGUubG9nKGVsZS5pZCgpKX0pXHJcbiAgICAvL2NvbnNvbGUubG9nKG1vbml0b3JTZXQuc2l6ZSgpKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUubW91c2VPdmVyRnVuY3Rpb249IGZ1bmN0aW9uIChlKSB7XHJcbiAgICBpZighZS50YXJnZXQuZGF0YSkgcmV0dXJuXHJcbiAgICBcclxuICAgIHZhciBpbmZvPWUudGFyZ2V0LmRhdGEoKS5vcmlnaW5hbEluZm9cclxuICAgIGlmKGluZm89PW51bGwpIHJldHVybjtcclxuICAgIGlmKHRoaXMubGFzdEhvdmVyVGFyZ2V0KSB0aGlzLmxhc3RIb3ZlclRhcmdldC5yZW1vdmVDbGFzcyhcImhvdmVyXCIpXHJcbiAgICB0aGlzLmxhc3RIb3ZlclRhcmdldD1lLnRhcmdldFxyXG4gICAgZS50YXJnZXQuYWRkQ2xhc3MoXCJob3ZlclwiKVxyXG4gICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwic2hvd0luZm9TZWxlY3RlZE5vZGVzXCIsIFwiaW5mb1wiOiBbaW5mb10gfSlcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLm1vdXNlT3V0RnVuY3Rpb249IGZ1bmN0aW9uIChlKSB7XHJcbiAgICB0aGlzLnNlbGVjdEZ1bmN0aW9uKClcclxuICAgIGlmKHRoaXMubGFzdEhvdmVyVGFyZ2V0KXtcclxuICAgICAgICB0aGlzLmxhc3RIb3ZlclRhcmdldC5yZW1vdmVDbGFzcyhcImhvdmVyXCIpXHJcbiAgICAgICAgdGhpcy5sYXN0SG92ZXJUYXJnZXQ9bnVsbDtcclxuICAgIH0gXHJcblxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuc2VsZWN0RnVuY3Rpb24gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgYXJyID0gdGhpcy5jb3JlLiQoXCI6c2VsZWN0ZWRcIilcclxuICAgIHZhciByZSA9IFtdXHJcbiAgICBhcnIuZm9yRWFjaCgoZWxlKSA9PiB7IHJlLnB1c2goZWxlLmRhdGEoKS5vcmlnaW5hbEluZm8pIH0pXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJzaG93SW5mb1NlbGVjdGVkTm9kZXNcIiwgaW5mbzogcmUgfSlcclxuXHJcbiAgICAvL2ZvciBkZWJ1Z2dpbmcgcHVycG9zZVxyXG4gICAgLy9hcnIuZm9yRWFjaCgoZWxlKT0+e1xyXG4gICAgLy8gIGNvbnNvbGUubG9nKFwiXCIpXHJcbiAgICAvL30pXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5nZXRGb250U2l6ZUluQ3VycmVudFpvb209ZnVuY3Rpb24oKXtcclxuICAgIHZhciBjdXJab29tPXRoaXMuY29yZS56b29tKClcclxuICAgIGlmKGN1clpvb20+MSl7XHJcbiAgICAgICAgdmFyIG1heEZTPTEyXHJcbiAgICAgICAgdmFyIG1pbkZTPTVcclxuICAgICAgICB2YXIgcmF0aW89IChtYXhGUy9taW5GUy0xKS85KihjdXJab29tLTEpKzFcclxuICAgICAgICB2YXIgZnM9TWF0aC5jZWlsKG1heEZTL3JhdGlvKVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgdmFyIG1heEZTPTEyMFxyXG4gICAgICAgIHZhciBtaW5GUz0xMlxyXG4gICAgICAgIHZhciByYXRpbz0gKG1heEZTL21pbkZTLTEpLzkqKDEvY3VyWm9vbS0xKSsxXHJcbiAgICAgICAgdmFyIGZzPU1hdGguY2VpbChtaW5GUypyYXRpbylcclxuICAgIH1cclxuICAgIHJldHVybiBmcztcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmdldE5vZGVTaXplSW5DdXJyZW50Wm9vbT1mdW5jdGlvbigpe1xyXG4gICAgdmFyIGN1clpvb209dGhpcy5jb3JlLnpvb20oKVxyXG4gICAgaWYoY3VyWm9vbT4xKXsvL3NjYWxlIHVwIGJ1dCBub3QgdG9vIG11Y2hcclxuICAgICAgICB2YXIgcmF0aW89IChjdXJab29tLTEpKigyLTEpLzkrMVxyXG4gICAgICAgIHJldHVybiBNYXRoLmNlaWwodGhpcy5kZWZhdWx0Tm9kZVNpemUvcmF0aW8pXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB2YXIgcmF0aW89ICgxL2N1clpvb20tMSkqKDQtMSkvOSsxXHJcbiAgICAgICAgcmV0dXJuIE1hdGguY2VpbCh0aGlzLmRlZmF1bHROb2RlU2l6ZSpyYXRpbylcclxuICAgIH1cclxufVxyXG5cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS51cGRhdGVNb2RlbEF2YXJ0YT1mdW5jdGlvbihtb2RlbElELGRhdGFVcmwpe1xyXG4gICAgdHJ5e1xyXG4gICAgICAgIHRoaXMuY29yZS5zdHlsZSgpIFxyXG4gICAgICAgIC5zZWxlY3Rvcignbm9kZVttb2RlbElEID0gXCInK21vZGVsSUQrJ1wiXScpXHJcbiAgICAgICAgLnN0eWxlKHsnYmFja2dyb3VuZC1pbWFnZSc6IGRhdGFVcmx9KVxyXG4gICAgICAgIC51cGRhdGUoKSAgIFxyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIFxyXG4gICAgfVxyXG4gICAgXHJcbn1cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnVwZGF0ZU1vZGVsVHdpbkNvbG9yPWZ1bmN0aW9uKG1vZGVsSUQsY29sb3JDb2RlKXtcclxuICAgIHRoaXMuY29yZS5zdHlsZSgpXHJcbiAgICAgICAgLnNlbGVjdG9yKCdub2RlW21vZGVsSUQgPSBcIicrbW9kZWxJRCsnXCJdJylcclxuICAgICAgICAuc3R5bGUoeydiYWNrZ3JvdW5kLWNvbG9yJzogY29sb3JDb2RlfSlcclxuICAgICAgICAudXBkYXRlKCkgICBcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnVwZGF0ZU1vZGVsVHdpblNoYXBlPWZ1bmN0aW9uKG1vZGVsSUQsc2hhcGUpe1xyXG4gICAgaWYoc2hhcGU9PVwiaGV4YWdvblwiKXtcclxuICAgICAgICB0aGlzLmNvcmUuc3R5bGUoKVxyXG4gICAgICAgIC5zZWxlY3Rvcignbm9kZVttb2RlbElEID0gXCInK21vZGVsSUQrJ1wiXScpXHJcbiAgICAgICAgLnN0eWxlKHsnc2hhcGUnOiAncG9seWdvbicsJ3NoYXBlLXBvbHlnb24tcG9pbnRzJzpbMCwtMSwwLjg2NiwtMC41LDAuODY2LDAuNSwwLDEsLTAuODY2LDAuNSwtMC44NjYsLTAuNV19KVxyXG4gICAgICAgIC51cGRhdGUoKSAgIFxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgdGhpcy5jb3JlLnN0eWxlKClcclxuICAgICAgICAuc2VsZWN0b3IoJ25vZGVbbW9kZWxJRCA9IFwiJyttb2RlbElEKydcIl0nKVxyXG4gICAgICAgIC5zdHlsZSh7J3NoYXBlJzogc2hhcGV9KVxyXG4gICAgICAgIC51cGRhdGUoKSAgIFxyXG4gICAgfVxyXG4gICAgXHJcbn1cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnVwZGF0ZU1vZGVsVHdpbkRpbWVuc2lvbj1mdW5jdGlvbihtb2RlbElELGRpbWVuc2lvblJhdGlvKXtcclxuICAgIHRoaXMubm9kZVNpemVNb2RlbEFkanVzdG1lbnRSYXRpb1ttb2RlbElEXT1wYXJzZUZsb2F0KGRpbWVuc2lvblJhdGlvKVxyXG4gICAgdGhpcy5jb3JlLnRyaWdnZXIoXCJ6b29tXCIpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS51cGRhdGVSZWxhdGlvbnNoaXBDb2xvcj1mdW5jdGlvbihzcmNNb2RlbElELHJlbGF0aW9uc2hpcE5hbWUsY29sb3JDb2RlKXtcclxuICAgIHRoaXMuY29yZS5zdHlsZSgpXHJcbiAgICAgICAgLnNlbGVjdG9yKCdlZGdlW3NvdXJjZU1vZGVsID0gXCInK3NyY01vZGVsSUQrJ1wiXVtyZWxhdGlvbnNoaXBOYW1lID0gXCInK3JlbGF0aW9uc2hpcE5hbWUrJ1wiXScpXHJcbiAgICAgICAgLnN0eWxlKHsnbGluZS1jb2xvcic6IGNvbG9yQ29kZX0pXHJcbiAgICAgICAgLnVwZGF0ZSgpICAgXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS51cGRhdGVSZWxhdGlvbnNoaXBTaGFwZT1mdW5jdGlvbihzcmNNb2RlbElELHJlbGF0aW9uc2hpcE5hbWUsc2hhcGUpe1xyXG4gICAgdGhpcy5jb3JlLnN0eWxlKClcclxuICAgICAgICAuc2VsZWN0b3IoJ2VkZ2Vbc291cmNlTW9kZWwgPSBcIicrc3JjTW9kZWxJRCsnXCJdW3JlbGF0aW9uc2hpcE5hbWUgPSBcIicrcmVsYXRpb25zaGlwTmFtZSsnXCJdJylcclxuICAgICAgICAuc3R5bGUoeydsaW5lLXN0eWxlJzogc2hhcGV9KVxyXG4gICAgICAgIC51cGRhdGUoKSAgIFxyXG59XHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS51cGRhdGVSZWxhdGlvbnNoaXBXaWR0aD1mdW5jdGlvbihzcmNNb2RlbElELHJlbGF0aW9uc2hpcE5hbWUsZWRnZVdpZHRoKXtcclxuICAgIHRoaXMuY29yZS5zdHlsZSgpXHJcbiAgICAgICAgLnNlbGVjdG9yKCdlZGdlW3NvdXJjZU1vZGVsID0gXCInK3NyY01vZGVsSUQrJ1wiXVtyZWxhdGlvbnNoaXBOYW1lID0gXCInK3JlbGF0aW9uc2hpcE5hbWUrJ1wiXScpXHJcbiAgICAgICAgLnN0eWxlKHsnd2lkdGgnOnBhcnNlRmxvYXQoZWRnZVdpZHRoKX0pXHJcbiAgICAgICAgLnVwZGF0ZSgpICAgXHJcbiAgICB0aGlzLmNvcmUuc3R5bGUoKVxyXG4gICAgICAgIC5zZWxlY3RvcignZWRnZTpzZWxlY3RlZFtzb3VyY2VNb2RlbCA9IFwiJytzcmNNb2RlbElEKydcIl1bcmVsYXRpb25zaGlwTmFtZSA9IFwiJytyZWxhdGlvbnNoaXBOYW1lKydcIl0nKVxyXG4gICAgICAgIC5zdHlsZSh7J3dpZHRoJzpwYXJzZUZsb2F0KGVkZ2VXaWR0aCkrMSwnbGluZS1jb2xvcic6ICdyZWQnfSlcclxuICAgICAgICAudXBkYXRlKCkgICBcclxuICAgIHRoaXMuY29yZS5zdHlsZSgpXHJcbiAgICAgICAgLnNlbGVjdG9yKCdlZGdlLmhvdmVyW3NvdXJjZU1vZGVsID0gXCInK3NyY01vZGVsSUQrJ1wiXVtyZWxhdGlvbnNoaXBOYW1lID0gXCInK3JlbGF0aW9uc2hpcE5hbWUrJ1wiXScpXHJcbiAgICAgICAgLnN0eWxlKHsnd2lkdGgnOnBhcnNlRmxvYXQoZWRnZVdpZHRoKSszfSlcclxuICAgICAgICAudXBkYXRlKCkgICBcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmRlbGV0ZVJlbGF0aW9ucz1mdW5jdGlvbihyZWxhdGlvbnMpe1xyXG4gICAgcmVsYXRpb25zLmZvckVhY2gob25lUmVsYXRpb249PntcclxuICAgICAgICB2YXIgc3JjSUQ9b25lUmVsYXRpb25bXCJzcmNJRFwiXVxyXG4gICAgICAgIHZhciByZWxhdGlvbklEPW9uZVJlbGF0aW9uW1wicmVsSURcIl1cclxuICAgICAgICB2YXIgdGhlTm9kZU5hbWU9Z2xvYmFsQ2FjaGUudHdpbklETWFwVG9EaXNwbGF5TmFtZVtzcmNJRF1cclxuICAgICAgICB2YXIgdGhlTm9kZT10aGlzLmNvcmUuZmlsdGVyKCdbaWQgPSBcIicrdGhlTm9kZU5hbWUrJ1wiXScpO1xyXG4gICAgICAgIHZhciBlZGdlcz10aGVOb2RlLmNvbm5lY3RlZEVkZ2VzKCkudG9BcnJheSgpXHJcbiAgICAgICAgZm9yKHZhciBpPTA7aTxlZGdlcy5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgdmFyIGFuRWRnZT1lZGdlc1tpXVxyXG4gICAgICAgICAgICBpZihhbkVkZ2UuZGF0YShcIm9yaWdpbmFsSW5mb1wiKVtcIiRyZWxhdGlvbnNoaXBJZFwiXT09cmVsYXRpb25JRCl7XHJcbiAgICAgICAgICAgICAgICBhbkVkZ2UucmVtb3ZlKClcclxuICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KSAgIFxyXG59XHJcblxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmRlbGV0ZVR3aW5zPWZ1bmN0aW9uKHR3aW5JREFycil7XHJcbiAgICB0d2luSURBcnIuZm9yRWFjaCh0d2luSUQ9PntcclxuICAgICAgICB2YXIgdHdpbkRpc3BsYXlOYW1lPWdsb2JhbENhY2hlLnR3aW5JRE1hcFRvRGlzcGxheU5hbWVbdHdpbklEXVxyXG4gICAgICAgIHRoaXMuY29yZS4kKCdbaWQgPSBcIicrdHdpbkRpc3BsYXlOYW1lKydcIl0nKS5yZW1vdmUoKVxyXG4gICAgfSkgICBcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmFuaW1hdGVBTm9kZT1mdW5jdGlvbih0d2luKXtcclxuICAgIHZhciBjdXJEaW1lbnNpb249IHR3aW4ud2lkdGgoKVxyXG4gICAgdHdpbi5hbmltYXRlKHtcclxuICAgICAgICBzdHlsZTogeyAnaGVpZ2h0JzogY3VyRGltZW5zaW9uKjIsJ3dpZHRoJzogY3VyRGltZW5zaW9uKjIgfSxcclxuICAgICAgICBkdXJhdGlvbjogMjAwXHJcbiAgICB9KTtcclxuXHJcbiAgICBzZXRUaW1lb3V0KCgpPT57XHJcbiAgICAgICAgdHdpbi5hbmltYXRlKHtcclxuICAgICAgICAgICAgc3R5bGU6IHsgJ2hlaWdodCc6IGN1ckRpbWVuc2lvbiwnd2lkdGgnOiBjdXJEaW1lbnNpb24gfSxcclxuICAgICAgICAgICAgZHVyYXRpb246IDIwMFxyXG4gICAgICAgICAgICAsY29tcGxldGU6KCk9PntcclxuICAgICAgICAgICAgICAgIHR3aW4ucmVtb3ZlU3R5bGUoKSAvL211c3QgcmVtb3ZlIHRoZSBzdHlsZSBhZnRlciBhbmltYXRpb24sIG90aGVyd2lzZSB0aGV5IHdpbGwgaGF2ZSB0aGVpciBvd24gc3R5bGVcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSwyMDApXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5kcmF3VHdpbnM9ZnVuY3Rpb24odHdpbnNEYXRhLGFuaW1hdGlvbil7XHJcbiAgICB2YXIgYXJyPVtdXHJcbiAgICBmb3IodmFyIGk9MDtpPHR3aW5zRGF0YS5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIgb3JpZ2luYWxJbmZvPXR3aW5zRGF0YVtpXTtcclxuICAgICAgICB2YXIgbmV3Tm9kZT17ZGF0YTp7fSxncm91cDpcIm5vZGVzXCJ9XHJcbiAgICAgICAgbmV3Tm9kZS5kYXRhW1wib3JpZ2luYWxJbmZvXCJdPSBvcmlnaW5hbEluZm87XHJcbiAgICAgICAgbmV3Tm9kZS5kYXRhW1wiaWRcIl09b3JpZ2luYWxJbmZvWydkaXNwbGF5TmFtZSddXHJcbiAgICAgICAgdmFyIG1vZGVsSUQ9b3JpZ2luYWxJbmZvWyckbWV0YWRhdGEnXVsnJG1vZGVsJ11cclxuICAgICAgICBuZXdOb2RlLmRhdGFbXCJtb2RlbElEXCJdPW1vZGVsSURcclxuICAgICAgICBhcnIucHVzaChuZXdOb2RlKVxyXG4gICAgfVxyXG5cclxuICAgIHZhciBlbGVzID0gdGhpcy5jb3JlLmFkZChhcnIpXHJcbiAgICBpZihlbGVzLnNpemUoKT09MCkgcmV0dXJuIGVsZXNcclxuICAgIHRoaXMubm9Qb3NpdGlvbl9ncmlkKGVsZXMpXHJcbiAgICBpZihhbmltYXRpb24pe1xyXG4gICAgICAgIGVsZXMuZm9yRWFjaCgoZWxlKT0+eyB0aGlzLmFuaW1hdGVBTm9kZShlbGUpIH0pXHJcbiAgICB9XHJcblxyXG4gICAgLy9pZiB0aGVyZSBpcyBjdXJyZW50bHkgYSBsYXlvdXQgdGhlcmUsIGFwcGx5IGl0XHJcbiAgICB0aGlzLmFwcGx5TmV3TGF5b3V0KClcclxuXHJcbiAgICByZXR1cm4gZWxlc1xyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuZHJhd1JlbGF0aW9ucz1mdW5jdGlvbihyZWxhdGlvbnNEYXRhKXtcclxuICAgIHZhciByZWxhdGlvbkluZm9BcnI9W11cclxuICAgIGZvcih2YXIgaT0wO2k8cmVsYXRpb25zRGF0YS5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIgb3JpZ2luYWxJbmZvPXJlbGF0aW9uc0RhdGFbaV07XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIHRoZUlEPW9yaWdpbmFsSW5mb1snJHJlbGF0aW9uc2hpcE5hbWUnXStcIl9cIitvcmlnaW5hbEluZm9bJyRyZWxhdGlvbnNoaXBJZCddXHJcbiAgICAgICAgdmFyIGFSZWxhdGlvbj17ZGF0YTp7fSxncm91cDpcImVkZ2VzXCJ9XHJcbiAgICAgICAgYVJlbGF0aW9uLmRhdGFbXCJvcmlnaW5hbEluZm9cIl09b3JpZ2luYWxJbmZvXHJcbiAgICAgICAgYVJlbGF0aW9uLmRhdGFbXCJpZFwiXT10aGVJRFxyXG4gICAgICAgIGFSZWxhdGlvbi5kYXRhW1wic291cmNlXCJdPWdsb2JhbENhY2hlLnR3aW5JRE1hcFRvRGlzcGxheU5hbWVbb3JpZ2luYWxJbmZvWyckc291cmNlSWQnXV1cclxuICAgICAgICBhUmVsYXRpb24uZGF0YVtcInRhcmdldFwiXT1nbG9iYWxDYWNoZS50d2luSURNYXBUb0Rpc3BsYXlOYW1lW29yaWdpbmFsSW5mb1snJHRhcmdldElkJ11dXHJcblxyXG5cclxuICAgICAgICBpZih0aGlzLmNvcmUuJChcIiNcIithUmVsYXRpb24uZGF0YVtcInNvdXJjZVwiXSkubGVuZ3RoPT0wIHx8IHRoaXMuY29yZS4kKFwiI1wiK2FSZWxhdGlvbi5kYXRhW1widGFyZ2V0XCJdKS5sZW5ndGg9PTApIGNvbnRpbnVlXHJcbiAgICAgICAgdmFyIHNvdXJjZU5vZGU9dGhpcy5jb3JlLiQoXCIjXCIrYVJlbGF0aW9uLmRhdGFbXCJzb3VyY2VcIl0pXHJcbiAgICAgICAgdmFyIHNvdXJjZU1vZGVsPXNvdXJjZU5vZGVbMF0uZGF0YShcIm9yaWdpbmFsSW5mb1wiKVsnJG1ldGFkYXRhJ11bJyRtb2RlbCddXHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9hZGQgYWRkaXRpb25hbCBzb3VyY2Ugbm9kZSBpbmZvcm1hdGlvbiB0byB0aGUgb3JpZ2luYWwgcmVsYXRpb25zaGlwIGluZm9ybWF0aW9uXHJcbiAgICAgICAgb3JpZ2luYWxJbmZvWydzb3VyY2VNb2RlbCddPXNvdXJjZU1vZGVsXHJcbiAgICAgICAgYVJlbGF0aW9uLmRhdGFbXCJzb3VyY2VNb2RlbFwiXT1zb3VyY2VNb2RlbFxyXG4gICAgICAgIGFSZWxhdGlvbi5kYXRhW1wicmVsYXRpb25zaGlwTmFtZVwiXT1vcmlnaW5hbEluZm9bJyRyZWxhdGlvbnNoaXBOYW1lJ11cclxuXHJcbiAgICAgICAgdmFyIGV4aXN0RWRnZT10aGlzLmNvcmUuJCgnZWRnZVtpZCA9IFwiJyt0aGVJRCsnXCJdJylcclxuICAgICAgICBpZihleGlzdEVkZ2Uuc2l6ZSgpPjApIHtcclxuICAgICAgICAgICAgZXhpc3RFZGdlLmRhdGEoXCJvcmlnaW5hbEluZm9cIixvcmlnaW5hbEluZm8pXHJcbiAgICAgICAgICAgIGNvbnRpbnVlOyAgLy9ubyBuZWVkIHRvIGRyYXcgaXRcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlbGF0aW9uSW5mb0Fyci5wdXNoKGFSZWxhdGlvbilcclxuICAgIH1cclxuICAgIGlmKHJlbGF0aW9uSW5mb0Fyci5sZW5ndGg9PTApIHJldHVybiBudWxsO1xyXG5cclxuICAgIHZhciBlZGdlcz10aGlzLmNvcmUuYWRkKHJlbGF0aW9uSW5mb0FycilcclxuICAgIHJldHVybiBlZGdlc1xyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUucmV2aWV3U3RvcmVkUmVsYXRpb25zaGlwc1RvRHJhdz1mdW5jdGlvbigpe1xyXG4gICAgLy9jaGVjayB0aGUgc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzIGFnYWluIGFuZCBtYXliZSBzb21lIG9mIHRoZW0gY2FuIGJlIGRyYXduIG5vdyBzaW5jZSB0YXJnZXROb2RlIGlzIGF2YWlsYWJsZVxyXG4gICAgdmFyIHN0b3JlZFJlbGF0aW9uQXJyPVtdXHJcbiAgICBmb3IodmFyIHR3aW5JRCBpbiBnbG9iYWxDYWNoZS5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHMpe1xyXG4gICAgICAgIHN0b3JlZFJlbGF0aW9uQXJyPXN0b3JlZFJlbGF0aW9uQXJyLmNvbmNhdChnbG9iYWxDYWNoZS5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbdHdpbklEXSlcclxuICAgIH1cclxuICAgIHRoaXMuZHJhd1JlbGF0aW9ucyhzdG9yZWRSZWxhdGlvbkFycilcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmRyYXdUd2luc0FuZFJlbGF0aW9ucz1mdW5jdGlvbihkYXRhKXtcclxuICAgIHZhciB0d2luc0FuZFJlbGF0aW9ucz1kYXRhLmNoaWxkVHdpbnNBbmRSZWxhdGlvbnNcclxuXHJcbiAgICAvL2RyYXcgdGhvc2UgbmV3IHR3aW5zIGZpcnN0XHJcbiAgICB0d2luc0FuZFJlbGF0aW9ucy5mb3JFYWNoKG9uZVNldD0+e1xyXG4gICAgICAgIHZhciB0d2luSW5mb0Fycj1bXVxyXG4gICAgICAgIGZvcih2YXIgaW5kIGluIG9uZVNldC5jaGlsZFR3aW5zKSB0d2luSW5mb0Fyci5wdXNoKG9uZVNldC5jaGlsZFR3aW5zW2luZF0pXHJcbiAgICAgICAgdmFyIGVsZXM9dGhpcy5kcmF3VHdpbnModHdpbkluZm9BcnIsXCJhbmltYXRpb25cIilcclxuICAgIH0pXHJcblxyXG4gICAgLy9kcmF3IHRob3NlIGtub3duIHR3aW5zIGZyb20gdGhlIHJlbGF0aW9uc2hpcHNcclxuICAgIHZhciB0d2luc0luZm89e31cclxuICAgIHR3aW5zQW5kUmVsYXRpb25zLmZvckVhY2gob25lU2V0PT57XHJcbiAgICAgICAgdmFyIHJlbGF0aW9uc0luZm89b25lU2V0W1wicmVsYXRpb25zaGlwc1wiXVxyXG4gICAgICAgIHJlbGF0aW9uc0luZm8uZm9yRWFjaCgob25lUmVsYXRpb24pPT57XHJcbiAgICAgICAgICAgIHZhciBzcmNJRD1vbmVSZWxhdGlvblsnJHNvdXJjZUlkJ11cclxuICAgICAgICAgICAgdmFyIHRhcmdldElEPW9uZVJlbGF0aW9uWyckdGFyZ2V0SWQnXVxyXG4gICAgICAgICAgICBpZihnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1tzcmNJRF0pXHJcbiAgICAgICAgICAgICAgICB0d2luc0luZm9bc3JjSURdID0gZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbc3JjSURdXHJcbiAgICAgICAgICAgIGlmKGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3RhcmdldElEXSlcclxuICAgICAgICAgICAgICAgIHR3aW5zSW5mb1t0YXJnZXRJRF0gPSBnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1t0YXJnZXRJRF0gICAgXHJcbiAgICAgICAgfSlcclxuICAgIH0pXHJcbiAgICB2YXIgdG1wQXJyPVtdXHJcbiAgICBmb3IodmFyIHR3aW5JRCBpbiB0d2luc0luZm8pIHRtcEFyci5wdXNoKHR3aW5zSW5mb1t0d2luSURdKVxyXG4gICAgdGhpcy5kcmF3VHdpbnModG1wQXJyKVxyXG5cclxuICAgIC8vdGhlbiBjaGVjayBhbGwgc3RvcmVkIHJlbGF0aW9uc2hpcHMgYW5kIGRyYXcgaWYgaXQgY2FuIGJlIGRyYXduXHJcbiAgICB0aGlzLnJldmlld1N0b3JlZFJlbGF0aW9uc2hpcHNUb0RyYXcoKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuYXBwbHlWaXN1YWxEZWZpbml0aW9uPWZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgdmlzdWFsSnNvbj1nbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW1wiZGVmYXVsdFwiXVxyXG4gICAgaWYodmlzdWFsSnNvbj09bnVsbCkgcmV0dXJuO1xyXG4gICAgZm9yKHZhciBtb2RlbElEIGluIHZpc3VhbEpzb24pe1xyXG4gICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF0uY29sb3IpIHRoaXMudXBkYXRlTW9kZWxUd2luQ29sb3IobW9kZWxJRCx2aXN1YWxKc29uW21vZGVsSURdLmNvbG9yKVxyXG4gICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF0uc2hhcGUpIHRoaXMudXBkYXRlTW9kZWxUd2luU2hhcGUobW9kZWxJRCx2aXN1YWxKc29uW21vZGVsSURdLnNoYXBlKVxyXG4gICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF0uYXZhcnRhKSB0aGlzLnVwZGF0ZU1vZGVsQXZhcnRhKG1vZGVsSUQsdmlzdWFsSnNvblttb2RlbElEXS5hdmFydGEpXHJcbiAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXS5kaW1lbnNpb25SYXRpbykgdGhpcy51cGRhdGVNb2RlbFR3aW5EaW1lbnNpb24obW9kZWxJRCx2aXN1YWxKc29uW21vZGVsSURdLmRpbWVuc2lvblJhdGlvKVxyXG4gICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF0ucmVscyl7XHJcbiAgICAgICAgICAgIGZvcih2YXIgcmVsYXRpb25zaGlwTmFtZSBpbiB2aXN1YWxKc29uW21vZGVsSURdLnJlbHMpe1xyXG4gICAgICAgICAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpb25zaGlwTmFtZV0uY29sb3Ipe1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlUmVsYXRpb25zaGlwQ29sb3IobW9kZWxJRCxyZWxhdGlvbnNoaXBOYW1lLHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW9uc2hpcE5hbWVdLmNvbG9yKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpb25zaGlwTmFtZV0uc2hhcGUpe1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlUmVsYXRpb25zaGlwU2hhcGUobW9kZWxJRCxyZWxhdGlvbnNoaXBOYW1lLHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW9uc2hpcE5hbWVdLnNoYXBlKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpb25zaGlwTmFtZV0uZWRnZVdpZHRoKXtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVJlbGF0aW9uc2hpcFdpZHRoKG1vZGVsSUQscmVsYXRpb25zaGlwTmFtZSx2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGlvbnNoaXBOYW1lXS5lZGdlV2lkdGgpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5yeE1lc3NhZ2U9ZnVuY3Rpb24obXNnUGF5bG9hZCl7XHJcbiAgICBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwic3RhcnRTZWxlY3Rpb25fcmVwbGFjZVwiKXtcclxuICAgICAgICB0aGlzLmNvcmUubm9kZXMoKS5yZW1vdmUoKVxyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInJlcGxhY2VBbGxUd2luc1wiKSB7XHJcbiAgICAgICAgdGhpcy5jb3JlLm5vZGVzKCkucmVtb3ZlKClcclxuICAgICAgICB2YXIgZWxlcz0gdGhpcy5kcmF3VHdpbnMobXNnUGF5bG9hZC5pbmZvKVxyXG4gICAgICAgIHRoaXMuY29yZS5jZW50ZXIoZWxlcylcclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJ2aXN1YWxEZWZpbml0aW9uUmVmcmVzaFwiKSB7XHJcbiAgICAgICAgdGhpcy5hcHBseVZpc3VhbERlZmluaXRpb24oKVxyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImFwcGVuZEFsbFR3aW5zXCIpIHtcclxuICAgICAgICB2YXIgZWxlcz0gdGhpcy5kcmF3VHdpbnMobXNnUGF5bG9hZC5pbmZvLFwiYW5pbWF0ZVwiKVxyXG4gICAgICAgIHRoaXMuY29yZS5jZW50ZXIoZWxlcylcclxuICAgICAgICB0aGlzLnJldmlld1N0b3JlZFJlbGF0aW9uc2hpcHNUb0RyYXcoKVxyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImRyYXdBbGxSZWxhdGlvbnNcIil7XHJcbiAgICAgICAgdmFyIGVkZ2VzPSB0aGlzLmRyYXdSZWxhdGlvbnMobXNnUGF5bG9hZC5pbmZvKVxyXG4gICAgICAgIGlmKGVkZ2VzIT1udWxsKSB7XHJcbiAgICAgICAgICAgIGlmKGdsb2JhbENhY2hlLmN1cnJlbnRMYXlvdXROYW1lPT1udWxsKSAgdGhpcy5ub1Bvc2l0aW9uX2Nvc2UoKVxyXG4gICAgICAgIH1cclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJhZGROZXdUd2luXCIpIHtcclxuICAgICAgICB0aGlzLmRyYXdUd2lucyhbbXNnUGF5bG9hZC50d2luSW5mb10sXCJhbmltYXRpb25cIilcclxuICAgICAgICB2YXIgbm9kZUluZm89IG1zZ1BheWxvYWQudHdpbkluZm87XHJcbiAgICAgICAgdmFyIG5vZGVOYW1lPSBnbG9iYWxDYWNoZS50d2luSURNYXBUb0Rpc3BsYXlOYW1lW25vZGVJbmZvW1wiJGR0SWRcIl1dXHJcbiAgICAgICAgdmFyIHRvcG9Ob2RlPSB0aGlzLmNvcmUubm9kZXMoXCIjXCIrbm9kZU5hbWUpXHJcbiAgICAgICAgaWYodG9wb05vZGUpe1xyXG4gICAgICAgICAgICB2YXIgcG9zaXRpb249dG9wb05vZGUucmVuZGVyZWRQb3NpdGlvbigpXHJcbiAgICAgICAgICAgIHRoaXMuY29yZS5wYW5CeSh7eDotcG9zaXRpb24ueCsyMDAseTotcG9zaXRpb24ueSs1MH0pXHJcbiAgICAgICAgICAgIHRvcG9Ob2RlLnNlbGVjdCgpXHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0RnVuY3Rpb24oKVxyXG4gICAgICAgIH1cclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJhZGROZXdUd2luc1wiKSB7XHJcbiAgICAgICAgdGhpcy5kcmF3VHdpbnMobXNnUGF5bG9hZC50d2luc0luZm8sXCJhbmltYXRpb25cIilcclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJkcmF3VHdpbnNBbmRSZWxhdGlvbnNcIikgdGhpcy5kcmF3VHdpbnNBbmRSZWxhdGlvbnMobXNnUGF5bG9hZC5pbmZvKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwic2hvd0luZm9TZWxlY3RlZE5vZGVzXCIpeyAvL2Zyb20gc2VsZWN0aW5nIHR3aW5zIGluIHRoZSB0d2ludHJlZVxyXG4gICAgICAgIHRoaXMuY29yZS5ub2RlcygpLnVuc2VsZWN0KClcclxuICAgICAgICB0aGlzLmNvcmUuZWRnZXMoKS51bnNlbGVjdCgpXHJcbiAgICAgICAgdmFyIGFycj1tc2dQYXlsb2FkLmluZm87XHJcbiAgICAgICAgdmFyIG1vdXNlQ2xpY2tEZXRhaWw9bXNnUGF5bG9hZC5tb3VzZUNsaWNrRGV0YWlsO1xyXG4gICAgICAgIGFyci5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgICAgICB2YXIgYVR3aW49IHRoaXMuY29yZS5ub2RlcyhcIiNcIitlbGVtZW50WydkaXNwbGF5TmFtZSddKVxyXG4gICAgICAgICAgICBhVHdpbi5zZWxlY3QoKVxyXG4gICAgICAgICAgICBpZihtb3VzZUNsaWNrRGV0YWlsIT0yKSB0aGlzLmFuaW1hdGVBTm9kZShhVHdpbikgLy9pZ25vcmUgZG91YmxlIGNsaWNrIHNlY29uZCBjbGlja1xyXG4gICAgICAgIH0pO1xyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cIlBhblRvTm9kZVwiKXtcclxuICAgICAgICB2YXIgbm9kZUluZm89IG1zZ1BheWxvYWQuaW5mbztcclxuICAgICAgICB2YXIgbm9kZU5hbWU9IGdsb2JhbENhY2hlLnR3aW5JRE1hcFRvRGlzcGxheU5hbWVbbm9kZUluZm9bXCIkZHRJZFwiXV1cclxuICAgICAgICB2YXIgdG9wb05vZGU9IHRoaXMuY29yZS5ub2RlcyhcIiNcIitub2RlTmFtZSlcclxuICAgICAgICBpZih0b3BvTm9kZSl7XHJcbiAgICAgICAgICAgIHRoaXMuY29yZS5jZW50ZXIodG9wb05vZGUpXHJcbiAgICAgICAgfVxyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIil7XHJcbiAgICAgICAgaWYobXNnUGF5bG9hZC5zcmNNb2RlbElEKXtcclxuICAgICAgICAgICAgaWYobXNnUGF5bG9hZC5jb2xvcikgdGhpcy51cGRhdGVSZWxhdGlvbnNoaXBDb2xvcihtc2dQYXlsb2FkLnNyY01vZGVsSUQsbXNnUGF5bG9hZC5yZWxhdGlvbnNoaXBOYW1lLG1zZ1BheWxvYWQuY29sb3IpXHJcbiAgICAgICAgICAgIGVsc2UgaWYobXNnUGF5bG9hZC5zaGFwZSkgdGhpcy51cGRhdGVSZWxhdGlvbnNoaXBTaGFwZShtc2dQYXlsb2FkLnNyY01vZGVsSUQsbXNnUGF5bG9hZC5yZWxhdGlvbnNoaXBOYW1lLG1zZ1BheWxvYWQuc2hhcGUpXHJcbiAgICAgICAgICAgIGVsc2UgaWYobXNnUGF5bG9hZC5lZGdlV2lkdGgpIHRoaXMudXBkYXRlUmVsYXRpb25zaGlwV2lkdGgobXNnUGF5bG9hZC5zcmNNb2RlbElELG1zZ1BheWxvYWQucmVsYXRpb25zaGlwTmFtZSxtc2dQYXlsb2FkLmVkZ2VXaWR0aClcclxuICAgICAgICB9IFxyXG4gICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgIGlmKG1zZ1BheWxvYWQuY29sb3IpIHRoaXMudXBkYXRlTW9kZWxUd2luQ29sb3IobXNnUGF5bG9hZC5tb2RlbElELG1zZ1BheWxvYWQuY29sb3IpXHJcbiAgICAgICAgICAgIGVsc2UgaWYobXNnUGF5bG9hZC5zaGFwZSkgdGhpcy51cGRhdGVNb2RlbFR3aW5TaGFwZShtc2dQYXlsb2FkLm1vZGVsSUQsbXNnUGF5bG9hZC5zaGFwZSlcclxuICAgICAgICAgICAgZWxzZSBpZihtc2dQYXlsb2FkLmF2YXJ0YSkgdGhpcy51cGRhdGVNb2RlbEF2YXJ0YShtc2dQYXlsb2FkLm1vZGVsSUQsbXNnUGF5bG9hZC5hdmFydGEpXHJcbiAgICAgICAgICAgIGVsc2UgaWYobXNnUGF5bG9hZC5ub0F2YXJ0YSkgIHRoaXMudXBkYXRlTW9kZWxBdmFydGEobXNnUGF5bG9hZC5tb2RlbElELG51bGwpXHJcbiAgICAgICAgICAgIGVsc2UgaWYobXNnUGF5bG9hZC5kaW1lbnNpb25SYXRpbykgIHRoaXMudXBkYXRlTW9kZWxUd2luRGltZW5zaW9uKG1zZ1BheWxvYWQubW9kZWxJRCxtc2dQYXlsb2FkLmRpbWVuc2lvblJhdGlvKVxyXG4gICAgICAgIH0gXHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwidHdpbnNEZWxldGVkXCIpIHRoaXMuZGVsZXRlVHdpbnMobXNnUGF5bG9hZC50d2luSURBcnIpXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJyZWxhdGlvbnNEZWxldGVkXCIpIHRoaXMuZGVsZXRlUmVsYXRpb25zKG1zZ1BheWxvYWQucmVsYXRpb25zKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiY29ubmVjdFRvXCIpeyB0aGlzLnN0YXJ0VGFyZ2V0Tm9kZU1vZGUoXCJjb25uZWN0VG9cIikgICB9XHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJjb25uZWN0RnJvbVwiKXsgdGhpcy5zdGFydFRhcmdldE5vZGVNb2RlKFwiY29ubmVjdEZyb21cIikgICB9XHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJhZGRTZWxlY3RPdXRib3VuZFwiKXsgdGhpcy5zZWxlY3RPdXRib3VuZE5vZGVzKCkgICB9XHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJhZGRTZWxlY3RJbmJvdW5kXCIpeyB0aGlzLnNlbGVjdEluYm91bmROb2RlcygpICAgfVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiaGlkZVNlbGVjdGVkTm9kZXNcIil7IHRoaXMuaGlkZVNlbGVjdGVkTm9kZXMoKSAgIH1cclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cIkNPU0VTZWxlY3RlZE5vZGVzXCIpeyB0aGlzLkNPU0VTZWxlY3RlZE5vZGVzKCkgICB9XHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJzYXZlTGF5b3V0XCIpeyB0aGlzLnNhdmVMYXlvdXQobXNnUGF5bG9hZC5sYXlvdXROYW1lKSAgIH1cclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImxheW91dENoYW5nZVwiKXsgdGhpcy5hcHBseU5ld0xheW91dCgpICAgfVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuYXBwbHlOZXdMYXlvdXQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgbGF5b3V0TmFtZT1nbG9iYWxDYWNoZS5jdXJyZW50TGF5b3V0TmFtZVxyXG4gICAgXHJcbiAgICB2YXIgbGF5b3V0RGV0YWlsPSBnbG9iYWxDYWNoZS5sYXlvdXRKU09OW2xheW91dE5hbWVdXHJcbiAgICBcclxuICAgIC8vcmVtb3ZlIGFsbCBiZW5kaW5nIGVkZ2UgXHJcbiAgICB0aGlzLmNvcmUuZWRnZXMoKS5mb3JFYWNoKG9uZUVkZ2U9PntcclxuICAgICAgICBvbmVFZGdlLnJlbW92ZUNsYXNzKCdlZGdlYmVuZGVkaXRpbmctaGFzYmVuZHBvaW50cycpXHJcbiAgICAgICAgb25lRWRnZS5yZW1vdmVDbGFzcygnZWRnZWNvbnRyb2xlZGl0aW5nLWhhc2NvbnRyb2xwb2ludHMnKVxyXG4gICAgfSlcclxuICAgIFxyXG4gICAgaWYobGF5b3V0RGV0YWlsPT1udWxsKSByZXR1cm47XHJcbiAgICBcclxuICAgIHZhciBzdG9yZWRQb3NpdGlvbnM9e31cclxuICAgIGZvcih2YXIgaW5kIGluIGxheW91dERldGFpbCl7XHJcbiAgICAgICAgc3RvcmVkUG9zaXRpb25zW2luZF09e1xyXG4gICAgICAgICAgICB4OmxheW91dERldGFpbFtpbmRdWzBdXHJcbiAgICAgICAgICAgICx5OmxheW91dERldGFpbFtpbmRdWzFdXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdmFyIG5ld0xheW91dD10aGlzLmNvcmUubGF5b3V0KHtcclxuICAgICAgICBuYW1lOiAncHJlc2V0JyxcclxuICAgICAgICBwb3NpdGlvbnM6c3RvcmVkUG9zaXRpb25zLFxyXG4gICAgICAgIGZpdDpmYWxzZSxcclxuICAgICAgICBhbmltYXRlOiB0cnVlLFxyXG4gICAgICAgIGFuaW1hdGlvbkR1cmF0aW9uOiAzMDAsXHJcbiAgICB9KVxyXG4gICAgbmV3TGF5b3V0LnJ1bigpXHJcblxyXG4gICAgLy9yZXN0b3JlIGVkZ2VzIGJlbmRpbmcgb3IgY29udHJvbCBwb2ludHNcclxuICAgIHZhciBlZGdlUG9pbnRzRGljdD1sYXlvdXREZXRhaWxbXCJlZGdlc1wiXVxyXG4gICAgaWYoZWRnZVBvaW50c0RpY3Q9PW51bGwpcmV0dXJuO1xyXG4gICAgZm9yKHZhciBzcmNJRCBpbiBlZGdlUG9pbnRzRGljdCl7XHJcbiAgICAgICAgZm9yKHZhciByZWxhdGlvbnNoaXBJRCBpbiBlZGdlUG9pbnRzRGljdFtzcmNJRF0pe1xyXG4gICAgICAgICAgICB2YXIgb2JqPWVkZ2VQb2ludHNEaWN0W3NyY0lEXVtyZWxhdGlvbnNoaXBJRF1cclxuICAgICAgICAgICAgdGhpcy5hcHBseUVkZ2VCZW5kY29udHJvbFBvaW50cyhzcmNJRCxyZWxhdGlvbnNoaXBJRCxvYmpbXCJjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHNcIl1cclxuICAgICAgICAgICAgLG9ialtcImN5ZWRnZWJlbmRlZGl0aW5nRGlzdGFuY2VzXCJdLG9ialtcImN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0c1wiXSxvYmpbXCJjeWVkZ2Vjb250cm9sZWRpdGluZ0Rpc3RhbmNlc1wiXSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5hcHBseUVkZ2VCZW5kY29udHJvbFBvaW50cyA9IGZ1bmN0aW9uIChzcmNJRCxyZWxhdGlvbnNoaXBJRFxyXG4gICAgLGN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0cyxjeWVkZ2ViZW5kZWRpdGluZ0Rpc3RhbmNlcyxjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHMsY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXMpIHtcclxuICAgICAgICB2YXIgbm9kZU5hbWU9Z2xvYmFsQ2FjaGUudHdpbklETWFwVG9EaXNwbGF5TmFtZVtzcmNJRF1cclxuICAgICAgICB2YXIgdGhlTm9kZT10aGlzLmNvcmUuZmlsdGVyKCdbaWQgPSBcIicrbm9kZU5hbWUrJ1wiXScpO1xyXG4gICAgICAgIHZhciBlZGdlcz10aGVOb2RlLmNvbm5lY3RlZEVkZ2VzKCkudG9BcnJheSgpXHJcbiAgICAgICAgZm9yKHZhciBpPTA7aTxlZGdlcy5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgdmFyIGFuRWRnZT1lZGdlc1tpXVxyXG4gICAgICAgICAgICBpZihhbkVkZ2UuZGF0YShcIm9yaWdpbmFsSW5mb1wiKVtcIiRyZWxhdGlvbnNoaXBJZFwiXT09cmVsYXRpb25zaGlwSUQpe1xyXG4gICAgICAgICAgICAgICAgaWYoY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzKXtcclxuICAgICAgICAgICAgICAgICAgICBhbkVkZ2UuZGF0YShcImN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0c1wiLGN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0cylcclxuICAgICAgICAgICAgICAgICAgICBhbkVkZ2UuZGF0YShcImN5ZWRnZWJlbmRlZGl0aW5nRGlzdGFuY2VzXCIsY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXMpXHJcbiAgICAgICAgICAgICAgICAgICAgYW5FZGdlLmFkZENsYXNzKCdlZGdlYmVuZGVkaXRpbmctaGFzYmVuZHBvaW50cycpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYoY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzKXtcclxuICAgICAgICAgICAgICAgICAgICBhbkVkZ2UuZGF0YShcImN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0c1wiLGN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cylcclxuICAgICAgICAgICAgICAgICAgICBhbkVkZ2UuZGF0YShcImN5ZWRnZWNvbnRyb2xlZGl0aW5nRGlzdGFuY2VzXCIsY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXMpXHJcbiAgICAgICAgICAgICAgICAgICAgYW5FZGdlLmFkZENsYXNzKCdlZGdlY29udHJvbGVkaXRpbmctaGFzY29udHJvbHBvaW50cycpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBicmVha1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG59XHJcblxyXG5cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5zYXZlTGF5b3V0ID0gYXN5bmMgZnVuY3Rpb24gKGxheW91dE5hbWUpIHtcclxuICAgIHZhciBsYXlvdXREaWN0PWdsb2JhbENhY2hlLmxheW91dEpTT05bbGF5b3V0TmFtZV1cclxuICAgIGlmKCFsYXlvdXREaWN0KXtcclxuICAgICAgICBsYXlvdXREaWN0PWdsb2JhbENhY2hlLmxheW91dEpTT05bbGF5b3V0TmFtZV09e31cclxuICAgIH1cclxuICAgIFxyXG4gICAgaWYodGhpcy5jb3JlLm5vZGVzKCkuc2l6ZSgpPT0wKSByZXR1cm47XHJcblxyXG4gICAgLy9zdG9yZSBub2RlcyBwb3NpdGlvblxyXG4gICAgdGhpcy5jb3JlLm5vZGVzKCkuZm9yRWFjaChvbmVOb2RlPT57XHJcbiAgICAgICAgdmFyIHBvc2l0aW9uPW9uZU5vZGUucG9zaXRpb24oKVxyXG4gICAgICAgIGxheW91dERpY3Rbb25lTm9kZS5pZCgpXT1bdGhpcy5udW1iZXJQcmVjaXNpb24ocG9zaXRpb25bJ3gnXSksdGhpcy5udW1iZXJQcmVjaXNpb24ocG9zaXRpb25bJ3knXSldXHJcbiAgICB9KVxyXG5cclxuICAgIC8vc3RvcmUgYW55IGVkZ2UgYmVuZGluZyBwb2ludHMgb3IgY29udHJvbGluZyBwb2ludHNcclxuXHJcbiAgICBpZihsYXlvdXREaWN0LmVkZ2VzPT1udWxsKSBsYXlvdXREaWN0LmVkZ2VzPXt9XHJcbiAgICB2YXIgZWRnZUVkaXRJbnN0YW5jZT0gdGhpcy5jb3JlLmVkZ2VFZGl0aW5nKCdnZXQnKTtcclxuICAgIHRoaXMuY29yZS5lZGdlcygpLmZvckVhY2gob25lRWRnZT0+e1xyXG4gICAgICAgIHZhciBzcmNJRD1vbmVFZGdlLmRhdGEoXCJvcmlnaW5hbEluZm9cIilbXCIkc291cmNlSWRcIl1cclxuICAgICAgICB2YXIgcmVsYXRpb25zaGlwSUQ9b25lRWRnZS5kYXRhKFwib3JpZ2luYWxJbmZvXCIpW1wiJHJlbGF0aW9uc2hpcElkXCJdXHJcbiAgICAgICAgdmFyIGN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0cz1vbmVFZGdlLmRhdGEoJ2N5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0cycpXHJcbiAgICAgICAgdmFyIGN5ZWRnZWJlbmRlZGl0aW5nRGlzdGFuY2VzPW9uZUVkZ2UuZGF0YSgnY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXMnKVxyXG4gICAgICAgIHZhciBjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHM9b25lRWRnZS5kYXRhKCdjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHMnKVxyXG4gICAgICAgIHZhciBjeWVkZ2Vjb250cm9sZWRpdGluZ0Rpc3RhbmNlcz1vbmVFZGdlLmRhdGEoJ2N5ZWRnZWNvbnRyb2xlZGl0aW5nRGlzdGFuY2VzJylcclxuICAgICAgICBpZighY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzICYmICFjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHMpIHJldHVybjtcclxuXHJcbiAgICAgICAgaWYobGF5b3V0RGljdC5lZGdlc1tzcmNJRF09PW51bGwpbGF5b3V0RGljdC5lZGdlc1tzcmNJRF09e31cclxuICAgICAgICBsYXlvdXREaWN0LmVkZ2VzW3NyY0lEXVtyZWxhdGlvbnNoaXBJRF09e31cclxuICAgICAgICBpZihjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHMgJiYgY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzLmxlbmd0aD4wKSB7XHJcbiAgICAgICAgICAgIGxheW91dERpY3QuZWRnZXNbc3JjSURdW3JlbGF0aW9uc2hpcElEXVtcImN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0c1wiXT10aGlzLm51bWJlclByZWNpc2lvbihjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHMpXHJcbiAgICAgICAgICAgIGxheW91dERpY3QuZWRnZXNbc3JjSURdW3JlbGF0aW9uc2hpcElEXVtcImN5ZWRnZWJlbmRlZGl0aW5nRGlzdGFuY2VzXCJdPXRoaXMubnVtYmVyUHJlY2lzaW9uKGN5ZWRnZWJlbmRlZGl0aW5nRGlzdGFuY2VzKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZihjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHMgJiYgY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzLmxlbmd0aD4wKSB7XHJcbiAgICAgICAgICAgIGxheW91dERpY3QuZWRnZXNbc3JjSURdW3JlbGF0aW9uc2hpcElEXVtcImN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0c1wiXT10aGlzLm51bWJlclByZWNpc2lvbihjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHMpXHJcbiAgICAgICAgICAgIGxheW91dERpY3QuZWRnZXNbc3JjSURdW3JlbGF0aW9uc2hpcElEXVtcImN5ZWRnZWNvbnRyb2xlZGl0aW5nRGlzdGFuY2VzXCJdPXRoaXMubnVtYmVyUHJlY2lzaW9uKGN5ZWRnZWNvbnRyb2xlZGl0aW5nRGlzdGFuY2VzKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcblxyXG4gICAgdmFyIHNhdmVMYXlvdXRPYmo9e1wibGF5b3V0c1wiOnt9fVxyXG4gICAgc2F2ZUxheW91dE9ialtcImxheW91dHNcIl1bbGF5b3V0TmFtZV09SlNPTi5zdHJpbmdpZnkobGF5b3V0RGljdClcclxuICAgIHRyeXtcclxuICAgICAgICBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9zYXZlTGF5b3V0XCIsIFwiUE9TVFwiLCBzYXZlTGF5b3V0T2JqKVxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImxheW91dHNVcGRhdGVkXCIsXCJsYXlvdXROYW1lXCI6bGF5b3V0TmFtZX0pXHJcbiAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICBpZihlLnJlc3BvbnNlVGV4dCkgYWxlcnQoZS5yZXNwb25zZVRleHQpXHJcbiAgICB9XHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5udW1iZXJQcmVjaXNpb24gPSBmdW5jdGlvbiAobnVtYmVyKSB7XHJcbiAgICBpZihBcnJheS5pc0FycmF5KG51bWJlcikpe1xyXG4gICAgICAgIGZvcih2YXIgaT0wO2k8bnVtYmVyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICBudW1iZXJbaV0gPSB0aGlzLm51bWJlclByZWNpc2lvbihudW1iZXJbaV0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudW1iZXJcclxuICAgIH1lbHNlXHJcbiAgICByZXR1cm4gcGFyc2VGbG9hdChudW1iZXIudG9GaXhlZCgzKSlcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLkNPU0VTZWxlY3RlZE5vZGVzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHNlbGVjdGVkPXRoaXMuY29yZS4kKCc6c2VsZWN0ZWQnKVxyXG4gICAgdGhpcy5ub1Bvc2l0aW9uX2Nvc2Uoc2VsZWN0ZWQpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5oaWRlU2VsZWN0ZWROb2RlcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBzZWxlY3RlZE5vZGVzPXRoaXMuY29yZS5ub2RlcygnOnNlbGVjdGVkJylcclxuICAgIHNlbGVjdGVkTm9kZXMucmVtb3ZlKClcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnNlbGVjdEluYm91bmROb2RlcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBzZWxlY3RlZE5vZGVzPXRoaXMuY29yZS5ub2RlcygnOnNlbGVjdGVkJylcclxuICAgIHZhciBlbGVzPXRoaXMuY29yZS5ub2RlcygpLmVkZ2VzVG8oc2VsZWN0ZWROb2Rlcykuc291cmNlcygpXHJcbiAgICBlbGVzLmZvckVhY2goKGVsZSk9PnsgdGhpcy5hbmltYXRlQU5vZGUoZWxlKSB9KVxyXG4gICAgZWxlcy5zZWxlY3QoKVxyXG4gICAgdGhpcy5zZWxlY3RGdW5jdGlvbigpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5zZWxlY3RPdXRib3VuZE5vZGVzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHNlbGVjdGVkTm9kZXM9dGhpcy5jb3JlLm5vZGVzKCc6c2VsZWN0ZWQnKVxyXG4gICAgdmFyIGVsZXM9c2VsZWN0ZWROb2Rlcy5lZGdlc1RvKHRoaXMuY29yZS5ub2RlcygpKS50YXJnZXRzKClcclxuICAgIGVsZXMuZm9yRWFjaCgoZWxlKT0+eyB0aGlzLmFuaW1hdGVBTm9kZShlbGUpIH0pXHJcbiAgICBlbGVzLnNlbGVjdCgpXHJcbiAgICB0aGlzLnNlbGVjdEZ1bmN0aW9uKClcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmFkZENvbm5lY3Rpb25zID0gZnVuY3Rpb24gKHRhcmdldE5vZGUpIHtcclxuICAgIHZhciB0aGVDb25uZWN0TW9kZT10aGlzLnRhcmdldE5vZGVNb2RlXHJcbiAgICB2YXIgc3JjTm9kZUFycj10aGlzLmNvcmUubm9kZXMoXCI6c2VsZWN0ZWRcIilcclxuXHJcbiAgICB2YXIgcHJlcGFyYXRpb25JbmZvPVtdXHJcblxyXG4gICAgc3JjTm9kZUFyci5mb3JFYWNoKHRoZU5vZGU9PntcclxuICAgICAgICB2YXIgY29ubmVjdGlvblR5cGVzXHJcbiAgICAgICAgaWYodGhlQ29ubmVjdE1vZGU9PVwiY29ubmVjdFRvXCIpIHtcclxuICAgICAgICAgICAgY29ubmVjdGlvblR5cGVzPXRoaXMuY2hlY2tBdmFpbGFibGVDb25uZWN0aW9uVHlwZSh0aGVOb2RlLmRhdGEoXCJtb2RlbElEXCIpLHRhcmdldE5vZGUuZGF0YShcIm1vZGVsSURcIikpXHJcbiAgICAgICAgICAgIHByZXBhcmF0aW9uSW5mby5wdXNoKHtmcm9tOnRoZU5vZGUsdG86dGFyZ2V0Tm9kZSxjb25uZWN0OmNvbm5lY3Rpb25UeXBlc30pXHJcbiAgICAgICAgfWVsc2UgaWYodGhlQ29ubmVjdE1vZGU9PVwiY29ubmVjdEZyb21cIikge1xyXG4gICAgICAgICAgICBjb25uZWN0aW9uVHlwZXM9dGhpcy5jaGVja0F2YWlsYWJsZUNvbm5lY3Rpb25UeXBlKHRhcmdldE5vZGUuZGF0YShcIm1vZGVsSURcIiksdGhlTm9kZS5kYXRhKFwibW9kZWxJRFwiKSlcclxuICAgICAgICAgICAgcHJlcGFyYXRpb25JbmZvLnB1c2goe3RvOnRoZU5vZGUsZnJvbTp0YXJnZXROb2RlLGNvbm5lY3Q6Y29ubmVjdGlvblR5cGVzfSlcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG4gICAgLy9UT0RPOiBjaGVjayBpZiBpdCBpcyBuZWVkZWQgdG8gcG9wdXAgZGlhbG9nLCBpZiBhbGwgY29ubmVjdGlvbiBpcyBkb2FibGUgYW5kIG9ubHkgb25lIHR5cGUgdG8gdXNlLCBubyBuZWVkIHRvIHNob3cgZGlhbG9nXHJcbiAgICB0aGlzLnNob3dDb25uZWN0aW9uRGlhbG9nKHByZXBhcmF0aW9uSW5mbylcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnNob3dDb25uZWN0aW9uRGlhbG9nID0gZnVuY3Rpb24gKHByZXBhcmF0aW9uSW5mbykge1xyXG4gICAgdmFyIGNvbmZpcm1EaWFsb2dEaXYgPSBuZXcgc2ltcGxlQ29uZmlybURpYWxvZygpXHJcbiAgICB2YXIgcmVzdWx0QWN0aW9ucz1bXVxyXG4gICAgY29uZmlybURpYWxvZ0Rpdi5zaG93KFxyXG4gICAgICAgIHsgd2lkdGg6IFwiNDUwcHhcIiB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGl0bGU6IFwiQWRkIGNvbm5lY3Rpb25zXCJcclxuICAgICAgICAgICAgLCBjb250ZW50OiBcIlwiXHJcbiAgICAgICAgICAgICwgYnV0dG9uczogW1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtcmVkIHczLWhvdmVyLXBpbmtcIiwgdGV4dDogXCJDb25maXJtXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNyZWF0ZUNvbm5lY3Rpb25zKHJlc3VsdEFjdGlvbnMpXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xvckNsYXNzOiBcInczLWdyYXlcIiwgdGV4dDogXCJDYW5jZWxcIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKClcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9XHJcbiAgICApXHJcbiAgICBjb25maXJtRGlhbG9nRGl2LmRpYWxvZ0Rpdi5lbXB0eSgpXHJcbiAgICBwcmVwYXJhdGlvbkluZm8uZm9yRWFjaCgob25lUm93LGluZGV4KT0+e1xyXG4gICAgICAgIHJlc3VsdEFjdGlvbnMucHVzaCh0aGlzLmNyZWF0ZU9uZUNvbm5lY3Rpb25BZGp1c3RSb3cob25lUm93LGNvbmZpcm1EaWFsb2dEaXYpKVxyXG4gICAgfSlcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmNyZWF0ZU9uZUNvbm5lY3Rpb25BZGp1c3RSb3cgPSBmdW5jdGlvbiAob25lUm93LGNvbmZpcm1EaWFsb2dEaXYpIHtcclxuICAgIHZhciByZXR1cm5PYmo9e31cclxuICAgIHZhciBmcm9tTm9kZT1vbmVSb3cuZnJvbVxyXG4gICAgdmFyIHRvTm9kZT1vbmVSb3cudG9cclxuICAgIHZhciBjb25uZWN0aW9uVHlwZXM9b25lUm93LmNvbm5lY3RcclxuICAgIHZhciBsYWJlbD0kKCc8bGFiZWwgc3R5bGU9XCJkaXNwbGF5OmJsb2NrO21hcmdpbi1ib3R0b206MnB4XCI+PC9sYWJlbD4nKVxyXG4gICAgaWYoY29ubmVjdGlvblR5cGVzLmxlbmd0aD09MCl7XHJcbiAgICAgICAgbGFiZWwuY3NzKFwiY29sb3JcIixcInJlZFwiKVxyXG4gICAgICAgIGxhYmVsLmh0bWwoXCJObyB1c2FibGUgY29ubmVjdGlvbiB0eXBlIGZyb20gPGI+XCIrZnJvbU5vZGUuaWQoKStcIjwvYj4gdG8gPGI+XCIrdG9Ob2RlLmlkKCkrXCI8L2I+XCIpXHJcbiAgICB9ZWxzZSBpZihjb25uZWN0aW9uVHlwZXMubGVuZ3RoPjEpeyBcclxuICAgICAgICBsYWJlbC5odG1sKFwiRnJvbSA8Yj5cIitmcm9tTm9kZS5pZCgpK1wiPC9iPiB0byA8Yj5cIit0b05vZGUuaWQoKStcIjwvYj5cIikgXHJcbiAgICAgICAgdmFyIHN3aXRjaFR5cGVTZWxlY3Rvcj1uZXcgc2ltcGxlU2VsZWN0TWVudShcIiBcIilcclxuICAgICAgICBsYWJlbC5wcmVwZW5kKHN3aXRjaFR5cGVTZWxlY3Rvci5ET00pXHJcbiAgICAgICAgY29ubmVjdGlvblR5cGVzLmZvckVhY2gob25lVHlwZT0+e1xyXG4gICAgICAgICAgICBzd2l0Y2hUeXBlU2VsZWN0b3IuYWRkT3B0aW9uKG9uZVR5cGUpXHJcbiAgICAgICAgfSlcclxuICAgICAgICByZXR1cm5PYmpbXCJmcm9tXCJdPWZyb21Ob2RlLmlkKClcclxuICAgICAgICByZXR1cm5PYmpbXCJ0b1wiXT10b05vZGUuaWQoKVxyXG4gICAgICAgIHJldHVybk9ialtcImNvbm5lY3RcIl09Y29ubmVjdGlvblR5cGVzWzBdXHJcbiAgICAgICAgc3dpdGNoVHlwZVNlbGVjdG9yLmNhbGxCYWNrX2NsaWNrT3B0aW9uPShvcHRpb25UZXh0LG9wdGlvblZhbHVlKT0+e1xyXG4gICAgICAgICAgICByZXR1cm5PYmpbXCJjb25uZWN0XCJdPW9wdGlvblRleHRcclxuICAgICAgICAgICAgc3dpdGNoVHlwZVNlbGVjdG9yLmNoYW5nZU5hbWUob3B0aW9uVGV4dClcclxuICAgICAgICB9XHJcbiAgICAgICAgc3dpdGNoVHlwZVNlbGVjdG9yLnRyaWdnZXJPcHRpb25JbmRleCgwKVxyXG4gICAgfWVsc2UgaWYoY29ubmVjdGlvblR5cGVzLmxlbmd0aD09MSl7XHJcbiAgICAgICAgcmV0dXJuT2JqW1wiZnJvbVwiXT1mcm9tTm9kZS5pZCgpXHJcbiAgICAgICAgcmV0dXJuT2JqW1widG9cIl09dG9Ob2RlLmlkKClcclxuICAgICAgICByZXR1cm5PYmpbXCJjb25uZWN0XCJdPWNvbm5lY3Rpb25UeXBlc1swXVxyXG4gICAgICAgIGxhYmVsLmNzcyhcImNvbG9yXCIsXCJncmVlblwiKVxyXG4gICAgICAgIGxhYmVsLmh0bWwoXCJBZGQgPGI+XCIrY29ubmVjdGlvblR5cGVzWzBdK1wiPC9iPiBjb25uZWN0aW9uIGZyb20gPGI+XCIrZnJvbU5vZGUuaWQoKStcIjwvYj4gdG8gPGI+XCIrdG9Ob2RlLmlkKCkrXCI8L2I+XCIpIFxyXG4gICAgfVxyXG4gICAgY29uZmlybURpYWxvZ0Rpdi5kaWFsb2dEaXYuYXBwZW5kKGxhYmVsKVxyXG4gICAgcmV0dXJuIHJldHVybk9iajtcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmNyZWF0ZUNvbm5lY3Rpb25zID0gYXN5bmMgZnVuY3Rpb24gKHJlc3VsdEFjdGlvbnMpIHtcclxuICAgIC8vIGZvciBlYWNoIHJlc3VsdEFjdGlvbnMsIGNhbGN1bGF0ZSB0aGUgYXBwZW5kaXggaW5kZXgsIHRvIGF2b2lkIHNhbWUgSUQgaXMgdXNlZCBmb3IgZXhpc3RlZCBjb25uZWN0aW9uc1xyXG4gICAgZnVuY3Rpb24gdXVpZHY0KCkge1xyXG4gICAgICAgIHJldHVybiAneHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIGZ1bmN0aW9uIChjKSB7XHJcbiAgICAgICAgICAgIHZhciByID0gTWF0aC5yYW5kb20oKSAqIDE2IHwgMCwgdiA9IGMgPT0gJ3gnID8gciA6IChyICYgMHgzIHwgMHg4KTtcclxuICAgICAgICAgICAgcmV0dXJuIHYudG9TdHJpbmcoMTYpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBmaW5hbEFjdGlvbnM9W11cclxuICAgIHJlc3VsdEFjdGlvbnMuZm9yRWFjaChvbmVBY3Rpb249PntcclxuICAgICAgICB2YXIgb25lRmluYWxBY3Rpb249e31cclxuICAgICAgICBvbmVGaW5hbEFjdGlvbltcIiRzcmNJZFwiXT1vbmVBY3Rpb25bXCJmcm9tXCJdXHJcbiAgICAgICAgb25lRmluYWxBY3Rpb25bXCIkcmVsYXRpb25zaGlwSWRcIl09dXVpZHY0KCk7XHJcbiAgICAgICAgb25lRmluYWxBY3Rpb25bXCJvYmpcIl09e1xyXG4gICAgICAgICAgICBcIiR0YXJnZXRJZFwiOiBvbmVBY3Rpb25bXCJ0b1wiXSxcclxuICAgICAgICAgICAgXCIkcmVsYXRpb25zaGlwTmFtZVwiOiBvbmVBY3Rpb25bXCJjb25uZWN0XCJdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZpbmFsQWN0aW9ucy5wdXNoKG9uZUZpbmFsQWN0aW9uKVxyXG4gICAgfSlcclxuICAgIHRyeXtcclxuICAgICAgICB2YXIgZGF0YSA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2NyZWF0ZVJlbGF0aW9uc1wiLCBcIlBPU1RcIiwgIHthY3Rpb25zOkpTT04uc3RyaW5naWZ5KGZpbmFsQWN0aW9ucyl9KVxyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgfVxyXG4gICAgZ2xvYmFsQ2FjaGUuc3RvcmVUd2luUmVsYXRpb25zaGlwc19hcHBlbmQoZGF0YSlcclxuICAgIHRoaXMuZHJhd1JlbGF0aW9ucyhkYXRhKVxyXG59XHJcblxyXG5cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5jaGVja0F2YWlsYWJsZUNvbm5lY3Rpb25UeXBlID0gZnVuY3Rpb24gKGZyb21Ob2RlTW9kZWwsdG9Ob2RlTW9kZWwpIHtcclxuICAgIHZhciByZT1bXVxyXG4gICAgdmFyIHZhbGlkUmVsYXRpb25zaGlwcz1tb2RlbEFuYWx5emVyLkRURExNb2RlbHNbZnJvbU5vZGVNb2RlbF0udmFsaWRSZWxhdGlvbnNoaXBzXHJcbiAgICB2YXIgdG9Ob2RlQmFzZUNsYXNzZXM9bW9kZWxBbmFseXplci5EVERMTW9kZWxzW3RvTm9kZU1vZGVsXS5hbGxCYXNlQ2xhc3Nlc1xyXG4gICAgaWYodmFsaWRSZWxhdGlvbnNoaXBzKXtcclxuICAgICAgICBmb3IodmFyIHJlbGF0aW9uTmFtZSBpbiB2YWxpZFJlbGF0aW9uc2hpcHMpe1xyXG4gICAgICAgICAgICB2YXIgdGhlUmVsYXRpb25UeXBlPXZhbGlkUmVsYXRpb25zaGlwc1tyZWxhdGlvbk5hbWVdXHJcbiAgICAgICAgICAgIGlmKHRoZVJlbGF0aW9uVHlwZS50YXJnZXQ9PW51bGxcclxuICAgICAgICAgICAgICAgICB8fCB0aGVSZWxhdGlvblR5cGUudGFyZ2V0PT10b05vZGVNb2RlbFxyXG4gICAgICAgICAgICAgICAgIHx8dG9Ob2RlQmFzZUNsYXNzZXNbdGhlUmVsYXRpb25UeXBlLnRhcmdldF0hPW51bGwpIHJlLnB1c2gocmVsYXRpb25OYW1lKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiByZVxyXG59XHJcblxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnN0YXJ0VGFyZ2V0Tm9kZU1vZGUgPSBmdW5jdGlvbiAobW9kZSkge1xyXG4gICAgdGhpcy5jb3JlLmF1dG91bnNlbGVjdGlmeSggdHJ1ZSApO1xyXG4gICAgdGhpcy5jb3JlLmNvbnRhaW5lcigpLnN0eWxlLmN1cnNvciA9ICdjcm9zc2hhaXInO1xyXG4gICAgdGhpcy50YXJnZXROb2RlTW9kZT1tb2RlO1xyXG4gICAgJChkb2N1bWVudCkua2V5ZG93bigoZXZlbnQpID0+IHtcclxuICAgICAgICBpZiAoZXZlbnQua2V5Q29kZSA9PSAyNykgdGhpcy5jYW5jZWxUYXJnZXROb2RlTW9kZSgpXHJcbiAgICB9KTtcclxuXHJcbiAgICB0aGlzLmNvcmUubm9kZXMoKS5vbignY2xpY2snLCAoZSk9PntcclxuICAgICAgICB2YXIgY2xpY2tlZE5vZGUgPSBlLnRhcmdldDtcclxuICAgICAgICB0aGlzLmFkZENvbm5lY3Rpb25zKGNsaWNrZWROb2RlKVxyXG4gICAgICAgIC8vZGVsYXkgYSBzaG9ydCB3aGlsZSBzbyBub2RlIHNlbGVjdGlvbiB3aWxsIG5vdCBiZSBjaGFuZ2VkIHRvIHRoZSBjbGlja2VkIHRhcmdldCBub2RlXHJcbiAgICAgICAgc2V0VGltZW91dCgoKT0+e3RoaXMuY2FuY2VsVGFyZ2V0Tm9kZU1vZGUoKX0sNTApXHJcblxyXG4gICAgfSk7XHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5jYW5jZWxUYXJnZXROb2RlTW9kZT1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy50YXJnZXROb2RlTW9kZT1udWxsO1xyXG4gICAgdGhpcy5jb3JlLmNvbnRhaW5lcigpLnN0eWxlLmN1cnNvciA9ICdkZWZhdWx0JztcclxuICAgICQoZG9jdW1lbnQpLm9mZigna2V5ZG93bicpO1xyXG4gICAgdGhpcy5jb3JlLm5vZGVzKCkub2ZmKFwiY2xpY2tcIilcclxuICAgIHRoaXMuY29yZS5hdXRvdW5zZWxlY3RpZnkoIGZhbHNlICk7XHJcbn1cclxuXHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUubm9Qb3NpdGlvbl9ncmlkPWZ1bmN0aW9uKGVsZXMpe1xyXG4gICAgdmFyIG5ld0xheW91dCA9IGVsZXMubGF5b3V0KHtcclxuICAgICAgICBuYW1lOiAnZ3JpZCcsXHJcbiAgICAgICAgYW5pbWF0ZTogZmFsc2UsXHJcbiAgICAgICAgZml0OmZhbHNlXHJcbiAgICB9KSBcclxuICAgIG5ld0xheW91dC5ydW4oKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUubm9Qb3NpdGlvbl9jb3NlPWZ1bmN0aW9uKGVsZXMpe1xyXG4gICAgaWYoZWxlcz09bnVsbCkgZWxlcz10aGlzLmNvcmUuZWxlbWVudHMoKVxyXG5cclxuICAgIHZhciBuZXdMYXlvdXQgPWVsZXMubGF5b3V0KHtcclxuICAgICAgICBuYW1lOiAnY29zZScsXHJcbiAgICAgICAgYW5pbWF0ZTogdHJ1ZSxcclxuICAgICAgICBncmF2aXR5OjEsXHJcbiAgICAgICAgYW5pbWF0ZTogZmFsc2VcclxuICAgICAgICAsZml0OmZhbHNlXHJcbiAgICB9KSBcclxuICAgIG5ld0xheW91dC5ydW4oKVxyXG4gICAgdGhpcy5jb3JlLmNlbnRlcihlbGVzKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUubm9Qb3NpdGlvbl9jb25jZW50cmljPWZ1bmN0aW9uKGVsZXMsYm94KXtcclxuICAgIGlmKGVsZXM9PW51bGwpIGVsZXM9dGhpcy5jb3JlLmVsZW1lbnRzKClcclxuICAgIHZhciBuZXdMYXlvdXQgPWVsZXMubGF5b3V0KHtcclxuICAgICAgICBuYW1lOiAnY29uY2VudHJpYycsXHJcbiAgICAgICAgYW5pbWF0ZTogZmFsc2UsXHJcbiAgICAgICAgZml0OmZhbHNlLFxyXG4gICAgICAgIG1pbk5vZGVTcGFjaW5nOjYwLFxyXG4gICAgICAgIGdyYXZpdHk6MSxcclxuICAgICAgICBib3VuZGluZ0JveDpib3hcclxuICAgIH0pIFxyXG4gICAgbmV3TGF5b3V0LnJ1bigpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5sYXlvdXRXaXRoTm9kZVBvc2l0aW9uPWZ1bmN0aW9uKG5vZGVQb3NpdGlvbil7XHJcbiAgICB2YXIgbmV3TGF5b3V0ID0gdGhpcy5jb3JlLmxheW91dCh7XHJcbiAgICAgICAgbmFtZTogJ3ByZXNldCcsXHJcbiAgICAgICAgcG9zaXRpb25zOiBub2RlUG9zaXRpb24sXHJcbiAgICAgICAgYW5pbWF0ZTogZmFsc2UsIC8vIHdoZXRoZXIgdG8gdHJhbnNpdGlvbiB0aGUgbm9kZSBwb3NpdGlvbnNcclxuICAgICAgICBhbmltYXRpb25EdXJhdGlvbjogNTAwLCAvLyBkdXJhdGlvbiBvZiBhbmltYXRpb24gaW4gbXMgaWYgZW5hYmxlZFxyXG4gICAgfSlcclxuICAgIG5ld0xheW91dC5ydW4oKVxyXG59XHJcblxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gdG9wb2xvZ3lET007IiwiY29uc3Qgc2ltcGxlVHJlZT1yZXF1aXJlKFwiLi4vc2hhcmVkU291cmNlRmlsZXMvc2ltcGxlVHJlZVwiKVxyXG5jb25zdCBtb2RlbEFuYWx5emVyPXJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9tb2RlbEFuYWx5emVyXCIpXHJcbmNvbnN0IG1zYWxIZWxwZXIgPSByZXF1aXJlKFwiLi4vbXNhbEhlbHBlclwiKVxyXG5jb25zdCBnbG9iYWxDYWNoZSA9IHJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9nbG9iYWxDYWNoZVwiKVxyXG5jb25zdCBJb1REZXZpY2VUd2luRGlhbG9nPXJlcXVpcmUoXCIuLi9zaGFyZWRTb3VyY2VGaWxlcy9Jb1REZXZpY2VUd2luRGlhbG9nXCIpO1xyXG5cclxuZnVuY3Rpb24gdHdpbnNUcmVlKERPTSwgc2VhcmNoRE9NKSB7XHJcbiAgICB0aGlzLnRyZWU9bmV3IHNpbXBsZVRyZWUoRE9NLHtcImxlYWZOYW1lUHJvcGVydHlcIjpcImRpc3BsYXlOYW1lXCJ9KVxyXG5cclxuICAgIHRoaXMudHJlZS5vcHRpb25zLmdyb3VwTm9kZUljb25GdW5jPShnbik9PntcclxuICAgICAgICB2YXIgbW9kZWxDbGFzcz1nbi5pbmZvW1wiQGlkXCJdXHJcbiAgICAgICAgdmFyIGNvbG9yQ29kZT1cImRhcmtHcmF5XCJcclxuICAgICAgICB2YXIgc2hhcGU9XCJlbGxpcHNlXCJcclxuICAgICAgICB2YXIgYXZhcnRhPW51bGxcclxuICAgICAgICB2YXIgZGltZW5zaW9uPTIwO1xyXG4gICAgICAgIGlmKGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdW21vZGVsQ2xhc3NdKXtcclxuICAgICAgICAgICAgdmFyIHZpc3VhbEpzb24gPWdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdW21vZGVsQ2xhc3NdXHJcbiAgICAgICAgICAgIHZhciBjb2xvckNvZGU9IHZpc3VhbEpzb24uY29sb3IgfHwgXCJkYXJrR3JheVwiXHJcbiAgICAgICAgICAgIHZhciBzaGFwZT0gIHZpc3VhbEpzb24uc2hhcGUgfHwgXCJlbGxpcHNlXCJcclxuICAgICAgICAgICAgdmFyIGF2YXJ0YT0gdmlzdWFsSnNvbi5hdmFydGEgXHJcbiAgICAgICAgICAgIGlmKHZpc3VhbEpzb24uZGltZW5zaW9uUmF0aW8pIGRpbWVuc2lvbio9cGFyc2VGbG9hdCh2aXN1YWxKc29uLmRpbWVuc2lvblJhdGlvKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGljb25ET009JChcIjxkaXYgc3R5bGU9J3dpZHRoOlwiK2RpbWVuc2lvbitcInB4O2hlaWdodDpcIitkaW1lbnNpb24rXCJweDtmbG9hdDpsZWZ0O3Bvc2l0aW9uOnJlbGF0aXZlJz48L2Rpdj5cIilcclxuICAgICAgICB2YXIgaW1nU3JjPWVuY29kZVVSSUNvbXBvbmVudCh0aGlzLnNoYXBlU3ZnKHNoYXBlLGNvbG9yQ29kZSkpXHJcbiAgICAgICAgaWNvbkRPTS5hcHBlbmQoJChcIjxpbWcgc3JjPSdkYXRhOmltYWdlL3N2Zyt4bWw7dXRmOCxcIitpbWdTcmMrXCInPjwvaW1nPlwiKSlcclxuICAgICAgICBpZihhdmFydGEpe1xyXG4gICAgICAgICAgICB2YXIgYXZhcnRhaW1nPSQoXCI8aW1nIHN0eWxlPSdwb3NpdGlvbjphYnNvbHV0ZTtsZWZ0OjBweDt3aWR0aDo2MCU7bWFyZ2luOjIwJScgc3JjPSdcIithdmFydGErXCInPjwvaW1nPlwiKVxyXG4gICAgICAgICAgICBpY29uRE9NLmFwcGVuZChhdmFydGFpbWcpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBpY29uRE9NXHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy50cmVlLm9wdGlvbnMuZ3JvdXBOb2RlVGFpbEJ1dHRvbkZ1bmMgPSAoZ24pID0+IHtcclxuICAgICAgICB2YXIgYWRkQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yZWQgdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cImZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjRweCA4cHg7cG9zaXRpb246YWJzb2x1dGU7dG9wOjUwJTtoZWlnaHQ6MjdweDsgcmlnaHQ6MTBweDt0cmFuc2Zvcm06dHJhbnNsYXRlWSgtNTAlKVwiPis8L2J1dHRvbj4nKVxyXG4gICAgICAgIGFkZEJ1dHRvbi5vbihcImNsaWNrXCIsIChlKSA9PiB7XHJcbiAgICAgICAgICAgIGduLmV4cGFuZCgpXHJcbiAgICAgICAgICAgIElvVERldmljZVR3aW5EaWFsb2cucG9wdXAoe1xyXG4gICAgICAgICAgICAgICAgXCIkbWV0YWRhdGFcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiJG1vZGVsXCI6IGduLmluZm9bXCJAaWRcIl1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXHJcbiAgICAgICAgfSlcclxuICAgICAgICByZXR1cm4gYWRkQnV0dG9uO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMudHJlZS5jYWxsYmFja19hZnRlclNlbGVjdE5vZGVzPShub2Rlc0Fycixtb3VzZUNsaWNrRGV0YWlsKT0+e1xyXG4gICAgICAgIHZhciBpbmZvQXJyPVtdXHJcbiAgICAgICAgbm9kZXNBcnIuZm9yRWFjaCgoaXRlbSwgaW5kZXgpID0+e1xyXG4gICAgICAgICAgICBpbmZvQXJyLnB1c2goaXRlbS5sZWFmSW5mbylcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJzaG93SW5mb1NlbGVjdGVkTm9kZXNcIiwgaW5mbzppbmZvQXJyLCBcIm1vdXNlQ2xpY2tEZXRhaWxcIjptb3VzZUNsaWNrRGV0YWlsfSlcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnRyZWUuY2FsbGJhY2tfYWZ0ZXJEYmxjbGlja05vZGU9KHRoZU5vZGUpPT57XHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiUGFuVG9Ob2RlXCIsIGluZm86dGhlTm9kZS5sZWFmSW5mb30pXHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5zZWFyY2hCb3g9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgIHBsYWNlaG9sZGVyPVwic2VhcmNoLi4uXCIvPicpLmFkZENsYXNzKFwidzMtaW5wdXRcIik7XHJcbiAgICB0aGlzLnNlYXJjaEJveC5jc3Moe1wib3V0bGluZVwiOlwibm9uZVwiLFwiaGVpZ2h0XCI6XCIxMDAlXCIsXCJ3aWR0aFwiOlwiMTAwJVwifSkgXHJcbiAgICBzZWFyY2hET00uYXBwZW5kKHRoaXMuc2VhcmNoQm94KVxyXG4gICAgdmFyIGhpZGVPclNob3dFbXB0eUdyb3VwPSQoJzxidXR0b24gc3R5bGU9XCJoZWlnaHQ6MjBweDtib3JkZXI6bm9uZTtwYWRkaW5nLWxlZnQ6MnB4XCIgY2xhc3M9XCJ3My1ibG9jayB3My10aW55IHczLWhvdmVyLXJlZCB3My1hbWJlclwiPkhpZGUgRW1wdHkgTW9kZWxzPC9idXR0b24+JylcclxuICAgIHNlYXJjaERPTS5hcHBlbmQoaGlkZU9yU2hvd0VtcHR5R3JvdXApXHJcbiAgICBET00uY3NzKFwidG9wXCIsXCI1MHB4XCIpXHJcbiAgICBoaWRlT3JTaG93RW1wdHlHcm91cC5hdHRyKFwic3RhdHVzXCIsXCJzaG93XCIpXHJcbiAgICBoaWRlT3JTaG93RW1wdHlHcm91cC5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICBpZihoaWRlT3JTaG93RW1wdHlHcm91cC5hdHRyKFwic3RhdHVzXCIpPT1cInNob3dcIil7XHJcbiAgICAgICAgICAgIGhpZGVPclNob3dFbXB0eUdyb3VwLmF0dHIoXCJzdGF0dXNcIixcImhpZGVcIilcclxuICAgICAgICAgICAgaGlkZU9yU2hvd0VtcHR5R3JvdXAudGV4dChcIlNob3cgRW1wdHkgTW9kZWxzXCIpXHJcbiAgICAgICAgICAgIHRoaXMudHJlZS5vcHRpb25zLmhpZGVFbXB0eUdyb3VwPXRydWVcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgaGlkZU9yU2hvd0VtcHR5R3JvdXAuYXR0cihcInN0YXR1c1wiLFwic2hvd1wiKVxyXG4gICAgICAgICAgICBoaWRlT3JTaG93RW1wdHlHcm91cC50ZXh0KFwiSGlkZSBFbXB0eSBNb2RlbHNcIilcclxuICAgICAgICAgICAgZGVsZXRlIHRoaXMudHJlZS5vcHRpb25zLmhpZGVFbXB0eUdyb3VwXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMudHJlZS5ncm91cE5vZGVzLmZvckVhY2gob25lR3JvdXBOb2RlPT57b25lR3JvdXBOb2RlLmNoZWNrT3B0aW9uSGlkZUVtcHR5R3JvdXAoKX0pXHJcbiAgICB9KVxyXG4gICAgdGhpcy5zZWFyY2hCb3gua2V5dXAoKGUpPT57XHJcbiAgICAgICAgaWYoZS5rZXlDb2RlID09IDEzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIGFOb2RlID0gdGhpcy50cmVlLnNlYXJjaFRleHQoJChlLnRhcmdldCkudmFsKCkpXHJcbiAgICAgICAgICAgIGlmKGFOb2RlIT1udWxsKXtcclxuICAgICAgICAgICAgICAgIGFOb2RlLnBhcmVudEdyb3VwTm9kZS5leHBhbmQoKVxyXG4gICAgICAgICAgICAgICAgdGhpcy50cmVlLnNlbGVjdExlYWZOb2RlKGFOb2RlKVxyXG4gICAgICAgICAgICAgICAgdGhpcy50cmVlLnNjcm9sbFRvTGVhZk5vZGUoYU5vZGUpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5cclxudHdpbnNUcmVlLnByb3RvdHlwZS5zaGFwZVN2Zz1mdW5jdGlvbihzaGFwZSxjb2xvcil7XHJcbiAgICBpZihzaGFwZT09XCJlbGxpcHNlXCIpe1xyXG4gICAgICAgIHJldHVybiAnPHN2ZyB4bWxuczpzdmc9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDEwMCAxMDBcIiBmaWxsPVwibm9uZVwiIHZlcnNpb249XCIxLjFcIiA+PGNpcmNsZSBjeD1cIjUwXCIgY3k9XCI1MFwiIHI9XCI1MFwiICBmaWxsPVwiJytjb2xvcisnXCIvPjwvc3ZnPidcclxuICAgIH1lbHNlIGlmKHNoYXBlPT1cImhleGFnb25cIil7XHJcbiAgICAgICAgcmV0dXJuICc8c3ZnIHhtbG5zOnN2Zz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHZpZXdCb3g9XCIwIDAgMTAwIDEwMFwiIGZpbGw9XCJub25lXCIgdmVyc2lvbj1cIjEuMVwiID48cG9seWdvbiBwb2ludHM9XCI1MCAwLCA5My4zIDI1LCA5My4zIDc1LCA1MCAxMDAsIDYuNyA3NSwgNi43IDI1XCIgIGZpbGw9XCInK2NvbG9yKydcIiAvPjwvc3ZnPidcclxuICAgIH1lbHNlIGlmKHNoYXBlPT1cInJvdW5kLXJlY3RhbmdsZVwiKXtcclxuICAgICAgICByZXR1cm4gJzxzdmcgeG1sbnM6c3ZnPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAxMDAgMTAwXCIgZmlsbD1cIm5vbmVcIiB2ZXJzaW9uPVwiMS4xXCIgPjxyZWN0IHg9XCIxMFwiIHk9XCIxMFwiIHJ4PVwiMTBcIiByeT1cIjEwXCIgd2lkdGg9XCI4MFwiIGhlaWdodD1cIjgwXCIgZmlsbD1cIicrY29sb3IrJ1wiIC8+PC9zdmc+J1xyXG4gICAgfVxyXG59XHJcblxyXG5cclxudHdpbnNUcmVlLnByb3RvdHlwZS5yeE1lc3NhZ2U9ZnVuY3Rpb24obXNnUGF5bG9hZCl7XHJcbiAgICBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwic3RhcnRTZWxlY3Rpb25fcmVwbGFjZVwiKSB0aGlzLmxvYWRTdGFydFNlbGVjdGlvbihtc2dQYXlsb2FkLnR3aW5JRHMsbXNnUGF5bG9hZC5tb2RlbElEcyxcInJlcGxhY2VcIilcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInN0YXJ0U2VsZWN0aW9uX2FwcGVuZFwiKSB0aGlzLmxvYWRTdGFydFNlbGVjdGlvbihtc2dQYXlsb2FkLnR3aW5JRHMsbXNnUGF5bG9hZC5tb2RlbElEcyxcImFwcGVuZFwiKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiZHJhd1R3aW5zQW5kUmVsYXRpb25zXCIpIHRoaXMuZHJhd1R3aW5zQW5kUmVsYXRpb25zKG1zZ1BheWxvYWQuaW5mbylcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cIkFEVE1vZGVsc0NoYW5nZVwiKSB0aGlzLnJlZnJlc2hNb2RlbHMoKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiYWRkTmV3VHdpblwiKSB0aGlzLmRyYXdPbmVUd2luKG1zZ1BheWxvYWQudHdpbkluZm8pXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJhZGROZXdUd2luc1wiKSB7XHJcbiAgICAgICAgbXNnUGF5bG9hZC50d2luc0luZm8uZm9yRWFjaChvbmVUd2luSW5mbz0+e3RoaXMuZHJhd09uZVR3aW4ob25lVHdpbkluZm8pfSlcclxuICAgIH1cclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInR3aW5zRGVsZXRlZFwiKSB0aGlzLmRlbGV0ZVR3aW5zKG1zZ1BheWxvYWQudHdpbklEQXJyKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwidmlzdWFsRGVmaW5pdGlvbkNoYW5nZVwiKXtcclxuICAgICAgICBpZighbXNnUGF5bG9hZC5zcmNNb2RlbElEKXsgLy8gY2hhbmdlIG1vZGVsIGNsYXNzIHZpc3VhbGl6YXRpb25cclxuICAgICAgICAgICAgdGhpcy50cmVlLmdyb3VwTm9kZXMuZm9yRWFjaChnbj0+e2duLnJlZnJlc2hOYW1lKCl9KVxyXG4gICAgICAgIH0gXHJcbiAgICB9XHJcbn1cclxuXHJcbnR3aW5zVHJlZS5wcm90b3R5cGUuZGVsZXRlVHdpbnM9ZnVuY3Rpb24odHdpbklEQXJyKXtcclxuICAgIHR3aW5JREFyci5mb3JFYWNoKHR3aW5JRD0+e1xyXG4gICAgICAgIHZhciB0d2luRGlzcGxheU5hbWU9Z2xvYmFsQ2FjaGUudHdpbklETWFwVG9EaXNwbGF5TmFtZVt0d2luSURdXHJcbiAgICAgICAgdGhpcy50cmVlLmRlbGV0ZUxlYWZOb2RlKHR3aW5EaXNwbGF5TmFtZSlcclxuICAgIH0pXHJcbn1cclxuXHJcbnR3aW5zVHJlZS5wcm90b3R5cGUucmVmcmVzaE1vZGVscz1mdW5jdGlvbigpe1xyXG4gICAgdmFyIG1vZGVsc0RhdGE9e31cclxuICAgIGZvcih2YXIgbW9kZWxJRCBpbiBtb2RlbEFuYWx5emVyLkRURExNb2RlbHMpe1xyXG4gICAgICAgIHZhciBvbmVNb2RlbD1tb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF1cclxuICAgICAgICBtb2RlbHNEYXRhW29uZU1vZGVsW1wiZGlzcGxheU5hbWVcIl1dID0gb25lTW9kZWxcclxuICAgIH1cclxuICAgIC8vZGVsZXRlIGFsbCBncm91cCBub2RlcyBvZiBkZWxldGVkIG1vZGVsc1xyXG4gICAgdGhpcy50cmVlLmdyb3VwTm9kZXMuZm9yRWFjaCgoZ25vZGUpPT57XHJcbiAgICAgICAgaWYobW9kZWxzRGF0YVtnbm9kZS5uYW1lXT09bnVsbCl7XHJcbiAgICAgICAgICAgIC8vZGVsZXRlIHRoaXMgZ3JvdXAgbm9kZVxyXG4gICAgICAgICAgICBnbm9kZS5kZWxldGVTZWxmKClcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG5cclxuICAgIC8vdGhlbiBhZGQgYWxsIGdyb3VwIG5vZGVzIHRoYXQgdG8gYmUgYWRkZWRcclxuICAgIHZhciBjdXJyZW50TW9kZWxOYW1lQXJyPVtdXHJcbiAgICB0aGlzLnRyZWUuZ3JvdXBOb2Rlcy5mb3JFYWNoKChnbm9kZSk9PntjdXJyZW50TW9kZWxOYW1lQXJyLnB1c2goZ25vZGUubmFtZSl9KVxyXG5cclxuICAgIHZhciBhY3R1YWxNb2RlbE5hbWVBcnI9W11cclxuICAgIGZvcih2YXIgaW5kIGluIG1vZGVsc0RhdGEpIGFjdHVhbE1vZGVsTmFtZUFyci5wdXNoKGluZClcclxuICAgIGFjdHVhbE1vZGVsTmFtZUFyci5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhLnRvTG93ZXJDYXNlKCkubG9jYWxlQ29tcGFyZShiLnRvTG93ZXJDYXNlKCkpIH0pO1xyXG5cclxuICAgIGZvcih2YXIgaT0wO2k8YWN0dWFsTW9kZWxOYW1lQXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIGlmKGk8Y3VycmVudE1vZGVsTmFtZUFyci5sZW5ndGggJiYgY3VycmVudE1vZGVsTmFtZUFycltpXT09YWN0dWFsTW9kZWxOYW1lQXJyW2ldKSBjb250aW51ZVxyXG4gICAgICAgIC8vb3RoZXJ3aXNlIGFkZCB0aGlzIGdyb3VwIHRvIHRoZSB0cmVlXHJcbiAgICAgICAgdmFyIG5ld0dyb3VwPXRoaXMudHJlZS5pbnNlcnRHcm91cE5vZGUobW9kZWxzRGF0YVthY3R1YWxNb2RlbE5hbWVBcnJbaV1dLGkpXHJcbiAgICAgICAgbmV3R3JvdXAuc2hyaW5rKClcclxuICAgICAgICBjdXJyZW50TW9kZWxOYW1lQXJyLnNwbGljZShpLCAwLCBhY3R1YWxNb2RlbE5hbWVBcnJbaV0pO1xyXG4gICAgfVxyXG59XHJcblxyXG5cclxudHdpbnNUcmVlLnByb3RvdHlwZS5sb2FkU3RhcnRTZWxlY3Rpb249YXN5bmMgZnVuY3Rpb24odHdpbklEcyxtb2RlbElEcyxyZXBsYWNlT3JBcHBlbmQpe1xyXG4gICAgaWYocmVwbGFjZU9yQXBwZW5kPT1cInJlcGxhY2VcIikgdGhpcy50cmVlLmNsZWFyQWxsTGVhZk5vZGVzKClcclxuXHJcbiAgICBcclxuICAgIHRoaXMucmVmcmVzaE1vZGVscygpXHJcbiAgICBcclxuICAgIC8vYWRkIG5ldyB0d2lucyB1bmRlciB0aGUgbW9kZWwgZ3JvdXAgbm9kZVxyXG4gICAgdHJ5e1xyXG4gICAgICAgIHZhciB0d2luc2RhdGEgPSBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9saXN0VHdpbnNGb3JJRHNcIiwgXCJQT1NUXCIsIHR3aW5JRHMpXHJcbiAgICAgICAgdmFyIHR3aW5JREFyciA9IFtdXHJcbiAgICAgICAgLy9jaGVjayBpZiBhbnkgY3VycmVudCBsZWFmIG5vZGUgZG9lcyBub3QgaGF2ZSBzdG9yZWQgb3V0Ym91bmQgcmVsYXRpb25zaGlwIGRhdGEgeWV0XHJcbiAgICAgICAgdGhpcy50cmVlLmdyb3VwTm9kZXMuZm9yRWFjaCgoZ05vZGUpID0+IHtcclxuICAgICAgICAgICAgZ05vZGUuY2hpbGRMZWFmTm9kZXMuZm9yRWFjaChsZWFmTm9kZSA9PiB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbm9kZUlkID0gbGVhZk5vZGUubGVhZkluZm9bXCIkZHRJZFwiXVxyXG4gICAgICAgICAgICAgICAgaWYgKGdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tub2RlSWRdID09IG51bGwpIHR3aW5JREFyci5wdXNoKG5vZGVJZClcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICBnbG9iYWxDYWNoZS5zdG9yZUFEVFR3aW5zKHR3aW5zZGF0YSlcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHR3aW5zZGF0YS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgZ3JvdXBOYW1lID0gZ2xvYmFsQ2FjaGUubW9kZWxJRE1hcFRvTmFtZVt0d2luc2RhdGFbaV1bXCIkbWV0YWRhdGFcIl1bXCIkbW9kZWxcIl1dXHJcbiAgICAgICAgICAgIHRoaXMudHJlZS5hZGRMZWFmbm9kZVRvR3JvdXAoZ3JvdXBOYW1lLCB0d2luc2RhdGFbaV0sIFwic2tpcFJlcGVhdFwiKVxyXG4gICAgICAgICAgICB0d2luSURBcnIucHVzaCh0d2luc2RhdGFbaV1bXCIkZHRJZFwiXSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYocmVwbGFjZU9yQXBwZW5kPT1cInJlcGxhY2VcIikgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwicmVwbGFjZUFsbFR3aW5zXCIsIGluZm86IHR3aW5zZGF0YSB9KVxyXG4gICAgICAgIGVsc2UgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiYXBwZW5kQWxsVHdpbnNcIiwgaW5mbzogdHdpbnNkYXRhIH0pXHJcbiAgICAgICAgXHJcblxyXG4gICAgICAgIHRoaXMuZmV0Y2hBbGxSZWxhdGlvbnNoaXBzKHR3aW5JREFycilcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgIH1cclxufVxyXG5cclxuXHJcblxyXG50d2luc1RyZWUucHJvdG90eXBlLmRyYXdUd2luc0FuZFJlbGF0aW9ucz0gZnVuY3Rpb24oZGF0YSl7XHJcbiAgICBkYXRhLmNoaWxkVHdpbnNBbmRSZWxhdGlvbnMuZm9yRWFjaChvbmVTZXQ9PntcclxuICAgICAgICBmb3IodmFyIGluZCBpbiBvbmVTZXQuY2hpbGRUd2lucyl7XHJcbiAgICAgICAgICAgIHZhciBvbmVUd2luPW9uZVNldC5jaGlsZFR3aW5zW2luZF1cclxuICAgICAgICAgICAgdGhpcy5kcmF3T25lVHdpbihvbmVUd2luKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbiAgICBcclxuICAgIC8vZHJhdyB0aG9zZSBrbm93biB0d2lucyBmcm9tIHRoZSByZWxhdGlvbnNoaXBzXHJcbiAgICB2YXIgdHdpbnNJbmZvPXt9XHJcbiAgICBkYXRhLmNoaWxkVHdpbnNBbmRSZWxhdGlvbnMuZm9yRWFjaChvbmVTZXQ9PntcclxuICAgICAgICB2YXIgcmVsYXRpb25zSW5mbz1vbmVTZXRbXCJyZWxhdGlvbnNoaXBzXCJdXHJcbiAgICAgICAgcmVsYXRpb25zSW5mby5mb3JFYWNoKChvbmVSZWxhdGlvbik9PntcclxuICAgICAgICAgICAgdmFyIHNyY0lEPW9uZVJlbGF0aW9uWyckc291cmNlSWQnXVxyXG4gICAgICAgICAgICB2YXIgdGFyZ2V0SUQ9b25lUmVsYXRpb25bJyR0YXJnZXRJZCddXHJcbiAgICAgICAgICAgIGlmKGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3NyY0lEXSlcclxuICAgICAgICAgICAgICAgIHR3aW5zSW5mb1tzcmNJRF0gPSBnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1tzcmNJRF1cclxuICAgICAgICAgICAgaWYoZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbdGFyZ2V0SURdKVxyXG4gICAgICAgICAgICAgICAgdHdpbnNJbmZvW3RhcmdldElEXSA9IGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3RhcmdldElEXSAgICBcclxuICAgICAgICB9KVxyXG4gICAgfSlcclxuICAgIHZhciB0bXBBcnI9W11cclxuICAgIGZvcih2YXIgdHdpbklEIGluIHR3aW5zSW5mbykgdG1wQXJyLnB1c2godHdpbnNJbmZvW3R3aW5JRF0pXHJcbiAgICB0bXBBcnIuZm9yRWFjaChvbmVUd2luPT57dGhpcy5kcmF3T25lVHdpbihvbmVUd2luKX0pXHJcbn1cclxuXHJcbnR3aW5zVHJlZS5wcm90b3R5cGUuZHJhd09uZVR3aW49IGZ1bmN0aW9uKHR3aW5JbmZvKXtcclxuICAgIHZhciBncm91cE5hbWU9Z2xvYmFsQ2FjaGUubW9kZWxJRE1hcFRvTmFtZVt0d2luSW5mb1tcIiRtZXRhZGF0YVwiXVtcIiRtb2RlbFwiXV1cclxuICAgIHRoaXMudHJlZS5hZGRMZWFmbm9kZVRvR3JvdXAoZ3JvdXBOYW1lLHR3aW5JbmZvLFwic2tpcFJlcGVhdFwiKVxyXG59XHJcblxyXG50d2luc1RyZWUucHJvdG90eXBlLmZldGNoQWxsUmVsYXRpb25zaGlwcz0gYXN5bmMgZnVuY3Rpb24odHdpbklEQXJyKXtcclxuICAgIHdoaWxlKHR3aW5JREFyci5sZW5ndGg+MCl7XHJcbiAgICAgICAgdmFyIHNtYWxsQXJyPSB0d2luSURBcnIuc3BsaWNlKDAsIDEwMCk7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICB2YXIgZGF0YSA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2dldFJlbGF0aW9uc2hpcHNGcm9tVHdpbklEc1wiLCBcIlBPU1RcIiwgc21hbGxBcnIpXHJcbiAgICAgICAgICAgIGlmIChkYXRhID09IFwiXCIpIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICBnbG9iYWxDYWNoZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzKGRhdGEpIC8vc3RvcmUgdGhlbSBpbiBnbG9iYWwgYXZhaWxhYmxlIGFycmF5XHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImRyYXdBbGxSZWxhdGlvbnNcIiwgaW5mbzogZGF0YSB9KVxyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coZSlcclxuICAgICAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB0d2luc1RyZWU7IiwiY29uc3Qgc2lnbnVwc2lnbmlubmFtZT1cIkIyQ18xX3Npbmd1cHNpZ25pbl9zcGFhcHAxXCJcclxuY29uc3QgYjJjVGVuYW50TmFtZT1cImF6dXJlaW90YjJjXCJcclxuXHJcbmNvbnN0IHVybCA9IG5ldyBVUkwod2luZG93LmxvY2F0aW9uLmhyZWYpO1xyXG5cclxudmFyIHN0ckFycj13aW5kb3cubG9jYXRpb24uaHJlZi5zcGxpdChcIj9cIilcclxudmFyIGlzTG9jYWxUZXN0PShzdHJBcnIuaW5kZXhPZihcInRlc3Q9MVwiKSE9LTEpXHJcblxyXG5jb25zdCBnbG9iYWxBcHBTZXR0aW5ncz17XHJcbiAgICBcImIyY1NpZ25VcFNpZ25Jbk5hbWVcIjogc2lnbnVwc2lnbmlubmFtZSxcclxuICAgIFwiYjJjU2NvcGVfdGFza21hc3RlclwiOlwiaHR0cHM6Ly9cIitiMmNUZW5hbnROYW1lK1wiLm9ubWljcm9zb2Z0LmNvbS90YXNrbWFzdGVybW9kdWxlL29wZXJhdGlvblwiLFxyXG4gICAgXCJiMmNTY29wZV9mdW5jdGlvbnNcIjpcImh0dHBzOi8vXCIrYjJjVGVuYW50TmFtZStcIi5vbm1pY3Jvc29mdC5jb20vYXp1cmVpb3Ryb2Nrc2Z1bmN0aW9ucy9iYXNpY1wiLFxyXG4gICAgXCJsb2dvdXRSZWRpcmVjdFVyaVwiOiB1cmwub3JpZ2luK1wiL3NwYWluZGV4Lmh0bWxcIixcclxuICAgIFwibXNhbENvbmZpZ1wiOntcclxuICAgICAgICBhdXRoOiB7XHJcbiAgICAgICAgICAgIGNsaWVudElkOiBcImY0NjkzYmU1LTYwMWItNGQwZS05MjA4LWMzNWQ5YWQ2MjM4N1wiLFxyXG4gICAgICAgICAgICBhdXRob3JpdHk6IFwiaHR0cHM6Ly9cIitiMmNUZW5hbnROYW1lK1wiLmIyY2xvZ2luLmNvbS9cIitiMmNUZW5hbnROYW1lK1wiLm9ubWljcm9zb2Z0LmNvbS9cIitzaWdudXBzaWduaW5uYW1lLFxyXG4gICAgICAgICAgICBrbm93bkF1dGhvcml0aWVzOiBbYjJjVGVuYW50TmFtZStcIi5iMmNsb2dpbi5jb21cIl0sXHJcbiAgICAgICAgICAgIHJlZGlyZWN0VXJpOiB3aW5kb3cubG9jYXRpb24uaHJlZlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY2FjaGU6IHtcclxuICAgICAgICAgICAgY2FjaGVMb2NhdGlvbjogXCJzZXNzaW9uU3RvcmFnZVwiLCBcclxuICAgICAgICAgICAgc3RvcmVBdXRoU3RhdGVJbkNvb2tpZTogZmFsc2VcclxuICAgICAgICB9LFxyXG4gICAgICAgIHN5c3RlbToge1xyXG4gICAgICAgICAgICBsb2dnZXJPcHRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICBsb2dnZXJDYWxsYmFjazogKGxldmVsLCBtZXNzYWdlLCBjb250YWluc1BpaSkgPT4ge31cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICBcImlzTG9jYWxUZXN0XCI6aXNMb2NhbFRlc3QsXHJcbiAgICBcInRhc2tNYXN0ZXJBUElVUklcIjooKGlzTG9jYWxUZXN0KT9cImh0dHA6Ly9sb2NhbGhvc3Q6NTAwMi9cIjpcImh0dHBzOi8vYXp1cmVpb3Ryb2Nrc3Rhc2ttYXN0ZXJtb2R1bGUuYXp1cmV3ZWJzaXRlcy5uZXQvXCIpLFxyXG4gICAgXCJmdW5jdGlvbnNBUElVUklcIjpcImh0dHBzOi8vYXp1cmVpb3Ryb2Nrc2Z1bmN0aW9ucy5henVyZXdlYnNpdGVzLm5ldC9hcGkvXCJcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBnbG9iYWxBcHBTZXR0aW5nczsiLCJjb25zdCBnbG9iYWxBcHBTZXR0aW5ncz1yZXF1aXJlKFwiLi9nbG9iYWxBcHBTZXR0aW5nc1wiKVxyXG5cclxuZnVuY3Rpb24gbXNhbEhlbHBlcigpe1xyXG4gICAgdGhpcy5teU1TQUxPYmogPSBuZXcgbXNhbC5QdWJsaWNDbGllbnRBcHBsaWNhdGlvbihnbG9iYWxBcHBTZXR0aW5ncy5tc2FsQ29uZmlnKTtcclxufVxyXG5cclxubXNhbEhlbHBlci5wcm90b3R5cGUuc2lnbkluPWFzeW5jIGZ1bmN0aW9uKCl7XHJcbiAgICB0cnl7XHJcbiAgICAgICAgdmFyIHJlc3BvbnNlPSBhd2FpdCB0aGlzLm15TVNBTE9iai5sb2dpblBvcHVwKHsgc2NvcGVzOltdICB9KSAvL2dsb2JhbEFwcFNldHRpbmdzLmIyY1Njb3Blc1xyXG4gICAgICAgIGlmIChyZXNwb25zZSAhPSBudWxsKXtcclxuICAgICAgICAgICAgdGhpcy5zZXRBY2NvdW50KHJlc3BvbnNlLmFjY291bnQpXHJcbiAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5hY2NvdW50XHJcbiAgICAgICAgfSBcclxuICAgICAgICBlbHNlICByZXR1cm4gdGhpcy5mZXRjaEFjY291bnQoKVxyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIGlmKGUuZXJyb3JDb2RlIT1cInVzZXJfY2FuY2VsbGVkXCIpIGNvbnNvbGUubG9nKGUpXHJcbiAgICB9XHJcbn1cclxuXHJcbm1zYWxIZWxwZXIucHJvdG90eXBlLnNldEFjY291bnQ9ZnVuY3Rpb24odGhlQWNjb3VudCl7XHJcbiAgICBpZih0aGVBY2NvdW50PT1udWxsKXJldHVybjtcclxuICAgIHRoaXMuYWNjb3VudElkID0gdGhlQWNjb3VudC5ob21lQWNjb3VudElkO1xyXG4gICAgdGhpcy5hY2NvdW50TmFtZSA9IHRoZUFjY291bnQudXNlcm5hbWU7XHJcbiAgICB0aGlzLnVzZXJOYW1lPXRoZUFjY291bnQubmFtZTtcclxufVxyXG5cclxubXNhbEhlbHBlci5wcm90b3R5cGUuZmV0Y2hBY2NvdW50PWZ1bmN0aW9uKG5vQW5pbWF0aW9uKXtcclxuICAgIGNvbnN0IGN1cnJlbnRBY2NvdW50cyA9IHRoaXMubXlNU0FMT2JqLmdldEFsbEFjY291bnRzKCk7XHJcbiAgICBpZiAoY3VycmVudEFjY291bnRzLmxlbmd0aCA8IDEpIHJldHVybjtcclxuICAgIHZhciBmb3VuZEFjY291bnQ9bnVsbDtcclxuICAgIGZvcih2YXIgaT0wO2k8Y3VycmVudEFjY291bnRzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBhbkFjY291bnQ9IGN1cnJlbnRBY2NvdW50c1tpXVxyXG4gICAgICAgIGlmKGFuQWNjb3VudC5ob21lQWNjb3VudElkLnRvVXBwZXJDYXNlKCkuaW5jbHVkZXMoZ2xvYmFsQXBwU2V0dGluZ3MuYjJjU2lnblVwU2lnbkluTmFtZS50b1VwcGVyQ2FzZSgpKVxyXG4gICAgICAgICAgICAmJiBhbkFjY291bnQuaWRUb2tlbkNsYWltcy5pc3MudG9VcHBlckNhc2UoKS5pbmNsdWRlcyhnbG9iYWxBcHBTZXR0aW5ncy5tc2FsQ29uZmlnLmF1dGgua25vd25BdXRob3JpdGllc1swXS50b1VwcGVyQ2FzZSgpKVxyXG4gICAgICAgICAgICAmJiBhbkFjY291bnQuaWRUb2tlbkNsYWltcy5hdWQgPT09IGdsb2JhbEFwcFNldHRpbmdzLm1zYWxDb25maWcuYXV0aC5jbGllbnRJZFxyXG4gICAgICAgICl7XHJcbiAgICAgICAgICAgIGZvdW5kQWNjb3VudD0gYW5BY2NvdW50O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMuc2V0QWNjb3VudChmb3VuZEFjY291bnQpXHJcbiAgICByZXR1cm4gZm91bmRBY2NvdW50O1xyXG59XHJcblxyXG5cclxubXNhbEhlbHBlci5wcm90b3R5cGUuY2FsbEF6dXJlRnVuY3Rpb25zU2VydmljZT1hc3luYyBmdW5jdGlvbihBUElTdHJpbmcsUkVTVE1ldGhvZCxwYXlsb2FkKXtcclxuICAgIHZhciBoZWFkZXJzT2JqPXt9XHJcbiAgICB2YXIgdG9rZW49YXdhaXQgdGhpcy5nZXRUb2tlbihnbG9iYWxBcHBTZXR0aW5ncy5iMmNTY29wZV9mdW5jdGlvbnMpXHJcbiAgICBoZWFkZXJzT2JqW1wiQXV0aG9yaXphdGlvblwiXT1gQmVhcmVyICR7dG9rZW59YFxyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICB2YXIgYWpheENvbnRlbnQ9e1xyXG4gICAgICAgICAgICB0eXBlOiBSRVNUTWV0aG9kIHx8ICdHRVQnLFxyXG4gICAgICAgICAgICBcImhlYWRlcnNcIjpoZWFkZXJzT2JqLFxyXG4gICAgICAgICAgICB1cmw6IGdsb2JhbEFwcFNldHRpbmdzLmZ1bmN0aW9uc0FQSVVSSStBUElTdHJpbmcsXHJcbiAgICAgICAgICAgIGNvbnRlbnRUeXBlOiBcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIixcclxuICAgICAgICAgICAgY3Jvc3NEb21haW46IHRydWUsXHJcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChyZXNwb25zZURhdGEsIHRleHRTdGF0dXMsIGpxWEhSKSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3BvbnNlRGF0YSlcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uIChyZXNwb25zZURhdGEsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKSB7XHJcbiAgICAgICAgICAgICAgICByZWplY3QocmVzcG9uc2VEYXRhKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKFJFU1RNZXRob2Q9PVwiUE9TVFwiKSBhamF4Q29udGVudC5kYXRhPSBKU09OLnN0cmluZ2lmeShwYXlsb2FkKVxyXG4gICAgICAgICQuYWpheChhamF4Q29udGVudCk7XHJcbiAgICB9KVxyXG59XHJcblxyXG5tc2FsSGVscGVyLnByb3RvdHlwZS5jYWxsQVBJPWFzeW5jIGZ1bmN0aW9uKEFQSVN0cmluZyxSRVNUTWV0aG9kLHBheWxvYWQpe1xyXG4gICAgdmFyIGhlYWRlcnNPYmo9e31cclxuICAgIGlmKCFnbG9iYWxBcHBTZXR0aW5ncy5pc0xvY2FsVGVzdCl7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICB2YXIgdG9rZW49YXdhaXQgdGhpcy5nZXRUb2tlbihnbG9iYWxBcHBTZXR0aW5ncy5iMmNTY29wZV90YXNrbWFzdGVyKVxyXG4gICAgICAgIH1jYXRjaChlKXtcclxuICAgICAgICAgICAgd2luZG93Lm9wZW4oZ2xvYmFsQXBwU2V0dGluZ3MubG9nb3V0UmVkaXJlY3RVcmksXCJfc2VsZlwiKVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBoZWFkZXJzT2JqW1wiQXV0aG9yaXphdGlvblwiXT1gQmVhcmVyICR7dG9rZW59YFxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgdmFyIGFqYXhDb250ZW50PXtcclxuICAgICAgICAgICAgdHlwZTogUkVTVE1ldGhvZCB8fCAnR0VUJyxcclxuICAgICAgICAgICAgXCJoZWFkZXJzXCI6aGVhZGVyc09iaixcclxuICAgICAgICAgICAgdXJsOiBnbG9iYWxBcHBTZXR0aW5ncy50YXNrTWFzdGVyQVBJVVJJK0FQSVN0cmluZyxcclxuICAgICAgICAgICAgY29udGVudFR5cGU6IFwiYXBwbGljYXRpb24vanNvbjsgY2hhcnNldD11dGYtOFwiLFxyXG4gICAgICAgICAgICBjcm9zc0RvbWFpbjogdHJ1ZSxcclxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKHJlc3BvbnNlRGF0YSwgdGV4dFN0YXR1cywganFYSFIpIHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUocmVzcG9uc2VEYXRhKVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKHJlc3BvbnNlRGF0YSwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pIHtcclxuICAgICAgICAgICAgICAgIHJlamVjdChyZXNwb25zZURhdGEpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoUkVTVE1ldGhvZD09XCJQT1NUXCIpIGFqYXhDb250ZW50LmRhdGE9IEpTT04uc3RyaW5naWZ5KHBheWxvYWQpXHJcbiAgICAgICAgJC5hamF4KGFqYXhDb250ZW50KTtcclxuICAgIH0pXHJcbn1cclxuXHJcbm1zYWxIZWxwZXIucHJvdG90eXBlLmdldFRva2VuPWFzeW5jIGZ1bmN0aW9uKGIyY1Njb3BlKXtcclxuICAgIHRyeXtcclxuICAgICAgICBpZih0aGlzLnN0b3JlZFRva2VuPT1udWxsKSB0aGlzLnN0b3JlZFRva2VuPXt9XHJcbiAgICAgICAgaWYodGhpcy5zdG9yZWRUb2tlbltiMmNTY29wZV0hPW51bGwpe1xyXG4gICAgICAgICAgICB2YXIgY3VyclRpbWU9cGFyc2VJbnQobmV3IERhdGUoKS5nZXRUaW1lKCkvMTAwMClcclxuICAgICAgICAgICAgaWYoY3VyclRpbWUrNjAgPCB0aGlzLnN0b3JlZFRva2VuW2IyY1Njb3BlXS5leHBpcmUpIHJldHVybiB0aGlzLnN0b3JlZFRva2VuW2IyY1Njb3BlXS5hY2Nlc3NUb2tlblxyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgdG9rZW5SZXF1ZXN0PXtcclxuICAgICAgICAgICAgc2NvcGVzOiBbYjJjU2NvcGVdLFxyXG4gICAgICAgICAgICBmb3JjZVJlZnJlc2g6IGZhbHNlLCAvLyBTZXQgdGhpcyB0byBcInRydWVcIiB0byBza2lwIGEgY2FjaGVkIHRva2VuIGFuZCBnbyB0byB0aGUgc2VydmVyIHRvIGdldCBhIG5ldyB0b2tlblxyXG4gICAgICAgICAgICBhY2NvdW50OiB0aGlzLm15TVNBTE9iai5nZXRBY2NvdW50QnlIb21lSWQodGhpcy5hY2NvdW50SWQpXHJcbiAgICAgICAgfVxyXG4gICAgXHJcbiAgICAgICAgdmFyIHJlc3BvbnNlID0gYXdhaXQgdGhpcy5teU1TQUxPYmouYWNxdWlyZVRva2VuU2lsZW50KHRva2VuUmVxdWVzdClcclxuICAgICAgICBpZiAoIXJlc3BvbnNlLmFjY2Vzc1Rva2VuIHx8IHJlc3BvbnNlLmFjY2Vzc1Rva2VuID09PSBcIlwiKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBtc2FsLkludGVyYWN0aW9uUmVxdWlyZWRBdXRoRXJyb3I7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuc3RvcmVkVG9rZW5bYjJjU2NvcGVdPXtcImFjY2Vzc1Rva2VuXCI6cmVzcG9uc2UuYWNjZXNzVG9rZW4sXCJleHBpcmVcIjpyZXNwb25zZS5pZFRva2VuQ2xhaW1zLmV4cH1cclxuICAgIH1jYXRjaChlcnJvcil7XHJcbiAgICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgbXNhbC5JbnRlcmFjdGlvblJlcXVpcmVkQXV0aEVycm9yKSB7XHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrIHRvIGludGVyYWN0aW9uIHdoZW4gc2lsZW50IGNhbGwgZmFpbHNcclxuICAgICAgICAgICAgdmFyIHJlc3BvbnNlPWF3YWl0IHRoaXMubXlNU0FMT2JqLmFjcXVpcmVUb2tlblBvcHVwKHRva2VuUmVxdWVzdClcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHJlc3BvbnNlLmFjY2Vzc1Rva2VuO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBtc2FsSGVscGVyKCk7IiwiY29uc3QgbW9kZWxBbmFseXplcj1yZXF1aXJlKFwiLi9tb2RlbEFuYWx5emVyXCIpXHJcbmNvbnN0IHNpbXBsZVNlbGVjdE1lbnU9IHJlcXVpcmUoXCIuL3NpbXBsZVNlbGVjdE1lbnVcIilcclxuY29uc3QgbXNhbEhlbHBlcj1yZXF1aXJlKFwiLi4vbXNhbEhlbHBlclwiKVxyXG5jb25zdCBnbG9iYWxDYWNoZT1yZXF1aXJlKFwiLi9nbG9iYWxDYWNoZVwiKVxyXG5cclxuZnVuY3Rpb24gSW9URGV2aWNlVHdpbkRpYWxvZygpIHtcclxuICAgIGlmKCF0aGlzLkRPTSl7XHJcbiAgICAgICAgdGhpcy5ET00gPSAkKCc8ZGl2IHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dG9wOjUwJTtiYWNrZ3JvdW5kLWNvbG9yOndoaXRlO2xlZnQ6NTAlO3RyYW5zZm9ybTogdHJhbnNsYXRlWCgtNTAlKSB0cmFuc2xhdGVZKC01MCUpO3otaW5kZXg6OTlcIiBjbGFzcz1cInczLWNhcmQtMlwiPjwvZGl2PicpXHJcbiAgICAgICAgJChcImJvZHlcIikuYXBwZW5kKHRoaXMuRE9NKVxyXG4gICAgICAgIHRoaXMuRE9NLmhpZGUoKVxyXG4gICAgfVxyXG59XHJcblxyXG5Jb1REZXZpY2VUd2luRGlhbG9nLnByb3RvdHlwZS5wb3B1cCA9IGFzeW5jIGZ1bmN0aW9uKHR3aW5JbmZvLGlvdERldmljZUluZm8pIHtcclxuICAgIHRoaXMub3JpZ2luYWxUd2luSW5mbz1KU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHR3aW5JbmZvKSlcclxuICAgIHRoaXMudHdpbkluZm89dHdpbkluZm9cclxuICAgIHRoaXMuaW90RGV2aWNlSW5mbz1pb3REZXZpY2VJbmZvXHJcbiAgICB0aGlzLkRPTS5zaG93KClcclxuICAgIHRoaXMuRE9NLmVtcHR5KClcclxuICAgIHRoaXMuY29udGVudERPTSA9ICQoJzxkaXYgc3R5bGU9XCJ3aWR0aDo2MDVweFwiPjwvZGl2PicpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQodGhpcy5jb250ZW50RE9NKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwiaGVpZ2h0OjQwcHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cImZvbnQtc2l6ZToxLjVlbVwiPkRpZ2l0YWwgVHdpbiBFZGl0b3I8L2Rpdj48L2Rpdj4nKSlcclxuICAgIHZhciBjbG9zZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmlnaHRcIiBzdHlsZT1cImZvbnQtc2l6ZToyZW07cGFkZGluZy10b3A6NHB4XCI+w5c8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmNoaWxkcmVuKCc6Zmlyc3QnKS5hcHBlbmQoY2xvc2VCdXR0b24pXHJcbiAgICBjbG9zZUJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5ET00uaGlkZSgpIH0pXHJcblxyXG4gICAgaWYoIXR3aW5JbmZvW1wiJGR0SWRcIl0pe1xyXG4gICAgICAgIHZhciBidG5UZXh0PVwiQWRkXCIvL3RoaXMgaXMgZm9yIGNyZWF0aW5nIG5ldyB0d2luXHJcbiAgICAgICAgdmFyIGJ0blRleHQyPVwiQWRkICYgQ2xvc2VcIlxyXG4gICAgICAgIHRoaXMuaXNDcmVhdGluZ1R3aW49dHJ1ZVxyXG4gICAgICAgIHZhciBva0J1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtY2FyZCB3My1ncmVlbiB3My1ob3Zlci1saWdodC1ncmVlblwiIHN0eWxlPVwiaGVpZ2h0OjEwMCVcIj4nK2J0blRleHQrJzwvYnV0dG9uPicpICAgIFxyXG4gICAgICAgIHRoaXMuY29udGVudERPTS5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKG9rQnV0dG9uKVxyXG4gICAgICAgIG9rQnV0dG9uLm9uKFwiY2xpY2tcIiwgYXN5bmMgKCkgPT4ge3RoaXMuYWRkTmV3VHdpbigpfSkgICAgXHJcbiAgICB9IFxyXG4gICAgZWxzZXtcclxuICAgICAgICBidG5UZXh0Mj1cIlNhdmVcIiAvL3RoaXMgaXMgd2hlbiBlZGl0aW5nIGEgZXhpc3RlZCB0d2luXHJcbiAgICB9IFxyXG4gICAgXHJcbiAgICB2YXIgc2Vjb25kQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1jYXJkIHczLWdyZWVuIHczLWhvdmVyLWxpZ2h0LWdyZWVuXCIgc3R5bGU9XCJoZWlnaHQ6MTAwJTttYXJnaW4tbGVmdDo1cHhcIj4nK2J0blRleHQyKyc8L2J1dHRvbj4nKSAgICBcclxuICAgIHRoaXMuY29udGVudERPTS5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKHNlY29uZEJ1dHRvbilcclxuXHJcbiAgICBpZighdHdpbkluZm9bXCIkZHRJZFwiXSl7XHJcbiAgICAgICAgc2Vjb25kQnV0dG9uLm9uKFwiY2xpY2tcIiwgYXN5bmMgKCkgPT4ge3RoaXMuYWRkTmV3VHdpbihcIkNsb3NlRGlhbG9nXCIpfSlcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHNlY29uZEJ1dHRvbi5vbihcImNsaWNrXCIsIGFzeW5jICgpID0+IHt0aGlzLnNhdmVUd2luKCl9KVxyXG4gICAgfVxyXG4gICAgXHJcblxyXG4gICAgdmFyIGZpcnN0Um93PSQoJzxkaXYgY2xhc3M9XCJ3My1jZWxsLXJvd1wiIHN0eWxlPVwicGFkZGluZy1ib3R0b206MTBweFwiPjwvZGl2PicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKGZpcnN0Um93KVxyXG4gICAgdmFyIHRvcExlZnREb209JCgnPGRpdiBjbGFzcz1cInczLWNvbnRhaW5lciB3My1jZWxsXCIgc3R5bGU9XCJcIj48L2Rpdj4nKVxyXG4gICAgdmFyIHRvcFJpZ2h0RG9tPSQoJzxkaXYgY2xhc3M9XCJ3My1jb250YWluZXIgdzMtY2VsbFwiIHN0eWxlPVwid2lkdGg6MzIwcHg7cGFkZGluZy1sZWZ0OjBweDtwYWRkaW5nLXJpZ2h0OjBweFwiIC8+JylcclxuICAgIGZpcnN0Um93LmFwcGVuZCh0b3BMZWZ0RG9tLHRvcFJpZ2h0RG9tKVxyXG5cclxuICAgIHRoaXMuc2FtcGxlVGVsZW1ldHJ5RGl2PSQoJzxkaXYgY2xhc3M9XCJ3My1ib3JkZXJcIiBzdHlsZT1cIm1hcmdpbjo1cHg7aGVpZ2h0OjEwMHB4O3Bvc2l0aW9uOnJlbGF0aXZlO292ZXJmbG93OmF1dG9cIiAvPicpXHJcbiAgICB0aGlzLnNhbXBsZVRlbGVtZXRyeURpdi5hcHBlbmQoJCgnPGRpdiBzdHlsZT1cInBhZGRpbmc6MnB4O3JpZ2h0OjBweDtwb3NpdGlvbjphYnNvbHV0ZTtmb250LXNpemU6OXB4XCIgY2xhc3M9XCJ3My1kYXJrLWdyYXlcIj5UZWxlbWV0cnkgRm9ybWF0IFNhbXBsZTwvZGl2PicpKVxyXG4gICAgdG9wUmlnaHREb20uYXBwZW5kKHRoaXMuc2FtcGxlVGVsZW1ldHJ5RGl2KVxyXG4gICAgdGhpcy5zYW1wbGVUZWxlbWV0cnlEaXYuaGlkZSgpXHJcbiAgICBcclxuICAgIHZhciBJRExhYmxlRGl2PSAkKFwiPGRpdiBjbGFzcz0ndzMtcGFkZGluZycgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6YmxhY2snPlR3aW4gSUQ8L2Rpdj5cIilcclxuICAgIHZhciBJRElucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwibWFyZ2luOjhweCAwO3BhZGRpbmc6MnB4O3dpZHRoOjE1MHB4O291dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZVwiIHBsYWNlaG9sZGVyPVwiSURcIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICB0aGlzLklESW5wdXQ9SURJbnB1dCBcclxuICAgIHZhciBtb2RlbElEPXR3aW5JbmZvW1wiJG1ldGFkYXRhXCJdW1wiJG1vZGVsXCJdXHJcbiAgICB2YXIgbW9kZWxMYWJsZURpdj0gJChcIjxkaXYgY2xhc3M9J3czLXBhZGRpbmcnIHN0eWxlPSdkaXNwbGF5OmlubGluZTtmb250LXdlaWdodDpib2xkO2NvbG9yOmJsYWNrJz5Nb2RlbDwvZGl2PlwiKVxyXG4gICAgdmFyIG1vZGVsSW5wdXQ9JCgnPGRpdiB0eXBlPVwidGV4dFwiIHN0eWxlPVwibWFyZ2luOjhweCAwO3BhZGRpbmc6MnB4O2Rpc3BsYXk6aW5saW5lXCIvPicpLnRleHQobW9kZWxJRCk7ICBcclxuICAgIHRvcExlZnREb20uYXBwZW5kKCQoXCI8ZGl2Lz5cIikuYXBwZW5kKElETGFibGVEaXYsSURJbnB1dCkpXHJcbiAgICB0b3BMZWZ0RG9tLmFwcGVuZCgkKFwiPGRpdi8+XCIpLmFwcGVuZChtb2RlbExhYmxlRGl2LG1vZGVsSW5wdXQpKVxyXG4gICAgSURJbnB1dC5jaGFuZ2UoKGUpPT57XHJcbiAgICAgICAgdGhpcy50d2luSW5mb1tcIiRkdElkXCJdPSQoZS50YXJnZXQpLnZhbCgpXHJcbiAgICB9KVxyXG5cclxuICAgIHZhciBpc0lvVENoZWNrPSAkKCc8aW5wdXQgY2xhc3M9XCJ3My1tYXJnaW4gdzMtY2hlY2tcIiBzdHlsZT1cIndpZHRoOjIwcHhcIiB0eXBlPVwiY2hlY2tib3hcIj4nKVxyXG4gICAgdmFyIGlzSW9UVGV4dCA9ICQoJzxsYWJlbCBjbGFzcz1cInczLWRhcmstZ3JheVwiIHN0eWxlPVwicGFkZGluZzoycHggOHB4O2ZvbnQtc2l6ZToxLjJlbTtib3JkZXItcmFkaXVzOiAzcHg7XCI+IFRoaXMgaXMgTk9UIGEgSW9UIERldmljZTwvbGFiZWw+JylcclxuICAgIHRoaXMuaXNJb1RDaGVjaz1pc0lvVENoZWNrXHJcbiAgICB0b3BMZWZ0RG9tLmFwcGVuZChpc0lvVENoZWNrLGlzSW9UVGV4dClcclxuXHJcblxyXG4gICAgdmFyIGRpYWxvZ0RPTT0kKCc8ZGl2IC8+JylcclxuICAgIHRoaXMuY29udGVudERPTS5hcHBlbmQoZGlhbG9nRE9NKVxyXG5cclxuICAgIFxyXG4gICAgdmFyIGVkaXRhYmxlUHJvcGVydGllcz1tb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF0uZWRpdGFibGVQcm9wZXJ0aWVzXHJcbiAgICBpZigkLmlzRW1wdHlPYmplY3QoZWRpdGFibGVQcm9wZXJ0aWVzKSl7XHJcbiAgICAgICAgdmFyIHRpdGxlVGFibGU9JCgnPGRpdj5XYXJuaW5nOiBUaGVyZSBpcyBubyBwcm9wZXJ0aWUgaW4gdGhpcyBtb2RlbCB0byBtYXAgd2l0aCBhIElvVCBkZXZpY2U8L2Rpdj4nKVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgdmFyIHRpdGxlVGFibGU9JCgnPHRhYmxlIHN0eWxlPVwid2lkdGg6MTAwJVwiIGNlbGxzcGFjaW5nPVwiMHB4XCIgY2VsbHBhZGRpbmc9XCIwcHhcIj48L3RhYmxlPicpXHJcbiAgICAgICAgdGl0bGVUYWJsZS5hcHBlbmQoJCgnPHRyPjx0ZCBzdHlsZT1cImZvbnQtd2VpZ2h0OmJvbGQ7IHdpZHRoOjIyMHB4XCI+SW9UIFNldHRpbmc8L3RkPjx0ZCBzdHlsZT1cImZvbnQtd2VpZ2h0OmJvbGRcIj5QYXJhbWV0ZXIgVHJlZTwvdGQ+PC90cj4nKSlcclxuICAgICAgICB0aXRsZVRhYmxlLmhpZGUoKSBcclxuICAgIH1cclxuXHJcbiAgICBkaWFsb2dET00uYXBwZW5kKCQoXCI8ZGl2IGNsYXNzPSd3My1jb250YWluZXInLz5cIikuYXBwZW5kKHRpdGxlVGFibGUpKVxyXG5cclxuICAgIHZhciBJb1RTZXR0aW5nRGl2PSQoXCI8ZGl2IGNsYXNzPSd3My1jb250YWluZXIgdzMtYm9yZGVyJyBzdHlsZT0nd2lkdGg6MTAwJTttYXgtaGVpZ2h0OjMwMHB4O292ZXJmbG93OmF1dG8nPjwvZGl2PlwiKVxyXG4gICAgdGhpcy5Jb1RTZXR0aW5nRGl2PUlvVFNldHRpbmdEaXZcclxuICAgIElvVFNldHRpbmdEaXYuaGlkZSgpXHJcbiAgICBkaWFsb2dET00uYXBwZW5kKElvVFNldHRpbmdEaXYpXHJcbiAgICB0aGlzLmRyYXdJb1RTZXR0aW5ncygpXHJcblxyXG4gICAgaXNJb1RDaGVjay5vbihcImNoYW5nZVwiLChlKT0+e1xyXG4gICAgICAgIGlmKGlzSW9UQ2hlY2sucHJvcCgnY2hlY2tlZCcpKSB7XHJcbiAgICAgICAgICAgIHZhciB0aGVIZWlnaHQ9IElvVFNldHRpbmdEaXYuaGVpZ2h0KClcclxuICAgICAgICAgICAgaXNJb1RUZXh0LnJlbW92ZUNsYXNzKFwidzMtZGFyay1ncmF5XCIpLmFkZENsYXNzKFwidzMtbGltZVwiKVxyXG4gICAgICAgICAgICBpc0lvVFRleHQudGV4dChcIlRoaXMgaXMgYSBJb1QgRGV2aWNlXCIpXHJcblxyXG4gICAgICAgICAgICBpZighdGhpcy5pb3REZXZpY2VJbmZvKSB0aGlzLmlvdERldmljZUluZm89e31cclxuICAgICAgICAgICAgaWYoZS5pc1RyaWdnZXIpeyAvLyBpdCBpcyBmcm9tIHByb2dyYW1tYXRpY2FsdHJpZ2dlclxyXG4gICAgICAgICAgICAgICAgSW9UU2V0dGluZ0Rpdi5jc3MoXCJoZWlnaHRcIix0aGVIZWlnaHQrMTArXCJweFwiKVxyXG4gICAgICAgICAgICAgICAgdGl0bGVUYWJsZS5zaG93KClcclxuICAgICAgICAgICAgICAgIElvVFNldHRpbmdEaXYuc2hvdygpICAgIFxyXG4gICAgICAgICAgICAgICAgdGhpcy5zYW1wbGVUZWxlbWV0cnlEaXYuc2hvdygpXHJcbiAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgSW9UU2V0dGluZ0Rpdi5jc3MoXCJoZWlnaHRcIixcIjBweFwiKVxyXG4gICAgICAgICAgICAgICAgdGl0bGVUYWJsZS5zaG93KClcclxuICAgICAgICAgICAgICAgIElvVFNldHRpbmdEaXYuc2hvdygpXHJcbiAgICAgICAgICAgICAgICBJb1RTZXR0aW5nRGl2LmFuaW1hdGUoe1wiaGVpZ2h0XCI6dGhlSGVpZ2h0KzEwK1wicHhcIn0pXHJcbiAgICAgICAgICAgICAgICB0aGlzLnNhbXBsZVRlbGVtZXRyeURpdi5mYWRlSW4oKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfWVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmlvdERldmljZUluZm89bnVsbDtcclxuICAgICAgICAgICAgaXNJb1RUZXh0LnJlbW92ZUNsYXNzKFwidzMtbGltZVwiKS5hZGRDbGFzcyhcInczLWRhcmstZ3JheVwiKVxyXG4gICAgICAgICAgICBpc0lvVFRleHQudGV4dChcIlRoaXMgaXMgTk9UIGEgSW9UIERldmljZVwiKVxyXG4gICAgICAgICAgICBpZihlLmlzVHJpZ2dlcil7IC8vIGl0IGlzIGZyb20gcHJvZ3JhbW1hdGljYWx0cmlnZ2VyXHJcbiAgICAgICAgICAgICAgICBJb1RTZXR0aW5nRGl2LmNzcyhcImhlaWdodFwiLFwiXCIpO1xyXG4gICAgICAgICAgICAgICAgSW9UU2V0dGluZ0Rpdi5oaWRlKCk7XHJcbiAgICAgICAgICAgICAgICB0aXRsZVRhYmxlLmhpZGUoKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5zYW1wbGVUZWxlbWV0cnlEaXYuaGlkZSgpICAgIFxyXG4gICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgIElvVFNldHRpbmdEaXYuYW5pbWF0ZSh7XCJoZWlnaHRcIjpcIjBweFwifSwoKT0+e0lvVFNldHRpbmdEaXYuY3NzKFwiaGVpZ2h0XCIsXCJcIik7SW9UU2V0dGluZ0Rpdi5oaWRlKCk7dGl0bGVUYWJsZS5oaWRlKCl9KVxyXG4gICAgICAgICAgICAgICAgdGhpcy5zYW1wbGVUZWxlbWV0cnlEaXYuZmFkZU91dCgpICAgIFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuXHJcbiAgICBpZih0aGlzLmlvdERldmljZUluZm8pe1xyXG4gICAgICAgIGlzSW9UQ2hlY2sucHJvcCggXCJjaGVja2VkXCIsIHRydWUgKTtcclxuICAgICAgICBpc0lvVENoZWNrLnRyaWdnZXIoXCJjaGFuZ2VcIikgICAgXHJcbiAgICB9XHJcbn1cclxuXHJcbklvVERldmljZVR3aW5EaWFsb2cucHJvdG90eXBlLnNhdmVUd2luPSBhc3luYyBmdW5jdGlvbigpe1xyXG4gICAgLy9UT0RPOiBzYXZlIHRoZSB0d2luIGNoYW5nZVxyXG59XHJcblxyXG5Jb1REZXZpY2VUd2luRGlhbG9nLnByb3RvdHlwZS5hZGROZXdUd2luID0gYXN5bmMgZnVuY3Rpb24oY2xvc2VEaWFsb2cpIHtcclxuICAgIGlmKCF0aGlzLnR3aW5JbmZvW1wiJGR0SWRcIl18fHRoaXMudHdpbkluZm9bXCIkZHRJZFwiXT09XCJcIil7XHJcbiAgICAgICAgYWxlcnQoXCJQbGVhc2UgZmlsbCBpbiBuYW1lIGZvciB0aGUgbmV3IGRpZ2l0YWwgdHdpblwiKVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHZhciBtb2RlbElEPXRoaXMudHdpbkluZm9bXCIkbWV0YWRhdGFcIl1bXCIkbW9kZWxcIl1cclxuICAgIHZhciBjb21wb25lbnRzTmFtZUFycj1tb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF0uaW5jbHVkZWRDb21wb25lbnRzXHJcbiAgICBjb21wb25lbnRzTmFtZUFyci5mb3JFYWNoKG9uZUNvbXBvbmVudE5hbWU9PnsgLy9hZHQgc2VydmljZSByZXF1ZXN0aW5nIGFsbCBjb21wb25lbnQgYXBwZWFyIGJ5IG1hbmRhdG9yeVxyXG4gICAgICAgIGlmKHRoaXMudHdpbkluZm9bb25lQ29tcG9uZW50TmFtZV09PW51bGwpdGhpcy50d2luSW5mb1tvbmVDb21wb25lbnROYW1lXT17fVxyXG4gICAgICAgIHRoaXMudHdpbkluZm9bb25lQ29tcG9uZW50TmFtZV1bXCIkbWV0YWRhdGFcIl09IHt9XHJcbiAgICB9KVxyXG5cclxuICAgIC8vYXNrIHRhc2ttYXN0ZXIgdG8gYWRkIHRoZSB0d2luXHJcbiAgICB0cnl7XHJcbiAgICAgICAgdmFyIHBvc3RCb2R5PSB7XCJuZXdUd2luSnNvblwiOkpTT04uc3RyaW5naWZ5KHRoaXMudHdpbkluZm8pfVxyXG4gICAgICAgIGlmKHRoaXMuaW90RGV2aWNlSW5mbykgcG9zdEJvZHkuaW90RGV2aWNlSW5mbz0gSlNPTi5zdHJpbmdpZnkodGhpcy5pb3REZXZpY2VJbmZvKVxyXG4gICAgICAgIHZhciBkYXRhID0gYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vdXBzZXJ0RGlnaXRhbFR3aW5cIiwgXCJQT1NUXCIsIHBvc3RCb2R5IClcclxuICAgIH1jYXRjaChlKXtcclxuICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgIH1cclxuXHJcbiAgICBnbG9iYWxDYWNoZS5zdG9yZVNpbmdsZURCVHdpbihkYXRhLkRCVHdpbikgICAgXHJcbiAgICBnbG9iYWxDYWNoZS5zdG9yZVNpbmdsZUFEVFR3aW4oZGF0YS5BRFRUd2luKVxyXG5cclxuICAgIC8vaXQgc2hvdWxkIHNlbGVjdCB0aGUgbmV3IG5vZGUgaW4gdGhlIHRyZWUsIGFuZCBtb3ZlIHRvcG9sb2d5IHZpZXcgdG8gc2hvdyB0aGUgbmV3IG5vZGUgKG5vdGUgbm90IGJsb2NrZWQgYnkgdGhlIGRpYWxvZyBpdHNlbGYpXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJhZGROZXdUd2luXCIsIHR3aW5JbmZvOiBkYXRhLkFEVFR3aW4gfSlcclxuXHJcbiAgICBpZihjbG9zZURpYWxvZyl0aGlzLkRPTS5oaWRlKClcclxuICAgIGVsc2V7XHJcbiAgICAgICAgLy9jbGVhciB0aGUgaW5wdXQgZWRpdGJveFxyXG4gICAgICAgIGlmKHRoaXMuaW90RGV2aWNlSW5mbykgdGhpcy5wb3B1cCh0aGlzLm9yaWdpbmFsVHdpbkluZm8se30pXHJcbiAgICAgICAgZWxzZSB0aGlzLnBvcHVwKHRoaXMub3JpZ2luYWxUd2luSW5mbylcclxuICAgIH1cclxuICAgIFxyXG59XHJcblxyXG5Jb1REZXZpY2VUd2luRGlhbG9nLnByb3RvdHlwZS5kcmF3SW9UU2V0dGluZ3MgPSBhc3luYyBmdW5jdGlvbigpIHtcclxuICAgIHZhciBtb2RlbElEPXRoaXMudHdpbkluZm9bXCIkbWV0YWRhdGFcIl1bXCIkbW9kZWxcIl1cclxuICAgIHZhciBtb2RlbERldGFpbD0gbW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdXHJcbiAgICB0aGlzLmNvcHlNb2RlbEVkaXRhYmxlUHJvcGVydHk9SlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShtb2RlbERldGFpbC5lZGl0YWJsZVByb3BlcnRpZXMpKVxyXG4gICAgdGhpcy5pb3RTZXR0aW5nc0Fycj1bXVxyXG4gICAgXHJcbiAgICB2YXIgaW90VGFibGU9JCgnPHRhYmxlIHN0eWxlPVwid2lkdGg6MTAwJVwiIGNlbGxzcGFjaW5nPVwiMHB4XCIgY2VsbHBhZGRpbmc9XCIwcHhcIj48L3RhYmxlPicpXHJcbiAgICB0aGlzLklvVFNldHRpbmdEaXYuYXBwZW5kKGlvdFRhYmxlKVxyXG5cclxuICAgIHZhciBpbml0aWFsUGF0aEFycj1bXVxyXG4gICAgdGhpcy5hbGxTZWxlY3RNZW51PVtdXHJcbiAgICB0aGlzLmRyYXdFZGl0YWJsZShpb3RUYWJsZSx0aGlzLmNvcHlNb2RlbEVkaXRhYmxlUHJvcGVydHksaW5pdGlhbFBhdGhBcnIsW10pXHJcblxyXG4gICAgdGhpcy5Jb1RTZXR0aW5nRGl2Lm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuc2hyaW5rQWxsU2VsZWN0TWVudSgpfSlcclxuICAgIHRoaXMuSW9UU2V0dGluZ0Rpdi5vbihcInNjcm9sbFwiLCgpPT57dGhpcy5zaHJpbmtBbGxTZWxlY3RNZW51KCl9KVxyXG59XHJcblxyXG5Jb1REZXZpY2VUd2luRGlhbG9nLnByb3RvdHlwZS5zaHJpbmtBbGxTZWxlY3RNZW51ID0gYXN5bmMgZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLmFsbFNlbGVjdE1lbnUuZm9yRWFjaChzZWxlY3RtZW51PT57XHJcbiAgICAgICAgc2VsZWN0bWVudS5zaHJpbmsoKVxyXG4gICAgfSlcclxufVxyXG5cclxuSW9URGV2aWNlVHdpbkRpYWxvZy5wcm90b3R5cGUuZHJhd0VkaXRhYmxlID0gYXN5bmMgZnVuY3Rpb24ocGFyZW50VGFibGUsanNvbkluZm8scGF0aEFycixsYXN0Um9vdE5vZGVSZWNvcmQpIHtcclxuICAgIGlmKGpzb25JbmZvPT1udWxsKSByZXR1cm47XHJcbiAgICB2YXIgYXJyPVtdXHJcbiAgICBmb3IodmFyIGluZCBpbiBqc29uSW5mbykgYXJyLnB1c2goaW5kKVxyXG5cclxuICAgIGZvcih2YXIgdGhlSW5kZXg9MDt0aGVJbmRleDxhcnIubGVuZ3RoO3RoZUluZGV4Kyspe1xyXG4gICAgICAgIGlmKHRoZUluZGV4PT1hcnIubGVuZ3RoLTEpIGxhc3RSb290Tm9kZVJlY29yZFtwYXRoQXJyLmxlbmd0aF0gPXRydWU7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGluZCA9IGFyclt0aGVJbmRleF1cclxuICAgICAgICB2YXIgdHI9JChcIjx0ci8+XCIpXHJcbiAgICAgICAgdmFyIGxlZnRURD0kKFwiPHRkIHN0eWxlPSd3aWR0aDoyMjBweCcvPlwiKVxyXG4gICAgICAgIHZhciByaWdodFREPSQoXCI8dGQgc3R5bGU9J2hlaWdodDozMHB4Jy8+XCIpXHJcbiAgICAgICAgdHIuYXBwZW5kKGxlZnRURCxyaWdodFREKVxyXG4gICAgICAgIHBhcmVudFRhYmxlLmFwcGVuZCh0cilcclxuICAgICAgICBcclxuICAgICAgICBcclxuICAgICAgICBmb3IodmFyIGk9MDtpPHBhdGhBcnIubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgIGlmKCFsYXN0Um9vdE5vZGVSZWNvcmRbaV0pIHJpZ2h0VEQuYXBwZW5kKHRoaXMudHJlZUxpbmVEaXYoMikpXHJcbiAgICAgICAgICAgIGVsc2UgcmlnaHRURC5hcHBlbmQodGhpcy50cmVlTGluZURpdig0KSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKHRoZUluZGV4PT1hcnIubGVuZ3RoLTEpIHJpZ2h0VEQuYXBwZW5kKHRoaXMudHJlZUxpbmVEaXYoMykpXHJcbiAgICAgICAgZWxzZSByaWdodFRELmFwcGVuZCh0aGlzLnRyZWVMaW5lRGl2KDEpKVxyXG5cclxuICAgICAgICB2YXIgcE5hbWVEaXY9JChcIjxkaXYgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO2xpbmUtaGVpZ2h0OjI4cHg7bWFyZ2luLWxlZnQ6M3B4Jz5cIitpbmQrXCI8L2Rpdj5cIilcclxuICAgICAgICByaWdodFRELmFwcGVuZChwTmFtZURpdilcclxuICAgICAgICB2YXIgbmV3UGF0aD1wYXRoQXJyLmNvbmNhdChbaW5kXSlcclxuXHJcbiAgICAgICAgaWYoQXJyYXkuaXNBcnJheShqc29uSW5mb1tpbmRdKSl7IC8vaXQgaXMgYSBlbnVtZXJhdG9yXHJcbiAgICAgICAgICAgIHZhciB0eXBlRE9NPSQoXCI8bGFiZWwgY2xhc3M9J3czLWRhcmstZ3JheScgc3R5bGU9J2ZvbnQtc2l6ZTo5cHg7cGFkZGluZzoycHg7bWFyZ2luLWxlZnQ6NXB4Jz5lbnVtPC9sYWJlbD5cIilcclxuICAgICAgICAgICAgcmlnaHRURC5hcHBlbmQodHlwZURPTSlcclxuICAgICAgICAgICAgdmFyIHZhbHVlQXJyPVtdXHJcbiAgICAgICAgICAgIGpzb25JbmZvW2luZF0uZm9yRWFjaChlbGU9Pnt2YWx1ZUFyci5wdXNoKGVsZS5lbnVtVmFsdWUpfSlcclxuICAgICAgICAgICAgdmFyIGxhYmVsMT0kKFwiPGxhYmVsIGNsYXNzPSd3My1kYXJrLWdyYXknIHN0eWxlPSdmb250LXNpemU6OXB4O3BhZGRpbmc6MnB4O21hcmdpbi1sZWZ0OjJweCc+XCIrdmFsdWVBcnIuam9pbigpK1wiPC9sYWJlbD5cIilcclxuICAgICAgICAgICAgcmlnaHRURC5hcHBlbmQobGFiZWwxKVxyXG4gICAgICAgICAgICB2YXIgSW9Uc2V0dGluZ09iaj17XCJ0eXBlXCI6XCJcIixcInBhdGhcIjpuZXdQYXRoLFwicHR5cGVcIjpcImVudW1lcmF0b3JcIn1cclxuICAgICAgICAgICAgdGhpcy5pb3RTZXR0aW5nc0Fyci5wdXNoKElvVHNldHRpbmdPYmopXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd0lvVFNlbGVjdERyb3Bkb3duKGxlZnRURCxJb1RzZXR0aW5nT2JqLHBOYW1lRGl2KVxyXG4gICAgICAgIH1lbHNlIGlmKHR5cGVvZihqc29uSW5mb1tpbmRdKT09PVwib2JqZWN0XCIpIHtcclxuICAgICAgICAgICAgdGhpcy5kcmF3RWRpdGFibGUocGFyZW50VGFibGUsanNvbkluZm9baW5kXSxuZXdQYXRoLGxhc3RSb290Tm9kZVJlY29yZClcclxuICAgICAgICB9ZWxzZSB7XHJcbiAgICAgICAgICAgIHZhciBJb1RzZXR0aW5nT2JqPXtcInR5cGVcIjpcIlwiLFwicGF0aFwiOm5ld1BhdGgsXCJwdHlwZVwiOmpzb25JbmZvW2luZF19XHJcbiAgICAgICAgICAgIHRoaXMuaW90U2V0dGluZ3NBcnIucHVzaChJb1RzZXR0aW5nT2JqKVxyXG4gICAgICAgICAgICB0aGlzLmRyYXdJb1RTZWxlY3REcm9wZG93bihsZWZ0VEQsSW9Uc2V0dGluZ09iaixwTmFtZURpdilcclxuICAgICAgICAgICAgdmFyIHR5cGVET009JChcIjxsYWJlbCBjbGFzcz0ndzMtZGFyay1ncmF5JyBzdHlsZT0nZm9udC1zaXplOjlweDtwYWRkaW5nOjJweDttYXJnaW4tbGVmdDo1cHgnPlwiK2pzb25JbmZvW2luZF0rXCI8L2xhYmVsPlwiKVxyXG4gICAgICAgICAgICByaWdodFRELmFwcGVuZCh0eXBlRE9NKVxyXG4gICAgICAgIH0gXHJcbiAgICB9XHJcbn1cclxuXHJcbklvVERldmljZVR3aW5EaWFsb2cucHJvdG90eXBlLmRyYXdJb1RTZWxlY3REcm9wZG93bj1mdW5jdGlvbih0ZCxJb1RzZXR0aW5nT2JqLHBOYW1lRGl2KXtcclxuICAgIHZhciBhU2VsZWN0TWVudSA9IG5ldyBzaW1wbGVTZWxlY3RNZW51KFwiXCJcclxuICAgICAgICAsIHtcclxuICAgICAgICAgICAgXCJpc0NsaWNrYWJsZVwiOiB0cnVlLCBcIndpdGhCb3JkZXJcIjogdHJ1ZVxyXG4gICAgICAgICAgICAsIGJ1dHRvbkNTUzogeyBcInBhZGRpbmdcIjogXCI0cHggMTZweFwiLCB3aWR0aDogXCIyMTBweFwiIH1cclxuICAgICAgICAgICAgLFwib3B0aW9uTGlzdE1hcmdpblRvcFwiOjgwLFwib3B0aW9uTGlzdE1hcmdpbkxlZnRcIjoyMTBcclxuICAgICAgICAgICAgLFwiYWRqdXN0UG9zaXRpb25BbmNob3JcIjp0aGlzLkRPTS5vZmZzZXQoKVxyXG4gICAgICAgIH1cclxuICAgIClcclxuICAgIGFTZWxlY3RNZW51LmNhbGxCYWNrX2JlZm9yZUNsaWNrRXhwYW5kPSgpPT57XHJcbiAgICAgICAgdGhpcy5zaHJpbmtBbGxTZWxlY3RNZW51KClcclxuICAgIH1cclxuICAgIHRoaXMuYWxsU2VsZWN0TWVudS5wdXNoKGFTZWxlY3RNZW51KVxyXG4gICAgdGQuYXBwZW5kKGFTZWxlY3RNZW51LnJvd0RPTSlcclxuICAgIGFTZWxlY3RNZW51LmFkZE9wdGlvbihcIk5PVCBJb1QgRGV2aWNlIHBhcmFtZXRlclwiLFwiTk9ORVwiKVxyXG4gICAgYVNlbGVjdE1lbnUuYWRkT3B0aW9uKFwiSW9UIERldmljZSBUZWxlbWV0cnlcIixcInRlbGVtZXRyeVwiLFwidzMtbGltZVwiKVxyXG4gICAgYVNlbGVjdE1lbnUuYWRkT3B0aW9uKFwiSW9UIERldmljZSBEZXNpcmVkIFByb3BlcnR5XCIsXCJkZXNpcmVkXCIsXCJ3My1hbWJlclwiKVxyXG4gICAgYVNlbGVjdE1lbnUuYWRkT3B0aW9uKFwiSW9UIERldmljZSBSZXBvcnQgUHJvcGVydHlcIixcInJlcG9ydFwiLFwidzMtYmx1ZVwiKVxyXG5cclxuICAgIGFTZWxlY3RNZW51LmNhbGxCYWNrX2NsaWNrT3B0aW9uPShvcHRpb25UZXh0LG9wdGlvblZhbHVlLHJlYWxNb3VzZUNsaWNrLGNvbG9yQ2xhc3MpPT57XHJcbiAgICAgICAgSW9Uc2V0dGluZ09ialtcInR5cGVcIl09b3B0aW9uVmFsdWVcclxuICAgICAgICBhU2VsZWN0TWVudS5jaGFuZ2VOYW1lKG9wdGlvblRleHQpXHJcbiAgICAgICAgaWYoY29sb3JDbGFzcyl7XHJcbiAgICAgICAgICAgIGFTZWxlY3RNZW51LmJ1dHRvbi5hdHRyKCdjbGFzcycsICd3My1idXR0b24gdzMtYm9yZGVyICcrY29sb3JDbGFzcyk7XHJcbiAgICAgICAgICAgIHBOYW1lRGl2LmF0dHIoJ2NsYXNzJywgY29sb3JDbGFzcyk7XHJcbiAgICAgICAgfSBlbHNle1xyXG4gICAgICAgICAgICBhU2VsZWN0TWVudS5idXR0b24uYXR0cignY2xhc3MnLCAndzMtYnV0dG9uIHczLWJvcmRlcicpICAgXHJcbiAgICAgICAgICAgIHBOYW1lRGl2LmF0dHIoJ2NsYXNzJywgJycpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZihyZWFsTW91c2VDbGljaykgdGhpcy5yZWZyZXNoSW9UVGVsZW1ldHJ5U2FtcGxlKClcclxuICAgIH1cclxuICAgIGFTZWxlY3RNZW51LnRyaWdnZXJPcHRpb25JbmRleCgwKVxyXG59XHJcblxyXG5Jb1REZXZpY2VUd2luRGlhbG9nLnByb3RvdHlwZS5yZWZyZXNoSW9UVGVsZW1ldHJ5U2FtcGxlID0gZnVuY3Rpb24oKXtcclxuICAgIHZhciBzYW1wbGVPYmo9e31cclxuICAgIFxyXG4gICAgdGhpcy5pb3RTZXR0aW5nc0Fyci5mb3JFYWNoKG9uZXA9PntcclxuICAgICAgICBpZihvbmVwLnR5cGUhPVwidGVsZW1ldHJ5XCIpIHJldHVybjtcclxuICAgICAgICB2YXIgcGF0aEFycj1vbmVwLnBhdGhcclxuICAgICAgICB2YXIgcHR5cGU9b25lcC5wdHlwZVxyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciB0aGVSb290PXNhbXBsZU9ialxyXG4gICAgICAgIGZvcih2YXIgaT0wO2k8cGF0aEFyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgdmFyIHN0cj1wYXRoQXJyW2ldXHJcbiAgICAgICAgICAgIGlmKGk9PXBhdGhBcnIubGVuZ3RoLTEpIHtcclxuICAgICAgICAgICAgICAgIC8vW1wiRW51bVwiLFwiT2JqZWN0XCIsXCJib29sZWFuXCIsXCJkYXRlXCIsXCJkYXRlVGltZVwiLFwiZG91YmxlXCIsXCJkdXJhdGlvblwiLFwiZmxvYXRcIixcImludGVnZXJcIixcImxvbmdcIixcInN0cmluZ1wiLFwidGltZVwiXVxyXG4gICAgICAgICAgICAgICAgdmFyIHZhbHVlU2FtcGxlXHJcbiAgICAgICAgICAgICAgICBpZihwdHlwZT09XCJlbnVtZXJhdG9yXCIgfHwgcHR5cGU9PVwic3RyaW5nXCIpIHZhbHVlU2FtcGxlPVwic3RyaW5nVmFsdWVcIlxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZihwdHlwZT09XCJib29sZWFuXCIpIHZhbHVlU2FtcGxlID0gdHJ1ZVxyXG4gICAgICAgICAgICAgICAgZWxzZSBpZihwdHlwZT09XCJkYXRlVGltZVwiKSAgdmFsdWVTYW1wbGUgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcclxuICAgICAgICAgICAgICAgIGVsc2UgaWYocHR5cGU9PVwiZGF0ZVwiKSAgdmFsdWVTYW1wbGUgPSAobmV3IERhdGUoKS50b0lTT1N0cmluZygpKS5zcGxpdChcIlRcIilbMF1cclxuICAgICAgICAgICAgICAgIGVsc2UgaWYocHR5cGU9PVwiZG91YmxlXCIgfHwgcHR5cGU9PVwiZmxvYXRcIikgIHZhbHVlU2FtcGxlID0xLjFcclxuICAgICAgICAgICAgICAgIGVsc2UgaWYocHR5cGU9PVwiZHVyYXRpb25cIikgdmFsdWVTYW1wbGU9XCJQVDE2SDMwTVwiXHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmKHB0eXBlPT1cImludGVnZXJcIiB8fCBwdHlwZT09XCJsb25nXCIpIHZhbHVlU2FtcGxlPTFcclxuICAgICAgICAgICAgICAgIGVsc2UgaWYocHR5cGU9PVwidGltZVwiKSB2YWx1ZVNhbXBsZSA9XCJUXCIrKChuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkpLnNwbGl0KFwiVFwiKVsxXSlcclxuICAgICAgICAgICAgICAgIGVsc2UgdmFsdWVTYW1wbGU9XCJVbmtub3duXCJcclxuICAgICAgICAgICAgICAgIHRoZVJvb3Rbc3RyXT12YWx1ZVNhbXBsZVxyXG4gICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgIGlmKCF0aGVSb290W3N0cl0pdGhlUm9vdFtzdHJdPXt9XHJcbiAgICAgICAgICAgICAgICB0aGVSb290PXRoZVJvb3Rbc3RyXVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuXHJcbiAgICB2YXIgbGFiZWw9dGhpcy5zYW1wbGVUZWxlbWV0cnlEaXYuZmluZCgnOmZpcnN0LWNoaWxkJyk7XHJcbiAgICB2YXIgc2NyaXB0PSAkKCc8cHJlIHN0eWxlPVwiY29sb3I6Z3JheTttYXJnaW46MHB4XCI+JytKU09OLnN0cmluZ2lmeShzYW1wbGVPYmosbnVsbCwyKSsnPC9wcmU+JylcclxuICAgIHRoaXMuc2FtcGxlVGVsZW1ldHJ5RGl2LmVtcHR5KCkuYXBwZW5kKGxhYmVsLHNjcmlwdClcclxufVxyXG5cclxuSW9URGV2aWNlVHdpbkRpYWxvZy5wcm90b3R5cGUudHJlZUxpbmVEaXYgPSBmdW5jdGlvbih0eXBlTnVtYmVyKSB7XHJcbiAgICB2YXIgcmVEaXY9JCgnPGRpdiBzdHlsZT1cIm1hcmdpbi1sZWZ0OjEwcHg7d2lkdGg6MTVweDtoZWlnaHQ6IDEwMCU7ZmxvYXQ6IGxlZnRcIj48L2Rpdj4nKVxyXG4gICAgaWYodHlwZU51bWJlcj09MSl7XHJcbiAgICAgICAgcmVEaXYuYXBwZW5kKCQoJzxkaXYgY2xhc3M9XCJ3My1ib3JkZXItYm90dG9tIHczLWJvcmRlci1sZWZ0XCIgc3R5bGU9XCJ3aWR0aDoxMDAlO2hlaWdodDo1MCU7XCI+PC9kaXY+PGRpdiBjbGFzcz1cInczLWJvcmRlci1sZWZ0XCIgc3R5bGU9XCJ3aWR0aDoxMDAlO2hlaWdodDo1MCU7XCI+PC9kaXY+JykpXHJcbiAgICB9ZWxzZSBpZih0eXBlTnVtYmVyPT0yKXtcclxuICAgICAgICByZURpdi5hcHBlbmQoJCgnPGRpdiBjbGFzcz1cInczLWJvcmRlci1sZWZ0XCIgc3R5bGU9XCJ3aWR0aDoxMDAlO2hlaWdodDo1MCU7XCI+PC9kaXY+PGRpdiBjbGFzcz1cInczLWJvcmRlci1sZWZ0XCIgc3R5bGU9XCJ3aWR0aDoxMDAlO2hlaWdodDo1MCU7XCI+PC9kaXY+JykpXHJcbiAgICB9ZWxzZSBpZih0eXBlTnVtYmVyPT0zKXtcclxuICAgICAgICByZURpdi5hcHBlbmQoJCgnPGRpdiBjbGFzcz1cInczLWJvcmRlci1ib3R0b20gdzMtYm9yZGVyLWxlZnRcIiBzdHlsZT1cIndpZHRoOjEwMCU7aGVpZ2h0OjUwJTtcIj4nKSlcclxuICAgIH1lbHNlIGlmKHR5cGVOdW1iZXI9PTQpe1xyXG4gICAgICAgIFxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlRGl2XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IElvVERldmljZVR3aW5EaWFsb2coKTsiLCJjb25zdCBtc2FsSGVscGVyPXJlcXVpcmUoXCIuLi9tc2FsSGVscGVyXCIpXHJcbmNvbnN0IG1vZGVsQW5hbHl6ZXI9cmVxdWlyZShcIi4vbW9kZWxBbmFseXplclwiKVxyXG5cclxuZnVuY3Rpb24gZ2xvYmFsQ2FjaGUoKXtcclxuICAgIHRoaXMuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzID0ge31cclxuICAgIHRoaXMuc3RvcmVkVHdpbnMgPSB7fVxyXG4gICAgLy9zdG9yZWQgZGF0YSwgc2VwZXJhdGVseSBmcm9tIEFEVCBzZXJ2aWNlIGFuZCBmcm9tIGNvc21vc0RCIHNlcnZpY2VcclxuICAgIHRoaXMuREJNb2RlbHNBcnIgPSBbXVxyXG4gICAgdGhpcy5tb2RlbElETWFwVG9OYW1lPXt9XHJcbiAgICB0aGlzLm1vZGVsTmFtZU1hcFRvSUQ9e31cclxuXHJcbiAgICB0aGlzLkRCVHdpbnNBcnIgPSBbXVxyXG4gICAgdGhpcy50d2luSURNYXBUb0Rpc3BsYXlOYW1lPXt9XHJcblxyXG4gICAgdGhpcy5jdXJyZW50TGF5b3V0TmFtZT1udWxsXHJcbiAgICB0aGlzLmxheW91dEpTT049e31cclxuXHJcbiAgICB0aGlzLnZpc3VhbERlZmluaXRpb249e1wiZGVmYXVsdFwiOnt9fVxyXG59XHJcblxyXG5nbG9iYWxDYWNoZS5wcm90b3R5cGUubG9hZFVzZXJEYXRhID0gYXN5bmMgZnVuY3Rpb24gKCkge1xyXG4gICAgdHJ5e1xyXG4gICAgICAgIHZhciByZXM9YXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vZmV0Y2hVc2VyRGF0YVwiKVxyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHZhciBkYnR3aW5zPVtdXHJcbiAgICB2YXIgZGJtb2RlbHM9W11cclxuICAgIHJlcy5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIGlmKGVsZW1lbnQudHlwZT09XCJ2aXN1YWxTY2hlbWFcIikge1xyXG4gICAgICAgICAgICAvL1RPRE86IG5vdyB0aGVyZSBpcyBvbmx5IG9uZSBcImRlZmF1bHRcIiBzY2hlbWEgdG8gdXNlXHJcbiAgICAgICAgICAgIHRoaXMudmlzdWFsRGVmaW5pdGlvbltlbGVtZW50Lm5hbWVdPWVsZW1lbnQuZGV0YWlsXHJcbiAgICAgICAgfWVsc2UgaWYoZWxlbWVudC50eXBlPT1cIlRvcG9sb2d5XCIpIHtcclxuICAgICAgICAgICAgdGhpcy5sYXlvdXRKU09OW2VsZW1lbnQubmFtZV09ZWxlbWVudC5kZXRhaWxcclxuICAgICAgICB9ZWxzZSBpZihlbGVtZW50LnR5cGU9PVwiRFRNb2RlbFwiKSBkYm1vZGVscy5wdXNoKGVsZW1lbnQpXHJcbiAgICAgICAgZWxzZSBpZihlbGVtZW50LnR5cGU9PVwiRFRUd2luXCIpIGRidHdpbnMucHVzaChlbGVtZW50KVxyXG4gICAgfSk7XHJcbiAgICB0aGlzLnN0b3JlREJUd2luc0FycihkYnR3aW5zKVxyXG4gICAgdGhpcy5zdG9yZURCTW9kZWxzQXJyKGRibW9kZWxzKVxyXG4gICAgLy9xdWVyeSBkZXRhaWwgb2YgYWxsIG1vZGVsc1xyXG4gICAgZm9yKHZhciBpbmQgaW4gdGhpcy5tb2RlbElETWFwVG9OYW1lKSBkZWxldGUgdGhpcy5tb2RlbElETWFwVG9OYW1lW2luZF1cclxuICAgIGZvcih2YXIgaW5kIGluIHRoaXMubW9kZWxOYW1lTWFwVG9JRCkgZGVsZXRlIHRoaXMubW9kZWxOYW1lTWFwVG9JRFtpbmRdXHJcbiAgICB2YXIgbW9kZWxJRHM9W11cclxuICAgIHRoaXMuREJNb2RlbHNBcnIuZm9yRWFjaChvbmVNb2RlbD0+e21vZGVsSURzLnB1c2gob25lTW9kZWxbXCJpZFwiXSl9KVxyXG4gICAgdHJ5IHtcclxuICAgICAgICB2YXIgZGF0YSA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2xpc3RNb2RlbHNGb3JJRHNcIiwgXCJQT1NUXCIsIG1vZGVsSURzKVxyXG4gICAgICAgIHZhciB0bXBOYW1lVG9PYmogPSB7fVxyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAoZGF0YVtpXVtcImRpc3BsYXlOYW1lXCJdID09IG51bGwpIGRhdGFbaV1bXCJkaXNwbGF5TmFtZVwiXSA9IGRhdGFbaV1bXCJAaWRcIl1cclxuICAgICAgICAgICAgaWYgKCQuaXNQbGFpbk9iamVjdChkYXRhW2ldW1wiZGlzcGxheU5hbWVcIl0pKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGF0YVtpXVtcImRpc3BsYXlOYW1lXCJdW1wiZW5cIl0pIGRhdGFbaV1bXCJkaXNwbGF5TmFtZVwiXSA9IGRhdGFbaV1bXCJkaXNwbGF5TmFtZVwiXVtcImVuXCJdXHJcbiAgICAgICAgICAgICAgICBlbHNlIGRhdGFbaV1bXCJkaXNwbGF5TmFtZVwiXSA9IEpTT04uc3RyaW5naWZ5KGRhdGFbaV1bXCJkaXNwbGF5TmFtZVwiXSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodG1wTmFtZVRvT2JqW2RhdGFbaV1bXCJkaXNwbGF5TmFtZVwiXV0gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgLy9yZXBlYXRlZCBtb2RlbCBkaXNwbGF5IG5hbWVcclxuICAgICAgICAgICAgICAgIGRhdGFbaV1bXCJkaXNwbGF5TmFtZVwiXSA9IGRhdGFbaV1bXCJAaWRcIl1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0bXBOYW1lVG9PYmpbZGF0YVtpXVtcImRpc3BsYXlOYW1lXCJdXSA9IGRhdGFbaV1cclxuXHJcbiAgICAgICAgICAgIHRoaXMubW9kZWxJRE1hcFRvTmFtZVtkYXRhW2ldW1wiQGlkXCJdXT1kYXRhW2ldW1wiZGlzcGxheU5hbWVcIl1cclxuICAgICAgICAgICAgdGhpcy5tb2RlbE5hbWVNYXBUb0lEW2RhdGFbaV1bXCJkaXNwbGF5TmFtZVwiXV09ZGF0YVtpXVtcIkBpZFwiXVxyXG4gICAgICAgIH1cclxuICAgICAgICBtb2RlbEFuYWx5emVyLmNsZWFyQWxsTW9kZWxzKCk7XHJcbiAgICAgICAgbW9kZWxBbmFseXplci5hZGRNb2RlbHMoZGF0YSlcclxuICAgICAgICBtb2RlbEFuYWx5emVyLmFuYWx5emUoKTtcclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgIH1cclxufVxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLnN0b3JlQURUVHdpbnM9ZnVuY3Rpb24odHdpbnNEYXRhKXtcclxuICAgIHR3aW5zRGF0YS5mb3JFYWNoKChvbmVOb2RlKT0+e3RoaXMuc3RvcmVTaW5nbGVBRFRUd2luKG9uZU5vZGUpfSk7XHJcbn1cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZVNpbmdsZUFEVFR3aW49ZnVuY3Rpb24ob25lTm9kZSl7XHJcbiAgICB0aGlzLnN0b3JlZFR3aW5zW29uZU5vZGVbXCIkZHRJZFwiXV0gPSBvbmVOb2RlXHJcbiAgICBvbmVOb2RlW1wiZGlzcGxheU5hbWVcIl09IHRoaXMudHdpbklETWFwVG9EaXNwbGF5TmFtZVtvbmVOb2RlW1wiJGR0SWRcIl1dXHJcbn1cclxuXHJcblxyXG5nbG9iYWxDYWNoZS5wcm90b3R5cGUuc3RvcmVTaW5nbGVEQlR3aW49ZnVuY3Rpb24oREJUd2luKXtcclxuICAgIGZvcih2YXIgaT0wO2k8dGhpcy5EQlR3aW5zQXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBvbmVEQlR3aW49dGhpcy5EQlR3aW5zQXJyW2ldXHJcbiAgICAgICAgaWYob25lREJUd2luW1wiaWRcIl09PURCVHdpbltcImlkXCJdKXtcclxuICAgICAgICAgICAgdGhpcy5EQlR3aW5zQXJyLnNwbGljZShpLDEpXHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMuREJUd2luc0Fyci5wdXNoKERCVHdpbilcclxuXHJcbiAgICB0aGlzLnR3aW5JRE1hcFRvRGlzcGxheU5hbWVbREJUd2luW1wiaWRcIl1dPURCVHdpbltcImRpc3BsYXlOYW1lXCJdXHJcbn1cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZURCVHdpbnNBcnI9ZnVuY3Rpb24oREJUd2luc0Fycil7XHJcbiAgICB0aGlzLkRCVHdpbnNBcnIubGVuZ3RoPTBcclxuICAgIHRoaXMuREJUd2luc0Fycj10aGlzLkRCVHdpbnNBcnIuY29uY2F0KERCVHdpbnNBcnIpXHJcbiAgICBmb3IodmFyIGluZCBpbiB0aGlzLnR3aW5JRE1hcFRvRGlzcGxheU5hbWUpIGRlbGV0ZSB0aGlzLnR3aW5JRE1hcFRvRGlzcGxheU5hbWVbaW5kXVxyXG4gICAgdGhpcy5EQlR3aW5zQXJyLmZvckVhY2gob25lREJUd2luPT57XHJcbiAgICAgICAgdGhpcy50d2luSURNYXBUb0Rpc3BsYXlOYW1lW29uZURCVHdpbltcImlkXCJdXT1vbmVEQlR3aW5bXCJkaXNwbGF5TmFtZVwiXVxyXG4gICAgfSlcclxufVxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLnN0b3JlREJNb2RlbHNBcnI9ZnVuY3Rpb24oREJNb2RlbHNBcnIpe1xyXG4gICAgdGhpcy5EQk1vZGVsc0Fyci5sZW5ndGg9MFxyXG4gICAgdGhpcy5EQk1vZGVsc0Fycj10aGlzLkRCTW9kZWxzQXJyLmNvbmNhdChEQk1vZGVsc0FycilcclxuICAgIHRoaXMuREJNb2RlbHNBcnIuc29ydChmdW5jdGlvbiAoYSwgYikgeyBcclxuICAgICAgICB2YXIgYU5hbWU9YS5kaXNwbGF5TmFtZS50b0xvd2VyQ2FzZSgpXHJcbiAgICAgICAgdmFyIGJOYW1lPWIuZGlzcGxheU5hbWUudG9Mb3dlckNhc2UoKVxyXG4gICAgICAgIHJldHVybiBhTmFtZS5sb2NhbGVDb21wYXJlKGJOYW1lKSBcclxuICAgIH0pO1xyXG59XHJcblxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLnN0b3JlVHdpblJlbGF0aW9uc2hpcHM9ZnVuY3Rpb24ocmVsYXRpb25zRGF0YSl7XHJcbiAgICByZWxhdGlvbnNEYXRhLmZvckVhY2goKG9uZVJlbGF0aW9uc2hpcCk9PntcclxuICAgICAgICB2YXIgdHdpbklEPW9uZVJlbGF0aW9uc2hpcFsnJHNvdXJjZUlkJ11cclxuICAgICAgICB0aGlzLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1t0d2luSURdPVtdXHJcbiAgICB9KVxyXG5cclxuICAgIHJlbGF0aW9uc0RhdGEuZm9yRWFjaCgob25lUmVsYXRpb25zaGlwKT0+e1xyXG4gICAgICAgIHRoaXMuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW29uZVJlbGF0aW9uc2hpcFsnJHNvdXJjZUlkJ11dLnB1c2gob25lUmVsYXRpb25zaGlwKVxyXG4gICAgfSlcclxufVxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLnN0b3JlVHdpblJlbGF0aW9uc2hpcHNfYXBwZW5kPWZ1bmN0aW9uKHJlbGF0aW9uc0RhdGEpe1xyXG4gICAgcmVsYXRpb25zRGF0YS5mb3JFYWNoKChvbmVSZWxhdGlvbnNoaXApPT57XHJcbiAgICAgICAgaWYoIXRoaXMuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW29uZVJlbGF0aW9uc2hpcFsnJHNvdXJjZUlkJ11dKVxyXG4gICAgICAgICAgICB0aGlzLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tvbmVSZWxhdGlvbnNoaXBbJyRzb3VyY2VJZCddXT1bXVxyXG4gICAgICAgIHRoaXMuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW29uZVJlbGF0aW9uc2hpcFsnJHNvdXJjZUlkJ11dLnB1c2gob25lUmVsYXRpb25zaGlwKVxyXG4gICAgfSlcclxufVxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLnN0b3JlVHdpblJlbGF0aW9uc2hpcHNfcmVtb3ZlPWZ1bmN0aW9uKHJlbGF0aW9uc0RhdGEpe1xyXG4gICAgcmVsYXRpb25zRGF0YS5mb3JFYWNoKChvbmVSZWxhdGlvbnNoaXApPT57XHJcbiAgICAgICAgdmFyIHNyY0lEPW9uZVJlbGF0aW9uc2hpcFtcInNyY0lEXCJdXHJcbiAgICAgICAgaWYodGhpcy5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbc3JjSURdKXtcclxuICAgICAgICAgICAgdmFyIGFycj10aGlzLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tzcmNJRF1cclxuICAgICAgICAgICAgZm9yKHZhciBpPTA7aTxhcnIubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgICAgICBpZihhcnJbaV1bJyRyZWxhdGlvbnNoaXBJZCddPT1vbmVSZWxhdGlvbnNoaXBbXCJyZWxJRFwiXSl7XHJcbiAgICAgICAgICAgICAgICAgICAgYXJyLnNwbGljZShpLDEpXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBnbG9iYWxDYWNoZSgpOyIsIi8vVGhpcyBpcyBhIHNpbmdsZXRvbiBjbGFzc1xyXG5cclxuZnVuY3Rpb24gbW9kZWxBbmFseXplcigpe1xyXG4gICAgdGhpcy5EVERMTW9kZWxzPXt9XHJcbiAgICB0aGlzLnJlbGF0aW9uc2hpcFR5cGVzPXt9XHJcbn1cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLmNsZWFyQWxsTW9kZWxzPWZ1bmN0aW9uKCl7XHJcbiAgICAvL2NvbnNvbGUubG9nKFwiY2xlYXIgYWxsIG1vZGVsIGluZm9cIilcclxuICAgIGZvcih2YXIgaWQgaW4gdGhpcy5EVERMTW9kZWxzKSBkZWxldGUgdGhpcy5EVERMTW9kZWxzW2lkXVxyXG59XHJcblxyXG5tb2RlbEFuYWx5emVyLnByb3RvdHlwZS5yZXNldEFsbE1vZGVscz1mdW5jdGlvbihhcnIpe1xyXG4gICAgZm9yKHZhciBtb2RlbElEIGluIHRoaXMuRFRETE1vZGVscyl7XHJcbiAgICAgICAgdmFyIGpzb25TdHI9dGhpcy5EVERMTW9kZWxzW21vZGVsSURdW1wib3JpZ2luYWxcIl1cclxuICAgICAgICB0aGlzLkRURExNb2RlbHNbbW9kZWxJRF09SlNPTi5wYXJzZShqc29uU3RyKVxyXG4gICAgICAgIHRoaXMuRFRETE1vZGVsc1ttb2RlbElEXVtcIm9yaWdpbmFsXCJdPWpzb25TdHJcclxuICAgIH1cclxufVxyXG5cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLmFkZE1vZGVscz1mdW5jdGlvbihhcnIpe1xyXG4gICAgYXJyLmZvckVhY2goKGVsZSk9PntcclxuICAgICAgICB2YXIgbW9kZWxJRD0gZWxlW1wiQGlkXCJdXHJcbiAgICAgICAgZWxlW1wib3JpZ2luYWxcIl09SlNPTi5zdHJpbmdpZnkoZWxlKVxyXG4gICAgICAgIHRoaXMuRFRETE1vZGVsc1ttb2RlbElEXT1lbGVcclxuICAgIH0pXHJcbn1cclxuXHJcblxyXG5tb2RlbEFuYWx5emVyLnByb3RvdHlwZS5yZWNvcmRBbGxCYXNlQ2xhc3Nlcz0gZnVuY3Rpb24gKHBhcmVudE9iaiwgYmFzZUNsYXNzSUQpIHtcclxuICAgIHZhciBiYXNlQ2xhc3MgPSB0aGlzLkRURExNb2RlbHNbYmFzZUNsYXNzSURdXHJcbiAgICBpZiAoYmFzZUNsYXNzID09IG51bGwpIHJldHVybjtcclxuXHJcbiAgICBwYXJlbnRPYmpbYmFzZUNsYXNzSURdPTFcclxuXHJcbiAgICB2YXIgZnVydGhlckJhc2VDbGFzc0lEcyA9IGJhc2VDbGFzcy5leHRlbmRzO1xyXG4gICAgaWYgKGZ1cnRoZXJCYXNlQ2xhc3NJRHMgPT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgaWYoQXJyYXkuaXNBcnJheShmdXJ0aGVyQmFzZUNsYXNzSURzKSkgdmFyIHRtcEFycj1mdXJ0aGVyQmFzZUNsYXNzSURzXHJcbiAgICBlbHNlIHRtcEFycj1bZnVydGhlckJhc2VDbGFzc0lEc11cclxuICAgIHRtcEFyci5mb3JFYWNoKChlYWNoQmFzZSkgPT4geyB0aGlzLnJlY29yZEFsbEJhc2VDbGFzc2VzKHBhcmVudE9iaiwgZWFjaEJhc2UpIH0pXHJcbn1cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLmV4cGFuZEVkaXRhYmxlUHJvcGVydGllc0Zyb21CYXNlQ2xhc3MgPSBmdW5jdGlvbiAocGFyZW50T2JqLCBiYXNlQ2xhc3NJRCkge1xyXG4gICAgdmFyIGJhc2VDbGFzcyA9IHRoaXMuRFRETE1vZGVsc1tiYXNlQ2xhc3NJRF1cclxuICAgIGlmIChiYXNlQ2xhc3MgPT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgaWYgKGJhc2VDbGFzcy5lZGl0YWJsZVByb3BlcnRpZXMpIHtcclxuICAgICAgICBmb3IgKHZhciBpbmQgaW4gYmFzZUNsYXNzLmVkaXRhYmxlUHJvcGVydGllcykgcGFyZW50T2JqW2luZF0gPSBiYXNlQ2xhc3MuZWRpdGFibGVQcm9wZXJ0aWVzW2luZF1cclxuICAgIH1cclxuICAgIHZhciBmdXJ0aGVyQmFzZUNsYXNzSURzID0gYmFzZUNsYXNzLmV4dGVuZHM7XHJcbiAgICBpZiAoZnVydGhlckJhc2VDbGFzc0lEcyA9PSBudWxsKSByZXR1cm47XHJcbiAgICBpZihBcnJheS5pc0FycmF5KGZ1cnRoZXJCYXNlQ2xhc3NJRHMpKSB2YXIgdG1wQXJyPWZ1cnRoZXJCYXNlQ2xhc3NJRHNcclxuICAgIGVsc2UgdG1wQXJyPVtmdXJ0aGVyQmFzZUNsYXNzSURzXVxyXG4gICAgdG1wQXJyLmZvckVhY2goKGVhY2hCYXNlKSA9PiB7IHRoaXMuZXhwYW5kRWRpdGFibGVQcm9wZXJ0aWVzRnJvbUJhc2VDbGFzcyhwYXJlbnRPYmosIGVhY2hCYXNlKSB9KVxyXG59XHJcblxyXG5tb2RlbEFuYWx5emVyLnByb3RvdHlwZS5leHBhbmRWYWxpZFJlbGF0aW9uc2hpcFR5cGVzRnJvbUJhc2VDbGFzcyA9IGZ1bmN0aW9uIChwYXJlbnRPYmosIGJhc2VDbGFzc0lEKSB7XHJcbiAgICB2YXIgYmFzZUNsYXNzID0gdGhpcy5EVERMTW9kZWxzW2Jhc2VDbGFzc0lEXVxyXG4gICAgaWYgKGJhc2VDbGFzcyA9PSBudWxsKSByZXR1cm47XHJcbiAgICBpZiAoYmFzZUNsYXNzLnZhbGlkUmVsYXRpb25zaGlwcykge1xyXG4gICAgICAgIGZvciAodmFyIGluZCBpbiBiYXNlQ2xhc3MudmFsaWRSZWxhdGlvbnNoaXBzKSB7XHJcbiAgICAgICAgICAgIGlmKHBhcmVudE9ialtpbmRdPT1udWxsKSBwYXJlbnRPYmpbaW5kXSA9IHRoaXMucmVsYXRpb25zaGlwVHlwZXNbaW5kXVtiYXNlQ2xhc3NJRF1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB2YXIgZnVydGhlckJhc2VDbGFzc0lEcyA9IGJhc2VDbGFzcy5leHRlbmRzO1xyXG4gICAgaWYgKGZ1cnRoZXJCYXNlQ2xhc3NJRHMgPT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgaWYoQXJyYXkuaXNBcnJheShmdXJ0aGVyQmFzZUNsYXNzSURzKSkgdmFyIHRtcEFycj1mdXJ0aGVyQmFzZUNsYXNzSURzXHJcbiAgICBlbHNlIHRtcEFycj1bZnVydGhlckJhc2VDbGFzc0lEc11cclxuICAgIHRtcEFyci5mb3JFYWNoKChlYWNoQmFzZSkgPT4geyB0aGlzLmV4cGFuZFZhbGlkUmVsYXRpb25zaGlwVHlwZXNGcm9tQmFzZUNsYXNzKHBhcmVudE9iaiwgZWFjaEJhc2UpIH0pXHJcbn1cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLmV4cGFuZEVkaXRhYmxlUHJvcGVydGllcz1mdW5jdGlvbihwYXJlbnRPYmosZGF0YUluZm8sZW1iZWRkZWRTY2hlbWEpe1xyXG4gICAgZGF0YUluZm8uZm9yRWFjaCgob25lQ29udGVudCk9PntcclxuICAgICAgICBpZihvbmVDb250ZW50W1wiQHR5cGVcIl09PVwiUmVsYXRpb25zaGlwXCIpIHJldHVybjtcclxuICAgICAgICBpZihvbmVDb250ZW50W1wiQHR5cGVcIl09PVwiUHJvcGVydHlcIlxyXG4gICAgICAgIHx8KEFycmF5LmlzQXJyYXkob25lQ29udGVudFtcIkB0eXBlXCJdKSAmJiBvbmVDb250ZW50W1wiQHR5cGVcIl0uaW5jbHVkZXMoXCJQcm9wZXJ0eVwiKSlcclxuICAgICAgICB8fCBvbmVDb250ZW50W1wiQHR5cGVcIl09PW51bGwpIHtcclxuICAgICAgICAgICAgaWYodHlwZW9mKG9uZUNvbnRlbnRbXCJzY2hlbWFcIl0pICE9ICdvYmplY3QnICYmIGVtYmVkZGVkU2NoZW1hW29uZUNvbnRlbnRbXCJzY2hlbWFcIl1dIT1udWxsKSBvbmVDb250ZW50W1wic2NoZW1hXCJdPWVtYmVkZGVkU2NoZW1hW29uZUNvbnRlbnRbXCJzY2hlbWFcIl1dXHJcblxyXG4gICAgICAgICAgICBpZih0eXBlb2Yob25lQ29udGVudFtcInNjaGVtYVwiXSkgPT09ICdvYmplY3QnICYmIG9uZUNvbnRlbnRbXCJzY2hlbWFcIl1bXCJAdHlwZVwiXT09XCJPYmplY3RcIil7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmV3UGFyZW50PXt9XHJcbiAgICAgICAgICAgICAgICBwYXJlbnRPYmpbb25lQ29udGVudFtcIm5hbWVcIl1dPW5ld1BhcmVudFxyXG4gICAgICAgICAgICAgICAgdGhpcy5leHBhbmRFZGl0YWJsZVByb3BlcnRpZXMobmV3UGFyZW50LG9uZUNvbnRlbnRbXCJzY2hlbWFcIl1bXCJmaWVsZHNcIl0sZW1iZWRkZWRTY2hlbWEpXHJcbiAgICAgICAgICAgIH1lbHNlIGlmKHR5cGVvZihvbmVDb250ZW50W1wic2NoZW1hXCJdKSA9PT0gJ29iamVjdCcgJiYgb25lQ29udGVudFtcInNjaGVtYVwiXVtcIkB0eXBlXCJdPT1cIkVudW1cIil7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnRPYmpbb25lQ29udGVudFtcIm5hbWVcIl1dPW9uZUNvbnRlbnRbXCJzY2hlbWFcIl1bXCJlbnVtVmFsdWVzXCJdXHJcbiAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgcGFyZW50T2JqW29uZUNvbnRlbnRbXCJuYW1lXCJdXT1vbmVDb250ZW50W1wic2NoZW1hXCJdXHJcbiAgICAgICAgICAgIH0gICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1cclxuXHJcblxyXG5tb2RlbEFuYWx5emVyLnByb3RvdHlwZS5hbmFseXplPWZ1bmN0aW9uKCl7XHJcbiAgICAvL2NvbnNvbGUubG9nKFwiYW5hbHl6ZSBtb2RlbCBpbmZvXCIpXHJcbiAgICAvL2FuYWx5emUgYWxsIHJlbGF0aW9uc2hpcCB0eXBlc1xyXG4gICAgZm9yICh2YXIgaWQgaW4gdGhpcy5yZWxhdGlvbnNoaXBUeXBlcykgZGVsZXRlIHRoaXMucmVsYXRpb25zaGlwVHlwZXNbaWRdXHJcbiAgICBmb3IgKHZhciBtb2RlbElEIGluIHRoaXMuRFRETE1vZGVscykge1xyXG4gICAgICAgIHZhciBlbGUgPSB0aGlzLkRURExNb2RlbHNbbW9kZWxJRF1cclxuICAgICAgICB2YXIgZW1iZWRkZWRTY2hlbWEgPSB7fVxyXG4gICAgICAgIGlmIChlbGUuc2NoZW1hcykge1xyXG4gICAgICAgICAgICB2YXIgdGVtcEFycjtcclxuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZWxlLnNjaGVtYXMpKSB0ZW1wQXJyID0gZWxlLnNjaGVtYXNcclxuICAgICAgICAgICAgZWxzZSB0ZW1wQXJyID0gW2VsZS5zY2hlbWFzXVxyXG4gICAgICAgICAgICB0ZW1wQXJyLmZvckVhY2goKGVsZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgZW1iZWRkZWRTY2hlbWFbZWxlW1wiQGlkXCJdXSA9IGVsZVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGNvbnRlbnRBcnIgPSBlbGUuY29udGVudHNcclxuICAgICAgICBpZiAoIWNvbnRlbnRBcnIpIGNvbnRpbnVlO1xyXG4gICAgICAgIGNvbnRlbnRBcnIuZm9yRWFjaCgob25lQ29udGVudCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAob25lQ29udGVudFtcIkB0eXBlXCJdID09IFwiUmVsYXRpb25zaGlwXCIpIHtcclxuICAgICAgICAgICAgICAgIGlmKCF0aGlzLnJlbGF0aW9uc2hpcFR5cGVzW29uZUNvbnRlbnRbXCJuYW1lXCJdXSkgdGhpcy5yZWxhdGlvbnNoaXBUeXBlc1tvbmVDb250ZW50W1wibmFtZVwiXV09IHt9XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlbGF0aW9uc2hpcFR5cGVzW29uZUNvbnRlbnRbXCJuYW1lXCJdXVttb2RlbElEXSA9IG9uZUNvbnRlbnRcclxuICAgICAgICAgICAgICAgIG9uZUNvbnRlbnQuZWRpdGFibGVSZWxhdGlvbnNoaXBQcm9wZXJ0aWVzID0ge31cclxuICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KG9uZUNvbnRlbnQucHJvcGVydGllcykpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmV4cGFuZEVkaXRhYmxlUHJvcGVydGllcyhvbmVDb250ZW50LmVkaXRhYmxlUmVsYXRpb25zaGlwUHJvcGVydGllcywgb25lQ29udGVudC5wcm9wZXJ0aWVzLCBlbWJlZGRlZFNjaGVtYSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcblxyXG4gICAgLy9hbmFseXplIGVhY2ggbW9kZWwncyBwcm9wZXJ0eSB0aGF0IGNhbiBiZSBlZGl0ZWRcclxuICAgIGZvcih2YXIgbW9kZWxJRCBpbiB0aGlzLkRURExNb2RlbHMpeyAvL2V4cGFuZCBwb3NzaWJsZSBlbWJlZGRlZCBzY2hlbWEgdG8gZWRpdGFibGVQcm9wZXJ0aWVzLCBhbHNvIGV4dHJhY3QgcG9zc2libGUgcmVsYXRpb25zaGlwIHR5cGVzIGZvciB0aGlzIG1vZGVsXHJcbiAgICAgICAgdmFyIGVsZT10aGlzLkRURExNb2RlbHNbbW9kZWxJRF1cclxuICAgICAgICB2YXIgZW1iZWRkZWRTY2hlbWE9e31cclxuICAgICAgICBpZihlbGUuc2NoZW1hcyl7XHJcbiAgICAgICAgICAgIHZhciB0ZW1wQXJyO1xyXG4gICAgICAgICAgICBpZihBcnJheS5pc0FycmF5KGVsZS5zY2hlbWFzKSkgdGVtcEFycj1lbGUuc2NoZW1hc1xyXG4gICAgICAgICAgICBlbHNlIHRlbXBBcnI9W2VsZS5zY2hlbWFzXVxyXG4gICAgICAgICAgICB0ZW1wQXJyLmZvckVhY2goKGVsZSk9PntcclxuICAgICAgICAgICAgICAgIGVtYmVkZGVkU2NoZW1hW2VsZVtcIkBpZFwiXV09ZWxlXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsZS5lZGl0YWJsZVByb3BlcnRpZXM9e31cclxuICAgICAgICBlbGUudmFsaWRSZWxhdGlvbnNoaXBzPXt9XHJcbiAgICAgICAgZWxlLmluY2x1ZGVkQ29tcG9uZW50cz1bXVxyXG4gICAgICAgIGVsZS5hbGxCYXNlQ2xhc3Nlcz17fVxyXG4gICAgICAgIGlmKEFycmF5LmlzQXJyYXkoZWxlLmNvbnRlbnRzKSl7XHJcbiAgICAgICAgICAgIHRoaXMuZXhwYW5kRWRpdGFibGVQcm9wZXJ0aWVzKGVsZS5lZGl0YWJsZVByb3BlcnRpZXMsZWxlLmNvbnRlbnRzLGVtYmVkZGVkU2NoZW1hKVxyXG5cclxuICAgICAgICAgICAgZWxlLmNvbnRlbnRzLmZvckVhY2goKG9uZUNvbnRlbnQpPT57XHJcbiAgICAgICAgICAgICAgICBpZihvbmVDb250ZW50W1wiQHR5cGVcIl09PVwiUmVsYXRpb25zaGlwXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBlbGUudmFsaWRSZWxhdGlvbnNoaXBzW29uZUNvbnRlbnRbXCJuYW1lXCJdXT10aGlzLnJlbGF0aW9uc2hpcFR5cGVzW29uZUNvbnRlbnRbXCJuYW1lXCJdXVttb2RlbElEXVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmb3IodmFyIG1vZGVsSUQgaW4gdGhpcy5EVERMTW9kZWxzKXsvL2V4cGFuZCBjb21wb25lbnQgcHJvcGVydGllc1xyXG4gICAgICAgIHZhciBlbGU9dGhpcy5EVERMTW9kZWxzW21vZGVsSURdXHJcbiAgICAgICAgaWYoQXJyYXkuaXNBcnJheShlbGUuY29udGVudHMpKXtcclxuICAgICAgICAgICAgZWxlLmNvbnRlbnRzLmZvckVhY2gob25lQ29udGVudD0+e1xyXG4gICAgICAgICAgICAgICAgaWYob25lQ29udGVudFtcIkB0eXBlXCJdPT1cIkNvbXBvbmVudFwiKXtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgY29tcG9uZW50TmFtZT1vbmVDb250ZW50W1wibmFtZVwiXVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjb21wb25lbnRDbGFzcz1vbmVDb250ZW50W1wic2NoZW1hXCJdXHJcbiAgICAgICAgICAgICAgICAgICAgZWxlLmVkaXRhYmxlUHJvcGVydGllc1tjb21wb25lbnROYW1lXT17fVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXhwYW5kRWRpdGFibGVQcm9wZXJ0aWVzRnJvbUJhc2VDbGFzcyhlbGUuZWRpdGFibGVQcm9wZXJ0aWVzW2NvbXBvbmVudE5hbWVdLGNvbXBvbmVudENsYXNzKVxyXG4gICAgICAgICAgICAgICAgICAgIGVsZS5pbmNsdWRlZENvbXBvbmVudHMucHVzaChjb21wb25lbnROYW1lKVxyXG4gICAgICAgICAgICAgICAgfSBcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZm9yKHZhciBtb2RlbElEIGluIHRoaXMuRFRETE1vZGVscyl7Ly9leHBhbmQgYmFzZSBjbGFzcyBwcm9wZXJ0aWVzIHRvIGVkaXRhYmxlUHJvcGVydGllcyBhbmQgdmFsaWQgcmVsYXRpb25zaGlwIHR5cGVzIHRvIHZhbGlkUmVsYXRpb25zaGlwc1xyXG4gICAgICAgIHZhciBlbGU9dGhpcy5EVERMTW9kZWxzW21vZGVsSURdXHJcbiAgICAgICAgdmFyIGJhc2VDbGFzc0lEcz1lbGUuZXh0ZW5kcztcclxuICAgICAgICBpZihiYXNlQ2xhc3NJRHM9PW51bGwpIGNvbnRpbnVlO1xyXG4gICAgICAgIGlmKEFycmF5LmlzQXJyYXkoYmFzZUNsYXNzSURzKSkgdmFyIHRtcEFycj1iYXNlQ2xhc3NJRHNcclxuICAgICAgICBlbHNlIHRtcEFycj1bYmFzZUNsYXNzSURzXVxyXG4gICAgICAgIHRtcEFyci5mb3JFYWNoKChlYWNoQmFzZSk9PntcclxuICAgICAgICAgICAgdGhpcy5yZWNvcmRBbGxCYXNlQ2xhc3NlcyhlbGUuYWxsQmFzZUNsYXNzZXMsZWFjaEJhc2UpXHJcbiAgICAgICAgICAgIHRoaXMuZXhwYW5kRWRpdGFibGVQcm9wZXJ0aWVzRnJvbUJhc2VDbGFzcyhlbGUuZWRpdGFibGVQcm9wZXJ0aWVzLGVhY2hCYXNlKVxyXG4gICAgICAgICAgICB0aGlzLmV4cGFuZFZhbGlkUmVsYXRpb25zaGlwVHlwZXNGcm9tQmFzZUNsYXNzKGVsZS52YWxpZFJlbGF0aW9uc2hpcHMsZWFjaEJhc2UpXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICAvL2NvbnNvbGUubG9nKHRoaXMuRFRETE1vZGVscylcclxuICAgIC8vY29uc29sZS5sb2codGhpcy5yZWxhdGlvbnNoaXBUeXBlcylcclxufVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IG1vZGVsQW5hbHl6ZXIoKTsiLCJjb25zdCBtb2RlbEFuYWx5emVyPXJlcXVpcmUoXCIuL21vZGVsQW5hbHl6ZXJcIilcclxuY29uc3Qgc2ltcGxlU2VsZWN0TWVudT0gcmVxdWlyZShcIi4vc2ltcGxlU2VsZWN0TWVudVwiKVxyXG5jb25zdCBtc2FsSGVscGVyPXJlcXVpcmUoXCIuLi9tc2FsSGVscGVyXCIpXHJcbmNvbnN0IGdsb2JhbENhY2hlID0gcmVxdWlyZShcIi4vZ2xvYmFsQ2FjaGVcIilcclxuXHJcbmZ1bmN0aW9uIG1vZGVsRWRpdG9yRGlhbG9nKCkge1xyXG4gICAgaWYoIXRoaXMuRE9NKXtcclxuICAgICAgICB0aGlzLkRPTSA9ICQoJzxkaXYgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO2JhY2tncm91bmQtY29sb3I6d2hpdGU7bGVmdDo1MCU7dHJhbnNmb3JtOiB0cmFuc2xhdGVYKC01MCUpIHRyYW5zbGF0ZVkoLTUwJSk7ei1pbmRleDoxMDBcIiBjbGFzcz1cInczLWNhcmQtMlwiPjwvZGl2PicpXHJcbiAgICAgICAgJChcImJvZHlcIikuYXBwZW5kKHRoaXMuRE9NKVxyXG4gICAgICAgIHRoaXMuRE9NLmhpZGUoKVxyXG4gICAgfVxyXG59XHJcblxyXG5tb2RlbEVkaXRvckRpYWxvZy5wcm90b3R5cGUucG9wdXAgPSBhc3luYyBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMuRE9NLnNob3coKVxyXG4gICAgdGhpcy5ET00uZW1wdHkoKVxyXG4gICAgdGhpcy5jb250ZW50RE9NID0gJCgnPGRpdiBzdHlsZT1cIndpZHRoOjY2NXB4XCI+PC9kaXY+JylcclxuICAgIHRoaXMuRE9NLmFwcGVuZCh0aGlzLmNvbnRlbnRET00pXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6NDBweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiZm9udC1zaXplOjEuNWVtXCI+RGlnaXRhbCBUd2luIE1vZGVsIEVkaXRvcjwvZGl2PjwvZGl2PicpKVxyXG4gICAgdmFyIGNsb3NlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yaWdodFwiIHN0eWxlPVwiZm9udC1zaXplOjJlbTtwYWRkaW5nLXRvcDo0cHhcIj7DlzwvYnV0dG9uPicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZChjbG9zZUJ1dHRvbilcclxuICAgIGNsb3NlQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLkRPTS5oaWRlKCkgfSlcclxuXHJcbiAgICB2YXIgYnV0dG9uUm93PSQoJzxkaXYgIHN0eWxlPVwiaGVpZ2h0OjQwcHhcIiBjbGFzcz1cInczLWJhclwiPjwvZGl2PicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKGJ1dHRvblJvdylcclxuICAgIHZhciBpbXBvcnRCdXR0b24gPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtY2FyZCB3My1kZWVwLW9yYW5nZSB3My1ob3Zlci1saWdodC1ncmVlbiB3My1yaWdodFwiIHN0eWxlPVwiaGVpZ2h0OjEwMCVcIj5JbXBvcnQ8L2J1dHRvbj4nKVxyXG4gICAgYnV0dG9uUm93LmFwcGVuZChpbXBvcnRCdXR0b24pXHJcblxyXG4gICAgaW1wb3J0QnV0dG9uLm9uKFwiY2xpY2tcIiwgYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgIHZhciBtb2RlbFRvQmVJbXBvcnRlZCA9IFt0aGlzLmR0ZGxvYmpdXHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgdmFyIHJlc3BvbnNlID0gYXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwiZGlnaXRhbHR3aW4vaW1wb3J0TW9kZWxzXCIsIFwiUE9TVFwiLCB7IFwibW9kZWxzXCI6IEpTT04uc3RyaW5naWZ5KG1vZGVsVG9CZUltcG9ydGVkKSB9KVxyXG5cclxuICAgICAgICAgICAgYWxlcnQoXCJNb2RlbCBcXFwiXCIgKyB0aGlzLmR0ZGxvYmpbXCJkaXNwbGF5TmFtZVwiXSArIFwiXFxcIiBpcyBjcmVhdGVkIVwiKVxyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJBRFRNb2RlbEVkaXRlZFwiIH0pXHJcbiAgICAgICAgICAgIG1vZGVsQW5hbHl6ZXIuYWRkTW9kZWxzKG1vZGVsVG9CZUltcG9ydGVkKSAvL2FkZCBzbyBpbW1lZGlhdGxleSB0aGUgbGlzdCBjYW4gc2hvdyB0aGUgbmV3IG1vZGVsc1xyXG4gICAgICAgICAgICB0aGlzLnBvcHVwKCkgLy9yZWZyZXNoIGNvbnRlbnRcclxuICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgICAgICB9ICAgICAgICBcclxuICAgIH0pXHJcblxyXG4gICAgdmFyIGxhYmxlPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1vcGFjaXR5XCIgc3R5bGU9XCJwYWRkaW5nLXJpZ2h0OjVweDtmb250LXNpemU6MS4yZW07XCI+TW9kZWwgVGVtcGxhdGU8L2Rpdj4nKVxyXG4gICAgYnV0dG9uUm93LmFwcGVuZChsYWJsZSlcclxuICAgIHZhciBtb2RlbFRlbXBsYXRlU2VsZWN0b3I9bmV3IHNpbXBsZVNlbGVjdE1lbnUoXCIgXCIse3dpdGhCb3JkZXI6MSxmb250U2l6ZTpcIjEuMmVtXCIsY29sb3JDbGFzczpcInczLWxpZ2h0LWdyYXlcIixidXR0b25DU1M6e1wicGFkZGluZ1wiOlwiNXB4IDEwcHhcIn0sXCJvcHRpb25MaXN0SGVpZ2h0XCI6MzAwfSlcclxuICAgIGJ1dHRvblJvdy5hcHBlbmQobW9kZWxUZW1wbGF0ZVNlbGVjdG9yLkRPTSlcclxuICAgIG1vZGVsVGVtcGxhdGVTZWxlY3Rvci5jYWxsQmFja19jbGlja09wdGlvbj0ob3B0aW9uVGV4dCxvcHRpb25WYWx1ZSk9PntcclxuICAgICAgICBtb2RlbFRlbXBsYXRlU2VsZWN0b3IuY2hhbmdlTmFtZShvcHRpb25UZXh0KVxyXG4gICAgICAgIHRoaXMuY2hvb3NlVGVtcGxhdGUob3B0aW9uVmFsdWUpXHJcbiAgICB9XHJcbiAgICBtb2RlbFRlbXBsYXRlU2VsZWN0b3IuYWRkT3B0aW9uKFwiTmV3IE1vZGVsLi4uXCIsXCJOZXdcIilcclxuICAgIGZvcih2YXIgbW9kZWxOYW1lIGluIG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVscyl7XHJcbiAgICAgICAgbW9kZWxUZW1wbGF0ZVNlbGVjdG9yLmFkZE9wdGlvbihtb2RlbE5hbWUpXHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHBhbmVsSGVpZ2h0PVwiNDUwcHhcIlxyXG4gICAgdmFyIHJvdzI9JCgnPGRpdiBjbGFzcz1cInczLWNlbGwtcm93XCIgc3R5bGU9XCJtYXJnaW46MnB4XCI+PC9kaXY+JylcclxuICAgIHRoaXMuY29udGVudERPTS5hcHBlbmQocm93MilcclxuICAgIHZhciBsZWZ0U3Bhbj0kKCc8ZGl2IGNsYXNzPVwidzMtY2FyZFwiIHN0eWxlPVwicGFkZGluZzo1cHg7d2lkdGg6MzMwcHg7cGFkZGluZy1yaWdodDo1cHg7aGVpZ2h0OicrcGFuZWxIZWlnaHQrJztvdmVyZmxvdzphdXRvXCI+PC9kaXY+JylcclxuICAgIHJvdzIuYXBwZW5kKGxlZnRTcGFuKVxyXG4gICAgdGhpcy5sZWZ0U3Bhbj1sZWZ0U3BhblxyXG5cclxuICAgIHZhciByaWdodFNwYW49JCgnPGRpdiBjbGFzcz1cInczLWNvbnRhaW5lciB3My1jZWxsXCI+PC9kaXY+JylcclxuICAgIHJvdzIuYXBwZW5kKHJpZ2h0U3BhbikgXHJcbiAgICB2YXIgZHRkbFNjcmlwdFBhbmVsPSQoJzxkaXYgY2xhc3M9XCJ3My1jYXJkLTIgdzMtd2hpdGVcIiBzdHlsZT1cIm92ZXJmbG93OmF1dG87bWFyZ2luLXRvcDoycHg7d2lkdGg6MzEwcHg7aGVpZ2h0OicrcGFuZWxIZWlnaHQrJ1wiPjwvZGl2PicpXHJcbiAgICByaWdodFNwYW4uYXBwZW5kKGR0ZGxTY3JpcHRQYW5lbClcclxuICAgIHRoaXMuZHRkbFNjcmlwdFBhbmVsPWR0ZGxTY3JpcHRQYW5lbFxyXG5cclxuICAgIG1vZGVsVGVtcGxhdGVTZWxlY3Rvci50cmlnZ2VyT3B0aW9uSW5kZXgoMClcclxufVxyXG5cclxubW9kZWxFZGl0b3JEaWFsb2cucHJvdG90eXBlLmNob29zZVRlbXBsYXRlPWZ1bmN0aW9uKHRlbXBhbHRlTmFtZSl7XHJcbiAgICBpZih0ZW1wYWx0ZU5hbWUhPVwiTmV3XCIpe1xyXG4gICAgICAgIHRoaXMuZHRkbG9iaj1KU09OLnBhcnNlKG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1t0ZW1wYWx0ZU5hbWVdW1wib3JpZ2luYWxcIl0pXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB0aGlzLmR0ZGxvYmogPSB7XHJcbiAgICAgICAgICAgIFwiQGlkXCI6IFwiZHRtaTphTmFtZVNwYWNlOmFNb2RlbElEOzFcIixcclxuICAgICAgICAgICAgXCJAY29udGV4dFwiOiBbXCJkdG1pOmR0ZGw6Y29udGV4dDsyXCJdLFxyXG4gICAgICAgICAgICBcIkB0eXBlXCI6IFwiSW50ZXJmYWNlXCIsXHJcbiAgICAgICAgICAgIFwiZGlzcGxheU5hbWVcIjogXCJOZXcgTW9kZWxcIixcclxuICAgICAgICAgICAgXCJjb250ZW50c1wiOiBbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJAdHlwZVwiOiBcIlByb3BlcnR5XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJuYW1lXCI6IFwiYXR0cmlidXRlMVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwic2NoZW1hXCI6IFwiZG91YmxlXCJcclxuICAgICAgICAgICAgICAgIH0se1xyXG4gICAgICAgICAgICAgICAgICAgIFwiQHR5cGVcIjogXCJSZWxhdGlvbnNoaXBcIixcclxuICAgICAgICAgICAgICAgICAgICBcIm5hbWVcIjogXCJsaW5rXCJcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMubGVmdFNwYW4uZW1wdHkoKVxyXG5cclxuICAgIHRoaXMucmVmcmVzaERUREwoKVxyXG4gICAgdGhpcy5sZWZ0U3Bhbi5hcHBlbmQoJCgnPGRpdiBjbGFzcz1cInczLWJhclwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbSB3My10b29sdGlwXCIgc3R5bGU9XCJmb250LXNpemU6MS4yZW07cGFkZGluZy1sZWZ0OjJweDtmb250LXdlaWdodDpib2xkO2NvbG9yOmdyYXlcIj5Nb2RlbCBJRCAmIE5hbWU8cCBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RleHQtYWxpZ246bGVmdDtmb250LXdlaWdodDpub3JtYWw7dG9wOi0xMHB4O3dpZHRoOjIwMHB4XCIgY2xhc3M9XCJ3My10ZXh0IHczLXRhZyB3My10aW55XCI+bW9kZWwgSUQgY29udGFpbnMgbmFtZXNwYWNlLCBhIG1vZGVsIHN0cmluZyBhbmQgYSB2ZXJzaW9uIG51bWJlcjwvcD48L2Rpdj48L2Rpdj4nKSlcclxuICAgIG5ldyBpZFJvdyh0aGlzLmR0ZGxvYmosdGhpcy5sZWZ0U3BhbiwoKT0+e3RoaXMucmVmcmVzaERUREwoKX0pXHJcbiAgICBuZXcgZGlzcGxheU5hbWVSb3codGhpcy5kdGRsb2JqLHRoaXMubGVmdFNwYW4sKCk9Pnt0aGlzLnJlZnJlc2hEVERMKCl9KVxyXG5cclxuICAgIGlmKCF0aGlzLmR0ZGxvYmpbXCJjb250ZW50c1wiXSl0aGlzLmR0ZGxvYmpbXCJjb250ZW50c1wiXT1bXVxyXG4gICAgbmV3IHBhcmFtZXRlcnNSb3codGhpcy5kdGRsb2JqW1wiY29udGVudHNcIl0sdGhpcy5sZWZ0U3BhbiwoKT0+e3RoaXMucmVmcmVzaERUREwoKX0sdGhpcy5ET00ub2Zmc2V0KCkpXHJcbiAgICBuZXcgcmVsYXRpb25zUm93KHRoaXMuZHRkbG9ialtcImNvbnRlbnRzXCJdLHRoaXMubGVmdFNwYW4sKCk9Pnt0aGlzLnJlZnJlc2hEVERMKCl9LHRoaXMuRE9NLm9mZnNldCgpKVxyXG4gICAgbmV3IGNvbXBvbmVudHNSb3codGhpcy5kdGRsb2JqW1wiY29udGVudHNcIl0sdGhpcy5sZWZ0U3BhbiwoKT0+e3RoaXMucmVmcmVzaERUREwoKX0pXHJcblxyXG4gICAgaWYoIXRoaXMuZHRkbG9ialtcImV4dGVuZHNcIl0pdGhpcy5kdGRsb2JqW1wiZXh0ZW5kc1wiXT1bXVxyXG4gICAgbmV3IGJhc2VDbGFzc2VzUm93KHRoaXMuZHRkbG9ialtcImV4dGVuZHNcIl0sdGhpcy5sZWZ0U3BhbiwoKT0+e3RoaXMucmVmcmVzaERUREwoKX0pXHJcbn1cclxuXHJcbm1vZGVsRWRpdG9yRGlhbG9nLnByb3RvdHlwZS5yZWZyZXNoRFRETD1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5kdGRsU2NyaXB0UGFuZWwuZW1wdHkoKVxyXG4gICAgdGhpcy5kdGRsU2NyaXB0UGFuZWwuYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6MjBweDt3aWR0aDoxMDBweFwiIGNsYXNzPVwidzMtYmFyIHczLWdyYXlcIj5HZW5lcmF0ZWQgRFRETDwvZGl2PicpKVxyXG4gICAgdGhpcy5kdGRsU2NyaXB0UGFuZWwuYXBwZW5kKCQoJzxwcmUgc3R5bGU9XCJjb2xvcjpncmF5XCI+JytKU09OLnN0cmluZ2lmeSh0aGlzLmR0ZGxvYmosbnVsbCwyKSsnPC9wcmU+JykpXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IG1vZGVsRWRpdG9yRGlhbG9nKCk7XHJcblxyXG5cclxuZnVuY3Rpb24gYmFzZUNsYXNzZXNSb3coZHRkbE9iaixwYXJlbnRET00scmVmcmVzaERURExGKXtcclxuICAgIHZhciByb3dET009JCgnPGRpdiBjbGFzcz1cInczLWJhclwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbSAgdzMtdG9vbHRpcFwiIHN0eWxlPVwiZm9udC1zaXplOjEuMmVtO3BhZGRpbmctbGVmdDoycHg7Zm9udC13ZWlnaHQ6Ym9sZDtjb2xvcjpncmF5XCI+QmFzZSBDbGFzc2VzPHAgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0ZXh0LWFsaWduOmxlZnQ7dG9wOi0xMHB4O2ZvbnQtd2VpZ2h0Om5vcm1hbDt3aWR0aDoyMDBweFwiIGNsYXNzPVwidzMtdGV4dCB3My10YWcgdzMtdGlueVwiPkJhc2UgY2xhc3MgbW9kZWxcXCdzIHBhcmFtZXRlcnMgYW5kIHJlbGF0aW9uc2hpcCB0eXBlIGFyZSBpbmhlcml0ZWQ8L3A+PC9kaXY+PC9kaXY+JylcclxuXHJcbiAgICB2YXIgYWRkQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yZWQgdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cIm1hcmdpbi10b3A6MnB4O2ZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjRweFwiPis8L2J1dHRvbj4nKVxyXG4gICAgcm93RE9NLmFwcGVuZChhZGRCdXR0b24pXHJcbiAgICBwYXJlbnRET00uYXBwZW5kKHJvd0RPTSlcclxuICAgIHZhciBjb250ZW50RE9NPSQoJzxkaXYgc3R5bGU9XCJwYWRkaW5nLWxlZnQ6MTBweFwiPjwvZGl2PicpXHJcbiAgICByb3dET00uYXBwZW5kKGNvbnRlbnRET00pXHJcbiAgICBhZGRCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgdmFyIG5ld09iaiA9IFwidW5rbm93blwiXHJcbiAgICAgICAgZHRkbE9iai5wdXNoKG5ld09iailcclxuICAgICAgICBuZXcgc2luZ2xlQmFzZWNsYXNzUm93KG5ld09iaixjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgLy9jaGVjayBleGlzdGVkIGNvbnRlbnQgaW5pdGlhbGx5IGZyb20gdGVtcGxhdGUgYW5kIHRyaWdnZXIgdGhlaXIgZHJhd2luZ1xyXG4gICAgZHRkbE9iai5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIG5ldyBzaW5nbGVCYXNlY2xhc3NSb3coZWxlbWVudCxjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqKVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNpbmdsZUJhc2VjbGFzc1JvdyhkdGRsT2JqLHBhcmVudERPTSxyZWZyZXNoRFRETEYscGFyZW50RHRkbE9iail7XHJcbiAgICB2YXIgRE9NID0gJCgnPGRpdiBjbGFzcz1cInczLWNlbGwtcm93XCI+PC9kaXY+JylcclxuICAgIHZhciBiYXNlQ2xhc3NOYW1lSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmU7d2lkdGg6MjIwcHg7cGFkZGluZzo0cHhcIiAgcGxhY2Vob2xkZXI9XCJiYXNlIG1vZGVsIGlkXCIvPicpLmFkZENsYXNzKFwidzMtYmFyLWl0ZW0gdzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgdmFyIHJlbW92ZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cImNvbG9yOmdyYXk7bWFyZ2luLWxlZnQ6M3B4O21hcmdpbi10b3A6MnB4O2ZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjJweFwiPjxpIGNsYXNzPVwiZmEgZmEtdHJhc2ggZmEtbGdcIj48L2k+PC9idXR0b24+JylcclxuICAgIERPTS5hcHBlbmQoYmFzZUNsYXNzTmFtZUlucHV0LHJlbW92ZUJ1dHRvbilcclxuXHJcbiAgICByZW1vdmVCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgZm9yICh2YXIgaSA9MDtpPCBwYXJlbnREdGRsT2JqLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChwYXJlbnREdGRsT2JqW2ldID09IGR0ZGxPYmopIHtcclxuICAgICAgICAgICAgICAgIHBhcmVudER0ZGxPYmouc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgRE9NLnJlbW92ZSgpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcblxyXG4gICAgcGFyZW50RE9NLmFwcGVuZChET00pXHJcblxyXG4gICAgYmFzZUNsYXNzTmFtZUlucHV0LnZhbChkdGRsT2JqKVxyXG4gICAgYmFzZUNsYXNzTmFtZUlucHV0Lm9uKFwiY2hhbmdlXCIsKCk9PntcclxuICAgICAgICBmb3IgKHZhciBpID0wO2k8IHBhcmVudER0ZGxPYmoubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHBhcmVudER0ZGxPYmpbaV0gPT0gZHRkbE9iaikge1xyXG4gICAgICAgICAgICAgICAgcGFyZW50RHRkbE9ialtpXT1iYXNlQ2xhc3NOYW1lSW5wdXQudmFsKClcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG59XHJcblxyXG5mdW5jdGlvbiBjb21wb25lbnRzUm93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRil7XHJcbiAgICB2YXIgcm93RE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXJcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW0gIHczLXRvb2x0aXBcIiBzdHlsZT1cImZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nLWxlZnQ6MnB4O2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6Z3JheVwiPkNvbXBvbmVudHM8cCBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RleHQtYWxpZ246bGVmdDt0b3A6LTEwcHg7Zm9udC13ZWlnaHQ6bm9ybWFsO3dpZHRoOjIwMHB4XCIgY2xhc3M9XCJ3My10ZXh0IHczLXRhZyB3My10aW55XCI+Q29tcG9uZW50IG1vZGVsXFwncyBwYXJhbWV0ZXJzIGFyZSBlbWJlZGRlZCB1bmRlciBhIG5hbWU8L3A+PC9kaXY+PC9kaXY+JylcclxuXHJcbiAgICB2YXIgYWRkQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yZWQgdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cIm1hcmdpbi10b3A6MnB4O2ZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjRweFwiPis8L2J1dHRvbj4nKVxyXG4gICAgcm93RE9NLmFwcGVuZChhZGRCdXR0b24pXHJcbiAgICBwYXJlbnRET00uYXBwZW5kKHJvd0RPTSlcclxuICAgIHZhciBjb250ZW50RE9NPSQoJzxkaXYgc3R5bGU9XCJwYWRkaW5nLWxlZnQ6MTBweFwiPjwvZGl2PicpXHJcbiAgICByb3dET00uYXBwZW5kKGNvbnRlbnRET00pXHJcblxyXG4gICAgYWRkQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIHZhciBuZXdPYmogPSB7XHJcbiAgICAgICAgICAgIFwiQHR5cGVcIjogXCJDb21wb25lbnRcIixcclxuICAgICAgICAgICAgXCJuYW1lXCI6IFwiU29tZUNvbXBvbmVudFwiLFxyXG4gICAgICAgICAgICBcInNjaGVtYVwiOlwiZHRtaTpzb21lQ29tcG9uZW50TW9kZWw7MVwiXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGR0ZGxPYmoucHVzaChuZXdPYmopXHJcbiAgICAgICAgbmV3IHNpbmdsZUNvbXBvbmVudFJvdyhuZXdPYmosY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9iailcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuICAgIC8vY2hlY2sgZXhpc3RlZCBjb250ZW50IGluaXRpYWxseSBmcm9tIHRlbXBsYXRlIGFuZCB0cmlnZ2VyIHRoZWlyIGRyYXdpbmdcclxuICAgIGR0ZGxPYmouZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICBpZihlbGVtZW50W1wiQHR5cGVcIl0hPVwiQ29tcG9uZW50XCIpIHJldHVyblxyXG4gICAgICAgIG5ldyBzaW5nbGVDb21wb25lbnRSb3coZWxlbWVudCxjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqKVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNpbmdsZUNvbXBvbmVudFJvdyhkdGRsT2JqLHBhcmVudERPTSxyZWZyZXNoRFRETEYscGFyZW50RHRkbE9iail7XHJcbiAgICB2YXIgRE9NID0gJCgnPGRpdiBjbGFzcz1cInczLWNlbGwtcm93XCI+PC9kaXY+JylcclxuICAgIHZhciBjb21wb25lbnROYW1lSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmU7d2lkdGg6MTAwcHg7cGFkZGluZzo0cHhcIiAgcGxhY2Vob2xkZXI9XCJjb21wb25lbnQgbmFtZVwiLz4nKS5hZGRDbGFzcyhcInczLWJhci1pdGVtIHczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIHZhciBzY2hlbWFJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDoxNjBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cImNvbXBvbmVudCBtb2RlbCBpZC4uLlwiLz4nKS5hZGRDbGFzcyhcInczLWJhci1pdGVtIHczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIHZhciByZW1vdmVCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWhvdmVyLWFtYmVyXCIgc3R5bGU9XCJjb2xvcjpncmF5O21hcmdpbi1sZWZ0OjNweDttYXJnaW4tdG9wOjJweDtmb250LXNpemU6MS4yZW07cGFkZGluZzoycHhcIj48aSBjbGFzcz1cImZhIGZhLXRyYXNoIGZhLWxnXCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICBET00uYXBwZW5kKGNvbXBvbmVudE5hbWVJbnB1dCxzY2hlbWFJbnB1dCxyZW1vdmVCdXR0b24pXHJcblxyXG4gICAgcmVtb3ZlQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIGZvciAodmFyIGkgPTA7aTwgcGFyZW50RHRkbE9iai5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAocGFyZW50RHRkbE9ialtpXSA9PT0gZHRkbE9iaikge1xyXG4gICAgICAgICAgICAgICAgcGFyZW50RHRkbE9iai5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBET00ucmVtb3ZlKClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuXHJcbiAgICBwYXJlbnRET00uYXBwZW5kKERPTSlcclxuXHJcbiAgICBjb21wb25lbnROYW1lSW5wdXQudmFsKGR0ZGxPYmpbXCJuYW1lXCJdKVxyXG4gICAgc2NoZW1hSW5wdXQudmFsKGR0ZGxPYmpbXCJzY2hlbWFcIl18fFwiXCIpXHJcblxyXG4gICAgY29tcG9uZW50TmFtZUlucHV0Lm9uKFwiY2hhbmdlXCIsKCk9PntcclxuICAgICAgICBkdGRsT2JqW1wibmFtZVwiXT1jb21wb25lbnROYW1lSW5wdXQudmFsKClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuICAgIHNjaGVtYUlucHV0Lm9uKFwiY2hhbmdlXCIsKCk9PntcclxuICAgICAgICBkdGRsT2JqW1wic2NoZW1hXCJdPXNjaGVtYUlucHV0LnZhbCgpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHJlbGF0aW9uc1JvdyhkdGRsT2JqLHBhcmVudERPTSxyZWZyZXNoRFRETEYsZGlhbG9nT2Zmc2V0KXtcclxuICAgIHZhciByb3dET009JCgnPGRpdiBjbGFzcz1cInczLWJhclwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbSB3My10b29sdGlwXCIgc3R5bGU9XCJmb250LXNpemU6MS4yZW07cGFkZGluZy1sZWZ0OjJweDtmb250LXdlaWdodDpib2xkO2NvbG9yOmdyYXlcIj5SZWxhdGlvbnNoaXAgVHlwZXM8cCBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RleHQtYWxpZ246bGVmdDt0b3A6LTEwcHg7Zm9udC13ZWlnaHQ6bm9ybWFsO3dpZHRoOjIwMHB4XCIgY2xhc3M9XCJ3My10ZXh0IHczLXRhZyB3My10aW55XCI+UmVsYXRpb25zaGlwIGNhbiBoYXZlIGl0cyBvd24gcGFyYW1ldGVyczwvcD48L2Rpdj48L2Rpdj4nKVxyXG5cclxuXHJcbiAgICB2YXIgYWRkQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yZWQgdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cIm1hcmdpbi10b3A6MnB4O2ZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjRweFwiPis8L2J1dHRvbj4nKVxyXG4gICAgcm93RE9NLmFwcGVuZChhZGRCdXR0b24pXHJcbiAgICBwYXJlbnRET00uYXBwZW5kKHJvd0RPTSlcclxuICAgIHZhciBjb250ZW50RE9NPSQoJzxkaXYgc3R5bGU9XCJwYWRkaW5nLWxlZnQ6MTBweFwiPjwvZGl2PicpXHJcbiAgICByb3dET00uYXBwZW5kKGNvbnRlbnRET00pXHJcblxyXG4gICAgYWRkQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIHZhciBuZXdPYmogPSB7XHJcbiAgICAgICAgICAgIFwiQHR5cGVcIjogXCJSZWxhdGlvbnNoaXBcIixcclxuICAgICAgICAgICAgXCJuYW1lXCI6IFwicmVsYXRpb24xXCIsXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGR0ZGxPYmoucHVzaChuZXdPYmopXHJcbiAgICAgICAgbmV3IHNpbmdsZVJlbGF0aW9uVHlwZVJvdyhuZXdPYmosY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9iaixkaWFsb2dPZmZzZXQpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcblxyXG4gICAgLy9jaGVjayBleGlzdGVkIGNvbnRlbnQgaW5pdGlhbGx5IGZyb20gdGVtcGxhdGUgYW5kIHRyaWdnZXIgdGhlaXIgZHJhd2luZ1xyXG4gICAgZHRkbE9iai5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIGlmKGVsZW1lbnRbXCJAdHlwZVwiXSE9XCJSZWxhdGlvbnNoaXBcIikgcmV0dXJuXHJcbiAgICAgICAgbmV3IHNpbmdsZVJlbGF0aW9uVHlwZVJvdyhlbGVtZW50LGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmosZGlhbG9nT2Zmc2V0KVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNpbmdsZVJlbGF0aW9uVHlwZVJvdyhkdGRsT2JqLHBhcmVudERPTSxyZWZyZXNoRFRETEYscGFyZW50RHRkbE9iaixkaWFsb2dPZmZzZXQpe1xyXG4gICAgdmFyIERPTSA9ICQoJzxkaXYgY2xhc3M9XCJ3My1jZWxsLXJvd1wiPjwvZGl2PicpXHJcbiAgICB2YXIgcmVsYXRpb25OYW1lSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmU7d2lkdGg6OTBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cInJlbGF0aW9uIG5hbWVcIi8+JykuYWRkQ2xhc3MoXCJ3My1iYXItaXRlbSB3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICB2YXIgdGFyZ2V0TW9kZWxJRD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDoxNDBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cIihvcHRpb25hbCl0YXJnZXQgbW9kZWxcIi8+JykuYWRkQ2xhc3MoXCJ3My1iYXItaXRlbSB3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICB2YXIgYWRkQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwiY29sb3I6Z3JheTttYXJnaW4tbGVmdDozcHg7bWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6MnB4XCI+PGkgY2xhc3M9XCJmYSBmYS1jb2cgZmEtbGdcIj48L2k+PC9idXR0b24+JylcclxuICAgIHZhciByZW1vdmVCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWhvdmVyLWFtYmVyXCIgc3R5bGU9XCJjb2xvcjpncmF5O21hcmdpbi1sZWZ0OjNweDttYXJnaW4tdG9wOjJweDtmb250LXNpemU6MS4yZW07cGFkZGluZzoycHhcIj48aSBjbGFzcz1cImZhIGZhLXRyYXNoIGZhLWxnXCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICBET00uYXBwZW5kKHJlbGF0aW9uTmFtZUlucHV0LHRhcmdldE1vZGVsSUQsYWRkQnV0dG9uLHJlbW92ZUJ1dHRvbilcclxuXHJcbiAgICByZW1vdmVCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgZm9yICh2YXIgaSA9MDtpPCBwYXJlbnREdGRsT2JqLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChwYXJlbnREdGRsT2JqW2ldID09PSBkdGRsT2JqKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnREdGRsT2JqLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIERPTS5yZW1vdmUoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG5cclxuICAgIHZhciBjb250ZW50RE9NPSQoJzxkaXYgc3R5bGU9XCJwYWRkaW5nLWxlZnQ6MTBweFwiPjwvZGl2PicpXHJcbiAgICBET00uYXBwZW5kKGNvbnRlbnRET00pXHJcbiAgICBwYXJlbnRET00uYXBwZW5kKERPTSlcclxuXHJcbiAgICByZWxhdGlvbk5hbWVJbnB1dC52YWwoZHRkbE9ialtcIm5hbWVcIl0pXHJcbiAgICB0YXJnZXRNb2RlbElELnZhbChkdGRsT2JqW1widGFyZ2V0XCJdfHxcIlwiKVxyXG5cclxuICAgIGFkZEJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICBpZighIGR0ZGxPYmpbXCJwcm9wZXJ0aWVzXCJdKSBkdGRsT2JqW1wicHJvcGVydGllc1wiXT1bXVxyXG4gICAgICAgIHZhciBuZXdPYmogPSB7XHJcbiAgICAgICAgICAgIFwibmFtZVwiOiBcIm5ld1BcIixcclxuICAgICAgICAgICAgXCJzY2hlbWFcIjogXCJkb3VibGVcIlxyXG4gICAgICAgIH1cclxuICAgICAgICBkdGRsT2JqW1wicHJvcGVydGllc1wiXS5wdXNoKG5ld09iailcclxuICAgICAgICBuZXcgc2luZ2xlUGFyYW1ldGVyUm93KG5ld09iaixjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqW1wicHJvcGVydGllc1wiXSxudWxsLGRpYWxvZ09mZnNldClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuXHJcbiAgICByZWxhdGlvbk5hbWVJbnB1dC5vbihcImNoYW5nZVwiLCgpPT57XHJcbiAgICAgICAgZHRkbE9ialtcIm5hbWVcIl09cmVsYXRpb25OYW1lSW5wdXQudmFsKClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuICAgIHRhcmdldE1vZGVsSUQub24oXCJjaGFuZ2VcIiwoKT0+e1xyXG4gICAgICAgIGlmKHRhcmdldE1vZGVsSUQudmFsKCk9PVwiXCIpIGRlbGV0ZSBkdGRsT2JqW1widGFyZ2V0XCJdXHJcbiAgICAgICAgZWxzZSBkdGRsT2JqW1widGFyZ2V0XCJdPXRhcmdldE1vZGVsSUQudmFsKClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuICAgIGlmKGR0ZGxPYmpbXCJwcm9wZXJ0aWVzXCJdICYmIGR0ZGxPYmpbXCJwcm9wZXJ0aWVzXCJdLmxlbmd0aD4wKXtcclxuICAgICAgICB2YXIgcHJvcGVydGllcz1kdGRsT2JqW1wicHJvcGVydGllc1wiXVxyXG4gICAgICAgIHByb3BlcnRpZXMuZm9yRWFjaChvbmVQcm9wZXJ0eT0+e1xyXG4gICAgICAgICAgICBuZXcgc2luZ2xlUGFyYW1ldGVyUm93KG9uZVByb3BlcnR5LGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmpbXCJwcm9wZXJ0aWVzXCJdLG51bGwsZGlhbG9nT2Zmc2V0KVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHBhcmFtZXRlcnNSb3coZHRkbE9iaixwYXJlbnRET00scmVmcmVzaERURExGLGRpYWxvZ09mZnNldCl7XHJcbiAgICB2YXIgcm93RE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXJcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cImZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nLWxlZnQ6MnB4O2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6Z3JheVwiPlBhcmFtZXRlcnM8L2Rpdj48L2Rpdj4nKVxyXG4gICAgdmFyIGFkZEJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmVkIHczLWhvdmVyLWFtYmVyXCIgc3R5bGU9XCJtYXJnaW4tdG9wOjJweDtmb250LXNpemU6MS4yZW07cGFkZGluZzo0cHhcIj4rPC9idXR0b24+JylcclxuICAgIHJvd0RPTS5hcHBlbmQoYWRkQnV0dG9uKVxyXG4gICAgcGFyZW50RE9NLmFwcGVuZChyb3dET00pXHJcbiAgICB2YXIgY29udGVudERPTT0kKCc8ZGl2IHN0eWxlPVwicGFkZGluZy1sZWZ0OjEwcHhcIj48L2Rpdj4nKVxyXG4gICAgcm93RE9NLmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgYWRkQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIHZhciBuZXdPYmogPSB7XHJcbiAgICAgICAgICAgIFwiQHR5cGVcIjogXCJQcm9wZXJ0eVwiLFxyXG4gICAgICAgICAgICBcIm5hbWVcIjogXCJuZXdQXCIsXHJcbiAgICAgICAgICAgIFwic2NoZW1hXCI6IFwiZG91YmxlXCJcclxuICAgICAgICB9XHJcbiAgICAgICAgZHRkbE9iai5wdXNoKG5ld09iailcclxuICAgICAgICBuZXcgc2luZ2xlUGFyYW1ldGVyUm93KG5ld09iaixjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqLFwidG9wTGV2ZWxcIixkaWFsb2dPZmZzZXQpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcblxyXG4gICAgLy9jaGVjayBleGlzdGVkIGNvbnRlbnQgaW5pdGlhbGx5IGZyb20gdGVtcGxhdGUgYW5kIHRyaWdnZXIgdGhlaXIgZHJhd2luZ1xyXG4gICAgZHRkbE9iai5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIGlmKGVsZW1lbnRbXCJAdHlwZVwiXSE9XCJQcm9wZXJ0eVwiKSByZXR1cm5cclxuICAgICAgICBuZXcgc2luZ2xlUGFyYW1ldGVyUm93KGVsZW1lbnQsY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9iaixcInRvcExldmVsXCIsZGlhbG9nT2Zmc2V0KVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNpbmdsZVBhcmFtZXRlclJvdyhkdGRsT2JqLHBhcmVudERPTSxyZWZyZXNoRFRETEYscGFyZW50RHRkbE9iaix0b3BMZXZlbCxkaWFsb2dPZmZzZXQpe1xyXG4gICAgdmFyIERPTSA9ICQoJzxkaXYgY2xhc3M9XCJ3My1jZWxsLXJvd1wiPjwvZGl2PicpXHJcbiAgICB2YXIgcGFyYW1ldGVyTmFtZUlucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjEwMHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwicGFyYW1ldGVyIG5hbWVcIi8+JykuYWRkQ2xhc3MoXCJ3My1iYXItaXRlbSB3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICB2YXIgZW51bVZhbHVlSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmU7d2lkdGg6MTAwcHg7cGFkZGluZzo0cHhcIiAgcGxhY2Vob2xkZXI9XCJzdHIxLHN0cjIsLi4uXCIvPicpLmFkZENsYXNzKFwidzMtYmFyLWl0ZW0gdzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgdmFyIGFkZEJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cImNvbG9yOmdyYXk7bWFyZ2luLWxlZnQ6M3B4O21hcmdpbi10b3A6MnB4O2ZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjJweFwiPjxpIGNsYXNzPVwiZmEgZmEtcGx1cyBmYS1sZ1wiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgdmFyIHJlbW92ZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cImNvbG9yOmdyYXk7bWFyZ2luLWxlZnQ6M3B4O21hcmdpbi10b3A6MnB4O2ZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjJweFwiPjxpIGNsYXNzPVwiZmEgZmEtdHJhc2ggZmEtbGdcIj48L2k+PC9idXR0b24+JylcclxuICAgIHZhciBwdHlwZVNlbGVjdG9yPW5ldyBzaW1wbGVTZWxlY3RNZW51KFwiIFwiLHt3aXRoQm9yZGVyOjEsZm9udFNpemU6XCIxZW1cIixjb2xvckNsYXNzOlwidzMtbGlnaHQtZ3JheSB3My1iYXItaXRlbVwiLGJ1dHRvbkNTUzp7XCJwYWRkaW5nXCI6XCI0cHggNXB4XCJ9LFwib3B0aW9uTGlzdEhlaWdodFwiOjMwMCxcImlzQ2xpY2thYmxlXCI6MSxcIm9wdGlvbkxpc3RNYXJnaW5Ub3BcIjotMTUwLFwib3B0aW9uTGlzdE1hcmdpbkxlZnRcIjo2MCxcclxuICAgIFwiYWRqdXN0UG9zaXRpb25BbmNob3JcIjpkaWFsb2dPZmZzZXR9KVxyXG4gICAgcHR5cGVTZWxlY3Rvci5hZGRPcHRpb25BcnIoW1wiRW51bVwiLFwiT2JqZWN0XCIsXCJib29sZWFuXCIsXCJkYXRlXCIsXCJkYXRlVGltZVwiLFwiZG91YmxlXCIsXCJkdXJhdGlvblwiLFwiZmxvYXRcIixcImludGVnZXJcIixcImxvbmdcIixcInN0cmluZ1wiLFwidGltZVwiXSlcclxuICAgIERPTS5hcHBlbmQocGFyYW1ldGVyTmFtZUlucHV0LHB0eXBlU2VsZWN0b3IuRE9NLGVudW1WYWx1ZUlucHV0LGFkZEJ1dHRvbixyZW1vdmVCdXR0b24pXHJcblxyXG4gICAgcmVtb3ZlQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIGZvciAodmFyIGkgPTA7aTwgcGFyZW50RHRkbE9iai5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAocGFyZW50RHRkbE9ialtpXSA9PT0gZHRkbE9iaikge1xyXG4gICAgICAgICAgICAgICAgcGFyZW50RHRkbE9iai5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBET00ucmVtb3ZlKClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuICAgIFxyXG4gICAgdmFyIGNvbnRlbnRET009JCgnPGRpdiBzdHlsZT1cInBhZGRpbmctbGVmdDoxMHB4XCI+PC9kaXY+JylcclxuICAgIERPTS5hcHBlbmQoY29udGVudERPTSlcclxuICAgIHBhcmVudERPTS5hcHBlbmQoRE9NKVxyXG5cclxuICAgIHBhcmFtZXRlck5hbWVJbnB1dC52YWwoZHRkbE9ialtcIm5hbWVcIl0pXHJcbiAgICBwdHlwZVNlbGVjdG9yLmNhbGxCYWNrX2NsaWNrT3B0aW9uPShvcHRpb25UZXh0LG9wdGlvblZhbHVlLHJlYWxNb3VzZUNsaWNrKT0+e1xyXG4gICAgICAgIHB0eXBlU2VsZWN0b3IuY2hhbmdlTmFtZShvcHRpb25UZXh0KVxyXG4gICAgICAgIGNvbnRlbnRET00uZW1wdHkoKS8vY2xlYXIgYWxsIGNvbnRlbnQgZG9tIGNvbnRlbnRcclxuICAgICAgICBpZihyZWFsTW91c2VDbGljayl7XHJcbiAgICAgICAgICAgIGZvcih2YXIgaW5kIGluIGR0ZGxPYmopIGRlbGV0ZSBkdGRsT2JqW2luZF0gICAgLy9jbGVhciBhbGwgb2JqZWN0IGNvbnRlbnRcclxuICAgICAgICAgICAgaWYodG9wTGV2ZWwpIGR0ZGxPYmpbXCJAdHlwZVwiXT1cIlByb3BlcnR5XCJcclxuICAgICAgICAgICAgZHRkbE9ialtcIm5hbWVcIl09cGFyYW1ldGVyTmFtZUlucHV0LnZhbCgpXHJcbiAgICAgICAgfSBcclxuICAgICAgICBpZihvcHRpb25UZXh0PT1cIkVudW1cIil7XHJcbiAgICAgICAgICAgIGVudW1WYWx1ZUlucHV0LnZhbChcIlwiKVxyXG4gICAgICAgICAgICBlbnVtVmFsdWVJbnB1dC5zaG93KCk7XHJcbiAgICAgICAgICAgIGFkZEJ1dHRvbi5oaWRlKClcclxuICAgICAgICAgICAgaWYocmVhbE1vdXNlQ2xpY2spIGR0ZGxPYmpbXCJzY2hlbWFcIl09e1wiQHR5cGVcIjogXCJFbnVtXCIsXCJ2YWx1ZVNjaGVtYVwiOiBcInN0cmluZ1wifVxyXG4gICAgICAgIH1lbHNlIGlmKG9wdGlvblRleHQ9PVwiT2JqZWN0XCIpe1xyXG4gICAgICAgICAgICBlbnVtVmFsdWVJbnB1dC5oaWRlKCk7XHJcbiAgICAgICAgICAgIGFkZEJ1dHRvbi5zaG93KClcclxuICAgICAgICAgICAgaWYocmVhbE1vdXNlQ2xpY2spIGR0ZGxPYmpbXCJzY2hlbWFcIl09e1wiQHR5cGVcIjogXCJPYmplY3RcIn1cclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgaWYocmVhbE1vdXNlQ2xpY2spIGR0ZGxPYmpbXCJzY2hlbWFcIl09b3B0aW9uVGV4dFxyXG4gICAgICAgICAgICBlbnVtVmFsdWVJbnB1dC5oaWRlKCk7XHJcbiAgICAgICAgICAgIGFkZEJ1dHRvbi5oaWRlKClcclxuICAgICAgICB9XHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH1cclxuICAgIGFkZEJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICBpZighIGR0ZGxPYmpbXCJzY2hlbWFcIl1bXCJmaWVsZHNcIl0pIGR0ZGxPYmpbXCJzY2hlbWFcIl1bXCJmaWVsZHNcIl09W11cclxuICAgICAgICB2YXIgbmV3T2JqID0ge1xyXG4gICAgICAgICAgICBcIm5hbWVcIjogXCJuZXdQXCIsXHJcbiAgICAgICAgICAgIFwic2NoZW1hXCI6IFwiZG91YmxlXCJcclxuICAgICAgICB9XHJcbiAgICAgICAgZHRkbE9ialtcInNjaGVtYVwiXVtcImZpZWxkc1wiXS5wdXNoKG5ld09iailcclxuICAgICAgICBuZXcgc2luZ2xlUGFyYW1ldGVyUm93KG5ld09iaixjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqW1wic2NoZW1hXCJdW1wiZmllbGRzXCJdLG51bGwsZGlhbG9nT2Zmc2V0KVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG5cclxuICAgIHBhcmFtZXRlck5hbWVJbnB1dC5vbihcImNoYW5nZVwiLCgpPT57XHJcbiAgICAgICAgZHRkbE9ialtcIm5hbWVcIl09cGFyYW1ldGVyTmFtZUlucHV0LnZhbCgpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcbiAgICBlbnVtVmFsdWVJbnB1dC5vbihcImNoYW5nZVwiLCgpPT57XHJcbiAgICAgICAgdmFyIHZhbHVlQXJyPWVudW1WYWx1ZUlucHV0LnZhbCgpLnNwbGl0KFwiLFwiKVxyXG4gICAgICAgIGR0ZGxPYmpbXCJzY2hlbWFcIl1bXCJlbnVtVmFsdWVzXCJdPVtdXHJcbiAgICAgICAgdmFsdWVBcnIuZm9yRWFjaChhVmFsPT57XHJcbiAgICAgICAgICAgIGR0ZGxPYmpbXCJzY2hlbWFcIl1bXCJlbnVtVmFsdWVzXCJdLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgXCJuYW1lXCI6IGFWYWwucmVwbGFjZShcIiBcIixcIlwiKSwgLy9yZW1vdmUgYWxsIHRoZSBzcGFjZSBpbiBuYW1lXHJcbiAgICAgICAgICAgICAgICBcImVudW1WYWx1ZVwiOiBhVmFsXHJcbiAgICAgICAgICAgICAgfSlcclxuICAgICAgICB9KVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgaWYodHlwZW9mKGR0ZGxPYmpbXCJzY2hlbWFcIl0pICE9ICdvYmplY3QnKSB2YXIgc2NoZW1hPWR0ZGxPYmpbXCJzY2hlbWFcIl1cclxuICAgIGVsc2Ugc2NoZW1hPWR0ZGxPYmpbXCJzY2hlbWFcIl1bXCJAdHlwZVwiXVxyXG4gICAgcHR5cGVTZWxlY3Rvci50cmlnZ2VyT3B0aW9uVmFsdWUoc2NoZW1hKVxyXG4gICAgaWYoc2NoZW1hPT1cIkVudW1cIil7XHJcbiAgICAgICAgdmFyIGVudW1BcnI9ZHRkbE9ialtcInNjaGVtYVwiXVtcImVudW1WYWx1ZXNcIl1cclxuICAgICAgICBpZihlbnVtQXJyIT1udWxsKXtcclxuICAgICAgICAgICAgdmFyIGlucHV0U3RyPVwiXCJcclxuICAgICAgICAgICAgZW51bUFyci5mb3JFYWNoKG9uZUVudW1WYWx1ZT0+e2lucHV0U3RyKz1vbmVFbnVtVmFsdWUuZW51bVZhbHVlK1wiLFwifSlcclxuICAgICAgICAgICAgaW5wdXRTdHI9aW5wdXRTdHIuc2xpY2UoMCwgLTEpLy9yZW1vdmUgdGhlIGxhc3QgXCIsXCJcclxuICAgICAgICAgICAgZW51bVZhbHVlSW5wdXQudmFsKGlucHV0U3RyKVxyXG4gICAgICAgIH1cclxuICAgIH1lbHNlIGlmKHNjaGVtYT09XCJPYmplY3RcIil7XHJcbiAgICAgICAgdmFyIGZpZWxkcz1kdGRsT2JqW1wic2NoZW1hXCJdW1wiZmllbGRzXCJdXHJcbiAgICAgICAgZmllbGRzLmZvckVhY2gob25lRmllbGQ9PntcclxuICAgICAgICAgICAgbmV3IHNpbmdsZVBhcmFtZXRlclJvdyhvbmVGaWVsZCxjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqW1wic2NoZW1hXCJdW1wiZmllbGRzXCJdLG51bGwsZGlhbG9nT2Zmc2V0KVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5mdW5jdGlvbiBpZFJvdyhkdGRsT2JqLHBhcmVudERPTSxyZWZyZXNoRFRETEYpe1xyXG4gICAgdmFyIERPTSA9ICQoJzxkaXYgY2xhc3M9XCJ3My1jZWxsLXJvd1wiPjwvZGl2PicpXHJcbiAgICB2YXIgbGFiZWwxPSQoJzxkaXYgY2xhc3M9XCJ3My1vcGFjaXR5XCIgc3R5bGU9XCJkaXNwbGF5OmlubGluZVwiPmR0bWk6PC9kaXY+JylcclxuICAgIHZhciBkb21haW5JbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDo4MHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwiTmFtZXNwYWNlXCIvPicpLmFkZENsYXNzKFwidzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgdmFyIG1vZGVsSURJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDoxNDBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cIk1vZGVsSURcIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICB2YXIgdmVyc2lvbklucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjYwcHg7cGFkZGluZzo0cHhcIiAgcGxhY2Vob2xkZXI9XCJ2ZXJzaW9uXCIvPicpLmFkZENsYXNzKFwidzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgRE9NLmFwcGVuZChsYWJlbDEsZG9tYWluSW5wdXQsJCgnPGRpdiBjbGFzcz1cInczLW9wYWNpdHlcIiBzdHlsZT1cImRpc3BsYXk6aW5saW5lXCI+OjwvZGl2PicpLG1vZGVsSURJbnB1dCwkKCc8ZGl2IGNsYXNzPVwidzMtb3BhY2l0eVwiIHN0eWxlPVwiZGlzcGxheTppbmxpbmVcIj47PC9kaXY+JyksdmVyc2lvbklucHV0KVxyXG4gICAgcGFyZW50RE9NLmFwcGVuZChET00pXHJcblxyXG4gICAgdmFyIHZhbHVlQ2hhbmdlPSgpPT57XHJcbiAgICAgICAgdmFyIHN0cj1gZHRtaToke2RvbWFpbklucHV0LnZhbCgpfToke21vZGVsSURJbnB1dC52YWwoKX07JHt2ZXJzaW9uSW5wdXQudmFsKCl9YFxyXG4gICAgICAgIGR0ZGxPYmpbXCJAaWRcIl09c3RyXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH1cclxuICAgIGRvbWFpbklucHV0Lm9uKFwiY2hhbmdlXCIsdmFsdWVDaGFuZ2UpXHJcbiAgICBtb2RlbElESW5wdXQub24oXCJjaGFuZ2VcIix2YWx1ZUNoYW5nZSlcclxuICAgIHZlcnNpb25JbnB1dC5vbihcImNoYW5nZVwiLHZhbHVlQ2hhbmdlKVxyXG5cclxuICAgIHZhciBzdHI9ZHRkbE9ialtcIkBpZFwiXVxyXG4gICAgaWYoc3RyIT1cIlwiICYmIHN0ciE9bnVsbCl7XHJcbiAgICAgICAgdmFyIGFycjE9c3RyLnNwbGl0KFwiO1wiKVxyXG4gICAgICAgIGlmKGFycjEubGVuZ3RoIT0yKSByZXR1cm47XHJcbiAgICAgICAgdmVyc2lvbklucHV0LnZhbChhcnIxWzFdKVxyXG4gICAgICAgIHZhciBhcnIyPWFycjFbMF0uc3BsaXQoXCI6XCIpXHJcbiAgICAgICAgZG9tYWluSW5wdXQudmFsKGFycjJbMV0pXHJcbiAgICAgICAgYXJyMi5zaGlmdCgpOyBhcnIyLnNoaWZ0KClcclxuICAgICAgICBtb2RlbElESW5wdXQudmFsKGFycjIuam9pbihcIjpcIikpXHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRpc3BsYXlOYW1lUm93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRil7XHJcbiAgICB2YXIgRE9NID0gJCgnPGRpdiBjbGFzcz1cInczLWNlbGwtcm93XCI+PC9kaXY+JylcclxuICAgIHZhciBsYWJlbDE9JCgnPGRpdiBjbGFzcz1cInczLW9wYWNpdHlcIiBzdHlsZT1cImRpc3BsYXk6aW5saW5lXCI+RGlzcGxheSBOYW1lOjwvZGl2PicpXHJcbiAgICB2YXIgbmFtZUlucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjE1MHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwiTW9kZWxJRFwiLz4nKS5hZGRDbGFzcyhcInczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIERPTS5hcHBlbmQobGFiZWwxLG5hbWVJbnB1dClcclxuICAgIHBhcmVudERPTS5hcHBlbmQoRE9NKVxyXG4gICAgdmFyIHZhbHVlQ2hhbmdlPSgpPT57XHJcbiAgICAgICAgZHRkbE9ialtcImRpc3BsYXlOYW1lXCJdPW5hbWVJbnB1dC52YWwoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9XHJcbiAgICBuYW1lSW5wdXQub24oXCJjaGFuZ2VcIix2YWx1ZUNoYW5nZSlcclxuICAgIHZhciBzdHI9ZHRkbE9ialtcImRpc3BsYXlOYW1lXCJdXHJcbiAgICBpZihzdHIhPVwiXCIgJiYgc3RyIT1udWxsKSBuYW1lSW5wdXQudmFsKHN0cilcclxufSIsImNvbnN0IG1vZGVsQW5hbHl6ZXI9cmVxdWlyZShcIi4vbW9kZWxBbmFseXplclwiKVxyXG5jb25zdCBzaW1wbGVUcmVlPSByZXF1aXJlKFwiLi9zaW1wbGVUcmVlXCIpXHJcbmNvbnN0IHNpbXBsZUNvbmZpcm1EaWFsb2cgPSByZXF1aXJlKFwiLi9zaW1wbGVDb25maXJtRGlhbG9nXCIpXHJcbmNvbnN0IG1vZGVsRWRpdG9yRGlhbG9nID0gcmVxdWlyZShcIi4vbW9kZWxFZGl0b3JEaWFsb2dcIilcclxuY29uc3QgZ2xvYmFsQ2FjaGUgPSByZXF1aXJlKFwiLi9nbG9iYWxDYWNoZVwiKVxyXG5jb25zdCBtc2FsSGVscGVyPXJlcXVpcmUoXCIuLi9tc2FsSGVscGVyXCIpXHJcblxyXG5mdW5jdGlvbiBtb2RlbE1hbmFnZXJEaWFsb2coKSB7XHJcbiAgICBpZighdGhpcy5ET00pe1xyXG4gICAgICAgIHRoaXMuRE9NID0gJCgnPGRpdiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7YmFja2dyb3VuZC1jb2xvcjp3aGl0ZTtsZWZ0OjUwJTt0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSkgdHJhbnNsYXRlWSgtNTAlKTt6LWluZGV4Ojk5XCIgY2xhc3M9XCJ3My1jYXJkLTJcIj48L2Rpdj4nKVxyXG4gICAgICAgIHRoaXMuRE9NLmNzcyhcIm92ZXJmbG93XCIsXCJoaWRkZW5cIilcclxuICAgICAgICAkKFwiYm9keVwiKS5hcHBlbmQodGhpcy5ET00pXHJcbiAgICAgICAgdGhpcy5ET00uaGlkZSgpXHJcbiAgICB9XHJcbiAgICB0aGlzLnNob3dSZWxhdGlvblZpc3VhbGl6YXRpb25TZXR0aW5ncz10cnVlO1xyXG59XHJcblxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5wb3B1cCA9IGFzeW5jIGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5ET00uc2hvdygpXHJcbiAgICB0aGlzLkRPTS5lbXB0eSgpXHJcbiAgICB0aGlzLmNvbnRlbnRET00gPSAkKCc8ZGl2IHN0eWxlPVwid2lkdGg6NjUwcHhcIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKHRoaXMuY29udGVudERPTSlcclxuICAgIHRoaXMuY29udGVudERPTS5hcHBlbmQoJCgnPGRpdiBzdHlsZT1cImhlaWdodDo0MHB4XCIgY2xhc3M9XCJ3My1iYXIgdzMtcmVkXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtXCIgc3R5bGU9XCJmb250LXNpemU6MS41ZW1cIj5EaWdpdGFsIFR3aW4gTW9kZWxzPC9kaXY+PC9kaXY+JykpXHJcbiAgICB2YXIgY2xvc2VCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJpZ2h0XCIgc3R5bGU9XCJmb250LXNpemU6MmVtO3BhZGRpbmctdG9wOjRweFwiPsOXPC9idXR0b24+JylcclxuICAgIHRoaXMuY29udGVudERPTS5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKGNsb3NlQnV0dG9uKVxyXG4gICAgY2xvc2VCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMuRE9NLmhpZGUoKSB9KVxyXG5cclxuICAgIHZhciBpbXBvcnRNb2RlbHNCdG4gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWNhcmQgdzMtZGVlcC1vcmFuZ2UgdzMtaG92ZXItbGlnaHQtZ3JlZW5cIiBzdHlsZT1cImhlaWdodDoxMDAlXCI+SW1wb3J0PC9idXR0b24+JylcclxuICAgIHZhciBhY3R1YWxJbXBvcnRNb2RlbHNCdG4gPSQoJzxpbnB1dCB0eXBlPVwiZmlsZVwiIG5hbWU9XCJtb2RlbEZpbGVzXCIgbXVsdGlwbGU9XCJtdWx0aXBsZVwiIHN0eWxlPVwiZGlzcGxheTpub25lXCI+PC9pbnB1dD4nKVxyXG4gICAgdmFyIG1vZGVsRWRpdG9yQnRuID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1jYXJkIHczLWRlZXAtb3JhbmdlIHczLWhvdmVyLWxpZ2h0LWdyZWVuXCIgc3R5bGU9XCJoZWlnaHQ6MTAwJVwiPkNyZWF0ZSBNb2RlbDwvYnV0dG9uPicpXHJcbiAgICB2YXIgZXhwb3J0TW9kZWxCdG4gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWNhcmQgdzMtZGVlcC1vcmFuZ2UgdzMtaG92ZXItbGlnaHQtZ3JlZW5cIiBzdHlsZT1cImhlaWdodDoxMDAlXCI+RXhwb3J0IEFsbCBNb2RlbHM8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmNoaWxkcmVuKCc6Zmlyc3QnKS5hcHBlbmQoaW1wb3J0TW9kZWxzQnRuLGFjdHVhbEltcG9ydE1vZGVsc0J0biwgbW9kZWxFZGl0b3JCdG4sZXhwb3J0TW9kZWxCdG4pXHJcbiAgICBpbXBvcnRNb2RlbHNCdG4ub24oXCJjbGlja1wiLCAoKT0+e1xyXG4gICAgICAgIGFjdHVhbEltcG9ydE1vZGVsc0J0bi50cmlnZ2VyKCdjbGljaycpO1xyXG4gICAgfSk7XHJcbiAgICBhY3R1YWxJbXBvcnRNb2RlbHNCdG4uY2hhbmdlKGFzeW5jIChldnQpPT57XHJcbiAgICAgICAgdmFyIGZpbGVzID0gZXZ0LnRhcmdldC5maWxlczsgLy8gRmlsZUxpc3Qgb2JqZWN0XHJcbiAgICAgICAgYXdhaXQgdGhpcy5yZWFkTW9kZWxGaWxlc0NvbnRlbnRBbmRJbXBvcnQoZmlsZXMpXHJcbiAgICAgICAgYWN0dWFsSW1wb3J0TW9kZWxzQnRuLnZhbChcIlwiKVxyXG4gICAgfSlcclxuICAgIG1vZGVsRWRpdG9yQnRuLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIG1vZGVsRWRpdG9yRGlhbG9nLnBvcHVwKClcclxuICAgIH0pXHJcbiAgICBleHBvcnRNb2RlbEJ0bi5vbihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgICB2YXIgbW9kZWxBcnI9W11cclxuICAgICAgICBmb3IodmFyIG1vZGVsSUQgaW4gbW9kZWxBbmFseXplci5EVERMTW9kZWxzKSBtb2RlbEFyci5wdXNoKEpTT04ucGFyc2UobW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdW1wib3JpZ2luYWxcIl0pKVxyXG4gICAgICAgIHZhciBwb20gPSAkKFwiPGE+PC9hPlwiKVxyXG4gICAgICAgIHBvbS5hdHRyKCdocmVmJywgJ2RhdGE6dGV4dC9wbGFpbjtjaGFyc2V0PXV0Zi04LCcgKyBlbmNvZGVVUklDb21wb25lbnQoSlNPTi5zdHJpbmdpZnkobW9kZWxBcnIpKSk7XHJcbiAgICAgICAgcG9tLmF0dHIoJ2Rvd25sb2FkJywgXCJleHBvcnRNb2RlbHMuanNvblwiKTtcclxuICAgICAgICBwb21bMF0uY2xpY2soKVxyXG4gICAgfSlcclxuXHJcbiAgICB2YXIgcm93Mj0kKCc8ZGl2IGNsYXNzPVwidzMtY2VsbC1yb3dcIiBzdHlsZT1cIm1hcmdpbi10b3A6MnB4XCI+PC9kaXY+JylcclxuICAgIHRoaXMuY29udGVudERPTS5hcHBlbmQocm93MilcclxuICAgIHZhciBsZWZ0U3Bhbj0kKCc8ZGl2IGNsYXNzPVwidzMtY2VsbFwiIHN0eWxlPVwid2lkdGg6MjQwcHg7cGFkZGluZy1yaWdodDo1cHhcIj48L2Rpdj4nKVxyXG4gICAgcm93Mi5hcHBlbmQobGVmdFNwYW4pXHJcbiAgICBsZWZ0U3Bhbi5hcHBlbmQoJCgnPGRpdiBzdHlsZT1cImhlaWdodDozMHB4XCIgY2xhc3M9XCJ3My1iYXIgdzMtcmVkXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtXCIgc3R5bGU9XCJcIj5Nb2RlbHM8L2Rpdj48L2Rpdj4nKSlcclxuICAgIFxyXG4gICAgdmFyIG1vZGVsTGlzdCA9ICQoJzx1bCBjbGFzcz1cInczLXVsIHczLWhvdmVyYWJsZVwiPicpXHJcbiAgICBtb2RlbExpc3QuY3NzKHtcIm92ZXJmbG93LXhcIjpcImhpZGRlblwiLFwib3ZlcmZsb3cteVwiOlwiYXV0b1wiLFwiaGVpZ2h0XCI6XCI0MjBweFwiLCBcImJvcmRlclwiOlwic29saWQgMXB4IGxpZ2h0Z3JheVwifSlcclxuICAgIGxlZnRTcGFuLmFwcGVuZChtb2RlbExpc3QpXHJcbiAgICB0aGlzLm1vZGVsTGlzdCA9IG1vZGVsTGlzdDtcclxuICAgIFxyXG4gICAgdmFyIHJpZ2h0U3Bhbj0kKCc8ZGl2IGNsYXNzPVwidzMtY29udGFpbmVyIHczLWNlbGxcIiBzdHlsZT1cInBhZGRpbmc6MHB4XCI+PC9kaXY+JylcclxuICAgIHJvdzIuYXBwZW5kKHJpZ2h0U3BhbikgXHJcbiAgICB2YXIgcGFuZWxDYXJkT3V0PSQoJzxkaXYgY2xhc3M9XCJ3My1jYXJkLTIgdzMtd2hpdGVcIiBzdHlsZT1cIm1hcmdpbi10b3A6MnB4XCI+PC9kaXY+JylcclxuXHJcbiAgICB0aGlzLm1vZGVsQnV0dG9uQmFyPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXJcIiBzdHlsZT1cImhlaWdodDozNXB4XCI+PC9kaXY+JylcclxuICAgIHBhbmVsQ2FyZE91dC5hcHBlbmQodGhpcy5tb2RlbEJ1dHRvbkJhcilcclxuXHJcbiAgICByaWdodFNwYW4uYXBwZW5kKHBhbmVsQ2FyZE91dClcclxuICAgIHZhciBwYW5lbENhcmQ9JCgnPGRpdiBzdHlsZT1cIndpZHRoOjQxMHB4O2hlaWdodDo0MTJweDtvdmVyZmxvdzphdXRvO21hcmdpbi10b3A6MnB4XCI+PC9kaXY+JylcclxuICAgIHBhbmVsQ2FyZE91dC5hcHBlbmQocGFuZWxDYXJkKVxyXG4gICAgdGhpcy5wYW5lbENhcmQ9cGFuZWxDYXJkO1xyXG5cclxuICAgIHRoaXMubW9kZWxCdXR0b25CYXIuZW1wdHkoKVxyXG4gICAgcGFuZWxDYXJkLmh0bWwoXCI8YSBzdHlsZT0nZGlzcGxheTpibG9jaztmb250LXN0eWxlOml0YWxpYztjb2xvcjpncmF5O3BhZGRpbmctbGVmdDo1cHgnPkNob29zZSBhIG1vZGVsIHRvIHZpZXcgaW5mb21yYXRpb248L2E+XCIpXHJcblxyXG4gICAgdGhpcy5saXN0TW9kZWxzKClcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5yZXNpemVJbWdGaWxlID0gYXN5bmMgZnVuY3Rpb24odGhlRmlsZSxtYXhfc2l6ZSkge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcclxuICAgICAgICAgICAgdmFyIHRtcEltZyA9IG5ldyBJbWFnZSgpO1xyXG4gICAgICAgICAgICByZWFkZXIub25sb2FkID0gKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdG1wSW1nLm9ubG9hZCA9ICAoKT0+IHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJylcclxuICAgICAgICAgICAgICAgICAgICB2YXIgd2lkdGggPSB0bXBJbWcud2lkdGhcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaGVpZ2h0ID0gdG1wSW1nLmhlaWdodDtcclxuICAgICAgICAgICAgICAgICAgICBpZiAod2lkdGggPiBoZWlnaHQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHdpZHRoID4gbWF4X3NpemUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodCAqPSBtYXhfc2l6ZSAvIHdpZHRoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGggPSBtYXhfc2l6ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChoZWlnaHQgPiBtYXhfc2l6ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGggKj0gbWF4X3NpemUgLyBoZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQgPSBtYXhfc2l6ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBjYW52YXMud2lkdGggPSB3aWR0aDtcclxuICAgICAgICAgICAgICAgICAgICBjYW52YXMuaGVpZ2h0ID0gaGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgICAgIGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpLmRyYXdJbWFnZSh0bXBJbWcsIDAsIDAsIHdpZHRoLCBoZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBkYXRhVXJsID0gY2FudmFzLnRvRGF0YVVSTCgnaW1hZ2UvcG5nJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZShkYXRhVXJsKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdG1wSW1nLnNyYyA9IHJlYWRlci5yZXN1bHQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmVhZGVyLnJlYWRBc0RhdGFVUkwodGhlRmlsZSk7XHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICByZWplY3QoZSlcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLmZpbGxSaWdodFNwYW49YXN5bmMgZnVuY3Rpb24obW9kZWxJRCl7XHJcbiAgICB0aGlzLnBhbmVsQ2FyZC5lbXB0eSgpXHJcbiAgICB0aGlzLm1vZGVsQnV0dG9uQmFyLmVtcHR5KClcclxuXHJcbiAgICB2YXIgZGVsQnRuID0gJCgnPGJ1dHRvbiBzdHlsZT1cIm1hcmdpbi1ib3R0b206MnB4XCIgY2xhc3M9XCJ3My1idXR0b24gdzMtbGlnaHQtZ3JheSB3My1ob3Zlci1waW5rIHczLWJvcmRlci1yaWdodFwiPkRlbGV0ZSBNb2RlbDwvYnV0dG9uPicpXHJcbiAgICB0aGlzLm1vZGVsQnV0dG9uQmFyLmFwcGVuZChkZWxCdG4pXHJcblxyXG5cclxuICAgIHZhciBpbXBvcnRQaWNCdG4gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWxpZ2h0LWdyYXkgdzMtaG92ZXItYW1iZXIgdzMtYm9yZGVyLXJpZ2h0XCI+VXBsb2FkIEF2YXJ0YTwvYnV0dG9uPicpXHJcbiAgICB2YXIgYWN0dWFsSW1wb3J0UGljQnRuID0gJCgnPGlucHV0IHR5cGU9XCJmaWxlXCIgbmFtZT1cImltZ1wiIHN0eWxlPVwiZGlzcGxheTpub25lXCI+PC9pbnB1dD4nKVxyXG4gICAgdmFyIGNsZWFyQXZhcnRhQnRuID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1saWdodC1ncmF5IHczLWhvdmVyLXBpbmsgdzMtYm9yZGVyLXJpZ2h0XCI+Q2xlYXIgQXZhcnRhPC9idXR0b24+JylcclxuICAgIHRoaXMubW9kZWxCdXR0b25CYXIuYXBwZW5kKGltcG9ydFBpY0J0biwgYWN0dWFsSW1wb3J0UGljQnRuLCBjbGVhckF2YXJ0YUJ0bilcclxuICAgIGltcG9ydFBpY0J0bi5vbihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgICBhY3R1YWxJbXBvcnRQaWNCdG4udHJpZ2dlcignY2xpY2snKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGFjdHVhbEltcG9ydFBpY0J0bi5jaGFuZ2UoYXN5bmMgKGV2dCkgPT4ge1xyXG4gICAgICAgIHZhciBmaWxlcyA9IGV2dC50YXJnZXQuZmlsZXM7IC8vIEZpbGVMaXN0IG9iamVjdFxyXG4gICAgICAgIHZhciB0aGVGaWxlID0gZmlsZXNbMF1cclxuXHJcbiAgICAgICAgaWYgKHRoZUZpbGUudHlwZSA9PSBcImltYWdlL3N2Zyt4bWxcIikge1xyXG4gICAgICAgICAgICB2YXIgc3RyID0gYXdhaXQgdGhpcy5yZWFkT25lRmlsZSh0aGVGaWxlKVxyXG4gICAgICAgICAgICB2YXIgZGF0YVVybCA9ICdkYXRhOmltYWdlL3N2Zyt4bWw7dXRmOCwnICsgZW5jb2RlVVJJQ29tcG9uZW50KHN0cik7XHJcbiAgICAgICAgfSBlbHNlIGlmICh0aGVGaWxlLnR5cGUubWF0Y2goJ2ltYWdlLionKSkge1xyXG4gICAgICAgICAgICB2YXIgZGF0YVVybCA9IGF3YWl0IHRoaXMucmVzaXplSW1nRmlsZSh0aGVGaWxlLCA3MClcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB2YXIgY29uZmlybURpYWxvZ0RpdiA9IG5ldyBzaW1wbGVDb25maXJtRGlhbG9nKClcclxuICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5zaG93KHsgd2lkdGg6IFwiMjAwcHhcIiB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiBcIk5vdGVcIlxyXG4gICAgICAgICAgICAgICAgICAgICwgY29udGVudDogXCJQbGVhc2UgaW1wb3J0IGltYWdlIGZpbGUgKHBuZyxqcGcsc3ZnIGFuZCBzbyBvbilcIlxyXG4gICAgICAgICAgICAgICAgICAgICwgYnV0dG9uczogW3sgY29sb3JDbGFzczogXCJ3My1ncmF5XCIsIHRleHQ6IFwiT2tcIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4geyBjb25maXJtRGlhbG9nRGl2LmNsb3NlKCkgfSB9XVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLmF2YXJ0YUltZykgdGhpcy5hdmFydGFJbWcuYXR0cihcInNyY1wiLCBkYXRhVXJsKVxyXG5cclxuICAgICAgICB2YXIgdmlzdWFsSnNvbiA9IGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdXHJcbiAgICAgICAgaWYgKCF2aXN1YWxKc29uW21vZGVsSURdKSB2aXN1YWxKc29uW21vZGVsSURdID0ge31cclxuICAgICAgICB2aXN1YWxKc29uW21vZGVsSURdLmF2YXJ0YSA9IGRhdGFVcmxcclxuICAgICAgICB0aGlzLnNhdmVWaXN1YWxEZWZpbml0aW9uKClcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJ2aXN1YWxEZWZpbml0aW9uQ2hhbmdlXCIsIFwibW9kZWxJRFwiOiBtb2RlbElELCBcImF2YXJ0YVwiOiBkYXRhVXJsIH0pXHJcbiAgICAgICAgdGhpcy5yZWZyZXNoTW9kZWxUcmVlTGFiZWwoKVxyXG4gICAgICAgIGFjdHVhbEltcG9ydFBpY0J0bi52YWwoXCJcIilcclxuICAgIH0pXHJcblxyXG4gICAgY2xlYXJBdmFydGFCdG4ub24oXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgICAgdmFyIHZpc3VhbEpzb24gPSBnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW1wiZGVmYXVsdFwiXVxyXG4gICAgICAgIGlmICh2aXN1YWxKc29uW21vZGVsSURdKSBkZWxldGUgdmlzdWFsSnNvblttb2RlbElEXS5hdmFydGFcclxuICAgICAgICBpZiAodGhpcy5hdmFydGFJbWcpIHRoaXMuYXZhcnRhSW1nLnJlbW92ZUF0dHIoJ3NyYycpO1xyXG4gICAgICAgIHRoaXMuc2F2ZVZpc3VhbERlZmluaXRpb24oKVxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIiwgXCJtb2RlbElEXCI6IG1vZGVsSUQsIFwibm9BdmFydGFcIjogdHJ1ZSB9KVxyXG4gICAgICAgIHRoaXMucmVmcmVzaE1vZGVsVHJlZUxhYmVsKClcclxuICAgIH0pO1xyXG5cclxuICAgIFxyXG4gICAgZGVsQnRuLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIHZhciBjb25maXJtRGlhbG9nRGl2ID0gbmV3IHNpbXBsZUNvbmZpcm1EaWFsb2coKVxyXG5cclxuICAgICAgICAvL2NoZWNrIGhvdyBtYW55IHR3aW5zIGFyZSB1bmRlciB0aGlzIG1vZGVsIElEXHJcbiAgICAgICAgdmFyIG51bWJlck9mVHdpbnM9MFxyXG4gICAgICAgIGdsb2JhbENhY2hlLkRCVHdpbnNBcnIuZm9yRWFjaChvbmVEQlR3aW49PntcclxuICAgICAgICAgICAgaWYob25lREJUd2luW1wibW9kZWxJRFwiXT09bW9kZWxJRCkgbnVtYmVyT2ZUd2lucysrXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgdmFyIGNvbnRlbnRTdHI9XCJUaGlzIHdpbGwgREVMRVRFIG1vZGVsIFxcXCJcIiArIG1vZGVsSUQgKyBcIlxcXCIuIFwiXHJcbiAgICAgICAgY29udGVudFN0cis9XCIoVGhlcmUgXCIrKChudW1iZXJPZlR3aW5zPjEpPyhcImFyZSBcIitudW1iZXJPZlR3aW5zK1wiIHR3aW5zXCIpOihcImlzIFwiK251bWJlck9mVHdpbnMrXCIgdHdpblwiKSApICsgXCIgb2YgdGhpcyBtb2RlbC5cIlxyXG4gICAgICAgIGlmKG51bWJlck9mVHdpbnM+MCkgY29udGVudFN0cis9XCIgWW91IG1heSBzdGlsbCBkZWxldGUgdGhlIG1vZGVsLCBidXQgcGxlYXNlIGltcG9ydCBhIG1vZGVsIHdpdGggdGhpcyBtb2RlbElEIHRvIGVuc3VyZSBub3JtYWwgb3BlcmF0aW9uKVwiXHJcbiAgICAgICAgZWxzZSBjb250ZW50U3RyKz1cIilcIlxyXG4gICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuc2hvdyhcclxuICAgICAgICAgICAgeyB3aWR0aDogXCIzNTBweFwiIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRpdGxlOiBcIldhcm5pbmdcIlxyXG4gICAgICAgICAgICAgICAgLCBjb250ZW50OiBjb250ZW50U3RyXHJcbiAgICAgICAgICAgICAgICAsIGJ1dHRvbnM6IFtcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtcmVkIHczLWhvdmVyLXBpbmtcIiwgdGV4dDogXCJDb25maXJtXCIsIFwiY2xpY2tGdW5jXCI6IGFzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9kZWxldGVNb2RlbFwiLCBcIlBPU1RcIiwgeyBcIm1vZGVsXCI6IG1vZGVsSUQgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgbW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50cmVlLmRlbGV0ZUxlYWZOb2RlKGdsb2JhbENhY2hlLm1vZGVsSURNYXBUb05hbWVbbW9kZWxJRF0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiQURUTW9kZWxzQ2hhbmdlXCJ9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGFuZWxDYXJkLmVtcHR5KClcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL1RPRE86IGNsZWFyIHRoZSB2aXN1YWxpemF0aW9uIHNldHRpbmcgb2YgdGhpcyBkZWxldGVkIG1vZGVsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLypcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZ2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltcImRlZmF1bHRcIl1bbW9kZWxJRF0pIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdW21vZGVsSURdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2F2ZVZpc3VhbERlZmluaXRpb24oKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0qL1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfWNhdGNoKGUpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtZ3JheVwiLCB0ZXh0OiBcIkNhbmNlbFwiLCBcImNsaWNrRnVuY1wiOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKClcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIClcclxuICAgICAgICBcclxuICAgIH0pXHJcbiAgICBcclxuICAgIHZhciBWaXN1YWxpemF0aW9uRE9NPXRoaXMuYWRkQVBhcnRJblJpZ2h0U3BhbihcIlZpc3VhbGl6YXRpb25cIilcclxuICAgIHZhciBlZGl0YWJsZVByb3BlcnRpZXNET009dGhpcy5hZGRBUGFydEluUmlnaHRTcGFuKFwiRWRpdGFibGUgUHJvcGVydGllcyBBbmQgUmVsYXRpb25zaGlwc1wiKVxyXG4gICAgdmFyIGJhc2VDbGFzc2VzRE9NPXRoaXMuYWRkQVBhcnRJblJpZ2h0U3BhbihcIkJhc2UgQ2xhc3Nlc1wiKVxyXG4gICAgdmFyIG9yaWdpbmFsRGVmaW5pdGlvbkRPTT10aGlzLmFkZEFQYXJ0SW5SaWdodFNwYW4oXCJPcmlnaW5hbCBEZWZpbml0aW9uXCIpXHJcblxyXG4gICAgdmFyIHN0cj1KU09OLnN0cmluZ2lmeShKU09OLnBhcnNlKG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXVtcIm9yaWdpbmFsXCJdKSxudWxsLDIpXHJcbiAgICBvcmlnaW5hbERlZmluaXRpb25ET00uYXBwZW5kKCQoJzxwcmUgaWQ9XCJqc29uXCI+JytzdHIrJzwvcHJlPicpKVxyXG5cclxuICAgIHZhciBlZGl0dGFibGVQcm9wZXJ0aWVzPW1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXS5lZGl0YWJsZVByb3BlcnRpZXNcclxuICAgIHRoaXMuZmlsbEVkaXRhYmxlUHJvcGVydGllcyhlZGl0dGFibGVQcm9wZXJ0aWVzLGVkaXRhYmxlUHJvcGVydGllc0RPTSlcclxuICAgIHZhciB2YWxpZFJlbGF0aW9uc2hpcHM9bW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdLnZhbGlkUmVsYXRpb25zaGlwc1xyXG4gICAgdGhpcy5maWxsUmVsYXRpb25zaGlwSW5mbyh2YWxpZFJlbGF0aW9uc2hpcHMsZWRpdGFibGVQcm9wZXJ0aWVzRE9NKVxyXG5cclxuICAgIHRoaXMuZmlsbFZpc3VhbGl6YXRpb24obW9kZWxJRCxWaXN1YWxpemF0aW9uRE9NKVxyXG5cclxuICAgIHRoaXMuZmlsbEJhc2VDbGFzc2VzKG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXS5hbGxCYXNlQ2xhc3NlcyxiYXNlQ2xhc3Nlc0RPTSkgXHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUucmVmcmVzaE1vZGVsVHJlZUxhYmVsPWZ1bmN0aW9uKCl7XHJcbiAgICBpZih0aGlzLnRyZWUuc2VsZWN0ZWROb2Rlcy5sZW5ndGg+MCkgdGhpcy50cmVlLnNlbGVjdGVkTm9kZXNbMF0ucmVkcmF3TGFiZWwoKVxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLmZpbGxCYXNlQ2xhc3Nlcz1mdW5jdGlvbihiYXNlQ2xhc3NlcyxwYXJlbnREb20pe1xyXG4gICAgZm9yKHZhciBpbmQgaW4gYmFzZUNsYXNzZXMpe1xyXG4gICAgICAgIHZhciBrZXlEaXY9ICQoXCI8bGFiZWwgc3R5bGU9J2Rpc3BsYXk6YmxvY2s7cGFkZGluZzouMWVtJz5cIitpbmQrXCI8L2xhYmVsPlwiKVxyXG4gICAgICAgIHBhcmVudERvbS5hcHBlbmQoa2V5RGl2KVxyXG4gICAgfVxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLmZpbGxWaXN1YWxpemF0aW9uPWZ1bmN0aW9uKG1vZGVsSUQscGFyZW50RG9tKXtcclxuICAgIHZhciBtb2RlbEpzb249bW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdO1xyXG4gICAgdmFyIGFUYWJsZT0kKFwiPHRhYmxlIHN0eWxlPSd3aWR0aDoxMDAlJz48L3RhYmxlPlwiKVxyXG4gICAgYVRhYmxlLmh0bWwoJzx0cj48dGQ+PC90ZD48dGQ+PC90ZD48L3RyPicpXHJcbiAgICBwYXJlbnREb20uYXBwZW5kKGFUYWJsZSkgXHJcblxyXG4gICAgdmFyIGxlZnRQYXJ0PWFUYWJsZS5maW5kKFwidGQ6Zmlyc3RcIilcclxuICAgIHZhciByaWdodFBhcnQ9YVRhYmxlLmZpbmQoXCJ0ZDpudGgtY2hpbGQoMilcIilcclxuICAgIHJpZ2h0UGFydC5jc3Moe1wid2lkdGhcIjpcIjUwcHhcIixcImhlaWdodFwiOlwiNTBweFwiLFwiYm9yZGVyXCI6XCJzb2xpZCAxcHggbGlnaHRHcmF5XCJ9KVxyXG4gICAgXHJcbiAgICB2YXIgYXZhcnRhSW1nPSQoXCI8aW1nIHN0eWxlPSdoZWlnaHQ6NDVweCc+PC9pbWc+XCIpXHJcbiAgICByaWdodFBhcnQuYXBwZW5kKGF2YXJ0YUltZylcclxuICAgIHZhciB2aXN1YWxKc29uPWdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdXHJcbiAgICBpZih2aXN1YWxKc29uICYmIHZpc3VhbEpzb25bbW9kZWxJRF0gJiYgdmlzdWFsSnNvblttb2RlbElEXS5hdmFydGEpIGF2YXJ0YUltZy5hdHRyKCdzcmMnLHZpc3VhbEpzb25bbW9kZWxJRF0uYXZhcnRhKVxyXG4gICAgdGhpcy5hdmFydGFJbWc9YXZhcnRhSW1nO1xyXG4gICAgdGhpcy5hZGRPbmVWaXN1YWxpemF0aW9uUm93KG1vZGVsSUQsbGVmdFBhcnQpXHJcblxyXG4gICAgaWYodGhpcy5zaG93UmVsYXRpb25WaXN1YWxpemF0aW9uU2V0dGluZ3Mpe1xyXG4gICAgICAgIGZvcih2YXIgaW5kIGluIG1vZGVsSnNvbi52YWxpZFJlbGF0aW9uc2hpcHMpe1xyXG4gICAgICAgICAgICB0aGlzLmFkZE9uZVZpc3VhbGl6YXRpb25Sb3cobW9kZWxJRCxsZWZ0UGFydCxpbmQpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuYWRkT25lVmlzdWFsaXphdGlvblJvdz1mdW5jdGlvbihtb2RlbElELHBhcmVudERvbSxyZWxhdGluc2hpcE5hbWUpe1xyXG4gICAgaWYocmVsYXRpbnNoaXBOYW1lPT1udWxsKSB2YXIgbmFtZVN0cj1cIuKXr1wiIC8vdmlzdWFsIGZvciBub2RlXHJcbiAgICBlbHNlIG5hbWVTdHI9XCLin5wgXCIrcmVsYXRpbnNoaXBOYW1lXHJcbiAgICB2YXIgY29udGFpbmVyRGl2PSQoXCI8ZGl2IHN0eWxlPSdwYWRkaW5nLWJvdHRvbTo4cHgnPjwvZGl2PlwiKVxyXG4gICAgcGFyZW50RG9tLmFwcGVuZChjb250YWluZXJEaXYpXHJcbiAgICB2YXIgY29udGVudERPTT0kKFwiPGxhYmVsIHN0eWxlPSdtYXJnaW4tcmlnaHQ6MTBweCc+XCIrbmFtZVN0citcIjwvbGFiZWw+XCIpXHJcbiAgICBjb250YWluZXJEaXYuYXBwZW5kKGNvbnRlbnRET00pXHJcblxyXG4gICAgdmFyIGRlZmluZWRDb2xvcj1udWxsXHJcbiAgICB2YXIgZGVmaW5lZFNoYXBlPW51bGxcclxuICAgIHZhciBkZWZpbmVkRGltZW5zaW9uUmF0aW89bnVsbFxyXG4gICAgdmFyIGRlZmluZWRFZGdlV2lkdGg9bnVsbFxyXG4gICAgdmFyIHZpc3VhbEpzb249Z2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltcImRlZmF1bHRcIl1cclxuICAgIGlmKHJlbGF0aW5zaGlwTmFtZT09bnVsbCl7XHJcbiAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXSAmJiB2aXN1YWxKc29uW21vZGVsSURdLmNvbG9yKSBkZWZpbmVkQ29sb3I9dmlzdWFsSnNvblttb2RlbElEXS5jb2xvclxyXG4gICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF0gJiYgdmlzdWFsSnNvblttb2RlbElEXS5zaGFwZSkgZGVmaW5lZFNoYXBlPXZpc3VhbEpzb25bbW9kZWxJRF0uc2hhcGVcclxuICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdICYmIHZpc3VhbEpzb25bbW9kZWxJRF0uZGltZW5zaW9uUmF0aW8pIGRlZmluZWREaW1lbnNpb25SYXRpbz12aXN1YWxKc29uW21vZGVsSURdLmRpbWVuc2lvblJhdGlvXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICBpZiAodmlzdWFsSnNvblttb2RlbElEXSAmJiB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXSAmJiB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdKSB7XHJcbiAgICAgICAgICAgIGlmICh2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdLmNvbG9yKSBkZWZpbmVkQ29sb3IgPSB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdLmNvbG9yXHJcbiAgICAgICAgICAgIGlmICh2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdLnNoYXBlKSBkZWZpbmVkU2hhcGUgPSB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdLnNoYXBlXHJcbiAgICAgICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0uZWRnZVdpZHRoKSBkZWZpbmVkRWRnZVdpZHRoPXZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0uZWRnZVdpZHRoXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHZhciBjb2xvclNlbGVjdG9yPSQoJzxzZWxlY3QgY2xhc3M9XCJ3My1ib3JkZXJcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTt3aWR0aDo3NXB4XCI+PC9zZWxlY3Q+JylcclxuICAgIGNvbnRhaW5lckRpdi5hcHBlbmQoY29sb3JTZWxlY3RvcilcclxuICAgIHZhciBjb2xvckFycj1bXCJkYXJrR3JheVwiLFwiQmxhY2tcIixcIkxpZ2h0R3JheVwiLFwiUmVkXCIsXCJHcmVlblwiLFwiQmx1ZVwiLFwiQmlzcXVlXCIsXCJCcm93blwiLFwiQ29yYWxcIixcIkNyaW1zb25cIixcIkRvZGdlckJsdWVcIixcIkdvbGRcIl1cclxuICAgIGNvbG9yQXJyLmZvckVhY2goKG9uZUNvbG9yQ29kZSk9PntcclxuICAgICAgICB2YXIgYW5PcHRpb249JChcIjxvcHRpb24gdmFsdWU9J1wiK29uZUNvbG9yQ29kZStcIic+XCIrb25lQ29sb3JDb2RlK1wi4panPC9vcHRpb24+XCIpXHJcbiAgICAgICAgY29sb3JTZWxlY3Rvci5hcHBlbmQoYW5PcHRpb24pXHJcbiAgICAgICAgYW5PcHRpb24uY3NzKFwiY29sb3JcIixvbmVDb2xvckNvZGUpXHJcbiAgICB9KVxyXG4gICAgaWYoZGVmaW5lZENvbG9yIT1udWxsKSB7XHJcbiAgICAgICAgY29sb3JTZWxlY3Rvci52YWwoZGVmaW5lZENvbG9yKVxyXG4gICAgICAgIGNvbG9yU2VsZWN0b3IuY3NzKFwiY29sb3JcIixkZWZpbmVkQ29sb3IpXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICBjb2xvclNlbGVjdG9yLmNzcyhcImNvbG9yXCIsXCJkYXJrR3JheVwiKVxyXG4gICAgfVxyXG4gICAgY29sb3JTZWxlY3Rvci5jaGFuZ2UoKGV2ZSk9PntcclxuICAgICAgICB2YXIgc2VsZWN0Q29sb3JDb2RlPWV2ZS50YXJnZXQudmFsdWVcclxuICAgICAgICBjb2xvclNlbGVjdG9yLmNzcyhcImNvbG9yXCIsc2VsZWN0Q29sb3JDb2RlKVxyXG4gICAgICAgIHZhciB2aXN1YWxKc29uPWdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdXHJcblxyXG4gICAgICAgIGlmKCF2aXN1YWxKc29uW21vZGVsSURdKSB2aXN1YWxKc29uW21vZGVsSURdPXt9XHJcbiAgICAgICAgaWYoIXJlbGF0aW5zaGlwTmFtZSkge1xyXG4gICAgICAgICAgICB2aXN1YWxKc29uW21vZGVsSURdLmNvbG9yPXNlbGVjdENvbG9yQ29kZVxyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJ2aXN1YWxEZWZpbml0aW9uQ2hhbmdlXCIsIFwibW9kZWxJRFwiOm1vZGVsSUQsXCJjb2xvclwiOnNlbGVjdENvbG9yQ29kZSB9KVxyXG4gICAgICAgICAgICB0aGlzLnJlZnJlc2hNb2RlbFRyZWVMYWJlbCgpXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIGlmKCF2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXSkgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl09e31cclxuICAgICAgICAgICAgaWYoIXZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0pIHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV09e31cclxuICAgICAgICAgICAgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXS5jb2xvcj1zZWxlY3RDb2xvckNvZGVcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwidmlzdWFsRGVmaW5pdGlvbkNoYW5nZVwiLCBcInNyY01vZGVsSURcIjptb2RlbElELFwicmVsYXRpb25zaGlwTmFtZVwiOnJlbGF0aW5zaGlwTmFtZSxcImNvbG9yXCI6c2VsZWN0Q29sb3JDb2RlIH0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuc2F2ZVZpc3VhbERlZmluaXRpb24oKVxyXG4gICAgfSlcclxuICAgIHZhciBzaGFwZVNlbGVjdG9yID0gJCgnPHNlbGVjdCBjbGFzcz1cInczLWJvcmRlclwiIHN0eWxlPVwib3V0bGluZTpub25lXCI+PC9zZWxlY3Q+JylcclxuICAgIGNvbnRhaW5lckRpdi5hcHBlbmQoc2hhcGVTZWxlY3RvcilcclxuICAgIGlmKHJlbGF0aW5zaGlwTmFtZT09bnVsbCl7XHJcbiAgICAgICAgc2hhcGVTZWxlY3Rvci5hcHBlbmQoJChcIjxvcHRpb24gdmFsdWU9J2VsbGlwc2UnPuKXrzwvb3B0aW9uPlwiKSlcclxuICAgICAgICBzaGFwZVNlbGVjdG9yLmFwcGVuZCgkKFwiPG9wdGlvbiB2YWx1ZT0ncm91bmQtcmVjdGFuZ2xlJyBzdHlsZT0nZm9udC1zaXplOjEyMCUnPuKWojwvb3B0aW9uPlwiKSlcclxuICAgICAgICBzaGFwZVNlbGVjdG9yLmFwcGVuZCgkKFwiPG9wdGlvbiB2YWx1ZT0naGV4YWdvbicgc3R5bGU9J2ZvbnQtc2l6ZToxMzAlJz7irKE8L29wdGlvbj5cIikpXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICBzaGFwZVNlbGVjdG9yLmFwcGVuZCgkKFwiPG9wdGlvbiB2YWx1ZT0nc29saWQnPuKGkjwvb3B0aW9uPlwiKSlcclxuICAgICAgICBzaGFwZVNlbGVjdG9yLmFwcGVuZCgkKFwiPG9wdGlvbiB2YWx1ZT0nZG90dGVkJz7ih6I8L29wdGlvbj5cIikpXHJcbiAgICB9XHJcbiAgICBpZihkZWZpbmVkU2hhcGUhPW51bGwpIHtcclxuICAgICAgICBzaGFwZVNlbGVjdG9yLnZhbChkZWZpbmVkU2hhcGUpXHJcbiAgICB9XHJcbiAgICBzaGFwZVNlbGVjdG9yLmNoYW5nZSgoZXZlKT0+e1xyXG4gICAgICAgIHZhciBzZWxlY3RTaGFwZT1ldmUudGFyZ2V0LnZhbHVlXHJcbiAgICAgICAgdmFyIHZpc3VhbEpzb24gPSBnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW1wiZGVmYXVsdFwiXVxyXG5cclxuICAgICAgICBpZighdmlzdWFsSnNvblttb2RlbElEXSkgdmlzdWFsSnNvblttb2RlbElEXT17fVxyXG4gICAgICAgIGlmKCFyZWxhdGluc2hpcE5hbWUpIHtcclxuICAgICAgICAgICAgdmlzdWFsSnNvblttb2RlbElEXS5zaGFwZT1zZWxlY3RTaGFwZVxyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJ2aXN1YWxEZWZpbml0aW9uQ2hhbmdlXCIsIFwibW9kZWxJRFwiOm1vZGVsSUQsXCJzaGFwZVwiOnNlbGVjdFNoYXBlIH0pXHJcbiAgICAgICAgICAgIHRoaXMucmVmcmVzaE1vZGVsVHJlZUxhYmVsKClcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgaWYoIXZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdKSB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXT17fVxyXG4gICAgICAgICAgICBpZighdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXSkgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXT17fVxyXG4gICAgICAgICAgICB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdLnNoYXBlPXNlbGVjdFNoYXBlXHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIiwgXCJzcmNNb2RlbElEXCI6bW9kZWxJRCxcInJlbGF0aW9uc2hpcE5hbWVcIjpyZWxhdGluc2hpcE5hbWUsXCJzaGFwZVwiOnNlbGVjdFNoYXBlIH0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuc2F2ZVZpc3VhbERlZmluaXRpb24oKVxyXG4gICAgfSlcclxuXHJcbiAgICB2YXIgc2l6ZUFkanVzdFNlbGVjdG9yID0gJCgnPHNlbGVjdCBjbGFzcz1cInczLWJvcmRlclwiIHN0eWxlPVwib3V0bGluZTpub25lO3dpZHRoOjExMHB4XCI+PC9zZWxlY3Q+JylcclxuICAgIGlmKHJlbGF0aW5zaGlwTmFtZT09bnVsbCl7XHJcbiAgICAgICAgZm9yKHZhciBmPTAuMjtmPDI7Zis9MC4yKXtcclxuICAgICAgICAgICAgdmFyIHZhbD1mLnRvRml4ZWQoMSkrXCJcIlxyXG4gICAgICAgICAgICBzaXplQWRqdXN0U2VsZWN0b3IuYXBwZW5kKCQoXCI8b3B0aW9uIHZhbHVlPVwiK3ZhbCtcIj5kaW1lbnNpb24qXCIrdmFsK1wiPC9vcHRpb24+XCIpKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZihkZWZpbmVkRGltZW5zaW9uUmF0aW8hPW51bGwpIHNpemVBZGp1c3RTZWxlY3Rvci52YWwoZGVmaW5lZERpbWVuc2lvblJhdGlvKVxyXG4gICAgICAgIGVsc2Ugc2l6ZUFkanVzdFNlbGVjdG9yLnZhbChcIjEuMFwiKVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgc2l6ZUFkanVzdFNlbGVjdG9yLmNzcyhcIndpZHRoXCIsXCI4MHB4XCIpXHJcbiAgICAgICAgZm9yKHZhciBmPTAuNTtmPD00O2YrPTAuNSl7XHJcbiAgICAgICAgICAgIHZhciB2YWw9Zi50b0ZpeGVkKDEpK1wiXCJcclxuICAgICAgICAgICAgc2l6ZUFkanVzdFNlbGVjdG9yLmFwcGVuZCgkKFwiPG9wdGlvbiB2YWx1ZT1cIit2YWwrXCI+d2lkdGggKlwiK3ZhbCtcIjwvb3B0aW9uPlwiKSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoZGVmaW5lZEVkZ2VXaWR0aCE9bnVsbCkgc2l6ZUFkanVzdFNlbGVjdG9yLnZhbChkZWZpbmVkRWRnZVdpZHRoKVxyXG4gICAgICAgIGVsc2Ugc2l6ZUFkanVzdFNlbGVjdG9yLnZhbChcIjIuMFwiKVxyXG4gICAgfVxyXG4gICAgY29udGFpbmVyRGl2LmFwcGVuZChzaXplQWRqdXN0U2VsZWN0b3IpXHJcblxyXG4gICAgXHJcbiAgICBzaXplQWRqdXN0U2VsZWN0b3IuY2hhbmdlKChldmUpPT57XHJcbiAgICAgICAgdmFyIGNob29zZVZhbD1ldmUudGFyZ2V0LnZhbHVlXHJcbiAgICAgICAgdmFyIHZpc3VhbEpzb24gPSBnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW1wiZGVmYXVsdFwiXVxyXG5cclxuICAgICAgICBpZighcmVsYXRpbnNoaXBOYW1lKSB7XHJcbiAgICAgICAgICAgIGlmKCF2aXN1YWxKc29uW21vZGVsSURdKSB2aXN1YWxKc29uW21vZGVsSURdPXt9XHJcbiAgICAgICAgICAgIHZpc3VhbEpzb25bbW9kZWxJRF0uZGltZW5zaW9uUmF0aW89Y2hvb3NlVmFsXHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIiwgXCJtb2RlbElEXCI6bW9kZWxJRCxcImRpbWVuc2lvblJhdGlvXCI6Y2hvb3NlVmFsIH0pXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIGlmKCF2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXSkgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl09e31cclxuICAgICAgICAgICAgaWYoIXZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0pIHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV09e31cclxuICAgICAgICAgICAgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXS5lZGdlV2lkdGg9Y2hvb3NlVmFsXHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIiwgXCJzcmNNb2RlbElEXCI6bW9kZWxJRCxcInJlbGF0aW9uc2hpcE5hbWVcIjpyZWxhdGluc2hpcE5hbWUsXCJlZGdlV2lkdGhcIjpjaG9vc2VWYWwgfSlcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5zYXZlVmlzdWFsRGVmaW5pdGlvbigpXHJcbiAgICB9KVxyXG4gICAgXHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuc2F2ZVZpc3VhbERlZmluaXRpb249YXN5bmMgZnVuY3Rpb24oKXtcclxuICAgIHRyeXtcclxuICAgICAgICBhd2FpdCBtc2FsSGVscGVyLmNhbGxBUEkoXCJkaWdpdGFsdHdpbi9zYXZlVmlzdWFsRGVmaW5pdGlvblwiLCBcIlBPU1RcIiwge1widmlzdWFsRGVmaW5pdGlvbkpzb25cIjpKU09OLnN0cmluZ2lmeShnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW1wiZGVmYXVsdFwiXSl9KVxyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgaWYoZS5yZXNwb25zZVRleHQpIGFsZXJ0KGUucmVzcG9uc2VUZXh0KVxyXG4gICAgfVxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLmZpbGxSZWxhdGlvbnNoaXBJbmZvPWZ1bmN0aW9uKHZhbGlkUmVsYXRpb25zaGlwcyxwYXJlbnREb20pe1xyXG4gICAgZm9yKHZhciBpbmQgaW4gdmFsaWRSZWxhdGlvbnNoaXBzKXtcclxuICAgICAgICB2YXIga2V5RGl2PSAkKFwiPGxhYmVsIHN0eWxlPSdkaXNwbGF5OmlubGluZTtwYWRkaW5nOi4xZW0gLjNlbSAuMWVtIC4zZW07bWFyZ2luLXJpZ2h0Oi4zZW0nPlwiK2luZCtcIjwvbGFiZWw+XCIpXHJcbiAgICAgICAgcGFyZW50RG9tLmFwcGVuZChrZXlEaXYpXHJcbiAgICAgICAga2V5RGl2LmNzcyhcInBhZGRpbmctdG9wXCIsXCIuMWVtXCIpXHJcbiAgICAgICAgdmFyIGxhYmVsPSQoXCI8bGFiZWwgY2xhc3M9J3czLWxpbWUnIHN0eWxlPSdkaXNwbGF5OmlubGluZTtmb250LXNpemU6OXB4O3BhZGRpbmc6MnB4Jz48L2xhYmVsPlwiKVxyXG4gICAgICAgIGxhYmVsLnRleHQoXCJSZWxhdGlvbnNoaXBcIilcclxuICAgICAgICBwYXJlbnREb20uYXBwZW5kKGxhYmVsKVxyXG4gICAgICAgIGlmKHZhbGlkUmVsYXRpb25zaGlwc1tpbmRdLnRhcmdldCl7XHJcbiAgICAgICAgICAgIHZhciBsYWJlbDE9JChcIjxsYWJlbCBjbGFzcz0ndzMtbGltZScgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO2ZvbnQtc2l6ZTo5cHg7cGFkZGluZzoycHg7bWFyZ2luLWxlZnQ6MnB4Jz48L2xhYmVsPlwiKVxyXG4gICAgICAgICAgICBsYWJlbDEudGV4dCh2YWxpZFJlbGF0aW9uc2hpcHNbaW5kXS50YXJnZXQpXHJcbiAgICAgICAgICAgIHBhcmVudERvbS5hcHBlbmQobGFiZWwxKVxyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgY29udGVudERPTT0kKFwiPGxhYmVsPjwvbGFiZWw+XCIpXHJcbiAgICAgICAgY29udGVudERPTS5jc3MoXCJkaXNwbGF5XCIsXCJibG9ja1wiKVxyXG4gICAgICAgIGNvbnRlbnRET00uY3NzKFwicGFkZGluZy1sZWZ0XCIsXCIxZW1cIilcclxuICAgICAgICBwYXJlbnREb20uYXBwZW5kKGNvbnRlbnRET00pXHJcbiAgICAgICAgdGhpcy5maWxsRWRpdGFibGVQcm9wZXJ0aWVzKHZhbGlkUmVsYXRpb25zaGlwc1tpbmRdLmVkaXRhYmxlUmVsYXRpb25zaGlwUHJvcGVydGllcywgY29udGVudERPTSlcclxuICAgIH1cclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5maWxsRWRpdGFibGVQcm9wZXJ0aWVzPWZ1bmN0aW9uKGpzb25JbmZvLHBhcmVudERvbSl7XHJcbiAgICBmb3IodmFyIGluZCBpbiBqc29uSW5mbyl7XHJcbiAgICAgICAgdmFyIGtleURpdj0gJChcIjxsYWJlbCBzdHlsZT0nZGlzcGxheTpibG9jayc+PGRpdiBzdHlsZT0nZGlzcGxheTppbmxpbmU7cGFkZGluZzouMWVtIC4zZW0gLjFlbSAuM2VtO21hcmdpbi1yaWdodDouM2VtJz5cIitpbmQrXCI8L2Rpdj48L2xhYmVsPlwiKVxyXG4gICAgICAgIHBhcmVudERvbS5hcHBlbmQoa2V5RGl2KVxyXG4gICAgICAgIGtleURpdi5jc3MoXCJwYWRkaW5nLXRvcFwiLFwiLjFlbVwiKVxyXG5cclxuICAgICAgICBpZihBcnJheS5pc0FycmF5KGpzb25JbmZvW2luZF0pKXtcclxuICAgICAgICAgICAgdmFyIGNvbnRlbnRET009JChcIjxsYWJlbCBjbGFzcz0ndzMtZGFyay1ncmF5JyA+PC9sYWJlbD5cIilcclxuICAgICAgICAgICAgY29udGVudERPTS50ZXh0KFwiZW51bVwiKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLmNzcyh7XCJmb250U2l6ZVwiOlwiOXB4XCIsXCJwYWRkaW5nXCI6JzJweCd9KVxyXG4gICAgICAgICAgICBrZXlEaXYuYXBwZW5kKGNvbnRlbnRET00pXHJcblxyXG4gICAgICAgICAgICB2YXIgdmFsdWVBcnI9W11cclxuICAgICAgICAgICAganNvbkluZm9baW5kXS5mb3JFYWNoKGVsZT0+e3ZhbHVlQXJyLnB1c2goZWxlLmVudW1WYWx1ZSl9KVxyXG4gICAgICAgICAgICB2YXIgbGFiZWwxPSQoXCI8bGFiZWwgY2xhc3M9J3czLWRhcmstZ3JheScgPjwvbGFiZWw+XCIpXHJcbiAgICAgICAgICAgIGxhYmVsMS5jc3Moe1wiZm9udFNpemVcIjpcIjlweFwiLFwicGFkZGluZ1wiOicycHgnLFwibWFyZ2luLWxlZnRcIjpcIjJweFwifSlcclxuICAgICAgICAgICAgbGFiZWwxLnRleHQodmFsdWVBcnIuam9pbigpKVxyXG4gICAgICAgICAgICBrZXlEaXYuYXBwZW5kKGxhYmVsMSlcclxuICAgICAgICB9ZWxzZSBpZih0eXBlb2YoanNvbkluZm9baW5kXSk9PT1cIm9iamVjdFwiKSB7XHJcbiAgICAgICAgICAgIHZhciBjb250ZW50RE9NPSQoXCI8bGFiZWw+PC9sYWJlbD5cIilcclxuICAgICAgICAgICAgY29udGVudERPTS5jc3MoXCJkaXNwbGF5XCIsXCJibG9ja1wiKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLmNzcyhcInBhZGRpbmctbGVmdFwiLFwiMWVtXCIpXHJcbiAgICAgICAgICAgIHRoaXMuZmlsbEVkaXRhYmxlUHJvcGVydGllcyhqc29uSW5mb1tpbmRdLGNvbnRlbnRET00pXHJcbiAgICAgICAgICAgIGtleURpdi5hcHBlbmQoY29udGVudERPTSlcclxuICAgICAgICB9ZWxzZSB7XHJcbiAgICAgICAgICAgIHZhciBjb250ZW50RE9NPSQoXCI8bGFiZWwgY2xhc3M9J3czLWRhcmstZ3JheScgPjwvbGFiZWw+XCIpXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00udGV4dChqc29uSW5mb1tpbmRdKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLmNzcyh7XCJmb250U2l6ZVwiOlwiOXB4XCIsXCJwYWRkaW5nXCI6JzJweCd9KVxyXG4gICAgICAgICAgICBrZXlEaXYuYXBwZW5kKGNvbnRlbnRET00pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5hZGRBUGFydEluUmlnaHRTcGFuPWZ1bmN0aW9uKHBhcnROYW1lKXtcclxuICAgIHZhciBoZWFkZXJET009JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ibG9jayB3My1saWdodC1ncmV5IHczLWxlZnQtYWxpZ25cIiBzdHlsZT1cImZvbnQtd2VpZ2h0OmJvbGRcIj48L2J1dHRvbj4nKVxyXG4gICAgaGVhZGVyRE9NLnRleHQocGFydE5hbWUpXHJcbiAgICB2YXIgbGlzdERPTT0kKCc8ZGl2IGNsYXNzPVwidzMtY29udGFpbmVyIHczLWhpZGUgdzMtYm9yZGVyIHczLXNob3dcIiBzdHlsZT1cImJhY2tncm91bmQtY29sb3I6d2hpdGVcIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5wYW5lbENhcmQuYXBwZW5kKGhlYWRlckRPTSxsaXN0RE9NKVxyXG5cclxuICAgIGhlYWRlckRPTS5vbihcImNsaWNrXCIsKGV2dCk9PiB7XHJcbiAgICAgICAgaWYobGlzdERPTS5oYXNDbGFzcyhcInczLXNob3dcIikpIGxpc3RET00ucmVtb3ZlQ2xhc3MoXCJ3My1zaG93XCIpXHJcbiAgICAgICAgZWxzZSBsaXN0RE9NLmFkZENsYXNzKFwidzMtc2hvd1wiKVxyXG4gXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHJldHVybiBsaXN0RE9NO1xyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLnJlYWRNb2RlbEZpbGVzQ29udGVudEFuZEltcG9ydD1hc3luYyBmdW5jdGlvbihmaWxlcyl7XHJcbiAgICAvLyBmaWxlcyBpcyBhIEZpbGVMaXN0IG9mIEZpbGUgb2JqZWN0cy4gTGlzdCBzb21lIHByb3BlcnRpZXMuXHJcbiAgICB2YXIgZmlsZUNvbnRlbnRBcnI9W11cclxuICAgIGZvciAodmFyIGkgPSAwLCBmOyBmID0gZmlsZXNbaV07IGkrKykge1xyXG4gICAgICAgIC8vIE9ubHkgcHJvY2VzcyBqc29uIGZpbGVzLlxyXG4gICAgICAgIGlmIChmLnR5cGUhPVwiYXBwbGljYXRpb24vanNvblwiKSBjb250aW51ZTtcclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgIHZhciBzdHI9IGF3YWl0IHRoaXMucmVhZE9uZUZpbGUoZilcclxuICAgICAgICAgICAgdmFyIG9iaj1KU09OLnBhcnNlKHN0cilcclxuICAgICAgICAgICAgaWYoQXJyYXkuaXNBcnJheShvYmopKSBmaWxlQ29udGVudEFycj1maWxlQ29udGVudEFyci5jb25jYXQob2JqKVxyXG4gICAgICAgICAgICBlbHNlIGZpbGVDb250ZW50QXJyLnB1c2gob2JqKVxyXG4gICAgICAgIH1jYXRjaChlcnIpe1xyXG4gICAgICAgICAgICBhbGVydChlcnIpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYoZmlsZUNvbnRlbnRBcnIubGVuZ3RoPT0wKSByZXR1cm47XHJcbiAgICB0cnkge1xyXG4gICAgICAgIHZhciByZXNwb25zZSA9IGF3YWl0IG1zYWxIZWxwZXIuY2FsbEFQSShcImRpZ2l0YWx0d2luL2ltcG9ydE1vZGVsc1wiLCBcIlBPU1RcIiwge1wibW9kZWxzXCI6SlNPTi5zdHJpbmdpZnkoZmlsZUNvbnRlbnRBcnIpfSlcclxuICAgICAgICB0aGlzLmxpc3RNb2RlbHMoXCJzaG91bGRCcm9hZENhc3RcIilcclxuICAgIH1jYXRjaChlKXtcclxuICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgIGlmKGUucmVzcG9uc2VUZXh0KSBhbGVydChlLnJlc3BvbnNlVGV4dClcclxuICAgIH0gIFxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLnJlYWRPbmVGaWxlPSBhc3luYyBmdW5jdGlvbihhRmlsZSl7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XHJcbiAgICAgICAgICAgIHJlYWRlci5vbmxvYWQgPSAoKT0+IHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUocmVhZGVyLnJlc3VsdClcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgcmVhZGVyLnJlYWRBc1RleHQoYUZpbGUpO1xyXG4gICAgICAgIH1jYXRjaChlKXtcclxuICAgICAgICAgICAgcmVqZWN0KGUpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufVxyXG5cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUubGlzdE1vZGVscz1hc3luYyBmdW5jdGlvbihzaG91bGRCcm9hZGNhc3Qpe1xyXG4gICAgdGhpcy5tb2RlbExpc3QuZW1wdHkoKVxyXG4gICAgYXdhaXQgZ2xvYmFsQ2FjaGUubG9hZFVzZXJEYXRhKClcclxuXHJcbiAgICBpZihqUXVlcnkuaXNFbXB0eU9iamVjdChtb2RlbEFuYWx5emVyLkRURExNb2RlbHMpKXtcclxuICAgICAgICB2YXIgemVyb01vZGVsSXRlbT0kKCc8bGkgc3R5bGU9XCJmb250LXNpemU6MC45ZW1cIj56ZXJvIG1vZGVsIHJlY29yZC4gUGxlYXNlIGltcG9ydC4uLjwvbGk+JylcclxuICAgICAgICB0aGlzLm1vZGVsTGlzdC5hcHBlbmQoemVyb01vZGVsSXRlbSlcclxuICAgICAgICB6ZXJvTW9kZWxJdGVtLmNzcyhcImN1cnNvclwiLFwiZGVmYXVsdFwiKVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgdGhpcy50cmVlID0gbmV3IHNpbXBsZVRyZWUodGhpcy5tb2RlbExpc3QsIHtcclxuICAgICAgICAgICAgXCJsZWFmTmFtZVByb3BlcnR5XCI6IFwiZGlzcGxheU5hbWVcIlxyXG4gICAgICAgICAgICAsIFwibm9NdWx0aXBsZVNlbGVjdEFsbG93ZWRcIjogdHJ1ZSwgXCJoaWRlRW1wdHlHcm91cFwiOiB0cnVlXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgdGhpcy50cmVlLm9wdGlvbnMubGVhZk5vZGVJY29uRnVuYyA9IChsbikgPT4ge1xyXG4gICAgICAgICAgICB2YXIgbW9kZWxDbGFzcyA9IGxuLmxlYWZJbmZvW1wiQGlkXCJdXHJcbiAgICAgICAgICAgIHZhciBjb2xvckNvZGUgPSBcImRhcmtHcmF5XCJcclxuICAgICAgICAgICAgdmFyIHNoYXBlID0gXCJlbGxpcHNlXCJcclxuICAgICAgICAgICAgdmFyIGF2YXJ0YSA9IG51bGxcclxuICAgICAgICAgICAgdmFyIGRpbWVuc2lvbj0yMDtcclxuICAgICAgICAgICAgaWYgKGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdW21vZGVsQ2xhc3NdKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgdmlzdWFsSnNvbiA9IGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bXCJkZWZhdWx0XCJdW21vZGVsQ2xhc3NdXHJcbiAgICAgICAgICAgICAgICB2YXIgY29sb3JDb2RlID0gdmlzdWFsSnNvbi5jb2xvciB8fCBcImRhcmtHcmF5XCJcclxuICAgICAgICAgICAgICAgIHZhciBzaGFwZSA9IHZpc3VhbEpzb24uc2hhcGUgfHwgXCJlbGxpcHNlXCJcclxuICAgICAgICAgICAgICAgIHZhciBhdmFydGEgPSB2aXN1YWxKc29uLmF2YXJ0YVxyXG4gICAgICAgICAgICAgICAgaWYodmlzdWFsSnNvbi5kaW1lbnNpb25SYXRpbykgZGltZW5zaW9uKj1wYXJzZUZsb2F0KHZpc3VhbEpzb24uZGltZW5zaW9uUmF0aW8pXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBpY29uRE9NPSQoXCI8ZGl2IHN0eWxlPSd3aWR0aDpcIitkaW1lbnNpb24rXCJweDtoZWlnaHQ6XCIrZGltZW5zaW9uK1wicHg7ZmxvYXQ6bGVmdDtwb3NpdGlvbjpyZWxhdGl2ZSc+PC9kaXY+XCIpXHJcbiAgICAgICAgICAgIHZhciBpbWdTcmM9ZW5jb2RlVVJJQ29tcG9uZW50KHRoaXMuc2hhcGVTdmcoc2hhcGUsY29sb3JDb2RlKSlcclxuICAgICAgICAgICAgaWNvbkRPTS5hcHBlbmQoJChcIjxpbWcgc3JjPSdkYXRhOmltYWdlL3N2Zyt4bWw7dXRmOCxcIitpbWdTcmMrXCInPjwvaW1nPlwiKSlcclxuICAgICAgICAgICAgaWYoYXZhcnRhKXtcclxuICAgICAgICAgICAgICAgIHZhciBhdmFydGFpbWc9JChcIjxpbWcgc3R5bGU9J3Bvc2l0aW9uOmFic29sdXRlO2xlZnQ6MHB4O3dpZHRoOjYwJTttYXJnaW46MjAlJyBzcmM9J1wiK2F2YXJ0YStcIic+PC9pbWc+XCIpXHJcbiAgICAgICAgICAgICAgICBpY29uRE9NLmFwcGVuZChhdmFydGFpbWcpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIGljb25ET01cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMudHJlZS5jYWxsYmFja19hZnRlclNlbGVjdE5vZGVzID0gKG5vZGVzQXJyLCBtb3VzZUNsaWNrRGV0YWlsKSA9PiB7XHJcbiAgICAgICAgICAgIHZhciB0aGVOb2RlID0gbm9kZXNBcnJbMF1cclxuICAgICAgICAgICAgdGhpcy5maWxsUmlnaHRTcGFuKHRoZU5vZGUubGVhZkluZm9bXCJAaWRcIl0pXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgZ3JvdXBOYW1lTGlzdCA9IHt9XHJcbiAgICAgICAgZm9yICh2YXIgbW9kZWxJRCBpbiBtb2RlbEFuYWx5emVyLkRURExNb2RlbHMpIGdyb3VwTmFtZUxpc3RbdGhpcy5tb2RlbE5hbWVUb0dyb3VwTmFtZShtb2RlbElEKV0gPSAxXHJcbiAgICAgICAgdmFyIG1vZGVsZ3JvdXBTb3J0QXJyID0gT2JqZWN0LmtleXMoZ3JvdXBOYW1lTGlzdClcclxuICAgICAgICBtb2RlbGdyb3VwU29ydEFyci5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhLnRvTG93ZXJDYXNlKCkubG9jYWxlQ29tcGFyZShiLnRvTG93ZXJDYXNlKCkpIH0pO1xyXG4gICAgICAgIG1vZGVsZ3JvdXBTb3J0QXJyLmZvckVhY2gob25lR3JvdXBOYW1lID0+IHtcclxuICAgICAgICAgICAgdmFyIGduPXRoaXMudHJlZS5hZGRHcm91cE5vZGUoeyBkaXNwbGF5TmFtZTogb25lR3JvdXBOYW1lIH0pXHJcbiAgICAgICAgICAgIGduLmV4cGFuZCgpXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgZm9yICh2YXIgbW9kZWxJRCBpbiBtb2RlbEFuYWx5emVyLkRURExNb2RlbHMpIHtcclxuICAgICAgICAgICAgdmFyIGduID0gdGhpcy5tb2RlbE5hbWVUb0dyb3VwTmFtZShtb2RlbElEKVxyXG4gICAgICAgICAgICB0aGlzLnRyZWUuYWRkTGVhZm5vZGVUb0dyb3VwKGduLCBKU09OLnBhcnNlKG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXVtcIm9yaWdpbmFsXCJdKSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMudHJlZS5zb3J0QWxsTGVhdmVzKClcclxuICAgIH1cclxuICAgIFxyXG4gICAgaWYoc2hvdWxkQnJvYWRjYXN0KSB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJBRFRNb2RlbHNDaGFuZ2VcIn0pXHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuc2hhcGVTdmc9ZnVuY3Rpb24oc2hhcGUsY29sb3Ipe1xyXG4gICAgaWYoc2hhcGU9PVwiZWxsaXBzZVwiKXtcclxuICAgICAgICByZXR1cm4gJzxzdmcgeG1sbnM6c3ZnPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAxMDAgMTAwXCIgZmlsbD1cIm5vbmVcIiB2ZXJzaW9uPVwiMS4xXCIgPjxjaXJjbGUgY3g9XCI1MFwiIGN5PVwiNTBcIiByPVwiNTBcIiAgZmlsbD1cIicrY29sb3IrJ1wiLz48L3N2Zz4nXHJcbiAgICB9ZWxzZSBpZihzaGFwZT09XCJoZXhhZ29uXCIpe1xyXG4gICAgICAgIHJldHVybiAnPHN2ZyB4bWxuczpzdmc9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDEwMCAxMDBcIiBmaWxsPVwibm9uZVwiIHZlcnNpb249XCIxLjFcIiA+PHBvbHlnb24gcG9pbnRzPVwiNTAgMCwgOTMuMyAyNSwgOTMuMyA3NSwgNTAgMTAwLCA2LjcgNzUsIDYuNyAyNVwiICBmaWxsPVwiJytjb2xvcisnXCIgLz48L3N2Zz4nXHJcbiAgICB9ZWxzZSBpZihzaGFwZT09XCJyb3VuZC1yZWN0YW5nbGVcIil7XHJcbiAgICAgICAgcmV0dXJuICc8c3ZnIHhtbG5zOnN2Zz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHZpZXdCb3g9XCIwIDAgMTAwIDEwMFwiIGZpbGw9XCJub25lXCIgdmVyc2lvbj1cIjEuMVwiID48cmVjdCB4PVwiMTBcIiB5PVwiMTBcIiByeD1cIjEwXCIgcnk9XCIxMFwiIHdpZHRoPVwiODBcIiBoZWlnaHQ9XCI4MFwiIGZpbGw9XCInK2NvbG9yKydcIiAvPjwvc3ZnPidcclxuICAgIH1cclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5tb2RlbE5hbWVUb0dyb3VwTmFtZT1mdW5jdGlvbihtb2RlbE5hbWUpe1xyXG4gICAgdmFyIG5hbWVQYXJ0cz1tb2RlbE5hbWUuc3BsaXQoXCI6XCIpXHJcbiAgICBpZihuYW1lUGFydHMubGVuZ3RoPj0yKSAgcmV0dXJuIG5hbWVQYXJ0c1sxXVxyXG4gICAgZWxzZSByZXR1cm4gXCJPdGhlcnNcIlxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLnJ4TWVzc2FnZT1mdW5jdGlvbihtc2dQYXlsb2FkKXtcclxuICAgIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJBRFRNb2RlbEVkaXRlZFwiKSB0aGlzLmxpc3RNb2RlbHMoXCJzaG91bGRCcm9hZGNhc3RcIilcclxufVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IG1vZGVsTWFuYWdlckRpYWxvZygpOyIsImZ1bmN0aW9uIG1vZHVsZVN3aXRjaERpYWxvZygpe1xyXG4gICAgdGhpcy5tb2R1bGVzU2lkZWJhcj0kKCc8ZGl2IGNsYXNzPVwidzMtc2lkZWJhciB3My1iYXItYmxvY2sgdzMtd2hpdGUgdzMtYW5pbWF0ZS1sZWZ0IHczLWNhcmQtNFwiIHN0eWxlPVwiZGlzcGxheTpub25lO2hlaWdodDoxNjBweDt3aWR0aDoyNDBweDtvdmVyZmxvdzpoaWRkZW5cIj48ZGl2IHN0eWxlPVwiaGVpZ2h0OjQwcHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWxlZnQgdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cImZvbnQtc2l6ZToyZW07cGFkZGluZy10b3A6NHB4O3dpZHRoOjU1cHhcIj7imLA8L2J1dHRvbj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cImZvbnQtc2l6ZToxLjVlbTt3aWR0aDo3MHB4O2Zsb2F0OmxlZnQ7Y3Vyc29yOmRlZmF1bHRcIj5PcGVuPC9kaXY+PC9kaXY+PGEgaHJlZj1cIiNcIiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1tZWRpdW1cIj48aW1nIHNyYz1cImZhdmljb25pb3RodWIuaWNvXCIgc3R5bGU9XCJ3aWR0aDoyNXB4O21hcmdpbi1yaWdodDoxMHB4XCI+PC9pbWc+RGV2aWNlIE1hbmFnZW1lbnQ8L2E+PGEgaHJlZj1cIiNcIiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1tZWRpdW1cIj48aW1nIHNyYz1cImZhdmljb25kaWdpdGFsdHdpbi5pY29cIiBzdHlsZT1cIndpZHRoOjI1cHg7bWFyZ2luLXJpZ2h0OjEwcHhcIj48L2ltZz5EaWdpdGFsIFR3aW48L2E+PGEgaHJlZj1cIiNcIiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1tZWRpdW1cIj48aW1nIHNyYz1cImZhdmljb25ldmVudGxvZy5pY29cIiBzdHlsZT1cIndpZHRoOjI1cHg7bWFyZ2luLXJpZ2h0OjEwcHhcIj48L2ltZz5FdmVudCBMb2c8L2E+PC9kaXY+JylcclxuICAgIFxyXG4gICAgdGhpcy5tb2R1bGVzU3dpdGNoQnV0dG9uPSQoJzxhIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uXCIgaHJlZj1cIiNcIj7imLA8L2E+JylcclxuICAgIFxyXG4gICAgdGhpcy5tb2R1bGVzU3dpdGNoQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+eyB0aGlzLm1vZHVsZXNTaWRlYmFyLmNzcyhcImRpc3BsYXlcIixcImJsb2NrXCIpIH0pXHJcbiAgICB0aGlzLm1vZHVsZXNTaWRlYmFyLmNoaWxkcmVuKCc6Zmlyc3QnKS5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLm1vZHVsZXNTaWRlYmFyLmNzcyhcImRpc3BsYXlcIixcIm5vbmVcIil9KVxyXG4gICAgXHJcbiAgICB2YXIgYWxsTW9kZXVscz10aGlzLm1vZHVsZXNTaWRlYmFyLmNoaWxkcmVuKFwiYVwiKVxyXG4gICAgJChhbGxNb2RldWxzWzBdKS5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICB3aW5kb3cub3BlbihcImRldmljZW1hbmFnZW1lbnQuaHRtbFwiLCBcIl9ibGFua1wiKVxyXG4gICAgICAgIHRoaXMubW9kdWxlc1NpZGViYXIuY3NzKFwiZGlzcGxheVwiLFwibm9uZVwiKVxyXG4gICAgfSlcclxuICAgICQoYWxsTW9kZXVsc1sxXSkub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgd2luZG93Lm9wZW4oXCJkaWdpdGFsdHdpbm1vZHVsZS5odG1sXCIsIFwiX2JsYW5rXCIpXHJcbiAgICAgICAgdGhpcy5tb2R1bGVzU2lkZWJhci5jc3MoXCJkaXNwbGF5XCIsXCJub25lXCIpXHJcbiAgICB9KVxyXG4gICAgJChhbGxNb2RldWxzWzJdKS5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICB3aW5kb3cub3BlbihcImV2ZW50bG9nbW9kdWxlLmh0bWxcIiwgXCJfYmxhbmtcIilcclxuICAgICAgICB0aGlzLm1vZHVsZXNTaWRlYmFyLmNzcyhcImRpc3BsYXlcIixcIm5vbmVcIilcclxuICAgIH0pXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IG1vZHVsZVN3aXRjaERpYWxvZygpOyIsImZ1bmN0aW9uIHNpbXBsZUNvbmZpcm1EaWFsb2coKXtcclxuICAgIHRoaXMuRE9NID0gJCgnPGRpdiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7YmFja2dyb3VuZC1jb2xvcjp3aGl0ZTtsZWZ0OjUwJTt0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSkgdHJhbnNsYXRlWSgtNTAlKTt6LWluZGV4OjEwMlwiIGNsYXNzPVwidzMtY2FyZC00XCI+PC9kaXY+JylcclxuICAgIC8vdGhpcy5ET00uY3NzKFwib3ZlcmZsb3dcIixcImhpZGRlblwiKVxyXG59XHJcblxyXG5zaW1wbGVDb25maXJtRGlhbG9nLnByb3RvdHlwZS5zaG93PWZ1bmN0aW9uKGNzc09wdGlvbnMsb3RoZXJPcHRpb25zKXtcclxuICAgIHRoaXMuRE9NLmNzcyhjc3NPcHRpb25zKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6NDBweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiZm9udC1zaXplOjEuMmVtXCI+JyArIG90aGVyT3B0aW9ucy50aXRsZSArICc8L2Rpdj48L2Rpdj4nKSlcclxuICAgIHZhciBjbG9zZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmlnaHRcIiBzdHlsZT1cImZvbnQtc2l6ZToyZW07cGFkZGluZy10b3A6NHB4XCI+w5c8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5ET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZChjbG9zZUJ1dHRvbilcclxuICAgIGNsb3NlQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLmNsb3NlKCkgfSlcclxuXHJcbiAgICB2YXIgZGlhbG9nRGl2PSQoJzxkaXYgY2xhc3M9XCJ3My1jb250YWluZXJcIiBzdHlsZT1cIm1hcmdpbi10b3A6MTBweDttYXJnaW4tYm90dG9tOjEwcHhcIj48L2Rpdj4nKVxyXG4gICAgZGlhbG9nRGl2LnRleHQob3RoZXJPcHRpb25zLmNvbnRlbnQpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQoZGlhbG9nRGl2KVxyXG4gICAgdGhpcy5kaWFsb2dEaXY9ZGlhbG9nRGl2XHJcblxyXG4gICAgdGhpcy5ib3R0b21CYXI9JCgnPGRpdiBjbGFzcz1cInczLWJhclwiPjwvZGl2PicpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQodGhpcy5ib3R0b21CYXIpXHJcblxyXG4gICAgb3RoZXJPcHRpb25zLmJ1dHRvbnMuZm9yRWFjaChidG49PntcclxuICAgICAgICB2YXIgYUJ1dHRvbj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLXJpZ2h0ICcrKGJ0bi5jb2xvckNsYXNzfHxcIlwiKSsnXCIgc3R5bGU9XCJtYXJnaW4tcmlnaHQ6MnB4O21hcmdpbi1sZWZ0OjJweFwiPicrYnRuLnRleHQrJzwvYnV0dG9uPicpXHJcbiAgICAgICAgYUJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PiB7IGJ0bi5jbGlja0Z1bmMoKSAgfSAgKVxyXG4gICAgICAgIHRoaXMuYm90dG9tQmFyLmFwcGVuZChhQnV0dG9uKSAgICBcclxuICAgIH0pXHJcbiAgICAkKFwiYm9keVwiKS5hcHBlbmQodGhpcy5ET00pXHJcbn1cclxuXHJcbnNpbXBsZUNvbmZpcm1EaWFsb2cucHJvdG90eXBlLmNsb3NlPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLkRPTS5yZW1vdmUoKVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHNpbXBsZUNvbmZpcm1EaWFsb2c7IiwiZnVuY3Rpb24gc2ltcGxlU2VsZWN0TWVudShidXR0b25OYW1lLG9wdGlvbnMpe1xyXG4gICAgb3B0aW9ucz1vcHRpb25zfHx7fSAvL3tpc0NsaWNrYWJsZToxLHdpdGhCb3JkZXI6MSxmb250U2l6ZTpcIlwiLGNvbG9yQ2xhc3M6XCJcIixidXR0b25DU1M6XCJcIn1cclxuICAgIGlmKG9wdGlvbnMuaXNDbGlja2FibGUpe1xyXG4gICAgICAgIHRoaXMuaXNDbGlja2FibGU9dHJ1ZVxyXG4gICAgICAgIHRoaXMuRE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1kcm9wZG93bi1jbGlja1wiPjwvZGl2PicpXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB0aGlzLkRPTT0kKCc8ZGl2IGNsYXNzPVwidzMtZHJvcGRvd24taG92ZXIgXCI+PC9kaXY+JylcclxuICAgICAgICB0aGlzLkRPTS5vbihcIm1vdXNlb3ZlclwiLChlKT0+e1xyXG4gICAgICAgICAgICB0aGlzLmFkanVzdERyb3BEb3duUG9zaXRpb24oKVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcblxyXG5cclxuICAgIC8vaXQgc2VlbXMgdGhhdCB0aGUgc2VsZWN0IG1lbnUgb25seSBjYW4gc2hvdyBvdXRzaWRlIG9mIGEgcGFyZW50IHNjcm9sbGFibGUgZG9tIHdoZW4gaXQgaXMgaW5zaWRlIGEgdzMtYmFyIGl0ZW0uLi4gbm90IHZlcnkgc3VyZSBhYm91dCB3aHkgXHJcbiAgICB2YXIgcm93RE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXJcIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5yb3dET009cm93RE9NXHJcbiAgICB0aGlzLnJvd0RPTS5hcHBlbmQodGhpcy5ET00pXHJcbiAgICBcclxuICAgIHRoaXMuYnV0dG9uPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b25cIiBzdHlsZT1cIm91dGxpbmU6IG5vbmU7XCI+PGE+JytidXR0b25OYW1lKyc8L2E+PGEgc3R5bGU9XCJmb250LXdlaWdodDpib2xkO3BhZGRpbmctbGVmdDoycHhcIj48L2E+PGkgY2xhc3M9XCJmYSBmYS1jYXJldC1kb3duXCIgc3R5bGU9XCJwYWRkaW5nLWxlZnQ6M3B4XCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICBpZihvcHRpb25zLndpdGhCb3JkZXIpIHRoaXMuYnV0dG9uLmFkZENsYXNzKFwidzMtYm9yZGVyXCIpXHJcbiAgICBpZihvcHRpb25zLmZvbnRTaXplKSB0aGlzLkRPTS5jc3MoXCJmb250LXNpemVcIixvcHRpb25zLmZvbnRTaXplKVxyXG4gICAgaWYob3B0aW9ucy5jb2xvckNsYXNzKSB0aGlzLmJ1dHRvbi5hZGRDbGFzcyhvcHRpb25zLmNvbG9yQ2xhc3MpXHJcbiAgICBpZihvcHRpb25zLndpZHRoKSB0aGlzLmJ1dHRvbi5jc3MoXCJ3aWR0aFwiLG9wdGlvbnMud2lkdGgpXHJcbiAgICBpZihvcHRpb25zLmJ1dHRvbkNTUykgdGhpcy5idXR0b24uY3NzKG9wdGlvbnMuYnV0dG9uQ1NTKVxyXG4gICAgaWYob3B0aW9ucy5hZGp1c3RQb3NpdGlvbkFuY2hvcikgdGhpcy5hZGp1c3RQb3NpdGlvbkFuY2hvcj1vcHRpb25zLmFkanVzdFBvc2l0aW9uQW5jaG9yXHJcblxyXG4gICAgdGhpcy5vcHRpb25Db250ZW50RE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1kcm9wZG93bi1jb250ZW50IHczLWJhci1ibG9jayB3My1jYXJkLTRcIj48L2Rpdj4nKVxyXG4gICAgaWYob3B0aW9ucy5vcHRpb25MaXN0SGVpZ2h0KSB0aGlzLm9wdGlvbkNvbnRlbnRET00uY3NzKHtoZWlnaHQ6b3B0aW9ucy5vcHRpb25MaXN0SGVpZ2h0K1wicHhcIixcIm92ZXJmbG93LXlcIjpcImF1dG9cIixcIm92ZXJmbG93LXhcIjpcInZpc2libGVcIn0pXHJcbiAgICBpZihvcHRpb25zLm9wdGlvbkxpc3RNYXJnaW5Ub3ApIHRoaXMub3B0aW9uQ29udGVudERPTS5jc3Moe1wibWFyZ2luLXRvcFwiOm9wdGlvbnMub3B0aW9uTGlzdE1hcmdpblRvcCtcInB4XCJ9KVxyXG4gICAgaWYob3B0aW9ucy5vcHRpb25MaXN0TWFyZ2luTGVmdCkgdGhpcy5vcHRpb25Db250ZW50RE9NLmNzcyh7XCJtYXJnaW4tbGVmdFwiOm9wdGlvbnMub3B0aW9uTGlzdE1hcmdpbkxlZnQrXCJweFwifSlcclxuICAgIFxyXG4gICAgdGhpcy5ET00uYXBwZW5kKHRoaXMuYnV0dG9uLHRoaXMub3B0aW9uQ29udGVudERPTSlcclxuICAgIHRoaXMuY3VyU2VsZWN0VmFsPW51bGw7XHJcblxyXG4gICAgaWYob3B0aW9ucy5pc0NsaWNrYWJsZSl7XHJcbiAgICAgICAgdGhpcy5idXR0b24ub24oXCJjbGlja1wiLChlKT0+e1xyXG4gICAgICAgICAgICB0aGlzLmFkanVzdERyb3BEb3duUG9zaXRpb24oKVxyXG4gICAgICAgICAgICBpZih0aGlzLm9wdGlvbkNvbnRlbnRET00uaGFzQ2xhc3MoXCJ3My1zaG93XCIpKSAgdGhpcy5vcHRpb25Db250ZW50RE9NLnJlbW92ZUNsYXNzKFwidzMtc2hvd1wiKVxyXG4gICAgICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jYWxsQmFja19iZWZvcmVDbGlja0V4cGFuZCgpXHJcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbkNvbnRlbnRET00uYWRkQ2xhc3MoXCJ3My1zaG93XCIpXHJcbiAgICAgICAgICAgIH0gXHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9KSAgICBcclxuICAgIH1cclxufVxyXG5cclxuc2ltcGxlU2VsZWN0TWVudS5wcm90b3R5cGUuc2hyaW5rPWZ1bmN0aW9uKCl7XHJcbiAgICBpZih0aGlzLm9wdGlvbkNvbnRlbnRET00uaGFzQ2xhc3MoXCJ3My1zaG93XCIpKSAgdGhpcy5vcHRpb25Db250ZW50RE9NLnJlbW92ZUNsYXNzKFwidzMtc2hvd1wiKVxyXG59XHJcblxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS5hZGp1c3REcm9wRG93blBvc2l0aW9uPWZ1bmN0aW9uKCl7XHJcbiAgICBpZighdGhpcy5hZGp1c3RQb3NpdGlvbkFuY2hvcikgcmV0dXJuO1xyXG4gICAgdmFyIG9mZnNldD10aGlzLkRPTS5vZmZzZXQoKVxyXG4gICAgdmFyIG5ld1RvcD1vZmZzZXQudG9wLXRoaXMuYWRqdXN0UG9zaXRpb25BbmNob3IudG9wXHJcbiAgICB2YXIgbmV3TGVmdD1vZmZzZXQubGVmdC10aGlzLmFkanVzdFBvc2l0aW9uQW5jaG9yLmxlZnRcclxuICAgIHRoaXMub3B0aW9uQ29udGVudERPTS5jc3Moe1widG9wXCI6bmV3VG9wK1wicHhcIixcImxlZnRcIjpuZXdMZWZ0K1wicHhcIn0pXHJcbn1cclxuXHJcbnNpbXBsZVNlbGVjdE1lbnUucHJvdG90eXBlLmZpbmRPcHRpb249ZnVuY3Rpb24ob3B0aW9uVmFsdWUpe1xyXG4gICAgdmFyIG9wdGlvbnM9dGhpcy5vcHRpb25Db250ZW50RE9NLmNoaWxkcmVuKClcclxuICAgIGZvcih2YXIgaT0wO2k8b3B0aW9ucy5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIgYW5PcHRpb249JChvcHRpb25zW2ldKVxyXG4gICAgICAgIGlmKG9wdGlvblZhbHVlPT1hbk9wdGlvbi5kYXRhKFwib3B0aW9uVmFsdWVcIikpe1xyXG4gICAgICAgICAgICByZXR1cm4ge1widGV4dFwiOmFuT3B0aW9uLnRleHQoKSxcInZhbHVlXCI6YW5PcHRpb24uZGF0YShcIm9wdGlvblZhbHVlXCIpfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuc2ltcGxlU2VsZWN0TWVudS5wcm90b3R5cGUuYWRkT3B0aW9uQXJyPWZ1bmN0aW9uKGFycil7XHJcbiAgICBhcnIuZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICB0aGlzLmFkZE9wdGlvbihlbGVtZW50KVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbnNpbXBsZVNlbGVjdE1lbnUucHJvdG90eXBlLmFkZE9wdGlvbj1mdW5jdGlvbihvcHRpb25UZXh0LG9wdGlvblZhbHVlLGNvbG9yQ2xhc3Mpe1xyXG4gICAgdmFyIG9wdGlvbkl0ZW09JCgnPGEgaHJlZj1cIiNcIiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvblwiPicrb3B0aW9uVGV4dCsnPC9hPicpXHJcbiAgICBpZihjb2xvckNsYXNzKSBvcHRpb25JdGVtLmFkZENsYXNzKGNvbG9yQ2xhc3MpXHJcbiAgICB0aGlzLm9wdGlvbkNvbnRlbnRET00uYXBwZW5kKG9wdGlvbkl0ZW0pXHJcbiAgICBvcHRpb25JdGVtLmRhdGEoXCJvcHRpb25WYWx1ZVwiLG9wdGlvblZhbHVlfHxvcHRpb25UZXh0KVxyXG4gICAgb3B0aW9uSXRlbS5kYXRhKFwib3B0aW9uQ29sb3JDbGFzc1wiLGNvbG9yQ2xhc3MpXHJcbiAgICBvcHRpb25JdGVtLm9uKCdjbGljaycsKGUpPT57XHJcbiAgICAgICAgdGhpcy5jdXJTZWxlY3RWYWw9b3B0aW9uSXRlbS5kYXRhKFwib3B0aW9uVmFsdWVcIilcclxuICAgICAgICBpZih0aGlzLmlzQ2xpY2thYmxlKXtcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25Db250ZW50RE9NLnJlbW92ZUNsYXNzKFwidzMtc2hvd1wiKVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICB0aGlzLkRPTS5yZW1vdmVDbGFzcygndzMtZHJvcGRvd24taG92ZXInKVxyXG4gICAgICAgICAgICB0aGlzLkRPTS5hZGRDbGFzcygndzMtZHJvcGRvd24tY2xpY2snKVxyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHsgLy90aGlzIGlzIHRvIGhpZGUgdGhlIGRyb3AgZG93biBtZW51IGFmdGVyIGNsaWNrXHJcbiAgICAgICAgICAgICAgICB0aGlzLkRPTS5hZGRDbGFzcygndzMtZHJvcGRvd24taG92ZXInKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5ET00ucmVtb3ZlQ2xhc3MoJ3czLWRyb3Bkb3duLWNsaWNrJylcclxuICAgICAgICAgICAgfSwgMTAwKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5jYWxsQmFja19jbGlja09wdGlvbihvcHRpb25UZXh0LG9wdGlvbkl0ZW0uZGF0YShcIm9wdGlvblZhbHVlXCIpLFwicmVhbE1vdXNlQ2xpY2tcIixjb2xvckNsYXNzKVxyXG4gICAgICAgIHJldHVybiBmYWxzZVxyXG4gICAgfSlcclxufVxyXG5cclxuc2ltcGxlU2VsZWN0TWVudS5wcm90b3R5cGUuY2hhbmdlTmFtZT1mdW5jdGlvbihuYW1lU3RyMSxuYW1lU3RyMil7XHJcbiAgICB0aGlzLmJ1dHRvbi5jaGlsZHJlbihcIjpmaXJzdFwiKS50ZXh0KG5hbWVTdHIxKVxyXG4gICAgdGhpcy5idXR0b24uY2hpbGRyZW4oKS5lcSgxKS50ZXh0KG5hbWVTdHIyKVxyXG59XHJcblxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS50cmlnZ2VyT3B0aW9uSW5kZXg9ZnVuY3Rpb24ob3B0aW9uSW5kZXgpe1xyXG4gICAgdmFyIHRoZU9wdGlvbj10aGlzLm9wdGlvbkNvbnRlbnRET00uY2hpbGRyZW4oKS5lcShvcHRpb25JbmRleClcclxuICAgIGlmKHRoZU9wdGlvbi5sZW5ndGg9PTApIHtcclxuICAgICAgICB0aGlzLmN1clNlbGVjdFZhbD1udWxsO1xyXG4gICAgICAgIHRoaXMuY2FsbEJhY2tfY2xpY2tPcHRpb24obnVsbCxudWxsKVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHRoaXMuY3VyU2VsZWN0VmFsPXRoZU9wdGlvbi5kYXRhKFwib3B0aW9uVmFsdWVcIilcclxuICAgIHRoaXMuY2FsbEJhY2tfY2xpY2tPcHRpb24odGhlT3B0aW9uLnRleHQoKSx0aGVPcHRpb24uZGF0YShcIm9wdGlvblZhbHVlXCIpLG51bGwsdGhlT3B0aW9uLmRhdGEoXCJvcHRpb25Db2xvckNsYXNzXCIpKVxyXG59XHJcblxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS50cmlnZ2VyT3B0aW9uVmFsdWU9ZnVuY3Rpb24ob3B0aW9uVmFsdWUpe1xyXG4gICAgdmFyIHJlPXRoaXMuZmluZE9wdGlvbihvcHRpb25WYWx1ZSlcclxuICAgIGlmKHJlPT1udWxsKXtcclxuICAgICAgICB0aGlzLmN1clNlbGVjdFZhbD1udWxsXHJcbiAgICAgICAgdGhpcy5jYWxsQmFja19jbGlja09wdGlvbihudWxsLG51bGwpXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB0aGlzLmN1clNlbGVjdFZhbD1yZS52YWx1ZVxyXG4gICAgICAgIHRoaXMuY2FsbEJhY2tfY2xpY2tPcHRpb24ocmUudGV4dCxyZS52YWx1ZSlcclxuICAgIH1cclxufVxyXG5cclxuXHJcbnNpbXBsZVNlbGVjdE1lbnUucHJvdG90eXBlLmNsZWFyT3B0aW9ucz1mdW5jdGlvbihvcHRpb25UZXh0LG9wdGlvblZhbHVlKXtcclxuICAgIHRoaXMub3B0aW9uQ29udGVudERPTS5lbXB0eSgpXHJcbiAgICB0aGlzLmN1clNlbGVjdFZhbD1udWxsO1xyXG59XHJcblxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS5jYWxsQmFja19jbGlja09wdGlvbj1mdW5jdGlvbihvcHRpb250ZXh0LG9wdGlvblZhbHVlLHJlYWxNb3VzZUNsaWNrKXtcclxufVxyXG5cclxuc2ltcGxlU2VsZWN0TWVudS5wcm90b3R5cGUuY2FsbEJhY2tfYmVmb3JlQ2xpY2tFeHBhbmQ9ZnVuY3Rpb24ob3B0aW9udGV4dCxvcHRpb25WYWx1ZSxyZWFsTW91c2VDbGljayl7XHJcbn1cclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHNpbXBsZVNlbGVjdE1lbnU7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuZnVuY3Rpb24gc2ltcGxlVHJlZShET00sb3B0aW9ucyl7XHJcbiAgICB0aGlzLkRPTT1ET01cclxuICAgIHRoaXMuZ3JvdXBOb2Rlcz1bXSAvL2VhY2ggZ3JvdXAgaGVhZGVyIGlzIG9uZSBub2RlXHJcbiAgICB0aGlzLnNlbGVjdGVkTm9kZXM9W107XHJcbiAgICB0aGlzLm9wdGlvbnM9b3B0aW9ucyB8fCB7fVxyXG5cclxuICAgIHRoaXMubGFzdENsaWNrZWROb2RlPW51bGw7XHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLnNjcm9sbFRvTGVhZk5vZGU9ZnVuY3Rpb24oYU5vZGUpe1xyXG4gICAgdmFyIHNjcm9sbFRvcD10aGlzLkRPTS5zY3JvbGxUb3AoKVxyXG4gICAgdmFyIHRyZWVIZWlnaHQ9dGhpcy5ET00uaGVpZ2h0KClcclxuICAgIHZhciBub2RlUG9zaXRpb249YU5vZGUuRE9NLnBvc2l0aW9uKCkudG9wIC8vd2hpY2ggZG9lcyBub3QgY29uc2lkZXIgcGFyZW50IERPTSdzIHNjcm9sbCBoZWlnaHRcclxuICAgIC8vY29uc29sZS5sb2coc2Nyb2xsVG9wLHRyZWVIZWlnaHQsbm9kZVBvc2l0aW9uKVxyXG4gICAgaWYodHJlZUhlaWdodC01MDxub2RlUG9zaXRpb24pe1xyXG4gICAgICAgIHRoaXMuRE9NLnNjcm9sbFRvcChzY3JvbGxUb3AgKyBub2RlUG9zaXRpb24tKHRyZWVIZWlnaHQtNTApKSBcclxuICAgIH1lbHNlIGlmKG5vZGVQb3NpdGlvbjw1MCl7XHJcbiAgICAgICAgdGhpcy5ET00uc2Nyb2xsVG9wKHNjcm9sbFRvcCArIChub2RlUG9zaXRpb24tNTApKSBcclxuICAgIH1cclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuY2xlYXJBbGxMZWFmTm9kZXM9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMubGFzdENsaWNrZWROb2RlPW51bGxcclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5mb3JFYWNoKChnTm9kZSk9PntcclxuICAgICAgICBnTm9kZS5saXN0RE9NLmVtcHR5KClcclxuICAgICAgICBnTm9kZS5jaGlsZExlYWZOb2Rlcy5sZW5ndGg9MFxyXG4gICAgICAgIGdOb2RlLnJlZnJlc2hOYW1lKClcclxuICAgIH0pXHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmZpcnN0TGVhZk5vZGU9ZnVuY3Rpb24oKXtcclxuICAgIGlmKHRoaXMuZ3JvdXBOb2Rlcy5sZW5ndGg9PTApIHJldHVybiBudWxsO1xyXG4gICAgdmFyIGZpcnN0TGVhZk5vZGU9bnVsbDtcclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5mb3JFYWNoKGFHcm91cE5vZGU9PntcclxuICAgICAgICBpZihmaXJzdExlYWZOb2RlIT1udWxsKSByZXR1cm47XHJcbiAgICAgICAgaWYoYUdyb3VwTm9kZS5jaGlsZExlYWZOb2Rlcy5sZW5ndGg+MCkgZmlyc3RMZWFmTm9kZT1hR3JvdXBOb2RlLmNoaWxkTGVhZk5vZGVzWzBdXHJcbiAgICB9KVxyXG5cclxuICAgIHJldHVybiBmaXJzdExlYWZOb2RlXHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLm5leHRHcm91cE5vZGU9ZnVuY3Rpb24oYUdyb3VwTm9kZSl7XHJcbiAgICBpZihhR3JvdXBOb2RlPT1udWxsKSByZXR1cm47XHJcbiAgICB2YXIgaW5kZXg9dGhpcy5ncm91cE5vZGVzLmluZGV4T2YoYUdyb3VwTm9kZSlcclxuICAgIGlmKHRoaXMuZ3JvdXBOb2Rlcy5sZW5ndGgtMT5pbmRleCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ3JvdXBOb2Rlc1tpbmRleCsxXVxyXG4gICAgfWVsc2V7IC8vcm90YXRlIGJhY2t3YXJkIHRvIGZpcnN0IGdyb3VwIG5vZGVcclxuICAgICAgICByZXR1cm4gdGhpcy5ncm91cE5vZGVzWzBdIFxyXG4gICAgfVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5uZXh0TGVhZk5vZGU9ZnVuY3Rpb24oYUxlYWZOb2RlKXtcclxuICAgIGlmKGFMZWFmTm9kZT09bnVsbCkgcmV0dXJuO1xyXG4gICAgdmFyIGFHcm91cE5vZGU9YUxlYWZOb2RlLnBhcmVudEdyb3VwTm9kZVxyXG4gICAgdmFyIGluZGV4PWFHcm91cE5vZGUuY2hpbGRMZWFmTm9kZXMuaW5kZXhPZihhTGVhZk5vZGUpXHJcbiAgICBpZihhR3JvdXBOb2RlLmNoaWxkTGVhZk5vZGVzLmxlbmd0aC0xPmluZGV4KXtcclxuICAgICAgICAvL25leHQgbm9kZSBpcyBpbiBzYW1lIGdyb3VwXHJcbiAgICAgICAgcmV0dXJuIGFHcm91cE5vZGUuY2hpbGRMZWFmTm9kZXNbaW5kZXgrMV1cclxuICAgIH1lbHNle1xyXG4gICAgICAgIC8vZmluZCBuZXh0IGdyb3VwIGZpcnN0IG5vZGVcclxuICAgICAgICB3aGlsZSh0cnVlKXtcclxuICAgICAgICAgICAgdmFyIG5leHRHcm91cE5vZGUgPSB0aGlzLm5leHRHcm91cE5vZGUoYUdyb3VwTm9kZSlcclxuICAgICAgICAgICAgaWYobmV4dEdyb3VwTm9kZS5jaGlsZExlYWZOb2Rlcy5sZW5ndGg9PTApe1xyXG4gICAgICAgICAgICAgICAgYUdyb3VwTm9kZT1uZXh0R3JvdXBOb2RlXHJcbiAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5leHRHcm91cE5vZGUuY2hpbGRMZWFmTm9kZXNbMF1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuc2VhcmNoVGV4dD1mdW5jdGlvbihzdHIpe1xyXG4gICAgaWYoc3RyPT1cIlwiKSByZXR1cm4gbnVsbDtcclxuICAgIC8vc2VhcmNoIGZyb20gY3VycmVudCBzZWxlY3QgaXRlbSB0aGUgbmV4dCBsZWFmIGl0ZW0gY29udGFpbnMgdGhlIHRleHRcclxuICAgIHZhciByZWdleCA9IG5ldyBSZWdFeHAoc3RyLCAnaScpO1xyXG4gICAgdmFyIHN0YXJ0Tm9kZVxyXG4gICAgaWYodGhpcy5zZWxlY3RlZE5vZGVzLmxlbmd0aD09MCkge1xyXG4gICAgICAgIHN0YXJ0Tm9kZT10aGlzLmZpcnN0TGVhZk5vZGUoKVxyXG4gICAgICAgIGlmKHN0YXJ0Tm9kZT09bnVsbCkgcmV0dXJuO1xyXG4gICAgICAgIHZhciB0aGVTdHI9c3RhcnROb2RlLm5hbWU7XHJcbiAgICAgICAgaWYodGhlU3RyLm1hdGNoKHJlZ2V4KSE9bnVsbCl7XHJcbiAgICAgICAgICAgIC8vZmluZCB0YXJnZXQgbm9kZSBcclxuICAgICAgICAgICAgcmV0dXJuIHN0YXJ0Tm9kZVxyXG4gICAgICAgIH1cclxuICAgIH1lbHNlIHN0YXJ0Tm9kZT10aGlzLnNlbGVjdGVkTm9kZXNbMF1cclxuXHJcbiAgICBpZihzdGFydE5vZGU9PW51bGwpIHJldHVybiBudWxsO1xyXG4gICAgXHJcbiAgICB2YXIgZnJvbU5vZGU9c3RhcnROb2RlO1xyXG4gICAgd2hpbGUodHJ1ZSl7XHJcbiAgICAgICAgdmFyIG5leHROb2RlPXRoaXMubmV4dExlYWZOb2RlKGZyb21Ob2RlKVxyXG4gICAgICAgIGlmKG5leHROb2RlPT1zdGFydE5vZGUpIHJldHVybiBudWxsO1xyXG4gICAgICAgIHZhciBuZXh0Tm9kZVN0cj1uZXh0Tm9kZS5uYW1lO1xyXG4gICAgICAgIGlmKG5leHROb2RlU3RyLm1hdGNoKHJlZ2V4KSE9bnVsbCl7XHJcbiAgICAgICAgICAgIC8vZmluZCB0YXJnZXQgbm9kZVxyXG4gICAgICAgICAgICByZXR1cm4gbmV4dE5vZGVcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgZnJvbU5vZGU9bmV4dE5vZGU7XHJcbiAgICAgICAgfVxyXG4gICAgfSAgICBcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuZ2V0QWxsTGVhZk5vZGVBcnI9ZnVuY3Rpb24oKXtcclxuICAgIHZhciBhbGxMZWFmPVtdXHJcbiAgICB0aGlzLmdyb3VwTm9kZXMuZm9yRWFjaChnbj0+e1xyXG4gICAgICAgIGFsbExlYWY9YWxsTGVhZi5jb25jYXQoZ24uY2hpbGRMZWFmTm9kZXMpXHJcbiAgICB9KVxyXG4gICAgcmV0dXJuIGFsbExlYWY7XHJcbn1cclxuXHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5hZGRMZWFmbm9kZVRvR3JvdXA9ZnVuY3Rpb24oZ3JvdXBOYW1lLG9iaixza2lwUmVwZWF0KXtcclxuICAgIHZhciBhR3JvdXBOb2RlPXRoaXMuZmluZEdyb3VwTm9kZShncm91cE5hbWUpXHJcbiAgICBpZihhR3JvdXBOb2RlID09IG51bGwpIHJldHVybjtcclxuICAgIGFHcm91cE5vZGUuYWRkTm9kZShvYmosc2tpcFJlcGVhdClcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUucmVtb3ZlQWxsTm9kZXM9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMubGFzdENsaWNrZWROb2RlPW51bGxcclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5sZW5ndGg9MDtcclxuICAgIHRoaXMuc2VsZWN0ZWROb2Rlcy5sZW5ndGg9MDtcclxuICAgIHRoaXMuRE9NLmVtcHR5KClcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuZmluZEdyb3VwTm9kZT1mdW5jdGlvbihncm91cE5hbWUpe1xyXG4gICAgdmFyIGZvdW5kR3JvdXBOb2RlPW51bGxcclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5mb3JFYWNoKGFHcm91cE5vZGU9PntcclxuICAgICAgICBpZihhR3JvdXBOb2RlLm5hbWU9PWdyb3VwTmFtZSl7XHJcbiAgICAgICAgICAgIGZvdW5kR3JvdXBOb2RlPWFHcm91cE5vZGVcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbiAgICByZXR1cm4gZm91bmRHcm91cE5vZGU7XHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmRlbEdyb3VwTm9kZT1mdW5jdGlvbihnbm9kZSl7XHJcbiAgICB0aGlzLmxhc3RDbGlja2VkTm9kZT1udWxsXHJcbiAgICBnbm9kZS5kZWxldGVTZWxmKClcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuZGVsZXRlTGVhZk5vZGU9ZnVuY3Rpb24obm9kZU5hbWUpe1xyXG4gICAgdGhpcy5sYXN0Q2xpY2tlZE5vZGU9bnVsbFxyXG4gICAgdmFyIGZpbmRMZWFmTm9kZT1udWxsXHJcbiAgICB0aGlzLmdyb3VwTm9kZXMuZm9yRWFjaCgoZ05vZGUpPT57XHJcbiAgICAgICAgaWYoZmluZExlYWZOb2RlIT1udWxsKSByZXR1cm47XHJcbiAgICAgICAgZ05vZGUuY2hpbGRMZWFmTm9kZXMuZm9yRWFjaCgoYUxlYWYpPT57XHJcbiAgICAgICAgICAgIGlmKGFMZWFmLm5hbWU9PW5vZGVOYW1lKXtcclxuICAgICAgICAgICAgICAgIGZpbmRMZWFmTm9kZT1hTGVhZlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgIH0pXHJcbiAgICBpZihmaW5kTGVhZk5vZGU9PW51bGwpIHJldHVybjtcclxuICAgIGZpbmRMZWFmTm9kZS5kZWxldGVTZWxmKClcclxufVxyXG5cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmluc2VydEdyb3VwTm9kZT1mdW5jdGlvbihvYmosaW5kZXgpe1xyXG4gICAgdmFyIGFOZXdHcm91cE5vZGUgPSBuZXcgc2ltcGxlVHJlZUdyb3VwTm9kZSh0aGlzLG9iailcclxuICAgIHZhciBleGlzdEdyb3VwTm9kZT0gdGhpcy5maW5kR3JvdXBOb2RlKGFOZXdHcm91cE5vZGUubmFtZSlcclxuICAgIGlmKGV4aXN0R3JvdXBOb2RlIT1udWxsKSByZXR1cm47XHJcbiAgICB0aGlzLmdyb3VwTm9kZXMuc3BsaWNlKGluZGV4LCAwLCBhTmV3R3JvdXBOb2RlKTtcclxuXHJcbiAgICBpZihpbmRleD09MCl7XHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKGFOZXdHcm91cE5vZGUuaGVhZGVyRE9NKVxyXG4gICAgICAgIHRoaXMuRE9NLmFwcGVuZChhTmV3R3JvdXBOb2RlLmxpc3RET00pXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB2YXIgcHJldkdyb3VwTm9kZT10aGlzLmdyb3VwTm9kZXNbaW5kZXgtMV1cclxuICAgICAgICBhTmV3R3JvdXBOb2RlLmhlYWRlckRPTS5pbnNlcnRBZnRlcihwcmV2R3JvdXBOb2RlLmxpc3RET00pXHJcbiAgICAgICAgYU5ld0dyb3VwTm9kZS5saXN0RE9NLmluc2VydEFmdGVyKGFOZXdHcm91cE5vZGUuaGVhZGVyRE9NKVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBhTmV3R3JvdXBOb2RlO1xyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5hZGRHcm91cE5vZGU9ZnVuY3Rpb24ob2JqKXtcclxuICAgIHZhciBhTmV3R3JvdXBOb2RlID0gbmV3IHNpbXBsZVRyZWVHcm91cE5vZGUodGhpcyxvYmopXHJcbiAgICB2YXIgZXhpc3RHcm91cE5vZGU9IHRoaXMuZmluZEdyb3VwTm9kZShhTmV3R3JvdXBOb2RlLm5hbWUpXHJcbiAgICBpZihleGlzdEdyb3VwTm9kZSE9bnVsbCkgcmV0dXJuIGV4aXN0R3JvdXBOb2RlO1xyXG4gICAgdGhpcy5ncm91cE5vZGVzLnB1c2goYU5ld0dyb3VwTm9kZSk7XHJcbiAgICB0aGlzLkRPTS5hcHBlbmQoYU5ld0dyb3VwTm9kZS5oZWFkZXJET00pXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQoYU5ld0dyb3VwTm9kZS5saXN0RE9NKVxyXG4gICAgcmV0dXJuIGFOZXdHcm91cE5vZGU7XHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLnNlbGVjdExlYWZOb2RlPWZ1bmN0aW9uKGxlYWZOb2RlLG1vdXNlQ2xpY2tEZXRhaWwpe1xyXG4gICAgdGhpcy5zZWxlY3RMZWFmTm9kZUFycihbbGVhZk5vZGVdLG1vdXNlQ2xpY2tEZXRhaWwpXHJcbn1cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuYXBwZW5kTGVhZk5vZGVUb1NlbGVjdGlvbj1mdW5jdGlvbihsZWFmTm9kZSl7XHJcbiAgICB2YXIgbmV3QXJyPVtdLmNvbmNhdCh0aGlzLnNlbGVjdGVkTm9kZXMpXHJcbiAgICBuZXdBcnIucHVzaChsZWFmTm9kZSlcclxuICAgIHRoaXMuc2VsZWN0TGVhZk5vZGVBcnIobmV3QXJyKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5hZGROb2RlQXJyYXlUb1NlbGVjdGlvbj1mdW5jdGlvbihhcnIpe1xyXG4gICAgdmFyIG5ld0FyciA9IHRoaXMuc2VsZWN0ZWROb2Rlc1xyXG4gICAgdmFyIGZpbHRlckFycj1hcnIuZmlsdGVyKChpdGVtKSA9PiBuZXdBcnIuaW5kZXhPZihpdGVtKSA8IDApXHJcbiAgICBuZXdBcnIgPSBuZXdBcnIuY29uY2F0KGZpbHRlckFycilcclxuICAgIHRoaXMuc2VsZWN0TGVhZk5vZGVBcnIobmV3QXJyKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5zZWxlY3RHcm91cE5vZGU9ZnVuY3Rpb24oZ3JvdXBOb2RlKXtcclxuICAgIGlmKHRoaXMuY2FsbGJhY2tfYWZ0ZXJTZWxlY3RHcm91cE5vZGUpIHRoaXMuY2FsbGJhY2tfYWZ0ZXJTZWxlY3RHcm91cE5vZGUoZ3JvdXBOb2RlLmluZm8pXHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLnNlbGVjdExlYWZOb2RlQXJyPWZ1bmN0aW9uKGxlYWZOb2RlQXJyLG1vdXNlQ2xpY2tEZXRhaWwpe1xyXG4gICAgZm9yKHZhciBpPTA7aTx0aGlzLnNlbGVjdGVkTm9kZXMubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdGhpcy5zZWxlY3RlZE5vZGVzW2ldLmRpbSgpXHJcbiAgICB9XHJcbiAgICB0aGlzLnNlbGVjdGVkTm9kZXMubGVuZ3RoPTA7XHJcbiAgICB0aGlzLnNlbGVjdGVkTm9kZXM9dGhpcy5zZWxlY3RlZE5vZGVzLmNvbmNhdChsZWFmTm9kZUFycilcclxuICAgIGZvcih2YXIgaT0wO2k8dGhpcy5zZWxlY3RlZE5vZGVzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHRoaXMuc2VsZWN0ZWROb2Rlc1tpXS5oaWdobGlnaHQoKVxyXG4gICAgfVxyXG5cclxuICAgIGlmKHRoaXMuY2FsbGJhY2tfYWZ0ZXJTZWxlY3ROb2RlcykgdGhpcy5jYWxsYmFja19hZnRlclNlbGVjdE5vZGVzKHRoaXMuc2VsZWN0ZWROb2Rlcyxtb3VzZUNsaWNrRGV0YWlsKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5kYmxDbGlja05vZGU9ZnVuY3Rpb24odGhlTm9kZSl7XHJcbiAgICBpZih0aGlzLmNhbGxiYWNrX2FmdGVyRGJsY2xpY2tOb2RlKSB0aGlzLmNhbGxiYWNrX2FmdGVyRGJsY2xpY2tOb2RlKHRoZU5vZGUpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLnNvcnRBbGxMZWF2ZXM9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5mb3JFYWNoKG9uZUdyb3VwTm9kZT0+e29uZUdyb3VwTm9kZS5zb3J0Tm9kZXNCeU5hbWUoKX0pXHJcbn1cclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLXRyZWUgZ3JvdXAgbm9kZS0tLS0tLS0tLS0tLS0tLVxyXG5mdW5jdGlvbiBzaW1wbGVUcmVlR3JvdXBOb2RlKHBhcmVudFRyZWUsb2JqKXtcclxuICAgIHRoaXMucGFyZW50VHJlZT1wYXJlbnRUcmVlXHJcbiAgICB0aGlzLmluZm89b2JqXHJcbiAgICB0aGlzLmNoaWxkTGVhZk5vZGVzPVtdIC8vaXQncyBjaGlsZCBsZWFmIG5vZGVzIGFycmF5XHJcbiAgICB0aGlzLm5hbWU9b2JqLmRpc3BsYXlOYW1lO1xyXG4gICAgdGhpcy5jcmVhdGVET00oKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5yZWZyZXNoTmFtZT1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5oZWFkZXJET00uZW1wdHkoKVxyXG4gICAgdmFyIG5hbWVEaXY9JChcIjxkaXYgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO3BhZGRpbmctbGVmdDo1cHg7cGFkZGluZy1yaWdodDozcHg7dmVydGljYWwtYWxpZ246bWlkZGxlJz48L2Rpdj5cIilcclxuICAgIG5hbWVEaXYudGV4dCh0aGlzLm5hbWUpXHJcbiAgICBcclxuICAgIGlmKHRoaXMuY2hpbGRMZWFmTm9kZXMubGVuZ3RoPjApIGxibENvbG9yPVwidzMtbGltZVwiXHJcbiAgICBlbHNlIHZhciBsYmxDb2xvcj1cInczLWdyYXlcIiBcclxuICAgIHRoaXMuaGVhZGVyRE9NLmNzcyhcImZvbnQtd2VpZ2h0XCIsXCJib2xkXCIpXHJcblxyXG4gICAgXHJcbiAgICBpZih0aGlzLnBhcmVudFRyZWUub3B0aW9ucy5ncm91cE5vZGVJY29uRnVuYyl7XHJcbiAgICAgICAgdmFyIGljb25MYWJlbD10aGlzLnBhcmVudFRyZWUub3B0aW9ucy5ncm91cE5vZGVJY29uRnVuYyh0aGlzKVxyXG4gICAgICAgIHRoaXMuaGVhZGVyRE9NLmFwcGVuZChpY29uTGFiZWwpXHJcbiAgICAgICAgdmFyIHJvd0hlaWdodD1pY29uTGFiZWwuaGVpZ2h0KClcclxuICAgICAgICBuYW1lRGl2LmNzcyhcImxpbmUtaGVpZ2h0XCIscm93SGVpZ2h0K1wicHhcIilcclxuICAgIH1cclxuICAgIFxyXG4gICAgdmFyIG51bWJlcmxhYmVsPSQoXCI8bGFiZWwgY2xhc3M9J1wiK2xibENvbG9yK1wiJyBzdHlsZT0nZGlzcGxheTppbmxpbmU7Zm9udC1zaXplOjlweDtwYWRkaW5nOjJweCA0cHg7Zm9udC13ZWlnaHQ6bm9ybWFsO2JvcmRlci1yYWRpdXM6IDJweDsnPlwiK3RoaXMuY2hpbGRMZWFmTm9kZXMubGVuZ3RoK1wiPC9sYWJlbD5cIilcclxuICAgIHRoaXMuaGVhZGVyRE9NLmFwcGVuZChuYW1lRGl2LG51bWJlcmxhYmVsKVxyXG5cclxuXHJcbiAgICBpZih0aGlzLnBhcmVudFRyZWUub3B0aW9ucy5ncm91cE5vZGVUYWlsQnV0dG9uRnVuYyl7XHJcbiAgICAgICAgdmFyIHRhaWxCdXR0b249dGhpcy5wYXJlbnRUcmVlLm9wdGlvbnMuZ3JvdXBOb2RlVGFpbEJ1dHRvbkZ1bmModGhpcylcclxuICAgICAgICB0aGlzLmhlYWRlckRPTS5hcHBlbmQodGFpbEJ1dHRvbilcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmNoZWNrT3B0aW9uSGlkZUVtcHR5R3JvdXAoKVxyXG5cclxufVxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5jaGVja09wdGlvbkhpZGVFbXB0eUdyb3VwPWZ1bmN0aW9uKCl7XHJcbiAgICBpZiAodGhpcy5wYXJlbnRUcmVlLm9wdGlvbnMuaGlkZUVtcHR5R3JvdXAgJiYgdGhpcy5jaGlsZExlYWZOb2Rlcy5sZW5ndGggPT0gMCkge1xyXG4gICAgICAgIHRoaXMuc2hyaW5rKClcclxuICAgICAgICB0aGlzLmhlYWRlckRPTS5oaWRlKClcclxuICAgICAgICBpZiAodGhpcy5saXN0RE9NKSB0aGlzLmxpc3RET00uaGlkZSgpXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuaGVhZGVyRE9NLnNob3coKVxyXG4gICAgICAgIGlmICh0aGlzLmxpc3RET00pIHRoaXMubGlzdERPTS5zaG93KClcclxuICAgIH1cclxuXHJcbn1cclxuc2ltcGxlVHJlZUdyb3VwTm9kZS5wcm90b3R5cGUuZGVsZXRlU2VsZiA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMuaGVhZGVyRE9NLnJlbW92ZSgpXHJcbiAgICB0aGlzLmxpc3RET00ucmVtb3ZlKClcclxuICAgIHZhciBwYXJlbnRBcnIgPSB0aGlzLnBhcmVudFRyZWUuZ3JvdXBOb2Rlc1xyXG4gICAgY29uc3QgaW5kZXggPSBwYXJlbnRBcnIuaW5kZXhPZih0aGlzKTtcclxuICAgIGlmIChpbmRleCA+IC0xKSBwYXJlbnRBcnIuc3BsaWNlKGluZGV4LCAxKTtcclxufVxyXG5cclxuc2ltcGxlVHJlZUdyb3VwTm9kZS5wcm90b3R5cGUuY3JlYXRlRE9NPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLmhlYWRlckRPTT0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJsb2NrIHczLWxpZ2h0LWdyZXkgdzMtbGVmdC1hbGlnbiB3My1ib3JkZXItYm90dG9tXCIgc3R5bGU9XCJwb3NpdGlvbjpyZWxhdGl2ZVwiPjwvYnV0dG9uPicpXHJcbiAgICB0aGlzLnJlZnJlc2hOYW1lKClcclxuICAgIHRoaXMubGlzdERPTT0kKCc8ZGl2IGNsYXNzPVwidzMtY29udGFpbmVyIHczLWhpZGUgdzMtYm9yZGVyIHczLXBhZGRpbmctMTZcIj48L2Rpdj4nKVxyXG5cclxuICAgIHRoaXMuaGVhZGVyRE9NLm9uKFwiY2xpY2tcIiwoZXZ0KT0+IHtcclxuICAgICAgICBpZih0aGlzLmxpc3RET00uaGFzQ2xhc3MoXCJ3My1zaG93XCIpKSB0aGlzLmxpc3RET00ucmVtb3ZlQ2xhc3MoXCJ3My1zaG93XCIpXHJcbiAgICAgICAgZWxzZSB0aGlzLmxpc3RET00uYWRkQ2xhc3MoXCJ3My1zaG93XCIpXHJcblxyXG4gICAgICAgIHRoaXMucGFyZW50VHJlZS5zZWxlY3RHcm91cE5vZGUodGhpcykgICAgXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbnNpbXBsZVRyZWVHcm91cE5vZGUucHJvdG90eXBlLmlzT3Blbj1mdW5jdGlvbigpe1xyXG4gICAgcmV0dXJuICB0aGlzLmxpc3RET00uaGFzQ2xhc3MoXCJ3My1zaG93XCIpXHJcbn1cclxuXHJcblxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5leHBhbmQ9ZnVuY3Rpb24oKXtcclxuICAgIGlmKHRoaXMubGlzdERPTSkgdGhpcy5saXN0RE9NLmFkZENsYXNzKFwidzMtc2hvd1wiKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5zaHJpbms9ZnVuY3Rpb24oKXtcclxuICAgIGlmKHRoaXMubGlzdERPTSkgdGhpcy5saXN0RE9NLnJlbW92ZUNsYXNzKFwidzMtc2hvd1wiKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5zb3J0Tm9kZXNCeU5hbWU9ZnVuY3Rpb24oKXtcclxuICAgIHZhciB0cmVlT3B0aW9ucz10aGlzLnBhcmVudFRyZWUub3B0aW9uc1xyXG4gICAgaWYodHJlZU9wdGlvbnMubGVhZk5hbWVQcm9wZXJ0eSkgdmFyIGxlYWZOYW1lUHJvcGVydHk9dHJlZU9wdGlvbnMubGVhZk5hbWVQcm9wZXJ0eVxyXG4gICAgZWxzZSBsZWFmTmFtZVByb3BlcnR5PVwiJGR0SWRcIlxyXG4gICAgdGhpcy5jaGlsZExlYWZOb2Rlcy5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7IFxyXG4gICAgICAgIHZhciBhTmFtZT1hLm5hbWUudG9Mb3dlckNhc2UoKVxyXG4gICAgICAgIHZhciBiTmFtZT1iLm5hbWUudG9Mb3dlckNhc2UoKVxyXG4gICAgICAgIHJldHVybiBhTmFtZS5sb2NhbGVDb21wYXJlKGJOYW1lKSBcclxuICAgIH0pO1xyXG4gICAgLy90aGlzLmxpc3RET00uZW1wdHkoKSAvL05PVEU6IENhbiBub3QgZGVsZXRlIHRob3NlIGxlYWYgbm9kZSBvdGhlcndpc2UgdGhlIGV2ZW50IGhhbmRsZSBpcyBsb3N0XHJcbiAgICB0aGlzLmNoaWxkTGVhZk5vZGVzLmZvckVhY2gob25lTGVhZj0+e3RoaXMubGlzdERPTS5hcHBlbmQob25lTGVhZi5ET00pfSlcclxufVxyXG5cclxuc2ltcGxlVHJlZUdyb3VwTm9kZS5wcm90b3R5cGUuYWRkTm9kZT1mdW5jdGlvbihvYmosc2tpcFJlcGVhdCl7XHJcbiAgICB2YXIgdHJlZU9wdGlvbnM9dGhpcy5wYXJlbnRUcmVlLm9wdGlvbnNcclxuICAgIGlmKHRyZWVPcHRpb25zLmxlYWZOYW1lUHJvcGVydHkpIHZhciBsZWFmTmFtZVByb3BlcnR5PXRyZWVPcHRpb25zLmxlYWZOYW1lUHJvcGVydHlcclxuICAgIGVsc2UgbGVhZk5hbWVQcm9wZXJ0eT1cIiRkdElkXCJcclxuXHJcbiAgICBpZihza2lwUmVwZWF0KXtcclxuICAgICAgICB2YXIgZm91bmRSZXBlYXQ9ZmFsc2U7XHJcbiAgICAgICAgdGhpcy5jaGlsZExlYWZOb2Rlcy5mb3JFYWNoKGFOb2RlPT57XHJcbiAgICAgICAgICAgIGlmKGFOb2RlLm5hbWU9PW9ialtsZWFmTmFtZVByb3BlcnR5XSkge1xyXG4gICAgICAgICAgICAgICAgZm91bmRSZXBlYXQ9dHJ1ZVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICBpZihmb3VuZFJlcGVhdCkgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBhTmV3Tm9kZSA9IG5ldyBzaW1wbGVUcmVlTGVhZk5vZGUodGhpcyxvYmopXHJcbiAgICB0aGlzLmNoaWxkTGVhZk5vZGVzLnB1c2goYU5ld05vZGUpXHJcbiAgICB0aGlzLnJlZnJlc2hOYW1lKClcclxuICAgIHRoaXMubGlzdERPTS5hcHBlbmQoYU5ld05vZGUuRE9NKVxyXG59XHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS10cmVlIGxlYWYgbm9kZS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5mdW5jdGlvbiBzaW1wbGVUcmVlTGVhZk5vZGUocGFyZW50R3JvdXBOb2RlLG9iail7XHJcbiAgICB0aGlzLnBhcmVudEdyb3VwTm9kZT1wYXJlbnRHcm91cE5vZGVcclxuICAgIHRoaXMubGVhZkluZm89b2JqO1xyXG5cclxuICAgIHZhciB0cmVlT3B0aW9ucz10aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLm9wdGlvbnNcclxuICAgIGlmKHRyZWVPcHRpb25zLmxlYWZOYW1lUHJvcGVydHkpIHRoaXMubmFtZT10aGlzLmxlYWZJbmZvW3RyZWVPcHRpb25zLmxlYWZOYW1lUHJvcGVydHldXHJcbiAgICBlbHNlIHRoaXMubmFtZT10aGlzLmxlYWZJbmZvW1wiJGR0SWRcIl1cclxuXHJcbiAgICB0aGlzLmNyZWF0ZUxlYWZOb2RlRE9NKClcclxufVxyXG5cclxuc2ltcGxlVHJlZUxlYWZOb2RlLnByb3RvdHlwZS5kZWxldGVTZWxmID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5ET00ucmVtb3ZlKClcclxuICAgIHZhciBnTm9kZSA9IHRoaXMucGFyZW50R3JvdXBOb2RlXHJcbiAgICBjb25zdCBpbmRleCA9IGdOb2RlLmNoaWxkTGVhZk5vZGVzLmluZGV4T2YodGhpcyk7XHJcbiAgICBpZiAoaW5kZXggPiAtMSkgZ05vZGUuY2hpbGRMZWFmTm9kZXMuc3BsaWNlKGluZGV4LCAxKTtcclxuICAgIGdOb2RlLnJlZnJlc2hOYW1lKClcclxufVxyXG5cclxuc2ltcGxlVHJlZUxlYWZOb2RlLnByb3RvdHlwZS5jbGlja1NlbGY9ZnVuY3Rpb24obW91c2VDbGlja0RldGFpbCl7XHJcbiAgICB0aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLmxhc3RDbGlja2VkTm9kZT10aGlzO1xyXG4gICAgdGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5zZWxlY3RMZWFmTm9kZSh0aGlzLG1vdXNlQ2xpY2tEZXRhaWwpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWVMZWFmTm9kZS5wcm90b3R5cGUuY3JlYXRlTGVhZk5vZGVET009ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuRE9NPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtd2hpdGVcIiBzdHlsZT1cImRpc3BsYXk6YmxvY2s7dGV4dC1hbGlnbjpsZWZ0O3dpZHRoOjk4JVwiPjwvYnV0dG9uPicpXHJcbiAgICB0aGlzLnJlZHJhd0xhYmVsKClcclxuXHJcblxyXG4gICAgdmFyIGNsaWNrRj0oZSk9PntcclxuICAgICAgICB0aGlzLmhpZ2hsaWdodCgpO1xyXG4gICAgICAgIHZhciBjbGlja0RldGFpbD1lLmRldGFpbFxyXG4gICAgICAgIGlmIChlLmN0cmxLZXkpIHtcclxuICAgICAgICAgICAgaWYodGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5vcHRpb25zLm5vTXVsdGlwbGVTZWxlY3RBbGxvd2VkKXtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xpY2tTZWxmKClcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLmFwcGVuZExlYWZOb2RlVG9TZWxlY3Rpb24odGhpcylcclxuICAgICAgICAgICAgdGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5sYXN0Q2xpY2tlZE5vZGU9dGhpcztcclxuICAgICAgICB9ZWxzZSBpZihlLnNoaWZ0S2V5KXtcclxuICAgICAgICAgICAgaWYodGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5vcHRpb25zLm5vTXVsdGlwbGVTZWxlY3RBbGxvd2VkKXtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xpY2tTZWxmKClcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZih0aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLmxhc3RDbGlja2VkTm9kZT09bnVsbCl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsaWNrU2VsZigpXHJcbiAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgdmFyIGFsbExlYWZOb2RlQXJyPXRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUuZ2V0QWxsTGVhZk5vZGVBcnIoKVxyXG4gICAgICAgICAgICAgICAgdmFyIGluZGV4MSA9IGFsbExlYWZOb2RlQXJyLmluZGV4T2YodGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5sYXN0Q2xpY2tlZE5vZGUpXHJcbiAgICAgICAgICAgICAgICB2YXIgaW5kZXgyID0gYWxsTGVhZk5vZGVBcnIuaW5kZXhPZih0aGlzKVxyXG4gICAgICAgICAgICAgICAgaWYoaW5kZXgxPT0tMSB8fCBpbmRleDI9PS0xKXtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNsaWNrU2VsZigpXHJcbiAgICAgICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgICAgICAvL3NlbGVjdCBhbGwgbGVhZiBiZXR3ZWVuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxvd2VyST0gTWF0aC5taW4oaW5kZXgxLGluZGV4MilcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaGlnaGVyST0gTWF0aC5tYXgoaW5kZXgxLGluZGV4MilcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbWlkZGxlQXJyPWFsbExlYWZOb2RlQXJyLnNsaWNlKGxvd2VySSxoaWdoZXJJKSAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIG1pZGRsZUFyci5wdXNoKGFsbExlYWZOb2RlQXJyW2hpZ2hlckldKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUuYWRkTm9kZUFycmF5VG9TZWxlY3Rpb24obWlkZGxlQXJyKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHRoaXMuY2xpY2tTZWxmKGNsaWNrRGV0YWlsKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMuRE9NLm9uKFwiY2xpY2tcIiwoZSk9PntjbGlja0YoZSl9KVxyXG5cclxuICAgIHRoaXMuRE9NLm9uKFwiZGJsY2xpY2tcIiwoZSk9PntcclxuICAgICAgICB0aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLmRibENsaWNrTm9kZSh0aGlzKVxyXG4gICAgfSlcclxufVxyXG5cclxuc2ltcGxlVHJlZUxlYWZOb2RlLnByb3RvdHlwZS5yZWRyYXdMYWJlbD1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5ET00uZW1wdHkoKVxyXG5cclxuICAgIHZhciBuYW1lRGl2PSQoXCI8ZGl2IHN0eWxlPSdkaXNwbGF5OmlubGluZTtwYWRkaW5nLWxlZnQ6NXB4O3BhZGRpbmctcmlnaHQ6M3B4O3ZlcnRpY2FsLWFsaWduOm1pZGRsZSc+PC9kaXY+XCIpXHJcbiAgICBuYW1lRGl2LnRleHQodGhpcy5uYW1lKVxyXG5cclxuICAgIGlmKHRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUub3B0aW9ucy5sZWFmTm9kZUljb25GdW5jKXtcclxuICAgICAgICB2YXIgaWNvbkxhYmVsPXRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUub3B0aW9ucy5sZWFmTm9kZUljb25GdW5jKHRoaXMpXHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKGljb25MYWJlbClcclxuICAgICAgICB2YXIgcm93SGVpZ2h0PWljb25MYWJlbC5oZWlnaHQoKVxyXG4gICAgICAgIG5hbWVEaXYuY3NzKFwibGluZS1oZWlnaHRcIixyb3dIZWlnaHQrXCJweFwiKVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQobmFtZURpdilcclxufVxyXG5zaW1wbGVUcmVlTGVhZk5vZGUucHJvdG90eXBlLmhpZ2hsaWdodD1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5ET00uYWRkQ2xhc3MoXCJ3My1vcmFuZ2VcIilcclxuICAgIHRoaXMuRE9NLmFkZENsYXNzKFwidzMtaG92ZXItYW1iZXJcIilcclxuICAgIHRoaXMuRE9NLnJlbW92ZUNsYXNzKFwidzMtd2hpdGVcIilcclxufVxyXG5zaW1wbGVUcmVlTGVhZk5vZGUucHJvdG90eXBlLmRpbT1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5ET00ucmVtb3ZlQ2xhc3MoXCJ3My1vcmFuZ2VcIilcclxuICAgIHRoaXMuRE9NLnJlbW92ZUNsYXNzKFwidzMtaG92ZXItYW1iZXJcIilcclxuICAgIHRoaXMuRE9NLmFkZENsYXNzKFwidzMtd2hpdGVcIilcclxufVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gc2ltcGxlVHJlZTsiXX0=
