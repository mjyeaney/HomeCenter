/*
    Basic agen for sending random data to an event hub.
*/

var eventHubs = require('eventhubs-js'),
    moment = require('moment');

//
// Initialize the event hub connection object
//
eventHubs.init({
    hubNamespace: 'homecentertelem',
    hubName: 'sensordata',
    keyName: 'SensorStation',
    key: 'Nmr84ZLvHbSCOPvpxWxRUwKt1ACpi9boWFSFs8NiLfQ='
});

//
// Causes our device to upload a pice of telemetry
//
var sendReadingData = function(){
    // Create device message
    var deviceMessage = {
        hmdt: (35 + (Math.random() * 20)),
        temp: (70 + (Math.random() * 25)),
        device: 'ABC-123'
        //time: moment().toISOString()
    }

    // Send message
    eventHubs.sendMessage({
        message: deviceMessage,
        deviceId: 1,
    }).then(function(){
        console.log('LOG: Sent reading data [' + JSON.stringify(deviceMessage) + ']');

        // Schedule next reading upload
        scheduleReading();
    }).fail(function(err){
        console.log('ERROR: ' + err);
    })
};

//
// Schedules our device to send data about every second.
//
var scheduleReading = function(){
    setTimeout(function(){
        sendReadingData();
    }, 1000);
};

// Startup
scheduleReading();
