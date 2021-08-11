const globalCache=require("./globalCache")
const msalHelper=require("../msalHelper")
const simpleConfirmDialog = require("./simpleConfirmDialog")

function projectSettingDialog() {
    if(!this.DOM){
        this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:101" class="w3-card-2"></div>')
        $("body").append(this.DOM)
        this.DOM.hide()
        globalCache.makeDOMDraggable(this.DOM)
    }
}

projectSettingDialog.prototype.rxMessage=function(msgPayload){
    if(msgPayload.message=="projectIsChanged"){
        this.contentInitialized=false
        this.DOM.empty()
        this.DOM.hide()
    }
}

projectSettingDialog.prototype.popup = function () {
    this.DOM.show()
    if(this.contentInitialized)return;
    this.contentInitialized=true; 
    this.DOM.css({"width":"420px","padding-bottom":"3px"})
    this.DOM.append($('<div style="height:40px;margin-bottom:2px" class="w3-bar w3-red"><div class="w3-bar-item" style="font-size:1.2em">Setting</div></div>'))
    var closeButton = $('<button class="w3-bar-item w3-button w3-right" style="font-size:2em;padding-top:4px">×</button>')
    this.DOM.children(':first').append(closeButton)
    closeButton.on("click", () => { this.DOM.hide() })

    var tabControl=$('<div class="w3-bar w3-light-gray"></div>')
    var layoutBtn=$('<button class="w3-bar-item w3-button ">Layout</button>')
    var visualSchemaBtn=$('<button class="w3-bar-item w3-button">Visual Schema</button>')
    tabControl.append(layoutBtn,visualSchemaBtn)
    this.DOM.append(tabControl)

    this.layoutContentDiv=$('<div class="w3-animate-opacity" style="padding:10px;display:none"></div>')
    this.visualSchemaContentDiv=$('<div class="w3-animate-opacity" style="padding:10px;display:none"></div>')
    this.DOM.append(this.layoutContentDiv,this.visualSchemaContentDiv)
    this.fillLayoutDivContent()
    this.fillVisualSchemaContent()

    layoutBtn.on("click",()=>{
        layoutBtn.addClass("w3-white")
        visualSchemaBtn.removeClass("w3-white")
        this.visualSchemaContentDiv.hide()
        this.layoutContentDiv.show()
    })

    visualSchemaBtn.on("click",()=>{
        layoutBtn.removeClass("w3-white")
        visualSchemaBtn.addClass("w3-white")
        this.visualSchemaContentDiv.show()
        this.layoutContentDiv.hide()
    })

    layoutBtn.trigger("click")
}

projectSettingDialog.prototype.fillLayoutDivContent = function () {
    var showOtherUserLayoutCheck = $('<input class="w3-check" style="width:20px;margin-left:10px;margin-right:10px" type="checkbox">')
    var showOtherUserLayoutText = $('<label style="padding:2px 8px;">Show shared layouts from other users</label>')
    this.layoutContentDiv.append(showOtherUserLayoutCheck, showOtherUserLayoutText)
    if(this.showSharedLayouts) showOtherUserLayoutCheck.prop( "checked", true );
    showOtherUserLayoutCheck.on("change",()=>{
        this.showSharedLayouts=showOtherUserLayoutCheck.prop('checked')
        this.refillLayouts()
    })


    var layoutsDiv=$('<div class="w3-border" style="margin-top:10px;max-height:200px;overflow-x:hidden;overflow-y:auto"></div>')
    this.layoutContentDiv.append(layoutsDiv)
    this.layoutsDiv=layoutsDiv

    this.refillLayouts()
}


