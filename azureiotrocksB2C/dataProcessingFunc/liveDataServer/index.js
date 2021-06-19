module.exports = function (context, message) {
    context.log('Node.js queue trigger function processed work item', message);
    // OR access using context.bindings.<name>
    // context.log('Node.js queue trigger function processed work item', context.bindings.myQueueItem);
    context.log('expirationTime =', context.bindingData.expirationTime);
    context.log('insertionTime =', context.bindingData.insertionTime);
    context.log('nextVisibleTime =', context.bindingData.nextVisibleTime);
    context.log('id =', context.bindingData.id);
    context.log('popReceipt =', context.bindingData.popReceipt);
    context.log('dequeueCount =', context.bindingData.dequeueCount);
    /*
    const message = req.body;
    message.sender="AzureIoTRocks"
        
    let recipientUserId = '';
    if (message.recipient) {
        recipientUserId = message.recipient;
        message.isPrivate = true;
    }

    context.bindings.signalRMessages = [{
        "userId": recipientUserId,
        "target": "newMessage",
        "arguments": [ message ]
    }];
    */
    context.done();
};