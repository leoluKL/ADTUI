function globalCache(){
    this.storedOutboundRelationships = {}
    this.storedTwins = {}

    this.currentLayoutName=null
    this.layoutJSON={}

    this.selectedADT=null;

    this.visualDefinition={}

    this.showFloatInfoPanel=true
}

globalCache.prototype.storeTwinRelationships=function(relationsData){
    relationsData.forEach((oneRelationship)=>{
        var twinID=oneRelationship['$sourceId']
        this.storedOutboundRelationships[twinID]=[]
    })

    relationsData.forEach((oneRelationship)=>{
        this.storedOutboundRelationships[oneRelationship['$sourceId']].push(oneRelationship)
    })
}

globalCache.prototype.storeTwinRelationships_append=function(relationsData){
    relationsData.forEach((oneRelationship)=>{
        if(!this.storedOutboundRelationships[oneRelationship['$sourceId']])
            this.storedOutboundRelationships[oneRelationship['$sourceId']]=[]
        this.storedOutboundRelationships[oneRelationship['$sourceId']].push(oneRelationship)
    })
}

globalCache.prototype.storeTwinRelationships_remove=function(relationsData){
    relationsData.forEach((oneRelationship)=>{
        var srcID=oneRelationship["srcID"]
        if(this.storedOutboundRelationships[srcID]){
            var arr=this.storedOutboundRelationships[srcID]
            for(var i=0;i<arr.length;i++){
                if(arr[i]['$relationshipId']==oneRelationship["relID"]){
                    arr.splice(i,1)
                    break;
                }
            }
        }
    })
}

globalCache.prototype.makeDOMDraggable=function(dom,ignoreChildDomType){
    ignoreChildDomType=ignoreChildDomType||["LABEL","TD","B","A","INPUT","PRE"]
    dom.on('mousedown',(e)=>{
        if(ignoreChildDomType.indexOf(e.target.tagName)!=-1) return;
        var domOffset=dom.offset()
        dom.mouseStartDragOffset=[domOffset.left-e.clientX, domOffset.top-e.clientY]
        $('body').on('mouseup',()=>{
            dom.mouseStartDragOffset=null
            $('body').off('mousemove')
            $('body').off('mouseup')
        })
        $('body').on('mousemove',(e)=>{
            e.preventDefault()
            if(dom.mouseStartDragOffset){
                var newLeft= e.clientX+dom.mouseStartDragOffset[0]
                var newTop=e.clientY+dom.mouseStartDragOffset[1]
                dom.css({"left":newLeft+"px","top":newTop+"px","transform":"none"})
            }
        })
    })
}
module.exports = new globalCache();