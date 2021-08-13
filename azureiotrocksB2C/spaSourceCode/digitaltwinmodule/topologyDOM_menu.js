function topologyDOM_menu(parentTopologyDOM){
    this.parentTopologyDOM=parentTopologyDOM
    this.core=parentTopologyDOM.core
    this.contenxtMenuInstance = this.core.contextMenus('get')
    this.addMenuItemsForEditing()
    this.addMenuItemsForOthers()
    this.addMenuItemsForLiveData()
}

topologyDOM_menu.prototype.decideVisibleContextMenu=function(clickEle){
    //restore all menu items
    this.contenxtMenuInstance.showMenuItem('ConnectTo');
    this.contenxtMenuInstance.showMenuItem('ConnectFrom');
    this.contenxtMenuInstance.showMenuItem('QueryOutbound');
    this.contenxtMenuInstance.showMenuItem('QueryInbound');
    this.contenxtMenuInstance.showMenuItem('SelectOutbound');
    this.contenxtMenuInstance.showMenuItem('SelectInbound');
    this.contenxtMenuInstance.showMenuItem('enableLiveDataStream');
    this.contenxtMenuInstance.showMenuItem('COSE');
    this.contenxtMenuInstance.showMenuItem('addSimulatingDataSource');
    this.contenxtMenuInstance.showMenuItem('liveData');
    this.contenxtMenuInstance.showMenuItem('Hide');
    this.contenxtMenuInstance.showMenuItem('Others');

    var selectedNodes=this.core.$('node:selected')
    var selected=this.core.$(':selected')
    var isClickingNode=(clickEle.isNode && clickEle.isNode() )
    var hasNode=isClickingNode || (selectedNodes.length>0)
    
    if(clickEle.isNode && clickEle.data().notTwin) var clickSpecialNode=true
    


    if(!hasNode || clickSpecialNode){
        this.contenxtMenuInstance.hideMenuItem('ConnectTo');
        this.contenxtMenuInstance.hideMenuItem('ConnectFrom'); 
        this.contenxtMenuInstance.hideMenuItem('QueryOutbound');
        this.contenxtMenuInstance.hideMenuItem('QueryInbound');
        this.contenxtMenuInstance.hideMenuItem('SelectOutbound');
        this.contenxtMenuInstance.hideMenuItem('SelectInbound');
        this.contenxtMenuInstance.hideMenuItem('Hide');
        this.contenxtMenuInstance.hideMenuItem('Others');
    }
    if(!isClickingNode|| clickSpecialNode){
        this.contenxtMenuInstance.hideMenuItem('liveData');
        this.contenxtMenuInstance.hideMenuItem('enableLiveDataStream');
        this.contenxtMenuInstance.hideMenuItem('addSimulatingDataSource');
    }

    if(selected.length<=1 || clickSpecialNode) this.contenxtMenuInstance.hideMenuItem('COSE');
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
                
            }
        },
        {
            id: 'stopSimulatingDataSource',
            content: 'Stop',
            selector: 'node[modelID = "_fixed_simulationDataSource"]',
            onClickFunction: (e) => {
                this.selectClickedEle(e.target)
                var target = e.target || e.cyTarget;
                
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
                this.parentTopologyDOM.deleteElementsArray(this.nodeoredge_changeSelectionWhenClickElement(e.target) )
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


topologyDOM_menu.prototype.selectIfClickEleIsNotSelected=function(clickEle){
    if(!clickEle.selected()){
        this.core.$(':selected').unselect()
        clickEle.select()
    }
}

topologyDOM_menu.prototype.selectClickedEle=function(clickEle){
    this.core.$(':selected').unselect()
    clickEle.select()
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