projectSettingDialog.prototype.fillVisualSchemaContent= function () {
    var shareSelfVisualSchemaCheck = $('<input class="w3-check" style="width:20px;margin-left:10px;margin-right:10px" type="checkbox">')
    var shareSelfVisualSchemaText = $('<label style="padding:2px 8px;">Share my own visual legend</label>')
    this.visualSchemaContentDiv.append(shareSelfVisualSchemaCheck, shareSelfVisualSchemaText)

    if(globalCache.visualDefinition["default"].isShared) shareSelfVisualSchemaCheck.prop( "checked", true );
    
    shareSelfVisualSchemaCheck.on("change", async () => {
        globalCache.visualDefinition["default"].isShared=shareSelfVisualSchemaCheck.prop('checked')

        var visualSchemaName = "default" //fixed in current version, there is only "default" schema for each user
        try {
            await msalHelper.callAPI("digitaltwin/setVisualSchemaSharedFlag", "POST", { "visualSchema": visualSchemaName, "isShared": shareSelfVisualSchemaCheck.prop('checked') }, "withProjectID")
        } catch (e) {
            console.log(e)
            if (e.responseText) alert(e.responseText)
        }
    })

    var visualSchemaDiv=$('<div class="w3-border" style="margin-top:10px;max-height:200px;overflow-x:hidden;overflow-y:auto"></div>')
    this.visualSchemaContentDiv.append(visualSchemaDiv)
    this.visualSchemaDiv=visualSchemaDiv

    this.refillVisualSchemas()
}

projectSettingDialog.prototype.refillVisualSchemas=function(){
    this.visualSchemaDiv.empty()
    var selfSchema
    for (var ind in globalCache.visualDefinition) {
        var oneSchema=globalCache.visualDefinition[ind]
        if(oneSchema.owner!=null && oneSchema.owner!=globalCache.accountInfo.id) this.addOneVisualSchema(oneSchema,this.visualSchemaDiv)
        else selfSchema=oneSchema
    }
    this.addOneVisualSchema(selfSchema,this.visualSchemaDiv)
}

projectSettingDialog.prototype.addOneVisualSchema=function(oneSchemaObj,parentDiv){
    var owner= oneSchemaObj.owner || globalCache.accountInfo.id
    
    var oneSchemaRow=$('<a href="#" class="w3-bar w3-button w3-border-bottom"></a>')
    parentDiv.append(oneSchemaRow)
    var lblStr=(owner==globalCache.accountInfo.id)?"Self":"Shared by "+owner
    //var nameLbl=$('<a style="text-align:left;color:grey;margin:5px 0px;display:block">'+lblStr+'</a>')
    var titleRow=$('<a href="#" class="w3-bar w3-text-grey"  ></a>')
    oneSchemaRow.append(titleRow)
    var nameLbl=$('<a class="w3-bar-item w3-button" >'+lblStr+'</a>')
    var copyBtn=$('<button class="w3-ripple w3-bar-item w3-button w3-right w3-lime w3-hover-amber">Copy</button>')
    titleRow.append(nameLbl)
    if(owner!=globalCache.accountInfo.id) titleRow.append(copyBtn)

    var detail=oneSchemaObj.detail

    copyBtn.on("click", async ()=>{
        //replace self visual schema
        globalCache.visualDefinition["default"].detail=JSON.parse(JSON.stringify(detail))
        this.refillVisualSchemas()
        try{
            await msalHelper.callAPI("digitaltwin/saveVisualDefinition", "POST", {"visualDefinitionJson":JSON.stringify(detail)},"withProjectID")
        }catch(e){
            console.log(e)
            if(e.responseText) alert(e.responseText)
        }
    })

    for(var modelID in detail){
        var visualJson=detail[modelID]
        var avarta = null
        var dimension = 20;
        var colorCode = visualJson.color || "darkGray"
        var secondColor=visualJson.secondColor
        var shape = visualJson.shape || "ellipse"
        var avarta = visualJson.avarta
        if (visualJson.dimensionRatio) dimension *= parseFloat(visualJson.dimensionRatio)
        var iconDOM = $("<div style='width:" + dimension + "px;height:" + dimension + "px;float:left;position:relative'></div>")
        var imgSrc = encodeURIComponent(globalCache.shapeSvg(shape, colorCode,secondColor))
        iconDOM.append($("<img src='data:image/svg+xml;utf8," + imgSrc + "'></img>"))
        if (avarta) {
            var avartaimg = $("<img style='position:absolute;left:0px;width:60%;margin:20%' src='" + avarta + "'></img>")
            iconDOM.append(avartaimg)
        }
        oneSchemaRow.append(iconDOM)
    }

}

