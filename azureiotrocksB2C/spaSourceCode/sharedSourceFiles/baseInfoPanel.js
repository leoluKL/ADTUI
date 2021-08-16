const simpleSelectMenu= require("./simpleSelectMenu")
const globalCache = require("../sharedSourceFiles/globalCache")
const modelAnalyzer = require("../sharedSourceFiles/modelAnalyzer");
const msalHelper = require("../msalHelper")
const simpleChart=require("./simpleChart")

class baseInfoPanel {
    drawEditable(parent,jsonInfo,originElementInfo,pathArr,funcGetKeyLblColorClass){
        if(jsonInfo==null) return;
        for(var ind in jsonInfo){
            var keyDiv= $("<label style='display:block'><div style='display:inline;padding:.1em .3em .1em .3em; margin-right:5px'>"+ind+"</div></label>")
            parent.append(keyDiv)
            
            keyDiv.css("padding-top",".3em") 
    
            var contentDOM=$("<label style='padding-top:.2em'></label>")
            var newPath=pathArr.concat([ind])
            var keyLabelColorClass="w3-dark-gray"
            if(funcGetKeyLblColorClass) keyLabelColorClass=funcGetKeyLblColorClass(newPath)
            if(Array.isArray(jsonInfo[ind])){
                keyDiv.children(":first").addClass(keyLabelColorClass)
                if (this.readOnly) {
                    var val = globalCache.searchValue(originElementInfo, newPath)
                    if (val == null) {
                        contentDOM.css({ "color": "gray", "font-size": "9px" })
                        contentDOM.text("[empty]")
                    } else contentDOM.text(val)
                }else{
                    this.drawDropdownOption(contentDOM,newPath,jsonInfo[ind],originElementInfo)
                }
            }else if(typeof(jsonInfo[ind])==="object") {
                keyDiv.children(":first").css("font-weight","bold")
                contentDOM.css("display","block")
                contentDOM.css("padding-left","1em")
                this.drawEditable(contentDOM,jsonInfo[ind],originElementInfo,newPath,funcGetKeyLblColorClass)
            }else {
                keyDiv.children(":first").addClass(keyLabelColorClass)
                var val = globalCache.searchValue(originElementInfo, newPath)
                if (this.readOnly) {
                    if (val == null) {
                        contentDOM.css({ "color": "gray", "font-size": "9px" })
                        contentDOM.text("[empty]")
                    } else contentDOM.text(val)
                } else {
                    var aInput = $('<input type="text" style="padding:2px;width:50%;outline:none;display:inline" placeholder="type: ' + jsonInfo[ind] + '"/>').addClass("w3-input w3-border");
                    contentDOM.append(aInput)
                    if (val != null) aInput.val(val)
                    aInput.data("path", newPath)
                    aInput.data("dataType", jsonInfo[ind])
                    aInput.change((e) => {
                        this.editDTProperty(originElementInfo, $(e.target).data("path"), $(e.target).val(), $(e.target).data("dataType"))
                    })
                }
            }
            keyDiv.append(contentDOM)
        }
    }

    drawDropdownOption(contentDOM,newPath,valueArr,originElementInfo){
        var aSelectMenu=new simpleSelectMenu("",{buttonCSS:{"padding":"4px 16px"}})
        contentDOM.append(aSelectMenu.DOM)
        aSelectMenu.DOM.data("path", newPath)
        valueArr.forEach((oneOption)=>{
            var str =oneOption["displayName"]  || oneOption["enumValue"] 
            aSelectMenu.addOption(str)
        })
        aSelectMenu.callBack_clickOption=(optionText,optionValue,realMouseClick)=>{
            aSelectMenu.changeName(optionText)
            if(realMouseClick) this.editDTProperty(originElementInfo,aSelectMenu.DOM.data("path"),optionValue,"string")
        }
        var val=globalCache.searchValue(originElementInfo,newPath)
        if(val!=null){
            aSelectMenu.triggerOptionValue(val)
        }    
    }

    generateSmallKeyDiv(str,paddingTop){
        var keyDiv = $("<label style='display:block'><div class='w3-border' style='background-color:#f6f6f6;display:inline;padding:.1em .3em .1em .3em;margin-right:.3em;font-size:10px'>"+str+"</div></label>")
        keyDiv.css("padding-top",paddingTop)
        return keyDiv
    }

