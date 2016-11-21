/*
 * Copyright (c) 2015 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'contrail-view',
    'contrail-list-model',
], function (_, ContrailView, ContrailListModel) {
    var NotificationView = ContrailView.extend({
        initialize: function (args) {
            var self = this;
            self.selector = getValueByJsonPath(args, 'el');
            self.viewConfig = getValueByJsonPath(args, 'viewConfig');
        },
        render: function () {
            var self = this,
                viewConfig = self.viewConfig != null ? self.viewConfig :self.attributes.viewConfig,
                selector = self.selector != null ? $(self.selector) : self.$el;

            if (self.model == null && viewConfig['modelConfig'] != null) {
                self.model = new ContrailListModel(viewConfig['modelConfig']);
            }

            //self.renderNotifications(selector, viewConfig, self.model);

            if (self.model !== null) {
                if(self.model.loadedFromCache || !(self.model.isRequestInProgress())) {
                    self.renderNotifications(selector, viewConfig, self.model);
                }

                self.model.onAllRequestsComplete.subscribe(function() {
                    self.renderNotifications(selector, viewConfig, self.model);
                });

                if(viewConfig.loadChartInChunks) {
                    self.model.onDataUpdate.subscribe(function() {
                        self.renderNotifications(selector, viewConfig, self.model);
                    });
                }
                var resizeFunction = function (e) {
                    self.renderNotifications(selector, viewConfig, self.model);
                };

                /*$(window)
                    .off('resize', resizeFunction)
                    .on('resize', resizeFunction);*/
            }
        },

        renderNotifications: function (selector, viewConfig, chartViewModel) {
            var self = this,
                data = chartViewModel.getItems(),
                callSlide = false;
                

            if (contrail.checkIfFunction(viewConfig['parseFn'])) {
                data = viewConfig['parseFn'](data);
            }
            if ($('#notificationcenterpanel').length == 0) {
                $('body').notificationcenter({
                    center_element: "#notificationcenterpanel",
                    body_element: "#main-container",
                    toggle_button: self.el,
                    add_panel: true,
                    notification_offset: 50,
                    display_time: 5000,
                    overlay: false,
                    append: true, // By default latest pushed notification is displaying first, when the
                                  // append flag is true latest will display in last.
                    close_button: false, //Option is for the close button at category level 
                    slide: false, //Option is to decide page should slide when we displaying the notification
                    /*types: [{
                        type: 0, // define the type
                        header_output: '{icon} {type} {count}', // if not present the global is used
                        bgcolor: '#EB5D49', // background color for the center header
                        color: '#dc6660' // text color for the center header
                    }, {
                        type: 1, // define the type
                        header_output: '{icon} {type} {count}', // if not present the global is used
                        bgcolor: '#EB5D49', // background color for the center header
                        color: '#dc6660' // text color for the center header
                    }, {
                        type: 2, // define the type
                        header_output: '{icon} {type} {count}', // if not present the global is used
                        bgcolor: '#EB5D49', // background color for the center header
                        color: '#ffbf87' // text color for the center header
                    }],*/
                    type_max_display: 15000,
                    truncate_message: 0,
                    header_output: '{icon} {type} {count}',
                    counter: false,
                    faye: false,
                    ajax: false,
                    ajax_checkTime: 5000,
                    alert_hidden: false,
                    store_callback: false
                });
            }
            $('#alarms-popup-link div.pointer').toggle();
            var headerTemplate = contrail.getTemplate4Id('notification-header');
            $.notificationcenter.newAlert(headerTemplate(), null, false, null, null, true);
            $.each(data, function (idx, obj){
                $.notificationcenter.newAlert(obj['text'], null, false, null, new Date().getTime(), true);
            });
            $.notificationcenter.slide();
        }
    });

    return NotificationView;
});