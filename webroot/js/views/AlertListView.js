/*
 * Copyright (c) 2015 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'backbone',
    'contrail-view',
],function(_,Backbone,ContrailView) {
    var AlertListView = ContrailView.extend({
        initialize: function(options) {
        },
        renderAlerts: function() {
            var self = this;
            var alertListTmpl = contrail.getTemplate4Id('alerts-template');
            var alertList = self.model.getItems();

            self.$el.find('.widget-body .widget-main').
                html(alertListTmpl(alertList.slice(0,5)));
            self.$el.find('.widget-header i').hide();

            self.$el.find('#moreAlertsLink').click(function() {
                cowu.loadAlertsPopup({
                    model: self.model
                });
            });
        },
        render: function() {
            var self = this;
            if(self.model.isPrimaryRequestInProgress == false)
                self.renderAlerts();
            self.model.onDataUpdate.subscribe(function() {
                //Render Alerts container if not empty or all nodeListModels requests are complete
                if(self.model.getItems().length > 0 || self.isPrimaryRequestInProgress == false) {
                    self.renderAlerts();
                }
            });
        }
    });
    return AlertListView;
});
