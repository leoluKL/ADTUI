'use strict';

const modelAnalyzer = require("../sharedSourceFiles/modelAnalyzer");
const simpleSelectMenu = require("../sharedSourceFiles/simpleSelectMenu")
const simpleConfirmDialog = require("../sharedSourceFiles/simpleConfirmDialog")
const globalCache = require("../sharedSourceFiles/globalCache")
const msalHelper=require("../msalHelper")

function topologyDOM(containerDOM){
    this.DOM=$("<div style='height:100%;width:100%'></div>")
    containerDOM.append(this.DOM)
    this.defaultNodeSize=30
    this.nodeSizeModelAdjustmentRatio={}
    this.lastCalcInputStyleNodes=[]
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
            {selector: 'node.hover',
            style: {
                'background-blacken':0.5
            }},
            {selector: 'edge.hover',
            style: {
                'width':5
            }},
        ]
    });

    this.highPriorityStyleDefinition()

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

    var ur = this.core.undoRedo({isDebug: false});
    this.ur=ur
    this.core.trigger("zoom")
    this.setKeyDownFunc()

    this.contenxtMenuInstance = this.core.contextMenus('get')
    this.addMenuItemsForEditing()
    this.addMenuItemsForOthers()
    this.addMenuItemsForLiveData()
    
    this.core.on('cxttap', (e)=>{
        this.decideVisibleContextMenu(e.target)
    })
}

topologyDOM.prototype.selectIfClickEleIsNotSelected=function(clickEle){
    if(!clickEle.selected()){
        this.core.$(':selected').unselect()
        clickEle.select()
    }
}

topologyDOM.prototype.node_changeSelectionWhenClickElement=function(clickEle){
    if(clickEle.isNode && clickEle.isNode()){
        this.selectIfClickEleIsNotSelected(clickEle)
    }
    var arr=this.core.$(':selected')
    return arr
}
topologyDOM.prototype.nodeoredge_changeSelectionWhenClickElement=function(clickEle){
    if(clickEle.isNode){ //at least having isnode function means it is node or edge
        this.selectIfClickEleIsNotSelected(clickEle)
    }
    var arr=this.core.$(':selected')
    return arr
}


topologyDOM.prototype.decideVisibleContextMenu=function(clickEle){
    //restore all menu items
    this.contenxtMenuInstance.showMenuItem('ConnectTo');
    this.contenxtMenuInstance.showMenuItem('ConnectFrom');
    this.contenxtMenuInstance.showMenuItem('QueryOutbound');
    this.contenxtMenuInstance.showMenuItem('QueryInbound');
    this.contenxtMenuInstance.showMenuItem('SelectOutbound');
    this.contenxtMenuInstance.showMenuItem('SelectInbound');
    this.contenxtMenuInstance.showMenuItem('enableLiveDataStream');
    this.contenxtMenuInstance.showMenuItem('COSE');
    this.contenxtMenuInstance.showMenuItem('addSimulatingDataSource');
    this.contenxtMenuInstance.showMenuItem('liveData');
    this.contenxtMenuInstance.showMenuItem('Hide');
    this.contenxtMenuInstance.showMenuItem('Others');

    var selectedNodes=this.core.$('node:selected')
    var selected=this.core.$(':selected')
    var isClickingNode=(clickEle.isNode && clickEle.isNode())
    var hasNode=isClickingNode || (selectedNodes.length>0)

    if(!hasNode){
        this.contenxtMenuInstance.hideMenuItem('ConnectTo');
        this.contenxtMenuInstance.hideMenuItem('ConnectFrom'); 
        this.contenxtMenuInstance.hideMenuItem('QueryOutbound');
        this.contenxtMenuInstance.hideMenuItem('QueryInbound');
        this.contenxtMenuInstance.hideMenuItem('SelectOutbound');
        this.contenxtMenuInstance.hideMenuItem('SelectInbound');
        this.contenxtMenuInstance.hideMenuItem('enableLiveDataStream');
        this.contenxtMenuInstance.hideMenuItem('Hide');
        this.contenxtMenuInstance.hideMenuItem('Others');

    }

    if(selected.length<=1) this.contenxtMenuInstance.hideMenuItem('COSE');
    if(!isClickingNode) this.contenxtMenuInstance.hideMenuItem('addSimulatingDataSource');
    if(!isClickingNode && selectedNodes.length==0) this.contenxtMenuInstance.hideMenuItem('liveData');

}

