/*
 * Copyright (c) 2016 Juniper Networks, Inc. All rights reserved.
 */
define([ 'lodash',
        'controlnode-widgetcfg', 'vrouter-widgetcfg','databasenode-widgetcfg', 
        'analyticsnode-widgetcfg','confignode-widgetcfg','monitor-infra-widgetcfg',
        'confignode-modelcfg','controlnode-modelcfg','vrouter-modelcfg',
        'databasenode-modelcfg','analyticsnode-modelcfg','monitor-infra-modelcfg',
        'monitor-infra-viewcfg','confignode-viewcfg', 'databasenode-viewcfg',
        'vrouter-viewcfg'
        ], function(
        _,ControlNodeWidgetCfg, VRouterWidgetCfg, DatabaseNodeWidgetCfg,
        AnalyticsNodeWidgetCfg, CfgNodeWidgetCfg,MonitorInfraWidgetCfg,
        CfgNodeModelCfg,ControlNodeModelCfg,VRouterModelCfg,DatabaseNodeModelCfg,
        AnaltyicsNodeModelCfg,MonitorInfraModelCfg,
        MonitorInfraViewCfg,CfgNodeViewCfg, DBNodeViewCfg, VRouterViewCfg) {
    var widgetCfgManager = function() {
        var self = this;
        var widgetCfgMap = {},
        widgetViewCfgMap = {},
        widgetModelCfgMap = {};
        //Populate the available widget config maps
        $.extend(widgetCfgMap, ControlNodeWidgetCfg, VRouterWidgetCfg,
                DatabaseNodeWidgetCfg, AnalyticsNodeWidgetCfg,
                CfgNodeWidgetCfg,MonitorInfraWidgetCfg);

        //Populate the available model config maps
        $.extend(widgetModelCfgMap, CfgNodeModelCfg,ControlNodeModelCfg,VRouterModelCfg,
        DatabaseNodeModelCfg,AnaltyicsNodeModelCfg,MonitorInfraModelCfg);

        $.extend(widgetViewCfgMap, MonitorInfraViewCfg, CfgNodeViewCfg, DBNodeViewCfg, VRouterViewCfg);
        //,ControlNodeViewCfg,VRouterViewCfg,DatabaseNodeViewCfg,AnaltyicsNodeViewCfg,);

        self.get = function(widgetId,overrideCfg) {
            var widgetCfg = _.isFunction(widgetCfgMap[widgetId]) ? widgetCfgMap[widgetId](overrideCfg) : widgetCfgMap[widgetId];
            var modelCfg = {},viewCfg = {},baseModelCfg;
            
            if(widgetCfg['baseModel'] != null) {
                baseModelCfg = widgetModelCfgMap[widgetCfg['baseModel']];
                if(widgetCfg['modelCfg'] != null) {
                    $.extend(true,modelCfg,baseModelCfg,widgetCfg['modelCfg'])
                } else {
                    modelCfg = baseModelCfg;
                }
                widgetCfg['modelCfg'] = modelCfg;
            }
            if(widgetCfg['baseView'] != null) {
                baseViewCfg = widgetViewCfgMap[widgetCfg['baseView']];
                if(widgetCfg['modelCfg'] != null) {
                    $.extend(true,viewCfg,baseViewCfg,widgetCfg['viewCfg'])
                } else {
                    viewCfg= baseViewCfg;
                }
                widgetCfg['viewCfg'] = viewCfg;
            }
            return widgetCfg;
        }
        //Returns list of available widgets
        self.getWidgetList = function() {
            var widgetMap = _.map(_.keys(widgetCfgMap),function(widgetId) {
                    return  {
                        key: widgetId,
                        value: self.get(widgetId)
                    }
                });
            return widgetMap;
        }

        self.modelInstMap = {};
    }
    return new widgetCfgManager();

});
