define([
    'underscore',
    'chart-view',
    'legend-view',
    'chart-utils'
], function (_, ChartView, LegendView, chUtils) {

    /* Inspired by Lee Byron's test data generator. */
	function stream_layers(n, m, o) {
	if (arguments.length < 3) o = 0;
	function bump(a) {
		var x = 1 / (.1 + Math.random()),
			y = 2 * Math.random() - .5,
			z = 10 / (.1 + Math.random());
		for (var i = 0; i < m; i++) {
		var w = (i / m - y) * z;
		a[i] += x * Math.exp(-w * w);
		}
	}
	return d3.range(n).map(function() {
		var a = [], i;
		for (i = 0; i < m; i++) a[i] = o + o * Math.random();
		for (i = 0; i < 5; i++) bump(a);
		return a.map(stream_index);
		});
	}

	/* Another layer generator using gamma distributions. */
	function stream_waves(n, m) {
	return d3.range(n).map(function(i) {
		return d3.range(m).map(function(j) {
			var x = 20 * j / m - i / 3;
			return 2 * x * Math.exp(-.5 * x);
		}).map(stream_index);
		});
	}

	function stream_index(d, i) {
	return {x: i, y: Math.max(0, d)};
	}

    var testdata = stream_layers(9,10+Math.random()*100,.1).map(function(data, i) {
        return {
            key: 'Stream' + i,
            values: data.map(function(a){a.y = a.y * (i <= 1 ? -1 : 1); return a})
        };
    });
    testdata[0].type = "area";
    testdata[0].yAxis = 1;
    testdata[1].type = "area";
    testdata[1].yAxis = 1;
    testdata[2].type = "line";
    testdata[2].yAxis = 1;
    testdata[3].type = "line";
    testdata[3].yAxis = 2;
    testdata[4].type = "scatter";
    testdata[4].yAxis = 1;
    testdata[5].type = "scatter";
    testdata[5].yAxis = 2;
    testdata[6].type = "bar";
    testdata[6].yAxis = 2;
    testdata[7].type = "bar";
    testdata[7].yAxis = 2;
    testdata[8].type = "bar";
    testdata[8].yAxis = 2;

    var MultiChartView = ChartView.extend({

        initialize: function(options) {
            var self = this;
            this.viewConfig = options.viewConfig;
            self.chartView = nv.models.multiChart();
            ChartView.prototype.bindListeners.call(this);
        },

        render: function() {
            var self = this;
            // var chartTemplate = $('#chart-template').html();

            nv.addGraph(function() {
				ChartView.prototype.setNvd3ChartOptions.call(this);
                //     .margin({top: 30, right: 60, bottom: 50, left: 70})
                //     .color(d3.scale.category10().range());
                // chart.xAxis.tickFormat(d3.format(',f'));
                // chart.yAxis1.tickFormat(d3.format(',.1f'));
                // chart.yAxis2.tickFormat(d3.format(',.1f'));
                self.$el.append('<svg></svg>');
                d3.select($(self.$el).find('svg')[0])
                    .datum(testdata)
                    .transition().duration(500).call(self.chartView);
                return self.chartView;
            });
        }
    });
    return MultiChartView;
});
