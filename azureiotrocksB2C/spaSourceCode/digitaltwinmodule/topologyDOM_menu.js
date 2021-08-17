function topologyDOM_menu(parentTopologyDOM){
    this.parentTopologyDOM=parentTopologyDOM
    this.core=parentTopologyDOM.core
    this.contenxtMenuInstance = this.core.contextMenus('get')
    this.addMenuItemsForEditing()
    this.addMenuItemsForOthers()
    this.addMenuItemsForLiveData()
}

topologyDOM_menu.prototype.decideVisibleContextMenu=function(clickEle){
    //hide all menu items
    var allItems=['ConnectTo','ConnectFrom','QueryOutbound','QueryInbound','SelectOutbound','SelectInbound','enableLiveDataStream','COSE','addSimulatingDataSource','liveData','Hide','Others','Simulation', 'startSimulatingDataSource', 'stopSimulatingDataSource', 'editing','DeleteAll']
    allItems.forEach(ele=>{this.contenxtMenuInstance.hideMenuItem(ele)})
    
    var selectedNodes=this.core.$('node:selected')
    var selected=this.core.$(':selected')
    var isClickingNode=(clickEle.isNode && clickEle.isNode() )
    var hasNode=isClickingNode || (selectedNodes.length>0)
    if(clickEle.isNode && clickEle.data("originalInfo") && clickEle.data("originalInfo").simNodeName) var clickSimNode=true
    
    var showMenuArr=(arr)=>{
        arr.forEach(ele=>{this.contenxtMenuInstance.showMenuItem(ele)})
    }

    if(clickSimNode) {
        var simNodeName=clickEle.data('originalInfo').simNodeName
        showMenuArr(['editing','DeleteAll','Simulation'])
        if(this.parentTopologyDOM.simDataSourceManager.runningSimDataSource[simNodeName]){
            showMenuArr(['stopSimulatingDataSource'])
        }else showMenuArr(['startSimulatingDataSource'])
    }else{
        if(hasNode){
            showMenuArr(['editing','ConnectTo','ConnectFrom','Others','QueryOutbound','QueryInbound','SelectOutbound','SelectInbound','Hide','DeleteAll'])
            if(isClickingNode) showMenuArr(['liveData','enableLiveDataStream','addSimulatingDataSource'])
            if(selected.length>1) showMenuArr(['COSE'])
        }
        if(!hasNode && !clickEle.data().notTwin) showMenuArr(['editing','DeleteAll'])
    }
}

topologyDOM_menu.prototype.addMenuItemsForLiveData = function () {
    this.contenxtMenuInstance.appendMenuItems([
        {
            id: 'liveData',
            content: 'Live Data',
            selector: 'node',
            disabled:true,
            onClickFunction: ()=>{}//empty func, it is only a menu title item
        },
        {
            id: 'Simulation',
            content: 'Simulation',
            selector: 'node[modelID = "_fixed_simulationDataSource"]',
            disabled:true,
            onClickFunction: ()=>{}//empty func, it is only a menu title item
        },
        {
            id: 'startSimulatingDataSource',
            content: 'Start',
            selector: 'node[modelID = "_fixed_simulationDataSource"]',
            onClickFunction: (e) => {
                this.selectClickedEle(e.target)
                var target = e.target || e.cyTarget;
                this.parentTopologyDOM.simDataSourceManager.startSimNode(e.target)
            }
        },
        {
            id: 'stopSimulatingDataSource',
            content: 'Stop',
            selector: 'node[modelID = "_fixed_simulationDataSource"]',
            onClickFunction: (e) => {
                this.selectClickedEle(e.target)
                var target = e.target || e.cyTarget;
                this.parentTopologyDOM.simDataSourceManager.stopSimNode(e.target)
            }
        },
        {
            id: 'addSimulatingDataSource',
            content: 'Add Simulator Source',
            selector: 'node',
            onClickFunction: (e) => {
                this.selectClickedEle(e.target)
                var target = e.target || e.cyTarget;
                this.parentTopologyDOM.addSimulatorSource(target.id())
            }
        },
        {
            id: 'enableLiveDataStream',
            content: 'Monitor Live Data',
            selector: 'node', 
            onClickFunction: (e) => {
                this.selectClickedEle(e.target)
                var target = e.target || e.cyTarget;
                this.parentTopologyDOM.enableLiveDataStream(target.id())
            }
        }
    ])
}

