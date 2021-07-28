
module.exports = async function (context, IoTHubMessages) {
    //context.log(`JavaScript eventhub trigger function called for message array: ${IoTHubMessages}`);
    context.log(`JavaScript eventhub trigger`);
    var outQueueArr=[]
    IoTHubMessages.forEach(message => {
        var str = JSON.stringify(message)
        var devID = "unknown";
        if (context.bindingData.systemPropertiesArray) {
            devID = context.bindingData.systemPropertiesArray[0]["iothub-connection-device-id"]
        }

        //[{"deviceOwner":"leolu@microsoft.com"}]
        context.log(JSON.stringify(context.bindingData.propertiesArray)) //the information enrichment set in iot hub to add into the messages
        
        context.log("message received from: "+devID)
        context.log(str)
        outQueueArr.push(message)
    });
    context.bindings.outputQueueItem = outQueueArr;
    context.done();
};