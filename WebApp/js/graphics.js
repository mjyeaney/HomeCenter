/*
    Extracted Graphics methods for main UI.
*/

(function(scope){
    // Check for namespace declaration
    if (!scope.Graphics){
        scope.Graphics = {};
    }

    //
    // Configures a lineplot using the specified options.
    //
    var createLinePlot = function(title, data, domElm){
        new Highcharts.Chart({
            chart: {
                renderTo: domElm, 
                type: 'line', 
                animation: false,
                backgroundColor: '#fff'
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
            series: [{ 
                animation: false,
                color: '#606060', 
                data: data
            }]
        });
    };

    //
    // Configures and draws a gauge using the specified options.
    //
    var createGaugePlot = function(title, unitDisplay, data, domElm){
        new Highcharts.Chart({
            chart: {
                renderTo: domElm,
                type: 'solidgauge',
                animation: false,
                backgroundColor: '#fff'
            },
            credits: { enabled: false },
            title: null,
            pane: {
                center: ['50%', '85%'],
                size: '140%',
                startAngle: -90,
                endAngle: 90,
                background: {
                    backgroundColor: '#f6f6f6',
                    innerRadius: '60%',
                    outerRadius: '100%',
                    shape: 'arc'
                }
            },
            tooltip: { enabled: false },
            // the value axis
            yAxis: {
                stops: [
                    [0.5, '#55BF3B'], // green
                    [0.75, '#DDDF0D'], // yellow
                    [0.9, '#DF5353'] // red
                ],
                lineWidth: 0,
                minorTickInterval: null,
                tickPixelInterval: 400,
                tickWidth: 0,
                title: {
                    y: -70,
                    text: title
                },
                labels: {
                    y: 16
                },
                min: 0,
                max: 200
            },
            plotOptions: {
                solidgauge: {
                    dataLabels: {
                        y: 5,
                        borderWidth: 0,
                        useHTML: true
                    }
                }
            },
            series: [{
                animation: false,
                name: title,
                data: [data],
                dataLabels: {
                    format: '<div style="text-align:center"><span style="font-size:1.75em;">{y:.1f}</span><br/>' +
                        '<span style="font-size:12px;color:silver">' + unitDisplay + '</span></div>'
                }
            }]
        });
    };

    //
    // Module exports
    //
    scope.Graphics.CreateLinePlot = createLinePlot;
    scope.Graphics.CreateGaugePlot = createGaugePlot;
})(this);