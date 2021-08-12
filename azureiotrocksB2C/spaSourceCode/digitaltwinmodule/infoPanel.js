const modelAnalyzer = require("../sharedSourceFiles/modelAnalyzer");
const simpleConfirmDialog = require("../sharedSourceFiles/simpleConfirmDialog")
const globalCache = require("../sharedSourceFiles/globalCache")
const msalHelper = require("../msalHelper")
const baseInfoPanel = require("../sharedSourceFiles/baseInfoPanel")
const simpleExpandableSection= require("../sharedSourceFiles/simpleExpandableSection")
const simpleSelectMenu= require("../sharedSourceFiles/simpleSelectMenu")
const scriptTestDialog = require("../sharedSourceFiles/scriptTestDialog")

class infoPanel extends baseInfoPanel {
    constructor() {
        super()
        this.openLiveCalculationSection=true
        this.openPropertiesSection=true
        this.continerDOM = $('<div class="w3-card" style="position:absolute;z-index:90;right:0px;top:50%;height:70%;width:350px;transform: translateY(-50%);"></div>')
        this.continerDOM.hide()
        this.continerDOM.append($('<div style="height:50px" class="w3-bar w3-red"></div>'))

        this.closeButton1 = $('<button style="height:100%" class="w3-bar-item w3-button"><i class="fa fa-info-circle fa-2x" style="padding:2px"></i></button>')
        this.closeButton2 = $('<button class="w3-bar-item w3-button w3-right" style="font-size:2em">×</button>')
        this.continerDOM.children(':first').append(this.closeButton1, this.closeButton2)

        this.isMinimized = false;
        var buttonAnim = () => {
            if (!this.isMinimized) this.minimizeWindow()
            else this.expandWindow()
        }
        this.closeButton1.on("click", buttonAnim)
        this.closeButton2.on("click", buttonAnim)

        this.DOM = $('<div class="w3-container" style="padding:0px;postion:absolute;top:50px;height:calc(100% - 50px);overflow:hidden"></div>')
        this.continerDOM.css("background-color", "rgba(255, 255, 255, 0.8)")
        this.continerDOM.hover(() => {
            this.continerDOM.css("background-color", "rgba(255, 255, 255, 1)")
        }, () => {
            this.continerDOM.css("background-color", "rgba(255, 255, 255, 0.8)")
        });
        this.continerDOM.append(this.DOM)
        $('body').append(this.continerDOM)

        this.emptyContentAndDrawTabControl()
        this.drawButtons(null)
        this.selectedObjects = null;
    }

    minimizeWindow() {
        this.continerDOM.animate({
            right: "-250px",
            height: "50px"
        })
        this.isMinimized = true;
    }

    expandWindow() {
        this.continerDOM.animate({
            right: "0px",
            height: "70%"
        })
        this.isMinimized = false;
    }

    rxMessage(msgPayload) {
        if (msgPayload.message == "startSelectionDialog_closed") {
            if (!this.continerDOM.is(":visible")) {
                this.continerDOM.show()
                this.continerDOM.addClass("w3-animate-right")
            }
        } else if (msgPayload.message == "mapFlyingStart") {
            this.minimizeWindow()
        } else if (msgPayload.message == "mapFlyingEnd") {
            this.expandWindow()
        } else if (msgPayload.message == "mapSelectFeature") {
            if (msgPayload.DBTwin != null) {
                var twinID = msgPayload.DBTwin.id
                var adtTwin = globalCache.storedTwins[twinID]
                this.showInfoOfNodes([adtTwin])
            }
        } else if (msgPayload.message == "showInfoSelectedNodes" || msgPayload.message == "showInfoHoveredEle") {
            if (globalCache.showFloatInfoPanel && msgPayload.message == "showInfoHoveredEle") return; //the floating info window will show mouse over element information, do not change info panel content in this case
            this.showInfoOfNodes(msgPayload.info)
        }
    }

