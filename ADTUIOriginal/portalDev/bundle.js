(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const simpleSelectMenu= require("./simpleSelectMenu")
const simpleConfirmDialog = require("./simpleConfirmDialog")
const globalCache = require("./globalCache")

function adtInstanceSelectionDialog() {
    this.filters={}
    this.previousSelectedADT=null
    this.testTwinsInfo=null;

    if(!this.DOM){
        this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:101" class="w3-card-2"></div>')
        this.DOM.css("overflow","hidden")
        $("body").append(this.DOM)
        globalCache.makeDOMDraggable(this.DOM)
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
        closeButton.on("click",()=>{
            if(this.previousSelectedADT==null) this.useFilterToReplace()
            this.closeDialog()
        })
    
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
        filterList.css({"overflow-x":"hidden","overflow-y":"auto","height":"340px", "border-right":"solid 1px lightgray"})
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


        if(this.previousSelectedADT!=null){
            switchADTSelector.triggerOptionValue(this.previousSelectedADT)
        }else{
            switchADTSelector.triggerOptionIndex(0)
        }

    });
}

adtInstanceSelectionDialog.prototype.setADTInstance=function(selectedADT){
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
    globalCache.selectedADT = selectedADT
    if (!globalCache.visualDefinition[globalCache.selectedADT])
            globalCache.visualDefinition[globalCache.selectedADT] = {}
    this.listFilters(selectedADT)
    $.ajaxSetup({
        headers: {
            'adtInstance': globalCache.selectedADT
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
                        delete this.filters[globalCache.selectedADT][queryName]
                        this.listFilters(globalCache.selectedADT)
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

    this.filters[globalCache.selectedADT][queryName]=queryStr
    this.listFilters(globalCache.selectedADT)

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
                globalCache.storedTwins[oneNode["$dtId"]] = oneNode;
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
        if(filterName=="ALL") oneFilter.trigger("click")
        
        oneFilter.on("dblclick",(e)=>{
            if(this.previousSelectedADT == globalCache.selectedADT) this.useFilterToAppend();
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
        this.previousSelectedADT=globalCache.selectedADT
        this.broadcastMessage({ "message": "ADTDatasourceChange_append", "query": this.queryInput.val(), "twins":this.testTwinsInfo })
    }
    this.closeDialog()
}

adtInstanceSelectionDialog.prototype.closeDialog=function(){
    this.DOM.hide()
    this.broadcastMessage({ "message": "ADTDatasourceDialog_closed"})
}

adtInstanceSelectionDialog.prototype.useFilterToReplace=function(){
    if(this.queryInput.val()==""){
        alert("Please fill in query to fetch data from digital twin service..")
        return;
    }
    var ADTInstanceDoesNotChange=true
    if(this.previousSelectedADT!=globalCache.selectedADT){
        for(var ind in globalCache.storedOutboundRelationships) delete globalCache.storedOutboundRelationships[ind]
        for(var ind in globalCache.storedTwins) delete globalCache.storedTwins[ind]
        ADTInstanceDoesNotChange=false
    }
    this.previousSelectedADT=globalCache.selectedADT
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
},{"./globalCache":4,"./simpleConfirmDialog":12,"./simpleSelectMenu":13}],2:[function(require,module,exports){
const simpleSelectMenu= require("./simpleSelectMenu")
const simpleConfirmDialog = require("./simpleConfirmDialog")
const globalCache = require("./globalCache")

function editLayoutDialog() {
    if(!this.DOM){
        this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:101" class="w3-card-2"></div>')
        $("body").append(this.DOM)
        this.DOM.hide()
        globalCache.makeDOMDraggable(this.DOM)
    }
}

editLayoutDialog.prototype.getCurADTName=function(){
    var adtName = globalCache.selectedADT
    var str = adtName.replace("https://", "")
    return str
}

editLayoutDialog.prototype.rxMessage=function(msgPayload){
    if(msgPayload.message=="ADTDatasourceChange_replace") {
        try{
            $.post("layout/readLayouts",{adtName:this.getCurADTName()}, (data, status) => {
                if(data!="" && typeof(data)==="object") globalCache.layoutJSON=data;
                else globalCache.layoutJSON={};
                this.broadcastMessage({ "message": "layoutsUpdated"})
            })
        }catch(e){
            console.log(e)
        }
    
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


    if(!$.isEmptyObject(globalCache.layoutJSON)){
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
},{"./globalCache":4,"./simpleConfirmDialog":12,"./simpleSelectMenu":13}],3:[function(require,module,exports){
const modelAnalyzer = require("./modelAnalyzer");
const globalCache = require("./globalCache")

function floatInfoWindow() {
    if(!this.DOM){
        this.DOM=$('<div class="w3-card" style="padding:10px; position:absolute;z-index:101;min-height:120px"></div>')
        this.hideSelf()
        this.DOM.css("background-color","rgba(255, 255, 255, 0.9)")
        $('body').append(this.DOM)
    }
}

floatInfoWindow.prototype.hideSelf=function(msgPayload){
    this.DOM.hide()
    this.DOM.css("width","0px") 
}
floatInfoWindow.prototype.showSelf=function(msgPayload){
    this.DOM.css("width","295px")
    this.DOM.show()
}

floatInfoWindow.prototype.rxMessage=function(msgPayload){   
    if(msgPayload.message=="topologyMouseOut"){
        this.hideSelf()
    }else if(msgPayload.message=="showInfoHoveredEle"){
        if(!globalCache.showFloatInfoPanel) return;
        this.DOM.empty()
        
        var arr=msgPayload.info;
        if(arr==null || arr.length==0)  return;
        this.DOM.css("left","-2000px") //it is always outside of browser so it wont block mouse and cause mouse out
        this.showSelf()
        
        var documentBodyWidth=$('body').width()

        var singleElementInfo=arr[0];
        if(singleElementInfo["$dtId"]){// select a node
            this.drawStaticInfo(this.DOM,{"$dtId":singleElementInfo["$dtId"]},"1em","13px")
            var modelName=singleElementInfo['$metadata']['$model']
            
            if(modelAnalyzer.DTDLModels[modelName]){
                this.drawEditable(this.DOM,modelAnalyzer.DTDLModels[modelName].editableProperties,singleElementInfo,[])
            }
            this.drawStaticInfo(this.DOM,{"$etag":singleElementInfo["$etag"],"$metadata":singleElementInfo["$metadata"]},"1em","10px")
        }else if(singleElementInfo["$sourceId"]){
            this.drawStaticInfo(this.DOM,{
                "$sourceId":singleElementInfo["$sourceId"],
                "$targetId":singleElementInfo["$targetId"],
                "$relationshipName":singleElementInfo["$relationshipName"]
            },"1em","13px")
            this.drawStaticInfo(this.DOM,{
                "$relationshipId":singleElementInfo["$relationshipId"]
            },"1em","10px")
            var relationshipName=singleElementInfo["$relationshipName"]
            var sourceModel=singleElementInfo["sourceModel"]
            
            this.drawEditable(this.DOM,this.getRelationShipEditableProperties(relationshipName,sourceModel),singleElementInfo,[])
            this.drawStaticInfo(this.DOM,{"$etag":singleElementInfo["$etag"]},"1em","10px","DarkGray")
        }

        var screenXY= msgPayload.screenXY
        var windowLeft=screenXY.x+50

        if(windowLeft+this.DOM.outerWidth()+10>documentBodyWidth) {
            windowLeft=documentBodyWidth-this.DOM.outerWidth()-10
        }
        var windowTop = screenXY.y-this.DOM.outerHeight()-50
        if(windowTop<5) windowTop=5
        this.DOM.css({"left":windowLeft+"px", "top":windowTop+"px"})
    }
}

floatInfoWindow.prototype.getRelationShipEditableProperties=function(relationshipName,sourceModel){
    if(!modelAnalyzer.DTDLModels[sourceModel] || !modelAnalyzer.DTDLModels[sourceModel].validRelationships[relationshipName]) return
    return modelAnalyzer.DTDLModels[sourceModel].validRelationships[relationshipName].editableRelationshipProperties
}

floatInfoWindow.prototype.drawStaticInfo=function(parent,jsonInfo,paddingTop,fontSize){
    for(var ind in jsonInfo){
        var keyDiv= $("<label style='display:block'><div class='w3-dark-gray' style='display:inline;padding:.1em .3em .1em .3em;margin-right:.3em;font-size:10px'>"+ind+"</div></label>")
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

floatInfoWindow.prototype.drawEditable=function(parent,jsonInfo,originElementInfo,pathArr){
    if(jsonInfo==null) return;
    for(var ind in jsonInfo){
        var keyDiv= $("<label style='display:block'><div style='display:inline;padding:.1em .3em .1em .3em; margin-right:5px'>"+ind+"</div></label>")
        parent.append(keyDiv)
        
        keyDiv.css("padding-top",".3em") 

        var contentDOM=$("<label style='padding-top:.2em'></label>")
        var newPath=pathArr.concat([ind])
        if(typeof(jsonInfo[ind])==="object" && !Array.isArray(jsonInfo[ind])) {
            keyDiv.children(":first").css("font-weight","bold")
            contentDOM.css("display","block")
            contentDOM.css("padding-left","1em")
            this.drawEditable(contentDOM,jsonInfo[ind],originElementInfo,newPath)
        }else {
            keyDiv.children(":first").addClass("w3-lime")
            var val=this.searchValue(originElementInfo,newPath)
            if(val==null){
                contentDOM.css({"color":"gray","font-size":"9px"})
                contentDOM.text("[empty]")
            }else contentDOM.text(val)
        }
        keyDiv.append(contentDOM)
    }
}

floatInfoWindow.prototype.searchValue=function(originElementInfo,pathArr){
    if(pathArr.length==0) return null;
    var theJson=originElementInfo
    for(var i=0;i<pathArr.length;i++){
        var key=pathArr[i]
        theJson=theJson[key]
        if(theJson==null) return null;
    }
    return theJson //it should be the final value
}



module.exports = new floatInfoWindow();
},{"./globalCache":4,"./modelAnalyzer":9}],4:[function(require,module,exports){
function globalCache(){
    this.storedOutboundRelationships = {}
    this.storedTwins = {}

    this.currentLayoutName=null
    this.layoutJSON={}

    this.selectedADT=null;

    this.visualDefinition={}

    this.showFloatInfoPanel=true
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

globalCache.prototype.makeDOMDraggable=function(dom,ignoreChildDomType){
    ignoreChildDomType=ignoreChildDomType||["LABEL","TD","B","A","INPUT","PRE"]
    dom.on('mousedown',(e)=>{
        if(ignoreChildDomType.indexOf(e.target.tagName)!=-1) return;
        var domOffset=dom.offset()
        dom.mouseStartDragOffset=[domOffset.left-e.clientX, domOffset.top-e.clientY]
        $('body').on('mouseup',()=>{
            dom.mouseStartDragOffset=null
            $('body').off('mousemove')
            $('body').off('mouseup')
        })
        $('body').on('mousemove',(e)=>{
            e.preventDefault()
            if(dom.mouseStartDragOffset){
                var newLeft= e.clientX+dom.mouseStartDragOffset[0]
                var newTop=e.clientY+dom.mouseStartDragOffset[1]
                dom.css({"left":newLeft+"px","top":newTop+"px","transform":"none"})
            }
        })
    })
}
module.exports = new globalCache();
},{}],5:[function(require,module,exports){
const modelAnalyzer = require("./modelAnalyzer");
const simpleSelectMenu= require("./simpleSelectMenu")
const simpleConfirmDialog = require("./simpleConfirmDialog")
const globalCache = require("./globalCache")

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
    if(msgPayload.message=="ADTDatasourceDialog_closed"){
        if(!this.continerDOM.is(":visible")) {
            this.continerDOM.show()
            this.continerDOM.addClass("w3-animate-right")
        }
    }else if(msgPayload.message=="showInfoSelectedNodes" || msgPayload.message=="showInfoHoveredEle"){
        if (globalCache.showFloatInfoPanel && msgPayload.message=="showInfoHoveredEle") return; //the floating info window will show mouse over element information, do not change info panel content in this case
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
                singleElementInfo=globalCache.storedTwins[singleElementInfo["$dtId"]]
                this.drawButtons("singleNode")
                this.drawStaticInfo(this.DOM,{"$dtId":singleElementInfo["$dtId"]},"1em","13px")
                var modelName=singleElementInfo['$metadata']['$model']
                
                if(modelAnalyzer.DTDLModels[modelName]){
                    this.drawEditable(this.DOM,modelAnalyzer.DTDLModels[modelName].editableProperties,singleElementInfo,[])
                }
                this.drawStaticInfo(this.DOM,{"$etag":singleElementInfo["$etag"],"$metadata":singleElementInfo["$metadata"]},"1em","10px")
            }else if(singleElementInfo["$sourceId"]){
                var arr=globalCache.storedOutboundRelationships[singleElementInfo["$sourceId"]]
                for(var i=0;i<arr.length;i++){
                    if(arr[i]['$relationshipId']==singleElementInfo["$relationshipId"]){
                        singleElementInfo=arr[i]
                        break;
                    }
                }
                this.drawButtons("singleRelationship")
                this.drawStaticInfo(this.DOM,{
                    "$sourceId":singleElementInfo["$sourceId"],
                    "$targetId":singleElementInfo["$targetId"],
                    "$relationshipName":singleElementInfo["$relationshipName"]
                },"1em","13px")
                this.drawStaticInfo(this.DOM,{
                    "$relationshipId":singleElementInfo["$relationshipId"]
                },"1em","10px")
                
                var relationshipName=singleElementInfo["$relationshipName"]
                var sourceModel=singleElementInfo["sourceModel"]
                
                this.drawEditable(this.DOM,this.getRelationShipEditableProperties(relationshipName,sourceModel),singleElementInfo,[])
                this.drawStaticInfo(this.DOM,{"$etag":singleElementInfo["$etag"]},"1em","10px","DarkGray")
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
                            globalCache.storedTwins[data["$dtId"]] = data;
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
    var impBtn=$('<button class="w3-bar-item w3-button w3-blue"><i class="fas fa-cloud-upload-alt"></i></button>')
    var actualImportTwinsBtn =$('<input type="file" name="modelFiles" multiple="multiple" style="display:none"></input>')
    if(selectType!=null){
        var refreshBtn=$('<button class="w3-bar-item w3-button w3-black"><i class="fas fa-sync-alt"></i></button>')
        var expBtn=$('<button class="w3-bar-item w3-button w3-green"><i class="fas fa-cloud-download-alt"></i></button>')  
        this.DOM.append(refreshBtn,expBtn,impBtn,actualImportTwinsBtn)
        refreshBtn.on("click",()=>{this.refreshInfomation()})
        expBtn.on("click",()=>{
            //find out the twins in selection and their connections (filter both src and target within the selected twins)
            //and export them
            this.exportSelected()
        })    
    } else {
        this.DOM.html("<a style='display:block;font-style:italic;color:gray'>Choose twins or relationships to view infomration</a><a style='display:block;font-style:italic;color:gray;padding-top:20px'>Press shift key to draw box and select multiple twins in topology view</a><a style='display:block;font-style:italic;color:gray;padding-top:20px'>Press ctrl+z and ctrl+y to undo/redo in topology view; ctrl+s to save layout</a><a style='display:block;font-style:italic;color:gray;padding-top:20px;padding-bottom:20px'>Press shift or ctrl key to select multiple twins in tree view</a><a style='display:block;font-style:italic;color:gray;padding-top:12px;padding-bottom:5px'>Import twins data by clicking button below</a>")
        this.DOM.append(impBtn, actualImportTwinsBtn)
    }
    
    impBtn.on("click",()=>{actualImportTwinsBtn.trigger('click');})
    actualImportTwinsBtn.change(async (evt)=>{
        var files = evt.target.files; // FileList object
        await this.readTwinsFilesContentAndImport(files)
        actualImportTwinsBtn.val("")
    })
    if(selectType==null) return;

    if(selectType=="singleRelationship"){
        var delBtn =  $('<button style="width:104px" class="w3-button w3-red w3-hover-pink w3-border">Delete All</button>')
        this.DOM.append(delBtn)
        delBtn.on("click",()=>{
            this.deleteSelected()
            $(document.activeElement).blur()
        })
    }else if(selectType=="singleNode" || selectType=="multiple"){
        var delBtn = $('<button style="width:104px" class="w3-button w3-red w3-hover-pink w3-border">Delete All</button>')
        var connectToBtn =$('<button style="width:45%"  class="w3-button w3-border">Connect to</button>')
        var connectFromBtn = $('<button style="width:45%" class="w3-button w3-border">Connect from</button>')
        var showInboundBtn = $('<button  style="width:45%" class="w3-button w3-border">Query Inbound</button>')
        var showOutBoundBtn = $('<button style="width:45%" class="w3-button w3-border">Query Outbound</button>')
        
        this.DOM.append(delBtn, connectToBtn,connectFromBtn , showInboundBtn, showOutBoundBtn)
    
        showOutBoundBtn.on("click",()=>{
            this.showOutBound()
            $(document.activeElement).blur()
        })
        showInboundBtn.on("click",()=>{
            this.showInBound()
            $(document.activeElement).blur()
        })  
        connectToBtn.on("click",()=>{
            this.broadcastMessage({ "message": "connectTo"}) 
            $(document.activeElement).blur()
        })
        connectFromBtn.on("click",()=>{
            this.broadcastMessage({ "message": "connectFrom"}) 
            $(document.activeElement).blur()
        })

        delBtn.on("click",()=>{
            this.deleteSelected()
            $(document.activeElement).blur()
        })
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

        selectInboundBtn.on("click",()=>{
            this.broadcastMessage({"message": "addSelectInbound"})
            $(document.activeElement).blur()
        })
        selectOutBoundBtn.on("click",()=>{
            this.broadcastMessage({"message": "addSelectOutbound"})
            $(document.activeElement).blur()
        })
        coseLayoutBtn.on("click",()=>{
            this.broadcastMessage({"message": "COSESelectedNodes"})
            $(document.activeElement).blur()
        })
        hideBtn.on("click",()=>{
            var twinIDArr=[]
            this.selectedObjects.forEach(ele=>{if(ele['$dtId']) twinIDArr.push(ele['$dtId'])})
            this.broadcastMessage({"message": "hideSelectedNodes","twinIDArr":twinIDArr})
            $(document.activeElement).blur()
        })
    }
    if (numOfNode > 1) {
        //some additional buttons when select multiple items
        this.drawAdvanceAlignmentButtons()
    }
}

infoPanel.prototype.drawAdvanceAlignmentButtons=async function(){
    var label=$("<label class='w3-gray' style='display:block;margin-top:5px;width:20%;text-align:center;font-size:9px;padding:2px 4px;font-weight:normal;border-radius: 2px;'>Arrange</label>") 
    this.DOM.append(label) 
    var alignButtonsTable=$("<table style='margin:0 auto'><tr><td></td><td></td><td></td></tr><tr><td></td><td style='text-align:center;font-weight:bold;color:darkGray'>ALIGN</td><td></td></tr><tr><td></td><td></td><td></td></tr></table>")
    this.DOM.append(alignButtonsTable)
    var alignTopButton = $('<button class="w3-button w3-border"><i class="fas fa-chevron-up"></i></button>')
    var alignLeftButton = $('<button class="w3-button w3-border"><i class="fas fa-chevron-left"></i></button>')
    var alignRightButton = $('<button class="w3-button w3-border"><i class="fas fa-chevron-right"></i></button>')
    var alignBottomButton = $('<button class="w3-button w3-border"><i class="fas fa-chevron-down"></i></button>')
    alignButtonsTable.find("td").eq(1).append(alignTopButton)
    alignButtonsTable.find("td").eq(3).append(alignLeftButton)
    alignButtonsTable.find("td").eq(5).append(alignRightButton)
    alignButtonsTable.find("td").eq(7).append(alignBottomButton)


    var arrangeTable=$("<table style='margin:0 auto'><tr><td></td><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td><td></td></tr></table>")
    this.DOM.append(arrangeTable)

    var distributeHButton = $('<button class="w3-button w3-border"><i class="fas fa-ellipsis-h fa-lg"></i></button>') 
    var distributeVButton = $('<button class="w3-button w3-border"><i class="fas fa-ellipsis-v fa-lg"></i></button>') 
    var leftRotateButton = $('<button class="w3-button w3-border"><i class="fas fa-undo-alt fa-lg"></i></button>') 
    var rightRotateButton = $('<button class="w3-button w3-border"><i class="fas fa-redo-alt fa-lg"></i></button>') 
    var mirrorHButton = $('<button class="w3-button w3-border" style="width:100%"><i class="fas fa-arrows-alt-h"></i></button>') 
    var mirrorVButton = $('<button class="w3-button w3-border" style="width:100%"><i class="fas fa-arrows-alt-v"></i></button>')
    var expandButton = $('<button class="w3-button w3-border" style="width:100%"><i class="fas fa-expand-arrows-alt"></i></button>') 
    var compressButton = $('<button class="w3-button w3-border" style="width:100%"><i class="fas fa-compress-arrows-alt"></i></button>')
    
    arrangeTable.find("td").eq(0).append(distributeHButton)
    arrangeTable.find("td").eq(1).append(distributeVButton)
    arrangeTable.find("td").eq(2).append(leftRotateButton)
    arrangeTable.find("td").eq(3).append(rightRotateButton)
    arrangeTable.find("td").eq(4).append(mirrorHButton)
    arrangeTable.find("td").eq(5).append(mirrorVButton)
    arrangeTable.find("td").eq(6).append(expandButton)
    arrangeTable.find("td").eq(7).append(compressButton)


    alignTopButton.on("click", (e) => {
        this.broadcastMessage({ "message": "alignSelectedNode", direction: "top" })
        $(document.activeElement).blur()
    })
    alignLeftButton.on("click", () => {
        this.broadcastMessage({ "message": "alignSelectedNode", direction: "left" })
        $(document.activeElement).blur()
    })
    alignRightButton.on("click", () => {
        this.broadcastMessage({ "message": "alignSelectedNode", direction: "right" })
        $(document.activeElement).blur()
    })
    alignBottomButton.on("click", () => {
        this.broadcastMessage({ "message": "alignSelectedNode", direction: "bottom" })
        $(document.activeElement).blur()
    })

    distributeHButton.on("click", () => {
        this.broadcastMessage({ "message": "distributeSelectedNode", direction: "horizontal" })
        $(document.activeElement).blur()
    })
    distributeVButton.on("click", () => {
        this.broadcastMessage({ "message": "distributeSelectedNode", direction: "vertical" })
        $(document.activeElement).blur()
    })
    leftRotateButton.on("click", () => {
        this.broadcastMessage({ "message": "rotateSelectedNode", direction: "left" })
        $(document.activeElement).blur()
    })
    rightRotateButton.on("click", () => {
        this.broadcastMessage({ "message": "rotateSelectedNode", direction: "right" })
        $(document.activeElement).blur()
    })
    mirrorHButton.on("click", () => {
        this.broadcastMessage({ "message": "mirrorSelectedNode", direction: "horizontal" })
        $(document.activeElement).blur()
    })
    mirrorVButton.on("click", () => {
        this.broadcastMessage({ "message": "mirrorSelectedNode", direction: "vertical" })
        $(document.activeElement).blur()
    })
    expandButton.on("click", () => {
        this.broadcastMessage({ "message": "dimensionSelectedNode", direction: "expand" })
        $(document.activeElement).blur()
    })
    compressButton.on("click", () => {
        this.broadcastMessage({ "message": "dimensionSelectedNode", direction: "compress" })
        $(document.activeElement).blur()
    })
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
    for (var i = 0; i< files.length; i++) {
        var f=files[i]
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

    //for ADT UI standalone tool, translate all twin ID by its displayName
    var IDtoName={}
    importTwins.forEach(oneTwin=>{
        var displayName=oneTwin["displayName"] || oneTwin["$dtId"]
        IDtoName[oneTwin["$dtId"]]=displayName
        oneTwin["$dtId"]=displayName
        delete oneTwin["displayName"]
    })
    importRelations.forEach(oneRelation=>{
        oneRelation["$srcId"]=IDtoName[oneRelation["$srcId"]]||oneRelation["$srcId"]
        oneRelation["obj"]["$targetId"]=IDtoName[oneRelation["obj"]["$targetId"]]||oneRelation["obj"]["$targetId"]
    })


    var twinsImportResult= await this.batchImportTwins(importTwins)
    twinsImportResult.forEach(data=>{
        globalCache.storedTwins[data["$dtId"]] = data;
    })
    this.broadcastMessage({ "message": "addNewTwins",twinsInfo:twinsImportResult})

    var relationsImportResult=await this.batchImportRelations(importRelations)
    globalCache.storeTwinRelationships_append(relationsImportResult)
    this.broadcastMessage({ "message": "drawAllRelations",info:relationsImportResult})

    var numOfTwins=twinsImportResult.length
    var numOfRelations=relationsImportResult.length
    var str="Add "+numOfTwins+ " node"+((numOfTwins<=1)?"":"s")+", "+numOfRelations+" relationship"+((numOfRelations<=1)?"":"s")
    str+=`. (Raw twin records:${importTwins.length}); Raw relations records:${importRelations.length})`
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
                if(globalCache.storedOutboundRelationships[srcID]!=null){
                    var relations=globalCache.storedOutboundRelationships[srcID]
                    relations.forEach(oneStoredRelation=>{
                        if(oneStoredRelation['$relationshipId']==relationshipId){
                            //update all content
                            for(var ind in oneRe){ oneStoredRelation[ind]=oneRe[ind] }
                        }
                    })
                }
            }else{//update storedTwins
                var twinID= oneRe['$dtId']
                if(globalCache.storedTwins[twinID]!=null){
                    for(var ind in oneRe){ globalCache.storedTwins[twinID][ind]=oneRe[ind] }
                }
            }
        })
        
        //redraw infopanel if needed
        if(this.selectedObjects.length==1) this.rxMessage({ "message": "showInfoSelectedNodes", info: this.selectedObjects })
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
        var smallArr= twinIDArr.splice(0, 100);
        var data=await this.fetchPartialOutbounds(smallArr)
        if(data=="") continue;
        //new twin's relationship should be stored as well
        globalCache.storeTwinRelationships(data.newTwinRelations)
        
        data.childTwinsAndRelations.forEach(oneSet=>{
            for(var ind in oneSet.childTwins){
                var oneTwin=oneSet.childTwins[ind]
                globalCache.storedTwins[ind]=oneTwin
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
        globalCache.storeTwinRelationships(data.newTwinRelations)
        
        //data.newTwinRelations.forEach(oneRelation=>{console.log(oneRelation['$sourceId']+"->"+oneRelation['$targetId'])})
        //console.log(globalCache.storedOutboundRelationships["default"])

        data.childTwinsAndRelations.forEach(oneSet=>{
            for(var ind in oneSet.childTwins){
                var oneTwin=oneSet.childTwins[ind]
                globalCache.storedTwins[ind]=oneTwin
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
                var outBoundRelation=globalCache.storedOutboundRelationships[oneID]
                if(outBoundRelation){
                    outBoundRelation.forEach(oneRelation=>{
                        var targetID=oneRelation["$targetId"]
                        if(globalCache.storedTwins[targetID]!=null) knownTargetTwins[targetID]=1
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
            for(var twinID in globalCache.storedOutboundRelationships){
                var relations=globalCache.storedOutboundRelationships[twinID]
                relations.forEach(oneRelation=>{
                    var targetID=oneRelation['$targetId']
                    var srcID=oneRelation['$sourceId']
                    if(IDDict[targetID]!=null){
                        if(globalCache.storedTwins[srcID]!=null) knownSourceTwins[srcID]=1
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
        var keyDiv= $("<label style='display:block'><div class='w3-dark-gray' style='background-color:#f6f6f6;display:inline;padding:.1em .3em .1em .3em;margin-right:.3em;font-size:10px'>"+ind+"</div></label>")
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
        var keyDiv= $("<label style='display:block'><div style='display:inline;padding:.1em .3em .1em .3em; margin-right:5px'>"+ind+"</div></label>")
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
            keyDiv.children(":first").addClass("w3-lime")
            this.drawDropdownOption(contentDOM,newPath,jsonInfo[ind],isNewTwin,originElementInfo)
        }else if(typeof(jsonInfo[ind])==="object") {
            keyDiv.children(":first").css("font-weight","bold")
            contentDOM.css("display","block")
            contentDOM.css("padding-left","1em")
            this.drawEditable(contentDOM,jsonInfo[ind],originElementInfo,newPath,isNewTwin)
        }else {
            keyDiv.children(":first").addClass("w3-lime")
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

infoPanel.prototype.editDTProperty=function(originElementInfo,path,newVal,dataType,isNewTwin){
    if (["double", "float", "integer", "long"].includes(dataType)) newVal = Number(newVal)
    if (dataType == "boolean") {
        if (newVal == "true") newVal = true
        else newVal = false
    }

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
},{"./globalCache":4,"./modelAnalyzer":9,"./simpleConfirmDialog":12,"./simpleSelectMenu":13}],6:[function(require,module,exports){
$('document').ready(function(){
    const mainUI=require("./mainUI.js")    
});
},{"./mainUI.js":8}],7:[function(require,module,exports){
const adtInstanceSelectionDialog = require("./adtInstanceSelectionDialog")
const modelManagerDialog = require("./modelManagerDialog")
const editLayoutDialog= require("./editLayoutDialog")
const simpleSelectMenu= require("./simpleSelectMenu")
const globalCache = require("./globalCache")

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

    this.floatInfoBtn=$('<a class="w3-bar-item w3-button w3-amber" style="height:100%;font-size:80%" href="#"><span class="fa-stack fa-xs"><i class="fas fa-circle fa-stack-2x fa-inverse"></i><i class="fas fa-info fa-stack-1x w3-text-amber"></i></span></a>')

    this.switchLayoutSelector=new simpleSelectMenu("Layout")

    $("#mainToolBar").empty()
    $("#mainToolBar").append(this.switchADTInstanceBtn,this.modelIOBtn,this.showForgeViewBtn,this.showGISViewBtn
        ,this.switchLayoutSelector.DOM,this.editLayoutBtn,this.floatInfoBtn)

    this.switchADTInstanceBtn.on("click",()=>{ adtInstanceSelectionDialog.popup() })
    this.modelIOBtn.on("click",()=>{ modelManagerDialog.popup() })
    this.editLayoutBtn.on("click",()=>{ editLayoutDialog.popup() })

    this.floatInfoBtn.on("click",()=>{
        if(globalCache.showFloatInfoPanel) globalCache.showFloatInfoPanel=false
        else globalCache.showFloatInfoPanel=true
        if(!globalCache.showFloatInfoPanel){
            this.floatInfoBtn.removeClass("w3-amber")
            this.floatInfoBtn.html('<span class="fa-stack fa-xs"><i class="fas fa-ban fa-stack-2x fa-inverse"></i><i class="fas fa-info fa-stack-1x fa-inverse"></i></span>')
        }else{
            this.floatInfoBtn.addClass("w3-amber")
            this.floatInfoBtn.html('<span class="fa-stack fa-xs"><i class="fas fa-circle fa-stack-2x fa-inverse"></i><i class="fas fa-info fa-stack-1x w3-text-amber"></i></span>')
        }
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
    }else if(msgPayload.message=="popupLayoutEditing"){
        editLayoutDialog.popup()
    }
}

module.exports = new mainToolbar();
},{"./adtInstanceSelectionDialog":1,"./editLayoutDialog":2,"./globalCache":4,"./modelManagerDialog":11,"./simpleSelectMenu":13}],8:[function(require,module,exports){
'use strict';
const topologyDOM=require("./topologyDOM.js")
const twinsTree=require("./twinsTree")
const adtInstanceSelectionDialog = require("./adtInstanceSelectionDialog")
const modelManagerDialog = require("./modelManagerDialog")
const modelEditorDialog = require("./modelEditorDialog")
const editLayoutDialog = require("./editLayoutDialog")
const mainToolbar = require("./mainToolbar")
const infoPanel= require("./infoPanel")
const floatInfoWindow=require("./floatInfoWindow")

function mainUI() {
    this.initUILayout()

    this.twinsTree= new twinsTree($("#treeHolder"),$("#treeSearch"))
    
    this.mainToolbar=mainToolbar
    mainToolbar.render()
    this.topologyInstance=new topologyDOM($('#canvas'))
    this.topologyInstance.init()
    this.infoPanel= infoPanel

    this.broadcastMessage() //initialize all ui components to have the broadcast capability
    this.prepareData()
}

mainUI.prototype.prepareData=async function(){
    var promiseArr=[
        modelManagerDialog.preparationFunc(),
        adtInstanceSelectionDialog.preparationFunc()
    ]
    await Promise.allSettled(promiseArr);
    adtInstanceSelectionDialog.popup()
}


mainUI.prototype.assignBroadcastMessage=function(uiComponent){
    uiComponent.broadcastMessage=(msgObj)=>{this.broadcastMessage(uiComponent,msgObj)}
}

mainUI.prototype.broadcastMessage=function(source,msgPayload){
    var componentsArr=[this.twinsTree,adtInstanceSelectionDialog,modelManagerDialog,modelEditorDialog,editLayoutDialog,
         this.mainToolbar,this.topologyInstance,this.infoPanel,floatInfoWindow]

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

mainUI.prototype.initUILayout = function () {
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
        , east__maxSize: 0.5 // 50% of layout width
        , center__minWidth: 100
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


module.exports = new mainUI();
},{"./adtInstanceSelectionDialog":1,"./editLayoutDialog":2,"./floatInfoWindow":3,"./infoPanel":5,"./mainToolbar":7,"./modelEditorDialog":10,"./modelManagerDialog":11,"./topologyDOM.js":15,"./twinsTree":16}],9:[function(require,module,exports){
//This is a singleton class

function modelAnalyzer(){
    this.DTDLModels={}
    this.relationshipTypes={}
}

modelAnalyzer.prototype.clearAllModels=function(){
    console.log("clear all model info")
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


modelAnalyzer.prototype.listModelsForDeleteModel=function(modelID){
    var childModelIDs=[]
    for(var aID in this.DTDLModels){
        var aModel=this.DTDLModels[aID]
        if(aModel.allBaseClasses && aModel.allBaseClasses[modelID]) childModelIDs.push(aModel["@id"])
    }
    return childModelIDs
}

modelAnalyzer.prototype.deleteModel_notBaseClassOfAny=function(modelID){
    return new Promise((resolve, reject) => {
        $.post("editADT/deleteModel",{"model":modelID}, (data)=> {
            if(data==""){//successful
                resolve()
            }else{ //error happens
                reject(data)
            }
        });
    })
}

modelAnalyzer.prototype.deleteModel=async function(modelID,funcAfterEachSuccessDelete,funcAfterFail,completeFunc){
    var relatedModelIDs=this.listModelsForDeleteModel(modelID)
    var modelLevel=[]
    relatedModelIDs.forEach(oneID=>{
        var checkModel=this.DTDLModels[oneID]
        modelLevel.push({"modelID":oneID,"level":Object.keys(checkModel.allBaseClasses).length})
    })
    modelLevel.push({"modelID":modelID,"level":0})
    modelLevel.sort(function (a, b) {return b["level"]-a["level"] });
    
    for(var i=0;i<modelLevel.length;i++){
        var aModelID=modelLevel[i].modelID
        try{
            await this.deleteModel_notBaseClassOfAny(aModelID)
            var modelName=this.DTDLModels[aModelID].displayName
            delete this.DTDLModels[aModelID]
            if(funcAfterEachSuccessDelete) funcAfterEachSuccessDelete(aModelID,modelName)
        }catch(e){
            var deletedModels=[]
            var alertStr="Delete model is incomplete. Deleted Model:"
            for(var j=0;j<i;j++){
                alertStr+= modelLevel[j].modelID+" "
                deletedModels.push(modelLevel[j].modelID)
            } 
            alertStr+=". Fail to delete "+aModelID+". Error is "+e
            if(funcAfterFail) funcAfterFail(deletedModels)
            alert(e)
        }
    }
    if(completeFunc) completeFunc()
}

module.exports = new modelAnalyzer();
},{}],10:[function(require,module,exports){
const modelAnalyzer=require("./modelAnalyzer")
const simpleSelectMenu= require("./simpleSelectMenu")
const simpleConfirmDialog=require("./simpleConfirmDialog")
const globalCache = require("./globalCache")

function modelEditorDialog() {
    if(!this.DOM){
        this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:100" class="w3-card-2"></div>')
        $("body").append(this.DOM)
        this.DOM.hide()
        globalCache.makeDOMDraggable(this.DOM)
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
    this.importButton=importButton
    buttonRow.append(importButton)

    importButton.on("click", () => {
        var currentModelID=this.dtdlobj["@id"]
        if(modelAnalyzer.DTDLModels[currentModelID]==null) this.importModelArr([this.dtdlobj])
        else this.replaceModel()
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

modelEditorDialog.prototype.replaceModel=function(){
    //delete the old same name model, then create it again
    var currentModelID=this.dtdlobj["@id"]

    var relatedModelIDs=modelAnalyzer.listModelsForDeleteModel(currentModelID)

    var dialogStr = (relatedModelIDs.length == 0) ? ("Twins will be impact under model \"" + currentModelID + "\"") :
        (currentModelID + " is base model of " + relatedModelIDs.join(", ") + ". Twins under these models will be impact.")
    var confirmDialogDiv = new simpleConfirmDialog()
    confirmDialogDiv.show(
        { width: "350px" },
        {
            title: "Warning"
            , content: dialogStr
            , buttons: [
                {
                    colorClass: "w3-red w3-hover-pink", text: "Confirm", "clickFunc": () => {
                        confirmDialogDiv.close();
                        this.confirmReplaceModel(currentModelID)
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

modelEditorDialog.prototype.importModelArr=function(modelToBeImported,forReplacing,afterFailure){
    $.post("editADT/importModels", { "models": JSON.stringify(modelToBeImported) }, (data) => {
        if (data == "") {//successful
            if(forReplacing) alert("Model " + this.dtdlobj["displayName"] + " is modified successfully!")
            else {
                alert("Model " + this.dtdlobj["displayName"] + " is created!")
            }
            this.broadcastMessage({ "message": "ADTModelEdited" })
            modelAnalyzer.addModels(modelToBeImported)//add so immediatley the list can show the new models
            this.popup() //refresh content
        } else { //error happens
            if(afterFailure) afterFailure()
            alert(data)
        }
    });
}

modelEditorDialog.prototype.confirmReplaceModel=function(modelID){
    var relatedModelIDs=modelAnalyzer.listModelsForDeleteModel(modelID)
    var backupModels=[]
    relatedModelIDs.forEach(oneID=>{
        backupModels.push(JSON.parse(modelAnalyzer.DTDLModels[oneID]["original"]))
    })
    backupModels.push(this.dtdlobj)
    var backupModelsStr=encodeURIComponent(JSON.stringify(backupModels))

    var funcAfterFail=(deletedModelIDs)=>{
        var pom = $("<a></a>")
        pom.attr('href', 'data:text/plain;charset=utf-8,' + backupModelsStr);
        pom.attr('download', "exportModelsAfterFailedOperation.json");
        pom[0].click()
    }
    var funcAfterEachSuccessDelete = (eachDeletedModelID,eachModelName) => {}
    
    var completeFunc=()=>{ 
        //import all the models again
        this.importModelArr(backupModels,"forReplacing",funcAfterFail)
    }

    //not complete delete will still invoke completeFunc
    modelAnalyzer.deleteModel(modelID,funcAfterEachSuccessDelete,funcAfterFail,completeFunc)
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
    //it will refresh the generated DTDL sample, it will also change the import button to show "Create" or "Modify"
    var currentModelID=this.dtdlobj["@id"]
    if(modelAnalyzer.DTDLModels[currentModelID]==null) this.importButton.text("Create")
    else this.importButton.text("Modify")


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
    var ptypeSelector=new simpleSelectMenu(" ",{withBorder:1,fontSize:"1em",colorClass:"w3-light-gray w3-bar-item",buttonCSS:{"padding":"4px 5px"},"optionListHeight":300,"isClickable":1
    ,"optionListMarginTop":-150,"optionListMarginLeft":60,"adjustPositionAnchor":dialogOffset})
    

    ptypeSelector.addOptionArr(["string","float","integer","Enum","Object","double","boolean","date","dateTime","duration","long","time"])
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
    var domainInput=$('<input type="text" style="outline:none;display:inline;width:88px;padding:4px"  placeholder="Namespace"/>').addClass("w3-input w3-border");
    var modelIDInput=$('<input type="text" style="outline:none;display:inline;width:132px;padding:4px"  placeholder="ModelID"/>').addClass("w3-input w3-border");
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
},{"./globalCache":4,"./modelAnalyzer":9,"./simpleConfirmDialog":12,"./simpleSelectMenu":13}],11:[function(require,module,exports){
const modelAnalyzer=require("./modelAnalyzer")
const simpleConfirmDialog = require("./simpleConfirmDialog")
const simpleTree= require("./simpleTree")
const modelEditorDialog = require("./modelEditorDialog")
const globalCache = require("./globalCache")

function modelManagerDialog() {
    this.models={}
    if(!this.DOM){
        this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:99" class="w3-card-2"></div>')
        this.DOM.css("overflow","hidden")
        $("body").append(this.DOM)
        this.DOM.hide()
        globalCache.makeDOMDraggable(this.DOM)
    }
}

modelManagerDialog.prototype.preparationFunc = async function () {
    return new Promise((resolve, reject) => {
        try{
            $.get("visualDefinition/readVisualDefinition", (data, status) => {
                if(data!="" && typeof(data)==="object") globalCache.visualDefinition=data;
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
    var modelEditorBtn = $('<button class="w3-button w3-card w3-deep-orange w3-hover-light-green" style="height:100%">Create/Modify Model</button>')
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
    this.modelButtonBar.empty()
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
        var visualJson=globalCache.visualDefinition[globalCache.selectedADT]
        if(!visualJson[modelID]) visualJson[modelID]={}
        visualJson[modelID].avarta=dataUrl
        this.saveVisualDefinition()
        this.broadcastMessage({ "message": "visualDefinitionChange", "modelID":modelID,"avarta":dataUrl })
        this.refreshModelTreeLabel()
        actualImportPicBtn.val("")
    })

    clearAvartaBtn.on("click", ()=>{
        var visualJson=globalCache.visualDefinition[globalCache.selectedADT]
        if(visualJson[modelID]) delete visualJson[modelID].avarta 
        if(this.avartaImg) this.avartaImg.removeAttr('src');
        this.saveVisualDefinition()
        this.broadcastMessage({ "message": "visualDefinitionChange", "modelID":modelID,"noAvarta":true })
        this.refreshModelTreeLabel()
    });


    delBtn.on("click",()=>{
        var relatedModelIDs =modelAnalyzer.listModelsForDeleteModel(modelID)
        var dialogStr=(relatedModelIDs.length==0)? ("This will DELETE model \"" + modelID + "\""): 
            (modelID + " is base model of "+relatedModelIDs.join(", ")+". Delete all of them?")
        var confirmDialogDiv = new simpleConfirmDialog()
        confirmDialogDiv.show(
            { width: "350px" },
            {
                title: "Warning"
                , content: dialogStr
                , buttons: [
                    {
                        colorClass: "w3-red w3-hover-pink", text: "Confirm", "clickFunc": () => {
                            confirmDialogDiv.close();
                            this.confirmDeleteModel(modelID)
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

modelManagerDialog.prototype.confirmDeleteModel=function(modelID){
    var funcAfterEachSuccessDelete = (eachDeletedModelID,eachModelName) => {
        delete this.models[eachModelName]
        this.tree.deleteLeafNode(eachModelName)
        if (globalCache.visualDefinition[globalCache.selectedADT] && globalCache.visualDefinition[globalCache.selectedADT][eachDeletedModelID]) {
            delete globalCache.visualDefinition[globalCache.selectedADT][eachDeletedModelID]
        }
    }
    var completeFunc=()=>{ 
        this.broadcastMessage({ "message": "ADTModelsChange", "models":this.models})
        this.panelCard.empty()
        this.saveVisualDefinition()
    }

    //even not completely successful deleting, it will still invoke completeFunc
    modelAnalyzer.deleteModel(modelID,funcAfterEachSuccessDelete,completeFunc,completeFunc)
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
    var visualJson=globalCache.visualDefinition[globalCache.selectedADT]
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
    var visualJson=globalCache.visualDefinition[globalCache.selectedADT]
    if(relatinshipName==null){
        if(visualJson && visualJson[modelID] && visualJson[modelID].color) definedColor=visualJson[modelID].color
        if(visualJson && visualJson[modelID] && visualJson[modelID].shape) definedShape=visualJson[modelID].shape
        if(visualJson && visualJson[modelID] && visualJson[modelID].dimensionRatio) definedDimensionRatio=visualJson[modelID].dimensionRatio
    }else{
        if(visualJson && visualJson[modelID]
             && visualJson[modelID]["rels"]
              && visualJson[modelID]["rels"][relatinshipName]){
                  if(visualJson[modelID]["rels"][relatinshipName].color) definedColor=visualJson[modelID]["rels"][relatinshipName].color
                  if(visualJson[modelID]["rels"][relatinshipName].shape) definedShape=visualJson[modelID]["rels"][relatinshipName].shape
                  if(visualJson[modelID]["rels"][relatinshipName].edgeWidth) definedEdgeWidth=visualJson[modelID]["rels"][relatinshipName].edgeWidth
              }
    }

    var colorSelector=$('<select class="w3-border" style="outline:none;width:85px"></select>')
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
        colorSelector.css("color", selectColorCode)
        if (!globalCache.visualDefinition[globalCache.selectedADT])
            globalCache.visualDefinition[globalCache.selectedADT] = {}
        var visualJson = globalCache.visualDefinition[globalCache.selectedADT]

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
    if(definedShape!=null) shapeSelector.val(definedShape)
    
    shapeSelector.change((eve)=>{
        var selectShape=eve.target.value
        if (!globalCache.visualDefinition[globalCache.selectedADT])
            globalCache.visualDefinition[globalCache.selectedADT] = {}
        var visualJson = globalCache.visualDefinition[globalCache.selectedADT]

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
        if (!globalCache.visualDefinition[globalCache.selectedADT])
            globalCache.visualDefinition[globalCache.selectedADT] = {}
        var visualJson = globalCache.visualDefinition[globalCache.selectedADT]

        if(!relatinshipName) {
            if(!visualJson[modelID]) visualJson[modelID]={}
            visualJson[modelID].dimensionRatio=chooseVal
            this.broadcastMessage({ "message": "visualDefinitionChange", "modelID":modelID,"dimensionRatio":chooseVal })
            this.saveVisualDefinition()
        }else{
            if(!visualJson[modelID]["rels"]) visualJson[modelID]["rels"]={}
            if(!visualJson[modelID]["rels"][relatinshipName]) visualJson[modelID]["rels"][relatinshipName]={}
            visualJson[modelID]["rels"][relatinshipName].edgeWidth=chooseVal
            this.broadcastMessage({ "message": "visualDefinitionChange", "srcModelID":modelID,"relationshipName":relatinshipName,"edgeWidth":chooseVal })
            this.saveVisualDefinition()
        }
    })
}

modelManagerDialog.prototype.saveVisualDefinition=function(){
    $.post("visualDefinition/saveVisualDefinition",{visualDefinitionJson:globalCache.visualDefinition})
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
        var keyDiv= $("<label style='display:block'><label style='display:inline;padding:.1em .3em .1em .3em;margin-right:.3em'>"+ind+"</label></label>")
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
    for (var i = 0; i< files.length; i++) {
        var f=files[i]
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
    
    $.post("editADT/importModels",{"models":JSON.stringify(fileContentArr)}, (data)=> {
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


modelManagerDialog.prototype.listModels=function(shouldBroadcast){
    this.modelList.empty()
    this.panelCard.empty()
    for(var ind in this.models) delete this.models[ind]

    $.get("queryADT/listModels", (data, status) => {
        if(data=="") data=[]
        data.forEach(oneItem=>{
            if(oneItem["displayName"]==null) oneItem["displayName"]=oneItem["@id"]
            if($.isPlainObject(oneItem["displayName"])){
                if(oneItem["displayName"]["en"]) oneItem["displayName"]=oneItem["displayName"]["en"]
                else oneItem["displayName"]=JSON.stringify(oneItem["displayName"])
            }
            if(this.models[oneItem["displayName"]]!=null){
                //repeated model display name
                oneItem["displayName"]=oneItem["@id"]
            }  
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
            this.tree=new simpleTree(this.modelList,{"leafNameProperty":"displayName","noMultipleSelectAllowed":true,"hideEmptyGroup":true})

            this.tree.options.leafNodeIconFunc=(ln)=>{
                var modelClass=ln.leafInfo["@id"]
                var colorCode="darkGray"
                var shape="ellipse"
                var avarta = null
                var dimension=20;
                if(globalCache.visualDefinition[globalCache.selectedADT] && globalCache.visualDefinition[globalCache.selectedADT][modelClass]){
                    var visualJson =globalCache.visualDefinition[globalCache.selectedADT][modelClass]
                    var colorCode= visualJson.color || "darkGray"
                    var shape=  visualJson.shape || "ellipse"
                    var avarta = visualJson.avarta
                    if(visualJson.dimensionRatio) dimension*=parseFloat(visualJson.dimensionRatio)
                }
                var iconDOM = $("<div style='width:"+dimension+"px;height:"+dimension+"px;float:left;position:relative'></div>")
                var imgSrc = encodeURIComponent(this.shapeSvg(shape, colorCode))
                iconDOM.append($("<img src='data:image/svg+xml;utf8," + imgSrc + "'></img>"))
                if (avarta) {
                    var avartaimg = $("<img style='position:absolute;left:0px;width:60%;margin:20%' src='" + avarta + "'></img>")
                    iconDOM.append(avartaimg)
                }
                return iconDOM
            }

            this.tree.callback_afterSelectNodes=(nodesArr,mouseClickDetail)=>{
                var theNode=nodesArr[0]
                this.fillRightSpan(theNode.leafInfo["displayName"])
            }

            var groupNameList={}
            for(var modelName in this.models)  {
                var modelID= this.models[modelName]["@id"]
                groupNameList[this.modelNameToGroupName(modelID)]=1
            }
            var modelgroupSortArr=Object.keys(groupNameList)
            modelgroupSortArr.sort(function (a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()) });
            modelgroupSortArr.forEach(oneGroupName=>{
                var gn=this.tree.addGroupNode({ displayName: oneGroupName })
                gn.expand()
            })

            for(var modelName in this.models){
                var modelID= this.models[modelName]["@id"]
                var gn=this.modelNameToGroupName(modelID)
                this.tree.addLeafnodeToGroup(gn,this.models[modelName])
            }

            this.tree.sortAllLeaves()
        }
        
        if(shouldBroadcast) this.broadcastMessage({ "message": "ADTModelsChange", "models":this.models })
    })


    
    //var g1 = this.tree.addGroupNode({displayName:"test"})
    //this.tree.addLeafnodeToGroup("test",{"displayName":"haha"},"skipRepeat")
    //return;
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
},{"./globalCache":4,"./modelAnalyzer":9,"./modelEditorDialog":10,"./simpleConfirmDialog":12,"./simpleTree":14}],12:[function(require,module,exports){
const globalCache=require('./globalCache')
function simpleConfirmDialog(){
    this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:102" class="w3-card-4"></div>')
    globalCache.makeDOMDraggable(this.DOM)
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
},{"./globalCache":4}],13:[function(require,module,exports){
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

simpleTree.prototype.getAllLeafNodeArr=function(){
    var allLeaf=[]
    this.groupNodes.forEach(gn=>{
        allLeaf=allLeaf.concat(gn.childLeafNodes)
    })
    return allLeaf;
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

simpleTreeGroupNode.prototype.refreshName=function(){ //⬢▉⚫
    this.headerDOM.empty()
    var nameDiv=$("<div style='display:inline;padding-left:5px;padding-right:3px;vertical-align:middle'></div>")
    nameDiv.text(this.name)
    
    if(this.childLeafNodes.length>0) lblColor="yellowgreen"
    else var lblColor="darkGray" 
    this.headerDOM.css("font-weight","bold")

    if(this.parentTree.options.groupNodeIconFunc){
        var iconLabel=this.parentTree.options.groupNodeIconFunc(this)
        this.headerDOM.append(iconLabel)
        var rowHeight=iconLabel.height()
        nameDiv.css("line-height",rowHeight+"px")
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
    this.headerDOM=$('<button class="w3-button w3-block w3-light-grey w3-left-align w3-border-bottom"></button>')
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
    var nameDiv=$("<label style='display:inline;padding-left:5px;padding-right:3px;vertical-align:middle'></label>")
    if(this.parentGroupNode.parentTree.options.leafNodeIconFunc){
        var iconLabel=this.parentGroupNode.parentTree.options.leafNodeIconFunc(this)
        this.DOM.append(iconLabel)
        var rowHeight=iconLabel.height()
        nameDiv.css("line-height",rowHeight+"px")
    }
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
},{}],15:[function(require,module,exports){
'use strict';

const modelAnalyzer = require("./modelAnalyzer");
const simpleSelectMenu = require("./simpleSelectMenu")
const simpleConfirmDialog = require("./simpleConfirmDialog")
const globalCache = require("./globalCache")


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
                    ,'background-width':'70%'
                    ,'background-height':'70%'
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

        var arr=[
            {selector:'node',style:{ 'font-size': fs, width: dimension, height: dimension }},
            {selector:'node:selected',style:{ 'border-width': Math.ceil(dimension / 15) }},
        ]
        for (var modelID in this.nodeSizeModelAdjustmentRatio) {
            var newDimension = Math.ceil(this.nodeSizeModelAdjustmentRatio[modelID] * dimension)
            arr.push({selector:'node[modelID = "' + modelID + '"]',style:{ width: newDimension, height: newDimension }})
        }
        this.updateStyleSheet(arr)
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

    var ur = this.core.undoRedo({isDebug: false});
    this.ur=ur    
    this.core.trigger("zoom")
    this.setKeyDownFunc()
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
    this.broadcastMessage({ "message": "showInfoHoveredEle", "info": [info],"screenXY":this.convertPosition(e.position.x,e.position.y) })
}

topologyDOM.prototype.convertPosition=function(x,y){
    var vpExtent=this.core.extent()
    var screenW=this.DOM.width()
    var screenH=this.DOM.height()
    var screenX = (x-vpExtent.x1)/(vpExtent.w)*screenW + this.DOM.offset().left
    var screenY=(y-vpExtent.y1)/(vpExtent.h)*screenH+ this.DOM.offset().top
    return {x:screenX,y:screenY}
}

topologyDOM.prototype.mouseOutFunction= function (e) {
    if(!globalCache.showFloatInfoPanel){ //since floating window is used for mouse hover element info, so info panel never chagne before, that is why there is no need to restore back the info panel information at mouseout
        if(globalCache.showingCreateTwinModelID){
            this.broadcastMessage({ "message": "showInfoGroupNode", "info": {"@id":globalCache.showingCreateTwinModelID} })
        }else{
            this.selectFunction()
        }
    }
    
    this.broadcastMessage({ "message": "topologyMouseOut"})

    if(this.lastHoverTarget){
        this.lastHoverTarget.removeClass("hover")
        this.lastHoverTarget=null;
    } 

}

topologyDOM.prototype.selectFunction = function () {
    var arr = this.core.$(":selected")
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

topologyDOM.prototype.updateStyleSheet=function(styleArr){
    //reserve the two styles of edgeediting plugin first, right now there is no better way to reserve them
    var allStyle=this.core.style()
    var edgeBendStyle=null
    var edgeControlStyle=null
    for(var ind in allStyle){
        if(typeof(allStyle[ind])!="object") continue
        if(!allStyle[ind].selector) continue
        var str=allStyle[ind].selector.inputText
        if(str==".edgebendediting-hasbendpoints"){
            edgeBendStyle=allStyle[ind]
        }
        if(str==".edgecontrolediting-hascontrolpoints"){
            edgeControlStyle=allStyle[ind]
        }
    }

    //do style merging
    var mergeSelector={}
    styleArr.forEach(ele=>{
        mergeSelector[ele.selector]=ele.style
    })

    var styleJson = this.core.style().json();
    var arr=[]
    for(var ind in styleJson){
        if(mergeSelector[styleJson[ind].selector]) {
            var olds= styleJson[ind].style
            var news=mergeSelector[styleJson[ind].selector] 
            for(var ind in olds){
                if(news[ind]!=null) continue
                news[ind]=olds[ind]
            }
            continue
        }else if(styleJson[ind].selector==".edgebendediting-hasbendpoints" ||styleJson[ind].selector==".edgecontrolediting-hascontrolpoints" ) continue
        
        arr.push(styleJson[ind])
    }
    arr=arr.concat(styleArr)
    this.core.style().fromJson(arr).update()
    if(edgeBendStyle){
        allStyle=this.core.style()
        var curLen=allStyle.length;
        allStyle.length=curLen+2
        allStyle[curLen]=edgeBendStyle
        allStyle[curLen+1]=edgeControlStyle
    }
}

topologyDOM.prototype.updateModelAvarta=function(modelID,dataUrl){
    try{
        this.updateStyleSheet([
            {selector:'node[modelID = "'+modelID+'"]',style:{'background-image': dataUrl}}
        ])
    }catch(e){
        
    }  
    
}
topologyDOM.prototype.updateModelTwinColor=function(modelID,colorCode,secondColorCode){
    var styleJson = this.core.style().json();
    var arr=[]
    for(var ind in styleJson){
        arr.push(styleJson[ind].selector)
    }

    var styleSelector='node[modelID = "' + modelID + '"]'
    var styleObj=null
    if (secondColorCode == null) {
        if(colorCode=="none"){
            styleObj={ 'background-fill': 'solid','background-color': 'darkGray','background-opacity':0 }
        }else{
            styleObj={ 'background-fill': 'solid','background-color': colorCode ,'background-opacity':1}
        }
    } else {
        colorCode=colorCode||"darkGray"
        if(colorCode=="none") colorCode="darkGray"
        styleObj={
                'background-fill': 'linear-gradient',
                'background-gradient-stop-colors': [colorCode, colorCode, secondColorCode],
                'background-gradient-stop-positions': ['0%', '50%', '51%']
            }
    }
    if(styleObj) this.updateStyleSheet([{selector:styleSelector,style:styleObj}]) 
}
topologyDOM.prototype.updateModelTwinShape=function(modelID,shape){
    var newStyle
    if(shape=="hexagon"){
        newStyle={selector:'node[modelID = "'+modelID+'"]',style:{'shape': 'polygon','shape-polygon-points':[0,-1,0.866,-0.5,0.866,0.5,0,1,-0.866,0.5,-0.866,-0.5]}}
    }else{
        newStyle={selector:'node[modelID = "'+modelID+'"]',style:{'shape': shape}}
    }
    this.updateStyleSheet([newStyle])
}

topologyDOM.prototype.updateModelTwinDimension=function(modelID,dimensionRatio){
    this.nodeSizeModelAdjustmentRatio[modelID]=parseFloat(dimensionRatio)
    this.core.trigger("zoom")
}


topologyDOM.prototype.updateRelationshipColor=function(srcModelID,relationshipName,colorCode){
    this.updateStyleSheet([
        {selector:'edge[sourceModel = "'+srcModelID+'"][relationshipName = "'+relationshipName+'"]', style:{'line-color': colorCode}}
    ])
}
topologyDOM.prototype.updateRelationshipShape=function(srcModelID,relationshipName,shape){
    var newStyle
    if(shape=="solid"){
        newStyle={selector:'edge[sourceModel = "'+srcModelID+'"][relationshipName = "'+relationshipName+'"]', style:{'line-style': shape}}
    }else if(shape=="dotted"){
        newStyle={selector:'edge[sourceModel = "'+srcModelID+'"][relationshipName = "'+relationshipName+'"]', style:{'line-style': 'dashed','line-dash-pattern':[8,8]}}
    }
    this.updateStyleSheet([newStyle])    
}
topologyDOM.prototype.updateRelationshipWidth=function(srcModelID,relationshipName,edgeWidth){
    var arr=[
        {selector:'edge[sourceModel = "'+srcModelID+'"][relationshipName = "'+relationshipName+'"]',style:{'width':parseFloat(edgeWidth)}},
        {selector:'edge:selected[sourceModel = "'+srcModelID+'"][relationshipName = "'+relationshipName+'"]',style:{'width':parseFloat(edgeWidth)+1,'line-color': 'red'}},
        {selector:'edge.hover[sourceModel = "'+srcModelID+'"][relationshipName = "'+relationshipName+'"]',style:{'width':parseFloat(edgeWidth)+3}}
    ]
    this.updateStyleSheet(arr)
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
    var layoutName=globalCache.currentLayoutName
    if(layoutName!=null){
        var layoutDetail= globalCache.layoutJSON[layoutName]
        if(layoutDetail) this.applyNewLayoutWithUndo(layoutDetail,this.getCurrentLayoutDetail())
    }

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
        this.drawTwins(twinInfoArr,"animation")
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
    var visualJson=globalCache.visualDefinition[globalCache.selectedADT]
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
            if(globalCache.currentLayoutName==null)  this.noPosition_cose()
        }
    }else if(msgPayload.message=="addNewTwin") {
        this.core.nodes().unselect()
        this.core.edges().unselect()
        this.drawTwins([msgPayload.twinInfo],"animation")
        var nodeInfo= msgPayload.twinInfo;
        var nodeName= nodeInfo["$dtId"]
        var topoNode= this.core.nodes("#"+nodeName)
        if(topoNode){
            var position=topoNode.renderedPosition()
            this.core.panBy({x:-position.x+200,y:-position.y+200})
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
    else if(msgPayload.message=="saveLayout"){ this.saveLayout(msgPayload.layoutName,msgPayload.adtName)   }
    else if (msgPayload.message == "layoutChange") {
        var layoutName = globalCache.currentLayoutName
        if(layoutName=="[NA]"){
            var currentLayout=this.getCurrentLayoutDetail()
            //select all visible nodes and do a COSE layout, clean all bend edge line as well
            this.core.edges().forEach(oneEdge=>{
                oneEdge.removeClass('edgebendediting-hasbendpoints')
                oneEdge.removeClass('edgecontrolediting-hascontrolpoints')
                oneEdge.data("cyedgebendeditingWeights",[])
                oneEdge.data("cyedgebendeditingDistances",[])
                oneEdge.data("cyedgecontroleditingWeights",[])
                oneEdge.data("cyedgecontroleditingDistances",[])
            })
            this.noPosition_cose(null,currentLayout)
        }else if (layoutName != null) {
            var layoutDetail = globalCache.layoutJSON[layoutName]
            if (layoutDetail) this.applyNewLayoutWithUndo(layoutDetail, this.getCurrentLayoutDetail())
        }
    }else if(msgPayload.message=="alignSelectedNode") this.alignSelectedNodes(msgPayload.direction)
    else if(msgPayload.message=="distributeSelectedNode") this.distributeSelectedNode(msgPayload.direction)
    else if(msgPayload.message=="rotateSelectedNode") this.rotateSelectedNode(msgPayload.direction)
    else if(msgPayload.message=="mirrorSelectedNode") this.mirrorSelectedNode(msgPayload.direction)
    else if(msgPayload.message=="dimensionSelectedNode") this.dimensionSelectedNode(msgPayload.direction)
}

topologyDOM.prototype.dimensionSelectedNode = function (direction) {
    var ratio=1.2
    var selectedNodes=this.core.nodes(':selected')
    if(selectedNodes.size()<2) return;
    var boundary= selectedNodes.boundingBox({includeLabels :false,includeOverlays :false })
    var centerX=boundary["x1"]+boundary["w"]/2
    var centerY=boundary["y1"]+boundary["h"]/2
    
    var oldLayout={}
    var newLayout={}
    selectedNodes.forEach(oneNode=>{
        var curPos=oneNode.position()
        var nodeID=oneNode.id()
        oldLayout[nodeID]=[curPos['x'],curPos['y']]
        var xoffcenter=curPos["x"]-centerX
        var yoffcenter=curPos["y"]-centerY
        if(direction=="expand") newLayout[nodeID]=[centerX+xoffcenter*ratio,centerY+yoffcenter*ratio]
        else if(direction=="compress") newLayout[nodeID]=[centerX+xoffcenter/ratio,centerY+yoffcenter/ratio]
    })
    this.applyNewLayoutWithUndo(newLayout,oldLayout,"onlyAdjustNodePosition")
}

topologyDOM.prototype.mirrorSelectedNode = function (direction) {
    var selectedNodes=this.core.nodes(':selected')
    if(selectedNodes.size()<2) return;
    var boundary= selectedNodes.boundingBox({includeLabels :false,includeOverlays :false })
    var centerX=boundary["x1"]+boundary["w"]/2
    var centerY=boundary["y1"]+boundary["h"]/2
    
    var oldLayout={}
    var newLayout={}
    selectedNodes.forEach(oneNode=>{
        var curPos=oneNode.position()
        var nodeID=oneNode.id()
        oldLayout[nodeID]=[curPos['x'],curPos['y']]
        var xoffcenter=curPos["x"]-centerX
        var yoffcenter=curPos["y"]-centerY
        if(direction=="horizontal") newLayout[nodeID]=[centerX-xoffcenter,curPos['y']]
        else if(direction=="vertical") newLayout[nodeID]=[curPos['x'],centerY-yoffcenter]
    })
    this.applyNewLayoutWithUndo(newLayout,oldLayout,"onlyAdjustNodePosition")
}

topologyDOM.prototype.rotateSelectedNode = function (direction) {
    var selectedNodes=this.core.nodes(':selected')
    if(selectedNodes.size()<2) return;
    var boundary= selectedNodes.boundingBox({includeLabels :false,includeOverlays :false })
    var centerX=boundary["x1"]+boundary["w"]/2
    var centerY=boundary["y1"]+boundary["h"]/2
    
    var oldLayout={}
    var newLayout={}
    selectedNodes.forEach(oneNode=>{
        var curPos=oneNode.position()
        var nodeID=oneNode.id()
        oldLayout[nodeID]=[curPos['x'],curPos['y']]
        var xoffcenter=curPos["x"]-centerX
        var yoffcenter=curPos["y"]-centerY
        if(direction=="left") newLayout[nodeID]=[centerX+yoffcenter,centerY-xoffcenter]
        else if(direction=="right") newLayout[nodeID]=[centerX-yoffcenter,centerY+xoffcenter]
    })
    this.applyNewLayoutWithUndo(newLayout,oldLayout,"onlyAdjustNodePosition")
}

topologyDOM.prototype.distributeSelectedNode = function (direction) {
    var selectedNodes=this.core.nodes(':selected')
    if(selectedNodes.size()<3) return;
    var numArr=[]
    var oldLayout={}
    var layoutForSort=[]
    selectedNodes.forEach(oneNode=>{
        var position=oneNode.position()
        if(direction=="vertical") numArr.push(position['y'])
        else if(direction=="horizontal") numArr.push(position['x'])
        var curPos=oneNode.position()
        var nodeID=oneNode.id()
        oldLayout[nodeID]=[curPos['x'],curPos['y']]
        layoutForSort.push({id:nodeID,x:curPos['x'],y:curPos['y']})
    })

    if(direction=="vertical") layoutForSort.sort(function (a, b) {return a["y"]-b["y"] })
    else if(direction=="horizontal") layoutForSort.sort(function (a, b) {return a["x"]-b["x"] })
    
    var minV=Math.min(...numArr)
    var maxV=Math.max(...numArr)
    if(minV==maxV) return;
    var gap=(maxV-minV)/(selectedNodes.size()-1)
    var newLayout={}
    if(direction=="vertical") var curV=layoutForSort[0]["y"]
    else if(direction=="horizontal") curV=layoutForSort[0]["x"]
    for(var i=0;i<layoutForSort.length;i++){
        var oneNodeInfo=layoutForSort[i]
        if(i==0|| i==layoutForSort.length-1){
            newLayout[oneNodeInfo.id]=[oneNodeInfo['x'],oneNodeInfo['y']]
            continue
        }
        curV+=gap;
        if(direction=="vertical") newLayout[oneNodeInfo.id]=[oneNodeInfo['x'],curV]
        else if(direction=="horizontal") newLayout[oneNodeInfo.id]=[curV,oneNodeInfo['y']]
    }
    this.applyNewLayoutWithUndo(newLayout,oldLayout,"onlyAdjustNodePosition")
}

topologyDOM.prototype.alignSelectedNodes = function (direction) {
    var selectedNodes=this.core.nodes(':selected')
    if(selectedNodes.size()<2) return;
    var numArr=[]
    selectedNodes.forEach(oneNode=>{
        var position=oneNode.position()
        if(direction=="top"|| direction=="bottom") numArr.push(position['y'])
        else if(direction=="left"|| direction=="right") numArr.push(position['x'])
    })
    var targetX=null
    var targetY=null
    if(direction=="top") var targetY= Math.min(...numArr)
    else if(direction=="bottom") var targetY= Math.max(...numArr)
    if(direction=="left") var targetX= Math.min(...numArr)
    else if(direction=="right") var targetX= Math.max(...numArr)
    
    var oldLayout={}
    var newLayout={}
    selectedNodes.forEach(oneNode=>{
        var curPos=oneNode.position()
        var nodeID=oneNode.id()
        oldLayout[nodeID]=[curPos['x'],curPos['y']]
        newLayout[nodeID]=[curPos['x'],curPos['y']]
        if(targetX!=null) newLayout[nodeID][0]=targetX
        if(targetY!=null) newLayout[nodeID][1]=targetY
    })
    this.applyNewLayoutWithUndo(newLayout,oldLayout,"onlyAdjustNodePosition")
}

topologyDOM.prototype.redrawBasedOnLayoutDetail = function (layoutDetail,onlyAdjustNodePosition) {
    //remove all bending edge 
    if(!onlyAdjustNodePosition){
        this.core.edges().forEach(oneEdge=>{
            oneEdge.removeClass('edgebendediting-hasbendpoints')
            oneEdge.removeClass('edgecontrolediting-hascontrolpoints')
            oneEdge.data("cyedgebendeditingWeights",[])
            oneEdge.data("cyedgebendeditingDistances",[])
            oneEdge.data("cyedgecontroleditingWeights",[])
            oneEdge.data("cyedgecontroleditingDistances",[])
        })
    }
    
    
    if(layoutDetail==null) return;
    
    var storedPositions={}
    for(var ind in layoutDetail){
        if(ind == "edges") continue
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

topologyDOM.prototype.applyNewLayoutWithUndo = function (newLayoutDetail,oldLayoutDetail,onlyAdjustNodePosition) {
    //store current layout for undo operation
    this.ur.action( "changeLayout"
        , (arg)=>{
            this.redrawBasedOnLayoutDetail(arg.newLayoutDetail,arg.onlyAdjustNodePosition)        
            return arg
        }
        , (arg)=>{
            this.redrawBasedOnLayoutDetail(arg.oldLayoutDetail,arg.onlyAdjustNodePosition)
            return arg
        }
    )
    this.ur.do("changeLayout"
        , { firstTime: true, "newLayoutDetail": newLayoutDetail, "oldLayoutDetail": oldLayoutDetail,"onlyAdjustNodePosition":onlyAdjustNodePosition}
    )
}

topologyDOM.prototype.applyEdgeBendcontrolPoints = function (srcID,relationshipID
    ,cyedgebendeditingWeights,cyedgebendeditingDistances,cyedgecontroleditingWeights,cyedgecontroleditingDistances) {
        var theNode=this.core.filter('[id = "'+srcID+'"]');
        if(theNode.length==0) return;
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



topologyDOM.prototype.getCurrentLayoutDetail = function () {
    var layoutDict={"edges":{}}
    if(this.core.nodes().size()==0) return layoutDict;
    //store nodes position
    this.core.nodes().forEach(oneNode=>{
        var position=oneNode.position()
        layoutDict[oneNode.id()]=[this.numberPrecision(position['x']),this.numberPrecision(position['y'])]
    })

    //store any edge bending points or controling points
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
    return layoutDict;
}

topologyDOM.prototype.saveLayout = async function (layoutName,adtName) {
    var layoutDict=globalCache.layoutJSON[layoutName]
    if(!layoutDict){
        layoutDict=globalCache.layoutJSON[layoutName]={}
    }
    if(layoutDict["edges"]==null) layoutDict["edges"]={}
    
    var showingLayout=this.getCurrentLayoutDetail()
    var showingEdgesLayout= showingLayout["edges"]
    delete showingLayout["edges"]
    for(var ind in showingLayout) layoutDict[ind]=showingLayout[ind]
    for(var ind in showingEdgesLayout) layoutDict["edges"][ind]=showingEdgesLayout[ind]

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
    return parseFloat(number.toFixed(3))
}

topologyDOM.prototype.COSESelectedNodes = function () {
    this.noPosition_cose(this.core.$(':selected'),this.getCurrentLayoutDetail())
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


topologyDOM.prototype.createConnections = function (resultActions) {
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
    $.post("editADT/createRelations",{actions:JSON.stringify(finalActions)}, (data, status) => {
        if(data=="") return;
        globalCache.storeTwinRelationships_append(data)
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

topologyDOM.prototype.setKeyDownFunc=function(includeCancelConnectOperation){
    $(document).on("keydown",  (e)=>{
        if (e.ctrlKey && e.target.nodeName === 'BODY'){
            if (e.which === 90)   this.ur.undo();
            else if (e.which === 89)    this.ur.redo();
            else if(e.which===83){
                this.broadcastMessage({"message":"popupLayoutEditing"})
                return false
            }
        }
        if (e.keyCode == 27) this.cancelTargetNodeMode()    
    });
}


topologyDOM.prototype.startTargetNodeMode = function (mode) {
    this.core.autounselectify( true );
    this.core.container().style.cursor = 'crosshair';
    this.targetNodeMode=mode;
    this.setKeyDownFunc("includeCancelConnectOperation")

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
    this.setKeyDownFunc()
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

topologyDOM.prototype.noPosition_cose=function(eles,undoLayoutDetail){
    if(eles==null) eles=this.core.elements()

    var newLayout =eles.layout({
        name: 'cose',
        gravity:1,
        animate: false
        ,fit:false
    }) 
    newLayout.run()
    if(undoLayoutDetail){
        var newLayoutDetail=this.getCurrentLayoutDetail()
        this.applyNewLayoutWithUndo(newLayoutDetail, undoLayoutDetail)
    }
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


module.exports = topologyDOM;
},{"./globalCache":4,"./modelAnalyzer":9,"./simpleConfirmDialog":12,"./simpleSelectMenu":13}],16:[function(require,module,exports){
const simpleTree=require("./simpleTree")
const modelAnalyzer=require("./modelAnalyzer")
const globalCache = require("./globalCache")


function twinsTree(DOM, searchDOM) {
    this.tree=new simpleTree(DOM)
    this.modelIDMapToName={}

    this.tree.options.groupNodeIconFunc=(gn)=>{
        var modelClass=gn.info["@id"]
        var colorCode="darkGray"
        var shape="ellipse"
        var avarta=null
        var dimension=20;
        if(globalCache.visualDefinition[globalCache.selectedADT] && globalCache.visualDefinition[globalCache.selectedADT][modelClass]){
            var visualJson =globalCache.visualDefinition[globalCache.selectedADT][modelClass]
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
    if(msgPayload.message=="ADTDatasourceChange_replace") this.ADTDatasourceChange_replace(msgPayload.query, msgPayload.twins,msgPayload.ADTInstanceDoesNotChange)
    else if(msgPayload.message=="ADTDatasourceChange_append") this.ADTDatasourceChange_append(msgPayload.query, msgPayload.twins)
    else if(msgPayload.message=="drawTwinsAndRelations") this.drawTwinsAndRelations(msgPayload.info)
    else if(msgPayload.message=="ADTModelsChange") this.refreshModels(msgPayload.models)
    else if(msgPayload.message=="addNewTwin") this.drawOneTwin(msgPayload.twinInfo)
    else if(msgPayload.message=="addNewTwins") {
        msgPayload.twinsInfo.forEach(oneTwinInfo=>{this.drawOneTwin(oneTwinInfo)})
    }
    else if(msgPayload.message=="twinsDeleted") this.deleteTwins(msgPayload.twinIDArr)
    else if(msgPayload.message=="hideSelectedNodes") this.deleteTwins(msgPayload.twinIDArr)
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

twinsTree.prototype.refreshModels=function(modelsData){
    //delete all group nodes of deleted models
    var arr=[].concat(this.tree.groupNodes)
    arr.forEach((gnode)=>{
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
            data.forEach((oneNode)=>{globalCache.storedTwins[oneNode["$dtId"]] = oneNode});
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
                data.forEach((oneNode)=>{globalCache.storedTwins[oneNode["$dtId"]] = oneNode});
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
                if($.isPlainObject(data[i]["displayName"])){
                    if(data[i]["displayName"]["en"]) data[i]["displayName"]=data[i]["displayName"]["en"]
                    else data[i]["displayName"]=JSON.stringify(data[i]["displayName"])
                }
                if(tmpNameToObj[data[i]["displayName"]]!=null){
                    //repeated model display name
                    data[i]["displayName"]=data[i]["@id"]
                }  
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
                    data.forEach((oneNode)=>{globalCache.storedTwins[oneNode["$dtId"]] = oneNode});
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
    var groupName=this.modelIDMapToName[twinInfo["$metadata"]["$model"]]
    this.tree.addLeafnodeToGroup(groupName,twinInfo,"skipRepeat")
}

twinsTree.prototype.appendAllTwins= function(data){
    var twinIDArr=[]
    //check if any current leaf node does not have stored outbound relationship data yet
    this.tree.groupNodes.forEach((gNode)=>{
        gNode.childLeafNodes.forEach(leafNode=>{
            var nodeId=leafNode.leafInfo["$dtId"]
            if(globalCache.storedOutboundRelationships[nodeId]==null) twinIDArr.push(nodeId)
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
        globalCache.storeTwinRelationships(data) //store them in global available array
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
},{"./globalCache":4,"./modelAnalyzer":9,"./simpleTree":14}]},{},[6])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJwb3J0YWxTb3VyY2VDb2RlL2FkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLmpzIiwicG9ydGFsU291cmNlQ29kZS9lZGl0TGF5b3V0RGlhbG9nLmpzIiwicG9ydGFsU291cmNlQ29kZS9mbG9hdEluZm9XaW5kb3cuanMiLCJwb3J0YWxTb3VyY2VDb2RlL2dsb2JhbENhY2hlLmpzIiwicG9ydGFsU291cmNlQ29kZS9pbmZvUGFuZWwuanMiLCJwb3J0YWxTb3VyY2VDb2RlL21haW4uanMiLCJwb3J0YWxTb3VyY2VDb2RlL21haW5Ub29sYmFyLmpzIiwicG9ydGFsU291cmNlQ29kZS9tYWluVUkuanMiLCJwb3J0YWxTb3VyY2VDb2RlL21vZGVsQW5hbHl6ZXIuanMiLCJwb3J0YWxTb3VyY2VDb2RlL21vZGVsRWRpdG9yRGlhbG9nLmpzIiwicG9ydGFsU291cmNlQ29kZS9tb2RlbE1hbmFnZXJEaWFsb2cuanMiLCJwb3J0YWxTb3VyY2VDb2RlL3NpbXBsZUNvbmZpcm1EaWFsb2cuanMiLCJwb3J0YWxTb3VyY2VDb2RlL3NpbXBsZVNlbGVjdE1lbnUuanMiLCJwb3J0YWxTb3VyY2VDb2RlL3NpbXBsZVRyZWUuanMiLCJwb3J0YWxTb3VyY2VDb2RlL3RvcG9sb2d5RE9NLmpzIiwicG9ydGFsU291cmNlQ29kZS90d2luc1RyZWUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdlRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3A1QkE7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RpQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1b0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0YkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDenJDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiY29uc3Qgc2ltcGxlU2VsZWN0TWVudT0gcmVxdWlyZShcIi4vc2ltcGxlU2VsZWN0TWVudVwiKVxyXG5jb25zdCBzaW1wbGVDb25maXJtRGlhbG9nID0gcmVxdWlyZShcIi4vc2ltcGxlQ29uZmlybURpYWxvZ1wiKVxyXG5jb25zdCBnbG9iYWxDYWNoZSA9IHJlcXVpcmUoXCIuL2dsb2JhbENhY2hlXCIpXHJcblxyXG5mdW5jdGlvbiBhZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZygpIHtcclxuICAgIHRoaXMuZmlsdGVycz17fVxyXG4gICAgdGhpcy5wcmV2aW91c1NlbGVjdGVkQURUPW51bGxcclxuICAgIHRoaXMudGVzdFR3aW5zSW5mbz1udWxsO1xyXG5cclxuICAgIGlmKCF0aGlzLkRPTSl7XHJcbiAgICAgICAgdGhpcy5ET00gPSAkKCc8ZGl2IHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dG9wOjUwJTtiYWNrZ3JvdW5kLWNvbG9yOndoaXRlO2xlZnQ6NTAlO3RyYW5zZm9ybTogdHJhbnNsYXRlWCgtNTAlKSB0cmFuc2xhdGVZKC01MCUpO3otaW5kZXg6MTAxXCIgY2xhc3M9XCJ3My1jYXJkLTJcIj48L2Rpdj4nKVxyXG4gICAgICAgIHRoaXMuRE9NLmNzcyhcIm92ZXJmbG93XCIsXCJoaWRkZW5cIilcclxuICAgICAgICAkKFwiYm9keVwiKS5hcHBlbmQodGhpcy5ET00pXHJcbiAgICAgICAgZ2xvYmFsQ2FjaGUubWFrZURPTURyYWdnYWJsZSh0aGlzLkRPTSlcclxuICAgIH1cclxufVxyXG5cclxuXHJcbmFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLnByb3RvdHlwZS5wcmVwYXJhdGlvbkZ1bmMgPSBhc3luYyBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICAgJC5nZXQoXCJ0d2luc0ZpbHRlci9yZWFkU3RhcnRGaWx0ZXJzXCIsIChkYXRhLCBzdGF0dXMpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmKGRhdGEhPW51bGwgJiYgZGF0YSE9XCJcIikgdGhpcy5maWx0ZXJzPWRhdGE7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKClcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIHJlamVjdChlKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1cclxuXHJcbmFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLnByb3RvdHlwZS5wb3B1cCA9IGZ1bmN0aW9uICgpIHtcclxuICAgICQuZ2V0KFwicXVlcnlBRFQvbGlzdEFEVEluc3RhbmNlXCIsIChkYXRhLCBzdGF0dXMpID0+IHtcclxuICAgICAgICBpZihkYXRhPT1cIlwiKSBkYXRhPVtdXHJcbiAgICAgICAgdmFyIGFkdEFycj1kYXRhO1xyXG4gICAgICAgIGlmIChhZHRBcnIubGVuZ3RoID09IDApIHJldHVybjtcclxuXHJcbiAgICAgICAgdGhpcy5ET00uc2hvdygpXHJcbiAgICAgICAgdGhpcy5ET00uZW1wdHkoKVxyXG4gICAgICAgIHRoaXMuY29udGVudERPTT0kKCc8ZGl2IGNsYXNzPVwidzMtbW9kYWwtY29udGVudFwiIHN0eWxlPVwid2lkdGg6NjUwcHhcIj48L2Rpdj4nKVxyXG4gICAgICAgIHRoaXMuRE9NLmFwcGVuZCh0aGlzLmNvbnRlbnRET00pXHJcbiAgICAgICAgdGhpcy5jb250ZW50RE9NLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwiaGVpZ2h0OjQwcHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cImZvbnQtc2l6ZToxLjVlbVwiPkNob29zZSBEYXRhIFNldDwvZGl2PjwvZGl2PicpKVxyXG4gICAgICAgIHZhciBjbG9zZUJ1dHRvbj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJpZ2h0XCIgc3R5bGU9XCJmb250LXNpemU6MmVtO3BhZGRpbmctdG9wOjRweFwiPsOXPC9idXR0b24+JylcclxuICAgICAgICB0aGlzLmNvbnRlbnRET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZChjbG9zZUJ1dHRvbilcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLmJ1dHRvbkhvbGRlcj0kKFwiPGRpdiBzdHlsZT0naGVpZ2h0OjEwMCUnPjwvZGl2PlwiKVxyXG4gICAgICAgIHRoaXMuY29udGVudERPTS5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKHRoaXMuYnV0dG9uSG9sZGVyKVxyXG4gICAgICAgIGNsb3NlQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgICAgICBpZih0aGlzLnByZXZpb3VzU2VsZWN0ZWRBRFQ9PW51bGwpIHRoaXMudXNlRmlsdGVyVG9SZXBsYWNlKClcclxuICAgICAgICAgICAgdGhpcy5jbG9zZURpYWxvZygpXHJcbiAgICAgICAgfSlcclxuICAgIFxyXG4gICAgICAgIHZhciByb3cxPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXJcIiBzdHlsZT1cInBhZGRpbmc6MnB4XCI+PC9kaXY+JylcclxuICAgICAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKHJvdzEpXHJcbiAgICAgICAgdmFyIGxhYmxlPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1vcGFjaXR5XCIgc3R5bGU9XCJwYWRkaW5nLXJpZ2h0OjVweDtmb250LXNpemU6MS4yZW07XCI+QXp1cmUgRGlnaXRhbCBUd2luIElEIDwvZGl2PicpXHJcbiAgICAgICAgcm93MS5hcHBlbmQobGFibGUpXHJcbiAgICAgICAgdmFyIHN3aXRjaEFEVFNlbGVjdG9yPW5ldyBzaW1wbGVTZWxlY3RNZW51KFwiIFwiLHt3aXRoQm9yZGVyOjEsZm9udFNpemU6XCIxLjJlbVwiLGNvbG9yQ2xhc3M6XCJ3My1saWdodC1ncmF5XCIsYnV0dG9uQ1NTOntcInBhZGRpbmdcIjpcIjVweCAxMHB4XCJ9fSlcclxuICAgICAgICByb3cxLmFwcGVuZChzd2l0Y2hBRFRTZWxlY3Rvci5ET00pXHJcbiAgICAgICAgXHJcbiAgICAgICAgYWR0QXJyLmZvckVhY2goKGFkdEluc3RhbmNlKT0+e1xyXG4gICAgICAgICAgICB2YXIgc3RyID0gYWR0SW5zdGFuY2Uuc3BsaXQoXCIuXCIpWzBdLnJlcGxhY2UoXCJodHRwczovL1wiLCBcIlwiKVxyXG4gICAgICAgICAgICBzd2l0Y2hBRFRTZWxlY3Rvci5hZGRPcHRpb24oc3RyLGFkdEluc3RhbmNlKVxyXG4gICAgICAgICAgICBpZih0aGlzLmZpbHRlcnNbYWR0SW5zdGFuY2VdPT1udWxsKSB0aGlzLmZpbHRlcnNbYWR0SW5zdGFuY2VdPXt9XHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgc3dpdGNoQURUU2VsZWN0b3IuY2FsbEJhY2tfY2xpY2tPcHRpb249KG9wdGlvblRleHQsb3B0aW9uVmFsdWUpPT57XHJcbiAgICAgICAgICAgIHN3aXRjaEFEVFNlbGVjdG9yLmNoYW5nZU5hbWUob3B0aW9uVGV4dClcclxuICAgICAgICAgICAgdGhpcy5zZXRBRFRJbnN0YW5jZShvcHRpb25WYWx1ZSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciByb3cyPSQoJzxkaXYgY2xhc3M9XCJ3My1jZWxsLXJvd1wiPjwvZGl2PicpXHJcbiAgICAgICAgdGhpcy5jb250ZW50RE9NLmFwcGVuZChyb3cyKVxyXG4gICAgICAgIHZhciBsZWZ0U3Bhbj0kKCc8ZGl2IGNsYXNzPVwidzMtY2VsbFwiIHN0eWxlPVwid2lkdGg6MjQwcHg7cGFkZGluZy1yaWdodDo1cHhcIj48L2Rpdj4nKVxyXG4gICAgICAgIFxyXG4gICAgICAgIGxlZnRTcGFuLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwiaGVpZ2h0OjMwcHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cIlwiPkZpbHRlcnM8L2Rpdj48L2Rpdj4nKSlcclxuXHJcbiAgICAgICAgdmFyIGZpbHRlckxpc3Q9JCgnPHVsIGNsYXNzPVwidzMtdWwgdzMtaG92ZXJhYmxlXCI+JylcclxuICAgICAgICBmaWx0ZXJMaXN0LmNzcyh7XCJvdmVyZmxvdy14XCI6XCJoaWRkZW5cIixcIm92ZXJmbG93LXlcIjpcImF1dG9cIixcImhlaWdodFwiOlwiMzQwcHhcIiwgXCJib3JkZXItcmlnaHRcIjpcInNvbGlkIDFweCBsaWdodGdyYXlcIn0pXHJcbiAgICAgICAgbGVmdFNwYW4uYXBwZW5kKGZpbHRlckxpc3QpXHJcblxyXG4gICAgICAgIHRoaXMuZmlsdGVyTGlzdD1maWx0ZXJMaXN0O1xyXG4gICAgICAgIHJvdzIuYXBwZW5kKGxlZnRTcGFuKVxyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciByaWdodFNwYW49JCgnPGRpdiBjbGFzcz1cInczLWNvbnRhaW5lciB3My1jZWxsXCI+PC9kaXY+JylcclxuICAgICAgICByb3cyLmFwcGVuZChyaWdodFNwYW4pIFxyXG5cclxuICAgICAgICB2YXIgcGFuZWxDYXJkPSQoJzxkaXYgY2xhc3M9XCJ3My1jYXJkLTIgdzMtd2hpdGVcIiBzdHlsZT1cInBhZGRpbmc6MTBweFwiPjwvZGl2PicpXHJcbiAgICAgICAgcmlnaHRTcGFuLmFwcGVuZChwYW5lbENhcmQpXHJcbiAgICAgICAgdmFyIHF1ZXJ5U3Bhbj0kKFwiPHNwYW4vPlwiKVxyXG4gICAgICAgIHBhbmVsQ2FyZC5hcHBlbmQocXVlcnlTcGFuKVxyXG4gICAgICAgIFxyXG5cclxuICAgICAgICB2YXIgbmFtZUlucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lXCIgIHBsYWNlaG9sZGVyPVwiQ2hvb3NlIGEgZmlsdGVyIG9yIGZpbGwgaW4gbmV3IGZpbHRlciBuYW1lLi4uXCIvPicpLmFkZENsYXNzKFwidzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgICAgIHRoaXMucXVlcnlOYW1lSW5wdXQ9bmFtZUlucHV0O1xyXG4gICAgICAgIHZhciBxdWVyeUxibD0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyIHczLXJlZFwiIHN0eWxlPVwicGFkZGluZy1sZWZ0OjVweDttYXJnaW4tdG9wOjJweDt3aWR0aDo1MCVcIj5RdWVyeSBTZW50ZW5jZTwvZGl2PicpXHJcbiAgICAgICAgdmFyIHF1ZXJ5SW5wdXQ9JCgnPHRleHRhcmVhIHN0eWxlPVwicmVzaXplOm5vbmU7aGVpZ2h0OjgwcHg7b3V0bGluZTpub25lO21hcmdpbi1ib3R0b206MnB4XCIgIHBsYWNlaG9sZGVyPVwiU2FtcGxlOiBTRUxFQ1QgKiBGUk9NIGRpZ2l0YWx0d2lucyB3aGVyZSBJU19PRl9NT0RFTChcXCdtb2RlbElEXFwnKVwiLz4nKS5hZGRDbGFzcyhcInczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgICAgICB0aGlzLnF1ZXJ5SW5wdXQ9cXVlcnlJbnB1dDtcclxuXHJcbiAgICAgICAgdmFyIHNhdmVCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ob3Zlci1saWdodC1ncmVlbiB3My1ib3JkZXItcmlnaHRcIj5TYXZlIEZpbHRlcjwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIHRlc3RCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ob3Zlci1hbWJlciB3My1ib3JkZXItcmlnaHRcIj5UZXN0IFF1ZXJ5PC9idXR0b24+JylcclxuICAgICAgICB2YXIgZGVsQnRuPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtaG92ZXItcGluayB3My1ib3JkZXItcmlnaHRcIj5EZWxldGUgRmlsdGVyPC9idXR0b24+JylcclxuXHJcblxyXG4gICAgICAgIHRlc3RCdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy50ZXN0UXVlcnkoKX0pXHJcbiAgICAgICAgc2F2ZUJ0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLnNhdmVRdWVyeSgpfSlcclxuICAgICAgICBkZWxCdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5kZWxRdWVyeSgpfSlcclxuICAgICAgICBxdWVyeVNwYW4uYXBwZW5kKG5hbWVJbnB1dCxxdWVyeUxibCxxdWVyeUlucHV0LHNhdmVCdG4sdGVzdEJ0bixkZWxCdG4pXHJcblxyXG4gICAgICAgIHZhciB0ZXN0UmVzdWx0U3Bhbj0kKFwiPGRpdiBjbGFzcz0ndzMtYm9yZGVyJz48L2Rpdj5cIilcclxuICAgICAgICB2YXIgdGVzdFJlc3VsdFRhYmxlPSQoXCI8dGFibGU+PC90YWJsZT5cIilcclxuICAgICAgICB0aGlzLnRlc3RSZXN1bHRUYWJsZT10ZXN0UmVzdWx0VGFibGVcclxuICAgICAgICB0ZXN0UmVzdWx0U3Bhbi5jc3Moe1wibWFyZ2luLXRvcFwiOlwiMnB4XCIsb3ZlcmZsb3c6XCJhdXRvXCIsaGVpZ2h0OlwiMTc1cHhcIix3aWR0aDpcIjQwMHB4XCJ9KVxyXG4gICAgICAgIHRlc3RSZXN1bHRUYWJsZS5jc3Moe1wiYm9yZGVyLWNvbGxhcHNlXCI6XCJjb2xsYXBzZVwifSlcclxuICAgICAgICBwYW5lbENhcmQuYXBwZW5kKHRlc3RSZXN1bHRTcGFuKVxyXG4gICAgICAgIHRlc3RSZXN1bHRTcGFuLmFwcGVuZCh0ZXN0UmVzdWx0VGFibGUpXHJcblxyXG5cclxuICAgICAgICBpZih0aGlzLnByZXZpb3VzU2VsZWN0ZWRBRFQhPW51bGwpe1xyXG4gICAgICAgICAgICBzd2l0Y2hBRFRTZWxlY3Rvci50cmlnZ2VyT3B0aW9uVmFsdWUodGhpcy5wcmV2aW91c1NlbGVjdGVkQURUKVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBzd2l0Y2hBRFRTZWxlY3Rvci50cmlnZ2VyT3B0aW9uSW5kZXgoMClcclxuICAgICAgICB9XHJcblxyXG4gICAgfSk7XHJcbn1cclxuXHJcbmFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLnByb3RvdHlwZS5zZXRBRFRJbnN0YW5jZT1mdW5jdGlvbihzZWxlY3RlZEFEVCl7XHJcbiAgICB0aGlzLmJ1dHRvbkhvbGRlci5lbXB0eSgpXHJcbiAgICBpZih0aGlzLnByZXZpb3VzU2VsZWN0ZWRBRFQ9PW51bGwgfHwgdGhpcy5wcmV2aW91c1NlbGVjdGVkQURUID09IHNlbGVjdGVkQURUKXtcclxuICAgICAgICB2YXIgcmVwbGFjZUJ1dHRvbj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWNhcmQgdzMtZGVlcC1vcmFuZ2UgdzMtaG92ZXItZ3JlZW5cIiBzdHlsZT1cImhlaWdodDoxMDAlOyBtYXJnaW4tcmlnaHQ6OHB4XCI+UmVwbGFjZSBBbGwgRGF0YTwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIGFwcGVuZEJ1dHRvbj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWNhcmQgdzMtZGVlcC1vcmFuZ2UgdzMtaG92ZXItZ3JlZW5cIiBzdHlsZT1cImhlaWdodDoxMDAlXCI+QXBwZW5kIERhdGE8L2J1dHRvbj4nKVxyXG5cclxuICAgICAgICByZXBsYWNlQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+IHsgdGhpcy51c2VGaWx0ZXJUb1JlcGxhY2UoKSAgfSAgKVxyXG4gICAgICAgIGFwcGVuZEJ1dHRvbi5vbihcImNsaWNrXCIsICgpPT4geyB0aGlzLnVzZUZpbHRlclRvQXBwZW5kKCkgIH0gIClcclxuICAgICAgICB0aGlzLmJ1dHRvbkhvbGRlci5hcHBlbmQocmVwbGFjZUJ1dHRvbixhcHBlbmRCdXR0b24pXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB2YXIgcmVwbGFjZUJ1dHRvbj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWdyZWVuIHczLWJvcmRlci1yaWdodFwiIHN0eWxlPVwiaGVpZ2h0OjEwMCVcIj5SZXBsYWNlIEFsbCBEYXRhPC9idXR0b24+JylcclxuICAgICAgICByZXBsYWNlQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+IHsgdGhpcy51c2VGaWx0ZXJUb1JlcGxhY2UoKSAgfSAgKVxyXG4gICAgICAgIHRoaXMuYnV0dG9uSG9sZGVyLmFwcGVuZChyZXBsYWNlQnV0dG9uKVxyXG4gICAgfVxyXG4gICAgZ2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFQgPSBzZWxlY3RlZEFEVFxyXG4gICAgaWYgKCFnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW2dsb2JhbENhY2hlLnNlbGVjdGVkQURUXSlcclxuICAgICAgICAgICAgZ2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVF0gPSB7fVxyXG4gICAgdGhpcy5saXN0RmlsdGVycyhzZWxlY3RlZEFEVClcclxuICAgICQuYWpheFNldHVwKHtcclxuICAgICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgICAgICdhZHRJbnN0YW5jZSc6IGdsb2JhbENhY2hlLnNlbGVjdGVkQURUXHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcblxyXG5hZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZy5wcm90b3R5cGUuZGVsUXVlcnk9ZnVuY3Rpb24oKXtcclxuICAgIHZhciBxdWVyeU5hbWU9dGhpcy5xdWVyeU5hbWVJbnB1dC52YWwoKVxyXG4gICAgaWYocXVlcnlOYW1lPT1cIkFMTFwiIHx8IHF1ZXJ5TmFtZT09XCJcIilyZXR1cm47XHJcbiAgICB2YXIgY29uZmlybURpYWxvZ0Rpdj1uZXcgc2ltcGxlQ29uZmlybURpYWxvZygpXHJcblxyXG4gICAgY29uZmlybURpYWxvZ0Rpdi5zaG93KFxyXG4gICAgICAgIHsgd2lkdGg6IFwiMjUwcHhcIiB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGl0bGU6IFwiQ29uZmlybVwiXHJcbiAgICAgICAgICAgICwgY29udGVudDogXCJQbGVhc2UgY29uZmlybSBkZWxldGluZyBmaWx0ZXIgXFxcIlwiK3F1ZXJ5TmFtZStcIlxcXCI/XCJcclxuICAgICAgICAgICAgLCBidXR0b25zOltcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xvckNsYXNzOiBcInczLXJlZCB3My1ob3Zlci1waW5rXCIsIHRleHQ6IFwiQ29uZmlybVwiLCBcImNsaWNrRnVuY1wiOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucXVlcnlOYW1lSW5wdXQudmFsKFwiXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucXVlcnlJbnB1dC52YWwoXCJcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy50ZXN0UmVzdWx0VGFibGUuZW1wdHkoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5maWx0ZXJzW2dsb2JhbENhY2hlLnNlbGVjdGVkQURUXVtxdWVyeU5hbWVdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubGlzdEZpbHRlcnMoZ2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2hvb3NlT25lRmlsdGVyKFwiXCIsIFwiXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQucG9zdChcInR3aW5zRmlsdGVyL3NhdmVTdGFydEZpbHRlcnNcIiwgeyBmaWx0ZXJzOiB0aGlzLmZpbHRlcnMgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgfX0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1ncmF5XCIsdGV4dDogXCJDYW5jZWxcIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKClcclxuICAgICAgICAgICAgICAgIH19XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9XHJcbiAgICApXHJcbn1cclxuXHJcbmFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLnByb3RvdHlwZS5zYXZlUXVlcnk9ZnVuY3Rpb24oKXtcclxuICAgIHZhciBxdWVyeU5hbWU9dGhpcy5xdWVyeU5hbWVJbnB1dC52YWwoKVxyXG4gICAgdmFyIHF1ZXJ5U3RyPXRoaXMucXVlcnlJbnB1dC52YWwoKVxyXG4gICAgaWYocXVlcnlOYW1lPT1cIlwiKXtcclxuICAgICAgICBhbGVydChcIlBsZWFzZSBmaWxsIGluIHF1ZXJ5IG5hbWVcIilcclxuICAgICAgICByZXR1cm5cclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmZpbHRlcnNbZ2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFRdW3F1ZXJ5TmFtZV09cXVlcnlTdHJcclxuICAgIHRoaXMubGlzdEZpbHRlcnMoZ2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFQpXHJcblxyXG4gICAgdGhpcy5maWx0ZXJMaXN0LmNoaWxkcmVuKCkuZWFjaCgoaW5kZXgsZWxlKT0+e1xyXG4gICAgICAgIGlmKCQoZWxlKS5kYXRhKFwiZmlsdGVyTmFtZVwiKT09cXVlcnlOYW1lKSB7XHJcbiAgICAgICAgICAgICQoZWxlKS50cmlnZ2VyKFwiY2xpY2tcIilcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG5cclxuICAgIC8vc3RvcmUgZmlsdGVycyB0byBzZXJ2ZXIgc2lkZSBhcyBhIGZpbGVcclxuICAgICQucG9zdChcInR3aW5zRmlsdGVyL3NhdmVTdGFydEZpbHRlcnNcIix7ZmlsdGVyczp0aGlzLmZpbHRlcnN9KVxyXG59XHJcblxyXG5hZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZy5wcm90b3R5cGUudGVzdFF1ZXJ5PWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLnRlc3RSZXN1bHRUYWJsZS5lbXB0eSgpXHJcbiAgICB2YXIgcXVlcnlTdHI9IHRoaXMucXVlcnlJbnB1dC52YWwoKVxyXG4gICAgaWYocXVlcnlTdHI9PVwiXCIpIHJldHVybjtcclxuICAgICQucG9zdChcInF1ZXJ5QURUL2FsbFR3aW5zSW5mb1wiLHtxdWVyeTpxdWVyeVN0cn0sIChkYXRhKT0+IHtcclxuICAgICAgICBpZihkYXRhPT1cIlwiKSBkYXRhPVtdXHJcbiAgICAgICAgaWYoIUFycmF5LmlzQXJyYXkoZGF0YSkpIHtcclxuICAgICAgICAgICAgYWxlcnQoXCJRdWVyeSBpcyBub3QgY29ycmVjdCFcIilcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnRlc3RUd2luc0luZm89ZGF0YVxyXG4gICAgICAgIGlmKGRhdGEubGVuZ3RoPT0wKXtcclxuICAgICAgICAgICAgdmFyIHRyPSQoJzx0cj48dGQgc3R5bGU9XCJjb2xvcjpncmF5XCI+emVybyByZWNvcmQ8L3RkPjx0ZCBzdHlsZT1cImJvcmRlci1ib3R0b206c29saWQgMXB4IGxpZ2h0Z3JleVwiPjwvdGQ+PC90cj4nKVxyXG4gICAgICAgICAgICB0aGlzLnRlc3RSZXN1bHRUYWJsZS5hcHBlbmQodHIpXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHZhciB0cj0kKCc8dHI+PHRkIHN0eWxlPVwiYm9yZGVyLXJpZ2h0OnNvbGlkIDFweCBsaWdodGdyZXk7Ym9yZGVyLWJvdHRvbTpzb2xpZCAxcHggbGlnaHRncmV5O2ZvbnQtd2VpZ2h0OmJvbGRcIj5JRDwvdGQ+PHRkIHN0eWxlPVwiYm9yZGVyLWJvdHRvbTpzb2xpZCAxcHggbGlnaHRncmV5O2ZvbnQtd2VpZ2h0OmJvbGRcIj5NT0RFTDwvdGQ+PC90cj4nKVxyXG4gICAgICAgICAgICB0aGlzLnRlc3RSZXN1bHRUYWJsZS5hcHBlbmQodHIpXHJcbiAgICAgICAgICAgIGRhdGEuZm9yRWFjaCgob25lTm9kZSk9PntcclxuICAgICAgICAgICAgICAgIGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW29uZU5vZGVbXCIkZHRJZFwiXV0gPSBvbmVOb2RlO1xyXG4gICAgICAgICAgICAgICAgdmFyIHRyPSQoJzx0cj48dGQgc3R5bGU9XCJib3JkZXItcmlnaHQ6c29saWQgMXB4IGxpZ2h0Z3JleTtib3JkZXItYm90dG9tOnNvbGlkIDFweCBsaWdodGdyZXlcIj4nK29uZU5vZGVbXCIkZHRJZFwiXSsnPC90ZD48dGQgc3R5bGU9XCJib3JkZXItYm90dG9tOnNvbGlkIDFweCBsaWdodGdyZXlcIj4nK29uZU5vZGVbJyRtZXRhZGF0YSddWyckbW9kZWwnXSsnPC90ZD48L3RyPicpXHJcbiAgICAgICAgICAgICAgICB0aGlzLnRlc3RSZXN1bHRUYWJsZS5hcHBlbmQodHIpXHJcbiAgICAgICAgICAgIH0pICAgIFxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcblxyXG5hZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZy5wcm90b3R5cGUubGlzdEZpbHRlcnM9ZnVuY3Rpb24oYWR0SW5zdGFuY2VOYW1lKXtcclxuICAgIHZhciBhdmFpbGFibGVGaWx0ZXJzPXRoaXMuZmlsdGVyc1thZHRJbnN0YW5jZU5hbWVdXHJcbiAgICBhdmFpbGFibGVGaWx0ZXJzW1wiQUxMXCJdPVwiU0VMRUNUICogRlJPTSBkaWdpdGFsdHdpbnNcIlxyXG5cclxuICAgIHZhciBmaWx0ZXJMaXN0PXRoaXMuZmlsdGVyTGlzdDtcclxuICAgIGZpbHRlckxpc3QuZW1wdHkoKVxyXG5cclxuICAgIGZvcih2YXIgZmlsdGVyTmFtZSBpbiBhdmFpbGFibGVGaWx0ZXJzKXtcclxuICAgICAgICB2YXIgb25lRmlsdGVyPSQoJzxsaSBzdHlsZT1cImZvbnQtc2l6ZToxZW1cIj4nK2ZpbHRlck5hbWUrJzwvbGk+JylcclxuICAgICAgICBvbmVGaWx0ZXIuY3NzKFwiY3Vyc29yXCIsXCJkZWZhdWx0XCIpXHJcbiAgICAgICAgb25lRmlsdGVyLmRhdGEoXCJmaWx0ZXJOYW1lXCIsIGZpbHRlck5hbWUpXHJcbiAgICAgICAgb25lRmlsdGVyLmRhdGEoXCJmaWx0ZXJRdWVyeVwiLCBhdmFpbGFibGVGaWx0ZXJzW2ZpbHRlck5hbWVdKVxyXG4gICAgICAgIGlmKGZpbHRlck5hbWU9PVwiQUxMXCIpIGZpbHRlckxpc3QucHJlcGVuZChvbmVGaWx0ZXIpXHJcbiAgICAgICAgZWxzZSBmaWx0ZXJMaXN0LmFwcGVuZChvbmVGaWx0ZXIpXHJcbiAgICAgICAgdGhpcy5hc3NpZ25FdmVudFRvT25lRmlsdGVyKG9uZUZpbHRlcilcclxuICAgICAgICBpZihmaWx0ZXJOYW1lPT1cIkFMTFwiKSBvbmVGaWx0ZXIudHJpZ2dlcihcImNsaWNrXCIpXHJcbiAgICAgICAgXHJcbiAgICAgICAgb25lRmlsdGVyLm9uKFwiZGJsY2xpY2tcIiwoZSk9PntcclxuICAgICAgICAgICAgaWYodGhpcy5wcmV2aW91c1NlbGVjdGVkQURUID09IGdsb2JhbENhY2hlLnNlbGVjdGVkQURUKSB0aGlzLnVzZUZpbHRlclRvQXBwZW5kKCk7XHJcbiAgICAgICAgICAgIGVsc2UgdGhpcy51c2VGaWx0ZXJUb1JlcGxhY2UoKTtcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxufVxyXG5cclxuYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cucHJvdG90eXBlLmFzc2lnbkV2ZW50VG9PbmVGaWx0ZXI9ZnVuY3Rpb24ob25lRmlsdGVyKXtcclxuICAgIG9uZUZpbHRlci5vbihcImNsaWNrXCIsKGUpPT57XHJcbiAgICAgICAgdGhpcy5maWx0ZXJMaXN0LmNoaWxkcmVuKCkuZWFjaCgoaW5kZXgsZWxlKT0+e1xyXG4gICAgICAgICAgICAkKGVsZSkucmVtb3ZlQ2xhc3MoXCJ3My1hbWJlclwiKVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgb25lRmlsdGVyLmFkZENsYXNzKFwidzMtYW1iZXJcIilcclxuICAgICAgICB2YXIgZmlsdGVyTmFtZT1vbmVGaWx0ZXIuZGF0YSgnZmlsdGVyTmFtZScpXHJcbiAgICAgICAgdmFyIHF1ZXJ5U3RyPW9uZUZpbHRlci5kYXRhKCdmaWx0ZXJRdWVyeScpXHJcbiAgICAgICAgdGhpcy5jaG9vc2VPbmVGaWx0ZXIoZmlsdGVyTmFtZSxxdWVyeVN0cilcclxuICAgIH0pXHJcbn1cclxuXHJcbmFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLnByb3RvdHlwZS51c2VGaWx0ZXJUb0FwcGVuZD1mdW5jdGlvbigpe1xyXG4gICAgaWYodGhpcy5xdWVyeUlucHV0LnZhbCgpPT1cIlwiKXtcclxuICAgICAgICBhbGVydChcIlBsZWFzZSBmaWxsIGluIHF1ZXJ5IHRvIGZldGNoIGRhdGEgZnJvbSBkaWdpdGFsIHR3aW4gc2VydmljZS4uXCIpXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgaWYodGhpcy5wcmV2aW91c1NlbGVjdGVkQURUPT1udWxsKXtcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJBRFREYXRhc291cmNlQ2hhbmdlX3JlcGxhY2VcIiwgXCJxdWVyeVwiOiB0aGlzLnF1ZXJ5SW5wdXQudmFsKCksIFwidHdpbnNcIjp0aGlzLnRlc3RUd2luc0luZm8gfSlcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHRoaXMucHJldmlvdXNTZWxlY3RlZEFEVD1nbG9iYWxDYWNoZS5zZWxlY3RlZEFEVFxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcIkFEVERhdGFzb3VyY2VDaGFuZ2VfYXBwZW5kXCIsIFwicXVlcnlcIjogdGhpcy5xdWVyeUlucHV0LnZhbCgpLCBcInR3aW5zXCI6dGhpcy50ZXN0VHdpbnNJbmZvIH0pXHJcbiAgICB9XHJcbiAgICB0aGlzLmNsb3NlRGlhbG9nKClcclxufVxyXG5cclxuYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cucHJvdG90eXBlLmNsb3NlRGlhbG9nPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLkRPTS5oaWRlKClcclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcIkFEVERhdGFzb3VyY2VEaWFsb2dfY2xvc2VkXCJ9KVxyXG59XHJcblxyXG5hZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZy5wcm90b3R5cGUudXNlRmlsdGVyVG9SZXBsYWNlPWZ1bmN0aW9uKCl7XHJcbiAgICBpZih0aGlzLnF1ZXJ5SW5wdXQudmFsKCk9PVwiXCIpe1xyXG4gICAgICAgIGFsZXJ0KFwiUGxlYXNlIGZpbGwgaW4gcXVlcnkgdG8gZmV0Y2ggZGF0YSBmcm9tIGRpZ2l0YWwgdHdpbiBzZXJ2aWNlLi5cIilcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB2YXIgQURUSW5zdGFuY2VEb2VzTm90Q2hhbmdlPXRydWVcclxuICAgIGlmKHRoaXMucHJldmlvdXNTZWxlY3RlZEFEVCE9Z2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFQpe1xyXG4gICAgICAgIGZvcih2YXIgaW5kIGluIGdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwcykgZGVsZXRlIGdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tpbmRdXHJcbiAgICAgICAgZm9yKHZhciBpbmQgaW4gZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnMpIGRlbGV0ZSBnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1tpbmRdXHJcbiAgICAgICAgQURUSW5zdGFuY2VEb2VzTm90Q2hhbmdlPWZhbHNlXHJcbiAgICB9XHJcbiAgICB0aGlzLnByZXZpb3VzU2VsZWN0ZWRBRFQ9Z2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFRcclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcIkFEVERhdGFzb3VyY2VDaGFuZ2VfcmVwbGFjZVwiLCBcInF1ZXJ5XCI6IHRoaXMucXVlcnlJbnB1dC52YWwoKVxyXG4gICAgLCBcInR3aW5zXCI6dGhpcy50ZXN0VHdpbnNJbmZvLCBcIkFEVEluc3RhbmNlRG9lc05vdENoYW5nZVwiOkFEVEluc3RhbmNlRG9lc05vdENoYW5nZSB9KVxyXG4gICAgXHJcbiAgICB0aGlzLmNsb3NlRGlhbG9nKClcclxufVxyXG5cclxuYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cucHJvdG90eXBlLmNob29zZU9uZUZpbHRlcj1mdW5jdGlvbihxdWVyeU5hbWUscXVlcnlTdHIpe1xyXG4gICAgdGhpcy5xdWVyeU5hbWVJbnB1dC52YWwocXVlcnlOYW1lKVxyXG4gICAgdGhpcy5xdWVyeUlucHV0LnZhbChxdWVyeVN0cilcclxuICAgIHRoaXMudGVzdFJlc3VsdFRhYmxlLmVtcHR5KClcclxuICAgIHRoaXMudGVzdFR3aW5zSW5mbz1udWxsXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IGFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nKCk7IiwiY29uc3Qgc2ltcGxlU2VsZWN0TWVudT0gcmVxdWlyZShcIi4vc2ltcGxlU2VsZWN0TWVudVwiKVxyXG5jb25zdCBzaW1wbGVDb25maXJtRGlhbG9nID0gcmVxdWlyZShcIi4vc2ltcGxlQ29uZmlybURpYWxvZ1wiKVxyXG5jb25zdCBnbG9iYWxDYWNoZSA9IHJlcXVpcmUoXCIuL2dsb2JhbENhY2hlXCIpXHJcblxyXG5mdW5jdGlvbiBlZGl0TGF5b3V0RGlhbG9nKCkge1xyXG4gICAgaWYoIXRoaXMuRE9NKXtcclxuICAgICAgICB0aGlzLkRPTSA9ICQoJzxkaXYgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO2JhY2tncm91bmQtY29sb3I6d2hpdGU7bGVmdDo1MCU7dHJhbnNmb3JtOiB0cmFuc2xhdGVYKC01MCUpIHRyYW5zbGF0ZVkoLTUwJSk7ei1pbmRleDoxMDFcIiBjbGFzcz1cInczLWNhcmQtMlwiPjwvZGl2PicpXHJcbiAgICAgICAgJChcImJvZHlcIikuYXBwZW5kKHRoaXMuRE9NKVxyXG4gICAgICAgIHRoaXMuRE9NLmhpZGUoKVxyXG4gICAgICAgIGdsb2JhbENhY2hlLm1ha2VET01EcmFnZ2FibGUodGhpcy5ET00pXHJcbiAgICB9XHJcbn1cclxuXHJcbmVkaXRMYXlvdXREaWFsb2cucHJvdG90eXBlLmdldEN1ckFEVE5hbWU9ZnVuY3Rpb24oKXtcclxuICAgIHZhciBhZHROYW1lID0gZ2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFRcclxuICAgIHZhciBzdHIgPSBhZHROYW1lLnJlcGxhY2UoXCJodHRwczovL1wiLCBcIlwiKVxyXG4gICAgcmV0dXJuIHN0clxyXG59XHJcblxyXG5lZGl0TGF5b3V0RGlhbG9nLnByb3RvdHlwZS5yeE1lc3NhZ2U9ZnVuY3Rpb24obXNnUGF5bG9hZCl7XHJcbiAgICBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiQURURGF0YXNvdXJjZUNoYW5nZV9yZXBsYWNlXCIpIHtcclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgICQucG9zdChcImxheW91dC9yZWFkTGF5b3V0c1wiLHthZHROYW1lOnRoaXMuZ2V0Q3VyQURUTmFtZSgpfSwgKGRhdGEsIHN0YXR1cykgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYoZGF0YSE9XCJcIiAmJiB0eXBlb2YoZGF0YSk9PT1cIm9iamVjdFwiKSBnbG9iYWxDYWNoZS5sYXlvdXRKU09OPWRhdGE7XHJcbiAgICAgICAgICAgICAgICBlbHNlIGdsb2JhbENhY2hlLmxheW91dEpTT049e307XHJcbiAgICAgICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJsYXlvdXRzVXBkYXRlZFwifSlcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGUpXHJcbiAgICAgICAgfVxyXG4gICAgXHJcbiAgICB9XHJcbn1cclxuXHJcbmVkaXRMYXlvdXREaWFsb2cucHJvdG90eXBlLnJlZmlsbE9wdGlvbnMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmNsZWFyT3B0aW9ucygpXHJcbiAgICBcclxuICAgIGZvcih2YXIgaW5kIGluIGdsb2JhbENhY2hlLmxheW91dEpTT04pe1xyXG4gICAgICAgIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuYWRkT3B0aW9uKGluZClcclxuICAgIH1cclxufVxyXG5cclxuZWRpdExheW91dERpYWxvZy5wcm90b3R5cGUucG9wdXAgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLkRPTS5zaG93KClcclxuICAgIHRoaXMuRE9NLmVtcHR5KClcclxuXHJcbiAgICB0aGlzLkRPTS5jc3Moe1wid2lkdGhcIjpcIjMyMHB4XCIsXCJwYWRkaW5nLWJvdHRvbVwiOlwiM3B4XCJ9KVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6NDBweDttYXJnaW4tYm90dG9tOjJweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiZm9udC1zaXplOjEuMmVtXCI+TGF5b3V0PC9kaXY+PC9kaXY+JykpXHJcbiAgICB2YXIgY2xvc2VCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJpZ2h0XCIgc3R5bGU9XCJmb250LXNpemU6MmVtO3BhZGRpbmctdG9wOjRweFwiPsOXPC9idXR0b24+JylcclxuICAgIHRoaXMuRE9NLmNoaWxkcmVuKCc6Zmlyc3QnKS5hcHBlbmQoY2xvc2VCdXR0b24pXHJcbiAgICBjbG9zZUJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5ET00uaGlkZSgpIH0pXHJcblxyXG4gICAgdmFyIG5hbWVJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTsgd2lkdGg6MTgwcHg7IGRpc3BsYXk6aW5saW5lO21hcmdpbi1sZWZ0OjJweDttYXJnaW4tcmlnaHQ6MnB4XCIgIHBsYWNlaG9sZGVyPVwiRmlsbCBpbiBhIG5ldyBsYXlvdXQgbmFtZS4uLlwiLz4nKS5hZGRDbGFzcyhcInczLWlucHV0IHczLWJvcmRlclwiKTsgICBcclxuICAgIHRoaXMuRE9NLmFwcGVuZChuYW1lSW5wdXQpXHJcbiAgICB2YXIgc2F2ZUFzTmV3QnRuPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtZ3JlZW4gdzMtaG92ZXItbGlnaHQtZ3JlZW5cIj5TYXZlIE5ldyBMYXlvdXQ8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKHNhdmVBc05ld0J0bilcclxuICAgIHNhdmVBc05ld0J0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLnNhdmVJbnRvTGF5b3V0KG5hbWVJbnB1dC52YWwoKSl9KVxyXG5cclxuXHJcbiAgICBpZighJC5pc0VtcHR5T2JqZWN0KGdsb2JhbENhY2hlLmxheW91dEpTT04pKXtcclxuICAgICAgICB2YXIgbGJsPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXIgdzMtcGFkZGluZy0xNlwiIHN0eWxlPVwidGV4dC1hbGlnbjpjZW50ZXI7XCI+LSBPUiAtPC9kaXY+JylcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQobGJsKSBcclxuICAgICAgICB2YXIgc3dpdGNoTGF5b3V0U2VsZWN0b3I9bmV3IHNpbXBsZVNlbGVjdE1lbnUoXCJcIix7Zm9udFNpemU6XCIxZW1cIixjb2xvckNsYXNzOlwidzMtbGlnaHQtZ3JheVwiLHdpZHRoOlwiMTIwcHhcIn0pXHJcbiAgICAgICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvcj1zd2l0Y2hMYXlvdXRTZWxlY3RvclxyXG4gICAgICAgIHRoaXMucmVmaWxsT3B0aW9ucygpXHJcbiAgICAgICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jYWxsQmFja19jbGlja09wdGlvbj0ob3B0aW9uVGV4dCxvcHRpb25WYWx1ZSk9PntcclxuICAgICAgICAgICAgaWYob3B0aW9uVGV4dD09bnVsbCkgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jaGFuZ2VOYW1lKFwiIFwiKVxyXG4gICAgICAgICAgICBlbHNlIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuY2hhbmdlTmFtZShvcHRpb25UZXh0KVxyXG4gICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgdmFyIHNhdmVBc0J0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWdyZWVuIHczLWhvdmVyLWxpZ2h0LWdyZWVuXCIgc3R5bGU9XCJtYXJnaW4tbGVmdDoycHg7bWFyZ2luLXJpZ2h0OjVweFwiPlNhdmUgQXM8L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBkZWxldGVCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1yZWQgdzMtaG92ZXItcGlua1wiIHN0eWxlPVwibWFyZ2luLWxlZnQ6NXB4XCI+RGVsZXRlIExheW91dDwvYnV0dG9uPicpXHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKHNhdmVBc0J0bixzd2l0Y2hMYXlvdXRTZWxlY3Rvci5ET00sZGVsZXRlQnRuKVxyXG4gICAgICAgIHNhdmVBc0J0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLnNhdmVJbnRvTGF5b3V0KHN3aXRjaExheW91dFNlbGVjdG9yLmN1clNlbGVjdFZhbCl9KVxyXG4gICAgICAgIGRlbGV0ZUJ0bi5vbihcImNsaWNrXCIsKCk9Pnt0aGlzLmRlbGV0ZUxheW91dChzd2l0Y2hMYXlvdXRTZWxlY3Rvci5jdXJTZWxlY3RWYWwpfSlcclxuXHJcbiAgICAgICAgaWYoZ2xvYmFsQ2FjaGUuY3VycmVudExheW91dE5hbWUhPW51bGwpe1xyXG4gICAgICAgICAgICBzd2l0Y2hMYXlvdXRTZWxlY3Rvci50cmlnZ2VyT3B0aW9uVmFsdWUoZ2xvYmFsQ2FjaGUuY3VycmVudExheW91dE5hbWUpXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHN3aXRjaExheW91dFNlbGVjdG9yLnRyaWdnZXJPcHRpb25JbmRleCgwKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuZWRpdExheW91dERpYWxvZy5wcm90b3R5cGUuc2F2ZUludG9MYXlvdXQgPSBmdW5jdGlvbiAobGF5b3V0TmFtZSkge1xyXG4gICAgaWYobGF5b3V0TmFtZT09XCJcIiB8fCBsYXlvdXROYW1lPT1udWxsKXtcclxuICAgICAgICBhbGVydChcIlBsZWFzZSBjaG9vc2UgdGFyZ2V0IGxheW91dCBOYW1lXCIpXHJcbiAgICAgICAgcmV0dXJuXHJcbiAgICB9XHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJzYXZlTGF5b3V0XCIsIFwibGF5b3V0TmFtZVwiOiBsYXlvdXROYW1lLCBcImFkdE5hbWVcIjp0aGlzLmdldEN1ckFEVE5hbWUoKSB9KVxyXG4gICAgdGhpcy5ET00uaGlkZSgpXHJcbn1cclxuXHJcblxyXG5lZGl0TGF5b3V0RGlhbG9nLnByb3RvdHlwZS5kZWxldGVMYXlvdXQgPSBmdW5jdGlvbiAobGF5b3V0TmFtZSkge1xyXG4gICAgaWYobGF5b3V0TmFtZT09XCJcIiB8fCBsYXlvdXROYW1lPT1udWxsKXtcclxuICAgICAgICBhbGVydChcIlBsZWFzZSBjaG9vc2UgdGFyZ2V0IGxheW91dCBOYW1lXCIpXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBjb25maXJtRGlhbG9nRGl2PW5ldyBzaW1wbGVDb25maXJtRGlhbG9nKClcclxuXHJcbiAgICBjb25maXJtRGlhbG9nRGl2LnNob3coXHJcbiAgICAgICAgeyB3aWR0aDogXCIyNTBweFwiIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJDb25maXJtXCJcclxuICAgICAgICAgICAgLCBjb250ZW50OiBcIlBsZWFzZSBjb25maXJtIGRlbGV0aW5nIGxheW91dCBcXFwiXCIgKyBsYXlvdXROYW1lICsgXCJcXFwiP1wiXHJcbiAgICAgICAgICAgICwgYnV0dG9uczpbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1yZWQgdzMtaG92ZXItcGlua1wiLCB0ZXh0OiBcIkNvbmZpcm1cIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgZ2xvYmFsQ2FjaGUubGF5b3V0SlNPTltsYXlvdXROYW1lXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAobGF5b3V0TmFtZSA9PSBnbG9iYWxDYWNoZS5jdXJyZW50TGF5b3V0TmFtZSkgZ2xvYmFsQ2FjaGUuY3VycmVudExheW91dE5hbWUgPSBudWxsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImxheW91dHNVcGRhdGVkXCIgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgJC5wb3N0KFwibGF5b3V0L3NhdmVMYXlvdXRzXCIsIHsgXCJhZHROYW1lXCI6IHRoaXMuZ2V0Q3VyQURUTmFtZSgpLCBcImxheW91dHNcIjogSlNPTi5zdHJpbmdpZnkoZ2xvYmFsQ2FjaGUubGF5b3V0SlNPTikgfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlZmlsbE9wdGlvbnMoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLnRyaWdnZXJPcHRpb25JbmRleCgwKVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1ncmF5XCIsdGV4dDogXCJDYW5jZWxcIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKClcclxuICAgICAgICAgICAgICAgIH19XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9XHJcbiAgICApXHJcblxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBlZGl0TGF5b3V0RGlhbG9nKCk7IiwiY29uc3QgbW9kZWxBbmFseXplciA9IHJlcXVpcmUoXCIuL21vZGVsQW5hbHl6ZXJcIik7XHJcbmNvbnN0IGdsb2JhbENhY2hlID0gcmVxdWlyZShcIi4vZ2xvYmFsQ2FjaGVcIilcclxuXHJcbmZ1bmN0aW9uIGZsb2F0SW5mb1dpbmRvdygpIHtcclxuICAgIGlmKCF0aGlzLkRPTSl7XHJcbiAgICAgICAgdGhpcy5ET009JCgnPGRpdiBjbGFzcz1cInczLWNhcmRcIiBzdHlsZT1cInBhZGRpbmc6MTBweDsgcG9zaXRpb246YWJzb2x1dGU7ei1pbmRleDoxMDE7bWluLWhlaWdodDoxMjBweFwiPjwvZGl2PicpXHJcbiAgICAgICAgdGhpcy5oaWRlU2VsZigpXHJcbiAgICAgICAgdGhpcy5ET00uY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiLFwicmdiYSgyNTUsIDI1NSwgMjU1LCAwLjkpXCIpXHJcbiAgICAgICAgJCgnYm9keScpLmFwcGVuZCh0aGlzLkRPTSlcclxuICAgIH1cclxufVxyXG5cclxuZmxvYXRJbmZvV2luZG93LnByb3RvdHlwZS5oaWRlU2VsZj1mdW5jdGlvbihtc2dQYXlsb2FkKXtcclxuICAgIHRoaXMuRE9NLmhpZGUoKVxyXG4gICAgdGhpcy5ET00uY3NzKFwid2lkdGhcIixcIjBweFwiKSBcclxufVxyXG5mbG9hdEluZm9XaW5kb3cucHJvdG90eXBlLnNob3dTZWxmPWZ1bmN0aW9uKG1zZ1BheWxvYWQpe1xyXG4gICAgdGhpcy5ET00uY3NzKFwid2lkdGhcIixcIjI5NXB4XCIpXHJcbiAgICB0aGlzLkRPTS5zaG93KClcclxufVxyXG5cclxuZmxvYXRJbmZvV2luZG93LnByb3RvdHlwZS5yeE1lc3NhZ2U9ZnVuY3Rpb24obXNnUGF5bG9hZCl7ICAgXHJcbiAgICBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwidG9wb2xvZ3lNb3VzZU91dFwiKXtcclxuICAgICAgICB0aGlzLmhpZGVTZWxmKClcclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJzaG93SW5mb0hvdmVyZWRFbGVcIil7XHJcbiAgICAgICAgaWYoIWdsb2JhbENhY2hlLnNob3dGbG9hdEluZm9QYW5lbCkgcmV0dXJuO1xyXG4gICAgICAgIHRoaXMuRE9NLmVtcHR5KClcclxuICAgICAgICBcclxuICAgICAgICB2YXIgYXJyPW1zZ1BheWxvYWQuaW5mbztcclxuICAgICAgICBpZihhcnI9PW51bGwgfHwgYXJyLmxlbmd0aD09MCkgIHJldHVybjtcclxuICAgICAgICB0aGlzLkRPTS5jc3MoXCJsZWZ0XCIsXCItMjAwMHB4XCIpIC8vaXQgaXMgYWx3YXlzIG91dHNpZGUgb2YgYnJvd3NlciBzbyBpdCB3b250IGJsb2NrIG1vdXNlIGFuZCBjYXVzZSBtb3VzZSBvdXRcclxuICAgICAgICB0aGlzLnNob3dTZWxmKClcclxuICAgICAgICBcclxuICAgICAgICB2YXIgZG9jdW1lbnRCb2R5V2lkdGg9JCgnYm9keScpLndpZHRoKClcclxuXHJcbiAgICAgICAgdmFyIHNpbmdsZUVsZW1lbnRJbmZvPWFyclswXTtcclxuICAgICAgICBpZihzaW5nbGVFbGVtZW50SW5mb1tcIiRkdElkXCJdKXsvLyBzZWxlY3QgYSBub2RlXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd1N0YXRpY0luZm8odGhpcy5ET00se1wiJGR0SWRcIjpzaW5nbGVFbGVtZW50SW5mb1tcIiRkdElkXCJdfSxcIjFlbVwiLFwiMTNweFwiKVxyXG4gICAgICAgICAgICB2YXIgbW9kZWxOYW1lPXNpbmdsZUVsZW1lbnRJbmZvWyckbWV0YWRhdGEnXVsnJG1vZGVsJ11cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmKG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbE5hbWVdKXtcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhd0VkaXRhYmxlKHRoaXMuRE9NLG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbE5hbWVdLmVkaXRhYmxlUHJvcGVydGllcyxzaW5nbGVFbGVtZW50SW5mbyxbXSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmRyYXdTdGF0aWNJbmZvKHRoaXMuRE9NLHtcIiRldGFnXCI6c2luZ2xlRWxlbWVudEluZm9bXCIkZXRhZ1wiXSxcIiRtZXRhZGF0YVwiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJG1ldGFkYXRhXCJdfSxcIjFlbVwiLFwiMTBweFwiKVxyXG4gICAgICAgIH1lbHNlIGlmKHNpbmdsZUVsZW1lbnRJbmZvW1wiJHNvdXJjZUlkXCJdKXtcclxuICAgICAgICAgICAgdGhpcy5kcmF3U3RhdGljSW5mbyh0aGlzLkRPTSx7XHJcbiAgICAgICAgICAgICAgICBcIiRzb3VyY2VJZFwiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJHNvdXJjZUlkXCJdLFxyXG4gICAgICAgICAgICAgICAgXCIkdGFyZ2V0SWRcIjpzaW5nbGVFbGVtZW50SW5mb1tcIiR0YXJnZXRJZFwiXSxcclxuICAgICAgICAgICAgICAgIFwiJHJlbGF0aW9uc2hpcE5hbWVcIjpzaW5nbGVFbGVtZW50SW5mb1tcIiRyZWxhdGlvbnNoaXBOYW1lXCJdXHJcbiAgICAgICAgICAgIH0sXCIxZW1cIixcIjEzcHhcIilcclxuICAgICAgICAgICAgdGhpcy5kcmF3U3RhdGljSW5mbyh0aGlzLkRPTSx7XHJcbiAgICAgICAgICAgICAgICBcIiRyZWxhdGlvbnNoaXBJZFwiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJHJlbGF0aW9uc2hpcElkXCJdXHJcbiAgICAgICAgICAgIH0sXCIxZW1cIixcIjEwcHhcIilcclxuICAgICAgICAgICAgdmFyIHJlbGF0aW9uc2hpcE5hbWU9c2luZ2xlRWxlbWVudEluZm9bXCIkcmVsYXRpb25zaGlwTmFtZVwiXVxyXG4gICAgICAgICAgICB2YXIgc291cmNlTW9kZWw9c2luZ2xlRWxlbWVudEluZm9bXCJzb3VyY2VNb2RlbFwiXVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdGhpcy5kcmF3RWRpdGFibGUodGhpcy5ET00sdGhpcy5nZXRSZWxhdGlvblNoaXBFZGl0YWJsZVByb3BlcnRpZXMocmVsYXRpb25zaGlwTmFtZSxzb3VyY2VNb2RlbCksc2luZ2xlRWxlbWVudEluZm8sW10pXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd1N0YXRpY0luZm8odGhpcy5ET00se1wiJGV0YWdcIjpzaW5nbGVFbGVtZW50SW5mb1tcIiRldGFnXCJdfSxcIjFlbVwiLFwiMTBweFwiLFwiRGFya0dyYXlcIilcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBzY3JlZW5YWT0gbXNnUGF5bG9hZC5zY3JlZW5YWVxyXG4gICAgICAgIHZhciB3aW5kb3dMZWZ0PXNjcmVlblhZLngrNTBcclxuXHJcbiAgICAgICAgaWYod2luZG93TGVmdCt0aGlzLkRPTS5vdXRlcldpZHRoKCkrMTA+ZG9jdW1lbnRCb2R5V2lkdGgpIHtcclxuICAgICAgICAgICAgd2luZG93TGVmdD1kb2N1bWVudEJvZHlXaWR0aC10aGlzLkRPTS5vdXRlcldpZHRoKCktMTBcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIHdpbmRvd1RvcCA9IHNjcmVlblhZLnktdGhpcy5ET00ub3V0ZXJIZWlnaHQoKS01MFxyXG4gICAgICAgIGlmKHdpbmRvd1RvcDw1KSB3aW5kb3dUb3A9NVxyXG4gICAgICAgIHRoaXMuRE9NLmNzcyh7XCJsZWZ0XCI6d2luZG93TGVmdCtcInB4XCIsIFwidG9wXCI6d2luZG93VG9wK1wicHhcIn0pXHJcbiAgICB9XHJcbn1cclxuXHJcbmZsb2F0SW5mb1dpbmRvdy5wcm90b3R5cGUuZ2V0UmVsYXRpb25TaGlwRWRpdGFibGVQcm9wZXJ0aWVzPWZ1bmN0aW9uKHJlbGF0aW9uc2hpcE5hbWUsc291cmNlTW9kZWwpe1xyXG4gICAgaWYoIW1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1tzb3VyY2VNb2RlbF0gfHwgIW1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1tzb3VyY2VNb2RlbF0udmFsaWRSZWxhdGlvbnNoaXBzW3JlbGF0aW9uc2hpcE5hbWVdKSByZXR1cm5cclxuICAgIHJldHVybiBtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbc291cmNlTW9kZWxdLnZhbGlkUmVsYXRpb25zaGlwc1tyZWxhdGlvbnNoaXBOYW1lXS5lZGl0YWJsZVJlbGF0aW9uc2hpcFByb3BlcnRpZXNcclxufVxyXG5cclxuZmxvYXRJbmZvV2luZG93LnByb3RvdHlwZS5kcmF3U3RhdGljSW5mbz1mdW5jdGlvbihwYXJlbnQsanNvbkluZm8scGFkZGluZ1RvcCxmb250U2l6ZSl7XHJcbiAgICBmb3IodmFyIGluZCBpbiBqc29uSW5mbyl7XHJcbiAgICAgICAgdmFyIGtleURpdj0gJChcIjxsYWJlbCBzdHlsZT0nZGlzcGxheTpibG9jayc+PGRpdiBjbGFzcz0ndzMtZGFyay1ncmF5JyBzdHlsZT0nZGlzcGxheTppbmxpbmU7cGFkZGluZzouMWVtIC4zZW0gLjFlbSAuM2VtO21hcmdpbi1yaWdodDouM2VtO2ZvbnQtc2l6ZToxMHB4Jz5cIitpbmQrXCI8L2Rpdj48L2xhYmVsPlwiKVxyXG4gICAgICAgIHBhcmVudC5hcHBlbmQoa2V5RGl2KVxyXG4gICAgICAgIGtleURpdi5jc3MoXCJwYWRkaW5nLXRvcFwiLHBhZGRpbmdUb3ApXHJcblxyXG4gICAgICAgIHZhciBjb250ZW50RE9NPSQoXCI8bGFiZWw+PC9sYWJlbD5cIilcclxuICAgICAgICBpZih0eXBlb2YoanNvbkluZm9baW5kXSk9PT1cIm9iamVjdFwiKSB7XHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwiZGlzcGxheVwiLFwiYmxvY2tcIilcclxuICAgICAgICAgICAgY29udGVudERPTS5jc3MoXCJwYWRkaW5nLWxlZnRcIixcIjFlbVwiKVxyXG4gICAgICAgICAgICB0aGlzLmRyYXdTdGF0aWNJbmZvKGNvbnRlbnRET00sanNvbkluZm9baW5kXSxcIi41ZW1cIixmb250U2l6ZSlcclxuICAgICAgICB9ZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwicGFkZGluZy10b3BcIixcIi4yZW1cIilcclxuICAgICAgICAgICAgY29udGVudERPTS50ZXh0KGpzb25JbmZvW2luZF0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnRlbnRET00uY3NzKHtcImZvbnRTaXplXCI6Zm9udFNpemUsXCJjb2xvclwiOlwiYmxhY2tcIn0pXHJcbiAgICAgICAga2V5RGl2LmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgfVxyXG59XHJcblxyXG5mbG9hdEluZm9XaW5kb3cucHJvdG90eXBlLmRyYXdFZGl0YWJsZT1mdW5jdGlvbihwYXJlbnQsanNvbkluZm8sb3JpZ2luRWxlbWVudEluZm8scGF0aEFycil7XHJcbiAgICBpZihqc29uSW5mbz09bnVsbCkgcmV0dXJuO1xyXG4gICAgZm9yKHZhciBpbmQgaW4ganNvbkluZm8pe1xyXG4gICAgICAgIHZhciBrZXlEaXY9ICQoXCI8bGFiZWwgc3R5bGU9J2Rpc3BsYXk6YmxvY2snPjxkaXYgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO3BhZGRpbmc6LjFlbSAuM2VtIC4xZW0gLjNlbTsgbWFyZ2luLXJpZ2h0OjVweCc+XCIraW5kK1wiPC9kaXY+PC9sYWJlbD5cIilcclxuICAgICAgICBwYXJlbnQuYXBwZW5kKGtleURpdilcclxuICAgICAgICBcclxuICAgICAgICBrZXlEaXYuY3NzKFwicGFkZGluZy10b3BcIixcIi4zZW1cIikgXHJcblxyXG4gICAgICAgIHZhciBjb250ZW50RE9NPSQoXCI8bGFiZWwgc3R5bGU9J3BhZGRpbmctdG9wOi4yZW0nPjwvbGFiZWw+XCIpXHJcbiAgICAgICAgdmFyIG5ld1BhdGg9cGF0aEFyci5jb25jYXQoW2luZF0pXHJcbiAgICAgICAgaWYodHlwZW9mKGpzb25JbmZvW2luZF0pPT09XCJvYmplY3RcIiAmJiAhQXJyYXkuaXNBcnJheShqc29uSW5mb1tpbmRdKSkge1xyXG4gICAgICAgICAgICBrZXlEaXYuY2hpbGRyZW4oXCI6Zmlyc3RcIikuY3NzKFwiZm9udC13ZWlnaHRcIixcImJvbGRcIilcclxuICAgICAgICAgICAgY29udGVudERPTS5jc3MoXCJkaXNwbGF5XCIsXCJibG9ja1wiKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLmNzcyhcInBhZGRpbmctbGVmdFwiLFwiMWVtXCIpXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd0VkaXRhYmxlKGNvbnRlbnRET00sanNvbkluZm9baW5kXSxvcmlnaW5FbGVtZW50SW5mbyxuZXdQYXRoKVxyXG4gICAgICAgIH1lbHNlIHtcclxuICAgICAgICAgICAga2V5RGl2LmNoaWxkcmVuKFwiOmZpcnN0XCIpLmFkZENsYXNzKFwidzMtbGltZVwiKVxyXG4gICAgICAgICAgICB2YXIgdmFsPXRoaXMuc2VhcmNoVmFsdWUob3JpZ2luRWxlbWVudEluZm8sbmV3UGF0aClcclxuICAgICAgICAgICAgaWYodmFsPT1udWxsKXtcclxuICAgICAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKHtcImNvbG9yXCI6XCJncmF5XCIsXCJmb250LXNpemVcIjpcIjlweFwifSlcclxuICAgICAgICAgICAgICAgIGNvbnRlbnRET00udGV4dChcIltlbXB0eV1cIilcclxuICAgICAgICAgICAgfWVsc2UgY29udGVudERPTS50ZXh0KHZhbClcclxuICAgICAgICB9XHJcbiAgICAgICAga2V5RGl2LmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgfVxyXG59XHJcblxyXG5mbG9hdEluZm9XaW5kb3cucHJvdG90eXBlLnNlYXJjaFZhbHVlPWZ1bmN0aW9uKG9yaWdpbkVsZW1lbnRJbmZvLHBhdGhBcnIpe1xyXG4gICAgaWYocGF0aEFyci5sZW5ndGg9PTApIHJldHVybiBudWxsO1xyXG4gICAgdmFyIHRoZUpzb249b3JpZ2luRWxlbWVudEluZm9cclxuICAgIGZvcih2YXIgaT0wO2k8cGF0aEFyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIga2V5PXBhdGhBcnJbaV1cclxuICAgICAgICB0aGVKc29uPXRoZUpzb25ba2V5XVxyXG4gICAgICAgIGlmKHRoZUpzb249PW51bGwpIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoZUpzb24gLy9pdCBzaG91bGQgYmUgdGhlIGZpbmFsIHZhbHVlXHJcbn1cclxuXHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgZmxvYXRJbmZvV2luZG93KCk7IiwiZnVuY3Rpb24gZ2xvYmFsQ2FjaGUoKXtcclxuICAgIHRoaXMuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzID0ge31cclxuICAgIHRoaXMuc3RvcmVkVHdpbnMgPSB7fVxyXG5cclxuICAgIHRoaXMuY3VycmVudExheW91dE5hbWU9bnVsbFxyXG4gICAgdGhpcy5sYXlvdXRKU09OPXt9XHJcblxyXG4gICAgdGhpcy5zZWxlY3RlZEFEVD1udWxsO1xyXG5cclxuICAgIHRoaXMudmlzdWFsRGVmaW5pdGlvbj17fVxyXG5cclxuICAgIHRoaXMuc2hvd0Zsb2F0SW5mb1BhbmVsPXRydWVcclxufVxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLnN0b3JlVHdpblJlbGF0aW9uc2hpcHM9ZnVuY3Rpb24ocmVsYXRpb25zRGF0YSl7XHJcbiAgICByZWxhdGlvbnNEYXRhLmZvckVhY2goKG9uZVJlbGF0aW9uc2hpcCk9PntcclxuICAgICAgICB2YXIgdHdpbklEPW9uZVJlbGF0aW9uc2hpcFsnJHNvdXJjZUlkJ11cclxuICAgICAgICB0aGlzLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1t0d2luSURdPVtdXHJcbiAgICB9KVxyXG5cclxuICAgIHJlbGF0aW9uc0RhdGEuZm9yRWFjaCgob25lUmVsYXRpb25zaGlwKT0+e1xyXG4gICAgICAgIHRoaXMuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW29uZVJlbGF0aW9uc2hpcFsnJHNvdXJjZUlkJ11dLnB1c2gob25lUmVsYXRpb25zaGlwKVxyXG4gICAgfSlcclxufVxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLnN0b3JlVHdpblJlbGF0aW9uc2hpcHNfYXBwZW5kPWZ1bmN0aW9uKHJlbGF0aW9uc0RhdGEpe1xyXG4gICAgcmVsYXRpb25zRGF0YS5mb3JFYWNoKChvbmVSZWxhdGlvbnNoaXApPT57XHJcbiAgICAgICAgaWYoIXRoaXMuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW29uZVJlbGF0aW9uc2hpcFsnJHNvdXJjZUlkJ11dKVxyXG4gICAgICAgICAgICB0aGlzLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tvbmVSZWxhdGlvbnNoaXBbJyRzb3VyY2VJZCddXT1bXVxyXG4gICAgICAgIHRoaXMuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW29uZVJlbGF0aW9uc2hpcFsnJHNvdXJjZUlkJ11dLnB1c2gob25lUmVsYXRpb25zaGlwKVxyXG4gICAgfSlcclxufVxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLnN0b3JlVHdpblJlbGF0aW9uc2hpcHNfcmVtb3ZlPWZ1bmN0aW9uKHJlbGF0aW9uc0RhdGEpe1xyXG4gICAgcmVsYXRpb25zRGF0YS5mb3JFYWNoKChvbmVSZWxhdGlvbnNoaXApPT57XHJcbiAgICAgICAgdmFyIHNyY0lEPW9uZVJlbGF0aW9uc2hpcFtcInNyY0lEXCJdXHJcbiAgICAgICAgaWYodGhpcy5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbc3JjSURdKXtcclxuICAgICAgICAgICAgdmFyIGFycj10aGlzLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tzcmNJRF1cclxuICAgICAgICAgICAgZm9yKHZhciBpPTA7aTxhcnIubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgICAgICBpZihhcnJbaV1bJyRyZWxhdGlvbnNoaXBJZCddPT1vbmVSZWxhdGlvbnNoaXBbXCJyZWxJRFwiXSl7XHJcbiAgICAgICAgICAgICAgICAgICAgYXJyLnNwbGljZShpLDEpXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KVxyXG59XHJcblxyXG5nbG9iYWxDYWNoZS5wcm90b3R5cGUubWFrZURPTURyYWdnYWJsZT1mdW5jdGlvbihkb20saWdub3JlQ2hpbGREb21UeXBlKXtcclxuICAgIGlnbm9yZUNoaWxkRG9tVHlwZT1pZ25vcmVDaGlsZERvbVR5cGV8fFtcIkxBQkVMXCIsXCJURFwiLFwiQlwiLFwiQVwiLFwiSU5QVVRcIixcIlBSRVwiXVxyXG4gICAgZG9tLm9uKCdtb3VzZWRvd24nLChlKT0+e1xyXG4gICAgICAgIGlmKGlnbm9yZUNoaWxkRG9tVHlwZS5pbmRleE9mKGUudGFyZ2V0LnRhZ05hbWUpIT0tMSkgcmV0dXJuO1xyXG4gICAgICAgIHZhciBkb21PZmZzZXQ9ZG9tLm9mZnNldCgpXHJcbiAgICAgICAgZG9tLm1vdXNlU3RhcnREcmFnT2Zmc2V0PVtkb21PZmZzZXQubGVmdC1lLmNsaWVudFgsIGRvbU9mZnNldC50b3AtZS5jbGllbnRZXVxyXG4gICAgICAgICQoJ2JvZHknKS5vbignbW91c2V1cCcsKCk9PntcclxuICAgICAgICAgICAgZG9tLm1vdXNlU3RhcnREcmFnT2Zmc2V0PW51bGxcclxuICAgICAgICAgICAgJCgnYm9keScpLm9mZignbW91c2Vtb3ZlJylcclxuICAgICAgICAgICAgJCgnYm9keScpLm9mZignbW91c2V1cCcpXHJcbiAgICAgICAgfSlcclxuICAgICAgICAkKCdib2R5Jykub24oJ21vdXNlbW92ZScsKGUpPT57XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKVxyXG4gICAgICAgICAgICBpZihkb20ubW91c2VTdGFydERyYWdPZmZzZXQpe1xyXG4gICAgICAgICAgICAgICAgdmFyIG5ld0xlZnQ9IGUuY2xpZW50WCtkb20ubW91c2VTdGFydERyYWdPZmZzZXRbMF1cclxuICAgICAgICAgICAgICAgIHZhciBuZXdUb3A9ZS5jbGllbnRZK2RvbS5tb3VzZVN0YXJ0RHJhZ09mZnNldFsxXVxyXG4gICAgICAgICAgICAgICAgZG9tLmNzcyh7XCJsZWZ0XCI6bmV3TGVmdCtcInB4XCIsXCJ0b3BcIjpuZXdUb3ArXCJweFwiLFwidHJhbnNmb3JtXCI6XCJub25lXCJ9KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgIH0pXHJcbn1cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgZ2xvYmFsQ2FjaGUoKTsiLCJjb25zdCBtb2RlbEFuYWx5emVyID0gcmVxdWlyZShcIi4vbW9kZWxBbmFseXplclwiKTtcclxuY29uc3Qgc2ltcGxlU2VsZWN0TWVudT0gcmVxdWlyZShcIi4vc2ltcGxlU2VsZWN0TWVudVwiKVxyXG5jb25zdCBzaW1wbGVDb25maXJtRGlhbG9nID0gcmVxdWlyZShcIi4vc2ltcGxlQ29uZmlybURpYWxvZ1wiKVxyXG5jb25zdCBnbG9iYWxDYWNoZSA9IHJlcXVpcmUoXCIuL2dsb2JhbENhY2hlXCIpXHJcblxyXG5mdW5jdGlvbiBpbmZvUGFuZWwoKSB7XHJcbiAgICB0aGlzLmNvbnRpbmVyRE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1jYXJkXCIgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt6LWluZGV4OjkwO3JpZ2h0OjBweDt0b3A6NTAlO2hlaWdodDo3MCU7d2lkdGg6MzAwcHg7dHJhbnNmb3JtOiB0cmFuc2xhdGVZKC01MCUpO1wiPjwvZGl2PicpXHJcbiAgICB0aGlzLmNvbnRpbmVyRE9NLmhpZGUoKVxyXG4gICAgdGhpcy5jb250aW5lckRPTS5hcHBlbmQoJCgnPGRpdiBzdHlsZT1cImhlaWdodDo1MHB4XCIgY2xhc3M9XCJ3My1iYXIgdzMtcmVkXCI+PC9kaXY+JykpXHJcblxyXG4gICAgdGhpcy5jbG9zZUJ1dHRvbjE9JCgnPGJ1dHRvbiBzdHlsZT1cImhlaWdodDoxMDAlXCIgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b25cIj48aSBjbGFzcz1cImZhIGZhLWluZm8tY2lyY2xlIGZhLTJ4XCIgc3R5bGU9XCJwYWRkaW5nOjJweFwiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5jbG9zZUJ1dHRvbjI9JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yaWdodFwiIHN0eWxlPVwiZm9udC1zaXplOjJlbVwiPsOXPC9idXR0b24+JylcclxuICAgIHRoaXMuY29udGluZXJET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZCh0aGlzLmNsb3NlQnV0dG9uMSx0aGlzLmNsb3NlQnV0dG9uMikgXHJcblxyXG4gICAgdGhpcy5pc01pbmltaXplZD1mYWxzZTtcclxuICAgIHZhciBidXR0b25BbmltPSgpPT57XHJcbiAgICAgICAgaWYoIXRoaXMuaXNNaW5pbWl6ZWQpe1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRpbmVyRE9NLmFuaW1hdGUoe1xyXG4gICAgICAgICAgICAgICAgcmlnaHQ6IFwiLTI1MHB4XCIsXHJcbiAgICAgICAgICAgICAgICBoZWlnaHQ6XCI1MHB4XCJcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgdGhpcy5pc01pbmltaXplZD10cnVlO1xyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRpbmVyRE9NLmFuaW1hdGUoe1xyXG4gICAgICAgICAgICAgICAgcmlnaHQ6IFwiMHB4XCIsXHJcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IFwiNzAlXCJcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgdGhpcy5pc01pbmltaXplZD1mYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLmNsb3NlQnV0dG9uMS5vbihcImNsaWNrXCIsYnV0dG9uQW5pbSlcclxuICAgIHRoaXMuY2xvc2VCdXR0b24yLm9uKFwiY2xpY2tcIixidXR0b25BbmltKVxyXG5cclxuICAgIHRoaXMuRE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1jb250YWluZXJcIiBzdHlsZT1cInBvc3Rpb246YWJzb2x1dGU7dG9wOjUwcHg7aGVpZ2h0OmNhbGMoMTAwJSAtIDUwcHgpO292ZXJmbG93OmF1dG9cIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5jb250aW5lckRPTS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIsXCJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuOClcIilcclxuICAgIHRoaXMuY29udGluZXJET00uaG92ZXIoKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuY29udGluZXJET00uY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiLCBcInJnYmEoMjU1LCAyNTUsIDI1NSwgMSlcIilcclxuICAgIH0sICgpID0+IHtcclxuICAgICAgICB0aGlzLmNvbnRpbmVyRE9NLmNzcyhcImJhY2tncm91bmQtY29sb3JcIiwgXCJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuOClcIilcclxuICAgIH0pO1xyXG4gICAgdGhpcy5jb250aW5lckRPTS5hcHBlbmQodGhpcy5ET00pXHJcbiAgICAkKCdib2R5JykuYXBwZW5kKHRoaXMuY29udGluZXJET00pXHJcbiAgICBcclxuXHJcbiAgICB0aGlzLmRyYXdCdXR0b25zKG51bGwpXHJcblxyXG4gICAgdGhpcy5zZWxlY3RlZE9iamVjdHM9bnVsbDtcclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5yeE1lc3NhZ2U9ZnVuY3Rpb24obXNnUGF5bG9hZCl7ICAgXHJcbiAgICBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiQURURGF0YXNvdXJjZURpYWxvZ19jbG9zZWRcIil7XHJcbiAgICAgICAgaWYoIXRoaXMuY29udGluZXJET00uaXMoXCI6dmlzaWJsZVwiKSkge1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRpbmVyRE9NLnNob3coKVxyXG4gICAgICAgICAgICB0aGlzLmNvbnRpbmVyRE9NLmFkZENsYXNzKFwidzMtYW5pbWF0ZS1yaWdodFwiKVxyXG4gICAgICAgIH1cclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJzaG93SW5mb1NlbGVjdGVkTm9kZXNcIiB8fCBtc2dQYXlsb2FkLm1lc3NhZ2U9PVwic2hvd0luZm9Ib3ZlcmVkRWxlXCIpe1xyXG4gICAgICAgIGlmIChnbG9iYWxDYWNoZS5zaG93RmxvYXRJbmZvUGFuZWwgJiYgbXNnUGF5bG9hZC5tZXNzYWdlPT1cInNob3dJbmZvSG92ZXJlZEVsZVwiKSByZXR1cm47IC8vdGhlIGZsb2F0aW5nIGluZm8gd2luZG93IHdpbGwgc2hvdyBtb3VzZSBvdmVyIGVsZW1lbnQgaW5mb3JtYXRpb24sIGRvIG5vdCBjaGFuZ2UgaW5mbyBwYW5lbCBjb250ZW50IGluIHRoaXMgY2FzZVxyXG4gICAgICAgIHRoaXMuRE9NLmVtcHR5KClcclxuICAgICAgICB2YXIgYXJyPW1zZ1BheWxvYWQuaW5mbztcclxuXHJcbiAgICAgICAgaWYoYXJyPT1udWxsIHx8IGFyci5sZW5ndGg9PTApe1xyXG4gICAgICAgICAgICB0aGlzLmRyYXdCdXR0b25zKG51bGwpXHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRPYmplY3RzPVtdO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnNlbGVjdGVkT2JqZWN0cz1hcnI7XHJcbiAgICAgICAgaWYoYXJyLmxlbmd0aD09MSl7XHJcbiAgICAgICAgICAgIHZhciBzaW5nbGVFbGVtZW50SW5mbz1hcnJbMF07XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZihzaW5nbGVFbGVtZW50SW5mb1tcIiRkdElkXCJdKXsvLyBzZWxlY3QgYSBub2RlXHJcbiAgICAgICAgICAgICAgICBzaW5nbGVFbGVtZW50SW5mbz1nbG9iYWxDYWNoZS5zdG9yZWRUd2luc1tzaW5nbGVFbGVtZW50SW5mb1tcIiRkdElkXCJdXVxyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3QnV0dG9ucyhcInNpbmdsZU5vZGVcIilcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhd1N0YXRpY0luZm8odGhpcy5ET00se1wiJGR0SWRcIjpzaW5nbGVFbGVtZW50SW5mb1tcIiRkdElkXCJdfSxcIjFlbVwiLFwiMTNweFwiKVxyXG4gICAgICAgICAgICAgICAgdmFyIG1vZGVsTmFtZT1zaW5nbGVFbGVtZW50SW5mb1snJG1ldGFkYXRhJ11bJyRtb2RlbCddXHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGlmKG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbE5hbWVdKXtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYXdFZGl0YWJsZSh0aGlzLkRPTSxtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxOYW1lXS5lZGl0YWJsZVByb3BlcnRpZXMsc2luZ2xlRWxlbWVudEluZm8sW10pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyYXdTdGF0aWNJbmZvKHRoaXMuRE9NLHtcIiRldGFnXCI6c2luZ2xlRWxlbWVudEluZm9bXCIkZXRhZ1wiXSxcIiRtZXRhZGF0YVwiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJG1ldGFkYXRhXCJdfSxcIjFlbVwiLFwiMTBweFwiKVxyXG4gICAgICAgICAgICB9ZWxzZSBpZihzaW5nbGVFbGVtZW50SW5mb1tcIiRzb3VyY2VJZFwiXSl7XHJcbiAgICAgICAgICAgICAgICB2YXIgYXJyPWdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tzaW5nbGVFbGVtZW50SW5mb1tcIiRzb3VyY2VJZFwiXV1cclxuICAgICAgICAgICAgICAgIGZvcih2YXIgaT0wO2k8YXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKGFycltpXVsnJHJlbGF0aW9uc2hpcElkJ109PXNpbmdsZUVsZW1lbnRJbmZvW1wiJHJlbGF0aW9uc2hpcElkXCJdKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2luZ2xlRWxlbWVudEluZm89YXJyW2ldXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhd0J1dHRvbnMoXCJzaW5nbGVSZWxhdGlvbnNoaXBcIilcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhd1N0YXRpY0luZm8odGhpcy5ET00se1xyXG4gICAgICAgICAgICAgICAgICAgIFwiJHNvdXJjZUlkXCI6c2luZ2xlRWxlbWVudEluZm9bXCIkc291cmNlSWRcIl0sXHJcbiAgICAgICAgICAgICAgICAgICAgXCIkdGFyZ2V0SWRcIjpzaW5nbGVFbGVtZW50SW5mb1tcIiR0YXJnZXRJZFwiXSxcclxuICAgICAgICAgICAgICAgICAgICBcIiRyZWxhdGlvbnNoaXBOYW1lXCI6c2luZ2xlRWxlbWVudEluZm9bXCIkcmVsYXRpb25zaGlwTmFtZVwiXVxyXG4gICAgICAgICAgICAgICAgfSxcIjFlbVwiLFwiMTNweFwiKVxyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3U3RhdGljSW5mbyh0aGlzLkRPTSx7XHJcbiAgICAgICAgICAgICAgICAgICAgXCIkcmVsYXRpb25zaGlwSWRcIjpzaW5nbGVFbGVtZW50SW5mb1tcIiRyZWxhdGlvbnNoaXBJZFwiXVxyXG4gICAgICAgICAgICAgICAgfSxcIjFlbVwiLFwiMTBweFwiKVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICB2YXIgcmVsYXRpb25zaGlwTmFtZT1zaW5nbGVFbGVtZW50SW5mb1tcIiRyZWxhdGlvbnNoaXBOYW1lXCJdXHJcbiAgICAgICAgICAgICAgICB2YXIgc291cmNlTW9kZWw9c2luZ2xlRWxlbWVudEluZm9bXCJzb3VyY2VNb2RlbFwiXVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyYXdFZGl0YWJsZSh0aGlzLkRPTSx0aGlzLmdldFJlbGF0aW9uU2hpcEVkaXRhYmxlUHJvcGVydGllcyhyZWxhdGlvbnNoaXBOYW1lLHNvdXJjZU1vZGVsKSxzaW5nbGVFbGVtZW50SW5mbyxbXSlcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhd1N0YXRpY0luZm8odGhpcy5ET00se1wiJGV0YWdcIjpzaW5nbGVFbGVtZW50SW5mb1tcIiRldGFnXCJdfSxcIjFlbVwiLFwiMTBweFwiLFwiRGFya0dyYXlcIilcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1lbHNlIGlmKGFyci5sZW5ndGg+MSl7XHJcbiAgICAgICAgICAgIHRoaXMuZHJhd0J1dHRvbnMoXCJtdWx0aXBsZVwiKVxyXG4gICAgICAgICAgICB0aGlzLmRyYXdNdWx0aXBsZU9iaigpXHJcbiAgICAgICAgfVxyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInNob3dJbmZvR3JvdXBOb2RlXCIpe1xyXG4gICAgICAgIHRoaXMuRE9NLmVtcHR5KClcclxuICAgICAgICB2YXIgbW9kZWxJRCA9IG1zZ1BheWxvYWQuaW5mb1tcIkBpZFwiXVxyXG4gICAgICAgIGdsb2JhbENhY2hlLnNob3dpbmdDcmVhdGVUd2luTW9kZWxJRD1tb2RlbElEXHJcbiAgICAgICAgaWYoIW1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXSkgcmV0dXJuO1xyXG4gICAgICAgIHZhciB0d2luSnNvbiA9IHtcclxuICAgICAgICAgICAgXCIkbWV0YWRhdGFcIjoge1xyXG4gICAgICAgICAgICAgICAgXCIkbW9kZWxcIjogbW9kZWxJRFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciBhZGRCdG4gPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtZ3JlZW4gdzMtaG92ZXItbGlnaHQtZ3JlZW4gdzMtbWFyZ2luXCI+QWRkIFR3aW48L2J1dHRvbj4nKVxyXG4gICAgICAgIHRoaXMuRE9NLmFwcGVuZChhZGRCdG4pXHJcblxyXG4gICAgICAgIGFkZEJ0bi5vbihcImNsaWNrXCIsKGUpID0+IHtcclxuICAgICAgICAgICAgaWYoIXR3aW5Kc29uW1wiJGR0SWRcIl18fHR3aW5Kc29uW1wiJGR0SWRcIl09PVwiXCIpe1xyXG4gICAgICAgICAgICAgICAgYWxlcnQoXCJQbGVhc2UgZmlsbCBpbiBuYW1lIGZvciB0aGUgbmV3IGRpZ2l0YWwgdHdpblwiKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgY29tcG9uZW50c05hbWVBcnI9bW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdLmluY2x1ZGVkQ29tcG9uZW50c1xyXG4gICAgICAgICAgICBjb21wb25lbnRzTmFtZUFyci5mb3JFYWNoKG9uZUNvbXBvbmVudE5hbWU9PnsgLy9hZHQgc2VydmljZSByZXF1ZXN0aW5nIGFsbCBjb21wb25lbnQgYXBwZWFyIGJ5IG1hbmRhdG9yeVxyXG4gICAgICAgICAgICAgICAgaWYodHdpbkpzb25bb25lQ29tcG9uZW50TmFtZV09PW51bGwpdHdpbkpzb25bb25lQ29tcG9uZW50TmFtZV09e31cclxuICAgICAgICAgICAgICAgIHR3aW5Kc29uW29uZUNvbXBvbmVudE5hbWVdW1wiJG1ldGFkYXRhXCJdPSB7fVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAkLnBvc3QoXCJlZGl0QURUL3Vwc2VydERpZ2l0YWxUd2luXCIsIHtcIm5ld1R3aW5Kc29uXCI6SlNPTi5zdHJpbmdpZnkodHdpbkpzb24pfVxyXG4gICAgICAgICAgICAgICAgLCAoZGF0YSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkYXRhICE9IFwiXCIpIHsvL25vdCBzdWNjZXNzZnVsIGVkaXRpbmdcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWxlcnQoZGF0YSlcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvL3N1Y2Nlc3NmdWwgZWRpdGluZywgdXBkYXRlIHRoZSBub2RlIG9yaWdpbmFsIGluZm9cclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGtleUxhYmVsPXRoaXMuRE9NLmZpbmQoJyNORVdUV0lOX0lETGFiZWwnKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgSURJbnB1dD1rZXlMYWJlbC5maW5kKFwiaW5wdXRcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYoSURJbnB1dCkgSURJbnB1dC52YWwoXCJcIilcclxuICAgICAgICAgICAgICAgICAgICAgICAgJC5wb3N0KFwicXVlcnlBRFQvb25lVHdpbkluZm9cIix7dHdpbklEOnR3aW5Kc29uW1wiJGR0SWRcIl19LCAoZGF0YSk9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihkYXRhPT1cIlwiKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1tkYXRhW1wiJGR0SWRcIl1dID0gZGF0YTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImFkZE5ld1R3aW5cIix0d2luSW5mbzpkYXRhfSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSkgICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICB0aGlzLmRyYXdTdGF0aWNJbmZvKHRoaXMuRE9NLHtcclxuICAgICAgICAgICAgXCJNb2RlbFwiOm1vZGVsSURcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICBhZGRCdG4uZGF0YShcInR3aW5Kc29uXCIsdHdpbkpzb24pXHJcbiAgICAgICAgdmFyIGNvcHlQcm9wZXJ0eT1KU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXS5lZGl0YWJsZVByb3BlcnRpZXMpKVxyXG4gICAgICAgIGNvcHlQcm9wZXJ0eVsnJGR0SWQnXT1cInN0cmluZ1wiXHJcbiAgICAgICAgdGhpcy5kcmF3RWRpdGFibGUodGhpcy5ET00sY29weVByb3BlcnR5LHR3aW5Kc29uLFtdLFwibmV3VHdpblwiKVxyXG4gICAgICAgIC8vY29uc29sZS5sb2cobW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdKSBcclxuICAgIH1cclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5nZXRSZWxhdGlvblNoaXBFZGl0YWJsZVByb3BlcnRpZXM9ZnVuY3Rpb24ocmVsYXRpb25zaGlwTmFtZSxzb3VyY2VNb2RlbCl7XHJcbiAgICBpZighbW9kZWxBbmFseXplci5EVERMTW9kZWxzW3NvdXJjZU1vZGVsXSB8fCAhbW9kZWxBbmFseXplci5EVERMTW9kZWxzW3NvdXJjZU1vZGVsXS52YWxpZFJlbGF0aW9uc2hpcHNbcmVsYXRpb25zaGlwTmFtZV0pIHJldHVyblxyXG4gICAgcmV0dXJuIG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1tzb3VyY2VNb2RlbF0udmFsaWRSZWxhdGlvbnNoaXBzW3JlbGF0aW9uc2hpcE5hbWVdLmVkaXRhYmxlUmVsYXRpb25zaGlwUHJvcGVydGllc1xyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmRyYXdCdXR0b25zPWZ1bmN0aW9uKHNlbGVjdFR5cGUpe1xyXG4gICAgdmFyIGltcEJ0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWJsdWVcIj48aSBjbGFzcz1cImZhcyBmYS1jbG91ZC11cGxvYWQtYWx0XCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICB2YXIgYWN0dWFsSW1wb3J0VHdpbnNCdG4gPSQoJzxpbnB1dCB0eXBlPVwiZmlsZVwiIG5hbWU9XCJtb2RlbEZpbGVzXCIgbXVsdGlwbGU9XCJtdWx0aXBsZVwiIHN0eWxlPVwiZGlzcGxheTpub25lXCI+PC9pbnB1dD4nKVxyXG4gICAgaWYoc2VsZWN0VHlwZSE9bnVsbCl7XHJcbiAgICAgICAgdmFyIHJlZnJlc2hCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ibGFja1wiPjxpIGNsYXNzPVwiZmFzIGZhLXN5bmMtYWx0XCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIGV4cEJ0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWdyZWVuXCI+PGkgY2xhc3M9XCJmYXMgZmEtY2xvdWQtZG93bmxvYWQtYWx0XCI+PC9pPjwvYnV0dG9uPicpICBcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQocmVmcmVzaEJ0bixleHBCdG4saW1wQnRuLGFjdHVhbEltcG9ydFR3aW5zQnRuKVxyXG4gICAgICAgIHJlZnJlc2hCdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5yZWZyZXNoSW5mb21hdGlvbigpfSlcclxuICAgICAgICBleHBCdG4ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgICAgIC8vZmluZCBvdXQgdGhlIHR3aW5zIGluIHNlbGVjdGlvbiBhbmQgdGhlaXIgY29ubmVjdGlvbnMgKGZpbHRlciBib3RoIHNyYyBhbmQgdGFyZ2V0IHdpdGhpbiB0aGUgc2VsZWN0ZWQgdHdpbnMpXHJcbiAgICAgICAgICAgIC8vYW5kIGV4cG9ydCB0aGVtXHJcbiAgICAgICAgICAgIHRoaXMuZXhwb3J0U2VsZWN0ZWQoKVxyXG4gICAgICAgIH0pICAgIFxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLkRPTS5odG1sKFwiPGEgc3R5bGU9J2Rpc3BsYXk6YmxvY2s7Zm9udC1zdHlsZTppdGFsaWM7Y29sb3I6Z3JheSc+Q2hvb3NlIHR3aW5zIG9yIHJlbGF0aW9uc2hpcHMgdG8gdmlldyBpbmZvbXJhdGlvbjwvYT48YSBzdHlsZT0nZGlzcGxheTpibG9jaztmb250LXN0eWxlOml0YWxpYztjb2xvcjpncmF5O3BhZGRpbmctdG9wOjIwcHgnPlByZXNzIHNoaWZ0IGtleSB0byBkcmF3IGJveCBhbmQgc2VsZWN0IG11bHRpcGxlIHR3aW5zIGluIHRvcG9sb2d5IHZpZXc8L2E+PGEgc3R5bGU9J2Rpc3BsYXk6YmxvY2s7Zm9udC1zdHlsZTppdGFsaWM7Y29sb3I6Z3JheTtwYWRkaW5nLXRvcDoyMHB4Jz5QcmVzcyBjdHJsK3ogYW5kIGN0cmwreSB0byB1bmRvL3JlZG8gaW4gdG9wb2xvZ3kgdmlldzsgY3RybCtzIHRvIHNhdmUgbGF5b3V0PC9hPjxhIHN0eWxlPSdkaXNwbGF5OmJsb2NrO2ZvbnQtc3R5bGU6aXRhbGljO2NvbG9yOmdyYXk7cGFkZGluZy10b3A6MjBweDtwYWRkaW5nLWJvdHRvbToyMHB4Jz5QcmVzcyBzaGlmdCBvciBjdHJsIGtleSB0byBzZWxlY3QgbXVsdGlwbGUgdHdpbnMgaW4gdHJlZSB2aWV3PC9hPjxhIHN0eWxlPSdkaXNwbGF5OmJsb2NrO2ZvbnQtc3R5bGU6aXRhbGljO2NvbG9yOmdyYXk7cGFkZGluZy10b3A6MTJweDtwYWRkaW5nLWJvdHRvbTo1cHgnPkltcG9ydCB0d2lucyBkYXRhIGJ5IGNsaWNraW5nIGJ1dHRvbiBiZWxvdzwvYT5cIilcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQoaW1wQnRuLCBhY3R1YWxJbXBvcnRUd2luc0J0bilcclxuICAgIH1cclxuICAgIFxyXG4gICAgaW1wQnRuLm9uKFwiY2xpY2tcIiwoKT0+e2FjdHVhbEltcG9ydFR3aW5zQnRuLnRyaWdnZXIoJ2NsaWNrJyk7fSlcclxuICAgIGFjdHVhbEltcG9ydFR3aW5zQnRuLmNoYW5nZShhc3luYyAoZXZ0KT0+e1xyXG4gICAgICAgIHZhciBmaWxlcyA9IGV2dC50YXJnZXQuZmlsZXM7IC8vIEZpbGVMaXN0IG9iamVjdFxyXG4gICAgICAgIGF3YWl0IHRoaXMucmVhZFR3aW5zRmlsZXNDb250ZW50QW5kSW1wb3J0KGZpbGVzKVxyXG4gICAgICAgIGFjdHVhbEltcG9ydFR3aW5zQnRuLnZhbChcIlwiKVxyXG4gICAgfSlcclxuICAgIGlmKHNlbGVjdFR5cGU9PW51bGwpIHJldHVybjtcclxuXHJcbiAgICBpZihzZWxlY3RUeXBlPT1cInNpbmdsZVJlbGF0aW9uc2hpcFwiKXtcclxuICAgICAgICB2YXIgZGVsQnRuID0gICQoJzxidXR0b24gc3R5bGU9XCJ3aWR0aDoxMDRweFwiIGNsYXNzPVwidzMtYnV0dG9uIHczLXJlZCB3My1ob3Zlci1waW5rIHczLWJvcmRlclwiPkRlbGV0ZSBBbGw8L2J1dHRvbj4nKVxyXG4gICAgICAgIHRoaXMuRE9NLmFwcGVuZChkZWxCdG4pXHJcbiAgICAgICAgZGVsQnRuLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgICAgICB0aGlzLmRlbGV0ZVNlbGVjdGVkKClcclxuICAgICAgICAgICAgJChkb2N1bWVudC5hY3RpdmVFbGVtZW50KS5ibHVyKClcclxuICAgICAgICB9KVxyXG4gICAgfWVsc2UgaWYoc2VsZWN0VHlwZT09XCJzaW5nbGVOb2RlXCIgfHwgc2VsZWN0VHlwZT09XCJtdWx0aXBsZVwiKXtcclxuICAgICAgICB2YXIgZGVsQnRuID0gJCgnPGJ1dHRvbiBzdHlsZT1cIndpZHRoOjEwNHB4XCIgY2xhc3M9XCJ3My1idXR0b24gdzMtcmVkIHczLWhvdmVyLXBpbmsgdzMtYm9yZGVyXCI+RGVsZXRlIEFsbDwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIGNvbm5lY3RUb0J0biA9JCgnPGJ1dHRvbiBzdHlsZT1cIndpZHRoOjQ1JVwiICBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj5Db25uZWN0IHRvPC9idXR0b24+JylcclxuICAgICAgICB2YXIgY29ubmVjdEZyb21CdG4gPSAkKCc8YnV0dG9uIHN0eWxlPVwid2lkdGg6NDUlXCIgY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+Q29ubmVjdCBmcm9tPC9idXR0b24+JylcclxuICAgICAgICB2YXIgc2hvd0luYm91bmRCdG4gPSAkKCc8YnV0dG9uICBzdHlsZT1cIndpZHRoOjQ1JVwiIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiPlF1ZXJ5IEluYm91bmQ8L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBzaG93T3V0Qm91bmRCdG4gPSAkKCc8YnV0dG9uIHN0eWxlPVwid2lkdGg6NDUlXCIgY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+UXVlcnkgT3V0Ym91bmQ8L2J1dHRvbj4nKVxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuRE9NLmFwcGVuZChkZWxCdG4sIGNvbm5lY3RUb0J0bixjb25uZWN0RnJvbUJ0biAsIHNob3dJbmJvdW5kQnRuLCBzaG93T3V0Qm91bmRCdG4pXHJcbiAgICBcclxuICAgICAgICBzaG93T3V0Qm91bmRCdG4ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgICAgIHRoaXMuc2hvd091dEJvdW5kKClcclxuICAgICAgICAgICAgJChkb2N1bWVudC5hY3RpdmVFbGVtZW50KS5ibHVyKClcclxuICAgICAgICB9KVxyXG4gICAgICAgIHNob3dJbmJvdW5kQnRuLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgICAgICB0aGlzLnNob3dJbkJvdW5kKClcclxuICAgICAgICAgICAgJChkb2N1bWVudC5hY3RpdmVFbGVtZW50KS5ibHVyKClcclxuICAgICAgICB9KSAgXHJcbiAgICAgICAgY29ubmVjdFRvQnRuLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJjb25uZWN0VG9cIn0pIFxyXG4gICAgICAgICAgICAkKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpLmJsdXIoKVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgY29ubmVjdEZyb21CdG4ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImNvbm5lY3RGcm9tXCJ9KSBcclxuICAgICAgICAgICAgJChkb2N1bWVudC5hY3RpdmVFbGVtZW50KS5ibHVyKClcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICBkZWxCdG4ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgICAgIHRoaXMuZGVsZXRlU2VsZWN0ZWQoKVxyXG4gICAgICAgICAgICAkKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpLmJsdXIoKVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHZhciBudW1PZk5vZGUgPSAwO1xyXG4gICAgdmFyIGFycj10aGlzLnNlbGVjdGVkT2JqZWN0cztcclxuICAgIGFyci5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIGlmIChlbGVtZW50WyckZHRJZCddKSBudW1PZk5vZGUrK1xyXG4gICAgfSk7XHJcbiAgICBpZihudW1PZk5vZGU+MCl7XHJcbiAgICAgICAgdmFyIHNlbGVjdEluYm91bmRCdG4gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiPitTZWxlY3QgSW5ib3VuZDwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIHNlbGVjdE91dEJvdW5kQnRuID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj4rU2VsZWN0IE91dGJvdW5kPC9idXR0b24+JylcclxuICAgICAgICB2YXIgY29zZUxheW91dEJ0bj0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj5DT1NFIFZpZXc8L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBoaWRlQnRuPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiPkhpZGU8L2J1dHRvbj4nKVxyXG4gICAgICAgIHRoaXMuRE9NLmFwcGVuZChzZWxlY3RJbmJvdW5kQnRuLCBzZWxlY3RPdXRCb3VuZEJ0bixjb3NlTGF5b3V0QnRuLGhpZGVCdG4pXHJcblxyXG4gICAgICAgIHNlbGVjdEluYm91bmRCdG4ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7XCJtZXNzYWdlXCI6IFwiYWRkU2VsZWN0SW5ib3VuZFwifSlcclxuICAgICAgICAgICAgJChkb2N1bWVudC5hY3RpdmVFbGVtZW50KS5ibHVyKClcclxuICAgICAgICB9KVxyXG4gICAgICAgIHNlbGVjdE91dEJvdW5kQnRuLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2Uoe1wibWVzc2FnZVwiOiBcImFkZFNlbGVjdE91dGJvdW5kXCJ9KVxyXG4gICAgICAgICAgICAkKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpLmJsdXIoKVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgY29zZUxheW91dEJ0bi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHtcIm1lc3NhZ2VcIjogXCJDT1NFU2VsZWN0ZWROb2Rlc1wifSlcclxuICAgICAgICAgICAgJChkb2N1bWVudC5hY3RpdmVFbGVtZW50KS5ibHVyKClcclxuICAgICAgICB9KVxyXG4gICAgICAgIGhpZGVCdG4ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgICAgIHZhciB0d2luSURBcnI9W11cclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RlZE9iamVjdHMuZm9yRWFjaChlbGU9PntpZihlbGVbJyRkdElkJ10pIHR3aW5JREFyci5wdXNoKGVsZVsnJGR0SWQnXSl9KVxyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2Uoe1wibWVzc2FnZVwiOiBcImhpZGVTZWxlY3RlZE5vZGVzXCIsXCJ0d2luSURBcnJcIjp0d2luSURBcnJ9KVxyXG4gICAgICAgICAgICAkKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpLmJsdXIoKVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbiAgICBpZiAobnVtT2ZOb2RlID4gMSkge1xyXG4gICAgICAgIC8vc29tZSBhZGRpdGlvbmFsIGJ1dHRvbnMgd2hlbiBzZWxlY3QgbXVsdGlwbGUgaXRlbXNcclxuICAgICAgICB0aGlzLmRyYXdBZHZhbmNlQWxpZ25tZW50QnV0dG9ucygpXHJcbiAgICB9XHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZHJhd0FkdmFuY2VBbGlnbm1lbnRCdXR0b25zPWFzeW5jIGZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgbGFiZWw9JChcIjxsYWJlbCBjbGFzcz0ndzMtZ3JheScgc3R5bGU9J2Rpc3BsYXk6YmxvY2s7bWFyZ2luLXRvcDo1cHg7d2lkdGg6MjAlO3RleHQtYWxpZ246Y2VudGVyO2ZvbnQtc2l6ZTo5cHg7cGFkZGluZzoycHggNHB4O2ZvbnQtd2VpZ2h0Om5vcm1hbDtib3JkZXItcmFkaXVzOiAycHg7Jz5BcnJhbmdlPC9sYWJlbD5cIikgXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQobGFiZWwpIFxyXG4gICAgdmFyIGFsaWduQnV0dG9uc1RhYmxlPSQoXCI8dGFibGUgc3R5bGU9J21hcmdpbjowIGF1dG8nPjx0cj48dGQ+PC90ZD48dGQ+PC90ZD48dGQ+PC90ZD48L3RyPjx0cj48dGQ+PC90ZD48dGQgc3R5bGU9J3RleHQtYWxpZ246Y2VudGVyO2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6ZGFya0dyYXknPkFMSUdOPC90ZD48dGQ+PC90ZD48L3RyPjx0cj48dGQ+PC90ZD48dGQ+PC90ZD48dGQ+PC90ZD48L3RyPjwvdGFibGU+XCIpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQoYWxpZ25CdXR0b25zVGFibGUpXHJcbiAgICB2YXIgYWxpZ25Ub3BCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiPjxpIGNsYXNzPVwiZmFzIGZhLWNoZXZyb24tdXBcIj48L2k+PC9idXR0b24+JylcclxuICAgIHZhciBhbGlnbkxlZnRCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiPjxpIGNsYXNzPVwiZmFzIGZhLWNoZXZyb24tbGVmdFwiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgdmFyIGFsaWduUmlnaHRCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiPjxpIGNsYXNzPVwiZmFzIGZhLWNoZXZyb24tcmlnaHRcIj48L2k+PC9idXR0b24+JylcclxuICAgIHZhciBhbGlnbkJvdHRvbUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+PGkgY2xhc3M9XCJmYXMgZmEtY2hldnJvbi1kb3duXCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICBhbGlnbkJ1dHRvbnNUYWJsZS5maW5kKFwidGRcIikuZXEoMSkuYXBwZW5kKGFsaWduVG9wQnV0dG9uKVxyXG4gICAgYWxpZ25CdXR0b25zVGFibGUuZmluZChcInRkXCIpLmVxKDMpLmFwcGVuZChhbGlnbkxlZnRCdXR0b24pXHJcbiAgICBhbGlnbkJ1dHRvbnNUYWJsZS5maW5kKFwidGRcIikuZXEoNSkuYXBwZW5kKGFsaWduUmlnaHRCdXR0b24pXHJcbiAgICBhbGlnbkJ1dHRvbnNUYWJsZS5maW5kKFwidGRcIikuZXEoNykuYXBwZW5kKGFsaWduQm90dG9tQnV0dG9uKVxyXG5cclxuXHJcbiAgICB2YXIgYXJyYW5nZVRhYmxlPSQoXCI8dGFibGUgc3R5bGU9J21hcmdpbjowIGF1dG8nPjx0cj48dGQ+PC90ZD48dGQ+PC90ZD48dGQ+PC90ZD48dGQ+PC90ZD48L3RyPjx0cj48dGQ+PC90ZD48dGQ+PC90ZD48dGQ+PC90ZD48dGQ+PC90ZD48L3RyPjwvdGFibGU+XCIpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQoYXJyYW5nZVRhYmxlKVxyXG5cclxuICAgIHZhciBkaXN0cmlidXRlSEJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+PGkgY2xhc3M9XCJmYXMgZmEtZWxsaXBzaXMtaCBmYS1sZ1wiPjwvaT48L2J1dHRvbj4nKSBcclxuICAgIHZhciBkaXN0cmlidXRlVkJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+PGkgY2xhc3M9XCJmYXMgZmEtZWxsaXBzaXMtdiBmYS1sZ1wiPjwvaT48L2J1dHRvbj4nKSBcclxuICAgIHZhciBsZWZ0Um90YXRlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj48aSBjbGFzcz1cImZhcyBmYS11bmRvLWFsdCBmYS1sZ1wiPjwvaT48L2J1dHRvbj4nKSBcclxuICAgIHZhciByaWdodFJvdGF0ZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+PGkgY2xhc3M9XCJmYXMgZmEtcmVkby1hbHQgZmEtbGdcIj48L2k+PC9idXR0b24+JykgXHJcbiAgICB2YXIgbWlycm9ySEJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCIgc3R5bGU9XCJ3aWR0aDoxMDAlXCI+PGkgY2xhc3M9XCJmYXMgZmEtYXJyb3dzLWFsdC1oXCI+PC9pPjwvYnV0dG9uPicpIFxyXG4gICAgdmFyIG1pcnJvclZCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiIHN0eWxlPVwid2lkdGg6MTAwJVwiPjxpIGNsYXNzPVwiZmFzIGZhLWFycm93cy1hbHQtdlwiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgdmFyIGV4cGFuZEJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCIgc3R5bGU9XCJ3aWR0aDoxMDAlXCI+PGkgY2xhc3M9XCJmYXMgZmEtZXhwYW5kLWFycm93cy1hbHRcIj48L2k+PC9idXR0b24+JykgXHJcbiAgICB2YXIgY29tcHJlc3NCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiIHN0eWxlPVwid2lkdGg6MTAwJVwiPjxpIGNsYXNzPVwiZmFzIGZhLWNvbXByZXNzLWFycm93cy1hbHRcIj48L2k+PC9idXR0b24+JylcclxuICAgIFxyXG4gICAgYXJyYW5nZVRhYmxlLmZpbmQoXCJ0ZFwiKS5lcSgwKS5hcHBlbmQoZGlzdHJpYnV0ZUhCdXR0b24pXHJcbiAgICBhcnJhbmdlVGFibGUuZmluZChcInRkXCIpLmVxKDEpLmFwcGVuZChkaXN0cmlidXRlVkJ1dHRvbilcclxuICAgIGFycmFuZ2VUYWJsZS5maW5kKFwidGRcIikuZXEoMikuYXBwZW5kKGxlZnRSb3RhdGVCdXR0b24pXHJcbiAgICBhcnJhbmdlVGFibGUuZmluZChcInRkXCIpLmVxKDMpLmFwcGVuZChyaWdodFJvdGF0ZUJ1dHRvbilcclxuICAgIGFycmFuZ2VUYWJsZS5maW5kKFwidGRcIikuZXEoNCkuYXBwZW5kKG1pcnJvckhCdXR0b24pXHJcbiAgICBhcnJhbmdlVGFibGUuZmluZChcInRkXCIpLmVxKDUpLmFwcGVuZChtaXJyb3JWQnV0dG9uKVxyXG4gICAgYXJyYW5nZVRhYmxlLmZpbmQoXCJ0ZFwiKS5lcSg2KS5hcHBlbmQoZXhwYW5kQnV0dG9uKVxyXG4gICAgYXJyYW5nZVRhYmxlLmZpbmQoXCJ0ZFwiKS5lcSg3KS5hcHBlbmQoY29tcHJlc3NCdXR0b24pXHJcblxyXG5cclxuICAgIGFsaWduVG9wQnV0dG9uLm9uKFwiY2xpY2tcIiwgKGUpID0+IHtcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJhbGlnblNlbGVjdGVkTm9kZVwiLCBkaXJlY3Rpb246IFwidG9wXCIgfSlcclxuICAgICAgICAkKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpLmJsdXIoKVxyXG4gICAgfSlcclxuICAgIGFsaWduTGVmdEJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJhbGlnblNlbGVjdGVkTm9kZVwiLCBkaXJlY3Rpb246IFwibGVmdFwiIH0pXHJcbiAgICAgICAgJChkb2N1bWVudC5hY3RpdmVFbGVtZW50KS5ibHVyKClcclxuICAgIH0pXHJcbiAgICBhbGlnblJpZ2h0QnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImFsaWduU2VsZWN0ZWROb2RlXCIsIGRpcmVjdGlvbjogXCJyaWdodFwiIH0pXHJcbiAgICAgICAgJChkb2N1bWVudC5hY3RpdmVFbGVtZW50KS5ibHVyKClcclxuICAgIH0pXHJcbiAgICBhbGlnbkJvdHRvbUJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJhbGlnblNlbGVjdGVkTm9kZVwiLCBkaXJlY3Rpb246IFwiYm90dG9tXCIgfSlcclxuICAgICAgICAkKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpLmJsdXIoKVxyXG4gICAgfSlcclxuXHJcbiAgICBkaXN0cmlidXRlSEJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJkaXN0cmlidXRlU2VsZWN0ZWROb2RlXCIsIGRpcmVjdGlvbjogXCJob3Jpem9udGFsXCIgfSlcclxuICAgICAgICAkKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpLmJsdXIoKVxyXG4gICAgfSlcclxuICAgIGRpc3RyaWJ1dGVWQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImRpc3RyaWJ1dGVTZWxlY3RlZE5vZGVcIiwgZGlyZWN0aW9uOiBcInZlcnRpY2FsXCIgfSlcclxuICAgICAgICAkKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpLmJsdXIoKVxyXG4gICAgfSlcclxuICAgIGxlZnRSb3RhdGVCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwicm90YXRlU2VsZWN0ZWROb2RlXCIsIGRpcmVjdGlvbjogXCJsZWZ0XCIgfSlcclxuICAgICAgICAkKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpLmJsdXIoKVxyXG4gICAgfSlcclxuICAgIHJpZ2h0Um90YXRlQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInJvdGF0ZVNlbGVjdGVkTm9kZVwiLCBkaXJlY3Rpb246IFwicmlnaHRcIiB9KVxyXG4gICAgICAgICQoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkuYmx1cigpXHJcbiAgICB9KVxyXG4gICAgbWlycm9ySEJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJtaXJyb3JTZWxlY3RlZE5vZGVcIiwgZGlyZWN0aW9uOiBcImhvcml6b250YWxcIiB9KVxyXG4gICAgICAgICQoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkuYmx1cigpXHJcbiAgICB9KVxyXG4gICAgbWlycm9yVkJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJtaXJyb3JTZWxlY3RlZE5vZGVcIiwgZGlyZWN0aW9uOiBcInZlcnRpY2FsXCIgfSlcclxuICAgICAgICAkKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpLmJsdXIoKVxyXG4gICAgfSlcclxuICAgIGV4cGFuZEJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJkaW1lbnNpb25TZWxlY3RlZE5vZGVcIiwgZGlyZWN0aW9uOiBcImV4cGFuZFwiIH0pXHJcbiAgICAgICAgJChkb2N1bWVudC5hY3RpdmVFbGVtZW50KS5ibHVyKClcclxuICAgIH0pXHJcbiAgICBjb21wcmVzc0J1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJkaW1lbnNpb25TZWxlY3RlZE5vZGVcIiwgZGlyZWN0aW9uOiBcImNvbXByZXNzXCIgfSlcclxuICAgICAgICAkKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpLmJsdXIoKVxyXG4gICAgfSlcclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5leHBvcnRTZWxlY3RlZD1hc3luYyBmdW5jdGlvbigpe1xyXG4gICAgdmFyIGFycj10aGlzLnNlbGVjdGVkT2JqZWN0cztcclxuICAgIGlmKGFyci5sZW5ndGg9PTApIHJldHVybjtcclxuICAgIHZhciB0d2luSURBcnI9W11cclxuICAgIHZhciB0d2luVG9CZVN0b3JlZD1bXVxyXG4gICAgdmFyIHR3aW5JRHM9e31cclxuICAgIGFyci5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIGlmIChlbGVtZW50Wyckc291cmNlSWQnXSkgcmV0dXJuXHJcbiAgICAgICAgdHdpbklEQXJyLnB1c2goZWxlbWVudFsnJGR0SWQnXSlcclxuICAgICAgICB2YXIgYW5FeHBUd2luPXt9XHJcbiAgICAgICAgYW5FeHBUd2luW1wiJG1ldGFkYXRhXCJdPXtcIiRtb2RlbFwiOmVsZW1lbnRbXCIkbWV0YWRhdGFcIl1bXCIkbW9kZWxcIl19XHJcbiAgICAgICAgZm9yKHZhciBpbmQgaW4gZWxlbWVudCl7XHJcbiAgICAgICAgICAgIGlmKGluZD09XCIkbWV0YWRhdGFcIiB8fCBpbmQ9PVwiJGV0YWdcIikgY29udGludWUgXHJcbiAgICAgICAgICAgIGVsc2UgYW5FeHBUd2luW2luZF09ZWxlbWVudFtpbmRdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHR3aW5Ub0JlU3RvcmVkLnB1c2goYW5FeHBUd2luKVxyXG4gICAgICAgIHR3aW5JRHNbZWxlbWVudFsnJGR0SWQnXV09MVxyXG4gICAgfSk7XHJcbiAgICB2YXIgcmVsYXRpb25zVG9CZVN0b3JlZD1bXVxyXG4gICAgdHdpbklEQXJyLmZvckVhY2gob25lSUQ9PntcclxuICAgICAgICB2YXIgcmVsYXRpb25zPWdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tvbmVJRF1cclxuICAgICAgICBpZighcmVsYXRpb25zKSByZXR1cm47XHJcbiAgICAgICAgcmVsYXRpb25zLmZvckVhY2gob25lUmVsYXRpb249PntcclxuICAgICAgICAgICAgdmFyIHRhcmdldElEPW9uZVJlbGF0aW9uW1wiJHRhcmdldElkXCJdXHJcbiAgICAgICAgICAgIGlmKHR3aW5JRHNbdGFyZ2V0SURdKSB7XHJcbiAgICAgICAgICAgICAgICB2YXIgb2JqPXt9XHJcbiAgICAgICAgICAgICAgICBmb3IodmFyIGluZCBpbiBvbmVSZWxhdGlvbil7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoaW5kID09XCIkZXRhZ1wifHxpbmQgPT1cIiRyZWxhdGlvbnNoaXBJZFwifHxpbmQgPT1cIiRzb3VyY2VJZFwifHxpbmQgPT1cInNvdXJjZU1vZGVsXCIpIGNvbnRpbnVlXHJcbiAgICAgICAgICAgICAgICAgICAgb2JqW2luZF09b25lUmVsYXRpb25baW5kXVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdmFyIG9uZUFjdGlvbj17XCIkc3JjSWRcIjpvbmVJRCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIiRyZWxhdGlvbnNoaXBJZFwiOm9uZVJlbGF0aW9uW1wiJHJlbGF0aW9uc2hpcElkXCJdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwib2JqXCI6b2JqfVxyXG4gICAgICAgICAgICAgICAgcmVsYXRpb25zVG9CZVN0b3JlZC5wdXNoKG9uZUFjdGlvbilcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICB9KVxyXG4gICAgdmFyIGZpbmFsSlNPTj17XCJ0d2luc1wiOnR3aW5Ub0JlU3RvcmVkLFwicmVsYXRpb25zXCI6cmVsYXRpb25zVG9CZVN0b3JlZH1cclxuICAgIHZhciBwb20gPSAkKFwiPGE+PC9hPlwiKVxyXG4gICAgcG9tLmF0dHIoJ2hyZWYnLCAnZGF0YTp0ZXh0L3BsYWluO2NoYXJzZXQ9dXRmLTgsJyArIGVuY29kZVVSSUNvbXBvbmVudChKU09OLnN0cmluZ2lmeShmaW5hbEpTT04pKSk7XHJcbiAgICBwb20uYXR0cignZG93bmxvYWQnLCBcImV4cG9ydFR3aW5zRGF0YS5qc29uXCIpO1xyXG4gICAgcG9tWzBdLmNsaWNrKClcclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5yZWFkT25lRmlsZT0gYXN5bmMgZnVuY3Rpb24oYUZpbGUpe1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xyXG4gICAgICAgICAgICByZWFkZXIub25sb2FkID0gKCk9PiB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlYWRlci5yZXN1bHQpXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHJlYWRlci5yZWFkQXNUZXh0KGFGaWxlKTtcclxuICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIHJlamVjdChlKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5yZWFkVHdpbnNGaWxlc0NvbnRlbnRBbmRJbXBvcnQ9YXN5bmMgZnVuY3Rpb24oZmlsZXMpe1xyXG4gICAgdmFyIGltcG9ydFR3aW5zPVtdXHJcbiAgICB2YXIgaW1wb3J0UmVsYXRpb25zPVtdXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaTwgZmlsZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICB2YXIgZj1maWxlc1tpXVxyXG4gICAgICAgIC8vIE9ubHkgcHJvY2VzcyBqc29uIGZpbGVzLlxyXG4gICAgICAgIGlmIChmLnR5cGUhPVwiYXBwbGljYXRpb24vanNvblwiKSBjb250aW51ZTtcclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgIHZhciBzdHI9IGF3YWl0IHRoaXMucmVhZE9uZUZpbGUoZilcclxuICAgICAgICAgICAgdmFyIG9iaj1KU09OLnBhcnNlKHN0cilcclxuICAgICAgICAgICAgaWYob2JqLnR3aW5zKSBpbXBvcnRUd2lucz1pbXBvcnRUd2lucy5jb25jYXQob2JqLnR3aW5zKVxyXG4gICAgICAgICAgICBpZihvYmoucmVsYXRpb25zKSBpbXBvcnRSZWxhdGlvbnM9aW1wb3J0UmVsYXRpb25zLmNvbmNhdChvYmoucmVsYXRpb25zKVxyXG4gICAgICAgIH1jYXRjaChlcnIpe1xyXG4gICAgICAgICAgICBhbGVydChlcnIpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vZm9yIEFEVCBVSSBzdGFuZGFsb25lIHRvb2wsIHRyYW5zbGF0ZSBhbGwgdHdpbiBJRCBieSBpdHMgZGlzcGxheU5hbWVcclxuICAgIHZhciBJRHRvTmFtZT17fVxyXG4gICAgaW1wb3J0VHdpbnMuZm9yRWFjaChvbmVUd2luPT57XHJcbiAgICAgICAgdmFyIGRpc3BsYXlOYW1lPW9uZVR3aW5bXCJkaXNwbGF5TmFtZVwiXSB8fCBvbmVUd2luW1wiJGR0SWRcIl1cclxuICAgICAgICBJRHRvTmFtZVtvbmVUd2luW1wiJGR0SWRcIl1dPWRpc3BsYXlOYW1lXHJcbiAgICAgICAgb25lVHdpbltcIiRkdElkXCJdPWRpc3BsYXlOYW1lXHJcbiAgICAgICAgZGVsZXRlIG9uZVR3aW5bXCJkaXNwbGF5TmFtZVwiXVxyXG4gICAgfSlcclxuICAgIGltcG9ydFJlbGF0aW9ucy5mb3JFYWNoKG9uZVJlbGF0aW9uPT57XHJcbiAgICAgICAgb25lUmVsYXRpb25bXCIkc3JjSWRcIl09SUR0b05hbWVbb25lUmVsYXRpb25bXCIkc3JjSWRcIl1dfHxvbmVSZWxhdGlvbltcIiRzcmNJZFwiXVxyXG4gICAgICAgIG9uZVJlbGF0aW9uW1wib2JqXCJdW1wiJHRhcmdldElkXCJdPUlEdG9OYW1lW29uZVJlbGF0aW9uW1wib2JqXCJdW1wiJHRhcmdldElkXCJdXXx8b25lUmVsYXRpb25bXCJvYmpcIl1bXCIkdGFyZ2V0SWRcIl1cclxuICAgIH0pXHJcblxyXG5cclxuICAgIHZhciB0d2luc0ltcG9ydFJlc3VsdD0gYXdhaXQgdGhpcy5iYXRjaEltcG9ydFR3aW5zKGltcG9ydFR3aW5zKVxyXG4gICAgdHdpbnNJbXBvcnRSZXN1bHQuZm9yRWFjaChkYXRhPT57XHJcbiAgICAgICAgZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbZGF0YVtcIiRkdElkXCJdXSA9IGRhdGE7XHJcbiAgICB9KVxyXG4gICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiYWRkTmV3VHdpbnNcIix0d2luc0luZm86dHdpbnNJbXBvcnRSZXN1bHR9KVxyXG5cclxuICAgIHZhciByZWxhdGlvbnNJbXBvcnRSZXN1bHQ9YXdhaXQgdGhpcy5iYXRjaEltcG9ydFJlbGF0aW9ucyhpbXBvcnRSZWxhdGlvbnMpXHJcbiAgICBnbG9iYWxDYWNoZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzX2FwcGVuZChyZWxhdGlvbnNJbXBvcnRSZXN1bHQpXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJkcmF3QWxsUmVsYXRpb25zXCIsaW5mbzpyZWxhdGlvbnNJbXBvcnRSZXN1bHR9KVxyXG5cclxuICAgIHZhciBudW1PZlR3aW5zPXR3aW5zSW1wb3J0UmVzdWx0Lmxlbmd0aFxyXG4gICAgdmFyIG51bU9mUmVsYXRpb25zPXJlbGF0aW9uc0ltcG9ydFJlc3VsdC5sZW5ndGhcclxuICAgIHZhciBzdHI9XCJBZGQgXCIrbnVtT2ZUd2lucysgXCIgbm9kZVwiKygobnVtT2ZUd2luczw9MSk/XCJcIjpcInNcIikrXCIsIFwiK251bU9mUmVsYXRpb25zK1wiIHJlbGF0aW9uc2hpcFwiKygobnVtT2ZSZWxhdGlvbnM8PTEpP1wiXCI6XCJzXCIpXHJcbiAgICBzdHIrPWAuIChSYXcgdHdpbiByZWNvcmRzOiR7aW1wb3J0VHdpbnMubGVuZ3RofSk7IFJhdyByZWxhdGlvbnMgcmVjb3Jkczoke2ltcG9ydFJlbGF0aW9ucy5sZW5ndGh9KWBcclxuICAgIHZhciBjb25maXJtRGlhbG9nRGl2ID0gbmV3IHNpbXBsZUNvbmZpcm1EaWFsb2coKVxyXG4gICAgY29uZmlybURpYWxvZ0Rpdi5zaG93KFxyXG4gICAgICAgIHsgd2lkdGg6IFwiNDAwcHhcIiB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGl0bGU6IFwiSW1wb3J0IFJlc3VsdFwiXHJcbiAgICAgICAgICAgICwgY29udGVudDpzdHJcclxuICAgICAgICAgICAgLCBidXR0b25zOiBbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1ncmF5XCIsIHRleHQ6IFwiT2tcIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKClcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9XHJcbiAgICApXHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuYmF0Y2hJbXBvcnRUd2lucz1hc3luYyBmdW5jdGlvbih0d2lucyl7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIGlmKHR3aW5zLmxlbmd0aD09MCkgcmVzb2x2ZShbXSlcclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgICQucG9zdChcImVkaXRBRFQvYmF0Y2hJbXBvcnRUd2luc1wiLHtcInR3aW5zXCI6SlNPTi5zdHJpbmdpZnkodHdpbnMpfSwgKGRhdGEpPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGRhdGEgPT0gXCJcIikgZGF0YT1bXVxyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShkYXRhKVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIHJlamVjdChlKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuYmF0Y2hJbXBvcnRSZWxhdGlvbnM9YXN5bmMgZnVuY3Rpb24ocmVsYXRpb25zKXtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgaWYocmVsYXRpb25zLmxlbmd0aD09MCkgcmVzb2x2ZShbXSlcclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgICQucG9zdChcImVkaXRBRFQvY3JlYXRlUmVsYXRpb25zXCIse1wiYWN0aW9uc1wiOkpTT04uc3RyaW5naWZ5KHJlbGF0aW9ucyl9LCAoZGF0YSk9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGF0YSA9PSBcIlwiKSBkYXRhPVtdXHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKGRhdGEpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1jYXRjaChlKXtcclxuICAgICAgICAgICAgcmVqZWN0KGUpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufVxyXG5cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUucmVmcmVzaEluZm9tYXRpb249YXN5bmMgZnVuY3Rpb24oKXtcclxuICAgIHZhciBhcnI9dGhpcy5zZWxlY3RlZE9iamVjdHM7XHJcbiAgICB2YXIgcXVlcnlBcnI9W11cclxuICAgIGFyci5mb3JFYWNoKG9uZUl0ZW09PntcclxuICAgICAgICBpZihvbmVJdGVtWyckcmVsYXRpb25zaGlwSWQnXSkgcXVlcnlBcnIucHVzaCh7JyRzb3VyY2VJZCc6b25lSXRlbVsnJHNvdXJjZUlkJ10sJyRyZWxhdGlvbnNoaXBJZCc6b25lSXRlbVsnJHJlbGF0aW9uc2hpcElkJ119KVxyXG4gICAgICAgIGVsc2UgcXVlcnlBcnIucHVzaCh7JyRkdElkJzpvbmVJdGVtWyckZHRJZCddfSlcclxuICAgIH0pXHJcblxyXG4gICAgJC5wb3N0KFwicXVlcnlBRFQvZmV0Y2hJbmZvbWF0aW9uXCIse1wiZWxlbWVudHNcIjpxdWVyeUFycn0sICAoZGF0YSk9PiB7XHJcbiAgICAgICAgaWYoZGF0YT09XCJcIikgcmV0dXJuO1xyXG4gICAgICAgIGRhdGEuZm9yRWFjaChvbmVSZT0+e1xyXG4gICAgICAgICAgICBpZihvbmVSZVtcIiRyZWxhdGlvbnNoaXBJZFwiXSl7Ly91cGRhdGUgc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzXHJcbiAgICAgICAgICAgICAgICB2YXIgc3JjSUQ9IG9uZVJlWyckc291cmNlSWQnXVxyXG4gICAgICAgICAgICAgICAgdmFyIHJlbGF0aW9uc2hpcElkPSBvbmVSZVsnJHJlbGF0aW9uc2hpcElkJ11cclxuICAgICAgICAgICAgICAgIGlmKGdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tzcmNJRF0hPW51bGwpe1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciByZWxhdGlvbnM9Z2xvYmFsQ2FjaGUuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW3NyY0lEXVxyXG4gICAgICAgICAgICAgICAgICAgIHJlbGF0aW9ucy5mb3JFYWNoKG9uZVN0b3JlZFJlbGF0aW9uPT57XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKG9uZVN0b3JlZFJlbGF0aW9uWyckcmVsYXRpb25zaGlwSWQnXT09cmVsYXRpb25zaGlwSWQpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy91cGRhdGUgYWxsIGNvbnRlbnRcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcih2YXIgaW5kIGluIG9uZVJlKXsgb25lU3RvcmVkUmVsYXRpb25baW5kXT1vbmVSZVtpbmRdIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1lbHNley8vdXBkYXRlIHN0b3JlZFR3aW5zXHJcbiAgICAgICAgICAgICAgICB2YXIgdHdpbklEPSBvbmVSZVsnJGR0SWQnXVxyXG4gICAgICAgICAgICAgICAgaWYoZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbdHdpbklEXSE9bnVsbCl7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yKHZhciBpbmQgaW4gb25lUmUpeyBnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1t0d2luSURdW2luZF09b25lUmVbaW5kXSB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vcmVkcmF3IGluZm9wYW5lbCBpZiBuZWVkZWRcclxuICAgICAgICBpZih0aGlzLnNlbGVjdGVkT2JqZWN0cy5sZW5ndGg9PTEpIHRoaXMucnhNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwic2hvd0luZm9TZWxlY3RlZE5vZGVzXCIsIGluZm86IHRoaXMuc2VsZWN0ZWRPYmplY3RzIH0pXHJcbiAgICB9KTtcclxufVxyXG5cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZGVsZXRlU2VsZWN0ZWQ9YXN5bmMgZnVuY3Rpb24oKXtcclxuICAgIHZhciBhcnI9dGhpcy5zZWxlY3RlZE9iamVjdHM7XHJcbiAgICBpZihhcnIubGVuZ3RoPT0wKSByZXR1cm47XHJcbiAgICB2YXIgcmVsYXRpb25zQXJyPVtdXHJcbiAgICB2YXIgdHdpbklEQXJyPVtdXHJcbiAgICB2YXIgdHdpbklEcz17fVxyXG4gICAgYXJyLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgaWYgKGVsZW1lbnRbJyRzb3VyY2VJZCddKSByZWxhdGlvbnNBcnIucHVzaChlbGVtZW50KTtcclxuICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICB0d2luSURBcnIucHVzaChlbGVtZW50WyckZHRJZCddKVxyXG4gICAgICAgICAgICB0d2luSURzW2VsZW1lbnRbJyRkdElkJ11dPTFcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIGZvcih2YXIgaT1yZWxhdGlvbnNBcnIubGVuZ3RoLTE7aT49MDtpLS0peyAvL2NsZWFyIHRob3NlIHJlbGF0aW9uc2hpcHMgdGhhdCBhcmUgZ29pbmcgdG8gYmUgZGVsZXRlZCBhZnRlciB0d2lucyBkZWxldGluZ1xyXG4gICAgICAgIHZhciBzcmNJZD0gIHJlbGF0aW9uc0FycltpXVsnJHNvdXJjZUlkJ11cclxuICAgICAgICB2YXIgdGFyZ2V0SWQgPSByZWxhdGlvbnNBcnJbaV1bJyR0YXJnZXRJZCddXHJcbiAgICAgICAgaWYodHdpbklEc1tzcmNJZF0hPW51bGwgfHwgdHdpbklEc1t0YXJnZXRJZF0hPW51bGwpe1xyXG4gICAgICAgICAgICByZWxhdGlvbnNBcnIuc3BsaWNlKGksMSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGNvbmZpcm1EaWFsb2dEaXYgPSBuZXcgc2ltcGxlQ29uZmlybURpYWxvZygpXHJcbiAgICB2YXIgZGlhbG9nU3RyPVwiXCJcclxuICAgIHZhciB0d2luTnVtYmVyPXR3aW5JREFyci5sZW5ndGg7XHJcbiAgICB2YXIgcmVsYXRpb25zTnVtYmVyID0gcmVsYXRpb25zQXJyLmxlbmd0aDtcclxuICAgIGlmKHR3aW5OdW1iZXI+MCkgZGlhbG9nU3RyID0gIHR3aW5OdW1iZXIrXCIgdHdpblwiKygodHdpbk51bWJlcj4xKT9cInNcIjpcIlwiKSArIFwiICh3aXRoIGNvbm5lY3RlZCByZWxhdGlvbnMpXCJcclxuICAgIGlmKHR3aW5OdW1iZXI+MCAmJiByZWxhdGlvbnNOdW1iZXI+MCkgZGlhbG9nU3RyKz1cIiBhbmQgYWRkaXRpb25hbCBcIlxyXG4gICAgaWYocmVsYXRpb25zTnVtYmVyPjApIGRpYWxvZ1N0ciArPSAgcmVsYXRpb25zTnVtYmVyK1wiIHJlbGF0aW9uXCIrKChyZWxhdGlvbnNOdW1iZXI+MSk/XCJzXCI6XCJcIiApXHJcbiAgICBkaWFsb2dTdHIrPVwiIHdpbGwgYmUgZGVsZXRlZC4gUGxlYXNlIGNvbmZpcm1cIlxyXG4gICAgY29uZmlybURpYWxvZ0Rpdi5zaG93KFxyXG4gICAgICAgIHsgd2lkdGg6IFwiMzUwcHhcIiB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGl0bGU6IFwiQ29uZmlybVwiXHJcbiAgICAgICAgICAgICwgY29udGVudDpkaWFsb2dTdHJcclxuICAgICAgICAgICAgLCBidXR0b25zOiBbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1yZWQgdzMtaG92ZXItcGlua1wiLCB0ZXh0OiBcIkNvbmZpcm1cIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHdpbklEQXJyLmxlbmd0aCA+IDApIHRoaXMuZGVsZXRlVHdpbnModHdpbklEQXJyKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVsYXRpb25zQXJyLmxlbmd0aCA+IDApIHRoaXMuZGVsZXRlUmVsYXRpb25zKHJlbGF0aW9uc0FycilcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuRE9NLmVtcHR5KClcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmF3QnV0dG9ucyhudWxsKVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1ncmF5XCIsIHRleHQ6IFwiQ2FuY2VsXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfVxyXG4gICAgKVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmRlbGV0ZVR3aW5zPWFzeW5jIGZ1bmN0aW9uKHR3aW5JREFycil7ICAgXHJcbiAgICB3aGlsZSh0d2luSURBcnIubGVuZ3RoPjApe1xyXG4gICAgICAgIHZhciBzbWFsbEFycj0gdHdpbklEQXJyLnNwbGljZSgwLCAxMDApO1xyXG4gICAgICAgIHZhciByZXN1bHQ9YXdhaXQgdGhpcy5kZWxldGVQYXJ0aWFsVHdpbnMoc21hbGxBcnIpXHJcblxyXG4gICAgICAgIHJlc3VsdC5mb3JFYWNoKChvbmVJRCk9PntcclxuICAgICAgICAgICAgZGVsZXRlIGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW29uZUlEXVxyXG4gICAgICAgICAgICBkZWxldGUgZ2xvYmFsQ2FjaGUuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW29uZUlEXVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJ0d2luc0RlbGV0ZWRcIix0d2luSURBcnI6cmVzdWx0fSlcclxuICAgIH1cclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5kZWxldGVQYXJ0aWFsVHdpbnM9IGFzeW5jIGZ1bmN0aW9uKElEQXJyKXtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICAkLnBvc3QoXCJlZGl0QURUL2RlbGV0ZVR3aW5zXCIse2FycjpJREFycn0sIGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICBpZihkYXRhPT1cIlwiKSBkYXRhPVtdXHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKGRhdGEpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1jYXRjaChlKXtcclxuICAgICAgICAgICAgcmVqZWN0KGUpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufVxyXG5cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZGVsZXRlUmVsYXRpb25zPWFzeW5jIGZ1bmN0aW9uKHJlbGF0aW9uc0Fycil7XHJcbiAgICB2YXIgYXJyPVtdXHJcbiAgICByZWxhdGlvbnNBcnIuZm9yRWFjaChvbmVSZWxhdGlvbj0+e1xyXG4gICAgICAgIGFyci5wdXNoKHtzcmNJRDpvbmVSZWxhdGlvblsnJHNvdXJjZUlkJ10scmVsSUQ6b25lUmVsYXRpb25bJyRyZWxhdGlvbnNoaXBJZCddfSlcclxuICAgIH0pXHJcbiAgICAkLnBvc3QoXCJlZGl0QURUL2RlbGV0ZVJlbGF0aW9uc1wiLHtcInJlbGF0aW9uc1wiOmFycn0sICAoZGF0YSk9PiB7IFxyXG4gICAgICAgIGlmKGRhdGE9PVwiXCIpIGRhdGE9W107XHJcbiAgICAgICAgZ2xvYmFsQ2FjaGUuc3RvcmVUd2luUmVsYXRpb25zaGlwc19yZW1vdmUoZGF0YSlcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJyZWxhdGlvbnNEZWxldGVkXCIsXCJyZWxhdGlvbnNcIjpkYXRhfSlcclxuICAgIH0pO1xyXG4gICAgXHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuc2hvd091dEJvdW5kPWFzeW5jIGZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgYXJyPXRoaXMuc2VsZWN0ZWRPYmplY3RzO1xyXG4gICAgdmFyIHR3aW5JREFycj1bXVxyXG4gICAgYXJyLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgaWYgKGVsZW1lbnRbJyRzb3VyY2VJZCddKSByZXR1cm47XHJcbiAgICAgICAgdHdpbklEQXJyLnB1c2goZWxlbWVudFsnJGR0SWQnXSlcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICB3aGlsZSh0d2luSURBcnIubGVuZ3RoPjApe1xyXG4gICAgICAgIHZhciBzbWFsbEFycj0gdHdpbklEQXJyLnNwbGljZSgwLCAxMDApO1xyXG4gICAgICAgIHZhciBkYXRhPWF3YWl0IHRoaXMuZmV0Y2hQYXJ0aWFsT3V0Ym91bmRzKHNtYWxsQXJyKVxyXG4gICAgICAgIGlmKGRhdGE9PVwiXCIpIGNvbnRpbnVlO1xyXG4gICAgICAgIC8vbmV3IHR3aW4ncyByZWxhdGlvbnNoaXAgc2hvdWxkIGJlIHN0b3JlZCBhcyB3ZWxsXHJcbiAgICAgICAgZ2xvYmFsQ2FjaGUuc3RvcmVUd2luUmVsYXRpb25zaGlwcyhkYXRhLm5ld1R3aW5SZWxhdGlvbnMpXHJcbiAgICAgICAgXHJcbiAgICAgICAgZGF0YS5jaGlsZFR3aW5zQW5kUmVsYXRpb25zLmZvckVhY2gob25lU2V0PT57XHJcbiAgICAgICAgICAgIGZvcih2YXIgaW5kIGluIG9uZVNldC5jaGlsZFR3aW5zKXtcclxuICAgICAgICAgICAgICAgIHZhciBvbmVUd2luPW9uZVNldC5jaGlsZFR3aW5zW2luZF1cclxuICAgICAgICAgICAgICAgIGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW2luZF09b25lVHdpblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJkcmF3VHdpbnNBbmRSZWxhdGlvbnNcIixpbmZvOmRhdGF9KVxyXG4gICAgICAgIFxyXG5cclxuICAgIH1cclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5zaG93SW5Cb3VuZD1hc3luYyBmdW5jdGlvbigpe1xyXG4gICAgdmFyIGFycj10aGlzLnNlbGVjdGVkT2JqZWN0cztcclxuICAgIHZhciB0d2luSURBcnI9W11cclxuICAgIGFyci5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIGlmIChlbGVtZW50Wyckc291cmNlSWQnXSkgcmV0dXJuO1xyXG4gICAgICAgIHR3aW5JREFyci5wdXNoKGVsZW1lbnRbJyRkdElkJ10pXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgd2hpbGUodHdpbklEQXJyLmxlbmd0aD4wKXtcclxuICAgICAgICB2YXIgc21hbGxBcnI9IHR3aW5JREFyci5zcGxpY2UoMCwgMTAwKTtcclxuICAgICAgICB2YXIgZGF0YT1hd2FpdCB0aGlzLmZldGNoUGFydGlhbEluYm91bmRzKHNtYWxsQXJyKVxyXG4gICAgICAgIGlmKGRhdGE9PVwiXCIpIGNvbnRpbnVlO1xyXG4gICAgICAgIC8vbmV3IHR3aW4ncyByZWxhdGlvbnNoaXAgc2hvdWxkIGJlIHN0b3JlZCBhcyB3ZWxsXHJcbiAgICAgICAgZ2xvYmFsQ2FjaGUuc3RvcmVUd2luUmVsYXRpb25zaGlwcyhkYXRhLm5ld1R3aW5SZWxhdGlvbnMpXHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9kYXRhLm5ld1R3aW5SZWxhdGlvbnMuZm9yRWFjaChvbmVSZWxhdGlvbj0+e2NvbnNvbGUubG9nKG9uZVJlbGF0aW9uWyckc291cmNlSWQnXStcIi0+XCIrb25lUmVsYXRpb25bJyR0YXJnZXRJZCddKX0pXHJcbiAgICAgICAgLy9jb25zb2xlLmxvZyhnbG9iYWxDYWNoZS5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbXCJkZWZhdWx0XCJdKVxyXG5cclxuICAgICAgICBkYXRhLmNoaWxkVHdpbnNBbmRSZWxhdGlvbnMuZm9yRWFjaChvbmVTZXQ9PntcclxuICAgICAgICAgICAgZm9yKHZhciBpbmQgaW4gb25lU2V0LmNoaWxkVHdpbnMpe1xyXG4gICAgICAgICAgICAgICAgdmFyIG9uZVR3aW49b25lU2V0LmNoaWxkVHdpbnNbaW5kXVxyXG4gICAgICAgICAgICAgICAgZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbaW5kXT1vbmVUd2luXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImRyYXdUd2luc0FuZFJlbGF0aW9uc1wiLGluZm86ZGF0YX0pXHJcbiAgICB9XHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZmV0Y2hQYXJ0aWFsT3V0Ym91bmRzPSBhc3luYyBmdW5jdGlvbihJREFycil7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICAgLy9maW5kIG91dCB0aG9zZSBleGlzdGVkIG91dGJvdW5kIHdpdGgga25vd24gdGFyZ2V0IFR3aW5zIHNvIHRoZXkgY2FuIGJlIGV4Y2x1ZGVkIGZyb20gcXVlcnlcclxuICAgICAgICAgICAgdmFyIGtub3duVGFyZ2V0VHdpbnM9e31cclxuICAgICAgICAgICAgSURBcnIuZm9yRWFjaChvbmVJRD0+e1xyXG4gICAgICAgICAgICAgICAga25vd25UYXJnZXRUd2luc1tvbmVJRF09MSAvL2l0c2VsZiBhbHNvIGlzIGtub3duXHJcbiAgICAgICAgICAgICAgICB2YXIgb3V0Qm91bmRSZWxhdGlvbj1nbG9iYWxDYWNoZS5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbb25lSURdXHJcbiAgICAgICAgICAgICAgICBpZihvdXRCb3VuZFJlbGF0aW9uKXtcclxuICAgICAgICAgICAgICAgICAgICBvdXRCb3VuZFJlbGF0aW9uLmZvckVhY2gob25lUmVsYXRpb249PntcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRhcmdldElEPW9uZVJlbGF0aW9uW1wiJHRhcmdldElkXCJdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3RhcmdldElEXSE9bnVsbCkga25vd25UYXJnZXRUd2luc1t0YXJnZXRJRF09MVxyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICAkLnBvc3QoXCJxdWVyeUFEVC9zaG93T3V0Qm91bmRcIix7YXJyOklEQXJyLFwia25vd25UYXJnZXRzXCI6a25vd25UYXJnZXRUd2luc30sIGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKGRhdGEpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1jYXRjaChlKXtcclxuICAgICAgICAgICAgcmVqZWN0KGUpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5mZXRjaFBhcnRpYWxJbmJvdW5kcz0gYXN5bmMgZnVuY3Rpb24oSURBcnIpe1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgIC8vZmluZCBvdXQgdGhvc2UgZXhpc3RlZCBpbmJvdW5kIHdpdGgga25vd24gc291cmNlIFR3aW5zIHNvIHRoZXkgY2FuIGJlIGV4Y2x1ZGVkIGZyb20gcXVlcnlcclxuICAgICAgICAgICAgdmFyIGtub3duU291cmNlVHdpbnM9e31cclxuICAgICAgICAgICAgdmFyIElERGljdD17fVxyXG4gICAgICAgICAgICBJREFyci5mb3JFYWNoKG9uZUlEPT57XHJcbiAgICAgICAgICAgICAgICBJRERpY3Rbb25lSURdPTFcclxuICAgICAgICAgICAgICAgIGtub3duU291cmNlVHdpbnNbb25lSURdPTEgLy9pdHNlbGYgYWxzbyBpcyBrbm93blxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICBmb3IodmFyIHR3aW5JRCBpbiBnbG9iYWxDYWNoZS5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHMpe1xyXG4gICAgICAgICAgICAgICAgdmFyIHJlbGF0aW9ucz1nbG9iYWxDYWNoZS5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbdHdpbklEXVxyXG4gICAgICAgICAgICAgICAgcmVsYXRpb25zLmZvckVhY2gob25lUmVsYXRpb249PntcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdGFyZ2V0SUQ9b25lUmVsYXRpb25bJyR0YXJnZXRJZCddXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNyY0lEPW9uZVJlbGF0aW9uWyckc291cmNlSWQnXVxyXG4gICAgICAgICAgICAgICAgICAgIGlmKElERGljdFt0YXJnZXRJRF0hPW51bGwpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZihnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1tzcmNJRF0hPW51bGwpIGtub3duU291cmNlVHdpbnNbc3JjSURdPTFcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAkLnBvc3QoXCJxdWVyeUFEVC9zaG93SW5Cb3VuZFwiLHthcnI6SURBcnIsXCJrbm93blNvdXJjZXNcIjprbm93blNvdXJjZVR3aW5zfSwgZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoZGF0YSlcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfWNhdGNoKGUpe1xyXG4gICAgICAgICAgICByZWplY3QoZSlcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmRyYXdNdWx0aXBsZU9iaj1mdW5jdGlvbigpe1xyXG4gICAgdmFyIG51bU9mRWRnZSA9IDA7XHJcbiAgICB2YXIgbnVtT2ZOb2RlID0gMDtcclxuICAgIHZhciBhcnI9dGhpcy5zZWxlY3RlZE9iamVjdHM7XHJcbiAgICBpZihhcnI9PW51bGwpIHJldHVybjtcclxuICAgIGFyci5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIGlmIChlbGVtZW50Wyckc291cmNlSWQnXSkgbnVtT2ZFZGdlKytcclxuICAgICAgICBlbHNlIG51bU9mTm9kZSsrXHJcbiAgICB9KTtcclxuICAgIHZhciB0ZXh0RGl2PSQoXCI8bGFiZWwgc3R5bGU9J2Rpc3BsYXk6YmxvY2s7bWFyZ2luLXRvcDoxMHB4Jz48L2xhYmVsPlwiKVxyXG4gICAgdGV4dERpdi50ZXh0KG51bU9mTm9kZSsgXCIgbm9kZVwiKygobnVtT2ZOb2RlPD0xKT9cIlwiOlwic1wiKStcIiwgXCIrbnVtT2ZFZGdlK1wiIHJlbGF0aW9uc2hpcFwiKygobnVtT2ZFZGdlPD0xKT9cIlwiOlwic1wiKSlcclxuICAgIHRoaXMuRE9NLmFwcGVuZCh0ZXh0RGl2KVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmRyYXdTdGF0aWNJbmZvPWZ1bmN0aW9uKHBhcmVudCxqc29uSW5mbyxwYWRkaW5nVG9wLGZvbnRTaXplKXtcclxuICAgIGZvcih2YXIgaW5kIGluIGpzb25JbmZvKXtcclxuICAgICAgICB2YXIga2V5RGl2PSAkKFwiPGxhYmVsIHN0eWxlPSdkaXNwbGF5OmJsb2NrJz48ZGl2IGNsYXNzPSd3My1kYXJrLWdyYXknIHN0eWxlPSdiYWNrZ3JvdW5kLWNvbG9yOiNmNmY2ZjY7ZGlzcGxheTppbmxpbmU7cGFkZGluZzouMWVtIC4zZW0gLjFlbSAuM2VtO21hcmdpbi1yaWdodDouM2VtO2ZvbnQtc2l6ZToxMHB4Jz5cIitpbmQrXCI8L2Rpdj48L2xhYmVsPlwiKVxyXG4gICAgICAgIHBhcmVudC5hcHBlbmQoa2V5RGl2KVxyXG4gICAgICAgIGtleURpdi5jc3MoXCJwYWRkaW5nLXRvcFwiLHBhZGRpbmdUb3ApXHJcblxyXG4gICAgICAgIHZhciBjb250ZW50RE9NPSQoXCI8bGFiZWw+PC9sYWJlbD5cIilcclxuICAgICAgICBpZih0eXBlb2YoanNvbkluZm9baW5kXSk9PT1cIm9iamVjdFwiKSB7XHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwiZGlzcGxheVwiLFwiYmxvY2tcIilcclxuICAgICAgICAgICAgY29udGVudERPTS5jc3MoXCJwYWRkaW5nLWxlZnRcIixcIjFlbVwiKVxyXG4gICAgICAgICAgICB0aGlzLmRyYXdTdGF0aWNJbmZvKGNvbnRlbnRET00sanNvbkluZm9baW5kXSxcIi41ZW1cIixmb250U2l6ZSlcclxuICAgICAgICB9ZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwicGFkZGluZy10b3BcIixcIi4yZW1cIilcclxuICAgICAgICAgICAgY29udGVudERPTS50ZXh0KGpzb25JbmZvW2luZF0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnRlbnRET00uY3NzKHtcImZvbnRTaXplXCI6Zm9udFNpemUsXCJjb2xvclwiOlwiYmxhY2tcIn0pXHJcbiAgICAgICAga2V5RGl2LmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgfVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmRyYXdFZGl0YWJsZT1mdW5jdGlvbihwYXJlbnQsanNvbkluZm8sb3JpZ2luRWxlbWVudEluZm8scGF0aEFycixpc05ld1R3aW4pe1xyXG4gICAgaWYoanNvbkluZm89PW51bGwpIHJldHVybjtcclxuICAgIGZvcih2YXIgaW5kIGluIGpzb25JbmZvKXtcclxuICAgICAgICB2YXIga2V5RGl2PSAkKFwiPGxhYmVsIHN0eWxlPSdkaXNwbGF5OmJsb2NrJz48ZGl2IHN0eWxlPSdkaXNwbGF5OmlubGluZTtwYWRkaW5nOi4xZW0gLjNlbSAuMWVtIC4zZW07IG1hcmdpbi1yaWdodDo1cHgnPlwiK2luZCtcIjwvZGl2PjwvbGFiZWw+XCIpXHJcbiAgICAgICAgaWYoaXNOZXdUd2luKXtcclxuICAgICAgICAgICAgaWYoaW5kPT1cIiRkdElkXCIpIHtcclxuICAgICAgICAgICAgICAgIHBhcmVudC5wcmVwZW5kKGtleURpdilcclxuICAgICAgICAgICAgICAgIGtleURpdi5hdHRyKCdpZCcsJ05FV1RXSU5fSURMYWJlbCcpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgcGFyZW50LmFwcGVuZChrZXlEaXYpXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHBhcmVudC5hcHBlbmQoa2V5RGl2KVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBrZXlEaXYuY3NzKFwicGFkZGluZy10b3BcIixcIi4zZW1cIikgXHJcblxyXG4gICAgICAgIHZhciBjb250ZW50RE9NPSQoXCI8bGFiZWwgc3R5bGU9J3BhZGRpbmctdG9wOi4yZW0nPjwvbGFiZWw+XCIpXHJcbiAgICAgICAgdmFyIG5ld1BhdGg9cGF0aEFyci5jb25jYXQoW2luZF0pXHJcbiAgICAgICAgaWYoQXJyYXkuaXNBcnJheShqc29uSW5mb1tpbmRdKSl7XHJcbiAgICAgICAgICAgIGtleURpdi5jaGlsZHJlbihcIjpmaXJzdFwiKS5hZGRDbGFzcyhcInczLWxpbWVcIilcclxuICAgICAgICAgICAgdGhpcy5kcmF3RHJvcGRvd25PcHRpb24oY29udGVudERPTSxuZXdQYXRoLGpzb25JbmZvW2luZF0saXNOZXdUd2luLG9yaWdpbkVsZW1lbnRJbmZvKVxyXG4gICAgICAgIH1lbHNlIGlmKHR5cGVvZihqc29uSW5mb1tpbmRdKT09PVwib2JqZWN0XCIpIHtcclxuICAgICAgICAgICAga2V5RGl2LmNoaWxkcmVuKFwiOmZpcnN0XCIpLmNzcyhcImZvbnQtd2VpZ2h0XCIsXCJib2xkXCIpXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwiZGlzcGxheVwiLFwiYmxvY2tcIilcclxuICAgICAgICAgICAgY29udGVudERPTS5jc3MoXCJwYWRkaW5nLWxlZnRcIixcIjFlbVwiKVxyXG4gICAgICAgICAgICB0aGlzLmRyYXdFZGl0YWJsZShjb250ZW50RE9NLGpzb25JbmZvW2luZF0sb3JpZ2luRWxlbWVudEluZm8sbmV3UGF0aCxpc05ld1R3aW4pXHJcbiAgICAgICAgfWVsc2Uge1xyXG4gICAgICAgICAgICBrZXlEaXYuY2hpbGRyZW4oXCI6Zmlyc3RcIikuYWRkQ2xhc3MoXCJ3My1saW1lXCIpXHJcbiAgICAgICAgICAgIHZhciBhSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJwYWRkaW5nOjJweDt3aWR0aDo1MCU7b3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lXCIgcGxhY2Vob2xkZXI9XCJ0eXBlOiAnK2pzb25JbmZvW2luZF0rJ1wiLz4nKS5hZGRDbGFzcyhcInczLWlucHV0IHczLWJvcmRlclwiKTsgIFxyXG4gICAgICAgICAgICBjb250ZW50RE9NLmFwcGVuZChhSW5wdXQpXHJcbiAgICAgICAgICAgIHZhciB2YWw9dGhpcy5zZWFyY2hWYWx1ZShvcmlnaW5FbGVtZW50SW5mbyxuZXdQYXRoKVxyXG4gICAgICAgICAgICBpZih2YWwhPW51bGwpIGFJbnB1dC52YWwodmFsKVxyXG4gICAgICAgICAgICBhSW5wdXQuZGF0YShcInBhdGhcIiwgbmV3UGF0aClcclxuICAgICAgICAgICAgYUlucHV0LmRhdGEoXCJkYXRhVHlwZVwiLCBqc29uSW5mb1tpbmRdKVxyXG4gICAgICAgICAgICBhSW5wdXQuY2hhbmdlKChlKT0+e1xyXG4gICAgICAgICAgICAgICAgdGhpcy5lZGl0RFRQcm9wZXJ0eShvcmlnaW5FbGVtZW50SW5mbywkKGUudGFyZ2V0KS5kYXRhKFwicGF0aFwiKSwkKGUudGFyZ2V0KS52YWwoKSwkKGUudGFyZ2V0KS5kYXRhKFwiZGF0YVR5cGVcIiksaXNOZXdUd2luKVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgICAgICBrZXlEaXYuYXBwZW5kKGNvbnRlbnRET00pXHJcbiAgICB9XHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZHJhd0Ryb3Bkb3duT3B0aW9uPWZ1bmN0aW9uKGNvbnRlbnRET00sbmV3UGF0aCx2YWx1ZUFycixpc05ld1R3aW4sb3JpZ2luRWxlbWVudEluZm8pe1xyXG4gICAgdmFyIGFTZWxlY3RNZW51PW5ldyBzaW1wbGVTZWxlY3RNZW51KFwiXCIse2J1dHRvbkNTUzp7XCJwYWRkaW5nXCI6XCI0cHggMTZweFwifX0pXHJcbiAgICBjb250ZW50RE9NLmFwcGVuZChhU2VsZWN0TWVudS5ET00pXHJcbiAgICBhU2VsZWN0TWVudS5ET00uZGF0YShcInBhdGhcIiwgbmV3UGF0aClcclxuICAgIHZhbHVlQXJyLmZvckVhY2goKG9uZU9wdGlvbik9PntcclxuICAgICAgICB2YXIgc3RyID1vbmVPcHRpb25bXCJkaXNwbGF5TmFtZVwiXSAgfHwgb25lT3B0aW9uW1wiZW51bVZhbHVlXCJdIFxyXG4gICAgICAgIGFTZWxlY3RNZW51LmFkZE9wdGlvbihzdHIpXHJcbiAgICB9KVxyXG4gICAgYVNlbGVjdE1lbnUuY2FsbEJhY2tfY2xpY2tPcHRpb249KG9wdGlvblRleHQsb3B0aW9uVmFsdWUscmVhbE1vdXNlQ2xpY2spPT57XHJcbiAgICAgICAgYVNlbGVjdE1lbnUuY2hhbmdlTmFtZShvcHRpb25UZXh0KVxyXG4gICAgICAgIGlmKHJlYWxNb3VzZUNsaWNrKSB0aGlzLmVkaXREVFByb3BlcnR5KG9yaWdpbkVsZW1lbnRJbmZvLGFTZWxlY3RNZW51LkRPTS5kYXRhKFwicGF0aFwiKSxvcHRpb25WYWx1ZSxcInN0cmluZ1wiLGlzTmV3VHdpbilcclxuICAgIH1cclxuICAgIHZhciB2YWw9dGhpcy5zZWFyY2hWYWx1ZShvcmlnaW5FbGVtZW50SW5mbyxuZXdQYXRoKVxyXG4gICAgaWYodmFsIT1udWxsKXtcclxuICAgICAgICBhU2VsZWN0TWVudS50cmlnZ2VyT3B0aW9uVmFsdWUodmFsKVxyXG4gICAgfSAgICBcclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5lZGl0RFRQcm9wZXJ0eT1mdW5jdGlvbihvcmlnaW5FbGVtZW50SW5mbyxwYXRoLG5ld1ZhbCxkYXRhVHlwZSxpc05ld1R3aW4pe1xyXG4gICAgaWYgKFtcImRvdWJsZVwiLCBcImZsb2F0XCIsIFwiaW50ZWdlclwiLCBcImxvbmdcIl0uaW5jbHVkZXMoZGF0YVR5cGUpKSBuZXdWYWwgPSBOdW1iZXIobmV3VmFsKVxyXG4gICAgaWYgKGRhdGFUeXBlID09IFwiYm9vbGVhblwiKSB7XHJcbiAgICAgICAgaWYgKG5ld1ZhbCA9PSBcInRydWVcIikgbmV3VmFsID0gdHJ1ZVxyXG4gICAgICAgIGVsc2UgbmV3VmFsID0gZmFsc2VcclxuICAgIH1cclxuXHJcbiAgICAvL3sgXCJvcFwiOiBcImFkZFwiLCBcInBhdGhcIjogXCIveFwiLCBcInZhbHVlXCI6IDMwIH1cclxuICAgIGlmKGlzTmV3VHdpbil7XHJcbiAgICAgICAgdGhpcy51cGRhdGVPcmlnaW5PYmplY3RWYWx1ZShvcmlnaW5FbGVtZW50SW5mbyxwYXRoLG5ld1ZhbClcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICBpZihwYXRoLmxlbmd0aD09MSl7XHJcbiAgICAgICAgdmFyIHN0cj1cIlwiXHJcbiAgICAgICAgcGF0aC5mb3JFYWNoKHNlZ21lbnQ9PntzdHIrPVwiL1wiK3NlZ21lbnR9KVxyXG4gICAgICAgIHZhciBqc29uUGF0Y2g9WyB7IFwib3BcIjogXCJhZGRcIiwgXCJwYXRoXCI6IHN0ciwgXCJ2YWx1ZVwiOiBuZXdWYWx9IF1cclxuICAgIH1lbHNle1xyXG4gICAgICAgIC8vaXQgaXMgYSBwcm9wZXJ0eSBpbnNpZGUgYSBvYmplY3QgdHlwZSBvZiByb290IHByb3BlcnR5LHVwZGF0ZSB0aGUgd2hvbGUgcm9vdCBwcm9wZXJ0eVxyXG4gICAgICAgIHZhciByb290UHJvcGVydHk9cGF0aFswXVxyXG4gICAgICAgIHZhciBwYXRjaFZhbHVlPSBvcmlnaW5FbGVtZW50SW5mb1tyb290UHJvcGVydHldXHJcbiAgICAgICAgaWYocGF0Y2hWYWx1ZT09bnVsbCkgcGF0Y2hWYWx1ZT17fVxyXG4gICAgICAgIGVsc2UgcGF0Y2hWYWx1ZT1KU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHBhdGNoVmFsdWUpKSAvL21ha2UgYSBjb3B5XHJcbiAgICAgICAgdGhpcy51cGRhdGVPcmlnaW5PYmplY3RWYWx1ZShwYXRjaFZhbHVlLHBhdGguc2xpY2UoMSksbmV3VmFsKVxyXG4gICAgICAgIFxyXG4gICAgICAgIHZhciBqc29uUGF0Y2g9WyB7IFwib3BcIjogXCJhZGRcIiwgXCJwYXRoXCI6IFwiL1wiK3Jvb3RQcm9wZXJ0eSwgXCJ2YWx1ZVwiOiBwYXRjaFZhbHVlfSBdXHJcbiAgICB9XHJcblxyXG4gICAgaWYob3JpZ2luRWxlbWVudEluZm9bXCIkZHRJZFwiXSl7IC8vZWRpdCBhIG5vZGUgcHJvcGVydHlcclxuICAgICAgICB2YXIgdHdpbklEID0gb3JpZ2luRWxlbWVudEluZm9bXCIkZHRJZFwiXVxyXG4gICAgICAgIHZhciBwYXlMb2FkPXtcImpzb25QYXRjaFwiOkpTT04uc3RyaW5naWZ5KGpzb25QYXRjaCksXCJ0d2luSURcIjp0d2luSUR9XHJcbiAgICB9ZWxzZSBpZihvcmlnaW5FbGVtZW50SW5mb1tcIiRyZWxhdGlvbnNoaXBJZFwiXSl7IC8vZWRpdCBhIHJlbGF0aW9uc2hpcCBwcm9wZXJ0eVxyXG4gICAgICAgIHZhciB0d2luSUQgPSBvcmlnaW5FbGVtZW50SW5mb1tcIiRzb3VyY2VJZFwiXVxyXG4gICAgICAgIHZhciByZWxhdGlvbnNoaXBJRCA9IG9yaWdpbkVsZW1lbnRJbmZvW1wiJHJlbGF0aW9uc2hpcElkXCJdXHJcbiAgICAgICAgdmFyIHBheUxvYWQ9e1wianNvblBhdGNoXCI6SlNPTi5zdHJpbmdpZnkoanNvblBhdGNoKSxcInR3aW5JRFwiOnR3aW5JRCxcInJlbGF0aW9uc2hpcElEXCI6cmVsYXRpb25zaGlwSUR9XHJcbiAgICB9XHJcbiAgICBcclxuICAgICQucG9zdChcImVkaXRBRFQvY2hhbmdlQXR0cmlidXRlXCIscGF5TG9hZFxyXG4gICAgICAgICwgIChkYXRhKT0+IHtcclxuICAgICAgICAgICAgaWYoZGF0YSE9XCJcIikge1xyXG4gICAgICAgICAgICAgICAgLy9ub3Qgc3VjY2Vzc2Z1bCBlZGl0aW5nXHJcbiAgICAgICAgICAgICAgICBhbGVydChkYXRhKVxyXG4gICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgIC8vc3VjY2Vzc2Z1bCBlZGl0aW5nLCB1cGRhdGUgdGhlIG5vZGUgb3JpZ2luYWwgaW5mb1xyXG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVPcmlnaW5PYmplY3RWYWx1ZShvcmlnaW5FbGVtZW50SW5mbyxwYXRoLG5ld1ZhbClcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLnVwZGF0ZU9yaWdpbk9iamVjdFZhbHVlPWZ1bmN0aW9uKG5vZGVJbmZvLHBhdGhBcnIsbmV3VmFsKXtcclxuICAgIGlmKHBhdGhBcnIubGVuZ3RoPT0wKSByZXR1cm47XHJcbiAgICB2YXIgdGhlSnNvbj1ub2RlSW5mb1xyXG4gICAgZm9yKHZhciBpPTA7aTxwYXRoQXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBrZXk9cGF0aEFycltpXVxyXG5cclxuICAgICAgICBpZihpPT1wYXRoQXJyLmxlbmd0aC0xKXtcclxuICAgICAgICAgICAgdGhlSnNvbltrZXldPW5ld1ZhbFxyXG4gICAgICAgICAgICBicmVha1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZih0aGVKc29uW2tleV09PW51bGwpIHRoZUpzb25ba2V5XT17fVxyXG4gICAgICAgIHRoZUpzb249dGhlSnNvbltrZXldXHJcbiAgICB9XHJcbiAgICByZXR1cm5cclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5zZWFyY2hWYWx1ZT1mdW5jdGlvbihvcmlnaW5FbGVtZW50SW5mbyxwYXRoQXJyKXtcclxuICAgIGlmKHBhdGhBcnIubGVuZ3RoPT0wKSByZXR1cm4gbnVsbDtcclxuICAgIHZhciB0aGVKc29uPW9yaWdpbkVsZW1lbnRJbmZvXHJcbiAgICBmb3IodmFyIGk9MDtpPHBhdGhBcnIubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIGtleT1wYXRoQXJyW2ldXHJcbiAgICAgICAgdGhlSnNvbj10aGVKc29uW2tleV1cclxuICAgICAgICBpZih0aGVKc29uPT1udWxsKSByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGVKc29uIC8vaXQgc2hvdWxkIGJlIHRoZSBmaW5hbCB2YWx1ZVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBpbmZvUGFuZWwoKTsiLCIkKCdkb2N1bWVudCcpLnJlYWR5KGZ1bmN0aW9uKCl7XHJcbiAgICBjb25zdCBtYWluVUk9cmVxdWlyZShcIi4vbWFpblVJLmpzXCIpICAgIFxyXG59KTsiLCJjb25zdCBhZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZyA9IHJlcXVpcmUoXCIuL2FkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nXCIpXHJcbmNvbnN0IG1vZGVsTWFuYWdlckRpYWxvZyA9IHJlcXVpcmUoXCIuL21vZGVsTWFuYWdlckRpYWxvZ1wiKVxyXG5jb25zdCBlZGl0TGF5b3V0RGlhbG9nPSByZXF1aXJlKFwiLi9lZGl0TGF5b3V0RGlhbG9nXCIpXHJcbmNvbnN0IHNpbXBsZVNlbGVjdE1lbnU9IHJlcXVpcmUoXCIuL3NpbXBsZVNlbGVjdE1lbnVcIilcclxuY29uc3QgZ2xvYmFsQ2FjaGUgPSByZXF1aXJlKFwiLi9nbG9iYWxDYWNoZVwiKVxyXG5cclxuZnVuY3Rpb24gbWFpblRvb2xiYXIoKSB7XHJcbn1cclxuXHJcbm1haW5Ub29sYmFyLnByb3RvdHlwZS5yZW5kZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAkKFwiI21haW5Ub29sQmFyXCIpLmFkZENsYXNzKFwidzMtYmFyIHczLXJlZFwiKVxyXG4gICAgJChcIiNtYWluVG9vbEJhclwiKS5jc3Moe1wiei1pbmRleFwiOjEwMCxcIm92ZXJmbG93XCI6XCJ2aXNpYmxlXCJ9KVxyXG5cclxuICAgIHRoaXMuc3dpdGNoQURUSW5zdGFuY2VCdG49JCgnPGEgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b25cIiBocmVmPVwiI1wiPlNvdXJjZTwvYT4nKVxyXG4gICAgdGhpcy5tb2RlbElPQnRuPSQoJzxhIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uXCIgaHJlZj1cIiNcIj5Nb2RlbHM8L2E+JylcclxuICAgIHRoaXMuc2hvd0ZvcmdlVmlld0J0bj0kKCc8YSBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ob3Zlci1ub25lIHczLXRleHQtbGlnaHQtZ3JleSB3My1ob3Zlci10ZXh0LWxpZ2h0LWdyZXlcIiBzdHlsZT1cIm9wYWNpdHk6LjM1XCIgaHJlZj1cIiNcIj5Gb3JnZVZpZXc8L2E+JylcclxuICAgIHRoaXMuc2hvd0dJU1ZpZXdCdG49JCgnPGEgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtaG92ZXItbm9uZSB3My10ZXh0LWxpZ2h0LWdyZXkgdzMtaG92ZXItdGV4dC1saWdodC1ncmV5XCIgc3R5bGU9XCJvcGFjaXR5Oi4zNVwiIGhyZWY9XCIjXCI+R0lTVmlldzwvYT4nKVxyXG4gICAgdGhpcy5lZGl0TGF5b3V0QnRuPSQoJzxhIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uXCIgaHJlZj1cIiNcIj48aSBjbGFzcz1cImZhIGZhLWVkaXRcIj48L2k+PC9hPicpXHJcblxyXG4gICAgdGhpcy5mbG9hdEluZm9CdG49JCgnPGEgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtYW1iZXJcIiBzdHlsZT1cImhlaWdodDoxMDAlO2ZvbnQtc2l6ZTo4MCVcIiBocmVmPVwiI1wiPjxzcGFuIGNsYXNzPVwiZmEtc3RhY2sgZmEteHNcIj48aSBjbGFzcz1cImZhcyBmYS1jaXJjbGUgZmEtc3RhY2stMnggZmEtaW52ZXJzZVwiPjwvaT48aSBjbGFzcz1cImZhcyBmYS1pbmZvIGZhLXN0YWNrLTF4IHczLXRleHQtYW1iZXJcIj48L2k+PC9zcGFuPjwvYT4nKVxyXG5cclxuICAgIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3I9bmV3IHNpbXBsZVNlbGVjdE1lbnUoXCJMYXlvdXRcIilcclxuXHJcbiAgICAkKFwiI21haW5Ub29sQmFyXCIpLmVtcHR5KClcclxuICAgICQoXCIjbWFpblRvb2xCYXJcIikuYXBwZW5kKHRoaXMuc3dpdGNoQURUSW5zdGFuY2VCdG4sdGhpcy5tb2RlbElPQnRuLHRoaXMuc2hvd0ZvcmdlVmlld0J0bix0aGlzLnNob3dHSVNWaWV3QnRuXHJcbiAgICAgICAgLHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuRE9NLHRoaXMuZWRpdExheW91dEJ0bix0aGlzLmZsb2F0SW5mb0J0bilcclxuXHJcbiAgICB0aGlzLnN3aXRjaEFEVEluc3RhbmNlQnRuLm9uKFwiY2xpY2tcIiwoKT0+eyBhZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZy5wb3B1cCgpIH0pXHJcbiAgICB0aGlzLm1vZGVsSU9CdG4ub24oXCJjbGlja1wiLCgpPT57IG1vZGVsTWFuYWdlckRpYWxvZy5wb3B1cCgpIH0pXHJcbiAgICB0aGlzLmVkaXRMYXlvdXRCdG4ub24oXCJjbGlja1wiLCgpPT57IGVkaXRMYXlvdXREaWFsb2cucG9wdXAoKSB9KVxyXG5cclxuICAgIHRoaXMuZmxvYXRJbmZvQnRuLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIGlmKGdsb2JhbENhY2hlLnNob3dGbG9hdEluZm9QYW5lbCkgZ2xvYmFsQ2FjaGUuc2hvd0Zsb2F0SW5mb1BhbmVsPWZhbHNlXHJcbiAgICAgICAgZWxzZSBnbG9iYWxDYWNoZS5zaG93RmxvYXRJbmZvUGFuZWw9dHJ1ZVxyXG4gICAgICAgIGlmKCFnbG9iYWxDYWNoZS5zaG93RmxvYXRJbmZvUGFuZWwpe1xyXG4gICAgICAgICAgICB0aGlzLmZsb2F0SW5mb0J0bi5yZW1vdmVDbGFzcyhcInczLWFtYmVyXCIpXHJcbiAgICAgICAgICAgIHRoaXMuZmxvYXRJbmZvQnRuLmh0bWwoJzxzcGFuIGNsYXNzPVwiZmEtc3RhY2sgZmEteHNcIj48aSBjbGFzcz1cImZhcyBmYS1iYW4gZmEtc3RhY2stMnggZmEtaW52ZXJzZVwiPjwvaT48aSBjbGFzcz1cImZhcyBmYS1pbmZvIGZhLXN0YWNrLTF4IGZhLWludmVyc2VcIj48L2k+PC9zcGFuPicpXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHRoaXMuZmxvYXRJbmZvQnRuLmFkZENsYXNzKFwidzMtYW1iZXJcIilcclxuICAgICAgICAgICAgdGhpcy5mbG9hdEluZm9CdG4uaHRtbCgnPHNwYW4gY2xhc3M9XCJmYS1zdGFjayBmYS14c1wiPjxpIGNsYXNzPVwiZmFzIGZhLWNpcmNsZSBmYS1zdGFjay0yeCBmYS1pbnZlcnNlXCI+PC9pPjxpIGNsYXNzPVwiZmFzIGZhLWluZm8gZmEtc3RhY2stMXggdzMtdGV4dC1hbWJlclwiPjwvaT48L3NwYW4+JylcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG5cclxuXHJcbiAgICB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmNhbGxCYWNrX2NsaWNrT3B0aW9uPShvcHRpb25UZXh0LG9wdGlvblZhbHVlKT0+e1xyXG4gICAgICAgIGdsb2JhbENhY2hlLmN1cnJlbnRMYXlvdXROYW1lPW9wdGlvblZhbHVlXHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwibGF5b3V0Q2hhbmdlXCJ9KVxyXG4gICAgICAgIGlmKG9wdGlvblZhbHVlPT1cIltOQV1cIikgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jaGFuZ2VOYW1lKFwiTGF5b3V0XCIsXCJcIilcclxuICAgICAgICBlbHNlIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuY2hhbmdlTmFtZShcIkxheW91dDpcIixvcHRpb25UZXh0KVxyXG4gICAgfVxyXG59XHJcblxyXG5tYWluVG9vbGJhci5wcm90b3R5cGUudXBkYXRlTGF5b3V0U2VsZWN0b3IgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgY3VyU2VsZWN0PXRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuY3VyU2VsZWN0VmFsXHJcbiAgICB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmNsZWFyT3B0aW9ucygpXHJcbiAgICB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmFkZE9wdGlvbignW05vIExheW91dCBTcGVjaWZpZWRdJywnW05BXScpXHJcblxyXG4gICAgZm9yICh2YXIgaW5kIGluIGdsb2JhbENhY2hlLmxheW91dEpTT04pIHtcclxuICAgICAgICB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmFkZE9wdGlvbihpbmQpXHJcbiAgICB9XHJcblxyXG4gICAgaWYoY3VyU2VsZWN0IT1udWxsICYmIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuZmluZE9wdGlvbihjdXJTZWxlY3QpPT1udWxsKSB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmNoYW5nZU5hbWUoXCJMYXlvdXRcIixcIlwiKVxyXG59XHJcblxyXG5tYWluVG9vbGJhci5wcm90b3R5cGUucnhNZXNzYWdlPWZ1bmN0aW9uKG1zZ1BheWxvYWQpe1xyXG4gICAgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImxheW91dHNVcGRhdGVkXCIpIHtcclxuICAgICAgICB0aGlzLnVwZGF0ZUxheW91dFNlbGVjdG9yKClcclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJwb3B1cExheW91dEVkaXRpbmdcIil7XHJcbiAgICAgICAgZWRpdExheW91dERpYWxvZy5wb3B1cCgpXHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IG1haW5Ub29sYmFyKCk7IiwiJ3VzZSBzdHJpY3QnO1xyXG5jb25zdCB0b3BvbG9neURPTT1yZXF1aXJlKFwiLi90b3BvbG9neURPTS5qc1wiKVxyXG5jb25zdCB0d2luc1RyZWU9cmVxdWlyZShcIi4vdHdpbnNUcmVlXCIpXHJcbmNvbnN0IGFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nID0gcmVxdWlyZShcIi4vYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2dcIilcclxuY29uc3QgbW9kZWxNYW5hZ2VyRGlhbG9nID0gcmVxdWlyZShcIi4vbW9kZWxNYW5hZ2VyRGlhbG9nXCIpXHJcbmNvbnN0IG1vZGVsRWRpdG9yRGlhbG9nID0gcmVxdWlyZShcIi4vbW9kZWxFZGl0b3JEaWFsb2dcIilcclxuY29uc3QgZWRpdExheW91dERpYWxvZyA9IHJlcXVpcmUoXCIuL2VkaXRMYXlvdXREaWFsb2dcIilcclxuY29uc3QgbWFpblRvb2xiYXIgPSByZXF1aXJlKFwiLi9tYWluVG9vbGJhclwiKVxyXG5jb25zdCBpbmZvUGFuZWw9IHJlcXVpcmUoXCIuL2luZm9QYW5lbFwiKVxyXG5jb25zdCBmbG9hdEluZm9XaW5kb3c9cmVxdWlyZShcIi4vZmxvYXRJbmZvV2luZG93XCIpXHJcblxyXG5mdW5jdGlvbiBtYWluVUkoKSB7XHJcbiAgICB0aGlzLmluaXRVSUxheW91dCgpXHJcblxyXG4gICAgdGhpcy50d2luc1RyZWU9IG5ldyB0d2luc1RyZWUoJChcIiN0cmVlSG9sZGVyXCIpLCQoXCIjdHJlZVNlYXJjaFwiKSlcclxuICAgIFxyXG4gICAgdGhpcy5tYWluVG9vbGJhcj1tYWluVG9vbGJhclxyXG4gICAgbWFpblRvb2xiYXIucmVuZGVyKClcclxuICAgIHRoaXMudG9wb2xvZ3lJbnN0YW5jZT1uZXcgdG9wb2xvZ3lET00oJCgnI2NhbnZhcycpKVxyXG4gICAgdGhpcy50b3BvbG9neUluc3RhbmNlLmluaXQoKVxyXG4gICAgdGhpcy5pbmZvUGFuZWw9IGluZm9QYW5lbFxyXG5cclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSgpIC8vaW5pdGlhbGl6ZSBhbGwgdWkgY29tcG9uZW50cyB0byBoYXZlIHRoZSBicm9hZGNhc3QgY2FwYWJpbGl0eVxyXG4gICAgdGhpcy5wcmVwYXJlRGF0YSgpXHJcbn1cclxuXHJcbm1haW5VSS5wcm90b3R5cGUucHJlcGFyZURhdGE9YXN5bmMgZnVuY3Rpb24oKXtcclxuICAgIHZhciBwcm9taXNlQXJyPVtcclxuICAgICAgICBtb2RlbE1hbmFnZXJEaWFsb2cucHJlcGFyYXRpb25GdW5jKCksXHJcbiAgICAgICAgYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cucHJlcGFyYXRpb25GdW5jKClcclxuICAgIF1cclxuICAgIGF3YWl0IFByb21pc2UuYWxsU2V0dGxlZChwcm9taXNlQXJyKTtcclxuICAgIGFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLnBvcHVwKClcclxufVxyXG5cclxuXHJcbm1haW5VSS5wcm90b3R5cGUuYXNzaWduQnJvYWRjYXN0TWVzc2FnZT1mdW5jdGlvbih1aUNvbXBvbmVudCl7XHJcbiAgICB1aUNvbXBvbmVudC5icm9hZGNhc3RNZXNzYWdlPShtc2dPYmopPT57dGhpcy5icm9hZGNhc3RNZXNzYWdlKHVpQ29tcG9uZW50LG1zZ09iail9XHJcbn1cclxuXHJcbm1haW5VSS5wcm90b3R5cGUuYnJvYWRjYXN0TWVzc2FnZT1mdW5jdGlvbihzb3VyY2UsbXNnUGF5bG9hZCl7XHJcbiAgICB2YXIgY29tcG9uZW50c0Fycj1bdGhpcy50d2luc1RyZWUsYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2csbW9kZWxNYW5hZ2VyRGlhbG9nLG1vZGVsRWRpdG9yRGlhbG9nLGVkaXRMYXlvdXREaWFsb2csXHJcbiAgICAgICAgIHRoaXMubWFpblRvb2xiYXIsdGhpcy50b3BvbG9neUluc3RhbmNlLHRoaXMuaW5mb1BhbmVsLGZsb2F0SW5mb1dpbmRvd11cclxuXHJcbiAgICBpZihzb3VyY2U9PW51bGwpe1xyXG4gICAgICAgIGZvcih2YXIgaT0wO2k8Y29tcG9uZW50c0Fyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgdmFyIHRoZUNvbXBvbmVudD1jb21wb25lbnRzQXJyW2ldXHJcbiAgICAgICAgICAgIHRoaXMuYXNzaWduQnJvYWRjYXN0TWVzc2FnZSh0aGVDb21wb25lbnQpXHJcbiAgICAgICAgfVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgZm9yKHZhciBpPTA7aTxjb21wb25lbnRzQXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICB2YXIgdGhlQ29tcG9uZW50PWNvbXBvbmVudHNBcnJbaV1cclxuICAgICAgICAgICAgaWYodGhlQ29tcG9uZW50LnJ4TWVzc2FnZSAmJiB0aGVDb21wb25lbnQhPXNvdXJjZSkgdGhlQ29tcG9uZW50LnJ4TWVzc2FnZShtc2dQYXlsb2FkKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxubWFpblVJLnByb3RvdHlwZS5pbml0VUlMYXlvdXQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgbXlMYXlvdXQgPSAkKCdib2R5JykubGF5b3V0KHtcclxuICAgICAgICAvL1x0cmVmZXJlbmNlIG9ubHkgLSB0aGVzZSBvcHRpb25zIGFyZSBOT1QgcmVxdWlyZWQgYmVjYXVzZSAndHJ1ZScgaXMgdGhlIGRlZmF1bHRcclxuICAgICAgICBjbG9zYWJsZTogdHJ1ZVx0Ly8gcGFuZSBjYW4gb3BlbiAmIGNsb3NlXHJcbiAgICAgICAgLCByZXNpemFibGU6IHRydWVcdC8vIHdoZW4gb3BlbiwgcGFuZSBjYW4gYmUgcmVzaXplZCBcclxuICAgICAgICAsIHNsaWRhYmxlOiB0cnVlXHQvLyB3aGVuIGNsb3NlZCwgcGFuZSBjYW4gJ3NsaWRlJyBvcGVuIG92ZXIgb3RoZXIgcGFuZXMgLSBjbG9zZXMgb24gbW91c2Utb3V0XHJcbiAgICAgICAgLCBsaXZlUGFuZVJlc2l6aW5nOiB0cnVlXHJcblxyXG4gICAgICAgIC8vXHRzb21lIHJlc2l6aW5nL3RvZ2dsaW5nIHNldHRpbmdzXHJcbiAgICAgICAgLCBub3J0aF9fc2xpZGFibGU6IGZhbHNlXHQvLyBPVkVSUklERSB0aGUgcGFuZS1kZWZhdWx0IG9mICdzbGlkYWJsZT10cnVlJ1xyXG4gICAgICAgIC8vLCBub3J0aF9fdG9nZ2xlckxlbmd0aF9jbG9zZWQ6ICcxMDAlJ1x0Ly8gdG9nZ2xlLWJ1dHRvbiBpcyBmdWxsLXdpZHRoIG9mIHJlc2l6ZXItYmFyXHJcbiAgICAgICAgLCBub3J0aF9fc3BhY2luZ19jbG9zZWQ6IDZcdFx0Ly8gYmlnIHJlc2l6ZXItYmFyIHdoZW4gb3BlbiAoemVybyBoZWlnaHQpXHJcbiAgICAgICAgLCBub3J0aF9fc3BhY2luZ19vcGVuOjBcclxuICAgICAgICAsIG5vcnRoX19yZXNpemFibGU6IGZhbHNlXHQvLyBPVkVSUklERSB0aGUgcGFuZS1kZWZhdWx0IG9mICdyZXNpemFibGU9dHJ1ZSdcclxuICAgICAgICAsIG5vcnRoX19jbG9zYWJsZTogZmFsc2VcclxuICAgICAgICAsIHdlc3RfX2Nsb3NhYmxlOiBmYWxzZVxyXG4gICAgICAgICwgZWFzdF9fY2xvc2FibGU6IGZhbHNlXHJcbiAgICAgICAgXHJcblxyXG4gICAgICAgIC8vXHRzb21lIHBhbmUtc2l6ZSBzZXR0aW5nc1xyXG4gICAgICAgICwgd2VzdF9fbWluU2l6ZTogMTAwXHJcbiAgICAgICAgLCBlYXN0X19zaXplOiAzMDBcclxuICAgICAgICAsIGVhc3RfX21pblNpemU6IDIwMFxyXG4gICAgICAgICwgZWFzdF9fbWF4U2l6ZTogMC41IC8vIDUwJSBvZiBsYXlvdXQgd2lkdGhcclxuICAgICAgICAsIGNlbnRlcl9fbWluV2lkdGg6IDEwMFxyXG4gICAgICAgICxlYXN0X19pbml0Q2xvc2VkOlx0dHJ1ZVxyXG4gICAgfSk7XHJcblxyXG5cclxuICAgIC8qXHJcbiAgICAgKlx0RElTQUJMRSBURVhULVNFTEVDVElPTiBXSEVOIERSQUdHSU5HIChvciBldmVuIF90cnlpbmdfIHRvIGRyYWchKVxyXG4gICAgICpcdHRoaXMgZnVuY3Rpb25hbGl0eSB3aWxsIGJlIGluY2x1ZGVkIGluIFJDMzAuODBcclxuICAgICAqL1xyXG4gICAgJC5sYXlvdXQuZGlzYWJsZVRleHRTZWxlY3Rpb24gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICRkID0gJChkb2N1bWVudClcclxuICAgICAgICAgICAgLCBzID0gJ3RleHRTZWxlY3Rpb25EaXNhYmxlZCdcclxuICAgICAgICAgICAgLCB4ID0gJ3RleHRTZWxlY3Rpb25Jbml0aWFsaXplZCdcclxuICAgICAgICAgICAgO1xyXG4gICAgICAgIGlmICgkLmZuLmRpc2FibGVTZWxlY3Rpb24pIHtcclxuICAgICAgICAgICAgaWYgKCEkZC5kYXRhKHgpKSAvLyBkb2N1bWVudCBoYXNuJ3QgYmVlbiBpbml0aWFsaXplZCB5ZXRcclxuICAgICAgICAgICAgICAgICRkLm9uKCdtb3VzZXVwJywgJC5sYXlvdXQuZW5hYmxlVGV4dFNlbGVjdGlvbikuZGF0YSh4LCB0cnVlKTtcclxuICAgICAgICAgICAgaWYgKCEkZC5kYXRhKHMpKVxyXG4gICAgICAgICAgICAgICAgJGQuZGlzYWJsZVNlbGVjdGlvbigpLmRhdGEocywgdHJ1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vY29uc29sZS5sb2coJyQubGF5b3V0LmRpc2FibGVUZXh0U2VsZWN0aW9uJyk7XHJcbiAgICB9O1xyXG4gICAgJC5sYXlvdXQuZW5hYmxlVGV4dFNlbGVjdGlvbiA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICB2YXIgJGQgPSAkKGRvY3VtZW50KVxyXG4gICAgICAgICAgICAsIHMgPSAndGV4dFNlbGVjdGlvbkRpc2FibGVkJztcclxuICAgICAgICBpZiAoJC5mbi5lbmFibGVTZWxlY3Rpb24gJiYgJGQuZGF0YShzKSlcclxuICAgICAgICAgICAgJGQuZW5hYmxlU2VsZWN0aW9uKCkuZGF0YShzLCBmYWxzZSk7XHJcbiAgICAgICAgLy9jb25zb2xlLmxvZygnJC5sYXlvdXQuZW5hYmxlVGV4dFNlbGVjdGlvbicpO1xyXG4gICAgfTtcclxuICAgICQoXCIudWktbGF5b3V0LXJlc2l6ZXItbm9ydGhcIikuaGlkZSgpXHJcbiAgICAkKFwiLnVpLWxheW91dC13ZXN0XCIpLmNzcyhcImJvcmRlci1yaWdodFwiLFwic29saWQgMXB4IGxpZ2h0R3JheVwiKVxyXG4gICAgJChcIi51aS1sYXlvdXQtd2VzdFwiKS5hZGRDbGFzcyhcInczLWNhcmRcIilcclxuXHJcbn1cclxuXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBtYWluVUkoKTsiLCIvL1RoaXMgaXMgYSBzaW5nbGV0b24gY2xhc3NcclxuXHJcbmZ1bmN0aW9uIG1vZGVsQW5hbHl6ZXIoKXtcclxuICAgIHRoaXMuRFRETE1vZGVscz17fVxyXG4gICAgdGhpcy5yZWxhdGlvbnNoaXBUeXBlcz17fVxyXG59XHJcblxyXG5tb2RlbEFuYWx5emVyLnByb3RvdHlwZS5jbGVhckFsbE1vZGVscz1mdW5jdGlvbigpe1xyXG4gICAgY29uc29sZS5sb2coXCJjbGVhciBhbGwgbW9kZWwgaW5mb1wiKVxyXG4gICAgZm9yKHZhciBpZCBpbiB0aGlzLkRURExNb2RlbHMpIGRlbGV0ZSB0aGlzLkRURExNb2RlbHNbaWRdXHJcbn1cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLnJlc2V0QWxsTW9kZWxzPWZ1bmN0aW9uKGFycil7XHJcbiAgICBmb3IodmFyIG1vZGVsSUQgaW4gdGhpcy5EVERMTW9kZWxzKXtcclxuICAgICAgICB2YXIganNvblN0cj10aGlzLkRURExNb2RlbHNbbW9kZWxJRF1bXCJvcmlnaW5hbFwiXVxyXG4gICAgICAgIHRoaXMuRFRETE1vZGVsc1ttb2RlbElEXT1KU09OLnBhcnNlKGpzb25TdHIpXHJcbiAgICAgICAgdGhpcy5EVERMTW9kZWxzW21vZGVsSURdW1wib3JpZ2luYWxcIl09anNvblN0clxyXG4gICAgfVxyXG59XHJcblxyXG5cclxubW9kZWxBbmFseXplci5wcm90b3R5cGUuYWRkTW9kZWxzPWZ1bmN0aW9uKGFycil7XHJcbiAgICBhcnIuZm9yRWFjaCgoZWxlKT0+e1xyXG4gICAgICAgIHZhciBtb2RlbElEPSBlbGVbXCJAaWRcIl1cclxuICAgICAgICBlbGVbXCJvcmlnaW5hbFwiXT1KU09OLnN0cmluZ2lmeShlbGUpXHJcbiAgICAgICAgdGhpcy5EVERMTW9kZWxzW21vZGVsSURdPWVsZVxyXG4gICAgfSlcclxufVxyXG5cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLnJlY29yZEFsbEJhc2VDbGFzc2VzPSBmdW5jdGlvbiAocGFyZW50T2JqLCBiYXNlQ2xhc3NJRCkge1xyXG4gICAgdmFyIGJhc2VDbGFzcyA9IHRoaXMuRFRETE1vZGVsc1tiYXNlQ2xhc3NJRF1cclxuICAgIGlmIChiYXNlQ2xhc3MgPT0gbnVsbCkgcmV0dXJuO1xyXG5cclxuICAgIHBhcmVudE9ialtiYXNlQ2xhc3NJRF09MVxyXG5cclxuICAgIHZhciBmdXJ0aGVyQmFzZUNsYXNzSURzID0gYmFzZUNsYXNzLmV4dGVuZHM7XHJcbiAgICBpZiAoZnVydGhlckJhc2VDbGFzc0lEcyA9PSBudWxsKSByZXR1cm47XHJcbiAgICBpZihBcnJheS5pc0FycmF5KGZ1cnRoZXJCYXNlQ2xhc3NJRHMpKSB2YXIgdG1wQXJyPWZ1cnRoZXJCYXNlQ2xhc3NJRHNcclxuICAgIGVsc2UgdG1wQXJyPVtmdXJ0aGVyQmFzZUNsYXNzSURzXVxyXG4gICAgdG1wQXJyLmZvckVhY2goKGVhY2hCYXNlKSA9PiB7IHRoaXMucmVjb3JkQWxsQmFzZUNsYXNzZXMocGFyZW50T2JqLCBlYWNoQmFzZSkgfSlcclxufVxyXG5cclxubW9kZWxBbmFseXplci5wcm90b3R5cGUuZXhwYW5kRWRpdGFibGVQcm9wZXJ0aWVzRnJvbUJhc2VDbGFzcyA9IGZ1bmN0aW9uIChwYXJlbnRPYmosIGJhc2VDbGFzc0lEKSB7XHJcbiAgICB2YXIgYmFzZUNsYXNzID0gdGhpcy5EVERMTW9kZWxzW2Jhc2VDbGFzc0lEXVxyXG4gICAgaWYgKGJhc2VDbGFzcyA9PSBudWxsKSByZXR1cm47XHJcbiAgICBpZiAoYmFzZUNsYXNzLmVkaXRhYmxlUHJvcGVydGllcykge1xyXG4gICAgICAgIGZvciAodmFyIGluZCBpbiBiYXNlQ2xhc3MuZWRpdGFibGVQcm9wZXJ0aWVzKSBwYXJlbnRPYmpbaW5kXSA9IGJhc2VDbGFzcy5lZGl0YWJsZVByb3BlcnRpZXNbaW5kXVxyXG4gICAgfVxyXG4gICAgdmFyIGZ1cnRoZXJCYXNlQ2xhc3NJRHMgPSBiYXNlQ2xhc3MuZXh0ZW5kcztcclxuICAgIGlmIChmdXJ0aGVyQmFzZUNsYXNzSURzID09IG51bGwpIHJldHVybjtcclxuICAgIGlmKEFycmF5LmlzQXJyYXkoZnVydGhlckJhc2VDbGFzc0lEcykpIHZhciB0bXBBcnI9ZnVydGhlckJhc2VDbGFzc0lEc1xyXG4gICAgZWxzZSB0bXBBcnI9W2Z1cnRoZXJCYXNlQ2xhc3NJRHNdXHJcbiAgICB0bXBBcnIuZm9yRWFjaCgoZWFjaEJhc2UpID0+IHsgdGhpcy5leHBhbmRFZGl0YWJsZVByb3BlcnRpZXNGcm9tQmFzZUNsYXNzKHBhcmVudE9iaiwgZWFjaEJhc2UpIH0pXHJcbn1cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLmV4cGFuZFZhbGlkUmVsYXRpb25zaGlwVHlwZXNGcm9tQmFzZUNsYXNzID0gZnVuY3Rpb24gKHBhcmVudE9iaiwgYmFzZUNsYXNzSUQpIHtcclxuICAgIHZhciBiYXNlQ2xhc3MgPSB0aGlzLkRURExNb2RlbHNbYmFzZUNsYXNzSURdXHJcbiAgICBpZiAoYmFzZUNsYXNzID09IG51bGwpIHJldHVybjtcclxuICAgIGlmIChiYXNlQ2xhc3MudmFsaWRSZWxhdGlvbnNoaXBzKSB7XHJcbiAgICAgICAgZm9yICh2YXIgaW5kIGluIGJhc2VDbGFzcy52YWxpZFJlbGF0aW9uc2hpcHMpIHtcclxuICAgICAgICAgICAgaWYocGFyZW50T2JqW2luZF09PW51bGwpIHBhcmVudE9ialtpbmRdID0gdGhpcy5yZWxhdGlvbnNoaXBUeXBlc1tpbmRdW2Jhc2VDbGFzc0lEXVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHZhciBmdXJ0aGVyQmFzZUNsYXNzSURzID0gYmFzZUNsYXNzLmV4dGVuZHM7XHJcbiAgICBpZiAoZnVydGhlckJhc2VDbGFzc0lEcyA9PSBudWxsKSByZXR1cm47XHJcbiAgICBpZihBcnJheS5pc0FycmF5KGZ1cnRoZXJCYXNlQ2xhc3NJRHMpKSB2YXIgdG1wQXJyPWZ1cnRoZXJCYXNlQ2xhc3NJRHNcclxuICAgIGVsc2UgdG1wQXJyPVtmdXJ0aGVyQmFzZUNsYXNzSURzXVxyXG4gICAgdG1wQXJyLmZvckVhY2goKGVhY2hCYXNlKSA9PiB7IHRoaXMuZXhwYW5kVmFsaWRSZWxhdGlvbnNoaXBUeXBlc0Zyb21CYXNlQ2xhc3MocGFyZW50T2JqLCBlYWNoQmFzZSkgfSlcclxufVxyXG5cclxubW9kZWxBbmFseXplci5wcm90b3R5cGUuZXhwYW5kRWRpdGFibGVQcm9wZXJ0aWVzPWZ1bmN0aW9uKHBhcmVudE9iaixkYXRhSW5mbyxlbWJlZGRlZFNjaGVtYSl7XHJcbiAgICBkYXRhSW5mby5mb3JFYWNoKChvbmVDb250ZW50KT0+e1xyXG4gICAgICAgIGlmKG9uZUNvbnRlbnRbXCJAdHlwZVwiXT09XCJSZWxhdGlvbnNoaXBcIikgcmV0dXJuO1xyXG4gICAgICAgIGlmKG9uZUNvbnRlbnRbXCJAdHlwZVwiXT09XCJQcm9wZXJ0eVwiXHJcbiAgICAgICAgfHwoQXJyYXkuaXNBcnJheShvbmVDb250ZW50W1wiQHR5cGVcIl0pICYmIG9uZUNvbnRlbnRbXCJAdHlwZVwiXS5pbmNsdWRlcyhcIlByb3BlcnR5XCIpKVxyXG4gICAgICAgIHx8IG9uZUNvbnRlbnRbXCJAdHlwZVwiXT09bnVsbCkge1xyXG4gICAgICAgICAgICBpZih0eXBlb2Yob25lQ29udGVudFtcInNjaGVtYVwiXSkgIT0gJ29iamVjdCcgJiYgZW1iZWRkZWRTY2hlbWFbb25lQ29udGVudFtcInNjaGVtYVwiXV0hPW51bGwpIG9uZUNvbnRlbnRbXCJzY2hlbWFcIl09ZW1iZWRkZWRTY2hlbWFbb25lQ29udGVudFtcInNjaGVtYVwiXV1cclxuXHJcbiAgICAgICAgICAgIGlmKHR5cGVvZihvbmVDb250ZW50W1wic2NoZW1hXCJdKSA9PT0gJ29iamVjdCcgJiYgb25lQ29udGVudFtcInNjaGVtYVwiXVtcIkB0eXBlXCJdPT1cIk9iamVjdFwiKXtcclxuICAgICAgICAgICAgICAgIHZhciBuZXdQYXJlbnQ9e31cclxuICAgICAgICAgICAgICAgIHBhcmVudE9ialtvbmVDb250ZW50W1wibmFtZVwiXV09bmV3UGFyZW50XHJcbiAgICAgICAgICAgICAgICB0aGlzLmV4cGFuZEVkaXRhYmxlUHJvcGVydGllcyhuZXdQYXJlbnQsb25lQ29udGVudFtcInNjaGVtYVwiXVtcImZpZWxkc1wiXSxlbWJlZGRlZFNjaGVtYSlcclxuICAgICAgICAgICAgfWVsc2UgaWYodHlwZW9mKG9uZUNvbnRlbnRbXCJzY2hlbWFcIl0pID09PSAnb2JqZWN0JyAmJiBvbmVDb250ZW50W1wic2NoZW1hXCJdW1wiQHR5cGVcIl09PVwiRW51bVwiKXtcclxuICAgICAgICAgICAgICAgIHBhcmVudE9ialtvbmVDb250ZW50W1wibmFtZVwiXV09b25lQ29udGVudFtcInNjaGVtYVwiXVtcImVudW1WYWx1ZXNcIl1cclxuICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnRPYmpbb25lQ29udGVudFtcIm5hbWVcIl1dPW9uZUNvbnRlbnRbXCJzY2hlbWFcIl1cclxuICAgICAgICAgICAgfSAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufVxyXG5cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLmFuYWx5emU9ZnVuY3Rpb24oKXtcclxuICAgIGNvbnNvbGUubG9nKFwiYW5hbHl6ZSBtb2RlbCBpbmZvXCIpXHJcbiAgICAvL2FuYWx5emUgYWxsIHJlbGF0aW9uc2hpcCB0eXBlc1xyXG4gICAgZm9yICh2YXIgaWQgaW4gdGhpcy5yZWxhdGlvbnNoaXBUeXBlcykgZGVsZXRlIHRoaXMucmVsYXRpb25zaGlwVHlwZXNbaWRdXHJcbiAgICBmb3IgKHZhciBtb2RlbElEIGluIHRoaXMuRFRETE1vZGVscykge1xyXG4gICAgICAgIHZhciBlbGUgPSB0aGlzLkRURExNb2RlbHNbbW9kZWxJRF1cclxuICAgICAgICB2YXIgZW1iZWRkZWRTY2hlbWEgPSB7fVxyXG4gICAgICAgIGlmIChlbGUuc2NoZW1hcykge1xyXG4gICAgICAgICAgICB2YXIgdGVtcEFycjtcclxuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoZWxlLnNjaGVtYXMpKSB0ZW1wQXJyID0gZWxlLnNjaGVtYXNcclxuICAgICAgICAgICAgZWxzZSB0ZW1wQXJyID0gW2VsZS5zY2hlbWFzXVxyXG4gICAgICAgICAgICB0ZW1wQXJyLmZvckVhY2goKGVsZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgZW1iZWRkZWRTY2hlbWFbZWxlW1wiQGlkXCJdXSA9IGVsZVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdmFyIGNvbnRlbnRBcnIgPSBlbGUuY29udGVudHNcclxuICAgICAgICBpZiAoIWNvbnRlbnRBcnIpIGNvbnRpbnVlO1xyXG4gICAgICAgIGNvbnRlbnRBcnIuZm9yRWFjaCgob25lQ29udGVudCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAob25lQ29udGVudFtcIkB0eXBlXCJdID09IFwiUmVsYXRpb25zaGlwXCIpIHtcclxuICAgICAgICAgICAgICAgIGlmKCF0aGlzLnJlbGF0aW9uc2hpcFR5cGVzW29uZUNvbnRlbnRbXCJuYW1lXCJdXSkgdGhpcy5yZWxhdGlvbnNoaXBUeXBlc1tvbmVDb250ZW50W1wibmFtZVwiXV09IHt9XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlbGF0aW9uc2hpcFR5cGVzW29uZUNvbnRlbnRbXCJuYW1lXCJdXVttb2RlbElEXSA9IG9uZUNvbnRlbnRcclxuICAgICAgICAgICAgICAgIG9uZUNvbnRlbnQuZWRpdGFibGVSZWxhdGlvbnNoaXBQcm9wZXJ0aWVzID0ge31cclxuICAgICAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KG9uZUNvbnRlbnQucHJvcGVydGllcykpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmV4cGFuZEVkaXRhYmxlUHJvcGVydGllcyhvbmVDb250ZW50LmVkaXRhYmxlUmVsYXRpb25zaGlwUHJvcGVydGllcywgb25lQ29udGVudC5wcm9wZXJ0aWVzLCBlbWJlZGRlZFNjaGVtYSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcblxyXG4gICAgLy9hbmFseXplIGVhY2ggbW9kZWwncyBwcm9wZXJ0eSB0aGF0IGNhbiBiZSBlZGl0ZWRcclxuICAgIGZvcih2YXIgbW9kZWxJRCBpbiB0aGlzLkRURExNb2RlbHMpeyAvL2V4cGFuZCBwb3NzaWJsZSBlbWJlZGRlZCBzY2hlbWEgdG8gZWRpdGFibGVQcm9wZXJ0aWVzLCBhbHNvIGV4dHJhY3QgcG9zc2libGUgcmVsYXRpb25zaGlwIHR5cGVzIGZvciB0aGlzIG1vZGVsXHJcbiAgICAgICAgdmFyIGVsZT10aGlzLkRURExNb2RlbHNbbW9kZWxJRF1cclxuICAgICAgICB2YXIgZW1iZWRkZWRTY2hlbWE9e31cclxuICAgICAgICBpZihlbGUuc2NoZW1hcyl7XHJcbiAgICAgICAgICAgIHZhciB0ZW1wQXJyO1xyXG4gICAgICAgICAgICBpZihBcnJheS5pc0FycmF5KGVsZS5zY2hlbWFzKSkgdGVtcEFycj1lbGUuc2NoZW1hc1xyXG4gICAgICAgICAgICBlbHNlIHRlbXBBcnI9W2VsZS5zY2hlbWFzXVxyXG4gICAgICAgICAgICB0ZW1wQXJyLmZvckVhY2goKGVsZSk9PntcclxuICAgICAgICAgICAgICAgIGVtYmVkZGVkU2NoZW1hW2VsZVtcIkBpZFwiXV09ZWxlXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsZS5lZGl0YWJsZVByb3BlcnRpZXM9e31cclxuICAgICAgICBlbGUudmFsaWRSZWxhdGlvbnNoaXBzPXt9XHJcbiAgICAgICAgZWxlLmluY2x1ZGVkQ29tcG9uZW50cz1bXVxyXG4gICAgICAgIGVsZS5hbGxCYXNlQ2xhc3Nlcz17fVxyXG4gICAgICAgIGlmKEFycmF5LmlzQXJyYXkoZWxlLmNvbnRlbnRzKSl7XHJcbiAgICAgICAgICAgIHRoaXMuZXhwYW5kRWRpdGFibGVQcm9wZXJ0aWVzKGVsZS5lZGl0YWJsZVByb3BlcnRpZXMsZWxlLmNvbnRlbnRzLGVtYmVkZGVkU2NoZW1hKVxyXG5cclxuICAgICAgICAgICAgZWxlLmNvbnRlbnRzLmZvckVhY2goKG9uZUNvbnRlbnQpPT57XHJcbiAgICAgICAgICAgICAgICBpZihvbmVDb250ZW50W1wiQHR5cGVcIl09PVwiUmVsYXRpb25zaGlwXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICBlbGUudmFsaWRSZWxhdGlvbnNoaXBzW29uZUNvbnRlbnRbXCJuYW1lXCJdXT10aGlzLnJlbGF0aW9uc2hpcFR5cGVzW29uZUNvbnRlbnRbXCJuYW1lXCJdXVttb2RlbElEXVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBmb3IodmFyIG1vZGVsSUQgaW4gdGhpcy5EVERMTW9kZWxzKXsvL2V4cGFuZCBjb21wb25lbnQgcHJvcGVydGllc1xyXG4gICAgICAgIHZhciBlbGU9dGhpcy5EVERMTW9kZWxzW21vZGVsSURdXHJcbiAgICAgICAgaWYoQXJyYXkuaXNBcnJheShlbGUuY29udGVudHMpKXtcclxuICAgICAgICAgICAgZWxlLmNvbnRlbnRzLmZvckVhY2gob25lQ29udGVudD0+e1xyXG4gICAgICAgICAgICAgICAgaWYob25lQ29udGVudFtcIkB0eXBlXCJdPT1cIkNvbXBvbmVudFwiKXtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgY29tcG9uZW50TmFtZT1vbmVDb250ZW50W1wibmFtZVwiXVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjb21wb25lbnRDbGFzcz1vbmVDb250ZW50W1wic2NoZW1hXCJdXHJcbiAgICAgICAgICAgICAgICAgICAgZWxlLmVkaXRhYmxlUHJvcGVydGllc1tjb21wb25lbnROYW1lXT17fVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZXhwYW5kRWRpdGFibGVQcm9wZXJ0aWVzRnJvbUJhc2VDbGFzcyhlbGUuZWRpdGFibGVQcm9wZXJ0aWVzW2NvbXBvbmVudE5hbWVdLGNvbXBvbmVudENsYXNzKVxyXG4gICAgICAgICAgICAgICAgICAgIGVsZS5pbmNsdWRlZENvbXBvbmVudHMucHVzaChjb21wb25lbnROYW1lKVxyXG4gICAgICAgICAgICAgICAgfSBcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZm9yKHZhciBtb2RlbElEIGluIHRoaXMuRFRETE1vZGVscyl7Ly9leHBhbmQgYmFzZSBjbGFzcyBwcm9wZXJ0aWVzIHRvIGVkaXRhYmxlUHJvcGVydGllcyBhbmQgdmFsaWQgcmVsYXRpb25zaGlwIHR5cGVzIHRvIHZhbGlkUmVsYXRpb25zaGlwc1xyXG4gICAgICAgIHZhciBlbGU9dGhpcy5EVERMTW9kZWxzW21vZGVsSURdXHJcbiAgICAgICAgdmFyIGJhc2VDbGFzc0lEcz1lbGUuZXh0ZW5kcztcclxuICAgICAgICBpZihiYXNlQ2xhc3NJRHM9PW51bGwpIGNvbnRpbnVlO1xyXG4gICAgICAgIGlmKEFycmF5LmlzQXJyYXkoYmFzZUNsYXNzSURzKSkgdmFyIHRtcEFycj1iYXNlQ2xhc3NJRHNcclxuICAgICAgICBlbHNlIHRtcEFycj1bYmFzZUNsYXNzSURzXVxyXG4gICAgICAgIHRtcEFyci5mb3JFYWNoKChlYWNoQmFzZSk9PntcclxuICAgICAgICAgICAgdGhpcy5yZWNvcmRBbGxCYXNlQ2xhc3NlcyhlbGUuYWxsQmFzZUNsYXNzZXMsZWFjaEJhc2UpXHJcbiAgICAgICAgICAgIHRoaXMuZXhwYW5kRWRpdGFibGVQcm9wZXJ0aWVzRnJvbUJhc2VDbGFzcyhlbGUuZWRpdGFibGVQcm9wZXJ0aWVzLGVhY2hCYXNlKVxyXG4gICAgICAgICAgICB0aGlzLmV4cGFuZFZhbGlkUmVsYXRpb25zaGlwVHlwZXNGcm9tQmFzZUNsYXNzKGVsZS52YWxpZFJlbGF0aW9uc2hpcHMsZWFjaEJhc2UpXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuXHJcbiAgICAvL2NvbnNvbGUubG9nKHRoaXMuRFRETE1vZGVscylcclxuICAgIC8vY29uc29sZS5sb2codGhpcy5yZWxhdGlvbnNoaXBUeXBlcylcclxufVxyXG5cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLmxpc3RNb2RlbHNGb3JEZWxldGVNb2RlbD1mdW5jdGlvbihtb2RlbElEKXtcclxuICAgIHZhciBjaGlsZE1vZGVsSURzPVtdXHJcbiAgICBmb3IodmFyIGFJRCBpbiB0aGlzLkRURExNb2RlbHMpe1xyXG4gICAgICAgIHZhciBhTW9kZWw9dGhpcy5EVERMTW9kZWxzW2FJRF1cclxuICAgICAgICBpZihhTW9kZWwuYWxsQmFzZUNsYXNzZXMgJiYgYU1vZGVsLmFsbEJhc2VDbGFzc2VzW21vZGVsSURdKSBjaGlsZE1vZGVsSURzLnB1c2goYU1vZGVsW1wiQGlkXCJdKVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGNoaWxkTW9kZWxJRHNcclxufVxyXG5cclxubW9kZWxBbmFseXplci5wcm90b3R5cGUuZGVsZXRlTW9kZWxfbm90QmFzZUNsYXNzT2ZBbnk9ZnVuY3Rpb24obW9kZWxJRCl7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICQucG9zdChcImVkaXRBRFQvZGVsZXRlTW9kZWxcIix7XCJtb2RlbFwiOm1vZGVsSUR9LCAoZGF0YSk9PiB7XHJcbiAgICAgICAgICAgIGlmKGRhdGE9PVwiXCIpey8vc3VjY2Vzc2Z1bFxyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpXHJcbiAgICAgICAgICAgIH1lbHNleyAvL2Vycm9yIGhhcHBlbnNcclxuICAgICAgICAgICAgICAgIHJlamVjdChkYXRhKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9KVxyXG59XHJcblxyXG5tb2RlbEFuYWx5emVyLnByb3RvdHlwZS5kZWxldGVNb2RlbD1hc3luYyBmdW5jdGlvbihtb2RlbElELGZ1bmNBZnRlckVhY2hTdWNjZXNzRGVsZXRlLGZ1bmNBZnRlckZhaWwsY29tcGxldGVGdW5jKXtcclxuICAgIHZhciByZWxhdGVkTW9kZWxJRHM9dGhpcy5saXN0TW9kZWxzRm9yRGVsZXRlTW9kZWwobW9kZWxJRClcclxuICAgIHZhciBtb2RlbExldmVsPVtdXHJcbiAgICByZWxhdGVkTW9kZWxJRHMuZm9yRWFjaChvbmVJRD0+e1xyXG4gICAgICAgIHZhciBjaGVja01vZGVsPXRoaXMuRFRETE1vZGVsc1tvbmVJRF1cclxuICAgICAgICBtb2RlbExldmVsLnB1c2goe1wibW9kZWxJRFwiOm9uZUlELFwibGV2ZWxcIjpPYmplY3Qua2V5cyhjaGVja01vZGVsLmFsbEJhc2VDbGFzc2VzKS5sZW5ndGh9KVxyXG4gICAgfSlcclxuICAgIG1vZGVsTGV2ZWwucHVzaCh7XCJtb2RlbElEXCI6bW9kZWxJRCxcImxldmVsXCI6MH0pXHJcbiAgICBtb2RlbExldmVsLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtyZXR1cm4gYltcImxldmVsXCJdLWFbXCJsZXZlbFwiXSB9KTtcclxuICAgIFxyXG4gICAgZm9yKHZhciBpPTA7aTxtb2RlbExldmVsLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBhTW9kZWxJRD1tb2RlbExldmVsW2ldLm1vZGVsSURcclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuZGVsZXRlTW9kZWxfbm90QmFzZUNsYXNzT2ZBbnkoYU1vZGVsSUQpXHJcbiAgICAgICAgICAgIHZhciBtb2RlbE5hbWU9dGhpcy5EVERMTW9kZWxzW2FNb2RlbElEXS5kaXNwbGF5TmFtZVxyXG4gICAgICAgICAgICBkZWxldGUgdGhpcy5EVERMTW9kZWxzW2FNb2RlbElEXVxyXG4gICAgICAgICAgICBpZihmdW5jQWZ0ZXJFYWNoU3VjY2Vzc0RlbGV0ZSkgZnVuY0FmdGVyRWFjaFN1Y2Nlc3NEZWxldGUoYU1vZGVsSUQsbW9kZWxOYW1lKVxyXG4gICAgICAgIH1jYXRjaChlKXtcclxuICAgICAgICAgICAgdmFyIGRlbGV0ZWRNb2RlbHM9W11cclxuICAgICAgICAgICAgdmFyIGFsZXJ0U3RyPVwiRGVsZXRlIG1vZGVsIGlzIGluY29tcGxldGUuIERlbGV0ZWQgTW9kZWw6XCJcclxuICAgICAgICAgICAgZm9yKHZhciBqPTA7ajxpO2orKyl7XHJcbiAgICAgICAgICAgICAgICBhbGVydFN0cis9IG1vZGVsTGV2ZWxbal0ubW9kZWxJRCtcIiBcIlxyXG4gICAgICAgICAgICAgICAgZGVsZXRlZE1vZGVscy5wdXNoKG1vZGVsTGV2ZWxbal0ubW9kZWxJRClcclxuICAgICAgICAgICAgfSBcclxuICAgICAgICAgICAgYWxlcnRTdHIrPVwiLiBGYWlsIHRvIGRlbGV0ZSBcIithTW9kZWxJRCtcIi4gRXJyb3IgaXMgXCIrZVxyXG4gICAgICAgICAgICBpZihmdW5jQWZ0ZXJGYWlsKSBmdW5jQWZ0ZXJGYWlsKGRlbGV0ZWRNb2RlbHMpXHJcbiAgICAgICAgICAgIGFsZXJ0KGUpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYoY29tcGxldGVGdW5jKSBjb21wbGV0ZUZ1bmMoKVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBtb2RlbEFuYWx5emVyKCk7IiwiY29uc3QgbW9kZWxBbmFseXplcj1yZXF1aXJlKFwiLi9tb2RlbEFuYWx5emVyXCIpXHJcbmNvbnN0IHNpbXBsZVNlbGVjdE1lbnU9IHJlcXVpcmUoXCIuL3NpbXBsZVNlbGVjdE1lbnVcIilcclxuY29uc3Qgc2ltcGxlQ29uZmlybURpYWxvZz1yZXF1aXJlKFwiLi9zaW1wbGVDb25maXJtRGlhbG9nXCIpXHJcbmNvbnN0IGdsb2JhbENhY2hlID0gcmVxdWlyZShcIi4vZ2xvYmFsQ2FjaGVcIilcclxuXHJcbmZ1bmN0aW9uIG1vZGVsRWRpdG9yRGlhbG9nKCkge1xyXG4gICAgaWYoIXRoaXMuRE9NKXtcclxuICAgICAgICB0aGlzLkRPTSA9ICQoJzxkaXYgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO2JhY2tncm91bmQtY29sb3I6d2hpdGU7bGVmdDo1MCU7dHJhbnNmb3JtOiB0cmFuc2xhdGVYKC01MCUpIHRyYW5zbGF0ZVkoLTUwJSk7ei1pbmRleDoxMDBcIiBjbGFzcz1cInczLWNhcmQtMlwiPjwvZGl2PicpXHJcbiAgICAgICAgJChcImJvZHlcIikuYXBwZW5kKHRoaXMuRE9NKVxyXG4gICAgICAgIHRoaXMuRE9NLmhpZGUoKVxyXG4gICAgICAgIGdsb2JhbENhY2hlLm1ha2VET01EcmFnZ2FibGUodGhpcy5ET00pXHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZGVsRWRpdG9yRGlhbG9nLnByb3RvdHlwZS5wb3B1cCA9IGFzeW5jIGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5ET00uc2hvdygpXHJcbiAgICB0aGlzLkRPTS5lbXB0eSgpXHJcbiAgICB0aGlzLmNvbnRlbnRET00gPSAkKCc8ZGl2IHN0eWxlPVwid2lkdGg6NjY1cHhcIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKHRoaXMuY29udGVudERPTSlcclxuICAgIHRoaXMuY29udGVudERPTS5hcHBlbmQoJCgnPGRpdiBzdHlsZT1cImhlaWdodDo0MHB4XCIgY2xhc3M9XCJ3My1iYXIgdzMtcmVkXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtXCIgc3R5bGU9XCJmb250LXNpemU6MS41ZW1cIj5EaWdpdGFsIFR3aW4gTW9kZWwgRWRpdG9yPC9kaXY+PC9kaXY+JykpXHJcbiAgICB2YXIgY2xvc2VCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJpZ2h0XCIgc3R5bGU9XCJmb250LXNpemU6MmVtO3BhZGRpbmctdG9wOjRweFwiPsOXPC9idXR0b24+JylcclxuICAgIHRoaXMuY29udGVudERPTS5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKGNsb3NlQnV0dG9uKVxyXG4gICAgY2xvc2VCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMuRE9NLmhpZGUoKSB9KVxyXG5cclxuICAgIHZhciBidXR0b25Sb3c9JCgnPGRpdiAgc3R5bGU9XCJoZWlnaHQ6NDBweFwiIGNsYXNzPVwidzMtYmFyXCI+PC9kaXY+JylcclxuICAgIHRoaXMuY29udGVudERPTS5hcHBlbmQoYnV0dG9uUm93KVxyXG4gICAgdmFyIGltcG9ydEJ1dHRvbiA9JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1jYXJkIHczLWRlZXAtb3JhbmdlIHczLWhvdmVyLWxpZ2h0LWdyZWVuIHczLXJpZ2h0XCIgc3R5bGU9XCJoZWlnaHQ6MTAwJVwiPkltcG9ydDwvYnV0dG9uPicpXHJcbiAgICB0aGlzLmltcG9ydEJ1dHRvbj1pbXBvcnRCdXR0b25cclxuICAgIGJ1dHRvblJvdy5hcHBlbmQoaW1wb3J0QnV0dG9uKVxyXG5cclxuICAgIGltcG9ydEJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgICB2YXIgY3VycmVudE1vZGVsSUQ9dGhpcy5kdGRsb2JqW1wiQGlkXCJdXHJcbiAgICAgICAgaWYobW9kZWxBbmFseXplci5EVERMTW9kZWxzW2N1cnJlbnRNb2RlbElEXT09bnVsbCkgdGhpcy5pbXBvcnRNb2RlbEFycihbdGhpcy5kdGRsb2JqXSlcclxuICAgICAgICBlbHNlIHRoaXMucmVwbGFjZU1vZGVsKClcclxuICAgIH0pXHJcblxyXG4gICAgdmFyIGxhYmxlPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1vcGFjaXR5XCIgc3R5bGU9XCJwYWRkaW5nLXJpZ2h0OjVweDtmb250LXNpemU6MS4yZW07XCI+TW9kZWwgVGVtcGxhdGU8L2Rpdj4nKVxyXG4gICAgYnV0dG9uUm93LmFwcGVuZChsYWJsZSlcclxuICAgIHZhciBtb2RlbFRlbXBsYXRlU2VsZWN0b3I9bmV3IHNpbXBsZVNlbGVjdE1lbnUoXCIgXCIse3dpdGhCb3JkZXI6MSxmb250U2l6ZTpcIjEuMmVtXCIsY29sb3JDbGFzczpcInczLWxpZ2h0LWdyYXlcIixidXR0b25DU1M6e1wicGFkZGluZ1wiOlwiNXB4IDEwcHhcIn0sXCJvcHRpb25MaXN0SGVpZ2h0XCI6MzAwfSlcclxuICAgIGJ1dHRvblJvdy5hcHBlbmQobW9kZWxUZW1wbGF0ZVNlbGVjdG9yLkRPTSlcclxuICAgIG1vZGVsVGVtcGxhdGVTZWxlY3Rvci5jYWxsQmFja19jbGlja09wdGlvbj0ob3B0aW9uVGV4dCxvcHRpb25WYWx1ZSk9PntcclxuICAgICAgICBtb2RlbFRlbXBsYXRlU2VsZWN0b3IuY2hhbmdlTmFtZShvcHRpb25UZXh0KVxyXG4gICAgICAgIHRoaXMuY2hvb3NlVGVtcGxhdGUob3B0aW9uVmFsdWUpXHJcbiAgICB9XHJcbiAgICBtb2RlbFRlbXBsYXRlU2VsZWN0b3IuYWRkT3B0aW9uKFwiTmV3IE1vZGVsLi4uXCIsXCJOZXdcIilcclxuICAgIGZvcih2YXIgbW9kZWxOYW1lIGluIG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVscyl7XHJcbiAgICAgICAgbW9kZWxUZW1wbGF0ZVNlbGVjdG9yLmFkZE9wdGlvbihtb2RlbE5hbWUpXHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHBhbmVsSGVpZ2h0PVwiNDUwcHhcIlxyXG4gICAgdmFyIHJvdzI9JCgnPGRpdiBjbGFzcz1cInczLWNlbGwtcm93XCIgc3R5bGU9XCJtYXJnaW46MnB4XCI+PC9kaXY+JylcclxuICAgIHRoaXMuY29udGVudERPTS5hcHBlbmQocm93MilcclxuICAgIHZhciBsZWZ0U3Bhbj0kKCc8ZGl2IGNsYXNzPVwidzMtY2FyZFwiIHN0eWxlPVwicGFkZGluZzo1cHg7d2lkdGg6MzMwcHg7cGFkZGluZy1yaWdodDo1cHg7aGVpZ2h0OicrcGFuZWxIZWlnaHQrJztvdmVyZmxvdzphdXRvXCI+PC9kaXY+JylcclxuICAgIHJvdzIuYXBwZW5kKGxlZnRTcGFuKVxyXG4gICAgdGhpcy5sZWZ0U3Bhbj1sZWZ0U3BhblxyXG5cclxuICAgIHZhciByaWdodFNwYW49JCgnPGRpdiBjbGFzcz1cInczLWNvbnRhaW5lciB3My1jZWxsXCI+PC9kaXY+JylcclxuICAgIHJvdzIuYXBwZW5kKHJpZ2h0U3BhbikgXHJcbiAgICB2YXIgZHRkbFNjcmlwdFBhbmVsPSQoJzxkaXYgY2xhc3M9XCJ3My1jYXJkLTIgdzMtd2hpdGVcIiBzdHlsZT1cIm92ZXJmbG93OmF1dG87bWFyZ2luLXRvcDoycHg7d2lkdGg6MzEwcHg7aGVpZ2h0OicrcGFuZWxIZWlnaHQrJ1wiPjwvZGl2PicpXHJcbiAgICByaWdodFNwYW4uYXBwZW5kKGR0ZGxTY3JpcHRQYW5lbClcclxuICAgIHRoaXMuZHRkbFNjcmlwdFBhbmVsPWR0ZGxTY3JpcHRQYW5lbFxyXG5cclxuICAgIG1vZGVsVGVtcGxhdGVTZWxlY3Rvci50cmlnZ2VyT3B0aW9uSW5kZXgoMClcclxufVxyXG5cclxubW9kZWxFZGl0b3JEaWFsb2cucHJvdG90eXBlLnJlcGxhY2VNb2RlbD1mdW5jdGlvbigpe1xyXG4gICAgLy9kZWxldGUgdGhlIG9sZCBzYW1lIG5hbWUgbW9kZWwsIHRoZW4gY3JlYXRlIGl0IGFnYWluXHJcbiAgICB2YXIgY3VycmVudE1vZGVsSUQ9dGhpcy5kdGRsb2JqW1wiQGlkXCJdXHJcblxyXG4gICAgdmFyIHJlbGF0ZWRNb2RlbElEcz1tb2RlbEFuYWx5emVyLmxpc3RNb2RlbHNGb3JEZWxldGVNb2RlbChjdXJyZW50TW9kZWxJRClcclxuXHJcbiAgICB2YXIgZGlhbG9nU3RyID0gKHJlbGF0ZWRNb2RlbElEcy5sZW5ndGggPT0gMCkgPyAoXCJUd2lucyB3aWxsIGJlIGltcGFjdCB1bmRlciBtb2RlbCBcXFwiXCIgKyBjdXJyZW50TW9kZWxJRCArIFwiXFxcIlwiKSA6XHJcbiAgICAgICAgKGN1cnJlbnRNb2RlbElEICsgXCIgaXMgYmFzZSBtb2RlbCBvZiBcIiArIHJlbGF0ZWRNb2RlbElEcy5qb2luKFwiLCBcIikgKyBcIi4gVHdpbnMgdW5kZXIgdGhlc2UgbW9kZWxzIHdpbGwgYmUgaW1wYWN0LlwiKVxyXG4gICAgdmFyIGNvbmZpcm1EaWFsb2dEaXYgPSBuZXcgc2ltcGxlQ29uZmlybURpYWxvZygpXHJcbiAgICBjb25maXJtRGlhbG9nRGl2LnNob3coXHJcbiAgICAgICAgeyB3aWR0aDogXCIzNTBweFwiIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB0aXRsZTogXCJXYXJuaW5nXCJcclxuICAgICAgICAgICAgLCBjb250ZW50OiBkaWFsb2dTdHJcclxuICAgICAgICAgICAgLCBidXR0b25zOiBbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1yZWQgdzMtaG92ZXItcGlua1wiLCB0ZXh0OiBcIkNvbmZpcm1cIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29uZmlybVJlcGxhY2VNb2RlbChjdXJyZW50TW9kZWxJRClcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtZ3JheVwiLCB0ZXh0OiBcIkNhbmNlbFwiLCBcImNsaWNrRnVuY1wiOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH1cclxuICAgICkgICAgXHJcbn1cclxuXHJcbm1vZGVsRWRpdG9yRGlhbG9nLnByb3RvdHlwZS5pbXBvcnRNb2RlbEFycj1mdW5jdGlvbihtb2RlbFRvQmVJbXBvcnRlZCxmb3JSZXBsYWNpbmcsYWZ0ZXJGYWlsdXJlKXtcclxuICAgICQucG9zdChcImVkaXRBRFQvaW1wb3J0TW9kZWxzXCIsIHsgXCJtb2RlbHNcIjogSlNPTi5zdHJpbmdpZnkobW9kZWxUb0JlSW1wb3J0ZWQpIH0sIChkYXRhKSA9PiB7XHJcbiAgICAgICAgaWYgKGRhdGEgPT0gXCJcIikgey8vc3VjY2Vzc2Z1bFxyXG4gICAgICAgICAgICBpZihmb3JSZXBsYWNpbmcpIGFsZXJ0KFwiTW9kZWwgXCIgKyB0aGlzLmR0ZGxvYmpbXCJkaXNwbGF5TmFtZVwiXSArIFwiIGlzIG1vZGlmaWVkIHN1Y2Nlc3NmdWxseSFcIilcclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBhbGVydChcIk1vZGVsIFwiICsgdGhpcy5kdGRsb2JqW1wiZGlzcGxheU5hbWVcIl0gKyBcIiBpcyBjcmVhdGVkIVwiKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcIkFEVE1vZGVsRWRpdGVkXCIgfSlcclxuICAgICAgICAgICAgbW9kZWxBbmFseXplci5hZGRNb2RlbHMobW9kZWxUb0JlSW1wb3J0ZWQpLy9hZGQgc28gaW1tZWRpYXRsZXkgdGhlIGxpc3QgY2FuIHNob3cgdGhlIG5ldyBtb2RlbHNcclxuICAgICAgICAgICAgdGhpcy5wb3B1cCgpIC8vcmVmcmVzaCBjb250ZW50XHJcbiAgICAgICAgfSBlbHNlIHsgLy9lcnJvciBoYXBwZW5zXHJcbiAgICAgICAgICAgIGlmKGFmdGVyRmFpbHVyZSkgYWZ0ZXJGYWlsdXJlKClcclxuICAgICAgICAgICAgYWxlcnQoZGF0YSlcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5cclxubW9kZWxFZGl0b3JEaWFsb2cucHJvdG90eXBlLmNvbmZpcm1SZXBsYWNlTW9kZWw9ZnVuY3Rpb24obW9kZWxJRCl7XHJcbiAgICB2YXIgcmVsYXRlZE1vZGVsSURzPW1vZGVsQW5hbHl6ZXIubGlzdE1vZGVsc0ZvckRlbGV0ZU1vZGVsKG1vZGVsSUQpXHJcbiAgICB2YXIgYmFja3VwTW9kZWxzPVtdXHJcbiAgICByZWxhdGVkTW9kZWxJRHMuZm9yRWFjaChvbmVJRD0+e1xyXG4gICAgICAgIGJhY2t1cE1vZGVscy5wdXNoKEpTT04ucGFyc2UobW9kZWxBbmFseXplci5EVERMTW9kZWxzW29uZUlEXVtcIm9yaWdpbmFsXCJdKSlcclxuICAgIH0pXHJcbiAgICBiYWNrdXBNb2RlbHMucHVzaCh0aGlzLmR0ZGxvYmopXHJcbiAgICB2YXIgYmFja3VwTW9kZWxzU3RyPWVuY29kZVVSSUNvbXBvbmVudChKU09OLnN0cmluZ2lmeShiYWNrdXBNb2RlbHMpKVxyXG5cclxuICAgIHZhciBmdW5jQWZ0ZXJGYWlsPShkZWxldGVkTW9kZWxJRHMpPT57XHJcbiAgICAgICAgdmFyIHBvbSA9ICQoXCI8YT48L2E+XCIpXHJcbiAgICAgICAgcG9tLmF0dHIoJ2hyZWYnLCAnZGF0YTp0ZXh0L3BsYWluO2NoYXJzZXQ9dXRmLTgsJyArIGJhY2t1cE1vZGVsc1N0cik7XHJcbiAgICAgICAgcG9tLmF0dHIoJ2Rvd25sb2FkJywgXCJleHBvcnRNb2RlbHNBZnRlckZhaWxlZE9wZXJhdGlvbi5qc29uXCIpO1xyXG4gICAgICAgIHBvbVswXS5jbGljaygpXHJcbiAgICB9XHJcbiAgICB2YXIgZnVuY0FmdGVyRWFjaFN1Y2Nlc3NEZWxldGUgPSAoZWFjaERlbGV0ZWRNb2RlbElELGVhY2hNb2RlbE5hbWUpID0+IHt9XHJcbiAgICBcclxuICAgIHZhciBjb21wbGV0ZUZ1bmM9KCk9PnsgXHJcbiAgICAgICAgLy9pbXBvcnQgYWxsIHRoZSBtb2RlbHMgYWdhaW5cclxuICAgICAgICB0aGlzLmltcG9ydE1vZGVsQXJyKGJhY2t1cE1vZGVscyxcImZvclJlcGxhY2luZ1wiLGZ1bmNBZnRlckZhaWwpXHJcbiAgICB9XHJcblxyXG4gICAgLy9ub3QgY29tcGxldGUgZGVsZXRlIHdpbGwgc3RpbGwgaW52b2tlIGNvbXBsZXRlRnVuY1xyXG4gICAgbW9kZWxBbmFseXplci5kZWxldGVNb2RlbChtb2RlbElELGZ1bmNBZnRlckVhY2hTdWNjZXNzRGVsZXRlLGZ1bmNBZnRlckZhaWwsY29tcGxldGVGdW5jKVxyXG59XHJcblxyXG5cclxubW9kZWxFZGl0b3JEaWFsb2cucHJvdG90eXBlLmNob29zZVRlbXBsYXRlPWZ1bmN0aW9uKHRlbXBhbHRlTmFtZSl7XHJcbiAgICBpZih0ZW1wYWx0ZU5hbWUhPVwiTmV3XCIpe1xyXG4gICAgICAgIHRoaXMuZHRkbG9iaj1KU09OLnBhcnNlKG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1t0ZW1wYWx0ZU5hbWVdW1wib3JpZ2luYWxcIl0pXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB0aGlzLmR0ZGxvYmogPSB7XHJcbiAgICAgICAgICAgIFwiQGlkXCI6IFwiZHRtaTphTmFtZVNwYWNlOmFNb2RlbElEOzFcIixcclxuICAgICAgICAgICAgXCJAY29udGV4dFwiOiBbXCJkdG1pOmR0ZGw6Y29udGV4dDsyXCJdLFxyXG4gICAgICAgICAgICBcIkB0eXBlXCI6IFwiSW50ZXJmYWNlXCIsXHJcbiAgICAgICAgICAgIFwiZGlzcGxheU5hbWVcIjogXCJOZXcgTW9kZWxcIixcclxuICAgICAgICAgICAgXCJjb250ZW50c1wiOiBbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJAdHlwZVwiOiBcIlByb3BlcnR5XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJuYW1lXCI6IFwiYXR0cmlidXRlMVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwic2NoZW1hXCI6IFwiZG91YmxlXCJcclxuICAgICAgICAgICAgICAgIH0se1xyXG4gICAgICAgICAgICAgICAgICAgIFwiQHR5cGVcIjogXCJSZWxhdGlvbnNoaXBcIixcclxuICAgICAgICAgICAgICAgICAgICBcIm5hbWVcIjogXCJsaW5rXCJcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMubGVmdFNwYW4uZW1wdHkoKVxyXG5cclxuICAgIHRoaXMucmVmcmVzaERUREwoKVxyXG4gICAgdGhpcy5sZWZ0U3Bhbi5hcHBlbmQoJCgnPGRpdiBjbGFzcz1cInczLWJhclwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbSB3My10b29sdGlwXCIgc3R5bGU9XCJmb250LXNpemU6MS4yZW07cGFkZGluZy1sZWZ0OjJweDtmb250LXdlaWdodDpib2xkO2NvbG9yOmdyYXlcIj5Nb2RlbCBJRCAmIE5hbWU8cCBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RleHQtYWxpZ246bGVmdDtmb250LXdlaWdodDpub3JtYWw7dG9wOi0xMHB4O3dpZHRoOjIwMHB4XCIgY2xhc3M9XCJ3My10ZXh0IHczLXRhZyB3My10aW55XCI+bW9kZWwgSUQgY29udGFpbnMgbmFtZXNwYWNlLCBhIG1vZGVsIHN0cmluZyBhbmQgYSB2ZXJzaW9uIG51bWJlcjwvcD48L2Rpdj48L2Rpdj4nKSlcclxuICAgIG5ldyBpZFJvdyh0aGlzLmR0ZGxvYmosdGhpcy5sZWZ0U3BhbiwoKT0+e3RoaXMucmVmcmVzaERUREwoKX0pXHJcbiAgICBuZXcgZGlzcGxheU5hbWVSb3codGhpcy5kdGRsb2JqLHRoaXMubGVmdFNwYW4sKCk9Pnt0aGlzLnJlZnJlc2hEVERMKCl9KVxyXG5cclxuICAgIGlmKCF0aGlzLmR0ZGxvYmpbXCJjb250ZW50c1wiXSl0aGlzLmR0ZGxvYmpbXCJjb250ZW50c1wiXT1bXVxyXG4gICAgbmV3IHBhcmFtZXRlcnNSb3codGhpcy5kdGRsb2JqW1wiY29udGVudHNcIl0sdGhpcy5sZWZ0U3BhbiwoKT0+e3RoaXMucmVmcmVzaERUREwoKX0sdGhpcy5ET00ub2Zmc2V0KCkpXHJcbiAgICBuZXcgcmVsYXRpb25zUm93KHRoaXMuZHRkbG9ialtcImNvbnRlbnRzXCJdLHRoaXMubGVmdFNwYW4sKCk9Pnt0aGlzLnJlZnJlc2hEVERMKCl9LHRoaXMuRE9NLm9mZnNldCgpKVxyXG4gICAgbmV3IGNvbXBvbmVudHNSb3codGhpcy5kdGRsb2JqW1wiY29udGVudHNcIl0sdGhpcy5sZWZ0U3BhbiwoKT0+e3RoaXMucmVmcmVzaERUREwoKX0pXHJcblxyXG4gICAgaWYoIXRoaXMuZHRkbG9ialtcImV4dGVuZHNcIl0pdGhpcy5kdGRsb2JqW1wiZXh0ZW5kc1wiXT1bXVxyXG4gICAgbmV3IGJhc2VDbGFzc2VzUm93KHRoaXMuZHRkbG9ialtcImV4dGVuZHNcIl0sdGhpcy5sZWZ0U3BhbiwoKT0+e3RoaXMucmVmcmVzaERUREwoKX0pXHJcbn1cclxuXHJcbm1vZGVsRWRpdG9yRGlhbG9nLnByb3RvdHlwZS5yZWZyZXNoRFRETD1mdW5jdGlvbigpe1xyXG4gICAgLy9pdCB3aWxsIHJlZnJlc2ggdGhlIGdlbmVyYXRlZCBEVERMIHNhbXBsZSwgaXQgd2lsbCBhbHNvIGNoYW5nZSB0aGUgaW1wb3J0IGJ1dHRvbiB0byBzaG93IFwiQ3JlYXRlXCIgb3IgXCJNb2RpZnlcIlxyXG4gICAgdmFyIGN1cnJlbnRNb2RlbElEPXRoaXMuZHRkbG9ialtcIkBpZFwiXVxyXG4gICAgaWYobW9kZWxBbmFseXplci5EVERMTW9kZWxzW2N1cnJlbnRNb2RlbElEXT09bnVsbCkgdGhpcy5pbXBvcnRCdXR0b24udGV4dChcIkNyZWF0ZVwiKVxyXG4gICAgZWxzZSB0aGlzLmltcG9ydEJ1dHRvbi50ZXh0KFwiTW9kaWZ5XCIpXHJcblxyXG5cclxuICAgIHRoaXMuZHRkbFNjcmlwdFBhbmVsLmVtcHR5KClcclxuICAgIHRoaXMuZHRkbFNjcmlwdFBhbmVsLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwiaGVpZ2h0OjIwcHg7d2lkdGg6MTAwcHhcIiBjbGFzcz1cInczLWJhciB3My1ncmF5XCI+R2VuZXJhdGVkIERUREw8L2Rpdj4nKSlcclxuICAgIHRoaXMuZHRkbFNjcmlwdFBhbmVsLmFwcGVuZCgkKCc8cHJlIHN0eWxlPVwiY29sb3I6Z3JheVwiPicrSlNPTi5zdHJpbmdpZnkodGhpcy5kdGRsb2JqLG51bGwsMikrJzwvcHJlPicpKVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBtb2RlbEVkaXRvckRpYWxvZygpO1xyXG5cclxuXHJcbmZ1bmN0aW9uIGJhc2VDbGFzc2VzUm93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRil7XHJcbiAgICB2YXIgcm93RE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXJcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW0gIHczLXRvb2x0aXBcIiBzdHlsZT1cImZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nLWxlZnQ6MnB4O2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6Z3JheVwiPkJhc2UgQ2xhc3NlczxwIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dGV4dC1hbGlnbjpsZWZ0O3RvcDotMTBweDtmb250LXdlaWdodDpub3JtYWw7d2lkdGg6MjAwcHhcIiBjbGFzcz1cInczLXRleHQgdzMtdGFnIHczLXRpbnlcIj5CYXNlIGNsYXNzIG1vZGVsXFwncyBwYXJhbWV0ZXJzIGFuZCByZWxhdGlvbnNoaXAgdHlwZSBhcmUgaW5oZXJpdGVkPC9wPjwvZGl2PjwvZGl2PicpXHJcblxyXG4gICAgdmFyIGFkZEJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmVkIHczLWhvdmVyLWFtYmVyXCIgc3R5bGU9XCJtYXJnaW4tdG9wOjJweDtmb250LXNpemU6MS4yZW07cGFkZGluZzo0cHhcIj4rPC9idXR0b24+JylcclxuICAgIHJvd0RPTS5hcHBlbmQoYWRkQnV0dG9uKVxyXG4gICAgcGFyZW50RE9NLmFwcGVuZChyb3dET00pXHJcbiAgICB2YXIgY29udGVudERPTT0kKCc8ZGl2IHN0eWxlPVwicGFkZGluZy1sZWZ0OjEwcHhcIj48L2Rpdj4nKVxyXG4gICAgcm93RE9NLmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgYWRkQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIHZhciBuZXdPYmogPSBcInVua25vd25cIlxyXG4gICAgICAgIGR0ZGxPYmoucHVzaChuZXdPYmopXHJcbiAgICAgICAgbmV3IHNpbmdsZUJhc2VjbGFzc1JvdyhuZXdPYmosY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9iailcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuICAgIC8vY2hlY2sgZXhpc3RlZCBjb250ZW50IGluaXRpYWxseSBmcm9tIHRlbXBsYXRlIGFuZCB0cmlnZ2VyIHRoZWlyIGRyYXdpbmdcclxuICAgIGR0ZGxPYmouZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICBuZXcgc2luZ2xlQmFzZWNsYXNzUm93KGVsZW1lbnQsY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9iailcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzaW5nbGVCYXNlY2xhc3NSb3coZHRkbE9iaixwYXJlbnRET00scmVmcmVzaERURExGLHBhcmVudER0ZGxPYmope1xyXG4gICAgdmFyIERPTSA9ICQoJzxkaXYgY2xhc3M9XCJ3My1jZWxsLXJvd1wiPjwvZGl2PicpXHJcbiAgICB2YXIgYmFzZUNsYXNzTmFtZUlucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjIyMHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwiYmFzZSBtb2RlbCBpZFwiLz4nKS5hZGRDbGFzcyhcInczLWJhci1pdGVtIHczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIHZhciByZW1vdmVCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWhvdmVyLWFtYmVyXCIgc3R5bGU9XCJjb2xvcjpncmF5O21hcmdpbi1sZWZ0OjNweDttYXJnaW4tdG9wOjJweDtmb250LXNpemU6MS4yZW07cGFkZGluZzoycHhcIj48aSBjbGFzcz1cImZhIGZhLXRyYXNoIGZhLWxnXCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICBET00uYXBwZW5kKGJhc2VDbGFzc05hbWVJbnB1dCxyZW1vdmVCdXR0b24pXHJcblxyXG4gICAgcmVtb3ZlQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIGZvciAodmFyIGkgPTA7aTwgcGFyZW50RHRkbE9iai5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAocGFyZW50RHRkbE9ialtpXSA9PSBkdGRsT2JqKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnREdGRsT2JqLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIERPTS5yZW1vdmUoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG5cclxuICAgIHBhcmVudERPTS5hcHBlbmQoRE9NKVxyXG5cclxuICAgIGJhc2VDbGFzc05hbWVJbnB1dC52YWwoZHRkbE9iailcclxuICAgIGJhc2VDbGFzc05hbWVJbnB1dC5vbihcImNoYW5nZVwiLCgpPT57XHJcbiAgICAgICAgZm9yICh2YXIgaSA9MDtpPCBwYXJlbnREdGRsT2JqLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChwYXJlbnREdGRsT2JqW2ldID09IGR0ZGxPYmopIHtcclxuICAgICAgICAgICAgICAgIHBhcmVudER0ZGxPYmpbaV09YmFzZUNsYXNzTmFtZUlucHV0LnZhbCgpXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxufVxyXG5cclxuZnVuY3Rpb24gY29tcG9uZW50c1JvdyhkdGRsT2JqLHBhcmVudERPTSxyZWZyZXNoRFRETEYpe1xyXG4gICAgdmFyIHJvd0RPTT0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtICB3My10b29sdGlwXCIgc3R5bGU9XCJmb250LXNpemU6MS4yZW07cGFkZGluZy1sZWZ0OjJweDtmb250LXdlaWdodDpib2xkO2NvbG9yOmdyYXlcIj5Db21wb25lbnRzPHAgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0ZXh0LWFsaWduOmxlZnQ7dG9wOi0xMHB4O2ZvbnQtd2VpZ2h0Om5vcm1hbDt3aWR0aDoyMDBweFwiIGNsYXNzPVwidzMtdGV4dCB3My10YWcgdzMtdGlueVwiPkNvbXBvbmVudCBtb2RlbFxcJ3MgcGFyYW1ldGVycyBhcmUgZW1iZWRkZWQgdW5kZXIgYSBuYW1lPC9wPjwvZGl2PjwvZGl2PicpXHJcblxyXG4gICAgdmFyIGFkZEJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmVkIHczLWhvdmVyLWFtYmVyXCIgc3R5bGU9XCJtYXJnaW4tdG9wOjJweDtmb250LXNpemU6MS4yZW07cGFkZGluZzo0cHhcIj4rPC9idXR0b24+JylcclxuICAgIHJvd0RPTS5hcHBlbmQoYWRkQnV0dG9uKVxyXG4gICAgcGFyZW50RE9NLmFwcGVuZChyb3dET00pXHJcbiAgICB2YXIgY29udGVudERPTT0kKCc8ZGl2IHN0eWxlPVwicGFkZGluZy1sZWZ0OjEwcHhcIj48L2Rpdj4nKVxyXG4gICAgcm93RE9NLmFwcGVuZChjb250ZW50RE9NKVxyXG5cclxuICAgIGFkZEJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICB2YXIgbmV3T2JqID0ge1xyXG4gICAgICAgICAgICBcIkB0eXBlXCI6IFwiQ29tcG9uZW50XCIsXHJcbiAgICAgICAgICAgIFwibmFtZVwiOiBcIlNvbWVDb21wb25lbnRcIixcclxuICAgICAgICAgICAgXCJzY2hlbWFcIjpcImR0bWk6c29tZUNvbXBvbmVudE1vZGVsOzFcIlxyXG4gICAgICAgIH1cclxuICAgICAgICBkdGRsT2JqLnB1c2gobmV3T2JqKVxyXG4gICAgICAgIG5ldyBzaW5nbGVDb21wb25lbnRSb3cobmV3T2JqLGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmopXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcbiAgICAvL2NoZWNrIGV4aXN0ZWQgY29udGVudCBpbml0aWFsbHkgZnJvbSB0ZW1wbGF0ZSBhbmQgdHJpZ2dlciB0aGVpciBkcmF3aW5nXHJcbiAgICBkdGRsT2JqLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgaWYoZWxlbWVudFtcIkB0eXBlXCJdIT1cIkNvbXBvbmVudFwiKSByZXR1cm5cclxuICAgICAgICBuZXcgc2luZ2xlQ29tcG9uZW50Um93KGVsZW1lbnQsY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9iailcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzaW5nbGVDb21wb25lbnRSb3coZHRkbE9iaixwYXJlbnRET00scmVmcmVzaERURExGLHBhcmVudER0ZGxPYmope1xyXG4gICAgdmFyIERPTSA9ICQoJzxkaXYgY2xhc3M9XCJ3My1jZWxsLXJvd1wiPjwvZGl2PicpXHJcbiAgICB2YXIgY29tcG9uZW50TmFtZUlucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjEwMHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwiY29tcG9uZW50IG5hbWVcIi8+JykuYWRkQ2xhc3MoXCJ3My1iYXItaXRlbSB3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICB2YXIgc2NoZW1hSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmU7d2lkdGg6MTYwcHg7cGFkZGluZzo0cHhcIiAgcGxhY2Vob2xkZXI9XCJjb21wb25lbnQgbW9kZWwgaWQuLi5cIi8+JykuYWRkQ2xhc3MoXCJ3My1iYXItaXRlbSB3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICB2YXIgcmVtb3ZlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwiY29sb3I6Z3JheTttYXJnaW4tbGVmdDozcHg7bWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6MnB4XCI+PGkgY2xhc3M9XCJmYSBmYS10cmFzaCBmYS1sZ1wiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgRE9NLmFwcGVuZChjb21wb25lbnROYW1lSW5wdXQsc2NoZW1hSW5wdXQscmVtb3ZlQnV0dG9uKVxyXG5cclxuICAgIHJlbW92ZUJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICBmb3IgKHZhciBpID0wO2k8IHBhcmVudER0ZGxPYmoubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHBhcmVudER0ZGxPYmpbaV0gPT09IGR0ZGxPYmopIHtcclxuICAgICAgICAgICAgICAgIHBhcmVudER0ZGxPYmouc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgRE9NLnJlbW92ZSgpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcblxyXG4gICAgcGFyZW50RE9NLmFwcGVuZChET00pXHJcblxyXG4gICAgY29tcG9uZW50TmFtZUlucHV0LnZhbChkdGRsT2JqW1wibmFtZVwiXSlcclxuICAgIHNjaGVtYUlucHV0LnZhbChkdGRsT2JqW1wic2NoZW1hXCJdfHxcIlwiKVxyXG5cclxuICAgIGNvbXBvbmVudE5hbWVJbnB1dC5vbihcImNoYW5nZVwiLCgpPT57XHJcbiAgICAgICAgZHRkbE9ialtcIm5hbWVcIl09Y29tcG9uZW50TmFtZUlucHV0LnZhbCgpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcbiAgICBzY2hlbWFJbnB1dC5vbihcImNoYW5nZVwiLCgpPT57XHJcbiAgICAgICAgZHRkbE9ialtcInNjaGVtYVwiXT1zY2hlbWFJbnB1dC52YWwoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG59XHJcblxyXG5mdW5jdGlvbiByZWxhdGlvbnNSb3coZHRkbE9iaixwYXJlbnRET00scmVmcmVzaERURExGLGRpYWxvZ09mZnNldCl7XHJcbiAgICB2YXIgcm93RE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXJcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtdG9vbHRpcFwiIHN0eWxlPVwiZm9udC1zaXplOjEuMmVtO3BhZGRpbmctbGVmdDoycHg7Zm9udC13ZWlnaHQ6Ym9sZDtjb2xvcjpncmF5XCI+UmVsYXRpb25zaGlwIFR5cGVzPHAgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0ZXh0LWFsaWduOmxlZnQ7dG9wOi0xMHB4O2ZvbnQtd2VpZ2h0Om5vcm1hbDt3aWR0aDoyMDBweFwiIGNsYXNzPVwidzMtdGV4dCB3My10YWcgdzMtdGlueVwiPlJlbGF0aW9uc2hpcCBjYW4gaGF2ZSBpdHMgb3duIHBhcmFtZXRlcnM8L3A+PC9kaXY+PC9kaXY+JylcclxuXHJcblxyXG4gICAgdmFyIGFkZEJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmVkIHczLWhvdmVyLWFtYmVyXCIgc3R5bGU9XCJtYXJnaW4tdG9wOjJweDtmb250LXNpemU6MS4yZW07cGFkZGluZzo0cHhcIj4rPC9idXR0b24+JylcclxuICAgIHJvd0RPTS5hcHBlbmQoYWRkQnV0dG9uKVxyXG4gICAgcGFyZW50RE9NLmFwcGVuZChyb3dET00pXHJcbiAgICB2YXIgY29udGVudERPTT0kKCc8ZGl2IHN0eWxlPVwicGFkZGluZy1sZWZ0OjEwcHhcIj48L2Rpdj4nKVxyXG4gICAgcm93RE9NLmFwcGVuZChjb250ZW50RE9NKVxyXG5cclxuICAgIGFkZEJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICB2YXIgbmV3T2JqID0ge1xyXG4gICAgICAgICAgICBcIkB0eXBlXCI6IFwiUmVsYXRpb25zaGlwXCIsXHJcbiAgICAgICAgICAgIFwibmFtZVwiOiBcInJlbGF0aW9uMVwiLFxyXG4gICAgICAgIH1cclxuICAgICAgICBkdGRsT2JqLnB1c2gobmV3T2JqKVxyXG4gICAgICAgIG5ldyBzaW5nbGVSZWxhdGlvblR5cGVSb3cobmV3T2JqLGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmosZGlhbG9nT2Zmc2V0KVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG5cclxuICAgIC8vY2hlY2sgZXhpc3RlZCBjb250ZW50IGluaXRpYWxseSBmcm9tIHRlbXBsYXRlIGFuZCB0cmlnZ2VyIHRoZWlyIGRyYXdpbmdcclxuICAgIGR0ZGxPYmouZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICBpZihlbGVtZW50W1wiQHR5cGVcIl0hPVwiUmVsYXRpb25zaGlwXCIpIHJldHVyblxyXG4gICAgICAgIG5ldyBzaW5nbGVSZWxhdGlvblR5cGVSb3coZWxlbWVudCxjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqLGRpYWxvZ09mZnNldClcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzaW5nbGVSZWxhdGlvblR5cGVSb3coZHRkbE9iaixwYXJlbnRET00scmVmcmVzaERURExGLHBhcmVudER0ZGxPYmosZGlhbG9nT2Zmc2V0KXtcclxuICAgIHZhciBET00gPSAkKCc8ZGl2IGNsYXNzPVwidzMtY2VsbC1yb3dcIj48L2Rpdj4nKVxyXG4gICAgdmFyIHJlbGF0aW9uTmFtZUlucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjkwcHg7cGFkZGluZzo0cHhcIiAgcGxhY2Vob2xkZXI9XCJyZWxhdGlvbiBuYW1lXCIvPicpLmFkZENsYXNzKFwidzMtYmFyLWl0ZW0gdzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgdmFyIHRhcmdldE1vZGVsSUQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmU7d2lkdGg6MTQwcHg7cGFkZGluZzo0cHhcIiAgcGxhY2Vob2xkZXI9XCIob3B0aW9uYWwpdGFyZ2V0IG1vZGVsXCIvPicpLmFkZENsYXNzKFwidzMtYmFyLWl0ZW0gdzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgdmFyIGFkZEJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cImNvbG9yOmdyYXk7bWFyZ2luLWxlZnQ6M3B4O21hcmdpbi10b3A6MnB4O2ZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjJweFwiPjxpIGNsYXNzPVwiZmEgZmEtY29nIGZhLWxnXCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICB2YXIgcmVtb3ZlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwiY29sb3I6Z3JheTttYXJnaW4tbGVmdDozcHg7bWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6MnB4XCI+PGkgY2xhc3M9XCJmYSBmYS10cmFzaCBmYS1sZ1wiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgRE9NLmFwcGVuZChyZWxhdGlvbk5hbWVJbnB1dCx0YXJnZXRNb2RlbElELGFkZEJ1dHRvbixyZW1vdmVCdXR0b24pXHJcblxyXG4gICAgcmVtb3ZlQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIGZvciAodmFyIGkgPTA7aTwgcGFyZW50RHRkbE9iai5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAocGFyZW50RHRkbE9ialtpXSA9PT0gZHRkbE9iaikge1xyXG4gICAgICAgICAgICAgICAgcGFyZW50RHRkbE9iai5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBET00ucmVtb3ZlKClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuXHJcbiAgICB2YXIgY29udGVudERPTT0kKCc8ZGl2IHN0eWxlPVwicGFkZGluZy1sZWZ0OjEwcHhcIj48L2Rpdj4nKVxyXG4gICAgRE9NLmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgcGFyZW50RE9NLmFwcGVuZChET00pXHJcblxyXG4gICAgcmVsYXRpb25OYW1lSW5wdXQudmFsKGR0ZGxPYmpbXCJuYW1lXCJdKVxyXG4gICAgdGFyZ2V0TW9kZWxJRC52YWwoZHRkbE9ialtcInRhcmdldFwiXXx8XCJcIilcclxuXHJcbiAgICBhZGRCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgaWYoISBkdGRsT2JqW1wicHJvcGVydGllc1wiXSkgZHRkbE9ialtcInByb3BlcnRpZXNcIl09W11cclxuICAgICAgICB2YXIgbmV3T2JqID0ge1xyXG4gICAgICAgICAgICBcIm5hbWVcIjogXCJuZXdQXCIsXHJcbiAgICAgICAgICAgIFwic2NoZW1hXCI6IFwiZG91YmxlXCJcclxuICAgICAgICB9XHJcbiAgICAgICAgZHRkbE9ialtcInByb3BlcnRpZXNcIl0ucHVzaChuZXdPYmopXHJcbiAgICAgICAgbmV3IHNpbmdsZVBhcmFtZXRlclJvdyhuZXdPYmosY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9ialtcInByb3BlcnRpZXNcIl0sbnVsbCxkaWFsb2dPZmZzZXQpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcblxyXG4gICAgcmVsYXRpb25OYW1lSW5wdXQub24oXCJjaGFuZ2VcIiwoKT0+e1xyXG4gICAgICAgIGR0ZGxPYmpbXCJuYW1lXCJdPXJlbGF0aW9uTmFtZUlucHV0LnZhbCgpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcbiAgICB0YXJnZXRNb2RlbElELm9uKFwiY2hhbmdlXCIsKCk9PntcclxuICAgICAgICBpZih0YXJnZXRNb2RlbElELnZhbCgpPT1cIlwiKSBkZWxldGUgZHRkbE9ialtcInRhcmdldFwiXVxyXG4gICAgICAgIGVsc2UgZHRkbE9ialtcInRhcmdldFwiXT10YXJnZXRNb2RlbElELnZhbCgpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcbiAgICBpZihkdGRsT2JqW1wicHJvcGVydGllc1wiXSAmJiBkdGRsT2JqW1wicHJvcGVydGllc1wiXS5sZW5ndGg+MCl7XHJcbiAgICAgICAgdmFyIHByb3BlcnRpZXM9ZHRkbE9ialtcInByb3BlcnRpZXNcIl1cclxuICAgICAgICBwcm9wZXJ0aWVzLmZvckVhY2gob25lUHJvcGVydHk9PntcclxuICAgICAgICAgICAgbmV3IHNpbmdsZVBhcmFtZXRlclJvdyhvbmVQcm9wZXJ0eSxjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqW1wicHJvcGVydGllc1wiXSxudWxsLGRpYWxvZ09mZnNldClcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBwYXJhbWV0ZXJzUm93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRixkaWFsb2dPZmZzZXQpe1xyXG4gICAgdmFyIHJvd0RPTT0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtXCIgc3R5bGU9XCJmb250LXNpemU6MS4yZW07cGFkZGluZy1sZWZ0OjJweDtmb250LXdlaWdodDpib2xkO2NvbG9yOmdyYXlcIj5QYXJhbWV0ZXJzPC9kaXY+PC9kaXY+JylcclxuICAgIHZhciBhZGRCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJlZCB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwibWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6NHB4XCI+KzwvYnV0dG9uPicpXHJcbiAgICByb3dET00uYXBwZW5kKGFkZEJ1dHRvbilcclxuICAgIHBhcmVudERPTS5hcHBlbmQocm93RE9NKVxyXG4gICAgdmFyIGNvbnRlbnRET009JCgnPGRpdiBzdHlsZT1cInBhZGRpbmctbGVmdDoxMHB4XCI+PC9kaXY+JylcclxuICAgIHJvd0RPTS5hcHBlbmQoY29udGVudERPTSlcclxuICAgIGFkZEJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICB2YXIgbmV3T2JqID0ge1xyXG4gICAgICAgICAgICBcIkB0eXBlXCI6IFwiUHJvcGVydHlcIixcclxuICAgICAgICAgICAgXCJuYW1lXCI6IFwibmV3UFwiLFxyXG4gICAgICAgICAgICBcInNjaGVtYVwiOiBcImRvdWJsZVwiXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGR0ZGxPYmoucHVzaChuZXdPYmopXHJcbiAgICAgICAgbmV3IHNpbmdsZVBhcmFtZXRlclJvdyhuZXdPYmosY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9iaixcInRvcExldmVsXCIsZGlhbG9nT2Zmc2V0KVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG5cclxuICAgIC8vY2hlY2sgZXhpc3RlZCBjb250ZW50IGluaXRpYWxseSBmcm9tIHRlbXBsYXRlIGFuZCB0cmlnZ2VyIHRoZWlyIGRyYXdpbmdcclxuICAgIGR0ZGxPYmouZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICBpZihlbGVtZW50W1wiQHR5cGVcIl0hPVwiUHJvcGVydHlcIikgcmV0dXJuXHJcbiAgICAgICAgbmV3IHNpbmdsZVBhcmFtZXRlclJvdyhlbGVtZW50LGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmosXCJ0b3BMZXZlbFwiLGRpYWxvZ09mZnNldClcclxuICAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzaW5nbGVQYXJhbWV0ZXJSb3coZHRkbE9iaixwYXJlbnRET00scmVmcmVzaERURExGLHBhcmVudER0ZGxPYmosdG9wTGV2ZWwsZGlhbG9nT2Zmc2V0KXtcclxuICAgIHZhciBET00gPSAkKCc8ZGl2IGNsYXNzPVwidzMtY2VsbC1yb3dcIj48L2Rpdj4nKVxyXG4gICAgdmFyIHBhcmFtZXRlck5hbWVJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDoxMDBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cInBhcmFtZXRlciBuYW1lXCIvPicpLmFkZENsYXNzKFwidzMtYmFyLWl0ZW0gdzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgdmFyIGVudW1WYWx1ZUlucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjEwMHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwic3RyMSxzdHIyLC4uLlwiLz4nKS5hZGRDbGFzcyhcInczLWJhci1pdGVtIHczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIHZhciBhZGRCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWhvdmVyLWFtYmVyXCIgc3R5bGU9XCJjb2xvcjpncmF5O21hcmdpbi1sZWZ0OjNweDttYXJnaW4tdG9wOjJweDtmb250LXNpemU6MS4yZW07cGFkZGluZzoycHhcIj48aSBjbGFzcz1cImZhIGZhLXBsdXMgZmEtbGdcIj48L2k+PC9idXR0b24+JylcclxuICAgIHZhciByZW1vdmVCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWhvdmVyLWFtYmVyXCIgc3R5bGU9XCJjb2xvcjpncmF5O21hcmdpbi1sZWZ0OjNweDttYXJnaW4tdG9wOjJweDtmb250LXNpemU6MS4yZW07cGFkZGluZzoycHhcIj48aSBjbGFzcz1cImZhIGZhLXRyYXNoIGZhLWxnXCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICB2YXIgcHR5cGVTZWxlY3Rvcj1uZXcgc2ltcGxlU2VsZWN0TWVudShcIiBcIix7d2l0aEJvcmRlcjoxLGZvbnRTaXplOlwiMWVtXCIsY29sb3JDbGFzczpcInczLWxpZ2h0LWdyYXkgdzMtYmFyLWl0ZW1cIixidXR0b25DU1M6e1wicGFkZGluZ1wiOlwiNHB4IDVweFwifSxcIm9wdGlvbkxpc3RIZWlnaHRcIjozMDAsXCJpc0NsaWNrYWJsZVwiOjFcclxuICAgICxcIm9wdGlvbkxpc3RNYXJnaW5Ub3BcIjotMTUwLFwib3B0aW9uTGlzdE1hcmdpbkxlZnRcIjo2MCxcImFkanVzdFBvc2l0aW9uQW5jaG9yXCI6ZGlhbG9nT2Zmc2V0fSlcclxuICAgIFxyXG5cclxuICAgIHB0eXBlU2VsZWN0b3IuYWRkT3B0aW9uQXJyKFtcInN0cmluZ1wiLFwiZmxvYXRcIixcImludGVnZXJcIixcIkVudW1cIixcIk9iamVjdFwiLFwiZG91YmxlXCIsXCJib29sZWFuXCIsXCJkYXRlXCIsXCJkYXRlVGltZVwiLFwiZHVyYXRpb25cIixcImxvbmdcIixcInRpbWVcIl0pXHJcbiAgICBET00uYXBwZW5kKHBhcmFtZXRlck5hbWVJbnB1dCxwdHlwZVNlbGVjdG9yLkRPTSxlbnVtVmFsdWVJbnB1dCxhZGRCdXR0b24scmVtb3ZlQnV0dG9uKVxyXG5cclxuICAgIHJlbW92ZUJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICBmb3IgKHZhciBpID0wO2k8IHBhcmVudER0ZGxPYmoubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHBhcmVudER0ZGxPYmpbaV0gPT09IGR0ZGxPYmopIHtcclxuICAgICAgICAgICAgICAgIHBhcmVudER0ZGxPYmouc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgRE9NLnJlbW92ZSgpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcbiAgICBcclxuICAgIHZhciBjb250ZW50RE9NPSQoJzxkaXYgc3R5bGU9XCJwYWRkaW5nLWxlZnQ6MTBweFwiPjwvZGl2PicpXHJcbiAgICBET00uYXBwZW5kKGNvbnRlbnRET00pXHJcbiAgICBwYXJlbnRET00uYXBwZW5kKERPTSlcclxuXHJcbiAgICBwYXJhbWV0ZXJOYW1lSW5wdXQudmFsKGR0ZGxPYmpbXCJuYW1lXCJdKVxyXG4gICAgcHR5cGVTZWxlY3Rvci5jYWxsQmFja19jbGlja09wdGlvbj0ob3B0aW9uVGV4dCxvcHRpb25WYWx1ZSxyZWFsTW91c2VDbGljayk9PntcclxuICAgICAgICBwdHlwZVNlbGVjdG9yLmNoYW5nZU5hbWUob3B0aW9uVGV4dClcclxuICAgICAgICBjb250ZW50RE9NLmVtcHR5KCkvL2NsZWFyIGFsbCBjb250ZW50IGRvbSBjb250ZW50XHJcbiAgICAgICAgaWYocmVhbE1vdXNlQ2xpY2spe1xyXG4gICAgICAgICAgICBmb3IodmFyIGluZCBpbiBkdGRsT2JqKSBkZWxldGUgZHRkbE9ialtpbmRdICAgIC8vY2xlYXIgYWxsIG9iamVjdCBjb250ZW50XHJcbiAgICAgICAgICAgIGlmKHRvcExldmVsKSBkdGRsT2JqW1wiQHR5cGVcIl09XCJQcm9wZXJ0eVwiXHJcbiAgICAgICAgICAgIGR0ZGxPYmpbXCJuYW1lXCJdPXBhcmFtZXRlck5hbWVJbnB1dC52YWwoKVxyXG4gICAgICAgIH0gXHJcbiAgICAgICAgaWYob3B0aW9uVGV4dD09XCJFbnVtXCIpe1xyXG4gICAgICAgICAgICBlbnVtVmFsdWVJbnB1dC52YWwoXCJcIilcclxuICAgICAgICAgICAgZW51bVZhbHVlSW5wdXQuc2hvdygpO1xyXG4gICAgICAgICAgICBhZGRCdXR0b24uaGlkZSgpXHJcbiAgICAgICAgICAgIGlmKHJlYWxNb3VzZUNsaWNrKSBkdGRsT2JqW1wic2NoZW1hXCJdPXtcIkB0eXBlXCI6IFwiRW51bVwiLFwidmFsdWVTY2hlbWFcIjogXCJzdHJpbmdcIn1cclxuICAgICAgICB9ZWxzZSBpZihvcHRpb25UZXh0PT1cIk9iamVjdFwiKXtcclxuICAgICAgICAgICAgZW51bVZhbHVlSW5wdXQuaGlkZSgpO1xyXG4gICAgICAgICAgICBhZGRCdXR0b24uc2hvdygpXHJcbiAgICAgICAgICAgIGlmKHJlYWxNb3VzZUNsaWNrKSBkdGRsT2JqW1wic2NoZW1hXCJdPXtcIkB0eXBlXCI6IFwiT2JqZWN0XCJ9XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIGlmKHJlYWxNb3VzZUNsaWNrKSBkdGRsT2JqW1wic2NoZW1hXCJdPW9wdGlvblRleHRcclxuICAgICAgICAgICAgZW51bVZhbHVlSW5wdXQuaGlkZSgpO1xyXG4gICAgICAgICAgICBhZGRCdXR0b24uaGlkZSgpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9XHJcbiAgICBhZGRCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgaWYoISBkdGRsT2JqW1wic2NoZW1hXCJdW1wiZmllbGRzXCJdKSBkdGRsT2JqW1wic2NoZW1hXCJdW1wiZmllbGRzXCJdPVtdXHJcbiAgICAgICAgdmFyIG5ld09iaiA9IHtcclxuICAgICAgICAgICAgXCJuYW1lXCI6IFwibmV3UFwiLFxyXG4gICAgICAgICAgICBcInNjaGVtYVwiOiBcImRvdWJsZVwiXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGR0ZGxPYmpbXCJzY2hlbWFcIl1bXCJmaWVsZHNcIl0ucHVzaChuZXdPYmopXHJcbiAgICAgICAgbmV3IHNpbmdsZVBhcmFtZXRlclJvdyhuZXdPYmosY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9ialtcInNjaGVtYVwiXVtcImZpZWxkc1wiXSxudWxsLGRpYWxvZ09mZnNldClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuXHJcbiAgICBwYXJhbWV0ZXJOYW1lSW5wdXQub24oXCJjaGFuZ2VcIiwoKT0+e1xyXG4gICAgICAgIGR0ZGxPYmpbXCJuYW1lXCJdPXBhcmFtZXRlck5hbWVJbnB1dC52YWwoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgZW51bVZhbHVlSW5wdXQub24oXCJjaGFuZ2VcIiwoKT0+e1xyXG4gICAgICAgIHZhciB2YWx1ZUFycj1lbnVtVmFsdWVJbnB1dC52YWwoKS5zcGxpdChcIixcIilcclxuICAgICAgICBkdGRsT2JqW1wic2NoZW1hXCJdW1wiZW51bVZhbHVlc1wiXT1bXVxyXG4gICAgICAgIHZhbHVlQXJyLmZvckVhY2goYVZhbD0+e1xyXG4gICAgICAgICAgICBkdGRsT2JqW1wic2NoZW1hXCJdW1wiZW51bVZhbHVlc1wiXS5wdXNoKHtcclxuICAgICAgICAgICAgICAgIFwibmFtZVwiOiBhVmFsLnJlcGxhY2UoXCIgXCIsXCJcIiksIC8vcmVtb3ZlIGFsbCB0aGUgc3BhY2UgaW4gbmFtZVxyXG4gICAgICAgICAgICAgICAgXCJlbnVtVmFsdWVcIjogYVZhbFxyXG4gICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSlcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuICAgIGlmKHR5cGVvZihkdGRsT2JqW1wic2NoZW1hXCJdKSAhPSAnb2JqZWN0JykgdmFyIHNjaGVtYT1kdGRsT2JqW1wic2NoZW1hXCJdXHJcbiAgICBlbHNlIHNjaGVtYT1kdGRsT2JqW1wic2NoZW1hXCJdW1wiQHR5cGVcIl1cclxuICAgIHB0eXBlU2VsZWN0b3IudHJpZ2dlck9wdGlvblZhbHVlKHNjaGVtYSlcclxuICAgIGlmKHNjaGVtYT09XCJFbnVtXCIpe1xyXG4gICAgICAgIHZhciBlbnVtQXJyPWR0ZGxPYmpbXCJzY2hlbWFcIl1bXCJlbnVtVmFsdWVzXCJdXHJcbiAgICAgICAgaWYoZW51bUFyciE9bnVsbCl7XHJcbiAgICAgICAgICAgIHZhciBpbnB1dFN0cj1cIlwiXHJcbiAgICAgICAgICAgIGVudW1BcnIuZm9yRWFjaChvbmVFbnVtVmFsdWU9PntpbnB1dFN0cis9b25lRW51bVZhbHVlLmVudW1WYWx1ZStcIixcIn0pXHJcbiAgICAgICAgICAgIGlucHV0U3RyPWlucHV0U3RyLnNsaWNlKDAsIC0xKS8vcmVtb3ZlIHRoZSBsYXN0IFwiLFwiXHJcbiAgICAgICAgICAgIGVudW1WYWx1ZUlucHV0LnZhbChpbnB1dFN0cilcclxuICAgICAgICB9XHJcbiAgICB9ZWxzZSBpZihzY2hlbWE9PVwiT2JqZWN0XCIpe1xyXG4gICAgICAgIHZhciBmaWVsZHM9ZHRkbE9ialtcInNjaGVtYVwiXVtcImZpZWxkc1wiXVxyXG4gICAgICAgIGZpZWxkcy5mb3JFYWNoKG9uZUZpZWxkPT57XHJcbiAgICAgICAgICAgIG5ldyBzaW5nbGVQYXJhbWV0ZXJSb3cob25lRmllbGQsY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9ialtcInNjaGVtYVwiXVtcImZpZWxkc1wiXSxudWxsLGRpYWxvZ09mZnNldClcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG59XHJcblxyXG5cclxuZnVuY3Rpb24gaWRSb3coZHRkbE9iaixwYXJlbnRET00scmVmcmVzaERURExGKXtcclxuICAgIHZhciBET00gPSAkKCc8ZGl2IGNsYXNzPVwidzMtY2VsbC1yb3dcIj48L2Rpdj4nKVxyXG4gICAgdmFyIGxhYmVsMT0kKCc8ZGl2IGNsYXNzPVwidzMtb3BhY2l0eVwiIHN0eWxlPVwiZGlzcGxheTppbmxpbmVcIj5kdG1pOjwvZGl2PicpXHJcbiAgICB2YXIgZG9tYWluSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmU7d2lkdGg6ODhweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cIk5hbWVzcGFjZVwiLz4nKS5hZGRDbGFzcyhcInczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIHZhciBtb2RlbElESW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmU7d2lkdGg6MTMycHg7cGFkZGluZzo0cHhcIiAgcGxhY2Vob2xkZXI9XCJNb2RlbElEXCIvPicpLmFkZENsYXNzKFwidzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgdmFyIHZlcnNpb25JbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDo2MHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwidmVyc2lvblwiLz4nKS5hZGRDbGFzcyhcInczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIERPTS5hcHBlbmQobGFiZWwxLGRvbWFpbklucHV0LCQoJzxkaXYgY2xhc3M9XCJ3My1vcGFjaXR5XCIgc3R5bGU9XCJkaXNwbGF5OmlubGluZVwiPjo8L2Rpdj4nKSxtb2RlbElESW5wdXQsJCgnPGRpdiBjbGFzcz1cInczLW9wYWNpdHlcIiBzdHlsZT1cImRpc3BsYXk6aW5saW5lXCI+OzwvZGl2PicpLHZlcnNpb25JbnB1dClcclxuICAgIHBhcmVudERPTS5hcHBlbmQoRE9NKVxyXG5cclxuICAgIHZhciB2YWx1ZUNoYW5nZT0oKT0+e1xyXG4gICAgICAgIHZhciBzdHI9YGR0bWk6JHtkb21haW5JbnB1dC52YWwoKX06JHttb2RlbElESW5wdXQudmFsKCl9OyR7dmVyc2lvbklucHV0LnZhbCgpfWBcclxuICAgICAgICBkdGRsT2JqW1wiQGlkXCJdPXN0clxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9XHJcbiAgICBkb21haW5JbnB1dC5vbihcImNoYW5nZVwiLHZhbHVlQ2hhbmdlKVxyXG4gICAgbW9kZWxJRElucHV0Lm9uKFwiY2hhbmdlXCIsdmFsdWVDaGFuZ2UpXHJcbiAgICB2ZXJzaW9uSW5wdXQub24oXCJjaGFuZ2VcIix2YWx1ZUNoYW5nZSlcclxuXHJcbiAgICB2YXIgc3RyPWR0ZGxPYmpbXCJAaWRcIl1cclxuICAgIGlmKHN0ciE9XCJcIiAmJiBzdHIhPW51bGwpe1xyXG4gICAgICAgIHZhciBhcnIxPXN0ci5zcGxpdChcIjtcIilcclxuICAgICAgICBpZihhcnIxLmxlbmd0aCE9MikgcmV0dXJuO1xyXG4gICAgICAgIHZlcnNpb25JbnB1dC52YWwoYXJyMVsxXSlcclxuICAgICAgICB2YXIgYXJyMj1hcnIxWzBdLnNwbGl0KFwiOlwiKVxyXG4gICAgICAgIGRvbWFpbklucHV0LnZhbChhcnIyWzFdKVxyXG4gICAgICAgIGFycjIuc2hpZnQoKTsgYXJyMi5zaGlmdCgpXHJcbiAgICAgICAgbW9kZWxJRElucHV0LnZhbChhcnIyLmpvaW4oXCI6XCIpKVxyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBkaXNwbGF5TmFtZVJvdyhkdGRsT2JqLHBhcmVudERPTSxyZWZyZXNoRFRETEYpe1xyXG4gICAgdmFyIERPTSA9ICQoJzxkaXYgY2xhc3M9XCJ3My1jZWxsLXJvd1wiPjwvZGl2PicpXHJcbiAgICB2YXIgbGFiZWwxPSQoJzxkaXYgY2xhc3M9XCJ3My1vcGFjaXR5XCIgc3R5bGU9XCJkaXNwbGF5OmlubGluZVwiPkRpc3BsYXkgTmFtZTo8L2Rpdj4nKVxyXG4gICAgdmFyIG5hbWVJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDoxNTBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cIk1vZGVsSURcIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICBET00uYXBwZW5kKGxhYmVsMSxuYW1lSW5wdXQpXHJcbiAgICBwYXJlbnRET00uYXBwZW5kKERPTSlcclxuICAgIHZhciB2YWx1ZUNoYW5nZT0oKT0+e1xyXG4gICAgICAgIGR0ZGxPYmpbXCJkaXNwbGF5TmFtZVwiXT1uYW1lSW5wdXQudmFsKClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfVxyXG4gICAgbmFtZUlucHV0Lm9uKFwiY2hhbmdlXCIsdmFsdWVDaGFuZ2UpXHJcbiAgICB2YXIgc3RyPWR0ZGxPYmpbXCJkaXNwbGF5TmFtZVwiXVxyXG4gICAgaWYoc3RyIT1cIlwiICYmIHN0ciE9bnVsbCkgbmFtZUlucHV0LnZhbChzdHIpXHJcbn0iLCJjb25zdCBtb2RlbEFuYWx5emVyPXJlcXVpcmUoXCIuL21vZGVsQW5hbHl6ZXJcIilcclxuY29uc3Qgc2ltcGxlQ29uZmlybURpYWxvZyA9IHJlcXVpcmUoXCIuL3NpbXBsZUNvbmZpcm1EaWFsb2dcIilcclxuY29uc3Qgc2ltcGxlVHJlZT0gcmVxdWlyZShcIi4vc2ltcGxlVHJlZVwiKVxyXG5jb25zdCBtb2RlbEVkaXRvckRpYWxvZyA9IHJlcXVpcmUoXCIuL21vZGVsRWRpdG9yRGlhbG9nXCIpXHJcbmNvbnN0IGdsb2JhbENhY2hlID0gcmVxdWlyZShcIi4vZ2xvYmFsQ2FjaGVcIilcclxuXHJcbmZ1bmN0aW9uIG1vZGVsTWFuYWdlckRpYWxvZygpIHtcclxuICAgIHRoaXMubW9kZWxzPXt9XHJcbiAgICBpZighdGhpcy5ET00pe1xyXG4gICAgICAgIHRoaXMuRE9NID0gJCgnPGRpdiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7YmFja2dyb3VuZC1jb2xvcjp3aGl0ZTtsZWZ0OjUwJTt0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSkgdHJhbnNsYXRlWSgtNTAlKTt6LWluZGV4Ojk5XCIgY2xhc3M9XCJ3My1jYXJkLTJcIj48L2Rpdj4nKVxyXG4gICAgICAgIHRoaXMuRE9NLmNzcyhcIm92ZXJmbG93XCIsXCJoaWRkZW5cIilcclxuICAgICAgICAkKFwiYm9keVwiKS5hcHBlbmQodGhpcy5ET00pXHJcbiAgICAgICAgdGhpcy5ET00uaGlkZSgpXHJcbiAgICAgICAgZ2xvYmFsQ2FjaGUubWFrZURPTURyYWdnYWJsZSh0aGlzLkRPTSlcclxuICAgIH1cclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5wcmVwYXJhdGlvbkZ1bmMgPSBhc3luYyBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICAgJC5nZXQoXCJ2aXN1YWxEZWZpbml0aW9uL3JlYWRWaXN1YWxEZWZpbml0aW9uXCIsIChkYXRhLCBzdGF0dXMpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmKGRhdGEhPVwiXCIgJiYgdHlwZW9mKGRhdGEpPT09XCJvYmplY3RcIikgZ2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbj1kYXRhO1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfWNhdGNoKGUpe1xyXG4gICAgICAgICAgICByZWplY3QoZSlcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLnBvcHVwID0gYXN5bmMgZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLkRPTS5zaG93KClcclxuICAgIHRoaXMuRE9NLmVtcHR5KClcclxuICAgIHRoaXMuY29udGVudERPTSA9ICQoJzxkaXYgc3R5bGU9XCJ3aWR0aDo2NTBweFwiPjwvZGl2PicpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQodGhpcy5jb250ZW50RE9NKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwiaGVpZ2h0OjQwcHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cImZvbnQtc2l6ZToxLjVlbVwiPkRpZ2l0YWwgVHdpbiBNb2RlbHM8L2Rpdj48L2Rpdj4nKSlcclxuICAgIHZhciBjbG9zZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmlnaHRcIiBzdHlsZT1cImZvbnQtc2l6ZToyZW07cGFkZGluZy10b3A6NHB4XCI+w5c8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmNoaWxkcmVuKCc6Zmlyc3QnKS5hcHBlbmQoY2xvc2VCdXR0b24pXHJcbiAgICBjbG9zZUJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5ET00uaGlkZSgpIH0pXHJcblxyXG4gICAgdmFyIGltcG9ydE1vZGVsc0J0biA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtY2FyZCB3My1kZWVwLW9yYW5nZSB3My1ob3Zlci1saWdodC1ncmVlblwiIHN0eWxlPVwiaGVpZ2h0OjEwMCVcIj5JbXBvcnQ8L2J1dHRvbj4nKVxyXG4gICAgdmFyIGFjdHVhbEltcG9ydE1vZGVsc0J0biA9JCgnPGlucHV0IHR5cGU9XCJmaWxlXCIgbmFtZT1cIm1vZGVsRmlsZXNcIiBtdWx0aXBsZT1cIm11bHRpcGxlXCIgc3R5bGU9XCJkaXNwbGF5Om5vbmVcIj48L2lucHV0PicpXHJcbiAgICB2YXIgbW9kZWxFZGl0b3JCdG4gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWNhcmQgdzMtZGVlcC1vcmFuZ2UgdzMtaG92ZXItbGlnaHQtZ3JlZW5cIiBzdHlsZT1cImhlaWdodDoxMDAlXCI+Q3JlYXRlL01vZGlmeSBNb2RlbDwvYnV0dG9uPicpXHJcbiAgICB2YXIgZXhwb3J0TW9kZWxCdG4gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWNhcmQgdzMtZGVlcC1vcmFuZ2UgdzMtaG92ZXItbGlnaHQtZ3JlZW5cIiBzdHlsZT1cImhlaWdodDoxMDAlXCI+RXhwb3J0IEFsbCBNb2RlbHM8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmNoaWxkcmVuKCc6Zmlyc3QnKS5hcHBlbmQoaW1wb3J0TW9kZWxzQnRuLGFjdHVhbEltcG9ydE1vZGVsc0J0biwgbW9kZWxFZGl0b3JCdG4sZXhwb3J0TW9kZWxCdG4pXHJcbiAgICBpbXBvcnRNb2RlbHNCdG4ub24oXCJjbGlja1wiLCAoKT0+e1xyXG4gICAgICAgIGFjdHVhbEltcG9ydE1vZGVsc0J0bi50cmlnZ2VyKCdjbGljaycpO1xyXG4gICAgfSk7XHJcbiAgICBhY3R1YWxJbXBvcnRNb2RlbHNCdG4uY2hhbmdlKGFzeW5jIChldnQpPT57XHJcbiAgICAgICAgdmFyIGZpbGVzID0gZXZ0LnRhcmdldC5maWxlczsgLy8gRmlsZUxpc3Qgb2JqZWN0XHJcbiAgICAgICAgYXdhaXQgdGhpcy5yZWFkTW9kZWxGaWxlc0NvbnRlbnRBbmRJbXBvcnQoZmlsZXMpXHJcbiAgICAgICAgYWN0dWFsSW1wb3J0TW9kZWxzQnRuLnZhbChcIlwiKVxyXG4gICAgfSlcclxuICAgIG1vZGVsRWRpdG9yQnRuLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIG1vZGVsRWRpdG9yRGlhbG9nLnBvcHVwKClcclxuICAgIH0pXHJcblxyXG4gICAgZXhwb3J0TW9kZWxCdG4ub24oXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgICAgdmFyIG1vZGVsQXJyPVtdXHJcbiAgICAgICAgZm9yKHZhciBtb2RlbElEIGluIG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVscykgbW9kZWxBcnIucHVzaChKU09OLnBhcnNlKG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXVtcIm9yaWdpbmFsXCJdKSlcclxuICAgICAgICB2YXIgcG9tID0gJChcIjxhPjwvYT5cIilcclxuICAgICAgICBwb20uYXR0cignaHJlZicsICdkYXRhOnRleHQvcGxhaW47Y2hhcnNldD11dGYtOCwnICsgZW5jb2RlVVJJQ29tcG9uZW50KEpTT04uc3RyaW5naWZ5KG1vZGVsQXJyKSkpO1xyXG4gICAgICAgIHBvbS5hdHRyKCdkb3dubG9hZCcsIFwiZXhwb3J0TW9kZWxzLmpzb25cIik7XHJcbiAgICAgICAgcG9tWzBdLmNsaWNrKClcclxuICAgIH0pXHJcblxyXG5cclxuICAgIHZhciByb3cyPSQoJzxkaXYgY2xhc3M9XCJ3My1jZWxsLXJvd1wiIHN0eWxlPVwibWFyZ2luLXRvcDoycHhcIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5jb250ZW50RE9NLmFwcGVuZChyb3cyKVxyXG4gICAgdmFyIGxlZnRTcGFuPSQoJzxkaXYgY2xhc3M9XCJ3My1jZWxsXCIgc3R5bGU9XCJ3aWR0aDoyNDBweDtwYWRkaW5nLXJpZ2h0OjVweFwiPjwvZGl2PicpXHJcbiAgICByb3cyLmFwcGVuZChsZWZ0U3BhbilcclxuICAgIGxlZnRTcGFuLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwiaGVpZ2h0OjMwcHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cIlwiPk1vZGVsczwvZGl2PjwvZGl2PicpKVxyXG4gICAgXHJcbiAgICB2YXIgbW9kZWxMaXN0ID0gJCgnPHVsIGNsYXNzPVwidzMtdWwgdzMtaG92ZXJhYmxlXCI+JylcclxuICAgIG1vZGVsTGlzdC5jc3Moe1wib3ZlcmZsb3cteFwiOlwiaGlkZGVuXCIsXCJvdmVyZmxvdy15XCI6XCJhdXRvXCIsXCJoZWlnaHRcIjpcIjQyMHB4XCIsIFwiYm9yZGVyXCI6XCJzb2xpZCAxcHggbGlnaHRncmF5XCJ9KVxyXG4gICAgbGVmdFNwYW4uYXBwZW5kKG1vZGVsTGlzdClcclxuICAgIHRoaXMubW9kZWxMaXN0ID0gbW9kZWxMaXN0O1xyXG4gICAgXHJcbiAgICB2YXIgcmlnaHRTcGFuPSQoJzxkaXYgY2xhc3M9XCJ3My1jb250YWluZXIgdzMtY2VsbFwiPjwvZGl2PicpXHJcbiAgICByb3cyLmFwcGVuZChyaWdodFNwYW4pIFxyXG4gICAgdmFyIHBhbmVsQ2FyZE91dD0kKCc8ZGl2IGNsYXNzPVwidzMtY2FyZC0yIHczLXdoaXRlXCIgc3R5bGU9XCJtYXJnaW4tdG9wOjJweFwiPjwvZGl2PicpXHJcblxyXG4gICAgdGhpcy5tb2RlbEJ1dHRvbkJhcj0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCIgc3R5bGU9XCJoZWlnaHQ6MzVweFwiPjwvZGl2PicpXHJcbiAgICBwYW5lbENhcmRPdXQuYXBwZW5kKHRoaXMubW9kZWxCdXR0b25CYXIpXHJcblxyXG4gICAgcmlnaHRTcGFuLmFwcGVuZChwYW5lbENhcmRPdXQpXHJcbiAgICB2YXIgcGFuZWxDYXJkPSQoJzxkaXYgc3R5bGU9XCJ3aWR0aDo0MDBweDtoZWlnaHQ6NDA1cHg7b3ZlcmZsb3c6YXV0bzttYXJnaW4tdG9wOjJweFwiPjwvZGl2PicpXHJcbiAgICBwYW5lbENhcmRPdXQuYXBwZW5kKHBhbmVsQ2FyZClcclxuICAgIHRoaXMucGFuZWxDYXJkPXBhbmVsQ2FyZDtcclxuXHJcbiAgICB0aGlzLm1vZGVsQnV0dG9uQmFyLmVtcHR5KClcclxuICAgIHBhbmVsQ2FyZC5odG1sKFwiPGEgc3R5bGU9J2Rpc3BsYXk6YmxvY2s7Zm9udC1zdHlsZTppdGFsaWM7Y29sb3I6Z3JheTtwYWRkaW5nLWxlZnQ6NXB4Jz5DaG9vc2UgYSBtb2RlbCB0byB2aWV3IGluZm9tcmF0aW9uPC9hPlwiKVxyXG5cclxuICAgIHRoaXMubGlzdE1vZGVscygpXHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUucmVzaXplSW1nRmlsZSA9IGFzeW5jIGZ1bmN0aW9uKHRoZUZpbGUsbWF4X3NpemUpIHtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XHJcbiAgICAgICAgICAgIHZhciB0bXBJbWcgPSBuZXcgSW1hZ2UoKTtcclxuICAgICAgICAgICAgcmVhZGVyLm9ubG9hZCA9ICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRtcEltZy5vbmxvYWQgPSAgKCk9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHdpZHRoID0gdG1wSW1nLndpZHRoXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGhlaWdodCA9IHRtcEltZy5oZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHdpZHRoID4gaGVpZ2h0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh3aWR0aCA+IG1heF9zaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQgKj0gbWF4X3NpemUgLyB3aWR0aDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoID0gbWF4X3NpemU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaGVpZ2h0ID4gbWF4X3NpemUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoICo9IG1heF9zaXplIC8gaGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ID0gbWF4X3NpemU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgY2FudmFzLndpZHRoID0gd2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FudmFzLmhlaWdodCA9IGhlaWdodDtcclxuICAgICAgICAgICAgICAgICAgICBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKS5kcmF3SW1hZ2UodG1wSW1nLCAwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZGF0YVVybCA9IGNhbnZhcy50b0RhdGFVUkwoJ2ltYWdlL3BuZycpO1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZGF0YVVybClcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRtcEltZy5zcmMgPSByZWFkZXIucmVzdWx0O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJlYWRlci5yZWFkQXNEYXRhVVJMKHRoZUZpbGUpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAgICAgcmVqZWN0KGUpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5maWxsUmlnaHRTcGFuPWFzeW5jIGZ1bmN0aW9uKG1vZGVsTmFtZSl7XHJcbiAgICB0aGlzLnBhbmVsQ2FyZC5lbXB0eSgpXHJcbiAgICB0aGlzLm1vZGVsQnV0dG9uQmFyLmVtcHR5KClcclxuICAgIHZhciBtb2RlbElEPXRoaXMubW9kZWxzW21vZGVsTmFtZV1bJ0BpZCddXHJcblxyXG4gICAgdmFyIGRlbEJ0biA9ICQoJzxidXR0b24gc3R5bGU9XCJtYXJnaW4tYm90dG9tOjJweFwiIGNsYXNzPVwidzMtYnV0dG9uIHczLWxpZ2h0LWdyYXkgdzMtaG92ZXItcGluayB3My1ib3JkZXItcmlnaHRcIj5EZWxldGUgTW9kZWw8L2J1dHRvbj4nKVxyXG4gICAgdmFyIGltcG9ydFBpY0J0biA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtbGlnaHQtZ3JheSB3My1ob3Zlci1hbWJlciB3My1ib3JkZXItcmlnaHRcIj5VcGxvYWQgQXZhcnRhPC9idXR0b24+JylcclxuICAgIHZhciBhY3R1YWxJbXBvcnRQaWNCdG4gPSQoJzxpbnB1dCB0eXBlPVwiZmlsZVwiIG5hbWU9XCJpbWdcIiBzdHlsZT1cImRpc3BsYXk6bm9uZVwiPjwvaW5wdXQ+JylcclxuICAgIHZhciBjbGVhckF2YXJ0YUJ0biA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtbGlnaHQtZ3JheSB3My1ob3Zlci1waW5rIHczLWJvcmRlci1yaWdodFwiPkNsZWFyIEF2YXJ0YTwvYnV0dG9uPicpXHJcbiAgICB0aGlzLm1vZGVsQnV0dG9uQmFyLmFwcGVuZChkZWxCdG4saW1wb3J0UGljQnRuLGFjdHVhbEltcG9ydFBpY0J0bixjbGVhckF2YXJ0YUJ0bilcclxuXHJcbiAgICBpbXBvcnRQaWNCdG4ub24oXCJjbGlja1wiLCAoKT0+e1xyXG4gICAgICAgIGFjdHVhbEltcG9ydFBpY0J0bi50cmlnZ2VyKCdjbGljaycpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgYWN0dWFsSW1wb3J0UGljQnRuLmNoYW5nZShhc3luYyAoZXZ0KT0+e1xyXG4gICAgICAgIHZhciBmaWxlcyA9IGV2dC50YXJnZXQuZmlsZXM7IC8vIEZpbGVMaXN0IG9iamVjdFxyXG4gICAgICAgIHZhciB0aGVGaWxlPWZpbGVzWzBdXHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYodGhlRmlsZS50eXBlPT1cImltYWdlL3N2Zyt4bWxcIil7XHJcbiAgICAgICAgICAgIHZhciBzdHI9IGF3YWl0IHRoaXMucmVhZE9uZUZpbGUodGhlRmlsZSlcclxuICAgICAgICAgICAgdmFyIGRhdGFVcmw9J2RhdGE6aW1hZ2Uvc3ZnK3htbDt1dGY4LCcgKyBlbmNvZGVVUklDb21wb25lbnQoc3RyKTtcclxuICAgICAgICB9ZWxzZSBpZih0aGVGaWxlLnR5cGUubWF0Y2goJ2ltYWdlLionKSl7XHJcbiAgICAgICAgICAgIHZhciBkYXRhVXJsPSBhd2FpdCB0aGlzLnJlc2l6ZUltZ0ZpbGUodGhlRmlsZSw3MClcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB2YXIgY29uZmlybURpYWxvZ0Rpdj1uZXcgc2ltcGxlQ29uZmlybURpYWxvZygpXHJcbiAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuc2hvdyh7IHdpZHRoOiBcIjIwMHB4XCIgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogXCJOb3RlXCJcclxuICAgICAgICAgICAgICAgICAgICAsIGNvbnRlbnQ6IFwiUGxlYXNlIGltcG9ydCBpbWFnZSBmaWxlIChwbmcsanBnLHN2ZyBhbmQgc28gb24pXCJcclxuICAgICAgICAgICAgICAgICAgICAsIGJ1dHRvbnM6IFt7Y29sb3JDbGFzczpcInczLWdyYXlcIix0ZXh0OlwiT2tcIixcImNsaWNrRnVuY1wiOigpPT57Y29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpfX1dXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIClcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYodGhpcy5hdmFydGFJbWcpIHRoaXMuYXZhcnRhSW1nLmF0dHIoXCJzcmNcIixkYXRhVXJsKVxyXG4gICAgICAgIHZhciB2aXN1YWxKc29uPWdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bZ2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFRdXHJcbiAgICAgICAgaWYoIXZpc3VhbEpzb25bbW9kZWxJRF0pIHZpc3VhbEpzb25bbW9kZWxJRF09e31cclxuICAgICAgICB2aXN1YWxKc29uW21vZGVsSURdLmF2YXJ0YT1kYXRhVXJsXHJcbiAgICAgICAgdGhpcy5zYXZlVmlzdWFsRGVmaW5pdGlvbigpXHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwidmlzdWFsRGVmaW5pdGlvbkNoYW5nZVwiLCBcIm1vZGVsSURcIjptb2RlbElELFwiYXZhcnRhXCI6ZGF0YVVybCB9KVxyXG4gICAgICAgIHRoaXMucmVmcmVzaE1vZGVsVHJlZUxhYmVsKClcclxuICAgICAgICBhY3R1YWxJbXBvcnRQaWNCdG4udmFsKFwiXCIpXHJcbiAgICB9KVxyXG5cclxuICAgIGNsZWFyQXZhcnRhQnRuLm9uKFwiY2xpY2tcIiwgKCk9PntcclxuICAgICAgICB2YXIgdmlzdWFsSnNvbj1nbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW2dsb2JhbENhY2hlLnNlbGVjdGVkQURUXVxyXG4gICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF0pIGRlbGV0ZSB2aXN1YWxKc29uW21vZGVsSURdLmF2YXJ0YSBcclxuICAgICAgICBpZih0aGlzLmF2YXJ0YUltZykgdGhpcy5hdmFydGFJbWcucmVtb3ZlQXR0cignc3JjJyk7XHJcbiAgICAgICAgdGhpcy5zYXZlVmlzdWFsRGVmaW5pdGlvbigpXHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwidmlzdWFsRGVmaW5pdGlvbkNoYW5nZVwiLCBcIm1vZGVsSURcIjptb2RlbElELFwibm9BdmFydGFcIjp0cnVlIH0pXHJcbiAgICAgICAgdGhpcy5yZWZyZXNoTW9kZWxUcmVlTGFiZWwoKVxyXG4gICAgfSk7XHJcblxyXG5cclxuICAgIGRlbEJ0bi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICB2YXIgcmVsYXRlZE1vZGVsSURzID1tb2RlbEFuYWx5emVyLmxpc3RNb2RlbHNGb3JEZWxldGVNb2RlbChtb2RlbElEKVxyXG4gICAgICAgIHZhciBkaWFsb2dTdHI9KHJlbGF0ZWRNb2RlbElEcy5sZW5ndGg9PTApPyAoXCJUaGlzIHdpbGwgREVMRVRFIG1vZGVsIFxcXCJcIiArIG1vZGVsSUQgKyBcIlxcXCJcIik6IFxyXG4gICAgICAgICAgICAobW9kZWxJRCArIFwiIGlzIGJhc2UgbW9kZWwgb2YgXCIrcmVsYXRlZE1vZGVsSURzLmpvaW4oXCIsIFwiKStcIi4gRGVsZXRlIGFsbCBvZiB0aGVtP1wiKVxyXG4gICAgICAgIHZhciBjb25maXJtRGlhbG9nRGl2ID0gbmV3IHNpbXBsZUNvbmZpcm1EaWFsb2coKVxyXG4gICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuc2hvdyhcclxuICAgICAgICAgICAgeyB3aWR0aDogXCIzNTBweFwiIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHRpdGxlOiBcIldhcm5pbmdcIlxyXG4gICAgICAgICAgICAgICAgLCBjb250ZW50OiBkaWFsb2dTdHJcclxuICAgICAgICAgICAgICAgICwgYnV0dG9uczogW1xyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1yZWQgdzMtaG92ZXItcGlua1wiLCB0ZXh0OiBcIkNvbmZpcm1cIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jb25maXJtRGVsZXRlTW9kZWwobW9kZWxJRClcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvckNsYXNzOiBcInczLWdyYXlcIiwgdGV4dDogXCJDYW5jZWxcIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICApXHJcbiAgICAgICAgXHJcbiAgICB9KVxyXG4gICAgXHJcbiAgICB2YXIgVmlzdWFsaXphdGlvbkRPTT10aGlzLmFkZEFQYXJ0SW5SaWdodFNwYW4oXCJWaXN1YWxpemF0aW9uXCIpXHJcbiAgICB2YXIgZWRpdGFibGVQcm9wZXJ0aWVzRE9NPXRoaXMuYWRkQVBhcnRJblJpZ2h0U3BhbihcIkVkaXRhYmxlIFByb3BlcnRpZXMgQW5kIFJlbGF0aW9uc2hpcHNcIilcclxuICAgIHZhciBiYXNlQ2xhc3Nlc0RPTT10aGlzLmFkZEFQYXJ0SW5SaWdodFNwYW4oXCJCYXNlIENsYXNzZXNcIilcclxuICAgIHZhciBvcmlnaW5hbERlZmluaXRpb25ET009dGhpcy5hZGRBUGFydEluUmlnaHRTcGFuKFwiT3JpZ2luYWwgRGVmaW5pdGlvblwiKVxyXG5cclxuICAgIHZhciBzdHI9SlNPTi5zdHJpbmdpZnkodGhpcy5tb2RlbHNbbW9kZWxOYW1lXSxudWxsLDIpXHJcbiAgICBvcmlnaW5hbERlZmluaXRpb25ET00uYXBwZW5kKCQoJzxwcmUgaWQ9XCJqc29uXCI+JytzdHIrJzwvcHJlPicpKVxyXG5cclxuICAgIHZhciBlZGl0dGFibGVQcm9wZXJ0aWVzPW1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXS5lZGl0YWJsZVByb3BlcnRpZXNcclxuICAgIHRoaXMuZmlsbEVkaXRhYmxlUHJvcGVydGllcyhlZGl0dGFibGVQcm9wZXJ0aWVzLGVkaXRhYmxlUHJvcGVydGllc0RPTSlcclxuICAgIHZhciB2YWxpZFJlbGF0aW9uc2hpcHM9bW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdLnZhbGlkUmVsYXRpb25zaGlwc1xyXG4gICAgdGhpcy5maWxsUmVsYXRpb25zaGlwSW5mbyh2YWxpZFJlbGF0aW9uc2hpcHMsZWRpdGFibGVQcm9wZXJ0aWVzRE9NKVxyXG5cclxuICAgIHRoaXMuZmlsbFZpc3VhbGl6YXRpb24obW9kZWxJRCxWaXN1YWxpemF0aW9uRE9NKVxyXG5cclxuICAgIHRoaXMuZmlsbEJhc2VDbGFzc2VzKG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXS5hbGxCYXNlQ2xhc3NlcyxiYXNlQ2xhc3Nlc0RPTSkgXHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuY29uZmlybURlbGV0ZU1vZGVsPWZ1bmN0aW9uKG1vZGVsSUQpe1xyXG4gICAgdmFyIGZ1bmNBZnRlckVhY2hTdWNjZXNzRGVsZXRlID0gKGVhY2hEZWxldGVkTW9kZWxJRCxlYWNoTW9kZWxOYW1lKSA9PiB7XHJcbiAgICAgICAgZGVsZXRlIHRoaXMubW9kZWxzW2VhY2hNb2RlbE5hbWVdXHJcbiAgICAgICAgdGhpcy50cmVlLmRlbGV0ZUxlYWZOb2RlKGVhY2hNb2RlbE5hbWUpXHJcbiAgICAgICAgaWYgKGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bZ2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFRdICYmIGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bZ2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFRdW2VhY2hEZWxldGVkTW9kZWxJRF0pIHtcclxuICAgICAgICAgICAgZGVsZXRlIGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bZ2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFRdW2VhY2hEZWxldGVkTW9kZWxJRF1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB2YXIgY29tcGxldGVGdW5jPSgpPT57IFxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcIkFEVE1vZGVsc0NoYW5nZVwiLCBcIm1vZGVsc1wiOnRoaXMubW9kZWxzfSlcclxuICAgICAgICB0aGlzLnBhbmVsQ2FyZC5lbXB0eSgpXHJcbiAgICAgICAgdGhpcy5zYXZlVmlzdWFsRGVmaW5pdGlvbigpXHJcbiAgICB9XHJcblxyXG4gICAgLy9ldmVuIG5vdCBjb21wbGV0ZWx5IHN1Y2Nlc3NmdWwgZGVsZXRpbmcsIGl0IHdpbGwgc3RpbGwgaW52b2tlIGNvbXBsZXRlRnVuY1xyXG4gICAgbW9kZWxBbmFseXplci5kZWxldGVNb2RlbChtb2RlbElELGZ1bmNBZnRlckVhY2hTdWNjZXNzRGVsZXRlLGNvbXBsZXRlRnVuYyxjb21wbGV0ZUZ1bmMpXHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUucmVmcmVzaE1vZGVsVHJlZUxhYmVsPWZ1bmN0aW9uKCl7XHJcbiAgICBpZih0aGlzLnRyZWUuc2VsZWN0ZWROb2Rlcy5sZW5ndGg+MCkgdGhpcy50cmVlLnNlbGVjdGVkTm9kZXNbMF0ucmVkcmF3TGFiZWwoKVxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLmZpbGxCYXNlQ2xhc3Nlcz1mdW5jdGlvbihiYXNlQ2xhc3NlcyxwYXJlbnREb20pe1xyXG4gICAgZm9yKHZhciBpbmQgaW4gYmFzZUNsYXNzZXMpe1xyXG4gICAgICAgIHZhciBrZXlEaXY9ICQoXCI8bGFiZWwgc3R5bGU9J2Rpc3BsYXk6YmxvY2s7cGFkZGluZzouMWVtJz5cIitpbmQrXCI8L2xhYmVsPlwiKVxyXG4gICAgICAgIHBhcmVudERvbS5hcHBlbmQoa2V5RGl2KVxyXG4gICAgfVxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLmZpbGxWaXN1YWxpemF0aW9uPWZ1bmN0aW9uKG1vZGVsSUQscGFyZW50RG9tKXtcclxuICAgIHZhciBtb2RlbEpzb249bW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsSURdO1xyXG4gICAgdmFyIGFUYWJsZT0kKFwiPHRhYmxlIHN0eWxlPSd3aWR0aDoxMDAlJz48L3RhYmxlPlwiKVxyXG4gICAgYVRhYmxlLmh0bWwoJzx0cj48dGQ+PC90ZD48dGQ+PC90ZD48L3RyPicpXHJcbiAgICBwYXJlbnREb20uYXBwZW5kKGFUYWJsZSkgXHJcblxyXG4gICAgdmFyIGxlZnRQYXJ0PWFUYWJsZS5maW5kKFwidGQ6Zmlyc3RcIilcclxuICAgIHZhciByaWdodFBhcnQ9YVRhYmxlLmZpbmQoXCJ0ZDpudGgtY2hpbGQoMilcIilcclxuICAgIHJpZ2h0UGFydC5jc3Moe1wid2lkdGhcIjpcIjUwcHhcIixcImhlaWdodFwiOlwiNTBweFwiLFwiYm9yZGVyXCI6XCJzb2xpZCAxcHggbGlnaHRHcmF5XCJ9KVxyXG4gICAgXHJcbiAgICB2YXIgYXZhcnRhSW1nPSQoXCI8aW1nIHN0eWxlPSdoZWlnaHQ6NDVweCc+PC9pbWc+XCIpXHJcbiAgICByaWdodFBhcnQuYXBwZW5kKGF2YXJ0YUltZylcclxuICAgIHZhciB2aXN1YWxKc29uPWdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bZ2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFRdXHJcbiAgICBpZih2aXN1YWxKc29uICYmIHZpc3VhbEpzb25bbW9kZWxJRF0gJiYgdmlzdWFsSnNvblttb2RlbElEXS5hdmFydGEpIGF2YXJ0YUltZy5hdHRyKCdzcmMnLHZpc3VhbEpzb25bbW9kZWxJRF0uYXZhcnRhKVxyXG4gICAgdGhpcy5hdmFydGFJbWc9YXZhcnRhSW1nO1xyXG5cclxuICAgIFxyXG4gICAgdGhpcy5hZGRPbmVWaXN1YWxpemF0aW9uUm93KG1vZGVsSUQsbGVmdFBhcnQpXHJcbiAgICBmb3IodmFyIGluZCBpbiBtb2RlbEpzb24udmFsaWRSZWxhdGlvbnNoaXBzKXtcclxuICAgICAgICB0aGlzLmFkZE9uZVZpc3VhbGl6YXRpb25Sb3cobW9kZWxJRCxsZWZ0UGFydCxpbmQpXHJcbiAgICB9XHJcbn1cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5hZGRPbmVWaXN1YWxpemF0aW9uUm93PWZ1bmN0aW9uKG1vZGVsSUQscGFyZW50RG9tLHJlbGF0aW5zaGlwTmFtZSl7XHJcbiAgICBpZihyZWxhdGluc2hpcE5hbWU9PW51bGwpIHZhciBuYW1lU3RyPVwi4pevXCIgLy92aXN1YWwgZm9yIG5vZGVcclxuICAgIGVsc2UgbmFtZVN0cj1cIuKfnCBcIityZWxhdGluc2hpcE5hbWVcclxuICAgIHZhciBjb250YWluZXJEaXY9JChcIjxkaXYgc3R5bGU9J3BhZGRpbmctYm90dG9tOjhweCc+PC9kaXY+XCIpXHJcbiAgICBwYXJlbnREb20uYXBwZW5kKGNvbnRhaW5lckRpdilcclxuICAgIHZhciBjb250ZW50RE9NPSQoXCI8bGFiZWwgc3R5bGU9J21hcmdpbi1yaWdodDoxMHB4Jz5cIituYW1lU3RyK1wiPC9sYWJlbD5cIilcclxuICAgIGNvbnRhaW5lckRpdi5hcHBlbmQoY29udGVudERPTSlcclxuXHJcbiAgICB2YXIgZGVmaW5lZENvbG9yPW51bGxcclxuICAgIHZhciBkZWZpbmVkU2hhcGU9bnVsbFxyXG4gICAgdmFyIGRlZmluZWREaW1lbnNpb25SYXRpbz1udWxsXHJcbiAgICB2YXIgZGVmaW5lZEVkZ2VXaWR0aD1udWxsXHJcbiAgICB2YXIgdmlzdWFsSnNvbj1nbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW2dsb2JhbENhY2hlLnNlbGVjdGVkQURUXVxyXG4gICAgaWYocmVsYXRpbnNoaXBOYW1lPT1udWxsKXtcclxuICAgICAgICBpZih2aXN1YWxKc29uICYmIHZpc3VhbEpzb25bbW9kZWxJRF0gJiYgdmlzdWFsSnNvblttb2RlbElEXS5jb2xvcikgZGVmaW5lZENvbG9yPXZpc3VhbEpzb25bbW9kZWxJRF0uY29sb3JcclxuICAgICAgICBpZih2aXN1YWxKc29uICYmIHZpc3VhbEpzb25bbW9kZWxJRF0gJiYgdmlzdWFsSnNvblttb2RlbElEXS5zaGFwZSkgZGVmaW5lZFNoYXBlPXZpc3VhbEpzb25bbW9kZWxJRF0uc2hhcGVcclxuICAgICAgICBpZih2aXN1YWxKc29uICYmIHZpc3VhbEpzb25bbW9kZWxJRF0gJiYgdmlzdWFsSnNvblttb2RlbElEXS5kaW1lbnNpb25SYXRpbykgZGVmaW5lZERpbWVuc2lvblJhdGlvPXZpc3VhbEpzb25bbW9kZWxJRF0uZGltZW5zaW9uUmF0aW9cclxuICAgIH1lbHNle1xyXG4gICAgICAgIGlmKHZpc3VhbEpzb24gJiYgdmlzdWFsSnNvblttb2RlbElEXVxyXG4gICAgICAgICAgICAgJiYgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1cclxuICAgICAgICAgICAgICAmJiB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdKXtcclxuICAgICAgICAgICAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXS5jb2xvcikgZGVmaW5lZENvbG9yPXZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0uY29sb3JcclxuICAgICAgICAgICAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXS5zaGFwZSkgZGVmaW5lZFNoYXBlPXZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0uc2hhcGVcclxuICAgICAgICAgICAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXS5lZGdlV2lkdGgpIGRlZmluZWRFZGdlV2lkdGg9dmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXS5lZGdlV2lkdGhcclxuICAgICAgICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGNvbG9yU2VsZWN0b3I9JCgnPHNlbGVjdCBjbGFzcz1cInczLWJvcmRlclwiIHN0eWxlPVwib3V0bGluZTpub25lO3dpZHRoOjg1cHhcIj48L3NlbGVjdD4nKVxyXG4gICAgY29udGFpbmVyRGl2LmFwcGVuZChjb2xvclNlbGVjdG9yKVxyXG4gICAgdmFyIGNvbG9yQXJyPVtcImRhcmtHcmF5XCIsXCJCbGFja1wiLFwiTGlnaHRHcmF5XCIsXCJSZWRcIixcIkdyZWVuXCIsXCJCbHVlXCIsXCJCaXNxdWVcIixcIkJyb3duXCIsXCJDb3JhbFwiLFwiQ3JpbXNvblwiLFwiRG9kZ2VyQmx1ZVwiLFwiR29sZFwiXVxyXG4gICAgY29sb3JBcnIuZm9yRWFjaCgob25lQ29sb3JDb2RlKT0+e1xyXG4gICAgICAgIHZhciBhbk9wdGlvbj0kKFwiPG9wdGlvbiB2YWx1ZT0nXCIrb25lQ29sb3JDb2RlK1wiJz5cIitvbmVDb2xvckNvZGUrXCLilqc8L29wdGlvbj5cIilcclxuICAgICAgICBjb2xvclNlbGVjdG9yLmFwcGVuZChhbk9wdGlvbilcclxuICAgICAgICBhbk9wdGlvbi5jc3MoXCJjb2xvclwiLG9uZUNvbG9yQ29kZSlcclxuICAgIH0pXHJcbiAgICBpZihkZWZpbmVkQ29sb3IhPW51bGwpIHtcclxuICAgICAgICBjb2xvclNlbGVjdG9yLnZhbChkZWZpbmVkQ29sb3IpXHJcbiAgICAgICAgY29sb3JTZWxlY3Rvci5jc3MoXCJjb2xvclwiLGRlZmluZWRDb2xvcilcclxuICAgIH1lbHNle1xyXG4gICAgICAgIGNvbG9yU2VsZWN0b3IuY3NzKFwiY29sb3JcIixcImRhcmtHcmF5XCIpXHJcbiAgICB9XHJcbiAgICBjb2xvclNlbGVjdG9yLmNoYW5nZSgoZXZlKT0+e1xyXG4gICAgICAgIHZhciBzZWxlY3RDb2xvckNvZGU9ZXZlLnRhcmdldC52YWx1ZVxyXG4gICAgICAgIGNvbG9yU2VsZWN0b3IuY3NzKFwiY29sb3JcIiwgc2VsZWN0Q29sb3JDb2RlKVxyXG4gICAgICAgIGlmICghZ2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVF0pXHJcbiAgICAgICAgICAgIGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bZ2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFRdID0ge31cclxuICAgICAgICB2YXIgdmlzdWFsSnNvbiA9IGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bZ2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFRdXHJcblxyXG4gICAgICAgIGlmKCF2aXN1YWxKc29uW21vZGVsSURdKSB2aXN1YWxKc29uW21vZGVsSURdPXt9XHJcbiAgICAgICAgaWYoIXJlbGF0aW5zaGlwTmFtZSkge1xyXG4gICAgICAgICAgICB2aXN1YWxKc29uW21vZGVsSURdLmNvbG9yPXNlbGVjdENvbG9yQ29kZVxyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJ2aXN1YWxEZWZpbml0aW9uQ2hhbmdlXCIsIFwibW9kZWxJRFwiOm1vZGVsSUQsXCJjb2xvclwiOnNlbGVjdENvbG9yQ29kZSB9KVxyXG4gICAgICAgICAgICB0aGlzLnJlZnJlc2hNb2RlbFRyZWVMYWJlbCgpXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIGlmKCF2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXSkgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl09e31cclxuICAgICAgICAgICAgaWYoIXZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0pIHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV09e31cclxuICAgICAgICAgICAgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXS5jb2xvcj1zZWxlY3RDb2xvckNvZGVcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwidmlzdWFsRGVmaW5pdGlvbkNoYW5nZVwiLCBcInNyY01vZGVsSURcIjptb2RlbElELFwicmVsYXRpb25zaGlwTmFtZVwiOnJlbGF0aW5zaGlwTmFtZSxcImNvbG9yXCI6c2VsZWN0Q29sb3JDb2RlIH0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuc2F2ZVZpc3VhbERlZmluaXRpb24oKVxyXG4gICAgfSlcclxuXHJcbiAgICB2YXIgc2hhcGVTZWxlY3RvciA9ICQoJzxzZWxlY3QgY2xhc3M9XCJ3My1ib3JkZXJcIiBzdHlsZT1cIm91dGxpbmU6bm9uZVwiPjwvc2VsZWN0PicpXHJcbiAgICBjb250YWluZXJEaXYuYXBwZW5kKHNoYXBlU2VsZWN0b3IpXHJcbiAgICBpZihyZWxhdGluc2hpcE5hbWU9PW51bGwpe1xyXG4gICAgICAgIHNoYXBlU2VsZWN0b3IuYXBwZW5kKCQoXCI8b3B0aW9uIHZhbHVlPSdlbGxpcHNlJz7il688L29wdGlvbj5cIikpXHJcbiAgICAgICAgc2hhcGVTZWxlY3Rvci5hcHBlbmQoJChcIjxvcHRpb24gdmFsdWU9J3JvdW5kLXJlY3RhbmdsZScgc3R5bGU9J2ZvbnQtc2l6ZToxMjAlJz7ilqI8L29wdGlvbj5cIikpXHJcbiAgICAgICAgc2hhcGVTZWxlY3Rvci5hcHBlbmQoJChcIjxvcHRpb24gdmFsdWU9J2hleGFnb24nIHN0eWxlPSdmb250LXNpemU6MTMwJSc+4qyhPC9vcHRpb24+XCIpKVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgc2hhcGVTZWxlY3Rvci5hcHBlbmQoJChcIjxvcHRpb24gdmFsdWU9J3NvbGlkJz7ihpI8L29wdGlvbj5cIikpXHJcbiAgICAgICAgc2hhcGVTZWxlY3Rvci5hcHBlbmQoJChcIjxvcHRpb24gdmFsdWU9J2RvdHRlZCc+4oeiPC9vcHRpb24+XCIpKVxyXG4gICAgfVxyXG4gICAgaWYoZGVmaW5lZFNoYXBlIT1udWxsKSBzaGFwZVNlbGVjdG9yLnZhbChkZWZpbmVkU2hhcGUpXHJcbiAgICBcclxuICAgIHNoYXBlU2VsZWN0b3IuY2hhbmdlKChldmUpPT57XHJcbiAgICAgICAgdmFyIHNlbGVjdFNoYXBlPWV2ZS50YXJnZXQudmFsdWVcclxuICAgICAgICBpZiAoIWdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bZ2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFRdKVxyXG4gICAgICAgICAgICBnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW2dsb2JhbENhY2hlLnNlbGVjdGVkQURUXSA9IHt9XHJcbiAgICAgICAgdmFyIHZpc3VhbEpzb24gPSBnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW2dsb2JhbENhY2hlLnNlbGVjdGVkQURUXVxyXG5cclxuICAgICAgICBpZighdmlzdWFsSnNvblttb2RlbElEXSkgdmlzdWFsSnNvblttb2RlbElEXT17fVxyXG4gICAgICAgIGlmKCFyZWxhdGluc2hpcE5hbWUpIHtcclxuICAgICAgICAgICAgdmlzdWFsSnNvblttb2RlbElEXS5zaGFwZT1zZWxlY3RTaGFwZVxyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJ2aXN1YWxEZWZpbml0aW9uQ2hhbmdlXCIsIFwibW9kZWxJRFwiOm1vZGVsSUQsXCJzaGFwZVwiOnNlbGVjdFNoYXBlIH0pXHJcbiAgICAgICAgICAgIHRoaXMucmVmcmVzaE1vZGVsVHJlZUxhYmVsKClcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgaWYoIXZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdKSB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXT17fVxyXG4gICAgICAgICAgICBpZighdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXSkgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXT17fVxyXG4gICAgICAgICAgICB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdLnNoYXBlPXNlbGVjdFNoYXBlXHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIiwgXCJzcmNNb2RlbElEXCI6bW9kZWxJRCxcInJlbGF0aW9uc2hpcE5hbWVcIjpyZWxhdGluc2hpcE5hbWUsXCJzaGFwZVwiOnNlbGVjdFNoYXBlIH0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuc2F2ZVZpc3VhbERlZmluaXRpb24oKVxyXG4gICAgfSlcclxuXHJcblxyXG4gICAgdmFyIHNpemVBZGp1c3RTZWxlY3RvciA9ICQoJzxzZWxlY3QgY2xhc3M9XCJ3My1ib3JkZXJcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTt3aWR0aDoxMTBweFwiPjwvc2VsZWN0PicpXHJcbiAgICBpZihyZWxhdGluc2hpcE5hbWU9PW51bGwpe1xyXG4gICAgICAgIGZvcih2YXIgZj0wLjI7ZjwyO2YrPTAuMil7XHJcbiAgICAgICAgICAgIHZhciB2YWw9Zi50b0ZpeGVkKDEpK1wiXCJcclxuICAgICAgICAgICAgc2l6ZUFkanVzdFNlbGVjdG9yLmFwcGVuZCgkKFwiPG9wdGlvbiB2YWx1ZT1cIit2YWwrXCI+ZGltZW5zaW9uKlwiK3ZhbCtcIjwvb3B0aW9uPlwiKSlcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoZGVmaW5lZERpbWVuc2lvblJhdGlvIT1udWxsKSBzaXplQWRqdXN0U2VsZWN0b3IudmFsKGRlZmluZWREaW1lbnNpb25SYXRpbylcclxuICAgICAgICBlbHNlIHNpemVBZGp1c3RTZWxlY3Rvci52YWwoXCIxLjBcIilcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHNpemVBZGp1c3RTZWxlY3Rvci5jc3MoXCJ3aWR0aFwiLFwiODBweFwiKVxyXG4gICAgICAgIGZvcih2YXIgZj0wLjU7Zjw9NDtmKz0wLjUpe1xyXG4gICAgICAgICAgICB2YXIgdmFsPWYudG9GaXhlZCgxKStcIlwiXHJcbiAgICAgICAgICAgIHNpemVBZGp1c3RTZWxlY3Rvci5hcHBlbmQoJChcIjxvcHRpb24gdmFsdWU9XCIrdmFsK1wiPndpZHRoICpcIit2YWwrXCI8L29wdGlvbj5cIikpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKGRlZmluZWRFZGdlV2lkdGghPW51bGwpIHNpemVBZGp1c3RTZWxlY3Rvci52YWwoZGVmaW5lZEVkZ2VXaWR0aClcclxuICAgICAgICBlbHNlIHNpemVBZGp1c3RTZWxlY3Rvci52YWwoXCIyLjBcIilcclxuICAgIH1cclxuICAgIGNvbnRhaW5lckRpdi5hcHBlbmQoc2l6ZUFkanVzdFNlbGVjdG9yKVxyXG5cclxuICAgIFxyXG4gICAgc2l6ZUFkanVzdFNlbGVjdG9yLmNoYW5nZSgoZXZlKT0+e1xyXG4gICAgICAgIHZhciBjaG9vc2VWYWw9ZXZlLnRhcmdldC52YWx1ZVxyXG4gICAgICAgIGlmICghZ2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVF0pXHJcbiAgICAgICAgICAgIGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bZ2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFRdID0ge31cclxuICAgICAgICB2YXIgdmlzdWFsSnNvbiA9IGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bZ2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFRdXHJcblxyXG4gICAgICAgIGlmKCFyZWxhdGluc2hpcE5hbWUpIHtcclxuICAgICAgICAgICAgaWYoIXZpc3VhbEpzb25bbW9kZWxJRF0pIHZpc3VhbEpzb25bbW9kZWxJRF09e31cclxuICAgICAgICAgICAgdmlzdWFsSnNvblttb2RlbElEXS5kaW1lbnNpb25SYXRpbz1jaG9vc2VWYWxcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwidmlzdWFsRGVmaW5pdGlvbkNoYW5nZVwiLCBcIm1vZGVsSURcIjptb2RlbElELFwiZGltZW5zaW9uUmF0aW9cIjpjaG9vc2VWYWwgfSlcclxuICAgICAgICAgICAgdGhpcy5zYXZlVmlzdWFsRGVmaW5pdGlvbigpXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIGlmKCF2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXSkgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl09e31cclxuICAgICAgICAgICAgaWYoIXZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0pIHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV09e31cclxuICAgICAgICAgICAgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXS5lZGdlV2lkdGg9Y2hvb3NlVmFsXHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIiwgXCJzcmNNb2RlbElEXCI6bW9kZWxJRCxcInJlbGF0aW9uc2hpcE5hbWVcIjpyZWxhdGluc2hpcE5hbWUsXCJlZGdlV2lkdGhcIjpjaG9vc2VWYWwgfSlcclxuICAgICAgICAgICAgdGhpcy5zYXZlVmlzdWFsRGVmaW5pdGlvbigpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5zYXZlVmlzdWFsRGVmaW5pdGlvbj1mdW5jdGlvbigpe1xyXG4gICAgJC5wb3N0KFwidmlzdWFsRGVmaW5pdGlvbi9zYXZlVmlzdWFsRGVmaW5pdGlvblwiLHt2aXN1YWxEZWZpbml0aW9uSnNvbjpnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9ufSlcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5maWxsUmVsYXRpb25zaGlwSW5mbz1mdW5jdGlvbih2YWxpZFJlbGF0aW9uc2hpcHMscGFyZW50RG9tKXtcclxuICAgIGZvcih2YXIgaW5kIGluIHZhbGlkUmVsYXRpb25zaGlwcyl7XHJcbiAgICAgICAgdmFyIGtleURpdj0gJChcIjxsYWJlbCBzdHlsZT0nZGlzcGxheTppbmxpbmU7cGFkZGluZzouMWVtIC4zZW0gLjFlbSAuM2VtO21hcmdpbi1yaWdodDouM2VtJz5cIitpbmQrXCI8L2xhYmVsPlwiKVxyXG4gICAgICAgIHBhcmVudERvbS5hcHBlbmQoa2V5RGl2KVxyXG4gICAgICAgIGtleURpdi5jc3MoXCJwYWRkaW5nLXRvcFwiLFwiLjFlbVwiKVxyXG5cclxuICAgICAgICB2YXIgbGFiZWw9JChcIjxsYWJlbCBjbGFzcz0ndzMtbGltZScgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO2ZvbnQtc2l6ZTo5cHg7cGFkZGluZzoycHgnPjwvbGFiZWw+XCIpXHJcbiAgICAgICAgbGFiZWwudGV4dChcIlJlbGF0aW9uc2hpcFwiKVxyXG4gICAgICAgIHBhcmVudERvbS5hcHBlbmQobGFiZWwpXHJcbiAgICAgICAgaWYodmFsaWRSZWxhdGlvbnNoaXBzW2luZF0udGFyZ2V0KXtcclxuICAgICAgICAgICAgdmFyIGxhYmVsMT0kKFwiPGxhYmVsIGNsYXNzPSd3My1saW1lJyBzdHlsZT0nZGlzcGxheTppbmxpbmU7Zm9udC1zaXplOjlweDtwYWRkaW5nOjJweDttYXJnaW4tbGVmdDoycHgnPjwvbGFiZWw+XCIpXHJcbiAgICAgICAgICAgIGxhYmVsMS50ZXh0KHZhbGlkUmVsYXRpb25zaGlwc1tpbmRdLnRhcmdldClcclxuICAgICAgICAgICAgcGFyZW50RG9tLmFwcGVuZChsYWJlbDEpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBcclxuICAgICAgICB2YXIgY29udGVudERPTT0kKFwiPGxhYmVsPjwvbGFiZWw+XCIpXHJcbiAgICAgICAgY29udGVudERPTS5jc3MoXCJkaXNwbGF5XCIsXCJibG9ja1wiKVxyXG4gICAgICAgIGNvbnRlbnRET00uY3NzKFwicGFkZGluZy1sZWZ0XCIsXCIxZW1cIilcclxuICAgICAgICBwYXJlbnREb20uYXBwZW5kKGNvbnRlbnRET00pXHJcbiAgICAgICAgdGhpcy5maWxsRWRpdGFibGVQcm9wZXJ0aWVzKHZhbGlkUmVsYXRpb25zaGlwc1tpbmRdLmVkaXRhYmxlUmVsYXRpb25zaGlwUHJvcGVydGllcywgY29udGVudERPTSlcclxuICAgIH1cclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5maWxsRWRpdGFibGVQcm9wZXJ0aWVzPWZ1bmN0aW9uKGpzb25JbmZvLHBhcmVudERvbSl7XHJcbiAgICBmb3IodmFyIGluZCBpbiBqc29uSW5mbyl7XHJcbiAgICAgICAgdmFyIGtleURpdj0gJChcIjxsYWJlbCBzdHlsZT0nZGlzcGxheTpibG9jayc+PGxhYmVsIHN0eWxlPSdkaXNwbGF5OmlubGluZTtwYWRkaW5nOi4xZW0gLjNlbSAuMWVtIC4zZW07bWFyZ2luLXJpZ2h0Oi4zZW0nPlwiK2luZCtcIjwvbGFiZWw+PC9sYWJlbD5cIilcclxuICAgICAgICBwYXJlbnREb20uYXBwZW5kKGtleURpdilcclxuICAgICAgICBrZXlEaXYuY3NzKFwicGFkZGluZy10b3BcIixcIi4xZW1cIilcclxuXHJcbiAgICAgICAgaWYoQXJyYXkuaXNBcnJheShqc29uSW5mb1tpbmRdKSl7XHJcbiAgICAgICAgICAgIHZhciBjb250ZW50RE9NPSQoXCI8bGFiZWwgY2xhc3M9J3czLWRhcmstZ3JheScgPjwvbGFiZWw+XCIpXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00udGV4dChcImVudW1cIilcclxuICAgICAgICAgICAgY29udGVudERPTS5jc3Moe1wiZm9udFNpemVcIjpcIjlweFwiLFwicGFkZGluZ1wiOicycHgnfSlcclxuICAgICAgICAgICAga2V5RGl2LmFwcGVuZChjb250ZW50RE9NKVxyXG5cclxuICAgICAgICAgICAgdmFyIHZhbHVlQXJyPVtdXHJcbiAgICAgICAgICAgIGpzb25JbmZvW2luZF0uZm9yRWFjaChlbGU9Pnt2YWx1ZUFyci5wdXNoKGVsZS5lbnVtVmFsdWUpfSlcclxuICAgICAgICAgICAgdmFyIGxhYmVsMT0kKFwiPGxhYmVsIGNsYXNzPSd3My1kYXJrLWdyYXknID48L2xhYmVsPlwiKVxyXG4gICAgICAgICAgICBsYWJlbDEuY3NzKHtcImZvbnRTaXplXCI6XCI5cHhcIixcInBhZGRpbmdcIjonMnB4JyxcIm1hcmdpbi1sZWZ0XCI6XCIycHhcIn0pXHJcbiAgICAgICAgICAgIGxhYmVsMS50ZXh0KHZhbHVlQXJyLmpvaW4oKSlcclxuICAgICAgICAgICAga2V5RGl2LmFwcGVuZChsYWJlbDEpXHJcbiAgICAgICAgfWVsc2UgaWYodHlwZW9mKGpzb25JbmZvW2luZF0pPT09XCJvYmplY3RcIikge1xyXG4gICAgICAgICAgICB2YXIgY29udGVudERPTT0kKFwiPGxhYmVsPjwvbGFiZWw+XCIpXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwiZGlzcGxheVwiLFwiYmxvY2tcIilcclxuICAgICAgICAgICAgY29udGVudERPTS5jc3MoXCJwYWRkaW5nLWxlZnRcIixcIjFlbVwiKVxyXG4gICAgICAgICAgICB0aGlzLmZpbGxFZGl0YWJsZVByb3BlcnRpZXMoanNvbkluZm9baW5kXSxjb250ZW50RE9NKVxyXG4gICAgICAgICAgICBrZXlEaXYuYXBwZW5kKGNvbnRlbnRET00pXHJcbiAgICAgICAgfWVsc2Uge1xyXG4gICAgICAgICAgICB2YXIgY29udGVudERPTT0kKFwiPGxhYmVsIGNsYXNzPSd3My1kYXJrLWdyYXknID48L2xhYmVsPlwiKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLnRleHQoanNvbkluZm9baW5kXSlcclxuICAgICAgICAgICAgY29udGVudERPTS5jc3Moe1wiZm9udFNpemVcIjpcIjlweFwiLFwicGFkZGluZ1wiOicycHgnfSlcclxuICAgICAgICAgICAga2V5RGl2LmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuYWRkQVBhcnRJblJpZ2h0U3Bhbj1mdW5jdGlvbihwYXJ0TmFtZSl7XHJcbiAgICB2YXIgaGVhZGVyRE9NPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYmxvY2sgdzMtbGlnaHQtZ3JleSB3My1sZWZ0LWFsaWduXCIgc3R5bGU9XCJmb250LXdlaWdodDpib2xkXCI+PC9idXR0b24+JylcclxuICAgIGhlYWRlckRPTS50ZXh0KHBhcnROYW1lKVxyXG4gICAgdmFyIGxpc3RET009JCgnPGRpdiBjbGFzcz1cInczLWNvbnRhaW5lciB3My1oaWRlIHczLWJvcmRlciB3My1zaG93XCIgc3R5bGU9XCJiYWNrZ3JvdW5kLWNvbG9yOndoaXRlXCI+PC9kaXY+JylcclxuICAgIHRoaXMucGFuZWxDYXJkLmFwcGVuZChoZWFkZXJET00sbGlzdERPTSlcclxuXHJcbiAgICBoZWFkZXJET00ub24oXCJjbGlja1wiLChldnQpPT4ge1xyXG4gICAgICAgIGlmKGxpc3RET00uaGFzQ2xhc3MoXCJ3My1zaG93XCIpKSBsaXN0RE9NLnJlbW92ZUNsYXNzKFwidzMtc2hvd1wiKVxyXG4gICAgICAgIGVsc2UgbGlzdERPTS5hZGRDbGFzcyhcInczLXNob3dcIilcclxuIFxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICByZXR1cm4gbGlzdERPTTtcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5yZWFkTW9kZWxGaWxlc0NvbnRlbnRBbmRJbXBvcnQ9YXN5bmMgZnVuY3Rpb24oZmlsZXMpe1xyXG4gICAgLy8gZmlsZXMgaXMgYSBGaWxlTGlzdCBvZiBGaWxlIG9iamVjdHMuIExpc3Qgc29tZSBwcm9wZXJ0aWVzLlxyXG4gICAgdmFyIGZpbGVDb250ZW50QXJyPVtdXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaTwgZmlsZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICB2YXIgZj1maWxlc1tpXVxyXG4gICAgICAgIC8vIE9ubHkgcHJvY2VzcyBqc29uIGZpbGVzLlxyXG4gICAgICAgIGlmIChmLnR5cGUhPVwiYXBwbGljYXRpb24vanNvblwiKSBjb250aW51ZTtcclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgIHZhciBzdHI9IGF3YWl0IHRoaXMucmVhZE9uZUZpbGUoZilcclxuICAgICAgICAgICAgdmFyIG9iaj1KU09OLnBhcnNlKHN0cilcclxuICAgICAgICAgICAgaWYoQXJyYXkuaXNBcnJheShvYmopKSBmaWxlQ29udGVudEFycj1maWxlQ29udGVudEFyci5jb25jYXQob2JqKVxyXG4gICAgICAgICAgICBlbHNlIGZpbGVDb250ZW50QXJyLnB1c2gob2JqKVxyXG4gICAgICAgIH1jYXRjaChlcnIpe1xyXG4gICAgICAgICAgICBhbGVydChlcnIpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgaWYoZmlsZUNvbnRlbnRBcnIubGVuZ3RoPT0wKSByZXR1cm47XHJcbiAgICBcclxuICAgICQucG9zdChcImVkaXRBRFQvaW1wb3J0TW9kZWxzXCIse1wibW9kZWxzXCI6SlNPTi5zdHJpbmdpZnkoZmlsZUNvbnRlbnRBcnIpfSwgKGRhdGEpPT4ge1xyXG4gICAgICAgIGlmIChkYXRhID09IFwiXCIpIHsvL3N1Y2Nlc3NmdWxcclxuICAgICAgICAgICAgdGhpcy5saXN0TW9kZWxzKFwic2hvdWxkQnJvYWRDYXN0XCIpXHJcbiAgICAgICAgfSBlbHNlIHsgLy9lcnJvciBoYXBwZW5zXHJcbiAgICAgICAgICAgIGFsZXJ0KGRhdGEpXHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5yZWFkT25lRmlsZT0gYXN5bmMgZnVuY3Rpb24oYUZpbGUpe1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xyXG4gICAgICAgICAgICByZWFkZXIub25sb2FkID0gKCk9PiB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKHJlYWRlci5yZXN1bHQpXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIHJlYWRlci5yZWFkQXNUZXh0KGFGaWxlKTtcclxuICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIHJlamVjdChlKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1cclxuXHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLmxpc3RNb2RlbHM9ZnVuY3Rpb24oc2hvdWxkQnJvYWRjYXN0KXtcclxuICAgIHRoaXMubW9kZWxMaXN0LmVtcHR5KClcclxuICAgIHRoaXMucGFuZWxDYXJkLmVtcHR5KClcclxuICAgIGZvcih2YXIgaW5kIGluIHRoaXMubW9kZWxzKSBkZWxldGUgdGhpcy5tb2RlbHNbaW5kXVxyXG5cclxuICAgICQuZ2V0KFwicXVlcnlBRFQvbGlzdE1vZGVsc1wiLCAoZGF0YSwgc3RhdHVzKSA9PiB7XHJcbiAgICAgICAgaWYoZGF0YT09XCJcIikgZGF0YT1bXVxyXG4gICAgICAgIGRhdGEuZm9yRWFjaChvbmVJdGVtPT57XHJcbiAgICAgICAgICAgIGlmKG9uZUl0ZW1bXCJkaXNwbGF5TmFtZVwiXT09bnVsbCkgb25lSXRlbVtcImRpc3BsYXlOYW1lXCJdPW9uZUl0ZW1bXCJAaWRcIl1cclxuICAgICAgICAgICAgaWYoJC5pc1BsYWluT2JqZWN0KG9uZUl0ZW1bXCJkaXNwbGF5TmFtZVwiXSkpe1xyXG4gICAgICAgICAgICAgICAgaWYob25lSXRlbVtcImRpc3BsYXlOYW1lXCJdW1wiZW5cIl0pIG9uZUl0ZW1bXCJkaXNwbGF5TmFtZVwiXT1vbmVJdGVtW1wiZGlzcGxheU5hbWVcIl1bXCJlblwiXVxyXG4gICAgICAgICAgICAgICAgZWxzZSBvbmVJdGVtW1wiZGlzcGxheU5hbWVcIl09SlNPTi5zdHJpbmdpZnkob25lSXRlbVtcImRpc3BsYXlOYW1lXCJdKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmKHRoaXMubW9kZWxzW29uZUl0ZW1bXCJkaXNwbGF5TmFtZVwiXV0hPW51bGwpe1xyXG4gICAgICAgICAgICAgICAgLy9yZXBlYXRlZCBtb2RlbCBkaXNwbGF5IG5hbWVcclxuICAgICAgICAgICAgICAgIG9uZUl0ZW1bXCJkaXNwbGF5TmFtZVwiXT1vbmVJdGVtW1wiQGlkXCJdXHJcbiAgICAgICAgICAgIH0gIFxyXG4gICAgICAgICAgICB0aGlzLm1vZGVsc1tvbmVJdGVtW1wiZGlzcGxheU5hbWVcIl1dID0gb25lSXRlbVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgaWYoc2hvdWxkQnJvYWRjYXN0KXtcclxuICAgICAgICAgICAgbW9kZWxBbmFseXplci5jbGVhckFsbE1vZGVscygpO1xyXG4gICAgICAgICAgICBtb2RlbEFuYWx5emVyLmFkZE1vZGVscyhkYXRhKVxyXG4gICAgICAgICAgICBtb2RlbEFuYWx5emVyLmFuYWx5emUoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYoZGF0YS5sZW5ndGg9PTApe1xyXG4gICAgICAgICAgICB2YXIgemVyb01vZGVsSXRlbT0kKCc8bGkgc3R5bGU9XCJmb250LXNpemU6MC45ZW1cIj56ZXJvIG1vZGVsIHJlY29yZC4gUGxlYXNlIGltcG9ydC4uLjwvbGk+JylcclxuICAgICAgICAgICAgdGhpcy5tb2RlbExpc3QuYXBwZW5kKHplcm9Nb2RlbEl0ZW0pXHJcbiAgICAgICAgICAgIHplcm9Nb2RlbEl0ZW0uY3NzKFwiY3Vyc29yXCIsXCJkZWZhdWx0XCIpXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHRoaXMudHJlZT1uZXcgc2ltcGxlVHJlZSh0aGlzLm1vZGVsTGlzdCx7XCJsZWFmTmFtZVByb3BlcnR5XCI6XCJkaXNwbGF5TmFtZVwiLFwibm9NdWx0aXBsZVNlbGVjdEFsbG93ZWRcIjp0cnVlLFwiaGlkZUVtcHR5R3JvdXBcIjp0cnVlfSlcclxuXHJcbiAgICAgICAgICAgIHRoaXMudHJlZS5vcHRpb25zLmxlYWZOb2RlSWNvbkZ1bmM9KGxuKT0+e1xyXG4gICAgICAgICAgICAgICAgdmFyIG1vZGVsQ2xhc3M9bG4ubGVhZkluZm9bXCJAaWRcIl1cclxuICAgICAgICAgICAgICAgIHZhciBjb2xvckNvZGU9XCJkYXJrR3JheVwiXHJcbiAgICAgICAgICAgICAgICB2YXIgc2hhcGU9XCJlbGxpcHNlXCJcclxuICAgICAgICAgICAgICAgIHZhciBhdmFydGEgPSBudWxsXHJcbiAgICAgICAgICAgICAgICB2YXIgZGltZW5zaW9uPTIwO1xyXG4gICAgICAgICAgICAgICAgaWYoZ2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVF0gJiYgZ2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVF1bbW9kZWxDbGFzc10pe1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciB2aXN1YWxKc29uID1nbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW2dsb2JhbENhY2hlLnNlbGVjdGVkQURUXVttb2RlbENsYXNzXVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjb2xvckNvZGU9IHZpc3VhbEpzb24uY29sb3IgfHwgXCJkYXJrR3JheVwiXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNoYXBlPSAgdmlzdWFsSnNvbi5zaGFwZSB8fCBcImVsbGlwc2VcIlxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhdmFydGEgPSB2aXN1YWxKc29uLmF2YXJ0YVxyXG4gICAgICAgICAgICAgICAgICAgIGlmKHZpc3VhbEpzb24uZGltZW5zaW9uUmF0aW8pIGRpbWVuc2lvbio9cGFyc2VGbG9hdCh2aXN1YWxKc29uLmRpbWVuc2lvblJhdGlvKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdmFyIGljb25ET00gPSAkKFwiPGRpdiBzdHlsZT0nd2lkdGg6XCIrZGltZW5zaW9uK1wicHg7aGVpZ2h0OlwiK2RpbWVuc2lvbitcInB4O2Zsb2F0OmxlZnQ7cG9zaXRpb246cmVsYXRpdmUnPjwvZGl2PlwiKVxyXG4gICAgICAgICAgICAgICAgdmFyIGltZ1NyYyA9IGVuY29kZVVSSUNvbXBvbmVudCh0aGlzLnNoYXBlU3ZnKHNoYXBlLCBjb2xvckNvZGUpKVxyXG4gICAgICAgICAgICAgICAgaWNvbkRPTS5hcHBlbmQoJChcIjxpbWcgc3JjPSdkYXRhOmltYWdlL3N2Zyt4bWw7dXRmOCxcIiArIGltZ1NyYyArIFwiJz48L2ltZz5cIikpXHJcbiAgICAgICAgICAgICAgICBpZiAoYXZhcnRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGF2YXJ0YWltZyA9ICQoXCI8aW1nIHN0eWxlPSdwb3NpdGlvbjphYnNvbHV0ZTtsZWZ0OjBweDt3aWR0aDo2MCU7bWFyZ2luOjIwJScgc3JjPSdcIiArIGF2YXJ0YSArIFwiJz48L2ltZz5cIilcclxuICAgICAgICAgICAgICAgICAgICBpY29uRE9NLmFwcGVuZChhdmFydGFpbWcpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaWNvbkRPTVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLnRyZWUuY2FsbGJhY2tfYWZ0ZXJTZWxlY3ROb2Rlcz0obm9kZXNBcnIsbW91c2VDbGlja0RldGFpbCk9PntcclxuICAgICAgICAgICAgICAgIHZhciB0aGVOb2RlPW5vZGVzQXJyWzBdXHJcbiAgICAgICAgICAgICAgICB0aGlzLmZpbGxSaWdodFNwYW4odGhlTm9kZS5sZWFmSW5mb1tcImRpc3BsYXlOYW1lXCJdKVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgZ3JvdXBOYW1lTGlzdD17fVxyXG4gICAgICAgICAgICBmb3IodmFyIG1vZGVsTmFtZSBpbiB0aGlzLm1vZGVscykgIHtcclxuICAgICAgICAgICAgICAgIHZhciBtb2RlbElEPSB0aGlzLm1vZGVsc1ttb2RlbE5hbWVdW1wiQGlkXCJdXHJcbiAgICAgICAgICAgICAgICBncm91cE5hbWVMaXN0W3RoaXMubW9kZWxOYW1lVG9Hcm91cE5hbWUobW9kZWxJRCldPTFcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB2YXIgbW9kZWxncm91cFNvcnRBcnI9T2JqZWN0LmtleXMoZ3JvdXBOYW1lTGlzdClcclxuICAgICAgICAgICAgbW9kZWxncm91cFNvcnRBcnIuc29ydChmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gYS50b0xvd2VyQ2FzZSgpLmxvY2FsZUNvbXBhcmUoYi50b0xvd2VyQ2FzZSgpKSB9KTtcclxuICAgICAgICAgICAgbW9kZWxncm91cFNvcnRBcnIuZm9yRWFjaChvbmVHcm91cE5hbWU9PntcclxuICAgICAgICAgICAgICAgIHZhciBnbj10aGlzLnRyZWUuYWRkR3JvdXBOb2RlKHsgZGlzcGxheU5hbWU6IG9uZUdyb3VwTmFtZSB9KVxyXG4gICAgICAgICAgICAgICAgZ24uZXhwYW5kKClcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIGZvcih2YXIgbW9kZWxOYW1lIGluIHRoaXMubW9kZWxzKXtcclxuICAgICAgICAgICAgICAgIHZhciBtb2RlbElEPSB0aGlzLm1vZGVsc1ttb2RlbE5hbWVdW1wiQGlkXCJdXHJcbiAgICAgICAgICAgICAgICB2YXIgZ249dGhpcy5tb2RlbE5hbWVUb0dyb3VwTmFtZShtb2RlbElEKVxyXG4gICAgICAgICAgICAgICAgdGhpcy50cmVlLmFkZExlYWZub2RlVG9Hcm91cChnbix0aGlzLm1vZGVsc1ttb2RlbE5hbWVdKVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLnRyZWUuc29ydEFsbExlYXZlcygpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmKHNob3VsZEJyb2FkY2FzdCkgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiQURUTW9kZWxzQ2hhbmdlXCIsIFwibW9kZWxzXCI6dGhpcy5tb2RlbHMgfSlcclxuICAgIH0pXHJcblxyXG5cclxuICAgIFxyXG4gICAgLy92YXIgZzEgPSB0aGlzLnRyZWUuYWRkR3JvdXBOb2RlKHtkaXNwbGF5TmFtZTpcInRlc3RcIn0pXHJcbiAgICAvL3RoaXMudHJlZS5hZGRMZWFmbm9kZVRvR3JvdXAoXCJ0ZXN0XCIse1wiZGlzcGxheU5hbWVcIjpcImhhaGFcIn0sXCJza2lwUmVwZWF0XCIpXHJcbiAgICAvL3JldHVybjtcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5zaGFwZVN2Zz1mdW5jdGlvbihzaGFwZSxjb2xvcil7XHJcbiAgICBpZihzaGFwZT09XCJlbGxpcHNlXCIpe1xyXG4gICAgICAgIHJldHVybiAnPHN2ZyB4bWxuczpzdmc9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDEwMCAxMDBcIiBmaWxsPVwibm9uZVwiIHZlcnNpb249XCIxLjFcIiA+PGNpcmNsZSBjeD1cIjUwXCIgY3k9XCI1MFwiIHI9XCI1MFwiICBmaWxsPVwiJytjb2xvcisnXCIvPjwvc3ZnPidcclxuICAgIH1lbHNlIGlmKHNoYXBlPT1cImhleGFnb25cIil7XHJcbiAgICAgICAgcmV0dXJuICc8c3ZnIHhtbG5zOnN2Zz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHZpZXdCb3g9XCIwIDAgMTAwIDEwMFwiIGZpbGw9XCJub25lXCIgdmVyc2lvbj1cIjEuMVwiID48cG9seWdvbiBwb2ludHM9XCI1MCAwLCA5My4zIDI1LCA5My4zIDc1LCA1MCAxMDAsIDYuNyA3NSwgNi43IDI1XCIgIGZpbGw9XCInK2NvbG9yKydcIiAvPjwvc3ZnPidcclxuICAgIH1lbHNlIGlmKHNoYXBlPT1cInJvdW5kLXJlY3RhbmdsZVwiKXtcclxuICAgICAgICByZXR1cm4gJzxzdmcgeG1sbnM6c3ZnPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAxMDAgMTAwXCIgZmlsbD1cIm5vbmVcIiB2ZXJzaW9uPVwiMS4xXCIgPjxyZWN0IHg9XCIxMFwiIHk9XCIxMFwiIHJ4PVwiMTBcIiByeT1cIjEwXCIgd2lkdGg9XCI4MFwiIGhlaWdodD1cIjgwXCIgZmlsbD1cIicrY29sb3IrJ1wiIC8+PC9zdmc+J1xyXG4gICAgfVxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLm1vZGVsTmFtZVRvR3JvdXBOYW1lPWZ1bmN0aW9uKG1vZGVsTmFtZSl7XHJcbiAgICB2YXIgbmFtZVBhcnRzPW1vZGVsTmFtZS5zcGxpdChcIjpcIilcclxuICAgIGlmKG5hbWVQYXJ0cy5sZW5ndGg+PTIpICByZXR1cm4gbmFtZVBhcnRzWzFdXHJcbiAgICBlbHNlIHJldHVybiBcIk90aGVyc1wiXHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUucnhNZXNzYWdlPWZ1bmN0aW9uKG1zZ1BheWxvYWQpe1xyXG4gICAgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cIkFEVE1vZGVsRWRpdGVkXCIpIHRoaXMubGlzdE1vZGVscyhcInNob3VsZEJyb2FkY2FzdFwiKVxyXG59XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgbW9kZWxNYW5hZ2VyRGlhbG9nKCk7IiwiY29uc3QgZ2xvYmFsQ2FjaGU9cmVxdWlyZSgnLi9nbG9iYWxDYWNoZScpXHJcbmZ1bmN0aW9uIHNpbXBsZUNvbmZpcm1EaWFsb2coKXtcclxuICAgIHRoaXMuRE9NID0gJCgnPGRpdiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7YmFja2dyb3VuZC1jb2xvcjp3aGl0ZTtsZWZ0OjUwJTt0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSkgdHJhbnNsYXRlWSgtNTAlKTt6LWluZGV4OjEwMlwiIGNsYXNzPVwidzMtY2FyZC00XCI+PC9kaXY+JylcclxuICAgIGdsb2JhbENhY2hlLm1ha2VET01EcmFnZ2FibGUodGhpcy5ET00pXHJcbiAgICAvL3RoaXMuRE9NLmNzcyhcIm92ZXJmbG93XCIsXCJoaWRkZW5cIilcclxufVxyXG5cclxuc2ltcGxlQ29uZmlybURpYWxvZy5wcm90b3R5cGUuc2hvdz1mdW5jdGlvbihjc3NPcHRpb25zLG90aGVyT3B0aW9ucyl7XHJcbiAgICB0aGlzLkRPTS5jc3MoY3NzT3B0aW9ucylcclxuICAgIHRoaXMuRE9NLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwiaGVpZ2h0OjQwcHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cImZvbnQtc2l6ZToxLjJlbVwiPicgKyBvdGhlck9wdGlvbnMudGl0bGUgKyAnPC9kaXY+PC9kaXY+JykpXHJcbiAgICB2YXIgY2xvc2VCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJpZ2h0XCIgc3R5bGU9XCJmb250LXNpemU6MmVtO3BhZGRpbmctdG9wOjRweFwiPsOXPC9idXR0b24+JylcclxuICAgIHRoaXMuRE9NLmNoaWxkcmVuKCc6Zmlyc3QnKS5hcHBlbmQoY2xvc2VCdXR0b24pXHJcbiAgICBjbG9zZUJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHsgdGhpcy5jbG9zZSgpIH0pXHJcblxyXG4gICAgdmFyIGRpYWxvZ0Rpdj0kKCc8ZGl2IGNsYXNzPVwidzMtY29udGFpbmVyXCIgc3R5bGU9XCJtYXJnaW4tdG9wOjEwcHg7bWFyZ2luLWJvdHRvbToxMHB4XCI+PC9kaXY+JylcclxuICAgIGRpYWxvZ0Rpdi50ZXh0KG90aGVyT3B0aW9ucy5jb250ZW50KVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKGRpYWxvZ0RpdilcclxuICAgIHRoaXMuZGlhbG9nRGl2PWRpYWxvZ0RpdlxyXG5cclxuICAgIHRoaXMuYm90dG9tQmFyPSQoJzxkaXYgY2xhc3M9XCJ3My1iYXJcIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKHRoaXMuYm90dG9tQmFyKVxyXG5cclxuICAgIG90aGVyT3B0aW9ucy5idXR0b25zLmZvckVhY2goYnRuPT57XHJcbiAgICAgICAgdmFyIGFCdXR0b249JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1yaWdodCAnKyhidG4uY29sb3JDbGFzc3x8XCJcIikrJ1wiIHN0eWxlPVwibWFyZ2luLXJpZ2h0OjJweDttYXJnaW4tbGVmdDoycHhcIj4nK2J0bi50ZXh0Kyc8L2J1dHRvbj4nKVxyXG4gICAgICAgIGFCdXR0b24ub24oXCJjbGlja1wiLCgpPT4geyBidG4uY2xpY2tGdW5jKCkgIH0gIClcclxuICAgICAgICB0aGlzLmJvdHRvbUJhci5hcHBlbmQoYUJ1dHRvbikgICAgXHJcbiAgICB9KVxyXG4gICAgJChcImJvZHlcIikuYXBwZW5kKHRoaXMuRE9NKVxyXG59XHJcblxyXG5zaW1wbGVDb25maXJtRGlhbG9nLnByb3RvdHlwZS5jbG9zZT1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5ET00ucmVtb3ZlKClcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBzaW1wbGVDb25maXJtRGlhbG9nOyIsImZ1bmN0aW9uIHNpbXBsZVNlbGVjdE1lbnUoYnV0dG9uTmFtZSxvcHRpb25zKXtcclxuICAgIG9wdGlvbnM9b3B0aW9uc3x8e30gLy97aXNDbGlja2FibGU6MSx3aXRoQm9yZGVyOjEsZm9udFNpemU6XCJcIixjb2xvckNsYXNzOlwiXCIsYnV0dG9uQ1NTOlwiXCJ9XHJcbiAgICBpZihvcHRpb25zLmlzQ2xpY2thYmxlKXtcclxuICAgICAgICB0aGlzLmlzQ2xpY2thYmxlPXRydWVcclxuICAgICAgICB0aGlzLkRPTT0kKCc8ZGl2IGNsYXNzPVwidzMtZHJvcGRvd24tY2xpY2tcIj48L2Rpdj4nKVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgdGhpcy5ET009JCgnPGRpdiBjbGFzcz1cInczLWRyb3Bkb3duLWhvdmVyIFwiPjwvZGl2PicpXHJcbiAgICAgICAgdGhpcy5ET00ub24oXCJtb3VzZW92ZXJcIiwoZSk9PntcclxuICAgICAgICAgICAgdGhpcy5hZGp1c3REcm9wRG93blBvc2l0aW9uKClcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICB0aGlzLmJ1dHRvbj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uXCIgc3R5bGU9XCJvdXRsaW5lOiBub25lO1wiPjxhPicrYnV0dG9uTmFtZSsnPC9hPjxhIHN0eWxlPVwiZm9udC13ZWlnaHQ6Ym9sZDtwYWRkaW5nLWxlZnQ6MnB4XCI+PC9hPjxpIGNsYXNzPVwiZmEgZmEtY2FyZXQtZG93blwiIHN0eWxlPVwicGFkZGluZy1sZWZ0OjNweFwiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgaWYob3B0aW9ucy53aXRoQm9yZGVyKSB0aGlzLmJ1dHRvbi5hZGRDbGFzcyhcInczLWJvcmRlclwiKVxyXG4gICAgaWYob3B0aW9ucy5mb250U2l6ZSkgdGhpcy5ET00uY3NzKFwiZm9udC1zaXplXCIsb3B0aW9ucy5mb250U2l6ZSlcclxuICAgIGlmKG9wdGlvbnMuY29sb3JDbGFzcykgdGhpcy5idXR0b24uYWRkQ2xhc3Mob3B0aW9ucy5jb2xvckNsYXNzKVxyXG4gICAgaWYob3B0aW9ucy53aWR0aCkgdGhpcy5idXR0b24uY3NzKFwid2lkdGhcIixvcHRpb25zLndpZHRoKVxyXG4gICAgaWYob3B0aW9ucy5idXR0b25DU1MpIHRoaXMuYnV0dG9uLmNzcyhvcHRpb25zLmJ1dHRvbkNTUylcclxuICAgIGlmKG9wdGlvbnMuYWRqdXN0UG9zaXRpb25BbmNob3IpIHRoaXMuYWRqdXN0UG9zaXRpb25BbmNob3I9b3B0aW9ucy5hZGp1c3RQb3NpdGlvbkFuY2hvclxyXG5cclxuICAgIHRoaXMub3B0aW9uQ29udGVudERPTT0kKCc8ZGl2IGNsYXNzPVwidzMtZHJvcGRvd24tY29udGVudCB3My1iYXItYmxvY2sgdzMtY2FyZC00XCI+PC9kaXY+JylcclxuICAgIGlmKG9wdGlvbnMub3B0aW9uTGlzdEhlaWdodCkgdGhpcy5vcHRpb25Db250ZW50RE9NLmNzcyh7aGVpZ2h0Om9wdGlvbnMub3B0aW9uTGlzdEhlaWdodCtcInB4XCIsXCJvdmVyZmxvdy15XCI6XCJhdXRvXCIsXCJvdmVyZmxvdy14XCI6XCJ2aXNpYmxlXCJ9KVxyXG4gICAgaWYob3B0aW9ucy5vcHRpb25MaXN0TWFyZ2luVG9wKSB0aGlzLm9wdGlvbkNvbnRlbnRET00uY3NzKHtcIm1hcmdpbi10b3BcIjpvcHRpb25zLm9wdGlvbkxpc3RNYXJnaW5Ub3ArXCJweFwifSlcclxuICAgIGlmKG9wdGlvbnMub3B0aW9uTGlzdE1hcmdpbkxlZnQpIHRoaXMub3B0aW9uQ29udGVudERPTS5jc3Moe1wibWFyZ2luLWxlZnRcIjpvcHRpb25zLm9wdGlvbkxpc3RNYXJnaW5MZWZ0K1wicHhcIn0pXHJcbiAgICBcclxuICAgIHRoaXMuRE9NLmFwcGVuZCh0aGlzLmJ1dHRvbix0aGlzLm9wdGlvbkNvbnRlbnRET00pXHJcbiAgICB0aGlzLmN1clNlbGVjdFZhbD1udWxsO1xyXG5cclxuICAgIGlmKG9wdGlvbnMuaXNDbGlja2FibGUpe1xyXG4gICAgICAgIHRoaXMuYnV0dG9uLm9uKFwiY2xpY2tcIiwoZSk9PntcclxuICAgICAgICAgICAgdGhpcy5hZGp1c3REcm9wRG93blBvc2l0aW9uKClcclxuICAgICAgICAgICAgaWYodGhpcy5vcHRpb25Db250ZW50RE9NLmhhc0NsYXNzKFwidzMtc2hvd1wiKSkgIHRoaXMub3B0aW9uQ29udGVudERPTS5yZW1vdmVDbGFzcyhcInczLXNob3dcIilcclxuICAgICAgICAgICAgZWxzZSB0aGlzLm9wdGlvbkNvbnRlbnRET00uYWRkQ2xhc3MoXCJ3My1zaG93XCIpXHJcbiAgICAgICAgfSkgICAgXHJcbiAgICB9XHJcbn1cclxuXHJcbnNpbXBsZVNlbGVjdE1lbnUucHJvdG90eXBlLmFkanVzdERyb3BEb3duUG9zaXRpb249ZnVuY3Rpb24oKXtcclxuICAgIGlmKCF0aGlzLmFkanVzdFBvc2l0aW9uQW5jaG9yKSByZXR1cm47XHJcbiAgICB2YXIgb2Zmc2V0PXRoaXMuRE9NLm9mZnNldCgpXHJcbiAgICB2YXIgbmV3VG9wPW9mZnNldC50b3AtdGhpcy5hZGp1c3RQb3NpdGlvbkFuY2hvci50b3BcclxuICAgIHZhciBuZXdMZWZ0PW9mZnNldC5sZWZ0LXRoaXMuYWRqdXN0UG9zaXRpb25BbmNob3IubGVmdFxyXG4gICAgdGhpcy5vcHRpb25Db250ZW50RE9NLmNzcyh7XCJ0b3BcIjpuZXdUb3ArXCJweFwiLFwibGVmdFwiOm5ld0xlZnQrXCJweFwifSlcclxufVxyXG5cclxuc2ltcGxlU2VsZWN0TWVudS5wcm90b3R5cGUuZmluZE9wdGlvbj1mdW5jdGlvbihvcHRpb25WYWx1ZSl7XHJcbiAgICB2YXIgb3B0aW9ucz10aGlzLm9wdGlvbkNvbnRlbnRET00uY2hpbGRyZW4oKVxyXG4gICAgZm9yKHZhciBpPTA7aTxvcHRpb25zLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBhbk9wdGlvbj0kKG9wdGlvbnNbaV0pXHJcbiAgICAgICAgaWYob3B0aW9uVmFsdWU9PWFuT3B0aW9uLmRhdGEoXCJvcHRpb25WYWx1ZVwiKSl7XHJcbiAgICAgICAgICAgIHJldHVybiB7XCJ0ZXh0XCI6YW5PcHRpb24udGV4dCgpLFwidmFsdWVcIjphbk9wdGlvbi5kYXRhKFwib3B0aW9uVmFsdWVcIil9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS5hZGRPcHRpb25BcnI9ZnVuY3Rpb24oYXJyKXtcclxuICAgIGFyci5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIHRoaXMuYWRkT3B0aW9uKGVsZW1lbnQpXHJcbiAgICB9KTtcclxufVxyXG5cclxuc2ltcGxlU2VsZWN0TWVudS5wcm90b3R5cGUuYWRkT3B0aW9uPWZ1bmN0aW9uKG9wdGlvblRleHQsb3B0aW9uVmFsdWUpe1xyXG4gICAgdmFyIG9wdGlvbkl0ZW09JCgnPGEgaHJlZj1cIiNcIiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvblwiPicrb3B0aW9uVGV4dCsnPC9hPicpXHJcbiAgICB0aGlzLm9wdGlvbkNvbnRlbnRET00uYXBwZW5kKG9wdGlvbkl0ZW0pXHJcbiAgICBvcHRpb25JdGVtLmRhdGEoXCJvcHRpb25WYWx1ZVwiLG9wdGlvblZhbHVlfHxvcHRpb25UZXh0KVxyXG4gICAgb3B0aW9uSXRlbS5vbignY2xpY2snLChlKT0+e1xyXG4gICAgICAgIHRoaXMuY3VyU2VsZWN0VmFsPW9wdGlvbkl0ZW0uZGF0YShcIm9wdGlvblZhbHVlXCIpXHJcbiAgICAgICAgaWYodGhpcy5pc0NsaWNrYWJsZSl7XHJcbiAgICAgICAgICAgIHRoaXMub3B0aW9uQ29udGVudERPTS5yZW1vdmVDbGFzcyhcInczLXNob3dcIilcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgdGhpcy5ET00ucmVtb3ZlQ2xhc3MoJ3czLWRyb3Bkb3duLWhvdmVyJylcclxuICAgICAgICAgICAgdGhpcy5ET00uYWRkQ2xhc3MoJ3czLWRyb3Bkb3duLWNsaWNrJylcclxuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7IC8vdGhpcyBpcyB0byBoaWRlIHRoZSBkcm9wIGRvd24gbWVudSBhZnRlciBjbGlja1xyXG4gICAgICAgICAgICAgICAgdGhpcy5ET00uYWRkQ2xhc3MoJ3czLWRyb3Bkb3duLWhvdmVyJylcclxuICAgICAgICAgICAgICAgIHRoaXMuRE9NLnJlbW92ZUNsYXNzKCd3My1kcm9wZG93bi1jbGljaycpXHJcbiAgICAgICAgICAgIH0sIDEwMCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuY2FsbEJhY2tfY2xpY2tPcHRpb24ob3B0aW9uVGV4dCxvcHRpb25JdGVtLmRhdGEoXCJvcHRpb25WYWx1ZVwiKSxcInJlYWxNb3VzZUNsaWNrXCIpXHJcbiAgICB9KVxyXG59XHJcblxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS5jaGFuZ2VOYW1lPWZ1bmN0aW9uKG5hbWVTdHIxLG5hbWVTdHIyKXtcclxuICAgIHRoaXMuYnV0dG9uLmNoaWxkcmVuKFwiOmZpcnN0XCIpLnRleHQobmFtZVN0cjEpXHJcbiAgICB0aGlzLmJ1dHRvbi5jaGlsZHJlbigpLmVxKDEpLnRleHQobmFtZVN0cjIpXHJcbn1cclxuXHJcbnNpbXBsZVNlbGVjdE1lbnUucHJvdG90eXBlLnRyaWdnZXJPcHRpb25JbmRleD1mdW5jdGlvbihvcHRpb25JbmRleCl7XHJcbiAgICB2YXIgdGhlT3B0aW9uPXRoaXMub3B0aW9uQ29udGVudERPTS5jaGlsZHJlbigpLmVxKG9wdGlvbkluZGV4KVxyXG4gICAgaWYodGhlT3B0aW9uLmxlbmd0aD09MCkge1xyXG4gICAgICAgIHRoaXMuY3VyU2VsZWN0VmFsPW51bGw7XHJcbiAgICAgICAgdGhpcy5jYWxsQmFja19jbGlja09wdGlvbihudWxsLG51bGwpXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgdGhpcy5jdXJTZWxlY3RWYWw9dGhlT3B0aW9uLmRhdGEoXCJvcHRpb25WYWx1ZVwiKVxyXG4gICAgdGhpcy5jYWxsQmFja19jbGlja09wdGlvbih0aGVPcHRpb24udGV4dCgpLHRoZU9wdGlvbi5kYXRhKFwib3B0aW9uVmFsdWVcIikpXHJcbn1cclxuc2ltcGxlU2VsZWN0TWVudS5wcm90b3R5cGUudHJpZ2dlck9wdGlvblZhbHVlPWZ1bmN0aW9uKG9wdGlvblZhbHVlKXtcclxuICAgIHZhciByZT10aGlzLmZpbmRPcHRpb24ob3B0aW9uVmFsdWUpXHJcbiAgICBpZihyZT09bnVsbCl7XHJcbiAgICAgICAgdGhpcy5jdXJTZWxlY3RWYWw9bnVsbFxyXG4gICAgICAgIHRoaXMuY2FsbEJhY2tfY2xpY2tPcHRpb24obnVsbCxudWxsKVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgdGhpcy5jdXJTZWxlY3RWYWw9cmUudmFsdWVcclxuICAgICAgICB0aGlzLmNhbGxCYWNrX2NsaWNrT3B0aW9uKHJlLnRleHQscmUudmFsdWUpXHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS5jbGVhck9wdGlvbnM9ZnVuY3Rpb24ob3B0aW9uVGV4dCxvcHRpb25WYWx1ZSl7XHJcbiAgICB0aGlzLm9wdGlvbkNvbnRlbnRET00uZW1wdHkoKVxyXG4gICAgdGhpcy5jdXJTZWxlY3RWYWw9bnVsbDtcclxufVxyXG5cclxuc2ltcGxlU2VsZWN0TWVudS5wcm90b3R5cGUuY2FsbEJhY2tfY2xpY2tPcHRpb249ZnVuY3Rpb24ob3B0aW9udGV4dCxvcHRpb25WYWx1ZSxyZWFsTW91c2VDbGljayl7XHJcblxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHNpbXBsZVNlbGVjdE1lbnU7IiwiJ3VzZSBzdHJpY3QnO1xyXG5mdW5jdGlvbiBzaW1wbGVUcmVlKERPTSxvcHRpb25zKXtcclxuICAgIHRoaXMuRE9NPURPTVxyXG4gICAgdGhpcy5ncm91cE5vZGVzPVtdIC8vZWFjaCBncm91cCBoZWFkZXIgaXMgb25lIG5vZGVcclxuICAgIHRoaXMuc2VsZWN0ZWROb2Rlcz1bXTtcclxuICAgIHRoaXMub3B0aW9ucz1vcHRpb25zIHx8IHt9XHJcbiAgICB0aGlzLmxhc3RDbGlja2VkTm9kZT1udWxsO1xyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5zY3JvbGxUb0xlYWZOb2RlPWZ1bmN0aW9uKGFOb2RlKXtcclxuICAgIHZhciBzY3JvbGxUb3A9dGhpcy5ET00uc2Nyb2xsVG9wKClcclxuICAgIHZhciB0cmVlSGVpZ2h0PXRoaXMuRE9NLmhlaWdodCgpXHJcbiAgICB2YXIgbm9kZVBvc2l0aW9uPWFOb2RlLkRPTS5wb3NpdGlvbigpLnRvcCAvL3doaWNoIGRvZXMgbm90IGNvbnNpZGVyIHBhcmVudCBET00ncyBzY3JvbGwgaGVpZ2h0XHJcbiAgICAvL2NvbnNvbGUubG9nKHNjcm9sbFRvcCx0cmVlSGVpZ2h0LG5vZGVQb3NpdGlvbilcclxuICAgIGlmKHRyZWVIZWlnaHQtNTA8bm9kZVBvc2l0aW9uKXtcclxuICAgICAgICB0aGlzLkRPTS5zY3JvbGxUb3Aoc2Nyb2xsVG9wICsgbm9kZVBvc2l0aW9uLSh0cmVlSGVpZ2h0LTUwKSkgXHJcbiAgICB9ZWxzZSBpZihub2RlUG9zaXRpb248NTApe1xyXG4gICAgICAgIHRoaXMuRE9NLnNjcm9sbFRvcChzY3JvbGxUb3AgKyAobm9kZVBvc2l0aW9uLTUwKSkgXHJcbiAgICB9XHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmNsZWFyQWxsTGVhZk5vZGVzPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLmxhc3RDbGlja2VkTm9kZT1udWxsXHJcbiAgICB0aGlzLmdyb3VwTm9kZXMuZm9yRWFjaCgoZ05vZGUpPT57XHJcbiAgICAgICAgZ05vZGUubGlzdERPTS5lbXB0eSgpXHJcbiAgICAgICAgZ05vZGUuY2hpbGRMZWFmTm9kZXMubGVuZ3RoPTBcclxuICAgICAgICBnTm9kZS5yZWZyZXNoTmFtZSgpXHJcbiAgICB9KVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5nZXRBbGxMZWFmTm9kZUFycj1mdW5jdGlvbigpe1xyXG4gICAgdmFyIGFsbExlYWY9W11cclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5mb3JFYWNoKGduPT57XHJcbiAgICAgICAgYWxsTGVhZj1hbGxMZWFmLmNvbmNhdChnbi5jaGlsZExlYWZOb2RlcylcclxuICAgIH0pXHJcbiAgICByZXR1cm4gYWxsTGVhZjtcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuZmlyc3RMZWFmTm9kZT1mdW5jdGlvbigpe1xyXG4gICAgaWYodGhpcy5ncm91cE5vZGVzLmxlbmd0aD09MCkgcmV0dXJuIG51bGw7XHJcbiAgICB2YXIgZmlyc3RMZWFmTm9kZT1udWxsO1xyXG4gICAgdGhpcy5ncm91cE5vZGVzLmZvckVhY2goYUdyb3VwTm9kZT0+e1xyXG4gICAgICAgIGlmKGZpcnN0TGVhZk5vZGUhPW51bGwpIHJldHVybjtcclxuICAgICAgICBpZihhR3JvdXBOb2RlLmNoaWxkTGVhZk5vZGVzLmxlbmd0aD4wKSBmaXJzdExlYWZOb2RlPWFHcm91cE5vZGUuY2hpbGRMZWFmTm9kZXNbMF1cclxuICAgIH0pXHJcblxyXG4gICAgcmV0dXJuIGZpcnN0TGVhZk5vZGVcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUubmV4dEdyb3VwTm9kZT1mdW5jdGlvbihhR3JvdXBOb2RlKXtcclxuICAgIGlmKGFHcm91cE5vZGU9PW51bGwpIHJldHVybjtcclxuICAgIHZhciBpbmRleD10aGlzLmdyb3VwTm9kZXMuaW5kZXhPZihhR3JvdXBOb2RlKVxyXG4gICAgaWYodGhpcy5ncm91cE5vZGVzLmxlbmd0aC0xPmluZGV4KXtcclxuICAgICAgICByZXR1cm4gdGhpcy5ncm91cE5vZGVzW2luZGV4KzFdXHJcbiAgICB9ZWxzZXsgLy9yb3RhdGUgYmFja3dhcmQgdG8gZmlyc3QgZ3JvdXAgbm9kZVxyXG4gICAgICAgIHJldHVybiB0aGlzLmdyb3VwTm9kZXNbMF0gXHJcbiAgICB9XHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLm5leHRMZWFmTm9kZT1mdW5jdGlvbihhTGVhZk5vZGUpe1xyXG4gICAgaWYoYUxlYWZOb2RlPT1udWxsKSByZXR1cm47XHJcbiAgICB2YXIgYUdyb3VwTm9kZT1hTGVhZk5vZGUucGFyZW50R3JvdXBOb2RlXHJcbiAgICB2YXIgaW5kZXg9YUdyb3VwTm9kZS5jaGlsZExlYWZOb2Rlcy5pbmRleE9mKGFMZWFmTm9kZSlcclxuICAgIGlmKGFHcm91cE5vZGUuY2hpbGRMZWFmTm9kZXMubGVuZ3RoLTE+aW5kZXgpe1xyXG4gICAgICAgIC8vbmV4dCBub2RlIGlzIGluIHNhbWUgZ3JvdXBcclxuICAgICAgICByZXR1cm4gYUdyb3VwTm9kZS5jaGlsZExlYWZOb2Rlc1tpbmRleCsxXVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgLy9maW5kIG5leHQgZ3JvdXAgZmlyc3Qgbm9kZVxyXG4gICAgICAgIHdoaWxlKHRydWUpe1xyXG4gICAgICAgICAgICB2YXIgbmV4dEdyb3VwTm9kZSA9IHRoaXMubmV4dEdyb3VwTm9kZShhR3JvdXBOb2RlKVxyXG4gICAgICAgICAgICBpZihuZXh0R3JvdXBOb2RlLmNoaWxkTGVhZk5vZGVzLmxlbmd0aD09MCl7XHJcbiAgICAgICAgICAgICAgICBhR3JvdXBOb2RlPW5leHRHcm91cE5vZGVcclxuICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV4dEdyb3VwTm9kZS5jaGlsZExlYWZOb2Rlc1swXVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5zZWFyY2hUZXh0PWZ1bmN0aW9uKHN0cil7XHJcbiAgICBpZihzdHI9PVwiXCIpIHJldHVybiBudWxsO1xyXG4gICAgLy9zZWFyY2ggZnJvbSBjdXJyZW50IHNlbGVjdCBpdGVtIHRoZSBuZXh0IGxlYWYgaXRlbSBjb250YWlucyB0aGUgdGV4dFxyXG4gICAgdmFyIHJlZ2V4ID0gbmV3IFJlZ0V4cChzdHIsICdpJyk7XHJcbiAgICB2YXIgc3RhcnROb2RlXHJcbiAgICBpZih0aGlzLnNlbGVjdGVkTm9kZXMubGVuZ3RoPT0wKSB7XHJcbiAgICAgICAgc3RhcnROb2RlPXRoaXMuZmlyc3RMZWFmTm9kZSgpXHJcbiAgICAgICAgaWYoc3RhcnROb2RlPT1udWxsKSByZXR1cm47XHJcbiAgICAgICAgdmFyIHRoZVN0cj1zdGFydE5vZGUubmFtZTtcclxuICAgICAgICBpZih0aGVTdHIubWF0Y2gocmVnZXgpIT1udWxsKXtcclxuICAgICAgICAgICAgLy9maW5kIHRhcmdldCBub2RlIFxyXG4gICAgICAgICAgICByZXR1cm4gc3RhcnROb2RlXHJcbiAgICAgICAgfVxyXG4gICAgfWVsc2Ugc3RhcnROb2RlPXRoaXMuc2VsZWN0ZWROb2Rlc1swXVxyXG5cclxuICAgIGlmKHN0YXJ0Tm9kZT09bnVsbCkgcmV0dXJuIG51bGw7XHJcbiAgICBcclxuICAgIHZhciBmcm9tTm9kZT1zdGFydE5vZGU7XHJcbiAgICB3aGlsZSh0cnVlKXtcclxuICAgICAgICB2YXIgbmV4dE5vZGU9dGhpcy5uZXh0TGVhZk5vZGUoZnJvbU5vZGUpXHJcbiAgICAgICAgaWYobmV4dE5vZGU9PXN0YXJ0Tm9kZSkgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgdmFyIG5leHROb2RlU3RyPW5leHROb2RlLm5hbWU7XHJcbiAgICAgICAgaWYobmV4dE5vZGVTdHIubWF0Y2gocmVnZXgpIT1udWxsKXtcclxuICAgICAgICAgICAgLy9maW5kIHRhcmdldCBub2RlXHJcbiAgICAgICAgICAgIHJldHVybiBuZXh0Tm9kZVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBmcm9tTm9kZT1uZXh0Tm9kZTtcclxuICAgICAgICB9XHJcbiAgICB9ICAgIFxyXG59XHJcblxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuYWRkTGVhZm5vZGVUb0dyb3VwPWZ1bmN0aW9uKGdyb3VwTmFtZSxvYmosc2tpcFJlcGVhdCl7XHJcbiAgICB2YXIgYUdyb3VwTm9kZT10aGlzLmZpbmRHcm91cE5vZGUoZ3JvdXBOYW1lKVxyXG4gICAgaWYoYUdyb3VwTm9kZSA9PSBudWxsKSByZXR1cm47XHJcbiAgICBhR3JvdXBOb2RlLmFkZE5vZGUob2JqLHNraXBSZXBlYXQpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLnJlbW92ZUFsbE5vZGVzPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLmxhc3RDbGlja2VkTm9kZT1udWxsXHJcbiAgICB0aGlzLmdyb3VwTm9kZXMubGVuZ3RoPTA7XHJcbiAgICB0aGlzLnNlbGVjdGVkTm9kZXMubGVuZ3RoPTA7XHJcbiAgICB0aGlzLkRPTS5lbXB0eSgpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmZpbmRHcm91cE5vZGU9ZnVuY3Rpb24oZ3JvdXBOYW1lKXtcclxuICAgIHZhciBmb3VuZEdyb3VwTm9kZT1udWxsXHJcbiAgICB0aGlzLmdyb3VwTm9kZXMuZm9yRWFjaChhR3JvdXBOb2RlPT57XHJcbiAgICAgICAgaWYoYUdyb3VwTm9kZS5uYW1lPT1ncm91cE5hbWUpe1xyXG4gICAgICAgICAgICBmb3VuZEdyb3VwTm9kZT1hR3JvdXBOb2RlXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG4gICAgcmV0dXJuIGZvdW5kR3JvdXBOb2RlO1xyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5kZWxHcm91cE5vZGU9ZnVuY3Rpb24oZ25vZGUpe1xyXG4gICAgdGhpcy5sYXN0Q2xpY2tlZE5vZGU9bnVsbFxyXG4gICAgZ25vZGUuZGVsZXRlU2VsZigpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmRlbGV0ZUxlYWZOb2RlPWZ1bmN0aW9uKG5vZGVOYW1lKXtcclxuICAgIHRoaXMubGFzdENsaWNrZWROb2RlPW51bGxcclxuICAgIHZhciBmaW5kTGVhZk5vZGU9bnVsbFxyXG4gICAgdGhpcy5ncm91cE5vZGVzLmZvckVhY2goKGdOb2RlKT0+e1xyXG4gICAgICAgIGlmKGZpbmRMZWFmTm9kZSE9bnVsbCkgcmV0dXJuO1xyXG4gICAgICAgIGdOb2RlLmNoaWxkTGVhZk5vZGVzLmZvckVhY2goKGFMZWFmKT0+e1xyXG4gICAgICAgICAgICBpZihhTGVhZi5uYW1lPT1ub2RlTmFtZSl7XHJcbiAgICAgICAgICAgICAgICBmaW5kTGVhZk5vZGU9YUxlYWZcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICB9KVxyXG4gICAgaWYoZmluZExlYWZOb2RlPT1udWxsKSByZXR1cm47XHJcbiAgICBmaW5kTGVhZk5vZGUuZGVsZXRlU2VsZigpXHJcbn1cclxuXHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5pbnNlcnRHcm91cE5vZGU9ZnVuY3Rpb24ob2JqLGluZGV4KXtcclxuICAgIHZhciBhTmV3R3JvdXBOb2RlID0gbmV3IHNpbXBsZVRyZWVHcm91cE5vZGUodGhpcyxvYmopXHJcbiAgICB2YXIgZXhpc3RHcm91cE5vZGU9IHRoaXMuZmluZEdyb3VwTm9kZShhTmV3R3JvdXBOb2RlLm5hbWUpXHJcbiAgICBpZihleGlzdEdyb3VwTm9kZSE9bnVsbCkgcmV0dXJuO1xyXG4gICAgdGhpcy5ncm91cE5vZGVzLnNwbGljZShpbmRleCwgMCwgYU5ld0dyb3VwTm9kZSk7XHJcblxyXG4gICAgaWYoaW5kZXg9PTApe1xyXG4gICAgICAgIHRoaXMuRE9NLmFwcGVuZChhTmV3R3JvdXBOb2RlLmhlYWRlckRPTSlcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQoYU5ld0dyb3VwTm9kZS5saXN0RE9NKVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgdmFyIHByZXZHcm91cE5vZGU9dGhpcy5ncm91cE5vZGVzW2luZGV4LTFdXHJcbiAgICAgICAgYU5ld0dyb3VwTm9kZS5oZWFkZXJET00uaW5zZXJ0QWZ0ZXIocHJldkdyb3VwTm9kZS5saXN0RE9NKVxyXG4gICAgICAgIGFOZXdHcm91cE5vZGUubGlzdERPTS5pbnNlcnRBZnRlcihhTmV3R3JvdXBOb2RlLmhlYWRlckRPTSlcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYU5ld0dyb3VwTm9kZTtcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuYWRkR3JvdXBOb2RlPWZ1bmN0aW9uKG9iail7XHJcbiAgICB2YXIgYU5ld0dyb3VwTm9kZSA9IG5ldyBzaW1wbGVUcmVlR3JvdXBOb2RlKHRoaXMsb2JqKVxyXG4gICAgdmFyIGV4aXN0R3JvdXBOb2RlPSB0aGlzLmZpbmRHcm91cE5vZGUoYU5ld0dyb3VwTm9kZS5uYW1lKVxyXG4gICAgaWYoZXhpc3RHcm91cE5vZGUhPW51bGwpIHJldHVybiBleGlzdEdyb3VwTm9kZTtcclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5wdXNoKGFOZXdHcm91cE5vZGUpO1xyXG4gICAgdGhpcy5ET00uYXBwZW5kKGFOZXdHcm91cE5vZGUuaGVhZGVyRE9NKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKGFOZXdHcm91cE5vZGUubGlzdERPTSlcclxuICAgIHJldHVybiBhTmV3R3JvdXBOb2RlO1xyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5zZWxlY3RMZWFmTm9kZT1mdW5jdGlvbihsZWFmTm9kZSxtb3VzZUNsaWNrRGV0YWlsKXtcclxuICAgIHRoaXMuc2VsZWN0TGVhZk5vZGVBcnIoW2xlYWZOb2RlXSxtb3VzZUNsaWNrRGV0YWlsKVxyXG59XHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmFwcGVuZExlYWZOb2RlVG9TZWxlY3Rpb249ZnVuY3Rpb24obGVhZk5vZGUpe1xyXG4gICAgdmFyIG5ld0Fycj1bXS5jb25jYXQodGhpcy5zZWxlY3RlZE5vZGVzKVxyXG4gICAgbmV3QXJyLnB1c2gobGVhZk5vZGUpXHJcbiAgICB0aGlzLnNlbGVjdExlYWZOb2RlQXJyKG5ld0FycilcclxufVxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5hZGROb2RlQXJyYXlUb1NlbGVjdGlvbj1mdW5jdGlvbihhcnIpe1xyXG4gICAgdmFyIG5ld0FyciA9IHRoaXMuc2VsZWN0ZWROb2Rlc1xyXG4gICAgdmFyIGZpbHRlckFycj1hcnIuZmlsdGVyKChpdGVtKSA9PiBuZXdBcnIuaW5kZXhPZihpdGVtKSA8IDApXHJcbiAgICBuZXdBcnIgPSBuZXdBcnIuY29uY2F0KGZpbHRlckFycilcclxuICAgIHRoaXMuc2VsZWN0TGVhZk5vZGVBcnIobmV3QXJyKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5zZWxlY3RHcm91cE5vZGU9ZnVuY3Rpb24oZ3JvdXBOb2RlKXtcclxuICAgIGlmKHRoaXMuY2FsbGJhY2tfYWZ0ZXJTZWxlY3RHcm91cE5vZGUpIHRoaXMuY2FsbGJhY2tfYWZ0ZXJTZWxlY3RHcm91cE5vZGUoZ3JvdXBOb2RlLmluZm8pXHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLnNlbGVjdExlYWZOb2RlQXJyPWZ1bmN0aW9uKGxlYWZOb2RlQXJyLG1vdXNlQ2xpY2tEZXRhaWwpe1xyXG4gICAgZm9yKHZhciBpPTA7aTx0aGlzLnNlbGVjdGVkTm9kZXMubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdGhpcy5zZWxlY3RlZE5vZGVzW2ldLmRpbSgpXHJcbiAgICB9XHJcbiAgICB0aGlzLnNlbGVjdGVkTm9kZXMubGVuZ3RoPTA7XHJcbiAgICB0aGlzLnNlbGVjdGVkTm9kZXM9dGhpcy5zZWxlY3RlZE5vZGVzLmNvbmNhdChsZWFmTm9kZUFycilcclxuICAgIGZvcih2YXIgaT0wO2k8dGhpcy5zZWxlY3RlZE5vZGVzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHRoaXMuc2VsZWN0ZWROb2Rlc1tpXS5oaWdobGlnaHQoKVxyXG4gICAgfVxyXG5cclxuICAgIGlmKHRoaXMuY2FsbGJhY2tfYWZ0ZXJTZWxlY3ROb2RlcykgdGhpcy5jYWxsYmFja19hZnRlclNlbGVjdE5vZGVzKHRoaXMuc2VsZWN0ZWROb2Rlcyxtb3VzZUNsaWNrRGV0YWlsKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5kYmxDbGlja05vZGU9ZnVuY3Rpb24odGhlTm9kZSl7XHJcbiAgICBpZih0aGlzLmNhbGxiYWNrX2FmdGVyRGJsY2xpY2tOb2RlKSB0aGlzLmNhbGxiYWNrX2FmdGVyRGJsY2xpY2tOb2RlKHRoZU5vZGUpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLnNvcnRBbGxMZWF2ZXM9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5mb3JFYWNoKG9uZUdyb3VwTm9kZT0+e29uZUdyb3VwTm9kZS5zb3J0Tm9kZXNCeU5hbWUoKX0pXHJcbn1cclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLXRyZWUgZ3JvdXAgbm9kZS0tLS0tLS0tLS0tLS0tLVxyXG5mdW5jdGlvbiBzaW1wbGVUcmVlR3JvdXBOb2RlKHBhcmVudFRyZWUsb2JqKXtcclxuICAgIHRoaXMucGFyZW50VHJlZT1wYXJlbnRUcmVlXHJcbiAgICB0aGlzLmluZm89b2JqXHJcbiAgICB0aGlzLmNoaWxkTGVhZk5vZGVzPVtdIC8vaXQncyBjaGlsZCBsZWFmIG5vZGVzIGFycmF5XHJcbiAgICB0aGlzLm5hbWU9b2JqLmRpc3BsYXlOYW1lO1xyXG4gICAgdGhpcy5jcmVhdGVET00oKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5yZWZyZXNoTmFtZT1mdW5jdGlvbigpeyAvL+KsouKWieKaq1xyXG4gICAgdGhpcy5oZWFkZXJET00uZW1wdHkoKVxyXG4gICAgdmFyIG5hbWVEaXY9JChcIjxkaXYgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO3BhZGRpbmctbGVmdDo1cHg7cGFkZGluZy1yaWdodDozcHg7dmVydGljYWwtYWxpZ246bWlkZGxlJz48L2Rpdj5cIilcclxuICAgIG5hbWVEaXYudGV4dCh0aGlzLm5hbWUpXHJcbiAgICBcclxuICAgIGlmKHRoaXMuY2hpbGRMZWFmTm9kZXMubGVuZ3RoPjApIGxibENvbG9yPVwieWVsbG93Z3JlZW5cIlxyXG4gICAgZWxzZSB2YXIgbGJsQ29sb3I9XCJkYXJrR3JheVwiIFxyXG4gICAgdGhpcy5oZWFkZXJET00uY3NzKFwiZm9udC13ZWlnaHRcIixcImJvbGRcIilcclxuXHJcbiAgICBpZih0aGlzLnBhcmVudFRyZWUub3B0aW9ucy5ncm91cE5vZGVJY29uRnVuYyl7XHJcbiAgICAgICAgdmFyIGljb25MYWJlbD10aGlzLnBhcmVudFRyZWUub3B0aW9ucy5ncm91cE5vZGVJY29uRnVuYyh0aGlzKVxyXG4gICAgICAgIHRoaXMuaGVhZGVyRE9NLmFwcGVuZChpY29uTGFiZWwpXHJcbiAgICAgICAgdmFyIHJvd0hlaWdodD1pY29uTGFiZWwuaGVpZ2h0KClcclxuICAgICAgICBuYW1lRGl2LmNzcyhcImxpbmUtaGVpZ2h0XCIscm93SGVpZ2h0K1wicHhcIilcclxuICAgIH1cclxuICAgIFxyXG4gICAgdmFyIG51bWJlcmxhYmVsPSQoXCI8bGFiZWwgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO2JhY2tncm91bmQtY29sb3I6XCIrbGJsQ29sb3JcclxuICAgICAgICArXCI7Y29sb3I6d2hpdGU7Zm9udC1zaXplOjlweDtwYWRkaW5nOjJweCA0cHg7Zm9udC13ZWlnaHQ6bm9ybWFsO2JvcmRlci1yYWRpdXM6IDJweDsnPlwiK3RoaXMuY2hpbGRMZWFmTm9kZXMubGVuZ3RoK1wiPC9sYWJlbD5cIilcclxuICAgIHRoaXMuaGVhZGVyRE9NLmFwcGVuZChuYW1lRGl2LG51bWJlcmxhYmVsKSBcclxuICAgIFxyXG4gICAgdGhpcy5jaGVja09wdGlvbkhpZGVFbXB0eUdyb3VwKClcclxufVxyXG5cclxuc2ltcGxlVHJlZUdyb3VwTm9kZS5wcm90b3R5cGUuY2hlY2tPcHRpb25IaWRlRW1wdHlHcm91cD1mdW5jdGlvbigpe1xyXG4gICAgaWYgKHRoaXMucGFyZW50VHJlZS5vcHRpb25zLmhpZGVFbXB0eUdyb3VwICYmIHRoaXMuY2hpbGRMZWFmTm9kZXMubGVuZ3RoID09IDApIHtcclxuICAgICAgICB0aGlzLnNocmluaygpXHJcbiAgICAgICAgdGhpcy5oZWFkZXJET00uaGlkZSgpXHJcbiAgICAgICAgaWYgKHRoaXMubGlzdERPTSkgdGhpcy5saXN0RE9NLmhpZGUoKVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB0aGlzLmhlYWRlckRPTS5zaG93KClcclxuICAgICAgICBpZiAodGhpcy5saXN0RE9NKSB0aGlzLmxpc3RET00uc2hvdygpXHJcbiAgICB9XHJcblxyXG59XHJcblxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5kZWxldGVTZWxmID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5oZWFkZXJET00ucmVtb3ZlKClcclxuICAgIHRoaXMubGlzdERPTS5yZW1vdmUoKVxyXG4gICAgdmFyIHBhcmVudEFyciA9IHRoaXMucGFyZW50VHJlZS5ncm91cE5vZGVzXHJcbiAgICBjb25zdCBpbmRleCA9IHBhcmVudEFyci5pbmRleE9mKHRoaXMpO1xyXG4gICAgaWYgKGluZGV4ID4gLTEpIHBhcmVudEFyci5zcGxpY2UoaW5kZXgsIDEpO1xyXG59XHJcblxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5jcmVhdGVET009ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuaGVhZGVyRE9NPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYmxvY2sgdzMtbGlnaHQtZ3JleSB3My1sZWZ0LWFsaWduIHczLWJvcmRlci1ib3R0b21cIj48L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5yZWZyZXNoTmFtZSgpXHJcbiAgICB0aGlzLmxpc3RET009JCgnPGRpdiBjbGFzcz1cInczLWNvbnRhaW5lciB3My1oaWRlIHczLWJvcmRlciB3My1wYWRkaW5nLTE2XCI+PC9kaXY+JylcclxuXHJcbiAgICB0aGlzLmhlYWRlckRPTS5vbihcImNsaWNrXCIsKGV2dCk9PiB7XHJcbiAgICAgICAgaWYodGhpcy5saXN0RE9NLmhhc0NsYXNzKFwidzMtc2hvd1wiKSkgdGhpcy5saXN0RE9NLnJlbW92ZUNsYXNzKFwidzMtc2hvd1wiKVxyXG4gICAgICAgIGVsc2UgdGhpcy5saXN0RE9NLmFkZENsYXNzKFwidzMtc2hvd1wiKVxyXG5cclxuICAgICAgICB0aGlzLnBhcmVudFRyZWUuc2VsZWN0R3JvdXBOb2RlKHRoaXMpICAgIFxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5pc09wZW49ZnVuY3Rpb24oKXtcclxuICAgIHJldHVybiAgdGhpcy5saXN0RE9NLmhhc0NsYXNzKFwidzMtc2hvd1wiKVxyXG59XHJcblxyXG5cclxuc2ltcGxlVHJlZUdyb3VwTm9kZS5wcm90b3R5cGUuZXhwYW5kPWZ1bmN0aW9uKCl7XHJcbiAgICBpZih0aGlzLmxpc3RET00pIHRoaXMubGlzdERPTS5hZGRDbGFzcyhcInczLXNob3dcIilcclxufVxyXG5cclxuc2ltcGxlVHJlZUdyb3VwTm9kZS5wcm90b3R5cGUuc2hyaW5rPWZ1bmN0aW9uKCl7XHJcbiAgICBpZih0aGlzLmxpc3RET00pIHRoaXMubGlzdERPTS5yZW1vdmVDbGFzcyhcInczLXNob3dcIilcclxufVxyXG5cclxuc2ltcGxlVHJlZUdyb3VwTm9kZS5wcm90b3R5cGUuc29ydE5vZGVzQnlOYW1lPWZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgdHJlZU9wdGlvbnM9dGhpcy5wYXJlbnRUcmVlLm9wdGlvbnNcclxuICAgIGlmKHRyZWVPcHRpb25zLmxlYWZOYW1lUHJvcGVydHkpIHZhciBsZWFmTmFtZVByb3BlcnR5PXRyZWVPcHRpb25zLmxlYWZOYW1lUHJvcGVydHlcclxuICAgIGVsc2UgbGVhZk5hbWVQcm9wZXJ0eT1cIiRkdElkXCJcclxuICAgIHRoaXMuY2hpbGRMZWFmTm9kZXMuc29ydChmdW5jdGlvbiAoYSwgYikgeyBcclxuICAgICAgICB2YXIgYU5hbWU9YS5uYW1lLnRvTG93ZXJDYXNlKClcclxuICAgICAgICB2YXIgYk5hbWU9Yi5uYW1lLnRvTG93ZXJDYXNlKClcclxuICAgICAgICByZXR1cm4gYU5hbWUubG9jYWxlQ29tcGFyZShiTmFtZSkgXHJcbiAgICB9KTtcclxuICAgIC8vdGhpcy5saXN0RE9NLmVtcHR5KCkgLy9OT1RFOiBDYW4gbm90IGRlbGV0ZSB0aG9zZSBsZWFmIG5vZGUgb3RoZXJ3aXNlIHRoZSBldmVudCBoYW5kbGUgaXMgbG9zdFxyXG4gICAgdGhpcy5jaGlsZExlYWZOb2Rlcy5mb3JFYWNoKG9uZUxlYWY9Pnt0aGlzLmxpc3RET00uYXBwZW5kKG9uZUxlYWYuRE9NKX0pXHJcbn1cclxuXHJcbnNpbXBsZVRyZWVHcm91cE5vZGUucHJvdG90eXBlLmFkZE5vZGU9ZnVuY3Rpb24ob2JqLHNraXBSZXBlYXQpe1xyXG4gICAgdmFyIHRyZWVPcHRpb25zPXRoaXMucGFyZW50VHJlZS5vcHRpb25zXHJcbiAgICBpZih0cmVlT3B0aW9ucy5sZWFmTmFtZVByb3BlcnR5KSB2YXIgbGVhZk5hbWVQcm9wZXJ0eT10cmVlT3B0aW9ucy5sZWFmTmFtZVByb3BlcnR5XHJcbiAgICBlbHNlIGxlYWZOYW1lUHJvcGVydHk9XCIkZHRJZFwiXHJcblxyXG4gICAgaWYoc2tpcFJlcGVhdCl7XHJcbiAgICAgICAgdmFyIGZvdW5kUmVwZWF0PWZhbHNlO1xyXG4gICAgICAgIHRoaXMuY2hpbGRMZWFmTm9kZXMuZm9yRWFjaChhTm9kZT0+e1xyXG4gICAgICAgICAgICBpZihhTm9kZS5uYW1lPT1vYmpbbGVhZk5hbWVQcm9wZXJ0eV0pIHtcclxuICAgICAgICAgICAgICAgIGZvdW5kUmVwZWF0PXRydWVcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgaWYoZm91bmRSZXBlYXQpIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgYU5ld05vZGUgPSBuZXcgc2ltcGxlVHJlZUxlYWZOb2RlKHRoaXMsb2JqKVxyXG4gICAgdGhpcy5jaGlsZExlYWZOb2Rlcy5wdXNoKGFOZXdOb2RlKVxyXG4gICAgdGhpcy5yZWZyZXNoTmFtZSgpXHJcbiAgICB0aGlzLmxpc3RET00uYXBwZW5kKGFOZXdOb2RlLkRPTSlcclxufVxyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tdHJlZSBsZWFmIG5vZGUtLS0tLS0tLS0tLS0tLS0tLS1cclxuZnVuY3Rpb24gc2ltcGxlVHJlZUxlYWZOb2RlKHBhcmVudEdyb3VwTm9kZSxvYmope1xyXG4gICAgdGhpcy5wYXJlbnRHcm91cE5vZGU9cGFyZW50R3JvdXBOb2RlXHJcbiAgICB0aGlzLmxlYWZJbmZvPW9iajtcclxuXHJcbiAgICB2YXIgdHJlZU9wdGlvbnM9dGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5vcHRpb25zXHJcbiAgICBpZih0cmVlT3B0aW9ucy5sZWFmTmFtZVByb3BlcnR5KSB0aGlzLm5hbWU9dGhpcy5sZWFmSW5mb1t0cmVlT3B0aW9ucy5sZWFmTmFtZVByb3BlcnR5XVxyXG4gICAgZWxzZSB0aGlzLm5hbWU9dGhpcy5sZWFmSW5mb1tcIiRkdElkXCJdXHJcblxyXG4gICAgdGhpcy5jcmVhdGVMZWFmTm9kZURPTSgpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWVMZWFmTm9kZS5wcm90b3R5cGUuZGVsZXRlU2VsZiA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMuRE9NLnJlbW92ZSgpXHJcbiAgICB2YXIgZ05vZGUgPSB0aGlzLnBhcmVudEdyb3VwTm9kZVxyXG4gICAgY29uc3QgaW5kZXggPSBnTm9kZS5jaGlsZExlYWZOb2Rlcy5pbmRleE9mKHRoaXMpO1xyXG4gICAgaWYgKGluZGV4ID4gLTEpIGdOb2RlLmNoaWxkTGVhZk5vZGVzLnNwbGljZShpbmRleCwgMSk7XHJcbiAgICBnTm9kZS5yZWZyZXNoTmFtZSgpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWVMZWFmTm9kZS5wcm90b3R5cGUuY2xpY2tTZWxmPWZ1bmN0aW9uKG1vdXNlQ2xpY2tEZXRhaWwpe1xyXG4gICAgdGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5sYXN0Q2xpY2tlZE5vZGU9dGhpcztcclxuICAgIHRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUuc2VsZWN0TGVhZk5vZGUodGhpcyxtb3VzZUNsaWNrRGV0YWlsKVxyXG59XHJcblxyXG5cclxuc2ltcGxlVHJlZUxlYWZOb2RlLnByb3RvdHlwZS5jcmVhdGVMZWFmTm9kZURPTT1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5ET009JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My13aGl0ZVwiIHN0eWxlPVwiZGlzcGxheTpibG9jazt0ZXh0LWFsaWduOmxlZnQ7d2lkdGg6OTglXCI+PC9idXR0b24+JylcclxuICAgIHRoaXMucmVkcmF3TGFiZWwoKVxyXG4gICAgdmFyIGNsaWNrRj0oZSk9PntcclxuICAgICAgICB0aGlzLmhpZ2hsaWdodCgpO1xyXG4gICAgICAgIHZhciBjbGlja0RldGFpbD1lLmRldGFpbFxyXG4gICAgICAgIGlmIChlLmN0cmxLZXkpIHtcclxuICAgICAgICAgICAgaWYodGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5vcHRpb25zLm5vTXVsdGlwbGVTZWxlY3RBbGxvd2VkKXtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xpY2tTZWxmKClcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLmFwcGVuZExlYWZOb2RlVG9TZWxlY3Rpb24odGhpcylcclxuICAgICAgICAgICAgdGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5sYXN0Q2xpY2tlZE5vZGU9dGhpcztcclxuICAgICAgICB9ZWxzZSBpZihlLnNoaWZ0S2V5KXtcclxuICAgICAgICAgICAgaWYodGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5vcHRpb25zLm5vTXVsdGlwbGVTZWxlY3RBbGxvd2VkKXtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xpY2tTZWxmKClcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZih0aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLmxhc3RDbGlja2VkTm9kZT09bnVsbCl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsaWNrU2VsZigpXHJcbiAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgdmFyIGFsbExlYWZOb2RlQXJyPXRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUuZ2V0QWxsTGVhZk5vZGVBcnIoKVxyXG4gICAgICAgICAgICAgICAgdmFyIGluZGV4MSA9IGFsbExlYWZOb2RlQXJyLmluZGV4T2YodGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5sYXN0Q2xpY2tlZE5vZGUpXHJcbiAgICAgICAgICAgICAgICB2YXIgaW5kZXgyID0gYWxsTGVhZk5vZGVBcnIuaW5kZXhPZih0aGlzKVxyXG4gICAgICAgICAgICAgICAgaWYoaW5kZXgxPT0tMSB8fCBpbmRleDI9PS0xKXtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNsaWNrU2VsZigpXHJcbiAgICAgICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgICAgICAvL3NlbGVjdCBhbGwgbGVhZiBiZXR3ZWVuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxvd2VyST0gTWF0aC5taW4oaW5kZXgxLGluZGV4MilcclxuICAgICAgICAgICAgICAgICAgICB2YXIgaGlnaGVyST0gTWF0aC5tYXgoaW5kZXgxLGluZGV4MilcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICB2YXIgbWlkZGxlQXJyPWFsbExlYWZOb2RlQXJyLnNsaWNlKGxvd2VySSxoaWdoZXJJKSAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIG1pZGRsZUFyci5wdXNoKGFsbExlYWZOb2RlQXJyW2hpZ2hlckldKVxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUuYWRkTm9kZUFycmF5VG9TZWxlY3Rpb24obWlkZGxlQXJyKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHRoaXMuY2xpY2tTZWxmKGNsaWNrRGV0YWlsKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMuRE9NLm9uKFwiY2xpY2tcIiwoZSk9PntjbGlja0YoZSl9KVxyXG5cclxuICAgIHRoaXMuRE9NLm9uKFwiZGJsY2xpY2tcIiwoZSk9PntcclxuICAgICAgICB0aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLmRibENsaWNrTm9kZSh0aGlzKVxyXG4gICAgfSlcclxufVxyXG5cclxuc2ltcGxlVHJlZUxlYWZOb2RlLnByb3RvdHlwZS5yZWRyYXdMYWJlbD1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5ET00uZW1wdHkoKVxyXG4gICAgdmFyIG5hbWVEaXY9JChcIjxsYWJlbCBzdHlsZT0nZGlzcGxheTppbmxpbmU7cGFkZGluZy1sZWZ0OjVweDtwYWRkaW5nLXJpZ2h0OjNweDt2ZXJ0aWNhbC1hbGlnbjptaWRkbGUnPjwvbGFiZWw+XCIpXHJcbiAgICBpZih0aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLm9wdGlvbnMubGVhZk5vZGVJY29uRnVuYyl7XHJcbiAgICAgICAgdmFyIGljb25MYWJlbD10aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLm9wdGlvbnMubGVhZk5vZGVJY29uRnVuYyh0aGlzKVxyXG4gICAgICAgIHRoaXMuRE9NLmFwcGVuZChpY29uTGFiZWwpXHJcbiAgICAgICAgdmFyIHJvd0hlaWdodD1pY29uTGFiZWwuaGVpZ2h0KClcclxuICAgICAgICBuYW1lRGl2LmNzcyhcImxpbmUtaGVpZ2h0XCIscm93SGVpZ2h0K1wicHhcIilcclxuICAgIH1cclxuICAgIG5hbWVEaXYudGV4dCh0aGlzLm5hbWUpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQobmFtZURpdilcclxufVxyXG5cclxuXHJcbnNpbXBsZVRyZWVMZWFmTm9kZS5wcm90b3R5cGUuaGlnaGxpZ2h0PWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLkRPTS5hZGRDbGFzcyhcInczLW9yYW5nZVwiKVxyXG4gICAgdGhpcy5ET00uYWRkQ2xhc3MoXCJ3My1ob3Zlci1hbWJlclwiKVxyXG4gICAgdGhpcy5ET00ucmVtb3ZlQ2xhc3MoXCJ3My13aGl0ZVwiKVxyXG59XHJcbnNpbXBsZVRyZWVMZWFmTm9kZS5wcm90b3R5cGUuZGltPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLkRPTS5yZW1vdmVDbGFzcyhcInczLW9yYW5nZVwiKVxyXG4gICAgdGhpcy5ET00ucmVtb3ZlQ2xhc3MoXCJ3My1ob3Zlci1hbWJlclwiKVxyXG4gICAgdGhpcy5ET00uYWRkQ2xhc3MoXCJ3My13aGl0ZVwiKVxyXG59XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBzaW1wbGVUcmVlOyIsIid1c2Ugc3RyaWN0JztcclxuXHJcbmNvbnN0IG1vZGVsQW5hbHl6ZXIgPSByZXF1aXJlKFwiLi9tb2RlbEFuYWx5emVyXCIpO1xyXG5jb25zdCBzaW1wbGVTZWxlY3RNZW51ID0gcmVxdWlyZShcIi4vc2ltcGxlU2VsZWN0TWVudVwiKVxyXG5jb25zdCBzaW1wbGVDb25maXJtRGlhbG9nID0gcmVxdWlyZShcIi4vc2ltcGxlQ29uZmlybURpYWxvZ1wiKVxyXG5jb25zdCBnbG9iYWxDYWNoZSA9IHJlcXVpcmUoXCIuL2dsb2JhbENhY2hlXCIpXHJcblxyXG5cclxuZnVuY3Rpb24gdG9wb2xvZ3lET00oRE9NKXtcclxuICAgIHRoaXMuRE9NPURPTVxyXG4gICAgdGhpcy5kZWZhdWx0Tm9kZVNpemU9MzBcclxuICAgIHRoaXMubm9kZVNpemVNb2RlbEFkanVzdG1lbnRSYXRpbz17fVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuaW5pdD1mdW5jdGlvbigpe1xyXG4gICAgY3l0b3NjYXBlLndhcm5pbmdzKGZhbHNlKSAgXHJcbiAgICB0aGlzLmNvcmUgPSBjeXRvc2NhcGUoe1xyXG4gICAgICAgIGNvbnRhaW5lcjogIHRoaXMuRE9NWzBdLCAvLyBjb250YWluZXIgdG8gcmVuZGVyIGluXHJcblxyXG4gICAgICAgIC8vIGluaXRpYWwgdmlld3BvcnQgc3RhdGU6XHJcbiAgICAgICAgem9vbTogMSxcclxuICAgICAgICBwYW46IHsgeDogMCwgeTogMCB9LFxyXG5cclxuICAgICAgICAvLyBpbnRlcmFjdGlvbiBvcHRpb25zOlxyXG4gICAgICAgIG1pblpvb206IDAuMSxcclxuICAgICAgICBtYXhab29tOiAxMCxcclxuICAgICAgICB6b29taW5nRW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICB1c2VyWm9vbWluZ0VuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgcGFubmluZ0VuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgdXNlclBhbm5pbmdFbmFibGVkOiB0cnVlLFxyXG4gICAgICAgIGJveFNlbGVjdGlvbkVuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgc2VsZWN0aW9uVHlwZTogJ3NpbmdsZScsXHJcbiAgICAgICAgdG91Y2hUYXBUaHJlc2hvbGQ6IDgsXHJcbiAgICAgICAgZGVza3RvcFRhcFRocmVzaG9sZDogNCxcclxuICAgICAgICBhdXRvbG9jazogZmFsc2UsXHJcbiAgICAgICAgYXV0b3VuZ3JhYmlmeTogZmFsc2UsXHJcbiAgICAgICAgYXV0b3Vuc2VsZWN0aWZ5OiBmYWxzZSxcclxuXHJcbiAgICAgICAgLy8gcmVuZGVyaW5nIG9wdGlvbnM6XHJcbiAgICAgICAgaGVhZGxlc3M6IGZhbHNlLFxyXG4gICAgICAgIHN0eWxlRW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICBoaWRlRWRnZXNPblZpZXdwb3J0OiBmYWxzZSxcclxuICAgICAgICB0ZXh0dXJlT25WaWV3cG9ydDogZmFsc2UsXHJcbiAgICAgICAgbW90aW9uQmx1cjogZmFsc2UsXHJcbiAgICAgICAgbW90aW9uQmx1ck9wYWNpdHk6IDAuMixcclxuICAgICAgICB3aGVlbFNlbnNpdGl2aXR5OiAwLjMsXHJcbiAgICAgICAgcGl4ZWxSYXRpbzogJ2F1dG8nLFxyXG5cclxuICAgICAgICBlbGVtZW50czogW10sIC8vIGxpc3Qgb2YgZ3JhcGggZWxlbWVudHMgdG8gc3RhcnQgd2l0aFxyXG5cclxuICAgICAgICBzdHlsZTogWyAvLyB0aGUgc3R5bGVzaGVldCBmb3IgdGhlIGdyYXBoXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGVjdG9yOiAnbm9kZScsXHJcbiAgICAgICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgIFwid2lkdGhcIjp0aGlzLmRlZmF1bHROb2RlU2l6ZSxcImhlaWdodFwiOnRoaXMuZGVmYXVsdE5vZGVTaXplLFxyXG4gICAgICAgICAgICAgICAgICAgICdsYWJlbCc6ICdkYXRhKGlkKScsXHJcbiAgICAgICAgICAgICAgICAgICAgJ29wYWNpdHknOjAuOSxcclxuICAgICAgICAgICAgICAgICAgICAnZm9udC1zaXplJzpcIjEycHhcIixcclxuICAgICAgICAgICAgICAgICAgICAnZm9udC1mYW1pbHknOidHZW5ldmEsIEFyaWFsLCBIZWx2ZXRpY2EsIHNhbnMtc2VyaWYnXHJcbiAgICAgICAgICAgICAgICAgICAgLy8sJ2JhY2tncm91bmQtaW1hZ2UnOiBmdW5jdGlvbihlbGUpeyByZXR1cm4gXCJpbWFnZXMvY2F0LnBuZ1wiOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgLy8sJ2JhY2tncm91bmQtZml0JzonY29udGFpbicgLy9jb3ZlclxyXG4gICAgICAgICAgICAgICAgICAgICwnYmFja2dyb3VuZC13aWR0aCc6JzcwJSdcclxuICAgICAgICAgICAgICAgICAgICAsJ2JhY2tncm91bmQtaGVpZ2h0JzonNzAlJ1xyXG4gICAgICAgICAgICAgICAgICAgIC8vJ2JhY2tncm91bmQtY29sb3InOiBmdW5jdGlvbiggZWxlICl7IHJldHVybiBlbGUuZGF0YSgnYmcnKSB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHNlbGVjdG9yOiAnZWRnZScsXHJcbiAgICAgICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgICAgICd3aWR0aCc6MixcclxuICAgICAgICAgICAgICAgICAgICAnbGluZS1jb2xvcic6ICcjODg4JyxcclxuICAgICAgICAgICAgICAgICAgICAndGFyZ2V0LWFycm93LWNvbG9yJzogJyM1NTUnLFxyXG4gICAgICAgICAgICAgICAgICAgICd0YXJnZXQtYXJyb3ctc2hhcGUnOiAndHJpYW5nbGUnLFxyXG4gICAgICAgICAgICAgICAgICAgICdjdXJ2ZS1zdHlsZSc6ICdiZXppZXInLFxyXG4gICAgICAgICAgICAgICAgICAgICdhcnJvdy1zY2FsZSc6MC42XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtzZWxlY3RvcjogJ2VkZ2U6c2VsZWN0ZWQnLFxyXG4gICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgJ3dpZHRoJzogMyxcclxuICAgICAgICAgICAgICAgICdsaW5lLWNvbG9yJzogJ3JlZCcsXHJcbiAgICAgICAgICAgICAgICAndGFyZ2V0LWFycm93LWNvbG9yJzogJ3JlZCcsXHJcbiAgICAgICAgICAgICAgICAnc291cmNlLWFycm93LWNvbG9yJzogJ3JlZCcsXHJcbiAgICAgICAgICAgICAgICAnbGluZS1maWxsJzpcImxpbmVhci1ncmFkaWVudFwiLFxyXG4gICAgICAgICAgICAgICAgJ2xpbmUtZ3JhZGllbnQtc3RvcC1jb2xvcnMnOlsnY3lhbicsICdtYWdlbnRhJywgJ3llbGxvdyddLFxyXG4gICAgICAgICAgICAgICAgJ2xpbmUtZ3JhZGllbnQtc3RvcC1wb3NpdGlvbnMnOlsnMCUnLCc3MCUnLCcxMDAlJ11cclxuICAgICAgICAgICAgfX0sXHJcbiAgICAgICAgICAgIHtzZWxlY3RvcjogJ25vZGU6c2VsZWN0ZWQnLFxyXG4gICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgJ2JvcmRlci1jb2xvcic6XCJyZWRcIixcclxuICAgICAgICAgICAgICAgICdib3JkZXItd2lkdGgnOjIsXHJcbiAgICAgICAgICAgICAgICAnYmFja2dyb3VuZC1maWxsJzoncmFkaWFsLWdyYWRpZW50JyxcclxuICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kLWdyYWRpZW50LXN0b3AtY29sb3JzJzpbJ2N5YW4nLCAnbWFnZW50YScsICd5ZWxsb3cnXSxcclxuICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kLWdyYWRpZW50LXN0b3AtcG9zaXRpb25zJzpbJzAlJywnNTAlJywnNjAlJ11cclxuICAgICAgICAgICAgfX0sXHJcbiAgICAgICAgICAgIHtzZWxlY3RvcjogJ25vZGUuaG92ZXInLFxyXG4gICAgICAgICAgICBzdHlsZToge1xyXG4gICAgICAgICAgICAgICAgJ2JhY2tncm91bmQtYmxhY2tlbic6MC41XHJcbiAgICAgICAgICAgIH19XHJcbiAgICAgICAgICAgICx7c2VsZWN0b3I6ICdlZGdlLmhvdmVyJyxcclxuICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6NVxyXG4gICAgICAgICAgICB9fVxyXG4gICAgICAgIF1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vY3l0b3NjYXBlIGVkZ2UgZWRpdGluZyBwbHVnLWluXHJcbiAgICB0aGlzLmNvcmUuZWRnZUVkaXRpbmcoe1xyXG4gICAgICAgIHVuZG9hYmxlOiB0cnVlLFxyXG4gICAgICAgIGJlbmRSZW1vdmFsU2Vuc2l0aXZpdHk6IDE2LFxyXG4gICAgICAgIGVuYWJsZU11bHRpcGxlQW5jaG9yUmVtb3ZhbE9wdGlvbjogdHJ1ZSxcclxuICAgICAgICBzdGlja3lBbmNob3JUb2xlcmVuY2U6IDIwLFxyXG4gICAgICAgIGFuY2hvclNoYXBlU2l6ZUZhY3RvcjogNSxcclxuICAgICAgICBlbmFibGVBbmNob3JTaXplTm90SW1wYWN0Qnlab29tOnRydWUsXHJcbiAgICAgICAgZW5hYmxlUmVtb3ZlQW5jaG9yTWlkT2ZOZWFyTGluZTpmYWxzZSxcclxuICAgICAgICBlbmFibGVDcmVhdGVBbmNob3JPbkRyYWc6ZmFsc2VcclxuICAgIH0pO1xyXG5cclxuICAgIFxyXG4gICAgdGhpcy5jb3JlLmJveFNlbGVjdGlvbkVuYWJsZWQodHJ1ZSlcclxuXHJcblxyXG4gICAgdGhpcy5jb3JlLm9uKCd0YXBzZWxlY3QnLCAoKT0+e3RoaXMuc2VsZWN0RnVuY3Rpb24oKX0pO1xyXG4gICAgdGhpcy5jb3JlLm9uKCd0YXB1bnNlbGVjdCcsICgpPT57dGhpcy5zZWxlY3RGdW5jdGlvbigpfSk7XHJcblxyXG4gICAgdGhpcy5jb3JlLm9uKCdib3hlbmQnLChlKT0+ey8vcHV0IGluc2lkZSBib3hlbmQgZXZlbnQgdG8gdHJpZ2dlciBvbmx5IG9uZSB0aW1lLCBhbmQgcmVwbGVhdGx5IGFmdGVyIGVhY2ggYm94IHNlbGVjdFxyXG4gICAgICAgIHRoaXMuY29yZS5vbmUoJ2JveHNlbGVjdCcsKCk9Pnt0aGlzLnNlbGVjdEZ1bmN0aW9uKCl9KVxyXG4gICAgfSlcclxuXHJcbiAgICB0aGlzLmNvcmUub24oJ2N4dHRhcCcsKGUpPT57XHJcbiAgICAgICAgdGhpcy5jYW5jZWxUYXJnZXROb2RlTW9kZSgpXHJcbiAgICB9KVxyXG5cclxuICAgIHRoaXMuY29yZS5vbignbW91c2VvdmVyJyxlPT57XHJcblxyXG4gICAgICAgIHRoaXMubW91c2VPdmVyRnVuY3Rpb24oZSlcclxuICAgIH0pXHJcbiAgICB0aGlzLmNvcmUub24oJ21vdXNlb3V0JyxlPT57XHJcbiAgICAgICAgdGhpcy5tb3VzZU91dEZ1bmN0aW9uKGUpXHJcbiAgICB9KVxyXG4gICAgXHJcbiAgICB0aGlzLmNvcmUub24oJ3pvb20nLChlKT0+e1xyXG4gICAgICAgIHZhciBmcz10aGlzLmdldEZvbnRTaXplSW5DdXJyZW50Wm9vbSgpO1xyXG4gICAgICAgIHZhciBkaW1lbnNpb249dGhpcy5nZXROb2RlU2l6ZUluQ3VycmVudFpvb20oKTtcclxuXHJcbiAgICAgICAgdmFyIGFycj1bXHJcbiAgICAgICAgICAgIHtzZWxlY3Rvcjonbm9kZScsc3R5bGU6eyAnZm9udC1zaXplJzogZnMsIHdpZHRoOiBkaW1lbnNpb24sIGhlaWdodDogZGltZW5zaW9uIH19LFxyXG4gICAgICAgICAgICB7c2VsZWN0b3I6J25vZGU6c2VsZWN0ZWQnLHN0eWxlOnsgJ2JvcmRlci13aWR0aCc6IE1hdGguY2VpbChkaW1lbnNpb24gLyAxNSkgfX0sXHJcbiAgICAgICAgXVxyXG4gICAgICAgIGZvciAodmFyIG1vZGVsSUQgaW4gdGhpcy5ub2RlU2l6ZU1vZGVsQWRqdXN0bWVudFJhdGlvKSB7XHJcbiAgICAgICAgICAgIHZhciBuZXdEaW1lbnNpb24gPSBNYXRoLmNlaWwodGhpcy5ub2RlU2l6ZU1vZGVsQWRqdXN0bWVudFJhdGlvW21vZGVsSURdICogZGltZW5zaW9uKVxyXG4gICAgICAgICAgICBhcnIucHVzaCh7c2VsZWN0b3I6J25vZGVbbW9kZWxJRCA9IFwiJyArIG1vZGVsSUQgKyAnXCJdJyxzdHlsZTp7IHdpZHRoOiBuZXdEaW1lbnNpb24sIGhlaWdodDogbmV3RGltZW5zaW9uIH19KVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnVwZGF0ZVN0eWxlU2hlZXQoYXJyKVxyXG4gICAgfSlcclxuXHJcbiAgICB2YXIgaW5zdGFuY2UgPSB0aGlzLmNvcmUuZWRnZUVkaXRpbmcoJ2dldCcpO1xyXG4gICAgdmFyIHRhcGRyYWdIYW5kbGVyPShlKSA9PiB7XHJcbiAgICAgICAgaW5zdGFuY2Uua2VlcEFuY2hvcnNBYnNvbHV0ZVBvc2l0aW9uRHVyaW5nTW92aW5nKClcclxuICAgICAgICBpZihlLnRhcmdldC5pc05vZGUgJiYgZS50YXJnZXQuaXNOb2RlKCkpIHRoaXMuZHJhZ2dpbmdOb2RlPWUudGFyZ2V0XHJcbiAgICAgICAgdGhpcy5zbWFydFBvc2l0aW9uTm9kZShlLnBvc2l0aW9uKVxyXG4gICAgfVxyXG4gICAgdmFyIHNldE9uZVRpbWVHcmFiID0gKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuY29yZS5vbmNlKFwiZ3JhYlwiLCAoZSkgPT4ge1xyXG4gICAgICAgICAgICB2YXIgZHJhZ2dpbmdOb2RlcyA9IHRoaXMuY29yZS5jb2xsZWN0aW9uKClcclxuICAgICAgICAgICAgaWYgKGUudGFyZ2V0LmlzTm9kZSgpKSBkcmFnZ2luZ05vZGVzLm1lcmdlKGUudGFyZ2V0KVxyXG4gICAgICAgICAgICB2YXIgYXJyID0gdGhpcy5jb3JlLiQoXCI6c2VsZWN0ZWRcIilcclxuICAgICAgICAgICAgYXJyLmZvckVhY2goKGVsZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGVsZS5pc05vZGUoKSkgZHJhZ2dpbmdOb2Rlcy5tZXJnZShlbGUpXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIGluc3RhbmNlLnN0b3JlQW5jaG9yc0Fic29sdXRlUG9zaXRpb24oZHJhZ2dpbmdOb2RlcylcclxuICAgICAgICAgICAgdGhpcy5jb3JlLm9uKFwidGFwZHJhZ1wiLHRhcGRyYWdIYW5kbGVyIClcclxuICAgICAgICAgICAgc2V0T25lVGltZUZyZWUoKVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbiAgICB2YXIgc2V0T25lVGltZUZyZWUgPSAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5jb3JlLm9uY2UoXCJmcmVlXCIsIChlKSA9PiB7XHJcbiAgICAgICAgICAgIHZhciBpbnN0YW5jZSA9IHRoaXMuY29yZS5lZGdlRWRpdGluZygnZ2V0Jyk7XHJcbiAgICAgICAgICAgIGluc3RhbmNlLnJlc2V0QW5jaG9yc0Fic29sdXRlUG9zaXRpb24oKVxyXG4gICAgICAgICAgICB0aGlzLmRyYWdnaW5nTm9kZT1udWxsXHJcbiAgICAgICAgICAgIHNldE9uZVRpbWVHcmFiKClcclxuICAgICAgICAgICAgdGhpcy5jb3JlLnJlbW92ZUxpc3RlbmVyKFwidGFwZHJhZ1wiLHRhcGRyYWdIYW5kbGVyKVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbiAgICBzZXRPbmVUaW1lR3JhYigpXHJcblxyXG4gICAgdmFyIHVyID0gdGhpcy5jb3JlLnVuZG9SZWRvKHtpc0RlYnVnOiBmYWxzZX0pO1xyXG4gICAgdGhpcy51cj11ciAgICBcclxuICAgIHRoaXMuY29yZS50cmlnZ2VyKFwiem9vbVwiKVxyXG4gICAgdGhpcy5zZXRLZXlEb3duRnVuYygpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5zbWFydFBvc2l0aW9uTm9kZSA9IGZ1bmN0aW9uIChtb3VzZVBvc2l0aW9uKSB7XHJcbiAgICB2YXIgem9vbUxldmVsPXRoaXMuY29yZS56b29tKClcclxuICAgIGlmKCF0aGlzLmRyYWdnaW5nTm9kZSkgcmV0dXJuXHJcbiAgICAvL2NvbXBhcmluZyBub2RlcyBzZXQ6IGl0cyBjb25uZWN0ZnJvbSBub2RlcyBhbmQgdGhlaXIgY29ubmVjdHRvIG5vZGVzLCBpdHMgY29ubmVjdHRvIG5vZGVzIGFuZCB0aGVpciBjb25uZWN0ZnJvbSBub2Rlc1xyXG4gICAgdmFyIGluY29tZXJzPXRoaXMuZHJhZ2dpbmdOb2RlLmluY29tZXJzKClcclxuICAgIHZhciBvdXRlckZyb21JbmNvbT0gaW5jb21lcnMub3V0Z29lcnMoKVxyXG4gICAgdmFyIG91dGVyPXRoaXMuZHJhZ2dpbmdOb2RlLm91dGdvZXJzKClcclxuICAgIHZhciBpbmNvbUZyb21PdXRlcj1vdXRlci5pbmNvbWVycygpXHJcbiAgICB2YXIgbW9uaXRvclNldD1pbmNvbWVycy51bmlvbihvdXRlckZyb21JbmNvbSkudW5pb24ob3V0ZXIpLnVuaW9uKGluY29tRnJvbU91dGVyKS5maWx0ZXIoJ25vZGUnKS51bm1lcmdlKHRoaXMuZHJhZ2dpbmdOb2RlKVxyXG5cclxuICAgIHZhciByZXR1cm5FeHBlY3RlZFBvcz0oZGlmZkFycixwb3NBcnIpPT57XHJcbiAgICAgICAgdmFyIG1pbkRpc3RhbmNlPU1hdGgubWluKC4uLmRpZmZBcnIpXHJcbiAgICAgICAgaWYobWluRGlzdGFuY2Uqem9vbUxldmVsIDwgMTApICByZXR1cm4gcG9zQXJyW2RpZmZBcnIuaW5kZXhPZihtaW5EaXN0YW5jZSldXHJcbiAgICAgICAgZWxzZSByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgeERpZmY9W11cclxuICAgIHZhciB4UG9zPVtdXHJcbiAgICB2YXIgeURpZmY9W11cclxuICAgIHZhciB5UG9zPVtdXHJcbiAgICBtb25pdG9yU2V0LmZvckVhY2goKGVsZSk9PntcclxuICAgICAgICB4RGlmZi5wdXNoKE1hdGguYWJzKGVsZS5wb3NpdGlvbigpLngtbW91c2VQb3NpdGlvbi54KSlcclxuICAgICAgICB4UG9zLnB1c2goZWxlLnBvc2l0aW9uKCkueClcclxuICAgICAgICB5RGlmZi5wdXNoKE1hdGguYWJzKGVsZS5wb3NpdGlvbigpLnktbW91c2VQb3NpdGlvbi55KSlcclxuICAgICAgICB5UG9zLnB1c2goZWxlLnBvc2l0aW9uKCkueSlcclxuICAgIH0pXHJcbiAgICB2YXIgcHJlZlg9cmV0dXJuRXhwZWN0ZWRQb3MoeERpZmYseFBvcylcclxuICAgIHZhciBwcmVmWT1yZXR1cm5FeHBlY3RlZFBvcyh5RGlmZix5UG9zKVxyXG4gICAgaWYocHJlZlghPW51bGwpIHtcclxuICAgICAgICB0aGlzLmRyYWdnaW5nTm9kZS5wb3NpdGlvbigneCcsIHByZWZYKTtcclxuICAgIH1cclxuICAgIGlmKHByZWZZIT1udWxsKSB7XHJcbiAgICAgICAgdGhpcy5kcmFnZ2luZ05vZGUucG9zaXRpb24oJ3knLCBwcmVmWSk7XHJcbiAgICB9XHJcbiAgICAvL2NvbnNvbGUubG9nKFwiLS0tLVwiKVxyXG4gICAgLy9tb25pdG9yU2V0LmZvckVhY2goKGVsZSk9Pntjb25zb2xlLmxvZyhlbGUuaWQoKSl9KVxyXG4gICAgLy9jb25zb2xlLmxvZyhtb25pdG9yU2V0LnNpemUoKSlcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLm1vdXNlT3ZlckZ1bmN0aW9uPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgaWYoIWUudGFyZ2V0LmRhdGEpIHJldHVyblxyXG5cclxuICAgIHZhciBpbmZvPWUudGFyZ2V0LmRhdGEoKS5vcmlnaW5hbEluZm9cclxuICAgIGlmKGluZm89PW51bGwpIHJldHVybjtcclxuICAgIGlmKHRoaXMubGFzdEhvdmVyVGFyZ2V0KSB0aGlzLmxhc3RIb3ZlclRhcmdldC5yZW1vdmVDbGFzcyhcImhvdmVyXCIpXHJcbiAgICB0aGlzLmxhc3RIb3ZlclRhcmdldD1lLnRhcmdldFxyXG4gICAgZS50YXJnZXQuYWRkQ2xhc3MoXCJob3ZlclwiKVxyXG4gICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwic2hvd0luZm9Ib3ZlcmVkRWxlXCIsIFwiaW5mb1wiOiBbaW5mb10sXCJzY3JlZW5YWVwiOnRoaXMuY29udmVydFBvc2l0aW9uKGUucG9zaXRpb24ueCxlLnBvc2l0aW9uLnkpIH0pXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5jb252ZXJ0UG9zaXRpb249ZnVuY3Rpb24oeCx5KXtcclxuICAgIHZhciB2cEV4dGVudD10aGlzLmNvcmUuZXh0ZW50KClcclxuICAgIHZhciBzY3JlZW5XPXRoaXMuRE9NLndpZHRoKClcclxuICAgIHZhciBzY3JlZW5IPXRoaXMuRE9NLmhlaWdodCgpXHJcbiAgICB2YXIgc2NyZWVuWCA9ICh4LXZwRXh0ZW50LngxKS8odnBFeHRlbnQudykqc2NyZWVuVyArIHRoaXMuRE9NLm9mZnNldCgpLmxlZnRcclxuICAgIHZhciBzY3JlZW5ZPSh5LXZwRXh0ZW50LnkxKS8odnBFeHRlbnQuaCkqc2NyZWVuSCsgdGhpcy5ET00ub2Zmc2V0KCkudG9wXHJcbiAgICByZXR1cm4ge3g6c2NyZWVuWCx5OnNjcmVlbll9XHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5tb3VzZU91dEZ1bmN0aW9uPSBmdW5jdGlvbiAoZSkge1xyXG4gICAgaWYoIWdsb2JhbENhY2hlLnNob3dGbG9hdEluZm9QYW5lbCl7IC8vc2luY2UgZmxvYXRpbmcgd2luZG93IGlzIHVzZWQgZm9yIG1vdXNlIGhvdmVyIGVsZW1lbnQgaW5mbywgc28gaW5mbyBwYW5lbCBuZXZlciBjaGFnbmUgYmVmb3JlLCB0aGF0IGlzIHdoeSB0aGVyZSBpcyBubyBuZWVkIHRvIHJlc3RvcmUgYmFjayB0aGUgaW5mbyBwYW5lbCBpbmZvcm1hdGlvbiBhdCBtb3VzZW91dFxyXG4gICAgICAgIGlmKGdsb2JhbENhY2hlLnNob3dpbmdDcmVhdGVUd2luTW9kZWxJRCl7XHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInNob3dJbmZvR3JvdXBOb2RlXCIsIFwiaW5mb1wiOiB7XCJAaWRcIjpnbG9iYWxDYWNoZS5zaG93aW5nQ3JlYXRlVHdpbk1vZGVsSUR9IH0pXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0RnVuY3Rpb24oKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIFxyXG4gICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwidG9wb2xvZ3lNb3VzZU91dFwifSlcclxuXHJcbiAgICBpZih0aGlzLmxhc3RIb3ZlclRhcmdldCl7XHJcbiAgICAgICAgdGhpcy5sYXN0SG92ZXJUYXJnZXQucmVtb3ZlQ2xhc3MoXCJob3ZlclwiKVxyXG4gICAgICAgIHRoaXMubGFzdEhvdmVyVGFyZ2V0PW51bGw7XHJcbiAgICB9IFxyXG5cclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnNlbGVjdEZ1bmN0aW9uID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGFyciA9IHRoaXMuY29yZS4kKFwiOnNlbGVjdGVkXCIpXHJcbiAgICB2YXIgcmUgPSBbXVxyXG4gICAgYXJyLmZvckVhY2goKGVsZSkgPT4geyByZS5wdXNoKGVsZS5kYXRhKCkub3JpZ2luYWxJbmZvKSB9KVxyXG4gICAgZ2xvYmFsQ2FjaGUuc2hvd2luZ0NyZWF0ZVR3aW5Nb2RlbElEPW51bGw7IFxyXG4gICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwic2hvd0luZm9TZWxlY3RlZE5vZGVzXCIsIGluZm86IHJlIH0pXHJcblxyXG4gICAgLy9mb3IgZGVidWdnaW5nIHB1cnBvc2VcclxuICAgIC8vYXJyLmZvckVhY2goKGVsZSk9PntcclxuICAgIC8vICBjb25zb2xlLmxvZyhcIlwiKVxyXG4gICAgLy99KVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuZ2V0Rm9udFNpemVJbkN1cnJlbnRab29tPWZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgY3VyWm9vbT10aGlzLmNvcmUuem9vbSgpXHJcbiAgICBpZihjdXJab29tPjEpe1xyXG4gICAgICAgIHZhciBtYXhGUz0xMlxyXG4gICAgICAgIHZhciBtaW5GUz01XHJcbiAgICAgICAgdmFyIHJhdGlvPSAobWF4RlMvbWluRlMtMSkvOSooY3VyWm9vbS0xKSsxXHJcbiAgICAgICAgdmFyIGZzPU1hdGguY2VpbChtYXhGUy9yYXRpbylcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHZhciBtYXhGUz0xMjBcclxuICAgICAgICB2YXIgbWluRlM9MTJcclxuICAgICAgICB2YXIgcmF0aW89IChtYXhGUy9taW5GUy0xKS85KigxL2N1clpvb20tMSkrMVxyXG4gICAgICAgIHZhciBmcz1NYXRoLmNlaWwobWluRlMqcmF0aW8pXHJcbiAgICB9XHJcbiAgICByZXR1cm4gZnM7XHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5nZXROb2RlU2l6ZUluQ3VycmVudFpvb209ZnVuY3Rpb24oKXtcclxuICAgIHZhciBjdXJab29tPXRoaXMuY29yZS56b29tKClcclxuICAgIGlmKGN1clpvb20+MSl7Ly9zY2FsZSB1cCBidXQgbm90IHRvbyBtdWNoXHJcbiAgICAgICAgdmFyIHJhdGlvPSAoY3VyWm9vbS0xKSooMi0xKS85KzFcclxuICAgICAgICByZXR1cm4gTWF0aC5jZWlsKHRoaXMuZGVmYXVsdE5vZGVTaXplL3JhdGlvKVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgdmFyIHJhdGlvPSAoMS9jdXJab29tLTEpKig0LTEpLzkrMVxyXG4gICAgICAgIHJldHVybiBNYXRoLmNlaWwodGhpcy5kZWZhdWx0Tm9kZVNpemUqcmF0aW8pXHJcbiAgICB9XHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS51cGRhdGVTdHlsZVNoZWV0PWZ1bmN0aW9uKHN0eWxlQXJyKXtcclxuICAgIC8vcmVzZXJ2ZSB0aGUgdHdvIHN0eWxlcyBvZiBlZGdlZWRpdGluZyBwbHVnaW4gZmlyc3QsIHJpZ2h0IG5vdyB0aGVyZSBpcyBubyBiZXR0ZXIgd2F5IHRvIHJlc2VydmUgdGhlbVxyXG4gICAgdmFyIGFsbFN0eWxlPXRoaXMuY29yZS5zdHlsZSgpXHJcbiAgICB2YXIgZWRnZUJlbmRTdHlsZT1udWxsXHJcbiAgICB2YXIgZWRnZUNvbnRyb2xTdHlsZT1udWxsXHJcbiAgICBmb3IodmFyIGluZCBpbiBhbGxTdHlsZSl7XHJcbiAgICAgICAgaWYodHlwZW9mKGFsbFN0eWxlW2luZF0pIT1cIm9iamVjdFwiKSBjb250aW51ZVxyXG4gICAgICAgIGlmKCFhbGxTdHlsZVtpbmRdLnNlbGVjdG9yKSBjb250aW51ZVxyXG4gICAgICAgIHZhciBzdHI9YWxsU3R5bGVbaW5kXS5zZWxlY3Rvci5pbnB1dFRleHRcclxuICAgICAgICBpZihzdHI9PVwiLmVkZ2ViZW5kZWRpdGluZy1oYXNiZW5kcG9pbnRzXCIpe1xyXG4gICAgICAgICAgICBlZGdlQmVuZFN0eWxlPWFsbFN0eWxlW2luZF1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoc3RyPT1cIi5lZGdlY29udHJvbGVkaXRpbmctaGFzY29udHJvbHBvaW50c1wiKXtcclxuICAgICAgICAgICAgZWRnZUNvbnRyb2xTdHlsZT1hbGxTdHlsZVtpbmRdXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vZG8gc3R5bGUgbWVyZ2luZ1xyXG4gICAgdmFyIG1lcmdlU2VsZWN0b3I9e31cclxuICAgIHN0eWxlQXJyLmZvckVhY2goZWxlPT57XHJcbiAgICAgICAgbWVyZ2VTZWxlY3RvcltlbGUuc2VsZWN0b3JdPWVsZS5zdHlsZVxyXG4gICAgfSlcclxuXHJcbiAgICB2YXIgc3R5bGVKc29uID0gdGhpcy5jb3JlLnN0eWxlKCkuanNvbigpO1xyXG4gICAgdmFyIGFycj1bXVxyXG4gICAgZm9yKHZhciBpbmQgaW4gc3R5bGVKc29uKXtcclxuICAgICAgICBpZihtZXJnZVNlbGVjdG9yW3N0eWxlSnNvbltpbmRdLnNlbGVjdG9yXSkge1xyXG4gICAgICAgICAgICB2YXIgb2xkcz0gc3R5bGVKc29uW2luZF0uc3R5bGVcclxuICAgICAgICAgICAgdmFyIG5ld3M9bWVyZ2VTZWxlY3RvcltzdHlsZUpzb25baW5kXS5zZWxlY3Rvcl0gXHJcbiAgICAgICAgICAgIGZvcih2YXIgaW5kIGluIG9sZHMpe1xyXG4gICAgICAgICAgICAgICAgaWYobmV3c1tpbmRdIT1udWxsKSBjb250aW51ZVxyXG4gICAgICAgICAgICAgICAgbmV3c1tpbmRdPW9sZHNbaW5kXVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnRpbnVlXHJcbiAgICAgICAgfWVsc2UgaWYoc3R5bGVKc29uW2luZF0uc2VsZWN0b3I9PVwiLmVkZ2ViZW5kZWRpdGluZy1oYXNiZW5kcG9pbnRzXCIgfHxzdHlsZUpzb25baW5kXS5zZWxlY3Rvcj09XCIuZWRnZWNvbnRyb2xlZGl0aW5nLWhhc2NvbnRyb2xwb2ludHNcIiApIGNvbnRpbnVlXHJcbiAgICAgICAgXHJcbiAgICAgICAgYXJyLnB1c2goc3R5bGVKc29uW2luZF0pXHJcbiAgICB9XHJcbiAgICBhcnI9YXJyLmNvbmNhdChzdHlsZUFycilcclxuICAgIHRoaXMuY29yZS5zdHlsZSgpLmZyb21Kc29uKGFycikudXBkYXRlKClcclxuICAgIGlmKGVkZ2VCZW5kU3R5bGUpe1xyXG4gICAgICAgIGFsbFN0eWxlPXRoaXMuY29yZS5zdHlsZSgpXHJcbiAgICAgICAgdmFyIGN1ckxlbj1hbGxTdHlsZS5sZW5ndGg7XHJcbiAgICAgICAgYWxsU3R5bGUubGVuZ3RoPWN1ckxlbisyXHJcbiAgICAgICAgYWxsU3R5bGVbY3VyTGVuXT1lZGdlQmVuZFN0eWxlXHJcbiAgICAgICAgYWxsU3R5bGVbY3VyTGVuKzFdPWVkZ2VDb250cm9sU3R5bGVcclxuICAgIH1cclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnVwZGF0ZU1vZGVsQXZhcnRhPWZ1bmN0aW9uKG1vZGVsSUQsZGF0YVVybCl7XHJcbiAgICB0cnl7XHJcbiAgICAgICAgdGhpcy51cGRhdGVTdHlsZVNoZWV0KFtcclxuICAgICAgICAgICAge3NlbGVjdG9yOidub2RlW21vZGVsSUQgPSBcIicrbW9kZWxJRCsnXCJdJyxzdHlsZTp7J2JhY2tncm91bmQtaW1hZ2UnOiBkYXRhVXJsfX1cclxuICAgICAgICBdKVxyXG4gICAgfWNhdGNoKGUpe1xyXG4gICAgICAgIFxyXG4gICAgfSAgXHJcbiAgICBcclxufVxyXG50b3BvbG9neURPTS5wcm90b3R5cGUudXBkYXRlTW9kZWxUd2luQ29sb3I9ZnVuY3Rpb24obW9kZWxJRCxjb2xvckNvZGUsc2Vjb25kQ29sb3JDb2RlKXtcclxuICAgIHZhciBzdHlsZUpzb24gPSB0aGlzLmNvcmUuc3R5bGUoKS5qc29uKCk7XHJcbiAgICB2YXIgYXJyPVtdXHJcbiAgICBmb3IodmFyIGluZCBpbiBzdHlsZUpzb24pe1xyXG4gICAgICAgIGFyci5wdXNoKHN0eWxlSnNvbltpbmRdLnNlbGVjdG9yKVxyXG4gICAgfVxyXG5cclxuICAgIHZhciBzdHlsZVNlbGVjdG9yPSdub2RlW21vZGVsSUQgPSBcIicgKyBtb2RlbElEICsgJ1wiXSdcclxuICAgIHZhciBzdHlsZU9iaj1udWxsXHJcbiAgICBpZiAoc2Vjb25kQ29sb3JDb2RlID09IG51bGwpIHtcclxuICAgICAgICBpZihjb2xvckNvZGU9PVwibm9uZVwiKXtcclxuICAgICAgICAgICAgc3R5bGVPYmo9eyAnYmFja2dyb3VuZC1maWxsJzogJ3NvbGlkJywnYmFja2dyb3VuZC1jb2xvcic6ICdkYXJrR3JheScsJ2JhY2tncm91bmQtb3BhY2l0eSc6MCB9XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHN0eWxlT2JqPXsgJ2JhY2tncm91bmQtZmlsbCc6ICdzb2xpZCcsJ2JhY2tncm91bmQtY29sb3InOiBjb2xvckNvZGUgLCdiYWNrZ3JvdW5kLW9wYWNpdHknOjF9XHJcbiAgICAgICAgfVxyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBjb2xvckNvZGU9Y29sb3JDb2RlfHxcImRhcmtHcmF5XCJcclxuICAgICAgICBpZihjb2xvckNvZGU9PVwibm9uZVwiKSBjb2xvckNvZGU9XCJkYXJrR3JheVwiXHJcbiAgICAgICAgc3R5bGVPYmo9e1xyXG4gICAgICAgICAgICAgICAgJ2JhY2tncm91bmQtZmlsbCc6ICdsaW5lYXItZ3JhZGllbnQnLFxyXG4gICAgICAgICAgICAgICAgJ2JhY2tncm91bmQtZ3JhZGllbnQtc3RvcC1jb2xvcnMnOiBbY29sb3JDb2RlLCBjb2xvckNvZGUsIHNlY29uZENvbG9yQ29kZV0sXHJcbiAgICAgICAgICAgICAgICAnYmFja2dyb3VuZC1ncmFkaWVudC1zdG9wLXBvc2l0aW9ucyc6IFsnMCUnLCAnNTAlJywgJzUxJSddXHJcbiAgICAgICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmKHN0eWxlT2JqKSB0aGlzLnVwZGF0ZVN0eWxlU2hlZXQoW3tzZWxlY3RvcjpzdHlsZVNlbGVjdG9yLHN0eWxlOnN0eWxlT2JqfV0pIFxyXG59XHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS51cGRhdGVNb2RlbFR3aW5TaGFwZT1mdW5jdGlvbihtb2RlbElELHNoYXBlKXtcclxuICAgIHZhciBuZXdTdHlsZVxyXG4gICAgaWYoc2hhcGU9PVwiaGV4YWdvblwiKXtcclxuICAgICAgICBuZXdTdHlsZT17c2VsZWN0b3I6J25vZGVbbW9kZWxJRCA9IFwiJyttb2RlbElEKydcIl0nLHN0eWxlOnsnc2hhcGUnOiAncG9seWdvbicsJ3NoYXBlLXBvbHlnb24tcG9pbnRzJzpbMCwtMSwwLjg2NiwtMC41LDAuODY2LDAuNSwwLDEsLTAuODY2LDAuNSwtMC44NjYsLTAuNV19fVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgbmV3U3R5bGU9e3NlbGVjdG9yOidub2RlW21vZGVsSUQgPSBcIicrbW9kZWxJRCsnXCJdJyxzdHlsZTp7J3NoYXBlJzogc2hhcGV9fVxyXG4gICAgfVxyXG4gICAgdGhpcy51cGRhdGVTdHlsZVNoZWV0KFtuZXdTdHlsZV0pXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS51cGRhdGVNb2RlbFR3aW5EaW1lbnNpb249ZnVuY3Rpb24obW9kZWxJRCxkaW1lbnNpb25SYXRpbyl7XHJcbiAgICB0aGlzLm5vZGVTaXplTW9kZWxBZGp1c3RtZW50UmF0aW9bbW9kZWxJRF09cGFyc2VGbG9hdChkaW1lbnNpb25SYXRpbylcclxuICAgIHRoaXMuY29yZS50cmlnZ2VyKFwiem9vbVwiKVxyXG59XHJcblxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnVwZGF0ZVJlbGF0aW9uc2hpcENvbG9yPWZ1bmN0aW9uKHNyY01vZGVsSUQscmVsYXRpb25zaGlwTmFtZSxjb2xvckNvZGUpe1xyXG4gICAgdGhpcy51cGRhdGVTdHlsZVNoZWV0KFtcclxuICAgICAgICB7c2VsZWN0b3I6J2VkZ2Vbc291cmNlTW9kZWwgPSBcIicrc3JjTW9kZWxJRCsnXCJdW3JlbGF0aW9uc2hpcE5hbWUgPSBcIicrcmVsYXRpb25zaGlwTmFtZSsnXCJdJywgc3R5bGU6eydsaW5lLWNvbG9yJzogY29sb3JDb2RlfX1cclxuICAgIF0pXHJcbn1cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnVwZGF0ZVJlbGF0aW9uc2hpcFNoYXBlPWZ1bmN0aW9uKHNyY01vZGVsSUQscmVsYXRpb25zaGlwTmFtZSxzaGFwZSl7XHJcbiAgICB2YXIgbmV3U3R5bGVcclxuICAgIGlmKHNoYXBlPT1cInNvbGlkXCIpe1xyXG4gICAgICAgIG5ld1N0eWxlPXtzZWxlY3RvcjonZWRnZVtzb3VyY2VNb2RlbCA9IFwiJytzcmNNb2RlbElEKydcIl1bcmVsYXRpb25zaGlwTmFtZSA9IFwiJytyZWxhdGlvbnNoaXBOYW1lKydcIl0nLCBzdHlsZTp7J2xpbmUtc3R5bGUnOiBzaGFwZX19XHJcbiAgICB9ZWxzZSBpZihzaGFwZT09XCJkb3R0ZWRcIil7XHJcbiAgICAgICAgbmV3U3R5bGU9e3NlbGVjdG9yOidlZGdlW3NvdXJjZU1vZGVsID0gXCInK3NyY01vZGVsSUQrJ1wiXVtyZWxhdGlvbnNoaXBOYW1lID0gXCInK3JlbGF0aW9uc2hpcE5hbWUrJ1wiXScsIHN0eWxlOnsnbGluZS1zdHlsZSc6ICdkYXNoZWQnLCdsaW5lLWRhc2gtcGF0dGVybic6WzgsOF19fVxyXG4gICAgfVxyXG4gICAgdGhpcy51cGRhdGVTdHlsZVNoZWV0KFtuZXdTdHlsZV0pICAgIFxyXG59XHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS51cGRhdGVSZWxhdGlvbnNoaXBXaWR0aD1mdW5jdGlvbihzcmNNb2RlbElELHJlbGF0aW9uc2hpcE5hbWUsZWRnZVdpZHRoKXtcclxuICAgIHZhciBhcnI9W1xyXG4gICAgICAgIHtzZWxlY3RvcjonZWRnZVtzb3VyY2VNb2RlbCA9IFwiJytzcmNNb2RlbElEKydcIl1bcmVsYXRpb25zaGlwTmFtZSA9IFwiJytyZWxhdGlvbnNoaXBOYW1lKydcIl0nLHN0eWxlOnsnd2lkdGgnOnBhcnNlRmxvYXQoZWRnZVdpZHRoKX19LFxyXG4gICAgICAgIHtzZWxlY3RvcjonZWRnZTpzZWxlY3RlZFtzb3VyY2VNb2RlbCA9IFwiJytzcmNNb2RlbElEKydcIl1bcmVsYXRpb25zaGlwTmFtZSA9IFwiJytyZWxhdGlvbnNoaXBOYW1lKydcIl0nLHN0eWxlOnsnd2lkdGgnOnBhcnNlRmxvYXQoZWRnZVdpZHRoKSsxLCdsaW5lLWNvbG9yJzogJ3JlZCd9fSxcclxuICAgICAgICB7c2VsZWN0b3I6J2VkZ2UuaG92ZXJbc291cmNlTW9kZWwgPSBcIicrc3JjTW9kZWxJRCsnXCJdW3JlbGF0aW9uc2hpcE5hbWUgPSBcIicrcmVsYXRpb25zaGlwTmFtZSsnXCJdJyxzdHlsZTp7J3dpZHRoJzpwYXJzZUZsb2F0KGVkZ2VXaWR0aCkrM319XHJcbiAgICBdXHJcbiAgICB0aGlzLnVwZGF0ZVN0eWxlU2hlZXQoYXJyKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuZGVsZXRlUmVsYXRpb25zPWZ1bmN0aW9uKHJlbGF0aW9ucyl7XHJcbiAgICByZWxhdGlvbnMuZm9yRWFjaChvbmVSZWxhdGlvbj0+e1xyXG4gICAgICAgIHZhciBzcmNJRD1vbmVSZWxhdGlvbltcInNyY0lEXCJdXHJcbiAgICAgICAgdmFyIHJlbGF0aW9uSUQ9b25lUmVsYXRpb25bXCJyZWxJRFwiXVxyXG4gICAgICAgIHZhciB0aGVOb2RlPXRoaXMuY29yZS5maWx0ZXIoJ1tpZCA9IFwiJytzcmNJRCsnXCJdJyk7XHJcbiAgICAgICAgdmFyIGVkZ2VzPXRoZU5vZGUuY29ubmVjdGVkRWRnZXMoKS50b0FycmF5KClcclxuICAgICAgICBmb3IodmFyIGk9MDtpPGVkZ2VzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICB2YXIgYW5FZGdlPWVkZ2VzW2ldXHJcbiAgICAgICAgICAgIGlmKGFuRWRnZS5kYXRhKFwib3JpZ2luYWxJbmZvXCIpW1wiJHJlbGF0aW9uc2hpcElkXCJdPT1yZWxhdGlvbklEKXtcclxuICAgICAgICAgICAgICAgIGFuRWRnZS5yZW1vdmUoKVxyXG4gICAgICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pICAgXHJcbn1cclxuXHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuZGVsZXRlVHdpbnM9ZnVuY3Rpb24odHdpbklEQXJyKXtcclxuICAgIHR3aW5JREFyci5mb3JFYWNoKHR3aW5JRD0+e1xyXG4gICAgICAgIHRoaXMuY29yZS4kKCdbaWQgPSBcIicrdHdpbklEKydcIl0nKS5yZW1vdmUoKVxyXG4gICAgfSkgICBcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmFuaW1hdGVBTm9kZT1mdW5jdGlvbih0d2luKXtcclxuICAgIHZhciBjdXJEaW1lbnNpb249IHR3aW4ud2lkdGgoKVxyXG4gICAgdHdpbi5hbmltYXRlKHtcclxuICAgICAgICBzdHlsZTogeyAnaGVpZ2h0JzogY3VyRGltZW5zaW9uKjIsJ3dpZHRoJzogY3VyRGltZW5zaW9uKjIgfSxcclxuICAgICAgICBkdXJhdGlvbjogMjAwXHJcbiAgICB9KTtcclxuXHJcbiAgICBzZXRUaW1lb3V0KCgpPT57XHJcbiAgICAgICAgdHdpbi5hbmltYXRlKHtcclxuICAgICAgICAgICAgc3R5bGU6IHsgJ2hlaWdodCc6IGN1ckRpbWVuc2lvbiwnd2lkdGgnOiBjdXJEaW1lbnNpb24gfSxcclxuICAgICAgICAgICAgZHVyYXRpb246IDIwMFxyXG4gICAgICAgICAgICAsY29tcGxldGU6KCk9PntcclxuICAgICAgICAgICAgICAgIHR3aW4ucmVtb3ZlU3R5bGUoKSAvL211c3QgcmVtb3ZlIHRoZSBzdHlsZSBhZnRlciBhbmltYXRpb24sIG90aGVyd2lzZSB0aGV5IHdpbGwgaGF2ZSB0aGVpciBvd24gc3R5bGVcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSwyMDApXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5kcmF3VHdpbnM9ZnVuY3Rpb24odHdpbnNEYXRhLGFuaW1hdGlvbil7XHJcbiAgICB2YXIgYXJyPVtdXHJcbiAgICBmb3IodmFyIGk9MDtpPHR3aW5zRGF0YS5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIgb3JpZ2luYWxJbmZvPXR3aW5zRGF0YVtpXTtcclxuICAgICAgICB2YXIgbmV3Tm9kZT17ZGF0YTp7fSxncm91cDpcIm5vZGVzXCJ9XHJcbiAgICAgICAgbmV3Tm9kZS5kYXRhW1wib3JpZ2luYWxJbmZvXCJdPSBvcmlnaW5hbEluZm87XHJcbiAgICAgICAgbmV3Tm9kZS5kYXRhW1wiaWRcIl09b3JpZ2luYWxJbmZvWyckZHRJZCddXHJcbiAgICAgICAgdmFyIG1vZGVsSUQ9b3JpZ2luYWxJbmZvWyckbWV0YWRhdGEnXVsnJG1vZGVsJ11cclxuICAgICAgICBuZXdOb2RlLmRhdGFbXCJtb2RlbElEXCJdPW1vZGVsSURcclxuICAgICAgICBhcnIucHVzaChuZXdOb2RlKVxyXG4gICAgfVxyXG4gICAgdmFyIGVsZXMgPSB0aGlzLmNvcmUuYWRkKGFycilcclxuICAgIGlmKGVsZXMuc2l6ZSgpPT0wKSByZXR1cm4gZWxlc1xyXG4gICAgdGhpcy5ub1Bvc2l0aW9uX2dyaWQoZWxlcylcclxuICAgIGlmKGFuaW1hdGlvbil7XHJcbiAgICAgICAgZWxlcy5mb3JFYWNoKChlbGUpPT57IHRoaXMuYW5pbWF0ZUFOb2RlKGVsZSkgfSlcclxuICAgIH1cclxuXHJcbiAgICAvL2lmIHRoZXJlIGlzIGN1cnJlbnRseSBhIGxheW91dCB0aGVyZSwgYXBwbHkgaXRcclxuICAgIHZhciBsYXlvdXROYW1lPWdsb2JhbENhY2hlLmN1cnJlbnRMYXlvdXROYW1lXHJcbiAgICBpZihsYXlvdXROYW1lIT1udWxsKXtcclxuICAgICAgICB2YXIgbGF5b3V0RGV0YWlsPSBnbG9iYWxDYWNoZS5sYXlvdXRKU09OW2xheW91dE5hbWVdXHJcbiAgICAgICAgaWYobGF5b3V0RGV0YWlsKSB0aGlzLmFwcGx5TmV3TGF5b3V0V2l0aFVuZG8obGF5b3V0RGV0YWlsLHRoaXMuZ2V0Q3VycmVudExheW91dERldGFpbCgpKVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBlbGVzXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5kcmF3UmVsYXRpb25zPWZ1bmN0aW9uKHJlbGF0aW9uc0RhdGEpe1xyXG4gICAgdmFyIHJlbGF0aW9uSW5mb0Fycj1bXVxyXG4gICAgZm9yKHZhciBpPTA7aTxyZWxhdGlvbnNEYXRhLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBvcmlnaW5hbEluZm89cmVsYXRpb25zRGF0YVtpXTtcclxuICAgICAgICBcclxuICAgICAgICB2YXIgdGhlSUQ9b3JpZ2luYWxJbmZvWyckcmVsYXRpb25zaGlwTmFtZSddK1wiX1wiK29yaWdpbmFsSW5mb1snJHJlbGF0aW9uc2hpcElkJ11cclxuICAgICAgICB2YXIgYVJlbGF0aW9uPXtkYXRhOnt9LGdyb3VwOlwiZWRnZXNcIn1cclxuICAgICAgICBhUmVsYXRpb24uZGF0YVtcIm9yaWdpbmFsSW5mb1wiXT1vcmlnaW5hbEluZm9cclxuICAgICAgICBhUmVsYXRpb24uZGF0YVtcImlkXCJdPXRoZUlEXHJcbiAgICAgICAgYVJlbGF0aW9uLmRhdGFbXCJzb3VyY2VcIl09b3JpZ2luYWxJbmZvWyckc291cmNlSWQnXVxyXG4gICAgICAgIGFSZWxhdGlvbi5kYXRhW1widGFyZ2V0XCJdPW9yaWdpbmFsSW5mb1snJHRhcmdldElkJ11cclxuICAgICAgICBpZih0aGlzLmNvcmUuJChcIiNcIithUmVsYXRpb24uZGF0YVtcInNvdXJjZVwiXSkubGVuZ3RoPT0wIHx8IHRoaXMuY29yZS4kKFwiI1wiK2FSZWxhdGlvbi5kYXRhW1widGFyZ2V0XCJdKS5sZW5ndGg9PTApIGNvbnRpbnVlXHJcbiAgICAgICAgdmFyIHNvdXJjZU5vZGU9dGhpcy5jb3JlLiQoXCIjXCIrYVJlbGF0aW9uLmRhdGFbXCJzb3VyY2VcIl0pXHJcbiAgICAgICAgdmFyIHNvdXJjZU1vZGVsPXNvdXJjZU5vZGVbMF0uZGF0YShcIm9yaWdpbmFsSW5mb1wiKVsnJG1ldGFkYXRhJ11bJyRtb2RlbCddXHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9hZGQgYWRkaXRpb25hbCBzb3VyY2Ugbm9kZSBpbmZvcm1hdGlvbiB0byB0aGUgb3JpZ2luYWwgcmVsYXRpb25zaGlwIGluZm9ybWF0aW9uXHJcbiAgICAgICAgb3JpZ2luYWxJbmZvWydzb3VyY2VNb2RlbCddPXNvdXJjZU1vZGVsXHJcbiAgICAgICAgYVJlbGF0aW9uLmRhdGFbXCJzb3VyY2VNb2RlbFwiXT1zb3VyY2VNb2RlbFxyXG4gICAgICAgIGFSZWxhdGlvbi5kYXRhW1wicmVsYXRpb25zaGlwTmFtZVwiXT1vcmlnaW5hbEluZm9bJyRyZWxhdGlvbnNoaXBOYW1lJ11cclxuXHJcbiAgICAgICAgdmFyIGV4aXN0RWRnZT10aGlzLmNvcmUuJCgnZWRnZVtpZCA9IFwiJyt0aGVJRCsnXCJdJylcclxuICAgICAgICBpZihleGlzdEVkZ2Uuc2l6ZSgpPjApIHtcclxuICAgICAgICAgICAgZXhpc3RFZGdlLmRhdGEoXCJvcmlnaW5hbEluZm9cIixvcmlnaW5hbEluZm8pXHJcbiAgICAgICAgICAgIGNvbnRpbnVlOyAgLy9ubyBuZWVkIHRvIGRyYXcgaXRcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlbGF0aW9uSW5mb0Fyci5wdXNoKGFSZWxhdGlvbilcclxuICAgIH1cclxuICAgIGlmKHJlbGF0aW9uSW5mb0Fyci5sZW5ndGg9PTApIHJldHVybiBudWxsO1xyXG5cclxuICAgIHZhciBlZGdlcz10aGlzLmNvcmUuYWRkKHJlbGF0aW9uSW5mb0FycilcclxuICAgIHJldHVybiBlZGdlc1xyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUucmV2aWV3U3RvcmVkUmVsYXRpb25zaGlwc1RvRHJhdz1mdW5jdGlvbigpe1xyXG4gICAgLy9jaGVjayB0aGUgc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzIGFnYWluIGFuZCBtYXliZSBzb21lIG9mIHRoZW0gY2FuIGJlIGRyYXduIG5vdyBzaW5jZSB0YXJnZXROb2RlIGlzIGF2YWlsYWJsZVxyXG4gICAgdmFyIHN0b3JlZFJlbGF0aW9uQXJyPVtdXHJcbiAgICBmb3IodmFyIHR3aW5JRCBpbiBnbG9iYWxDYWNoZS5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHMpe1xyXG4gICAgICAgIHN0b3JlZFJlbGF0aW9uQXJyPXN0b3JlZFJlbGF0aW9uQXJyLmNvbmNhdChnbG9iYWxDYWNoZS5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbdHdpbklEXSlcclxuICAgIH1cclxuICAgIHRoaXMuZHJhd1JlbGF0aW9ucyhzdG9yZWRSZWxhdGlvbkFycilcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmRyYXdUd2luc0FuZFJlbGF0aW9ucz1mdW5jdGlvbihkYXRhKXtcclxuICAgIHZhciB0d2luc0FuZFJlbGF0aW9ucz1kYXRhLmNoaWxkVHdpbnNBbmRSZWxhdGlvbnNcclxuXHJcbiAgICAvL2RyYXcgdGhvc2UgbmV3IHR3aW5zIGZpcnN0XHJcbiAgICB0d2luc0FuZFJlbGF0aW9ucy5mb3JFYWNoKG9uZVNldD0+e1xyXG4gICAgICAgIHZhciB0d2luSW5mb0Fycj1bXVxyXG4gICAgICAgIGZvcih2YXIgaW5kIGluIG9uZVNldC5jaGlsZFR3aW5zKSB0d2luSW5mb0Fyci5wdXNoKG9uZVNldC5jaGlsZFR3aW5zW2luZF0pXHJcbiAgICAgICAgdGhpcy5kcmF3VHdpbnModHdpbkluZm9BcnIsXCJhbmltYXRpb25cIilcclxuICAgIH0pXHJcblxyXG4gICAgLy9kcmF3IHRob3NlIGtub3duIHR3aW5zIGZyb20gdGhlIHJlbGF0aW9uc2hpcHNcclxuICAgIHZhciB0d2luc0luZm89e31cclxuICAgIHR3aW5zQW5kUmVsYXRpb25zLmZvckVhY2gob25lU2V0PT57XHJcbiAgICAgICAgdmFyIHJlbGF0aW9uc0luZm89b25lU2V0W1wicmVsYXRpb25zaGlwc1wiXVxyXG4gICAgICAgIHJlbGF0aW9uc0luZm8uZm9yRWFjaCgob25lUmVsYXRpb24pPT57XHJcbiAgICAgICAgICAgIHZhciBzcmNJRD1vbmVSZWxhdGlvblsnJHNvdXJjZUlkJ11cclxuICAgICAgICAgICAgdmFyIHRhcmdldElEPW9uZVJlbGF0aW9uWyckdGFyZ2V0SWQnXVxyXG4gICAgICAgICAgICBpZihnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1tzcmNJRF0pXHJcbiAgICAgICAgICAgICAgICB0d2luc0luZm9bc3JjSURdID0gZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbc3JjSURdXHJcbiAgICAgICAgICAgIGlmKGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3RhcmdldElEXSlcclxuICAgICAgICAgICAgICAgIHR3aW5zSW5mb1t0YXJnZXRJRF0gPSBnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1t0YXJnZXRJRF0gICAgXHJcbiAgICAgICAgfSlcclxuICAgIH0pXHJcbiAgICB2YXIgdG1wQXJyPVtdXHJcbiAgICBmb3IodmFyIHR3aW5JRCBpbiB0d2luc0luZm8pIHRtcEFyci5wdXNoKHR3aW5zSW5mb1t0d2luSURdKVxyXG4gICAgdGhpcy5kcmF3VHdpbnModG1wQXJyKVxyXG5cclxuICAgIC8vdGhlbiBjaGVjayBhbGwgc3RvcmVkIHJlbGF0aW9uc2hpcHMgYW5kIGRyYXcgaWYgaXQgY2FuIGJlIGRyYXduXHJcbiAgICB0aGlzLnJldmlld1N0b3JlZFJlbGF0aW9uc2hpcHNUb0RyYXcoKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuYXBwbHlWaXN1YWxEZWZpbml0aW9uPWZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgdmlzdWFsSnNvbj1nbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW2dsb2JhbENhY2hlLnNlbGVjdGVkQURUXVxyXG4gICAgaWYodmlzdWFsSnNvbj09bnVsbCkgcmV0dXJuO1xyXG4gICAgZm9yKHZhciBtb2RlbElEIGluIHZpc3VhbEpzb24pe1xyXG4gICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF0uY29sb3IpIHRoaXMudXBkYXRlTW9kZWxUd2luQ29sb3IobW9kZWxJRCx2aXN1YWxKc29uW21vZGVsSURdLmNvbG9yKVxyXG4gICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF0uc2hhcGUpIHRoaXMudXBkYXRlTW9kZWxUd2luU2hhcGUobW9kZWxJRCx2aXN1YWxKc29uW21vZGVsSURdLnNoYXBlKVxyXG4gICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF0uYXZhcnRhKSB0aGlzLnVwZGF0ZU1vZGVsQXZhcnRhKG1vZGVsSUQsdmlzdWFsSnNvblttb2RlbElEXS5hdmFydGEpXHJcbiAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXS5kaW1lbnNpb25SYXRpbykgdGhpcy51cGRhdGVNb2RlbFR3aW5EaW1lbnNpb24obW9kZWxJRCx2aXN1YWxKc29uW21vZGVsSURdLmRpbWVuc2lvblJhdGlvKVxyXG4gICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF0ucmVscyl7XHJcbiAgICAgICAgICAgIGZvcih2YXIgcmVsYXRpb25zaGlwTmFtZSBpbiB2aXN1YWxKc29uW21vZGVsSURdLnJlbHMpe1xyXG4gICAgICAgICAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpb25zaGlwTmFtZV0uY29sb3Ipe1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlUmVsYXRpb25zaGlwQ29sb3IobW9kZWxJRCxyZWxhdGlvbnNoaXBOYW1lLHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW9uc2hpcE5hbWVdLmNvbG9yKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpb25zaGlwTmFtZV0uc2hhcGUpe1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlUmVsYXRpb25zaGlwU2hhcGUobW9kZWxJRCxyZWxhdGlvbnNoaXBOYW1lLHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW9uc2hpcE5hbWVdLnNoYXBlKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpb25zaGlwTmFtZV0uZWRnZVdpZHRoKXtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVJlbGF0aW9uc2hpcFdpZHRoKG1vZGVsSUQscmVsYXRpb25zaGlwTmFtZSx2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGlvbnNoaXBOYW1lXS5lZGdlV2lkdGgpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5yeE1lc3NhZ2U9ZnVuY3Rpb24obXNnUGF5bG9hZCl7XHJcbiAgICBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiQURURGF0YXNvdXJjZUNoYW5nZV9yZXBsYWNlXCIpe1xyXG4gICAgICAgIHRoaXMuY29yZS5ub2RlcygpLnJlbW92ZSgpXHJcbiAgICAgICAgdGhpcy5hcHBseVZpc3VhbERlZmluaXRpb24oKVxyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInJlcGxhY2VBbGxUd2luc1wiKSB7XHJcbiAgICAgICAgdGhpcy5jb3JlLm5vZGVzKCkucmVtb3ZlKClcclxuICAgICAgICB2YXIgZWxlcz0gdGhpcy5kcmF3VHdpbnMobXNnUGF5bG9hZC5pbmZvKVxyXG4gICAgICAgIHRoaXMuY29yZS5jZW50ZXIoZWxlcylcclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJhcHBlbmRBbGxUd2luc1wiKSB7XHJcbiAgICAgICAgdmFyIGVsZXM9IHRoaXMuZHJhd1R3aW5zKG1zZ1BheWxvYWQuaW5mbyxcImFuaW1hdGVcIilcclxuICAgICAgICB0aGlzLmNvcmUuY2VudGVyKGVsZXMpXHJcbiAgICAgICAgdGhpcy5yZXZpZXdTdG9yZWRSZWxhdGlvbnNoaXBzVG9EcmF3KClcclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJkcmF3QWxsUmVsYXRpb25zXCIpe1xyXG4gICAgICAgIHZhciBlZGdlcz0gdGhpcy5kcmF3UmVsYXRpb25zKG1zZ1BheWxvYWQuaW5mbylcclxuICAgICAgICBpZihlZGdlcyE9bnVsbCkge1xyXG4gICAgICAgICAgICBpZihnbG9iYWxDYWNoZS5jdXJyZW50TGF5b3V0TmFtZT09bnVsbCkgIHRoaXMubm9Qb3NpdGlvbl9jb3NlKClcclxuICAgICAgICB9XHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiYWRkTmV3VHdpblwiKSB7XHJcbiAgICAgICAgdGhpcy5jb3JlLm5vZGVzKCkudW5zZWxlY3QoKVxyXG4gICAgICAgIHRoaXMuY29yZS5lZGdlcygpLnVuc2VsZWN0KClcclxuICAgICAgICB0aGlzLmRyYXdUd2lucyhbbXNnUGF5bG9hZC50d2luSW5mb10sXCJhbmltYXRpb25cIilcclxuICAgICAgICB2YXIgbm9kZUluZm89IG1zZ1BheWxvYWQudHdpbkluZm87XHJcbiAgICAgICAgdmFyIG5vZGVOYW1lPSBub2RlSW5mb1tcIiRkdElkXCJdXHJcbiAgICAgICAgdmFyIHRvcG9Ob2RlPSB0aGlzLmNvcmUubm9kZXMoXCIjXCIrbm9kZU5hbWUpXHJcbiAgICAgICAgaWYodG9wb05vZGUpe1xyXG4gICAgICAgICAgICB2YXIgcG9zaXRpb249dG9wb05vZGUucmVuZGVyZWRQb3NpdGlvbigpXHJcbiAgICAgICAgICAgIHRoaXMuY29yZS5wYW5CeSh7eDotcG9zaXRpb24ueCsyMDAseTotcG9zaXRpb24ueSsyMDB9KVxyXG4gICAgICAgICAgICB0b3BvTm9kZS5zZWxlY3QoKVxyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdEZ1bmN0aW9uKClcclxuICAgICAgICB9XHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiYWRkTmV3VHdpbnNcIikge1xyXG4gICAgICAgIHRoaXMuZHJhd1R3aW5zKG1zZ1BheWxvYWQudHdpbnNJbmZvLFwiYW5pbWF0aW9uXCIpXHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiZHJhd1R3aW5zQW5kUmVsYXRpb25zXCIpIHRoaXMuZHJhd1R3aW5zQW5kUmVsYXRpb25zKG1zZ1BheWxvYWQuaW5mbylcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInNob3dJbmZvU2VsZWN0ZWROb2Rlc1wiKXsgLy9mcm9tIHNlbGVjdGluZyB0d2lucyBpbiB0aGUgdHdpbnRyZWVcclxuICAgICAgICB0aGlzLmNvcmUubm9kZXMoKS51bnNlbGVjdCgpXHJcbiAgICAgICAgdGhpcy5jb3JlLmVkZ2VzKCkudW5zZWxlY3QoKVxyXG4gICAgICAgIHZhciBhcnI9bXNnUGF5bG9hZC5pbmZvO1xyXG4gICAgICAgIHZhciBtb3VzZUNsaWNrRGV0YWlsPW1zZ1BheWxvYWQubW91c2VDbGlja0RldGFpbDtcclxuICAgICAgICBhcnIuZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICAgICAgdmFyIGFUd2luPSB0aGlzLmNvcmUubm9kZXMoXCIjXCIrZWxlbWVudFsnJGR0SWQnXSlcclxuICAgICAgICAgICAgYVR3aW4uc2VsZWN0KClcclxuICAgICAgICAgICAgaWYobW91c2VDbGlja0RldGFpbCE9MikgdGhpcy5hbmltYXRlQU5vZGUoYVR3aW4pIC8vaWdub3JlIGRvdWJsZSBjbGljayBzZWNvbmQgY2xpY2tcclxuICAgICAgICB9KTtcclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJQYW5Ub05vZGVcIil7XHJcbiAgICAgICAgdmFyIG5vZGVJbmZvPSBtc2dQYXlsb2FkLmluZm87XHJcbiAgICAgICAgdmFyIHRvcG9Ob2RlPSB0aGlzLmNvcmUubm9kZXMoXCIjXCIrbm9kZUluZm9bXCIkZHRJZFwiXSlcclxuICAgICAgICBpZih0b3BvTm9kZSl7XHJcbiAgICAgICAgICAgIHRoaXMuY29yZS5jZW50ZXIodG9wb05vZGUpXHJcbiAgICAgICAgfVxyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIil7XHJcbiAgICAgICAgaWYobXNnUGF5bG9hZC5zcmNNb2RlbElEKXtcclxuICAgICAgICAgICAgaWYobXNnUGF5bG9hZC5jb2xvcikgdGhpcy51cGRhdGVSZWxhdGlvbnNoaXBDb2xvcihtc2dQYXlsb2FkLnNyY01vZGVsSUQsbXNnUGF5bG9hZC5yZWxhdGlvbnNoaXBOYW1lLG1zZ1BheWxvYWQuY29sb3IpXHJcbiAgICAgICAgICAgIGVsc2UgaWYobXNnUGF5bG9hZC5zaGFwZSkgdGhpcy51cGRhdGVSZWxhdGlvbnNoaXBTaGFwZShtc2dQYXlsb2FkLnNyY01vZGVsSUQsbXNnUGF5bG9hZC5yZWxhdGlvbnNoaXBOYW1lLG1zZ1BheWxvYWQuc2hhcGUpXHJcbiAgICAgICAgICAgIGVsc2UgaWYobXNnUGF5bG9hZC5lZGdlV2lkdGgpIHRoaXMudXBkYXRlUmVsYXRpb25zaGlwV2lkdGgobXNnUGF5bG9hZC5zcmNNb2RlbElELG1zZ1BheWxvYWQucmVsYXRpb25zaGlwTmFtZSxtc2dQYXlsb2FkLmVkZ2VXaWR0aClcclxuICAgICAgICB9IFxyXG4gICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgIGlmKG1zZ1BheWxvYWQuY29sb3IpIHRoaXMudXBkYXRlTW9kZWxUd2luQ29sb3IobXNnUGF5bG9hZC5tb2RlbElELG1zZ1BheWxvYWQuY29sb3IpXHJcbiAgICAgICAgICAgIGVsc2UgaWYobXNnUGF5bG9hZC5zaGFwZSkgdGhpcy51cGRhdGVNb2RlbFR3aW5TaGFwZShtc2dQYXlsb2FkLm1vZGVsSUQsbXNnUGF5bG9hZC5zaGFwZSlcclxuICAgICAgICAgICAgZWxzZSBpZihtc2dQYXlsb2FkLmF2YXJ0YSkgdGhpcy51cGRhdGVNb2RlbEF2YXJ0YShtc2dQYXlsb2FkLm1vZGVsSUQsbXNnUGF5bG9hZC5hdmFydGEpXHJcbiAgICAgICAgICAgIGVsc2UgaWYobXNnUGF5bG9hZC5ub0F2YXJ0YSkgIHRoaXMudXBkYXRlTW9kZWxBdmFydGEobXNnUGF5bG9hZC5tb2RlbElELG51bGwpXHJcbiAgICAgICAgICAgIGVsc2UgaWYobXNnUGF5bG9hZC5kaW1lbnNpb25SYXRpbykgIHRoaXMudXBkYXRlTW9kZWxUd2luRGltZW5zaW9uKG1zZ1BheWxvYWQubW9kZWxJRCxtc2dQYXlsb2FkLmRpbWVuc2lvblJhdGlvKVxyXG4gICAgICAgIH0gXHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwidHdpbnNEZWxldGVkXCIpIHRoaXMuZGVsZXRlVHdpbnMobXNnUGF5bG9hZC50d2luSURBcnIpXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJyZWxhdGlvbnNEZWxldGVkXCIpIHRoaXMuZGVsZXRlUmVsYXRpb25zKG1zZ1BheWxvYWQucmVsYXRpb25zKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiY29ubmVjdFRvXCIpeyB0aGlzLnN0YXJ0VGFyZ2V0Tm9kZU1vZGUoXCJjb25uZWN0VG9cIikgICB9XHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJjb25uZWN0RnJvbVwiKXsgdGhpcy5zdGFydFRhcmdldE5vZGVNb2RlKFwiY29ubmVjdEZyb21cIikgICB9XHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJhZGRTZWxlY3RPdXRib3VuZFwiKXsgdGhpcy5zZWxlY3RPdXRib3VuZE5vZGVzKCkgICB9XHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJhZGRTZWxlY3RJbmJvdW5kXCIpeyB0aGlzLnNlbGVjdEluYm91bmROb2RlcygpICAgfVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiaGlkZVNlbGVjdGVkTm9kZXNcIil7IHRoaXMuaGlkZVNlbGVjdGVkTm9kZXMoKSAgIH1cclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cIkNPU0VTZWxlY3RlZE5vZGVzXCIpeyB0aGlzLkNPU0VTZWxlY3RlZE5vZGVzKCkgICB9XHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJzYXZlTGF5b3V0XCIpeyB0aGlzLnNhdmVMYXlvdXQobXNnUGF5bG9hZC5sYXlvdXROYW1lLG1zZ1BheWxvYWQuYWR0TmFtZSkgICB9XHJcbiAgICBlbHNlIGlmIChtc2dQYXlsb2FkLm1lc3NhZ2UgPT0gXCJsYXlvdXRDaGFuZ2VcIikge1xyXG4gICAgICAgIHZhciBsYXlvdXROYW1lID0gZ2xvYmFsQ2FjaGUuY3VycmVudExheW91dE5hbWVcclxuICAgICAgICBpZihsYXlvdXROYW1lPT1cIltOQV1cIil7XHJcbiAgICAgICAgICAgIHZhciBjdXJyZW50TGF5b3V0PXRoaXMuZ2V0Q3VycmVudExheW91dERldGFpbCgpXHJcbiAgICAgICAgICAgIC8vc2VsZWN0IGFsbCB2aXNpYmxlIG5vZGVzIGFuZCBkbyBhIENPU0UgbGF5b3V0LCBjbGVhbiBhbGwgYmVuZCBlZGdlIGxpbmUgYXMgd2VsbFxyXG4gICAgICAgICAgICB0aGlzLmNvcmUuZWRnZXMoKS5mb3JFYWNoKG9uZUVkZ2U9PntcclxuICAgICAgICAgICAgICAgIG9uZUVkZ2UucmVtb3ZlQ2xhc3MoJ2VkZ2ViZW5kZWRpdGluZy1oYXNiZW5kcG9pbnRzJylcclxuICAgICAgICAgICAgICAgIG9uZUVkZ2UucmVtb3ZlQ2xhc3MoJ2VkZ2Vjb250cm9sZWRpdGluZy1oYXNjb250cm9scG9pbnRzJylcclxuICAgICAgICAgICAgICAgIG9uZUVkZ2UuZGF0YShcImN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0c1wiLFtdKVxyXG4gICAgICAgICAgICAgICAgb25lRWRnZS5kYXRhKFwiY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXNcIixbXSlcclxuICAgICAgICAgICAgICAgIG9uZUVkZ2UuZGF0YShcImN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0c1wiLFtdKVxyXG4gICAgICAgICAgICAgICAgb25lRWRnZS5kYXRhKFwiY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXNcIixbXSlcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgdGhpcy5ub1Bvc2l0aW9uX2Nvc2UobnVsbCxjdXJyZW50TGF5b3V0KVxyXG4gICAgICAgIH1lbHNlIGlmIChsYXlvdXROYW1lICE9IG51bGwpIHtcclxuICAgICAgICAgICAgdmFyIGxheW91dERldGFpbCA9IGdsb2JhbENhY2hlLmxheW91dEpTT05bbGF5b3V0TmFtZV1cclxuICAgICAgICAgICAgaWYgKGxheW91dERldGFpbCkgdGhpcy5hcHBseU5ld0xheW91dFdpdGhVbmRvKGxheW91dERldGFpbCwgdGhpcy5nZXRDdXJyZW50TGF5b3V0RGV0YWlsKCkpXHJcbiAgICAgICAgfVxyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImFsaWduU2VsZWN0ZWROb2RlXCIpIHRoaXMuYWxpZ25TZWxlY3RlZE5vZGVzKG1zZ1BheWxvYWQuZGlyZWN0aW9uKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiZGlzdHJpYnV0ZVNlbGVjdGVkTm9kZVwiKSB0aGlzLmRpc3RyaWJ1dGVTZWxlY3RlZE5vZGUobXNnUGF5bG9hZC5kaXJlY3Rpb24pXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJyb3RhdGVTZWxlY3RlZE5vZGVcIikgdGhpcy5yb3RhdGVTZWxlY3RlZE5vZGUobXNnUGF5bG9hZC5kaXJlY3Rpb24pXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJtaXJyb3JTZWxlY3RlZE5vZGVcIikgdGhpcy5taXJyb3JTZWxlY3RlZE5vZGUobXNnUGF5bG9hZC5kaXJlY3Rpb24pXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJkaW1lbnNpb25TZWxlY3RlZE5vZGVcIikgdGhpcy5kaW1lbnNpb25TZWxlY3RlZE5vZGUobXNnUGF5bG9hZC5kaXJlY3Rpb24pXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5kaW1lbnNpb25TZWxlY3RlZE5vZGUgPSBmdW5jdGlvbiAoZGlyZWN0aW9uKSB7XHJcbiAgICB2YXIgcmF0aW89MS4yXHJcbiAgICB2YXIgc2VsZWN0ZWROb2Rlcz10aGlzLmNvcmUubm9kZXMoJzpzZWxlY3RlZCcpXHJcbiAgICBpZihzZWxlY3RlZE5vZGVzLnNpemUoKTwyKSByZXR1cm47XHJcbiAgICB2YXIgYm91bmRhcnk9IHNlbGVjdGVkTm9kZXMuYm91bmRpbmdCb3goe2luY2x1ZGVMYWJlbHMgOmZhbHNlLGluY2x1ZGVPdmVybGF5cyA6ZmFsc2UgfSlcclxuICAgIHZhciBjZW50ZXJYPWJvdW5kYXJ5W1wieDFcIl0rYm91bmRhcnlbXCJ3XCJdLzJcclxuICAgIHZhciBjZW50ZXJZPWJvdW5kYXJ5W1wieTFcIl0rYm91bmRhcnlbXCJoXCJdLzJcclxuICAgIFxyXG4gICAgdmFyIG9sZExheW91dD17fVxyXG4gICAgdmFyIG5ld0xheW91dD17fVxyXG4gICAgc2VsZWN0ZWROb2Rlcy5mb3JFYWNoKG9uZU5vZGU9PntcclxuICAgICAgICB2YXIgY3VyUG9zPW9uZU5vZGUucG9zaXRpb24oKVxyXG4gICAgICAgIHZhciBub2RlSUQ9b25lTm9kZS5pZCgpXHJcbiAgICAgICAgb2xkTGF5b3V0W25vZGVJRF09W2N1clBvc1sneCddLGN1clBvc1sneSddXVxyXG4gICAgICAgIHZhciB4b2ZmY2VudGVyPWN1clBvc1tcInhcIl0tY2VudGVyWFxyXG4gICAgICAgIHZhciB5b2ZmY2VudGVyPWN1clBvc1tcInlcIl0tY2VudGVyWVxyXG4gICAgICAgIGlmKGRpcmVjdGlvbj09XCJleHBhbmRcIikgbmV3TGF5b3V0W25vZGVJRF09W2NlbnRlclgreG9mZmNlbnRlcipyYXRpbyxjZW50ZXJZK3lvZmZjZW50ZXIqcmF0aW9dXHJcbiAgICAgICAgZWxzZSBpZihkaXJlY3Rpb249PVwiY29tcHJlc3NcIikgbmV3TGF5b3V0W25vZGVJRF09W2NlbnRlclgreG9mZmNlbnRlci9yYXRpbyxjZW50ZXJZK3lvZmZjZW50ZXIvcmF0aW9dXHJcbiAgICB9KVxyXG4gICAgdGhpcy5hcHBseU5ld0xheW91dFdpdGhVbmRvKG5ld0xheW91dCxvbGRMYXlvdXQsXCJvbmx5QWRqdXN0Tm9kZVBvc2l0aW9uXCIpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5taXJyb3JTZWxlY3RlZE5vZGUgPSBmdW5jdGlvbiAoZGlyZWN0aW9uKSB7XHJcbiAgICB2YXIgc2VsZWN0ZWROb2Rlcz10aGlzLmNvcmUubm9kZXMoJzpzZWxlY3RlZCcpXHJcbiAgICBpZihzZWxlY3RlZE5vZGVzLnNpemUoKTwyKSByZXR1cm47XHJcbiAgICB2YXIgYm91bmRhcnk9IHNlbGVjdGVkTm9kZXMuYm91bmRpbmdCb3goe2luY2x1ZGVMYWJlbHMgOmZhbHNlLGluY2x1ZGVPdmVybGF5cyA6ZmFsc2UgfSlcclxuICAgIHZhciBjZW50ZXJYPWJvdW5kYXJ5W1wieDFcIl0rYm91bmRhcnlbXCJ3XCJdLzJcclxuICAgIHZhciBjZW50ZXJZPWJvdW5kYXJ5W1wieTFcIl0rYm91bmRhcnlbXCJoXCJdLzJcclxuICAgIFxyXG4gICAgdmFyIG9sZExheW91dD17fVxyXG4gICAgdmFyIG5ld0xheW91dD17fVxyXG4gICAgc2VsZWN0ZWROb2Rlcy5mb3JFYWNoKG9uZU5vZGU9PntcclxuICAgICAgICB2YXIgY3VyUG9zPW9uZU5vZGUucG9zaXRpb24oKVxyXG4gICAgICAgIHZhciBub2RlSUQ9b25lTm9kZS5pZCgpXHJcbiAgICAgICAgb2xkTGF5b3V0W25vZGVJRF09W2N1clBvc1sneCddLGN1clBvc1sneSddXVxyXG4gICAgICAgIHZhciB4b2ZmY2VudGVyPWN1clBvc1tcInhcIl0tY2VudGVyWFxyXG4gICAgICAgIHZhciB5b2ZmY2VudGVyPWN1clBvc1tcInlcIl0tY2VudGVyWVxyXG4gICAgICAgIGlmKGRpcmVjdGlvbj09XCJob3Jpem9udGFsXCIpIG5ld0xheW91dFtub2RlSURdPVtjZW50ZXJYLXhvZmZjZW50ZXIsY3VyUG9zWyd5J11dXHJcbiAgICAgICAgZWxzZSBpZihkaXJlY3Rpb249PVwidmVydGljYWxcIikgbmV3TGF5b3V0W25vZGVJRF09W2N1clBvc1sneCddLGNlbnRlclkteW9mZmNlbnRlcl1cclxuICAgIH0pXHJcbiAgICB0aGlzLmFwcGx5TmV3TGF5b3V0V2l0aFVuZG8obmV3TGF5b3V0LG9sZExheW91dCxcIm9ubHlBZGp1c3ROb2RlUG9zaXRpb25cIilcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnJvdGF0ZVNlbGVjdGVkTm9kZSA9IGZ1bmN0aW9uIChkaXJlY3Rpb24pIHtcclxuICAgIHZhciBzZWxlY3RlZE5vZGVzPXRoaXMuY29yZS5ub2RlcygnOnNlbGVjdGVkJylcclxuICAgIGlmKHNlbGVjdGVkTm9kZXMuc2l6ZSgpPDIpIHJldHVybjtcclxuICAgIHZhciBib3VuZGFyeT0gc2VsZWN0ZWROb2Rlcy5ib3VuZGluZ0JveCh7aW5jbHVkZUxhYmVscyA6ZmFsc2UsaW5jbHVkZU92ZXJsYXlzIDpmYWxzZSB9KVxyXG4gICAgdmFyIGNlbnRlclg9Ym91bmRhcnlbXCJ4MVwiXStib3VuZGFyeVtcIndcIl0vMlxyXG4gICAgdmFyIGNlbnRlclk9Ym91bmRhcnlbXCJ5MVwiXStib3VuZGFyeVtcImhcIl0vMlxyXG4gICAgXHJcbiAgICB2YXIgb2xkTGF5b3V0PXt9XHJcbiAgICB2YXIgbmV3TGF5b3V0PXt9XHJcbiAgICBzZWxlY3RlZE5vZGVzLmZvckVhY2gob25lTm9kZT0+e1xyXG4gICAgICAgIHZhciBjdXJQb3M9b25lTm9kZS5wb3NpdGlvbigpXHJcbiAgICAgICAgdmFyIG5vZGVJRD1vbmVOb2RlLmlkKClcclxuICAgICAgICBvbGRMYXlvdXRbbm9kZUlEXT1bY3VyUG9zWyd4J10sY3VyUG9zWyd5J11dXHJcbiAgICAgICAgdmFyIHhvZmZjZW50ZXI9Y3VyUG9zW1wieFwiXS1jZW50ZXJYXHJcbiAgICAgICAgdmFyIHlvZmZjZW50ZXI9Y3VyUG9zW1wieVwiXS1jZW50ZXJZXHJcbiAgICAgICAgaWYoZGlyZWN0aW9uPT1cImxlZnRcIikgbmV3TGF5b3V0W25vZGVJRF09W2NlbnRlclgreW9mZmNlbnRlcixjZW50ZXJZLXhvZmZjZW50ZXJdXHJcbiAgICAgICAgZWxzZSBpZihkaXJlY3Rpb249PVwicmlnaHRcIikgbmV3TGF5b3V0W25vZGVJRF09W2NlbnRlclgteW9mZmNlbnRlcixjZW50ZXJZK3hvZmZjZW50ZXJdXHJcbiAgICB9KVxyXG4gICAgdGhpcy5hcHBseU5ld0xheW91dFdpdGhVbmRvKG5ld0xheW91dCxvbGRMYXlvdXQsXCJvbmx5QWRqdXN0Tm9kZVBvc2l0aW9uXCIpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5kaXN0cmlidXRlU2VsZWN0ZWROb2RlID0gZnVuY3Rpb24gKGRpcmVjdGlvbikge1xyXG4gICAgdmFyIHNlbGVjdGVkTm9kZXM9dGhpcy5jb3JlLm5vZGVzKCc6c2VsZWN0ZWQnKVxyXG4gICAgaWYoc2VsZWN0ZWROb2Rlcy5zaXplKCk8MykgcmV0dXJuO1xyXG4gICAgdmFyIG51bUFycj1bXVxyXG4gICAgdmFyIG9sZExheW91dD17fVxyXG4gICAgdmFyIGxheW91dEZvclNvcnQ9W11cclxuICAgIHNlbGVjdGVkTm9kZXMuZm9yRWFjaChvbmVOb2RlPT57XHJcbiAgICAgICAgdmFyIHBvc2l0aW9uPW9uZU5vZGUucG9zaXRpb24oKVxyXG4gICAgICAgIGlmKGRpcmVjdGlvbj09XCJ2ZXJ0aWNhbFwiKSBudW1BcnIucHVzaChwb3NpdGlvblsneSddKVxyXG4gICAgICAgIGVsc2UgaWYoZGlyZWN0aW9uPT1cImhvcml6b250YWxcIikgbnVtQXJyLnB1c2gocG9zaXRpb25bJ3gnXSlcclxuICAgICAgICB2YXIgY3VyUG9zPW9uZU5vZGUucG9zaXRpb24oKVxyXG4gICAgICAgIHZhciBub2RlSUQ9b25lTm9kZS5pZCgpXHJcbiAgICAgICAgb2xkTGF5b3V0W25vZGVJRF09W2N1clBvc1sneCddLGN1clBvc1sneSddXVxyXG4gICAgICAgIGxheW91dEZvclNvcnQucHVzaCh7aWQ6bm9kZUlELHg6Y3VyUG9zWyd4J10seTpjdXJQb3NbJ3knXX0pXHJcbiAgICB9KVxyXG5cclxuICAgIGlmKGRpcmVjdGlvbj09XCJ2ZXJ0aWNhbFwiKSBsYXlvdXRGb3JTb3J0LnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtyZXR1cm4gYVtcInlcIl0tYltcInlcIl0gfSlcclxuICAgIGVsc2UgaWYoZGlyZWN0aW9uPT1cImhvcml6b250YWxcIikgbGF5b3V0Rm9yU29ydC5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7cmV0dXJuIGFbXCJ4XCJdLWJbXCJ4XCJdIH0pXHJcbiAgICBcclxuICAgIHZhciBtaW5WPU1hdGgubWluKC4uLm51bUFycilcclxuICAgIHZhciBtYXhWPU1hdGgubWF4KC4uLm51bUFycilcclxuICAgIGlmKG1pblY9PW1heFYpIHJldHVybjtcclxuICAgIHZhciBnYXA9KG1heFYtbWluVikvKHNlbGVjdGVkTm9kZXMuc2l6ZSgpLTEpXHJcbiAgICB2YXIgbmV3TGF5b3V0PXt9XHJcbiAgICBpZihkaXJlY3Rpb249PVwidmVydGljYWxcIikgdmFyIGN1clY9bGF5b3V0Rm9yU29ydFswXVtcInlcIl1cclxuICAgIGVsc2UgaWYoZGlyZWN0aW9uPT1cImhvcml6b250YWxcIikgY3VyVj1sYXlvdXRGb3JTb3J0WzBdW1wieFwiXVxyXG4gICAgZm9yKHZhciBpPTA7aTxsYXlvdXRGb3JTb3J0Lmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBvbmVOb2RlSW5mbz1sYXlvdXRGb3JTb3J0W2ldXHJcbiAgICAgICAgaWYoaT09MHx8IGk9PWxheW91dEZvclNvcnQubGVuZ3RoLTEpe1xyXG4gICAgICAgICAgICBuZXdMYXlvdXRbb25lTm9kZUluZm8uaWRdPVtvbmVOb2RlSW5mb1sneCddLG9uZU5vZGVJbmZvWyd5J11dXHJcbiAgICAgICAgICAgIGNvbnRpbnVlXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGN1clYrPWdhcDtcclxuICAgICAgICBpZihkaXJlY3Rpb249PVwidmVydGljYWxcIikgbmV3TGF5b3V0W29uZU5vZGVJbmZvLmlkXT1bb25lTm9kZUluZm9bJ3gnXSxjdXJWXVxyXG4gICAgICAgIGVsc2UgaWYoZGlyZWN0aW9uPT1cImhvcml6b250YWxcIikgbmV3TGF5b3V0W29uZU5vZGVJbmZvLmlkXT1bY3VyVixvbmVOb2RlSW5mb1sneSddXVxyXG4gICAgfVxyXG4gICAgdGhpcy5hcHBseU5ld0xheW91dFdpdGhVbmRvKG5ld0xheW91dCxvbGRMYXlvdXQsXCJvbmx5QWRqdXN0Tm9kZVBvc2l0aW9uXCIpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5hbGlnblNlbGVjdGVkTm9kZXMgPSBmdW5jdGlvbiAoZGlyZWN0aW9uKSB7XHJcbiAgICB2YXIgc2VsZWN0ZWROb2Rlcz10aGlzLmNvcmUubm9kZXMoJzpzZWxlY3RlZCcpXHJcbiAgICBpZihzZWxlY3RlZE5vZGVzLnNpemUoKTwyKSByZXR1cm47XHJcbiAgICB2YXIgbnVtQXJyPVtdXHJcbiAgICBzZWxlY3RlZE5vZGVzLmZvckVhY2gob25lTm9kZT0+e1xyXG4gICAgICAgIHZhciBwb3NpdGlvbj1vbmVOb2RlLnBvc2l0aW9uKClcclxuICAgICAgICBpZihkaXJlY3Rpb249PVwidG9wXCJ8fCBkaXJlY3Rpb249PVwiYm90dG9tXCIpIG51bUFyci5wdXNoKHBvc2l0aW9uWyd5J10pXHJcbiAgICAgICAgZWxzZSBpZihkaXJlY3Rpb249PVwibGVmdFwifHwgZGlyZWN0aW9uPT1cInJpZ2h0XCIpIG51bUFyci5wdXNoKHBvc2l0aW9uWyd4J10pXHJcbiAgICB9KVxyXG4gICAgdmFyIHRhcmdldFg9bnVsbFxyXG4gICAgdmFyIHRhcmdldFk9bnVsbFxyXG4gICAgaWYoZGlyZWN0aW9uPT1cInRvcFwiKSB2YXIgdGFyZ2V0WT0gTWF0aC5taW4oLi4ubnVtQXJyKVxyXG4gICAgZWxzZSBpZihkaXJlY3Rpb249PVwiYm90dG9tXCIpIHZhciB0YXJnZXRZPSBNYXRoLm1heCguLi5udW1BcnIpXHJcbiAgICBpZihkaXJlY3Rpb249PVwibGVmdFwiKSB2YXIgdGFyZ2V0WD0gTWF0aC5taW4oLi4ubnVtQXJyKVxyXG4gICAgZWxzZSBpZihkaXJlY3Rpb249PVwicmlnaHRcIikgdmFyIHRhcmdldFg9IE1hdGgubWF4KC4uLm51bUFycilcclxuICAgIFxyXG4gICAgdmFyIG9sZExheW91dD17fVxyXG4gICAgdmFyIG5ld0xheW91dD17fVxyXG4gICAgc2VsZWN0ZWROb2Rlcy5mb3JFYWNoKG9uZU5vZGU9PntcclxuICAgICAgICB2YXIgY3VyUG9zPW9uZU5vZGUucG9zaXRpb24oKVxyXG4gICAgICAgIHZhciBub2RlSUQ9b25lTm9kZS5pZCgpXHJcbiAgICAgICAgb2xkTGF5b3V0W25vZGVJRF09W2N1clBvc1sneCddLGN1clBvc1sneSddXVxyXG4gICAgICAgIG5ld0xheW91dFtub2RlSURdPVtjdXJQb3NbJ3gnXSxjdXJQb3NbJ3knXV1cclxuICAgICAgICBpZih0YXJnZXRYIT1udWxsKSBuZXdMYXlvdXRbbm9kZUlEXVswXT10YXJnZXRYXHJcbiAgICAgICAgaWYodGFyZ2V0WSE9bnVsbCkgbmV3TGF5b3V0W25vZGVJRF1bMV09dGFyZ2V0WVxyXG4gICAgfSlcclxuICAgIHRoaXMuYXBwbHlOZXdMYXlvdXRXaXRoVW5kbyhuZXdMYXlvdXQsb2xkTGF5b3V0LFwib25seUFkanVzdE5vZGVQb3NpdGlvblwiKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUucmVkcmF3QmFzZWRPbkxheW91dERldGFpbCA9IGZ1bmN0aW9uIChsYXlvdXREZXRhaWwsb25seUFkanVzdE5vZGVQb3NpdGlvbikge1xyXG4gICAgLy9yZW1vdmUgYWxsIGJlbmRpbmcgZWRnZSBcclxuICAgIGlmKCFvbmx5QWRqdXN0Tm9kZVBvc2l0aW9uKXtcclxuICAgICAgICB0aGlzLmNvcmUuZWRnZXMoKS5mb3JFYWNoKG9uZUVkZ2U9PntcclxuICAgICAgICAgICAgb25lRWRnZS5yZW1vdmVDbGFzcygnZWRnZWJlbmRlZGl0aW5nLWhhc2JlbmRwb2ludHMnKVxyXG4gICAgICAgICAgICBvbmVFZGdlLnJlbW92ZUNsYXNzKCdlZGdlY29udHJvbGVkaXRpbmctaGFzY29udHJvbHBvaW50cycpXHJcbiAgICAgICAgICAgIG9uZUVkZ2UuZGF0YShcImN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0c1wiLFtdKVxyXG4gICAgICAgICAgICBvbmVFZGdlLmRhdGEoXCJjeWVkZ2ViZW5kZWRpdGluZ0Rpc3RhbmNlc1wiLFtdKVxyXG4gICAgICAgICAgICBvbmVFZGdlLmRhdGEoXCJjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHNcIixbXSlcclxuICAgICAgICAgICAgb25lRWRnZS5kYXRhKFwiY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXNcIixbXSlcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBcclxuICAgIGlmKGxheW91dERldGFpbD09bnVsbCkgcmV0dXJuO1xyXG4gICAgXHJcbiAgICB2YXIgc3RvcmVkUG9zaXRpb25zPXt9XHJcbiAgICBmb3IodmFyIGluZCBpbiBsYXlvdXREZXRhaWwpe1xyXG4gICAgICAgIGlmKGluZCA9PSBcImVkZ2VzXCIpIGNvbnRpbnVlXHJcbiAgICAgICAgc3RvcmVkUG9zaXRpb25zW2luZF09e1xyXG4gICAgICAgICAgICB4OmxheW91dERldGFpbFtpbmRdWzBdXHJcbiAgICAgICAgICAgICx5OmxheW91dERldGFpbFtpbmRdWzFdXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdmFyIG5ld0xheW91dD10aGlzLmNvcmUubGF5b3V0KHtcclxuICAgICAgICBuYW1lOiAncHJlc2V0JyxcclxuICAgICAgICBwb3NpdGlvbnM6c3RvcmVkUG9zaXRpb25zLFxyXG4gICAgICAgIGZpdDpmYWxzZSxcclxuICAgICAgICBhbmltYXRlOiB0cnVlLFxyXG4gICAgICAgIGFuaW1hdGlvbkR1cmF0aW9uOiAzMDAsXHJcbiAgICB9KVxyXG4gICAgbmV3TGF5b3V0LnJ1bigpXHJcblxyXG4gICAgLy9yZXN0b3JlIGVkZ2VzIGJlbmRpbmcgb3IgY29udHJvbCBwb2ludHNcclxuICAgIHZhciBlZGdlUG9pbnRzRGljdD1sYXlvdXREZXRhaWxbXCJlZGdlc1wiXVxyXG4gICAgaWYoZWRnZVBvaW50c0RpY3Q9PW51bGwpcmV0dXJuO1xyXG4gICAgZm9yKHZhciBzcmNJRCBpbiBlZGdlUG9pbnRzRGljdCl7XHJcbiAgICAgICAgZm9yKHZhciByZWxhdGlvbnNoaXBJRCBpbiBlZGdlUG9pbnRzRGljdFtzcmNJRF0pe1xyXG4gICAgICAgICAgICB2YXIgb2JqPWVkZ2VQb2ludHNEaWN0W3NyY0lEXVtyZWxhdGlvbnNoaXBJRF1cclxuICAgICAgICAgICAgdGhpcy5hcHBseUVkZ2VCZW5kY29udHJvbFBvaW50cyhzcmNJRCxyZWxhdGlvbnNoaXBJRCxvYmpbXCJjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHNcIl1cclxuICAgICAgICAgICAgLG9ialtcImN5ZWRnZWJlbmRlZGl0aW5nRGlzdGFuY2VzXCJdLG9ialtcImN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0c1wiXSxvYmpbXCJjeWVkZ2Vjb250cm9sZWRpdGluZ0Rpc3RhbmNlc1wiXSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5hcHBseU5ld0xheW91dFdpdGhVbmRvID0gZnVuY3Rpb24gKG5ld0xheW91dERldGFpbCxvbGRMYXlvdXREZXRhaWwsb25seUFkanVzdE5vZGVQb3NpdGlvbikge1xyXG4gICAgLy9zdG9yZSBjdXJyZW50IGxheW91dCBmb3IgdW5kbyBvcGVyYXRpb25cclxuICAgIHRoaXMudXIuYWN0aW9uKCBcImNoYW5nZUxheW91dFwiXHJcbiAgICAgICAgLCAoYXJnKT0+e1xyXG4gICAgICAgICAgICB0aGlzLnJlZHJhd0Jhc2VkT25MYXlvdXREZXRhaWwoYXJnLm5ld0xheW91dERldGFpbCxhcmcub25seUFkanVzdE5vZGVQb3NpdGlvbikgICAgICAgIFxyXG4gICAgICAgICAgICByZXR1cm4gYXJnXHJcbiAgICAgICAgfVxyXG4gICAgICAgICwgKGFyZyk9PntcclxuICAgICAgICAgICAgdGhpcy5yZWRyYXdCYXNlZE9uTGF5b3V0RGV0YWlsKGFyZy5vbGRMYXlvdXREZXRhaWwsYXJnLm9ubHlBZGp1c3ROb2RlUG9zaXRpb24pXHJcbiAgICAgICAgICAgIHJldHVybiBhcmdcclxuICAgICAgICB9XHJcbiAgICApXHJcbiAgICB0aGlzLnVyLmRvKFwiY2hhbmdlTGF5b3V0XCJcclxuICAgICAgICAsIHsgZmlyc3RUaW1lOiB0cnVlLCBcIm5ld0xheW91dERldGFpbFwiOiBuZXdMYXlvdXREZXRhaWwsIFwib2xkTGF5b3V0RGV0YWlsXCI6IG9sZExheW91dERldGFpbCxcIm9ubHlBZGp1c3ROb2RlUG9zaXRpb25cIjpvbmx5QWRqdXN0Tm9kZVBvc2l0aW9ufVxyXG4gICAgKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuYXBwbHlFZGdlQmVuZGNvbnRyb2xQb2ludHMgPSBmdW5jdGlvbiAoc3JjSUQscmVsYXRpb25zaGlwSURcclxuICAgICxjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHMsY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXMsY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzLGN5ZWRnZWNvbnRyb2xlZGl0aW5nRGlzdGFuY2VzKSB7XHJcbiAgICAgICAgdmFyIHRoZU5vZGU9dGhpcy5jb3JlLmZpbHRlcignW2lkID0gXCInK3NyY0lEKydcIl0nKTtcclxuICAgICAgICBpZih0aGVOb2RlLmxlbmd0aD09MCkgcmV0dXJuO1xyXG4gICAgICAgIHZhciBlZGdlcz10aGVOb2RlLmNvbm5lY3RlZEVkZ2VzKCkudG9BcnJheSgpXHJcbiAgICAgICAgZm9yKHZhciBpPTA7aTxlZGdlcy5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgdmFyIGFuRWRnZT1lZGdlc1tpXVxyXG4gICAgICAgICAgICBpZihhbkVkZ2UuZGF0YShcIm9yaWdpbmFsSW5mb1wiKVtcIiRyZWxhdGlvbnNoaXBJZFwiXT09cmVsYXRpb25zaGlwSUQpe1xyXG4gICAgICAgICAgICAgICAgaWYoY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzKXtcclxuICAgICAgICAgICAgICAgICAgICBhbkVkZ2UuZGF0YShcImN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0c1wiLGN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0cylcclxuICAgICAgICAgICAgICAgICAgICBhbkVkZ2UuZGF0YShcImN5ZWRnZWJlbmRlZGl0aW5nRGlzdGFuY2VzXCIsY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXMpXHJcbiAgICAgICAgICAgICAgICAgICAgYW5FZGdlLmFkZENsYXNzKCdlZGdlYmVuZGVkaXRpbmctaGFzYmVuZHBvaW50cycpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYoY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzKXtcclxuICAgICAgICAgICAgICAgICAgICBhbkVkZ2UuZGF0YShcImN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0c1wiLGN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cylcclxuICAgICAgICAgICAgICAgICAgICBhbkVkZ2UuZGF0YShcImN5ZWRnZWNvbnRyb2xlZGl0aW5nRGlzdGFuY2VzXCIsY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXMpXHJcbiAgICAgICAgICAgICAgICAgICAgYW5FZGdlLmFkZENsYXNzKCdlZGdlY29udHJvbGVkaXRpbmctaGFzY29udHJvbHBvaW50cycpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBicmVha1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG59XHJcblxyXG5cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5nZXRDdXJyZW50TGF5b3V0RGV0YWlsID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGxheW91dERpY3Q9e1wiZWRnZXNcIjp7fX1cclxuICAgIGlmKHRoaXMuY29yZS5ub2RlcygpLnNpemUoKT09MCkgcmV0dXJuIGxheW91dERpY3Q7XHJcbiAgICAvL3N0b3JlIG5vZGVzIHBvc2l0aW9uXHJcbiAgICB0aGlzLmNvcmUubm9kZXMoKS5mb3JFYWNoKG9uZU5vZGU9PntcclxuICAgICAgICB2YXIgcG9zaXRpb249b25lTm9kZS5wb3NpdGlvbigpXHJcbiAgICAgICAgbGF5b3V0RGljdFtvbmVOb2RlLmlkKCldPVt0aGlzLm51bWJlclByZWNpc2lvbihwb3NpdGlvblsneCddKSx0aGlzLm51bWJlclByZWNpc2lvbihwb3NpdGlvblsneSddKV1cclxuICAgIH0pXHJcblxyXG4gICAgLy9zdG9yZSBhbnkgZWRnZSBiZW5kaW5nIHBvaW50cyBvciBjb250cm9saW5nIHBvaW50c1xyXG4gICAgdGhpcy5jb3JlLmVkZ2VzKCkuZm9yRWFjaChvbmVFZGdlPT57XHJcbiAgICAgICAgdmFyIHNyY0lEPW9uZUVkZ2UuZGF0YShcIm9yaWdpbmFsSW5mb1wiKVtcIiRzb3VyY2VJZFwiXVxyXG4gICAgICAgIHZhciByZWxhdGlvbnNoaXBJRD1vbmVFZGdlLmRhdGEoXCJvcmlnaW5hbEluZm9cIilbXCIkcmVsYXRpb25zaGlwSWRcIl1cclxuICAgICAgICB2YXIgY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzPW9uZUVkZ2UuZGF0YSgnY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzJylcclxuICAgICAgICB2YXIgY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXM9b25lRWRnZS5kYXRhKCdjeWVkZ2ViZW5kZWRpdGluZ0Rpc3RhbmNlcycpXHJcbiAgICAgICAgdmFyIGN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cz1vbmVFZGdlLmRhdGEoJ2N5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cycpXHJcbiAgICAgICAgdmFyIGN5ZWRnZWNvbnRyb2xlZGl0aW5nRGlzdGFuY2VzPW9uZUVkZ2UuZGF0YSgnY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXMnKVxyXG4gICAgICAgIGlmKCFjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHMgJiYgIWN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cykgcmV0dXJuO1xyXG5cclxuICAgICAgICBpZihsYXlvdXREaWN0LmVkZ2VzW3NyY0lEXT09bnVsbClsYXlvdXREaWN0LmVkZ2VzW3NyY0lEXT17fVxyXG4gICAgICAgIGxheW91dERpY3QuZWRnZXNbc3JjSURdW3JlbGF0aW9uc2hpcElEXT17fVxyXG4gICAgICAgIGlmKGN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0cyAmJiBjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHMubGVuZ3RoPjApIHtcclxuICAgICAgICAgICAgbGF5b3V0RGljdC5lZGdlc1tzcmNJRF1bcmVsYXRpb25zaGlwSURdW1wiY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzXCJdPXRoaXMubnVtYmVyUHJlY2lzaW9uKGN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0cylcclxuICAgICAgICAgICAgbGF5b3V0RGljdC5lZGdlc1tzcmNJRF1bcmVsYXRpb25zaGlwSURdW1wiY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXNcIl09dGhpcy5udW1iZXJQcmVjaXNpb24oY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXMpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKGN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cyAmJiBjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHMubGVuZ3RoPjApIHtcclxuICAgICAgICAgICAgbGF5b3V0RGljdC5lZGdlc1tzcmNJRF1bcmVsYXRpb25zaGlwSURdW1wiY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzXCJdPXRoaXMubnVtYmVyUHJlY2lzaW9uKGN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cylcclxuICAgICAgICAgICAgbGF5b3V0RGljdC5lZGdlc1tzcmNJRF1bcmVsYXRpb25zaGlwSURdW1wiY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXNcIl09dGhpcy5udW1iZXJQcmVjaXNpb24oY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXMpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuICAgIHJldHVybiBsYXlvdXREaWN0O1xyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuc2F2ZUxheW91dCA9IGFzeW5jIGZ1bmN0aW9uIChsYXlvdXROYW1lLGFkdE5hbWUpIHtcclxuICAgIHZhciBsYXlvdXREaWN0PWdsb2JhbENhY2hlLmxheW91dEpTT05bbGF5b3V0TmFtZV1cclxuICAgIGlmKCFsYXlvdXREaWN0KXtcclxuICAgICAgICBsYXlvdXREaWN0PWdsb2JhbENhY2hlLmxheW91dEpTT05bbGF5b3V0TmFtZV09e31cclxuICAgIH1cclxuICAgIGlmKGxheW91dERpY3RbXCJlZGdlc1wiXT09bnVsbCkgbGF5b3V0RGljdFtcImVkZ2VzXCJdPXt9XHJcbiAgICBcclxuICAgIHZhciBzaG93aW5nTGF5b3V0PXRoaXMuZ2V0Q3VycmVudExheW91dERldGFpbCgpXHJcbiAgICB2YXIgc2hvd2luZ0VkZ2VzTGF5b3V0PSBzaG93aW5nTGF5b3V0W1wiZWRnZXNcIl1cclxuICAgIGRlbGV0ZSBzaG93aW5nTGF5b3V0W1wiZWRnZXNcIl1cclxuICAgIGZvcih2YXIgaW5kIGluIHNob3dpbmdMYXlvdXQpIGxheW91dERpY3RbaW5kXT1zaG93aW5nTGF5b3V0W2luZF1cclxuICAgIGZvcih2YXIgaW5kIGluIHNob3dpbmdFZGdlc0xheW91dCkgbGF5b3V0RGljdFtcImVkZ2VzXCJdW2luZF09c2hvd2luZ0VkZ2VzTGF5b3V0W2luZF1cclxuXHJcbiAgICAkLnBvc3QoXCJsYXlvdXQvc2F2ZUxheW91dHNcIix7XCJhZHROYW1lXCI6YWR0TmFtZSxcImxheW91dHNcIjpKU09OLnN0cmluZ2lmeShnbG9iYWxDYWNoZS5sYXlvdXRKU09OKX0pXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJsYXlvdXRzVXBkYXRlZFwifSlcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLm51bWJlclByZWNpc2lvbiA9IGZ1bmN0aW9uIChudW1iZXIpIHtcclxuICAgIGlmKEFycmF5LmlzQXJyYXkobnVtYmVyKSl7XHJcbiAgICAgICAgZm9yKHZhciBpPTA7aTxudW1iZXIubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgIG51bWJlcltpXSA9IHRoaXMubnVtYmVyUHJlY2lzaW9uKG51bWJlcltpXSlcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bWJlclxyXG4gICAgfWVsc2VcclxuICAgIHJldHVybiBwYXJzZUZsb2F0KG51bWJlci50b0ZpeGVkKDMpKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuQ09TRVNlbGVjdGVkTm9kZXMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLm5vUG9zaXRpb25fY29zZSh0aGlzLmNvcmUuJCgnOnNlbGVjdGVkJyksdGhpcy5nZXRDdXJyZW50TGF5b3V0RGV0YWlsKCkpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5oaWRlU2VsZWN0ZWROb2RlcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBzZWxlY3RlZE5vZGVzPXRoaXMuY29yZS5ub2RlcygnOnNlbGVjdGVkJylcclxuICAgIHNlbGVjdGVkTm9kZXMucmVtb3ZlKClcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnNlbGVjdEluYm91bmROb2RlcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBzZWxlY3RlZE5vZGVzPXRoaXMuY29yZS5ub2RlcygnOnNlbGVjdGVkJylcclxuICAgIHZhciBlbGVzPXRoaXMuY29yZS5ub2RlcygpLmVkZ2VzVG8oc2VsZWN0ZWROb2Rlcykuc291cmNlcygpXHJcbiAgICBlbGVzLmZvckVhY2goKGVsZSk9PnsgdGhpcy5hbmltYXRlQU5vZGUoZWxlKSB9KVxyXG4gICAgZWxlcy5zZWxlY3QoKVxyXG4gICAgdGhpcy5zZWxlY3RGdW5jdGlvbigpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5zZWxlY3RPdXRib3VuZE5vZGVzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHNlbGVjdGVkTm9kZXM9dGhpcy5jb3JlLm5vZGVzKCc6c2VsZWN0ZWQnKVxyXG4gICAgdmFyIGVsZXM9c2VsZWN0ZWROb2Rlcy5lZGdlc1RvKHRoaXMuY29yZS5ub2RlcygpKS50YXJnZXRzKClcclxuICAgIGVsZXMuZm9yRWFjaCgoZWxlKT0+eyB0aGlzLmFuaW1hdGVBTm9kZShlbGUpIH0pXHJcbiAgICBlbGVzLnNlbGVjdCgpXHJcbiAgICB0aGlzLnNlbGVjdEZ1bmN0aW9uKClcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmFkZENvbm5lY3Rpb25zID0gZnVuY3Rpb24gKHRhcmdldE5vZGUpIHtcclxuICAgIHZhciB0aGVDb25uZWN0TW9kZT10aGlzLnRhcmdldE5vZGVNb2RlXHJcbiAgICB2YXIgc3JjTm9kZUFycj10aGlzLmNvcmUubm9kZXMoXCI6c2VsZWN0ZWRcIilcclxuXHJcbiAgICB2YXIgcHJlcGFyYXRpb25JbmZvPVtdXHJcblxyXG4gICAgc3JjTm9kZUFyci5mb3JFYWNoKHRoZU5vZGU9PntcclxuICAgICAgICB2YXIgY29ubmVjdGlvblR5cGVzXHJcbiAgICAgICAgaWYodGhlQ29ubmVjdE1vZGU9PVwiY29ubmVjdFRvXCIpIHtcclxuICAgICAgICAgICAgY29ubmVjdGlvblR5cGVzPXRoaXMuY2hlY2tBdmFpbGFibGVDb25uZWN0aW9uVHlwZSh0aGVOb2RlLmRhdGEoXCJtb2RlbElEXCIpLHRhcmdldE5vZGUuZGF0YShcIm1vZGVsSURcIikpXHJcbiAgICAgICAgICAgIHByZXBhcmF0aW9uSW5mby5wdXNoKHtmcm9tOnRoZU5vZGUsdG86dGFyZ2V0Tm9kZSxjb25uZWN0OmNvbm5lY3Rpb25UeXBlc30pXHJcbiAgICAgICAgfWVsc2UgaWYodGhlQ29ubmVjdE1vZGU9PVwiY29ubmVjdEZyb21cIikge1xyXG4gICAgICAgICAgICBjb25uZWN0aW9uVHlwZXM9dGhpcy5jaGVja0F2YWlsYWJsZUNvbm5lY3Rpb25UeXBlKHRhcmdldE5vZGUuZGF0YShcIm1vZGVsSURcIiksdGhlTm9kZS5kYXRhKFwibW9kZWxJRFwiKSlcclxuICAgICAgICAgICAgcHJlcGFyYXRpb25JbmZvLnB1c2goe3RvOnRoZU5vZGUsZnJvbTp0YXJnZXROb2RlLGNvbm5lY3Q6Y29ubmVjdGlvblR5cGVzfSlcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG4gICAgLy9UT0RPOiBjaGVjayBpZiBpdCBpcyBuZWVkZWQgdG8gcG9wdXAgZGlhbG9nLCBpZiBhbGwgY29ubmVjdGlvbiBpcyBkb2FibGUgYW5kIG9ubHkgb25lIHR5cGUgdG8gdXNlLCBubyBuZWVkIHRvIHNob3cgZGlhbG9nXHJcbiAgICB0aGlzLnNob3dDb25uZWN0aW9uRGlhbG9nKHByZXBhcmF0aW9uSW5mbylcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnNob3dDb25uZWN0aW9uRGlhbG9nID0gZnVuY3Rpb24gKHByZXBhcmF0aW9uSW5mbykge1xyXG4gICAgdmFyIGNvbmZpcm1EaWFsb2dEaXYgPSBuZXcgc2ltcGxlQ29uZmlybURpYWxvZygpXHJcbiAgICB2YXIgcmVzdWx0QWN0aW9ucz1bXVxyXG4gICAgY29uZmlybURpYWxvZ0Rpdi5zaG93KFxyXG4gICAgICAgIHsgd2lkdGg6IFwiNDUwcHhcIiB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGl0bGU6IFwiQWRkIGNvbm5lY3Rpb25zXCJcclxuICAgICAgICAgICAgLCBjb250ZW50OiBcIlwiXHJcbiAgICAgICAgICAgICwgYnV0dG9uczogW1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtcmVkIHczLWhvdmVyLXBpbmtcIiwgdGV4dDogXCJDb25maXJtXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNyZWF0ZUNvbm5lY3Rpb25zKHJlc3VsdEFjdGlvbnMpXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xvckNsYXNzOiBcInczLWdyYXlcIiwgdGV4dDogXCJDYW5jZWxcIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKClcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9XHJcbiAgICApXHJcbiAgICBjb25maXJtRGlhbG9nRGl2LmRpYWxvZ0Rpdi5lbXB0eSgpXHJcbiAgICBwcmVwYXJhdGlvbkluZm8uZm9yRWFjaCgob25lUm93LGluZGV4KT0+e1xyXG4gICAgICAgIHJlc3VsdEFjdGlvbnMucHVzaCh0aGlzLmNyZWF0ZU9uZUNvbm5lY3Rpb25BZGp1c3RSb3cob25lUm93LGNvbmZpcm1EaWFsb2dEaXYpKVxyXG4gICAgfSlcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmNyZWF0ZU9uZUNvbm5lY3Rpb25BZGp1c3RSb3cgPSBmdW5jdGlvbiAob25lUm93LGNvbmZpcm1EaWFsb2dEaXYpIHtcclxuICAgIHZhciByZXR1cm5PYmo9e31cclxuICAgIHZhciBmcm9tTm9kZT1vbmVSb3cuZnJvbVxyXG4gICAgdmFyIHRvTm9kZT1vbmVSb3cudG9cclxuICAgIHZhciBjb25uZWN0aW9uVHlwZXM9b25lUm93LmNvbm5lY3RcclxuICAgIHZhciBsYWJlbD0kKCc8bGFiZWwgc3R5bGU9XCJkaXNwbGF5OmJsb2NrO21hcmdpbi1ib3R0b206MnB4XCI+PC9sYWJlbD4nKVxyXG4gICAgaWYoY29ubmVjdGlvblR5cGVzLmxlbmd0aD09MCl7XHJcbiAgICAgICAgbGFiZWwuY3NzKFwiY29sb3JcIixcInJlZFwiKVxyXG4gICAgICAgIGxhYmVsLmh0bWwoXCJObyB1c2FibGUgY29ubmVjdGlvbiB0eXBlIGZyb20gPGI+XCIrZnJvbU5vZGUuaWQoKStcIjwvYj4gdG8gPGI+XCIrdG9Ob2RlLmlkKCkrXCI8L2I+XCIpXHJcbiAgICB9ZWxzZSBpZihjb25uZWN0aW9uVHlwZXMubGVuZ3RoPjEpeyBcclxuICAgICAgICBsYWJlbC5odG1sKFwiRnJvbSA8Yj5cIitmcm9tTm9kZS5pZCgpK1wiPC9iPiB0byA8Yj5cIit0b05vZGUuaWQoKStcIjwvYj5cIikgXHJcbiAgICAgICAgdmFyIHN3aXRjaFR5cGVTZWxlY3Rvcj1uZXcgc2ltcGxlU2VsZWN0TWVudShcIiBcIilcclxuICAgICAgICBsYWJlbC5wcmVwZW5kKHN3aXRjaFR5cGVTZWxlY3Rvci5ET00pXHJcbiAgICAgICAgY29ubmVjdGlvblR5cGVzLmZvckVhY2gob25lVHlwZT0+e1xyXG4gICAgICAgICAgICBzd2l0Y2hUeXBlU2VsZWN0b3IuYWRkT3B0aW9uKG9uZVR5cGUpXHJcbiAgICAgICAgfSlcclxuICAgICAgICByZXR1cm5PYmpbXCJmcm9tXCJdPWZyb21Ob2RlLmlkKClcclxuICAgICAgICByZXR1cm5PYmpbXCJ0b1wiXT10b05vZGUuaWQoKVxyXG4gICAgICAgIHJldHVybk9ialtcImNvbm5lY3RcIl09Y29ubmVjdGlvblR5cGVzWzBdXHJcbiAgICAgICAgc3dpdGNoVHlwZVNlbGVjdG9yLmNhbGxCYWNrX2NsaWNrT3B0aW9uPShvcHRpb25UZXh0LG9wdGlvblZhbHVlKT0+e1xyXG4gICAgICAgICAgICByZXR1cm5PYmpbXCJjb25uZWN0XCJdPW9wdGlvblRleHRcclxuICAgICAgICAgICAgc3dpdGNoVHlwZVNlbGVjdG9yLmNoYW5nZU5hbWUob3B0aW9uVGV4dClcclxuICAgICAgICB9XHJcbiAgICAgICAgc3dpdGNoVHlwZVNlbGVjdG9yLnRyaWdnZXJPcHRpb25JbmRleCgwKVxyXG4gICAgfWVsc2UgaWYoY29ubmVjdGlvblR5cGVzLmxlbmd0aD09MSl7XHJcbiAgICAgICAgcmV0dXJuT2JqW1wiZnJvbVwiXT1mcm9tTm9kZS5pZCgpXHJcbiAgICAgICAgcmV0dXJuT2JqW1widG9cIl09dG9Ob2RlLmlkKClcclxuICAgICAgICByZXR1cm5PYmpbXCJjb25uZWN0XCJdPWNvbm5lY3Rpb25UeXBlc1swXVxyXG4gICAgICAgIGxhYmVsLmNzcyhcImNvbG9yXCIsXCJncmVlblwiKVxyXG4gICAgICAgIGxhYmVsLmh0bWwoXCJBZGQgPGI+XCIrY29ubmVjdGlvblR5cGVzWzBdK1wiPC9iPiBjb25uZWN0aW9uIGZyb20gPGI+XCIrZnJvbU5vZGUuaWQoKStcIjwvYj4gdG8gPGI+XCIrdG9Ob2RlLmlkKCkrXCI8L2I+XCIpIFxyXG4gICAgfVxyXG4gICAgY29uZmlybURpYWxvZ0Rpdi5kaWFsb2dEaXYuYXBwZW5kKGxhYmVsKVxyXG4gICAgcmV0dXJuIHJldHVybk9iajtcclxufVxyXG5cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5jcmVhdGVDb25uZWN0aW9ucyA9IGZ1bmN0aW9uIChyZXN1bHRBY3Rpb25zKSB7XHJcbiAgICBmdW5jdGlvbiB1dWlkdjQoKSB7XHJcbiAgICAgICAgcmV0dXJuICd4eHh4eHh4eC14eHh4LTR4eHgteXh4eC14eHh4eHh4eHh4eHgnLnJlcGxhY2UoL1t4eV0vZywgZnVuY3Rpb24gKGMpIHtcclxuICAgICAgICAgICAgdmFyIHIgPSBNYXRoLnJhbmRvbSgpICogMTYgfCAwLCB2ID0gYyA9PSAneCcgPyByIDogKHIgJiAweDMgfCAweDgpO1xyXG4gICAgICAgICAgICByZXR1cm4gdi50b1N0cmluZygxNik7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHZhciBmaW5hbEFjdGlvbnM9W11cclxuICAgIHJlc3VsdEFjdGlvbnMuZm9yRWFjaChvbmVBY3Rpb249PntcclxuICAgICAgICB2YXIgb25lRmluYWxBY3Rpb249e31cclxuICAgICAgICBvbmVGaW5hbEFjdGlvbltcIiRzcmNJZFwiXT1vbmVBY3Rpb25bXCJmcm9tXCJdXHJcbiAgICAgICAgb25lRmluYWxBY3Rpb25bXCIkcmVsYXRpb25zaGlwSWRcIl09dXVpZHY0KCk7XHJcbiAgICAgICAgb25lRmluYWxBY3Rpb25bXCJvYmpcIl09e1xyXG4gICAgICAgICAgICBcIiR0YXJnZXRJZFwiOiBvbmVBY3Rpb25bXCJ0b1wiXSxcclxuICAgICAgICAgICAgXCIkcmVsYXRpb25zaGlwTmFtZVwiOiBvbmVBY3Rpb25bXCJjb25uZWN0XCJdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZpbmFsQWN0aW9ucy5wdXNoKG9uZUZpbmFsQWN0aW9uKVxyXG4gICAgfSlcclxuICAgICQucG9zdChcImVkaXRBRFQvY3JlYXRlUmVsYXRpb25zXCIse2FjdGlvbnM6SlNPTi5zdHJpbmdpZnkoZmluYWxBY3Rpb25zKX0sIChkYXRhLCBzdGF0dXMpID0+IHtcclxuICAgICAgICBpZihkYXRhPT1cIlwiKSByZXR1cm47XHJcbiAgICAgICAgZ2xvYmFsQ2FjaGUuc3RvcmVUd2luUmVsYXRpb25zaGlwc19hcHBlbmQoZGF0YSlcclxuICAgICAgICB0aGlzLmRyYXdSZWxhdGlvbnMoZGF0YSlcclxuICAgIH0pXHJcbn1cclxuXHJcblxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmNoZWNrQXZhaWxhYmxlQ29ubmVjdGlvblR5cGUgPSBmdW5jdGlvbiAoZnJvbU5vZGVNb2RlbCx0b05vZGVNb2RlbCkge1xyXG4gICAgdmFyIHJlPVtdXHJcbiAgICB2YXIgdmFsaWRSZWxhdGlvbnNoaXBzPW1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1tmcm9tTm9kZU1vZGVsXS52YWxpZFJlbGF0aW9uc2hpcHNcclxuICAgIHZhciB0b05vZGVCYXNlQ2xhc3Nlcz1tb2RlbEFuYWx5emVyLkRURExNb2RlbHNbdG9Ob2RlTW9kZWxdLmFsbEJhc2VDbGFzc2VzXHJcbiAgICBpZih2YWxpZFJlbGF0aW9uc2hpcHMpe1xyXG4gICAgICAgIGZvcih2YXIgcmVsYXRpb25OYW1lIGluIHZhbGlkUmVsYXRpb25zaGlwcyl7XHJcbiAgICAgICAgICAgIHZhciB0aGVSZWxhdGlvblR5cGU9dmFsaWRSZWxhdGlvbnNoaXBzW3JlbGF0aW9uTmFtZV1cclxuICAgICAgICAgICAgaWYodGhlUmVsYXRpb25UeXBlLnRhcmdldD09bnVsbFxyXG4gICAgICAgICAgICAgICAgIHx8IHRoZVJlbGF0aW9uVHlwZS50YXJnZXQ9PXRvTm9kZU1vZGVsXHJcbiAgICAgICAgICAgICAgICAgfHx0b05vZGVCYXNlQ2xhc3Nlc1t0aGVSZWxhdGlvblR5cGUudGFyZ2V0XSE9bnVsbCkgcmUucHVzaChyZWxhdGlvbk5hbWUpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHJlXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5zZXRLZXlEb3duRnVuYz1mdW5jdGlvbihpbmNsdWRlQ2FuY2VsQ29ubmVjdE9wZXJhdGlvbil7XHJcbiAgICAkKGRvY3VtZW50KS5vbihcImtleWRvd25cIiwgIChlKT0+e1xyXG4gICAgICAgIGlmIChlLmN0cmxLZXkgJiYgZS50YXJnZXQubm9kZU5hbWUgPT09ICdCT0RZJyl7XHJcbiAgICAgICAgICAgIGlmIChlLndoaWNoID09PSA5MCkgICB0aGlzLnVyLnVuZG8oKTtcclxuICAgICAgICAgICAgZWxzZSBpZiAoZS53aGljaCA9PT0gODkpICAgIHRoaXMudXIucmVkbygpO1xyXG4gICAgICAgICAgICBlbHNlIGlmKGUud2hpY2g9PT04Myl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2Uoe1wibWVzc2FnZVwiOlwicG9wdXBMYXlvdXRFZGl0aW5nXCJ9KVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGUua2V5Q29kZSA9PSAyNykgdGhpcy5jYW5jZWxUYXJnZXROb2RlTW9kZSgpICAgIFxyXG4gICAgfSk7XHJcbn1cclxuXHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuc3RhcnRUYXJnZXROb2RlTW9kZSA9IGZ1bmN0aW9uIChtb2RlKSB7XHJcbiAgICB0aGlzLmNvcmUuYXV0b3Vuc2VsZWN0aWZ5KCB0cnVlICk7XHJcbiAgICB0aGlzLmNvcmUuY29udGFpbmVyKCkuc3R5bGUuY3Vyc29yID0gJ2Nyb3NzaGFpcic7XHJcbiAgICB0aGlzLnRhcmdldE5vZGVNb2RlPW1vZGU7XHJcbiAgICB0aGlzLnNldEtleURvd25GdW5jKFwiaW5jbHVkZUNhbmNlbENvbm5lY3RPcGVyYXRpb25cIilcclxuXHJcbiAgICB0aGlzLmNvcmUubm9kZXMoKS5vbignY2xpY2snLCAoZSk9PntcclxuICAgICAgICB2YXIgY2xpY2tlZE5vZGUgPSBlLnRhcmdldDtcclxuICAgICAgICB0aGlzLmFkZENvbm5lY3Rpb25zKGNsaWNrZWROb2RlKVxyXG4gICAgICAgIC8vZGVsYXkgYSBzaG9ydCB3aGlsZSBzbyBub2RlIHNlbGVjdGlvbiB3aWxsIG5vdCBiZSBjaGFuZ2VkIHRvIHRoZSBjbGlja2VkIHRhcmdldCBub2RlXHJcbiAgICAgICAgc2V0VGltZW91dCgoKT0+e3RoaXMuY2FuY2VsVGFyZ2V0Tm9kZU1vZGUoKX0sNTApXHJcblxyXG4gICAgfSk7XHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5jYW5jZWxUYXJnZXROb2RlTW9kZT1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy50YXJnZXROb2RlTW9kZT1udWxsO1xyXG4gICAgdGhpcy5jb3JlLmNvbnRhaW5lcigpLnN0eWxlLmN1cnNvciA9ICdkZWZhdWx0JztcclxuICAgICQoZG9jdW1lbnQpLm9mZigna2V5ZG93bicpO1xyXG4gICAgdGhpcy5zZXRLZXlEb3duRnVuYygpXHJcbiAgICB0aGlzLmNvcmUubm9kZXMoKS5vZmYoXCJjbGlja1wiKVxyXG4gICAgdGhpcy5jb3JlLmF1dG91bnNlbGVjdGlmeSggZmFsc2UgKTtcclxufVxyXG5cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5ub1Bvc2l0aW9uX2dyaWQ9ZnVuY3Rpb24oZWxlcyl7XHJcbiAgICB2YXIgbmV3TGF5b3V0ID0gZWxlcy5sYXlvdXQoe1xyXG4gICAgICAgIG5hbWU6ICdncmlkJyxcclxuICAgICAgICBhbmltYXRlOiBmYWxzZSxcclxuICAgICAgICBmaXQ6ZmFsc2VcclxuICAgIH0pIFxyXG4gICAgbmV3TGF5b3V0LnJ1bigpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5ub1Bvc2l0aW9uX2Nvc2U9ZnVuY3Rpb24oZWxlcyx1bmRvTGF5b3V0RGV0YWlsKXtcclxuICAgIGlmKGVsZXM9PW51bGwpIGVsZXM9dGhpcy5jb3JlLmVsZW1lbnRzKClcclxuXHJcbiAgICB2YXIgbmV3TGF5b3V0ID1lbGVzLmxheW91dCh7XHJcbiAgICAgICAgbmFtZTogJ2Nvc2UnLFxyXG4gICAgICAgIGdyYXZpdHk6MSxcclxuICAgICAgICBhbmltYXRlOiBmYWxzZVxyXG4gICAgICAgICxmaXQ6ZmFsc2VcclxuICAgIH0pIFxyXG4gICAgbmV3TGF5b3V0LnJ1bigpXHJcbiAgICBpZih1bmRvTGF5b3V0RGV0YWlsKXtcclxuICAgICAgICB2YXIgbmV3TGF5b3V0RGV0YWlsPXRoaXMuZ2V0Q3VycmVudExheW91dERldGFpbCgpXHJcbiAgICAgICAgdGhpcy5hcHBseU5ld0xheW91dFdpdGhVbmRvKG5ld0xheW91dERldGFpbCwgdW5kb0xheW91dERldGFpbClcclxuICAgIH1cclxuICAgIHRoaXMuY29yZS5jZW50ZXIoZWxlcylcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLm5vUG9zaXRpb25fY29uY2VudHJpYz1mdW5jdGlvbihlbGVzLGJveCl7XHJcbiAgICBpZihlbGVzPT1udWxsKSBlbGVzPXRoaXMuY29yZS5lbGVtZW50cygpXHJcbiAgICB2YXIgbmV3TGF5b3V0ID1lbGVzLmxheW91dCh7XHJcbiAgICAgICAgbmFtZTogJ2NvbmNlbnRyaWMnLFxyXG4gICAgICAgIGFuaW1hdGU6IGZhbHNlLFxyXG4gICAgICAgIGZpdDpmYWxzZSxcclxuICAgICAgICBtaW5Ob2RlU3BhY2luZzo2MCxcclxuICAgICAgICBncmF2aXR5OjEsXHJcbiAgICAgICAgYm91bmRpbmdCb3g6Ym94XHJcbiAgICB9KSBcclxuICAgIG5ld0xheW91dC5ydW4oKVxyXG59XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB0b3BvbG9neURPTTsiLCJjb25zdCBzaW1wbGVUcmVlPXJlcXVpcmUoXCIuL3NpbXBsZVRyZWVcIilcclxuY29uc3QgbW9kZWxBbmFseXplcj1yZXF1aXJlKFwiLi9tb2RlbEFuYWx5emVyXCIpXHJcbmNvbnN0IGdsb2JhbENhY2hlID0gcmVxdWlyZShcIi4vZ2xvYmFsQ2FjaGVcIilcclxuXHJcblxyXG5mdW5jdGlvbiB0d2luc1RyZWUoRE9NLCBzZWFyY2hET00pIHtcclxuICAgIHRoaXMudHJlZT1uZXcgc2ltcGxlVHJlZShET00pXHJcbiAgICB0aGlzLm1vZGVsSURNYXBUb05hbWU9e31cclxuXHJcbiAgICB0aGlzLnRyZWUub3B0aW9ucy5ncm91cE5vZGVJY29uRnVuYz0oZ24pPT57XHJcbiAgICAgICAgdmFyIG1vZGVsQ2xhc3M9Z24uaW5mb1tcIkBpZFwiXVxyXG4gICAgICAgIHZhciBjb2xvckNvZGU9XCJkYXJrR3JheVwiXHJcbiAgICAgICAgdmFyIHNoYXBlPVwiZWxsaXBzZVwiXHJcbiAgICAgICAgdmFyIGF2YXJ0YT1udWxsXHJcbiAgICAgICAgdmFyIGRpbWVuc2lvbj0yMDtcclxuICAgICAgICBpZihnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW2dsb2JhbENhY2hlLnNlbGVjdGVkQURUXSAmJiBnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW2dsb2JhbENhY2hlLnNlbGVjdGVkQURUXVttb2RlbENsYXNzXSl7XHJcbiAgICAgICAgICAgIHZhciB2aXN1YWxKc29uID1nbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW2dsb2JhbENhY2hlLnNlbGVjdGVkQURUXVttb2RlbENsYXNzXVxyXG4gICAgICAgICAgICB2YXIgY29sb3JDb2RlPSB2aXN1YWxKc29uLmNvbG9yIHx8IFwiZGFya0dyYXlcIlxyXG4gICAgICAgICAgICB2YXIgc2hhcGU9ICB2aXN1YWxKc29uLnNoYXBlIHx8IFwiZWxsaXBzZVwiXHJcbiAgICAgICAgICAgIHZhciBhdmFydGE9IHZpc3VhbEpzb24uYXZhcnRhIFxyXG4gICAgICAgICAgICBpZih2aXN1YWxKc29uLmRpbWVuc2lvblJhdGlvKSBkaW1lbnNpb24qPXBhcnNlRmxvYXQodmlzdWFsSnNvbi5kaW1lbnNpb25SYXRpbylcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBpY29uRE9NPSQoXCI8ZGl2IHN0eWxlPSd3aWR0aDpcIitkaW1lbnNpb24rXCJweDtoZWlnaHQ6XCIrZGltZW5zaW9uK1wicHg7ZmxvYXQ6bGVmdDtwb3NpdGlvbjpyZWxhdGl2ZSc+PC9kaXY+XCIpXHJcbiAgICAgICAgdmFyIGltZ1NyYz1lbmNvZGVVUklDb21wb25lbnQodGhpcy5zaGFwZVN2ZyhzaGFwZSxjb2xvckNvZGUpKVxyXG4gICAgICAgIGljb25ET00uYXBwZW5kKCQoXCI8aW1nIHNyYz0nZGF0YTppbWFnZS9zdmcreG1sO3V0ZjgsXCIraW1nU3JjK1wiJz48L2ltZz5cIikpXHJcbiAgICAgICAgaWYoYXZhcnRhKXtcclxuICAgICAgICAgICAgdmFyIGF2YXJ0YWltZz0kKFwiPGltZyBzdHlsZT0ncG9zaXRpb246YWJzb2x1dGU7bGVmdDowcHg7d2lkdGg6NjAlO21hcmdpbjoyMCUnIHNyYz0nXCIrYXZhcnRhK1wiJz48L2ltZz5cIilcclxuICAgICAgICAgICAgaWNvbkRPTS5hcHBlbmQoYXZhcnRhaW1nKVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gaWNvbkRPTVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMudHJlZS5jYWxsYmFja19hZnRlclNlbGVjdE5vZGVzPShub2Rlc0Fycixtb3VzZUNsaWNrRGV0YWlsKT0+e1xyXG4gICAgICAgIHZhciBpbmZvQXJyPVtdXHJcbiAgICAgICAgbm9kZXNBcnIuZm9yRWFjaCgoaXRlbSwgaW5kZXgpID0+e1xyXG4gICAgICAgICAgICBpbmZvQXJyLnB1c2goaXRlbS5sZWFmSW5mbylcclxuICAgICAgICB9KTtcclxuICAgICAgICBnbG9iYWxDYWNoZS5zaG93aW5nQ3JlYXRlVHdpbk1vZGVsSUQ9bnVsbDsgXHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwic2hvd0luZm9TZWxlY3RlZE5vZGVzXCIsIGluZm86aW5mb0FyciwgXCJtb3VzZUNsaWNrRGV0YWlsXCI6bW91c2VDbGlja0RldGFpbH0pXHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy50cmVlLmNhbGxiYWNrX2FmdGVyRGJsY2xpY2tOb2RlPSh0aGVOb2RlKT0+e1xyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcIlBhblRvTm9kZVwiLCBpbmZvOnRoZU5vZGUubGVhZkluZm99KVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMudHJlZS5jYWxsYmFja19hZnRlclNlbGVjdEdyb3VwTm9kZT0obm9kZUluZm8pPT57XHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHtcIm1lc3NhZ2VcIjpcInNob3dJbmZvR3JvdXBOb2RlXCIsaW5mbzpub2RlSW5mb30pXHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5zZWFyY2hCb3g9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgIHBsYWNlaG9sZGVyPVwic2VhcmNoLi4uXCIvPicpLmFkZENsYXNzKFwidzMtaW5wdXRcIik7XHJcbiAgICB0aGlzLnNlYXJjaEJveC5jc3Moe1wib3V0bGluZVwiOlwibm9uZVwiLFwiaGVpZ2h0XCI6XCIxMDAlXCIsXCJ3aWR0aFwiOlwiMTAwJVwifSkgXHJcbiAgICBzZWFyY2hET00uYXBwZW5kKHRoaXMuc2VhcmNoQm94KVxyXG5cclxuICAgIHZhciBoaWRlT3JTaG93RW1wdHlHcm91cD0kKCc8YnV0dG9uIHN0eWxlPVwiaGVpZ2h0OjIwcHg7Ym9yZGVyOm5vbmU7cGFkZGluZy1sZWZ0OjJweFwiIGNsYXNzPVwidzMtYmxvY2sgdzMtdGlueSB3My1ob3Zlci1yZWQgdzMtYW1iZXJcIj5IaWRlIEVtcHR5IE1vZGVsczwvYnV0dG9uPicpXHJcbiAgICBzZWFyY2hET00uYXBwZW5kKGhpZGVPclNob3dFbXB0eUdyb3VwKVxyXG4gICAgRE9NLmNzcyhcInRvcFwiLFwiNTBweFwiKVxyXG4gICAgaGlkZU9yU2hvd0VtcHR5R3JvdXAuYXR0cihcInN0YXR1c1wiLFwic2hvd1wiKVxyXG4gICAgaGlkZU9yU2hvd0VtcHR5R3JvdXAub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgaWYoaGlkZU9yU2hvd0VtcHR5R3JvdXAuYXR0cihcInN0YXR1c1wiKT09XCJzaG93XCIpe1xyXG4gICAgICAgICAgICBoaWRlT3JTaG93RW1wdHlHcm91cC5hdHRyKFwic3RhdHVzXCIsXCJoaWRlXCIpXHJcbiAgICAgICAgICAgIGhpZGVPclNob3dFbXB0eUdyb3VwLnRleHQoXCJTaG93IEVtcHR5IE1vZGVsc1wiKVxyXG4gICAgICAgICAgICB0aGlzLnRyZWUub3B0aW9ucy5oaWRlRW1wdHlHcm91cD10cnVlXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIGhpZGVPclNob3dFbXB0eUdyb3VwLmF0dHIoXCJzdGF0dXNcIixcInNob3dcIilcclxuICAgICAgICAgICAgaGlkZU9yU2hvd0VtcHR5R3JvdXAudGV4dChcIkhpZGUgRW1wdHkgTW9kZWxzXCIpXHJcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnRyZWUub3B0aW9ucy5oaWRlRW1wdHlHcm91cFxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnRyZWUuZ3JvdXBOb2Rlcy5mb3JFYWNoKG9uZUdyb3VwTm9kZT0+e29uZUdyb3VwTm9kZS5jaGVja09wdGlvbkhpZGVFbXB0eUdyb3VwKCl9KVxyXG4gICAgfSlcclxuXHJcblxyXG4gICAgdGhpcy5zZWFyY2hCb3gua2V5dXAoKGUpPT57XHJcbiAgICAgICAgaWYoZS5rZXlDb2RlID09IDEzKVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdmFyIGFOb2RlID0gdGhpcy50cmVlLnNlYXJjaFRleHQoJChlLnRhcmdldCkudmFsKCkpXHJcbiAgICAgICAgICAgIGlmKGFOb2RlIT1udWxsKXtcclxuICAgICAgICAgICAgICAgIGFOb2RlLnBhcmVudEdyb3VwTm9kZS5leHBhbmQoKVxyXG4gICAgICAgICAgICAgICAgdGhpcy50cmVlLnNlbGVjdExlYWZOb2RlKGFOb2RlKVxyXG4gICAgICAgICAgICAgICAgdGhpcy50cmVlLnNjcm9sbFRvTGVhZk5vZGUoYU5vZGUpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5cclxudHdpbnNUcmVlLnByb3RvdHlwZS5zaGFwZVN2Zz1mdW5jdGlvbihzaGFwZSxjb2xvcil7XHJcbiAgICBpZihzaGFwZT09XCJlbGxpcHNlXCIpe1xyXG4gICAgICAgIHJldHVybiAnPHN2ZyB4bWxuczpzdmc9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDEwMCAxMDBcIiBmaWxsPVwibm9uZVwiIHZlcnNpb249XCIxLjFcIiA+PGNpcmNsZSBjeD1cIjUwXCIgY3k9XCI1MFwiIHI9XCI1MFwiICBmaWxsPVwiJytjb2xvcisnXCIvPjwvc3ZnPidcclxuICAgIH1lbHNlIGlmKHNoYXBlPT1cImhleGFnb25cIil7XHJcbiAgICAgICAgcmV0dXJuICc8c3ZnIHhtbG5zOnN2Zz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHZpZXdCb3g9XCIwIDAgMTAwIDEwMFwiIGZpbGw9XCJub25lXCIgdmVyc2lvbj1cIjEuMVwiID48cG9seWdvbiBwb2ludHM9XCI1MCAwLCA5My4zIDI1LCA5My4zIDc1LCA1MCAxMDAsIDYuNyA3NSwgNi43IDI1XCIgIGZpbGw9XCInK2NvbG9yKydcIiAvPjwvc3ZnPidcclxuICAgIH1lbHNlIGlmKHNoYXBlPT1cInJvdW5kLXJlY3RhbmdsZVwiKXtcclxuICAgICAgICByZXR1cm4gJzxzdmcgeG1sbnM6c3ZnPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAxMDAgMTAwXCIgZmlsbD1cIm5vbmVcIiB2ZXJzaW9uPVwiMS4xXCIgPjxyZWN0IHg9XCIxMFwiIHk9XCIxMFwiIHJ4PVwiMTBcIiByeT1cIjEwXCIgd2lkdGg9XCI4MFwiIGhlaWdodD1cIjgwXCIgZmlsbD1cIicrY29sb3IrJ1wiIC8+PC9zdmc+J1xyXG4gICAgfVxyXG59XHJcblxyXG50d2luc1RyZWUucHJvdG90eXBlLnJ4TWVzc2FnZT1mdW5jdGlvbihtc2dQYXlsb2FkKXtcclxuICAgIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJBRFREYXRhc291cmNlQ2hhbmdlX3JlcGxhY2VcIikgdGhpcy5BRFREYXRhc291cmNlQ2hhbmdlX3JlcGxhY2UobXNnUGF5bG9hZC5xdWVyeSwgbXNnUGF5bG9hZC50d2lucyxtc2dQYXlsb2FkLkFEVEluc3RhbmNlRG9lc05vdENoYW5nZSlcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cIkFEVERhdGFzb3VyY2VDaGFuZ2VfYXBwZW5kXCIpIHRoaXMuQURURGF0YXNvdXJjZUNoYW5nZV9hcHBlbmQobXNnUGF5bG9hZC5xdWVyeSwgbXNnUGF5bG9hZC50d2lucylcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImRyYXdUd2luc0FuZFJlbGF0aW9uc1wiKSB0aGlzLmRyYXdUd2luc0FuZFJlbGF0aW9ucyhtc2dQYXlsb2FkLmluZm8pXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJBRFRNb2RlbHNDaGFuZ2VcIikgdGhpcy5yZWZyZXNoTW9kZWxzKG1zZ1BheWxvYWQubW9kZWxzKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiYWRkTmV3VHdpblwiKSB0aGlzLmRyYXdPbmVUd2luKG1zZ1BheWxvYWQudHdpbkluZm8pXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJhZGROZXdUd2luc1wiKSB7XHJcbiAgICAgICAgbXNnUGF5bG9hZC50d2luc0luZm8uZm9yRWFjaChvbmVUd2luSW5mbz0+e3RoaXMuZHJhd09uZVR3aW4ob25lVHdpbkluZm8pfSlcclxuICAgIH1cclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInR3aW5zRGVsZXRlZFwiKSB0aGlzLmRlbGV0ZVR3aW5zKG1zZ1BheWxvYWQudHdpbklEQXJyKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiaGlkZVNlbGVjdGVkTm9kZXNcIikgdGhpcy5kZWxldGVUd2lucyhtc2dQYXlsb2FkLnR3aW5JREFycilcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIil7XHJcbiAgICAgICAgaWYoIW1zZ1BheWxvYWQuc3JjTW9kZWxJRCl7IC8vIGNoYW5nZSBtb2RlbCBjbGFzcyB2aXN1YWxpemF0aW9uXHJcbiAgICAgICAgICAgIHRoaXMudHJlZS5ncm91cE5vZGVzLmZvckVhY2goZ249Pntnbi5yZWZyZXNoTmFtZSgpfSlcclxuICAgICAgICB9IFxyXG4gICAgfVxyXG59XHJcblxyXG50d2luc1RyZWUucHJvdG90eXBlLmRlbGV0ZVR3aW5zPWZ1bmN0aW9uKHR3aW5JREFycil7XHJcbiAgICB0d2luSURBcnIuZm9yRWFjaCh0d2luSUQ9PntcclxuICAgICAgICB0aGlzLnRyZWUuZGVsZXRlTGVhZk5vZGUodHdpbklEKVxyXG4gICAgfSlcclxufVxyXG5cclxudHdpbnNUcmVlLnByb3RvdHlwZS5yZWZyZXNoTW9kZWxzPWZ1bmN0aW9uKG1vZGVsc0RhdGEpe1xyXG4gICAgLy9kZWxldGUgYWxsIGdyb3VwIG5vZGVzIG9mIGRlbGV0ZWQgbW9kZWxzXHJcbiAgICB2YXIgYXJyPVtdLmNvbmNhdCh0aGlzLnRyZWUuZ3JvdXBOb2RlcylcclxuICAgIGFyci5mb3JFYWNoKChnbm9kZSk9PntcclxuICAgICAgICBpZihtb2RlbHNEYXRhW2dub2RlLm5hbWVdPT1udWxsKXtcclxuICAgICAgICAgICAgLy9kZWxldGUgdGhpcyBncm91cCBub2RlXHJcbiAgICAgICAgICAgIGdub2RlLmRlbGV0ZVNlbGYoKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcblxyXG4gICAgLy90aGVuIGFkZCBhbGwgZ3JvdXAgbm9kZXMgdGhhdCB0byBiZSBhZGRlZFxyXG4gICAgdmFyIGN1cnJlbnRNb2RlbE5hbWVBcnI9W11cclxuICAgIHRoaXMudHJlZS5ncm91cE5vZGVzLmZvckVhY2goKGdub2RlKT0+e2N1cnJlbnRNb2RlbE5hbWVBcnIucHVzaChnbm9kZS5uYW1lKX0pXHJcblxyXG4gICAgdmFyIGFjdHVhbE1vZGVsTmFtZUFycj1bXVxyXG4gICAgZm9yKHZhciBpbmQgaW4gbW9kZWxzRGF0YSkgYWN0dWFsTW9kZWxOYW1lQXJyLnB1c2goaW5kKVxyXG4gICAgYWN0dWFsTW9kZWxOYW1lQXJyLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEudG9Mb3dlckNhc2UoKS5sb2NhbGVDb21wYXJlKGIudG9Mb3dlckNhc2UoKSkgfSk7XHJcblxyXG4gICAgZm9yKHZhciBpPTA7aTxhY3R1YWxNb2RlbE5hbWVBcnIubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgaWYoaTxjdXJyZW50TW9kZWxOYW1lQXJyLmxlbmd0aCAmJiBjdXJyZW50TW9kZWxOYW1lQXJyW2ldPT1hY3R1YWxNb2RlbE5hbWVBcnJbaV0pIGNvbnRpbnVlXHJcbiAgICAgICAgLy9vdGhlcndpc2UgYWRkIHRoaXMgZ3JvdXAgdG8gdGhlIHRyZWVcclxuICAgICAgICB2YXIgbmV3R3JvdXA9dGhpcy50cmVlLmluc2VydEdyb3VwTm9kZShtb2RlbHNEYXRhW2FjdHVhbE1vZGVsTmFtZUFycltpXV0saSlcclxuICAgICAgICBuZXdHcm91cC5zaHJpbmsoKVxyXG4gICAgICAgIGN1cnJlbnRNb2RlbE5hbWVBcnIuc3BsaWNlKGksIDAsIGFjdHVhbE1vZGVsTmFtZUFycltpXSk7XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG50d2luc1RyZWUucHJvdG90eXBlLkFEVERhdGFzb3VyY2VDaGFuZ2VfYXBwZW5kPWZ1bmN0aW9uKHR3aW5RdWVyeVN0cix0d2luc0RhdGEpe1xyXG4gICAgaWYgKHR3aW5zRGF0YSAhPSBudWxsKSB0aGlzLmFwcGVuZEFsbFR3aW5zKHR3aW5zRGF0YSlcclxuICAgIGVsc2Uge1xyXG4gICAgICAgICQucG9zdChcInF1ZXJ5QURUL2FsbFR3aW5zSW5mb1wiLCB7IHF1ZXJ5OiB0d2luUXVlcnlTdHIgfSwgKGRhdGEpID0+IHtcclxuICAgICAgICAgICAgaWYoZGF0YT09XCJcIikgcmV0dXJuO1xyXG4gICAgICAgICAgICBkYXRhLmZvckVhY2goKG9uZU5vZGUpPT57Z2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbb25lTm9kZVtcIiRkdElkXCJdXSA9IG9uZU5vZGV9KTtcclxuICAgICAgICAgICAgdGhpcy5hcHBlbmRBbGxUd2lucyhkYXRhKVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcbn1cclxuXHJcbnR3aW5zVHJlZS5wcm90b3R5cGUuQURURGF0YXNvdXJjZUNoYW5nZV9yZXBsYWNlPWZ1bmN0aW9uKHR3aW5RdWVyeVN0cix0d2luc0RhdGEsQURUSW5zdGFuY2VEb2VzTm90Q2hhbmdlKXtcclxuICAgIHZhciB0aGVUcmVlPSB0aGlzLnRyZWU7XHJcblxyXG4gICAgaWYgKEFEVEluc3RhbmNlRG9lc05vdENoYW5nZSkge1xyXG4gICAgICAgIC8va2VlcCBhbGwgZ3JvdXAgbm9kZSBhcyBtb2RlbCBpcyB0aGUgc2FtZSwgb25seSBmZXRjaCBhbGwgbGVhZiBub2RlIGFnYWluXHJcbiAgICAgICAgLy9yZW1vdmUgYWxsIGxlYWYgbm9kZXNcclxuICAgICAgICB0aGlzLnRyZWUuY2xlYXJBbGxMZWFmTm9kZXMoKVxyXG4gICAgICAgIGlmICh0d2luc0RhdGEgIT0gbnVsbCkgdGhpcy5yZXBsYWNlQWxsVHdpbnModHdpbnNEYXRhKVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAkLnBvc3QoXCJxdWVyeUFEVC9hbGxUd2luc0luZm9cIiwgeyBxdWVyeTogdHdpblF1ZXJ5U3RyIH0sIChkYXRhKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZihkYXRhPT1cIlwiKSBkYXRhPVtdO1xyXG4gICAgICAgICAgICAgICAgZGF0YS5mb3JFYWNoKChvbmVOb2RlKT0+e2dsb2JhbENhY2hlLnN0b3JlZFR3aW5zW29uZU5vZGVbXCIkZHRJZFwiXV0gPSBvbmVOb2RlfSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlcGxhY2VBbGxUd2lucyhkYXRhKVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgIH1lbHNle1xyXG4gICAgICAgIHRoZVRyZWUucmVtb3ZlQWxsTm9kZXMoKVxyXG4gICAgICAgIGZvciAodmFyIGlkIGluIHRoaXMubW9kZWxJRE1hcFRvTmFtZSkgZGVsZXRlIHRoaXMubW9kZWxJRE1hcFRvTmFtZVtpZF1cclxuICAgICAgICAvL3F1ZXJ5IHRvIGdldCBhbGwgbW9kZWxzXHJcbiAgICAgICAgJC5nZXQoXCJxdWVyeUFEVC9saXN0TW9kZWxzXCIsIChkYXRhLCBzdGF0dXMpID0+IHtcclxuICAgICAgICAgICAgaWYoZGF0YT09XCJcIikgZGF0YT1bXVxyXG4gICAgICAgICAgICB2YXIgdG1wTmFtZUFyciA9IFtdXHJcbiAgICAgICAgICAgIHZhciB0bXBOYW1lVG9PYmogPSB7fVxyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmKGRhdGFbaV1bXCJkaXNwbGF5TmFtZVwiXT09bnVsbCkgZGF0YVtpXVtcImRpc3BsYXlOYW1lXCJdPWRhdGFbaV1bXCJAaWRcIl1cclxuICAgICAgICAgICAgICAgIGlmKCQuaXNQbGFpbk9iamVjdChkYXRhW2ldW1wiZGlzcGxheU5hbWVcIl0pKXtcclxuICAgICAgICAgICAgICAgICAgICBpZihkYXRhW2ldW1wiZGlzcGxheU5hbWVcIl1bXCJlblwiXSkgZGF0YVtpXVtcImRpc3BsYXlOYW1lXCJdPWRhdGFbaV1bXCJkaXNwbGF5TmFtZVwiXVtcImVuXCJdXHJcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBkYXRhW2ldW1wiZGlzcGxheU5hbWVcIl09SlNPTi5zdHJpbmdpZnkoZGF0YVtpXVtcImRpc3BsYXlOYW1lXCJdKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYodG1wTmFtZVRvT2JqW2RhdGFbaV1bXCJkaXNwbGF5TmFtZVwiXV0hPW51bGwpe1xyXG4gICAgICAgICAgICAgICAgICAgIC8vcmVwZWF0ZWQgbW9kZWwgZGlzcGxheSBuYW1lXHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YVtpXVtcImRpc3BsYXlOYW1lXCJdPWRhdGFbaV1bXCJAaWRcIl1cclxuICAgICAgICAgICAgICAgIH0gIFxyXG4gICAgICAgICAgICAgICAgdGhpcy5tb2RlbElETWFwVG9OYW1lW2RhdGFbaV1bXCJAaWRcIl1dID0gZGF0YVtpXVtcImRpc3BsYXlOYW1lXCJdXHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHRtcE5hbWVBcnIucHVzaChkYXRhW2ldW1wiZGlzcGxheU5hbWVcIl0pXHJcbiAgICAgICAgICAgICAgICB0bXBOYW1lVG9PYmpbZGF0YVtpXVtcImRpc3BsYXlOYW1lXCJdXSA9IGRhdGFbaV1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0bXBOYW1lQXJyLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEudG9Mb3dlckNhc2UoKS5sb2NhbGVDb21wYXJlKGIudG9Mb3dlckNhc2UoKSkgfSk7XHJcbiAgICAgICAgICAgIHRtcE5hbWVBcnIuZm9yRWFjaChtb2RlbE5hbWUgPT4ge1xyXG4gICAgICAgICAgICAgICAgdmFyIG5ld0dyb3VwID0gdGhlVHJlZS5hZGRHcm91cE5vZGUodG1wTmFtZVRvT2JqW21vZGVsTmFtZV0pXHJcbiAgICAgICAgICAgICAgICBuZXdHcm91cC5zaHJpbmsoKVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICBtb2RlbEFuYWx5emVyLmNsZWFyQWxsTW9kZWxzKCk7XHJcbiAgICAgICAgICAgIG1vZGVsQW5hbHl6ZXIuYWRkTW9kZWxzKGRhdGEpXHJcbiAgICAgICAgICAgIG1vZGVsQW5hbHl6ZXIuYW5hbHl6ZSgpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHR3aW5zRGF0YSAhPSBudWxsKSB0aGlzLnJlcGxhY2VBbGxUd2lucyh0d2luc0RhdGEpXHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgJC5wb3N0KFwicXVlcnlBRFQvYWxsVHdpbnNJbmZvXCIsIHsgcXVlcnk6IHR3aW5RdWVyeVN0ciB9LCAoZGF0YSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKGRhdGE9PVwiXCIpIGRhdGE9W107XHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YS5mb3JFYWNoKChvbmVOb2RlKT0+e2dsb2JhbENhY2hlLnN0b3JlZFR3aW5zW29uZU5vZGVbXCIkZHRJZFwiXV0gPSBvbmVOb2RlfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXBsYWNlQWxsVHdpbnMoZGF0YSlcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgfVxyXG59XHJcblxyXG50d2luc1RyZWUucHJvdG90eXBlLmRyYXdUd2luc0FuZFJlbGF0aW9ucz0gZnVuY3Rpb24oZGF0YSl7XHJcbiAgICBkYXRhLmNoaWxkVHdpbnNBbmRSZWxhdGlvbnMuZm9yRWFjaChvbmVTZXQ9PntcclxuICAgICAgICBmb3IodmFyIGluZCBpbiBvbmVTZXQuY2hpbGRUd2lucyl7XHJcbiAgICAgICAgICAgIHZhciBvbmVUd2luPW9uZVNldC5jaGlsZFR3aW5zW2luZF1cclxuICAgICAgICAgICAgdGhpcy5kcmF3T25lVHdpbihvbmVUd2luKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcblxyXG4gICAgLy9kcmF3IHRob3NlIGtub3duIHR3aW5zIGZyb20gdGhlIHJlbGF0aW9uc2hpcHNcclxuICAgIHZhciB0d2luc0luZm89e31cclxuICAgIGRhdGEuY2hpbGRUd2luc0FuZFJlbGF0aW9ucy5mb3JFYWNoKG9uZVNldD0+e1xyXG4gICAgICAgIHZhciByZWxhdGlvbnNJbmZvPW9uZVNldFtcInJlbGF0aW9uc2hpcHNcIl1cclxuICAgICAgICByZWxhdGlvbnNJbmZvLmZvckVhY2goKG9uZVJlbGF0aW9uKT0+e1xyXG4gICAgICAgICAgICB2YXIgc3JjSUQ9b25lUmVsYXRpb25bJyRzb3VyY2VJZCddXHJcbiAgICAgICAgICAgIHZhciB0YXJnZXRJRD1vbmVSZWxhdGlvblsnJHRhcmdldElkJ11cclxuICAgICAgICAgICAgaWYoZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbc3JjSURdKVxyXG4gICAgICAgICAgICAgICAgdHdpbnNJbmZvW3NyY0lEXSA9IGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3NyY0lEXVxyXG4gICAgICAgICAgICBpZihnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1t0YXJnZXRJRF0pXHJcbiAgICAgICAgICAgICAgICB0d2luc0luZm9bdGFyZ2V0SURdID0gZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbdGFyZ2V0SURdICAgIFxyXG4gICAgICAgIH0pXHJcbiAgICB9KVxyXG4gICAgdmFyIHRtcEFycj1bXVxyXG4gICAgZm9yKHZhciB0d2luSUQgaW4gdHdpbnNJbmZvKSB0bXBBcnIucHVzaCh0d2luc0luZm9bdHdpbklEXSlcclxuICAgIHRtcEFyci5mb3JFYWNoKG9uZVR3aW49Pnt0aGlzLmRyYXdPbmVUd2luKG9uZVR3aW4pfSlcclxufVxyXG5cclxudHdpbnNUcmVlLnByb3RvdHlwZS5kcmF3T25lVHdpbj0gZnVuY3Rpb24odHdpbkluZm8pe1xyXG4gICAgdmFyIGdyb3VwTmFtZT10aGlzLm1vZGVsSURNYXBUb05hbWVbdHdpbkluZm9bXCIkbWV0YWRhdGFcIl1bXCIkbW9kZWxcIl1dXHJcbiAgICB0aGlzLnRyZWUuYWRkTGVhZm5vZGVUb0dyb3VwKGdyb3VwTmFtZSx0d2luSW5mbyxcInNraXBSZXBlYXRcIilcclxufVxyXG5cclxudHdpbnNUcmVlLnByb3RvdHlwZS5hcHBlbmRBbGxUd2lucz0gZnVuY3Rpb24oZGF0YSl7XHJcbiAgICB2YXIgdHdpbklEQXJyPVtdXHJcbiAgICAvL2NoZWNrIGlmIGFueSBjdXJyZW50IGxlYWYgbm9kZSBkb2VzIG5vdCBoYXZlIHN0b3JlZCBvdXRib3VuZCByZWxhdGlvbnNoaXAgZGF0YSB5ZXRcclxuICAgIHRoaXMudHJlZS5ncm91cE5vZGVzLmZvckVhY2goKGdOb2RlKT0+e1xyXG4gICAgICAgIGdOb2RlLmNoaWxkTGVhZk5vZGVzLmZvckVhY2gobGVhZk5vZGU9PntcclxuICAgICAgICAgICAgdmFyIG5vZGVJZD1sZWFmTm9kZS5sZWFmSW5mb1tcIiRkdElkXCJdXHJcbiAgICAgICAgICAgIGlmKGdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tub2RlSWRdPT1udWxsKSB0d2luSURBcnIucHVzaChub2RlSWQpXHJcbiAgICAgICAgfSlcclxuICAgIH0pXHJcblxyXG4gICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiYXBwZW5kQWxsVHdpbnNcIixpbmZvOmRhdGF9KVxyXG4gICAgZm9yKHZhciBpPTA7aTxkYXRhLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBncm91cE5hbWU9dGhpcy5tb2RlbElETWFwVG9OYW1lW2RhdGFbaV1bXCIkbWV0YWRhdGFcIl1bXCIkbW9kZWxcIl1dXHJcbiAgICAgICAgdGhpcy50cmVlLmFkZExlYWZub2RlVG9Hcm91cChncm91cE5hbWUsZGF0YVtpXSxcInNraXBSZXBlYXRcIilcclxuICAgICAgICB0d2luSURBcnIucHVzaChkYXRhW2ldW1wiJGR0SWRcIl0pXHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5mZXRjaEFsbFJlbGF0aW9uc2hpcHModHdpbklEQXJyKVxyXG59XHJcblxyXG50d2luc1RyZWUucHJvdG90eXBlLnJlcGxhY2VBbGxUd2lucz0gZnVuY3Rpb24oZGF0YSl7XHJcbiAgICB2YXIgdHdpbklEQXJyPVtdXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJyZXBsYWNlQWxsVHdpbnNcIixpbmZvOmRhdGF9KVxyXG4gICAgZm9yKHZhciBpPTA7aTxkYXRhLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBncm91cE5hbWU9dGhpcy5tb2RlbElETWFwVG9OYW1lW2RhdGFbaV1bXCIkbWV0YWRhdGFcIl1bXCIkbW9kZWxcIl1dXHJcbiAgICAgICAgdGhpcy50cmVlLmFkZExlYWZub2RlVG9Hcm91cChncm91cE5hbWUsZGF0YVtpXSlcclxuICAgICAgICB0d2luSURBcnIucHVzaChkYXRhW2ldW1wiJGR0SWRcIl0pXHJcbiAgICB9XHJcbiAgICB0aGlzLmZldGNoQWxsUmVsYXRpb25zaGlwcyh0d2luSURBcnIpXHJcbn1cclxuXHJcbnR3aW5zVHJlZS5wcm90b3R5cGUuZmV0Y2hBbGxSZWxhdGlvbnNoaXBzPSBhc3luYyBmdW5jdGlvbih0d2luSURBcnIpe1xyXG4gICAgd2hpbGUodHdpbklEQXJyLmxlbmd0aD4wKXtcclxuICAgICAgICB2YXIgc21hbGxBcnI9IHR3aW5JREFyci5zcGxpY2UoMCwgMTAwKTtcclxuICAgICAgICB2YXIgZGF0YT1hd2FpdCB0aGlzLmZldGNoUGFydGlhbFJlbGF0aW9uc2hpcHMoc21hbGxBcnIpXHJcbiAgICAgICAgaWYoZGF0YT09XCJcIikgY29udGludWU7XHJcbiAgICAgICAgZ2xvYmFsQ2FjaGUuc3RvcmVUd2luUmVsYXRpb25zaGlwcyhkYXRhKSAvL3N0b3JlIHRoZW0gaW4gZ2xvYmFsIGF2YWlsYWJsZSBhcnJheVxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImRyYXdBbGxSZWxhdGlvbnNcIixpbmZvOmRhdGF9KVxyXG4gICAgfVxyXG59XHJcblxyXG50d2luc1RyZWUucHJvdG90eXBlLmZldGNoUGFydGlhbFJlbGF0aW9uc2hpcHM9IGFzeW5jIGZ1bmN0aW9uKElEQXJyKXtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICAkLnBvc3QoXCJxdWVyeUFEVC9hbGxSZWxhdGlvbnNoaXBzXCIse2FycjpJREFycn0sIGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKGRhdGEpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1jYXRjaChlKXtcclxuICAgICAgICAgICAgcmVqZWN0KGUpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB0d2luc1RyZWU7Il19
