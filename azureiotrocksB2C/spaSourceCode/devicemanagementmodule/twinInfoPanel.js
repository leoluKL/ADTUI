const globalCache = require("../sharedSourceFiles/globalCache")
const msalHelper = require("../msalHelper")
const baseInfoPanel = require("../sharedSourceFiles/baseInfoPanel")
const simpleExpandableSection= require("../sharedSourceFiles/simpleExpandableSection")

class twinInfoPanel extends baseInfoPanel{
    constructor() {
        super()
        this.openFunctionButtonSection=true
        this.openPropertiesSection=true
        this.DOM = $("#InfoContent")
        this.drawButtons(null)
        this.selectedObjects = null;
    }

    async rxMessage(msgPayload) {
        var tt=this.abc+1
        
        if (msgPayload.message == "showInfoSelectedDevices") {
            this.DOM.empty()
            var arr = msgPayload.info;

            if (arr == null || arr.length == 0) {
                this.drawButtons(null)
                this.selectedObjects = [];
                return;
            }
            this.selectedObjects = arr;
            if (arr.length == 1) {
                this.drawButtons("singleNode")
                var singleDBTwinInfo = arr[0];
                var modelID = singleDBTwinInfo.modelID

                if (!globalCache.storedTwins[singleDBTwinInfo.id]) {
                    //query all twins of this parent model if they havenot been queried from ADT yet
                    var twinIDs = []
                    for(var twinID in globalCache.DBTwins){
                        var ele=globalCache.DBTwins[twinID]
                        if (ele.modelID == modelID) twinIDs.push(ele.id)
                    }
                    var twinsData = await msalHelper.callAPI("digitaltwin/listTwinsForIDs", "POST", twinIDs)
                    globalCache.storeADTTwins(twinsData)
                }

                var singleADTTwinInfo = globalCache.storedTwins[singleDBTwinInfo.id] 
                var propertiesSection= new simpleExpandableSection("Properties Section",this.DOM)
                propertiesSection.callBack_change=(status)=>{this.openPropertiesSection=status}
                if(this.openPropertiesSection) propertiesSection.expand()
                this.drawSingleNodeProperties(singleDBTwinInfo,singleADTTwinInfo,propertiesSection.listDOM)
            } else if (arr.length > 1) {
                this.drawButtons("multiple")
                var textDiv = $("<label style='display:block;margin-top:10px;margin-left:16px'></label>")
                textDiv.text(arr.length + " node" + ((arr.length <= 1) ? "" : "s"))
                this.DOM.append(textDiv)
            }
        }
    }

    drawButtons(selectType){
        if(selectType==null){
            this.DOM.html("<div style='padding:8px'><a style='display:block;font-style:italic;color:gray'>Define IoT setting in model so its twin type can be mapped to physical IoT device type</a><a style='display:block;font-style:italic;color:gray;padding-top:20px;padding-bottom:20px'>Press ctrl or shift key to select multiple twins</a></div>")
            return;
        }

        var buttonSection= new simpleExpandableSection("Function Buttons Section",this.DOM,{"marginTop":0})
        buttonSection.callBack_change=(status)=>{this.openFunctionButtonSection=status}
        if(this.openFunctionButtonSection) buttonSection.expand()

        var delBtn =  $('<button style="width:45%" class="w3-ripple w3-button w3-red w3-hover-pink w3-border">Delete All</button>')
        buttonSection.listDOM.append(delBtn)
        //delBtn.on("click",()=>{this.deleteSelected()})
        var latestTelemetryBtn=$('<button style="width:45%"  class="w3-ripple w3-button w3-border">Telemetry</button>')
        buttonSection.listDOM.append(latestTelemetryBtn)
    
        var allAreIOT=true
        for(var i=0;i<this.selectedObjects.length;i++){
            var modelID=this.selectedObjects[i].modelID
            var theDBModel=globalCache.getSingleDBModelByID(modelID)
            if(!theDBModel.isIoTDeviceModel){
                allAreIOT=false
                break;
            }
        }
    
        if(allAreIOT){
            var provisionBtn =$('<button style="width:45%"  class="w3-ripple w3-button w3-border">IoT Provision</button>')
            var deprovisionBtn =$('<button style="width:45%"  class="w3-ripple w3-button w3-border">IoT Deprovision</button>')
            buttonSection.listDOM.append(provisionBtn,deprovisionBtn)
            
            if(selectType=="singleNode"){
                var sampleCodeBtn =$('<button style="width:90%"  class="w3-ripple w3-button w3-border">Sample Code</button>')
                buttonSection.listDOM.append(sampleCodeBtn) 
            }
        }
    
        if(selectType=="singleNode"){
            var refreshBtn =$('<button style="width:45%"  class="w3-ripple w3-button w3-border">Refresh</button>')
            var inputSimulationBtn =$('<button style="width:45%"  class="w3-ripple w3-button w3-border">Input Simulation</button>')
            buttonSection.listDOM.append(refreshBtn,inputSimulationBtn)
        }
        
    }
}


module.exports = new twinInfoPanel();