    drawConnectionStatus(status,parentDom) {
        parentDom=parentDom||this.DOM
        var keyDiv=this.generateSmallKeyDiv("Connection",".5em")
        parentDom.append(keyDiv)
        var contentDOM = $('<span class="fa-stack" style="font-size:.5em;padding-left:5px"></span>')
        if(status) {
            contentDOM.addClass("w3-text-lime")
            contentDOM.html('<i class="fas fa-signal fa-stack-2x"></i>')
        }else{
            contentDOM.addClass("w3-text-red")
            contentDOM.html('<i class="fas fa-signal fa-stack-2x"></i><i class="fas fa-slash fa-stack-2x"></i>')
        }
        keyDiv.append(contentDOM)
    }

    drawStaticInfo(parent,jsonInfo,paddingTop,fontSize,fontColor){
        fontColor=fontColor||"black"
        for(var ind in jsonInfo){
            var keyDiv=this.generateSmallKeyDiv(ind,paddingTop)
            parent.append(keyDiv)
    
            var contentDOM=$("<label></label>")
            contentDOM.css({"fontSize":fontSize,"color":fontColor})
            if(jsonInfo[ind]==null){
                contentDOM.css({ "color": "gray", "font-size": "9px" })
                contentDOM.text("[empty]")
            }else if(typeof(jsonInfo[ind])==="object") {
                contentDOM.css("display","block")
                contentDOM.css("padding-left","1em")
                this.drawStaticInfo(contentDOM,jsonInfo[ind],".5em",fontSize)
            }else {
                contentDOM.css("padding-top",".2em")
                contentDOM.text(jsonInfo[ind])
            }
            
            keyDiv.append(contentDOM)
        }
    }

    fetchRealElementInfo(singleElementInfo){ //the input is possibly from topology view which might not be precise about property value
        var returnElementInfo={}
        if(singleElementInfo==null) return;
        if (singleElementInfo["$dtId"]) {
            returnElementInfo=globalCache.storedTwins[singleElementInfo["$dtId"]] //note that dynamical property value is not stored in topology node, so always get refresh data from globalcache
        }else if (singleElementInfo["$sourceId"]) {
            var arr=globalCache.storedOutboundRelationships[singleElementInfo["$sourceId"]]
            for(var i=0;i<arr.length;i++){
                if(arr[i]['$relationshipId']==singleElementInfo["$relationshipId"]){
                    returnElementInfo=arr[i]
                    break;
                }
            }
        }else if(singleElementInfo["simNodeName"]){
            var attachTwinID=singleElementInfo["twinID"]
            var dbtwin=globalCache.DBTwins[attachTwinID]
            var simNodeName=singleElementInfo["simNodeName"]
            singleElementInfo.detail=dbtwin.simulate[simNodeName]
            returnElementInfo=singleElementInfo
        }
        return returnElementInfo
    }

    drawSingleRelationProperties(singleRelationInfo,parentDom) {
        parentDom=parentDom||this.DOM
        this.drawStaticInfo(parentDom, {
            "sourceI":globalCache.twinIDMapToDisplayName[singleRelationInfo["$sourceId"]],
            "target": globalCache.twinIDMapToDisplayName[singleRelationInfo["$targetId"]],
            "$relationshipName": singleRelationInfo["$relationshipName"]
        }, "1em", "13px")
        this.drawStaticInfo(parentDom, {
            "$relationshipId": singleRelationInfo["$relationshipId"]
        }, "1em", "10px")
        var relationshipName = singleRelationInfo["$relationshipName"]
        var sourceModel = singleRelationInfo["sourceModel"]

        this.drawEditable(parentDom, this.getRelationShipEditableProperties(relationshipName, sourceModel), singleRelationInfo, [])
        for (var ind in singleRelationInfo["$metadata"]) {
            var tmpObj = {}
            tmpObj[ind] = singleRelationInfo["$metadata"][ind]
            this.drawStaticInfo(parentDom, tmpObj, "1em", "10px")
        }
        //this.drawStaticInfo(parentDom,{"$etag":singleRelationInfo["$etag"]},"1em","10px","DarkGray")
    }

    getRelationShipEditableProperties(relationshipName, sourceModel) {
        if (!modelAnalyzer.DTDLModels[sourceModel] || !modelAnalyzer.DTDLModels[sourceModel].validRelationships[relationshipName]) return
        return modelAnalyzer.DTDLModels[sourceModel].validRelationships[relationshipName].editableRelationshipProperties
    }


