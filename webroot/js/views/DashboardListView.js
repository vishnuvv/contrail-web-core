/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define(
        [ 'underscore', 'contrail-view'],
        function(
                _, ContrailView) {
            var DashboardListView = ContrailView.extend({
                render : function() {
                    var self = this;
                    self.renderView4Config($(contentContainer), null,
                            getDashboardListViewConfig());
                }
            });
            function getDashboardListViewConfig() {
                var controllerEnabled = cowu.getValueByJsonPath(globalObj, 'webServerInfo;featurePkgsInfo;webController;enable', false);
                var carouselpages = [];
                if (controllerEnabled) {
                    carouselpages.push({
                                    page: {
                                        elementId: 'dashboard-grid-stackview-0',
                                        view: 'GridStackView',
                                        viewConfig: {
                                            elementId: 'dashboard-grid-stackview-0',
                                            gridAttr: {
                                                defaultWidth: 24,
                                                defaultHeight: 8
                                            },
                                            widgetCfgList: [{
                                                id: 'dashboard-resource-utilization',
                                                itemAttr: {
                                                    height: 1,
                                                    width: 1/2
                                                }
                                            },{
                                                id: 'dashboard-virtualization-overview',
                                                itemAttr: {
                                                    height: 1,
                                                    width: 1/2,
                                                }
                                            },{
                                                id:'monitor-infra-scatterchart-view',
                                                itemAttr:{
                                                    height: 1,
                                                    width: 1/3,
                                                    cssClass: 'panel panel-default',
                                                }
                                            }, {
                                                id:'vrouter-flow-rate-area-chart',
                                                itemAttr: {
                                                    cssClass: 'panel panel-default'    
                                                }
                                            },{
                                                id: 'confignode-requests-served',
                                                itemAttr: {
                                                    height: 1,
                                                    width: 1/3,
                                                    cssClass: 'panel panel-default'
                                                }
                                            },{
                                                id: 'analyticsnode-sandesh-message-info',
                                                itemAttr: {
                                                    height: 1,
                                                    width: 1/3,
                                                    cssClass: 'panel panel-default'
                                                }
                                            },{
                                                id:'databasenode-disk-usage-info',
                                                itemAttr:{
                                                    height: 1,
                                                    width: 1/3,
                                                    cssClass: 'panel panel-default',
                                                    config:{
                                                        nodeType:'database-node'
                                                    }
                                                }
                                            }]
                                        }
                                    }
                                }
                    );
                }
                carouselpages.push({
                    page: {
                        elementId: 'dashboard-grid-stackview-1',
                        view: "MonitorInfraDashboardView",
                        // viewPathPrefix: 'monitor/infrastructure/dashboard/ui/js/views/',
                        viewConfig: {
                            elementId: 'dashboard-grid-stackview-1',
                        }
                    }
                });
                var viewConfig = {
                    rows: [{
                        columns: [{
                            elementId: 'dashboard-carousel-view',
                            view: "CarouselView",
                            viewConfig: {
                                pages: carouselpages
                            }
                        }]
                    }]
                };
                return {
                    elementId : cowu.formatElementId([cowc.DASHBOARD_LIST_SECTION_ID ]),
                    view : "SectionView",
                    viewConfig : viewConfig
                };
            }
            return DashboardListView;
        });