    showInfoOfNodes(arr) {
        this.emptyContentAndDrawTabControl()
        if (arr == null || arr.length == 0) {
            this.drawButtons(null)
            this.selectedObjects = [];
            return;
        }
        this.selectedObjects = arr;
        if (arr.length == 1) {
            var singleElementInfo = arr[0];

            singleElementInfo=this.fetchRealElementInfo(singleElementInfo)
            if (singleElementInfo["$dtId"]) {// select a node
                this.drawButtons("singleNode")
            }else if (singleElementInfo["$sourceId"]) {
                this.drawButtons("singleRelationship")
            }

            var propertiesSection= new simpleExpandableSection("Properties Section",this.infoContentDiv,{"marginTop":"2px"})
            propertiesSection.callBack_change=(status)=>{this.openPropertiesSection=status}
            if(this.openPropertiesSection) propertiesSection.expand()

            if (singleElementInfo["$dtId"]) {// select a node
                var singleDBTwinInfo=globalCache.DBTwins[singleElementInfo["$dtId"]]
                this.drawSingleNodeProperties(singleDBTwinInfo,singleElementInfo,propertiesSection.listDOM)
            } else if (singleElementInfo["$sourceId"]) {
                this.drawSingleRelationProperties(singleElementInfo,propertiesSection.listDOM)
            }

            if (singleElementInfo["$dtId"]) this.drawFormulaSection(singleElementInfo["$dtId"],singleElementInfo["$metadata"]["$model"])
        } else if (arr.length > 1) {
            this.drawButtons("multiple")
            this.drawMultipleObj()
        }
    }

    emptyContentAndDrawTabControl(){
        if(this.infoContentDiv) this.infoContentDiv.empty()
        else{
            this.DOM.empty()
            var tabControl=$('<div class="w3-bar w3-light-gray "></div>')
            var infoBtn=$('<button class="w3-bar-item w3-button" style="font-weight:bold;">Information</button>')
            var liveBtn=$('<button class="w3-bar-item w3-button" style="font-weight:bold;">Live</button>')
            tabControl.append(infoBtn,liveBtn)
            this.DOM.append(tabControl)

            this.infoContentDiv=$('<div class="w3-animate-opacity" style="padding-top:5px;display:none;height:calc(100% - 36px);overflow:auto"></div>')
            this.liveContentDiv=$('<div id="myChart" class="w3-animate-opacity" style="padding-top:5px;display:none;height:calc(100% - 36px);overflow:auto"></div>')
            this.DOM.append(this.infoContentDiv,this.liveContentDiv)
            
            infoBtn.on("click",()=>{
                infoBtn.addClass("w3-white w3-text-orange")
                liveBtn.removeClass("w3-white w3-text-orange")
                this.liveContentDiv.hide()
                this.infoContentDiv.show()
            })
        
            liveBtn.on("click",()=>{
                infoBtn.removeClass("w3-white w3-text-orange")
                liveBtn.addClass("w3-white w3-text-orange")
                this.liveContentDiv.show()
                this.infoContentDiv.hide()
            })
        
            infoBtn.trigger("click")
        }
    }

    drawButtons(selectType) {
        if(selectType==null){
            var div=$("<div style='padding:8px'><a style='display:block;font-style:italic;color:gray'>Choose twins or relationships to view infomration</a><a style='display:block;font-style:italic;color:gray;padding-top:20px'>Press shift key to draw box and select multiple twins in topology view</a><a style='display:block;font-style:italic;color:gray;padding-top:20px'>Press ctrl+z and ctrl+y to undo/redo in topology view; ctrl+s to save layout</a><a style='display:block;font-style:italic;color:gray;padding-top:20px;padding-bottom:20px'>Press shift or ctrl key to select multiple twins in tree view</a><a style='display:block;font-style:italic;color:gray;padding-top:12px;padding-bottom:5px'>Import twins data by clicking button below</a></div>")
            this.infoContentDiv.append(div)
        }

        var buttonHolderDOM=this.infoContentDiv

        var impBtn = $('<button class="w3-bar-item w3-button w3-blue"><i class="fas fa-cloud-upload-alt"></i></button>')
        var actualImportTwinsBtn = $('<input type="file" name="modelFiles" multiple="multiple" style="display:none"></input>')
        if (selectType != null) {
            var refreshBtn = $('<button class="w3-ripple w3-bar-item w3-button w3-black"><i class="fas fa-sync-alt"></i></button>')
            var expBtn = $('<button class="w3-ripple w3-bar-item w3-button w3-green"><i class="fas fa-cloud-download-alt"></i></button>')
            buttonHolderDOM.append(refreshBtn, expBtn, impBtn, actualImportTwinsBtn)
            refreshBtn.on("click", () => { this.refreshInfomation() })
            expBtn.on("click", () => {
                //find out the twins in selection and their connections (filter both src and target within the selected twins)
                //and export them
                this.exportSelected()
            })
        } else {
            buttonHolderDOM.append(impBtn, actualImportTwinsBtn)
        }

        impBtn.on("click", () => { actualImportTwinsBtn.trigger('click'); })
        actualImportTwinsBtn.change(async (evt) => {
            var files = evt.target.files; // FileList object
            await this.readTwinsFilesContentAndImport(files)
            actualImportTwinsBtn.val("")
        })
        if (selectType == null) return;

        var numOfNode = 0;
        var arr = this.selectedObjects;
        arr.forEach(element => {
            if (element['$dtId']) numOfNode++
        });
        if (numOfNode > 1) {
            //some additional buttons when select multiple items
            this.drawAdvanceAlignmentButtons()
        }
    }

