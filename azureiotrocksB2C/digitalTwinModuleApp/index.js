const express = require('express');
const { DefaultAzureCredential} = require("@azure/identity");
const { DigitalTwinsClient } = require("@azure/digital-twins-core");


const app = express();

var myArgs = process.argv.slice(2);
var localTestFlag = false;
if (myArgs[0] == "--local") localTestFlag = true;
if(localTestFlag){
    require('dotenv').config() //loading environment variable in local developing environment
    //enable CORS (for testing only -remove in production/deployment)
    console.log("Local test environment....")
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', 'http://localhost:5002');
        res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        res.header('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
        next();
    });    
}



// API endpoint
async function test(req,res){
    var reArr=[]
    const credential = new DefaultAzureCredential();

    console.log(credential)
    var aNewADTClient = new DigitalTwinsClient("https://adtleo.api.wcus.digitaltwins.azure.net", credential)
    var models = await aNewADTClient.listModels([], true);
    for await (const modelSet of models.byPage({ maxPageSize: 1000 })) { //should be only one page
        //reArr=modelSet.value
        modelSet.value.forEach(oneModel=>{console.log(oneModel.model["@id"]);reArr.push(oneModel.model["@id"])})
    }

    res.send(JSON.stringify(reArr))
}

app.get('/hello',
    (req, res) => {
        test(req,res)
    }
);

const port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log('Listening on port ' + port);
});
