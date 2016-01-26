/*
 * Copyright (c) 2015 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'backbone'
],function(_,Backbone) {
    var LogListView = Backbone.View.extend({
        initialize: function(options) {
        },
        renderLogs: function() {
            var self = this;
            var logList = self.model.getItems();
            var logListTmpl = contrail.getTemplate4Id('logList-template');
            self.$el.find('.widget-header i').hide(); 
            //Display only recent 3 log messages
            self.$el.find('.widget-body .widget-main').
                html(logListTmpl(logList.reverse().slice(0,3)));
        },
        render: function() {
            var self = this;
            if(self.model.isPrimaryRequestInProgress() == false || self.model.loadedFromCache)
                self.renderLogs();
            self.model.onDataUpdate.subscribe(function() {
                self.renderLogs();
            });
        }
    });
    return LogListView;
});
