/*

    Basic agen for sending random data to an event hub.

*/

var eventHubs = require('./node_modules/eventhubs-js/client.js'),
    moment = require('moment');

// Initialize the event hub connection object
eventHubs.init({
    hubNamespace: 'homecentertelem',
    hubName: 'sensordata',
    keyName: 'SensorStation',
    key: 'Nmr84ZLvHbSCOPvpxWxRUwKt1ACpi9boWFSFs8NiLfQ='
});

var sendReadingData = function(){
    // create a message
    var deviceMessage = {
        hmdt: (25 + (Math.random() * 10)),
        temp: (65 + (Math.random() * 15)),
        device: 'ABC-123'
        //time: moment().toISOString()
    }

    eventHubs.sendMessage({
        message: deviceMessage,
        deviceId: 1,
    }).then(function(){
        console.log('LOG: Sent reading data [' + JSON.stringify(deviceMessage) + ']');

        // Send next reading
        setTimeout(function(){
            sendReadingData();
        }, 1000)
    }).fail(function(err){
        console.log('ERROR: ' + err);
    })
};

// Send a random sensor reading every second.
setTimeout(function(){
    sendReadingData();
}, 1000)
