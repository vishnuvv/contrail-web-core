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
var coreBaseDir = defaultBaseDir, coreWebDir = defaultBaseDir, ctBaseDir = defaultBaseDir,
    smBaseDir = defaultBaseDir, strgBaseDir = defaultBaseDir,
    pkgBaseDir = defaultBaseDir;
require.config({
    paths: {
        'jquery-libs'           : 'dist/js/jquery-libs',
        'thirdparty-libs'       : 'dist/js/thirdparty-libs',
        'contrail-core-views'   : 'dist/js/contrail-core-views',
        'chart-libs'            : 'dist/js/chart-libs',
        'contrail-libs'         : 'dist/js/contrail-libs',
        // 'web-utils'             : 'js/web-utils',
        // 'contrail-layout'       : 'js/contrail-layout',
        // 'config_global'         : 'js/config_global',
        'global-libs'           : 'js/global-libs',
        'contrail-load'         : 'js/contrail-load'
    }, map: {
        '*': {
            // Backbone requires underscore. This forces requireJS to load lodash instead:
            'underscore': 'lodash'
        }
    },
    shim: {
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
define('jquery', [], function() {
    return jQuery;
});

//Start with base module, and start adding other modules,such that the code can start executing as and when it mets its dpendencies
// require(['jquery-libs','config_global'],function() {
require(['jquery'],function() {
    globalObj = {};
    globalObj['layoutDefObj'] = $.Deferred();
    loadCommonTemplates();

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
    require(['chart-libs'],function() {
    });
    // require(['config_global','web-utils','contrail-layout'],function() {
        require(['global-libs','jquery-libs','thirdparty-libs','contrail-core-views','contrail-libs'],function() {
        // require(['jquery-libs','thirdparty-libs','contrail-libs'],function() {
            //Include all non-AMD modules that modify global variables
            //The first require call loads knockout and exports it to window.ko.Issue the second require call once its exported,such that the new required modules fine ko.
            require(['knockout','validation','contrail-common','jquery.ba-bbq','jquery.xml2json','handlebars-utils','contrail-elements'],function(knockout,validation) {
                window.ko = knockout;
                kbValidation = validation;
                console.info(globalObj);
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
                    require(['layout-handler','contrail-load','slick.core','slick.dataview','slick.checkboxselectcolumn','slick.grid',
                        'slick.rowselectionmodel','select2'],function(LayoutHandler) {
                        initBackboneValidation();
                        initCustomKOBindings(window.ko);
                        initDomEvents();
                        layoutHandler = new LayoutHandler();
                        layoutHandler.load();
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
