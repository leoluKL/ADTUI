const modelAnalyzer = require("../sharedSourceFiles/modelAnalyzer");
const simpleConfirmDialog = require("../sharedSourceFiles/simpleConfirmDialog")
const globalCache = require("../sharedSourceFiles/globalCache")
const msalHelper = require("../msalHelper")
const baseInfoPanel = require("../sharedSourceFiles/baseInfoPanel")

class infoPanel extends baseInfoPanel {
    constructor() {
        super()
        this.continerDOM = $('<div class="w3-card" style="position:absolute;z-index:90;right:0px;top:50%;height:70%;width:300px;transform: translateY(-50%);"></div>')
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

        this.DOM = $('<div class="w3-container" style="postion:absolute;top:50px;height:calc(100% - 50px);overflow:auto"></div>')
        this.continerDOM.css("background-color", "rgba(255, 255, 255, 0.8)")
        this.continerDOM.hover(() => {
            this.continerDOM.css("background-color", "rgba(255, 255, 255, 1)")
        }, () => {
            this.continerDOM.css("background-color", "rgba(255, 255, 255, 0.8)")
        });
        this.continerDOM.append(this.DOM)
        $('body').append(this.continerDOM)

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
        this.DOM.empty()
        if (arr == null || arr.length == 0) {
            this.drawButtons(null)
            this.selectedObjects = [];
            return;
        }
        this.selectedObjects = arr;
        if (arr.length == 1) {
            var singleElementInfo = arr[0];

            if (singleElementInfo["$dtId"]) {// select a node
                this.drawButtons("singleNode")
                var singleDBTwinInfo=globalCache.getSingleDBTwinByID(singleElementInfo["$dtId"])
                this.drawSingleNodeProperties(singleDBTwinInfo,singleElementInfo)
            } else if (singleElementInfo["$sourceId"]) {
                this.drawButtons("singleRelationship")
                this.drawStaticInfo(this.DOM, {
                    "$sourceId": singleElementInfo["$sourceId"],
                    "$targetId": singleElementInfo["$targetId"],
                    "$relationshipName": singleElementInfo["$relationshipName"]
                }, "1em", "13px")
                this.drawStaticInfo(this.DOM, {
                    "$relationshipId": singleElementInfo["$relationshipId"]
                }, "1em", "10px")
                var relationshipName = singleElementInfo["$relationshipName"]
                var sourceModel = singleElementInfo["sourceModel"]

                this.drawEditable(this.DOM, this.getRelationShipEditableProperties(relationshipName, sourceModel), singleElementInfo, [])
                for (var ind in singleElementInfo["$metadata"]) {
                    var tmpObj = {}
                    tmpObj[ind] = singleElementInfo["$metadata"][ind]
                    this.drawStaticInfo(this.DOM, tmpObj, "1em", "10px")
                }
                //this.drawStaticInfo(this.DOM,{"$etag":singleElementInfo["$etag"]},"1em","10px","DarkGray")
            }
        } else if (arr.length > 1) {
            this.drawButtons("multiple")
            this.drawMultipleObj()
        }
    }

    getRelationShipEditableProperties(relationshipName, sourceModel) {
        if (!modelAnalyzer.DTDLModels[sourceModel] || !modelAnalyzer.DTDLModels[sourceModel].validRelationships[relationshipName]) return
        return modelAnalyzer.DTDLModels[sourceModel].validRelationships[relationshipName].editableRelationshipProperties
    }

