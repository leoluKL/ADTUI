(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
function adtInstanceSelectionDialog() {
    this.filters={}
    this.previousSelectedADT=null
    this.selectedADT=null;
    this.allTwinsInfo=null;

    if($("#adtInstanceSelectionDialog").length==0){
        this.DOM = $('<div id="adtInstanceSelectionDialog" title="Choose Data Set"></div>')
        this.DOM.css("overflow","hidden")
        $("body").append(this.DOM)
    }
}


adtInstanceSelectionDialog.prototype.preparationFunc = async function () {
    return new Promise((resolve, reject) => {
        try{
            $.get("twinsFilter/readStartFilters", (data, status) => {
                if(data!=null) this.filters=data;
                resolve()
            })
        }catch(e){
            reject(e)
        }
    })
}

adtInstanceSelectionDialog.prototype.popup = function () {
    $.get("queryADT/listADTInstance", (data, status) => {
        var adtArr=data;
        if (adtArr.length == 0) return;

        this.DOM.empty()
        var lable=$('<label style="padding-right:5px;font-size:1.2em">ADT Instance</label>')
        this.DOM.append(lable)
        var switchADTSelector=$('<select></select>')
        this.DOM.append(switchADTSelector)
        
        adtArr.forEach((adtInstance)=>{
            var str = adtInstance.split(".")[0].replace("https://", "")
            var anOption=$("<option value='"+adtInstance+"'>"+str+"</option>")
            switchADTSelector.append(anOption)
            if(this.filters[adtInstance]==null) this.filters[adtInstance]={}
        })     
        switchADTSelector.selectmenu({
            appendTo: this.DOM,
            change: (event, ui) => {
                if (this.selectedADT != ui.item.value) {
                    this.setADTInstance(ui.item.value)
                }
            }
        });

        var contentSpan=$("<span style='display:block;position:relative;height:calc(100% - 45px);margin-top:5px'></span>")
        this.DOM.append(contentSpan)

        var leftSpan=$("<span/>")
        leftSpan.css({"position":"absolute",left:"0px",height:"100%",top:"0px",border:"solid 1px grey",padding:"5px","overflow-x":"hidden","overflow-y":"auto","width":"195px"})
        var filterList=$("<ol  style='width:100%'/>")
        leftSpan.append(filterList)
        filterList.selectable();
        this.filterList=filterList;
        contentSpan.append(leftSpan)
        filterList.selectable({
            cancel: '.ui-selected' ,
            selected: (event, ui) => {
                var filterName=$(ui.selected).data('filterName')
                var queryStr=$(ui.selected).data('filterQuery')
                this.chooseOneFilter(filterName,queryStr)
            }
        })

        var rightSpan=$("<span/>")
        rightSpan.css({"position":"absolute",left:"210px",height:"100%",top:"0px",right:"0px",border:"solid 1px grey",padding:"5px"})
        contentSpan.append(rightSpan)

        var querySpan=$("<span/>")
        rightSpan.append(querySpan)
        var nameLbl=$("<span style='padding-right:1em'>Name</span>")
        var nameInput=$('<input/>').addClass("ui-corner-all");
        this.queryNameInput=nameInput;
        var queryLbl=$("<span style='display:block;padding-top:10px'>Query</span>")
        var queryInput=$('<textarea style="width:calc(100% - 5px);overflow-y:auto;overflow-x:hidden;height:5em;font-size:10px"/>').addClass("ui-corner-all");
        this.queryInput=queryInput;

        var saveBtn=$('<a class="ui-button ui-widget ui-corner-all" style="background-color:yellowgreen" href="#">Save</a>')
        var testBtn=$('<a class="ui-button ui-widget ui-corner-all"  href="#">Test</a>')
        var delBtn=$('<a class="ui-button ui-widget ui-corner-all" style="background-color:orangered" href="#">Delete Filter</a>')


        testBtn.click(()=>{this.testQuery()})
        saveBtn.click(()=>{this.saveQuery()})
        delBtn.click(()=>{this.delQuery()})


        querySpan.append(nameLbl,nameInput,queryLbl,queryInput,saveBtn,testBtn,delBtn)

        var testResultSpan=$("<span style='display:block;border:solid 1px grey'></span>")
        var testResultTable=$("<table></table>")
        this.testResultTable=testResultTable
        testResultSpan.css({"margin-top":"2px",overflow:"auto","position":"absolute","top":"135px","bottom":"1px","left":"1px","right":"1px"})
        testResultTable.css({"border-collapse":"collapse"})
        rightSpan.append(testResultSpan)
        testResultSpan.append(testResultTable)


        this.DOM.dialog({ 
            width:650
            ,height:500
            ,resizable:false
        })

        this.setADTInstance(adtArr[0])
    });
}

adtInstanceSelectionDialog.prototype.setADTInstance=function(selectedADT){
    if(this.previousSelectedADT==null || this.previousSelectedADT == selectedADT){
        this.DOM.dialog({ 
            buttons: [
                {  text: "Replace",  click: ()=> { this.useFilterToReplace()  }   },
                {  text: "Append",  click: ()=> { this.useFilterToAppend()  }   }
              ]
        })
    }else{
        this.DOM.dialog({ 
            buttons: [
                {  text: "Replace",  click: ()=> { this.useFilterToReplace()  }   }
              ]
        })
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
    if(queryName=="ALL")return;
    var confirmDialogDiv=$("<div/>")
    confirmDialogDiv.text("Do you confirm to delete filter \""+queryName+"\"?")
    $('body').append(confirmDialogDiv)
    confirmDialogDiv.dialog({
        buttons: [
          {
            text: "Confirm",
            click: ()=> {
                this.queryNameInput.val("")
                this.queryInput.val("")
                this.testResultTable.empty()
                delete this.filters[this.selectedADT][queryName]
                this.listFilters(this.selectedADT)
                this.chooseOneFilter("","")
                $.post("twinsFilter/saveStartFilters",{filters:this.filters})
                confirmDialogDiv.dialog( "destroy" );
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
            $(ele).addClass("ui-selected")
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
        if(!Array.isArray(data)) {
            alert("Query is not correct!")
            return;
        }
        this.allTwinsInfo=data
        data.forEach((oneNode)=>{
            var tr=$('<tr><td style="border-right:solid 1px lightgrey;border-bottom:solid 1px lightgrey">'+oneNode["$dtId"]+'</td><td style="border-bottom:solid 1px lightgrey">'+oneNode['$metadata']['$model']+'</td></tr>')
            this.testResultTable.append(tr)
        })
    });
}

adtInstanceSelectionDialog.prototype.listFilters=function(adtInstanceName){
    var availableFilters=this.filters[adtInstanceName]
    availableFilters["ALL"]="SELECT * FROM digitaltwins"

    var filterList=this.filterList;
    filterList.empty()

    for(var filterName in availableFilters){
        var oneFilter=$('<li style="font-size:1.2em" class="ui-widget-content">'+filterName+'</li>')
        oneFilter.css("cursor","default")
        oneFilter.data("filterName", filterName)
        oneFilter.data("filterQuery", availableFilters[filterName])
        if(filterName=="ALL") filterList.prepend(oneFilter)
        else filterList.append(oneFilter)
        

        oneFilter.dblclick((e)=>{
            this.useFilterToReplace();
        })
    }
}

adtInstanceSelectionDialog.prototype.useFilterToAppend=function(){
    this.previousSelectedADT=this.selectedADT
    if(this.queryInput.val()==""){
        alert("Please fill in query to fetch data from digital twin service..")
        return;
    }
}

adtInstanceSelectionDialog.prototype.useFilterToReplace=function(){
    this.previousSelectedADT=this.selectedADT
    if(this.queryInput.val()==""){
        alert("Please fill in query to fetch data from digital twin service..")
        return;
    }
    this.broadcastMessage({ "message": "ADTDatasourceChange", "query": this.queryInput.val(), "twins":this.allTwinsInfo })
    this.DOM.dialog( "close" );
}

adtInstanceSelectionDialog.prototype.chooseOneFilter=function(queryName,queryStr){
    this.queryNameInput.val(queryName)
    this.queryInput.val(queryStr)
    this.testResultTable.empty()
    this.allTwinsInfo=null
}

module.exports = new adtInstanceSelectionDialog();
},{}],2:[function(require,module,exports){
const modelAnalyzer = require("./modelAnalyzer");
var modelAnlyzer=require("./modelAnalyzer")
function infoPanel() {
    this.DOM=$("#infoPanel")
    this.DOM.css({"margin-top":"10px","margin-left":"3px"})
    this.selectedObjects=null;
}

infoPanel.prototype.rxMessage=function(msgPayload){
    this.DOM.empty()
    if(msgPayload.message=="selectNodes"){
        var arr=msgPayload.info;
        this.selectedObjects=arr;
        if(arr.length==1){
            var singleElementInfo=arr[0];
            
            if(singleElementInfo["$dtId"]){// select a node
                this.drawButtons("singleNode")
                this.drawStaticInfo(this.DOM,{"$dtId":singleElementInfo["$dtId"]},"1em","13px")
                var modelName=singleElementInfo['$metadata']['$model']
                this.drawEditable(this.DOM,modelAnalyzer.DTDLModels[modelName].editableProperties,singleElementInfo,[])
                this.drawStaticInfo(this.DOM,{"$etag":singleElementInfo["$etag"],"$metadata":singleElementInfo["$metadata"]},"1em","10px","DarkGray")
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
        }else{
            this.drawButtons("multiple")
            this.drawMultipleObj()
        }
    }else if(msgPayload.message=="selectGroupNode"){
        var modelID = msgPayload.info["@id"]
        var twinJson = {
            "$metadata": {
                "$model": modelID
            }
        }
        var addBtn = $('<a class="ui-button ui-widget ui-corner-all" style="margin-bottom:10px" href="#">Add Twin</a>')
        this.DOM.append(addBtn)

        addBtn.click((e) => {
            if(!twinJson["$dtId"]||twinJson["$dtId"]==""){
                alert("Please fill in name for the new digital twin")
                return;
            }
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
    if(!modelAnalyzer.DTDLModels[sourceModel].validRelationships[relationshipName]) return
    return modelAnalyzer.DTDLModels[sourceModel].validRelationships[relationshipName].editableRelationshipProperties
}

infoPanel.prototype.drawButtons=function(selectType){
    if(selectType=="singleRelationship"){
        var delBtn = $('<a class="ui-button ui-widget ui-corner-all" style="background-color:orangered" href="#">Delete</a>')
        this.DOM.append(delBtn)
        delBtn.click(()=>{this.deleteSelected()})
    }else if(selectType=="singleNode" || selectType=="multiple"){
        var showInboundBtn = $('<a class="ui-button ui-widget ui-corner-all" href="#">Show Inbound</a>')
        var showOutBoundBtn = $('<a class="ui-button ui-widget ui-corner-all"  href="#">Show Outbound</a>')
        var delBtn = $('<a class="ui-button ui-widget ui-corner-all" style="background-color:orangered" href="#">Delete All</a>')
        var connectToBtn = $('<a class="ui-button ui-widget ui-corner-all"  href="#">Connect To</a>')
    
        this.DOM.append(showInboundBtn, showOutBoundBtn, delBtn,connectToBtn)
    
        showOutBoundBtn.click(()=>{this.addOutBound()})
        showInboundBtn.click(()=>{this.addInBound()})  
        
        delBtn.click(()=>{this.deleteSelected()})
    }
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
        var smallArr= twinIDArr.splice(0, 50);
        var result=await this.deletePartialTwins(smallArr)
        this.broadcastMessage({ "message": "twinsDeleted",twinIDArr:result})
    }
}

infoPanel.prototype.deletePartialTwins= async function(IDArr){
    return new Promise((resolve, reject) => {
        try{
            $.post("editADT/deleteTwins",{arr:IDArr}, function (data) {
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
    
}


infoPanel.prototype.addOutBound=async function(){
    var arr=this.selectedObjects;
    var twinIDArr=[]
    arr.forEach(element => {
        if (element['$sourceId']) return;
        twinIDArr.push(element['$dtId'])
    });
    
    while(twinIDArr.length>0){
        var smallArr= twinIDArr.splice(0, 50);
        var data=await this.fetchPartialOutbounds(smallArr)
        this.broadcastMessage({ "message": "drawTwinsAndRelations",info:data})
    }
}

infoPanel.prototype.addInBound=async function(){
    var arr=this.selectedObjects;
    var twinIDArr=[]
    arr.forEach(element => {
        if (element['$sourceId']) return;
        twinIDArr.push(element['$dtId'])
    });
    
    while(twinIDArr.length>0){
        var smallArr= twinIDArr.splice(0, 50);
        var data=await this.fetchPartialInbounds(smallArr)
        this.broadcastMessage({ "message": "drawTwinsAndRelations",info:data})
    }
}

infoPanel.prototype.fetchPartialOutbounds= async function(IDArr){
    return new Promise((resolve, reject) => {
        try{
            $.post("queryADT/addOutBound",{arr:IDArr}, function (data) {
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
            $.post("queryADT/addInBound",{arr:IDArr}, function (data) {
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

infoPanel.prototype.drawStaticInfo=function(parent,jsonInfo,paddingTop,fontSize,fontColor){
    for(var ind in jsonInfo){
        var keyDiv= $("<label style='display:block'><div style='background-color:#f6f6f6;border:solid 1px grey;display:inline;padding:.1em .3em .1em .3em;margin-right:.3em'>"+ind+"</div></label>")
        keyDiv.css({"fontSize":fontSize,"color":fontColor})
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
        contentDOM.css({"fontSize":fontSize,"color":fontColor})
        keyDiv.append(contentDOM)
    }
}

infoPanel.prototype.drawEditable=function(parent,jsonInfo,originElementInfo,pathArr,isNewTwin){
    if(jsonInfo==null) return;
    for(var ind in jsonInfo){
        var keyDiv= $("<label style='display:block'><div style='display:inline;padding:.1em .3em .1em .3em'>"+ind+"</div></label>")
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
            var aSelectMenu=$('<select></select>')
            contentDOM.append(aSelectMenu)
            aSelectMenu.data("path", newPath)
            aSelectMenu.append($("<option></option>"))
            jsonInfo[ind].forEach((oneOption)=>{
                var str =oneOption["displayName"]  || oneOption["enumValue"] 
                var anOption=$("<option value='"+oneOption["enumValue"]+"'>"+str+"</option>")
                aSelectMenu.append(anOption)
            })
            aSelectMenu.selectmenu({
                change: (e, ui) => {
                    this.editDTProperty(originElementInfo,$(e.target).data("path"),ui.item.value,"string",isNewTwin)
                }
            });
            var val=this.searchValue(originElementInfo,newPath)
            if(val!=null){
                aSelectMenu.val(val);
                aSelectMenu.selectmenu("refresh");
            }           
        }else if(typeof(jsonInfo[ind])==="object") {
            contentDOM.css("display","block")
            contentDOM.css("padding-left","1em")
            this.drawEditable(contentDOM,jsonInfo[ind],originElementInfo,newPath,isNewTwin)
        }else {
            var aInput=$('<input type="text"/>').addClass("ui-corner-all");
            aInput.css("border","solid 1px grey")
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

module.exports = infoPanel;
},{"./modelAnalyzer":6}],3:[function(require,module,exports){
const mainUI=require("./mainUI.js")

$('document').ready(function(){
    var theMainUI=new mainUI()
});
},{"./mainUI.js":5}],4:[function(require,module,exports){
const adtInstanceSelectionDialog = require("./adtInstanceSelectionDialog")
const modelManagerDialog = require("./modelManagerDialog")

function mainToolbar() {
    this.switchADTInstanceBtn=$('<a class="ui-button ui-widget ui-corner-all" href="#">Source</a>')
    this.modelIOBtn=$('<a class="ui-button ui-widget ui-corner-all" href="#">Models</a>')
    this.showForgeViewBtn=$('<a class="ui-button ui-widget ui-corner-all" href="#">ForgeView</a>')
    this.showGISViewBtn=$('<a class="ui-button ui-widget ui-corner-all" href="#">GISView</a>')
    this.switchLayoutSelector=$('<select></select>')

    $("#mainToolBar").empty()
    $("#mainToolBar").append(this.switchADTInstanceBtn,this.modelIOBtn,this.showForgeViewBtn,this.showGISViewBtn,this.switchLayoutSelector)


    this.switchADTInstanceBtn.click(()=>{ adtInstanceSelectionDialog.popup() })
    this.modelIOBtn.click(()=>{ modelManagerDialog.popup() })

    this.switchLayoutSelector.html(
        '<option disabled selected>Choose Layout...</option><option selected>Default</option><option>Custom1</option><option>+ New layout</option>'
    )
    this.switchLayoutSelector.selectmenu({
        change: (event, ui) => {
            console.log(ui.item.value)
        }
    });
}

module.exports = mainToolbar;
},{"./adtInstanceSelectionDialog":1,"./modelManagerDialog":7}],5:[function(require,module,exports){
'use strict';
const topologyDOM=require("./topologyDOM.js")
const twinsTree=require("./twinsTree")
const adtInstanceSelectionDialog = require("./adtInstanceSelectionDialog")
const modelManagerDialog = require("./modelManagerDialog")
const mainToolbar = require("./mainToolbar")
const infoPanel= require("./infoPanel")

function mainUI() {
    this.initUILayout()

    this.twinsTree= new twinsTree($("#treeHolder"),$("#treeSearch"))
    
    this.mainToolbar=new mainToolbar()
    this.topologyInstance=new topologyDOM($('#canvas'))
    this.topologyInstance.init()
    this.infoPanel= new infoPanel()

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
    var componentsArr=[this.twinsTree,adtInstanceSelectionDialog,modelManagerDialog,
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
        , north__resizable: false	// OVERRIDE the pane-default of 'resizable=true'
        , north__closable: false

        //	some pane-size settings
        , west__minSize: 100
        , east__size: 300
        , east__minSize: 200
        , east__maxSize: .5 // 50% of layout width
        , center__minWidth: 100
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
    $(".ui-layout-resizer")
        .disableSelection() // affects only the resizer element
        .on('mousedown', $.layout.disableTextSelection); // affects entire document
}


module.exports = mainUI;
},{"./adtInstanceSelectionDialog":1,"./infoPanel":2,"./mainToolbar":4,"./modelManagerDialog":7,"./topologyDOM.js":9,"./twinsTree":10}],6:[function(require,module,exports){
//This is a singleton class

function modelAnalyzer(){
    this.DTDLModels={}
    this.relationshipTypes={}
}

modelAnalyzer.prototype.clearAllModels=function(){
    for(var id in this.DTDLModels) delete this.DTDLModels[id]
}

modelAnalyzer.prototype.addModels=function(arr){
    arr.forEach((ele)=>{
        var modelID= ele["@id"]
        this.DTDLModels[modelID]=ele
    })
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
                    //can reuse function expandEditableProperties even though now is todo relationship properties
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
        if(Array.isArray(ele.contents)){
            this.expandEditableProperties(ele.editableProperties,ele.contents,embeddedSchema)

            ele.contents.forEach((oneContent)=>{
                if(oneContent["@type"]=="Relationship") {
                    ele.validRelationships[oneContent["name"]]=this.relationshipTypes[oneContent["name"]][modelID]
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
function modelManagerDialog() {
    this.visualDefinition={}
    this.models={}
    if($("#modelManagerDialog").length==0){
        this.DOM = $('<div id="modelManagerDialog" title="Models"></div>')
        this.DOM.css("overflow","hidden")
        $("body").append(this.DOM)
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

modelManagerDialog.prototype.popup = function () {
    this.DOM.empty()

    var importModelsBtn = $('<a class="ui-button ui-widget ui-corner-all" href="#">Import</a>')
    var actualImportModelsBtn =$('<input type="file" name="modelFiles" multiple="multiple" style="display:none"></input>')
    this.DOM.append(importModelsBtn,actualImportModelsBtn)
    importModelsBtn.click( ()=>{
        actualImportModelsBtn.trigger('click');
    });
    actualImportModelsBtn.change((evt)=>{
        var files = evt.target.files; // FileList object
        this.readModelFilesContentAndImport(files)
    })

    var leftSpan = $("<span/>")
    this.DOM.append(leftSpan)
    leftSpan.css({ "position": "absolute", left: "0px", bottom: "0px", top: "40px", border: "solid 1px grey", padding: "5px", "overflow-x": "hidden", "overflow-y": "auto", "width": "195px" })
    var modelList = $("<ol  style='width:100%'/>")
    leftSpan.append(modelList)
    modelList.selectable();
    this.modelList = modelList;
    modelList.selectable({
        selected: (event, ui) => {
            var modelName = $(ui.selected).data('modelName')
            this.fillRightSpan(modelName)
        }
    })

    var rightSpan=$("<span/>")
    rightSpan.css({"position":"absolute",left:"210px",bottom: "0px",top:"5px",right:"0px",border:"solid 1px grey",padding:"5px",
    "overflow-x": "hidden", "overflow-y": "auto"})
    this.DOM.append(rightSpan)
    this.rightSpan=rightSpan;
    rightSpan.addClass("ui-accordion ui-widget ui-helper-reset")

    this.DOM.dialog({ 
        width:650
        ,height:500
        ,resizable:false
        ,buttons: []
    })
    this.listModels()

}

modelManagerDialog.prototype.fillRightSpan=async function(modelName){
    this.rightSpan.empty()
    var modelID=this.models[modelName]['@id']

    var delBtn = $('<a class="ui-button ui-widget ui-corner-all" style="background-color:orangered" href="#">Delete</a>')
    this.rightSpan.append(delBtn)
    delBtn.click(()=>{
        $.post("editADT/deleteModel",{"model":modelID}, (data)=> {
            if(data==""){//successful
                this.listModels("shouldBroadcast")
                this.rightSpan.empty()
                if(this.visualDefinition[adtInstanceSelectionDialog.selectedADT] && this.visualDefinition[adtInstanceSelectionDialog.selectedADT][modelID] ){
                    delete this.visualDefinition[adtInstanceSelectionDialog.selectedADT][modelID]
                    this.saveVisualDefinition()
                }
            }else{ //error happens
                alert(data)
            }
        });
    })
    
    var VisualizationDOM=this.addAPartInRightSpan("Visualization")
    var editablePropertiesDOM=this.addAPartInRightSpan("Editable Properties And Relationships")
    var originalDefinitionDOM=this.addAPartInRightSpan("Original Definition")

    var str=JSON.stringify(this.models[modelName],null,2)
    originalDefinitionDOM.append($('<pre id="json">'+str+'</pre>'))

    var edittableProperties=modelAnalyzer.DTDLModels[modelID].editableProperties
    this.fillEditableProperties(edittableProperties,editablePropertiesDOM)
    var validRelationships=modelAnalyzer.DTDLModels[modelID].validRelationships
    this.fillRelationshipInfo(validRelationships,editablePropertiesDOM)

    this.fillVisualization(modelID,VisualizationDOM)
}

modelManagerDialog.prototype.fillVisualization=function(modelID,parentDom){
    var modelJson=modelAnalyzer.DTDLModels[modelID];
    this.addOneVisualizationRow(modelID,parentDom)
    for(var ind in modelJson.validRelationships){
        this.addOneVisualizationRow(modelID,parentDom,ind)
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

    var colorSelector=$('<select></select>')
    containerDiv.append(colorSelector)
    var colorArr=["Black","Red","Green","Blue","Bisque","Brown","Coral","Crimson","DodgerBlue","Gold"]
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
            this.broadcastMessage({ "message": "visualDefinitionChange", "modelID":modelID,"colorCode":selectColorCode })
        }else{
            if(!visualJson[modelID]["relationships"]) visualJson[modelID]["relationships"]={}
            visualJson[modelID]["relationships"][relatinshipName]=selectColorCode
            this.broadcastMessage({ "message": "visualDefinitionChange", "srcModelID":modelID,"relationshipName":relatinshipName,"colorCode":selectColorCode })
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
    var headerDOM=$('<h3 class="accordion-header ui-accordion-header ui-helper-reset ui-state-default ui-accordion-icons ui-corner-all"><span class="ui-accordion-header-icon ui-icon ui-icon-triangle-1-e"></span></h3>')
    headerDOM.text(partName)
    var listDOM=$('<div class="ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom"></div>')
    this.rightSpan.append(headerDOM,listDOM)
    
    headerDOM.click( ()=> {
        var panel = listDOM;
        var isOpen = panel.is(':visible');
        if(!isOpen){
            headerDOM.children(":first").removeClass("ui-icon-triangle-1-e")
            headerDOM.children(":first").addClass("ui-icon-triangle-1-s")
        }else{
            headerDOM.children(":first").removeClass("ui-icon-triangle-1-s")
            headerDOM.children(":first").addClass("ui-icon-triangle-1-e")
        }

        // open or close as necessary
        panel[isOpen ? 'slideUp' : 'slideDown']()
            // trigger the correct custom event
            .trigger(isOpen ? 'hide' : 'show');

        // stop the link from causing a pagescroll
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
        }
    }
    if(fileContentArr.length==0) return;

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

modelManagerDialog.prototype.listModels=function(shouldBroadcast){
    this.modelList.empty()
    for(var ind in this.models) delete this.models[ind]
    $.get("queryADT/listModels", (data, status) => {
        data.forEach(oneItem=>{
            this.models[oneItem["displayName"]] = oneItem
        })
        if(shouldBroadcast){
            modelAnalyzer.clearAllModels();
            modelAnalyzer.addModels(data)
            modelAnalyzer.analyze();
        }
        
        var sortArr=[]
        for(var modelName in this.models) sortArr.push(modelName)
        sortArr.sort(function (a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()) });
        sortArr.forEach(oneModelName=>{
            var oneModelItem=$('<li style="font-size:1.2em" class="ui-widget-content">'+oneModelName+'</li>')
            oneModelItem.css("cursor","default")
            oneModelItem.data("modelName", oneModelName)
            this.modelList.append(oneModelItem)
        })
        if(shouldBroadcast) this.broadcastMessage({ "message": "ADTModelsChange", "models":this.models })
    })
}


module.exports = new modelManagerDialog();
},{"./adtInstanceSelectionDialog":1,"./modelAnalyzer":6}],8:[function(require,module,exports){
'use strict';

function simpleTree(DOM){
    this.DOM=DOM
    this.DOM.addClass("ui-accordion ui-widget ui-helper-reset")

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

simpleTree.prototype.selectLeafNode=function(leafNode){
    this.selectLeafNodeArr([leafNode])
}
simpleTree.prototype.appendLeafNodeToSelection=function(leafNode){
    var newArr=[].concat(this.selectedNodes)
    newArr.push(leafNode)
    this.selectLeafNodeArr(newArr)
}

simpleTree.prototype.selectGroupNode=function(groupNode){
    if(this.callback_afterSelectGroupNode) this.callback_afterSelectGroupNode(groupNode.info)
}

simpleTree.prototype.selectLeafNodeArr=function(leafNodeArr){
    for(var i=0;i<this.selectedNodes.length;i++){
        this.selectedNodes[i].dim()
    }
    this.selectedNodes.length=0;
    this.selectedNodes=this.selectedNodes.concat(leafNodeArr)
    for(var i=0;i<this.selectedNodes.length;i++){
        this.selectedNodes[i].highlight()
    }

    if(this.callback_afterSelectNodes) this.callback_afterSelectNodes(this.selectedNodes)
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

simpleTreeGroupNode.prototype.isOpen=function(){
    var panel = this.headerDOM.next();
    if(!panel) return false;
    return  panel.is(':visible');
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
    this.headerDOM=$('<h3 class="accordion-header ui-accordion-header ui-helper-reset ui-state-default ui-accordion-icons ui-corner-all"><span class="ui-accordion-header-icon ui-icon ui-icon-triangle-1-e"></span></h3>')
    this.refreshName()
    this.listDOM=$('<div class="ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom"></div>')

    this.headerDOM.click( (evt)=> {
        if(this.isOpen()) this.shrink()
        else this.expand() 
        this.parentTree.selectGroupNode(this)    
        // stop the link from causing a pagescroll
        return false;
    });
}

simpleTreeGroupNode.prototype.expand=function(){
    var panel = this.listDOM;
    var isOpen = this.isOpen()
    if(isOpen) return;
    this.headerDOM.children(":first").removeClass("ui-icon-triangle-1-e")
            this.headerDOM.children(":first").addClass("ui-icon-triangle-1-s")
    panel['slideDown']().trigger('show');
}

simpleTreeGroupNode.prototype.shrink=function(){
    var panel = this.listDOM;
    var isOpen = this.isOpen()
    if(!isOpen) return;
    this.headerDOM.children(":first").removeClass("ui-icon-triangle-1-s")
    this.headerDOM.children(":first").addClass("ui-icon-triangle-1-e")
    panel['slideUp']().trigger('hide');
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
    this.DOM=$('<li style="padding-left:3px;padding-top:1px;cursor:default">'+this.name+'</li>')
    var clickF=(e)=>{
        this.highlight();
        if (e.ctrlKey) {
            this.parentGroupNode.parentTree.appendLeafNodeToSelection(this)
        }else{
            this.parentGroupNode.parentTree.selectLeafNode(this)
        }
    }
    this.DOM.click((e)=>{ clickF(e)})

    this.DOM.dblclick((e)=>{
        clickF(e)
        this.parentGroupNode.parentTree.dblClickNode(this)
    })
}
simpleTreeLeafNode.prototype.highlight=function(){
    this.DOM.css("background-color", "orange");
}
simpleTreeLeafNode.prototype.dim=function(){
    this.DOM.css("background-color", "");
}


module.exports = simpleTree;
},{}],9:[function(require,module,exports){
'use strict';

const modelManagerDialog = require("./modelManagerDialog");
const adtInstanceSelectionDialog = require("./adtInstanceSelectionDialog")

function topologyDOM(DOM){
    this.DOM=DOM
    this.defaultNodeSize=30
}

topologyDOM.prototype.init=function(){
    this.core = cytoscape({
        container:  this.DOM[0], // container to render in

        // initial viewport state:
        zoom: 1,
        pan: { x: 0, y: 0 },

        // interaction options:
        minZoom: 1e-50,
        maxZoom: 1e50,
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
        //wheelSensitivity: 1,
        pixelRatio: 'auto',

        elements: [], // list of graph elements to start with

        style: [ // the stylesheet for the graph
            {
                selector: 'node',
                style: {
                    "width":this.defaultNodeSize,"height":this.defaultNodeSize,
                    'label': 'data(id)',
                    'opacity':0.9
                    //'background-color': function( ele ){ return ele.data('bg') }
                }
            },
            {
                selector: '.foo',
                style: {
                    'background-color': '#606',
                    'label': 'data(id)',
                    'shape':"ellipse",
                    'background-image': function(ele){ return "images/"+ele.data("img")+".png"; }
                    ,'background-fit':'contain' //cover
                    //,'background-clip':'none'
                }
            },

            {
                selector: 'edge',
                style: {
                    'width':2,
                    'line-color': '#888',
                    'target-arrow-color': '#000',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier'
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
            
        ],

        layout: {
            name: 'circle',
            radius: 100
        }

    });

    this.core.boxSelectionEnabled(true)


    var selectFunction=(event)=> {
        // target holds a reference to the originator of the event (core or element)
        var arr=this.core.$(":selected")
        if(arr.length==0) return
        var re=[]
        arr.forEach((ele) => { re.push(ele.data().originalInfo) })
        this.broadcastMessage({ "message": "selectNodes", info: re })
    }
    this.core.on('tapselect', selectFunction);
    this.core.on('tapunselect', selectFunction);

    this.core.on('boxend',(e)=>{//put inside boxend event to trigger only one time, and repleatly after each box select
        this.core.one('boxselect',selectFunction)
    })
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

topologyDOM.prototype.deleteTwins=function(twinIDArr){
    twinIDArr.forEach(twinID=>{
        this.core.$('[id = "'+twinID+'"]').remove()
    })   
}

topologyDOM.prototype.animateANode=function(twin){
    twin.animate({
        style: { 'height': this.defaultNodeSize*2,'width': this.defaultNodeSize*2 },
        duration: 200,
        complete:()=>{
            twin.animate({
                style: { 'height': this.defaultNodeSize,'width': this.defaultNodeSize },
                duration: 200,
            })
        }
      });
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
    this.noPosition_grid(eles)
    if(animation){
        eles.forEach((ele)=>{ this.animateANode(ele) })
    }
    return eles
}

topologyDOM.prototype.drawRelations=function(relationsData){
    var relationInfoArr=[]
    for(var i=0;i<relationsData.length;i++){
        var originalInfo=relationsData[i];
        var aRelation={data:{},group:"edges"}
        aRelation.data["originalInfo"]=originalInfo
        aRelation.data["id"]=originalInfo['$relationshipName']+"_"+originalInfo['$relationshipId']
        aRelation.data["source"]=originalInfo['$sourceId']
        aRelation.data["target"]=originalInfo['$targetId']
        if(this.core.$("#"+aRelation.data["source"]).length==0 || this.core.$("#"+aRelation.data["target"]).length==0) continue
        var sourceNode=this.core.$("#"+aRelation.data["source"])
        var sourceModel=sourceNode[0].data("originalInfo")['$metadata']['$model']
        
        //add additional source node information to the original relationship information
        originalInfo['sourceModel']=sourceModel
        aRelation.data["sourceModel"]=sourceModel
        aRelation.data["relationshipName"]=originalInfo['$relationshipName']

        relationInfoArr.push(aRelation)
    }

    var edges=this.core.add(relationInfoArr)
    return edges
}

topologyDOM.prototype.drawTwinsAndRelations=function(twinsAndRelations){
    twinsAndRelations.forEach(oneSet=>{
        var twinInfoArr=[]
        for(var ind in oneSet.childTwins) twinInfoArr.push(oneSet.childTwins[ind])
        var eles=this.drawTwins(twinInfoArr,"animation")
        
    
        var relationsInfo=oneSet["relationships"]
        var edges = this.drawRelations(relationsInfo)
        var sources = edges.sources()
    
        var fullSet=eles.union(edges.union(sources))
    
        this.noPosition_concentric(fullSet,sources.boundingBox())
    })
}

topologyDOM.prototype.applyVisualDefinition=function(){
    var visualJson=modelManagerDialog.visualDefinition[adtInstanceSelectionDialog.selectedADT]
    if(visualJson==null) return;
    for(var modelID in visualJson){
        if(visualJson[modelID].color){
            this.updateModelTwinColor(modelID,visualJson[modelID].color)
        }
        if(visualJson[modelID].relationships){
            for(var relationshipName in visualJson[modelID].relationships)
                this.updateRelationshipColor(modelID,relationshipName,visualJson[modelID].relationships[relationshipName])
        }
    }
}

topologyDOM.prototype.rxMessage=function(msgPayload){
    if(msgPayload.message=="ADTDatasourceChange"){
        this.core.nodes().remove()
        this.applyVisualDefinition()
    }else if(msgPayload.message=="refreshAllTwin") {
        this.core.nodes().remove()
        var eles= this.drawTwins(msgPayload.info)
    }else if(msgPayload.message=="drawAllRelations"){
        this.drawRelations(msgPayload.info)
        if(this.core.edges().size()!=0) this.noPosition_cose()
    }else if(msgPayload.message=="addNewTwin") {
        this.drawTwins([msgPayload.twinInfo],"animation")
    }else if(msgPayload.message=="drawTwinsAndRelations") this.drawTwinsAndRelations(msgPayload.info)
    else if(msgPayload.message=="selectNodes"){
        this.core.nodes().unselect()
        this.core.edges().unselect()
        var arr=msgPayload.info;
        arr.forEach(element => {
            var aTwin= this.core.nodes("#"+element['$dtId'])
            aTwin.select()
            this.animateANode(aTwin)
        });
    }else if(msgPayload.message=="PanToNode"){
        var nodeInfo= msgPayload.info;
        var topoNode= this.core.nodes("#"+nodeInfo["$dtId"])
        if(topoNode){
            this.core.center(topoNode)
        }
    }else if(msgPayload.message=="visualDefinitionChange"){
        if(msgPayload.srcModelID) this.updateRelationshipColor(msgPayload.srcModelID,msgPayload.relationshipName,msgPayload.colorCode)
        else this.updateModelTwinColor(msgPayload.modelID,msgPayload.colorCode)
    }else if(msgPayload.message=="twinsDeleted") this.deleteTwins(msgPayload.twinIDArr)
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
        animationDuration: 500
    }) 
    newLayout.run()
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
},{"./adtInstanceSelectionDialog":1,"./modelManagerDialog":7}],10:[function(require,module,exports){
const simpleTree=require("./simpleTree")
const modelAnalyzer=require("./modelAnalyzer")

function twinsTree(DOM, searchDOM) {
    this.tree=new simpleTree(DOM)
    this.modelIDMapToName={}

    this.tree.callback_afterSelectNodes=(nodesArr)=>{
        var infoArr=[]
        nodesArr.forEach((item, index) =>{
            infoArr.push(item.leafInfo)
        });
        this.broadcastMessage({ "message": "selectNodes", info:infoArr})
    }

    this.tree.callback_afterDblclickNode=(theNode)=>{
        this.broadcastMessage({ "message": "PanToNode", info:theNode.leafInfo})
    }

    this.tree.callback_afterSelectGroupNode=(nodeInfo)=>{
        this.broadcastMessage({"message":"selectGroupNode",info:nodeInfo})
    }

    this.searchBox=$('<input type="text"/>').addClass("ui-corner-all");
    this.searchBox.css({"border":"solid 1px grey","height":"calc(100% - 4px)","width":"calc(100% - 7px)"})
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
    if(msgPayload.message=="ADTDatasourceChange") this.refreshContent(msgPayload.query, msgPayload.twins)
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

twinsTree.prototype.refreshContent=function(twinQueryStr,twinsData){
    var theTree= this.tree;
    theTree.removeAllNodes()
    for(var id in this.modelIDMapToName) delete this.modelIDMapToName[id]

    //query to get all models
    $.get("queryADT/listModels", (data, status) => {
        var tmpNameArr=[]
        var tmpNameToObj={}
        for(var i=0;i<data.length;i++){
            this.modelIDMapToName[data[i]["@id"]]=data[i]["displayName"]
            tmpNameArr.push(data[i]["displayName"])
            tmpNameToObj[data[i]["displayName"]]=data[i]
        }
        tmpNameArr.sort(function (a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()) });
        tmpNameArr.forEach(modelName=>{
            var newGroup=theTree.addGroupNode(tmpNameToObj[modelName])
            newGroup.shrink()
        })
        modelAnalyzer.clearAllModels();
        modelAnalyzer.addModels(data)
        modelAnalyzer.analyze();

        if(twinsData!=null) this.renderAllTwins(twinsData)
        else{
            $.post("queryADT/allTwinsInfo",{query:twinQueryStr}, (data)=> {
                this.renderAllTwins(data)
            })
        }
        
    })
}

twinsTree.prototype.drawTwinsAndRelations= function(data){
    data.forEach(oneSet=>{
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

twinsTree.prototype.renderAllTwins= function(data){
    var twinIDArr=[]
    this.broadcastMessage({ "message": "refreshAllTwin",info:data})
    for(var i=0;i<data.length;i++){
        var groupName=this.modelIDMapToName[data[i]["$metadata"]["$model"]]
        this.tree.addLeafnodeToGroup(groupName,data[i])
        twinIDArr.push(data[i]["$dtId"])
    }
    this.fetchAllRelationships(twinIDArr)
}

twinsTree.prototype.fetchAllRelationships= async function(twinIDArr){
    while(twinIDArr.length>0){
        var smallArr= twinIDArr.splice(0, 50);
        var data=await this.fetchPartialRelationships(smallArr)
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
},{"./modelAnalyzer":6,"./simpleTree":8}]},{},[3]);
