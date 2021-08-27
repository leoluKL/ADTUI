const { DefaultAzureCredential, InteractiveBrowserCredential } = require("@azure/identity");
const { AzureDigitalTwinsManagementClient } = require("@azure/arm-digitaltwins");
const { DigitalTwinsClient } = require("@azure/digital-twins-core");
const got = require('got');
var myArgs = process.argv.slice(2);

var adtClients={}

main()


async function main() {
//use azure resource management API to fetch different instances of ADT
    const credential = new DefaultAzureCredential();
    try {
        var token = await credential.getToken("https://management.azure.com/.default");
        console.log("DefaultAzureCredential works....")
    } catch (err) {
        //InteractiveBrowserCredential only works for getting one token. but this application need multiple token for different services
        //thus it is not suitable for now.... It waits for future thinking how to achieve when default login not available
        console.log("Please 'az login' before running this application....")
        return;
        //console.log("DefaultAzureCredential does not exist, try InteractiveBrowserCredential....")
        //const credential = new InteractiveBrowserCredential({ redirectUri: "http://localhost:8080/" });
    }

    try{
        await listAllADTInstances(credential)
        var httpServerHelper = require("./httpServerHelper.js");
        (new httpServerHelper(adtClients)).createHTTPServer();
    }catch(e){
        console.log(e)
        console.log("error in connecting to azure subscriptions, please check your internet...")
    }   
}


async function listAllADTInstances(credential) {
    var token = await credential.getToken("https://management.azure.com/.default");
    var url = "https://management.azure.com/subscriptions?api-version=2020-01-01"

    var re = await got.get(url, {
        headers: {
            Authorization: "Bearer " + token.token
        }
    });
    var bodyObj = JSON.parse(re.body)

    var preferSubscription=null
    for(var i=0;i<myArgs.length;i++){
        if(myArgs[i]=="--subscription"){
            preferSubscription=myArgs[i+1]
        }
    }
    for (var i = 0; i < bodyObj.value.length; i++) {
        if(preferSubscription!=null && bodyObj.value[i].subscriptionId!=preferSubscription) continue
        //console.log(bodyObj.value[i].subscriptionId)
        var aNewADTManagementClient = new AzureDigitalTwinsManagementClient(credential, bodyObj.value[i].subscriptionId)
        
        if(Object.keys(adtClients).length === 0){
            //ensure at least fetch some adt instance, normally they should be in the first few subscriptions
            await fetchAllADTInstance(aNewADTManagementClient,credential)
        }else{
            fetchAllADTInstance(aNewADTManagementClient,credential)
        }
    }
}

async function fetchAllADTInstance(aADTManagementClient,credential){
    var dtinstances = await aADTManagementClient.digitalTwins.list()
    if (dtinstances.length == 0) return;

    //console.log(bodyObj.value[i].displayName, bodyObj.value[i].subscriptionId)

    for (var j = 0; j < dtinstances.length; j++) {
        var endPoint = "https://" + dtinstances[j].hostName
        var aNewADTClient = new DigitalTwinsClient(endPoint, credential)
        adtClients[endPoint] = aNewADTClient;
    }
}



