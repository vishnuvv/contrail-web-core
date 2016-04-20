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
defaultBaseDir = ".";
var coreBaseDir = defaultBaseDir, coreWebDir = defaultBaseDir, ctBaseDir = defaultBaseDir,ctWebDir = defaultBaseDir,
    smBaseDir = defaultBaseDir, strgBaseDir = defaultBaseDir,
    pkgBaseDir = defaultBaseDir;
require.config({
    bundles: {
        'chart-libs'        : ['nv.d3'],
        // 'chart-libs'        : ['d3','nv.d3'],
        // 'thirdparty-libs'   : ['knockback','slick.checkboxselectcolumn','slick.rowselectionmodel','select2','slick.grid','validation'],
        'thirdparty-libs'   : ['slick.checkboxselectcolumn','slick.rowselectionmodel','select2','slick.grid'],
        'core-bundle'       : ['controller-view-model','crossfilter','lodash'],
        'contrail-core-views':[
    'core-basedir/js/views/GridView','core-basedir/js/views/AccordianView','core-basedir/js/views/DetailsView','core-basedir/js/views/DonutChartView','core-basedir/js/views/FormAutoCompleteTextBoxView','core-basedir/js/views/FormButtonView','core-basedir/js/views/FormCheckboxView','core-basedir/js/views/FormCollectionView','core-basedir/js/views/FormComboboxView','core-basedir/js/views/FormCompositeView','core-basedir/js/views/FormDateTimePickerView','core-basedir/js/views/FormDropdownView','core-basedir/js/views/FormEditableGridView','core-basedir/js/views/FormGridView','core-basedir/js/views/FormHierarchicalDropdownView','core-basedir/js/views/FormInputView','core-basedir/js/views/FormMultiselectView','core-basedir/js/views/FormNumericTextboxView','core-basedir/js/views/FormRadioButtonView','core-basedir/js/views/FormTextAreaView','core-basedir/js/views/FormTextView','core-basedir/js/views/GridFooterView','core-basedir/js/views/HeatChartView','core-basedir/js/views/HorizontalBarChartView','core-basedir/js/views/LineBarWithFocusChartView','core-basedir/js/views/LineWithFocusChartView','core-basedir/js/views/LoginWindowView','core-basedir/js/views/MultiBarChartView','core-basedir/js/views/MultiDonutChartView','core-basedir/js/views/NodeConsoleLogsView','core-basedir/js/views/QueryFilterView','core-basedir/js/views/QueryResultGridView','core-basedir/js/views/QueryResultLineChartView','core-basedir/js/views/QuerySelectView','core-basedir/js/views/QueryWhereView','core-basedir/js/views/SparklineView','core-basedir/js/views/TabsView','core-basedir/js/views/WizardView'],
        'jquery-dep-libs'      : ['jquery-ui',
         'jquery.timer','jquery.ui.touch-punch','jquery.validate','jquery.tristate','jquery.multiselect','jquery.multiselect.filter','jquery.steps.min','jquery.panzoom','jquery-contextmenu','jquery.event.drag','jquery.droppick','jquery.datetimepicker']
        // 'jquery-libs'       : ['jquery-ui',
        // 'jquery.timer','jquery.ui.touch-punch','jquery.validate','jquery.tristate','jquery.multiselect','jquery.multiselect.filter','jquery.steps.min','jquery.panzoom','jquery-contextmenu','jquery.event.drag','jquery.droppick','jquery.datetimepicker']
    },
    paths: {
        'core-srcdir'                 : coreBaseDir,
        'core-basedir'                : coreBaseDir,
        'controller-basedir'                : coreBaseDir,
        'jquery-libs'               : 'dist/js/jquery-libs',
        // 'lodash'                      : coreWebDir + '/assets/lodash/lodash.min',
        // 'underscore'                  : coreWebDir + '/assets/underscore/underscore',
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
            // Backbone requires underscore. This forces requireJS to load lodash instead: Backbone is not compatible with this lodash version
            // 'underscore': 'lodash'
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
        'underscore' : {
            init: function() {
                _.noConflict();
            }
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
        'controller-dashboard-libs': 'controller-dist/js/controller-dashboard-libs',
        'searchflow-model': 'controller-dist/monitor/infrastructure/underlay/ui/js/models/SearchFlowFormModel',
        'traceflow-model': 'controller-dist/monitor/infrastructure/underlay/ui/js/models/TraceFlowTabModel',
        'underlay-graph-model' : 'controller-dist/monitor/infrastructure/underlay/ui/js/models/UnderlayGraphModel'
    }
})
/*
 * End - Controller paths
 */

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
                                console.info("Error while loading page.",'Error');
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

var orchPrefix = window.location.pathname;
//Even with URL as <https://localhost:8143>,pahtname is returning as "/"
if(orchPrefix == "/")
    orchPrefix = "";

(function() {
    var menuXMLLoadDefObj,layoutHandlerLoadDefObj;
    loadUtils = {
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
        },
        postAuthenticate: function(response) {
            require(['jquery'],function() {
                $('#signin-container').empty();
                //If #content-container already exists,just show it
                if($('#content-container').length == 0) {
                    $('#app-container').html($('#app-container-tmpl').text());
                    $('#app-container').removeClass('hide');
                } else 
                    $('#app-container').removeClass('hide');
                $.ajaxSetup({
                    beforeSend: function (xhr, settings) {
                        if (globalObj['webServerInfo'] != null && globalObj['webServerInfo']['loggedInOrchestrationMode'] != null)
                            xhr.setRequestHeader("x-orchestrationmode", globalObj['webServerInfo']['loggedInOrchestrationMode']);
                        xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
                        xhr.setRequestHeader("X-CSRF-Token", loadUtils.getCookie('_csrf'));
                    }
                });
                globalObj['webServerInfo'] = loadUtils.parseWebServerInfo(response);

                if (loadUtils.getCookie('username') != null) {
                    $('#user_info').text(loadUtils.getCookie('username'));
                }
                $('#user-profile').show();
                loadUtils.bindAppListeners();
                $.when.apply(window,[menuXMLLoadDefObj,layoutHandlerLoadDefObj]).done(function(menuXML) {
                    layoutHandler.load(menuXML);
                });
            });
        },
        onAuthenticationReq: function() {
            document.getElementById('signin-container').innerHTML = document.getElementById('signin-container-tmpl').innerHTML;
            var appContEl = document.getElementById('app-container');
            if(appContEl.classList) {
                appContEl.classList.add('hide');
            } else {
                appContEl.className += ' ' + className;
            }
            // $('#signin-container').html($('#signin-container-tmpl').text());
            // $('#app-container').addClass('hide');
            // $('#app-container').empty();
            loadUtils.bindSignInListeners();
        },
        fetchMenu: function(menuXMLLoadDefObj) {
            $.ajax({
                url: '/menu',
                type: "GET",
                dataType: "xml"
            }).done(function (response,textStatus,xhr) {
                menuXML = response;
                menuXMLLoadDefObj.resolve(menuXML);
            }).fail(function(response) {
                console.info(response);
                loadUtils.onAuthenticationReq();
            });
        },
        isAuthenticated: function() {
            Ajax.request(orchPrefix + '/isauthenticated',"GET",null,function(response) {
                if(response != null && response.isAuthenticated == true) {
                    loadUtils.postAuthenticate(response);
                } else {
                    loadUtils.onAuthenticationReq();
                }
            });
        },
        bindSignInListeners: function() {
            document.getElementById('signin').onclick = loadUtils.authenticate;
            // $('#signin').click(authenticate);
        },
        bindAppListeners: function() {
            document.getElementById('logout').onclick = loadUtils.logout;
            // $('#logout').click(logout);
        },
        authenticate: function() {
            require(['jquery'],function() {
                //Compares client UTC time with the server UTC time and display alert if mismatch exceeds the threshold
                $.ajax({
                    url: orchPrefix + '/authenticate',
                    type: "POST",
                    data: JSON.stringify({
                        username: $("[name='username']").val(),
                        password: $("[name='password']").val()
                    }),
                    contentType: "application/json; charset=utf-8",
                    dataType: "json"
                }).done(function (response) {
                    if(response != null && response.isAuthenticated == true) {
                        loadUtils.postAuthenticate(response);
                    } else {
                        //Display login-error message
                        $('#login-error strong').text(response['msg']);
                        $('#login-error').removeClass('hide');
                    }
                });
            });
        },
        logout: function() {
            //Clear All Pending Ajax calls
            $.allajax.abort();
            $.ajax({
                url: '/logout',
                type: "GET",
                dataType: "json"
            }).done(function (response) {
                loadUtils.onAuthenticationReq();
            });
        },
        parseWebServerInfo: function(webServerInfo) {
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
            }
            return webServerInfo;
        }
    }
    //Check if the session is authenticated
    loadUtils.isAuthenticated();
    require(['jquery'],function() {
        menuXMLLoadDefObj = $.Deferred();
        layoutHandlerLoadDefObj = $.Deferred();
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
        loadUtils.fetchMenu(menuXMLLoadDefObj);
    /*
    $.ajax({
        url: orchPrefix + '/isauthenticated',
        type: "GET",
        dataType: "json"
    }).done(function (response,textStatus,xhr) {
        if(response != null && response.isAuthenticated == true) {
            postAuthenticate(response);
        } else {
            onAuthenticationReq();
        }
    }).fail(function(response) {
        console.info(response);
        onAuthenticationReq();
    });*/

        require(['jquery-dep-libs'],function() {});
        globalObj['layoutDefObj'] = $.Deferred();

        SVGElement.prototype.getTransformToElement = SVGElement.prototype.getTransformToElement || function(toElement) {
            return toElement.getScreenCTM().inverse().multiply(this.getScreenCTM());
        };

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
                // 'knockout'                    : coreWebDir + '/assets/knockout/knockout-3.0.0',
                // 'knockout'                    : coreWebDir + '/assets/knockout/knockout-3.0.0.debug',
                /*'jquery'                      : coreWebDir + '/assets/jquery/js/jquery-1.8.3.min',*/
                'joint'                       : coreWebDir + '/assets/joint/js/joint.clean',
                'geometry'                    : coreWebDir + '/assets/joint/js/geometry',
                'vectorizer'                  : coreWebDir + '/assets/joint/js/vectorizer',
                'joint.layout.DirectedGraph'  : coreWebDir + '/assets/joint/js/joint.layout.DirectedGraph',
                'dagre'                       : coreWebDir + '/assets/joint/js/dagre',
                'vis'                         : coreWebDir + '/assets/vis-v4.9.0/js/vis.min',
                'bezier'                      : coreWebDir + '/assets/bezierjs/bezier',
                'joint.contrail'              : coreWebDir + '/js/joint.contrail',
                // 'backbone'                    : coreWebDir + '/assets/backbone/backbone-min',
                // 'backbone'                    : coreWebDir + '/assets/backbone/backbone',
                // 'validation'                  : coreWebDir + '/assets/backbone/backbone-validation-amd',
                // 'knockback'                   : coreWebDir + '/assets/backbone/knockback.min',
                // 'knockback'                   : coreWebDir + '/assets/backbone/knockback',
                // 'lodash'                      : coreWebDir + '/assets/lodash/lodash.min',
                // 'underscore'                  : coreWebDir + '/assets/underscore/underscore-min',
                /*'text'                        : coreWebDir + '/assets/requirejs/text',

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
        //nonamd-libs   #no dependency on jquery
        //layout-libs   #dependency on jquery
        require(['core-bundle','jquery-dep-libs','nonamd-libs'],function() {
            require(['validation','knockout','backbone'],function(validation,ko) {
                window.kbValidation = validation;
                // window.ko = ko;
            });
            // console.info('done: loading common bundles',performance.now());
            //Get core-app paths and register to require
            require.config({
                // paths:getCoreAppPaths("","./built" //Can be used for prod vs dev
                paths:getCoreAppPaths(".","")
            });
            //Require all non-AMD modules that expose global variables if you use wrapShim option
            //Better to bundle all non-AMD modules together such that you can disable warpShim for that bundle..As seen requiring modules also taking decent time
            console.info(globalObj);
            require(['core-utils'],function(
                CoreUtils,CoreConstants,CoreFormatters,CoreLabels,CoreMessages,Cache,CoreViewsDefaultConfig,ChartUtils) {
                // console.info('required core utilities',performance.now());
                cowu = new CoreUtils();
                require(['underscore'],function(_) {
                    _.noConflict();
                });
                require(['layout-handler','content-handler','contrail-load','lodash'],function(LayoutHandler,ContentHandler,ChartUtils,_) {
                    window._ = _;
                    // console.info('layout render started',performance.now());
                    contentHandler = new ContentHandler();
                    initBackboneValidation();
                    initCustomKOBindings(window.ko);
                    initDomEvents();
                    layoutHandler = new LayoutHandler();
                    layoutHandlerLoadDefObj.resolve();
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
                            // console.info('required controller libs',performance.now()); 
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
})();