projectSettingDialog.prototype.refillLayouts=function(){
    this.layoutsDiv.empty()
    var projectInfo=globalCache.findProjectInfo(globalCache.currentProjectID)
    var defaultLayoutName=projectInfo.defaultLayout

    if(this.showSharedLayouts){
        for (var ind in globalCache.layoutJSON) {
            var oneLayoutObj=globalCache.layoutJSON[ind]
            if(oneLayoutObj.owner!=globalCache.accountInfo.id) {
                this.addOneLayoutBar(oneLayoutObj,this.layoutsDiv,defaultLayoutName)
            }
        }
    }
    for (var ind in globalCache.layoutJSON) {
        var oneLayoutObj=globalCache.layoutJSON[ind]
        if(oneLayoutObj.owner!=globalCache.accountInfo.id) continue
        this.addOneLayoutBar(oneLayoutObj,this.layoutsDiv,defaultLayoutName)
    }
    
}

projectSettingDialog.prototype.addOneLayoutBar=function(oneLayoutObj,parentDiv,defaultLayoutName){
    var layoutName = oneLayoutObj.name
    var sharedFlag = oneLayoutObj.isShared

    var selfLayout=(oneLayoutObj.owner==globalCache.accountInfo.id)

    var oneLayout=$('<a href="#" class="w3-bar w3-button w3-border-bottom"></a>')
    parentDiv.append(oneLayout)

    var nameLbl=$('<a class="w3-bar-item w3-button" href="#">'+layoutName+'</a>')
    var defaultLbl=$("<a class='w3-bar-item' style='font-size:9px;padding:1px 2px;margin-top:9px;border-radius: 2px;'></a>")
    
    oneLayout.data("layoutObj",oneLayoutObj)

    oneLayout.data("defaultLbl",defaultLbl)
    oneLayout.append(nameLbl,defaultLbl)

    if(layoutName!=defaultLayoutName) this.showAsNotDefaultLayoutLbl(oneLayout)
    else this.showAsDefaultLayoutLbl(oneLayout)

    if(selfLayout){
        var str=(sharedFlag)?"Shared":"Share"
        var shareBtn=$('<button class="w3-ripple w3-bar-item w3-button w3-right w3-hover-amber">'+str+'</button>')
        oneLayout.data("shareBtn",shareBtn)
        
        var deleteBtn=$('<button class="w3-bar-item w3-button w3-right w3-hover-amber"><i class="fa fa-trash fa-lg"></i></button>')
        oneLayout.append(shareBtn,deleteBtn)
        if(!sharedFlag) shareBtn.hide()
        deleteBtn.hide()
    
        oneLayout.hover(()=>{
            oneLayout.data("defaultLbl").show()
            var isShared=oneLayout.data("layoutObj").isShared
            if(!isShared) shareBtn.show()
            deleteBtn.show()
        },()=>{
            if(!oneLayout.data("defaultLbl").hasClass("w3-lime")) oneLayout.data("defaultLbl").hide()
            var isShared=oneLayout.data("layoutObj").isShared
            if(!isShared) shareBtn.hide()
            deleteBtn.hide()
        })
        oneLayout.on("click",()=>{
            var projectInfo=globalCache.findProjectInfo(globalCache.currentProjectID)
            console.log(projectInfo.defaultLayout)
            if(layoutName!=projectInfo.defaultLayout) this.setAsDefaultLayout(oneLayout)
            else this.setAsDefaultLayout()
        })
        deleteBtn.on("click",()=>{
            this.deleteLayout(oneLayout)
            return false
        })
        shareBtn.on("click",()=>{
            this.clickShareLayoutBtn(oneLayout)
            return false
        })    
    }else{
        oneLayout.addClass("w3-gray","w3-hover-gray")
        var copyBtn=$('<button class="w3-ripple w3-bar-item w3-button w3-right w3-lime w3-hover-amber">Copy</button>')
        oneLayout.append(copyBtn)
        copyBtn.on("click",()=>{
            this.copyLayout(oneLayout.data("layoutObj"))
            return false
        }) 
    }    
}

