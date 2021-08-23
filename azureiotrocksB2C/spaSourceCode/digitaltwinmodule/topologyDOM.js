'use strict';

const modelAnalyzer = require("../sharedSourceFiles/modelAnalyzer");
const simpleSelectMenu = require("../sharedSourceFiles/simpleSelectMenu")
const simpleConfirmDialog = require("../sharedSourceFiles/simpleConfirmDialog")
const globalCache = require("../sharedSourceFiles/globalCache")
const msalHelper=require("../msalHelper")
const serviceWorkerHelper=require("../sharedSourceFiles/serviceWorkerHelper")
const topologyDOM_styleManager=require("./topologyDOM_styleManager")
const topologyDOM_menu=require("./topologyDOM_menu")
const topologyDOM_visual=require("./topologyDOM_visual")
const topologyDOM_simDataSource=require("./topologyDOM_simDataSource")

function topologyDOM(containerDOM){
    this.DOM=$("<div style='height:100%;width:100%'></div>")
    containerDOM.append(this.DOM)
    this.defaultNodeSize=30
    
    this.lastCalcInputStyleNodes=[]
    this.lastCalcOutputStyleNodes=[]
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

        style: []
    });

    this.styleManager=new topologyDOM_styleManager(this.core,this.defaultNodeSize)
    

    //cytoscape edge editing plug-in
    this.core.edgeEditing({
        undoable: true,
        bendRemovalSensitivity: 16,
        enableMultipleAnchorRemovalOption: true,
        stickyAnchorTolerence: 20,
        anchorShapeSizeFactor: 5,
        enableAnchorSizeNotImpactByZoom: true,
        enableRemoveAnchorMidOfNearLine: false,
        enableCreateAnchorOnDrag: false,
        enableAnchorsAbsolutePosition:true,
        disableReconnect:true
    });

    this.core.boxSelectionEnabled(true)


    this.core.on('tapselect', ()=>{this.selectFunction()});
    this.core.on('tapunselect', ()=>{this.selectFunction()});

    this.core.on('boxend',(e)=>{//put inside boxend event to trigger only one time, and repleatly after each box select
        this.core.one('boxselect',()=>{this.selectFunction()})
    })

    this.core.on('mouseover',e=>{
        this.mouseOverFunction(e)
    })
    this.core.on('mouseout',e=>{
        this.mouseOutFunction(e)
    })
    
    this.core.on('zoom',(e)=>{
        this.styleManager.adjustModelsBaseDimension()
    })

    this.core.trigger("zoom")
    this.setKeyDownFunc()
    
    this.menuManager=new topologyDOM_menu(this)
    this.core.on('grab', (e)=>{
        this.broadcastMessage({ "message": "hideFloatInfoPanel"})
    }) 
    this.core.on('cxttap', (e)=>{
        //hide the float info window
        this.broadcastMessage({ "message": "hideFloatInfoPanel"})
        this.cancelTargetNodeMode()
        this.menuManager.decideVisibleContextMenu(e.target)
    })

    this.visualManager=new topologyDOM_visual(this.core)
    this.simDataSourceManager= new topologyDOM_simDataSource(this)
}

topologyDOM.prototype.hideCollection = function (collection) { 
    collection.remove()
    var twinIDArr = []
    collection.forEach(oneNode => { twinIDArr.push(oneNode.data("originalInfo")['$dtId']) })
    this.broadcastMessage({ "message": "hideSelectedNodes", "twinIDArr": twinIDArr })
}

topologyDOM.prototype.addSimulatorSource = function (twinName) {
    this.simDataSourceManager.newSimulatorSource(twinName)
}

