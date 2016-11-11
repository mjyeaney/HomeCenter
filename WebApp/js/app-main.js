//
// Extensions / prototypes
//
if (!String.prototype.leftPad) {
    String.prototype.leftPad = function(length, chr){
        if (this.length >= length) return this;
        chr = chr || ' ';
        return (new Array(length).join(chr)).substr(0, (length - this.length)) + this;
    };
}

//
// Basic app module definition
//
(function(scope){
    // Create our namespace container
    if (!scope.App){
        scope.App = {};
    }

    //
    // Global constants, resources, etc.
    //
    var MessageTypes = {
        Data : {
            LoadOverview: 0x0,
            OverviewLoaded: 0x1,
            LoadSensorList: 0x2,
            SensorListLoaded: 0x3
        },
        View : {
            OverviewSelected: 0x4,
            SensorsSelected: 0x5,
            AlertsSelected: 0x6,
            NoDataFound: 0x7
        }
    };

    //
    // Simple UI message bus
    //
    var MessageBus = function(){
        var _listeners = [];

        var _defer = function(callback){
            window.setTimeout(callback, 0);
        }

        this.Register = function(callback){
            _listeners.push(callback);
        }

        this.Send = function(msg, data){
            _defer(function(){
                for (var j=0; j < _listeners.length; j++){
                    try {
                        _listeners[j](msg, data);
                    } catch (ex){
                        // nothing - trace?
                        console.log('ERROR: ' + ex)
                    }
                }
            });
        };
    };

    //
    // Data model / methods
    //
    var DataModel = function(msgBus){
        var _bus = msgBus;
        var _self = this;
        var _msgMap = {};

        // Loads the dashboard data stream (if any)
        var loadOverview = function(callback){
            var blobServiceUri = 'https://homecenter0628.blob.core.windows.net', 
                container = 'mam',
                now = new Date();

            // Gather up date parts
            var year = now.getUTCFullYear(),
                month = (now.getUTCMonth() + 1).toString().leftPad(2, '0'),
                day = now.getUTCDate().toString().leftPad(2, '0'),
                hour = now.getUTCHours().toString().leftPad(2, '0');

            // Build search URL (see storage REST API docs)
            var lastHourDataPrefix = 'ouput/' + year + '/' + month + '/' + day + '/' + hour;
            var searchUrl = blobServiceUri + 
                            '/' + 
                            container + 
                            '?restype=container&comp=list&prefix=' + 
                            lastHourDataPrefix;

            // Search for blobs matching the current query (assumes only one)
            var searchForMatchingData = function(searchUri){
                $.ajax({
                    type: 'GET',
                    cache: false,
                    url: searchUri,
                    contentType : 'xml',
                    success: function(result){
                        var matches = result.documentElement.getElementsByTagName("Blob");
                        if (matches.length > 0){
                            var downloadUri = matches[0].getElementsByTagName("Url")[0].textContent;
                            downloadData(downloadUri);
                        } else {
                            // Notify application that no current data has been found
                            console.log('No matches found for the current query');
                            _bus.Send(MessageTypes.View.NoDataFound);

                            // Look for new data in 15 seconds
                            setTimeout(function(){
                                _bus.Send(MessageTypes.Data.LoadOverview);
                            }, 15000);
                        }
                    }
                })
            };

            // Download data file
            var downloadData = function(dataUri){
                $.ajax({
                    type: 'GET',
                    cache: false,
                    url: dataUri,
                    contentType : 'text/plain',
                    success: function(result){
                        // construct an array of data since the file is
                        // just line-seperated.
                        var lines = result.split('\n');
                        var data = [];
                        for (var i=0; i < lines.length; i++){
                            data.push(JSON.parse(lines[i]));
                        }

                        // Notify application that data has been loaded
                        _bus.Send(MessageTypes.Data.OverviewLoaded, data);
                    }
                })
            };

            // Look for matching data streams
            searchForMatchingData(searchUrl);
        };

        // Invoked when a message is broadcast
        this.OnMessage = function(msg, data){
            var handler = _msgMap[msg];
            if (handler) handler(data);
        };

        // Setup msg handling
        _msgMap[MessageTypes.Data.LoadOverview] = loadOverview;
        _bus.Register(_self.OnMessage);
    };

    //
    // Application Controller
    //
    var Controller = function(msgBus){
        var _bus = msgBus;
        var _self = this;
        var _host = null;
        var _msgMap = {};

        var hideAllContent = function(){
            _host('#content .content-stage').hide();
        };

        var displayOverview = function(data){
            var tempSum = 0.0,
                hmdtSum = 0.0,
                avgTemp = 0.0,
                avgHmdt = 0.0, 
                tempData = [], 
                hmdtData = [];

            // Compute aggregates
            for (var j=0; j < data.length; j++){
                tempSum += data[j].temp;
                hmdtSum += data[j].hmdt;
                tempData.push(data[j].temp);
                hmdtData.push(data[j].hmdt);
            }

            // Compute avg's
            avgTemp = tempSum / data.length;
            avgHmdt = hmdtSum / data.length;
            
            // Adjust UI state
            hideAllContent();
            _host('#content #overview').show();

            // Populate temp and humidity line graphs
            Graphics.CreateLinePlot('Tempurature', tempData, 'tempGraph');
            Graphics.CreateLinePlot('Humidity', hmdtData, 'humidGraph');

            // Populate Gauge plots
            Graphics.CreateGaugePlot('Avg. Tempurature', '&deg;F', avgTemp, 'tempGauge');
            Graphics.CreateGaugePlot('Avg. Humidity', '%', avgHmdt, 'hmdtGauge');

            // Re-load data in 2 seconds
            setTimeout(function(){
                _bus.Send(MessageTypes.Data.LoadOverview);
            }, 2000);
        };

        var displaySensors = function(data){
            hideAllContent();
            _host('#content #sensors').show();
        };

        var displayAlerts = function(data){
            hideAllContent();
            _host('#content #alerts').show();
        };

        var displayNoData = function(){
            hideAllContent();
            _host('#content #noData').show();
        };

        this.BindEvents = function(host){
            _host = host;

            host('#navigation li:eq(0) a').click(function(){
                _bus.Send(MessageTypes.Data.LoadOverview);
            });

            host('#navigation li:eq(1) a').click(function(){
                _bus.Send(MessageTypes.View.SensorsSelected);
            });

            host('#navigation li:eq(2) a').click(function(){
                _bus.Send(MessageTypes.View.AlertsSelected);
            });
        };

        this.OnMessage = function(msg, data){
            var handler = _msgMap[msg];
            if (handler) handler(data);
        };

        _msgMap[MessageTypes.Data.OverviewLoaded] = displayOverview;
        _msgMap[MessageTypes.View.SensorsSelected] = displaySensors;
        _msgMap[MessageTypes.View.AlertsSelected] = displayAlerts; 
        _msgMap[MessageTypes.View.NoDataFound] = displayNoData;
        _bus.Register(_self.OnMessage);
    };

    //
    // Scope exports
    //
    scope.App.MessageTypes = MessageTypes;
    scope.App.MessageBus = MessageBus;
    scope.App.DataModel = DataModel;
    scope.App.Controller = Controller;
})(this);