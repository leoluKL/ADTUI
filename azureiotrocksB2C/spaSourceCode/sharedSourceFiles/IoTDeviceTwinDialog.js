const modelAnalyzer=require("./modelAnalyzer")
const simpleSelectMenu= require("./simpleSelectMenu")
const msalHelper=require("../msalHelper")

function IoTDeviceTwinDialog() {
    if(!this.DOM){
        this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:99" class="w3-card-2"></div>')
        $("body").append(this.DOM)
        this.DOM.hide()
    }
}

IoTDeviceTwinDialog.prototype.popup = async function(twinInfo) {
    this.twinInfo=twinInfo
    this.DOM.show()
    this.DOM.empty()
    this.contentDOM = $('<div style="width:505px"></div>')
    this.DOM.append(this.contentDOM)
    this.contentDOM.append($('<div style="height:40px" class="w3-bar w3-red"><div class="w3-bar-item" style="font-size:1.5em">Digital Twin Editor</div></div>'))
    var closeButton = $('<button class="w3-bar-item w3-button w3-right" style="font-size:2em;padding-top:4px">×</button>')
    this.contentDOM.children(':first').append(closeButton)
    closeButton.on("click", () => { this.DOM.hide() })

    if(!twinInfo["id"]) var btnText="Add New Twin"//this is for creating new twin
    else btnText="Confirm" //this is when editing a existed twin
        
    var okButton = $('<button class="w3-button w3-card w3-green w3-hover-light-green" style="height:100%">'+btnText+'</button>')    
    this.contentDOM.children(':first').append(okButton)
    okButton.on("click", async () => {
        
    })
    
    var dialogDOM=$('<div />')
    this.contentDOM.append(dialogDOM)
    var IDLableDiv= $("<div class='w3-padding' style='display:inline;padding:.1em .3em .1em .3em; font-weight:bold;color:black'>Twin ID</div>")
    var IDInput=$('<input type="text" style="margin:8px 0;padding:2px;width:50%;outline:none;display:inline" placeholder="ID"/>').addClass("w3-input w3-border");  
    
    var modelLableDiv= $("<div class='w3-padding' style='display:inline;padding:.1em .3em .1em .3em; font-weight:bold;color:black'>Model</div>")
    var modelInput=$('<div type="text" style="margin:8px 0;padding:2px;display:inline"/>').text(twinInfo.modelID);  
    dialogDOM.append($("<div/>").append(IDLableDiv,IDInput))
    dialogDOM.append($("<div/>").append(modelLableDiv,modelInput))
    
    var isIoTCheck= $('<input class="w3-margin w3-check" type="checkbox">')
    var isIoTText = $('<label class="w3-dark-gray" style="padding:2px 8px;font-size:1.2em;border-radius: 3px;"> This is NOT a IoT Device</label>')
    dialogDOM.append(isIoTCheck,isIoTText)

    var IoTSettingDiv=$("<div class='w3-container w3-border' style='width:100%;max-height:300px;overflow:auto'></div>")
    this.IoTSettingDiv=IoTSettingDiv
    IoTSettingDiv.hide()
    dialogDOM.append(IoTSettingDiv)
    this.drawIoTSettings()

    isIoTCheck.on("change",()=>{
        if(isIoTCheck.prop('checked')) {
            var theHeight= IoTSettingDiv.height()
            isIoTText.removeClass("w3-dark-gray").addClass("w3-lime")
            isIoTText.text("This is a IoT Device")

            IoTSettingDiv.css("height","0px")
            IoTSettingDiv.show()
            IoTSettingDiv.animate({"height":theHeight+10+"px"})
        }else {
            isIoTText.removeClass("w3-lime").addClass("w3-dark-gray")
            isIoTText.text("This is NOT a IoT Device")
            IoTSettingDiv.animate({"height":"0px"},()=>{IoTSettingDiv.css("height","");IoTSettingDiv.hide()})
        }
    })
}

