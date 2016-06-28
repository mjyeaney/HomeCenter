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
               AlertsSelected: 0x6
           }
};

/* Application Modules */ 

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
                }
            }
       }, 0);
    };

};

var DataModel = function(msgBus){
    var _bus = msgBus;
    var _self = this;
    var _msgMap = {};

    var loadOverview = function(callback){
        $.ajax({
            type : 'GET',
            cache : false,
            url : '/data/overview.json',
            dataType : 'json',
            success : function(result){
                _bus.Send(MessageTypes.Data.OverviewLoaded, result);
            }
        });
    };

    this.OnMessage = function(msg, data){
        var handler = _msgMap[msg];
        if (handler) handler(data);
    };

    _msgMap[MessageTypes.Data.LoadOverview] = loadOverview;
    _bus.Register(_self.OnMessage);
};

var Controller = function(msgBus){
    var _bus = msgBus;
    var _self = this;
    var _host = null;
    var _msgMap = {};

    var getTempReading = function(){
        var rnd = Math.random() * 125.0;
        var wp = Math.floor(rnd);
        var fp = (rnd-wp).toString();
        return wp.toString().leftPad(3) + '.' + fp.substr(2, 1);
    };

    var hideAllContent = function(){
        _host('#content .content-stage').hide();
    };

    var displayOverview = function(data){
        var inTemp = getTempReading(),
            outTemp = getTempReading(),
            inHumid = getTempReading(),
            outHumid = getTempReading();
        
        hideAllContent();
        _host('#content #overview').show();
        _host('#overview #tempOverview .readings').html(inTemp + '&deg; / ' + outTemp + '&deg;');
        _host('#overview #humidOverview .readings').text(inHumid + '% / ' + outHumid + '%');

        // make some BS charts
        new Highcharts.Chart({
            chart: { renderTo: 'tempGraph', type: 'line', animation: false },
            credits: { enabled: false },
            title: { text: null },
            yAxis: { title: { text: null } },
            legend: { enabled: false },
            plotOptions: { series: { animation: false } } ,
            series: [
                { name: 'Inside', data: [38.0, 32.0, 14.0, 15.6, 18.79, 21.0, 22.2, 38.0, 32.0, 14.0, 15.6, 18.79, 21.0, 22.6, 38.0, 32.0, 14.0, 15.6, 18.79, 21.0, 22.3, 25.0, 28.25, 23.2]},
                { name: 'Outside', data: [68.0, 62.0, 64.0, 65.6, 68.79, 61.0, 62.3, 68.0, 62.0, 64.0, 65.6, 68.79, 61.0, 62.3, 68.0, 62.0, 64.0, 65.6, 68.79, 61.0, 62.3, 62.3, 61.0, 68.12]}
            ]
        });

        new Highcharts.Chart({
            chart: { renderTo: 'humidGraph', type: 'line', animation: false },
            credits: { enabled: false },
            title: { text: null },
            yAxis: { title: { text: null } },
            legend: { enabled: false },
            plotOptions: { series: { animation: false } } ,
            series: [
                { name: 'Inside', data: [38.0, 32.0, 14.0, 15.6, 18.79, 21.0, 22.2, 38.0, 32.0, 14.0, 15.6, 18.79, 21.0, 22.6, 38.0, 32.0, 14.0, 15.6, 18.79, 21.0, 22.3, 25.0, 28.25, 23.2]},
                { name: 'Outside', data: [68.0, 62.0, 64.0, 65.6, 68.79, 61.0, 62.3, 68.0, 62.0, 64.0, 65.6, 68.79, 61.0, 62.3, 68.0, 62.0, 64.0, 65.6, 68.79, 61.0, 62.3, 62.3, 61.0, 68.12]}
            ]
        });
    };

    var displaySensors = function(data){
        hideAllContent();
        _host('#content #sensors').show();
    };

    var displayAlerts = function(data){
        hideAllContent();
        _host('#content #alerts').show();
    };

    this.BindEvents = function(host){
        _host = host;

        host('#navigation li:eq(0)').click(function(){
            _bus.Send(MessageTypes.Data.LoadOverview);
        });

        host('#navigation li:eq(1)').click(function(){
            _bus.Send(MessageTypes.View.SensorsSelected);
        });

        host('#navigation li:eq(2)').click(function(){
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
