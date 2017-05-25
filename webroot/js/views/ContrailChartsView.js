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
                components: [{
                    id: 'dendrogram-chart-id',
                    type: 'RadialDendrogram',
                    config: {
                        parentSeparation: 1.0,
                        parentSeparationShrinkFactor: 0.05,
                        parentSeparationDepthThreshold: 4,
                        colorScale: d3v4.scaleOrdinal().range(radialColorScheme10), // eslint-disable-line no-undef
                        drawLinks: false,
                        drawRibbons: true,
                        arcWidth: 15,
                        arcLabelLetterWidth: 5,
                        showArcLabels: true,
                        labelFlow: 'perpendicular',
                        arcLabelXOffset: 0,
                        arcLabelYOffset: 20,
                        levels: [ { level: 0, label: 'Virtual Network' }, { level: 1, label: 'IP' }, { level: 2, label: 'Port' } ],
                        drillDownLevel: 1,
                        tooltip: 'tooltip-id'
                    }
                },{
                    id: 'tooltip-id',
                    type: 'Tooltip',
                    config: {
                        formatter: function formatter(data) {
                            var type = ['Virtual Network', 'IP', 'Port'];
                            type = ['Application','Deployment'];
                            if(data.level){
                                type = self.levels;
                                var content = { title: data.namePath.join('-'), items: [] };

                                var children = data.children;
                                //If name is not matching with the leaf node
                                // if(data.level == 1 && data.namePath.length > 1) {
                                if(_.result(children,'0.children') != null) {
                                    children = _.map(data.children,function(val,idx) {
                                        return val['children'];
                                    });
                                    children = _.flatten(children);
                                }

                                content.items.push({
                                    label: 'Traffic In',
                                    value:  formatBytes(_.sumBy(children,function(currSession) {
                                        if(currSession.type == 'src')
                                            return _.result(currSession,'otherNode.inBytes',0);
                                        else
                                            return 0;
                                    }))
                                }, {
                                    label: 'Traffic Out',
                                    value: formatBytes(_.sumBy(children,function(currSession) {
                                        if(currSession.type == 'src')
                                            return _.result(currSession,'otherNode.outBytes');
                                        else
                                            return 0;
                                    }))
                                });
                            } else {
                                var content = { title: data.id, items: [] };
                            }
                            return content;
                        }
                    }
                }]
            };
        },
        updateConfig: function(config) {
            var self = this;
            self.levels = config.levels;
            $.extend(true,self.chartConfig,config);
        },
        render: function() {
            var self = this;
            this.$el.empty();
            this.$el.append($('<div>',{id:'chartBox'}));

            var chartView = new coCharts.ChartView();
            chartView.setConfig(self.chartConfig);
            chartView.setData(this.model.getItems());
            if (self.model === null && viewConfig['modelConfig'] !== null) {
                self.model = new ContrailListModel(viewConfig['modelConfig']);
            }
            if (self.model !== null) {
                if(self.model.loadedFromCache || !(self.model.isRequestInProgress())) {
                    chartView.render();
                }

                self.model.onAllRequestsComplete.subscribe(function() {
                    chartView.setData(self.model.getItems().slice(0,50));
                    chartView.render();
                });
                var prevDimensions = chUtils.getDimensionsObj(self.$el);
                self.resizeFunction = _.debounce(function (e) {
                    if(!chUtils.isReRenderRequired({
                        prevDimensions:prevDimensions,
                        elem:self.$el})) {
                        return;
                    }
                     chartView.render();
                 },cowc.THROTTLE_RESIZE_EVENT_TIME);
            }
        }
    });

    return ContrailChartsView;

});
