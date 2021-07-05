//https://docs.microsoft.com/en-us/javascript/api/azure-iothub/registry?view=azure-node-latest
const iothub = require('azure-iothub');
const { DefaultAzureCredential} = require("@azure/identity");

function iothubHelper() {
    const credential = new DefaultAzureCredential();
    this.iothubClient = new iothub.Client.fromTokenCredential(process.env.IoTHubEndpoint,credential)
    this.iothubRegistry = new iothub.Registry.fromTokenCredential(process.env.IoTHubEndpoint,credential)
}


module.exports = new iothubHelper();