topologyDOM.prototype.enableLiveDataStream = function (twinName) {
    var twinID=globalCache.twinDisplayNameMapToID[twinName]
    var dbtwin=globalCache.DBTwins[twinID]
    var modelID=dbtwin.modelID
    var propertyPaths=modelAnalyzer.fetchPropertyPathsOfModel(modelID)
    var checkBoxes=[]
    
    var dialog=new simpleConfirmDialog()
    dialog.show({"max-width":"450px","min-width":"300px"},{
        "title":"Choose Live Monitor Properties",
        "customDrawing":(parentDOM)=>{
            propertyPaths.forEach((path) => {
                var isIoTCheck = $('<input class="w3-check" style="width:20px;margin-left:16px;margin-right:5px" type="checkbox">')
                var isIoTText = $('<label style="margin-right:12px">'+path.join(".")+'</label>')
                parentDOM.append($('<div style="float:left"/>').append(isIoTCheck, isIoTText))
                checkBoxes.push(isIoTCheck)
                isIoTCheck.data("path",path)
            })
        },
        "buttons":[
            {
                "text": "Live",
                "colorClass":"w3-lime",
                "clickFunc": () => {
                    for(var i=0;i<checkBoxes.length;i++){
                        var aChkBox=checkBoxes[i]
                        if(!aChkBox.prop('checked')) continue
                        var aPath=aChkBox.data("path")
                        this.broadcastMessage({"message": "addLiveMonitor","twinID":twinID,"propertyPath":aPath})
                    }
                    dialog.close()
                }
            },
            {"text":"Cancel","colorClass":"w3-light-gray","clickFunc":()=>{dialog.close()}}
        ]
    })
}

topologyDOM.prototype.loadOutBound=async function(collection) {
    var twinIDArr = []
    collection.forEach(element => {
        var originalInfo = element.data("originalInfo")
        if (originalInfo['$sourceId']) return;
        twinIDArr.push(originalInfo['$dtId'])
    });

    while (twinIDArr.length > 0) {
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

        try {
            var data = await msalHelper.callAPI("digitaltwin/queryOutBound", "POST", { arr: smallArr, "knownTargets": knownTargetTwins })
            //new twin's relationship should be stored as well
            globalCache.storeTwinRelationships(data.newTwinRelations)
            data.childTwinsAndRelations.forEach(oneSet => {
                for (var ind in oneSet.childTwins) {
                    var oneTwin = oneSet.childTwins[ind]
                    globalCache.storeSingleADTTwin(oneTwin)
                }
            })
            this.visualManager.drawTwinsAndRelations(data)
            this.broadcastMessage({ "message": "drawTwinsAndRelations", info: data })
        } catch (e) {
            console.log(e)
            if (e.responseText) alert(e.responseText)
        }
    }
}

topologyDOM.prototype.loadInBound=async function(collection) {
    var twinIDArr = []
    collection.forEach(element => {
        var originalInfo = element.data("originalInfo")
        if (originalInfo['$sourceId']) return;
        twinIDArr.push(originalInfo['$dtId'])
    });

    while (twinIDArr.length > 0) {
        var smallArr = twinIDArr.splice(0, 100);
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

        try {
            var data = await msalHelper.callAPI("digitaltwin/queryInBound", "POST", { arr: smallArr, "knownSources": knownSourceTwins })
            //new twin's relationship should be stored as well
            globalCache.storeTwinRelationships(data.newTwinRelations)
            data.childTwinsAndRelations.forEach(oneSet => {
                for (var ind in oneSet.childTwins) {
                    var oneTwin = oneSet.childTwins[ind]
                    globalCache.storeSingleADTTwin(oneTwin)
                }
            })
            this.visualManager.drawTwinsAndRelations(data)
            this.broadcastMessage({ "message": "drawTwinsAndRelations", info: data })
        } catch (e) {
            console.log(e)
            if (e.responseText) alert(e.responseText)
        }
    }
}

topologyDOM.prototype.deleteSimNode=function(simNodeInfo){
    this.simDataSourceManager.deleteSimNode(simNodeInfo)
}


