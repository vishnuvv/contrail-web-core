/*
 * Copyright (c) 2016 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'contrail-view',
    'contrail-list-model',
    'legend-view',
    'core-constants',
    'chart-utils',
    'event-drops'
], function (_, ContrailView,  ContrailListModel, LegendView, cowc,chUtils) {
    var cfDataSource;
    var eventDropsView = ContrailView.extend({
        render: function () {
            var self = this;
            var data = [{
                name: "http requests",
                data: [{
                    date: new Date('2014/09/15 13:24:54'),
                    foo: 'bar1'
                }, {
                    date: new Date('2014/09/15 13:25:03'),
                    foo: 'bar2'
                }, {
                    date: new Date('2014/09/15 13:25:05'),
                    foo: 'bar1'
                }]
            }, {
                name: "SQL queries",
                data: [{
                    date: new Date('2014/09/15 13:24:57'),
                    foo: 'bar4'
                }, {
                    date: new Date('2014/09/15 13:25:04'),
                    foo: 'bar6'
                }, {
                    date: new Date('2014/09/15 13:25:04'),
                    foo: 'bar2'
                }]
            }];
            var colors =  d3.scale.category10();
            var eventDropsChart = d3.chart.eventDrops()
                .start(new Date(new Date().getTime() - 3 * 3600000 * 24 * 365)) // one year ago
                .end(new Date())
                .eventLineColor(function(d, i) { return colors(i)})
                .date(function(d){
                    return d.date;
                });
            d3.select(self.$el[0])
            .datum(data)
            .call(eventDropsChart);
        },
    });

    return eventDropsView;
});
