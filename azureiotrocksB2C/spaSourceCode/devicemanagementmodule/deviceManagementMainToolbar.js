const moduleSwitchDialog=require("../sharedSourceFiles/moduleSwitchDialog")


function deviceManagementMainToolbar() {
}

deviceManagementMainToolbar.prototype.render = function () {
    $("#MainToolbar").empty()
    $("#MainToolbar").append(moduleSwitchDialog.modulesSidebar)
    $("#MainToolbar").append(moduleSwitchDialog.modulesSwitchButton)
}

module.exports = new deviceManagementMainToolbar();