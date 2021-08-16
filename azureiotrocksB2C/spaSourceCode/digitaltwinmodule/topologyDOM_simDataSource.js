const globalCache = require("../sharedSourceFiles/globalCache")
const msalHelper=require("../msalHelper")

function topologyDOM_simDataSource(parentTopologyDOM){
    this.parentTopologyDOM=parentTopologyDOM
    this.core=this.parentTopologyDOM.core
    this.runningSimDataSource={}

}

topologyDOM_simDataSource.prototype.startSimNode=async function(ele){
    var simNodeInfo=ele.data("originalInfo")
    this.refreshRealSimNodeInfoFromDBTwin(simNodeInfo)
    
    //check if anyone else is using the simulation datasource
    if(simNodeInfo.detail.propertyPath=="" || simNodeInfo.detail.propertyPath==null ){
        alert("There is no definition of simulating property")
        return;
    }

    var _T = parseFloat(simNodeInfo.detail["cycleLength"])
    var sampling = parseFloat(simNodeInfo.detail["sampleInterval"])
    var formula = simNodeInfo.detail["formula"]
    if(_T==0 || sampling==0 || formula=="" || _T==null || sampling==null || formula==null || _T<0 || sampling<0){
        alert("Incorrect simulation setting")
        return;
    }

    var _t=0;
    var dataArr=[]
    var _output=null;
    while(_t<_T){
        var evalStr=formula+"\n_output"
        try{
            _output=eval(evalStr) // jshint ignore:line
        }catch(e){}
        dataArr.push(_output)
        _t+=sampling
    }
    if(dataArr.length==0){
        alert("There is no output from the simulation formula.")
        return;
    }

    var payload={
        "propertyPathStr": simNodeInfo.detail.propertyPath.join("."), 
        "twinID":simNodeInfo.twinID
    }
    try {
        
        var checkResult = await msalHelper.callAPI("digitaltwin/checkSimulationDataSource", "POST", payload)
        if(checkResult.account){
            alert("Can not start simulation as "+checkResult.account+" is simulating this node. Please try again later...")
        }else{
            var dblockTimer=setInterval(()=>{
                msalHelper.callAPI("digitaltwin/updateSimulationDataSource", "POST", payload)
            },40000) //every 40 second, update the record in simulation container again, it serves as a lock so other ppl will not start the simulation repeatly
            var numberIndex=0;
            var simTimer=setInterval(()=>{
                if(numberIndex>=dataArr.length) numberIndex=0
                this.editDTProperty(globalCache.storedTwins[simNodeInfo.twinID],simNodeInfo.detail.propertyPath,dataArr[numberIndex])
                numberIndex++
            },parseInt(sampling*1000))

            this.runningSimDataSource[simNodeInfo.simNodeName]={
                "dblockTimer":dblockTimer,
                "simTimer":simTimer
            }
            ele.addClass("running")
        }
    } catch (e) {
        console.log(e)
        if (e.responseText) alert(e.responseText)
    }
}

topologyDOM_simDataSource.prototype.editDTProperty=function(dtTwinInfo, path, newVal) {
    //{ "op": "add", "path": "/x", "value": 30 }
    var str = ""
    path.forEach(segment => { str += "/" + segment })
    var jsonPatch = [{ "op": "add", "path": str, "value": newVal }]

    var twinID = dtTwinInfo["$dtId"]
    var payLoad = { "jsonPatch": JSON.stringify(jsonPatch), "twinID": twinID }

    //console.log(payLoad)
    msalHelper.callAPI("digitaltwin/changeAttribute", "POST", payLoad)
}

topologyDOM_simDataSource.prototype.updateOriginObjectValue=function(nodeInfo, pathArr, newVal) {
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



topologyDOM_simDataSource.prototype.stopSimNode=function(ele){
    var simNodeInfo=ele.data("originalInfo")
    this.refreshRealSimNodeInfoFromDBTwin(simNodeInfo)
    var simTimer=this.runningSimDataSource[simNodeInfo.simNodeName].simTimer
    if(simTimer) clearInterval(simTimer)
    var dblockTimer=this.runningSimDataSource[simNodeInfo.simNodeName].dblockTimer
    if(dblockTimer) clearInterval(dblockTimer)

    var payload={
        "propertyPathStr": simNodeInfo.detail.propertyPath.join("."), 
        "twinID":simNodeInfo.twinID
    }
    msalHelper.callAPI("digitaltwin/deleteSimulationDataSourceLock", "POST", payload)

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