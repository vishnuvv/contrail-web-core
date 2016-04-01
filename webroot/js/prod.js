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
    bundles: {
        // 'chart-libs'        : ['d3','nv.d3'],
        // 'chart-libs'        : [],
        'thirdparty-libs'   : ['knockback','slick.checkboxselectcolumn','slick.rowselectionmodel','select2','slick.grid','validation'],
        'core-bundle'       : ['controller-view-model'],
        'contrail-core-views':[
    'core-basedir/js/views/GridView','core-basedir/js/views/AccordianView','core-basedir/js/views/DetailsView','core-basedir/js/views/DonutChartView','core-basedir/js/views/FormAutoCompleteTextBoxView','core-basedir/js/views/FormButtonView','core-basedir/js/views/FormCheckboxView','core-basedir/js/views/FormCollectionView','core-basedir/js/views/FormComboboxView','core-basedir/js/views/FormCompositeView','core-basedir/js/views/FormDateTimePickerView','core-basedir/js/views/FormDropdownView','core-basedir/js/views/FormEditableGridView','core-basedir/js/views/FormGridView','core-basedir/js/views/FormHierarchicalDropdownView','core-basedir/js/views/FormInputView','core-basedir/js/views/FormMultiselectView','core-basedir/js/views/FormNumericTextboxView','core-basedir/js/views/FormRadioButtonView','core-basedir/js/views/FormTextAreaView','core-basedir/js/views/FormTextView','core-basedir/js/views/GridFooterView','core-basedir/js/views/HeatChartView','core-basedir/js/views/HorizontalBarChartView','core-basedir/js/views/LineBarWithFocusChartView','core-basedir/js/views/LineWithFocusChartView','core-basedir/js/views/LoginWindowView','core-basedir/js/views/MultiBarChartView','core-basedir/js/views/MultiDonutChartView','core-basedir/js/views/NodeConsoleLogsView','core-basedir/js/views/QueryFilterView','core-basedir/js/views/QueryResultGridView','core-basedir/js/views/QueryResultLineChartView','core-basedir/js/views/QuerySelectView','core-basedir/js/views/QueryWhereView','core-basedir/js/views/SparklineView','core-basedir/js/views/TabsView','core-basedir/js/views/WizardView'],
        'jquery-libs'       : [
        'jquery.timer','jquery.ui.touch-punch','jquery.validate','jquery.tristate','jquery.multiselect','jquery.multiselect.filter','jquery.steps.min','jquery.panzoom','jquery-contextmenu','jquery.event.drag','jquery.droppick','jquery.datetimepicker']
    },
    paths: {
        'core-srcdir'                 : coreBaseDir,
        'core-basedir'                : coreBaseDir,
        'controller-basedir'                : coreBaseDir,
        'jquery-libs'           : 'dist/js/jquery-libs',
        // 'jquery'                : 'js/jquery-1.8.3',
        'jquery'                : 'assets/jquery/js/jquery-1.8.3.min',
        'load-libs'             : 'dist/js/load-libs',
        'jquery-load-libs'      : 'dist/js/jquery-load-libs',
        'thirdparty-libs'       : 'dist/js/thirdparty-libs',
        'contrail-core-views'   : 'dist/js/contrail-core-views',
        'chart-libs'            : 'dist/js/chart-libs',
        'contrail-libs'         : 'dist/js/contrail-libs',
        // 'web-utils'             : 'js/web-utils',
        // 'contrail-layout'       : 'js/contrail-layout',
        // 'config_global'         : 'js/config_global',
        'core-bundle'           : 'dist/js/core-bundle',
        'global-libs'           : 'js/global-libs',
        'layout-libs'           : 'dist/js/layout-libs',
        'jquery-dep-libs'       : 'dist/js/jquery-dep-libs',
        'nonamd-libs'           : 'dist/js/nonamd-libs',
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
    waitSeconds: 0
});

/*
 * Start - Controller paths
 */
require.config({
    paths: {
        // 'controller-libs': '../../../contrail-web-controller/dist/controller-libs'
        'controller-libs': 'controller-dist/js/controller-libs',
        'controller-bundle': 'controller-dist/js/controller-bundle',
        'controller-dashboard-libs': 'controller-dist/js/controller-dashboard-libs'
    }
})
/*
 * End - Controller paths
 */

// define('jquery', [], function() {
//     //To lazy-load contrail-all.css
//     /*var cssLink = $("<link rel='stylesheet' type='text/css' href='/css/contrail-all.css?built_at='>");
//     $('head').append(cssLink);*/
//     return jQuery;
// });

