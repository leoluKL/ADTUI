(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const simpleSelectMenu= require("./simpleSelectMenu")
const simpleConfirmDialog = require("./simpleConfirmDialog")

function adtInstanceSelectionDialog() {
    this.filters={}
    this.previousSelectedADT=null
    this.selectedADT=null;
    this.testTwinsInfo=null;

    //stored purpose for global usage
    this.storedOutboundRelationships={}
    this.storedTwins={}

    if(!this.DOM){
        this.DOM = $('<div class="w3-modal" style="display:block;z-index:101"></div>')
        this.DOM.css("overflow","hidden")
        $("body").append(this.DOM)
    }
}


adtInstanceSelectionDialog.prototype.preparationFunc = async function () {
    return new Promise((resolve, reject) => {
        try{
            $.get("twinsFilter/readStartFilters", (data, status) => {
                if(data!=null && data!="") this.filters=data;
                resolve()
            })
        }catch(e){
            reject(e)
        }
    })
}

adtInstanceSelectionDialog.prototype.popup = function () {
    $.get("queryADT/listADTInstance", (data, status) => {
        if(data=="") data=[]
        var adtArr=data;
        if (adtArr.length == 0) return;

        this.DOM.show()
        this.DOM.empty()
        this.contentDOM=$('<div class="w3-modal-content" style="width:650px"></div>')
        this.DOM.append(this.contentDOM)
        this.contentDOM.append($('<div style="height:40px" class="w3-bar w3-red"><div class="w3-bar-item" style="font-size:1.5em">Choose Data Set</div></div>'))
        var closeButton=$('<button class="w3-bar-item w3-button w3-right" style="font-size:2em;padding-top:4px">×</button>')
        this.contentDOM.children(':first').append(closeButton)
        
        this.buttonHolder=$("<div style='height:100%'></div>")
        this.contentDOM.children(':first').append(this.buttonHolder)
        closeButton.on("click",()=>{this.closeDialog()})
    
        var row1=$('<div class="w3-bar" style="padding:2px"></div>')
        this.contentDOM.append(row1)
        var lable=$('<div class="w3-bar-item w3-opacity" style="padding-right:5px;font-size:1.2em;">Azure Digital Twin ID </div>')
        row1.append(lable)
        var switchADTSelector=new simpleSelectMenu(" ",{withBorder:1,fontSize:"1.2em",colorClass:"w3-light-gray",buttonCSS:{"padding":"5px 10px"}})
        row1.append(switchADTSelector.DOM)
        
        adtArr.forEach((adtInstance)=>{
            var str = adtInstance.split(".")[0].replace("https://", "")
            switchADTSelector.addOption(str,adtInstance)
            if(this.filters[adtInstance]==null) this.filters[adtInstance]={}
        })

        switchADTSelector.callBack_clickOption=(optionText,optionValue)=>{
            switchADTSelector.changeName(optionText)
            this.setADTInstance(optionValue)
        }

        var row2=$('<div class="w3-cell-row"></div>')
        this.contentDOM.append(row2)
        var leftSpan=$('<div class="w3-cell" style="width:240px;padding-right:5px"></div>')
        
        leftSpan.append($('<div style="height:30px" class="w3-bar w3-red"><div class="w3-bar-item" style="">Filters</div></div>'))

        var filterList=$('<ul class="w3-ul w3-hoverable">')
        filterList.css({"overflow-x":"hidden","overflow-y":"auto","height":"340px", "border":"solid 1px lightgray"})
        leftSpan.append(filterList)

        this.filterList=filterList;
        row2.append(leftSpan)
        
        var rightSpan=$('<div class="w3-container w3-cell"></div>')
        row2.append(rightSpan) 

        var panelCard=$('<div class="w3-card-2 w3-white" style="padding:10px"></div>')
        rightSpan.append(panelCard)
        var querySpan=$("<span/>")
        panelCard.append(querySpan)
        

        var nameInput=$('<input type="text" style="outline:none"  placeholder="Choose a filter or fill in new filter name..."/>').addClass("w3-input w3-border");
        this.queryNameInput=nameInput;
        var queryLbl=$('<div class="w3-bar w3-red" style="padding-left:5px;margin-top:2px;width:50%">Query Sentence</div>')
        var queryInput=$('<textarea style="resize:none;height:80px;outline:none;margin-bottom:2px"  placeholder="Sample: SELECT * FROM digitaltwins where IS_OF_MODEL(\'modelID\')"/>').addClass("w3-input w3-border");
        this.queryInput=queryInput;

        var saveBtn=$('<button class="w3-button w3-hover-light-green w3-border-right">Save Filter</button>')
        var testBtn=$('<button class="w3-button w3-hover-amber w3-border-right">Test Query</button>')
        var delBtn=$('<button class="w3-button w3-hover-pink w3-border-right">Delete Filter</button>')


        testBtn.on("click",()=>{this.testQuery()})
        saveBtn.on("click",()=>{this.saveQuery()})
        delBtn.on("click",()=>{this.delQuery()})
        querySpan.append(nameInput,queryLbl,queryInput,saveBtn,testBtn,delBtn)

        var testResultSpan=$("<div class='w3-border'></div>")
        var testResultTable=$("<table></table>")
        this.testResultTable=testResultTable
        testResultSpan.css({"margin-top":"2px",overflow:"auto",height:"175px",width:"400px"})
        testResultTable.css({"border-collapse":"collapse"})
        panelCard.append(testResultSpan)
        testResultSpan.append(testResultTable)

        this.bottomBar=$('<div class="w3-bar"></div>')
        this.contentDOM.append(this.bottomBar)

        if(this.previousSelectedADT!=null){
            switchADTSelector.triggerOptionValue(this.previousSelectedADT)
        }else{
            switchADTSelector.triggerOptionIndex(0)
        }

    });
}

adtInstanceSelectionDialog.prototype.setADTInstance=function(selectedADT){
    this.bottomBar.empty()
    this.buttonHolder.empty()
    if(this.previousSelectedADT==null || this.previousSelectedADT == selectedADT){
        var replaceButton=$('<button class="w3-button w3-card w3-deep-orange w3-hover-green" style="height:100%; margin-right:8px">Replace All Data</button>')
        var appendButton=$('<button class="w3-button w3-card w3-deep-orange w3-hover-green" style="height:100%">Append Data</button>')

        replaceButton.on("click",()=> { this.useFilterToReplace()  }  )
        appendButton.on("click", ()=> { this.useFilterToAppend()  }  )
        this.buttonHolder.append(replaceButton,appendButton)
    }else{
        var replaceButton=$('<button class="w3-button w3-green w3-border-right" style="height:100%">Replace All Data</button>')
        replaceButton.on("click",()=> { this.useFilterToReplace()  }  )
        this.buttonHolder.append(replaceButton)
    }
    this.selectedADT = selectedADT
    this.listFilters(selectedADT)
    this.chooseOneFilter("","")
    $.ajaxSetup({
        headers: {
            'adtInstance': this.selectedADT
        }
    });
}


adtInstanceSelectionDialog.prototype.delQuery=function(){
    var queryName=this.queryNameInput.val()
    if(queryName=="ALL" || queryName=="")return;
    var confirmDialogDiv=new simpleConfirmDialog()

    confirmDialogDiv.show(
        { width: "250px" },
        {
            title: "Confirm"
            , content: "Please confirm deleting filter \""+queryName+"\"?"
            , buttons:[
                {
                    colorClass: "w3-red w3-hover-pink", text: "Confirm", "clickFunc": () => {
                        this.queryNameInput.val("")
                        this.queryInput.val("")
                        this.testResultTable.empty()
                        delete this.filters[this.selectedADT][queryName]
                        this.listFilters(this.selectedADT)
                        this.chooseOneFilter("", "")
                        $.post("twinsFilter/saveStartFilters", { filters: this.filters })
                        confirmDialogDiv.close();
                }},
                {
                    colorClass: "w3-gray",text: "Cancel", "clickFunc": () => {
                        confirmDialogDiv.close()
                }}
            ]
        }
    )
}

adtInstanceSelectionDialog.prototype.saveQuery=function(){
    var queryName=this.queryNameInput.val()
    var queryStr=this.queryInput.val()
    if(queryName==""){
        alert("Please fill in query name")
        return
    }

    this.filters[this.selectedADT][queryName]=queryStr
    this.listFilters(this.selectedADT)

    this.filterList.children().each((index,ele)=>{
        if($(ele).data("filterName")==queryName) {
            $(ele).trigger("click")
        }
    })

    //store filters to server side as a file
    $.post("twinsFilter/saveStartFilters",{filters:this.filters})
}

adtInstanceSelectionDialog.prototype.testQuery=function(){
    this.testResultTable.empty()
    var queryStr= this.queryInput.val()
    if(queryStr=="") return;
    $.post("queryADT/allTwinsInfo",{query:queryStr}, (data)=> {
        if(data=="") data=[]
        if(!Array.isArray(data)) {
            alert("Query is not correct!")
            return;
        }
        this.testTwinsInfo=data
        if(data.length==0){
            var tr=$('<tr><td style="color:gray">zero record</td><td style="border-bottom:solid 1px lightgrey"></td></tr>')
            this.testResultTable.append(tr)
        }else{
            var tr=$('<tr><td style="border-right:solid 1px lightgrey;border-bottom:solid 1px lightgrey;font-weight:bold">ID</td><td style="border-bottom:solid 1px lightgrey;font-weight:bold">MODEL</td></tr>')
            this.testResultTable.append(tr)
            data.forEach((oneNode)=>{
                this.storedTwins[oneNode["$dtId"]] = oneNode;
                var tr=$('<tr><td style="border-right:solid 1px lightgrey;border-bottom:solid 1px lightgrey">'+oneNode["$dtId"]+'</td><td style="border-bottom:solid 1px lightgrey">'+oneNode['$metadata']['$model']+'</td></tr>')
                this.testResultTable.append(tr)
            })    
        }
    });
}

adtInstanceSelectionDialog.prototype.listFilters=function(adtInstanceName){
    var availableFilters=this.filters[adtInstanceName]
    availableFilters["ALL"]="SELECT * FROM digitaltwins"

    var filterList=this.filterList;
    filterList.empty()

    for(var filterName in availableFilters){
        var oneFilter=$('<li style="font-size:1em">'+filterName+'</li>')
        oneFilter.css("cursor","default")
        oneFilter.data("filterName", filterName)
        oneFilter.data("filterQuery", availableFilters[filterName])
        if(filterName=="ALL") filterList.prepend(oneFilter)
        else filterList.append(oneFilter)
        this.assignEventToOneFilter(oneFilter)
        
        oneFilter.on("dblclick",(e)=>{
            if(this.previousSelectedADT == this.selectedADT) this.useFilterToAppend();
            else this.useFilterToReplace();
        })
    }
}

adtInstanceSelectionDialog.prototype.assignEventToOneFilter=function(oneFilter){
    oneFilter.on("click",(e)=>{
        this.filterList.children().each((index,ele)=>{
            $(ele).removeClass("w3-amber")
        })
        oneFilter.addClass("w3-amber")
        var filterName=oneFilter.data('filterName')
        var queryStr=oneFilter.data('filterQuery')
        this.chooseOneFilter(filterName,queryStr)
    })
}

adtInstanceSelectionDialog.prototype.useFilterToAppend=function(){
    if(this.queryInput.val()==""){
        alert("Please fill in query to fetch data from digital twin service..")
        return;
    }
    if(this.previousSelectedADT==null){
        this.broadcastMessage({ "message": "ADTDatasourceChange_replace", "query": this.queryInput.val(), "twins":this.testTwinsInfo })
    }else{
        this.previousSelectedADT=this.selectedADT
        this.broadcastMessage({ "message": "ADTDatasourceChange_append", "query": this.queryInput.val(), "twins":this.testTwinsInfo })
    }
    this.closeDialog()
}

adtInstanceSelectionDialog.prototype.closeDialog=function(){
    this.DOM.hide()
    this.broadcastMessage({ "message": "ADTDatasourceDialog_closed"})
}

adtInstanceSelectionDialog.prototype.storeTwinRelationships_remove=function(relationsData){
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

adtInstanceSelectionDialog.prototype.storeTwinRelationships_append=function(relationsData){
    relationsData.forEach((oneRelationship)=>{
        if(!this.storedOutboundRelationships[oneRelationship['$sourceId']])
            this.storedOutboundRelationships[oneRelationship['$sourceId']]=[]
        this.storedOutboundRelationships[oneRelationship['$sourceId']].push(oneRelationship)
    })
}

adtInstanceSelectionDialog.prototype.storeTwinRelationships=function(relationsData){
    relationsData.forEach((oneRelationship)=>{
        var twinID=oneRelationship['$sourceId']
        this.storedOutboundRelationships[twinID]=[]
    })

    relationsData.forEach((oneRelationship)=>{
        this.storedOutboundRelationships[oneRelationship['$sourceId']].push(oneRelationship)
    })
}

adtInstanceSelectionDialog.prototype.useFilterToReplace=function(){
    if(this.queryInput.val()==""){
        alert("Please fill in query to fetch data from digital twin service..")
        return;
    }
    var ADTInstanceDoesNotChange=true
    if(this.previousSelectedADT!=this.selectedADT){
        for(var ind in this.storedOutboundRelationships) delete this.storedOutboundRelationships[ind]
        for(var ind in this.storedTwins) delete this.storedTwins[ind]
        ADTInstanceDoesNotChange=false
    }
    this.previousSelectedADT=this.selectedADT
    this.broadcastMessage({ "message": "ADTDatasourceChange_replace", "query": this.queryInput.val()
    , "twins":this.testTwinsInfo, "ADTInstanceDoesNotChange":ADTInstanceDoesNotChange })
    
    this.closeDialog()
}

adtInstanceSelectionDialog.prototype.chooseOneFilter=function(queryName,queryStr){
    this.queryNameInput.val(queryName)
    this.queryInput.val(queryStr)
    this.testResultTable.empty()
    this.testTwinsInfo=null
}

module.exports = new adtInstanceSelectionDialog();
},{"./simpleConfirmDialog":8,"./simpleSelectMenu":9}],2:[function(require,module,exports){
'use strict';
const topologyDOM=require("./topologyDOM.js")
const twinsTree=require("./twinsTree")
const adtInstanceSelectionDialog = require("./adtInstanceSelectionDialog")
const modelManagerDialog = require("./modelManagerDialog")
const editLayoutDialog = require("./editLayoutDialog")
const mainToolbar = require("./mainToolbar")
const infoPanel= require("./infoPanel");
const globalAppSettings = require("../globalAppSettings.js");
const msalHelper=require("../msalHelper")

function digitaltwinmoduleUI() {
    this.initUILayout()

    this.twinsTree= new twinsTree($("#treeHolder"),$("#treeSearch"))
    
    this.mainToolbar=mainToolbar
    mainToolbar.render()
    this.topologyInstance=new topologyDOM($('#canvas'))
    this.topologyInstance.init()
    this.infoPanel= infoPanel

    this.broadcastMessage() //initialize all ui components to have the broadcast capability

    //try if it already B2C signed in, if not going back to the start page
    this.myMSALObj = new msal.PublicClientApplication(globalAppSettings.msalConfig);


    this.prepareData()
}

digitaltwinmoduleUI.prototype.prepareData=async function(){
    var theAccount=msalHelper.fetchAccount();
    if(theAccount==null && !globalAppSettings.isLocalTest) window.open(globalAppSettings.logoutRedirectUri,"_self")

    var res=await msalHelper.callAPI("tointernal")
    console.log(res)
    //
    /*
    var promiseArr=[
        modelManagerDialog.preparationFunc(),
        adtInstanceSelectionDialog.preparationFunc()
    ]
    await Promise.allSettled(promiseArr);
    */
    //adtInstanceSelectionDialog.popup()
}


digitaltwinmoduleUI.prototype.assignBroadcastMessage=function(uiComponent){
    uiComponent.broadcastMessage=(msgObj)=>{this.broadcastMessage(uiComponent,msgObj)}
}

digitaltwinmoduleUI.prototype.broadcastMessage=function(source,msgPayload){
    var componentsArr=[this.twinsTree,adtInstanceSelectionDialog,modelManagerDialog,editLayoutDialog,
         this.mainToolbar,this.topologyInstance,this.infoPanel]

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
},{"../globalAppSettings.js":13,"../msalHelper":14,"./adtInstanceSelectionDialog":1,"./editLayoutDialog":3,"./infoPanel":4,"./mainToolbar":5,"./modelManagerDialog":7,"./topologyDOM.js":11,"./twinsTree":12}],3:[function(require,module,exports){
const adtInstanceSelectionDialog = require("./adtInstanceSelectionDialog")
const simpleSelectMenu= require("./simpleSelectMenu")
const simpleConfirmDialog = require("./simpleConfirmDialog")

function editLayoutDialog() {
    if(!this.DOM){
        this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:101" class="w3-card-2"></div>')
        $("body").append(this.DOM)
        this.DOM.hide()
    }
    this.layoutJSON={}
    this.currentLayoutName=null
}

editLayoutDialog.prototype.getCurADTName=function(){
    var adtName = adtInstanceSelectionDialog.selectedADT
    var str = adtName.replace("https://", "")
    return str
}

editLayoutDialog.prototype.rxMessage=function(msgPayload){
    if(msgPayload.message=="ADTDatasourceChange_replace") {
        try{
            $.post("layout/readLayouts",{adtName:this.getCurADTName()}, (data, status) => {
                if(data!="" && typeof(data)==="object") this.layoutJSON=data;
                else this.layoutJSON={};
                this.broadcastMessage({ "message": "layoutsUpdated"})
            })
        }catch(e){
            console.log(e)
        }
    
    }
}

editLayoutDialog.prototype.refillOptions = function () {
    this.switchLayoutSelector.clearOptions()
    
    for(var ind in this.layoutJSON){
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


    if(!jQuery.isEmptyObject(this.layoutJSON)){
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

        if(this.currentLayoutName!=null){
            switchLayoutSelector.triggerOptionValue(this.currentLayoutName)
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
                        delete this.layoutJSON[layoutName]
                        if (layoutName == this.currentLayoutName) this.currentLayoutName = null
                        this.broadcastMessage({ "message": "layoutsUpdated" })
                        $.post("layout/saveLayouts", { "adtName": this.getCurADTName(), "layouts": JSON.stringify(this.layoutJSON) })
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
},{"./adtInstanceSelectionDialog":1,"./simpleConfirmDialog":8,"./simpleSelectMenu":9}],4:[function(require,module,exports){
const adtInstanceSelectionDialog = require("./adtInstanceSelectionDialog");
const modelAnalyzer = require("./modelAnalyzer");
const simpleSelectMenu= require("./simpleSelectMenu")

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
    this.continerDOM.append(this.DOM)
    $('body').append(this.continerDOM)
    this.DOM.html("<a style='display:block;font-style:italic;color:gray'>Choose twins or relationships to view infomration</a><a style='display:block;font-style:italic;color:gray;padding-top:20px'>Press shift key to select multiple in topology view</a><a style='display:block;font-style:italic;color:gray;padding-top:20px'>Press ctrl key to select multiple in tree view</a>")

    this.selectedObjects=null;
}

infoPanel.prototype.rxMessage=function(msgPayload){   
    if(msgPayload.message=="ADTDatasourceDialog_closed"){
        if(!this.continerDOM.is(":visible")) {
            this.continerDOM.show()
            this.continerDOM.addClass("w3-animate-right")
        }
    }else if(msgPayload.message=="selectNodes"){
        this.DOM.empty()
        var arr=msgPayload.info;
        this.selectedObjects=arr;
        if(arr.length==1){
            var singleElementInfo=arr[0];
            
            if(singleElementInfo["$dtId"]){// select a node
                this.drawButtons("singleNode")
                this.drawStaticInfo(this.DOM,{"$dtId":singleElementInfo["$dtId"]},"1em","13px")
                var modelName=singleElementInfo['$metadata']['$model']
                
                if(modelAnalyzer.DTDLModels[modelName]){
                    this.drawEditable(this.DOM,modelAnalyzer.DTDLModels[modelName].editableProperties,singleElementInfo,[])
                }
                this.drawStaticInfo(this.DOM,{"$etag":singleElementInfo["$etag"],"$metadata":singleElementInfo["$metadata"]},"1em","10px")
            }else if(singleElementInfo["$sourceId"]){
                this.drawButtons("singleRelationship")
                this.drawStaticInfo(this.DOM,{
                    "$sourceId":singleElementInfo["$sourceId"],
                    "$targetId":singleElementInfo["$targetId"],
                    "$relationshipName":singleElementInfo["$relationshipName"],
                    "$relationshipId":singleElementInfo["$relationshipId"]
                },"1em","13px")
                var relationshipName=singleElementInfo["$relationshipName"]
                var sourceModel=singleElementInfo["sourceModel"]
                
                this.drawEditable(this.DOM,this.getRelationShipEditableProperties(relationshipName,sourceModel),singleElementInfo,[])
                this.drawStaticInfo(this.DOM,{"$etag":singleElementInfo["$etag"]},"1em","10px","DarkGray")
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
            $.post("editADT/upsertDigitalTwin", {"newTwinJson":JSON.stringify(twinJson)}
                , (data) => {
                    if (data != "") {//not successful editing
                        alert(data)
                    } else {
                        //successful editing, update the node original info
                        var keyLabel=this.DOM.find('#NEWTWIN_IDLabel')
                        var IDInput=keyLabel.find("input")
                        if(IDInput) IDInput.val("")
                        $.post("queryADT/oneTwinInfo",{twinID:twinJson["$dtId"]}, (data)=> {
                            if(data=="") return;
                            adtInstanceSelectionDialog.storedTwins[data["$dtId"]] = data;
                            this.broadcastMessage({ "message": "addNewTwin",twinInfo:data})
                        })                        
                    }
                });
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

infoPanel.prototype.getRelationShipEditableProperties=function(relationshipName,sourceModel){
    if(!modelAnalyzer.DTDLModels[sourceModel] || !modelAnalyzer.DTDLModels[sourceModel].validRelationships[relationshipName]) return
    return modelAnalyzer.DTDLModels[sourceModel].validRelationships[relationshipName].editableRelationshipProperties
}

infoPanel.prototype.drawButtons=function(selectType){
    var refreshBtn=$('<button class="w3-bar-item w3-button w3-black"><i class="fa fa-refresh"></i></button>')
    refreshBtn.on("click",()=>{this.refreshInfomation()})
    this.DOM.append(refreshBtn)

    if(selectType=="singleRelationship"){
        var delBtn =  $('<button style="width:80%" class="w3-button w3-red w3-hover-pink w3-border">Delete All</button>')
        this.DOM.append(delBtn)
        delBtn.on("click",()=>{this.deleteSelected()})
    }else if(selectType=="singleNode" || selectType=="multiple"){
        var delBtn = $('<button style="width:80%" class="w3-button w3-red w3-hover-pink w3-border">Delete All</button>')
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

infoPanel.prototype.refreshInfomation=async function(){
    var arr=this.selectedObjects;
    var queryArr=[]
    arr.forEach(oneItem=>{
        if(oneItem['$relationshipId']) queryArr.push({'$sourceId':oneItem['$sourceId'],'$relationshipId':oneItem['$relationshipId']})
        else queryArr.push({'$dtId':oneItem['$dtId']})
    })

    $.post("queryADT/fetchInfomation",{"elements":queryArr},  (data)=> {
        if(data=="") return;
        data.forEach(oneRe=>{
            if(oneRe["$relationshipId"]){//update storedOutboundRelationships
                var srcID= oneRe['$sourceId']
                var relationshipId= oneRe['$relationshipId']
                if(adtInstanceSelectionDialog.storedOutboundRelationships[srcID]!=null){
                    var relations=adtInstanceSelectionDialog.storedOutboundRelationships[srcID]
                    relations.forEach(oneStoredRelation=>{
                        if(oneStoredRelation['$relationshipId']==relationshipId){
                            //update all content
                            for(var ind in oneRe){ oneStoredRelation[ind]=oneRe[ind] }
                        }
                    })
                }
            }else{//update storedTwins
                var twinID= oneRe['$dtId']
                if(adtInstanceSelectionDialog.storedTwins[twinID]!=null){
                    for(var ind in oneRe){ adtInstanceSelectionDialog.storedTwins[twinID][ind]=oneRe[ind] }
                }
            }
        })
        
        //redraw infopanel if needed
        if(this.selectedObjects.length==1) this.rxMessage({ "message": "selectNodes", info: this.selectedObjects })
    });
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
    var confirmDialogDiv=$("<div/>")
    var dialogStr=""
    var twinNumber=twinIDArr.length;
    var relationsNumber = relationsArr.length;
    if(twinNumber>0) dialogStr =  twinNumber+" twin"+((twinNumber>1)?"s":"") + " (with connected relations)"
    if(twinNumber>0 && relationsNumber>0) dialogStr+=" and additional "
    if(relationsNumber>0) dialogStr +=  relationsNumber+" relation"+((relationsNumber>1)?"s":"" )
    dialogStr+=" will be deleted. Please confirm"
    confirmDialogDiv.text(dialogStr)
    $('body').append(confirmDialogDiv)
    confirmDialogDiv.dialog({
        buttons: [
          {
            text: "Confirm",
            click: ()=> {
                if(twinIDArr.length>0) this.deleteTwins(twinIDArr)
                if(relationsArr.length>0) this.deleteRelations(relationsArr)
                confirmDialogDiv.dialog( "destroy" );
                this.DOM.empty()
            }
          },
          {
            text: "Cancel",
            click: ()=> {
                confirmDialogDiv.dialog( "destroy" );
            }
          }
        ]
      }); 
}

infoPanel.prototype.deleteTwins=async function(twinIDArr){   
    while(twinIDArr.length>0){
        var smallArr= twinIDArr.splice(0, 100);
        var result=await this.deletePartialTwins(smallArr)

        result.forEach((oneID)=>{
            delete adtInstanceSelectionDialog.storedTwins[oneID]
            delete adtInstanceSelectionDialog.storedOutboundRelationships[oneID]
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
        adtInstanceSelectionDialog.storeTwinRelationships_remove(data)
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
        var smallArr= twinIDArr.splice(0, 100);
        var data=await this.fetchPartialOutbounds(smallArr)
        if(data=="") continue;
        //new twin's relationship should be stored as well
        adtInstanceSelectionDialog.storeTwinRelationships(data.newTwinRelations)
        
        data.childTwinsAndRelations.forEach(oneSet=>{
            for(var ind in oneSet.childTwins){
                var oneTwin=oneSet.childTwins[ind]
                adtInstanceSelectionDialog.storedTwins[ind]=oneTwin
            }
        })
        this.broadcastMessage({ "message": "drawTwinsAndRelations",info:data})
        

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
        var data=await this.fetchPartialInbounds(smallArr)
        if(data=="") continue;
        //new twin's relationship should be stored as well
        adtInstanceSelectionDialog.storeTwinRelationships(data.newTwinRelations)
        
        //data.newTwinRelations.forEach(oneRelation=>{console.log(oneRelation['$sourceId']+"->"+oneRelation['$targetId'])})
        //console.log(adtInstanceSelectionDialog.storedOutboundRelationships["default"])

        data.childTwinsAndRelations.forEach(oneSet=>{
            for(var ind in oneSet.childTwins){
                var oneTwin=oneSet.childTwins[ind]
                adtInstanceSelectionDialog.storedTwins[ind]=oneTwin
            }
        })
        this.broadcastMessage({ "message": "drawTwinsAndRelations",info:data})
    }
}

infoPanel.prototype.fetchPartialOutbounds= async function(IDArr){
    return new Promise((resolve, reject) => {
        try{
            //find out those existed outbound with known target Twins so they can be excluded from query
            var knownTargetTwins={}
            IDArr.forEach(oneID=>{
                knownTargetTwins[oneID]=1 //itself also is known
                var outBoundRelation=adtInstanceSelectionDialog.storedOutboundRelationships[oneID]
                if(outBoundRelation){
                    outBoundRelation.forEach(oneRelation=>{
                        var targetID=oneRelation["$targetId"]
                        if(adtInstanceSelectionDialog.storedTwins[targetID]!=null) knownTargetTwins[targetID]=1
                    })
                }
            })

            $.post("queryADT/showOutBound",{arr:IDArr,"knownTargets":knownTargetTwins}, function (data) {
                resolve(data)
            });
        }catch(e){
            reject(e)
        }
    })
}

infoPanel.prototype.fetchPartialInbounds= async function(IDArr){
    return new Promise((resolve, reject) => {
        try{
            //find out those existed inbound with known source Twins so they can be excluded from query
            var knownSourceTwins={}
            var IDDict={}
            IDArr.forEach(oneID=>{
                IDDict[oneID]=1
                knownSourceTwins[oneID]=1 //itself also is known
            })
            for(var twinID in adtInstanceSelectionDialog.storedOutboundRelationships){
                var relations=adtInstanceSelectionDialog.storedOutboundRelationships[twinID]
                relations.forEach(oneRelation=>{
                    var targetID=oneRelation['$targetId']
                    var srcID=oneRelation['$sourceId']
                    if(IDDict[targetID]!=null){
                        if(adtInstanceSelectionDialog.storedTwins[srcID]!=null) knownSourceTwins[srcID]=1
                    }
                })
            }

            $.post("queryADT/showInBound",{arr:IDArr,"knownSources":knownSourceTwins}, function (data) {
                resolve(data)
            });
        }catch(e){
            reject(e)
        }
    })
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
    aSelectMenu.callBack_clickOption=(optionText,optionValue)=>{
        aSelectMenu.changeName(optionText)
        this.editDTProperty(originElementInfo,aSelectMenu.DOM.data("path"),optionValue,"string",isNewTwin)
    }
    var val=this.searchValue(originElementInfo,newPath)
    if(val!=null){
        aSelectMenu.triggerOptionValue(val)
    }    
}

infoPanel.prototype.editDTProperty=function(originElementInfo,path,newVal,dataType,isNewTwin){
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
    
    $.post("editADT/changeAttribute",payLoad
        ,  (data)=> {
            if(data!="") {
                //not successful editing
                alert(data)
            }else{
                //successful editing, update the node original info
                this.updateOriginObjectValue(originElementInfo,path,newVal)
            }
        });
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
},{"./adtInstanceSelectionDialog":1,"./modelAnalyzer":6,"./simpleSelectMenu":9}],5:[function(require,module,exports){
const adtInstanceSelectionDialog = require("./adtInstanceSelectionDialog")
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

    this.switchADTInstanceBtn.on("click",()=>{ adtInstanceSelectionDialog.popup() })
    this.modelIOBtn.on("click",()=>{ modelManagerDialog.popup() })
    this.editLayoutBtn.on("click",()=>{ editLayoutDialog.popup() })


    this.switchLayoutSelector.callBack_clickOption=(optionText,optionValue)=>{
        editLayoutDialog.currentLayoutName=optionValue
        this.broadcastMessage({ "message": "layoutChange"})
        if(optionValue=="[NA]") this.switchLayoutSelector.changeName("Layout","")
        else this.switchLayoutSelector.changeName("Layout:",optionText)
    }
}

mainToolbar.prototype.updateLayoutSelector = function () {
    var curSelect=this.switchLayoutSelector.curSelectVal
    this.switchLayoutSelector.clearOptions()
    this.switchLayoutSelector.addOption('[No Layout Specified]','[NA]')

    for (var ind in editLayoutDialog.layoutJSON) {
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
},{"./adtInstanceSelectionDialog":1,"./editLayoutDialog":3,"./modelManagerDialog":7,"./simpleSelectMenu":9}],6:[function(require,module,exports){
//This is a singleton class

function modelAnalyzer(){
    this.DTDLModels={}
    this.relationshipTypes={}
}

modelAnalyzer.prototype.clearAllModels=function(){
    console.log("clear all model info")
    for(var id in this.DTDLModels) delete this.DTDLModels[id]
}

modelAnalyzer.prototype.addModels=function(arr){
    arr.forEach((ele)=>{
        var modelID= ele["@id"]
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
    console.log("analyze model info")
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
const adtInstanceSelectionDialog = require("./adtInstanceSelectionDialog")
const simpleConfirmDialog = require("./simpleConfirmDialog")

function modelManagerDialog() {
    this.visualDefinition={}
    this.models={}
    if(!this.DOM){
        this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:99" class="w3-card-2"></div>')
        this.DOM.css("overflow","hidden")
        $("body").append(this.DOM)
        this.DOM.hide()
    }
}

modelManagerDialog.prototype.preparationFunc = async function () {
    return new Promise((resolve, reject) => {
        try{
            $.get("visualDefinition/readVisualDefinition", (data, status) => {
                if(data!="" && typeof(data)==="object") this.visualDefinition=data;
                resolve()
            })
        }catch(e){
            reject(e)
        }
    })
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
    this.contentDOM.children(':first').append(importModelsBtn,actualImportModelsBtn)
    importModelsBtn.on("click", ()=>{
        actualImportModelsBtn.trigger('click');
    });
    actualImportModelsBtn.change((evt)=>{
        var files = evt.target.files; // FileList object
        this.readModelFilesContentAndImport(files)
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
    
    var rightSpan=$('<div class="w3-container w3-cell"></div>')
    row2.append(rightSpan) 
    var panelCardOut=$('<div class="w3-card-2 w3-white" style="margin-top:2px"></div>')

    this.modelButtonBar=$('<div class="w3-bar" style="height:35px"></div>')
    panelCardOut.append(this.modelButtonBar)

    rightSpan.append(panelCardOut)
    var panelCard=$('<div style="width:400px;height:405px;overflow:auto;margin-top:2px"></div>')
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

modelManagerDialog.prototype.fillRightSpan=async function(modelName){
    this.panelCard.empty()
    var modelID=this.models[modelName]['@id']

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

        var visualJson=this.visualDefinition[adtInstanceSelectionDialog.selectedADT]
        if(!visualJson[modelID]) visualJson[modelID]={}
        visualJson[modelID].avarta=dataUrl
        this.saveVisualDefinition()
        this.broadcastMessage({ "message": "visualDefinitionChange", "modelID":modelID,"avarta":dataUrl })
    })

    clearAvartaBtn.on("click", ()=>{
        var visualJson=this.visualDefinition[adtInstanceSelectionDialog.selectedADT]
        if(visualJson[modelID]) delete visualJson[modelID].avarta 
        if(this.avartaImg) this.avartaImg.removeAttr('src');
        this.saveVisualDefinition()
        this.broadcastMessage({ "message": "visualDefinitionChange", "modelID":modelID,"noAvarta":true })
    });


    delBtn.on("click",()=>{
        var confirmDialogDiv = new simpleConfirmDialog()

        confirmDialogDiv.show(
            { width: "250px" },
            {
                title: "Warning"
                , content: "This will DELETE model \"" + modelID + "\""
                , buttons: [
                    {
                        colorClass: "w3-red w3-hover-pink", text: "Confirm", "clickFunc": () => {
                            confirmDialogDiv.close();
                            $.post("editADT/deleteModel",{"model":modelID}, (data)=> {
                                if(data==""){//successful
                                    this.listModels("shouldBroadcast")
                                    this.panelCard.empty()
                                    if(this.visualDefinition[adtInstanceSelectionDialog.selectedADT] && this.visualDefinition[adtInstanceSelectionDialog.selectedADT][modelID] ){
                                        delete this.visualDefinition[adtInstanceSelectionDialog.selectedADT][modelID]
                                        this.saveVisualDefinition()
                                    }
                                }else{ //error happens
                                    alert(data)
                                }
                            });
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

    var str=JSON.stringify(this.models[modelName],null,2)
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
    var visualJson=this.visualDefinition[adtInstanceSelectionDialog.selectedADT]
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

    var definiedColor=null
    var visualJson=this.visualDefinition[adtInstanceSelectionDialog.selectedADT]
    if(relatinshipName==null){
        if(visualJson && visualJson[modelID] && visualJson[modelID].color) definiedColor=visualJson[modelID].color
    }else{
        if(visualJson && visualJson[modelID]
             && visualJson[modelID]["relationships"]
              && visualJson[modelID]["relationships"][relatinshipName])
              definiedColor=visualJson[modelID]["relationships"][relatinshipName]
    }

    var colorSelector=$('<select class="w3-border" style="outline:none"></select>')
    containerDiv.append(colorSelector)
    var colorArr=["Black","LightGray","Red","Green","Blue","Bisque","Brown","Coral","Crimson","DodgerBlue","Gold"]
    colorArr.forEach((oneColorCode)=>{
        var anOption=$("<option value='"+oneColorCode+"'>"+oneColorCode+"▧</option>")
        colorSelector.append(anOption)
        anOption.css("color",oneColorCode)
    })
    if(definiedColor!=null) {
        colorSelector.val(definiedColor)
        colorSelector.css("color",definiedColor)
    }
    colorSelector.change((eve)=>{
        var selectColorCode=eve.target.value
        colorSelector.css("color",selectColorCode)
        if(!this.visualDefinition[adtInstanceSelectionDialog.selectedADT]) 
            this.visualDefinition[adtInstanceSelectionDialog.selectedADT]={}
        var visualJson=this.visualDefinition[adtInstanceSelectionDialog.selectedADT]

        if(!visualJson[modelID]) visualJson[modelID]={}
        if(!relatinshipName) {
            visualJson[modelID].color=selectColorCode
            this.broadcastMessage({ "message": "visualDefinitionChange", "modelID":modelID,"color":selectColorCode })
        }else{
            if(!visualJson[modelID]["relationships"]) visualJson[modelID]["relationships"]={}
            visualJson[modelID]["relationships"][relatinshipName]=selectColorCode
            this.broadcastMessage({ "message": "visualDefinitionChange", "srcModelID":modelID,"relationshipName":relatinshipName,"color":selectColorCode })
        }
        this.saveVisualDefinition()
    })
}

modelManagerDialog.prototype.saveVisualDefinition=function(){
    $.post("visualDefinition/saveVisualDefinition",{visualDefinitionJson:this.visualDefinition})
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
            fileContentArr.push(obj)
        }catch(err){
            alert(err)
        }
    }
    if(fileContentArr.length==0) return;
    console.log(fileContentArr)
    $.post("editADT/importModels",{"models":fileContentArr}, (data)=> {
        if (data == "") {//successful
            this.listModels("shouldBroadCast")
        } else { //error happens
            alert(data)
        }
    });
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

modelManagerDialog.prototype.assignEventToOneModel=function(oneModel){
    oneModel.on("click",(e)=>{
        this.modelList.children().each((index,ele)=>{
            $(ele).removeClass("w3-amber")
        })
        oneModel.addClass("w3-amber")
        var modelName = oneModel.data('modelName')
        if(modelName) this.fillRightSpan(modelName)
    })
}

modelManagerDialog.prototype.listModels=function(shouldBroadcast){
    this.modelList.empty()
    for(var ind in this.models) delete this.models[ind]
    $.get("queryADT/listModels", (data, status) => {
        if(data=="") data=[]
        data.forEach(oneItem=>{
            if(oneItem["displayName"]==null) oneItem["displayName"]=oneItem["@id"]
            this.models[oneItem["displayName"]] = oneItem
        })
        if(shouldBroadcast){
            modelAnalyzer.clearAllModels();
            modelAnalyzer.addModels(data)
            modelAnalyzer.analyze();
        }
        
        if(data.length==0){
            var zeroModelItem=$('<li style="font-size:0.9em">zero model record. Please import...</li>')
            this.modelList.append(zeroModelItem)
            zeroModelItem.css("cursor","default")
        }else{
            var sortArr=[]
            for(var modelName in this.models) sortArr.push(modelName)
            sortArr.sort(function (a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()) });
            sortArr.forEach(oneModelName=>{
                var oneModelItem=$('<li style="font-size:0.9em">'+oneModelName+'</li>')
                oneModelItem.css("cursor","default")
                oneModelItem.data("modelName", oneModelName)
                this.modelList.append(oneModelItem)
                this.assignEventToOneModel(oneModelItem)
            })
        }
        
        if(shouldBroadcast) this.broadcastMessage({ "message": "ADTModelsChange", "models":this.models })
    })
}


module.exports = new modelManagerDialog();
},{"./adtInstanceSelectionDialog":1,"./modelAnalyzer":6,"./simpleConfirmDialog":8}],8:[function(require,module,exports){
function simpleConfirmDialog(){
    this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:102" class="w3-card-4"></div>')
    this.DOM.css("overflow","hidden")
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
},{}],9:[function(require,module,exports){
function simpleSelectMenu(buttonName,options){
    options=options||{} //{isClickable:1,withBorder:1,fontSize:"",colorClass:"",buttonCSS:""}
    if(options.isClickable){
        this.isClickable=true
        this.DOM=$('<div class="w3-dropdown-click"></div>')
    }else{
        this.DOM=$('<div class="w3-dropdown-hover "></div>')
    }
    
    this.button=$('<button class="w3-button" style="outline: none;"><a>'+buttonName+'</a><a style="font-weight:bold;padding-left:2px"></a><i class="fa fa-caret-down" style="padding-left:3px"></i></button>')
    if(options.withBorder) this.button.addClass("w3-border")
    if(options.fontSize) this.DOM.css("font-size",options.fontSize)
    if(options.colorClass) this.button.addClass(options.colorClass)
    if(options.width) this.button.css("width",options.width)
    if(options.buttonCSS) this.button.css(options.buttonCSS)


    this.optionContentDOM=$('<div class="w3-dropdown-content w3-bar-block w3-card-4">')
    this.DOM.append(this.button,this.optionContentDOM)
    this.curSelectVal=null;

    if(options.isClickable){
        this.button.on("click",(e)=>{
            if(this.optionContentDOM.hasClass("w3-show"))  this.optionContentDOM.removeClass("w3-show")
            else this.optionContentDOM.addClass("w3-show")
        })    
    }
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
        this.callBack_clickOption(optionText,optionItem.data("optionValue"))
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

simpleSelectMenu.prototype.callBack_clickOption=function(optiontext,optionValue){

}

module.exports = simpleSelectMenu;
},{}],10:[function(require,module,exports){
'use strict';

function simpleTree(DOM){
    this.DOM=DOM
    this.groupNodes=[] //each group header is one node
    this.selectedNodes=[];
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
    if(existGroupNode!=null) return;
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

//----------------------------------tree group node---------------
function simpleTreeGroupNode(parentTree,obj){
    this.parentTree=parentTree
    this.info=obj
    this.childLeafNodes=[] //it's child leaf nodes array
    this.name=obj.displayName;
    this.createDOM()
}

simpleTreeGroupNode.prototype.refreshName=function(){
    this.headerDOM.text(this.name+"("+this.childLeafNodes.length+")")
    if(this.childLeafNodes.length>0) this.headerDOM.css("font-weight","bold")
    else this.headerDOM.css("font-weight","normal")

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


simpleTreeGroupNode.prototype.addNode=function(obj,skipRepeat){
    if(skipRepeat){
        var foundRepeat=false;
        this.childLeafNodes.forEach(aNode=>{
            if(aNode.name==obj["$dtId"]) {
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
    this.name=this.leafInfo["$dtId"]
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
},{}],11:[function(require,module,exports){
'use strict';

const modelManagerDialog = require("./modelManagerDialog");
const adtInstanceSelectionDialog = require("./adtInstanceSelectionDialog");
const modelAnalyzer = require("./modelAnalyzer");
const editLayoutDialog = require("./editLayoutDialog")
const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
});
const simpleSelectMenu = require("./simpleSelectMenu")


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
                    ,'background-fit':'contain' //cover
                    //'background-color': function( ele ){ return ele.data('bg') }
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
    
    this.core.on('zoom',(e)=>{
        var fs=this.getFontSizeInCurrentZoom();
        var dimension=this.getNodeSizeInCurrentZoom();
        this.core.style()
                .selector('node')
                .style({ 'font-size': fs, width:dimension ,height:dimension })
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
topologyDOM.prototype.updateRelationshipColor=function(srcModelID,relationshipName,colorCode){
    this.core.style()
        .selector('edge[sourceModel = "'+srcModelID+'"][relationshipName = "'+relationshipName+'"]')
        .style({'line-color': colorCode})
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
        newNode.data["id"]=originalInfo['$dtId']
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
        aRelation.data["source"]=originalInfo['$sourceId']
        aRelation.data["target"]=originalInfo['$targetId']
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
    for(var twinID in adtInstanceSelectionDialog.storedOutboundRelationships){
        storedRelationArr=storedRelationArr.concat(adtInstanceSelectionDialog.storedOutboundRelationships[twinID])
    }
    this.drawRelations(storedRelationArr)
}

topologyDOM.prototype.drawTwinsAndRelations=function(data){
    var twinsAndRelations=data.childTwinsAndRelations
    var combineTwins=this.core.collection()

    //draw those new twins first
    twinsAndRelations.forEach(oneSet=>{
        var twinInfoArr=[]
        for(var ind in oneSet.childTwins) twinInfoArr.push(oneSet.childTwins[ind])
        var eles=this.drawTwins(twinInfoArr,"animation")
        combineTwins=combineTwins.union(eles)
    })

    //draw those known twins from the relationships
    var twinsInfo={}
    twinsAndRelations.forEach(oneSet=>{
        var relationsInfo=oneSet["relationships"]
        relationsInfo.forEach((oneRelation)=>{
            var srcID=oneRelation['$sourceId']
            var targetID=oneRelation['$targetId']
            if(adtInstanceSelectionDialog.storedTwins[srcID])
                twinsInfo[srcID] = adtInstanceSelectionDialog.storedTwins[srcID]
            if(adtInstanceSelectionDialog.storedTwins[targetID])
                twinsInfo[targetID] = adtInstanceSelectionDialog.storedTwins[targetID]    
        })
    })
    var tmpArr=[]
    for(var twinID in twinsInfo) tmpArr.push(twinsInfo[twinID])
    this.drawTwins(tmpArr)

    //then check all stored relationships and draw if it can be drawn
    this.reviewStoredRelationshipsToDraw()
}

topologyDOM.prototype.applyVisualDefinition=function(){
    var visualJson=modelManagerDialog.visualDefinition[adtInstanceSelectionDialog.selectedADT]
    if(visualJson==null) return;
    for(var modelID in visualJson){
        if(visualJson[modelID].color){
            this.updateModelTwinColor(modelID,visualJson[modelID].color)
        }
        if(visualJson[modelID].avarta){
            this.updateModelAvarta(modelID,visualJson[modelID].avarta)
        }
        if(visualJson[modelID].relationships){
            for(var relationshipName in visualJson[modelID].relationships)
                this.updateRelationshipColor(modelID,relationshipName,visualJson[modelID].relationships[relationshipName])
        }
    }
}

topologyDOM.prototype.rxMessage=function(msgPayload){
    if(msgPayload.message=="ADTDatasourceChange_replace"){
        this.core.nodes().remove()
        this.applyVisualDefinition()
    }else if(msgPayload.message=="replaceAllTwins") {
        this.core.nodes().remove()
        var eles= this.drawTwins(msgPayload.info)
        this.core.center(eles)
    }else if(msgPayload.message=="appendAllTwins") {
        var eles= this.drawTwins(msgPayload.info,"animate")
        this.core.center(eles)
        this.reviewStoredRelationshipsToDraw()
    }else if(msgPayload.message=="drawAllRelations"){
        var edges= this.drawRelations(msgPayload.info)
        if(edges!=null) {
            if(editLayoutDialog.currentLayoutName==null)  this.noPosition_cose()
        }
    }else if(msgPayload.message=="addNewTwin") {
        this.drawTwins([msgPayload.twinInfo],"animation")
    }else if(msgPayload.message=="drawTwinsAndRelations") this.drawTwinsAndRelations(msgPayload.info)
    else if(msgPayload.message=="selectNodes"){
        this.core.nodes().unselect()
        this.core.edges().unselect()
        var arr=msgPayload.info;
        var mouseClickDetail=msgPayload.mouseClickDetail;
        arr.forEach(element => {
            var aTwin= this.core.nodes("#"+element['$dtId'])
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
        if(msgPayload.srcModelID) this.updateRelationshipColor(msgPayload.srcModelID,msgPayload.relationshipName,msgPayload.color)
        else{
            if(msgPayload.color) this.updateModelTwinColor(msgPayload.modelID,msgPayload.color)
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
    var layoutName=editLayoutDialog.currentLayoutName
    
    var layoutDetail= editLayoutDialog.layoutJSON[layoutName]
    
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
    var layoutDict=editLayoutDialog.layoutJSON[layoutName]
    if(!layoutDict){
        layoutDict=editLayoutDialog.layoutJSON[layoutName]={}
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

    $.post("layout/saveLayouts",{"adtName":adtName,"layouts":JSON.stringify(editLayoutDialog.layoutJSON)})
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
    var confirmDialogDiv =  $('<div title="Add connections"></div>')
    var resultActions=[]
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
            resultActions.push({from:fromNode.id(),to:toNode.id(),connect:connectionTypes[0]})
            switchTypeSelector.callBack_clickOption=(optionText,optionValue)=>{
                resultActions[index][2]=optionText
                switchTypeSelector.changeName(optionText)
            }
            switchTypeSelector.triggerOptionIndex(0)
        }else if(connectionTypes.length==1){
            resultActions.push({from:fromNode.id(),to:toNode.id(),connect:connectionTypes[0]})
            label.css("color","green")
            label.html("Add <b>"+connectionTypes[0]+"</b> connection from <b>"+fromNode.id()+"</b> to <b>"+toNode.id()+"</b>") 
        }
        confirmDialogDiv.append(label)
    })

    $('body').append(confirmDialogDiv)
    confirmDialogDiv.dialog({
        width:450
        ,height:300
        ,resizable:false
        ,buttons: [
            {
                text: "Confirm",
                click: () => {
                    this.createConnections(resultActions)
                    confirmDialogDiv.dialog("destroy")
                }
            },
            {
                text: "Cancel",
                click: () => { confirmDialogDiv.dialog("destroy") }
            }
        ]
    });
}

topologyDOM.prototype.createConnections = function (resultActions) {
    // for each resultActions, calculate the appendix index, to avoid same ID is used for existed connections
    resultActions.forEach(oneAction=>{
        var maxExistedConnectionNumber=0
        var existedRelations=adtInstanceSelectionDialog.storedOutboundRelationships[oneAction.from]
        if(existedRelations==null) existedRelations=[]
        existedRelations.forEach(oneRelation=>{
            var oneRelationID=oneRelation['$relationshipId']
            if(oneRelation["$targetId"]!=oneAction.to) return
            var lastIndex= oneRelationID.split(";").pop()
            lastIndex=parseInt(lastIndex)
            if(maxExistedConnectionNumber<=lastIndex) maxExistedConnectionNumber=lastIndex+1
        })
        oneAction.IDindex=maxExistedConnectionNumber
    })

    $.post("editADT/createRelations",{actions:resultActions}, (data, status) => {
        if(data=="") return;
        adtInstanceSelectionDialog.storeTwinRelationships_append(data)
        this.drawRelations(data)
    })
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
},{"./adtInstanceSelectionDialog":1,"./editLayoutDialog":3,"./modelAnalyzer":6,"./modelManagerDialog":7,"./simpleSelectMenu":9}],12:[function(require,module,exports){
const simpleTree=require("./simpleTree")
const modelAnalyzer=require("./modelAnalyzer")
const adtInstanceSelectionDialog = require("./adtInstanceSelectionDialog")

function twinsTree(DOM, searchDOM) {
    this.tree=new simpleTree(DOM)
    this.modelIDMapToName={}

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
    if(msgPayload.message=="ADTDatasourceChange_replace") this.ADTDatasourceChange_replace(msgPayload.query, msgPayload.twins,msgPayload.ADTInstanceDoesNotChange)
    else if(msgPayload.message=="ADTDatasourceChange_append") this.ADTDatasourceChange_append(msgPayload.query, msgPayload.twins)
    else if(msgPayload.message=="drawTwinsAndRelations") this.drawTwinsAndRelations(msgPayload.info)
    else if(msgPayload.message=="ADTModelsChange") this.refreshModels(msgPayload.models)
    else if(msgPayload.message=="addNewTwin") this.drawOneTwin(msgPayload.twinInfo)
    else if(msgPayload.message=="twinsDeleted") this.deleteTwins(msgPayload.twinIDArr)
}

twinsTree.prototype.deleteTwins=function(twinIDArr){
    twinIDArr.forEach(twinID=>{
        this.tree.deleteLeafNode(twinID)
    })
}

twinsTree.prototype.refreshModels=function(modelsData){
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


twinsTree.prototype.ADTDatasourceChange_append=function(twinQueryStr,twinsData){
    if (twinsData != null) this.appendAllTwins(twinsData)
    else {
        $.post("queryADT/allTwinsInfo", { query: twinQueryStr }, (data) => {
            if(data=="") return;
            data.forEach((oneNode)=>{adtInstanceSelectionDialog.storedTwins[oneNode["$dtId"]] = oneNode});
            this.appendAllTwins(data)
        })
    }
}

twinsTree.prototype.ADTDatasourceChange_replace=function(twinQueryStr,twinsData,ADTInstanceDoesNotChange){
    var theTree= this.tree;

    if (ADTInstanceDoesNotChange) {
        //keep all group node as model is the same, only fetch all leaf node again
        //remove all leaf nodes
        this.tree.clearAllLeafNodes()
        if (twinsData != null) this.replaceAllTwins(twinsData)
        else {
            $.post("queryADT/allTwinsInfo", { query: twinQueryStr }, (data) => {
                if(data=="") data=[];
                data.forEach((oneNode)=>{adtInstanceSelectionDialog.storedTwins[oneNode["$dtId"]] = oneNode});
                this.replaceAllTwins(data)
            })
        }
    }else{
        theTree.removeAllNodes()
        for (var id in this.modelIDMapToName) delete this.modelIDMapToName[id]
        //query to get all models
        $.get("queryADT/listModels", (data, status) => {
            if(data=="") data=[]
            var tmpNameArr = []
            var tmpNameToObj = {}
            for (var i = 0; i < data.length; i++) {
                if(data[i]["displayName"]==null) data[i]["displayName"]=data[i]["@id"]
                this.modelIDMapToName[data[i]["@id"]] = data[i]["displayName"]
                tmpNameArr.push(data[i]["displayName"])
                tmpNameToObj[data[i]["displayName"]] = data[i]
            }
            tmpNameArr.sort(function (a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()) });
            tmpNameArr.forEach(modelName => {
                var newGroup = theTree.addGroupNode(tmpNameToObj[modelName])
                newGroup.shrink()
            })
            modelAnalyzer.clearAllModels();
            modelAnalyzer.addModels(data)
            modelAnalyzer.analyze();

            if (twinsData != null) this.replaceAllTwins(twinsData)
            else {
                $.post("queryADT/allTwinsInfo", { query: twinQueryStr }, (data) => {
                    if(data=="") data=[];
                    data.forEach((oneNode)=>{adtInstanceSelectionDialog.storedTwins[oneNode["$dtId"]] = oneNode});
                    this.replaceAllTwins(data)
                })
            }
        })
    }
}

twinsTree.prototype.drawTwinsAndRelations= function(data){
    data.childTwinsAndRelations.forEach(oneSet=>{
        for(var ind in oneSet.childTwins){
            var oneTwin=oneSet.childTwins[ind]
            this.drawOneTwin(oneTwin)
        }
    })
}
twinsTree.prototype.drawOneTwin= function(twinInfo){
    var groupName=this.modelIDMapToName[twinInfo["$metadata"]["$model"]]
    this.tree.addLeafnodeToGroup(groupName,twinInfo,"skipRepeat")
}

twinsTree.prototype.appendAllTwins= function(data){
    var twinIDArr=[]
    //check if any current leaf node does not have stored outbound relationship data yet
    this.tree.groupNodes.forEach((gNode)=>{
        gNode.childLeafNodes.forEach(leafNode=>{
            var nodeId=leafNode.leafInfo["$dtId"]
            if(adtInstanceSelectionDialog.storedOutboundRelationships[nodeId]==null) twinIDArr.push(nodeId)
        })
    })

    this.broadcastMessage({ "message": "appendAllTwins",info:data})
    for(var i=0;i<data.length;i++){
        var groupName=this.modelIDMapToName[data[i]["$metadata"]["$model"]]
        this.tree.addLeafnodeToGroup(groupName,data[i],"skipRepeat")
        twinIDArr.push(data[i]["$dtId"])
    }

    this.fetchAllRelationships(twinIDArr)
}

twinsTree.prototype.replaceAllTwins= function(data){
    var twinIDArr=[]
    this.broadcastMessage({ "message": "replaceAllTwins",info:data})
    for(var i=0;i<data.length;i++){
        var groupName=this.modelIDMapToName[data[i]["$metadata"]["$model"]]
        this.tree.addLeafnodeToGroup(groupName,data[i])
        twinIDArr.push(data[i]["$dtId"])
    }
    this.fetchAllRelationships(twinIDArr)
}

twinsTree.prototype.fetchAllRelationships= async function(twinIDArr){
    while(twinIDArr.length>0){
        var smallArr= twinIDArr.splice(0, 100);
        var data=await this.fetchPartialRelationships(smallArr)
        if(data=="") continue;
        adtInstanceSelectionDialog.storeTwinRelationships(data) //store them in global available array
        this.broadcastMessage({ "message": "drawAllRelations",info:data})
    }
}

twinsTree.prototype.fetchPartialRelationships= async function(IDArr){
    return new Promise((resolve, reject) => {
        try{
            $.post("queryADT/allRelationships",{arr:IDArr}, function (data) {
                resolve(data)
            });
        }catch(e){
            reject(e)
        }
    })
}

module.exports = twinsTree;
},{"./adtInstanceSelectionDialog":1,"./modelAnalyzer":6,"./simpleTree":10}],13:[function(require,module,exports){
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
    "taskMasterAPIURI":((isLocalTest)?"http://localhost:5000/":"https://azureiotrockstaskmastermodule.azurewebsites.net/")
}

module.exports = globalAppSettings;
},{}],14:[function(require,module,exports){
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
    this.username = theAccount.username;
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
        $.ajax({
            type: RESTMethod || 'GET',
            "headers":headersObj,
            url: globalAppSettings.taskMasterAPIURI+APIString,
            crossDomain: true,
            success: function (responseData, textStatus, jqXHR) {
                resolve(responseData)
            },
            error: function (responseData, textStatus, errorThrown) {
                reject(responseData)
            }
        });
    })
}

msalHelper.prototype.getToken=async function(){
    try{
        if(this.storedToken!=null){
            var currTime=parseInt(new Date().getTime()/1000)
            if(currTime+600 < this.storedTokenExp) return this.storedToken
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
},{"./globalAppSettings":13}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi9zcGFTb3VyY2VDb2RlL2RpZ2l0YWx0d2lubW9kdWxlL2FkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLmpzIiwiLi4vc3BhU291cmNlQ29kZS9kaWdpdGFsdHdpbm1vZHVsZS9kaWdpdGFsdHdpbm1vZHVsZVVJLmpzIiwiLi4vc3BhU291cmNlQ29kZS9kaWdpdGFsdHdpbm1vZHVsZS9lZGl0TGF5b3V0RGlhbG9nLmpzIiwiLi4vc3BhU291cmNlQ29kZS9kaWdpdGFsdHdpbm1vZHVsZS9pbmZvUGFuZWwuanMiLCIuLi9zcGFTb3VyY2VDb2RlL2RpZ2l0YWx0d2lubW9kdWxlL21haW5Ub29sYmFyLmpzIiwiLi4vc3BhU291cmNlQ29kZS9kaWdpdGFsdHdpbm1vZHVsZS9tb2RlbEFuYWx5emVyLmpzIiwiLi4vc3BhU291cmNlQ29kZS9kaWdpdGFsdHdpbm1vZHVsZS9tb2RlbE1hbmFnZXJEaWFsb2cuanMiLCIuLi9zcGFTb3VyY2VDb2RlL2RpZ2l0YWx0d2lubW9kdWxlL3NpbXBsZUNvbmZpcm1EaWFsb2cuanMiLCIuLi9zcGFTb3VyY2VDb2RlL2RpZ2l0YWx0d2lubW9kdWxlL3NpbXBsZVNlbGVjdE1lbnUuanMiLCIuLi9zcGFTb3VyY2VDb2RlL2RpZ2l0YWx0d2lubW9kdWxlL3NpbXBsZVRyZWUuanMiLCIuLi9zcGFTb3VyY2VDb2RlL2RpZ2l0YWx0d2lubW9kdWxlL3RvcG9sb2d5RE9NLmpzIiwiLi4vc3BhU291cmNlQ29kZS9kaWdpdGFsdHdpbm1vZHVsZS90d2luc1RyZWUuanMiLCIuLi9zcGFTb3VyY2VDb2RlL2dsb2JhbEFwcFNldHRpbmdzLmpzIiwiLi4vc3BhU291cmNlQ29kZS9tc2FsSGVscGVyLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDelZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFrQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5YUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzd5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbE5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiY29uc3Qgc2ltcGxlU2VsZWN0TWVudT0gcmVxdWlyZShcIi4vc2ltcGxlU2VsZWN0TWVudVwiKVxyXG5jb25zdCBzaW1wbGVDb25maXJtRGlhbG9nID0gcmVxdWlyZShcIi4vc2ltcGxlQ29uZmlybURpYWxvZ1wiKVxyXG5cclxuZnVuY3Rpb24gYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2coKSB7XHJcbiAgICB0aGlzLmZpbHRlcnM9e31cclxuICAgIHRoaXMucHJldmlvdXNTZWxlY3RlZEFEVD1udWxsXHJcbiAgICB0aGlzLnNlbGVjdGVkQURUPW51bGw7XHJcbiAgICB0aGlzLnRlc3RUd2luc0luZm89bnVsbDtcclxuXHJcbiAgICAvL3N0b3JlZCBwdXJwb3NlIGZvciBnbG9iYWwgdXNhZ2VcclxuICAgIHRoaXMuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzPXt9XHJcbiAgICB0aGlzLnN0b3JlZFR3aW5zPXt9XHJcblxyXG4gICAgaWYoIXRoaXMuRE9NKXtcclxuICAgICAgICB0aGlzLkRPTSA9ICQoJzxkaXYgY2xhc3M9XCJ3My1tb2RhbFwiIHN0eWxlPVwiZGlzcGxheTpibG9jazt6LWluZGV4OjEwMVwiPjwvZGl2PicpXHJcbiAgICAgICAgdGhpcy5ET00uY3NzKFwib3ZlcmZsb3dcIixcImhpZGRlblwiKVxyXG4gICAgICAgICQoXCJib2R5XCIpLmFwcGVuZCh0aGlzLkRPTSlcclxuICAgIH1cclxufVxyXG5cclxuXHJcbmFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLnByb3RvdHlwZS5wcmVwYXJhdGlvbkZ1bmMgPSBhc3luYyBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICAgJC5nZXQoXCJ0d2luc0ZpbHRlci9yZWFkU3RhcnRGaWx0ZXJzXCIsIChkYXRhLCBzdGF0dXMpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmKGRhdGEhPW51bGwgJiYgZGF0YSE9XCJcIikgdGhpcy5maWx0ZXJzPWRhdGE7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKClcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIHJlamVjdChlKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1cclxuXHJcbmFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLnByb3RvdHlwZS5wb3B1cCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICQuZ2V0KFwicXVlcnlBRFQvbGlzdEFEVEluc3RhbmNlXCIsIChkYXRhLCBzdGF0dXMpID0+IHtcclxuICAgICAgICBpZihkYXRhPT1cIlwiKSBkYXRhPVtdXHJcbiAgICAgICAgdmFyIGFkdEFycj1kYXRhO1xyXG4gICAgICAgIGlmIChhZHRBcnIubGVuZ3RoID09IDApIHJldHVybjtcclxuXHJcbiAgICAgICAgdGhpcy5ET00uc2hvdygpXHJcbiAgICAgICAgdGhpcy5ET00uZW1wdHkoKVxyXG4gICAgICAgIHRoaXMuY29udGVudERPTT0kKCc8ZGl2IGNsYXNzPVwidzMtbW9kYWwtY29udGVudFwiIHN0eWxlPVwid2lkdGg6NjUwcHhcIj48L2Rpdj4nKVxyXG4gICAgICAgIHRoaXMuRE9NLmFwcGVuZCh0aGlzLmNvbnRlbnRET00pXHJcbiAgICAgICAgdGhpcy5jb250ZW50RE9NLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwiaGVpZ2h0OjQwcHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cImZvbnQtc2l6ZToxLjVlbVwiPkNob29zZSBEYXRhIFNldDwvZGl2PjwvZGl2PicpKVxyXG4gICAgICAgIHZhciBjbG9zZUJ1dHRvbj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJpZ2h0XCIgc3R5bGU9XCJmb250LXNpemU6MmVtO3BhZGRpbmctdG9wOjRweFwiPsOXPC9idXR0b24+JylcclxuICAgICAgICB0aGlzLmNvbnRlbnRET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZChjbG9zZUJ1dHRvbilcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmJ1dHRvbkhvbGRlcj0kKFwiPGRpdiBzdHlsZT0naGVpZ2h0OjEwMCUnPjwvZGl2PlwiKVxyXG4gICAgICAgIHRoaXMuY29udGVudERPTS5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKHRoaXMuYnV0dG9uSG9sZGVyKVxyXG4gICAgICAgIGNsb3NlQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuY2xvc2VEaWFsb2coKX0pXHJcbiAgICBcclxuICAgICAgICB2YXIgcm93MT0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCIgc3R5bGU9XCJwYWRkaW5nOjJweFwiPjwvZGl2PicpXHJcbiAgICAgICAgdGhpcy5jb250ZW50RE9NLmFwcGVuZChyb3cxKVxyXG4gICAgICAgIHZhciBsYWJsZT0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtb3BhY2l0eVwiIHN0eWxlPVwicGFkZGluZy1yaWdodDo1cHg7Zm9udC1zaXplOjEuMmVtO1wiPkF6dXJlIERpZ2l0YWwgVHdpbiBJRCA8L2Rpdj4nKVxyXG4gICAgICAgIHJvdzEuYXBwZW5kKGxhYmxlKVxyXG4gICAgICAgIHZhciBzd2l0Y2hBRFRTZWxlY3Rvcj1uZXcgc2ltcGxlU2VsZWN0TWVudShcIiBcIix7d2l0aEJvcmRlcjoxLGZvbnRTaXplOlwiMS4yZW1cIixjb2xvckNsYXNzOlwidzMtbGlnaHQtZ3JheVwiLGJ1dHRvbkNTUzp7XCJwYWRkaW5nXCI6XCI1cHggMTBweFwifX0pXHJcbiAgICAgICAgcm93MS5hcHBlbmQoc3dpdGNoQURUU2VsZWN0b3IuRE9NKVxyXG4gICAgICAgIFxyXG4gICAgICAgIGFkdEFyci5mb3JFYWNoKChhZHRJbnN0YW5jZSk9PntcclxuICAgICAgICAgICAgdmFyIHN0ciA9IGFkdEluc3RhbmNlLnNwbGl0KFwiLlwiKVswXS5yZXBsYWNlKFwiaHR0cHM6Ly9cIiwgXCJcIilcclxuICAgICAgICAgICAgc3dpdGNoQURUU2VsZWN0b3IuYWRkT3B0aW9uKHN0cixhZHRJbnN0YW5jZSlcclxuICAgICAgICAgICAgaWYodGhpcy5maWx0ZXJzW2FkdEluc3RhbmNlXT09bnVsbCkgdGhpcy5maWx0ZXJzW2FkdEluc3RhbmNlXT17fVxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIHN3aXRjaEFEVFNlbGVjdG9yLmNhbGxCYWNrX2NsaWNrT3B0aW9uPShvcHRpb25UZXh0LG9wdGlvblZhbHVlKT0+e1xyXG4gICAgICAgICAgICBzd2l0Y2hBRFRTZWxlY3Rvci5jaGFuZ2VOYW1lKG9wdGlvblRleHQpXHJcbiAgICAgICAgICAgIHRoaXMuc2V0QURUSW5zdGFuY2Uob3B0aW9uVmFsdWUpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgcm93Mj0kKCc8ZGl2IGNsYXNzPVwidzMtY2VsbC1yb3dcIj48L2Rpdj4nKVxyXG4gICAgICAgIHRoaXMuY29udGVudERPTS5hcHBlbmQocm93MilcclxuICAgICAgICB2YXIgbGVmdFNwYW49JCgnPGRpdiBjbGFzcz1cInczLWNlbGxcIiBzdHlsZT1cIndpZHRoOjI0MHB4O3BhZGRpbmctcmlnaHQ6NXB4XCI+PC9kaXY+JylcclxuICAgICAgICBcclxuICAgICAgICBsZWZ0U3Bhbi5hcHBlbmQoJCgnPGRpdiBzdHlsZT1cImhlaWdodDozMHB4XCIgY2xhc3M9XCJ3My1iYXIgdzMtcmVkXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtXCIgc3R5bGU9XCJcIj5GaWx0ZXJzPC9kaXY+PC9kaXY+JykpXHJcblxyXG4gICAgICAgIHZhciBmaWx0ZXJMaXN0PSQoJzx1bCBjbGFzcz1cInczLXVsIHczLWhvdmVyYWJsZVwiPicpXHJcbiAgICAgICAgZmlsdGVyTGlzdC5jc3Moe1wib3ZlcmZsb3cteFwiOlwiaGlkZGVuXCIsXCJvdmVyZmxvdy15XCI6XCJhdXRvXCIsXCJoZWlnaHRcIjpcIjM0MHB4XCIsIFwiYm9yZGVyXCI6XCJzb2xpZCAxcHggbGlnaHRncmF5XCJ9KVxyXG4gICAgICAgIGxlZnRTcGFuLmFwcGVuZChmaWx0ZXJMaXN0KVxyXG5cclxuICAgICAgICB0aGlzLmZpbHRlckxpc3Q9ZmlsdGVyTGlzdDtcclxuICAgICAgICByb3cyLmFwcGVuZChsZWZ0U3BhbilcclxuICAgICAgICBcclxuICAgICAgICB2YXIgcmlnaHRTcGFuPSQoJzxkaXYgY2xhc3M9XCJ3My1jb250YWluZXIgdzMtY2VsbFwiPjwvZGl2PicpXHJcbiAgICAgICAgcm93Mi5hcHBlbmQocmlnaHRTcGFuKSBcclxuXHJcbiAgICAgICAgdmFyIHBhbmVsQ2FyZD0kKCc8ZGl2IGNsYXNzPVwidzMtY2FyZC0yIHczLXdoaXRlXCIgc3R5bGU9XCJwYWRkaW5nOjEwcHhcIj48L2Rpdj4nKVxyXG4gICAgICAgIHJpZ2h0U3Bhbi5hcHBlbmQocGFuZWxDYXJkKVxyXG4gICAgICAgIHZhciBxdWVyeVNwYW49JChcIjxzcGFuLz5cIilcclxuICAgICAgICBwYW5lbENhcmQuYXBwZW5kKHF1ZXJ5U3BhbilcclxuICAgICAgICBcclxuXHJcbiAgICAgICAgdmFyIG5hbWVJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZVwiICBwbGFjZWhvbGRlcj1cIkNob29zZSBhIGZpbHRlciBvciBmaWxsIGluIG5ldyBmaWx0ZXIgbmFtZS4uLlwiLz4nKS5hZGRDbGFzcyhcInczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgICAgICB0aGlzLnF1ZXJ5TmFtZUlucHV0PW5hbWVJbnB1dDtcclxuICAgICAgICB2YXIgcXVlcnlMYmw9JCgnPGRpdiBjbGFzcz1cInczLWJhciB3My1yZWRcIiBzdHlsZT1cInBhZGRpbmctbGVmdDo1cHg7bWFyZ2luLXRvcDoycHg7d2lkdGg6NTAlXCI+UXVlcnkgU2VudGVuY2U8L2Rpdj4nKVxyXG4gICAgICAgIHZhciBxdWVyeUlucHV0PSQoJzx0ZXh0YXJlYSBzdHlsZT1cInJlc2l6ZTpub25lO2hlaWdodDo4MHB4O291dGxpbmU6bm9uZTttYXJnaW4tYm90dG9tOjJweFwiICBwbGFjZWhvbGRlcj1cIlNhbXBsZTogU0VMRUNUICogRlJPTSBkaWdpdGFsdHdpbnMgd2hlcmUgSVNfT0ZfTU9ERUwoXFwnbW9kZWxJRFxcJylcIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICAgICAgdGhpcy5xdWVyeUlucHV0PXF1ZXJ5SW5wdXQ7XHJcblxyXG4gICAgICAgIHZhciBzYXZlQnRuPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtaG92ZXItbGlnaHQtZ3JlZW4gdzMtYm9yZGVyLXJpZ2h0XCI+U2F2ZSBGaWx0ZXI8L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciB0ZXN0QnRuPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtaG92ZXItYW1iZXIgdzMtYm9yZGVyLXJpZ2h0XCI+VGVzdCBRdWVyeTwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIGRlbEJ0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWhvdmVyLXBpbmsgdzMtYm9yZGVyLXJpZ2h0XCI+RGVsZXRlIEZpbHRlcjwvYnV0dG9uPicpXHJcblxyXG5cclxuICAgICAgICB0ZXN0QnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMudGVzdFF1ZXJ5KCl9KVxyXG4gICAgICAgIHNhdmVCdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5zYXZlUXVlcnkoKX0pXHJcbiAgICAgICAgZGVsQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuZGVsUXVlcnkoKX0pXHJcbiAgICAgICAgcXVlcnlTcGFuLmFwcGVuZChuYW1lSW5wdXQscXVlcnlMYmwscXVlcnlJbnB1dCxzYXZlQnRuLHRlc3RCdG4sZGVsQnRuKVxyXG5cclxuICAgICAgICB2YXIgdGVzdFJlc3VsdFNwYW49JChcIjxkaXYgY2xhc3M9J3czLWJvcmRlcic+PC9kaXY+XCIpXHJcbiAgICAgICAgdmFyIHRlc3RSZXN1bHRUYWJsZT0kKFwiPHRhYmxlPjwvdGFibGU+XCIpXHJcbiAgICAgICAgdGhpcy50ZXN0UmVzdWx0VGFibGU9dGVzdFJlc3VsdFRhYmxlXHJcbiAgICAgICAgdGVzdFJlc3VsdFNwYW4uY3NzKHtcIm1hcmdpbi10b3BcIjpcIjJweFwiLG92ZXJmbG93OlwiYXV0b1wiLGhlaWdodDpcIjE3NXB4XCIsd2lkdGg6XCI0MDBweFwifSlcclxuICAgICAgICB0ZXN0UmVzdWx0VGFibGUuY3NzKHtcImJvcmRlci1jb2xsYXBzZVwiOlwiY29sbGFwc2VcIn0pXHJcbiAgICAgICAgcGFuZWxDYXJkLmFwcGVuZCh0ZXN0UmVzdWx0U3BhbilcclxuICAgICAgICB0ZXN0UmVzdWx0U3Bhbi5hcHBlbmQodGVzdFJlc3VsdFRhYmxlKVxyXG5cclxuICAgICAgICB0aGlzLmJvdHRvbUJhcj0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCI+PC9kaXY+JylcclxuICAgICAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKHRoaXMuYm90dG9tQmFyKVxyXG5cclxuICAgICAgICBpZih0aGlzLnByZXZpb3VzU2VsZWN0ZWRBRFQhPW51bGwpe1xyXG4gICAgICAgICAgICBzd2l0Y2hBRFRTZWxlY3Rvci50cmlnZ2VyT3B0aW9uVmFsdWUodGhpcy5wcmV2aW91c1NlbGVjdGVkQURUKVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBzd2l0Y2hBRFRTZWxlY3Rvci50cmlnZ2VyT3B0aW9uSW5kZXgoMClcclxuICAgICAgICB9XHJcblxyXG4gICAgfSk7XHJcbn1cclxuXHJcbmFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLnByb3RvdHlwZS5zZXRBRFRJbnN0YW5jZT1mdW5jdGlvbihzZWxlY3RlZEFEVCl7XHJcbiAgICB0aGlzLmJvdHRvbUJhci5lbXB0eSgpXHJcbiAgICB0aGlzLmJ1dHRvbkhvbGRlci5lbXB0eSgpXHJcbiAgICBpZih0aGlzLnByZXZpb3VzU2VsZWN0ZWRBRFQ9PW51bGwgfHwgdGhpcy5wcmV2aW91c1NlbGVjdGVkQURUID09IHNlbGVjdGVkQURUKXtcclxuICAgICAgICB2YXIgcmVwbGFjZUJ1dHRvbj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWNhcmQgdzMtZGVlcC1vcmFuZ2UgdzMtaG92ZXItZ3JlZW5cIiBzdHlsZT1cImhlaWdodDoxMDAlOyBtYXJnaW4tcmlnaHQ6OHB4XCI+UmVwbGFjZSBBbGwgRGF0YTwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIGFwcGVuZEJ1dHRvbj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWNhcmQgdzMtZGVlcC1vcmFuZ2UgdzMtaG92ZXItZ3JlZW5cIiBzdHlsZT1cImhlaWdodDoxMDAlXCI+QXBwZW5kIERhdGE8L2J1dHRvbj4nKVxyXG5cclxuICAgICAgICByZXBsYWNlQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+IHsgdGhpcy51c2VGaWx0ZXJUb1JlcGxhY2UoKSAgfSAgKVxyXG4gICAgICAgIGFwcGVuZEJ1dHRvbi5vbihcImNsaWNrXCIsICgpPT4geyB0aGlzLnVzZUZpbHRlclRvQXBwZW5kKCkgIH0gIClcclxuICAgICAgICB0aGlzLmJ1dHRvbkhvbGRlci5hcHBlbmQocmVwbGFjZUJ1dHRvbixhcHBlbmRCdXR0b24pXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB2YXIgcmVwbGFjZUJ1dHRvbj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWdyZWVuIHczLWJvcmRlci1yaWdodFwiIHN0eWxlPVwiaGVpZ2h0OjEwMCVcIj5SZXBsYWNlIEFsbCBEYXRhPC9idXR0b24+JylcclxuICAgICAgICByZXBsYWNlQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+IHsgdGhpcy51c2VGaWx0ZXJUb1JlcGxhY2UoKSAgfSAgKVxyXG4gICAgICAgIHRoaXMuYnV0dG9uSG9sZGVyLmFwcGVuZChyZXBsYWNlQnV0dG9uKVxyXG4gICAgfVxyXG4gICAgdGhpcy5zZWxlY3RlZEFEVCA9IHNlbGVjdGVkQURUXHJcbiAgICB0aGlzLmxpc3RGaWx0ZXJzKHNlbGVjdGVkQURUKVxyXG4gICAgdGhpcy5jaG9vc2VPbmVGaWx0ZXIoXCJcIixcIlwiKVxyXG4gICAgJC5hamF4U2V0dXAoe1xyXG4gICAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAgICAgJ2FkdEluc3RhbmNlJzogdGhpcy5zZWxlY3RlZEFEVFxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcblxyXG5cclxuYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cucHJvdG90eXBlLmRlbFF1ZXJ5PWZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgcXVlcnlOYW1lPXRoaXMucXVlcnlOYW1lSW5wdXQudmFsKClcclxuICAgIGlmKHF1ZXJ5TmFtZT09XCJBTExcIiB8fCBxdWVyeU5hbWU9PVwiXCIpcmV0dXJuO1xyXG4gICAgdmFyIGNvbmZpcm1EaWFsb2dEaXY9bmV3IHNpbXBsZUNvbmZpcm1EaWFsb2coKVxyXG5cclxuICAgIGNvbmZpcm1EaWFsb2dEaXYuc2hvdyhcclxuICAgICAgICB7IHdpZHRoOiBcIjI1MHB4XCIgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIkNvbmZpcm1cIlxyXG4gICAgICAgICAgICAsIGNvbnRlbnQ6IFwiUGxlYXNlIGNvbmZpcm0gZGVsZXRpbmcgZmlsdGVyIFxcXCJcIitxdWVyeU5hbWUrXCJcXFwiP1wiXHJcbiAgICAgICAgICAgICwgYnV0dG9uczpbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1yZWQgdzMtaG92ZXItcGlua1wiLCB0ZXh0OiBcIkNvbmZpcm1cIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnF1ZXJ5TmFtZUlucHV0LnZhbChcIlwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnF1ZXJ5SW5wdXQudmFsKFwiXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudGVzdFJlc3VsdFRhYmxlLmVtcHR5KClcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuZmlsdGVyc1t0aGlzLnNlbGVjdGVkQURUXVtxdWVyeU5hbWVdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubGlzdEZpbHRlcnModGhpcy5zZWxlY3RlZEFEVClcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jaG9vc2VPbmVGaWx0ZXIoXCJcIiwgXCJcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgJC5wb3N0KFwidHdpbnNGaWx0ZXIvc2F2ZVN0YXJ0RmlsdGVyc1wiLCB7IGZpbHRlcnM6IHRoaXMuZmlsdGVycyB9KVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKCk7XHJcbiAgICAgICAgICAgICAgICB9fSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xvckNsYXNzOiBcInczLWdyYXlcIix0ZXh0OiBcIkNhbmNlbFwiLCBcImNsaWNrRnVuY1wiOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKVxyXG4gICAgICAgICAgICAgICAgfX1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH1cclxuICAgIClcclxufVxyXG5cclxuYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cucHJvdG90eXBlLnNhdmVRdWVyeT1mdW5jdGlvbigpe1xyXG4gICAgdmFyIHF1ZXJ5TmFtZT10aGlzLnF1ZXJ5TmFtZUlucHV0LnZhbCgpXHJcbiAgICB2YXIgcXVlcnlTdHI9dGhpcy5xdWVyeUlucHV0LnZhbCgpXHJcbiAgICBpZihxdWVyeU5hbWU9PVwiXCIpe1xyXG4gICAgICAgIGFsZXJ0KFwiUGxlYXNlIGZpbGwgaW4gcXVlcnkgbmFtZVwiKVxyXG4gICAgICAgIHJldHVyblxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuZmlsdGVyc1t0aGlzLnNlbGVjdGVkQURUXVtxdWVyeU5hbWVdPXF1ZXJ5U3RyXHJcbiAgICB0aGlzLmxpc3RGaWx0ZXJzKHRoaXMuc2VsZWN0ZWRBRFQpXHJcblxyXG4gICAgdGhpcy5maWx0ZXJMaXN0LmNoaWxkcmVuKCkuZWFjaCgoaW5kZXgsZWxlKT0+e1xyXG4gICAgICAgIGlmKCQoZWxlKS5kYXRhKFwiZmlsdGVyTmFtZVwiKT09cXVlcnlOYW1lKSB7XHJcbiAgICAgICAgICAgICQoZWxlKS50cmlnZ2VyKFwiY2xpY2tcIilcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG5cclxuICAgIC8vc3RvcmUgZmlsdGVycyB0byBzZXJ2ZXIgc2lkZSBhcyBhIGZpbGVcclxuICAgICQucG9zdChcInR3aW5zRmlsdGVyL3NhdmVTdGFydEZpbHRlcnNcIix7ZmlsdGVyczp0aGlzLmZpbHRlcnN9KVxyXG59XHJcblxyXG5hZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZy5wcm90b3R5cGUudGVzdFF1ZXJ5PWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLnRlc3RSZXN1bHRUYWJsZS5lbXB0eSgpXHJcbiAgICB2YXIgcXVlcnlTdHI9IHRoaXMucXVlcnlJbnB1dC52YWwoKVxyXG4gICAgaWYocXVlcnlTdHI9PVwiXCIpIHJldHVybjtcclxuICAgICQucG9zdChcInF1ZXJ5QURUL2FsbFR3aW5zSW5mb1wiLHtxdWVyeTpxdWVyeVN0cn0sIChkYXRhKT0+IHtcclxuICAgICAgICBpZihkYXRhPT1cIlwiKSBkYXRhPVtdXHJcbiAgICAgICAgaWYoIUFycmF5LmlzQXJyYXkoZGF0YSkpIHtcclxuICAgICAgICAgICAgYWxlcnQoXCJRdWVyeSBpcyBub3QgY29ycmVjdCFcIilcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnRlc3RUd2luc0luZm89ZGF0YVxyXG4gICAgICAgIGlmKGRhdGEubGVuZ3RoPT0wKXtcclxuICAgICAgICAgICAgdmFyIHRyPSQoJzx0cj48dGQgc3R5bGU9XCJjb2xvcjpncmF5XCI+emVybyByZWNvcmQ8L3RkPjx0ZCBzdHlsZT1cImJvcmRlci1ib3R0b206c29saWQgMXB4IGxpZ2h0Z3JleVwiPjwvdGQ+PC90cj4nKVxyXG4gICAgICAgICAgICB0aGlzLnRlc3RSZXN1bHRUYWJsZS5hcHBlbmQodHIpXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHZhciB0cj0kKCc8dHI+PHRkIHN0eWxlPVwiYm9yZGVyLXJpZ2h0OnNvbGlkIDFweCBsaWdodGdyZXk7Ym9yZGVyLWJvdHRvbTpzb2xpZCAxcHggbGlnaHRncmV5O2ZvbnQtd2VpZ2h0OmJvbGRcIj5JRDwvdGQ+PHRkIHN0eWxlPVwiYm9yZGVyLWJvdHRvbTpzb2xpZCAxcHggbGlnaHRncmV5O2ZvbnQtd2VpZ2h0OmJvbGRcIj5NT0RFTDwvdGQ+PC90cj4nKVxyXG4gICAgICAgICAgICB0aGlzLnRlc3RSZXN1bHRUYWJsZS5hcHBlbmQodHIpXHJcbiAgICAgICAgICAgIGRhdGEuZm9yRWFjaCgob25lTm9kZSk9PntcclxuICAgICAgICAgICAgICAgIHRoaXMuc3RvcmVkVHdpbnNbb25lTm9kZVtcIiRkdElkXCJdXSA9IG9uZU5vZGU7XHJcbiAgICAgICAgICAgICAgICB2YXIgdHI9JCgnPHRyPjx0ZCBzdHlsZT1cImJvcmRlci1yaWdodDpzb2xpZCAxcHggbGlnaHRncmV5O2JvcmRlci1ib3R0b206c29saWQgMXB4IGxpZ2h0Z3JleVwiPicrb25lTm9kZVtcIiRkdElkXCJdKyc8L3RkPjx0ZCBzdHlsZT1cImJvcmRlci1ib3R0b206c29saWQgMXB4IGxpZ2h0Z3JleVwiPicrb25lTm9kZVsnJG1ldGFkYXRhJ11bJyRtb2RlbCddKyc8L3RkPjwvdHI+JylcclxuICAgICAgICAgICAgICAgIHRoaXMudGVzdFJlc3VsdFRhYmxlLmFwcGVuZCh0cilcclxuICAgICAgICAgICAgfSkgICAgXHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbmFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLnByb3RvdHlwZS5saXN0RmlsdGVycz1mdW5jdGlvbihhZHRJbnN0YW5jZU5hbWUpe1xyXG4gICAgdmFyIGF2YWlsYWJsZUZpbHRlcnM9dGhpcy5maWx0ZXJzW2FkdEluc3RhbmNlTmFtZV1cclxuICAgIGF2YWlsYWJsZUZpbHRlcnNbXCJBTExcIl09XCJTRUxFQ1QgKiBGUk9NIGRpZ2l0YWx0d2luc1wiXHJcblxyXG4gICAgdmFyIGZpbHRlckxpc3Q9dGhpcy5maWx0ZXJMaXN0O1xyXG4gICAgZmlsdGVyTGlzdC5lbXB0eSgpXHJcblxyXG4gICAgZm9yKHZhciBmaWx0ZXJOYW1lIGluIGF2YWlsYWJsZUZpbHRlcnMpe1xyXG4gICAgICAgIHZhciBvbmVGaWx0ZXI9JCgnPGxpIHN0eWxlPVwiZm9udC1zaXplOjFlbVwiPicrZmlsdGVyTmFtZSsnPC9saT4nKVxyXG4gICAgICAgIG9uZUZpbHRlci5jc3MoXCJjdXJzb3JcIixcImRlZmF1bHRcIilcclxuICAgICAgICBvbmVGaWx0ZXIuZGF0YShcImZpbHRlck5hbWVcIiwgZmlsdGVyTmFtZSlcclxuICAgICAgICBvbmVGaWx0ZXIuZGF0YShcImZpbHRlclF1ZXJ5XCIsIGF2YWlsYWJsZUZpbHRlcnNbZmlsdGVyTmFtZV0pXHJcbiAgICAgICAgaWYoZmlsdGVyTmFtZT09XCJBTExcIikgZmlsdGVyTGlzdC5wcmVwZW5kKG9uZUZpbHRlcilcclxuICAgICAgICBlbHNlIGZpbHRlckxpc3QuYXBwZW5kKG9uZUZpbHRlcilcclxuICAgICAgICB0aGlzLmFzc2lnbkV2ZW50VG9PbmVGaWx0ZXIob25lRmlsdGVyKVxyXG4gICAgICAgIFxyXG4gICAgICAgIG9uZUZpbHRlci5vbihcImRibGNsaWNrXCIsKGUpPT57XHJcbiAgICAgICAgICAgIGlmKHRoaXMucHJldmlvdXNTZWxlY3RlZEFEVCA9PSB0aGlzLnNlbGVjdGVkQURUKSB0aGlzLnVzZUZpbHRlclRvQXBwZW5kKCk7XHJcbiAgICAgICAgICAgIGVsc2UgdGhpcy51c2VGaWx0ZXJUb1JlcGxhY2UoKTtcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG59XHJcblxyXG5hZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZy5wcm90b3R5cGUuYXNzaWduRXZlbnRUb09uZUZpbHRlcj1mdW5jdGlvbihvbmVGaWx0ZXIpe1xyXG4gICAgb25lRmlsdGVyLm9uKFwiY2xpY2tcIiwoZSk9PntcclxuICAgICAgICB0aGlzLmZpbHRlckxpc3QuY2hpbGRyZW4oKS5lYWNoKChpbmRleCxlbGUpPT57XHJcbiAgICAgICAgICAgICQoZWxlKS5yZW1vdmVDbGFzcyhcInczLWFtYmVyXCIpXHJcbiAgICAgICAgfSlcclxuICAgICAgICBvbmVGaWx0ZXIuYWRkQ2xhc3MoXCJ3My1hbWJlclwiKVxyXG4gICAgICAgIHZhciBmaWx0ZXJOYW1lPW9uZUZpbHRlci5kYXRhKCdmaWx0ZXJOYW1lJylcclxuICAgICAgICB2YXIgcXVlcnlTdHI9b25lRmlsdGVyLmRhdGEoJ2ZpbHRlclF1ZXJ5JylcclxuICAgICAgICB0aGlzLmNob29zZU9uZUZpbHRlcihmaWx0ZXJOYW1lLHF1ZXJ5U3RyKVxyXG4gICAgfSlcclxufVxyXG5cclxuYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cucHJvdG90eXBlLnVzZUZpbHRlclRvQXBwZW5kPWZ1bmN0aW9uKCl7XHJcbiAgICBpZih0aGlzLnF1ZXJ5SW5wdXQudmFsKCk9PVwiXCIpe1xyXG4gICAgICAgIGFsZXJ0KFwiUGxlYXNlIGZpbGwgaW4gcXVlcnkgdG8gZmV0Y2ggZGF0YSBmcm9tIGRpZ2l0YWwgdHdpbiBzZXJ2aWNlLi5cIilcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBpZih0aGlzLnByZXZpb3VzU2VsZWN0ZWRBRFQ9PW51bGwpe1xyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcIkFEVERhdGFzb3VyY2VDaGFuZ2VfcmVwbGFjZVwiLCBcInF1ZXJ5XCI6IHRoaXMucXVlcnlJbnB1dC52YWwoKSwgXCJ0d2luc1wiOnRoaXMudGVzdFR3aW5zSW5mbyB9KVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgdGhpcy5wcmV2aW91c1NlbGVjdGVkQURUPXRoaXMuc2VsZWN0ZWRBRFRcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJBRFREYXRhc291cmNlQ2hhbmdlX2FwcGVuZFwiLCBcInF1ZXJ5XCI6IHRoaXMucXVlcnlJbnB1dC52YWwoKSwgXCJ0d2luc1wiOnRoaXMudGVzdFR3aW5zSW5mbyB9KVxyXG4gICAgfVxyXG4gICAgdGhpcy5jbG9zZURpYWxvZygpXHJcbn1cclxuXHJcbmFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLnByb3RvdHlwZS5jbG9zZURpYWxvZz1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5ET00uaGlkZSgpXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJBRFREYXRhc291cmNlRGlhbG9nX2Nsb3NlZFwifSlcclxufVxyXG5cclxuYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cucHJvdG90eXBlLnN0b3JlVHdpblJlbGF0aW9uc2hpcHNfcmVtb3ZlPWZ1bmN0aW9uKHJlbGF0aW9uc0RhdGEpe1xyXG4gICAgcmVsYXRpb25zRGF0YS5mb3JFYWNoKChvbmVSZWxhdGlvbnNoaXApPT57XHJcbiAgICAgICAgdmFyIHNyY0lEPW9uZVJlbGF0aW9uc2hpcFtcInNyY0lEXCJdXHJcbiAgICAgICAgaWYodGhpcy5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbc3JjSURdKXtcclxuICAgICAgICAgICAgdmFyIGFycj10aGlzLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tzcmNJRF1cclxuICAgICAgICAgICAgZm9yKHZhciBpPTA7aTxhcnIubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgICAgICBpZihhcnJbaV1bJyRyZWxhdGlvbnNoaXBJZCddPT1vbmVSZWxhdGlvbnNoaXBbXCJyZWxJRFwiXSl7XHJcbiAgICAgICAgICAgICAgICAgICAgYXJyLnNwbGljZShpLDEpXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KVxyXG59XHJcblxyXG5hZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZy5wcm90b3R5cGUuc3RvcmVUd2luUmVsYXRpb25zaGlwc19hcHBlbmQ9ZnVuY3Rpb24ocmVsYXRpb25zRGF0YSl7XHJcbiAgICByZWxhdGlvbnNEYXRhLmZvckVhY2goKG9uZVJlbGF0aW9uc2hpcCk9PntcclxuICAgICAgICBpZighdGhpcy5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbb25lUmVsYXRpb25zaGlwWyckc291cmNlSWQnXV0pXHJcbiAgICAgICAgICAgIHRoaXMuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW29uZVJlbGF0aW9uc2hpcFsnJHNvdXJjZUlkJ11dPVtdXHJcbiAgICAgICAgdGhpcy5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbb25lUmVsYXRpb25zaGlwWyckc291cmNlSWQnXV0ucHVzaChvbmVSZWxhdGlvbnNoaXApXHJcbiAgICB9KVxyXG59XHJcblxyXG5hZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZy5wcm90b3R5cGUuc3RvcmVUd2luUmVsYXRpb25zaGlwcz1mdW5jdGlvbihyZWxhdGlvbnNEYXRhKXtcclxuICAgIHJlbGF0aW9uc0RhdGEuZm9yRWFjaCgob25lUmVsYXRpb25zaGlwKT0+e1xyXG4gICAgICAgIHZhciB0d2luSUQ9b25lUmVsYXRpb25zaGlwWyckc291cmNlSWQnXVxyXG4gICAgICAgIHRoaXMuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW3R3aW5JRF09W11cclxuICAgIH0pXHJcblxyXG4gICAgcmVsYXRpb25zRGF0YS5mb3JFYWNoKChvbmVSZWxhdGlvbnNoaXApPT57XHJcbiAgICAgICAgdGhpcy5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbb25lUmVsYXRpb25zaGlwWyckc291cmNlSWQnXV0ucHVzaChvbmVSZWxhdGlvbnNoaXApXHJcbiAgICB9KVxyXG59XHJcblxyXG5hZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZy5wcm90b3R5cGUudXNlRmlsdGVyVG9SZXBsYWNlPWZ1bmN0aW9uKCl7XHJcbiAgICBpZih0aGlzLnF1ZXJ5SW5wdXQudmFsKCk9PVwiXCIpe1xyXG4gICAgICAgIGFsZXJ0KFwiUGxlYXNlIGZpbGwgaW4gcXVlcnkgdG8gZmV0Y2ggZGF0YSBmcm9tIGRpZ2l0YWwgdHdpbiBzZXJ2aWNlLi5cIilcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB2YXIgQURUSW5zdGFuY2VEb2VzTm90Q2hhbmdlPXRydWVcclxuICAgIGlmKHRoaXMucHJldmlvdXNTZWxlY3RlZEFEVCE9dGhpcy5zZWxlY3RlZEFEVCl7XHJcbiAgICAgICAgZm9yKHZhciBpbmQgaW4gdGhpcy5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHMpIGRlbGV0ZSB0aGlzLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tpbmRdXHJcbiAgICAgICAgZm9yKHZhciBpbmQgaW4gdGhpcy5zdG9yZWRUd2lucykgZGVsZXRlIHRoaXMuc3RvcmVkVHdpbnNbaW5kXVxyXG4gICAgICAgIEFEVEluc3RhbmNlRG9lc05vdENoYW5nZT1mYWxzZVxyXG4gICAgfVxyXG4gICAgdGhpcy5wcmV2aW91c1NlbGVjdGVkQURUPXRoaXMuc2VsZWN0ZWRBRFRcclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcIkFEVERhdGFzb3VyY2VDaGFuZ2VfcmVwbGFjZVwiLCBcInF1ZXJ5XCI6IHRoaXMucXVlcnlJbnB1dC52YWwoKVxyXG4gICAgLCBcInR3aW5zXCI6dGhpcy50ZXN0VHdpbnNJbmZvLCBcIkFEVEluc3RhbmNlRG9lc05vdENoYW5nZVwiOkFEVEluc3RhbmNlRG9lc05vdENoYW5nZSB9KVxyXG4gICAgXHJcbiAgICB0aGlzLmNsb3NlRGlhbG9nKClcclxufVxyXG5cclxuYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cucHJvdG90eXBlLmNob29zZU9uZUZpbHRlcj1mdW5jdGlvbihxdWVyeU5hbWUscXVlcnlTdHIpe1xyXG4gICAgdGhpcy5xdWVyeU5hbWVJbnB1dC52YWwocXVlcnlOYW1lKVxyXG4gICAgdGhpcy5xdWVyeUlucHV0LnZhbChxdWVyeVN0cilcclxuICAgIHRoaXMudGVzdFJlc3VsdFRhYmxlLmVtcHR5KClcclxuICAgIHRoaXMudGVzdFR3aW5zSW5mbz1udWxsXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IGFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nKCk7IiwiJ3VzZSBzdHJpY3QnO1xyXG5jb25zdCB0b3BvbG9neURPTT1yZXF1aXJlKFwiLi90b3BvbG9neURPTS5qc1wiKVxyXG5jb25zdCB0d2luc1RyZWU9cmVxdWlyZShcIi4vdHdpbnNUcmVlXCIpXHJcbmNvbnN0IGFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nID0gcmVxdWlyZShcIi4vYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2dcIilcclxuY29uc3QgbW9kZWxNYW5hZ2VyRGlhbG9nID0gcmVxdWlyZShcIi4vbW9kZWxNYW5hZ2VyRGlhbG9nXCIpXHJcbmNvbnN0IGVkaXRMYXlvdXREaWFsb2cgPSByZXF1aXJlKFwiLi9lZGl0TGF5b3V0RGlhbG9nXCIpXHJcbmNvbnN0IG1haW5Ub29sYmFyID0gcmVxdWlyZShcIi4vbWFpblRvb2xiYXJcIilcclxuY29uc3QgaW5mb1BhbmVsPSByZXF1aXJlKFwiLi9pbmZvUGFuZWxcIik7XHJcbmNvbnN0IGdsb2JhbEFwcFNldHRpbmdzID0gcmVxdWlyZShcIi4uL2dsb2JhbEFwcFNldHRpbmdzLmpzXCIpO1xyXG5jb25zdCBtc2FsSGVscGVyPXJlcXVpcmUoXCIuLi9tc2FsSGVscGVyXCIpXHJcblxyXG5mdW5jdGlvbiBkaWdpdGFsdHdpbm1vZHVsZVVJKCkge1xyXG4gICAgdGhpcy5pbml0VUlMYXlvdXQoKVxyXG5cclxuICAgIHRoaXMudHdpbnNUcmVlPSBuZXcgdHdpbnNUcmVlKCQoXCIjdHJlZUhvbGRlclwiKSwkKFwiI3RyZWVTZWFyY2hcIikpXHJcbiAgICBcclxuICAgIHRoaXMubWFpblRvb2xiYXI9bWFpblRvb2xiYXJcclxuICAgIG1haW5Ub29sYmFyLnJlbmRlcigpXHJcbiAgICB0aGlzLnRvcG9sb2d5SW5zdGFuY2U9bmV3IHRvcG9sb2d5RE9NKCQoJyNjYW52YXMnKSlcclxuICAgIHRoaXMudG9wb2xvZ3lJbnN0YW5jZS5pbml0KClcclxuICAgIHRoaXMuaW5mb1BhbmVsPSBpbmZvUGFuZWxcclxuXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoKSAvL2luaXRpYWxpemUgYWxsIHVpIGNvbXBvbmVudHMgdG8gaGF2ZSB0aGUgYnJvYWRjYXN0IGNhcGFiaWxpdHlcclxuXHJcbiAgICAvL3RyeSBpZiBpdCBhbHJlYWR5IEIyQyBzaWduZWQgaW4sIGlmIG5vdCBnb2luZyBiYWNrIHRvIHRoZSBzdGFydCBwYWdlXHJcbiAgICB0aGlzLm15TVNBTE9iaiA9IG5ldyBtc2FsLlB1YmxpY0NsaWVudEFwcGxpY2F0aW9uKGdsb2JhbEFwcFNldHRpbmdzLm1zYWxDb25maWcpO1xyXG5cclxuXHJcbiAgICB0aGlzLnByZXBhcmVEYXRhKClcclxufVxyXG5cclxuZGlnaXRhbHR3aW5tb2R1bGVVSS5wcm90b3R5cGUucHJlcGFyZURhdGE9YXN5bmMgZnVuY3Rpb24oKXtcclxuICAgIHZhciB0aGVBY2NvdW50PW1zYWxIZWxwZXIuZmV0Y2hBY2NvdW50KCk7XHJcbiAgICBpZih0aGVBY2NvdW50PT1udWxsICYmICFnbG9iYWxBcHBTZXR0aW5ncy5pc0xvY2FsVGVzdCkgd2luZG93Lm9wZW4oZ2xvYmFsQXBwU2V0dGluZ3MubG9nb3V0UmVkaXJlY3RVcmksXCJfc2VsZlwiKVxyXG5cclxuICAgIHZhciByZXM9YXdhaXQgbXNhbEhlbHBlci5jYWxsQVBJKFwidG9pbnRlcm5hbFwiKVxyXG4gICAgY29uc29sZS5sb2cocmVzKVxyXG4gICAgLy9cclxuICAgIC8qXHJcbiAgICB2YXIgcHJvbWlzZUFycj1bXHJcbiAgICAgICAgbW9kZWxNYW5hZ2VyRGlhbG9nLnByZXBhcmF0aW9uRnVuYygpLFxyXG4gICAgICAgIGFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLnByZXBhcmF0aW9uRnVuYygpXHJcbiAgICBdXHJcbiAgICBhd2FpdCBQcm9taXNlLmFsbFNldHRsZWQocHJvbWlzZUFycik7XHJcbiAgICAqL1xyXG4gICAgLy9hZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZy5wb3B1cCgpXHJcbn1cclxuXHJcblxyXG5kaWdpdGFsdHdpbm1vZHVsZVVJLnByb3RvdHlwZS5hc3NpZ25Ccm9hZGNhc3RNZXNzYWdlPWZ1bmN0aW9uKHVpQ29tcG9uZW50KXtcclxuICAgIHVpQ29tcG9uZW50LmJyb2FkY2FzdE1lc3NhZ2U9KG1zZ09iaik9Pnt0aGlzLmJyb2FkY2FzdE1lc3NhZ2UodWlDb21wb25lbnQsbXNnT2JqKX1cclxufVxyXG5cclxuZGlnaXRhbHR3aW5tb2R1bGVVSS5wcm90b3R5cGUuYnJvYWRjYXN0TWVzc2FnZT1mdW5jdGlvbihzb3VyY2UsbXNnUGF5bG9hZCl7XHJcbiAgICB2YXIgY29tcG9uZW50c0Fycj1bdGhpcy50d2luc1RyZWUsYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2csbW9kZWxNYW5hZ2VyRGlhbG9nLGVkaXRMYXlvdXREaWFsb2csXHJcbiAgICAgICAgIHRoaXMubWFpblRvb2xiYXIsdGhpcy50b3BvbG9neUluc3RhbmNlLHRoaXMuaW5mb1BhbmVsXVxyXG5cclxuICAgIGlmKHNvdXJjZT09bnVsbCl7XHJcbiAgICAgICAgZm9yKHZhciBpPTA7aTxjb21wb25lbnRzQXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICB2YXIgdGhlQ29tcG9uZW50PWNvbXBvbmVudHNBcnJbaV1cclxuICAgICAgICAgICAgdGhpcy5hc3NpZ25Ccm9hZGNhc3RNZXNzYWdlKHRoZUNvbXBvbmVudClcclxuICAgICAgICB9XHJcbiAgICB9ZWxzZXtcclxuICAgICAgICBmb3IodmFyIGk9MDtpPGNvbXBvbmVudHNBcnIubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgIHZhciB0aGVDb21wb25lbnQ9Y29tcG9uZW50c0FycltpXVxyXG4gICAgICAgICAgICBpZih0aGVDb21wb25lbnQucnhNZXNzYWdlICYmIHRoZUNvbXBvbmVudCE9c291cmNlKSB0aGVDb21wb25lbnQucnhNZXNzYWdlKG1zZ1BheWxvYWQpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5kaWdpdGFsdHdpbm1vZHVsZVVJLnByb3RvdHlwZS5pbml0VUlMYXlvdXQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgbXlMYXlvdXQgPSAkKCdib2R5JykubGF5b3V0KHtcclxuICAgICAgICAvL1x0cmVmZXJlbmNlIG9ubHkgLSB0aGVzZSBvcHRpb25zIGFyZSBOT1QgcmVxdWlyZWQgYmVjYXVzZSAndHJ1ZScgaXMgdGhlIGRlZmF1bHRcclxuICAgICAgICBjbG9zYWJsZTogdHJ1ZVx0Ly8gcGFuZSBjYW4gb3BlbiAmIGNsb3NlXHJcbiAgICAgICAgLCByZXNpemFibGU6IHRydWVcdC8vIHdoZW4gb3BlbiwgcGFuZSBjYW4gYmUgcmVzaXplZCBcclxuICAgICAgICAsIHNsaWRhYmxlOiB0cnVlXHQvLyB3aGVuIGNsb3NlZCwgcGFuZSBjYW4gJ3NsaWRlJyBvcGVuIG92ZXIgb3RoZXIgcGFuZXMgLSBjbG9zZXMgb24gbW91c2Utb3V0XHJcbiAgICAgICAgLCBsaXZlUGFuZVJlc2l6aW5nOiB0cnVlXHJcblxyXG4gICAgICAgIC8vXHRzb21lIHJlc2l6aW5nL3RvZ2dsaW5nIHNldHRpbmdzXHJcbiAgICAgICAgLCBub3J0aF9fc2xpZGFibGU6IGZhbHNlXHQvLyBPVkVSUklERSB0aGUgcGFuZS1kZWZhdWx0IG9mICdzbGlkYWJsZT10cnVlJ1xyXG4gICAgICAgIC8vLCBub3J0aF9fdG9nZ2xlckxlbmd0aF9jbG9zZWQ6ICcxMDAlJ1x0Ly8gdG9nZ2xlLWJ1dHRvbiBpcyBmdWxsLXdpZHRoIG9mIHJlc2l6ZXItYmFyXHJcbiAgICAgICAgLCBub3J0aF9fc3BhY2luZ19jbG9zZWQ6IDZcdFx0Ly8gYmlnIHJlc2l6ZXItYmFyIHdoZW4gb3BlbiAoemVybyBoZWlnaHQpXHJcbiAgICAgICAgLCBub3J0aF9fc3BhY2luZ19vcGVuOjBcclxuICAgICAgICAsIG5vcnRoX19yZXNpemFibGU6IGZhbHNlXHQvLyBPVkVSUklERSB0aGUgcGFuZS1kZWZhdWx0IG9mICdyZXNpemFibGU9dHJ1ZSdcclxuICAgICAgICAsIG5vcnRoX19jbG9zYWJsZTogZmFsc2VcclxuICAgICAgICAsIHdlc3RfX2Nsb3NhYmxlOiBmYWxzZVxyXG4gICAgICAgICwgZWFzdF9fY2xvc2FibGU6IGZhbHNlXHJcbiAgICAgICAgXHJcblxyXG4gICAgICAgIC8vXHRzb21lIHBhbmUtc2l6ZSBzZXR0aW5nc1xyXG4gICAgICAgICwgd2VzdF9fbWluU2l6ZTogMTAwXHJcbiAgICAgICAgLCBlYXN0X19zaXplOiAzMDBcclxuICAgICAgICAsIGVhc3RfX21pblNpemU6IDIwMFxyXG4gICAgICAgICwgZWFzdF9fbWF4U2l6ZTogLjUgLy8gNTAlIG9mIGxheW91dCB3aWR0aFxyXG4gICAgICAgICwgY2VudGVyX19taW5XaWR0aDogMTAwXHJcbiAgICAgICAgLGVhc3RfX2Nsb3NhYmxlOiBmYWxzZVxyXG4gICAgICAgICx3ZXN0X19jbG9zYWJsZTogZmFsc2VcclxuICAgICAgICAsZWFzdF9faW5pdENsb3NlZDpcdHRydWVcclxuICAgIH0pO1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICpcdERJU0FCTEUgVEVYVC1TRUxFQ1RJT04gV0hFTiBEUkFHR0lORyAob3IgZXZlbiBfdHJ5aW5nXyB0byBkcmFnISlcclxuICAgICAqXHR0aGlzIGZ1bmN0aW9uYWxpdHkgd2lsbCBiZSBpbmNsdWRlZCBpbiBSQzMwLjgwXHJcbiAgICAgKi9cclxuICAgICQubGF5b3V0LmRpc2FibGVUZXh0U2VsZWN0aW9uID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkZCA9ICQoZG9jdW1lbnQpXHJcbiAgICAgICAgICAgICwgcyA9ICd0ZXh0U2VsZWN0aW9uRGlzYWJsZWQnXHJcbiAgICAgICAgICAgICwgeCA9ICd0ZXh0U2VsZWN0aW9uSW5pdGlhbGl6ZWQnXHJcbiAgICAgICAgICAgIDtcclxuICAgICAgICBpZiAoJC5mbi5kaXNhYmxlU2VsZWN0aW9uKSB7XHJcbiAgICAgICAgICAgIGlmICghJGQuZGF0YSh4KSkgLy8gZG9jdW1lbnQgaGFzbid0IGJlZW4gaW5pdGlhbGl6ZWQgeWV0XHJcbiAgICAgICAgICAgICAgICAkZC5vbignbW91c2V1cCcsICQubGF5b3V0LmVuYWJsZVRleHRTZWxlY3Rpb24pLmRhdGEoeCwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIGlmICghJGQuZGF0YShzKSlcclxuICAgICAgICAgICAgICAgICRkLmRpc2FibGVTZWxlY3Rpb24oKS5kYXRhKHMsIHRydWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvL2NvbnNvbGUubG9nKCckLmxheW91dC5kaXNhYmxlVGV4dFNlbGVjdGlvbicpO1xyXG4gICAgfTtcclxuICAgICQubGF5b3V0LmVuYWJsZVRleHRTZWxlY3Rpb24gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICRkID0gJChkb2N1bWVudClcclxuICAgICAgICAgICAgLCBzID0gJ3RleHRTZWxlY3Rpb25EaXNhYmxlZCc7XHJcbiAgICAgICAgaWYgKCQuZm4uZW5hYmxlU2VsZWN0aW9uICYmICRkLmRhdGEocykpXHJcbiAgICAgICAgICAgICRkLmVuYWJsZVNlbGVjdGlvbigpLmRhdGEocywgZmFsc2UpO1xyXG4gICAgICAgIC8vY29uc29sZS5sb2coJyQubGF5b3V0LmVuYWJsZVRleHRTZWxlY3Rpb24nKTtcclxuICAgIH07XHJcbiAgICAkKFwiLnVpLWxheW91dC1yZXNpemVyLW5vcnRoXCIpLmhpZGUoKVxyXG4gICAgJChcIi51aS1sYXlvdXQtd2VzdFwiKS5jc3MoXCJib3JkZXItcmlnaHRcIixcInNvbGlkIDFweCBsaWdodEdyYXlcIilcclxuICAgICQoXCIudWktbGF5b3V0LXdlc3RcIikuYWRkQ2xhc3MoXCJ3My1jYXJkXCIpXHJcblxyXG59XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgZGlnaXRhbHR3aW5tb2R1bGVVSSgpOyIsImNvbnN0IGFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nID0gcmVxdWlyZShcIi4vYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2dcIilcclxuY29uc3Qgc2ltcGxlU2VsZWN0TWVudT0gcmVxdWlyZShcIi4vc2ltcGxlU2VsZWN0TWVudVwiKVxyXG5jb25zdCBzaW1wbGVDb25maXJtRGlhbG9nID0gcmVxdWlyZShcIi4vc2ltcGxlQ29uZmlybURpYWxvZ1wiKVxyXG5cclxuZnVuY3Rpb24gZWRpdExheW91dERpYWxvZygpIHtcclxuICAgIGlmKCF0aGlzLkRPTSl7XHJcbiAgICAgICAgdGhpcy5ET00gPSAkKCc8ZGl2IHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dG9wOjUwJTtiYWNrZ3JvdW5kLWNvbG9yOndoaXRlO2xlZnQ6NTAlO3RyYW5zZm9ybTogdHJhbnNsYXRlWCgtNTAlKSB0cmFuc2xhdGVZKC01MCUpO3otaW5kZXg6MTAxXCIgY2xhc3M9XCJ3My1jYXJkLTJcIj48L2Rpdj4nKVxyXG4gICAgICAgICQoXCJib2R5XCIpLmFwcGVuZCh0aGlzLkRPTSlcclxuICAgICAgICB0aGlzLkRPTS5oaWRlKClcclxuICAgIH1cclxuICAgIHRoaXMubGF5b3V0SlNPTj17fVxyXG4gICAgdGhpcy5jdXJyZW50TGF5b3V0TmFtZT1udWxsXHJcbn1cclxuXHJcbmVkaXRMYXlvdXREaWFsb2cucHJvdG90eXBlLmdldEN1ckFEVE5hbWU9ZnVuY3Rpb24oKXtcclxuICAgIHZhciBhZHROYW1lID0gYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cuc2VsZWN0ZWRBRFRcclxuICAgIHZhciBzdHIgPSBhZHROYW1lLnJlcGxhY2UoXCJodHRwczovL1wiLCBcIlwiKVxyXG4gICAgcmV0dXJuIHN0clxyXG59XHJcblxyXG5lZGl0TGF5b3V0RGlhbG9nLnByb3RvdHlwZS5yeE1lc3NhZ2U9ZnVuY3Rpb24obXNnUGF5bG9hZCl7XHJcbiAgICBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiQURURGF0YXNvdXJjZUNoYW5nZV9yZXBsYWNlXCIpIHtcclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgICQucG9zdChcImxheW91dC9yZWFkTGF5b3V0c1wiLHthZHROYW1lOnRoaXMuZ2V0Q3VyQURUTmFtZSgpfSwgKGRhdGEsIHN0YXR1cykgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYoZGF0YSE9XCJcIiAmJiB0eXBlb2YoZGF0YSk9PT1cIm9iamVjdFwiKSB0aGlzLmxheW91dEpTT049ZGF0YTtcclxuICAgICAgICAgICAgICAgIGVsc2UgdGhpcy5sYXlvdXRKU09OPXt9O1xyXG4gICAgICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwibGF5b3V0c1VwZGF0ZWRcIn0pXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfWNhdGNoKGUpe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgIH1cclxuICAgIFxyXG4gICAgfVxyXG59XHJcblxyXG5lZGl0TGF5b3V0RGlhbG9nLnByb3RvdHlwZS5yZWZpbGxPcHRpb25zID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jbGVhck9wdGlvbnMoKVxyXG4gICAgXHJcbiAgICBmb3IodmFyIGluZCBpbiB0aGlzLmxheW91dEpTT04pe1xyXG4gICAgICAgIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuYWRkT3B0aW9uKGluZClcclxuICAgIH1cclxufVxyXG5cclxuZWRpdExheW91dERpYWxvZy5wcm90b3R5cGUucG9wdXAgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLkRPTS5zaG93KClcclxuICAgIHRoaXMuRE9NLmVtcHR5KClcclxuXHJcbiAgICB0aGlzLkRPTS5jc3Moe1wid2lkdGhcIjpcIjMyMHB4XCIsXCJwYWRkaW5nLWJvdHRvbVwiOlwiM3B4XCJ9KVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6NDBweDttYXJnaW4tYm90dG9tOjJweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiZm9udC1zaXplOjEuMmVtXCI+TGF5b3V0PC9kaXY+PC9kaXY+JykpXHJcbiAgICB2YXIgY2xvc2VCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJpZ2h0XCIgc3R5bGU9XCJmb250LXNpemU6MmVtO3BhZGRpbmctdG9wOjRweFwiPsOXPC9idXR0b24+JylcclxuICAgIHRoaXMuRE9NLmNoaWxkcmVuKCc6Zmlyc3QnKS5hcHBlbmQoY2xvc2VCdXR0b24pXHJcbiAgICBjbG9zZUJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5ET00uaGlkZSgpIH0pXHJcblxyXG4gICAgdmFyIG5hbWVJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTsgd2lkdGg6MTgwcHg7IGRpc3BsYXk6aW5saW5lO21hcmdpbi1sZWZ0OjJweDttYXJnaW4tcmlnaHQ6MnB4XCIgIHBsYWNlaG9sZGVyPVwiRmlsbCBpbiBhIG5ldyBsYXlvdXQgbmFtZS4uLlwiLz4nKS5hZGRDbGFzcyhcInczLWlucHV0IHczLWJvcmRlclwiKTsgICBcclxuICAgIHRoaXMuRE9NLmFwcGVuZChuYW1lSW5wdXQpXHJcbiAgICB2YXIgc2F2ZUFzTmV3QnRuPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtZ3JlZW4gdzMtaG92ZXItbGlnaHQtZ3JlZW5cIj5TYXZlIEFzIE5ldzwvYnV0dG9uPicpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQoc2F2ZUFzTmV3QnRuKVxyXG4gICAgc2F2ZUFzTmV3QnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuc2F2ZUludG9MYXlvdXQobmFtZUlucHV0LnZhbCgpKX0pXHJcblxyXG5cclxuICAgIGlmKCFqUXVlcnkuaXNFbXB0eU9iamVjdCh0aGlzLmxheW91dEpTT04pKXtcclxuICAgICAgICB2YXIgbGJsPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXIgdzMtcGFkZGluZy0xNlwiIHN0eWxlPVwidGV4dC1hbGlnbjpjZW50ZXI7XCI+LSBPUiAtPC9kaXY+JylcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQobGJsKSBcclxuICAgICAgICB2YXIgc3dpdGNoTGF5b3V0U2VsZWN0b3I9bmV3IHNpbXBsZVNlbGVjdE1lbnUoXCJcIix7Zm9udFNpemU6XCIxZW1cIixjb2xvckNsYXNzOlwidzMtbGlnaHQtZ3JheVwiLHdpZHRoOlwiMTIwcHhcIn0pXHJcbiAgICAgICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvcj1zd2l0Y2hMYXlvdXRTZWxlY3RvclxyXG4gICAgICAgIHRoaXMucmVmaWxsT3B0aW9ucygpXHJcbiAgICAgICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jYWxsQmFja19jbGlja09wdGlvbj0ob3B0aW9uVGV4dCxvcHRpb25WYWx1ZSk9PntcclxuICAgICAgICAgICAgaWYob3B0aW9uVGV4dD09bnVsbCkgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jaGFuZ2VOYW1lKFwiIFwiKVxyXG4gICAgICAgICAgICBlbHNlIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuY2hhbmdlTmFtZShvcHRpb25UZXh0KVxyXG4gICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgdmFyIHNhdmVBc0J0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWdyZWVuIHczLWhvdmVyLWxpZ2h0LWdyZWVuXCIgc3R5bGU9XCJtYXJnaW4tbGVmdDoycHg7bWFyZ2luLXJpZ2h0OjVweFwiPlNhdmUgQXM8L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBkZWxldGVCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1yZWQgdzMtaG92ZXItcGlua1wiIHN0eWxlPVwibWFyZ2luLWxlZnQ6NXB4XCI+RGVsZXRlIExheW91dDwvYnV0dG9uPicpXHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKHNhdmVBc0J0bixzd2l0Y2hMYXlvdXRTZWxlY3Rvci5ET00sZGVsZXRlQnRuKVxyXG4gICAgICAgIHNhdmVBc0J0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLnNhdmVJbnRvTGF5b3V0KHN3aXRjaExheW91dFNlbGVjdG9yLmN1clNlbGVjdFZhbCl9KVxyXG4gICAgICAgIGRlbGV0ZUJ0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLmRlbGV0ZUxheW91dChzd2l0Y2hMYXlvdXRTZWxlY3Rvci5jdXJTZWxlY3RWYWwpfSlcclxuXHJcbiAgICAgICAgaWYodGhpcy5jdXJyZW50TGF5b3V0TmFtZSE9bnVsbCl7XHJcbiAgICAgICAgICAgIHN3aXRjaExheW91dFNlbGVjdG9yLnRyaWdnZXJPcHRpb25WYWx1ZSh0aGlzLmN1cnJlbnRMYXlvdXROYW1lKVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBzd2l0Y2hMYXlvdXRTZWxlY3Rvci50cmlnZ2VyT3B0aW9uSW5kZXgoMClcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmVkaXRMYXlvdXREaWFsb2cucHJvdG90eXBlLnNhdmVJbnRvTGF5b3V0ID0gZnVuY3Rpb24gKGxheW91dE5hbWUpIHtcclxuICAgIGlmKGxheW91dE5hbWU9PVwiXCIgfHwgbGF5b3V0TmFtZT09bnVsbCl7XHJcbiAgICAgICAgYWxlcnQoXCJQbGVhc2UgY2hvb3NlIHRhcmdldCBsYXlvdXQgTmFtZVwiKVxyXG4gICAgICAgIHJldHVyblxyXG4gICAgfVxyXG4gICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwic2F2ZUxheW91dFwiLCBcImxheW91dE5hbWVcIjogbGF5b3V0TmFtZSwgXCJhZHROYW1lXCI6dGhpcy5nZXRDdXJBRFROYW1lKCkgfSlcclxuICAgIHRoaXMuRE9NLmhpZGUoKVxyXG59XHJcblxyXG5cclxuZWRpdExheW91dERpYWxvZy5wcm90b3R5cGUuZGVsZXRlTGF5b3V0ID0gZnVuY3Rpb24gKGxheW91dE5hbWUpIHtcclxuICAgIGlmKGxheW91dE5hbWU9PVwiXCIgfHwgbGF5b3V0TmFtZT09bnVsbCl7XHJcbiAgICAgICAgYWxlcnQoXCJQbGVhc2UgY2hvb3NlIHRhcmdldCBsYXlvdXQgTmFtZVwiKVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgY29uZmlybURpYWxvZ0Rpdj1uZXcgc2ltcGxlQ29uZmlybURpYWxvZygpXHJcblxyXG4gICAgY29uZmlybURpYWxvZ0Rpdi5zaG93KFxyXG4gICAgICAgIHsgd2lkdGg6IFwiMjUwcHhcIiB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGl0bGU6IFwiQ29uZmlybVwiXHJcbiAgICAgICAgICAgICwgY29udGVudDogXCJQbGVhc2UgY29uZmlybSBkZWxldGluZyBsYXlvdXQgXFxcIlwiICsgbGF5b3V0TmFtZSArIFwiXFxcIj9cIlxyXG4gICAgICAgICAgICAsIGJ1dHRvbnM6W1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtcmVkIHczLWhvdmVyLXBpbmtcIiwgdGV4dDogXCJDb25maXJtXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMubGF5b3V0SlNPTltsYXlvdXROYW1lXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobGF5b3V0TmFtZSA9PSB0aGlzLmN1cnJlbnRMYXlvdXROYW1lKSB0aGlzLmN1cnJlbnRMYXlvdXROYW1lID0gbnVsbFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJsYXlvdXRzVXBkYXRlZFwiIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQucG9zdChcImxheW91dC9zYXZlTGF5b3V0c1wiLCB7IFwiYWR0TmFtZVwiOiB0aGlzLmdldEN1ckFEVE5hbWUoKSwgXCJsYXlvdXRzXCI6IEpTT04uc3RyaW5naWZ5KHRoaXMubGF5b3V0SlNPTikgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlZmlsbE9wdGlvbnMoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLnRyaWdnZXJPcHRpb25JbmRleCgwKVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1ncmF5XCIsdGV4dDogXCJDYW5jZWxcIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKClcclxuICAgICAgICAgICAgICAgIH19XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9XHJcbiAgICApXHJcblxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBlZGl0TGF5b3V0RGlhbG9nKCk7IiwiY29uc3QgYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cgPSByZXF1aXJlKFwiLi9hZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZ1wiKTtcclxuY29uc3QgbW9kZWxBbmFseXplciA9IHJlcXVpcmUoXCIuL21vZGVsQW5hbHl6ZXJcIik7XHJcbmNvbnN0IHNpbXBsZVNlbGVjdE1lbnU9IHJlcXVpcmUoXCIuL3NpbXBsZVNlbGVjdE1lbnVcIilcclxuXHJcbmZ1bmN0aW9uIGluZm9QYW5lbCgpIHtcclxuICAgIHRoaXMuY29udGluZXJET009JCgnPGRpdiBjbGFzcz1cInczLWNhcmRcIiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3otaW5kZXg6OTA7cmlnaHQ6MHB4O3RvcDo1MCU7aGVpZ2h0OjcwJTt3aWR0aDozMDBweDt0cmFuc2Zvcm06IHRyYW5zbGF0ZVkoLTUwJSk7XCI+PC9kaXY+JylcclxuICAgIHRoaXMuY29udGluZXJET00uaGlkZSgpXHJcbiAgICB0aGlzLmNvbnRpbmVyRE9NLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwiaGVpZ2h0OjUwcHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48L2Rpdj4nKSlcclxuXHJcbiAgICB0aGlzLmNsb3NlQnV0dG9uMT0kKCc8YnV0dG9uIHN0eWxlPVwiaGVpZ2h0OjEwMCVcIiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvblwiPjxpIGNsYXNzPVwiZmEgZmEtaW5mby1jaXJjbGUgZmEtMnhcIiBzdHlsZT1cInBhZGRpbmc6MnB4XCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICB0aGlzLmNsb3NlQnV0dG9uMj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJpZ2h0XCIgc3R5bGU9XCJmb250LXNpemU6MmVtXCI+w5c8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5jb250aW5lckRPTS5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKHRoaXMuY2xvc2VCdXR0b24xLHRoaXMuY2xvc2VCdXR0b24yKSBcclxuXHJcbiAgICB0aGlzLmlzTWluaW1pemVkPWZhbHNlO1xyXG4gICAgdmFyIGJ1dHRvbkFuaW09KCk9PntcclxuICAgICAgICBpZighdGhpcy5pc01pbmltaXplZCl7XHJcbiAgICAgICAgICAgIHRoaXMuY29udGluZXJET00uYW5pbWF0ZSh7XHJcbiAgICAgICAgICAgICAgICByaWdodDogXCItMjUwcHhcIixcclxuICAgICAgICAgICAgICAgIGhlaWdodDpcIjUwcHhcIlxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB0aGlzLmlzTWluaW1pemVkPXRydWU7XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHRoaXMuY29udGluZXJET00uYW5pbWF0ZSh7XHJcbiAgICAgICAgICAgICAgICByaWdodDogXCIwcHhcIixcclxuICAgICAgICAgICAgICAgIGhlaWdodDogXCI3MCVcIlxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB0aGlzLmlzTWluaW1pemVkPWZhbHNlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMuY2xvc2VCdXR0b24xLm9uKFwiY2xpY2tcIixidXR0b25BbmltKVxyXG4gICAgdGhpcy5jbG9zZUJ1dHRvbjIub24oXCJjbGlja1wiLGJ1dHRvbkFuaW0pXHJcblxyXG4gICAgdGhpcy5ET009JCgnPGRpdiBjbGFzcz1cInczLWNvbnRhaW5lclwiIHN0eWxlPVwicG9zdGlvbjphYnNvbHV0ZTt0b3A6NTBweDtoZWlnaHQ6Y2FsYygxMDAlIC0gNTBweCk7b3ZlcmZsb3c6YXV0b1wiPjwvZGl2PicpXHJcbiAgICB0aGlzLmNvbnRpbmVyRE9NLmNzcyhcImJhY2tncm91bmQtY29sb3JcIixcInJnYmEoMjU1LCAyNTUsIDI1NSwgMC44KVwiKVxyXG4gICAgdGhpcy5jb250aW5lckRPTS5hcHBlbmQodGhpcy5ET00pXHJcbiAgICAkKCdib2R5JykuYXBwZW5kKHRoaXMuY29udGluZXJET00pXHJcbiAgICB0aGlzLkRPTS5odG1sKFwiPGEgc3R5bGU9J2Rpc3BsYXk6YmxvY2s7Zm9udC1zdHlsZTppdGFsaWM7Y29sb3I6Z3JheSc+Q2hvb3NlIHR3aW5zIG9yIHJlbGF0aW9uc2hpcHMgdG8gdmlldyBpbmZvbXJhdGlvbjwvYT48YSBzdHlsZT0nZGlzcGxheTpibG9jaztmb250LXN0eWxlOml0YWxpYztjb2xvcjpncmF5O3BhZGRpbmctdG9wOjIwcHgnPlByZXNzIHNoaWZ0IGtleSB0byBzZWxlY3QgbXVsdGlwbGUgaW4gdG9wb2xvZ3kgdmlldzwvYT48YSBzdHlsZT0nZGlzcGxheTpibG9jaztmb250LXN0eWxlOml0YWxpYztjb2xvcjpncmF5O3BhZGRpbmctdG9wOjIwcHgnPlByZXNzIGN0cmwga2V5IHRvIHNlbGVjdCBtdWx0aXBsZSBpbiB0cmVlIHZpZXc8L2E+XCIpXHJcblxyXG4gICAgdGhpcy5zZWxlY3RlZE9iamVjdHM9bnVsbDtcclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5yeE1lc3NhZ2U9ZnVuY3Rpb24obXNnUGF5bG9hZCl7ICAgXHJcbiAgICBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiQURURGF0YXNvdXJjZURpYWxvZ19jbG9zZWRcIil7XHJcbiAgICAgICAgaWYoIXRoaXMuY29udGluZXJET00uaXMoXCI6dmlzaWJsZVwiKSkge1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRpbmVyRE9NLnNob3coKVxyXG4gICAgICAgICAgICB0aGlzLmNvbnRpbmVyRE9NLmFkZENsYXNzKFwidzMtYW5pbWF0ZS1yaWdodFwiKVxyXG4gICAgICAgIH1cclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJzZWxlY3ROb2Rlc1wiKXtcclxuICAgICAgICB0aGlzLkRPTS5lbXB0eSgpXHJcbiAgICAgICAgdmFyIGFycj1tc2dQYXlsb2FkLmluZm87XHJcbiAgICAgICAgdGhpcy5zZWxlY3RlZE9iamVjdHM9YXJyO1xyXG4gICAgICAgIGlmKGFyci5sZW5ndGg9PTEpe1xyXG4gICAgICAgICAgICB2YXIgc2luZ2xlRWxlbWVudEluZm89YXJyWzBdO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYoc2luZ2xlRWxlbWVudEluZm9bXCIkZHRJZFwiXSl7Ly8gc2VsZWN0IGEgbm9kZVxyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3QnV0dG9ucyhcInNpbmdsZU5vZGVcIilcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhd1N0YXRpY0luZm8odGhpcy5ET00se1wiJGR0SWRcIjpzaW5nbGVFbGVtZW50SW5mb1tcIiRkdElkXCJdfSxcIjFlbVwiLFwiMTNweFwiKVxyXG4gICAgICAgICAgICAgICAgdmFyIG1vZGVsTmFtZT1zaW5nbGVFbGVtZW50SW5mb1snJG1ldGFkYXRhJ11bJyRtb2RlbCddXHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGlmKG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbE5hbWVdKXtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYXdFZGl0YWJsZSh0aGlzLkRPTSxtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxOYW1lXS5lZGl0YWJsZVByb3BlcnRpZXMsc2luZ2xlRWxlbWVudEluZm8sW10pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyYXdTdGF0aWNJbmZvKHRoaXMuRE9NLHtcIiRldGFnXCI6c2luZ2xlRWxlbWVudEluZm9bXCIkZXRhZ1wiXSxcIiRtZXRhZGF0YVwiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJG1ldGFkYXRhXCJdfSxcIjFlbVwiLFwiMTBweFwiKVxyXG4gICAgICAgICAgICB9ZWxzZSBpZihzaW5nbGVFbGVtZW50SW5mb1tcIiRzb3VyY2VJZFwiXSl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyYXdCdXR0b25zKFwic2luZ2xlUmVsYXRpb25zaGlwXCIpXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyYXdTdGF0aWNJbmZvKHRoaXMuRE9NLHtcclxuICAgICAgICAgICAgICAgICAgICBcIiRzb3VyY2VJZFwiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJHNvdXJjZUlkXCJdLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiJHRhcmdldElkXCI6c2luZ2xlRWxlbWVudEluZm9bXCIkdGFyZ2V0SWRcIl0sXHJcbiAgICAgICAgICAgICAgICAgICAgXCIkcmVsYXRpb25zaGlwTmFtZVwiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJHJlbGF0aW9uc2hpcE5hbWVcIl0sXHJcbiAgICAgICAgICAgICAgICAgICAgXCIkcmVsYXRpb25zaGlwSWRcIjpzaW5nbGVFbGVtZW50SW5mb1tcIiRyZWxhdGlvbnNoaXBJZFwiXVxyXG4gICAgICAgICAgICAgICAgfSxcIjFlbVwiLFwiMTNweFwiKVxyXG4gICAgICAgICAgICAgICAgdmFyIHJlbGF0aW9uc2hpcE5hbWU9c2luZ2xlRWxlbWVudEluZm9bXCIkcmVsYXRpb25zaGlwTmFtZVwiXVxyXG4gICAgICAgICAgICAgICAgdmFyIHNvdXJjZU1vZGVsPXNpbmdsZUVsZW1lbnRJbmZvW1wic291cmNlTW9kZWxcIl1cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3RWRpdGFibGUodGhpcy5ET00sdGhpcy5nZXRSZWxhdGlvblNoaXBFZGl0YWJsZVByb3BlcnRpZXMocmVsYXRpb25zaGlwTmFtZSxzb3VyY2VNb2RlbCksc2luZ2xlRWxlbWVudEluZm8sW10pXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyYXdTdGF0aWNJbmZvKHRoaXMuRE9NLHtcIiRldGFnXCI6c2luZ2xlRWxlbWVudEluZm9bXCIkZXRhZ1wiXX0sXCIxZW1cIixcIjEwcHhcIixcIkRhcmtHcmF5XCIpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9ZWxzZSBpZihhcnIubGVuZ3RoPjEpe1xyXG4gICAgICAgICAgICB0aGlzLmRyYXdCdXR0b25zKFwibXVsdGlwbGVcIilcclxuICAgICAgICAgICAgdGhpcy5kcmF3TXVsdGlwbGVPYmooKVxyXG4gICAgICAgIH1cclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJzZWxlY3RHcm91cE5vZGVcIil7XHJcbiAgICAgICAgdGhpcy5ET00uZW1wdHkoKVxyXG4gICAgICAgIHZhciBtb2RlbElEID0gbXNnUGF5bG9hZC5pbmZvW1wiQGlkXCJdXHJcbiAgICAgICAgaWYoIW1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXSkgcmV0dXJuO1xyXG4gICAgICAgIHZhciB0d2luSnNvbiA9IHtcclxuICAgICAgICAgICAgXCIkbWV0YWRhdGFcIjoge1xyXG4gICAgICAgICAgICAgICAgXCIkbW9kZWxcIjogbW9kZWxJRFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBhZGRCdG4gPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtZ3JlZW4gdzMtaG92ZXItbGlnaHQtZ3JlZW4gdzMtbWFyZ2luXCI+QWRkIFR3aW48L2J1dHRvbj4nKVxyXG4gICAgICAgIHRoaXMuRE9NLmFwcGVuZChhZGRCdG4pXHJcblxyXG4gICAgICAgIGFkZEJ0bi5vbihcImNsaWNrXCIsKGUpID0+IHtcclxuICAgICAgICAgICAgaWYoIXR3aW5Kc29uW1wiJGR0SWRcIl18fHR3aW5Kc29uW1wiJGR0SWRcIl09PVwiXCIpe1xyXG4gICAgICAgICAgICAgICAgYWxlcnQoXCJQbGVhc2UgZmlsbCBpbiBuYW1lIGZvciB0aGUgbmV3IGRpZ2l0YWwgdHdpblwiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgY29tcG9uZW50c05hbWVBcnI9bW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdLmluY2x1ZGVkQ29tcG9uZW50c1xyXG4gICAgICAgICAgICBjb21wb25lbnRzTmFtZUFyci5mb3JFYWNoKG9uZUNvbXBvbmVudE5hbWU9PnsgLy9hZHQgc2VydmljZSByZXF1ZXN0aW5nIGFsbCBjb21wb25lbnQgYXBwZWFyIGJ5IG1hbmRhdG9yeVxyXG4gICAgICAgICAgICAgICAgaWYodHdpbkpzb25bb25lQ29tcG9uZW50TmFtZV09PW51bGwpdHdpbkpzb25bb25lQ29tcG9uZW50TmFtZV09e31cclxuICAgICAgICAgICAgICAgIHR3aW5Kc29uW29uZUNvbXBvbmVudE5hbWVdW1wiJG1ldGFkYXRhXCJdPSB7fVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAkLnBvc3QoXCJlZGl0QURUL3Vwc2VydERpZ2l0YWxUd2luXCIsIHtcIm5ld1R3aW5Kc29uXCI6SlNPTi5zdHJpbmdpZnkodHdpbkpzb24pfVxyXG4gICAgICAgICAgICAgICAgLCAoZGF0YSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkYXRhICE9IFwiXCIpIHsvL25vdCBzdWNjZXNzZnVsIGVkaXRpbmdcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWxlcnQoZGF0YSlcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL3N1Y2Nlc3NmdWwgZWRpdGluZywgdXBkYXRlIHRoZSBub2RlIG9yaWdpbmFsIGluZm9cclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGtleUxhYmVsPXRoaXMuRE9NLmZpbmQoJyNORVdUV0lOX0lETGFiZWwnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgSURJbnB1dD1rZXlMYWJlbC5maW5kKFwiaW5wdXRcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYoSURJbnB1dCkgSURJbnB1dC52YWwoXCJcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgJC5wb3N0KFwicXVlcnlBRFQvb25lVHdpbkluZm9cIix7dHdpbklEOnR3aW5Kc29uW1wiJGR0SWRcIl19LCAoZGF0YSk9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihkYXRhPT1cIlwiKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZy5zdG9yZWRUd2luc1tkYXRhW1wiJGR0SWRcIl1dID0gZGF0YTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImFkZE5ld1R3aW5cIix0d2luSW5mbzpkYXRhfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSkgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICB0aGlzLmRyYXdTdGF0aWNJbmZvKHRoaXMuRE9NLHtcclxuICAgICAgICAgICAgXCJNb2RlbFwiOm1vZGVsSURcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICBhZGRCdG4uZGF0YShcInR3aW5Kc29uXCIsdHdpbkpzb24pXHJcbiAgICAgICAgdmFyIGNvcHlQcm9wZXJ0eT1KU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXS5lZGl0YWJsZVByb3BlcnRpZXMpKVxyXG4gICAgICAgIGNvcHlQcm9wZXJ0eVsnJGR0SWQnXT1cInN0cmluZ1wiXHJcbiAgICAgICAgdGhpcy5kcmF3RWRpdGFibGUodGhpcy5ET00sY29weVByb3BlcnR5LHR3aW5Kc29uLFtdLFwibmV3VHdpblwiKVxyXG4gICAgICAgIC8vY29uc29sZS5sb2cobW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdKSBcclxuICAgIH1cclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5nZXRSZWxhdGlvblNoaXBFZGl0YWJsZVByb3BlcnRpZXM9ZnVuY3Rpb24ocmVsYXRpb25zaGlwTmFtZSxzb3VyY2VNb2RlbCl7XHJcbiAgICBpZighbW9kZWxBbmFseXplci5EVERMTW9kZWxzW3NvdXJjZU1vZGVsXSB8fCAhbW9kZWxBbmFseXplci5EVERMTW9kZWxzW3NvdXJjZU1vZGVsXS52YWxpZFJlbGF0aW9uc2hpcHNbcmVsYXRpb25zaGlwTmFtZV0pIHJldHVyblxyXG4gICAgcmV0dXJuIG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1tzb3VyY2VNb2RlbF0udmFsaWRSZWxhdGlvbnNoaXBzW3JlbGF0aW9uc2hpcE5hbWVdLmVkaXRhYmxlUmVsYXRpb25zaGlwUHJvcGVydGllc1xyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmRyYXdCdXR0b25zPWZ1bmN0aW9uKHNlbGVjdFR5cGUpe1xyXG4gICAgdmFyIHJlZnJlc2hCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ibGFja1wiPjxpIGNsYXNzPVwiZmEgZmEtcmVmcmVzaFwiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgcmVmcmVzaEJ0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLnJlZnJlc2hJbmZvbWF0aW9uKCl9KVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKHJlZnJlc2hCdG4pXHJcblxyXG4gICAgaWYoc2VsZWN0VHlwZT09XCJzaW5nbGVSZWxhdGlvbnNoaXBcIil7XHJcbiAgICAgICAgdmFyIGRlbEJ0biA9ICAkKCc8YnV0dG9uIHN0eWxlPVwid2lkdGg6ODAlXCIgY2xhc3M9XCJ3My1idXR0b24gdzMtcmVkIHczLWhvdmVyLXBpbmsgdzMtYm9yZGVyXCI+RGVsZXRlIEFsbDwvYnV0dG9uPicpXHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKGRlbEJ0bilcclxuICAgICAgICBkZWxCdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5kZWxldGVTZWxlY3RlZCgpfSlcclxuICAgIH1lbHNlIGlmKHNlbGVjdFR5cGU9PVwic2luZ2xlTm9kZVwiIHx8IHNlbGVjdFR5cGU9PVwibXVsdGlwbGVcIil7XHJcbiAgICAgICAgdmFyIGRlbEJ0biA9ICQoJzxidXR0b24gc3R5bGU9XCJ3aWR0aDo4MCVcIiBjbGFzcz1cInczLWJ1dHRvbiB3My1yZWQgdzMtaG92ZXItcGluayB3My1ib3JkZXJcIj5EZWxldGUgQWxsPC9idXR0b24+JylcclxuICAgICAgICB2YXIgY29ubmVjdFRvQnRuID0kKCc8YnV0dG9uIHN0eWxlPVwid2lkdGg6NDUlXCIgIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiPkNvbm5lY3QgdG88L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBjb25uZWN0RnJvbUJ0biA9ICQoJzxidXR0b24gc3R5bGU9XCJ3aWR0aDo0NSVcIiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj5Db25uZWN0IGZyb208L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBzaG93SW5ib3VuZEJ0biA9ICQoJzxidXR0b24gIHN0eWxlPVwid2lkdGg6NDUlXCIgY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+UXVlcnkgSW5ib3VuZDwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIHNob3dPdXRCb3VuZEJ0biA9ICQoJzxidXR0b24gc3R5bGU9XCJ3aWR0aDo0NSVcIiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj5RdWVyeSBPdXRib3VuZDwvYnV0dG9uPicpXHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKGRlbEJ0biwgY29ubmVjdFRvQnRuLGNvbm5lY3RGcm9tQnRuICwgc2hvd0luYm91bmRCdG4sIHNob3dPdXRCb3VuZEJ0bilcclxuICAgIFxyXG4gICAgICAgIHNob3dPdXRCb3VuZEJ0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLnNob3dPdXRCb3VuZCgpfSlcclxuICAgICAgICBzaG93SW5ib3VuZEJ0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLnNob3dJbkJvdW5kKCl9KSAgXHJcbiAgICAgICAgY29ubmVjdFRvQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImNvbm5lY3RUb1wifSkgfSlcclxuICAgICAgICBjb25uZWN0RnJvbUJ0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJjb25uZWN0RnJvbVwifSkgfSlcclxuXHJcbiAgICAgICAgZGVsQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuZGVsZXRlU2VsZWN0ZWQoKX0pXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHZhciBudW1PZk5vZGUgPSAwO1xyXG4gICAgdmFyIGFycj10aGlzLnNlbGVjdGVkT2JqZWN0cztcclxuICAgIGFyci5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIGlmIChlbGVtZW50WyckZHRJZCddKSBudW1PZk5vZGUrK1xyXG4gICAgfSk7XHJcbiAgICBpZihudW1PZk5vZGU+MCl7XHJcbiAgICAgICAgdmFyIHNlbGVjdEluYm91bmRCdG4gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiPitTZWxlY3QgSW5ib3VuZDwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIHNlbGVjdE91dEJvdW5kQnRuID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj4rU2VsZWN0IE91dGJvdW5kPC9idXR0b24+JylcclxuICAgICAgICB2YXIgY29zZUxheW91dEJ0bj0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj5DT1NFIFZpZXc8L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBoaWRlQnRuPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiPkhpZGU8L2J1dHRvbj4nKVxyXG4gICAgICAgIHRoaXMuRE9NLmFwcGVuZChzZWxlY3RJbmJvdW5kQnRuLCBzZWxlY3RPdXRCb3VuZEJ0bixjb3NlTGF5b3V0QnRuLGhpZGVCdG4pXHJcblxyXG4gICAgICAgIHNlbGVjdEluYm91bmRCdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5icm9hZGNhc3RNZXNzYWdlKHtcIm1lc3NhZ2VcIjogXCJhZGRTZWxlY3RJbmJvdW5kXCJ9KX0pXHJcbiAgICAgICAgc2VsZWN0T3V0Qm91bmRCdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5icm9hZGNhc3RNZXNzYWdlKHtcIm1lc3NhZ2VcIjogXCJhZGRTZWxlY3RPdXRib3VuZFwifSl9KVxyXG4gICAgICAgIGNvc2VMYXlvdXRCdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5icm9hZGNhc3RNZXNzYWdlKHtcIm1lc3NhZ2VcIjogXCJDT1NFU2VsZWN0ZWROb2Rlc1wifSl9KVxyXG4gICAgICAgIGhpZGVCdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5icm9hZGNhc3RNZXNzYWdlKHtcIm1lc3NhZ2VcIjogXCJoaWRlU2VsZWN0ZWROb2Rlc1wifSl9KVxyXG4gICAgfVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLnJlZnJlc2hJbmZvbWF0aW9uPWFzeW5jIGZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgYXJyPXRoaXMuc2VsZWN0ZWRPYmplY3RzO1xyXG4gICAgdmFyIHF1ZXJ5QXJyPVtdXHJcbiAgICBhcnIuZm9yRWFjaChvbmVJdGVtPT57XHJcbiAgICAgICAgaWYob25lSXRlbVsnJHJlbGF0aW9uc2hpcElkJ10pIHF1ZXJ5QXJyLnB1c2goeyckc291cmNlSWQnOm9uZUl0ZW1bJyRzb3VyY2VJZCddLCckcmVsYXRpb25zaGlwSWQnOm9uZUl0ZW1bJyRyZWxhdGlvbnNoaXBJZCddfSlcclxuICAgICAgICBlbHNlIHF1ZXJ5QXJyLnB1c2goeyckZHRJZCc6b25lSXRlbVsnJGR0SWQnXX0pXHJcbiAgICB9KVxyXG5cclxuICAgICQucG9zdChcInF1ZXJ5QURUL2ZldGNoSW5mb21hdGlvblwiLHtcImVsZW1lbnRzXCI6cXVlcnlBcnJ9LCAgKGRhdGEpPT4ge1xyXG4gICAgICAgIGlmKGRhdGE9PVwiXCIpIHJldHVybjtcclxuICAgICAgICBkYXRhLmZvckVhY2gob25lUmU9PntcclxuICAgICAgICAgICAgaWYob25lUmVbXCIkcmVsYXRpb25zaGlwSWRcIl0pey8vdXBkYXRlIHN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1xyXG4gICAgICAgICAgICAgICAgdmFyIHNyY0lEPSBvbmVSZVsnJHNvdXJjZUlkJ11cclxuICAgICAgICAgICAgICAgIHZhciByZWxhdGlvbnNoaXBJZD0gb25lUmVbJyRyZWxhdGlvbnNoaXBJZCddXHJcbiAgICAgICAgICAgICAgICBpZihhZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZy5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbc3JjSURdIT1udWxsKXtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVsYXRpb25zPWFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tzcmNJRF1cclxuICAgICAgICAgICAgICAgICAgICByZWxhdGlvbnMuZm9yRWFjaChvbmVTdG9yZWRSZWxhdGlvbj0+e1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZihvbmVTdG9yZWRSZWxhdGlvblsnJHJlbGF0aW9uc2hpcElkJ109PXJlbGF0aW9uc2hpcElkKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vdXBkYXRlIGFsbCBjb250ZW50XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IodmFyIGluZCBpbiBvbmVSZSl7IG9uZVN0b3JlZFJlbGF0aW9uW2luZF09b25lUmVbaW5kXSB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9ZWxzZXsvL3VwZGF0ZSBzdG9yZWRUd2luc1xyXG4gICAgICAgICAgICAgICAgdmFyIHR3aW5JRD0gb25lUmVbJyRkdElkJ11cclxuICAgICAgICAgICAgICAgIGlmKGFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLnN0b3JlZFR3aW5zW3R3aW5JRF0hPW51bGwpe1xyXG4gICAgICAgICAgICAgICAgICAgIGZvcih2YXIgaW5kIGluIG9uZVJlKXsgYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cuc3RvcmVkVHdpbnNbdHdpbklEXVtpbmRdPW9uZVJlW2luZF0gfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICBcclxuICAgICAgICAvL3JlZHJhdyBpbmZvcGFuZWwgaWYgbmVlZGVkXHJcbiAgICAgICAgaWYodGhpcy5zZWxlY3RlZE9iamVjdHMubGVuZ3RoPT0xKSB0aGlzLnJ4TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInNlbGVjdE5vZGVzXCIsIGluZm86IHRoaXMuc2VsZWN0ZWRPYmplY3RzIH0pXHJcbiAgICB9KTtcclxufVxyXG5cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZGVsZXRlU2VsZWN0ZWQ9YXN5bmMgZnVuY3Rpb24oKXtcclxuICAgIHZhciBhcnI9dGhpcy5zZWxlY3RlZE9iamVjdHM7XHJcbiAgICBpZihhcnIubGVuZ3RoPT0wKSByZXR1cm47XHJcbiAgICB2YXIgcmVsYXRpb25zQXJyPVtdXHJcbiAgICB2YXIgdHdpbklEQXJyPVtdXHJcbiAgICB2YXIgdHdpbklEcz17fVxyXG4gICAgYXJyLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgaWYgKGVsZW1lbnRbJyRzb3VyY2VJZCddKSByZWxhdGlvbnNBcnIucHVzaChlbGVtZW50KTtcclxuICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICB0d2luSURBcnIucHVzaChlbGVtZW50WyckZHRJZCddKVxyXG4gICAgICAgICAgICB0d2luSURzW2VsZW1lbnRbJyRkdElkJ11dPTFcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIGZvcih2YXIgaT1yZWxhdGlvbnNBcnIubGVuZ3RoLTE7aT49MDtpLS0peyAvL2NsZWFyIHRob3NlIHJlbGF0aW9uc2hpcHMgdGhhdCBhcmUgZ29pbmcgdG8gYmUgZGVsZXRlZCBhZnRlciB0d2lucyBkZWxldGluZ1xyXG4gICAgICAgIHZhciBzcmNJZD0gIHJlbGF0aW9uc0FycltpXVsnJHNvdXJjZUlkJ11cclxuICAgICAgICB2YXIgdGFyZ2V0SWQgPSByZWxhdGlvbnNBcnJbaV1bJyR0YXJnZXRJZCddXHJcbiAgICAgICAgaWYodHdpbklEc1tzcmNJZF0hPW51bGwgfHwgdHdpbklEc1t0YXJnZXRJZF0hPW51bGwpe1xyXG4gICAgICAgICAgICByZWxhdGlvbnNBcnIuc3BsaWNlKGksMSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB2YXIgY29uZmlybURpYWxvZ0Rpdj0kKFwiPGRpdi8+XCIpXHJcbiAgICB2YXIgZGlhbG9nU3RyPVwiXCJcclxuICAgIHZhciB0d2luTnVtYmVyPXR3aW5JREFyci5sZW5ndGg7XHJcbiAgICB2YXIgcmVsYXRpb25zTnVtYmVyID0gcmVsYXRpb25zQXJyLmxlbmd0aDtcclxuICAgIGlmKHR3aW5OdW1iZXI+MCkgZGlhbG9nU3RyID0gIHR3aW5OdW1iZXIrXCIgdHdpblwiKygodHdpbk51bWJlcj4xKT9cInNcIjpcIlwiKSArIFwiICh3aXRoIGNvbm5lY3RlZCByZWxhdGlvbnMpXCJcclxuICAgIGlmKHR3aW5OdW1iZXI+MCAmJiByZWxhdGlvbnNOdW1iZXI+MCkgZGlhbG9nU3RyKz1cIiBhbmQgYWRkaXRpb25hbCBcIlxyXG4gICAgaWYocmVsYXRpb25zTnVtYmVyPjApIGRpYWxvZ1N0ciArPSAgcmVsYXRpb25zTnVtYmVyK1wiIHJlbGF0aW9uXCIrKChyZWxhdGlvbnNOdW1iZXI+MSk/XCJzXCI6XCJcIiApXHJcbiAgICBkaWFsb2dTdHIrPVwiIHdpbGwgYmUgZGVsZXRlZC4gUGxlYXNlIGNvbmZpcm1cIlxyXG4gICAgY29uZmlybURpYWxvZ0Rpdi50ZXh0KGRpYWxvZ1N0cilcclxuICAgICQoJ2JvZHknKS5hcHBlbmQoY29uZmlybURpYWxvZ0RpdilcclxuICAgIGNvbmZpcm1EaWFsb2dEaXYuZGlhbG9nKHtcclxuICAgICAgICBidXR0b25zOiBbXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHRleHQ6IFwiQ29uZmlybVwiLFxyXG4gICAgICAgICAgICBjbGljazogKCk9PiB7XHJcbiAgICAgICAgICAgICAgICBpZih0d2luSURBcnIubGVuZ3RoPjApIHRoaXMuZGVsZXRlVHdpbnModHdpbklEQXJyKVxyXG4gICAgICAgICAgICAgICAgaWYocmVsYXRpb25zQXJyLmxlbmd0aD4wKSB0aGlzLmRlbGV0ZVJlbGF0aW9ucyhyZWxhdGlvbnNBcnIpXHJcbiAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmRpYWxvZyggXCJkZXN0cm95XCIgKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuRE9NLmVtcHR5KClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgdGV4dDogXCJDYW5jZWxcIixcclxuICAgICAgICAgICAgY2xpY2s6ICgpPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5kaWFsb2coIFwiZGVzdHJveVwiICk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICBdXHJcbiAgICAgIH0pOyBcclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5kZWxldGVUd2lucz1hc3luYyBmdW5jdGlvbih0d2luSURBcnIpeyAgIFxyXG4gICAgd2hpbGUodHdpbklEQXJyLmxlbmd0aD4wKXtcclxuICAgICAgICB2YXIgc21hbGxBcnI9IHR3aW5JREFyci5zcGxpY2UoMCwgMTAwKTtcclxuICAgICAgICB2YXIgcmVzdWx0PWF3YWl0IHRoaXMuZGVsZXRlUGFydGlhbFR3aW5zKHNtYWxsQXJyKVxyXG5cclxuICAgICAgICByZXN1bHQuZm9yRWFjaCgob25lSUQpPT57XHJcbiAgICAgICAgICAgIGRlbGV0ZSBhZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZy5zdG9yZWRUd2luc1tvbmVJRF1cclxuICAgICAgICAgICAgZGVsZXRlIGFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tvbmVJRF1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwidHdpbnNEZWxldGVkXCIsdHdpbklEQXJyOnJlc3VsdH0pXHJcbiAgICB9XHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZGVsZXRlUGFydGlhbFR3aW5zPSBhc3luYyBmdW5jdGlvbihJREFycil7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICAgJC5wb3N0KFwiZWRpdEFEVC9kZWxldGVUd2luc1wiLHthcnI6SURBcnJ9LCBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgaWYoZGF0YT09XCJcIikgZGF0YT1bXVxyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShkYXRhKVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIHJlamVjdChlKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1cclxuXHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmRlbGV0ZVJlbGF0aW9ucz1hc3luYyBmdW5jdGlvbihyZWxhdGlvbnNBcnIpe1xyXG4gICAgdmFyIGFycj1bXVxyXG4gICAgcmVsYXRpb25zQXJyLmZvckVhY2gob25lUmVsYXRpb249PntcclxuICAgICAgICBhcnIucHVzaCh7c3JjSUQ6b25lUmVsYXRpb25bJyRzb3VyY2VJZCddLHJlbElEOm9uZVJlbGF0aW9uWyckcmVsYXRpb25zaGlwSWQnXX0pXHJcbiAgICB9KVxyXG4gICAgJC5wb3N0KFwiZWRpdEFEVC9kZWxldGVSZWxhdGlvbnNcIix7XCJyZWxhdGlvbnNcIjphcnJ9LCAgKGRhdGEpPT4geyBcclxuICAgICAgICBpZihkYXRhPT1cIlwiKSBkYXRhPVtdO1xyXG4gICAgICAgIGFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLnN0b3JlVHdpblJlbGF0aW9uc2hpcHNfcmVtb3ZlKGRhdGEpXHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwicmVsYXRpb25zRGVsZXRlZFwiLFwicmVsYXRpb25zXCI6ZGF0YX0pXHJcbiAgICB9KTtcclxuICAgIFxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLnNob3dPdXRCb3VuZD1hc3luYyBmdW5jdGlvbigpe1xyXG4gICAgdmFyIGFycj10aGlzLnNlbGVjdGVkT2JqZWN0cztcclxuICAgIHZhciB0d2luSURBcnI9W11cclxuICAgIGFyci5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIGlmIChlbGVtZW50Wyckc291cmNlSWQnXSkgcmV0dXJuO1xyXG4gICAgICAgIHR3aW5JREFyci5wdXNoKGVsZW1lbnRbJyRkdElkJ10pXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgd2hpbGUodHdpbklEQXJyLmxlbmd0aD4wKXtcclxuICAgICAgICB2YXIgc21hbGxBcnI9IHR3aW5JREFyci5zcGxpY2UoMCwgMTAwKTtcclxuICAgICAgICB2YXIgZGF0YT1hd2FpdCB0aGlzLmZldGNoUGFydGlhbE91dGJvdW5kcyhzbWFsbEFycilcclxuICAgICAgICBpZihkYXRhPT1cIlwiKSBjb250aW51ZTtcclxuICAgICAgICAvL25ldyB0d2luJ3MgcmVsYXRpb25zaGlwIHNob3VsZCBiZSBzdG9yZWQgYXMgd2VsbFxyXG4gICAgICAgIGFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLnN0b3JlVHdpblJlbGF0aW9uc2hpcHMoZGF0YS5uZXdUd2luUmVsYXRpb25zKVxyXG4gICAgICAgIFxyXG4gICAgICAgIGRhdGEuY2hpbGRUd2luc0FuZFJlbGF0aW9ucy5mb3JFYWNoKG9uZVNldD0+e1xyXG4gICAgICAgICAgICBmb3IodmFyIGluZCBpbiBvbmVTZXQuY2hpbGRUd2lucyl7XHJcbiAgICAgICAgICAgICAgICB2YXIgb25lVHdpbj1vbmVTZXQuY2hpbGRUd2luc1tpbmRdXHJcbiAgICAgICAgICAgICAgICBhZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZy5zdG9yZWRUd2luc1tpbmRdPW9uZVR3aW5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiZHJhd1R3aW5zQW5kUmVsYXRpb25zXCIsaW5mbzpkYXRhfSlcclxuICAgICAgICBcclxuXHJcbiAgICB9XHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuc2hvd0luQm91bmQ9YXN5bmMgZnVuY3Rpb24oKXtcclxuICAgIHZhciBhcnI9dGhpcy5zZWxlY3RlZE9iamVjdHM7XHJcbiAgICB2YXIgdHdpbklEQXJyPVtdXHJcbiAgICBhcnIuZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICBpZiAoZWxlbWVudFsnJHNvdXJjZUlkJ10pIHJldHVybjtcclxuICAgICAgICB0d2luSURBcnIucHVzaChlbGVtZW50WyckZHRJZCddKVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHdoaWxlKHR3aW5JREFyci5sZW5ndGg+MCl7XHJcbiAgICAgICAgdmFyIHNtYWxsQXJyPSB0d2luSURBcnIuc3BsaWNlKDAsIDEwMCk7XHJcbiAgICAgICAgdmFyIGRhdGE9YXdhaXQgdGhpcy5mZXRjaFBhcnRpYWxJbmJvdW5kcyhzbWFsbEFycilcclxuICAgICAgICBpZihkYXRhPT1cIlwiKSBjb250aW51ZTtcclxuICAgICAgICAvL25ldyB0d2luJ3MgcmVsYXRpb25zaGlwIHNob3VsZCBiZSBzdG9yZWQgYXMgd2VsbFxyXG4gICAgICAgIGFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLnN0b3JlVHdpblJlbGF0aW9uc2hpcHMoZGF0YS5uZXdUd2luUmVsYXRpb25zKVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vZGF0YS5uZXdUd2luUmVsYXRpb25zLmZvckVhY2gob25lUmVsYXRpb249Pntjb25zb2xlLmxvZyhvbmVSZWxhdGlvblsnJHNvdXJjZUlkJ10rXCItPlwiK29uZVJlbGF0aW9uWyckdGFyZ2V0SWQnXSl9KVxyXG4gICAgICAgIC8vY29uc29sZS5sb2coYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW1wiZGVmYXVsdFwiXSlcclxuXHJcbiAgICAgICAgZGF0YS5jaGlsZFR3aW5zQW5kUmVsYXRpb25zLmZvckVhY2gob25lU2V0PT57XHJcbiAgICAgICAgICAgIGZvcih2YXIgaW5kIGluIG9uZVNldC5jaGlsZFR3aW5zKXtcclxuICAgICAgICAgICAgICAgIHZhciBvbmVUd2luPW9uZVNldC5jaGlsZFR3aW5zW2luZF1cclxuICAgICAgICAgICAgICAgIGFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLnN0b3JlZFR3aW5zW2luZF09b25lVHdpblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJkcmF3VHdpbnNBbmRSZWxhdGlvbnNcIixpbmZvOmRhdGF9KVxyXG4gICAgfVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmZldGNoUGFydGlhbE91dGJvdW5kcz0gYXN5bmMgZnVuY3Rpb24oSURBcnIpe1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgIC8vZmluZCBvdXQgdGhvc2UgZXhpc3RlZCBvdXRib3VuZCB3aXRoIGtub3duIHRhcmdldCBUd2lucyBzbyB0aGV5IGNhbiBiZSBleGNsdWRlZCBmcm9tIHF1ZXJ5XHJcbiAgICAgICAgICAgIHZhciBrbm93blRhcmdldFR3aW5zPXt9XHJcbiAgICAgICAgICAgIElEQXJyLmZvckVhY2gob25lSUQ9PntcclxuICAgICAgICAgICAgICAgIGtub3duVGFyZ2V0VHdpbnNbb25lSURdPTEgLy9pdHNlbGYgYWxzbyBpcyBrbm93blxyXG4gICAgICAgICAgICAgICAgdmFyIG91dEJvdW5kUmVsYXRpb249YWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW29uZUlEXVxyXG4gICAgICAgICAgICAgICAgaWYob3V0Qm91bmRSZWxhdGlvbil7XHJcbiAgICAgICAgICAgICAgICAgICAgb3V0Qm91bmRSZWxhdGlvbi5mb3JFYWNoKG9uZVJlbGF0aW9uPT57XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0YXJnZXRJRD1vbmVSZWxhdGlvbltcIiR0YXJnZXRJZFwiXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZihhZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZy5zdG9yZWRUd2luc1t0YXJnZXRJRF0hPW51bGwpIGtub3duVGFyZ2V0VHdpbnNbdGFyZ2V0SURdPTFcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgICAgJC5wb3N0KFwicXVlcnlBRFQvc2hvd091dEJvdW5kXCIse2FycjpJREFycixcImtub3duVGFyZ2V0c1wiOmtub3duVGFyZ2V0VHdpbnN9LCBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShkYXRhKVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIHJlamVjdChlKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZmV0Y2hQYXJ0aWFsSW5ib3VuZHM9IGFzeW5jIGZ1bmN0aW9uKElEQXJyKXtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICAvL2ZpbmQgb3V0IHRob3NlIGV4aXN0ZWQgaW5ib3VuZCB3aXRoIGtub3duIHNvdXJjZSBUd2lucyBzbyB0aGV5IGNhbiBiZSBleGNsdWRlZCBmcm9tIHF1ZXJ5XHJcbiAgICAgICAgICAgIHZhciBrbm93blNvdXJjZVR3aW5zPXt9XHJcbiAgICAgICAgICAgIHZhciBJRERpY3Q9e31cclxuICAgICAgICAgICAgSURBcnIuZm9yRWFjaChvbmVJRD0+e1xyXG4gICAgICAgICAgICAgICAgSUREaWN0W29uZUlEXT0xXHJcbiAgICAgICAgICAgICAgICBrbm93blNvdXJjZVR3aW5zW29uZUlEXT0xIC8vaXRzZWxmIGFsc28gaXMga25vd25cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgZm9yKHZhciB0d2luSUQgaW4gYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzKXtcclxuICAgICAgICAgICAgICAgIHZhciByZWxhdGlvbnM9YWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW3R3aW5JRF1cclxuICAgICAgICAgICAgICAgIHJlbGF0aW9ucy5mb3JFYWNoKG9uZVJlbGF0aW9uPT57XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRhcmdldElEPW9uZVJlbGF0aW9uWyckdGFyZ2V0SWQnXVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBzcmNJRD1vbmVSZWxhdGlvblsnJHNvdXJjZUlkJ11cclxuICAgICAgICAgICAgICAgICAgICBpZihJRERpY3RbdGFyZ2V0SURdIT1udWxsKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYoYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cuc3RvcmVkVHdpbnNbc3JjSURdIT1udWxsKSBrbm93blNvdXJjZVR3aW5zW3NyY0lEXT0xXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgJC5wb3N0KFwicXVlcnlBRFQvc2hvd0luQm91bmRcIix7YXJyOklEQXJyLFwia25vd25Tb3VyY2VzXCI6a25vd25Tb3VyY2VUd2luc30sIGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKGRhdGEpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1jYXRjaChlKXtcclxuICAgICAgICAgICAgcmVqZWN0KGUpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5kcmF3TXVsdGlwbGVPYmo9ZnVuY3Rpb24oKXtcclxuICAgIHZhciBudW1PZkVkZ2UgPSAwO1xyXG4gICAgdmFyIG51bU9mTm9kZSA9IDA7XHJcbiAgICB2YXIgYXJyPXRoaXMuc2VsZWN0ZWRPYmplY3RzO1xyXG4gICAgaWYoYXJyPT1udWxsKSByZXR1cm47XHJcbiAgICBhcnIuZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICBpZiAoZWxlbWVudFsnJHNvdXJjZUlkJ10pIG51bU9mRWRnZSsrXHJcbiAgICAgICAgZWxzZSBudW1PZk5vZGUrK1xyXG4gICAgfSk7XHJcbiAgICB2YXIgdGV4dERpdj0kKFwiPGxhYmVsIHN0eWxlPSdkaXNwbGF5OmJsb2NrO21hcmdpbi10b3A6MTBweCc+PC9sYWJlbD5cIilcclxuICAgIHRleHREaXYudGV4dChudW1PZk5vZGUrIFwiIG5vZGVcIisoKG51bU9mTm9kZTw9MSk/XCJcIjpcInNcIikrXCIsIFwiK251bU9mRWRnZStcIiByZWxhdGlvbnNoaXBcIisoKG51bU9mRWRnZTw9MSk/XCJcIjpcInNcIikpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQodGV4dERpdilcclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5kcmF3U3RhdGljSW5mbz1mdW5jdGlvbihwYXJlbnQsanNvbkluZm8scGFkZGluZ1RvcCxmb250U2l6ZSl7XHJcbiAgICBmb3IodmFyIGluZCBpbiBqc29uSW5mbyl7XHJcbiAgICAgICAgdmFyIGtleURpdj0gJChcIjxsYWJlbCBzdHlsZT0nZGlzcGxheTpibG9jayc+PGRpdiBjbGFzcz0ndzMtYm9yZGVyJyBzdHlsZT0nYmFja2dyb3VuZC1jb2xvcjojZjZmNmY2O2Rpc3BsYXk6aW5saW5lO3BhZGRpbmc6LjFlbSAuM2VtIC4xZW0gLjNlbTttYXJnaW4tcmlnaHQ6LjNlbSc+XCIraW5kK1wiPC9kaXY+PC9sYWJlbD5cIilcclxuICAgICAgICBrZXlEaXYuY3NzKHtcImZvbnRTaXplXCI6Zm9udFNpemUsXCJjb2xvclwiOlwiZGFya0dyYXlcIn0pXHJcbiAgICAgICAgcGFyZW50LmFwcGVuZChrZXlEaXYpXHJcbiAgICAgICAga2V5RGl2LmNzcyhcInBhZGRpbmctdG9wXCIscGFkZGluZ1RvcClcclxuXHJcbiAgICAgICAgdmFyIGNvbnRlbnRET009JChcIjxsYWJlbD48L2xhYmVsPlwiKVxyXG4gICAgICAgIGlmKHR5cGVvZihqc29uSW5mb1tpbmRdKT09PVwib2JqZWN0XCIpIHtcclxuICAgICAgICAgICAgY29udGVudERPTS5jc3MoXCJkaXNwbGF5XCIsXCJibG9ja1wiKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLmNzcyhcInBhZGRpbmctbGVmdFwiLFwiMWVtXCIpXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd1N0YXRpY0luZm8oY29udGVudERPTSxqc29uSW5mb1tpbmRdLFwiLjVlbVwiLGZvbnRTaXplKVxyXG4gICAgICAgIH1lbHNlIHtcclxuICAgICAgICAgICAgY29udGVudERPTS5jc3MoXCJwYWRkaW5nLXRvcFwiLFwiLjJlbVwiKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLnRleHQoanNvbkluZm9baW5kXSlcclxuICAgICAgICB9XHJcbiAgICAgICAgY29udGVudERPTS5jc3Moe1wiZm9udFNpemVcIjpmb250U2l6ZSxcImNvbG9yXCI6XCJibGFja1wifSlcclxuICAgICAgICBrZXlEaXYuYXBwZW5kKGNvbnRlbnRET00pXHJcbiAgICB9XHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZHJhd0VkaXRhYmxlPWZ1bmN0aW9uKHBhcmVudCxqc29uSW5mbyxvcmlnaW5FbGVtZW50SW5mbyxwYXRoQXJyLGlzTmV3VHdpbil7XHJcbiAgICBpZihqc29uSW5mbz09bnVsbCkgcmV0dXJuO1xyXG4gICAgZm9yKHZhciBpbmQgaW4ganNvbkluZm8pe1xyXG4gICAgICAgIHZhciBrZXlEaXY9ICQoXCI8bGFiZWwgc3R5bGU9J2Rpc3BsYXk6YmxvY2snPjxkaXYgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO3BhZGRpbmc6LjFlbSAuM2VtIC4xZW0gLjNlbTsgZm9udC13ZWlnaHQ6Ym9sZDtjb2xvcjpibGFjayc+XCIraW5kK1wiPC9kaXY+PC9sYWJlbD5cIilcclxuICAgICAgICBpZihpc05ld1R3aW4pe1xyXG4gICAgICAgICAgICBpZihpbmQ9PVwiJGR0SWRcIikge1xyXG4gICAgICAgICAgICAgICAgcGFyZW50LnByZXBlbmQoa2V5RGl2KVxyXG4gICAgICAgICAgICAgICAga2V5RGl2LmF0dHIoJ2lkJywnTkVXVFdJTl9JRExhYmVsJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSBwYXJlbnQuYXBwZW5kKGtleURpdilcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgcGFyZW50LmFwcGVuZChrZXlEaXYpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGtleURpdi5jc3MoXCJwYWRkaW5nLXRvcFwiLFwiLjNlbVwiKSBcclxuXHJcbiAgICAgICAgdmFyIGNvbnRlbnRET009JChcIjxsYWJlbCBzdHlsZT0ncGFkZGluZy10b3A6LjJlbSc+PC9sYWJlbD5cIilcclxuICAgICAgICB2YXIgbmV3UGF0aD1wYXRoQXJyLmNvbmNhdChbaW5kXSlcclxuICAgICAgICBpZihBcnJheS5pc0FycmF5KGpzb25JbmZvW2luZF0pKXtcclxuICAgICAgICAgICAgdGhpcy5kcmF3RHJvcGRvd25PcHRpb24oY29udGVudERPTSxuZXdQYXRoLGpzb25JbmZvW2luZF0saXNOZXdUd2luLG9yaWdpbkVsZW1lbnRJbmZvKVxyXG4gICAgICAgIH1lbHNlIGlmKHR5cGVvZihqc29uSW5mb1tpbmRdKT09PVwib2JqZWN0XCIpIHtcclxuICAgICAgICAgICAgY29udGVudERPTS5jc3MoXCJkaXNwbGF5XCIsXCJibG9ja1wiKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLmNzcyhcInBhZGRpbmctbGVmdFwiLFwiMWVtXCIpXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd0VkaXRhYmxlKGNvbnRlbnRET00sanNvbkluZm9baW5kXSxvcmlnaW5FbGVtZW50SW5mbyxuZXdQYXRoLGlzTmV3VHdpbilcclxuICAgICAgICB9ZWxzZSB7XHJcbiAgICAgICAgICAgIHZhciBhSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJwYWRkaW5nOjJweDt3aWR0aDo1MCU7b3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lXCIgcGxhY2Vob2xkZXI9XCJ0eXBlOiAnK2pzb25JbmZvW2luZF0rJ1wiLz4nKS5hZGRDbGFzcyhcInczLWlucHV0IHczLWJvcmRlclwiKTsgIFxyXG4gICAgICAgICAgICBjb250ZW50RE9NLmFwcGVuZChhSW5wdXQpXHJcbiAgICAgICAgICAgIHZhciB2YWw9dGhpcy5zZWFyY2hWYWx1ZShvcmlnaW5FbGVtZW50SW5mbyxuZXdQYXRoKVxyXG4gICAgICAgICAgICBpZih2YWwhPW51bGwpIGFJbnB1dC52YWwodmFsKVxyXG4gICAgICAgICAgICBhSW5wdXQuZGF0YShcInBhdGhcIiwgbmV3UGF0aClcclxuICAgICAgICAgICAgYUlucHV0LmRhdGEoXCJkYXRhVHlwZVwiLCBqc29uSW5mb1tpbmRdKVxyXG4gICAgICAgICAgICBhSW5wdXQuY2hhbmdlKChlKT0+e1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lZGl0RFRQcm9wZXJ0eShvcmlnaW5FbGVtZW50SW5mbywkKGUudGFyZ2V0KS5kYXRhKFwicGF0aFwiKSwkKGUudGFyZ2V0KS52YWwoKSwkKGUudGFyZ2V0KS5kYXRhKFwiZGF0YVR5cGVcIiksaXNOZXdUd2luKVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgICAgICBrZXlEaXYuYXBwZW5kKGNvbnRlbnRET00pXHJcbiAgICB9XHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZHJhd0Ryb3Bkb3duT3B0aW9uPWZ1bmN0aW9uKGNvbnRlbnRET00sbmV3UGF0aCx2YWx1ZUFycixpc05ld1R3aW4sb3JpZ2luRWxlbWVudEluZm8pe1xyXG4gICAgdmFyIGFTZWxlY3RNZW51PW5ldyBzaW1wbGVTZWxlY3RNZW51KFwiXCIse2J1dHRvbkNTUzp7XCJwYWRkaW5nXCI6XCI0cHggMTZweFwifX0pXHJcbiAgICBjb250ZW50RE9NLmFwcGVuZChhU2VsZWN0TWVudS5ET00pXHJcbiAgICBhU2VsZWN0TWVudS5ET00uZGF0YShcInBhdGhcIiwgbmV3UGF0aClcclxuICAgIHZhbHVlQXJyLmZvckVhY2goKG9uZU9wdGlvbik9PntcclxuICAgICAgICB2YXIgc3RyID1vbmVPcHRpb25bXCJkaXNwbGF5TmFtZVwiXSAgfHwgb25lT3B0aW9uW1wiZW51bVZhbHVlXCJdIFxyXG4gICAgICAgIGFTZWxlY3RNZW51LmFkZE9wdGlvbihzdHIpXHJcbiAgICB9KVxyXG4gICAgYVNlbGVjdE1lbnUuY2FsbEJhY2tfY2xpY2tPcHRpb249KG9wdGlvblRleHQsb3B0aW9uVmFsdWUpPT57XHJcbiAgICAgICAgYVNlbGVjdE1lbnUuY2hhbmdlTmFtZShvcHRpb25UZXh0KVxyXG4gICAgICAgIHRoaXMuZWRpdERUUHJvcGVydHkob3JpZ2luRWxlbWVudEluZm8sYVNlbGVjdE1lbnUuRE9NLmRhdGEoXCJwYXRoXCIpLG9wdGlvblZhbHVlLFwic3RyaW5nXCIsaXNOZXdUd2luKVxyXG4gICAgfVxyXG4gICAgdmFyIHZhbD10aGlzLnNlYXJjaFZhbHVlKG9yaWdpbkVsZW1lbnRJbmZvLG5ld1BhdGgpXHJcbiAgICBpZih2YWwhPW51bGwpe1xyXG4gICAgICAgIGFTZWxlY3RNZW51LnRyaWdnZXJPcHRpb25WYWx1ZSh2YWwpXHJcbiAgICB9ICAgIFxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmVkaXREVFByb3BlcnR5PWZ1bmN0aW9uKG9yaWdpbkVsZW1lbnRJbmZvLHBhdGgsbmV3VmFsLGRhdGFUeXBlLGlzTmV3VHdpbil7XHJcbiAgICBpZihbXCJkb3VibGVcIixcImJvb2xlYW5cIixcImZsb2F0XCIsXCJpbnRlZ2VyXCIsXCJsb25nXCJdLmluY2x1ZGVzKGRhdGFUeXBlKSkgbmV3VmFsPU51bWJlcihuZXdWYWwpXHJcblxyXG4gICAgLy97IFwib3BcIjogXCJhZGRcIiwgXCJwYXRoXCI6IFwiL3hcIiwgXCJ2YWx1ZVwiOiAzMCB9XHJcbiAgICBpZihpc05ld1R3aW4pe1xyXG4gICAgICAgIHRoaXMudXBkYXRlT3JpZ2luT2JqZWN0VmFsdWUob3JpZ2luRWxlbWVudEluZm8scGF0aCxuZXdWYWwpXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgaWYocGF0aC5sZW5ndGg9PTEpe1xyXG4gICAgICAgIHZhciBzdHI9XCJcIlxyXG4gICAgICAgIHBhdGguZm9yRWFjaChzZWdtZW50PT57c3RyKz1cIi9cIitzZWdtZW50fSlcclxuICAgICAgICB2YXIganNvblBhdGNoPVsgeyBcIm9wXCI6IFwiYWRkXCIsIFwicGF0aFwiOiBzdHIsIFwidmFsdWVcIjogbmV3VmFsfSBdXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICAvL2l0IGlzIGEgcHJvcGVydHkgaW5zaWRlIGEgb2JqZWN0IHR5cGUgb2Ygcm9vdCBwcm9wZXJ0eSx1cGRhdGUgdGhlIHdob2xlIHJvb3QgcHJvcGVydHlcclxuICAgICAgICB2YXIgcm9vdFByb3BlcnR5PXBhdGhbMF1cclxuICAgICAgICB2YXIgcGF0Y2hWYWx1ZT0gb3JpZ2luRWxlbWVudEluZm9bcm9vdFByb3BlcnR5XVxyXG4gICAgICAgIGlmKHBhdGNoVmFsdWU9PW51bGwpIHBhdGNoVmFsdWU9e31cclxuICAgICAgICBlbHNlIHBhdGNoVmFsdWU9SlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShwYXRjaFZhbHVlKSkgLy9tYWtlIGEgY29weVxyXG4gICAgICAgIHRoaXMudXBkYXRlT3JpZ2luT2JqZWN0VmFsdWUocGF0Y2hWYWx1ZSxwYXRoLnNsaWNlKDEpLG5ld1ZhbClcclxuICAgICAgICBcclxuICAgICAgICB2YXIganNvblBhdGNoPVsgeyBcIm9wXCI6IFwiYWRkXCIsIFwicGF0aFwiOiBcIi9cIityb290UHJvcGVydHksIFwidmFsdWVcIjogcGF0Y2hWYWx1ZX0gXVxyXG4gICAgfVxyXG5cclxuICAgIGlmKG9yaWdpbkVsZW1lbnRJbmZvW1wiJGR0SWRcIl0peyAvL2VkaXQgYSBub2RlIHByb3BlcnR5XHJcbiAgICAgICAgdmFyIHR3aW5JRCA9IG9yaWdpbkVsZW1lbnRJbmZvW1wiJGR0SWRcIl1cclxuICAgICAgICB2YXIgcGF5TG9hZD17XCJqc29uUGF0Y2hcIjpKU09OLnN0cmluZ2lmeShqc29uUGF0Y2gpLFwidHdpbklEXCI6dHdpbklEfVxyXG4gICAgfWVsc2UgaWYob3JpZ2luRWxlbWVudEluZm9bXCIkcmVsYXRpb25zaGlwSWRcIl0peyAvL2VkaXQgYSByZWxhdGlvbnNoaXAgcHJvcGVydHlcclxuICAgICAgICB2YXIgdHdpbklEID0gb3JpZ2luRWxlbWVudEluZm9bXCIkc291cmNlSWRcIl1cclxuICAgICAgICB2YXIgcmVsYXRpb25zaGlwSUQgPSBvcmlnaW5FbGVtZW50SW5mb1tcIiRyZWxhdGlvbnNoaXBJZFwiXVxyXG4gICAgICAgIHZhciBwYXlMb2FkPXtcImpzb25QYXRjaFwiOkpTT04uc3RyaW5naWZ5KGpzb25QYXRjaCksXCJ0d2luSURcIjp0d2luSUQsXCJyZWxhdGlvbnNoaXBJRFwiOnJlbGF0aW9uc2hpcElEfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICAkLnBvc3QoXCJlZGl0QURUL2NoYW5nZUF0dHJpYnV0ZVwiLHBheUxvYWRcclxuICAgICAgICAsICAoZGF0YSk9PiB7XHJcbiAgICAgICAgICAgIGlmKGRhdGEhPVwiXCIpIHtcclxuICAgICAgICAgICAgICAgIC8vbm90IHN1Y2Nlc3NmdWwgZWRpdGluZ1xyXG4gICAgICAgICAgICAgICAgYWxlcnQoZGF0YSlcclxuICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICAvL3N1Y2Nlc3NmdWwgZWRpdGluZywgdXBkYXRlIHRoZSBub2RlIG9yaWdpbmFsIGluZm9cclxuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlT3JpZ2luT2JqZWN0VmFsdWUob3JpZ2luRWxlbWVudEluZm8scGF0aCxuZXdWYWwpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS51cGRhdGVPcmlnaW5PYmplY3RWYWx1ZT1mdW5jdGlvbihub2RlSW5mbyxwYXRoQXJyLG5ld1ZhbCl7XHJcbiAgICBpZihwYXRoQXJyLmxlbmd0aD09MCkgcmV0dXJuO1xyXG4gICAgdmFyIHRoZUpzb249bm9kZUluZm9cclxuICAgIGZvcih2YXIgaT0wO2k8cGF0aEFyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIga2V5PXBhdGhBcnJbaV1cclxuXHJcbiAgICAgICAgaWYoaT09cGF0aEFyci5sZW5ndGgtMSl7XHJcbiAgICAgICAgICAgIHRoZUpzb25ba2V5XT1uZXdWYWxcclxuICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYodGhlSnNvbltrZXldPT1udWxsKSB0aGVKc29uW2tleV09e31cclxuICAgICAgICB0aGVKc29uPXRoZUpzb25ba2V5XVxyXG4gICAgfVxyXG4gICAgcmV0dXJuXHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuc2VhcmNoVmFsdWU9ZnVuY3Rpb24ob3JpZ2luRWxlbWVudEluZm8scGF0aEFycil7XHJcbiAgICBpZihwYXRoQXJyLmxlbmd0aD09MCkgcmV0dXJuIG51bGw7XHJcbiAgICB2YXIgdGhlSnNvbj1vcmlnaW5FbGVtZW50SW5mb1xyXG4gICAgZm9yKHZhciBpPTA7aTxwYXRoQXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBrZXk9cGF0aEFycltpXVxyXG4gICAgICAgIHRoZUpzb249dGhlSnNvbltrZXldXHJcbiAgICAgICAgaWYodGhlSnNvbj09bnVsbCkgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhlSnNvbiAvL2l0IHNob3VsZCBiZSB0aGUgZmluYWwgdmFsdWVcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgaW5mb1BhbmVsKCk7IiwiY29uc3QgYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cgPSByZXF1aXJlKFwiLi9hZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZ1wiKVxyXG5jb25zdCBtb2RlbE1hbmFnZXJEaWFsb2cgPSByZXF1aXJlKFwiLi9tb2RlbE1hbmFnZXJEaWFsb2dcIilcclxuY29uc3QgZWRpdExheW91dERpYWxvZz0gcmVxdWlyZShcIi4vZWRpdExheW91dERpYWxvZ1wiKVxyXG5jb25zdCBzaW1wbGVTZWxlY3RNZW51PSByZXF1aXJlKFwiLi9zaW1wbGVTZWxlY3RNZW51XCIpXHJcblxyXG5cclxuZnVuY3Rpb24gbWFpblRvb2xiYXIoKSB7XHJcbn1cclxuXHJcbm1haW5Ub29sYmFyLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAkKFwiI21haW5Ub29sQmFyXCIpLmFkZENsYXNzKFwidzMtYmFyIHczLXJlZFwiKVxyXG4gICAgJChcIiNtYWluVG9vbEJhclwiKS5jc3Moe1wiei1pbmRleFwiOjEwMCxcIm92ZXJmbG93XCI6XCJ2aXNpYmxlXCJ9KVxyXG5cclxuICAgIHRoaXMuc3dpdGNoQURUSW5zdGFuY2VCdG49JCgnPGEgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b25cIiBocmVmPVwiI1wiPlNvdXJjZTwvYT4nKVxyXG4gICAgdGhpcy5tb2RlbElPQnRuPSQoJzxhIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uXCIgaHJlZj1cIiNcIj5Nb2RlbHM8L2E+JylcclxuICAgIHRoaXMuc2hvd0ZvcmdlVmlld0J0bj0kKCc8YSBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ob3Zlci1ub25lIHczLXRleHQtbGlnaHQtZ3JleSB3My1ob3Zlci10ZXh0LWxpZ2h0LWdyZXlcIiBzdHlsZT1cIm9wYWNpdHk6LjM1XCIgaHJlZj1cIiNcIj5Gb3JnZVZpZXc8L2E+JylcclxuICAgIHRoaXMuc2hvd0dJU1ZpZXdCdG49JCgnPGEgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtaG92ZXItbm9uZSB3My10ZXh0LWxpZ2h0LWdyZXkgdzMtaG92ZXItdGV4dC1saWdodC1ncmV5XCIgc3R5bGU9XCJvcGFjaXR5Oi4zNVwiIGhyZWY9XCIjXCI+R0lTVmlldzwvYT4nKVxyXG4gICAgdGhpcy5lZGl0TGF5b3V0QnRuPSQoJzxhIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uXCIgaHJlZj1cIiNcIj48aSBjbGFzcz1cImZhIGZhLWVkaXRcIj48L2k+PC9hPicpXHJcblxyXG5cclxuICAgIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3I9bmV3IHNpbXBsZVNlbGVjdE1lbnUoXCJMYXlvdXRcIilcclxuXHJcbiAgICAkKFwiI21haW5Ub29sQmFyXCIpLmVtcHR5KClcclxuICAgICQoXCIjbWFpblRvb2xCYXJcIikuYXBwZW5kKHRoaXMuc3dpdGNoQURUSW5zdGFuY2VCdG4sdGhpcy5tb2RlbElPQnRuLHRoaXMuc2hvd0ZvcmdlVmlld0J0bix0aGlzLnNob3dHSVNWaWV3QnRuXHJcbiAgICAgICAgLHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuRE9NLHRoaXMuZWRpdExheW91dEJ0bilcclxuXHJcbiAgICB0aGlzLnN3aXRjaEFEVEluc3RhbmNlQnRuLm9uKFwiY2xpY2tcIiwoKT0+eyBhZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZy5wb3B1cCgpIH0pXHJcbiAgICB0aGlzLm1vZGVsSU9CdG4ub24oXCJjbGlja1wiLCgpPT57IG1vZGVsTWFuYWdlckRpYWxvZy5wb3B1cCgpIH0pXHJcbiAgICB0aGlzLmVkaXRMYXlvdXRCdG4ub24oXCJjbGlja1wiLCgpPT57IGVkaXRMYXlvdXREaWFsb2cucG9wdXAoKSB9KVxyXG5cclxuXHJcbiAgICB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmNhbGxCYWNrX2NsaWNrT3B0aW9uPShvcHRpb25UZXh0LG9wdGlvblZhbHVlKT0+e1xyXG4gICAgICAgIGVkaXRMYXlvdXREaWFsb2cuY3VycmVudExheW91dE5hbWU9b3B0aW9uVmFsdWVcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJsYXlvdXRDaGFuZ2VcIn0pXHJcbiAgICAgICAgaWYob3B0aW9uVmFsdWU9PVwiW05BXVwiKSB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmNoYW5nZU5hbWUoXCJMYXlvdXRcIixcIlwiKVxyXG4gICAgICAgIGVsc2UgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jaGFuZ2VOYW1lKFwiTGF5b3V0OlwiLG9wdGlvblRleHQpXHJcbiAgICB9XHJcbn1cclxuXHJcbm1haW5Ub29sYmFyLnByb3RvdHlwZS51cGRhdGVMYXlvdXRTZWxlY3RvciA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBjdXJTZWxlY3Q9dGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jdXJTZWxlY3RWYWxcclxuICAgIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuY2xlYXJPcHRpb25zKClcclxuICAgIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuYWRkT3B0aW9uKCdbTm8gTGF5b3V0IFNwZWNpZmllZF0nLCdbTkFdJylcclxuXHJcbiAgICBmb3IgKHZhciBpbmQgaW4gZWRpdExheW91dERpYWxvZy5sYXlvdXRKU09OKSB7XHJcbiAgICAgICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5hZGRPcHRpb24oaW5kKVxyXG4gICAgfVxyXG5cclxuICAgIGlmKGN1clNlbGVjdCE9bnVsbCAmJiB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmZpbmRPcHRpb24oY3VyU2VsZWN0KT09bnVsbCkgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jaGFuZ2VOYW1lKFwiTGF5b3V0XCIsXCJcIilcclxufVxyXG5cclxubWFpblRvb2xiYXIucHJvdG90eXBlLnJ4TWVzc2FnZT1mdW5jdGlvbihtc2dQYXlsb2FkKXtcclxuICAgIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJsYXlvdXRzVXBkYXRlZFwiKSB7XHJcbiAgICAgICAgdGhpcy51cGRhdGVMYXlvdXRTZWxlY3RvcigpXHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IG1haW5Ub29sYmFyKCk7IiwiLy9UaGlzIGlzIGEgc2luZ2xldG9uIGNsYXNzXHJcblxyXG5mdW5jdGlvbiBtb2RlbEFuYWx5emVyKCl7XHJcbiAgICB0aGlzLkRURExNb2RlbHM9e31cclxuICAgIHRoaXMucmVsYXRpb25zaGlwVHlwZXM9e31cclxufVxyXG5cclxubW9kZWxBbmFseXplci5wcm90b3R5cGUuY2xlYXJBbGxNb2RlbHM9ZnVuY3Rpb24oKXtcclxuICAgIGNvbnNvbGUubG9nKFwiY2xlYXIgYWxsIG1vZGVsIGluZm9cIilcclxuICAgIGZvcih2YXIgaWQgaW4gdGhpcy5EVERMTW9kZWxzKSBkZWxldGUgdGhpcy5EVERMTW9kZWxzW2lkXVxyXG59XHJcblxyXG5tb2RlbEFuYWx5emVyLnByb3RvdHlwZS5hZGRNb2RlbHM9ZnVuY3Rpb24oYXJyKXtcclxuICAgIGFyci5mb3JFYWNoKChlbGUpPT57XHJcbiAgICAgICAgdmFyIG1vZGVsSUQ9IGVsZVtcIkBpZFwiXVxyXG4gICAgICAgIHRoaXMuRFRETE1vZGVsc1ttb2RlbElEXT1lbGVcclxuICAgIH0pXHJcbn1cclxuXHJcblxyXG5tb2RlbEFuYWx5emVyLnByb3RvdHlwZS5yZWNvcmRBbGxCYXNlQ2xhc3Nlcz0gZnVuY3Rpb24gKHBhcmVudE9iaiwgYmFzZUNsYXNzSUQpIHtcclxuICAgIHZhciBiYXNlQ2xhc3MgPSB0aGlzLkRURExNb2RlbHNbYmFzZUNsYXNzSURdXHJcbiAgICBpZiAoYmFzZUNsYXNzID09IG51bGwpIHJldHVybjtcclxuXHJcbiAgICBwYXJlbnRPYmpbYmFzZUNsYXNzSURdPTFcclxuXHJcbiAgICB2YXIgZnVydGhlckJhc2VDbGFzc0lEcyA9IGJhc2VDbGFzcy5leHRlbmRzO1xyXG4gICAgaWYgKGZ1cnRoZXJCYXNlQ2xhc3NJRHMgPT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgaWYoQXJyYXkuaXNBcnJheShmdXJ0aGVyQmFzZUNsYXNzSURzKSkgdmFyIHRtcEFycj1mdXJ0aGVyQmFzZUNsYXNzSURzXHJcbiAgICBlbHNlIHRtcEFycj1bZnVydGhlckJhc2VDbGFzc0lEc11cclxuICAgIHRtcEFyci5mb3JFYWNoKChlYWNoQmFzZSkgPT4geyB0aGlzLnJlY29yZEFsbEJhc2VDbGFzc2VzKHBhcmVudE9iaiwgZWFjaEJhc2UpIH0pXHJcbn1cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLmV4cGFuZEVkaXRhYmxlUHJvcGVydGllc0Zyb21CYXNlQ2xhc3MgPSBmdW5jdGlvbiAocGFyZW50T2JqLCBiYXNlQ2xhc3NJRCkge1xyXG4gICAgdmFyIGJhc2VDbGFzcyA9IHRoaXMuRFRETE1vZGVsc1tiYXNlQ2xhc3NJRF1cclxuICAgIGlmIChiYXNlQ2xhc3MgPT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgaWYgKGJhc2VDbGFzcy5lZGl0YWJsZVByb3BlcnRpZXMpIHtcclxuICAgICAgICBmb3IgKHZhciBpbmQgaW4gYmFzZUNsYXNzLmVkaXRhYmxlUHJvcGVydGllcykgcGFyZW50T2JqW2luZF0gPSBiYXNlQ2xhc3MuZWRpdGFibGVQcm9wZXJ0aWVzW2luZF1cclxuICAgIH1cclxuICAgIHZhciBmdXJ0aGVyQmFzZUNsYXNzSURzID0gYmFzZUNsYXNzLmV4dGVuZHM7XHJcbiAgICBpZiAoZnVydGhlckJhc2VDbGFzc0lEcyA9PSBudWxsKSByZXR1cm47XHJcbiAgICBpZihBcnJheS5pc0FycmF5KGZ1cnRoZXJCYXNlQ2xhc3NJRHMpKSB2YXIgdG1wQXJyPWZ1cnRoZXJCYXNlQ2xhc3NJRHNcclxuICAgIGVsc2UgdG1wQXJyPVtmdXJ0aGVyQmFzZUNsYXNzSURzXVxyXG4gICAgdG1wQXJyLmZvckVhY2goKGVhY2hCYXNlKSA9PiB7IHRoaXMuZXhwYW5kRWRpdGFibGVQcm9wZXJ0aWVzRnJvbUJhc2VDbGFzcyhwYXJlbnRPYmosIGVhY2hCYXNlKSB9KVxyXG59XHJcblxyXG5tb2RlbEFuYWx5emVyLnByb3RvdHlwZS5leHBhbmRWYWxpZFJlbGF0aW9uc2hpcFR5cGVzRnJvbUJhc2VDbGFzcyA9IGZ1bmN0aW9uIChwYXJlbnRPYmosIGJhc2VDbGFzc0lEKSB7XHJcbiAgICB2YXIgYmFzZUNsYXNzID0gdGhpcy5EVERMTW9kZWxzW2Jhc2VDbGFzc0lEXVxyXG4gICAgaWYgKGJhc2VDbGFzcyA9PSBudWxsKSByZXR1cm47XHJcbiAgICBpZiAoYmFzZUNsYXNzLnZhbGlkUmVsYXRpb25zaGlwcykge1xyXG4gICAgICAgIGZvciAodmFyIGluZCBpbiBiYXNlQ2xhc3MudmFsaWRSZWxhdGlvbnNoaXBzKSB7XHJcbiAgICAgICAgICAgIGlmKHBhcmVudE9ialtpbmRdPT1udWxsKSBwYXJlbnRPYmpbaW5kXSA9IHRoaXMucmVsYXRpb25zaGlwVHlwZXNbaW5kXVtiYXNlQ2xhc3NJRF1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB2YXIgZnVydGhlckJhc2VDbGFzc0lEcyA9IGJhc2VDbGFzcy5leHRlbmRzO1xyXG4gICAgaWYgKGZ1cnRoZXJCYXNlQ2xhc3NJRHMgPT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgaWYoQXJyYXkuaXNBcnJheShmdXJ0aGVyQmFzZUNsYXNzSURzKSkgdmFyIHRtcEFycj1mdXJ0aGVyQmFzZUNsYXNzSURzXHJcbiAgICBlbHNlIHRtcEFycj1bZnVydGhlckJhc2VDbGFzc0lEc11cclxuICAgIHRtcEFyci5mb3JFYWNoKChlYWNoQmFzZSkgPT4geyB0aGlzLmV4cGFuZFZhbGlkUmVsYXRpb25zaGlwVHlwZXNGcm9tQmFzZUNsYXNzKHBhcmVudE9iaiwgZWFjaEJhc2UpIH0pXHJcbn1cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLmV4cGFuZEVkaXRhYmxlUHJvcGVydGllcz1mdW5jdGlvbihwYXJlbnRPYmosZGF0YUluZm8sZW1iZWRkZWRTY2hlbWEpe1xyXG4gICAgZGF0YUluZm8uZm9yRWFjaCgob25lQ29udGVudCk9PntcclxuICAgICAgICBpZihvbmVDb250ZW50W1wiQHR5cGVcIl09PVwiUmVsYXRpb25zaGlwXCIpIHJldHVybjtcclxuICAgICAgICBpZihvbmVDb250ZW50W1wiQHR5cGVcIl09PVwiUHJvcGVydHlcIlxyXG4gICAgICAgIHx8KEFycmF5LmlzQXJyYXkob25lQ29udGVudFtcIkB0eXBlXCJdKSAmJiBvbmVDb250ZW50W1wiQHR5cGVcIl0uaW5jbHVkZXMoXCJQcm9wZXJ0eVwiKSlcclxuICAgICAgICB8fCBvbmVDb250ZW50W1wiQHR5cGVcIl09PW51bGwpIHtcclxuICAgICAgICAgICAgaWYodHlwZW9mKG9uZUNvbnRlbnRbXCJzY2hlbWFcIl0pICE9ICdvYmplY3QnICYmIGVtYmVkZGVkU2NoZW1hW29uZUNvbnRlbnRbXCJzY2hlbWFcIl1dIT1udWxsKSBvbmVDb250ZW50W1wic2NoZW1hXCJdPWVtYmVkZGVkU2NoZW1hW29uZUNvbnRlbnRbXCJzY2hlbWFcIl1dXHJcblxyXG4gICAgICAgICAgICBpZih0eXBlb2Yob25lQ29udGVudFtcInNjaGVtYVwiXSkgPT09ICdvYmplY3QnICYmIG9uZUNvbnRlbnRbXCJzY2hlbWFcIl1bXCJAdHlwZVwiXT09XCJPYmplY3RcIil7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmV3UGFyZW50PXt9XHJcbiAgICAgICAgICAgICAgICBwYXJlbnRPYmpbb25lQ29udGVudFtcIm5hbWVcIl1dPW5ld1BhcmVudFxyXG4gICAgICAgICAgICAgICAgdGhpcy5leHBhbmRFZGl0YWJsZVByb3BlcnRpZXMobmV3UGFyZW50LG9uZUNvbnRlbnRbXCJzY2hlbWFcIl1bXCJmaWVsZHNcIl0sZW1iZWRkZWRTY2hlbWEpXHJcbiAgICAgICAgICAgIH1lbHNlIGlmKHR5cGVvZihvbmVDb250ZW50W1wic2NoZW1hXCJdKSA9PT0gJ29iamVjdCcgJiYgb25lQ29udGVudFtcInNjaGVtYVwiXVtcIkB0eXBlXCJdPT1cIkVudW1cIil7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnRPYmpbb25lQ29udGVudFtcIm5hbWVcIl1dPW9uZUNvbnRlbnRbXCJzY2hlbWFcIl1bXCJlbnVtVmFsdWVzXCJdXHJcbiAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgcGFyZW50T2JqW29uZUNvbnRlbnRbXCJuYW1lXCJdXT1vbmVDb250ZW50W1wic2NoZW1hXCJdXHJcbiAgICAgICAgICAgIH0gICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1cclxuXHJcblxyXG5tb2RlbEFuYWx5emVyLnByb3RvdHlwZS5hbmFseXplPWZ1bmN0aW9uKCl7XHJcbiAgICBjb25zb2xlLmxvZyhcImFuYWx5emUgbW9kZWwgaW5mb1wiKVxyXG4gICAgLy9hbmFseXplIGFsbCByZWxhdGlvbnNoaXAgdHlwZXNcclxuICAgIGZvciAodmFyIGlkIGluIHRoaXMucmVsYXRpb25zaGlwVHlwZXMpIGRlbGV0ZSB0aGlzLnJlbGF0aW9uc2hpcFR5cGVzW2lkXVxyXG4gICAgZm9yICh2YXIgbW9kZWxJRCBpbiB0aGlzLkRURExNb2RlbHMpIHtcclxuICAgICAgICB2YXIgZWxlID0gdGhpcy5EVERMTW9kZWxzW21vZGVsSURdXHJcbiAgICAgICAgdmFyIGVtYmVkZGVkU2NoZW1hID0ge31cclxuICAgICAgICBpZiAoZWxlLnNjaGVtYXMpIHtcclxuICAgICAgICAgICAgdmFyIHRlbXBBcnI7XHJcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGVsZS5zY2hlbWFzKSkgdGVtcEFyciA9IGVsZS5zY2hlbWFzXHJcbiAgICAgICAgICAgIGVsc2UgdGVtcEFyciA9IFtlbGUuc2NoZW1hc11cclxuICAgICAgICAgICAgdGVtcEFyci5mb3JFYWNoKChlbGUpID0+IHtcclxuICAgICAgICAgICAgICAgIGVtYmVkZGVkU2NoZW1hW2VsZVtcIkBpZFwiXV0gPSBlbGVcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBjb250ZW50QXJyID0gZWxlLmNvbnRlbnRzXHJcbiAgICAgICAgaWYgKCFjb250ZW50QXJyKSBjb250aW51ZTtcclxuICAgICAgICBjb250ZW50QXJyLmZvckVhY2goKG9uZUNvbnRlbnQpID0+IHtcclxuICAgICAgICAgICAgaWYgKG9uZUNvbnRlbnRbXCJAdHlwZVwiXSA9PSBcIlJlbGF0aW9uc2hpcFwiKSB7XHJcbiAgICAgICAgICAgICAgICBpZighdGhpcy5yZWxhdGlvbnNoaXBUeXBlc1tvbmVDb250ZW50W1wibmFtZVwiXV0pIHRoaXMucmVsYXRpb25zaGlwVHlwZXNbb25lQ29udGVudFtcIm5hbWVcIl1dPSB7fVxyXG4gICAgICAgICAgICAgICAgdGhpcy5yZWxhdGlvbnNoaXBUeXBlc1tvbmVDb250ZW50W1wibmFtZVwiXV1bbW9kZWxJRF0gPSBvbmVDb250ZW50XHJcbiAgICAgICAgICAgICAgICBvbmVDb250ZW50LmVkaXRhYmxlUmVsYXRpb25zaGlwUHJvcGVydGllcyA9IHt9XHJcbiAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShvbmVDb250ZW50LnByb3BlcnRpZXMpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5leHBhbmRFZGl0YWJsZVByb3BlcnRpZXMob25lQ29udGVudC5lZGl0YWJsZVJlbGF0aW9uc2hpcFByb3BlcnRpZXMsIG9uZUNvbnRlbnQucHJvcGVydGllcywgZW1iZWRkZWRTY2hlbWEpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIC8vYW5hbHl6ZSBlYWNoIG1vZGVsJ3MgcHJvcGVydHkgdGhhdCBjYW4gYmUgZWRpdGVkXHJcbiAgICBmb3IodmFyIG1vZGVsSUQgaW4gdGhpcy5EVERMTW9kZWxzKXsgLy9leHBhbmQgcG9zc2libGUgZW1iZWRkZWQgc2NoZW1hIHRvIGVkaXRhYmxlUHJvcGVydGllcywgYWxzbyBleHRyYWN0IHBvc3NpYmxlIHJlbGF0aW9uc2hpcCB0eXBlcyBmb3IgdGhpcyBtb2RlbFxyXG4gICAgICAgIHZhciBlbGU9dGhpcy5EVERMTW9kZWxzW21vZGVsSURdXHJcbiAgICAgICAgdmFyIGVtYmVkZGVkU2NoZW1hPXt9XHJcbiAgICAgICAgaWYoZWxlLnNjaGVtYXMpe1xyXG4gICAgICAgICAgICB2YXIgdGVtcEFycjtcclxuICAgICAgICAgICAgaWYoQXJyYXkuaXNBcnJheShlbGUuc2NoZW1hcykpIHRlbXBBcnI9ZWxlLnNjaGVtYXNcclxuICAgICAgICAgICAgZWxzZSB0ZW1wQXJyPVtlbGUuc2NoZW1hc11cclxuICAgICAgICAgICAgdGVtcEFyci5mb3JFYWNoKChlbGUpPT57XHJcbiAgICAgICAgICAgICAgICBlbWJlZGRlZFNjaGVtYVtlbGVbXCJAaWRcIl1dPWVsZVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbGUuZWRpdGFibGVQcm9wZXJ0aWVzPXt9XHJcbiAgICAgICAgZWxlLnZhbGlkUmVsYXRpb25zaGlwcz17fVxyXG4gICAgICAgIGVsZS5pbmNsdWRlZENvbXBvbmVudHM9W11cclxuICAgICAgICBlbGUuYWxsQmFzZUNsYXNzZXM9e31cclxuICAgICAgICBpZihBcnJheS5pc0FycmF5KGVsZS5jb250ZW50cykpe1xyXG4gICAgICAgICAgICB0aGlzLmV4cGFuZEVkaXRhYmxlUHJvcGVydGllcyhlbGUuZWRpdGFibGVQcm9wZXJ0aWVzLGVsZS5jb250ZW50cyxlbWJlZGRlZFNjaGVtYSlcclxuXHJcbiAgICAgICAgICAgIGVsZS5jb250ZW50cy5mb3JFYWNoKChvbmVDb250ZW50KT0+e1xyXG4gICAgICAgICAgICAgICAgaWYob25lQ29udGVudFtcIkB0eXBlXCJdPT1cIlJlbGF0aW9uc2hpcFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlLnZhbGlkUmVsYXRpb25zaGlwc1tvbmVDb250ZW50W1wibmFtZVwiXV09dGhpcy5yZWxhdGlvbnNoaXBUeXBlc1tvbmVDb250ZW50W1wibmFtZVwiXV1bbW9kZWxJRF1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZm9yKHZhciBtb2RlbElEIGluIHRoaXMuRFRETE1vZGVscyl7Ly9leHBhbmQgY29tcG9uZW50IHByb3BlcnRpZXNcclxuICAgICAgICB2YXIgZWxlPXRoaXMuRFRETE1vZGVsc1ttb2RlbElEXVxyXG4gICAgICAgIGlmKEFycmF5LmlzQXJyYXkoZWxlLmNvbnRlbnRzKSl7XHJcbiAgICAgICAgICAgIGVsZS5jb250ZW50cy5mb3JFYWNoKG9uZUNvbnRlbnQ9PntcclxuICAgICAgICAgICAgICAgIGlmKG9uZUNvbnRlbnRbXCJAdHlwZVwiXT09XCJDb21wb25lbnRcIil7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvbXBvbmVudE5hbWU9b25lQ29udGVudFtcIm5hbWVcIl1cclxuICAgICAgICAgICAgICAgICAgICB2YXIgY29tcG9uZW50Q2xhc3M9b25lQ29udGVudFtcInNjaGVtYVwiXVxyXG4gICAgICAgICAgICAgICAgICAgIGVsZS5lZGl0YWJsZVByb3BlcnRpZXNbY29tcG9uZW50TmFtZV09e31cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmV4cGFuZEVkaXRhYmxlUHJvcGVydGllc0Zyb21CYXNlQ2xhc3MoZWxlLmVkaXRhYmxlUHJvcGVydGllc1tjb21wb25lbnROYW1lXSxjb21wb25lbnRDbGFzcylcclxuICAgICAgICAgICAgICAgICAgICBlbGUuaW5jbHVkZWRDb21wb25lbnRzLnB1c2goY29tcG9uZW50TmFtZSlcclxuICAgICAgICAgICAgICAgIH0gXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZvcih2YXIgbW9kZWxJRCBpbiB0aGlzLkRURExNb2RlbHMpey8vZXhwYW5kIGJhc2UgY2xhc3MgcHJvcGVydGllcyB0byBlZGl0YWJsZVByb3BlcnRpZXMgYW5kIHZhbGlkIHJlbGF0aW9uc2hpcCB0eXBlcyB0byB2YWxpZFJlbGF0aW9uc2hpcHNcclxuICAgICAgICB2YXIgZWxlPXRoaXMuRFRETE1vZGVsc1ttb2RlbElEXVxyXG4gICAgICAgIHZhciBiYXNlQ2xhc3NJRHM9ZWxlLmV4dGVuZHM7XHJcbiAgICAgICAgaWYoYmFzZUNsYXNzSURzPT1udWxsKSBjb250aW51ZTtcclxuICAgICAgICBpZihBcnJheS5pc0FycmF5KGJhc2VDbGFzc0lEcykpIHZhciB0bXBBcnI9YmFzZUNsYXNzSURzXHJcbiAgICAgICAgZWxzZSB0bXBBcnI9W2Jhc2VDbGFzc0lEc11cclxuICAgICAgICB0bXBBcnIuZm9yRWFjaCgoZWFjaEJhc2UpPT57XHJcbiAgICAgICAgICAgIHRoaXMucmVjb3JkQWxsQmFzZUNsYXNzZXMoZWxlLmFsbEJhc2VDbGFzc2VzLGVhY2hCYXNlKVxyXG4gICAgICAgICAgICB0aGlzLmV4cGFuZEVkaXRhYmxlUHJvcGVydGllc0Zyb21CYXNlQ2xhc3MoZWxlLmVkaXRhYmxlUHJvcGVydGllcyxlYWNoQmFzZSlcclxuICAgICAgICAgICAgdGhpcy5leHBhbmRWYWxpZFJlbGF0aW9uc2hpcFR5cGVzRnJvbUJhc2VDbGFzcyhlbGUudmFsaWRSZWxhdGlvbnNoaXBzLGVhY2hCYXNlKVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcblxyXG4gICAgLy9jb25zb2xlLmxvZyh0aGlzLkRURExNb2RlbHMpXHJcbiAgICAvL2NvbnNvbGUubG9nKHRoaXMucmVsYXRpb25zaGlwVHlwZXMpXHJcbn1cclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBtb2RlbEFuYWx5emVyKCk7IiwiY29uc3QgbW9kZWxBbmFseXplcj1yZXF1aXJlKFwiLi9tb2RlbEFuYWx5emVyXCIpXHJcbmNvbnN0IGFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nID0gcmVxdWlyZShcIi4vYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2dcIilcclxuY29uc3Qgc2ltcGxlQ29uZmlybURpYWxvZyA9IHJlcXVpcmUoXCIuL3NpbXBsZUNvbmZpcm1EaWFsb2dcIilcclxuXHJcbmZ1bmN0aW9uIG1vZGVsTWFuYWdlckRpYWxvZygpIHtcclxuICAgIHRoaXMudmlzdWFsRGVmaW5pdGlvbj17fVxyXG4gICAgdGhpcy5tb2RlbHM9e31cclxuICAgIGlmKCF0aGlzLkRPTSl7XHJcbiAgICAgICAgdGhpcy5ET00gPSAkKCc8ZGl2IHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dG9wOjUwJTtiYWNrZ3JvdW5kLWNvbG9yOndoaXRlO2xlZnQ6NTAlO3RyYW5zZm9ybTogdHJhbnNsYXRlWCgtNTAlKSB0cmFuc2xhdGVZKC01MCUpO3otaW5kZXg6OTlcIiBjbGFzcz1cInczLWNhcmQtMlwiPjwvZGl2PicpXHJcbiAgICAgICAgdGhpcy5ET00uY3NzKFwib3ZlcmZsb3dcIixcImhpZGRlblwiKVxyXG4gICAgICAgICQoXCJib2R5XCIpLmFwcGVuZCh0aGlzLkRPTSlcclxuICAgICAgICB0aGlzLkRPTS5oaWRlKClcclxuICAgIH1cclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5wcmVwYXJhdGlvbkZ1bmMgPSBhc3luYyBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICAgJC5nZXQoXCJ2aXN1YWxEZWZpbml0aW9uL3JlYWRWaXN1YWxEZWZpbml0aW9uXCIsIChkYXRhLCBzdGF0dXMpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmKGRhdGEhPVwiXCIgJiYgdHlwZW9mKGRhdGEpPT09XCJvYmplY3RcIikgdGhpcy52aXN1YWxEZWZpbml0aW9uPWRhdGE7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKClcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIHJlamVjdChlKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUucG9wdXAgPSBhc3luYyBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMuRE9NLnNob3coKVxyXG4gICAgdGhpcy5ET00uZW1wdHkoKVxyXG4gICAgdGhpcy5jb250ZW50RE9NID0gJCgnPGRpdiBzdHlsZT1cIndpZHRoOjY1MHB4XCI+PC9kaXY+JylcclxuICAgIHRoaXMuRE9NLmFwcGVuZCh0aGlzLmNvbnRlbnRET00pXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6NDBweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiZm9udC1zaXplOjEuNWVtXCI+RGlnaXRhbCBUd2luIE1vZGVsczwvZGl2PjwvZGl2PicpKVxyXG4gICAgdmFyIGNsb3NlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yaWdodFwiIHN0eWxlPVwiZm9udC1zaXplOjJlbTtwYWRkaW5nLXRvcDo0cHhcIj7DlzwvYnV0dG9uPicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZChjbG9zZUJ1dHRvbilcclxuICAgIGNsb3NlQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLkRPTS5oaWRlKCkgfSlcclxuXHJcbiAgICB2YXIgaW1wb3J0TW9kZWxzQnRuID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1jYXJkIHczLWRlZXAtb3JhbmdlIHczLWhvdmVyLWxpZ2h0LWdyZWVuXCIgc3R5bGU9XCJoZWlnaHQ6MTAwJVwiPkltcG9ydDwvYnV0dG9uPicpXHJcbiAgICB2YXIgYWN0dWFsSW1wb3J0TW9kZWxzQnRuID0kKCc8aW5wdXQgdHlwZT1cImZpbGVcIiBuYW1lPVwibW9kZWxGaWxlc1wiIG11bHRpcGxlPVwibXVsdGlwbGVcIiBzdHlsZT1cImRpc3BsYXk6bm9uZVwiPjwvaW5wdXQ+JylcclxuICAgIHRoaXMuY29udGVudERPTS5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKGltcG9ydE1vZGVsc0J0bixhY3R1YWxJbXBvcnRNb2RlbHNCdG4pXHJcbiAgICBpbXBvcnRNb2RlbHNCdG4ub24oXCJjbGlja1wiLCAoKT0+e1xyXG4gICAgICAgIGFjdHVhbEltcG9ydE1vZGVsc0J0bi50cmlnZ2VyKCdjbGljaycpO1xyXG4gICAgfSk7XHJcbiAgICBhY3R1YWxJbXBvcnRNb2RlbHNCdG4uY2hhbmdlKChldnQpPT57XHJcbiAgICAgICAgdmFyIGZpbGVzID0gZXZ0LnRhcmdldC5maWxlczsgLy8gRmlsZUxpc3Qgb2JqZWN0XHJcbiAgICAgICAgdGhpcy5yZWFkTW9kZWxGaWxlc0NvbnRlbnRBbmRJbXBvcnQoZmlsZXMpXHJcbiAgICB9KVxyXG5cclxuICAgIHZhciByb3cyPSQoJzxkaXYgY2xhc3M9XCJ3My1jZWxsLXJvd1wiIHN0eWxlPVwibWFyZ2luLXRvcDoycHhcIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmFwcGVuZChyb3cyKVxyXG4gICAgdmFyIGxlZnRTcGFuPSQoJzxkaXYgY2xhc3M9XCJ3My1jZWxsXCIgc3R5bGU9XCJ3aWR0aDoyNDBweDtwYWRkaW5nLXJpZ2h0OjVweFwiPjwvZGl2PicpXHJcbiAgICByb3cyLmFwcGVuZChsZWZ0U3BhbilcclxuICAgIGxlZnRTcGFuLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwiaGVpZ2h0OjMwcHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cIlwiPk1vZGVsczwvZGl2PjwvZGl2PicpKVxyXG4gICAgXHJcbiAgICB2YXIgbW9kZWxMaXN0ID0gJCgnPHVsIGNsYXNzPVwidzMtdWwgdzMtaG92ZXJhYmxlXCI+JylcclxuICAgIG1vZGVsTGlzdC5jc3Moe1wib3ZlcmZsb3cteFwiOlwiaGlkZGVuXCIsXCJvdmVyZmxvdy15XCI6XCJhdXRvXCIsXCJoZWlnaHRcIjpcIjQyMHB4XCIsIFwiYm9yZGVyXCI6XCJzb2xpZCAxcHggbGlnaHRncmF5XCJ9KVxyXG4gICAgbGVmdFNwYW4uYXBwZW5kKG1vZGVsTGlzdClcclxuICAgIHRoaXMubW9kZWxMaXN0ID0gbW9kZWxMaXN0O1xyXG4gICAgXHJcbiAgICB2YXIgcmlnaHRTcGFuPSQoJzxkaXYgY2xhc3M9XCJ3My1jb250YWluZXIgdzMtY2VsbFwiPjwvZGl2PicpXHJcbiAgICByb3cyLmFwcGVuZChyaWdodFNwYW4pIFxyXG4gICAgdmFyIHBhbmVsQ2FyZE91dD0kKCc8ZGl2IGNsYXNzPVwidzMtY2FyZC0yIHczLXdoaXRlXCIgc3R5bGU9XCJtYXJnaW4tdG9wOjJweFwiPjwvZGl2PicpXHJcblxyXG4gICAgdGhpcy5tb2RlbEJ1dHRvbkJhcj0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCIgc3R5bGU9XCJoZWlnaHQ6MzVweFwiPjwvZGl2PicpXHJcbiAgICBwYW5lbENhcmRPdXQuYXBwZW5kKHRoaXMubW9kZWxCdXR0b25CYXIpXHJcblxyXG4gICAgcmlnaHRTcGFuLmFwcGVuZChwYW5lbENhcmRPdXQpXHJcbiAgICB2YXIgcGFuZWxDYXJkPSQoJzxkaXYgc3R5bGU9XCJ3aWR0aDo0MDBweDtoZWlnaHQ6NDA1cHg7b3ZlcmZsb3c6YXV0bzttYXJnaW4tdG9wOjJweFwiPjwvZGl2PicpXHJcbiAgICBwYW5lbENhcmRPdXQuYXBwZW5kKHBhbmVsQ2FyZClcclxuICAgIHRoaXMucGFuZWxDYXJkPXBhbmVsQ2FyZDtcclxuXHJcbiAgICB0aGlzLm1vZGVsQnV0dG9uQmFyLmVtcHR5KClcclxuICAgIHBhbmVsQ2FyZC5odG1sKFwiPGEgc3R5bGU9J2Rpc3BsYXk6YmxvY2s7Zm9udC1zdHlsZTppdGFsaWM7Y29sb3I6Z3JheTtwYWRkaW5nLWxlZnQ6NXB4Jz5DaG9vc2UgYSBtb2RlbCB0byB2aWV3IGluZm9tcmF0aW9uPC9hPlwiKVxyXG5cclxuICAgIHRoaXMubGlzdE1vZGVscygpXHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUucmVzaXplSW1nRmlsZSA9IGFzeW5jIGZ1bmN0aW9uKHRoZUZpbGUsbWF4X3NpemUpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XHJcbiAgICAgICAgICAgIHZhciB0bXBJbWcgPSBuZXcgSW1hZ2UoKTtcclxuICAgICAgICAgICAgcmVhZGVyLm9ubG9hZCA9ICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRtcEltZy5vbmxvYWQgPSAgKCk9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHdpZHRoID0gdG1wSW1nLndpZHRoXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGhlaWdodCA9IHRtcEltZy5oZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHdpZHRoID4gaGVpZ2h0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3aWR0aCA+IG1heF9zaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQgKj0gbWF4X3NpemUgLyB3aWR0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoID0gbWF4X3NpemU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGVpZ2h0ID4gbWF4X3NpemUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoICo9IG1heF9zaXplIC8gaGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ID0gbWF4X3NpemU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgY2FudmFzLndpZHRoID0gd2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FudmFzLmhlaWdodCA9IGhlaWdodDtcclxuICAgICAgICAgICAgICAgICAgICBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKS5kcmF3SW1hZ2UodG1wSW1nLCAwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZGF0YVVybCA9IGNhbnZhcy50b0RhdGFVUkwoJ2ltYWdlL3BuZycpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZGF0YVVybClcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRtcEltZy5zcmMgPSByZWFkZXIucmVzdWx0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKHRoZUZpbGUpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgcmVqZWN0KGUpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5maWxsUmlnaHRTcGFuPWFzeW5jIGZ1bmN0aW9uKG1vZGVsTmFtZSl7XHJcbiAgICB0aGlzLnBhbmVsQ2FyZC5lbXB0eSgpXHJcbiAgICB2YXIgbW9kZWxJRD10aGlzLm1vZGVsc1ttb2RlbE5hbWVdWydAaWQnXVxyXG5cclxuICAgIHZhciBkZWxCdG4gPSAkKCc8YnV0dG9uIHN0eWxlPVwibWFyZ2luLWJvdHRvbToycHhcIiBjbGFzcz1cInczLWJ1dHRvbiB3My1saWdodC1ncmF5IHczLWhvdmVyLXBpbmsgdzMtYm9yZGVyLXJpZ2h0XCI+RGVsZXRlIE1vZGVsPC9idXR0b24+JylcclxuICAgIHZhciBpbXBvcnRQaWNCdG4gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWxpZ2h0LWdyYXkgdzMtaG92ZXItYW1iZXIgdzMtYm9yZGVyLXJpZ2h0XCI+VXBsb2FkIEF2YXJ0YTwvYnV0dG9uPicpXHJcbiAgICB2YXIgYWN0dWFsSW1wb3J0UGljQnRuID0kKCc8aW5wdXQgdHlwZT1cImZpbGVcIiBuYW1lPVwiaW1nXCIgc3R5bGU9XCJkaXNwbGF5Om5vbmVcIj48L2lucHV0PicpXHJcbiAgICB2YXIgY2xlYXJBdmFydGFCdG4gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWxpZ2h0LWdyYXkgdzMtaG92ZXItcGluayB3My1ib3JkZXItcmlnaHRcIj5DbGVhciBBdmFydGE8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5tb2RlbEJ1dHRvbkJhci5hcHBlbmQoZGVsQnRuLGltcG9ydFBpY0J0bixhY3R1YWxJbXBvcnRQaWNCdG4sY2xlYXJBdmFydGFCdG4pXHJcblxyXG4gICAgaW1wb3J0UGljQnRuLm9uKFwiY2xpY2tcIiwgKCk9PntcclxuICAgICAgICBhY3R1YWxJbXBvcnRQaWNCdG4udHJpZ2dlcignY2xpY2snKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGFjdHVhbEltcG9ydFBpY0J0bi5jaGFuZ2UoYXN5bmMgKGV2dCk9PntcclxuICAgICAgICB2YXIgZmlsZXMgPSBldnQudGFyZ2V0LmZpbGVzOyAvLyBGaWxlTGlzdCBvYmplY3RcclxuICAgICAgICB2YXIgdGhlRmlsZT1maWxlc1swXVxyXG4gICAgICAgIHZhciBkYXRhVXJsPSBhd2FpdCB0aGlzLnJlc2l6ZUltZ0ZpbGUodGhlRmlsZSw3MClcclxuICAgICAgICBpZih0aGlzLmF2YXJ0YUltZykgdGhpcy5hdmFydGFJbWcuYXR0cihcInNyY1wiLGRhdGFVcmwpXHJcblxyXG4gICAgICAgIHZhciB2aXN1YWxKc29uPXRoaXMudmlzdWFsRGVmaW5pdGlvblthZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZy5zZWxlY3RlZEFEVF1cclxuICAgICAgICBpZighdmlzdWFsSnNvblttb2RlbElEXSkgdmlzdWFsSnNvblttb2RlbElEXT17fVxyXG4gICAgICAgIHZpc3VhbEpzb25bbW9kZWxJRF0uYXZhcnRhPWRhdGFVcmxcclxuICAgICAgICB0aGlzLnNhdmVWaXN1YWxEZWZpbml0aW9uKClcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJ2aXN1YWxEZWZpbml0aW9uQ2hhbmdlXCIsIFwibW9kZWxJRFwiOm1vZGVsSUQsXCJhdmFydGFcIjpkYXRhVXJsIH0pXHJcbiAgICB9KVxyXG5cclxuICAgIGNsZWFyQXZhcnRhQnRuLm9uKFwiY2xpY2tcIiwgKCk9PntcclxuICAgICAgICB2YXIgdmlzdWFsSnNvbj10aGlzLnZpc3VhbERlZmluaXRpb25bYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cuc2VsZWN0ZWRBRFRdXHJcbiAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXSkgZGVsZXRlIHZpc3VhbEpzb25bbW9kZWxJRF0uYXZhcnRhIFxyXG4gICAgICAgIGlmKHRoaXMuYXZhcnRhSW1nKSB0aGlzLmF2YXJ0YUltZy5yZW1vdmVBdHRyKCdzcmMnKTtcclxuICAgICAgICB0aGlzLnNhdmVWaXN1YWxEZWZpbml0aW9uKClcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJ2aXN1YWxEZWZpbml0aW9uQ2hhbmdlXCIsIFwibW9kZWxJRFwiOm1vZGVsSUQsXCJub0F2YXJ0YVwiOnRydWUgfSlcclxuICAgIH0pO1xyXG5cclxuXHJcbiAgICBkZWxCdG4ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgdmFyIGNvbmZpcm1EaWFsb2dEaXYgPSBuZXcgc2ltcGxlQ29uZmlybURpYWxvZygpXHJcblxyXG4gICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuc2hvdyhcclxuICAgICAgICAgICAgeyB3aWR0aDogXCIyNTBweFwiIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRpdGxlOiBcIldhcm5pbmdcIlxyXG4gICAgICAgICAgICAgICAgLCBjb250ZW50OiBcIlRoaXMgd2lsbCBERUxFVEUgbW9kZWwgXFxcIlwiICsgbW9kZWxJRCArIFwiXFxcIlwiXHJcbiAgICAgICAgICAgICAgICAsIGJ1dHRvbnM6IFtcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtcmVkIHczLWhvdmVyLXBpbmtcIiwgdGV4dDogXCJDb25maXJtXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQucG9zdChcImVkaXRBRFQvZGVsZXRlTW9kZWxcIix7XCJtb2RlbFwiOm1vZGVsSUR9LCAoZGF0YSk9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoZGF0YT09XCJcIil7Ly9zdWNjZXNzZnVsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubGlzdE1vZGVscyhcInNob3VsZEJyb2FkY2FzdFwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBhbmVsQ2FyZC5lbXB0eSgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKHRoaXMudmlzdWFsRGVmaW5pdGlvblthZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZy5zZWxlY3RlZEFEVF0gJiYgdGhpcy52aXN1YWxEZWZpbml0aW9uW2FkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLnNlbGVjdGVkQURUXVttb2RlbElEXSApe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMudmlzdWFsRGVmaW5pdGlvblthZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZy5zZWxlY3RlZEFEVF1bbW9kZWxJRF1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2F2ZVZpc3VhbERlZmluaXRpb24oKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfWVsc2V7IC8vZXJyb3IgaGFwcGVuc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGVydChkYXRhKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtZ3JheVwiLCB0ZXh0OiBcIkNhbmNlbFwiLCBcImNsaWNrRnVuY1wiOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKClcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIClcclxuICAgICAgICBcclxuICAgIH0pXHJcbiAgICBcclxuICAgIHZhciBWaXN1YWxpemF0aW9uRE9NPXRoaXMuYWRkQVBhcnRJblJpZ2h0U3BhbihcIlZpc3VhbGl6YXRpb25cIilcclxuICAgIHZhciBlZGl0YWJsZVByb3BlcnRpZXNET009dGhpcy5hZGRBUGFydEluUmlnaHRTcGFuKFwiRWRpdGFibGUgUHJvcGVydGllcyBBbmQgUmVsYXRpb25zaGlwc1wiKVxyXG4gICAgdmFyIGJhc2VDbGFzc2VzRE9NPXRoaXMuYWRkQVBhcnRJblJpZ2h0U3BhbihcIkJhc2UgQ2xhc3Nlc1wiKVxyXG4gICAgdmFyIG9yaWdpbmFsRGVmaW5pdGlvbkRPTT10aGlzLmFkZEFQYXJ0SW5SaWdodFNwYW4oXCJPcmlnaW5hbCBEZWZpbml0aW9uXCIpXHJcblxyXG4gICAgdmFyIHN0cj1KU09OLnN0cmluZ2lmeSh0aGlzLm1vZGVsc1ttb2RlbE5hbWVdLG51bGwsMilcclxuICAgIG9yaWdpbmFsRGVmaW5pdGlvbkRPTS5hcHBlbmQoJCgnPHByZSBpZD1cImpzb25cIj4nK3N0cisnPC9wcmU+JykpXHJcblxyXG4gICAgdmFyIGVkaXR0YWJsZVByb3BlcnRpZXM9bW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdLmVkaXRhYmxlUHJvcGVydGllc1xyXG4gICAgdGhpcy5maWxsRWRpdGFibGVQcm9wZXJ0aWVzKGVkaXR0YWJsZVByb3BlcnRpZXMsZWRpdGFibGVQcm9wZXJ0aWVzRE9NKVxyXG4gICAgdmFyIHZhbGlkUmVsYXRpb25zaGlwcz1tb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF0udmFsaWRSZWxhdGlvbnNoaXBzXHJcbiAgICB0aGlzLmZpbGxSZWxhdGlvbnNoaXBJbmZvKHZhbGlkUmVsYXRpb25zaGlwcyxlZGl0YWJsZVByb3BlcnRpZXNET00pXHJcblxyXG4gICAgdGhpcy5maWxsVmlzdWFsaXphdGlvbihtb2RlbElELFZpc3VhbGl6YXRpb25ET00pXHJcblxyXG4gICAgdGhpcy5maWxsQmFzZUNsYXNzZXMobW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdLmFsbEJhc2VDbGFzc2VzLGJhc2VDbGFzc2VzRE9NKSBcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5maWxsQmFzZUNsYXNzZXM9ZnVuY3Rpb24oYmFzZUNsYXNzZXMscGFyZW50RG9tKXtcclxuICAgIGZvcih2YXIgaW5kIGluIGJhc2VDbGFzc2VzKXtcclxuICAgICAgICB2YXIga2V5RGl2PSAkKFwiPGxhYmVsIHN0eWxlPSdkaXNwbGF5OmJsb2NrO3BhZGRpbmc6LjFlbSc+XCIraW5kK1wiPC9sYWJlbD5cIilcclxuICAgICAgICBwYXJlbnREb20uYXBwZW5kKGtleURpdilcclxuICAgIH1cclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5maWxsVmlzdWFsaXphdGlvbj1mdW5jdGlvbihtb2RlbElELHBhcmVudERvbSl7XHJcbiAgICB2YXIgbW9kZWxKc29uPW1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXTtcclxuICAgIHZhciBhVGFibGU9JChcIjx0YWJsZSBzdHlsZT0nd2lkdGg6MTAwJSc+PC90YWJsZT5cIilcclxuICAgIGFUYWJsZS5odG1sKCc8dHI+PHRkPjwvdGQ+PHRkPjwvdGQ+PC90cj4nKVxyXG4gICAgcGFyZW50RG9tLmFwcGVuZChhVGFibGUpIFxyXG5cclxuICAgIHZhciBsZWZ0UGFydD1hVGFibGUuZmluZChcInRkOmZpcnN0XCIpXHJcbiAgICB2YXIgcmlnaHRQYXJ0PWFUYWJsZS5maW5kKFwidGQ6bnRoLWNoaWxkKDIpXCIpXHJcbiAgICByaWdodFBhcnQuY3NzKHtcIndpZHRoXCI6XCI1MHB4XCIsXCJoZWlnaHRcIjpcIjUwcHhcIixcImJvcmRlclwiOlwic29saWQgMXB4IGxpZ2h0R3JheVwifSlcclxuICAgIFxyXG4gICAgdmFyIGF2YXJ0YUltZz0kKFwiPGltZz48L2ltZz5cIilcclxuICAgIHJpZ2h0UGFydC5hcHBlbmQoYXZhcnRhSW1nKVxyXG4gICAgdmFyIHZpc3VhbEpzb249dGhpcy52aXN1YWxEZWZpbml0aW9uW2FkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLnNlbGVjdGVkQURUXVxyXG4gICAgaWYodmlzdWFsSnNvbiAmJiB2aXN1YWxKc29uW21vZGVsSURdICYmIHZpc3VhbEpzb25bbW9kZWxJRF0uYXZhcnRhKSBhdmFydGFJbWcuYXR0cignc3JjJyx2aXN1YWxKc29uW21vZGVsSURdLmF2YXJ0YSlcclxuICAgIHRoaXMuYXZhcnRhSW1nPWF2YXJ0YUltZztcclxuXHJcbiAgICBcclxuICAgIHRoaXMuYWRkT25lVmlzdWFsaXphdGlvblJvdyhtb2RlbElELGxlZnRQYXJ0KVxyXG4gICAgZm9yKHZhciBpbmQgaW4gbW9kZWxKc29uLnZhbGlkUmVsYXRpb25zaGlwcyl7XHJcbiAgICAgICAgdGhpcy5hZGRPbmVWaXN1YWxpemF0aW9uUm93KG1vZGVsSUQsbGVmdFBhcnQsaW5kKVxyXG4gICAgfVxyXG59XHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuYWRkT25lVmlzdWFsaXphdGlvblJvdz1mdW5jdGlvbihtb2RlbElELHBhcmVudERvbSxyZWxhdGluc2hpcE5hbWUpe1xyXG4gICAgaWYocmVsYXRpbnNoaXBOYW1lPT1udWxsKSB2YXIgbmFtZVN0cj1cIuKXr1wiIC8vdmlzdWFsIGZvciBub2RlXHJcbiAgICBlbHNlIG5hbWVTdHI9XCLin5wgXCIrcmVsYXRpbnNoaXBOYW1lXHJcbiAgICB2YXIgY29udGFpbmVyRGl2PSQoXCI8ZGl2IHN0eWxlPSdwYWRkaW5nLWJvdHRvbTo4cHgnPjwvZGl2PlwiKVxyXG4gICAgcGFyZW50RG9tLmFwcGVuZChjb250YWluZXJEaXYpXHJcbiAgICB2YXIgY29udGVudERPTT0kKFwiPGxhYmVsIHN0eWxlPSdtYXJnaW4tcmlnaHQ6MTBweCc+XCIrbmFtZVN0citcIjwvbGFiZWw+XCIpXHJcbiAgICBjb250YWluZXJEaXYuYXBwZW5kKGNvbnRlbnRET00pXHJcblxyXG4gICAgdmFyIGRlZmluaWVkQ29sb3I9bnVsbFxyXG4gICAgdmFyIHZpc3VhbEpzb249dGhpcy52aXN1YWxEZWZpbml0aW9uW2FkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLnNlbGVjdGVkQURUXVxyXG4gICAgaWYocmVsYXRpbnNoaXBOYW1lPT1udWxsKXtcclxuICAgICAgICBpZih2aXN1YWxKc29uICYmIHZpc3VhbEpzb25bbW9kZWxJRF0gJiYgdmlzdWFsSnNvblttb2RlbElEXS5jb2xvcikgZGVmaW5pZWRDb2xvcj12aXN1YWxKc29uW21vZGVsSURdLmNvbG9yXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICBpZih2aXN1YWxKc29uICYmIHZpc3VhbEpzb25bbW9kZWxJRF1cclxuICAgICAgICAgICAgICYmIHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxhdGlvbnNoaXBzXCJdXHJcbiAgICAgICAgICAgICAgJiYgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbGF0aW9uc2hpcHNcIl1bcmVsYXRpbnNoaXBOYW1lXSlcclxuICAgICAgICAgICAgICBkZWZpbmllZENvbG9yPXZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxhdGlvbnNoaXBzXCJdW3JlbGF0aW5zaGlwTmFtZV1cclxuICAgIH1cclxuXHJcbiAgICB2YXIgY29sb3JTZWxlY3Rvcj0kKCc8c2VsZWN0IGNsYXNzPVwidzMtYm9yZGVyXCIgc3R5bGU9XCJvdXRsaW5lOm5vbmVcIj48L3NlbGVjdD4nKVxyXG4gICAgY29udGFpbmVyRGl2LmFwcGVuZChjb2xvclNlbGVjdG9yKVxyXG4gICAgdmFyIGNvbG9yQXJyPVtcIkJsYWNrXCIsXCJMaWdodEdyYXlcIixcIlJlZFwiLFwiR3JlZW5cIixcIkJsdWVcIixcIkJpc3F1ZVwiLFwiQnJvd25cIixcIkNvcmFsXCIsXCJDcmltc29uXCIsXCJEb2RnZXJCbHVlXCIsXCJHb2xkXCJdXHJcbiAgICBjb2xvckFyci5mb3JFYWNoKChvbmVDb2xvckNvZGUpPT57XHJcbiAgICAgICAgdmFyIGFuT3B0aW9uPSQoXCI8b3B0aW9uIHZhbHVlPSdcIitvbmVDb2xvckNvZGUrXCInPlwiK29uZUNvbG9yQ29kZStcIuKWpzwvb3B0aW9uPlwiKVxyXG4gICAgICAgIGNvbG9yU2VsZWN0b3IuYXBwZW5kKGFuT3B0aW9uKVxyXG4gICAgICAgIGFuT3B0aW9uLmNzcyhcImNvbG9yXCIsb25lQ29sb3JDb2RlKVxyXG4gICAgfSlcclxuICAgIGlmKGRlZmluaWVkQ29sb3IhPW51bGwpIHtcclxuICAgICAgICBjb2xvclNlbGVjdG9yLnZhbChkZWZpbmllZENvbG9yKVxyXG4gICAgICAgIGNvbG9yU2VsZWN0b3IuY3NzKFwiY29sb3JcIixkZWZpbmllZENvbG9yKVxyXG4gICAgfVxyXG4gICAgY29sb3JTZWxlY3Rvci5jaGFuZ2UoKGV2ZSk9PntcclxuICAgICAgICB2YXIgc2VsZWN0Q29sb3JDb2RlPWV2ZS50YXJnZXQudmFsdWVcclxuICAgICAgICBjb2xvclNlbGVjdG9yLmNzcyhcImNvbG9yXCIsc2VsZWN0Q29sb3JDb2RlKVxyXG4gICAgICAgIGlmKCF0aGlzLnZpc3VhbERlZmluaXRpb25bYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cuc2VsZWN0ZWRBRFRdKSBcclxuICAgICAgICAgICAgdGhpcy52aXN1YWxEZWZpbml0aW9uW2FkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLnNlbGVjdGVkQURUXT17fVxyXG4gICAgICAgIHZhciB2aXN1YWxKc29uPXRoaXMudmlzdWFsRGVmaW5pdGlvblthZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZy5zZWxlY3RlZEFEVF1cclxuXHJcbiAgICAgICAgaWYoIXZpc3VhbEpzb25bbW9kZWxJRF0pIHZpc3VhbEpzb25bbW9kZWxJRF09e31cclxuICAgICAgICBpZighcmVsYXRpbnNoaXBOYW1lKSB7XHJcbiAgICAgICAgICAgIHZpc3VhbEpzb25bbW9kZWxJRF0uY29sb3I9c2VsZWN0Q29sb3JDb2RlXHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIiwgXCJtb2RlbElEXCI6bW9kZWxJRCxcImNvbG9yXCI6c2VsZWN0Q29sb3JDb2RlIH0pXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIGlmKCF2aXN1YWxKc29uW21vZGVsSURdW1wicmVsYXRpb25zaGlwc1wiXSkgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbGF0aW9uc2hpcHNcIl09e31cclxuICAgICAgICAgICAgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbGF0aW9uc2hpcHNcIl1bcmVsYXRpbnNoaXBOYW1lXT1zZWxlY3RDb2xvckNvZGVcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwidmlzdWFsRGVmaW5pdGlvbkNoYW5nZVwiLCBcInNyY01vZGVsSURcIjptb2RlbElELFwicmVsYXRpb25zaGlwTmFtZVwiOnJlbGF0aW5zaGlwTmFtZSxcImNvbG9yXCI6c2VsZWN0Q29sb3JDb2RlIH0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuc2F2ZVZpc3VhbERlZmluaXRpb24oKVxyXG4gICAgfSlcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5zYXZlVmlzdWFsRGVmaW5pdGlvbj1mdW5jdGlvbigpe1xyXG4gICAgJC5wb3N0KFwidmlzdWFsRGVmaW5pdGlvbi9zYXZlVmlzdWFsRGVmaW5pdGlvblwiLHt2aXN1YWxEZWZpbml0aW9uSnNvbjp0aGlzLnZpc3VhbERlZmluaXRpb259KVxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLmZpbGxSZWxhdGlvbnNoaXBJbmZvPWZ1bmN0aW9uKHZhbGlkUmVsYXRpb25zaGlwcyxwYXJlbnREb20pe1xyXG4gICAgZm9yKHZhciBpbmQgaW4gdmFsaWRSZWxhdGlvbnNoaXBzKXtcclxuICAgICAgICB2YXIga2V5RGl2PSAkKFwiPGxhYmVsIHN0eWxlPSdkaXNwbGF5OmlubGluZTtwYWRkaW5nOi4xZW0gLjNlbSAuMWVtIC4zZW07bWFyZ2luLXJpZ2h0Oi4zZW0nPlwiK2luZCtcIjwvbGFiZWw+XCIpXHJcbiAgICAgICAgcGFyZW50RG9tLmFwcGVuZChrZXlEaXYpXHJcbiAgICAgICAga2V5RGl2LmNzcyhcInBhZGRpbmctdG9wXCIsXCIuMWVtXCIpXHJcbiAgICAgICAgdmFyIGxhYmVsPSQoXCI8bGFiZWwgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO2JhY2tncm91bmQtY29sb3I6eWVsbG93Z3JlZW47Y29sb3I6d2hpdGU7Zm9udC1zaXplOjlweDtwYWRkaW5nOjJweCc+UmVsYXRpb25zaGlwIHR5cGU8L2xhYmVsPlwiKVxyXG4gICAgICAgIHBhcmVudERvbS5hcHBlbmQobGFiZWwpXHJcbiAgICAgICAgdmFyIGNvbnRlbnRET009JChcIjxsYWJlbD48L2xhYmVsPlwiKVxyXG4gICAgICAgIGNvbnRlbnRET00uY3NzKFwiZGlzcGxheVwiLFwiYmxvY2tcIilcclxuICAgICAgICBjb250ZW50RE9NLmNzcyhcInBhZGRpbmctbGVmdFwiLFwiMWVtXCIpXHJcbiAgICAgICAgcGFyZW50RG9tLmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgICAgIHRoaXMuZmlsbEVkaXRhYmxlUHJvcGVydGllcyh2YWxpZFJlbGF0aW9uc2hpcHNbaW5kXS5lZGl0YWJsZVJlbGF0aW9uc2hpcFByb3BlcnRpZXMsIGNvbnRlbnRET00pXHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuZmlsbEVkaXRhYmxlUHJvcGVydGllcz1mdW5jdGlvbihqc29uSW5mbyxwYXJlbnREb20pe1xyXG4gICAgZm9yKHZhciBpbmQgaW4ganNvbkluZm8pe1xyXG4gICAgICAgIHZhciBrZXlEaXY9ICQoXCI8bGFiZWwgc3R5bGU9J2Rpc3BsYXk6YmxvY2snPjxkaXYgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO3BhZGRpbmc6LjFlbSAuM2VtIC4xZW0gLjNlbTttYXJnaW4tcmlnaHQ6LjNlbSc+XCIraW5kK1wiPC9kaXY+PC9sYWJlbD5cIilcclxuICAgICAgICBwYXJlbnREb20uYXBwZW5kKGtleURpdilcclxuICAgICAgICBrZXlEaXYuY3NzKFwicGFkZGluZy10b3BcIixcIi4xZW1cIilcclxuXHJcbiAgICAgICAgdmFyIGNvbnRlbnRET009JChcIjxsYWJlbD48L2xhYmVsPlwiKVxyXG4gICAgICAgIGlmKEFycmF5LmlzQXJyYXkoanNvbkluZm9baW5kXSkpe1xyXG4gICAgICAgICAgICBjb250ZW50RE9NLnRleHQoXCJlbnVtXCIpXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKHtcImJhY2tncm91bmQtY29sb3JcIjpcImRhcmtHcmF5XCIsXCJjb2xvclwiOlwid2hpdGVcIixcImZvbnRTaXplXCI6XCI5cHhcIixcInBhZGRpbmdcIjonMnB4J30pXHJcbiAgICAgICAgfWVsc2UgaWYodHlwZW9mKGpzb25JbmZvW2luZF0pPT09XCJvYmplY3RcIikge1xyXG4gICAgICAgICAgICBjb250ZW50RE9NLmNzcyhcImRpc3BsYXlcIixcImJsb2NrXCIpXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwicGFkZGluZy1sZWZ0XCIsXCIxZW1cIilcclxuICAgICAgICAgICAgdGhpcy5maWxsRWRpdGFibGVQcm9wZXJ0aWVzKGpzb25JbmZvW2luZF0sY29udGVudERPTSlcclxuICAgICAgICB9ZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnRlbnRET00udGV4dChqc29uSW5mb1tpbmRdKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLmNzcyh7XCJiYWNrZ3JvdW5kLWNvbG9yXCI6XCJkYXJrR3JheVwiLFwiY29sb3JcIjpcIndoaXRlXCIsXCJmb250U2l6ZVwiOlwiOXB4XCIsXCJwYWRkaW5nXCI6JzJweCd9KVxyXG4gICAgICAgIH1cclxuICAgICAgICBrZXlEaXYuYXBwZW5kKGNvbnRlbnRET00pXHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLmFkZEFQYXJ0SW5SaWdodFNwYW49ZnVuY3Rpb24ocGFydE5hbWUpe1xyXG4gICAgdmFyIGhlYWRlckRPTT0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJsb2NrIHczLWxpZ2h0LWdyZXkgdzMtbGVmdC1hbGlnblwiIHN0eWxlPVwiZm9udC13ZWlnaHQ6Ym9sZFwiPjwvYnV0dG9uPicpXHJcbiAgICBoZWFkZXJET00udGV4dChwYXJ0TmFtZSlcclxuICAgIHZhciBsaXN0RE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1jb250YWluZXIgdzMtaGlkZSB3My1ib3JkZXIgdzMtc2hvd1wiIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjp3aGl0ZVwiPjwvZGl2PicpXHJcbiAgICB0aGlzLnBhbmVsQ2FyZC5hcHBlbmQoaGVhZGVyRE9NLGxpc3RET00pXHJcblxyXG4gICAgaGVhZGVyRE9NLm9uKFwiY2xpY2tcIiwoZXZ0KT0+IHtcclxuICAgICAgICBpZihsaXN0RE9NLmhhc0NsYXNzKFwidzMtc2hvd1wiKSkgbGlzdERPTS5yZW1vdmVDbGFzcyhcInczLXNob3dcIilcclxuICAgICAgICBlbHNlIGxpc3RET00uYWRkQ2xhc3MoXCJ3My1zaG93XCIpXHJcbiBcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgcmV0dXJuIGxpc3RET007XHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUucmVhZE1vZGVsRmlsZXNDb250ZW50QW5kSW1wb3J0PWFzeW5jIGZ1bmN0aW9uKGZpbGVzKXtcclxuICAgIC8vIGZpbGVzIGlzIGEgRmlsZUxpc3Qgb2YgRmlsZSBvYmplY3RzLiBMaXN0IHNvbWUgcHJvcGVydGllcy5cclxuICAgIHZhciBmaWxlQ29udGVudEFycj1bXVxyXG4gICAgZm9yICh2YXIgaSA9IDAsIGY7IGYgPSBmaWxlc1tpXTsgaSsrKSB7XHJcbiAgICAgICAgLy8gT25seSBwcm9jZXNzIGpzb24gZmlsZXMuXHJcbiAgICAgICAgaWYgKGYudHlwZSE9XCJhcHBsaWNhdGlvbi9qc29uXCIpIGNvbnRpbnVlO1xyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICAgdmFyIHN0cj0gYXdhaXQgdGhpcy5yZWFkT25lRmlsZShmKVxyXG4gICAgICAgICAgICB2YXIgb2JqPUpTT04ucGFyc2Uoc3RyKVxyXG4gICAgICAgICAgICBmaWxlQ29udGVudEFyci5wdXNoKG9iailcclxuICAgICAgICB9Y2F0Y2goZXJyKXtcclxuICAgICAgICAgICAgYWxlcnQoZXJyKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmKGZpbGVDb250ZW50QXJyLmxlbmd0aD09MCkgcmV0dXJuO1xyXG4gICAgY29uc29sZS5sb2coZmlsZUNvbnRlbnRBcnIpXHJcbiAgICAkLnBvc3QoXCJlZGl0QURUL2ltcG9ydE1vZGVsc1wiLHtcIm1vZGVsc1wiOmZpbGVDb250ZW50QXJyfSwgKGRhdGEpPT4ge1xyXG4gICAgICAgIGlmIChkYXRhID09IFwiXCIpIHsvL3N1Y2Nlc3NmdWxcclxuICAgICAgICAgICAgdGhpcy5saXN0TW9kZWxzKFwic2hvdWxkQnJvYWRDYXN0XCIpXHJcbiAgICAgICAgfSBlbHNlIHsgLy9lcnJvciBoYXBwZW5zXHJcbiAgICAgICAgICAgIGFsZXJ0KGRhdGEpXHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUucmVhZE9uZUZpbGU9IGFzeW5jIGZ1bmN0aW9uKGFGaWxlKXtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcclxuICAgICAgICAgICAgcmVhZGVyLm9ubG9hZCA9ICgpPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZWFkZXIucmVzdWx0KVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICByZWFkZXIucmVhZEFzVGV4dChhRmlsZSk7XHJcbiAgICAgICAgfWNhdGNoKGUpe1xyXG4gICAgICAgICAgICByZWplY3QoZSlcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLmFzc2lnbkV2ZW50VG9PbmVNb2RlbD1mdW5jdGlvbihvbmVNb2RlbCl7XHJcbiAgICBvbmVNb2RlbC5vbihcImNsaWNrXCIsKGUpPT57XHJcbiAgICAgICAgdGhpcy5tb2RlbExpc3QuY2hpbGRyZW4oKS5lYWNoKChpbmRleCxlbGUpPT57XHJcbiAgICAgICAgICAgICQoZWxlKS5yZW1vdmVDbGFzcyhcInczLWFtYmVyXCIpXHJcbiAgICAgICAgfSlcclxuICAgICAgICBvbmVNb2RlbC5hZGRDbGFzcyhcInczLWFtYmVyXCIpXHJcbiAgICAgICAgdmFyIG1vZGVsTmFtZSA9IG9uZU1vZGVsLmRhdGEoJ21vZGVsTmFtZScpXHJcbiAgICAgICAgaWYobW9kZWxOYW1lKSB0aGlzLmZpbGxSaWdodFNwYW4obW9kZWxOYW1lKVxyXG4gICAgfSlcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5saXN0TW9kZWxzPWZ1bmN0aW9uKHNob3VsZEJyb2FkY2FzdCl7XHJcbiAgICB0aGlzLm1vZGVsTGlzdC5lbXB0eSgpXHJcbiAgICBmb3IodmFyIGluZCBpbiB0aGlzLm1vZGVscykgZGVsZXRlIHRoaXMubW9kZWxzW2luZF1cclxuICAgICQuZ2V0KFwicXVlcnlBRFQvbGlzdE1vZGVsc1wiLCAoZGF0YSwgc3RhdHVzKSA9PiB7XHJcbiAgICAgICAgaWYoZGF0YT09XCJcIikgZGF0YT1bXVxyXG4gICAgICAgIGRhdGEuZm9yRWFjaChvbmVJdGVtPT57XHJcbiAgICAgICAgICAgIGlmKG9uZUl0ZW1bXCJkaXNwbGF5TmFtZVwiXT09bnVsbCkgb25lSXRlbVtcImRpc3BsYXlOYW1lXCJdPW9uZUl0ZW1bXCJAaWRcIl1cclxuICAgICAgICAgICAgdGhpcy5tb2RlbHNbb25lSXRlbVtcImRpc3BsYXlOYW1lXCJdXSA9IG9uZUl0ZW1cclxuICAgICAgICB9KVxyXG4gICAgICAgIGlmKHNob3VsZEJyb2FkY2FzdCl7XHJcbiAgICAgICAgICAgIG1vZGVsQW5hbHl6ZXIuY2xlYXJBbGxNb2RlbHMoKTtcclxuICAgICAgICAgICAgbW9kZWxBbmFseXplci5hZGRNb2RlbHMoZGF0YSlcclxuICAgICAgICAgICAgbW9kZWxBbmFseXplci5hbmFseXplKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmKGRhdGEubGVuZ3RoPT0wKXtcclxuICAgICAgICAgICAgdmFyIHplcm9Nb2RlbEl0ZW09JCgnPGxpIHN0eWxlPVwiZm9udC1zaXplOjAuOWVtXCI+emVybyBtb2RlbCByZWNvcmQuIFBsZWFzZSBpbXBvcnQuLi48L2xpPicpXHJcbiAgICAgICAgICAgIHRoaXMubW9kZWxMaXN0LmFwcGVuZCh6ZXJvTW9kZWxJdGVtKVxyXG4gICAgICAgICAgICB6ZXJvTW9kZWxJdGVtLmNzcyhcImN1cnNvclwiLFwiZGVmYXVsdFwiKVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICB2YXIgc29ydEFycj1bXVxyXG4gICAgICAgICAgICBmb3IodmFyIG1vZGVsTmFtZSBpbiB0aGlzLm1vZGVscykgc29ydEFyci5wdXNoKG1vZGVsTmFtZSlcclxuICAgICAgICAgICAgc29ydEFyci5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhLnRvTG93ZXJDYXNlKCkubG9jYWxlQ29tcGFyZShiLnRvTG93ZXJDYXNlKCkpIH0pO1xyXG4gICAgICAgICAgICBzb3J0QXJyLmZvckVhY2gob25lTW9kZWxOYW1lPT57XHJcbiAgICAgICAgICAgICAgICB2YXIgb25lTW9kZWxJdGVtPSQoJzxsaSBzdHlsZT1cImZvbnQtc2l6ZTowLjllbVwiPicrb25lTW9kZWxOYW1lKyc8L2xpPicpXHJcbiAgICAgICAgICAgICAgICBvbmVNb2RlbEl0ZW0uY3NzKFwiY3Vyc29yXCIsXCJkZWZhdWx0XCIpXHJcbiAgICAgICAgICAgICAgICBvbmVNb2RlbEl0ZW0uZGF0YShcIm1vZGVsTmFtZVwiLCBvbmVNb2RlbE5hbWUpXHJcbiAgICAgICAgICAgICAgICB0aGlzLm1vZGVsTGlzdC5hcHBlbmQob25lTW9kZWxJdGVtKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5hc3NpZ25FdmVudFRvT25lTW9kZWwob25lTW9kZWxJdGVtKVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBpZihzaG91bGRCcm9hZGNhc3QpIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcIkFEVE1vZGVsc0NoYW5nZVwiLCBcIm1vZGVsc1wiOnRoaXMubW9kZWxzIH0pXHJcbiAgICB9KVxyXG59XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgbW9kZWxNYW5hZ2VyRGlhbG9nKCk7IiwiZnVuY3Rpb24gc2ltcGxlQ29uZmlybURpYWxvZygpe1xyXG4gICAgdGhpcy5ET00gPSAkKCc8ZGl2IHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dG9wOjUwJTtiYWNrZ3JvdW5kLWNvbG9yOndoaXRlO2xlZnQ6NTAlO3RyYW5zZm9ybTogdHJhbnNsYXRlWCgtNTAlKSB0cmFuc2xhdGVZKC01MCUpO3otaW5kZXg6MTAyXCIgY2xhc3M9XCJ3My1jYXJkLTRcIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5ET00uY3NzKFwib3ZlcmZsb3dcIixcImhpZGRlblwiKVxyXG59XHJcblxyXG5zaW1wbGVDb25maXJtRGlhbG9nLnByb3RvdHlwZS5zaG93PWZ1bmN0aW9uKGNzc09wdGlvbnMsb3RoZXJPcHRpb25zKXtcclxuICAgIHRoaXMuRE9NLmNzcyhjc3NPcHRpb25zKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6NDBweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiZm9udC1zaXplOjEuMmVtXCI+JyArIG90aGVyT3B0aW9ucy50aXRsZSArICc8L2Rpdj48L2Rpdj4nKSlcclxuICAgIHZhciBjbG9zZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmlnaHRcIiBzdHlsZT1cImZvbnQtc2l6ZToyZW07cGFkZGluZy10b3A6NHB4XCI+w5c8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5ET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZChjbG9zZUJ1dHRvbilcclxuICAgIGNsb3NlQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLmNsb3NlKCkgfSlcclxuXHJcbiAgICB2YXIgZGlhbG9nRGl2PSQoJzxkaXYgY2xhc3M9XCJ3My1jb250YWluZXJcIiBzdHlsZT1cIm1hcmdpbi10b3A6MTBweDttYXJnaW4tYm90dG9tOjEwcHhcIj48L2Rpdj4nKVxyXG4gICAgZGlhbG9nRGl2LnRleHQob3RoZXJPcHRpb25zLmNvbnRlbnQpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQoZGlhbG9nRGl2KVxyXG5cclxuICAgIHRoaXMuYm90dG9tQmFyPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXJcIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKHRoaXMuYm90dG9tQmFyKVxyXG5cclxuICAgIG90aGVyT3B0aW9ucy5idXR0b25zLmZvckVhY2goYnRuPT57XHJcbiAgICAgICAgdmFyIGFCdXR0b249JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1yaWdodCAnKyhidG4uY29sb3JDbGFzc3x8XCJcIikrJ1wiIHN0eWxlPVwibWFyZ2luLXJpZ2h0OjJweDttYXJnaW4tbGVmdDoycHhcIj4nK2J0bi50ZXh0Kyc8L2J1dHRvbj4nKVxyXG4gICAgICAgIGFCdXR0b24ub24oXCJjbGlja1wiLCgpPT4geyBidG4uY2xpY2tGdW5jKCkgIH0gIClcclxuICAgICAgICB0aGlzLmJvdHRvbUJhci5hcHBlbmQoYUJ1dHRvbikgICAgXHJcbiAgICB9KVxyXG4gICAgJChcImJvZHlcIikuYXBwZW5kKHRoaXMuRE9NKVxyXG59XHJcblxyXG5zaW1wbGVDb25maXJtRGlhbG9nLnByb3RvdHlwZS5jbG9zZT1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5ET00ucmVtb3ZlKClcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBzaW1wbGVDb25maXJtRGlhbG9nOyIsImZ1bmN0aW9uIHNpbXBsZVNlbGVjdE1lbnUoYnV0dG9uTmFtZSxvcHRpb25zKXtcclxuICAgIG9wdGlvbnM9b3B0aW9uc3x8e30gLy97aXNDbGlja2FibGU6MSx3aXRoQm9yZGVyOjEsZm9udFNpemU6XCJcIixjb2xvckNsYXNzOlwiXCIsYnV0dG9uQ1NTOlwiXCJ9XHJcbiAgICBpZihvcHRpb25zLmlzQ2xpY2thYmxlKXtcclxuICAgICAgICB0aGlzLmlzQ2xpY2thYmxlPXRydWVcclxuICAgICAgICB0aGlzLkRPTT0kKCc8ZGl2IGNsYXNzPVwidzMtZHJvcGRvd24tY2xpY2tcIj48L2Rpdj4nKVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgdGhpcy5ET009JCgnPGRpdiBjbGFzcz1cInczLWRyb3Bkb3duLWhvdmVyIFwiPjwvZGl2PicpXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHRoaXMuYnV0dG9uPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b25cIiBzdHlsZT1cIm91dGxpbmU6IG5vbmU7XCI+PGE+JytidXR0b25OYW1lKyc8L2E+PGEgc3R5bGU9XCJmb250LXdlaWdodDpib2xkO3BhZGRpbmctbGVmdDoycHhcIj48L2E+PGkgY2xhc3M9XCJmYSBmYS1jYXJldC1kb3duXCIgc3R5bGU9XCJwYWRkaW5nLWxlZnQ6M3B4XCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICBpZihvcHRpb25zLndpdGhCb3JkZXIpIHRoaXMuYnV0dG9uLmFkZENsYXNzKFwidzMtYm9yZGVyXCIpXHJcbiAgICBpZihvcHRpb25zLmZvbnRTaXplKSB0aGlzLkRPTS5jc3MoXCJmb250LXNpemVcIixvcHRpb25zLmZvbnRTaXplKVxyXG4gICAgaWYob3B0aW9ucy5jb2xvckNsYXNzKSB0aGlzLmJ1dHRvbi5hZGRDbGFzcyhvcHRpb25zLmNvbG9yQ2xhc3MpXHJcbiAgICBpZihvcHRpb25zLndpZHRoKSB0aGlzLmJ1dHRvbi5jc3MoXCJ3aWR0aFwiLG9wdGlvbnMud2lkdGgpXHJcbiAgICBpZihvcHRpb25zLmJ1dHRvbkNTUykgdGhpcy5idXR0b24uY3NzKG9wdGlvbnMuYnV0dG9uQ1NTKVxyXG5cclxuXHJcbiAgICB0aGlzLm9wdGlvbkNvbnRlbnRET009JCgnPGRpdiBjbGFzcz1cInczLWRyb3Bkb3duLWNvbnRlbnQgdzMtYmFyLWJsb2NrIHczLWNhcmQtNFwiPicpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQodGhpcy5idXR0b24sdGhpcy5vcHRpb25Db250ZW50RE9NKVxyXG4gICAgdGhpcy5jdXJTZWxlY3RWYWw9bnVsbDtcclxuXHJcbiAgICBpZihvcHRpb25zLmlzQ2xpY2thYmxlKXtcclxuICAgICAgICB0aGlzLmJ1dHRvbi5vbihcImNsaWNrXCIsKGUpPT57XHJcbiAgICAgICAgICAgIGlmKHRoaXMub3B0aW9uQ29udGVudERPTS5oYXNDbGFzcyhcInczLXNob3dcIikpICB0aGlzLm9wdGlvbkNvbnRlbnRET00ucmVtb3ZlQ2xhc3MoXCJ3My1zaG93XCIpXHJcbiAgICAgICAgICAgIGVsc2UgdGhpcy5vcHRpb25Db250ZW50RE9NLmFkZENsYXNzKFwidzMtc2hvd1wiKVxyXG4gICAgICAgIH0pICAgIFxyXG4gICAgfVxyXG59XHJcblxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS5maW5kT3B0aW9uPWZ1bmN0aW9uKG9wdGlvblZhbHVlKXtcclxuICAgIHZhciBvcHRpb25zPXRoaXMub3B0aW9uQ29udGVudERPTS5jaGlsZHJlbigpXHJcbiAgICBmb3IodmFyIGk9MDtpPG9wdGlvbnMubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIGFuT3B0aW9uPSQob3B0aW9uc1tpXSlcclxuICAgICAgICBpZihvcHRpb25WYWx1ZT09YW5PcHRpb24uZGF0YShcIm9wdGlvblZhbHVlXCIpKXtcclxuICAgICAgICAgICAgcmV0dXJuIHtcInRleHRcIjphbk9wdGlvbi50ZXh0KCksXCJ2YWx1ZVwiOmFuT3B0aW9uLmRhdGEoXCJvcHRpb25WYWx1ZVwiKX1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbnNpbXBsZVNlbGVjdE1lbnUucHJvdG90eXBlLmFkZE9wdGlvbj1mdW5jdGlvbihvcHRpb25UZXh0LG9wdGlvblZhbHVlKXtcclxuICAgIHZhciBvcHRpb25JdGVtPSQoJzxhIGhyZWY9XCIjXCIgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b25cIj4nK29wdGlvblRleHQrJzwvYT4nKVxyXG4gICAgdGhpcy5vcHRpb25Db250ZW50RE9NLmFwcGVuZChvcHRpb25JdGVtKVxyXG4gICAgb3B0aW9uSXRlbS5kYXRhKFwib3B0aW9uVmFsdWVcIixvcHRpb25WYWx1ZXx8b3B0aW9uVGV4dClcclxuICAgIG9wdGlvbkl0ZW0ub24oJ2NsaWNrJywoZSk9PntcclxuICAgICAgICB0aGlzLmN1clNlbGVjdFZhbD1vcHRpb25JdGVtLmRhdGEoXCJvcHRpb25WYWx1ZVwiKVxyXG4gICAgICAgIGlmKHRoaXMuaXNDbGlja2FibGUpe1xyXG4gICAgICAgICAgICB0aGlzLm9wdGlvbkNvbnRlbnRET00ucmVtb3ZlQ2xhc3MoXCJ3My1zaG93XCIpXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHRoaXMuRE9NLnJlbW92ZUNsYXNzKCd3My1kcm9wZG93bi1ob3ZlcicpXHJcbiAgICAgICAgICAgIHRoaXMuRE9NLmFkZENsYXNzKCd3My1kcm9wZG93bi1jbGljaycpXHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4geyAvL3RoaXMgaXMgdG8gaGlkZSB0aGUgZHJvcCBkb3duIG1lbnUgYWZ0ZXIgY2xpY2tcclxuICAgICAgICAgICAgICAgIHRoaXMuRE9NLmFkZENsYXNzKCd3My1kcm9wZG93bi1ob3ZlcicpXHJcbiAgICAgICAgICAgICAgICB0aGlzLkRPTS5yZW1vdmVDbGFzcygndzMtZHJvcGRvd24tY2xpY2snKVxyXG4gICAgICAgICAgICB9LCAxMDApO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmNhbGxCYWNrX2NsaWNrT3B0aW9uKG9wdGlvblRleHQsb3B0aW9uSXRlbS5kYXRhKFwib3B0aW9uVmFsdWVcIikpXHJcbiAgICB9KVxyXG59XHJcblxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS5jaGFuZ2VOYW1lPWZ1bmN0aW9uKG5hbWVTdHIxLG5hbWVTdHIyKXtcclxuICAgIHRoaXMuYnV0dG9uLmNoaWxkcmVuKFwiOmZpcnN0XCIpLnRleHQobmFtZVN0cjEpXHJcbiAgICB0aGlzLmJ1dHRvbi5jaGlsZHJlbigpLmVxKDEpLnRleHQobmFtZVN0cjIpXHJcbn1cclxuXHJcbnNpbXBsZVNlbGVjdE1lbnUucHJvdG90eXBlLnRyaWdnZXJPcHRpb25JbmRleD1mdW5jdGlvbihvcHRpb25JbmRleCl7XHJcbiAgICB2YXIgdGhlT3B0aW9uPXRoaXMub3B0aW9uQ29udGVudERPTS5jaGlsZHJlbigpLmVxKG9wdGlvbkluZGV4KVxyXG4gICAgaWYodGhlT3B0aW9uLmxlbmd0aD09MCkge1xyXG4gICAgICAgIHRoaXMuY3VyU2VsZWN0VmFsPW51bGw7XHJcbiAgICAgICAgdGhpcy5jYWxsQmFja19jbGlja09wdGlvbihudWxsLG51bGwpXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgdGhpcy5jdXJTZWxlY3RWYWw9dGhlT3B0aW9uLmRhdGEoXCJvcHRpb25WYWx1ZVwiKVxyXG4gICAgdGhpcy5jYWxsQmFja19jbGlja09wdGlvbih0aGVPcHRpb24udGV4dCgpLHRoZU9wdGlvbi5kYXRhKFwib3B0aW9uVmFsdWVcIikpXHJcbn1cclxuc2ltcGxlU2VsZWN0TWVudS5wcm90b3R5cGUudHJpZ2dlck9wdGlvblZhbHVlPWZ1bmN0aW9uKG9wdGlvblZhbHVlKXtcclxuICAgIHZhciByZT10aGlzLmZpbmRPcHRpb24ob3B0aW9uVmFsdWUpXHJcbiAgICBpZihyZT09bnVsbCl7XHJcbiAgICAgICAgdGhpcy5jdXJTZWxlY3RWYWw9bnVsbFxyXG4gICAgICAgIHRoaXMuY2FsbEJhY2tfY2xpY2tPcHRpb24obnVsbCxudWxsKVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgdGhpcy5jdXJTZWxlY3RWYWw9cmUudmFsdWVcclxuICAgICAgICB0aGlzLmNhbGxCYWNrX2NsaWNrT3B0aW9uKHJlLnRleHQscmUudmFsdWUpXHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS5jbGVhck9wdGlvbnM9ZnVuY3Rpb24ob3B0aW9uVGV4dCxvcHRpb25WYWx1ZSl7XHJcbiAgICB0aGlzLm9wdGlvbkNvbnRlbnRET00uZW1wdHkoKVxyXG4gICAgdGhpcy5jdXJTZWxlY3RWYWw9bnVsbDtcclxufVxyXG5cclxuc2ltcGxlU2VsZWN0TWVudS5wcm90b3R5cGUuY2FsbEJhY2tfY2xpY2tPcHRpb249ZnVuY3Rpb24ob3B0aW9udGV4dCxvcHRpb25WYWx1ZSl7XHJcblxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHNpbXBsZVNlbGVjdE1lbnU7IiwiJ3VzZSBzdHJpY3QnO1xyXG5cclxuZnVuY3Rpb24gc2ltcGxlVHJlZShET00pe1xyXG4gICAgdGhpcy5ET009RE9NXHJcbiAgICB0aGlzLmdyb3VwTm9kZXM9W10gLy9lYWNoIGdyb3VwIGhlYWRlciBpcyBvbmUgbm9kZVxyXG4gICAgdGhpcy5zZWxlY3RlZE5vZGVzPVtdO1xyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5zY3JvbGxUb0xlYWZOb2RlPWZ1bmN0aW9uKGFOb2RlKXtcclxuICAgIHZhciBzY3JvbGxUb3A9dGhpcy5ET00uc2Nyb2xsVG9wKClcclxuICAgIHZhciB0cmVlSGVpZ2h0PXRoaXMuRE9NLmhlaWdodCgpXHJcbiAgICB2YXIgbm9kZVBvc2l0aW9uPWFOb2RlLkRPTS5wb3NpdGlvbigpLnRvcCAvL3doaWNoIGRvZXMgbm90IGNvbnNpZGVyIHBhcmVudCBET00ncyBzY3JvbGwgaGVpZ2h0XHJcbiAgICAvL2NvbnNvbGUubG9nKHNjcm9sbFRvcCx0cmVlSGVpZ2h0LG5vZGVQb3NpdGlvbilcclxuICAgIGlmKHRyZWVIZWlnaHQtNTA8bm9kZVBvc2l0aW9uKXtcclxuICAgICAgICB0aGlzLkRPTS5zY3JvbGxUb3Aoc2Nyb2xsVG9wICsgbm9kZVBvc2l0aW9uLSh0cmVlSGVpZ2h0LTUwKSkgXHJcbiAgICB9ZWxzZSBpZihub2RlUG9zaXRpb248NTApe1xyXG4gICAgICAgIHRoaXMuRE9NLnNjcm9sbFRvcChzY3JvbGxUb3AgKyAobm9kZVBvc2l0aW9uLTUwKSkgXHJcbiAgICB9XHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmNsZWFyQWxsTGVhZk5vZGVzPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLmdyb3VwTm9kZXMuZm9yRWFjaCgoZ05vZGUpPT57XHJcbiAgICAgICAgZ05vZGUubGlzdERPTS5lbXB0eSgpXHJcbiAgICAgICAgZ05vZGUuY2hpbGRMZWFmTm9kZXMubGVuZ3RoPTBcclxuICAgICAgICBnTm9kZS5yZWZyZXNoTmFtZSgpXHJcbiAgICB9KVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5maXJzdExlYWZOb2RlPWZ1bmN0aW9uKCl7XHJcbiAgICBpZih0aGlzLmdyb3VwTm9kZXMubGVuZ3RoPT0wKSByZXR1cm4gbnVsbDtcclxuICAgIHZhciBmaXJzdExlYWZOb2RlPW51bGw7XHJcbiAgICB0aGlzLmdyb3VwTm9kZXMuZm9yRWFjaChhR3JvdXBOb2RlPT57XHJcbiAgICAgICAgaWYoZmlyc3RMZWFmTm9kZSE9bnVsbCkgcmV0dXJuO1xyXG4gICAgICAgIGlmKGFHcm91cE5vZGUuY2hpbGRMZWFmTm9kZXMubGVuZ3RoPjApIGZpcnN0TGVhZk5vZGU9YUdyb3VwTm9kZS5jaGlsZExlYWZOb2Rlc1swXVxyXG4gICAgfSlcclxuXHJcbiAgICByZXR1cm4gZmlyc3RMZWFmTm9kZVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5uZXh0R3JvdXBOb2RlPWZ1bmN0aW9uKGFHcm91cE5vZGUpe1xyXG4gICAgaWYoYUdyb3VwTm9kZT09bnVsbCkgcmV0dXJuO1xyXG4gICAgdmFyIGluZGV4PXRoaXMuZ3JvdXBOb2Rlcy5pbmRleE9mKGFHcm91cE5vZGUpXHJcbiAgICBpZih0aGlzLmdyb3VwTm9kZXMubGVuZ3RoLTE+aW5kZXgpe1xyXG4gICAgICAgIHJldHVybiB0aGlzLmdyb3VwTm9kZXNbaW5kZXgrMV1cclxuICAgIH1lbHNleyAvL3JvdGF0ZSBiYWNrd2FyZCB0byBmaXJzdCBncm91cCBub2RlXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ3JvdXBOb2Rlc1swXSBcclxuICAgIH1cclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUubmV4dExlYWZOb2RlPWZ1bmN0aW9uKGFMZWFmTm9kZSl7XHJcbiAgICBpZihhTGVhZk5vZGU9PW51bGwpIHJldHVybjtcclxuICAgIHZhciBhR3JvdXBOb2RlPWFMZWFmTm9kZS5wYXJlbnRHcm91cE5vZGVcclxuICAgIHZhciBpbmRleD1hR3JvdXBOb2RlLmNoaWxkTGVhZk5vZGVzLmluZGV4T2YoYUxlYWZOb2RlKVxyXG4gICAgaWYoYUdyb3VwTm9kZS5jaGlsZExlYWZOb2Rlcy5sZW5ndGgtMT5pbmRleCl7XHJcbiAgICAgICAgLy9uZXh0IG5vZGUgaXMgaW4gc2FtZSBncm91cFxyXG4gICAgICAgIHJldHVybiBhR3JvdXBOb2RlLmNoaWxkTGVhZk5vZGVzW2luZGV4KzFdXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICAvL2ZpbmQgbmV4dCBncm91cCBmaXJzdCBub2RlXHJcbiAgICAgICAgd2hpbGUodHJ1ZSl7XHJcbiAgICAgICAgICAgIHZhciBuZXh0R3JvdXBOb2RlID0gdGhpcy5uZXh0R3JvdXBOb2RlKGFHcm91cE5vZGUpXHJcbiAgICAgICAgICAgIGlmKG5leHRHcm91cE5vZGUuY2hpbGRMZWFmTm9kZXMubGVuZ3RoPT0wKXtcclxuICAgICAgICAgICAgICAgIGFHcm91cE5vZGU9bmV4dEdyb3VwTm9kZVxyXG4gICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXh0R3JvdXBOb2RlLmNoaWxkTGVhZk5vZGVzWzBdXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLnNlYXJjaFRleHQ9ZnVuY3Rpb24oc3RyKXtcclxuICAgIGlmKHN0cj09XCJcIikgcmV0dXJuIG51bGw7XHJcbiAgICAvL3NlYXJjaCBmcm9tIGN1cnJlbnQgc2VsZWN0IGl0ZW0gdGhlIG5leHQgbGVhZiBpdGVtIGNvbnRhaW5zIHRoZSB0ZXh0XHJcbiAgICB2YXIgcmVnZXggPSBuZXcgUmVnRXhwKHN0ciwgJ2knKTtcclxuICAgIHZhciBzdGFydE5vZGVcclxuICAgIGlmKHRoaXMuc2VsZWN0ZWROb2Rlcy5sZW5ndGg9PTApIHtcclxuICAgICAgICBzdGFydE5vZGU9dGhpcy5maXJzdExlYWZOb2RlKClcclxuICAgICAgICBpZihzdGFydE5vZGU9PW51bGwpIHJldHVybjtcclxuICAgICAgICB2YXIgdGhlU3RyPXN0YXJ0Tm9kZS5uYW1lO1xyXG4gICAgICAgIGlmKHRoZVN0ci5tYXRjaChyZWdleCkhPW51bGwpe1xyXG4gICAgICAgICAgICAvL2ZpbmQgdGFyZ2V0IG5vZGUgXHJcbiAgICAgICAgICAgIHJldHVybiBzdGFydE5vZGVcclxuICAgICAgICB9XHJcbiAgICB9ZWxzZSBzdGFydE5vZGU9dGhpcy5zZWxlY3RlZE5vZGVzWzBdXHJcblxyXG4gICAgaWYoc3RhcnROb2RlPT1udWxsKSByZXR1cm4gbnVsbDtcclxuICAgIFxyXG4gICAgdmFyIGZyb21Ob2RlPXN0YXJ0Tm9kZTtcclxuICAgIHdoaWxlKHRydWUpe1xyXG4gICAgICAgIHZhciBuZXh0Tm9kZT10aGlzLm5leHRMZWFmTm9kZShmcm9tTm9kZSlcclxuICAgICAgICBpZihuZXh0Tm9kZT09c3RhcnROb2RlKSByZXR1cm4gbnVsbDtcclxuICAgICAgICB2YXIgbmV4dE5vZGVTdHI9bmV4dE5vZGUubmFtZTtcclxuICAgICAgICBpZihuZXh0Tm9kZVN0ci5tYXRjaChyZWdleCkhPW51bGwpe1xyXG4gICAgICAgICAgICAvL2ZpbmQgdGFyZ2V0IG5vZGVcclxuICAgICAgICAgICAgcmV0dXJuIG5leHROb2RlXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIGZyb21Ob2RlPW5leHROb2RlO1xyXG4gICAgICAgIH1cclxuICAgIH0gICAgXHJcbn1cclxuXHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5hZGRMZWFmbm9kZVRvR3JvdXA9ZnVuY3Rpb24oZ3JvdXBOYW1lLG9iaixza2lwUmVwZWF0KXtcclxuICAgIHZhciBhR3JvdXBOb2RlPXRoaXMuZmluZEdyb3VwTm9kZShncm91cE5hbWUpXHJcbiAgICBpZihhR3JvdXBOb2RlID09IG51bGwpIHJldHVybjtcclxuICAgIGFHcm91cE5vZGUuYWRkTm9kZShvYmosc2tpcFJlcGVhdClcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUucmVtb3ZlQWxsTm9kZXM9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5sZW5ndGg9MDtcclxuICAgIHRoaXMuc2VsZWN0ZWROb2Rlcy5sZW5ndGg9MDtcclxuICAgIHRoaXMuRE9NLmVtcHR5KClcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuZmluZEdyb3VwTm9kZT1mdW5jdGlvbihncm91cE5hbWUpe1xyXG4gICAgdmFyIGZvdW5kR3JvdXBOb2RlPW51bGxcclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5mb3JFYWNoKGFHcm91cE5vZGU9PntcclxuICAgICAgICBpZihhR3JvdXBOb2RlLm5hbWU9PWdyb3VwTmFtZSl7XHJcbiAgICAgICAgICAgIGZvdW5kR3JvdXBOb2RlPWFHcm91cE5vZGVcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbiAgICByZXR1cm4gZm91bmRHcm91cE5vZGU7XHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmRlbEdyb3VwTm9kZT1mdW5jdGlvbihnbm9kZSl7XHJcbiAgICBnbm9kZS5kZWxldGVTZWxmKClcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuZGVsZXRlTGVhZk5vZGU9ZnVuY3Rpb24obm9kZU5hbWUpe1xyXG4gICAgdmFyIGZpbmRMZWFmTm9kZT1udWxsXHJcbiAgICB0aGlzLmdyb3VwTm9kZXMuZm9yRWFjaCgoZ05vZGUpPT57XHJcbiAgICAgICAgaWYoZmluZExlYWZOb2RlIT1udWxsKSByZXR1cm47XHJcbiAgICAgICAgZ05vZGUuY2hpbGRMZWFmTm9kZXMuZm9yRWFjaCgoYUxlYWYpPT57XHJcbiAgICAgICAgICAgIGlmKGFMZWFmLm5hbWU9PW5vZGVOYW1lKXtcclxuICAgICAgICAgICAgICAgIGZpbmRMZWFmTm9kZT1hTGVhZlxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgIH0pXHJcbiAgICBpZihmaW5kTGVhZk5vZGU9PW51bGwpIHJldHVybjtcclxuICAgIGZpbmRMZWFmTm9kZS5kZWxldGVTZWxmKClcclxufVxyXG5cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmluc2VydEdyb3VwTm9kZT1mdW5jdGlvbihvYmosaW5kZXgpe1xyXG4gICAgdmFyIGFOZXdHcm91cE5vZGUgPSBuZXcgc2ltcGxlVHJlZUdyb3VwTm9kZSh0aGlzLG9iailcclxuICAgIHZhciBleGlzdEdyb3VwTm9kZT0gdGhpcy5maW5kR3JvdXBOb2RlKGFOZXdHcm91cE5vZGUubmFtZSlcclxuICAgIGlmKGV4aXN0R3JvdXBOb2RlIT1udWxsKSByZXR1cm47XHJcbiAgICB0aGlzLmdyb3VwTm9kZXMuc3BsaWNlKGluZGV4LCAwLCBhTmV3R3JvdXBOb2RlKTtcclxuXHJcbiAgICBpZihpbmRleD09MCl7XHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKGFOZXdHcm91cE5vZGUuaGVhZGVyRE9NKVxyXG4gICAgICAgIHRoaXMuRE9NLmFwcGVuZChhTmV3R3JvdXBOb2RlLmxpc3RET00pXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB2YXIgcHJldkdyb3VwTm9kZT10aGlzLmdyb3VwTm9kZXNbaW5kZXgtMV1cclxuICAgICAgICBhTmV3R3JvdXBOb2RlLmhlYWRlckRPTS5pbnNlcnRBZnRlcihwcmV2R3JvdXBOb2RlLmxpc3RET00pXHJcbiAgICAgICAgYU5ld0dyb3VwTm9kZS5saXN0RE9NLmluc2VydEFmdGVyKGFOZXdHcm91cE5vZGUuaGVhZGVyRE9NKVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBhTmV3R3JvdXBOb2RlO1xyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5hZGRHcm91cE5vZGU9ZnVuY3Rpb24ob2JqKXtcclxuICAgIHZhciBhTmV3R3JvdXBOb2RlID0gbmV3IHNpbXBsZVRyZWVHcm91cE5vZGUodGhpcyxvYmopXHJcbiAgICB2YXIgZXhpc3RHcm91cE5vZGU9IHRoaXMuZmluZEdyb3VwTm9kZShhTmV3R3JvdXBOb2RlLm5hbWUpXHJcbiAgICBpZihleGlzdEdyb3VwTm9kZSE9bnVsbCkgcmV0dXJuO1xyXG4gICAgdGhpcy5ncm91cE5vZGVzLnB1c2goYU5ld0dyb3VwTm9kZSk7XHJcbiAgICB0aGlzLkRPTS5hcHBlbmQoYU5ld0dyb3VwTm9kZS5oZWFkZXJET00pXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQoYU5ld0dyb3VwTm9kZS5saXN0RE9NKVxyXG4gICAgcmV0dXJuIGFOZXdHcm91cE5vZGU7XHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLnNlbGVjdExlYWZOb2RlPWZ1bmN0aW9uKGxlYWZOb2RlLG1vdXNlQ2xpY2tEZXRhaWwpe1xyXG4gICAgdGhpcy5zZWxlY3RMZWFmTm9kZUFycihbbGVhZk5vZGVdLG1vdXNlQ2xpY2tEZXRhaWwpXHJcbn1cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuYXBwZW5kTGVhZk5vZGVUb1NlbGVjdGlvbj1mdW5jdGlvbihsZWFmTm9kZSl7XHJcbiAgICB2YXIgbmV3QXJyPVtdLmNvbmNhdCh0aGlzLnNlbGVjdGVkTm9kZXMpXHJcbiAgICBuZXdBcnIucHVzaChsZWFmTm9kZSlcclxuICAgIHRoaXMuc2VsZWN0TGVhZk5vZGVBcnIobmV3QXJyKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5zZWxlY3RHcm91cE5vZGU9ZnVuY3Rpb24oZ3JvdXBOb2RlKXtcclxuICAgIGlmKHRoaXMuY2FsbGJhY2tfYWZ0ZXJTZWxlY3RHcm91cE5vZGUpIHRoaXMuY2FsbGJhY2tfYWZ0ZXJTZWxlY3RHcm91cE5vZGUoZ3JvdXBOb2RlLmluZm8pXHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLnNlbGVjdExlYWZOb2RlQXJyPWZ1bmN0aW9uKGxlYWZOb2RlQXJyLG1vdXNlQ2xpY2tEZXRhaWwpe1xyXG4gICAgZm9yKHZhciBpPTA7aTx0aGlzLnNlbGVjdGVkTm9kZXMubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdGhpcy5zZWxlY3RlZE5vZGVzW2ldLmRpbSgpXHJcbiAgICB9XHJcbiAgICB0aGlzLnNlbGVjdGVkTm9kZXMubGVuZ3RoPTA7XHJcbiAgICB0aGlzLnNlbGVjdGVkTm9kZXM9dGhpcy5zZWxlY3RlZE5vZGVzLmNvbmNhdChsZWFmTm9kZUFycilcclxuICAgIGZvcih2YXIgaT0wO2k8dGhpcy5zZWxlY3RlZE5vZGVzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHRoaXMuc2VsZWN0ZWROb2Rlc1tpXS5oaWdobGlnaHQoKVxyXG4gICAgfVxyXG5cclxuICAgIGlmKHRoaXMuY2FsbGJhY2tfYWZ0ZXJTZWxlY3ROb2RlcykgdGhpcy5jYWxsYmFja19hZnRlclNlbGVjdE5vZGVzKHRoaXMuc2VsZWN0ZWROb2Rlcyxtb3VzZUNsaWNrRGV0YWlsKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5kYmxDbGlja05vZGU9ZnVuY3Rpb24odGhlTm9kZSl7XHJcbiAgICBpZih0aGlzLmNhbGxiYWNrX2FmdGVyRGJsY2xpY2tOb2RlKSB0aGlzLmNhbGxiYWNrX2FmdGVyRGJsY2xpY2tOb2RlKHRoZU5vZGUpXHJcbn1cclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLXRyZWUgZ3JvdXAgbm9kZS0tLS0tLS0tLS0tLS0tLVxyXG5mdW5jdGlvbiBzaW1wbGVUcmVlR3JvdXBOb2RlKHBhcmVudFRyZWUsb2JqKXtcclxuICAgIHRoaXMucGFyZW50VHJlZT1wYXJlbnRUcmVlXHJcbiAgICB0aGlzLmluZm89b2JqXHJcbiAgICB0aGlzLmNoaWxkTGVhZk5vZGVzPVtdIC8vaXQncyBjaGlsZCBsZWFmIG5vZGVzIGFycmF5XHJcbiAgICB0aGlzLm5hbWU9b2JqLmRpc3BsYXlOYW1lO1xyXG4gICAgdGhpcy5jcmVhdGVET00oKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5yZWZyZXNoTmFtZT1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5oZWFkZXJET00udGV4dCh0aGlzLm5hbWUrXCIoXCIrdGhpcy5jaGlsZExlYWZOb2Rlcy5sZW5ndGgrXCIpXCIpXHJcbiAgICBpZih0aGlzLmNoaWxkTGVhZk5vZGVzLmxlbmd0aD4wKSB0aGlzLmhlYWRlckRPTS5jc3MoXCJmb250LXdlaWdodFwiLFwiYm9sZFwiKVxyXG4gICAgZWxzZSB0aGlzLmhlYWRlckRPTS5jc3MoXCJmb250LXdlaWdodFwiLFwibm9ybWFsXCIpXHJcblxyXG59XHJcblxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5kZWxldGVTZWxmID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5oZWFkZXJET00ucmVtb3ZlKClcclxuICAgIHRoaXMubGlzdERPTS5yZW1vdmUoKVxyXG4gICAgdmFyIHBhcmVudEFyciA9IHRoaXMucGFyZW50VHJlZS5ncm91cE5vZGVzXHJcbiAgICBjb25zdCBpbmRleCA9IHBhcmVudEFyci5pbmRleE9mKHRoaXMpO1xyXG4gICAgaWYgKGluZGV4ID4gLTEpIHBhcmVudEFyci5zcGxpY2UoaW5kZXgsIDEpO1xyXG59XHJcblxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5jcmVhdGVET009ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuaGVhZGVyRE9NPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYmxvY2sgdzMtbGlnaHQtZ3JleSB3My1sZWZ0LWFsaWduXCI+PC9idXR0b24+JylcclxuICAgIHRoaXMucmVmcmVzaE5hbWUoKVxyXG4gICAgdGhpcy5saXN0RE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1jb250YWluZXIgdzMtaGlkZSB3My1ib3JkZXJcIj48L2Rpdj4nKVxyXG5cclxuICAgIHRoaXMuaGVhZGVyRE9NLm9uKFwiY2xpY2tcIiwoZXZ0KT0+IHtcclxuICAgICAgICBpZih0aGlzLmxpc3RET00uaGFzQ2xhc3MoXCJ3My1zaG93XCIpKSB0aGlzLmxpc3RET00ucmVtb3ZlQ2xhc3MoXCJ3My1zaG93XCIpXHJcbiAgICAgICAgZWxzZSB0aGlzLmxpc3RET00uYWRkQ2xhc3MoXCJ3My1zaG93XCIpXHJcblxyXG4gICAgICAgIHRoaXMucGFyZW50VHJlZS5zZWxlY3RHcm91cE5vZGUodGhpcykgICAgXHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbn1cclxuXHJcbnNpbXBsZVRyZWVHcm91cE5vZGUucHJvdG90eXBlLmlzT3Blbj1mdW5jdGlvbigpe1xyXG4gICAgcmV0dXJuICB0aGlzLmxpc3RET00uaGFzQ2xhc3MoXCJ3My1zaG93XCIpXHJcbn1cclxuXHJcblxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5leHBhbmQ9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMubGlzdERPTS5hZGRDbGFzcyhcInczLXNob3dcIilcclxufVxyXG5cclxuc2ltcGxlVHJlZUdyb3VwTm9kZS5wcm90b3R5cGUuc2hyaW5rPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLmxpc3RET00ucmVtb3ZlQ2xhc3MoXCJ3My1zaG93XCIpXHJcbn1cclxuXHJcblxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5hZGROb2RlPWZ1bmN0aW9uKG9iaixza2lwUmVwZWF0KXtcclxuICAgIGlmKHNraXBSZXBlYXQpe1xyXG4gICAgICAgIHZhciBmb3VuZFJlcGVhdD1mYWxzZTtcclxuICAgICAgICB0aGlzLmNoaWxkTGVhZk5vZGVzLmZvckVhY2goYU5vZGU9PntcclxuICAgICAgICAgICAgaWYoYU5vZGUubmFtZT09b2JqW1wiJGR0SWRcIl0pIHtcclxuICAgICAgICAgICAgICAgIGZvdW5kUmVwZWF0PXRydWVcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgaWYoZm91bmRSZXBlYXQpIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgYU5ld05vZGUgPSBuZXcgc2ltcGxlVHJlZUxlYWZOb2RlKHRoaXMsb2JqKVxyXG4gICAgdGhpcy5jaGlsZExlYWZOb2Rlcy5wdXNoKGFOZXdOb2RlKVxyXG4gICAgdGhpcy5yZWZyZXNoTmFtZSgpXHJcbiAgICB0aGlzLmxpc3RET00uYXBwZW5kKGFOZXdOb2RlLkRPTSlcclxufVxyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tdHJlZSBsZWFmIG5vZGUtLS0tLS0tLS0tLS0tLS0tLS1cclxuZnVuY3Rpb24gc2ltcGxlVHJlZUxlYWZOb2RlKHBhcmVudEdyb3VwTm9kZSxvYmope1xyXG4gICAgdGhpcy5wYXJlbnRHcm91cE5vZGU9cGFyZW50R3JvdXBOb2RlXHJcbiAgICB0aGlzLmxlYWZJbmZvPW9iajtcclxuICAgIHRoaXMubmFtZT10aGlzLmxlYWZJbmZvW1wiJGR0SWRcIl1cclxuICAgIHRoaXMuY3JlYXRlTGVhZk5vZGVET00oKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlTGVhZk5vZGUucHJvdG90eXBlLmRlbGV0ZVNlbGYgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLkRPTS5yZW1vdmUoKVxyXG4gICAgdmFyIGdOb2RlID0gdGhpcy5wYXJlbnRHcm91cE5vZGVcclxuICAgIGNvbnN0IGluZGV4ID0gZ05vZGUuY2hpbGRMZWFmTm9kZXMuaW5kZXhPZih0aGlzKTtcclxuICAgIGlmIChpbmRleCA+IC0xKSBnTm9kZS5jaGlsZExlYWZOb2Rlcy5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgZ05vZGUucmVmcmVzaE5hbWUoKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlTGVhZk5vZGUucHJvdG90eXBlLmNyZWF0ZUxlYWZOb2RlRE9NPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLkRPTT0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLXdoaXRlXCIgc3R5bGU9XCJkaXNwbGF5OmJsb2NrO3RleHQtYWxpZ246bGVmdDt3aWR0aDo5OCVcIj4nK3RoaXMubmFtZSsnPC9idXR0b24+JylcclxuICAgIHZhciBjbGlja0Y9KGUpPT57XHJcbiAgICAgICAgdGhpcy5oaWdobGlnaHQoKTtcclxuICAgICAgICB2YXIgY2xpY2tEZXRhaWw9ZS5kZXRhaWxcclxuICAgICAgICBpZiAoZS5jdHJsS2V5KSB7XHJcbiAgICAgICAgICAgIHRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUuYXBwZW5kTGVhZk5vZGVUb1NlbGVjdGlvbih0aGlzKVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICB0aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLnNlbGVjdExlYWZOb2RlKHRoaXMsZS5kZXRhaWwpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdGhpcy5ET00ub24oXCJjbGlja1wiLChlKT0+e2NsaWNrRihlKX0pXHJcblxyXG4gICAgdGhpcy5ET00ub24oXCJkYmxjbGlja1wiLChlKT0+e1xyXG4gICAgICAgIHRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUuZGJsQ2xpY2tOb2RlKHRoaXMpXHJcbiAgICB9KVxyXG59XHJcbnNpbXBsZVRyZWVMZWFmTm9kZS5wcm90b3R5cGUuaGlnaGxpZ2h0PWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLkRPTS5hZGRDbGFzcyhcInczLW9yYW5nZVwiKVxyXG4gICAgdGhpcy5ET00uYWRkQ2xhc3MoXCJ3My1ob3Zlci1hbWJlclwiKVxyXG4gICAgdGhpcy5ET00ucmVtb3ZlQ2xhc3MoXCJ3My13aGl0ZVwiKVxyXG59XHJcbnNpbXBsZVRyZWVMZWFmTm9kZS5wcm90b3R5cGUuZGltPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLkRPTS5yZW1vdmVDbGFzcyhcInczLW9yYW5nZVwiKVxyXG4gICAgdGhpcy5ET00ucmVtb3ZlQ2xhc3MoXCJ3My1ob3Zlci1hbWJlclwiKVxyXG4gICAgdGhpcy5ET00uYWRkQ2xhc3MoXCJ3My13aGl0ZVwiKVxyXG59XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBzaW1wbGVUcmVlOyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbmNvbnN0IG1vZGVsTWFuYWdlckRpYWxvZyA9IHJlcXVpcmUoXCIuL21vZGVsTWFuYWdlckRpYWxvZ1wiKTtcclxuY29uc3QgYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cgPSByZXF1aXJlKFwiLi9hZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZ1wiKTtcclxuY29uc3QgbW9kZWxBbmFseXplciA9IHJlcXVpcmUoXCIuL21vZGVsQW5hbHl6ZXJcIik7XHJcbmNvbnN0IGVkaXRMYXlvdXREaWFsb2cgPSByZXF1aXJlKFwiLi9lZGl0TGF5b3V0RGlhbG9nXCIpXHJcbmNvbnN0IGZvcm1hdHRlciA9IG5ldyBJbnRsLk51bWJlckZvcm1hdCgnZW4tVVMnLCB7XHJcbiAgICBtaW5pbXVtRnJhY3Rpb25EaWdpdHM6IDMsXHJcbiAgICBtYXhpbXVtRnJhY3Rpb25EaWdpdHM6IDMsXHJcbn0pO1xyXG5jb25zdCBzaW1wbGVTZWxlY3RNZW51ID0gcmVxdWlyZShcIi4vc2ltcGxlU2VsZWN0TWVudVwiKVxyXG5cclxuXHJcbmZ1bmN0aW9uIHRvcG9sb2d5RE9NKERPTSl7XHJcbiAgICB0aGlzLkRPTT1ET01cclxuICAgIHRoaXMuZGVmYXVsdE5vZGVTaXplPTMwXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5pbml0PWZ1bmN0aW9uKCl7XHJcbiAgICBjeXRvc2NhcGUud2FybmluZ3MoZmFsc2UpICBcclxuICAgIHRoaXMuY29yZSA9IGN5dG9zY2FwZSh7XHJcbiAgICAgICAgY29udGFpbmVyOiAgdGhpcy5ET01bMF0sIC8vIGNvbnRhaW5lciB0byByZW5kZXIgaW5cclxuXHJcbiAgICAgICAgLy8gaW5pdGlhbCB2aWV3cG9ydCBzdGF0ZTpcclxuICAgICAgICB6b29tOiAxLFxyXG4gICAgICAgIHBhbjogeyB4OiAwLCB5OiAwIH0sXHJcblxyXG4gICAgICAgIC8vIGludGVyYWN0aW9uIG9wdGlvbnM6XHJcbiAgICAgICAgbWluWm9vbTogMC4xLFxyXG4gICAgICAgIG1heFpvb206IDEwLFxyXG4gICAgICAgIHpvb21pbmdFbmFibGVkOiB0cnVlLFxyXG4gICAgICAgIHVzZXJab29taW5nRW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICBwYW5uaW5nRW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICB1c2VyUGFubmluZ0VuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgYm94U2VsZWN0aW9uRW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICBzZWxlY3Rpb25UeXBlOiAnc2luZ2xlJyxcclxuICAgICAgICB0b3VjaFRhcFRocmVzaG9sZDogOCxcclxuICAgICAgICBkZXNrdG9wVGFwVGhyZXNob2xkOiA0LFxyXG4gICAgICAgIGF1dG9sb2NrOiBmYWxzZSxcclxuICAgICAgICBhdXRvdW5ncmFiaWZ5OiBmYWxzZSxcclxuICAgICAgICBhdXRvdW5zZWxlY3RpZnk6IGZhbHNlLFxyXG5cclxuICAgICAgICAvLyByZW5kZXJpbmcgb3B0aW9uczpcclxuICAgICAgICBoZWFkbGVzczogZmFsc2UsXHJcbiAgICAgICAgc3R5bGVFbmFibGVkOiB0cnVlLFxyXG4gICAgICAgIGhpZGVFZGdlc09uVmlld3BvcnQ6IGZhbHNlLFxyXG4gICAgICAgIHRleHR1cmVPblZpZXdwb3J0OiBmYWxzZSxcclxuICAgICAgICBtb3Rpb25CbHVyOiBmYWxzZSxcclxuICAgICAgICBtb3Rpb25CbHVyT3BhY2l0eTogMC4yLFxyXG4gICAgICAgIHdoZWVsU2Vuc2l0aXZpdHk6IDAuMyxcclxuICAgICAgICBwaXhlbFJhdGlvOiAnYXV0bycsXHJcblxyXG4gICAgICAgIGVsZW1lbnRzOiBbXSwgLy8gbGlzdCBvZiBncmFwaCBlbGVtZW50cyB0byBzdGFydCB3aXRoXHJcblxyXG4gICAgICAgIHN0eWxlOiBbIC8vIHRoZSBzdHlsZXNoZWV0IGZvciB0aGUgZ3JhcGhcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgc2VsZWN0b3I6ICdub2RlJyxcclxuICAgICAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJ3aWR0aFwiOnRoaXMuZGVmYXVsdE5vZGVTaXplLFwiaGVpZ2h0XCI6dGhpcy5kZWZhdWx0Tm9kZVNpemUsXHJcbiAgICAgICAgICAgICAgICAgICAgJ2xhYmVsJzogJ2RhdGEoaWQpJyxcclxuICAgICAgICAgICAgICAgICAgICAnb3BhY2l0eSc6MC45LFxyXG4gICAgICAgICAgICAgICAgICAgICdmb250LXNpemUnOlwiMTJweFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICdmb250LWZhbWlseSc6J0dlbmV2YSwgQXJpYWwsIEhlbHZldGljYSwgc2Fucy1zZXJpZidcclxuICAgICAgICAgICAgICAgICAgICAvLywnYmFja2dyb3VuZC1pbWFnZSc6IGZ1bmN0aW9uKGVsZSl7IHJldHVybiBcImltYWdlcy9jYXQucG5nXCI7IH1cclxuICAgICAgICAgICAgICAgICAgICAsJ2JhY2tncm91bmQtZml0JzonY29udGFpbicgLy9jb3ZlclxyXG4gICAgICAgICAgICAgICAgICAgIC8vJ2JhY2tncm91bmQtY29sb3InOiBmdW5jdGlvbiggZWxlICl7IHJldHVybiBlbGUuZGF0YSgnYmcnKSB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGVjdG9yOiAnZWRnZScsXHJcbiAgICAgICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgICd3aWR0aCc6MixcclxuICAgICAgICAgICAgICAgICAgICAnbGluZS1jb2xvcic6ICcjODg4JyxcclxuICAgICAgICAgICAgICAgICAgICAndGFyZ2V0LWFycm93LWNvbG9yJzogJyM1NTUnLFxyXG4gICAgICAgICAgICAgICAgICAgICd0YXJnZXQtYXJyb3ctc2hhcGUnOiAndHJpYW5nbGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICdjdXJ2ZS1zdHlsZSc6ICdiZXppZXInLFxyXG4gICAgICAgICAgICAgICAgICAgICdhcnJvdy1zY2FsZSc6MC42XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtzZWxlY3RvcjogJ2VkZ2U6c2VsZWN0ZWQnLFxyXG4gICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzogMyxcclxuICAgICAgICAgICAgICAgICdsaW5lLWNvbG9yJzogJ3JlZCcsXHJcbiAgICAgICAgICAgICAgICAndGFyZ2V0LWFycm93LWNvbG9yJzogJ3JlZCcsXHJcbiAgICAgICAgICAgICAgICAnc291cmNlLWFycm93LWNvbG9yJzogJ3JlZCdcclxuICAgICAgICAgICAgfX0sXHJcbiAgICAgICAgICAgIHtzZWxlY3RvcjogJ25vZGU6c2VsZWN0ZWQnLFxyXG4gICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgJ2JvcmRlci1jb2xvcic6XCJyZWRcIixcclxuICAgICAgICAgICAgICAgICdib3JkZXItd2lkdGgnOjIsXHJcbiAgICAgICAgICAgICAgICAnYmFja2dyb3VuZC1jb2xvcic6ICdHcmF5J1xyXG4gICAgICAgICAgICB9fVxyXG4gICAgICAgICAgICBcclxuICAgICAgICBdXHJcbiAgICB9KTtcclxuXHJcbiAgICAvL2N5dG9zY2FwZSBlZGdlIGVkaXRpbmcgcGx1Zy1pblxyXG4gICAgdGhpcy5jb3JlLmVkZ2VFZGl0aW5nKHtcclxuICAgICAgICB1bmRvYWJsZTogdHJ1ZSxcclxuICAgICAgICBiZW5kUmVtb3ZhbFNlbnNpdGl2aXR5OiAxNixcclxuICAgICAgICBlbmFibGVNdWx0aXBsZUFuY2hvclJlbW92YWxPcHRpb246IHRydWUsXHJcbiAgICAgICAgc3RpY2t5QW5jaG9yVG9sZXJlbmNlOiAyMCxcclxuICAgICAgICBhbmNob3JTaGFwZVNpemVGYWN0b3I6IDUsXHJcbiAgICAgICAgZW5hYmxlQW5jaG9yU2l6ZU5vdEltcGFjdEJ5Wm9vbTp0cnVlLFxyXG4gICAgICAgIGVuYWJsZVJlbW92ZUFuY2hvck1pZE9mTmVhckxpbmU6ZmFsc2UsXHJcbiAgICAgICAgZW5hYmxlQ3JlYXRlQW5jaG9yT25EcmFnOmZhbHNlXHJcbiAgICB9KTtcclxuXHJcbiAgICBcclxuICAgIHRoaXMuY29yZS5ib3hTZWxlY3Rpb25FbmFibGVkKHRydWUpXHJcblxyXG5cclxuICAgIHRoaXMuY29yZS5vbigndGFwc2VsZWN0JywgKCk9Pnt0aGlzLnNlbGVjdEZ1bmN0aW9uKCl9KTtcclxuICAgIHRoaXMuY29yZS5vbigndGFwdW5zZWxlY3QnLCAoKT0+e3RoaXMuc2VsZWN0RnVuY3Rpb24oKX0pO1xyXG5cclxuICAgIHRoaXMuY29yZS5vbignYm94ZW5kJywoZSk9PnsvL3B1dCBpbnNpZGUgYm94ZW5kIGV2ZW50IHRvIHRyaWdnZXIgb25seSBvbmUgdGltZSwgYW5kIHJlcGxlYXRseSBhZnRlciBlYWNoIGJveCBzZWxlY3RcclxuICAgICAgICB0aGlzLmNvcmUub25lKCdib3hzZWxlY3QnLCgpPT57dGhpcy5zZWxlY3RGdW5jdGlvbigpfSlcclxuICAgIH0pXHJcblxyXG4gICAgdGhpcy5jb3JlLm9uKCdjeHR0YXAnLChlKT0+e1xyXG4gICAgICAgIHRoaXMuY2FuY2VsVGFyZ2V0Tm9kZU1vZGUoKVxyXG4gICAgfSlcclxuICAgIFxyXG4gICAgdGhpcy5jb3JlLm9uKCd6b29tJywoZSk9PntcclxuICAgICAgICB2YXIgZnM9dGhpcy5nZXRGb250U2l6ZUluQ3VycmVudFpvb20oKTtcclxuICAgICAgICB2YXIgZGltZW5zaW9uPXRoaXMuZ2V0Tm9kZVNpemVJbkN1cnJlbnRab29tKCk7XHJcbiAgICAgICAgdGhpcy5jb3JlLnN0eWxlKClcclxuICAgICAgICAgICAgICAgIC5zZWxlY3Rvcignbm9kZScpXHJcbiAgICAgICAgICAgICAgICAuc3R5bGUoeyAnZm9udC1zaXplJzogZnMsIHdpZHRoOmRpbWVuc2lvbiAsaGVpZ2h0OmRpbWVuc2lvbiB9KVxyXG4gICAgICAgICAgICAgICAgLnVwZGF0ZSgpXHJcbiAgICB9KVxyXG5cclxuICAgIHZhciBpbnN0YW5jZSA9IHRoaXMuY29yZS5lZGdlRWRpdGluZygnZ2V0Jyk7XHJcbiAgICB2YXIgdGFwZHJhZ0hhbmRsZXI9KGUpID0+IHtcclxuICAgICAgICBpbnN0YW5jZS5rZWVwQW5jaG9yc0Fic29sdXRlUG9zaXRpb25EdXJpbmdNb3ZpbmcoKVxyXG4gICAgICAgIGlmKGUudGFyZ2V0LmlzTm9kZSAmJiBlLnRhcmdldC5pc05vZGUoKSkgdGhpcy5kcmFnZ2luZ05vZGU9ZS50YXJnZXRcclxuICAgICAgICB0aGlzLnNtYXJ0UG9zaXRpb25Ob2RlKGUucG9zaXRpb24pXHJcbiAgICB9XHJcbiAgICB2YXIgc2V0T25lVGltZUdyYWIgPSAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5jb3JlLm9uY2UoXCJncmFiXCIsIChlKSA9PiB7XHJcbiAgICAgICAgICAgIHZhciBkcmFnZ2luZ05vZGVzID0gdGhpcy5jb3JlLmNvbGxlY3Rpb24oKVxyXG4gICAgICAgICAgICBpZiAoZS50YXJnZXQuaXNOb2RlKCkpIGRyYWdnaW5nTm9kZXMubWVyZ2UoZS50YXJnZXQpXHJcbiAgICAgICAgICAgIHZhciBhcnIgPSB0aGlzLmNvcmUuJChcIjpzZWxlY3RlZFwiKVxyXG4gICAgICAgICAgICBhcnIuZm9yRWFjaCgoZWxlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZWxlLmlzTm9kZSgpKSBkcmFnZ2luZ05vZGVzLm1lcmdlKGVsZSlcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgaW5zdGFuY2Uuc3RvcmVBbmNob3JzQWJzb2x1dGVQb3NpdGlvbihkcmFnZ2luZ05vZGVzKVxyXG4gICAgICAgICAgICB0aGlzLmNvcmUub24oXCJ0YXBkcmFnXCIsdGFwZHJhZ0hhbmRsZXIgKVxyXG4gICAgICAgICAgICBzZXRPbmVUaW1lRnJlZSgpXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuICAgIHZhciBzZXRPbmVUaW1lRnJlZSA9ICgpID0+IHtcclxuICAgICAgICB0aGlzLmNvcmUub25jZShcImZyZWVcIiwgKGUpID0+IHtcclxuICAgICAgICAgICAgdmFyIGluc3RhbmNlID0gdGhpcy5jb3JlLmVkZ2VFZGl0aW5nKCdnZXQnKTtcclxuICAgICAgICAgICAgaW5zdGFuY2UucmVzZXRBbmNob3JzQWJzb2x1dGVQb3NpdGlvbigpXHJcbiAgICAgICAgICAgIHRoaXMuZHJhZ2dpbmdOb2RlPW51bGxcclxuICAgICAgICAgICAgc2V0T25lVGltZUdyYWIoKVxyXG4gICAgICAgICAgICB0aGlzLmNvcmUucmVtb3ZlTGlzdGVuZXIoXCJ0YXBkcmFnXCIsdGFwZHJhZ0hhbmRsZXIpXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuICAgIHNldE9uZVRpbWVHcmFiKClcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnNtYXJ0UG9zaXRpb25Ob2RlID0gZnVuY3Rpb24gKG1vdXNlUG9zaXRpb24pIHtcclxuICAgIHZhciB6b29tTGV2ZWw9dGhpcy5jb3JlLnpvb20oKVxyXG4gICAgaWYoIXRoaXMuZHJhZ2dpbmdOb2RlKSByZXR1cm5cclxuICAgIC8vY29tcGFyaW5nIG5vZGVzIHNldDogaXRzIGNvbm5lY3Rmcm9tIG5vZGVzIGFuZCB0aGVpciBjb25uZWN0dG8gbm9kZXMsIGl0cyBjb25uZWN0dG8gbm9kZXMgYW5kIHRoZWlyIGNvbm5lY3Rmcm9tIG5vZGVzXHJcbiAgICB2YXIgaW5jb21lcnM9dGhpcy5kcmFnZ2luZ05vZGUuaW5jb21lcnMoKVxyXG4gICAgdmFyIG91dGVyRnJvbUluY29tPSBpbmNvbWVycy5vdXRnb2VycygpXHJcbiAgICB2YXIgb3V0ZXI9dGhpcy5kcmFnZ2luZ05vZGUub3V0Z29lcnMoKVxyXG4gICAgdmFyIGluY29tRnJvbU91dGVyPW91dGVyLmluY29tZXJzKClcclxuICAgIHZhciBtb25pdG9yU2V0PWluY29tZXJzLnVuaW9uKG91dGVyRnJvbUluY29tKS51bmlvbihvdXRlcikudW5pb24oaW5jb21Gcm9tT3V0ZXIpLmZpbHRlcignbm9kZScpLnVubWVyZ2UodGhpcy5kcmFnZ2luZ05vZGUpXHJcblxyXG4gICAgdmFyIHJldHVybkV4cGVjdGVkUG9zPShkaWZmQXJyLHBvc0Fycik9PntcclxuICAgICAgICB2YXIgbWluRGlzdGFuY2U9TWF0aC5taW4oLi4uZGlmZkFycilcclxuICAgICAgICBpZihtaW5EaXN0YW5jZSp6b29tTGV2ZWwgPCAxMCkgIHJldHVybiBwb3NBcnJbZGlmZkFyci5pbmRleE9mKG1pbkRpc3RhbmNlKV1cclxuICAgICAgICBlbHNlIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciB4RGlmZj1bXVxyXG4gICAgdmFyIHhQb3M9W11cclxuICAgIHZhciB5RGlmZj1bXVxyXG4gICAgdmFyIHlQb3M9W11cclxuICAgIG1vbml0b3JTZXQuZm9yRWFjaCgoZWxlKT0+e1xyXG4gICAgICAgIHhEaWZmLnB1c2goTWF0aC5hYnMoZWxlLnBvc2l0aW9uKCkueC1tb3VzZVBvc2l0aW9uLngpKVxyXG4gICAgICAgIHhQb3MucHVzaChlbGUucG9zaXRpb24oKS54KVxyXG4gICAgICAgIHlEaWZmLnB1c2goTWF0aC5hYnMoZWxlLnBvc2l0aW9uKCkueS1tb3VzZVBvc2l0aW9uLnkpKVxyXG4gICAgICAgIHlQb3MucHVzaChlbGUucG9zaXRpb24oKS55KVxyXG4gICAgfSlcclxuICAgIHZhciBwcmVmWD1yZXR1cm5FeHBlY3RlZFBvcyh4RGlmZix4UG9zKVxyXG4gICAgdmFyIHByZWZZPXJldHVybkV4cGVjdGVkUG9zKHlEaWZmLHlQb3MpXHJcbiAgICBpZihwcmVmWCE9bnVsbCkge1xyXG4gICAgICAgIHRoaXMuZHJhZ2dpbmdOb2RlLnBvc2l0aW9uKCd4JywgcHJlZlgpO1xyXG4gICAgfVxyXG4gICAgaWYocHJlZlkhPW51bGwpIHtcclxuICAgICAgICB0aGlzLmRyYWdnaW5nTm9kZS5wb3NpdGlvbigneScsIHByZWZZKTtcclxuICAgIH1cclxuICAgIC8vY29uc29sZS5sb2coXCItLS0tXCIpXHJcbiAgICAvL21vbml0b3JTZXQuZm9yRWFjaCgoZWxlKT0+e2NvbnNvbGUubG9nKGVsZS5pZCgpKX0pXHJcbiAgICAvL2NvbnNvbGUubG9nKG1vbml0b3JTZXQuc2l6ZSgpKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuc2VsZWN0RnVuY3Rpb24gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgYXJyID0gdGhpcy5jb3JlLiQoXCI6c2VsZWN0ZWRcIilcclxuICAgIGlmIChhcnIubGVuZ3RoID09IDApIHJldHVyblxyXG4gICAgdmFyIHJlID0gW11cclxuICAgIGFyci5mb3JFYWNoKChlbGUpID0+IHsgcmUucHVzaChlbGUuZGF0YSgpLm9yaWdpbmFsSW5mbykgfSlcclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInNlbGVjdE5vZGVzXCIsIGluZm86IHJlIH0pXHJcblxyXG4gICAgLy9mb3IgZGVidWdnaW5nIHB1cnBvc2VcclxuICAgIC8vYXJyLmZvckVhY2goKGVsZSk9PntcclxuICAgIC8vICBjb25zb2xlLmxvZyhcIlwiKVxyXG4gICAgLy99KVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuZ2V0Rm9udFNpemVJbkN1cnJlbnRab29tPWZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgY3VyWm9vbT10aGlzLmNvcmUuem9vbSgpXHJcbiAgICBpZihjdXJab29tPjEpe1xyXG4gICAgICAgIHZhciBtYXhGUz0xMlxyXG4gICAgICAgIHZhciBtaW5GUz01XHJcbiAgICAgICAgdmFyIHJhdGlvPSAobWF4RlMvbWluRlMtMSkvOSooY3VyWm9vbS0xKSsxXHJcbiAgICAgICAgdmFyIGZzPU1hdGguY2VpbChtYXhGUy9yYXRpbylcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHZhciBtYXhGUz0xMjBcclxuICAgICAgICB2YXIgbWluRlM9MTJcclxuICAgICAgICB2YXIgcmF0aW89IChtYXhGUy9taW5GUy0xKS85KigxL2N1clpvb20tMSkrMVxyXG4gICAgICAgIHZhciBmcz1NYXRoLmNlaWwobWluRlMqcmF0aW8pXHJcbiAgICB9XHJcbiAgICByZXR1cm4gZnM7XHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5nZXROb2RlU2l6ZUluQ3VycmVudFpvb209ZnVuY3Rpb24oKXtcclxuICAgIHZhciBjdXJab29tPXRoaXMuY29yZS56b29tKClcclxuICAgIGlmKGN1clpvb20+MSl7Ly9zY2FsZSB1cCBidXQgbm90IHRvbyBtdWNoXHJcbiAgICAgICAgdmFyIHJhdGlvPSAoY3VyWm9vbS0xKSooMi0xKS85KzFcclxuICAgICAgICByZXR1cm4gTWF0aC5jZWlsKHRoaXMuZGVmYXVsdE5vZGVTaXplL3JhdGlvKVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgdmFyIHJhdGlvPSAoMS9jdXJab29tLTEpKig0LTEpLzkrMVxyXG4gICAgICAgIHJldHVybiBNYXRoLmNlaWwodGhpcy5kZWZhdWx0Tm9kZVNpemUqcmF0aW8pXHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUudXBkYXRlTW9kZWxBdmFydGE9ZnVuY3Rpb24obW9kZWxJRCxkYXRhVXJsKXtcclxuICAgIHRyeXtcclxuICAgICAgICB0aGlzLmNvcmUuc3R5bGUoKSBcclxuICAgICAgICAuc2VsZWN0b3IoJ25vZGVbbW9kZWxJRCA9IFwiJyttb2RlbElEKydcIl0nKVxyXG4gICAgICAgIC5zdHlsZSh7J2JhY2tncm91bmQtaW1hZ2UnOiBkYXRhVXJsfSlcclxuICAgICAgICAudXBkYXRlKCkgICBcclxuICAgIH1jYXRjaChlKXtcclxuICAgICAgICBcclxuICAgIH1cclxuICAgIFxyXG59XHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS51cGRhdGVNb2RlbFR3aW5Db2xvcj1mdW5jdGlvbihtb2RlbElELGNvbG9yQ29kZSl7XHJcbiAgICB0aGlzLmNvcmUuc3R5bGUoKVxyXG4gICAgICAgIC5zZWxlY3Rvcignbm9kZVttb2RlbElEID0gXCInK21vZGVsSUQrJ1wiXScpXHJcbiAgICAgICAgLnN0eWxlKHsnYmFja2dyb3VuZC1jb2xvcic6IGNvbG9yQ29kZX0pXHJcbiAgICAgICAgLnVwZGF0ZSgpICAgXHJcbn1cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnVwZGF0ZVJlbGF0aW9uc2hpcENvbG9yPWZ1bmN0aW9uKHNyY01vZGVsSUQscmVsYXRpb25zaGlwTmFtZSxjb2xvckNvZGUpe1xyXG4gICAgdGhpcy5jb3JlLnN0eWxlKClcclxuICAgICAgICAuc2VsZWN0b3IoJ2VkZ2Vbc291cmNlTW9kZWwgPSBcIicrc3JjTW9kZWxJRCsnXCJdW3JlbGF0aW9uc2hpcE5hbWUgPSBcIicrcmVsYXRpb25zaGlwTmFtZSsnXCJdJylcclxuICAgICAgICAuc3R5bGUoeydsaW5lLWNvbG9yJzogY29sb3JDb2RlfSlcclxuICAgICAgICAudXBkYXRlKCkgICBcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmRlbGV0ZVJlbGF0aW9ucz1mdW5jdGlvbihyZWxhdGlvbnMpe1xyXG4gICAgcmVsYXRpb25zLmZvckVhY2gob25lUmVsYXRpb249PntcclxuICAgICAgICB2YXIgc3JjSUQ9b25lUmVsYXRpb25bXCJzcmNJRFwiXVxyXG4gICAgICAgIHZhciByZWxhdGlvbklEPW9uZVJlbGF0aW9uW1wicmVsSURcIl1cclxuICAgICAgICB2YXIgdGhlTm9kZT10aGlzLmNvcmUuZmlsdGVyKCdbaWQgPSBcIicrc3JjSUQrJ1wiXScpO1xyXG4gICAgICAgIHZhciBlZGdlcz10aGVOb2RlLmNvbm5lY3RlZEVkZ2VzKCkudG9BcnJheSgpXHJcbiAgICAgICAgZm9yKHZhciBpPTA7aTxlZGdlcy5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgdmFyIGFuRWRnZT1lZGdlc1tpXVxyXG4gICAgICAgICAgICBpZihhbkVkZ2UuZGF0YShcIm9yaWdpbmFsSW5mb1wiKVtcIiRyZWxhdGlvbnNoaXBJZFwiXT09cmVsYXRpb25JRCl7XHJcbiAgICAgICAgICAgICAgICBhbkVkZ2UucmVtb3ZlKClcclxuICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KSAgIFxyXG59XHJcblxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmRlbGV0ZVR3aW5zPWZ1bmN0aW9uKHR3aW5JREFycil7XHJcbiAgICB0d2luSURBcnIuZm9yRWFjaCh0d2luSUQ9PntcclxuICAgICAgICB0aGlzLmNvcmUuJCgnW2lkID0gXCInK3R3aW5JRCsnXCJdJykucmVtb3ZlKClcclxuICAgIH0pICAgXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5hbmltYXRlQU5vZGU9ZnVuY3Rpb24odHdpbil7XHJcbiAgICB2YXIgY3VyRGltZW5zaW9uPSB0aGlzLmdldE5vZGVTaXplSW5DdXJyZW50Wm9vbSgpXHJcbiAgICB0d2luLmFuaW1hdGUoe1xyXG4gICAgICAgIHN0eWxlOiB7ICdoZWlnaHQnOiBjdXJEaW1lbnNpb24qMiwnd2lkdGgnOiBjdXJEaW1lbnNpb24qMiB9LFxyXG4gICAgICAgIGR1cmF0aW9uOiAyMDBcclxuICAgIH0pO1xyXG5cclxuICAgIHNldFRpbWVvdXQoKCk9PntcclxuICAgICAgICB0d2luLmFuaW1hdGUoe1xyXG4gICAgICAgICAgICBzdHlsZTogeyAnaGVpZ2h0JzogY3VyRGltZW5zaW9uLCd3aWR0aCc6IGN1ckRpbWVuc2lvbiB9LFxyXG4gICAgICAgICAgICBkdXJhdGlvbjogMjAwXHJcbiAgICAgICAgICAgICxjb21wbGV0ZTooKT0+e1xyXG4gICAgICAgICAgICAgICAgdHdpbi5yZW1vdmVTdHlsZSgpIC8vbXVzdCByZW1vdmUgdGhlIHN0eWxlIGFmdGVyIGFuaW1hdGlvbiwgb3RoZXJ3aXNlIHRoZXkgd2lsbCBoYXZlIHRoZWlyIG93biBzdHlsZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9LDIwMClcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmRyYXdUd2lucz1mdW5jdGlvbih0d2luc0RhdGEsYW5pbWF0aW9uKXtcclxuICAgIHZhciBhcnI9W11cclxuICAgIGZvcih2YXIgaT0wO2k8dHdpbnNEYXRhLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBvcmlnaW5hbEluZm89dHdpbnNEYXRhW2ldO1xyXG4gICAgICAgIHZhciBuZXdOb2RlPXtkYXRhOnt9LGdyb3VwOlwibm9kZXNcIn1cclxuICAgICAgICBuZXdOb2RlLmRhdGFbXCJvcmlnaW5hbEluZm9cIl09IG9yaWdpbmFsSW5mbztcclxuICAgICAgICBuZXdOb2RlLmRhdGFbXCJpZFwiXT1vcmlnaW5hbEluZm9bJyRkdElkJ11cclxuICAgICAgICB2YXIgbW9kZWxJRD1vcmlnaW5hbEluZm9bJyRtZXRhZGF0YSddWyckbW9kZWwnXVxyXG4gICAgICAgIG5ld05vZGUuZGF0YVtcIm1vZGVsSURcIl09bW9kZWxJRFxyXG4gICAgICAgIGFyci5wdXNoKG5ld05vZGUpXHJcbiAgICB9XHJcbiAgICB2YXIgZWxlcyA9IHRoaXMuY29yZS5hZGQoYXJyKVxyXG4gICAgaWYoZWxlcy5zaXplKCk9PTApIHJldHVybiBlbGVzXHJcbiAgICB0aGlzLm5vUG9zaXRpb25fZ3JpZChlbGVzKVxyXG4gICAgaWYoYW5pbWF0aW9uKXtcclxuICAgICAgICBlbGVzLmZvckVhY2goKGVsZSk9PnsgdGhpcy5hbmltYXRlQU5vZGUoZWxlKSB9KVxyXG4gICAgfVxyXG5cclxuICAgIC8vaWYgdGhlcmUgaXMgY3VycmVudGx5IGEgbGF5b3V0IHRoZXJlLCBhcHBseSBpdFxyXG4gICAgdGhpcy5hcHBseU5ld0xheW91dCgpXHJcblxyXG4gICAgcmV0dXJuIGVsZXNcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmRyYXdSZWxhdGlvbnM9ZnVuY3Rpb24ocmVsYXRpb25zRGF0YSl7XHJcbiAgICB2YXIgcmVsYXRpb25JbmZvQXJyPVtdXHJcbiAgICBmb3IodmFyIGk9MDtpPHJlbGF0aW9uc0RhdGEubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIG9yaWdpbmFsSW5mbz1yZWxhdGlvbnNEYXRhW2ldO1xyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciB0aGVJRD1vcmlnaW5hbEluZm9bJyRyZWxhdGlvbnNoaXBOYW1lJ10rXCJfXCIrb3JpZ2luYWxJbmZvWyckcmVsYXRpb25zaGlwSWQnXVxyXG4gICAgICAgIHZhciBhUmVsYXRpb249e2RhdGE6e30sZ3JvdXA6XCJlZGdlc1wifVxyXG4gICAgICAgIGFSZWxhdGlvbi5kYXRhW1wib3JpZ2luYWxJbmZvXCJdPW9yaWdpbmFsSW5mb1xyXG4gICAgICAgIGFSZWxhdGlvbi5kYXRhW1wiaWRcIl09dGhlSURcclxuICAgICAgICBhUmVsYXRpb24uZGF0YVtcInNvdXJjZVwiXT1vcmlnaW5hbEluZm9bJyRzb3VyY2VJZCddXHJcbiAgICAgICAgYVJlbGF0aW9uLmRhdGFbXCJ0YXJnZXRcIl09b3JpZ2luYWxJbmZvWyckdGFyZ2V0SWQnXVxyXG4gICAgICAgIGlmKHRoaXMuY29yZS4kKFwiI1wiK2FSZWxhdGlvbi5kYXRhW1wic291cmNlXCJdKS5sZW5ndGg9PTAgfHwgdGhpcy5jb3JlLiQoXCIjXCIrYVJlbGF0aW9uLmRhdGFbXCJ0YXJnZXRcIl0pLmxlbmd0aD09MCkgY29udGludWVcclxuICAgICAgICB2YXIgc291cmNlTm9kZT10aGlzLmNvcmUuJChcIiNcIithUmVsYXRpb24uZGF0YVtcInNvdXJjZVwiXSlcclxuICAgICAgICB2YXIgc291cmNlTW9kZWw9c291cmNlTm9kZVswXS5kYXRhKFwib3JpZ2luYWxJbmZvXCIpWyckbWV0YWRhdGEnXVsnJG1vZGVsJ11cclxuICAgICAgICBcclxuICAgICAgICAvL2FkZCBhZGRpdGlvbmFsIHNvdXJjZSBub2RlIGluZm9ybWF0aW9uIHRvIHRoZSBvcmlnaW5hbCByZWxhdGlvbnNoaXAgaW5mb3JtYXRpb25cclxuICAgICAgICBvcmlnaW5hbEluZm9bJ3NvdXJjZU1vZGVsJ109c291cmNlTW9kZWxcclxuICAgICAgICBhUmVsYXRpb24uZGF0YVtcInNvdXJjZU1vZGVsXCJdPXNvdXJjZU1vZGVsXHJcbiAgICAgICAgYVJlbGF0aW9uLmRhdGFbXCJyZWxhdGlvbnNoaXBOYW1lXCJdPW9yaWdpbmFsSW5mb1snJHJlbGF0aW9uc2hpcE5hbWUnXVxyXG5cclxuICAgICAgICB2YXIgZXhpc3RFZGdlPXRoaXMuY29yZS4kKCdlZGdlW2lkID0gXCInK3RoZUlEKydcIl0nKVxyXG4gICAgICAgIGlmKGV4aXN0RWRnZS5zaXplKCk+MCkge1xyXG4gICAgICAgICAgICBleGlzdEVkZ2UuZGF0YShcIm9yaWdpbmFsSW5mb1wiLG9yaWdpbmFsSW5mbylcclxuICAgICAgICAgICAgY29udGludWU7ICAvL25vIG5lZWQgdG8gZHJhdyBpdFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmVsYXRpb25JbmZvQXJyLnB1c2goYVJlbGF0aW9uKVxyXG4gICAgfVxyXG4gICAgaWYocmVsYXRpb25JbmZvQXJyLmxlbmd0aD09MCkgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgdmFyIGVkZ2VzPXRoaXMuY29yZS5hZGQocmVsYXRpb25JbmZvQXJyKVxyXG4gICAgcmV0dXJuIGVkZ2VzXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5yZXZpZXdTdG9yZWRSZWxhdGlvbnNoaXBzVG9EcmF3PWZ1bmN0aW9uKCl7XHJcbiAgICAvL2NoZWNrIHRoZSBzdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHMgYWdhaW4gYW5kIG1heWJlIHNvbWUgb2YgdGhlbSBjYW4gYmUgZHJhd24gbm93IHNpbmNlIHRhcmdldE5vZGUgaXMgYXZhaWxhYmxlXHJcbiAgICB2YXIgc3RvcmVkUmVsYXRpb25BcnI9W11cclxuICAgIGZvcih2YXIgdHdpbklEIGluIGFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwcyl7XHJcbiAgICAgICAgc3RvcmVkUmVsYXRpb25BcnI9c3RvcmVkUmVsYXRpb25BcnIuY29uY2F0KGFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1t0d2luSURdKVxyXG4gICAgfVxyXG4gICAgdGhpcy5kcmF3UmVsYXRpb25zKHN0b3JlZFJlbGF0aW9uQXJyKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuZHJhd1R3aW5zQW5kUmVsYXRpb25zPWZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgdmFyIHR3aW5zQW5kUmVsYXRpb25zPWRhdGEuY2hpbGRUd2luc0FuZFJlbGF0aW9uc1xyXG4gICAgdmFyIGNvbWJpbmVUd2lucz10aGlzLmNvcmUuY29sbGVjdGlvbigpXHJcblxyXG4gICAgLy9kcmF3IHRob3NlIG5ldyB0d2lucyBmaXJzdFxyXG4gICAgdHdpbnNBbmRSZWxhdGlvbnMuZm9yRWFjaChvbmVTZXQ9PntcclxuICAgICAgICB2YXIgdHdpbkluZm9BcnI9W11cclxuICAgICAgICBmb3IodmFyIGluZCBpbiBvbmVTZXQuY2hpbGRUd2lucykgdHdpbkluZm9BcnIucHVzaChvbmVTZXQuY2hpbGRUd2luc1tpbmRdKVxyXG4gICAgICAgIHZhciBlbGVzPXRoaXMuZHJhd1R3aW5zKHR3aW5JbmZvQXJyLFwiYW5pbWF0aW9uXCIpXHJcbiAgICAgICAgY29tYmluZVR3aW5zPWNvbWJpbmVUd2lucy51bmlvbihlbGVzKVxyXG4gICAgfSlcclxuXHJcbiAgICAvL2RyYXcgdGhvc2Uga25vd24gdHdpbnMgZnJvbSB0aGUgcmVsYXRpb25zaGlwc1xyXG4gICAgdmFyIHR3aW5zSW5mbz17fVxyXG4gICAgdHdpbnNBbmRSZWxhdGlvbnMuZm9yRWFjaChvbmVTZXQ9PntcclxuICAgICAgICB2YXIgcmVsYXRpb25zSW5mbz1vbmVTZXRbXCJyZWxhdGlvbnNoaXBzXCJdXHJcbiAgICAgICAgcmVsYXRpb25zSW5mby5mb3JFYWNoKChvbmVSZWxhdGlvbik9PntcclxuICAgICAgICAgICAgdmFyIHNyY0lEPW9uZVJlbGF0aW9uWyckc291cmNlSWQnXVxyXG4gICAgICAgICAgICB2YXIgdGFyZ2V0SUQ9b25lUmVsYXRpb25bJyR0YXJnZXRJZCddXHJcbiAgICAgICAgICAgIGlmKGFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLnN0b3JlZFR3aW5zW3NyY0lEXSlcclxuICAgICAgICAgICAgICAgIHR3aW5zSW5mb1tzcmNJRF0gPSBhZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZy5zdG9yZWRUd2luc1tzcmNJRF1cclxuICAgICAgICAgICAgaWYoYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cuc3RvcmVkVHdpbnNbdGFyZ2V0SURdKVxyXG4gICAgICAgICAgICAgICAgdHdpbnNJbmZvW3RhcmdldElEXSA9IGFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLnN0b3JlZFR3aW5zW3RhcmdldElEXSAgICBcclxuICAgICAgICB9KVxyXG4gICAgfSlcclxuICAgIHZhciB0bXBBcnI9W11cclxuICAgIGZvcih2YXIgdHdpbklEIGluIHR3aW5zSW5mbykgdG1wQXJyLnB1c2godHdpbnNJbmZvW3R3aW5JRF0pXHJcbiAgICB0aGlzLmRyYXdUd2lucyh0bXBBcnIpXHJcblxyXG4gICAgLy90aGVuIGNoZWNrIGFsbCBzdG9yZWQgcmVsYXRpb25zaGlwcyBhbmQgZHJhdyBpZiBpdCBjYW4gYmUgZHJhd25cclxuICAgIHRoaXMucmV2aWV3U3RvcmVkUmVsYXRpb25zaGlwc1RvRHJhdygpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5hcHBseVZpc3VhbERlZmluaXRpb249ZnVuY3Rpb24oKXtcclxuICAgIHZhciB2aXN1YWxKc29uPW1vZGVsTWFuYWdlckRpYWxvZy52aXN1YWxEZWZpbml0aW9uW2FkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLnNlbGVjdGVkQURUXVxyXG4gICAgaWYodmlzdWFsSnNvbj09bnVsbCkgcmV0dXJuO1xyXG4gICAgZm9yKHZhciBtb2RlbElEIGluIHZpc3VhbEpzb24pe1xyXG4gICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF0uY29sb3Ipe1xyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZU1vZGVsVHdpbkNvbG9yKG1vZGVsSUQsdmlzdWFsSnNvblttb2RlbElEXS5jb2xvcilcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXS5hdmFydGEpe1xyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZU1vZGVsQXZhcnRhKG1vZGVsSUQsdmlzdWFsSnNvblttb2RlbElEXS5hdmFydGEpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF0ucmVsYXRpb25zaGlwcyl7XHJcbiAgICAgICAgICAgIGZvcih2YXIgcmVsYXRpb25zaGlwTmFtZSBpbiB2aXN1YWxKc29uW21vZGVsSURdLnJlbGF0aW9uc2hpcHMpXHJcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVJlbGF0aW9uc2hpcENvbG9yKG1vZGVsSUQscmVsYXRpb25zaGlwTmFtZSx2aXN1YWxKc29uW21vZGVsSURdLnJlbGF0aW9uc2hpcHNbcmVsYXRpb25zaGlwTmFtZV0pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUucnhNZXNzYWdlPWZ1bmN0aW9uKG1zZ1BheWxvYWQpe1xyXG4gICAgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cIkFEVERhdGFzb3VyY2VDaGFuZ2VfcmVwbGFjZVwiKXtcclxuICAgICAgICB0aGlzLmNvcmUubm9kZXMoKS5yZW1vdmUoKVxyXG4gICAgICAgIHRoaXMuYXBwbHlWaXN1YWxEZWZpbml0aW9uKClcclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJyZXBsYWNlQWxsVHdpbnNcIikge1xyXG4gICAgICAgIHRoaXMuY29yZS5ub2RlcygpLnJlbW92ZSgpXHJcbiAgICAgICAgdmFyIGVsZXM9IHRoaXMuZHJhd1R3aW5zKG1zZ1BheWxvYWQuaW5mbylcclxuICAgICAgICB0aGlzLmNvcmUuY2VudGVyKGVsZXMpXHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiYXBwZW5kQWxsVHdpbnNcIikge1xyXG4gICAgICAgIHZhciBlbGVzPSB0aGlzLmRyYXdUd2lucyhtc2dQYXlsb2FkLmluZm8sXCJhbmltYXRlXCIpXHJcbiAgICAgICAgdGhpcy5jb3JlLmNlbnRlcihlbGVzKVxyXG4gICAgICAgIHRoaXMucmV2aWV3U3RvcmVkUmVsYXRpb25zaGlwc1RvRHJhdygpXHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiZHJhd0FsbFJlbGF0aW9uc1wiKXtcclxuICAgICAgICB2YXIgZWRnZXM9IHRoaXMuZHJhd1JlbGF0aW9ucyhtc2dQYXlsb2FkLmluZm8pXHJcbiAgICAgICAgaWYoZWRnZXMhPW51bGwpIHtcclxuICAgICAgICAgICAgaWYoZWRpdExheW91dERpYWxvZy5jdXJyZW50TGF5b3V0TmFtZT09bnVsbCkgIHRoaXMubm9Qb3NpdGlvbl9jb3NlKClcclxuICAgICAgICB9XHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiYWRkTmV3VHdpblwiKSB7XHJcbiAgICAgICAgdGhpcy5kcmF3VHdpbnMoW21zZ1BheWxvYWQudHdpbkluZm9dLFwiYW5pbWF0aW9uXCIpXHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiZHJhd1R3aW5zQW5kUmVsYXRpb25zXCIpIHRoaXMuZHJhd1R3aW5zQW5kUmVsYXRpb25zKG1zZ1BheWxvYWQuaW5mbylcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInNlbGVjdE5vZGVzXCIpe1xyXG4gICAgICAgIHRoaXMuY29yZS5ub2RlcygpLnVuc2VsZWN0KClcclxuICAgICAgICB0aGlzLmNvcmUuZWRnZXMoKS51bnNlbGVjdCgpXHJcbiAgICAgICAgdmFyIGFycj1tc2dQYXlsb2FkLmluZm87XHJcbiAgICAgICAgdmFyIG1vdXNlQ2xpY2tEZXRhaWw9bXNnUGF5bG9hZC5tb3VzZUNsaWNrRGV0YWlsO1xyXG4gICAgICAgIGFyci5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgICAgICB2YXIgYVR3aW49IHRoaXMuY29yZS5ub2RlcyhcIiNcIitlbGVtZW50WyckZHRJZCddKVxyXG4gICAgICAgICAgICBhVHdpbi5zZWxlY3QoKVxyXG4gICAgICAgICAgICBpZihtb3VzZUNsaWNrRGV0YWlsIT0yKSB0aGlzLmFuaW1hdGVBTm9kZShhVHdpbikgLy9pZ25vcmUgZG91YmxlIGNsaWNrIHNlY29uZCBjbGlja1xyXG4gICAgICAgIH0pO1xyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cIlBhblRvTm9kZVwiKXtcclxuICAgICAgICB2YXIgbm9kZUluZm89IG1zZ1BheWxvYWQuaW5mbztcclxuICAgICAgICB2YXIgdG9wb05vZGU9IHRoaXMuY29yZS5ub2RlcyhcIiNcIitub2RlSW5mb1tcIiRkdElkXCJdKVxyXG4gICAgICAgIGlmKHRvcG9Ob2RlKXtcclxuICAgICAgICAgICAgdGhpcy5jb3JlLmNlbnRlcih0b3BvTm9kZSlcclxuICAgICAgICB9XHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwidmlzdWFsRGVmaW5pdGlvbkNoYW5nZVwiKXtcclxuICAgICAgICBpZihtc2dQYXlsb2FkLnNyY01vZGVsSUQpIHRoaXMudXBkYXRlUmVsYXRpb25zaGlwQ29sb3IobXNnUGF5bG9hZC5zcmNNb2RlbElELG1zZ1BheWxvYWQucmVsYXRpb25zaGlwTmFtZSxtc2dQYXlsb2FkLmNvbG9yKVxyXG4gICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgIGlmKG1zZ1BheWxvYWQuY29sb3IpIHRoaXMudXBkYXRlTW9kZWxUd2luQ29sb3IobXNnUGF5bG9hZC5tb2RlbElELG1zZ1BheWxvYWQuY29sb3IpXHJcbiAgICAgICAgICAgIGVsc2UgaWYobXNnUGF5bG9hZC5hdmFydGEpIHRoaXMudXBkYXRlTW9kZWxBdmFydGEobXNnUGF5bG9hZC5tb2RlbElELG1zZ1BheWxvYWQuYXZhcnRhKVxyXG4gICAgICAgICAgICBlbHNlIGlmKG1zZ1BheWxvYWQubm9BdmFydGEpICB0aGlzLnVwZGF0ZU1vZGVsQXZhcnRhKG1zZ1BheWxvYWQubW9kZWxJRCxudWxsKVxyXG4gICAgICAgIH0gXHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwidHdpbnNEZWxldGVkXCIpIHRoaXMuZGVsZXRlVHdpbnMobXNnUGF5bG9hZC50d2luSURBcnIpXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJyZWxhdGlvbnNEZWxldGVkXCIpIHRoaXMuZGVsZXRlUmVsYXRpb25zKG1zZ1BheWxvYWQucmVsYXRpb25zKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiY29ubmVjdFRvXCIpeyB0aGlzLnN0YXJ0VGFyZ2V0Tm9kZU1vZGUoXCJjb25uZWN0VG9cIikgICB9XHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJjb25uZWN0RnJvbVwiKXsgdGhpcy5zdGFydFRhcmdldE5vZGVNb2RlKFwiY29ubmVjdEZyb21cIikgICB9XHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJhZGRTZWxlY3RPdXRib3VuZFwiKXsgdGhpcy5zZWxlY3RPdXRib3VuZE5vZGVzKCkgICB9XHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJhZGRTZWxlY3RJbmJvdW5kXCIpeyB0aGlzLnNlbGVjdEluYm91bmROb2RlcygpICAgfVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiaGlkZVNlbGVjdGVkTm9kZXNcIil7IHRoaXMuaGlkZVNlbGVjdGVkTm9kZXMoKSAgIH1cclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cIkNPU0VTZWxlY3RlZE5vZGVzXCIpeyB0aGlzLkNPU0VTZWxlY3RlZE5vZGVzKCkgICB9XHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJzYXZlTGF5b3V0XCIpeyB0aGlzLnNhdmVMYXlvdXQobXNnUGF5bG9hZC5sYXlvdXROYW1lLG1zZ1BheWxvYWQuYWR0TmFtZSkgICB9XHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJsYXlvdXRDaGFuZ2VcIil7IHRoaXMuYXBwbHlOZXdMYXlvdXQoKSAgIH1cclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmFwcGx5TmV3TGF5b3V0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGxheW91dE5hbWU9ZWRpdExheW91dERpYWxvZy5jdXJyZW50TGF5b3V0TmFtZVxyXG4gICAgXHJcbiAgICB2YXIgbGF5b3V0RGV0YWlsPSBlZGl0TGF5b3V0RGlhbG9nLmxheW91dEpTT05bbGF5b3V0TmFtZV1cclxuICAgIFxyXG4gICAgLy9yZW1vdmUgYWxsIGJlbmRpbmcgZWRnZSBcclxuICAgIHRoaXMuY29yZS5lZGdlcygpLmZvckVhY2gob25lRWRnZT0+e1xyXG4gICAgICAgIG9uZUVkZ2UucmVtb3ZlQ2xhc3MoJ2VkZ2ViZW5kZWRpdGluZy1oYXNiZW5kcG9pbnRzJylcclxuICAgICAgICBvbmVFZGdlLnJlbW92ZUNsYXNzKCdlZGdlY29udHJvbGVkaXRpbmctaGFzY29udHJvbHBvaW50cycpXHJcbiAgICB9KVxyXG4gICAgXHJcbiAgICBpZihsYXlvdXREZXRhaWw9PW51bGwpIHJldHVybjtcclxuICAgIFxyXG4gICAgdmFyIHN0b3JlZFBvc2l0aW9ucz17fVxyXG4gICAgZm9yKHZhciBpbmQgaW4gbGF5b3V0RGV0YWlsKXtcclxuICAgICAgICBzdG9yZWRQb3NpdGlvbnNbaW5kXT17XHJcbiAgICAgICAgICAgIHg6bGF5b3V0RGV0YWlsW2luZF1bMF1cclxuICAgICAgICAgICAgLHk6bGF5b3V0RGV0YWlsW2luZF1bMV1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB2YXIgbmV3TGF5b3V0PXRoaXMuY29yZS5sYXlvdXQoe1xyXG4gICAgICAgIG5hbWU6ICdwcmVzZXQnLFxyXG4gICAgICAgIHBvc2l0aW9uczpzdG9yZWRQb3NpdGlvbnMsXHJcbiAgICAgICAgZml0OmZhbHNlLFxyXG4gICAgICAgIGFuaW1hdGU6IHRydWUsXHJcbiAgICAgICAgYW5pbWF0aW9uRHVyYXRpb246IDMwMCxcclxuICAgIH0pXHJcbiAgICBuZXdMYXlvdXQucnVuKClcclxuXHJcbiAgICAvL3Jlc3RvcmUgZWRnZXMgYmVuZGluZyBvciBjb250cm9sIHBvaW50c1xyXG4gICAgdmFyIGVkZ2VQb2ludHNEaWN0PWxheW91dERldGFpbFtcImVkZ2VzXCJdXHJcbiAgICBpZihlZGdlUG9pbnRzRGljdD09bnVsbClyZXR1cm47XHJcbiAgICBmb3IodmFyIHNyY0lEIGluIGVkZ2VQb2ludHNEaWN0KXtcclxuICAgICAgICBmb3IodmFyIHJlbGF0aW9uc2hpcElEIGluIGVkZ2VQb2ludHNEaWN0W3NyY0lEXSl7XHJcbiAgICAgICAgICAgIHZhciBvYmo9ZWRnZVBvaW50c0RpY3Rbc3JjSURdW3JlbGF0aW9uc2hpcElEXVxyXG4gICAgICAgICAgICB0aGlzLmFwcGx5RWRnZUJlbmRjb250cm9sUG9pbnRzKHNyY0lELHJlbGF0aW9uc2hpcElELG9ialtcImN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0c1wiXVxyXG4gICAgICAgICAgICAsb2JqW1wiY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXNcIl0sb2JqW1wiY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzXCJdLG9ialtcImN5ZWRnZWNvbnRyb2xlZGl0aW5nRGlzdGFuY2VzXCJdKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmFwcGx5RWRnZUJlbmRjb250cm9sUG9pbnRzID0gZnVuY3Rpb24gKHNyY0lELHJlbGF0aW9uc2hpcElEXHJcbiAgICAsY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzLGN5ZWRnZWJlbmRlZGl0aW5nRGlzdGFuY2VzLGN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cyxjeWVkZ2Vjb250cm9sZWRpdGluZ0Rpc3RhbmNlcykge1xyXG4gICAgICAgIHZhciB0aGVOb2RlPXRoaXMuY29yZS5maWx0ZXIoJ1tpZCA9IFwiJytzcmNJRCsnXCJdJyk7XHJcbiAgICAgICAgdmFyIGVkZ2VzPXRoZU5vZGUuY29ubmVjdGVkRWRnZXMoKS50b0FycmF5KClcclxuICAgICAgICBmb3IodmFyIGk9MDtpPGVkZ2VzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICB2YXIgYW5FZGdlPWVkZ2VzW2ldXHJcbiAgICAgICAgICAgIGlmKGFuRWRnZS5kYXRhKFwib3JpZ2luYWxJbmZvXCIpW1wiJHJlbGF0aW9uc2hpcElkXCJdPT1yZWxhdGlvbnNoaXBJRCl7XHJcbiAgICAgICAgICAgICAgICBpZihjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHMpe1xyXG4gICAgICAgICAgICAgICAgICAgIGFuRWRnZS5kYXRhKFwiY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzXCIsY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzKVxyXG4gICAgICAgICAgICAgICAgICAgIGFuRWRnZS5kYXRhKFwiY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXNcIixjeWVkZ2ViZW5kZWRpdGluZ0Rpc3RhbmNlcylcclxuICAgICAgICAgICAgICAgICAgICBhbkVkZ2UuYWRkQ2xhc3MoJ2VkZ2ViZW5kZWRpdGluZy1oYXNiZW5kcG9pbnRzJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZihjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHMpe1xyXG4gICAgICAgICAgICAgICAgICAgIGFuRWRnZS5kYXRhKFwiY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzXCIsY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzKVxyXG4gICAgICAgICAgICAgICAgICAgIGFuRWRnZS5kYXRhKFwiY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXNcIixjeWVkZ2Vjb250cm9sZWRpdGluZ0Rpc3RhbmNlcylcclxuICAgICAgICAgICAgICAgICAgICBhbkVkZ2UuYWRkQ2xhc3MoJ2VkZ2Vjb250cm9sZWRpdGluZy1oYXNjb250cm9scG9pbnRzJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbn1cclxuXHJcblxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnNhdmVMYXlvdXQgPSBmdW5jdGlvbiAobGF5b3V0TmFtZSxhZHROYW1lKSB7XHJcbiAgICB2YXIgbGF5b3V0RGljdD1lZGl0TGF5b3V0RGlhbG9nLmxheW91dEpTT05bbGF5b3V0TmFtZV1cclxuICAgIGlmKCFsYXlvdXREaWN0KXtcclxuICAgICAgICBsYXlvdXREaWN0PWVkaXRMYXlvdXREaWFsb2cubGF5b3V0SlNPTltsYXlvdXROYW1lXT17fVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBpZih0aGlzLmNvcmUubm9kZXMoKS5zaXplKCk9PTApIHJldHVybjtcclxuXHJcbiAgICAvL3N0b3JlIG5vZGVzIHBvc2l0aW9uXHJcbiAgICB0aGlzLmNvcmUubm9kZXMoKS5mb3JFYWNoKG9uZU5vZGU9PntcclxuICAgICAgICB2YXIgcG9zaXRpb249b25lTm9kZS5wb3NpdGlvbigpXHJcbiAgICAgICAgbGF5b3V0RGljdFtvbmVOb2RlLmlkKCldPVt0aGlzLm51bWJlclByZWNpc2lvbihwb3NpdGlvblsneCddKSx0aGlzLm51bWJlclByZWNpc2lvbihwb3NpdGlvblsneSddKV1cclxuICAgIH0pXHJcblxyXG4gICAgLy9zdG9yZSBhbnkgZWRnZSBiZW5kaW5nIHBvaW50cyBvciBjb250cm9saW5nIHBvaW50c1xyXG5cclxuICAgIGlmKGxheW91dERpY3QuZWRnZXM9PW51bGwpIGxheW91dERpY3QuZWRnZXM9e31cclxuICAgIHZhciBlZGdlRWRpdEluc3RhbmNlPSB0aGlzLmNvcmUuZWRnZUVkaXRpbmcoJ2dldCcpO1xyXG4gICAgdGhpcy5jb3JlLmVkZ2VzKCkuZm9yRWFjaChvbmVFZGdlPT57XHJcbiAgICAgICAgdmFyIHNyY0lEPW9uZUVkZ2UuZGF0YShcIm9yaWdpbmFsSW5mb1wiKVtcIiRzb3VyY2VJZFwiXVxyXG4gICAgICAgIHZhciByZWxhdGlvbnNoaXBJRD1vbmVFZGdlLmRhdGEoXCJvcmlnaW5hbEluZm9cIilbXCIkcmVsYXRpb25zaGlwSWRcIl1cclxuICAgICAgICB2YXIgY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzPW9uZUVkZ2UuZGF0YSgnY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzJylcclxuICAgICAgICB2YXIgY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXM9b25lRWRnZS5kYXRhKCdjeWVkZ2ViZW5kZWRpdGluZ0Rpc3RhbmNlcycpXHJcbiAgICAgICAgdmFyIGN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cz1vbmVFZGdlLmRhdGEoJ2N5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cycpXHJcbiAgICAgICAgdmFyIGN5ZWRnZWNvbnRyb2xlZGl0aW5nRGlzdGFuY2VzPW9uZUVkZ2UuZGF0YSgnY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXMnKVxyXG4gICAgICAgIGlmKCFjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHMgJiYgIWN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cykgcmV0dXJuO1xyXG5cclxuICAgICAgICBpZihsYXlvdXREaWN0LmVkZ2VzW3NyY0lEXT09bnVsbClsYXlvdXREaWN0LmVkZ2VzW3NyY0lEXT17fVxyXG4gICAgICAgIGxheW91dERpY3QuZWRnZXNbc3JjSURdW3JlbGF0aW9uc2hpcElEXT17fVxyXG4gICAgICAgIGlmKGN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0cyAmJiBjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHMubGVuZ3RoPjApIHtcclxuICAgICAgICAgICAgbGF5b3V0RGljdC5lZGdlc1tzcmNJRF1bcmVsYXRpb25zaGlwSURdW1wiY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzXCJdPXRoaXMubnVtYmVyUHJlY2lzaW9uKGN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0cylcclxuICAgICAgICAgICAgbGF5b3V0RGljdC5lZGdlc1tzcmNJRF1bcmVsYXRpb25zaGlwSURdW1wiY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXNcIl09dGhpcy5udW1iZXJQcmVjaXNpb24oY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXMpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKGN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cyAmJiBjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHMubGVuZ3RoPjApIHtcclxuICAgICAgICAgICAgbGF5b3V0RGljdC5lZGdlc1tzcmNJRF1bcmVsYXRpb25zaGlwSURdW1wiY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzXCJdPXRoaXMubnVtYmVyUHJlY2lzaW9uKGN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cylcclxuICAgICAgICAgICAgbGF5b3V0RGljdC5lZGdlc1tzcmNJRF1bcmVsYXRpb25zaGlwSURdW1wiY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXNcIl09dGhpcy5udW1iZXJQcmVjaXNpb24oY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXMpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuXHJcbiAgICAkLnBvc3QoXCJsYXlvdXQvc2F2ZUxheW91dHNcIix7XCJhZHROYW1lXCI6YWR0TmFtZSxcImxheW91dHNcIjpKU09OLnN0cmluZ2lmeShlZGl0TGF5b3V0RGlhbG9nLmxheW91dEpTT04pfSlcclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImxheW91dHNVcGRhdGVkXCJ9KVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUubnVtYmVyUHJlY2lzaW9uID0gZnVuY3Rpb24gKG51bWJlcikge1xyXG4gICAgaWYoQXJyYXkuaXNBcnJheShudW1iZXIpKXtcclxuICAgICAgICBmb3IodmFyIGk9MDtpPG51bWJlci5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgbnVtYmVyW2ldID0gdGhpcy5udW1iZXJQcmVjaXNpb24obnVtYmVyW2ldKVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbnVtYmVyXHJcbiAgICB9ZWxzZVxyXG4gICAgcmV0dXJuIHBhcnNlRmxvYXQoZm9ybWF0dGVyLmZvcm1hdChudW1iZXIpKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuQ09TRVNlbGVjdGVkTm9kZXMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgc2VsZWN0ZWQ9dGhpcy5jb3JlLiQoJzpzZWxlY3RlZCcpXHJcbiAgICB0aGlzLm5vUG9zaXRpb25fY29zZShzZWxlY3RlZClcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmhpZGVTZWxlY3RlZE5vZGVzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHNlbGVjdGVkTm9kZXM9dGhpcy5jb3JlLm5vZGVzKCc6c2VsZWN0ZWQnKVxyXG4gICAgc2VsZWN0ZWROb2Rlcy5yZW1vdmUoKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuc2VsZWN0SW5ib3VuZE5vZGVzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHNlbGVjdGVkTm9kZXM9dGhpcy5jb3JlLm5vZGVzKCc6c2VsZWN0ZWQnKVxyXG4gICAgdmFyIGVsZXM9dGhpcy5jb3JlLm5vZGVzKCkuZWRnZXNUbyhzZWxlY3RlZE5vZGVzKS5zb3VyY2VzKClcclxuICAgIGVsZXMuZm9yRWFjaCgoZWxlKT0+eyB0aGlzLmFuaW1hdGVBTm9kZShlbGUpIH0pXHJcbiAgICBlbGVzLnNlbGVjdCgpXHJcbiAgICB0aGlzLnNlbGVjdEZ1bmN0aW9uKClcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnNlbGVjdE91dGJvdW5kTm9kZXMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgc2VsZWN0ZWROb2Rlcz10aGlzLmNvcmUubm9kZXMoJzpzZWxlY3RlZCcpXHJcbiAgICB2YXIgZWxlcz1zZWxlY3RlZE5vZGVzLmVkZ2VzVG8odGhpcy5jb3JlLm5vZGVzKCkpLnRhcmdldHMoKVxyXG4gICAgZWxlcy5mb3JFYWNoKChlbGUpPT57IHRoaXMuYW5pbWF0ZUFOb2RlKGVsZSkgfSlcclxuICAgIGVsZXMuc2VsZWN0KClcclxuICAgIHRoaXMuc2VsZWN0RnVuY3Rpb24oKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuYWRkQ29ubmVjdGlvbnMgPSBmdW5jdGlvbiAodGFyZ2V0Tm9kZSkge1xyXG4gICAgdmFyIHRoZUNvbm5lY3RNb2RlPXRoaXMudGFyZ2V0Tm9kZU1vZGVcclxuICAgIHZhciBzcmNOb2RlQXJyPXRoaXMuY29yZS5ub2RlcyhcIjpzZWxlY3RlZFwiKVxyXG5cclxuICAgIHZhciBwcmVwYXJhdGlvbkluZm89W11cclxuXHJcbiAgICBzcmNOb2RlQXJyLmZvckVhY2godGhlTm9kZT0+e1xyXG4gICAgICAgIHZhciBjb25uZWN0aW9uVHlwZXNcclxuICAgICAgICBpZih0aGVDb25uZWN0TW9kZT09XCJjb25uZWN0VG9cIikge1xyXG4gICAgICAgICAgICBjb25uZWN0aW9uVHlwZXM9dGhpcy5jaGVja0F2YWlsYWJsZUNvbm5lY3Rpb25UeXBlKHRoZU5vZGUuZGF0YShcIm1vZGVsSURcIiksdGFyZ2V0Tm9kZS5kYXRhKFwibW9kZWxJRFwiKSlcclxuICAgICAgICAgICAgcHJlcGFyYXRpb25JbmZvLnB1c2goe2Zyb206dGhlTm9kZSx0bzp0YXJnZXROb2RlLGNvbm5lY3Q6Y29ubmVjdGlvblR5cGVzfSlcclxuICAgICAgICB9ZWxzZSBpZih0aGVDb25uZWN0TW9kZT09XCJjb25uZWN0RnJvbVwiKSB7XHJcbiAgICAgICAgICAgIGNvbm5lY3Rpb25UeXBlcz10aGlzLmNoZWNrQXZhaWxhYmxlQ29ubmVjdGlvblR5cGUodGFyZ2V0Tm9kZS5kYXRhKFwibW9kZWxJRFwiKSx0aGVOb2RlLmRhdGEoXCJtb2RlbElEXCIpKVxyXG4gICAgICAgICAgICBwcmVwYXJhdGlvbkluZm8ucHVzaCh7dG86dGhlTm9kZSxmcm9tOnRhcmdldE5vZGUsY29ubmVjdDpjb25uZWN0aW9uVHlwZXN9KVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbiAgICAvL1RPRE86IGNoZWNrIGlmIGl0IGlzIG5lZWRlZCB0byBwb3B1cCBkaWFsb2csIGlmIGFsbCBjb25uZWN0aW9uIGlzIGRvYWJsZSBhbmQgb25seSBvbmUgdHlwZSB0byB1c2UsIG5vIG5lZWQgdG8gc2hvdyBkaWFsb2dcclxuICAgIHRoaXMuc2hvd0Nvbm5lY3Rpb25EaWFsb2cocHJlcGFyYXRpb25JbmZvKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuc2hvd0Nvbm5lY3Rpb25EaWFsb2cgPSBmdW5jdGlvbiAocHJlcGFyYXRpb25JbmZvKSB7XHJcbiAgICB2YXIgY29uZmlybURpYWxvZ0RpdiA9ICAkKCc8ZGl2IHRpdGxlPVwiQWRkIGNvbm5lY3Rpb25zXCI+PC9kaXY+JylcclxuICAgIHZhciByZXN1bHRBY3Rpb25zPVtdXHJcbiAgICBwcmVwYXJhdGlvbkluZm8uZm9yRWFjaCgob25lUm93LGluZGV4KT0+e1xyXG4gICAgICAgIHZhciBmcm9tTm9kZT1vbmVSb3cuZnJvbVxyXG4gICAgICAgIHZhciB0b05vZGU9b25lUm93LnRvXHJcbiAgICAgICAgdmFyIGNvbm5lY3Rpb25UeXBlcz1vbmVSb3cuY29ubmVjdFxyXG4gICAgICAgIHZhciBsYWJlbD0kKCc8bGFiZWwgc3R5bGU9XCJkaXNwbGF5OmJsb2NrO21hcmdpbi1ib3R0b206MnB4XCI+PC9sYWJlbD4nKVxyXG4gICAgICAgIGlmKGNvbm5lY3Rpb25UeXBlcy5sZW5ndGg9PTApe1xyXG4gICAgICAgICAgICBsYWJlbC5jc3MoXCJjb2xvclwiLFwicmVkXCIpXHJcbiAgICAgICAgICAgIGxhYmVsLmh0bWwoXCJObyB1c2FibGUgY29ubmVjdGlvbiB0eXBlIGZyb20gPGI+XCIrZnJvbU5vZGUuaWQoKStcIjwvYj4gdG8gPGI+XCIrdG9Ob2RlLmlkKCkrXCI8L2I+XCIpXHJcbiAgICAgICAgfWVsc2UgaWYoY29ubmVjdGlvblR5cGVzLmxlbmd0aD4xKXsgXHJcbiAgICAgICAgICAgIGxhYmVsLmh0bWwoXCJGcm9tIDxiPlwiK2Zyb21Ob2RlLmlkKCkrXCI8L2I+IHRvIDxiPlwiK3RvTm9kZS5pZCgpK1wiPC9iPlwiKSBcclxuICAgICAgICAgICAgdmFyIHN3aXRjaFR5cGVTZWxlY3Rvcj1uZXcgc2ltcGxlU2VsZWN0TWVudShcIiBcIilcclxuICAgICAgICAgICAgbGFiZWwucHJlcGVuZChzd2l0Y2hUeXBlU2VsZWN0b3IuRE9NKVxyXG4gICAgICAgICAgICBjb25uZWN0aW9uVHlwZXMuZm9yRWFjaChvbmVUeXBlPT57XHJcbiAgICAgICAgICAgICAgICBzd2l0Y2hUeXBlU2VsZWN0b3IuYWRkT3B0aW9uKG9uZVR5cGUpXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIHJlc3VsdEFjdGlvbnMucHVzaCh7ZnJvbTpmcm9tTm9kZS5pZCgpLHRvOnRvTm9kZS5pZCgpLGNvbm5lY3Q6Y29ubmVjdGlvblR5cGVzWzBdfSlcclxuICAgICAgICAgICAgc3dpdGNoVHlwZVNlbGVjdG9yLmNhbGxCYWNrX2NsaWNrT3B0aW9uPShvcHRpb25UZXh0LG9wdGlvblZhbHVlKT0+e1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0QWN0aW9uc1tpbmRleF1bMl09b3B0aW9uVGV4dFxyXG4gICAgICAgICAgICAgICAgc3dpdGNoVHlwZVNlbGVjdG9yLmNoYW5nZU5hbWUob3B0aW9uVGV4dClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBzd2l0Y2hUeXBlU2VsZWN0b3IudHJpZ2dlck9wdGlvbkluZGV4KDApXHJcbiAgICAgICAgfWVsc2UgaWYoY29ubmVjdGlvblR5cGVzLmxlbmd0aD09MSl7XHJcbiAgICAgICAgICAgIHJlc3VsdEFjdGlvbnMucHVzaCh7ZnJvbTpmcm9tTm9kZS5pZCgpLHRvOnRvTm9kZS5pZCgpLGNvbm5lY3Q6Y29ubmVjdGlvblR5cGVzWzBdfSlcclxuICAgICAgICAgICAgbGFiZWwuY3NzKFwiY29sb3JcIixcImdyZWVuXCIpXHJcbiAgICAgICAgICAgIGxhYmVsLmh0bWwoXCJBZGQgPGI+XCIrY29ubmVjdGlvblR5cGVzWzBdK1wiPC9iPiBjb25uZWN0aW9uIGZyb20gPGI+XCIrZnJvbU5vZGUuaWQoKStcIjwvYj4gdG8gPGI+XCIrdG9Ob2RlLmlkKCkrXCI8L2I+XCIpIFxyXG4gICAgICAgIH1cclxuICAgICAgICBjb25maXJtRGlhbG9nRGl2LmFwcGVuZChsYWJlbClcclxuICAgIH0pXHJcblxyXG4gICAgJCgnYm9keScpLmFwcGVuZChjb25maXJtRGlhbG9nRGl2KVxyXG4gICAgY29uZmlybURpYWxvZ0Rpdi5kaWFsb2coe1xyXG4gICAgICAgIHdpZHRoOjQ1MFxyXG4gICAgICAgICxoZWlnaHQ6MzAwXHJcbiAgICAgICAgLHJlc2l6YWJsZTpmYWxzZVxyXG4gICAgICAgICxidXR0b25zOiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRleHQ6IFwiQ29uZmlybVwiLFxyXG4gICAgICAgICAgICAgICAgY2xpY2s6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNyZWF0ZUNvbm5lY3Rpb25zKHJlc3VsdEFjdGlvbnMpXHJcbiAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5kaWFsb2coXCJkZXN0cm95XCIpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRleHQ6IFwiQ2FuY2VsXCIsXHJcbiAgICAgICAgICAgICAgICBjbGljazogKCkgPT4geyBjb25maXJtRGlhbG9nRGl2LmRpYWxvZyhcImRlc3Ryb3lcIikgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5jcmVhdGVDb25uZWN0aW9ucyA9IGZ1bmN0aW9uIChyZXN1bHRBY3Rpb25zKSB7XHJcbiAgICAvLyBmb3IgZWFjaCByZXN1bHRBY3Rpb25zLCBjYWxjdWxhdGUgdGhlIGFwcGVuZGl4IGluZGV4LCB0byBhdm9pZCBzYW1lIElEIGlzIHVzZWQgZm9yIGV4aXN0ZWQgY29ubmVjdGlvbnNcclxuICAgIHJlc3VsdEFjdGlvbnMuZm9yRWFjaChvbmVBY3Rpb249PntcclxuICAgICAgICB2YXIgbWF4RXhpc3RlZENvbm5lY3Rpb25OdW1iZXI9MFxyXG4gICAgICAgIHZhciBleGlzdGVkUmVsYXRpb25zPWFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tvbmVBY3Rpb24uZnJvbV1cclxuICAgICAgICBpZihleGlzdGVkUmVsYXRpb25zPT1udWxsKSBleGlzdGVkUmVsYXRpb25zPVtdXHJcbiAgICAgICAgZXhpc3RlZFJlbGF0aW9ucy5mb3JFYWNoKG9uZVJlbGF0aW9uPT57XHJcbiAgICAgICAgICAgIHZhciBvbmVSZWxhdGlvbklEPW9uZVJlbGF0aW9uWyckcmVsYXRpb25zaGlwSWQnXVxyXG4gICAgICAgICAgICBpZihvbmVSZWxhdGlvbltcIiR0YXJnZXRJZFwiXSE9b25lQWN0aW9uLnRvKSByZXR1cm5cclxuICAgICAgICAgICAgdmFyIGxhc3RJbmRleD0gb25lUmVsYXRpb25JRC5zcGxpdChcIjtcIikucG9wKClcclxuICAgICAgICAgICAgbGFzdEluZGV4PXBhcnNlSW50KGxhc3RJbmRleClcclxuICAgICAgICAgICAgaWYobWF4RXhpc3RlZENvbm5lY3Rpb25OdW1iZXI8PWxhc3RJbmRleCkgbWF4RXhpc3RlZENvbm5lY3Rpb25OdW1iZXI9bGFzdEluZGV4KzFcclxuICAgICAgICB9KVxyXG4gICAgICAgIG9uZUFjdGlvbi5JRGluZGV4PW1heEV4aXN0ZWRDb25uZWN0aW9uTnVtYmVyXHJcbiAgICB9KVxyXG5cclxuICAgICQucG9zdChcImVkaXRBRFQvY3JlYXRlUmVsYXRpb25zXCIse2FjdGlvbnM6cmVzdWx0QWN0aW9uc30sIChkYXRhLCBzdGF0dXMpID0+IHtcclxuICAgICAgICBpZihkYXRhPT1cIlwiKSByZXR1cm47XHJcbiAgICAgICAgYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cuc3RvcmVUd2luUmVsYXRpb25zaGlwc19hcHBlbmQoZGF0YSlcclxuICAgICAgICB0aGlzLmRyYXdSZWxhdGlvbnMoZGF0YSlcclxuICAgIH0pXHJcbn1cclxuXHJcblxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmNoZWNrQXZhaWxhYmxlQ29ubmVjdGlvblR5cGUgPSBmdW5jdGlvbiAoZnJvbU5vZGVNb2RlbCx0b05vZGVNb2RlbCkge1xyXG4gICAgdmFyIHJlPVtdXHJcbiAgICB2YXIgdmFsaWRSZWxhdGlvbnNoaXBzPW1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1tmcm9tTm9kZU1vZGVsXS52YWxpZFJlbGF0aW9uc2hpcHNcclxuICAgIHZhciB0b05vZGVCYXNlQ2xhc3Nlcz1tb2RlbEFuYWx5emVyLkRURExNb2RlbHNbdG9Ob2RlTW9kZWxdLmFsbEJhc2VDbGFzc2VzXHJcbiAgICBpZih2YWxpZFJlbGF0aW9uc2hpcHMpe1xyXG4gICAgICAgIGZvcih2YXIgcmVsYXRpb25OYW1lIGluIHZhbGlkUmVsYXRpb25zaGlwcyl7XHJcbiAgICAgICAgICAgIHZhciB0aGVSZWxhdGlvblR5cGU9dmFsaWRSZWxhdGlvbnNoaXBzW3JlbGF0aW9uTmFtZV1cclxuICAgICAgICAgICAgaWYodGhlUmVsYXRpb25UeXBlLnRhcmdldD09bnVsbFxyXG4gICAgICAgICAgICAgICAgIHx8IHRoZVJlbGF0aW9uVHlwZS50YXJnZXQ9PXRvTm9kZU1vZGVsXHJcbiAgICAgICAgICAgICAgICAgfHx0b05vZGVCYXNlQ2xhc3Nlc1t0aGVSZWxhdGlvblR5cGUudGFyZ2V0XSE9bnVsbCkgcmUucHVzaChyZWxhdGlvbk5hbWUpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlXHJcbn1cclxuXHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuc3RhcnRUYXJnZXROb2RlTW9kZSA9IGZ1bmN0aW9uIChtb2RlKSB7XHJcbiAgICB0aGlzLmNvcmUuYXV0b3Vuc2VsZWN0aWZ5KCB0cnVlICk7XHJcbiAgICB0aGlzLmNvcmUuY29udGFpbmVyKCkuc3R5bGUuY3Vyc29yID0gJ2Nyb3NzaGFpcic7XHJcbiAgICB0aGlzLnRhcmdldE5vZGVNb2RlPW1vZGU7XHJcbiAgICAkKGRvY3VtZW50KS5rZXlkb3duKChldmVudCkgPT4ge1xyXG4gICAgICAgIGlmIChldmVudC5rZXlDb2RlID09IDI3KSB0aGlzLmNhbmNlbFRhcmdldE5vZGVNb2RlKClcclxuICAgIH0pO1xyXG5cclxuICAgIHRoaXMuY29yZS5ub2RlcygpLm9uKCdjbGljaycsIChlKT0+e1xyXG4gICAgICAgIHZhciBjbGlja2VkTm9kZSA9IGUudGFyZ2V0O1xyXG4gICAgICAgIHRoaXMuYWRkQ29ubmVjdGlvbnMoY2xpY2tlZE5vZGUpXHJcbiAgICAgICAgLy9kZWxheSBhIHNob3J0IHdoaWxlIHNvIG5vZGUgc2VsZWN0aW9uIHdpbGwgbm90IGJlIGNoYW5nZWQgdG8gdGhlIGNsaWNrZWQgdGFyZ2V0IG5vZGVcclxuICAgICAgICBzZXRUaW1lb3V0KCgpPT57dGhpcy5jYW5jZWxUYXJnZXROb2RlTW9kZSgpfSw1MClcclxuXHJcbiAgICB9KTtcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmNhbmNlbFRhcmdldE5vZGVNb2RlPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLnRhcmdldE5vZGVNb2RlPW51bGw7XHJcbiAgICB0aGlzLmNvcmUuY29udGFpbmVyKCkuc3R5bGUuY3Vyc29yID0gJ2RlZmF1bHQnO1xyXG4gICAgJChkb2N1bWVudCkub2ZmKCdrZXlkb3duJyk7XHJcbiAgICB0aGlzLmNvcmUubm9kZXMoKS5vZmYoXCJjbGlja1wiKVxyXG4gICAgdGhpcy5jb3JlLmF1dG91bnNlbGVjdGlmeSggZmFsc2UgKTtcclxufVxyXG5cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5ub1Bvc2l0aW9uX2dyaWQ9ZnVuY3Rpb24oZWxlcyl7XHJcbiAgICB2YXIgbmV3TGF5b3V0ID0gZWxlcy5sYXlvdXQoe1xyXG4gICAgICAgIG5hbWU6ICdncmlkJyxcclxuICAgICAgICBhbmltYXRlOiBmYWxzZSxcclxuICAgICAgICBmaXQ6ZmFsc2VcclxuICAgIH0pIFxyXG4gICAgbmV3TGF5b3V0LnJ1bigpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5ub1Bvc2l0aW9uX2Nvc2U9ZnVuY3Rpb24oZWxlcyl7XHJcbiAgICBpZihlbGVzPT1udWxsKSBlbGVzPXRoaXMuY29yZS5lbGVtZW50cygpXHJcblxyXG4gICAgdmFyIG5ld0xheW91dCA9ZWxlcy5sYXlvdXQoe1xyXG4gICAgICAgIG5hbWU6ICdjb3NlJyxcclxuICAgICAgICBhbmltYXRlOiB0cnVlLFxyXG4gICAgICAgIGdyYXZpdHk6MSxcclxuICAgICAgICBhbmltYXRlOiBmYWxzZVxyXG4gICAgICAgICxmaXQ6ZmFsc2VcclxuICAgIH0pIFxyXG4gICAgbmV3TGF5b3V0LnJ1bigpXHJcbiAgICB0aGlzLmNvcmUuY2VudGVyKGVsZXMpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5ub1Bvc2l0aW9uX2NvbmNlbnRyaWM9ZnVuY3Rpb24oZWxlcyxib3gpe1xyXG4gICAgaWYoZWxlcz09bnVsbCkgZWxlcz10aGlzLmNvcmUuZWxlbWVudHMoKVxyXG4gICAgdmFyIG5ld0xheW91dCA9ZWxlcy5sYXlvdXQoe1xyXG4gICAgICAgIG5hbWU6ICdjb25jZW50cmljJyxcclxuICAgICAgICBhbmltYXRlOiBmYWxzZSxcclxuICAgICAgICBmaXQ6ZmFsc2UsXHJcbiAgICAgICAgbWluTm9kZVNwYWNpbmc6NjAsXHJcbiAgICAgICAgZ3Jhdml0eToxLFxyXG4gICAgICAgIGJvdW5kaW5nQm94OmJveFxyXG4gICAgfSkgXHJcbiAgICBuZXdMYXlvdXQucnVuKClcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmxheW91dFdpdGhOb2RlUG9zaXRpb249ZnVuY3Rpb24obm9kZVBvc2l0aW9uKXtcclxuICAgIHZhciBuZXdMYXlvdXQgPSB0aGlzLmNvcmUubGF5b3V0KHtcclxuICAgICAgICBuYW1lOiAncHJlc2V0JyxcclxuICAgICAgICBwb3NpdGlvbnM6IG5vZGVQb3NpdGlvbixcclxuICAgICAgICBhbmltYXRlOiBmYWxzZSwgLy8gd2hldGhlciB0byB0cmFuc2l0aW9uIHRoZSBub2RlIHBvc2l0aW9uc1xyXG4gICAgICAgIGFuaW1hdGlvbkR1cmF0aW9uOiA1MDAsIC8vIGR1cmF0aW9uIG9mIGFuaW1hdGlvbiBpbiBtcyBpZiBlbmFibGVkXHJcbiAgICB9KVxyXG4gICAgbmV3TGF5b3V0LnJ1bigpXHJcbn1cclxuXHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB0b3BvbG9neURPTTsiLCJjb25zdCBzaW1wbGVUcmVlPXJlcXVpcmUoXCIuL3NpbXBsZVRyZWVcIilcclxuY29uc3QgbW9kZWxBbmFseXplcj1yZXF1aXJlKFwiLi9tb2RlbEFuYWx5emVyXCIpXHJcbmNvbnN0IGFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nID0gcmVxdWlyZShcIi4vYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2dcIilcclxuXHJcbmZ1bmN0aW9uIHR3aW5zVHJlZShET00sIHNlYXJjaERPTSkge1xyXG4gICAgdGhpcy50cmVlPW5ldyBzaW1wbGVUcmVlKERPTSlcclxuICAgIHRoaXMubW9kZWxJRE1hcFRvTmFtZT17fVxyXG5cclxuICAgIHRoaXMudHJlZS5jYWxsYmFja19hZnRlclNlbGVjdE5vZGVzPShub2Rlc0Fycixtb3VzZUNsaWNrRGV0YWlsKT0+e1xyXG4gICAgICAgIHZhciBpbmZvQXJyPVtdXHJcbiAgICAgICAgbm9kZXNBcnIuZm9yRWFjaCgoaXRlbSwgaW5kZXgpID0+e1xyXG4gICAgICAgICAgICBpbmZvQXJyLnB1c2goaXRlbS5sZWFmSW5mbylcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJzZWxlY3ROb2Rlc1wiLCBpbmZvOmluZm9BcnIsIFwibW91c2VDbGlja0RldGFpbFwiOm1vdXNlQ2xpY2tEZXRhaWx9KVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMudHJlZS5jYWxsYmFja19hZnRlckRibGNsaWNrTm9kZT0odGhlTm9kZSk9PntcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJQYW5Ub05vZGVcIiwgaW5mbzp0aGVOb2RlLmxlYWZJbmZvfSlcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnRyZWUuY2FsbGJhY2tfYWZ0ZXJTZWxlY3RHcm91cE5vZGU9KG5vZGVJbmZvKT0+e1xyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7XCJtZXNzYWdlXCI6XCJzZWxlY3RHcm91cE5vZGVcIixpbmZvOm5vZGVJbmZvfSlcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnNlYXJjaEJveD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiAgcGxhY2Vob2xkZXI9XCJzZWFyY2guLi5cIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dFwiKTtcclxuICAgIHRoaXMuc2VhcmNoQm94LmNzcyh7XCJvdXRsaW5lXCI6XCJub25lXCIsXCJoZWlnaHRcIjpcIjEwMCVcIixcIndpZHRoXCI6XCIxMDAlXCJ9KSBcclxuICAgIHNlYXJjaERPTS5hcHBlbmQodGhpcy5zZWFyY2hCb3gpXHJcblxyXG4gICAgdGhpcy5zZWFyY2hCb3gua2V5dXAoKGUpPT57XHJcbiAgICAgICAgaWYoZS5rZXlDb2RlID09IDEzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIGFOb2RlID0gdGhpcy50cmVlLnNlYXJjaFRleHQoJChlLnRhcmdldCkudmFsKCkpXHJcbiAgICAgICAgICAgIGlmKGFOb2RlIT1udWxsKXtcclxuICAgICAgICAgICAgICAgIGFOb2RlLnBhcmVudEdyb3VwTm9kZS5leHBhbmQoKVxyXG4gICAgICAgICAgICAgICAgdGhpcy50cmVlLnNlbGVjdExlYWZOb2RlKGFOb2RlKVxyXG4gICAgICAgICAgICAgICAgdGhpcy50cmVlLnNjcm9sbFRvTGVhZk5vZGUoYU5vZGUpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5cclxudHdpbnNUcmVlLnByb3RvdHlwZS5yeE1lc3NhZ2U9ZnVuY3Rpb24obXNnUGF5bG9hZCl7XHJcbiAgICBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiQURURGF0YXNvdXJjZUNoYW5nZV9yZXBsYWNlXCIpIHRoaXMuQURURGF0YXNvdXJjZUNoYW5nZV9yZXBsYWNlKG1zZ1BheWxvYWQucXVlcnksIG1zZ1BheWxvYWQudHdpbnMsbXNnUGF5bG9hZC5BRFRJbnN0YW5jZURvZXNOb3RDaGFuZ2UpXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJBRFREYXRhc291cmNlQ2hhbmdlX2FwcGVuZFwiKSB0aGlzLkFEVERhdGFzb3VyY2VDaGFuZ2VfYXBwZW5kKG1zZ1BheWxvYWQucXVlcnksIG1zZ1BheWxvYWQudHdpbnMpXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJkcmF3VHdpbnNBbmRSZWxhdGlvbnNcIikgdGhpcy5kcmF3VHdpbnNBbmRSZWxhdGlvbnMobXNnUGF5bG9hZC5pbmZvKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiQURUTW9kZWxzQ2hhbmdlXCIpIHRoaXMucmVmcmVzaE1vZGVscyhtc2dQYXlsb2FkLm1vZGVscylcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImFkZE5ld1R3aW5cIikgdGhpcy5kcmF3T25lVHdpbihtc2dQYXlsb2FkLnR3aW5JbmZvKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwidHdpbnNEZWxldGVkXCIpIHRoaXMuZGVsZXRlVHdpbnMobXNnUGF5bG9hZC50d2luSURBcnIpXHJcbn1cclxuXHJcbnR3aW5zVHJlZS5wcm90b3R5cGUuZGVsZXRlVHdpbnM9ZnVuY3Rpb24odHdpbklEQXJyKXtcclxuICAgIHR3aW5JREFyci5mb3JFYWNoKHR3aW5JRD0+e1xyXG4gICAgICAgIHRoaXMudHJlZS5kZWxldGVMZWFmTm9kZSh0d2luSUQpXHJcbiAgICB9KVxyXG59XHJcblxyXG50d2luc1RyZWUucHJvdG90eXBlLnJlZnJlc2hNb2RlbHM9ZnVuY3Rpb24obW9kZWxzRGF0YSl7XHJcbiAgICAvL2RlbGV0ZSBhbGwgZ3JvdXAgbm9kZXMgb2YgZGVsZXRlZCBtb2RlbHNcclxuICAgIHRoaXMudHJlZS5ncm91cE5vZGVzLmZvckVhY2goKGdub2RlKT0+e1xyXG4gICAgICAgIGlmKG1vZGVsc0RhdGFbZ25vZGUubmFtZV09PW51bGwpe1xyXG4gICAgICAgICAgICAvL2RlbGV0ZSB0aGlzIGdyb3VwIG5vZGVcclxuICAgICAgICAgICAgZ25vZGUuZGVsZXRlU2VsZigpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuXHJcbiAgICAvL3RoZW4gYWRkIGFsbCBncm91cCBub2RlcyB0aGF0IHRvIGJlIGFkZGVkXHJcbiAgICB2YXIgY3VycmVudE1vZGVsTmFtZUFycj1bXVxyXG4gICAgdGhpcy50cmVlLmdyb3VwTm9kZXMuZm9yRWFjaCgoZ25vZGUpPT57Y3VycmVudE1vZGVsTmFtZUFyci5wdXNoKGdub2RlLm5hbWUpfSlcclxuXHJcbiAgICB2YXIgYWN0dWFsTW9kZWxOYW1lQXJyPVtdXHJcbiAgICBmb3IodmFyIGluZCBpbiBtb2RlbHNEYXRhKSBhY3R1YWxNb2RlbE5hbWVBcnIucHVzaChpbmQpXHJcbiAgICBhY3R1YWxNb2RlbE5hbWVBcnIuc29ydChmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYS50b0xvd2VyQ2FzZSgpLmxvY2FsZUNvbXBhcmUoYi50b0xvd2VyQ2FzZSgpKSB9KTtcclxuXHJcbiAgICBmb3IodmFyIGk9MDtpPGFjdHVhbE1vZGVsTmFtZUFyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICBpZihpPGN1cnJlbnRNb2RlbE5hbWVBcnIubGVuZ3RoICYmIGN1cnJlbnRNb2RlbE5hbWVBcnJbaV09PWFjdHVhbE1vZGVsTmFtZUFycltpXSkgY29udGludWVcclxuICAgICAgICAvL290aGVyd2lzZSBhZGQgdGhpcyBncm91cCB0byB0aGUgdHJlZVxyXG4gICAgICAgIHZhciBuZXdHcm91cD10aGlzLnRyZWUuaW5zZXJ0R3JvdXBOb2RlKG1vZGVsc0RhdGFbYWN0dWFsTW9kZWxOYW1lQXJyW2ldXSxpKVxyXG4gICAgICAgIG5ld0dyb3VwLnNocmluaygpXHJcbiAgICAgICAgY3VycmVudE1vZGVsTmFtZUFyci5zcGxpY2UoaSwgMCwgYWN0dWFsTW9kZWxOYW1lQXJyW2ldKTtcclxuICAgIH1cclxufVxyXG5cclxuXHJcbnR3aW5zVHJlZS5wcm90b3R5cGUuQURURGF0YXNvdXJjZUNoYW5nZV9hcHBlbmQ9ZnVuY3Rpb24odHdpblF1ZXJ5U3RyLHR3aW5zRGF0YSl7XHJcbiAgICBpZiAodHdpbnNEYXRhICE9IG51bGwpIHRoaXMuYXBwZW5kQWxsVHdpbnModHdpbnNEYXRhKVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgJC5wb3N0KFwicXVlcnlBRFQvYWxsVHdpbnNJbmZvXCIsIHsgcXVlcnk6IHR3aW5RdWVyeVN0ciB9LCAoZGF0YSkgPT4ge1xyXG4gICAgICAgICAgICBpZihkYXRhPT1cIlwiKSByZXR1cm47XHJcbiAgICAgICAgICAgIGRhdGEuZm9yRWFjaCgob25lTm9kZSk9PnthZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZy5zdG9yZWRUd2luc1tvbmVOb2RlW1wiJGR0SWRcIl1dID0gb25lTm9kZX0pO1xyXG4gICAgICAgICAgICB0aGlzLmFwcGVuZEFsbFR3aW5zKGRhdGEpXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxufVxyXG5cclxudHdpbnNUcmVlLnByb3RvdHlwZS5BRFREYXRhc291cmNlQ2hhbmdlX3JlcGxhY2U9ZnVuY3Rpb24odHdpblF1ZXJ5U3RyLHR3aW5zRGF0YSxBRFRJbnN0YW5jZURvZXNOb3RDaGFuZ2Upe1xyXG4gICAgdmFyIHRoZVRyZWU9IHRoaXMudHJlZTtcclxuXHJcbiAgICBpZiAoQURUSW5zdGFuY2VEb2VzTm90Q2hhbmdlKSB7XHJcbiAgICAgICAgLy9rZWVwIGFsbCBncm91cCBub2RlIGFzIG1vZGVsIGlzIHRoZSBzYW1lLCBvbmx5IGZldGNoIGFsbCBsZWFmIG5vZGUgYWdhaW5cclxuICAgICAgICAvL3JlbW92ZSBhbGwgbGVhZiBub2Rlc1xyXG4gICAgICAgIHRoaXMudHJlZS5jbGVhckFsbExlYWZOb2RlcygpXHJcbiAgICAgICAgaWYgKHR3aW5zRGF0YSAhPSBudWxsKSB0aGlzLnJlcGxhY2VBbGxUd2lucyh0d2luc0RhdGEpXHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICQucG9zdChcInF1ZXJ5QURUL2FsbFR3aW5zSW5mb1wiLCB7IHF1ZXJ5OiB0d2luUXVlcnlTdHIgfSwgKGRhdGEpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmKGRhdGE9PVwiXCIpIGRhdGE9W107XHJcbiAgICAgICAgICAgICAgICBkYXRhLmZvckVhY2goKG9uZU5vZGUpPT57YWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cuc3RvcmVkVHdpbnNbb25lTm9kZVtcIiRkdElkXCJdXSA9IG9uZU5vZGV9KTtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVwbGFjZUFsbFR3aW5zKGRhdGEpXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgdGhlVHJlZS5yZW1vdmVBbGxOb2RlcygpXHJcbiAgICAgICAgZm9yICh2YXIgaWQgaW4gdGhpcy5tb2RlbElETWFwVG9OYW1lKSBkZWxldGUgdGhpcy5tb2RlbElETWFwVG9OYW1lW2lkXVxyXG4gICAgICAgIC8vcXVlcnkgdG8gZ2V0IGFsbCBtb2RlbHNcclxuICAgICAgICAkLmdldChcInF1ZXJ5QURUL2xpc3RNb2RlbHNcIiwgKGRhdGEsIHN0YXR1cykgPT4ge1xyXG4gICAgICAgICAgICBpZihkYXRhPT1cIlwiKSBkYXRhPVtdXHJcbiAgICAgICAgICAgIHZhciB0bXBOYW1lQXJyID0gW11cclxuICAgICAgICAgICAgdmFyIHRtcE5hbWVUb09iaiA9IHt9XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYoZGF0YVtpXVtcImRpc3BsYXlOYW1lXCJdPT1udWxsKSBkYXRhW2ldW1wiZGlzcGxheU5hbWVcIl09ZGF0YVtpXVtcIkBpZFwiXVxyXG4gICAgICAgICAgICAgICAgdGhpcy5tb2RlbElETWFwVG9OYW1lW2RhdGFbaV1bXCJAaWRcIl1dID0gZGF0YVtpXVtcImRpc3BsYXlOYW1lXCJdXHJcbiAgICAgICAgICAgICAgICB0bXBOYW1lQXJyLnB1c2goZGF0YVtpXVtcImRpc3BsYXlOYW1lXCJdKVxyXG4gICAgICAgICAgICAgICAgdG1wTmFtZVRvT2JqW2RhdGFbaV1bXCJkaXNwbGF5TmFtZVwiXV0gPSBkYXRhW2ldXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdG1wTmFtZUFyci5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhLnRvTG93ZXJDYXNlKCkubG9jYWxlQ29tcGFyZShiLnRvTG93ZXJDYXNlKCkpIH0pO1xyXG4gICAgICAgICAgICB0bXBOYW1lQXJyLmZvckVhY2gobW9kZWxOYW1lID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciBuZXdHcm91cCA9IHRoZVRyZWUuYWRkR3JvdXBOb2RlKHRtcE5hbWVUb09ialttb2RlbE5hbWVdKVxyXG4gICAgICAgICAgICAgICAgbmV3R3JvdXAuc2hyaW5rKClcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgbW9kZWxBbmFseXplci5jbGVhckFsbE1vZGVscygpO1xyXG4gICAgICAgICAgICBtb2RlbEFuYWx5emVyLmFkZE1vZGVscyhkYXRhKVxyXG4gICAgICAgICAgICBtb2RlbEFuYWx5emVyLmFuYWx5emUoKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0d2luc0RhdGEgIT0gbnVsbCkgdGhpcy5yZXBsYWNlQWxsVHdpbnModHdpbnNEYXRhKVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICQucG9zdChcInF1ZXJ5QURUL2FsbFR3aW5zSW5mb1wiLCB7IHF1ZXJ5OiB0d2luUXVlcnlTdHIgfSwgKGRhdGEpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZihkYXRhPT1cIlwiKSBkYXRhPVtdO1xyXG4gICAgICAgICAgICAgICAgICAgIGRhdGEuZm9yRWFjaCgob25lTm9kZSk9PnthZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZy5zdG9yZWRUd2luc1tvbmVOb2RlW1wiJGR0SWRcIl1dID0gb25lTm9kZX0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVwbGFjZUFsbFR3aW5zKGRhdGEpXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgIH1cclxufVxyXG5cclxudHdpbnNUcmVlLnByb3RvdHlwZS5kcmF3VHdpbnNBbmRSZWxhdGlvbnM9IGZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgZGF0YS5jaGlsZFR3aW5zQW5kUmVsYXRpb25zLmZvckVhY2gob25lU2V0PT57XHJcbiAgICAgICAgZm9yKHZhciBpbmQgaW4gb25lU2V0LmNoaWxkVHdpbnMpe1xyXG4gICAgICAgICAgICB2YXIgb25lVHdpbj1vbmVTZXQuY2hpbGRUd2luc1tpbmRdXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd09uZVR3aW4ob25lVHdpbilcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG59XHJcbnR3aW5zVHJlZS5wcm90b3R5cGUuZHJhd09uZVR3aW49IGZ1bmN0aW9uKHR3aW5JbmZvKXtcclxuICAgIHZhciBncm91cE5hbWU9dGhpcy5tb2RlbElETWFwVG9OYW1lW3R3aW5JbmZvW1wiJG1ldGFkYXRhXCJdW1wiJG1vZGVsXCJdXVxyXG4gICAgdGhpcy50cmVlLmFkZExlYWZub2RlVG9Hcm91cChncm91cE5hbWUsdHdpbkluZm8sXCJza2lwUmVwZWF0XCIpXHJcbn1cclxuXHJcbnR3aW5zVHJlZS5wcm90b3R5cGUuYXBwZW5kQWxsVHdpbnM9IGZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgdmFyIHR3aW5JREFycj1bXVxyXG4gICAgLy9jaGVjayBpZiBhbnkgY3VycmVudCBsZWFmIG5vZGUgZG9lcyBub3QgaGF2ZSBzdG9yZWQgb3V0Ym91bmQgcmVsYXRpb25zaGlwIGRhdGEgeWV0XHJcbiAgICB0aGlzLnRyZWUuZ3JvdXBOb2Rlcy5mb3JFYWNoKChnTm9kZSk9PntcclxuICAgICAgICBnTm9kZS5jaGlsZExlYWZOb2Rlcy5mb3JFYWNoKGxlYWZOb2RlPT57XHJcbiAgICAgICAgICAgIHZhciBub2RlSWQ9bGVhZk5vZGUubGVhZkluZm9bXCIkZHRJZFwiXVxyXG4gICAgICAgICAgICBpZihhZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZy5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbbm9kZUlkXT09bnVsbCkgdHdpbklEQXJyLnB1c2gobm9kZUlkKVxyXG4gICAgICAgIH0pXHJcbiAgICB9KVxyXG5cclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImFwcGVuZEFsbFR3aW5zXCIsaW5mbzpkYXRhfSlcclxuICAgIGZvcih2YXIgaT0wO2k8ZGF0YS5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIgZ3JvdXBOYW1lPXRoaXMubW9kZWxJRE1hcFRvTmFtZVtkYXRhW2ldW1wiJG1ldGFkYXRhXCJdW1wiJG1vZGVsXCJdXVxyXG4gICAgICAgIHRoaXMudHJlZS5hZGRMZWFmbm9kZVRvR3JvdXAoZ3JvdXBOYW1lLGRhdGFbaV0sXCJza2lwUmVwZWF0XCIpXHJcbiAgICAgICAgdHdpbklEQXJyLnB1c2goZGF0YVtpXVtcIiRkdElkXCJdKVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuZmV0Y2hBbGxSZWxhdGlvbnNoaXBzKHR3aW5JREFycilcclxufVxyXG5cclxudHdpbnNUcmVlLnByb3RvdHlwZS5yZXBsYWNlQWxsVHdpbnM9IGZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgdmFyIHR3aW5JREFycj1bXVxyXG4gICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwicmVwbGFjZUFsbFR3aW5zXCIsaW5mbzpkYXRhfSlcclxuICAgIGZvcih2YXIgaT0wO2k8ZGF0YS5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIgZ3JvdXBOYW1lPXRoaXMubW9kZWxJRE1hcFRvTmFtZVtkYXRhW2ldW1wiJG1ldGFkYXRhXCJdW1wiJG1vZGVsXCJdXVxyXG4gICAgICAgIHRoaXMudHJlZS5hZGRMZWFmbm9kZVRvR3JvdXAoZ3JvdXBOYW1lLGRhdGFbaV0pXHJcbiAgICAgICAgdHdpbklEQXJyLnB1c2goZGF0YVtpXVtcIiRkdElkXCJdKVxyXG4gICAgfVxyXG4gICAgdGhpcy5mZXRjaEFsbFJlbGF0aW9uc2hpcHModHdpbklEQXJyKVxyXG59XHJcblxyXG50d2luc1RyZWUucHJvdG90eXBlLmZldGNoQWxsUmVsYXRpb25zaGlwcz0gYXN5bmMgZnVuY3Rpb24odHdpbklEQXJyKXtcclxuICAgIHdoaWxlKHR3aW5JREFyci5sZW5ndGg+MCl7XHJcbiAgICAgICAgdmFyIHNtYWxsQXJyPSB0d2luSURBcnIuc3BsaWNlKDAsIDEwMCk7XHJcbiAgICAgICAgdmFyIGRhdGE9YXdhaXQgdGhpcy5mZXRjaFBhcnRpYWxSZWxhdGlvbnNoaXBzKHNtYWxsQXJyKVxyXG4gICAgICAgIGlmKGRhdGE9PVwiXCIpIGNvbnRpbnVlO1xyXG4gICAgICAgIGFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLnN0b3JlVHdpblJlbGF0aW9uc2hpcHMoZGF0YSkgLy9zdG9yZSB0aGVtIGluIGdsb2JhbCBhdmFpbGFibGUgYXJyYXlcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJkcmF3QWxsUmVsYXRpb25zXCIsaW5mbzpkYXRhfSlcclxuICAgIH1cclxufVxyXG5cclxudHdpbnNUcmVlLnByb3RvdHlwZS5mZXRjaFBhcnRpYWxSZWxhdGlvbnNoaXBzPSBhc3luYyBmdW5jdGlvbihJREFycil7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICAgJC5wb3N0KFwicXVlcnlBRFQvYWxsUmVsYXRpb25zaGlwc1wiLHthcnI6SURBcnJ9LCBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShkYXRhKVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIHJlamVjdChlKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gdHdpbnNUcmVlOyIsImNvbnN0IHNpZ251cHNpZ25pbm5hbWU9XCJCMkNfMV9zaW5ndXBzaWduaW5fc3BhYXBwMVwiXHJcbmNvbnN0IGIyY1RlbmFudE5hbWU9XCJhenVyZWlvdGIyY1wiXHJcblxyXG5jb25zdCB1cmwgPSBuZXcgVVJMKHdpbmRvdy5sb2NhdGlvbi5ocmVmKTtcclxuXHJcbnZhciBzdHJBcnI9d2luZG93LmxvY2F0aW9uLmhyZWYuc3BsaXQoXCI/XCIpXHJcbnZhciBpc0xvY2FsVGVzdD0oc3RyQXJyLmluZGV4T2YoXCJ0ZXN0PTFcIikhPS0xKVxyXG5cclxuY29uc3QgZ2xvYmFsQXBwU2V0dGluZ3M9e1xyXG4gICAgXCJiMmNTaWduVXBTaWduSW5OYW1lXCI6IHNpZ251cHNpZ25pbm5hbWUsXHJcbiAgICBcImIyY1Njb3Blc1wiOltcImh0dHBzOi8vXCIrYjJjVGVuYW50TmFtZStcIi5vbm1pY3Jvc29mdC5jb20vdGFza21hc3Rlcm1vZHVsZS9vcGVyYXRpb25cIl0sXHJcbiAgICBcImxvZ291dFJlZGlyZWN0VXJpXCI6IHVybC5vcmlnaW4rXCIvc3BhaW5kZXguaHRtbFwiLFxyXG4gICAgXCJtc2FsQ29uZmlnXCI6e1xyXG4gICAgICAgIGF1dGg6IHtcclxuICAgICAgICAgICAgY2xpZW50SWQ6IFwiZjQ2OTNiZTUtNjAxYi00ZDBlLTkyMDgtYzM1ZDlhZDYyMzg3XCIsXHJcbiAgICAgICAgICAgIGF1dGhvcml0eTogXCJodHRwczovL1wiK2IyY1RlbmFudE5hbWUrXCIuYjJjbG9naW4uY29tL1wiK2IyY1RlbmFudE5hbWUrXCIub25taWNyb3NvZnQuY29tL1wiK3NpZ251cHNpZ25pbm5hbWUsXHJcbiAgICAgICAgICAgIGtub3duQXV0aG9yaXRpZXM6IFtiMmNUZW5hbnROYW1lK1wiLmIyY2xvZ2luLmNvbVwiXSxcclxuICAgICAgICAgICAgcmVkaXJlY3RVcmk6IHdpbmRvdy5sb2NhdGlvbi5ocmVmXHJcbiAgICAgICAgfSxcclxuICAgICAgICBjYWNoZToge1xyXG4gICAgICAgICAgICBjYWNoZUxvY2F0aW9uOiBcInNlc3Npb25TdG9yYWdlXCIsIFxyXG4gICAgICAgICAgICBzdG9yZUF1dGhTdGF0ZUluQ29va2llOiBmYWxzZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc3lzdGVtOiB7XHJcbiAgICAgICAgICAgIGxvZ2dlck9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIGxvZ2dlckNhbGxiYWNrOiAobGV2ZWwsIG1lc3NhZ2UsIGNvbnRhaW5zUGlpKSA9PiB7fVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIFwiaXNMb2NhbFRlc3RcIjppc0xvY2FsVGVzdCxcclxuICAgIFwidGFza01hc3RlckFQSVVSSVwiOigoaXNMb2NhbFRlc3QpP1wiaHR0cDovL2xvY2FsaG9zdDo1MDAwL1wiOlwiaHR0cHM6Ly9henVyZWlvdHJvY2tzdGFza21hc3Rlcm1vZHVsZS5henVyZXdlYnNpdGVzLm5ldC9cIilcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBnbG9iYWxBcHBTZXR0aW5nczsiLCJjb25zdCBnbG9iYWxBcHBTZXR0aW5ncz1yZXF1aXJlKFwiLi9nbG9iYWxBcHBTZXR0aW5nc1wiKVxyXG5cclxuZnVuY3Rpb24gbXNhbEhlbHBlcigpe1xyXG4gICAgdGhpcy5teU1TQUxPYmogPSBuZXcgbXNhbC5QdWJsaWNDbGllbnRBcHBsaWNhdGlvbihnbG9iYWxBcHBTZXR0aW5ncy5tc2FsQ29uZmlnKTtcclxufVxyXG5cclxubXNhbEhlbHBlci5wcm90b3R5cGUuc2lnbkluPWFzeW5jIGZ1bmN0aW9uKCl7XHJcbiAgICB0cnl7XHJcbiAgICAgICAgdmFyIHJlc3BvbnNlPSBhd2FpdCB0aGlzLm15TVNBTE9iai5sb2dpblBvcHVwKHsgc2NvcGVzOiBnbG9iYWxBcHBTZXR0aW5ncy5iMmNTY29wZXMgfSlcclxuICAgICAgICBpZiAocmVzcG9uc2UgIT0gbnVsbCl7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0QWNjb3VudChyZXNwb25zZS5hY2NvdW50KVxyXG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuYWNjb3VudFxyXG4gICAgICAgIH0gXHJcbiAgICAgICAgZWxzZSAgcmV0dXJuIHRoaXMuZmV0Y2hBY2NvdW50KClcclxuICAgIH1jYXRjaChlKXtcclxuICAgICAgICBpZihlLmVycm9yQ29kZSE9XCJ1c2VyX2NhbmNlbGxlZFwiKSBjb25zb2xlLmxvZyhlKVxyXG4gICAgfVxyXG59XHJcblxyXG5tc2FsSGVscGVyLnByb3RvdHlwZS5zZXRBY2NvdW50PWZ1bmN0aW9uKHRoZUFjY291bnQpe1xyXG4gICAgaWYodGhlQWNjb3VudD09bnVsbClyZXR1cm47XHJcbiAgICB0aGlzLmFjY291bnRJZCA9IHRoZUFjY291bnQuaG9tZUFjY291bnRJZDtcclxuICAgIHRoaXMudXNlcm5hbWUgPSB0aGVBY2NvdW50LnVzZXJuYW1lO1xyXG59XHJcblxyXG5tc2FsSGVscGVyLnByb3RvdHlwZS5mZXRjaEFjY291bnQ9ZnVuY3Rpb24obm9BbmltYXRpb24pe1xyXG4gICAgY29uc3QgY3VycmVudEFjY291bnRzID0gdGhpcy5teU1TQUxPYmouZ2V0QWxsQWNjb3VudHMoKTtcclxuICAgIGlmIChjdXJyZW50QWNjb3VudHMubGVuZ3RoIDwgMSkgcmV0dXJuO1xyXG4gICAgdmFyIGZvdW5kQWNjb3VudD1udWxsO1xyXG4gICAgZm9yKHZhciBpPTA7aTxjdXJyZW50QWNjb3VudHMubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIGFuQWNjb3VudD0gY3VycmVudEFjY291bnRzW2ldXHJcbiAgICAgICAgaWYoYW5BY2NvdW50LmhvbWVBY2NvdW50SWQudG9VcHBlckNhc2UoKS5pbmNsdWRlcyhnbG9iYWxBcHBTZXR0aW5ncy5iMmNTaWduVXBTaWduSW5OYW1lLnRvVXBwZXJDYXNlKCkpXHJcbiAgICAgICAgICAgICYmIGFuQWNjb3VudC5pZFRva2VuQ2xhaW1zLmlzcy50b1VwcGVyQ2FzZSgpLmluY2x1ZGVzKGdsb2JhbEFwcFNldHRpbmdzLm1zYWxDb25maWcuYXV0aC5rbm93bkF1dGhvcml0aWVzWzBdLnRvVXBwZXJDYXNlKCkpXHJcbiAgICAgICAgICAgICYmIGFuQWNjb3VudC5pZFRva2VuQ2xhaW1zLmF1ZCA9PT0gZ2xvYmFsQXBwU2V0dGluZ3MubXNhbENvbmZpZy5hdXRoLmNsaWVudElkXHJcbiAgICAgICAgKXtcclxuICAgICAgICAgICAgZm91bmRBY2NvdW50PSBhbkFjY291bnQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdGhpcy5zZXRBY2NvdW50KGZvdW5kQWNjb3VudClcclxuICAgIHJldHVybiBmb3VuZEFjY291bnQ7XHJcbn1cclxuXHJcbm1zYWxIZWxwZXIucHJvdG90eXBlLmNhbGxBUEk9YXN5bmMgZnVuY3Rpb24oQVBJU3RyaW5nLFJFU1RNZXRob2QscGF5bG9hZCl7XHJcbiAgICB2YXIgaGVhZGVyc09iaj17fVxyXG4gICAgaWYoIWdsb2JhbEFwcFNldHRpbmdzLmlzTG9jYWxUZXN0KXtcclxuICAgICAgICB2YXIgdG9rZW49YXdhaXQgdGhpcy5nZXRUb2tlbigpXHJcbiAgICAgICAgaGVhZGVyc09ialtcIkF1dGhvcml6YXRpb25cIl09YEJlYXJlciAke3Rva2VufWBcclxuICAgIH0gXHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICQuYWpheCh7XHJcbiAgICAgICAgICAgIHR5cGU6IFJFU1RNZXRob2QgfHwgJ0dFVCcsXHJcbiAgICAgICAgICAgIFwiaGVhZGVyc1wiOmhlYWRlcnNPYmosXHJcbiAgICAgICAgICAgIHVybDogZ2xvYmFsQXBwU2V0dGluZ3MudGFza01hc3RlckFQSVVSSStBUElTdHJpbmcsXHJcbiAgICAgICAgICAgIGNyb3NzRG9tYWluOiB0cnVlLFxyXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAocmVzcG9uc2VEYXRhLCB0ZXh0U3RhdHVzLCBqcVhIUikge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZXNwb25zZURhdGEpXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAocmVzcG9uc2VEYXRhLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikge1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KHJlc3BvbnNlRGF0YSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSlcclxufVxyXG5cclxubXNhbEhlbHBlci5wcm90b3R5cGUuZ2V0VG9rZW49YXN5bmMgZnVuY3Rpb24oKXtcclxuICAgIHRyeXtcclxuICAgICAgICBpZih0aGlzLnN0b3JlZFRva2VuIT1udWxsKXtcclxuICAgICAgICAgICAgdmFyIGN1cnJUaW1lPXBhcnNlSW50KG5ldyBEYXRlKCkuZ2V0VGltZSgpLzEwMDApXHJcbiAgICAgICAgICAgIGlmKGN1cnJUaW1lKzYwMCA8IHRoaXMuc3RvcmVkVG9rZW5FeHApIHJldHVybiB0aGlzLnN0b3JlZFRva2VuXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciB0b2tlblJlcXVlc3Q9e1xyXG4gICAgICAgICAgICBzY29wZXM6IGdsb2JhbEFwcFNldHRpbmdzLmIyY1Njb3BlcyxcclxuICAgICAgICAgICAgZm9yY2VSZWZyZXNoOiBmYWxzZSwgLy8gU2V0IHRoaXMgdG8gXCJ0cnVlXCIgdG8gc2tpcCBhIGNhY2hlZCB0b2tlbiBhbmQgZ28gdG8gdGhlIHNlcnZlciB0byBnZXQgYSBuZXcgdG9rZW5cclxuICAgICAgICAgICAgYWNjb3VudDogdGhpcy5teU1TQUxPYmouZ2V0QWNjb3VudEJ5SG9tZUlkKHRoaXMuYWNjb3VudElkKVxyXG4gICAgICAgIH1cclxuICAgIFxyXG4gICAgICAgIHZhciByZXNwb25zZSA9IGF3YWl0IHRoaXMubXlNU0FMT2JqLmFjcXVpcmVUb2tlblNpbGVudCh0b2tlblJlcXVlc3QpXHJcbiAgICAgICAgaWYgKCFyZXNwb25zZS5hY2Nlc3NUb2tlbiB8fCByZXNwb25zZS5hY2Nlc3NUb2tlbiA9PT0gXCJcIikge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgbXNhbC5JbnRlcmFjdGlvblJlcXVpcmVkQXV0aEVycm9yO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5zdG9yZWRUb2tlbj1yZXNwb25zZS5hY2Nlc3NUb2tlblxyXG4gICAgICAgIHRoaXMuc3RvcmVkVG9rZW5FeHA9cmVzcG9uc2UuaWRUb2tlbkNsYWltcy5leHBcclxuICAgIH1jYXRjaChlcnJvcil7XHJcbiAgICAgICAgaWYgKGVycm9yIGluc3RhbmNlb2YgbXNhbC5JbnRlcmFjdGlvblJlcXVpcmVkQXV0aEVycm9yKSB7XHJcbiAgICAgICAgICAgIC8vIGZhbGxiYWNrIHRvIGludGVyYWN0aW9uIHdoZW4gc2lsZW50IGNhbGwgZmFpbHNcclxuICAgICAgICAgICAgdmFyIHJlc3BvbnNlPWF3YWl0IHRoaXMubXlNU0FMT2JqLmFjcXVpcmVUb2tlblBvcHVwKHRva2VuUmVxdWVzdClcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gcmVzcG9uc2UuYWNjZXNzVG9rZW47XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IG1zYWxIZWxwZXIoKTsiXX0=
