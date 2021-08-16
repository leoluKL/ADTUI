const globalCache = require("../sharedSourceFiles/globalCache")
const msalHelper=require("../msalHelper")

function topologyDOM_simDataSource(parentTopologyDOM){
    this.parentTopologyDOM=parentTopologyDOM
    this.core=this.parentTopologyDOM.core
    this.runningSimDataSource={}

}

topologyDOM_simDataSource.prototype.startSimNode=function(ele){
    var simNodeInfo=ele.data("originalInfo")
    this.refreshRealSimNodeInfoFromDBTwin(simNodeInfo)
    this.runningSimDataSource[simNodeInfo.simNodeName]=simNodeInfo
    ele.addClass("running")
}

topologyDOM_simDataSource.prototype.stopSimNode=function(ele){
    var simNodeInfo=ele.data("originalInfo")
    this.refreshRealSimNodeInfoFromDBTwin(simNodeInfo)
    delete this.runningSimDataSource[simNodeInfo.simNodeName]
    ele.removeClass("running")
}

topologyDOM_simDataSource.prototype.refreshRealSimNodeInfoFromDBTwin = function (simNodeInfo) {
    var attachTwinID = simNodeInfo["twinID"]
    var dbtwin = globalCache.DBTwins[attachTwinID]
    var simNodeName = simNodeInfo["simNodeName"]
    simNodeInfo.detail = dbtwin.simulate[simNodeName]
}

topologyDOM_simDataSource.prototype.newSimulatorSource = function (twinName) {
    //add a simulator data source node beside the clicked twin
    var simNodeName= globalCache.uuidv4()
    var twinID=globalCache.twinDisplayNameMapToID[twinName]
    var newSim={
        "propertyPath":null
    }
    this.parentTopologyDOM.visualManager.showSimulatorSource(twinID,simNodeName,newSim)

    //write the simulate node infomation to database
    try {
        var dbtwin=globalCache.DBTwins[twinID]
        var allSims= dbtwin.simulate||{}
        allSims[simNodeName]=newSim
        dbtwin.simulate=allSims
        msalHelper.callAPI("digitaltwin/updateTwin", "POST"
            , {"twinID":twinID,"updateInfo":JSON.stringify({"simulate":allSims})}
            , "withProjectID")
    } catch (e) {
        console.log(e)
        if (e.responseText) alert(e.responseText)
    }
}

topologyDOM_simDataSource.prototype.deleteSimNode=function(simNodeInfo){
    var twinID=simNodeInfo.twinID
    var simNodeName=simNodeInfo.simNodeName
    var dbTwin= globalCache.DBTwins[twinID]
    if(dbTwin && dbTwin.simulate){
        delete dbTwin.simulate[simNodeName]
        try {
            msalHelper.callAPI("digitaltwin/updateTwin", "POST"
                , {"twinID":twinID,"updateInfo":JSON.stringify({"simulate":dbTwin.simulate})}
                , "withProjectID")
            this.core.$('[id = "'+simNodeName+'"]').remove() 
        } catch (e) {
            console.log(e)
            if (e.responseText) alert(e.responseText)
        }
    }
}


module.exports = topologyDOM_simDataSource;