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

    var IoTSettingDiv=$("<div class='w3-container w3-border' style='width:100%;height:0px;overflow:auto'></div>")
    IoTSettingDiv.hide()
    dialogDOM.append(IoTSettingDiv)
    this.drawIoTSettings()

    isIoTCheck.on("change",()=>{
        if(isIoTCheck.prop('checked')) {
            isIoTText.removeClass("w3-dark-gray").addClass("w3-lime")
            isIoTText.text("This is a IoT Device")
            IoTSettingDiv.show()
            IoTSettingDiv.animate({"height":"100px"})
        }else {
            isIoTText.removeClass("w3-lime").addClass("w3-dark-gray")
            isIoTText.text("This is NOT a IoT Device")
            IoTSettingDiv.animate({"height":"0px"},()=>{IoTSettingDiv.hide()})
        }
    })
}

IoTDeviceTwinDialog.prototype.drawIoTSettings = async function() {
    var modelID = this.twinInfo.modelID
    var modelDetail= modelAnalyzer.DTDLModels[modelID]
    console.log(modelDetail)
}

module.exports = new IoTDeviceTwinDialog();