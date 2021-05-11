const modelAnalyzer=require("./modelAnalyzer")
const adtInstanceSelectionDialog = require("./adtInstanceSelectionDialog")
function modelManagerDialog() {
    this.visualDefinition={}
    this.models={}
    if($("#modelManagerDialog").length==0){
        this.DOM = $('<div id="modelManagerDialog" title="Models"></div>')
        this.DOM.css("overflow","hidden")
        $("body").append(this.DOM)
    }
}

modelManagerDialog.prototype.preparationFunc = async function () {
    return new Promise((resolve, reject) => {
        try{
            $.get("visualDefinition/readVisualDefinition", (data, status) => {
                if(data!="" && typeof(data)==="object") this.visualDefinition=data;
                resolve()
            })
        }catch(e){
            reject(e)
        }
    })
}

modelManagerDialog.prototype.popup = async function() {
    this.DOM.empty()

    var importModelsBtn = $('<a class="ui-button ui-widget ui-corner-all" href="#">Import</a>')
    var actualImportModelsBtn =$('<input type="file" name="modelFiles" multiple="multiple" style="display:none"></input>')

    this.DOM.append(importModelsBtn,actualImportModelsBtn)
    importModelsBtn.click( ()=>{
        actualImportModelsBtn.trigger('click');
    });
    actualImportModelsBtn.change((evt)=>{
        var files = evt.target.files; // FileList object
        this.readModelFilesContentAndImport(files)
    })

    var leftSpan = $("<span/>")
    this.DOM.append(leftSpan)
    leftSpan.css({ "position": "absolute", left: "0px", bottom: "0px", top: "40px", border: "solid 1px grey", padding: "5px", "overflow-x": "hidden", "overflow-y": "auto", "width": "195px" })
    var modelList = $("<ol  style='width:100%'/>")
    leftSpan.append(modelList)
    modelList.selectable();
    this.modelList = modelList;
    modelList.selectable({
        selected: (event, ui) => {
            var modelName = $(ui.selected).data('modelName')
            this.fillRightSpan(modelName)
        }
    })

    var rightSpan=$("<span/>") 
    rightSpan.css({"position":"absolute",left:"210px",bottom: "0px",top:"5px",right:"0px",border:"solid 1px grey",padding:"5px",
    "overflow-x": "hidden", "overflow-y": "auto"})
    this.DOM.append(rightSpan)
    this.rightSpan=rightSpan;
    rightSpan.addClass("ui-accordion ui-widget ui-helper-reset")

    this.DOM.dialog({ 
        width:650
        ,height:500
        ,resizable:false
        ,buttons: []
    })
    this.listModels()

}

