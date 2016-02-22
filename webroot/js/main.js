/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */
var defaultBaseDir = (document.location.pathname.indexOf('/vcenter') == 0) ? "./../" : "./";

if(typeof(globalObj) == "undefined") 
    globalObj = {};
/**
 * Set the global env with the data-env attr from the core.app script tag.
 * This env will determine the path requirejs will fetch and build the cache.
 * for 'prod' env, files under built dir will be used; else, original source as is(for eg. dev env).
 */
// globalObj['env'] = document.querySelector('script[data-env]').getAttribute('data-env');
if (globalObj['env'] == 'prod') {
    globalObj['buildBaseDir'] = 'built';
} else {
    defaultBaseDir = defaultBaseDir.slice(0, -1);
    globalObj['buildBaseDir'] = '';
}
var coreBaseDir = defaultBaseDir, coreWebDir = defaultBaseDir, ctBaseDir = defaultBaseDir,
    smBaseDir = defaultBaseDir, strgBaseDir = defaultBaseDir,
    pkgBaseDir = defaultBaseDir;
require.config({
    paths: {
        'core-srcdir'                 : coreBaseDir,
        'core-basedir'                : coreWebDir,
        'jquery'                    : "assets/jquery/js/jquery-1.8.3.min",
        'jquery-ui'                 : 'assets/jquery-ui/js/jquery-ui',
        'jquery.xml2json'           : 'assets/jquery/js/jquery.xml2json',
        'jquery.ba-bbq'             : 'assets/jquery/js/jquery.ba-bbq.min',
        'jquery.timer'              : 'assets/jquery/js/jquery.timer',
        'jquery.ui.touch-punch'     : 'assets/jquery/js/jquery.ui.touch-punch.min',
        'jquery.validate'           : "assets/jquery/js/jquery.validate",
        'jquery.tristate'           : "assets/jquery/js/jquery.tristate",
        'jquery.multiselect'        : "assets/jquery-ui/js/jquery.multiselect",
        'jquery.multiselect.filter' : "assets/jquery-ui/js/jquery.multiselect.filter",
        'jquery.steps.min'          : "assets/jquery/js/jquery.steps.min",
        'jquery.panzoom'            : "assets/jquery/js/jquery.panzoom.min",
        'jquery.ui.position'        : "assets/jquery-contextMenu/js/jquery.ui.position",
        'jquery-contextmenu'        : "assets/jquery-contextMenu/js/jquery.contextMenu",
        'bootstrap'                 : 'assets/bootstrap/js/bootstrap',
        'crossfilter'               : 'assets/crossfilter/js/crossfilter',
        'jsonpath'                  : 'assets/jsonpath/js/jsonpath-0.8.0',
        'handlebars'                : "assets/handlebars/handlebars-v1.3.0",
        'handlebars-utils'          : "js/handlebars-utils",
        'contrail-elements'         : "js/contrail-elements",

        'jquery.event.drag'         : "assets/slickgrid/js/jquery.event.drag-2.2",
        'jquery.json'               : "assets/slickgrid/js/jquery.json-2.3.min",
        'jquery.droppick'           : "assets/slickgrid/js/jquery.dropkick-1.0.0",
        'slick.core'                : "assets/slickgrid/js/slick.core",
        'slick.grid'                : "assets/slickgrid/js/slick.grid",
        'slick.dataview'            : "assets/slickgrid/js/slick.dataview",
        'slick.checkboxselectcolumn': 'assets/slickgrid/js/slick.checkboxselectcolumn',
        'slick.rowselectionmodel'   : 'assets/slickgrid/js/slick.rowselectionmodel',
        'jquery.datetimepicker'     : "assets/datetimepicker/js/jquery.datetimepicker",
        'select2'                   : "assets/select2/js/select2.min",
        'moment'                    : "assets/moment/moment",
        'jsbn-combined'             : "assets/ip/jsbn-combined",
        'sprintf'                   : "assets/ip/sprintf",
        'ipv6'                      : "assets/ip/ipv6",
        'protocol'                  : "js/protocol",
        'uuid'                      : "js/uuid",
        'xdate'                     : "assets/xdate/js/xdate",
        'contrail-common'           : "js/contrail-common",
        'slick.enhancementpager'    : "assets/slickgrid/js/slick.enhancementpager",
        'slickgrid-utils'           : "js/slickgrid-utils",
        'web-utils'                 : "js/web-utils",
        'config_global'             : "js/config_global",
        'analyzer-utils'            : "js/analyzer-utils",
        'dashboard-utils'           : "js/dashboard-utils",

        'd3'                        : 'assets/d3-v3.5.6/js/d3',
        'nv.d3'                     : 'assets/nvd3-v1.8.1/js/nv.d3',

        'joint'                       : coreWebDir + '/assets/joint/js/joint.clean',
        'geometry'                    : coreWebDir + '/assets/joint/js/geometry',
        'vectorizer'                  : coreWebDir + '/assets/joint/js/vectorizer',
        'joint.layout.DirectedGraph'  : coreWebDir + '/assets/joint/js/joint.layout.DirectedGraph',
        'dagre'                       : coreWebDir + '/assets/joint/js/dagre',
        'vis'                         : coreWebDir + '/assets/vis-v4.9.0/js/vis.min',
        'bezier'                      : coreWebDir + '/assets/bezierjs/bezier',
        'lodash'                      : coreWebDir + '/assets/lodash/lodash.min',
        'backbone'                    : coreWebDir + '/assets/backbone/backbone-min',
        'knockback'                   : coreWebDir + '/assets/backbone/knockback.min',
        'validation'                  : coreWebDir + '/assets/backbone/backbone-validation-amd',
        'text'                        : coreWebDir + '/assets/requirejs/text',
        'underscore'                  : coreWebDir + '/assets/underscore/underscore-min',

        'contrail-layout'             : coreWebDir + '/js/contrail-layout',
        'joint.contrail'              : coreWebDir + '/js/joint.contrail',
        'core-utils'                  : coreWebDir + '/js/common/core.utils',

        'core-constants'              : coreWebDir + '/js/common/core.constants',
        'core-formatters'             : coreWebDir + '/js/common/core.formatters',
        'core-labels'                 : coreWebDir + '/js/common/core.labels',
        'core-messages'               : coreWebDir + '/js/common/core.messages',
        'core-cache'                  : coreWebDir + '/js/common/core.cache',
        'core-views-default-config'   : coreWebDir + '/js/common/core.views.default.config',
        'core-init'                   : coreWebDir + '/js/common/core.init',
        'cf-datasource'               : coreWebDir + '/js/common/cf.datasource',

        'contrail-remote-data-handler': coreWebDir + '/js/handlers/ContrailRemoteDataHandler',
        'layout-handler'              : coreWebDir + '/js/handlers/LayoutHandler',
        'menu-handler'                : coreWebDir + '/js/handlers/MenuHandler',
        'content-handler'             : coreWebDir + '/js/handlers/ContentHandler',

        'graph-view'                  : coreWebDir + '/js/views/GraphView',
        'contrail-view'               : coreWebDir + '/js/views/ContrailView',
        'query-form-view'             : coreWebDir + '/js/views/QueryFormView',

        'query-form-model'            : coreWebDir + '/js/models/QueryFormModel',
        'query-or-model'              : coreWebDir + '/js/models/QueryOrModel',
        'query-and-model'             : coreWebDir + '/js/models/QueryAndModel',
        'contrail-graph-model'        : coreWebDir + '/js/models/ContrailGraphModel',
        'contrail-vis-model'          : coreWebDir + '/js/models/ContrailVisModel',
        'contrail-view-model'         : coreWebDir + '/js/models/ContrailViewModel',
        'contrail-model'              : coreWebDir + '/js/models/ContrailModel',
        'contrail-list-model'         : coreWebDir + '/js/models/ContrailListModel',
        'mon-infra-node-list-model'   : coreWebDir + '/js/models/NodeListModel',
        'mon-infra-log-list-model'    : coreWebDir + '/js/models/LogListModel',

        // TODO: We need to discuss a criteria on which we should add definations to this file.
        'infoboxes'                   : coreWebDir + '/js/views/InfoboxesView',
        'barchart-cf'                 : coreWebDir + '/js/views/BarChartView',
        'mon-infra-alert-list-view'   : coreWebDir + '/js/views/AlertListView',
        'mon-infra-alert-grid-view'   : coreWebDir + '/js/views/AlertGridView',
        'mon-infra-log-list-view'     : coreWebDir + '/js/views/LogListView',
        'mon-infra-sysinfo-view'      : coreWebDir + '/js/views/SystemInfoView',
        'mon-infra-dashboard-view'    : coreWebDir + '/js/views/MonitorInfraDashboardView',
        'loginwindow-model'           : coreWebDir + '/js/models/LoginWindowModel',

        'knockout'                    : "assets/knockout/knockout-3.0.0",
        'core.app.utils'              : "js/common/core.app.utils",
        // 'handlebars-utils'          : "js/handlebars-utils",
        // 'select2-utils'             : "js/select2-utils",
        // 'chart-utils'               : "js/chart-utils",
        // 'contrail-layout'           : "js/contrail-layout",
        // 'qe-utils'                  : "js/qe-utils",
        // 'nvd3-plugin'               : "js/nvd3-plugin",
        // 'd3-utils'                  : "js/d3-utils",
    }, map: {
        '*': {
            // Backbone requires underscore. This forces requireJS to load lodash instead:
            'underscore': 'lodash'
        }
    },
    shim: {
        'jquery' : {
            exports: 'jQuery'
        },
        'jquery.multiselect' : {
            deps: ['jquery-ui'],
        },
        'jquery.tristate' : {
            deps: ['jquery-ui']
        },
        'jquery.ui.position' : {
            deps: ['jquery']
        },
        'jquery-contextmenu' : {
            deps: ['jquery']
        },
        'jquery.multiselect.filter' : {
            deps: ['jquery-ui']
        },
        'jquery.steps.min' : {
            deps: ['jquery']
        },
        'bootstrap' : {
            deps: ["jquery"]
        },
        'd3' : {
            deps: ["jquery"]
        },
        'nv.d3' : {
            deps: ['d3']
        },
        'crossfilter' : {
            deps: ['d3']
        },
        'jquery.xml2json' : {
            deps: ["jquery"]
        },
        "jquery.ba-bbq" : {
            deps: ['jquery']
        },
        "jquery.timer" : {
            deps: ['jquery']
        },
        "jquery-ui" : {
            deps: ['jquery']
        },
        'jquery.ui.touch-punch' : {
            deps: ['jquery']
        },
        'jquery.validate': {
            deps: ['jquery']
        },
        'select2': {
            deps: ['jquery']
        },
        'jquery.event.drag': {
            deps: ['jquery']
        },
        'jquery.json': {
            deps: ['jquery']
        },
        'jquery.droppick': {
            deps: ['jquery']
        },
        'jquery.datetimepicker': {
            deps: ['jquery']
        },
        'slick.core': {
            deps:['jquery']
        },
        'slick.grid': {
            deps:['jquery.event.drag']
        },
        'contrail-common': {
            deps: ['jquery']
        },
        'contrail-layout': {
            deps:['jquery.ba-bbq','web-utils']
        },
        'slick.enhancementpager': {
            deps: ['jquery']
        },
        'slick.rowselectionmodel': {
            deps: ['jquery']
        },        
        'slick.checkboxselectcolumn': {
            deps: ['jquery']
        },
        'slick.dataview': {
            deps: ['jquery']
        },
        'slickgrid-utils': {
            deps: ['jquery','slick.grid','slick.dataview']
        },
        'contrail-elements': {
            deps: ['jquery-ui']
        },
        'chart-utils': {
            deps: ['jquery']
        },
        'web-utils': {
            deps: ['jquery','knockout']
        },
        'handlebars-utils': {
            deps: ['jquery','handlebars']
        },
        'nvd3-plugin': {
            deps: ['nv.d3']
        },
        'd3-utils': {
            deps: ['d3']
        },
        'qe-utils': {
            deps: ['jquery']
        },
        'select2-utils': {
            deps: ['jquery']
        },
        'ipv6' : {
            deps: ['sprintf','jsbn-combined']
        },

        'backbone': {
            deps: ['lodash'],
            exports: 'Backbone'
        },
        'joint': {
            deps: ['geometry', 'vectorizer', 'backbone'],
            exports: 'joint',
            init: function (geometry, vectorizer) {
                this.g = geometry;
                this.V = vectorizer;
            }
        },
        'vis': {
            deps: ['jquery'],
            exports: 'vis'
        },
        'knockout': {
            deps: ['jquery'],
            exports:'ko'
        },
        'validation': {
            deps: ['backbone']
        },
        'bezier': {
            deps: ['jquery']
        },
        'joint.layout.DirectedGraph': {
            deps: ['joint']
        },
        'joint.contrail': {
            deps: ['joint.layout.DirectedGraph']
        },
        'contrail-model': {
            deps: ['knockback']
        },
        'contrail-list-model': {
            deps: ['contrail-remote-data-handler']
        },
        'core-constants': {
            init:function(CoreConstants) {
                cowc = new CoreConstants();
            }
        }
    }
});
require.config({
    baseUrl:"/",
    urlArgs: 'built_at=' + built_at,
});
require(['jquery'],function($) {
    loadCommonTemplates();
});
require(['knockout'],function(ko) {
    window.ko = ko;
});
require(['validation'],function(validation) {
    kbValidation = validation;
});
require(['core-utils','core-constants','core-formatters','core-labels','core-messages',
    'core-cache','core-views-default-config'],function(
    CoreUtils,CoreConstants,CoreFormatters,CoreLabels,CoreMessages,Cache,CoreViewsDefaultConfig) {
    cowc = new CoreConstants();
    cowu = new CoreUtils();
    cowf = new CoreFormatters();
    cowl = new CoreLabels();
    cowm = new CoreMessages();
    covdc = new CoreViewsDefaultConfig();
    cowch = new Cache();
});

// require(['layout-handler','contrail-layout',"jquery","jquery-ui","jquery.xml2json","jquery.ba-bbq","jquery.timer","jquery.ui.touch-punch","jquery.validate","jquery.tristate",
//     "jquery.multiselect","jquery.multiselect.filter","jquery.steps.min","jquery.panzoom","jquery.ui.position","jquery-contextmenu","bootstrap",
//     "crossfilter","jsonpath","handlebars","handlebars-utils","contrail-elements","jquery.event.drag","jquery.json","jquery.droppick",
//     "slick.core","slick.grid","slick.dataview","slick.checkboxselectcolumn","slick.rowselectionmodel","jquery.datetimepicker","select2",
//     "moment","ipv6","protocol","uuid","xdate","contrail-common","slick.enhancementpager","slickgrid-utils",
//     "web-utils","config_global","analyzer-utils","dashboard-utils","d3","nv.d3","knockout","core-constants",'core.app.utils','validation','joint.contrail'
//     ],function(LayoutHandler,contrail) {
//         initBackboneValidation();
//         initCustomKOBindings(window.ko);
//         initDomEvents();
//         layoutHandler = new LayoutHandler();
//         layoutHandler.load();
//
// });
