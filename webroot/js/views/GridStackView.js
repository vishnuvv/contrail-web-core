/*
 * Copyright (c) 2016 Juniper Networks, Inc. All rights reserved.
 */
define([
    'lodash',
    'backbone',
    'contrail-view',
    'gridstack',
    'contrail-list-model',
    'core-utils',
    'chart-utils',
    'widget-configmanager',
], function (_, Backbone,ContrailView,gridstack, ContrailListModel,CoreUtils,chUtils,widgetConfigManager) {
    var cowu = new CoreUtils();
    var GridStackView = ContrailView.extend({
        /**
         * @param {Object} options 
         * @param {Object} options.attributes
         */ 
        initialize: function(options) {
            var self = this;
            self.widgets = [];
            self.doSaveLayout = false;
            //Ensure that the passed-on options are not modified, need to reset to default layout
            self.widgetCfgList = _.result(options,'attributes.viewConfig.widgetCfgList',{});
            self.gridAttr = _.result(options,'attributes.viewConfig.gridAttr',{});
            self.elementId = _.result(options,'attributes.viewConfig.elementId','');
            self.movedWidgetCfg = _.result(options,'attributes.viewConfig.movedWidgetCfg',null);

            self.COLUMN_CNT = 2;
            self.VIRTUAL_COLUMNS = 2;
            //Decouple cellHieght from height assigned to widget
            self.CELL_HEIGHT_MULTIPLER = 1;
            //Default is 12 columns. To have 3 column layout, set defaultWidth as 4
            if(self.gridAttr['defaultWidth'] != null)
                self.COLUMN_CNT = 24/self.gridAttr['defaultWidth'];

            self.$el.append($('#gridstack-template').text());
            self.$el.find('.custom-grid-stack').addClass('grid-stack grid-stack-24');
            self.$el.attr('data-widget-id',self.elementId);
            self.gridStack = $(self.$el).find('.custom-grid-stack').gridstack({
                float:true,
                handle:'.drag-handle',
                resizable: {
                    handles:'sw,se',
                },
                verticalMargin:8/self.CELL_HEIGHT_MULTIPLER,
                cellHeight: 20,
                animate:false,
                acceptWidgets:'label',
                width: 24
            }).data('gridstack');
            
            self.$el.find('.fa-plus').on('click',function() {
                self.add();
            });
            self.$el.on('dragstart',function(event,ui) {
                self.$el.find('.grid-stack-item').on('drag',function(event,ui) {
                    $('.custom-grid-stack').addClass('show-borders');
                });
            });
            
            self.$el.on('drag','.grid-stack-item',function(event,ui) {
                $('.custom-grid-stack').addClass('show-borders');
            });
            self.$el.on('dragstop',function(event,ui) {
                self.doSaveLayout = true;
                $('.custom-grid-stack').removeClass('show-borders');
            });
            self.$el.on('resizestart',function(event,ui) {
                $('.custom-grid-stack').addClass('show-borders');
            });
            //Trigger resize on widgets on resizestop
            self.$el.on('resizestop',function(event,ui) {
                self.doSaveLayout = true;
                $('.custom-grid-stack').removeClass('show-borders');
                $(ui.element[0]).trigger('resize');
            });
            //Listen for change events once gridStack is rendered else it's getting triggered even while adding widgets for the first time
            self.$el.on('change',function(event,items) {
                //Added to avoid saving to localStorage on resetLayout..as change event gets triggered even if we remove all widgets from gridstack
                if(localStorage.getItem(self.elementId) != null) {
                    if(self.doSaveLayout == true)
                        self.saveGrid();
                    if(self.doSaveLayout == true)
                        self.doSaveLayout = false;
                }
            });
            self.$el.find('.widget-dropdown').hover(function() {
                self.$el.find('.widget-dropdown').show();
            },function() {
                self.$el.find('.widget-dropdown').hide();
            });
        },
        isLayoutValid: function(data) {
            var itemWidths = _.sum(data,'itemAttr.width');
            var avgItemWidth = itemWidths/data.length;
            if(avgItemWidth < 2.5) {
                return false;
            }
            return true;
        },
        saveGrid : function () {
            // return;
            var self = this;
            var isValidLayout = true;
            var serializedData = _.map(self.$el.find('.custom-grid-stack-item:visible'), function (el) {
                el = $(el);
                var node = el.data('_gridstack_node');
                //itemAttr contains properties from both itemAttr (view.config file) & customItemAttr (ListView)
                var itemAttr = {},
                    viewCfg = {};
                if (el.data('data-cfg') != null) {
                    itemAttr = el.data('data-cfg').itemAttr;
                    viewCfg = el.data('data-cfg').viewCfg;
                }
                // console.assert(el.attr('data-widget-id') != null);
                // console.assert(node.width != null || node.height != null, "Node width/height is null while serializing");
                if(node == null || node.x == null || node.height == null | node.width == null || node.y == null) {
                    isValidLayout = false;
                }
                return {
                    id: el.attr('data-widget-id'),
                    viewCfg: viewCfg,
                    itemAttr: $.extend(itemAttr,{
                        x: node.x,
                        y: node.y,
                        width: node.width,
                        height: node.height
                        })
                };
            }, this);

            // var itemWidths = _.sum(serializedData,function(d) {  
            //     return _.result(d,'itemAttr.width',0)
            // });

            if(!self.isLayoutValid(serializedData)) {
                isValidLayout = false;
            }

            if(isValidLayout == true) {
                localStorage.setItem(self.elementId,JSON.stringify(serializedData));
            } else {
            }
        },
        render: function() {
            var self = this;
            //Clear all existing widgets if any before rendering new widgets
            //self.gridStack.removeAll();
            _.each(self.$el.find('.custom-grid-stack-item:visible'), function (el) {
                try {
                    self.gridStack.removeWidget($(el));
                } catch(e) {
                    console.info('Error in removing widget');
                }
            });
            self.widgets = [];
            self.tmpHeight = 0;
            if(self.movedWidgetCfg) {
                // self.doSaveLayout = false;
                self.add(self.movedWidgetCfg, true);
                self.movedWidgetCfg = null;
            }
            var widgetCfgList = self.widgetCfgList;
            //Check if there exists a saved preference for current gridStack id
            if(localStorage.getItem(self.elementId) != null) {
                var serializedData = localStorage.getItem(self.elementId),
                    tmpData = JSON.parse(serializedData);
                if(self.isLayoutValid(tmpData) && tmpData.length > 0) {
                    widgetCfgList = tmpData;
                }
                if(!self.isLayoutValid(tmpData)) {
                    localstorage.removeItem(self.elementId);
                }
            }
            // currWidgetCfg['itemAttr'] - Defined in viewconfig.js / Read from localstorage
            // widgetCfgList[i]['itemAttr'] - Defined in ListView file
            for(var i=0;i < widgetCfgList.length;i++) {
                var currWidgetCfg = widgetConfigManager.get(widgetCfgList[i]['id'],widgetCfgList[i]);
                //Here using extend for itemAttr - to get properties from both view.config & ListView
                self.add({
                    widgetCfg: widgetCfgList[i],
                    modelCfg: currWidgetCfg['modelCfg'],
                    //viewCfg: currWidgetCfg['viewCfg'],
                    viewCfg: $.extend(true, {},currWidgetCfg['viewCfg'], cowu.getValueByJsonPath(widgetCfgList, i+';viewCfg', {})),
                    itemAttr: $.extend({},currWidgetCfg['itemAttr'],widgetCfgList[i]['itemAttr'])
                });
            }
            //Save the grid layout once gridstack view is rendered there are dropped widgets
            self.saveGrid();
            self.$el.data('grid-stack-instance',self);
        },
        /**
         * @param {Object} cfg
         * @param {Boolean} isMoved - True if this widget is pulled from another page
         */
        add: function(cfg, isMoved) {
            var self = this;
            var currElem = $($('#gridstack-widget-template').text()).attr('data-gs-height',2);

            var widthMultiplier = ifNull(self.gridAttr['widthMultiplier'],1);
            var heightMultiplier = ifNull(self.gridAttr['heightMultiplier'],1)*self.CELL_HEIGHT_MULTIPLER;
            var widgetIdx = self.widgets.length;

            if(typeof(cfg) == 'undefined') {
                currElem.attr('data-gs-height',8);
                currElem.attr('data-gs-width',6);
                self.gridStack.addWidget(currElem);
            } else {
                var itemAttr = ifNull(cfg['itemAttr'],{});
                var widthMultiplier = ifNull(self.gridAttr['widthMultiplier'],1);
                var heightMultiplier = ifNull(self.gridAttr['heightMultiplier'],1)*self.CELL_HEIGHT_MULTIPLER;
                var widgetIdx = self.widgets.length;

                //If an widget is dragged to current page for which layout preferences exists, push down all the widgets by dragged widget height
                if(localStorage.getItem(self.elementId) != null || isMoved) {
                    if(isMoved){
                        self.tmpHeight = itemAttr['height'];
                        itemAttr['x'] = 0;
                        delete itemAttr['y'];
                    }else if(self.tmpHeight > 0){
                        itemAttr['y'] = itemAttr['y'] + self.tmpHeight;
                    }
                    self.gridStack.addWidget(currElem,itemAttr['x'],itemAttr['y'],itemAttr['width'],itemAttr['height']);
                } else {
                    if(itemAttr['width'] != null) {
                        itemAttr['width'] = itemAttr['width']*widthMultiplier;
                        $(currElem).attr('data-gs-width',itemAttr['width']);
                    }
                    if(itemAttr['height'] != null) {
                        itemAttr['height'] = itemAttr['height']*heightMultiplier;
                        $(currElem).attr('data-gs-height',itemAttr['height']);
                    }
                    self.gridStack.addWidget(currElem,widgetIdx/self.COLUMN_CNT,widgetIdx%self.COLUMN_CNT,
                        ifNull(itemAttr['width'],widthMultiplier),ifNull(itemAttr['height'],heightMultiplier),true);
                }
            }
<<<<<<< HEAD

            $(currElem).find('.widget-dropdown').contrailDropdown({
                dataTextField: "name",
                dataValueField: "value",
                dropdownCssClass: 'min-width-150',
                data: _.map(widgetConfigManager.getWidgetList(),function(val,idx) {
                    return {
                        name: val['val'],
                        value: val['id']
                    };
                }),
                change: function(e) {
                    //Remove the current widget
                    var currView = $(currElem).find('.item-content').data('ContrailView');
                    if(currView != null)
                    currView.destroy();
                    $(currElem).find('.item-content').empty();
                    self.renderWidget({widgetCfg:{id:e.val}},currElem);
                }
            });

            $(currElem).find('.fa-remove').on('click',function() {
                self.gridStack.removeWidget($(currElem));
            });

            // $(currElem).find('.widget-dropdown').hide();

            self.widgets.push(currElem);
            self.renderWidget(cfg,currElem);
        },
        getModelForCfg: function(cfg,options) {
            //If there exists a mapping of modelId in widgetConfigManager.modelInstMap, use it
            if (cfg['itemAttr']['cssClass'] != null) {
                $(currElem).find('.grid-stack-item-content').addClass(cfg['itemAttr']['cssClass']);
            }
            self.widgets.push(currElem);
            var modelCfg = cfg['modelCfg'],model;
            //Add cache Config
            var modelId = _.result(cfg, 'modelCfg.modelId', null);
            //if there exists a mapping of modelId in widgetConfigManager.modelInstMap, use it
            //Maintain a mapping of cacheId vs contrailListModel and if found,return that
            var defObj;
            // var listModel = new ContrailListModel([]);
            var cachedModelObj = widgetConfigManager.modelInstMap[modelId];
            var isCacheExpired = true;
            if(cachedModelObj != null && 
               (_.now() - cachedModelObj['time']) < cowc.INFRA_MODEL_CACHE_TIMEOUT * 1000) {
                model = widgetConfigManager.modelInstMap[modelId]['model'];
                if(model.errorList.length == 0) {
                    isCacheExpired = false;
                    model.loadedFromCache = true;
                }
            }
            if(!isCacheExpired) {
                model = widgetConfigManager.modelInstMap[modelId]['model'];
            } else if(cowu.getValueByJsonPath(cfg,'source','').match(/STATTABLE|LOG|OBJECT/)) {
                if(options['needContrailListModel'] == true) {
                    model = cowu.fetchStatsListModel(cfg['config']);
                } else {
                    BbCollection = Backbone.Collection.extend({});
                    BbModel = Backbone.Model.extend({
                        defaults: {
                            type: cfg['type'],
                            data: []
                        },
                        isRequestInProgress: function() {
                            if(model.fetched == false) {
                                return true;
                            } else {
                                return false;
                            }
                        },
                        getItems: function() {
                            return this.get('data');
                        },
                        initialize: function(options) {
                            this.cfg = options['cfg'];
                        },
                        sync: function(method,model,options) {
                            var defObj;
                            if(method == "read") {
                                defObj = cowu.fetchStatsListModel(this.cfg);
                            }
                            defObj.done(function(data) {
                                model.fetched = true;
                                options['success'](data); 
                            });
                        },
                        parse: function(data) {
                            var self = this;
                            this.set({data: data});
                        }
                    });
                    bbModelInst = new BbModel({
                        cfg:cfg['config']
                    });
                    bbModelInst.fetch();
                    model = bbModelInst;
                }
            } else if(cowu.getValueByJsonPath(cfg,'listModel','') != '') {
                model = cfg['listModel'];
            } else if(cowu.getValueByJsonPath(cfg,'_type') != 'contrailListModel' && cfg != null) {
                model = new ContrailListModel(cfg['config']);
            }
            function updateCache() {
                if(isCacheExpired && modelId != null) {
                    widgetConfigManager.modelInstMap[modelId] = {
                        model: model,
                        time: _.now()
                    };
                }
            }
            // if(defObj != null) {
            //     defObj.done(function(response) {
            //         listModel.setItems(response);
            //         updateCache();
            //     });
            // } else {
            //     updateCache();
            // }
            return model;
        },
        renderWidget: function(cfg,currElem) {
            //While instantiating a new empty widget,cfg will be empty
            if(typeof(cfg) == 'undefined') {
                return;
            }
            var modelCfg = cfg['modelCfg'],model;
            var widgetCfg = cfg['widgetCfg'];
            //If modelCfg is null,get it from widgetConfigManager
            if(modelCfg == null) {
                $.extend(cfg,widgetConfigManager.get(widgetCfg['id']));
                modelCfg = cfg['modelCfg'];
            }
            $(currElem).attr('data-widget-id',widgetCfg['id']);
            $(currElem).data('data-cfg', cfg);
            var self = this;
            //Add cache Config
            var viewType = cowu.getValueByJsonPath(cfg,'viewCfg;view','');
            var needContrailListModel = false;
            if(viewType.match(/GridView/)) {
                needContrailListModel = true;
            }
            model = self.getModelForCfg(cfg['modelCfg'],{needContrailListModel: needContrailListModel});
            if(viewType.match(/eventDropsView/)) {
                $(currElem).find('header').addClass('drag-handle');
            } else {
                $(currElem).find('.item-content').addClass('drag-handle');
            }
            cfg['viewCfg'] = $.extend(true,{},chUtils.getDefaultViewConfig(viewType),cfg['viewCfg']);
            self.renderView4Config($(currElem).find('.item-content'), model, cfg['viewCfg']);

        }
    });
    return GridStackView;
});
