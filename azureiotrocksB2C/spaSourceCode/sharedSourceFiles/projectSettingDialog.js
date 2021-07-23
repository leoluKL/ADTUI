const globalCache=require("./globalCache")
const msalHelper=require("../msalHelper")

function projectSettingDialog() {
    if(!this.DOM){
        this.DOM = $('<div style="position:absolute;top:50%;background-color:white;left:50%;transform: translateX(-50%) translateY(-50%);z-index:101" class="w3-card-2"></div>')
        $("body").append(this.DOM)
        this.DOM.hide()
    }
}

projectSettingDialog.prototype.popup = function (projectInfo) {
    this.DOM.show()
    if(this.contentInitialized)return;
    this.contentInitialized=true; 
    this.DOM.css({"width":"420px","padding-bottom":"3px"})
    this.DOM.append($('<div style="height:40px;margin-bottom:2px" class="w3-bar w3-red"><div class="w3-bar-item" style="font-size:1.2em">Setting</div></div>'))
    var closeButton = $('<button class="w3-bar-item w3-button w3-right" style="font-size:2em;padding-top:4px">×</button>')
    this.DOM.children(':first').append(closeButton)
    closeButton.on("click", () => { this.DOM.hide() })

    var tabControl=$('<div class="w3-bar w3-light-gray"></div>')
    var layoutBtn=$('<button class="w3-bar-item w3-button " style="margin:0px 5px">Layout</button>')
    var visualSchemaBtn=$('<button class="w3-bar-item w3-button">Visual Schema</button>')
    tabControl.append(layoutBtn,visualSchemaBtn)
    this.DOM.append(tabControl)

    this.layoutContentDiv=$('<div class="w3-animate-opacity" style="padding:10px;display:none"></div>')
    this.visualSchemaContentDiv=$('<div class="w3-animate-opacity" style="padding:10px;display:none">Visual Schema</div>')
    this.DOM.append(this.layoutContentDiv,this.visualSchemaContentDiv)
    this.fillLayoutDivContent()

    layoutBtn.on("click",()=>{
        layoutBtn.addClass("w3-dark-grey")
        visualSchemaBtn.removeClass("w3-dark-grey")
        this.visualSchemaContentDiv.hide()
        this.layoutContentDiv.show()
    })

    visualSchemaBtn.on("click",()=>{
        layoutBtn.removeClass("w3-dark-grey")
        visualSchemaBtn.addClass("w3-dark-grey")
        this.visualSchemaContentDiv.show()
        this.layoutContentDiv.hide()
    })

    layoutBtn.trigger("click")
}

projectSettingDialog.prototype.fillLayoutDivContent = function () {
    var showOtherUserLayoutCheck = $('<input class="w3-check" style="width:20px;margin-left:10px;margin-right:10px" type="checkbox">')
    var showOtherUserLayoutText = $('<label style="padding:2px 8px;">Show shared layouts from Other Users</label>')
    this.layoutContentDiv.append(showOtherUserLayoutCheck, showOtherUserLayoutText)

    var layoutsDiv=$('<div class="w3-border" style="margin-top:10px;max-height:200px;overflow-x:hidden;overflow-y:auto"></div>')
    this.layoutContentDiv.append(layoutsDiv)
    this.layoutsDiv=layoutsDiv
    for (var ind in globalCache.layoutJSON) {
        this.addOneLayoutBar(ind,layoutsDiv)
    }
}

projectSettingDialog.prototype.addOneLayoutBar=function(layoutName,parentDiv){
    var oneLayout=$('<a href="#" class="w3-bar w3-button w3-border-bottom"></a>')
    parentDiv.append(oneLayout)

    var nameLbl=$('<a class="w3-bar-item w3-button" href="#">'+layoutName+'</a>')
    var defaultLbl=$("<a class='w3-lime w3-bar-item' style='font-size:9px;padding:1px 2px;margin-top:9px;border-radius: 2px;'>default</a>")
    defaultLbl.hide()
    oneLayout.data("layoutName",layoutName)
    oneLayout.data("defaultLbl",defaultLbl)
    oneLayout.append(nameLbl,defaultLbl)

    var shareBtn=$('<button class="w3-bar-item w3-button w3-right w3-hover-amber">Share</button>')
    var deleteBtn=$('<button class="w3-bar-item w3-button w3-right w3-hover-amber"><i class="fa fa-trash fa-lg"></i></button>')
    oneLayout.append(deleteBtn,shareBtn)
    shareBtn.hide()
    deleteBtn.hide()

    oneLayout.hover(()=>{
        shareBtn.show()
        deleteBtn.show()
    },()=>{
        shareBtn.hide()
        deleteBtn.hide()
    })

    oneLayout.on("click",()=>{
        this.setAsDefaultLayout(oneLayout)
    })

    deleteBtn.on("click",()=>{
        console.log("delete "+layoutName)
        return false
    })
    shareBtn.on("click",()=>{
        console.log("share "+layoutName)
        return false
    })
}

projectSettingDialog.prototype.setAsDefaultLayout=function(oneLayoutDOM){
    this.layoutsDiv.children('a').each((index,aLayout)=>{
        var defaultLbl= $(aLayout).data("defaultLbl")
        defaultLbl.hide()
    })
    var defaultLbl=oneLayoutDOM.data("defaultLbl")
    defaultLbl.show()

    var layoutName=oneLayoutDOM.data("layoutName")
    var curProjectID=globalCache.currentProjectID
    
    var joinedProjects=globalCache.accountInfo.joinedProjects
    for(var i=0;i<joinedProjects.length;i++){
        var oneProject=joinedProjects[i]
        if(oneProject.id==curProjectID){
            oneProject.defaultLayout=layoutName
            //update database
            
            break;
        }
    }
}

module.exports = new projectSettingDialog();