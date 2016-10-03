define([
    'underscore',
    'backbone',
    'contrail-view',
    'gridstack'
], function (_, Backbone,ContrailView,gridstack) {
    var GridStackView = ContrailView.extend({
        initialize: function(options) {
            var self = this;
            self.widgets = [];
            self.widgetCfgList = cowu.getValueByJsonPath(options,'attributes;viewConfig;widgetCfgList',{});
            self.COLUMN_CNT = 2;

            self.$el.addClass('grid-stack grid-stack-2');
            self.gridStack = $(self.$el).gridstack({
                float:false,
                handle:'header',
                verticalMargin:8,
                cellHeight:68,
                // cellHeight:1,
                minHeight:4,
                // height:2,
                width:self.COLUMN_CNT,
                animate:false,
                acceptWidgets:'label'
            }).data('gridstack');
        },
        render: function() {
            var self = this;
            for(var i=0;i < self.widgetCfgList.length;i++) {
                var currWidgetCfg = self.widgetCfgList[i];
                self.add({
                    modelCfg: currWidgetCfg['modelCfg'],
                    viewCfg: currWidgetCfg['viewCfg']
                });
            }
        },
        add: function(cfg) {
            var self = this;
            var currElem = $($('#gridstack-widget-template').text()).attr('data-gs-height',4);
            var widgetCnt = self.widgets.length;
            self.gridStack.addWidget(currElem,widgetCnt/self.COLUMN_CNT,(widgetCnt%self.COLUMN_CNT));
            self.widgets.push(currElem);
            var modelCfg = cfg['modelCfg'];
            if(cowu.getValueByJsonPath(cfg,'modelCfg;_type') != 'contrailListModel')
                modelCfg = new ContrailListModel(modelCfg);
            self.renderView4Config($(currElem).find('.item-content'), modelCfg, cfg['viewCfg']);
        }
    });
    return GridStackView;
});
