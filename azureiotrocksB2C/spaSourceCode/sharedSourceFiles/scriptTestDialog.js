const globalCache = require("./globalCache")
const modelAnalyzer = require("./modelAnalyzer");

function scriptTestDialog() {
    if(!this.DOM){
        this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:100" class="w3-card-2"></div>')
        $("body").append(this.DOM)
        this.DOM.hide()
    }
}

scriptTestDialog.prototype.popup = async function(inputsArr,scriptContent,formulaTwinID,formulaTwinModel,valueTemplate) {
    var dbtwin=globalCache.DBTwins[formulaTwinID]
    this.DOM.show()
    this.DOM.empty()
    
    this.DOM.append($('<div style="height:40px" class="w3-bar w3-red"><div class="w3-bar-item" style="font-size:1.5em">Twin Data Processing Testflight</div></div>'))
    var closeButton = $('<button class="w3-bar-item w3-button w3-right" style="font-size:2em;padding-top:4px">×</button>')
    this.DOM.children(':first').append(closeButton)
    closeButton.on("click", () => { this.DOM.hide() })

    this.contentDOM = $('<div class="w3-container" style="width:420px;font-size:1.2em"></div>')
    this.DOM.append(this.contentDOM)

    var twinNameLbl=this.generateNameLabel("Twin Name","10px")
    twinNameLbl.append($('<label class="w3-text-gray">'+dbtwin['displayName']+'</label>'))
    this.contentDOM.append(twinNameLbl)

    var twinNameLbl=this.generateNameLabel("Model","10px")
    twinNameLbl.append($('<label class="w3-text-gray">'+formulaTwinModel+'</label>'))
    this.contentDOM.append(twinNameLbl)

    this.contentDOM.append(this.generateNameLabel("Inputs","10px"))
    
    var aTable=$('<table class="w3-text-gray" style="border-collapse: collapse;font-size:.8em;width:100%"></table>')
    this.contentDOM.append(aTable)
    aTable.append($('<tr><td class="w3-border" style="font-weight:bold;text-align:center">Twin</td><td class="w3-border" style="font-weight:bold;text-align:center">Property Path</td><td class="w3-border" style="font-weight:bold;text-align:center">Value</td></tr>'))
    inputsArr.forEach(oneProperty=>{
        var tr=$('<tr></tr>')
        var fetchpropertypatt = /(?<=\[\").*?(?=\"\])/g;
        if(oneProperty.startsWith("_self")){
            var twinName=dbtwin['displayName']+"(self)"
            var twinName_origin=dbtwin['displayName']
            var pPath=oneProperty.match(fetchpropertypatt);
        }if(oneProperty.startsWith("_twinVal")){
            var arr=oneProperty.match(fetchpropertypatt);
            var twinName=arr[0]
            var twinName_origin=twinName
            arr.shift()
            var pPath=arr
        }
        var td1=$('<td class="w3-border" style="padding:0px 10px">'+twinName+'</td>')
        var td2=$('<td class="w3-border" style="padding:0px 10px">'+pPath+'</td>')
        var td3=$('<td class="w3-border" style="padding:0px 10px"></td>')
        var valueType=this.findPropertyType(twinName_origin,pPath)
        var valueEdit=$('<input type="text" style="outline:none;border:none;padding:5px 0px;width:100%"  placeholder="type: ' +valueType + '"/>'); 
        aTable.append(tr.append(td1,td2,td3))
        td3.append(valueEdit)
    })

    var randomInputBtn = $('<button class="w3-ripple w3-card w3-margin-right w3-light-gray w3-button w3-hover-pink w3-margin-top w3-margin-bottom">Generate Random Input Value</button>') 

    var executeScriptBtn = $('<button class="w3-ripple w3-card w3-button w3-amber w3-hover-pink w3-margin-top w3-margin-bottom">Execute</button>')
    this.contentDOM.append(randomInputBtn,executeScriptBtn)
    var resultDiv=$('<div style="width:100%;height:140px;padding:5px"/>').addClass("w3-light-gray w3-text-gray w3-border w3-margin-bottom");
    resultDiv.text("Calculation result...")
    this.contentDOM.append(resultDiv)
}

scriptTestDialog.prototype.findPropertyType=function(twinName,propertyPath){
    var dbtwin=globalCache.getSingleDBTwinByName(twinName)
    var modelID=dbtwin["modelID"]
    var editableProperties=modelAnalyzer.DTDLModels[modelID].editableProperties
    var theType=editableProperties
    for(var i=0;i<propertyPath.length;i++){
        var ele=propertyPath[i]
        if(theType[ele]) theType=theType[ele]
        else return null
    }
    return theType
}


scriptTestDialog.prototype.generateNameLabel=function(str,paddingTop){
    var keyDiv = $("<label style='display:block'><div class='w3-border' style='background-color:#f6f6f6;display:inline;padding:.1em .3em .1em .3em;margin-right:.3em'>"+str+"</div></label>")
    keyDiv.css("padding-top",paddingTop)
    return keyDiv
}

module.exports = new scriptTestDialog();