projectSettingDialog.prototype.copyLayout=async function(dict){
    var layoutDict=dict.detail
    if(layoutDict["edges"]==null) layoutDict["edges"]={}    
    var saveLayoutObj={"layouts":{}}
    saveLayoutObj["layouts"][dict.oname]=JSON.stringify(layoutDict)  

    globalCache.recordSingleLayout(layoutDict,globalCache.accountInfo.id,dict.oname,false)
    try{
        await msalHelper.callAPI("digitaltwin/saveLayout", "POST", saveLayoutObj,"withProjectID")
        this.broadcastMessage({ "message": "layoutsUpdated"})
        this.refillLayouts()
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
    }
}

projectSettingDialog.prototype.clickShareLayoutBtn=async function(oneLayoutDOM){
    var isShared=oneLayoutDOM.data("layoutObj").isShared
    var theBtn=oneLayoutDOM.data("shareBtn")
    isShared=!isShared
    oneLayoutDOM.data("layoutObj").isShared=isShared
    if(!isShared) theBtn.text("Share")
    else theBtn.text("Shared")
    
    var layoutName=oneLayoutDOM.data("layoutObj").name 
    try {
        await msalHelper.callAPI("digitaltwin/setLayoutSharedFlag", "POST", {"layout":layoutName,"isShared":isShared },"withProjectID")
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
    } 
}


projectSettingDialog.prototype.deleteLayout=async function(oneLayoutDOM){
    var layoutName=oneLayoutDOM.data("layoutObj").name 
    var confirmDialogDiv=new simpleConfirmDialog()

    confirmDialogDiv.show(
        { width: "250px" },
        {
            title: "Confirm"
            , content: "Confirm deleting layout \"" + layoutName + "\"?"
            , buttons:[
                {
                    colorClass: "w3-red w3-hover-pink", text: "Confirm", "clickFunc": async () => {
                        delete globalCache.layoutJSON[layoutName]
                        if (layoutName == globalCache.currentLayoutName) globalCache.currentLayoutName = null
                        confirmDialogDiv.close()
                        this.broadcastMessage({ "message": "layoutsUpdated"})
                        oneLayoutDOM.remove()
                        try{
                            await msalHelper.callAPI("digitaltwin/deleteLayout", "POST", { "layoutName": layoutName },"withProjectID")
                        }catch(e){
                            console.log(e)
                            if(e.responseText) alert(e.responseText)
                        }
                    }
                },
                {
                    colorClass: "w3-gray",text: "Cancel", "clickFunc": () => {
                        confirmDialogDiv.close()
                }}
            ]
        }
    )
}

projectSettingDialog.prototype.showAsDefaultLayoutLbl=async function(oneLayoutDOM){
    var defaultLbl=oneLayoutDOM.data("defaultLbl")
    defaultLbl.show()
    defaultLbl.text("Default")
    defaultLbl.addClass("w3-lime")
}

projectSettingDialog.prototype.showAsNotDefaultLayoutLbl=async function(oneLayoutDOM){
    var defaultLbl=oneLayoutDOM.data("defaultLbl")
    defaultLbl.hide()
    defaultLbl.text("Set As Default")
    defaultLbl.removeClass("w3-lime")
}

projectSettingDialog.prototype.setAsDefaultLayout=async function(oneLayoutDOM){
    this.layoutsDiv.children('a').each((index,aLayout)=>{
        this.showAsNotDefaultLayoutLbl($(aLayout))
    })

    if(oneLayoutDOM==null){ //remove default layout
        var layoutName=""
    }else{
        this.showAsDefaultLayoutLbl($(oneLayoutDOM))
        layoutName=oneLayoutDOM.data("layoutObj").name 
    }
       
    var projectInfo=globalCache.findProjectInfo(globalCache.currentProjectID)
    projectInfo.defaultLayout=layoutName
    //update database
    try {
        await msalHelper.callAPI("accountManagement/setProjectDefaultLayout", "POST", {"defaultLayout":layoutName },"withProjectID")
    }catch(e){
        console.log(e)
        if(e.responseText) alert(e.responseText)
    } 
}

module.exports = new projectSettingDialog();