'use strict';

var topologyDOM=require("./topologyDOM.js")

function initF() {
    console.log("init function.")

    var topologyInstance=new topologyDOM($('#canvas'))
    topologyInstance.init()

}



module.exports = initF