/*
 * Copyright (c) 2015 Juniper Networks, Inc. All rights reserved.
 */

define([
], function () {
    var IframeView = Backbone.View.extend({
        initialize: function(options) {
            var self=this;
            this.options = options;
        },
        render: function() {
            var self = this,
                elId = self.options.elementId,
                viewConfig = self.options.viewConfig;
            var iFrameTmpl = contrail.getTemplate4Id("iframe-template");
            $('#main-container').html('');
            $('body').append(iFrameTmpl({
                url: "./gohan.html"
            }));
        }
    });
    return IframeView;
});