topologyDOM.prototype.addMenuItemsForLiveData = function () {
    this.contenxtMenuInstance.appendMenuItems([
        {
            id: 'liveData',
            content: 'Live Data',
            selector: 'node,edge',
            disabled:true,
            onClickFunction: ()=>{}//empty func, it is only a menu title item
        },
        {
            id: 'addSimulatingDataSource',
            content: 'Add Simulator Source',
            selector: 'node,edge',
            onClickFunction: (e) => {
                var target = e.target || e.cyTarget;
                this.addSimulatorSource(target.id())
            }
        },
        {
            id: 'enableLiveDataStream',
            content: 'Enable Live Data Stream',
            selector: 'node,edge',
            onClickFunction: (e) => {
                var target = e.target || e.cyTarget;
                this.enableLiveDataStream(target.id())
            }
        }
    ])
}

topologyDOM.prototype.addMenuItemsForEditing = function () {
    this.contenxtMenuInstance.appendMenuItems([
        {
            id: 'editing',
            content: 'Edit',
            selector: 'node,edge',
            disabled:true,
            onClickFunction: ()=>{}//empty func, it is only a menu title item
        },
        {
            id: 'ConnectTo',
            content: 'Connect To',
            selector: 'node,edge',
            onClickFunction: (e) => {
                this.startTargetNodeMode("connectTo",this.node_changeSelectionWhenClickElement(e.target))
            }
        },
        {
            id: 'ConnectFrom',
            content: 'Connect From',
            selector: 'node,edge',
            onClickFunction: (e) => {
                this.startTargetNodeMode("connectFrom",this.node_changeSelectionWhenClickElement(e.target))
            }
        },
        {
            id: 'DeleteAll',
            content: 'Delete',
            selector: 'node,edge',
            onClickFunction: (e) => {
                this.deleteElementsArray(this.nodeoredge_changeSelectionWhenClickElement(e.target) )
            }
        }
    ])
}

topologyDOM.prototype.addMenuItemsForOthers = function () {
    this.contenxtMenuInstance.appendMenuItems([
        {
            id: 'Others',
            content: 'Others', 
            selector: 'node,edge',
            disabled:true,
            onClickFunction: ()=>{} //empty func, it is only a menu title item
        },
        {
            id: 'QueryOutbound',
            content: 'Load Outbound',
            selector: 'node,edge',
            onClickFunction: (e) => {
                this.showOutBound(this.node_changeSelectionWhenClickElement(e.target))
            }
        },
        {
            id: 'QueryInbound',
            content: 'Load Inbound', 
            selector: 'node,edge',
            onClickFunction: (e) => {
                this.showInBound(this.node_changeSelectionWhenClickElement(e.target))
            }
        },{
            id: 'SelectOutbound',
            content: '+Select Outbound',
            selector: 'node,edge',
            onClickFunction: (e) => {
                this.selectOutboundNodes(this.node_changeSelectionWhenClickElement(e.target))
            }
        },
        {
            id: 'SelectInbound',
            content: '+Select Inbound',
            selector: 'node,edge',
            onClickFunction: (e) => {
                this.selectInboundNodes(this.node_changeSelectionWhenClickElement(e.target))
            }
        },
        {
            id: 'COSE',
            content: 'COSE Layout',
            selector: 'node,edge',
            onClickFunction: (e) => {
                this.noPosition_cose(this.core.$(':selected'),this.getCurrentLayoutDetail())
            }
        },
        {
            id: 'Hide',
            content: 'Hide',
            selector: 'node,edge',
            onClickFunction: (e) => {
                var collection=this.node_changeSelectionWhenClickElement(e.target)
                collection.remove()
                var twinIDArr=[]
                collection.forEach(oneNode=>{twinIDArr.push(oneNode.data("originalInfo")['$dtId'])})
                this.broadcastMessage({ "message": "hideSelectedNodes","twinIDArr":twinIDArr })
            }
        }
    ])
}


