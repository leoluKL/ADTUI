const simpleChart= require("../sharedSourceFiles/simpleChart")
const globalCache = require("../sharedSourceFiles/globalCache")
function infoPanel_liveMonitor(parentInfoPanel){
    this.liveMonitorCharts={}
    this.liveContentDiv = parentInfoPanel.liveContentDiv
    this.parentInfoPanel=parentInfoPanel
}

infoPanel_liveMonitor.prototype.showBlank=function(){
    if(Object.keys(this.liveMonitorCharts).length==0){
        this.liveContentDiv.append($('<div class="w3-text-gray w3-padding">No twin is monitored.</div>'))
    }
}


infoPanel_liveMonitor.prototype.addChart=function(twinID,propertyPath){
    if(Object.keys(this.liveMonitorCharts).length==0) this.liveContentDiv.empty() //remove the label indicate there is no twin 
    var id=this.getChartID(twinID,propertyPath)
    if(this.liveMonitorCharts[id]!=null) return  //the chart is already there
    var customDrawing=(chartDOM)=>{
        var twinName=globalCache.twinIDMapToDisplayName[twinID]
        var twinLabel=$("<label class='w3-lime' style='display:inline;font-size:9px;padding:2px 4px;font-weight:normal;border-radius: 2px;'>"+twinName+"</label>")
        var propertyLabel=$("<label class='w3-gray' style='display:inline;font-size:9px;padding:2px 4px;font-weight:normal;border-radius: 2px;'>"+propertyPath.join(".")+"</label>")

        var removeButton = $('<button class="w3-bar-item w3-right w3-button w3-text-red w3-hover-amber" style="margin-right:13px;padding:2px"><i class="fa fa-trash fa-lg"></i></button>')

        removeButton.on("click",()=>{
            this.liveMonitorCharts[id].destroy()
            delete this.liveMonitorCharts[id]
            this.parentInfoPanel.broadcastMessage({"message": "removeLiveMonitor","twinID":twinID,"propertyPath":propertyPath})
            this.showBlank()
        })

        chartDOM.append(twinLabel,propertyLabel,removeButton) 
    }
    this.liveMonitorCharts[id]=new simpleChart(this.liveContentDiv,60,{width:"100%",height:"100px"},customDrawing)
}

infoPanel_liveMonitor.prototype.drawNewData=function(twinID,propertyPath,value,time){
    var id=this.getChartID(twinID,propertyPath)
    if(!this.liveMonitorCharts[id]) return;
    var ts=parseInt(Date.parse(time)/1000)
    var theChart=this.liveMonitorCharts[id]
    theChart.addDataValue(ts,value)
}

infoPanel_liveMonitor.prototype.getChartID=function(twinID,propertyPath){
    return twinID+"."+propertyPath.join(".")
}



module.exports = infoPanel_liveMonitor;