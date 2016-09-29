define([
    'underscore',
    'backbone',
    'contrail-view',
    'gridstack'
], function (_, Backbone,ContrailView,gridstack) {
    var GridStackView = ContrailView.extend({
        initialize: function() {
            var self = this;
            self.widgets = [];
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

        },
        add: function(cfg) {
            var self = this;
            var currElem = $($('#gridstack-widget-template').text()).attr('data-gs-height',4);
            var widgetCnt = self.widgets.length;
            self.gridStack.addWidget(currElem,widgetCnt/self.COLUMN_CNT,(widgetCnt%self.COLUMN_CNT));
            self.widgets.push(currElem);
            // if(cowu.getValueByJsonPath(cfg['model']['_type']) != 'contrailListModel')
            self.renderView4Config($(currElem).find('.item-content'), cfg['modelCfg'],cfg['viewCfg']);
        }
    });
    return GridStackView;
});