topologyDOM.prototype.addSimulatorSource = function (twinName) {
    //TODO:
    console.log("TODO: add simulator source")
}

topologyDOM.prototype.enableLiveDataStream = function (twinName) {
    //TODO:
    console.log("TODO: enable live data stream")
}

topologyDOM.prototype.highPriorityStyleDefinition = function () {
    this.core.style()
        .selector('node.calcInput')
        .style({
            'border-color': "red",
            'border-width': 1,
            'background-fill': 'linear-gradient',
            'background-gradient-stop-colors': ['red', 'red', 'white', "white", "red"],
            'background-gradient-stop-positions': ['0%', '50%', '51%', "90%", "91%"]
        })
        .update()


    this.core.style()
        .selector('edge.calcInput')
        .style({
            'width': '5',
            'line-color': 'red',
            'target-label': 'data(ppath)',
            'font-size': '11px',
            'target-text-offset': '40%',
            'text-background-color': 'white',
            'text-background-opacity': 1,
            'text-border-opacity': 1,
            'text-border-width': 1,
            'text-background-padding': '2px',
            'color': 'gray',
            'text-border-color': 'gray'
        })
        .update()
    this.core.style()
        .selector('edge:selected')
        .style({
            'width': 3,
            'line-color': 'red',
            'target-arrow-color': 'red',
            'source-arrow-color': 'red',
            'line-fill': "linear-gradient",
            'line-gradient-stop-colors': ['cyan', 'magenta', 'yellow'],
            'line-gradient-stop-positions': ['0%', '70%', '100%']
        })
        .update()

    this.core.style()
        .selector('node:selected')
        .style({
            'border-color': "red",
            'border-width': 2,
            'background-fill': 'radial-gradient',
            'background-gradient-stop-colors': ['cyan', 'magenta', 'yellow'],
            'background-gradient-stop-positions': ['0%', '50%', '60%']
        })
        .update()
}


topologyDOM.prototype.showOutBound=async function(collection) {
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
            this.drawTwinsAndRelations(data)
            this.broadcastMessage({ "message": "drawTwinsAndRelations", info: data })
        } catch (e) {
            console.log(e)
            if (e.responseText) alert(e.responseText)
        }
    }
}

