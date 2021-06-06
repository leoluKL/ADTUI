const { DigitalTwinsClient } = require("@azure/digital-twins-core");
const { DefaultAzureCredential} = require("@azure/identity");

function adtHelper() {
    const credential = new DefaultAzureCredential();
    this.ADTClient = new DigitalTwinsClient(process.env.ADTEndpoint, credential)
}


module.exports = new adtHelper();