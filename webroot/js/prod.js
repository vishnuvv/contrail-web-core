/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */
var defaultBaseDir = (document.location.pathname.indexOf('/vcenter') == 0) ? "./../" : "./";
var built_at = "00000";

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
// defaultBaseDir = ".";
var coreBaseDir = defaultBaseDir, coreWebDir = defaultBaseDir, ctBaseDir = defaultBaseDir,
    smBaseDir = defaultBaseDir, strgBaseDir = defaultBaseDir,
    pkgBaseDir = defaultBaseDir;
require.config({
    paths: {
        'core-srcdir'                 : coreBaseDir,
        'core-basedir'                : coreBaseDir,
        'jquery-libs'           : 'dist/js/jquery-libs',
        'thirdparty-libs'       : 'dist/js/thirdparty-libs',
        'contrail-core-views'   : 'dist/js/contrail-core-views',
        'chart-libs'            : 'dist/js/chart-libs',
        'contrail-libs'         : 'dist/js/contrail-libs',
        // 'web-utils'             : 'js/web-utils',
        // 'contrail-layout'       : 'js/contrail-layout',
        // 'config_global'         : 'js/config_global',
        'global-libs'           : 'js/global-libs',
        'contrail-load'         : 'js/contrail-load',
        //File to load on demand
        // 'vis'                   : coreWebDir + '/assets/vis-v4.9.0/js/vis.min'
    }, map: {
        '*': {
            // Backbone requires underscore. This forces requireJS to load lodash instead:
            'underscore': 'lodash'
        }
    },
    shim: {
        'joint': {
            deps: ['geometry', 'vectorizer', 'jquery','lodash','backbone'],
            exports: 'joint',
            init: function (geometry, vectorizer) {
                this.g = geometry;
                this.V = vectorizer;
            }
        },
        'joint.layout.DirectedGraph': {
            deps: ['joint']
        },
        'joint.contrail': {
            deps: ['joint.layout.DirectedGraph']
        },
        // 'contrail-libs': {
        //     deps:['jquery-libs','thirdparty-libs']
        // },
        // 'thirdparty-libs': {
        //     deps:['jquery-libs']
        // }
    }
});
require.config({
    baseUrl:"/",
    urlArgs: 'built_at=' + built_at,
});

/*
 * Start - Controller paths
 */
require.config({
    paths: {
        // 'controller-libs': '../../../contrail-web-controller/dist/controller-libs'
        'controller-libs': 'controller-dist/js/controller-libs',
        'controller-dashboard-libs': 'controller-dist/js/controller-dashboard-libs'
    }
})
/*
 * End - Controller paths
 */

define('jquery', [], function() {
    //To lazy-load contrail-all.css
    /*var cssLink = $("<link rel='stylesheet' type='text/css' href='/css/contrail-all.css?built_at='>");
    $('head').append(cssLink);*/
    return jQuery;
});

