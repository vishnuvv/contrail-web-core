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
                                                id: 'confignode-requests-served',
                                                itemAttr: {
                                                    height: 1,
                                                    width: 1/3
                                                }
                                            },{
                                                id: 'analyticsnode-sandesh-message-info',
                                                itemAttr: {
                                                    height: 1,
                                                    width: 1/3
                                                }
                                            }, {
                                                id:'databasenode-disk-usage-info',
                                                itemAttr:{
                                                    height: 1,
                                                    width: 1/3,
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
