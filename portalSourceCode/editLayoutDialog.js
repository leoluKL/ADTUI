const adtInstanceSelectionDialog = require("./adtInstanceSelectionDialog")

function editLayoutDialog() {
    if($("#editLayoutDialog").length==0){
        this.DOM = $('<div id="editLayoutDialog" title="Layouts"></div>')
        this.DOM.css("overflow","visible")
        $("body").append(this.DOM)
    }
    this.layoutJSON={}
    this.currentLayoutName=null
}

editLayoutDialog.prototype.getCurADTName=function(){
    var adtName = adtInstanceSelectionDialog.selectedADT
    var str = adtName.replace("https://", "")
    return str
}

editLayoutDialog.prototype.rxMessage=function(msgPayload){
    if(msgPayload.message=="ADTDatasourceChange_replace") {
        try{
            $.post("layout/readLayouts",{adtName:this.getCurADTName()}, (data, status) => {
                if(data!="" && typeof(data)==="object") this.layoutJSON=data;
                else this.layoutJSON={};
                this.broadcastMessage({ "message": "layoutsUpdated"})
            })
        }catch(e){
            console.log(e)
        }
    
    }
}

editLayoutDialog.prototype.refillOptions = function () {
    this.switchLayoutSelector.html(
        '<option disabled selected>Choose Layout...</option>'
    )

    for(var ind in this.layoutJSON){
        var anOption=$("<option>"+ind+"</option>")
        this.switchLayoutSelector.append(anOption)
    }
    this.switchLayoutSelector.selectmenu( "refresh" );
}

editLayoutDialog.prototype.popup = function () {
    this.DOM.empty()

    var switchLayoutSelector=$('<select></select>')
    this.switchLayoutSelector=switchLayoutSelector
    this.DOM.append(switchLayoutSelector)
    switchLayoutSelector.selectmenu({
        appendTo: this.DOM,
        change: (event, ui) => { }
    });
    this.refillOptions()
        
    var saveAsBtn=$('<a class="ui-button ui-widget ui-corner-all" href="#">Save As</a>')
    var deleteBtn=$('<a class="ui-button ui-widget ui-corner-all" href="#">Delete</a>')
    this.DOM.append(saveAsBtn,deleteBtn)
    saveAsBtn.on("click",()=>{this.saveIntoLayout(switchLayoutSelector.val())})
    deleteBtn.on("click",()=>{this.deleteLayout(switchLayoutSelector.val())})

    var lbl=$("<label style='display:block;width:100%;margin-top:1.3em;margin-bottom:1.3em;text-align: center'>- OR -</label>")
    this.DOM.append(lbl) 

    var nameInput=$('<input style="margin-right:1em;height:25px"/>').addClass("ui-corner-all");
    this.DOM.append(nameInput)
    var saveAsNewBtn=$('<a class="ui-button ui-widget ui-corner-all" href="#">Save As New</a>')
    this.DOM.append(saveAsNewBtn)
    saveAsNewBtn.on("click",()=>{this.saveIntoLayout(nameInput.val())})

    this.DOM.dialog({ 
        width:400
        ,height:160
        ,resizable:false
        ,buttons: []
    })
    

    if(this.currentLayoutName!=null){
        switchLayoutSelector.val(this.currentLayoutName)
    }
    
    switchLayoutSelector.selectmenu("refresh")
    
}

editLayoutDialog.prototype.saveIntoLayout = function (layoutName) {
    if(layoutName=="" || layoutName==null){
        alert("Please choose target layout Name")
        return
    }
    this.broadcastMessage({ "message": "saveLayout", "layoutName": layoutName, "adtName":this.getCurADTName() })
    this.DOM.dialog( "close" );
}


editLayoutDialog.prototype.deleteLayout = function (layoutName) {
    if(layoutName=="" || layoutName==null){
        alert("Please choose target layout Name")
        return;
    }
    var confirmDialogDiv=$("<div/>")
    confirmDialogDiv.text("Do you confirm to delete layout \"" + layoutName + "\"?")
    $('body').append(confirmDialogDiv)
    confirmDialogDiv.dialog({
        buttons: [
            {
                text: "Confirm",
                click: () => {
                    delete this.layoutJSON[layoutName]
                    this.broadcastMessage({ "message": "layoutsUpdated"})
                    $.post("layout/saveLayouts",{"adtName":this.getCurADTName(),"layouts":JSON.stringify(this.layoutJSON)})
                    confirmDialogDiv.dialog("destroy");
                    this.refillOptions()
                }
            },
            {
                text: "Cancel", click: () => { confirmDialogDiv.dialog("destroy"); }
            }
        ]
    });
}

module.exports = new editLayoutDialog();