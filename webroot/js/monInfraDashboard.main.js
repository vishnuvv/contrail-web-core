/*
 * Copyright (c) 2015 Juniper Networks, Inc. All rights reserved.
 */

var monInfraDashboardLoader = new MonInfraDashboardLoader();

function MonInfraDashboardLoader() {
    this.load = function (paramObject) {
        var self = this, 
            hashParams = paramObject['hashParams'],
            renderFn = paramObject['function'];

        require(['core-basedir/js/views/DashboardListView'], function (DashboardListView) {
            var dashboardListView = new DashboardListView();
            dashboardListView.render({
                el: $(contentContainer)
            });
        });
    };

    this.destroy = function()  {
    }
}

