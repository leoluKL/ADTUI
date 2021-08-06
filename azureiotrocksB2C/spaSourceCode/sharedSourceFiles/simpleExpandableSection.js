function simpleExpandableSection(titleStr,parentDOM,options) {
    this.expandStatus=false
    options=options||{}
    var marginTop=10
    if(options.marginTop!=null) marginTop=options.marginTop
    this.headerDOM = $(`<button class="w3-button w3-block w3-light-grey w3-left-align w3-border-bottom w3-hover-amber w3-text-gray" style="margin-top:${marginTop}px;font-weight:bold"><a>${titleStr}</a><i class="w3-margin-left fas fa-caret-up"></i></button>`)
    this.listDOM = $('<div class="w3-container w3-hide" style="padding-top:2px"></div>')

    this.headerTextDOM=this.headerDOM.children(":first")

    this.triangle=this.headerDOM.children('i').eq(0)
    parentDOM.append(this.headerDOM, this.listDOM)
    this.headerDOM.on("click", (evt) => {
        if(this.expandStatus) this.shrink()
        else this.expand()
        this.callBack_change(this.expandStatus)
        return false;
    });
    this.callBack_change=(status)=>{}
}

simpleExpandableSection.prototype.expand=function(){
    this.listDOM.addClass("w3-show")
    this.triangle.addClass("fa-caret-down")
    this.triangle.removeClass("fa-caret-up")
    this.expandStatus = true
}

simpleExpandableSection.prototype.shrink=function(){
    this.listDOM.removeClass("w3-show")
    this.triangle.removeClass("fa-caret-down")
    this.triangle.addClass("fa-caret-up")
    this.expandStatus = false
}

module.exports = simpleExpandableSection;