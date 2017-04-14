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
        },
        render: function() {
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
            ]
            function createPortArray (count) {
            let portArray = []

            for (let i = 0; i < count; i++) {
                portArray.push(_.random(1, 65535))
            }

            return portArray
            }
            function createProtocolArray (count) {
            let protocolArray = [6, 12, 1]

            for (let i = 0; i < (count - 3); i++) {
                protocolArray.push(_.random(13, 142))
            }

            return protocolArray
            }
            function createIPArray (count) {
            let ipArray = []

            for (let i = 0; i < count; i++) {
                ipArray.push('10.1.1.' + _.random(1, 128))
            }

            return ipArray
            }
            function createVNArray (count) {
            let vnArray = []

            for (let i = 0; i < count; i++) {
                vnArray.push('vnetwork-' + (i + 1))
            }

            return vnArray
            }

            function vRouterTraffic (dataConfig = {}) {
            let data = []

            const flowCount = dataConfig['flowCount'] || 65
            const vnCount = dataConfig['vnCount'] || 10
            const ipCount = dataConfig['portCount'] || 10
            const protocolCount = dataConfig['protocolCount'] || 3
            const portCount = dataConfig['portCount'] || 10

            const srcVNArray = createVNArray(vnCount)
            const destVNArray = createVNArray(vnCount)

            const srcIPArray = createIPArray(ipCount)
            const destIPArray = createIPArray(ipCount)

            const protocolArray = createProtocolArray(protocolCount)

            const srcPortArray = createPortArray(portCount)
            const destPortArray = createPortArray(portCount)

            const now = _.now()

            for (let i = 0; i < flowCount; i++) {
                const bytes = _.random(74325736, 474325736)

                const flow = {
                'UuidKey': 'b5ba466a-9e56-42e8-8cf5-e75d27c62' + i,
                'action': 'pass',
                'agg-bytes': bytes,
                'agg-packets': _.round((bytes / 330), 0),
                'destip': destIPArray[_.random(0, destIPArray.length - 1)],
                'destvn': destVNArray[_.random(0, destVNArray.length - 1)],
                'direction_ing': 1,
                'dport': destPortArray[_.random(0, destPortArray.length - 1)],
                'protocol': protocolArray[_.random(0, protocolArray.length - 1)],
                'setup_time': now,
                'sourceip': srcIPArray[_.random(0, srcIPArray.length - 1)],
                'sourcevn': srcVNArray[_.random(0, srcVNArray.length - 1)],
                'sport': srcPortArray[_.random(0, srcPortArray.length - 1)],
                'vrouter': 'a7s12'
                }

                data.push(flow)
            }

            return data
            }

            var dendrogamData = {
            data: vRouterTraffic()
            };

            this.$el.append($('<div>',{id:'chartBox'}));

            var chartConfig = {
                id: 'chartBox',
                components: [{
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
                }, {
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
                    arcLabelXOffset: 2,
                    arcLabelYOffset: 25,
                    levels: [{ level: 0, label: 'Virtual Network' }, { level: 1, label: 'IP' }, { level: 2, label: 'Port' }],
                    hierarchyConfig: {
                        parse: function parse(d) {
                        var srcHierarchy = [d.sourcevn, d.sourceip, d.sport];
                        var src = {
                            names: srcHierarchy,
                            id: srcHierarchy.join('-'),
                            value: d['agg-bytes']
                        };
                        var dstHierarchy = [d.destvn, d.destip, d.dport];
                        var dst = {
                            names: dstHierarchy,
                            id: dstHierarchy.join('-'),
                            value: d['agg-bytes']
                        };
                        return [src, dst];
                        }
                    },
                    drillDownLevel: 3,
                    tooltip: 'tooltip-id'
                    }
                }, {
                    id: 'tooltip-id',
                    type: 'Tooltip',
                    config: {
                    formatter: function formatter(data) {
                        var type = ['Virtual Network', 'IP', 'Port'];
                        var content = { title: type[data.level - 1], items: [] };
                        content.items.push({
                        label: 'Value',
                        value: data.name
                        }, {
                        label: 'Flow Count',
                        value: data.children.length
                        });
                        return content;
                    }
                    }
                }]
            };

            var chartView = new coCharts.ChartView();
            chartView.setConfig(chartConfig);
            chartView.setData(dendrogamData.data);
            chartView.render();
        }
    });

    return ContrailChartsView;

});