    drawButtons(selectType) {
        var impBtn = $('<button class="w3-bar-item w3-button w3-blue"><i class="fas fa-cloud-upload-alt"></i></button>')
        var actualImportTwinsBtn = $('<input type="file" name="modelFiles" multiple="multiple" style="display:none"></input>')
        if (selectType != null) {
            var refreshBtn = $('<button class="w3-bar-item w3-button w3-black"><i class="fas fa-sync-alt"></i></button>')
            var expBtn = $('<button class="w3-bar-item w3-button w3-green"><i class="fas fa-cloud-download-alt"></i></button>')
            this.DOM.append(refreshBtn, expBtn, impBtn, actualImportTwinsBtn)
            refreshBtn.on("click", () => { this.refreshInfomation() })
            expBtn.on("click", () => {
                //find out the twins in selection and their connections (filter both src and target within the selected twins)
                //and export them
                this.exportSelected()
            })
        } else {
            this.DOM.html("<a style='display:block;font-style:italic;color:gray'>Choose twins or relationships to view infomration</a><a style='display:block;font-style:italic;color:gray;padding-top:20px'>Press shift key to draw box and select multiple twins in topology view</a><a style='display:block;font-style:italic;color:gray;padding-top:20px'>Press ctrl+z and ctrl+y to undo/redo in topology view; ctrl+s to save layout</a><a style='display:block;font-style:italic;color:gray;padding-top:20px;padding-bottom:20px'>Press shift or ctrl key to select multiple twins in tree view</a><a style='display:block;font-style:italic;color:gray;padding-top:12px;padding-bottom:5px'>Import twins data by clicking button below</a>")
            this.DOM.append(impBtn, actualImportTwinsBtn)
        }

        impBtn.on("click", () => { actualImportTwinsBtn.trigger('click'); })
        actualImportTwinsBtn.change(async (evt) => {
            var files = evt.target.files; // FileList object
            await this.readTwinsFilesContentAndImport(files)
            actualImportTwinsBtn.val("")
        })
        if (selectType == null) return;

        if (selectType == "singleRelationship") {
            var delBtn = $('<button style="width:104px" class="w3-button w3-red w3-hover-pink w3-border">Delete All</button>')
            this.DOM.append(delBtn)
            delBtn.on("click", () => { this.deleteSelected() })
        } else if (selectType == "singleNode" || selectType == "multiple") {
            var delBtn = $('<button style="width:104px" class="w3-button w3-red w3-hover-pink w3-border">Delete All</button>')
            var connectToBtn = $('<button style="width:45%"  class="w3-button w3-border">Connect to</button>')
            var connectFromBtn = $('<button style="width:45%" class="w3-button w3-border">Connect from</button>')
            var showInboundBtn = $('<button  style="width:45%" class="w3-button w3-border">Query Inbound</button>')
            var showOutBoundBtn = $('<button style="width:45%" class="w3-button w3-border">Query Outbound</button>')

            this.DOM.append(delBtn, connectToBtn, connectFromBtn, showInboundBtn, showOutBoundBtn)

            showOutBoundBtn.on("click", () => { this.showOutBound() })
            showInboundBtn.on("click", () => { this.showInBound() })
            connectToBtn.on("click", () => { this.broadcastMessage({ "message": "connectTo" }) })
            connectFromBtn.on("click", () => { this.broadcastMessage({ "message": "connectFrom" }) })

            delBtn.on("click", () => { this.deleteSelected() })
        }

        var numOfNode = 0;
        var arr = this.selectedObjects;
        arr.forEach(element => {
            if (element['$dtId']) numOfNode++
        });
        if (numOfNode > 0) {
            var selectInboundBtn = $('<button class="w3-button w3-border">+Select Inbound</button>')
            var selectOutBoundBtn = $('<button class="w3-button w3-border">+Select Outbound</button>')
            var coseLayoutBtn = $('<button class="w3-button w3-border">COSE View</button>')
            var hideBtn = $('<button class="w3-button w3-border">Hide</button>')
            this.DOM.append(selectInboundBtn, selectOutBoundBtn, coseLayoutBtn, hideBtn)

            selectInboundBtn.on("click", () => { this.broadcastMessage({ "message": "addSelectInbound" }) })
            selectOutBoundBtn.on("click", () => { this.broadcastMessage({ "message": "addSelectOutbound" }) })
            coseLayoutBtn.on("click", () => { this.broadcastMessage({ "message": "COSESelectedNodes" }) })
            hideBtn.on("click", () => { this.broadcastMessage({ "message": "hideSelectedNodes" }) })
        }
        if (numOfNode > 1) {
            //some additional buttons when select multiple items
            this.drawAdvanceAlignmentButtons()
        }
    }

