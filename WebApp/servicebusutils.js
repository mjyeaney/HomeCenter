/*

    Sample utility module for connecting to a ServiceBus Topic, and looking for 
    messages that are available in a subscription.

    For production code, need to put secrets in either environment variables, or 
    a client configuration file.

*/

(function(scope){    
    // 
    // Check for module namespace
    //
    if (!scope.ServiceBusUtility){
        scope.ServiceBusUtility = {};
    }
    
    var azure = require('azure-sb');
    var connStr = "Endpoint=sb://azurelogeventsdemo.servicebus.windows.net/;SharedAccessKeyName=LogEventFunction;SharedAccessKey=CQbe6JST9sG2t+5p3IopuUFuJKFNmKRze6FLy+2vmbM=;"
    var topicName = 'AuditLogMessages';
    var subscriptionName = 'TestSubscription';
    var sbService = azure.createServiceBusService(connStr);
    var RETRY_INTERVAL_MS = 5000;
    var clientCallback = null;

    //
    // Query the topic subscription for any new messages.
    //
    var checkForMessages = function(sbService, topicName) {
        sbService.receiveSubscriptionMessage(topicName, subscriptionName, function (err, msg) {
            if (err) {
                if (err !== "No messages to receive"){
                    console.log('Error on Rx: ', err);
                }
            } else {
                try {
                    var payload = msg.body;
                    var payloadJson = payload.substring(payload.indexOf('['), payload.indexOf("]")+1);                
                    var data = JSON.parse(payloadJson);

                    // Notify listener if there is one.
                    if (clientCallback){
                        clientCallback(data);
                    }
                } catch (ex) {
                    console.log("Unable to parse JSON envelope: " + msg.body);
                }
            }
            scheduleNextCheck();
        });
    };

    //
    // Schedules the next peek for messages according to RETRY_TIMEOUT_MS.
    //
    var scheduleNextCheck = function(){
        setTimeout(function(){
            checkForMessages(sbService, topicName);
        }, RETRY_INTERVAL_MS);
    };

    //
    // Saves the client callback as a member 
    //
    var setMessageCallback = function(callback){
        clientCallback = callback;
    };

    //
    // Make sure the topic we're watching actually exists before checking 
    // for messages.
    // 
    sbService.createTopicIfNotExists(topicName, function (err) {
        if (err) {
            console.log('Failed to create topic: ', err);
        } else {
            checkForMessages(sbService, topicName);
        }
    });

    //
    // Export methods from module
    //
    scope.ServiceBusUtility.SetMessageCallback = setMessageCallback;
})(this);