/* Extensions / prototypes */

if (!String.prototype.leftPad) {
    String.prototype.leftPad = function(length, chr){
        if (this.length >= length) return this;
        chr = chr || ' ';
        return (new Array(length).join(chr)).substr(0, (length - this.length)) + this;
    };
}

/* Global constants, resources, etc. */

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

/* Simple UI message bus */ 

var MessageBus = function(){
    var _listeners = [];

    this.Register = function(callback){
        _listeners.push(callback);
    }

    this.Send = function(msg, data){
        window.setTimeout(function(){
            for (var j=0; j < _listeners.length; j++){
                try {
                    _listeners[j](msg, data);
                } catch (ex){
                    // nothing - trace?
                    console.log('ERROR: ' + ex)
                }
            }
       }, 0);
    };

};

/* Data model / methods */

var DataModel = function(msgBus){
    var _bus = msgBus;
    var _self = this;
    var _msgMap = {};

    var loadOverview = function(callback){
        var blobServiceUri = 'https://homecenter0628.blob.core.windows.net', 
            container = 'mam',
            now = new Date();

        var year = now.getUTCFullYear(),
            month = (now.getUTCMonth() + 1).toString().leftPad(2, '0'),
            day = now.getUTCDate().toString().leftPad(2, '0'),
            hour = now.getUTCHours().toString().leftPad(2, '0');

        var lastHourDataPrefix = 'ouput/' + year + '/' + month + '/' + day + '/' + hour;
        var searchUrl = blobServiceUri + '/' + container + '?restype=container&comp=list&prefix=' + lastHourDataPrefix;

        // Find the file that matches this prefix (if any)
        $.ajax({
            type: 'GET',
            cache: false,
            url: searchUrl,
            contentType : 'xml',
            success: function(result){
                var matches = result.documentElement.getElementsByTagName("Blob");
                if (matches.length > 0){
                    var downloadUri = matches[0].getElementsByTagName("Url")[0].textContent;

                    $.ajax({
                        type: 'GET',
                        cache: false,
                        url: downloadUri,
                        contentType : 'text/plain',
                        success: function(result){
                            var lines = result.split('\n');
                            var data = [];
                            for (var i=0; i < lines.length; i++){
                                data.push(JSON.parse(lines[i]));
                            }
                            _bus.Send(MessageTypes.Data.OverviewLoaded, data);
                        }
                    })
                } else {
                    console.log('No matches found for the current query');
                    _bus.Send(MessageTypes.View.NoDataFound);

                    // Look for new data in 5 seconds
                    setTimeout(function(){
                        _bus.Send(MessageTypes.Data.LoadOverview);
                    }, 5000);
                }
            }
        })
    };

    this.OnMessage = function(msg, data){
        var handler = _msgMap[msg];
        if (handler) handler(data);
    };

    _msgMap[MessageTypes.Data.LoadOverview] = loadOverview;
    _bus.Register(_self.OnMessage);
};

/* Application controller */

var Controller = function(msgBus){
    var _bus = msgBus;
    var _self = this;
    var _host = null;
    var _msgMap = {};

    var hideAllContent = function(){
        _host('#content .content-stage').hide();
    };

    var displayOverview = function(data){
        var avgTemp = data.reduce(function(p, c) { return p + c.temp; }, 0.0) / data.length,
            tempData = data.reduce(function(p, c) { p.push(c.temp); return p;}, []),
            avgHmdt = data.reduce(function(p, c) { return p + c.hmdt; }, 0.0) / data.length,
            hmdtData = data.reduce(function(p, c) { p.push(c.hmdt); return p;}, []);
        
        hideAllContent();
        _host('#content #overview').show();
        _host('#overview #tempOverview .readings').html('Avg: ' + avgTemp.toFixed(1) + '&deg;');
        _host('#overview #humidOverview .readings').text('Avg: ' + avgHmdt.toFixed(1) + '%');

        // make some charts
        new Highcharts.Chart({
            chart: {
                renderTo: 'tempGraph', 
                type: 'line', 
                animation: false,
                backgroundColor: 'rgb(245,245,245)'
            },
            credits: { enabled: false },
            title: { text: null },
            plotOptions: {
                column: { shadow: false },
                spline: {
                    shadow: false,
                    marker: { radius: 0 }
                },
                line: {
                    marker: { radius: 0 }
                },
                series: { enableMouseTracking: false }
            },
            xAxis: { gridLineWidth: 1, type: 'linear' },
            yAxis: {
                title: { text: '' },
                endOnTick: true,
                labels: {
                    formatter: function () {
                        return this.value; // Disable label shortening
                    }
                }
            },
            legend: { enabled: false },
            series: [
                { animation: false, data: tempData},
            ]
        });

        new Highcharts.Chart({
            chart: {
                renderTo: 'humidGraph', 
                type: 'line', 
                animation: false,
                backgroundColor: 'rgb(245,245,245)'
            },
            credits: { enabled: false },
            title: { text: null },
            plotOptions: {
                column: { shadow: false },
                spline: {
                    shadow: false,
                    marker: { radius: 0 }
                },
                line: {
                    marker: { radius: 0 }
                },
                series: { enableMouseTracking: false }
            },
            xAxis: { gridLineWidth: 1, type: 'linear' },
            yAxis: {
                title: { text: '' },
                endOnTick: true,
                labels: {
                    formatter: function () {
                        return this.value; // Disable label shortening
                    }
                }
            },
            legend: { enabled: false },
            series: [
                { animation: false, data: hmdtData}
            ]
        });

        // Re-load data in 5 seconds
        setTimeout(function(){
            _bus.Send(MessageTypes.Data.LoadOverview);
        }, 5000);
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

/* Startup + bootstrap */

$(function(){
    var bus = new MessageBus();
    var data = new DataModel(bus);
    var view = new Controller(bus);
    view.BindEvents($);
    
    // startup
    bus.Send(MessageTypes.Data.LoadOverview);
});