    async drawAdvanceAlignmentButtons() {
        var label = $("<label class='w3-gray' style='display:block;margin-top:5px;width:20%;text-align:center;font-size:1em;padding:2px 4px;font-weight:normal;border-radius: 2px;'>Arrange</label>")
        this.infoContentDiv.append(label)
        var alignButtonsTable = $("<table style='margin:0 auto'><tr><td></td><td></td><td></td></tr><tr><td></td><td style='text-align:center;font-weight:bold;color:darkGray'>ALIGN</td><td></td></tr><tr><td></td><td></td><td></td></tr></table>")
        this.infoContentDiv.append(alignButtonsTable)
        var alignTopButton = $('<button class="w3-ripple w3-button w3-border"><i class="fas fa-chevron-up"></i></button>')
        var alignLeftButton = $('<button class="w3-ripple w3-button w3-border"><i class="fas fa-chevron-left"></i></button>')
        var alignRightButton = $('<button class="w3-ripple w3-button w3-border"><i class="fas fa-chevron-right"></i></button>')
        var alignBottomButton = $('<button class="w3-ripple w3-button w3-border"><i class="fas fa-chevron-down"></i></button>')
        alignButtonsTable.find("td").eq(1).append(alignTopButton)
        alignButtonsTable.find("td").eq(3).append(alignLeftButton)
        alignButtonsTable.find("td").eq(5).append(alignRightButton)
        alignButtonsTable.find("td").eq(7).append(alignBottomButton)


        var arrangeTable = $("<table style='margin:0 auto'><tr><td></td><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td><td></td></tr></table>")
        this.infoContentDiv.append(arrangeTable)

        var distributeHButton = $('<button class="w3-ripple w3-button w3-border"><i class="fas fa-ellipsis-h fa-lg"></i></button>')
        var distributeVButton = $('<button class="w3-ripple w3-button w3-border"><i class="fas fa-ellipsis-v fa-lg"></i></button>')
        var leftRotateButton = $('<button class="w3-ripple w3-button w3-border"><i class="fas fa-undo-alt fa-lg"></i></button>')
        var rightRotateButton = $('<button class="w3-ripple w3-button w3-border"><i class="fas fa-redo-alt fa-lg"></i></button>')
        var mirrorHButton = $('<button class="w3-ripple w3-button w3-border" style="width:100%"><i class="fas fa-arrows-alt-h"></i></button>')
        var mirrorVButton = $('<button class="w3-ripple w3-button w3-border" style="width:100%"><i class="fas fa-arrows-alt-v"></i></button>')
        var expandButton = $('<button class="w3-ripple w3-button w3-border" style="width:100%"><i class="fas fa-expand-arrows-alt"></i></button>')
        var compressButton = $('<button class="w3-ripple w3-button w3-border" style="width:100%"><i class="fas fa-compress-arrows-alt"></i></button>')

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


    async exportSelected() {
        var arr = this.selectedObjects;
        if (arr.length == 0) return;
        var twinIDArr = []
        var twinToBeStored = []
        var twinIDs = {}
        arr.forEach(element => {
            if (element['$sourceId']) return
            twinIDArr.push(element['$dtId'])
            var anExpTwin = {}
            anExpTwin["$metadata"] = { "$model": element["$metadata"]["$model"] }
            for (var ind in element) {
                if (ind == "$metadata" || ind == "$etag") continue
                else anExpTwin[ind] = element[ind]
            }
            twinToBeStored.push(anExpTwin)
            twinIDs[element['$dtId']] = 1
        });
        var relationsToBeStored = []
        twinIDArr.forEach(oneID => {
            var relations = globalCache.storedOutboundRelationships[oneID]
            if (!relations) return;
            relations.forEach(oneRelation => {
                var targetID = oneRelation["$targetId"]
                if (twinIDs[targetID]) {
                    var obj = {}
                    for (var ind in oneRelation) {
                        if (ind == "$etag" || ind == "$relationshipId" || ind == "$sourceId" || ind == "sourceModel") continue
                        obj[ind] = oneRelation[ind]
                    }
                    var oneAction = {
                        "$srcId": oneID,
                        "$relationshipId": oneRelation["$relationshipId"],
                        "obj": obj
                    }
                    relationsToBeStored.push(oneAction)
                }
            })
        })
        var finalJSON = { "twins": twinToBeStored, "relations": relationsToBeStored }
        var pom = $("<a></a>")
        pom.attr('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(finalJSON)));
        pom.attr('download', "exportTwinsData.json");
        pom[0].click()
    }

    async readOneFile(aFile) {
        return new Promise((resolve, reject) => {
            try {
                var reader = new FileReader();
                reader.onload = () => {
                    resolve(reader.result)
                };
                reader.readAsText(aFile);
            } catch (e) {
                reject(e)
            }
        })
    }

    async readTwinsFilesContentAndImport(files) {
        var importTwins = []
        var importRelations = []
        for (var i = 0; i< files.length; i++) {
            var f=files[i]
            // Only process json files.
            if (f.type != "application/json") continue;
            try {
                var str = await this.readOneFile(f)
                var obj = JSON.parse(str)
                if (obj.twins) importTwins = importTwins.concat(obj.twins)
                if (obj.relations) importRelations = importRelations.concat(obj.relations)
            } catch (err) {
                alert(err)
            }
        }

        function uuidv4() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }
        var oldTwinID2NewID = {}
        importTwins.forEach(oneTwin => {
            var oldID = oneTwin["$dtId"]
            var newID = uuidv4();
            oldTwinID2NewID[oldID] = newID
            oneTwin["$dtId"] = newID
        })

        for (var i = importRelations.length - 1; i >= 0; i--) {
            var oneRel = importRelations[i]
            if (oldTwinID2NewID[oneRel["$srcId"]] == null || oldTwinID2NewID[oneRel["obj"]["$targetId"]] == null) {
                importRelations.splice(i, 1)
            } else {
                oneRel["$srcId"] = oldTwinID2NewID[oneRel["$srcId"]]
                oneRel["obj"]["$targetId"] = oldTwinID2NewID[oneRel["obj"]["$targetId"]]
                oneRel["$relationshipId"] = uuidv4();
            }
        }


        try {
            var re = await msalHelper.callAPI("digitaltwin/batchImportTwins", "POST", { "twins": JSON.stringify(importTwins) }, "withProjectID")
        } catch (e) {
            console.log(e)
            if (e.responseText) alert(e.responseText)
            return;
        }

        re.DBTwins = JSON.parse(re.DBTwins)
        re.ADTTwins = JSON.parse(re.ADTTwins)
        re.DBTwins.forEach(DBTwin => { globalCache.storeSingleDBTwin(DBTwin) })
        var adtTwins = []
        re.ADTTwins.forEach(ADTTwin => {
            globalCache.storeSingleADTTwin(ADTTwin)
            adtTwins.push(ADTTwin)
        })

        this.broadcastMessage({ "message": "addNewTwins", "twinsInfo": adtTwins })

        //continue to import relations
        try {
            var relationsImported = await msalHelper.callAPI("digitaltwin/createRelations", "POST", { actions: JSON.stringify(importRelations) })
        } catch (e) {
            console.log(e)
            if (e.responseText) alert(e.responseText)
        }
        globalCache.storeTwinRelationships_append(relationsImported)
        this.broadcastMessage({ "message": "drawAllRelations", info: relationsImported })

        var numOfTwins = adtTwins.length
        var numOfRelations = relationsImported.length
        var str = "Add " + numOfTwins + " node" + ((numOfTwins <= 1) ? "" : "s") + ` (from ${importTwins.length})`
        str += " and " + numOfRelations + " relationship" + ((numOfRelations <= 1) ? "" : "s") + ` (from ${importRelations.length})`
        var confirmDialogDiv = new simpleConfirmDialog()
        confirmDialogDiv.show(
            { width: "400px" },
            {
                title: "Import Result"
                , content: str
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

    async refreshInfomation() {
        var twinIDs = []
        this.selectedObjects.forEach(oneItem => { if (oneItem['$dtId']) twinIDs.push(oneItem['$dtId']) })
        try {
            var twinsdata = await msalHelper.callAPI("digitaltwin/listTwinsForIDs", "POST", twinIDs)
            twinsdata.forEach(oneRe => {
                var twinID = oneRe['$dtId']
                if (globalCache.storedTwins[twinID] != null) {
                    globalCache.storeSingleADTTwin(oneRe)
                }
            })
        } catch (e) {
            console.log(e)
            if (e.responseText) alert(e.responseText)
        }

        while (twinIDs.length > 0) {
            var smallArr = twinIDs.splice(0, 100);
            try {
                var data = await msalHelper.callAPI("digitaltwin/getRelationshipsFromTwinIDs", "POST", smallArr)
                if (data == "") continue;
                globalCache.storeTwinRelationships(data) //store them in global available array
                this.broadcastMessage({ "message": "drawAllRelations", info: data })
            } catch (e) {
                console.log(e)
                if (e.responseText) alert(e.responseText)
            }
        }
        //redraw infopanel if needed
        if (this.selectedObjects.length == 1) this.rxMessage({ "message": "showInfoSelectedNodes", info: this.selectedObjects })
    }

    drawFormulaSection(formulaTwinID,formulaTwinModelID){
        var formulaSection= new simpleExpandableSection("Live Calculation Section",this.infoContentDiv)
        formulaSection.callBack_change=(status)=>{this.openLiveCalculationSection=status}
        if(this.openLiveCalculationSection) formulaSection.expand()

        //list all incoming twins
        var incomingNeighbourLbl=this.generateSmallKeyDiv("Incoming Twins And Self","2px")
        var lbl1=$('<lbl style="font-size:10px;color:gray">(Click to add twin name to script)</lbl>')
        incomingNeighbourLbl.append(lbl1)
        formulaSection.listDOM.append(incomingNeighbourLbl)
        
        var incomingTwins=globalCache.getStoredAllInboundRelationsSources(formulaTwinID)
        
        var scriptLbl=this.generateSmallKeyDiv("Calculation Script","2px")
        scriptLbl.css("margin-top","10px")

        var lbl2=$('<lbl style="font-size:10px;color:gray">(Build in variables:_self _twinVal)</lbl>')
        scriptLbl.append(lbl2)

        var placeHolderStr='Sample&#160;Script&#58;&#10;&#10;if(_twinVal["intwin1"]["p1"]["childProp"]){&#10;&#9;_self["outProp"]=_twinVal["intwin1"]["p2"]&#10;}else{&#10;&#9;_self["outProp"]=_twinVal["intwin1"]["p2"]&#32;+&#32;&#10;&#9;&#9;_twinVal["intwin2"]["p3"]["p4"]&#10;}'
        var scriptTextArea=$('<textarea class="w3-border" spellcheck="false" style="outline:none;font-size:11px;height:240px;width:100%;font-family:Verdana" placeholder='+placeHolderStr+'></textarea>')
        scriptTextArea.on("keydown", (e) => {
            if (e.keyCode == 9){
                this.insertToTextArea('\t',scriptTextArea)
                return false;
            }
        })
        var DBFormulaTwin=globalCache.DBTwins[formulaTwinID]
        if(DBFormulaTwin && DBFormulaTwin["originalScript"]) scriptTextArea.val(DBFormulaTwin["originalScript"])
        
        var highlightColors=[
            ["Purple","#d0bfff"],["Cyan","#00bcd4"],["Amber","#ffc107"],["Lime","#cddc39"],["Pink","#e91e63"]
        ]
        //["Gray","#9e9e9e"]
        var hasIncomingTwins=false
        var twinNamesForHighlight=[]
        //build in key word
        twinNamesForHighlight.push({ "highlight": "_self", "className": "Gray"})
        twinNamesForHighlight.push({ "highlight": "_twinVal", "className": "keyword"})
        var colorIndex=0;
        for(var twinID in incomingTwins){
            hasIncomingTwins=true
            var twinName=globalCache.twinIDMapToDisplayName[twinID]
            twinNamesForHighlight.push({ "highlight": twinName, "className": highlightColors[colorIndex][0]})

            this.createQuickBtnForTwin(twinName,highlightColors[colorIndex][1],formulaSection.listDOM,scriptTextArea)
            colorIndex++
            if(colorIndex>=highlightColors.length)colorIndex=0
        }

        this.createQuickBtnForTwin("Self","#9e9e9e",formulaSection.listDOM,scriptTextArea,formulaTwinModelID)

        if(!hasIncomingTwins)formulaSection.listDOM.append($('<label>No incoming twins</label>'))
        formulaSection.listDOM.append(scriptLbl)
        formulaSection.listDOM.append(scriptTextArea)
        scriptTextArea.highlightWithinTextarea({highlight: twinNamesForHighlight});

        var testScriptBtn = $('<button class="w3-ripple w3-button w3-light-gray w3-hover-amber">Test</button>')
        var confirmScriptBtn = $('<button class="w3-ripple w3-button w3-green  w3-hover-amber">Confirm</button>')
        formulaSection.listDOM.append(testScriptBtn, confirmScriptBtn)


        scriptTextArea.on("keyup",()=>{
            scriptTestDialog.scriptContent=scriptTextArea.val()
        })

        testScriptBtn.on("click",()=>{
            var valueTemplate={}
            this.getPropertyValueTemplate(modelAnalyzer.DTDLModels[formulaTwinModelID].editableProperties,[],valueTemplate)
            var inputArr = globalCache.findAllInputsInScript(scriptTextArea.val(),DBFormulaTwin["displayName"])
            scriptTestDialog.popup(inputArr,DBFormulaTwin["displayName"],formulaTwinModelID,valueTemplate)
            scriptTestDialog.scriptContent=scriptTextArea.val()
        })
        confirmScriptBtn.on("click",()=>{
            this.confirmScript(scriptTextArea.val(),formulaTwinID,formulaTwinModelID,DBFormulaTwin["displayName"])
        })
    }

    async confirmScript(scriptContent,formulaTwinID,formulaTwinModelID,formulaTwinName){
        //detect if there is prohibitted words, if so, reject the submit request
        if(scriptContent=="") return; 
        
        scriptContent=scriptContent.replaceAll(`_twinVal["${formulaTwinName}"][`,"_self[")
        scriptContent=scriptContent.replaceAll(`_twinVal['${formulaTwinName}'][`,"_self[")
        //translate script, replace twins name to twins ID
        var translateResult=this.convertToActualScript(scriptContent,formulaTwinID)

        var valueTemplate={}
        this.getPropertyValueTemplate(modelAnalyzer.DTDLModels[formulaTwinModelID].editableProperties
            ,[],valueTemplate)

        var inputValueArr=[]
        var inputAnalysisResult= globalCache.findAllInputsInScript(scriptContent,formulaTwinName)
        inputAnalysisResult.forEach(ele=>{
            inputValueArr.push({
                "twinID":globalCache.twinDisplayNameMapToID[ele.twinName_origin],
                "path":ele.path,
                "value":ele.value
            })
        })
            
        var theBody={
            "twinID": formulaTwinID,
            "originalScript":scriptContent,
            "actualScript":translateResult,
            "baseValueTemplate":valueTemplate,
            "projectID":globalCache.currentProjectID,
            "currentInputValue":inputValueArr
        }

        //console.log({"payload":JSON.stringify(theBody) })
        //by using withProjectID it will ensure it is the authorized person send the command
        try{ 
            await msalHelper.callAPI("digitaltwin/updateFormula", "POST", {"payload":JSON.stringify(theBody) }, "withProjectID")
            globalCache.DBTwins[formulaTwinID]["originalScript"]=scriptContent
        }catch (e) {
            console.log(e)
            if (e.responseText) alert(e.responseText)
        }
    }


    getPropertyValueTemplate(jsonInfo,pathArr,valueTemplateRoot){
        for(var ind in jsonInfo){
            var newPath=pathArr.concat([ind])
            if(!Array.isArray(jsonInfo[ind]) && typeof(jsonInfo[ind])==="object") {
                valueTemplateRoot[ind]={}
                this.getPropertyValueTemplate(jsonInfo[ind],newPath,valueTemplateRoot[ind])
            }
        }
    }

    convertToActualScript(scriptContent,formulaTwinID){
        //change all the twin name to twin ID
        var patt = /(?<=_twinVal\[\").*?(?=\"\])/g;
        var result = scriptContent.replace(patt,(aTwinName)=>{
            var aTwinID=globalCache.twinDisplayNameMapToID[aTwinName]
            return aTwinID
        } );
        return result;
    }


    getTwinPropertyOptionsArr(jsonInfo,pathArr,optionsArr){
        for(var ind in jsonInfo){
            var newPath=pathArr.concat([ind])
            if(!Array.isArray(jsonInfo[ind]) && typeof(jsonInfo[ind])==="object") {
                this.getTwinPropertyOptionsArr(jsonInfo[ind],newPath,optionsArr)
            }else {
                optionsArr.push('["'+newPath.join('"]["')+'"]')
            }
        }
    }
    
    createQuickBtnForTwin(twinName,colorCode,parentDOM,textAreaDom,selfModelID) {
        var aSelectMenu=new simpleSelectMenu(twinName,{"optionListHeight":200,"buttonCSS":{"background-color":colorCode,"padding":"2px 5px","margin-right":"1px"}})

        if(twinName!="Self"){
            var aDBTwin=globalCache.getSingleDBTwinByName(twinName)
            var modelID=aDBTwin["modelID"]
        }else{
            modelID=selfModelID
        }
        
        var properties=modelAnalyzer.DTDLModels[modelID].editableProperties
        var optionsArr=[]
        var pathArr=[]
        this.getTwinPropertyOptionsArr(properties,pathArr,optionsArr)
        optionsArr.forEach((oneOption)=>{
            aSelectMenu.addOption(oneOption)
        })
        parentDOM.append(aSelectMenu.DOM) 
        aSelectMenu.callBack_clickOption=(optionText,optionValue,realMouseClick)=>{
            if(twinName=="Self") var str='_self'+optionText
            else str='_twinVal["'+twinName+'"]'+optionText
            this.insertToTextArea(str,textAreaDom)
            textAreaDom.highlightWithinTextarea('update');
            textAreaDom.focus()
        }
    }

    insertToTextArea(str,textAreaDom){
        textAreaDom.focus();
        var startPos = textAreaDom[0].selectionStart;
        var endPos = textAreaDom[0].selectionEnd;
        //var newContent=textAreaDom.val()
        //newContent=newContent.substring(0, startPos)+ str + newContent.substring(endPos, newContent.length);
        //textAreaDom.val(newContent)
        document.execCommand('insertText', false, str); //this way will allow undo still works
        textAreaDom[0].selectionStart=startPos+str.length;
        textAreaDom[0].selectionEnd=startPos+str.length;
    }

    drawMultipleObj() {
        var numOfEdge = 0;
        var numOfNode = 0;
        var arr = this.selectedObjects;
        if (arr == null) return;
        arr.forEach(element => {
            if (element['$sourceId']) numOfEdge++
            else numOfNode++
        });
        var textDiv = $("<label style='display:block;margin-top:10px;margin-left:16px'></label>")
        textDiv.text(numOfNode + " node" + ((numOfNode <= 1) ? "" : "s") + ", " + numOfEdge + " relationship" + ((numOfEdge <= 1) ? "" : "s"))
        this.infoContentDiv.append(textDiv)
    }
}

module.exports = new infoPanel();