modelManagerDialog.prototype.resizeImgFile = async function(theFile,max_size) {
    return new Promise((resolve, reject) => {
        try {
            var reader = new FileReader();
            var tmpImg = new Image();
            reader.onload = () => {
                tmpImg.onload =  ()=> {
                    var canvas = document.createElement('canvas')
                    var width = tmpImg.width
                    var height = tmpImg.height;
                    if (width > height) {
                        if (width > max_size) {
                            height *= max_size / width;
                            width = max_size;
                        }
                    } else {
                        if (height > max_size) {
                            width *= max_size / height;
                            height = max_size;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    canvas.getContext('2d').drawImage(tmpImg, 0, 0, width, height);
                    var dataUrl = canvas.toDataURL('image/png');
                    resolve(dataUrl)
                }
                tmpImg.src = reader.result;
            }
            reader.readAsDataURL(theFile);
        } catch (e) {
            reject(e)
        }
    })
}

modelManagerDialog.prototype.fillRightSpan=async function(modelName){
    this.rightSpan.empty()
    var modelID=this.models[modelName]['@id']

    var delBtn = $('<a class="ui-button ui-widget ui-corner-all" style="background-color:orangered" href="#">Delete</a>')
    var importPicBtn = $('<a class="ui-button ui-widget ui-corner-all" href="#">Upload Avarta</a>')
    var actualImportPicBtn =$('<input type="file" name="img" style="display:none"></input>')
    var clearAvartaBtn = $('<a class="ui-button ui-widget ui-corner-all" href="#">Clear Avarta</a>')
    this.rightSpan.append(delBtn,importPicBtn,actualImportPicBtn,clearAvartaBtn)

    importPicBtn.click( ()=>{
        actualImportPicBtn.trigger('click');
    });

    actualImportPicBtn.change(async (evt)=>{
        var files = evt.target.files; // FileList object
        var theFile=files[0]
        var dataUrl= await this.resizeImgFile(theFile,70)
        if(this.avartaImg) this.avartaImg.attr("src",dataUrl)

        var visualJson=this.visualDefinition[adtInstanceSelectionDialog.selectedADT]
        if(!visualJson[modelID]) visualJson[modelID]={}
        visualJson[modelID].avarta=dataUrl
        this.saveVisualDefinition()
        this.broadcastMessage({ "message": "visualDefinitionChange", "modelID":modelID,"avarta":dataUrl })
    })

    clearAvartaBtn.click( ()=>{
        var visualJson=this.visualDefinition[adtInstanceSelectionDialog.selectedADT]
        if(visualJson[modelID]) delete visualJson[modelID].avarta 
        if(this.avartaImg) this.avartaImg.removeAttr('src');
        this.saveVisualDefinition()
        this.broadcastMessage({ "message": "visualDefinitionChange", "modelID":modelID,"noAvarta":true })
    });


    delBtn.click(()=>{
        $.post("editADT/deleteModel",{"model":modelID}, (data)=> {
            if(data==""){//successful
                this.listModels("shouldBroadcast")
                this.rightSpan.empty()
                if(this.visualDefinition[adtInstanceSelectionDialog.selectedADT] && this.visualDefinition[adtInstanceSelectionDialog.selectedADT][modelID] ){
                    delete this.visualDefinition[adtInstanceSelectionDialog.selectedADT][modelID]
                    this.saveVisualDefinition()
                }
            }else{ //error happens
                alert(data)
            }
        });
    })
    
    var VisualizationDOM=this.addAPartInRightSpan("Visualization")
    var editablePropertiesDOM=this.addAPartInRightSpan("Editable Properties And Relationships")
    var baseClassesDOM=this.addAPartInRightSpan("Base Classes")
    var originalDefinitionDOM=this.addAPartInRightSpan("Original Definition")

    var str=JSON.stringify(this.models[modelName],null,2)
    originalDefinitionDOM.append($('<pre id="json">'+str+'</pre>'))

    var edittableProperties=modelAnalyzer.DTDLModels[modelID].editableProperties
    this.fillEditableProperties(edittableProperties,editablePropertiesDOM)
    var validRelationships=modelAnalyzer.DTDLModels[modelID].validRelationships
    this.fillRelationshipInfo(validRelationships,editablePropertiesDOM)

    this.fillVisualization(modelID,VisualizationDOM)

    this.fillBaseClasses(modelAnalyzer.DTDLModels[modelID].allBaseClasses,baseClassesDOM) 
}

modelManagerDialog.prototype.fillBaseClasses=function(baseClasses,parentDom){
    for(var ind in baseClasses){
        var keyDiv= $("<label style='display:block;padding:.1em'>"+ind+"</label>")
        parentDom.append(keyDiv)
    }
}

modelManagerDialog.prototype.fillVisualization=function(modelID,parentDom){
    var modelJson=modelAnalyzer.DTDLModels[modelID];
    var aTable=$("<table style='width:100%'></table>")
    aTable.html('<tr><td></td><td></td></tr>')
    parentDom.append(aTable) 

    var leftPart=aTable.find("td:first")
    var rightPart=aTable.find("td:nth-child(2)")
    rightPart.css({"width":"50px","height":"50px","border":"solid 1px lightGray"})
    
    var avartaImg=$("<img></img>")
    rightPart.append(avartaImg)
    var visualJson=this.visualDefinition[adtInstanceSelectionDialog.selectedADT]
    if(visualJson && visualJson[modelID] && visualJson[modelID].avarta) avartaImg.attr('src',visualJson[modelID].avarta)
    this.avartaImg=avartaImg;

    
    this.addOneVisualizationRow(modelID,leftPart)
    for(var ind in modelJson.validRelationships){
        this.addOneVisualizationRow(modelID,leftPart,ind)
    }
}
modelManagerDialog.prototype.addOneVisualizationRow=function(modelID,parentDom,relatinshipName){
    if(relatinshipName==null) var nameStr="◯" //visual for node
    else nameStr="⟜ "+relatinshipName
    var containerDiv=$("<div style='padding-bottom:8px'></div>")
    parentDom.append(containerDiv)
    var contentDOM=$("<label style='margin-right:10px'>"+nameStr+"</label>")
    containerDiv.append(contentDOM)

    var definiedColor=null
    var visualJson=this.visualDefinition[adtInstanceSelectionDialog.selectedADT]
    if(relatinshipName==null){
        if(visualJson && visualJson[modelID] && visualJson[modelID].color) definiedColor=visualJson[modelID].color
    }else{
        if(visualJson && visualJson[modelID]
             && visualJson[modelID]["relationships"]
              && visualJson[modelID]["relationships"][relatinshipName])
              definiedColor=visualJson[modelID]["relationships"][relatinshipName]
    }

    var colorSelector=$('<select></select>')
    containerDiv.append(colorSelector)
    var colorArr=["Black","LightGray","Red","Green","Blue","Bisque","Brown","Coral","Crimson","DodgerBlue","Gold"]
    colorArr.forEach((oneColorCode)=>{
        var anOption=$("<option value='"+oneColorCode+"'>"+oneColorCode+"▧</option>")
        colorSelector.append(anOption)
        anOption.css("color",oneColorCode)
    })
    if(definiedColor!=null) {
        colorSelector.val(definiedColor)
        colorSelector.css("color",definiedColor)
    }
    colorSelector.change((eve)=>{
        var selectColorCode=eve.target.value
        colorSelector.css("color",selectColorCode)
        if(!this.visualDefinition[adtInstanceSelectionDialog.selectedADT]) 
            this.visualDefinition[adtInstanceSelectionDialog.selectedADT]={}
        var visualJson=this.visualDefinition[adtInstanceSelectionDialog.selectedADT]

        if(!visualJson[modelID]) visualJson[modelID]={}
        if(!relatinshipName) {
            visualJson[modelID].color=selectColorCode
            this.broadcastMessage({ "message": "visualDefinitionChange", "modelID":modelID,"color":selectColorCode })
        }else{
            if(!visualJson[modelID]["relationships"]) visualJson[modelID]["relationships"]={}
            visualJson[modelID]["relationships"][relatinshipName]=selectColorCode
            this.broadcastMessage({ "message": "visualDefinitionChange", "srcModelID":modelID,"relationshipName":relatinshipName,"color":selectColorCode })
        }
        this.saveVisualDefinition()
    })
}

modelManagerDialog.prototype.saveVisualDefinition=function(){
    $.post("visualDefinition/saveVisualDefinition",{visualDefinitionJson:this.visualDefinition})
}

modelManagerDialog.prototype.fillRelationshipInfo=function(validRelationships,parentDom){
    for(var ind in validRelationships){
        var keyDiv= $("<label style='display:inline;padding:.1em .3em .1em .3em;margin-right:.3em'>"+ind+"</label>")
        parentDom.append(keyDiv)
        keyDiv.css("padding-top",".1em")
        var label=$("<label style='display:inline;background-color:yellowgreen;color:white;font-size:9px;padding:2px'>Relationship type</label>")
        parentDom.append(label)
        var contentDOM=$("<label></label>")
        contentDOM.css("display","block")
        contentDOM.css("padding-left","1em")
        parentDom.append(contentDOM)
        this.fillEditableProperties(validRelationships[ind].editableRelationshipProperties, contentDOM)
    }
}

modelManagerDialog.prototype.fillEditableProperties=function(jsonInfo,parentDom){
    for(var ind in jsonInfo){
        var keyDiv= $("<label style='display:block'><div style='display:inline;padding:.1em .3em .1em .3em;margin-right:.3em'>"+ind+"</div></label>")
        parentDom.append(keyDiv)
        keyDiv.css("padding-top",".1em")

        var contentDOM=$("<label></label>")
        if(Array.isArray(jsonInfo[ind])){
            contentDOM.text("enum")
            contentDOM.css({"background-color":"darkGray","color":"white","fontSize":"9px","padding":'2px'})
        }else if(typeof(jsonInfo[ind])==="object") {
            contentDOM.css("display","block")
            contentDOM.css("padding-left","1em")
            this.fillEditableProperties(jsonInfo[ind],contentDOM)
        }else {
            contentDOM.text(jsonInfo[ind])
            contentDOM.css({"background-color":"darkGray","color":"white","fontSize":"9px","padding":'2px'})
        }
        keyDiv.append(contentDOM)
    }
}


modelManagerDialog.prototype.addAPartInRightSpan=function(partName){
    var headerDOM=$('<h3 class="accordion-header ui-accordion-header ui-helper-reset ui-state-default ui-accordion-icons ui-corner-all"><span class="ui-accordion-header-icon ui-icon ui-icon-triangle-1-e"></span></h3>')
    headerDOM.text(partName)
    var listDOM=$('<div class="ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom"></div>')
    this.rightSpan.append(headerDOM,listDOM)
    
    headerDOM.click( ()=> {
        var panel = listDOM;
        var isOpen = panel.is(':visible');
        if(!isOpen){
            headerDOM.children(":first").removeClass("ui-icon-triangle-1-e")
            headerDOM.children(":first").addClass("ui-icon-triangle-1-s")
        }else{
            headerDOM.children(":first").removeClass("ui-icon-triangle-1-s")
            headerDOM.children(":first").addClass("ui-icon-triangle-1-e")
        }

        // open or close as necessary
        panel[isOpen ? 'slideUp' : 'slideDown']()
            // trigger the correct custom event
            .trigger(isOpen ? 'hide' : 'show');

        // stop the link from causing a pagescroll
        return false;
    });
    return listDOM;
}

modelManagerDialog.prototype.readModelFilesContentAndImport=async function(files){
    // files is a FileList of File objects. List some properties.
    var fileContentArr=[]
    for (var i = 0, f; f = files[i]; i++) {
        // Only process json files.
        if (f.type!="application/json") continue;
        try{
            var str= await this.readOneFile(f)
            var obj=JSON.parse(str)
            fileContentArr.push(obj)
        }catch(err){
        }
    }
    if(fileContentArr.length==0) return;

    $.post("editADT/importModels",{"models":fileContentArr}, (data)=> {
        if (data == "") {//successful
            this.listModels("shouldBroadCast")
        } else { //error happens
            alert(data)
        }
    });
}

modelManagerDialog.prototype.readOneFile= async function(aFile){
    return new Promise((resolve, reject) => {
        try{
            var reader = new FileReader();
            reader.onload = ()=> {
                resolve(reader.result)
            };
            reader.readAsText(aFile);
        }catch(e){
            reject(e)
        }
    })
}

modelManagerDialog.prototype.listModels=function(shouldBroadcast){
    this.modelList.empty()
    for(var ind in this.models) delete this.models[ind]
    $.get("queryADT/listModels", (data, status) => {
        data.forEach(oneItem=>{
            this.models[oneItem["displayName"]] = oneItem
        })
        if(shouldBroadcast){
            modelAnalyzer.clearAllModels();
            modelAnalyzer.addModels(data)
            modelAnalyzer.analyze();
        }
        
        var sortArr=[]
        for(var modelName in this.models) sortArr.push(modelName)
        sortArr.sort(function (a, b) { return a.toLowerCase().localeCompare(b.toLowerCase()) });
        sortArr.forEach(oneModelName=>{
            var oneModelItem=$('<li style="font-size:1.2em" class="ui-widget-content">'+oneModelName+'</li>')
            oneModelItem.css("cursor","default")
            oneModelItem.data("modelName", oneModelName)
            this.modelList.append(oneModelItem)
        })
        if(shouldBroadcast) this.broadcastMessage({ "message": "ADTModelsChange", "models":this.models })
    })
}


module.exports = new modelManagerDialog();