//Start with base module, and start adding other modules,such that the code can start executing as and when it mets its dpendencies
// require(['jquery-libs','config_global'],function() {
require(['jquery'],function() {
    globalObj = {};
    globalObj['layoutDefObj'] = $.Deferred();
    loadCommonTemplates();

    SVGElement.prototype.getTransformToElement = SVGElement.prototype.getTransformToElement || function(toElement) {
        return toElement.getScreenCTM().inverse().multiply(this.getScreenCTM());
    };

    function parseWebServerInfo(webServerInfo) {
        if (webServerInfo['serverUTCTime'] != null) {
            webServerInfo['timeDiffInMillisecs'] = webServerInfo['serverUTCTime'] - new Date().getTime();
            if (Math.abs(webServerInfo['timeDiffInMillisecs']) > globalObj['timeStampTolerance']) {
                if (webServerInfo['timeDiffInMillisecs'] > 0) {
                    globalAlerts.push({
                        msg: infraAlertMsgs['TIMESTAMP_MISMATCH_BEHIND'].format(diffDates(new XDate(), new XDate(webServerInfo['serverUTCTime']), 'rounded')),
                        sevLevel: sevLevels['INFO']
                    });
                } else {
                    globalAlerts.push({
                        msg: infraAlertMsgs['TIMESTAMP_MISMATCH_AHEAD'].format(diffDates(new XDate(webServerInfo['serverUTCTime']), new XDate(), 'rounded')),
                        sevLevel: sevLevels['INFO']
                    });
                }
            }
            //Menu filename
            var featurePkgToMenuNameMap = {
                'webController': 'wc',
                'webStorage': 'ws',
                'serverManager': 'sm'
            },featureMaps = [];
            if (null != webServerInfo['featurePkg']) {
                var pkgList = webServerInfo['featurePkg'];
                for (var key in pkgList) {
                    if (null != featurePkgToMenuNameMap[key]) {
                        featureMaps.push(featurePkgToMenuNameMap[key]);
                    } else {
                        console.log('featurePkgToMenuNameMap key is null: ' + key);
                    }
                }
                if (featureMaps.length > 0) {
                    featureMaps.sort();
                    globalObj['mFileName'] = 'menu_' + featureMaps.join('_') + '.xml';
                }
            }
        }
        return webServerInfo;
    }

    function getWebServerInfo(project, callback,fromCache) {
        var fromCache = (fromCache == null) ? false : fromCache;
        if(fromCache == false || globalObj['webServerInfo'] == null) {
            //Compares client UTC time with the server UTC time and display alert if mismatch exceeds the threshold
            $.ajax({
                url: '/api/service/networking/web-server-info?project=' + 'admin'
            }).done(function (webServerInfo) {
                globalObj['webServerInfo'] = parseWebServerInfo(webServerInfo);
                $.ajax({
                    url:'/' + globalObj['mFileName'] + '?built_at=' + built_at
                }).done(function(xml) {
                    globalObj['layoutDefObj'].resolve(xml);
                });
                if(typeof(callback) == 'function') {
                    callback(webServerInfo);
                }
            });
        } else {
            if(typeof(callback) == 'function') {
                callback(globalObj['webServerInfo']);
            }
        }
    };
    getWebServerInfo();
    function getCoreAppPaths(coreBaseDir, coreBuildDir) {
        /**
        * coreBaseDir: Apps Root directory.
        * coreWebDir: Root directory from the contents will be served. Either built or source depending on env.
        *
        * core-srcdir: Require path id pointing to root directory for the source files which are delivered.
        * in a 'prod' env to use the file in source form (i.e not minified version), use path with prefix 'core-srcdir'
        * eg: use 'core-srcdir/js/views/GridView' as path to access GridView source instead of minified.
        */
        var coreWebDir = coreBaseDir + coreBuildDir;
        return {
            'core-srcdir'                 : coreBaseDir,
            'core-basedir'                : coreWebDir,
            /*'jquery'                      : coreWebDir + '/assets/jquery/js/jquery-1.8.3.min',
            'knockout'                    : coreWebDir + '/assets/knockout/knockout-3.0.0',*/
            'joint'                       : coreWebDir + '/assets/joint/js/joint.clean',
            'geometry'                    : coreWebDir + '/assets/joint/js/geometry',
            'vectorizer'                  : coreWebDir + '/assets/joint/js/vectorizer',
            'joint.layout.DirectedGraph'  : coreWebDir + '/assets/joint/js/joint.layout.DirectedGraph',
            'dagre'                       : coreWebDir + '/assets/joint/js/dagre',
            'vis'                         : coreWebDir + '/assets/vis-v4.9.0/js/vis.min',
            'bezier'                      : coreWebDir + '/assets/bezierjs/bezier',
            'joint.contrail'              : coreWebDir + '/js/joint.contrail',
            /*'lodash'                      : coreWebDir + '/assets/lodash/lodash.min',
            'backbone'                    : coreWebDir + '/assets/backbone/backbone-min',
            'knockback'                   : coreWebDir + '/assets/backbone/knockback.min',
            'validation'                  : coreWebDir + '/assets/backbone/backbone-validation-amd',
            'text'                        : coreWebDir + '/assets/requirejs/text',
            'underscore'                  : coreWebDir + '/assets/underscore/underscore-min',

            'contrail-layout'             : coreWebDir + '/js/contrail-layout',
            'core-utils'                  : coreWebDir + '/js/common/core.utils',

            'core-constants'              : coreWebDir + '/js/common/core.constants',
            'core-formatters'             : coreWebDir + '/js/common/core.formatters',
            'core-labels'                 : coreWebDir + '/js/common/core.labels',
            'core-messages'               : coreWebDir + '/js/common/core.messages',
            'core-cache'                  : coreWebDir + '/js/common/core.cache',
            'core-views-default-config'   : coreWebDir + '/js/common/core.views.default.config',
            'core-init'                   : coreWebDir + '/js/common/core.init',
            'contrail-unified-1'          : coreWebDir + '/js/common/contrail.unified.1',
            'contrail-unified-2'          : coreWebDir + '/js/common/contrail.unified.2',
            'contrail-unified-3'          : coreWebDir + '/js/common/contrail.unified.3',
            'cf-datasource'               : coreWebDir + '/js/common/cf.datasource',

            'contrail-remote-data-handler': coreWebDir + '/js/handlers/ContrailRemoteDataHandler',
            'layout-handler'              : coreWebDir + '/js/handlers/LayoutHandler',
            'menu-handler'                : coreWebDir + '/js/handlers/MenuHandler',
            'content-handler'             : coreWebDir + '/js/handlers/ContentHandler',*/

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
            'loginwindow-model'           : coreWebDir + '/js/models/LoginWindowModel'
        };
    };
    // require(['config_global','web-utils','contrail-layout'],function() {
        require(['global-libs','jquery-libs','thirdparty-libs','contrail-core-views','contrail-libs'],function() {
            //Get core-app paths and register to require
            require.config({
                paths:getCoreAppPaths("","")
            });
            require(['backbone'],function(backbone) {
                window.Backbone = backbone;
            });
            require(['chart-libs'],function() {
                // require(['joint'],function(joint) {
                //     window.joint = joint;
                // });
                require(['nv.d3'],function(nvd3) {
                    window.nv = nvd3;
                });
            });
        // require(['jquery-libs','thirdparty-libs','contrail-libs'],function() {
            //Include all non-AMD modules that modify global variables
            //The first require call loads knockout and exports it to window.ko.Issue the second require call once its exported,such that the new required modules fine ko.
            require(['knockout','validation','ipv6','crossfilter','bootstrap','contrail-common','jquery.panzoom','jquery.ba-bbq','jquery.xml2json','handlebars-utils','contrail-elements'],function(knockout,validation) {
                window.ko = knockout;
                kbValidation = validation;
                console.info(globalObj);
                require(['core-utils','core-constants','core-formatters','core-labels','core-messages',
                    'core-cache','core-views-default-config'],function(
                    // 'core-cache','core-views-default-config','chart-utils'],function(
                    CoreUtils,CoreConstants,CoreFormatters,CoreLabels,CoreMessages,Cache,CoreViewsDefaultConfig,ChartUtils) {
                    cowc = new CoreConstants();
                    cowu = new CoreUtils();
                    cowf = new CoreFormatters();
                    cowl = new CoreLabels();
                    cowm = new CoreMessages();
                    covdc = new CoreViewsDefaultConfig();
                    cowch = new Cache();
                    require(['layout-handler','content-handler','chart-utils','contrail-load','slick.core','slick.dataview','slick.checkboxselectcolumn','slick.grid',
                        'slick.rowselectionmodel','select2'],function(LayoutHandler,ContentHandler,ChartUtils) {
                        contentHandler = new ContentHandler();
                        initBackboneValidation();
                        initCustomKOBindings(window.ko);
                        initDomEvents();
                        layoutHandler = new LayoutHandler();
                        layoutHandler.load();
                        chUtils = new ChartUtils();
                        require(['controller-libs'],function() {
                            require([
                                'controller-constants',
                                'controller-labels',
                                'controller-utils',
                                'controller-messages',
                                'controller-grid-config',
                                'controller-graph-config',
                                'controller-parsers',
                                'controller-view-config',
                            ], function (Constants, Labels, Utils, Messages, GridConfig, GraphConfig, Parsers, ViewConfig) {
                                ctwc = new Constants();
                                ctwl = new Labels();
                                ctwu = new Utils;
                                ctwm = new Messages();
                                ctwgc = new GridConfig();
                                ctwgrc = new GraphConfig();
                                ctwp = new Parsers();
                                ctwvc = new ViewConfig();
                                contentHandler.featureAppDefObj.resolve();
                            });
                        });
                    });
                });
            });
        });
    // });
});
// require(['jquery'],function($) {
//     loadCommonTemplates();
// });
// require(['knockout'],function(ko) {
//     window.ko = ko;
// });
// require(['validation'],function(validation) {
//     kbValidation = validation;
// });
