const modelAnalyzer=require("./modelAnalyzer")
const simpleTree= require("./simpleTree")
const simpleConfirmDialog = require("./simpleConfirmDialog")
const modelEditorDialog = require("./modelEditorDialog")
const globalCache = require("./globalCache")
const msalHelper=require("../msalHelper")
const simpleExpandableSection= require("../sharedSourceFiles/simpleExpandableSection")
const simpleSelectMenu=require("../sharedSourceFiles/simpleSelectMenu")
function modelManagerDialog() {
    if(!this.DOM){
        this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:99" class="w3-card-2"></div>')
        this.DOM.css("overflow","hidden")
        $("body").append(this.DOM)
        this.DOM.hide()
        globalCache.makeDOMDraggable(this.DOM)
    }
    this.showRelationVisualizationSettings=true;
}

modelManagerDialog.prototype.popup = async function() {
    this.DOM.show()
    this.DOM.empty()
    this.contentDOM = $('<div style="width:700px"></div>')
    this.DOM.append(this.contentDOM)
    this.contentDOM.append($('<div style="height:40px" class="w3-bar w3-red"><div class="w3-bar-item" style="font-size:1.5em">Digital Twin Models</div></div>'))
    var closeButton = $('<button class="w3-bar-item w3-button w3-right" style="font-size:2em;padding-top:4px">×</button>')
    this.contentDOM.children(':first').append(closeButton)
    closeButton.on("click", () => { this.DOM.hide() })

    var importModelsBtn = $('<button class="w3-button w3-card w3-deep-orange w3-hover-light-green" style="height:100%">Import</button>')
    var actualImportModelsBtn =$('<input type="file" name="modelFiles" multiple="multiple" style="display:none"></input>')
    var modelEditorBtn = $('<button class="w3-button w3-card w3-deep-orange w3-hover-light-green" style="height:100%">Create/Modify Model</button>')
    var exportModelBtn = $('<button class="w3-ripple w3-button w3-card w3-deep-orange w3-hover-light-green" style="height:100%">Export All Models</button>')
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
    var panelCard=$('<div style="width:460px;height:412px;overflow:auto;margin-top:2px"></div>')
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

    var delBtn = $('<button style="margin-bottom:2px" class="w3-ripple w3-button w3-light-gray w3-hover-pink w3-border-right">Delete Model</button>')
    this.modelButtonBar.append(delBtn)


    var importPicBtn = $('<button class="w3-button w3-light-gray w3-hover-amber w3-border-right">Upload Avarta</button>')
    var actualImportPicBtn = $('<input type="file" name="img" style="display:none"></input>')
    var chooseAvartaBtn = $('<button class="w3-ripple w3-button w3-light-gray w3-hover-pink w3-border-right">Choose A Symbol</button>')
    
    var clearAvartaBtn = $('<button class="w3-ripple w3-button w3-light-gray w3-hover-pink w3-border-right">Clear Avarta</button>')
    this.modelButtonBar.append(importPicBtn, actualImportPicBtn,chooseAvartaBtn, clearAvartaBtn)
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
            var dataUrl = await this.resizeImgFile(theFile, 256)
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
        this.updateAvartaDataUrl(dataUrl,modelID)
        actualImportPicBtn.val("")
    })

    chooseAvartaBtn.on("click",()=>{this.chooseAvarta(modelID)})

    clearAvartaBtn.on("click", () => {
        this.updateAvartaDataUrl(null,modelID)
    });

    
    delBtn.on("click",()=>{
        var relatedModelIDs =modelAnalyzer.listModelsForDeleteModel(modelID)
        var dialogStr=(relatedModelIDs.length==0)? ("This will DELETE model \"" + modelID + "\"."): 
            (modelID + " is base model of "+relatedModelIDs.join(", ")+".")
        var confirmDialogDiv = new simpleConfirmDialog()

        //check how many twins are under this model ID
        var numberOfTwins=0
        var checkTwinsModelArr=[modelID].concat(relatedModelIDs)
        for(var oneTwinID in globalCache.DBTwins){
            var oneDBTwin = globalCache.DBTwins[oneTwinID]
            var theIndex=checkTwinsModelArr.indexOf(oneDBTwin["modelID"])
            if(theIndex!=-1) numberOfTwins++
        }

        dialogStr+=" (There will be "+((numberOfTwins>1)?(numberOfTwins+" twins"):(numberOfTwins+" twin") ) + " being impacted)"
        confirmDialogDiv.show(
            { width: "350px" },
            {
                title: "Warning"
                , content: dialogStr
                , buttons: [
                    {
                        colorClass: "w3-red w3-hover-pink", text: "Confirm", "clickFunc": async () => {
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
    
    var VisualizationDOM=this.addAPartInRightSpan("Visualization",{"marginTop":0}) 
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

modelManagerDialog.prototype.updateAvartaDataUrl = function (dataUrl,modelID) {
    if (!dataUrl){
        var visualJson = globalCache.visualDefinition["default"].detail
        if (visualJson[modelID]){
            delete visualJson[modelID].avarta
            delete visualJson[modelID].avartaWidth
            delete visualJson[modelID].avartaHeight
        } 
        if (this.avartaImg) this.avartaImg.removeAttr('src');
        this.saveVisualDefinition()
        this.broadcastMessage({ "message": "visualDefinitionChange", "modelID": modelID, "noAvarta": true })
        this.refreshModelTreeLabel()
        return;
    } 
    
    //if it is svg, check if the svg set its width and height attribute, as cytoscape js can not handle svg scaling withouth width and heigh attribute
    var dec= decodeURIComponent(dataUrl)
    if(dec.startsWith("data:image/svg+xml")){
        var pos=dec.indexOf("<svg ")
        var svgPart=dec.substr(pos)
        var tmpObj=$(svgPart)
        if(tmpObj.attr('width')==null){
            var ss=tmpObj.attr('viewBox')
            if(ss){
                var arr=ss.split(" ")
                tmpObj.attr("width",arr[2]-arr[0])
                tmpObj.attr("height",arr[3]-arr[1])
                dataUrl=`data:image/svg+xml;utf8,${encodeURIComponent(tmpObj[0].outerHTML)}`
            }
        }
    }

    if (this.avartaImg) this.avartaImg.attr("src", dataUrl)

    var visualJson = globalCache.visualDefinition["default"].detail //currently there is only one visual definition: "default"
    if (!visualJson[modelID]) visualJson[modelID] = {}
    visualJson[modelID].avarta = dataUrl
    
    var testImg = $(`<img src="${dataUrl}"/>`)
    testImg.on('load', ()=>{
        testImg.css({"display":"none"}) //to get the image size, append it to body temporarily
        $('body').append(testImg)
        visualJson[modelID].avartaWidth=testImg.width()
        visualJson[modelID].avartaHeight=testImg.height()
        testImg.remove()
        this.saveVisualDefinition()
        this.broadcastMessage({ "message": "visualDefinitionChange", "modelID": modelID, "avarta": dataUrl })
        this.refreshModelTreeLabel()
    });
}

modelManagerDialog.prototype.chooseAvarta=function(modelID){
    var popWindow=new simpleConfirmDialog()
    popWindow.show({"max-width":"450px","min-width":"300px"},{
        "title": "Choose Symbol as Avarta (best with rectangle shape )",
        "customDrawing": (parentDOM) => {
            var row1=$('<div class="w3-bar" style="padding:2px"></div>')
            parentDOM.append(row1)
            var lable = $('<div class="w3-bar-item w3-opacity" style="padding-right:5px;">Icon Set </div>')
            row1.append(lable)
            var iconSetSelector = new simpleSelectMenu(" ", { withBorder: 1, colorClass: "w3-light-gray", buttonCSS: { "padding": "5px 10px" } })
            row1.append(iconSetSelector.DOM)
            this.iconsHolderDiv=$("<div/>")
            parentDOM.append(this.iconsHolderDiv)
            iconSetSelector.callBack_clickOption = (optionText, optionValue) => {
                iconSetSelector.changeName(optionText)
                this.iconsHolderDiv.empty()
                var symbolList=globalCache.symbolLibs[optionText]
                for(var symbolName in symbolList){
                    this.createSymbolDOM(optionText,symbolName,modelID,this.iconsHolderDiv,popWindow)
                }
            }
            for (var ind in globalCache.symbolLibs) iconSetSelector.addOption(ind)
            iconSetSelector.triggerOptionIndex(0)
        }
    })
}

modelManagerDialog.prototype.createSymbolDOM=function(libName,symbolName,modelID,parentDOM,popWindow){
    var symbolSize=80
    var symbolList=globalCache.symbolLibs[libName]
    var aSymbolDOM=$("<div class='w3-button w3-white' style='padding:0px;width:"+symbolSize+"px;height:"+symbolSize+"px;float:left'></div>")
    var svgStr=symbolList[symbolName].replaceAll("'",'"')
    var dataUrl=`data:image/svg+xml;utf8,${encodeURIComponent(svgStr)}`
    var svgImg=$(`<img style='max-width:${symbolSize}px;max-height:${symbolSize}px' src='${dataUrl}'></img>`)
    aSymbolDOM.append(svgImg)
    parentDOM.append(aSymbolDOM)
    aSymbolDOM.on("click",()=>{
        popWindow.close()
        this.updateAvartaDataUrl(dataUrl,modelID)
    })
}

modelManagerDialog.prototype.confirmDeleteModel=function(modelID){
    var funcAfterEachSuccessDelete = (eachDeletedModelID) => {
        this.tree.deleteLeafNode(globalCache.modelIDMapToName[eachDeletedModelID])
        //TODO: clear the visualization setting of this deleted model, but if it is replace, should not, so I comment out first
        /*
        if (globalCache.visualDefinition["default"].detail[modelID]) {
            delete globalCache.visualDefinition["default"].detail[modelID]
            this.saveVisualDefinition()
        }*/
    }
    var completeFunc=()=>{ 
        this.broadcastMessage({ "message": "ADTModelsChange"})
        this.panelCard.empty()
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
    aTable.html('<tr><td></td><td align="center"></td></tr>')
    parentDom.append(aTable) 

    var leftPart=aTable.find("td:first")
    var rightPart=aTable.find("td:nth-child(2)")
    var outerDIV=$("<div class='w3-border' style='width:55px;height:55px;padding:5px'></div>")
    var avartaImg=$("<img style='height:45px'></img>")
    rightPart.append(outerDIV)
    outerDIV.append(avartaImg)
    var visualJson=globalCache.visualDefinition["default"].detail
    if(visualJson && visualJson[modelID] && visualJson[modelID].avarta) avartaImg.attr('src',visualJson[modelID].avarta)
    this.avartaImg=avartaImg;
    this.addOneVisualizationRow(modelID,leftPart)

    if(this.showRelationVisualizationSettings){
        for(var ind in modelJson.validRelationships){
            this.addOneVisualizationRow(modelID,leftPart,ind)
        }
    }
    this.addLabelVisualizationRow(modelID,leftPart)
}

modelManagerDialog.prototype.addLabelVisualizationRow=function(modelID,parentDom){
    var containerDiv=$("<div style='padding-bottom:8px'></div>")
    parentDom.append(containerDiv)
    var contentDOM=$("<label class='w3-text-gray' style='margin-right:10px;font-style:italic; font-weight:bold;font-size:0.9em'>Position Label</label>")
    containerDiv.append(contentDOM)
    var definedLblX=0
    var definedLblY=0
    var visualJson=globalCache.visualDefinition["default"].detail
    if(visualJson[modelID] && visualJson[modelID].labelX) definedLblX=visualJson[modelID].labelX
    if(visualJson[modelID] && visualJson[modelID].labelY) definedLblY=visualJson[modelID].labelY
    var lblXAdjustSelector = $('<select class="w3-border" style="outline:none;width:110px"></select>')
    for(var f=-25;f<=30;f+=5){
        var val=f.toFixed(0)+""
        lblXAdjustSelector.append($("<option value="+val+">xoff:"+val+"</option>"))
    }
    if(definedLblX!=null) lblXAdjustSelector.val(definedLblX)
    else lblXAdjustSelector.val("0")
    containerDiv.append(lblXAdjustSelector)
    var lblYAdjustSelector = $('<select class="w3-border" style="outline:none;width:110px"></select>')
    for(var f=0;f<30;f+=5){
        var val=f.toFixed(0)+""
        lblYAdjustSelector.append($("<option value="+val+">yoff:"+val+"</option>"))
    }
    for(var f=30;f<=90;f+=10){
        var val=f.toFixed(0)+""
        lblYAdjustSelector.append($("<option value="+val+">yoff:"+val+"</option>"))
    }
    if(definedLblY!=null) lblYAdjustSelector.val(definedLblY)
    else lblYAdjustSelector.val("0")
    containerDiv.append(lblYAdjustSelector)

    lblXAdjustSelector.change((eve)=>{
        var chooseVal=eve.target.value
        this.modifyLblOffset("labelX",chooseVal,modelID)
    })
    lblYAdjustSelector.change((eve)=>{
        var chooseVal=eve.target.value
        this.modifyLblOffset("labelY",chooseVal,modelID)
    })
}

modelManagerDialog.prototype.modifyLblOffset = function (XY, val,modelID) {
    var visualJson = globalCache.visualDefinition["default"].detail
    if (!visualJson[modelID]) visualJson[modelID] = {}
    visualJson[modelID][XY] = val
    this.broadcastMessage({ "message": "visualDefinitionChange", "modelID": modelID, "labelPosition":true })
    this.saveVisualDefinition()
}

modelManagerDialog.prototype.addOneVisualizationRow=function(modelID,parentDom,relatinshipName){
    if(relatinshipName==null) var nameStr="◯" //visual for node
    else nameStr="⟜ "+relatinshipName
    var containerDiv=$("<div style='padding-bottom:8px'></div>")
    parentDom.append(containerDiv)
    var contentDOM=$("<label class='w3-text-gray' style='margin-right:10px;font-weight:bold;font-size:0.9em'>"+nameStr+"</label>")
    containerDiv.append(contentDOM)

    var definedColor=null
    var definedColor2=null
    var definedShape=null
    var definedDimensionRatio=null
    var definedEdgeWidth=null
    var visualJson=globalCache.visualDefinition["default"].detail
    if(relatinshipName==null){
        if(visualJson[modelID] && visualJson[modelID].color) definedColor=visualJson[modelID].color
        if(visualJson[modelID] && visualJson[modelID].secondColor) definedColor2=visualJson[modelID].secondColor
        if(visualJson[modelID] && visualJson[modelID].shape) definedShape=visualJson[modelID].shape
        if(visualJson[modelID] && visualJson[modelID].dimensionRatio) definedDimensionRatio=visualJson[modelID].dimensionRatio
    }else{
        if (visualJson[modelID] && visualJson[modelID]["rels"] && visualJson[modelID]["rels"][relatinshipName]) {
            if (visualJson[modelID]["rels"][relatinshipName].color) definedColor = visualJson[modelID]["rels"][relatinshipName].color
            if (visualJson[modelID]["rels"][relatinshipName].shape) definedShape = visualJson[modelID]["rels"][relatinshipName].shape
            if(visualJson[modelID]["rels"][relatinshipName].edgeWidth) definedEdgeWidth=visualJson[modelID]["rels"][relatinshipName].edgeWidth
        }
    }

    var createAColorSelector=(predefinedColor,nameOfColorField)=>{
        var colorSelector=$('<select class="w3-border" style="outline:none;width:75px"></select>')
        containerDiv.append(colorSelector)

        var colorArr=["darkGray","Black","LightGray","Red","Green","Blue","Bisque","Brown","Coral","Crimson","DodgerBlue","Gold"]
        colorArr.forEach((oneColorCode)=>{
            var anOption=$("<option value='"+oneColorCode+"'>"+oneColorCode+"▧</option>")
            colorSelector.append(anOption)
            anOption.css("color",oneColorCode)
        })

        if(relatinshipName==null){
            var anOption=$("<option value='none'>none</option>")
            anOption.css("color","darkGray")
            colorSelector.append(anOption)
        }

        if(nameOfColorField=="secondColor"){
            if(predefinedColor==null) predefinedColor="none"
        }else{
            if(predefinedColor==null) predefinedColor="darkGray"
        }

        colorSelector.val(predefinedColor)
        if(predefinedColor!="none") {
            colorSelector.css("color",predefinedColor)
        }else{
            colorSelector.css("color","darkGray")
        }
        
        colorSelector.change((eve)=>{
            var selectColorCode=eve.target.value
            if(selectColorCode=="none") colorSelector.css("color","darkGray")
            else colorSelector.css("color",selectColorCode)
            var visualJson=globalCache.visualDefinition["default"].detail
    
            if(!visualJson[modelID]) visualJson[modelID]={}
            if(!relatinshipName) {
                if(selectColorCode=="none" && nameOfColorField=="secondColor") delete visualJson[modelID]["secondColor"]
                else visualJson[modelID][nameOfColorField]=selectColorCode
                this.broadcastMessage({ "message": "visualDefinitionChange", "modelID":modelID
                    ,"color":visualJson[modelID]["color"],"secondColor":visualJson[modelID]["secondColor"] })
                this.refreshModelTreeLabel()
            }else{
                if(!visualJson[modelID]["rels"]) visualJson[modelID]["rels"]={}
                if(!visualJson[modelID]["rels"][relatinshipName]) visualJson[modelID]["rels"][relatinshipName]={}
                visualJson[modelID]["rels"][relatinshipName].color=selectColorCode
                this.broadcastMessage({ "message": "visualDefinitionChange", "srcModelID":modelID,"relationshipName":relatinshipName,"color":selectColorCode })
            }
            this.saveVisualDefinition()
        })
    }

    createAColorSelector(definedColor,"color")
    if(relatinshipName==null) createAColorSelector(definedColor2,"secondColor")


    var shapeSelector = $('<select class="w3-border" style="outline:none"></select>')
    containerDiv.append(shapeSelector)
    if(relatinshipName==null){
        shapeSelector.append($("<option value='ellipse'>◯</option>"))
        shapeSelector.append($("<option value='rectangle' style='font-size:120%'>▢</option>"))
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
        var visualJson = globalCache.visualDefinition["default"].detail

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
        for(var f=0.2;f<=2;f+=0.4){
            var val=f.toFixed(1)+""
            sizeAdjustSelector.append($("<option value="+val+">dimension*"+val+"</option>"))
        }
        for(var f=2;f<=10;f+=1){
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
        for(var f=5;f<=10;f+=1){ 
            var val=f.toFixed(1)+""
            sizeAdjustSelector.append($("<option value="+val+">width *"+val+"</option>"))
        }
        if(definedEdgeWidth!=null) sizeAdjustSelector.val(definedEdgeWidth)
        else sizeAdjustSelector.val("2.0")
    }
    containerDiv.append(sizeAdjustSelector)

    
    sizeAdjustSelector.change((eve)=>{
        var chooseVal=eve.target.value
        var visualJson = globalCache.visualDefinition["default"].detail

        if(!relatinshipName) {
            if(!visualJson[modelID]) visualJson[modelID]={}
            visualJson[modelID].dimensionRatio=chooseVal
            this.broadcastMessage({ "message": "visualDefinitionChange", "modelID":modelID,"dimensionRatio":chooseVal })
            this.refreshModelTreeLabel()
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
        await msalHelper.callAPI("digitaltwin/saveVisualDefinition", "POST", {"visualDefinitionJson":JSON.stringify(globalCache.visualDefinition["default"].detail)},"withProjectID")
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


modelManagerDialog.prototype.addAPartInRightSpan=function(partName,options){
    options=options||{}
    var section= new simpleExpandableSection(partName,this.panelCard,options)
    section.expand()
    return section.listDOM;
}

modelManagerDialog.prototype.readModelFilesContentAndImport=async function(files){
    // files is a FileList of File objects. List some properties.
    var fileContentArr=[]
    for (var i = 0;i< files.length; i++) {
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
    try {
        await msalHelper.callAPI("digitaltwin/importModels", "POST", {"models":JSON.stringify(fileContentArr)},"withProjectID")
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
    this.panelCard.empty()
    try{
        var res=await msalHelper.callAPI("digitaltwin/fetchProjectModelsData","POST",null,"withProjectID")
        globalCache.storeProjectModelsData(res.DBModels,res.adtModels)
        modelAnalyzer.clearAllModels();
        modelAnalyzer.addModels(res.adtModels)
        modelAnalyzer.analyze();
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
        return
    }

    if($.isEmptyObject(modelAnalyzer.DTDLModels)){
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
            var dbModelInfo=globalCache.getSingleDBModelByID(modelClass)
            
            var colorCode = "darkGray"
            var shape = "ellipse"
            var avarta = null
            var dimension=20;
            if (globalCache.visualDefinition["default"].detail[modelClass]) {
                var visualJson = globalCache.visualDefinition["default"].detail[modelClass]
                var colorCode = visualJson.color || "darkGray"
                var secondColor = visualJson.secondColor
                var shape = visualJson.shape || "ellipse"
                var avarta = visualJson.avarta
                if(visualJson.dimensionRatio) dimension*=parseFloat(visualJson.dimensionRatio)
                if(dimension>60) dimension=60
            }

            var iconDOMDimension=Math.max(dimension,20) //other wise it is too small to be in vertical middle of parent div
            var iconDOM=$("<div style='width:"+iconDOMDimension+"px;height:"+iconDOMDimension+"px;float:left;position:relative'></div>")
            if(dbModelInfo.isIoTDeviceModel){
                var iotDiv=$("<div class='w3-border' style='position:absolute;right:-5px;padding:0px 2px;top:-9px;border-radius: 3px;font-size:7px'>IoT</div>")
                iconDOM.append(iotDiv)
            }


            var imgSrc=encodeURIComponent(globalCache.shapeSvg(shape,colorCode,secondColor))
            var shapeImg=$("<img src='data:image/svg+xml;utf8,"+imgSrc+"'></img>")
            shapeImg.css({"width":dimension+"px","height":dimension+"px"})
            if(dimension<iconDOMDimension){
                shapeImg.css({"position":"absolute","top":(iconDOMDimension-dimension)/2+"px","left":(iconDOMDimension-dimension)/2+"px"})
            }
            iconDOM.append(shapeImg)
            if(avarta){
                var avartaimg=$(`<img style='max-width:${dimension*0.75}px;max-height:${dimension*0.75}px;position:absolute;left:50%;top:50%;transform:translateX(-50%) translateY(-50%)' src='${avarta}'></img>`)
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

modelManagerDialog.prototype.modelNameToGroupName=function(modelName){
    var nameParts=modelName.split(":")
    if(nameParts.length>=2)  return nameParts[1]
    else return "Others"
}

modelManagerDialog.prototype.rxMessage=function(msgPayload){
    if(msgPayload.message=="ADTModelEdited") this.listModels("shouldBroadcast")
}


module.exports = new modelManagerDialog();