    drawSimDatasourceInfo(simNodeInfo,parentDom){
        parentDom=parentDom||this.DOM
        var dbTwin=globalCache.DBTwins[simNodeInfo.twinID]
        var twinName=globalCache.twinIDMapToDisplayName[simNodeInfo.twinID]
        if(!this.readOnly) {
            var containerDiv=$("<div class='w3-container'/>")
            parentDom.append(containerDiv)
            parentDom=containerDiv 
        }
        this.drawStaticInfo(parentDom, { "name": twinName }, ".5em", "13px")
        this.drawStaticInfo(parentDom, { "Model": dbTwin.modelID }, ".5em", "13px")
        if (this.readOnly) {//in float info panel
            this.drawStaticInfo(parentDom, { "Simulate Property": simNodeInfo.propertyPath }, ".5em", "13px")
            this.drawStaticInfo(parentDom, { "Cycle Length": simNodeInfo.cycleLength }, ".5em", "13px")
            this.drawStaticInfo(parentDom, { "Sampling": simNodeInfo.sampleInterval }, ".5em", "13px")
            this.drawStaticInfo(parentDom, { "Formula": simNodeInfo.formula }, ".5em", "13px")
        }else{ // in right side info panel
            this.drawSimDatasourceInfo_propertyPath(parentDom,simNodeInfo,dbTwin)
            //draw cycleLength,sampleInterval and formula
            var demoChart=this.drawSimDatasourceInfo_chart(simNodeInfo,parentDom)
            this.drawSimDatasourceInfo_input("Cycle Length(_T)","cycleLength","Cycle time length in seconds",parentDom,simNodeInfo,dbTwin,demoChart)
            this.drawSimDatasourceInfo_input("Sampling","sampleInterval","Sampling time in seconds",parentDom,simNodeInfo,dbTwin,demoChart) 
            this.drawSimDatasourceInfo_formula(parentDom,simNodeInfo,dbTwin,demoChart)
            parentDom.append(demoChart.canvas) //move chart to the end
            this.drawSimDatasourceInfo_refreshChart(simNodeInfo,demoChart)
        }
    }

    drawSimDatasourceInfo_refreshChart(simNodeInfo,theChart){
        var _T=parseFloat(simNodeInfo.detail["cycleLength"])
        var sampling=parseFloat(simNodeInfo.detail["sampleInterval"])
        var formula=simNodeInfo.detail["formula"]
        var numOfPoints=parseInt(2*_T/sampling)+1
        theChart.setXLength(numOfPoints)
        var _t=0;
        var dataArr=[]
        var _output=null;
        for(var i=0;i<numOfPoints;i++){
            var evalStr=formula+"\n_output"
            try{
                _output=eval(evalStr) // jshint ignore:line
            }catch(e){
                return e
            }
            dataArr.push(_output)
            _t+=sampling
            if(_t>=_T)_t=_t-_T
        }
        theChart.setDataArr(dataArr)
    }

