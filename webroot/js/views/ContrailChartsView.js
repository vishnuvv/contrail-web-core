define([
    'lodashv4',
    'core-basedir/js/views/ChartView',
    'contrail-list-model',
    'legend-view',
    'core-constants',
    'chart-utils'
], function (_, ChartView,  ContrailListModel, LegendView, cowc, chUtils) {

    var ContrailChartsView = ChartView.extend({
        initialize: function() {
            var self = this;
            var radialColorScheme10 = [
                '#3f51b5',
                d3v4.schemeCategory10[0],
                d3v4.schemeCategory10[2],
                '#9c27b0',
                '#00bcd4',
                '#4caf50',
                '#a88add',
                '#fcc100',
                '#2196f3',
                '#c62828',
            ];
            self.chartConfig = {
                id: 'chartBox',
                components: [/*{
                    type: 'LegendPanel',
                    config: {
                    sourceComponent: 'dendrogram-chart-id',
                    editable: {
                        colorSelector: true,
                        chartSelector: false
                    },
                    placement: 'horizontal',
                    filter: true
                    }
                },*/ {
                    id: 'dendrogram-chart-id',
                    type: 'RadialDendrogram',
                    config: {
                        parentSeparation: 1.0,
                        parentSeparationShrinkFactor: 0.05,
                        parentSeparationDepthThreshold: 4,
                        colorScale: d3v4.scaleOrdinal().range(radialColorScheme10), // eslint-disable-line no-undef
                        drawLinks: false,
                        drawRibbons: true,
                        arcWidth: 10,
                        arcLabelLetterWidth: 5,
                        showArcLabels: true,
                        arcLabelXOffset: 25,
                        arcLabelYOffset: -5,
                        chartHeight: 500,   //drill-down level 1
                        chartHeight: 600,   //drill-down level 2
                        // chartHeight: 700,   //drill-down level 3
                        levels: [{ level: 0, label: 'Virtual Network' }, { level: 1, label: 'IP' }, { level: 2, label: 'Port' }],
                        levels: [{ level: 0, label: 'Virtual Network' }, { level: 1, label: 'IP' }],
                        /*hierarchyConfig: {
                            parse: function parse(d) {
                                var srcHierarchy = [d.sourcevn, d.sourceip, d.sport];
                                srcHierarchy = [d.src_application, d.src_deployment];
                                var src = {
                                    names: srcHierarchy,
                                    id: srcHierarchy.join('-'),
                                    value: d['agg-bytes']
                                };
                                var dstHierarchy = [d.destvn, d.destip, d.dport];
                                dstHierarchy = [d.dst_application, d.dst_deployment];
                                var dst = {
                                    names: dstHierarchy,
                                    id: dstHierarchy.join('-'),
                                    value: d['agg-bytes']
                                };
                                return [src, dst];
                            }
                        },*/
                        // drillDownLevel: 3,
                        drillDownLevel: 3,
                        tooltip: 'tooltip-id'
                    }
                }, {
                    id: 'tooltip-id',
                    type: 'Tooltip',
                    config: {
                    formatter: function formatter(data) {
                        var type = ['Virtual Network', 'IP', 'Port'];
                        type = ['Application','Deployment'];
                        type = self.levels;
                        var content = { title: _.startCase(type[data.level - 1]['label']), items: [] };
                        content.items.push({
                            label: 'Value',
                            value: data.name
                        }, {
                            label: 'Flows',
                            value: data.children.length
                        });
                        return content;
                    }
                    }
                }]
            };
        },
        updateConfig: function(config) {
            var self = this;
            if(typeof(config.hierarchyConfig.parse) == 'function') {
                self['chartConfig']['components']['0']['config']['hierarchyConfig'] = {
                    parse : config.hierarchyConfig.parse
                };
            }
            if(typeof(config.levels) != 'undefined') {
                _.set(self,'chartConfig.components.0.config.levels',config.levels);
                self.levels = config.levels;
                // self['chartConfig']['components']['0']['config']['levels'] = config.levels;
            }
            // $.extend(true,self.chartConfig,config);
        },
        render: function() {
            var self = this;

            var dendrogamData = {
                data: cowu.getRadialChartData()
            };

            this.$el.empty();
            this.$el.append($('<div>',{id:'chartBox'}));

            var chartView = new coCharts.ChartView();
            chartView.setConfig(self.chartConfig);
            // chartView.setData(dendrogamData.data);
            // chartView.setData(this.model.get('data'));
            chartView.setData(this.model.get('data').toJSON());
            chartView.render();
        }
    });

    return ContrailChartsView;

});
