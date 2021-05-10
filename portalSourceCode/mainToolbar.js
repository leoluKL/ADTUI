const adtInstanceSelectionDialog = require("./adtInstanceSelectionDialog")
const modelManagerDialog = require("./modelManagerDialog")
const editLayoutDialog= require("./editLayoutDialog")


function mainToolbar() {
    this.switchADTInstanceBtn=$('<a class="ui-button ui-widget ui-corner-all" href="#">Source</a>')
    this.modelIOBtn=$('<a class="ui-button ui-widget ui-corner-all" href="#">Models</a>')
    this.showForgeViewBtn=$('<a class="ui-button ui-widget ui-corner-all" href="#">ForgeView</a>')
    this.showGISViewBtn=$('<a class="ui-button ui-widget ui-corner-all" href="#">GISView</a>')
    this.editLayoutBtn=$('<a class="ui-button ui-widget ui-corner-all" href="#">Edit Layout</a>')
    this.switchLayoutSelector=$('<select></select>')

    $("#mainToolBar").empty()
    $("#mainToolBar").append(this.switchADTInstanceBtn,this.modelIOBtn,this.showForgeViewBtn,this.showGISViewBtn
        ,this.editLayoutBtn,this.switchLayoutSelector)

    this.showForgeViewBtn.attr("disabled", true).addClass("ui-state-disabled");
    this.showGISViewBtn.attr("disabled", true).addClass("ui-state-disabled");

    this.switchADTInstanceBtn.click(()=>{ adtInstanceSelectionDialog.popup() })
    this.modelIOBtn.click(()=>{ modelManagerDialog.popup() })
    this.editLayoutBtn.click(()=>{ editLayoutDialog.popup() })

    this.switchLayoutSelector.selectmenu({
        change: (event, ui) => {
            editLayoutDialog.currentLayoutName=ui.item.value
            this.broadcastMessage({ "message": "layoutChange"})
        }
    });
}

mainToolbar.prototype.updateLayoutSelector = function () {
    var currentLayoutName = this.switchLayoutSelector.val()
    this.switchLayoutSelector.html(
        '<option disabled selected>Choose Layout...</option><option selected>[Donot Use Layout]</option>'
    )
    for (var ind in editLayoutDialog.layoutJSON) {
        var anOption = $("<option>" + ind + "</option>")
        this.switchLayoutSelector.append(anOption)
    }
    //restore back to previous value
    if(currentLayoutName!=null) this.switchLayoutSelector.val(currentLayoutName)
   
    this.switchLayoutSelector.selectmenu("refresh");
}

mainToolbar.prototype.rxMessage=function(msgPayload){
    if(msgPayload.message=="layoutsUpdated") {
        this.updateLayoutSelector()
    }
}

module.exports = new mainToolbar();