topologyDOM.prototype.deleteElementsArray=async function(arr) {
    if (arr.length == 0) return;
    var relationsArr = []
    var twinIDArr = []
    var twinIDs = {}
    arr.forEach(element => {
        var originalInfo = element.data("originalInfo")
        if(!originalInfo) return;
        if (originalInfo['$sourceId']) relationsArr.push(originalInfo);
        else {
            twinIDArr.push(originalInfo['$dtId'])
            twinIDs[originalInfo['$dtId']] = 1
        }
    });
    for (var i = relationsArr.length - 1; i >= 0; i--) { //clear those relationships that are going to be deleted after twins deleting
        var srcId = relationsArr[i]['$sourceId']
        var targetId = relationsArr[i]['$targetId']
        if (twinIDs[srcId] != null || twinIDs[targetId] != null) {
            relationsArr.splice(i, 1)
        }
    }
    var confirmDialogDiv = new simpleConfirmDialog()
    var dialogStr = ""
    var twinNumber = twinIDArr.length;
    var relationsNumber = relationsArr.length;
    if (twinNumber > 0) dialogStr = twinNumber + " twin" + ((twinNumber > 1) ? "s" : "") + " (with connected relations)"
    if (twinNumber > 0 && relationsNumber > 0) dialogStr += " and additional "
    if (relationsNumber > 0) dialogStr += relationsNumber + " relation" + ((relationsNumber > 1) ? "s" : "")
    dialogStr += " will be deleted. Please confirm"
    confirmDialogDiv.show(
        { width: "350px" },
        {
            title: "Confirm"
            , content: dialogStr
            , buttons: [
                {
                    colorClass: "w3-red w3-hover-pink", text: "Confirm", "clickFunc": async () => {
                        confirmDialogDiv.close()
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

topologyDOM.prototype.deleteTwins=async function(twinIDArr) {
    var ioTDevices = []
    twinIDArr.forEach(oneTwinID => {
        var dbTwinInfo = globalCache.DBTwins[oneTwinID]
        if (dbTwinInfo.IoTDeviceID != null && dbTwinInfo.IoTDeviceID != "") {
            ioTDevices.push(dbTwinInfo.IoTDeviceID)
        }
    })
    if (ioTDevices.length > 0) {
        msalHelper.callAPI("devicemanagement/unregisterIoTDevices", "POST", { arr: ioTDevices })
    }

    while (twinIDArr.length > 0) {
        var smallArr = twinIDArr.splice(0, 100);

        try {
            var result = await msalHelper.callAPI("digitaltwin/deleteTwins", "POST", { arr: smallArr }, "withProjectID")
            result.forEach((oneID) => {
                delete globalCache.storedTwins[oneID]
                delete globalCache.storedOutboundRelationships[oneID]
            });
            var theMessage={ "message": "twinsDeleted", twinIDArr: result }
            result.forEach(twinID=>{
                var twinDisplayName=globalCache.twinIDMapToDisplayName[twinID]
                this.core.$('[id = "'+twinDisplayName+'"]').remove()
            })
            this.broadcastMessage(theMessage)
        } catch (e) {
            console.log(e)
            if (e.responseText) alert(e.responseText)
        }
    }
}

topologyDOM.prototype.deleteRelations=async function(relationsArr) {
    var arr = []
    relationsArr.forEach(oneRelation => {
        arr.push({ srcID: oneRelation['$sourceId'], relID: oneRelation['$relationshipId'] })
    })
    try {
        var data = await msalHelper.callAPI("digitaltwin/deleteRelations", "POST", { "relations": arr })
        globalCache.storeTwinRelationships_remove(data)
        this.rxMessage({ "message": "relationsDeleted", "relations": data })
    } catch (e) {
        console.log(e)
        if (e.responseText) alert(e.responseText)
    }
}



topologyDOM.prototype.smartPositionNode = function (mousePosition) {
    var zoomLevel=this.core.zoom()
    if(!this.draggingNode) return
    //consider lock mouse move position for these nodes:
    // - its connectfrom nodes and their connectto nodes
    // - its connectto nodes and their connectfrom nodes
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

    this.lastCalcInputStyleNodes.forEach(ele=>{ele.removeClass("calcInput")})
    this.lastCalcInputStyleNodes.length=0
    this.lastCalcOutputStyleNodes.forEach(ele=>{ele.removeClass("calcOutput")})
    this.lastCalcOutputStyleNodes.length=0
    

    this.lastHoverTarget=e.target
    e.target.addClass("hover")

    //digital twins info
    this.broadcastMessage({ "message": "showInfoHoveredEle", "info": [info],"screenXY":this.convertPosition(e.position.x,e.position.y) })

    //if there is calculation script in hovered node, highlight input nodes and the properties
    if(info["$dtId"]){
        var twinID=info["$dtId"]
        var dbtwin=globalCache.DBTwins[twinID]
        var inputArr = dbtwin["inputs"]
        if(inputArr) inputArr.forEach(oneInput=>{this.visualizeSingleInputInTwinCalculation(oneInput,e.target)})

        this.analyseSingleOutput(e.target,info["$dtId"])
    }
}

topologyDOM.prototype.analyseSingleOutput = function (twinTopoNode,twinID) {
    //check if its output is another node's input
    var furtherInputsArr=[]
    for (var aTwinID in globalCache.DBTwins) {
        var checkDBTwin = globalCache.DBTwins[aTwinID]
        var inputArr=checkDBTwin["inputs"]
        if(!inputArr) continue;
        for(var i=0;i<inputArr.length;i++){
            var aFurtherInput=inputArr[i]
            if(aFurtherInput.twinID==twinID){
                furtherInputsArr.push({"path":aFurtherInput.path,"targetTwinName":checkDBTwin.displayName})
                break;
            }
        }
    }
    if(furtherInputsArr) furtherInputsArr.forEach(oneFurtherInput=>{
        this.visualizeSingleInputInTwinCalculation(oneFurtherInput,twinTopoNode)
    })
}

topologyDOM.prototype.visualizeSingleInputInTwinCalculation = function (oneInput,twinTopoNode) {
    var twinName = globalCache.twinIDMapToDisplayName[oneInput.twinID]
    var edges=null;
    if(oneInput.targetTwinName){
        var targetTwinNode = this.core.nodes("#" + oneInput.targetTwinName)
        if (targetTwinNode) {
            targetTwinNode.addClass("calcOutput")
            this.lastCalcOutputStyleNodes.push(targetTwinNode)
            //find the first relationship link from this node to hovered node
            var edges = twinTopoNode.edgesTo(targetTwinNode)
        }
    } else {
        var inputTwinNode = this.core.nodes("#" + twinName)
        if (inputTwinNode) {
            inputTwinNode.addClass("calcInput")
            this.lastCalcInputStyleNodes.push(inputTwinNode)
            //find the first relationship link from this node to hovered node
            var edges = inputTwinNode.edgesTo(twinTopoNode)
        }
    }
    if(edges && edges.length > 0){
        if(oneInput.targetTwinName) {
            edges[0].addClass("calcOutput")
            this.lastCalcOutputStyleNodes.push(edges[0])
        }else{
            edges[0].addClass("calcInput")
            this.lastCalcInputStyleNodes.push(edges[0])
        } 
        var currentPPath = edges[0].data('ppath') || ""
        if (currentPPath != "") currentPPath += ";"
        currentPPath += oneInput.path.join("/")
        edges[0].data('ppath', currentPPath)
        
        var randOffset= parseInt(Math.random()*40)+20
        edges[0].data('ppathOffset', randOffset+"%")
    }
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
    
    this.broadcastMessage({ "message": "hideFloatInfoPanel"})

    if(this.lastHoverTarget){
        this.lastHoverTarget.removeClass("hover")
        this.lastHoverTarget=null;
    } 
    this.lastCalcInputStyleNodes.forEach(ele=>{
        ele.removeClass("calcInput")
        ele.data('ppath',null)
    })
    this.lastCalcInputStyleNodes.length=0
    this.lastCalcOutputStyleNodes.forEach(ele=>{
        ele.removeClass("calcOutput")
        ele.data('ppath',null)
    })
    this.lastCalcOutputStyleNodes.length=0

}

topologyDOM.prototype.selectFunction = function () {
    var arr = this.core.$(":selected")

    var re = []

    if(arr.length==1){
        var ele=arr[0]
        if(ele.data().modelID=="_fixed_simulationDataSource"){
            this.broadcastMessage({ "message": "showInfoSelectedNodes", info: [ele.data().originalInfo] })
            return;
        }
    }

    arr.forEach((ele) => { 
        //remove those special elements
        if(ele.data().notTwin) {
            ele.unselect()
            return;
        }
        re.push(ele.data().originalInfo) 
    })
    this.broadcastMessage({ "message": "showInfoSelectedNodes", info: re })
    //for debugging purpose
    //arr.forEach((ele)=>{
    //  console.log("")
    //})
}





topologyDOM.prototype.applyVisualDefinition=function(){
    var visualJson=globalCache.visualDefinition["default"].detail
    if(visualJson==null) return;
    for(var modelID in visualJson){
        if(visualJson[modelID].color) this.styleManager.updateModelTwinColor(modelID,visualJson[modelID].color,visualJson[modelID].secondColor)
        if(visualJson[modelID].shape) this.styleManager.updateModelTwinShape(modelID,visualJson[modelID].shape)
        if(visualJson[modelID].avarta) this.styleManager.updateModelAvarta(modelID,visualJson[modelID].avarta)
        if(visualJson[modelID].dimensionRatio) this.styleManager.updateModelTwinDimension(modelID,visualJson[modelID].dimensionRatio)
        if(visualJson[modelID].labelX || visualJson[modelID].labelY){
            this.styleManager.updateModelTwinLabelOffset(modelID)
        } 
        if(visualJson[modelID].rels){
            for(var relationshipName in visualJson[modelID].rels){
                if(visualJson[modelID]["rels"][relationshipName].color){
                    this.styleManager.updateRelationshipColor(modelID,relationshipName,visualJson[modelID]["rels"][relationshipName].color)
                }
                if(visualJson[modelID]["rels"][relationshipName].shape){
                    this.styleManager.updateRelationshipShape(modelID,relationshipName,visualJson[modelID]["rels"][relationshipName].shape)
                }
                if(visualJson[modelID]["rels"][relationshipName].edgeWidth){
                    this.styleManager.updateRelationshipWidth(modelID,relationshipName,visualJson[modelID]["rels"][relationshipName].edgeWidth)
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
        var eles= this.visualManager.drawTwins(msgPayload.info)
        this.visualManager.applyCurrentLayoutWithNoAnimtaion()
    }else if(msgPayload.message=="projectIsChanged") {
        this.applyVisualDefinition()
    }else if(msgPayload.message=="appendAllTwins") {
        var eles= this.visualManager.drawTwins(msgPayload.info,"animate")
        this.visualManager.reviewStoredRelationshipsToDraw()
        this.visualManager.applyCurrentLayoutWithNoAnimtaion()
    }else if(msgPayload.message=="drawAllRelations"){
        var edges= this.visualManager.drawRelations(msgPayload.info)
        if(edges!=null) {
            var layoutDetail=null
            if(globalCache.currentLayoutName!=null) layoutDetail = globalCache.layoutJSON[globalCache.currentLayoutName].detail
            if(layoutDetail==null)  this.visualManager.noPosition_cose()
            else this.visualManager.applyCurrentLayoutWithNoAnimtaion()
        }
    }else if(msgPayload.message=="addNewTwin") {
        this.core.nodes().unselect()
        this.core.edges().unselect()
        this.visualManager.drawTwins([msgPayload.twinInfo],"animation")
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
        this.visualManager.drawTwins(msgPayload.twinsInfo,"animation")
    }else if(msgPayload.message=="showInfoSelectedNodes"){ //from selecting twins in the twintree
        this.core.nodes().unselect()
        this.core.edges().unselect()
        var arr=msgPayload.info;
        var mouseClickDetail=msgPayload.mouseClickDetail;
        arr.forEach(element => {
            var aTwin= this.core.nodes("#"+element['displayName'])
            aTwin.select()
            if(mouseClickDetail!=2) this.visualManager.animateANode(aTwin) //ignore double click second click
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
            if(msgPayload.color) this.styleManager.updateRelationshipColor(msgPayload.srcModelID,msgPayload.relationshipName,msgPayload.color)
            else if(msgPayload.shape) this.styleManager.updateRelationshipShape(msgPayload.srcModelID,msgPayload.relationshipName,msgPayload.shape)
            else if(msgPayload.edgeWidth) this.styleManager.updateRelationshipWidth(msgPayload.srcModelID,msgPayload.relationshipName,msgPayload.edgeWidth)
        } 
        else{
            if(msgPayload.color) this.styleManager.updateModelTwinColor(msgPayload.modelID,msgPayload.color,msgPayload.secondColor)
            else if(msgPayload.shape) {
                this.styleManager.updateModelTwinShape(msgPayload.modelID,msgPayload.shape)
                this.styleManager.adjustModelsBaseDimension(msgPayload.modelID)
            }else if(msgPayload.avarta){
                this.styleManager.adjustModelsBaseDimension(msgPayload.modelID)
                this.styleManager.updateModelAvarta(msgPayload.modelID,msgPayload.avarta)
            } 
            else if(msgPayload.noAvarta)  {
                this.styleManager.adjustModelsBaseDimension(msgPayload.modelID)
                this.styleManager.updateModelAvarta(msgPayload.modelID,null)
            }else if(msgPayload.dimensionRatio)  this.styleManager.updateModelTwinDimension(msgPayload.modelID,msgPayload.dimensionRatio)
            else if(msgPayload.labelPosition) this.styleManager.updateModelTwinLabelOffset(msgPayload.modelID)
        } 
    }else if(msgPayload.message=="relationsDeleted") this.visualManager.hideRelations(msgPayload.relations)
    else if(msgPayload.message=="saveLayout"){ this.saveLayout(msgPayload.layoutName)   }
    else if (msgPayload.message == "layoutChange") {
        this.visualManager.chooseLayout(globalCache.currentLayoutName)
    }else if(msgPayload.message=="alignSelectedNode") this.visualManager.alignSelectedNodes(msgPayload.direction)
    else if(msgPayload.message=="distributeSelectedNode") this.visualManager.distributeSelectedNode(msgPayload.direction)
    else if(msgPayload.message=="rotateSelectedNode") this.visualManager.rotateSelectedNode(msgPayload.direction)
    else if(msgPayload.message=="mirrorSelectedNode") this.visualManager.mirrorSelectedNode(msgPayload.direction)
    else if(msgPayload.message=="dimensionSelectedNode") this.visualManager.dimensionSelectedNode(msgPayload.direction)
    else if(msgPayload.message=="viewTypeChange"){
        if(msgPayload.viewType=="Topology") this.showSelf()
        else this.hideSelf()
    }
}


topologyDOM.prototype.showSelf = function () {
    this.DOM.show()
    this.DOM.animate({height: "100%"});
}

topologyDOM.prototype.hideSelf = function () {
    this.DOM.animate({height: "0%"},()=>{this.DOM.hide()});
}

topologyDOM.prototype.coseSelected=function(){
    this.visualManager.noPosition_cose(this.core.$(':selected'))
}



topologyDOM.prototype.saveLayout = async function (layoutName) {
    if(!globalCache.layoutJSON[layoutName]){
        var layoutDict={}
        globalCache.recordSingleLayout(layoutDict,globalCache.accountInfo.id,layoutName,false)
    }else layoutDict=globalCache.layoutJSON[layoutName].detail
    
    if(layoutDict["edges"]==null) layoutDict["edges"]={}
    
    var showingLayout=this.visualManager.getCurrentLayoutDetail()
    var showingEdgesLayout= showingLayout["edges"]
    delete showingLayout["edges"]
    for(var ind in showingLayout) layoutDict[ind]=showingLayout[ind]
    for(var ind in showingEdgesLayout) layoutDict["edges"][ind]=showingEdgesLayout[ind]

    var saveLayoutObj={"layouts":{}}
    saveLayoutObj["layouts"][layoutName]=JSON.stringify(layoutDict)  
    try{
        await msalHelper.callAPI("digitaltwin/saveLayout", "POST", saveLayoutObj,"withProjectID")
        this.broadcastMessage({ "message": "layoutsUpdated","layoutName":layoutName})
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
    }
}



topologyDOM.prototype.selectInboundNodes = function (selectedNodes) {
    var eles=this.core.nodes().edgesTo(selectedNodes).sources()
    eles.forEach((ele)=>{ this.visualManager.animateANode(ele) })
    eles.select()
    this.selectFunction()
}

topologyDOM.prototype.selectOutboundNodes = function (selectedNodes) {
    var eles=selectedNodes.edgesTo(this.core.nodes()).targets()
    eles.forEach((ele)=>{ this.visualManager.animateANode(ele) })
    eles.select()
    this.selectFunction()
}

topologyDOM.prototype.addConnections = function (targetNode,srcNodeArr) {
    var theConnectMode=this.targetNodeMode
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
        returnObj["from"]=fromNode.data().originalInfo["$dtId"]
        returnObj["to"]=toNode.data().originalInfo["$dtId"]
        returnObj["connect"]=connectionTypes[0]
        switchTypeSelector.callBack_clickOption=(optionText,optionValue)=>{
            returnObj["connect"]=optionText
            switchTypeSelector.changeName(optionText)
        }
        switchTypeSelector.triggerOptionIndex(0)
    }else if(connectionTypes.length==1){
        returnObj["from"]=fromNode.data().originalInfo["$dtId"]
        returnObj["to"]=toNode.data().originalInfo["$dtId"]
        returnObj["connect"]=connectionTypes[0]
        label.css("color","green")
        label.html("Add <b>"+connectionTypes[0]+"</b> connection from <b>"+fromNode.id()+"</b> to <b>"+toNode.id()+"</b>") 
    }
    confirmDialogDiv.dialogDiv.append(label)
    return returnObj;
}

topologyDOM.prototype.createConnections = async function (resultActions) {
    var finalActions=[]
    resultActions.forEach(oneAction=>{
        var oneFinalAction={}
        oneFinalAction["$srcId"]=oneAction["from"]
        oneFinalAction["$relationshipId"]=globalCache.uuidv4();
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
    this.visualManager.drawRelations(data)
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
            if (e.which === 90)   this.visualManager.ur.undo();
            else if (e.which === 89)    this.visualManager.ur.redo();
            else if(e.which===83){
                this.broadcastMessage({"message":"popupLayoutEditing"})
                return false
            }
        }
        if(includeCancelConnectOperation){
            if (e.keyCode == 27) this.cancelTargetNodeMode()    
        }
    });
}

topologyDOM.prototype.startTargetNodeMode = function (mode,selectedNodes) {
    this.core.autounselectify( true );
    this.core.container().style.cursor = 'crosshair';
    this.targetNodeMode=mode;
    this.setKeyDownFunc("includeCancelConnectOperation")

    this.core.nodes().on('click', (e)=>{
        var clickedNode = e.target;
        this.addConnections(clickedNode,selectedNodes)
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


module.exports = topologyDOM;