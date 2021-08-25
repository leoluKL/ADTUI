const globalCache = require("../sharedSourceFiles/globalCache");

function topologyDOM_styleManager(topologyCore,defaultNodeSize){
    this.core=topologyCore;
    this.defaultNodeSize=defaultNodeSize||30
    this.baseNodeSize=this.defaultNodeSize;
    this.baseSquareShapeSize=this.defaultNodeSize;
    this.nodeModelVisualAdjustment={}
    this.defineHighPriorityStyles()
    this.initStyle()
}

topologyDOM_styleManager.prototype.initStyle=function(){
    var initStyleArr=[ // the stylesheet for the graph
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
                ,'background-width':'75%'
                ,'background-height':'75%'
            }
        },
        {
            selector: 'edge',
            style: {
                'width':2,
                'line-color': '#888',
                'target-arrow-color': '#555',
                'target-arrow-shape': 'triangle',
                'source-arrow-color': '#999',
                'source-arrow-shape': 'circle',
                'source-arrow-fill':'hollow',
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
            'width':10
        }},
        {selector: 'node[modelID = "_fixed_simulationDataSource"]',
        style: {
            'shape':'rectangle'
            ,'background-fill': 'solid'
            ,'background-color': 'white' 
            ,'background-image':this.dataSourceSVG()
            ,'border-opacity':1
            ,'text-opacity': 0
            ,'border-width':1
            ,'border-color':'darkGray'
        }},
        {selector: 'edge[sourceModel = "_fixed_simulationDataSource"]',
        style: {
            'width':2,
            'source-arrow-shape': 'circle',
            'target-arrow-shape': 'circle',
            'line-color':'gray',
            'line-style': 'dashed'
            ,'line-dash-pattern':[8,8]
        }}
    ]
    this.updateStyleSheet(initStyleArr)
}

topologyDOM_styleManager.prototype.defineHighPriorityStyles=function(){
    this.highestStyleArr= [
        {selector:'node.calcInput' , style: {
            'border-color': "red",
            'border-width': 1,
            'background-fill': 'linear-gradient',
            'background-gradient-stop-colors': ['red', 'red', 'white', "white", "red"],
            'background-gradient-stop-positions': ['0%', '50%', '51%', "90%", "91%"]
        }},
        {selector:'node.calcOutput' , style: {
            'border-color': "blue",
            'border-width': 1,
            'background-fill': 'linear-gradient',
            'background-gradient-stop-colors': ['blue', 'blue', 'white', "white", "blue"],
            'background-gradient-stop-positions': ['0%', '50%', '51%', "90%", "91%"]
        }},
        {selector:'edge.calcInput' , style:{
            'width': '5',
            'line-color': 'red',
            'target-label': 'data(ppath)',
            'font-size': '11px',
            'target-text-offset': 'data(ppathOffset)',
            'text-background-color': 'white',
            'text-background-opacity': 1,
            'text-border-opacity': 1,
            'text-border-width': 1,
            'text-background-padding': '2px',
            'color': 'gray',
            'text-border-color': 'gray'
        } },
        {selector:'edge.calcOutput' , style: {
            'width': '5',
            'line-color': 'blue',
            'source-label': 'data(ppath)',
            'font-size': '11px',
            'source-text-offset': 'data(ppathOffset)',
            'text-background-color': 'white',
            'text-background-opacity': 1,
            'text-border-opacity': 1,
            'text-border-width': 1,
            'text-background-padding': '2px',
            'color': 'gray',
            'text-border-color': 'gray'
        }},
        {selector:'edge:selected' , style:{
            'width': 8,
            'line-color': 'red',
            'target-arrow-color': 'red',
            'source-arrow-color': 'red',
            'line-fill': "linear-gradient",
            'line-gradient-stop-colors': ['cyan', 'magenta', 'yellow'],
            'line-gradient-stop-positions': ['0%', '70%', '100%']
        } },
        {selector:'node:selected' , style: {
            'border-color': "red",
            'border-width': 2,
            'background-fill': 'radial-gradient',
            'background-gradient-stop-colors': ['cyan', 'magenta', 'yellow'],
            'background-gradient-stop-positions': ['0%', '50%', '60%']
        }},
        {selector: 'node[modelID = "_fixed_simulationDataSource"].running',
        style:{
            'border-width':3
            ,'border-color':'#cddc39'
        }}
    ]
    this.highestStyleSelectors={}
    this.highestStyleArr.forEach((oneStyle)=>{this.highestStyleSelectors[oneStyle.selector]=1})
}

