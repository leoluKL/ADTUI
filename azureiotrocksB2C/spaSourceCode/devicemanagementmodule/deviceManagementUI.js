'use strict';
const globalAppSettings = require("../globalAppSettings.js");
const msalHelper=require("../msalHelper")
const deviceManagementMainToolbar = require("./deviceManagementMainToolbar")

function deviceManagementUI() {
    deviceManagementMainToolbar.render()
}


module.exports = new deviceManagementUI();