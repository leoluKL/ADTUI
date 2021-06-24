const globalCache = require("../sharedSourceFiles/globalCache");

function singleModelTwinsList(singleDBModel,parentTwinsList) {
    this.parentTwinsList=parentTwinsList
    this.info=singleDBModel
    this.childTwins={}
    this.name=singleDBModel.displayName;
    this.createDOM()
}

singleModelTwinsList.prototype.createDOM=function(){
    this.DOM=$("<div></div>")
    this.parentTwinsList.DOM.append(this.DOM)

    this.headerDOM=$('<button class="w3-button w3-block w3-light-grey w3-left-align w3-border-bottom"></button>')
    this.refreshName()
    this.listDOM=$('<div class="w3-container w3-hide w3-border w3-padding-16"></div>')
    this.DOM.append(this.headerDOM,this.listDOM)

    this.headerDOM.on("click",(evt)=> {
        if(this.listDOM.hasClass("w3-show")) this.listDOM.removeClass("w3-show")
        else this.listDOM.addClass("w3-show")
        return false;
    });

    //fill in the twins under this model
    var twins=[]
    globalCache.DBTwinsArr.forEach(aTwin=>{
        if(aTwin.modelID==this.info.id) twins.push(aTwin)
    })
    twins.sort(function (a, b) { 
        var aName=a.displayName.toLowerCase()
        var bName=b.displayName.toLowerCase()
        return aName.localeCompare(bName) 
    });
    twins.forEach(aTwin=>{
        this.childTwins[aTwin.id]=new singleTwinIcon(aTwin,this)
    })
}

singleModelTwinsList.prototype.refreshName=function(){
    this.headerDOM.empty()
    var nameDiv=$("<div class='w3-text-dark-gray' style='display:inline;padding-right:3px;vertical-align:middle;font-weight:bold;color:darkgray'></div>")
    nameDiv.text(this.name)
    
    this.headerDOM.append(nameDiv)
}

singleModelTwinsList.prototype.refreshTwinsIcon=function(){
    for(var twinID in this.childTwins) this.childTwins[twinID].redrawIcon()
}


//--------------------------------------------------------------------------------------

function singleTwinIcon(singleDBTwin,parentModelTwins) {
    this.twinInfo=singleDBTwin
    this.parentModelTwins=parentModelTwins
    this.DOM=$("<div class='w3-hover-amber'  style='width:80px;float:left;height:100px;margin:8px;cursor:default'/>")
    this.iconDOM=$("<div style='width:30px;height:30px;margin:0 auto;margin-top:20px;position:relative'></div>")
    this.nameDOM=$("<div style='word-break: break-word;width:100%;text-align:center;margin-top:5px'>"+this.twinInfo.displayName+"</div>")
    this.redrawIcon()
    parentModelTwins.listDOM.append(this.DOM)
    this.DOM.append(this.iconDOM,this.nameDOM)
}

singleTwinIcon.prototype.redrawIcon=function(){
    this.iconDOM.empty()
    var modelID= this.twinInfo.modelID;

    var visualJson=globalCache.visualDefinition["default"]
    var fillColor="gray"
    if(visualJson[modelID].color) fillColor=visualJson[modelID].color
    var dimension=30;
    if(visualJson[modelID].dimensionRatio){
        dimension*=parseFloat(visualJson[modelID].dimensionRatio)
        this.iconDOM.css({"width":dimension+"px","height":dimension+"px"})
    } 
    var shape="ellipse"
    if(visualJson[modelID].shape) shape=visualJson[modelID].shape
    var avarta=null
    if(visualJson[modelID].avarta) avarta=visualJson[modelID].avarta

    var imgSrc=this.shapeSvg(shape,fillColor)

    this.iconDOM.append($("<img src='data:image/svg+xml;utf8,"+imgSrc+"'></img>"))
    if(avarta){
        var avartaimg=$("<img style='position:absolute;left:0px;width:70%;margin:15%' src='"+avarta+"'></img>")
        this.iconDOM.append(avartaimg)
    }
    this.nameDOM.text()
}


singleTwinIcon.prototype.shapeSvg=function(shape,color){//round-rectangle":"▉","hexagon
    if(shape=="ellipse"){
        return '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" version="1.1" ><circle cx="50" cy="50" r="50"  fill="'+color+'"/></svg>'
    }else if(shape=="hexagon"){
        return '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 110" fill="none" version="1.1" ><polygon points="50 3, 100 28, 100 75, 50 100, 3 75, 3 25"  fill="'+color+'" /></svg>'
    }else if(shape=="round-rectangle"){
        return '<svg xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" version="1.1" ><rect x="10" y="10" rx="10" ry="10" width="80" height="80" fill="'+color+'" /></svg>'
    }
}

module.exports = singleModelTwinsList;