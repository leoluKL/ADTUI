//https://docs.microsoft.com/en-us/javascript/api/azure-iothub/registry?view=azure-node-latest
const iothub = require('azure-iothub');
const { DefaultAzureCredential} = require("@azure/identity");

function iothubHelper() {
    const credential = new DefaultAzureCredential();
    this.iothubClient = new iothub.Client.fromTokenCredential(process.env.IoTHubEndpoint,credential)
    this.iothubRegistry = new iothub.Registry.fromTokenCredential(process.env.IoTHubEndpoint,credential)

    //this.manualRenewToken(credential)
}


iothubHelper.prototype.manualRenewToken=function(credential){
    //it might be a bug that token is not renewed now, bug report: https://github.com/Azure/azure-iot-sdk-node/issues
    //manually refresh token every hour
    setInterval(() => {
        this.iothubClient = new iothub.Client.fromTokenCredential(process.env.IoTHubEndpoint,credential)
        this.iothubRegistry = new iothub.Registry.fromTokenCredential(process.env.IoTHubEndpoint,credential)
    }, 3600*1000);

}

module.exports = new iothubHelper();