topologyDOM_menu.prototype.addMenuItemsForEditing = function () {
    this.contenxtMenuInstance.appendMenuItems([
        {
            id: 'editing',
            content: 'Edit',
            selector: 'node,edge',
            disabled:true,
            onClickFunction: ()=>{}//empty func, it is only a menu title item
        },
        {
            id: 'ConnectTo',
            content: 'Connect To',
            selector: 'node,edge',
            onClickFunction: (e) => {
                this.parentTopologyDOM.startTargetNodeMode("connectTo",this.node_changeSelectionWhenClickElement(e.target))
            }
        },
        {
            id: 'ConnectFrom',
            content: 'Connect From',
            selector: 'node,edge',
            onClickFunction: (e) => {
                this.parentTopologyDOM.startTargetNodeMode("connectFrom",this.node_changeSelectionWhenClickElement(e.target))
            }
        },
        {
            id: 'DeleteAll',
            content: 'Delete',
            selector: 'node,edge',
            onClickFunction: (e) => {
                var collection=this.nodeoredge_changeSelectionWhenClickElement(e.target)
                collection.unselect()
                this.parentTopologyDOM.selectFunction()
                if(collection.length==1){
                    var ele=collection[0]
                    if(ele.data && ele.data("originalInfo").simNodeName){
                        this.parentTopologyDOM.deleteSimNode(ele.data("originalInfo"))
                        return
                    }
                }
                this.parentTopologyDOM.deleteElementsArray(collection)
            }
        }
    ])
}

topologyDOM_menu.prototype.addMenuItemsForOthers = function () {
    this.contenxtMenuInstance.appendMenuItems([
        {
            id: 'Others',
            content: 'Others', 
            selector: 'node,edge',
            disabled:true,
            onClickFunction: ()=>{} //empty func, it is only a menu title item
        },
        {
            id: 'QueryOutbound',
            content: 'Load Outbound',
            selector: 'node,edge',
            onClickFunction: (e) => {
                this.parentTopologyDOM.loadOutBound(this.node_changeSelectionWhenClickElement(e.target))
            }
        },
        {
            id: 'QueryInbound',
            content: 'Load Inbound', 
            selector: 'node,edge',
            onClickFunction: (e) => {
                this.parentTopologyDOM.loadInBound(this.node_changeSelectionWhenClickElement(e.target))
            }
        },{
            id: 'SelectOutbound',
            content: '+Select Outbound',
            selector: 'node,edge',
            onClickFunction: (e) => {
                this.parentTopologyDOM.selectOutboundNodes(this.node_changeSelectionWhenClickElement(e.target))
            }
        },
        {
            id: 'SelectInbound',
            content: '+Select Inbound',
            selector: 'node,edge',
            onClickFunction: (e) => {
                this.parentTopologyDOM.selectInboundNodes(this.node_changeSelectionWhenClickElement(e.target))
            }
        },
        {
            id: 'COSE',
            content: 'COSE Layout',
            selector: 'node,edge',
            onClickFunction: (e) => {
                this.parentTopologyDOM.coseSelected()
            }
        },
        {
            id: 'Hide',
            content: 'Hide',
            selector: 'node,edge',
            onClickFunction: (e) => {
                var collection=this.node_changeSelectionWhenClickElement(e.target)
                this.parentTopologyDOM.hideCollection(collection)
            }
        }
    ])
}


topologyDOM_menu.prototype.selectElement=function(element){
    element.select()
    this.parentTopologyDOM.selectFunction()
}

topologyDOM_menu.prototype.selectIfClickEleIsNotSelected=function(clickEle){
    if(!clickEle.selected()){
        this.core.$(':selected').unselect()
        this.selectElement(clickEle)
    }
}

topologyDOM_menu.prototype.selectClickedEle=function(clickEle){
    this.core.$(':selected').unselect()
    this.selectElement(clickEle)
}

topologyDOM_menu.prototype.node_changeSelectionWhenClickElement=function(clickEle){
    if(clickEle.isNode && clickEle.isNode()){
        this.selectIfClickEleIsNotSelected(clickEle)
    }
    var arr=this.core.$(':selected')
    return arr
}
topologyDOM_menu.prototype.nodeoredge_changeSelectionWhenClickElement=function(clickEle){
    if(clickEle.isNode){ //at least having isnode function means it is node or edge
        this.selectIfClickEleIsNotSelected(clickEle)
    }
    var arr=this.core.$(':selected')
    return arr
}



module.exports = topologyDOM_menu;