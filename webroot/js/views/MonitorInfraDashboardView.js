/*
 * Copyright (c) 2015 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'backbone',
    'core-basedir/js/views/InfoboxesView',
    'mon-infra-log-list-model',
    'mon-infra-node-list-model',
    'mon-infra-alert-list-view',
    'mon-infra-log-list-view',
    'mon-infra-sysinfo-view',
    'contrail-view'
], function(_,Backbone,InfoboxesView,
        LogListModel,NodeListModel,
        AlertListView,LogListView,SystemInfoView,ContrailView) {

    //Ensure MonInfraDashboardView is instantiated only once and re-used always
    //Such that tabs can be added dynamically like from other feature packages
    //Instead oaf assigning the extended Backbone View to a class,instantiate it immediately
    return ContrailView.extend({
        el: $(contentContainer),
        render: function () {
            var self = this;
            self.isRendered = true;
            var dashboardTmpl = contrail.getTemplate4Id(cowc.TMPL_INFRA_DASHBOARD);
            $(self.$el).html(dashboardTmpl);
            this.infoBoxView = new InfoboxesView({
                el: $(self.$el).
                    find('#dashboard-infoboxes')
            });
            self.nodeListModel = new NodeListModel();
            self.nodeListModel.reset();
            var alertListView = new AlertListView({
                el: $(contentContainer).find('#alerts-box'),
                model: self.nodeListModel.getAlertListModel()
            });
            alertListView.render();
            var sysInfoView = new SystemInfoView({
                el: $(contentContainer).find('#sysinfo-box'),
                model: self.nodeListModel.getNodeListModel()
            });
            sysInfoView.render();
            //Delay the logs ajax request such that node-model's ajax requests are issued first
            setTimeout(function() {
                var $logsBox = $(contentContainer).find("#logs-box"),
                    logListView = new LogListView({
                        el: $logsBox.find(".widget-body .widget-main"),
                        model: new LogListModel()
                    });

                $logsBox.find(".widget-header").initWidgetHeader({
                    title: "Logs"
                });

                logListView.render();
            },100);
            require(['mon-infra-controller-dashboard'], function (ControllerDashboardView) {
                var monInfraDashboardView = new ControllerDashboardView({
                    // el: $(contentContainer)
                });
                self.addInfoboxes(monInfraDashboardView.getInfoboxesConfig());
            });
        },
        addInfoboxes: function(infoBoxesCfg) {
            var self = this
            for(var i=0;i<infoBoxesCfg.length;i++) {
                self.infoBoxView.add(infoBoxesCfg[i]);
                //For each of the infoboxesCfg,add the model to NodeListModel 
                self.nodeListModel.addListModel(infoBoxesCfg[i]['model']);
            }
        }
    });

});
