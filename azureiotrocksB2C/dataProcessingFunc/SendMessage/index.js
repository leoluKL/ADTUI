module.exports = function (context, req) {
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
    context.done();
};