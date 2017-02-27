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

                    // if (viewConfig.loadChartInChunks) {
                        self.model.onDataUpdate.subscribe(function () {
                            self.renderChart($(self.$el), viewConfig, self.model);
                        });
                    // }
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