//Start with base module, and start adding other modules,such that the code can start executing as and when it mets its dpendencies
// require(['jquery-libs','config_global'],function() {
// require(['jquery','jquery-load-libs','load-libs','contrail-core-views','contrail-libs'],function() {
// });
require(['jquery','nonamd-libs'],function() {
});
require(['core-bundle','controller-bundle','controller-dashboard-libs'],function() {
});
// require(['text!templates/core.common.tmpl'],function() {
// });
function loadAjaxRequest(ajaxCfg,callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET',ajaxCfg['url']);
    xhr.send(null);
    xhr.onload(function(response) {
        callback(response);
    });

}
function loadCommonTemplates() {
    //Loads external templates from path and injects in to page DOM
    templateLoader = (function ($, host) {
        return{
            loadExtTemplate:function (path, deferredObj, containerName) {
                //Load the template only if it doesn't exists in DOM
                    var tmplLoader = $.ajax({url:path})
                        .success(function (result) {
                    //Add templates to DOM
                            if (containerName != null) {
                                $('body').append('<div id="' + containerName + '"></div>');
                                $('#' + containerName).append(result);
                            } else
                        $("body").append(result);
                            if (deferredObj != null)
                                deferredObj.resolve();
                        })
                        .error(function (result) {
                            if(result['statusText'] != 'abort')
                                showInfoWindow("Error while loading page.",'Error');
                        });

                    tmplLoader.complete(function () {
                        $(host).trigger("TEMPLATE_LOADED", [path]);
                    });
            }
        };
    })(jQuery, document);
    // $.ajaxSetup({async:false});
    //Need to issue the call synchronously as the following scripts refer to the templates in this file
    templateLoader.loadExtTemplate('/templates/core.common.tmpl');
    // $.ajaxSetup({async:true});
}
var loadUtils = {
    getCookie: function(name) {
        if(name != null) {
            var cookies = document.cookie.split(";");
            for (var i = 0; i < cookies.length; i++) {
                var x = cookies[i].substr(0, cookies[i].indexOf("="));
                var y = cookies[i].substr(cookies[i].indexOf("=") + 1);
                x = x.replace(/^s+|s+$/g, "").trim();
                if (x == name)
                    return unescape(y);
            }
        }
        return false;
    }
}
require(['jquery'],function() {
    loadCommonTemplates();
    $.ajaxSetup({
        cache: false,
        crossDomain: true,
        //set the default timeout as 30 seconds
        timeout: 30000,
        beforeSend: function (xhr, settings) {
            if (globalObj['webServerInfo'] != null && globalObj['webServerInfo']['loggedInOrchestrationMode'] != null)
                xhr.setRequestHeader("x-orchestrationmode", globalObj['webServerInfo']['loggedInOrchestrationMode']);
            xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            xhr.setRequestHeader("X-CSRF-Token", loadUtils.getCookie('_csrf'));
        },
        error: function (xhr, e) {
            //ajaxDefErrorHandler(xhr);
        }
    });
    /*
    var sessionAuthenticatedCheckDone = false;
    //Handle if any ajax response fails because of session expiry and redirect to login page
    //If authenticated,show app-container,else show signin-container
    $(document).ajaxComplete(function (event, xhr, settings) {
        var urlHash = window.location.hash;
        var redirectHeader = xhr.getResponseHeader('X-Redirect-Url');
        if(sessionAuthenticatedDone == true) {
            return;
        }
        sessionAuthenticatedCheckDone = true;
        if (redirectHeader != null) {
            //Not authenticated
            // $('#sigin-container').show();
            // $('#app-container').hide();
            $('#signin-container').removeClass('hide');
            $('#app-container').addClass('hide');
            //Carry the current hash parameters to redirect URL(login page) such that user will be taken to the same page once he logs in
            if (redirectHeader.indexOf('#') == -1)
                window.location.href = redirectHeader + urlHash;
            else
                window.location.href = redirectHeader;
        } else {
            // $('#signin-container').hide();
            // $('#app-container').show();
            $('#signin-container').addClass('hide');
            $('#app-container').removeClass('hide');
        }
    });*/

    var menuXMLLoadDefObj = $.Deferred(),layoutHandlerLoadDefObj = $.Deferred();
    function postAuthenticate(response) {
        $('#signin-container').empty();
        // $('#signin-container').addClass('hide');
        $('#app-container').html($('#app-container-tmpl').text());
        // $('#app-container').removeClass('hide');
        $.ajaxSetup({
            beforeSend: function (xhr, settings) {
                xhr.setRequestHeader("X-CSRF-Token", loadUtils.getCookie('_csrf'));
            }
        });
        globalObj['webServerInfo'] = parseWebServerInfo(response);

        if (loadUtils.getCookie('username') != null) {
            $('#user_info').text(loadUtils.getCookie('username'));
        }
        $('#user-profile').show();
        bindListeners();
        // if(typeof(layoutHandler) != "undefined") {
        //     layoutHandler.load(menuXML);
        // } else {
        $.when.apply(window,[menuXMLLoadDefObj,layoutHandlerLoadDefObj]).done(function(menuXML) {
            layoutHandler.load(menuXML);
        });
        // }

        //Start rendering the layout
        // menuXMLLoadDefObj.done(function(menuXML) {
            // globalObj['layoutDefObj'].resolve(menuXML);
            // layoutHandler.load(menuXML);
        // });
    }

    function onAuthenticationReq() {
        // $('#signin-container').removeClass('hide');
        // $('#app-container').addClass('hide');
        $('#signin-container').html($('#signin-container-tmpl').text());
        $('#app-container').empty();
        bindListeners();
    }

    $.ajax({
        url: '/isauthenticated',
        type: "GET",
        dataType: "json"
    }).done(function (response,textStatus,xhr) {
        var redirectHeader = xhr.getResponseHeader('X-Redirect-Url');
        if(response != null && response.isAuthenticated == true) {
            postAuthenticate(response);
            // layoutHandler.load(menuXML);
        } else {
            onAuthenticationReq();
        }
    }).fail(function(response) {
        console.info(response);
        onAuthenticationReq();
    });

    $.ajax({
        url: '/menu',
        type: "GET",
        dataType: "xml"
    }).done(function (response,textStatus,xhr) {
        menuXML = response;
        menuXMLLoadDefObj.resolve(menuXML);
        // var redirectHeader = xhr.getResponseHeader('X-Redirect-Url');
        // if(response != null && response.isAuthenticated == "true") {
        //     postAuthenticate(response);
        // } else {
        //     onAuthenticationReq();
        // }
    }).fail(function(response) {
        console.info(response);
        onAuthenticationReq();
    });

    function logout() {
        $.ajax({
            url: '/logout',
            type: "GET",
            dataType: "json"
        }).done(function (response) {
            onAuthenticationReq();
            /*//Hide the app-container and show the signin-container
            $('#signin-container').removeClass('hide');
            $('#app-container').addClass('hide');*/
        });
    }

    function bindListeners() {
        $('#signin').click(authenticate);
        $('#logout').click(logout);
    }

    require(['jquery-dep-libs'],function() {});
    globalObj['layoutDefObj'] = $.Deferred();

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

    function authenticate() {
        //Compares client UTC time with the server UTC time and display alert if mismatch exceeds the threshold
        $.ajax({
            url: '/authenticate',
            type: "POST",
            data: JSON.stringify({username:$("[name='username']").val(),password:$("[name='password']").val()}),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        }).done(function (response) {
            if(response != null && response.isAuthenticated == true) {
                postAuthenticate(response);
            } else {
                //Display login-error message
            }
        });
    }

    function getWebServerInfo(project, callback,fromCache) {
        if(performance)
            console.info('start: getWebServerInfo', performance.now());
        var fromCache = (fromCache == null) ? false : fromCache;
        if(fromCache == false || globalObj['webServerInfo'] == null) {
            //Compares client UTC time with the server UTC time and display alert if mismatch exceeds the threshold
            $.ajax({
                url: '/api/service/networking/web-server-info?project=' + 'admin'
            }).done(function (webServerInfo) {
                
                globalObj['webServerInfo'] = parseWebServerInfo(webServerInfo);
                if(performance)
                    console.info('start: fetching menu.xml',performance.now());
                $.ajax({
                    url:'/' + globalObj['mFileName'] + '?built_at=' + built_at
                }).done(function(xml) {
                    globalObj['layoutDefObj'].resolve(xml);
                });
                if(typeof(callback) == 'function') {
                    callback(webServerInfo);
                }
                console.info('done: getWebServerInfo', performance.now());
            });
        } else {
            if(typeof(callback) == 'function') {
                callback(globalObj['webServerInfo']);
            }
            console.info('done: getWebServerInfo', performance.now());
        }
    };
    // getWebServerInfo();
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
            // 'mon-infra-node-list-model'   : coreWebDir + '/js/models/NodeListModel',
            // 'mon-infra-log-list-model'    : coreWebDir + '/js/models/LogListModel',

            // TODO: We need to discuss a criteria on which we should add definations to this file.
            'infoboxes'                   : coreWebDir + '/js/views/InfoboxesView',
            'barchart-cf'                 : coreWebDir + '/js/views/BarChartView',
            // 'mon-infra-alert-list-view'   : coreWebDir + '/js/views/AlertListView',
            'mon-infra-alert-grid-view'   : coreWebDir + '/js/views/AlertGridView',
            // 'mon-infra-log-list-view'     : coreWebDir + '/js/views/LogListView',
            // 'mon-infra-sysinfo-view'      : coreWebDir + '/js/views/SystemInfoView',
            // 'mon-infra-dashboard-view'    : coreWebDir + '/js/views/MonitorInfraDashboardView',
            'loginwindow-model'           : coreWebDir + '/js/models/LoginWindowModel'
        };
    };
    // require(['config_global','web-utils','contrail-layout'],function() {
        console.info('start:loading common bundles',performance.now());
        //Queue the requests
        // require(['contrail-load'],function() {});
        // require(['nonamd-libs','jquery-load-libs','load-libs','contrail-core-views','contrail-libs'],function() {
        //nonamd-libs   #no dependency on jquery
        //layout-libs   #dependency on jquery
        require(['jquery-dep-libs','nonamd-libs'],function() {
            console.info('done: loading common bundles',performance.now());
            //Get core-app paths and register to require
            require.config({
                paths:getCoreAppPaths("","")
            });
            // require(['backbone'],function(backbone) {
            //     window.Backbone = backbone;
            // });
            // require(['chart-libs'],function() {
            //     console.info('loaded chart-libs',performance.now());
                // require(['joint'],function(joint) {
                //     window.joint = joint;
                // });
                // require(['nv.d3'],function(nvd3) {
                //     window.nv = nvd3;
                // });
            // });
        // require(['jquery-libs','thirdparty-libs','contrail-libs'],function() {
            //Include all non-AMD modules that modify global variables
            //The first require call loads knockout and exports it to window.ko.Issue the second require call once its exported,such that the new required modules find ko.
            // require(['validation','jquery.panzoom','ipv6'],function() {});
            //'slick.checkboxselectcolumn'
            //'slick.rowselectionmodel','select2','slick.grid'
            console.info('start: required non-AMD modules',performance.now());
            // require(['knockout','validation','crossfilter','bootstrap','contrail-common',
            //         ,'jquery.ba-bbq','jquery.xml2json','handlebars-utils','contrail-elements'],function(knockout,validation) {
                console.info('done: required non-AMD modules',performance.now());
                // window.ko = knockout;
                // kbValidation = validation;
                console.info(globalObj);
                require(['core-utils'/*,'core-constants','core-formatters','core-labels','core-messages',
                    'core-cache','core-views-default-config'*/],function(
                    // 'core-cache','core-views-default-config','chart-utils'],function(
                    CoreUtils,CoreConstants,CoreFormatters,CoreLabels,CoreMessages,Cache,CoreViewsDefaultConfig,ChartUtils) {
                    console.info('required core utilities',performance.now());
                    cowu = new CoreUtils();
                    // cowc = new CoreConstants();
                    // cowf = new CoreFormatters();
                    // cowl = new CoreLabels();
                    // cowm = new CoreMessages();
                    // covdc = new CoreViewsDefaultConfig();
                    // cowch = new Cache();
                    // require(['layout-handler','content-handler','chart-utils','contrail-load','slick.core','slick.dataview',
                    require(['layout-handler','content-handler','contrail-load'
                        ],function(LayoutHandler,ContentHandler,ChartUtils) {
                        console.info('layout render started',performance.now());
                        contentHandler = new ContentHandler();
                        // initBackboneValidation();
                        // initCustomKOBindings(window.ko);
                        // initDomEvents();
                        layoutHandler = new LayoutHandler();
                        layoutHandlerLoadDefObj.resolve();
                        // menuXMLLoadDefObj.done(function(menuXML) {
                        //     layoutHandler.load(menuXML);
                        // });
                        //Load core utils

                        require(['core-bundle'],function() {
                            require(['core-constants','core-formatters','core-labels','core-messages',
                                'core-cache','core-views-default-config','chart-utils'],function(CoreConstants,CoreFormatters,CoreLabels,CoreMessages,Cache,CoreViewsDefaultConfig,ChartUtils) {
                                cowc = new CoreConstants();
                                cowf = new CoreFormatters();
                                cowl = new CoreLabels();
                                cowm = new CoreMessages();
                                covdc = new CoreViewsDefaultConfig();
                                cowch = new Cache();
                                chUtils = new ChartUtils();
                            });
                        });
                        require(['controller-bundle','core-bundle'],function() {
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
                                console.info('required controller libs',performance.now()); 
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
            // });
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
