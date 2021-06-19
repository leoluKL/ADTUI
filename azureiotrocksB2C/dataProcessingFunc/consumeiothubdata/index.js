
module.exports = async function (context, IoTHubMessages) {
    //context.log(`JavaScript eventhub trigger function called for message array: ${IoTHubMessages}`);
    var outQueueArr=[]
    IoTHubMessages.forEach(message => {
        var str = JSON.stringify(message)
        var devID = "unknown";
        if (context.bindingData.systemPropertiesArray) {
            devID = context.bindingData.systemPropertiesArray[0]["iothub-connection-device-id"]
        }
        context.log("message received from: "+devID)
        context.log(str)
        outQueueArr.push(message)
    });
    context.bindings.outputQueueItem = outQueueArr;
    context.done();
};