    drawSimDatasourceInfo_chart(simNodeInfo,parentDom){
        var cycleL= simNodeInfo.detail["cycleLength"]
        var sampling=simNodeInfo.detail["sampleInterval"]
        var numOfPoints=100
        var demoChart=new simpleChart(parentDom,numOfPoints,{width:"100%","height":"130px"}) 
        return demoChart
    }
    drawSimDatasourceInfo_formula(parentDom,simNodeInfo,dbTwin,demoChart){
        var scriptLbl=this.generateSmallKeyDiv("Calculation Script","2px")
        scriptLbl.css("margin-top","10px")

        var lbl2=$('<lbl style="font-size:10px;color:gray">(Build in variables:_t _T _output)</lbl>')
        scriptLbl.append(lbl2)

        var placeHolderStr='Sample&#160;Script&#58;&#10;&#10;SIN&#160;Wave&#10;_output=Math.sin(_t/_T*2*3.14)&#10;&#10;Value&#160;List&#10;var&#160;valueList=[2,3.5,-1,10.3,9.1]&#10;var&#160;index=(_t/_T*valueList.length).toFixed(0)&#10;_output=valueList[index]&#10;&#10;Square&#160;Wave&#10;_output=1-_output' 
        var scriptTextArea=$('<textarea class="w3-border" spellcheck="false" style="outline:none;font-size:11px;height:140px;width:100%;font-family:Verdana" placeholder='+placeHolderStr+'></textarea>')
        parentDom.append(scriptLbl,scriptTextArea)
        scriptTextArea.on("keydown", (e) => {
            if (e.keyCode == 9){
                this.insertToTextArea('\t',scriptTextArea)
                return false;
            }
        })
        scriptTextArea.highlightWithinTextarea({highlight: [
            { "highlight": "_t", "className": "Purple"},
            { "highlight": "_T", "className": "Cyan"},
            { "highlight": "_output", "className": "Amber"},
        ]});
        var confirmBtn=$('<button class="w3-button w3-amber w3-ripple" style="padding:2px 10px;display:block">Commit Script</button>')
        parentDom.append(confirmBtn)
        var originalV=simNodeInfo.detail["formula"]
        if (originalV != null) {
            scriptTextArea.val(originalV)
            scriptTextArea.highlightWithinTextarea('update');
        }
        confirmBtn.on("click",()=>{
            simNodeInfo.detail["formula"] = scriptTextArea.val()
            try {
                var error=this.drawSimDatasourceInfo_refreshChart(simNodeInfo,demoChart)
                if(error){
                    alert(error)
                    return;
                }
                msalHelper.callAPI("digitaltwin/updateTwin", "POST"
                    , { "twinID": simNodeInfo.twinID, "updateInfo": JSON.stringify({ "simulate": dbTwin.simulate }) }
                    , "withProjectID")
            } catch (e) {
                console.log(e)
                if (e.responseText) alert(e.responseText)
            }
        })
    }

    drawSimDatasourceInfo_input(lblText, keyStr,placeHolderStr, parentDom, simNodeInfo, dbTwin,demoChart) {
        var keyDiv = $("<div style='display:block;margin-top:.5em'><div style='display:inline;padding:.1em .3em .1em .3em; margin-right:5px'>"+lblText+"</div></div>")
        parentDom.append(keyDiv)
        var contentDOM = $("<label style='padding-top:.2em'></label>")
        keyDiv.append(contentDOM)
        var aInput = $('<input type="text" style="padding:2px;width:60%;outline:none;display:inline" placeholder="' + placeHolderStr + '"/>').addClass("w3-input w3-border");
        contentDOM.append(aInput)
        var originalV=simNodeInfo.detail[keyStr] 
        if (originalV != null) aInput.val(originalV)
        aInput.change((e) => {
            simNodeInfo.detail[keyStr] = $(e.target).val()
            try {
                this.drawSimDatasourceInfo_refreshChart(simNodeInfo,demoChart)
                msalHelper.callAPI("digitaltwin/updateTwin", "POST"
                    , { "twinID": simNodeInfo.twinID, "updateInfo": JSON.stringify({ "simulate": dbTwin.simulate }) }
                    , "withProjectID")
            } catch (e) {
                console.log(e)
                if (e.responseText) alert(e.responseText)
            }
        })
    }


    drawSimDatasourceInfo_propertyPath(parentDom,simNodeInfo,dbTwin){
        var keyDiv= $("<label style='display:block;padding-top:.3em'><div style='display:inline;padding:.1em .3em .1em .3em; margin-right:5px'>Simulate Property</div></label>")
        parentDom.append(keyDiv)    
        var contentDOM=$("<label style='padding-top:.2em'></label>")
        keyDiv.append(contentDOM)
        var aSelectMenu = new simpleSelectMenu("", { buttonCSS: { "padding": "4px 16px" } })
        contentDOM.append(aSelectMenu.DOM)
        var propertiesArr=modelAnalyzer.fetchPropertyPathsOfModel(dbTwin.modelID)
        propertiesArr.forEach((oneProperty) => {
            aSelectMenu.addOption(oneProperty.join("."),oneProperty)
        })
        var originalPath=simNodeInfo.detail.propertyPath
        aSelectMenu.callBack_clickOption = (optionText, optionValue, realMouseClick) => {
            aSelectMenu.changeName(optionText)
            if(!realMouseClick) return;
            if(originalPath==null || originalPath.join()!=optionValue.join){
                simNodeInfo.detail.propertyPath=optionValue
                try {
                    msalHelper.callAPI("digitaltwin/updateTwin", "POST"
                        , {"twinID":simNodeInfo.twinID,"updateInfo":JSON.stringify({"simulate":dbTwin.simulate})}
                        , "withProjectID")
                } catch (e) {
                    console.log(e)
                    if (e.responseText) alert(e.responseText)
                }
            }
        }
        if (originalPath != null) aSelectMenu.triggerOptionText(originalPath.join("."))
    }