topologyDOM_styleManager.prototype.updateModelTwinColor=function(modelID,colorCode,secondColorCode){
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

topologyDOM_styleManager.prototype.updateStyleSheet=function(styleArr){
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
            if(news["background-image"] && news["background-image"]=="NONE") delete news["background-image"]
            continue
        }else if(styleJson[ind].selector==".edgebendediting-hasbendpoints" ||styleJson[ind].selector==".edgecontrolediting-hascontrolpoints" || styleJson[ind].selector=="node.edgebendediting_scaleRotate" ) continue
        else if(this.highestStyleSelectors[styleJson[ind].selector]) continue
        
        arr.push(styleJson[ind])
    }
    
    arr=arr.concat(styleArr)
    arr=arr.concat(this.highestStyleArr)
    this.core.style().fromJson(arr).update()
    if(edgeBendStyle){
        allStyle=this.core.style()
        var curLen=allStyle.length;
        allStyle.length=curLen+2
        allStyle[curLen]=edgeBendStyle
        allStyle[curLen+1]=edgeControlStyle
    }

    //node scale rotate style
    this.core.style()
        .selector('node.edgebendediting_scaleRotate')
        .style({
            'width':  (ele)=> {
                var scaleF=ele.data('scaleFactor')||1
                if(!ele.data("originalWidth")){
                    ele.data("originalWidth",ele.width())
                }
                var theW=ele.data("originalWidth")
                return parseFloat(theW)*scaleF
            },
            'height':  (ele)=> {
                var scaleF=ele.data('scaleFactor')||1
                if(!ele.data("originalHeight")){
                    ele.data("originalHeight",ele.height())
                }
                var theH=ele.data("originalHeight")
                return parseFloat(theH)*scaleF
            },'shape-rotation': ( ele )=>{
                return parseFloat(ele.data("rotateAngle")||0)
            },'text-margin-x':(ele)=>{
                var modelID=ele.data("modelID")
                var lblOffset=this.calculateLblOffset(modelID,ele.data('scaleFactor')||1)
                return lblOffset[0]
            },'text-margin-y':(ele)=>{
                var modelID=ele.data("modelID")
                var lblOffset=this.calculateLblOffset(modelID,ele.data('scaleFactor')||1)
                return lblOffset[1]
            }
        }).update()
}

topologyDOM_styleManager.prototype.adjustModelsBaseDimension=function(specifyModelID){
    var fs=this.getFontSizeInCurrentZoom();
    this.baseSquareShapeSize=this.getNodeSizeInCurrentZoom();

    if(!specifyModelID){
        var arr=[
            {selector:'node',style:{ 'font-size': fs, width: this.baseSquareShapeSize, height: this.baseSquareShapeSize }}, //normal node is a circle, width=height
            {selector:'node:selected',style:{ 'border-width': Math.ceil(this.baseSquareShapeSize / 15) }},
        ]
    }else{
        arr=[]
    }
    for (var modelID in this.nodeModelVisualAdjustment) {
        if(specifyModelID!=null && modelID!=specifyModelID) continue
        var sizeAdjustRatio=this.nodeModelVisualAdjustment[modelID].dimensionRatio||1
        //if its shape is round-rectangle (actually it is polygon rectangle) and it does have a svg or image avarta, then it is possible that this type of nodes have width different from height. It will follow the width-height-ratio of the image or svg
        var theShape=this.nodeModelVisualAdjustment[modelID].shape||"ellipse"
        if(theShape=="ellipse" ||theShape=="hexagon"){
            var baseSize=this.baseSquareShapeSize
        }else baseSize=this.baseNodeSize
        var newW=Math.ceil(sizeAdjustRatio * baseSize)
        var newH=newW
        var bgRatioW=75
        var bgRatioH=75
        var visualJson=globalCache.visualDefinition["default"].detail[modelID]
        var currentShape=this.nodeModelVisualAdjustment[modelID].shape
        if(currentShape=="rectangle" && visualJson.avarta){
            var visualJson=globalCache.visualDefinition["default"].detail[modelID]
            if(visualJson.avartaHeight && visualJson.avartaHeight!=0){
                var whRatio=visualJson.avartaWidth/visualJson.avartaHeight
                if(whRatio>1) newW=newH*whRatio
                else newH=newW/whRatio
                bgRatioW=bgRatioH='100'
            }
        }else if(visualJson.avarta && visualJson.avartaHeight && visualJson.avartaHeight!=0){
            var whRatio=visualJson.avartaWidth/visualJson.avartaHeight
            if(whRatio>1) bgRatioH=bgRatioW/whRatio
            else bgRatioW = bgRatioH * whRatio
        }
        //console.log(newW,newH,modelID)
        //for any node that already has edgebendediting_scaleRotate, also modify its originalWidth and originalHeight
        this.core.nodes(`[modelID = "${modelID}"]`).forEach(ele => {
            if (ele.data("originalWidth") != null) {
                ele.data("originalWidth", newW)
                ele.data("originalHeight", newH)
            }
        })
        
        var lblOffset=this.calculateLblOffset(modelID)
        arr.push({
            selector: 'node[modelID = "' + modelID + '"]', style: {
                width: newW, height: newH, 'background-width': bgRatioW + "%", 'background-height': bgRatioH + "%"
                ,"text-margin-x":lblOffset[0],'text-margin-y':lblOffset[1] 
            }
        })
    }
    this.updateStyleSheet(arr)
}

