/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'contrail-view',
    'chart-utils'
], function (_, ContrailView, chUtils) {
    var ChartView = ContrailView.extend({
        render: function () {
        },
        showText: function (data, viewConfig) {
            var self = this,
                selector = contrail.handleIfNull(selector, $(self.$el)),
                groups = d3.selectAll($(selector).find(".nv-group")),
                textPositionX = ($(selector).find('.chart-container').width() - 20) / 2,
                textPositionY = $(selector).find('.chart-container').height() / 2;
                groups.selectAll('text.center-text').remove();
                groups.selectAll('text')
                      .data(function (d) {
                            return [d];
                      })
                      .enter()
                      .append('text')
                      .style('text-anchor', 'middle')
                      .style('fill', function (d) {
                            return d['color'];
                      })
                      .attr('class', 'center-text')
                      .attr('x', textPositionX)
                      .attr('y', textPositionY)
                      .text(function (d) {
                            return d['text'] != null ? d['text'] : getLastYValue(data, viewConfig);
                      });

        },

        renderMessage: function(message, selector, chartOptions) {
            var self = this,
                message = contrail.handleIfNull(message, ""),
                selector = contrail.handleIfNull(selector, $(self.$el)),
                chartOptions = contrail.handleIfNull(chartOptions, self.chartViewModel.chartOptions),
                container = d3.select($(selector).find("svg")[0]),
                requestStateText = container.selectAll('.nv-requestState').data([message]),
                textPositionX = $(selector).width() / 2,
                textPositionY = chartOptions.margin.top + $(selector).find('.nv-focus').heightSVG() / 2 + 10;

            requestStateText
                .enter().append('text')
                .attr('class', 'nvd3 nv-requestState')
                .attr('dy', '-.7em')
                .style('text-anchor', 'middle');

            requestStateText
                .attr('x', textPositionX)
                .attr('y', textPositionY)
                .text(function(t){ return t; });

        },

        removeMessage: function(selector) {
            var self = this,
                selector = contrail.handleIfNull(selector, $(self.$el));

            $(selector).find('.nv-requestState').remove();
        },

        bindListeners: function() {
            var self = this;
            if(self.model instanceof Backbone.Model) {
                self.model.on("change",function() {
                    self.renderChart($(self.$el), self.viewConfig, self.model);
                });
            } else {
                cfDataSource = self.cfDataSource;
                viewConfig = self.viewConfig;
                if (self.model === null && viewConfig['modelConfig'] != null) {
                    self.model = new ContrailListModel(viewConfig['modelConfig']);
                }

                if (self.model !== null) {
                    if(cfDataSource == null) {
                        self.renderChart($(self.$el), viewConfig, self.model);
                    } else if(self.model.loadedFromCache == true) {
                        self.renderChart($(self.$el), viewConfig, self.model);
                    }

                    if(cfDataSource != null) {
                        cfDataSource.addCallBack('updateChart',function(data) {
                            self.renderChart($(self.$el), viewConfig, self.model);
                        });
                    } else {
                        self.model.onAllRequestsComplete.subscribe(function () {
                            self.renderChart($(self.$el), viewConfig, self.model);
                        });
                    }

                    if (viewConfig.loadChartInChunks) {
                        self.model.onDataUpdate.subscribe(function () {
                            self.renderChart($(self.$el), viewConfig, self.model);
                        });
                    }
                }
            }
            $($(self.$el)).bind("refresh", function () {
                self.renderChart($(self.$el), viewConfig, self.model);
            });
            self.prevDimensions = chUtils.getDimensionsObj(self.$el);
            /* window resize may not be require since the nvd3 also provides a smoother refresh*/
            self.resizeFunction = _.debounce(function (e) {
                if(!chUtils.isReRenderRequired({
                    prevDimensions: self.prevDimensions,
                    elem:self.$el})) {
                    return;
                }
                self.prevDimensions = chUtils.getDimensionsObj(self.$el);
                self.renderChart($(self.$el), self.viewConfig, self.model);
            },cowc.THROTTLE_RESIZE_EVENT_TIME);
            window.addEventListener('resize',self.resizeFunction);
            $(self.$el).parents('.custom-grid-stack-item').on('resize',self.resizeFunction);
        }
    });

    return ChartView;
});
