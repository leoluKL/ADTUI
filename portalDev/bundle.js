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
    
    this.core.on("zoom",(e)=>{
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
        this.smartPositionNode(e.position)
    }
    var setOneTimeGrab = () => {
        this.core.once("grab", (e) => {
            if(e.target.isNode && e.target.isNode()) this.draggingNode=e.target
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
    //consider lock mouse move position for these nodes:
    // - its connectfrom nodes and their connectto nodes
    // - its connectto nodes and their connectfrom nodes
    var incomers=this.draggingNode.incomers()
    var outer=this.draggingNode.outgoers()

    //also find the nearby node within certain x y offset area
    var rpos=this.draggingNode.renderedPosition()
    var nearbyNodes=this.core.collection()
    var threshold=150
    this.core.nodes().forEach(ele=>{
        var eleRPos=ele.renderedPosition()
        if(Math.abs(eleRPos.x-rpos.x)<threshold && Math.abs(eleRPos.y-rpos.y)<threshold) {
            nearbyNodes.merge(ele)
        }
    })
    
    var monitorSet=incomers.union(outer).union(nearbyNodes).filter('node').unmerge(this.draggingNode)

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

        if(this.core.$(`[id="${aRelation.data["source"]}"]`).length==0 
            || this.core.$(`[id="${aRelation.data["target"]}"]`).length==0) continue
        var sourceNode=this.core.$(`[id="${aRelation.data["source"]}"]`)
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
        var topoNode= this.core.nodes(`[id="${nodeName}"]`)
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
            var aTwin=this.core.nodes(`[id="${element['$dtId']}"]`)
            aTwin.select()
            if(mouseClickDetail!=2) this.animateANode(aTwin) //ignore double click second click
        });
    }else if(msgPayload.message=="PanToNode"){
        var nodeInfo= msgPayload.info;
        var topoNode=this.core.nodes(`[id="${nodeInfo["$dtId"]}"]`)
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJwb3J0YWxTb3VyY2VDb2RlL2FkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLmpzIiwicG9ydGFsU291cmNlQ29kZS9lZGl0TGF5b3V0RGlhbG9nLmpzIiwicG9ydGFsU291cmNlQ29kZS9mbG9hdEluZm9XaW5kb3cuanMiLCJwb3J0YWxTb3VyY2VDb2RlL2dsb2JhbENhY2hlLmpzIiwicG9ydGFsU291cmNlQ29kZS9pbmZvUGFuZWwuanMiLCJwb3J0YWxTb3VyY2VDb2RlL21haW4uanMiLCJwb3J0YWxTb3VyY2VDb2RlL21haW5Ub29sYmFyLmpzIiwicG9ydGFsU291cmNlQ29kZS9tYWluVUkuanMiLCJwb3J0YWxTb3VyY2VDb2RlL21vZGVsQW5hbHl6ZXIuanMiLCJwb3J0YWxTb3VyY2VDb2RlL21vZGVsRWRpdG9yRGlhbG9nLmpzIiwicG9ydGFsU291cmNlQ29kZS9tb2RlbE1hbmFnZXJEaWFsb2cuanMiLCJwb3J0YWxTb3VyY2VDb2RlL3NpbXBsZUNvbmZpcm1EaWFsb2cuanMiLCJwb3J0YWxTb3VyY2VDb2RlL3NpbXBsZVNlbGVjdE1lbnUuanMiLCJwb3J0YWxTb3VyY2VDb2RlL3NpbXBsZVRyZWUuanMiLCJwb3J0YWxTb3VyY2VDb2RlL3RvcG9sb2d5RE9NLmpzIiwicG9ydGFsU291cmNlQ29kZS90d2luc1RyZWUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdlRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3A1QkE7QUFDQTtBQUNBOztBQ0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RpQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1b0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0YkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsImNvbnN0IHNpbXBsZVNlbGVjdE1lbnU9IHJlcXVpcmUoXCIuL3NpbXBsZVNlbGVjdE1lbnVcIilcclxuY29uc3Qgc2ltcGxlQ29uZmlybURpYWxvZyA9IHJlcXVpcmUoXCIuL3NpbXBsZUNvbmZpcm1EaWFsb2dcIilcclxuY29uc3QgZ2xvYmFsQ2FjaGUgPSByZXF1aXJlKFwiLi9nbG9iYWxDYWNoZVwiKVxyXG5cclxuZnVuY3Rpb24gYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2coKSB7XHJcbiAgICB0aGlzLmZpbHRlcnM9e31cclxuICAgIHRoaXMucHJldmlvdXNTZWxlY3RlZEFEVD1udWxsXHJcbiAgICB0aGlzLnRlc3RUd2luc0luZm89bnVsbDtcclxuXHJcbiAgICBpZighdGhpcy5ET00pe1xyXG4gICAgICAgIHRoaXMuRE9NID0gJCgnPGRpdiBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RvcDo1MCU7YmFja2dyb3VuZC1jb2xvcjp3aGl0ZTtsZWZ0OjUwJTt0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoLTUwJSkgdHJhbnNsYXRlWSgtNTAlKTt6LWluZGV4OjEwMVwiIGNsYXNzPVwidzMtY2FyZC0yXCI+PC9kaXY+JylcclxuICAgICAgICB0aGlzLkRPTS5jc3MoXCJvdmVyZmxvd1wiLFwiaGlkZGVuXCIpXHJcbiAgICAgICAgJChcImJvZHlcIikuYXBwZW5kKHRoaXMuRE9NKVxyXG4gICAgICAgIGdsb2JhbENhY2hlLm1ha2VET01EcmFnZ2FibGUodGhpcy5ET00pXHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5hZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZy5wcm90b3R5cGUucHJlcGFyYXRpb25GdW5jID0gYXN5bmMgZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgICQuZ2V0KFwidHdpbnNGaWx0ZXIvcmVhZFN0YXJ0RmlsdGVyc1wiLCAoZGF0YSwgc3RhdHVzKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZihkYXRhIT1udWxsICYmIGRhdGEhPVwiXCIpIHRoaXMuZmlsdGVycz1kYXRhO1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfWNhdGNoKGUpe1xyXG4gICAgICAgICAgICByZWplY3QoZSlcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG59XHJcblxyXG5hZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZy5wcm90b3R5cGUucG9wdXAgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAkLmdldChcInF1ZXJ5QURUL2xpc3RBRFRJbnN0YW5jZVwiLCAoZGF0YSwgc3RhdHVzKSA9PiB7XHJcbiAgICAgICAgaWYoZGF0YT09XCJcIikgZGF0YT1bXVxyXG4gICAgICAgIHZhciBhZHRBcnI9ZGF0YTtcclxuICAgICAgICBpZiAoYWR0QXJyLmxlbmd0aCA9PSAwKSByZXR1cm47XHJcblxyXG4gICAgICAgIHRoaXMuRE9NLnNob3coKVxyXG4gICAgICAgIHRoaXMuRE9NLmVtcHR5KClcclxuICAgICAgICB0aGlzLmNvbnRlbnRET009JCgnPGRpdiBjbGFzcz1cInczLW1vZGFsLWNvbnRlbnRcIiBzdHlsZT1cIndpZHRoOjY1MHB4XCI+PC9kaXY+JylcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQodGhpcy5jb250ZW50RE9NKVxyXG4gICAgICAgIHRoaXMuY29udGVudERPTS5hcHBlbmQoJCgnPGRpdiBzdHlsZT1cImhlaWdodDo0MHB4XCIgY2xhc3M9XCJ3My1iYXIgdzMtcmVkXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtXCIgc3R5bGU9XCJmb250LXNpemU6MS41ZW1cIj5DaG9vc2UgRGF0YSBTZXQ8L2Rpdj48L2Rpdj4nKSlcclxuICAgICAgICB2YXIgY2xvc2VCdXR0b249JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yaWdodFwiIHN0eWxlPVwiZm9udC1zaXplOjJlbTtwYWRkaW5nLXRvcDo0cHhcIj7DlzwvYnV0dG9uPicpXHJcbiAgICAgICAgdGhpcy5jb250ZW50RE9NLmNoaWxkcmVuKCc6Zmlyc3QnKS5hcHBlbmQoY2xvc2VCdXR0b24pXHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5idXR0b25Ib2xkZXI9JChcIjxkaXYgc3R5bGU9J2hlaWdodDoxMDAlJz48L2Rpdj5cIilcclxuICAgICAgICB0aGlzLmNvbnRlbnRET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZCh0aGlzLmJ1dHRvbkhvbGRlcilcclxuICAgICAgICBjbG9zZUJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICAgICAgaWYodGhpcy5wcmV2aW91c1NlbGVjdGVkQURUPT1udWxsKSB0aGlzLnVzZUZpbHRlclRvUmVwbGFjZSgpXHJcbiAgICAgICAgICAgIHRoaXMuY2xvc2VEaWFsb2coKVxyXG4gICAgICAgIH0pXHJcbiAgICBcclxuICAgICAgICB2YXIgcm93MT0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCIgc3R5bGU9XCJwYWRkaW5nOjJweFwiPjwvZGl2PicpXHJcbiAgICAgICAgdGhpcy5jb250ZW50RE9NLmFwcGVuZChyb3cxKVxyXG4gICAgICAgIHZhciBsYWJsZT0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtb3BhY2l0eVwiIHN0eWxlPVwicGFkZGluZy1yaWdodDo1cHg7Zm9udC1zaXplOjEuMmVtO1wiPkF6dXJlIERpZ2l0YWwgVHdpbiBJRCA8L2Rpdj4nKVxyXG4gICAgICAgIHJvdzEuYXBwZW5kKGxhYmxlKVxyXG4gICAgICAgIHZhciBzd2l0Y2hBRFRTZWxlY3Rvcj1uZXcgc2ltcGxlU2VsZWN0TWVudShcIiBcIix7d2l0aEJvcmRlcjoxLGZvbnRTaXplOlwiMS4yZW1cIixjb2xvckNsYXNzOlwidzMtbGlnaHQtZ3JheVwiLGJ1dHRvbkNTUzp7XCJwYWRkaW5nXCI6XCI1cHggMTBweFwifX0pXHJcbiAgICAgICAgcm93MS5hcHBlbmQoc3dpdGNoQURUU2VsZWN0b3IuRE9NKVxyXG4gICAgICAgIFxyXG4gICAgICAgIGFkdEFyci5mb3JFYWNoKChhZHRJbnN0YW5jZSk9PntcclxuICAgICAgICAgICAgdmFyIHN0ciA9IGFkdEluc3RhbmNlLnNwbGl0KFwiLlwiKVswXS5yZXBsYWNlKFwiaHR0cHM6Ly9cIiwgXCJcIilcclxuICAgICAgICAgICAgc3dpdGNoQURUU2VsZWN0b3IuYWRkT3B0aW9uKHN0cixhZHRJbnN0YW5jZSlcclxuICAgICAgICAgICAgaWYodGhpcy5maWx0ZXJzW2FkdEluc3RhbmNlXT09bnVsbCkgdGhpcy5maWx0ZXJzW2FkdEluc3RhbmNlXT17fVxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIHN3aXRjaEFEVFNlbGVjdG9yLmNhbGxCYWNrX2NsaWNrT3B0aW9uPShvcHRpb25UZXh0LG9wdGlvblZhbHVlKT0+e1xyXG4gICAgICAgICAgICBzd2l0Y2hBRFRTZWxlY3Rvci5jaGFuZ2VOYW1lKG9wdGlvblRleHQpXHJcbiAgICAgICAgICAgIHRoaXMuc2V0QURUSW5zdGFuY2Uob3B0aW9uVmFsdWUpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgcm93Mj0kKCc8ZGl2IGNsYXNzPVwidzMtY2VsbC1yb3dcIj48L2Rpdj4nKVxyXG4gICAgICAgIHRoaXMuY29udGVudERPTS5hcHBlbmQocm93MilcclxuICAgICAgICB2YXIgbGVmdFNwYW49JCgnPGRpdiBjbGFzcz1cInczLWNlbGxcIiBzdHlsZT1cIndpZHRoOjI0MHB4O3BhZGRpbmctcmlnaHQ6NXB4XCI+PC9kaXY+JylcclxuICAgICAgICBcclxuICAgICAgICBsZWZ0U3Bhbi5hcHBlbmQoJCgnPGRpdiBzdHlsZT1cImhlaWdodDozMHB4XCIgY2xhc3M9XCJ3My1iYXIgdzMtcmVkXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtXCIgc3R5bGU9XCJcIj5GaWx0ZXJzPC9kaXY+PC9kaXY+JykpXHJcblxyXG4gICAgICAgIHZhciBmaWx0ZXJMaXN0PSQoJzx1bCBjbGFzcz1cInczLXVsIHczLWhvdmVyYWJsZVwiPicpXHJcbiAgICAgICAgZmlsdGVyTGlzdC5jc3Moe1wib3ZlcmZsb3cteFwiOlwiaGlkZGVuXCIsXCJvdmVyZmxvdy15XCI6XCJhdXRvXCIsXCJoZWlnaHRcIjpcIjM0MHB4XCIsIFwiYm9yZGVyLXJpZ2h0XCI6XCJzb2xpZCAxcHggbGlnaHRncmF5XCJ9KVxyXG4gICAgICAgIGxlZnRTcGFuLmFwcGVuZChmaWx0ZXJMaXN0KVxyXG5cclxuICAgICAgICB0aGlzLmZpbHRlckxpc3Q9ZmlsdGVyTGlzdDtcclxuICAgICAgICByb3cyLmFwcGVuZChsZWZ0U3BhbilcclxuICAgICAgICBcclxuICAgICAgICB2YXIgcmlnaHRTcGFuPSQoJzxkaXYgY2xhc3M9XCJ3My1jb250YWluZXIgdzMtY2VsbFwiPjwvZGl2PicpXHJcbiAgICAgICAgcm93Mi5hcHBlbmQocmlnaHRTcGFuKSBcclxuXHJcbiAgICAgICAgdmFyIHBhbmVsQ2FyZD0kKCc8ZGl2IGNsYXNzPVwidzMtY2FyZC0yIHczLXdoaXRlXCIgc3R5bGU9XCJwYWRkaW5nOjEwcHhcIj48L2Rpdj4nKVxyXG4gICAgICAgIHJpZ2h0U3Bhbi5hcHBlbmQocGFuZWxDYXJkKVxyXG4gICAgICAgIHZhciBxdWVyeVNwYW49JChcIjxzcGFuLz5cIilcclxuICAgICAgICBwYW5lbENhcmQuYXBwZW5kKHF1ZXJ5U3BhbilcclxuICAgICAgICBcclxuXHJcbiAgICAgICAgdmFyIG5hbWVJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZVwiICBwbGFjZWhvbGRlcj1cIkNob29zZSBhIGZpbHRlciBvciBmaWxsIGluIG5ldyBmaWx0ZXIgbmFtZS4uLlwiLz4nKS5hZGRDbGFzcyhcInczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgICAgICB0aGlzLnF1ZXJ5TmFtZUlucHV0PW5hbWVJbnB1dDtcclxuICAgICAgICB2YXIgcXVlcnlMYmw9JCgnPGRpdiBjbGFzcz1cInczLWJhciB3My1yZWRcIiBzdHlsZT1cInBhZGRpbmctbGVmdDo1cHg7bWFyZ2luLXRvcDoycHg7d2lkdGg6NTAlXCI+UXVlcnkgU2VudGVuY2U8L2Rpdj4nKVxyXG4gICAgICAgIHZhciBxdWVyeUlucHV0PSQoJzx0ZXh0YXJlYSBzdHlsZT1cInJlc2l6ZTpub25lO2hlaWdodDo4MHB4O291dGxpbmU6bm9uZTttYXJnaW4tYm90dG9tOjJweFwiICBwbGFjZWhvbGRlcj1cIlNhbXBsZTogU0VMRUNUICogRlJPTSBkaWdpdGFsdHdpbnMgd2hlcmUgSVNfT0ZfTU9ERUwoXFwnbW9kZWxJRFxcJylcIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICAgICAgdGhpcy5xdWVyeUlucHV0PXF1ZXJ5SW5wdXQ7XHJcblxyXG4gICAgICAgIHZhciBzYXZlQnRuPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtaG92ZXItbGlnaHQtZ3JlZW4gdzMtYm9yZGVyLXJpZ2h0XCI+U2F2ZSBGaWx0ZXI8L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciB0ZXN0QnRuPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtaG92ZXItYW1iZXIgdzMtYm9yZGVyLXJpZ2h0XCI+VGVzdCBRdWVyeTwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIGRlbEJ0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWhvdmVyLXBpbmsgdzMtYm9yZGVyLXJpZ2h0XCI+RGVsZXRlIEZpbHRlcjwvYnV0dG9uPicpXHJcblxyXG5cclxuICAgICAgICB0ZXN0QnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMudGVzdFF1ZXJ5KCl9KVxyXG4gICAgICAgIHNhdmVCdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5zYXZlUXVlcnkoKX0pXHJcbiAgICAgICAgZGVsQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMuZGVsUXVlcnkoKX0pXHJcbiAgICAgICAgcXVlcnlTcGFuLmFwcGVuZChuYW1lSW5wdXQscXVlcnlMYmwscXVlcnlJbnB1dCxzYXZlQnRuLHRlc3RCdG4sZGVsQnRuKVxyXG5cclxuICAgICAgICB2YXIgdGVzdFJlc3VsdFNwYW49JChcIjxkaXYgY2xhc3M9J3czLWJvcmRlcic+PC9kaXY+XCIpXHJcbiAgICAgICAgdmFyIHRlc3RSZXN1bHRUYWJsZT0kKFwiPHRhYmxlPjwvdGFibGU+XCIpXHJcbiAgICAgICAgdGhpcy50ZXN0UmVzdWx0VGFibGU9dGVzdFJlc3VsdFRhYmxlXHJcbiAgICAgICAgdGVzdFJlc3VsdFNwYW4uY3NzKHtcIm1hcmdpbi10b3BcIjpcIjJweFwiLG92ZXJmbG93OlwiYXV0b1wiLGhlaWdodDpcIjE3NXB4XCIsd2lkdGg6XCI0MDBweFwifSlcclxuICAgICAgICB0ZXN0UmVzdWx0VGFibGUuY3NzKHtcImJvcmRlci1jb2xsYXBzZVwiOlwiY29sbGFwc2VcIn0pXHJcbiAgICAgICAgcGFuZWxDYXJkLmFwcGVuZCh0ZXN0UmVzdWx0U3BhbilcclxuICAgICAgICB0ZXN0UmVzdWx0U3Bhbi5hcHBlbmQodGVzdFJlc3VsdFRhYmxlKVxyXG5cclxuXHJcbiAgICAgICAgaWYodGhpcy5wcmV2aW91c1NlbGVjdGVkQURUIT1udWxsKXtcclxuICAgICAgICAgICAgc3dpdGNoQURUU2VsZWN0b3IudHJpZ2dlck9wdGlvblZhbHVlKHRoaXMucHJldmlvdXNTZWxlY3RlZEFEVClcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgc3dpdGNoQURUU2VsZWN0b3IudHJpZ2dlck9wdGlvbkluZGV4KDApXHJcbiAgICAgICAgfVxyXG5cclxuICAgIH0pO1xyXG59XHJcblxyXG5hZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZy5wcm90b3R5cGUuc2V0QURUSW5zdGFuY2U9ZnVuY3Rpb24oc2VsZWN0ZWRBRFQpe1xyXG4gICAgdGhpcy5idXR0b25Ib2xkZXIuZW1wdHkoKVxyXG4gICAgaWYodGhpcy5wcmV2aW91c1NlbGVjdGVkQURUPT1udWxsIHx8IHRoaXMucHJldmlvdXNTZWxlY3RlZEFEVCA9PSBzZWxlY3RlZEFEVCl7XHJcbiAgICAgICAgdmFyIHJlcGxhY2VCdXR0b249JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1jYXJkIHczLWRlZXAtb3JhbmdlIHczLWhvdmVyLWdyZWVuXCIgc3R5bGU9XCJoZWlnaHQ6MTAwJTsgbWFyZ2luLXJpZ2h0OjhweFwiPlJlcGxhY2UgQWxsIERhdGE8L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBhcHBlbmRCdXR0b249JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1jYXJkIHczLWRlZXAtb3JhbmdlIHczLWhvdmVyLWdyZWVuXCIgc3R5bGU9XCJoZWlnaHQ6MTAwJVwiPkFwcGVuZCBEYXRhPC9idXR0b24+JylcclxuXHJcbiAgICAgICAgcmVwbGFjZUJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PiB7IHRoaXMudXNlRmlsdGVyVG9SZXBsYWNlKCkgIH0gIClcclxuICAgICAgICBhcHBlbmRCdXR0b24ub24oXCJjbGlja1wiLCAoKT0+IHsgdGhpcy51c2VGaWx0ZXJUb0FwcGVuZCgpICB9ICApXHJcbiAgICAgICAgdGhpcy5idXR0b25Ib2xkZXIuYXBwZW5kKHJlcGxhY2VCdXR0b24sYXBwZW5kQnV0dG9uKVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgdmFyIHJlcGxhY2VCdXR0b249JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ncmVlbiB3My1ib3JkZXItcmlnaHRcIiBzdHlsZT1cImhlaWdodDoxMDAlXCI+UmVwbGFjZSBBbGwgRGF0YTwvYnV0dG9uPicpXHJcbiAgICAgICAgcmVwbGFjZUJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PiB7IHRoaXMudXNlRmlsdGVyVG9SZXBsYWNlKCkgIH0gIClcclxuICAgICAgICB0aGlzLmJ1dHRvbkhvbGRlci5hcHBlbmQocmVwbGFjZUJ1dHRvbilcclxuICAgIH1cclxuICAgIGdsb2JhbENhY2hlLnNlbGVjdGVkQURUID0gc2VsZWN0ZWRBRFRcclxuICAgIGlmICghZ2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVF0pXHJcbiAgICAgICAgICAgIGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bZ2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFRdID0ge31cclxuICAgIHRoaXMubGlzdEZpbHRlcnMoc2VsZWN0ZWRBRFQpXHJcbiAgICAkLmFqYXhTZXR1cCh7XHJcbiAgICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgICAgICAnYWR0SW5zdGFuY2UnOiBnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVFxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG59XHJcblxyXG5cclxuYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cucHJvdG90eXBlLmRlbFF1ZXJ5PWZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgcXVlcnlOYW1lPXRoaXMucXVlcnlOYW1lSW5wdXQudmFsKClcclxuICAgIGlmKHF1ZXJ5TmFtZT09XCJBTExcIiB8fCBxdWVyeU5hbWU9PVwiXCIpcmV0dXJuO1xyXG4gICAgdmFyIGNvbmZpcm1EaWFsb2dEaXY9bmV3IHNpbXBsZUNvbmZpcm1EaWFsb2coKVxyXG5cclxuICAgIGNvbmZpcm1EaWFsb2dEaXYuc2hvdyhcclxuICAgICAgICB7IHdpZHRoOiBcIjI1MHB4XCIgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIkNvbmZpcm1cIlxyXG4gICAgICAgICAgICAsIGNvbnRlbnQ6IFwiUGxlYXNlIGNvbmZpcm0gZGVsZXRpbmcgZmlsdGVyIFxcXCJcIitxdWVyeU5hbWUrXCJcXFwiP1wiXHJcbiAgICAgICAgICAgICwgYnV0dG9uczpbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1yZWQgdzMtaG92ZXItcGlua1wiLCB0ZXh0OiBcIkNvbmZpcm1cIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnF1ZXJ5TmFtZUlucHV0LnZhbChcIlwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnF1ZXJ5SW5wdXQudmFsKFwiXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudGVzdFJlc3VsdFRhYmxlLmVtcHR5KClcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuZmlsdGVyc1tnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVF1bcXVlcnlOYW1lXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxpc3RGaWx0ZXJzKGdsb2JhbENhY2hlLnNlbGVjdGVkQURUKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNob29zZU9uZUZpbHRlcihcIlwiLCBcIlwiKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAkLnBvc3QoXCJ0d2luc0ZpbHRlci9zYXZlU3RhcnRGaWx0ZXJzXCIsIHsgZmlsdGVyczogdGhpcy5maWx0ZXJzIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKTtcclxuICAgICAgICAgICAgICAgIH19LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtZ3JheVwiLHRleHQ6IFwiQ2FuY2VsXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpXHJcbiAgICAgICAgICAgICAgICB9fVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfVxyXG4gICAgKVxyXG59XHJcblxyXG5hZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZy5wcm90b3R5cGUuc2F2ZVF1ZXJ5PWZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgcXVlcnlOYW1lPXRoaXMucXVlcnlOYW1lSW5wdXQudmFsKClcclxuICAgIHZhciBxdWVyeVN0cj10aGlzLnF1ZXJ5SW5wdXQudmFsKClcclxuICAgIGlmKHF1ZXJ5TmFtZT09XCJcIil7XHJcbiAgICAgICAgYWxlcnQoXCJQbGVhc2UgZmlsbCBpbiBxdWVyeSBuYW1lXCIpXHJcbiAgICAgICAgcmV0dXJuXHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5maWx0ZXJzW2dsb2JhbENhY2hlLnNlbGVjdGVkQURUXVtxdWVyeU5hbWVdPXF1ZXJ5U3RyXHJcbiAgICB0aGlzLmxpc3RGaWx0ZXJzKGdsb2JhbENhY2hlLnNlbGVjdGVkQURUKVxyXG5cclxuICAgIHRoaXMuZmlsdGVyTGlzdC5jaGlsZHJlbigpLmVhY2goKGluZGV4LGVsZSk9PntcclxuICAgICAgICBpZigkKGVsZSkuZGF0YShcImZpbHRlck5hbWVcIik9PXF1ZXJ5TmFtZSkge1xyXG4gICAgICAgICAgICAkKGVsZSkudHJpZ2dlcihcImNsaWNrXCIpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuXHJcbiAgICAvL3N0b3JlIGZpbHRlcnMgdG8gc2VydmVyIHNpZGUgYXMgYSBmaWxlXHJcbiAgICAkLnBvc3QoXCJ0d2luc0ZpbHRlci9zYXZlU3RhcnRGaWx0ZXJzXCIse2ZpbHRlcnM6dGhpcy5maWx0ZXJzfSlcclxufVxyXG5cclxuYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cucHJvdG90eXBlLnRlc3RRdWVyeT1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy50ZXN0UmVzdWx0VGFibGUuZW1wdHkoKVxyXG4gICAgdmFyIHF1ZXJ5U3RyPSB0aGlzLnF1ZXJ5SW5wdXQudmFsKClcclxuICAgIGlmKHF1ZXJ5U3RyPT1cIlwiKSByZXR1cm47XHJcbiAgICAkLnBvc3QoXCJxdWVyeUFEVC9hbGxUd2luc0luZm9cIix7cXVlcnk6cXVlcnlTdHJ9LCAoZGF0YSk9PiB7XHJcbiAgICAgICAgaWYoZGF0YT09XCJcIikgZGF0YT1bXVxyXG4gICAgICAgIGlmKCFBcnJheS5pc0FycmF5KGRhdGEpKSB7XHJcbiAgICAgICAgICAgIGFsZXJ0KFwiUXVlcnkgaXMgbm90IGNvcnJlY3QhXCIpXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy50ZXN0VHdpbnNJbmZvPWRhdGFcclxuICAgICAgICBpZihkYXRhLmxlbmd0aD09MCl7XHJcbiAgICAgICAgICAgIHZhciB0cj0kKCc8dHI+PHRkIHN0eWxlPVwiY29sb3I6Z3JheVwiPnplcm8gcmVjb3JkPC90ZD48dGQgc3R5bGU9XCJib3JkZXItYm90dG9tOnNvbGlkIDFweCBsaWdodGdyZXlcIj48L3RkPjwvdHI+JylcclxuICAgICAgICAgICAgdGhpcy50ZXN0UmVzdWx0VGFibGUuYXBwZW5kKHRyKVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICB2YXIgdHI9JCgnPHRyPjx0ZCBzdHlsZT1cImJvcmRlci1yaWdodDpzb2xpZCAxcHggbGlnaHRncmV5O2JvcmRlci1ib3R0b206c29saWQgMXB4IGxpZ2h0Z3JleTtmb250LXdlaWdodDpib2xkXCI+SUQ8L3RkPjx0ZCBzdHlsZT1cImJvcmRlci1ib3R0b206c29saWQgMXB4IGxpZ2h0Z3JleTtmb250LXdlaWdodDpib2xkXCI+TU9ERUw8L3RkPjwvdHI+JylcclxuICAgICAgICAgICAgdGhpcy50ZXN0UmVzdWx0VGFibGUuYXBwZW5kKHRyKVxyXG4gICAgICAgICAgICBkYXRhLmZvckVhY2goKG9uZU5vZGUpPT57XHJcbiAgICAgICAgICAgICAgICBnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1tvbmVOb2RlW1wiJGR0SWRcIl1dID0gb25lTm9kZTtcclxuICAgICAgICAgICAgICAgIHZhciB0cj0kKCc8dHI+PHRkIHN0eWxlPVwiYm9yZGVyLXJpZ2h0OnNvbGlkIDFweCBsaWdodGdyZXk7Ym9yZGVyLWJvdHRvbTpzb2xpZCAxcHggbGlnaHRncmV5XCI+JytvbmVOb2RlW1wiJGR0SWRcIl0rJzwvdGQ+PHRkIHN0eWxlPVwiYm9yZGVyLWJvdHRvbTpzb2xpZCAxcHggbGlnaHRncmV5XCI+JytvbmVOb2RlWyckbWV0YWRhdGEnXVsnJG1vZGVsJ10rJzwvdGQ+PC90cj4nKVxyXG4gICAgICAgICAgICAgICAgdGhpcy50ZXN0UmVzdWx0VGFibGUuYXBwZW5kKHRyKVxyXG4gICAgICAgICAgICB9KSAgICBcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5cclxuYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cucHJvdG90eXBlLmxpc3RGaWx0ZXJzPWZ1bmN0aW9uKGFkdEluc3RhbmNlTmFtZSl7XHJcbiAgICB2YXIgYXZhaWxhYmxlRmlsdGVycz10aGlzLmZpbHRlcnNbYWR0SW5zdGFuY2VOYW1lXVxyXG4gICAgYXZhaWxhYmxlRmlsdGVyc1tcIkFMTFwiXT1cIlNFTEVDVCAqIEZST00gZGlnaXRhbHR3aW5zXCJcclxuXHJcbiAgICB2YXIgZmlsdGVyTGlzdD10aGlzLmZpbHRlckxpc3Q7XHJcbiAgICBmaWx0ZXJMaXN0LmVtcHR5KClcclxuXHJcbiAgICBmb3IodmFyIGZpbHRlck5hbWUgaW4gYXZhaWxhYmxlRmlsdGVycyl7XHJcbiAgICAgICAgdmFyIG9uZUZpbHRlcj0kKCc8bGkgc3R5bGU9XCJmb250LXNpemU6MWVtXCI+JytmaWx0ZXJOYW1lKyc8L2xpPicpXHJcbiAgICAgICAgb25lRmlsdGVyLmNzcyhcImN1cnNvclwiLFwiZGVmYXVsdFwiKVxyXG4gICAgICAgIG9uZUZpbHRlci5kYXRhKFwiZmlsdGVyTmFtZVwiLCBmaWx0ZXJOYW1lKVxyXG4gICAgICAgIG9uZUZpbHRlci5kYXRhKFwiZmlsdGVyUXVlcnlcIiwgYXZhaWxhYmxlRmlsdGVyc1tmaWx0ZXJOYW1lXSlcclxuICAgICAgICBpZihmaWx0ZXJOYW1lPT1cIkFMTFwiKSBmaWx0ZXJMaXN0LnByZXBlbmQob25lRmlsdGVyKVxyXG4gICAgICAgIGVsc2UgZmlsdGVyTGlzdC5hcHBlbmQob25lRmlsdGVyKVxyXG4gICAgICAgIHRoaXMuYXNzaWduRXZlbnRUb09uZUZpbHRlcihvbmVGaWx0ZXIpXHJcbiAgICAgICAgaWYoZmlsdGVyTmFtZT09XCJBTExcIikgb25lRmlsdGVyLnRyaWdnZXIoXCJjbGlja1wiKVxyXG4gICAgICAgIFxyXG4gICAgICAgIG9uZUZpbHRlci5vbihcImRibGNsaWNrXCIsKGUpPT57XHJcbiAgICAgICAgICAgIGlmKHRoaXMucHJldmlvdXNTZWxlY3RlZEFEVCA9PSBnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVCkgdGhpcy51c2VGaWx0ZXJUb0FwcGVuZCgpO1xyXG4gICAgICAgICAgICBlbHNlIHRoaXMudXNlRmlsdGVyVG9SZXBsYWNlKCk7XHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbmFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLnByb3RvdHlwZS5hc3NpZ25FdmVudFRvT25lRmlsdGVyPWZ1bmN0aW9uKG9uZUZpbHRlcil7XHJcbiAgICBvbmVGaWx0ZXIub24oXCJjbGlja1wiLChlKT0+e1xyXG4gICAgICAgIHRoaXMuZmlsdGVyTGlzdC5jaGlsZHJlbigpLmVhY2goKGluZGV4LGVsZSk9PntcclxuICAgICAgICAgICAgJChlbGUpLnJlbW92ZUNsYXNzKFwidzMtYW1iZXJcIilcclxuICAgICAgICB9KVxyXG4gICAgICAgIG9uZUZpbHRlci5hZGRDbGFzcyhcInczLWFtYmVyXCIpXHJcbiAgICAgICAgdmFyIGZpbHRlck5hbWU9b25lRmlsdGVyLmRhdGEoJ2ZpbHRlck5hbWUnKVxyXG4gICAgICAgIHZhciBxdWVyeVN0cj1vbmVGaWx0ZXIuZGF0YSgnZmlsdGVyUXVlcnknKVxyXG4gICAgICAgIHRoaXMuY2hvb3NlT25lRmlsdGVyKGZpbHRlck5hbWUscXVlcnlTdHIpXHJcbiAgICB9KVxyXG59XHJcblxyXG5hZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZy5wcm90b3R5cGUudXNlRmlsdGVyVG9BcHBlbmQ9ZnVuY3Rpb24oKXtcclxuICAgIGlmKHRoaXMucXVlcnlJbnB1dC52YWwoKT09XCJcIil7XHJcbiAgICAgICAgYWxlcnQoXCJQbGVhc2UgZmlsbCBpbiBxdWVyeSB0byBmZXRjaCBkYXRhIGZyb20gZGlnaXRhbCB0d2luIHNlcnZpY2UuLlwiKVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGlmKHRoaXMucHJldmlvdXNTZWxlY3RlZEFEVD09bnVsbCl7XHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiQURURGF0YXNvdXJjZUNoYW5nZV9yZXBsYWNlXCIsIFwicXVlcnlcIjogdGhpcy5xdWVyeUlucHV0LnZhbCgpLCBcInR3aW5zXCI6dGhpcy50ZXN0VHdpbnNJbmZvIH0pXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB0aGlzLnByZXZpb3VzU2VsZWN0ZWRBRFQ9Z2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFRcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJBRFREYXRhc291cmNlQ2hhbmdlX2FwcGVuZFwiLCBcInF1ZXJ5XCI6IHRoaXMucXVlcnlJbnB1dC52YWwoKSwgXCJ0d2luc1wiOnRoaXMudGVzdFR3aW5zSW5mbyB9KVxyXG4gICAgfVxyXG4gICAgdGhpcy5jbG9zZURpYWxvZygpXHJcbn1cclxuXHJcbmFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLnByb3RvdHlwZS5jbG9zZURpYWxvZz1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5ET00uaGlkZSgpXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJBRFREYXRhc291cmNlRGlhbG9nX2Nsb3NlZFwifSlcclxufVxyXG5cclxuYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cucHJvdG90eXBlLnVzZUZpbHRlclRvUmVwbGFjZT1mdW5jdGlvbigpe1xyXG4gICAgaWYodGhpcy5xdWVyeUlucHV0LnZhbCgpPT1cIlwiKXtcclxuICAgICAgICBhbGVydChcIlBsZWFzZSBmaWxsIGluIHF1ZXJ5IHRvIGZldGNoIGRhdGEgZnJvbSBkaWdpdGFsIHR3aW4gc2VydmljZS4uXCIpXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgdmFyIEFEVEluc3RhbmNlRG9lc05vdENoYW5nZT10cnVlXHJcbiAgICBpZih0aGlzLnByZXZpb3VzU2VsZWN0ZWRBRFQhPWdsb2JhbENhY2hlLnNlbGVjdGVkQURUKXtcclxuICAgICAgICBmb3IodmFyIGluZCBpbiBnbG9iYWxDYWNoZS5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHMpIGRlbGV0ZSBnbG9iYWxDYWNoZS5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbaW5kXVxyXG4gICAgICAgIGZvcih2YXIgaW5kIGluIGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zKSBkZWxldGUgZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbaW5kXVxyXG4gICAgICAgIEFEVEluc3RhbmNlRG9lc05vdENoYW5nZT1mYWxzZVxyXG4gICAgfVxyXG4gICAgdGhpcy5wcmV2aW91c1NlbGVjdGVkQURUPWdsb2JhbENhY2hlLnNlbGVjdGVkQURUXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJBRFREYXRhc291cmNlQ2hhbmdlX3JlcGxhY2VcIiwgXCJxdWVyeVwiOiB0aGlzLnF1ZXJ5SW5wdXQudmFsKClcclxuICAgICwgXCJ0d2luc1wiOnRoaXMudGVzdFR3aW5zSW5mbywgXCJBRFRJbnN0YW5jZURvZXNOb3RDaGFuZ2VcIjpBRFRJbnN0YW5jZURvZXNOb3RDaGFuZ2UgfSlcclxuICAgIFxyXG4gICAgdGhpcy5jbG9zZURpYWxvZygpXHJcbn1cclxuXHJcbmFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLnByb3RvdHlwZS5jaG9vc2VPbmVGaWx0ZXI9ZnVuY3Rpb24ocXVlcnlOYW1lLHF1ZXJ5U3RyKXtcclxuICAgIHRoaXMucXVlcnlOYW1lSW5wdXQudmFsKHF1ZXJ5TmFtZSlcclxuICAgIHRoaXMucXVlcnlJbnB1dC52YWwocXVlcnlTdHIpXHJcbiAgICB0aGlzLnRlc3RSZXN1bHRUYWJsZS5lbXB0eSgpXHJcbiAgICB0aGlzLnRlc3RUd2luc0luZm89bnVsbFxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBhZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZygpOyIsImNvbnN0IHNpbXBsZVNlbGVjdE1lbnU9IHJlcXVpcmUoXCIuL3NpbXBsZVNlbGVjdE1lbnVcIilcclxuY29uc3Qgc2ltcGxlQ29uZmlybURpYWxvZyA9IHJlcXVpcmUoXCIuL3NpbXBsZUNvbmZpcm1EaWFsb2dcIilcclxuY29uc3QgZ2xvYmFsQ2FjaGUgPSByZXF1aXJlKFwiLi9nbG9iYWxDYWNoZVwiKVxyXG5cclxuZnVuY3Rpb24gZWRpdExheW91dERpYWxvZygpIHtcclxuICAgIGlmKCF0aGlzLkRPTSl7XHJcbiAgICAgICAgdGhpcy5ET00gPSAkKCc8ZGl2IHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dG9wOjUwJTtiYWNrZ3JvdW5kLWNvbG9yOndoaXRlO2xlZnQ6NTAlO3RyYW5zZm9ybTogdHJhbnNsYXRlWCgtNTAlKSB0cmFuc2xhdGVZKC01MCUpO3otaW5kZXg6MTAxXCIgY2xhc3M9XCJ3My1jYXJkLTJcIj48L2Rpdj4nKVxyXG4gICAgICAgICQoXCJib2R5XCIpLmFwcGVuZCh0aGlzLkRPTSlcclxuICAgICAgICB0aGlzLkRPTS5oaWRlKClcclxuICAgICAgICBnbG9iYWxDYWNoZS5tYWtlRE9NRHJhZ2dhYmxlKHRoaXMuRE9NKVxyXG4gICAgfVxyXG59XHJcblxyXG5lZGl0TGF5b3V0RGlhbG9nLnByb3RvdHlwZS5nZXRDdXJBRFROYW1lPWZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgYWR0TmFtZSA9IGdsb2JhbENhY2hlLnNlbGVjdGVkQURUXHJcbiAgICB2YXIgc3RyID0gYWR0TmFtZS5yZXBsYWNlKFwiaHR0cHM6Ly9cIiwgXCJcIilcclxuICAgIHJldHVybiBzdHJcclxufVxyXG5cclxuZWRpdExheW91dERpYWxvZy5wcm90b3R5cGUucnhNZXNzYWdlPWZ1bmN0aW9uKG1zZ1BheWxvYWQpe1xyXG4gICAgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cIkFEVERhdGFzb3VyY2VDaGFuZ2VfcmVwbGFjZVwiKSB7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICAkLnBvc3QoXCJsYXlvdXQvcmVhZExheW91dHNcIix7YWR0TmFtZTp0aGlzLmdldEN1ckFEVE5hbWUoKX0sIChkYXRhLCBzdGF0dXMpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmKGRhdGEhPVwiXCIgJiYgdHlwZW9mKGRhdGEpPT09XCJvYmplY3RcIikgZ2xvYmFsQ2FjaGUubGF5b3V0SlNPTj1kYXRhO1xyXG4gICAgICAgICAgICAgICAgZWxzZSBnbG9iYWxDYWNoZS5sYXlvdXRKU09OPXt9O1xyXG4gICAgICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwibGF5b3V0c1VwZGF0ZWRcIn0pXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfWNhdGNoKGUpe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlKVxyXG4gICAgICAgIH1cclxuICAgIFxyXG4gICAgfVxyXG59XHJcblxyXG5lZGl0TGF5b3V0RGlhbG9nLnByb3RvdHlwZS5yZWZpbGxPcHRpb25zID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jbGVhck9wdGlvbnMoKVxyXG4gICAgXHJcbiAgICBmb3IodmFyIGluZCBpbiBnbG9iYWxDYWNoZS5sYXlvdXRKU09OKXtcclxuICAgICAgICB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmFkZE9wdGlvbihpbmQpXHJcbiAgICB9XHJcbn1cclxuXHJcbmVkaXRMYXlvdXREaWFsb2cucHJvdG90eXBlLnBvcHVwID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5ET00uc2hvdygpXHJcbiAgICB0aGlzLkRPTS5lbXB0eSgpXHJcblxyXG4gICAgdGhpcy5ET00uY3NzKHtcIndpZHRoXCI6XCIzMjBweFwiLFwicGFkZGluZy1ib3R0b21cIjpcIjNweFwifSlcclxuICAgIHRoaXMuRE9NLmFwcGVuZCgkKCc8ZGl2IHN0eWxlPVwiaGVpZ2h0OjQwcHg7bWFyZ2luLWJvdHRvbToycHhcIiBjbGFzcz1cInczLWJhciB3My1yZWRcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW1cIiBzdHlsZT1cImZvbnQtc2l6ZToxLjJlbVwiPkxheW91dDwvZGl2PjwvZGl2PicpKVxyXG4gICAgdmFyIGNsb3NlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yaWdodFwiIHN0eWxlPVwiZm9udC1zaXplOjJlbTtwYWRkaW5nLXRvcDo0cHhcIj7DlzwvYnV0dG9uPicpXHJcbiAgICB0aGlzLkRPTS5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKGNsb3NlQnV0dG9uKVxyXG4gICAgY2xvc2VCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMuRE9NLmhpZGUoKSB9KVxyXG5cclxuICAgIHZhciBuYW1lSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7IHdpZHRoOjE4MHB4OyBkaXNwbGF5OmlubGluZTttYXJnaW4tbGVmdDoycHg7bWFyZ2luLXJpZ2h0OjJweFwiICBwbGFjZWhvbGRlcj1cIkZpbGwgaW4gYSBuZXcgbGF5b3V0IG5hbWUuLi5cIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dCB3My1ib3JkZXJcIik7ICAgXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQobmFtZUlucHV0KVxyXG4gICAgdmFyIHNhdmVBc05ld0J0bj0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWdyZWVuIHczLWhvdmVyLWxpZ2h0LWdyZWVuXCI+U2F2ZSBOZXcgTGF5b3V0PC9idXR0b24+JylcclxuICAgIHRoaXMuRE9NLmFwcGVuZChzYXZlQXNOZXdCdG4pXHJcbiAgICBzYXZlQXNOZXdCdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5zYXZlSW50b0xheW91dChuYW1lSW5wdXQudmFsKCkpfSlcclxuXHJcblxyXG4gICAgaWYoISQuaXNFbXB0eU9iamVjdChnbG9iYWxDYWNoZS5sYXlvdXRKU09OKSl7XHJcbiAgICAgICAgdmFyIGxibD0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyIHczLXBhZGRpbmctMTZcIiBzdHlsZT1cInRleHQtYWxpZ246Y2VudGVyO1wiPi0gT1IgLTwvZGl2PicpXHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKGxibCkgXHJcbiAgICAgICAgdmFyIHN3aXRjaExheW91dFNlbGVjdG9yPW5ldyBzaW1wbGVTZWxlY3RNZW51KFwiXCIse2ZvbnRTaXplOlwiMWVtXCIsY29sb3JDbGFzczpcInczLWxpZ2h0LWdyYXlcIix3aWR0aDpcIjEyMHB4XCJ9KVxyXG4gICAgICAgIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3I9c3dpdGNoTGF5b3V0U2VsZWN0b3JcclxuICAgICAgICB0aGlzLnJlZmlsbE9wdGlvbnMoKVxyXG4gICAgICAgIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuY2FsbEJhY2tfY2xpY2tPcHRpb249KG9wdGlvblRleHQsb3B0aW9uVmFsdWUpPT57XHJcbiAgICAgICAgICAgIGlmKG9wdGlvblRleHQ9PW51bGwpIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuY2hhbmdlTmFtZShcIiBcIilcclxuICAgICAgICAgICAgZWxzZSB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmNoYW5nZU5hbWUob3B0aW9uVGV4dClcclxuICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIHZhciBzYXZlQXNCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ncmVlbiB3My1ob3Zlci1saWdodC1ncmVlblwiIHN0eWxlPVwibWFyZ2luLWxlZnQ6MnB4O21hcmdpbi1yaWdodDo1cHhcIj5TYXZlIEFzPC9idXR0b24+JylcclxuICAgICAgICB2YXIgZGVsZXRlQnRuPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtcmVkIHczLWhvdmVyLXBpbmtcIiBzdHlsZT1cIm1hcmdpbi1sZWZ0OjVweFwiPkRlbGV0ZSBMYXlvdXQ8L2J1dHRvbj4nKVxyXG4gICAgICAgIHRoaXMuRE9NLmFwcGVuZChzYXZlQXNCdG4sc3dpdGNoTGF5b3V0U2VsZWN0b3IuRE9NLGRlbGV0ZUJ0bilcclxuICAgICAgICBzYXZlQXNCdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5zYXZlSW50b0xheW91dChzd2l0Y2hMYXlvdXRTZWxlY3Rvci5jdXJTZWxlY3RWYWwpfSlcclxuICAgICAgICBkZWxldGVCdG4ub24oXCJjbGlja1wiLCgpPT57dGhpcy5kZWxldGVMYXlvdXQoc3dpdGNoTGF5b3V0U2VsZWN0b3IuY3VyU2VsZWN0VmFsKX0pXHJcblxyXG4gICAgICAgIGlmKGdsb2JhbENhY2hlLmN1cnJlbnRMYXlvdXROYW1lIT1udWxsKXtcclxuICAgICAgICAgICAgc3dpdGNoTGF5b3V0U2VsZWN0b3IudHJpZ2dlck9wdGlvblZhbHVlKGdsb2JhbENhY2hlLmN1cnJlbnRMYXlvdXROYW1lKVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBzd2l0Y2hMYXlvdXRTZWxlY3Rvci50cmlnZ2VyT3B0aW9uSW5kZXgoMClcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmVkaXRMYXlvdXREaWFsb2cucHJvdG90eXBlLnNhdmVJbnRvTGF5b3V0ID0gZnVuY3Rpb24gKGxheW91dE5hbWUpIHtcclxuICAgIGlmKGxheW91dE5hbWU9PVwiXCIgfHwgbGF5b3V0TmFtZT09bnVsbCl7XHJcbiAgICAgICAgYWxlcnQoXCJQbGVhc2UgY2hvb3NlIHRhcmdldCBsYXlvdXQgTmFtZVwiKVxyXG4gICAgICAgIHJldHVyblxyXG4gICAgfVxyXG4gICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwic2F2ZUxheW91dFwiLCBcImxheW91dE5hbWVcIjogbGF5b3V0TmFtZSwgXCJhZHROYW1lXCI6dGhpcy5nZXRDdXJBRFROYW1lKCkgfSlcclxuICAgIHRoaXMuRE9NLmhpZGUoKVxyXG59XHJcblxyXG5cclxuZWRpdExheW91dERpYWxvZy5wcm90b3R5cGUuZGVsZXRlTGF5b3V0ID0gZnVuY3Rpb24gKGxheW91dE5hbWUpIHtcclxuICAgIGlmKGxheW91dE5hbWU9PVwiXCIgfHwgbGF5b3V0TmFtZT09bnVsbCl7XHJcbiAgICAgICAgYWxlcnQoXCJQbGVhc2UgY2hvb3NlIHRhcmdldCBsYXlvdXQgTmFtZVwiKVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgY29uZmlybURpYWxvZ0Rpdj1uZXcgc2ltcGxlQ29uZmlybURpYWxvZygpXHJcblxyXG4gICAgY29uZmlybURpYWxvZ0Rpdi5zaG93KFxyXG4gICAgICAgIHsgd2lkdGg6IFwiMjUwcHhcIiB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGl0bGU6IFwiQ29uZmlybVwiXHJcbiAgICAgICAgICAgICwgY29udGVudDogXCJQbGVhc2UgY29uZmlybSBkZWxldGluZyBsYXlvdXQgXFxcIlwiICsgbGF5b3V0TmFtZSArIFwiXFxcIj9cIlxyXG4gICAgICAgICAgICAsIGJ1dHRvbnM6W1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtcmVkIHczLWhvdmVyLXBpbmtcIiwgdGV4dDogXCJDb25maXJtXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGdsb2JhbENhY2hlLmxheW91dEpTT05bbGF5b3V0TmFtZV1cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxheW91dE5hbWUgPT0gZ2xvYmFsQ2FjaGUuY3VycmVudExheW91dE5hbWUpIGdsb2JhbENhY2hlLmN1cnJlbnRMYXlvdXROYW1lID0gbnVsbFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJsYXlvdXRzVXBkYXRlZFwiIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQucG9zdChcImxheW91dC9zYXZlTGF5b3V0c1wiLCB7IFwiYWR0TmFtZVwiOiB0aGlzLmdldEN1ckFEVE5hbWUoKSwgXCJsYXlvdXRzXCI6IEpTT04uc3RyaW5naWZ5KGdsb2JhbENhY2hlLmxheW91dEpTT04pIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZWZpbGxPcHRpb25zKClcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci50cmlnZ2VyT3B0aW9uSW5kZXgoMClcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtZ3JheVwiLHRleHQ6IFwiQ2FuY2VsXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpXHJcbiAgICAgICAgICAgICAgICB9fVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfVxyXG4gICAgKVxyXG5cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgZWRpdExheW91dERpYWxvZygpOyIsImNvbnN0IG1vZGVsQW5hbHl6ZXIgPSByZXF1aXJlKFwiLi9tb2RlbEFuYWx5emVyXCIpO1xyXG5jb25zdCBnbG9iYWxDYWNoZSA9IHJlcXVpcmUoXCIuL2dsb2JhbENhY2hlXCIpXHJcblxyXG5mdW5jdGlvbiBmbG9hdEluZm9XaW5kb3coKSB7XHJcbiAgICBpZighdGhpcy5ET00pe1xyXG4gICAgICAgIHRoaXMuRE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1jYXJkXCIgc3R5bGU9XCJwYWRkaW5nOjEwcHg7IHBvc2l0aW9uOmFic29sdXRlO3otaW5kZXg6MTAxO21pbi1oZWlnaHQ6MTIwcHhcIj48L2Rpdj4nKVxyXG4gICAgICAgIHRoaXMuaGlkZVNlbGYoKVxyXG4gICAgICAgIHRoaXMuRE9NLmNzcyhcImJhY2tncm91bmQtY29sb3JcIixcInJnYmEoMjU1LCAyNTUsIDI1NSwgMC45KVwiKVxyXG4gICAgICAgICQoJ2JvZHknKS5hcHBlbmQodGhpcy5ET00pXHJcbiAgICB9XHJcbn1cclxuXHJcbmZsb2F0SW5mb1dpbmRvdy5wcm90b3R5cGUuaGlkZVNlbGY9ZnVuY3Rpb24obXNnUGF5bG9hZCl7XHJcbiAgICB0aGlzLkRPTS5oaWRlKClcclxuICAgIHRoaXMuRE9NLmNzcyhcIndpZHRoXCIsXCIwcHhcIikgXHJcbn1cclxuZmxvYXRJbmZvV2luZG93LnByb3RvdHlwZS5zaG93U2VsZj1mdW5jdGlvbihtc2dQYXlsb2FkKXtcclxuICAgIHRoaXMuRE9NLmNzcyhcIndpZHRoXCIsXCIyOTVweFwiKVxyXG4gICAgdGhpcy5ET00uc2hvdygpXHJcbn1cclxuXHJcbmZsb2F0SW5mb1dpbmRvdy5wcm90b3R5cGUucnhNZXNzYWdlPWZ1bmN0aW9uKG1zZ1BheWxvYWQpeyAgIFxyXG4gICAgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInRvcG9sb2d5TW91c2VPdXRcIil7XHJcbiAgICAgICAgdGhpcy5oaWRlU2VsZigpXHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwic2hvd0luZm9Ib3ZlcmVkRWxlXCIpe1xyXG4gICAgICAgIGlmKCFnbG9iYWxDYWNoZS5zaG93RmxvYXRJbmZvUGFuZWwpIHJldHVybjtcclxuICAgICAgICB0aGlzLkRPTS5lbXB0eSgpXHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGFycj1tc2dQYXlsb2FkLmluZm87XHJcbiAgICAgICAgaWYoYXJyPT1udWxsIHx8IGFyci5sZW5ndGg9PTApICByZXR1cm47XHJcbiAgICAgICAgdGhpcy5ET00uY3NzKFwibGVmdFwiLFwiLTIwMDBweFwiKSAvL2l0IGlzIGFsd2F5cyBvdXRzaWRlIG9mIGJyb3dzZXIgc28gaXQgd29udCBibG9jayBtb3VzZSBhbmQgY2F1c2UgbW91c2Ugb3V0XHJcbiAgICAgICAgdGhpcy5zaG93U2VsZigpXHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGRvY3VtZW50Qm9keVdpZHRoPSQoJ2JvZHknKS53aWR0aCgpXHJcblxyXG4gICAgICAgIHZhciBzaW5nbGVFbGVtZW50SW5mbz1hcnJbMF07XHJcbiAgICAgICAgaWYoc2luZ2xlRWxlbWVudEluZm9bXCIkZHRJZFwiXSl7Ly8gc2VsZWN0IGEgbm9kZVxyXG4gICAgICAgICAgICB0aGlzLmRyYXdTdGF0aWNJbmZvKHRoaXMuRE9NLHtcIiRkdElkXCI6c2luZ2xlRWxlbWVudEluZm9bXCIkZHRJZFwiXX0sXCIxZW1cIixcIjEzcHhcIilcclxuICAgICAgICAgICAgdmFyIG1vZGVsTmFtZT1zaW5nbGVFbGVtZW50SW5mb1snJG1ldGFkYXRhJ11bJyRtb2RlbCddXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZihtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxOYW1lXSl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyYXdFZGl0YWJsZSh0aGlzLkRPTSxtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxOYW1lXS5lZGl0YWJsZVByb3BlcnRpZXMsc2luZ2xlRWxlbWVudEluZm8sW10pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5kcmF3U3RhdGljSW5mbyh0aGlzLkRPTSx7XCIkZXRhZ1wiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJGV0YWdcIl0sXCIkbWV0YWRhdGFcIjpzaW5nbGVFbGVtZW50SW5mb1tcIiRtZXRhZGF0YVwiXX0sXCIxZW1cIixcIjEwcHhcIilcclxuICAgICAgICB9ZWxzZSBpZihzaW5nbGVFbGVtZW50SW5mb1tcIiRzb3VyY2VJZFwiXSl7XHJcbiAgICAgICAgICAgIHRoaXMuZHJhd1N0YXRpY0luZm8odGhpcy5ET00se1xyXG4gICAgICAgICAgICAgICAgXCIkc291cmNlSWRcIjpzaW5nbGVFbGVtZW50SW5mb1tcIiRzb3VyY2VJZFwiXSxcclxuICAgICAgICAgICAgICAgIFwiJHRhcmdldElkXCI6c2luZ2xlRWxlbWVudEluZm9bXCIkdGFyZ2V0SWRcIl0sXHJcbiAgICAgICAgICAgICAgICBcIiRyZWxhdGlvbnNoaXBOYW1lXCI6c2luZ2xlRWxlbWVudEluZm9bXCIkcmVsYXRpb25zaGlwTmFtZVwiXVxyXG4gICAgICAgICAgICB9LFwiMWVtXCIsXCIxM3B4XCIpXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd1N0YXRpY0luZm8odGhpcy5ET00se1xyXG4gICAgICAgICAgICAgICAgXCIkcmVsYXRpb25zaGlwSWRcIjpzaW5nbGVFbGVtZW50SW5mb1tcIiRyZWxhdGlvbnNoaXBJZFwiXVxyXG4gICAgICAgICAgICB9LFwiMWVtXCIsXCIxMHB4XCIpXHJcbiAgICAgICAgICAgIHZhciByZWxhdGlvbnNoaXBOYW1lPXNpbmdsZUVsZW1lbnRJbmZvW1wiJHJlbGF0aW9uc2hpcE5hbWVcIl1cclxuICAgICAgICAgICAgdmFyIHNvdXJjZU1vZGVsPXNpbmdsZUVsZW1lbnRJbmZvW1wic291cmNlTW9kZWxcIl1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd0VkaXRhYmxlKHRoaXMuRE9NLHRoaXMuZ2V0UmVsYXRpb25TaGlwRWRpdGFibGVQcm9wZXJ0aWVzKHJlbGF0aW9uc2hpcE5hbWUsc291cmNlTW9kZWwpLHNpbmdsZUVsZW1lbnRJbmZvLFtdKVxyXG4gICAgICAgICAgICB0aGlzLmRyYXdTdGF0aWNJbmZvKHRoaXMuRE9NLHtcIiRldGFnXCI6c2luZ2xlRWxlbWVudEluZm9bXCIkZXRhZ1wiXX0sXCIxZW1cIixcIjEwcHhcIixcIkRhcmtHcmF5XCIpXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgc2NyZWVuWFk9IG1zZ1BheWxvYWQuc2NyZWVuWFlcclxuICAgICAgICB2YXIgd2luZG93TGVmdD1zY3JlZW5YWS54KzUwXHJcblxyXG4gICAgICAgIGlmKHdpbmRvd0xlZnQrdGhpcy5ET00ub3V0ZXJXaWR0aCgpKzEwPmRvY3VtZW50Qm9keVdpZHRoKSB7XHJcbiAgICAgICAgICAgIHdpbmRvd0xlZnQ9ZG9jdW1lbnRCb2R5V2lkdGgtdGhpcy5ET00ub3V0ZXJXaWR0aCgpLTEwXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHZhciB3aW5kb3dUb3AgPSBzY3JlZW5YWS55LXRoaXMuRE9NLm91dGVySGVpZ2h0KCktNTBcclxuICAgICAgICBpZih3aW5kb3dUb3A8NSkgd2luZG93VG9wPTVcclxuICAgICAgICB0aGlzLkRPTS5jc3Moe1wibGVmdFwiOndpbmRvd0xlZnQrXCJweFwiLCBcInRvcFwiOndpbmRvd1RvcCtcInB4XCJ9KVxyXG4gICAgfVxyXG59XHJcblxyXG5mbG9hdEluZm9XaW5kb3cucHJvdG90eXBlLmdldFJlbGF0aW9uU2hpcEVkaXRhYmxlUHJvcGVydGllcz1mdW5jdGlvbihyZWxhdGlvbnNoaXBOYW1lLHNvdXJjZU1vZGVsKXtcclxuICAgIGlmKCFtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbc291cmNlTW9kZWxdIHx8ICFtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbc291cmNlTW9kZWxdLnZhbGlkUmVsYXRpb25zaGlwc1tyZWxhdGlvbnNoaXBOYW1lXSkgcmV0dXJuXHJcbiAgICByZXR1cm4gbW9kZWxBbmFseXplci5EVERMTW9kZWxzW3NvdXJjZU1vZGVsXS52YWxpZFJlbGF0aW9uc2hpcHNbcmVsYXRpb25zaGlwTmFtZV0uZWRpdGFibGVSZWxhdGlvbnNoaXBQcm9wZXJ0aWVzXHJcbn1cclxuXHJcbmZsb2F0SW5mb1dpbmRvdy5wcm90b3R5cGUuZHJhd1N0YXRpY0luZm89ZnVuY3Rpb24ocGFyZW50LGpzb25JbmZvLHBhZGRpbmdUb3AsZm9udFNpemUpe1xyXG4gICAgZm9yKHZhciBpbmQgaW4ganNvbkluZm8pe1xyXG4gICAgICAgIHZhciBrZXlEaXY9ICQoXCI8bGFiZWwgc3R5bGU9J2Rpc3BsYXk6YmxvY2snPjxkaXYgY2xhc3M9J3czLWRhcmstZ3JheScgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO3BhZGRpbmc6LjFlbSAuM2VtIC4xZW0gLjNlbTttYXJnaW4tcmlnaHQ6LjNlbTtmb250LXNpemU6MTBweCc+XCIraW5kK1wiPC9kaXY+PC9sYWJlbD5cIilcclxuICAgICAgICBwYXJlbnQuYXBwZW5kKGtleURpdilcclxuICAgICAgICBrZXlEaXYuY3NzKFwicGFkZGluZy10b3BcIixwYWRkaW5nVG9wKVxyXG5cclxuICAgICAgICB2YXIgY29udGVudERPTT0kKFwiPGxhYmVsPjwvbGFiZWw+XCIpXHJcbiAgICAgICAgaWYodHlwZW9mKGpzb25JbmZvW2luZF0pPT09XCJvYmplY3RcIikge1xyXG4gICAgICAgICAgICBjb250ZW50RE9NLmNzcyhcImRpc3BsYXlcIixcImJsb2NrXCIpXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwicGFkZGluZy1sZWZ0XCIsXCIxZW1cIilcclxuICAgICAgICAgICAgdGhpcy5kcmF3U3RhdGljSW5mbyhjb250ZW50RE9NLGpzb25JbmZvW2luZF0sXCIuNWVtXCIsZm9udFNpemUpXHJcbiAgICAgICAgfWVsc2Uge1xyXG4gICAgICAgICAgICBjb250ZW50RE9NLmNzcyhcInBhZGRpbmctdG9wXCIsXCIuMmVtXCIpXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00udGV4dChqc29uSW5mb1tpbmRdKVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb250ZW50RE9NLmNzcyh7XCJmb250U2l6ZVwiOmZvbnRTaXplLFwiY29sb3JcIjpcImJsYWNrXCJ9KVxyXG4gICAgICAgIGtleURpdi5hcHBlbmQoY29udGVudERPTSlcclxuICAgIH1cclxufVxyXG5cclxuZmxvYXRJbmZvV2luZG93LnByb3RvdHlwZS5kcmF3RWRpdGFibGU9ZnVuY3Rpb24ocGFyZW50LGpzb25JbmZvLG9yaWdpbkVsZW1lbnRJbmZvLHBhdGhBcnIpe1xyXG4gICAgaWYoanNvbkluZm89PW51bGwpIHJldHVybjtcclxuICAgIGZvcih2YXIgaW5kIGluIGpzb25JbmZvKXtcclxuICAgICAgICB2YXIga2V5RGl2PSAkKFwiPGxhYmVsIHN0eWxlPSdkaXNwbGF5OmJsb2NrJz48ZGl2IHN0eWxlPSdkaXNwbGF5OmlubGluZTtwYWRkaW5nOi4xZW0gLjNlbSAuMWVtIC4zZW07IG1hcmdpbi1yaWdodDo1cHgnPlwiK2luZCtcIjwvZGl2PjwvbGFiZWw+XCIpXHJcbiAgICAgICAgcGFyZW50LmFwcGVuZChrZXlEaXYpXHJcbiAgICAgICAgXHJcbiAgICAgICAga2V5RGl2LmNzcyhcInBhZGRpbmctdG9wXCIsXCIuM2VtXCIpIFxyXG5cclxuICAgICAgICB2YXIgY29udGVudERPTT0kKFwiPGxhYmVsIHN0eWxlPSdwYWRkaW5nLXRvcDouMmVtJz48L2xhYmVsPlwiKVxyXG4gICAgICAgIHZhciBuZXdQYXRoPXBhdGhBcnIuY29uY2F0KFtpbmRdKVxyXG4gICAgICAgIGlmKHR5cGVvZihqc29uSW5mb1tpbmRdKT09PVwib2JqZWN0XCIgJiYgIUFycmF5LmlzQXJyYXkoanNvbkluZm9baW5kXSkpIHtcclxuICAgICAgICAgICAga2V5RGl2LmNoaWxkcmVuKFwiOmZpcnN0XCIpLmNzcyhcImZvbnQtd2VpZ2h0XCIsXCJib2xkXCIpXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwiZGlzcGxheVwiLFwiYmxvY2tcIilcclxuICAgICAgICAgICAgY29udGVudERPTS5jc3MoXCJwYWRkaW5nLWxlZnRcIixcIjFlbVwiKVxyXG4gICAgICAgICAgICB0aGlzLmRyYXdFZGl0YWJsZShjb250ZW50RE9NLGpzb25JbmZvW2luZF0sb3JpZ2luRWxlbWVudEluZm8sbmV3UGF0aClcclxuICAgICAgICB9ZWxzZSB7XHJcbiAgICAgICAgICAgIGtleURpdi5jaGlsZHJlbihcIjpmaXJzdFwiKS5hZGRDbGFzcyhcInczLWxpbWVcIilcclxuICAgICAgICAgICAgdmFyIHZhbD10aGlzLnNlYXJjaFZhbHVlKG9yaWdpbkVsZW1lbnRJbmZvLG5ld1BhdGgpXHJcbiAgICAgICAgICAgIGlmKHZhbD09bnVsbCl7XHJcbiAgICAgICAgICAgICAgICBjb250ZW50RE9NLmNzcyh7XCJjb2xvclwiOlwiZ3JheVwiLFwiZm9udC1zaXplXCI6XCI5cHhcIn0pXHJcbiAgICAgICAgICAgICAgICBjb250ZW50RE9NLnRleHQoXCJbZW1wdHldXCIpXHJcbiAgICAgICAgICAgIH1lbHNlIGNvbnRlbnRET00udGV4dCh2YWwpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGtleURpdi5hcHBlbmQoY29udGVudERPTSlcclxuICAgIH1cclxufVxyXG5cclxuZmxvYXRJbmZvV2luZG93LnByb3RvdHlwZS5zZWFyY2hWYWx1ZT1mdW5jdGlvbihvcmlnaW5FbGVtZW50SW5mbyxwYXRoQXJyKXtcclxuICAgIGlmKHBhdGhBcnIubGVuZ3RoPT0wKSByZXR1cm4gbnVsbDtcclxuICAgIHZhciB0aGVKc29uPW9yaWdpbkVsZW1lbnRJbmZvXHJcbiAgICBmb3IodmFyIGk9MDtpPHBhdGhBcnIubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIGtleT1wYXRoQXJyW2ldXHJcbiAgICAgICAgdGhlSnNvbj10aGVKc29uW2tleV1cclxuICAgICAgICBpZih0aGVKc29uPT1udWxsKSByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGVKc29uIC8vaXQgc2hvdWxkIGJlIHRoZSBmaW5hbCB2YWx1ZVxyXG59XHJcblxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IGZsb2F0SW5mb1dpbmRvdygpOyIsImZ1bmN0aW9uIGdsb2JhbENhY2hlKCl7XHJcbiAgICB0aGlzLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwcyA9IHt9XHJcbiAgICB0aGlzLnN0b3JlZFR3aW5zID0ge31cclxuXHJcbiAgICB0aGlzLmN1cnJlbnRMYXlvdXROYW1lPW51bGxcclxuICAgIHRoaXMubGF5b3V0SlNPTj17fVxyXG5cclxuICAgIHRoaXMuc2VsZWN0ZWRBRFQ9bnVsbDtcclxuXHJcbiAgICB0aGlzLnZpc3VhbERlZmluaXRpb249e31cclxuXHJcbiAgICB0aGlzLnNob3dGbG9hdEluZm9QYW5lbD10cnVlXHJcbn1cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzPWZ1bmN0aW9uKHJlbGF0aW9uc0RhdGEpe1xyXG4gICAgcmVsYXRpb25zRGF0YS5mb3JFYWNoKChvbmVSZWxhdGlvbnNoaXApPT57XHJcbiAgICAgICAgdmFyIHR3aW5JRD1vbmVSZWxhdGlvbnNoaXBbJyRzb3VyY2VJZCddXHJcbiAgICAgICAgdGhpcy5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbdHdpbklEXT1bXVxyXG4gICAgfSlcclxuXHJcbiAgICByZWxhdGlvbnNEYXRhLmZvckVhY2goKG9uZVJlbGF0aW9uc2hpcCk9PntcclxuICAgICAgICB0aGlzLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tvbmVSZWxhdGlvbnNoaXBbJyRzb3VyY2VJZCddXS5wdXNoKG9uZVJlbGF0aW9uc2hpcClcclxuICAgIH0pXHJcbn1cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzX2FwcGVuZD1mdW5jdGlvbihyZWxhdGlvbnNEYXRhKXtcclxuICAgIHJlbGF0aW9uc0RhdGEuZm9yRWFjaCgob25lUmVsYXRpb25zaGlwKT0+e1xyXG4gICAgICAgIGlmKCF0aGlzLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tvbmVSZWxhdGlvbnNoaXBbJyRzb3VyY2VJZCddXSlcclxuICAgICAgICAgICAgdGhpcy5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbb25lUmVsYXRpb25zaGlwWyckc291cmNlSWQnXV09W11cclxuICAgICAgICB0aGlzLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tvbmVSZWxhdGlvbnNoaXBbJyRzb3VyY2VJZCddXS5wdXNoKG9uZVJlbGF0aW9uc2hpcClcclxuICAgIH0pXHJcbn1cclxuXHJcbmdsb2JhbENhY2hlLnByb3RvdHlwZS5zdG9yZVR3aW5SZWxhdGlvbnNoaXBzX3JlbW92ZT1mdW5jdGlvbihyZWxhdGlvbnNEYXRhKXtcclxuICAgIHJlbGF0aW9uc0RhdGEuZm9yRWFjaCgob25lUmVsYXRpb25zaGlwKT0+e1xyXG4gICAgICAgIHZhciBzcmNJRD1vbmVSZWxhdGlvbnNoaXBbXCJzcmNJRFwiXVxyXG4gICAgICAgIGlmKHRoaXMuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW3NyY0lEXSl7XHJcbiAgICAgICAgICAgIHZhciBhcnI9dGhpcy5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbc3JjSURdXHJcbiAgICAgICAgICAgIGZvcih2YXIgaT0wO2k8YXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICAgICAgaWYoYXJyW2ldWyckcmVsYXRpb25zaGlwSWQnXT09b25lUmVsYXRpb25zaGlwW1wicmVsSURcIl0pe1xyXG4gICAgICAgICAgICAgICAgICAgIGFyci5zcGxpY2UoaSwxKVxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufVxyXG5cclxuZ2xvYmFsQ2FjaGUucHJvdG90eXBlLm1ha2VET01EcmFnZ2FibGU9ZnVuY3Rpb24oZG9tLGlnbm9yZUNoaWxkRG9tVHlwZSl7XHJcbiAgICBpZ25vcmVDaGlsZERvbVR5cGU9aWdub3JlQ2hpbGREb21UeXBlfHxbXCJMQUJFTFwiLFwiVERcIixcIkJcIixcIkFcIixcIklOUFVUXCIsXCJQUkVcIl1cclxuICAgIGRvbS5vbignbW91c2Vkb3duJywoZSk9PntcclxuICAgICAgICBpZihpZ25vcmVDaGlsZERvbVR5cGUuaW5kZXhPZihlLnRhcmdldC50YWdOYW1lKSE9LTEpIHJldHVybjtcclxuICAgICAgICB2YXIgZG9tT2Zmc2V0PWRvbS5vZmZzZXQoKVxyXG4gICAgICAgIGRvbS5tb3VzZVN0YXJ0RHJhZ09mZnNldD1bZG9tT2Zmc2V0LmxlZnQtZS5jbGllbnRYLCBkb21PZmZzZXQudG9wLWUuY2xpZW50WV1cclxuICAgICAgICAkKCdib2R5Jykub24oJ21vdXNldXAnLCgpPT57XHJcbiAgICAgICAgICAgIGRvbS5tb3VzZVN0YXJ0RHJhZ09mZnNldD1udWxsXHJcbiAgICAgICAgICAgICQoJ2JvZHknKS5vZmYoJ21vdXNlbW92ZScpXHJcbiAgICAgICAgICAgICQoJ2JvZHknKS5vZmYoJ21vdXNldXAnKVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgJCgnYm9keScpLm9uKCdtb3VzZW1vdmUnLChlKT0+e1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KClcclxuICAgICAgICAgICAgaWYoZG9tLm1vdXNlU3RhcnREcmFnT2Zmc2V0KXtcclxuICAgICAgICAgICAgICAgIHZhciBuZXdMZWZ0PSBlLmNsaWVudFgrZG9tLm1vdXNlU3RhcnREcmFnT2Zmc2V0WzBdXHJcbiAgICAgICAgICAgICAgICB2YXIgbmV3VG9wPWUuY2xpZW50WStkb20ubW91c2VTdGFydERyYWdPZmZzZXRbMV1cclxuICAgICAgICAgICAgICAgIGRvbS5jc3Moe1wibGVmdFwiOm5ld0xlZnQrXCJweFwiLFwidG9wXCI6bmV3VG9wK1wicHhcIixcInRyYW5zZm9ybVwiOlwibm9uZVwifSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICB9KVxyXG59XHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IGdsb2JhbENhY2hlKCk7IiwiY29uc3QgbW9kZWxBbmFseXplciA9IHJlcXVpcmUoXCIuL21vZGVsQW5hbHl6ZXJcIik7XHJcbmNvbnN0IHNpbXBsZVNlbGVjdE1lbnU9IHJlcXVpcmUoXCIuL3NpbXBsZVNlbGVjdE1lbnVcIilcclxuY29uc3Qgc2ltcGxlQ29uZmlybURpYWxvZyA9IHJlcXVpcmUoXCIuL3NpbXBsZUNvbmZpcm1EaWFsb2dcIilcclxuY29uc3QgZ2xvYmFsQ2FjaGUgPSByZXF1aXJlKFwiLi9nbG9iYWxDYWNoZVwiKVxyXG5cclxuZnVuY3Rpb24gaW5mb1BhbmVsKCkge1xyXG4gICAgdGhpcy5jb250aW5lckRPTT0kKCc8ZGl2IGNsYXNzPVwidzMtY2FyZFwiIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7ei1pbmRleDo5MDtyaWdodDowcHg7dG9wOjUwJTtoZWlnaHQ6NzAlO3dpZHRoOjMwMHB4O3RyYW5zZm9ybTogdHJhbnNsYXRlWSgtNTAlKTtcIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5jb250aW5lckRPTS5oaWRlKClcclxuICAgIHRoaXMuY29udGluZXJET00uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6NTBweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjwvZGl2PicpKVxyXG5cclxuICAgIHRoaXMuY2xvc2VCdXR0b24xPSQoJzxidXR0b24gc3R5bGU9XCJoZWlnaHQ6MTAwJVwiIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uXCI+PGkgY2xhc3M9XCJmYSBmYS1pbmZvLWNpcmNsZSBmYS0yeFwiIHN0eWxlPVwicGFkZGluZzoycHhcIj48L2k+PC9idXR0b24+JylcclxuICAgIHRoaXMuY2xvc2VCdXR0b24yPSQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtcmlnaHRcIiBzdHlsZT1cImZvbnQtc2l6ZToyZW1cIj7DlzwvYnV0dG9uPicpXHJcbiAgICB0aGlzLmNvbnRpbmVyRE9NLmNoaWxkcmVuKCc6Zmlyc3QnKS5hcHBlbmQodGhpcy5jbG9zZUJ1dHRvbjEsdGhpcy5jbG9zZUJ1dHRvbjIpIFxyXG5cclxuICAgIHRoaXMuaXNNaW5pbWl6ZWQ9ZmFsc2U7XHJcbiAgICB2YXIgYnV0dG9uQW5pbT0oKT0+e1xyXG4gICAgICAgIGlmKCF0aGlzLmlzTWluaW1pemVkKXtcclxuICAgICAgICAgICAgdGhpcy5jb250aW5lckRPTS5hbmltYXRlKHtcclxuICAgICAgICAgICAgICAgIHJpZ2h0OiBcIi0yNTBweFwiLFxyXG4gICAgICAgICAgICAgICAgaGVpZ2h0OlwiNTBweFwiXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIHRoaXMuaXNNaW5pbWl6ZWQ9dHJ1ZTtcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgdGhpcy5jb250aW5lckRPTS5hbmltYXRlKHtcclxuICAgICAgICAgICAgICAgIHJpZ2h0OiBcIjBweFwiLFxyXG4gICAgICAgICAgICAgICAgaGVpZ2h0OiBcIjcwJVwiXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIHRoaXMuaXNNaW5pbWl6ZWQ9ZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdGhpcy5jbG9zZUJ1dHRvbjEub24oXCJjbGlja1wiLGJ1dHRvbkFuaW0pXHJcbiAgICB0aGlzLmNsb3NlQnV0dG9uMi5vbihcImNsaWNrXCIsYnV0dG9uQW5pbSlcclxuXHJcbiAgICB0aGlzLkRPTT0kKCc8ZGl2IGNsYXNzPVwidzMtY29udGFpbmVyXCIgc3R5bGU9XCJwb3N0aW9uOmFic29sdXRlO3RvcDo1MHB4O2hlaWdodDpjYWxjKDEwMCUgLSA1MHB4KTtvdmVyZmxvdzphdXRvXCI+PC9kaXY+JylcclxuICAgIHRoaXMuY29udGluZXJET00uY3NzKFwiYmFja2dyb3VuZC1jb2xvclwiLFwicmdiYSgyNTUsIDI1NSwgMjU1LCAwLjgpXCIpXHJcbiAgICB0aGlzLmNvbnRpbmVyRE9NLmhvdmVyKCgpID0+IHtcclxuICAgICAgICB0aGlzLmNvbnRpbmVyRE9NLmNzcyhcImJhY2tncm91bmQtY29sb3JcIiwgXCJyZ2JhKDI1NSwgMjU1LCAyNTUsIDEpXCIpXHJcbiAgICB9LCAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5jb250aW5lckRPTS5jc3MoXCJiYWNrZ3JvdW5kLWNvbG9yXCIsIFwicmdiYSgyNTUsIDI1NSwgMjU1LCAwLjgpXCIpXHJcbiAgICB9KTtcclxuICAgIHRoaXMuY29udGluZXJET00uYXBwZW5kKHRoaXMuRE9NKVxyXG4gICAgJCgnYm9keScpLmFwcGVuZCh0aGlzLmNvbnRpbmVyRE9NKVxyXG4gICAgXHJcblxyXG4gICAgdGhpcy5kcmF3QnV0dG9ucyhudWxsKVxyXG5cclxuICAgIHRoaXMuc2VsZWN0ZWRPYmplY3RzPW51bGw7XHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUucnhNZXNzYWdlPWZ1bmN0aW9uKG1zZ1BheWxvYWQpeyAgIFxyXG4gICAgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cIkFEVERhdGFzb3VyY2VEaWFsb2dfY2xvc2VkXCIpe1xyXG4gICAgICAgIGlmKCF0aGlzLmNvbnRpbmVyRE9NLmlzKFwiOnZpc2libGVcIikpIHtcclxuICAgICAgICAgICAgdGhpcy5jb250aW5lckRPTS5zaG93KClcclxuICAgICAgICAgICAgdGhpcy5jb250aW5lckRPTS5hZGRDbGFzcyhcInczLWFuaW1hdGUtcmlnaHRcIilcclxuICAgICAgICB9XHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwic2hvd0luZm9TZWxlY3RlZE5vZGVzXCIgfHwgbXNnUGF5bG9hZC5tZXNzYWdlPT1cInNob3dJbmZvSG92ZXJlZEVsZVwiKXtcclxuICAgICAgICBpZiAoZ2xvYmFsQ2FjaGUuc2hvd0Zsb2F0SW5mb1BhbmVsICYmIG1zZ1BheWxvYWQubWVzc2FnZT09XCJzaG93SW5mb0hvdmVyZWRFbGVcIikgcmV0dXJuOyAvL3RoZSBmbG9hdGluZyBpbmZvIHdpbmRvdyB3aWxsIHNob3cgbW91c2Ugb3ZlciBlbGVtZW50IGluZm9ybWF0aW9uLCBkbyBub3QgY2hhbmdlIGluZm8gcGFuZWwgY29udGVudCBpbiB0aGlzIGNhc2VcclxuICAgICAgICB0aGlzLkRPTS5lbXB0eSgpXHJcbiAgICAgICAgdmFyIGFycj1tc2dQYXlsb2FkLmluZm87XHJcblxyXG4gICAgICAgIGlmKGFycj09bnVsbCB8fCBhcnIubGVuZ3RoPT0wKXtcclxuICAgICAgICAgICAgdGhpcy5kcmF3QnV0dG9ucyhudWxsKVxyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdGVkT2JqZWN0cz1bXTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5zZWxlY3RlZE9iamVjdHM9YXJyO1xyXG4gICAgICAgIGlmKGFyci5sZW5ndGg9PTEpe1xyXG4gICAgICAgICAgICB2YXIgc2luZ2xlRWxlbWVudEluZm89YXJyWzBdO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYoc2luZ2xlRWxlbWVudEluZm9bXCIkZHRJZFwiXSl7Ly8gc2VsZWN0IGEgbm9kZVxyXG4gICAgICAgICAgICAgICAgc2luZ2xlRWxlbWVudEluZm89Z2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbc2luZ2xlRWxlbWVudEluZm9bXCIkZHRJZFwiXV1cclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhd0J1dHRvbnMoXCJzaW5nbGVOb2RlXCIpXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyYXdTdGF0aWNJbmZvKHRoaXMuRE9NLHtcIiRkdElkXCI6c2luZ2xlRWxlbWVudEluZm9bXCIkZHRJZFwiXX0sXCIxZW1cIixcIjEzcHhcIilcclxuICAgICAgICAgICAgICAgIHZhciBtb2RlbE5hbWU9c2luZ2xlRWxlbWVudEluZm9bJyRtZXRhZGF0YSddWyckbW9kZWwnXVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBpZihtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxOYW1lXSl7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kcmF3RWRpdGFibGUodGhpcy5ET00sbW9kZWxBbmFseXplci5EVERMTW9kZWxzW21vZGVsTmFtZV0uZWRpdGFibGVQcm9wZXJ0aWVzLHNpbmdsZUVsZW1lbnRJbmZvLFtdKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3U3RhdGljSW5mbyh0aGlzLkRPTSx7XCIkZXRhZ1wiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJGV0YWdcIl0sXCIkbWV0YWRhdGFcIjpzaW5nbGVFbGVtZW50SW5mb1tcIiRtZXRhZGF0YVwiXX0sXCIxZW1cIixcIjEwcHhcIilcclxuICAgICAgICAgICAgfWVsc2UgaWYoc2luZ2xlRWxlbWVudEluZm9bXCIkc291cmNlSWRcIl0pe1xyXG4gICAgICAgICAgICAgICAgdmFyIGFycj1nbG9iYWxDYWNoZS5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbc2luZ2xlRWxlbWVudEluZm9bXCIkc291cmNlSWRcIl1dXHJcbiAgICAgICAgICAgICAgICBmb3IodmFyIGk9MDtpPGFyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgICAgICAgICBpZihhcnJbaV1bJyRyZWxhdGlvbnNoaXBJZCddPT1zaW5nbGVFbGVtZW50SW5mb1tcIiRyZWxhdGlvbnNoaXBJZFwiXSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNpbmdsZUVsZW1lbnRJbmZvPWFycltpXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyYXdCdXR0b25zKFwic2luZ2xlUmVsYXRpb25zaGlwXCIpXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyYXdTdGF0aWNJbmZvKHRoaXMuRE9NLHtcclxuICAgICAgICAgICAgICAgICAgICBcIiRzb3VyY2VJZFwiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJHNvdXJjZUlkXCJdLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiJHRhcmdldElkXCI6c2luZ2xlRWxlbWVudEluZm9bXCIkdGFyZ2V0SWRcIl0sXHJcbiAgICAgICAgICAgICAgICAgICAgXCIkcmVsYXRpb25zaGlwTmFtZVwiOnNpbmdsZUVsZW1lbnRJbmZvW1wiJHJlbGF0aW9uc2hpcE5hbWVcIl1cclxuICAgICAgICAgICAgICAgIH0sXCIxZW1cIixcIjEzcHhcIilcclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhd1N0YXRpY0luZm8odGhpcy5ET00se1xyXG4gICAgICAgICAgICAgICAgICAgIFwiJHJlbGF0aW9uc2hpcElkXCI6c2luZ2xlRWxlbWVudEluZm9bXCIkcmVsYXRpb25zaGlwSWRcIl1cclxuICAgICAgICAgICAgICAgIH0sXCIxZW1cIixcIjEwcHhcIilcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgdmFyIHJlbGF0aW9uc2hpcE5hbWU9c2luZ2xlRWxlbWVudEluZm9bXCIkcmVsYXRpb25zaGlwTmFtZVwiXVxyXG4gICAgICAgICAgICAgICAgdmFyIHNvdXJjZU1vZGVsPXNpbmdsZUVsZW1lbnRJbmZvW1wic291cmNlTW9kZWxcIl1cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3RWRpdGFibGUodGhpcy5ET00sdGhpcy5nZXRSZWxhdGlvblNoaXBFZGl0YWJsZVByb3BlcnRpZXMocmVsYXRpb25zaGlwTmFtZSxzb3VyY2VNb2RlbCksc2luZ2xlRWxlbWVudEluZm8sW10pXHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyYXdTdGF0aWNJbmZvKHRoaXMuRE9NLHtcIiRldGFnXCI6c2luZ2xlRWxlbWVudEluZm9bXCIkZXRhZ1wiXX0sXCIxZW1cIixcIjEwcHhcIixcIkRhcmtHcmF5XCIpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9ZWxzZSBpZihhcnIubGVuZ3RoPjEpe1xyXG4gICAgICAgICAgICB0aGlzLmRyYXdCdXR0b25zKFwibXVsdGlwbGVcIilcclxuICAgICAgICAgICAgdGhpcy5kcmF3TXVsdGlwbGVPYmooKVxyXG4gICAgICAgIH1cclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJzaG93SW5mb0dyb3VwTm9kZVwiKXtcclxuICAgICAgICB0aGlzLkRPTS5lbXB0eSgpXHJcbiAgICAgICAgdmFyIG1vZGVsSUQgPSBtc2dQYXlsb2FkLmluZm9bXCJAaWRcIl1cclxuICAgICAgICBnbG9iYWxDYWNoZS5zaG93aW5nQ3JlYXRlVHdpbk1vZGVsSUQ9bW9kZWxJRFxyXG4gICAgICAgIGlmKCFtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF0pIHJldHVybjtcclxuICAgICAgICB2YXIgdHdpbkpzb24gPSB7XHJcbiAgICAgICAgICAgIFwiJG1ldGFkYXRhXCI6IHtcclxuICAgICAgICAgICAgICAgIFwiJG1vZGVsXCI6IG1vZGVsSURcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB2YXIgYWRkQnRuID0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWdyZWVuIHczLWhvdmVyLWxpZ2h0LWdyZWVuIHczLW1hcmdpblwiPkFkZCBUd2luPC9idXR0b24+JylcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQoYWRkQnRuKVxyXG5cclxuICAgICAgICBhZGRCdG4ub24oXCJjbGlja1wiLChlKSA9PiB7XHJcbiAgICAgICAgICAgIGlmKCF0d2luSnNvbltcIiRkdElkXCJdfHx0d2luSnNvbltcIiRkdElkXCJdPT1cIlwiKXtcclxuICAgICAgICAgICAgICAgIGFsZXJ0KFwiUGxlYXNlIGZpbGwgaW4gbmFtZSBmb3IgdGhlIG5ldyBkaWdpdGFsIHR3aW5cIilcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIGNvbXBvbmVudHNOYW1lQXJyPW1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXS5pbmNsdWRlZENvbXBvbmVudHNcclxuICAgICAgICAgICAgY29tcG9uZW50c05hbWVBcnIuZm9yRWFjaChvbmVDb21wb25lbnROYW1lPT57IC8vYWR0IHNlcnZpY2UgcmVxdWVzdGluZyBhbGwgY29tcG9uZW50IGFwcGVhciBieSBtYW5kYXRvcnlcclxuICAgICAgICAgICAgICAgIGlmKHR3aW5Kc29uW29uZUNvbXBvbmVudE5hbWVdPT1udWxsKXR3aW5Kc29uW29uZUNvbXBvbmVudE5hbWVdPXt9XHJcbiAgICAgICAgICAgICAgICB0d2luSnNvbltvbmVDb21wb25lbnROYW1lXVtcIiRtZXRhZGF0YVwiXT0ge31cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgJC5wb3N0KFwiZWRpdEFEVC91cHNlcnREaWdpdGFsVHdpblwiLCB7XCJuZXdUd2luSnNvblwiOkpTT04uc3RyaW5naWZ5KHR3aW5Kc29uKX1cclxuICAgICAgICAgICAgICAgICwgKGRhdGEpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YSAhPSBcIlwiKSB7Ly9ub3Qgc3VjY2Vzc2Z1bCBlZGl0aW5nXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsZXJ0KGRhdGEpXHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy9zdWNjZXNzZnVsIGVkaXRpbmcsIHVwZGF0ZSB0aGUgbm9kZSBvcmlnaW5hbCBpbmZvXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBrZXlMYWJlbD10aGlzLkRPTS5maW5kKCcjTkVXVFdJTl9JRExhYmVsJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIElESW5wdXQ9a2V5TGFiZWwuZmluZChcImlucHV0XCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKElESW5wdXQpIElESW5wdXQudmFsKFwiXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICQucG9zdChcInF1ZXJ5QURUL29uZVR3aW5JbmZvXCIse3R3aW5JRDp0d2luSnNvbltcIiRkdElkXCJdfSwgKGRhdGEpPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoZGF0YT09XCJcIikgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbZGF0YVtcIiRkdElkXCJdXSA9IGRhdGE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJhZGROZXdUd2luXCIsdHdpbkluZm86ZGF0YX0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgdGhpcy5kcmF3U3RhdGljSW5mbyh0aGlzLkRPTSx7XHJcbiAgICAgICAgICAgIFwiTW9kZWxcIjptb2RlbElEXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgYWRkQnRuLmRhdGEoXCJ0d2luSnNvblwiLHR3aW5Kc29uKVxyXG4gICAgICAgIHZhciBjb3B5UHJvcGVydHk9SlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF0uZWRpdGFibGVQcm9wZXJ0aWVzKSlcclxuICAgICAgICBjb3B5UHJvcGVydHlbJyRkdElkJ109XCJzdHJpbmdcIlxyXG4gICAgICAgIHRoaXMuZHJhd0VkaXRhYmxlKHRoaXMuRE9NLGNvcHlQcm9wZXJ0eSx0d2luSnNvbixbXSxcIm5ld1R3aW5cIilcclxuICAgICAgICAvL2NvbnNvbGUubG9nKG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXSkgXHJcbiAgICB9XHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZ2V0UmVsYXRpb25TaGlwRWRpdGFibGVQcm9wZXJ0aWVzPWZ1bmN0aW9uKHJlbGF0aW9uc2hpcE5hbWUsc291cmNlTW9kZWwpe1xyXG4gICAgaWYoIW1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1tzb3VyY2VNb2RlbF0gfHwgIW1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1tzb3VyY2VNb2RlbF0udmFsaWRSZWxhdGlvbnNoaXBzW3JlbGF0aW9uc2hpcE5hbWVdKSByZXR1cm5cclxuICAgIHJldHVybiBtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbc291cmNlTW9kZWxdLnZhbGlkUmVsYXRpb25zaGlwc1tyZWxhdGlvbnNoaXBOYW1lXS5lZGl0YWJsZVJlbGF0aW9uc2hpcFByb3BlcnRpZXNcclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5kcmF3QnV0dG9ucz1mdW5jdGlvbihzZWxlY3RUeXBlKXtcclxuICAgIHZhciBpbXBCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ibHVlXCI+PGkgY2xhc3M9XCJmYXMgZmEtY2xvdWQtdXBsb2FkLWFsdFwiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgdmFyIGFjdHVhbEltcG9ydFR3aW5zQnRuID0kKCc8aW5wdXQgdHlwZT1cImZpbGVcIiBuYW1lPVwibW9kZWxGaWxlc1wiIG11bHRpcGxlPVwibXVsdGlwbGVcIiBzdHlsZT1cImRpc3BsYXk6bm9uZVwiPjwvaW5wdXQ+JylcclxuICAgIGlmKHNlbGVjdFR5cGUhPW51bGwpe1xyXG4gICAgICAgIHZhciByZWZyZXNoQnRuPSQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtYmxhY2tcIj48aSBjbGFzcz1cImZhcyBmYS1zeW5jLWFsdFwiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBleHBCdG49JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ncmVlblwiPjxpIGNsYXNzPVwiZmFzIGZhLWNsb3VkLWRvd25sb2FkLWFsdFwiPjwvaT48L2J1dHRvbj4nKSAgXHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKHJlZnJlc2hCdG4sZXhwQnRuLGltcEJ0bixhY3R1YWxJbXBvcnRUd2luc0J0bilcclxuICAgICAgICByZWZyZXNoQnRuLm9uKFwiY2xpY2tcIiwoKT0+e3RoaXMucmVmcmVzaEluZm9tYXRpb24oKX0pXHJcbiAgICAgICAgZXhwQnRuLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgICAgICAvL2ZpbmQgb3V0IHRoZSB0d2lucyBpbiBzZWxlY3Rpb24gYW5kIHRoZWlyIGNvbm5lY3Rpb25zIChmaWx0ZXIgYm90aCBzcmMgYW5kIHRhcmdldCB3aXRoaW4gdGhlIHNlbGVjdGVkIHR3aW5zKVxyXG4gICAgICAgICAgICAvL2FuZCBleHBvcnQgdGhlbVxyXG4gICAgICAgICAgICB0aGlzLmV4cG9ydFNlbGVjdGVkKClcclxuICAgICAgICB9KSAgICBcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5ET00uaHRtbChcIjxhIHN0eWxlPSdkaXNwbGF5OmJsb2NrO2ZvbnQtc3R5bGU6aXRhbGljO2NvbG9yOmdyYXknPkNob29zZSB0d2lucyBvciByZWxhdGlvbnNoaXBzIHRvIHZpZXcgaW5mb21yYXRpb248L2E+PGEgc3R5bGU9J2Rpc3BsYXk6YmxvY2s7Zm9udC1zdHlsZTppdGFsaWM7Y29sb3I6Z3JheTtwYWRkaW5nLXRvcDoyMHB4Jz5QcmVzcyBzaGlmdCBrZXkgdG8gZHJhdyBib3ggYW5kIHNlbGVjdCBtdWx0aXBsZSB0d2lucyBpbiB0b3BvbG9neSB2aWV3PC9hPjxhIHN0eWxlPSdkaXNwbGF5OmJsb2NrO2ZvbnQtc3R5bGU6aXRhbGljO2NvbG9yOmdyYXk7cGFkZGluZy10b3A6MjBweCc+UHJlc3MgY3RybCt6IGFuZCBjdHJsK3kgdG8gdW5kby9yZWRvIGluIHRvcG9sb2d5IHZpZXc7IGN0cmwrcyB0byBzYXZlIGxheW91dDwvYT48YSBzdHlsZT0nZGlzcGxheTpibG9jaztmb250LXN0eWxlOml0YWxpYztjb2xvcjpncmF5O3BhZGRpbmctdG9wOjIwcHg7cGFkZGluZy1ib3R0b206MjBweCc+UHJlc3Mgc2hpZnQgb3IgY3RybCBrZXkgdG8gc2VsZWN0IG11bHRpcGxlIHR3aW5zIGluIHRyZWUgdmlldzwvYT48YSBzdHlsZT0nZGlzcGxheTpibG9jaztmb250LXN0eWxlOml0YWxpYztjb2xvcjpncmF5O3BhZGRpbmctdG9wOjEycHg7cGFkZGluZy1ib3R0b206NXB4Jz5JbXBvcnQgdHdpbnMgZGF0YSBieSBjbGlja2luZyBidXR0b24gYmVsb3c8L2E+XCIpXHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKGltcEJ0biwgYWN0dWFsSW1wb3J0VHdpbnNCdG4pXHJcbiAgICB9XHJcbiAgICBcclxuICAgIGltcEJ0bi5vbihcImNsaWNrXCIsKCk9PnthY3R1YWxJbXBvcnRUd2luc0J0bi50cmlnZ2VyKCdjbGljaycpO30pXHJcbiAgICBhY3R1YWxJbXBvcnRUd2luc0J0bi5jaGFuZ2UoYXN5bmMgKGV2dCk9PntcclxuICAgICAgICB2YXIgZmlsZXMgPSBldnQudGFyZ2V0LmZpbGVzOyAvLyBGaWxlTGlzdCBvYmplY3RcclxuICAgICAgICBhd2FpdCB0aGlzLnJlYWRUd2luc0ZpbGVzQ29udGVudEFuZEltcG9ydChmaWxlcylcclxuICAgICAgICBhY3R1YWxJbXBvcnRUd2luc0J0bi52YWwoXCJcIilcclxuICAgIH0pXHJcbiAgICBpZihzZWxlY3RUeXBlPT1udWxsKSByZXR1cm47XHJcblxyXG4gICAgaWYoc2VsZWN0VHlwZT09XCJzaW5nbGVSZWxhdGlvbnNoaXBcIil7XHJcbiAgICAgICAgdmFyIGRlbEJ0biA9ICAkKCc8YnV0dG9uIHN0eWxlPVwid2lkdGg6MTA0cHhcIiBjbGFzcz1cInczLWJ1dHRvbiB3My1yZWQgdzMtaG92ZXItcGluayB3My1ib3JkZXJcIj5EZWxldGUgQWxsPC9idXR0b24+JylcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQoZGVsQnRuKVxyXG4gICAgICAgIGRlbEJ0bi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICAgICAgdGhpcy5kZWxldGVTZWxlY3RlZCgpXHJcbiAgICAgICAgICAgICQoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkuYmx1cigpXHJcbiAgICAgICAgfSlcclxuICAgIH1lbHNlIGlmKHNlbGVjdFR5cGU9PVwic2luZ2xlTm9kZVwiIHx8IHNlbGVjdFR5cGU9PVwibXVsdGlwbGVcIil7XHJcbiAgICAgICAgdmFyIGRlbEJ0biA9ICQoJzxidXR0b24gc3R5bGU9XCJ3aWR0aDoxMDRweFwiIGNsYXNzPVwidzMtYnV0dG9uIHczLXJlZCB3My1ob3Zlci1waW5rIHczLWJvcmRlclwiPkRlbGV0ZSBBbGw8L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBjb25uZWN0VG9CdG4gPSQoJzxidXR0b24gc3R5bGU9XCJ3aWR0aDo0NSVcIiAgY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+Q29ubmVjdCB0bzwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIGNvbm5lY3RGcm9tQnRuID0gJCgnPGJ1dHRvbiBzdHlsZT1cIndpZHRoOjQ1JVwiIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiPkNvbm5lY3QgZnJvbTwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIHNob3dJbmJvdW5kQnRuID0gJCgnPGJ1dHRvbiAgc3R5bGU9XCJ3aWR0aDo0NSVcIiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj5RdWVyeSBJbmJvdW5kPC9idXR0b24+JylcclxuICAgICAgICB2YXIgc2hvd091dEJvdW5kQnRuID0gJCgnPGJ1dHRvbiBzdHlsZT1cIndpZHRoOjQ1JVwiIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiPlF1ZXJ5IE91dGJvdW5kPC9idXR0b24+JylcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQoZGVsQnRuLCBjb25uZWN0VG9CdG4sY29ubmVjdEZyb21CdG4gLCBzaG93SW5ib3VuZEJ0biwgc2hvd091dEJvdW5kQnRuKVxyXG4gICAgXHJcbiAgICAgICAgc2hvd091dEJvdW5kQnRuLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgICAgICB0aGlzLnNob3dPdXRCb3VuZCgpXHJcbiAgICAgICAgICAgICQoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkuYmx1cigpXHJcbiAgICAgICAgfSlcclxuICAgICAgICBzaG93SW5ib3VuZEJ0bi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICAgICAgdGhpcy5zaG93SW5Cb3VuZCgpXHJcbiAgICAgICAgICAgICQoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkuYmx1cigpXHJcbiAgICAgICAgfSkgIFxyXG4gICAgICAgIGNvbm5lY3RUb0J0bi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiY29ubmVjdFRvXCJ9KSBcclxuICAgICAgICAgICAgJChkb2N1bWVudC5hY3RpdmVFbGVtZW50KS5ibHVyKClcclxuICAgICAgICB9KVxyXG4gICAgICAgIGNvbm5lY3RGcm9tQnRuLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJjb25uZWN0RnJvbVwifSkgXHJcbiAgICAgICAgICAgICQoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkuYmx1cigpXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgZGVsQnRuLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgICAgICB0aGlzLmRlbGV0ZVNlbGVjdGVkKClcclxuICAgICAgICAgICAgJChkb2N1bWVudC5hY3RpdmVFbGVtZW50KS5ibHVyKClcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICB2YXIgbnVtT2ZOb2RlID0gMDtcclxuICAgIHZhciBhcnI9dGhpcy5zZWxlY3RlZE9iamVjdHM7XHJcbiAgICBhcnIuZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICBpZiAoZWxlbWVudFsnJGR0SWQnXSkgbnVtT2ZOb2RlKytcclxuICAgIH0pO1xyXG4gICAgaWYobnVtT2ZOb2RlPjApe1xyXG4gICAgICAgIHZhciBzZWxlY3RJbmJvdW5kQnRuID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj4rU2VsZWN0IEluYm91bmQ8L2J1dHRvbj4nKVxyXG4gICAgICAgIHZhciBzZWxlY3RPdXRCb3VuZEJ0biA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+K1NlbGVjdCBPdXRib3VuZDwvYnV0dG9uPicpXHJcbiAgICAgICAgdmFyIGNvc2VMYXlvdXRCdG49ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+Q09TRSBWaWV3PC9idXR0b24+JylcclxuICAgICAgICB2YXIgaGlkZUJ0bj0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj5IaWRlPC9idXR0b24+JylcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQoc2VsZWN0SW5ib3VuZEJ0biwgc2VsZWN0T3V0Qm91bmRCdG4sY29zZUxheW91dEJ0bixoaWRlQnRuKVxyXG5cclxuICAgICAgICBzZWxlY3RJbmJvdW5kQnRuLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2Uoe1wibWVzc2FnZVwiOiBcImFkZFNlbGVjdEluYm91bmRcIn0pXHJcbiAgICAgICAgICAgICQoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkuYmx1cigpXHJcbiAgICAgICAgfSlcclxuICAgICAgICBzZWxlY3RPdXRCb3VuZEJ0bi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHtcIm1lc3NhZ2VcIjogXCJhZGRTZWxlY3RPdXRib3VuZFwifSlcclxuICAgICAgICAgICAgJChkb2N1bWVudC5hY3RpdmVFbGVtZW50KS5ibHVyKClcclxuICAgICAgICB9KVxyXG4gICAgICAgIGNvc2VMYXlvdXRCdG4ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7XCJtZXNzYWdlXCI6IFwiQ09TRVNlbGVjdGVkTm9kZXNcIn0pXHJcbiAgICAgICAgICAgICQoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkuYmx1cigpXHJcbiAgICAgICAgfSlcclxuICAgICAgICBoaWRlQnRuLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgICAgICB2YXIgdHdpbklEQXJyPVtdXHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0ZWRPYmplY3RzLmZvckVhY2goZWxlPT57aWYoZWxlWyckZHRJZCddKSB0d2luSURBcnIucHVzaChlbGVbJyRkdElkJ10pfSlcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHtcIm1lc3NhZ2VcIjogXCJoaWRlU2VsZWN0ZWROb2Rlc1wiLFwidHdpbklEQXJyXCI6dHdpbklEQXJyfSlcclxuICAgICAgICAgICAgJChkb2N1bWVudC5hY3RpdmVFbGVtZW50KS5ibHVyKClcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG4gICAgaWYgKG51bU9mTm9kZSA+IDEpIHtcclxuICAgICAgICAvL3NvbWUgYWRkaXRpb25hbCBidXR0b25zIHdoZW4gc2VsZWN0IG11bHRpcGxlIGl0ZW1zXHJcbiAgICAgICAgdGhpcy5kcmF3QWR2YW5jZUFsaWdubWVudEJ1dHRvbnMoKVxyXG4gICAgfVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmRyYXdBZHZhbmNlQWxpZ25tZW50QnV0dG9ucz1hc3luYyBmdW5jdGlvbigpe1xyXG4gICAgdmFyIGxhYmVsPSQoXCI8bGFiZWwgY2xhc3M9J3czLWdyYXknIHN0eWxlPSdkaXNwbGF5OmJsb2NrO21hcmdpbi10b3A6NXB4O3dpZHRoOjIwJTt0ZXh0LWFsaWduOmNlbnRlcjtmb250LXNpemU6OXB4O3BhZGRpbmc6MnB4IDRweDtmb250LXdlaWdodDpub3JtYWw7Ym9yZGVyLXJhZGl1czogMnB4Oyc+QXJyYW5nZTwvbGFiZWw+XCIpIFxyXG4gICAgdGhpcy5ET00uYXBwZW5kKGxhYmVsKSBcclxuICAgIHZhciBhbGlnbkJ1dHRvbnNUYWJsZT0kKFwiPHRhYmxlIHN0eWxlPSdtYXJnaW46MCBhdXRvJz48dHI+PHRkPjwvdGQ+PHRkPjwvdGQ+PHRkPjwvdGQ+PC90cj48dHI+PHRkPjwvdGQ+PHRkIHN0eWxlPSd0ZXh0LWFsaWduOmNlbnRlcjtmb250LXdlaWdodDpib2xkO2NvbG9yOmRhcmtHcmF5Jz5BTElHTjwvdGQ+PHRkPjwvdGQ+PC90cj48dHI+PHRkPjwvdGQ+PHRkPjwvdGQ+PHRkPjwvdGQ+PC90cj48L3RhYmxlPlwiKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKGFsaWduQnV0dG9uc1RhYmxlKVxyXG4gICAgdmFyIGFsaWduVG9wQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj48aSBjbGFzcz1cImZhcyBmYS1jaGV2cm9uLXVwXCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICB2YXIgYWxpZ25MZWZ0QnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj48aSBjbGFzcz1cImZhcyBmYS1jaGV2cm9uLWxlZnRcIj48L2k+PC9idXR0b24+JylcclxuICAgIHZhciBhbGlnblJpZ2h0QnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIj48aSBjbGFzcz1cImZhcyBmYS1jaGV2cm9uLXJpZ2h0XCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICB2YXIgYWxpZ25Cb3R0b21CdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiPjxpIGNsYXNzPVwiZmFzIGZhLWNoZXZyb24tZG93blwiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgYWxpZ25CdXR0b25zVGFibGUuZmluZChcInRkXCIpLmVxKDEpLmFwcGVuZChhbGlnblRvcEJ1dHRvbilcclxuICAgIGFsaWduQnV0dG9uc1RhYmxlLmZpbmQoXCJ0ZFwiKS5lcSgzKS5hcHBlbmQoYWxpZ25MZWZ0QnV0dG9uKVxyXG4gICAgYWxpZ25CdXR0b25zVGFibGUuZmluZChcInRkXCIpLmVxKDUpLmFwcGVuZChhbGlnblJpZ2h0QnV0dG9uKVxyXG4gICAgYWxpZ25CdXR0b25zVGFibGUuZmluZChcInRkXCIpLmVxKDcpLmFwcGVuZChhbGlnbkJvdHRvbUJ1dHRvbilcclxuXHJcblxyXG4gICAgdmFyIGFycmFuZ2VUYWJsZT0kKFwiPHRhYmxlIHN0eWxlPSdtYXJnaW46MCBhdXRvJz48dHI+PHRkPjwvdGQ+PHRkPjwvdGQ+PHRkPjwvdGQ+PHRkPjwvdGQ+PC90cj48dHI+PHRkPjwvdGQ+PHRkPjwvdGQ+PHRkPjwvdGQ+PHRkPjwvdGQ+PC90cj48L3RhYmxlPlwiKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKGFycmFuZ2VUYWJsZSlcclxuXHJcbiAgICB2YXIgZGlzdHJpYnV0ZUhCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiPjxpIGNsYXNzPVwiZmFzIGZhLWVsbGlwc2lzLWggZmEtbGdcIj48L2k+PC9idXR0b24+JykgXHJcbiAgICB2YXIgZGlzdHJpYnV0ZVZCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiPjxpIGNsYXNzPVwiZmFzIGZhLWVsbGlwc2lzLXYgZmEtbGdcIj48L2k+PC9idXR0b24+JykgXHJcbiAgICB2YXIgbGVmdFJvdGF0ZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtYm9yZGVyXCI+PGkgY2xhc3M9XCJmYXMgZmEtdW5kby1hbHQgZmEtbGdcIj48L2k+PC9idXR0b24+JykgXHJcbiAgICB2YXIgcmlnaHRSb3RhdGVCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiPjxpIGNsYXNzPVwiZmFzIGZhLXJlZG8tYWx0IGZhLWxnXCI+PC9pPjwvYnV0dG9uPicpIFxyXG4gICAgdmFyIG1pcnJvckhCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiIHN0eWxlPVwid2lkdGg6MTAwJVwiPjxpIGNsYXNzPVwiZmFzIGZhLWFycm93cy1hbHQtaFwiPjwvaT48L2J1dHRvbj4nKSBcclxuICAgIHZhciBtaXJyb3JWQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIiBzdHlsZT1cIndpZHRoOjEwMCVcIj48aSBjbGFzcz1cImZhcyBmYS1hcnJvd3MtYWx0LXZcIj48L2k+PC9idXR0b24+JylcclxuICAgIHZhciBleHBhbmRCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJvcmRlclwiIHN0eWxlPVwid2lkdGg6MTAwJVwiPjxpIGNsYXNzPVwiZmFzIGZhLWV4cGFuZC1hcnJvd3MtYWx0XCI+PC9pPjwvYnV0dG9uPicpIFxyXG4gICAgdmFyIGNvbXByZXNzQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1ib3JkZXJcIiBzdHlsZT1cIndpZHRoOjEwMCVcIj48aSBjbGFzcz1cImZhcyBmYS1jb21wcmVzcy1hcnJvd3MtYWx0XCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICBcclxuICAgIGFycmFuZ2VUYWJsZS5maW5kKFwidGRcIikuZXEoMCkuYXBwZW5kKGRpc3RyaWJ1dGVIQnV0dG9uKVxyXG4gICAgYXJyYW5nZVRhYmxlLmZpbmQoXCJ0ZFwiKS5lcSgxKS5hcHBlbmQoZGlzdHJpYnV0ZVZCdXR0b24pXHJcbiAgICBhcnJhbmdlVGFibGUuZmluZChcInRkXCIpLmVxKDIpLmFwcGVuZChsZWZ0Um90YXRlQnV0dG9uKVxyXG4gICAgYXJyYW5nZVRhYmxlLmZpbmQoXCJ0ZFwiKS5lcSgzKS5hcHBlbmQocmlnaHRSb3RhdGVCdXR0b24pXHJcbiAgICBhcnJhbmdlVGFibGUuZmluZChcInRkXCIpLmVxKDQpLmFwcGVuZChtaXJyb3JIQnV0dG9uKVxyXG4gICAgYXJyYW5nZVRhYmxlLmZpbmQoXCJ0ZFwiKS5lcSg1KS5hcHBlbmQobWlycm9yVkJ1dHRvbilcclxuICAgIGFycmFuZ2VUYWJsZS5maW5kKFwidGRcIikuZXEoNikuYXBwZW5kKGV4cGFuZEJ1dHRvbilcclxuICAgIGFycmFuZ2VUYWJsZS5maW5kKFwidGRcIikuZXEoNykuYXBwZW5kKGNvbXByZXNzQnV0dG9uKVxyXG5cclxuXHJcbiAgICBhbGlnblRvcEJ1dHRvbi5vbihcImNsaWNrXCIsIChlKSA9PiB7XHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiYWxpZ25TZWxlY3RlZE5vZGVcIiwgZGlyZWN0aW9uOiBcInRvcFwiIH0pXHJcbiAgICAgICAgJChkb2N1bWVudC5hY3RpdmVFbGVtZW50KS5ibHVyKClcclxuICAgIH0pXHJcbiAgICBhbGlnbkxlZnRCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiYWxpZ25TZWxlY3RlZE5vZGVcIiwgZGlyZWN0aW9uOiBcImxlZnRcIiB9KVxyXG4gICAgICAgICQoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkuYmx1cigpXHJcbiAgICB9KVxyXG4gICAgYWxpZ25SaWdodEJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJhbGlnblNlbGVjdGVkTm9kZVwiLCBkaXJlY3Rpb246IFwicmlnaHRcIiB9KVxyXG4gICAgICAgICQoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkuYmx1cigpXHJcbiAgICB9KVxyXG4gICAgYWxpZ25Cb3R0b21CdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiYWxpZ25TZWxlY3RlZE5vZGVcIiwgZGlyZWN0aW9uOiBcImJvdHRvbVwiIH0pXHJcbiAgICAgICAgJChkb2N1bWVudC5hY3RpdmVFbGVtZW50KS5ibHVyKClcclxuICAgIH0pXHJcblxyXG4gICAgZGlzdHJpYnV0ZUhCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiZGlzdHJpYnV0ZVNlbGVjdGVkTm9kZVwiLCBkaXJlY3Rpb246IFwiaG9yaXpvbnRhbFwiIH0pXHJcbiAgICAgICAgJChkb2N1bWVudC5hY3RpdmVFbGVtZW50KS5ibHVyKClcclxuICAgIH0pXHJcbiAgICBkaXN0cmlidXRlVkJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJkaXN0cmlidXRlU2VsZWN0ZWROb2RlXCIsIGRpcmVjdGlvbjogXCJ2ZXJ0aWNhbFwiIH0pXHJcbiAgICAgICAgJChkb2N1bWVudC5hY3RpdmVFbGVtZW50KS5ibHVyKClcclxuICAgIH0pXHJcbiAgICBsZWZ0Um90YXRlQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInJvdGF0ZVNlbGVjdGVkTm9kZVwiLCBkaXJlY3Rpb246IFwibGVmdFwiIH0pXHJcbiAgICAgICAgJChkb2N1bWVudC5hY3RpdmVFbGVtZW50KS5ibHVyKClcclxuICAgIH0pXHJcbiAgICByaWdodFJvdGF0ZUJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJyb3RhdGVTZWxlY3RlZE5vZGVcIiwgZGlyZWN0aW9uOiBcInJpZ2h0XCIgfSlcclxuICAgICAgICAkKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpLmJsdXIoKVxyXG4gICAgfSlcclxuICAgIG1pcnJvckhCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwibWlycm9yU2VsZWN0ZWROb2RlXCIsIGRpcmVjdGlvbjogXCJob3Jpem9udGFsXCIgfSlcclxuICAgICAgICAkKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQpLmJsdXIoKVxyXG4gICAgfSlcclxuICAgIG1pcnJvclZCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwibWlycm9yU2VsZWN0ZWROb2RlXCIsIGRpcmVjdGlvbjogXCJ2ZXJ0aWNhbFwiIH0pXHJcbiAgICAgICAgJChkb2N1bWVudC5hY3RpdmVFbGVtZW50KS5ibHVyKClcclxuICAgIH0pXHJcbiAgICBleHBhbmRCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiZGltZW5zaW9uU2VsZWN0ZWROb2RlXCIsIGRpcmVjdGlvbjogXCJleHBhbmRcIiB9KVxyXG4gICAgICAgICQoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCkuYmx1cigpXHJcbiAgICB9KVxyXG4gICAgY29tcHJlc3NCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiZGltZW5zaW9uU2VsZWN0ZWROb2RlXCIsIGRpcmVjdGlvbjogXCJjb21wcmVzc1wiIH0pXHJcbiAgICAgICAgJChkb2N1bWVudC5hY3RpdmVFbGVtZW50KS5ibHVyKClcclxuICAgIH0pXHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZXhwb3J0U2VsZWN0ZWQ9YXN5bmMgZnVuY3Rpb24oKXtcclxuICAgIHZhciBhcnI9dGhpcy5zZWxlY3RlZE9iamVjdHM7XHJcbiAgICBpZihhcnIubGVuZ3RoPT0wKSByZXR1cm47XHJcbiAgICB2YXIgdHdpbklEQXJyPVtdXHJcbiAgICB2YXIgdHdpblRvQmVTdG9yZWQ9W11cclxuICAgIHZhciB0d2luSURzPXt9XHJcbiAgICBhcnIuZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICBpZiAoZWxlbWVudFsnJHNvdXJjZUlkJ10pIHJldHVyblxyXG4gICAgICAgIHR3aW5JREFyci5wdXNoKGVsZW1lbnRbJyRkdElkJ10pXHJcbiAgICAgICAgdmFyIGFuRXhwVHdpbj17fVxyXG4gICAgICAgIGFuRXhwVHdpbltcIiRtZXRhZGF0YVwiXT17XCIkbW9kZWxcIjplbGVtZW50W1wiJG1ldGFkYXRhXCJdW1wiJG1vZGVsXCJdfVxyXG4gICAgICAgIGZvcih2YXIgaW5kIGluIGVsZW1lbnQpe1xyXG4gICAgICAgICAgICBpZihpbmQ9PVwiJG1ldGFkYXRhXCIgfHwgaW5kPT1cIiRldGFnXCIpIGNvbnRpbnVlIFxyXG4gICAgICAgICAgICBlbHNlIGFuRXhwVHdpbltpbmRdPWVsZW1lbnRbaW5kXVxyXG4gICAgICAgIH1cclxuICAgICAgICB0d2luVG9CZVN0b3JlZC5wdXNoKGFuRXhwVHdpbilcclxuICAgICAgICB0d2luSURzW2VsZW1lbnRbJyRkdElkJ11dPTFcclxuICAgIH0pO1xyXG4gICAgdmFyIHJlbGF0aW9uc1RvQmVTdG9yZWQ9W11cclxuICAgIHR3aW5JREFyci5mb3JFYWNoKG9uZUlEPT57XHJcbiAgICAgICAgdmFyIHJlbGF0aW9ucz1nbG9iYWxDYWNoZS5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbb25lSURdXHJcbiAgICAgICAgaWYoIXJlbGF0aW9ucykgcmV0dXJuO1xyXG4gICAgICAgIHJlbGF0aW9ucy5mb3JFYWNoKG9uZVJlbGF0aW9uPT57XHJcbiAgICAgICAgICAgIHZhciB0YXJnZXRJRD1vbmVSZWxhdGlvbltcIiR0YXJnZXRJZFwiXVxyXG4gICAgICAgICAgICBpZih0d2luSURzW3RhcmdldElEXSkge1xyXG4gICAgICAgICAgICAgICAgdmFyIG9iaj17fVxyXG4gICAgICAgICAgICAgICAgZm9yKHZhciBpbmQgaW4gb25lUmVsYXRpb24pe1xyXG4gICAgICAgICAgICAgICAgICAgIGlmKGluZCA9PVwiJGV0YWdcInx8aW5kID09XCIkcmVsYXRpb25zaGlwSWRcInx8aW5kID09XCIkc291cmNlSWRcInx8aW5kID09XCJzb3VyY2VNb2RlbFwiKSBjb250aW51ZVxyXG4gICAgICAgICAgICAgICAgICAgIG9ialtpbmRdPW9uZVJlbGF0aW9uW2luZF1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHZhciBvbmVBY3Rpb249e1wiJHNyY0lkXCI6b25lSUQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCIkcmVsYXRpb25zaGlwSWRcIjpvbmVSZWxhdGlvbltcIiRyZWxhdGlvbnNoaXBJZFwiXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIm9ialwiOm9ian1cclxuICAgICAgICAgICAgICAgIHJlbGF0aW9uc1RvQmVTdG9yZWQucHVzaChvbmVBY3Rpb24pXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgfSlcclxuICAgIHZhciBmaW5hbEpTT049e1widHdpbnNcIjp0d2luVG9CZVN0b3JlZCxcInJlbGF0aW9uc1wiOnJlbGF0aW9uc1RvQmVTdG9yZWR9XHJcbiAgICB2YXIgcG9tID0gJChcIjxhPjwvYT5cIilcclxuICAgIHBvbS5hdHRyKCdocmVmJywgJ2RhdGE6dGV4dC9wbGFpbjtjaGFyc2V0PXV0Zi04LCcgKyBlbmNvZGVVUklDb21wb25lbnQoSlNPTi5zdHJpbmdpZnkoZmluYWxKU09OKSkpO1xyXG4gICAgcG9tLmF0dHIoJ2Rvd25sb2FkJywgXCJleHBvcnRUd2luc0RhdGEuanNvblwiKTtcclxuICAgIHBvbVswXS5jbGljaygpXHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUucmVhZE9uZUZpbGU9IGFzeW5jIGZ1bmN0aW9uKGFGaWxlKXtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcclxuICAgICAgICAgICAgcmVhZGVyLm9ubG9hZCA9ICgpPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZWFkZXIucmVzdWx0KVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICByZWFkZXIucmVhZEFzVGV4dChhRmlsZSk7XHJcbiAgICAgICAgfWNhdGNoKGUpe1xyXG4gICAgICAgICAgICByZWplY3QoZSlcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG59XHJcbmluZm9QYW5lbC5wcm90b3R5cGUucmVhZFR3aW5zRmlsZXNDb250ZW50QW5kSW1wb3J0PWFzeW5jIGZ1bmN0aW9uKGZpbGVzKXtcclxuICAgIHZhciBpbXBvcnRUd2lucz1bXVxyXG4gICAgdmFyIGltcG9ydFJlbGF0aW9ucz1bXVxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGk8IGZpbGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdmFyIGY9ZmlsZXNbaV1cclxuICAgICAgICAvLyBPbmx5IHByb2Nlc3MganNvbiBmaWxlcy5cclxuICAgICAgICBpZiAoZi50eXBlIT1cImFwcGxpY2F0aW9uL2pzb25cIikgY29udGludWU7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICB2YXIgc3RyPSBhd2FpdCB0aGlzLnJlYWRPbmVGaWxlKGYpXHJcbiAgICAgICAgICAgIHZhciBvYmo9SlNPTi5wYXJzZShzdHIpXHJcbiAgICAgICAgICAgIGlmKG9iai50d2lucykgaW1wb3J0VHdpbnM9aW1wb3J0VHdpbnMuY29uY2F0KG9iai50d2lucylcclxuICAgICAgICAgICAgaWYob2JqLnJlbGF0aW9ucykgaW1wb3J0UmVsYXRpb25zPWltcG9ydFJlbGF0aW9ucy5jb25jYXQob2JqLnJlbGF0aW9ucylcclxuICAgICAgICB9Y2F0Y2goZXJyKXtcclxuICAgICAgICAgICAgYWxlcnQoZXJyKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvL2ZvciBBRFQgVUkgc3RhbmRhbG9uZSB0b29sLCB0cmFuc2xhdGUgYWxsIHR3aW4gSUQgYnkgaXRzIGRpc3BsYXlOYW1lXHJcbiAgICB2YXIgSUR0b05hbWU9e31cclxuICAgIGltcG9ydFR3aW5zLmZvckVhY2gob25lVHdpbj0+e1xyXG4gICAgICAgIHZhciBkaXNwbGF5TmFtZT1vbmVUd2luW1wiZGlzcGxheU5hbWVcIl0gfHwgb25lVHdpbltcIiRkdElkXCJdXHJcbiAgICAgICAgSUR0b05hbWVbb25lVHdpbltcIiRkdElkXCJdXT1kaXNwbGF5TmFtZVxyXG4gICAgICAgIG9uZVR3aW5bXCIkZHRJZFwiXT1kaXNwbGF5TmFtZVxyXG4gICAgICAgIGRlbGV0ZSBvbmVUd2luW1wiZGlzcGxheU5hbWVcIl1cclxuICAgIH0pXHJcbiAgICBpbXBvcnRSZWxhdGlvbnMuZm9yRWFjaChvbmVSZWxhdGlvbj0+e1xyXG4gICAgICAgIG9uZVJlbGF0aW9uW1wiJHNyY0lkXCJdPUlEdG9OYW1lW29uZVJlbGF0aW9uW1wiJHNyY0lkXCJdXXx8b25lUmVsYXRpb25bXCIkc3JjSWRcIl1cclxuICAgICAgICBvbmVSZWxhdGlvbltcIm9ialwiXVtcIiR0YXJnZXRJZFwiXT1JRHRvTmFtZVtvbmVSZWxhdGlvbltcIm9ialwiXVtcIiR0YXJnZXRJZFwiXV18fG9uZVJlbGF0aW9uW1wib2JqXCJdW1wiJHRhcmdldElkXCJdXHJcbiAgICB9KVxyXG5cclxuXHJcbiAgICB2YXIgdHdpbnNJbXBvcnRSZXN1bHQ9IGF3YWl0IHRoaXMuYmF0Y2hJbXBvcnRUd2lucyhpbXBvcnRUd2lucylcclxuICAgIHR3aW5zSW1wb3J0UmVzdWx0LmZvckVhY2goZGF0YT0+e1xyXG4gICAgICAgIGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW2RhdGFbXCIkZHRJZFwiXV0gPSBkYXRhO1xyXG4gICAgfSlcclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImFkZE5ld1R3aW5zXCIsdHdpbnNJbmZvOnR3aW5zSW1wb3J0UmVzdWx0fSlcclxuXHJcbiAgICB2YXIgcmVsYXRpb25zSW1wb3J0UmVzdWx0PWF3YWl0IHRoaXMuYmF0Y2hJbXBvcnRSZWxhdGlvbnMoaW1wb3J0UmVsYXRpb25zKVxyXG4gICAgZ2xvYmFsQ2FjaGUuc3RvcmVUd2luUmVsYXRpb25zaGlwc19hcHBlbmQocmVsYXRpb25zSW1wb3J0UmVzdWx0KVxyXG4gICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiZHJhd0FsbFJlbGF0aW9uc1wiLGluZm86cmVsYXRpb25zSW1wb3J0UmVzdWx0fSlcclxuXHJcbiAgICB2YXIgbnVtT2ZUd2lucz10d2luc0ltcG9ydFJlc3VsdC5sZW5ndGhcclxuICAgIHZhciBudW1PZlJlbGF0aW9ucz1yZWxhdGlvbnNJbXBvcnRSZXN1bHQubGVuZ3RoXHJcbiAgICB2YXIgc3RyPVwiQWRkIFwiK251bU9mVHdpbnMrIFwiIG5vZGVcIisoKG51bU9mVHdpbnM8PTEpP1wiXCI6XCJzXCIpK1wiLCBcIitudW1PZlJlbGF0aW9ucytcIiByZWxhdGlvbnNoaXBcIisoKG51bU9mUmVsYXRpb25zPD0xKT9cIlwiOlwic1wiKVxyXG4gICAgc3RyKz1gLiAoUmF3IHR3aW4gcmVjb3Jkczoke2ltcG9ydFR3aW5zLmxlbmd0aH0pOyBSYXcgcmVsYXRpb25zIHJlY29yZHM6JHtpbXBvcnRSZWxhdGlvbnMubGVuZ3RofSlgXHJcbiAgICB2YXIgY29uZmlybURpYWxvZ0RpdiA9IG5ldyBzaW1wbGVDb25maXJtRGlhbG9nKClcclxuICAgIGNvbmZpcm1EaWFsb2dEaXYuc2hvdyhcclxuICAgICAgICB7IHdpZHRoOiBcIjQwMHB4XCIgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIkltcG9ydCBSZXN1bHRcIlxyXG4gICAgICAgICAgICAsIGNvbnRlbnQ6c3RyXHJcbiAgICAgICAgICAgICwgYnV0dG9uczogW1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtZ3JheVwiLCB0ZXh0OiBcIk9rXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfVxyXG4gICAgKVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmJhdGNoSW1wb3J0VHdpbnM9YXN5bmMgZnVuY3Rpb24odHdpbnMpe1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICBpZih0d2lucy5sZW5ndGg9PTApIHJlc29sdmUoW10pXHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICAkLnBvc3QoXCJlZGl0QURUL2JhdGNoSW1wb3J0VHdpbnNcIix7XCJ0d2luc1wiOkpTT04uc3RyaW5naWZ5KHR3aW5zKX0sIChkYXRhKT0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChkYXRhID09IFwiXCIpIGRhdGE9W11cclxuICAgICAgICAgICAgICAgIHJlc29sdmUoZGF0YSlcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfWNhdGNoKGUpe1xyXG4gICAgICAgICAgICByZWplY3QoZSlcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmJhdGNoSW1wb3J0UmVsYXRpb25zPWFzeW5jIGZ1bmN0aW9uKHJlbGF0aW9ucyl7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIGlmKHJlbGF0aW9ucy5sZW5ndGg9PTApIHJlc29sdmUoW10pXHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICAkLnBvc3QoXCJlZGl0QURUL2NyZWF0ZVJlbGF0aW9uc1wiLHtcImFjdGlvbnNcIjpKU09OLnN0cmluZ2lmeShyZWxhdGlvbnMpfSwgKGRhdGEpPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGRhdGEgPT0gXCJcIikgZGF0YT1bXVxyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShkYXRhKVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIHJlamVjdChlKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1cclxuXHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLnJlZnJlc2hJbmZvbWF0aW9uPWFzeW5jIGZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgYXJyPXRoaXMuc2VsZWN0ZWRPYmplY3RzO1xyXG4gICAgdmFyIHF1ZXJ5QXJyPVtdXHJcbiAgICBhcnIuZm9yRWFjaChvbmVJdGVtPT57XHJcbiAgICAgICAgaWYob25lSXRlbVsnJHJlbGF0aW9uc2hpcElkJ10pIHF1ZXJ5QXJyLnB1c2goeyckc291cmNlSWQnOm9uZUl0ZW1bJyRzb3VyY2VJZCddLCckcmVsYXRpb25zaGlwSWQnOm9uZUl0ZW1bJyRyZWxhdGlvbnNoaXBJZCddfSlcclxuICAgICAgICBlbHNlIHF1ZXJ5QXJyLnB1c2goeyckZHRJZCc6b25lSXRlbVsnJGR0SWQnXX0pXHJcbiAgICB9KVxyXG5cclxuICAgICQucG9zdChcInF1ZXJ5QURUL2ZldGNoSW5mb21hdGlvblwiLHtcImVsZW1lbnRzXCI6cXVlcnlBcnJ9LCAgKGRhdGEpPT4ge1xyXG4gICAgICAgIGlmKGRhdGE9PVwiXCIpIHJldHVybjtcclxuICAgICAgICBkYXRhLmZvckVhY2gob25lUmU9PntcclxuICAgICAgICAgICAgaWYob25lUmVbXCIkcmVsYXRpb25zaGlwSWRcIl0pey8vdXBkYXRlIHN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1xyXG4gICAgICAgICAgICAgICAgdmFyIHNyY0lEPSBvbmVSZVsnJHNvdXJjZUlkJ11cclxuICAgICAgICAgICAgICAgIHZhciByZWxhdGlvbnNoaXBJZD0gb25lUmVbJyRyZWxhdGlvbnNoaXBJZCddXHJcbiAgICAgICAgICAgICAgICBpZihnbG9iYWxDYWNoZS5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbc3JjSURdIT1udWxsKXtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVsYXRpb25zPWdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tzcmNJRF1cclxuICAgICAgICAgICAgICAgICAgICByZWxhdGlvbnMuZm9yRWFjaChvbmVTdG9yZWRSZWxhdGlvbj0+e1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZihvbmVTdG9yZWRSZWxhdGlvblsnJHJlbGF0aW9uc2hpcElkJ109PXJlbGF0aW9uc2hpcElkKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vdXBkYXRlIGFsbCBjb250ZW50XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IodmFyIGluZCBpbiBvbmVSZSl7IG9uZVN0b3JlZFJlbGF0aW9uW2luZF09b25lUmVbaW5kXSB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9ZWxzZXsvL3VwZGF0ZSBzdG9yZWRUd2luc1xyXG4gICAgICAgICAgICAgICAgdmFyIHR3aW5JRD0gb25lUmVbJyRkdElkJ11cclxuICAgICAgICAgICAgICAgIGlmKGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3R3aW5JRF0hPW51bGwpe1xyXG4gICAgICAgICAgICAgICAgICAgIGZvcih2YXIgaW5kIGluIG9uZVJlKXsgZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbdHdpbklEXVtpbmRdPW9uZVJlW2luZF0gfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICBcclxuICAgICAgICAvL3JlZHJhdyBpbmZvcGFuZWwgaWYgbmVlZGVkXHJcbiAgICAgICAgaWYodGhpcy5zZWxlY3RlZE9iamVjdHMubGVuZ3RoPT0xKSB0aGlzLnJ4TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInNob3dJbmZvU2VsZWN0ZWROb2Rlc1wiLCBpbmZvOiB0aGlzLnNlbGVjdGVkT2JqZWN0cyB9KVxyXG4gICAgfSk7XHJcbn1cclxuXHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmRlbGV0ZVNlbGVjdGVkPWFzeW5jIGZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgYXJyPXRoaXMuc2VsZWN0ZWRPYmplY3RzO1xyXG4gICAgaWYoYXJyLmxlbmd0aD09MCkgcmV0dXJuO1xyXG4gICAgdmFyIHJlbGF0aW9uc0Fycj1bXVxyXG4gICAgdmFyIHR3aW5JREFycj1bXVxyXG4gICAgdmFyIHR3aW5JRHM9e31cclxuICAgIGFyci5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIGlmIChlbGVtZW50Wyckc291cmNlSWQnXSkgcmVsYXRpb25zQXJyLnB1c2goZWxlbWVudCk7XHJcbiAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgdHdpbklEQXJyLnB1c2goZWxlbWVudFsnJGR0SWQnXSlcclxuICAgICAgICAgICAgdHdpbklEc1tlbGVtZW50WyckZHRJZCddXT0xXHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBmb3IodmFyIGk9cmVsYXRpb25zQXJyLmxlbmd0aC0xO2k+PTA7aS0tKXsgLy9jbGVhciB0aG9zZSByZWxhdGlvbnNoaXBzIHRoYXQgYXJlIGdvaW5nIHRvIGJlIGRlbGV0ZWQgYWZ0ZXIgdHdpbnMgZGVsZXRpbmdcclxuICAgICAgICB2YXIgc3JjSWQ9ICByZWxhdGlvbnNBcnJbaV1bJyRzb3VyY2VJZCddXHJcbiAgICAgICAgdmFyIHRhcmdldElkID0gcmVsYXRpb25zQXJyW2ldWyckdGFyZ2V0SWQnXVxyXG4gICAgICAgIGlmKHR3aW5JRHNbc3JjSWRdIT1udWxsIHx8IHR3aW5JRHNbdGFyZ2V0SWRdIT1udWxsKXtcclxuICAgICAgICAgICAgcmVsYXRpb25zQXJyLnNwbGljZShpLDEpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHZhciBjb25maXJtRGlhbG9nRGl2ID0gbmV3IHNpbXBsZUNvbmZpcm1EaWFsb2coKVxyXG4gICAgdmFyIGRpYWxvZ1N0cj1cIlwiXHJcbiAgICB2YXIgdHdpbk51bWJlcj10d2luSURBcnIubGVuZ3RoO1xyXG4gICAgdmFyIHJlbGF0aW9uc051bWJlciA9IHJlbGF0aW9uc0Fyci5sZW5ndGg7XHJcbiAgICBpZih0d2luTnVtYmVyPjApIGRpYWxvZ1N0ciA9ICB0d2luTnVtYmVyK1wiIHR3aW5cIisoKHR3aW5OdW1iZXI+MSk/XCJzXCI6XCJcIikgKyBcIiAod2l0aCBjb25uZWN0ZWQgcmVsYXRpb25zKVwiXHJcbiAgICBpZih0d2luTnVtYmVyPjAgJiYgcmVsYXRpb25zTnVtYmVyPjApIGRpYWxvZ1N0cis9XCIgYW5kIGFkZGl0aW9uYWwgXCJcclxuICAgIGlmKHJlbGF0aW9uc051bWJlcj4wKSBkaWFsb2dTdHIgKz0gIHJlbGF0aW9uc051bWJlcitcIiByZWxhdGlvblwiKygocmVsYXRpb25zTnVtYmVyPjEpP1wic1wiOlwiXCIgKVxyXG4gICAgZGlhbG9nU3RyKz1cIiB3aWxsIGJlIGRlbGV0ZWQuIFBsZWFzZSBjb25maXJtXCJcclxuICAgIGNvbmZpcm1EaWFsb2dEaXYuc2hvdyhcclxuICAgICAgICB7IHdpZHRoOiBcIjM1MHB4XCIgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIkNvbmZpcm1cIlxyXG4gICAgICAgICAgICAsIGNvbnRlbnQ6ZGlhbG9nU3RyXHJcbiAgICAgICAgICAgICwgYnV0dG9uczogW1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtcmVkIHczLWhvdmVyLXBpbmtcIiwgdGV4dDogXCJDb25maXJtXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR3aW5JREFyci5sZW5ndGggPiAwKSB0aGlzLmRlbGV0ZVR3aW5zKHR3aW5JREFycilcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlbGF0aW9uc0Fyci5sZW5ndGggPiAwKSB0aGlzLmRlbGV0ZVJlbGF0aW9ucyhyZWxhdGlvbnNBcnIpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLkRPTS5lbXB0eSgpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhd0J1dHRvbnMobnVsbClcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtZ3JheVwiLCB0ZXh0OiBcIkNhbmNlbFwiLCBcImNsaWNrRnVuY1wiOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH1cclxuICAgIClcclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5kZWxldGVUd2lucz1hc3luYyBmdW5jdGlvbih0d2luSURBcnIpeyAgIFxyXG4gICAgd2hpbGUodHdpbklEQXJyLmxlbmd0aD4wKXtcclxuICAgICAgICB2YXIgc21hbGxBcnI9IHR3aW5JREFyci5zcGxpY2UoMCwgMTAwKTtcclxuICAgICAgICB2YXIgcmVzdWx0PWF3YWl0IHRoaXMuZGVsZXRlUGFydGlhbFR3aW5zKHNtYWxsQXJyKVxyXG5cclxuICAgICAgICByZXN1bHQuZm9yRWFjaCgob25lSUQpPT57XHJcbiAgICAgICAgICAgIGRlbGV0ZSBnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1tvbmVJRF1cclxuICAgICAgICAgICAgZGVsZXRlIGdsb2JhbENhY2hlLnN0b3JlZE91dGJvdW5kUmVsYXRpb25zaGlwc1tvbmVJRF1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwidHdpbnNEZWxldGVkXCIsdHdpbklEQXJyOnJlc3VsdH0pXHJcbiAgICB9XHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZGVsZXRlUGFydGlhbFR3aW5zPSBhc3luYyBmdW5jdGlvbihJREFycil7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICAgJC5wb3N0KFwiZWRpdEFEVC9kZWxldGVUd2luc1wiLHthcnI6SURBcnJ9LCBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgaWYoZGF0YT09XCJcIikgZGF0YT1bXVxyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShkYXRhKVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIHJlamVjdChlKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1cclxuXHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmRlbGV0ZVJlbGF0aW9ucz1hc3luYyBmdW5jdGlvbihyZWxhdGlvbnNBcnIpe1xyXG4gICAgdmFyIGFycj1bXVxyXG4gICAgcmVsYXRpb25zQXJyLmZvckVhY2gob25lUmVsYXRpb249PntcclxuICAgICAgICBhcnIucHVzaCh7c3JjSUQ6b25lUmVsYXRpb25bJyRzb3VyY2VJZCddLHJlbElEOm9uZVJlbGF0aW9uWyckcmVsYXRpb25zaGlwSWQnXX0pXHJcbiAgICB9KVxyXG4gICAgJC5wb3N0KFwiZWRpdEFEVC9kZWxldGVSZWxhdGlvbnNcIix7XCJyZWxhdGlvbnNcIjphcnJ9LCAgKGRhdGEpPT4geyBcclxuICAgICAgICBpZihkYXRhPT1cIlwiKSBkYXRhPVtdO1xyXG4gICAgICAgIGdsb2JhbENhY2hlLnN0b3JlVHdpblJlbGF0aW9uc2hpcHNfcmVtb3ZlKGRhdGEpXHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwicmVsYXRpb25zRGVsZXRlZFwiLFwicmVsYXRpb25zXCI6ZGF0YX0pXHJcbiAgICB9KTtcclxuICAgIFxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLnNob3dPdXRCb3VuZD1hc3luYyBmdW5jdGlvbigpe1xyXG4gICAgdmFyIGFycj10aGlzLnNlbGVjdGVkT2JqZWN0cztcclxuICAgIHZhciB0d2luSURBcnI9W11cclxuICAgIGFyci5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIGlmIChlbGVtZW50Wyckc291cmNlSWQnXSkgcmV0dXJuO1xyXG4gICAgICAgIHR3aW5JREFyci5wdXNoKGVsZW1lbnRbJyRkdElkJ10pXHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgd2hpbGUodHdpbklEQXJyLmxlbmd0aD4wKXtcclxuICAgICAgICB2YXIgc21hbGxBcnI9IHR3aW5JREFyci5zcGxpY2UoMCwgMTAwKTtcclxuICAgICAgICB2YXIgZGF0YT1hd2FpdCB0aGlzLmZldGNoUGFydGlhbE91dGJvdW5kcyhzbWFsbEFycilcclxuICAgICAgICBpZihkYXRhPT1cIlwiKSBjb250aW51ZTtcclxuICAgICAgICAvL25ldyB0d2luJ3MgcmVsYXRpb25zaGlwIHNob3VsZCBiZSBzdG9yZWQgYXMgd2VsbFxyXG4gICAgICAgIGdsb2JhbENhY2hlLnN0b3JlVHdpblJlbGF0aW9uc2hpcHMoZGF0YS5uZXdUd2luUmVsYXRpb25zKVxyXG4gICAgICAgIFxyXG4gICAgICAgIGRhdGEuY2hpbGRUd2luc0FuZFJlbGF0aW9ucy5mb3JFYWNoKG9uZVNldD0+e1xyXG4gICAgICAgICAgICBmb3IodmFyIGluZCBpbiBvbmVTZXQuY2hpbGRUd2lucyl7XHJcbiAgICAgICAgICAgICAgICB2YXIgb25lVHdpbj1vbmVTZXQuY2hpbGRUd2luc1tpbmRdXHJcbiAgICAgICAgICAgICAgICBnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1tpbmRdPW9uZVR3aW5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwiZHJhd1R3aW5zQW5kUmVsYXRpb25zXCIsaW5mbzpkYXRhfSlcclxuICAgICAgICBcclxuXHJcbiAgICB9XHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuc2hvd0luQm91bmQ9YXN5bmMgZnVuY3Rpb24oKXtcclxuICAgIHZhciBhcnI9dGhpcy5zZWxlY3RlZE9iamVjdHM7XHJcbiAgICB2YXIgdHdpbklEQXJyPVtdXHJcbiAgICBhcnIuZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICBpZiAoZWxlbWVudFsnJHNvdXJjZUlkJ10pIHJldHVybjtcclxuICAgICAgICB0d2luSURBcnIucHVzaChlbGVtZW50WyckZHRJZCddKVxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHdoaWxlKHR3aW5JREFyci5sZW5ndGg+MCl7XHJcbiAgICAgICAgdmFyIHNtYWxsQXJyPSB0d2luSURBcnIuc3BsaWNlKDAsIDEwMCk7XHJcbiAgICAgICAgdmFyIGRhdGE9YXdhaXQgdGhpcy5mZXRjaFBhcnRpYWxJbmJvdW5kcyhzbWFsbEFycilcclxuICAgICAgICBpZihkYXRhPT1cIlwiKSBjb250aW51ZTtcclxuICAgICAgICAvL25ldyB0d2luJ3MgcmVsYXRpb25zaGlwIHNob3VsZCBiZSBzdG9yZWQgYXMgd2VsbFxyXG4gICAgICAgIGdsb2JhbENhY2hlLnN0b3JlVHdpblJlbGF0aW9uc2hpcHMoZGF0YS5uZXdUd2luUmVsYXRpb25zKVxyXG4gICAgICAgIFxyXG4gICAgICAgIC8vZGF0YS5uZXdUd2luUmVsYXRpb25zLmZvckVhY2gob25lUmVsYXRpb249Pntjb25zb2xlLmxvZyhvbmVSZWxhdGlvblsnJHNvdXJjZUlkJ10rXCItPlwiK29uZVJlbGF0aW9uWyckdGFyZ2V0SWQnXSl9KVxyXG4gICAgICAgIC8vY29uc29sZS5sb2coZ2xvYmFsQ2FjaGUuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW1wiZGVmYXVsdFwiXSlcclxuXHJcbiAgICAgICAgZGF0YS5jaGlsZFR3aW5zQW5kUmVsYXRpb25zLmZvckVhY2gob25lU2V0PT57XHJcbiAgICAgICAgICAgIGZvcih2YXIgaW5kIGluIG9uZVNldC5jaGlsZFR3aW5zKXtcclxuICAgICAgICAgICAgICAgIHZhciBvbmVUd2luPW9uZVNldC5jaGlsZFR3aW5zW2luZF1cclxuICAgICAgICAgICAgICAgIGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW2luZF09b25lVHdpblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJkcmF3VHdpbnNBbmRSZWxhdGlvbnNcIixpbmZvOmRhdGF9KVxyXG4gICAgfVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmZldGNoUGFydGlhbE91dGJvdW5kcz0gYXN5bmMgZnVuY3Rpb24oSURBcnIpe1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgIC8vZmluZCBvdXQgdGhvc2UgZXhpc3RlZCBvdXRib3VuZCB3aXRoIGtub3duIHRhcmdldCBUd2lucyBzbyB0aGV5IGNhbiBiZSBleGNsdWRlZCBmcm9tIHF1ZXJ5XHJcbiAgICAgICAgICAgIHZhciBrbm93blRhcmdldFR3aW5zPXt9XHJcbiAgICAgICAgICAgIElEQXJyLmZvckVhY2gob25lSUQ9PntcclxuICAgICAgICAgICAgICAgIGtub3duVGFyZ2V0VHdpbnNbb25lSURdPTEgLy9pdHNlbGYgYWxzbyBpcyBrbm93blxyXG4gICAgICAgICAgICAgICAgdmFyIG91dEJvdW5kUmVsYXRpb249Z2xvYmFsQ2FjaGUuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW29uZUlEXVxyXG4gICAgICAgICAgICAgICAgaWYob3V0Qm91bmRSZWxhdGlvbil7XHJcbiAgICAgICAgICAgICAgICAgICAgb3V0Qm91bmRSZWxhdGlvbi5mb3JFYWNoKG9uZVJlbGF0aW9uPT57XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0YXJnZXRJRD1vbmVSZWxhdGlvbltcIiR0YXJnZXRJZFwiXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZihnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1t0YXJnZXRJRF0hPW51bGwpIGtub3duVGFyZ2V0VHdpbnNbdGFyZ2V0SURdPTFcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgICAgJC5wb3N0KFwicXVlcnlBRFQvc2hvd091dEJvdW5kXCIse2FycjpJREFycixcImtub3duVGFyZ2V0c1wiOmtub3duVGFyZ2V0VHdpbnN9LCBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShkYXRhKVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIHJlamVjdChlKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZmV0Y2hQYXJ0aWFsSW5ib3VuZHM9IGFzeW5jIGZ1bmN0aW9uKElEQXJyKXtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICAvL2ZpbmQgb3V0IHRob3NlIGV4aXN0ZWQgaW5ib3VuZCB3aXRoIGtub3duIHNvdXJjZSBUd2lucyBzbyB0aGV5IGNhbiBiZSBleGNsdWRlZCBmcm9tIHF1ZXJ5XHJcbiAgICAgICAgICAgIHZhciBrbm93blNvdXJjZVR3aW5zPXt9XHJcbiAgICAgICAgICAgIHZhciBJRERpY3Q9e31cclxuICAgICAgICAgICAgSURBcnIuZm9yRWFjaChvbmVJRD0+e1xyXG4gICAgICAgICAgICAgICAgSUREaWN0W29uZUlEXT0xXHJcbiAgICAgICAgICAgICAgICBrbm93blNvdXJjZVR3aW5zW29uZUlEXT0xIC8vaXRzZWxmIGFsc28gaXMga25vd25cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgZm9yKHZhciB0d2luSUQgaW4gZ2xvYmFsQ2FjaGUuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzKXtcclxuICAgICAgICAgICAgICAgIHZhciByZWxhdGlvbnM9Z2xvYmFsQ2FjaGUuc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzW3R3aW5JRF1cclxuICAgICAgICAgICAgICAgIHJlbGF0aW9ucy5mb3JFYWNoKG9uZVJlbGF0aW9uPT57XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRhcmdldElEPW9uZVJlbGF0aW9uWyckdGFyZ2V0SWQnXVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBzcmNJRD1vbmVSZWxhdGlvblsnJHNvdXJjZUlkJ11cclxuICAgICAgICAgICAgICAgICAgICBpZihJRERpY3RbdGFyZ2V0SURdIT1udWxsKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYoZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbc3JjSURdIT1udWxsKSBrbm93blNvdXJjZVR3aW5zW3NyY0lEXT0xXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgJC5wb3N0KFwicXVlcnlBRFQvc2hvd0luQm91bmRcIix7YXJyOklEQXJyLFwia25vd25Tb3VyY2VzXCI6a25vd25Tb3VyY2VUd2luc30sIGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICByZXNvbHZlKGRhdGEpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1jYXRjaChlKXtcclxuICAgICAgICAgICAgcmVqZWN0KGUpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5kcmF3TXVsdGlwbGVPYmo9ZnVuY3Rpb24oKXtcclxuICAgIHZhciBudW1PZkVkZ2UgPSAwO1xyXG4gICAgdmFyIG51bU9mTm9kZSA9IDA7XHJcbiAgICB2YXIgYXJyPXRoaXMuc2VsZWN0ZWRPYmplY3RzO1xyXG4gICAgaWYoYXJyPT1udWxsKSByZXR1cm47XHJcbiAgICBhcnIuZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICBpZiAoZWxlbWVudFsnJHNvdXJjZUlkJ10pIG51bU9mRWRnZSsrXHJcbiAgICAgICAgZWxzZSBudW1PZk5vZGUrK1xyXG4gICAgfSk7XHJcbiAgICB2YXIgdGV4dERpdj0kKFwiPGxhYmVsIHN0eWxlPSdkaXNwbGF5OmJsb2NrO21hcmdpbi10b3A6MTBweCc+PC9sYWJlbD5cIilcclxuICAgIHRleHREaXYudGV4dChudW1PZk5vZGUrIFwiIG5vZGVcIisoKG51bU9mTm9kZTw9MSk/XCJcIjpcInNcIikrXCIsIFwiK251bU9mRWRnZStcIiByZWxhdGlvbnNoaXBcIisoKG51bU9mRWRnZTw9MSk/XCJcIjpcInNcIikpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQodGV4dERpdilcclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5kcmF3U3RhdGljSW5mbz1mdW5jdGlvbihwYXJlbnQsanNvbkluZm8scGFkZGluZ1RvcCxmb250U2l6ZSl7XHJcbiAgICBmb3IodmFyIGluZCBpbiBqc29uSW5mbyl7XHJcbiAgICAgICAgdmFyIGtleURpdj0gJChcIjxsYWJlbCBzdHlsZT0nZGlzcGxheTpibG9jayc+PGRpdiBjbGFzcz0ndzMtZGFyay1ncmF5JyBzdHlsZT0nYmFja2dyb3VuZC1jb2xvcjojZjZmNmY2O2Rpc3BsYXk6aW5saW5lO3BhZGRpbmc6LjFlbSAuM2VtIC4xZW0gLjNlbTttYXJnaW4tcmlnaHQ6LjNlbTtmb250LXNpemU6MTBweCc+XCIraW5kK1wiPC9kaXY+PC9sYWJlbD5cIilcclxuICAgICAgICBwYXJlbnQuYXBwZW5kKGtleURpdilcclxuICAgICAgICBrZXlEaXYuY3NzKFwicGFkZGluZy10b3BcIixwYWRkaW5nVG9wKVxyXG5cclxuICAgICAgICB2YXIgY29udGVudERPTT0kKFwiPGxhYmVsPjwvbGFiZWw+XCIpXHJcbiAgICAgICAgaWYodHlwZW9mKGpzb25JbmZvW2luZF0pPT09XCJvYmplY3RcIikge1xyXG4gICAgICAgICAgICBjb250ZW50RE9NLmNzcyhcImRpc3BsYXlcIixcImJsb2NrXCIpXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwicGFkZGluZy1sZWZ0XCIsXCIxZW1cIilcclxuICAgICAgICAgICAgdGhpcy5kcmF3U3RhdGljSW5mbyhjb250ZW50RE9NLGpzb25JbmZvW2luZF0sXCIuNWVtXCIsZm9udFNpemUpXHJcbiAgICAgICAgfWVsc2Uge1xyXG4gICAgICAgICAgICBjb250ZW50RE9NLmNzcyhcInBhZGRpbmctdG9wXCIsXCIuMmVtXCIpXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00udGV4dChqc29uSW5mb1tpbmRdKVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb250ZW50RE9NLmNzcyh7XCJmb250U2l6ZVwiOmZvbnRTaXplLFwiY29sb3JcIjpcImJsYWNrXCJ9KVxyXG4gICAgICAgIGtleURpdi5hcHBlbmQoY29udGVudERPTSlcclxuICAgIH1cclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS5kcmF3RWRpdGFibGU9ZnVuY3Rpb24ocGFyZW50LGpzb25JbmZvLG9yaWdpbkVsZW1lbnRJbmZvLHBhdGhBcnIsaXNOZXdUd2luKXtcclxuICAgIGlmKGpzb25JbmZvPT1udWxsKSByZXR1cm47XHJcbiAgICBmb3IodmFyIGluZCBpbiBqc29uSW5mbyl7XHJcbiAgICAgICAgdmFyIGtleURpdj0gJChcIjxsYWJlbCBzdHlsZT0nZGlzcGxheTpibG9jayc+PGRpdiBzdHlsZT0nZGlzcGxheTppbmxpbmU7cGFkZGluZzouMWVtIC4zZW0gLjFlbSAuM2VtOyBtYXJnaW4tcmlnaHQ6NXB4Jz5cIitpbmQrXCI8L2Rpdj48L2xhYmVsPlwiKVxyXG4gICAgICAgIGlmKGlzTmV3VHdpbil7XHJcbiAgICAgICAgICAgIGlmKGluZD09XCIkZHRJZFwiKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnQucHJlcGVuZChrZXlEaXYpXHJcbiAgICAgICAgICAgICAgICBrZXlEaXYuYXR0cignaWQnLCdORVdUV0lOX0lETGFiZWwnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHBhcmVudC5hcHBlbmQoa2V5RGl2KVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBwYXJlbnQuYXBwZW5kKGtleURpdilcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAga2V5RGl2LmNzcyhcInBhZGRpbmctdG9wXCIsXCIuM2VtXCIpIFxyXG5cclxuICAgICAgICB2YXIgY29udGVudERPTT0kKFwiPGxhYmVsIHN0eWxlPSdwYWRkaW5nLXRvcDouMmVtJz48L2xhYmVsPlwiKVxyXG4gICAgICAgIHZhciBuZXdQYXRoPXBhdGhBcnIuY29uY2F0KFtpbmRdKVxyXG4gICAgICAgIGlmKEFycmF5LmlzQXJyYXkoanNvbkluZm9baW5kXSkpe1xyXG4gICAgICAgICAgICBrZXlEaXYuY2hpbGRyZW4oXCI6Zmlyc3RcIikuYWRkQ2xhc3MoXCJ3My1saW1lXCIpXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd0Ryb3Bkb3duT3B0aW9uKGNvbnRlbnRET00sbmV3UGF0aCxqc29uSW5mb1tpbmRdLGlzTmV3VHdpbixvcmlnaW5FbGVtZW50SW5mbylcclxuICAgICAgICB9ZWxzZSBpZih0eXBlb2YoanNvbkluZm9baW5kXSk9PT1cIm9iamVjdFwiKSB7XHJcbiAgICAgICAgICAgIGtleURpdi5jaGlsZHJlbihcIjpmaXJzdFwiKS5jc3MoXCJmb250LXdlaWdodFwiLFwiYm9sZFwiKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLmNzcyhcImRpc3BsYXlcIixcImJsb2NrXCIpXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwicGFkZGluZy1sZWZ0XCIsXCIxZW1cIilcclxuICAgICAgICAgICAgdGhpcy5kcmF3RWRpdGFibGUoY29udGVudERPTSxqc29uSW5mb1tpbmRdLG9yaWdpbkVsZW1lbnRJbmZvLG5ld1BhdGgsaXNOZXdUd2luKVxyXG4gICAgICAgIH1lbHNlIHtcclxuICAgICAgICAgICAga2V5RGl2LmNoaWxkcmVuKFwiOmZpcnN0XCIpLmFkZENsYXNzKFwidzMtbGltZVwiKVxyXG4gICAgICAgICAgICB2YXIgYUlucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwicGFkZGluZzoycHg7d2lkdGg6NTAlO291dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZVwiIHBsYWNlaG9sZGVyPVwidHlwZTogJytqc29uSW5mb1tpbmRdKydcIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dCB3My1ib3JkZXJcIik7ICBcclxuICAgICAgICAgICAgY29udGVudERPTS5hcHBlbmQoYUlucHV0KVxyXG4gICAgICAgICAgICB2YXIgdmFsPXRoaXMuc2VhcmNoVmFsdWUob3JpZ2luRWxlbWVudEluZm8sbmV3UGF0aClcclxuICAgICAgICAgICAgaWYodmFsIT1udWxsKSBhSW5wdXQudmFsKHZhbClcclxuICAgICAgICAgICAgYUlucHV0LmRhdGEoXCJwYXRoXCIsIG5ld1BhdGgpXHJcbiAgICAgICAgICAgIGFJbnB1dC5kYXRhKFwiZGF0YVR5cGVcIiwganNvbkluZm9baW5kXSlcclxuICAgICAgICAgICAgYUlucHV0LmNoYW5nZSgoZSk9PntcclxuICAgICAgICAgICAgICAgIHRoaXMuZWRpdERUUHJvcGVydHkob3JpZ2luRWxlbWVudEluZm8sJChlLnRhcmdldCkuZGF0YShcInBhdGhcIiksJChlLnRhcmdldCkudmFsKCksJChlLnRhcmdldCkuZGF0YShcImRhdGFUeXBlXCIpLGlzTmV3VHdpbilcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICAgICAga2V5RGl2LmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgfVxyXG59XHJcblxyXG5pbmZvUGFuZWwucHJvdG90eXBlLmRyYXdEcm9wZG93bk9wdGlvbj1mdW5jdGlvbihjb250ZW50RE9NLG5ld1BhdGgsdmFsdWVBcnIsaXNOZXdUd2luLG9yaWdpbkVsZW1lbnRJbmZvKXtcclxuICAgIHZhciBhU2VsZWN0TWVudT1uZXcgc2ltcGxlU2VsZWN0TWVudShcIlwiLHtidXR0b25DU1M6e1wicGFkZGluZ1wiOlwiNHB4IDE2cHhcIn19KVxyXG4gICAgY29udGVudERPTS5hcHBlbmQoYVNlbGVjdE1lbnUuRE9NKVxyXG4gICAgYVNlbGVjdE1lbnUuRE9NLmRhdGEoXCJwYXRoXCIsIG5ld1BhdGgpXHJcbiAgICB2YWx1ZUFyci5mb3JFYWNoKChvbmVPcHRpb24pPT57XHJcbiAgICAgICAgdmFyIHN0ciA9b25lT3B0aW9uW1wiZGlzcGxheU5hbWVcIl0gIHx8IG9uZU9wdGlvbltcImVudW1WYWx1ZVwiXSBcclxuICAgICAgICBhU2VsZWN0TWVudS5hZGRPcHRpb24oc3RyKVxyXG4gICAgfSlcclxuICAgIGFTZWxlY3RNZW51LmNhbGxCYWNrX2NsaWNrT3B0aW9uPShvcHRpb25UZXh0LG9wdGlvblZhbHVlLHJlYWxNb3VzZUNsaWNrKT0+e1xyXG4gICAgICAgIGFTZWxlY3RNZW51LmNoYW5nZU5hbWUob3B0aW9uVGV4dClcclxuICAgICAgICBpZihyZWFsTW91c2VDbGljaykgdGhpcy5lZGl0RFRQcm9wZXJ0eShvcmlnaW5FbGVtZW50SW5mbyxhU2VsZWN0TWVudS5ET00uZGF0YShcInBhdGhcIiksb3B0aW9uVmFsdWUsXCJzdHJpbmdcIixpc05ld1R3aW4pXHJcbiAgICB9XHJcbiAgICB2YXIgdmFsPXRoaXMuc2VhcmNoVmFsdWUob3JpZ2luRWxlbWVudEluZm8sbmV3UGF0aClcclxuICAgIGlmKHZhbCE9bnVsbCl7XHJcbiAgICAgICAgYVNlbGVjdE1lbnUudHJpZ2dlck9wdGlvblZhbHVlKHZhbClcclxuICAgIH0gICAgXHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuZWRpdERUUHJvcGVydHk9ZnVuY3Rpb24ob3JpZ2luRWxlbWVudEluZm8scGF0aCxuZXdWYWwsZGF0YVR5cGUsaXNOZXdUd2luKXtcclxuICAgIGlmIChbXCJkb3VibGVcIiwgXCJmbG9hdFwiLCBcImludGVnZXJcIiwgXCJsb25nXCJdLmluY2x1ZGVzKGRhdGFUeXBlKSkgbmV3VmFsID0gTnVtYmVyKG5ld1ZhbClcclxuICAgIGlmIChkYXRhVHlwZSA9PSBcImJvb2xlYW5cIikge1xyXG4gICAgICAgIGlmIChuZXdWYWwgPT0gXCJ0cnVlXCIpIG5ld1ZhbCA9IHRydWVcclxuICAgICAgICBlbHNlIG5ld1ZhbCA9IGZhbHNlXHJcbiAgICB9XHJcblxyXG4gICAgLy97IFwib3BcIjogXCJhZGRcIiwgXCJwYXRoXCI6IFwiL3hcIiwgXCJ2YWx1ZVwiOiAzMCB9XHJcbiAgICBpZihpc05ld1R3aW4pe1xyXG4gICAgICAgIHRoaXMudXBkYXRlT3JpZ2luT2JqZWN0VmFsdWUob3JpZ2luRWxlbWVudEluZm8scGF0aCxuZXdWYWwpXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgaWYocGF0aC5sZW5ndGg9PTEpe1xyXG4gICAgICAgIHZhciBzdHI9XCJcIlxyXG4gICAgICAgIHBhdGguZm9yRWFjaChzZWdtZW50PT57c3RyKz1cIi9cIitzZWdtZW50fSlcclxuICAgICAgICB2YXIganNvblBhdGNoPVsgeyBcIm9wXCI6IFwiYWRkXCIsIFwicGF0aFwiOiBzdHIsIFwidmFsdWVcIjogbmV3VmFsfSBdXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICAvL2l0IGlzIGEgcHJvcGVydHkgaW5zaWRlIGEgb2JqZWN0IHR5cGUgb2Ygcm9vdCBwcm9wZXJ0eSx1cGRhdGUgdGhlIHdob2xlIHJvb3QgcHJvcGVydHlcclxuICAgICAgICB2YXIgcm9vdFByb3BlcnR5PXBhdGhbMF1cclxuICAgICAgICB2YXIgcGF0Y2hWYWx1ZT0gb3JpZ2luRWxlbWVudEluZm9bcm9vdFByb3BlcnR5XVxyXG4gICAgICAgIGlmKHBhdGNoVmFsdWU9PW51bGwpIHBhdGNoVmFsdWU9e31cclxuICAgICAgICBlbHNlIHBhdGNoVmFsdWU9SlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShwYXRjaFZhbHVlKSkgLy9tYWtlIGEgY29weVxyXG4gICAgICAgIHRoaXMudXBkYXRlT3JpZ2luT2JqZWN0VmFsdWUocGF0Y2hWYWx1ZSxwYXRoLnNsaWNlKDEpLG5ld1ZhbClcclxuICAgICAgICBcclxuICAgICAgICB2YXIganNvblBhdGNoPVsgeyBcIm9wXCI6IFwiYWRkXCIsIFwicGF0aFwiOiBcIi9cIityb290UHJvcGVydHksIFwidmFsdWVcIjogcGF0Y2hWYWx1ZX0gXVxyXG4gICAgfVxyXG5cclxuICAgIGlmKG9yaWdpbkVsZW1lbnRJbmZvW1wiJGR0SWRcIl0peyAvL2VkaXQgYSBub2RlIHByb3BlcnR5XHJcbiAgICAgICAgdmFyIHR3aW5JRCA9IG9yaWdpbkVsZW1lbnRJbmZvW1wiJGR0SWRcIl1cclxuICAgICAgICB2YXIgcGF5TG9hZD17XCJqc29uUGF0Y2hcIjpKU09OLnN0cmluZ2lmeShqc29uUGF0Y2gpLFwidHdpbklEXCI6dHdpbklEfVxyXG4gICAgfWVsc2UgaWYob3JpZ2luRWxlbWVudEluZm9bXCIkcmVsYXRpb25zaGlwSWRcIl0peyAvL2VkaXQgYSByZWxhdGlvbnNoaXAgcHJvcGVydHlcclxuICAgICAgICB2YXIgdHdpbklEID0gb3JpZ2luRWxlbWVudEluZm9bXCIkc291cmNlSWRcIl1cclxuICAgICAgICB2YXIgcmVsYXRpb25zaGlwSUQgPSBvcmlnaW5FbGVtZW50SW5mb1tcIiRyZWxhdGlvbnNoaXBJZFwiXVxyXG4gICAgICAgIHZhciBwYXlMb2FkPXtcImpzb25QYXRjaFwiOkpTT04uc3RyaW5naWZ5KGpzb25QYXRjaCksXCJ0d2luSURcIjp0d2luSUQsXCJyZWxhdGlvbnNoaXBJRFwiOnJlbGF0aW9uc2hpcElEfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICAkLnBvc3QoXCJlZGl0QURUL2NoYW5nZUF0dHJpYnV0ZVwiLHBheUxvYWRcclxuICAgICAgICAsICAoZGF0YSk9PiB7XHJcbiAgICAgICAgICAgIGlmKGRhdGEhPVwiXCIpIHtcclxuICAgICAgICAgICAgICAgIC8vbm90IHN1Y2Nlc3NmdWwgZWRpdGluZ1xyXG4gICAgICAgICAgICAgICAgYWxlcnQoZGF0YSlcclxuICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICAvL3N1Y2Nlc3NmdWwgZWRpdGluZywgdXBkYXRlIHRoZSBub2RlIG9yaWdpbmFsIGluZm9cclxuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlT3JpZ2luT2JqZWN0VmFsdWUob3JpZ2luRWxlbWVudEluZm8scGF0aCxuZXdWYWwpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxufVxyXG5cclxuaW5mb1BhbmVsLnByb3RvdHlwZS51cGRhdGVPcmlnaW5PYmplY3RWYWx1ZT1mdW5jdGlvbihub2RlSW5mbyxwYXRoQXJyLG5ld1ZhbCl7XHJcbiAgICBpZihwYXRoQXJyLmxlbmd0aD09MCkgcmV0dXJuO1xyXG4gICAgdmFyIHRoZUpzb249bm9kZUluZm9cclxuICAgIGZvcih2YXIgaT0wO2k8cGF0aEFyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIga2V5PXBhdGhBcnJbaV1cclxuXHJcbiAgICAgICAgaWYoaT09cGF0aEFyci5sZW5ndGgtMSl7XHJcbiAgICAgICAgICAgIHRoZUpzb25ba2V5XT1uZXdWYWxcclxuICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYodGhlSnNvbltrZXldPT1udWxsKSB0aGVKc29uW2tleV09e31cclxuICAgICAgICB0aGVKc29uPXRoZUpzb25ba2V5XVxyXG4gICAgfVxyXG4gICAgcmV0dXJuXHJcbn1cclxuXHJcbmluZm9QYW5lbC5wcm90b3R5cGUuc2VhcmNoVmFsdWU9ZnVuY3Rpb24ob3JpZ2luRWxlbWVudEluZm8scGF0aEFycil7XHJcbiAgICBpZihwYXRoQXJyLmxlbmd0aD09MCkgcmV0dXJuIG51bGw7XHJcbiAgICB2YXIgdGhlSnNvbj1vcmlnaW5FbGVtZW50SW5mb1xyXG4gICAgZm9yKHZhciBpPTA7aTxwYXRoQXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHZhciBrZXk9cGF0aEFycltpXVxyXG4gICAgICAgIHRoZUpzb249dGhlSnNvbltrZXldXHJcbiAgICAgICAgaWYodGhlSnNvbj09bnVsbCkgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdGhlSnNvbiAvL2l0IHNob3VsZCBiZSB0aGUgZmluYWwgdmFsdWVcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgaW5mb1BhbmVsKCk7IiwiJCgnZG9jdW1lbnQnKS5yZWFkeShmdW5jdGlvbigpe1xyXG4gICAgY29uc3QgbWFpblVJPXJlcXVpcmUoXCIuL21haW5VSS5qc1wiKSAgICBcclxufSk7IiwiY29uc3QgYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cgPSByZXF1aXJlKFwiLi9hZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZ1wiKVxyXG5jb25zdCBtb2RlbE1hbmFnZXJEaWFsb2cgPSByZXF1aXJlKFwiLi9tb2RlbE1hbmFnZXJEaWFsb2dcIilcclxuY29uc3QgZWRpdExheW91dERpYWxvZz0gcmVxdWlyZShcIi4vZWRpdExheW91dERpYWxvZ1wiKVxyXG5jb25zdCBzaW1wbGVTZWxlY3RNZW51PSByZXF1aXJlKFwiLi9zaW1wbGVTZWxlY3RNZW51XCIpXHJcbmNvbnN0IGdsb2JhbENhY2hlID0gcmVxdWlyZShcIi4vZ2xvYmFsQ2FjaGVcIilcclxuXHJcbmZ1bmN0aW9uIG1haW5Ub29sYmFyKCkge1xyXG59XHJcblxyXG5tYWluVG9vbGJhci5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgJChcIiNtYWluVG9vbEJhclwiKS5hZGRDbGFzcyhcInczLWJhciB3My1yZWRcIilcclxuICAgICQoXCIjbWFpblRvb2xCYXJcIikuY3NzKHtcInotaW5kZXhcIjoxMDAsXCJvdmVyZmxvd1wiOlwidmlzaWJsZVwifSlcclxuXHJcbiAgICB0aGlzLnN3aXRjaEFEVEluc3RhbmNlQnRuPSQoJzxhIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uXCIgaHJlZj1cIiNcIj5Tb3VyY2U8L2E+JylcclxuICAgIHRoaXMubW9kZWxJT0J0bj0kKCc8YSBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvblwiIGhyZWY9XCIjXCI+TW9kZWxzPC9hPicpXHJcbiAgICB0aGlzLnNob3dGb3JnZVZpZXdCdG49JCgnPGEgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtaG92ZXItbm9uZSB3My10ZXh0LWxpZ2h0LWdyZXkgdzMtaG92ZXItdGV4dC1saWdodC1ncmV5XCIgc3R5bGU9XCJvcGFjaXR5Oi4zNVwiIGhyZWY9XCIjXCI+Rm9yZ2VWaWV3PC9hPicpXHJcbiAgICB0aGlzLnNob3dHSVNWaWV3QnRuPSQoJzxhIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWhvdmVyLW5vbmUgdzMtdGV4dC1saWdodC1ncmV5IHczLWhvdmVyLXRleHQtbGlnaHQtZ3JleVwiIHN0eWxlPVwib3BhY2l0eTouMzVcIiBocmVmPVwiI1wiPkdJU1ZpZXc8L2E+JylcclxuICAgIHRoaXMuZWRpdExheW91dEJ0bj0kKCc8YSBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvblwiIGhyZWY9XCIjXCI+PGkgY2xhc3M9XCJmYSBmYS1lZGl0XCI+PC9pPjwvYT4nKVxyXG5cclxuICAgIHRoaXMuZmxvYXRJbmZvQnRuPSQoJzxhIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWFtYmVyXCIgc3R5bGU9XCJoZWlnaHQ6MTAwJTtmb250LXNpemU6ODAlXCIgaHJlZj1cIiNcIj48c3BhbiBjbGFzcz1cImZhLXN0YWNrIGZhLXhzXCI+PGkgY2xhc3M9XCJmYXMgZmEtY2lyY2xlIGZhLXN0YWNrLTJ4IGZhLWludmVyc2VcIj48L2k+PGkgY2xhc3M9XCJmYXMgZmEtaW5mbyBmYS1zdGFjay0xeCB3My10ZXh0LWFtYmVyXCI+PC9pPjwvc3Bhbj48L2E+JylcclxuXHJcbiAgICB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yPW5ldyBzaW1wbGVTZWxlY3RNZW51KFwiTGF5b3V0XCIpXHJcblxyXG4gICAgJChcIiNtYWluVG9vbEJhclwiKS5lbXB0eSgpXHJcbiAgICAkKFwiI21haW5Ub29sQmFyXCIpLmFwcGVuZCh0aGlzLnN3aXRjaEFEVEluc3RhbmNlQnRuLHRoaXMubW9kZWxJT0J0bix0aGlzLnNob3dGb3JnZVZpZXdCdG4sdGhpcy5zaG93R0lTVmlld0J0blxyXG4gICAgICAgICx0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLkRPTSx0aGlzLmVkaXRMYXlvdXRCdG4sdGhpcy5mbG9hdEluZm9CdG4pXHJcblxyXG4gICAgdGhpcy5zd2l0Y2hBRFRJbnN0YW5jZUJ0bi5vbihcImNsaWNrXCIsKCk9PnsgYWR0SW5zdGFuY2VTZWxlY3Rpb25EaWFsb2cucG9wdXAoKSB9KVxyXG4gICAgdGhpcy5tb2RlbElPQnRuLm9uKFwiY2xpY2tcIiwoKT0+eyBtb2RlbE1hbmFnZXJEaWFsb2cucG9wdXAoKSB9KVxyXG4gICAgdGhpcy5lZGl0TGF5b3V0QnRuLm9uKFwiY2xpY2tcIiwoKT0+eyBlZGl0TGF5b3V0RGlhbG9nLnBvcHVwKCkgfSlcclxuXHJcbiAgICB0aGlzLmZsb2F0SW5mb0J0bi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICBpZihnbG9iYWxDYWNoZS5zaG93RmxvYXRJbmZvUGFuZWwpIGdsb2JhbENhY2hlLnNob3dGbG9hdEluZm9QYW5lbD1mYWxzZVxyXG4gICAgICAgIGVsc2UgZ2xvYmFsQ2FjaGUuc2hvd0Zsb2F0SW5mb1BhbmVsPXRydWVcclxuICAgICAgICBpZighZ2xvYmFsQ2FjaGUuc2hvd0Zsb2F0SW5mb1BhbmVsKXtcclxuICAgICAgICAgICAgdGhpcy5mbG9hdEluZm9CdG4ucmVtb3ZlQ2xhc3MoXCJ3My1hbWJlclwiKVxyXG4gICAgICAgICAgICB0aGlzLmZsb2F0SW5mb0J0bi5odG1sKCc8c3BhbiBjbGFzcz1cImZhLXN0YWNrIGZhLXhzXCI+PGkgY2xhc3M9XCJmYXMgZmEtYmFuIGZhLXN0YWNrLTJ4IGZhLWludmVyc2VcIj48L2k+PGkgY2xhc3M9XCJmYXMgZmEtaW5mbyBmYS1zdGFjay0xeCBmYS1pbnZlcnNlXCI+PC9pPjwvc3Bhbj4nKVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICB0aGlzLmZsb2F0SW5mb0J0bi5hZGRDbGFzcyhcInczLWFtYmVyXCIpXHJcbiAgICAgICAgICAgIHRoaXMuZmxvYXRJbmZvQnRuLmh0bWwoJzxzcGFuIGNsYXNzPVwiZmEtc3RhY2sgZmEteHNcIj48aSBjbGFzcz1cImZhcyBmYS1jaXJjbGUgZmEtc3RhY2stMnggZmEtaW52ZXJzZVwiPjwvaT48aSBjbGFzcz1cImZhcyBmYS1pbmZvIGZhLXN0YWNrLTF4IHczLXRleHQtYW1iZXJcIj48L2k+PC9zcGFuPicpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuXHJcblxyXG4gICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jYWxsQmFja19jbGlja09wdGlvbj0ob3B0aW9uVGV4dCxvcHRpb25WYWx1ZSk9PntcclxuICAgICAgICBnbG9iYWxDYWNoZS5jdXJyZW50TGF5b3V0TmFtZT1vcHRpb25WYWx1ZVxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImxheW91dENoYW5nZVwifSlcclxuICAgICAgICBpZihvcHRpb25WYWx1ZT09XCJbTkFdXCIpIHRoaXMuc3dpdGNoTGF5b3V0U2VsZWN0b3IuY2hhbmdlTmFtZShcIkxheW91dFwiLFwiXCIpXHJcbiAgICAgICAgZWxzZSB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmNoYW5nZU5hbWUoXCJMYXlvdXQ6XCIsb3B0aW9uVGV4dClcclxuICAgIH1cclxufVxyXG5cclxubWFpblRvb2xiYXIucHJvdG90eXBlLnVwZGF0ZUxheW91dFNlbGVjdG9yID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGN1clNlbGVjdD10aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmN1clNlbGVjdFZhbFxyXG4gICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jbGVhck9wdGlvbnMoKVxyXG4gICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5hZGRPcHRpb24oJ1tObyBMYXlvdXQgU3BlY2lmaWVkXScsJ1tOQV0nKVxyXG5cclxuICAgIGZvciAodmFyIGluZCBpbiBnbG9iYWxDYWNoZS5sYXlvdXRKU09OKSB7XHJcbiAgICAgICAgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5hZGRPcHRpb24oaW5kKVxyXG4gICAgfVxyXG5cclxuICAgIGlmKGN1clNlbGVjdCE9bnVsbCAmJiB0aGlzLnN3aXRjaExheW91dFNlbGVjdG9yLmZpbmRPcHRpb24oY3VyU2VsZWN0KT09bnVsbCkgdGhpcy5zd2l0Y2hMYXlvdXRTZWxlY3Rvci5jaGFuZ2VOYW1lKFwiTGF5b3V0XCIsXCJcIilcclxufVxyXG5cclxubWFpblRvb2xiYXIucHJvdG90eXBlLnJ4TWVzc2FnZT1mdW5jdGlvbihtc2dQYXlsb2FkKXtcclxuICAgIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJsYXlvdXRzVXBkYXRlZFwiKSB7XHJcbiAgICAgICAgdGhpcy51cGRhdGVMYXlvdXRTZWxlY3RvcigpXHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwicG9wdXBMYXlvdXRFZGl0aW5nXCIpe1xyXG4gICAgICAgIGVkaXRMYXlvdXREaWFsb2cucG9wdXAoKVxyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBtYWluVG9vbGJhcigpOyIsIid1c2Ugc3RyaWN0JztcclxuY29uc3QgdG9wb2xvZ3lET009cmVxdWlyZShcIi4vdG9wb2xvZ3lET00uanNcIilcclxuY29uc3QgdHdpbnNUcmVlPXJlcXVpcmUoXCIuL3R3aW5zVHJlZVwiKVxyXG5jb25zdCBhZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZyA9IHJlcXVpcmUoXCIuL2FkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nXCIpXHJcbmNvbnN0IG1vZGVsTWFuYWdlckRpYWxvZyA9IHJlcXVpcmUoXCIuL21vZGVsTWFuYWdlckRpYWxvZ1wiKVxyXG5jb25zdCBtb2RlbEVkaXRvckRpYWxvZyA9IHJlcXVpcmUoXCIuL21vZGVsRWRpdG9yRGlhbG9nXCIpXHJcbmNvbnN0IGVkaXRMYXlvdXREaWFsb2cgPSByZXF1aXJlKFwiLi9lZGl0TGF5b3V0RGlhbG9nXCIpXHJcbmNvbnN0IG1haW5Ub29sYmFyID0gcmVxdWlyZShcIi4vbWFpblRvb2xiYXJcIilcclxuY29uc3QgaW5mb1BhbmVsPSByZXF1aXJlKFwiLi9pbmZvUGFuZWxcIilcclxuY29uc3QgZmxvYXRJbmZvV2luZG93PXJlcXVpcmUoXCIuL2Zsb2F0SW5mb1dpbmRvd1wiKVxyXG5cclxuZnVuY3Rpb24gbWFpblVJKCkge1xyXG4gICAgdGhpcy5pbml0VUlMYXlvdXQoKVxyXG5cclxuICAgIHRoaXMudHdpbnNUcmVlPSBuZXcgdHdpbnNUcmVlKCQoXCIjdHJlZUhvbGRlclwiKSwkKFwiI3RyZWVTZWFyY2hcIikpXHJcbiAgICBcclxuICAgIHRoaXMubWFpblRvb2xiYXI9bWFpblRvb2xiYXJcclxuICAgIG1haW5Ub29sYmFyLnJlbmRlcigpXHJcbiAgICB0aGlzLnRvcG9sb2d5SW5zdGFuY2U9bmV3IHRvcG9sb2d5RE9NKCQoJyNjYW52YXMnKSlcclxuICAgIHRoaXMudG9wb2xvZ3lJbnN0YW5jZS5pbml0KClcclxuICAgIHRoaXMuaW5mb1BhbmVsPSBpbmZvUGFuZWxcclxuXHJcbiAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoKSAvL2luaXRpYWxpemUgYWxsIHVpIGNvbXBvbmVudHMgdG8gaGF2ZSB0aGUgYnJvYWRjYXN0IGNhcGFiaWxpdHlcclxuICAgIHRoaXMucHJlcGFyZURhdGEoKVxyXG59XHJcblxyXG5tYWluVUkucHJvdG90eXBlLnByZXBhcmVEYXRhPWFzeW5jIGZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgcHJvbWlzZUFycj1bXHJcbiAgICAgICAgbW9kZWxNYW5hZ2VyRGlhbG9nLnByZXBhcmF0aW9uRnVuYygpLFxyXG4gICAgICAgIGFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLnByZXBhcmF0aW9uRnVuYygpXHJcbiAgICBdXHJcbiAgICBhd2FpdCBQcm9taXNlLmFsbFNldHRsZWQocHJvbWlzZUFycik7XHJcbiAgICBhZHRJbnN0YW5jZVNlbGVjdGlvbkRpYWxvZy5wb3B1cCgpXHJcbn1cclxuXHJcblxyXG5tYWluVUkucHJvdG90eXBlLmFzc2lnbkJyb2FkY2FzdE1lc3NhZ2U9ZnVuY3Rpb24odWlDb21wb25lbnQpe1xyXG4gICAgdWlDb21wb25lbnQuYnJvYWRjYXN0TWVzc2FnZT0obXNnT2JqKT0+e3RoaXMuYnJvYWRjYXN0TWVzc2FnZSh1aUNvbXBvbmVudCxtc2dPYmopfVxyXG59XHJcblxyXG5tYWluVUkucHJvdG90eXBlLmJyb2FkY2FzdE1lc3NhZ2U9ZnVuY3Rpb24oc291cmNlLG1zZ1BheWxvYWQpe1xyXG4gICAgdmFyIGNvbXBvbmVudHNBcnI9W3RoaXMudHdpbnNUcmVlLGFkdEluc3RhbmNlU2VsZWN0aW9uRGlhbG9nLG1vZGVsTWFuYWdlckRpYWxvZyxtb2RlbEVkaXRvckRpYWxvZyxlZGl0TGF5b3V0RGlhbG9nLFxyXG4gICAgICAgICB0aGlzLm1haW5Ub29sYmFyLHRoaXMudG9wb2xvZ3lJbnN0YW5jZSx0aGlzLmluZm9QYW5lbCxmbG9hdEluZm9XaW5kb3ddXHJcblxyXG4gICAgaWYoc291cmNlPT1udWxsKXtcclxuICAgICAgICBmb3IodmFyIGk9MDtpPGNvbXBvbmVudHNBcnIubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgIHZhciB0aGVDb21wb25lbnQ9Y29tcG9uZW50c0FycltpXVxyXG4gICAgICAgICAgICB0aGlzLmFzc2lnbkJyb2FkY2FzdE1lc3NhZ2UodGhlQ29tcG9uZW50KVxyXG4gICAgICAgIH1cclxuICAgIH1lbHNle1xyXG4gICAgICAgIGZvcih2YXIgaT0wO2k8Y29tcG9uZW50c0Fyci5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgdmFyIHRoZUNvbXBvbmVudD1jb21wb25lbnRzQXJyW2ldXHJcbiAgICAgICAgICAgIGlmKHRoZUNvbXBvbmVudC5yeE1lc3NhZ2UgJiYgdGhlQ29tcG9uZW50IT1zb3VyY2UpIHRoZUNvbXBvbmVudC5yeE1lc3NhZ2UobXNnUGF5bG9hZClcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbm1haW5VSS5wcm90b3R5cGUuaW5pdFVJTGF5b3V0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIG15TGF5b3V0ID0gJCgnYm9keScpLmxheW91dCh7XHJcbiAgICAgICAgLy9cdHJlZmVyZW5jZSBvbmx5IC0gdGhlc2Ugb3B0aW9ucyBhcmUgTk9UIHJlcXVpcmVkIGJlY2F1c2UgJ3RydWUnIGlzIHRoZSBkZWZhdWx0XHJcbiAgICAgICAgY2xvc2FibGU6IHRydWVcdC8vIHBhbmUgY2FuIG9wZW4gJiBjbG9zZVxyXG4gICAgICAgICwgcmVzaXphYmxlOiB0cnVlXHQvLyB3aGVuIG9wZW4sIHBhbmUgY2FuIGJlIHJlc2l6ZWQgXHJcbiAgICAgICAgLCBzbGlkYWJsZTogdHJ1ZVx0Ly8gd2hlbiBjbG9zZWQsIHBhbmUgY2FuICdzbGlkZScgb3BlbiBvdmVyIG90aGVyIHBhbmVzIC0gY2xvc2VzIG9uIG1vdXNlLW91dFxyXG4gICAgICAgICwgbGl2ZVBhbmVSZXNpemluZzogdHJ1ZVxyXG5cclxuICAgICAgICAvL1x0c29tZSByZXNpemluZy90b2dnbGluZyBzZXR0aW5nc1xyXG4gICAgICAgICwgbm9ydGhfX3NsaWRhYmxlOiBmYWxzZVx0Ly8gT1ZFUlJJREUgdGhlIHBhbmUtZGVmYXVsdCBvZiAnc2xpZGFibGU9dHJ1ZSdcclxuICAgICAgICAvLywgbm9ydGhfX3RvZ2dsZXJMZW5ndGhfY2xvc2VkOiAnMTAwJSdcdC8vIHRvZ2dsZS1idXR0b24gaXMgZnVsbC13aWR0aCBvZiByZXNpemVyLWJhclxyXG4gICAgICAgICwgbm9ydGhfX3NwYWNpbmdfY2xvc2VkOiA2XHRcdC8vIGJpZyByZXNpemVyLWJhciB3aGVuIG9wZW4gKHplcm8gaGVpZ2h0KVxyXG4gICAgICAgICwgbm9ydGhfX3NwYWNpbmdfb3BlbjowXHJcbiAgICAgICAgLCBub3J0aF9fcmVzaXphYmxlOiBmYWxzZVx0Ly8gT1ZFUlJJREUgdGhlIHBhbmUtZGVmYXVsdCBvZiAncmVzaXphYmxlPXRydWUnXHJcbiAgICAgICAgLCBub3J0aF9fY2xvc2FibGU6IGZhbHNlXHJcbiAgICAgICAgLCB3ZXN0X19jbG9zYWJsZTogZmFsc2VcclxuICAgICAgICAsIGVhc3RfX2Nsb3NhYmxlOiBmYWxzZVxyXG4gICAgICAgIFxyXG5cclxuICAgICAgICAvL1x0c29tZSBwYW5lLXNpemUgc2V0dGluZ3NcclxuICAgICAgICAsIHdlc3RfX21pblNpemU6IDEwMFxyXG4gICAgICAgICwgZWFzdF9fc2l6ZTogMzAwXHJcbiAgICAgICAgLCBlYXN0X19taW5TaXplOiAyMDBcclxuICAgICAgICAsIGVhc3RfX21heFNpemU6IDAuNSAvLyA1MCUgb2YgbGF5b3V0IHdpZHRoXHJcbiAgICAgICAgLCBjZW50ZXJfX21pbldpZHRoOiAxMDBcclxuICAgICAgICAsZWFzdF9faW5pdENsb3NlZDpcdHRydWVcclxuICAgIH0pO1xyXG5cclxuXHJcbiAgICAvKlxyXG4gICAgICpcdERJU0FCTEUgVEVYVC1TRUxFQ1RJT04gV0hFTiBEUkFHR0lORyAob3IgZXZlbiBfdHJ5aW5nXyB0byBkcmFnISlcclxuICAgICAqXHR0aGlzIGZ1bmN0aW9uYWxpdHkgd2lsbCBiZSBpbmNsdWRlZCBpbiBSQzMwLjgwXHJcbiAgICAgKi9cclxuICAgICQubGF5b3V0LmRpc2FibGVUZXh0U2VsZWN0aW9uID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHZhciAkZCA9ICQoZG9jdW1lbnQpXHJcbiAgICAgICAgICAgICwgcyA9ICd0ZXh0U2VsZWN0aW9uRGlzYWJsZWQnXHJcbiAgICAgICAgICAgICwgeCA9ICd0ZXh0U2VsZWN0aW9uSW5pdGlhbGl6ZWQnXHJcbiAgICAgICAgICAgIDtcclxuICAgICAgICBpZiAoJC5mbi5kaXNhYmxlU2VsZWN0aW9uKSB7XHJcbiAgICAgICAgICAgIGlmICghJGQuZGF0YSh4KSkgLy8gZG9jdW1lbnQgaGFzbid0IGJlZW4gaW5pdGlhbGl6ZWQgeWV0XHJcbiAgICAgICAgICAgICAgICAkZC5vbignbW91c2V1cCcsICQubGF5b3V0LmVuYWJsZVRleHRTZWxlY3Rpb24pLmRhdGEoeCwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIGlmICghJGQuZGF0YShzKSlcclxuICAgICAgICAgICAgICAgICRkLmRpc2FibGVTZWxlY3Rpb24oKS5kYXRhKHMsIHRydWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvL2NvbnNvbGUubG9nKCckLmxheW91dC5kaXNhYmxlVGV4dFNlbGVjdGlvbicpO1xyXG4gICAgfTtcclxuICAgICQubGF5b3V0LmVuYWJsZVRleHRTZWxlY3Rpb24gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyICRkID0gJChkb2N1bWVudClcclxuICAgICAgICAgICAgLCBzID0gJ3RleHRTZWxlY3Rpb25EaXNhYmxlZCc7XHJcbiAgICAgICAgaWYgKCQuZm4uZW5hYmxlU2VsZWN0aW9uICYmICRkLmRhdGEocykpXHJcbiAgICAgICAgICAgICRkLmVuYWJsZVNlbGVjdGlvbigpLmRhdGEocywgZmFsc2UpO1xyXG4gICAgICAgIC8vY29uc29sZS5sb2coJyQubGF5b3V0LmVuYWJsZVRleHRTZWxlY3Rpb24nKTtcclxuICAgIH07XHJcbiAgICAkKFwiLnVpLWxheW91dC1yZXNpemVyLW5vcnRoXCIpLmhpZGUoKVxyXG4gICAgJChcIi51aS1sYXlvdXQtd2VzdFwiKS5jc3MoXCJib3JkZXItcmlnaHRcIixcInNvbGlkIDFweCBsaWdodEdyYXlcIilcclxuICAgICQoXCIudWktbGF5b3V0LXdlc3RcIikuYWRkQ2xhc3MoXCJ3My1jYXJkXCIpXHJcblxyXG59XHJcblxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgbWFpblVJKCk7IiwiLy9UaGlzIGlzIGEgc2luZ2xldG9uIGNsYXNzXHJcblxyXG5mdW5jdGlvbiBtb2RlbEFuYWx5emVyKCl7XHJcbiAgICB0aGlzLkRURExNb2RlbHM9e31cclxuICAgIHRoaXMucmVsYXRpb25zaGlwVHlwZXM9e31cclxufVxyXG5cclxubW9kZWxBbmFseXplci5wcm90b3R5cGUuY2xlYXJBbGxNb2RlbHM9ZnVuY3Rpb24oKXtcclxuICAgIGNvbnNvbGUubG9nKFwiY2xlYXIgYWxsIG1vZGVsIGluZm9cIilcclxuICAgIGZvcih2YXIgaWQgaW4gdGhpcy5EVERMTW9kZWxzKSBkZWxldGUgdGhpcy5EVERMTW9kZWxzW2lkXVxyXG59XHJcblxyXG5tb2RlbEFuYWx5emVyLnByb3RvdHlwZS5yZXNldEFsbE1vZGVscz1mdW5jdGlvbihhcnIpe1xyXG4gICAgZm9yKHZhciBtb2RlbElEIGluIHRoaXMuRFRETE1vZGVscyl7XHJcbiAgICAgICAgdmFyIGpzb25TdHI9dGhpcy5EVERMTW9kZWxzW21vZGVsSURdW1wib3JpZ2luYWxcIl1cclxuICAgICAgICB0aGlzLkRURExNb2RlbHNbbW9kZWxJRF09SlNPTi5wYXJzZShqc29uU3RyKVxyXG4gICAgICAgIHRoaXMuRFRETE1vZGVsc1ttb2RlbElEXVtcIm9yaWdpbmFsXCJdPWpzb25TdHJcclxuICAgIH1cclxufVxyXG5cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLmFkZE1vZGVscz1mdW5jdGlvbihhcnIpe1xyXG4gICAgYXJyLmZvckVhY2goKGVsZSk9PntcclxuICAgICAgICB2YXIgbW9kZWxJRD0gZWxlW1wiQGlkXCJdXHJcbiAgICAgICAgZWxlW1wib3JpZ2luYWxcIl09SlNPTi5zdHJpbmdpZnkoZWxlKVxyXG4gICAgICAgIHRoaXMuRFRETE1vZGVsc1ttb2RlbElEXT1lbGVcclxuICAgIH0pXHJcbn1cclxuXHJcblxyXG5tb2RlbEFuYWx5emVyLnByb3RvdHlwZS5yZWNvcmRBbGxCYXNlQ2xhc3Nlcz0gZnVuY3Rpb24gKHBhcmVudE9iaiwgYmFzZUNsYXNzSUQpIHtcclxuICAgIHZhciBiYXNlQ2xhc3MgPSB0aGlzLkRURExNb2RlbHNbYmFzZUNsYXNzSURdXHJcbiAgICBpZiAoYmFzZUNsYXNzID09IG51bGwpIHJldHVybjtcclxuXHJcbiAgICBwYXJlbnRPYmpbYmFzZUNsYXNzSURdPTFcclxuXHJcbiAgICB2YXIgZnVydGhlckJhc2VDbGFzc0lEcyA9IGJhc2VDbGFzcy5leHRlbmRzO1xyXG4gICAgaWYgKGZ1cnRoZXJCYXNlQ2xhc3NJRHMgPT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgaWYoQXJyYXkuaXNBcnJheShmdXJ0aGVyQmFzZUNsYXNzSURzKSkgdmFyIHRtcEFycj1mdXJ0aGVyQmFzZUNsYXNzSURzXHJcbiAgICBlbHNlIHRtcEFycj1bZnVydGhlckJhc2VDbGFzc0lEc11cclxuICAgIHRtcEFyci5mb3JFYWNoKChlYWNoQmFzZSkgPT4geyB0aGlzLnJlY29yZEFsbEJhc2VDbGFzc2VzKHBhcmVudE9iaiwgZWFjaEJhc2UpIH0pXHJcbn1cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLmV4cGFuZEVkaXRhYmxlUHJvcGVydGllc0Zyb21CYXNlQ2xhc3MgPSBmdW5jdGlvbiAocGFyZW50T2JqLCBiYXNlQ2xhc3NJRCkge1xyXG4gICAgdmFyIGJhc2VDbGFzcyA9IHRoaXMuRFRETE1vZGVsc1tiYXNlQ2xhc3NJRF1cclxuICAgIGlmIChiYXNlQ2xhc3MgPT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgaWYgKGJhc2VDbGFzcy5lZGl0YWJsZVByb3BlcnRpZXMpIHtcclxuICAgICAgICBmb3IgKHZhciBpbmQgaW4gYmFzZUNsYXNzLmVkaXRhYmxlUHJvcGVydGllcykgcGFyZW50T2JqW2luZF0gPSBiYXNlQ2xhc3MuZWRpdGFibGVQcm9wZXJ0aWVzW2luZF1cclxuICAgIH1cclxuICAgIHZhciBmdXJ0aGVyQmFzZUNsYXNzSURzID0gYmFzZUNsYXNzLmV4dGVuZHM7XHJcbiAgICBpZiAoZnVydGhlckJhc2VDbGFzc0lEcyA9PSBudWxsKSByZXR1cm47XHJcbiAgICBpZihBcnJheS5pc0FycmF5KGZ1cnRoZXJCYXNlQ2xhc3NJRHMpKSB2YXIgdG1wQXJyPWZ1cnRoZXJCYXNlQ2xhc3NJRHNcclxuICAgIGVsc2UgdG1wQXJyPVtmdXJ0aGVyQmFzZUNsYXNzSURzXVxyXG4gICAgdG1wQXJyLmZvckVhY2goKGVhY2hCYXNlKSA9PiB7IHRoaXMuZXhwYW5kRWRpdGFibGVQcm9wZXJ0aWVzRnJvbUJhc2VDbGFzcyhwYXJlbnRPYmosIGVhY2hCYXNlKSB9KVxyXG59XHJcblxyXG5tb2RlbEFuYWx5emVyLnByb3RvdHlwZS5leHBhbmRWYWxpZFJlbGF0aW9uc2hpcFR5cGVzRnJvbUJhc2VDbGFzcyA9IGZ1bmN0aW9uIChwYXJlbnRPYmosIGJhc2VDbGFzc0lEKSB7XHJcbiAgICB2YXIgYmFzZUNsYXNzID0gdGhpcy5EVERMTW9kZWxzW2Jhc2VDbGFzc0lEXVxyXG4gICAgaWYgKGJhc2VDbGFzcyA9PSBudWxsKSByZXR1cm47XHJcbiAgICBpZiAoYmFzZUNsYXNzLnZhbGlkUmVsYXRpb25zaGlwcykge1xyXG4gICAgICAgIGZvciAodmFyIGluZCBpbiBiYXNlQ2xhc3MudmFsaWRSZWxhdGlvbnNoaXBzKSB7XHJcbiAgICAgICAgICAgIGlmKHBhcmVudE9ialtpbmRdPT1udWxsKSBwYXJlbnRPYmpbaW5kXSA9IHRoaXMucmVsYXRpb25zaGlwVHlwZXNbaW5kXVtiYXNlQ2xhc3NJRF1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB2YXIgZnVydGhlckJhc2VDbGFzc0lEcyA9IGJhc2VDbGFzcy5leHRlbmRzO1xyXG4gICAgaWYgKGZ1cnRoZXJCYXNlQ2xhc3NJRHMgPT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgaWYoQXJyYXkuaXNBcnJheShmdXJ0aGVyQmFzZUNsYXNzSURzKSkgdmFyIHRtcEFycj1mdXJ0aGVyQmFzZUNsYXNzSURzXHJcbiAgICBlbHNlIHRtcEFycj1bZnVydGhlckJhc2VDbGFzc0lEc11cclxuICAgIHRtcEFyci5mb3JFYWNoKChlYWNoQmFzZSkgPT4geyB0aGlzLmV4cGFuZFZhbGlkUmVsYXRpb25zaGlwVHlwZXNGcm9tQmFzZUNsYXNzKHBhcmVudE9iaiwgZWFjaEJhc2UpIH0pXHJcbn1cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLmV4cGFuZEVkaXRhYmxlUHJvcGVydGllcz1mdW5jdGlvbihwYXJlbnRPYmosZGF0YUluZm8sZW1iZWRkZWRTY2hlbWEpe1xyXG4gICAgZGF0YUluZm8uZm9yRWFjaCgob25lQ29udGVudCk9PntcclxuICAgICAgICBpZihvbmVDb250ZW50W1wiQHR5cGVcIl09PVwiUmVsYXRpb25zaGlwXCIpIHJldHVybjtcclxuICAgICAgICBpZihvbmVDb250ZW50W1wiQHR5cGVcIl09PVwiUHJvcGVydHlcIlxyXG4gICAgICAgIHx8KEFycmF5LmlzQXJyYXkob25lQ29udGVudFtcIkB0eXBlXCJdKSAmJiBvbmVDb250ZW50W1wiQHR5cGVcIl0uaW5jbHVkZXMoXCJQcm9wZXJ0eVwiKSlcclxuICAgICAgICB8fCBvbmVDb250ZW50W1wiQHR5cGVcIl09PW51bGwpIHtcclxuICAgICAgICAgICAgaWYodHlwZW9mKG9uZUNvbnRlbnRbXCJzY2hlbWFcIl0pICE9ICdvYmplY3QnICYmIGVtYmVkZGVkU2NoZW1hW29uZUNvbnRlbnRbXCJzY2hlbWFcIl1dIT1udWxsKSBvbmVDb250ZW50W1wic2NoZW1hXCJdPWVtYmVkZGVkU2NoZW1hW29uZUNvbnRlbnRbXCJzY2hlbWFcIl1dXHJcblxyXG4gICAgICAgICAgICBpZih0eXBlb2Yob25lQ29udGVudFtcInNjaGVtYVwiXSkgPT09ICdvYmplY3QnICYmIG9uZUNvbnRlbnRbXCJzY2hlbWFcIl1bXCJAdHlwZVwiXT09XCJPYmplY3RcIil7XHJcbiAgICAgICAgICAgICAgICB2YXIgbmV3UGFyZW50PXt9XHJcbiAgICAgICAgICAgICAgICBwYXJlbnRPYmpbb25lQ29udGVudFtcIm5hbWVcIl1dPW5ld1BhcmVudFxyXG4gICAgICAgICAgICAgICAgdGhpcy5leHBhbmRFZGl0YWJsZVByb3BlcnRpZXMobmV3UGFyZW50LG9uZUNvbnRlbnRbXCJzY2hlbWFcIl1bXCJmaWVsZHNcIl0sZW1iZWRkZWRTY2hlbWEpXHJcbiAgICAgICAgICAgIH1lbHNlIGlmKHR5cGVvZihvbmVDb250ZW50W1wic2NoZW1hXCJdKSA9PT0gJ29iamVjdCcgJiYgb25lQ29udGVudFtcInNjaGVtYVwiXVtcIkB0eXBlXCJdPT1cIkVudW1cIil7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnRPYmpbb25lQ29udGVudFtcIm5hbWVcIl1dPW9uZUNvbnRlbnRbXCJzY2hlbWFcIl1bXCJlbnVtVmFsdWVzXCJdXHJcbiAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgcGFyZW50T2JqW29uZUNvbnRlbnRbXCJuYW1lXCJdXT1vbmVDb250ZW50W1wic2NoZW1hXCJdXHJcbiAgICAgICAgICAgIH0gICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1cclxuXHJcblxyXG5tb2RlbEFuYWx5emVyLnByb3RvdHlwZS5hbmFseXplPWZ1bmN0aW9uKCl7XHJcbiAgICBjb25zb2xlLmxvZyhcImFuYWx5emUgbW9kZWwgaW5mb1wiKVxyXG4gICAgLy9hbmFseXplIGFsbCByZWxhdGlvbnNoaXAgdHlwZXNcclxuICAgIGZvciAodmFyIGlkIGluIHRoaXMucmVsYXRpb25zaGlwVHlwZXMpIGRlbGV0ZSB0aGlzLnJlbGF0aW9uc2hpcFR5cGVzW2lkXVxyXG4gICAgZm9yICh2YXIgbW9kZWxJRCBpbiB0aGlzLkRURExNb2RlbHMpIHtcclxuICAgICAgICB2YXIgZWxlID0gdGhpcy5EVERMTW9kZWxzW21vZGVsSURdXHJcbiAgICAgICAgdmFyIGVtYmVkZGVkU2NoZW1hID0ge31cclxuICAgICAgICBpZiAoZWxlLnNjaGVtYXMpIHtcclxuICAgICAgICAgICAgdmFyIHRlbXBBcnI7XHJcbiAgICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGVsZS5zY2hlbWFzKSkgdGVtcEFyciA9IGVsZS5zY2hlbWFzXHJcbiAgICAgICAgICAgIGVsc2UgdGVtcEFyciA9IFtlbGUuc2NoZW1hc11cclxuICAgICAgICAgICAgdGVtcEFyci5mb3JFYWNoKChlbGUpID0+IHtcclxuICAgICAgICAgICAgICAgIGVtYmVkZGVkU2NoZW1hW2VsZVtcIkBpZFwiXV0gPSBlbGVcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBjb250ZW50QXJyID0gZWxlLmNvbnRlbnRzXHJcbiAgICAgICAgaWYgKCFjb250ZW50QXJyKSBjb250aW51ZTtcclxuICAgICAgICBjb250ZW50QXJyLmZvckVhY2goKG9uZUNvbnRlbnQpID0+IHtcclxuICAgICAgICAgICAgaWYgKG9uZUNvbnRlbnRbXCJAdHlwZVwiXSA9PSBcIlJlbGF0aW9uc2hpcFwiKSB7XHJcbiAgICAgICAgICAgICAgICBpZighdGhpcy5yZWxhdGlvbnNoaXBUeXBlc1tvbmVDb250ZW50W1wibmFtZVwiXV0pIHRoaXMucmVsYXRpb25zaGlwVHlwZXNbb25lQ29udGVudFtcIm5hbWVcIl1dPSB7fVxyXG4gICAgICAgICAgICAgICAgdGhpcy5yZWxhdGlvbnNoaXBUeXBlc1tvbmVDb250ZW50W1wibmFtZVwiXV1bbW9kZWxJRF0gPSBvbmVDb250ZW50XHJcbiAgICAgICAgICAgICAgICBvbmVDb250ZW50LmVkaXRhYmxlUmVsYXRpb25zaGlwUHJvcGVydGllcyA9IHt9XHJcbiAgICAgICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShvbmVDb250ZW50LnByb3BlcnRpZXMpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5leHBhbmRFZGl0YWJsZVByb3BlcnRpZXMob25lQ29udGVudC5lZGl0YWJsZVJlbGF0aW9uc2hpcFByb3BlcnRpZXMsIG9uZUNvbnRlbnQucHJvcGVydGllcywgZW1iZWRkZWRTY2hlbWEpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgIC8vYW5hbHl6ZSBlYWNoIG1vZGVsJ3MgcHJvcGVydHkgdGhhdCBjYW4gYmUgZWRpdGVkXHJcbiAgICBmb3IodmFyIG1vZGVsSUQgaW4gdGhpcy5EVERMTW9kZWxzKXsgLy9leHBhbmQgcG9zc2libGUgZW1iZWRkZWQgc2NoZW1hIHRvIGVkaXRhYmxlUHJvcGVydGllcywgYWxzbyBleHRyYWN0IHBvc3NpYmxlIHJlbGF0aW9uc2hpcCB0eXBlcyBmb3IgdGhpcyBtb2RlbFxyXG4gICAgICAgIHZhciBlbGU9dGhpcy5EVERMTW9kZWxzW21vZGVsSURdXHJcbiAgICAgICAgdmFyIGVtYmVkZGVkU2NoZW1hPXt9XHJcbiAgICAgICAgaWYoZWxlLnNjaGVtYXMpe1xyXG4gICAgICAgICAgICB2YXIgdGVtcEFycjtcclxuICAgICAgICAgICAgaWYoQXJyYXkuaXNBcnJheShlbGUuc2NoZW1hcykpIHRlbXBBcnI9ZWxlLnNjaGVtYXNcclxuICAgICAgICAgICAgZWxzZSB0ZW1wQXJyPVtlbGUuc2NoZW1hc11cclxuICAgICAgICAgICAgdGVtcEFyci5mb3JFYWNoKChlbGUpPT57XHJcbiAgICAgICAgICAgICAgICBlbWJlZGRlZFNjaGVtYVtlbGVbXCJAaWRcIl1dPWVsZVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1cclxuICAgICAgICBlbGUuZWRpdGFibGVQcm9wZXJ0aWVzPXt9XHJcbiAgICAgICAgZWxlLnZhbGlkUmVsYXRpb25zaGlwcz17fVxyXG4gICAgICAgIGVsZS5pbmNsdWRlZENvbXBvbmVudHM9W11cclxuICAgICAgICBlbGUuYWxsQmFzZUNsYXNzZXM9e31cclxuICAgICAgICBpZihBcnJheS5pc0FycmF5KGVsZS5jb250ZW50cykpe1xyXG4gICAgICAgICAgICB0aGlzLmV4cGFuZEVkaXRhYmxlUHJvcGVydGllcyhlbGUuZWRpdGFibGVQcm9wZXJ0aWVzLGVsZS5jb250ZW50cyxlbWJlZGRlZFNjaGVtYSlcclxuXHJcbiAgICAgICAgICAgIGVsZS5jb250ZW50cy5mb3JFYWNoKChvbmVDb250ZW50KT0+e1xyXG4gICAgICAgICAgICAgICAgaWYob25lQ29udGVudFtcIkB0eXBlXCJdPT1cIlJlbGF0aW9uc2hpcFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlLnZhbGlkUmVsYXRpb25zaGlwc1tvbmVDb250ZW50W1wibmFtZVwiXV09dGhpcy5yZWxhdGlvbnNoaXBUeXBlc1tvbmVDb250ZW50W1wibmFtZVwiXV1bbW9kZWxJRF1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZm9yKHZhciBtb2RlbElEIGluIHRoaXMuRFRETE1vZGVscyl7Ly9leHBhbmQgY29tcG9uZW50IHByb3BlcnRpZXNcclxuICAgICAgICB2YXIgZWxlPXRoaXMuRFRETE1vZGVsc1ttb2RlbElEXVxyXG4gICAgICAgIGlmKEFycmF5LmlzQXJyYXkoZWxlLmNvbnRlbnRzKSl7XHJcbiAgICAgICAgICAgIGVsZS5jb250ZW50cy5mb3JFYWNoKG9uZUNvbnRlbnQ9PntcclxuICAgICAgICAgICAgICAgIGlmKG9uZUNvbnRlbnRbXCJAdHlwZVwiXT09XCJDb21wb25lbnRcIil7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvbXBvbmVudE5hbWU9b25lQ29udGVudFtcIm5hbWVcIl1cclxuICAgICAgICAgICAgICAgICAgICB2YXIgY29tcG9uZW50Q2xhc3M9b25lQ29udGVudFtcInNjaGVtYVwiXVxyXG4gICAgICAgICAgICAgICAgICAgIGVsZS5lZGl0YWJsZVByb3BlcnRpZXNbY29tcG9uZW50TmFtZV09e31cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmV4cGFuZEVkaXRhYmxlUHJvcGVydGllc0Zyb21CYXNlQ2xhc3MoZWxlLmVkaXRhYmxlUHJvcGVydGllc1tjb21wb25lbnROYW1lXSxjb21wb25lbnRDbGFzcylcclxuICAgICAgICAgICAgICAgICAgICBlbGUuaW5jbHVkZWRDb21wb25lbnRzLnB1c2goY29tcG9uZW50TmFtZSlcclxuICAgICAgICAgICAgICAgIH0gXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGZvcih2YXIgbW9kZWxJRCBpbiB0aGlzLkRURExNb2RlbHMpey8vZXhwYW5kIGJhc2UgY2xhc3MgcHJvcGVydGllcyB0byBlZGl0YWJsZVByb3BlcnRpZXMgYW5kIHZhbGlkIHJlbGF0aW9uc2hpcCB0eXBlcyB0byB2YWxpZFJlbGF0aW9uc2hpcHNcclxuICAgICAgICB2YXIgZWxlPXRoaXMuRFRETE1vZGVsc1ttb2RlbElEXVxyXG4gICAgICAgIHZhciBiYXNlQ2xhc3NJRHM9ZWxlLmV4dGVuZHM7XHJcbiAgICAgICAgaWYoYmFzZUNsYXNzSURzPT1udWxsKSBjb250aW51ZTtcclxuICAgICAgICBpZihBcnJheS5pc0FycmF5KGJhc2VDbGFzc0lEcykpIHZhciB0bXBBcnI9YmFzZUNsYXNzSURzXHJcbiAgICAgICAgZWxzZSB0bXBBcnI9W2Jhc2VDbGFzc0lEc11cclxuICAgICAgICB0bXBBcnIuZm9yRWFjaCgoZWFjaEJhc2UpPT57XHJcbiAgICAgICAgICAgIHRoaXMucmVjb3JkQWxsQmFzZUNsYXNzZXMoZWxlLmFsbEJhc2VDbGFzc2VzLGVhY2hCYXNlKVxyXG4gICAgICAgICAgICB0aGlzLmV4cGFuZEVkaXRhYmxlUHJvcGVydGllc0Zyb21CYXNlQ2xhc3MoZWxlLmVkaXRhYmxlUHJvcGVydGllcyxlYWNoQmFzZSlcclxuICAgICAgICAgICAgdGhpcy5leHBhbmRWYWxpZFJlbGF0aW9uc2hpcFR5cGVzRnJvbUJhc2VDbGFzcyhlbGUudmFsaWRSZWxhdGlvbnNoaXBzLGVhY2hCYXNlKVxyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcblxyXG4gICAgLy9jb25zb2xlLmxvZyh0aGlzLkRURExNb2RlbHMpXHJcbiAgICAvL2NvbnNvbGUubG9nKHRoaXMucmVsYXRpb25zaGlwVHlwZXMpXHJcbn1cclxuXHJcblxyXG5tb2RlbEFuYWx5emVyLnByb3RvdHlwZS5saXN0TW9kZWxzRm9yRGVsZXRlTW9kZWw9ZnVuY3Rpb24obW9kZWxJRCl7XHJcbiAgICB2YXIgY2hpbGRNb2RlbElEcz1bXVxyXG4gICAgZm9yKHZhciBhSUQgaW4gdGhpcy5EVERMTW9kZWxzKXtcclxuICAgICAgICB2YXIgYU1vZGVsPXRoaXMuRFRETE1vZGVsc1thSURdXHJcbiAgICAgICAgaWYoYU1vZGVsLmFsbEJhc2VDbGFzc2VzICYmIGFNb2RlbC5hbGxCYXNlQ2xhc3Nlc1ttb2RlbElEXSkgY2hpbGRNb2RlbElEcy5wdXNoKGFNb2RlbFtcIkBpZFwiXSlcclxuICAgIH1cclxuICAgIHJldHVybiBjaGlsZE1vZGVsSURzXHJcbn1cclxuXHJcbm1vZGVsQW5hbHl6ZXIucHJvdG90eXBlLmRlbGV0ZU1vZGVsX25vdEJhc2VDbGFzc09mQW55PWZ1bmN0aW9uKG1vZGVsSUQpe1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAkLnBvc3QoXCJlZGl0QURUL2RlbGV0ZU1vZGVsXCIse1wibW9kZWxcIjptb2RlbElEfSwgKGRhdGEpPT4ge1xyXG4gICAgICAgICAgICBpZihkYXRhPT1cIlwiKXsvL3N1Y2Nlc3NmdWxcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoKVxyXG4gICAgICAgICAgICB9ZWxzZXsgLy9lcnJvciBoYXBwZW5zXHJcbiAgICAgICAgICAgICAgICByZWplY3QoZGF0YSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSlcclxufVxyXG5cclxubW9kZWxBbmFseXplci5wcm90b3R5cGUuZGVsZXRlTW9kZWw9YXN5bmMgZnVuY3Rpb24obW9kZWxJRCxmdW5jQWZ0ZXJFYWNoU3VjY2Vzc0RlbGV0ZSxmdW5jQWZ0ZXJGYWlsLGNvbXBsZXRlRnVuYyl7XHJcbiAgICB2YXIgcmVsYXRlZE1vZGVsSURzPXRoaXMubGlzdE1vZGVsc0ZvckRlbGV0ZU1vZGVsKG1vZGVsSUQpXHJcbiAgICB2YXIgbW9kZWxMZXZlbD1bXVxyXG4gICAgcmVsYXRlZE1vZGVsSURzLmZvckVhY2gob25lSUQ9PntcclxuICAgICAgICB2YXIgY2hlY2tNb2RlbD10aGlzLkRURExNb2RlbHNbb25lSURdXHJcbiAgICAgICAgbW9kZWxMZXZlbC5wdXNoKHtcIm1vZGVsSURcIjpvbmVJRCxcImxldmVsXCI6T2JqZWN0LmtleXMoY2hlY2tNb2RlbC5hbGxCYXNlQ2xhc3NlcykubGVuZ3RofSlcclxuICAgIH0pXHJcbiAgICBtb2RlbExldmVsLnB1c2goe1wibW9kZWxJRFwiOm1vZGVsSUQsXCJsZXZlbFwiOjB9KVxyXG4gICAgbW9kZWxMZXZlbC5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7cmV0dXJuIGJbXCJsZXZlbFwiXS1hW1wibGV2ZWxcIl0gfSk7XHJcbiAgICBcclxuICAgIGZvcih2YXIgaT0wO2k8bW9kZWxMZXZlbC5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIgYU1vZGVsSUQ9bW9kZWxMZXZlbFtpXS5tb2RlbElEXHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmRlbGV0ZU1vZGVsX25vdEJhc2VDbGFzc09mQW55KGFNb2RlbElEKVxyXG4gICAgICAgICAgICB2YXIgbW9kZWxOYW1lPXRoaXMuRFRETE1vZGVsc1thTW9kZWxJRF0uZGlzcGxheU5hbWVcclxuICAgICAgICAgICAgZGVsZXRlIHRoaXMuRFRETE1vZGVsc1thTW9kZWxJRF1cclxuICAgICAgICAgICAgaWYoZnVuY0FmdGVyRWFjaFN1Y2Nlc3NEZWxldGUpIGZ1bmNBZnRlckVhY2hTdWNjZXNzRGVsZXRlKGFNb2RlbElELG1vZGVsTmFtZSlcclxuICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIHZhciBkZWxldGVkTW9kZWxzPVtdXHJcbiAgICAgICAgICAgIHZhciBhbGVydFN0cj1cIkRlbGV0ZSBtb2RlbCBpcyBpbmNvbXBsZXRlLiBEZWxldGVkIE1vZGVsOlwiXHJcbiAgICAgICAgICAgIGZvcih2YXIgaj0wO2o8aTtqKyspe1xyXG4gICAgICAgICAgICAgICAgYWxlcnRTdHIrPSBtb2RlbExldmVsW2pdLm1vZGVsSUQrXCIgXCJcclxuICAgICAgICAgICAgICAgIGRlbGV0ZWRNb2RlbHMucHVzaChtb2RlbExldmVsW2pdLm1vZGVsSUQpXHJcbiAgICAgICAgICAgIH0gXHJcbiAgICAgICAgICAgIGFsZXJ0U3RyKz1cIi4gRmFpbCB0byBkZWxldGUgXCIrYU1vZGVsSUQrXCIuIEVycm9yIGlzIFwiK2VcclxuICAgICAgICAgICAgaWYoZnVuY0FmdGVyRmFpbCkgZnVuY0FmdGVyRmFpbChkZWxldGVkTW9kZWxzKVxyXG4gICAgICAgICAgICBhbGVydChlKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmKGNvbXBsZXRlRnVuYykgY29tcGxldGVGdW5jKClcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgbW9kZWxBbmFseXplcigpOyIsImNvbnN0IG1vZGVsQW5hbHl6ZXI9cmVxdWlyZShcIi4vbW9kZWxBbmFseXplclwiKVxyXG5jb25zdCBzaW1wbGVTZWxlY3RNZW51PSByZXF1aXJlKFwiLi9zaW1wbGVTZWxlY3RNZW51XCIpXHJcbmNvbnN0IHNpbXBsZUNvbmZpcm1EaWFsb2c9cmVxdWlyZShcIi4vc2ltcGxlQ29uZmlybURpYWxvZ1wiKVxyXG5jb25zdCBnbG9iYWxDYWNoZSA9IHJlcXVpcmUoXCIuL2dsb2JhbENhY2hlXCIpXHJcblxyXG5mdW5jdGlvbiBtb2RlbEVkaXRvckRpYWxvZygpIHtcclxuICAgIGlmKCF0aGlzLkRPTSl7XHJcbiAgICAgICAgdGhpcy5ET00gPSAkKCc8ZGl2IHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dG9wOjUwJTtiYWNrZ3JvdW5kLWNvbG9yOndoaXRlO2xlZnQ6NTAlO3RyYW5zZm9ybTogdHJhbnNsYXRlWCgtNTAlKSB0cmFuc2xhdGVZKC01MCUpO3otaW5kZXg6MTAwXCIgY2xhc3M9XCJ3My1jYXJkLTJcIj48L2Rpdj4nKVxyXG4gICAgICAgICQoXCJib2R5XCIpLmFwcGVuZCh0aGlzLkRPTSlcclxuICAgICAgICB0aGlzLkRPTS5oaWRlKClcclxuICAgICAgICBnbG9iYWxDYWNoZS5tYWtlRE9NRHJhZ2dhYmxlKHRoaXMuRE9NKVxyXG4gICAgfVxyXG59XHJcblxyXG5tb2RlbEVkaXRvckRpYWxvZy5wcm90b3R5cGUucG9wdXAgPSBhc3luYyBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMuRE9NLnNob3coKVxyXG4gICAgdGhpcy5ET00uZW1wdHkoKVxyXG4gICAgdGhpcy5jb250ZW50RE9NID0gJCgnPGRpdiBzdHlsZT1cIndpZHRoOjY2NXB4XCI+PC9kaXY+JylcclxuICAgIHRoaXMuRE9NLmFwcGVuZCh0aGlzLmNvbnRlbnRET00pXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKCQoJzxkaXYgc3R5bGU9XCJoZWlnaHQ6NDBweFwiIGNsYXNzPVwidzMtYmFyIHczLXJlZFwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiZm9udC1zaXplOjEuNWVtXCI+RGlnaXRhbCBUd2luIE1vZGVsIEVkaXRvcjwvZGl2PjwvZGl2PicpKVxyXG4gICAgdmFyIGNsb3NlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yaWdodFwiIHN0eWxlPVwiZm9udC1zaXplOjJlbTtwYWRkaW5nLXRvcDo0cHhcIj7DlzwvYnV0dG9uPicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uY2hpbGRyZW4oJzpmaXJzdCcpLmFwcGVuZChjbG9zZUJ1dHRvbilcclxuICAgIGNsb3NlQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4geyB0aGlzLkRPTS5oaWRlKCkgfSlcclxuXHJcbiAgICB2YXIgYnV0dG9uUm93PSQoJzxkaXYgIHN0eWxlPVwiaGVpZ2h0OjQwcHhcIiBjbGFzcz1cInczLWJhclwiPjwvZGl2PicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKGJ1dHRvblJvdylcclxuICAgIHZhciBpbXBvcnRCdXR0b24gPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtY2FyZCB3My1kZWVwLW9yYW5nZSB3My1ob3Zlci1saWdodC1ncmVlbiB3My1yaWdodFwiIHN0eWxlPVwiaGVpZ2h0OjEwMCVcIj5JbXBvcnQ8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5pbXBvcnRCdXR0b249aW1wb3J0QnV0dG9uXHJcbiAgICBidXR0b25Sb3cuYXBwZW5kKGltcG9ydEJ1dHRvbilcclxuXHJcbiAgICBpbXBvcnRCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7XHJcbiAgICAgICAgdmFyIGN1cnJlbnRNb2RlbElEPXRoaXMuZHRkbG9ialtcIkBpZFwiXVxyXG4gICAgICAgIGlmKG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1tjdXJyZW50TW9kZWxJRF09PW51bGwpIHRoaXMuaW1wb3J0TW9kZWxBcnIoW3RoaXMuZHRkbG9ial0pXHJcbiAgICAgICAgZWxzZSB0aGlzLnJlcGxhY2VNb2RlbCgpXHJcbiAgICB9KVxyXG5cclxuICAgIHZhciBsYWJsZT0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtb3BhY2l0eVwiIHN0eWxlPVwicGFkZGluZy1yaWdodDo1cHg7Zm9udC1zaXplOjEuMmVtO1wiPk1vZGVsIFRlbXBsYXRlPC9kaXY+JylcclxuICAgIGJ1dHRvblJvdy5hcHBlbmQobGFibGUpXHJcbiAgICB2YXIgbW9kZWxUZW1wbGF0ZVNlbGVjdG9yPW5ldyBzaW1wbGVTZWxlY3RNZW51KFwiIFwiLHt3aXRoQm9yZGVyOjEsZm9udFNpemU6XCIxLjJlbVwiLGNvbG9yQ2xhc3M6XCJ3My1saWdodC1ncmF5XCIsYnV0dG9uQ1NTOntcInBhZGRpbmdcIjpcIjVweCAxMHB4XCJ9LFwib3B0aW9uTGlzdEhlaWdodFwiOjMwMH0pXHJcbiAgICBidXR0b25Sb3cuYXBwZW5kKG1vZGVsVGVtcGxhdGVTZWxlY3Rvci5ET00pXHJcbiAgICBtb2RlbFRlbXBsYXRlU2VsZWN0b3IuY2FsbEJhY2tfY2xpY2tPcHRpb249KG9wdGlvblRleHQsb3B0aW9uVmFsdWUpPT57XHJcbiAgICAgICAgbW9kZWxUZW1wbGF0ZVNlbGVjdG9yLmNoYW5nZU5hbWUob3B0aW9uVGV4dClcclxuICAgICAgICB0aGlzLmNob29zZVRlbXBsYXRlKG9wdGlvblZhbHVlKVxyXG4gICAgfVxyXG4gICAgbW9kZWxUZW1wbGF0ZVNlbGVjdG9yLmFkZE9wdGlvbihcIk5ldyBNb2RlbC4uLlwiLFwiTmV3XCIpXHJcbiAgICBmb3IodmFyIG1vZGVsTmFtZSBpbiBtb2RlbEFuYWx5emVyLkRURExNb2RlbHMpe1xyXG4gICAgICAgIG1vZGVsVGVtcGxhdGVTZWxlY3Rvci5hZGRPcHRpb24obW9kZWxOYW1lKVxyXG4gICAgfVxyXG5cclxuICAgIHZhciBwYW5lbEhlaWdodD1cIjQ1MHB4XCJcclxuICAgIHZhciByb3cyPSQoJzxkaXYgY2xhc3M9XCJ3My1jZWxsLXJvd1wiIHN0eWxlPVwibWFyZ2luOjJweFwiPjwvZGl2PicpXHJcbiAgICB0aGlzLmNvbnRlbnRET00uYXBwZW5kKHJvdzIpXHJcbiAgICB2YXIgbGVmdFNwYW49JCgnPGRpdiBjbGFzcz1cInczLWNhcmRcIiBzdHlsZT1cInBhZGRpbmc6NXB4O3dpZHRoOjMzMHB4O3BhZGRpbmctcmlnaHQ6NXB4O2hlaWdodDonK3BhbmVsSGVpZ2h0Kyc7b3ZlcmZsb3c6YXV0b1wiPjwvZGl2PicpXHJcbiAgICByb3cyLmFwcGVuZChsZWZ0U3BhbilcclxuICAgIHRoaXMubGVmdFNwYW49bGVmdFNwYW5cclxuXHJcbiAgICB2YXIgcmlnaHRTcGFuPSQoJzxkaXYgY2xhc3M9XCJ3My1jb250YWluZXIgdzMtY2VsbFwiPjwvZGl2PicpXHJcbiAgICByb3cyLmFwcGVuZChyaWdodFNwYW4pIFxyXG4gICAgdmFyIGR0ZGxTY3JpcHRQYW5lbD0kKCc8ZGl2IGNsYXNzPVwidzMtY2FyZC0yIHczLXdoaXRlXCIgc3R5bGU9XCJvdmVyZmxvdzphdXRvO21hcmdpbi10b3A6MnB4O3dpZHRoOjMxMHB4O2hlaWdodDonK3BhbmVsSGVpZ2h0KydcIj48L2Rpdj4nKVxyXG4gICAgcmlnaHRTcGFuLmFwcGVuZChkdGRsU2NyaXB0UGFuZWwpXHJcbiAgICB0aGlzLmR0ZGxTY3JpcHRQYW5lbD1kdGRsU2NyaXB0UGFuZWxcclxuXHJcbiAgICBtb2RlbFRlbXBsYXRlU2VsZWN0b3IudHJpZ2dlck9wdGlvbkluZGV4KDApXHJcbn1cclxuXHJcbm1vZGVsRWRpdG9yRGlhbG9nLnByb3RvdHlwZS5yZXBsYWNlTW9kZWw9ZnVuY3Rpb24oKXtcclxuICAgIC8vZGVsZXRlIHRoZSBvbGQgc2FtZSBuYW1lIG1vZGVsLCB0aGVuIGNyZWF0ZSBpdCBhZ2FpblxyXG4gICAgdmFyIGN1cnJlbnRNb2RlbElEPXRoaXMuZHRkbG9ialtcIkBpZFwiXVxyXG5cclxuICAgIHZhciByZWxhdGVkTW9kZWxJRHM9bW9kZWxBbmFseXplci5saXN0TW9kZWxzRm9yRGVsZXRlTW9kZWwoY3VycmVudE1vZGVsSUQpXHJcblxyXG4gICAgdmFyIGRpYWxvZ1N0ciA9IChyZWxhdGVkTW9kZWxJRHMubGVuZ3RoID09IDApID8gKFwiVHdpbnMgd2lsbCBiZSBpbXBhY3QgdW5kZXIgbW9kZWwgXFxcIlwiICsgY3VycmVudE1vZGVsSUQgKyBcIlxcXCJcIikgOlxyXG4gICAgICAgIChjdXJyZW50TW9kZWxJRCArIFwiIGlzIGJhc2UgbW9kZWwgb2YgXCIgKyByZWxhdGVkTW9kZWxJRHMuam9pbihcIiwgXCIpICsgXCIuIFR3aW5zIHVuZGVyIHRoZXNlIG1vZGVscyB3aWxsIGJlIGltcGFjdC5cIilcclxuICAgIHZhciBjb25maXJtRGlhbG9nRGl2ID0gbmV3IHNpbXBsZUNvbmZpcm1EaWFsb2coKVxyXG4gICAgY29uZmlybURpYWxvZ0Rpdi5zaG93KFxyXG4gICAgICAgIHsgd2lkdGg6IFwiMzUwcHhcIiB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdGl0bGU6IFwiV2FybmluZ1wiXHJcbiAgICAgICAgICAgICwgY29udGVudDogZGlhbG9nU3RyXHJcbiAgICAgICAgICAgICwgYnV0dG9uczogW1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtcmVkIHczLWhvdmVyLXBpbmtcIiwgdGV4dDogXCJDb25maXJtXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbmZpcm1SZXBsYWNlTW9kZWwoY3VycmVudE1vZGVsSUQpXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xvckNsYXNzOiBcInczLWdyYXlcIiwgdGV4dDogXCJDYW5jZWxcIiwgXCJjbGlja0Z1bmNcIjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LmNsb3NlKClcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9XHJcbiAgICApICAgIFxyXG59XHJcblxyXG5tb2RlbEVkaXRvckRpYWxvZy5wcm90b3R5cGUuaW1wb3J0TW9kZWxBcnI9ZnVuY3Rpb24obW9kZWxUb0JlSW1wb3J0ZWQsZm9yUmVwbGFjaW5nLGFmdGVyRmFpbHVyZSl7XHJcbiAgICAkLnBvc3QoXCJlZGl0QURUL2ltcG9ydE1vZGVsc1wiLCB7IFwibW9kZWxzXCI6IEpTT04uc3RyaW5naWZ5KG1vZGVsVG9CZUltcG9ydGVkKSB9LCAoZGF0YSkgPT4ge1xyXG4gICAgICAgIGlmIChkYXRhID09IFwiXCIpIHsvL3N1Y2Nlc3NmdWxcclxuICAgICAgICAgICAgaWYoZm9yUmVwbGFjaW5nKSBhbGVydChcIk1vZGVsIFwiICsgdGhpcy5kdGRsb2JqW1wiZGlzcGxheU5hbWVcIl0gKyBcIiBpcyBtb2RpZmllZCBzdWNjZXNzZnVsbHkhXCIpXHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgYWxlcnQoXCJNb2RlbCBcIiArIHRoaXMuZHRkbG9ialtcImRpc3BsYXlOYW1lXCJdICsgXCIgaXMgY3JlYXRlZCFcIilcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJBRFRNb2RlbEVkaXRlZFwiIH0pXHJcbiAgICAgICAgICAgIG1vZGVsQW5hbHl6ZXIuYWRkTW9kZWxzKG1vZGVsVG9CZUltcG9ydGVkKS8vYWRkIHNvIGltbWVkaWF0bGV5IHRoZSBsaXN0IGNhbiBzaG93IHRoZSBuZXcgbW9kZWxzXHJcbiAgICAgICAgICAgIHRoaXMucG9wdXAoKSAvL3JlZnJlc2ggY29udGVudFxyXG4gICAgICAgIH0gZWxzZSB7IC8vZXJyb3IgaGFwcGVuc1xyXG4gICAgICAgICAgICBpZihhZnRlckZhaWx1cmUpIGFmdGVyRmFpbHVyZSgpXHJcbiAgICAgICAgICAgIGFsZXJ0KGRhdGEpXHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbm1vZGVsRWRpdG9yRGlhbG9nLnByb3RvdHlwZS5jb25maXJtUmVwbGFjZU1vZGVsPWZ1bmN0aW9uKG1vZGVsSUQpe1xyXG4gICAgdmFyIHJlbGF0ZWRNb2RlbElEcz1tb2RlbEFuYWx5emVyLmxpc3RNb2RlbHNGb3JEZWxldGVNb2RlbChtb2RlbElEKVxyXG4gICAgdmFyIGJhY2t1cE1vZGVscz1bXVxyXG4gICAgcmVsYXRlZE1vZGVsSURzLmZvckVhY2gob25lSUQ9PntcclxuICAgICAgICBiYWNrdXBNb2RlbHMucHVzaChKU09OLnBhcnNlKG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1tvbmVJRF1bXCJvcmlnaW5hbFwiXSkpXHJcbiAgICB9KVxyXG4gICAgYmFja3VwTW9kZWxzLnB1c2godGhpcy5kdGRsb2JqKVxyXG4gICAgdmFyIGJhY2t1cE1vZGVsc1N0cj1lbmNvZGVVUklDb21wb25lbnQoSlNPTi5zdHJpbmdpZnkoYmFja3VwTW9kZWxzKSlcclxuXHJcbiAgICB2YXIgZnVuY0FmdGVyRmFpbD0oZGVsZXRlZE1vZGVsSURzKT0+e1xyXG4gICAgICAgIHZhciBwb20gPSAkKFwiPGE+PC9hPlwiKVxyXG4gICAgICAgIHBvbS5hdHRyKCdocmVmJywgJ2RhdGE6dGV4dC9wbGFpbjtjaGFyc2V0PXV0Zi04LCcgKyBiYWNrdXBNb2RlbHNTdHIpO1xyXG4gICAgICAgIHBvbS5hdHRyKCdkb3dubG9hZCcsIFwiZXhwb3J0TW9kZWxzQWZ0ZXJGYWlsZWRPcGVyYXRpb24uanNvblwiKTtcclxuICAgICAgICBwb21bMF0uY2xpY2soKVxyXG4gICAgfVxyXG4gICAgdmFyIGZ1bmNBZnRlckVhY2hTdWNjZXNzRGVsZXRlID0gKGVhY2hEZWxldGVkTW9kZWxJRCxlYWNoTW9kZWxOYW1lKSA9PiB7fVxyXG4gICAgXHJcbiAgICB2YXIgY29tcGxldGVGdW5jPSgpPT57IFxyXG4gICAgICAgIC8vaW1wb3J0IGFsbCB0aGUgbW9kZWxzIGFnYWluXHJcbiAgICAgICAgdGhpcy5pbXBvcnRNb2RlbEFycihiYWNrdXBNb2RlbHMsXCJmb3JSZXBsYWNpbmdcIixmdW5jQWZ0ZXJGYWlsKVxyXG4gICAgfVxyXG5cclxuICAgIC8vbm90IGNvbXBsZXRlIGRlbGV0ZSB3aWxsIHN0aWxsIGludm9rZSBjb21wbGV0ZUZ1bmNcclxuICAgIG1vZGVsQW5hbHl6ZXIuZGVsZXRlTW9kZWwobW9kZWxJRCxmdW5jQWZ0ZXJFYWNoU3VjY2Vzc0RlbGV0ZSxmdW5jQWZ0ZXJGYWlsLGNvbXBsZXRlRnVuYylcclxufVxyXG5cclxuXHJcbm1vZGVsRWRpdG9yRGlhbG9nLnByb3RvdHlwZS5jaG9vc2VUZW1wbGF0ZT1mdW5jdGlvbih0ZW1wYWx0ZU5hbWUpe1xyXG4gICAgaWYodGVtcGFsdGVOYW1lIT1cIk5ld1wiKXtcclxuICAgICAgICB0aGlzLmR0ZGxvYmo9SlNPTi5wYXJzZShtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbdGVtcGFsdGVOYW1lXVtcIm9yaWdpbmFsXCJdKVxyXG4gICAgfWVsc2V7XHJcbiAgICAgICAgdGhpcy5kdGRsb2JqID0ge1xyXG4gICAgICAgICAgICBcIkBpZFwiOiBcImR0bWk6YU5hbWVTcGFjZTphTW9kZWxJRDsxXCIsXHJcbiAgICAgICAgICAgIFwiQGNvbnRleHRcIjogW1wiZHRtaTpkdGRsOmNvbnRleHQ7MlwiXSxcclxuICAgICAgICAgICAgXCJAdHlwZVwiOiBcIkludGVyZmFjZVwiLFxyXG4gICAgICAgICAgICBcImRpc3BsYXlOYW1lXCI6IFwiTmV3IE1vZGVsXCIsXHJcbiAgICAgICAgICAgIFwiY29udGVudHNcIjogW1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiQHR5cGVcIjogXCJQcm9wZXJ0eVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwibmFtZVwiOiBcImF0dHJpYnV0ZTFcIixcclxuICAgICAgICAgICAgICAgICAgICBcInNjaGVtYVwiOiBcImRvdWJsZVwiXHJcbiAgICAgICAgICAgICAgICB9LHtcclxuICAgICAgICAgICAgICAgICAgICBcIkB0eXBlXCI6IFwiUmVsYXRpb25zaGlwXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJuYW1lXCI6IFwibGlua1wiXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLmxlZnRTcGFuLmVtcHR5KClcclxuXHJcbiAgICB0aGlzLnJlZnJlc2hEVERMKClcclxuICAgIHRoaXMubGVmdFNwYW4uYXBwZW5kKCQoJzxkaXYgY2xhc3M9XCJ3My1iYXJcIj48ZGl2IGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtdG9vbHRpcFwiIHN0eWxlPVwiZm9udC1zaXplOjEuMmVtO3BhZGRpbmctbGVmdDoycHg7Zm9udC13ZWlnaHQ6Ym9sZDtjb2xvcjpncmF5XCI+TW9kZWwgSUQgJiBOYW1lPHAgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0ZXh0LWFsaWduOmxlZnQ7Zm9udC13ZWlnaHQ6bm9ybWFsO3RvcDotMTBweDt3aWR0aDoyMDBweFwiIGNsYXNzPVwidzMtdGV4dCB3My10YWcgdzMtdGlueVwiPm1vZGVsIElEIGNvbnRhaW5zIG5hbWVzcGFjZSwgYSBtb2RlbCBzdHJpbmcgYW5kIGEgdmVyc2lvbiBudW1iZXI8L3A+PC9kaXY+PC9kaXY+JykpXHJcbiAgICBuZXcgaWRSb3codGhpcy5kdGRsb2JqLHRoaXMubGVmdFNwYW4sKCk9Pnt0aGlzLnJlZnJlc2hEVERMKCl9KVxyXG4gICAgbmV3IGRpc3BsYXlOYW1lUm93KHRoaXMuZHRkbG9iaix0aGlzLmxlZnRTcGFuLCgpPT57dGhpcy5yZWZyZXNoRFRETCgpfSlcclxuXHJcbiAgICBpZighdGhpcy5kdGRsb2JqW1wiY29udGVudHNcIl0pdGhpcy5kdGRsb2JqW1wiY29udGVudHNcIl09W11cclxuICAgIG5ldyBwYXJhbWV0ZXJzUm93KHRoaXMuZHRkbG9ialtcImNvbnRlbnRzXCJdLHRoaXMubGVmdFNwYW4sKCk9Pnt0aGlzLnJlZnJlc2hEVERMKCl9LHRoaXMuRE9NLm9mZnNldCgpKVxyXG4gICAgbmV3IHJlbGF0aW9uc1Jvdyh0aGlzLmR0ZGxvYmpbXCJjb250ZW50c1wiXSx0aGlzLmxlZnRTcGFuLCgpPT57dGhpcy5yZWZyZXNoRFRETCgpfSx0aGlzLkRPTS5vZmZzZXQoKSlcclxuICAgIG5ldyBjb21wb25lbnRzUm93KHRoaXMuZHRkbG9ialtcImNvbnRlbnRzXCJdLHRoaXMubGVmdFNwYW4sKCk9Pnt0aGlzLnJlZnJlc2hEVERMKCl9KVxyXG5cclxuICAgIGlmKCF0aGlzLmR0ZGxvYmpbXCJleHRlbmRzXCJdKXRoaXMuZHRkbG9ialtcImV4dGVuZHNcIl09W11cclxuICAgIG5ldyBiYXNlQ2xhc3Nlc1Jvdyh0aGlzLmR0ZGxvYmpbXCJleHRlbmRzXCJdLHRoaXMubGVmdFNwYW4sKCk9Pnt0aGlzLnJlZnJlc2hEVERMKCl9KVxyXG59XHJcblxyXG5tb2RlbEVkaXRvckRpYWxvZy5wcm90b3R5cGUucmVmcmVzaERUREw9ZnVuY3Rpb24oKXtcclxuICAgIC8vaXQgd2lsbCByZWZyZXNoIHRoZSBnZW5lcmF0ZWQgRFRETCBzYW1wbGUsIGl0IHdpbGwgYWxzbyBjaGFuZ2UgdGhlIGltcG9ydCBidXR0b24gdG8gc2hvdyBcIkNyZWF0ZVwiIG9yIFwiTW9kaWZ5XCJcclxuICAgIHZhciBjdXJyZW50TW9kZWxJRD10aGlzLmR0ZGxvYmpbXCJAaWRcIl1cclxuICAgIGlmKG1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1tjdXJyZW50TW9kZWxJRF09PW51bGwpIHRoaXMuaW1wb3J0QnV0dG9uLnRleHQoXCJDcmVhdGVcIilcclxuICAgIGVsc2UgdGhpcy5pbXBvcnRCdXR0b24udGV4dChcIk1vZGlmeVwiKVxyXG5cclxuXHJcbiAgICB0aGlzLmR0ZGxTY3JpcHRQYW5lbC5lbXB0eSgpXHJcbiAgICB0aGlzLmR0ZGxTY3JpcHRQYW5lbC5hcHBlbmQoJCgnPGRpdiBzdHlsZT1cImhlaWdodDoyMHB4O3dpZHRoOjEwMHB4XCIgY2xhc3M9XCJ3My1iYXIgdzMtZ3JheVwiPkdlbmVyYXRlZCBEVERMPC9kaXY+JykpXHJcbiAgICB0aGlzLmR0ZGxTY3JpcHRQYW5lbC5hcHBlbmQoJCgnPHByZSBzdHlsZT1cImNvbG9yOmdyYXlcIj4nK0pTT04uc3RyaW5naWZ5KHRoaXMuZHRkbG9iaixudWxsLDIpKyc8L3ByZT4nKSlcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBuZXcgbW9kZWxFZGl0b3JEaWFsb2coKTtcclxuXHJcblxyXG5mdW5jdGlvbiBiYXNlQ2xhc3Nlc1JvdyhkdGRsT2JqLHBhcmVudERPTSxyZWZyZXNoRFRETEYpe1xyXG4gICAgdmFyIHJvd0RPTT0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtICB3My10b29sdGlwXCIgc3R5bGU9XCJmb250LXNpemU6MS4yZW07cGFkZGluZy1sZWZ0OjJweDtmb250LXdlaWdodDpib2xkO2NvbG9yOmdyYXlcIj5CYXNlIENsYXNzZXM8cCBzdHlsZT1cInBvc2l0aW9uOmFic29sdXRlO3RleHQtYWxpZ246bGVmdDt0b3A6LTEwcHg7Zm9udC13ZWlnaHQ6bm9ybWFsO3dpZHRoOjIwMHB4XCIgY2xhc3M9XCJ3My10ZXh0IHczLXRhZyB3My10aW55XCI+QmFzZSBjbGFzcyBtb2RlbFxcJ3MgcGFyYW1ldGVycyBhbmQgcmVsYXRpb25zaGlwIHR5cGUgYXJlIGluaGVyaXRlZDwvcD48L2Rpdj48L2Rpdj4nKVxyXG5cclxuICAgIHZhciBhZGRCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJlZCB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwibWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6NHB4XCI+KzwvYnV0dG9uPicpXHJcbiAgICByb3dET00uYXBwZW5kKGFkZEJ1dHRvbilcclxuICAgIHBhcmVudERPTS5hcHBlbmQocm93RE9NKVxyXG4gICAgdmFyIGNvbnRlbnRET009JCgnPGRpdiBzdHlsZT1cInBhZGRpbmctbGVmdDoxMHB4XCI+PC9kaXY+JylcclxuICAgIHJvd0RPTS5hcHBlbmQoY29udGVudERPTSlcclxuICAgIGFkZEJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICB2YXIgbmV3T2JqID0gXCJ1bmtub3duXCJcclxuICAgICAgICBkdGRsT2JqLnB1c2gobmV3T2JqKVxyXG4gICAgICAgIG5ldyBzaW5nbGVCYXNlY2xhc3NSb3cobmV3T2JqLGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmopXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcbiAgICAvL2NoZWNrIGV4aXN0ZWQgY29udGVudCBpbml0aWFsbHkgZnJvbSB0ZW1wbGF0ZSBhbmQgdHJpZ2dlciB0aGVpciBkcmF3aW5nXHJcbiAgICBkdGRsT2JqLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgbmV3IHNpbmdsZUJhc2VjbGFzc1JvdyhlbGVtZW50LGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmopXHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2luZ2xlQmFzZWNsYXNzUm93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRixwYXJlbnREdGRsT2JqKXtcclxuICAgIHZhciBET00gPSAkKCc8ZGl2IGNsYXNzPVwidzMtY2VsbC1yb3dcIj48L2Rpdj4nKVxyXG4gICAgdmFyIGJhc2VDbGFzc05hbWVJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDoyMjBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cImJhc2UgbW9kZWwgaWRcIi8+JykuYWRkQ2xhc3MoXCJ3My1iYXItaXRlbSB3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICB2YXIgcmVtb3ZlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwiY29sb3I6Z3JheTttYXJnaW4tbGVmdDozcHg7bWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6MnB4XCI+PGkgY2xhc3M9XCJmYSBmYS10cmFzaCBmYS1sZ1wiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgRE9NLmFwcGVuZChiYXNlQ2xhc3NOYW1lSW5wdXQscmVtb3ZlQnV0dG9uKVxyXG5cclxuICAgIHJlbW92ZUJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICBmb3IgKHZhciBpID0wO2k8IHBhcmVudER0ZGxPYmoubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHBhcmVudER0ZGxPYmpbaV0gPT0gZHRkbE9iaikge1xyXG4gICAgICAgICAgICAgICAgcGFyZW50RHRkbE9iai5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBET00ucmVtb3ZlKClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuXHJcbiAgICBwYXJlbnRET00uYXBwZW5kKERPTSlcclxuXHJcbiAgICBiYXNlQ2xhc3NOYW1lSW5wdXQudmFsKGR0ZGxPYmopXHJcbiAgICBiYXNlQ2xhc3NOYW1lSW5wdXQub24oXCJjaGFuZ2VcIiwoKT0+e1xyXG4gICAgICAgIGZvciAodmFyIGkgPTA7aTwgcGFyZW50RHRkbE9iai5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAocGFyZW50RHRkbE9ialtpXSA9PSBkdGRsT2JqKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnREdGRsT2JqW2ldPWJhc2VDbGFzc05hbWVJbnB1dC52YWwoKVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNvbXBvbmVudHNSb3coZHRkbE9iaixwYXJlbnRET00scmVmcmVzaERURExGKXtcclxuICAgIHZhciByb3dET009JCgnPGRpdiBjbGFzcz1cInczLWJhclwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbSAgdzMtdG9vbHRpcFwiIHN0eWxlPVwiZm9udC1zaXplOjEuMmVtO3BhZGRpbmctbGVmdDoycHg7Zm9udC13ZWlnaHQ6Ym9sZDtjb2xvcjpncmF5XCI+Q29tcG9uZW50czxwIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dGV4dC1hbGlnbjpsZWZ0O3RvcDotMTBweDtmb250LXdlaWdodDpub3JtYWw7d2lkdGg6MjAwcHhcIiBjbGFzcz1cInczLXRleHQgdzMtdGFnIHczLXRpbnlcIj5Db21wb25lbnQgbW9kZWxcXCdzIHBhcmFtZXRlcnMgYXJlIGVtYmVkZGVkIHVuZGVyIGEgbmFtZTwvcD48L2Rpdj48L2Rpdj4nKVxyXG5cclxuICAgIHZhciBhZGRCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJlZCB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwibWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6NHB4XCI+KzwvYnV0dG9uPicpXHJcbiAgICByb3dET00uYXBwZW5kKGFkZEJ1dHRvbilcclxuICAgIHBhcmVudERPTS5hcHBlbmQocm93RE9NKVxyXG4gICAgdmFyIGNvbnRlbnRET009JCgnPGRpdiBzdHlsZT1cInBhZGRpbmctbGVmdDoxMHB4XCI+PC9kaXY+JylcclxuICAgIHJvd0RPTS5hcHBlbmQoY29udGVudERPTSlcclxuXHJcbiAgICBhZGRCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgdmFyIG5ld09iaiA9IHtcclxuICAgICAgICAgICAgXCJAdHlwZVwiOiBcIkNvbXBvbmVudFwiLFxyXG4gICAgICAgICAgICBcIm5hbWVcIjogXCJTb21lQ29tcG9uZW50XCIsXHJcbiAgICAgICAgICAgIFwic2NoZW1hXCI6XCJkdG1pOnNvbWVDb21wb25lbnRNb2RlbDsxXCJcclxuICAgICAgICB9XHJcbiAgICAgICAgZHRkbE9iai5wdXNoKG5ld09iailcclxuICAgICAgICBuZXcgc2luZ2xlQ29tcG9uZW50Um93KG5ld09iaixjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgLy9jaGVjayBleGlzdGVkIGNvbnRlbnQgaW5pdGlhbGx5IGZyb20gdGVtcGxhdGUgYW5kIHRyaWdnZXIgdGhlaXIgZHJhd2luZ1xyXG4gICAgZHRkbE9iai5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgIGlmKGVsZW1lbnRbXCJAdHlwZVwiXSE9XCJDb21wb25lbnRcIikgcmV0dXJuXHJcbiAgICAgICAgbmV3IHNpbmdsZUNvbXBvbmVudFJvdyhlbGVtZW50LGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmopXHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2luZ2xlQ29tcG9uZW50Um93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRixwYXJlbnREdGRsT2JqKXtcclxuICAgIHZhciBET00gPSAkKCc8ZGl2IGNsYXNzPVwidzMtY2VsbC1yb3dcIj48L2Rpdj4nKVxyXG4gICAgdmFyIGNvbXBvbmVudE5hbWVJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDoxMDBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cImNvbXBvbmVudCBuYW1lXCIvPicpLmFkZENsYXNzKFwidzMtYmFyLWl0ZW0gdzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgdmFyIHNjaGVtYUlucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjE2MHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwiY29tcG9uZW50IG1vZGVsIGlkLi4uXCIvPicpLmFkZENsYXNzKFwidzMtYmFyLWl0ZW0gdzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgdmFyIHJlbW92ZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cImNvbG9yOmdyYXk7bWFyZ2luLWxlZnQ6M3B4O21hcmdpbi10b3A6MnB4O2ZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjJweFwiPjxpIGNsYXNzPVwiZmEgZmEtdHJhc2ggZmEtbGdcIj48L2k+PC9idXR0b24+JylcclxuICAgIERPTS5hcHBlbmQoY29tcG9uZW50TmFtZUlucHV0LHNjaGVtYUlucHV0LHJlbW92ZUJ1dHRvbilcclxuXHJcbiAgICByZW1vdmVCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgZm9yICh2YXIgaSA9MDtpPCBwYXJlbnREdGRsT2JqLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChwYXJlbnREdGRsT2JqW2ldID09PSBkdGRsT2JqKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnREdGRsT2JqLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIERPTS5yZW1vdmUoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG5cclxuICAgIHBhcmVudERPTS5hcHBlbmQoRE9NKVxyXG5cclxuICAgIGNvbXBvbmVudE5hbWVJbnB1dC52YWwoZHRkbE9ialtcIm5hbWVcIl0pXHJcbiAgICBzY2hlbWFJbnB1dC52YWwoZHRkbE9ialtcInNjaGVtYVwiXXx8XCJcIilcclxuXHJcbiAgICBjb21wb25lbnROYW1lSW5wdXQub24oXCJjaGFuZ2VcIiwoKT0+e1xyXG4gICAgICAgIGR0ZGxPYmpbXCJuYW1lXCJdPWNvbXBvbmVudE5hbWVJbnB1dC52YWwoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgc2NoZW1hSW5wdXQub24oXCJjaGFuZ2VcIiwoKT0+e1xyXG4gICAgICAgIGR0ZGxPYmpbXCJzY2hlbWFcIl09c2NoZW1hSW5wdXQudmFsKClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxufVxyXG5cclxuZnVuY3Rpb24gcmVsYXRpb25zUm93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRixkaWFsb2dPZmZzZXQpe1xyXG4gICAgdmFyIHJvd0RPTT0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtIHczLXRvb2x0aXBcIiBzdHlsZT1cImZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nLWxlZnQ6MnB4O2ZvbnQtd2VpZ2h0OmJvbGQ7Y29sb3I6Z3JheVwiPlJlbGF0aW9uc2hpcCBUeXBlczxwIHN0eWxlPVwicG9zaXRpb246YWJzb2x1dGU7dGV4dC1hbGlnbjpsZWZ0O3RvcDotMTBweDtmb250LXdlaWdodDpub3JtYWw7d2lkdGg6MjAwcHhcIiBjbGFzcz1cInczLXRleHQgdzMtdGFnIHczLXRpbnlcIj5SZWxhdGlvbnNoaXAgY2FuIGhhdmUgaXRzIG93biBwYXJhbWV0ZXJzPC9wPjwvZGl2PjwvZGl2PicpXHJcblxyXG5cclxuICAgIHZhciBhZGRCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJlZCB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwibWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6NHB4XCI+KzwvYnV0dG9uPicpXHJcbiAgICByb3dET00uYXBwZW5kKGFkZEJ1dHRvbilcclxuICAgIHBhcmVudERPTS5hcHBlbmQocm93RE9NKVxyXG4gICAgdmFyIGNvbnRlbnRET009JCgnPGRpdiBzdHlsZT1cInBhZGRpbmctbGVmdDoxMHB4XCI+PC9kaXY+JylcclxuICAgIHJvd0RPTS5hcHBlbmQoY29udGVudERPTSlcclxuXHJcbiAgICBhZGRCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgdmFyIG5ld09iaiA9IHtcclxuICAgICAgICAgICAgXCJAdHlwZVwiOiBcIlJlbGF0aW9uc2hpcFwiLFxyXG4gICAgICAgICAgICBcIm5hbWVcIjogXCJyZWxhdGlvbjFcIixcclxuICAgICAgICB9XHJcbiAgICAgICAgZHRkbE9iai5wdXNoKG5ld09iailcclxuICAgICAgICBuZXcgc2luZ2xlUmVsYXRpb25UeXBlUm93KG5ld09iaixjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqLGRpYWxvZ09mZnNldClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuXHJcbiAgICAvL2NoZWNrIGV4aXN0ZWQgY29udGVudCBpbml0aWFsbHkgZnJvbSB0ZW1wbGF0ZSBhbmQgdHJpZ2dlciB0aGVpciBkcmF3aW5nXHJcbiAgICBkdGRsT2JqLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgaWYoZWxlbWVudFtcIkB0eXBlXCJdIT1cIlJlbGF0aW9uc2hpcFwiKSByZXR1cm5cclxuICAgICAgICBuZXcgc2luZ2xlUmVsYXRpb25UeXBlUm93KGVsZW1lbnQsY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9iaixkaWFsb2dPZmZzZXQpXHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2luZ2xlUmVsYXRpb25UeXBlUm93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRixwYXJlbnREdGRsT2JqLGRpYWxvZ09mZnNldCl7XHJcbiAgICB2YXIgRE9NID0gJCgnPGRpdiBjbGFzcz1cInczLWNlbGwtcm93XCI+PC9kaXY+JylcclxuICAgIHZhciByZWxhdGlvbk5hbWVJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDo5MHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwicmVsYXRpb24gbmFtZVwiLz4nKS5hZGRDbGFzcyhcInczLWJhci1pdGVtIHczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIHZhciB0YXJnZXRNb2RlbElEPSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjE0MHB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwiKG9wdGlvbmFsKXRhcmdldCBtb2RlbFwiLz4nKS5hZGRDbGFzcyhcInczLWJhci1pdGVtIHczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIHZhciBhZGRCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLWhvdmVyLWFtYmVyXCIgc3R5bGU9XCJjb2xvcjpncmF5O21hcmdpbi1sZWZ0OjNweDttYXJnaW4tdG9wOjJweDtmb250LXNpemU6MS4yZW07cGFkZGluZzoycHhcIj48aSBjbGFzcz1cImZhIGZhLWNvZyBmYS1sZ1wiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgdmFyIHJlbW92ZUJ1dHRvbiA9ICQoJzxidXR0b24gY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b24gdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cImNvbG9yOmdyYXk7bWFyZ2luLWxlZnQ6M3B4O21hcmdpbi10b3A6MnB4O2ZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjJweFwiPjxpIGNsYXNzPVwiZmEgZmEtdHJhc2ggZmEtbGdcIj48L2k+PC9idXR0b24+JylcclxuICAgIERPTS5hcHBlbmQocmVsYXRpb25OYW1lSW5wdXQsdGFyZ2V0TW9kZWxJRCxhZGRCdXR0b24scmVtb3ZlQnV0dG9uKVxyXG5cclxuICAgIHJlbW92ZUJ1dHRvbi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICBmb3IgKHZhciBpID0wO2k8IHBhcmVudER0ZGxPYmoubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKHBhcmVudER0ZGxPYmpbaV0gPT09IGR0ZGxPYmopIHtcclxuICAgICAgICAgICAgICAgIHBhcmVudER0ZGxPYmouc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgRE9NLnJlbW92ZSgpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcblxyXG4gICAgdmFyIGNvbnRlbnRET009JCgnPGRpdiBzdHlsZT1cInBhZGRpbmctbGVmdDoxMHB4XCI+PC9kaXY+JylcclxuICAgIERPTS5hcHBlbmQoY29udGVudERPTSlcclxuICAgIHBhcmVudERPTS5hcHBlbmQoRE9NKVxyXG5cclxuICAgIHJlbGF0aW9uTmFtZUlucHV0LnZhbChkdGRsT2JqW1wibmFtZVwiXSlcclxuICAgIHRhcmdldE1vZGVsSUQudmFsKGR0ZGxPYmpbXCJ0YXJnZXRcIl18fFwiXCIpXHJcblxyXG4gICAgYWRkQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIGlmKCEgZHRkbE9ialtcInByb3BlcnRpZXNcIl0pIGR0ZGxPYmpbXCJwcm9wZXJ0aWVzXCJdPVtdXHJcbiAgICAgICAgdmFyIG5ld09iaiA9IHtcclxuICAgICAgICAgICAgXCJuYW1lXCI6IFwibmV3UFwiLFxyXG4gICAgICAgICAgICBcInNjaGVtYVwiOiBcImRvdWJsZVwiXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGR0ZGxPYmpbXCJwcm9wZXJ0aWVzXCJdLnB1c2gobmV3T2JqKVxyXG4gICAgICAgIG5ldyBzaW5nbGVQYXJhbWV0ZXJSb3cobmV3T2JqLGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmpbXCJwcm9wZXJ0aWVzXCJdLG51bGwsZGlhbG9nT2Zmc2V0KVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG5cclxuICAgIHJlbGF0aW9uTmFtZUlucHV0Lm9uKFwiY2hhbmdlXCIsKCk9PntcclxuICAgICAgICBkdGRsT2JqW1wibmFtZVwiXT1yZWxhdGlvbk5hbWVJbnB1dC52YWwoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgdGFyZ2V0TW9kZWxJRC5vbihcImNoYW5nZVwiLCgpPT57XHJcbiAgICAgICAgaWYodGFyZ2V0TW9kZWxJRC52YWwoKT09XCJcIikgZGVsZXRlIGR0ZGxPYmpbXCJ0YXJnZXRcIl1cclxuICAgICAgICBlbHNlIGR0ZGxPYmpbXCJ0YXJnZXRcIl09dGFyZ2V0TW9kZWxJRC52YWwoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgaWYoZHRkbE9ialtcInByb3BlcnRpZXNcIl0gJiYgZHRkbE9ialtcInByb3BlcnRpZXNcIl0ubGVuZ3RoPjApe1xyXG4gICAgICAgIHZhciBwcm9wZXJ0aWVzPWR0ZGxPYmpbXCJwcm9wZXJ0aWVzXCJdXHJcbiAgICAgICAgcHJvcGVydGllcy5mb3JFYWNoKG9uZVByb3BlcnR5PT57XHJcbiAgICAgICAgICAgIG5ldyBzaW5nbGVQYXJhbWV0ZXJSb3cob25lUHJvcGVydHksY29udGVudERPTSxyZWZyZXNoRFRETEYsZHRkbE9ialtcInByb3BlcnRpZXNcIl0sbnVsbCxkaWFsb2dPZmZzZXQpXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gcGFyYW1ldGVyc1JvdyhkdGRsT2JqLHBhcmVudERPTSxyZWZyZXNoRFRETEYsZGlhbG9nT2Zmc2V0KXtcclxuICAgIHZhciByb3dET009JCgnPGRpdiBjbGFzcz1cInczLWJhclwiPjxkaXYgY2xhc3M9XCJ3My1iYXItaXRlbVwiIHN0eWxlPVwiZm9udC1zaXplOjEuMmVtO3BhZGRpbmctbGVmdDoycHg7Zm9udC13ZWlnaHQ6Ym9sZDtjb2xvcjpncmF5XCI+UGFyYW1ldGVyczwvZGl2PjwvZGl2PicpXHJcbiAgICB2YXIgYWRkQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yZWQgdzMtaG92ZXItYW1iZXJcIiBzdHlsZT1cIm1hcmdpbi10b3A6MnB4O2ZvbnQtc2l6ZToxLjJlbTtwYWRkaW5nOjRweFwiPis8L2J1dHRvbj4nKVxyXG4gICAgcm93RE9NLmFwcGVuZChhZGRCdXR0b24pXHJcbiAgICBwYXJlbnRET00uYXBwZW5kKHJvd0RPTSlcclxuICAgIHZhciBjb250ZW50RE9NPSQoJzxkaXYgc3R5bGU9XCJwYWRkaW5nLWxlZnQ6MTBweFwiPjwvZGl2PicpXHJcbiAgICByb3dET00uYXBwZW5kKGNvbnRlbnRET00pXHJcbiAgICBhZGRCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgdmFyIG5ld09iaiA9IHtcclxuICAgICAgICAgICAgXCJAdHlwZVwiOiBcIlByb3BlcnR5XCIsXHJcbiAgICAgICAgICAgIFwibmFtZVwiOiBcIm5ld1BcIixcclxuICAgICAgICAgICAgXCJzY2hlbWFcIjogXCJkb3VibGVcIlxyXG4gICAgICAgIH1cclxuICAgICAgICBkdGRsT2JqLnB1c2gobmV3T2JqKVxyXG4gICAgICAgIG5ldyBzaW5nbGVQYXJhbWV0ZXJSb3cobmV3T2JqLGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmosXCJ0b3BMZXZlbFwiLGRpYWxvZ09mZnNldClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuXHJcbiAgICAvL2NoZWNrIGV4aXN0ZWQgY29udGVudCBpbml0aWFsbHkgZnJvbSB0ZW1wbGF0ZSBhbmQgdHJpZ2dlciB0aGVpciBkcmF3aW5nXHJcbiAgICBkdGRsT2JqLmZvckVhY2goZWxlbWVudCA9PiB7XHJcbiAgICAgICAgaWYoZWxlbWVudFtcIkB0eXBlXCJdIT1cIlByb3BlcnR5XCIpIHJldHVyblxyXG4gICAgICAgIG5ldyBzaW5nbGVQYXJhbWV0ZXJSb3coZWxlbWVudCxjb250ZW50RE9NLHJlZnJlc2hEVERMRixkdGRsT2JqLFwidG9wTGV2ZWxcIixkaWFsb2dPZmZzZXQpXHJcbiAgICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gc2luZ2xlUGFyYW1ldGVyUm93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRixwYXJlbnREdGRsT2JqLHRvcExldmVsLGRpYWxvZ09mZnNldCl7XHJcbiAgICB2YXIgRE9NID0gJCgnPGRpdiBjbGFzcz1cInczLWNlbGwtcm93XCI+PC9kaXY+JylcclxuICAgIHZhciBwYXJhbWV0ZXJOYW1lSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmU7d2lkdGg6MTAwcHg7cGFkZGluZzo0cHhcIiAgcGxhY2Vob2xkZXI9XCJwYXJhbWV0ZXIgbmFtZVwiLz4nKS5hZGRDbGFzcyhcInczLWJhci1pdGVtIHczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIHZhciBlbnVtVmFsdWVJbnB1dD0kKCc8aW5wdXQgdHlwZT1cInRleHRcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTtkaXNwbGF5OmlubGluZTt3aWR0aDoxMDBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cInN0cjEsc3RyMiwuLi5cIi8+JykuYWRkQ2xhc3MoXCJ3My1iYXItaXRlbSB3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICB2YXIgYWRkQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwiY29sb3I6Z3JheTttYXJnaW4tbGVmdDozcHg7bWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6MnB4XCI+PGkgY2xhc3M9XCJmYSBmYS1wbHVzIGZhLWxnXCI+PC9pPjwvYnV0dG9uPicpXHJcbiAgICB2YXIgcmVtb3ZlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1ob3Zlci1hbWJlclwiIHN0eWxlPVwiY29sb3I6Z3JheTttYXJnaW4tbGVmdDozcHg7bWFyZ2luLXRvcDoycHg7Zm9udC1zaXplOjEuMmVtO3BhZGRpbmc6MnB4XCI+PGkgY2xhc3M9XCJmYSBmYS10cmFzaCBmYS1sZ1wiPjwvaT48L2J1dHRvbj4nKVxyXG4gICAgdmFyIHB0eXBlU2VsZWN0b3I9bmV3IHNpbXBsZVNlbGVjdE1lbnUoXCIgXCIse3dpdGhCb3JkZXI6MSxmb250U2l6ZTpcIjFlbVwiLGNvbG9yQ2xhc3M6XCJ3My1saWdodC1ncmF5IHczLWJhci1pdGVtXCIsYnV0dG9uQ1NTOntcInBhZGRpbmdcIjpcIjRweCA1cHhcIn0sXCJvcHRpb25MaXN0SGVpZ2h0XCI6MzAwLFwiaXNDbGlja2FibGVcIjoxXHJcbiAgICAsXCJvcHRpb25MaXN0TWFyZ2luVG9wXCI6LTE1MCxcIm9wdGlvbkxpc3RNYXJnaW5MZWZ0XCI6NjAsXCJhZGp1c3RQb3NpdGlvbkFuY2hvclwiOmRpYWxvZ09mZnNldH0pXHJcbiAgICBcclxuXHJcbiAgICBwdHlwZVNlbGVjdG9yLmFkZE9wdGlvbkFycihbXCJzdHJpbmdcIixcImZsb2F0XCIsXCJpbnRlZ2VyXCIsXCJFbnVtXCIsXCJPYmplY3RcIixcImRvdWJsZVwiLFwiYm9vbGVhblwiLFwiZGF0ZVwiLFwiZGF0ZVRpbWVcIixcImR1cmF0aW9uXCIsXCJsb25nXCIsXCJ0aW1lXCJdKVxyXG4gICAgRE9NLmFwcGVuZChwYXJhbWV0ZXJOYW1lSW5wdXQscHR5cGVTZWxlY3Rvci5ET00sZW51bVZhbHVlSW5wdXQsYWRkQnV0dG9uLHJlbW92ZUJ1dHRvbilcclxuXHJcbiAgICByZW1vdmVCdXR0b24ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgZm9yICh2YXIgaSA9MDtpPCBwYXJlbnREdGRsT2JqLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChwYXJlbnREdGRsT2JqW2ldID09PSBkdGRsT2JqKSB7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnREdGRsT2JqLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIERPTS5yZW1vdmUoKVxyXG4gICAgICAgIHJlZnJlc2hEVERMRigpXHJcbiAgICB9KVxyXG4gICAgXHJcbiAgICB2YXIgY29udGVudERPTT0kKCc8ZGl2IHN0eWxlPVwicGFkZGluZy1sZWZ0OjEwcHhcIj48L2Rpdj4nKVxyXG4gICAgRE9NLmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgcGFyZW50RE9NLmFwcGVuZChET00pXHJcblxyXG4gICAgcGFyYW1ldGVyTmFtZUlucHV0LnZhbChkdGRsT2JqW1wibmFtZVwiXSlcclxuICAgIHB0eXBlU2VsZWN0b3IuY2FsbEJhY2tfY2xpY2tPcHRpb249KG9wdGlvblRleHQsb3B0aW9uVmFsdWUscmVhbE1vdXNlQ2xpY2spPT57XHJcbiAgICAgICAgcHR5cGVTZWxlY3Rvci5jaGFuZ2VOYW1lKG9wdGlvblRleHQpXHJcbiAgICAgICAgY29udGVudERPTS5lbXB0eSgpLy9jbGVhciBhbGwgY29udGVudCBkb20gY29udGVudFxyXG4gICAgICAgIGlmKHJlYWxNb3VzZUNsaWNrKXtcclxuICAgICAgICAgICAgZm9yKHZhciBpbmQgaW4gZHRkbE9iaikgZGVsZXRlIGR0ZGxPYmpbaW5kXSAgICAvL2NsZWFyIGFsbCBvYmplY3QgY29udGVudFxyXG4gICAgICAgICAgICBpZih0b3BMZXZlbCkgZHRkbE9ialtcIkB0eXBlXCJdPVwiUHJvcGVydHlcIlxyXG4gICAgICAgICAgICBkdGRsT2JqW1wibmFtZVwiXT1wYXJhbWV0ZXJOYW1lSW5wdXQudmFsKClcclxuICAgICAgICB9IFxyXG4gICAgICAgIGlmKG9wdGlvblRleHQ9PVwiRW51bVwiKXtcclxuICAgICAgICAgICAgZW51bVZhbHVlSW5wdXQudmFsKFwiXCIpXHJcbiAgICAgICAgICAgIGVudW1WYWx1ZUlucHV0LnNob3coKTtcclxuICAgICAgICAgICAgYWRkQnV0dG9uLmhpZGUoKVxyXG4gICAgICAgICAgICBpZihyZWFsTW91c2VDbGljaykgZHRkbE9ialtcInNjaGVtYVwiXT17XCJAdHlwZVwiOiBcIkVudW1cIixcInZhbHVlU2NoZW1hXCI6IFwic3RyaW5nXCJ9XHJcbiAgICAgICAgfWVsc2UgaWYob3B0aW9uVGV4dD09XCJPYmplY3RcIil7XHJcbiAgICAgICAgICAgIGVudW1WYWx1ZUlucHV0LmhpZGUoKTtcclxuICAgICAgICAgICAgYWRkQnV0dG9uLnNob3coKVxyXG4gICAgICAgICAgICBpZihyZWFsTW91c2VDbGljaykgZHRkbE9ialtcInNjaGVtYVwiXT17XCJAdHlwZVwiOiBcIk9iamVjdFwifVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBpZihyZWFsTW91c2VDbGljaykgZHRkbE9ialtcInNjaGVtYVwiXT1vcHRpb25UZXh0XHJcbiAgICAgICAgICAgIGVudW1WYWx1ZUlucHV0LmhpZGUoKTtcclxuICAgICAgICAgICAgYWRkQnV0dG9uLmhpZGUoKVxyXG4gICAgICAgIH1cclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfVxyXG4gICAgYWRkQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIGlmKCEgZHRkbE9ialtcInNjaGVtYVwiXVtcImZpZWxkc1wiXSkgZHRkbE9ialtcInNjaGVtYVwiXVtcImZpZWxkc1wiXT1bXVxyXG4gICAgICAgIHZhciBuZXdPYmogPSB7XHJcbiAgICAgICAgICAgIFwibmFtZVwiOiBcIm5ld1BcIixcclxuICAgICAgICAgICAgXCJzY2hlbWFcIjogXCJkb3VibGVcIlxyXG4gICAgICAgIH1cclxuICAgICAgICBkdGRsT2JqW1wic2NoZW1hXCJdW1wiZmllbGRzXCJdLnB1c2gobmV3T2JqKVxyXG4gICAgICAgIG5ldyBzaW5nbGVQYXJhbWV0ZXJSb3cobmV3T2JqLGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmpbXCJzY2hlbWFcIl1bXCJmaWVsZHNcIl0sbnVsbCxkaWFsb2dPZmZzZXQpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcblxyXG4gICAgcGFyYW1ldGVyTmFtZUlucHV0Lm9uKFwiY2hhbmdlXCIsKCk9PntcclxuICAgICAgICBkdGRsT2JqW1wibmFtZVwiXT1wYXJhbWV0ZXJOYW1lSW5wdXQudmFsKClcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfSlcclxuICAgIGVudW1WYWx1ZUlucHV0Lm9uKFwiY2hhbmdlXCIsKCk9PntcclxuICAgICAgICB2YXIgdmFsdWVBcnI9ZW51bVZhbHVlSW5wdXQudmFsKCkuc3BsaXQoXCIsXCIpXHJcbiAgICAgICAgZHRkbE9ialtcInNjaGVtYVwiXVtcImVudW1WYWx1ZXNcIl09W11cclxuICAgICAgICB2YWx1ZUFyci5mb3JFYWNoKGFWYWw9PntcclxuICAgICAgICAgICAgZHRkbE9ialtcInNjaGVtYVwiXVtcImVudW1WYWx1ZXNcIl0ucHVzaCh7XHJcbiAgICAgICAgICAgICAgICBcIm5hbWVcIjogYVZhbC5yZXBsYWNlKFwiIFwiLFwiXCIpLCAvL3JlbW92ZSBhbGwgdGhlIHNwYWNlIGluIG5hbWVcclxuICAgICAgICAgICAgICAgIFwiZW51bVZhbHVlXCI6IGFWYWxcclxuICAgICAgICAgICAgICB9KVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH0pXHJcbiAgICBpZih0eXBlb2YoZHRkbE9ialtcInNjaGVtYVwiXSkgIT0gJ29iamVjdCcpIHZhciBzY2hlbWE9ZHRkbE9ialtcInNjaGVtYVwiXVxyXG4gICAgZWxzZSBzY2hlbWE9ZHRkbE9ialtcInNjaGVtYVwiXVtcIkB0eXBlXCJdXHJcbiAgICBwdHlwZVNlbGVjdG9yLnRyaWdnZXJPcHRpb25WYWx1ZShzY2hlbWEpXHJcbiAgICBpZihzY2hlbWE9PVwiRW51bVwiKXtcclxuICAgICAgICB2YXIgZW51bUFycj1kdGRsT2JqW1wic2NoZW1hXCJdW1wiZW51bVZhbHVlc1wiXVxyXG4gICAgICAgIGlmKGVudW1BcnIhPW51bGwpe1xyXG4gICAgICAgICAgICB2YXIgaW5wdXRTdHI9XCJcIlxyXG4gICAgICAgICAgICBlbnVtQXJyLmZvckVhY2gob25lRW51bVZhbHVlPT57aW5wdXRTdHIrPW9uZUVudW1WYWx1ZS5lbnVtVmFsdWUrXCIsXCJ9KVxyXG4gICAgICAgICAgICBpbnB1dFN0cj1pbnB1dFN0ci5zbGljZSgwLCAtMSkvL3JlbW92ZSB0aGUgbGFzdCBcIixcIlxyXG4gICAgICAgICAgICBlbnVtVmFsdWVJbnB1dC52YWwoaW5wdXRTdHIpXHJcbiAgICAgICAgfVxyXG4gICAgfWVsc2UgaWYoc2NoZW1hPT1cIk9iamVjdFwiKXtcclxuICAgICAgICB2YXIgZmllbGRzPWR0ZGxPYmpbXCJzY2hlbWFcIl1bXCJmaWVsZHNcIl1cclxuICAgICAgICBmaWVsZHMuZm9yRWFjaChvbmVGaWVsZD0+e1xyXG4gICAgICAgICAgICBuZXcgc2luZ2xlUGFyYW1ldGVyUm93KG9uZUZpZWxkLGNvbnRlbnRET00scmVmcmVzaERURExGLGR0ZGxPYmpbXCJzY2hlbWFcIl1bXCJmaWVsZHNcIl0sbnVsbCxkaWFsb2dPZmZzZXQpXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxufVxyXG5cclxuXHJcbmZ1bmN0aW9uIGlkUm93KGR0ZGxPYmoscGFyZW50RE9NLHJlZnJlc2hEVERMRil7XHJcbiAgICB2YXIgRE9NID0gJCgnPGRpdiBjbGFzcz1cInczLWNlbGwtcm93XCI+PC9kaXY+JylcclxuICAgIHZhciBsYWJlbDE9JCgnPGRpdiBjbGFzcz1cInczLW9wYWNpdHlcIiBzdHlsZT1cImRpc3BsYXk6aW5saW5lXCI+ZHRtaTo8L2Rpdj4nKVxyXG4gICAgdmFyIGRvbWFpbklucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjg4cHg7cGFkZGluZzo0cHhcIiAgcGxhY2Vob2xkZXI9XCJOYW1lc3BhY2VcIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICB2YXIgbW9kZWxJRElucHV0PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiIHN0eWxlPVwib3V0bGluZTpub25lO2Rpc3BsYXk6aW5saW5lO3dpZHRoOjEzMnB4O3BhZGRpbmc6NHB4XCIgIHBsYWNlaG9sZGVyPVwiTW9kZWxJRFwiLz4nKS5hZGRDbGFzcyhcInczLWlucHV0IHczLWJvcmRlclwiKTtcclxuICAgIHZhciB2ZXJzaW9uSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmU7d2lkdGg6NjBweDtwYWRkaW5nOjRweFwiICBwbGFjZWhvbGRlcj1cInZlcnNpb25cIi8+JykuYWRkQ2xhc3MoXCJ3My1pbnB1dCB3My1ib3JkZXJcIik7XHJcbiAgICBET00uYXBwZW5kKGxhYmVsMSxkb21haW5JbnB1dCwkKCc8ZGl2IGNsYXNzPVwidzMtb3BhY2l0eVwiIHN0eWxlPVwiZGlzcGxheTppbmxpbmVcIj46PC9kaXY+JyksbW9kZWxJRElucHV0LCQoJzxkaXYgY2xhc3M9XCJ3My1vcGFjaXR5XCIgc3R5bGU9XCJkaXNwbGF5OmlubGluZVwiPjs8L2Rpdj4nKSx2ZXJzaW9uSW5wdXQpXHJcbiAgICBwYXJlbnRET00uYXBwZW5kKERPTSlcclxuXHJcbiAgICB2YXIgdmFsdWVDaGFuZ2U9KCk9PntcclxuICAgICAgICB2YXIgc3RyPWBkdG1pOiR7ZG9tYWluSW5wdXQudmFsKCl9OiR7bW9kZWxJRElucHV0LnZhbCgpfTske3ZlcnNpb25JbnB1dC52YWwoKX1gXHJcbiAgICAgICAgZHRkbE9ialtcIkBpZFwiXT1zdHJcclxuICAgICAgICByZWZyZXNoRFRETEYoKVxyXG4gICAgfVxyXG4gICAgZG9tYWluSW5wdXQub24oXCJjaGFuZ2VcIix2YWx1ZUNoYW5nZSlcclxuICAgIG1vZGVsSURJbnB1dC5vbihcImNoYW5nZVwiLHZhbHVlQ2hhbmdlKVxyXG4gICAgdmVyc2lvbklucHV0Lm9uKFwiY2hhbmdlXCIsdmFsdWVDaGFuZ2UpXHJcblxyXG4gICAgdmFyIHN0cj1kdGRsT2JqW1wiQGlkXCJdXHJcbiAgICBpZihzdHIhPVwiXCIgJiYgc3RyIT1udWxsKXtcclxuICAgICAgICB2YXIgYXJyMT1zdHIuc3BsaXQoXCI7XCIpXHJcbiAgICAgICAgaWYoYXJyMS5sZW5ndGghPTIpIHJldHVybjtcclxuICAgICAgICB2ZXJzaW9uSW5wdXQudmFsKGFycjFbMV0pXHJcbiAgICAgICAgdmFyIGFycjI9YXJyMVswXS5zcGxpdChcIjpcIilcclxuICAgICAgICBkb21haW5JbnB1dC52YWwoYXJyMlsxXSlcclxuICAgICAgICBhcnIyLnNoaWZ0KCk7IGFycjIuc2hpZnQoKVxyXG4gICAgICAgIG1vZGVsSURJbnB1dC52YWwoYXJyMi5qb2luKFwiOlwiKSlcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZGlzcGxheU5hbWVSb3coZHRkbE9iaixwYXJlbnRET00scmVmcmVzaERURExGKXtcclxuICAgIHZhciBET00gPSAkKCc8ZGl2IGNsYXNzPVwidzMtY2VsbC1yb3dcIj48L2Rpdj4nKVxyXG4gICAgdmFyIGxhYmVsMT0kKCc8ZGl2IGNsYXNzPVwidzMtb3BhY2l0eVwiIHN0eWxlPVwiZGlzcGxheTppbmxpbmVcIj5EaXNwbGF5IE5hbWU6PC9kaXY+JylcclxuICAgIHZhciBuYW1lSW5wdXQ9JCgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7ZGlzcGxheTppbmxpbmU7d2lkdGg6MTUwcHg7cGFkZGluZzo0cHhcIiAgcGxhY2Vob2xkZXI9XCJNb2RlbElEXCIvPicpLmFkZENsYXNzKFwidzMtaW5wdXQgdzMtYm9yZGVyXCIpO1xyXG4gICAgRE9NLmFwcGVuZChsYWJlbDEsbmFtZUlucHV0KVxyXG4gICAgcGFyZW50RE9NLmFwcGVuZChET00pXHJcbiAgICB2YXIgdmFsdWVDaGFuZ2U9KCk9PntcclxuICAgICAgICBkdGRsT2JqW1wiZGlzcGxheU5hbWVcIl09bmFtZUlucHV0LnZhbCgpXHJcbiAgICAgICAgcmVmcmVzaERURExGKClcclxuICAgIH1cclxuICAgIG5hbWVJbnB1dC5vbihcImNoYW5nZVwiLHZhbHVlQ2hhbmdlKVxyXG4gICAgdmFyIHN0cj1kdGRsT2JqW1wiZGlzcGxheU5hbWVcIl1cclxuICAgIGlmKHN0ciE9XCJcIiAmJiBzdHIhPW51bGwpIG5hbWVJbnB1dC52YWwoc3RyKVxyXG59IiwiY29uc3QgbW9kZWxBbmFseXplcj1yZXF1aXJlKFwiLi9tb2RlbEFuYWx5emVyXCIpXHJcbmNvbnN0IHNpbXBsZUNvbmZpcm1EaWFsb2cgPSByZXF1aXJlKFwiLi9zaW1wbGVDb25maXJtRGlhbG9nXCIpXHJcbmNvbnN0IHNpbXBsZVRyZWU9IHJlcXVpcmUoXCIuL3NpbXBsZVRyZWVcIilcclxuY29uc3QgbW9kZWxFZGl0b3JEaWFsb2cgPSByZXF1aXJlKFwiLi9tb2RlbEVkaXRvckRpYWxvZ1wiKVxyXG5jb25zdCBnbG9iYWxDYWNoZSA9IHJlcXVpcmUoXCIuL2dsb2JhbENhY2hlXCIpXHJcblxyXG5mdW5jdGlvbiBtb2RlbE1hbmFnZXJEaWFsb2coKSB7XHJcbiAgICB0aGlzLm1vZGVscz17fVxyXG4gICAgaWYoIXRoaXMuRE9NKXtcclxuICAgICAgICB0aGlzLkRPTSA9ICQoJzxkaXYgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO2JhY2tncm91bmQtY29sb3I6d2hpdGU7bGVmdDo1MCU7dHJhbnNmb3JtOiB0cmFuc2xhdGVYKC01MCUpIHRyYW5zbGF0ZVkoLTUwJSk7ei1pbmRleDo5OVwiIGNsYXNzPVwidzMtY2FyZC0yXCI+PC9kaXY+JylcclxuICAgICAgICB0aGlzLkRPTS5jc3MoXCJvdmVyZmxvd1wiLFwiaGlkZGVuXCIpXHJcbiAgICAgICAgJChcImJvZHlcIikuYXBwZW5kKHRoaXMuRE9NKVxyXG4gICAgICAgIHRoaXMuRE9NLmhpZGUoKVxyXG4gICAgICAgIGdsb2JhbENhY2hlLm1ha2VET01EcmFnZ2FibGUodGhpcy5ET00pXHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUucHJlcGFyYXRpb25GdW5jID0gYXN5bmMgZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgICQuZ2V0KFwidmlzdWFsRGVmaW5pdGlvbi9yZWFkVmlzdWFsRGVmaW5pdGlvblwiLCAoZGF0YSwgc3RhdHVzKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZihkYXRhIT1cIlwiICYmIHR5cGVvZihkYXRhKT09PVwib2JqZWN0XCIpIGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb249ZGF0YTtcclxuICAgICAgICAgICAgICAgIHJlc29sdmUoKVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH1jYXRjaChlKXtcclxuICAgICAgICAgICAgcmVqZWN0KGUpXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5wb3B1cCA9IGFzeW5jIGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5ET00uc2hvdygpXHJcbiAgICB0aGlzLkRPTS5lbXB0eSgpXHJcbiAgICB0aGlzLmNvbnRlbnRET00gPSAkKCc8ZGl2IHN0eWxlPVwid2lkdGg6NjUwcHhcIj48L2Rpdj4nKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKHRoaXMuY29udGVudERPTSlcclxuICAgIHRoaXMuY29udGVudERPTS5hcHBlbmQoJCgnPGRpdiBzdHlsZT1cImhlaWdodDo0MHB4XCIgY2xhc3M9XCJ3My1iYXIgdzMtcmVkXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtXCIgc3R5bGU9XCJmb250LXNpemU6MS41ZW1cIj5EaWdpdGFsIFR3aW4gTW9kZWxzPC9kaXY+PC9kaXY+JykpXHJcbiAgICB2YXIgY2xvc2VCdXR0b24gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYmFyLWl0ZW0gdzMtYnV0dG9uIHczLXJpZ2h0XCIgc3R5bGU9XCJmb250LXNpemU6MmVtO3BhZGRpbmctdG9wOjRweFwiPsOXPC9idXR0b24+JylcclxuICAgIHRoaXMuY29udGVudERPTS5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKGNsb3NlQnV0dG9uKVxyXG4gICAgY2xvc2VCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMuRE9NLmhpZGUoKSB9KVxyXG5cclxuICAgIHZhciBpbXBvcnRNb2RlbHNCdG4gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWNhcmQgdzMtZGVlcC1vcmFuZ2UgdzMtaG92ZXItbGlnaHQtZ3JlZW5cIiBzdHlsZT1cImhlaWdodDoxMDAlXCI+SW1wb3J0PC9idXR0b24+JylcclxuICAgIHZhciBhY3R1YWxJbXBvcnRNb2RlbHNCdG4gPSQoJzxpbnB1dCB0eXBlPVwiZmlsZVwiIG5hbWU9XCJtb2RlbEZpbGVzXCIgbXVsdGlwbGU9XCJtdWx0aXBsZVwiIHN0eWxlPVwiZGlzcGxheTpub25lXCI+PC9pbnB1dD4nKVxyXG4gICAgdmFyIG1vZGVsRWRpdG9yQnRuID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1jYXJkIHczLWRlZXAtb3JhbmdlIHczLWhvdmVyLWxpZ2h0LWdyZWVuXCIgc3R5bGU9XCJoZWlnaHQ6MTAwJVwiPkNyZWF0ZS9Nb2RpZnkgTW9kZWw8L2J1dHRvbj4nKVxyXG4gICAgdmFyIGV4cG9ydE1vZGVsQnRuID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvbiB3My1jYXJkIHczLWRlZXAtb3JhbmdlIHczLWhvdmVyLWxpZ2h0LWdyZWVuXCIgc3R5bGU9XCJoZWlnaHQ6MTAwJVwiPkV4cG9ydCBBbGwgTW9kZWxzPC9idXR0b24+JylcclxuICAgIHRoaXMuY29udGVudERPTS5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKGltcG9ydE1vZGVsc0J0bixhY3R1YWxJbXBvcnRNb2RlbHNCdG4sIG1vZGVsRWRpdG9yQnRuLGV4cG9ydE1vZGVsQnRuKVxyXG4gICAgaW1wb3J0TW9kZWxzQnRuLm9uKFwiY2xpY2tcIiwgKCk9PntcclxuICAgICAgICBhY3R1YWxJbXBvcnRNb2RlbHNCdG4udHJpZ2dlcignY2xpY2snKTtcclxuICAgIH0pO1xyXG4gICAgYWN0dWFsSW1wb3J0TW9kZWxzQnRuLmNoYW5nZShhc3luYyAoZXZ0KT0+e1xyXG4gICAgICAgIHZhciBmaWxlcyA9IGV2dC50YXJnZXQuZmlsZXM7IC8vIEZpbGVMaXN0IG9iamVjdFxyXG4gICAgICAgIGF3YWl0IHRoaXMucmVhZE1vZGVsRmlsZXNDb250ZW50QW5kSW1wb3J0KGZpbGVzKVxyXG4gICAgICAgIGFjdHVhbEltcG9ydE1vZGVsc0J0bi52YWwoXCJcIilcclxuICAgIH0pXHJcbiAgICBtb2RlbEVkaXRvckJ0bi5vbihcImNsaWNrXCIsKCk9PntcclxuICAgICAgICBtb2RlbEVkaXRvckRpYWxvZy5wb3B1cCgpXHJcbiAgICB9KVxyXG5cclxuICAgIGV4cG9ydE1vZGVsQnRuLm9uKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgIHZhciBtb2RlbEFycj1bXVxyXG4gICAgICAgIGZvcih2YXIgbW9kZWxJRCBpbiBtb2RlbEFuYWx5emVyLkRURExNb2RlbHMpIG1vZGVsQXJyLnB1c2goSlNPTi5wYXJzZShtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF1bXCJvcmlnaW5hbFwiXSkpXHJcbiAgICAgICAgdmFyIHBvbSA9ICQoXCI8YT48L2E+XCIpXHJcbiAgICAgICAgcG9tLmF0dHIoJ2hyZWYnLCAnZGF0YTp0ZXh0L3BsYWluO2NoYXJzZXQ9dXRmLTgsJyArIGVuY29kZVVSSUNvbXBvbmVudChKU09OLnN0cmluZ2lmeShtb2RlbEFycikpKTtcclxuICAgICAgICBwb20uYXR0cignZG93bmxvYWQnLCBcImV4cG9ydE1vZGVscy5qc29uXCIpO1xyXG4gICAgICAgIHBvbVswXS5jbGljaygpXHJcbiAgICB9KVxyXG5cclxuXHJcbiAgICB2YXIgcm93Mj0kKCc8ZGl2IGNsYXNzPVwidzMtY2VsbC1yb3dcIiBzdHlsZT1cIm1hcmdpbi10b3A6MnB4XCI+PC9kaXY+JylcclxuICAgIHRoaXMuY29udGVudERPTS5hcHBlbmQocm93MilcclxuICAgIHZhciBsZWZ0U3Bhbj0kKCc8ZGl2IGNsYXNzPVwidzMtY2VsbFwiIHN0eWxlPVwid2lkdGg6MjQwcHg7cGFkZGluZy1yaWdodDo1cHhcIj48L2Rpdj4nKVxyXG4gICAgcm93Mi5hcHBlbmQobGVmdFNwYW4pXHJcbiAgICBsZWZ0U3Bhbi5hcHBlbmQoJCgnPGRpdiBzdHlsZT1cImhlaWdodDozMHB4XCIgY2xhc3M9XCJ3My1iYXIgdzMtcmVkXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtXCIgc3R5bGU9XCJcIj5Nb2RlbHM8L2Rpdj48L2Rpdj4nKSlcclxuICAgIFxyXG4gICAgdmFyIG1vZGVsTGlzdCA9ICQoJzx1bCBjbGFzcz1cInczLXVsIHczLWhvdmVyYWJsZVwiPicpXHJcbiAgICBtb2RlbExpc3QuY3NzKHtcIm92ZXJmbG93LXhcIjpcImhpZGRlblwiLFwib3ZlcmZsb3cteVwiOlwiYXV0b1wiLFwiaGVpZ2h0XCI6XCI0MjBweFwiLCBcImJvcmRlclwiOlwic29saWQgMXB4IGxpZ2h0Z3JheVwifSlcclxuICAgIGxlZnRTcGFuLmFwcGVuZChtb2RlbExpc3QpXHJcbiAgICB0aGlzLm1vZGVsTGlzdCA9IG1vZGVsTGlzdDtcclxuICAgIFxyXG4gICAgdmFyIHJpZ2h0U3Bhbj0kKCc8ZGl2IGNsYXNzPVwidzMtY29udGFpbmVyIHczLWNlbGxcIj48L2Rpdj4nKVxyXG4gICAgcm93Mi5hcHBlbmQocmlnaHRTcGFuKSBcclxuICAgIHZhciBwYW5lbENhcmRPdXQ9JCgnPGRpdiBjbGFzcz1cInczLWNhcmQtMiB3My13aGl0ZVwiIHN0eWxlPVwibWFyZ2luLXRvcDoycHhcIj48L2Rpdj4nKVxyXG5cclxuICAgIHRoaXMubW9kZWxCdXR0b25CYXI9JCgnPGRpdiBjbGFzcz1cInczLWJhclwiIHN0eWxlPVwiaGVpZ2h0OjM1cHhcIj48L2Rpdj4nKVxyXG4gICAgcGFuZWxDYXJkT3V0LmFwcGVuZCh0aGlzLm1vZGVsQnV0dG9uQmFyKVxyXG5cclxuICAgIHJpZ2h0U3Bhbi5hcHBlbmQocGFuZWxDYXJkT3V0KVxyXG4gICAgdmFyIHBhbmVsQ2FyZD0kKCc8ZGl2IHN0eWxlPVwid2lkdGg6NDAwcHg7aGVpZ2h0OjQwNXB4O292ZXJmbG93OmF1dG87bWFyZ2luLXRvcDoycHhcIj48L2Rpdj4nKVxyXG4gICAgcGFuZWxDYXJkT3V0LmFwcGVuZChwYW5lbENhcmQpXHJcbiAgICB0aGlzLnBhbmVsQ2FyZD1wYW5lbENhcmQ7XHJcblxyXG4gICAgdGhpcy5tb2RlbEJ1dHRvbkJhci5lbXB0eSgpXHJcbiAgICBwYW5lbENhcmQuaHRtbChcIjxhIHN0eWxlPSdkaXNwbGF5OmJsb2NrO2ZvbnQtc3R5bGU6aXRhbGljO2NvbG9yOmdyYXk7cGFkZGluZy1sZWZ0OjVweCc+Q2hvb3NlIGEgbW9kZWwgdG8gdmlldyBpbmZvbXJhdGlvbjwvYT5cIilcclxuXHJcbiAgICB0aGlzLmxpc3RNb2RlbHMoKVxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLnJlc2l6ZUltZ0ZpbGUgPSBhc3luYyBmdW5jdGlvbih0aGVGaWxlLG1heF9zaXplKSB7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xyXG4gICAgICAgICAgICB2YXIgdG1wSW1nID0gbmV3IEltYWdlKCk7XHJcbiAgICAgICAgICAgIHJlYWRlci5vbmxvYWQgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0bXBJbWcub25sb2FkID0gICgpPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKVxyXG4gICAgICAgICAgICAgICAgICAgIHZhciB3aWR0aCA9IHRtcEltZy53aWR0aFxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBoZWlnaHQgPSB0bXBJbWcuaGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh3aWR0aCA+IGhlaWdodCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAod2lkdGggPiBtYXhfc2l6ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVpZ2h0ICo9IG1heF9zaXplIC8gd2lkdGg7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCA9IG1heF9zaXplO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGhlaWdodCA+IG1heF9zaXplKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWR0aCAqPSBtYXhfc2l6ZSAvIGhlaWdodDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodCA9IG1heF9zaXplO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGNhbnZhcy53aWR0aCA9IHdpZHRoO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FudmFzLmdldENvbnRleHQoJzJkJykuZHJhd0ltYWdlKHRtcEltZywgMCwgMCwgd2lkdGgsIGhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRhdGFVcmwgPSBjYW52YXMudG9EYXRhVVJMKCdpbWFnZS9wbmcnKTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKGRhdGFVcmwpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0bXBJbWcuc3JjID0gcmVhZGVyLnJlc3VsdDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZWFkZXIucmVhZEFzRGF0YVVSTCh0aGVGaWxlKTtcclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIHJlamVjdChlKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuZmlsbFJpZ2h0U3Bhbj1hc3luYyBmdW5jdGlvbihtb2RlbE5hbWUpe1xyXG4gICAgdGhpcy5wYW5lbENhcmQuZW1wdHkoKVxyXG4gICAgdGhpcy5tb2RlbEJ1dHRvbkJhci5lbXB0eSgpXHJcbiAgICB2YXIgbW9kZWxJRD10aGlzLm1vZGVsc1ttb2RlbE5hbWVdWydAaWQnXVxyXG5cclxuICAgIHZhciBkZWxCdG4gPSAkKCc8YnV0dG9uIHN0eWxlPVwibWFyZ2luLWJvdHRvbToycHhcIiBjbGFzcz1cInczLWJ1dHRvbiB3My1saWdodC1ncmF5IHczLWhvdmVyLXBpbmsgdzMtYm9yZGVyLXJpZ2h0XCI+RGVsZXRlIE1vZGVsPC9idXR0b24+JylcclxuICAgIHZhciBpbXBvcnRQaWNCdG4gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWxpZ2h0LWdyYXkgdzMtaG92ZXItYW1iZXIgdzMtYm9yZGVyLXJpZ2h0XCI+VXBsb2FkIEF2YXJ0YTwvYnV0dG9uPicpXHJcbiAgICB2YXIgYWN0dWFsSW1wb3J0UGljQnRuID0kKCc8aW5wdXQgdHlwZT1cImZpbGVcIiBuYW1lPVwiaW1nXCIgc3R5bGU9XCJkaXNwbGF5Om5vbmVcIj48L2lucHV0PicpXHJcbiAgICB2YXIgY2xlYXJBdmFydGFCdG4gPSAkKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWxpZ2h0LWdyYXkgdzMtaG92ZXItcGluayB3My1ib3JkZXItcmlnaHRcIj5DbGVhciBBdmFydGE8L2J1dHRvbj4nKVxyXG4gICAgdGhpcy5tb2RlbEJ1dHRvbkJhci5hcHBlbmQoZGVsQnRuLGltcG9ydFBpY0J0bixhY3R1YWxJbXBvcnRQaWNCdG4sY2xlYXJBdmFydGFCdG4pXHJcblxyXG4gICAgaW1wb3J0UGljQnRuLm9uKFwiY2xpY2tcIiwgKCk9PntcclxuICAgICAgICBhY3R1YWxJbXBvcnRQaWNCdG4udHJpZ2dlcignY2xpY2snKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGFjdHVhbEltcG9ydFBpY0J0bi5jaGFuZ2UoYXN5bmMgKGV2dCk9PntcclxuICAgICAgICB2YXIgZmlsZXMgPSBldnQudGFyZ2V0LmZpbGVzOyAvLyBGaWxlTGlzdCBvYmplY3RcclxuICAgICAgICB2YXIgdGhlRmlsZT1maWxlc1swXVxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmKHRoZUZpbGUudHlwZT09XCJpbWFnZS9zdmcreG1sXCIpe1xyXG4gICAgICAgICAgICB2YXIgc3RyPSBhd2FpdCB0aGlzLnJlYWRPbmVGaWxlKHRoZUZpbGUpXHJcbiAgICAgICAgICAgIHZhciBkYXRhVXJsPSdkYXRhOmltYWdlL3N2Zyt4bWw7dXRmOCwnICsgZW5jb2RlVVJJQ29tcG9uZW50KHN0cik7XHJcbiAgICAgICAgfWVsc2UgaWYodGhlRmlsZS50eXBlLm1hdGNoKCdpbWFnZS4qJykpe1xyXG4gICAgICAgICAgICB2YXIgZGF0YVVybD0gYXdhaXQgdGhpcy5yZXNpemVJbWdGaWxlKHRoZUZpbGUsNzApXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdmFyIGNvbmZpcm1EaWFsb2dEaXY9bmV3IHNpbXBsZUNvbmZpcm1EaWFsb2coKVxyXG4gICAgICAgICAgICBjb25maXJtRGlhbG9nRGl2LnNob3coeyB3aWR0aDogXCIyMDBweFwiIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IFwiTm90ZVwiXHJcbiAgICAgICAgICAgICAgICAgICAgLCBjb250ZW50OiBcIlBsZWFzZSBpbXBvcnQgaW1hZ2UgZmlsZSAocG5nLGpwZyxzdmcgYW5kIHNvIG9uKVwiXHJcbiAgICAgICAgICAgICAgICAgICAgLCBidXR0b25zOiBbe2NvbG9yQ2xhc3M6XCJ3My1ncmF5XCIsdGV4dDpcIk9rXCIsXCJjbGlja0Z1bmNcIjooKT0+e2NvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKX19XVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKHRoaXMuYXZhcnRhSW1nKSB0aGlzLmF2YXJ0YUltZy5hdHRyKFwic3JjXCIsZGF0YVVybClcclxuICAgICAgICB2YXIgdmlzdWFsSnNvbj1nbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW2dsb2JhbENhY2hlLnNlbGVjdGVkQURUXVxyXG4gICAgICAgIGlmKCF2aXN1YWxKc29uW21vZGVsSURdKSB2aXN1YWxKc29uW21vZGVsSURdPXt9XHJcbiAgICAgICAgdmlzdWFsSnNvblttb2RlbElEXS5hdmFydGE9ZGF0YVVybFxyXG4gICAgICAgIHRoaXMuc2F2ZVZpc3VhbERlZmluaXRpb24oKVxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIiwgXCJtb2RlbElEXCI6bW9kZWxJRCxcImF2YXJ0YVwiOmRhdGFVcmwgfSlcclxuICAgICAgICB0aGlzLnJlZnJlc2hNb2RlbFRyZWVMYWJlbCgpXHJcbiAgICAgICAgYWN0dWFsSW1wb3J0UGljQnRuLnZhbChcIlwiKVxyXG4gICAgfSlcclxuXHJcbiAgICBjbGVhckF2YXJ0YUJ0bi5vbihcImNsaWNrXCIsICgpPT57XHJcbiAgICAgICAgdmFyIHZpc3VhbEpzb249Z2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVF1cclxuICAgICAgICBpZih2aXN1YWxKc29uW21vZGVsSURdKSBkZWxldGUgdmlzdWFsSnNvblttb2RlbElEXS5hdmFydGEgXHJcbiAgICAgICAgaWYodGhpcy5hdmFydGFJbWcpIHRoaXMuYXZhcnRhSW1nLnJlbW92ZUF0dHIoJ3NyYycpO1xyXG4gICAgICAgIHRoaXMuc2F2ZVZpc3VhbERlZmluaXRpb24oKVxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIiwgXCJtb2RlbElEXCI6bW9kZWxJRCxcIm5vQXZhcnRhXCI6dHJ1ZSB9KVxyXG4gICAgICAgIHRoaXMucmVmcmVzaE1vZGVsVHJlZUxhYmVsKClcclxuICAgIH0pO1xyXG5cclxuXHJcbiAgICBkZWxCdG4ub24oXCJjbGlja1wiLCgpPT57XHJcbiAgICAgICAgdmFyIHJlbGF0ZWRNb2RlbElEcyA9bW9kZWxBbmFseXplci5saXN0TW9kZWxzRm9yRGVsZXRlTW9kZWwobW9kZWxJRClcclxuICAgICAgICB2YXIgZGlhbG9nU3RyPShyZWxhdGVkTW9kZWxJRHMubGVuZ3RoPT0wKT8gKFwiVGhpcyB3aWxsIERFTEVURSBtb2RlbCBcXFwiXCIgKyBtb2RlbElEICsgXCJcXFwiXCIpOiBcclxuICAgICAgICAgICAgKG1vZGVsSUQgKyBcIiBpcyBiYXNlIG1vZGVsIG9mIFwiK3JlbGF0ZWRNb2RlbElEcy5qb2luKFwiLCBcIikrXCIuIERlbGV0ZSBhbGwgb2YgdGhlbT9cIilcclxuICAgICAgICB2YXIgY29uZmlybURpYWxvZ0RpdiA9IG5ldyBzaW1wbGVDb25maXJtRGlhbG9nKClcclxuICAgICAgICBjb25maXJtRGlhbG9nRGl2LnNob3coXHJcbiAgICAgICAgICAgIHsgd2lkdGg6IFwiMzUwcHhcIiB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0aXRsZTogXCJXYXJuaW5nXCJcclxuICAgICAgICAgICAgICAgICwgY29udGVudDogZGlhbG9nU3RyXHJcbiAgICAgICAgICAgICAgICAsIGJ1dHRvbnM6IFtcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yQ2xhc3M6IFwidzMtcmVkIHczLWhvdmVyLXBpbmtcIiwgdGV4dDogXCJDb25maXJtXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29uZmlybURlbGV0ZU1vZGVsKG1vZGVsSUQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1ncmF5XCIsIHRleHQ6IFwiQ2FuY2VsXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgKVxyXG4gICAgICAgIFxyXG4gICAgfSlcclxuICAgIFxyXG4gICAgdmFyIFZpc3VhbGl6YXRpb25ET009dGhpcy5hZGRBUGFydEluUmlnaHRTcGFuKFwiVmlzdWFsaXphdGlvblwiKVxyXG4gICAgdmFyIGVkaXRhYmxlUHJvcGVydGllc0RPTT10aGlzLmFkZEFQYXJ0SW5SaWdodFNwYW4oXCJFZGl0YWJsZSBQcm9wZXJ0aWVzIEFuZCBSZWxhdGlvbnNoaXBzXCIpXHJcbiAgICB2YXIgYmFzZUNsYXNzZXNET009dGhpcy5hZGRBUGFydEluUmlnaHRTcGFuKFwiQmFzZSBDbGFzc2VzXCIpXHJcbiAgICB2YXIgb3JpZ2luYWxEZWZpbml0aW9uRE9NPXRoaXMuYWRkQVBhcnRJblJpZ2h0U3BhbihcIk9yaWdpbmFsIERlZmluaXRpb25cIilcclxuXHJcbiAgICB2YXIgc3RyPUpTT04uc3RyaW5naWZ5KHRoaXMubW9kZWxzW21vZGVsTmFtZV0sbnVsbCwyKVxyXG4gICAgb3JpZ2luYWxEZWZpbml0aW9uRE9NLmFwcGVuZCgkKCc8cHJlIGlkPVwianNvblwiPicrc3RyKyc8L3ByZT4nKSlcclxuXHJcbiAgICB2YXIgZWRpdHRhYmxlUHJvcGVydGllcz1tb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF0uZWRpdGFibGVQcm9wZXJ0aWVzXHJcbiAgICB0aGlzLmZpbGxFZGl0YWJsZVByb3BlcnRpZXMoZWRpdHRhYmxlUHJvcGVydGllcyxlZGl0YWJsZVByb3BlcnRpZXNET00pXHJcbiAgICB2YXIgdmFsaWRSZWxhdGlvbnNoaXBzPW1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXS52YWxpZFJlbGF0aW9uc2hpcHNcclxuICAgIHRoaXMuZmlsbFJlbGF0aW9uc2hpcEluZm8odmFsaWRSZWxhdGlvbnNoaXBzLGVkaXRhYmxlUHJvcGVydGllc0RPTSlcclxuXHJcbiAgICB0aGlzLmZpbGxWaXN1YWxpemF0aW9uKG1vZGVsSUQsVmlzdWFsaXphdGlvbkRPTSlcclxuXHJcbiAgICB0aGlzLmZpbGxCYXNlQ2xhc3Nlcyhtb2RlbEFuYWx5emVyLkRURExNb2RlbHNbbW9kZWxJRF0uYWxsQmFzZUNsYXNzZXMsYmFzZUNsYXNzZXNET00pIFxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLmNvbmZpcm1EZWxldGVNb2RlbD1mdW5jdGlvbihtb2RlbElEKXtcclxuICAgIHZhciBmdW5jQWZ0ZXJFYWNoU3VjY2Vzc0RlbGV0ZSA9IChlYWNoRGVsZXRlZE1vZGVsSUQsZWFjaE1vZGVsTmFtZSkgPT4ge1xyXG4gICAgICAgIGRlbGV0ZSB0aGlzLm1vZGVsc1tlYWNoTW9kZWxOYW1lXVxyXG4gICAgICAgIHRoaXMudHJlZS5kZWxldGVMZWFmTm9kZShlYWNoTW9kZWxOYW1lKVxyXG4gICAgICAgIGlmIChnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW2dsb2JhbENhY2hlLnNlbGVjdGVkQURUXSAmJiBnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW2dsb2JhbENhY2hlLnNlbGVjdGVkQURUXVtlYWNoRGVsZXRlZE1vZGVsSURdKSB7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW2dsb2JhbENhY2hlLnNlbGVjdGVkQURUXVtlYWNoRGVsZXRlZE1vZGVsSURdXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdmFyIGNvbXBsZXRlRnVuYz0oKT0+eyBcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJBRFRNb2RlbHNDaGFuZ2VcIiwgXCJtb2RlbHNcIjp0aGlzLm1vZGVsc30pXHJcbiAgICAgICAgdGhpcy5wYW5lbENhcmQuZW1wdHkoKVxyXG4gICAgICAgIHRoaXMuc2F2ZVZpc3VhbERlZmluaXRpb24oKVxyXG4gICAgfVxyXG5cclxuICAgIC8vZXZlbiBub3QgY29tcGxldGVseSBzdWNjZXNzZnVsIGRlbGV0aW5nLCBpdCB3aWxsIHN0aWxsIGludm9rZSBjb21wbGV0ZUZ1bmNcclxuICAgIG1vZGVsQW5hbHl6ZXIuZGVsZXRlTW9kZWwobW9kZWxJRCxmdW5jQWZ0ZXJFYWNoU3VjY2Vzc0RlbGV0ZSxjb21wbGV0ZUZ1bmMsY29tcGxldGVGdW5jKVxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLnJlZnJlc2hNb2RlbFRyZWVMYWJlbD1mdW5jdGlvbigpe1xyXG4gICAgaWYodGhpcy50cmVlLnNlbGVjdGVkTm9kZXMubGVuZ3RoPjApIHRoaXMudHJlZS5zZWxlY3RlZE5vZGVzWzBdLnJlZHJhd0xhYmVsKClcclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5maWxsQmFzZUNsYXNzZXM9ZnVuY3Rpb24oYmFzZUNsYXNzZXMscGFyZW50RG9tKXtcclxuICAgIGZvcih2YXIgaW5kIGluIGJhc2VDbGFzc2VzKXtcclxuICAgICAgICB2YXIga2V5RGl2PSAkKFwiPGxhYmVsIHN0eWxlPSdkaXNwbGF5OmJsb2NrO3BhZGRpbmc6LjFlbSc+XCIraW5kK1wiPC9sYWJlbD5cIilcclxuICAgICAgICBwYXJlbnREb20uYXBwZW5kKGtleURpdilcclxuICAgIH1cclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5maWxsVmlzdWFsaXphdGlvbj1mdW5jdGlvbihtb2RlbElELHBhcmVudERvbSl7XHJcbiAgICB2YXIgbW9kZWxKc29uPW1vZGVsQW5hbHl6ZXIuRFRETE1vZGVsc1ttb2RlbElEXTtcclxuICAgIHZhciBhVGFibGU9JChcIjx0YWJsZSBzdHlsZT0nd2lkdGg6MTAwJSc+PC90YWJsZT5cIilcclxuICAgIGFUYWJsZS5odG1sKCc8dHI+PHRkPjwvdGQ+PHRkPjwvdGQ+PC90cj4nKVxyXG4gICAgcGFyZW50RG9tLmFwcGVuZChhVGFibGUpIFxyXG5cclxuICAgIHZhciBsZWZ0UGFydD1hVGFibGUuZmluZChcInRkOmZpcnN0XCIpXHJcbiAgICB2YXIgcmlnaHRQYXJ0PWFUYWJsZS5maW5kKFwidGQ6bnRoLWNoaWxkKDIpXCIpXHJcbiAgICByaWdodFBhcnQuY3NzKHtcIndpZHRoXCI6XCI1MHB4XCIsXCJoZWlnaHRcIjpcIjUwcHhcIixcImJvcmRlclwiOlwic29saWQgMXB4IGxpZ2h0R3JheVwifSlcclxuICAgIFxyXG4gICAgdmFyIGF2YXJ0YUltZz0kKFwiPGltZyBzdHlsZT0naGVpZ2h0OjQ1cHgnPjwvaW1nPlwiKVxyXG4gICAgcmlnaHRQYXJ0LmFwcGVuZChhdmFydGFJbWcpXHJcbiAgICB2YXIgdmlzdWFsSnNvbj1nbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW2dsb2JhbENhY2hlLnNlbGVjdGVkQURUXVxyXG4gICAgaWYodmlzdWFsSnNvbiAmJiB2aXN1YWxKc29uW21vZGVsSURdICYmIHZpc3VhbEpzb25bbW9kZWxJRF0uYXZhcnRhKSBhdmFydGFJbWcuYXR0cignc3JjJyx2aXN1YWxKc29uW21vZGVsSURdLmF2YXJ0YSlcclxuICAgIHRoaXMuYXZhcnRhSW1nPWF2YXJ0YUltZztcclxuXHJcbiAgICBcclxuICAgIHRoaXMuYWRkT25lVmlzdWFsaXphdGlvblJvdyhtb2RlbElELGxlZnRQYXJ0KVxyXG4gICAgZm9yKHZhciBpbmQgaW4gbW9kZWxKc29uLnZhbGlkUmVsYXRpb25zaGlwcyl7XHJcbiAgICAgICAgdGhpcy5hZGRPbmVWaXN1YWxpemF0aW9uUm93KG1vZGVsSUQsbGVmdFBhcnQsaW5kKVxyXG4gICAgfVxyXG59XHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuYWRkT25lVmlzdWFsaXphdGlvblJvdz1mdW5jdGlvbihtb2RlbElELHBhcmVudERvbSxyZWxhdGluc2hpcE5hbWUpe1xyXG4gICAgaWYocmVsYXRpbnNoaXBOYW1lPT1udWxsKSB2YXIgbmFtZVN0cj1cIuKXr1wiIC8vdmlzdWFsIGZvciBub2RlXHJcbiAgICBlbHNlIG5hbWVTdHI9XCLin5wgXCIrcmVsYXRpbnNoaXBOYW1lXHJcbiAgICB2YXIgY29udGFpbmVyRGl2PSQoXCI8ZGl2IHN0eWxlPSdwYWRkaW5nLWJvdHRvbTo4cHgnPjwvZGl2PlwiKVxyXG4gICAgcGFyZW50RG9tLmFwcGVuZChjb250YWluZXJEaXYpXHJcbiAgICB2YXIgY29udGVudERPTT0kKFwiPGxhYmVsIHN0eWxlPSdtYXJnaW4tcmlnaHQ6MTBweCc+XCIrbmFtZVN0citcIjwvbGFiZWw+XCIpXHJcbiAgICBjb250YWluZXJEaXYuYXBwZW5kKGNvbnRlbnRET00pXHJcblxyXG4gICAgdmFyIGRlZmluZWRDb2xvcj1udWxsXHJcbiAgICB2YXIgZGVmaW5lZFNoYXBlPW51bGxcclxuICAgIHZhciBkZWZpbmVkRGltZW5zaW9uUmF0aW89bnVsbFxyXG4gICAgdmFyIGRlZmluZWRFZGdlV2lkdGg9bnVsbFxyXG4gICAgdmFyIHZpc3VhbEpzb249Z2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVF1cclxuICAgIGlmKHJlbGF0aW5zaGlwTmFtZT09bnVsbCl7XHJcbiAgICAgICAgaWYodmlzdWFsSnNvbiAmJiB2aXN1YWxKc29uW21vZGVsSURdICYmIHZpc3VhbEpzb25bbW9kZWxJRF0uY29sb3IpIGRlZmluZWRDb2xvcj12aXN1YWxKc29uW21vZGVsSURdLmNvbG9yXHJcbiAgICAgICAgaWYodmlzdWFsSnNvbiAmJiB2aXN1YWxKc29uW21vZGVsSURdICYmIHZpc3VhbEpzb25bbW9kZWxJRF0uc2hhcGUpIGRlZmluZWRTaGFwZT12aXN1YWxKc29uW21vZGVsSURdLnNoYXBlXHJcbiAgICAgICAgaWYodmlzdWFsSnNvbiAmJiB2aXN1YWxKc29uW21vZGVsSURdICYmIHZpc3VhbEpzb25bbW9kZWxJRF0uZGltZW5zaW9uUmF0aW8pIGRlZmluZWREaW1lbnNpb25SYXRpbz12aXN1YWxKc29uW21vZGVsSURdLmRpbWVuc2lvblJhdGlvXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICBpZih2aXN1YWxKc29uICYmIHZpc3VhbEpzb25bbW9kZWxJRF1cclxuICAgICAgICAgICAgICYmIHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdXHJcbiAgICAgICAgICAgICAgJiYgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXSl7XHJcbiAgICAgICAgICAgICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0uY29sb3IpIGRlZmluZWRDb2xvcj12aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdLmNvbG9yXHJcbiAgICAgICAgICAgICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0uc2hhcGUpIGRlZmluZWRTaGFwZT12aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdLnNoYXBlXHJcbiAgICAgICAgICAgICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0uZWRnZVdpZHRoKSBkZWZpbmVkRWRnZVdpZHRoPXZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0uZWRnZVdpZHRoXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHZhciBjb2xvclNlbGVjdG9yPSQoJzxzZWxlY3QgY2xhc3M9XCJ3My1ib3JkZXJcIiBzdHlsZT1cIm91dGxpbmU6bm9uZTt3aWR0aDo4NXB4XCI+PC9zZWxlY3Q+JylcclxuICAgIGNvbnRhaW5lckRpdi5hcHBlbmQoY29sb3JTZWxlY3RvcilcclxuICAgIHZhciBjb2xvckFycj1bXCJkYXJrR3JheVwiLFwiQmxhY2tcIixcIkxpZ2h0R3JheVwiLFwiUmVkXCIsXCJHcmVlblwiLFwiQmx1ZVwiLFwiQmlzcXVlXCIsXCJCcm93blwiLFwiQ29yYWxcIixcIkNyaW1zb25cIixcIkRvZGdlckJsdWVcIixcIkdvbGRcIl1cclxuICAgIGNvbG9yQXJyLmZvckVhY2goKG9uZUNvbG9yQ29kZSk9PntcclxuICAgICAgICB2YXIgYW5PcHRpb249JChcIjxvcHRpb24gdmFsdWU9J1wiK29uZUNvbG9yQ29kZStcIic+XCIrb25lQ29sb3JDb2RlK1wi4panPC9vcHRpb24+XCIpXHJcbiAgICAgICAgY29sb3JTZWxlY3Rvci5hcHBlbmQoYW5PcHRpb24pXHJcbiAgICAgICAgYW5PcHRpb24uY3NzKFwiY29sb3JcIixvbmVDb2xvckNvZGUpXHJcbiAgICB9KVxyXG4gICAgaWYoZGVmaW5lZENvbG9yIT1udWxsKSB7XHJcbiAgICAgICAgY29sb3JTZWxlY3Rvci52YWwoZGVmaW5lZENvbG9yKVxyXG4gICAgICAgIGNvbG9yU2VsZWN0b3IuY3NzKFwiY29sb3JcIixkZWZpbmVkQ29sb3IpXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICBjb2xvclNlbGVjdG9yLmNzcyhcImNvbG9yXCIsXCJkYXJrR3JheVwiKVxyXG4gICAgfVxyXG4gICAgY29sb3JTZWxlY3Rvci5jaGFuZ2UoKGV2ZSk9PntcclxuICAgICAgICB2YXIgc2VsZWN0Q29sb3JDb2RlPWV2ZS50YXJnZXQudmFsdWVcclxuICAgICAgICBjb2xvclNlbGVjdG9yLmNzcyhcImNvbG9yXCIsIHNlbGVjdENvbG9yQ29kZSlcclxuICAgICAgICBpZiAoIWdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bZ2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFRdKVxyXG4gICAgICAgICAgICBnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW2dsb2JhbENhY2hlLnNlbGVjdGVkQURUXSA9IHt9XHJcbiAgICAgICAgdmFyIHZpc3VhbEpzb24gPSBnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW2dsb2JhbENhY2hlLnNlbGVjdGVkQURUXVxyXG5cclxuICAgICAgICBpZighdmlzdWFsSnNvblttb2RlbElEXSkgdmlzdWFsSnNvblttb2RlbElEXT17fVxyXG4gICAgICAgIGlmKCFyZWxhdGluc2hpcE5hbWUpIHtcclxuICAgICAgICAgICAgdmlzdWFsSnNvblttb2RlbElEXS5jb2xvcj1zZWxlY3RDb2xvckNvZGVcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwidmlzdWFsRGVmaW5pdGlvbkNoYW5nZVwiLCBcIm1vZGVsSURcIjptb2RlbElELFwiY29sb3JcIjpzZWxlY3RDb2xvckNvZGUgfSlcclxuICAgICAgICAgICAgdGhpcy5yZWZyZXNoTW9kZWxUcmVlTGFiZWwoKVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBpZighdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl0pIHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdPXt9XHJcbiAgICAgICAgICAgIGlmKCF2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdKSB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdPXt9XHJcbiAgICAgICAgICAgIHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0uY29sb3I9c2VsZWN0Q29sb3JDb2RlXHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIiwgXCJzcmNNb2RlbElEXCI6bW9kZWxJRCxcInJlbGF0aW9uc2hpcE5hbWVcIjpyZWxhdGluc2hpcE5hbWUsXCJjb2xvclwiOnNlbGVjdENvbG9yQ29kZSB9KVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnNhdmVWaXN1YWxEZWZpbml0aW9uKClcclxuICAgIH0pXHJcblxyXG4gICAgdmFyIHNoYXBlU2VsZWN0b3IgPSAkKCc8c2VsZWN0IGNsYXNzPVwidzMtYm9yZGVyXCIgc3R5bGU9XCJvdXRsaW5lOm5vbmVcIj48L3NlbGVjdD4nKVxyXG4gICAgY29udGFpbmVyRGl2LmFwcGVuZChzaGFwZVNlbGVjdG9yKVxyXG4gICAgaWYocmVsYXRpbnNoaXBOYW1lPT1udWxsKXtcclxuICAgICAgICBzaGFwZVNlbGVjdG9yLmFwcGVuZCgkKFwiPG9wdGlvbiB2YWx1ZT0nZWxsaXBzZSc+4pevPC9vcHRpb24+XCIpKVxyXG4gICAgICAgIHNoYXBlU2VsZWN0b3IuYXBwZW5kKCQoXCI8b3B0aW9uIHZhbHVlPSdyb3VuZC1yZWN0YW5nbGUnIHN0eWxlPSdmb250LXNpemU6MTIwJSc+4paiPC9vcHRpb24+XCIpKVxyXG4gICAgICAgIHNoYXBlU2VsZWN0b3IuYXBwZW5kKCQoXCI8b3B0aW9uIHZhbHVlPSdoZXhhZ29uJyBzdHlsZT0nZm9udC1zaXplOjEzMCUnPuKsoTwvb3B0aW9uPlwiKSlcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHNoYXBlU2VsZWN0b3IuYXBwZW5kKCQoXCI8b3B0aW9uIHZhbHVlPSdzb2xpZCc+4oaSPC9vcHRpb24+XCIpKVxyXG4gICAgICAgIHNoYXBlU2VsZWN0b3IuYXBwZW5kKCQoXCI8b3B0aW9uIHZhbHVlPSdkb3R0ZWQnPuKHojwvb3B0aW9uPlwiKSlcclxuICAgIH1cclxuICAgIGlmKGRlZmluZWRTaGFwZSE9bnVsbCkgc2hhcGVTZWxlY3Rvci52YWwoZGVmaW5lZFNoYXBlKVxyXG4gICAgXHJcbiAgICBzaGFwZVNlbGVjdG9yLmNoYW5nZSgoZXZlKT0+e1xyXG4gICAgICAgIHZhciBzZWxlY3RTaGFwZT1ldmUudGFyZ2V0LnZhbHVlXHJcbiAgICAgICAgaWYgKCFnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW2dsb2JhbENhY2hlLnNlbGVjdGVkQURUXSlcclxuICAgICAgICAgICAgZ2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVF0gPSB7fVxyXG4gICAgICAgIHZhciB2aXN1YWxKc29uID0gZ2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVF1cclxuXHJcbiAgICAgICAgaWYoIXZpc3VhbEpzb25bbW9kZWxJRF0pIHZpc3VhbEpzb25bbW9kZWxJRF09e31cclxuICAgICAgICBpZighcmVsYXRpbnNoaXBOYW1lKSB7XHJcbiAgICAgICAgICAgIHZpc3VhbEpzb25bbW9kZWxJRF0uc2hhcGU9c2VsZWN0U2hhcGVcclxuICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwidmlzdWFsRGVmaW5pdGlvbkNoYW5nZVwiLCBcIm1vZGVsSURcIjptb2RlbElELFwic2hhcGVcIjpzZWxlY3RTaGFwZSB9KVxyXG4gICAgICAgICAgICB0aGlzLnJlZnJlc2hNb2RlbFRyZWVMYWJlbCgpXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIGlmKCF2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXSkgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl09e31cclxuICAgICAgICAgICAgaWYoIXZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0pIHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV09e31cclxuICAgICAgICAgICAgdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpbnNoaXBOYW1lXS5zaGFwZT1zZWxlY3RTaGFwZVxyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJ2aXN1YWxEZWZpbml0aW9uQ2hhbmdlXCIsIFwic3JjTW9kZWxJRFwiOm1vZGVsSUQsXCJyZWxhdGlvbnNoaXBOYW1lXCI6cmVsYXRpbnNoaXBOYW1lLFwic2hhcGVcIjpzZWxlY3RTaGFwZSB9KVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnNhdmVWaXN1YWxEZWZpbml0aW9uKClcclxuICAgIH0pXHJcblxyXG5cclxuICAgIHZhciBzaXplQWRqdXN0U2VsZWN0b3IgPSAkKCc8c2VsZWN0IGNsYXNzPVwidzMtYm9yZGVyXCIgc3R5bGU9XCJvdXRsaW5lOm5vbmU7d2lkdGg6MTEwcHhcIj48L3NlbGVjdD4nKVxyXG4gICAgaWYocmVsYXRpbnNoaXBOYW1lPT1udWxsKXtcclxuICAgICAgICBmb3IodmFyIGY9MC4yO2Y8MjtmKz0wLjIpe1xyXG4gICAgICAgICAgICB2YXIgdmFsPWYudG9GaXhlZCgxKStcIlwiXHJcbiAgICAgICAgICAgIHNpemVBZGp1c3RTZWxlY3Rvci5hcHBlbmQoJChcIjxvcHRpb24gdmFsdWU9XCIrdmFsK1wiPmRpbWVuc2lvbipcIit2YWwrXCI8L29wdGlvbj5cIikpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKGRlZmluZWREaW1lbnNpb25SYXRpbyE9bnVsbCkgc2l6ZUFkanVzdFNlbGVjdG9yLnZhbChkZWZpbmVkRGltZW5zaW9uUmF0aW8pXHJcbiAgICAgICAgZWxzZSBzaXplQWRqdXN0U2VsZWN0b3IudmFsKFwiMS4wXCIpXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICBzaXplQWRqdXN0U2VsZWN0b3IuY3NzKFwid2lkdGhcIixcIjgwcHhcIilcclxuICAgICAgICBmb3IodmFyIGY9MC41O2Y8PTQ7Zis9MC41KXtcclxuICAgICAgICAgICAgdmFyIHZhbD1mLnRvRml4ZWQoMSkrXCJcIlxyXG4gICAgICAgICAgICBzaXplQWRqdXN0U2VsZWN0b3IuYXBwZW5kKCQoXCI8b3B0aW9uIHZhbHVlPVwiK3ZhbCtcIj53aWR0aCAqXCIrdmFsK1wiPC9vcHRpb24+XCIpKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZihkZWZpbmVkRWRnZVdpZHRoIT1udWxsKSBzaXplQWRqdXN0U2VsZWN0b3IudmFsKGRlZmluZWRFZGdlV2lkdGgpXHJcbiAgICAgICAgZWxzZSBzaXplQWRqdXN0U2VsZWN0b3IudmFsKFwiMi4wXCIpXHJcbiAgICB9XHJcbiAgICBjb250YWluZXJEaXYuYXBwZW5kKHNpemVBZGp1c3RTZWxlY3RvcilcclxuXHJcbiAgICBcclxuICAgIHNpemVBZGp1c3RTZWxlY3Rvci5jaGFuZ2UoKGV2ZSk9PntcclxuICAgICAgICB2YXIgY2hvb3NlVmFsPWV2ZS50YXJnZXQudmFsdWVcclxuICAgICAgICBpZiAoIWdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bZ2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFRdKVxyXG4gICAgICAgICAgICBnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW2dsb2JhbENhY2hlLnNlbGVjdGVkQURUXSA9IHt9XHJcbiAgICAgICAgdmFyIHZpc3VhbEpzb24gPSBnbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW2dsb2JhbENhY2hlLnNlbGVjdGVkQURUXVxyXG5cclxuICAgICAgICBpZighcmVsYXRpbnNoaXBOYW1lKSB7XHJcbiAgICAgICAgICAgIGlmKCF2aXN1YWxKc29uW21vZGVsSURdKSB2aXN1YWxKc29uW21vZGVsSURdPXt9XHJcbiAgICAgICAgICAgIHZpc3VhbEpzb25bbW9kZWxJRF0uZGltZW5zaW9uUmF0aW89Y2hvb3NlVmFsXHJcbiAgICAgICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInZpc3VhbERlZmluaXRpb25DaGFuZ2VcIiwgXCJtb2RlbElEXCI6bW9kZWxJRCxcImRpbWVuc2lvblJhdGlvXCI6Y2hvb3NlVmFsIH0pXHJcbiAgICAgICAgICAgIHRoaXMuc2F2ZVZpc3VhbERlZmluaXRpb24oKVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBpZighdmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl0pIHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdPXt9XHJcbiAgICAgICAgICAgIGlmKCF2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdKSB2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGluc2hpcE5hbWVdPXt9XHJcbiAgICAgICAgICAgIHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW5zaGlwTmFtZV0uZWRnZVdpZHRoPWNob29zZVZhbFxyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJ2aXN1YWxEZWZpbml0aW9uQ2hhbmdlXCIsIFwic3JjTW9kZWxJRFwiOm1vZGVsSUQsXCJyZWxhdGlvbnNoaXBOYW1lXCI6cmVsYXRpbnNoaXBOYW1lLFwiZWRnZVdpZHRoXCI6Y2hvb3NlVmFsIH0pXHJcbiAgICAgICAgICAgIHRoaXMuc2F2ZVZpc3VhbERlZmluaXRpb24oKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuc2F2ZVZpc3VhbERlZmluaXRpb249ZnVuY3Rpb24oKXtcclxuICAgICQucG9zdChcInZpc3VhbERlZmluaXRpb24vc2F2ZVZpc3VhbERlZmluaXRpb25cIix7dmlzdWFsRGVmaW5pdGlvbkpzb246Z2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbn0pXHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuZmlsbFJlbGF0aW9uc2hpcEluZm89ZnVuY3Rpb24odmFsaWRSZWxhdGlvbnNoaXBzLHBhcmVudERvbSl7XHJcbiAgICBmb3IodmFyIGluZCBpbiB2YWxpZFJlbGF0aW9uc2hpcHMpe1xyXG4gICAgICAgIHZhciBrZXlEaXY9ICQoXCI8bGFiZWwgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO3BhZGRpbmc6LjFlbSAuM2VtIC4xZW0gLjNlbTttYXJnaW4tcmlnaHQ6LjNlbSc+XCIraW5kK1wiPC9sYWJlbD5cIilcclxuICAgICAgICBwYXJlbnREb20uYXBwZW5kKGtleURpdilcclxuICAgICAgICBrZXlEaXYuY3NzKFwicGFkZGluZy10b3BcIixcIi4xZW1cIilcclxuXHJcbiAgICAgICAgdmFyIGxhYmVsPSQoXCI8bGFiZWwgY2xhc3M9J3czLWxpbWUnIHN0eWxlPSdkaXNwbGF5OmlubGluZTtmb250LXNpemU6OXB4O3BhZGRpbmc6MnB4Jz48L2xhYmVsPlwiKVxyXG4gICAgICAgIGxhYmVsLnRleHQoXCJSZWxhdGlvbnNoaXBcIilcclxuICAgICAgICBwYXJlbnREb20uYXBwZW5kKGxhYmVsKVxyXG4gICAgICAgIGlmKHZhbGlkUmVsYXRpb25zaGlwc1tpbmRdLnRhcmdldCl7XHJcbiAgICAgICAgICAgIHZhciBsYWJlbDE9JChcIjxsYWJlbCBjbGFzcz0ndzMtbGltZScgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO2ZvbnQtc2l6ZTo5cHg7cGFkZGluZzoycHg7bWFyZ2luLWxlZnQ6MnB4Jz48L2xhYmVsPlwiKVxyXG4gICAgICAgICAgICBsYWJlbDEudGV4dCh2YWxpZFJlbGF0aW9uc2hpcHNbaW5kXS50YXJnZXQpXHJcbiAgICAgICAgICAgIHBhcmVudERvbS5hcHBlbmQobGFiZWwxKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIGNvbnRlbnRET009JChcIjxsYWJlbD48L2xhYmVsPlwiKVxyXG4gICAgICAgIGNvbnRlbnRET00uY3NzKFwiZGlzcGxheVwiLFwiYmxvY2tcIilcclxuICAgICAgICBjb250ZW50RE9NLmNzcyhcInBhZGRpbmctbGVmdFwiLFwiMWVtXCIpXHJcbiAgICAgICAgcGFyZW50RG9tLmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgICAgIHRoaXMuZmlsbEVkaXRhYmxlUHJvcGVydGllcyh2YWxpZFJlbGF0aW9uc2hpcHNbaW5kXS5lZGl0YWJsZVJlbGF0aW9uc2hpcFByb3BlcnRpZXMsIGNvbnRlbnRET00pXHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuZmlsbEVkaXRhYmxlUHJvcGVydGllcz1mdW5jdGlvbihqc29uSW5mbyxwYXJlbnREb20pe1xyXG4gICAgZm9yKHZhciBpbmQgaW4ganNvbkluZm8pe1xyXG4gICAgICAgIHZhciBrZXlEaXY9ICQoXCI8bGFiZWwgc3R5bGU9J2Rpc3BsYXk6YmxvY2snPjxsYWJlbCBzdHlsZT0nZGlzcGxheTppbmxpbmU7cGFkZGluZzouMWVtIC4zZW0gLjFlbSAuM2VtO21hcmdpbi1yaWdodDouM2VtJz5cIitpbmQrXCI8L2xhYmVsPjwvbGFiZWw+XCIpXHJcbiAgICAgICAgcGFyZW50RG9tLmFwcGVuZChrZXlEaXYpXHJcbiAgICAgICAga2V5RGl2LmNzcyhcInBhZGRpbmctdG9wXCIsXCIuMWVtXCIpXHJcblxyXG4gICAgICAgIGlmKEFycmF5LmlzQXJyYXkoanNvbkluZm9baW5kXSkpe1xyXG4gICAgICAgICAgICB2YXIgY29udGVudERPTT0kKFwiPGxhYmVsIGNsYXNzPSd3My1kYXJrLWdyYXknID48L2xhYmVsPlwiKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLnRleHQoXCJlbnVtXCIpXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKHtcImZvbnRTaXplXCI6XCI5cHhcIixcInBhZGRpbmdcIjonMnB4J30pXHJcbiAgICAgICAgICAgIGtleURpdi5hcHBlbmQoY29udGVudERPTSlcclxuXHJcbiAgICAgICAgICAgIHZhciB2YWx1ZUFycj1bXVxyXG4gICAgICAgICAgICBqc29uSW5mb1tpbmRdLmZvckVhY2goZWxlPT57dmFsdWVBcnIucHVzaChlbGUuZW51bVZhbHVlKX0pXHJcbiAgICAgICAgICAgIHZhciBsYWJlbDE9JChcIjxsYWJlbCBjbGFzcz0ndzMtZGFyay1ncmF5JyA+PC9sYWJlbD5cIilcclxuICAgICAgICAgICAgbGFiZWwxLmNzcyh7XCJmb250U2l6ZVwiOlwiOXB4XCIsXCJwYWRkaW5nXCI6JzJweCcsXCJtYXJnaW4tbGVmdFwiOlwiMnB4XCJ9KVxyXG4gICAgICAgICAgICBsYWJlbDEudGV4dCh2YWx1ZUFyci5qb2luKCkpXHJcbiAgICAgICAgICAgIGtleURpdi5hcHBlbmQobGFiZWwxKVxyXG4gICAgICAgIH1lbHNlIGlmKHR5cGVvZihqc29uSW5mb1tpbmRdKT09PVwib2JqZWN0XCIpIHtcclxuICAgICAgICAgICAgdmFyIGNvbnRlbnRET009JChcIjxsYWJlbD48L2xhYmVsPlwiKVxyXG4gICAgICAgICAgICBjb250ZW50RE9NLmNzcyhcImRpc3BsYXlcIixcImJsb2NrXCIpXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKFwicGFkZGluZy1sZWZ0XCIsXCIxZW1cIilcclxuICAgICAgICAgICAgdGhpcy5maWxsRWRpdGFibGVQcm9wZXJ0aWVzKGpzb25JbmZvW2luZF0sY29udGVudERPTSlcclxuICAgICAgICAgICAga2V5RGl2LmFwcGVuZChjb250ZW50RE9NKVxyXG4gICAgICAgIH1lbHNlIHtcclxuICAgICAgICAgICAgdmFyIGNvbnRlbnRET009JChcIjxsYWJlbCBjbGFzcz0ndzMtZGFyay1ncmF5JyA+PC9sYWJlbD5cIilcclxuICAgICAgICAgICAgY29udGVudERPTS50ZXh0KGpzb25JbmZvW2luZF0pXHJcbiAgICAgICAgICAgIGNvbnRlbnRET00uY3NzKHtcImZvbnRTaXplXCI6XCI5cHhcIixcInBhZGRpbmdcIjonMnB4J30pXHJcbiAgICAgICAgICAgIGtleURpdi5hcHBlbmQoY29udGVudERPTSlcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLmFkZEFQYXJ0SW5SaWdodFNwYW49ZnVuY3Rpb24ocGFydE5hbWUpe1xyXG4gICAgdmFyIGhlYWRlckRPTT0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJsb2NrIHczLWxpZ2h0LWdyZXkgdzMtbGVmdC1hbGlnblwiIHN0eWxlPVwiZm9udC13ZWlnaHQ6Ym9sZFwiPjwvYnV0dG9uPicpXHJcbiAgICBoZWFkZXJET00udGV4dChwYXJ0TmFtZSlcclxuICAgIHZhciBsaXN0RE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1jb250YWluZXIgdzMtaGlkZSB3My1ib3JkZXIgdzMtc2hvd1wiIHN0eWxlPVwiYmFja2dyb3VuZC1jb2xvcjp3aGl0ZVwiPjwvZGl2PicpXHJcbiAgICB0aGlzLnBhbmVsQ2FyZC5hcHBlbmQoaGVhZGVyRE9NLGxpc3RET00pXHJcblxyXG4gICAgaGVhZGVyRE9NLm9uKFwiY2xpY2tcIiwoZXZ0KT0+IHtcclxuICAgICAgICBpZihsaXN0RE9NLmhhc0NsYXNzKFwidzMtc2hvd1wiKSkgbGlzdERPTS5yZW1vdmVDbGFzcyhcInczLXNob3dcIilcclxuICAgICAgICBlbHNlIGxpc3RET00uYWRkQ2xhc3MoXCJ3My1zaG93XCIpXHJcbiBcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxuICAgIFxyXG4gICAgcmV0dXJuIGxpc3RET007XHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUucmVhZE1vZGVsRmlsZXNDb250ZW50QW5kSW1wb3J0PWFzeW5jIGZ1bmN0aW9uKGZpbGVzKXtcclxuICAgIC8vIGZpbGVzIGlzIGEgRmlsZUxpc3Qgb2YgRmlsZSBvYmplY3RzLiBMaXN0IHNvbWUgcHJvcGVydGllcy5cclxuICAgIHZhciBmaWxlQ29udGVudEFycj1bXVxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGk8IGZpbGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgdmFyIGY9ZmlsZXNbaV1cclxuICAgICAgICAvLyBPbmx5IHByb2Nlc3MganNvbiBmaWxlcy5cclxuICAgICAgICBpZiAoZi50eXBlIT1cImFwcGxpY2F0aW9uL2pzb25cIikgY29udGludWU7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICB2YXIgc3RyPSBhd2FpdCB0aGlzLnJlYWRPbmVGaWxlKGYpXHJcbiAgICAgICAgICAgIHZhciBvYmo9SlNPTi5wYXJzZShzdHIpXHJcbiAgICAgICAgICAgIGlmKEFycmF5LmlzQXJyYXkob2JqKSkgZmlsZUNvbnRlbnRBcnI9ZmlsZUNvbnRlbnRBcnIuY29uY2F0KG9iailcclxuICAgICAgICAgICAgZWxzZSBmaWxlQ29udGVudEFyci5wdXNoKG9iailcclxuICAgICAgICB9Y2F0Y2goZXJyKXtcclxuICAgICAgICAgICAgYWxlcnQoZXJyKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGlmKGZpbGVDb250ZW50QXJyLmxlbmd0aD09MCkgcmV0dXJuO1xyXG4gICAgXHJcbiAgICAkLnBvc3QoXCJlZGl0QURUL2ltcG9ydE1vZGVsc1wiLHtcIm1vZGVsc1wiOkpTT04uc3RyaW5naWZ5KGZpbGVDb250ZW50QXJyKX0sIChkYXRhKT0+IHtcclxuICAgICAgICBpZiAoZGF0YSA9PSBcIlwiKSB7Ly9zdWNjZXNzZnVsXHJcbiAgICAgICAgICAgIHRoaXMubGlzdE1vZGVscyhcInNob3VsZEJyb2FkQ2FzdFwiKVxyXG4gICAgICAgIH0gZWxzZSB7IC8vZXJyb3IgaGFwcGVuc1xyXG4gICAgICAgICAgICBhbGVydChkYXRhKVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgXHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUucmVhZE9uZUZpbGU9IGFzeW5jIGZ1bmN0aW9uKGFGaWxlKXtcclxuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcclxuICAgICAgICAgICAgcmVhZGVyLm9ubG9hZCA9ICgpPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShyZWFkZXIucmVzdWx0KVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICByZWFkZXIucmVhZEFzVGV4dChhRmlsZSk7XHJcbiAgICAgICAgfWNhdGNoKGUpe1xyXG4gICAgICAgICAgICByZWplY3QoZSlcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG59XHJcblxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5saXN0TW9kZWxzPWZ1bmN0aW9uKHNob3VsZEJyb2FkY2FzdCl7XHJcbiAgICB0aGlzLm1vZGVsTGlzdC5lbXB0eSgpXHJcbiAgICB0aGlzLnBhbmVsQ2FyZC5lbXB0eSgpXHJcbiAgICBmb3IodmFyIGluZCBpbiB0aGlzLm1vZGVscykgZGVsZXRlIHRoaXMubW9kZWxzW2luZF1cclxuXHJcbiAgICAkLmdldChcInF1ZXJ5QURUL2xpc3RNb2RlbHNcIiwgKGRhdGEsIHN0YXR1cykgPT4ge1xyXG4gICAgICAgIGlmKGRhdGE9PVwiXCIpIGRhdGE9W11cclxuICAgICAgICBkYXRhLmZvckVhY2gob25lSXRlbT0+e1xyXG4gICAgICAgICAgICBpZihvbmVJdGVtW1wiZGlzcGxheU5hbWVcIl09PW51bGwpIG9uZUl0ZW1bXCJkaXNwbGF5TmFtZVwiXT1vbmVJdGVtW1wiQGlkXCJdXHJcbiAgICAgICAgICAgIGlmKCQuaXNQbGFpbk9iamVjdChvbmVJdGVtW1wiZGlzcGxheU5hbWVcIl0pKXtcclxuICAgICAgICAgICAgICAgIGlmKG9uZUl0ZW1bXCJkaXNwbGF5TmFtZVwiXVtcImVuXCJdKSBvbmVJdGVtW1wiZGlzcGxheU5hbWVcIl09b25lSXRlbVtcImRpc3BsYXlOYW1lXCJdW1wiZW5cIl1cclxuICAgICAgICAgICAgICAgIGVsc2Ugb25lSXRlbVtcImRpc3BsYXlOYW1lXCJdPUpTT04uc3RyaW5naWZ5KG9uZUl0ZW1bXCJkaXNwbGF5TmFtZVwiXSlcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZih0aGlzLm1vZGVsc1tvbmVJdGVtW1wiZGlzcGxheU5hbWVcIl1dIT1udWxsKXtcclxuICAgICAgICAgICAgICAgIC8vcmVwZWF0ZWQgbW9kZWwgZGlzcGxheSBuYW1lXHJcbiAgICAgICAgICAgICAgICBvbmVJdGVtW1wiZGlzcGxheU5hbWVcIl09b25lSXRlbVtcIkBpZFwiXVxyXG4gICAgICAgICAgICB9ICBcclxuICAgICAgICAgICAgdGhpcy5tb2RlbHNbb25lSXRlbVtcImRpc3BsYXlOYW1lXCJdXSA9IG9uZUl0ZW1cclxuICAgICAgICB9KVxyXG4gICAgICAgIGlmKHNob3VsZEJyb2FkY2FzdCl7XHJcbiAgICAgICAgICAgIG1vZGVsQW5hbHl6ZXIuY2xlYXJBbGxNb2RlbHMoKTtcclxuICAgICAgICAgICAgbW9kZWxBbmFseXplci5hZGRNb2RlbHMoZGF0YSlcclxuICAgICAgICAgICAgbW9kZWxBbmFseXplci5hbmFseXplKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmKGRhdGEubGVuZ3RoPT0wKXtcclxuICAgICAgICAgICAgdmFyIHplcm9Nb2RlbEl0ZW09JCgnPGxpIHN0eWxlPVwiZm9udC1zaXplOjAuOWVtXCI+emVybyBtb2RlbCByZWNvcmQuIFBsZWFzZSBpbXBvcnQuLi48L2xpPicpXHJcbiAgICAgICAgICAgIHRoaXMubW9kZWxMaXN0LmFwcGVuZCh6ZXJvTW9kZWxJdGVtKVxyXG4gICAgICAgICAgICB6ZXJvTW9kZWxJdGVtLmNzcyhcImN1cnNvclwiLFwiZGVmYXVsdFwiKVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICB0aGlzLnRyZWU9bmV3IHNpbXBsZVRyZWUodGhpcy5tb2RlbExpc3Qse1wibGVhZk5hbWVQcm9wZXJ0eVwiOlwiZGlzcGxheU5hbWVcIixcIm5vTXVsdGlwbGVTZWxlY3RBbGxvd2VkXCI6dHJ1ZSxcImhpZGVFbXB0eUdyb3VwXCI6dHJ1ZX0pXHJcblxyXG4gICAgICAgICAgICB0aGlzLnRyZWUub3B0aW9ucy5sZWFmTm9kZUljb25GdW5jPShsbik9PntcclxuICAgICAgICAgICAgICAgIHZhciBtb2RlbENsYXNzPWxuLmxlYWZJbmZvW1wiQGlkXCJdXHJcbiAgICAgICAgICAgICAgICB2YXIgY29sb3JDb2RlPVwiZGFya0dyYXlcIlxyXG4gICAgICAgICAgICAgICAgdmFyIHNoYXBlPVwiZWxsaXBzZVwiXHJcbiAgICAgICAgICAgICAgICB2YXIgYXZhcnRhID0gbnVsbFxyXG4gICAgICAgICAgICAgICAgdmFyIGRpbWVuc2lvbj0yMDtcclxuICAgICAgICAgICAgICAgIGlmKGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bZ2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFRdICYmIGdsb2JhbENhY2hlLnZpc3VhbERlZmluaXRpb25bZ2xvYmFsQ2FjaGUuc2VsZWN0ZWRBRFRdW21vZGVsQ2xhc3NdKXtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdmlzdWFsSnNvbiA9Z2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVF1bbW9kZWxDbGFzc11cclxuICAgICAgICAgICAgICAgICAgICB2YXIgY29sb3JDb2RlPSB2aXN1YWxKc29uLmNvbG9yIHx8IFwiZGFya0dyYXlcIlxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBzaGFwZT0gIHZpc3VhbEpzb24uc2hhcGUgfHwgXCJlbGxpcHNlXCJcclxuICAgICAgICAgICAgICAgICAgICB2YXIgYXZhcnRhID0gdmlzdWFsSnNvbi5hdmFydGFcclxuICAgICAgICAgICAgICAgICAgICBpZih2aXN1YWxKc29uLmRpbWVuc2lvblJhdGlvKSBkaW1lbnNpb24qPXBhcnNlRmxvYXQodmlzdWFsSnNvbi5kaW1lbnNpb25SYXRpbylcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHZhciBpY29uRE9NID0gJChcIjxkaXYgc3R5bGU9J3dpZHRoOlwiK2RpbWVuc2lvbitcInB4O2hlaWdodDpcIitkaW1lbnNpb24rXCJweDtmbG9hdDpsZWZ0O3Bvc2l0aW9uOnJlbGF0aXZlJz48L2Rpdj5cIilcclxuICAgICAgICAgICAgICAgIHZhciBpbWdTcmMgPSBlbmNvZGVVUklDb21wb25lbnQodGhpcy5zaGFwZVN2ZyhzaGFwZSwgY29sb3JDb2RlKSlcclxuICAgICAgICAgICAgICAgIGljb25ET00uYXBwZW5kKCQoXCI8aW1nIHNyYz0nZGF0YTppbWFnZS9zdmcreG1sO3V0ZjgsXCIgKyBpbWdTcmMgKyBcIic+PC9pbWc+XCIpKVxyXG4gICAgICAgICAgICAgICAgaWYgKGF2YXJ0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBhdmFydGFpbWcgPSAkKFwiPGltZyBzdHlsZT0ncG9zaXRpb246YWJzb2x1dGU7bGVmdDowcHg7d2lkdGg6NjAlO21hcmdpbjoyMCUnIHNyYz0nXCIgKyBhdmFydGEgKyBcIic+PC9pbWc+XCIpXHJcbiAgICAgICAgICAgICAgICAgICAgaWNvbkRPTS5hcHBlbmQoYXZhcnRhaW1nKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGljb25ET01cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy50cmVlLmNhbGxiYWNrX2FmdGVyU2VsZWN0Tm9kZXM9KG5vZGVzQXJyLG1vdXNlQ2xpY2tEZXRhaWwpPT57XHJcbiAgICAgICAgICAgICAgICB2YXIgdGhlTm9kZT1ub2Rlc0FyclswXVxyXG4gICAgICAgICAgICAgICAgdGhpcy5maWxsUmlnaHRTcGFuKHRoZU5vZGUubGVhZkluZm9bXCJkaXNwbGF5TmFtZVwiXSlcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIGdyb3VwTmFtZUxpc3Q9e31cclxuICAgICAgICAgICAgZm9yKHZhciBtb2RlbE5hbWUgaW4gdGhpcy5tb2RlbHMpICB7XHJcbiAgICAgICAgICAgICAgICB2YXIgbW9kZWxJRD0gdGhpcy5tb2RlbHNbbW9kZWxOYW1lXVtcIkBpZFwiXVxyXG4gICAgICAgICAgICAgICAgZ3JvdXBOYW1lTGlzdFt0aGlzLm1vZGVsTmFtZVRvR3JvdXBOYW1lKG1vZGVsSUQpXT0xXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdmFyIG1vZGVsZ3JvdXBTb3J0QXJyPU9iamVjdC5rZXlzKGdyb3VwTmFtZUxpc3QpXHJcbiAgICAgICAgICAgIG1vZGVsZ3JvdXBTb3J0QXJyLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIGEudG9Mb3dlckNhc2UoKS5sb2NhbGVDb21wYXJlKGIudG9Mb3dlckNhc2UoKSkgfSk7XHJcbiAgICAgICAgICAgIG1vZGVsZ3JvdXBTb3J0QXJyLmZvckVhY2gob25lR3JvdXBOYW1lPT57XHJcbiAgICAgICAgICAgICAgICB2YXIgZ249dGhpcy50cmVlLmFkZEdyb3VwTm9kZSh7IGRpc3BsYXlOYW1lOiBvbmVHcm91cE5hbWUgfSlcclxuICAgICAgICAgICAgICAgIGduLmV4cGFuZCgpXHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICBmb3IodmFyIG1vZGVsTmFtZSBpbiB0aGlzLm1vZGVscyl7XHJcbiAgICAgICAgICAgICAgICB2YXIgbW9kZWxJRD0gdGhpcy5tb2RlbHNbbW9kZWxOYW1lXVtcIkBpZFwiXVxyXG4gICAgICAgICAgICAgICAgdmFyIGduPXRoaXMubW9kZWxOYW1lVG9Hcm91cE5hbWUobW9kZWxJRClcclxuICAgICAgICAgICAgICAgIHRoaXMudHJlZS5hZGRMZWFmbm9kZVRvR3JvdXAoZ24sdGhpcy5tb2RlbHNbbW9kZWxOYW1lXSlcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy50cmVlLnNvcnRBbGxMZWF2ZXMoKVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBpZihzaG91bGRCcm9hZGNhc3QpIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcIkFEVE1vZGVsc0NoYW5nZVwiLCBcIm1vZGVsc1wiOnRoaXMubW9kZWxzIH0pXHJcbiAgICB9KVxyXG5cclxuXHJcbiAgICBcclxuICAgIC8vdmFyIGcxID0gdGhpcy50cmVlLmFkZEdyb3VwTm9kZSh7ZGlzcGxheU5hbWU6XCJ0ZXN0XCJ9KVxyXG4gICAgLy90aGlzLnRyZWUuYWRkTGVhZm5vZGVUb0dyb3VwKFwidGVzdFwiLHtcImRpc3BsYXlOYW1lXCI6XCJoYWhhXCJ9LFwic2tpcFJlcGVhdFwiKVxyXG4gICAgLy9yZXR1cm47XHJcbn1cclxuXHJcbm1vZGVsTWFuYWdlckRpYWxvZy5wcm90b3R5cGUuc2hhcGVTdmc9ZnVuY3Rpb24oc2hhcGUsY29sb3Ipe1xyXG4gICAgaWYoc2hhcGU9PVwiZWxsaXBzZVwiKXtcclxuICAgICAgICByZXR1cm4gJzxzdmcgeG1sbnM6c3ZnPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAxMDAgMTAwXCIgZmlsbD1cIm5vbmVcIiB2ZXJzaW9uPVwiMS4xXCIgPjxjaXJjbGUgY3g9XCI1MFwiIGN5PVwiNTBcIiByPVwiNTBcIiAgZmlsbD1cIicrY29sb3IrJ1wiLz48L3N2Zz4nXHJcbiAgICB9ZWxzZSBpZihzaGFwZT09XCJoZXhhZ29uXCIpe1xyXG4gICAgICAgIHJldHVybiAnPHN2ZyB4bWxuczpzdmc9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDEwMCAxMDBcIiBmaWxsPVwibm9uZVwiIHZlcnNpb249XCIxLjFcIiA+PHBvbHlnb24gcG9pbnRzPVwiNTAgMCwgOTMuMyAyNSwgOTMuMyA3NSwgNTAgMTAwLCA2LjcgNzUsIDYuNyAyNVwiICBmaWxsPVwiJytjb2xvcisnXCIgLz48L3N2Zz4nXHJcbiAgICB9ZWxzZSBpZihzaGFwZT09XCJyb3VuZC1yZWN0YW5nbGVcIil7XHJcbiAgICAgICAgcmV0dXJuICc8c3ZnIHhtbG5zOnN2Zz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHZpZXdCb3g9XCIwIDAgMTAwIDEwMFwiIGZpbGw9XCJub25lXCIgdmVyc2lvbj1cIjEuMVwiID48cmVjdCB4PVwiMTBcIiB5PVwiMTBcIiByeD1cIjEwXCIgcnk9XCIxMFwiIHdpZHRoPVwiODBcIiBoZWlnaHQ9XCI4MFwiIGZpbGw9XCInK2NvbG9yKydcIiAvPjwvc3ZnPidcclxuICAgIH1cclxufVxyXG5cclxubW9kZWxNYW5hZ2VyRGlhbG9nLnByb3RvdHlwZS5tb2RlbE5hbWVUb0dyb3VwTmFtZT1mdW5jdGlvbihtb2RlbE5hbWUpe1xyXG4gICAgdmFyIG5hbWVQYXJ0cz1tb2RlbE5hbWUuc3BsaXQoXCI6XCIpXHJcbiAgICBpZihuYW1lUGFydHMubGVuZ3RoPj0yKSAgcmV0dXJuIG5hbWVQYXJ0c1sxXVxyXG4gICAgZWxzZSByZXR1cm4gXCJPdGhlcnNcIlxyXG59XHJcblxyXG5tb2RlbE1hbmFnZXJEaWFsb2cucHJvdG90eXBlLnJ4TWVzc2FnZT1mdW5jdGlvbihtc2dQYXlsb2FkKXtcclxuICAgIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJBRFRNb2RlbEVkaXRlZFwiKSB0aGlzLmxpc3RNb2RlbHMoXCJzaG91bGRCcm9hZGNhc3RcIilcclxufVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gbmV3IG1vZGVsTWFuYWdlckRpYWxvZygpOyIsImNvbnN0IGdsb2JhbENhY2hlPXJlcXVpcmUoJy4vZ2xvYmFsQ2FjaGUnKVxyXG5mdW5jdGlvbiBzaW1wbGVDb25maXJtRGlhbG9nKCl7XHJcbiAgICB0aGlzLkRPTSA9ICQoJzxkaXYgc3R5bGU9XCJwb3NpdGlvbjphYnNvbHV0ZTt0b3A6NTAlO2JhY2tncm91bmQtY29sb3I6d2hpdGU7bGVmdDo1MCU7dHJhbnNmb3JtOiB0cmFuc2xhdGVYKC01MCUpIHRyYW5zbGF0ZVkoLTUwJSk7ei1pbmRleDoxMDJcIiBjbGFzcz1cInczLWNhcmQtNFwiPjwvZGl2PicpXHJcbiAgICBnbG9iYWxDYWNoZS5tYWtlRE9NRHJhZ2dhYmxlKHRoaXMuRE9NKVxyXG4gICAgLy90aGlzLkRPTS5jc3MoXCJvdmVyZmxvd1wiLFwiaGlkZGVuXCIpXHJcbn1cclxuXHJcbnNpbXBsZUNvbmZpcm1EaWFsb2cucHJvdG90eXBlLnNob3c9ZnVuY3Rpb24oY3NzT3B0aW9ucyxvdGhlck9wdGlvbnMpe1xyXG4gICAgdGhpcy5ET00uY3NzKGNzc09wdGlvbnMpXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQoJCgnPGRpdiBzdHlsZT1cImhlaWdodDo0MHB4XCIgY2xhc3M9XCJ3My1iYXIgdzMtcmVkXCI+PGRpdiBjbGFzcz1cInczLWJhci1pdGVtXCIgc3R5bGU9XCJmb250LXNpemU6MS4yZW1cIj4nICsgb3RoZXJPcHRpb25zLnRpdGxlICsgJzwvZGl2PjwvZGl2PicpKVxyXG4gICAgdmFyIGNsb3NlQnV0dG9uID0gJCgnPGJ1dHRvbiBjbGFzcz1cInczLWJhci1pdGVtIHczLWJ1dHRvbiB3My1yaWdodFwiIHN0eWxlPVwiZm9udC1zaXplOjJlbTtwYWRkaW5nLXRvcDo0cHhcIj7DlzwvYnV0dG9uPicpXHJcbiAgICB0aGlzLkRPTS5jaGlsZHJlbignOmZpcnN0JykuYXBwZW5kKGNsb3NlQnV0dG9uKVxyXG4gICAgY2xvc2VCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7IHRoaXMuY2xvc2UoKSB9KVxyXG5cclxuICAgIHZhciBkaWFsb2dEaXY9JCgnPGRpdiBjbGFzcz1cInczLWNvbnRhaW5lclwiIHN0eWxlPVwibWFyZ2luLXRvcDoxMHB4O21hcmdpbi1ib3R0b206MTBweFwiPjwvZGl2PicpXHJcbiAgICBkaWFsb2dEaXYudGV4dChvdGhlck9wdGlvbnMuY29udGVudClcclxuICAgIHRoaXMuRE9NLmFwcGVuZChkaWFsb2dEaXYpXHJcbiAgICB0aGlzLmRpYWxvZ0Rpdj1kaWFsb2dEaXZcclxuXHJcbiAgICB0aGlzLmJvdHRvbUJhcj0kKCc8ZGl2IGNsYXNzPVwidzMtYmFyXCI+PC9kaXY+JylcclxuICAgIHRoaXMuRE9NLmFwcGVuZCh0aGlzLmJvdHRvbUJhcilcclxuXHJcbiAgICBvdGhlck9wdGlvbnMuYnV0dG9ucy5mb3JFYWNoKGJ0bj0+e1xyXG4gICAgICAgIHZhciBhQnV0dG9uPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtcmlnaHQgJysoYnRuLmNvbG9yQ2xhc3N8fFwiXCIpKydcIiBzdHlsZT1cIm1hcmdpbi1yaWdodDoycHg7bWFyZ2luLWxlZnQ6MnB4XCI+JytidG4udGV4dCsnPC9idXR0b24+JylcclxuICAgICAgICBhQnV0dG9uLm9uKFwiY2xpY2tcIiwoKT0+IHsgYnRuLmNsaWNrRnVuYygpICB9ICApXHJcbiAgICAgICAgdGhpcy5ib3R0b21CYXIuYXBwZW5kKGFCdXR0b24pICAgIFxyXG4gICAgfSlcclxuICAgICQoXCJib2R5XCIpLmFwcGVuZCh0aGlzLkRPTSlcclxufVxyXG5cclxuc2ltcGxlQ29uZmlybURpYWxvZy5wcm90b3R5cGUuY2xvc2U9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuRE9NLnJlbW92ZSgpXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gc2ltcGxlQ29uZmlybURpYWxvZzsiLCJmdW5jdGlvbiBzaW1wbGVTZWxlY3RNZW51KGJ1dHRvbk5hbWUsb3B0aW9ucyl7XHJcbiAgICBvcHRpb25zPW9wdGlvbnN8fHt9IC8ve2lzQ2xpY2thYmxlOjEsd2l0aEJvcmRlcjoxLGZvbnRTaXplOlwiXCIsY29sb3JDbGFzczpcIlwiLGJ1dHRvbkNTUzpcIlwifVxyXG4gICAgaWYob3B0aW9ucy5pc0NsaWNrYWJsZSl7XHJcbiAgICAgICAgdGhpcy5pc0NsaWNrYWJsZT10cnVlXHJcbiAgICAgICAgdGhpcy5ET009JCgnPGRpdiBjbGFzcz1cInczLWRyb3Bkb3duLWNsaWNrXCI+PC9kaXY+JylcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHRoaXMuRE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1kcm9wZG93bi1ob3ZlciBcIj48L2Rpdj4nKVxyXG4gICAgICAgIHRoaXMuRE9NLm9uKFwibW91c2VvdmVyXCIsKGUpPT57XHJcbiAgICAgICAgICAgIHRoaXMuYWRqdXN0RHJvcERvd25Qb3NpdGlvbigpXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuICAgIFxyXG4gICAgdGhpcy5idXR0b249JCgnPGJ1dHRvbiBjbGFzcz1cInczLWJ1dHRvblwiIHN0eWxlPVwib3V0bGluZTogbm9uZTtcIj48YT4nK2J1dHRvbk5hbWUrJzwvYT48YSBzdHlsZT1cImZvbnQtd2VpZ2h0OmJvbGQ7cGFkZGluZy1sZWZ0OjJweFwiPjwvYT48aSBjbGFzcz1cImZhIGZhLWNhcmV0LWRvd25cIiBzdHlsZT1cInBhZGRpbmctbGVmdDozcHhcIj48L2k+PC9idXR0b24+JylcclxuICAgIGlmKG9wdGlvbnMud2l0aEJvcmRlcikgdGhpcy5idXR0b24uYWRkQ2xhc3MoXCJ3My1ib3JkZXJcIilcclxuICAgIGlmKG9wdGlvbnMuZm9udFNpemUpIHRoaXMuRE9NLmNzcyhcImZvbnQtc2l6ZVwiLG9wdGlvbnMuZm9udFNpemUpXHJcbiAgICBpZihvcHRpb25zLmNvbG9yQ2xhc3MpIHRoaXMuYnV0dG9uLmFkZENsYXNzKG9wdGlvbnMuY29sb3JDbGFzcylcclxuICAgIGlmKG9wdGlvbnMud2lkdGgpIHRoaXMuYnV0dG9uLmNzcyhcIndpZHRoXCIsb3B0aW9ucy53aWR0aClcclxuICAgIGlmKG9wdGlvbnMuYnV0dG9uQ1NTKSB0aGlzLmJ1dHRvbi5jc3Mob3B0aW9ucy5idXR0b25DU1MpXHJcbiAgICBpZihvcHRpb25zLmFkanVzdFBvc2l0aW9uQW5jaG9yKSB0aGlzLmFkanVzdFBvc2l0aW9uQW5jaG9yPW9wdGlvbnMuYWRqdXN0UG9zaXRpb25BbmNob3JcclxuXHJcbiAgICB0aGlzLm9wdGlvbkNvbnRlbnRET009JCgnPGRpdiBjbGFzcz1cInczLWRyb3Bkb3duLWNvbnRlbnQgdzMtYmFyLWJsb2NrIHczLWNhcmQtNFwiPjwvZGl2PicpXHJcbiAgICBpZihvcHRpb25zLm9wdGlvbkxpc3RIZWlnaHQpIHRoaXMub3B0aW9uQ29udGVudERPTS5jc3Moe2hlaWdodDpvcHRpb25zLm9wdGlvbkxpc3RIZWlnaHQrXCJweFwiLFwib3ZlcmZsb3cteVwiOlwiYXV0b1wiLFwib3ZlcmZsb3cteFwiOlwidmlzaWJsZVwifSlcclxuICAgIGlmKG9wdGlvbnMub3B0aW9uTGlzdE1hcmdpblRvcCkgdGhpcy5vcHRpb25Db250ZW50RE9NLmNzcyh7XCJtYXJnaW4tdG9wXCI6b3B0aW9ucy5vcHRpb25MaXN0TWFyZ2luVG9wK1wicHhcIn0pXHJcbiAgICBpZihvcHRpb25zLm9wdGlvbkxpc3RNYXJnaW5MZWZ0KSB0aGlzLm9wdGlvbkNvbnRlbnRET00uY3NzKHtcIm1hcmdpbi1sZWZ0XCI6b3B0aW9ucy5vcHRpb25MaXN0TWFyZ2luTGVmdCtcInB4XCJ9KVxyXG4gICAgXHJcbiAgICB0aGlzLkRPTS5hcHBlbmQodGhpcy5idXR0b24sdGhpcy5vcHRpb25Db250ZW50RE9NKVxyXG4gICAgdGhpcy5jdXJTZWxlY3RWYWw9bnVsbDtcclxuXHJcbiAgICBpZihvcHRpb25zLmlzQ2xpY2thYmxlKXtcclxuICAgICAgICB0aGlzLmJ1dHRvbi5vbihcImNsaWNrXCIsKGUpPT57XHJcbiAgICAgICAgICAgIHRoaXMuYWRqdXN0RHJvcERvd25Qb3NpdGlvbigpXHJcbiAgICAgICAgICAgIGlmKHRoaXMub3B0aW9uQ29udGVudERPTS5oYXNDbGFzcyhcInczLXNob3dcIikpICB0aGlzLm9wdGlvbkNvbnRlbnRET00ucmVtb3ZlQ2xhc3MoXCJ3My1zaG93XCIpXHJcbiAgICAgICAgICAgIGVsc2UgdGhpcy5vcHRpb25Db250ZW50RE9NLmFkZENsYXNzKFwidzMtc2hvd1wiKVxyXG4gICAgICAgIH0pICAgIFxyXG4gICAgfVxyXG59XHJcblxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS5hZGp1c3REcm9wRG93blBvc2l0aW9uPWZ1bmN0aW9uKCl7XHJcbiAgICBpZighdGhpcy5hZGp1c3RQb3NpdGlvbkFuY2hvcikgcmV0dXJuO1xyXG4gICAgdmFyIG9mZnNldD10aGlzLkRPTS5vZmZzZXQoKVxyXG4gICAgdmFyIG5ld1RvcD1vZmZzZXQudG9wLXRoaXMuYWRqdXN0UG9zaXRpb25BbmNob3IudG9wXHJcbiAgICB2YXIgbmV3TGVmdD1vZmZzZXQubGVmdC10aGlzLmFkanVzdFBvc2l0aW9uQW5jaG9yLmxlZnRcclxuICAgIHRoaXMub3B0aW9uQ29udGVudERPTS5jc3Moe1widG9wXCI6bmV3VG9wK1wicHhcIixcImxlZnRcIjpuZXdMZWZ0K1wicHhcIn0pXHJcbn1cclxuXHJcbnNpbXBsZVNlbGVjdE1lbnUucHJvdG90eXBlLmZpbmRPcHRpb249ZnVuY3Rpb24ob3B0aW9uVmFsdWUpe1xyXG4gICAgdmFyIG9wdGlvbnM9dGhpcy5vcHRpb25Db250ZW50RE9NLmNoaWxkcmVuKClcclxuICAgIGZvcih2YXIgaT0wO2k8b3B0aW9ucy5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIgYW5PcHRpb249JChvcHRpb25zW2ldKVxyXG4gICAgICAgIGlmKG9wdGlvblZhbHVlPT1hbk9wdGlvbi5kYXRhKFwib3B0aW9uVmFsdWVcIikpe1xyXG4gICAgICAgICAgICByZXR1cm4ge1widGV4dFwiOmFuT3B0aW9uLnRleHQoKSxcInZhbHVlXCI6YW5PcHRpb24uZGF0YShcIm9wdGlvblZhbHVlXCIpfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuc2ltcGxlU2VsZWN0TWVudS5wcm90b3R5cGUuYWRkT3B0aW9uQXJyPWZ1bmN0aW9uKGFycil7XHJcbiAgICBhcnIuZm9yRWFjaChlbGVtZW50ID0+IHtcclxuICAgICAgICB0aGlzLmFkZE9wdGlvbihlbGVtZW50KVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbnNpbXBsZVNlbGVjdE1lbnUucHJvdG90eXBlLmFkZE9wdGlvbj1mdW5jdGlvbihvcHRpb25UZXh0LG9wdGlvblZhbHVlKXtcclxuICAgIHZhciBvcHRpb25JdGVtPSQoJzxhIGhyZWY9XCIjXCIgY2xhc3M9XCJ3My1iYXItaXRlbSB3My1idXR0b25cIj4nK29wdGlvblRleHQrJzwvYT4nKVxyXG4gICAgdGhpcy5vcHRpb25Db250ZW50RE9NLmFwcGVuZChvcHRpb25JdGVtKVxyXG4gICAgb3B0aW9uSXRlbS5kYXRhKFwib3B0aW9uVmFsdWVcIixvcHRpb25WYWx1ZXx8b3B0aW9uVGV4dClcclxuICAgIG9wdGlvbkl0ZW0ub24oJ2NsaWNrJywoZSk9PntcclxuICAgICAgICB0aGlzLmN1clNlbGVjdFZhbD1vcHRpb25JdGVtLmRhdGEoXCJvcHRpb25WYWx1ZVwiKVxyXG4gICAgICAgIGlmKHRoaXMuaXNDbGlja2FibGUpe1xyXG4gICAgICAgICAgICB0aGlzLm9wdGlvbkNvbnRlbnRET00ucmVtb3ZlQ2xhc3MoXCJ3My1zaG93XCIpXHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgIHRoaXMuRE9NLnJlbW92ZUNsYXNzKCd3My1kcm9wZG93bi1ob3ZlcicpXHJcbiAgICAgICAgICAgIHRoaXMuRE9NLmFkZENsYXNzKCd3My1kcm9wZG93bi1jbGljaycpXHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4geyAvL3RoaXMgaXMgdG8gaGlkZSB0aGUgZHJvcCBkb3duIG1lbnUgYWZ0ZXIgY2xpY2tcclxuICAgICAgICAgICAgICAgIHRoaXMuRE9NLmFkZENsYXNzKCd3My1kcm9wZG93bi1ob3ZlcicpXHJcbiAgICAgICAgICAgICAgICB0aGlzLkRPTS5yZW1vdmVDbGFzcygndzMtZHJvcGRvd24tY2xpY2snKVxyXG4gICAgICAgICAgICB9LCAxMDApO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmNhbGxCYWNrX2NsaWNrT3B0aW9uKG9wdGlvblRleHQsb3B0aW9uSXRlbS5kYXRhKFwib3B0aW9uVmFsdWVcIiksXCJyZWFsTW91c2VDbGlja1wiKVxyXG4gICAgfSlcclxufVxyXG5cclxuc2ltcGxlU2VsZWN0TWVudS5wcm90b3R5cGUuY2hhbmdlTmFtZT1mdW5jdGlvbihuYW1lU3RyMSxuYW1lU3RyMil7XHJcbiAgICB0aGlzLmJ1dHRvbi5jaGlsZHJlbihcIjpmaXJzdFwiKS50ZXh0KG5hbWVTdHIxKVxyXG4gICAgdGhpcy5idXR0b24uY2hpbGRyZW4oKS5lcSgxKS50ZXh0KG5hbWVTdHIyKVxyXG59XHJcblxyXG5zaW1wbGVTZWxlY3RNZW51LnByb3RvdHlwZS50cmlnZ2VyT3B0aW9uSW5kZXg9ZnVuY3Rpb24ob3B0aW9uSW5kZXgpe1xyXG4gICAgdmFyIHRoZU9wdGlvbj10aGlzLm9wdGlvbkNvbnRlbnRET00uY2hpbGRyZW4oKS5lcShvcHRpb25JbmRleClcclxuICAgIGlmKHRoZU9wdGlvbi5sZW5ndGg9PTApIHtcclxuICAgICAgICB0aGlzLmN1clNlbGVjdFZhbD1udWxsO1xyXG4gICAgICAgIHRoaXMuY2FsbEJhY2tfY2xpY2tPcHRpb24obnVsbCxudWxsKVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHRoaXMuY3VyU2VsZWN0VmFsPXRoZU9wdGlvbi5kYXRhKFwib3B0aW9uVmFsdWVcIilcclxuICAgIHRoaXMuY2FsbEJhY2tfY2xpY2tPcHRpb24odGhlT3B0aW9uLnRleHQoKSx0aGVPcHRpb24uZGF0YShcIm9wdGlvblZhbHVlXCIpKVxyXG59XHJcbnNpbXBsZVNlbGVjdE1lbnUucHJvdG90eXBlLnRyaWdnZXJPcHRpb25WYWx1ZT1mdW5jdGlvbihvcHRpb25WYWx1ZSl7XHJcbiAgICB2YXIgcmU9dGhpcy5maW5kT3B0aW9uKG9wdGlvblZhbHVlKVxyXG4gICAgaWYocmU9PW51bGwpe1xyXG4gICAgICAgIHRoaXMuY3VyU2VsZWN0VmFsPW51bGxcclxuICAgICAgICB0aGlzLmNhbGxCYWNrX2NsaWNrT3B0aW9uKG51bGwsbnVsbClcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHRoaXMuY3VyU2VsZWN0VmFsPXJlLnZhbHVlXHJcbiAgICAgICAgdGhpcy5jYWxsQmFja19jbGlja09wdGlvbihyZS50ZXh0LHJlLnZhbHVlKVxyXG4gICAgfVxyXG59XHJcblxyXG5cclxuc2ltcGxlU2VsZWN0TWVudS5wcm90b3R5cGUuY2xlYXJPcHRpb25zPWZ1bmN0aW9uKG9wdGlvblRleHQsb3B0aW9uVmFsdWUpe1xyXG4gICAgdGhpcy5vcHRpb25Db250ZW50RE9NLmVtcHR5KClcclxuICAgIHRoaXMuY3VyU2VsZWN0VmFsPW51bGw7XHJcbn1cclxuXHJcbnNpbXBsZVNlbGVjdE1lbnUucHJvdG90eXBlLmNhbGxCYWNrX2NsaWNrT3B0aW9uPWZ1bmN0aW9uKG9wdGlvbnRleHQsb3B0aW9uVmFsdWUscmVhbE1vdXNlQ2xpY2spe1xyXG5cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBzaW1wbGVTZWxlY3RNZW51OyIsIid1c2Ugc3RyaWN0JztcclxuZnVuY3Rpb24gc2ltcGxlVHJlZShET00sb3B0aW9ucyl7XHJcbiAgICB0aGlzLkRPTT1ET01cclxuICAgIHRoaXMuZ3JvdXBOb2Rlcz1bXSAvL2VhY2ggZ3JvdXAgaGVhZGVyIGlzIG9uZSBub2RlXHJcbiAgICB0aGlzLnNlbGVjdGVkTm9kZXM9W107XHJcbiAgICB0aGlzLm9wdGlvbnM9b3B0aW9ucyB8fCB7fVxyXG4gICAgdGhpcy5sYXN0Q2xpY2tlZE5vZGU9bnVsbDtcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuc2Nyb2xsVG9MZWFmTm9kZT1mdW5jdGlvbihhTm9kZSl7XHJcbiAgICB2YXIgc2Nyb2xsVG9wPXRoaXMuRE9NLnNjcm9sbFRvcCgpXHJcbiAgICB2YXIgdHJlZUhlaWdodD10aGlzLkRPTS5oZWlnaHQoKVxyXG4gICAgdmFyIG5vZGVQb3NpdGlvbj1hTm9kZS5ET00ucG9zaXRpb24oKS50b3AgLy93aGljaCBkb2VzIG5vdCBjb25zaWRlciBwYXJlbnQgRE9NJ3Mgc2Nyb2xsIGhlaWdodFxyXG4gICAgLy9jb25zb2xlLmxvZyhzY3JvbGxUb3AsdHJlZUhlaWdodCxub2RlUG9zaXRpb24pXHJcbiAgICBpZih0cmVlSGVpZ2h0LTUwPG5vZGVQb3NpdGlvbil7XHJcbiAgICAgICAgdGhpcy5ET00uc2Nyb2xsVG9wKHNjcm9sbFRvcCArIG5vZGVQb3NpdGlvbi0odHJlZUhlaWdodC01MCkpIFxyXG4gICAgfWVsc2UgaWYobm9kZVBvc2l0aW9uPDUwKXtcclxuICAgICAgICB0aGlzLkRPTS5zY3JvbGxUb3Aoc2Nyb2xsVG9wICsgKG5vZGVQb3NpdGlvbi01MCkpIFxyXG4gICAgfVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5jbGVhckFsbExlYWZOb2Rlcz1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5sYXN0Q2xpY2tlZE5vZGU9bnVsbFxyXG4gICAgdGhpcy5ncm91cE5vZGVzLmZvckVhY2goKGdOb2RlKT0+e1xyXG4gICAgICAgIGdOb2RlLmxpc3RET00uZW1wdHkoKVxyXG4gICAgICAgIGdOb2RlLmNoaWxkTGVhZk5vZGVzLmxlbmd0aD0wXHJcbiAgICAgICAgZ05vZGUucmVmcmVzaE5hbWUoKVxyXG4gICAgfSlcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuZ2V0QWxsTGVhZk5vZGVBcnI9ZnVuY3Rpb24oKXtcclxuICAgIHZhciBhbGxMZWFmPVtdXHJcbiAgICB0aGlzLmdyb3VwTm9kZXMuZm9yRWFjaChnbj0+e1xyXG4gICAgICAgIGFsbExlYWY9YWxsTGVhZi5jb25jYXQoZ24uY2hpbGRMZWFmTm9kZXMpXHJcbiAgICB9KVxyXG4gICAgcmV0dXJuIGFsbExlYWY7XHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmZpcnN0TGVhZk5vZGU9ZnVuY3Rpb24oKXtcclxuICAgIGlmKHRoaXMuZ3JvdXBOb2Rlcy5sZW5ndGg9PTApIHJldHVybiBudWxsO1xyXG4gICAgdmFyIGZpcnN0TGVhZk5vZGU9bnVsbDtcclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5mb3JFYWNoKGFHcm91cE5vZGU9PntcclxuICAgICAgICBpZihmaXJzdExlYWZOb2RlIT1udWxsKSByZXR1cm47XHJcbiAgICAgICAgaWYoYUdyb3VwTm9kZS5jaGlsZExlYWZOb2Rlcy5sZW5ndGg+MCkgZmlyc3RMZWFmTm9kZT1hR3JvdXBOb2RlLmNoaWxkTGVhZk5vZGVzWzBdXHJcbiAgICB9KVxyXG5cclxuICAgIHJldHVybiBmaXJzdExlYWZOb2RlXHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLm5leHRHcm91cE5vZGU9ZnVuY3Rpb24oYUdyb3VwTm9kZSl7XHJcbiAgICBpZihhR3JvdXBOb2RlPT1udWxsKSByZXR1cm47XHJcbiAgICB2YXIgaW5kZXg9dGhpcy5ncm91cE5vZGVzLmluZGV4T2YoYUdyb3VwTm9kZSlcclxuICAgIGlmKHRoaXMuZ3JvdXBOb2Rlcy5sZW5ndGgtMT5pbmRleCl7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ3JvdXBOb2Rlc1tpbmRleCsxXVxyXG4gICAgfWVsc2V7IC8vcm90YXRlIGJhY2t3YXJkIHRvIGZpcnN0IGdyb3VwIG5vZGVcclxuICAgICAgICByZXR1cm4gdGhpcy5ncm91cE5vZGVzWzBdIFxyXG4gICAgfVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5uZXh0TGVhZk5vZGU9ZnVuY3Rpb24oYUxlYWZOb2RlKXtcclxuICAgIGlmKGFMZWFmTm9kZT09bnVsbCkgcmV0dXJuO1xyXG4gICAgdmFyIGFHcm91cE5vZGU9YUxlYWZOb2RlLnBhcmVudEdyb3VwTm9kZVxyXG4gICAgdmFyIGluZGV4PWFHcm91cE5vZGUuY2hpbGRMZWFmTm9kZXMuaW5kZXhPZihhTGVhZk5vZGUpXHJcbiAgICBpZihhR3JvdXBOb2RlLmNoaWxkTGVhZk5vZGVzLmxlbmd0aC0xPmluZGV4KXtcclxuICAgICAgICAvL25leHQgbm9kZSBpcyBpbiBzYW1lIGdyb3VwXHJcbiAgICAgICAgcmV0dXJuIGFHcm91cE5vZGUuY2hpbGRMZWFmTm9kZXNbaW5kZXgrMV1cclxuICAgIH1lbHNle1xyXG4gICAgICAgIC8vZmluZCBuZXh0IGdyb3VwIGZpcnN0IG5vZGVcclxuICAgICAgICB3aGlsZSh0cnVlKXtcclxuICAgICAgICAgICAgdmFyIG5leHRHcm91cE5vZGUgPSB0aGlzLm5leHRHcm91cE5vZGUoYUdyb3VwTm9kZSlcclxuICAgICAgICAgICAgaWYobmV4dEdyb3VwTm9kZS5jaGlsZExlYWZOb2Rlcy5sZW5ndGg9PTApe1xyXG4gICAgICAgICAgICAgICAgYUdyb3VwTm9kZT1uZXh0R3JvdXBOb2RlXHJcbiAgICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG5leHRHcm91cE5vZGUuY2hpbGRMZWFmTm9kZXNbMF1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuc2VhcmNoVGV4dD1mdW5jdGlvbihzdHIpe1xyXG4gICAgaWYoc3RyPT1cIlwiKSByZXR1cm4gbnVsbDtcclxuICAgIC8vc2VhcmNoIGZyb20gY3VycmVudCBzZWxlY3QgaXRlbSB0aGUgbmV4dCBsZWFmIGl0ZW0gY29udGFpbnMgdGhlIHRleHRcclxuICAgIHZhciByZWdleCA9IG5ldyBSZWdFeHAoc3RyLCAnaScpO1xyXG4gICAgdmFyIHN0YXJ0Tm9kZVxyXG4gICAgaWYodGhpcy5zZWxlY3RlZE5vZGVzLmxlbmd0aD09MCkge1xyXG4gICAgICAgIHN0YXJ0Tm9kZT10aGlzLmZpcnN0TGVhZk5vZGUoKVxyXG4gICAgICAgIGlmKHN0YXJ0Tm9kZT09bnVsbCkgcmV0dXJuO1xyXG4gICAgICAgIHZhciB0aGVTdHI9c3RhcnROb2RlLm5hbWU7XHJcbiAgICAgICAgaWYodGhlU3RyLm1hdGNoKHJlZ2V4KSE9bnVsbCl7XHJcbiAgICAgICAgICAgIC8vZmluZCB0YXJnZXQgbm9kZSBcclxuICAgICAgICAgICAgcmV0dXJuIHN0YXJ0Tm9kZVxyXG4gICAgICAgIH1cclxuICAgIH1lbHNlIHN0YXJ0Tm9kZT10aGlzLnNlbGVjdGVkTm9kZXNbMF1cclxuXHJcbiAgICBpZihzdGFydE5vZGU9PW51bGwpIHJldHVybiBudWxsO1xyXG4gICAgXHJcbiAgICB2YXIgZnJvbU5vZGU9c3RhcnROb2RlO1xyXG4gICAgd2hpbGUodHJ1ZSl7XHJcbiAgICAgICAgdmFyIG5leHROb2RlPXRoaXMubmV4dExlYWZOb2RlKGZyb21Ob2RlKVxyXG4gICAgICAgIGlmKG5leHROb2RlPT1zdGFydE5vZGUpIHJldHVybiBudWxsO1xyXG4gICAgICAgIHZhciBuZXh0Tm9kZVN0cj1uZXh0Tm9kZS5uYW1lO1xyXG4gICAgICAgIGlmKG5leHROb2RlU3RyLm1hdGNoKHJlZ2V4KSE9bnVsbCl7XHJcbiAgICAgICAgICAgIC8vZmluZCB0YXJnZXQgbm9kZVxyXG4gICAgICAgICAgICByZXR1cm4gbmV4dE5vZGVcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgZnJvbU5vZGU9bmV4dE5vZGU7XHJcbiAgICAgICAgfVxyXG4gICAgfSAgICBcclxufVxyXG5cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmFkZExlYWZub2RlVG9Hcm91cD1mdW5jdGlvbihncm91cE5hbWUsb2JqLHNraXBSZXBlYXQpe1xyXG4gICAgdmFyIGFHcm91cE5vZGU9dGhpcy5maW5kR3JvdXBOb2RlKGdyb3VwTmFtZSlcclxuICAgIGlmKGFHcm91cE5vZGUgPT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgYUdyb3VwTm9kZS5hZGROb2RlKG9iaixza2lwUmVwZWF0KVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5yZW1vdmVBbGxOb2Rlcz1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5sYXN0Q2xpY2tlZE5vZGU9bnVsbFxyXG4gICAgdGhpcy5ncm91cE5vZGVzLmxlbmd0aD0wO1xyXG4gICAgdGhpcy5zZWxlY3RlZE5vZGVzLmxlbmd0aD0wO1xyXG4gICAgdGhpcy5ET00uZW1wdHkoKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5maW5kR3JvdXBOb2RlPWZ1bmN0aW9uKGdyb3VwTmFtZSl7XHJcbiAgICB2YXIgZm91bmRHcm91cE5vZGU9bnVsbFxyXG4gICAgdGhpcy5ncm91cE5vZGVzLmZvckVhY2goYUdyb3VwTm9kZT0+e1xyXG4gICAgICAgIGlmKGFHcm91cE5vZGUubmFtZT09Z3JvdXBOYW1lKXtcclxuICAgICAgICAgICAgZm91bmRHcm91cE5vZGU9YUdyb3VwTm9kZVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuICAgIHJldHVybiBmb3VuZEdyb3VwTm9kZTtcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuZGVsR3JvdXBOb2RlPWZ1bmN0aW9uKGdub2RlKXtcclxuICAgIHRoaXMubGFzdENsaWNrZWROb2RlPW51bGxcclxuICAgIGdub2RlLmRlbGV0ZVNlbGYoKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5kZWxldGVMZWFmTm9kZT1mdW5jdGlvbihub2RlTmFtZSl7XHJcbiAgICB0aGlzLmxhc3RDbGlja2VkTm9kZT1udWxsXHJcbiAgICB2YXIgZmluZExlYWZOb2RlPW51bGxcclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5mb3JFYWNoKChnTm9kZSk9PntcclxuICAgICAgICBpZihmaW5kTGVhZk5vZGUhPW51bGwpIHJldHVybjtcclxuICAgICAgICBnTm9kZS5jaGlsZExlYWZOb2Rlcy5mb3JFYWNoKChhTGVhZik9PntcclxuICAgICAgICAgICAgaWYoYUxlYWYubmFtZT09bm9kZU5hbWUpe1xyXG4gICAgICAgICAgICAgICAgZmluZExlYWZOb2RlPWFMZWFmXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgfSlcclxuICAgIGlmKGZpbmRMZWFmTm9kZT09bnVsbCkgcmV0dXJuO1xyXG4gICAgZmluZExlYWZOb2RlLmRlbGV0ZVNlbGYoKVxyXG59XHJcblxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuaW5zZXJ0R3JvdXBOb2RlPWZ1bmN0aW9uKG9iaixpbmRleCl7XHJcbiAgICB2YXIgYU5ld0dyb3VwTm9kZSA9IG5ldyBzaW1wbGVUcmVlR3JvdXBOb2RlKHRoaXMsb2JqKVxyXG4gICAgdmFyIGV4aXN0R3JvdXBOb2RlPSB0aGlzLmZpbmRHcm91cE5vZGUoYU5ld0dyb3VwTm9kZS5uYW1lKVxyXG4gICAgaWYoZXhpc3RHcm91cE5vZGUhPW51bGwpIHJldHVybjtcclxuICAgIHRoaXMuZ3JvdXBOb2Rlcy5zcGxpY2UoaW5kZXgsIDAsIGFOZXdHcm91cE5vZGUpO1xyXG5cclxuICAgIGlmKGluZGV4PT0wKXtcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQoYU5ld0dyb3VwTm9kZS5oZWFkZXJET00pXHJcbiAgICAgICAgdGhpcy5ET00uYXBwZW5kKGFOZXdHcm91cE5vZGUubGlzdERPTSlcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHZhciBwcmV2R3JvdXBOb2RlPXRoaXMuZ3JvdXBOb2Rlc1tpbmRleC0xXVxyXG4gICAgICAgIGFOZXdHcm91cE5vZGUuaGVhZGVyRE9NLmluc2VydEFmdGVyKHByZXZHcm91cE5vZGUubGlzdERPTSlcclxuICAgICAgICBhTmV3R3JvdXBOb2RlLmxpc3RET00uaW5zZXJ0QWZ0ZXIoYU5ld0dyb3VwTm9kZS5oZWFkZXJET00pXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGFOZXdHcm91cE5vZGU7XHJcbn1cclxuXHJcbnNpbXBsZVRyZWUucHJvdG90eXBlLmFkZEdyb3VwTm9kZT1mdW5jdGlvbihvYmope1xyXG4gICAgdmFyIGFOZXdHcm91cE5vZGUgPSBuZXcgc2ltcGxlVHJlZUdyb3VwTm9kZSh0aGlzLG9iailcclxuICAgIHZhciBleGlzdEdyb3VwTm9kZT0gdGhpcy5maW5kR3JvdXBOb2RlKGFOZXdHcm91cE5vZGUubmFtZSlcclxuICAgIGlmKGV4aXN0R3JvdXBOb2RlIT1udWxsKSByZXR1cm4gZXhpc3RHcm91cE5vZGU7XHJcbiAgICB0aGlzLmdyb3VwTm9kZXMucHVzaChhTmV3R3JvdXBOb2RlKTtcclxuICAgIHRoaXMuRE9NLmFwcGVuZChhTmV3R3JvdXBOb2RlLmhlYWRlckRPTSlcclxuICAgIHRoaXMuRE9NLmFwcGVuZChhTmV3R3JvdXBOb2RlLmxpc3RET00pXHJcbiAgICByZXR1cm4gYU5ld0dyb3VwTm9kZTtcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuc2VsZWN0TGVhZk5vZGU9ZnVuY3Rpb24obGVhZk5vZGUsbW91c2VDbGlja0RldGFpbCl7XHJcbiAgICB0aGlzLnNlbGVjdExlYWZOb2RlQXJyKFtsZWFmTm9kZV0sbW91c2VDbGlja0RldGFpbClcclxufVxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5hcHBlbmRMZWFmTm9kZVRvU2VsZWN0aW9uPWZ1bmN0aW9uKGxlYWZOb2RlKXtcclxuICAgIHZhciBuZXdBcnI9W10uY29uY2F0KHRoaXMuc2VsZWN0ZWROb2RlcylcclxuICAgIG5ld0Fyci5wdXNoKGxlYWZOb2RlKVxyXG4gICAgdGhpcy5zZWxlY3RMZWFmTm9kZUFycihuZXdBcnIpXHJcbn1cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuYWRkTm9kZUFycmF5VG9TZWxlY3Rpb249ZnVuY3Rpb24oYXJyKXtcclxuICAgIHZhciBuZXdBcnIgPSB0aGlzLnNlbGVjdGVkTm9kZXNcclxuICAgIHZhciBmaWx0ZXJBcnI9YXJyLmZpbHRlcigoaXRlbSkgPT4gbmV3QXJyLmluZGV4T2YoaXRlbSkgPCAwKVxyXG4gICAgbmV3QXJyID0gbmV3QXJyLmNvbmNhdChmaWx0ZXJBcnIpXHJcbiAgICB0aGlzLnNlbGVjdExlYWZOb2RlQXJyKG5ld0FycilcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuc2VsZWN0R3JvdXBOb2RlPWZ1bmN0aW9uKGdyb3VwTm9kZSl7XHJcbiAgICBpZih0aGlzLmNhbGxiYWNrX2FmdGVyU2VsZWN0R3JvdXBOb2RlKSB0aGlzLmNhbGxiYWNrX2FmdGVyU2VsZWN0R3JvdXBOb2RlKGdyb3VwTm9kZS5pbmZvKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5zZWxlY3RMZWFmTm9kZUFycj1mdW5jdGlvbihsZWFmTm9kZUFycixtb3VzZUNsaWNrRGV0YWlsKXtcclxuICAgIGZvcih2YXIgaT0wO2k8dGhpcy5zZWxlY3RlZE5vZGVzLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIHRoaXMuc2VsZWN0ZWROb2Rlc1tpXS5kaW0oKVxyXG4gICAgfVxyXG4gICAgdGhpcy5zZWxlY3RlZE5vZGVzLmxlbmd0aD0wO1xyXG4gICAgdGhpcy5zZWxlY3RlZE5vZGVzPXRoaXMuc2VsZWN0ZWROb2Rlcy5jb25jYXQobGVhZk5vZGVBcnIpXHJcbiAgICBmb3IodmFyIGk9MDtpPHRoaXMuc2VsZWN0ZWROb2Rlcy5sZW5ndGg7aSsrKXtcclxuICAgICAgICB0aGlzLnNlbGVjdGVkTm9kZXNbaV0uaGlnaGxpZ2h0KClcclxuICAgIH1cclxuXHJcbiAgICBpZih0aGlzLmNhbGxiYWNrX2FmdGVyU2VsZWN0Tm9kZXMpIHRoaXMuY2FsbGJhY2tfYWZ0ZXJTZWxlY3ROb2Rlcyh0aGlzLnNlbGVjdGVkTm9kZXMsbW91c2VDbGlja0RldGFpbClcclxufVxyXG5cclxuc2ltcGxlVHJlZS5wcm90b3R5cGUuZGJsQ2xpY2tOb2RlPWZ1bmN0aW9uKHRoZU5vZGUpe1xyXG4gICAgaWYodGhpcy5jYWxsYmFja19hZnRlckRibGNsaWNrTm9kZSkgdGhpcy5jYWxsYmFja19hZnRlckRibGNsaWNrTm9kZSh0aGVOb2RlKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlLnByb3RvdHlwZS5zb3J0QWxsTGVhdmVzPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLmdyb3VwTm9kZXMuZm9yRWFjaChvbmVHcm91cE5vZGU9PntvbmVHcm91cE5vZGUuc29ydE5vZGVzQnlOYW1lKCl9KVxyXG59XHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS10cmVlIGdyb3VwIG5vZGUtLS0tLS0tLS0tLS0tLS1cclxuZnVuY3Rpb24gc2ltcGxlVHJlZUdyb3VwTm9kZShwYXJlbnRUcmVlLG9iail7XHJcbiAgICB0aGlzLnBhcmVudFRyZWU9cGFyZW50VHJlZVxyXG4gICAgdGhpcy5pbmZvPW9ialxyXG4gICAgdGhpcy5jaGlsZExlYWZOb2Rlcz1bXSAvL2l0J3MgY2hpbGQgbGVhZiBub2RlcyBhcnJheVxyXG4gICAgdGhpcy5uYW1lPW9iai5kaXNwbGF5TmFtZTtcclxuICAgIHRoaXMuY3JlYXRlRE9NKClcclxufVxyXG5cclxuc2ltcGxlVHJlZUdyb3VwTm9kZS5wcm90b3R5cGUucmVmcmVzaE5hbWU9ZnVuY3Rpb24oKXsgLy/irKLilonimqtcclxuICAgIHRoaXMuaGVhZGVyRE9NLmVtcHR5KClcclxuICAgIHZhciBuYW1lRGl2PSQoXCI8ZGl2IHN0eWxlPSdkaXNwbGF5OmlubGluZTtwYWRkaW5nLWxlZnQ6NXB4O3BhZGRpbmctcmlnaHQ6M3B4O3ZlcnRpY2FsLWFsaWduOm1pZGRsZSc+PC9kaXY+XCIpXHJcbiAgICBuYW1lRGl2LnRleHQodGhpcy5uYW1lKVxyXG4gICAgXHJcbiAgICBpZih0aGlzLmNoaWxkTGVhZk5vZGVzLmxlbmd0aD4wKSBsYmxDb2xvcj1cInllbGxvd2dyZWVuXCJcclxuICAgIGVsc2UgdmFyIGxibENvbG9yPVwiZGFya0dyYXlcIiBcclxuICAgIHRoaXMuaGVhZGVyRE9NLmNzcyhcImZvbnQtd2VpZ2h0XCIsXCJib2xkXCIpXHJcblxyXG4gICAgaWYodGhpcy5wYXJlbnRUcmVlLm9wdGlvbnMuZ3JvdXBOb2RlSWNvbkZ1bmMpe1xyXG4gICAgICAgIHZhciBpY29uTGFiZWw9dGhpcy5wYXJlbnRUcmVlLm9wdGlvbnMuZ3JvdXBOb2RlSWNvbkZ1bmModGhpcylcclxuICAgICAgICB0aGlzLmhlYWRlckRPTS5hcHBlbmQoaWNvbkxhYmVsKVxyXG4gICAgICAgIHZhciByb3dIZWlnaHQ9aWNvbkxhYmVsLmhlaWdodCgpXHJcbiAgICAgICAgbmFtZURpdi5jc3MoXCJsaW5lLWhlaWdodFwiLHJvd0hlaWdodCtcInB4XCIpXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHZhciBudW1iZXJsYWJlbD0kKFwiPGxhYmVsIHN0eWxlPSdkaXNwbGF5OmlubGluZTtiYWNrZ3JvdW5kLWNvbG9yOlwiK2xibENvbG9yXHJcbiAgICAgICAgK1wiO2NvbG9yOndoaXRlO2ZvbnQtc2l6ZTo5cHg7cGFkZGluZzoycHggNHB4O2ZvbnQtd2VpZ2h0Om5vcm1hbDtib3JkZXItcmFkaXVzOiAycHg7Jz5cIit0aGlzLmNoaWxkTGVhZk5vZGVzLmxlbmd0aCtcIjwvbGFiZWw+XCIpXHJcbiAgICB0aGlzLmhlYWRlckRPTS5hcHBlbmQobmFtZURpdixudW1iZXJsYWJlbCkgXHJcbiAgICBcclxuICAgIHRoaXMuY2hlY2tPcHRpb25IaWRlRW1wdHlHcm91cCgpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWVHcm91cE5vZGUucHJvdG90eXBlLmNoZWNrT3B0aW9uSGlkZUVtcHR5R3JvdXA9ZnVuY3Rpb24oKXtcclxuICAgIGlmICh0aGlzLnBhcmVudFRyZWUub3B0aW9ucy5oaWRlRW1wdHlHcm91cCAmJiB0aGlzLmNoaWxkTGVhZk5vZGVzLmxlbmd0aCA9PSAwKSB7XHJcbiAgICAgICAgdGhpcy5zaHJpbmsoKVxyXG4gICAgICAgIHRoaXMuaGVhZGVyRE9NLmhpZGUoKVxyXG4gICAgICAgIGlmICh0aGlzLmxpc3RET00pIHRoaXMubGlzdERPTS5oaWRlKClcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdGhpcy5oZWFkZXJET00uc2hvdygpXHJcbiAgICAgICAgaWYgKHRoaXMubGlzdERPTSkgdGhpcy5saXN0RE9NLnNob3coKVxyXG4gICAgfVxyXG5cclxufVxyXG5cclxuc2ltcGxlVHJlZUdyb3VwTm9kZS5wcm90b3R5cGUuZGVsZXRlU2VsZiA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMuaGVhZGVyRE9NLnJlbW92ZSgpXHJcbiAgICB0aGlzLmxpc3RET00ucmVtb3ZlKClcclxuICAgIHZhciBwYXJlbnRBcnIgPSB0aGlzLnBhcmVudFRyZWUuZ3JvdXBOb2Rlc1xyXG4gICAgY29uc3QgaW5kZXggPSBwYXJlbnRBcnIuaW5kZXhPZih0aGlzKTtcclxuICAgIGlmIChpbmRleCA+IC0xKSBwYXJlbnRBcnIuc3BsaWNlKGluZGV4LCAxKTtcclxufVxyXG5cclxuc2ltcGxlVHJlZUdyb3VwTm9kZS5wcm90b3R5cGUuY3JlYXRlRE9NPWZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLmhlYWRlckRPTT0kKCc8YnV0dG9uIGNsYXNzPVwidzMtYnV0dG9uIHczLWJsb2NrIHczLWxpZ2h0LWdyZXkgdzMtbGVmdC1hbGlnbiB3My1ib3JkZXItYm90dG9tXCI+PC9idXR0b24+JylcclxuICAgIHRoaXMucmVmcmVzaE5hbWUoKVxyXG4gICAgdGhpcy5saXN0RE9NPSQoJzxkaXYgY2xhc3M9XCJ3My1jb250YWluZXIgdzMtaGlkZSB3My1ib3JkZXIgdzMtcGFkZGluZy0xNlwiPjwvZGl2PicpXHJcblxyXG4gICAgdGhpcy5oZWFkZXJET00ub24oXCJjbGlja1wiLChldnQpPT4ge1xyXG4gICAgICAgIGlmKHRoaXMubGlzdERPTS5oYXNDbGFzcyhcInczLXNob3dcIikpIHRoaXMubGlzdERPTS5yZW1vdmVDbGFzcyhcInczLXNob3dcIilcclxuICAgICAgICBlbHNlIHRoaXMubGlzdERPTS5hZGRDbGFzcyhcInczLXNob3dcIilcclxuXHJcbiAgICAgICAgdGhpcy5wYXJlbnRUcmVlLnNlbGVjdEdyb3VwTm9kZSh0aGlzKSAgICBcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9KTtcclxufVxyXG5cclxuc2ltcGxlVHJlZUdyb3VwTm9kZS5wcm90b3R5cGUuaXNPcGVuPWZ1bmN0aW9uKCl7XHJcbiAgICByZXR1cm4gIHRoaXMubGlzdERPTS5oYXNDbGFzcyhcInczLXNob3dcIilcclxufVxyXG5cclxuXHJcbnNpbXBsZVRyZWVHcm91cE5vZGUucHJvdG90eXBlLmV4cGFuZD1mdW5jdGlvbigpe1xyXG4gICAgaWYodGhpcy5saXN0RE9NKSB0aGlzLmxpc3RET00uYWRkQ2xhc3MoXCJ3My1zaG93XCIpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWVHcm91cE5vZGUucHJvdG90eXBlLnNocmluaz1mdW5jdGlvbigpe1xyXG4gICAgaWYodGhpcy5saXN0RE9NKSB0aGlzLmxpc3RET00ucmVtb3ZlQ2xhc3MoXCJ3My1zaG93XCIpXHJcbn1cclxuXHJcbnNpbXBsZVRyZWVHcm91cE5vZGUucHJvdG90eXBlLnNvcnROb2Rlc0J5TmFtZT1mdW5jdGlvbigpe1xyXG4gICAgdmFyIHRyZWVPcHRpb25zPXRoaXMucGFyZW50VHJlZS5vcHRpb25zXHJcbiAgICBpZih0cmVlT3B0aW9ucy5sZWFmTmFtZVByb3BlcnR5KSB2YXIgbGVhZk5hbWVQcm9wZXJ0eT10cmVlT3B0aW9ucy5sZWFmTmFtZVByb3BlcnR5XHJcbiAgICBlbHNlIGxlYWZOYW1lUHJvcGVydHk9XCIkZHRJZFwiXHJcbiAgICB0aGlzLmNoaWxkTGVhZk5vZGVzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgXHJcbiAgICAgICAgdmFyIGFOYW1lPWEubmFtZS50b0xvd2VyQ2FzZSgpXHJcbiAgICAgICAgdmFyIGJOYW1lPWIubmFtZS50b0xvd2VyQ2FzZSgpXHJcbiAgICAgICAgcmV0dXJuIGFOYW1lLmxvY2FsZUNvbXBhcmUoYk5hbWUpIFxyXG4gICAgfSk7XHJcbiAgICAvL3RoaXMubGlzdERPTS5lbXB0eSgpIC8vTk9URTogQ2FuIG5vdCBkZWxldGUgdGhvc2UgbGVhZiBub2RlIG90aGVyd2lzZSB0aGUgZXZlbnQgaGFuZGxlIGlzIGxvc3RcclxuICAgIHRoaXMuY2hpbGRMZWFmTm9kZXMuZm9yRWFjaChvbmVMZWFmPT57dGhpcy5saXN0RE9NLmFwcGVuZChvbmVMZWFmLkRPTSl9KVxyXG59XHJcblxyXG5zaW1wbGVUcmVlR3JvdXBOb2RlLnByb3RvdHlwZS5hZGROb2RlPWZ1bmN0aW9uKG9iaixza2lwUmVwZWF0KXtcclxuICAgIHZhciB0cmVlT3B0aW9ucz10aGlzLnBhcmVudFRyZWUub3B0aW9uc1xyXG4gICAgaWYodHJlZU9wdGlvbnMubGVhZk5hbWVQcm9wZXJ0eSkgdmFyIGxlYWZOYW1lUHJvcGVydHk9dHJlZU9wdGlvbnMubGVhZk5hbWVQcm9wZXJ0eVxyXG4gICAgZWxzZSBsZWFmTmFtZVByb3BlcnR5PVwiJGR0SWRcIlxyXG5cclxuICAgIGlmKHNraXBSZXBlYXQpe1xyXG4gICAgICAgIHZhciBmb3VuZFJlcGVhdD1mYWxzZTtcclxuICAgICAgICB0aGlzLmNoaWxkTGVhZk5vZGVzLmZvckVhY2goYU5vZGU9PntcclxuICAgICAgICAgICAgaWYoYU5vZGUubmFtZT09b2JqW2xlYWZOYW1lUHJvcGVydHldKSB7XHJcbiAgICAgICAgICAgICAgICBmb3VuZFJlcGVhdD10cnVlXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgICAgIGlmKGZvdW5kUmVwZWF0KSByZXR1cm47XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGFOZXdOb2RlID0gbmV3IHNpbXBsZVRyZWVMZWFmTm9kZSh0aGlzLG9iailcclxuICAgIHRoaXMuY2hpbGRMZWFmTm9kZXMucHVzaChhTmV3Tm9kZSlcclxuICAgIHRoaXMucmVmcmVzaE5hbWUoKVxyXG4gICAgdGhpcy5saXN0RE9NLmFwcGVuZChhTmV3Tm9kZS5ET00pXHJcbn1cclxuXHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLXRyZWUgbGVhZiBub2RlLS0tLS0tLS0tLS0tLS0tLS0tXHJcbmZ1bmN0aW9uIHNpbXBsZVRyZWVMZWFmTm9kZShwYXJlbnRHcm91cE5vZGUsb2JqKXtcclxuICAgIHRoaXMucGFyZW50R3JvdXBOb2RlPXBhcmVudEdyb3VwTm9kZVxyXG4gICAgdGhpcy5sZWFmSW5mbz1vYmo7XHJcblxyXG4gICAgdmFyIHRyZWVPcHRpb25zPXRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUub3B0aW9uc1xyXG4gICAgaWYodHJlZU9wdGlvbnMubGVhZk5hbWVQcm9wZXJ0eSkgdGhpcy5uYW1lPXRoaXMubGVhZkluZm9bdHJlZU9wdGlvbnMubGVhZk5hbWVQcm9wZXJ0eV1cclxuICAgIGVsc2UgdGhpcy5uYW1lPXRoaXMubGVhZkluZm9bXCIkZHRJZFwiXVxyXG5cclxuICAgIHRoaXMuY3JlYXRlTGVhZk5vZGVET00oKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlTGVhZk5vZGUucHJvdG90eXBlLmRlbGV0ZVNlbGYgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLkRPTS5yZW1vdmUoKVxyXG4gICAgdmFyIGdOb2RlID0gdGhpcy5wYXJlbnRHcm91cE5vZGVcclxuICAgIGNvbnN0IGluZGV4ID0gZ05vZGUuY2hpbGRMZWFmTm9kZXMuaW5kZXhPZih0aGlzKTtcclxuICAgIGlmIChpbmRleCA+IC0xKSBnTm9kZS5jaGlsZExlYWZOb2Rlcy5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgZ05vZGUucmVmcmVzaE5hbWUoKVxyXG59XHJcblxyXG5zaW1wbGVUcmVlTGVhZk5vZGUucHJvdG90eXBlLmNsaWNrU2VsZj1mdW5jdGlvbihtb3VzZUNsaWNrRGV0YWlsKXtcclxuICAgIHRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUubGFzdENsaWNrZWROb2RlPXRoaXM7XHJcbiAgICB0aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLnNlbGVjdExlYWZOb2RlKHRoaXMsbW91c2VDbGlja0RldGFpbClcclxufVxyXG5cclxuXHJcbnNpbXBsZVRyZWVMZWFmTm9kZS5wcm90b3R5cGUuY3JlYXRlTGVhZk5vZGVET009ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuRE9NPSQoJzxidXR0b24gY2xhc3M9XCJ3My1idXR0b24gdzMtd2hpdGVcIiBzdHlsZT1cImRpc3BsYXk6YmxvY2s7dGV4dC1hbGlnbjpsZWZ0O3dpZHRoOjk4JVwiPjwvYnV0dG9uPicpXHJcbiAgICB0aGlzLnJlZHJhd0xhYmVsKClcclxuICAgIHZhciBjbGlja0Y9KGUpPT57XHJcbiAgICAgICAgdGhpcy5oaWdobGlnaHQoKTtcclxuICAgICAgICB2YXIgY2xpY2tEZXRhaWw9ZS5kZXRhaWxcclxuICAgICAgICBpZiAoZS5jdHJsS2V5KSB7XHJcbiAgICAgICAgICAgIGlmKHRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUub3B0aW9ucy5ub011bHRpcGxlU2VsZWN0QWxsb3dlZCl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsaWNrU2VsZigpXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5hcHBlbmRMZWFmTm9kZVRvU2VsZWN0aW9uKHRoaXMpXHJcbiAgICAgICAgICAgIHRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUubGFzdENsaWNrZWROb2RlPXRoaXM7XHJcbiAgICAgICAgfWVsc2UgaWYoZS5zaGlmdEtleSl7XHJcbiAgICAgICAgICAgIGlmKHRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUub3B0aW9ucy5ub011bHRpcGxlU2VsZWN0QWxsb3dlZCl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsaWNrU2VsZigpXHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYodGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5sYXN0Q2xpY2tlZE5vZGU9PW51bGwpe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbGlja1NlbGYoKVxyXG4gICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgIHZhciBhbGxMZWFmTm9kZUFycj10aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLmdldEFsbExlYWZOb2RlQXJyKClcclxuICAgICAgICAgICAgICAgIHZhciBpbmRleDEgPSBhbGxMZWFmTm9kZUFyci5pbmRleE9mKHRoaXMucGFyZW50R3JvdXBOb2RlLnBhcmVudFRyZWUubGFzdENsaWNrZWROb2RlKVxyXG4gICAgICAgICAgICAgICAgdmFyIGluZGV4MiA9IGFsbExlYWZOb2RlQXJyLmluZGV4T2YodGhpcylcclxuICAgICAgICAgICAgICAgIGlmKGluZGV4MT09LTEgfHwgaW5kZXgyPT0tMSl7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jbGlja1NlbGYoKVxyXG4gICAgICAgICAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9zZWxlY3QgYWxsIGxlYWYgYmV0d2VlblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBsb3dlckk9IE1hdGgubWluKGluZGV4MSxpbmRleDIpXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGhpZ2hlckk9IE1hdGgubWF4KGluZGV4MSxpbmRleDIpXHJcbiAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIG1pZGRsZUFycj1hbGxMZWFmTm9kZUFyci5zbGljZShsb3dlckksaGlnaGVySSkgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICBtaWRkbGVBcnIucHVzaChhbGxMZWFmTm9kZUFycltoaWdoZXJJXSlcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBhcmVudEdyb3VwTm9kZS5wYXJlbnRUcmVlLmFkZE5vZGVBcnJheVRvU2VsZWN0aW9uKG1pZGRsZUFycilcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICB0aGlzLmNsaWNrU2VsZihjbGlja0RldGFpbClcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLkRPTS5vbihcImNsaWNrXCIsKGUpPT57Y2xpY2tGKGUpfSlcclxuXHJcbiAgICB0aGlzLkRPTS5vbihcImRibGNsaWNrXCIsKGUpPT57XHJcbiAgICAgICAgdGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5kYmxDbGlja05vZGUodGhpcylcclxuICAgIH0pXHJcbn1cclxuXHJcbnNpbXBsZVRyZWVMZWFmTm9kZS5wcm90b3R5cGUucmVkcmF3TGFiZWw9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuRE9NLmVtcHR5KClcclxuICAgIHZhciBuYW1lRGl2PSQoXCI8bGFiZWwgc3R5bGU9J2Rpc3BsYXk6aW5saW5lO3BhZGRpbmctbGVmdDo1cHg7cGFkZGluZy1yaWdodDozcHg7dmVydGljYWwtYWxpZ246bWlkZGxlJz48L2xhYmVsPlwiKVxyXG4gICAgaWYodGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5vcHRpb25zLmxlYWZOb2RlSWNvbkZ1bmMpe1xyXG4gICAgICAgIHZhciBpY29uTGFiZWw9dGhpcy5wYXJlbnRHcm91cE5vZGUucGFyZW50VHJlZS5vcHRpb25zLmxlYWZOb2RlSWNvbkZ1bmModGhpcylcclxuICAgICAgICB0aGlzLkRPTS5hcHBlbmQoaWNvbkxhYmVsKVxyXG4gICAgICAgIHZhciByb3dIZWlnaHQ9aWNvbkxhYmVsLmhlaWdodCgpXHJcbiAgICAgICAgbmFtZURpdi5jc3MoXCJsaW5lLWhlaWdodFwiLHJvd0hlaWdodCtcInB4XCIpXHJcbiAgICB9XHJcbiAgICBuYW1lRGl2LnRleHQodGhpcy5uYW1lKVxyXG4gICAgdGhpcy5ET00uYXBwZW5kKG5hbWVEaXYpXHJcbn1cclxuXHJcblxyXG5zaW1wbGVUcmVlTGVhZk5vZGUucHJvdG90eXBlLmhpZ2hsaWdodD1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5ET00uYWRkQ2xhc3MoXCJ3My1vcmFuZ2VcIilcclxuICAgIHRoaXMuRE9NLmFkZENsYXNzKFwidzMtaG92ZXItYW1iZXJcIilcclxuICAgIHRoaXMuRE9NLnJlbW92ZUNsYXNzKFwidzMtd2hpdGVcIilcclxufVxyXG5zaW1wbGVUcmVlTGVhZk5vZGUucHJvdG90eXBlLmRpbT1mdW5jdGlvbigpe1xyXG4gICAgdGhpcy5ET00ucmVtb3ZlQ2xhc3MoXCJ3My1vcmFuZ2VcIilcclxuICAgIHRoaXMuRE9NLnJlbW92ZUNsYXNzKFwidzMtaG92ZXItYW1iZXJcIilcclxuICAgIHRoaXMuRE9NLmFkZENsYXNzKFwidzMtd2hpdGVcIilcclxufVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gc2ltcGxlVHJlZTsiLCIndXNlIHN0cmljdCc7XHJcblxyXG5jb25zdCBtb2RlbEFuYWx5emVyID0gcmVxdWlyZShcIi4vbW9kZWxBbmFseXplclwiKTtcclxuY29uc3Qgc2ltcGxlU2VsZWN0TWVudSA9IHJlcXVpcmUoXCIuL3NpbXBsZVNlbGVjdE1lbnVcIilcclxuY29uc3Qgc2ltcGxlQ29uZmlybURpYWxvZyA9IHJlcXVpcmUoXCIuL3NpbXBsZUNvbmZpcm1EaWFsb2dcIilcclxuY29uc3QgZ2xvYmFsQ2FjaGUgPSByZXF1aXJlKFwiLi9nbG9iYWxDYWNoZVwiKVxyXG5cclxuXHJcbmZ1bmN0aW9uIHRvcG9sb2d5RE9NKERPTSl7XHJcbiAgICB0aGlzLkRPTT1ET01cclxuICAgIHRoaXMuZGVmYXVsdE5vZGVTaXplPTMwXHJcbiAgICB0aGlzLm5vZGVTaXplTW9kZWxBZGp1c3RtZW50UmF0aW89e31cclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmluaXQ9ZnVuY3Rpb24oKXtcclxuICAgIGN5dG9zY2FwZS53YXJuaW5ncyhmYWxzZSkgIFxyXG4gICAgdGhpcy5jb3JlID0gY3l0b3NjYXBlKHtcclxuICAgICAgICBjb250YWluZXI6ICB0aGlzLkRPTVswXSwgLy8gY29udGFpbmVyIHRvIHJlbmRlciBpblxyXG5cclxuICAgICAgICAvLyBpbml0aWFsIHZpZXdwb3J0IHN0YXRlOlxyXG4gICAgICAgIHpvb206IDEsXHJcbiAgICAgICAgcGFuOiB7IHg6IDAsIHk6IDAgfSxcclxuXHJcbiAgICAgICAgLy8gaW50ZXJhY3Rpb24gb3B0aW9uczpcclxuICAgICAgICBtaW5ab29tOiAwLjEsXHJcbiAgICAgICAgbWF4Wm9vbTogMTAsXHJcbiAgICAgICAgem9vbWluZ0VuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgdXNlclpvb21pbmdFbmFibGVkOiB0cnVlLFxyXG4gICAgICAgIHBhbm5pbmdFbmFibGVkOiB0cnVlLFxyXG4gICAgICAgIHVzZXJQYW5uaW5nRW5hYmxlZDogdHJ1ZSxcclxuICAgICAgICBib3hTZWxlY3Rpb25FbmFibGVkOiB0cnVlLFxyXG4gICAgICAgIHNlbGVjdGlvblR5cGU6ICdzaW5nbGUnLFxyXG4gICAgICAgIHRvdWNoVGFwVGhyZXNob2xkOiA4LFxyXG4gICAgICAgIGRlc2t0b3BUYXBUaHJlc2hvbGQ6IDQsXHJcbiAgICAgICAgYXV0b2xvY2s6IGZhbHNlLFxyXG4gICAgICAgIGF1dG91bmdyYWJpZnk6IGZhbHNlLFxyXG4gICAgICAgIGF1dG91bnNlbGVjdGlmeTogZmFsc2UsXHJcblxyXG4gICAgICAgIC8vIHJlbmRlcmluZyBvcHRpb25zOlxyXG4gICAgICAgIGhlYWRsZXNzOiBmYWxzZSxcclxuICAgICAgICBzdHlsZUVuYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgaGlkZUVkZ2VzT25WaWV3cG9ydDogZmFsc2UsXHJcbiAgICAgICAgdGV4dHVyZU9uVmlld3BvcnQ6IGZhbHNlLFxyXG4gICAgICAgIG1vdGlvbkJsdXI6IGZhbHNlLFxyXG4gICAgICAgIG1vdGlvbkJsdXJPcGFjaXR5OiAwLjIsXHJcbiAgICAgICAgd2hlZWxTZW5zaXRpdml0eTogMC4zLFxyXG4gICAgICAgIHBpeGVsUmF0aW86ICdhdXRvJyxcclxuXHJcbiAgICAgICAgZWxlbWVudHM6IFtdLCAvLyBsaXN0IG9mIGdyYXBoIGVsZW1lbnRzIHRvIHN0YXJ0IHdpdGhcclxuXHJcbiAgICAgICAgc3R5bGU6IFsgLy8gdGhlIHN0eWxlc2hlZXQgZm9yIHRoZSBncmFwaFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxlY3RvcjogJ25vZGUnLFxyXG4gICAgICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICBcIndpZHRoXCI6dGhpcy5kZWZhdWx0Tm9kZVNpemUsXCJoZWlnaHRcIjp0aGlzLmRlZmF1bHROb2RlU2l6ZSxcclxuICAgICAgICAgICAgICAgICAgICAnbGFiZWwnOiAnZGF0YShpZCknLFxyXG4gICAgICAgICAgICAgICAgICAgICdvcGFjaXR5JzowLjksXHJcbiAgICAgICAgICAgICAgICAgICAgJ2ZvbnQtc2l6ZSc6XCIxMnB4XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgJ2ZvbnQtZmFtaWx5JzonR2VuZXZhLCBBcmlhbCwgSGVsdmV0aWNhLCBzYW5zLXNlcmlmJ1xyXG4gICAgICAgICAgICAgICAgICAgIC8vLCdiYWNrZ3JvdW5kLWltYWdlJzogZnVuY3Rpb24oZWxlKXsgcmV0dXJuIFwiaW1hZ2VzL2NhdC5wbmdcIjsgfVxyXG4gICAgICAgICAgICAgICAgICAgIC8vLCdiYWNrZ3JvdW5kLWZpdCc6J2NvbnRhaW4nIC8vY292ZXJcclxuICAgICAgICAgICAgICAgICAgICAsJ2JhY2tncm91bmQtd2lkdGgnOic3MCUnXHJcbiAgICAgICAgICAgICAgICAgICAgLCdiYWNrZ3JvdW5kLWhlaWdodCc6JzcwJSdcclxuICAgICAgICAgICAgICAgICAgICAvLydiYWNrZ3JvdW5kLWNvbG9yJzogZnVuY3Rpb24oIGVsZSApeyByZXR1cm4gZWxlLmRhdGEoJ2JnJykgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBzZWxlY3RvcjogJ2VkZ2UnLFxyXG4gICAgICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICAnd2lkdGgnOjIsXHJcbiAgICAgICAgICAgICAgICAgICAgJ2xpbmUtY29sb3InOiAnIzg4OCcsXHJcbiAgICAgICAgICAgICAgICAgICAgJ3RhcmdldC1hcnJvdy1jb2xvcic6ICcjNTU1JyxcclxuICAgICAgICAgICAgICAgICAgICAndGFyZ2V0LWFycm93LXNoYXBlJzogJ3RyaWFuZ2xlJyxcclxuICAgICAgICAgICAgICAgICAgICAnY3VydmUtc3R5bGUnOiAnYmV6aWVyJyxcclxuICAgICAgICAgICAgICAgICAgICAnYXJyb3ctc2NhbGUnOjAuNlxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7c2VsZWN0b3I6ICdlZGdlOnNlbGVjdGVkJyxcclxuICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICd3aWR0aCc6IDMsXHJcbiAgICAgICAgICAgICAgICAnbGluZS1jb2xvcic6ICdyZWQnLFxyXG4gICAgICAgICAgICAgICAgJ3RhcmdldC1hcnJvdy1jb2xvcic6ICdyZWQnLFxyXG4gICAgICAgICAgICAgICAgJ3NvdXJjZS1hcnJvdy1jb2xvcic6ICdyZWQnLFxyXG4gICAgICAgICAgICAgICAgJ2xpbmUtZmlsbCc6XCJsaW5lYXItZ3JhZGllbnRcIixcclxuICAgICAgICAgICAgICAgICdsaW5lLWdyYWRpZW50LXN0b3AtY29sb3JzJzpbJ2N5YW4nLCAnbWFnZW50YScsICd5ZWxsb3cnXSxcclxuICAgICAgICAgICAgICAgICdsaW5lLWdyYWRpZW50LXN0b3AtcG9zaXRpb25zJzpbJzAlJywnNzAlJywnMTAwJSddXHJcbiAgICAgICAgICAgIH19LFxyXG4gICAgICAgICAgICB7c2VsZWN0b3I6ICdub2RlOnNlbGVjdGVkJyxcclxuICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICdib3JkZXItY29sb3InOlwicmVkXCIsXHJcbiAgICAgICAgICAgICAgICAnYm9yZGVyLXdpZHRoJzoyLFxyXG4gICAgICAgICAgICAgICAgJ2JhY2tncm91bmQtZmlsbCc6J3JhZGlhbC1ncmFkaWVudCcsXHJcbiAgICAgICAgICAgICAgICAnYmFja2dyb3VuZC1ncmFkaWVudC1zdG9wLWNvbG9ycyc6WydjeWFuJywgJ21hZ2VudGEnLCAneWVsbG93J10sXHJcbiAgICAgICAgICAgICAgICAnYmFja2dyb3VuZC1ncmFkaWVudC1zdG9wLXBvc2l0aW9ucyc6WycwJScsJzUwJScsJzYwJSddXHJcbiAgICAgICAgICAgIH19LFxyXG4gICAgICAgICAgICB7c2VsZWN0b3I6ICdub2RlLmhvdmVyJyxcclxuICAgICAgICAgICAgc3R5bGU6IHtcclxuICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kLWJsYWNrZW4nOjAuNVxyXG4gICAgICAgICAgICB9fVxyXG4gICAgICAgICAgICAse3NlbGVjdG9yOiAnZWRnZS5ob3ZlcicsXHJcbiAgICAgICAgICAgIHN0eWxlOiB7XHJcbiAgICAgICAgICAgICAgICAnd2lkdGgnOjVcclxuICAgICAgICAgICAgfX1cclxuICAgICAgICBdXHJcbiAgICB9KTtcclxuXHJcbiAgICAvL2N5dG9zY2FwZSBlZGdlIGVkaXRpbmcgcGx1Zy1pblxyXG4gICAgdGhpcy5jb3JlLmVkZ2VFZGl0aW5nKHtcclxuICAgICAgICB1bmRvYWJsZTogdHJ1ZSxcclxuICAgICAgICBiZW5kUmVtb3ZhbFNlbnNpdGl2aXR5OiAxNixcclxuICAgICAgICBlbmFibGVNdWx0aXBsZUFuY2hvclJlbW92YWxPcHRpb246IHRydWUsXHJcbiAgICAgICAgc3RpY2t5QW5jaG9yVG9sZXJlbmNlOiAyMCxcclxuICAgICAgICBhbmNob3JTaGFwZVNpemVGYWN0b3I6IDUsXHJcbiAgICAgICAgZW5hYmxlQW5jaG9yU2l6ZU5vdEltcGFjdEJ5Wm9vbTp0cnVlLFxyXG4gICAgICAgIGVuYWJsZVJlbW92ZUFuY2hvck1pZE9mTmVhckxpbmU6ZmFsc2UsXHJcbiAgICAgICAgZW5hYmxlQ3JlYXRlQW5jaG9yT25EcmFnOmZhbHNlXHJcbiAgICB9KTtcclxuXHJcbiAgICBcclxuICAgIHRoaXMuY29yZS5ib3hTZWxlY3Rpb25FbmFibGVkKHRydWUpXHJcblxyXG5cclxuICAgIHRoaXMuY29yZS5vbigndGFwc2VsZWN0JywgKCk9Pnt0aGlzLnNlbGVjdEZ1bmN0aW9uKCl9KTtcclxuICAgIHRoaXMuY29yZS5vbigndGFwdW5zZWxlY3QnLCAoKT0+e3RoaXMuc2VsZWN0RnVuY3Rpb24oKX0pO1xyXG5cclxuICAgIHRoaXMuY29yZS5vbignYm94ZW5kJywoZSk9PnsvL3B1dCBpbnNpZGUgYm94ZW5kIGV2ZW50IHRvIHRyaWdnZXIgb25seSBvbmUgdGltZSwgYW5kIHJlcGxlYXRseSBhZnRlciBlYWNoIGJveCBzZWxlY3RcclxuICAgICAgICB0aGlzLmNvcmUub25lKCdib3hzZWxlY3QnLCgpPT57dGhpcy5zZWxlY3RGdW5jdGlvbigpfSlcclxuICAgIH0pXHJcblxyXG4gICAgdGhpcy5jb3JlLm9uKCdjeHR0YXAnLChlKT0+e1xyXG4gICAgICAgIHRoaXMuY2FuY2VsVGFyZ2V0Tm9kZU1vZGUoKVxyXG4gICAgfSlcclxuXHJcbiAgICB0aGlzLmNvcmUub24oJ21vdXNlb3ZlcicsZT0+e1xyXG5cclxuICAgICAgICB0aGlzLm1vdXNlT3ZlckZ1bmN0aW9uKGUpXHJcbiAgICB9KVxyXG4gICAgdGhpcy5jb3JlLm9uKCdtb3VzZW91dCcsZT0+e1xyXG4gICAgICAgIHRoaXMubW91c2VPdXRGdW5jdGlvbihlKVxyXG4gICAgfSlcclxuICAgIFxyXG4gICAgdGhpcy5jb3JlLm9uKFwiem9vbVwiLChlKT0+e1xyXG4gICAgICAgIHZhciBmcz10aGlzLmdldEZvbnRTaXplSW5DdXJyZW50Wm9vbSgpO1xyXG4gICAgICAgIHZhciBkaW1lbnNpb249dGhpcy5nZXROb2RlU2l6ZUluQ3VycmVudFpvb20oKTtcclxuXHJcbiAgICAgICAgdmFyIGFycj1bXHJcbiAgICAgICAgICAgIHtzZWxlY3Rvcjonbm9kZScsc3R5bGU6eyAnZm9udC1zaXplJzogZnMsIHdpZHRoOiBkaW1lbnNpb24sIGhlaWdodDogZGltZW5zaW9uIH19LFxyXG4gICAgICAgICAgICB7c2VsZWN0b3I6J25vZGU6c2VsZWN0ZWQnLHN0eWxlOnsgJ2JvcmRlci13aWR0aCc6IE1hdGguY2VpbChkaW1lbnNpb24gLyAxNSkgfX0sXHJcbiAgICAgICAgXVxyXG4gICAgICAgIGZvciAodmFyIG1vZGVsSUQgaW4gdGhpcy5ub2RlU2l6ZU1vZGVsQWRqdXN0bWVudFJhdGlvKSB7XHJcbiAgICAgICAgICAgIHZhciBuZXdEaW1lbnNpb24gPSBNYXRoLmNlaWwodGhpcy5ub2RlU2l6ZU1vZGVsQWRqdXN0bWVudFJhdGlvW21vZGVsSURdICogZGltZW5zaW9uKVxyXG4gICAgICAgICAgICBhcnIucHVzaCh7c2VsZWN0b3I6J25vZGVbbW9kZWxJRCA9IFwiJyArIG1vZGVsSUQgKyAnXCJdJyxzdHlsZTp7IHdpZHRoOiBuZXdEaW1lbnNpb24sIGhlaWdodDogbmV3RGltZW5zaW9uIH19KVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnVwZGF0ZVN0eWxlU2hlZXQoYXJyKVxyXG4gICAgfSlcclxuXHJcbiAgICB2YXIgaW5zdGFuY2UgPSB0aGlzLmNvcmUuZWRnZUVkaXRpbmcoJ2dldCcpO1xyXG4gICAgdmFyIHRhcGRyYWdIYW5kbGVyPShlKSA9PiB7XHJcbiAgICAgICAgaW5zdGFuY2Uua2VlcEFuY2hvcnNBYnNvbHV0ZVBvc2l0aW9uRHVyaW5nTW92aW5nKClcclxuICAgICAgICB0aGlzLnNtYXJ0UG9zaXRpb25Ob2RlKGUucG9zaXRpb24pXHJcbiAgICB9XHJcbiAgICB2YXIgc2V0T25lVGltZUdyYWIgPSAoKSA9PiB7XHJcbiAgICAgICAgdGhpcy5jb3JlLm9uY2UoXCJncmFiXCIsIChlKSA9PiB7XHJcbiAgICAgICAgICAgIGlmKGUudGFyZ2V0LmlzTm9kZSAmJiBlLnRhcmdldC5pc05vZGUoKSkgdGhpcy5kcmFnZ2luZ05vZGU9ZS50YXJnZXRcclxuICAgICAgICAgICAgdmFyIGRyYWdnaW5nTm9kZXMgPSB0aGlzLmNvcmUuY29sbGVjdGlvbigpXHJcbiAgICAgICAgICAgIGlmIChlLnRhcmdldC5pc05vZGUoKSkgZHJhZ2dpbmdOb2Rlcy5tZXJnZShlLnRhcmdldClcclxuICAgICAgICAgICAgdmFyIGFyciA9IHRoaXMuY29yZS4kKFwiOnNlbGVjdGVkXCIpXHJcbiAgICAgICAgICAgIGFyci5mb3JFYWNoKChlbGUpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChlbGUuaXNOb2RlKCkpIGRyYWdnaW5nTm9kZXMubWVyZ2UoZWxlKVxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICBpbnN0YW5jZS5zdG9yZUFuY2hvcnNBYnNvbHV0ZVBvc2l0aW9uKGRyYWdnaW5nTm9kZXMpXHJcbiAgICAgICAgICAgIHRoaXMuY29yZS5vbihcInRhcGRyYWdcIix0YXBkcmFnSGFuZGxlciApXHJcbiAgICAgICAgICAgIHNldE9uZVRpbWVGcmVlKClcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG4gICAgdmFyIHNldE9uZVRpbWVGcmVlID0gKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuY29yZS5vbmNlKFwiZnJlZVwiLCAoZSkgPT4ge1xyXG4gICAgICAgICAgICB2YXIgaW5zdGFuY2UgPSB0aGlzLmNvcmUuZWRnZUVkaXRpbmcoJ2dldCcpO1xyXG4gICAgICAgICAgICBpbnN0YW5jZS5yZXNldEFuY2hvcnNBYnNvbHV0ZVBvc2l0aW9uKClcclxuICAgICAgICAgICAgdGhpcy5kcmFnZ2luZ05vZGU9bnVsbFxyXG4gICAgICAgICAgICBzZXRPbmVUaW1lR3JhYigpXHJcbiAgICAgICAgICAgIHRoaXMuY29yZS5yZW1vdmVMaXN0ZW5lcihcInRhcGRyYWdcIix0YXBkcmFnSGFuZGxlcilcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG4gICAgc2V0T25lVGltZUdyYWIoKVxyXG5cclxuICAgIHZhciB1ciA9IHRoaXMuY29yZS51bmRvUmVkbyh7aXNEZWJ1ZzogZmFsc2V9KTtcclxuICAgIHRoaXMudXI9dXIgICAgXHJcbiAgICB0aGlzLmNvcmUudHJpZ2dlcihcInpvb21cIilcclxuICAgIHRoaXMuc2V0S2V5RG93bkZ1bmMoKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuc21hcnRQb3NpdGlvbk5vZGUgPSBmdW5jdGlvbiAobW91c2VQb3NpdGlvbikge1xyXG4gICAgdmFyIHpvb21MZXZlbD10aGlzLmNvcmUuem9vbSgpXHJcbiAgICBpZighdGhpcy5kcmFnZ2luZ05vZGUpIHJldHVyblxyXG4gICAgLy9jb25zaWRlciBsb2NrIG1vdXNlIG1vdmUgcG9zaXRpb24gZm9yIHRoZXNlIG5vZGVzOlxyXG4gICAgLy8gLSBpdHMgY29ubmVjdGZyb20gbm9kZXMgYW5kIHRoZWlyIGNvbm5lY3R0byBub2Rlc1xyXG4gICAgLy8gLSBpdHMgY29ubmVjdHRvIG5vZGVzIGFuZCB0aGVpciBjb25uZWN0ZnJvbSBub2Rlc1xyXG4gICAgdmFyIGluY29tZXJzPXRoaXMuZHJhZ2dpbmdOb2RlLmluY29tZXJzKClcclxuICAgIHZhciBvdXRlcj10aGlzLmRyYWdnaW5nTm9kZS5vdXRnb2VycygpXHJcblxyXG4gICAgLy9hbHNvIGZpbmQgdGhlIG5lYXJieSBub2RlIHdpdGhpbiBjZXJ0YWluIHggeSBvZmZzZXQgYXJlYVxyXG4gICAgdmFyIHJwb3M9dGhpcy5kcmFnZ2luZ05vZGUucmVuZGVyZWRQb3NpdGlvbigpXHJcbiAgICB2YXIgbmVhcmJ5Tm9kZXM9dGhpcy5jb3JlLmNvbGxlY3Rpb24oKVxyXG4gICAgdmFyIHRocmVzaG9sZD0xNTBcclxuICAgIHRoaXMuY29yZS5ub2RlcygpLmZvckVhY2goZWxlPT57XHJcbiAgICAgICAgdmFyIGVsZVJQb3M9ZWxlLnJlbmRlcmVkUG9zaXRpb24oKVxyXG4gICAgICAgIGlmKE1hdGguYWJzKGVsZVJQb3MueC1ycG9zLngpPHRocmVzaG9sZCAmJiBNYXRoLmFicyhlbGVSUG9zLnktcnBvcy55KTx0aHJlc2hvbGQpIHtcclxuICAgICAgICAgICAgbmVhcmJ5Tm9kZXMubWVyZ2UoZWxlKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbiAgICBcclxuICAgIHZhciBtb25pdG9yU2V0PWluY29tZXJzLnVuaW9uKG91dGVyKS51bmlvbihuZWFyYnlOb2RlcykuZmlsdGVyKCdub2RlJykudW5tZXJnZSh0aGlzLmRyYWdnaW5nTm9kZSlcclxuXHJcbiAgICB2YXIgcmV0dXJuRXhwZWN0ZWRQb3M9KGRpZmZBcnIscG9zQXJyKT0+e1xyXG4gICAgICAgIHZhciBtaW5EaXN0YW5jZT1NYXRoLm1pbiguLi5kaWZmQXJyKVxyXG4gICAgICAgIGlmKG1pbkRpc3RhbmNlKnpvb21MZXZlbCA8IDEwKSAgcmV0dXJuIHBvc0FycltkaWZmQXJyLmluZGV4T2YobWluRGlzdGFuY2UpXVxyXG4gICAgICAgIGVsc2UgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHhEaWZmPVtdXHJcbiAgICB2YXIgeFBvcz1bXVxyXG4gICAgdmFyIHlEaWZmPVtdXHJcbiAgICB2YXIgeVBvcz1bXVxyXG4gICAgbW9uaXRvclNldC5mb3JFYWNoKChlbGUpPT57XHJcbiAgICAgICAgeERpZmYucHVzaChNYXRoLmFicyhlbGUucG9zaXRpb24oKS54LW1vdXNlUG9zaXRpb24ueCkpXHJcbiAgICAgICAgeFBvcy5wdXNoKGVsZS5wb3NpdGlvbigpLngpXHJcbiAgICAgICAgeURpZmYucHVzaChNYXRoLmFicyhlbGUucG9zaXRpb24oKS55LW1vdXNlUG9zaXRpb24ueSkpXHJcbiAgICAgICAgeVBvcy5wdXNoKGVsZS5wb3NpdGlvbigpLnkpXHJcbiAgICB9KVxyXG4gICAgdmFyIHByZWZYPXJldHVybkV4cGVjdGVkUG9zKHhEaWZmLHhQb3MpXHJcbiAgICB2YXIgcHJlZlk9cmV0dXJuRXhwZWN0ZWRQb3MoeURpZmYseVBvcylcclxuICAgIGlmKHByZWZYIT1udWxsKSB7XHJcbiAgICAgICAgdGhpcy5kcmFnZ2luZ05vZGUucG9zaXRpb24oJ3gnLCBwcmVmWCk7XHJcbiAgICB9XHJcbiAgICBpZihwcmVmWSE9bnVsbCkge1xyXG4gICAgICAgIHRoaXMuZHJhZ2dpbmdOb2RlLnBvc2l0aW9uKCd5JywgcHJlZlkpO1xyXG4gICAgfVxyXG4gICAgLy9jb25zb2xlLmxvZyhcIi0tLS1cIilcclxuICAgIC8vbW9uaXRvclNldC5mb3JFYWNoKChlbGUpPT57Y29uc29sZS5sb2coZWxlLmlkKCkpfSlcclxuICAgIC8vY29uc29sZS5sb2cobW9uaXRvclNldC5zaXplKCkpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5tb3VzZU92ZXJGdW5jdGlvbj0gZnVuY3Rpb24gKGUpIHtcclxuICAgIGlmKCFlLnRhcmdldC5kYXRhKSByZXR1cm5cclxuXHJcbiAgICB2YXIgaW5mbz1lLnRhcmdldC5kYXRhKCkub3JpZ2luYWxJbmZvXHJcbiAgICBpZihpbmZvPT1udWxsKSByZXR1cm47XHJcbiAgICBpZih0aGlzLmxhc3RIb3ZlclRhcmdldCkgdGhpcy5sYXN0SG92ZXJUYXJnZXQucmVtb3ZlQ2xhc3MoXCJob3ZlclwiKVxyXG4gICAgdGhpcy5sYXN0SG92ZXJUYXJnZXQ9ZS50YXJnZXRcclxuICAgIGUudGFyZ2V0LmFkZENsYXNzKFwiaG92ZXJcIilcclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInNob3dJbmZvSG92ZXJlZEVsZVwiLCBcImluZm9cIjogW2luZm9dLFwic2NyZWVuWFlcIjp0aGlzLmNvbnZlcnRQb3NpdGlvbihlLnBvc2l0aW9uLngsZS5wb3NpdGlvbi55KSB9KVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuY29udmVydFBvc2l0aW9uPWZ1bmN0aW9uKHgseSl7XHJcbiAgICB2YXIgdnBFeHRlbnQ9dGhpcy5jb3JlLmV4dGVudCgpXHJcbiAgICB2YXIgc2NyZWVuVz10aGlzLkRPTS53aWR0aCgpXHJcbiAgICB2YXIgc2NyZWVuSD10aGlzLkRPTS5oZWlnaHQoKVxyXG4gICAgdmFyIHNjcmVlblggPSAoeC12cEV4dGVudC54MSkvKHZwRXh0ZW50LncpKnNjcmVlblcgKyB0aGlzLkRPTS5vZmZzZXQoKS5sZWZ0XHJcbiAgICB2YXIgc2NyZWVuWT0oeS12cEV4dGVudC55MSkvKHZwRXh0ZW50LmgpKnNjcmVlbkgrIHRoaXMuRE9NLm9mZnNldCgpLnRvcFxyXG4gICAgcmV0dXJuIHt4OnNjcmVlblgseTpzY3JlZW5ZfVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUubW91c2VPdXRGdW5jdGlvbj0gZnVuY3Rpb24gKGUpIHtcclxuICAgIGlmKCFnbG9iYWxDYWNoZS5zaG93RmxvYXRJbmZvUGFuZWwpeyAvL3NpbmNlIGZsb2F0aW5nIHdpbmRvdyBpcyB1c2VkIGZvciBtb3VzZSBob3ZlciBlbGVtZW50IGluZm8sIHNvIGluZm8gcGFuZWwgbmV2ZXIgY2hhZ25lIGJlZm9yZSwgdGhhdCBpcyB3aHkgdGhlcmUgaXMgbm8gbmVlZCB0byByZXN0b3JlIGJhY2sgdGhlIGluZm8gcGFuZWwgaW5mb3JtYXRpb24gYXQgbW91c2VvdXRcclxuICAgICAgICBpZihnbG9iYWxDYWNoZS5zaG93aW5nQ3JlYXRlVHdpbk1vZGVsSUQpe1xyXG4gICAgICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJzaG93SW5mb0dyb3VwTm9kZVwiLCBcImluZm9cIjoge1wiQGlkXCI6Z2xvYmFsQ2FjaGUuc2hvd2luZ0NyZWF0ZVR3aW5Nb2RlbElEfSB9KVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdEZ1bmN0aW9uKClcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInRvcG9sb2d5TW91c2VPdXRcIn0pXHJcblxyXG4gICAgaWYodGhpcy5sYXN0SG92ZXJUYXJnZXQpe1xyXG4gICAgICAgIHRoaXMubGFzdEhvdmVyVGFyZ2V0LnJlbW92ZUNsYXNzKFwiaG92ZXJcIilcclxuICAgICAgICB0aGlzLmxhc3RIb3ZlclRhcmdldD1udWxsO1xyXG4gICAgfSBcclxuXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5zZWxlY3RGdW5jdGlvbiA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBhcnIgPSB0aGlzLmNvcmUuJChcIjpzZWxlY3RlZFwiKVxyXG4gICAgdmFyIHJlID0gW11cclxuICAgIGFyci5mb3JFYWNoKChlbGUpID0+IHsgcmUucHVzaChlbGUuZGF0YSgpLm9yaWdpbmFsSW5mbykgfSlcclxuICAgIGdsb2JhbENhY2hlLnNob3dpbmdDcmVhdGVUd2luTW9kZWxJRD1udWxsOyBcclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInNob3dJbmZvU2VsZWN0ZWROb2Rlc1wiLCBpbmZvOiByZSB9KVxyXG5cclxuICAgIC8vZm9yIGRlYnVnZ2luZyBwdXJwb3NlXHJcbiAgICAvL2Fyci5mb3JFYWNoKChlbGUpPT57XHJcbiAgICAvLyAgY29uc29sZS5sb2coXCJcIilcclxuICAgIC8vfSlcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmdldEZvbnRTaXplSW5DdXJyZW50Wm9vbT1mdW5jdGlvbigpe1xyXG4gICAgdmFyIGN1clpvb209dGhpcy5jb3JlLnpvb20oKVxyXG4gICAgaWYoY3VyWm9vbT4xKXtcclxuICAgICAgICB2YXIgbWF4RlM9MTJcclxuICAgICAgICB2YXIgbWluRlM9NVxyXG4gICAgICAgIHZhciByYXRpbz0gKG1heEZTL21pbkZTLTEpLzkqKGN1clpvb20tMSkrMVxyXG4gICAgICAgIHZhciBmcz1NYXRoLmNlaWwobWF4RlMvcmF0aW8pXHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB2YXIgbWF4RlM9MTIwXHJcbiAgICAgICAgdmFyIG1pbkZTPTEyXHJcbiAgICAgICAgdmFyIHJhdGlvPSAobWF4RlMvbWluRlMtMSkvOSooMS9jdXJab29tLTEpKzFcclxuICAgICAgICB2YXIgZnM9TWF0aC5jZWlsKG1pbkZTKnJhdGlvKVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZzO1xyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuZ2V0Tm9kZVNpemVJbkN1cnJlbnRab29tPWZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgY3VyWm9vbT10aGlzLmNvcmUuem9vbSgpXHJcbiAgICBpZihjdXJab29tPjEpey8vc2NhbGUgdXAgYnV0IG5vdCB0b28gbXVjaFxyXG4gICAgICAgIHZhciByYXRpbz0gKGN1clpvb20tMSkqKDItMSkvOSsxXHJcbiAgICAgICAgcmV0dXJuIE1hdGguY2VpbCh0aGlzLmRlZmF1bHROb2RlU2l6ZS9yYXRpbylcclxuICAgIH1lbHNle1xyXG4gICAgICAgIHZhciByYXRpbz0gKDEvY3VyWm9vbS0xKSooNC0xKS85KzFcclxuICAgICAgICByZXR1cm4gTWF0aC5jZWlsKHRoaXMuZGVmYXVsdE5vZGVTaXplKnJhdGlvKVxyXG4gICAgfVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUudXBkYXRlU3R5bGVTaGVldD1mdW5jdGlvbihzdHlsZUFycil7XHJcbiAgICAvL3Jlc2VydmUgdGhlIHR3byBzdHlsZXMgb2YgZWRnZWVkaXRpbmcgcGx1Z2luIGZpcnN0LCByaWdodCBub3cgdGhlcmUgaXMgbm8gYmV0dGVyIHdheSB0byByZXNlcnZlIHRoZW1cclxuICAgIHZhciBhbGxTdHlsZT10aGlzLmNvcmUuc3R5bGUoKVxyXG4gICAgdmFyIGVkZ2VCZW5kU3R5bGU9bnVsbFxyXG4gICAgdmFyIGVkZ2VDb250cm9sU3R5bGU9bnVsbFxyXG4gICAgZm9yKHZhciBpbmQgaW4gYWxsU3R5bGUpe1xyXG4gICAgICAgIGlmKHR5cGVvZihhbGxTdHlsZVtpbmRdKSE9XCJvYmplY3RcIikgY29udGludWVcclxuICAgICAgICBpZighYWxsU3R5bGVbaW5kXS5zZWxlY3RvcikgY29udGludWVcclxuICAgICAgICB2YXIgc3RyPWFsbFN0eWxlW2luZF0uc2VsZWN0b3IuaW5wdXRUZXh0XHJcbiAgICAgICAgaWYoc3RyPT1cIi5lZGdlYmVuZGVkaXRpbmctaGFzYmVuZHBvaW50c1wiKXtcclxuICAgICAgICAgICAgZWRnZUJlbmRTdHlsZT1hbGxTdHlsZVtpbmRdXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKHN0cj09XCIuZWRnZWNvbnRyb2xlZGl0aW5nLWhhc2NvbnRyb2xwb2ludHNcIil7XHJcbiAgICAgICAgICAgIGVkZ2VDb250cm9sU3R5bGU9YWxsU3R5bGVbaW5kXVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvL2RvIHN0eWxlIG1lcmdpbmdcclxuICAgIHZhciBtZXJnZVNlbGVjdG9yPXt9XHJcbiAgICBzdHlsZUFyci5mb3JFYWNoKGVsZT0+e1xyXG4gICAgICAgIG1lcmdlU2VsZWN0b3JbZWxlLnNlbGVjdG9yXT1lbGUuc3R5bGVcclxuICAgIH0pXHJcblxyXG4gICAgdmFyIHN0eWxlSnNvbiA9IHRoaXMuY29yZS5zdHlsZSgpLmpzb24oKTtcclxuICAgIHZhciBhcnI9W11cclxuICAgIGZvcih2YXIgaW5kIGluIHN0eWxlSnNvbil7XHJcbiAgICAgICAgaWYobWVyZ2VTZWxlY3RvcltzdHlsZUpzb25baW5kXS5zZWxlY3Rvcl0pIHtcclxuICAgICAgICAgICAgdmFyIG9sZHM9IHN0eWxlSnNvbltpbmRdLnN0eWxlXHJcbiAgICAgICAgICAgIHZhciBuZXdzPW1lcmdlU2VsZWN0b3Jbc3R5bGVKc29uW2luZF0uc2VsZWN0b3JdIFxyXG4gICAgICAgICAgICBmb3IodmFyIGluZCBpbiBvbGRzKXtcclxuICAgICAgICAgICAgICAgIGlmKG5ld3NbaW5kXSE9bnVsbCkgY29udGludWVcclxuICAgICAgICAgICAgICAgIG5ld3NbaW5kXT1vbGRzW2luZF1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb250aW51ZVxyXG4gICAgICAgIH1lbHNlIGlmKHN0eWxlSnNvbltpbmRdLnNlbGVjdG9yPT1cIi5lZGdlYmVuZGVkaXRpbmctaGFzYmVuZHBvaW50c1wiIHx8c3R5bGVKc29uW2luZF0uc2VsZWN0b3I9PVwiLmVkZ2Vjb250cm9sZWRpdGluZy1oYXNjb250cm9scG9pbnRzXCIgKSBjb250aW51ZVxyXG4gICAgICAgIFxyXG4gICAgICAgIGFyci5wdXNoKHN0eWxlSnNvbltpbmRdKVxyXG4gICAgfVxyXG4gICAgYXJyPWFyci5jb25jYXQoc3R5bGVBcnIpXHJcbiAgICB0aGlzLmNvcmUuc3R5bGUoKS5mcm9tSnNvbihhcnIpLnVwZGF0ZSgpXHJcbiAgICBpZihlZGdlQmVuZFN0eWxlKXtcclxuICAgICAgICBhbGxTdHlsZT10aGlzLmNvcmUuc3R5bGUoKVxyXG4gICAgICAgIHZhciBjdXJMZW49YWxsU3R5bGUubGVuZ3RoO1xyXG4gICAgICAgIGFsbFN0eWxlLmxlbmd0aD1jdXJMZW4rMlxyXG4gICAgICAgIGFsbFN0eWxlW2N1ckxlbl09ZWRnZUJlbmRTdHlsZVxyXG4gICAgICAgIGFsbFN0eWxlW2N1ckxlbisxXT1lZGdlQ29udHJvbFN0eWxlXHJcbiAgICB9XHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS51cGRhdGVNb2RlbEF2YXJ0YT1mdW5jdGlvbihtb2RlbElELGRhdGFVcmwpe1xyXG4gICAgdHJ5e1xyXG4gICAgICAgIHRoaXMudXBkYXRlU3R5bGVTaGVldChbXHJcbiAgICAgICAgICAgIHtzZWxlY3Rvcjonbm9kZVttb2RlbElEID0gXCInK21vZGVsSUQrJ1wiXScsc3R5bGU6eydiYWNrZ3JvdW5kLWltYWdlJzogZGF0YVVybH19XHJcbiAgICAgICAgXSlcclxuICAgIH1jYXRjaChlKXtcclxuICAgICAgICBcclxuICAgIH0gIFxyXG4gICAgXHJcbn1cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnVwZGF0ZU1vZGVsVHdpbkNvbG9yPWZ1bmN0aW9uKG1vZGVsSUQsY29sb3JDb2RlLHNlY29uZENvbG9yQ29kZSl7XHJcbiAgICB2YXIgc3R5bGVKc29uID0gdGhpcy5jb3JlLnN0eWxlKCkuanNvbigpO1xyXG4gICAgdmFyIGFycj1bXVxyXG4gICAgZm9yKHZhciBpbmQgaW4gc3R5bGVKc29uKXtcclxuICAgICAgICBhcnIucHVzaChzdHlsZUpzb25baW5kXS5zZWxlY3RvcilcclxuICAgIH1cclxuXHJcbiAgICB2YXIgc3R5bGVTZWxlY3Rvcj0nbm9kZVttb2RlbElEID0gXCInICsgbW9kZWxJRCArICdcIl0nXHJcbiAgICB2YXIgc3R5bGVPYmo9bnVsbFxyXG4gICAgaWYgKHNlY29uZENvbG9yQ29kZSA9PSBudWxsKSB7XHJcbiAgICAgICAgaWYoY29sb3JDb2RlPT1cIm5vbmVcIil7XHJcbiAgICAgICAgICAgIHN0eWxlT2JqPXsgJ2JhY2tncm91bmQtZmlsbCc6ICdzb2xpZCcsJ2JhY2tncm91bmQtY29sb3InOiAnZGFya0dyYXknLCdiYWNrZ3JvdW5kLW9wYWNpdHknOjAgfVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBzdHlsZU9iaj17ICdiYWNrZ3JvdW5kLWZpbGwnOiAnc29saWQnLCdiYWNrZ3JvdW5kLWNvbG9yJzogY29sb3JDb2RlICwnYmFja2dyb3VuZC1vcGFjaXR5JzoxfVxyXG4gICAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgY29sb3JDb2RlPWNvbG9yQ29kZXx8XCJkYXJrR3JheVwiXHJcbiAgICAgICAgaWYoY29sb3JDb2RlPT1cIm5vbmVcIikgY29sb3JDb2RlPVwiZGFya0dyYXlcIlxyXG4gICAgICAgIHN0eWxlT2JqPXtcclxuICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kLWZpbGwnOiAnbGluZWFyLWdyYWRpZW50JyxcclxuICAgICAgICAgICAgICAgICdiYWNrZ3JvdW5kLWdyYWRpZW50LXN0b3AtY29sb3JzJzogW2NvbG9yQ29kZSwgY29sb3JDb2RlLCBzZWNvbmRDb2xvckNvZGVdLFxyXG4gICAgICAgICAgICAgICAgJ2JhY2tncm91bmQtZ3JhZGllbnQtc3RvcC1wb3NpdGlvbnMnOiBbJzAlJywgJzUwJScsICc1MSUnXVxyXG4gICAgICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBpZihzdHlsZU9iaikgdGhpcy51cGRhdGVTdHlsZVNoZWV0KFt7c2VsZWN0b3I6c3R5bGVTZWxlY3RvcixzdHlsZTpzdHlsZU9ian1dKSBcclxufVxyXG50b3BvbG9neURPTS5wcm90b3R5cGUudXBkYXRlTW9kZWxUd2luU2hhcGU9ZnVuY3Rpb24obW9kZWxJRCxzaGFwZSl7XHJcbiAgICB2YXIgbmV3U3R5bGVcclxuICAgIGlmKHNoYXBlPT1cImhleGFnb25cIil7XHJcbiAgICAgICAgbmV3U3R5bGU9e3NlbGVjdG9yOidub2RlW21vZGVsSUQgPSBcIicrbW9kZWxJRCsnXCJdJyxzdHlsZTp7J3NoYXBlJzogJ3BvbHlnb24nLCdzaGFwZS1wb2x5Z29uLXBvaW50cyc6WzAsLTEsMC44NjYsLTAuNSwwLjg2NiwwLjUsMCwxLC0wLjg2NiwwLjUsLTAuODY2LC0wLjVdfX1cclxuICAgIH1lbHNle1xyXG4gICAgICAgIG5ld1N0eWxlPXtzZWxlY3Rvcjonbm9kZVttb2RlbElEID0gXCInK21vZGVsSUQrJ1wiXScsc3R5bGU6eydzaGFwZSc6IHNoYXBlfX1cclxuICAgIH1cclxuICAgIHRoaXMudXBkYXRlU3R5bGVTaGVldChbbmV3U3R5bGVdKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUudXBkYXRlTW9kZWxUd2luRGltZW5zaW9uPWZ1bmN0aW9uKG1vZGVsSUQsZGltZW5zaW9uUmF0aW8pe1xyXG4gICAgdGhpcy5ub2RlU2l6ZU1vZGVsQWRqdXN0bWVudFJhdGlvW21vZGVsSURdPXBhcnNlRmxvYXQoZGltZW5zaW9uUmF0aW8pXHJcbiAgICB0aGlzLmNvcmUudHJpZ2dlcihcInpvb21cIilcclxufVxyXG5cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS51cGRhdGVSZWxhdGlvbnNoaXBDb2xvcj1mdW5jdGlvbihzcmNNb2RlbElELHJlbGF0aW9uc2hpcE5hbWUsY29sb3JDb2RlKXtcclxuICAgIHRoaXMudXBkYXRlU3R5bGVTaGVldChbXHJcbiAgICAgICAge3NlbGVjdG9yOidlZGdlW3NvdXJjZU1vZGVsID0gXCInK3NyY01vZGVsSUQrJ1wiXVtyZWxhdGlvbnNoaXBOYW1lID0gXCInK3JlbGF0aW9uc2hpcE5hbWUrJ1wiXScsIHN0eWxlOnsnbGluZS1jb2xvcic6IGNvbG9yQ29kZX19XHJcbiAgICBdKVxyXG59XHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS51cGRhdGVSZWxhdGlvbnNoaXBTaGFwZT1mdW5jdGlvbihzcmNNb2RlbElELHJlbGF0aW9uc2hpcE5hbWUsc2hhcGUpe1xyXG4gICAgdmFyIG5ld1N0eWxlXHJcbiAgICBpZihzaGFwZT09XCJzb2xpZFwiKXtcclxuICAgICAgICBuZXdTdHlsZT17c2VsZWN0b3I6J2VkZ2Vbc291cmNlTW9kZWwgPSBcIicrc3JjTW9kZWxJRCsnXCJdW3JlbGF0aW9uc2hpcE5hbWUgPSBcIicrcmVsYXRpb25zaGlwTmFtZSsnXCJdJywgc3R5bGU6eydsaW5lLXN0eWxlJzogc2hhcGV9fVxyXG4gICAgfWVsc2UgaWYoc2hhcGU9PVwiZG90dGVkXCIpe1xyXG4gICAgICAgIG5ld1N0eWxlPXtzZWxlY3RvcjonZWRnZVtzb3VyY2VNb2RlbCA9IFwiJytzcmNNb2RlbElEKydcIl1bcmVsYXRpb25zaGlwTmFtZSA9IFwiJytyZWxhdGlvbnNoaXBOYW1lKydcIl0nLCBzdHlsZTp7J2xpbmUtc3R5bGUnOiAnZGFzaGVkJywnbGluZS1kYXNoLXBhdHRlcm4nOls4LDhdfX1cclxuICAgIH1cclxuICAgIHRoaXMudXBkYXRlU3R5bGVTaGVldChbbmV3U3R5bGVdKSAgICBcclxufVxyXG50b3BvbG9neURPTS5wcm90b3R5cGUudXBkYXRlUmVsYXRpb25zaGlwV2lkdGg9ZnVuY3Rpb24oc3JjTW9kZWxJRCxyZWxhdGlvbnNoaXBOYW1lLGVkZ2VXaWR0aCl7XHJcbiAgICB2YXIgYXJyPVtcclxuICAgICAgICB7c2VsZWN0b3I6J2VkZ2Vbc291cmNlTW9kZWwgPSBcIicrc3JjTW9kZWxJRCsnXCJdW3JlbGF0aW9uc2hpcE5hbWUgPSBcIicrcmVsYXRpb25zaGlwTmFtZSsnXCJdJyxzdHlsZTp7J3dpZHRoJzpwYXJzZUZsb2F0KGVkZ2VXaWR0aCl9fSxcclxuICAgICAgICB7c2VsZWN0b3I6J2VkZ2U6c2VsZWN0ZWRbc291cmNlTW9kZWwgPSBcIicrc3JjTW9kZWxJRCsnXCJdW3JlbGF0aW9uc2hpcE5hbWUgPSBcIicrcmVsYXRpb25zaGlwTmFtZSsnXCJdJyxzdHlsZTp7J3dpZHRoJzpwYXJzZUZsb2F0KGVkZ2VXaWR0aCkrMSwnbGluZS1jb2xvcic6ICdyZWQnfX0sXHJcbiAgICAgICAge3NlbGVjdG9yOidlZGdlLmhvdmVyW3NvdXJjZU1vZGVsID0gXCInK3NyY01vZGVsSUQrJ1wiXVtyZWxhdGlvbnNoaXBOYW1lID0gXCInK3JlbGF0aW9uc2hpcE5hbWUrJ1wiXScsc3R5bGU6eyd3aWR0aCc6cGFyc2VGbG9hdChlZGdlV2lkdGgpKzN9fVxyXG4gICAgXVxyXG4gICAgdGhpcy51cGRhdGVTdHlsZVNoZWV0KGFycilcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmRlbGV0ZVJlbGF0aW9ucz1mdW5jdGlvbihyZWxhdGlvbnMpe1xyXG4gICAgcmVsYXRpb25zLmZvckVhY2gob25lUmVsYXRpb249PntcclxuICAgICAgICB2YXIgc3JjSUQ9b25lUmVsYXRpb25bXCJzcmNJRFwiXVxyXG4gICAgICAgIHZhciByZWxhdGlvbklEPW9uZVJlbGF0aW9uW1wicmVsSURcIl1cclxuICAgICAgICB2YXIgdGhlTm9kZT10aGlzLmNvcmUuZmlsdGVyKCdbaWQgPSBcIicrc3JjSUQrJ1wiXScpO1xyXG4gICAgICAgIHZhciBlZGdlcz10aGVOb2RlLmNvbm5lY3RlZEVkZ2VzKCkudG9BcnJheSgpXHJcbiAgICAgICAgZm9yKHZhciBpPTA7aTxlZGdlcy5sZW5ndGg7aSsrKXtcclxuICAgICAgICAgICAgdmFyIGFuRWRnZT1lZGdlc1tpXVxyXG4gICAgICAgICAgICBpZihhbkVkZ2UuZGF0YShcIm9yaWdpbmFsSW5mb1wiKVtcIiRyZWxhdGlvbnNoaXBJZFwiXT09cmVsYXRpb25JRCl7XHJcbiAgICAgICAgICAgICAgICBhbkVkZ2UucmVtb3ZlKClcclxuICAgICAgICAgICAgICAgIGJyZWFrXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KSAgIFxyXG59XHJcblxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmRlbGV0ZVR3aW5zPWZ1bmN0aW9uKHR3aW5JREFycil7XHJcbiAgICB0d2luSURBcnIuZm9yRWFjaCh0d2luSUQ9PntcclxuICAgICAgICB0aGlzLmNvcmUuJCgnW2lkID0gXCInK3R3aW5JRCsnXCJdJykucmVtb3ZlKClcclxuICAgIH0pICAgXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5hbmltYXRlQU5vZGU9ZnVuY3Rpb24odHdpbil7XHJcbiAgICB2YXIgY3VyRGltZW5zaW9uPSB0d2luLndpZHRoKClcclxuICAgIHR3aW4uYW5pbWF0ZSh7XHJcbiAgICAgICAgc3R5bGU6IHsgJ2hlaWdodCc6IGN1ckRpbWVuc2lvbioyLCd3aWR0aCc6IGN1ckRpbWVuc2lvbioyIH0sXHJcbiAgICAgICAgZHVyYXRpb246IDIwMFxyXG4gICAgfSk7XHJcblxyXG4gICAgc2V0VGltZW91dCgoKT0+e1xyXG4gICAgICAgIHR3aW4uYW5pbWF0ZSh7XHJcbiAgICAgICAgICAgIHN0eWxlOiB7ICdoZWlnaHQnOiBjdXJEaW1lbnNpb24sJ3dpZHRoJzogY3VyRGltZW5zaW9uIH0sXHJcbiAgICAgICAgICAgIGR1cmF0aW9uOiAyMDBcclxuICAgICAgICAgICAgLGNvbXBsZXRlOigpPT57XHJcbiAgICAgICAgICAgICAgICB0d2luLnJlbW92ZVN0eWxlKCkgLy9tdXN0IHJlbW92ZSB0aGUgc3R5bGUgYWZ0ZXIgYW5pbWF0aW9uLCBvdGhlcndpc2UgdGhleSB3aWxsIGhhdmUgdGhlaXIgb3duIHN0eWxlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH0sMjAwKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuZHJhd1R3aW5zPWZ1bmN0aW9uKHR3aW5zRGF0YSxhbmltYXRpb24pe1xyXG4gICAgdmFyIGFycj1bXVxyXG4gICAgZm9yKHZhciBpPTA7aTx0d2luc0RhdGEubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgdmFyIG9yaWdpbmFsSW5mbz10d2luc0RhdGFbaV07XHJcbiAgICAgICAgdmFyIG5ld05vZGU9e2RhdGE6e30sZ3JvdXA6XCJub2Rlc1wifVxyXG4gICAgICAgIG5ld05vZGUuZGF0YVtcIm9yaWdpbmFsSW5mb1wiXT0gb3JpZ2luYWxJbmZvO1xyXG4gICAgICAgIG5ld05vZGUuZGF0YVtcImlkXCJdPW9yaWdpbmFsSW5mb1snJGR0SWQnXVxyXG4gICAgICAgIHZhciBtb2RlbElEPW9yaWdpbmFsSW5mb1snJG1ldGFkYXRhJ11bJyRtb2RlbCddXHJcbiAgICAgICAgbmV3Tm9kZS5kYXRhW1wibW9kZWxJRFwiXT1tb2RlbElEXHJcbiAgICAgICAgYXJyLnB1c2gobmV3Tm9kZSlcclxuICAgIH1cclxuICAgIHZhciBlbGVzID0gdGhpcy5jb3JlLmFkZChhcnIpXHJcbiAgICBpZihlbGVzLnNpemUoKT09MCkgcmV0dXJuIGVsZXNcclxuICAgIHRoaXMubm9Qb3NpdGlvbl9ncmlkKGVsZXMpXHJcbiAgICBpZihhbmltYXRpb24pe1xyXG4gICAgICAgIGVsZXMuZm9yRWFjaCgoZWxlKT0+eyB0aGlzLmFuaW1hdGVBTm9kZShlbGUpIH0pXHJcbiAgICB9XHJcblxyXG4gICAgLy9pZiB0aGVyZSBpcyBjdXJyZW50bHkgYSBsYXlvdXQgdGhlcmUsIGFwcGx5IGl0XHJcbiAgICB2YXIgbGF5b3V0TmFtZT1nbG9iYWxDYWNoZS5jdXJyZW50TGF5b3V0TmFtZVxyXG4gICAgaWYobGF5b3V0TmFtZSE9bnVsbCl7XHJcbiAgICAgICAgdmFyIGxheW91dERldGFpbD0gZ2xvYmFsQ2FjaGUubGF5b3V0SlNPTltsYXlvdXROYW1lXVxyXG4gICAgICAgIGlmKGxheW91dERldGFpbCkgdGhpcy5hcHBseU5ld0xheW91dFdpdGhVbmRvKGxheW91dERldGFpbCx0aGlzLmdldEN1cnJlbnRMYXlvdXREZXRhaWwoKSlcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZWxlc1xyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuZHJhd1JlbGF0aW9ucz1mdW5jdGlvbihyZWxhdGlvbnNEYXRhKXtcclxuICAgIHZhciByZWxhdGlvbkluZm9BcnI9W11cclxuICAgIGZvcih2YXIgaT0wO2k8cmVsYXRpb25zRGF0YS5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIgb3JpZ2luYWxJbmZvPXJlbGF0aW9uc0RhdGFbaV07XHJcbiAgICAgICAgXHJcbiAgICAgICAgdmFyIHRoZUlEPW9yaWdpbmFsSW5mb1snJHJlbGF0aW9uc2hpcE5hbWUnXStcIl9cIitvcmlnaW5hbEluZm9bJyRyZWxhdGlvbnNoaXBJZCddXHJcbiAgICAgICAgdmFyIGFSZWxhdGlvbj17ZGF0YTp7fSxncm91cDpcImVkZ2VzXCJ9XHJcbiAgICAgICAgYVJlbGF0aW9uLmRhdGFbXCJvcmlnaW5hbEluZm9cIl09b3JpZ2luYWxJbmZvXHJcbiAgICAgICAgYVJlbGF0aW9uLmRhdGFbXCJpZFwiXT10aGVJRFxyXG4gICAgICAgIGFSZWxhdGlvbi5kYXRhW1wic291cmNlXCJdPW9yaWdpbmFsSW5mb1snJHNvdXJjZUlkJ11cclxuICAgICAgICBhUmVsYXRpb24uZGF0YVtcInRhcmdldFwiXT1vcmlnaW5hbEluZm9bJyR0YXJnZXRJZCddXHJcblxyXG4gICAgICAgIGlmKHRoaXMuY29yZS4kKGBbaWQ9XCIke2FSZWxhdGlvbi5kYXRhW1wic291cmNlXCJdfVwiXWApLmxlbmd0aD09MCBcclxuICAgICAgICAgICAgfHwgdGhpcy5jb3JlLiQoYFtpZD1cIiR7YVJlbGF0aW9uLmRhdGFbXCJ0YXJnZXRcIl19XCJdYCkubGVuZ3RoPT0wKSBjb250aW51ZVxyXG4gICAgICAgIHZhciBzb3VyY2VOb2RlPXRoaXMuY29yZS4kKGBbaWQ9XCIke2FSZWxhdGlvbi5kYXRhW1wic291cmNlXCJdfVwiXWApXHJcbiAgICAgICAgdmFyIHNvdXJjZU1vZGVsPXNvdXJjZU5vZGVbMF0uZGF0YShcIm9yaWdpbmFsSW5mb1wiKVsnJG1ldGFkYXRhJ11bJyRtb2RlbCddXHJcbiAgICAgICAgXHJcbiAgICAgICAgLy9hZGQgYWRkaXRpb25hbCBzb3VyY2Ugbm9kZSBpbmZvcm1hdGlvbiB0byB0aGUgb3JpZ2luYWwgcmVsYXRpb25zaGlwIGluZm9ybWF0aW9uXHJcbiAgICAgICAgb3JpZ2luYWxJbmZvWydzb3VyY2VNb2RlbCddPXNvdXJjZU1vZGVsXHJcbiAgICAgICAgYVJlbGF0aW9uLmRhdGFbXCJzb3VyY2VNb2RlbFwiXT1zb3VyY2VNb2RlbFxyXG4gICAgICAgIGFSZWxhdGlvbi5kYXRhW1wicmVsYXRpb25zaGlwTmFtZVwiXT1vcmlnaW5hbEluZm9bJyRyZWxhdGlvbnNoaXBOYW1lJ11cclxuXHJcbiAgICAgICAgdmFyIGV4aXN0RWRnZT10aGlzLmNvcmUuJCgnZWRnZVtpZCA9IFwiJyt0aGVJRCsnXCJdJylcclxuICAgICAgICBpZihleGlzdEVkZ2Uuc2l6ZSgpPjApIHtcclxuICAgICAgICAgICAgZXhpc3RFZGdlLmRhdGEoXCJvcmlnaW5hbEluZm9cIixvcmlnaW5hbEluZm8pXHJcbiAgICAgICAgICAgIGNvbnRpbnVlOyAgLy9ubyBuZWVkIHRvIGRyYXcgaXRcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJlbGF0aW9uSW5mb0Fyci5wdXNoKGFSZWxhdGlvbilcclxuICAgIH1cclxuICAgIGlmKHJlbGF0aW9uSW5mb0Fyci5sZW5ndGg9PTApIHJldHVybiBudWxsO1xyXG5cclxuICAgIHZhciBlZGdlcz10aGlzLmNvcmUuYWRkKHJlbGF0aW9uSW5mb0FycilcclxuICAgIHJldHVybiBlZGdlc1xyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUucmV2aWV3U3RvcmVkUmVsYXRpb25zaGlwc1RvRHJhdz1mdW5jdGlvbigpe1xyXG4gICAgLy9jaGVjayB0aGUgc3RvcmVkT3V0Ym91bmRSZWxhdGlvbnNoaXBzIGFnYWluIGFuZCBtYXliZSBzb21lIG9mIHRoZW0gY2FuIGJlIGRyYXduIG5vdyBzaW5jZSB0YXJnZXROb2RlIGlzIGF2YWlsYWJsZVxyXG4gICAgdmFyIHN0b3JlZFJlbGF0aW9uQXJyPVtdXHJcbiAgICBmb3IodmFyIHR3aW5JRCBpbiBnbG9iYWxDYWNoZS5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHMpe1xyXG4gICAgICAgIHN0b3JlZFJlbGF0aW9uQXJyPXN0b3JlZFJlbGF0aW9uQXJyLmNvbmNhdChnbG9iYWxDYWNoZS5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbdHdpbklEXSlcclxuICAgIH1cclxuICAgIHRoaXMuZHJhd1JlbGF0aW9ucyhzdG9yZWRSZWxhdGlvbkFycilcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmRyYXdUd2luc0FuZFJlbGF0aW9ucz1mdW5jdGlvbihkYXRhKXtcclxuICAgIHZhciB0d2luc0FuZFJlbGF0aW9ucz1kYXRhLmNoaWxkVHdpbnNBbmRSZWxhdGlvbnNcclxuXHJcbiAgICAvL2RyYXcgdGhvc2UgbmV3IHR3aW5zIGZpcnN0XHJcbiAgICB0d2luc0FuZFJlbGF0aW9ucy5mb3JFYWNoKG9uZVNldD0+e1xyXG4gICAgICAgIHZhciB0d2luSW5mb0Fycj1bXVxyXG4gICAgICAgIGZvcih2YXIgaW5kIGluIG9uZVNldC5jaGlsZFR3aW5zKSB0d2luSW5mb0Fyci5wdXNoKG9uZVNldC5jaGlsZFR3aW5zW2luZF0pXHJcbiAgICAgICAgdGhpcy5kcmF3VHdpbnModHdpbkluZm9BcnIsXCJhbmltYXRpb25cIilcclxuICAgIH0pXHJcblxyXG4gICAgLy9kcmF3IHRob3NlIGtub3duIHR3aW5zIGZyb20gdGhlIHJlbGF0aW9uc2hpcHNcclxuICAgIHZhciB0d2luc0luZm89e31cclxuICAgIHR3aW5zQW5kUmVsYXRpb25zLmZvckVhY2gob25lU2V0PT57XHJcbiAgICAgICAgdmFyIHJlbGF0aW9uc0luZm89b25lU2V0W1wicmVsYXRpb25zaGlwc1wiXVxyXG4gICAgICAgIHJlbGF0aW9uc0luZm8uZm9yRWFjaCgob25lUmVsYXRpb24pPT57XHJcbiAgICAgICAgICAgIHZhciBzcmNJRD1vbmVSZWxhdGlvblsnJHNvdXJjZUlkJ11cclxuICAgICAgICAgICAgdmFyIHRhcmdldElEPW9uZVJlbGF0aW9uWyckdGFyZ2V0SWQnXVxyXG4gICAgICAgICAgICBpZihnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1tzcmNJRF0pXHJcbiAgICAgICAgICAgICAgICB0d2luc0luZm9bc3JjSURdID0gZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbc3JjSURdXHJcbiAgICAgICAgICAgIGlmKGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3RhcmdldElEXSlcclxuICAgICAgICAgICAgICAgIHR3aW5zSW5mb1t0YXJnZXRJRF0gPSBnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1t0YXJnZXRJRF0gICAgXHJcbiAgICAgICAgfSlcclxuICAgIH0pXHJcbiAgICB2YXIgdG1wQXJyPVtdXHJcbiAgICBmb3IodmFyIHR3aW5JRCBpbiB0d2luc0luZm8pIHRtcEFyci5wdXNoKHR3aW5zSW5mb1t0d2luSURdKVxyXG4gICAgdGhpcy5kcmF3VHdpbnModG1wQXJyKVxyXG5cclxuICAgIC8vdGhlbiBjaGVjayBhbGwgc3RvcmVkIHJlbGF0aW9uc2hpcHMgYW5kIGRyYXcgaWYgaXQgY2FuIGJlIGRyYXduXHJcbiAgICB0aGlzLnJldmlld1N0b3JlZFJlbGF0aW9uc2hpcHNUb0RyYXcoKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuYXBwbHlWaXN1YWxEZWZpbml0aW9uPWZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgdmlzdWFsSnNvbj1nbG9iYWxDYWNoZS52aXN1YWxEZWZpbml0aW9uW2dsb2JhbENhY2hlLnNlbGVjdGVkQURUXVxyXG4gICAgaWYodmlzdWFsSnNvbj09bnVsbCkgcmV0dXJuO1xyXG4gICAgZm9yKHZhciBtb2RlbElEIGluIHZpc3VhbEpzb24pe1xyXG4gICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF0uY29sb3IpIHRoaXMudXBkYXRlTW9kZWxUd2luQ29sb3IobW9kZWxJRCx2aXN1YWxKc29uW21vZGVsSURdLmNvbG9yKVxyXG4gICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF0uc2hhcGUpIHRoaXMudXBkYXRlTW9kZWxUd2luU2hhcGUobW9kZWxJRCx2aXN1YWxKc29uW21vZGVsSURdLnNoYXBlKVxyXG4gICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF0uYXZhcnRhKSB0aGlzLnVwZGF0ZU1vZGVsQXZhcnRhKG1vZGVsSUQsdmlzdWFsSnNvblttb2RlbElEXS5hdmFydGEpXHJcbiAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXS5kaW1lbnNpb25SYXRpbykgdGhpcy51cGRhdGVNb2RlbFR3aW5EaW1lbnNpb24obW9kZWxJRCx2aXN1YWxKc29uW21vZGVsSURdLmRpbWVuc2lvblJhdGlvKVxyXG4gICAgICAgIGlmKHZpc3VhbEpzb25bbW9kZWxJRF0ucmVscyl7XHJcbiAgICAgICAgICAgIGZvcih2YXIgcmVsYXRpb25zaGlwTmFtZSBpbiB2aXN1YWxKc29uW21vZGVsSURdLnJlbHMpe1xyXG4gICAgICAgICAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpb25zaGlwTmFtZV0uY29sb3Ipe1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlUmVsYXRpb25zaGlwQ29sb3IobW9kZWxJRCxyZWxhdGlvbnNoaXBOYW1lLHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW9uc2hpcE5hbWVdLmNvbG9yKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpb25zaGlwTmFtZV0uc2hhcGUpe1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlUmVsYXRpb25zaGlwU2hhcGUobW9kZWxJRCxyZWxhdGlvbnNoaXBOYW1lLHZpc3VhbEpzb25bbW9kZWxJRF1bXCJyZWxzXCJdW3JlbGF0aW9uc2hpcE5hbWVdLnNoYXBlKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgaWYodmlzdWFsSnNvblttb2RlbElEXVtcInJlbHNcIl1bcmVsYXRpb25zaGlwTmFtZV0uZWRnZVdpZHRoKXtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVJlbGF0aW9uc2hpcFdpZHRoKG1vZGVsSUQscmVsYXRpb25zaGlwTmFtZSx2aXN1YWxKc29uW21vZGVsSURdW1wicmVsc1wiXVtyZWxhdGlvbnNoaXBOYW1lXS5lZGdlV2lkdGgpXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5yeE1lc3NhZ2U9ZnVuY3Rpb24obXNnUGF5bG9hZCl7XHJcbiAgICBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiQURURGF0YXNvdXJjZUNoYW5nZV9yZXBsYWNlXCIpe1xyXG4gICAgICAgIHRoaXMuY29yZS5ub2RlcygpLnJlbW92ZSgpXHJcbiAgICAgICAgdGhpcy5hcHBseVZpc3VhbERlZmluaXRpb24oKVxyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInJlcGxhY2VBbGxUd2luc1wiKSB7XHJcbiAgICAgICAgdGhpcy5jb3JlLm5vZGVzKCkucmVtb3ZlKClcclxuICAgICAgICB2YXIgZWxlcz0gdGhpcy5kcmF3VHdpbnMobXNnUGF5bG9hZC5pbmZvKVxyXG4gICAgICAgIHRoaXMuY29yZS5jZW50ZXIoZWxlcylcclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJhcHBlbmRBbGxUd2luc1wiKSB7XHJcbiAgICAgICAgdmFyIGVsZXM9IHRoaXMuZHJhd1R3aW5zKG1zZ1BheWxvYWQuaW5mbyxcImFuaW1hdGVcIilcclxuICAgICAgICB0aGlzLmNvcmUuY2VudGVyKGVsZXMpXHJcbiAgICAgICAgdGhpcy5yZXZpZXdTdG9yZWRSZWxhdGlvbnNoaXBzVG9EcmF3KClcclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJkcmF3QWxsUmVsYXRpb25zXCIpe1xyXG4gICAgICAgIHZhciBlZGdlcz0gdGhpcy5kcmF3UmVsYXRpb25zKG1zZ1BheWxvYWQuaW5mbylcclxuICAgICAgICBpZihlZGdlcyE9bnVsbCkge1xyXG4gICAgICAgICAgICBpZihnbG9iYWxDYWNoZS5jdXJyZW50TGF5b3V0TmFtZT09bnVsbCkgIHRoaXMubm9Qb3NpdGlvbl9jb3NlKClcclxuICAgICAgICB9XHJcbiAgICB9ZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiYWRkTmV3VHdpblwiKSB7XHJcbiAgICAgICAgdGhpcy5jb3JlLm5vZGVzKCkudW5zZWxlY3QoKVxyXG4gICAgICAgIHRoaXMuY29yZS5lZGdlcygpLnVuc2VsZWN0KClcclxuICAgICAgICB0aGlzLmRyYXdUd2lucyhbbXNnUGF5bG9hZC50d2luSW5mb10sXCJhbmltYXRpb25cIilcclxuICAgICAgICB2YXIgbm9kZUluZm89IG1zZ1BheWxvYWQudHdpbkluZm87XHJcbiAgICAgICAgdmFyIG5vZGVOYW1lPSBub2RlSW5mb1tcIiRkdElkXCJdXHJcbiAgICAgICAgdmFyIHRvcG9Ob2RlPSB0aGlzLmNvcmUubm9kZXMoYFtpZD1cIiR7bm9kZU5hbWV9XCJdYClcclxuICAgICAgICBpZih0b3BvTm9kZSl7XHJcbiAgICAgICAgICAgIHZhciBwb3NpdGlvbj10b3BvTm9kZS5yZW5kZXJlZFBvc2l0aW9uKClcclxuICAgICAgICAgICAgdGhpcy5jb3JlLnBhbkJ5KHt4Oi1wb3NpdGlvbi54KzIwMCx5Oi1wb3NpdGlvbi55KzIwMH0pXHJcbiAgICAgICAgICAgIHRvcG9Ob2RlLnNlbGVjdCgpXHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0RnVuY3Rpb24oKVxyXG4gICAgICAgIH1cclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJhZGROZXdUd2luc1wiKSB7XHJcbiAgICAgICAgdGhpcy5kcmF3VHdpbnMobXNnUGF5bG9hZC50d2luc0luZm8sXCJhbmltYXRpb25cIilcclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJkcmF3VHdpbnNBbmRSZWxhdGlvbnNcIikgdGhpcy5kcmF3VHdpbnNBbmRSZWxhdGlvbnMobXNnUGF5bG9hZC5pbmZvKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwic2hvd0luZm9TZWxlY3RlZE5vZGVzXCIpeyAvL2Zyb20gc2VsZWN0aW5nIHR3aW5zIGluIHRoZSB0d2ludHJlZVxyXG4gICAgICAgIHRoaXMuY29yZS5ub2RlcygpLnVuc2VsZWN0KClcclxuICAgICAgICB0aGlzLmNvcmUuZWRnZXMoKS51bnNlbGVjdCgpXHJcbiAgICAgICAgdmFyIGFycj1tc2dQYXlsb2FkLmluZm87XHJcbiAgICAgICAgdmFyIG1vdXNlQ2xpY2tEZXRhaWw9bXNnUGF5bG9hZC5tb3VzZUNsaWNrRGV0YWlsO1xyXG4gICAgICAgIGFyci5mb3JFYWNoKGVsZW1lbnQgPT4ge1xyXG4gICAgICAgICAgICB2YXIgYVR3aW49dGhpcy5jb3JlLm5vZGVzKGBbaWQ9XCIke2VsZW1lbnRbJyRkdElkJ119XCJdYClcclxuICAgICAgICAgICAgYVR3aW4uc2VsZWN0KClcclxuICAgICAgICAgICAgaWYobW91c2VDbGlja0RldGFpbCE9MikgdGhpcy5hbmltYXRlQU5vZGUoYVR3aW4pIC8vaWdub3JlIGRvdWJsZSBjbGljayBzZWNvbmQgY2xpY2tcclxuICAgICAgICB9KTtcclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJQYW5Ub05vZGVcIil7XHJcbiAgICAgICAgdmFyIG5vZGVJbmZvPSBtc2dQYXlsb2FkLmluZm87XHJcbiAgICAgICAgdmFyIHRvcG9Ob2RlPXRoaXMuY29yZS5ub2RlcyhgW2lkPVwiJHtub2RlSW5mb1tcIiRkdElkXCJdfVwiXWApXHJcbiAgICAgICAgaWYodG9wb05vZGUpe1xyXG4gICAgICAgICAgICB0aGlzLmNvcmUuY2VudGVyKHRvcG9Ob2RlKVxyXG4gICAgICAgIH1cclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJ2aXN1YWxEZWZpbml0aW9uQ2hhbmdlXCIpe1xyXG4gICAgICAgIGlmKG1zZ1BheWxvYWQuc3JjTW9kZWxJRCl7XHJcbiAgICAgICAgICAgIGlmKG1zZ1BheWxvYWQuY29sb3IpIHRoaXMudXBkYXRlUmVsYXRpb25zaGlwQ29sb3IobXNnUGF5bG9hZC5zcmNNb2RlbElELG1zZ1BheWxvYWQucmVsYXRpb25zaGlwTmFtZSxtc2dQYXlsb2FkLmNvbG9yKVxyXG4gICAgICAgICAgICBlbHNlIGlmKG1zZ1BheWxvYWQuc2hhcGUpIHRoaXMudXBkYXRlUmVsYXRpb25zaGlwU2hhcGUobXNnUGF5bG9hZC5zcmNNb2RlbElELG1zZ1BheWxvYWQucmVsYXRpb25zaGlwTmFtZSxtc2dQYXlsb2FkLnNoYXBlKVxyXG4gICAgICAgICAgICBlbHNlIGlmKG1zZ1BheWxvYWQuZWRnZVdpZHRoKSB0aGlzLnVwZGF0ZVJlbGF0aW9uc2hpcFdpZHRoKG1zZ1BheWxvYWQuc3JjTW9kZWxJRCxtc2dQYXlsb2FkLnJlbGF0aW9uc2hpcE5hbWUsbXNnUGF5bG9hZC5lZGdlV2lkdGgpXHJcbiAgICAgICAgfSBcclxuICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICBpZihtc2dQYXlsb2FkLmNvbG9yKSB0aGlzLnVwZGF0ZU1vZGVsVHdpbkNvbG9yKG1zZ1BheWxvYWQubW9kZWxJRCxtc2dQYXlsb2FkLmNvbG9yKVxyXG4gICAgICAgICAgICBlbHNlIGlmKG1zZ1BheWxvYWQuc2hhcGUpIHRoaXMudXBkYXRlTW9kZWxUd2luU2hhcGUobXNnUGF5bG9hZC5tb2RlbElELG1zZ1BheWxvYWQuc2hhcGUpXHJcbiAgICAgICAgICAgIGVsc2UgaWYobXNnUGF5bG9hZC5hdmFydGEpIHRoaXMudXBkYXRlTW9kZWxBdmFydGEobXNnUGF5bG9hZC5tb2RlbElELG1zZ1BheWxvYWQuYXZhcnRhKVxyXG4gICAgICAgICAgICBlbHNlIGlmKG1zZ1BheWxvYWQubm9BdmFydGEpICB0aGlzLnVwZGF0ZU1vZGVsQXZhcnRhKG1zZ1BheWxvYWQubW9kZWxJRCxudWxsKVxyXG4gICAgICAgICAgICBlbHNlIGlmKG1zZ1BheWxvYWQuZGltZW5zaW9uUmF0aW8pICB0aGlzLnVwZGF0ZU1vZGVsVHdpbkRpbWVuc2lvbihtc2dQYXlsb2FkLm1vZGVsSUQsbXNnUGF5bG9hZC5kaW1lbnNpb25SYXRpbylcclxuICAgICAgICB9IFxyXG4gICAgfWVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cInR3aW5zRGVsZXRlZFwiKSB0aGlzLmRlbGV0ZVR3aW5zKG1zZ1BheWxvYWQudHdpbklEQXJyKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwicmVsYXRpb25zRGVsZXRlZFwiKSB0aGlzLmRlbGV0ZVJlbGF0aW9ucyhtc2dQYXlsb2FkLnJlbGF0aW9ucylcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImNvbm5lY3RUb1wiKXsgdGhpcy5zdGFydFRhcmdldE5vZGVNb2RlKFwiY29ubmVjdFRvXCIpICAgfVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiY29ubmVjdEZyb21cIil7IHRoaXMuc3RhcnRUYXJnZXROb2RlTW9kZShcImNvbm5lY3RGcm9tXCIpICAgfVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiYWRkU2VsZWN0T3V0Ym91bmRcIil7IHRoaXMuc2VsZWN0T3V0Ym91bmROb2RlcygpICAgfVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiYWRkU2VsZWN0SW5ib3VuZFwiKXsgdGhpcy5zZWxlY3RJbmJvdW5kTm9kZXMoKSAgIH1cclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImhpZGVTZWxlY3RlZE5vZGVzXCIpeyB0aGlzLmhpZGVTZWxlY3RlZE5vZGVzKCkgICB9XHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJDT1NFU2VsZWN0ZWROb2Rlc1wiKXsgdGhpcy5DT1NFU2VsZWN0ZWROb2RlcygpICAgfVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwic2F2ZUxheW91dFwiKXsgdGhpcy5zYXZlTGF5b3V0KG1zZ1BheWxvYWQubGF5b3V0TmFtZSxtc2dQYXlsb2FkLmFkdE5hbWUpICAgfVxyXG4gICAgZWxzZSBpZiAobXNnUGF5bG9hZC5tZXNzYWdlID09IFwibGF5b3V0Q2hhbmdlXCIpIHtcclxuICAgICAgICB2YXIgbGF5b3V0TmFtZSA9IGdsb2JhbENhY2hlLmN1cnJlbnRMYXlvdXROYW1lXHJcbiAgICAgICAgaWYobGF5b3V0TmFtZT09XCJbTkFdXCIpe1xyXG4gICAgICAgICAgICB2YXIgY3VycmVudExheW91dD10aGlzLmdldEN1cnJlbnRMYXlvdXREZXRhaWwoKVxyXG4gICAgICAgICAgICAvL3NlbGVjdCBhbGwgdmlzaWJsZSBub2RlcyBhbmQgZG8gYSBDT1NFIGxheW91dCwgY2xlYW4gYWxsIGJlbmQgZWRnZSBsaW5lIGFzIHdlbGxcclxuICAgICAgICAgICAgdGhpcy5jb3JlLmVkZ2VzKCkuZm9yRWFjaChvbmVFZGdlPT57XHJcbiAgICAgICAgICAgICAgICBvbmVFZGdlLnJlbW92ZUNsYXNzKCdlZGdlYmVuZGVkaXRpbmctaGFzYmVuZHBvaW50cycpXHJcbiAgICAgICAgICAgICAgICBvbmVFZGdlLnJlbW92ZUNsYXNzKCdlZGdlY29udHJvbGVkaXRpbmctaGFzY29udHJvbHBvaW50cycpXHJcbiAgICAgICAgICAgICAgICBvbmVFZGdlLmRhdGEoXCJjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHNcIixbXSlcclxuICAgICAgICAgICAgICAgIG9uZUVkZ2UuZGF0YShcImN5ZWRnZWJlbmRlZGl0aW5nRGlzdGFuY2VzXCIsW10pXHJcbiAgICAgICAgICAgICAgICBvbmVFZGdlLmRhdGEoXCJjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHNcIixbXSlcclxuICAgICAgICAgICAgICAgIG9uZUVkZ2UuZGF0YShcImN5ZWRnZWNvbnRyb2xlZGl0aW5nRGlzdGFuY2VzXCIsW10pXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIHRoaXMubm9Qb3NpdGlvbl9jb3NlKG51bGwsY3VycmVudExheW91dClcclxuICAgICAgICB9ZWxzZSBpZiAobGF5b3V0TmFtZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIHZhciBsYXlvdXREZXRhaWwgPSBnbG9iYWxDYWNoZS5sYXlvdXRKU09OW2xheW91dE5hbWVdXHJcbiAgICAgICAgICAgIGlmIChsYXlvdXREZXRhaWwpIHRoaXMuYXBwbHlOZXdMYXlvdXRXaXRoVW5kbyhsYXlvdXREZXRhaWwsIHRoaXMuZ2V0Q3VycmVudExheW91dERldGFpbCgpKVxyXG4gICAgICAgIH1cclxuICAgIH1lbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJhbGlnblNlbGVjdGVkTm9kZVwiKSB0aGlzLmFsaWduU2VsZWN0ZWROb2Rlcyhtc2dQYXlsb2FkLmRpcmVjdGlvbilcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImRpc3RyaWJ1dGVTZWxlY3RlZE5vZGVcIikgdGhpcy5kaXN0cmlidXRlU2VsZWN0ZWROb2RlKG1zZ1BheWxvYWQuZGlyZWN0aW9uKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwicm90YXRlU2VsZWN0ZWROb2RlXCIpIHRoaXMucm90YXRlU2VsZWN0ZWROb2RlKG1zZ1BheWxvYWQuZGlyZWN0aW9uKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwibWlycm9yU2VsZWN0ZWROb2RlXCIpIHRoaXMubWlycm9yU2VsZWN0ZWROb2RlKG1zZ1BheWxvYWQuZGlyZWN0aW9uKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiZGltZW5zaW9uU2VsZWN0ZWROb2RlXCIpIHRoaXMuZGltZW5zaW9uU2VsZWN0ZWROb2RlKG1zZ1BheWxvYWQuZGlyZWN0aW9uKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuZGltZW5zaW9uU2VsZWN0ZWROb2RlID0gZnVuY3Rpb24gKGRpcmVjdGlvbikge1xyXG4gICAgdmFyIHJhdGlvPTEuMlxyXG4gICAgdmFyIHNlbGVjdGVkTm9kZXM9dGhpcy5jb3JlLm5vZGVzKCc6c2VsZWN0ZWQnKVxyXG4gICAgaWYoc2VsZWN0ZWROb2Rlcy5zaXplKCk8MikgcmV0dXJuO1xyXG4gICAgdmFyIGJvdW5kYXJ5PSBzZWxlY3RlZE5vZGVzLmJvdW5kaW5nQm94KHtpbmNsdWRlTGFiZWxzIDpmYWxzZSxpbmNsdWRlT3ZlcmxheXMgOmZhbHNlIH0pXHJcbiAgICB2YXIgY2VudGVyWD1ib3VuZGFyeVtcIngxXCJdK2JvdW5kYXJ5W1wid1wiXS8yXHJcbiAgICB2YXIgY2VudGVyWT1ib3VuZGFyeVtcInkxXCJdK2JvdW5kYXJ5W1wiaFwiXS8yXHJcbiAgICBcclxuICAgIHZhciBvbGRMYXlvdXQ9e31cclxuICAgIHZhciBuZXdMYXlvdXQ9e31cclxuICAgIHNlbGVjdGVkTm9kZXMuZm9yRWFjaChvbmVOb2RlPT57XHJcbiAgICAgICAgdmFyIGN1clBvcz1vbmVOb2RlLnBvc2l0aW9uKClcclxuICAgICAgICB2YXIgbm9kZUlEPW9uZU5vZGUuaWQoKVxyXG4gICAgICAgIG9sZExheW91dFtub2RlSURdPVtjdXJQb3NbJ3gnXSxjdXJQb3NbJ3knXV1cclxuICAgICAgICB2YXIgeG9mZmNlbnRlcj1jdXJQb3NbXCJ4XCJdLWNlbnRlclhcclxuICAgICAgICB2YXIgeW9mZmNlbnRlcj1jdXJQb3NbXCJ5XCJdLWNlbnRlcllcclxuICAgICAgICBpZihkaXJlY3Rpb249PVwiZXhwYW5kXCIpIG5ld0xheW91dFtub2RlSURdPVtjZW50ZXJYK3hvZmZjZW50ZXIqcmF0aW8sY2VudGVyWSt5b2ZmY2VudGVyKnJhdGlvXVxyXG4gICAgICAgIGVsc2UgaWYoZGlyZWN0aW9uPT1cImNvbXByZXNzXCIpIG5ld0xheW91dFtub2RlSURdPVtjZW50ZXJYK3hvZmZjZW50ZXIvcmF0aW8sY2VudGVyWSt5b2ZmY2VudGVyL3JhdGlvXVxyXG4gICAgfSlcclxuICAgIHRoaXMuYXBwbHlOZXdMYXlvdXRXaXRoVW5kbyhuZXdMYXlvdXQsb2xkTGF5b3V0LFwib25seUFkanVzdE5vZGVQb3NpdGlvblwiKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUubWlycm9yU2VsZWN0ZWROb2RlID0gZnVuY3Rpb24gKGRpcmVjdGlvbikge1xyXG4gICAgdmFyIHNlbGVjdGVkTm9kZXM9dGhpcy5jb3JlLm5vZGVzKCc6c2VsZWN0ZWQnKVxyXG4gICAgaWYoc2VsZWN0ZWROb2Rlcy5zaXplKCk8MikgcmV0dXJuO1xyXG4gICAgdmFyIGJvdW5kYXJ5PSBzZWxlY3RlZE5vZGVzLmJvdW5kaW5nQm94KHtpbmNsdWRlTGFiZWxzIDpmYWxzZSxpbmNsdWRlT3ZlcmxheXMgOmZhbHNlIH0pXHJcbiAgICB2YXIgY2VudGVyWD1ib3VuZGFyeVtcIngxXCJdK2JvdW5kYXJ5W1wid1wiXS8yXHJcbiAgICB2YXIgY2VudGVyWT1ib3VuZGFyeVtcInkxXCJdK2JvdW5kYXJ5W1wiaFwiXS8yXHJcbiAgICBcclxuICAgIHZhciBvbGRMYXlvdXQ9e31cclxuICAgIHZhciBuZXdMYXlvdXQ9e31cclxuICAgIHNlbGVjdGVkTm9kZXMuZm9yRWFjaChvbmVOb2RlPT57XHJcbiAgICAgICAgdmFyIGN1clBvcz1vbmVOb2RlLnBvc2l0aW9uKClcclxuICAgICAgICB2YXIgbm9kZUlEPW9uZU5vZGUuaWQoKVxyXG4gICAgICAgIG9sZExheW91dFtub2RlSURdPVtjdXJQb3NbJ3gnXSxjdXJQb3NbJ3knXV1cclxuICAgICAgICB2YXIgeG9mZmNlbnRlcj1jdXJQb3NbXCJ4XCJdLWNlbnRlclhcclxuICAgICAgICB2YXIgeW9mZmNlbnRlcj1jdXJQb3NbXCJ5XCJdLWNlbnRlcllcclxuICAgICAgICBpZihkaXJlY3Rpb249PVwiaG9yaXpvbnRhbFwiKSBuZXdMYXlvdXRbbm9kZUlEXT1bY2VudGVyWC14b2ZmY2VudGVyLGN1clBvc1sneSddXVxyXG4gICAgICAgIGVsc2UgaWYoZGlyZWN0aW9uPT1cInZlcnRpY2FsXCIpIG5ld0xheW91dFtub2RlSURdPVtjdXJQb3NbJ3gnXSxjZW50ZXJZLXlvZmZjZW50ZXJdXHJcbiAgICB9KVxyXG4gICAgdGhpcy5hcHBseU5ld0xheW91dFdpdGhVbmRvKG5ld0xheW91dCxvbGRMYXlvdXQsXCJvbmx5QWRqdXN0Tm9kZVBvc2l0aW9uXCIpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5yb3RhdGVTZWxlY3RlZE5vZGUgPSBmdW5jdGlvbiAoZGlyZWN0aW9uKSB7XHJcbiAgICB2YXIgc2VsZWN0ZWROb2Rlcz10aGlzLmNvcmUubm9kZXMoJzpzZWxlY3RlZCcpXHJcbiAgICBpZihzZWxlY3RlZE5vZGVzLnNpemUoKTwyKSByZXR1cm47XHJcbiAgICB2YXIgYm91bmRhcnk9IHNlbGVjdGVkTm9kZXMuYm91bmRpbmdCb3goe2luY2x1ZGVMYWJlbHMgOmZhbHNlLGluY2x1ZGVPdmVybGF5cyA6ZmFsc2UgfSlcclxuICAgIHZhciBjZW50ZXJYPWJvdW5kYXJ5W1wieDFcIl0rYm91bmRhcnlbXCJ3XCJdLzJcclxuICAgIHZhciBjZW50ZXJZPWJvdW5kYXJ5W1wieTFcIl0rYm91bmRhcnlbXCJoXCJdLzJcclxuICAgIFxyXG4gICAgdmFyIG9sZExheW91dD17fVxyXG4gICAgdmFyIG5ld0xheW91dD17fVxyXG4gICAgc2VsZWN0ZWROb2Rlcy5mb3JFYWNoKG9uZU5vZGU9PntcclxuICAgICAgICB2YXIgY3VyUG9zPW9uZU5vZGUucG9zaXRpb24oKVxyXG4gICAgICAgIHZhciBub2RlSUQ9b25lTm9kZS5pZCgpXHJcbiAgICAgICAgb2xkTGF5b3V0W25vZGVJRF09W2N1clBvc1sneCddLGN1clBvc1sneSddXVxyXG4gICAgICAgIHZhciB4b2ZmY2VudGVyPWN1clBvc1tcInhcIl0tY2VudGVyWFxyXG4gICAgICAgIHZhciB5b2ZmY2VudGVyPWN1clBvc1tcInlcIl0tY2VudGVyWVxyXG4gICAgICAgIGlmKGRpcmVjdGlvbj09XCJsZWZ0XCIpIG5ld0xheW91dFtub2RlSURdPVtjZW50ZXJYK3lvZmZjZW50ZXIsY2VudGVyWS14b2ZmY2VudGVyXVxyXG4gICAgICAgIGVsc2UgaWYoZGlyZWN0aW9uPT1cInJpZ2h0XCIpIG5ld0xheW91dFtub2RlSURdPVtjZW50ZXJYLXlvZmZjZW50ZXIsY2VudGVyWSt4b2ZmY2VudGVyXVxyXG4gICAgfSlcclxuICAgIHRoaXMuYXBwbHlOZXdMYXlvdXRXaXRoVW5kbyhuZXdMYXlvdXQsb2xkTGF5b3V0LFwib25seUFkanVzdE5vZGVQb3NpdGlvblwiKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuZGlzdHJpYnV0ZVNlbGVjdGVkTm9kZSA9IGZ1bmN0aW9uIChkaXJlY3Rpb24pIHtcclxuICAgIHZhciBzZWxlY3RlZE5vZGVzPXRoaXMuY29yZS5ub2RlcygnOnNlbGVjdGVkJylcclxuICAgIGlmKHNlbGVjdGVkTm9kZXMuc2l6ZSgpPDMpIHJldHVybjtcclxuICAgIHZhciBudW1BcnI9W11cclxuICAgIHZhciBvbGRMYXlvdXQ9e31cclxuICAgIHZhciBsYXlvdXRGb3JTb3J0PVtdXHJcbiAgICBzZWxlY3RlZE5vZGVzLmZvckVhY2gob25lTm9kZT0+e1xyXG4gICAgICAgIHZhciBwb3NpdGlvbj1vbmVOb2RlLnBvc2l0aW9uKClcclxuICAgICAgICBpZihkaXJlY3Rpb249PVwidmVydGljYWxcIikgbnVtQXJyLnB1c2gocG9zaXRpb25bJ3knXSlcclxuICAgICAgICBlbHNlIGlmKGRpcmVjdGlvbj09XCJob3Jpem9udGFsXCIpIG51bUFyci5wdXNoKHBvc2l0aW9uWyd4J10pXHJcbiAgICAgICAgdmFyIGN1clBvcz1vbmVOb2RlLnBvc2l0aW9uKClcclxuICAgICAgICB2YXIgbm9kZUlEPW9uZU5vZGUuaWQoKVxyXG4gICAgICAgIG9sZExheW91dFtub2RlSURdPVtjdXJQb3NbJ3gnXSxjdXJQb3NbJ3knXV1cclxuICAgICAgICBsYXlvdXRGb3JTb3J0LnB1c2goe2lkOm5vZGVJRCx4OmN1clBvc1sneCddLHk6Y3VyUG9zWyd5J119KVxyXG4gICAgfSlcclxuXHJcbiAgICBpZihkaXJlY3Rpb249PVwidmVydGljYWxcIikgbGF5b3V0Rm9yU29ydC5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7cmV0dXJuIGFbXCJ5XCJdLWJbXCJ5XCJdIH0pXHJcbiAgICBlbHNlIGlmKGRpcmVjdGlvbj09XCJob3Jpem9udGFsXCIpIGxheW91dEZvclNvcnQuc29ydChmdW5jdGlvbiAoYSwgYikge3JldHVybiBhW1wieFwiXS1iW1wieFwiXSB9KVxyXG4gICAgXHJcbiAgICB2YXIgbWluVj1NYXRoLm1pbiguLi5udW1BcnIpXHJcbiAgICB2YXIgbWF4Vj1NYXRoLm1heCguLi5udW1BcnIpXHJcbiAgICBpZihtaW5WPT1tYXhWKSByZXR1cm47XHJcbiAgICB2YXIgZ2FwPShtYXhWLW1pblYpLyhzZWxlY3RlZE5vZGVzLnNpemUoKS0xKVxyXG4gICAgdmFyIG5ld0xheW91dD17fVxyXG4gICAgaWYoZGlyZWN0aW9uPT1cInZlcnRpY2FsXCIpIHZhciBjdXJWPWxheW91dEZvclNvcnRbMF1bXCJ5XCJdXHJcbiAgICBlbHNlIGlmKGRpcmVjdGlvbj09XCJob3Jpem9udGFsXCIpIGN1clY9bGF5b3V0Rm9yU29ydFswXVtcInhcIl1cclxuICAgIGZvcih2YXIgaT0wO2k8bGF5b3V0Rm9yU29ydC5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIgb25lTm9kZUluZm89bGF5b3V0Rm9yU29ydFtpXVxyXG4gICAgICAgIGlmKGk9PTB8fCBpPT1sYXlvdXRGb3JTb3J0Lmxlbmd0aC0xKXtcclxuICAgICAgICAgICAgbmV3TGF5b3V0W29uZU5vZGVJbmZvLmlkXT1bb25lTm9kZUluZm9bJ3gnXSxvbmVOb2RlSW5mb1sneSddXVxyXG4gICAgICAgICAgICBjb250aW51ZVxyXG4gICAgICAgIH1cclxuICAgICAgICBjdXJWKz1nYXA7XHJcbiAgICAgICAgaWYoZGlyZWN0aW9uPT1cInZlcnRpY2FsXCIpIG5ld0xheW91dFtvbmVOb2RlSW5mby5pZF09W29uZU5vZGVJbmZvWyd4J10sY3VyVl1cclxuICAgICAgICBlbHNlIGlmKGRpcmVjdGlvbj09XCJob3Jpem9udGFsXCIpIG5ld0xheW91dFtvbmVOb2RlSW5mby5pZF09W2N1clYsb25lTm9kZUluZm9bJ3knXV1cclxuICAgIH1cclxuICAgIHRoaXMuYXBwbHlOZXdMYXlvdXRXaXRoVW5kbyhuZXdMYXlvdXQsb2xkTGF5b3V0LFwib25seUFkanVzdE5vZGVQb3NpdGlvblwiKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuYWxpZ25TZWxlY3RlZE5vZGVzID0gZnVuY3Rpb24gKGRpcmVjdGlvbikge1xyXG4gICAgdmFyIHNlbGVjdGVkTm9kZXM9dGhpcy5jb3JlLm5vZGVzKCc6c2VsZWN0ZWQnKVxyXG4gICAgaWYoc2VsZWN0ZWROb2Rlcy5zaXplKCk8MikgcmV0dXJuO1xyXG4gICAgdmFyIG51bUFycj1bXVxyXG4gICAgc2VsZWN0ZWROb2Rlcy5mb3JFYWNoKG9uZU5vZGU9PntcclxuICAgICAgICB2YXIgcG9zaXRpb249b25lTm9kZS5wb3NpdGlvbigpXHJcbiAgICAgICAgaWYoZGlyZWN0aW9uPT1cInRvcFwifHwgZGlyZWN0aW9uPT1cImJvdHRvbVwiKSBudW1BcnIucHVzaChwb3NpdGlvblsneSddKVxyXG4gICAgICAgIGVsc2UgaWYoZGlyZWN0aW9uPT1cImxlZnRcInx8IGRpcmVjdGlvbj09XCJyaWdodFwiKSBudW1BcnIucHVzaChwb3NpdGlvblsneCddKVxyXG4gICAgfSlcclxuICAgIHZhciB0YXJnZXRYPW51bGxcclxuICAgIHZhciB0YXJnZXRZPW51bGxcclxuICAgIGlmKGRpcmVjdGlvbj09XCJ0b3BcIikgdmFyIHRhcmdldFk9IE1hdGgubWluKC4uLm51bUFycilcclxuICAgIGVsc2UgaWYoZGlyZWN0aW9uPT1cImJvdHRvbVwiKSB2YXIgdGFyZ2V0WT0gTWF0aC5tYXgoLi4ubnVtQXJyKVxyXG4gICAgaWYoZGlyZWN0aW9uPT1cImxlZnRcIikgdmFyIHRhcmdldFg9IE1hdGgubWluKC4uLm51bUFycilcclxuICAgIGVsc2UgaWYoZGlyZWN0aW9uPT1cInJpZ2h0XCIpIHZhciB0YXJnZXRYPSBNYXRoLm1heCguLi5udW1BcnIpXHJcbiAgICBcclxuICAgIHZhciBvbGRMYXlvdXQ9e31cclxuICAgIHZhciBuZXdMYXlvdXQ9e31cclxuICAgIHNlbGVjdGVkTm9kZXMuZm9yRWFjaChvbmVOb2RlPT57XHJcbiAgICAgICAgdmFyIGN1clBvcz1vbmVOb2RlLnBvc2l0aW9uKClcclxuICAgICAgICB2YXIgbm9kZUlEPW9uZU5vZGUuaWQoKVxyXG4gICAgICAgIG9sZExheW91dFtub2RlSURdPVtjdXJQb3NbJ3gnXSxjdXJQb3NbJ3knXV1cclxuICAgICAgICBuZXdMYXlvdXRbbm9kZUlEXT1bY3VyUG9zWyd4J10sY3VyUG9zWyd5J11dXHJcbiAgICAgICAgaWYodGFyZ2V0WCE9bnVsbCkgbmV3TGF5b3V0W25vZGVJRF1bMF09dGFyZ2V0WFxyXG4gICAgICAgIGlmKHRhcmdldFkhPW51bGwpIG5ld0xheW91dFtub2RlSURdWzFdPXRhcmdldFlcclxuICAgIH0pXHJcbiAgICB0aGlzLmFwcGx5TmV3TGF5b3V0V2l0aFVuZG8obmV3TGF5b3V0LG9sZExheW91dCxcIm9ubHlBZGp1c3ROb2RlUG9zaXRpb25cIilcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnJlZHJhd0Jhc2VkT25MYXlvdXREZXRhaWwgPSBmdW5jdGlvbiAobGF5b3V0RGV0YWlsLG9ubHlBZGp1c3ROb2RlUG9zaXRpb24pIHtcclxuICAgIC8vcmVtb3ZlIGFsbCBiZW5kaW5nIGVkZ2UgXHJcbiAgICBpZighb25seUFkanVzdE5vZGVQb3NpdGlvbil7XHJcbiAgICAgICAgdGhpcy5jb3JlLmVkZ2VzKCkuZm9yRWFjaChvbmVFZGdlPT57XHJcbiAgICAgICAgICAgIG9uZUVkZ2UucmVtb3ZlQ2xhc3MoJ2VkZ2ViZW5kZWRpdGluZy1oYXNiZW5kcG9pbnRzJylcclxuICAgICAgICAgICAgb25lRWRnZS5yZW1vdmVDbGFzcygnZWRnZWNvbnRyb2xlZGl0aW5nLWhhc2NvbnRyb2xwb2ludHMnKVxyXG4gICAgICAgICAgICBvbmVFZGdlLmRhdGEoXCJjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHNcIixbXSlcclxuICAgICAgICAgICAgb25lRWRnZS5kYXRhKFwiY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXNcIixbXSlcclxuICAgICAgICAgICAgb25lRWRnZS5kYXRhKFwiY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzXCIsW10pXHJcbiAgICAgICAgICAgIG9uZUVkZ2UuZGF0YShcImN5ZWRnZWNvbnRyb2xlZGl0aW5nRGlzdGFuY2VzXCIsW10pXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuICAgIFxyXG4gICAgXHJcbiAgICBpZihsYXlvdXREZXRhaWw9PW51bGwpIHJldHVybjtcclxuICAgIFxyXG4gICAgdmFyIHN0b3JlZFBvc2l0aW9ucz17fVxyXG4gICAgZm9yKHZhciBpbmQgaW4gbGF5b3V0RGV0YWlsKXtcclxuICAgICAgICBpZihpbmQgPT0gXCJlZGdlc1wiKSBjb250aW51ZVxyXG4gICAgICAgIHN0b3JlZFBvc2l0aW9uc1tpbmRdPXtcclxuICAgICAgICAgICAgeDpsYXlvdXREZXRhaWxbaW5kXVswXVxyXG4gICAgICAgICAgICAseTpsYXlvdXREZXRhaWxbaW5kXVsxXVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHZhciBuZXdMYXlvdXQ9dGhpcy5jb3JlLmxheW91dCh7XHJcbiAgICAgICAgbmFtZTogJ3ByZXNldCcsXHJcbiAgICAgICAgcG9zaXRpb25zOnN0b3JlZFBvc2l0aW9ucyxcclxuICAgICAgICBmaXQ6ZmFsc2UsXHJcbiAgICAgICAgYW5pbWF0ZTogdHJ1ZSxcclxuICAgICAgICBhbmltYXRpb25EdXJhdGlvbjogMzAwLFxyXG4gICAgfSlcclxuICAgIG5ld0xheW91dC5ydW4oKVxyXG5cclxuICAgIC8vcmVzdG9yZSBlZGdlcyBiZW5kaW5nIG9yIGNvbnRyb2wgcG9pbnRzXHJcbiAgICB2YXIgZWRnZVBvaW50c0RpY3Q9bGF5b3V0RGV0YWlsW1wiZWRnZXNcIl1cclxuICAgIGlmKGVkZ2VQb2ludHNEaWN0PT1udWxsKXJldHVybjtcclxuICAgIGZvcih2YXIgc3JjSUQgaW4gZWRnZVBvaW50c0RpY3Qpe1xyXG4gICAgICAgIGZvcih2YXIgcmVsYXRpb25zaGlwSUQgaW4gZWRnZVBvaW50c0RpY3Rbc3JjSURdKXtcclxuICAgICAgICAgICAgdmFyIG9iaj1lZGdlUG9pbnRzRGljdFtzcmNJRF1bcmVsYXRpb25zaGlwSURdXHJcbiAgICAgICAgICAgIHRoaXMuYXBwbHlFZGdlQmVuZGNvbnRyb2xQb2ludHMoc3JjSUQscmVsYXRpb25zaGlwSUQsb2JqW1wiY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzXCJdXHJcbiAgICAgICAgICAgICxvYmpbXCJjeWVkZ2ViZW5kZWRpdGluZ0Rpc3RhbmNlc1wiXSxvYmpbXCJjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHNcIl0sb2JqW1wiY3llZGdlY29udHJvbGVkaXRpbmdEaXN0YW5jZXNcIl0pXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuYXBwbHlOZXdMYXlvdXRXaXRoVW5kbyA9IGZ1bmN0aW9uIChuZXdMYXlvdXREZXRhaWwsb2xkTGF5b3V0RGV0YWlsLG9ubHlBZGp1c3ROb2RlUG9zaXRpb24pIHtcclxuICAgIC8vc3RvcmUgY3VycmVudCBsYXlvdXQgZm9yIHVuZG8gb3BlcmF0aW9uXHJcbiAgICB0aGlzLnVyLmFjdGlvbiggXCJjaGFuZ2VMYXlvdXRcIlxyXG4gICAgICAgICwgKGFyZyk9PntcclxuICAgICAgICAgICAgdGhpcy5yZWRyYXdCYXNlZE9uTGF5b3V0RGV0YWlsKGFyZy5uZXdMYXlvdXREZXRhaWwsYXJnLm9ubHlBZGp1c3ROb2RlUG9zaXRpb24pICAgICAgICBcclxuICAgICAgICAgICAgcmV0dXJuIGFyZ1xyXG4gICAgICAgIH1cclxuICAgICAgICAsIChhcmcpPT57XHJcbiAgICAgICAgICAgIHRoaXMucmVkcmF3QmFzZWRPbkxheW91dERldGFpbChhcmcub2xkTGF5b3V0RGV0YWlsLGFyZy5vbmx5QWRqdXN0Tm9kZVBvc2l0aW9uKVxyXG4gICAgICAgICAgICByZXR1cm4gYXJnXHJcbiAgICAgICAgfVxyXG4gICAgKVxyXG4gICAgdGhpcy51ci5kbyhcImNoYW5nZUxheW91dFwiXHJcbiAgICAgICAgLCB7IGZpcnN0VGltZTogdHJ1ZSwgXCJuZXdMYXlvdXREZXRhaWxcIjogbmV3TGF5b3V0RGV0YWlsLCBcIm9sZExheW91dERldGFpbFwiOiBvbGRMYXlvdXREZXRhaWwsXCJvbmx5QWRqdXN0Tm9kZVBvc2l0aW9uXCI6b25seUFkanVzdE5vZGVQb3NpdGlvbn1cclxuICAgIClcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLmFwcGx5RWRnZUJlbmRjb250cm9sUG9pbnRzID0gZnVuY3Rpb24gKHNyY0lELHJlbGF0aW9uc2hpcElEXHJcbiAgICAsY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzLGN5ZWRnZWJlbmRlZGl0aW5nRGlzdGFuY2VzLGN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cyxjeWVkZ2Vjb250cm9sZWRpdGluZ0Rpc3RhbmNlcykge1xyXG4gICAgICAgIHZhciB0aGVOb2RlPXRoaXMuY29yZS5maWx0ZXIoJ1tpZCA9IFwiJytzcmNJRCsnXCJdJyk7XHJcbiAgICAgICAgaWYodGhlTm9kZS5sZW5ndGg9PTApIHJldHVybjtcclxuICAgICAgICB2YXIgZWRnZXM9dGhlTm9kZS5jb25uZWN0ZWRFZGdlcygpLnRvQXJyYXkoKVxyXG4gICAgICAgIGZvcih2YXIgaT0wO2k8ZWRnZXMubGVuZ3RoO2krKyl7XHJcbiAgICAgICAgICAgIHZhciBhbkVkZ2U9ZWRnZXNbaV1cclxuICAgICAgICAgICAgaWYoYW5FZGdlLmRhdGEoXCJvcmlnaW5hbEluZm9cIilbXCIkcmVsYXRpb25zaGlwSWRcIl09PXJlbGF0aW9uc2hpcElEKXtcclxuICAgICAgICAgICAgICAgIGlmKGN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0cyl7XHJcbiAgICAgICAgICAgICAgICAgICAgYW5FZGdlLmRhdGEoXCJjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHNcIixjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHMpXHJcbiAgICAgICAgICAgICAgICAgICAgYW5FZGdlLmRhdGEoXCJjeWVkZ2ViZW5kZWRpdGluZ0Rpc3RhbmNlc1wiLGN5ZWRnZWJlbmRlZGl0aW5nRGlzdGFuY2VzKVxyXG4gICAgICAgICAgICAgICAgICAgIGFuRWRnZS5hZGRDbGFzcygnZWRnZWJlbmRlZGl0aW5nLWhhc2JlbmRwb2ludHMnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmKGN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0cyl7XHJcbiAgICAgICAgICAgICAgICAgICAgYW5FZGdlLmRhdGEoXCJjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHNcIixjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHMpXHJcbiAgICAgICAgICAgICAgICAgICAgYW5FZGdlLmRhdGEoXCJjeWVkZ2Vjb250cm9sZWRpdGluZ0Rpc3RhbmNlc1wiLGN5ZWRnZWNvbnRyb2xlZGl0aW5nRGlzdGFuY2VzKVxyXG4gICAgICAgICAgICAgICAgICAgIGFuRWRnZS5hZGRDbGFzcygnZWRnZWNvbnRyb2xlZGl0aW5nLWhhc2NvbnRyb2xwb2ludHMnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxufVxyXG5cclxuXHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuZ2V0Q3VycmVudExheW91dERldGFpbCA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBsYXlvdXREaWN0PXtcImVkZ2VzXCI6e319XHJcbiAgICBpZih0aGlzLmNvcmUubm9kZXMoKS5zaXplKCk9PTApIHJldHVybiBsYXlvdXREaWN0O1xyXG4gICAgLy9zdG9yZSBub2RlcyBwb3NpdGlvblxyXG4gICAgdGhpcy5jb3JlLm5vZGVzKCkuZm9yRWFjaChvbmVOb2RlPT57XHJcbiAgICAgICAgdmFyIHBvc2l0aW9uPW9uZU5vZGUucG9zaXRpb24oKVxyXG4gICAgICAgIGxheW91dERpY3Rbb25lTm9kZS5pZCgpXT1bdGhpcy5udW1iZXJQcmVjaXNpb24ocG9zaXRpb25bJ3gnXSksdGhpcy5udW1iZXJQcmVjaXNpb24ocG9zaXRpb25bJ3knXSldXHJcbiAgICB9KVxyXG5cclxuICAgIC8vc3RvcmUgYW55IGVkZ2UgYmVuZGluZyBwb2ludHMgb3IgY29udHJvbGluZyBwb2ludHNcclxuICAgIHRoaXMuY29yZS5lZGdlcygpLmZvckVhY2gob25lRWRnZT0+e1xyXG4gICAgICAgIHZhciBzcmNJRD1vbmVFZGdlLmRhdGEoXCJvcmlnaW5hbEluZm9cIilbXCIkc291cmNlSWRcIl1cclxuICAgICAgICB2YXIgcmVsYXRpb25zaGlwSUQ9b25lRWRnZS5kYXRhKFwib3JpZ2luYWxJbmZvXCIpW1wiJHJlbGF0aW9uc2hpcElkXCJdXHJcbiAgICAgICAgdmFyIGN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0cz1vbmVFZGdlLmRhdGEoJ2N5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0cycpXHJcbiAgICAgICAgdmFyIGN5ZWRnZWJlbmRlZGl0aW5nRGlzdGFuY2VzPW9uZUVkZ2UuZGF0YSgnY3llZGdlYmVuZGVkaXRpbmdEaXN0YW5jZXMnKVxyXG4gICAgICAgIHZhciBjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHM9b25lRWRnZS5kYXRhKCdjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHMnKVxyXG4gICAgICAgIHZhciBjeWVkZ2Vjb250cm9sZWRpdGluZ0Rpc3RhbmNlcz1vbmVFZGdlLmRhdGEoJ2N5ZWRnZWNvbnRyb2xlZGl0aW5nRGlzdGFuY2VzJylcclxuICAgICAgICBpZighY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzICYmICFjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHMpIHJldHVybjtcclxuXHJcbiAgICAgICAgaWYobGF5b3V0RGljdC5lZGdlc1tzcmNJRF09PW51bGwpbGF5b3V0RGljdC5lZGdlc1tzcmNJRF09e31cclxuICAgICAgICBsYXlvdXREaWN0LmVkZ2VzW3NyY0lEXVtyZWxhdGlvbnNoaXBJRF09e31cclxuICAgICAgICBpZihjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHMgJiYgY3llZGdlYmVuZGVkaXRpbmdXZWlnaHRzLmxlbmd0aD4wKSB7XHJcbiAgICAgICAgICAgIGxheW91dERpY3QuZWRnZXNbc3JjSURdW3JlbGF0aW9uc2hpcElEXVtcImN5ZWRnZWJlbmRlZGl0aW5nV2VpZ2h0c1wiXT10aGlzLm51bWJlclByZWNpc2lvbihjeWVkZ2ViZW5kZWRpdGluZ1dlaWdodHMpXHJcbiAgICAgICAgICAgIGxheW91dERpY3QuZWRnZXNbc3JjSURdW3JlbGF0aW9uc2hpcElEXVtcImN5ZWRnZWJlbmRlZGl0aW5nRGlzdGFuY2VzXCJdPXRoaXMubnVtYmVyUHJlY2lzaW9uKGN5ZWRnZWJlbmRlZGl0aW5nRGlzdGFuY2VzKVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZihjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHMgJiYgY3llZGdlY29udHJvbGVkaXRpbmdXZWlnaHRzLmxlbmd0aD4wKSB7XHJcbiAgICAgICAgICAgIGxheW91dERpY3QuZWRnZXNbc3JjSURdW3JlbGF0aW9uc2hpcElEXVtcImN5ZWRnZWNvbnRyb2xlZGl0aW5nV2VpZ2h0c1wiXT10aGlzLm51bWJlclByZWNpc2lvbihjeWVkZ2Vjb250cm9sZWRpdGluZ1dlaWdodHMpXHJcbiAgICAgICAgICAgIGxheW91dERpY3QuZWRnZXNbc3JjSURdW3JlbGF0aW9uc2hpcElEXVtcImN5ZWRnZWNvbnRyb2xlZGl0aW5nRGlzdGFuY2VzXCJdPXRoaXMubnVtYmVyUHJlY2lzaW9uKGN5ZWRnZWNvbnRyb2xlZGl0aW5nRGlzdGFuY2VzKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbiAgICByZXR1cm4gbGF5b3V0RGljdDtcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnNhdmVMYXlvdXQgPSBhc3luYyBmdW5jdGlvbiAobGF5b3V0TmFtZSxhZHROYW1lKSB7XHJcbiAgICB2YXIgbGF5b3V0RGljdD1nbG9iYWxDYWNoZS5sYXlvdXRKU09OW2xheW91dE5hbWVdXHJcbiAgICBpZighbGF5b3V0RGljdCl7XHJcbiAgICAgICAgbGF5b3V0RGljdD1nbG9iYWxDYWNoZS5sYXlvdXRKU09OW2xheW91dE5hbWVdPXt9XHJcbiAgICB9XHJcbiAgICBpZihsYXlvdXREaWN0W1wiZWRnZXNcIl09PW51bGwpIGxheW91dERpY3RbXCJlZGdlc1wiXT17fVxyXG4gICAgXHJcbiAgICB2YXIgc2hvd2luZ0xheW91dD10aGlzLmdldEN1cnJlbnRMYXlvdXREZXRhaWwoKVxyXG4gICAgdmFyIHNob3dpbmdFZGdlc0xheW91dD0gc2hvd2luZ0xheW91dFtcImVkZ2VzXCJdXHJcbiAgICBkZWxldGUgc2hvd2luZ0xheW91dFtcImVkZ2VzXCJdXHJcbiAgICBmb3IodmFyIGluZCBpbiBzaG93aW5nTGF5b3V0KSBsYXlvdXREaWN0W2luZF09c2hvd2luZ0xheW91dFtpbmRdXHJcbiAgICBmb3IodmFyIGluZCBpbiBzaG93aW5nRWRnZXNMYXlvdXQpIGxheW91dERpY3RbXCJlZGdlc1wiXVtpbmRdPXNob3dpbmdFZGdlc0xheW91dFtpbmRdXHJcblxyXG4gICAgJC5wb3N0KFwibGF5b3V0L3NhdmVMYXlvdXRzXCIse1wiYWR0TmFtZVwiOmFkdE5hbWUsXCJsYXlvdXRzXCI6SlNPTi5zdHJpbmdpZnkoZ2xvYmFsQ2FjaGUubGF5b3V0SlNPTil9KVxyXG4gICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwibGF5b3V0c1VwZGF0ZWRcIn0pXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5udW1iZXJQcmVjaXNpb24gPSBmdW5jdGlvbiAobnVtYmVyKSB7XHJcbiAgICBpZihBcnJheS5pc0FycmF5KG51bWJlcikpe1xyXG4gICAgICAgIGZvcih2YXIgaT0wO2k8bnVtYmVyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgICAgICBudW1iZXJbaV0gPSB0aGlzLm51bWJlclByZWNpc2lvbihudW1iZXJbaV0pXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudW1iZXJcclxuICAgIH1lbHNlXHJcbiAgICByZXR1cm4gcGFyc2VGbG9hdChudW1iZXIudG9GaXhlZCgzKSlcclxufVxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLkNPU0VTZWxlY3RlZE5vZGVzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5ub1Bvc2l0aW9uX2Nvc2UodGhpcy5jb3JlLiQoJzpzZWxlY3RlZCcpLHRoaXMuZ2V0Q3VycmVudExheW91dERldGFpbCgpKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuaGlkZVNlbGVjdGVkTm9kZXMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgc2VsZWN0ZWROb2Rlcz10aGlzLmNvcmUubm9kZXMoJzpzZWxlY3RlZCcpXHJcbiAgICBzZWxlY3RlZE5vZGVzLnJlbW92ZSgpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5zZWxlY3RJbmJvdW5kTm9kZXMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgc2VsZWN0ZWROb2Rlcz10aGlzLmNvcmUubm9kZXMoJzpzZWxlY3RlZCcpXHJcbiAgICB2YXIgZWxlcz10aGlzLmNvcmUubm9kZXMoKS5lZGdlc1RvKHNlbGVjdGVkTm9kZXMpLnNvdXJjZXMoKVxyXG4gICAgZWxlcy5mb3JFYWNoKChlbGUpPT57IHRoaXMuYW5pbWF0ZUFOb2RlKGVsZSkgfSlcclxuICAgIGVsZXMuc2VsZWN0KClcclxuICAgIHRoaXMuc2VsZWN0RnVuY3Rpb24oKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuc2VsZWN0T3V0Ym91bmROb2RlcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBzZWxlY3RlZE5vZGVzPXRoaXMuY29yZS5ub2RlcygnOnNlbGVjdGVkJylcclxuICAgIHZhciBlbGVzPXNlbGVjdGVkTm9kZXMuZWRnZXNUbyh0aGlzLmNvcmUubm9kZXMoKSkudGFyZ2V0cygpXHJcbiAgICBlbGVzLmZvckVhY2goKGVsZSk9PnsgdGhpcy5hbmltYXRlQU5vZGUoZWxlKSB9KVxyXG4gICAgZWxlcy5zZWxlY3QoKVxyXG4gICAgdGhpcy5zZWxlY3RGdW5jdGlvbigpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5hZGRDb25uZWN0aW9ucyA9IGZ1bmN0aW9uICh0YXJnZXROb2RlKSB7XHJcbiAgICB2YXIgdGhlQ29ubmVjdE1vZGU9dGhpcy50YXJnZXROb2RlTW9kZVxyXG4gICAgdmFyIHNyY05vZGVBcnI9dGhpcy5jb3JlLm5vZGVzKFwiOnNlbGVjdGVkXCIpXHJcblxyXG4gICAgdmFyIHByZXBhcmF0aW9uSW5mbz1bXVxyXG5cclxuICAgIHNyY05vZGVBcnIuZm9yRWFjaCh0aGVOb2RlPT57XHJcbiAgICAgICAgdmFyIGNvbm5lY3Rpb25UeXBlc1xyXG4gICAgICAgIGlmKHRoZUNvbm5lY3RNb2RlPT1cImNvbm5lY3RUb1wiKSB7XHJcbiAgICAgICAgICAgIGNvbm5lY3Rpb25UeXBlcz10aGlzLmNoZWNrQXZhaWxhYmxlQ29ubmVjdGlvblR5cGUodGhlTm9kZS5kYXRhKFwibW9kZWxJRFwiKSx0YXJnZXROb2RlLmRhdGEoXCJtb2RlbElEXCIpKVxyXG4gICAgICAgICAgICBwcmVwYXJhdGlvbkluZm8ucHVzaCh7ZnJvbTp0aGVOb2RlLHRvOnRhcmdldE5vZGUsY29ubmVjdDpjb25uZWN0aW9uVHlwZXN9KVxyXG4gICAgICAgIH1lbHNlIGlmKHRoZUNvbm5lY3RNb2RlPT1cImNvbm5lY3RGcm9tXCIpIHtcclxuICAgICAgICAgICAgY29ubmVjdGlvblR5cGVzPXRoaXMuY2hlY2tBdmFpbGFibGVDb25uZWN0aW9uVHlwZSh0YXJnZXROb2RlLmRhdGEoXCJtb2RlbElEXCIpLHRoZU5vZGUuZGF0YShcIm1vZGVsSURcIikpXHJcbiAgICAgICAgICAgIHByZXBhcmF0aW9uSW5mby5wdXNoKHt0bzp0aGVOb2RlLGZyb206dGFyZ2V0Tm9kZSxjb25uZWN0OmNvbm5lY3Rpb25UeXBlc30pXHJcbiAgICAgICAgfVxyXG4gICAgfSlcclxuICAgIC8vVE9ETzogY2hlY2sgaWYgaXQgaXMgbmVlZGVkIHRvIHBvcHVwIGRpYWxvZywgaWYgYWxsIGNvbm5lY3Rpb24gaXMgZG9hYmxlIGFuZCBvbmx5IG9uZSB0eXBlIHRvIHVzZSwgbm8gbmVlZCB0byBzaG93IGRpYWxvZ1xyXG4gICAgdGhpcy5zaG93Q29ubmVjdGlvbkRpYWxvZyhwcmVwYXJhdGlvbkluZm8pXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5zaG93Q29ubmVjdGlvbkRpYWxvZyA9IGZ1bmN0aW9uIChwcmVwYXJhdGlvbkluZm8pIHtcclxuICAgIHZhciBjb25maXJtRGlhbG9nRGl2ID0gbmV3IHNpbXBsZUNvbmZpcm1EaWFsb2coKVxyXG4gICAgdmFyIHJlc3VsdEFjdGlvbnM9W11cclxuICAgIGNvbmZpcm1EaWFsb2dEaXYuc2hvdyhcclxuICAgICAgICB7IHdpZHRoOiBcIjQ1MHB4XCIgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHRpdGxlOiBcIkFkZCBjb25uZWN0aW9uc1wiXHJcbiAgICAgICAgICAgICwgY29udGVudDogXCJcIlxyXG4gICAgICAgICAgICAsIGJ1dHRvbnM6IFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjb2xvckNsYXNzOiBcInczLXJlZCB3My1ob3Zlci1waW5rXCIsIHRleHQ6IFwiQ29uZmlybVwiLCBcImNsaWNrRnVuY1wiOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpcm1EaWFsb2dEaXYuY2xvc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jcmVhdGVDb25uZWN0aW9ucyhyZXN1bHRBY3Rpb25zKVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3JDbGFzczogXCJ3My1ncmF5XCIsIHRleHQ6IFwiQ2FuY2VsXCIsIFwiY2xpY2tGdW5jXCI6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uZmlybURpYWxvZ0Rpdi5jbG9zZSgpXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfVxyXG4gICAgKVxyXG4gICAgY29uZmlybURpYWxvZ0Rpdi5kaWFsb2dEaXYuZW1wdHkoKVxyXG4gICAgcHJlcGFyYXRpb25JbmZvLmZvckVhY2goKG9uZVJvdyxpbmRleCk9PntcclxuICAgICAgICByZXN1bHRBY3Rpb25zLnB1c2godGhpcy5jcmVhdGVPbmVDb25uZWN0aW9uQWRqdXN0Um93KG9uZVJvdyxjb25maXJtRGlhbG9nRGl2KSlcclxuICAgIH0pXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5jcmVhdGVPbmVDb25uZWN0aW9uQWRqdXN0Um93ID0gZnVuY3Rpb24gKG9uZVJvdyxjb25maXJtRGlhbG9nRGl2KSB7XHJcbiAgICB2YXIgcmV0dXJuT2JqPXt9XHJcbiAgICB2YXIgZnJvbU5vZGU9b25lUm93LmZyb21cclxuICAgIHZhciB0b05vZGU9b25lUm93LnRvXHJcbiAgICB2YXIgY29ubmVjdGlvblR5cGVzPW9uZVJvdy5jb25uZWN0XHJcbiAgICB2YXIgbGFiZWw9JCgnPGxhYmVsIHN0eWxlPVwiZGlzcGxheTpibG9jazttYXJnaW4tYm90dG9tOjJweFwiPjwvbGFiZWw+JylcclxuICAgIGlmKGNvbm5lY3Rpb25UeXBlcy5sZW5ndGg9PTApe1xyXG4gICAgICAgIGxhYmVsLmNzcyhcImNvbG9yXCIsXCJyZWRcIilcclxuICAgICAgICBsYWJlbC5odG1sKFwiTm8gdXNhYmxlIGNvbm5lY3Rpb24gdHlwZSBmcm9tIDxiPlwiK2Zyb21Ob2RlLmlkKCkrXCI8L2I+IHRvIDxiPlwiK3RvTm9kZS5pZCgpK1wiPC9iPlwiKVxyXG4gICAgfWVsc2UgaWYoY29ubmVjdGlvblR5cGVzLmxlbmd0aD4xKXsgXHJcbiAgICAgICAgbGFiZWwuaHRtbChcIkZyb20gPGI+XCIrZnJvbU5vZGUuaWQoKStcIjwvYj4gdG8gPGI+XCIrdG9Ob2RlLmlkKCkrXCI8L2I+XCIpIFxyXG4gICAgICAgIHZhciBzd2l0Y2hUeXBlU2VsZWN0b3I9bmV3IHNpbXBsZVNlbGVjdE1lbnUoXCIgXCIpXHJcbiAgICAgICAgbGFiZWwucHJlcGVuZChzd2l0Y2hUeXBlU2VsZWN0b3IuRE9NKVxyXG4gICAgICAgIGNvbm5lY3Rpb25UeXBlcy5mb3JFYWNoKG9uZVR5cGU9PntcclxuICAgICAgICAgICAgc3dpdGNoVHlwZVNlbGVjdG9yLmFkZE9wdGlvbihvbmVUeXBlKVxyXG4gICAgICAgIH0pXHJcbiAgICAgICAgcmV0dXJuT2JqW1wiZnJvbVwiXT1mcm9tTm9kZS5pZCgpXHJcbiAgICAgICAgcmV0dXJuT2JqW1widG9cIl09dG9Ob2RlLmlkKClcclxuICAgICAgICByZXR1cm5PYmpbXCJjb25uZWN0XCJdPWNvbm5lY3Rpb25UeXBlc1swXVxyXG4gICAgICAgIHN3aXRjaFR5cGVTZWxlY3Rvci5jYWxsQmFja19jbGlja09wdGlvbj0ob3B0aW9uVGV4dCxvcHRpb25WYWx1ZSk9PntcclxuICAgICAgICAgICAgcmV0dXJuT2JqW1wiY29ubmVjdFwiXT1vcHRpb25UZXh0XHJcbiAgICAgICAgICAgIHN3aXRjaFR5cGVTZWxlY3Rvci5jaGFuZ2VOYW1lKG9wdGlvblRleHQpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHN3aXRjaFR5cGVTZWxlY3Rvci50cmlnZ2VyT3B0aW9uSW5kZXgoMClcclxuICAgIH1lbHNlIGlmKGNvbm5lY3Rpb25UeXBlcy5sZW5ndGg9PTEpe1xyXG4gICAgICAgIHJldHVybk9ialtcImZyb21cIl09ZnJvbU5vZGUuaWQoKVxyXG4gICAgICAgIHJldHVybk9ialtcInRvXCJdPXRvTm9kZS5pZCgpXHJcbiAgICAgICAgcmV0dXJuT2JqW1wiY29ubmVjdFwiXT1jb25uZWN0aW9uVHlwZXNbMF1cclxuICAgICAgICBsYWJlbC5jc3MoXCJjb2xvclwiLFwiZ3JlZW5cIilcclxuICAgICAgICBsYWJlbC5odG1sKFwiQWRkIDxiPlwiK2Nvbm5lY3Rpb25UeXBlc1swXStcIjwvYj4gY29ubmVjdGlvbiBmcm9tIDxiPlwiK2Zyb21Ob2RlLmlkKCkrXCI8L2I+IHRvIDxiPlwiK3RvTm9kZS5pZCgpK1wiPC9iPlwiKSBcclxuICAgIH1cclxuICAgIGNvbmZpcm1EaWFsb2dEaXYuZGlhbG9nRGl2LmFwcGVuZChsYWJlbClcclxuICAgIHJldHVybiByZXR1cm5PYmo7XHJcbn1cclxuXHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuY3JlYXRlQ29ubmVjdGlvbnMgPSBmdW5jdGlvbiAocmVzdWx0QWN0aW9ucykge1xyXG4gICAgZnVuY3Rpb24gdXVpZHY0KCkge1xyXG4gICAgICAgIHJldHVybiAneHh4eHh4eHgteHh4eC00eHh4LXl4eHgteHh4eHh4eHh4eHh4Jy5yZXBsYWNlKC9beHldL2csIGZ1bmN0aW9uIChjKSB7XHJcbiAgICAgICAgICAgIHZhciByID0gTWF0aC5yYW5kb20oKSAqIDE2IHwgMCwgdiA9IGMgPT0gJ3gnID8gciA6IChyICYgMHgzIHwgMHg4KTtcclxuICAgICAgICAgICAgcmV0dXJuIHYudG9TdHJpbmcoMTYpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICB2YXIgZmluYWxBY3Rpb25zPVtdXHJcbiAgICByZXN1bHRBY3Rpb25zLmZvckVhY2gob25lQWN0aW9uPT57XHJcbiAgICAgICAgdmFyIG9uZUZpbmFsQWN0aW9uPXt9XHJcbiAgICAgICAgb25lRmluYWxBY3Rpb25bXCIkc3JjSWRcIl09b25lQWN0aW9uW1wiZnJvbVwiXVxyXG4gICAgICAgIG9uZUZpbmFsQWN0aW9uW1wiJHJlbGF0aW9uc2hpcElkXCJdPXV1aWR2NCgpO1xyXG4gICAgICAgIG9uZUZpbmFsQWN0aW9uW1wib2JqXCJdPXtcclxuICAgICAgICAgICAgXCIkdGFyZ2V0SWRcIjogb25lQWN0aW9uW1widG9cIl0sXHJcbiAgICAgICAgICAgIFwiJHJlbGF0aW9uc2hpcE5hbWVcIjogb25lQWN0aW9uW1wiY29ubmVjdFwiXVxyXG4gICAgICAgIH1cclxuICAgICAgICBmaW5hbEFjdGlvbnMucHVzaChvbmVGaW5hbEFjdGlvbilcclxuICAgIH0pXHJcbiAgICAkLnBvc3QoXCJlZGl0QURUL2NyZWF0ZVJlbGF0aW9uc1wiLHthY3Rpb25zOkpTT04uc3RyaW5naWZ5KGZpbmFsQWN0aW9ucyl9LCAoZGF0YSwgc3RhdHVzKSA9PiB7XHJcbiAgICAgICAgaWYoZGF0YT09XCJcIikgcmV0dXJuO1xyXG4gICAgICAgIGdsb2JhbENhY2hlLnN0b3JlVHdpblJlbGF0aW9uc2hpcHNfYXBwZW5kKGRhdGEpXHJcbiAgICAgICAgdGhpcy5kcmF3UmVsYXRpb25zKGRhdGEpXHJcbiAgICB9KVxyXG59XHJcblxyXG5cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5jaGVja0F2YWlsYWJsZUNvbm5lY3Rpb25UeXBlID0gZnVuY3Rpb24gKGZyb21Ob2RlTW9kZWwsdG9Ob2RlTW9kZWwpIHtcclxuICAgIHZhciByZT1bXVxyXG4gICAgdmFyIHZhbGlkUmVsYXRpb25zaGlwcz1tb2RlbEFuYWx5emVyLkRURExNb2RlbHNbZnJvbU5vZGVNb2RlbF0udmFsaWRSZWxhdGlvbnNoaXBzXHJcbiAgICB2YXIgdG9Ob2RlQmFzZUNsYXNzZXM9bW9kZWxBbmFseXplci5EVERMTW9kZWxzW3RvTm9kZU1vZGVsXS5hbGxCYXNlQ2xhc3Nlc1xyXG4gICAgaWYodmFsaWRSZWxhdGlvbnNoaXBzKXtcclxuICAgICAgICBmb3IodmFyIHJlbGF0aW9uTmFtZSBpbiB2YWxpZFJlbGF0aW9uc2hpcHMpe1xyXG4gICAgICAgICAgICB2YXIgdGhlUmVsYXRpb25UeXBlPXZhbGlkUmVsYXRpb25zaGlwc1tyZWxhdGlvbk5hbWVdXHJcbiAgICAgICAgICAgIGlmKHRoZVJlbGF0aW9uVHlwZS50YXJnZXQ9PW51bGxcclxuICAgICAgICAgICAgICAgICB8fCB0aGVSZWxhdGlvblR5cGUudGFyZ2V0PT10b05vZGVNb2RlbFxyXG4gICAgICAgICAgICAgICAgIHx8dG9Ob2RlQmFzZUNsYXNzZXNbdGhlUmVsYXRpb25UeXBlLnRhcmdldF0hPW51bGwpIHJlLnB1c2gocmVsYXRpb25OYW1lKVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiByZVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuc2V0S2V5RG93bkZ1bmM9ZnVuY3Rpb24oaW5jbHVkZUNhbmNlbENvbm5lY3RPcGVyYXRpb24pe1xyXG4gICAgJChkb2N1bWVudCkub24oXCJrZXlkb3duXCIsICAoZSk9PntcclxuICAgICAgICBpZiAoZS5jdHJsS2V5ICYmIGUudGFyZ2V0Lm5vZGVOYW1lID09PSAnQk9EWScpe1xyXG4gICAgICAgICAgICBpZiAoZS53aGljaCA9PT0gOTApICAgdGhpcy51ci51bmRvKCk7XHJcbiAgICAgICAgICAgIGVsc2UgaWYgKGUud2hpY2ggPT09IDg5KSAgICB0aGlzLnVyLnJlZG8oKTtcclxuICAgICAgICAgICAgZWxzZSBpZihlLndoaWNoPT09ODMpe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHtcIm1lc3NhZ2VcIjpcInBvcHVwTGF5b3V0RWRpdGluZ1wifSlcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChlLmtleUNvZGUgPT0gMjcpIHRoaXMuY2FuY2VsVGFyZ2V0Tm9kZU1vZGUoKSAgICBcclxuICAgIH0pO1xyXG59XHJcblxyXG5cclxudG9wb2xvZ3lET00ucHJvdG90eXBlLnN0YXJ0VGFyZ2V0Tm9kZU1vZGUgPSBmdW5jdGlvbiAobW9kZSkge1xyXG4gICAgdGhpcy5jb3JlLmF1dG91bnNlbGVjdGlmeSggdHJ1ZSApO1xyXG4gICAgdGhpcy5jb3JlLmNvbnRhaW5lcigpLnN0eWxlLmN1cnNvciA9ICdjcm9zc2hhaXInO1xyXG4gICAgdGhpcy50YXJnZXROb2RlTW9kZT1tb2RlO1xyXG4gICAgdGhpcy5zZXRLZXlEb3duRnVuYyhcImluY2x1ZGVDYW5jZWxDb25uZWN0T3BlcmF0aW9uXCIpXHJcblxyXG4gICAgdGhpcy5jb3JlLm5vZGVzKCkub24oJ2NsaWNrJywgKGUpPT57XHJcbiAgICAgICAgdmFyIGNsaWNrZWROb2RlID0gZS50YXJnZXQ7XHJcbiAgICAgICAgdGhpcy5hZGRDb25uZWN0aW9ucyhjbGlja2VkTm9kZSlcclxuICAgICAgICAvL2RlbGF5IGEgc2hvcnQgd2hpbGUgc28gbm9kZSBzZWxlY3Rpb24gd2lsbCBub3QgYmUgY2hhbmdlZCB0byB0aGUgY2xpY2tlZCB0YXJnZXQgbm9kZVxyXG4gICAgICAgIHNldFRpbWVvdXQoKCk9Pnt0aGlzLmNhbmNlbFRhcmdldE5vZGVNb2RlKCl9LDUwKVxyXG5cclxuICAgIH0pO1xyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUuY2FuY2VsVGFyZ2V0Tm9kZU1vZGU9ZnVuY3Rpb24oKXtcclxuICAgIHRoaXMudGFyZ2V0Tm9kZU1vZGU9bnVsbDtcclxuICAgIHRoaXMuY29yZS5jb250YWluZXIoKS5zdHlsZS5jdXJzb3IgPSAnZGVmYXVsdCc7XHJcbiAgICAkKGRvY3VtZW50KS5vZmYoJ2tleWRvd24nKTtcclxuICAgIHRoaXMuc2V0S2V5RG93bkZ1bmMoKVxyXG4gICAgdGhpcy5jb3JlLm5vZGVzKCkub2ZmKFwiY2xpY2tcIilcclxuICAgIHRoaXMuY29yZS5hdXRvdW5zZWxlY3RpZnkoIGZhbHNlICk7XHJcbn1cclxuXHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUubm9Qb3NpdGlvbl9ncmlkPWZ1bmN0aW9uKGVsZXMpe1xyXG4gICAgdmFyIG5ld0xheW91dCA9IGVsZXMubGF5b3V0KHtcclxuICAgICAgICBuYW1lOiAnZ3JpZCcsXHJcbiAgICAgICAgYW5pbWF0ZTogZmFsc2UsXHJcbiAgICAgICAgZml0OmZhbHNlXHJcbiAgICB9KSBcclxuICAgIG5ld0xheW91dC5ydW4oKVxyXG59XHJcblxyXG50b3BvbG9neURPTS5wcm90b3R5cGUubm9Qb3NpdGlvbl9jb3NlPWZ1bmN0aW9uKGVsZXMsdW5kb0xheW91dERldGFpbCl7XHJcbiAgICBpZihlbGVzPT1udWxsKSBlbGVzPXRoaXMuY29yZS5lbGVtZW50cygpXHJcblxyXG4gICAgdmFyIG5ld0xheW91dCA9ZWxlcy5sYXlvdXQoe1xyXG4gICAgICAgIG5hbWU6ICdjb3NlJyxcclxuICAgICAgICBncmF2aXR5OjEsXHJcbiAgICAgICAgYW5pbWF0ZTogZmFsc2VcclxuICAgICAgICAsZml0OmZhbHNlXHJcbiAgICB9KSBcclxuICAgIG5ld0xheW91dC5ydW4oKVxyXG4gICAgaWYodW5kb0xheW91dERldGFpbCl7XHJcbiAgICAgICAgdmFyIG5ld0xheW91dERldGFpbD10aGlzLmdldEN1cnJlbnRMYXlvdXREZXRhaWwoKVxyXG4gICAgICAgIHRoaXMuYXBwbHlOZXdMYXlvdXRXaXRoVW5kbyhuZXdMYXlvdXREZXRhaWwsIHVuZG9MYXlvdXREZXRhaWwpXHJcbiAgICB9XHJcbiAgICB0aGlzLmNvcmUuY2VudGVyKGVsZXMpXHJcbn1cclxuXHJcbnRvcG9sb2d5RE9NLnByb3RvdHlwZS5ub1Bvc2l0aW9uX2NvbmNlbnRyaWM9ZnVuY3Rpb24oZWxlcyxib3gpe1xyXG4gICAgaWYoZWxlcz09bnVsbCkgZWxlcz10aGlzLmNvcmUuZWxlbWVudHMoKVxyXG4gICAgdmFyIG5ld0xheW91dCA9ZWxlcy5sYXlvdXQoe1xyXG4gICAgICAgIG5hbWU6ICdjb25jZW50cmljJyxcclxuICAgICAgICBhbmltYXRlOiBmYWxzZSxcclxuICAgICAgICBmaXQ6ZmFsc2UsXHJcbiAgICAgICAgbWluTm9kZVNwYWNpbmc6NjAsXHJcbiAgICAgICAgZ3Jhdml0eToxLFxyXG4gICAgICAgIGJvdW5kaW5nQm94OmJveFxyXG4gICAgfSkgXHJcbiAgICBuZXdMYXlvdXQucnVuKClcclxufVxyXG5cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gdG9wb2xvZ3lET007IiwiY29uc3Qgc2ltcGxlVHJlZT1yZXF1aXJlKFwiLi9zaW1wbGVUcmVlXCIpXHJcbmNvbnN0IG1vZGVsQW5hbHl6ZXI9cmVxdWlyZShcIi4vbW9kZWxBbmFseXplclwiKVxyXG5jb25zdCBnbG9iYWxDYWNoZSA9IHJlcXVpcmUoXCIuL2dsb2JhbENhY2hlXCIpXHJcblxyXG5cclxuZnVuY3Rpb24gdHdpbnNUcmVlKERPTSwgc2VhcmNoRE9NKSB7XHJcbiAgICB0aGlzLnRyZWU9bmV3IHNpbXBsZVRyZWUoRE9NKVxyXG4gICAgdGhpcy5tb2RlbElETWFwVG9OYW1lPXt9XHJcblxyXG4gICAgdGhpcy50cmVlLm9wdGlvbnMuZ3JvdXBOb2RlSWNvbkZ1bmM9KGduKT0+e1xyXG4gICAgICAgIHZhciBtb2RlbENsYXNzPWduLmluZm9bXCJAaWRcIl1cclxuICAgICAgICB2YXIgY29sb3JDb2RlPVwiZGFya0dyYXlcIlxyXG4gICAgICAgIHZhciBzaGFwZT1cImVsbGlwc2VcIlxyXG4gICAgICAgIHZhciBhdmFydGE9bnVsbFxyXG4gICAgICAgIHZhciBkaW1lbnNpb249MjA7XHJcbiAgICAgICAgaWYoZ2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVF0gJiYgZ2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVF1bbW9kZWxDbGFzc10pe1xyXG4gICAgICAgICAgICB2YXIgdmlzdWFsSnNvbiA9Z2xvYmFsQ2FjaGUudmlzdWFsRGVmaW5pdGlvbltnbG9iYWxDYWNoZS5zZWxlY3RlZEFEVF1bbW9kZWxDbGFzc11cclxuICAgICAgICAgICAgdmFyIGNvbG9yQ29kZT0gdmlzdWFsSnNvbi5jb2xvciB8fCBcImRhcmtHcmF5XCJcclxuICAgICAgICAgICAgdmFyIHNoYXBlPSAgdmlzdWFsSnNvbi5zaGFwZSB8fCBcImVsbGlwc2VcIlxyXG4gICAgICAgICAgICB2YXIgYXZhcnRhPSB2aXN1YWxKc29uLmF2YXJ0YSBcclxuICAgICAgICAgICAgaWYodmlzdWFsSnNvbi5kaW1lbnNpb25SYXRpbykgZGltZW5zaW9uKj1wYXJzZUZsb2F0KHZpc3VhbEpzb24uZGltZW5zaW9uUmF0aW8pXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgaWNvbkRPTT0kKFwiPGRpdiBzdHlsZT0nd2lkdGg6XCIrZGltZW5zaW9uK1wicHg7aGVpZ2h0OlwiK2RpbWVuc2lvbitcInB4O2Zsb2F0OmxlZnQ7cG9zaXRpb246cmVsYXRpdmUnPjwvZGl2PlwiKVxyXG4gICAgICAgIHZhciBpbWdTcmM9ZW5jb2RlVVJJQ29tcG9uZW50KHRoaXMuc2hhcGVTdmcoc2hhcGUsY29sb3JDb2RlKSlcclxuICAgICAgICBpY29uRE9NLmFwcGVuZCgkKFwiPGltZyBzcmM9J2RhdGE6aW1hZ2Uvc3ZnK3htbDt1dGY4LFwiK2ltZ1NyYytcIic+PC9pbWc+XCIpKVxyXG4gICAgICAgIGlmKGF2YXJ0YSl7XHJcbiAgICAgICAgICAgIHZhciBhdmFydGFpbWc9JChcIjxpbWcgc3R5bGU9J3Bvc2l0aW9uOmFic29sdXRlO2xlZnQ6MHB4O3dpZHRoOjYwJTttYXJnaW46MjAlJyBzcmM9J1wiK2F2YXJ0YStcIic+PC9pbWc+XCIpXHJcbiAgICAgICAgICAgIGljb25ET00uYXBwZW5kKGF2YXJ0YWltZylcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGljb25ET01cclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnRyZWUuY2FsbGJhY2tfYWZ0ZXJTZWxlY3ROb2Rlcz0obm9kZXNBcnIsbW91c2VDbGlja0RldGFpbCk9PntcclxuICAgICAgICB2YXIgaW5mb0Fycj1bXVxyXG4gICAgICAgIG5vZGVzQXJyLmZvckVhY2goKGl0ZW0sIGluZGV4KSA9PntcclxuICAgICAgICAgICAgaW5mb0Fyci5wdXNoKGl0ZW0ubGVhZkluZm8pXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgZ2xvYmFsQ2FjaGUuc2hvd2luZ0NyZWF0ZVR3aW5Nb2RlbElEPW51bGw7IFxyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcInNob3dJbmZvU2VsZWN0ZWROb2Rlc1wiLCBpbmZvOmluZm9BcnIsIFwibW91c2VDbGlja0RldGFpbFwiOm1vdXNlQ2xpY2tEZXRhaWx9KVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMudHJlZS5jYWxsYmFja19hZnRlckRibGNsaWNrTm9kZT0odGhlTm9kZSk9PntcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJQYW5Ub05vZGVcIiwgaW5mbzp0aGVOb2RlLmxlYWZJbmZvfSlcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnRyZWUuY2FsbGJhY2tfYWZ0ZXJTZWxlY3RHcm91cE5vZGU9KG5vZGVJbmZvKT0+e1xyXG4gICAgICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7XCJtZXNzYWdlXCI6XCJzaG93SW5mb0dyb3VwTm9kZVwiLGluZm86bm9kZUluZm99KVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuc2VhcmNoQm94PSQoJzxpbnB1dCB0eXBlPVwidGV4dFwiICBwbGFjZWhvbGRlcj1cInNlYXJjaC4uLlwiLz4nKS5hZGRDbGFzcyhcInczLWlucHV0XCIpO1xyXG4gICAgdGhpcy5zZWFyY2hCb3guY3NzKHtcIm91dGxpbmVcIjpcIm5vbmVcIixcImhlaWdodFwiOlwiMTAwJVwiLFwid2lkdGhcIjpcIjEwMCVcIn0pIFxyXG4gICAgc2VhcmNoRE9NLmFwcGVuZCh0aGlzLnNlYXJjaEJveClcclxuXHJcbiAgICB2YXIgaGlkZU9yU2hvd0VtcHR5R3JvdXA9JCgnPGJ1dHRvbiBzdHlsZT1cImhlaWdodDoyMHB4O2JvcmRlcjpub25lO3BhZGRpbmctbGVmdDoycHhcIiBjbGFzcz1cInczLWJsb2NrIHczLXRpbnkgdzMtaG92ZXItcmVkIHczLWFtYmVyXCI+SGlkZSBFbXB0eSBNb2RlbHM8L2J1dHRvbj4nKVxyXG4gICAgc2VhcmNoRE9NLmFwcGVuZChoaWRlT3JTaG93RW1wdHlHcm91cClcclxuICAgIERPTS5jc3MoXCJ0b3BcIixcIjUwcHhcIilcclxuICAgIGhpZGVPclNob3dFbXB0eUdyb3VwLmF0dHIoXCJzdGF0dXNcIixcInNob3dcIilcclxuICAgIGhpZGVPclNob3dFbXB0eUdyb3VwLm9uKFwiY2xpY2tcIiwoKT0+e1xyXG4gICAgICAgIGlmKGhpZGVPclNob3dFbXB0eUdyb3VwLmF0dHIoXCJzdGF0dXNcIik9PVwic2hvd1wiKXtcclxuICAgICAgICAgICAgaGlkZU9yU2hvd0VtcHR5R3JvdXAuYXR0cihcInN0YXR1c1wiLFwiaGlkZVwiKVxyXG4gICAgICAgICAgICBoaWRlT3JTaG93RW1wdHlHcm91cC50ZXh0KFwiU2hvdyBFbXB0eSBNb2RlbHNcIilcclxuICAgICAgICAgICAgdGhpcy50cmVlLm9wdGlvbnMuaGlkZUVtcHR5R3JvdXA9dHJ1ZVxyXG4gICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBoaWRlT3JTaG93RW1wdHlHcm91cC5hdHRyKFwic3RhdHVzXCIsXCJzaG93XCIpXHJcbiAgICAgICAgICAgIGhpZGVPclNob3dFbXB0eUdyb3VwLnRleHQoXCJIaWRlIEVtcHR5IE1vZGVsc1wiKVxyXG4gICAgICAgICAgICBkZWxldGUgdGhpcy50cmVlLm9wdGlvbnMuaGlkZUVtcHR5R3JvdXBcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy50cmVlLmdyb3VwTm9kZXMuZm9yRWFjaChvbmVHcm91cE5vZGU9PntvbmVHcm91cE5vZGUuY2hlY2tPcHRpb25IaWRlRW1wdHlHcm91cCgpfSlcclxuICAgIH0pXHJcblxyXG5cclxuICAgIHRoaXMuc2VhcmNoQm94LmtleXVwKChlKT0+e1xyXG4gICAgICAgIGlmKGUua2V5Q29kZSA9PSAxMylcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHZhciBhTm9kZSA9IHRoaXMudHJlZS5zZWFyY2hUZXh0KCQoZS50YXJnZXQpLnZhbCgpKVxyXG4gICAgICAgICAgICBpZihhTm9kZSE9bnVsbCl7XHJcbiAgICAgICAgICAgICAgICBhTm9kZS5wYXJlbnRHcm91cE5vZGUuZXhwYW5kKClcclxuICAgICAgICAgICAgICAgIHRoaXMudHJlZS5zZWxlY3RMZWFmTm9kZShhTm9kZSlcclxuICAgICAgICAgICAgICAgIHRoaXMudHJlZS5zY3JvbGxUb0xlYWZOb2RlKGFOb2RlKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbnR3aW5zVHJlZS5wcm90b3R5cGUuc2hhcGVTdmc9ZnVuY3Rpb24oc2hhcGUsY29sb3Ipe1xyXG4gICAgaWYoc2hhcGU9PVwiZWxsaXBzZVwiKXtcclxuICAgICAgICByZXR1cm4gJzxzdmcgeG1sbnM6c3ZnPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgdmlld0JveD1cIjAgMCAxMDAgMTAwXCIgZmlsbD1cIm5vbmVcIiB2ZXJzaW9uPVwiMS4xXCIgPjxjaXJjbGUgY3g9XCI1MFwiIGN5PVwiNTBcIiByPVwiNTBcIiAgZmlsbD1cIicrY29sb3IrJ1wiLz48L3N2Zz4nXHJcbiAgICB9ZWxzZSBpZihzaGFwZT09XCJoZXhhZ29uXCIpe1xyXG4gICAgICAgIHJldHVybiAnPHN2ZyB4bWxuczpzdmc9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHhtbG5zPVwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIiB2aWV3Qm94PVwiMCAwIDEwMCAxMDBcIiBmaWxsPVwibm9uZVwiIHZlcnNpb249XCIxLjFcIiA+PHBvbHlnb24gcG9pbnRzPVwiNTAgMCwgOTMuMyAyNSwgOTMuMyA3NSwgNTAgMTAwLCA2LjcgNzUsIDYuNyAyNVwiICBmaWxsPVwiJytjb2xvcisnXCIgLz48L3N2Zz4nXHJcbiAgICB9ZWxzZSBpZihzaGFwZT09XCJyb3VuZC1yZWN0YW5nbGVcIil7XHJcbiAgICAgICAgcmV0dXJuICc8c3ZnIHhtbG5zOnN2Zz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIgeG1sbnM9XCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiIHZpZXdCb3g9XCIwIDAgMTAwIDEwMFwiIGZpbGw9XCJub25lXCIgdmVyc2lvbj1cIjEuMVwiID48cmVjdCB4PVwiMTBcIiB5PVwiMTBcIiByeD1cIjEwXCIgcnk9XCIxMFwiIHdpZHRoPVwiODBcIiBoZWlnaHQ9XCI4MFwiIGZpbGw9XCInK2NvbG9yKydcIiAvPjwvc3ZnPidcclxuICAgIH1cclxufVxyXG5cclxudHdpbnNUcmVlLnByb3RvdHlwZS5yeE1lc3NhZ2U9ZnVuY3Rpb24obXNnUGF5bG9hZCl7XHJcbiAgICBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiQURURGF0YXNvdXJjZUNoYW5nZV9yZXBsYWNlXCIpIHRoaXMuQURURGF0YXNvdXJjZUNoYW5nZV9yZXBsYWNlKG1zZ1BheWxvYWQucXVlcnksIG1zZ1BheWxvYWQudHdpbnMsbXNnUGF5bG9hZC5BRFRJbnN0YW5jZURvZXNOb3RDaGFuZ2UpXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJBRFREYXRhc291cmNlQ2hhbmdlX2FwcGVuZFwiKSB0aGlzLkFEVERhdGFzb3VyY2VDaGFuZ2VfYXBwZW5kKG1zZ1BheWxvYWQucXVlcnksIG1zZ1BheWxvYWQudHdpbnMpXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJkcmF3VHdpbnNBbmRSZWxhdGlvbnNcIikgdGhpcy5kcmF3VHdpbnNBbmRSZWxhdGlvbnMobXNnUGF5bG9hZC5pbmZvKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiQURUTW9kZWxzQ2hhbmdlXCIpIHRoaXMucmVmcmVzaE1vZGVscyhtc2dQYXlsb2FkLm1vZGVscylcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImFkZE5ld1R3aW5cIikgdGhpcy5kcmF3T25lVHdpbihtc2dQYXlsb2FkLnR3aW5JbmZvKVxyXG4gICAgZWxzZSBpZihtc2dQYXlsb2FkLm1lc3NhZ2U9PVwiYWRkTmV3VHdpbnNcIikge1xyXG4gICAgICAgIG1zZ1BheWxvYWQudHdpbnNJbmZvLmZvckVhY2gob25lVHdpbkluZm89Pnt0aGlzLmRyYXdPbmVUd2luKG9uZVR3aW5JbmZvKX0pXHJcbiAgICB9XHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJ0d2luc0RlbGV0ZWRcIikgdGhpcy5kZWxldGVUd2lucyhtc2dQYXlsb2FkLnR3aW5JREFycilcclxuICAgIGVsc2UgaWYobXNnUGF5bG9hZC5tZXNzYWdlPT1cImhpZGVTZWxlY3RlZE5vZGVzXCIpIHRoaXMuZGVsZXRlVHdpbnMobXNnUGF5bG9hZC50d2luSURBcnIpXHJcbiAgICBlbHNlIGlmKG1zZ1BheWxvYWQubWVzc2FnZT09XCJ2aXN1YWxEZWZpbml0aW9uQ2hhbmdlXCIpe1xyXG4gICAgICAgIGlmKCFtc2dQYXlsb2FkLnNyY01vZGVsSUQpeyAvLyBjaGFuZ2UgbW9kZWwgY2xhc3MgdmlzdWFsaXphdGlvblxyXG4gICAgICAgICAgICB0aGlzLnRyZWUuZ3JvdXBOb2Rlcy5mb3JFYWNoKGduPT57Z24ucmVmcmVzaE5hbWUoKX0pXHJcbiAgICAgICAgfSBcclxuICAgIH1cclxufVxyXG5cclxudHdpbnNUcmVlLnByb3RvdHlwZS5kZWxldGVUd2lucz1mdW5jdGlvbih0d2luSURBcnIpe1xyXG4gICAgdHdpbklEQXJyLmZvckVhY2godHdpbklEPT57XHJcbiAgICAgICAgdGhpcy50cmVlLmRlbGV0ZUxlYWZOb2RlKHR3aW5JRClcclxuICAgIH0pXHJcbn1cclxuXHJcbnR3aW5zVHJlZS5wcm90b3R5cGUucmVmcmVzaE1vZGVscz1mdW5jdGlvbihtb2RlbHNEYXRhKXtcclxuICAgIC8vZGVsZXRlIGFsbCBncm91cCBub2RlcyBvZiBkZWxldGVkIG1vZGVsc1xyXG4gICAgdmFyIGFycj1bXS5jb25jYXQodGhpcy50cmVlLmdyb3VwTm9kZXMpXHJcbiAgICBhcnIuZm9yRWFjaCgoZ25vZGUpPT57XHJcbiAgICAgICAgaWYobW9kZWxzRGF0YVtnbm9kZS5uYW1lXT09bnVsbCl7XHJcbiAgICAgICAgICAgIC8vZGVsZXRlIHRoaXMgZ3JvdXAgbm9kZVxyXG4gICAgICAgICAgICBnbm9kZS5kZWxldGVTZWxmKClcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG5cclxuICAgIC8vdGhlbiBhZGQgYWxsIGdyb3VwIG5vZGVzIHRoYXQgdG8gYmUgYWRkZWRcclxuICAgIHZhciBjdXJyZW50TW9kZWxOYW1lQXJyPVtdXHJcbiAgICB0aGlzLnRyZWUuZ3JvdXBOb2Rlcy5mb3JFYWNoKChnbm9kZSk9PntjdXJyZW50TW9kZWxOYW1lQXJyLnB1c2goZ25vZGUubmFtZSl9KVxyXG5cclxuICAgIHZhciBhY3R1YWxNb2RlbE5hbWVBcnI9W11cclxuICAgIGZvcih2YXIgaW5kIGluIG1vZGVsc0RhdGEpIGFjdHVhbE1vZGVsTmFtZUFyci5wdXNoKGluZClcclxuICAgIGFjdHVhbE1vZGVsTmFtZUFyci5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhLnRvTG93ZXJDYXNlKCkubG9jYWxlQ29tcGFyZShiLnRvTG93ZXJDYXNlKCkpIH0pO1xyXG5cclxuICAgIGZvcih2YXIgaT0wO2k8YWN0dWFsTW9kZWxOYW1lQXJyLmxlbmd0aDtpKyspe1xyXG4gICAgICAgIGlmKGk8Y3VycmVudE1vZGVsTmFtZUFyci5sZW5ndGggJiYgY3VycmVudE1vZGVsTmFtZUFycltpXT09YWN0dWFsTW9kZWxOYW1lQXJyW2ldKSBjb250aW51ZVxyXG4gICAgICAgIC8vb3RoZXJ3aXNlIGFkZCB0aGlzIGdyb3VwIHRvIHRoZSB0cmVlXHJcbiAgICAgICAgdmFyIG5ld0dyb3VwPXRoaXMudHJlZS5pbnNlcnRHcm91cE5vZGUobW9kZWxzRGF0YVthY3R1YWxNb2RlbE5hbWVBcnJbaV1dLGkpXHJcbiAgICAgICAgbmV3R3JvdXAuc2hyaW5rKClcclxuICAgICAgICBjdXJyZW50TW9kZWxOYW1lQXJyLnNwbGljZShpLCAwLCBhY3R1YWxNb2RlbE5hbWVBcnJbaV0pO1xyXG4gICAgfVxyXG59XHJcblxyXG5cclxudHdpbnNUcmVlLnByb3RvdHlwZS5BRFREYXRhc291cmNlQ2hhbmdlX2FwcGVuZD1mdW5jdGlvbih0d2luUXVlcnlTdHIsdHdpbnNEYXRhKXtcclxuICAgIGlmICh0d2luc0RhdGEgIT0gbnVsbCkgdGhpcy5hcHBlbmRBbGxUd2lucyh0d2luc0RhdGEpXHJcbiAgICBlbHNlIHtcclxuICAgICAgICAkLnBvc3QoXCJxdWVyeUFEVC9hbGxUd2luc0luZm9cIiwgeyBxdWVyeTogdHdpblF1ZXJ5U3RyIH0sIChkYXRhKSA9PiB7XHJcbiAgICAgICAgICAgIGlmKGRhdGE9PVwiXCIpIHJldHVybjtcclxuICAgICAgICAgICAgZGF0YS5mb3JFYWNoKChvbmVOb2RlKT0+e2dsb2JhbENhY2hlLnN0b3JlZFR3aW5zW29uZU5vZGVbXCIkZHRJZFwiXV0gPSBvbmVOb2RlfSk7XHJcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kQWxsVHdpbnMoZGF0YSlcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG59XHJcblxyXG50d2luc1RyZWUucHJvdG90eXBlLkFEVERhdGFzb3VyY2VDaGFuZ2VfcmVwbGFjZT1mdW5jdGlvbih0d2luUXVlcnlTdHIsdHdpbnNEYXRhLEFEVEluc3RhbmNlRG9lc05vdENoYW5nZSl7XHJcbiAgICB2YXIgdGhlVHJlZT0gdGhpcy50cmVlO1xyXG5cclxuICAgIGlmIChBRFRJbnN0YW5jZURvZXNOb3RDaGFuZ2UpIHtcclxuICAgICAgICAvL2tlZXAgYWxsIGdyb3VwIG5vZGUgYXMgbW9kZWwgaXMgdGhlIHNhbWUsIG9ubHkgZmV0Y2ggYWxsIGxlYWYgbm9kZSBhZ2FpblxyXG4gICAgICAgIC8vcmVtb3ZlIGFsbCBsZWFmIG5vZGVzXHJcbiAgICAgICAgdGhpcy50cmVlLmNsZWFyQWxsTGVhZk5vZGVzKClcclxuICAgICAgICBpZiAodHdpbnNEYXRhICE9IG51bGwpIHRoaXMucmVwbGFjZUFsbFR3aW5zKHR3aW5zRGF0YSlcclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgJC5wb3N0KFwicXVlcnlBRFQvYWxsVHdpbnNJbmZvXCIsIHsgcXVlcnk6IHR3aW5RdWVyeVN0ciB9LCAoZGF0YSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYoZGF0YT09XCJcIikgZGF0YT1bXTtcclxuICAgICAgICAgICAgICAgIGRhdGEuZm9yRWFjaCgob25lTm9kZSk9PntnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1tvbmVOb2RlW1wiJGR0SWRcIl1dID0gb25lTm9kZX0pO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXBsYWNlQWxsVHdpbnMoZGF0YSlcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcbiAgICB9ZWxzZXtcclxuICAgICAgICB0aGVUcmVlLnJlbW92ZUFsbE5vZGVzKClcclxuICAgICAgICBmb3IgKHZhciBpZCBpbiB0aGlzLm1vZGVsSURNYXBUb05hbWUpIGRlbGV0ZSB0aGlzLm1vZGVsSURNYXBUb05hbWVbaWRdXHJcbiAgICAgICAgLy9xdWVyeSB0byBnZXQgYWxsIG1vZGVsc1xyXG4gICAgICAgICQuZ2V0KFwicXVlcnlBRFQvbGlzdE1vZGVsc1wiLCAoZGF0YSwgc3RhdHVzKSA9PiB7XHJcbiAgICAgICAgICAgIGlmKGRhdGE9PVwiXCIpIGRhdGE9W11cclxuICAgICAgICAgICAgdmFyIHRtcE5hbWVBcnIgPSBbXVxyXG4gICAgICAgICAgICB2YXIgdG1wTmFtZVRvT2JqID0ge31cclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZihkYXRhW2ldW1wiZGlzcGxheU5hbWVcIl09PW51bGwpIGRhdGFbaV1bXCJkaXNwbGF5TmFtZVwiXT1kYXRhW2ldW1wiQGlkXCJdXHJcbiAgICAgICAgICAgICAgICBpZigkLmlzUGxhaW5PYmplY3QoZGF0YVtpXVtcImRpc3BsYXlOYW1lXCJdKSl7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoZGF0YVtpXVtcImRpc3BsYXlOYW1lXCJdW1wiZW5cIl0pIGRhdGFbaV1bXCJkaXNwbGF5TmFtZVwiXT1kYXRhW2ldW1wiZGlzcGxheU5hbWVcIl1bXCJlblwiXVxyXG4gICAgICAgICAgICAgICAgICAgIGVsc2UgZGF0YVtpXVtcImRpc3BsYXlOYW1lXCJdPUpTT04uc3RyaW5naWZ5KGRhdGFbaV1bXCJkaXNwbGF5TmFtZVwiXSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmKHRtcE5hbWVUb09ialtkYXRhW2ldW1wiZGlzcGxheU5hbWVcIl1dIT1udWxsKXtcclxuICAgICAgICAgICAgICAgICAgICAvL3JlcGVhdGVkIG1vZGVsIGRpc3BsYXkgbmFtZVxyXG4gICAgICAgICAgICAgICAgICAgIGRhdGFbaV1bXCJkaXNwbGF5TmFtZVwiXT1kYXRhW2ldW1wiQGlkXCJdXHJcbiAgICAgICAgICAgICAgICB9ICBcclxuICAgICAgICAgICAgICAgIHRoaXMubW9kZWxJRE1hcFRvTmFtZVtkYXRhW2ldW1wiQGlkXCJdXSA9IGRhdGFbaV1bXCJkaXNwbGF5TmFtZVwiXVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICB0bXBOYW1lQXJyLnB1c2goZGF0YVtpXVtcImRpc3BsYXlOYW1lXCJdKVxyXG4gICAgICAgICAgICAgICAgdG1wTmFtZVRvT2JqW2RhdGFbaV1bXCJkaXNwbGF5TmFtZVwiXV0gPSBkYXRhW2ldXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdG1wTmFtZUFyci5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7IHJldHVybiBhLnRvTG93ZXJDYXNlKCkubG9jYWxlQ29tcGFyZShiLnRvTG93ZXJDYXNlKCkpIH0pO1xyXG4gICAgICAgICAgICB0bXBOYW1lQXJyLmZvckVhY2gobW9kZWxOYW1lID0+IHtcclxuICAgICAgICAgICAgICAgIHZhciBuZXdHcm91cCA9IHRoZVRyZWUuYWRkR3JvdXBOb2RlKHRtcE5hbWVUb09ialttb2RlbE5hbWVdKVxyXG4gICAgICAgICAgICAgICAgbmV3R3JvdXAuc2hyaW5rKClcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgbW9kZWxBbmFseXplci5jbGVhckFsbE1vZGVscygpO1xyXG4gICAgICAgICAgICBtb2RlbEFuYWx5emVyLmFkZE1vZGVscyhkYXRhKVxyXG4gICAgICAgICAgICBtb2RlbEFuYWx5emVyLmFuYWx5emUoKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0d2luc0RhdGEgIT0gbnVsbCkgdGhpcy5yZXBsYWNlQWxsVHdpbnModHdpbnNEYXRhKVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICQucG9zdChcInF1ZXJ5QURUL2FsbFR3aW5zSW5mb1wiLCB7IHF1ZXJ5OiB0d2luUXVlcnlTdHIgfSwgKGRhdGEpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZihkYXRhPT1cIlwiKSBkYXRhPVtdO1xyXG4gICAgICAgICAgICAgICAgICAgIGRhdGEuZm9yRWFjaCgob25lTm9kZSk9PntnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1tvbmVOb2RlW1wiJGR0SWRcIl1dID0gb25lTm9kZX0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVwbGFjZUFsbFR3aW5zKGRhdGEpXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgIH1cclxufVxyXG5cclxudHdpbnNUcmVlLnByb3RvdHlwZS5kcmF3VHdpbnNBbmRSZWxhdGlvbnM9IGZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgZGF0YS5jaGlsZFR3aW5zQW5kUmVsYXRpb25zLmZvckVhY2gob25lU2V0PT57XHJcbiAgICAgICAgZm9yKHZhciBpbmQgaW4gb25lU2V0LmNoaWxkVHdpbnMpe1xyXG4gICAgICAgICAgICB2YXIgb25lVHdpbj1vbmVTZXQuY2hpbGRUd2luc1tpbmRdXHJcbiAgICAgICAgICAgIHRoaXMuZHJhd09uZVR3aW4ob25lVHdpbilcclxuICAgICAgICB9XHJcbiAgICB9KVxyXG5cclxuICAgIC8vZHJhdyB0aG9zZSBrbm93biB0d2lucyBmcm9tIHRoZSByZWxhdGlvbnNoaXBzXHJcbiAgICB2YXIgdHdpbnNJbmZvPXt9XHJcbiAgICBkYXRhLmNoaWxkVHdpbnNBbmRSZWxhdGlvbnMuZm9yRWFjaChvbmVTZXQ9PntcclxuICAgICAgICB2YXIgcmVsYXRpb25zSW5mbz1vbmVTZXRbXCJyZWxhdGlvbnNoaXBzXCJdXHJcbiAgICAgICAgcmVsYXRpb25zSW5mby5mb3JFYWNoKChvbmVSZWxhdGlvbik9PntcclxuICAgICAgICAgICAgdmFyIHNyY0lEPW9uZVJlbGF0aW9uWyckc291cmNlSWQnXVxyXG4gICAgICAgICAgICB2YXIgdGFyZ2V0SUQ9b25lUmVsYXRpb25bJyR0YXJnZXRJZCddXHJcbiAgICAgICAgICAgIGlmKGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3NyY0lEXSlcclxuICAgICAgICAgICAgICAgIHR3aW5zSW5mb1tzcmNJRF0gPSBnbG9iYWxDYWNoZS5zdG9yZWRUd2luc1tzcmNJRF1cclxuICAgICAgICAgICAgaWYoZ2xvYmFsQ2FjaGUuc3RvcmVkVHdpbnNbdGFyZ2V0SURdKVxyXG4gICAgICAgICAgICAgICAgdHdpbnNJbmZvW3RhcmdldElEXSA9IGdsb2JhbENhY2hlLnN0b3JlZFR3aW5zW3RhcmdldElEXSAgICBcclxuICAgICAgICB9KVxyXG4gICAgfSlcclxuICAgIHZhciB0bXBBcnI9W11cclxuICAgIGZvcih2YXIgdHdpbklEIGluIHR3aW5zSW5mbykgdG1wQXJyLnB1c2godHdpbnNJbmZvW3R3aW5JRF0pXHJcbiAgICB0bXBBcnIuZm9yRWFjaChvbmVUd2luPT57dGhpcy5kcmF3T25lVHdpbihvbmVUd2luKX0pXHJcbn1cclxuXHJcbnR3aW5zVHJlZS5wcm90b3R5cGUuZHJhd09uZVR3aW49IGZ1bmN0aW9uKHR3aW5JbmZvKXtcclxuICAgIHZhciBncm91cE5hbWU9dGhpcy5tb2RlbElETWFwVG9OYW1lW3R3aW5JbmZvW1wiJG1ldGFkYXRhXCJdW1wiJG1vZGVsXCJdXVxyXG4gICAgdGhpcy50cmVlLmFkZExlYWZub2RlVG9Hcm91cChncm91cE5hbWUsdHdpbkluZm8sXCJza2lwUmVwZWF0XCIpXHJcbn1cclxuXHJcbnR3aW5zVHJlZS5wcm90b3R5cGUuYXBwZW5kQWxsVHdpbnM9IGZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgdmFyIHR3aW5JREFycj1bXVxyXG4gICAgLy9jaGVjayBpZiBhbnkgY3VycmVudCBsZWFmIG5vZGUgZG9lcyBub3QgaGF2ZSBzdG9yZWQgb3V0Ym91bmQgcmVsYXRpb25zaGlwIGRhdGEgeWV0XHJcbiAgICB0aGlzLnRyZWUuZ3JvdXBOb2Rlcy5mb3JFYWNoKChnTm9kZSk9PntcclxuICAgICAgICBnTm9kZS5jaGlsZExlYWZOb2Rlcy5mb3JFYWNoKGxlYWZOb2RlPT57XHJcbiAgICAgICAgICAgIHZhciBub2RlSWQ9bGVhZk5vZGUubGVhZkluZm9bXCIkZHRJZFwiXVxyXG4gICAgICAgICAgICBpZihnbG9iYWxDYWNoZS5zdG9yZWRPdXRib3VuZFJlbGF0aW9uc2hpcHNbbm9kZUlkXT09bnVsbCkgdHdpbklEQXJyLnB1c2gobm9kZUlkKVxyXG4gICAgICAgIH0pXHJcbiAgICB9KVxyXG5cclxuICAgIHRoaXMuYnJvYWRjYXN0TWVzc2FnZSh7IFwibWVzc2FnZVwiOiBcImFwcGVuZEFsbFR3aW5zXCIsaW5mbzpkYXRhfSlcclxuICAgIGZvcih2YXIgaT0wO2k8ZGF0YS5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIgZ3JvdXBOYW1lPXRoaXMubW9kZWxJRE1hcFRvTmFtZVtkYXRhW2ldW1wiJG1ldGFkYXRhXCJdW1wiJG1vZGVsXCJdXVxyXG4gICAgICAgIHRoaXMudHJlZS5hZGRMZWFmbm9kZVRvR3JvdXAoZ3JvdXBOYW1lLGRhdGFbaV0sXCJza2lwUmVwZWF0XCIpXHJcbiAgICAgICAgdHdpbklEQXJyLnB1c2goZGF0YVtpXVtcIiRkdElkXCJdKVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuZmV0Y2hBbGxSZWxhdGlvbnNoaXBzKHR3aW5JREFycilcclxufVxyXG5cclxudHdpbnNUcmVlLnByb3RvdHlwZS5yZXBsYWNlQWxsVHdpbnM9IGZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgdmFyIHR3aW5JREFycj1bXVxyXG4gICAgdGhpcy5icm9hZGNhc3RNZXNzYWdlKHsgXCJtZXNzYWdlXCI6IFwicmVwbGFjZUFsbFR3aW5zXCIsaW5mbzpkYXRhfSlcclxuICAgIGZvcih2YXIgaT0wO2k8ZGF0YS5sZW5ndGg7aSsrKXtcclxuICAgICAgICB2YXIgZ3JvdXBOYW1lPXRoaXMubW9kZWxJRE1hcFRvTmFtZVtkYXRhW2ldW1wiJG1ldGFkYXRhXCJdW1wiJG1vZGVsXCJdXVxyXG4gICAgICAgIHRoaXMudHJlZS5hZGRMZWFmbm9kZVRvR3JvdXAoZ3JvdXBOYW1lLGRhdGFbaV0pXHJcbiAgICAgICAgdHdpbklEQXJyLnB1c2goZGF0YVtpXVtcIiRkdElkXCJdKVxyXG4gICAgfVxyXG4gICAgdGhpcy5mZXRjaEFsbFJlbGF0aW9uc2hpcHModHdpbklEQXJyKVxyXG59XHJcblxyXG50d2luc1RyZWUucHJvdG90eXBlLmZldGNoQWxsUmVsYXRpb25zaGlwcz0gYXN5bmMgZnVuY3Rpb24odHdpbklEQXJyKXtcclxuICAgIHdoaWxlKHR3aW5JREFyci5sZW5ndGg+MCl7XHJcbiAgICAgICAgdmFyIHNtYWxsQXJyPSB0d2luSURBcnIuc3BsaWNlKDAsIDEwMCk7XHJcbiAgICAgICAgdmFyIGRhdGE9YXdhaXQgdGhpcy5mZXRjaFBhcnRpYWxSZWxhdGlvbnNoaXBzKHNtYWxsQXJyKVxyXG4gICAgICAgIGlmKGRhdGE9PVwiXCIpIGNvbnRpbnVlO1xyXG4gICAgICAgIGdsb2JhbENhY2hlLnN0b3JlVHdpblJlbGF0aW9uc2hpcHMoZGF0YSkgLy9zdG9yZSB0aGVtIGluIGdsb2JhbCBhdmFpbGFibGUgYXJyYXlcclxuICAgICAgICB0aGlzLmJyb2FkY2FzdE1lc3NhZ2UoeyBcIm1lc3NhZ2VcIjogXCJkcmF3QWxsUmVsYXRpb25zXCIsaW5mbzpkYXRhfSlcclxuICAgIH1cclxufVxyXG5cclxudHdpbnNUcmVlLnByb3RvdHlwZS5mZXRjaFBhcnRpYWxSZWxhdGlvbnNoaXBzPSBhc3luYyBmdW5jdGlvbihJREFycil7XHJcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICAgJC5wb3N0KFwicXVlcnlBRFQvYWxsUmVsYXRpb25zaGlwc1wiLHthcnI6SURBcnJ9LCBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgICAgICAgICAgcmVzb2x2ZShkYXRhKVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9Y2F0Y2goZSl7XHJcbiAgICAgICAgICAgIHJlamVjdChlKVxyXG4gICAgICAgIH1cclxuICAgIH0pXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gdHdpbnNUcmVlOyJdfQ==