topologyDOM_styleManager.prototype.calculateLblOffset=function(modelID,scaleF){
    var visualJson=globalCache.visualDefinition["default"].detail[modelID]
    if(!visualJson) return [0,0]
    var xoff=visualJson.labelX||0
    var yoff=visualJson.labelY||0
    var dimensionRatio= visualJson.dimensionRatio||1 
    var theShape = visualJson.shape || "ellipse"
    if (theShape == "ellipse" || theShape == "hexagon") {
        var baseSize = this.baseSquareShapeSize
    } else baseSize = this.baseNodeSize
    var baseNodeAdjustR= baseSize/30
    var scaleF=scaleF||1
    return [xoff*dimensionRatio*baseNodeAdjustR*scaleF,yoff*dimensionRatio*baseNodeAdjustR*scaleF ] 
}

topologyDOM_styleManager.prototype.updateModelAvarta=function(modelID,dataUrl){
    if(!this.nodeModelVisualAdjustment[modelID])this.nodeModelVisualAdjustment[modelID]={}
    this.nodeModelVisualAdjustment[modelID].avarta=dataUrl

    try{
        if(dataUrl==null) dataUrl="NONE"
        this.updateStyleSheet([{selector:'node[modelID = "'+modelID+'"]',style:{'background-image': dataUrl}} ])
    }catch(e){
        
    }
}

topologyDOM_styleManager.prototype.updateModelTwinShape=function(modelID,shape){
    var newStyle
    if(!this.nodeModelVisualAdjustment[modelID])this.nodeModelVisualAdjustment[modelID]={}
    this.nodeModelVisualAdjustment[modelID].shape=shape
    if(shape=="hexagon"){
        var polygon=[0,-1,0.866,-0.5,0.866,0.5,0,1,-0.866,0.5,-0.866,-0.5]
        newStyle={selector:'node[modelID = "'+modelID+'"]',style:{'shape': 'polygon','shape-polygon-points':polygon}}
    }else if(shape=="rectangle"){
        newStyle={selector:'node[modelID = "'+modelID+'"]',style:{'shape': 'rectangle'}}
    }else{
        newStyle={selector:'node[modelID = "'+modelID+'"]',style:{'shape': shape}}
    }
    this.updateStyleSheet([newStyle])
}

topologyDOM_styleManager.prototype.updateModelTwinDimension=function(modelID,dimensionRatio){
    if(!this.nodeModelVisualAdjustment[modelID])this.nodeModelVisualAdjustment[modelID]={}
    this.nodeModelVisualAdjustment[modelID].dimensionRatio=parseFloat(dimensionRatio)
    this.adjustModelsBaseDimension(modelID)
}

topologyDOM_styleManager.prototype.updateModelTwinLabelOffset = function (modelID) {
    this.adjustModelsBaseDimension(modelID)
}

topologyDOM_styleManager.prototype.updateRelationshipColor=function(srcModelID,relationshipName,colorCode){
    this.updateStyleSheet([
        {selector:'edge[sourceModel = "'+srcModelID+'"][relationshipName = "'+relationshipName+'"]', style:{'line-color': colorCode}}
    ])
}