topologyDOM.prototype.showInBound=async function(collection) {
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
            this.drawTwinsAndRelations(data)
            this.broadcastMessage({ "message": "drawTwinsAndRelations", info: data })
        } catch (e) {
            console.log(e)
            if (e.responseText) alert(e.responseText)
        }
    }
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

    this.lastHoverTarget=e.target
    e.target.addClass("hover")
    this.broadcastMessage({ "message": "showInfoHoveredEle", "info": [info],"screenXY":this.convertPosition(e.position.x,e.position.y) })

    //if there is calculation script in hovered node, highlight input nodes and the properties
    if(info["$dtId"]){
        var twinID=info["$dtId"]
        var dbtwin=globalCache.DBTwins[twinID]
        var calcScript=dbtwin["originalScript"]
        var inputArr = globalCache.findAllInputsInScript(calcScript,dbtwin["displayName"])

        inputArr.forEach(oneInput=>{
            var inputTwinNode=this.core.nodes("#"+oneInput["twinName_origin"])
            if(inputTwinNode) {
                inputTwinNode.addClass("calcInput")
                this.lastCalcInputStyleNodes.push(inputTwinNode)
                //find the first relationship link from this node to hovered node
                var edges=inputTwinNode.edgesTo(e.target)
                if(edges.length>0) {
                    edges[0].addClass("calcInput")
                    var currentPPath=edges[0].data('ppath')||""
                    if(currentPPath!="") currentPPath+=";"
                    currentPPath+=oneInput.path.join("/")
                    edges[0].data('ppath',currentPPath)
                    this.lastCalcInputStyleNodes.push(edges[0])
                }
            }
        })
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
    
    this.broadcastMessage({ "message": "topologyMouseOut"})

    if(this.lastHoverTarget){
        this.lastHoverTarget.removeClass("hover")
        this.lastHoverTarget=null;
    } 
    this.lastCalcInputStyleNodes.forEach(ele=>{
        ele.removeClass("calcInput")
        ele.data('ppath',null)
    })
    this.lastCalcInputStyleNodes.length=0

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
topologyDOM.prototype.updateModelTwinColor=function(modelID,colorCode,secondColorCode){
    if (secondColorCode == null) {
        this.core.style()
            .selector('node[modelID = "' + modelID + '"]')
            .style({ 'background-color': colorCode })
            .update()
    } else {
        colorCode=colorCode||"darkGray"
        this.core.style()
            .selector('node[modelID = "' + modelID + '"]')
            .style({
                'background-fill': 'linear-gradient',
                'background-gradient-stop-colors': [colorCode, colorCode, secondColorCode],
                'background-gradient-stop-positions': ['0%', '50%', '51%']
            })
            .update()
    }
    this.highPriorityStyleDefinition()
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
    this.highPriorityStyleDefinition()
}

topologyDOM.prototype.updateRelationshipShape=function(srcModelID,relationshipName,shape){
    if(shape=="solid"){
        this.core.style()
        .selector('edge[sourceModel = "'+srcModelID+'"][relationshipName = "'+relationshipName+'"]')
        .style({'line-style': shape})
        .update()   
    }else if(shape=="dotted"){
        this.core.style()
        .selector('edge[sourceModel = "'+srcModelID+'"][relationshipName = "'+relationshipName+'"]')
        .style({'line-style': 'dashed','line-dash-pattern':[8,8]})
        .update()   
    }
    
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
    this.highPriorityStyleDefinition() 
}

topologyDOM.prototype.reflectRelationsDeleted=function(relations){
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
    
    return eles
}

topologyDOM.prototype.applyCurrentLayoutWithNoAnimtaion = function () {
    var layoutName = globalCache.currentLayoutName
    if (layoutName != null) {
        var layoutDetail = globalCache.layoutJSON[layoutName].detail
        if (layoutDetail) {
            this.redrawBasedOnLayoutDetail(layoutDetail, null, "noAnimation")
        }
    }
    this.core.center(this.core.nodes())
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
    var visualJson=globalCache.visualDefinition["default"].detail
    if(visualJson==null) return;
    for(var modelID in visualJson){
        if(visualJson[modelID].color) this.updateModelTwinColor(modelID,visualJson[modelID].color,visualJson[modelID].secondColor)
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
        this.applyCurrentLayoutWithNoAnimtaion()
    }else if(msgPayload.message=="projectIsChanged") {
        this.applyVisualDefinition()
    }else if(msgPayload.message=="appendAllTwins") {
        var eles= this.drawTwins(msgPayload.info,"animate")
        this.reviewStoredRelationshipsToDraw()
        this.applyCurrentLayoutWithNoAnimtaion()
    }else if(msgPayload.message=="drawAllRelations"){
        var edges= this.drawRelations(msgPayload.info)
        if(edges!=null) {
            var layoutDetail=null
            if(globalCache.currentLayoutName!=null) layoutDetail = globalCache.layoutJSON[globalCache.currentLayoutName].detail
            if(layoutDetail==null)  this.noPosition_cose()
            else this.applyCurrentLayoutWithNoAnimtaion()
        }
    }else if(msgPayload.message=="addNewTwin") {
        this.core.nodes().unselect()
        this.core.edges().unselect()
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
    }else if(msgPayload.message=="showInfoSelectedNodes"){ //from selecting twins in the twintree
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
            if(msgPayload.color) this.updateModelTwinColor(msgPayload.modelID,msgPayload.color,msgPayload.secondColor)
            else if(msgPayload.shape) this.updateModelTwinShape(msgPayload.modelID,msgPayload.shape)
            else if(msgPayload.avarta) this.updateModelAvarta(msgPayload.modelID,msgPayload.avarta)
            else if(msgPayload.noAvarta)  this.updateModelAvarta(msgPayload.modelID,null)
            else if(msgPayload.dimensionRatio)  this.updateModelTwinDimension(msgPayload.modelID,msgPayload.dimensionRatio)
        } 
    }else if(msgPayload.message=="relationsDeleted") this.reflectRelationsDeleted(msgPayload.relations)
    else if(msgPayload.message=="saveLayout"){ this.saveLayout(msgPayload.layoutName)   }
    else if (msgPayload.message == "layoutChange") this.chooseLayout(globalCache.currentLayoutName)
    else if(msgPayload.message=="alignSelectedNode") this.alignSelectedNodes(msgPayload.direction)
    else if(msgPayload.message=="distributeSelectedNode") this.distributeSelectedNode(msgPayload.direction)
    else if(msgPayload.message=="rotateSelectedNode") this.rotateSelectedNode(msgPayload.direction)
    else if(msgPayload.message=="mirrorSelectedNode") this.mirrorSelectedNode(msgPayload.direction)
    else if(msgPayload.message=="dimensionSelectedNode") this.dimensionSelectedNode(msgPayload.direction)
    else if(msgPayload.message=="viewTypeChange"){
        if(msgPayload.viewType=="Topology") this.showSelf()
        else this.hideSelf()
    }
}