    drawSingleNodeProperties(singleDBTwinInfo,singleADTTwinInfo,parentDom,notEmbedMetadata) {
        //instead of draw the $dtId, draw display name instead
        //this.drawStaticInfo(this.DOM,{"$dtId":singleElementInfo["$dtId"]},"1em","13px")
        parentDom=parentDom||this.DOM
        const constDesiredColor="w3-amber"
        const constReportColor="w3-blue"
        const constTelemetryColor="w3-lime"
        const constCommonColor="w3-dark-gray"

        var modelID = singleDBTwinInfo.modelID
        this.drawStaticInfo(parentDom, { "name": singleDBTwinInfo["displayName"] }, ".5em", "13px")
        var theDBModel = globalCache.getSingleDBModelByID(modelID)
        if (theDBModel.isIoTDeviceModel) {
            this.drawConnectionStatus(singleDBTwinInfo["connectState"],parentDom)
            this.drawStaticInfo(parentDom, { "Connection State Time": singleDBTwinInfo["connectStateUpdateTime"] }, ".5em", "10px")
            parentDom.append($('<table style="font-size:smaller;margin:3px 0px"><tr><td class="'+constTelemetryColor+'">&nbsp;&nbsp;</td><td>telemetry</td><td class="'+constReportColor+'">&nbsp;&nbsp;</td><td>report</td><td class="'+constDesiredColor+'">&nbsp;&nbsp;</td><td>desired</td><td class="'+constCommonColor+'">&nbsp;&nbsp;</td><td>common</td></tr></table>'))
        }

        if (modelAnalyzer.DTDLModels[modelID]) {
            if (theDBModel.isIoTDeviceModel) {
                var funcGetKeyLblColorClass = (propertyPath) => {
                    var colorCodeMapping = {}
                    theDBModel.desiredProperties.forEach(desiredP => {
                        colorCodeMapping[JSON.stringify(desiredP.path)] = constDesiredColor
                    })
                    theDBModel.reportProperties.forEach(reportP => {
                        colorCodeMapping[JSON.stringify(reportP.path)] = constReportColor
                    })
                    theDBModel.telemetryProperties.forEach(telemetryP => {
                        colorCodeMapping[JSON.stringify(telemetryP.path)] = constTelemetryColor
                    })
                    var pathStr = JSON.stringify(propertyPath)
                    if (colorCodeMapping[pathStr]) return colorCodeMapping[pathStr]
                    else return constCommonColor
                }
            }
            this.drawEditable(parentDom, modelAnalyzer.DTDLModels[modelID].editableProperties, singleADTTwinInfo, [], funcGetKeyLblColorClass)
        }

        var metadataContent = $("<label style='display:block'></label>")
        var expandMetaBtn=$("<div class='w3-border w3-button w3-light-gray' style='padding:.1em .5em;margin-right:1em;font-size:10px'>...</div>")
        parentDom.append(metadataContent)
        var metaDataDiv=$('<div/>')
        metadataContent.append(expandMetaBtn,metaDataDiv)
        metaDataDiv.hide()
        expandMetaBtn.on("click",()=>{expandMetaBtn.hide();metaDataDiv.show()})
        if(notEmbedMetadata) expandMetaBtn.trigger("click")


        this.drawStaticInfo(metaDataDiv, { "Model": modelID }, "1em", "10px")
        for (var ind in singleADTTwinInfo["$metadata"]) {
            if (ind == "$model") continue;
            var tmpObj = {}
            tmpObj[ind] = singleADTTwinInfo["$metadata"][ind]
            this.drawStaticInfo(metaDataDiv, tmpObj, ".5em", "10px")
        }
    }

    async editDTProperty(originElementInfo, path, newVal, dataType) {
        if (["double", "float", "integer", "long"].includes(dataType)) newVal = Number(newVal)
        if(dataType=="boolean"){
            if(newVal=="true") newVal=true
            else newVal=false
        }

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
    }

}

module.exports = baseInfoPanel;