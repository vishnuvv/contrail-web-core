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
        initialize: function(options) {
            var self = this;
            self.viewCfg = cowu.getValueByJsonPath(options,'attributes;viewConfig',{});
        },
        render: function () {
            var self = this;
            self.tooltipDiv = d3.select("body").append("div")
                            .attr("class", "event-drops-tooltip")
                            .style("opacity", 0);
            if(self.model.loadedFromCache == true) {
                self.renderChart();
            } else {
                self.model.onAllRequestsComplete.subscribe(function() {
                    var eventDropsWidgetTmpl = contrail.getTemplate4Id('eventdrops-widget-template');
                    self.$el.html(eventDropsWidgetTmpl);
                    self.renderChart();
                });
            }
        },
        showTooltip : function(d) {
            d3.select('body').selectAll('.event-drops-tooltip').remove();
            var self = this;
            var FONT_SIZE = 12; // in pixels
            var TOOLTIP_WIDTH = 30; // in rem
            var tooltip = d3.select("body").append("div")
                            .attr("class", "event-drops-tooltip")
                            .style("opacity", 0);
            // show the tooltip with a small animation
            tooltip.transition()
                .duration(200)
                .each('start', function start() {
                    d3.select(this).style('block');
                })
                .style('opacity', 1);
            var rightOrLeftLimit = FONT_SIZE * TOOLTIP_WIDTH;
            rightOrLeftLimit = 300;
            //Check if tooltip can be accomodated on right
            var direction = d3.event.pageX > rightOrLeftLimit ? 'right' : 'left';

            var ARROW_MARGIN = 1.65;
            var ARROW_WIDTH = FONT_SIZE;
            var left = direction === 'right' ?
                d3.event.pageX - rightOrLeftLimit + 30 :
                d3.event.pageX - ARROW_MARGIN * FONT_SIZE - ARROW_WIDTH / 2;

            var jsonField = '';
            if(d['ObjectLog'] != null) {
                jsonField = 'ObjectLog';
            } else if(d['body'] != null) {
                jsonField = 'body';
            } else {
                jsonField = 'Xmlmessage';
            }
            var xmlMessageJSON;
            try {
                xmlMessageJSON = JSON.parse(d[jsonField]);
            } catch(e) {
                xmlMessageJSON = cowu.formatXML2JSON(d[jsonField]);
            }
            var tooltipColumns = [
                { field:'MessageTS',
                  label: 'Time',
                  formatter: function(d) {
                    return d3.time.format("%d/%m/%y %H:%M:%S")(new Date(d/1000))
                  }
                },{
                    field:'Source',
                    label:'Source'
                },{
                    field:'useragent',
                    label:'Useragent'
                },{
                    field:'remote_ip',
                    label:'Remote IP'
                },{
                    field:'domain',
                    label:'Domain'
                },{
                    field:'project',
                    label:'Project'
                },{
                    field:'operation',
                    label:'Operation'
                }
            ]
            var xmlMessage = '<pre class="pre-format-JSON2HTML">' + contrail.formatJsonObject(xmlMessageJSON) + '</pre>';
            var tooltipContent = '';
            tooltipContent += '<div class="event-drops popover-remove">' + 
                '<i class="fa fa-remove pull-right popover-remove-icon"></i>'+ 
            '</div>';
            $.each(tooltipColumns,function(idx,tooltipCfg) {
                tooltipContent += '<div>'; 
                tooltipContent += '<b>' + tooltipCfg['label'] + ': </b>'; 
                if(typeof(tooltipCfg['formatter']) == 'function') {
                    tooltipContent += tooltipCfg['formatter'](d[tooltipCfg['field']]);
                } else {
                    tooltipContent += d[tooltipCfg['field']];
                }
                tooltipContent += '</div>';
            });
            // var tooltipTemplate = contrail.getTemplate4Id(cowc.TMPL_ELEMENT_TOOLTIP_CONTENT);
            tooltip.html(tooltipContent + 
                        '<hr/>' + 
                        '<div><b>' + 'Config object:'  + '</b></div>' + 
                        '<div>' + xmlMessage  + '</div>');
            // tooltip.html(tooltipTemplate({info: [{label:'Hello',value:'Hai'},
            //                                 {label:'Hello',value:'Hai'}]}));
            $('.event-drops.popover-remove').on('click',function() {
                $('.event-drops-tooltip').remove()
            });

            tooltip
            .classed(direction,true)
            .style({
                left: left + 'px',
                top: (d3.event.pageY + 16) + 'px',
                position: 'absolute'
            });
        },
        hideTooltip : function() {
            /*d3.select('.event-drops-tooltip').transition()
                .duration(200)
                .each('end', function end() {
                    this.remove();
                })
                .style('opacity', 0);*/
        },
        renderChart: function() {
            var self = this;
            var colors =  d3.scale.category10();
            colors = cowc.FIVE_NODE_COLOR;
            colors = ["rgb(13,81,156)","rgb(50,129,189)","rgb(106,174,214)"]
            var data = self.model.getItems();
            var labelsWidth = 160;
            if(self.viewCfg.groupBy != null) {
                data = _.groupBy(data,function(d) { return ifNull(d[self.viewCfg.groupBy],d.Messagetype); });
                data = _.map(data,function(value,key) {
                    return {
                        name: key,
                        data: value
                    }
                });
            } else {
                data = [{
                    name: '',
                    data: data
                }]
                labelsWidth = 0;
            }
            var eventDropsChart = d3.chart.eventDrops()
                .start(new Date(new Date().getTime() - 2 * 60 * 60 * 1000)) //last 2 hours
                .end(new Date())
                // .eventLineColor(function(d, i) { return colors[i]})
                .labelsWidth(200)
                // .zoomable(false)
                //.eventLineColor(function(d, i) { return colors(i)})
                .eventLineColor(function(d, i) { return colors[i%colors.length]})
                // .labelsWidth(labelsWidth)
                .mouseover(self.showTooltip)
                .mouseout(self.hideTooltip)
                .date(function(d){
                    return new Date(d.MessageTS/1000);
                });
            self.$el.find('.eventdrops-widget-title').text(self.viewCfg['title']);
            self.$el.find('.eventdrops-widget-title').addClass('drag-handle');
            d3.select(self.$el.find('.eventdrops-chart')[0])
            .datum(data)
            .call(eventDropsChart);
        }
    });

    return eventDropsView;
});