topologyDOM.prototype.chooseLayout = function (layoutName) {
    if (layoutName == "[NA]") {
        //select all visible nodes and do a COSE layout, clean all bend edge line as well
        var currentLayout=this.getCurrentLayoutDetail()
        this.core.edges().forEach(oneEdge => {
            oneEdge.removeClass('edgebendediting-hasbendpoints')
            oneEdge.removeClass('edgecontrolediting-hascontrolpoints')
            oneEdge.data("cyedgebendeditingWeights", [])
            oneEdge.data("cyedgebendeditingDistances", [])
            oneEdge.data("cyedgecontroleditingWeights", [])
            oneEdge.data("cyedgecontroleditingDistances", [])
        })
        this.noPosition_cose(null,currentLayout)
    } else if (layoutName != null) {
        var layoutDetail = globalCache.layoutJSON[layoutName].detail
        if (layoutDetail) {
            this.applyNewLayoutWithUndo(layoutDetail, this.getCurrentLayoutDetail())
        }
    }
}


topologyDOM.prototype.showSelf = function () {
    this.DOM.show()
    this.DOM.animate({height: "100%"});
}

topologyDOM.prototype.hideSelf = function () {
    this.DOM.animate({height: "0%"},()=>{this.DOM.hide()});
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

topologyDOM.prototype.redrawBasedOnLayoutDetail = function (layoutDetail,onlyAdjustNodePosition,noAnimation) {
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
        animate: ((noAnimation)?false:true),
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
        var nodeName=globalCache.twinIDMapToDisplayName[srcID]
        var theNode=this.core.filter('[id = "'+nodeName+'"]');
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

topologyDOM.prototype.saveLayout = async function (layoutName) {
    if(!globalCache.layoutJSON[layoutName]){
        var layoutDict={}
        globalCache.recordSingleLayout(layoutDict,globalCache.accountInfo.id,layoutName,false)
    }else layoutDict=globalCache.layoutJSON[layoutName].detail
    
    if(layoutDict["edges"]==null) layoutDict["edges"]={}
    
    var showingLayout=this.getCurrentLayoutDetail()
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

topologyDOM.prototype.numberPrecision = function (number) {
    if(Array.isArray(number)){
        for(var i=0;i<number.length;i++){
            number[i] = this.numberPrecision(number[i])
        }
        return number
    }else
    return parseFloat(number.toFixed(3))
}



topologyDOM.prototype.selectInboundNodes = function (selectedNodes) {
    var eles=this.core.nodes().edgesTo(selectedNodes).sources()
    eles.forEach((ele)=>{ this.animateANode(ele) })
    eles.select()
    this.selectFunction()
}

topologyDOM.prototype.selectOutboundNodes = function (selectedNodes) {
    var eles=selectedNodes.edgesTo(this.core.nodes()).targets()
    eles.forEach((ele)=>{ this.animateANode(ele) })
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