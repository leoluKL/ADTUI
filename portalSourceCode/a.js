bFunc=require("./b.js")
var s=function(){
    var i=2;
    i++;
    i++;
}
module.exports = function () {s(); bFunc(); console.log("a22") }