    async drawAdvanceAlignmentButtons() {
        var label = $("<label class='w3-gray' style='display:block;margin-top:5px;width:20%;text-align:center;font-size:9px;padding:2px 4px;font-weight:normal;border-radius: 2px;'>Arrange</label>")
        this.DOM.append(label)
        var alignButtonsTable = $("<table style='margin:0 auto'><tr><td></td><td></td><td></td></tr><tr><td></td><td style='text-align:center;font-weight:bold;color:darkGray'>ALIGN</td><td></td></tr><tr><td></td><td></td><td></td></tr></table>")
        this.DOM.append(alignButtonsTable)
        var alignTopButton = $('<button class="w3-button w3-border"><i class="fas fa-chevron-up"></i></button>')
        var alignLeftButton = $('<button class="w3-button w3-border"><i class="fas fa-chevron-left"></i></button>')
        var alignRightButton = $('<button class="w3-button w3-border"><i class="fas fa-chevron-right"></i></button>')
        var alignBottomButton = $('<button class="w3-button w3-border"><i class="fas fa-chevron-down"></i></button>')
        alignButtonsTable.find("td").eq(1).append(alignTopButton)
        alignButtonsTable.find("td").eq(3).append(alignLeftButton)
        alignButtonsTable.find("td").eq(5).append(alignRightButton)
        alignButtonsTable.find("td").eq(7).append(alignBottomButton)


        var arrangeTable = $("<table style='margin:0 auto'><tr><td></td><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td><td></td></tr></table>")
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
                    for (var ind in oneRe) globalCache.storeSingleADTTwin(oneRe[ind])
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


    async deleteSelected() {
        var arr = this.selectedObjects;
        if (arr.length == 0) return;
        var relationsArr = []
        var twinIDArr = []
        var twinIDs = {}
        arr.forEach(element => {
            if (element['$sourceId']) relationsArr.push(element);
            else {
                twinIDArr.push(element['$dtId'])
                twinIDs[element['$dtId']] = 1
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

    async deleteTwins(twinIDArr) {
        var ioTDevices = []
        twinIDArr.forEach(oneTwinID => {
            var dbTwinInfo = globalCache.getSingleDBTwinByID(oneTwinID)
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
                this.broadcastMessage({ "message": "twinsDeleted", twinIDArr: result })
            } catch (e) {
                console.log(e)
                if (e.responseText) alert(e.responseText)
            }
        }
    }

    async deleteRelations(relationsArr) {
        var arr = []
        relationsArr.forEach(oneRelation => {
            arr.push({ srcID: oneRelation['$sourceId'], relID: oneRelation['$relationshipId'] })
        })
        try {
            var data = await msalHelper.callAPI("digitaltwin/deleteRelations", "POST", { "relations": arr })
            globalCache.storeTwinRelationships_remove(data)
            this.broadcastMessage({ "message": "relationsDeleted", "relations": data })
        } catch (e) {
            console.log(e)
            if (e.responseText) alert(e.responseText)
        }
    }

    async showOutBound() {
        var arr = this.selectedObjects;
        var twinIDArr = []
        arr.forEach(element => {
            if (element['$sourceId']) return;
            twinIDArr.push(element['$dtId'])
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
                this.broadcastMessage({ "message": "drawTwinsAndRelations", info: data })
            } catch (e) {
                console.log(e)
                if (e.responseText) alert(e.responseText)
            }
        }
    }

    async showInBound() {
        var arr = this.selectedObjects;
        var twinIDArr = []
        arr.forEach(element => {
            if (element['$sourceId']) return;
            twinIDArr.push(element['$dtId'])
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
                this.broadcastMessage({ "message": "drawTwinsAndRelations", info: data })
            } catch (e) {
                console.log(e)
                if (e.responseText) alert(e.responseText)
            }
        }
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
        var textDiv = $("<label style='display:block;margin-top:10px'></label>")
        textDiv.text(numOfNode + " node" + ((numOfNode <= 1) ? "" : "s") + ", " + numOfEdge + " relationship" + ((numOfEdge <= 1) ? "" : "s"))
        this.DOM.append(textDiv)
    }

    async editDTProperty(originElementInfo, path, newVal, dataType) {
        if (["double", "boolean", "float", "integer", "long"].includes(dataType)) newVal = Number(newVal)

        //{ "op": "add", "path": "/x", "value": 30 }
        if (path.length == 1) {
            var str = ""
            path.forEach(segment => { str += "/" + segment })
            var jsonPatch = [{ "op": "add", "path": str, "value": newVal }]
        } else {
            //it is a property inside a object type of root property,update the whole root property
            var rootProperty = path[0]
            var patchValue = originElementInfo[rootProperty]
            if (patchValue == null) patchValue = {}
            else patchValue = JSON.parse(JSON.stringify(patchValue)) //make a copy
            this.updateOriginObjectValue(patchValue, path.slice(1), newVal)

            var jsonPatch = [{ "op": "add", "path": "/" + rootProperty, "value": patchValue }]
        }

        if (originElementInfo["$dtId"]) { //edit a node property
            var twinID = originElementInfo["$dtId"]
            var payLoad = { "jsonPatch": JSON.stringify(jsonPatch), "twinID": twinID }
        } else if (originElementInfo["$relationshipId"]) { //edit a relationship property
            var twinID = originElementInfo["$sourceId"]
            var relationshipID = originElementInfo["$relationshipId"]
            var payLoad = { "jsonPatch": JSON.stringify(jsonPatch), "twinID": twinID, "relationshipID": relationshipID }
        }


        try {
            await msalHelper.callAPI("digitaltwin/changeAttribute", "POST", payLoad)
            this.updateOriginObjectValue(originElementInfo, path, newVal)
        } catch (e) {
            console.log(e)
            if (e.responseText) alert(e.responseText)
        }

    }

    updateOriginObjectValue(nodeInfo, pathArr, newVal) {
        if (pathArr.length == 0) return;
        var theJson = nodeInfo
        for (var i = 0; i < pathArr.length; i++) {
            var key = pathArr[i]

            if (i == pathArr.length - 1) {
                theJson[key] = newVal
                break
            }
            if (theJson[key] == null) theJson[key] = {}
            theJson = theJson[key]
        }
        return
    }
}

module.exports = new infoPanel();