topologyDOM_styleManager.prototype.updateRelationshipShape=function(srcModelID,relationshipName,shape){
    var newStyle
    if(shape=="solid"){
        newStyle={selector:'edge[sourceModel = "'+srcModelID+'"][relationshipName = "'+relationshipName+'"]', style:{'line-style': shape}}
    }else if(shape=="dotted"){
        newStyle={selector:'edge[sourceModel = "'+srcModelID+'"][relationshipName = "'+relationshipName+'"]', style:{'line-style': 'dashed','line-dash-pattern':[8,8]}}
    }
    this.updateStyleSheet([newStyle])    
}
topologyDOM_styleManager.prototype.updateRelationshipWidth=function(srcModelID,relationshipName,edgeWidth){
    var arr=[
        {selector:'edge[sourceModel = "'+srcModelID+'"][relationshipName = "'+relationshipName+'"]',style:{'width':parseFloat(edgeWidth)}},
        {selector:'edge.hover[sourceModel = "'+srcModelID+'"][relationshipName = "'+relationshipName+'"]',style:{'width':parseFloat(edgeWidth)+10}},
    ]
    this.updateStyleSheet(arr)
}

topologyDOM_styleManager.prototype.getFontSizeInCurrentZoom=function(){
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

topologyDOM_styleManager.prototype.getNodeSizeInCurrentZoom=function(){
    var curZoom=this.core.zoom()
    //console.log(curZoom)
    //bigger zoom means zoom in more to the detail
    if(curZoom>1){//scale up but not too much
        var ratio= (curZoom-1)*(2-1)/4+1
        return Math.ceil(this.defaultNodeSize/ratio)
    }else{
        var ratio= (1/curZoom-1)*(2-1)/4+1
        return Math.ceil(this.defaultNodeSize*ratio)
    }
}

topologyDOM_styleManager.prototype.dataSourceSVG=function(){
    var svgStr= '<svg enable-background="0 0 512 512" height="512" viewBox="0 0 512 512" width="512" xmlns="http://www.w3.org/2000/svg"><path d="m282.931 468c-23.131 0-41.5-15.897-44.804-38.897l-48.772-341.226c-.179-1.248-.557-3.875-4.485-3.877-.002 0-.005 0-.007 0-3.923 0-4.303 2.624-4.486 3.885l-34.736 243.531c-3.158 21.743-20.653 37.57-42.551 38.539-21.901.967-40.722-13.252-45.776-34.581-.019-.077-.036-.153-.053-.23l-11.214-49.947c-3.047-12.662-14.228-22.197-26.047-22.197-11.046 0-20-8.954-20-20s8.954-20 20-20c30.372 0 57.705 22.321 64.993 53.074.019.077.036.153.053.23l11.216 49.955c.282 1.172 1.064 3.904 5.06 3.734 4.133-.183 4.564-3.157 4.727-4.277l34.736-243.531c3.27-22.508 21.391-38.185 44.078-38.185h.039c22.707.018 40.82 15.728 44.049 38.204l48.771 341.225c.181 1.259.708 4.666 5.369 4.57 4.702-.071 5.086-3.465 5.231-4.743l6.803-60.491c1.234-10.977 11.134-18.877 22.11-17.639 10.977 1.234 18.874 11.133 17.639 22.11l-6.805 60.504c-2.642 23.354-20.89 39.902-44.377 40.255-.254.003-.508.005-.761.005zm169.253-147.633c.02-.079.039-.158.058-.237l7.062-29.967c3.901-15.493 17.939-27.163 32.696-27.163 11.046 0 20-8.954 20-20s-8.954-20-20-20c-33.154 0-63.242 24.231-71.542 57.617-.02.079-.039.159-.058.238l-7.063 29.974c-.238.942-.662 2.253-3.008 2.167-2.445-.096-2.687-1.549-2.839-2.458l-15.696-95.746c-3.408-20.444-20.25-34.354-40.978-33.799-20.719.544-36.817 15.308-39.147 35.903l-8.469 74.855c-1.242 10.976 6.649 20.88 17.625 22.122 10.979 1.243 20.88-6.649 22.122-17.625l8.469-74.855c.018-.152.038-.274.058-.369.237-.053.552-.062.79-.021.022.083.046.187.067.312l15.696 95.746c3.388 20.331 20.139 35.095 40.734 35.904.591.023 1.178.035 1.764.035 19.843 0 36.829-13.204 41.659-32.633z"/></svg>'
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svgStr)
}

module.exports = topologyDOM_styleManager;