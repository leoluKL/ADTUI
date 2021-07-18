const { json } = require('express')
const azureMapCreatorHelper = require('./azureMapCreatorHelper')

var testFunc = async () => {
    
    //azureMapCreatorHelper.importDWGZip('dwg.zip') //('Harem_Topkapi_Palace_svg3.zip')

    /*`
    var datasetId = "e74249ed-ac42-10b6-d4f7-0f4d921e70e6"
    var stateSetJSON = { styles: [] }
    stateSetJSON.styles.push({ "keyname": "highlight", "type": "boolean", "rules": [{ "true": "#FF0000", "false": "#00FF00" }] })
    stateSetJSON.styles.push({
        "keyname": "temperature", "type": "number",
        "rules": [{ "range": { "minimum": 0, "maximum": 30 }, "color": "#343deb" },
        { "range": { "minimum": 30, "maximum": 50 }, "color": "#eba834" }
        ]
    })
    stateSetJSON.styles.push({
        "keyname": "unitType", "type": "string", "rules": [
            { "meetingRoom": "#FF0000", "bedRoom": "#FF00AA", "gym": "#00FF00", "pantry": "#964B00" }
        ]
    })
    await azureMapCreatorHelper.createFeatureStateSet(datasetId, stateSetJSON)
    */

    //var re=await azureMapCreatorHelper.listDataset()
    //re.datasets.forEach(ele=>{ console.log(JSON.stringify(ele))})  //+"  "+JSON.stringify(ele.featureCounts))    

    //var re=await azureMapCreatorHelper.deleteDataset('04569040-2a36-9c59-bd1c-b3eb959ee8a7')
    
    var re=await azureMapCreatorHelper.listTileset()
    re.tilesets.forEach(ele=>{ console.log(JSON.stringify(ele))})  //+"  "+JSON.stringify(ele.featureCounts))   
    //{"tilesetId":"bbd63ae1-f22c-7a26-6d6f-f3f8d53f3105","datasetId":"e74249ed-ac42-10b6-d4f7-0f4d921e70e6","description":"","created":"2021-07-16T04:39:56+00:00","minZoom":13,"maxZoom":20,"bbox":[-122.13285851,47.636152,-122.1316685,47.63695722],"ontology":"facility-2.0"}

    //var re=await azureMapCreatorHelper.deleteTileset('a15623ef-f34c-eac4-09f5-af04395370ba')
    

    //var re=await azureMapCreatorHelper.listFeatureStateSets()
    //re.statesets.forEach(ele=>{console.log(JSON.stringify(ele))})
    //datasetIds:[e74249ed-ac42-10b6-d4f7-0f4d921e70e6],statesetStyle:{styles:[...]}

}

testFunc()
