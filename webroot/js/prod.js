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
        'jquery-libs'           : 'js/jquery-libs',
        'thirdparty-libs'       : 'js/thirdparty-libs',
        'contrail-core-views'   : 'js/contrail-core-views',
        'chart-libs'            : 'js/chart-libs',
        'contrail-libs'         : 'js/contrail-libs',
        'web-utils'             : 'js/web-utils',
        'contrail-layout'       : 'js/contrail-layout',
        'config_global'         : 'js/config_global',
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
    baseUrl:"/dist",
    urlArgs: 'built_at=' + built_at,
});

//Start with base module, and start adding other modules,such that the code can start executing as and when it mets its dpendencies
require(['jquery-libs','config_global'],function() {
    loadCommonTemplates();
    require(['web-utils','contrail-layout','jquery.ba-bbq','thirdparty-libs','contrail-core-views','contrail-libs'],function() {
    // require(['jquery-libs','thirdparty-libs','contrail-libs'],function() {
        //Include all non-AMD modules that modify global variables
        //The first require call loads knockout and exports it to window.ko.Issue the second require call once its exported,such that the new required modules fine ko.
        require(['knockout','validation','contrail-common','jquery.xml2json','handlebars-utils','contrail-elements'],function(knockout,validation) {
            window.ko = knockout;
            kbValidation = validation;
            console.info(globalObj);
            require(['core-utils','core-constants','core-formatters','core-labels','core-messages',
                'core-cache','core-views-default-config'],function(
                CoreUtils,CoreConstants,CoreFormatters,CoreLabels,CoreMessages,Cache,CoreViewsDefaultConfig) {
                require(['chart-libs'],function() {
                });
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
