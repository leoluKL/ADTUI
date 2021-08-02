const webpush = require('web-push');
module.exports = async function (context, IoTHubMessages) {
    var outDocumentArr=[]

    webpush.setVapidDetails('mailto:leolu@microsoft.com', process.env.SERVICEWORKER_PUBLIC_VAPID_KEY, process.env.SERVICEWORKER_PRIVATE_VAPID_KEY);

    IoTHubMessages.forEach((message,index) => {
        var devID = "unknown";
        if (context.bindingData.systemPropertiesArray) {
            devID = context.bindingData.systemPropertiesArray[index]["iothub-connection-device-id"]
        }

        //the information enrichment set in iot hub to add into the messages
        //context.log(JSON.stringify(context.bindingData.propertiesArray))
        message["twinID"]=devID

        var eventType=context.bindingData.systemPropertiesArray[index]["iothub-message-source"]
        if(eventType=="deviceConnectionStateEvents"){
            var allProperties=context.bindingData.propertiesArray[index]
            var opType=allProperties["opType"]
            var projectID=allProperties["project"]
            var modelID=allProperties["modelID"]
            var opTimestamp=allProperties["operationTimestamp"]
            context.log(opType,projectID)
        }
        //the index of systemPropertiesArray is the message index
        //context.bindingData.systemPropertiesArray[index]["iothub-message-source"]  for example, telemetry/deviceConnectionStateEvents
        
        //context.log("From "+devID+": " + JSON.stringify(message))

        const payload = JSON.stringify(message);
        var savedSubscription = {
            endpoint: 'https://fcm.googleapis.com/fcm/send/cz-6OGwlZ1M:APA91bHSi7g4vFnh5k3JkpbouxmPNXBneNRAs_ytT24ritEU9f95cppc980A1cHZFjK_EsewMAofNjmMBLGVtAEHdtGbCZcZqdVcYQ_fERYSGa8sCWFMtJKu_0ze4MJMRSaab3DSiBfq',
            expirationTime: null,
            keys: {
                p256dh: 'BPVtmVDklYSWbw2uXT4gcJFw3m2_UW5GH1FRCkvw82tjt5wWyB3vvLsuOYSVZBJtYtpw-c4stAACfl3sCmplk0Y',
                auth: 'QdXPNV0-LGFh_8L2j3uxoA'
            }
        }
        webpush.sendNotification(savedSubscription, payload).catch(error => {
            context.error(error.stack);
        });

        
        outDocumentArr.push(message)
    });
    //context.bindings.outputDocToCosmosDB = JSON.stringify(outDocumentArr);
    context.done();
};