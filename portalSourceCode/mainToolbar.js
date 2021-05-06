const adtInstanceSelectionDialog = require("./adtInstanceSelectionDialog")
const modelManagerDialog = require("./modelManagerDialog")

function mainToolbar() {
    this.switchADTInstanceBtn=$('<a class="ui-button ui-widget ui-corner-all" href="#">Source</a>')
    this.modelIOBtn=$('<a class="ui-button ui-widget ui-corner-all" href="#">Models</a>')
    this.showForgeViewBtn=$('<a class="ui-button ui-widget ui-corner-all" href="#">ForgeView</a>')
    this.showGISViewBtn=$('<a class="ui-button ui-widget ui-corner-all" href="#">GISView</a>')
    this.switchLayoutSelector=$('<select></select>')

    $("#mainToolBar").empty()
    $("#mainToolBar").append(this.switchADTInstanceBtn,this.modelIOBtn,this.showForgeViewBtn,this.showGISViewBtn,this.switchLayoutSelector)


    this.switchADTInstanceBtn.click(()=>{ adtInstanceSelectionDialog.popup() })
    this.modelIOBtn.click(()=>{ modelManagerDialog.popup() })

    this.switchLayoutSelector.html(
        '<option disabled selected>Choose Layout...</option><option selected>Default</option><option>Custom1</option><option>+ New layout</option>'
    )
    this.switchLayoutSelector.selectmenu({
        change: (event, ui) => {
            console.log(ui.item.value)
        }
    });
}

module.exports = mainToolbar;