IoTDeviceTwinDialog.prototype.drawIoTSettings = async function() {
    var modelID = this.twinInfo.modelID
    var modelDetail= modelAnalyzer.DTDLModels[modelID]
    this.copyModelEditableProperty=JSON.parse(JSON.stringify(modelDetail.editableProperties))
    this.iotSettingsArr=[]
    
    var iotTable=$('<table style="width:100%" cellspacing="0px" cellpadding="0px"></table>')
    iotTable.append($('<tr><td style="font-weight:bold;width:30%">IoT Setting</td><td style="font-weight:bold">Parameter Tree</td></tr>'))
    this.IoTSettingDiv.append(iotTable)

    var initialPathArr=[]
    this.drawEditable(iotTable,this.copyModelEditableProperty,initialPathArr,false)
}

IoTDeviceTwinDialog.prototype.drawEditable = async function(parentTable,jsonInfo,pathArr,islastRootNode) {
    if(jsonInfo==null) return;
    var arr=[]
    for(var ind in jsonInfo) arr.push(ind)

    for(var theIndex=0;theIndex<arr.length;theIndex++){
        if(pathArr.length==0 && theIndex==arr.length-1) islastRootNode=true;
        var ind = arr[theIndex]
        var tr=$("<tr/>")
        var leftTD=$("<td/>")
        var rightTD=$("<td style='height:30px'/>")
        tr.append(leftTD,rightTD)
        parentTable.append(tr)
        
        
        for(var i=0;i<pathArr.length;i++){
            if(i==0 && !islastRootNode) rightTD.append(this.treeLineDiv(2))
            else rightTD.append(this.treeLineDiv(4))
        }

        if(theIndex==arr.length-1) rightTD.append(this.treeLineDiv(3))
        else rightTD.append(this.treeLineDiv(1))

        //var textIndent= pathArr.length*20
        //rightTD.css({"padding-left":textIndent+"px"})

        rightTD.append($("<div style='display:inline;line-height:28px;margin-left:3px'>"+ind+"</div>"))
        var newPath=pathArr.concat([ind])

        if(Array.isArray(jsonInfo[ind])){ //it is a enumerator
            var typeDOM=$("<label class='w3-dark-gray' style='font-size:9px;padding:2px;margin-left:5px'>enum</label>")
            rightTD.append(typeDOM)
            var valueArr=[]
            jsonInfo[ind].forEach(ele=>{valueArr.push(ele.enumValue)})
            var label1=$("<label class='w3-dark-gray' style='font-size:9px;padding:2px;margin-left:2px'>"+valueArr.join()+"</label>")
            rightTD.append(label1)
        }else if(typeof(jsonInfo[ind])==="object") {
            this.drawEditable(parentTable,jsonInfo[ind],newPath,islastRootNode)
        }else {
            var typeDOM=$("<label class='w3-dark-gray' style='font-size:9px;padding:2px;margin-left:5px'>"+jsonInfo[ind]+"</label>")
            rightTD.append(typeDOM)
        } 
    }
}

IoTDeviceTwinDialog.prototype.treeLineDiv = function(typeNumber) {
    var reDiv=$('<div style="margin-left:10px;width:15px;height: 100%;float: left"></div>')
    if(typeNumber==1){
        reDiv.append($('<div class="w3-border-bottom w3-border-left" style="width:100%;height:50%;"></div><div class="w3-border-left" style="width:100%;height:50%;"></div>'))
    }else if(typeNumber==2){
        reDiv.append($('<div class="w3-border-left" style="width:100%;height:50%;"></div><div class="w3-border-left" style="width:100%;height:50%;"></div>'))
    }else if(typeNumber==3){
        reDiv.append($('<div class="w3-border-bottom w3-border-left" style="width:100%;height:50%;">'))
    }else if(typeNumber==4){
        
    }
    return reDiv
}

module.exports = new IoTDeviceTwinDialog();