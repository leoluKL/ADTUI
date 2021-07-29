//https://docs.microsoft.com/en-us/javascript/api/azure-iothub/registry?view=azure-node-latest
const iothub = require('azure-iothub');
const { DefaultAzureCredential} = require("@azure/identity");

function iothubHelper() {
    const credential = new DefaultAzureCredential();
    this.iothubClient = new iothub.Client.fromTokenCredential("azureiotrocksiothub.azure-devices.net",credential)
    this.iothubRegistry = new iothub.Registry.fromTokenCredential("azureiotrocksiothub.azure-devices.net",credential)
}


module.exports = new iothubHelper();