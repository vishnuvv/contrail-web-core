/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('chart-utils',[
    'underscore'
], function (_) {

    var ChartUtils = function () {
        var self = this;

        self.updateChartOnResize = function(selector,chart){
            if(selector != null && $(selector).is(':visible') && chart != null) {
                if($(selector).find('.nv-noData').data('customMsg')) {
                    var msg = $(selector).find('.nv-noData').text();
                    chart.update();
                    $(selector).find('.nv-noData').text(msg);
                } else if($(selector).data('chart') != null)
                    $(selector).data('chart').update();
            }
        };

        self.getViewFinderPoint = function (time) {
            var navDate = d3.time.format('%x %H:%M')(new Date(time));
            return new Date(navDate).getTime();
        };

        self.getCurrentTime4MemCPUCharts = function () {
            var now = new Date(), currentTime;
            currentTime = now.getTime();
            return currentTime;
        };

        self.interpolateSankey = function(points) {
            var x0 = points[0][0], y0 = points[0][1], x1, y1, x2,
                path = [x0, ",", y0],
                i = 0, n = points.length;
            while (++i < n) {
                x1 = points[i][0], y1 = points[i][1], x2 = (x0 + x1) / 2;
                path.push("C", x2, ",", y0, " ", x2, ",", y1, " ", x1, ",", y1);
                x0 = x1, y0 = y1;
            }
            return path.join("");
        };

        self.drawSparkLine4Selector = function(selector, className, data) {
            var sortedData = ([].concat(data)).sort(function (a, b) {
                return a - b
            });
            var graph = d3.select(selector).append("svg:svg").attr('class', className);
            var maxY = sortedData[sortedData.length - 1];
            var x = d3.scale.linear().domain([0, ifNull(sortedData,[]).length]).range([0, 100]);
            var y = d3.scale.linear().domain([sortedData[0], maxY * 1.2]).range([10, 0]);
            var sparkLine = d3.svg.line()
                .x(function (d, i) {
                    return x(i);
                })
                .y(function (d) {
                    return y(d);
                });
            graph.append("svg:path").attr("d", sparkLine(data));
        };

        self.drawSparkLineBar = function(selector, data) {
            if ($(selector).find("svg") != null) {
                $(selector).empty();
            }
            var w = 57, h = 38, maxValue = 0, maxBarValue = 36;

            $.each(data.data, function(key,val){
                if(maxValue < parseInt(val.value)){
                    maxValue = parseInt(val.value);
                }
            });
            var svg = d3.select(selector)
                .append("svg")
                .attr("width", w)
                .attr("height", h);

            svg.selectAll("rect")
                .data(data.data)
                .enter()
                .append("rect")
                .attr("x",function(d, i) {
                    return i * 7;
                })
                .attr("y", function(d){
                    if(maxValue != 0){
                        d = parseInt(d.value) * maxBarValue / maxValue;
                    } else {
                        d = parseInt(d.value);
                    }
                    return h - (d + 2);
                })
                .attr("width", 5)
                .attr("height", function(d) {
                    if(maxValue != 0){
                        d = parseInt(d.value) * maxBarValue / maxValue;
                    } else {
                        d = parseInt(d.value);
                    }
                    return d + 2;
                })
                .attr("fill", "steelblue")
                .on("mouseover", function(d,i) {
                    $('body').find('.nvtooltip').remove();
                    var div = d3.select('body').append("div")
                        .attr("class", "nvtooltip");

                    div.transition().duration(10);

                    div.html('<span class="lbl">' + parseInt(d.value) + '</span> ' + data.yLbl + ' with <span class="lbl">' + d.name +'</span> ' + data.xLbl)
                        .style("left", (d3.event.pageX) + "px")
                        .style("top", (d3.event.pageY - 28) + "px");
                })
                .on("mouseout", function(d) {
                    $('body').find('.nvtooltip').remove();
                });
        };
    };

    return ChartUtils;
});

/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-constants',[
    'underscore'
], function (_) {
    var CoreConstants = function () {
        this.TMPL_SUFFIX_ID = "-template";
        this.RESULTS_SUFFIX_ID = "-results";
        this.ERROR_SUFFIX_ID = "_error";
        this.LOCKED_SUFFIX_ID = "_locked";
        this.FORM_SUFFIX_ID = "_form";

        this.SEV_LEVELS = {
                ERROR   : 3, //Red
                WARNING : 4, //Orange
//                NOTICE  : 2, //Blue
//                INFO    : 3, //Green
            }
       this.COLOR_SEVERITY_MAP = {
                red : 'error',
                orange : 'warning',
                blue : 'default',
                green : 'okay'
           };
        this.PATTERN_IP_ADDRESS  = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;
        this.PATTERN_SUBNET_MASK = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/(\d|[1-2]\d|3[0-2]))?$/;
        this.PATTERN_MAC_ADDRESS = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

        this.LIST_CACHE_UPDATE_INTERVAL = 60000;
        this.GRAPH_CACHE_UPDATE_INTERVAL = 60000;
        this.VIEWMODEL_CACHE_UPDATE_INTERVAL = 60000;

        this.DOMAIN_CACHE_UPDATE_INTERVAL = 15 * 60000;
        this.PROJECT_CACHE_UPDATE_INTERVAL = 7 * 60000;
        this.NETWORK_CACHE_UPDATE_INTERVAL = 4 * 60000;

        this.KEY_MODEL_ERRORS = 'errors';
        this.KEY_MODEL_LOCKS = 'locks';
        this.KEY_ELEMENT_ID = 'elementId';
        this.KEY_ROWS = 'rows';
        this.KEY_COLUMNS = 'columns';
        this.KEY_CHILD_VIEW = 'childView';
        this.KEY_VIEW_CONFIG = 'viewConfig';
        this.KEY_PATH = 'path';
        this.KEY_ELEMENT_CONFIG = 'elementConfig';
        this.KEY_DATABIND_VALUE = 'dataBindValue';
        this.KEY_TYPE = 'type';
        this.KEY_UI_ADDED_PARAMS = 'ui_added_parameters';

        this.KEY_VALIDATION = 'validation';
        this.OBJECT_TYPE_COLLECTION = 'collection';
        this.OBJECT_TYPE_MODEL = 'model';
        this.OBJECT_TYPE_COLLECTION_OF_COLLECTION = "collection_of_collection";

        this.TMPL_2ROW_CONTENT_VIEW = "core-2-row-content-template";
        this.TMPL_2COLUMN_1ROW_2ROW_CONTENT_VIEW = "core-2-column-1-row-2row-content-template";

        this.TMPL_ACCORDIAN_VIEW = "core-accordian-view-template";
        this.TMPL_INPUT_VIEW = "core-input-view-template";
        this.TMPL_EDITABLE_GRID_INPUT_VIEW = "core-editable-grid-input-view-template";
        this.TMP_EDITABLE_GRID_ACTION_VIEW = "core-editable-grid-action-view-template";
        this.TMPL_DROPDOWN_VIEW = "core-dropdown-view-template";
        this.TMPL_EDITABLE_GRID_DROPDOWN_VIEW = "core-editable-grid-dropdown-view-template";
        this.TMPL_EDITABLE_GRID_DROPDOWN_LEFT_LABEL_VIEW = "core-editable-grid-label-left-dropdown-view-template";
        this.TMPL_MULTISELECT_VIEW = "core-multiselect-view-template";
        this.TMPL_EDITABLE_GRID_MULTISELECT_LEFT_LABEL_VIEW = "core-editable-grid-label-left-multiselect-view-template";
        this.TMPL_EDITABLE_GRID_MULTISELECT_VIEW = "core-editable-grid-multiselect-view-template";
        this.TMPL_COMBOBOX_VIEW = "core-combobox-view-template";
        this.TMPL_EDITABLE_GRID_COMBOBOX_VIEW = "core-editable-grid-combobox-view-template";
        this.TMPL_CHECKBOX_VIEW = "core-checkbox-view-template";
        this.TMPL_CHECKBOX_LABEL_RIGHT_VIEW = "core-checkbox-label-right-view-template";
        this.TMPL_EDITABLE_GRID_CHECKBOX_VIEW = "core-editable-grid-checkbox-view-template";
        this.TMPL_TEXTAREA_VIEW = "core-textarea-view-template";
        this.TMPL_EDITABLE_GRID_TEXTAREA_VIEW = "core-editable-grid-textarea-view-template";
        this.TMPL_DATETIMEPICKER_VIEW = "core-datetimepicker-view-template";
        this.TMPL_NUMERICTEXTBOX_VIEW = "core-numerictextbox-view-template";
        this.TMPL_AUTOCOMPLETETEXTBOX_VIEW = "core-autocompletetextbox-view-template";
        this.TMPL_BUTTON_VIEW = "core-button-view-template";
        this.TMPL_COMPOSITE_VIEW = "core-composite-view-template";
        this.TMPL_RADIO_BUTTON_VIEW = "core-radio-button-view-template";
        this.TMPL_EDITABLE_GRID_VIEW = "core-editable-grid-view-template";
        this.TMPL_TEXT_VIEW = "core-text-view-template";

        this.TMPL_ELEMENT_NAME = 'core-element-name-template';

        this.TMPL_GRID_VIEW = "core-grid-view-template";

        this.TMPL_COLLECTION_VIEW = "core-collection-view-template";
        this.TMPL_GEN_COLLECTION_VIEW = "core-generic-collection-view-template";
        this.TMPL_COLLECTION_COMMON_HEADING_VIEW="core-collection-common-heading-view-template"
        this.TMPL_QUERY_OR_COLLECTION_VIEW = "query-or-collection-view-template";
        this.TMPL_COLLECTION_HEADING_VIEW = "core-collection-view-heading-template";
        this.TMPL_COLLECTION_GRIDACTION_HEADING_VIEW = "core-collection-view-grid-action-heading-template";
        this.TMPL_SECTION_VIEW = "core-section-view-template";
        this.TMPL_EDIT_FORM = "core-edit-form-template";
        this.TMPL_GENERIC_EDIT_FORM = "core-generic-edit-form-template";
        this.TMPL_2ROW_GROUP_DETAIL = "core-grid-2-row-group-detail-template";
        this.TMPL_DETAIL_PAGE = "core-detail-page-template";
        this.TMPL_DETAIL_PAGE_ACTION = "core-detail-page-action-template";
        this.TMPL_WIZARD_VIEW = "core-wizard-view-template";
        this.TMPL_NETWORKING_GRAPH_VIEW = "core-networking-graph-template";
        this.TMPL_CONTROL_PANEL = "core-control-panel-template";
        this.TMPL_CONTROL_PANEL_FILTER = "core-control-panel-filter-template";
        this.TMPL_TABS_VIEW = "core-tabs-template";
        this.TMPL_TAB_LINK_VIEW = "core-tabs-link-template";
        this.TMPL_TAB_CONTENT_VIEW = "core-tabs-content-template";
        this.TMPL_CHART_VIEW = "core-pd-chart-template";
        this.TMPL_DETAIL_FOUNDATION = "core-detail-foundation-template";
        this.TMPL_DETAIL_SECTION = "core-detail-section-template";
        this.TMPL_DETAIL_SECTION_COLUMN = "core-detail-section-column-template";
        this.TMPL_DETAIL_SECTION_ROW = "core-detail-section-row-template";
        this.TMPL_CHART = "core-chart-template";
        this.TMPL_ZOOMED_SCATTER_CHART = "core-zoomed-scatter-chart-template";
        this.TMPL_ZOOMED_SCATTER_CHART_CONTROL_PANEL_LEGEND = "core-zoomed-scatter-chart-control-panel-legend-template";
        this.TMPL_WIDGET_VIEW = "core-widget-view-template";
        this.TMPL_LOADING_SPINNER = "core-loading-spinner-template";
        this.TMPL_NOT_FOUND_MESSAGE = "core-not-found-message-template";
        this.TMPL_INFOBOXES_VIEW = "core-infobox-template";

        this.TMPL_NODE_DETAIL_SPARKLINE_BOX = 'node-details-sparkline-template';
        this.TMPL_NODE_DETAIL_INFOBOXES_BOX = 'node-details-infoboxes-template';
        //Top boxes in Monitor > Infra > Dashboard that show the summary count of
        //each node type
        this.TMPL_INFOBOX = "infobox-summary-template";
        //Boxes in vRouter Tab of "Monitor > Infra > Dashboard" that shows bar chart
        //along with total count and title
        this.TMPL_CHARTINFO = "barchart-info-template";
        this.TMPL_DASHBOARD_STATS = "dashboard-stats";
        this.TMPL_INFRA_DASHBOARD = "mon-infra-dashboard";
        this.DASHBOARD_ALERTS_GRID_SECTION_ID = "infra-dashboard-alerts-section";
        this.DASHBOARD_ALERTS_GRID_ID = "infra-dashboard-alerts-grid";
        this.DASHBOARD_ALERTS_GRID_TITLE = "Alerts";

        this.NODE_DETAILS_CHARTS = 'mon-infra-node-details-chart';

        this.TMPL_ELEMENT_TOOLTIP = "element-tooltip-template";
        this.TMPL_UNDERLAY_ELEMENT_TOOLTIP = "element-underlay-tooltip-template";
        this.TMPL_ELEMENT_TOOLTIP_TITLE = "element-tooltip-title-template";
        this.TMPL_ELEMENT_TOOLTIP_CONTENT = "element-tooltip-content-template";

        this.APP_CONTRAIL_CONTROLLER = "contrail-controller";
        this.APP_CONTRAIL_SM = "contrail-sm";
        this.APP_CONTRAIL_STORAGE = "contrail-storage";

        this.COOKIE_DOMAIN = 'domain';
        this.COOKIE_PROJECT = 'project';
        this.COOKIE_VIRTUAL_NETWORK = 'virtual-network';

        this.THEME_DETAIL_WIDGET = 'widget-box';
        this.THEME_DETAIL_DEFAULT = 'default';

        this.GRAPH_MARGIN_LEFT = 1050;
        this.GRAPH_MARGIN_RIGHT = 1050;
        this.GRAPH_MARGIN_TOP = 1075;
        this.GRAPH_MARGIN_BOTTOM = 1050;

        this.TOOLTIP_DELAY = 1000;

        this.DEFAULT_CONFIG_ELEMENT_TOOLTIP = {
            dimension: {
                width: 275
            },
            delay: this.TOOLTIP_DELAY
        };

        this.DEFAULT_CONFIG_NOT_FOUND_PAGE = {
            title: 'Page not found.',
            iconClass: 'icon-warning-sign',
            defaultNavLinks: false,
        };

        this.DEFAULT_CONFIG_ERROR_PAGE = {
            title: "Error in getting data.",
            iconClass: 'icon-warning-sign',
            defaultErrorMessage: false,
            defaultNavLinks: false
        };

        this.TAB_THEME_CLASSIC = "classic";
        this.TAB_THEME_OVERCAST = "overcast";
        this.TAB_THEME_WIDGET_CLASSIC = "widget-classic";

        this.DATA_REQUEST_STATE_FETCHING = 'fetching';
        this.DATA_REQUEST_STATE_ERROR = 'error';
        this.DATA_REQUEST_STATE_SUCCESS_EMPTY = 'success-empty';
        this.DATA_REQUEST_STATE_SUCCESS_NOT_EMPTY = 'success-not-empty';
        this.DATA_REQUEST_STATE_INITIAL_EMPTY = 'inital-empty';

        // QE Constants - Start
        this.QE_TIMEOUT = 12000;
        this.QE_RESULT_CHUNK_SIZE_10K = 10000;
        this.QE_RESULT_CHUNK_SIZE_1K = 1000;
        this.QE_MODAL_CLASS_700 = 'modal-700';
        this.QE_DEFAULT_MODAL_CLASSNAME = 'modal-840';
        this.QE_FLOW_TABLE_TYPE = "FLOW";
        this.QE_OBJECT_TABLE_TYPE = "OBJECT";
        this.QE_STAT_TABLE_TYPE = "STAT";
        this.QE_LOG_TABLE_TYPE = "LOG";
        this.QE_HASH_ELEMENT_PREFIX = "#qe-";
        this.QE_FORM_SUFFIX = "-form";
        this.QE_TEXT_SUFFIX = "-text-";
        this.QE_RESULTS_SUFFIX = "-results";
        this.QE_QUEUE_GRID_SUFFIX = "-queue-grid";
        this.QE_QUEUE_RESULT_SUFFIX = "-queue-result";

        this.QE_LOG_LEVELS = [
            { value: "0", name: "SYS_EMERG" },
            { value: "1", name: "SYS_ALERT" },
            { value: "2", name: "SYS_CRIT" },
            { value: "3", name: "SYS_ERR" },
            { value: "4", name: "SYS_WARN" },
            { value: "5", name: "SYS_NOTICE" },
            { value: "6", name: "SYS_INFO" },
            { value: "7", name: "SYS_DEBUG" }
        ],

        this.QE_SORT_ORDER_DROPDOWN_VALUES = [
            {'id' : 'asc', 'text' : 'ASC'},
            {'id' : 'desc', 'text' : 'DESC'}
        ];

        this.QE_DEFAULT_LIMIT_150K = "150000";
        this.QE_DEFAULT_LIMIT_50K = "50000";

        this.QE_DEFAULT_SORT_ORDER = "asc";
        this.QE_TITLE_SORT_ORDER = "Sort Order";
        this.QE_TITLE_SORT_BY = "Sort By";

        this.QE_FLOW_QUERY_QUEUE = "fqq";
        this.QE_LOG_QUERY_QUEUE = "lqq";
        this.QE_STAT_QUERY_QUEUE = "sqq";

        this.FS_QUERY_PREFIX = "fs";
        this.FC_QUERY_PREFIX = "fc";
        this.FR_QUERY_PREFIX = "fr";
        this.SA_QUERY_PREFIX = "sa";
        this.STAT_QUERY_PREFIX = "stat";
        this.OBJECT_LOGS_PREFIX = "ol";
        this.SYSTEM_LOGS_PREFIX = "sl";

        this.FS_HASH_P = 'query_flow_series';
        this.FR_HASH_P = 'query_flow_record';
        this.SL_HASH_P = 'query_log_system';
        this.OL_HASH_P = 'query_log_object';
        this.STAT_HASH_P = 'query_stat_query';

        this.CONSOLE_LOGS_PREFIX = "cl";

        this.DEFAULT_QUERY_PREFIX = 'query';

        this.QUERY_TYPE_MODIFY = 'modify';
        this.QUERY_TYPE_RERUN = 'rerun';
        this.QUERY_TYPE_ANALYZE = 'analyze';

        this.FLOW_SERIES_TABLE = "FlowSeriesTable";
        this.FLOW_RECORD_TABLE = "FlowRecordTable";
        this.FLOW_CLASS = "FlowClass";
        this.MESSAGE_TABLE = "MessageTable";
        this.SESSION_ANALYZER_TABLE = "SessionAnalyzerTable";

        this.KEY_RUN_QUERY_VALIDATION = 'runQueryValidation';

        this.TIMERANGE_DROPDOWN_VALUES = [
            {'id': 600, 'text': 'Last 10 Mins'},
            {'id': 1800, 'text': 'Last 30 Mins'},
            {'id': 3600, 'text': 'Last 1 Hr'},
            {'id': 21600, 'text': 'Last 6 Hrs'},
            {'id': 43200, 'text': 'Last 12 Hrs'},
            {'id': -1, 'text': 'Custom'}
        ];

        this.CONSOLE_LOGS_LIMITS =  [
            {id: "All", text: "All" },
            {id: "10", text: "10 Messages" },
            {id: "50", text: "50 Messages" },
            {id: "100", text: "100 Messages" },
            {id: "200", text: "200 Messages" },
            {id: "500", text: "500 Messages" }
        ];

        this.DIRECTION_DROPDOWN_VALUES = [
            {'id': '1', 'text': 'INGRESS'},
            {'id': '0', 'text': 'EGRESS'}
        ];

        this.TIME_GRANULARITY_INTERVAL_VALUES = {
            secs: 1000,
            mins: 60 * 1000,
            hrs: 60 * 60 * 1000,
            days: 24 * 60 * 60 * 1000
        };

        this.OPERATOR_CODES = {
            1: '=',
            2: '!=',
            5: '<=',
            6: '>=',
            7: 'Starts with',
            8: 'RegEx='
        };

        this.BYTE_PREFIX = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

        this.URL_TABLES = "/api/qe/tables";
        this.URL_PREFIX_TABLE_SCHEMA = "/api/qe/table/schema/";

        this.TENANT_API_URL = "/api/tenant/get-data";

        this.URL_QUERY_FLOW_QUEUE = '#p=query_flow_queue';
        this.URL_QUERY_LOG_QUEUE = '#p=query_log_queue';
        this.URL_QUERY_STAT_QUEUE = '#p=query_stat_queue';

        this.UMID_QUERY_RESULT_CHART_MODEL = "qe:query-result-chart-model";
        this.UMID_QUERY_RESULT_LINE_CHART_MODEL = "qe:query-result-line-chart-model";
        this.UMID_QUERY_RESULT_LIST_MODEL = "qe:query-result-list-model";

        this.SESSION_ANALYZER_KEY = "summary";
        this.SESSION_ANALYZER_INGRESS_KEY = "ingress";
        this.SESSION_ANALYZER_REVERSE_INGRESS_KEY = "reverse_ingress";
        this.SESSION_ANALYZER_EGRESS_KEY = "egress";
        this.SESSION_ANALYZER_REVERSE_EGRESS_KEY = "reverse_egress";

        this.UMID_SA_SUMMARY_MODEL = "qe:sa:" + this.SESSION_ANALYZER_KEY + "-model";
        this.UMID_SA_SUMMARY_LIST_MODEL = "qe:sa:" + this.SESSION_ANALYZER_KEY + "-list-model";
        this.UMID_SA_INGRESS_LIST_MODEL = "qe:sa:" + this.SESSION_ANALYZER_INGRESS_KEY + "-list-model";
        this.UMID_SA_EGRESS_LIST_MODEL = "qe:sa:" + this.SESSION_ANALYZER_EGRESS_KEY + "-list-model";
        this.UMID_SA_REVERSE_INGRESS_LIST_MODEL = "qe:sa:" + this.SESSION_ANALYZER_REVERSE_INGRESS_KEY + "-list-model";
        this.UMID_SA_REVERSE_EGRESS_LIST_MODEL = "qe:sa:" + this.SESSION_ANALYZER_REVERSE_EGRESS_KEY + "-list-model";
        this.UMID_SA_SUMMARY_LINE_CHART_MODEL = "qe:sa:" + this.SESSION_ANALYZER_KEY + "-line-chart-model";

        this.SESSION_ANALYZER_CHART_DATA_KEY = ["ingress", "egress", "reverse_ingress", "reverse_egress"];

        //order of the key matters. should match with the above chart data key.
        this.MAP_SESSION_ANALYZER_DATA_KEY = {
            summary: {
                label: "Summary"
            },
            ingress: {
                label: "Ingress",
                query: {
                    type: 'ingress',
                    reverse : false
                }
            },
            egress: {
                label: "Egress",
                query: {
                    type: 'egress',
                    reverse : false
                }
            },
            reverse_ingress: {
                label: "Reverse Ingress",
                query: {
                    type: 'ingress',
                    reverse : true
                }
            },
            reverse_egress: {
                label: "Reverse Egress",
                query: {
                    type: 'egress',
                    reverse : true
                }
            }
        };

        this.QUERY_COLUMN_FORMATTER = {
            "T": "micro-date",
            "T=": "micro-date",
            "MessageTS": "micro-date",
            "setup_time": "micro-date",
            "protocol": "protocol",
            "direction_ing": "query-direction",

            "bytes": "byte",
            "sum(bytes)": "byte",
            "packets": "number",
            "sum(packets)": "number",
            "flow_count": "number",

            "agg-bytes": "byte",
            "agg-packets": "number",

            // cpu_info
            "cpu_info.mem_virt": "byte",
            "SUM(cpu_info.mem_virt)": "byte",
            "MAX(cpu_info.mem_virt)": "byte",
            "MIN(cpu_info.mem_virt)": "byte",

            "cpu_info.mem_res": "byte",
            "SUM(cpu_info.mem_res)": "byte",
            "MAX(cpu_info.mem_res)": "byte",
            "MIN(cpu_info.mem_res)": "byte",

            "cpu_info.used_sys_mem": "byte",
            "SUM(cpu_info.used_sys_mem)": "byte",
            "MAX(cpu_info.used_sys_mem)": "byte",
            "MIN(cpu_info.used_sys_mem)": "byte",


            "cpu_info.cpu_share": [{format: 'number', options: {formatSpecifier: '.3n'}}, {format: 'percentage'}],
            "SUM(cpu_info.cpu_share)": [{format: 'number', options: {formatSpecifier: '.3n'}}, {format: 'percentage'}],
            "MAX(cpu_info.cpu_share)": [{format: 'number', options: {formatSpecifier: '.3n'}}, {format: 'percentage'}],
            "MIN(cpu_info.cpu_share)": [{format: 'number', options: {formatSpecifier: '.3n'}}, {format: 'percentage'}],


            "cpu_info.one_min_cpuload": [{format: 'number', options: {formatSpecifier: '.3n'}}, {format: 'percentage'}],
            "SUM(cpu_info.one_min_cpuload)": [{format: 'number', options: {formatSpecifier: '.3n'}}, {format: 'percentage'}],
            "MAX(cpu_info.one_min_cpuload)": [{format: 'number', options: {formatSpecifier: '.3n'}}, {format: 'percentage'}],
            "MIN(cpu_info.one_min_cpuload)": [{format: 'number', options: {formatSpecifier: '.3n'}}, {format: 'percentage'}],

            // cpu_stats
            "cpu_stats.cpu_one_min_avg": [{format: 'number', options: {formatSpecifier: '.3n'}}, {format: 'percentage'}],
            "SUM(cpu_stats.cpu_one_min_avg)": [{format: 'number', options: {formatSpecifier: '.3n'}}, {format: 'percentage'}],
            "MAX(cpu_stats.cpu_one_min_avg)": [{format: 'number', options: {formatSpecifier: '.3n'}}, {format: 'percentage'}],
            "MIN(cpu_stats.cpu_one_min_avg)": [{format: 'number', options: {formatSpecifier: '.3n'}}, {format: 'percentage'}],

            "cpu_stats.vm_memory_quota": "byte",
            "SUM(cpu_stats.vm_memory_quota)": "byte",
            "MAX(cpu_stats.vm_memory_quota)": "byte",
            "MIN(cpu_stats.vm_memory_quota)": "byte",

            "cpu_stats.virt_memory": "byte",
            "SUM(cpu_stats.virt_memory)": "byte",
            "MAX(cpu_stats.virt_memory)": "byte",
            "MIN(cpu_stats.virt_memory)": "byte",

            "cpu_stats.peak_virt_memory": "byte",
            "SUM(cpu_stats.peak_virt_memory)": "byte",
            "MAX(cpu_stats.peak_virt_memory)": "byte",
            "MIN(cpu_stats.peak_virt_memory)": "byte",

            // msg_info
            "msg_info.bytes": "byte",
            "SUM(msg_info.bytes)": "byte",
            "MAX(msg_info.bytes)": "byte",
            "MIN(msg_info.bytes)": "byte",


            // vn_stats
            "vn_stats.in_bytes": "byte",
            "SUM(vn_stats.in_bytes)": "byte",
            "MAX(vn_stats.in_bytes)": "byte",
            "MIN(vn_stats.in_bytes)": "byte",

            "vn_stats.out_bytes": "byte",
            "SUM(vn_stats.out_bytes)": "byte",
            "MAX(vn_stats.out_bytes)": "byte",
            "MIN(vn_stats.out_bytes)": "byte",

            // tx_socket_stats
            "tx_socket_stats.bytes": "byte",
            "SUM(tx_socket_stats.bytes)": "byte",
            "MAX(tx_socket_stats.bytes)": "byte",
            "MIN(tx_socket_stats.bytes)": "byte",

            "tx_socket_stats.average_bytes": "byte",
            "SUM(tx_socket_stats.average_bytes)": "byte",
            "MAX(tx_socket_stats.average_bytes)": "byte",
            "MIN(tx_socket_stats.average_bytes)": "byte",

            // rx_socket_stats
            "rx_socket_stats.bytes": "byte",
            "SUM(rx_socket_stats.bytes)": "byte",
            "MAX(rx_socket_stats.bytes)": "byte",
            "MIN(rx_socket_stats.bytes)": "byte",

            "rx_socket_stats.average_bytes": "byte",
            "SUM(rx_socket_stats.average_bytes)": "byte",
            "MAX(rx_socket_stats.average_bytes)": "byte",
            "MIN(rx_socket_stats.average_bytes)": "byte",

            // rx_message_stats
            "rx_message_stats.bytes": "byte",
            "SUM(rx_message_stats.bytes)": "byte",
            "MAX(rx_message_stats.bytes)": "byte",
            "MIN(rx_message_stats.bytes)": "byte",

            // virtual_ip_stats
            "virtual_ip_stats.bytes_in": "byte",
            "SUM(virtual_ip_stats.bytes_in)": "byte",
            "MAX(virtual_ip_stats.bytes_in)": "byte",
            "MIN(virtual_ip_stats.bytes_in)": "byte",

            "virtual_ip_stats.bytes_out": "byte",
            "SUM(virtual_ip_stats.bytes_out)": "byte",
            "MAX(virtual_ip_stats.bytes_out)": "byte",
            "MIN(virtual_ip_stats.bytes_out)": "byte",

            // pool_stats
            "pool_stats.bytes_in": "byte",
            "SUM(pool_stats.bytes_in)": "byte",
            "MAX(pool_stats.bytes_in)": "byte",
            "MIN(pool_stats.bytes_in)": "byte",

            "pool_stats.bytes_out": "byte",
            "SUM(pool_stats.bytes_out)": "byte",
            "MAX(pool_stats.bytes_out)": "byte",
            "MIN(pool_stats.bytes_out)": "byte",

            // member_stats
            "member_stats.bytes_in": "byte",
            "SUM(member_stats.bytes_in)": "byte",
            "MAX(member_stats.bytes_in)": "byte",
            "MIN(member_stats.bytes_in)": "byte",

            "member_stats.bytes_out": "byte",
            "SUM(member_stats.bytes_out)": "byte",
            "MAX(member_stats.bytes_out)": "byte",
            "MIN(member_stats.bytes_out)": "byte",

            // fip_diff_stats
            "fip_diff_stats.in_bytes": "byte",
            "SUM(fip_diff_stats.in_bytes)": "byte",
            "MAX(fip_diff_stats.in_bytes)": "byte",
            "MIN(fip_diff_stats.in_bytes)": "byte",

            "fip_diff_stats.out_bytes": "byte",
            "SUM(fip_diff_stats.out_bytes)": "byte",
            "MAX(fip_diff_stats.out_bytes)": "byte",
            "MIN(fip_diff_stats.out_bytes)": "byte",

            // if_stats
            "if_stats.in_bytes": "byte",
            "SUM(if_stats.in_bytes)": "byte",
            "MAX(if_stats.in_bytes)": "byte",
            "MIN(if_stats.in_bytes)": "byte",

            "if_stats.out_bytes": "byte",
            "SUM(if_stats.out_bytes)": "byte",
            "MAX(if_stats.out_bytes)": "byte",
            "MIN(if_stats.out_bytes)": "byte",

            // info_stats
            "info_stats.read_kbytes": "kilo-byte",
            "SUM(info_stats.read_kbytes)": "kilo-byte",
            "MAX(info_stats.read_kbytes)": "kilo-byte",
            "MIN(info_stats.read_kbytes)": "kilo-byte",

            "info_stats.write_kbytes": "kilo-byte",
            "SUM(info_stats.write_kbytes)": "kilo-byte",
            "MAX(info_stats.write_kbytes)": "kilo-byte",
            "MIN(info_stats.write_kbytes)": "kilo-byte",

            // resource_info_stats
            "resource_info_stats.mem_usage_mb": "mega-byte",
            "SUM(resource_info_stats.mem_usage_mb)": "mega-byte",
            "MAX(resource_info_stats.mem_usage_mb)": "mega-byte",
            "MIN(resource_info_stats.mem_usage_mb)": "mega-byte",

            // file_system_view_stats
            "file_system_view_stats.size_kb": "kilo-byte",
            "SUM(file_system_view_stats.size_kb)": "kilo-byte",
            "MAX(file_system_view_stats.size_kb)": "kilo-byte",
            "MIN(file_system_view_stats.size_kb)": "kilo-byte",

            "file_system_view_stats.used_kb": "kilo-byte",
            "SUM(file_system_view_stats.used_kb)": "kilo-byte",
            "MAX(file_system_view_stats.used_kb)": "kilo-byte",
            "MIN(file_system_view_stats.used_kb)": "kilo-byte",

            "file_system_view_stats.available_kb": "kilo-byte",
            "SUM(file_system_view_stats.available_kb)": "kilo-byte",
            "MAX(file_system_view_stats.available_kb)": "kilo-byte",
            "MIN(file_system_view_stats.available_kb)": "kilo-byte",

            "file_system_view_stats.physical_disks.disk_size_kb": "kilo-byte",
            "SUM(file_system_view_stats.physical_disks.disk_size_kb)": "kilo-byte",
            "MAX(file_system_view_stats.physical_disks.disk_size_kb)": "kilo-byte",
            "MIN(file_system_view_stats.physical_disks.disk_size_kb)": "kilo-byte",

            "file_system_view_stats.physical_disks.disk_used_kb": "kilo-byte",
            "SUM(file_system_view_stats.physical_disks.disk_used_kb)": "kilo-byte",
            "MAX(file_system_view_stats.physical_disks.disk_used_kb)": "kilo-byte",
            "MIN(file_system_view_stats.physical_disks.disk_used_kb)": "kilo-byte",

            "file_system_view_stats.physical_disks.disk_available_kb": "kilo-byte",
            "SUM(file_system_view_stats.physical_disks.disk_available_kb)": "kilo-byte",
            "MAX(file_system_view_stats.physical_disks.disk_available_kb)": "kilo-byte",
            "MIN(file_system_view_stats.physical_disks.disk_available_kb)": "kilo-byte",

            "database_usage.disk_space_used_1k": "kilo-byte",
            "SUM(database_usage.disk_space_used_1k)": "kilo-byte",
            "MAX(database_usage.disk_space_used_1k)": "kilo-byte",
            "MIN(database_usage.disk_space_used_1k)": "kilo-byte",

            "database_usage.disk_space_available_1k": "kilo-byte",
            "SUM(database_usage.disk_space_available_1k)": "kilo-byte",
            "MAX(database_usage.disk_space_available_1k)": "kilo-byte",
            "MIN(database_usage.disk_space_available_1k)": "kilo-byte",

            "database_usage.analytics_db_size_1k": "kilo-byte",
            "SUM(database_usage.analytics_db_size_1k)": "kilo-byte",
            "MAX(database_usage.analytics_db_size_1k)": "kilo-byte",
            "MIN(database_usage.analytics_db_size_1k)": "kilo-byte",

            "disk_usage_info.partition_space_available_1k": "kilo-byte",
            "SUM(disk_usage_info.partition_space_available_1k)": "kilo-byte",
            "MAX(disk_usage_info.partition_space_available_1k)": "kilo-byte",
            "MIN(disk_usage_info.partition_space_available_1k)": "kilo-byte"
        };

        this.DEFAULT_FR_SELECT_FIELDS = "vrouter, sourcevn, sourceip, destvn, destip, protocol, sport, dport, setup_time, teardown_time, agg-packets, agg-bytes, action";
        this.DEFAULT_FS_SELECT_FIELDS = "vrouter, sourcevn, sourceip, destvn, destip, protocol, sport, dport, T=, sum(packets), sum(bytes)";
        this.DEFAULT_SL_SELECT_FIELDS = "MessageTS, Source, ModuleId, Category, Level, NodeType, Messagetype, Xmlmessage";

        this.D3_COLOR_CATEGORY2 = [ "#1f77b4", "#2ca02c"];
        this.D3_COLOR_CATEGORY5 = [ '#1f77b4', '#6baed6' , '#ff7f0e', '#2ca02c', '#9e9ac8'];
        this.D3_COLOR_CATEGORY7 = [ '#1f77b4' , '#ff7f0e', '#2ca02c', '#a55194', '#9e9ac8', '#6baed6', '#bcbd22'];

        // QE Constants - End

        //Alarm constants
        this.URL_ALARM_DETAILS_IN_CHUNKS =
            '/api/tenant/monitoring/alarms?count={0}&startAt={1}';
        this.ALARM_REFRESH_DURATION = 300000;//5 MINUTES
        this.ALARM_BUCKET_DURATION = 300000000;//5 MINUTES

        this.get = function () {
            var args = arguments;
            return cowu.getValueFromTemplate(args);
        };
    };
    return CoreConstants;
});

/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-formatters',[
    'underscore'
], function (_) {
    var CoreFormatters = function () {
        var self = this;

        this.format = {
            'number': function (value, options) {
                var defaultOptions = {formatSpecifier: ',d'},
                    options = _.extend(defaultOptions, options);

                // As we lazyload d3 don't use d3 for simple formatting
                // return d3.format(options.formatSpecifier)(value)
                return value.toLocaleString();
            },
            'date': function (value, options) {
                var defaultOptions = {formatSpecifier: 'llll'},
                    options = _.extend(defaultOptions, options);

                return moment(parseInt(value)).format(options.formatSpecifier)
            },
            'micro-date': function (value, options) {
                var defaultOptions = {formatSpecifier: 'YYYY-MM-DD HH:mm:ss:SSS'},
                    options = _.extend(defaultOptions, options);

                if(value == null || value == 0 || value == '') {
                    return ''
                } else {
                    return self.format.date(value / 1000, options)
                        + ':' + ((value % 1000 === 0) ? '0' : value % 1000);
                }
            },
            'percentage': function (value, options) {
                return value + " %";
            },
            'length': function (value, options) {
                return value.length;
            },
            'byte': function (value, options) {
                var defaultOptions = {valueFormat: 'B'},
                    options = _.extend(defaultOptions, options),
                    byteIndex = cowc.BYTE_PREFIX.indexOf(options.valueFormat);

                value = (byteIndex > 0) ? value * (Math.pow(1024,byteIndex)) : value

                return cowu.addUnits2Bytes(value);
            },
            'kilo-byte': function (value, options) {
                return cowu.addUnits2Bytes(value * 1024);
            },
            'mega-byte': function (value, options) {
                return cowu.addUnits2Bytes(value * 1024 * 1024);
            },
            'time-period': function (value, options) {
                var timeValue = parseInt(value),
                    timeStr = '';

                if (timeValue === -1) {
                    timeStr = '-';
                } else {
                    if (value >= 3600) {
                        var days = parseInt(timeValue / 3600);
                        timeStr += days.toString();
                        timeStr += (days === 1) ? ' day ' : ' days ';
                        timeValue = timeValue % 3600;
                    }

                    if (timeValue >= 60) {
                        var mins = parseInt(timeValue / 60);
                        timeStr += mins.toString();
                        timeStr += (mins === 1) ? ' min ' : ' mins ';
                        timeValue = timeValue % 60;
                    }

                    if (value > 0) {
                        var secs = timeValue;
                        timeStr += secs.toString();
                        timeStr += (secs === 1) ? ' sec' : ' secs';
                    }
                }

                return timeStr;
            },
            'query-time-range': function (value, options) {
                return qewu.formatTimeRange(value);
            },
            'query-direction': function (value, options) {
                return (value == 0) ? 'EGRESS' : 'INGRESS';
            },
            'protocol': function (value, options) {
                return getProtocolName(value)
            },
            'xml2json': function (value, options) {
                var jsonValue = null;
                if (contrail.checkIfExist(options['dataObject']) && contrail.checkIfExist(options['jsonValuePath'])) {
                    var dataObject = options['dataObject'],
                        jsonValuePath = options['jsonValuePath'];

                    jsonValue = dataObject[jsonValuePath];
                }

                if (_.isString(value) && !$.isPlainObject(jsonValue)) {
                     return cowu.formatXML2JSON(value);
                }

                return jsonValue;
            },
            'json2html': function (value, options) {
                var htmlValue = null, jsonValue = null,
                    expandLevel = contrail.checkIfExist(options.expandLevel) ? options.expandLevel : 1;

                if (contrail.checkIfExist(options['dataObject']) && contrail.checkIfExist(options['htmlValuePath'])) {
                    var dataObject = options['dataObject'],
                        htmlValuePath = options['htmlValuePath'],
                        jsonValuePath = options['jsonValuePath'];

                    if (contrail.checkIfExist(jsonValuePath)) {
                        value = dataObject[jsonValuePath];
                    }

                    htmlValue = dataObject[htmlValuePath];
                }

                if ($.isPlainObject(value) && !_.isString(htmlValue)) {
                    return '<pre class="json-html-viewer">' + cowu.constructJsonHtmlViewer(value, expandLevel, 0, options.ignoreKeys)+ '</pre>'
                }

                return htmlValue;
            }
        };

        this.getFormattedValue = function (formatterKey, value, options) {
            if (!contrail.checkIfExist(value)) {
                return '';
            } else if (contrail.checkIfFunction(formatterKey)) {
                return formatterKey(value, options);
            } else if (_.isArray(formatterKey)) {
                var formattedValue = value;
                $.each(formatterKey, function(formatIndex, formatObj){
                    formattedValue = self.getFormattedValue(formatObj.format, formattedValue, formatObj.options);
                });
                return formattedValue;
            } else if (contrail.checkIfExist(this.format[formatterKey])) {
                return this.format[formatterKey](value, options);
            } else {
                var obj = contrail.checkIfExist(options) ? options.obj : null,
                    iconClass = contrail.checkIfExist(options) ? options.iconClass : null,
                    key = contrail.checkIfExist(options) ? options.key : null;

                switch (formatterKey) {

                    case 'throughput' :
                        return formatThroughput(value);
                        break;

                    case 'fault-state' :
                        if (value === true || value === 'true') {
                            return '<span class="red">' + value + '</span>';
                        } else {
                            return value
                        }
                        break;

                    case 'status-state' :
                        if (value === 'ok') {
                            return '<span class="green">' + value + '</span>';
                        } else {
                            return value
                        }

                        break;

                    case 'health-status-state' :
                        var iconClass = options.iconClass,
                            iconHTML = (contrail.checkIfExist(iconClass) ?
                        '<i class="' + iconClass + ' pull-right padding-3-0"></i>' : '');

                        if (value === 'critical') {
                            return '<span class="red ' + key + '-value">'
                                + value + iconHTML +
                                '</span>';
                        } else if (value === 'ok') {
                            return '<span class="green">' + value + '</span>';
                        } else {
                            return value
                        }

                        break;

                    case 'alert-percentage' :
                        try {
                            if (value != null && value > 90) {
                                return '<span class="red">' + value + ' %</span>';
                            } else {
                                return value + " %";
                            }
                        } catch (error) {
                            return value;
                        }
                        break;

                    case 'packet' :
                        return cowu.addUnits2Packets(value);
                        break;



                    //run the user defined formatter function
                    default :
                        if (contrail.checkIfFunction(eval(formatterKey))) {
                            return eval(formatterKey)(value, obj, iconClass, key);
                        } else {
                            //Reg Ex to display comma separated numbers
                            return value;
                        }
                };
            }
        };

        this.formatValueArray4Grid = function (valueArray, entriesToShow) {
            var formattedStr = '',
                entriesToShow = (entriesToShow == null) ? 2 : entriesToShow;

            if (valueArray == null) {
                return formattedStr;
            }

            $.each(valueArray, function (idx, value) {
                if (idx == 0) {
                    formattedStr += value;
                } else if (idx < entriesToShow) {
                    formattedStr += '<br/>' + value;
                } else {
                    return;
                }
            });

            if (valueArray.length > 2) {
                formattedStr += '<br/>' + contrail.format('({0} more)', valueArray.length - entriesToShow);
            }

            return ((formattedStr == '') ? '-' : formattedStr);
        };

        this.getYAxisFormatterFunction4Chart = function(formatterKey) {
            switch (formatterKey) {
                case 'bytes' :
                    return function(d) { return cowu.addUnits2Bytes(d, false, false, 1); }
                    break;
                case 'percentage' :
                    return function(d) { return d + ' %'; }
                    break;

                default: return function(d) { return d; }
            }
        };

        this.formatElementName = function(options) {
            var elementNameTemplate = contrail.getTemplate4Id(cowc.TMPL_ELEMENT_NAME);

            return elementNameTemplate(options);
        };
    };
    return CoreFormatters;
});

/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('contrail-remote-data-handler',[
    'underscore'
], function (_) {
    var ContrailRemoteDataHandler = function (remoteHandlerConfig) {

        var primaryRemoteConfig = remoteHandlerConfig['primaryRemoteConfig'],
            vlRemoteConfig = remoteHandlerConfig['vlRemoteConfig'],
            vlRemoteList = (vlRemoteConfig != null) ? vlRemoteConfig['vlRemoteList'] : null,
            hlRemoteConfig = remoteHandlerConfig['hlRemoteConfig'],
            hlRemoteList = (hlRemoteConfig != null) ? hlRemoteConfig['hlRemoteList'] : null;

        var autoFetchData = remoteHandlerConfig['autoFetchData'];

        var pAjaxConfig, pUrl, pUrlParams, pDataParser, pInitCallback, pSuccessCallback,
            pRefreshSuccessCallback, pFailureCallback, pCompleteCallback,
            pRequestCompleteResponse = [], pRequestInProgress = false;

        var vlRequestsInProgress = [], vlRequestInProgress = false, vlCompleteCallback,
            resetDataFlag = false, self = this;
        var vlRequestsConfig = [];

        pAjaxConfig = primaryRemoteConfig.ajaxConfig;
        pUrl = pAjaxConfig['url'];
        pUrlParams = $.deparamURLArgs(pUrl);

        pDataParser = primaryRemoteConfig.dataParser;
        pCompleteCallback = primaryRemoteConfig.completeCallback;

        vlCompleteCallback = vlRemoteConfig.completeCallback;

        pInitCallback = primaryRemoteConfig.initCallback;
        pSuccessCallback = primaryRemoteConfig.successCallback;
        pRefreshSuccessCallback = primaryRemoteConfig.refreshSuccessCallback;
        pFailureCallback = primaryRemoteConfig.failureCallback;

        self.isPrimaryRequestInProgress = function () {
            return pRequestInProgress;
        }

        self.isVLRequestInProgress = function () {
            return vlRequestInProgress;
        }

        self.isRequestInProgress = function () {
            if (pRequestInProgress || vlRequestInProgress) {
                return true;
            } else {
                return false;
            }
        };

        self.refreshData = function () {
            if (!self.isRequestInProgress()) {
                resetDataHandler4Refresh();
                contrail.ajaxHandler(pAjaxConfig, pInitHandler, pRefreshHandler, pFailureHandler);
            }
        };

        if(autoFetchData == null || autoFetchData) {
            fetchPrimaryData();
        }

        return self;

        function vlCompleteHandler() {
            if (contrail.checkIfFunction(vlCompleteCallback)) {
                vlCompleteCallback();
            }
        };

        function pInitHandler() {
            pRequestInProgress = true;
            if(vlRemoteList != null && vlRemoteList.length > 0) {
                vlRequestInProgress = true;
            }
            if (contrail.checkIfFunction(pInitCallback)) {
                pInitCallback();
            }
        };

        function pSuccessHandler(response) {
            var resultJSON = {};
            if (contrail.checkIfFunction(pDataParser)) {
                try {
                    resultJSON = pDataParser(response);
                } catch (error) {
                    console.log(error.stack);
                }
            } else {
                if(response != null) {
                    resultJSON = response;
                }
            }

            pRequestCompleteResponse.push(response);

            if (contrail.checkIfFunction(pSuccessCallback)) {
                pSuccessCallback(resultJSON, resetDataFlag, response);
                resetDataFlag = false;
                initVLRequests(resultJSON);
            }

            if (isFetchMoreData(response)) {
                fetchPrimaryData();
            } else {
                pRequestInProgress = false;
                delete pUrlParams['lastKey'];
                if(contrail.checkIfExist(response) && contrail.checkIfExist(response['serverSideChunking'])) {
                    var postData = JSON.parse(pAjaxConfig['data']);
                    postData['chunk'] = 1;
                    pAjaxConfig['data'] = JSON.stringify(postData);
                }

                if(contrail.checkIfExist(pUrlParams['firstCount'])) {
                    pUrlParams['count'] = pUrlParams['firstCount'];
                }

                pAjaxConfig['url'] = pUrl.split('?')[0] + '?' + $.param(pUrlParams);
                if (pCompleteCallback != null) {
                    pCompleteCallback(pRequestCompleteResponse);
                    check4AllRequestComplete();
                }
            }
        };

        function setNextUrl(lastKey) {
            pUrlParams['lastKey'] = lastKey;

            if(contrail.checkIfExist(pUrlParams['nextCount']) && pUrlParams['count'] !== pUrlParams['nextCount']) {
                pUrlParams['firstCount'] = pUrlParams['count'];
                pUrlParams['count'] = pUrlParams['nextCount'];
            }

            pAjaxConfig['url'] = pUrl.split('?')[0] + '?' + $.param(pUrlParams);
        }

        function isFetchMoreData(response) {
            var fetchMoreData = false,
                postData, chunk;

            if (contrail.checkIfExist(response) && contrail.checkIfExist(response['more'])) {
                fetchMoreData = response['more'];
                if(fetchMoreData) {
                    setNextUrl(response['lastKey']);
                }
            } else if (contrail.checkIfExist(response) && contrail.checkIfExist(response['serverSideChunking'])) {
                fetchMoreData = (response['total'] != null) && (response['chunk'] != null) && ((response['chunk'] * response['chunkSize']) < response['total']);
                if(fetchMoreData) {
                    postData = JSON.parse(pAjaxConfig['data']);
                    chunk = postData['chunk'] + 1;
                    postData['chunk'] = chunk;
                    pAjaxConfig['data'] = JSON.stringify(postData);
                }
            }
            return fetchMoreData;
        }

        function pRefreshHandler(response) {
            pSuccessHandler(response);
            if (contrail.checkIfFunction(pRefreshSuccessCallback)) {
                pRefreshSuccessCallback();
            }
        };

        function pFailureHandler(xhr) {
            if (contrail.checkIfFunction(pFailureCallback)) {
                xhr['ajaxConfig'] = pAjaxConfig;
                pFailureCallback(xhr);
            }
            pRequestInProgress = false;
            updateVLRequestStatus();
            if (pCompleteCallback != null) {
                pCompleteCallback(pRequestCompleteResponse);
                check4AllRequestComplete();
            }
        };

        function fetchPrimaryData() {
            contrail.ajaxHandler(pAjaxConfig, pInitHandler, pSuccessHandler, pFailureHandler);
        };

        function initVLRequests(resultJSON) {
            var vlCounter = vlRequestsInProgress.length;
            vlRequestsInProgress[vlCounter] = [];
            vlRequestsConfig[vlCounter] = [];
            if (vlRemoteList != null) {
                for (var i = 0; i < vlRemoteList.length; i++) {
                    var vlRemote = vlRemoteList[i],
                        innerCounter = vlRequestsInProgress[vlCounter].length;
                    vlRequestsInProgress[vlCounter][innerCounter] = 1;
                    vlRequestsConfig[vlCounter][innerCounter] =
                        vlRemoteList[i].getAjaxConfig(resultJSON);
                    updateVLRequestStatus();
                    var vlDataParser = vlRemote.dataParser,
                        vlSuccessCallback = vlRemote.successCallback,
                        vlFailureCallback = vlRemote.failureCallback;

                    var vlSuccessHandler = getVLSuccessHandlerFn(vlDataParser, vlSuccessCallback, vlCounter, innerCounter);

                    var vlFailureHandler =
                        getVLFailureHandlerFn(vlFailureCallback, vlCounter,
                                              innerCounter, vlRequestsConfig);

                    contrail.ajaxHandler(vlRemoteList[i].getAjaxConfig(resultJSON), vlRemoteList[i].initCallback, vlSuccessHandler, vlFailureHandler);
                }
            }
        };

        function getVLSuccessHandlerFn(vlDataParser, vlSuccessCallback, vlCounter, innerCounter) {
            return function (vlResponse) {
                var vlResultJSON;

                if (contrail.checkIfFunction(vlDataParser)) {
                    vlResultJSON = vlDataParser(vlResponse);
                } else {
                    vlResultJSON = vlResponse;
                }

                vlSuccessCallback(vlResultJSON);
                vlRequestsInProgress[vlCounter][innerCounter] = 0;
                updateVLRequestStatus();
            }
        };

        function getVLFailureHandlerFn(vlFailureCallback, vlCounter,
                                       innerCounter, vlRequestsConfig) {
            return function (xhr) {
                var ajaxConfig = null;
                if ((null != vlRequestsConfig[vlCounter]) &&
                    (null != vlRequestsConfig[vlCounter][innerCounter])) {
                    ajaxConfig =
                        JSON.parse(JSON.stringify(vlRequestsConfig[vlCounter][innerCounter]));
                }
                vlRequestsInProgress[vlCounter][innerCounter] = 0;
                xhr['ajaxConfig'] = ajaxConfig;
                vlFailureCallback(xhr);
                vlRequestsConfig[vlCounter][innerCounter] = null;
                updateVLRequestStatus();
            };
        };

        function updateVLRequestStatus() {
            var flattenedArray = _.flatten(vlRequestsInProgress);

            var inProgress = _.find(flattenedArray, function (status) {
                return status == 1;
            });

            vlRequestInProgress = (typeof inProgress != "undefined") ? true : false;

            if (!vlRequestInProgress) {
                vlCompleteHandler();
                check4AllRequestComplete();
            }
        };

        function check4AllRequestComplete() {
            if(!self.isRequestInProgress() && remoteHandlerConfig['onAllRequestsCompleteCallback'] != null) {
                remoteHandlerConfig.onAllRequestsCompleteCallback();
            }
        };

        function resetDataHandler4Refresh() {
            resetDataFlag = true;
            pRequestCompleteResponse = [];
            pRequestInProgress = false;
            vlRequestsInProgress = [];
            vlRequestInProgress = false;
        };
    };

    return ContrailRemoteDataHandler;
});

/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('contrail-list-model',[
    'underscore',
    'contrail-remote-data-handler'
], function (_, ContrailRemoteDataHandler) {
    var ContrailListModel = function (listModelConfig, parentModelList) {
        var contrailListModel = {}, newContrailListModel = {},
            hlContrailListModel, contrailDataHandler = null, newContrailDataHandler, self = this,
            cachedData, remoteHandlerConfig, hlModelConfig,
            cacheUsedStatus = {isCacheUsed: false, reload: true},
            sortConfig = listModelConfig['sortConfig'];

        var defaultCacheConfig = {
            cacheConfig: {
                cacheTimeout: cowc.LIST_CACHE_UPDATE_INTERVAL,
                loadOnTimeout: true
            }
        };

        var childDefaultCacheConfig = {
            cacheConfig: {
                cacheTimeout: 0,
                loadOnTimeout: true
            }
        };

        if (listModelConfig != null) {
            var modelConfig = $.extend(true, {}, defaultCacheConfig, listModelConfig),
                cacheConfig = modelConfig['cacheConfig'];

            contrailListModel = initContrailListModel(cacheConfig, sortConfig);

            if(modelConfig['remote'] != null) {
                if(contrail.checkIfFunction(modelConfig['remote'].onAllRequestsCompleteCB)) {
                    contrailListModel.onAllRequestsComplete.subscribe(function () {
                        modelConfig['remote'].onAllRequestsCompleteCB(contrailListModel, parentModelList);
                    });
                }
            }

            if (modelConfig.data != null) {
                contrailListModel.setData(modelConfig.data);
                bindDataHandler2Model(contrailListModel);
            } else if (modelConfig.remote != null && modelConfig.remote.ajaxConfig != null) {
                hlModelConfig = modelConfig['remote']['hlRemoteConfig'];
                cachedData = (contrailListModel.ucid != null) ? cowch.getDataFromCache(contrailListModel.ucid) : null;
                cacheUsedStatus = setCachedData2Model(contrailListModel, cacheConfig);

                if (cacheUsedStatus['isCacheUsed']) {
                    if (cacheUsedStatus['reload']) {
                        var cachedContrailListModel = cachedData['dataObject']['listModel'],
                            offset = cachedContrailListModel._idOffset;

                        newContrailListModel = initContrailListModel(cacheConfig, sortConfig, offset);
                        remoteHandlerConfig = getUpdateRemoteHandlerConfig(modelConfig, newContrailListModel, contrailListModel, parentModelList);
                        newContrailDataHandler = new ContrailRemoteDataHandler(remoteHandlerConfig);

                        if (hlModelConfig != null) {
                            var childModelConfig = $.extend(true, {}, childDefaultCacheConfig, hlModelConfig);
                            hlContrailListModel = getNewContrailListModel(childModelConfig, [newContrailListModel, contrailListModel]);
                        }
                        bindDataHandler2Model(contrailListModel, newContrailDataHandler, hlContrailListModel);
                        bindDataHandler2Model(newContrailListModel, newContrailDataHandler, hlContrailListModel);
                    } else {
                        // Setting autoFetchData=false i.e create request handler but don't fetch data
                        createRemoteDataHandler(false);
                    }
                    contrailListModel.onAllRequestsComplete.notify();
                } else {
                    createRemoteDataHandler();
                }
            }
        }

        function createRemoteDataHandler(autoFetchData) {
            if (hlModelConfig != null) {
                var childModelConfig = $.extend(true, {}, childDefaultCacheConfig, hlModelConfig);
                hlContrailListModel = getNewContrailListModel(childModelConfig, [contrailListModel]);
            }
            remoteHandlerConfig = getRemoteHandlerConfig(modelConfig, contrailListModel, parentModelList, autoFetchData);
            contrailDataHandler = new ContrailRemoteDataHandler(remoteHandlerConfig);

            bindDataHandler2Model(contrailListModel, contrailDataHandler, hlContrailListModel);
        };

        return contrailListModel;
    };

    function setCachedData2Model(contrailListModel, cacheConfig) {
        var isCacheUsed = false, usePrimaryCache = true,
            reload = true, secondaryCacheStatus,
            cachedData = (cacheConfig.ucid != null) ? cowch.getDataFromCache(cacheConfig.ucid) : null,
            setCachedData2ModelCB = (cacheConfig != null) ? cacheConfig['setCachedData2ModelCB']  : null;

        usePrimaryCache = cowch.isCacheValid(cacheConfig, cachedData, 'listModel');

        if (usePrimaryCache) {
            var cachedContrailListModel = cachedData['dataObject']['listModel'],
                lastUpdateTime = cachedData['lastUpdateTime'];

            contrailListModel.setData(cachedContrailListModel.getItems());
            contrailListModel.loadedFromCache = true;

            isCacheUsed = true;
            if (cacheConfig['cacheTimeout'] < ($.now() - lastUpdateTime)) {
                reload = true;
            } else {
                reload = false;
            }
        } else if (contrail.checkIfFunction(setCachedData2ModelCB)) {
            secondaryCacheStatus = cacheConfig['setCachedData2ModelCB'](contrailListModel, cacheConfig);
            if (contrail.checkIfExist(secondaryCacheStatus)) {
                isCacheUsed = contrail.handleIfNull(secondaryCacheStatus['isCacheUsed'], false);
                reload = contrail.handleIfNull(secondaryCacheStatus['reload'], true);
            } else {
                isCacheUsed = false;
                reload = true;
            }
        }

        return {isCacheUsed: isCacheUsed, reload: reload};
    };

    function initContrailListModel(cacheConfig, sortConfig, offset) {
        var slickDataView = new Slick.Data.DataView({inlineFilters: true}),
            contrailListModel = {};

        $.extend(true, contrailListModel, slickDataView, {
            _idOffset: (offset != null) ? offset : 0,
            error: false,
            empty: false,
            errorList: [],
            sortConfig: sortConfig,
            setData: function (data) {
                // Setting id for each data-item; Required to instantiate data-view.
                setId4Idx(data, this);
                this.beginUpdate();
                this.setItems(data);
                this.endUpdate();
            },
            setSearchFilter: function (searchColumns, searchFilter) {
                this.setFilterArgs({
                    searchString: '',
                    searchColumns: searchColumns
                });
                this.setFilter(searchFilter);
            },
            addData: function (data) {
                var dis = this;
                setId4Idx(data, this);
                this.beginUpdate();
                $.each(data, function (key, val) {
                    dis.addItem(val);
                });
                this.endUpdate();
            },
            updateData: function (data) {
                this.beginUpdate();
                var dis = this;
                $.each(data, function (key, val) {
                    dis.updateItem(val.cgrid, val);
                });
                this.endUpdate();
            },
            deleteDataByIds: function (ids) {
                this.beginUpdate();
                var dis = this;
                $.each(ids, function (key, val) {
                    dis.deleteItem(val);
                });
                this.endUpdate();
            },
            performDefaultSort: function() {
                performDefaultSort(sortConfig, this);
            }
        });

        contrailListModel.onAllRequestsComplete = new Slick.Event();

        if(cacheConfig != null) {
            contrailListModel = $.extend(true, contrailListModel, {
                ucid: cacheConfig['ucid']
            });
        }

        return contrailListModel;
    };

    function bindDataHandler2Model(contrailListModel, contrailDataHandler, hlContrailListModel) {
        contrailListModel['isPrimaryRequestInProgress'] = function () {
            return (contrailDataHandler != null) ? contrailDataHandler.isPrimaryRequestInProgress() : false;
        };

        contrailListModel['isVLRequestInProgress'] = function () {
            return (contrailDataHandler != null) ? contrailDataHandler.isVLRequestInProgress() : false;
        };

        contrailListModel['isRequestInProgress'] = function () {
            var currentModelRequestInProgress = (contrailDataHandler != null) ? contrailDataHandler.isRequestInProgress() : false,
                hlModelRequestInProgress = (hlContrailListModel != null) ? hlContrailListModel.isRequestInProgress() : false;

            return (currentModelRequestInProgress || hlModelRequestInProgress);
        };

        contrailListModel['refreshData'] = function () {
            if (contrailDataHandler != null && !contrailDataHandler.isRequestInProgress()) {
                resetListModel4Refresh(contrailListModel);
                contrailDataHandler.refreshData();
                if (hlContrailListModel != null) {
                    hlContrailListModel.refreshData();
                }
            }
         }
    };

    function getRemoteHandlerConfig(listModelConfig, contrailListModel, parentModelList, autoFetchData) {
        var remoteHandlerConfig = {
                autoFetchData: (autoFetchData != null) ? autoFetchData : true
            },
            primaryRemote = listModelConfig.remote,
            vlRemoteConfig = contrail.handleIfNull(listModelConfig.vlRemoteConfig, {}),
            vlRemoteList = contrail.handleIfNull(vlRemoteConfig['vlRemoteList'], []),
            primaryRemoteConfig = {
                ajaxConfig: primaryRemote.ajaxConfig,
                dataParser: primaryRemote.dataParser,
                initCallback: primaryRemote.initCallback,
                successCallback: function (resultJSON, resetDataFlag, response) {
                    if (resetDataFlag) {
                        contrailListModel.setData(resultJSON);
                    } else {
                        contrailListModel.addData(resultJSON);
                    }
                    if (contrail.checkIfFunction(primaryRemote.successCallback)) {
                        primaryRemote.successCallback(resultJSON, contrailListModel, response);
                    }
                },
                refreshSuccessCallback: function () {},
                failureCallback: function (xhr) {
                    contrailListModel.error = true;
                    contrailListModel.errorList.push(xhr);
                    if (parentModelList != null && parentModelList.length > 0) {
                        for (var i = 0; i < 1; i++) {
                            parentModelList[i].error = true;
                        }
                    }
                    if (contrail.checkIfFunction(primaryRemote.failureCallback)) {
                        primaryRemote.failureCallback(xhr, contrailListModel);
                    }
                },
                completeCallback: function (response) {
                    if (contrail.checkIfFunction(primaryRemote.completeCallback)) {
                        primaryRemote.completeCallback(response, contrailListModel, parentModelList);
                    }

                    if (!contrailListModel.isRequestInProgress()) {
                        updateDataInCache(contrailListModel);
                    }

                    if (parentModelList != null && parentModelList.length > 0) {
                        for (var i = 0; i < 1; i++) {
                            if (!parentModelList[i].isRequestInProgress()) {
                                updateDataInCache(parentModelList[i]);
                            }
                        }
                    }
                }
            },
            vlRemote;

        remoteHandlerConfig['primaryRemoteConfig'] = primaryRemoteConfig;
        remoteHandlerConfig['onAllRequestsCompleteCallback'] = function() {
            if(!contrailListModel.isRequestInProgress()) {
                contrailListModel.onAllRequestsComplete.notify();
            }
            if (parentModelList != null && parentModelList.length > 0) {
                for (var i = 0; i < 1; i++) {
                    if (!parentModelList[i].isRequestInProgress()) {
                        parentModelList[i].onAllRequestsComplete.notify();
                    }
                }
            }
        };

        remoteHandlerConfig['vlRemoteConfig'] = {
            vlRemoteList: [],
            completeCallback: function () {
                if (contrail.checkIfFunction(vlRemoteConfig['completeCallback'])) {
                    vlRemoteConfig['completeCallback'](contrailListModel, parentModelList);
                }

                if (!contrailListModel.isRequestInProgress()) {
                    updateDataInCache(contrailListModel);
                }

                if (parentModelList != null && parentModelList.length > 0) {
                    if (!parentModelList[0].isRequestInProgress()) {
                        updateDataInCache(parentModelList[0]);
                    }
                }
            }
        };

        for (var i = 0; i < vlRemoteList.length; i++) {
            var vlSuccessCallback = vlRemoteList[i].successCallback,
                vlFailureCallback = vlRemoteList[i].failureCallback;

            vlRemote = {
                getAjaxConfig: vlRemoteList[i].getAjaxConfig,
                dataParser: vlRemoteList[i].dataParser,
                initCallback: vlRemoteList[i].initCallback,
                successCallback: getVLRemoteSuccessCB(vlSuccessCallback, contrailListModel, parentModelList),
                failureCallback: getVLRemoteFailureCB(vlFailureCallback, contrailListModel, parentModelList)
            }
            remoteHandlerConfig['vlRemoteConfig']['vlRemoteList'].push(vlRemote);
        };


        return remoteHandlerConfig;
    };

    function getVLRemoteSuccessCB(vlSuccessCallback, contrailListModel, parentModelList) {
        return function (response) {
            if (contrail.checkIfFunction(vlSuccessCallback)) {
                vlSuccessCallback(response, contrailListModel, parentModelList);
            }
        };
    };

    function getVLRemoteFailureCB(vlFailureCallback, contrailListModel, parentModelList) {
        return function (xhr) {
            contrailListModel.error = true;
            contrailListModel.errorList.push(xhr);
            if (parentModelList != null && parentModelList.length > 0) {
                for (var i = 0; i < 1; i++) {
                    parentModelList[i].error = true;
                }
            }
            if (contrail.checkIfFunction(vlFailureCallback)) {
                vlFailureCallback(xhr, contrailListModel);
            }
        };
    };

    function getUpdateRemoteHandlerConfig(listModelConfig, newContrailListModel, visibleContrailListModel, parentModelList) {
        var remoteHandlerConfig = {},
            primaryRemote = listModelConfig.remote,
            vlRemoteConfig = contrail.handleIfNull(listModelConfig.vlRemoteConfig, {}),
            vlRemoteList = contrail.handleIfNull(vlRemoteConfig['vlRemoteList'], []),
            primaryRemoteConfig = {
                ajaxConfig: primaryRemote.ajaxConfig,
                dataParser: primaryRemote.dataParser,
                initCallback: primaryRemote.initCallback,
                successCallback: function (resultJSON, resetDataFlag, response) {
                    // TODO: refreshData for newContrailListModel will never get fired.
                    if (resetDataFlag) {
                        newContrailListModel.setData(resultJSON);
                    } else {
                        newContrailListModel.addData(resultJSON);
                    }
                    if (contrail.checkIfFunction(primaryRemote.successCallback)) {
                        primaryRemote.successCallback(resultJSON, newContrailListModel, response);
                    }
                },
                refreshSuccessCallback: function () {},
                failureCallback: function (xhr) {
                    newContrailListModel.error = true;
                    newContrailListModel.errorList.push(xhr);

                    if (parentModelList != null && parentModelList.length > 0) {
                        for (var i = 0; i < 1; i++) {
                            parentModelList[i].error = true;
                        }
                    }

                    if (contrail.checkIfFunction(primaryRemote.failureCallback)) {
                        primaryRemote.failureCallback(xhr, newContrailListModel);
                    }
                },
                completeCallback: function (response) {

                    if (contrail.checkIfFunction(primaryRemote.completeCallback)) {
                        primaryRemote.completeCallback(response, newContrailListModel, parentModelList);
                    }

                    if (!newContrailListModel.isRequestInProgress()) {
                        updateDataInCache(newContrailListModel);

                        visibleContrailListModel.setData([]);
                        visibleContrailListModel.setData(newContrailListModel.getItems());
                    }

                    if (parentModelList != null && parentModelList.length > 0) {
                        for (var i = 0; i < 1; i++) {
                            if (!parentModelList[i].isRequestInProgress()) {
                                updateDataInCache(parentModelList[i]);
                            }
                        }
                    }
                }
            },
            vlRemote;

        remoteHandlerConfig['primaryRemoteConfig'] = primaryRemoteConfig;

        remoteHandlerConfig['onAllRequestsCompleteCallback'] = function() {
            //TODO: Debug why check for isRequestInProgress is not required
            visibleContrailListModel.onAllRequestsComplete.notify();
            newContrailListModel.onAllRequestsComplete.notify();

            if (parentModelList != null && parentModelList.length > 0) {
                for (var i = 0; i < 1; i++) {
                    if (!parentModelList[i].isRequestInProgress()) {
                        parentModelList[i].onAllRequestsComplete.notify();
                    }
                }
            }
        };

        remoteHandlerConfig['vlRemoteConfig'] = {
            vlRemoteList: [],
            completeCallback: function () {
                if (contrail.checkIfFunction(vlRemoteConfig['completeCallback'])) {
                    vlRemoteConfig['completeCallback'](newContrailListModel, parentModelList);
                }

                if (!newContrailListModel.isRequestInProgress()) {
                    updateDataInCache(newContrailListModel);

                    visibleContrailListModel.setData([]);
                    visibleContrailListModel.setData(newContrailListModel.getItems());
                }

                if (parentModelList != null && parentModelList.length > 0) {
                    if (!parentModelList[0].isRequestInProgress()) {
                        updateDataInCache(parentModelList[0]);
                    }
                }
            }
        };

        for (var i = 0; i < vlRemoteList.length; i++) {
            var vlSuccessCallback = vlRemoteList[i].successCallback,
                vlFailureCallback = vlRemoteList[i].failureCallback;

            vlRemote = {
                getAjaxConfig: vlRemoteList[i].getAjaxConfig,
                dataParser: vlRemoteList[i].dataParser,
                initCallback: vlRemoteList[i].initCallback,
                successCallback: getVLRemoteSuccessCB(vlSuccessCallback, newContrailListModel, parentModelList),
                failureCallback: getVLRemoteFailureCB(vlFailureCallback, newContrailListModel, parentModelList)
            }
            remoteHandlerConfig['vlRemoteConfig']['vlRemoteList'].push(vlRemote);
        }

        return remoteHandlerConfig;
    };

    function updateDataInCache(contrailListModel) {
        if (contrailListModel.ucid != null) {
            //TODO: Binding of cached listModel (if any) with existing view should be destroyed.
            cowch.setData2Cache(contrailListModel.ucid, {
                listModel: contrailListModel
            });
        }
    };

    function getNewContrailListModel(modelConfig, parentListModel) {
        return new ContrailListModel(modelConfig, parentListModel);
    };

    function resetListModel4Refresh(listModel) {
        listModel.error = false;
        listModel.errorList = [];
    };

    function setId4Idx(data, dis) {
        var offset = dis._idOffset;
        // Setting id for each data-item; Required to instantiate data-view.
        if (data != null && data.length > 0) {
            $.each(data, function (key, val) {
                if (!contrail.checkIfExist(val.cgrid)) {
                    data[key].cgrid = 'id_' + (key + offset);
                }
            });
            dis._idOffset += data.length;
        }
    };

    function performDefaultSort(sortConfig, contrailListModel) {
        var defaultSortColumns = contrail.checkIfExist(sortConfig) ? sortConfig['defaultSortColumns'] : [];

        if(defaultSortColumns.length > 0) {
            contrailListModel.sort(function (dataRow1, dataRow2) {
                for (var i = 0, l = defaultSortColumns.length; i < l; i++) {
                    var field = defaultSortColumns[i].sortColumn.field,
                        sign = defaultSortColumns[i].sortAsc ? 1 : -1,
                        sortColumn = defaultSortColumns[i].sortColumn,
                        result = 0, value1, value2;

                    if(contrail.checkIfExist(sortColumn.sortable)) {
                        value1 = (contrail.checkIfExist(sortColumn.sortable.sortBy) && sortColumn.sortable.sortBy == 'formattedValue') ? sortColumn.formatter('', '', '', '', dataRow1) : dataRow1[field];
                        value2 = (contrail.checkIfExist(sortColumn.sortable.sortBy) && sortColumn.sortable.sortBy == 'formattedValue') ? sortColumn.formatter('', '', '', '', dataRow2) : dataRow2[field];
                    } else {
                        value1 = dataRow1[field];
                        value2 = dataRow2[field];
                    }

                    if(defaultSortColumns[i].sortColumn.sorter != null){
                        result = defaultSortColumns[i].sortColumn.sorter(value1, value2, sign); // sorter property from column definition will be called if present
                    } else {
                        result = (value1 == value2 ? 0 : (value1 > value2 ? 1 : -1)) * sign;
                    }
                    if (result != 0) {
                        return result;
                    }
                }
                return 0;
            });
        }
    };

    return ContrailListModel
});
/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-cache',[
    'underscore',
    'contrail-list-model'
], function (_, ContrailListModel) {
    var coCache = {
        'breadcrumb': {},
        'server-manager': {},
        'monitor-networking': {
            graphs: {},
            charts: {},
            lists: {}
        }
    };

    var Cache = function () {
        this.init = function () {};

        this.cleanCache = function(key) {
            this.set(key, {});
        };

        this.reset = function() {
            coCache = {
                'breadcrumb': {},
                'server-manager': {},
                'monitor-networking': {
                    graphs: {},
                    charts: {},
                    lists: {}
                }
            };
        };

        this.get = function (key) {
            var keyList = key.split(':'),
                cache = coCache;

            for (var i = 0; i < keyList.length; i++) {
                cache = cache[keyList[i]];
                if (cache == null) {
                    return cache;
                }
            }

            return cache;
        };

        this.set = function (key, value) {
            var keyList = key.split(':'),
                cache = coCache;

            for (var i = 0; i < keyList.length; i++) {
                if (cache[keyList[i]] == null && i != (keyList.length - 1)) {
                    cache[keyList[i]] = {};
                    cache = cache[keyList[i]];
                } else if (i == (keyList.length - 1)) {
                    cache[keyList[i]] = value;
                } else if (cache[keyList[i]] != null) {
                    cache = cache[keyList[i]];
                }
            }
        };

        this.getDataFromCache = function (ucid) {
            return this.get(ucid);
        };

        this.setData2Cache = function (ucid, dataObject) {
            this.set(ucid, {lastUpdateTime: $.now(), dataObject: dataObject});
        };

        this.isCacheValid = function(cacheConfig, cachedData, modelType) {
            var useCache = true;

            //TODO: isRequestInProgress check should not be required
            if (cacheConfig.cacheTimeout == 0 || cachedData == null || cachedData['dataObject'][modelType].error || cachedData['dataObject'][modelType].isRequestInProgress()) {
                useCache = false;
            } else if (cachedData != null && (cacheConfig.cacheTimeout < ($.now() - cachedData['lastUpdateTime'])) && cacheConfig.loadOnTimeout == false) {
                useCache = false;
            }

            return useCache;
        };
    };

    return Cache;
});
/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-labels',[
    'underscore'
], function (_) {
    var CoreLabels = function () {
        this.get = function (key, app) {

            var label = null,
                featurePackages = globalObj.webServerInfo.featurePkg;

            if(contrail.checkIfExist(app)) {
                if (app == cowc.APP_CONTRAIL_CONTROLLER) {
                    label = ctwl.get(key)
                } else if (app == cowc.APP_CONTRAIL_SM) {
                    label = smwl.get(key);
                } else if (app == cowc.APP_CONTRAIL_STORAGE) {
                    label = swl.get(key);
                }
            } else {
                label = this.getCoreLabel(key);

                if (!contrail.checkIfExist(label) && featurePackages.webController && typeof ctwl !== 'undefined' && ctwl.isExistKey(key)) {
                    label = ctwl.get(key);
                }

                if (!contrail.checkIfExist(label) && featurePackages.serverManager && typeof smwl !== 'undefined' && smwl.isExistKey(key)) {
                    label = smwl.get(key);
                }

                if (!contrail.checkIfExist(label) && featurePackages.webStorage && typeof swl !== 'undefined' && swl.isExistKey(key)) {
                    label = swl.get(key);
                }

                if (!contrail.checkIfExist(label)) {
                    var keyArray = key.split('.'),
                        newKey = keyArray[keyArray.length - 1];

                    label = capitalizeSentence(cowu.replaceAll("_", " ", newKey));
                }
            }

            return label;
        };

        this.getCoreLabel = function(key) {
            var keyArray, newKey;
            if (_.has(labelMap, key)) {
                return labelMap[key];
            } else {
                keyArray = key.split('.');
                newKey = keyArray[keyArray.length - 1];
                if (keyArray.length > 1 && _.has(labelMap, newKey)) {
                    return labelMap[newKey];
                }
            }

            return null;
        };

        this.getInLowerCase = function (key) {
            var label = this.get(key);
            return label.toLowerCase();
        };

        this.getInUpperCase = function (key) {
            var label = this.get(key);
            return label.toUpperCase();
        };

        this.getFirstCharUpperCase = function (key) {
            var label = this.get(key);

            label = label.toLowerCase().replace(/\b[a-z]/g, function(letter) {
                return letter.toUpperCase();
            });
            return label;
        };

        var labelMap = {};

        this.BREADCRUMB_ID = "breadcrumb";

        // Query Engine labels
        this.QE_QUERY_RESULT_GRID_ID = 'qe-query-result-grid';
        this.QE_QUERY_RESULT_TEXT_ID = 'qe-query-result-text';
        this.QE_QUERY_RESULT_CHART_PAGE_ID = 'qe-query-result-chart-page';
        this.QE_QUERY_RESULT_CHART_ID = 'qe-query-result-chart';
        this.QE_QUERY_RESULT_CHART_GRID_ID = 'qe-query-result-chart-grid';
        this.QE_QUERY_RESULT_LINE_CHART_ID = 'qe-query-result-line-chart';

        this.QE_QUERY_QUEUE_TABS_ID = "qe-query-queue-tabs";
        this.QE_QUERY_QUEUE_RESULT_GRID_TAB_ID = "qe-query-queue-result-grid-tab";
        this.QE_QUERY_QUEUE_RESULT_CHART_TAB_ID = "qe-query-queue-result-chart-tab";
        this.QE_QUERY_QUEUE_GRID_ID = "qe-query-queue-grid";

        this.QE_FLOW_SERIES_ID = "qe-flow-series";
        this.QE_FLOW_SERIES_SECTION_ID = "qe-flow-series-section";
        this.QE_FLOW_SERIES_TAB_ID = "qe-flow-series-tab";
        this.QE_FLOW_SERIES_GRID_ID = "qe-flow-series-grid";
        this.QE_FLOW_SERIES_CHART_ID = "qe-flow-series-chart";
        this.QE_FLOW_SERIES_CHART_PAGE_ID = 'qe-flow-series-chart-page';
        this.QE_FLOW_SERIES_LINE_CHART_ID = "qe-flow-series-line-chart"
        this.QE_FLOW_SERIES_CHART_GRID_ID = "qe-flow-series-chart-grid";

        this.QE_FLOW_DETAILS_TAB_VIEW__ID = "qe-flow-details-tab-view";
        this.QE_FLOW_DETAILS_TAB_ID = "qe-flow-details-tab";
        this.QE_FLOW_DETAILS_GRID_ID = "qe-flow-details-grid";

        this.QE_FLOW_RECORD_ID = "qe-flow-record";
        this.QE_FLOW_RECORD_SECTION_ID = "qe-flow-record-section";
        this.QE_FLOW_RECORD_TAB_ID = "qe-flow-record-tab";
        this.QE_FLOW_RECORD_GRID_ID = "qe-flow-record-grid";

        this.QE_SESSION_ANALYZER_VIEW_ID = "qe-sa-view";
        this.QE_SESSION_ANALYZER_RESULT_TAB_ID = "qe-sa-result-tab";
        this.QE_SESSION_ANALYZER_RESULT_CHART_ID = "qe-sa-result-chart";
        this.QE_SESSION_ANALYZER_RESULT_GRID_TAB_ID = "qe-sa-result-grid-tab";
        this.QE_SESSION_ANALYZER_RESULT_GRID_ID = "qe-sa-result-grid";
        this.QE_SESSION_ANALYZER_RESULT_TEXT_ID = "qe-sa-result-text";

        this.QE_FLOW_QUEUE_ID = "qe-flow-queue";
        this.QE_FLOW_QUEUE_GRID_ID = "qe-flow-queue-grid";
        this.QE_FLOW_QUEUE_TAB_ID = "qe-flow-queue-tab";
        this.QE_DELETE_MULTIPLE_QUERY_QUEUE_CONTROL_ID = "qe-delete-multiple-query-queue-control";
        this.TITLE_VIEW_QUERY_RESULT = "View Query Result";
        this.TITLE_MODIFY_QUERY = "Modify Query";
        this.TITLE_VIEW_QUERY_ERROR = "View Query Error";
        this.TITLE_RERUN_QUERY = "Rerun Query";
        this.TITLE_DELETE_QUERY = "Delete Query";
        this.TITLE_QUERY_QUEUE = "Query Queue";
        this.TITLE_DELETE_ALL_QUERY_QUEUE = "Delete All Query Queue";

        this.QE_SELECT_STAT_TABLE = "Select Statistic Table";
        this.QE_STAT_QUERY_ID = "qe-stat-query";
        this.QE_STAT_QUERY_SECTION_ID = "qe-stat-query-section";
        this.QE_STAT_QUERY_TAB_ID = "qe-stat-query-tab";
        this.QE_STAT_QUERY_GRID_ID = "qe-stat-query-grid";
        this.QE_STAT_QUERY_CHART_ID = "qe-stat-query-chart";
        this.QE_STAT_QUERY_CHART_PAGE_ID = 'qe-stat-query-chart-page';
        this.QE_STAT_QUERY_LINE_CHART_ID = "qe-stat-query-line-chart";
        this.QE_STAT_QUERY_CHART_GRID_ID = "qe-stat-query-chart-grid";

        this.QE_OBJECT_LOGS_ID = "qe-object-logs";
        this.QE_OBJECT_LOGS_SECTION_ID = "qe-object-logs-section";
        this.QE_OBJECT_LOGS_TAB_ID = "qe-object-logs-tab";
        this.QE_OBJECT_LOGS_GRID_ID = "qe-object-logs-grid";
        this.QE_SELECT_OBJECT_TABLE = "Select Object Table";

        this.QE_SYSTEM_LOGS_ID = "qe-system-logs";
        this.QE_SYSTEM_LOGS_SECTION_ID = "qe-system-logs-section";
        this.QE_SYSTEM_LOGS_TAB_ID = "qe-system-logs-tab";
        this.QE_SYSTEM_LOGS_GRID_ID = "qe-system-logs-grid";

        this.QE_SESSION_ANALYZER_SUMMARY_SUFFIX_ID = "-sa-summary";
        this.QE_INGRESS_SUFFIX_ID = "-ingress";
        this.QE_EGRESS_SUFFIX_ID = "-egress";
        this.QE_REVERSE_INGRESS_SUFFIX_ID = "-reverse-ingress";
        this.QE_REVERSE_EGRESS_SUFFIX_ID = "-reverse-egress";

        this.TITLE_DETAILS = "Details";
        this.TITLE_OVERVIEW = "Overview";
        this.TITLE_ERROR = "Error";
        this.TITLE_QE_SELECT = "Select";
        this.TITLE_CHART = "Chart";
        this.TITLE_QE_WHERE = "Where";
        this.TITLE_QE_FILTER = "Filter";

        this.TITLE_QUERY = "Query";
        this.TITLE_QUERY_STATUS = "Query Status";
        this.TITLE_QUERY_PARAMETERS = "Query Parameters";
        this.TITLE_QUERY_STATISTICS = "Query Statistics";
        this.TITLE_RESULTS = "Results";
        this.TITLE_CHART = "Chart";
        this.TITLE_FLOW = "Flow";
        this.TITLE_LOG = "Log";
        this.TITLE_STATS = "Statistics";
        this.TITLE_FLOW_SERIES = "Flow Series";
        this.TITLE_FLOW_RECORD = "Flow Record";
        this.TITLE_SESSION_ANALYZER = "Session Analysis";
        this.TITLE_ACTION_SESSION_ANALYZER = "Analyze Session";
        this.TITLE_SESSION_ANALYZER_SUMMARY = "Session Summary";
        this.TITLE_SESSION_DETAILS = "Session Details";
        this.TITLE_FLOW_SERIES_RESULTS = "Flow Series Results";
        this.TITLE_STATS_QUERY = "Statistics Query";
        this.TITLE_OBJECT_LOGS = "Object Logs";
        this.TITLE_SYSTEM_LOGS = "System Logs";
        this.TITLE_CONSOLE_LOGS = "Console Logs";

        this.TITLE_INGRESS = "Ingress";
        this.TITLE_EGRESS = "Egress";
        this.TITLE_REVERSE_INGRESS = "Reverse Ingress";
        this.TITLE_REVERSE_EGRESS = "Reverse Egress";

        this.QE_SELECT_MODAL_SUFFIX = '-select-modal';
        this.QE_CHART_ID = 'qe-chart';
        this.QE_CHART_GRID_ID = 'qe-chart-grid';
        this.QE_CHART_PAGE_ID = 'qe-chart-page';
        this.QE_WHERE_MODAL_SUFFIX = '-where-modal';

        this.QE_RECORD_DETAILS_MODAL_SUFFIX = '-record-details-modal';

        this.QE_FILTER_MODAL_SUFFIX = '-filter-modal';

        //Alarms labels
        this.ALARM_PREFIX_ID = 'alarms';
        this.ALARMS_BREADCRUMB_DROPDOWN = "alarms-breadcrumb-dropdown";
        this.ALARMS_LIST_ID = 'alarms-list-view';
        this.MONITOR_ALARMS_PAGE_ID = "monitor-alarms-page";
        this.ALARMS_GRID_ID = "monitor-alarms-grid";
        this.TITLE_ALARMS = "Alarms Dashboard";
        this.TITLE_ALARMS_SUMMARY = "Alarms";
        this.MONITOR_ALARM_LIST_ID = "monitor-alarm-list";
        this.MONITOR_ALARM_LIST_VIEW_ID = "monitor-alarm-list-view";
        this.TITLE_ACKNOWLEDGE = 'Acknowledge';
        this.TITLE_ALARM_HISTORY = 'Alarm History';
        this.TITLE_ALARM_DETAILS = 'Alarm Details';

        this.DASHBOARD_LOGS_URL = '/api/admin/reports/query?where=&filters=&level=4' + '&fromTimeUTC=now-10m&toTimeUTC=now&table=MessageTable&limit=10';
        this.CACHE_DASHBORAD_LOGS = 'cache-dashboard-logs';
    };

    function capitalizeSentence(sentence) {
        var word = sentence.split(" ");
        for ( var i = 0; i < word.length; i++ ) {
            word[i] = word[i].charAt(0).toUpperCase() + word[i].slice(1);
        }
        return word.join(" ");
    };

    return CoreLabels;
});
/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-messages',[
    'underscore'
], function (_) {
    var CoreMessages = function () {
        this.getInvalidErrorMessage = function (fieldKey) {
            return "Please enter a valid " + cowl.getInLowerCase(fieldKey) + '.';
        };
        this.getShortInvalidErrorMessage = function (fieldKey) {
            return "Invalid " + cowl.getInLowerCase(fieldKey) + '.';
        };
        this.getRequiredMessage = function (fieldKey) {
            return cowl.getFirstCharUpperCase(fieldKey) + ' is required.';
        };
        this.getResolveErrorsMessage = function (fieldKey) {
            return "Please resolve all " + fieldKey + " errors.";
        };

        this.SHOULD_BE_VALID = '{0} should have valid ';
        this.FROM_TIME_SMALLER_THAN_TO_TIME = 'From Time should be before To Time';
        this.TO_TIME_GREATER_THAN_FROM_TIME = 'To Time should be later than From Time';

        this.get = function () {
            var args = arguments;
            return args[0].replace(/\{(\d+)\}/g, function (m, n) {
                n = parseInt(n) + 1;
                return args[n];
            });
        };

        this.DATA_FETCHING = "Fetching data..";
        this.DATA_ERROR = "Error in getting data.";
        this.DATA_SUCCESS_EMPTY = "No data available.";

        this.DATA_ERROR_REQUIRED = "Required";
        this.DATA_ERROR_INVALID = "Invalid";

        this.getRequestMessage = function(requestState) {
            if (requestState === cowc.DATA_REQUEST_STATE_FETCHING) {
                return cowm.DATA_FETCHING;
            } else if (requestState === cowc.DATA_REQUEST_STATE_ERROR) {
                return cowm.DATA_ERROR;
            } else if (requestState === cowc.DATA_REQUEST_STATE_SUCCESS_EMPTY) {
                return cowm.DATA_SUCCESS_EMPTY
            }
        };

        this.DEPRECATION_WARNING_PREFIX = "Contrail WebUI Warning: ";

        this.QE_MAX_QUERY_QUEUE_RESULT_VIEW_INFO = "Maximum 5 Query Results can be viewed. Please close the existing query results to view new queries from queue.";
        this.QE_QUERY_QUEUE_RESULT_ALREADY_LOADED = "Query Result for this query has already been loaded.";
        this.QE_DELETE_SINGLE_QUERY_CONFIRM = "Are you sure you want to remove this query?";
        this.QE_DELETE_MULTIPLE_QUERY_CONFIRM = "Are you sure you want to remove the selected queries?";
        this.getQueryQueuedMessage = function(queueURL, queueType) {
            return 'Your query has been queued. <a class="hyperlink" href="' + queueURL + '">View ' + queueType + ' Queue</a>';
        }

    };
    return CoreMessages;
});

/*
 * Copyright (c) 2015 Juniper Networks, Inc. All rights reserved.
 */

define('core-views-default-config',[
    'underscore'
], function (_,d3) {
    var CoreViewsDefaultConfig = function () {
        this.gridConfig = {
            header: {
                title: {
                    cssClass: 'blue',
                    icon: '',
                    iconCssClass: 'blue'
                },
                icon: false,
                defaultControls: {
                    collapseable: false,
                    exportable: true,
                    refreshable: true,
                    searchable: true,
                    columnPickable: false
                },
                customControls: false
            },
            columnHeader: {
                columns: {}
            },
            body: {
                options: {
                    actionCell: false,
                    autoHeight: true,
                    autoRefresh: false,
                    checkboxSelectable: true,
                    forceFitColumns: true,
                    detail: {
                        template: '<pre>{{{formatJSON2HTML this.data this.ignoreKeys}}}</pre>'
                    },
                    enableCellNavigation: true,
                    enableColumnReorder: false,
                    enableTextSelectionOnCells: true,
                    fullWidthRows: true,
                    multiColumnSort: true,
                    rowHeight: 30,
                    fixedRowHeight: false,
                    gridHeight: 500,
                    rowSelectable: false,
                    sortable: true,
                    lazyLoading: true,
                    defaultDataStatusMessage: true,
                    actionCellPosition: 'end', //actionCellPosition indicates position of the settings icon whether it should be on row start and end
                    multiRowSelection: true, //This property will enable/disable selecting multiple rows of the grid, but the checkbox in the header should be removed by the client because as of now, we don't have way in api to remove the checkbox in header
                    disableRowsOnLoading: false
                },
                dataSource: {
                    remote: null,
                    data: null,
                    events: {}
                },
                statusMessages: {
                    loading: {
                        type: 'status',
                        iconClasses: '',
                        text: 'Loading...'
                    },
                    empty: {
                        type: 'status',
                        iconClasses: '',
                        text: 'No data available.'
                    },
                    error: {
                        type: 'error',
                        iconClasses: 'icon-warning-sign',
                        text: 'Error in getting data.'
                    }
                }
            },
            footer: {
                pager: {
                    options: {
                        pageSize: 50,
                        pageSizeSelect: [10, 50, 100, 200]
                    }
                }
            }
        };

        this.lineWithFocusChartConfig = {
            margin: {top: 10, right: 30, bottom: 50, left: 65},
            margin2: {top: 0, right: 30, bottom: 40, left: 65},
            axisLabelDistance: 5,
                height: 300,
            yAxisLabel: 'Traffic',
            y2AxisLabel: '',
            forceY: [0, 60],
            defaultDataStatusMessage: true,
            statusMessageHandler: cowm.getRequestMessage,
            yFormatter: function(d) { return cowu.addUnits2Bytes(d, false, false, 1, 60); },
            y2Formatter: function(d) { return cowu.addUnits2Bytes(d, false, false, 1, 60); }
        };

        this.lineBarWithFocusChartConfig = {
            margin: {top: 20, right: 70, bottom: 50, left: 70},
            margin2: {top: 0, right: 70, bottom: 40, left: 70},
            height: 300,
            axisLabelDistance: 5,
            y1AxisLabel: 'CPU Utilization (%)',
            y2AxisLabel: 'Memory Usage',
            forceY1: [0, 5],
            forceY2: [0, 5],
            defaultDataStatusMessage: true,
            statusMessageHandler: cowm.getRequestMessage,
            y2Formatter: function (y2Value) {
                var formattedValue = formatBytes(y2Value * 1024, true);
                return formattedValue;
            },
            // y1Formatter: d3.format(".01f"),
            y1Formatter: function(number) {
                number.toFixed(1);
            },
            showLegend: true
        };
    };

    return CoreViewsDefaultConfig;
});

/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */


var FEATURE_PCK_WEB_CONTROLLER = "webController",
    FEATURE_PCK_WEB_STORAGE = "webStorage",
    FEATURE_PCK_WEB_SERVER_MANAGER = "serverManager";
// globalObj = {'env':""},

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
        'knockout'                    : coreWebDir + '/assets/knockout/knockout-3.0.0',
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

var coreAppMap = {
        '*': {
            'underscore': 'underscore'
        }
};

var coreAppShim =  {
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
            deps: ['jquery']
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
        }
};


function initBackboneValidation() {
    _.extend(kbValidation.callbacks, {
        valid: function (view, attr, selector) {
            /*
             var $el = $(view.modalElementId).find('[name=' + attr + ']'),
             $group = $el.closest('.form-element');

             $group.removeClass('has-error');
             $group.find('.help-block').html('').addClass('hidden');
             */
        },
        invalid: function (view, attr, error, selector, validation) {
            var model = view.model;
            model.validateAttr(attr, validation);
            /*
             var $el = $(view.modalElementId).find('[name=' + attr + ']'),
             $group = $el.closest('.form-element');
             $group.addClass('has-error');
             $group.find('.help-block').html(error).removeClass('hidden');
             */
        }
    });
};

function initCustomKOBindings(Knockout) {
    Knockout.bindingHandlers.contrailDropdown = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var elementConfig = {}, dropdown;

            if(contrail.checkIfExist(bindingContext) && contrail.checkIfExist(bindingContext.$root)){
                var elementConfigMap = bindingContext.$root.elementConfigMap(),
                    elementName = $(element).attr("name");

                elementConfig = elementConfigMap[elementName];
            }

            dropdown = $(element).contrailDropdown(elementConfig).data('contrailDropdown');
            Knockout.utils.domNodeDisposal.addDisposeCallback(element, function () {
                dropdown.destroy();
            });
        },
        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var elementConfig = {},
                dropdown = $(element).data('contrailDropdown');

            if(contrail.checkIfExist(bindingContext) && contrail.checkIfExist(bindingContext.$root)){
                var elementConfigMap = bindingContext.$root.elementConfigMap(),
                    elementName = $(element).attr("name");

                elementConfig = elementConfigMap[elementName];
            }

            if (!contrail.checkIfExist(elementConfig.data) && !contrail.checkIfExist(elementConfig.dataSource) && allBindingsAccessor.get('optionList')) {
                var valueBindingAccessor = allBindingsAccessor.get('value'),
                    value = Knockout.utils.unwrapObservable(valueBindingAccessor),
                    optionListBindingAccessor = allBindingsAccessor.get('optionList'),
                    optionList = Knockout.utils.unwrapObservable(optionListBindingAccessor);

                value = contrail.checkIfFunction(value) ? value() : value;

                if (contrail.checkIfFunction(optionList) && $.isArray(optionList(viewModel))) {
                    dropdown.setData(optionList(viewModel), value, true);
                } else if ($.isArray(optionList)) {
                    dropdown.setData(optionList, value, true);
                }
            }

            if (allBindingsAccessor.get('value')) {
                var valueBindingAccessor = allBindingsAccessor.get('value'),
                    value = Knockout.utils.unwrapObservable(valueBindingAccessor);

                value = contrail.checkIfFunction(value) ? value() : value;
                //required for hierarchical dropdown
                if(elementConfig.queryMap) {
                    var data = dropdown.getAllData();
                    if(!contrail.isItemExists(value, data)) {
                        contrail.appendNewItemMainDataSource(value, data);
                    }
                }
                if (contrail.checkIfExist(value) && value !== '') {
                    dropdown.value(value, true);
                }
            }
        }
    };

    Knockout.bindingHandlers.contrailMultiselect = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var elementConfig = {}, multiselect;

            if (contrail.checkIfExist(bindingContext) && contrail.checkIfExist(bindingContext.$root)) {
                var elementConfigMap = bindingContext.$root.elementConfigMap(),
                    elementName = $(element).attr("name");

                elementConfig = elementConfigMap[elementName];
            }

            multiselect = $(element).contrailMultiselect(elementConfig).data('contrailMultiselect');

            Knockout.utils.domNodeDisposal.addDisposeCallback(element, function () {
                multiselect.destroy();
            });
        },
        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var elementConfig = {}, multiselect = $(element).data('contrailMultiselect');

            if(contrail.checkIfExist(bindingContext) && contrail.checkIfExist(bindingContext.$root)){
                var elementConfigMap = bindingContext.$root.elementConfigMap(),
                    elementName = $(element).attr("name");

                elementConfig = elementConfigMap[elementName];
            }

            if (!contrail.checkIfExist(elementConfig.data) && !contrail.checkIfExist(elementConfig.dataSource) && allBindingsAccessor.get('optionList')) {
                var valueBindingAccessor = allBindingsAccessor.get('value'),
                    value = Knockout.utils.unwrapObservable(valueBindingAccessor),
                    optionListBindingAccessor = allBindingsAccessor.get('optionList'),
                    optionList = Knockout.utils.unwrapObservable(optionListBindingAccessor);

                if (contrail.checkIfFunction(optionList)) {
                    optionList = optionList(viewModel);
                }

                var formattedOptionList = formatData(optionList, elementConfig),
                    currentOptionList = multiselect.getAllData();

               if (JSON.stringify(formattedOptionList) !== JSON.stringify(currentOptionList)) {
                    value = contrail.checkIfFunction(value) ? value() : value;
                    if (value !== '') {
                        value = $.isArray(value) ? value : [value];
                    } else if (value === '') {
                        value = [];
                    }

                   multiselect.setData(optionList, value, true);
                }
            }

            if (allBindingsAccessor.get('value')) {
                var valueBindingAccessor = allBindingsAccessor.get('value'),
                    value = Knockout.utils.unwrapObservable(valueBindingAccessor);

                value = contrail.checkIfFunction(value) ? value() : value;

                if (contrail.checkIfExist(value)) {
                    if (value !== '') {
                        value = $.isArray(value) ? value : [value];
                        multiselect.value(value, true);
                    } else if (value === '') {
                        multiselect.value([], true);
                    }
                }
            }
        }
    };

    Knockout.bindingHandlers.contrailCombobox = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var elementConfig = {}, combobox;

            if(contrail.checkIfExist(bindingContext) && contrail.checkIfExist(bindingContext.$root)){
                var elementConfigMap = bindingContext.$root.elementConfigMap(),
                    elementName = $(element).attr("name");

                elementConfig = elementConfigMap[elementName];
            }

            combobox = $(element).contrailCombobox(elementConfig).data('contrailCombobox');

            Knockout.utils.domNodeDisposal.addDisposeCallback(element, function () {
                combobox.destroy();
            });
        },
        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var elementConfig = {}, combobox = $(element).data('contrailCombobox');

            if(contrail.checkIfExist(bindingContext) && contrail.checkIfExist(bindingContext.$root)){
                var elementConfigMap = bindingContext.$root.elementConfigMap(),
                    elementName = $(element).attr("name");

                elementConfig = elementConfigMap[elementName];
            }

            if (!contrail.checkIfExist(elementConfig.data) && !contrail.checkIfExist(elementConfig.dataSource) && allBindingsAccessor.get('optionList')) {
                var optionListBindingAccessor = allBindingsAccessor.get('optionList'),
                    optionList = Knockout.utils.unwrapObservable(optionListBindingAccessor);
                if (contrail.checkIfFunction(optionList) && $.isArray(optionList(viewModel))) {
                    combobox.setData(optionList(viewModel));
                } else if ($.isArray(optionList)) {
                    combobox.setData(optionList);
                }
            }

            if (allBindingsAccessor.get('value')) {
                var valueBindingAccessor = allBindingsAccessor.get('value'),
                    value = Knockout.utils.unwrapObservable(valueBindingAccessor);

                value = contrail.checkIfFunction(value) ? value() : value;

                if (contrail.checkIfExist(value) && value !== '') {
                    combobox.value(value);
                }
            }

            if (allBindingsAccessor.get('disable')) {
                var valueBindingAccessor = allBindingsAccessor.get('disable'),
                    disable = Knockout.utils.unwrapObservable(valueBindingAccessor);

                disable = contrail.checkIfFunction(disable) ? disable() : disable;

                if (contrail.checkIfExist(disable) && disable !== '') {
                    combobox.enable(!disable)
                }

            }
        }
    };

    Knockout.bindingHandlers.select2 = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            Knockout.utils.domNodeDisposal.addDisposeCallback(element, function () {
                $(element).select2('destroy');
            });

            var valueObj = Knockout.toJS(valueAccessor()) || {},
                allBindings = allBindingsAccessor(),
                lookupKey = allBindings.lookupKey;

            $(element).select2(valueObj);

            if (allBindings.value) {
                var value = Knockout.utils.unwrapObservable(allBindings.value);
                if (typeof value === 'function') {
                    $(element).select2('val', value());
                } else if (value && value != '') {
                    $(element).select2('val', value);
                }
            }
        },
        update: function (element, valueAccessor, allBindings, viewModel, bindingContext) {
            $(element).trigger('change');
        }
    };

    Knockout.bindingHandlers.contrailDateTimePicker = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var valueObj = Knockout.toJS(valueAccessor()) || {},
                allBindings = allBindingsAccessor(),
                elementConfig = {};

            if(contrail.checkIfExist(bindingContext) && contrail.checkIfExist(bindingContext.$root)){
                var elementConfigMap = bindingContext.$root.elementConfigMap(),
                    elementName = $(element).attr("name");

                elementConfig = elementConfigMap[elementName];
            }

            var dateTimePicker = $(element).contrailDateTimePicker(elementConfig).data('contrailDateTimePicker');

            Knockout.utils.domNodeDisposal.addDisposeCallback(element, function () {
                dateTimePicker.destroy();
            });
        },
        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var dateTimePicker = $(element).data('contrailDateTimePicker');

            if (allBindingsAccessor.get('value')) {
                var valueBindingAccessor = allBindingsAccessor.get('value'),
                    value = Knockout.utils.unwrapObservable(valueBindingAccessor);

                value = contrail.checkIfFunction(value) ? value() : value;
                dateTimePicker.value(value);
            }
            else {
                dateTimePicker.value('');
            }
        }
    };

    Knockout.bindingHandlers.contrailNumericTextbox = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var elementConfig = {}, numericTextbox;

            if(contrail.checkIfExist(bindingContext) && contrail.checkIfExist(bindingContext.$root)){
                var elementConfigMap = bindingContext.$root.elementConfigMap(),
                    elementName = $(element).attr("name");

                elementConfig = elementConfigMap[elementName];
            }

            numericTextbox = $(element).contrailNumericTextbox(elementConfig).data('contrailNumericTextbox');

            Knockout.utils.domNodeDisposal.addDisposeCallback(element, function () {
                numericTextbox.destroy();
            });
        },
        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var numericTextbox = $(element).data('contrailNumericTextbox');

            if (allBindingsAccessor.get('value')) {
                var valueBindingAccessor = allBindingsAccessor.get('value'),
                    value = Knockout.utils.unwrapObservable(valueBindingAccessor);

                if (contrail.checkIfFunction(value)) {
                    numericTextbox.value(value());
                } else {
                    numericTextbox.value(value);
                }
            }
            else {
                numericTextbox.value('');
            }
        }
    };

    Knockout.bindingHandlers.contrailAutoComplete = {
            init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var elementConfig = {}, autocompleteTextBox;

                if(contrail.checkIfExist(bindingContext) && contrail.checkIfExist(bindingContext.$root)){
                    var elementConfigMap = bindingContext.$root.elementConfigMap(),
                        elementName = $(element).attr("name");

                    elementConfig = elementConfigMap[elementName];
                }

                autocompleteTextBox = $(element).contrailAutoComplete(elementConfig).data('contrailAutoComplete');

                Knockout.utils.domNodeDisposal.addDisposeCallback(element, function () {
                    autocompleteTextBox.destroy();
                });
            },
            update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var autocompleteTextBox = $(element).data('contrailAutoComplete');

                if (allBindingsAccessor.get('value')) {
                    var valueBindingAccessor = allBindingsAccessor.get('value'),
                        value = Knockout.utils.unwrapObservable(valueBindingAccessor);

                    if (contrail.checkIfFunction(value)) {
                        autocompleteTextBox.value(value());
                    } else {
                        autocompleteTextBox.value(value);
                    }
                }
                else {
                    autocompleteTextBox.value('');
                }
            }
        };

    var updateSelect2 = function (element) {
        var el = $(element);
        if (el.data('select2')) {
            el.trigger('change');
        }
    }
    var updateSelect2Options = Knockout.bindingHandlers['options']['update'];

    Knockout.bindingHandlers['options']['update'] = function (element) {
        var r = updateSelect2Options.apply(null, arguments);
        updateSelect2(element);
        return r;
    };

    var updateSelect2SelectedOptions = Knockout.bindingHandlers['selectedOptions']['update'];

    Knockout.bindingHandlers['selectedOptions']['update'] = function (element) {
        var r = updateSelect2SelectedOptions.apply(null, arguments);
        updateSelect2(element);
        return r;
    };
};

function initDomEvents() {
    $(document)
        .off('click', '.group-detail-advanced-action-item')
        .on('click', '.group-detail-advanced-action-item', function (event) {
            if (!$(this).hasClass('selected')) {
                var thisParent = $(this).parents('.group-detail-container'),
                    newSelectedView = $(this).data('view');

                thisParent.find('.group-detail-item').hide();
                thisParent.find('.group-detail-' + newSelectedView).show();

                thisParent.find('.group-detail-advanced-action-item').removeClass('selected');
                $(this).addClass('selected');

                if (contrail.checkIfExist($(this).parents('.slick-row-detail').data('cgrid'))) {
                    $(this).parents('.contrail-grid').data('contrailGrid').adjustDetailRowHeight($(this).parents('.slick-row-detail').data('cgrid'));
                }
            }
        });

    $(document)
        .off('click', '.input-type-toggle-action')
        .on('click', '.input-type-toggle-action', function (event) {
            var input = $(this).parent().find('input');
            if (input.prop('type') == 'text') {
                input.prop('type', 'password');
                $(this).removeClass('blue');
            } else {
                input.prop('type', 'text');
                $(this).addClass('blue');
            }
        });
};

// if (typeof exports !== 'undefined' && module.exports) {
//     exports = module.exports;
//     exports.getCoreAppPaths = getCoreAppPaths;
//     exports.coreAppMap = coreAppMap;
//     exports.coreAppShim = coreAppShim;
// }
;
define("core.app.utils", function(){});

/*
 * Copyright (c) 2015 Juniper Networks, Inc. All rights reserved.
 */

define('cf-datasource',[], function() {
    /*
    * Methods to set and update the cross filters which are linked to the single datasource
    */

    var CFDataSource = function() {
        var self = this;
        var cf = null,recordCnt = 0,
            dimensions={},
            filters={},
            filterValues = {};
            callBacks=$.Callbacks("unique"),
            callBackFns={}

        self.updateData = function(data) {
            if(cf == null) {
                cf = crossfilter(data);
            } else {
                for (var currDim in filters) {
                    dimensions[currDim].filter(null);
                }
                cf.remove();
                //Re-apply the filters
                for (var currDim in filters) {
                    dimensions[currDim].filter(filters[currDim]);
                }
                cf.add(data);
            }
            recordCnt = data.length;
        }

        self.getRecordCnt = function() {
            return recordCnt;
        }

        self.getFilteredRecordCnt = function() {
            return self.getFilteredData().length;
        }

        this.addDimension =  function(dimensionName,dimFn) {
            var dimension;
            //Add dimension only if it doesn't exist
            if(cf != null) {
                if(self.getDimension(dimensionName) == null) {
                    if(dimFn == null) {
                        dimFn = function(d) {
                            return d[dimensionName];
                        }
                    }
                    dimension = cf.dimension(dimFn);
                    dimensions[dimensionName] = dimension;
                }
                filters[dimensionName] = null;
            }
            return dimension;
        }

        this.getDimension = function(dimensionName){
            return dimensions[dimensionName];
        }

        this.getFilter = function(dimensionName) {
            return filters[dimensionName];
        }

        this.getFilterValues = function(dimensionName) {
            return filterValues[dimensionName];
        }

        this.applyFilter = function(dimensionName,criteria,filterRange) {
            if(dimensions[dimensionName] != null) {
                var dimension = dimensions[dimensionName];
                if(criteria == null) {
                    this.removeFilter(dimensionName);
                } else {
                    dimension.filter(criteria);
                    filters[dimensionName] = criteria;
                    filterValues[dimensionName] = filterRange;
                }
                var filteredData = dimension.top(Infinity);
                return filteredData;
            }
        }

        this.removeFilter = function(dimensionName) {
            if(dimensions[dimensionName] != null) {
                var dimension = dimensions[dimensionName];
                dimension.filterAll();
                var currFilter = filters[dimensionName];
                filters[dimensionName] = null;
                filterValues[dimensionName] = null;
                return currFilter;
            }
        }

        this.getFilteredData = function() {
            if(cf != null ) {
                var thirdDimension = cf.dimension(function(d) { return d['x']; });
                var t = thirdDimension.top(Infinity);
                thirdDimension.remove();
                //cfObj.callBacks.fire(t);
                return t;
            }
            return [];
        }

        this.addCallBack = function(callBackName,callBackFn) {
            //Remove existing callback for the same name
            callBacks.remove(callBackFns[callBackName]);
            callBacks.add(callBackFn);
            callBackFns[callBackName] = callBackFn;
        }

        this.removeCallBack = function(cfName,callBackName){
            var callBackFn = this.getCallBackFn(cfName,callBackName);
            var callBacks = this.getCallBacks(cfName);

            callBacks.remove(callBackFns['callBackName']);
            delete callBackFns[callBackName];
        }

        this.fireCallBacks = function(options) {
            var ret = {};
            if(callBacks != null) {
                var data = this.getFilteredData();
                ret['data'] = data;
                ret['cfg'] = {};
                if(options != null && options.source != null){
                    ret['cfg']['source'] = options.source;
                }
                callBacks.fire(ret);
            }
        }
    }
    return CFDataSource;
});

(function(t,e){if(typeof define==="function"&&define.amd){define('backbone',["underscore","jquery","exports"],function(i,r,s){t.Backbone=e(t,s,i,r)})}else if(typeof exports!=="undefined"){var i=require("underscore");e(t,exports,i)}else{t.Backbone=e(t,{},t._,t.jQuery||t.Zepto||t.ender||t.$)}})(this,function(t,e,i,r){var s=t.Backbone;var n=[];var a=n.push;var o=n.slice;var h=n.splice;e.VERSION="1.1.2";e.$=r;e.noConflict=function(){t.Backbone=s;return this};e.emulateHTTP=false;e.emulateJSON=false;var u=e.Events={on:function(t,e,i){if(!c(this,"on",t,[e,i])||!e)return this;this._events||(this._events={});var r=this._events[t]||(this._events[t]=[]);r.push({callback:e,context:i,ctx:i||this});return this},once:function(t,e,r){if(!c(this,"once",t,[e,r])||!e)return this;var s=this;var n=i.once(function(){s.off(t,n);e.apply(this,arguments)});n._callback=e;return this.on(t,n,r)},off:function(t,e,r){var s,n,a,o,h,u,l,f;if(!this._events||!c(this,"off",t,[e,r]))return this;if(!t&&!e&&!r){this._events=void 0;return this}o=t?[t]:i.keys(this._events);for(h=0,u=o.length;h<u;h++){t=o[h];if(a=this._events[t]){this._events[t]=s=[];if(e||r){for(l=0,f=a.length;l<f;l++){n=a[l];if(e&&e!==n.callback&&e!==n.callback._callback||r&&r!==n.context){s.push(n)}}}if(!s.length)delete this._events[t]}}return this},trigger:function(t){if(!this._events)return this;var e=o.call(arguments,1);if(!c(this,"trigger",t,e))return this;var i=this._events[t];var r=this._events.all;if(i)f(i,e);if(r)f(r,arguments);return this},stopListening:function(t,e,r){var s=this._listeningTo;if(!s)return this;var n=!e&&!r;if(!r&&typeof e==="object")r=this;if(t)(s={})[t._listenId]=t;for(var a in s){t=s[a];t.off(e,r,this);if(n||i.isEmpty(t._events))delete this._listeningTo[a]}return this}};var l=/\s+/;var c=function(t,e,i,r){if(!i)return true;if(typeof i==="object"){for(var s in i){t[e].apply(t,[s,i[s]].concat(r))}return false}if(l.test(i)){var n=i.split(l);for(var a=0,o=n.length;a<o;a++){t[e].apply(t,[n[a]].concat(r))}return false}return true};var f=function(t,e){var i,r=-1,s=t.length,n=e[0],a=e[1],o=e[2];switch(e.length){case 0:while(++r<s)(i=t[r]).callback.call(i.ctx);return;case 1:while(++r<s)(i=t[r]).callback.call(i.ctx,n);return;case 2:while(++r<s)(i=t[r]).callback.call(i.ctx,n,a);return;case 3:while(++r<s)(i=t[r]).callback.call(i.ctx,n,a,o);return;default:while(++r<s)(i=t[r]).callback.apply(i.ctx,e);return}};var d={listenTo:"on",listenToOnce:"once"};i.each(d,function(t,e){u[e]=function(e,r,s){var n=this._listeningTo||(this._listeningTo={});var a=e._listenId||(e._listenId=i.uniqueId("l"));n[a]=e;if(!s&&typeof r==="object")s=this;e[t](r,s,this);return this}});u.bind=u.on;u.unbind=u.off;i.extend(e,u);var p=e.Model=function(t,e){var r=t||{};e||(e={});this.cid=i.uniqueId("c");this.attributes={};if(e.collection)this.collection=e.collection;if(e.parse)r=this.parse(r,e)||{};r=i.defaults({},r,i.result(this,"defaults"));this.set(r,e);this.changed={};this.initialize.apply(this,arguments)};i.extend(p.prototype,u,{changed:null,validationError:null,idAttribute:"id",initialize:function(){},toJSON:function(t){return i.clone(this.attributes)},sync:function(){return e.sync.apply(this,arguments)},get:function(t){return this.attributes[t]},escape:function(t){return i.escape(this.get(t))},has:function(t){return this.get(t)!=null},set:function(t,e,r){var s,n,a,o,h,u,l,c;if(t==null)return this;if(typeof t==="object"){n=t;r=e}else{(n={})[t]=e}r||(r={});if(!this._validate(n,r))return false;a=r.unset;h=r.silent;o=[];u=this._changing;this._changing=true;if(!u){this._previousAttributes=i.clone(this.attributes);this.changed={}}c=this.attributes,l=this._previousAttributes;if(this.idAttribute in n)this.id=n[this.idAttribute];for(s in n){e=n[s];if(!i.isEqual(c[s],e))o.push(s);if(!i.isEqual(l[s],e)){this.changed[s]=e}else{delete this.changed[s]}a?delete c[s]:c[s]=e}if(!h){if(o.length)this._pending=r;for(var f=0,d=o.length;f<d;f++){this.trigger("change:"+o[f],this,c[o[f]],r)}}if(u)return this;if(!h){while(this._pending){r=this._pending;this._pending=false;this.trigger("change",this,r)}}this._pending=false;this._changing=false;return this},unset:function(t,e){return this.set(t,void 0,i.extend({},e,{unset:true}))},clear:function(t){var e={};for(var r in this.attributes)e[r]=void 0;return this.set(e,i.extend({},t,{unset:true}))},hasChanged:function(t){if(t==null)return!i.isEmpty(this.changed);return i.has(this.changed,t)},changedAttributes:function(t){if(!t)return this.hasChanged()?i.clone(this.changed):false;var e,r=false;var s=this._changing?this._previousAttributes:this.attributes;for(var n in t){if(i.isEqual(s[n],e=t[n]))continue;(r||(r={}))[n]=e}return r},previous:function(t){if(t==null||!this._previousAttributes)return null;return this._previousAttributes[t]},previousAttributes:function(){return i.clone(this._previousAttributes)},fetch:function(t){t=t?i.clone(t):{};if(t.parse===void 0)t.parse=true;var e=this;var r=t.success;t.success=function(i){if(!e.set(e.parse(i,t),t))return false;if(r)r(e,i,t);e.trigger("sync",e,i,t)};q(this,t);return this.sync("read",this,t)},save:function(t,e,r){var s,n,a,o=this.attributes;if(t==null||typeof t==="object"){s=t;r=e}else{(s={})[t]=e}r=i.extend({validate:true},r);if(s&&!r.wait){if(!this.set(s,r))return false}else{if(!this._validate(s,r))return false}if(s&&r.wait){this.attributes=i.extend({},o,s)}if(r.parse===void 0)r.parse=true;var h=this;var u=r.success;r.success=function(t){h.attributes=o;var e=h.parse(t,r);if(r.wait)e=i.extend(s||{},e);if(i.isObject(e)&&!h.set(e,r)){return false}if(u)u(h,t,r);h.trigger("sync",h,t,r)};q(this,r);n=this.isNew()?"create":r.patch?"patch":"update";if(n==="patch")r.attrs=s;a=this.sync(n,this,r);if(s&&r.wait)this.attributes=o;return a},destroy:function(t){t=t?i.clone(t):{};var e=this;var r=t.success;var s=function(){e.trigger("destroy",e,e.collection,t)};t.success=function(i){if(t.wait||e.isNew())s();if(r)r(e,i,t);if(!e.isNew())e.trigger("sync",e,i,t)};if(this.isNew()){t.success();return false}q(this,t);var n=this.sync("delete",this,t);if(!t.wait)s();return n},url:function(){var t=i.result(this,"urlRoot")||i.result(this.collection,"url")||M();if(this.isNew())return t;return t.replace(/([^\/])$/,"$1/")+encodeURIComponent(this.id)},parse:function(t,e){return t},clone:function(){return new this.constructor(this.attributes)},isNew:function(){return!this.has(this.idAttribute)},isValid:function(t){return this._validate({},i.extend(t||{},{validate:true}))},_validate:function(t,e){if(!e.validate||!this.validate)return true;t=i.extend({},this.attributes,t);var r=this.validationError=this.validate(t,e)||null;if(!r)return true;this.trigger("invalid",this,r,i.extend(e,{validationError:r}));return false}});var v=["keys","values","pairs","invert","pick","omit"];i.each(v,function(t){p.prototype[t]=function(){var e=o.call(arguments);e.unshift(this.attributes);return i[t].apply(i,e)}});var g=e.Collection=function(t,e){e||(e={});if(e.model)this.model=e.model;if(e.comparator!==void 0)this.comparator=e.comparator;this._reset();this.initialize.apply(this,arguments);if(t)this.reset(t,i.extend({silent:true},e))};var m={add:true,remove:true,merge:true};var y={add:true,remove:false};i.extend(g.prototype,u,{model:p,initialize:function(){},toJSON:function(t){return this.map(function(e){return e.toJSON(t)})},sync:function(){return e.sync.apply(this,arguments)},add:function(t,e){return this.set(t,i.extend({merge:false},e,y))},remove:function(t,e){var r=!i.isArray(t);t=r?[t]:i.clone(t);e||(e={});var s,n,a,o;for(s=0,n=t.length;s<n;s++){o=t[s]=this.get(t[s]);if(!o)continue;delete this._byId[o.id];delete this._byId[o.cid];a=this.indexOf(o);this.models.splice(a,1);this.length--;if(!e.silent){e.index=a;o.trigger("remove",o,this,e)}this._removeReference(o,e)}return r?t[0]:t},set:function(t,e){e=i.defaults({},e,m);if(e.parse)t=this.parse(t,e);var r=!i.isArray(t);t=r?t?[t]:[]:i.clone(t);var s,n,a,o,h,u,l;var c=e.at;var f=this.model;var d=this.comparator&&c==null&&e.sort!==false;var v=i.isString(this.comparator)?this.comparator:null;var g=[],y=[],_={};var b=e.add,w=e.merge,x=e.remove;var E=!d&&b&&x?[]:false;for(s=0,n=t.length;s<n;s++){h=t[s]||{};if(h instanceof p){a=o=h}else{a=h[f.prototype.idAttribute||"id"]}if(u=this.get(a)){if(x)_[u.cid]=true;if(w){h=h===o?o.attributes:h;if(e.parse)h=u.parse(h,e);u.set(h,e);if(d&&!l&&u.hasChanged(v))l=true}t[s]=u}else if(b){o=t[s]=this._prepareModel(h,e);if(!o)continue;g.push(o);this._addReference(o,e)}o=u||o;if(E&&(o.isNew()||!_[o.id]))E.push(o);_[o.id]=true}if(x){for(s=0,n=this.length;s<n;++s){if(!_[(o=this.models[s]).cid])y.push(o)}if(y.length)this.remove(y,e)}if(g.length||E&&E.length){if(d)l=true;this.length+=g.length;if(c!=null){for(s=0,n=g.length;s<n;s++){this.models.splice(c+s,0,g[s])}}else{if(E)this.models.length=0;var k=E||g;for(s=0,n=k.length;s<n;s++){this.models.push(k[s])}}}if(l)this.sort({silent:true});if(!e.silent){for(s=0,n=g.length;s<n;s++){(o=g[s]).trigger("add",o,this,e)}if(l||E&&E.length)this.trigger("sort",this,e)}return r?t[0]:t},reset:function(t,e){e||(e={});for(var r=0,s=this.models.length;r<s;r++){this._removeReference(this.models[r],e)}e.previousModels=this.models;this._reset();t=this.add(t,i.extend({silent:true},e));if(!e.silent)this.trigger("reset",this,e);return t},push:function(t,e){return this.add(t,i.extend({at:this.length},e))},pop:function(t){var e=this.at(this.length-1);this.remove(e,t);return e},unshift:function(t,e){return this.add(t,i.extend({at:0},e))},shift:function(t){var e=this.at(0);this.remove(e,t);return e},slice:function(){return o.apply(this.models,arguments)},get:function(t){if(t==null)return void 0;return this._byId[t]||this._byId[t.id]||this._byId[t.cid]},at:function(t){return this.models[t]},where:function(t,e){if(i.isEmpty(t))return e?void 0:[];return this[e?"find":"filter"](function(e){for(var i in t){if(t[i]!==e.get(i))return false}return true})},findWhere:function(t){return this.where(t,true)},sort:function(t){if(!this.comparator)throw new Error("Cannot sort a set without a comparator");t||(t={});if(i.isString(this.comparator)||this.comparator.length===1){this.models=this.sortBy(this.comparator,this)}else{this.models.sort(i.bind(this.comparator,this))}if(!t.silent)this.trigger("sort",this,t);return this},pluck:function(t){return i.invoke(this.models,"get",t)},fetch:function(t){t=t?i.clone(t):{};if(t.parse===void 0)t.parse=true;var e=t.success;var r=this;t.success=function(i){var s=t.reset?"reset":"set";r[s](i,t);if(e)e(r,i,t);r.trigger("sync",r,i,t)};q(this,t);return this.sync("read",this,t)},create:function(t,e){e=e?i.clone(e):{};if(!(t=this._prepareModel(t,e)))return false;if(!e.wait)this.add(t,e);var r=this;var s=e.success;e.success=function(t,i){if(e.wait)r.add(t,e);if(s)s(t,i,e)};t.save(null,e);return t},parse:function(t,e){return t},clone:function(){return new this.constructor(this.models)},_reset:function(){this.length=0;this.models=[];this._byId={}},_prepareModel:function(t,e){if(t instanceof p)return t;e=e?i.clone(e):{};e.collection=this;var r=new this.model(t,e);if(!r.validationError)return r;this.trigger("invalid",this,r.validationError,e);return false},_addReference:function(t,e){this._byId[t.cid]=t;if(t.id!=null)this._byId[t.id]=t;if(!t.collection)t.collection=this;t.on("all",this._onModelEvent,this)},_removeReference:function(t,e){if(this===t.collection)delete t.collection;t.off("all",this._onModelEvent,this)},_onModelEvent:function(t,e,i,r){if((t==="add"||t==="remove")&&i!==this)return;if(t==="destroy")this.remove(e,r);if(e&&t==="change:"+e.idAttribute){delete this._byId[e.previous(e.idAttribute)];if(e.id!=null)this._byId[e.id]=e}this.trigger.apply(this,arguments)}});var _=["forEach","each","map","collect","reduce","foldl","inject","reduceRight","foldr","find","detect","filter","select","reject","every","all","some","any","include","contains","invoke","max","min","toArray","size","first","head","take","initial","rest","tail","drop","last","without","difference","indexOf","shuffle","lastIndexOf","isEmpty","chain","sample"];i.each(_,function(t){g.prototype[t]=function(){var e=o.call(arguments);e.unshift(this.models);return i[t].apply(i,e)}});var b=["groupBy","countBy","sortBy","indexBy"];i.each(b,function(t){g.prototype[t]=function(e,r){var s=i.isFunction(e)?e:function(t){return t.get(e)};return i[t](this.models,s,r)}});var w=e.View=function(t){this.cid=i.uniqueId("view");t||(t={});i.extend(this,i.pick(t,E));this._ensureElement();this.initialize.apply(this,arguments);this.delegateEvents()};var x=/^(\S+)\s*(.*)$/;var E=["model","collection","el","id","attributes","className","tagName","events"];i.extend(w.prototype,u,{tagName:"div",$:function(t){return this.$el.find(t)},initialize:function(){},render:function(){return this},remove:function(){this.$el.remove();this.stopListening();return this},setElement:function(t,i){if(this.$el)this.undelegateEvents();this.$el=t instanceof e.$?t:e.$(t);this.el=this.$el[0];if(i!==false)this.delegateEvents();return this},delegateEvents:function(t){if(!(t||(t=i.result(this,"events"))))return this;this.undelegateEvents();for(var e in t){var r=t[e];if(!i.isFunction(r))r=this[t[e]];if(!r)continue;var s=e.match(x);var n=s[1],a=s[2];r=i.bind(r,this);n+=".delegateEvents"+this.cid;if(a===""){this.$el.on(n,r)}else{this.$el.on(n,a,r)}}return this},undelegateEvents:function(){this.$el.off(".delegateEvents"+this.cid);return this},_ensureElement:function(){if(!this.el){var t=i.extend({},i.result(this,"attributes"));if(this.id)t.id=i.result(this,"id");if(this.className)t["class"]=i.result(this,"className");var r=e.$("<"+i.result(this,"tagName")+">").attr(t);this.setElement(r,false)}else{this.setElement(i.result(this,"el"),false)}}});e.sync=function(t,r,s){var n=T[t];i.defaults(s||(s={}),{emulateHTTP:e.emulateHTTP,emulateJSON:e.emulateJSON});var a={type:n,dataType:"json"};if(!s.url){a.url=i.result(r,"url")||M()}if(s.data==null&&r&&(t==="create"||t==="update"||t==="patch")){a.contentType="application/json";a.data=JSON.stringify(s.attrs||r.toJSON(s))}if(s.emulateJSON){a.contentType="application/x-www-form-urlencoded";a.data=a.data?{model:a.data}:{}}if(s.emulateHTTP&&(n==="PUT"||n==="DELETE"||n==="PATCH")){a.type="POST";if(s.emulateJSON)a.data._method=n;var o=s.beforeSend;s.beforeSend=function(t){t.setRequestHeader("X-HTTP-Method-Override",n);if(o)return o.apply(this,arguments)}}if(a.type!=="GET"&&!s.emulateJSON){a.processData=false}if(a.type==="PATCH"&&k){a.xhr=function(){return new ActiveXObject("Microsoft.XMLHTTP")}}var h=s.xhr=e.ajax(i.extend(a,s));r.trigger("request",r,h,s);return h};var k=typeof window!=="undefined"&&!!window.ActiveXObject&&!(window.XMLHttpRequest&&(new XMLHttpRequest).dispatchEvent);var T={create:"POST",update:"PUT",patch:"PATCH","delete":"DELETE",read:"GET"};e.ajax=function(){return e.$.ajax.apply(e.$,arguments)};var $=e.Router=function(t){t||(t={});if(t.routes)this.routes=t.routes;this._bindRoutes();this.initialize.apply(this,arguments)};var S=/\((.*?)\)/g;var H=/(\(\?)?:\w+/g;var A=/\*\w+/g;var I=/[\-{}\[\]+?.,\\\^$|#\s]/g;i.extend($.prototype,u,{initialize:function(){},route:function(t,r,s){if(!i.isRegExp(t))t=this._routeToRegExp(t);if(i.isFunction(r)){s=r;r=""}if(!s)s=this[r];var n=this;e.history.route(t,function(i){var a=n._extractParameters(t,i);n.execute(s,a);n.trigger.apply(n,["route:"+r].concat(a));n.trigger("route",r,a);e.history.trigger("route",n,r,a)});return this},execute:function(t,e){if(t)t.apply(this,e)},navigate:function(t,i){e.history.navigate(t,i);return this},_bindRoutes:function(){if(!this.routes)return;this.routes=i.result(this,"routes");var t,e=i.keys(this.routes);while((t=e.pop())!=null){this.route(t,this.routes[t])}},_routeToRegExp:function(t){t=t.replace(I,"\\$&").replace(S,"(?:$1)?").replace(H,function(t,e){return e?t:"([^/?]+)"}).replace(A,"([^?]*?)");return new RegExp("^"+t+"(?:\\?([\\s\\S]*))?$")},_extractParameters:function(t,e){var r=t.exec(e).slice(1);return i.map(r,function(t,e){if(e===r.length-1)return t||null;return t?decodeURIComponent(t):null})}});var N=e.History=function(){this.handlers=[];i.bindAll(this,"checkUrl");if(typeof window!=="undefined"){this.location=window.location;this.history=window.history}};var R=/^[#\/]|\s+$/g;var O=/^\/+|\/+$/g;var P=/msie [\w.]+/;var C=/\/$/;var j=/#.*$/;N.started=false;i.extend(N.prototype,u,{interval:50,atRoot:function(){return this.location.pathname.replace(/[^\/]$/,"$&/")===this.root},getHash:function(t){var e=(t||this).location.href.match(/#(.*)$/);return e?e[1]:""},getFragment:function(t,e){if(t==null){if(this._hasPushState||!this._wantsHashChange||e){t=decodeURI(this.location.pathname+this.location.search);var i=this.root.replace(C,"");if(!t.indexOf(i))t=t.slice(i.length)}else{t=this.getHash()}}return t.replace(R,"")},start:function(t){if(N.started)throw new Error("Backbone.history has already been started");N.started=true;this.options=i.extend({root:"/"},this.options,t);this.root=this.options.root;this._wantsHashChange=this.options.hashChange!==false;this._wantsPushState=!!this.options.pushState;this._hasPushState=!!(this.options.pushState&&this.history&&this.history.pushState);var r=this.getFragment();var s=document.documentMode;var n=P.exec(navigator.userAgent.toLowerCase())&&(!s||s<=7);this.root=("/"+this.root+"/").replace(O,"/");if(n&&this._wantsHashChange){var a=e.$('<iframe src="javascript:0" tabindex="-1">');this.iframe=a.hide().appendTo("body")[0].contentWindow;this.navigate(r)}if(this._hasPushState){e.$(window).on("popstate",this.checkUrl)}else if(this._wantsHashChange&&"onhashchange"in window&&!n){e.$(window).on("hashchange",this.checkUrl)}else if(this._wantsHashChange){this._checkUrlInterval=setInterval(this.checkUrl,this.interval)}this.fragment=r;var o=this.location;if(this._wantsHashChange&&this._wantsPushState){if(!this._hasPushState&&!this.atRoot()){this.fragment=this.getFragment(null,true);this.location.replace(this.root+"#"+this.fragment);return true}else if(this._hasPushState&&this.atRoot()&&o.hash){this.fragment=this.getHash().replace(R,"");this.history.replaceState({},document.title,this.root+this.fragment)}}if(!this.options.silent)return this.loadUrl()},stop:function(){e.$(window).off("popstate",this.checkUrl).off("hashchange",this.checkUrl);if(this._checkUrlInterval)clearInterval(this._checkUrlInterval);N.started=false},route:function(t,e){this.handlers.unshift({route:t,callback:e})},checkUrl:function(t){var e=this.getFragment();if(e===this.fragment&&this.iframe){e=this.getFragment(this.getHash(this.iframe))}if(e===this.fragment)return false;if(this.iframe)this.navigate(e);this.loadUrl()},loadUrl:function(t){t=this.fragment=this.getFragment(t);return i.any(this.handlers,function(e){if(e.route.test(t)){e.callback(t);return true}})},navigate:function(t,e){if(!N.started)return false;if(!e||e===true)e={trigger:!!e};var i=this.root+(t=this.getFragment(t||""));t=t.replace(j,"");if(this.fragment===t)return;this.fragment=t;if(t===""&&i!=="/")i=i.slice(0,-1);if(this._hasPushState){this.history[e.replace?"replaceState":"pushState"]({},document.title,i)}else if(this._wantsHashChange){this._updateHash(this.location,t,e.replace);if(this.iframe&&t!==this.getFragment(this.getHash(this.iframe))){if(!e.replace)this.iframe.document.open().close();this._updateHash(this.iframe.location,t,e.replace)}}else{return this.location.assign(i)}if(e.trigger)return this.loadUrl(t)},_updateHash:function(t,e,i){if(i){var r=t.href.replace(/(javascript:|#).*$/,"");t.replace(r+"#"+e)}else{t.hash="#"+e}}});e.history=new N;var U=function(t,e){var r=this;var s;if(t&&i.has(t,"constructor")){s=t.constructor}else{s=function(){return r.apply(this,arguments)}}i.extend(s,r,e);var n=function(){this.constructor=s};n.prototype=r.prototype;s.prototype=new n;if(t)i.extend(s.prototype,t);s.__super__=r.prototype;return s};p.extend=g.extend=$.extend=w.extend=N.extend=U;var M=function(){throw new Error('A "url" property or function must be specified')};var q=function(t,e){var i=e.error;e.error=function(r){if(i)i(t,r,e);t.trigger("error",t,r,e)}};return e});
/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('contrail-view',[
    'underscore',
    'backbone'
], function (_, Backbone) {
    var ContrailView = Backbone.View.extend({
        constructor: function () {
            var self = this;

            self.isMyViewRenderInProgress = false;
            self.childViewMap = {};
            self.error = false;

            self.onAllViewsRenderComplete = new Slick.Event();
            self.onAllRenderComplete = new Slick.Event();

            Backbone.View.apply(self, arguments);

            //The top view may not have any argument.
            if(arguments.length > 0) {
                self.rootView = arguments[0].rootView;
                var onAllViewsRenderCompleteCB = arguments[0].onAllViewsRenderCompleteCB,
                    onAllRenderCompleteCB = arguments[0].onAllRenderCompleteCB;

                if (contrail.checkIfFunction(onAllViewsRenderCompleteCB)) {
                    self.onAllViewsRenderComplete.subscribe(function() {
                        onAllViewsRenderCompleteCB();
                    });
                } else if (contrail.checkIfFunction(onAllRenderCompleteCB)) {
                    self.onAllRenderComplete.subscribe(function() {
                        onAllRenderCompleteCB();
                    });
                }
            }

            return self;
        },

        isAnyViewRenderInProgress: function() {
            var isChildRenderInProgress = false;

            for(var key in this.childViewMap) {
                if(this.childViewMap[key] == null || this.childViewMap[key].isAnyViewRenderInProgress()) {
                    isChildRenderInProgress = true;
                    break;
                }
            }

            return isChildRenderInProgress || this.isMyViewRenderInProgress;
        },

        isAnyRenderInProgress: function() {
            return this.isAnyViewRenderInProgress() || this.isModelRequestInProgress();
        },

        isModelRequestInProgress: function() {
            if(this.model != null && contrail.checkIfFunction(this.model.isRequestInProgress)) {
                return this.model.isRequestInProgress();
            } else {
                return false;
            }
        },

        renderView4Config: function (parentElement, model, viewObj, validation, lockEditingByDefault, modelMap, onAllViewsRenderComplete, onAllRenderComplete) {
            var viewName = viewObj['view'],
                viewPathPrefix = viewObj['viewPathPrefix'],
                elementId = viewObj[cowc.KEY_ELEMENT_ID],
                validation = (validation != null) ? validation : cowc.KEY_VALIDATION,
                viewConfig = viewObj[cowc.KEY_VIEW_CONFIG],
                viewAttributes = {viewConfig: viewConfig, elementId: elementId, validation: validation, lockEditingByDefault: lockEditingByDefault},
                app = viewObj['app'], self = this;

            self.childViewMap[elementId] = null;

            var rootView = contrail.checkIfExist(this.rootView) ? this.rootView : this,
                renderConfig = {
                    parentElement: parentElement,
                    viewName: viewName,
                    viewPathPrefix: viewPathPrefix,
                    model: model,
                    viewAttributes: viewAttributes,
                    modelMap: modelMap,
                    app: app,
                    rootView: rootView,
                    onAllViewsRenderCompleteCB: function() {
                        if(!self.isAnyViewRenderInProgress()) {
                            // Notify parent the one of child's rendering is complete.
                            self.onAllViewsRenderComplete.notify();

                            if(contrail.checkIfFunction(onAllViewsRenderComplete)) {
                                // Call any callback associated with onViewRenderComplete of child view.
                                onAllViewsRenderComplete(self);
                            }
                        }
                    }
                    /*
                    onAllRenderCompleteCB: function() {
                        if(!self.isAnyViewRenderInProgress()) {
                            // Notify parent the one of child's rendering is complete.
                            self.onAllRenderComplete.notify();

                            if(contrail.checkIfFunction(onAllRenderComplete)) {
                                // Call any callback associated with onViewRenderComplete of child view.
                                onAllRenderComplete();
                            }
                        }
                    }*/
                };

            cowu.renderView(renderConfig, function(renderedView) {
                // Adding child view to a map in rootView
                add2RootViewMap(elementId, renderedView, rootView);

                // Adding child view to a childViewMap in current view
                add2ChildViewMap(elementId, renderedView, self);
            });
        },

        setRootView: function(childElId, rootView) {
            add2RootViewMap(childElId, this, rootView)
        },

        setParentView: function(childElId, parentView) {
            add2ChildViewMap(childElId, this, parentView);
        },

        beginMyViewRendering: function() {
            this.isMyViewRenderInProgress = true;
            this.error = false;
        },

        endMyViewRendering: function() {
            this.isMyViewRenderInProgress = false;
            if(!this.isAnyViewRenderInProgress()) {
                this.onAllViewsRenderComplete.notify();
            }

            if(!this.isAnyRenderInProgress()) {
                this.onAllRenderComplete.notify();
            }
        },

        endMyModelRendering: function() {
            if(!this.isAnyRenderInProgress()) {
                this.onAllRenderComplete.notify();
            }
        },

        endMyRendering: function() {
            this.endMyViewRendering();
            this.endMyModelRendering();
        }
    });

    function add2RootViewMap(childElId, chRenderedView, rootView) {
        if(!contrail.checkIfExist(rootView.viewMap)) {
            rootView.viewMap = {};
        }
        rootView.viewMap[childElId] = chRenderedView;
    }

    function add2ChildViewMap (childElId, chRenderedView, self) {
        self.childViewMap[childElId] = chRenderedView;
    }

    return ContrailView;
});
// Knockout JavaScript library v3.0.0
// (c) Steven Sanderson - http://knockoutjs.com/
// License: MIT (http://www.opensource.org/licenses/mit-license.php)

(function() {(function(q){var y=this||(0,eval)("this"),w=y.document,K=y.navigator,u=y.jQuery,B=y.JSON;(function(q){"function"===typeof require&&"object"===typeof exports&&"object"===typeof module?q(module.exports||exports):"function"===typeof define&&define.amd?define('knockout',["exports"],q):q(y.ko={})})(function(F){function G(a,c){return null===a||typeof a in N?a===c:!1}function H(b,c,d,e){a.d[b]={init:function(b){a.a.f.set(b,L,{});return{controlsDescendantBindings:!0}},update:function(b,h,k,m,f){k=a.a.f.get(b,L);h=a.a.c(h());
m=!d!==!h;var p=!k.ob;if(p||c||m!==k.Db)p&&(k.ob=a.a.Ya(a.e.childNodes(b),!0)),m?(p||a.e.S(b,a.a.Ya(k.ob)),a.Ta(e?e(f,h):f,b)):a.e.Z(b),k.Db=m}};a.g.Y[b]=!1;a.e.P[b]=!0}var a="undefined"!==typeof F?F:{};a.b=function(b,c){for(var d=b.split("."),e=a,g=0;g<d.length-1;g++)e=e[d[g]];e[d[d.length-1]]=c};a.s=function(a,c,d){a[c]=d};a.version="3.0.0";a.b("version",a.version);a.a=function(){function b(a,b){for(var f in a)a.hasOwnProperty(f)&&b(f,a[f])}function c(k,b){if("input"!==a.a.v(k)||!k.type||"click"!=
b.toLowerCase())return!1;var f=k.type;return"checkbox"==f||"radio"==f}var d={},e={};d[K&&/Firefox\/2/i.test(K.userAgent)?"KeyboardEvent":"UIEvents"]=["keyup","keydown","keypress"];d.MouseEvents="click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave".split(" ");b(d,function(a,b){if(b.length)for(var f=0,c=b.length;f<c;f++)e[b[f]]=a});var g={propertychange:!0},h=w&&function(){for(var a=3,b=w.createElement("div"),f=b.getElementsByTagName("i");b.innerHTML="\x3c!--[if gt IE "+
++a+"]><i></i><![endif]--\x3e",f[0];);return 4<a?a:q}();return{$a:["authenticity_token",/^__RequestVerificationToken(_.*)?$/],n:function(a,b){for(var f=0,c=a.length;f<c;f++)b(a[f])},l:function(a,b){if("function"==typeof Array.prototype.indexOf)return Array.prototype.indexOf.call(a,b);for(var f=0,c=a.length;f<c;f++)if(a[f]===b)return f;return-1},Ua:function(a,b,f){for(var c=0,d=a.length;c<d;c++)if(b.call(f,a[c]))return a[c];return null},ia:function(b,c){var f=a.a.l(b,c);0<=f&&b.splice(f,1)},Va:function(b){b=
b||[];for(var c=[],f=0,d=b.length;f<d;f++)0>a.a.l(c,b[f])&&c.push(b[f]);return c},ha:function(a,b){a=a||[];for(var f=[],c=0,d=a.length;c<d;c++)f.push(b(a[c]));return f},ga:function(a,b){a=a||[];for(var f=[],c=0,d=a.length;c<d;c++)b(a[c])&&f.push(a[c]);return f},X:function(a,b){if(b instanceof Array)a.push.apply(a,b);else for(var f=0,c=b.length;f<c;f++)a.push(b[f]);return a},V:function(b,c,f){var d=a.a.l(a.a.Ha(b),c);0>d?f&&b.push(c):f||b.splice(d,1)},extend:function(a,b){if(b)for(var f in b)b.hasOwnProperty(f)&&
(a[f]=b[f]);return a},K:b,Da:function(a,b){if(!a)return a;var f={},c;for(c in a)a.hasOwnProperty(c)&&(f[c]=b(a[c],c,a));return f},wa:function(b){for(;b.firstChild;)a.removeNode(b.firstChild)},Vb:function(b){b=a.a.Q(b);for(var c=w.createElement("div"),f=0,d=b.length;f<d;f++)c.appendChild(a.L(b[f]));return c},Ya:function(b,c){for(var f=0,d=b.length,e=[];f<d;f++){var g=b[f].cloneNode(!0);e.push(c?a.L(g):g)}return e},S:function(b,c){a.a.wa(b);if(c)for(var f=0,d=c.length;f<d;f++)b.appendChild(c[f])},nb:function(b,
c){var f=b.nodeType?[b]:b;if(0<f.length){for(var d=f[0],e=d.parentNode,g=0,n=c.length;g<n;g++)e.insertBefore(c[g],d);g=0;for(n=f.length;g<n;g++)a.removeNode(f[g])}},$:function(a,b){if(a.length){for(b=8===b.nodeType&&b.parentNode||b;a.length&&a[0].parentNode!==b;)a.splice(0,1);if(1<a.length){var f=a[0],c=a[a.length-1];for(a.length=0;f!==c;)if(a.push(f),f=f.nextSibling,!f)return;a.push(c)}}return a},qb:function(a,b){7>h?a.setAttribute("selected",b):a.selected=b},la:function(a){return null===a||a===
q?"":a.trim?a.trim():a.toString().replace(/^[\s\xa0]+|[\s\xa0]+$/g,"")},ec:function(b,c){for(var f=[],d=(b||"").split(c),e=0,g=d.length;e<g;e++){var n=a.a.la(d[e]);""!==n&&f.push(n)}return f},ac:function(a,b){a=a||"";return b.length>a.length?!1:a.substring(0,b.length)===b},Gb:function(a,b){if(a===b)return!0;if(11===a.nodeType)return!1;if(b.contains)return b.contains(3===a.nodeType?a.parentNode:a);if(b.compareDocumentPosition)return 16==(b.compareDocumentPosition(a)&16);for(;a&&a!=b;)a=a.parentNode;
return!!a},va:function(b){return a.a.Gb(b,b.ownerDocument.documentElement)},Ra:function(b){return!!a.a.Ua(b,a.a.va)},v:function(a){return a&&a.tagName&&a.tagName.toLowerCase()},r:function(b,d,f){var e=h&&g[d];if(e||"undefined"==typeof u)if(e||"function"!=typeof b.addEventListener)if("undefined"!=typeof b.attachEvent){var s=function(a){f.call(b,a)},l="on"+d;b.attachEvent(l,s);a.a.C.ea(b,function(){b.detachEvent(l,s)})}else throw Error("Browser doesn't support addEventListener or attachEvent");else b.addEventListener(d,
f,!1);else{if(c(b,d)){var n=f;f=function(a,b){var f=this.checked;b&&(this.checked=!0!==b.Ab);n.call(this,a);this.checked=f}}u(b).bind(d,f)}},da:function(a,b){if(!a||!a.nodeType)throw Error("element must be a DOM node when calling triggerEvent");if("undefined"!=typeof u){var f=[];c(a,b)&&f.push({Ab:a.checked});u(a).trigger(b,f)}else if("function"==typeof w.createEvent)if("function"==typeof a.dispatchEvent)f=w.createEvent(e[b]||"HTMLEvents"),f.initEvent(b,!0,!0,y,0,0,0,0,0,!1,!1,!1,!1,0,a),a.dispatchEvent(f);
else throw Error("The supplied element doesn't support dispatchEvent");else if("undefined"!=typeof a.fireEvent)c(a,b)&&(a.checked=!0!==a.checked),a.fireEvent("on"+b);else throw Error("Browser doesn't support triggering events");},c:function(b){return a.M(b)?b():b},Ha:function(b){return a.M(b)?b.t():b},ma:function(b,c,f){if(c){var d=/\S+/g,e=b.className.match(d)||[];a.a.n(c.match(d),function(b){a.a.V(e,b,f)});b.className=e.join(" ")}},Ma:function(b,c){var f=a.a.c(c);if(null===f||f===q)f="";var d=a.e.firstChild(b);
!d||3!=d.nodeType||a.e.nextSibling(d)?a.e.S(b,[w.createTextNode(f)]):d.data=f;a.a.Jb(b)},pb:function(a,b){a.name=b;if(7>=h)try{a.mergeAttributes(w.createElement("<input name='"+a.name+"'/>"),!1)}catch(f){}},Jb:function(a){9<=h&&(a=1==a.nodeType?a:a.parentNode,a.style&&(a.style.zoom=a.style.zoom))},Hb:function(a){if(h){var b=a.style.width;a.style.width=0;a.style.width=b}},Zb:function(b,c){b=a.a.c(b);c=a.a.c(c);for(var f=[],d=b;d<=c;d++)f.push(d);return f},Q:function(a){for(var b=[],c=0,d=a.length;c<
d;c++)b.push(a[c]);return b},cc:6===h,dc:7===h,ja:h,ab:function(b,c){for(var f=a.a.Q(b.getElementsByTagName("input")).concat(a.a.Q(b.getElementsByTagName("textarea"))),d="string"==typeof c?function(a){return a.name===c}:function(a){return c.test(a.name)},e=[],g=f.length-1;0<=g;g--)d(f[g])&&e.push(f[g]);return e},Wb:function(b){return"string"==typeof b&&(b=a.a.la(b))?B&&B.parse?B.parse(b):(new Function("return "+b))():null},Na:function(b,c,f){if(!B||!B.stringify)throw Error("Cannot find JSON.stringify(). Some browsers (e.g., IE < 8) don't support it natively, but you can overcome this by adding a script reference to json2.js, downloadable from http://www.json.org/json2.js");
return B.stringify(a.a.c(b),c,f)},Xb:function(c,d,f){f=f||{};var e=f.params||{},g=f.includeFields||this.$a,h=c;if("object"==typeof c&&"form"===a.a.v(c))for(var h=c.action,n=g.length-1;0<=n;n--)for(var r=a.a.ab(c,g[n]),v=r.length-1;0<=v;v--)e[r[v].name]=r[v].value;d=a.a.c(d);var t=w.createElement("form");t.style.display="none";t.action=h;t.method="post";for(var E in d)c=w.createElement("input"),c.name=E,c.value=a.a.Na(a.a.c(d[E])),t.appendChild(c);b(e,function(a,b){var c=w.createElement("input");c.name=
a;c.value=b;t.appendChild(c)});w.body.appendChild(t);f.submitter?f.submitter(t):t.submit();setTimeout(function(){t.parentNode.removeChild(t)},0)}}}();a.b("utils",a.a);a.b("utils.arrayForEach",a.a.n);a.b("utils.arrayFirst",a.a.Ua);a.b("utils.arrayFilter",a.a.ga);a.b("utils.arrayGetDistinctValues",a.a.Va);a.b("utils.arrayIndexOf",a.a.l);a.b("utils.arrayMap",a.a.ha);a.b("utils.arrayPushAll",a.a.X);a.b("utils.arrayRemoveItem",a.a.ia);a.b("utils.extend",a.a.extend);a.b("utils.fieldsIncludedWithJsonPost",
a.a.$a);a.b("utils.getFormFields",a.a.ab);a.b("utils.peekObservable",a.a.Ha);a.b("utils.postJson",a.a.Xb);a.b("utils.parseJson",a.a.Wb);a.b("utils.registerEventHandler",a.a.r);a.b("utils.stringifyJson",a.a.Na);a.b("utils.range",a.a.Zb);a.b("utils.toggleDomNodeCssClass",a.a.ma);a.b("utils.triggerEvent",a.a.da);a.b("utils.unwrapObservable",a.a.c);a.b("utils.objectForEach",a.a.K);a.b("utils.addOrRemoveItem",a.a.V);a.b("unwrap",a.a.c);Function.prototype.bind||(Function.prototype.bind=function(a){var c=
this,d=Array.prototype.slice.call(arguments);a=d.shift();return function(){return c.apply(a,d.concat(Array.prototype.slice.call(arguments)))}});a.a.f=new function(){function a(b,h){var k=b[d];if(!k||"null"===k||!e[k]){if(!h)return q;k=b[d]="ko"+c++;e[k]={}}return e[k]}var c=0,d="__ko__"+(new Date).getTime(),e={};return{get:function(c,d){var e=a(c,!1);return e===q?q:e[d]},set:function(c,d,e){if(e!==q||a(c,!1)!==q)a(c,!0)[d]=e},clear:function(a){var b=a[d];return b?(delete e[b],a[d]=null,!0):!1},D:function(){return c++ +
d}}};a.b("utils.domData",a.a.f);a.b("utils.domData.clear",a.a.f.clear);a.a.C=new function(){function b(b,c){var e=a.a.f.get(b,d);e===q&&c&&(e=[],a.a.f.set(b,d,e));return e}function c(d){var e=b(d,!1);if(e)for(var e=e.slice(0),m=0;m<e.length;m++)e[m](d);a.a.f.clear(d);"function"==typeof u&&"function"==typeof u.cleanData&&u.cleanData([d]);if(g[d.nodeType])for(e=d.firstChild;d=e;)e=d.nextSibling,8===d.nodeType&&c(d)}var d=a.a.f.D(),e={1:!0,8:!0,9:!0},g={1:!0,9:!0};return{ea:function(a,c){if("function"!=
typeof c)throw Error("Callback must be a function");b(a,!0).push(c)},mb:function(c,e){var g=b(c,!1);g&&(a.a.ia(g,e),0==g.length&&a.a.f.set(c,d,q))},L:function(b){if(e[b.nodeType]&&(c(b),g[b.nodeType])){var d=[];a.a.X(d,b.getElementsByTagName("*"));for(var m=0,f=d.length;m<f;m++)c(d[m])}return b},removeNode:function(b){a.L(b);b.parentNode&&b.parentNode.removeChild(b)}}};a.L=a.a.C.L;a.removeNode=a.a.C.removeNode;a.b("cleanNode",a.L);a.b("removeNode",a.removeNode);a.b("utils.domNodeDisposal",a.a.C);
a.b("utils.domNodeDisposal.addDisposeCallback",a.a.C.ea);a.b("utils.domNodeDisposal.removeDisposeCallback",a.a.C.mb);(function(){a.a.Fa=function(b){var c;if("undefined"!=typeof u)if(u.parseHTML)c=u.parseHTML(b)||[];else{if((c=u.clean([b]))&&c[0]){for(b=c[0];b.parentNode&&11!==b.parentNode.nodeType;)b=b.parentNode;b.parentNode&&b.parentNode.removeChild(b)}}else{var d=a.a.la(b).toLowerCase();c=w.createElement("div");d=d.match(/^<(thead|tbody|tfoot)/)&&[1,"<table>","</table>"]||!d.indexOf("<tr")&&[2,
"<table><tbody>","</tbody></table>"]||(!d.indexOf("<td")||!d.indexOf("<th"))&&[3,"<table><tbody><tr>","</tr></tbody></table>"]||[0,"",""];b="ignored<div>"+d[1]+b+d[2]+"</div>";for("function"==typeof y.innerShiv?c.appendChild(y.innerShiv(b)):c.innerHTML=b;d[0]--;)c=c.lastChild;c=a.a.Q(c.lastChild.childNodes)}return c};a.a.Ka=function(b,c){a.a.wa(b);c=a.a.c(c);if(null!==c&&c!==q)if("string"!=typeof c&&(c=c.toString()),"undefined"!=typeof u)u(b).html(c);else for(var d=a.a.Fa(c),e=0;e<d.length;e++)b.appendChild(d[e])}})();
a.b("utils.parseHtmlFragment",a.a.Fa);a.b("utils.setHtml",a.a.Ka);a.u=function(){function b(c,e){if(c)if(8==c.nodeType){var g=a.u.jb(c.nodeValue);null!=g&&e.push({Fb:c,Tb:g})}else if(1==c.nodeType)for(var g=0,h=c.childNodes,k=h.length;g<k;g++)b(h[g],e)}var c={};return{Ca:function(a){if("function"!=typeof a)throw Error("You can only pass a function to ko.memoization.memoize()");var b=(4294967296*(1+Math.random())|0).toString(16).substring(1)+(4294967296*(1+Math.random())|0).toString(16).substring(1);
c[b]=a;return"\x3c!--[ko_memo:"+b+"]--\x3e"},ub:function(a,b){var g=c[a];if(g===q)throw Error("Couldn't find any memo with ID "+a+". Perhaps it's already been unmemoized.");try{return g.apply(null,b||[]),!0}finally{delete c[a]}},vb:function(c,e){var g=[];b(c,g);for(var h=0,k=g.length;h<k;h++){var m=g[h].Fb,f=[m];e&&a.a.X(f,e);a.u.ub(g[h].Tb,f);m.nodeValue="";m.parentNode&&m.parentNode.removeChild(m)}},jb:function(a){return(a=a.match(/^\[ko_memo\:(.*?)\]$/))?a[1]:null}}}();a.b("memoization",a.u);a.b("memoization.memoize",
a.u.Ca);a.b("memoization.unmemoize",a.u.ub);a.b("memoization.parseMemoText",a.u.jb);a.b("memoization.unmemoizeDomNodeAndDescendants",a.u.vb);a.xa={throttle:function(b,c){b.throttleEvaluation=c;var d=null;return a.h({read:b,write:function(a){clearTimeout(d);d=setTimeout(function(){b(a)},c)}})},notify:function(a,c){a.equalityComparer="always"==c?null:G}};var N={undefined:1,"boolean":1,number:1,string:1};a.b("extenders",a.xa);a.sb=function(b,c,d){this.target=b;this.qa=c;this.Eb=d;a.s(this,"dispose",
this.B)};a.sb.prototype.B=function(){this.Qb=!0;this.Eb()};a.ca=function(){this.F={};a.a.extend(this,a.ca.fn);a.s(this,"subscribe",this.T);a.s(this,"extend",this.extend);a.s(this,"getSubscriptionsCount",this.Lb)};var I="change";a.ca.fn={T:function(b,c,d){d=d||I;var e=new a.sb(this,c?b.bind(c):b,function(){a.a.ia(this.F[d],e)}.bind(this));this.F[d]||(this.F[d]=[]);this.F[d].push(e);return e},notifySubscribers:function(b,c){c=c||I;if(this.cb(c))try{a.i.Wa();for(var d=this.F[c].slice(0),e=0,g;g=d[e];++e)g&&
!0!==g.Qb&&g.qa(b)}finally{a.i.end()}},cb:function(a){return this.F[a]&&this.F[a].length},Lb:function(){var b=0;a.a.K(this.F,function(a,d){b+=d.length});return b},extend:function(b){var c=this;b&&a.a.K(b,function(b,e){var g=a.xa[b];"function"==typeof g&&(c=g(c,e)||c)});return c}};a.fb=function(a){return null!=a&&"function"==typeof a.T&&"function"==typeof a.notifySubscribers};a.b("subscribable",a.ca);a.b("isSubscribable",a.fb);a.i=function(){var b=[];return{Wa:function(a){b.push(a&&{qa:a,Za:[]})},
end:function(){b.pop()},lb:function(c){if(!a.fb(c))throw Error("Only subscribable things can act as dependencies");if(0<b.length){var d=b[b.length-1];!d||0<=a.a.l(d.Za,c)||(d.Za.push(c),d.qa(c))}},p:function(a,d,e){try{return b.push(null),a.apply(d,e||[])}finally{b.pop()}}}}();a.q=function(b){function c(){if(0<arguments.length)return c.equalityComparer&&c.equalityComparer(d,arguments[0])||(c.O(),d=arguments[0],c.N()),this;a.i.lb(c);return d}var d=b;a.ca.call(c);c.t=function(){return d};c.N=function(){c.notifySubscribers(d)};
c.O=function(){c.notifySubscribers(d,"beforeChange")};a.a.extend(c,a.q.fn);a.s(c,"peek",c.t);a.s(c,"valueHasMutated",c.N);a.s(c,"valueWillMutate",c.O);return c};a.q.fn={equalityComparer:G};var C=a.q.Yb="__ko_proto__";a.q.fn[C]=a.q;a.ya=function(b,c){return null===b||b===q||b[C]===q?!1:b[C]===c?!0:a.ya(b[C],c)};a.M=function(b){return a.ya(b,a.q)};a.gb=function(b){return"function"==typeof b&&b[C]===a.q||"function"==typeof b&&b[C]===a.h&&b.Nb?!0:!1};a.b("observable",a.q);a.b("isObservable",a.M);a.b("isWriteableObservable",
a.gb);a.ba=function(b){b=b||[];if("object"!=typeof b||!("length"in b))throw Error("The argument passed when initializing an observable array must be an array, or null, or undefined.");b=a.q(b);a.a.extend(b,a.ba.fn);return b.extend({trackArrayChanges:!0})};a.ba.fn={remove:function(b){for(var c=this.t(),d=[],e="function"!=typeof b||a.M(b)?function(a){return a===b}:b,g=0;g<c.length;g++){var h=c[g];e(h)&&(0===d.length&&this.O(),d.push(h),c.splice(g,1),g--)}d.length&&this.N();return d},removeAll:function(b){if(b===
q){var c=this.t(),d=c.slice(0);this.O();c.splice(0,c.length);this.N();return d}return b?this.remove(function(c){return 0<=a.a.l(b,c)}):[]},destroy:function(b){var c=this.t(),d="function"!=typeof b||a.M(b)?function(a){return a===b}:b;this.O();for(var e=c.length-1;0<=e;e--)d(c[e])&&(c[e]._destroy=!0);this.N()},destroyAll:function(b){return b===q?this.destroy(function(){return!0}):b?this.destroy(function(c){return 0<=a.a.l(b,c)}):[]},indexOf:function(b){var c=this();return a.a.l(c,b)},replace:function(a,
c){var d=this.indexOf(a);0<=d&&(this.O(),this.t()[d]=c,this.N())}};a.a.n("pop push reverse shift sort splice unshift".split(" "),function(b){a.ba.fn[b]=function(){var a=this.t();this.O();this.Xa(a,b,arguments);a=a[b].apply(a,arguments);this.N();return a}});a.a.n(["slice"],function(b){a.ba.fn[b]=function(){var a=this();return a[b].apply(a,arguments)}});a.b("observableArray",a.ba);var J="arrayChange";a.xa.trackArrayChanges=function(b){function c(){if(!d){d=!0;var c=b.notifySubscribers;b.notifySubscribers=
function(a,b){b&&b!==I||++g;return c.apply(this,arguments)};var m=[].concat(b.t()||[]);e=null;b.T(function(c){c=[].concat(c||[]);if(b.cb(J)){var d;if(!e||1<g)e=a.a.ra(m,c,{sparse:!0});d=e;d.length&&b.notifySubscribers(d,J)}m=c;e=null;g=0})}}if(!b.Xa){var d=!1,e=null,g=0,h=b.T;b.T=b.subscribe=function(a,b,f){f===J&&c();return h.apply(this,arguments)};b.Xa=function(a,b,c){function p(a,b,c){h.push({status:a,value:b,index:c})}if(d&&!g){var h=[],l=a.length,n=c.length,r=0;switch(b){case "push":r=l;case "unshift":for(b=
0;b<n;b++)p("added",c[b],r+b);break;case "pop":r=l-1;case "shift":l&&p("deleted",a[r],r);break;case "splice":b=Math.min(Math.max(0,0>c[0]?l+c[0]:c[0]),l);for(var l=1===n?l:Math.min(b+(c[1]||0),l),n=b+n-2,r=Math.max(l,n),v=2;b<r;++b,++v)b<l&&p("deleted",a[b],b),b<n&&p("added",c[v],b);break;default:return}e=h}}}};a.h=function(b,c,d){function e(){a.a.n(z,function(a){a.B()});z=[]}function g(){var a=k.throttleEvaluation;a&&0<=a?(clearTimeout(x),x=setTimeout(h,a)):h()}function h(){if(!s){if(E&&E()){if(!l){D();
p=!0;return}}else l=!1;s=!0;try{var b=a.a.ha(z,function(a){return a.target});a.i.Wa(function(c){var d;0<=(d=a.a.l(b,c))?b[d]=q:z.push(c.T(g))});for(var d=c?n.call(c):n(),e=b.length-1;0<=e;e--)b[e]&&z.splice(e,1)[0].B();p=!0;k.equalityComparer&&k.equalityComparer(f,d)||(k.notifySubscribers(f,"beforeChange"),f=d,k.notifySubscribers(f))}finally{a.i.end(),s=!1}z.length||D()}}function k(){if(0<arguments.length){if("function"===typeof r)r.apply(c,arguments);else throw Error("Cannot write a value to a ko.computed unless you specify a 'write' option. If you wish to read the current value, don't pass any parameters.");
return this}p||h();a.i.lb(k);return f}function m(){return!p||0<z.length}var f,p=!1,s=!1,l=!1,n=b;n&&"object"==typeof n?(d=n,n=d.read):(d=d||{},n||(n=d.read));if("function"!=typeof n)throw Error("Pass a function that returns the value of the ko.computed");var r=d.write,v=d.disposeWhenNodeIsRemoved||d.I||null,t=d.disposeWhen||d.ua,E=t,D=e,z=[],x=null;c||(c=d.owner);k.t=function(){p||h();return f};k.Kb=function(){return z.length};k.Nb="function"===typeof d.write;k.B=function(){D()};k.aa=m;a.ca.call(k);
a.a.extend(k,a.h.fn);a.s(k,"peek",k.t);a.s(k,"dispose",k.B);a.s(k,"isActive",k.aa);a.s(k,"getDependenciesCount",k.Kb);v&&(l=!0,v.nodeType&&(E=function(){return!a.a.va(v)||t&&t()}));!0!==d.deferEvaluation&&h();v&&m()&&(D=function(){a.a.C.mb(v,D);e()},a.a.C.ea(v,D));return k};a.Pb=function(b){return a.ya(b,a.h)};F=a.q.Yb;a.h[F]=a.q;a.h.fn={equalityComparer:G};a.h.fn[F]=a.h;a.b("dependentObservable",a.h);a.b("computed",a.h);a.b("isComputed",a.Pb);(function(){function b(a,g,h){h=h||new d;a=g(a);if("object"!=
typeof a||null===a||a===q||a instanceof Date||a instanceof String||a instanceof Number||a instanceof Boolean)return a;var k=a instanceof Array?[]:{};h.save(a,k);c(a,function(c){var d=g(a[c]);switch(typeof d){case "boolean":case "number":case "string":case "function":k[c]=d;break;case "object":case "undefined":var p=h.get(d);k[c]=p!==q?p:b(d,g,h)}});return k}function c(a,b){if(a instanceof Array){for(var c=0;c<a.length;c++)b(c);"function"==typeof a.toJSON&&b("toJSON")}else for(c in a)b(c)}function d(){this.keys=
[];this.Qa=[]}a.tb=function(c){if(0==arguments.length)throw Error("When calling ko.toJS, pass the object you want to convert.");return b(c,function(b){for(var c=0;a.M(b)&&10>c;c++)b=b();return b})};a.toJSON=function(b,c,d){b=a.tb(b);return a.a.Na(b,c,d)};d.prototype={save:function(b,c){var d=a.a.l(this.keys,b);0<=d?this.Qa[d]=c:(this.keys.push(b),this.Qa.push(c))},get:function(b){b=a.a.l(this.keys,b);return 0<=b?this.Qa[b]:q}}})();a.b("toJS",a.tb);a.b("toJSON",a.toJSON);(function(){a.k={o:function(b){switch(a.a.v(b)){case "option":return!0===
b.__ko__hasDomDataOptionValue__?a.a.f.get(b,a.d.options.Ea):7>=a.a.ja?b.getAttributeNode("value")&&b.getAttributeNode("value").specified?b.value:b.text:b.value;case "select":return 0<=b.selectedIndex?a.k.o(b.options[b.selectedIndex]):q;default:return b.value}},na:function(b,c){switch(a.a.v(b)){case "option":switch(typeof c){case "string":a.a.f.set(b,a.d.options.Ea,q);"__ko__hasDomDataOptionValue__"in b&&delete b.__ko__hasDomDataOptionValue__;b.value=c;break;default:a.a.f.set(b,a.d.options.Ea,c),b.__ko__hasDomDataOptionValue__=
!0,b.value="number"===typeof c?c:""}break;case "select":""===c&&(c=q);if(null===c||c===q)b.selectedIndex=-1;for(var d=b.options.length-1;0<=d;d--)if(a.k.o(b.options[d])==c){b.selectedIndex=d;break}1<b.size||-1!==b.selectedIndex||(b.selectedIndex=0);break;default:if(null===c||c===q)c="";b.value=c}}}})();a.b("selectExtensions",a.k);a.b("selectExtensions.readValue",a.k.o);a.b("selectExtensions.writeValue",a.k.na);a.g=function(){function b(b){b=a.a.la(b);123===b.charCodeAt(0)&&(b=b.slice(1,-1));var c=
[],d=b.match(e),k,l,n=0;if(d){d.push(",");for(var r=0,v;v=d[r];++r){var t=v.charCodeAt(0);if(44===t){if(0>=n){k&&c.push(l?{key:k,value:l.join("")}:{unknown:k});k=l=n=0;continue}}else if(58===t){if(!l)continue}else if(47===t&&r&&1<v.length)(t=d[r-1].match(g))&&!h[t[0]]&&(b=b.substr(b.indexOf(v)+1),d=b.match(e),d.push(","),r=-1,v="/");else if(40===t||123===t||91===t)++n;else if(41===t||125===t||93===t)--n;else if(!k&&!l){k=34===t||39===t?v.slice(1,-1):v;continue}l?l.push(v):l=[v]}}return c}var c=["true",
"false","null","undefined"],d=/^(?:[$_a-z][$\w]*|(.+)(\.\s*[$_a-z][$\w]*|\[.+\]))$/i,e=RegExp("\"(?:[^\"\\\\]|\\\\.)*\"|'(?:[^'\\\\]|\\\\.)*'|/(?:[^/\\\\]|\\\\.)*/w*|[^\\s:,/][^,\"'{}()/:[\\]]*[^\\s,\"'{}()/:[\\]]|[^\\s]","g"),g=/[\])"'A-Za-z0-9_$]+$/,h={"in":1,"return":1,"typeof":1},k={};return{Y:[],U:k,Ga:b,ka:function(e,f){function g(b,f){var e,r=a.getBindingHandler(b);if(r&&r.preprocess?f=r.preprocess(f,b,g):1){if(r=k[b])e=f,0<=a.a.l(c,e)?e=!1:(r=e.match(d),e=null===r?!1:r[1]?"Object("+r[1]+")"+
r[2]:e),r=e;r&&l.push("'"+b+"':function(_z){"+e+"=_z}");n&&(f="function(){return "+f+" }");h.push("'"+b+"':"+f)}}f=f||{};var h=[],l=[],n=f.valueAccessors,r="string"===typeof e?b(e):e;a.a.n(r,function(a){g(a.key||a.unknown,a.value)});l.length&&g("_ko_property_writers","{"+l.join(",")+"}");return h.join(",")},Sb:function(a,b){for(var c=0;c<a.length;c++)if(a[c].key==b)return!0;return!1},oa:function(b,c,d,e,k){if(b&&a.M(b))!a.gb(b)||k&&b.t()===e||b(e);else if((b=c.get("_ko_property_writers"))&&b[d])b[d](e)}}}();
a.b("expressionRewriting",a.g);a.b("expressionRewriting.bindingRewriteValidators",a.g.Y);a.b("expressionRewriting.parseObjectLiteral",a.g.Ga);a.b("expressionRewriting.preProcessBindings",a.g.ka);a.b("expressionRewriting._twoWayBindings",a.g.U);a.b("jsonExpressionRewriting",a.g);a.b("jsonExpressionRewriting.insertPropertyAccessorsIntoJson",a.g.ka);(function(){function b(a){return 8==a.nodeType&&h.test(g?a.text:a.nodeValue)}function c(a){return 8==a.nodeType&&k.test(g?a.text:a.nodeValue)}function d(a,
d){for(var e=a,k=1,n=[];e=e.nextSibling;){if(c(e)&&(k--,0===k))return n;n.push(e);b(e)&&k++}if(!d)throw Error("Cannot find closing comment tag to match: "+a.nodeValue);return null}function e(a,b){var c=d(a,b);return c?0<c.length?c[c.length-1].nextSibling:a.nextSibling:null}var g=w&&"\x3c!--test--\x3e"===w.createComment("test").text,h=g?/^\x3c!--\s*ko(?:\s+([\s\S]+))?\s*--\x3e$/:/^\s*ko(?:\s+([\s\S]+))?\s*$/,k=g?/^\x3c!--\s*\/ko\s*--\x3e$/:/^\s*\/ko\s*$/,m={ul:!0,ol:!0};a.e={P:{},childNodes:function(a){return b(a)?
d(a):a.childNodes},Z:function(c){if(b(c)){c=a.e.childNodes(c);for(var d=0,e=c.length;d<e;d++)a.removeNode(c[d])}else a.a.wa(c)},S:function(c,d){if(b(c)){a.e.Z(c);for(var e=c.nextSibling,k=0,n=d.length;k<n;k++)e.parentNode.insertBefore(d[k],e)}else a.a.S(c,d)},kb:function(a,c){b(a)?a.parentNode.insertBefore(c,a.nextSibling):a.firstChild?a.insertBefore(c,a.firstChild):a.appendChild(c)},eb:function(c,d,e){e?b(c)?c.parentNode.insertBefore(d,e.nextSibling):e.nextSibling?c.insertBefore(d,e.nextSibling):
c.appendChild(d):a.e.kb(c,d)},firstChild:function(a){return b(a)?!a.nextSibling||c(a.nextSibling)?null:a.nextSibling:a.firstChild},nextSibling:function(a){b(a)&&(a=e(a));return a.nextSibling&&c(a.nextSibling)?null:a.nextSibling},Mb:b,bc:function(a){return(a=(g?a.text:a.nodeValue).match(h))?a[1]:null},ib:function(d){if(m[a.a.v(d)]){var k=d.firstChild;if(k){do if(1===k.nodeType){var g;g=k.firstChild;var h=null;if(g){do if(h)h.push(g);else if(b(g)){var n=e(g,!0);n?g=n:h=[g]}else c(g)&&(h=[g]);while(g=
g.nextSibling)}if(g=h)for(h=k.nextSibling,n=0;n<g.length;n++)h?d.insertBefore(g[n],h):d.appendChild(g[n])}while(k=k.nextSibling)}}}}})();a.b("virtualElements",a.e);a.b("virtualElements.allowedBindings",a.e.P);a.b("virtualElements.emptyNode",a.e.Z);a.b("virtualElements.insertAfter",a.e.eb);a.b("virtualElements.prepend",a.e.kb);a.b("virtualElements.setDomNodeChildren",a.e.S);(function(){a.H=function(){this.zb={}};a.a.extend(a.H.prototype,{nodeHasBindings:function(b){switch(b.nodeType){case 1:return null!=
b.getAttribute("data-bind");case 8:return a.e.Mb(b);default:return!1}},getBindings:function(a,c){var d=this.getBindingsString(a,c);return d?this.parseBindingsString(d,c,a):null},getBindingAccessors:function(a,c){var d=this.getBindingsString(a,c);return d?this.parseBindingsString(d,c,a,{valueAccessors:!0}):null},getBindingsString:function(b){switch(b.nodeType){case 1:return b.getAttribute("data-bind");case 8:return a.e.bc(b);default:return null}},parseBindingsString:function(b,c,d,e){try{var g=this.zb,
h=b+(e&&e.valueAccessors||""),k;if(!(k=g[h])){var m,f="with($context){with($data||{}){return{"+a.g.ka(b,e)+"}}}";m=new Function("$context","$element",f);k=g[h]=m}return k(c,d)}catch(p){throw p.message="Unable to parse bindings.\nBindings value: "+b+"\nMessage: "+p.message,p;}}});a.H.instance=new a.H})();a.b("bindingProvider",a.H);(function(){function b(a){return function(){return a}}function c(a){return a()}function d(b){return a.a.Da(a.i.p(b),function(a,c){return function(){return b()[c]}})}function e(a,
b){return d(this.getBindings.bind(this,a,b))}function g(b,c,d){var f,e=a.e.firstChild(c),k=a.H.instance,g=k.preprocessNode;if(g){for(;f=e;)e=a.e.nextSibling(f),g.call(k,f);e=a.e.firstChild(c)}for(;f=e;)e=a.e.nextSibling(f),h(b,f,d)}function h(b,c,d){var f=!0,e=1===c.nodeType;e&&a.e.ib(c);if(e&&d||a.H.instance.nodeHasBindings(c))f=m(c,null,b,d).shouldBindDescendants;f&&!p[a.a.v(c)]&&g(b,c,!e)}function k(b){var c=[],d={},f=[];a.a.K(b,function D(e){if(!d[e]){var k=a.getBindingHandler(e);k&&(k.after&&
(f.push(e),a.a.n(k.after,function(c){if(b[c]){if(-1!==a.a.l(f,c))throw Error("Cannot combine the following bindings, because they have a cyclic dependency: "+f.join(", "));D(c)}}),f.pop()),c.push({key:e,bb:k}));d[e]=!0}});return c}function m(b,d,f,g){var h=a.a.f.get(b,s);if(!d){if(h)throw Error("You cannot apply bindings multiple times to the same element.");a.a.f.set(b,s,!0)}!h&&g&&a.rb(b,f);var m;if(d&&"function"!==typeof d)m=d;else{var p=a.H.instance,l=p.getBindingAccessors||e;if(d||f.A){var A=
a.h(function(){(m=d?d(f,b):l.call(p,b,f))&&f.A&&f.A();return m},null,{I:b});m&&A.aa()||(A=null)}else m=a.i.p(l,p,[b,f])}var u;if(m){var w=A?function(a){return function(){return c(A()[a])}}:function(a){return m[a]},y=function(){return a.a.Da(A?A():m,c)};y.get=function(a){return m[a]&&c(w(a))};y.has=function(a){return a in m};g=k(m);a.a.n(g,function(c){var d=c.bb.init,e=c.bb.update,k=c.key;if(8===b.nodeType&&!a.e.P[k])throw Error("The binding '"+k+"' cannot be used with virtual elements");try{"function"==
typeof d&&a.i.p(function(){var a=d(b,w(k),y,f.$data,f);if(a&&a.controlsDescendantBindings){if(u!==q)throw Error("Multiple bindings ("+u+" and "+k+") are trying to control descendant bindings of the same element. You cannot use these bindings together on the same element.");u=k}}),"function"==typeof e&&a.h(function(){e(b,w(k),y,f.$data,f)},null,{I:b})}catch(g){throw g.message='Unable to process binding "'+k+": "+m[k]+'"\nMessage: '+g.message,g;}})}return{shouldBindDescendants:u===q}}function f(b){return b&&
b instanceof a.G?b:new a.G(b)}a.d={};var p={script:!0};a.getBindingHandler=function(b){return a.d[b]};a.G=function(b,c,d,f){var e=this,k="function"==typeof b,g,h=a.h(function(){var g=k?b():b;c?(c.A&&c.A(),a.a.extend(e,c),h&&(e.A=h)):(e.$parents=[],e.$root=g,e.ko=a);e.$rawData=b;e.$data=g;d&&(e[d]=g);f&&f(e,c,g);return e.$data},null,{ua:function(){return g&&!a.a.Ra(g)},I:!0});h.aa()&&(e.A=h,h.equalityComparer=null,g=[],h.wb=function(b){g.push(b);a.a.C.ea(b,function(b){a.a.ia(g,b);g.length||(h.B(),
e.A=h=q)})})};a.G.prototype.createChildContext=function(b,c,d){return new a.G(b,this,c,function(a,b){a.$parentContext=b;a.$parent=b.$data;a.$parents=(b.$parents||[]).slice(0);a.$parents.unshift(a.$parent);d&&d(a)})};a.G.prototype.extend=function(b){return new a.G(this.$rawData,this,null,function(c){a.a.extend(c,"function"==typeof b?b():b)})};var s=a.a.f.D(),l=a.a.f.D();a.rb=function(b,c){if(2==arguments.length)a.a.f.set(b,l,c),c.A&&c.A.wb(b);else return a.a.f.get(b,l)};a.pa=function(b,c,d){1===b.nodeType&&
a.e.ib(b);return m(b,c,f(d),!0)};a.xb=function(c,e,k){k=f(k);return a.pa(c,"function"===typeof e?d(e.bind(null,k,c)):a.a.Da(e,b),k)};a.Ta=function(a,b){1!==b.nodeType&&8!==b.nodeType||g(f(a),b,!0)};a.Sa=function(a,b){if(b&&1!==b.nodeType&&8!==b.nodeType)throw Error("ko.applyBindings: first parameter should be your view model; second parameter should be a DOM node");b=b||y.document.body;h(f(a),b,!0)};a.ta=function(b){switch(b.nodeType){case 1:case 8:var c=a.rb(b);if(c)return c;if(b.parentNode)return a.ta(b.parentNode)}return q};
a.Cb=function(b){return(b=a.ta(b))?b.$data:q};a.b("bindingHandlers",a.d);a.b("applyBindings",a.Sa);a.b("applyBindingsToDescendants",a.Ta);a.b("applyBindingAccessorsToNode",a.pa);a.b("applyBindingsToNode",a.xb);a.b("contextFor",a.ta);a.b("dataFor",a.Cb)})();var M={"class":"className","for":"htmlFor"};a.d.attr={update:function(b,c){var d=a.a.c(c())||{};a.a.K(d,function(c,d){d=a.a.c(d);var h=!1===d||null===d||d===q;h&&b.removeAttribute(c);8>=a.a.ja&&c in M?(c=M[c],h?b.removeAttribute(c):b[c]=d):h||b.setAttribute(c,
d.toString());"name"===c&&a.a.pb(b,h?"":d.toString())})}};(function(){a.d.checked={after:["value","attr"],init:function(b,c,d){function e(){return d.has("checkedValue")?a.a.c(d.get("checkedValue")):b.value}function g(){var k=b.checked,g=s?e():k;if(l&&(!m||k)){var h=a.i.p(c);f?p!==g?(k&&(a.a.V(h,g,!0),a.a.V(h,p,!1)),p=g):a.a.V(h,g,k):a.g.oa(h,d,"checked",g,!0)}}function h(){var d=a.a.c(c());b.checked=f?0<=a.a.l(d,e()):k?d:e()===d}var k="checkbox"==b.type,m="radio"==b.type;if(k||m){var f=k&&a.a.c(c())instanceof
Array,p=f?e():q,s=m||f,l=!1;m&&!b.name&&a.d.uniqueName.init(b,function(){return!0});a.h(g,null,{I:b});a.a.r(b,"click",g);a.h(h,null,{I:b});l=!0}}};a.g.U.checked=!0;a.d.checkedValue={update:function(b,c){b.value=a.a.c(c())}}})();a.d.css={update:function(b,c){var d=a.a.c(c());"object"==typeof d?a.a.K(d,function(c,d){d=a.a.c(d);a.a.ma(b,c,d)}):(d=String(d||""),a.a.ma(b,b.__ko__cssValue,!1),b.__ko__cssValue=d,a.a.ma(b,d,!0))}};a.d.enable={update:function(b,c){var d=a.a.c(c());d&&b.disabled?b.removeAttribute("disabled"):
d||b.disabled||(b.disabled=!0)}};a.d.disable={update:function(b,c){a.d.enable.update(b,function(){return!a.a.c(c())})}};a.d.event={init:function(b,c,d,e,g){var h=c()||{};a.a.K(h,function(k){"string"==typeof k&&a.a.r(b,k,function(b){var f,h=c()[k];if(h){try{var s=a.a.Q(arguments);e=g.$data;s.unshift(e);f=h.apply(e,s)}finally{!0!==f&&(b.preventDefault?b.preventDefault():b.returnValue=!1)}!1===d.get(k+"Bubble")&&(b.cancelBubble=!0,b.stopPropagation&&b.stopPropagation())}})})}};a.d.foreach={hb:function(b){return function(){var c=
b(),d=a.a.Ha(c);if(!d||"number"==typeof d.length)return{foreach:c,templateEngine:a.J.Aa};a.a.c(c);return{foreach:d.data,as:d.as,includeDestroyed:d.includeDestroyed,afterAdd:d.afterAdd,beforeRemove:d.beforeRemove,afterRender:d.afterRender,beforeMove:d.beforeMove,afterMove:d.afterMove,templateEngine:a.J.Aa}}},init:function(b,c){return a.d.template.init(b,a.d.foreach.hb(c))},update:function(b,c,d,e,g){return a.d.template.update(b,a.d.foreach.hb(c),d,e,g)}};a.g.Y.foreach=!1;a.e.P.foreach=!0;a.d.hasfocus=
{init:function(b,c,d){function e(e){b.__ko_hasfocusUpdating=!0;var g=b.ownerDocument;if("activeElement"in g){var f;try{f=g.activeElement}catch(h){f=g.body}e=f===b}g=c();a.g.oa(g,d,"hasfocus",e,!0);b.__ko_hasfocusLastValue=e;b.__ko_hasfocusUpdating=!1}var g=e.bind(null,!0),h=e.bind(null,!1);a.a.r(b,"focus",g);a.a.r(b,"focusin",g);a.a.r(b,"blur",h);a.a.r(b,"focusout",h)},update:function(b,c){var d=!!a.a.c(c());b.__ko_hasfocusUpdating||b.__ko_hasfocusLastValue===d||(d?b.focus():b.blur(),a.i.p(a.a.da,
null,[b,d?"focusin":"focusout"]))}};a.g.U.hasfocus=!0;a.d.hasFocus=a.d.hasfocus;a.g.U.hasFocus=!0;a.d.html={init:function(){return{controlsDescendantBindings:!0}},update:function(b,c){a.a.Ka(b,c())}};var L=a.a.f.D();H("if");H("ifnot",!1,!0);H("with",!0,!1,function(a,c){return a.createChildContext(c)});a.d.options={init:function(b){if("select"!==a.a.v(b))throw Error("options binding applies only to SELECT elements");for(;0<b.length;)b.remove(0);return{controlsDescendantBindings:!0}},update:function(b,
c,d){function e(){return a.a.ga(b.options,function(a){return a.selected})}function g(a,b,c){var d=typeof b;return"function"==d?b(a):"string"==d?a[b]:c}function h(c,d){if(p.length){var f=0<=a.a.l(p,a.k.o(d[0]));a.a.qb(d[0],f);l&&!f&&a.i.p(a.a.da,null,[b,"change"])}}var k=0!=b.length&&b.multiple?b.scrollTop:null;c=a.a.c(c());var m=d.get("optionsIncludeDestroyed"),f={},p;p=b.multiple?a.a.ha(e(),a.k.o):0<=b.selectedIndex?[a.k.o(b.options[b.selectedIndex])]:[];if(c){"undefined"==typeof c.length&&(c=[c]);
var s=a.a.ga(c,function(b){return m||b===q||null===b||!a.a.c(b._destroy)});d.has("optionsCaption")&&(c=a.a.c(d.get("optionsCaption")),null!==c&&c!==q&&s.unshift(f))}else c=[];var l=!1;c=h;d.has("optionsAfterRender")&&(c=function(b,c){h(0,c);a.i.p(d.get("optionsAfterRender"),null,[c[0],b!==f?b:q])});a.a.Ja(b,s,function(b,c,e){e.length&&(p=e[0].selected?[a.k.o(e[0])]:[],l=!0);c=w.createElement("option");b===f?(a.a.Ma(c,d.get("optionsCaption")),a.k.na(c,q)):(e=g(b,d.get("optionsValue"),b),a.k.na(c,a.a.c(e)),
b=g(b,d.get("optionsText"),e),a.a.Ma(c,b));return[c]},null,c);(b.multiple?p.length&&e().length<p.length:p.length&&0<=b.selectedIndex?a.k.o(b.options[b.selectedIndex])!==p[0]:p.length||0<=b.selectedIndex)&&a.i.p(a.a.da,null,[b,"change"]);a.a.Hb(b);k&&20<Math.abs(k-b.scrollTop)&&(b.scrollTop=k)}};a.d.options.Ea=a.a.f.D();a.d.selectedOptions={after:["options","foreach"],init:function(b,c,d){a.a.r(b,"change",function(){var e=c(),g=[];a.a.n(b.getElementsByTagName("option"),function(b){b.selected&&g.push(a.k.o(b))});
a.g.oa(e,d,"selectedOptions",g)})},update:function(b,c){if("select"!=a.a.v(b))throw Error("values binding applies only to SELECT elements");var d=a.a.c(c());d&&"number"==typeof d.length&&a.a.n(b.getElementsByTagName("option"),function(b){var c=0<=a.a.l(d,a.k.o(b));a.a.qb(b,c)})}};a.g.U.selectedOptions=!0;a.d.style={update:function(b,c){var d=a.a.c(c()||{});a.a.K(d,function(c,d){d=a.a.c(d);b.style[c]=d||""})}};a.d.submit={init:function(b,c,d,e,g){if("function"!=typeof c())throw Error("The value for a submit binding must be a function");
a.a.r(b,"submit",function(a){var d,e=c();try{d=e.call(g.$data,b)}finally{!0!==d&&(a.preventDefault?a.preventDefault():a.returnValue=!1)}})}};a.d.text={init:function(){return{controlsDescendantBindings:!0}},update:function(b,c){a.a.Ma(b,c())}};a.e.P.text=!0;a.d.uniqueName={init:function(b,c){if(c()){var d="ko_unique_"+ ++a.d.uniqueName.Bb;a.a.pb(b,d)}}};a.d.uniqueName.Bb=0;a.d.value={after:["options","foreach"],init:function(b,c,d){function e(){k=!1;var e=c(),f=a.k.o(b);a.g.oa(e,d,"value",f)}var g=
["change"],h=d.get("valueUpdate"),k=!1;h&&("string"==typeof h&&(h=[h]),a.a.X(g,h),g=a.a.Va(g));!a.a.ja||"input"!=b.tagName.toLowerCase()||"text"!=b.type||"off"==b.autocomplete||b.form&&"off"==b.form.autocomplete||-1!=a.a.l(g,"propertychange")||(a.a.r(b,"propertychange",function(){k=!0}),a.a.r(b,"blur",function(){k&&e()}));a.a.n(g,function(c){var d=e;a.a.ac(c,"after")&&(d=function(){setTimeout(e,0)},c=c.substring(5));a.a.r(b,c,d)})},update:function(b,c){var d="select"===a.a.v(b),e=a.a.c(c()),g=a.k.o(b);
e!==g&&(g=function(){a.k.na(b,e)},g(),d&&(e!==a.k.o(b)?a.i.p(a.a.da,null,[b,"change"]):setTimeout(g,0)))}};a.g.U.value=!0;a.d.visible={update:function(b,c){var d=a.a.c(c()),e="none"!=b.style.display;d&&!e?b.style.display="":!d&&e&&(b.style.display="none")}};(function(b){a.d[b]={init:function(c,d,e,g,h){return a.d.event.init.call(this,c,function(){var a={};a[b]=d();return a},e,g,h)}}})("click");a.w=function(){};a.w.prototype.renderTemplateSource=function(){throw Error("Override renderTemplateSource");
};a.w.prototype.createJavaScriptEvaluatorBlock=function(){throw Error("Override createJavaScriptEvaluatorBlock");};a.w.prototype.makeTemplateSource=function(b,c){if("string"==typeof b){c=c||w;var d=c.getElementById(b);if(!d)throw Error("Cannot find template with ID "+b);return new a.m.j(d)}if(1==b.nodeType||8==b.nodeType)return new a.m.W(b);throw Error("Unknown template type: "+b);};a.w.prototype.renderTemplate=function(a,c,d,e){a=this.makeTemplateSource(a,e);return this.renderTemplateSource(a,c,
d)};a.w.prototype.isTemplateRewritten=function(a,c){return!1===this.allowTemplateRewriting?!0:this.makeTemplateSource(a,c).data("isRewritten")};a.w.prototype.rewriteTemplate=function(a,c,d){a=this.makeTemplateSource(a,d);c=c(a.text());a.text(c);a.data("isRewritten",!0)};a.b("templateEngine",a.w);a.Oa=function(){function b(b,c,d,k){b=a.g.Ga(b);for(var m=a.g.Y,f=0;f<b.length;f++){var p=b[f].key;if(m.hasOwnProperty(p)){var s=m[p];if("function"===typeof s){if(p=s(b[f].value))throw Error(p);}else if(!s)throw Error("This template engine does not support the '"+
p+"' binding within its templates");}}d="ko.__tr_ambtns(function($context,$element){return(function(){return{ "+a.g.ka(b,{valueAccessors:!0})+" } })()},'"+d.toLowerCase()+"')";return k.createJavaScriptEvaluatorBlock(d)+c}var c=/(<([a-z]+\d*)(?:\s+(?!data-bind\s*=\s*)[a-z0-9\-]+(?:=(?:\"[^\"]*\"|\'[^\']*\'))?)*\s+)data-bind\s*=\s*(["'])([\s\S]*?)\3/gi,d=/\x3c!--\s*ko\b\s*([\s\S]*?)\s*--\x3e/g;return{Ib:function(b,c,d){c.isTemplateRewritten(b,d)||c.rewriteTemplate(b,function(b){return a.Oa.Ub(b,c)},
d)},Ub:function(a,g){return a.replace(c,function(a,c,d,f,e){return b(e,c,d,g)}).replace(d,function(a,c){return b(c,"\x3c!-- ko --\x3e","#comment",g)})},yb:function(b,c){return a.u.Ca(function(d,k){var m=d.nextSibling;m&&m.nodeName.toLowerCase()===c&&a.pa(m,b,k)})}}}();a.b("__tr_ambtns",a.Oa.yb);(function(){a.m={};a.m.j=function(a){this.j=a};a.m.j.prototype.text=function(){var b=a.a.v(this.j),b="script"===b?"text":"textarea"===b?"value":"innerHTML";if(0==arguments.length)return this.j[b];var c=arguments[0];
"innerHTML"===b?a.a.Ka(this.j,c):this.j[b]=c};var b=a.a.f.D()+"_";a.m.j.prototype.data=function(c){if(1===arguments.length)return a.a.f.get(this.j,b+c);a.a.f.set(this.j,b+c,arguments[1])};var c=a.a.f.D();a.m.W=function(a){this.j=a};a.m.W.prototype=new a.m.j;a.m.W.prototype.text=function(){if(0==arguments.length){var b=a.a.f.get(this.j,c)||{};b.Pa===q&&b.sa&&(b.Pa=b.sa.innerHTML);return b.Pa}a.a.f.set(this.j,c,{Pa:arguments[0]})};a.m.j.prototype.nodes=function(){if(0==arguments.length)return(a.a.f.get(this.j,
c)||{}).sa;a.a.f.set(this.j,c,{sa:arguments[0]})};a.b("templateSources",a.m);a.b("templateSources.domElement",a.m.j);a.b("templateSources.anonymousTemplate",a.m.W)})();(function(){function b(b,c,d){var e;for(c=a.e.nextSibling(c);b&&(e=b)!==c;)b=a.e.nextSibling(e),d(e,b)}function c(c,d){if(c.length){var f=c[0],e=c[c.length-1],g=f.parentNode,h=a.H.instance,n=h.preprocessNode;if(n){b(f,e,function(a,b){var c=a.previousSibling,d=n.call(h,a);d&&(a===f&&(f=d[0]||b),a===e&&(e=d[d.length-1]||c))});c.length=
0;if(!f)return;f===e?c.push(f):(c.push(f,e),a.a.$(c,g))}b(f,e,function(b){1!==b.nodeType&&8!==b.nodeType||a.Sa(d,b)});b(f,e,function(b){1!==b.nodeType&&8!==b.nodeType||a.u.vb(b,[d])});a.a.$(c,g)}}function d(a){return a.nodeType?a:0<a.length?a[0]:null}function e(b,e,f,h,s){s=s||{};var l=b&&d(b),l=l&&l.ownerDocument,n=s.templateEngine||g;a.Oa.Ib(f,n,l);f=n.renderTemplate(f,h,s,l);if("number"!=typeof f.length||0<f.length&&"number"!=typeof f[0].nodeType)throw Error("Template engine must return an array of DOM nodes");
l=!1;switch(e){case "replaceChildren":a.e.S(b,f);l=!0;break;case "replaceNode":a.a.nb(b,f);l=!0;break;case "ignoreTargetNode":break;default:throw Error("Unknown renderMode: "+e);}l&&(c(f,h),s.afterRender&&a.i.p(s.afterRender,null,[f,h.$data]));return f}var g;a.La=function(b){if(b!=q&&!(b instanceof a.w))throw Error("templateEngine must inherit from ko.templateEngine");g=b};a.Ia=function(b,c,f,h,s){f=f||{};if((f.templateEngine||g)==q)throw Error("Set a template engine before calling renderTemplate");
s=s||"replaceChildren";if(h){var l=d(h);return a.h(function(){var g=c&&c instanceof a.G?c:new a.G(a.a.c(c)),r="function"==typeof b?b(g.$data,g):b,g=e(h,s,r,g,f);"replaceNode"==s&&(h=g,l=d(h))},null,{ua:function(){return!l||!a.a.va(l)},I:l&&"replaceNode"==s?l.parentNode:l})}return a.u.Ca(function(d){a.Ia(b,c,f,d,"replaceNode")})};a.$b=function(b,d,f,g,h){function l(a,b){c(b,r);f.afterRender&&f.afterRender(b,a)}function n(a,c){r=h.createChildContext(a,f.as,function(a){a.$index=c});var d="function"==
typeof b?b(a,r):b;return e(null,"ignoreTargetNode",d,r,f)}var r;return a.h(function(){var b=a.a.c(d)||[];"undefined"==typeof b.length&&(b=[b]);b=a.a.ga(b,function(b){return f.includeDestroyed||b===q||null===b||!a.a.c(b._destroy)});a.i.p(a.a.Ja,null,[g,b,n,f,l])},null,{I:g})};var h=a.a.f.D();a.d.template={init:function(b,c){var d=a.a.c(c());"string"==typeof d||d.name?a.e.Z(b):(d=a.e.childNodes(b),d=a.a.Vb(d),(new a.m.W(b)).nodes(d));return{controlsDescendantBindings:!0}},update:function(b,c,d,e,g){c=
a.a.c(c());d={};e=!0;var l,n=null;"string"!=typeof c&&(d=c,c=a.a.c(d.name),"if"in d&&(e=a.a.c(d["if"])),e&&"ifnot"in d&&(e=!a.a.c(d.ifnot)),l=a.a.c(d.data));"foreach"in d?n=a.$b(c||b,e&&d.foreach||[],d,b,g):e?(g="data"in d?g.createChildContext(l,d.as):g,n=a.Ia(c||b,g,d,b)):a.e.Z(b);g=n;(l=a.a.f.get(b,h))&&"function"==typeof l.B&&l.B();a.a.f.set(b,h,g&&g.aa()?g:q)}};a.g.Y.template=function(b){b=a.g.Ga(b);return 1==b.length&&b[0].unknown||a.g.Sb(b,"name")?null:"This template engine does not support anonymous templates nested within its templates"};
a.e.P.template=!0})();a.b("setTemplateEngine",a.La);a.b("renderTemplate",a.Ia);a.a.ra=function(){function a(b,d,e,g,h){var k=Math.min,m=Math.max,f=[],p,q=b.length,l,n=d.length,r=n-q||1,v=q+n+1,t,u,w;for(p=0;p<=q;p++)for(u=t,f.push(t=[]),w=k(n,p+r),l=m(0,p-1);l<=w;l++)t[l]=l?p?b[p-1]===d[l-1]?u[l-1]:k(u[l]||v,t[l-1]||v)+1:l+1:p+1;k=[];m=[];r=[];p=q;for(l=n;p||l;)n=f[p][l]-1,l&&n===f[p][l-1]?m.push(k[k.length]={status:e,value:d[--l],index:l}):p&&n===f[p-1][l]?r.push(k[k.length]={status:g,value:b[--p],
index:p}):(--l,--p,h.sparse||k.push({status:"retained",value:d[l]}));if(m.length&&r.length){b=10*q;var z;for(d=e=0;(h.dontLimitMoves||d<b)&&(z=m[e]);e++){for(g=0;f=r[g];g++)if(z.value===f.value){z.moved=f.index;f.moved=z.index;r.splice(g,1);d=g=0;break}d+=g}}return k.reverse()}return function(c,d,e){e="boolean"===typeof e?{dontLimitMoves:e}:e||{};c=c||[];d=d||[];return c.length<=d.length?a(c,d,"added","deleted",e):a(d,c,"deleted","added",e)}}();a.b("utils.compareArrays",a.a.ra);(function(){function b(b,
c,g,h,k){var m=[],f=a.h(function(){var f=c(g,k,a.a.$(m,b))||[];0<m.length&&(a.a.nb(m,f),h&&a.i.p(h,null,[g,f,k]));m.splice(0,m.length);a.a.X(m,f)},null,{I:b,ua:function(){return!a.a.Ra(m)}});return{R:m,h:f.aa()?f:q}}var c=a.a.f.D();a.a.Ja=function(d,e,g,h,k){function m(b,c){x=s[c];t!==c&&(z[b]=x);x.za(t++);a.a.$(x.R,d);r.push(x);w.push(x)}function f(b,c){if(b)for(var d=0,e=c.length;d<e;d++)c[d]&&a.a.n(c[d].R,function(a){b(a,d,c[d].fa)})}e=e||[];h=h||{};var p=a.a.f.get(d,c)===q,s=a.a.f.get(d,c)||[],
l=a.a.ha(s,function(a){return a.fa}),n=a.a.ra(l,e,h.dontLimitMoves),r=[],v=0,t=0,u=[],w=[];e=[];for(var z=[],l=[],x,A=0,y,B;y=n[A];A++)switch(B=y.moved,y.status){case "deleted":B===q&&(x=s[v],x.h&&x.h.B(),u.push.apply(u,a.a.$(x.R,d)),h.beforeRemove&&(e[A]=x,w.push(x)));v++;break;case "retained":m(A,v++);break;case "added":B!==q?m(A,B):(x={fa:y.value,za:a.q(t++)},r.push(x),w.push(x),p||(l[A]=x))}f(h.beforeMove,z);a.a.n(u,h.beforeRemove?a.L:a.removeNode);for(var A=0,p=a.e.firstChild(d),C;x=w[A];A++){x.R||
a.a.extend(x,b(d,g,x.fa,k,x.za));for(v=0;n=x.R[v];p=n.nextSibling,C=n,v++)n!==p&&a.e.eb(d,n,C);!x.Ob&&k&&(k(x.fa,x.R,x.za),x.Ob=!0)}f(h.beforeRemove,e);f(h.afterMove,z);f(h.afterAdd,l);a.a.f.set(d,c,r)}})();a.b("utils.setDomNodeChildrenFromArrayMapping",a.a.Ja);a.J=function(){this.allowTemplateRewriting=!1};a.J.prototype=new a.w;a.J.prototype.renderTemplateSource=function(b){var c=(9>a.a.ja?0:b.nodes)?b.nodes():null;if(c)return a.a.Q(c.cloneNode(!0).childNodes);b=b.text();return a.a.Fa(b)};a.J.Aa=
new a.J;a.La(a.J.Aa);a.b("nativeTemplateEngine",a.J);(function(){a.Ba=function(){var a=this.Rb=function(){if("undefined"==typeof u||!u.tmpl)return 0;try{if(0<=u.tmpl.tag.tmpl.open.toString().indexOf("__"))return 2}catch(a){}return 1}();this.renderTemplateSource=function(b,e,g){g=g||{};if(2>a)throw Error("Your version of jQuery.tmpl is too old. Please upgrade to jQuery.tmpl 1.0.0pre or later.");var h=b.data("precompiled");h||(h=b.text()||"",h=u.template(null,"{{ko_with $item.koBindingContext}}"+h+
"{{/ko_with}}"),b.data("precompiled",h));b=[e.$data];e=u.extend({koBindingContext:e},g.templateOptions);e=u.tmpl(h,b,e);e.appendTo(w.createElement("div"));u.fragments={};return e};this.createJavaScriptEvaluatorBlock=function(a){return"{{ko_code ((function() { return "+a+" })()) }}"};this.addTemplate=function(a,b){w.write("<script type='text/html' id='"+a+"'>"+b+"\x3c/script>")};0<a&&(u.tmpl.tag.ko_code={open:"__.push($1 || '');"},u.tmpl.tag.ko_with={open:"with($1) {",close:"} "})};a.Ba.prototype=
new a.w;var b=new a.Ba;0<b.Rb&&a.La(b);a.b("jqueryTmplTemplateEngine",a.Ba)})()})})();})();

/*
  knockback.js 0.19.2
  Copyright (c)  2011-2014 Kevin Malakoff.
  License: MIT (http://www.opensource.org/licenses/mit-license.php)
  Source: https://github.com/kmalakoff/knockback
  Dependencies: Knockout.js, Backbone.js, and Underscore.js (or LoDash.js).
  Optional dependencies: Backbone.ModelRef.js and BackboneORM.
*/
!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t(require("knockout"),require("backbone"),require("underscore"),function(){try{return require("jquery")}catch(e){}}()):"function"==typeof define&&define.amd?define('knockback',["knockout","backbone","underscore"],function(r,n,o){return t(r,n,o,e.jQuery)}):"object"==typeof exports?exports.kb=t(require("knockout"),require("backbone"),require("underscore"),function(){try{return require("jquery")}catch(e){}}()):e.kb=t(e.ko,e.Backbone,e._,e.jQuery)}(this,function(e,t,r,n){return function(e){function t(n){if(r[n])return r[n].exports;var o=r[n]={exports:{},id:n,loaded:!1};return e[n].call(o.exports,o,o.exports,t),o.loaded=!0,o.exports}var r={};return t.m=e,t.c=r,t.p="",t(0)}([function(e,t,r){r(1),r(2),r(3),r(4),r(5),r(6),r(7),r(8),r(9),r(10),r(11),r(12),r(13),r(15),r(16),r(17),r(18),r(19),e.exports=r(14)},function(e,t,r){var n,o,i,s,a,l,u,c,d=function(e,t){return function(){return e.apply(t,arguments)}},p=[].indexOf||function(e){for(var t=0,r=this.length;r>t;t++)if(t in this&&this[t]===e)return t;return-1};c=a=r(6),u=c._,l=c.ko,i=0,n=-1,o=1,s=["destroy","shareOptions","filters","comparator","sortAttribute","viewModelByModel","hasViewModels"],a.compare=function(e,t){return u.isString(e)?e.localeCompare(""+t):u.isString(t)?t.localeCompare(""+e):e===t?i:t>e?n:o},a.CollectionObservable=function(){function e(e,t){return this._onCollectionChange=d(this._onCollectionChange,this),a.ignore(function(r){return function(){var n,o,i;return!u.isUndefined(t)||e instanceof a.Collection?u.isArray(e)&&(e=new a.Collection(e)):(i=[new a.Collection,e],e=i[0],t=i[1]),t||(t={}),o=a.utils.wrappedObservable(r,l.observableArray([])),o.__kb_is_co=!0,r.in_edit=0,r.__kb||(r.__kb={}),t=a.utils.collapseOptions(t),t.auto_compact&&(r.auto_compact=!0),r._comparator=l.observable(t.sort_attribute?r._attributeComparator(t.sort_attribute):t.comparator),r._filters=l.observableArray(t.filters?u.isArray(t.filters)?t.filters:t.filters?[t.filters]:void 0:[]),n=r.create_options={store:a.Store.useOptionsOrCreate(t,e,o)},r.path=t.path,n.factory=a.utils.wrappedFactory(o,r._shareOrCreateFactory(t)),n.path=a.utils.pathJoin(t.path,"models"),n.creator=n.factory.creatorForPath(null,n.path),n.creator&&(r.models_only=n.creator.models_only),a.publishMethods(o,r,s),r._collection=l.observable(e),o.collection=r.collection=l.computed({read:function(){return r._collection()},write:function(e){return a.ignore(function(){var t;if((t=r._collection())!==e)return t&&t.unbind("all",r._onCollectionChange),e&&e.bind("all",r._onCollectionChange),r._collection(e)})}}),e&&e.bind("all",r._onCollectionChange),r._mapper=l.computed(function(){var e,t,n,i,s,c,d,p;if(e=r._comparator(),i=r._filters())for(d=0,p=i.length;p>d;d++)n=i[d],l.utils.unwrapObservable(n);return t=r._collection(),r.in_edit?void 0:(o=a.utils.wrappedObservable(r),t&&(s=t.models),s&&0!==t.models.length?(s=u.filter(s,function(e){return!i.length||r._selectModel(e)}),c=e?u.map(s,function(e){return r._createViewModel(e)}).sort(e):r.models_only?i.length?s:s.slice():u.map(s,function(e){return r._createViewModel(e)})):c=[],r.in_edit++,o(c),r.in_edit--)}),o.subscribe(u.bind(r._onObservableArrayChange,r)),!a.statistics||a.statistics.register("CollectionObservable",r),o}}(this))}return e.extend=a.extend,e.prototype.destroy=function(){var e,t,r;return this.__kb_released=!0,r=a.utils.wrappedObservable(this),t=a.peek(this._collection),t&&(t.unbind("all",this._onCollectionChange),e=a.peek(r),e.splice(0,e.length)),this.collection.dispose(),this._collection=r.collection=this.collection=null,this._mapper.dispose(),this._mapper=null,a.release(this._filters),this._filters=null,this._comparator(null),this._comparator=null,this.create_options=null,r.collection=null,a.utils.wrappedDestroy(this),!a.statistics||a.statistics.unregister("CollectionObservable",this)},e.prototype.shareOptions=function(){var e;return e=a.utils.wrappedObservable(this),{store:a.utils.wrappedStore(e),factory:a.utils.wrappedFactory(e)}},e.prototype.filters=function(e){return this._filters(e?u.isArray(e)?e:[e]:[])},e.prototype.comparator=function(e){return this._comparator(e)},e.prototype.sortAttribute=function(e){return this._comparator(e?this._attributeComparator(e):null)},e.prototype.viewModelByModel=function(e){var t;return this.models_only?null:(t=e.hasOwnProperty(e.idAttribute)?e.idAttribute:"cid",u.find(a.peek(a.utils.wrappedObservable(this)),function(r){var n;return(null!=r&&null!=(n=r.__kb)?n.object:void 0)?r.__kb.object[t]===e[t]:!1}))},e.prototype.hasViewModels=function(){return!this.models_only},e.prototype.compact=function(){return a.ignore(function(e){return function(){var t;return t=a.utils.wrappedObservable(e),a.utils.wrappedStoreIsOwned(t)?(a.utils.wrappedStore(t).clear(),e._collection.notifySubscribers(e._collection())):void 0}}(this))},e.prototype._shareOrCreateFactory=function(e){var t,r,n,o;if(t=a.utils.pathJoin(e.path,"models"),n=e.factories,(o=e.factory)&&(r=o.creatorForPath(null,t))&&(!n||n.models===r)){if(!n)return o;if(o.hasPathMappings(n,e.path))return o}return o=new a.Factory(e.factory),n&&o.addPathMappings(n,e.path),o.creatorForPath(null,t)||(e.hasOwnProperty("models_only")?e.models_only?o.addPathMapping(t,{models_only:!0}):o.addPathMapping(t,a.ViewModel):e.view_model?o.addPathMapping(t,e.view_model):e.create?o.addPathMapping(t,{create:e.create}):o.addPathMapping(t,a.ViewModel)),o},e.prototype._onCollectionChange=function(e,t){return a.ignore(function(r){return function(){var n,o,i,s;if(!r.in_edit)switch(e){case"reset":r.auto_compact?r.compact():r._collection.notifySubscribers(r._collection());break;case"sort":case"resort":r._collection.notifySubscribers(r._collection());break;case"new":case"add":if(!r._selectModel(t))return;if(i=a.utils.wrappedObservable(r),n=r._collection(),-1===n.indexOf(t))return;if(s=r.viewModelByModel(t))return;r.in_edit++,(o=r._comparator())?(i().push(r._createViewModel(t)),i.sort(o)):i.splice(n.indexOf(t),0,r._createViewModel(t)),r.in_edit--;break;case"remove":case"destroy":r._onModelRemove(t);break;case"change":r._selectModel(t)?(s=r.models_only?t:r.viewModelByModel(t),s?(o=r._comparator())&&(i=a.utils.wrappedObservable(r),r.in_edit++,i.sort(o),r.in_edit--):r._onCollectionChange("add",t)):r._onModelRemove(t)}}}(this))},e.prototype._onModelRemove=function(e){var t,r;return(r=this.models_only?e:this.viewModelByModel(e))?(t=a.utils.wrappedObservable(this),this.in_edit++,t.remove(r),this.in_edit--):void 0},e.prototype._onObservableArrayChange=function(e){return a.ignore(function(t){return function(){var r,n,o,i,s,l,c,d,p;if(!t.in_edit&&(t.models_only&&(!e.length||a.utils.hasModelSignature(e[0]))||!t.models_only&&(!e.length||u.isObject(e[0])&&!a.utils.hasModelSignature(e[0]))||a._throwUnexpected(t,"incorrect type passed"),s=a.utils.wrappedObservable(t),r=a.peek(t._collection),n=a.peek(t._filters).length,r)){if(c=e,t.models_only)i=u.filter(e,function(e){return!n||t._selectModel(e)});else for(!n||(c=[]),i=[],d=0,p=e.length;p>d;d++){if(l=e[d],o=a.utils.wrappedObject(l),n){if(!t._selectModel(o))continue;c.push(l)}t.create_options.store.findOrReplace(o,t.create_options.creator,l),i.push(o)}t.in_edit++,e.length===c.length||s(c),u.isEqual(r.models,i)||r.reset(i),t.in_edit--}}}(this))},e.prototype._attributeComparator=function(e){var t;return t=function(t,r){var n;return n=l.utils.unwrapObservable(e),a.compare(t.get(n),r.get(n))},this.models_only?t:function(e,r){return t(a.utils.wrappedModel(e),a.utils.wrappedModel(r))}},e.prototype._createViewModel=function(e){return this.models_only?e:this.create_options.store.findOrCreate(e,this.create_options)},e.prototype._selectModel=function(e){var t,r,n,o,i;for(r=a.peek(this._filters),n=0,o=r.length;o>n;n++)if(t=r[n],t=a.peek(t),u.isFunction(t)){if(!t(e))return!1}else if(u.isArray(t)){if(i=e.id,p.call(t,i)<0)return!1}else if(e.id!==t)return!1;return!0},e}(),a.collectionObservable=function(e,t){return new a.CollectionObservable(e,t)}},function(e,t,r){var n,o,i,s,a,l,u;u=o=r(6),l=u._,s=u.ko,n={"default":null,"backbone-orm":null,"backbone-associations":r(26),"backbone-relational":r(27),supermodel:r(28)},o.orm=n["default"];for(i in n)if(a=n[i],a&&a.isAvailable()){o.orm=a;break}e.exports=function(e){var t;null==e&&(e={});for(i in e)switch(a=e[i],i){case"orm":if(l.isString(a)){if(!n.hasOwnProperty(a)){console.log("Knockback configure: could not find orm: "+a+". Available: "+l.keys(n).join(", "));continue}if((t=n[a])&&!t.isAvailable()){console.log("Knockback configure: could not enable orm "+a+". Make sure it is included before Knockback");continue}o.orm=t;continue}o.orm=a;break;default:o[i]=a}}},function(e,t,r){var n,o,i,s,a=function(e,t){return function(){return e.apply(t,arguments)}};s=n=r(6),i=s._,o=s.ko,n.EventWatcher=function(){function e(e,t,r){this._unbindCallbacks=a(this._unbindCallbacks,this),this._onModelUnloaded=a(this._onModelUnloaded,this),this._onModelLoaded=a(this._onModelLoaded,this),this.__kb||(this.__kb={}),this.__kb.callbacks={},this.ee=null,r&&this.registerCallbacks(t,r),e&&this.emitter(e)}return e.useOptionsOrCreate=function(e,t,r,o){return e.event_watcher?(e.event_watcher.emitter()!==t&&e.event_watcher.model_ref!==t&&n._throwUnexpected(this,"emitter not matching"),n.utils.wrappedEventWatcher(r,e.event_watcher).registerCallbacks(r,o)):(n.utils.wrappedEventWatcherIsOwned(r,!0),n.utils.wrappedEventWatcher(r,new n.EventWatcher(t)).registerCallbacks(r,o))},e.prototype.destroy=function(){return this.emitter(null),this.__kb.callbacks=null,n.utils.wrappedDestroy(this)},e.prototype.emitter=function(e){return 0===arguments.length||this.ee===e?this.ee:(this.model_ref&&(this.model_ref.unbind("loaded",this._onModelLoaded),this.model_ref.unbind("unloaded",this._onModelUnloaded),this.model_ref.release(),this.model_ref=null),n.Backbone&&n.Backbone.ModelRef&&e instanceof n.Backbone.ModelRef?(this.model_ref=e,this.model_ref.retain(),this.model_ref.bind("loaded",this._onModelLoaded),this.model_ref.bind("unloaded",this._onModelUnloaded),e=this.model_ref.model()||null):delete this.model_ref,this.ee!==e&&(e?this._onModelLoaded(e):this._onModelUnloaded(this.ee)),e)},e.prototype.registerCallbacks=function(e,t){var r,s,a,l,u,c;for(e||n._throwMissing(this,"obj"),t||n._throwMissing(this,"callback_info"),s=t.event_selector?t.event_selector.split(" "):["change"],a=this.ee,l=function(r){return function(s){var l,u;return(l=r.__kb.callbacks[s])||(l=r.__kb.callbacks[s]={model:null,list:[],fn:function(e){var t,r,i,a;for(a=l.list,r=0,i=a.length;i>r;r++)t=a[r],t.update&&(e&&t.key&&e.hasChanged&&!e.hasChanged(o.utils.unwrapObservable(t.key))||(!n.statistics||n.statistics.addModelEvent({name:s,model:e,key:t.key,path:t.path}),t.update()));return null}}),l.list.push(u=i.defaults({obj:e},t)),a?r._onModelLoaded(a):void 0}}(this),u=0,c=s.length;c>u;u++)r=s[u],r&&l(r);return this},e.prototype.releaseCallbacks=function(e){var t,r,o;this.ee=null,o=this.__kb.callbacks;for(r in o)t=o[r],this._unbindCallbacks(r,t,n.wasReleased(e));return delete this.__kb.callbacks},e.prototype._onModelLoaded=function(e){var t,r,o,i,s,a,l,u;this.ee=e,a=this.__kb.callbacks;for(r in a)for(t=a[r],t.model&&t.model!==e&&this._unbindCallbacks(r,t,!0),t.model||(t.model=e,e.bind(r,t.fn)),l=t.list,i=0,s=l.length;s>i;i++)o=l[i],o.unbind_fn||(o.unbind_fn=null!=(u=n.orm)?u.bind(e,o.key,o.update,o.path):void 0),o.emitter&&o.emitter(e)},e.prototype._onModelUnloaded=function(e){var t,r,n;if(this.ee===e){this.ee=null,n=this.__kb.callbacks;for(r in n)t=n[r],this._unbindCallbacks(r,t)}},e.prototype._unbindCallbacks=function(e,t,r){var o,i,s,a;for(t.model&&(t.model.unbind(e,t.fn),t.model=null),a=t.list,i=0,s=a.length;s>i;i++)o=a[i],o.unbind_fn&&(o.unbind_fn(),o.unbind_fn=null),!o.emitter||r||n.wasReleased(o.obj)||o.emitter(null)},e}(),n.emitterObservable=function(e,t){return new n.EventWatcher(e,t)}},function(e,t,r){var n,o;o=(n=r(6))._,n.Factory=function(){function e(e){this.parent_factory=e,this.paths={}}return e.useOptionsOrCreate=function(e,t,r){var o;return e.factory&&(!e.factories||e.factories&&e.factory.hasPathMappings(e.factories,r))?n.utils.wrappedFactory(t,e.factory):(o=n.utils.wrappedFactory(t,new n.Factory(e.factory)),e.factories&&o.addPathMappings(e.factories,r),o)},e.prototype.hasPath=function(e){return this.paths.hasOwnProperty(e)||this.parent_factory&&this.parent_factory.hasPath(e)},e.prototype.addPathMapping=function(e,t){return this.paths[e]=t},e.prototype.addPathMappings=function(e,t){var r,o;for(o in e)r=e[o],this.paths[n.utils.pathJoin(t,o)]=r},e.prototype.hasPathMappings=function(e,t){var r,o,i,s;r=!0;for(s in e)o=e[s],r&=(i=this.creatorForPath(null,n.utils.pathJoin(t,s)))&&o===i;return r},e.prototype.creatorForPath=function(e,t){var r;return(r=this.paths[t])?r.view_model?r.view_model:r:this.parent_factory&&(r=this.parent_factory.creatorForPath(e,t))?r:null},e}()},function(e,t,r){(function(e){var t,n,o,i,s,a,l,u;s=null!=s?s:e,u=n=r(6),a=u._,o=u.ko,t=u.$,n.RECUSIVE_AUTO_INJECT=!0,o.bindingHandlers.inject={init:function(e,t,r,i){return n.Inject.inject(o.utils.unwrapObservable(t()),i,e,t,r)}},n.Inject=function(){function e(){}return e.inject=function(e,t,r,o,i,s){var l;return l=function(e){var l,u,c;if(a.isFunction(e))t=new e(t,r,o,i),n.releaseOnNodeRemove(t,r);else{e.view_model&&(t=new e.view_model(t,r,o,i),n.releaseOnNodeRemove(t,r));for(l in e)c=e[l],"view_model"!==l&&("create"===l?c(t,r,o,i):a.isObject(c)&&!a.isFunction(c)?(u=s||c&&c.create?{}:t,t[l]=n.Inject.inject(c,u,r,o,i,!0)):t[l]=c)}return t},s?l(e):n.ignore(function(){return l(e)})},e.injectViewModels=function(e){var t,r,o,i,l,u,c,d,p,f;for(d=[],u=function(e){var t,r,n,o,i;for(e.__kb_injected||e.attributes&&(t=a.find(e.attributes,function(e){return"kb-inject"===e.name}))&&(e.__kb_injected=!0,d.push({el:e,view_model:{},binding:t.value})),i=e.childNodes,n=0,o=i.length;o>n;n++)r=i[n],u(r)},!e&&(null!=s?s.document:void 0)&&(e=s.document),u(e),p=0,f=d.length;f>p;p++)r=d[p],(l=r.binding)&&(l.search(/[:]/)<0||(l="{"+l+"}"),i=new Function("","return ( "+l+" )")(),i||(i={}),!i.options||(c=i.options,delete i.options),c||(c={}),r.view_model=n.Inject.inject(i,r.view_model,r.el,null,null,!0),t=r.view_model.afterBinding||c.afterBinding,o=r.view_model.beforeBinding||c.beforeBinding),o&&o(r.view_model,r.el,c),n.applyBindings(r.view_model,r.el,c),t&&t(r.view_model,r.el,c);return d},e}(),l=o.applyBindings,o.applyBindings=function(e,t){var r;return r=n.RECUSIVE_AUTO_INJECT?n.injectViewModels(t):[],r.length?void 0:l.apply(this,arguments)},n.injectViewModels=n.Inject.injectViewModels,"undefined"!=typeof document&&null!==document&&(t?t(function(){return n.injectViewModels()}):(i=function(){return"complete"!==document.readyState?setTimeout(i,0):n.injectViewModels()})())}).call(t,function(){return this}())},function(e,t,r){(function(t){var n,o,i,s,a,l;a=null!=a?a:t,s=r(20),o=function(e,t){var r,n;for(r in t)n=t[r],e[r]=n;return e};var u=function(){},c=function(e,t,r){var n;return n=t&&t.hasOwnProperty("constructor")?t.constructor:function(){e.apply(this,arguments)},o(n,e),u.prototype=e.prototype,n.prototype=new u,t&&o(n.prototype,t),r&&o(n,r),n.prototype.constructor=n,n.__super__=e.prototype,n},d=function(e,t){var r=c(this,e,t);return r.extend=this.extend,r};e.exports=i=function(){function e(){}var t;return e.VERSION="0.19.2",e.TYPE_UNKNOWN=0,e.TYPE_SIMPLE=1,e.TYPE_ARRAY=2,e.TYPE_MODEL=3,e.TYPE_COLLECTION=4,e.wasReleased=function(e){return!e||e.__kb_released},e.isReleaseable=function(t,r){var n,o;if(null==r&&(r=0),!t||t!==Object(t)||t.__kb_released)return!1;if(s.isObservable(t)||t instanceof e.ViewModel)return!0;if("function"==typeof t||t instanceof e.Model||t instanceof e.Collection)return!1;if("function"==typeof t.dispose||"function"==typeof t.destroy||"function"==typeof t.release)return!0;if(1>r)for(n in t)if(o=t[n],"__kb"!==n&&e.isReleaseable(o,r+1))return!0;return!1},e.release=function(t){var r,n,o;if(e.isReleaseable(t))if(l.isArray(t))for(n in t)o=t[n],e.isReleaseable(o)&&(t[n]=null,e.release(o));else{if(t.__kb_released=!0,s.isObservable(t)&&l.isArray(r=e.peek(t))){if(t.__kb_is_co||t.__kb_is_o&&t.valueType()===e.TYPE_COLLECTION)return t.destroy();for(n in r)o=r[n],e.isReleaseable(o)&&(r[n]=null,e.release(o));return void("function"==typeof t.dispose&&t.dispose())}"function"==typeof t.release?t.release():"function"==typeof t.destroy?t.destroy():"function"==typeof t.dispose?t.dispose():s.isObservable(t)||this.releaseKeys(t)}},e.releaseKeys=function(t){var r,n;for(r in t)n=t[r],"__kb"!==r&&e.isReleaseable(n)&&(t[r]=null,e.release(n))},e.releaseOnNodeRemove=function(t,r){return t||e._throwUnexpected(this,"missing view model"),r||e._throwUnexpected(this,"missing node"),s.utils.domNodeDisposal.addDisposeCallback(r,function(){return e.release(t)})},e.renderTemplate=function(t,r,n){var o,i,l;return null==n&&(n={}),(o=null!=a?a.document:void 0)?(i=o.createElement("div"),l=s.renderTemplate(t,r,n,i,"replaceChildren"),1===i.childNodes.length&&(i=i.childNodes[0]),e.releaseOnNodeRemove(r,i),l.dispose(),r.afterRender&&!n.afterRender&&r.afterRender(i),i):"undefined"!=typeof console&&null!==console?console.log("renderTemplate: document is undefined"):void 0},e.applyBindings=function(t,r){return s.applyBindings(t,r),e.releaseOnNodeRemove(t,r)},e.getValue=function(t,r,n){var o;if(t)return l.isFunction(t[r])&&(null!=(o=e.orm)?o.useFunction(t,r):void 0)?t[r]():n?t.get.apply(t,l.map([r].concat(n),function(t){return e.peek(t)})):t.get(r)},e.setValue=function(t,r,n){var o,i;if(t)return l.isFunction(t[r])&&(null!=(i=e.orm)?i.useFunction(t,r):void 0)?t[r](n):((o={})[r]=n,t.set(o))},e.ignore=(null!=(t=s.dependencyDetection)?t.ignore:void 0)||function(e,t,r){var n;return n=null,s.computed(function(){return n=e.apply(t,r||[])}).dispose(),n},e.extend=d,e._throwMissing=function(e,t){throw""+(l.isString(e)?e:e.constructor.name)+": "+t+" is missing"},e._throwUnexpected=function(e,t){throw""+(l.isString(e)?e:e.constructor.name)+": "+t+" is unexpected"},e.publishMethods=function(t,r,n){var o,i,s;for(i=0,s=n.length;s>i;i++)o=n[i],t[o]=e._.bind(r[o],r)},e.peek=function(t){return s.isObservable(t)?t.peek?t.peek():e.ignore(function(){return t()}):t},e}(),a.Parse?(n=i.Parse=a.Parse,l=i._=a.Parse._):(n=i.Backbone=r(21),l=i._=r(22)),i.ko=s,i.Collection=n.Collection,i.Model=n.Object||n.Model,i.Events=n.Events,i.$=a.jQuery||a.$;try{i.$||(i.$=r(23))}catch(p){}}).call(t,function(){return this}())},function(e,t,r){var n,o,i,s,a;o=(n=r(6)).ko,(null!=(s=o.subscribable)&&null!=(a=s.fn)?a.extend:void 0)&&(i=o.subscribable.fn.extend,o.subscribable.fn.extend=function(){var e,t;return e=i.apply(this,arguments),e!==this&&n.isReleaseable(this)&&(t=e.dispose,e.dispose=function(r){return function(){return null!=t&&t.apply(e,arguments),n.release(r)}}(this)),e})},function(e,t,r){var n,o,i,s,a,l,u;u=s=r(6),l=u._,a=u.ko,i=r(11),o=["value","valueType","destroy"],n=["args","read","write"],s.Observable=function(){function e(e,t,r,u){return this._vm=null!=u?u:{},s.ignore(function(u){return function(){var c,d,p,f,_,b;for(t||s._throwMissing(u,"key_or_info"),u.key=t.key||t,_=0,b=n.length;b>_;_++)p=n[_],t[p]&&(u[p]=t[p]);return c=s.utils.collapseOptions(r),d=c.event_watcher,delete c.event_watcher,u._value=new i(c),u._model=a.observable(),f=s.utils.wrappedObservable(u,a.computed({read:function(){var e,t,r,n,o,i,c;for(o=u._model(),i=t=[u.key].concat(u.args||[]),r=0,n=i.length;n>r;r++)e=i[r],a.utils.unwrapObservable(e);return null!=(c=s.utils.wrappedEventWatcher(u))&&c.emitter(o||null),u.read?u.update(u.read.apply(u._vm,t)):l.isUndefined(o)||s.ignore(function(){return u.update(s.getValue(o,s.peek(u.key),u.args))}),u._value.value()},write:function(e){return s.ignore(function(){var t,r;return t=s.utils.unwrapModels(e),r=s.peek(u._model),u.write?(u.write.call(u._vm,t),e=s.getValue(r,s.peek(u.key),u.args)):r&&s.setValue(r,s.peek(u.key),t),u.update(e)})},owner:u._vm})),f.__kb_is_o=!0,c.store=s.utils.wrappedStore(f,c.store),c.path=s.utils.pathJoin(c.path,u.key),c.factories&&("function"==typeof c.factories||c.factories.create)?(c.factory=s.utils.wrappedFactory(f,new s.Factory(c.factory)),c.factory.addPathMapping(c.path,c.factories)):c.factory=s.Factory.useOptionsOrCreate(c,f,c.path),delete c.factories,s.publishMethods(f,u,o),f.model=u.model=a.computed({read:function(){return a.utils.unwrapObservable(u._model)},write:function(e){return s.ignore(function(){var t;if(!u.__kb_released&&s.peek(u._model)!==e)return t=s.getValue(e,s.peek(u.key),u.args),u._model(e),e?l.isUndefined(t)?void 0:u.update(t):u.update(null)})}}),s.EventWatcher.useOptionsOrCreate({event_watcher:d},e||null,u,{emitter:u.model,update:function(){return s.ignore(function(){return u.update()})},key:u.key,path:c.path}),u._value.rawValue()||u._value.update(),s.LocalizedObservable&&t.localizer&&(f=new t.localizer(f)),s.DefaultObservable&&t.hasOwnProperty("default")&&(f=s.defaultObservable(f,t["default"])),f}}(this))}return e.prototype.destroy=function(){var e;return e=s.utils.wrappedObservable(this),this.__kb_released=!0,this._value.destroy(),this._value=null,this.model.dispose(),this.model=e.model=null,s.utils.wrappedDestroy(this)},e.prototype.value=function(){return this._value.rawValue()},e.prototype.valueType=function(){return this._value.valueType(s.peek(this._model),s.peek(this.key))},e.prototype.update=function(e){return this.__kb_released?void 0:(arguments.length||(e=s.getValue(s.peek(this._model),s.peek(this.key))),this._value.update(e))},e}(),s.observable=function(e,t,r,n){return new s.Observable(e,t,r,n)}},function(e,t,r){var n,o;o=(n=r(6))._,e.exports=n.Statistics=function(){function e(){this.model_events_tracker=[],this.registered_tracker={}}return e.prototype.clear=function(){return this.model_events_tracker=[]},e.prototype.addModelEvent=function(e){return this.model_events_tracker.push(e)},e.prototype.modelEventsStatsString=function(){var e,t,r,n;r="",r+="Total Count: "+this.model_events_tracker.length,e=o.groupBy(this.model_events_tracker,function(e){return"event name: '"+e.name+"', attribute name: '"+e.key+"'"});for(t in e)n=e[t],r+="\n "+t+", count: "+n.length;return r},e.prototype.register=function(e,t){return this.registeredTracker(e).push(t)},e.prototype.unregister=function(e,t){var r,n;return n=this.registeredTracker(e),r=o.indexOf(n,t),0>r&&"undefined"!=typeof console&&null!==console&&console.log("kb.Statistics: failed to unregister type: "+e),n.splice(r,1)},e.prototype.registeredCount=function(e){var t,r,n;if(e)return this.registeredTracker(e).length;t=0,n=this.registered_tracker[e];for(e in n)r=n[e],t+=r.length;return t},e.prototype.registeredStatsString=function(e){var t,r,n,o,i;t="",i=this.registered_tracker;for(r in i)n=i[r],n.length&&(o&&(t+="\n "),t+=""+(r?r:"No Name")+": "+n.length,o=!0);return t?t:e},e.prototype.registeredTracker=function(e){var t;return this.registered_tracker.hasOwnProperty(e)?this.registered_tracker[e]:(t=[],this.registered_tracker[e]=t,t)},e.eventsStats=function(e,t){var r,n,i,s,a,l,u;for(i={count:0},r=e._events||e._callbacks||{},u=t?[t]:o.keys(r),a=0,l=u.length;l>a;a++)if(t=u[a],n=r[t]){if(o.isArray(n))i[t]=o.compact(n).length;else for(i[t]=0,s=n.tail;(n=n.next)!==s;)i[t]++;i.count+=i[t]}return i},e}()},function(e,t,r){var n,o,i,s;s=n=r(6),i=s._,o=s.ko,e.exports=n.Store=function(){function e(){this.observable_records=[],this.replaced_observables=[]}return e.useOptionsOrCreate=function(e,t,r){return e.store?(e.store.register(t,r,e),n.utils.wrappedStore(r,e.store)):(n.utils.wrappedStoreIsOwned(r,!0),n.utils.wrappedStore(r,new n.Store))},e.prototype.destroy=function(){return this.clear()},e.prototype.clear=function(){var e,t,r,o,i,s,a;for(s=[this.observable_records,[]],e=s[0],this.observable_records=s[1],o=0,i=e.length;i>o;o++)t=e[o],n.release(t.observable);a=[this.replaced_observables,[]],r=a[0],this.replaced_observables=a[1],n.release(r)},e.prototype.compact=function(){var e,t,r,n,o,s;for(t=[],o=this.observable_records,r=0,n=o.length;n>r;r++)e=o[r],(null!=(s=e.observable)?s.__kb_released:void 0)&&t.push(e);t.length&&(this.observable_records=i.difference(this.observable_records,t))},e.prototype.register=function(e,t,r){var i;if(t&&!o.isObservable(t)&&!t.__kb_is_co)return n.utils.wrappedObject(t,e),e||(t.__kb_null=!0),i=r.creator?r.creator:r.path&&r.factory?r.factory.creatorForPath(e,r.path):null,i||(i=t.constructor),this.observable_records.push({obj:e,observable:t,creator:i}),t},e.prototype.findIndex=function(e,t){var r,o,s,a;if(s=[],!e||e instanceof n.Model){a=this.observable_records;for(r in a)if(o=a[r],o.observable)if(o.observable.__kb_released)s.push(o);else if((e||o.observable.__kb_null)&&(!e||!o.observable.__kb_null&&o.obj===e)&&(o.creator===t||o.creator.create&&o.creator.create===t.create))return s.length?(this.observable_records=i.difference(this.observable_records,s),i.indexOf(this.observable_records,o)):r}return s.length&&(this.observable_records=i.difference(this.observable_records,s)),-1},e.prototype.find=function(e,t){var r;return(r=this.findIndex(e,t))<0?null:this.observable_records[r].observable},e.prototype.isRegistered=function(e){var t,r,n,o;for(o=this.observable_records,r=0,n=o.length;n>r;r++)if(t=o[r],t.observable===e)return!0;return!1},e.prototype.findOrCreate=function(e,t){var r,i;return t.store=this,t.creator||(t.creator=n.utils.inferCreator(e,t.factory,t.path)),!t.creator&&e instanceof n.Model&&(t.creator=n.ViewModel),(r=t.creator)?r.models_only?e:(r&&(i=this.find(e,r)),i?i:(i=n.ignore(function(){return function(){return i=r.create?r.create(e,t):new r(e,t),i||o.observable(null)}}(this)),o.isObservable(i)||this.isRegistered(i)||this.register(e,i,t),i)):n.utils.createFromDefaultCreator(e,t)},e.prototype.findOrReplace=function(e,t,r){var o,i;return e||n._throwUnexpected(this,"obj missing"),(o=this.findIndex(e,t))<0?this.register(e,r,{creator:t}):(i=this.observable_records[o],n.utils.wrappedObject(i.observable)===e||n._throwUnexpected(this,"different object"),i.observable!==r&&(i.observable.constructor===r.constructor||n._throwUnexpected(this,"replacing different type"),this.replaced_observables.push(i.observable),i.observable=r),r)},e}()},function(e,t,r){var n,o,i,s,a;a=o=r(6),s=a._,i=a.ko,e.exports=n=function(){function e(e){this.create_options=e,this._vo=i.observable(null)}return e.prototype.destroy=function(){return this.__kb_released=!0,o.release(this.__kb_value),this.__kb_value=null},e.prototype.value=function(){return i.utils.unwrapObservable(this._vo())},e.prototype.rawValue=function(){return this.__kb_value},e.prototype.valueType=function(e,t){var r;return r=o.getValue(e,t),this.value_type||this._updateValueObservable(r),this.value_type},e.prototype.update=function(e){var t,r;if(!this.__kb_released){switch(void 0!==e||(e=null),t=o.utils.valueType(e),(!this.__kb_value||this.__kb_value.__kb_released||this.__kb_value.__kb_null&&e)&&(this.__kb_value=void 0,this.value_type=void 0),r=this.__kb_value,this.value_type){case o.TYPE_COLLECTION:if(this.value_type===o.TYPE_COLLECTION&&t===o.TYPE_ARRAY)return r(e);if((t===o.TYPE_COLLECTION||s.isNull(e))&&s.isFunction(r.collection))return void(o.peek(r.collection)!==e&&r.collection(e));break;case o.TYPE_MODEL:if(t===o.TYPE_MODEL||s.isNull(e))return void(s.isFunction(r.model)?o.peek(r.model)!==e&&r.model(e):o.utils.wrappedObject(r)!==e&&this._updateValueObservable(e))}if(this.value_type!==t||s.isUndefined(this.value_type)){if(o.peek(r)!==e)return this._updateValueObservable(e)}else if(o.peek(r)!==e)return r(e)}},e.prototype._updateValueObservable=function(e){var t,r,n,a;return t=this.create_options,r=t.creator=o.utils.inferCreator(e,t.factory,t.path),this.value_type=o.TYPE_UNKNOWN,n=this.__kb_value,this.__kb_value=void 0,n&&o.release(n),r?t.store?a=t.store.findOrCreate(e,t):r.models_only?(a=e,this.value_type=o.TYPE_SIMPLE):a=r.create?r.create(e,t):new r(e,t):s.isArray(e)?(this.value_type=o.TYPE_ARRAY,a=i.observableArray(e)):(this.value_type=o.TYPE_SIMPLE,a=i.observable(e)),this.value_type===o.TYPE_UNKNOWN&&(i.isObservable(a)?this.value_type=a.__kb_is_co?o.TYPE_COLLECTION:o.TYPE_SIMPLE:(this.value_type=o.TYPE_MODEL,"function"!=typeof a.model&&o.utils.wrappedObject(a,e))),this.__kb_value=a,this._vo(a)},e}()},function(e,t,r){var n,o,i,s,a,l,u,c,d;c=n=r(6),i=c._,o=c.ko,d=n._wrappedKey=function(e,t,r){return 2===arguments.length?e&&e.__kb&&e.__kb.hasOwnProperty(t)?e.__kb[t]:void 0:(e||n._throwUnexpected(this,"no obj for wrapping "+t),e.__kb||(e.__kb={}),e.__kb[t]=r,r)},s=function(e,t){return Array.prototype.splice.call(e,1,0,t),e},l=function(e,t,r){return e[t]||(e[t]=[]),i.isArray(r)||(r=[r]),e[t]=e[t].length?i.union(e[t],r):r,e},u=function(e,t,r){return e[t]||(e[t]={}),i.extend(e[t],r)},a=function(e){var t,r,n,o;for(r={},n=0,o=e.length;o>n;n++)t=e[n],r[t]={key:t};return r},n.utils=function(){function e(){}return e.wrappedObservable=function(){return d.apply(this,s(arguments,"observable"))},e.wrappedObject=function(){return d.apply(this,s(arguments,"object"))},e.wrappedModel=function(e,t){return 1===arguments.length?(t=d(e,"object"),i.isUndefined(t)?e:t):d(e,"object",t)},e.wrappedStore=function(){return d.apply(this,s(arguments,"store"))},e.wrappedStoreIsOwned=function(){return d.apply(this,s(arguments,"store_is_owned"))},e.wrappedFactory=function(){return d.apply(this,s(arguments,"factory"))},e.wrappedEventWatcher=function(){return d.apply(this,s(arguments,"event_watcher"))},e.wrappedEventWatcherIsOwned=function(){return d.apply(this,s(arguments,"event_watcher_is_owned"))},e.wrappedDestroy=function(e){var t;if(e.__kb)return e.__kb.event_watcher&&e.__kb.event_watcher.releaseCallbacks(e),t=e.__kb,e.__kb=null,t.observable&&(t.observable.destroy=t.observable.release=null,this.wrappedDestroy(t.observable),t.observable=null),t.factory=null,t.event_watcher_is_owned&&t.event_watcher.destroy(),t.event_watcher=null,t.store_is_owned&&t.store.destroy(),t.store=null},e.valueType=function(e){return e?e.__kb_is_o?e.valueType():e.__kb_is_co||e instanceof n.Collection?n.TYPE_COLLECTION:e instanceof n.ViewModel||e instanceof n.Model?n.TYPE_MODEL:i.isArray(e)?n.TYPE_ARRAY:n.TYPE_SIMPLE:n.TYPE_UNKNOWN},e.pathJoin=function(e,t){return(e?"."!==e[e.length-1]?""+e+".":e:"")+t},e.optionsPathJoin=function(e,t){return i.defaults({path:this.pathJoin(e.path,t)},e)},e.inferCreator=function(e,t,r){var o;return t&&(o=t.creatorForPath(e,r))?o:e?e instanceof n.Model?n.ViewModel:e instanceof n.Collection?n.CollectionObservable:null:null},e.createFromDefaultCreator=function(e,t){return e instanceof n.Model?n.viewModel(e,t):e instanceof n.Collection?n.collectionObservable(e,t):i.isArray(e)?o.observableArray(e):o.observable(e)},e.hasModelSignature=function(e){return e&&e.attributes&&!e.models&&"function"==typeof e.get&&"function"==typeof e.trigger},e.hasCollectionSignature=function(e){return e&&e.models&&"function"==typeof e.get&&"function"==typeof e.trigger},e.collapseOptions=function(e){var t,r,n,o;for(r={},e={options:e};e.options;){o=e.options;for(t in o)switch(n=o[t],t){case"internals":case"requires":case"excludes":case"statics":l(r,t,n);break;case"keys":i.isObject(n)&&!i.isArray(n)||i.isObject(r[t])&&!i.isArray(r[t])?(i.isObject(n)||(n=[n]),i.isArray(n)&&(n=a(n)),i.isArray(r[t])&&(r[t]=a(r[t])),u(r,t,n)):l(r,t,n);break;case"factories":i.isFunction(n)?r[t]=n:u(r,t,n);break;case"static_defaults":u(r,t,n);break;case"options":break;default:r[t]=n}e=e.options}return r},e.unwrapModels=function(e){var t,r,o;if(!e)return e;if(e.__kb)return"object"in e.__kb?e.__kb.object:e;if(i.isArray(e))return i.map(e,function(e){return n.utils.unwrapModels(e)});if(i.isObject(e)&&e.constructor==={}.constructor){r={};for(t in e)o=e[t],r[t]=n.utils.unwrapModels(o);return r}return e},e}()},function(e,t,r){var n,o,i,s,a,l,u,c,d;d=l=r(6),c=d._,u=d.ko,s=function(){return function(e){return{store:l.utils.wrappedStore(e),factory:l.utils.wrappedFactory(e),path:e.__kb.path,event_watcher:l.utils.wrappedEventWatcher(e)}}}(this),o=function(e,t){var r;return r=e.__kb.internals&&c.contains(e.__kb.internals,t)?"_"+t:t,e.__kb.view_model.hasOwnProperty(r)?void 0:(e.__kb.view_model[r]=null,r)
},i=function(e,t,r,n){var i;if(!(e.__kb.excludes&&c.contains(e.__kb.excludes,r)||e.__kb.statics&&c.contains(e.__kb.statics,r)||!(i=o(e,r))))return e[i]=e.__kb.view_model[i]=l.observable(t,r,n,e)},a=function(e,t){var r,n,i,s,a;for(a=e.__kb.statics,i=0,s=a.length;s>i;i++)r=a[i],(n=o(e,r))&&(t.has(n)?e[n]=e.__kb.view_model[n]=t.get(n):e.__kb.static_defaults&&n in e.__kb.static_defaults?e[n]=e.__kb.view_model[n]=e.__kb.static_defaults[n]:delete e.__kb.view_model[n])},n=["keys","internals","excludes","statics","static_defaults"],l.ViewModel=function(){function e(e,t,r){return null==t&&(t={}),l.ignore(function(o){return function(){var i,d,p,f,_,b;for(!e||e instanceof l.Model||"function"==typeof e.get&&"function"==typeof e.bind||l._throwUnexpected(o,"not a model"),t=c.isArray(t)?{keys:t}:l.utils.collapseOptions(t),o.__kb||(o.__kb={}),o.__kb.view_model=r||o,f=0,_=n.length;_>f;f++)p=n[f],t.hasOwnProperty(p)&&(o.__kb[p]=t[p]);return l.Store.useOptionsOrCreate(t,e,o),o.__kb.path=t.path,l.Factory.useOptionsOrCreate(t,o,t.path),b=l._wrappedKey(o,"_model",u.observable()),o.model=u.computed({read:function(){return u.utils.unwrapObservable(b)},write:function(e){return l.ignore(function(){return l.utils.wrappedObject(o)!==e&&!l.wasReleased(o)&&d?o.__kb_null?void(!e||l._throwUnexpected(o,"model set on shared null")):(d.emitter(e),l.utils.wrappedObject(o,d.ee),b(d.ee),!d.ee||o.createObservables(d.ee)):void 0})}}),d=l.utils.wrappedEventWatcher(o,new l.EventWatcher(e,o,{emitter:o._model,update:function(){return l.ignore(function(){return!(null!=d?d.ee:void 0)||o.createObservables(null!=d?d.ee:void 0)})}})),l.utils.wrappedObject(o,e=d.ee),b(d.ee),i=s(o),!t.requires||o.createObservables(e,t.requires,i),!o.__kb.internals||o.createObservables(e,o.__kb.internals,i),!t.mappings||o.createObservables(e,t.mappings,i),!o.__kb.statics||a(o,e),o.createObservables(e,o.__kb.keys,i),!l.statistics||l.statistics.register("ViewModel",o),o}}(this))}return e.extend=l.extend,e.prototype.destroy=function(){var e;if(this.__kb_released=!0,this.__kb.view_model!==this)for(e in this.__kb.vm_keys)this.__kb.view_model[e]=null;return this.__kb.view_model=null,l.releaseKeys(this),l.utils.wrappedDestroy(this),!l.statistics||l.statistics.unregister("ViewModel",this)},e.prototype.shareOptions=function(){return{store:l.utils.wrappedStore(this),factory:l.utils.wrappedFactory(this)}},e.prototype.createObservables=function(e,t,r){var n,a,u,d,p,f,_,b,h;if(r||(r=s(this)),t)if(c.isArray(t))for(f=0,b=t.length;b>f;f++)n=t[f],i(this,e,n,r);else for(n in t)a=t[n],(d=o(this,n))&&(c.isString(a)||a.key||(a.key=d),this[d]=this.__kb.view_model[d]=l.observable(e,a,r,this));else{if(this.__kb.keys||!e)return;for(n in e.attributes)i(this,e,n,r);if(u=null!=(h=l.orm)&&"function"==typeof h.keys?h.keys(e):void 0)for(p=0,_=u.length;_>p;p++)n=u[p],i(this,e,n,r)}},e}(),l.viewModel=function(e,t,r){return new l.ViewModel(e,t,r)}},function(e,t,r){var n,o,i,s,a;if(e.exports=n=r(6),n.configure=r(2),n.modules={underscore:n._,backbone:n.Parse||n.Backbone,knockout:n.ko},"undefined"!=typeof window&&null!==window)for(a=["_","Backbone","Parse","ko","$"],i=0,s=a.length;s>i;i++)o=a[i],n[o]&&!window.hasOwnProperty(o)&&(window[o]=n[o])},function(e,t,r){var n,o,i,s,a;a=o=r(6),s=a._,i=a.ko,r(24),n=["destroy","setToDefault"],e.exports=o.DefaultObservable=function(){function e(e,t){var r;return this.dv=t,r=o.utils.wrappedObservable(this,i.computed({read:function(t){return function(){var r;return r=i.utils.unwrapObservable(e()),s.isNull(r)||s.isUndefined(r)?i.utils.unwrapObservable(t.dv):r}}(this),write:function(t){return e(t)}})),o.publishMethods(r,this,n),r}return e.prototype.destroy=function(){return o.utils.wrappedDestroy(this)},e.prototype.setToDefault=function(){return o.utils.wrappedObservable(this)(this.dv)},e}(),o.defaultObservable=function(e,t){return new o.DefaultObservable(e,t)}},function(e,t,r){var n,o,i,s,a;a=o=r(6),s=a._,i=a.ko,n=Array.prototype.slice,o.toFormattedString=function(e){var t,r,o,a,l,u;l=e.slice(),r=n.call(arguments,1);for(o in r)for(t=r[o],u=i.utils.unwrapObservable(t),(s.isUndefined(u)||s.isNull(u))&&(u=""),a=e.indexOf("{"+o+"}");a>=0;)l=l.replace("{"+o+"}",u),a=e.indexOf("{"+o+"}",a+1);return l},o.parseFormattedString=function(e,t){var r,n,o,i,a,l,u,c,d,p,f,_,b;for(p=t.slice(),o=0,l=0,c={};p.search("\\{"+o+"\\}")>=0;){for(u=t.indexOf("{"+o+"}");u>=0;)p=p.replace("{"+o+"}","(.*)"),c[u]=o,l++,u=t.indexOf("{"+o+"}",u+1);o++}if(r=o,d=new RegExp(p),a=d.exec(e),a&&a.shift(),!a||a.length!==l){for(f=[];r-->0;)f.push("");return f}b=s.sortBy(s.keys(c),function(e){return parseInt(e,10)}),n={};for(i in b)u=b[i],o=c[u],n.hasOwnProperty(o)||(n[o]=i);for(_=[],o=0;r>o;)_.push(a[n[o]]),o++;return _},e.exports=o.FormattedObservable=function(){function e(e,t){var r,a;return s.isArray(t)?(e=e,a=t):a=n.call(arguments,1),r=o.utils.wrappedObservable(this,i.computed({read:function(){var r,n,s;for(t=[i.utils.unwrapObservable(e)],n=0,s=a.length;s>n;n++)r=a[n],t.push(i.utils.unwrapObservable(r));return o.toFormattedString.apply(null,t)},write:function(t){var r,n,s;for(n=o.parseFormattedString(t,i.utils.unwrapObservable(e)),s=Math.min(a.length,n.length),r=0;s>r;)a[r](n[r]),r++}}))}return e.prototype.destroy=function(){return o.utils.wrappedDestroy(this)},e}(),o.formattedObservable=function(e){return new o.FormattedObservable(e,n.call(arguments,1))}},function(e,t,r){var n,o,i,s,a;a=o=r(6),s=a._,i=a.ko,n=["destroy","observedValue","resetToCurrent"],o.locale_manager||(o.locale_manager=void 0),e.exports=o.LocalizedObservable=function(){function e(e,t,r){var a;return this.value=e,this.vm=r,t||(t={}),this.vm||(this.vm={}),this.read||o._throwMissing(this,"read"),o.locale_manager||o._throwMissing(this,"kb.locale_manager"),this.__kb||(this.__kb={}),this.__kb._onLocaleChange=s.bind(this._onLocaleChange,this),this.__kb._onChange=t.onChange,this.value&&(e=i.utils.unwrapObservable(this.value)),this.vo=i.observable(e?this.read(e,null):null),a=o.utils.wrappedObservable(this,i.computed({read:function(e){return function(){return e.value&&i.utils.unwrapObservable(e.value),e.vo(),e.read(i.utils.unwrapObservable(e.value))}}(this),write:function(e){return function(t){return e.write||o._throwUnexpected(e,"writing to read-only"),e.write(t,i.utils.unwrapObservable(e.value)),e.vo(t),e.__kb._onChange?e.__kb._onChange(t):void 0}}(this),owner:this.vm})),o.publishMethods(a,this,n),o.locale_manager.bind("change",this.__kb._onLocaleChange),t.hasOwnProperty("default")&&(a=o.DefaultObservable&&i.defaultObservable(a,t["default"])),a}return e.extend=o.extend,e.prototype.destroy=function(){return o.locale_manager.unbind("change",this.__kb._onLocaleChange),this.vm=null,o.utils.wrappedDestroy(this)},e.prototype.resetToCurrent=function(){var e,t;return t=o.utils.wrappedObservable(this),e=this.value?this.read(i.utils.unwrapObservable(this.value)):null,t()!==e?t(e):void 0},e.prototype.observedValue=function(e){return 0===arguments.length?this.value:(this.value=e,void this._onLocaleChange())},e.prototype._onLocaleChange=function(){var e;return e=this.read(i.utils.unwrapObservable(this.value)),this.vo(e),this.__kb._onChange?this.__kb._onChange(e):void 0},e}(),o.localizedObservable=function(e,t,r){return new o.LocalizedObservable(e,t,r)}},function(e,t,r){var n,o,i,s,a;a=o=r(6),s=a._,i=a.ko,n=["destroy"],e.exports=o.TriggeredObservable=function(){function e(e,t){var r;return this.event_selector=t,e||o._throwMissing(this,"emitter"),this.event_selector||o._throwMissing(this,"event_selector"),this.vo=i.observable(),r=o.utils.wrappedObservable(this,i.computed(function(e){return function(){return e.vo()}}(this))),o.publishMethods(r,this,n),o.utils.wrappedEventWatcher(this,new o.EventWatcher(e,this,{emitter:s.bind(this.emitter,this),update:s.bind(this.update,this),event_selector:this.event_selector})),r}return e.prototype.destroy=function(){return o.utils.wrappedDestroy(this)},e.prototype.emitter=function(e){return 0===arguments.length||this.ee===e?this.ee:(this.ee=e)?this.update():void 0},e.prototype.update=function(){return this.ee?this.vo()!==this.ee?this.vo(this.ee):this.vo.valueHasMutated():void 0},e}(),o.triggeredObservable=function(e,t){return new o.TriggeredObservable(e,t)}},function(e,t,r){var n,o,i,s,a,l;l=i=r(6),a=l._,s=l.ko,n=l.$,r(25),o=function(e){return e=s.utils.unwrapObservable(e),"function"==typeof e?e.apply(null,Array.prototype.slice.call(arguments,1)):e},e.exports=i.Validation=function(){function e(){}return e}(),i.valueValidator=function(e,t,r){return null==r&&(r={}),r&&!("function"==typeof r)||(r={}),s.computed(function(){var n,i,l,u,c,d,p,f;p={$error_count:0},i=s.utils.unwrapObservable(e),!("disable"in r)||(l=o(r.disable)),!("enable"in r)||(l=!o(r.enable)),d=r.priorities||[],a.isArray(d)||(d=[d]),n=d.length+1;for(u in t)f=t[u],p[u]=!l&&o(f,i),p[u]&&(p.$error_count++,(c=a.indexOf(d,u)>=0)||(c=d.length),p.$active_error&&n>c?(p.$active_error=u,n=c):p.$active_error||(p.$active_error=u,n=c));return p.$enabled=!l,p.$disable=!!l,p.$valid=0===p.$error_count,p})},i.inputValidator=function(e,t,r){var o,s,l,u,c,d,p,f,_,b;if(null==r&&(r={}),r&&!("function"==typeof r)||(r={}),_=i.valid,o=n(t),(u=o.attr("name"))&&!a.isString(u)&&(u=null),!(s=o.attr("data-bind")))return null;if(c=new Function("sc","with(sc[0]) { return { "+s+" } }")([e]),!c||!c.value)return null;if(!c.validation_options||(a.defaults(c.validation_options,r),r=c.validation_options),s={},!_[p=o.attr("type")]||(s[p]=_[p]),!o.attr("required")||(s.required=_.required),c.validations){b=c.validations;for(l in b)f=b[l],s[l]=f}return d=i.valueValidator(c.value,s,r),!u&&!r.no_attach||(e["$"+u]=d),d},i.formValidator=function(e,t){var r,o,l,u,c,d,p,f,_,b,h,v,y;for(p={},b=[],r=n(t),(l=r.attr("name"))&&!a.isString(l)&&(l=null),(o=r.attr("data-bind"))&&(d=new Function("sc","with(sc[0]) { return { "+o+" } }")([e]),f=d.validation_options),f||(f={}),f.no_attach=!!l,y=r.find("input"),h=0,v=y.length;v>h;h++)u=y[h],(c=n(u).attr("name"))&&(_=i.inputValidator(e,u,f),!_||b.push(p[c]=_));return p.$error_count=s.computed(function(){var e,t,r;for(e=0,t=0,r=b.length;r>t;t++)_=b[t],e+=_().$error_count;return e}),p.$valid=s.computed(function(){return 0===p.$error_count()}),p.$enabled=s.computed(function(){var e,t,r;for(e=!0,t=0,r=b.length;r>t;t++)_=b[t],e&=_().$enabled;return e}),p.$disabled=s.computed(function(){return!p.$enabled()}),l&&(e["$"+l]=p),p}},function(t){t.exports=e},function(e){e.exports=t},function(e){e.exports=r},function(e){if("undefined"==typeof n){var t=new Error('Cannot find module "undefined"');throw t.code="MODULE_NOT_FOUND",t}e.exports=n},function(e,t,r){var n,o,i,s;s=n=r(6),i=s._,o=s.ko,n.Observable.prototype.setToDefault=function(){var e;null!=(e=this.__kb_value)&&"function"==typeof e.setToDefault&&e.setToDefault()},n.ViewModel.prototype.setToDefault=function(){var e,t;for(e in this.__kb.vm_keys)null!=(t=this[e])&&"function"==typeof t.setToDefault&&t.setToDefault()},n.utils.setToDefault=function(e){var t,r;if(e){if(o.isObservable(e))"function"==typeof e.setToDefault&&e.setToDefault();else if(i.isObject(e))for(t in e)r=e[t],!r||!o.isObservable(r)&&"function"==typeof r||"_"===t[0]&&!t.search("__kb")||this.setToDefault(r);return e}}},function(e,t,r){var n,o,i,s,a,l,u,c;c=a=r(6),u=c._,l=c.ko,n=c.$,s=/^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?$/,o=/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/,i=/^\s*(\-|\+)?(\d+|(\d*(\.\d*)))\s*$/,a.valid={required:function(e){return!e},url:function(e){return!s.test(e)},email:function(e){return!o.test(e)},number:function(e){return!i.test(e)}},a.hasChangedFn=function(e){var t,r;return r=null,t=null,function(){var n;return r!==(n=l.utils.unwrapObservable(e))?(r=n,t=r?r.toJSON():null,!1):r&&t?!u.isEqual(r.toJSON(),t):!1}},a.minLengthFn=function(e){return function(t){return!t||t.length<e}},a.uniqueValueFn=function(e,t,r){return function(n){var o,i,s;return s=l.utils.unwrapObservable(e),i=l.utils.unwrapObservable(t),o=l.utils.unwrapObservable(r),s&&i&&o?!!u.find(o.models,function(){return function(e){return e!==s&&e.get(i)===n}}(this)):!1}},a.untilTrueFn=function(e,t,r){var n;return n=!1,r&&l.isObservable(r)&&r.subscribe(function(){return n=!1}),function(r){var o,i;return(o=l.utils.unwrapObservable(t))?(n|=!!(i=o(l.utils.unwrapObservable(r))),n?i:l.utils.unwrapObservable(e)):l.utils.unwrapObservable(e)}},a.untilFalseFn=function(e,t,r){var n;return n=!1,r&&l.isObservable(r)&&r.subscribe(function(){return n=!1}),function(r){var o,i;return(o=l.utils.unwrapObservable(t))?(n|=!(i=o(l.utils.unwrapObservable(r))),n?i:l.utils.unwrapObservable(e)):l.utils.unwrapObservable(e)}}},function(e,t,r){var n,o,i,s,a,l;l=s=r(6),a=l._,o=l.Backbone,n=null,e.exports=i=function(){function e(){}return e.isAvailable=function(){return!!(n=null!=o?o.AssociatedModel:void 0)},e.keys=function(e){return e instanceof n?a.map(e.relations,function(e){return e.key}):null},e.relationType=function(e,t){var r;return e instanceof n&&(r=a.find(e.relations,function(e){return e.key===t}))?"Many"===r.type?s.TYPE_COLLECTION:s.TYPE_MODEL:null},e}()},function(e,t,r){var n,o,i,s,a,l;l=s=r(6),a=l._,n=l.Backbone,i=null,e.exports=o=function(){function e(){}return e.isAvailable=function(){return!!(i=null!=n?n.RelationalModel:void 0)},e.relationType=function(e,t){var r;return e instanceof i&&(r=a.find(e.getRelations(),function(e){return e.key===t}))?r.collectionType||a.isArray(r.keyContents)?s.TYPE_COLLECTION:s.TYPE_MODEL:null},e.bind=function(e,t,r,n){var o,i,a,l,u,c;if(!(l=this.relationType(e,t)))return null;if(a=function(e){return!s.statistics||s.statistics.addModelEvent({name:"update (relational)",model:e,key:t,path:n}),r()},i=s.Backbone.Relation.prototype.sanitizeOptions?["update","add","remove"]:["change","add","remove"],l===s.TYPE_COLLECTION)for(u=0,c=i.length;c>u;u++)o=i[u],e.bind(""+o+":"+t,a);else e.bind(""+i[0]+":"+t,a);return function(){var r,n;if(l===s.TYPE_COLLECTION)for(r=0,n=i.length;n>r;r++)o=i[r],e.unbind(""+o+":"+t,a);else e.unbind(""+i[0]+":"+t,a)}},e}()},function(e,t,r){(function(t){var n,o,i,s;i="undefined"!=typeof window&&null!==window?window:t,s=(o=r(6))._,n=null,e.exports=n=function(){function e(){}return e.isAvailable=function(){return!!(e=i.Supermodel)},e.keys=function(t){return t instanceof e.Model?s.keys(t.constructor.associations()):null},e.relationType=function(t,r){var n;return t instanceof e.Model&&(n=t.constructor.associations()[r])?n.add?o.TYPE_COLLECTION:o.TYPE_MODEL:null},e.bind=function(e,t,r,n){var i,s;return(s=this.relationType(e,t))?(i=function(e,i){var s,a;return!o.statistics||o.statistics.addModelEvent({name:"update (supermodel)",model:e,key:t,path:n}),a=e.constructor.associations()[t],s=e[a.store],e[a.store]=i,r(i),e[a.store]=s},s===o.TYPE_MODEL?(e.bind("associate:"+t,i),function(){return e.unbind("associate:"+t,i)}):void 0):null},e.useFunction=function(e,t){return!!this.relationType(e,t)},e}()}).call(t,function(){return this}())}])});
/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('contrail-view-model',[
    'underscore',
    'backbone',
    'contrail-remote-data-handler'
], function (_, Backbone, ContrailRemoteDataHandler) {
    var ContrailViewModel = Backbone.Model.extend({
        constructor: function (viewModelConfig) {
            var self = this, remoteHandlerConfig,
                defaultCacheConfig = {
                    cacheConfig: {
                        cacheTimeout: cowc.VIEWMODEL_CACHE_UPDATE_INTERVAL,
                        loadOnTimeout: true
                    }
                };

            var modelConfig = $.extend(true, {}, viewModelConfig, defaultCacheConfig),
                cacheConfig = modelConfig['cacheConfig'];
            Backbone.Model.call(this, {});

            self.ucid = contrail.checkIfExist(modelConfig['cacheConfig']) ? modelConfig['cacheConfig']['ucid'] : null;
            self.onAllRequestsComplete = new Slick.Event();

            if (modelConfig['data'] != null) {
                setData2Model(self, modelConfig['data']);
            }

            if (modelConfig['remote'] != null) {
                var cacheUsedStatus = setCachedData2Model(self, cacheConfig);

                if (cacheUsedStatus['isCacheUsed']) {
                    self.onAllRequestsComplete.notify();

                    if (cacheUsedStatus['reload']) {
                        remoteHandlerConfig = getRemoteHandlerConfig(self, modelConfig);
                        self.contrailDataHandler = new ContrailRemoteDataHandler(remoteHandlerConfig);
                    } else {
                        remoteHandlerConfig = getRemoteHandlerConfig(self, modelConfig, false);
                        self.contrailDataHandler = new ContrailRemoteDataHandler(remoteHandlerConfig);
                    }
                } else {
                    remoteHandlerConfig = getRemoteHandlerConfig(self, modelConfig);
                    self.contrailDataHandler = new ContrailRemoteDataHandler(remoteHandlerConfig);
                }

                bindDataHandler2Model(self);
            }

            return self;
        },

        getValueByPath: function (jsonPath) {
            var attributes = this.model().attributes,
                value = jsonPath(attributes, jsonPath)

            return value;
        },

        error: false,
        errorList: [],
        lastUpdateTime: null
    });

    function getRemoteHandlerConfig(contrailViewModel, viewModelConfig, autoFetchData) {
        var remoteHandlerConfig = {
                autoFetchData: (autoFetchData != null) ? autoFetchData : true
            },
            primaryRemote = viewModelConfig.remote,
            vlRemoteConfig = contrail.handleIfNull(viewModelConfig.vlRemoteConfig, {}),
            vlRemoteList = contrail.handleIfNull(vlRemoteConfig['vlRemoteList'], []),
            primaryRemoteConfig = {
                ajaxConfig: primaryRemote.ajaxConfig,
                dataParser: primaryRemote.dataParser,
                initCallback: primaryRemote.initCallback,
                successCallback: function (response) {
                    if(contrail.checkIfFunction(primaryRemote.setData2Model)) {
                        primaryRemote.setData2Model(contrailViewModel, response);
                    } else {
                        setData2Model(contrailViewModel, response);
                    }
                },
                failureCallback: function (xhr) {
                    contrailViewModel.error = true;
                    contrailViewModel.errorList.push(xhr);
                    if (contrail.checkIfFunction(primaryRemote.failureCallback)) {
                        primaryRemote.failureCallback(xhr, contrailViewModel);
                    }
                },
                completeCallback: function (completeResponse) {
                    updateDataInCache(contrailViewModel, completeResponse);
                }
            },
            vlRemoteList;

        remoteHandlerConfig['primaryRemoteConfig'] = primaryRemoteConfig;
        remoteHandlerConfig['onAllRequestsCompleteCallback'] = function () {
            if (!contrailViewModel.isRequestInProgress()) {
                contrailViewModel.onAllRequestsComplete.notify();
            }
        };

        remoteHandlerConfig['vlRemoteConfig'] = {
            vlRemoteList: [],
            completeCallback: function (completeResponse) {
                if (contrail.checkIfFunction(vlRemoteConfig['completeCallback'])) {
                    vlRemoteConfig['completeCallback'](contrailViewModel);
                }

                if (!contrailViewModel.isRequestInProgress()) {
                    updateDataInCache(contrailViewModel, completeResponse);
                }
            }
        };

        for (var i = 0; i < vlRemoteList.length; i++) {
            var vlSuccessCallback = vlRemoteList[i].successCallback,
                vlFailureCallback = vlRemoteList[i].failureCallback;

            vlRemoteList = {
                getAjaxConfig: vlRemoteList[i].getAjaxConfig,
                dataParser: vlRemoteList[i].dataParser,
                initCallback: vlRemoteList[i].initCallback,
                successCallback: function (response) {
                    if (contrail.checkIfFunction(vlSuccessCallback)) {
                        vlSuccessCallback(response, contrailViewModel);
                    }
                },
                failureCallback: function (xhr) {
                    contrailViewModel.error = true;
                    contrailViewModel.errorList.push(xhr);
                    if (contrail.checkIfFunction(vlFailureCallback)) {
                        vlFailureCallback(xhr, contrailViewModel);
                    }
                }
            }
            remoteHandlerConfig['vlRemoteConfig']['vlRemoteList'].push(vlRemoteList);
        }

        return remoteHandlerConfig;
    };

    function setCachedData2Model(contrailViewModel, cacheConfig) {
        var isCacheUsed = false, usePrimaryCache,
            reload = true, secondaryCacheStatus,
            cachedData = (cacheConfig.ucid != null) ? cowch.getDataFromCache(cacheConfig.ucid) : null,
            setCachedData2ModelCB = (cacheConfig != null) ? cacheConfig['setCachedData2ModelCB'] : null;

        usePrimaryCache = cowch.isCacheValid(cacheConfig, cachedData, 'viewModel');

        if (usePrimaryCache) {
            var cachedViewModel = cachedData['dataObject']['viewModel'],
                lastUpdateTime = cachedData['lastUpdateTime'];

            contrailViewModel.set(cachedViewModel.attributes);
            contrailViewModel.loadedFromCache = true;

            isCacheUsed = true;
            if (cacheConfig['cacheTimeout'] < ($.now() - lastUpdateTime)) {
                reload = true;
            } else {
                reload = false;
            }
        } else if (contrail.checkIfFunction(setCachedData2ModelCB)) {
            secondaryCacheStatus = cacheConfig['setCachedData2ModelCB'](contrailViewModel, cacheConfig);
            if (contrail.checkIfExist(secondaryCacheStatus)) {
                isCacheUsed = contrail.handleIfNull(secondaryCacheStatus['isCacheUsed'], false);
                reload = contrail.handleIfNull(secondaryCacheStatus['reload'], true);
            } else {
                isCacheUsed = false;
                reload = true;
            }
        }

        return {isCacheUsed: isCacheUsed, reload: reload};
    };

    function bindDataHandler2Model(contrailViewModel) {
        var contrailDataHandler = contrailViewModel.contrailDataHandler;

        contrailViewModel['isPrimaryRequestInProgress'] = function () {
            return (contrailDataHandler != null) ? contrailDataHandler.isPrimaryRequestInProgress() : false;
        };

        contrailViewModel['isVLRequestInProgress'] = function () {
            return (contrailDataHandler != null) ? contrailDataHandler.isVLRequestInProgress() : false;
        };

        contrailViewModel['isRequestInProgress'] = function () {
            return (contrailDataHandler != null) ? contrailDataHandler.isRequestInProgress() : false;
        };

        contrailViewModel['refreshData'] = function () {
            if (!contrailViewModel.isRequestInProgress()) {
                resetViewModel4Refresh(contrailViewModel);
                contrailDataHandler.refreshData()
            }
        };
    };

    function resetViewModel4Refresh(contrailViewModel) {
        contrailViewModel.error = false;
        contrailViewModel.errorList = [];
    };

    function setData2Model(contrailViewModel, viewData) {
        contrailViewModel.set(viewData);
        contrailViewModel.lastUpdateTime = $.now();
    };

    function updateDataInCache(contrailViewModel) {
        if (contrailViewModel.ucid != null) {
            //TODO: Binding of cached gridModel (if any) with existing view should be destroyed.
            cowch.setData2Cache(contrailViewModel.ucid, {viewModel: contrailViewModel});
        }
    };

    return ContrailViewModel;
});
/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('contrail-model',[
    'underscore',
    'backbone',
    'contrail-view-model',
    'knockout',
    'knockback'
], function (_, Backbone, ContrailViewModel, Knockout, Knockback) {
    var ContrailModel = Knockback.ViewModel.extend({

        formatModelConfig: function(modelConfig) {
            return modelConfig;
        },

        constructor: function (modelData, modelRemoteDataConfig) {
            var model, errorAttributes,
                editingLockAttrs, _this = this,
                modelAttributes = (modelData == null) ? this.defaultConfig : modelData;

            editingLockAttrs = generateAttributes(modelAttributes, cowc.LOCKED_SUFFIX_ID, true);

            if(this.defaultConfig != null) {
                modelData = cowu.filterJsonKeysWithNullValues(modelData);
            }
            modelData = $.extend(true, {}, this.defaultConfig, modelData);
            errorAttributes = generateAttributes(modelData, cowc.ERROR_SUFFIX_ID, false);
            modelData = $.extend(true, {}, modelData, {errors: new Backbone.Model(errorAttributes), locks: new Backbone.Model(editingLockAttrs)});

            modelData = this.formatModelConfig(modelData);
            model = new ContrailViewModel($.extend(true, {data: modelData}, modelRemoteDataConfig));
            model = _.extend(model, this.validations, {_originalAttributes: modelAttributes});

            Knockback.ViewModel.prototype.constructor.call(this, model);

            delete this.validations;
            return this;
        },

        getValueByPath: function (path) {
            var obj = this.model().attributes;
            path = path.replace(/\[(\w+)\]/g, '.$1');
            path = path.replace(/^\./, '');
            var pathArray = path.split('.');
            while (pathArray.length) {
                var property = pathArray.shift();
                if (obj != null && property in obj) {
                    obj = obj[property];
                } else {
                    return;
                }
            }
            return obj;
        },

        validateAttr: function (attributePath, validation) {
            var attr = cowu.getAttributeFromPath(attributePath),
                errors = this.model().get(cowc.KEY_MODEL_ERRORS),
                attrErrorObj = {}, isValid;

            isValid = this.model().isValid(attributePath, validation);
            attrErrorObj[attr + cowc.ERROR_SUFFIX_ID] = (isValid == true) ? false : isValid;
            errors.set(attrErrorObj);
        },

        isDeepValid: function(validations) {
            var isValid = true, validationOption = true,
                validationObj, key, keyObject, collectionModel, errors, attrErrorObj,
                objectType, getValidation, validationName, isInternalValid;

            for (var i = 0; i < validations.length; i++) {
                validationObj = validations[i];
                key = validationObj['key'];
                objectType = validationObj['type'];
                getValidation = validationObj['getValidation'];

                errors = this.model().get(cowc.KEY_MODEL_ERRORS);

                if(contrail.checkIfExist(key)) {
                    isInternalValid = true;

                    //handling the collection of collection validations
                    if(objectType === cowc.OBJECT_TYPE_COLLECTION_OF_COLLECTION) {
                        var primKey = key[0], secKey = key[1];
                        keyObject = this.model().attributes[primKey];
                        keyObject = keyObject instanceof Backbone.Collection ? keyObject.toJSON() : [];

                        for(var primColIndex = 0; primColIndex < keyObject.length; primColIndex++) {
                            var primColModel = keyObject[primColIndex];
                            var secKeyObject = primColModel.model().attributes[secKey];
                            if(secKeyObject) {
                                for(var secColIndex = 0; secColIndex < secKeyObject.size(); secColIndex++) {
                                    var secColModel = secKeyObject.at(secColIndex);
                                    validationName = getValidation instanceof Function ? getValidation(secColModel) : getValidation;
                                    isInternalValid = isInternalValid && secColModel.attributes.model().isValid(validationOption, validationName);
                                    isValid = isValid && isInternalValid;
                                }
                                setError4Key(errors, secKey, isInternalValid);
                            }
                        }
                    } else {
                        keyObject = this.model().attributes[key];

                        if(objectType == cowc.OBJECT_TYPE_COLLECTION) {
                            for( var j = 0; j < keyObject.size(); j++) {
                                collectionModel = keyObject.at(j);
                                validationName = typeof getValidation == 'function' ? getValidation(collectionModel) : getValidation;
                                isInternalValid = isInternalValid && collectionModel.attributes.model().isValid(validationOption, validationName);
                                isValid = isValid && isInternalValid;
                            }

                        } else if (objectType == cowc.OBJECT_TYPE_MODEL) {
                            validationName = typeof getValidation == 'function' ? getValidation(this) : getValidation;
                            isInternalValid = keyObject.model().isValid(validationOption, validationName);
                            isValid = isValid && isInternalValid;
                        }
                    }

                    setError4Key(errors, key, isInternalValid);
                } else {
                    validationName = typeof getValidation == 'function' ? getValidation(this) : getValidation;
                    isValid = isValid && this.model().isValid(validationOption, validationName);
                }
            }

            return isValid;
        },

        initLockAttr: function (attributePath, lockFlag) {
            var attribute = cowu.getAttributeFromPath(attributePath),
                locks = this.model().get(cowc.KEY_MODEL_LOCKS),
                errors = this.model().get(cowc.KEY_MODEL_ERRORS),
                lockObj = {}, attrErrorObj = {};

            lockObj[attribute + cowc.LOCKED_SUFFIX_ID] = lockFlag;
            locks.set(lockObj);

            attrErrorObj[attribute + cowc.ERROR_SUFFIX_ID] = false
            errors.set(attrErrorObj);
        },

        toggleLockAttr: function(attributePath) {
            var attribute = cowu.getAttributeFromPath(attributePath),
                locks = this.model().get(cowc.KEY_MODEL_LOCKS),
                lockedStatus = locks.attributes[attribute + cowc.LOCKED_SUFFIX_ID],
                lockObj = {};

            lockObj[attribute + cowc.LOCKED_SUFFIX_ID] = !lockedStatus;
            locks.set(lockObj);
        },

        showErrorAttr: function(attributePath, msg) {
            var attribute = cowu.getAttributeFromPath(attributePath),
                errors = this.model().get(cowc.KEY_MODEL_ERRORS),
                errorObj = {};

            errorObj[attribute + cowc.ERROR_SUFFIX_ID] = msg;
            errors.set(errorObj);
        },

        checkIfInputDisabled: function(disabledFlag, lockFlag) {
            return disabledFlag || lockFlag;
        },

        getFormErrorText: function (prefixId) {
            var modelErrors = this.model().attributes.errors.attributes,
                errorText = cowm.get(cowm.SHOULD_BE_VALID, cowl.get(prefixId));

            _.each(modelErrors, function (value, key) {
                if (_.isFunction(modelErrors[key]) || (modelErrors[key] == 'false') || (modelErrors[key] == '')) {
                    delete modelErrors[key];
                } else {
                    if (-1 == (key.indexOf('_form_error'))) {
                        errorText = errorText + cowl.getFirstCharUpperCase(key.split('_error')[0]) + ", ";
                    }
                }
            });
            // Replace last comma by a dot
            errorText = errorText.slice(0, -2) + ".";
            return {responseText: errorText};
        }
    });

    function setError4Key(errors, key, isInternalValid) {
        var attrErrorObj = {};
        if(!isInternalValid) {
            attrErrorObj[key + cowc.ERROR_SUFFIX_ID] = !isInternalValid;
            errors.set(attrErrorObj);
        }
    };

    function generateAttributes(attributes, suffix, defaultValue) {
        var flattenAttributes = cowu.flattenObject(attributes),
            errorAttributes = {};

        _.each(flattenAttributes, function (value, key) {
            var keyArray = key.split('.');
            errorAttributes[keyArray[keyArray.length - 1] + suffix] = defaultValue;
        });

        return errorAttributes;
    };

    return ContrailModel;
});

!function() {
  var d3 = {
    version: "3.5.6"
  };
  var d3_arraySlice = [].slice, d3_array = function(list) {
    return d3_arraySlice.call(list);
  };
  var d3_document = this.document;
  function d3_documentElement(node) {
    return node && (node.ownerDocument || node.document || node).documentElement;
  }
  function d3_window(node) {
    return node && (node.ownerDocument && node.ownerDocument.defaultView || node.document && node || node.defaultView);
  }
  if (d3_document) {
    try {
      d3_array(d3_document.documentElement.childNodes)[0].nodeType;
    } catch (e) {
      d3_array = function(list) {
        var i = list.length, array = new Array(i);
        while (i--) array[i] = list[i];
        return array;
      };
    }
  }
  if (!Date.now) Date.now = function() {
    return +new Date();
  };
  if (d3_document) {
    try {
      d3_document.createElement("DIV").style.setProperty("opacity", 0, "");
    } catch (error) {
      var d3_element_prototype = this.Element.prototype, d3_element_setAttribute = d3_element_prototype.setAttribute, d3_element_setAttributeNS = d3_element_prototype.setAttributeNS, d3_style_prototype = this.CSSStyleDeclaration.prototype, d3_style_setProperty = d3_style_prototype.setProperty;
      d3_element_prototype.setAttribute = function(name, value) {
        d3_element_setAttribute.call(this, name, value + "");
      };
      d3_element_prototype.setAttributeNS = function(space, local, value) {
        d3_element_setAttributeNS.call(this, space, local, value + "");
      };
      d3_style_prototype.setProperty = function(name, value, priority) {
        d3_style_setProperty.call(this, name, value + "", priority);
      };
    }
  }
  d3.ascending = d3_ascending;
  function d3_ascending(a, b) {
    return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
  }
  d3.descending = function(a, b) {
    return b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
  };
  d3.min = function(array, f) {
    var i = -1, n = array.length, a, b;
    if (arguments.length === 1) {
      while (++i < n) if ((b = array[i]) != null && b >= b) {
        a = b;
        break;
      }
      while (++i < n) if ((b = array[i]) != null && a > b) a = b;
    } else {
      while (++i < n) if ((b = f.call(array, array[i], i)) != null && b >= b) {
        a = b;
        break;
      }
      while (++i < n) if ((b = f.call(array, array[i], i)) != null && a > b) a = b;
    }
    return a;
  };
  d3.max = function(array, f) {
    var i = -1, n = array.length, a, b;
    if (arguments.length === 1) {
      while (++i < n) if ((b = array[i]) != null && b >= b) {
        a = b;
        break;
      }
      while (++i < n) if ((b = array[i]) != null && b > a) a = b;
    } else {
      while (++i < n) if ((b = f.call(array, array[i], i)) != null && b >= b) {
        a = b;
        break;
      }
      while (++i < n) if ((b = f.call(array, array[i], i)) != null && b > a) a = b;
    }
    return a;
  };
  d3.extent = function(array, f) {
    var i = -1, n = array.length, a, b, c;
    if (arguments.length === 1) {
      while (++i < n) if ((b = array[i]) != null && b >= b) {
        a = c = b;
        break;
      }
      while (++i < n) if ((b = array[i]) != null) {
        if (a > b) a = b;
        if (c < b) c = b;
      }
    } else {
      while (++i < n) if ((b = f.call(array, array[i], i)) != null && b >= b) {
        a = c = b;
        break;
      }
      while (++i < n) if ((b = f.call(array, array[i], i)) != null) {
        if (a > b) a = b;
        if (c < b) c = b;
      }
    }
    return [ a, c ];
  };
  function d3_number(x) {
    return x === null ? NaN : +x;
  }
  function d3_numeric(x) {
    return !isNaN(x);
  }
  d3.sum = function(array, f) {
    var s = 0, n = array.length, a, i = -1;
    if (arguments.length === 1) {
      while (++i < n) if (d3_numeric(a = +array[i])) s += a;
    } else {
      while (++i < n) if (d3_numeric(a = +f.call(array, array[i], i))) s += a;
    }
    return s;
  };
  d3.mean = function(array, f) {
    var s = 0, n = array.length, a, i = -1, j = n;
    if (arguments.length === 1) {
      while (++i < n) if (d3_numeric(a = d3_number(array[i]))) s += a; else --j;
    } else {
      while (++i < n) if (d3_numeric(a = d3_number(f.call(array, array[i], i)))) s += a; else --j;
    }
    if (j) return s / j;
  };
  d3.quantile = function(values, p) {
    var H = (values.length - 1) * p + 1, h = Math.floor(H), v = +values[h - 1], e = H - h;
    return e ? v + e * (values[h] - v) : v;
  };
  d3.median = function(array, f) {
    var numbers = [], n = array.length, a, i = -1;
    if (arguments.length === 1) {
      while (++i < n) if (d3_numeric(a = d3_number(array[i]))) numbers.push(a);
    } else {
      while (++i < n) if (d3_numeric(a = d3_number(f.call(array, array[i], i)))) numbers.push(a);
    }
    if (numbers.length) return d3.quantile(numbers.sort(d3_ascending), .5);
  };
  d3.variance = function(array, f) {
    var n = array.length, m = 0, a, d, s = 0, i = -1, j = 0;
    if (arguments.length === 1) {
      while (++i < n) {
        if (d3_numeric(a = d3_number(array[i]))) {
          d = a - m;
          m += d / ++j;
          s += d * (a - m);
        }
      }
    } else {
      while (++i < n) {
        if (d3_numeric(a = d3_number(f.call(array, array[i], i)))) {
          d = a - m;
          m += d / ++j;
          s += d * (a - m);
        }
      }
    }
    if (j > 1) return s / (j - 1);
  };
  d3.deviation = function() {
    var v = d3.variance.apply(this, arguments);
    return v ? Math.sqrt(v) : v;
  };
  function d3_bisector(compare) {
    return {
      left: function(a, x, lo, hi) {
        if (arguments.length < 3) lo = 0;
        if (arguments.length < 4) hi = a.length;
        while (lo < hi) {
          var mid = lo + hi >>> 1;
          if (compare(a[mid], x) < 0) lo = mid + 1; else hi = mid;
        }
        return lo;
      },
      right: function(a, x, lo, hi) {
        if (arguments.length < 3) lo = 0;
        if (arguments.length < 4) hi = a.length;
        while (lo < hi) {
          var mid = lo + hi >>> 1;
          if (compare(a[mid], x) > 0) hi = mid; else lo = mid + 1;
        }
        return lo;
      }
    };
  }
  var d3_bisect = d3_bisector(d3_ascending);
  d3.bisectLeft = d3_bisect.left;
  d3.bisect = d3.bisectRight = d3_bisect.right;
  d3.bisector = function(f) {
    return d3_bisector(f.length === 1 ? function(d, x) {
      return d3_ascending(f(d), x);
    } : f);
  };
  d3.shuffle = function(array, i0, i1) {
    if ((m = arguments.length) < 3) {
      i1 = array.length;
      if (m < 2) i0 = 0;
    }
    var m = i1 - i0, t, i;
    while (m) {
      i = Math.random() * m-- | 0;
      t = array[m + i0], array[m + i0] = array[i + i0], array[i + i0] = t;
    }
    return array;
  };
  d3.permute = function(array, indexes) {
    var i = indexes.length, permutes = new Array(i);
    while (i--) permutes[i] = array[indexes[i]];
    return permutes;
  };
  d3.pairs = function(array) {
    var i = 0, n = array.length - 1, p0, p1 = array[0], pairs = new Array(n < 0 ? 0 : n);
    while (i < n) pairs[i] = [ p0 = p1, p1 = array[++i] ];
    return pairs;
  };
  d3.zip = function() {
    if (!(n = arguments.length)) return [];
    for (var i = -1, m = d3.min(arguments, d3_zipLength), zips = new Array(m); ++i < m; ) {
      for (var j = -1, n, zip = zips[i] = new Array(n); ++j < n; ) {
        zip[j] = arguments[j][i];
      }
    }
    return zips;
  };
  function d3_zipLength(d) {
    return d.length;
  }
  d3.transpose = function(matrix) {
    return d3.zip.apply(d3, matrix);
  };
  d3.keys = function(map) {
    var keys = [];
    for (var key in map) keys.push(key);
    return keys;
  };
  d3.values = function(map) {
    var values = [];
    for (var key in map) values.push(map[key]);
    return values;
  };
  d3.entries = function(map) {
    var entries = [];
    for (var key in map) entries.push({
      key: key,
      value: map[key]
    });
    return entries;
  };
  d3.merge = function(arrays) {
    var n = arrays.length, m, i = -1, j = 0, merged, array;
    while (++i < n) j += arrays[i].length;
    merged = new Array(j);
    while (--n >= 0) {
      array = arrays[n];
      m = array.length;
      while (--m >= 0) {
        merged[--j] = array[m];
      }
    }
    return merged;
  };
  var abs = Math.abs;
  d3.range = function(start, stop, step) {
    if (arguments.length < 3) {
      step = 1;
      if (arguments.length < 2) {
        stop = start;
        start = 0;
      }
    }
    if ((stop - start) / step === Infinity) throw new Error("infinite range");
    var range = [], k = d3_range_integerScale(abs(step)), i = -1, j;
    start *= k, stop *= k, step *= k;
    if (step < 0) while ((j = start + step * ++i) > stop) range.push(j / k); else while ((j = start + step * ++i) < stop) range.push(j / k);
    return range;
  };
  function d3_range_integerScale(x) {
    var k = 1;
    while (x * k % 1) k *= 10;
    return k;
  }
  function d3_class(ctor, properties) {
    for (var key in properties) {
      Object.defineProperty(ctor.prototype, key, {
        value: properties[key],
        enumerable: false
      });
    }
  }
  d3.map = function(object, f) {
    var map = new d3_Map();
    if (object instanceof d3_Map) {
      object.forEach(function(key, value) {
        map.set(key, value);
      });
    } else if (Array.isArray(object)) {
      var i = -1, n = object.length, o;
      if (arguments.length === 1) while (++i < n) map.set(i, object[i]); else while (++i < n) map.set(f.call(object, o = object[i], i), o);
    } else {
      for (var key in object) map.set(key, object[key]);
    }
    return map;
  };
  function d3_Map() {
    this._ = Object.create(null);
  }
  var d3_map_proto = "__proto__", d3_map_zero = "\x00";
  d3_class(d3_Map, {
    has: d3_map_has,
    get: function(key) {
      return this._[d3_map_escape(key)];
    },
    set: function(key, value) {
      return this._[d3_map_escape(key)] = value;
    },
    remove: d3_map_remove,
    keys: d3_map_keys,
    values: function() {
      var values = [];
      for (var key in this._) values.push(this._[key]);
      return values;
    },
    entries: function() {
      var entries = [];
      for (var key in this._) entries.push({
        key: d3_map_unescape(key),
        value: this._[key]
      });
      return entries;
    },
    size: d3_map_size,
    empty: d3_map_empty,
    forEach: function(f) {
      for (var key in this._) f.call(this, d3_map_unescape(key), this._[key]);
    }
  });
  function d3_map_escape(key) {
    return (key += "") === d3_map_proto || key[0] === d3_map_zero ? d3_map_zero + key : key;
  }
  function d3_map_unescape(key) {
    return (key += "")[0] === d3_map_zero ? key.slice(1) : key;
  }
  function d3_map_has(key) {
    return d3_map_escape(key) in this._;
  }
  function d3_map_remove(key) {
    return (key = d3_map_escape(key)) in this._ && delete this._[key];
  }
  function d3_map_keys() {
    var keys = [];
    for (var key in this._) keys.push(d3_map_unescape(key));
    return keys;
  }
  function d3_map_size() {
    var size = 0;
    for (var key in this._) ++size;
    return size;
  }
  function d3_map_empty() {
    for (var key in this._) return false;
    return true;
  }
  d3.nest = function() {
    var nest = {}, keys = [], sortKeys = [], sortValues, rollup;
    function map(mapType, array, depth) {
      if (depth >= keys.length) return rollup ? rollup.call(nest, array) : sortValues ? array.sort(sortValues) : array;
      var i = -1, n = array.length, key = keys[depth++], keyValue, object, setter, valuesByKey = new d3_Map(), values;
      while (++i < n) {
        if (values = valuesByKey.get(keyValue = key(object = array[i]))) {
          values.push(object);
        } else {
          valuesByKey.set(keyValue, [ object ]);
        }
      }
      if (mapType) {
        object = mapType();
        setter = function(keyValue, values) {
          object.set(keyValue, map(mapType, values, depth));
        };
      } else {
        object = {};
        setter = function(keyValue, values) {
          object[keyValue] = map(mapType, values, depth);
        };
      }
      valuesByKey.forEach(setter);
      return object;
    }
    function entries(map, depth) {
      if (depth >= keys.length) return map;
      var array = [], sortKey = sortKeys[depth++];
      map.forEach(function(key, keyMap) {
        array.push({
          key: key,
          values: entries(keyMap, depth)
        });
      });
      return sortKey ? array.sort(function(a, b) {
        return sortKey(a.key, b.key);
      }) : array;
    }
    nest.map = function(array, mapType) {
      return map(mapType, array, 0);
    };
    nest.entries = function(array) {
      return entries(map(d3.map, array, 0), 0);
    };
    nest.key = function(d) {
      keys.push(d);
      return nest;
    };
    nest.sortKeys = function(order) {
      sortKeys[keys.length - 1] = order;
      return nest;
    };
    nest.sortValues = function(order) {
      sortValues = order;
      return nest;
    };
    nest.rollup = function(f) {
      rollup = f;
      return nest;
    };
    return nest;
  };
  d3.set = function(array) {
    var set = new d3_Set();
    if (array) for (var i = 0, n = array.length; i < n; ++i) set.add(array[i]);
    return set;
  };
  function d3_Set() {
    this._ = Object.create(null);
  }
  d3_class(d3_Set, {
    has: d3_map_has,
    add: function(key) {
      this._[d3_map_escape(key += "")] = true;
      return key;
    },
    remove: d3_map_remove,
    values: d3_map_keys,
    size: d3_map_size,
    empty: d3_map_empty,
    forEach: function(f) {
      for (var key in this._) f.call(this, d3_map_unescape(key));
    }
  });
  d3.behavior = {};
  function d3_identity(d) {
    return d;
  }
  d3.rebind = function(target, source) {
    var i = 1, n = arguments.length, method;
    while (++i < n) target[method = arguments[i]] = d3_rebind(target, source, source[method]);
    return target;
  };
  function d3_rebind(target, source, method) {
    return function() {
      var value = method.apply(source, arguments);
      return value === source ? target : value;
    };
  }
  function d3_vendorSymbol(object, name) {
    if (name in object) return name;
    name = name.charAt(0).toUpperCase() + name.slice(1);
    for (var i = 0, n = d3_vendorPrefixes.length; i < n; ++i) {
      var prefixName = d3_vendorPrefixes[i] + name;
      if (prefixName in object) return prefixName;
    }
  }
  var d3_vendorPrefixes = [ "webkit", "ms", "moz", "Moz", "o", "O" ];
  function d3_noop() {}
  d3.dispatch = function() {
    var dispatch = new d3_dispatch(), i = -1, n = arguments.length;
    while (++i < n) dispatch[arguments[i]] = d3_dispatch_event(dispatch);
    return dispatch;
  };
  function d3_dispatch() {}
  d3_dispatch.prototype.on = function(type, listener) {
    var i = type.indexOf("."), name = "";
    if (i >= 0) {
      name = type.slice(i + 1);
      type = type.slice(0, i);
    }
    if (type) return arguments.length < 2 ? this[type].on(name) : this[type].on(name, listener);
    if (arguments.length === 2) {
      if (listener == null) for (type in this) {
        if (this.hasOwnProperty(type)) this[type].on(name, null);
      }
      return this;
    }
  };
  function d3_dispatch_event(dispatch) {
    var listeners = [], listenerByName = new d3_Map();
    function event() {
      var z = listeners, i = -1, n = z.length, l;
      while (++i < n) if (l = z[i].on) l.apply(this, arguments);
      return dispatch;
    }
    event.on = function(name, listener) {
      var l = listenerByName.get(name), i;
      if (arguments.length < 2) return l && l.on;
      if (l) {
        l.on = null;
        listeners = listeners.slice(0, i = listeners.indexOf(l)).concat(listeners.slice(i + 1));
        listenerByName.remove(name);
      }
      if (listener) listeners.push(listenerByName.set(name, {
        on: listener
      }));
      return dispatch;
    };
    return event;
  }
  d3.event = null;
  function d3_eventPreventDefault() {
    d3.event.preventDefault();
  }
  function d3_eventSource() {
    var e = d3.event, s;
    while (s = e.sourceEvent) e = s;
    return e;
  }
  function d3_eventDispatch(target) {
    var dispatch = new d3_dispatch(), i = 0, n = arguments.length;
    while (++i < n) dispatch[arguments[i]] = d3_dispatch_event(dispatch);
    dispatch.of = function(thiz, argumentz) {
      return function(e1) {
        try {
          var e0 = e1.sourceEvent = d3.event;
          e1.target = target;
          d3.event = e1;
          dispatch[e1.type].apply(thiz, argumentz);
        } finally {
          d3.event = e0;
        }
      };
    };
    return dispatch;
  }
  d3.requote = function(s) {
    return s.replace(d3_requote_re, "\\$&");
  };
  var d3_requote_re = /[\\\^\$\*\+\?\|\[\]\(\)\.\{\}]/g;
  var d3_subclass = {}.__proto__ ? function(object, prototype) {
    object.__proto__ = prototype;
  } : function(object, prototype) {
    for (var property in prototype) object[property] = prototype[property];
  };
  function d3_selection(groups) {
    d3_subclass(groups, d3_selectionPrototype);
    return groups;
  }
  var d3_select = function(s, n) {
    return n.querySelector(s);
  }, d3_selectAll = function(s, n) {
    return n.querySelectorAll(s);
  }, d3_selectMatches = function(n, s) {
    var d3_selectMatcher = n.matches || n[d3_vendorSymbol(n, "matchesSelector")];
    d3_selectMatches = function(n, s) {
      return d3_selectMatcher.call(n, s);
    };
    return d3_selectMatches(n, s);
  };
  if (typeof Sizzle === "function") {
    d3_select = function(s, n) {
      return Sizzle(s, n)[0] || null;
    };
    d3_selectAll = Sizzle;
    d3_selectMatches = Sizzle.matchesSelector;
  }
  d3.selection = function() {
    return d3.select(d3_document.documentElement);
  };
  var d3_selectionPrototype = d3.selection.prototype = [];
  d3_selectionPrototype.select = function(selector) {
    var subgroups = [], subgroup, subnode, group, node;
    selector = d3_selection_selector(selector);
    for (var j = -1, m = this.length; ++j < m; ) {
      subgroups.push(subgroup = []);
      subgroup.parentNode = (group = this[j]).parentNode;
      for (var i = -1, n = group.length; ++i < n; ) {
        if (node = group[i]) {
          subgroup.push(subnode = selector.call(node, node.__data__, i, j));
          if (subnode && "__data__" in node) subnode.__data__ = node.__data__;
        } else {
          subgroup.push(null);
        }
      }
    }
    return d3_selection(subgroups);
  };
  function d3_selection_selector(selector) {
    return typeof selector === "function" ? selector : function() {
      return d3_select(selector, this);
    };
  }
  d3_selectionPrototype.selectAll = function(selector) {
    var subgroups = [], subgroup, node;
    selector = d3_selection_selectorAll(selector);
    for (var j = -1, m = this.length; ++j < m; ) {
      for (var group = this[j], i = -1, n = group.length; ++i < n; ) {
        if (node = group[i]) {
          subgroups.push(subgroup = d3_array(selector.call(node, node.__data__, i, j)));
          subgroup.parentNode = node;
        }
      }
    }
    return d3_selection(subgroups);
  };
  function d3_selection_selectorAll(selector) {
    return typeof selector === "function" ? selector : function() {
      return d3_selectAll(selector, this);
    };
  }
  var d3_nsPrefix = {
    svg: "http://www.w3.org/2000/svg",
    xhtml: "http://www.w3.org/1999/xhtml",
    xlink: "http://www.w3.org/1999/xlink",
    xml: "http://www.w3.org/XML/1998/namespace",
    xmlns: "http://www.w3.org/2000/xmlns/"
  };
  d3.ns = {
    prefix: d3_nsPrefix,
    qualify: function(name) {
      var i = name.indexOf(":"), prefix = name;
      if (i >= 0) {
        prefix = name.slice(0, i);
        name = name.slice(i + 1);
      }
      return d3_nsPrefix.hasOwnProperty(prefix) ? {
        space: d3_nsPrefix[prefix],
        local: name
      } : name;
    }
  };
  d3_selectionPrototype.attr = function(name, value) {
    if (arguments.length < 2) {
      if (typeof name === "string") {
        var node = this.node();
        name = d3.ns.qualify(name);
        return name.local ? node.getAttributeNS(name.space, name.local) : node.getAttribute(name);
      }
      for (value in name) this.each(d3_selection_attr(value, name[value]));
      return this;
    }
    return this.each(d3_selection_attr(name, value));
  };
  function d3_selection_attr(name, value) {
    name = d3.ns.qualify(name);
    function attrNull() {
      this.removeAttribute(name);
    }
    function attrNullNS() {
      this.removeAttributeNS(name.space, name.local);
    }
    function attrConstant() {
      this.setAttribute(name, value);
    }
    function attrConstantNS() {
      this.setAttributeNS(name.space, name.local, value);
    }
    function attrFunction() {
      var x = value.apply(this, arguments);
      if (x == null) this.removeAttribute(name); else this.setAttribute(name, x);
    }
    function attrFunctionNS() {
      var x = value.apply(this, arguments);
      if (x == null) this.removeAttributeNS(name.space, name.local); else this.setAttributeNS(name.space, name.local, x);
    }
    return value == null ? name.local ? attrNullNS : attrNull : typeof value === "function" ? name.local ? attrFunctionNS : attrFunction : name.local ? attrConstantNS : attrConstant;
  }
  function d3_collapse(s) {
    return s.trim().replace(/\s+/g, " ");
  }
  d3_selectionPrototype.classed = function(name, value) {
    if (arguments.length < 2) {
      if (typeof name === "string") {
        var node = this.node(), n = (name = d3_selection_classes(name)).length, i = -1;
        if (value = node.classList) {
          while (++i < n) if (!value.contains(name[i])) return false;
        } else {
          value = node.getAttribute("class");
          while (++i < n) if (!d3_selection_classedRe(name[i]).test(value)) return false;
        }
        return true;
      }
      for (value in name) this.each(d3_selection_classed(value, name[value]));
      return this;
    }
    return this.each(d3_selection_classed(name, value));
  };
  function d3_selection_classedRe(name) {
    return new RegExp("(?:^|\\s+)" + d3.requote(name) + "(?:\\s+|$)", "g");
  }
  function d3_selection_classes(name) {
    return (name + "").trim().split(/^|\s+/);
  }
  function d3_selection_classed(name, value) {
    name = d3_selection_classes(name).map(d3_selection_classedName);
    var n = name.length;
    function classedConstant() {
      var i = -1;
      while (++i < n) name[i](this, value);
    }
    function classedFunction() {
      var i = -1, x = value.apply(this, arguments);
      while (++i < n) name[i](this, x);
    }
    return typeof value === "function" ? classedFunction : classedConstant;
  }
  function d3_selection_classedName(name) {
    var re = d3_selection_classedRe(name);
    return function(node, value) {
      if (c = node.classList) return value ? c.add(name) : c.remove(name);
      var c = node.getAttribute("class") || "";
      if (value) {
        re.lastIndex = 0;
        if (!re.test(c)) node.setAttribute("class", d3_collapse(c + " " + name));
      } else {
        node.setAttribute("class", d3_collapse(c.replace(re, " ")));
      }
    };
  }
  d3_selectionPrototype.style = function(name, value, priority) {
    var n = arguments.length;
    if (n < 3) {
      if (typeof name !== "string") {
        if (n < 2) value = "";
        for (priority in name) this.each(d3_selection_style(priority, name[priority], value));
        return this;
      }
      if (n < 2) {
        var node = this.node();
        return d3_window(node).getComputedStyle(node, null).getPropertyValue(name);
      }
      priority = "";
    }
    return this.each(d3_selection_style(name, value, priority));
  };
  function d3_selection_style(name, value, priority) {
    function styleNull() {
      this.style.removeProperty(name);
    }
    function styleConstant() {
      this.style.setProperty(name, value, priority);
    }
    function styleFunction() {
      var x = value.apply(this, arguments);
      if (x == null) this.style.removeProperty(name); else this.style.setProperty(name, x, priority);
    }
    return value == null ? styleNull : typeof value === "function" ? styleFunction : styleConstant;
  }
  d3_selectionPrototype.property = function(name, value) {
    if (arguments.length < 2) {
      if (typeof name === "string") return this.node()[name];
      for (value in name) this.each(d3_selection_property(value, name[value]));
      return this;
    }
    return this.each(d3_selection_property(name, value));
  };
  function d3_selection_property(name, value) {
    function propertyNull() {
      delete this[name];
    }
    function propertyConstant() {
      this[name] = value;
    }
    function propertyFunction() {
      var x = value.apply(this, arguments);
      if (x == null) delete this[name]; else this[name] = x;
    }
    return value == null ? propertyNull : typeof value === "function" ? propertyFunction : propertyConstant;
  }
  d3_selectionPrototype.text = function(value) {
    return arguments.length ? this.each(typeof value === "function" ? function() {
      var v = value.apply(this, arguments);
      this.textContent = v == null ? "" : v;
    } : value == null ? function() {
      this.textContent = "";
    } : function() {
      this.textContent = value;
    }) : this.node().textContent;
  };
  d3_selectionPrototype.html = function(value) {
    return arguments.length ? this.each(typeof value === "function" ? function() {
      var v = value.apply(this, arguments);
      this.innerHTML = v == null ? "" : v;
    } : value == null ? function() {
      this.innerHTML = "";
    } : function() {
      this.innerHTML = value;
    }) : this.node().innerHTML;
  };
  d3_selectionPrototype.append = function(name) {
    name = d3_selection_creator(name);
    return this.select(function() {
      return this.appendChild(name.apply(this, arguments));
    });
  };
  function d3_selection_creator(name) {
    function create() {
      var document = this.ownerDocument, namespace = this.namespaceURI;
      return namespace ? document.createElementNS(namespace, name) : document.createElement(name);
    }
    function createNS() {
      return this.ownerDocument.createElementNS(name.space, name.local);
    }
    return typeof name === "function" ? name : (name = d3.ns.qualify(name)).local ? createNS : create;
  }
  d3_selectionPrototype.insert = function(name, before) {
    name = d3_selection_creator(name);
    before = d3_selection_selector(before);
    return this.select(function() {
      return this.insertBefore(name.apply(this, arguments), before.apply(this, arguments) || null);
    });
  };
  d3_selectionPrototype.remove = function() {
    return this.each(d3_selectionRemove);
  };
  function d3_selectionRemove() {
    var parent = this.parentNode;
    if (parent) parent.removeChild(this);
  }
  d3_selectionPrototype.data = function(value, key) {
    var i = -1, n = this.length, group, node;
    if (!arguments.length) {
      value = new Array(n = (group = this[0]).length);
      while (++i < n) {
        if (node = group[i]) {
          value[i] = node.__data__;
        }
      }
      return value;
    }
    function bind(group, groupData) {
      var i, n = group.length, m = groupData.length, n0 = Math.min(n, m), updateNodes = new Array(m), enterNodes = new Array(m), exitNodes = new Array(n), node, nodeData;
      if (key) {
        var nodeByKeyValue = new d3_Map(), keyValues = new Array(n), keyValue;
        for (i = -1; ++i < n; ) {
          if (nodeByKeyValue.has(keyValue = key.call(node = group[i], node.__data__, i))) {
            exitNodes[i] = node;
          } else {
            nodeByKeyValue.set(keyValue, node);
          }
          keyValues[i] = keyValue;
        }
        for (i = -1; ++i < m; ) {
          if (!(node = nodeByKeyValue.get(keyValue = key.call(groupData, nodeData = groupData[i], i)))) {
            enterNodes[i] = d3_selection_dataNode(nodeData);
          } else if (node !== true) {
            updateNodes[i] = node;
            node.__data__ = nodeData;
          }
          nodeByKeyValue.set(keyValue, true);
        }
        for (i = -1; ++i < n; ) {
          if (nodeByKeyValue.get(keyValues[i]) !== true) {
            exitNodes[i] = group[i];
          }
        }
      } else {
        for (i = -1; ++i < n0; ) {
          node = group[i];
          nodeData = groupData[i];
          if (node) {
            node.__data__ = nodeData;
            updateNodes[i] = node;
          } else {
            enterNodes[i] = d3_selection_dataNode(nodeData);
          }
        }
        for (;i < m; ++i) {
          enterNodes[i] = d3_selection_dataNode(groupData[i]);
        }
        for (;i < n; ++i) {
          exitNodes[i] = group[i];
        }
      }
      enterNodes.update = updateNodes;
      enterNodes.parentNode = updateNodes.parentNode = exitNodes.parentNode = group.parentNode;
      enter.push(enterNodes);
      update.push(updateNodes);
      exit.push(exitNodes);
    }
    var enter = d3_selection_enter([]), update = d3_selection([]), exit = d3_selection([]);
    if (typeof value === "function") {
      while (++i < n) {
        bind(group = this[i], value.call(group, group.parentNode.__data__, i));
      }
    } else {
      while (++i < n) {
        bind(group = this[i], value);
      }
    }
    update.enter = function() {
      return enter;
    };
    update.exit = function() {
      return exit;
    };
    return update;
  };
  function d3_selection_dataNode(data) {
    return {
      __data__: data
    };
  }
  d3_selectionPrototype.datum = function(value) {
    return arguments.length ? this.property("__data__", value) : this.property("__data__");
  };
  d3_selectionPrototype.filter = function(filter) {
    var subgroups = [], subgroup, group, node;
    if (typeof filter !== "function") filter = d3_selection_filter(filter);
    for (var j = 0, m = this.length; j < m; j++) {
      subgroups.push(subgroup = []);
      subgroup.parentNode = (group = this[j]).parentNode;
      for (var i = 0, n = group.length; i < n; i++) {
        if ((node = group[i]) && filter.call(node, node.__data__, i, j)) {
          subgroup.push(node);
        }
      }
    }
    return d3_selection(subgroups);
  };
  function d3_selection_filter(selector) {
    return function() {
      return d3_selectMatches(this, selector);
    };
  }
  d3_selectionPrototype.order = function() {
    for (var j = -1, m = this.length; ++j < m; ) {
      for (var group = this[j], i = group.length - 1, next = group[i], node; --i >= 0; ) {
        if (node = group[i]) {
          if (next && next !== node.nextSibling) next.parentNode.insertBefore(node, next);
          next = node;
        }
      }
    }
    return this;
  };
  d3_selectionPrototype.sort = function(comparator) {
    comparator = d3_selection_sortComparator.apply(this, arguments);
    for (var j = -1, m = this.length; ++j < m; ) this[j].sort(comparator);
    return this.order();
  };
  function d3_selection_sortComparator(comparator) {
    if (!arguments.length) comparator = d3_ascending;
    return function(a, b) {
      return a && b ? comparator(a.__data__, b.__data__) : !a - !b;
    };
  }
  d3_selectionPrototype.each = function(callback) {
    return d3_selection_each(this, function(node, i, j) {
      callback.call(node, node.__data__, i, j);
    });
  };
  function d3_selection_each(groups, callback) {
    for (var j = 0, m = groups.length; j < m; j++) {
      for (var group = groups[j], i = 0, n = group.length, node; i < n; i++) {
        if (node = group[i]) callback(node, i, j);
      }
    }
    return groups;
  }
  d3_selectionPrototype.call = function(callback) {
    var args = d3_array(arguments);
    callback.apply(args[0] = this, args);
    return this;
  };
  d3_selectionPrototype.empty = function() {
    return !this.node();
  };
  d3_selectionPrototype.node = function() {
    for (var j = 0, m = this.length; j < m; j++) {
      for (var group = this[j], i = 0, n = group.length; i < n; i++) {
        var node = group[i];
        if (node) return node;
      }
    }
    return null;
  };
  d3_selectionPrototype.size = function() {
    var n = 0;
    d3_selection_each(this, function() {
      ++n;
    });
    return n;
  };
  function d3_selection_enter(selection) {
    d3_subclass(selection, d3_selection_enterPrototype);
    return selection;
  }
  var d3_selection_enterPrototype = [];
  d3.selection.enter = d3_selection_enter;
  d3.selection.enter.prototype = d3_selection_enterPrototype;
  d3_selection_enterPrototype.append = d3_selectionPrototype.append;
  d3_selection_enterPrototype.empty = d3_selectionPrototype.empty;
  d3_selection_enterPrototype.node = d3_selectionPrototype.node;
  d3_selection_enterPrototype.call = d3_selectionPrototype.call;
  d3_selection_enterPrototype.size = d3_selectionPrototype.size;
  d3_selection_enterPrototype.select = function(selector) {
    var subgroups = [], subgroup, subnode, upgroup, group, node;
    for (var j = -1, m = this.length; ++j < m; ) {
      upgroup = (group = this[j]).update;
      subgroups.push(subgroup = []);
      subgroup.parentNode = group.parentNode;
      for (var i = -1, n = group.length; ++i < n; ) {
        if (node = group[i]) {
          subgroup.push(upgroup[i] = subnode = selector.call(group.parentNode, node.__data__, i, j));
          subnode.__data__ = node.__data__;
        } else {
          subgroup.push(null);
        }
      }
    }
    return d3_selection(subgroups);
  };
  d3_selection_enterPrototype.insert = function(name, before) {
    if (arguments.length < 2) before = d3_selection_enterInsertBefore(this);
    return d3_selectionPrototype.insert.call(this, name, before);
  };
  function d3_selection_enterInsertBefore(enter) {
    var i0, j0;
    return function(d, i, j) {
      var group = enter[j].update, n = group.length, node;
      if (j != j0) j0 = j, i0 = 0;
      if (i >= i0) i0 = i + 1;
      while (!(node = group[i0]) && ++i0 < n) ;
      return node;
    };
  }
  d3.select = function(node) {
    var group;
    if (typeof node === "string") {
      group = [ d3_select(node, d3_document) ];
      group.parentNode = d3_document.documentElement;
    } else {
      group = [ node ];
      group.parentNode = d3_documentElement(node);
    }
    return d3_selection([ group ]);
  };
  d3.selectAll = function(nodes) {
    var group;
    if (typeof nodes === "string") {
      group = d3_array(d3_selectAll(nodes, d3_document));
      group.parentNode = d3_document.documentElement;
    } else {
      group = nodes;
      group.parentNode = null;
    }
    return d3_selection([ group ]);
  };
  d3_selectionPrototype.on = function(type, listener, capture) {
    var n = arguments.length;
    if (n < 3) {
      if (typeof type !== "string") {
        if (n < 2) listener = false;
        for (capture in type) this.each(d3_selection_on(capture, type[capture], listener));
        return this;
      }
      if (n < 2) return (n = this.node()["__on" + type]) && n._;
      capture = false;
    }
    return this.each(d3_selection_on(type, listener, capture));
  };
  function d3_selection_on(type, listener, capture) {
    var name = "__on" + type, i = type.indexOf("."), wrap = d3_selection_onListener;
    if (i > 0) type = type.slice(0, i);
    var filter = d3_selection_onFilters.get(type);
    if (filter) type = filter, wrap = d3_selection_onFilter;
    function onRemove() {
      var l = this[name];
      if (l) {
        this.removeEventListener(type, l, l.$);
        delete this[name];
      }
    }
    function onAdd() {
      var l = wrap(listener, d3_array(arguments));
      onRemove.call(this);
      this.addEventListener(type, this[name] = l, l.$ = capture);
      l._ = listener;
    }
    function removeAll() {
      var re = new RegExp("^__on([^.]+)" + d3.requote(type) + "$"), match;
      for (var name in this) {
        if (match = name.match(re)) {
          var l = this[name];
          this.removeEventListener(match[1], l, l.$);
          delete this[name];
        }
      }
    }
    return i ? listener ? onAdd : onRemove : listener ? d3_noop : removeAll;
  }
  var d3_selection_onFilters = d3.map({
    mouseenter: "mouseover",
    mouseleave: "mouseout"
  });
  if (d3_document) {
    d3_selection_onFilters.forEach(function(k) {
      if ("on" + k in d3_document) d3_selection_onFilters.remove(k);
    });
  }
  function d3_selection_onListener(listener, argumentz) {
    return function(e) {
      var o = d3.event;
      d3.event = e;
      argumentz[0] = this.__data__;
      try {
        listener.apply(this, argumentz);
      } finally {
        d3.event = o;
      }
    };
  }
  function d3_selection_onFilter(listener, argumentz) {
    var l = d3_selection_onListener(listener, argumentz);
    return function(e) {
      var target = this, related = e.relatedTarget;
      if (!related || related !== target && !(related.compareDocumentPosition(target) & 8)) {
        l.call(target, e);
      }
    };
  }
  var d3_event_dragSelect, d3_event_dragId = 0;
  function d3_event_dragSuppress(node) {
    var name = ".dragsuppress-" + ++d3_event_dragId, click = "click" + name, w = d3.select(d3_window(node)).on("touchmove" + name, d3_eventPreventDefault).on("dragstart" + name, d3_eventPreventDefault).on("selectstart" + name, d3_eventPreventDefault);
    if (d3_event_dragSelect == null) {
      d3_event_dragSelect = "onselectstart" in node ? false : d3_vendorSymbol(node.style, "userSelect");
    }
    if (d3_event_dragSelect) {
      var style = d3_documentElement(node).style, select = style[d3_event_dragSelect];
      style[d3_event_dragSelect] = "none";
    }
    return function(suppressClick) {
      w.on(name, null);
      if (d3_event_dragSelect) style[d3_event_dragSelect] = select;
      if (suppressClick) {
        var off = function() {
          w.on(click, null);
        };
        w.on(click, function() {
          d3_eventPreventDefault();
          off();
        }, true);
        setTimeout(off, 0);
      }
    };
  }
  d3.mouse = function(container) {
    return d3_mousePoint(container, d3_eventSource());
  };
  var d3_mouse_bug44083 = this.navigator && /WebKit/.test(this.navigator.userAgent) ? -1 : 0;
  function d3_mousePoint(container, e) {
    if (e.changedTouches) e = e.changedTouches[0];
    var svg = container.ownerSVGElement || container;
    if (svg.createSVGPoint) {
      var point = svg.createSVGPoint();
      if (d3_mouse_bug44083 < 0) {
        var window = d3_window(container);
        if (window.scrollX || window.scrollY) {
          svg = d3.select("body").append("svg").style({
            position: "absolute",
            top: 0,
            left: 0,
            margin: 0,
            padding: 0,
            border: "none"
          }, "important");
          var ctm = svg[0][0].getScreenCTM();
          d3_mouse_bug44083 = !(ctm.f || ctm.e);
          svg.remove();
        }
      }
      if (d3_mouse_bug44083) point.x = e.pageX, point.y = e.pageY; else point.x = e.clientX, 
      point.y = e.clientY;
      point = point.matrixTransform(container.getScreenCTM().inverse());
      return [ point.x, point.y ];
    }
    var rect = container.getBoundingClientRect();
    return [ e.clientX - rect.left - container.clientLeft, e.clientY - rect.top - container.clientTop ];
  }
  d3.touch = function(container, touches, identifier) {
    if (arguments.length < 3) identifier = touches, touches = d3_eventSource().changedTouches;
    if (touches) for (var i = 0, n = touches.length, touch; i < n; ++i) {
      if ((touch = touches[i]).identifier === identifier) {
        return d3_mousePoint(container, touch);
      }
    }
  };
  d3.behavior.drag = function() {
    var event = d3_eventDispatch(drag, "drag", "dragstart", "dragend"), origin = null, mousedown = dragstart(d3_noop, d3.mouse, d3_window, "mousemove", "mouseup"), touchstart = dragstart(d3_behavior_dragTouchId, d3.touch, d3_identity, "touchmove", "touchend");
    function drag() {
      this.on("mousedown.drag", mousedown).on("touchstart.drag", touchstart);
    }
    function dragstart(id, position, subject, move, end) {
      return function() {
        var that = this, target = d3.event.target, parent = that.parentNode, dispatch = event.of(that, arguments), dragged = 0, dragId = id(), dragName = ".drag" + (dragId == null ? "" : "-" + dragId), dragOffset, dragSubject = d3.select(subject(target)).on(move + dragName, moved).on(end + dragName, ended), dragRestore = d3_event_dragSuppress(target), position0 = position(parent, dragId);
        if (origin) {
          dragOffset = origin.apply(that, arguments);
          dragOffset = [ dragOffset.x - position0[0], dragOffset.y - position0[1] ];
        } else {
          dragOffset = [ 0, 0 ];
        }
        dispatch({
          type: "dragstart"
        });
        function moved() {
          var position1 = position(parent, dragId), dx, dy;
          if (!position1) return;
          dx = position1[0] - position0[0];
          dy = position1[1] - position0[1];
          dragged |= dx | dy;
          position0 = position1;
          dispatch({
            type: "drag",
            x: position1[0] + dragOffset[0],
            y: position1[1] + dragOffset[1],
            dx: dx,
            dy: dy
          });
        }
        function ended() {
          if (!position(parent, dragId)) return;
          dragSubject.on(move + dragName, null).on(end + dragName, null);
          dragRestore(dragged && d3.event.target === target);
          dispatch({
            type: "dragend"
          });
        }
      };
    }
    drag.origin = function(x) {
      if (!arguments.length) return origin;
      origin = x;
      return drag;
    };
    return d3.rebind(drag, event, "on");
  };
  function d3_behavior_dragTouchId() {
    return d3.event.changedTouches[0].identifier;
  }
  d3.touches = function(container, touches) {
    if (arguments.length < 2) touches = d3_eventSource().touches;
    return touches ? d3_array(touches).map(function(touch) {
      var point = d3_mousePoint(container, touch);
      point.identifier = touch.identifier;
      return point;
    }) : [];
  };
  var ε = 1e-6, ε2 = ε * ε, π = Math.PI, τ = 2 * π, τε = τ - ε, halfπ = π / 2, d3_radians = π / 180, d3_degrees = 180 / π;
  function d3_sgn(x) {
    return x > 0 ? 1 : x < 0 ? -1 : 0;
  }
  function d3_cross2d(a, b, c) {
    return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  }
  function d3_acos(x) {
    return x > 1 ? 0 : x < -1 ? π : Math.acos(x);
  }
  function d3_asin(x) {
    return x > 1 ? halfπ : x < -1 ? -halfπ : Math.asin(x);
  }
  function d3_sinh(x) {
    return ((x = Math.exp(x)) - 1 / x) / 2;
  }
  function d3_cosh(x) {
    return ((x = Math.exp(x)) + 1 / x) / 2;
  }
  function d3_tanh(x) {
    return ((x = Math.exp(2 * x)) - 1) / (x + 1);
  }
  function d3_haversin(x) {
    return (x = Math.sin(x / 2)) * x;
  }
  var ρ = Math.SQRT2, ρ2 = 2, ρ4 = 4;
  d3.interpolateZoom = function(p0, p1) {
    var ux0 = p0[0], uy0 = p0[1], w0 = p0[2], ux1 = p1[0], uy1 = p1[1], w1 = p1[2];
    var dx = ux1 - ux0, dy = uy1 - uy0, d2 = dx * dx + dy * dy, d1 = Math.sqrt(d2), b0 = (w1 * w1 - w0 * w0 + ρ4 * d2) / (2 * w0 * ρ2 * d1), b1 = (w1 * w1 - w0 * w0 - ρ4 * d2) / (2 * w1 * ρ2 * d1), r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0), r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1), dr = r1 - r0, S = (dr || Math.log(w1 / w0)) / ρ;
    function interpolate(t) {
      var s = t * S;
      if (dr) {
        var coshr0 = d3_cosh(r0), u = w0 / (ρ2 * d1) * (coshr0 * d3_tanh(ρ * s + r0) - d3_sinh(r0));
        return [ ux0 + u * dx, uy0 + u * dy, w0 * coshr0 / d3_cosh(ρ * s + r0) ];
      }
      return [ ux0 + t * dx, uy0 + t * dy, w0 * Math.exp(ρ * s) ];
    }
    interpolate.duration = S * 1e3;
    return interpolate;
  };
  d3.behavior.zoom = function() {
    var view = {
      x: 0,
      y: 0,
      k: 1
    }, translate0, center0, center, size = [ 960, 500 ], scaleExtent = d3_behavior_zoomInfinity, duration = 250, zooming = 0, mousedown = "mousedown.zoom", mousemove = "mousemove.zoom", mouseup = "mouseup.zoom", mousewheelTimer, touchstart = "touchstart.zoom", touchtime, event = d3_eventDispatch(zoom, "zoomstart", "zoom", "zoomend"), x0, x1, y0, y1;
    if (!d3_behavior_zoomWheel) {
      d3_behavior_zoomWheel = "onwheel" in d3_document ? (d3_behavior_zoomDelta = function() {
        return -d3.event.deltaY * (d3.event.deltaMode ? 120 : 1);
      }, "wheel") : "onmousewheel" in d3_document ? (d3_behavior_zoomDelta = function() {
        return d3.event.wheelDelta;
      }, "mousewheel") : (d3_behavior_zoomDelta = function() {
        return -d3.event.detail;
      }, "MozMousePixelScroll");
    }
    function zoom(g) {
      g.on(mousedown, mousedowned).on(d3_behavior_zoomWheel + ".zoom", mousewheeled).on("dblclick.zoom", dblclicked).on(touchstart, touchstarted);
    }
    zoom.event = function(g) {
      g.each(function() {
        var dispatch = event.of(this, arguments), view1 = view;
        if (d3_transitionInheritId) {
          d3.select(this).transition().each("start.zoom", function() {
            view = this.__chart__ || {
              x: 0,
              y: 0,
              k: 1
            };
            zoomstarted(dispatch);
          }).tween("zoom:zoom", function() {
            var dx = size[0], dy = size[1], cx = center0 ? center0[0] : dx / 2, cy = center0 ? center0[1] : dy / 2, i = d3.interpolateZoom([ (cx - view.x) / view.k, (cy - view.y) / view.k, dx / view.k ], [ (cx - view1.x) / view1.k, (cy - view1.y) / view1.k, dx / view1.k ]);
            return function(t) {
              var l = i(t), k = dx / l[2];
              this.__chart__ = view = {
                x: cx - l[0] * k,
                y: cy - l[1] * k,
                k: k
              };
              zoomed(dispatch);
            };
          }).each("interrupt.zoom", function() {
            zoomended(dispatch);
          }).each("end.zoom", function() {
            zoomended(dispatch);
          });
        } else {
          this.__chart__ = view;
          zoomstarted(dispatch);
          zoomed(dispatch);
          zoomended(dispatch);
        }
      });
    };
    zoom.translate = function(_) {
      if (!arguments.length) return [ view.x, view.y ];
      view = {
        x: +_[0],
        y: +_[1],
        k: view.k
      };
      rescale();
      return zoom;
    };
    zoom.scale = function(_) {
      if (!arguments.length) return view.k;
      view = {
        x: view.x,
        y: view.y,
        k: +_
      };
      rescale();
      return zoom;
    };
    zoom.scaleExtent = function(_) {
      if (!arguments.length) return scaleExtent;
      scaleExtent = _ == null ? d3_behavior_zoomInfinity : [ +_[0], +_[1] ];
      return zoom;
    };
    zoom.center = function(_) {
      if (!arguments.length) return center;
      center = _ && [ +_[0], +_[1] ];
      return zoom;
    };
    zoom.size = function(_) {
      if (!arguments.length) return size;
      size = _ && [ +_[0], +_[1] ];
      return zoom;
    };
    zoom.duration = function(_) {
      if (!arguments.length) return duration;
      duration = +_;
      return zoom;
    };
    zoom.x = function(z) {
      if (!arguments.length) return x1;
      x1 = z;
      x0 = z.copy();
      view = {
        x: 0,
        y: 0,
        k: 1
      };
      return zoom;
    };
    zoom.y = function(z) {
      if (!arguments.length) return y1;
      y1 = z;
      y0 = z.copy();
      view = {
        x: 0,
        y: 0,
        k: 1
      };
      return zoom;
    };
    function location(p) {
      return [ (p[0] - view.x) / view.k, (p[1] - view.y) / view.k ];
    }
    function point(l) {
      return [ l[0] * view.k + view.x, l[1] * view.k + view.y ];
    }
    function scaleTo(s) {
      view.k = Math.max(scaleExtent[0], Math.min(scaleExtent[1], s));
    }
    function translateTo(p, l) {
      l = point(l);
      view.x += p[0] - l[0];
      view.y += p[1] - l[1];
    }
    function zoomTo(that, p, l, k) {
      that.__chart__ = {
        x: view.x,
        y: view.y,
        k: view.k
      };
      scaleTo(Math.pow(2, k));
      translateTo(center0 = p, l);
      that = d3.select(that);
      if (duration > 0) that = that.transition().duration(duration);
      that.call(zoom.event);
    }
    function rescale() {
      if (x1) x1.domain(x0.range().map(function(x) {
        return (x - view.x) / view.k;
      }).map(x0.invert));
      if (y1) y1.domain(y0.range().map(function(y) {
        return (y - view.y) / view.k;
      }).map(y0.invert));
    }
    function zoomstarted(dispatch) {
      if (!zooming++) dispatch({
        type: "zoomstart"
      });
    }
    function zoomed(dispatch) {
      rescale();
      dispatch({
        type: "zoom",
        scale: view.k,
        translate: [ view.x, view.y ]
      });
    }
    function zoomended(dispatch) {
      if (!--zooming) dispatch({
        type: "zoomend"
      }), center0 = null;
    }
    function mousedowned() {
      var that = this, target = d3.event.target, dispatch = event.of(that, arguments), dragged = 0, subject = d3.select(d3_window(that)).on(mousemove, moved).on(mouseup, ended), location0 = location(d3.mouse(that)), dragRestore = d3_event_dragSuppress(that);
      d3_selection_interrupt.call(that);
      zoomstarted(dispatch);
      function moved() {
        dragged = 1;
        translateTo(d3.mouse(that), location0);
        zoomed(dispatch);
      }
      function ended() {
        subject.on(mousemove, null).on(mouseup, null);
        dragRestore(dragged && d3.event.target === target);
        zoomended(dispatch);
      }
    }
    function touchstarted() {
      var that = this, dispatch = event.of(that, arguments), locations0 = {}, distance0 = 0, scale0, zoomName = ".zoom-" + d3.event.changedTouches[0].identifier, touchmove = "touchmove" + zoomName, touchend = "touchend" + zoomName, targets = [], subject = d3.select(that), dragRestore = d3_event_dragSuppress(that);
      started();
      zoomstarted(dispatch);
      subject.on(mousedown, null).on(touchstart, started);
      function relocate() {
        var touches = d3.touches(that);
        scale0 = view.k;
        touches.forEach(function(t) {
          if (t.identifier in locations0) locations0[t.identifier] = location(t);
        });
        return touches;
      }
      function started() {
        var target = d3.event.target;
        d3.select(target).on(touchmove, moved).on(touchend, ended);
        targets.push(target);
        var changed = d3.event.changedTouches;
        for (var i = 0, n = changed.length; i < n; ++i) {
          locations0[changed[i].identifier] = null;
        }
        var touches = relocate(), now = Date.now();
        if (touches.length === 1) {
          if (now - touchtime < 500) {
            var p = touches[0];
            zoomTo(that, p, locations0[p.identifier], Math.floor(Math.log(view.k) / Math.LN2) + 1);
            d3_eventPreventDefault();
          }
          touchtime = now;
        } else if (touches.length > 1) {
          var p = touches[0], q = touches[1], dx = p[0] - q[0], dy = p[1] - q[1];
          distance0 = dx * dx + dy * dy;
        }
      }
      function moved() {
        var touches = d3.touches(that), p0, l0, p1, l1;
        d3_selection_interrupt.call(that);
        for (var i = 0, n = touches.length; i < n; ++i, l1 = null) {
          p1 = touches[i];
          if (l1 = locations0[p1.identifier]) {
            if (l0) break;
            p0 = p1, l0 = l1;
          }
        }
        if (l1) {
          var distance1 = (distance1 = p1[0] - p0[0]) * distance1 + (distance1 = p1[1] - p0[1]) * distance1, scale1 = distance0 && Math.sqrt(distance1 / distance0);
          p0 = [ (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 ];
          l0 = [ (l0[0] + l1[0]) / 2, (l0[1] + l1[1]) / 2 ];
          scaleTo(scale1 * scale0);
        }
        touchtime = null;
        translateTo(p0, l0);
        zoomed(dispatch);
      }
      function ended() {
        if (d3.event.touches.length) {
          var changed = d3.event.changedTouches;
          for (var i = 0, n = changed.length; i < n; ++i) {
            delete locations0[changed[i].identifier];
          }
          for (var identifier in locations0) {
            return void relocate();
          }
        }
        d3.selectAll(targets).on(zoomName, null);
        subject.on(mousedown, mousedowned).on(touchstart, touchstarted);
        dragRestore();
        zoomended(dispatch);
      }
    }
    function mousewheeled() {
      var dispatch = event.of(this, arguments);
      if (mousewheelTimer) clearTimeout(mousewheelTimer); else d3_selection_interrupt.call(this), 
      translate0 = location(center0 = center || d3.mouse(this)), zoomstarted(dispatch);
      mousewheelTimer = setTimeout(function() {
        mousewheelTimer = null;
        zoomended(dispatch);
      }, 50);
      d3_eventPreventDefault();
      scaleTo(Math.pow(2, d3_behavior_zoomDelta() * .002) * view.k);
      translateTo(center0, translate0);
      zoomed(dispatch);
    }
    function dblclicked() {
      var p = d3.mouse(this), k = Math.log(view.k) / Math.LN2;
      zoomTo(this, p, location(p), d3.event.shiftKey ? Math.ceil(k) - 1 : Math.floor(k) + 1);
    }
    return d3.rebind(zoom, event, "on");
  };
  var d3_behavior_zoomInfinity = [ 0, Infinity ], d3_behavior_zoomDelta, d3_behavior_zoomWheel;
  d3.color = d3_color;
  function d3_color() {}
  d3_color.prototype.toString = function() {
    return this.rgb() + "";
  };
  d3.hsl = d3_hsl;
  function d3_hsl(h, s, l) {
    return this instanceof d3_hsl ? void (this.h = +h, this.s = +s, this.l = +l) : arguments.length < 2 ? h instanceof d3_hsl ? new d3_hsl(h.h, h.s, h.l) : d3_rgb_parse("" + h, d3_rgb_hsl, d3_hsl) : new d3_hsl(h, s, l);
  }
  var d3_hslPrototype = d3_hsl.prototype = new d3_color();
  d3_hslPrototype.brighter = function(k) {
    k = Math.pow(.7, arguments.length ? k : 1);
    return new d3_hsl(this.h, this.s, this.l / k);
  };
  d3_hslPrototype.darker = function(k) {
    k = Math.pow(.7, arguments.length ? k : 1);
    return new d3_hsl(this.h, this.s, k * this.l);
  };
  d3_hslPrototype.rgb = function() {
    return d3_hsl_rgb(this.h, this.s, this.l);
  };
  function d3_hsl_rgb(h, s, l) {
    var m1, m2;
    h = isNaN(h) ? 0 : (h %= 360) < 0 ? h + 360 : h;
    s = isNaN(s) ? 0 : s < 0 ? 0 : s > 1 ? 1 : s;
    l = l < 0 ? 0 : l > 1 ? 1 : l;
    m2 = l <= .5 ? l * (1 + s) : l + s - l * s;
    m1 = 2 * l - m2;
    function v(h) {
      if (h > 360) h -= 360; else if (h < 0) h += 360;
      if (h < 60) return m1 + (m2 - m1) * h / 60;
      if (h < 180) return m2;
      if (h < 240) return m1 + (m2 - m1) * (240 - h) / 60;
      return m1;
    }
    function vv(h) {
      return Math.round(v(h) * 255);
    }
    return new d3_rgb(vv(h + 120), vv(h), vv(h - 120));
  }
  d3.hcl = d3_hcl;
  function d3_hcl(h, c, l) {
    return this instanceof d3_hcl ? void (this.h = +h, this.c = +c, this.l = +l) : arguments.length < 2 ? h instanceof d3_hcl ? new d3_hcl(h.h, h.c, h.l) : h instanceof d3_lab ? d3_lab_hcl(h.l, h.a, h.b) : d3_lab_hcl((h = d3_rgb_lab((h = d3.rgb(h)).r, h.g, h.b)).l, h.a, h.b) : new d3_hcl(h, c, l);
  }
  var d3_hclPrototype = d3_hcl.prototype = new d3_color();
  d3_hclPrototype.brighter = function(k) {
    return new d3_hcl(this.h, this.c, Math.min(100, this.l + d3_lab_K * (arguments.length ? k : 1)));
  };
  d3_hclPrototype.darker = function(k) {
    return new d3_hcl(this.h, this.c, Math.max(0, this.l - d3_lab_K * (arguments.length ? k : 1)));
  };
  d3_hclPrototype.rgb = function() {
    return d3_hcl_lab(this.h, this.c, this.l).rgb();
  };
  function d3_hcl_lab(h, c, l) {
    if (isNaN(h)) h = 0;
    if (isNaN(c)) c = 0;
    return new d3_lab(l, Math.cos(h *= d3_radians) * c, Math.sin(h) * c);
  }
  d3.lab = d3_lab;
  function d3_lab(l, a, b) {
    return this instanceof d3_lab ? void (this.l = +l, this.a = +a, this.b = +b) : arguments.length < 2 ? l instanceof d3_lab ? new d3_lab(l.l, l.a, l.b) : l instanceof d3_hcl ? d3_hcl_lab(l.h, l.c, l.l) : d3_rgb_lab((l = d3_rgb(l)).r, l.g, l.b) : new d3_lab(l, a, b);
  }
  var d3_lab_K = 18;
  var d3_lab_X = .95047, d3_lab_Y = 1, d3_lab_Z = 1.08883;
  var d3_labPrototype = d3_lab.prototype = new d3_color();
  d3_labPrototype.brighter = function(k) {
    return new d3_lab(Math.min(100, this.l + d3_lab_K * (arguments.length ? k : 1)), this.a, this.b);
  };
  d3_labPrototype.darker = function(k) {
    return new d3_lab(Math.max(0, this.l - d3_lab_K * (arguments.length ? k : 1)), this.a, this.b);
  };
  d3_labPrototype.rgb = function() {
    return d3_lab_rgb(this.l, this.a, this.b);
  };
  function d3_lab_rgb(l, a, b) {
    var y = (l + 16) / 116, x = y + a / 500, z = y - b / 200;
    x = d3_lab_xyz(x) * d3_lab_X;
    y = d3_lab_xyz(y) * d3_lab_Y;
    z = d3_lab_xyz(z) * d3_lab_Z;
    return new d3_rgb(d3_xyz_rgb(3.2404542 * x - 1.5371385 * y - .4985314 * z), d3_xyz_rgb(-.969266 * x + 1.8760108 * y + .041556 * z), d3_xyz_rgb(.0556434 * x - .2040259 * y + 1.0572252 * z));
  }
  function d3_lab_hcl(l, a, b) {
    return l > 0 ? new d3_hcl(Math.atan2(b, a) * d3_degrees, Math.sqrt(a * a + b * b), l) : new d3_hcl(NaN, NaN, l);
  }
  function d3_lab_xyz(x) {
    return x > .206893034 ? x * x * x : (x - 4 / 29) / 7.787037;
  }
  function d3_xyz_lab(x) {
    return x > .008856 ? Math.pow(x, 1 / 3) : 7.787037 * x + 4 / 29;
  }
  function d3_xyz_rgb(r) {
    return Math.round(255 * (r <= .00304 ? 12.92 * r : 1.055 * Math.pow(r, 1 / 2.4) - .055));
  }
  d3.rgb = d3_rgb;
  function d3_rgb(r, g, b) {
    return this instanceof d3_rgb ? void (this.r = ~~r, this.g = ~~g, this.b = ~~b) : arguments.length < 2 ? r instanceof d3_rgb ? new d3_rgb(r.r, r.g, r.b) : d3_rgb_parse("" + r, d3_rgb, d3_hsl_rgb) : new d3_rgb(r, g, b);
  }
  function d3_rgbNumber(value) {
    return new d3_rgb(value >> 16, value >> 8 & 255, value & 255);
  }
  function d3_rgbString(value) {
    return d3_rgbNumber(value) + "";
  }
  var d3_rgbPrototype = d3_rgb.prototype = new d3_color();
  d3_rgbPrototype.brighter = function(k) {
    k = Math.pow(.7, arguments.length ? k : 1);
    var r = this.r, g = this.g, b = this.b, i = 30;
    if (!r && !g && !b) return new d3_rgb(i, i, i);
    if (r && r < i) r = i;
    if (g && g < i) g = i;
    if (b && b < i) b = i;
    return new d3_rgb(Math.min(255, r / k), Math.min(255, g / k), Math.min(255, b / k));
  };
  d3_rgbPrototype.darker = function(k) {
    k = Math.pow(.7, arguments.length ? k : 1);
    return new d3_rgb(k * this.r, k * this.g, k * this.b);
  };
  d3_rgbPrototype.hsl = function() {
    return d3_rgb_hsl(this.r, this.g, this.b);
  };
  d3_rgbPrototype.toString = function() {
    return "#" + d3_rgb_hex(this.r) + d3_rgb_hex(this.g) + d3_rgb_hex(this.b);
  };
  function d3_rgb_hex(v) {
    return v < 16 ? "0" + Math.max(0, v).toString(16) : Math.min(255, v).toString(16);
  }
  function d3_rgb_parse(format, rgb, hsl) {
    format = format.toLowerCase();
    var r = 0, g = 0, b = 0, m1, m2, color;
    m1 = /([a-z]+)\((.*)\)/.exec(format);
    if (m1) {
      m2 = m1[2].split(",");
      switch (m1[1]) {
       case "hsl":
        {
          return hsl(parseFloat(m2[0]), parseFloat(m2[1]) / 100, parseFloat(m2[2]) / 100);
        }

       case "rgb":
        {
          return rgb(d3_rgb_parseNumber(m2[0]), d3_rgb_parseNumber(m2[1]), d3_rgb_parseNumber(m2[2]));
        }
      }
    }
    if (color = d3_rgb_names.get(format)) {
      return rgb(color.r, color.g, color.b);
    }
    if (format != null && format.charAt(0) === "#" && !isNaN(color = parseInt(format.slice(1), 16))) {
      if (format.length === 4) {
        r = (color & 3840) >> 4;
        r = r >> 4 | r;
        g = color & 240;
        g = g >> 4 | g;
        b = color & 15;
        b = b << 4 | b;
      } else if (format.length === 7) {
        r = (color & 16711680) >> 16;
        g = (color & 65280) >> 8;
        b = color & 255;
      }
    }
    return rgb(r, g, b);
  }
  function d3_rgb_hsl(r, g, b) {
    var min = Math.min(r /= 255, g /= 255, b /= 255), max = Math.max(r, g, b), d = max - min, h, s, l = (max + min) / 2;
    if (d) {
      s = l < .5 ? d / (max + min) : d / (2 - max - min);
      if (r == max) h = (g - b) / d + (g < b ? 6 : 0); else if (g == max) h = (b - r) / d + 2; else h = (r - g) / d + 4;
      h *= 60;
    } else {
      h = NaN;
      s = l > 0 && l < 1 ? 0 : h;
    }
    return new d3_hsl(h, s, l);
  }
  function d3_rgb_lab(r, g, b) {
    r = d3_rgb_xyz(r);
    g = d3_rgb_xyz(g);
    b = d3_rgb_xyz(b);
    var x = d3_xyz_lab((.4124564 * r + .3575761 * g + .1804375 * b) / d3_lab_X), y = d3_xyz_lab((.2126729 * r + .7151522 * g + .072175 * b) / d3_lab_Y), z = d3_xyz_lab((.0193339 * r + .119192 * g + .9503041 * b) / d3_lab_Z);
    return d3_lab(116 * y - 16, 500 * (x - y), 200 * (y - z));
  }
  function d3_rgb_xyz(r) {
    return (r /= 255) <= .04045 ? r / 12.92 : Math.pow((r + .055) / 1.055, 2.4);
  }
  function d3_rgb_parseNumber(c) {
    var f = parseFloat(c);
    return c.charAt(c.length - 1) === "%" ? Math.round(f * 2.55) : f;
  }
  var d3_rgb_names = d3.map({
    aliceblue: 15792383,
    antiquewhite: 16444375,
    aqua: 65535,
    aquamarine: 8388564,
    azure: 15794175,
    beige: 16119260,
    bisque: 16770244,
    black: 0,
    blanchedalmond: 16772045,
    blue: 255,
    blueviolet: 9055202,
    brown: 10824234,
    burlywood: 14596231,
    cadetblue: 6266528,
    chartreuse: 8388352,
    chocolate: 13789470,
    coral: 16744272,
    cornflowerblue: 6591981,
    cornsilk: 16775388,
    crimson: 14423100,
    cyan: 65535,
    darkblue: 139,
    darkcyan: 35723,
    darkgoldenrod: 12092939,
    darkgray: 11119017,
    darkgreen: 25600,
    darkgrey: 11119017,
    darkkhaki: 12433259,
    darkmagenta: 9109643,
    darkolivegreen: 5597999,
    darkorange: 16747520,
    darkorchid: 10040012,
    darkred: 9109504,
    darksalmon: 15308410,
    darkseagreen: 9419919,
    darkslateblue: 4734347,
    darkslategray: 3100495,
    darkslategrey: 3100495,
    darkturquoise: 52945,
    darkviolet: 9699539,
    deeppink: 16716947,
    deepskyblue: 49151,
    dimgray: 6908265,
    dimgrey: 6908265,
    dodgerblue: 2003199,
    firebrick: 11674146,
    floralwhite: 16775920,
    forestgreen: 2263842,
    fuchsia: 16711935,
    gainsboro: 14474460,
    ghostwhite: 16316671,
    gold: 16766720,
    goldenrod: 14329120,
    gray: 8421504,
    green: 32768,
    greenyellow: 11403055,
    grey: 8421504,
    honeydew: 15794160,
    hotpink: 16738740,
    indianred: 13458524,
    indigo: 4915330,
    ivory: 16777200,
    khaki: 15787660,
    lavender: 15132410,
    lavenderblush: 16773365,
    lawngreen: 8190976,
    lemonchiffon: 16775885,
    lightblue: 11393254,
    lightcoral: 15761536,
    lightcyan: 14745599,
    lightgoldenrodyellow: 16448210,
    lightgray: 13882323,
    lightgreen: 9498256,
    lightgrey: 13882323,
    lightpink: 16758465,
    lightsalmon: 16752762,
    lightseagreen: 2142890,
    lightskyblue: 8900346,
    lightslategray: 7833753,
    lightslategrey: 7833753,
    lightsteelblue: 11584734,
    lightyellow: 16777184,
    lime: 65280,
    limegreen: 3329330,
    linen: 16445670,
    magenta: 16711935,
    maroon: 8388608,
    mediumaquamarine: 6737322,
    mediumblue: 205,
    mediumorchid: 12211667,
    mediumpurple: 9662683,
    mediumseagreen: 3978097,
    mediumslateblue: 8087790,
    mediumspringgreen: 64154,
    mediumturquoise: 4772300,
    mediumvioletred: 13047173,
    midnightblue: 1644912,
    mintcream: 16121850,
    mistyrose: 16770273,
    moccasin: 16770229,
    navajowhite: 16768685,
    navy: 128,
    oldlace: 16643558,
    olive: 8421376,
    olivedrab: 7048739,
    orange: 16753920,
    orangered: 16729344,
    orchid: 14315734,
    palegoldenrod: 15657130,
    palegreen: 10025880,
    paleturquoise: 11529966,
    palevioletred: 14381203,
    papayawhip: 16773077,
    peachpuff: 16767673,
    peru: 13468991,
    pink: 16761035,
    plum: 14524637,
    powderblue: 11591910,
    purple: 8388736,
    rebeccapurple: 6697881,
    red: 16711680,
    rosybrown: 12357519,
    royalblue: 4286945,
    saddlebrown: 9127187,
    salmon: 16416882,
    sandybrown: 16032864,
    seagreen: 3050327,
    seashell: 16774638,
    sienna: 10506797,
    silver: 12632256,
    skyblue: 8900331,
    slateblue: 6970061,
    slategray: 7372944,
    slategrey: 7372944,
    snow: 16775930,
    springgreen: 65407,
    steelblue: 4620980,
    tan: 13808780,
    teal: 32896,
    thistle: 14204888,
    tomato: 16737095,
    turquoise: 4251856,
    violet: 15631086,
    wheat: 16113331,
    white: 16777215,
    whitesmoke: 16119285,
    yellow: 16776960,
    yellowgreen: 10145074
  });
  d3_rgb_names.forEach(function(key, value) {
    d3_rgb_names.set(key, d3_rgbNumber(value));
  });
  function d3_functor(v) {
    return typeof v === "function" ? v : function() {
      return v;
    };
  }
  d3.functor = d3_functor;
  d3.xhr = d3_xhrType(d3_identity);
  function d3_xhrType(response) {
    return function(url, mimeType, callback) {
      if (arguments.length === 2 && typeof mimeType === "function") callback = mimeType, 
      mimeType = null;
      return d3_xhr(url, mimeType, response, callback);
    };
  }
  function d3_xhr(url, mimeType, response, callback) {
    var xhr = {}, dispatch = d3.dispatch("beforesend", "progress", "load", "error"), headers = {}, request = new XMLHttpRequest(), responseType = null;
    if (this.XDomainRequest && !("withCredentials" in request) && /^(http(s)?:)?\/\//.test(url)) request = new XDomainRequest();
    "onload" in request ? request.onload = request.onerror = respond : request.onreadystatechange = function() {
      request.readyState > 3 && respond();
    };
    function respond() {
      var status = request.status, result;
      if (!status && d3_xhrHasResponse(request) || status >= 200 && status < 300 || status === 304) {
        try {
          result = response.call(xhr, request);
        } catch (e) {
          dispatch.error.call(xhr, e);
          return;
        }
        dispatch.load.call(xhr, result);
      } else {
        dispatch.error.call(xhr, request);
      }
    }
    request.onprogress = function(event) {
      var o = d3.event;
      d3.event = event;
      try {
        dispatch.progress.call(xhr, request);
      } finally {
        d3.event = o;
      }
    };
    xhr.header = function(name, value) {
      name = (name + "").toLowerCase();
      if (arguments.length < 2) return headers[name];
      if (value == null) delete headers[name]; else headers[name] = value + "";
      return xhr;
    };
    xhr.mimeType = function(value) {
      if (!arguments.length) return mimeType;
      mimeType = value == null ? null : value + "";
      return xhr;
    };
    xhr.responseType = function(value) {
      if (!arguments.length) return responseType;
      responseType = value;
      return xhr;
    };
    xhr.response = function(value) {
      response = value;
      return xhr;
    };
    [ "get", "post" ].forEach(function(method) {
      xhr[method] = function() {
        return xhr.send.apply(xhr, [ method ].concat(d3_array(arguments)));
      };
    });
    xhr.send = function(method, data, callback) {
      if (arguments.length === 2 && typeof data === "function") callback = data, data = null;
      request.open(method, url, true);
      if (mimeType != null && !("accept" in headers)) headers["accept"] = mimeType + ",*/*";
      if (request.setRequestHeader) for (var name in headers) request.setRequestHeader(name, headers[name]);
      if (mimeType != null && request.overrideMimeType) request.overrideMimeType(mimeType);
      if (responseType != null) request.responseType = responseType;
      if (callback != null) xhr.on("error", callback).on("load", function(request) {
        callback(null, request);
      });
      dispatch.beforesend.call(xhr, request);
      request.send(data == null ? null : data);
      return xhr;
    };
    xhr.abort = function() {
      request.abort();
      return xhr;
    };
    d3.rebind(xhr, dispatch, "on");
    return callback == null ? xhr : xhr.get(d3_xhr_fixCallback(callback));
  }
  function d3_xhr_fixCallback(callback) {
    return callback.length === 1 ? function(error, request) {
      callback(error == null ? request : null);
    } : callback;
  }
  function d3_xhrHasResponse(request) {
    var type = request.responseType;
    return type && type !== "text" ? request.response : request.responseText;
  }
  d3.dsv = function(delimiter, mimeType) {
    var reFormat = new RegExp('["' + delimiter + "\n]"), delimiterCode = delimiter.charCodeAt(0);
    function dsv(url, row, callback) {
      if (arguments.length < 3) callback = row, row = null;
      var xhr = d3_xhr(url, mimeType, row == null ? response : typedResponse(row), callback);
      xhr.row = function(_) {
        return arguments.length ? xhr.response((row = _) == null ? response : typedResponse(_)) : row;
      };
      return xhr;
    }
    function response(request) {
      return dsv.parse(request.responseText);
    }
    function typedResponse(f) {
      return function(request) {
        return dsv.parse(request.responseText, f);
      };
    }
    dsv.parse = function(text, f) {
      var o;
      return dsv.parseRows(text, function(row, i) {
        if (o) return o(row, i - 1);
        var a = new Function("d", "return {" + row.map(function(name, i) {
          return JSON.stringify(name) + ": d[" + i + "]";
        }).join(",") + "}");
        o = f ? function(row, i) {
          return f(a(row), i);
        } : a;
      });
    };
    dsv.parseRows = function(text, f) {
      var EOL = {}, EOF = {}, rows = [], N = text.length, I = 0, n = 0, t, eol;
      function token() {
        if (I >= N) return EOF;
        if (eol) return eol = false, EOL;
        var j = I;
        if (text.charCodeAt(j) === 34) {
          var i = j;
          while (i++ < N) {
            if (text.charCodeAt(i) === 34) {
              if (text.charCodeAt(i + 1) !== 34) break;
              ++i;
            }
          }
          I = i + 2;
          var c = text.charCodeAt(i + 1);
          if (c === 13) {
            eol = true;
            if (text.charCodeAt(i + 2) === 10) ++I;
          } else if (c === 10) {
            eol = true;
          }
          return text.slice(j + 1, i).replace(/""/g, '"');
        }
        while (I < N) {
          var c = text.charCodeAt(I++), k = 1;
          if (c === 10) eol = true; else if (c === 13) {
            eol = true;
            if (text.charCodeAt(I) === 10) ++I, ++k;
          } else if (c !== delimiterCode) continue;
          return text.slice(j, I - k);
        }
        return text.slice(j);
      }
      while ((t = token()) !== EOF) {
        var a = [];
        while (t !== EOL && t !== EOF) {
          a.push(t);
          t = token();
        }
        if (f && (a = f(a, n++)) == null) continue;
        rows.push(a);
      }
      return rows;
    };
    dsv.format = function(rows) {
      if (Array.isArray(rows[0])) return dsv.formatRows(rows);
      var fieldSet = new d3_Set(), fields = [];
      rows.forEach(function(row) {
        for (var field in row) {
          if (!fieldSet.has(field)) {
            fields.push(fieldSet.add(field));
          }
        }
      });
      return [ fields.map(formatValue).join(delimiter) ].concat(rows.map(function(row) {
        return fields.map(function(field) {
          return formatValue(row[field]);
        }).join(delimiter);
      })).join("\n");
    };
    dsv.formatRows = function(rows) {
      return rows.map(formatRow).join("\n");
    };
    function formatRow(row) {
      return row.map(formatValue).join(delimiter);
    }
    function formatValue(text) {
      return reFormat.test(text) ? '"' + text.replace(/\"/g, '""') + '"' : text;
    }
    return dsv;
  };
  d3.csv = d3.dsv(",", "text/csv");
  d3.tsv = d3.dsv("	", "text/tab-separated-values");
  var d3_timer_queueHead, d3_timer_queueTail, d3_timer_interval, d3_timer_timeout, d3_timer_active, d3_timer_frame = this[d3_vendorSymbol(this, "requestAnimationFrame")] || function(callback) {
    setTimeout(callback, 17);
  };
  d3.timer = function(callback, delay, then) {
    var n = arguments.length;
    if (n < 2) delay = 0;
    if (n < 3) then = Date.now();
    var time = then + delay, timer = {
      c: callback,
      t: time,
      f: false,
      n: null
    };
    if (d3_timer_queueTail) d3_timer_queueTail.n = timer; else d3_timer_queueHead = timer;
    d3_timer_queueTail = timer;
    if (!d3_timer_interval) {
      d3_timer_timeout = clearTimeout(d3_timer_timeout);
      d3_timer_interval = 1;
      d3_timer_frame(d3_timer_step);
    }
  };
  function d3_timer_step() {
    var now = d3_timer_mark(), delay = d3_timer_sweep() - now;
    if (delay > 24) {
      if (isFinite(delay)) {
        clearTimeout(d3_timer_timeout);
        d3_timer_timeout = setTimeout(d3_timer_step, delay);
      }
      d3_timer_interval = 0;
    } else {
      d3_timer_interval = 1;
      d3_timer_frame(d3_timer_step);
    }
  }
  d3.timer.flush = function() {
    d3_timer_mark();
    d3_timer_sweep();
  };
  function d3_timer_mark() {
    var now = Date.now();
    d3_timer_active = d3_timer_queueHead;
    while (d3_timer_active) {
      if (now >= d3_timer_active.t) d3_timer_active.f = d3_timer_active.c(now - d3_timer_active.t);
      d3_timer_active = d3_timer_active.n;
    }
    return now;
  }
  function d3_timer_sweep() {
    var t0, t1 = d3_timer_queueHead, time = Infinity;
    while (t1) {
      if (t1.f) {
        t1 = t0 ? t0.n = t1.n : d3_timer_queueHead = t1.n;
      } else {
        if (t1.t < time) time = t1.t;
        t1 = (t0 = t1).n;
      }
    }
    d3_timer_queueTail = t0;
    return time;
  }
  function d3_format_precision(x, p) {
    return p - (x ? Math.ceil(Math.log(x) / Math.LN10) : 1);
  }
  d3.round = function(x, n) {
    return n ? Math.round(x * (n = Math.pow(10, n))) / n : Math.round(x);
  };
  var d3_formatPrefixes = [ "y", "z", "a", "f", "p", "n", "µ", "m", "", "k", "M", "G", "T", "P", "E", "Z", "Y" ].map(d3_formatPrefix);
  d3.formatPrefix = function(value, precision) {
    var i = 0;
    if (value) {
      if (value < 0) value *= -1;
      if (precision) value = d3.round(value, d3_format_precision(value, precision));
      i = 1 + Math.floor(1e-12 + Math.log(value) / Math.LN10);
      i = Math.max(-24, Math.min(24, Math.floor((i - 1) / 3) * 3));
    }
    return d3_formatPrefixes[8 + i / 3];
  };
  function d3_formatPrefix(d, i) {
    var k = Math.pow(10, abs(8 - i) * 3);
    return {
      scale: i > 8 ? function(d) {
        return d / k;
      } : function(d) {
        return d * k;
      },
      symbol: d
    };
  }
  function d3_locale_numberFormat(locale) {
    var locale_decimal = locale.decimal, locale_thousands = locale.thousands, locale_grouping = locale.grouping, locale_currency = locale.currency, formatGroup = locale_grouping && locale_thousands ? function(value, width) {
      var i = value.length, t = [], j = 0, g = locale_grouping[0], length = 0;
      while (i > 0 && g > 0) {
        if (length + g + 1 > width) g = Math.max(1, width - length);
        t.push(value.substring(i -= g, i + g));
        if ((length += g + 1) > width) break;
        g = locale_grouping[j = (j + 1) % locale_grouping.length];
      }
      return t.reverse().join(locale_thousands);
    } : d3_identity;
    return function(specifier) {
      var match = d3_format_re.exec(specifier), fill = match[1] || " ", align = match[2] || ">", sign = match[3] || "-", symbol = match[4] || "", zfill = match[5], width = +match[6], comma = match[7], precision = match[8], type = match[9], scale = 1, prefix = "", suffix = "", integer = false, exponent = true;
      if (precision) precision = +precision.substring(1);
      if (zfill || fill === "0" && align === "=") {
        zfill = fill = "0";
        align = "=";
      }
      switch (type) {
       case "n":
        comma = true;
        type = "g";
        break;

       case "%":
        scale = 100;
        suffix = "%";
        type = "f";
        break;

       case "p":
        scale = 100;
        suffix = "%";
        type = "r";
        break;

       case "b":
       case "o":
       case "x":
       case "X":
        if (symbol === "#") prefix = "0" + type.toLowerCase();

       case "c":
        exponent = false;

       case "d":
        integer = true;
        precision = 0;
        break;

       case "s":
        scale = -1;
        type = "r";
        break;
      }
      if (symbol === "$") prefix = locale_currency[0], suffix = locale_currency[1];
      if (type == "r" && !precision) type = "g";
      if (precision != null) {
        if (type == "g") precision = Math.max(1, Math.min(21, precision)); else if (type == "e" || type == "f") precision = Math.max(0, Math.min(20, precision));
      }
      type = d3_format_types.get(type) || d3_format_typeDefault;
      var zcomma = zfill && comma;
      return function(value) {
        var fullSuffix = suffix;
        if (integer && value % 1) return "";
        var negative = value < 0 || value === 0 && 1 / value < 0 ? (value = -value, "-") : sign === "-" ? "" : sign;
        if (scale < 0) {
          var unit = d3.formatPrefix(value, precision);
          value = unit.scale(value);
          fullSuffix = unit.symbol + suffix;
        } else {
          value *= scale;
        }
        value = type(value, precision);
        var i = value.lastIndexOf("."), before, after;
        if (i < 0) {
          var j = exponent ? value.lastIndexOf("e") : -1;
          if (j < 0) before = value, after = ""; else before = value.substring(0, j), after = value.substring(j);
        } else {
          before = value.substring(0, i);
          after = locale_decimal + value.substring(i + 1);
        }
        if (!zfill && comma) before = formatGroup(before, Infinity);
        var length = prefix.length + before.length + after.length + (zcomma ? 0 : negative.length), padding = length < width ? new Array(length = width - length + 1).join(fill) : "";
        if (zcomma) before = formatGroup(padding + before, padding.length ? width - after.length : Infinity);
        negative += prefix;
        value = before + after;
        return (align === "<" ? negative + value + padding : align === ">" ? padding + negative + value : align === "^" ? padding.substring(0, length >>= 1) + negative + value + padding.substring(length) : negative + (zcomma ? value : padding + value)) + fullSuffix;
      };
    };
  }
  var d3_format_re = /(?:([^{])?([<>=^]))?([+\- ])?([$#])?(0)?(\d+)?(,)?(\.-?\d+)?([a-z%])?/i;
  var d3_format_types = d3.map({
    b: function(x) {
      return x.toString(2);
    },
    c: function(x) {
      return String.fromCharCode(x);
    },
    o: function(x) {
      return x.toString(8);
    },
    x: function(x) {
      return x.toString(16);
    },
    X: function(x) {
      return x.toString(16).toUpperCase();
    },
    g: function(x, p) {
      return x.toPrecision(p);
    },
    e: function(x, p) {
      return x.toExponential(p);
    },
    f: function(x, p) {
      return x.toFixed(p);
    },
    r: function(x, p) {
      return (x = d3.round(x, d3_format_precision(x, p))).toFixed(Math.max(0, Math.min(20, d3_format_precision(x * (1 + 1e-15), p))));
    }
  });
  function d3_format_typeDefault(x) {
    return x + "";
  }
  var d3_time = d3.time = {}, d3_date = Date;
  function d3_date_utc() {
    this._ = new Date(arguments.length > 1 ? Date.UTC.apply(this, arguments) : arguments[0]);
  }
  d3_date_utc.prototype = {
    getDate: function() {
      return this._.getUTCDate();
    },
    getDay: function() {
      return this._.getUTCDay();
    },
    getFullYear: function() {
      return this._.getUTCFullYear();
    },
    getHours: function() {
      return this._.getUTCHours();
    },
    getMilliseconds: function() {
      return this._.getUTCMilliseconds();
    },
    getMinutes: function() {
      return this._.getUTCMinutes();
    },
    getMonth: function() {
      return this._.getUTCMonth();
    },
    getSeconds: function() {
      return this._.getUTCSeconds();
    },
    getTime: function() {
      return this._.getTime();
    },
    getTimezoneOffset: function() {
      return 0;
    },
    valueOf: function() {
      return this._.valueOf();
    },
    setDate: function() {
      d3_time_prototype.setUTCDate.apply(this._, arguments);
    },
    setDay: function() {
      d3_time_prototype.setUTCDay.apply(this._, arguments);
    },
    setFullYear: function() {
      d3_time_prototype.setUTCFullYear.apply(this._, arguments);
    },
    setHours: function() {
      d3_time_prototype.setUTCHours.apply(this._, arguments);
    },
    setMilliseconds: function() {
      d3_time_prototype.setUTCMilliseconds.apply(this._, arguments);
    },
    setMinutes: function() {
      d3_time_prototype.setUTCMinutes.apply(this._, arguments);
    },
    setMonth: function() {
      d3_time_prototype.setUTCMonth.apply(this._, arguments);
    },
    setSeconds: function() {
      d3_time_prototype.setUTCSeconds.apply(this._, arguments);
    },
    setTime: function() {
      d3_time_prototype.setTime.apply(this._, arguments);
    }
  };
  var d3_time_prototype = Date.prototype;
  function d3_time_interval(local, step, number) {
    function round(date) {
      var d0 = local(date), d1 = offset(d0, 1);
      return date - d0 < d1 - date ? d0 : d1;
    }
    function ceil(date) {
      step(date = local(new d3_date(date - 1)), 1);
      return date;
    }
    function offset(date, k) {
      step(date = new d3_date(+date), k);
      return date;
    }
    function range(t0, t1, dt) {
      var time = ceil(t0), times = [];
      if (dt > 1) {
        while (time < t1) {
          if (!(number(time) % dt)) times.push(new Date(+time));
          step(time, 1);
        }
      } else {
        while (time < t1) times.push(new Date(+time)), step(time, 1);
      }
      return times;
    }
    function range_utc(t0, t1, dt) {
      try {
        d3_date = d3_date_utc;
        var utc = new d3_date_utc();
        utc._ = t0;
        return range(utc, t1, dt);
      } finally {
        d3_date = Date;
      }
    }
    local.floor = local;
    local.round = round;
    local.ceil = ceil;
    local.offset = offset;
    local.range = range;
    var utc = local.utc = d3_time_interval_utc(local);
    utc.floor = utc;
    utc.round = d3_time_interval_utc(round);
    utc.ceil = d3_time_interval_utc(ceil);
    utc.offset = d3_time_interval_utc(offset);
    utc.range = range_utc;
    return local;
  }
  function d3_time_interval_utc(method) {
    return function(date, k) {
      try {
        d3_date = d3_date_utc;
        var utc = new d3_date_utc();
        utc._ = date;
        return method(utc, k)._;
      } finally {
        d3_date = Date;
      }
    };
  }
  d3_time.year = d3_time_interval(function(date) {
    date = d3_time.day(date);
    date.setMonth(0, 1);
    return date;
  }, function(date, offset) {
    date.setFullYear(date.getFullYear() + offset);
  }, function(date) {
    return date.getFullYear();
  });
  d3_time.years = d3_time.year.range;
  d3_time.years.utc = d3_time.year.utc.range;
  d3_time.day = d3_time_interval(function(date) {
    var day = new d3_date(2e3, 0);
    day.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    return day;
  }, function(date, offset) {
    date.setDate(date.getDate() + offset);
  }, function(date) {
    return date.getDate() - 1;
  });
  d3_time.days = d3_time.day.range;
  d3_time.days.utc = d3_time.day.utc.range;
  d3_time.dayOfYear = function(date) {
    var year = d3_time.year(date);
    return Math.floor((date - year - (date.getTimezoneOffset() - year.getTimezoneOffset()) * 6e4) / 864e5);
  };
  [ "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday" ].forEach(function(day, i) {
    i = 7 - i;
    var interval = d3_time[day] = d3_time_interval(function(date) {
      (date = d3_time.day(date)).setDate(date.getDate() - (date.getDay() + i) % 7);
      return date;
    }, function(date, offset) {
      date.setDate(date.getDate() + Math.floor(offset) * 7);
    }, function(date) {
      var day = d3_time.year(date).getDay();
      return Math.floor((d3_time.dayOfYear(date) + (day + i) % 7) / 7) - (day !== i);
    });
    d3_time[day + "s"] = interval.range;
    d3_time[day + "s"].utc = interval.utc.range;
    d3_time[day + "OfYear"] = function(date) {
      var day = d3_time.year(date).getDay();
      return Math.floor((d3_time.dayOfYear(date) + (day + i) % 7) / 7);
    };
  });
  d3_time.week = d3_time.sunday;
  d3_time.weeks = d3_time.sunday.range;
  d3_time.weeks.utc = d3_time.sunday.utc.range;
  d3_time.weekOfYear = d3_time.sundayOfYear;
  function d3_locale_timeFormat(locale) {
    var locale_dateTime = locale.dateTime, locale_date = locale.date, locale_time = locale.time, locale_periods = locale.periods, locale_days = locale.days, locale_shortDays = locale.shortDays, locale_months = locale.months, locale_shortMonths = locale.shortMonths;
    function d3_time_format(template) {
      var n = template.length;
      function format(date) {
        var string = [], i = -1, j = 0, c, p, f;
        while (++i < n) {
          if (template.charCodeAt(i) === 37) {
            string.push(template.slice(j, i));
            if ((p = d3_time_formatPads[c = template.charAt(++i)]) != null) c = template.charAt(++i);
            if (f = d3_time_formats[c]) c = f(date, p == null ? c === "e" ? " " : "0" : p);
            string.push(c);
            j = i + 1;
          }
        }
        string.push(template.slice(j, i));
        return string.join("");
      }
      format.parse = function(string) {
        var d = {
          y: 1900,
          m: 0,
          d: 1,
          H: 0,
          M: 0,
          S: 0,
          L: 0,
          Z: null
        }, i = d3_time_parse(d, template, string, 0);
        if (i != string.length) return null;
        if ("p" in d) d.H = d.H % 12 + d.p * 12;
        var localZ = d.Z != null && d3_date !== d3_date_utc, date = new (localZ ? d3_date_utc : d3_date)();
        if ("j" in d) date.setFullYear(d.y, 0, d.j); else if ("w" in d && ("W" in d || "U" in d)) {
          date.setFullYear(d.y, 0, 1);
          date.setFullYear(d.y, 0, "W" in d ? (d.w + 6) % 7 + d.W * 7 - (date.getDay() + 5) % 7 : d.w + d.U * 7 - (date.getDay() + 6) % 7);
        } else date.setFullYear(d.y, d.m, d.d);
        date.setHours(d.H + (d.Z / 100 | 0), d.M + d.Z % 100, d.S, d.L);
        return localZ ? date._ : date;
      };
      format.toString = function() {
        return template;
      };
      return format;
    }
    function d3_time_parse(date, template, string, j) {
      var c, p, t, i = 0, n = template.length, m = string.length;
      while (i < n) {
        if (j >= m) return -1;
        c = template.charCodeAt(i++);
        if (c === 37) {
          t = template.charAt(i++);
          p = d3_time_parsers[t in d3_time_formatPads ? template.charAt(i++) : t];
          if (!p || (j = p(date, string, j)) < 0) return -1;
        } else if (c != string.charCodeAt(j++)) {
          return -1;
        }
      }
      return j;
    }
    d3_time_format.utc = function(template) {
      var local = d3_time_format(template);
      function format(date) {
        try {
          d3_date = d3_date_utc;
          var utc = new d3_date();
          utc._ = date;
          return local(utc);
        } finally {
          d3_date = Date;
        }
      }
      format.parse = function(string) {
        try {
          d3_date = d3_date_utc;
          var date = local.parse(string);
          return date && date._;
        } finally {
          d3_date = Date;
        }
      };
      format.toString = local.toString;
      return format;
    };
    d3_time_format.multi = d3_time_format.utc.multi = d3_time_formatMulti;
    var d3_time_periodLookup = d3.map(), d3_time_dayRe = d3_time_formatRe(locale_days), d3_time_dayLookup = d3_time_formatLookup(locale_days), d3_time_dayAbbrevRe = d3_time_formatRe(locale_shortDays), d3_time_dayAbbrevLookup = d3_time_formatLookup(locale_shortDays), d3_time_monthRe = d3_time_formatRe(locale_months), d3_time_monthLookup = d3_time_formatLookup(locale_months), d3_time_monthAbbrevRe = d3_time_formatRe(locale_shortMonths), d3_time_monthAbbrevLookup = d3_time_formatLookup(locale_shortMonths);
    locale_periods.forEach(function(p, i) {
      d3_time_periodLookup.set(p.toLowerCase(), i);
    });
    var d3_time_formats = {
      a: function(d) {
        return locale_shortDays[d.getDay()];
      },
      A: function(d) {
        return locale_days[d.getDay()];
      },
      b: function(d) {
        return locale_shortMonths[d.getMonth()];
      },
      B: function(d) {
        return locale_months[d.getMonth()];
      },
      c: d3_time_format(locale_dateTime),
      d: function(d, p) {
        return d3_time_formatPad(d.getDate(), p, 2);
      },
      e: function(d, p) {
        return d3_time_formatPad(d.getDate(), p, 2);
      },
      H: function(d, p) {
        return d3_time_formatPad(d.getHours(), p, 2);
      },
      I: function(d, p) {
        return d3_time_formatPad(d.getHours() % 12 || 12, p, 2);
      },
      j: function(d, p) {
        return d3_time_formatPad(1 + d3_time.dayOfYear(d), p, 3);
      },
      L: function(d, p) {
        return d3_time_formatPad(d.getMilliseconds(), p, 3);
      },
      m: function(d, p) {
        return d3_time_formatPad(d.getMonth() + 1, p, 2);
      },
      M: function(d, p) {
        return d3_time_formatPad(d.getMinutes(), p, 2);
      },
      p: function(d) {
        return locale_periods[+(d.getHours() >= 12)];
      },
      S: function(d, p) {
        return d3_time_formatPad(d.getSeconds(), p, 2);
      },
      U: function(d, p) {
        return d3_time_formatPad(d3_time.sundayOfYear(d), p, 2);
      },
      w: function(d) {
        return d.getDay();
      },
      W: function(d, p) {
        return d3_time_formatPad(d3_time.mondayOfYear(d), p, 2);
      },
      x: d3_time_format(locale_date),
      X: d3_time_format(locale_time),
      y: function(d, p) {
        return d3_time_formatPad(d.getFullYear() % 100, p, 2);
      },
      Y: function(d, p) {
        return d3_time_formatPad(d.getFullYear() % 1e4, p, 4);
      },
      Z: d3_time_zone,
      "%": function() {
        return "%";
      }
    };
    var d3_time_parsers = {
      a: d3_time_parseWeekdayAbbrev,
      A: d3_time_parseWeekday,
      b: d3_time_parseMonthAbbrev,
      B: d3_time_parseMonth,
      c: d3_time_parseLocaleFull,
      d: d3_time_parseDay,
      e: d3_time_parseDay,
      H: d3_time_parseHour24,
      I: d3_time_parseHour24,
      j: d3_time_parseDayOfYear,
      L: d3_time_parseMilliseconds,
      m: d3_time_parseMonthNumber,
      M: d3_time_parseMinutes,
      p: d3_time_parseAmPm,
      S: d3_time_parseSeconds,
      U: d3_time_parseWeekNumberSunday,
      w: d3_time_parseWeekdayNumber,
      W: d3_time_parseWeekNumberMonday,
      x: d3_time_parseLocaleDate,
      X: d3_time_parseLocaleTime,
      y: d3_time_parseYear,
      Y: d3_time_parseFullYear,
      Z: d3_time_parseZone,
      "%": d3_time_parseLiteralPercent
    };
    function d3_time_parseWeekdayAbbrev(date, string, i) {
      d3_time_dayAbbrevRe.lastIndex = 0;
      var n = d3_time_dayAbbrevRe.exec(string.slice(i));
      return n ? (date.w = d3_time_dayAbbrevLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
    }
    function d3_time_parseWeekday(date, string, i) {
      d3_time_dayRe.lastIndex = 0;
      var n = d3_time_dayRe.exec(string.slice(i));
      return n ? (date.w = d3_time_dayLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
    }
    function d3_time_parseMonthAbbrev(date, string, i) {
      d3_time_monthAbbrevRe.lastIndex = 0;
      var n = d3_time_monthAbbrevRe.exec(string.slice(i));
      return n ? (date.m = d3_time_monthAbbrevLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
    }
    function d3_time_parseMonth(date, string, i) {
      d3_time_monthRe.lastIndex = 0;
      var n = d3_time_monthRe.exec(string.slice(i));
      return n ? (date.m = d3_time_monthLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
    }
    function d3_time_parseLocaleFull(date, string, i) {
      return d3_time_parse(date, d3_time_formats.c.toString(), string, i);
    }
    function d3_time_parseLocaleDate(date, string, i) {
      return d3_time_parse(date, d3_time_formats.x.toString(), string, i);
    }
    function d3_time_parseLocaleTime(date, string, i) {
      return d3_time_parse(date, d3_time_formats.X.toString(), string, i);
    }
    function d3_time_parseAmPm(date, string, i) {
      var n = d3_time_periodLookup.get(string.slice(i, i += 2).toLowerCase());
      return n == null ? -1 : (date.p = n, i);
    }
    return d3_time_format;
  }
  var d3_time_formatPads = {
    "-": "",
    _: " ",
    "0": "0"
  }, d3_time_numberRe = /^\s*\d+/, d3_time_percentRe = /^%/;
  function d3_time_formatPad(value, fill, width) {
    var sign = value < 0 ? "-" : "", string = (sign ? -value : value) + "", length = string.length;
    return sign + (length < width ? new Array(width - length + 1).join(fill) + string : string);
  }
  function d3_time_formatRe(names) {
    return new RegExp("^(?:" + names.map(d3.requote).join("|") + ")", "i");
  }
  function d3_time_formatLookup(names) {
    var map = new d3_Map(), i = -1, n = names.length;
    while (++i < n) map.set(names[i].toLowerCase(), i);
    return map;
  }
  function d3_time_parseWeekdayNumber(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 1));
    return n ? (date.w = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseWeekNumberSunday(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i));
    return n ? (date.U = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseWeekNumberMonday(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i));
    return n ? (date.W = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseFullYear(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 4));
    return n ? (date.y = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseYear(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 2));
    return n ? (date.y = d3_time_expandYear(+n[0]), i + n[0].length) : -1;
  }
  function d3_time_parseZone(date, string, i) {
    return /^[+-]\d{4}$/.test(string = string.slice(i, i + 5)) ? (date.Z = -string, 
    i + 5) : -1;
  }
  function d3_time_expandYear(d) {
    return d + (d > 68 ? 1900 : 2e3);
  }
  function d3_time_parseMonthNumber(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 2));
    return n ? (date.m = n[0] - 1, i + n[0].length) : -1;
  }
  function d3_time_parseDay(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 2));
    return n ? (date.d = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseDayOfYear(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 3));
    return n ? (date.j = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseHour24(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 2));
    return n ? (date.H = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseMinutes(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 2));
    return n ? (date.M = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseSeconds(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 2));
    return n ? (date.S = +n[0], i + n[0].length) : -1;
  }
  function d3_time_parseMilliseconds(date, string, i) {
    d3_time_numberRe.lastIndex = 0;
    var n = d3_time_numberRe.exec(string.slice(i, i + 3));
    return n ? (date.L = +n[0], i + n[0].length) : -1;
  }
  function d3_time_zone(d) {
    var z = d.getTimezoneOffset(), zs = z > 0 ? "-" : "+", zh = abs(z) / 60 | 0, zm = abs(z) % 60;
    return zs + d3_time_formatPad(zh, "0", 2) + d3_time_formatPad(zm, "0", 2);
  }
  function d3_time_parseLiteralPercent(date, string, i) {
    d3_time_percentRe.lastIndex = 0;
    var n = d3_time_percentRe.exec(string.slice(i, i + 1));
    return n ? i + n[0].length : -1;
  }
  function d3_time_formatMulti(formats) {
    var n = formats.length, i = -1;
    while (++i < n) formats[i][0] = this(formats[i][0]);
    return function(date) {
      var i = 0, f = formats[i];
      while (!f[1](date)) f = formats[++i];
      return f[0](date);
    };
  }
  d3.locale = function(locale) {
    return {
      numberFormat: d3_locale_numberFormat(locale),
      timeFormat: d3_locale_timeFormat(locale)
    };
  };
  var d3_locale_enUS = d3.locale({
    decimal: ".",
    thousands: ",",
    grouping: [ 3 ],
    currency: [ "$", "" ],
    dateTime: "%a %b %e %X %Y",
    date: "%m/%d/%Y",
    time: "%H:%M:%S",
    periods: [ "AM", "PM" ],
    days: [ "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" ],
    shortDays: [ "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat" ],
    months: [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ],
    shortMonths: [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ]
  });
  d3.format = d3_locale_enUS.numberFormat;
  d3.geo = {};
  function d3_adder() {}
  d3_adder.prototype = {
    s: 0,
    t: 0,
    add: function(y) {
      d3_adderSum(y, this.t, d3_adderTemp);
      d3_adderSum(d3_adderTemp.s, this.s, this);
      if (this.s) this.t += d3_adderTemp.t; else this.s = d3_adderTemp.t;
    },
    reset: function() {
      this.s = this.t = 0;
    },
    valueOf: function() {
      return this.s;
    }
  };
  var d3_adderTemp = new d3_adder();
  function d3_adderSum(a, b, o) {
    var x = o.s = a + b, bv = x - a, av = x - bv;
    o.t = a - av + (b - bv);
  }
  d3.geo.stream = function(object, listener) {
    if (object && d3_geo_streamObjectType.hasOwnProperty(object.type)) {
      d3_geo_streamObjectType[object.type](object, listener);
    } else {
      d3_geo_streamGeometry(object, listener);
    }
  };
  function d3_geo_streamGeometry(geometry, listener) {
    if (geometry && d3_geo_streamGeometryType.hasOwnProperty(geometry.type)) {
      d3_geo_streamGeometryType[geometry.type](geometry, listener);
    }
  }
  var d3_geo_streamObjectType = {
    Feature: function(feature, listener) {
      d3_geo_streamGeometry(feature.geometry, listener);
    },
    FeatureCollection: function(object, listener) {
      var features = object.features, i = -1, n = features.length;
      while (++i < n) d3_geo_streamGeometry(features[i].geometry, listener);
    }
  };
  var d3_geo_streamGeometryType = {
    Sphere: function(object, listener) {
      listener.sphere();
    },
    Point: function(object, listener) {
      object = object.coordinates;
      listener.point(object[0], object[1], object[2]);
    },
    MultiPoint: function(object, listener) {
      var coordinates = object.coordinates, i = -1, n = coordinates.length;
      while (++i < n) object = coordinates[i], listener.point(object[0], object[1], object[2]);
    },
    LineString: function(object, listener) {
      d3_geo_streamLine(object.coordinates, listener, 0);
    },
    MultiLineString: function(object, listener) {
      var coordinates = object.coordinates, i = -1, n = coordinates.length;
      while (++i < n) d3_geo_streamLine(coordinates[i], listener, 0);
    },
    Polygon: function(object, listener) {
      d3_geo_streamPolygon(object.coordinates, listener);
    },
    MultiPolygon: function(object, listener) {
      var coordinates = object.coordinates, i = -1, n = coordinates.length;
      while (++i < n) d3_geo_streamPolygon(coordinates[i], listener);
    },
    GeometryCollection: function(object, listener) {
      var geometries = object.geometries, i = -1, n = geometries.length;
      while (++i < n) d3_geo_streamGeometry(geometries[i], listener);
    }
  };
  function d3_geo_streamLine(coordinates, listener, closed) {
    var i = -1, n = coordinates.length - closed, coordinate;
    listener.lineStart();
    while (++i < n) coordinate = coordinates[i], listener.point(coordinate[0], coordinate[1], coordinate[2]);
    listener.lineEnd();
  }
  function d3_geo_streamPolygon(coordinates, listener) {
    var i = -1, n = coordinates.length;
    listener.polygonStart();
    while (++i < n) d3_geo_streamLine(coordinates[i], listener, 1);
    listener.polygonEnd();
  }
  d3.geo.area = function(object) {
    d3_geo_areaSum = 0;
    d3.geo.stream(object, d3_geo_area);
    return d3_geo_areaSum;
  };
  var d3_geo_areaSum, d3_geo_areaRingSum = new d3_adder();
  var d3_geo_area = {
    sphere: function() {
      d3_geo_areaSum += 4 * π;
    },
    point: d3_noop,
    lineStart: d3_noop,
    lineEnd: d3_noop,
    polygonStart: function() {
      d3_geo_areaRingSum.reset();
      d3_geo_area.lineStart = d3_geo_areaRingStart;
    },
    polygonEnd: function() {
      var area = 2 * d3_geo_areaRingSum;
      d3_geo_areaSum += area < 0 ? 4 * π + area : area;
      d3_geo_area.lineStart = d3_geo_area.lineEnd = d3_geo_area.point = d3_noop;
    }
  };
  function d3_geo_areaRingStart() {
    var λ00, φ00, λ0, cosφ0, sinφ0;
    d3_geo_area.point = function(λ, φ) {
      d3_geo_area.point = nextPoint;
      λ0 = (λ00 = λ) * d3_radians, cosφ0 = Math.cos(φ = (φ00 = φ) * d3_radians / 2 + π / 4), 
      sinφ0 = Math.sin(φ);
    };
    function nextPoint(λ, φ) {
      λ *= d3_radians;
      φ = φ * d3_radians / 2 + π / 4;
      var dλ = λ - λ0, sdλ = dλ >= 0 ? 1 : -1, adλ = sdλ * dλ, cosφ = Math.cos(φ), sinφ = Math.sin(φ), k = sinφ0 * sinφ, u = cosφ0 * cosφ + k * Math.cos(adλ), v = k * sdλ * Math.sin(adλ);
      d3_geo_areaRingSum.add(Math.atan2(v, u));
      λ0 = λ, cosφ0 = cosφ, sinφ0 = sinφ;
    }
    d3_geo_area.lineEnd = function() {
      nextPoint(λ00, φ00);
    };
  }
  function d3_geo_cartesian(spherical) {
    var λ = spherical[0], φ = spherical[1], cosφ = Math.cos(φ);
    return [ cosφ * Math.cos(λ), cosφ * Math.sin(λ), Math.sin(φ) ];
  }
  function d3_geo_cartesianDot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
  function d3_geo_cartesianCross(a, b) {
    return [ a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0] ];
  }
  function d3_geo_cartesianAdd(a, b) {
    a[0] += b[0];
    a[1] += b[1];
    a[2] += b[2];
  }
  function d3_geo_cartesianScale(vector, k) {
    return [ vector[0] * k, vector[1] * k, vector[2] * k ];
  }
  function d3_geo_cartesianNormalize(d) {
    var l = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
    d[0] /= l;
    d[1] /= l;
    d[2] /= l;
  }
  function d3_geo_spherical(cartesian) {
    return [ Math.atan2(cartesian[1], cartesian[0]), d3_asin(cartesian[2]) ];
  }
  function d3_geo_sphericalEqual(a, b) {
    return abs(a[0] - b[0]) < ε && abs(a[1] - b[1]) < ε;
  }
  d3.geo.bounds = function() {
    var λ0, φ0, λ1, φ1, λ_, λ__, φ__, p0, dλSum, ranges, range;
    var bound = {
      point: point,
      lineStart: lineStart,
      lineEnd: lineEnd,
      polygonStart: function() {
        bound.point = ringPoint;
        bound.lineStart = ringStart;
        bound.lineEnd = ringEnd;
        dλSum = 0;
        d3_geo_area.polygonStart();
      },
      polygonEnd: function() {
        d3_geo_area.polygonEnd();
        bound.point = point;
        bound.lineStart = lineStart;
        bound.lineEnd = lineEnd;
        if (d3_geo_areaRingSum < 0) λ0 = -(λ1 = 180), φ0 = -(φ1 = 90); else if (dλSum > ε) φ1 = 90; else if (dλSum < -ε) φ0 = -90;
        range[0] = λ0, range[1] = λ1;
      }
    };
    function point(λ, φ) {
      ranges.push(range = [ λ0 = λ, λ1 = λ ]);
      if (φ < φ0) φ0 = φ;
      if (φ > φ1) φ1 = φ;
    }
    function linePoint(λ, φ) {
      var p = d3_geo_cartesian([ λ * d3_radians, φ * d3_radians ]);
      if (p0) {
        var normal = d3_geo_cartesianCross(p0, p), equatorial = [ normal[1], -normal[0], 0 ], inflection = d3_geo_cartesianCross(equatorial, normal);
        d3_geo_cartesianNormalize(inflection);
        inflection = d3_geo_spherical(inflection);
        var dλ = λ - λ_, s = dλ > 0 ? 1 : -1, λi = inflection[0] * d3_degrees * s, antimeridian = abs(dλ) > 180;
        if (antimeridian ^ (s * λ_ < λi && λi < s * λ)) {
          var φi = inflection[1] * d3_degrees;
          if (φi > φ1) φ1 = φi;
        } else if (λi = (λi + 360) % 360 - 180, antimeridian ^ (s * λ_ < λi && λi < s * λ)) {
          var φi = -inflection[1] * d3_degrees;
          if (φi < φ0) φ0 = φi;
        } else {
          if (φ < φ0) φ0 = φ;
          if (φ > φ1) φ1 = φ;
        }
        if (antimeridian) {
          if (λ < λ_) {
            if (angle(λ0, λ) > angle(λ0, λ1)) λ1 = λ;
          } else {
            if (angle(λ, λ1) > angle(λ0, λ1)) λ0 = λ;
          }
        } else {
          if (λ1 >= λ0) {
            if (λ < λ0) λ0 = λ;
            if (λ > λ1) λ1 = λ;
          } else {
            if (λ > λ_) {
              if (angle(λ0, λ) > angle(λ0, λ1)) λ1 = λ;
            } else {
              if (angle(λ, λ1) > angle(λ0, λ1)) λ0 = λ;
            }
          }
        }
      } else {
        point(λ, φ);
      }
      p0 = p, λ_ = λ;
    }
    function lineStart() {
      bound.point = linePoint;
    }
    function lineEnd() {
      range[0] = λ0, range[1] = λ1;
      bound.point = point;
      p0 = null;
    }
    function ringPoint(λ, φ) {
      if (p0) {
        var dλ = λ - λ_;
        dλSum += abs(dλ) > 180 ? dλ + (dλ > 0 ? 360 : -360) : dλ;
      } else λ__ = λ, φ__ = φ;
      d3_geo_area.point(λ, φ);
      linePoint(λ, φ);
    }
    function ringStart() {
      d3_geo_area.lineStart();
    }
    function ringEnd() {
      ringPoint(λ__, φ__);
      d3_geo_area.lineEnd();
      if (abs(dλSum) > ε) λ0 = -(λ1 = 180);
      range[0] = λ0, range[1] = λ1;
      p0 = null;
    }
    function angle(λ0, λ1) {
      return (λ1 -= λ0) < 0 ? λ1 + 360 : λ1;
    }
    function compareRanges(a, b) {
      return a[0] - b[0];
    }
    function withinRange(x, range) {
      return range[0] <= range[1] ? range[0] <= x && x <= range[1] : x < range[0] || range[1] < x;
    }
    return function(feature) {
      φ1 = λ1 = -(λ0 = φ0 = Infinity);
      ranges = [];
      d3.geo.stream(feature, bound);
      var n = ranges.length;
      if (n) {
        ranges.sort(compareRanges);
        for (var i = 1, a = ranges[0], b, merged = [ a ]; i < n; ++i) {
          b = ranges[i];
          if (withinRange(b[0], a) || withinRange(b[1], a)) {
            if (angle(a[0], b[1]) > angle(a[0], a[1])) a[1] = b[1];
            if (angle(b[0], a[1]) > angle(a[0], a[1])) a[0] = b[0];
          } else {
            merged.push(a = b);
          }
        }
        var best = -Infinity, dλ;
        for (var n = merged.length - 1, i = 0, a = merged[n], b; i <= n; a = b, ++i) {
          b = merged[i];
          if ((dλ = angle(a[1], b[0])) > best) best = dλ, λ0 = b[0], λ1 = a[1];
        }
      }
      ranges = range = null;
      return λ0 === Infinity || φ0 === Infinity ? [ [ NaN, NaN ], [ NaN, NaN ] ] : [ [ λ0, φ0 ], [ λ1, φ1 ] ];
    };
  }();
  d3.geo.centroid = function(object) {
    d3_geo_centroidW0 = d3_geo_centroidW1 = d3_geo_centroidX0 = d3_geo_centroidY0 = d3_geo_centroidZ0 = d3_geo_centroidX1 = d3_geo_centroidY1 = d3_geo_centroidZ1 = d3_geo_centroidX2 = d3_geo_centroidY2 = d3_geo_centroidZ2 = 0;
    d3.geo.stream(object, d3_geo_centroid);
    var x = d3_geo_centroidX2, y = d3_geo_centroidY2, z = d3_geo_centroidZ2, m = x * x + y * y + z * z;
    if (m < ε2) {
      x = d3_geo_centroidX1, y = d3_geo_centroidY1, z = d3_geo_centroidZ1;
      if (d3_geo_centroidW1 < ε) x = d3_geo_centroidX0, y = d3_geo_centroidY0, z = d3_geo_centroidZ0;
      m = x * x + y * y + z * z;
      if (m < ε2) return [ NaN, NaN ];
    }
    return [ Math.atan2(y, x) * d3_degrees, d3_asin(z / Math.sqrt(m)) * d3_degrees ];
  };
  var d3_geo_centroidW0, d3_geo_centroidW1, d3_geo_centroidX0, d3_geo_centroidY0, d3_geo_centroidZ0, d3_geo_centroidX1, d3_geo_centroidY1, d3_geo_centroidZ1, d3_geo_centroidX2, d3_geo_centroidY2, d3_geo_centroidZ2;
  var d3_geo_centroid = {
    sphere: d3_noop,
    point: d3_geo_centroidPoint,
    lineStart: d3_geo_centroidLineStart,
    lineEnd: d3_geo_centroidLineEnd,
    polygonStart: function() {
      d3_geo_centroid.lineStart = d3_geo_centroidRingStart;
    },
    polygonEnd: function() {
      d3_geo_centroid.lineStart = d3_geo_centroidLineStart;
    }
  };
  function d3_geo_centroidPoint(λ, φ) {
    λ *= d3_radians;
    var cosφ = Math.cos(φ *= d3_radians);
    d3_geo_centroidPointXYZ(cosφ * Math.cos(λ), cosφ * Math.sin(λ), Math.sin(φ));
  }
  function d3_geo_centroidPointXYZ(x, y, z) {
    ++d3_geo_centroidW0;
    d3_geo_centroidX0 += (x - d3_geo_centroidX0) / d3_geo_centroidW0;
    d3_geo_centroidY0 += (y - d3_geo_centroidY0) / d3_geo_centroidW0;
    d3_geo_centroidZ0 += (z - d3_geo_centroidZ0) / d3_geo_centroidW0;
  }
  function d3_geo_centroidLineStart() {
    var x0, y0, z0;
    d3_geo_centroid.point = function(λ, φ) {
      λ *= d3_radians;
      var cosφ = Math.cos(φ *= d3_radians);
      x0 = cosφ * Math.cos(λ);
      y0 = cosφ * Math.sin(λ);
      z0 = Math.sin(φ);
      d3_geo_centroid.point = nextPoint;
      d3_geo_centroidPointXYZ(x0, y0, z0);
    };
    function nextPoint(λ, φ) {
      λ *= d3_radians;
      var cosφ = Math.cos(φ *= d3_radians), x = cosφ * Math.cos(λ), y = cosφ * Math.sin(λ), z = Math.sin(φ), w = Math.atan2(Math.sqrt((w = y0 * z - z0 * y) * w + (w = z0 * x - x0 * z) * w + (w = x0 * y - y0 * x) * w), x0 * x + y0 * y + z0 * z);
      d3_geo_centroidW1 += w;
      d3_geo_centroidX1 += w * (x0 + (x0 = x));
      d3_geo_centroidY1 += w * (y0 + (y0 = y));
      d3_geo_centroidZ1 += w * (z0 + (z0 = z));
      d3_geo_centroidPointXYZ(x0, y0, z0);
    }
  }
  function d3_geo_centroidLineEnd() {
    d3_geo_centroid.point = d3_geo_centroidPoint;
  }
  function d3_geo_centroidRingStart() {
    var λ00, φ00, x0, y0, z0;
    d3_geo_centroid.point = function(λ, φ) {
      λ00 = λ, φ00 = φ;
      d3_geo_centroid.point = nextPoint;
      λ *= d3_radians;
      var cosφ = Math.cos(φ *= d3_radians);
      x0 = cosφ * Math.cos(λ);
      y0 = cosφ * Math.sin(λ);
      z0 = Math.sin(φ);
      d3_geo_centroidPointXYZ(x0, y0, z0);
    };
    d3_geo_centroid.lineEnd = function() {
      nextPoint(λ00, φ00);
      d3_geo_centroid.lineEnd = d3_geo_centroidLineEnd;
      d3_geo_centroid.point = d3_geo_centroidPoint;
    };
    function nextPoint(λ, φ) {
      λ *= d3_radians;
      var cosφ = Math.cos(φ *= d3_radians), x = cosφ * Math.cos(λ), y = cosφ * Math.sin(λ), z = Math.sin(φ), cx = y0 * z - z0 * y, cy = z0 * x - x0 * z, cz = x0 * y - y0 * x, m = Math.sqrt(cx * cx + cy * cy + cz * cz), u = x0 * x + y0 * y + z0 * z, v = m && -d3_acos(u) / m, w = Math.atan2(m, u);
      d3_geo_centroidX2 += v * cx;
      d3_geo_centroidY2 += v * cy;
      d3_geo_centroidZ2 += v * cz;
      d3_geo_centroidW1 += w;
      d3_geo_centroidX1 += w * (x0 + (x0 = x));
      d3_geo_centroidY1 += w * (y0 + (y0 = y));
      d3_geo_centroidZ1 += w * (z0 + (z0 = z));
      d3_geo_centroidPointXYZ(x0, y0, z0);
    }
  }
  function d3_geo_compose(a, b) {
    function compose(x, y) {
      return x = a(x, y), b(x[0], x[1]);
    }
    if (a.invert && b.invert) compose.invert = function(x, y) {
      return x = b.invert(x, y), x && a.invert(x[0], x[1]);
    };
    return compose;
  }
  function d3_true() {
    return true;
  }
  function d3_geo_clipPolygon(segments, compare, clipStartInside, interpolate, listener) {
    var subject = [], clip = [];
    segments.forEach(function(segment) {
      if ((n = segment.length - 1) <= 0) return;
      var n, p0 = segment[0], p1 = segment[n];
      if (d3_geo_sphericalEqual(p0, p1)) {
        listener.lineStart();
        for (var i = 0; i < n; ++i) listener.point((p0 = segment[i])[0], p0[1]);
        listener.lineEnd();
        return;
      }
      var a = new d3_geo_clipPolygonIntersection(p0, segment, null, true), b = new d3_geo_clipPolygonIntersection(p0, null, a, false);
      a.o = b;
      subject.push(a);
      clip.push(b);
      a = new d3_geo_clipPolygonIntersection(p1, segment, null, false);
      b = new d3_geo_clipPolygonIntersection(p1, null, a, true);
      a.o = b;
      subject.push(a);
      clip.push(b);
    });
    clip.sort(compare);
    d3_geo_clipPolygonLinkCircular(subject);
    d3_geo_clipPolygonLinkCircular(clip);
    if (!subject.length) return;
    for (var i = 0, entry = clipStartInside, n = clip.length; i < n; ++i) {
      clip[i].e = entry = !entry;
    }
    var start = subject[0], points, point;
    while (1) {
      var current = start, isSubject = true;
      while (current.v) if ((current = current.n) === start) return;
      points = current.z;
      listener.lineStart();
      do {
        current.v = current.o.v = true;
        if (current.e) {
          if (isSubject) {
            for (var i = 0, n = points.length; i < n; ++i) listener.point((point = points[i])[0], point[1]);
          } else {
            interpolate(current.x, current.n.x, 1, listener);
          }
          current = current.n;
        } else {
          if (isSubject) {
            points = current.p.z;
            for (var i = points.length - 1; i >= 0; --i) listener.point((point = points[i])[0], point[1]);
          } else {
            interpolate(current.x, current.p.x, -1, listener);
          }
          current = current.p;
        }
        current = current.o;
        points = current.z;
        isSubject = !isSubject;
      } while (!current.v);
      listener.lineEnd();
    }
  }
  function d3_geo_clipPolygonLinkCircular(array) {
    if (!(n = array.length)) return;
    var n, i = 0, a = array[0], b;
    while (++i < n) {
      a.n = b = array[i];
      b.p = a;
      a = b;
    }
    a.n = b = array[0];
    b.p = a;
  }
  function d3_geo_clipPolygonIntersection(point, points, other, entry) {
    this.x = point;
    this.z = points;
    this.o = other;
    this.e = entry;
    this.v = false;
    this.n = this.p = null;
  }
  function d3_geo_clip(pointVisible, clipLine, interpolate, clipStart) {
    return function(rotate, listener) {
      var line = clipLine(listener), rotatedClipStart = rotate.invert(clipStart[0], clipStart[1]);
      var clip = {
        point: point,
        lineStart: lineStart,
        lineEnd: lineEnd,
        polygonStart: function() {
          clip.point = pointRing;
          clip.lineStart = ringStart;
          clip.lineEnd = ringEnd;
          segments = [];
          polygon = [];
        },
        polygonEnd: function() {
          clip.point = point;
          clip.lineStart = lineStart;
          clip.lineEnd = lineEnd;
          segments = d3.merge(segments);
          var clipStartInside = d3_geo_pointInPolygon(rotatedClipStart, polygon);
          if (segments.length) {
            if (!polygonStarted) listener.polygonStart(), polygonStarted = true;
            d3_geo_clipPolygon(segments, d3_geo_clipSort, clipStartInside, interpolate, listener);
          } else if (clipStartInside) {
            if (!polygonStarted) listener.polygonStart(), polygonStarted = true;
            listener.lineStart();
            interpolate(null, null, 1, listener);
            listener.lineEnd();
          }
          if (polygonStarted) listener.polygonEnd(), polygonStarted = false;
          segments = polygon = null;
        },
        sphere: function() {
          listener.polygonStart();
          listener.lineStart();
          interpolate(null, null, 1, listener);
          listener.lineEnd();
          listener.polygonEnd();
        }
      };
      function point(λ, φ) {
        var point = rotate(λ, φ);
        if (pointVisible(λ = point[0], φ = point[1])) listener.point(λ, φ);
      }
      function pointLine(λ, φ) {
        var point = rotate(λ, φ);
        line.point(point[0], point[1]);
      }
      function lineStart() {
        clip.point = pointLine;
        line.lineStart();
      }
      function lineEnd() {
        clip.point = point;
        line.lineEnd();
      }
      var segments;
      var buffer = d3_geo_clipBufferListener(), ringListener = clipLine(buffer), polygonStarted = false, polygon, ring;
      function pointRing(λ, φ) {
        ring.push([ λ, φ ]);
        var point = rotate(λ, φ);
        ringListener.point(point[0], point[1]);
      }
      function ringStart() {
        ringListener.lineStart();
        ring = [];
      }
      function ringEnd() {
        pointRing(ring[0][0], ring[0][1]);
        ringListener.lineEnd();
        var clean = ringListener.clean(), ringSegments = buffer.buffer(), segment, n = ringSegments.length;
        ring.pop();
        polygon.push(ring);
        ring = null;
        if (!n) return;
        if (clean & 1) {
          segment = ringSegments[0];
          var n = segment.length - 1, i = -1, point;
          if (n > 0) {
            if (!polygonStarted) listener.polygonStart(), polygonStarted = true;
            listener.lineStart();
            while (++i < n) listener.point((point = segment[i])[0], point[1]);
            listener.lineEnd();
          }
          return;
        }
        if (n > 1 && clean & 2) ringSegments.push(ringSegments.pop().concat(ringSegments.shift()));
        segments.push(ringSegments.filter(d3_geo_clipSegmentLength1));
      }
      return clip;
    };
  }
  function d3_geo_clipSegmentLength1(segment) {
    return segment.length > 1;
  }
  function d3_geo_clipBufferListener() {
    var lines = [], line;
    return {
      lineStart: function() {
        lines.push(line = []);
      },
      point: function(λ, φ) {
        line.push([ λ, φ ]);
      },
      lineEnd: d3_noop,
      buffer: function() {
        var buffer = lines;
        lines = [];
        line = null;
        return buffer;
      },
      rejoin: function() {
        if (lines.length > 1) lines.push(lines.pop().concat(lines.shift()));
      }
    };
  }
  function d3_geo_clipSort(a, b) {
    return ((a = a.x)[0] < 0 ? a[1] - halfπ - ε : halfπ - a[1]) - ((b = b.x)[0] < 0 ? b[1] - halfπ - ε : halfπ - b[1]);
  }
  var d3_geo_clipAntimeridian = d3_geo_clip(d3_true, d3_geo_clipAntimeridianLine, d3_geo_clipAntimeridianInterpolate, [ -π, -π / 2 ]);
  function d3_geo_clipAntimeridianLine(listener) {
    var λ0 = NaN, φ0 = NaN, sλ0 = NaN, clean;
    return {
      lineStart: function() {
        listener.lineStart();
        clean = 1;
      },
      point: function(λ1, φ1) {
        var sλ1 = λ1 > 0 ? π : -π, dλ = abs(λ1 - λ0);
        if (abs(dλ - π) < ε) {
          listener.point(λ0, φ0 = (φ0 + φ1) / 2 > 0 ? halfπ : -halfπ);
          listener.point(sλ0, φ0);
          listener.lineEnd();
          listener.lineStart();
          listener.point(sλ1, φ0);
          listener.point(λ1, φ0);
          clean = 0;
        } else if (sλ0 !== sλ1 && dλ >= π) {
          if (abs(λ0 - sλ0) < ε) λ0 -= sλ0 * ε;
          if (abs(λ1 - sλ1) < ε) λ1 -= sλ1 * ε;
          φ0 = d3_geo_clipAntimeridianIntersect(λ0, φ0, λ1, φ1);
          listener.point(sλ0, φ0);
          listener.lineEnd();
          listener.lineStart();
          listener.point(sλ1, φ0);
          clean = 0;
        }
        listener.point(λ0 = λ1, φ0 = φ1);
        sλ0 = sλ1;
      },
      lineEnd: function() {
        listener.lineEnd();
        λ0 = φ0 = NaN;
      },
      clean: function() {
        return 2 - clean;
      }
    };
  }
  function d3_geo_clipAntimeridianIntersect(λ0, φ0, λ1, φ1) {
    var cosφ0, cosφ1, sinλ0_λ1 = Math.sin(λ0 - λ1);
    return abs(sinλ0_λ1) > ε ? Math.atan((Math.sin(φ0) * (cosφ1 = Math.cos(φ1)) * Math.sin(λ1) - Math.sin(φ1) * (cosφ0 = Math.cos(φ0)) * Math.sin(λ0)) / (cosφ0 * cosφ1 * sinλ0_λ1)) : (φ0 + φ1) / 2;
  }
  function d3_geo_clipAntimeridianInterpolate(from, to, direction, listener) {
    var φ;
    if (from == null) {
      φ = direction * halfπ;
      listener.point(-π, φ);
      listener.point(0, φ);
      listener.point(π, φ);
      listener.point(π, 0);
      listener.point(π, -φ);
      listener.point(0, -φ);
      listener.point(-π, -φ);
      listener.point(-π, 0);
      listener.point(-π, φ);
    } else if (abs(from[0] - to[0]) > ε) {
      var s = from[0] < to[0] ? π : -π;
      φ = direction * s / 2;
      listener.point(-s, φ);
      listener.point(0, φ);
      listener.point(s, φ);
    } else {
      listener.point(to[0], to[1]);
    }
  }
  function d3_geo_pointInPolygon(point, polygon) {
    var meridian = point[0], parallel = point[1], meridianNormal = [ Math.sin(meridian), -Math.cos(meridian), 0 ], polarAngle = 0, winding = 0;
    d3_geo_areaRingSum.reset();
    for (var i = 0, n = polygon.length; i < n; ++i) {
      var ring = polygon[i], m = ring.length;
      if (!m) continue;
      var point0 = ring[0], λ0 = point0[0], φ0 = point0[1] / 2 + π / 4, sinφ0 = Math.sin(φ0), cosφ0 = Math.cos(φ0), j = 1;
      while (true) {
        if (j === m) j = 0;
        point = ring[j];
        var λ = point[0], φ = point[1] / 2 + π / 4, sinφ = Math.sin(φ), cosφ = Math.cos(φ), dλ = λ - λ0, sdλ = dλ >= 0 ? 1 : -1, adλ = sdλ * dλ, antimeridian = adλ > π, k = sinφ0 * sinφ;
        d3_geo_areaRingSum.add(Math.atan2(k * sdλ * Math.sin(adλ), cosφ0 * cosφ + k * Math.cos(adλ)));
        polarAngle += antimeridian ? dλ + sdλ * τ : dλ;
        if (antimeridian ^ λ0 >= meridian ^ λ >= meridian) {
          var arc = d3_geo_cartesianCross(d3_geo_cartesian(point0), d3_geo_cartesian(point));
          d3_geo_cartesianNormalize(arc);
          var intersection = d3_geo_cartesianCross(meridianNormal, arc);
          d3_geo_cartesianNormalize(intersection);
          var φarc = (antimeridian ^ dλ >= 0 ? -1 : 1) * d3_asin(intersection[2]);
          if (parallel > φarc || parallel === φarc && (arc[0] || arc[1])) {
            winding += antimeridian ^ dλ >= 0 ? 1 : -1;
          }
        }
        if (!j++) break;
        λ0 = λ, sinφ0 = sinφ, cosφ0 = cosφ, point0 = point;
      }
    }
    return (polarAngle < -ε || polarAngle < ε && d3_geo_areaRingSum < 0) ^ winding & 1;
  }
  function d3_geo_clipCircle(radius) {
    var cr = Math.cos(radius), smallRadius = cr > 0, notHemisphere = abs(cr) > ε, interpolate = d3_geo_circleInterpolate(radius, 6 * d3_radians);
    return d3_geo_clip(visible, clipLine, interpolate, smallRadius ? [ 0, -radius ] : [ -π, radius - π ]);
    function visible(λ, φ) {
      return Math.cos(λ) * Math.cos(φ) > cr;
    }
    function clipLine(listener) {
      var point0, c0, v0, v00, clean;
      return {
        lineStart: function() {
          v00 = v0 = false;
          clean = 1;
        },
        point: function(λ, φ) {
          var point1 = [ λ, φ ], point2, v = visible(λ, φ), c = smallRadius ? v ? 0 : code(λ, φ) : v ? code(λ + (λ < 0 ? π : -π), φ) : 0;
          if (!point0 && (v00 = v0 = v)) listener.lineStart();
          if (v !== v0) {
            point2 = intersect(point0, point1);
            if (d3_geo_sphericalEqual(point0, point2) || d3_geo_sphericalEqual(point1, point2)) {
              point1[0] += ε;
              point1[1] += ε;
              v = visible(point1[0], point1[1]);
            }
          }
          if (v !== v0) {
            clean = 0;
            if (v) {
              listener.lineStart();
              point2 = intersect(point1, point0);
              listener.point(point2[0], point2[1]);
            } else {
              point2 = intersect(point0, point1);
              listener.point(point2[0], point2[1]);
              listener.lineEnd();
            }
            point0 = point2;
          } else if (notHemisphere && point0 && smallRadius ^ v) {
            var t;
            if (!(c & c0) && (t = intersect(point1, point0, true))) {
              clean = 0;
              if (smallRadius) {
                listener.lineStart();
                listener.point(t[0][0], t[0][1]);
                listener.point(t[1][0], t[1][1]);
                listener.lineEnd();
              } else {
                listener.point(t[1][0], t[1][1]);
                listener.lineEnd();
                listener.lineStart();
                listener.point(t[0][0], t[0][1]);
              }
            }
          }
          if (v && (!point0 || !d3_geo_sphericalEqual(point0, point1))) {
            listener.point(point1[0], point1[1]);
          }
          point0 = point1, v0 = v, c0 = c;
        },
        lineEnd: function() {
          if (v0) listener.lineEnd();
          point0 = null;
        },
        clean: function() {
          return clean | (v00 && v0) << 1;
        }
      };
    }
    function intersect(a, b, two) {
      var pa = d3_geo_cartesian(a), pb = d3_geo_cartesian(b);
      var n1 = [ 1, 0, 0 ], n2 = d3_geo_cartesianCross(pa, pb), n2n2 = d3_geo_cartesianDot(n2, n2), n1n2 = n2[0], determinant = n2n2 - n1n2 * n1n2;
      if (!determinant) return !two && a;
      var c1 = cr * n2n2 / determinant, c2 = -cr * n1n2 / determinant, n1xn2 = d3_geo_cartesianCross(n1, n2), A = d3_geo_cartesianScale(n1, c1), B = d3_geo_cartesianScale(n2, c2);
      d3_geo_cartesianAdd(A, B);
      var u = n1xn2, w = d3_geo_cartesianDot(A, u), uu = d3_geo_cartesianDot(u, u), t2 = w * w - uu * (d3_geo_cartesianDot(A, A) - 1);
      if (t2 < 0) return;
      var t = Math.sqrt(t2), q = d3_geo_cartesianScale(u, (-w - t) / uu);
      d3_geo_cartesianAdd(q, A);
      q = d3_geo_spherical(q);
      if (!two) return q;
      var λ0 = a[0], λ1 = b[0], φ0 = a[1], φ1 = b[1], z;
      if (λ1 < λ0) z = λ0, λ0 = λ1, λ1 = z;
      var δλ = λ1 - λ0, polar = abs(δλ - π) < ε, meridian = polar || δλ < ε;
      if (!polar && φ1 < φ0) z = φ0, φ0 = φ1, φ1 = z;
      if (meridian ? polar ? φ0 + φ1 > 0 ^ q[1] < (abs(q[0] - λ0) < ε ? φ0 : φ1) : φ0 <= q[1] && q[1] <= φ1 : δλ > π ^ (λ0 <= q[0] && q[0] <= λ1)) {
        var q1 = d3_geo_cartesianScale(u, (-w + t) / uu);
        d3_geo_cartesianAdd(q1, A);
        return [ q, d3_geo_spherical(q1) ];
      }
    }
    function code(λ, φ) {
      var r = smallRadius ? radius : π - radius, code = 0;
      if (λ < -r) code |= 1; else if (λ > r) code |= 2;
      if (φ < -r) code |= 4; else if (φ > r) code |= 8;
      return code;
    }
  }
  function d3_geom_clipLine(x0, y0, x1, y1) {
    return function(line) {
      var a = line.a, b = line.b, ax = a.x, ay = a.y, bx = b.x, by = b.y, t0 = 0, t1 = 1, dx = bx - ax, dy = by - ay, r;
      r = x0 - ax;
      if (!dx && r > 0) return;
      r /= dx;
      if (dx < 0) {
        if (r < t0) return;
        if (r < t1) t1 = r;
      } else if (dx > 0) {
        if (r > t1) return;
        if (r > t0) t0 = r;
      }
      r = x1 - ax;
      if (!dx && r < 0) return;
      r /= dx;
      if (dx < 0) {
        if (r > t1) return;
        if (r > t0) t0 = r;
      } else if (dx > 0) {
        if (r < t0) return;
        if (r < t1) t1 = r;
      }
      r = y0 - ay;
      if (!dy && r > 0) return;
      r /= dy;
      if (dy < 0) {
        if (r < t0) return;
        if (r < t1) t1 = r;
      } else if (dy > 0) {
        if (r > t1) return;
        if (r > t0) t0 = r;
      }
      r = y1 - ay;
      if (!dy && r < 0) return;
      r /= dy;
      if (dy < 0) {
        if (r > t1) return;
        if (r > t0) t0 = r;
      } else if (dy > 0) {
        if (r < t0) return;
        if (r < t1) t1 = r;
      }
      if (t0 > 0) line.a = {
        x: ax + t0 * dx,
        y: ay + t0 * dy
      };
      if (t1 < 1) line.b = {
        x: ax + t1 * dx,
        y: ay + t1 * dy
      };
      return line;
    };
  }
  var d3_geo_clipExtentMAX = 1e9;
  d3.geo.clipExtent = function() {
    var x0, y0, x1, y1, stream, clip, clipExtent = {
      stream: function(output) {
        if (stream) stream.valid = false;
        stream = clip(output);
        stream.valid = true;
        return stream;
      },
      extent: function(_) {
        if (!arguments.length) return [ [ x0, y0 ], [ x1, y1 ] ];
        clip = d3_geo_clipExtent(x0 = +_[0][0], y0 = +_[0][1], x1 = +_[1][0], y1 = +_[1][1]);
        if (stream) stream.valid = false, stream = null;
        return clipExtent;
      }
    };
    return clipExtent.extent([ [ 0, 0 ], [ 960, 500 ] ]);
  };
  function d3_geo_clipExtent(x0, y0, x1, y1) {
    return function(listener) {
      var listener_ = listener, bufferListener = d3_geo_clipBufferListener(), clipLine = d3_geom_clipLine(x0, y0, x1, y1), segments, polygon, ring;
      var clip = {
        point: point,
        lineStart: lineStart,
        lineEnd: lineEnd,
        polygonStart: function() {
          listener = bufferListener;
          segments = [];
          polygon = [];
          clean = true;
        },
        polygonEnd: function() {
          listener = listener_;
          segments = d3.merge(segments);
          var clipStartInside = insidePolygon([ x0, y1 ]), inside = clean && clipStartInside, visible = segments.length;
          if (inside || visible) {
            listener.polygonStart();
            if (inside) {
              listener.lineStart();
              interpolate(null, null, 1, listener);
              listener.lineEnd();
            }
            if (visible) {
              d3_geo_clipPolygon(segments, compare, clipStartInside, interpolate, listener);
            }
            listener.polygonEnd();
          }
          segments = polygon = ring = null;
        }
      };
      function insidePolygon(p) {
        var wn = 0, n = polygon.length, y = p[1];
        for (var i = 0; i < n; ++i) {
          for (var j = 1, v = polygon[i], m = v.length, a = v[0], b; j < m; ++j) {
            b = v[j];
            if (a[1] <= y) {
              if (b[1] > y && d3_cross2d(a, b, p) > 0) ++wn;
            } else {
              if (b[1] <= y && d3_cross2d(a, b, p) < 0) --wn;
            }
            a = b;
          }
        }
        return wn !== 0;
      }
      function interpolate(from, to, direction, listener) {
        var a = 0, a1 = 0;
        if (from == null || (a = corner(from, direction)) !== (a1 = corner(to, direction)) || comparePoints(from, to) < 0 ^ direction > 0) {
          do {
            listener.point(a === 0 || a === 3 ? x0 : x1, a > 1 ? y1 : y0);
          } while ((a = (a + direction + 4) % 4) !== a1);
        } else {
          listener.point(to[0], to[1]);
        }
      }
      function pointVisible(x, y) {
        return x0 <= x && x <= x1 && y0 <= y && y <= y1;
      }
      function point(x, y) {
        if (pointVisible(x, y)) listener.point(x, y);
      }
      var x__, y__, v__, x_, y_, v_, first, clean;
      function lineStart() {
        clip.point = linePoint;
        if (polygon) polygon.push(ring = []);
        first = true;
        v_ = false;
        x_ = y_ = NaN;
      }
      function lineEnd() {
        if (segments) {
          linePoint(x__, y__);
          if (v__ && v_) bufferListener.rejoin();
          segments.push(bufferListener.buffer());
        }
        clip.point = point;
        if (v_) listener.lineEnd();
      }
      function linePoint(x, y) {
        x = Math.max(-d3_geo_clipExtentMAX, Math.min(d3_geo_clipExtentMAX, x));
        y = Math.max(-d3_geo_clipExtentMAX, Math.min(d3_geo_clipExtentMAX, y));
        var v = pointVisible(x, y);
        if (polygon) ring.push([ x, y ]);
        if (first) {
          x__ = x, y__ = y, v__ = v;
          first = false;
          if (v) {
            listener.lineStart();
            listener.point(x, y);
          }
        } else {
          if (v && v_) listener.point(x, y); else {
            var l = {
              a: {
                x: x_,
                y: y_
              },
              b: {
                x: x,
                y: y
              }
            };
            if (clipLine(l)) {
              if (!v_) {
                listener.lineStart();
                listener.point(l.a.x, l.a.y);
              }
              listener.point(l.b.x, l.b.y);
              if (!v) listener.lineEnd();
              clean = false;
            } else if (v) {
              listener.lineStart();
              listener.point(x, y);
              clean = false;
            }
          }
        }
        x_ = x, y_ = y, v_ = v;
      }
      return clip;
    };
    function corner(p, direction) {
      return abs(p[0] - x0) < ε ? direction > 0 ? 0 : 3 : abs(p[0] - x1) < ε ? direction > 0 ? 2 : 1 : abs(p[1] - y0) < ε ? direction > 0 ? 1 : 0 : direction > 0 ? 3 : 2;
    }
    function compare(a, b) {
      return comparePoints(a.x, b.x);
    }
    function comparePoints(a, b) {
      var ca = corner(a, 1), cb = corner(b, 1);
      return ca !== cb ? ca - cb : ca === 0 ? b[1] - a[1] : ca === 1 ? a[0] - b[0] : ca === 2 ? a[1] - b[1] : b[0] - a[0];
    }
  }
  function d3_geo_conic(projectAt) {
    var φ0 = 0, φ1 = π / 3, m = d3_geo_projectionMutator(projectAt), p = m(φ0, φ1);
    p.parallels = function(_) {
      if (!arguments.length) return [ φ0 / π * 180, φ1 / π * 180 ];
      return m(φ0 = _[0] * π / 180, φ1 = _[1] * π / 180);
    };
    return p;
  }
  function d3_geo_conicEqualArea(φ0, φ1) {
    var sinφ0 = Math.sin(φ0), n = (sinφ0 + Math.sin(φ1)) / 2, C = 1 + sinφ0 * (2 * n - sinφ0), ρ0 = Math.sqrt(C) / n;
    function forward(λ, φ) {
      var ρ = Math.sqrt(C - 2 * n * Math.sin(φ)) / n;
      return [ ρ * Math.sin(λ *= n), ρ0 - ρ * Math.cos(λ) ];
    }
    forward.invert = function(x, y) {
      var ρ0_y = ρ0 - y;
      return [ Math.atan2(x, ρ0_y) / n, d3_asin((C - (x * x + ρ0_y * ρ0_y) * n * n) / (2 * n)) ];
    };
    return forward;
  }
  (d3.geo.conicEqualArea = function() {
    return d3_geo_conic(d3_geo_conicEqualArea);
  }).raw = d3_geo_conicEqualArea;
  d3.geo.albers = function() {
    return d3.geo.conicEqualArea().rotate([ 96, 0 ]).center([ -.6, 38.7 ]).parallels([ 29.5, 45.5 ]).scale(1070);
  };
  d3.geo.albersUsa = function() {
    var lower48 = d3.geo.albers();
    var alaska = d3.geo.conicEqualArea().rotate([ 154, 0 ]).center([ -2, 58.5 ]).parallels([ 55, 65 ]);
    var hawaii = d3.geo.conicEqualArea().rotate([ 157, 0 ]).center([ -3, 19.9 ]).parallels([ 8, 18 ]);
    var point, pointStream = {
      point: function(x, y) {
        point = [ x, y ];
      }
    }, lower48Point, alaskaPoint, hawaiiPoint;
    function albersUsa(coordinates) {
      var x = coordinates[0], y = coordinates[1];
      point = null;
      (lower48Point(x, y), point) || (alaskaPoint(x, y), point) || hawaiiPoint(x, y);
      return point;
    }
    albersUsa.invert = function(coordinates) {
      var k = lower48.scale(), t = lower48.translate(), x = (coordinates[0] - t[0]) / k, y = (coordinates[1] - t[1]) / k;
      return (y >= .12 && y < .234 && x >= -.425 && x < -.214 ? alaska : y >= .166 && y < .234 && x >= -.214 && x < -.115 ? hawaii : lower48).invert(coordinates);
    };
    albersUsa.stream = function(stream) {
      var lower48Stream = lower48.stream(stream), alaskaStream = alaska.stream(stream), hawaiiStream = hawaii.stream(stream);
      return {
        point: function(x, y) {
          lower48Stream.point(x, y);
          alaskaStream.point(x, y);
          hawaiiStream.point(x, y);
        },
        sphere: function() {
          lower48Stream.sphere();
          alaskaStream.sphere();
          hawaiiStream.sphere();
        },
        lineStart: function() {
          lower48Stream.lineStart();
          alaskaStream.lineStart();
          hawaiiStream.lineStart();
        },
        lineEnd: function() {
          lower48Stream.lineEnd();
          alaskaStream.lineEnd();
          hawaiiStream.lineEnd();
        },
        polygonStart: function() {
          lower48Stream.polygonStart();
          alaskaStream.polygonStart();
          hawaiiStream.polygonStart();
        },
        polygonEnd: function() {
          lower48Stream.polygonEnd();
          alaskaStream.polygonEnd();
          hawaiiStream.polygonEnd();
        }
      };
    };
    albersUsa.precision = function(_) {
      if (!arguments.length) return lower48.precision();
      lower48.precision(_);
      alaska.precision(_);
      hawaii.precision(_);
      return albersUsa;
    };
    albersUsa.scale = function(_) {
      if (!arguments.length) return lower48.scale();
      lower48.scale(_);
      alaska.scale(_ * .35);
      hawaii.scale(_);
      return albersUsa.translate(lower48.translate());
    };
    albersUsa.translate = function(_) {
      if (!arguments.length) return lower48.translate();
      var k = lower48.scale(), x = +_[0], y = +_[1];
      lower48Point = lower48.translate(_).clipExtent([ [ x - .455 * k, y - .238 * k ], [ x + .455 * k, y + .238 * k ] ]).stream(pointStream).point;
      alaskaPoint = alaska.translate([ x - .307 * k, y + .201 * k ]).clipExtent([ [ x - .425 * k + ε, y + .12 * k + ε ], [ x - .214 * k - ε, y + .234 * k - ε ] ]).stream(pointStream).point;
      hawaiiPoint = hawaii.translate([ x - .205 * k, y + .212 * k ]).clipExtent([ [ x - .214 * k + ε, y + .166 * k + ε ], [ x - .115 * k - ε, y + .234 * k - ε ] ]).stream(pointStream).point;
      return albersUsa;
    };
    return albersUsa.scale(1070);
  };
  var d3_geo_pathAreaSum, d3_geo_pathAreaPolygon, d3_geo_pathArea = {
    point: d3_noop,
    lineStart: d3_noop,
    lineEnd: d3_noop,
    polygonStart: function() {
      d3_geo_pathAreaPolygon = 0;
      d3_geo_pathArea.lineStart = d3_geo_pathAreaRingStart;
    },
    polygonEnd: function() {
      d3_geo_pathArea.lineStart = d3_geo_pathArea.lineEnd = d3_geo_pathArea.point = d3_noop;
      d3_geo_pathAreaSum += abs(d3_geo_pathAreaPolygon / 2);
    }
  };
  function d3_geo_pathAreaRingStart() {
    var x00, y00, x0, y0;
    d3_geo_pathArea.point = function(x, y) {
      d3_geo_pathArea.point = nextPoint;
      x00 = x0 = x, y00 = y0 = y;
    };
    function nextPoint(x, y) {
      d3_geo_pathAreaPolygon += y0 * x - x0 * y;
      x0 = x, y0 = y;
    }
    d3_geo_pathArea.lineEnd = function() {
      nextPoint(x00, y00);
    };
  }
  var d3_geo_pathBoundsX0, d3_geo_pathBoundsY0, d3_geo_pathBoundsX1, d3_geo_pathBoundsY1;
  var d3_geo_pathBounds = {
    point: d3_geo_pathBoundsPoint,
    lineStart: d3_noop,
    lineEnd: d3_noop,
    polygonStart: d3_noop,
    polygonEnd: d3_noop
  };
  function d3_geo_pathBoundsPoint(x, y) {
    if (x < d3_geo_pathBoundsX0) d3_geo_pathBoundsX0 = x;
    if (x > d3_geo_pathBoundsX1) d3_geo_pathBoundsX1 = x;
    if (y < d3_geo_pathBoundsY0) d3_geo_pathBoundsY0 = y;
    if (y > d3_geo_pathBoundsY1) d3_geo_pathBoundsY1 = y;
  }
  function d3_geo_pathBuffer() {
    var pointCircle = d3_geo_pathBufferCircle(4.5), buffer = [];
    var stream = {
      point: point,
      lineStart: function() {
        stream.point = pointLineStart;
      },
      lineEnd: lineEnd,
      polygonStart: function() {
        stream.lineEnd = lineEndPolygon;
      },
      polygonEnd: function() {
        stream.lineEnd = lineEnd;
        stream.point = point;
      },
      pointRadius: function(_) {
        pointCircle = d3_geo_pathBufferCircle(_);
        return stream;
      },
      result: function() {
        if (buffer.length) {
          var result = buffer.join("");
          buffer = [];
          return result;
        }
      }
    };
    function point(x, y) {
      buffer.push("M", x, ",", y, pointCircle);
    }
    function pointLineStart(x, y) {
      buffer.push("M", x, ",", y);
      stream.point = pointLine;
    }
    function pointLine(x, y) {
      buffer.push("L", x, ",", y);
    }
    function lineEnd() {
      stream.point = point;
    }
    function lineEndPolygon() {
      buffer.push("Z");
    }
    return stream;
  }
  function d3_geo_pathBufferCircle(radius) {
    return "m0," + radius + "a" + radius + "," + radius + " 0 1,1 0," + -2 * radius + "a" + radius + "," + radius + " 0 1,1 0," + 2 * radius + "z";
  }
  var d3_geo_pathCentroid = {
    point: d3_geo_pathCentroidPoint,
    lineStart: d3_geo_pathCentroidLineStart,
    lineEnd: d3_geo_pathCentroidLineEnd,
    polygonStart: function() {
      d3_geo_pathCentroid.lineStart = d3_geo_pathCentroidRingStart;
    },
    polygonEnd: function() {
      d3_geo_pathCentroid.point = d3_geo_pathCentroidPoint;
      d3_geo_pathCentroid.lineStart = d3_geo_pathCentroidLineStart;
      d3_geo_pathCentroid.lineEnd = d3_geo_pathCentroidLineEnd;
    }
  };
  function d3_geo_pathCentroidPoint(x, y) {
    d3_geo_centroidX0 += x;
    d3_geo_centroidY0 += y;
    ++d3_geo_centroidZ0;
  }
  function d3_geo_pathCentroidLineStart() {
    var x0, y0;
    d3_geo_pathCentroid.point = function(x, y) {
      d3_geo_pathCentroid.point = nextPoint;
      d3_geo_pathCentroidPoint(x0 = x, y0 = y);
    };
    function nextPoint(x, y) {
      var dx = x - x0, dy = y - y0, z = Math.sqrt(dx * dx + dy * dy);
      d3_geo_centroidX1 += z * (x0 + x) / 2;
      d3_geo_centroidY1 += z * (y0 + y) / 2;
      d3_geo_centroidZ1 += z;
      d3_geo_pathCentroidPoint(x0 = x, y0 = y);
    }
  }
  function d3_geo_pathCentroidLineEnd() {
    d3_geo_pathCentroid.point = d3_geo_pathCentroidPoint;
  }
  function d3_geo_pathCentroidRingStart() {
    var x00, y00, x0, y0;
    d3_geo_pathCentroid.point = function(x, y) {
      d3_geo_pathCentroid.point = nextPoint;
      d3_geo_pathCentroidPoint(x00 = x0 = x, y00 = y0 = y);
    };
    function nextPoint(x, y) {
      var dx = x - x0, dy = y - y0, z = Math.sqrt(dx * dx + dy * dy);
      d3_geo_centroidX1 += z * (x0 + x) / 2;
      d3_geo_centroidY1 += z * (y0 + y) / 2;
      d3_geo_centroidZ1 += z;
      z = y0 * x - x0 * y;
      d3_geo_centroidX2 += z * (x0 + x);
      d3_geo_centroidY2 += z * (y0 + y);
      d3_geo_centroidZ2 += z * 3;
      d3_geo_pathCentroidPoint(x0 = x, y0 = y);
    }
    d3_geo_pathCentroid.lineEnd = function() {
      nextPoint(x00, y00);
    };
  }
  function d3_geo_pathContext(context) {
    var pointRadius = 4.5;
    var stream = {
      point: point,
      lineStart: function() {
        stream.point = pointLineStart;
      },
      lineEnd: lineEnd,
      polygonStart: function() {
        stream.lineEnd = lineEndPolygon;
      },
      polygonEnd: function() {
        stream.lineEnd = lineEnd;
        stream.point = point;
      },
      pointRadius: function(_) {
        pointRadius = _;
        return stream;
      },
      result: d3_noop
    };
    function point(x, y) {
      context.moveTo(x + pointRadius, y);
      context.arc(x, y, pointRadius, 0, τ);
    }
    function pointLineStart(x, y) {
      context.moveTo(x, y);
      stream.point = pointLine;
    }
    function pointLine(x, y) {
      context.lineTo(x, y);
    }
    function lineEnd() {
      stream.point = point;
    }
    function lineEndPolygon() {
      context.closePath();
    }
    return stream;
  }
  function d3_geo_resample(project) {
    var δ2 = .5, cosMinDistance = Math.cos(30 * d3_radians), maxDepth = 16;
    function resample(stream) {
      return (maxDepth ? resampleRecursive : resampleNone)(stream);
    }
    function resampleNone(stream) {
      return d3_geo_transformPoint(stream, function(x, y) {
        x = project(x, y);
        stream.point(x[0], x[1]);
      });
    }
    function resampleRecursive(stream) {
      var λ00, φ00, x00, y00, a00, b00, c00, λ0, x0, y0, a0, b0, c0;
      var resample = {
        point: point,
        lineStart: lineStart,
        lineEnd: lineEnd,
        polygonStart: function() {
          stream.polygonStart();
          resample.lineStart = ringStart;
        },
        polygonEnd: function() {
          stream.polygonEnd();
          resample.lineStart = lineStart;
        }
      };
      function point(x, y) {
        x = project(x, y);
        stream.point(x[0], x[1]);
      }
      function lineStart() {
        x0 = NaN;
        resample.point = linePoint;
        stream.lineStart();
      }
      function linePoint(λ, φ) {
        var c = d3_geo_cartesian([ λ, φ ]), p = project(λ, φ);
        resampleLineTo(x0, y0, λ0, a0, b0, c0, x0 = p[0], y0 = p[1], λ0 = λ, a0 = c[0], b0 = c[1], c0 = c[2], maxDepth, stream);
        stream.point(x0, y0);
      }
      function lineEnd() {
        resample.point = point;
        stream.lineEnd();
      }
      function ringStart() {
        lineStart();
        resample.point = ringPoint;
        resample.lineEnd = ringEnd;
      }
      function ringPoint(λ, φ) {
        linePoint(λ00 = λ, φ00 = φ), x00 = x0, y00 = y0, a00 = a0, b00 = b0, c00 = c0;
        resample.point = linePoint;
      }
      function ringEnd() {
        resampleLineTo(x0, y0, λ0, a0, b0, c0, x00, y00, λ00, a00, b00, c00, maxDepth, stream);
        resample.lineEnd = lineEnd;
        lineEnd();
      }
      return resample;
    }
    function resampleLineTo(x0, y0, λ0, a0, b0, c0, x1, y1, λ1, a1, b1, c1, depth, stream) {
      var dx = x1 - x0, dy = y1 - y0, d2 = dx * dx + dy * dy;
      if (d2 > 4 * δ2 && depth--) {
        var a = a0 + a1, b = b0 + b1, c = c0 + c1, m = Math.sqrt(a * a + b * b + c * c), φ2 = Math.asin(c /= m), λ2 = abs(abs(c) - 1) < ε || abs(λ0 - λ1) < ε ? (λ0 + λ1) / 2 : Math.atan2(b, a), p = project(λ2, φ2), x2 = p[0], y2 = p[1], dx2 = x2 - x0, dy2 = y2 - y0, dz = dy * dx2 - dx * dy2;
        if (dz * dz / d2 > δ2 || abs((dx * dx2 + dy * dy2) / d2 - .5) > .3 || a0 * a1 + b0 * b1 + c0 * c1 < cosMinDistance) {
          resampleLineTo(x0, y0, λ0, a0, b0, c0, x2, y2, λ2, a /= m, b /= m, c, depth, stream);
          stream.point(x2, y2);
          resampleLineTo(x2, y2, λ2, a, b, c, x1, y1, λ1, a1, b1, c1, depth, stream);
        }
      }
    }
    resample.precision = function(_) {
      if (!arguments.length) return Math.sqrt(δ2);
      maxDepth = (δ2 = _ * _) > 0 && 16;
      return resample;
    };
    return resample;
  }
  d3.geo.path = function() {
    var pointRadius = 4.5, projection, context, projectStream, contextStream, cacheStream;
    function path(object) {
      if (object) {
        if (typeof pointRadius === "function") contextStream.pointRadius(+pointRadius.apply(this, arguments));
        if (!cacheStream || !cacheStream.valid) cacheStream = projectStream(contextStream);
        d3.geo.stream(object, cacheStream);
      }
      return contextStream.result();
    }
    path.area = function(object) {
      d3_geo_pathAreaSum = 0;
      d3.geo.stream(object, projectStream(d3_geo_pathArea));
      return d3_geo_pathAreaSum;
    };
    path.centroid = function(object) {
      d3_geo_centroidX0 = d3_geo_centroidY0 = d3_geo_centroidZ0 = d3_geo_centroidX1 = d3_geo_centroidY1 = d3_geo_centroidZ1 = d3_geo_centroidX2 = d3_geo_centroidY2 = d3_geo_centroidZ2 = 0;
      d3.geo.stream(object, projectStream(d3_geo_pathCentroid));
      return d3_geo_centroidZ2 ? [ d3_geo_centroidX2 / d3_geo_centroidZ2, d3_geo_centroidY2 / d3_geo_centroidZ2 ] : d3_geo_centroidZ1 ? [ d3_geo_centroidX1 / d3_geo_centroidZ1, d3_geo_centroidY1 / d3_geo_centroidZ1 ] : d3_geo_centroidZ0 ? [ d3_geo_centroidX0 / d3_geo_centroidZ0, d3_geo_centroidY0 / d3_geo_centroidZ0 ] : [ NaN, NaN ];
    };
    path.bounds = function(object) {
      d3_geo_pathBoundsX1 = d3_geo_pathBoundsY1 = -(d3_geo_pathBoundsX0 = d3_geo_pathBoundsY0 = Infinity);
      d3.geo.stream(object, projectStream(d3_geo_pathBounds));
      return [ [ d3_geo_pathBoundsX0, d3_geo_pathBoundsY0 ], [ d3_geo_pathBoundsX1, d3_geo_pathBoundsY1 ] ];
    };
    path.projection = function(_) {
      if (!arguments.length) return projection;
      projectStream = (projection = _) ? _.stream || d3_geo_pathProjectStream(_) : d3_identity;
      return reset();
    };
    path.context = function(_) {
      if (!arguments.length) return context;
      contextStream = (context = _) == null ? new d3_geo_pathBuffer() : new d3_geo_pathContext(_);
      if (typeof pointRadius !== "function") contextStream.pointRadius(pointRadius);
      return reset();
    };
    path.pointRadius = function(_) {
      if (!arguments.length) return pointRadius;
      pointRadius = typeof _ === "function" ? _ : (contextStream.pointRadius(+_), +_);
      return path;
    };
    function reset() {
      cacheStream = null;
      return path;
    }
    return path.projection(d3.geo.albersUsa()).context(null);
  };
  function d3_geo_pathProjectStream(project) {
    var resample = d3_geo_resample(function(x, y) {
      return project([ x * d3_degrees, y * d3_degrees ]);
    });
    return function(stream) {
      return d3_geo_projectionRadians(resample(stream));
    };
  }
  d3.geo.transform = function(methods) {
    return {
      stream: function(stream) {
        var transform = new d3_geo_transform(stream);
        for (var k in methods) transform[k] = methods[k];
        return transform;
      }
    };
  };
  function d3_geo_transform(stream) {
    this.stream = stream;
  }
  d3_geo_transform.prototype = {
    point: function(x, y) {
      this.stream.point(x, y);
    },
    sphere: function() {
      this.stream.sphere();
    },
    lineStart: function() {
      this.stream.lineStart();
    },
    lineEnd: function() {
      this.stream.lineEnd();
    },
    polygonStart: function() {
      this.stream.polygonStart();
    },
    polygonEnd: function() {
      this.stream.polygonEnd();
    }
  };
  function d3_geo_transformPoint(stream, point) {
    return {
      point: point,
      sphere: function() {
        stream.sphere();
      },
      lineStart: function() {
        stream.lineStart();
      },
      lineEnd: function() {
        stream.lineEnd();
      },
      polygonStart: function() {
        stream.polygonStart();
      },
      polygonEnd: function() {
        stream.polygonEnd();
      }
    };
  }
  d3.geo.projection = d3_geo_projection;
  d3.geo.projectionMutator = d3_geo_projectionMutator;
  function d3_geo_projection(project) {
    return d3_geo_projectionMutator(function() {
      return project;
    })();
  }
  function d3_geo_projectionMutator(projectAt) {
    var project, rotate, projectRotate, projectResample = d3_geo_resample(function(x, y) {
      x = project(x, y);
      return [ x[0] * k + δx, δy - x[1] * k ];
    }), k = 150, x = 480, y = 250, λ = 0, φ = 0, δλ = 0, δφ = 0, δγ = 0, δx, δy, preclip = d3_geo_clipAntimeridian, postclip = d3_identity, clipAngle = null, clipExtent = null, stream;
    function projection(point) {
      point = projectRotate(point[0] * d3_radians, point[1] * d3_radians);
      return [ point[0] * k + δx, δy - point[1] * k ];
    }
    function invert(point) {
      point = projectRotate.invert((point[0] - δx) / k, (δy - point[1]) / k);
      return point && [ point[0] * d3_degrees, point[1] * d3_degrees ];
    }
    projection.stream = function(output) {
      if (stream) stream.valid = false;
      stream = d3_geo_projectionRadians(preclip(rotate, projectResample(postclip(output))));
      stream.valid = true;
      return stream;
    };
    projection.clipAngle = function(_) {
      if (!arguments.length) return clipAngle;
      preclip = _ == null ? (clipAngle = _, d3_geo_clipAntimeridian) : d3_geo_clipCircle((clipAngle = +_) * d3_radians);
      return invalidate();
    };
    projection.clipExtent = function(_) {
      if (!arguments.length) return clipExtent;
      clipExtent = _;
      postclip = _ ? d3_geo_clipExtent(_[0][0], _[0][1], _[1][0], _[1][1]) : d3_identity;
      return invalidate();
    };
    projection.scale = function(_) {
      if (!arguments.length) return k;
      k = +_;
      return reset();
    };
    projection.translate = function(_) {
      if (!arguments.length) return [ x, y ];
      x = +_[0];
      y = +_[1];
      return reset();
    };
    projection.center = function(_) {
      if (!arguments.length) return [ λ * d3_degrees, φ * d3_degrees ];
      λ = _[0] % 360 * d3_radians;
      φ = _[1] % 360 * d3_radians;
      return reset();
    };
    projection.rotate = function(_) {
      if (!arguments.length) return [ δλ * d3_degrees, δφ * d3_degrees, δγ * d3_degrees ];
      δλ = _[0] % 360 * d3_radians;
      δφ = _[1] % 360 * d3_radians;
      δγ = _.length > 2 ? _[2] % 360 * d3_radians : 0;
      return reset();
    };
    d3.rebind(projection, projectResample, "precision");
    function reset() {
      projectRotate = d3_geo_compose(rotate = d3_geo_rotation(δλ, δφ, δγ), project);
      var center = project(λ, φ);
      δx = x - center[0] * k;
      δy = y + center[1] * k;
      return invalidate();
    }
    function invalidate() {
      if (stream) stream.valid = false, stream = null;
      return projection;
    }
    return function() {
      project = projectAt.apply(this, arguments);
      projection.invert = project.invert && invert;
      return reset();
    };
  }
  function d3_geo_projectionRadians(stream) {
    return d3_geo_transformPoint(stream, function(x, y) {
      stream.point(x * d3_radians, y * d3_radians);
    });
  }
  function d3_geo_equirectangular(λ, φ) {
    return [ λ, φ ];
  }
  (d3.geo.equirectangular = function() {
    return d3_geo_projection(d3_geo_equirectangular);
  }).raw = d3_geo_equirectangular.invert = d3_geo_equirectangular;
  d3.geo.rotation = function(rotate) {
    rotate = d3_geo_rotation(rotate[0] % 360 * d3_radians, rotate[1] * d3_radians, rotate.length > 2 ? rotate[2] * d3_radians : 0);
    function forward(coordinates) {
      coordinates = rotate(coordinates[0] * d3_radians, coordinates[1] * d3_radians);
      return coordinates[0] *= d3_degrees, coordinates[1] *= d3_degrees, coordinates;
    }
    forward.invert = function(coordinates) {
      coordinates = rotate.invert(coordinates[0] * d3_radians, coordinates[1] * d3_radians);
      return coordinates[0] *= d3_degrees, coordinates[1] *= d3_degrees, coordinates;
    };
    return forward;
  };
  function d3_geo_identityRotation(λ, φ) {
    return [ λ > π ? λ - τ : λ < -π ? λ + τ : λ, φ ];
  }
  d3_geo_identityRotation.invert = d3_geo_equirectangular;
  function d3_geo_rotation(δλ, δφ, δγ) {
    return δλ ? δφ || δγ ? d3_geo_compose(d3_geo_rotationλ(δλ), d3_geo_rotationφγ(δφ, δγ)) : d3_geo_rotationλ(δλ) : δφ || δγ ? d3_geo_rotationφγ(δφ, δγ) : d3_geo_identityRotation;
  }
  function d3_geo_forwardRotationλ(δλ) {
    return function(λ, φ) {
      return λ += δλ, [ λ > π ? λ - τ : λ < -π ? λ + τ : λ, φ ];
    };
  }
  function d3_geo_rotationλ(δλ) {
    var rotation = d3_geo_forwardRotationλ(δλ);
    rotation.invert = d3_geo_forwardRotationλ(-δλ);
    return rotation;
  }
  function d3_geo_rotationφγ(δφ, δγ) {
    var cosδφ = Math.cos(δφ), sinδφ = Math.sin(δφ), cosδγ = Math.cos(δγ), sinδγ = Math.sin(δγ);
    function rotation(λ, φ) {
      var cosφ = Math.cos(φ), x = Math.cos(λ) * cosφ, y = Math.sin(λ) * cosφ, z = Math.sin(φ), k = z * cosδφ + x * sinδφ;
      return [ Math.atan2(y * cosδγ - k * sinδγ, x * cosδφ - z * sinδφ), d3_asin(k * cosδγ + y * sinδγ) ];
    }
    rotation.invert = function(λ, φ) {
      var cosφ = Math.cos(φ), x = Math.cos(λ) * cosφ, y = Math.sin(λ) * cosφ, z = Math.sin(φ), k = z * cosδγ - y * sinδγ;
      return [ Math.atan2(y * cosδγ + z * sinδγ, x * cosδφ + k * sinδφ), d3_asin(k * cosδφ - x * sinδφ) ];
    };
    return rotation;
  }
  d3.geo.circle = function() {
    var origin = [ 0, 0 ], angle, precision = 6, interpolate;
    function circle() {
      var center = typeof origin === "function" ? origin.apply(this, arguments) : origin, rotate = d3_geo_rotation(-center[0] * d3_radians, -center[1] * d3_radians, 0).invert, ring = [];
      interpolate(null, null, 1, {
        point: function(x, y) {
          ring.push(x = rotate(x, y));
          x[0] *= d3_degrees, x[1] *= d3_degrees;
        }
      });
      return {
        type: "Polygon",
        coordinates: [ ring ]
      };
    }
    circle.origin = function(x) {
      if (!arguments.length) return origin;
      origin = x;
      return circle;
    };
    circle.angle = function(x) {
      if (!arguments.length) return angle;
      interpolate = d3_geo_circleInterpolate((angle = +x) * d3_radians, precision * d3_radians);
      return circle;
    };
    circle.precision = function(_) {
      if (!arguments.length) return precision;
      interpolate = d3_geo_circleInterpolate(angle * d3_radians, (precision = +_) * d3_radians);
      return circle;
    };
    return circle.angle(90);
  };
  function d3_geo_circleInterpolate(radius, precision) {
    var cr = Math.cos(radius), sr = Math.sin(radius);
    return function(from, to, direction, listener) {
      var step = direction * precision;
      if (from != null) {
        from = d3_geo_circleAngle(cr, from);
        to = d3_geo_circleAngle(cr, to);
        if (direction > 0 ? from < to : from > to) from += direction * τ;
      } else {
        from = radius + direction * τ;
        to = radius - .5 * step;
      }
      for (var point, t = from; direction > 0 ? t > to : t < to; t -= step) {
        listener.point((point = d3_geo_spherical([ cr, -sr * Math.cos(t), -sr * Math.sin(t) ]))[0], point[1]);
      }
    };
  }
  function d3_geo_circleAngle(cr, point) {
    var a = d3_geo_cartesian(point);
    a[0] -= cr;
    d3_geo_cartesianNormalize(a);
    var angle = d3_acos(-a[1]);
    return ((-a[2] < 0 ? -angle : angle) + 2 * Math.PI - ε) % (2 * Math.PI);
  }
  d3.geo.distance = function(a, b) {
    var Δλ = (b[0] - a[0]) * d3_radians, φ0 = a[1] * d3_radians, φ1 = b[1] * d3_radians, sinΔλ = Math.sin(Δλ), cosΔλ = Math.cos(Δλ), sinφ0 = Math.sin(φ0), cosφ0 = Math.cos(φ0), sinφ1 = Math.sin(φ1), cosφ1 = Math.cos(φ1), t;
    return Math.atan2(Math.sqrt((t = cosφ1 * sinΔλ) * t + (t = cosφ0 * sinφ1 - sinφ0 * cosφ1 * cosΔλ) * t), sinφ0 * sinφ1 + cosφ0 * cosφ1 * cosΔλ);
  };
  d3.geo.graticule = function() {
    var x1, x0, X1, X0, y1, y0, Y1, Y0, dx = 10, dy = dx, DX = 90, DY = 360, x, y, X, Y, precision = 2.5;
    function graticule() {
      return {
        type: "MultiLineString",
        coordinates: lines()
      };
    }
    function lines() {
      return d3.range(Math.ceil(X0 / DX) * DX, X1, DX).map(X).concat(d3.range(Math.ceil(Y0 / DY) * DY, Y1, DY).map(Y)).concat(d3.range(Math.ceil(x0 / dx) * dx, x1, dx).filter(function(x) {
        return abs(x % DX) > ε;
      }).map(x)).concat(d3.range(Math.ceil(y0 / dy) * dy, y1, dy).filter(function(y) {
        return abs(y % DY) > ε;
      }).map(y));
    }
    graticule.lines = function() {
      return lines().map(function(coordinates) {
        return {
          type: "LineString",
          coordinates: coordinates
        };
      });
    };
    graticule.outline = function() {
      return {
        type: "Polygon",
        coordinates: [ X(X0).concat(Y(Y1).slice(1), X(X1).reverse().slice(1), Y(Y0).reverse().slice(1)) ]
      };
    };
    graticule.extent = function(_) {
      if (!arguments.length) return graticule.minorExtent();
      return graticule.majorExtent(_).minorExtent(_);
    };
    graticule.majorExtent = function(_) {
      if (!arguments.length) return [ [ X0, Y0 ], [ X1, Y1 ] ];
      X0 = +_[0][0], X1 = +_[1][0];
      Y0 = +_[0][1], Y1 = +_[1][1];
      if (X0 > X1) _ = X0, X0 = X1, X1 = _;
      if (Y0 > Y1) _ = Y0, Y0 = Y1, Y1 = _;
      return graticule.precision(precision);
    };
    graticule.minorExtent = function(_) {
      if (!arguments.length) return [ [ x0, y0 ], [ x1, y1 ] ];
      x0 = +_[0][0], x1 = +_[1][0];
      y0 = +_[0][1], y1 = +_[1][1];
      if (x0 > x1) _ = x0, x0 = x1, x1 = _;
      if (y0 > y1) _ = y0, y0 = y1, y1 = _;
      return graticule.precision(precision);
    };
    graticule.step = function(_) {
      if (!arguments.length) return graticule.minorStep();
      return graticule.majorStep(_).minorStep(_);
    };
    graticule.majorStep = function(_) {
      if (!arguments.length) return [ DX, DY ];
      DX = +_[0], DY = +_[1];
      return graticule;
    };
    graticule.minorStep = function(_) {
      if (!arguments.length) return [ dx, dy ];
      dx = +_[0], dy = +_[1];
      return graticule;
    };
    graticule.precision = function(_) {
      if (!arguments.length) return precision;
      precision = +_;
      x = d3_geo_graticuleX(y0, y1, 90);
      y = d3_geo_graticuleY(x0, x1, precision);
      X = d3_geo_graticuleX(Y0, Y1, 90);
      Y = d3_geo_graticuleY(X0, X1, precision);
      return graticule;
    };
    return graticule.majorExtent([ [ -180, -90 + ε ], [ 180, 90 - ε ] ]).minorExtent([ [ -180, -80 - ε ], [ 180, 80 + ε ] ]);
  };
  function d3_geo_graticuleX(y0, y1, dy) {
    var y = d3.range(y0, y1 - ε, dy).concat(y1);
    return function(x) {
      return y.map(function(y) {
        return [ x, y ];
      });
    };
  }
  function d3_geo_graticuleY(x0, x1, dx) {
    var x = d3.range(x0, x1 - ε, dx).concat(x1);
    return function(y) {
      return x.map(function(x) {
        return [ x, y ];
      });
    };
  }
  function d3_source(d) {
    return d.source;
  }
  function d3_target(d) {
    return d.target;
  }
  d3.geo.greatArc = function() {
    var source = d3_source, source_, target = d3_target, target_;
    function greatArc() {
      return {
        type: "LineString",
        coordinates: [ source_ || source.apply(this, arguments), target_ || target.apply(this, arguments) ]
      };
    }
    greatArc.distance = function() {
      return d3.geo.distance(source_ || source.apply(this, arguments), target_ || target.apply(this, arguments));
    };
    greatArc.source = function(_) {
      if (!arguments.length) return source;
      source = _, source_ = typeof _ === "function" ? null : _;
      return greatArc;
    };
    greatArc.target = function(_) {
      if (!arguments.length) return target;
      target = _, target_ = typeof _ === "function" ? null : _;
      return greatArc;
    };
    greatArc.precision = function() {
      return arguments.length ? greatArc : 0;
    };
    return greatArc;
  };
  d3.geo.interpolate = function(source, target) {
    return d3_geo_interpolate(source[0] * d3_radians, source[1] * d3_radians, target[0] * d3_radians, target[1] * d3_radians);
  };
  function d3_geo_interpolate(x0, y0, x1, y1) {
    var cy0 = Math.cos(y0), sy0 = Math.sin(y0), cy1 = Math.cos(y1), sy1 = Math.sin(y1), kx0 = cy0 * Math.cos(x0), ky0 = cy0 * Math.sin(x0), kx1 = cy1 * Math.cos(x1), ky1 = cy1 * Math.sin(x1), d = 2 * Math.asin(Math.sqrt(d3_haversin(y1 - y0) + cy0 * cy1 * d3_haversin(x1 - x0))), k = 1 / Math.sin(d);
    var interpolate = d ? function(t) {
      var B = Math.sin(t *= d) * k, A = Math.sin(d - t) * k, x = A * kx0 + B * kx1, y = A * ky0 + B * ky1, z = A * sy0 + B * sy1;
      return [ Math.atan2(y, x) * d3_degrees, Math.atan2(z, Math.sqrt(x * x + y * y)) * d3_degrees ];
    } : function() {
      return [ x0 * d3_degrees, y0 * d3_degrees ];
    };
    interpolate.distance = d;
    return interpolate;
  }
  d3.geo.length = function(object) {
    d3_geo_lengthSum = 0;
    d3.geo.stream(object, d3_geo_length);
    return d3_geo_lengthSum;
  };
  var d3_geo_lengthSum;
  var d3_geo_length = {
    sphere: d3_noop,
    point: d3_noop,
    lineStart: d3_geo_lengthLineStart,
    lineEnd: d3_noop,
    polygonStart: d3_noop,
    polygonEnd: d3_noop
  };
  function d3_geo_lengthLineStart() {
    var λ0, sinφ0, cosφ0;
    d3_geo_length.point = function(λ, φ) {
      λ0 = λ * d3_radians, sinφ0 = Math.sin(φ *= d3_radians), cosφ0 = Math.cos(φ);
      d3_geo_length.point = nextPoint;
    };
    d3_geo_length.lineEnd = function() {
      d3_geo_length.point = d3_geo_length.lineEnd = d3_noop;
    };
    function nextPoint(λ, φ) {
      var sinφ = Math.sin(φ *= d3_radians), cosφ = Math.cos(φ), t = abs((λ *= d3_radians) - λ0), cosΔλ = Math.cos(t);
      d3_geo_lengthSum += Math.atan2(Math.sqrt((t = cosφ * Math.sin(t)) * t + (t = cosφ0 * sinφ - sinφ0 * cosφ * cosΔλ) * t), sinφ0 * sinφ + cosφ0 * cosφ * cosΔλ);
      λ0 = λ, sinφ0 = sinφ, cosφ0 = cosφ;
    }
  }
  function d3_geo_azimuthal(scale, angle) {
    function azimuthal(λ, φ) {
      var cosλ = Math.cos(λ), cosφ = Math.cos(φ), k = scale(cosλ * cosφ);
      return [ k * cosφ * Math.sin(λ), k * Math.sin(φ) ];
    }
    azimuthal.invert = function(x, y) {
      var ρ = Math.sqrt(x * x + y * y), c = angle(ρ), sinc = Math.sin(c), cosc = Math.cos(c);
      return [ Math.atan2(x * sinc, ρ * cosc), Math.asin(ρ && y * sinc / ρ) ];
    };
    return azimuthal;
  }
  var d3_geo_azimuthalEqualArea = d3_geo_azimuthal(function(cosλcosφ) {
    return Math.sqrt(2 / (1 + cosλcosφ));
  }, function(ρ) {
    return 2 * Math.asin(ρ / 2);
  });
  (d3.geo.azimuthalEqualArea = function() {
    return d3_geo_projection(d3_geo_azimuthalEqualArea);
  }).raw = d3_geo_azimuthalEqualArea;
  var d3_geo_azimuthalEquidistant = d3_geo_azimuthal(function(cosλcosφ) {
    var c = Math.acos(cosλcosφ);
    return c && c / Math.sin(c);
  }, d3_identity);
  (d3.geo.azimuthalEquidistant = function() {
    return d3_geo_projection(d3_geo_azimuthalEquidistant);
  }).raw = d3_geo_azimuthalEquidistant;
  function d3_geo_conicConformal(φ0, φ1) {
    var cosφ0 = Math.cos(φ0), t = function(φ) {
      return Math.tan(π / 4 + φ / 2);
    }, n = φ0 === φ1 ? Math.sin(φ0) : Math.log(cosφ0 / Math.cos(φ1)) / Math.log(t(φ1) / t(φ0)), F = cosφ0 * Math.pow(t(φ0), n) / n;
    if (!n) return d3_geo_mercator;
    function forward(λ, φ) {
      if (F > 0) {
        if (φ < -halfπ + ε) φ = -halfπ + ε;
      } else {
        if (φ > halfπ - ε) φ = halfπ - ε;
      }
      var ρ = F / Math.pow(t(φ), n);
      return [ ρ * Math.sin(n * λ), F - ρ * Math.cos(n * λ) ];
    }
    forward.invert = function(x, y) {
      var ρ0_y = F - y, ρ = d3_sgn(n) * Math.sqrt(x * x + ρ0_y * ρ0_y);
      return [ Math.atan2(x, ρ0_y) / n, 2 * Math.atan(Math.pow(F / ρ, 1 / n)) - halfπ ];
    };
    return forward;
  }
  (d3.geo.conicConformal = function() {
    return d3_geo_conic(d3_geo_conicConformal);
  }).raw = d3_geo_conicConformal;
  function d3_geo_conicEquidistant(φ0, φ1) {
    var cosφ0 = Math.cos(φ0), n = φ0 === φ1 ? Math.sin(φ0) : (cosφ0 - Math.cos(φ1)) / (φ1 - φ0), G = cosφ0 / n + φ0;
    if (abs(n) < ε) return d3_geo_equirectangular;
    function forward(λ, φ) {
      var ρ = G - φ;
      return [ ρ * Math.sin(n * λ), G - ρ * Math.cos(n * λ) ];
    }
    forward.invert = function(x, y) {
      var ρ0_y = G - y;
      return [ Math.atan2(x, ρ0_y) / n, G - d3_sgn(n) * Math.sqrt(x * x + ρ0_y * ρ0_y) ];
    };
    return forward;
  }
  (d3.geo.conicEquidistant = function() {
    return d3_geo_conic(d3_geo_conicEquidistant);
  }).raw = d3_geo_conicEquidistant;
  var d3_geo_gnomonic = d3_geo_azimuthal(function(cosλcosφ) {
    return 1 / cosλcosφ;
  }, Math.atan);
  (d3.geo.gnomonic = function() {
    return d3_geo_projection(d3_geo_gnomonic);
  }).raw = d3_geo_gnomonic;
  function d3_geo_mercator(λ, φ) {
    return [ λ, Math.log(Math.tan(π / 4 + φ / 2)) ];
  }
  d3_geo_mercator.invert = function(x, y) {
    return [ x, 2 * Math.atan(Math.exp(y)) - halfπ ];
  };
  function d3_geo_mercatorProjection(project) {
    var m = d3_geo_projection(project), scale = m.scale, translate = m.translate, clipExtent = m.clipExtent, clipAuto;
    m.scale = function() {
      var v = scale.apply(m, arguments);
      return v === m ? clipAuto ? m.clipExtent(null) : m : v;
    };
    m.translate = function() {
      var v = translate.apply(m, arguments);
      return v === m ? clipAuto ? m.clipExtent(null) : m : v;
    };
    m.clipExtent = function(_) {
      var v = clipExtent.apply(m, arguments);
      if (v === m) {
        if (clipAuto = _ == null) {
          var k = π * scale(), t = translate();
          clipExtent([ [ t[0] - k, t[1] - k ], [ t[0] + k, t[1] + k ] ]);
        }
      } else if (clipAuto) {
        v = null;
      }
      return v;
    };
    return m.clipExtent(null);
  }
  (d3.geo.mercator = function() {
    return d3_geo_mercatorProjection(d3_geo_mercator);
  }).raw = d3_geo_mercator;
  var d3_geo_orthographic = d3_geo_azimuthal(function() {
    return 1;
  }, Math.asin);
  (d3.geo.orthographic = function() {
    return d3_geo_projection(d3_geo_orthographic);
  }).raw = d3_geo_orthographic;
  var d3_geo_stereographic = d3_geo_azimuthal(function(cosλcosφ) {
    return 1 / (1 + cosλcosφ);
  }, function(ρ) {
    return 2 * Math.atan(ρ);
  });
  (d3.geo.stereographic = function() {
    return d3_geo_projection(d3_geo_stereographic);
  }).raw = d3_geo_stereographic;
  function d3_geo_transverseMercator(λ, φ) {
    return [ Math.log(Math.tan(π / 4 + φ / 2)), -λ ];
  }
  d3_geo_transverseMercator.invert = function(x, y) {
    return [ -y, 2 * Math.atan(Math.exp(x)) - halfπ ];
  };
  (d3.geo.transverseMercator = function() {
    var projection = d3_geo_mercatorProjection(d3_geo_transverseMercator), center = projection.center, rotate = projection.rotate;
    projection.center = function(_) {
      return _ ? center([ -_[1], _[0] ]) : (_ = center(), [ _[1], -_[0] ]);
    };
    projection.rotate = function(_) {
      return _ ? rotate([ _[0], _[1], _.length > 2 ? _[2] + 90 : 90 ]) : (_ = rotate(), 
      [ _[0], _[1], _[2] - 90 ]);
    };
    return rotate([ 0, 0, 90 ]);
  }).raw = d3_geo_transverseMercator;
  d3.geom = {};
  function d3_geom_pointX(d) {
    return d[0];
  }
  function d3_geom_pointY(d) {
    return d[1];
  }
  d3.geom.hull = function(vertices) {
    var x = d3_geom_pointX, y = d3_geom_pointY;
    if (arguments.length) return hull(vertices);
    function hull(data) {
      if (data.length < 3) return [];
      var fx = d3_functor(x), fy = d3_functor(y), i, n = data.length, points = [], flippedPoints = [];
      for (i = 0; i < n; i++) {
        points.push([ +fx.call(this, data[i], i), +fy.call(this, data[i], i), i ]);
      }
      points.sort(d3_geom_hullOrder);
      for (i = 0; i < n; i++) flippedPoints.push([ points[i][0], -points[i][1] ]);
      var upper = d3_geom_hullUpper(points), lower = d3_geom_hullUpper(flippedPoints);
      var skipLeft = lower[0] === upper[0], skipRight = lower[lower.length - 1] === upper[upper.length - 1], polygon = [];
      for (i = upper.length - 1; i >= 0; --i) polygon.push(data[points[upper[i]][2]]);
      for (i = +skipLeft; i < lower.length - skipRight; ++i) polygon.push(data[points[lower[i]][2]]);
      return polygon;
    }
    hull.x = function(_) {
      return arguments.length ? (x = _, hull) : x;
    };
    hull.y = function(_) {
      return arguments.length ? (y = _, hull) : y;
    };
    return hull;
  };
  function d3_geom_hullUpper(points) {
    var n = points.length, hull = [ 0, 1 ], hs = 2;
    for (var i = 2; i < n; i++) {
      while (hs > 1 && d3_cross2d(points[hull[hs - 2]], points[hull[hs - 1]], points[i]) <= 0) --hs;
      hull[hs++] = i;
    }
    return hull.slice(0, hs);
  }
  function d3_geom_hullOrder(a, b) {
    return a[0] - b[0] || a[1] - b[1];
  }
  d3.geom.polygon = function(coordinates) {
    d3_subclass(coordinates, d3_geom_polygonPrototype);
    return coordinates;
  };
  var d3_geom_polygonPrototype = d3.geom.polygon.prototype = [];
  d3_geom_polygonPrototype.area = function() {
    var i = -1, n = this.length, a, b = this[n - 1], area = 0;
    while (++i < n) {
      a = b;
      b = this[i];
      area += a[1] * b[0] - a[0] * b[1];
    }
    return area * .5;
  };
  d3_geom_polygonPrototype.centroid = function(k) {
    var i = -1, n = this.length, x = 0, y = 0, a, b = this[n - 1], c;
    if (!arguments.length) k = -1 / (6 * this.area());
    while (++i < n) {
      a = b;
      b = this[i];
      c = a[0] * b[1] - b[0] * a[1];
      x += (a[0] + b[0]) * c;
      y += (a[1] + b[1]) * c;
    }
    return [ x * k, y * k ];
  };
  d3_geom_polygonPrototype.clip = function(subject) {
    var input, closed = d3_geom_polygonClosed(subject), i = -1, n = this.length - d3_geom_polygonClosed(this), j, m, a = this[n - 1], b, c, d;
    while (++i < n) {
      input = subject.slice();
      subject.length = 0;
      b = this[i];
      c = input[(m = input.length - closed) - 1];
      j = -1;
      while (++j < m) {
        d = input[j];
        if (d3_geom_polygonInside(d, a, b)) {
          if (!d3_geom_polygonInside(c, a, b)) {
            subject.push(d3_geom_polygonIntersect(c, d, a, b));
          }
          subject.push(d);
        } else if (d3_geom_polygonInside(c, a, b)) {
          subject.push(d3_geom_polygonIntersect(c, d, a, b));
        }
        c = d;
      }
      if (closed) subject.push(subject[0]);
      a = b;
    }
    return subject;
  };
  function d3_geom_polygonInside(p, a, b) {
    return (b[0] - a[0]) * (p[1] - a[1]) < (b[1] - a[1]) * (p[0] - a[0]);
  }
  function d3_geom_polygonIntersect(c, d, a, b) {
    var x1 = c[0], x3 = a[0], x21 = d[0] - x1, x43 = b[0] - x3, y1 = c[1], y3 = a[1], y21 = d[1] - y1, y43 = b[1] - y3, ua = (x43 * (y1 - y3) - y43 * (x1 - x3)) / (y43 * x21 - x43 * y21);
    return [ x1 + ua * x21, y1 + ua * y21 ];
  }
  function d3_geom_polygonClosed(coordinates) {
    var a = coordinates[0], b = coordinates[coordinates.length - 1];
    return !(a[0] - b[0] || a[1] - b[1]);
  }
  var d3_geom_voronoiEdges, d3_geom_voronoiCells, d3_geom_voronoiBeaches, d3_geom_voronoiBeachPool = [], d3_geom_voronoiFirstCircle, d3_geom_voronoiCircles, d3_geom_voronoiCirclePool = [];
  function d3_geom_voronoiBeach() {
    d3_geom_voronoiRedBlackNode(this);
    this.edge = this.site = this.circle = null;
  }
  function d3_geom_voronoiCreateBeach(site) {
    var beach = d3_geom_voronoiBeachPool.pop() || new d3_geom_voronoiBeach();
    beach.site = site;
    return beach;
  }
  function d3_geom_voronoiDetachBeach(beach) {
    d3_geom_voronoiDetachCircle(beach);
    d3_geom_voronoiBeaches.remove(beach);
    d3_geom_voronoiBeachPool.push(beach);
    d3_geom_voronoiRedBlackNode(beach);
  }
  function d3_geom_voronoiRemoveBeach(beach) {
    var circle = beach.circle, x = circle.x, y = circle.cy, vertex = {
      x: x,
      y: y
    }, previous = beach.P, next = beach.N, disappearing = [ beach ];
    d3_geom_voronoiDetachBeach(beach);
    var lArc = previous;
    while (lArc.circle && abs(x - lArc.circle.x) < ε && abs(y - lArc.circle.cy) < ε) {
      previous = lArc.P;
      disappearing.unshift(lArc);
      d3_geom_voronoiDetachBeach(lArc);
      lArc = previous;
    }
    disappearing.unshift(lArc);
    d3_geom_voronoiDetachCircle(lArc);
    var rArc = next;
    while (rArc.circle && abs(x - rArc.circle.x) < ε && abs(y - rArc.circle.cy) < ε) {
      next = rArc.N;
      disappearing.push(rArc);
      d3_geom_voronoiDetachBeach(rArc);
      rArc = next;
    }
    disappearing.push(rArc);
    d3_geom_voronoiDetachCircle(rArc);
    var nArcs = disappearing.length, iArc;
    for (iArc = 1; iArc < nArcs; ++iArc) {
      rArc = disappearing[iArc];
      lArc = disappearing[iArc - 1];
      d3_geom_voronoiSetEdgeEnd(rArc.edge, lArc.site, rArc.site, vertex);
    }
    lArc = disappearing[0];
    rArc = disappearing[nArcs - 1];
    rArc.edge = d3_geom_voronoiCreateEdge(lArc.site, rArc.site, null, vertex);
    d3_geom_voronoiAttachCircle(lArc);
    d3_geom_voronoiAttachCircle(rArc);
  }
  function d3_geom_voronoiAddBeach(site) {
    var x = site.x, directrix = site.y, lArc, rArc, dxl, dxr, node = d3_geom_voronoiBeaches._;
    while (node) {
      dxl = d3_geom_voronoiLeftBreakPoint(node, directrix) - x;
      if (dxl > ε) node = node.L; else {
        dxr = x - d3_geom_voronoiRightBreakPoint(node, directrix);
        if (dxr > ε) {
          if (!node.R) {
            lArc = node;
            break;
          }
          node = node.R;
        } else {
          if (dxl > -ε) {
            lArc = node.P;
            rArc = node;
          } else if (dxr > -ε) {
            lArc = node;
            rArc = node.N;
          } else {
            lArc = rArc = node;
          }
          break;
        }
      }
    }
    var newArc = d3_geom_voronoiCreateBeach(site);
    d3_geom_voronoiBeaches.insert(lArc, newArc);
    if (!lArc && !rArc) return;
    if (lArc === rArc) {
      d3_geom_voronoiDetachCircle(lArc);
      rArc = d3_geom_voronoiCreateBeach(lArc.site);
      d3_geom_voronoiBeaches.insert(newArc, rArc);
      newArc.edge = rArc.edge = d3_geom_voronoiCreateEdge(lArc.site, newArc.site);
      d3_geom_voronoiAttachCircle(lArc);
      d3_geom_voronoiAttachCircle(rArc);
      return;
    }
    if (!rArc) {
      newArc.edge = d3_geom_voronoiCreateEdge(lArc.site, newArc.site);
      return;
    }
    d3_geom_voronoiDetachCircle(lArc);
    d3_geom_voronoiDetachCircle(rArc);
    var lSite = lArc.site, ax = lSite.x, ay = lSite.y, bx = site.x - ax, by = site.y - ay, rSite = rArc.site, cx = rSite.x - ax, cy = rSite.y - ay, d = 2 * (bx * cy - by * cx), hb = bx * bx + by * by, hc = cx * cx + cy * cy, vertex = {
      x: (cy * hb - by * hc) / d + ax,
      y: (bx * hc - cx * hb) / d + ay
    };
    d3_geom_voronoiSetEdgeEnd(rArc.edge, lSite, rSite, vertex);
    newArc.edge = d3_geom_voronoiCreateEdge(lSite, site, null, vertex);
    rArc.edge = d3_geom_voronoiCreateEdge(site, rSite, null, vertex);
    d3_geom_voronoiAttachCircle(lArc);
    d3_geom_voronoiAttachCircle(rArc);
  }
  function d3_geom_voronoiLeftBreakPoint(arc, directrix) {
    var site = arc.site, rfocx = site.x, rfocy = site.y, pby2 = rfocy - directrix;
    if (!pby2) return rfocx;
    var lArc = arc.P;
    if (!lArc) return -Infinity;
    site = lArc.site;
    var lfocx = site.x, lfocy = site.y, plby2 = lfocy - directrix;
    if (!plby2) return lfocx;
    var hl = lfocx - rfocx, aby2 = 1 / pby2 - 1 / plby2, b = hl / plby2;
    if (aby2) return (-b + Math.sqrt(b * b - 2 * aby2 * (hl * hl / (-2 * plby2) - lfocy + plby2 / 2 + rfocy - pby2 / 2))) / aby2 + rfocx;
    return (rfocx + lfocx) / 2;
  }
  function d3_geom_voronoiRightBreakPoint(arc, directrix) {
    var rArc = arc.N;
    if (rArc) return d3_geom_voronoiLeftBreakPoint(rArc, directrix);
    var site = arc.site;
    return site.y === directrix ? site.x : Infinity;
  }
  function d3_geom_voronoiCell(site) {
    this.site = site;
    this.edges = [];
  }
  d3_geom_voronoiCell.prototype.prepare = function() {
    var halfEdges = this.edges, iHalfEdge = halfEdges.length, edge;
    while (iHalfEdge--) {
      edge = halfEdges[iHalfEdge].edge;
      if (!edge.b || !edge.a) halfEdges.splice(iHalfEdge, 1);
    }
    halfEdges.sort(d3_geom_voronoiHalfEdgeOrder);
    return halfEdges.length;
  };
  function d3_geom_voronoiCloseCells(extent) {
    var x0 = extent[0][0], x1 = extent[1][0], y0 = extent[0][1], y1 = extent[1][1], x2, y2, x3, y3, cells = d3_geom_voronoiCells, iCell = cells.length, cell, iHalfEdge, halfEdges, nHalfEdges, start, end;
    while (iCell--) {
      cell = cells[iCell];
      if (!cell || !cell.prepare()) continue;
      halfEdges = cell.edges;
      nHalfEdges = halfEdges.length;
      iHalfEdge = 0;
      while (iHalfEdge < nHalfEdges) {
        end = halfEdges[iHalfEdge].end(), x3 = end.x, y3 = end.y;
        start = halfEdges[++iHalfEdge % nHalfEdges].start(), x2 = start.x, y2 = start.y;
        if (abs(x3 - x2) > ε || abs(y3 - y2) > ε) {
          halfEdges.splice(iHalfEdge, 0, new d3_geom_voronoiHalfEdge(d3_geom_voronoiCreateBorderEdge(cell.site, end, abs(x3 - x0) < ε && y1 - y3 > ε ? {
            x: x0,
            y: abs(x2 - x0) < ε ? y2 : y1
          } : abs(y3 - y1) < ε && x1 - x3 > ε ? {
            x: abs(y2 - y1) < ε ? x2 : x1,
            y: y1
          } : abs(x3 - x1) < ε && y3 - y0 > ε ? {
            x: x1,
            y: abs(x2 - x1) < ε ? y2 : y0
          } : abs(y3 - y0) < ε && x3 - x0 > ε ? {
            x: abs(y2 - y0) < ε ? x2 : x0,
            y: y0
          } : null), cell.site, null));
          ++nHalfEdges;
        }
      }
    }
  }
  function d3_geom_voronoiHalfEdgeOrder(a, b) {
    return b.angle - a.angle;
  }
  function d3_geom_voronoiCircle() {
    d3_geom_voronoiRedBlackNode(this);
    this.x = this.y = this.arc = this.site = this.cy = null;
  }
  function d3_geom_voronoiAttachCircle(arc) {
    var lArc = arc.P, rArc = arc.N;
    if (!lArc || !rArc) return;
    var lSite = lArc.site, cSite = arc.site, rSite = rArc.site;
    if (lSite === rSite) return;
    var bx = cSite.x, by = cSite.y, ax = lSite.x - bx, ay = lSite.y - by, cx = rSite.x - bx, cy = rSite.y - by;
    var d = 2 * (ax * cy - ay * cx);
    if (d >= -ε2) return;
    var ha = ax * ax + ay * ay, hc = cx * cx + cy * cy, x = (cy * ha - ay * hc) / d, y = (ax * hc - cx * ha) / d, cy = y + by;
    var circle = d3_geom_voronoiCirclePool.pop() || new d3_geom_voronoiCircle();
    circle.arc = arc;
    circle.site = cSite;
    circle.x = x + bx;
    circle.y = cy + Math.sqrt(x * x + y * y);
    circle.cy = cy;
    arc.circle = circle;
    var before = null, node = d3_geom_voronoiCircles._;
    while (node) {
      if (circle.y < node.y || circle.y === node.y && circle.x <= node.x) {
        if (node.L) node = node.L; else {
          before = node.P;
          break;
        }
      } else {
        if (node.R) node = node.R; else {
          before = node;
          break;
        }
      }
    }
    d3_geom_voronoiCircles.insert(before, circle);
    if (!before) d3_geom_voronoiFirstCircle = circle;
  }
  function d3_geom_voronoiDetachCircle(arc) {
    var circle = arc.circle;
    if (circle) {
      if (!circle.P) d3_geom_voronoiFirstCircle = circle.N;
      d3_geom_voronoiCircles.remove(circle);
      d3_geom_voronoiCirclePool.push(circle);
      d3_geom_voronoiRedBlackNode(circle);
      arc.circle = null;
    }
  }
  function d3_geom_voronoiClipEdges(extent) {
    var edges = d3_geom_voronoiEdges, clip = d3_geom_clipLine(extent[0][0], extent[0][1], extent[1][0], extent[1][1]), i = edges.length, e;
    while (i--) {
      e = edges[i];
      if (!d3_geom_voronoiConnectEdge(e, extent) || !clip(e) || abs(e.a.x - e.b.x) < ε && abs(e.a.y - e.b.y) < ε) {
        e.a = e.b = null;
        edges.splice(i, 1);
      }
    }
  }
  function d3_geom_voronoiConnectEdge(edge, extent) {
    var vb = edge.b;
    if (vb) return true;
    var va = edge.a, x0 = extent[0][0], x1 = extent[1][0], y0 = extent[0][1], y1 = extent[1][1], lSite = edge.l, rSite = edge.r, lx = lSite.x, ly = lSite.y, rx = rSite.x, ry = rSite.y, fx = (lx + rx) / 2, fy = (ly + ry) / 2, fm, fb;
    if (ry === ly) {
      if (fx < x0 || fx >= x1) return;
      if (lx > rx) {
        if (!va) va = {
          x: fx,
          y: y0
        }; else if (va.y >= y1) return;
        vb = {
          x: fx,
          y: y1
        };
      } else {
        if (!va) va = {
          x: fx,
          y: y1
        }; else if (va.y < y0) return;
        vb = {
          x: fx,
          y: y0
        };
      }
    } else {
      fm = (lx - rx) / (ry - ly);
      fb = fy - fm * fx;
      if (fm < -1 || fm > 1) {
        if (lx > rx) {
          if (!va) va = {
            x: (y0 - fb) / fm,
            y: y0
          }; else if (va.y >= y1) return;
          vb = {
            x: (y1 - fb) / fm,
            y: y1
          };
        } else {
          if (!va) va = {
            x: (y1 - fb) / fm,
            y: y1
          }; else if (va.y < y0) return;
          vb = {
            x: (y0 - fb) / fm,
            y: y0
          };
        }
      } else {
        if (ly < ry) {
          if (!va) va = {
            x: x0,
            y: fm * x0 + fb
          }; else if (va.x >= x1) return;
          vb = {
            x: x1,
            y: fm * x1 + fb
          };
        } else {
          if (!va) va = {
            x: x1,
            y: fm * x1 + fb
          }; else if (va.x < x0) return;
          vb = {
            x: x0,
            y: fm * x0 + fb
          };
        }
      }
    }
    edge.a = va;
    edge.b = vb;
    return true;
  }
  function d3_geom_voronoiEdge(lSite, rSite) {
    this.l = lSite;
    this.r = rSite;
    this.a = this.b = null;
  }
  function d3_geom_voronoiCreateEdge(lSite, rSite, va, vb) {
    var edge = new d3_geom_voronoiEdge(lSite, rSite);
    d3_geom_voronoiEdges.push(edge);
    if (va) d3_geom_voronoiSetEdgeEnd(edge, lSite, rSite, va);
    if (vb) d3_geom_voronoiSetEdgeEnd(edge, rSite, lSite, vb);
    d3_geom_voronoiCells[lSite.i].edges.push(new d3_geom_voronoiHalfEdge(edge, lSite, rSite));
    d3_geom_voronoiCells[rSite.i].edges.push(new d3_geom_voronoiHalfEdge(edge, rSite, lSite));
    return edge;
  }
  function d3_geom_voronoiCreateBorderEdge(lSite, va, vb) {
    var edge = new d3_geom_voronoiEdge(lSite, null);
    edge.a = va;
    edge.b = vb;
    d3_geom_voronoiEdges.push(edge);
    return edge;
  }
  function d3_geom_voronoiSetEdgeEnd(edge, lSite, rSite, vertex) {
    if (!edge.a && !edge.b) {
      edge.a = vertex;
      edge.l = lSite;
      edge.r = rSite;
    } else if (edge.l === rSite) {
      edge.b = vertex;
    } else {
      edge.a = vertex;
    }
  }
  function d3_geom_voronoiHalfEdge(edge, lSite, rSite) {
    var va = edge.a, vb = edge.b;
    this.edge = edge;
    this.site = lSite;
    this.angle = rSite ? Math.atan2(rSite.y - lSite.y, rSite.x - lSite.x) : edge.l === lSite ? Math.atan2(vb.x - va.x, va.y - vb.y) : Math.atan2(va.x - vb.x, vb.y - va.y);
  }
  d3_geom_voronoiHalfEdge.prototype = {
    start: function() {
      return this.edge.l === this.site ? this.edge.a : this.edge.b;
    },
    end: function() {
      return this.edge.l === this.site ? this.edge.b : this.edge.a;
    }
  };
  function d3_geom_voronoiRedBlackTree() {
    this._ = null;
  }
  function d3_geom_voronoiRedBlackNode(node) {
    node.U = node.C = node.L = node.R = node.P = node.N = null;
  }
  d3_geom_voronoiRedBlackTree.prototype = {
    insert: function(after, node) {
      var parent, grandpa, uncle;
      if (after) {
        node.P = after;
        node.N = after.N;
        if (after.N) after.N.P = node;
        after.N = node;
        if (after.R) {
          after = after.R;
          while (after.L) after = after.L;
          after.L = node;
        } else {
          after.R = node;
        }
        parent = after;
      } else if (this._) {
        after = d3_geom_voronoiRedBlackFirst(this._);
        node.P = null;
        node.N = after;
        after.P = after.L = node;
        parent = after;
      } else {
        node.P = node.N = null;
        this._ = node;
        parent = null;
      }
      node.L = node.R = null;
      node.U = parent;
      node.C = true;
      after = node;
      while (parent && parent.C) {
        grandpa = parent.U;
        if (parent === grandpa.L) {
          uncle = grandpa.R;
          if (uncle && uncle.C) {
            parent.C = uncle.C = false;
            grandpa.C = true;
            after = grandpa;
          } else {
            if (after === parent.R) {
              d3_geom_voronoiRedBlackRotateLeft(this, parent);
              after = parent;
              parent = after.U;
            }
            parent.C = false;
            grandpa.C = true;
            d3_geom_voronoiRedBlackRotateRight(this, grandpa);
          }
        } else {
          uncle = grandpa.L;
          if (uncle && uncle.C) {
            parent.C = uncle.C = false;
            grandpa.C = true;
            after = grandpa;
          } else {
            if (after === parent.L) {
              d3_geom_voronoiRedBlackRotateRight(this, parent);
              after = parent;
              parent = after.U;
            }
            parent.C = false;
            grandpa.C = true;
            d3_geom_voronoiRedBlackRotateLeft(this, grandpa);
          }
        }
        parent = after.U;
      }
      this._.C = false;
    },
    remove: function(node) {
      if (node.N) node.N.P = node.P;
      if (node.P) node.P.N = node.N;
      node.N = node.P = null;
      var parent = node.U, sibling, left = node.L, right = node.R, next, red;
      if (!left) next = right; else if (!right) next = left; else next = d3_geom_voronoiRedBlackFirst(right);
      if (parent) {
        if (parent.L === node) parent.L = next; else parent.R = next;
      } else {
        this._ = next;
      }
      if (left && right) {
        red = next.C;
        next.C = node.C;
        next.L = left;
        left.U = next;
        if (next !== right) {
          parent = next.U;
          next.U = node.U;
          node = next.R;
          parent.L = node;
          next.R = right;
          right.U = next;
        } else {
          next.U = parent;
          parent = next;
          node = next.R;
        }
      } else {
        red = node.C;
        node = next;
      }
      if (node) node.U = parent;
      if (red) return;
      if (node && node.C) {
        node.C = false;
        return;
      }
      do {
        if (node === this._) break;
        if (node === parent.L) {
          sibling = parent.R;
          if (sibling.C) {
            sibling.C = false;
            parent.C = true;
            d3_geom_voronoiRedBlackRotateLeft(this, parent);
            sibling = parent.R;
          }
          if (sibling.L && sibling.L.C || sibling.R && sibling.R.C) {
            if (!sibling.R || !sibling.R.C) {
              sibling.L.C = false;
              sibling.C = true;
              d3_geom_voronoiRedBlackRotateRight(this, sibling);
              sibling = parent.R;
            }
            sibling.C = parent.C;
            parent.C = sibling.R.C = false;
            d3_geom_voronoiRedBlackRotateLeft(this, parent);
            node = this._;
            break;
          }
        } else {
          sibling = parent.L;
          if (sibling.C) {
            sibling.C = false;
            parent.C = true;
            d3_geom_voronoiRedBlackRotateRight(this, parent);
            sibling = parent.L;
          }
          if (sibling.L && sibling.L.C || sibling.R && sibling.R.C) {
            if (!sibling.L || !sibling.L.C) {
              sibling.R.C = false;
              sibling.C = true;
              d3_geom_voronoiRedBlackRotateLeft(this, sibling);
              sibling = parent.L;
            }
            sibling.C = parent.C;
            parent.C = sibling.L.C = false;
            d3_geom_voronoiRedBlackRotateRight(this, parent);
            node = this._;
            break;
          }
        }
        sibling.C = true;
        node = parent;
        parent = parent.U;
      } while (!node.C);
      if (node) node.C = false;
    }
  };
  function d3_geom_voronoiRedBlackRotateLeft(tree, node) {
    var p = node, q = node.R, parent = p.U;
    if (parent) {
      if (parent.L === p) parent.L = q; else parent.R = q;
    } else {
      tree._ = q;
    }
    q.U = parent;
    p.U = q;
    p.R = q.L;
    if (p.R) p.R.U = p;
    q.L = p;
  }
  function d3_geom_voronoiRedBlackRotateRight(tree, node) {
    var p = node, q = node.L, parent = p.U;
    if (parent) {
      if (parent.L === p) parent.L = q; else parent.R = q;
    } else {
      tree._ = q;
    }
    q.U = parent;
    p.U = q;
    p.L = q.R;
    if (p.L) p.L.U = p;
    q.R = p;
  }
  function d3_geom_voronoiRedBlackFirst(node) {
    while (node.L) node = node.L;
    return node;
  }
  function d3_geom_voronoi(sites, bbox) {
    var site = sites.sort(d3_geom_voronoiVertexOrder).pop(), x0, y0, circle;
    d3_geom_voronoiEdges = [];
    d3_geom_voronoiCells = new Array(sites.length);
    d3_geom_voronoiBeaches = new d3_geom_voronoiRedBlackTree();
    d3_geom_voronoiCircles = new d3_geom_voronoiRedBlackTree();
    while (true) {
      circle = d3_geom_voronoiFirstCircle;
      if (site && (!circle || site.y < circle.y || site.y === circle.y && site.x < circle.x)) {
        if (site.x !== x0 || site.y !== y0) {
          d3_geom_voronoiCells[site.i] = new d3_geom_voronoiCell(site);
          d3_geom_voronoiAddBeach(site);
          x0 = site.x, y0 = site.y;
        }
        site = sites.pop();
      } else if (circle) {
        d3_geom_voronoiRemoveBeach(circle.arc);
      } else {
        break;
      }
    }
    if (bbox) d3_geom_voronoiClipEdges(bbox), d3_geom_voronoiCloseCells(bbox);
    var diagram = {
      cells: d3_geom_voronoiCells,
      edges: d3_geom_voronoiEdges
    };
    d3_geom_voronoiBeaches = d3_geom_voronoiCircles = d3_geom_voronoiEdges = d3_geom_voronoiCells = null;
    return diagram;
  }
  function d3_geom_voronoiVertexOrder(a, b) {
    return b.y - a.y || b.x - a.x;
  }
  d3.geom.voronoi = function(points) {
    var x = d3_geom_pointX, y = d3_geom_pointY, fx = x, fy = y, clipExtent = d3_geom_voronoiClipExtent;
    if (points) return voronoi(points);
    function voronoi(data) {
      var polygons = new Array(data.length), x0 = clipExtent[0][0], y0 = clipExtent[0][1], x1 = clipExtent[1][0], y1 = clipExtent[1][1];
      d3_geom_voronoi(sites(data), clipExtent).cells.forEach(function(cell, i) {
        var edges = cell.edges, site = cell.site, polygon = polygons[i] = edges.length ? edges.map(function(e) {
          var s = e.start();
          return [ s.x, s.y ];
        }) : site.x >= x0 && site.x <= x1 && site.y >= y0 && site.y <= y1 ? [ [ x0, y1 ], [ x1, y1 ], [ x1, y0 ], [ x0, y0 ] ] : [];
        polygon.point = data[i];
      });
      return polygons;
    }
    function sites(data) {
      return data.map(function(d, i) {
        return {
          x: Math.round(fx(d, i) / ε) * ε,
          y: Math.round(fy(d, i) / ε) * ε,
          i: i
        };
      });
    }
    voronoi.links = function(data) {
      return d3_geom_voronoi(sites(data)).edges.filter(function(edge) {
        return edge.l && edge.r;
      }).map(function(edge) {
        return {
          source: data[edge.l.i],
          target: data[edge.r.i]
        };
      });
    };
    voronoi.triangles = function(data) {
      var triangles = [];
      d3_geom_voronoi(sites(data)).cells.forEach(function(cell, i) {
        var site = cell.site, edges = cell.edges.sort(d3_geom_voronoiHalfEdgeOrder), j = -1, m = edges.length, e0, s0, e1 = edges[m - 1].edge, s1 = e1.l === site ? e1.r : e1.l;
        while (++j < m) {
          e0 = e1;
          s0 = s1;
          e1 = edges[j].edge;
          s1 = e1.l === site ? e1.r : e1.l;
          if (i < s0.i && i < s1.i && d3_geom_voronoiTriangleArea(site, s0, s1) < 0) {
            triangles.push([ data[i], data[s0.i], data[s1.i] ]);
          }
        }
      });
      return triangles;
    };
    voronoi.x = function(_) {
      return arguments.length ? (fx = d3_functor(x = _), voronoi) : x;
    };
    voronoi.y = function(_) {
      return arguments.length ? (fy = d3_functor(y = _), voronoi) : y;
    };
    voronoi.clipExtent = function(_) {
      if (!arguments.length) return clipExtent === d3_geom_voronoiClipExtent ? null : clipExtent;
      clipExtent = _ == null ? d3_geom_voronoiClipExtent : _;
      return voronoi;
    };
    voronoi.size = function(_) {
      if (!arguments.length) return clipExtent === d3_geom_voronoiClipExtent ? null : clipExtent && clipExtent[1];
      return voronoi.clipExtent(_ && [ [ 0, 0 ], _ ]);
    };
    return voronoi;
  };
  var d3_geom_voronoiClipExtent = [ [ -1e6, -1e6 ], [ 1e6, 1e6 ] ];
  function d3_geom_voronoiTriangleArea(a, b, c) {
    return (a.x - c.x) * (b.y - a.y) - (a.x - b.x) * (c.y - a.y);
  }
  d3.geom.delaunay = function(vertices) {
    return d3.geom.voronoi().triangles(vertices);
  };
  d3.geom.quadtree = function(points, x1, y1, x2, y2) {
    var x = d3_geom_pointX, y = d3_geom_pointY, compat;
    if (compat = arguments.length) {
      x = d3_geom_quadtreeCompatX;
      y = d3_geom_quadtreeCompatY;
      if (compat === 3) {
        y2 = y1;
        x2 = x1;
        y1 = x1 = 0;
      }
      return quadtree(points);
    }
    function quadtree(data) {
      var d, fx = d3_functor(x), fy = d3_functor(y), xs, ys, i, n, x1_, y1_, x2_, y2_;
      if (x1 != null) {
        x1_ = x1, y1_ = y1, x2_ = x2, y2_ = y2;
      } else {
        x2_ = y2_ = -(x1_ = y1_ = Infinity);
        xs = [], ys = [];
        n = data.length;
        if (compat) for (i = 0; i < n; ++i) {
          d = data[i];
          if (d.x < x1_) x1_ = d.x;
          if (d.y < y1_) y1_ = d.y;
          if (d.x > x2_) x2_ = d.x;
          if (d.y > y2_) y2_ = d.y;
          xs.push(d.x);
          ys.push(d.y);
        } else for (i = 0; i < n; ++i) {
          var x_ = +fx(d = data[i], i), y_ = +fy(d, i);
          if (x_ < x1_) x1_ = x_;
          if (y_ < y1_) y1_ = y_;
          if (x_ > x2_) x2_ = x_;
          if (y_ > y2_) y2_ = y_;
          xs.push(x_);
          ys.push(y_);
        }
      }
      var dx = x2_ - x1_, dy = y2_ - y1_;
      if (dx > dy) y2_ = y1_ + dx; else x2_ = x1_ + dy;
      function insert(n, d, x, y, x1, y1, x2, y2) {
        if (isNaN(x) || isNaN(y)) return;
        if (n.leaf) {
          var nx = n.x, ny = n.y;
          if (nx != null) {
            if (abs(nx - x) + abs(ny - y) < .01) {
              insertChild(n, d, x, y, x1, y1, x2, y2);
            } else {
              var nPoint = n.point;
              n.x = n.y = n.point = null;
              insertChild(n, nPoint, nx, ny, x1, y1, x2, y2);
              insertChild(n, d, x, y, x1, y1, x2, y2);
            }
          } else {
            n.x = x, n.y = y, n.point = d;
          }
        } else {
          insertChild(n, d, x, y, x1, y1, x2, y2);
        }
      }
      function insertChild(n, d, x, y, x1, y1, x2, y2) {
        var xm = (x1 + x2) * .5, ym = (y1 + y2) * .5, right = x >= xm, below = y >= ym, i = below << 1 | right;
        n.leaf = false;
        n = n.nodes[i] || (n.nodes[i] = d3_geom_quadtreeNode());
        if (right) x1 = xm; else x2 = xm;
        if (below) y1 = ym; else y2 = ym;
        insert(n, d, x, y, x1, y1, x2, y2);
      }
      var root = d3_geom_quadtreeNode();
      root.add = function(d) {
        insert(root, d, +fx(d, ++i), +fy(d, i), x1_, y1_, x2_, y2_);
      };
      root.visit = function(f) {
        d3_geom_quadtreeVisit(f, root, x1_, y1_, x2_, y2_);
      };
      root.find = function(point) {
        return d3_geom_quadtreeFind(root, point[0], point[1], x1_, y1_, x2_, y2_);
      };
      i = -1;
      if (x1 == null) {
        while (++i < n) {
          insert(root, data[i], xs[i], ys[i], x1_, y1_, x2_, y2_);
        }
        --i;
      } else data.forEach(root.add);
      xs = ys = data = d = null;
      return root;
    }
    quadtree.x = function(_) {
      return arguments.length ? (x = _, quadtree) : x;
    };
    quadtree.y = function(_) {
      return arguments.length ? (y = _, quadtree) : y;
    };
    quadtree.extent = function(_) {
      if (!arguments.length) return x1 == null ? null : [ [ x1, y1 ], [ x2, y2 ] ];
      if (_ == null) x1 = y1 = x2 = y2 = null; else x1 = +_[0][0], y1 = +_[0][1], x2 = +_[1][0], 
      y2 = +_[1][1];
      return quadtree;
    };
    quadtree.size = function(_) {
      if (!arguments.length) return x1 == null ? null : [ x2 - x1, y2 - y1 ];
      if (_ == null) x1 = y1 = x2 = y2 = null; else x1 = y1 = 0, x2 = +_[0], y2 = +_[1];
      return quadtree;
    };
    return quadtree;
  };
  function d3_geom_quadtreeCompatX(d) {
    return d.x;
  }
  function d3_geom_quadtreeCompatY(d) {
    return d.y;
  }
  function d3_geom_quadtreeNode() {
    return {
      leaf: true,
      nodes: [],
      point: null,
      x: null,
      y: null
    };
  }
  function d3_geom_quadtreeVisit(f, node, x1, y1, x2, y2) {
    if (!f(node, x1, y1, x2, y2)) {
      var sx = (x1 + x2) * .5, sy = (y1 + y2) * .5, children = node.nodes;
      if (children[0]) d3_geom_quadtreeVisit(f, children[0], x1, y1, sx, sy);
      if (children[1]) d3_geom_quadtreeVisit(f, children[1], sx, y1, x2, sy);
      if (children[2]) d3_geom_quadtreeVisit(f, children[2], x1, sy, sx, y2);
      if (children[3]) d3_geom_quadtreeVisit(f, children[3], sx, sy, x2, y2);
    }
  }
  function d3_geom_quadtreeFind(root, x, y, x0, y0, x3, y3) {
    var minDistance2 = Infinity, closestPoint;
    (function find(node, x1, y1, x2, y2) {
      if (x1 > x3 || y1 > y3 || x2 < x0 || y2 < y0) return;
      if (point = node.point) {
        var point, dx = x - node.x, dy = y - node.y, distance2 = dx * dx + dy * dy;
        if (distance2 < minDistance2) {
          var distance = Math.sqrt(minDistance2 = distance2);
          x0 = x - distance, y0 = y - distance;
          x3 = x + distance, y3 = y + distance;
          closestPoint = point;
        }
      }
      var children = node.nodes, xm = (x1 + x2) * .5, ym = (y1 + y2) * .5, right = x >= xm, below = y >= ym;
      for (var i = below << 1 | right, j = i + 4; i < j; ++i) {
        if (node = children[i & 3]) switch (i & 3) {
         case 0:
          find(node, x1, y1, xm, ym);
          break;

         case 1:
          find(node, xm, y1, x2, ym);
          break;

         case 2:
          find(node, x1, ym, xm, y2);
          break;

         case 3:
          find(node, xm, ym, x2, y2);
          break;
        }
      }
    })(root, x0, y0, x3, y3);
    return closestPoint;
  }
  d3.interpolateRgb = d3_interpolateRgb;
  function d3_interpolateRgb(a, b) {
    a = d3.rgb(a);
    b = d3.rgb(b);
    var ar = a.r, ag = a.g, ab = a.b, br = b.r - ar, bg = b.g - ag, bb = b.b - ab;
    return function(t) {
      return "#" + d3_rgb_hex(Math.round(ar + br * t)) + d3_rgb_hex(Math.round(ag + bg * t)) + d3_rgb_hex(Math.round(ab + bb * t));
    };
  }
  d3.interpolateObject = d3_interpolateObject;
  function d3_interpolateObject(a, b) {
    var i = {}, c = {}, k;
    for (k in a) {
      if (k in b) {
        i[k] = d3_interpolate(a[k], b[k]);
      } else {
        c[k] = a[k];
      }
    }
    for (k in b) {
      if (!(k in a)) {
        c[k] = b[k];
      }
    }
    return function(t) {
      for (k in i) c[k] = i[k](t);
      return c;
    };
  }
  d3.interpolateNumber = d3_interpolateNumber;
  function d3_interpolateNumber(a, b) {
    a = +a, b = +b;
    return function(t) {
      return a * (1 - t) + b * t;
    };
  }
  d3.interpolateString = d3_interpolateString;
  function d3_interpolateString(a, b) {
    var bi = d3_interpolate_numberA.lastIndex = d3_interpolate_numberB.lastIndex = 0, am, bm, bs, i = -1, s = [], q = [];
    a = a + "", b = b + "";
    while ((am = d3_interpolate_numberA.exec(a)) && (bm = d3_interpolate_numberB.exec(b))) {
      if ((bs = bm.index) > bi) {
        bs = b.slice(bi, bs);
        if (s[i]) s[i] += bs; else s[++i] = bs;
      }
      if ((am = am[0]) === (bm = bm[0])) {
        if (s[i]) s[i] += bm; else s[++i] = bm;
      } else {
        s[++i] = null;
        q.push({
          i: i,
          x: d3_interpolateNumber(am, bm)
        });
      }
      bi = d3_interpolate_numberB.lastIndex;
    }
    if (bi < b.length) {
      bs = b.slice(bi);
      if (s[i]) s[i] += bs; else s[++i] = bs;
    }
    return s.length < 2 ? q[0] ? (b = q[0].x, function(t) {
      return b(t) + "";
    }) : function() {
      return b;
    } : (b = q.length, function(t) {
      for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
      return s.join("");
    });
  }
  var d3_interpolate_numberA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g, d3_interpolate_numberB = new RegExp(d3_interpolate_numberA.source, "g");
  d3.interpolate = d3_interpolate;
  function d3_interpolate(a, b) {
    var i = d3.interpolators.length, f;
    while (--i >= 0 && !(f = d3.interpolators[i](a, b))) ;
    return f;
  }
  d3.interpolators = [ function(a, b) {
    var t = typeof b;
    return (t === "string" ? d3_rgb_names.has(b.toLowerCase()) || /^(#|rgb\(|hsl\()/i.test(b) ? d3_interpolateRgb : d3_interpolateString : b instanceof d3_color ? d3_interpolateRgb : Array.isArray(b) ? d3_interpolateArray : t === "object" && isNaN(b) ? d3_interpolateObject : d3_interpolateNumber)(a, b);
  } ];
  d3.interpolateArray = d3_interpolateArray;
  function d3_interpolateArray(a, b) {
    var x = [], c = [], na = a.length, nb = b.length, n0 = Math.min(a.length, b.length), i;
    for (i = 0; i < n0; ++i) x.push(d3_interpolate(a[i], b[i]));
    for (;i < na; ++i) c[i] = a[i];
    for (;i < nb; ++i) c[i] = b[i];
    return function(t) {
      for (i = 0; i < n0; ++i) c[i] = x[i](t);
      return c;
    };
  }
  var d3_ease_default = function() {
    return d3_identity;
  };
  var d3_ease = d3.map({
    linear: d3_ease_default,
    poly: d3_ease_poly,
    quad: function() {
      return d3_ease_quad;
    },
    cubic: function() {
      return d3_ease_cubic;
    },
    sin: function() {
      return d3_ease_sin;
    },
    exp: function() {
      return d3_ease_exp;
    },
    circle: function() {
      return d3_ease_circle;
    },
    elastic: d3_ease_elastic,
    back: d3_ease_back,
    bounce: function() {
      return d3_ease_bounce;
    }
  });
  var d3_ease_mode = d3.map({
    "in": d3_identity,
    out: d3_ease_reverse,
    "in-out": d3_ease_reflect,
    "out-in": function(f) {
      return d3_ease_reflect(d3_ease_reverse(f));
    }
  });
  d3.ease = function(name) {
    var i = name.indexOf("-"), t = i >= 0 ? name.slice(0, i) : name, m = i >= 0 ? name.slice(i + 1) : "in";
    t = d3_ease.get(t) || d3_ease_default;
    m = d3_ease_mode.get(m) || d3_identity;
    return d3_ease_clamp(m(t.apply(null, d3_arraySlice.call(arguments, 1))));
  };
  function d3_ease_clamp(f) {
    return function(t) {
      return t <= 0 ? 0 : t >= 1 ? 1 : f(t);
    };
  }
  function d3_ease_reverse(f) {
    return function(t) {
      return 1 - f(1 - t);
    };
  }
  function d3_ease_reflect(f) {
    return function(t) {
      return .5 * (t < .5 ? f(2 * t) : 2 - f(2 - 2 * t));
    };
  }
  function d3_ease_quad(t) {
    return t * t;
  }
  function d3_ease_cubic(t) {
    return t * t * t;
  }
  function d3_ease_cubicInOut(t) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    var t2 = t * t, t3 = t2 * t;
    return 4 * (t < .5 ? t3 : 3 * (t - t2) + t3 - .75);
  }
  function d3_ease_poly(e) {
    return function(t) {
      return Math.pow(t, e);
    };
  }
  function d3_ease_sin(t) {
    return 1 - Math.cos(t * halfπ);
  }
  function d3_ease_exp(t) {
    return Math.pow(2, 10 * (t - 1));
  }
  function d3_ease_circle(t) {
    return 1 - Math.sqrt(1 - t * t);
  }
  function d3_ease_elastic(a, p) {
    var s;
    if (arguments.length < 2) p = .45;
    if (arguments.length) s = p / τ * Math.asin(1 / a); else a = 1, s = p / 4;
    return function(t) {
      return 1 + a * Math.pow(2, -10 * t) * Math.sin((t - s) * τ / p);
    };
  }
  function d3_ease_back(s) {
    if (!s) s = 1.70158;
    return function(t) {
      return t * t * ((s + 1) * t - s);
    };
  }
  function d3_ease_bounce(t) {
    return t < 1 / 2.75 ? 7.5625 * t * t : t < 2 / 2.75 ? 7.5625 * (t -= 1.5 / 2.75) * t + .75 : t < 2.5 / 2.75 ? 7.5625 * (t -= 2.25 / 2.75) * t + .9375 : 7.5625 * (t -= 2.625 / 2.75) * t + .984375;
  }
  d3.interpolateHcl = d3_interpolateHcl;
  function d3_interpolateHcl(a, b) {
    a = d3.hcl(a);
    b = d3.hcl(b);
    var ah = a.h, ac = a.c, al = a.l, bh = b.h - ah, bc = b.c - ac, bl = b.l - al;
    if (isNaN(bc)) bc = 0, ac = isNaN(ac) ? b.c : ac;
    if (isNaN(bh)) bh = 0, ah = isNaN(ah) ? b.h : ah; else if (bh > 180) bh -= 360; else if (bh < -180) bh += 360;
    return function(t) {
      return d3_hcl_lab(ah + bh * t, ac + bc * t, al + bl * t) + "";
    };
  }
  d3.interpolateHsl = d3_interpolateHsl;
  function d3_interpolateHsl(a, b) {
    a = d3.hsl(a);
    b = d3.hsl(b);
    var ah = a.h, as = a.s, al = a.l, bh = b.h - ah, bs = b.s - as, bl = b.l - al;
    if (isNaN(bs)) bs = 0, as = isNaN(as) ? b.s : as;
    if (isNaN(bh)) bh = 0, ah = isNaN(ah) ? b.h : ah; else if (bh > 180) bh -= 360; else if (bh < -180) bh += 360;
    return function(t) {
      return d3_hsl_rgb(ah + bh * t, as + bs * t, al + bl * t) + "";
    };
  }
  d3.interpolateLab = d3_interpolateLab;
  function d3_interpolateLab(a, b) {
    a = d3.lab(a);
    b = d3.lab(b);
    var al = a.l, aa = a.a, ab = a.b, bl = b.l - al, ba = b.a - aa, bb = b.b - ab;
    return function(t) {
      return d3_lab_rgb(al + bl * t, aa + ba * t, ab + bb * t) + "";
    };
  }
  d3.interpolateRound = d3_interpolateRound;
  function d3_interpolateRound(a, b) {
    b -= a;
    return function(t) {
      return Math.round(a + b * t);
    };
  }
  d3.transform = function(string) {
    var g = d3_document.createElementNS(d3.ns.prefix.svg, "g");
    return (d3.transform = function(string) {
      if (string != null) {
        g.setAttribute("transform", string);
        var t = g.transform.baseVal.consolidate();
      }
      return new d3_transform(t ? t.matrix : d3_transformIdentity);
    })(string);
  };
  function d3_transform(m) {
    var r0 = [ m.a, m.b ], r1 = [ m.c, m.d ], kx = d3_transformNormalize(r0), kz = d3_transformDot(r0, r1), ky = d3_transformNormalize(d3_transformCombine(r1, r0, -kz)) || 0;
    if (r0[0] * r1[1] < r1[0] * r0[1]) {
      r0[0] *= -1;
      r0[1] *= -1;
      kx *= -1;
      kz *= -1;
    }
    this.rotate = (kx ? Math.atan2(r0[1], r0[0]) : Math.atan2(-r1[0], r1[1])) * d3_degrees;
    this.translate = [ m.e, m.f ];
    this.scale = [ kx, ky ];
    this.skew = ky ? Math.atan2(kz, ky) * d3_degrees : 0;
  }
  d3_transform.prototype.toString = function() {
    return "translate(" + this.translate + ")rotate(" + this.rotate + ")skewX(" + this.skew + ")scale(" + this.scale + ")";
  };
  function d3_transformDot(a, b) {
    return a[0] * b[0] + a[1] * b[1];
  }
  function d3_transformNormalize(a) {
    var k = Math.sqrt(d3_transformDot(a, a));
    if (k) {
      a[0] /= k;
      a[1] /= k;
    }
    return k;
  }
  function d3_transformCombine(a, b, k) {
    a[0] += k * b[0];
    a[1] += k * b[1];
    return a;
  }
  var d3_transformIdentity = {
    a: 1,
    b: 0,
    c: 0,
    d: 1,
    e: 0,
    f: 0
  };
  d3.interpolateTransform = d3_interpolateTransform;
  function d3_interpolateTransform(a, b) {
    var s = [], q = [], n, A = d3.transform(a), B = d3.transform(b), ta = A.translate, tb = B.translate, ra = A.rotate, rb = B.rotate, wa = A.skew, wb = B.skew, ka = A.scale, kb = B.scale;
    if (ta[0] != tb[0] || ta[1] != tb[1]) {
      s.push("translate(", null, ",", null, ")");
      q.push({
        i: 1,
        x: d3_interpolateNumber(ta[0], tb[0])
      }, {
        i: 3,
        x: d3_interpolateNumber(ta[1], tb[1])
      });
    } else if (tb[0] || tb[1]) {
      s.push("translate(" + tb + ")");
    } else {
      s.push("");
    }
    if (ra != rb) {
      if (ra - rb > 180) rb += 360; else if (rb - ra > 180) ra += 360;
      q.push({
        i: s.push(s.pop() + "rotate(", null, ")") - 2,
        x: d3_interpolateNumber(ra, rb)
      });
    } else if (rb) {
      s.push(s.pop() + "rotate(" + rb + ")");
    }
    if (wa != wb) {
      q.push({
        i: s.push(s.pop() + "skewX(", null, ")") - 2,
        x: d3_interpolateNumber(wa, wb)
      });
    } else if (wb) {
      s.push(s.pop() + "skewX(" + wb + ")");
    }
    if (ka[0] != kb[0] || ka[1] != kb[1]) {
      n = s.push(s.pop() + "scale(", null, ",", null, ")");
      q.push({
        i: n - 4,
        x: d3_interpolateNumber(ka[0], kb[0])
      }, {
        i: n - 2,
        x: d3_interpolateNumber(ka[1], kb[1])
      });
    } else if (kb[0] != 1 || kb[1] != 1) {
      s.push(s.pop() + "scale(" + kb + ")");
    }
    n = q.length;
    return function(t) {
      var i = -1, o;
      while (++i < n) s[(o = q[i]).i] = o.x(t);
      return s.join("");
    };
  }
  function d3_uninterpolateNumber(a, b) {
    b = (b -= a = +a) || 1 / b;
    return function(x) {
      return (x - a) / b;
    };
  }
  function d3_uninterpolateClamp(a, b) {
    b = (b -= a = +a) || 1 / b;
    return function(x) {
      return Math.max(0, Math.min(1, (x - a) / b));
    };
  }
  d3.layout = {};
  d3.layout.bundle = function() {
    return function(links) {
      var paths = [], i = -1, n = links.length;
      while (++i < n) paths.push(d3_layout_bundlePath(links[i]));
      return paths;
    };
  };
  function d3_layout_bundlePath(link) {
    var start = link.source, end = link.target, lca = d3_layout_bundleLeastCommonAncestor(start, end), points = [ start ];
    while (start !== lca) {
      start = start.parent;
      points.push(start);
    }
    var k = points.length;
    while (end !== lca) {
      points.splice(k, 0, end);
      end = end.parent;
    }
    return points;
  }
  function d3_layout_bundleAncestors(node) {
    var ancestors = [], parent = node.parent;
    while (parent != null) {
      ancestors.push(node);
      node = parent;
      parent = parent.parent;
    }
    ancestors.push(node);
    return ancestors;
  }
  function d3_layout_bundleLeastCommonAncestor(a, b) {
    if (a === b) return a;
    var aNodes = d3_layout_bundleAncestors(a), bNodes = d3_layout_bundleAncestors(b), aNode = aNodes.pop(), bNode = bNodes.pop(), sharedNode = null;
    while (aNode === bNode) {
      sharedNode = aNode;
      aNode = aNodes.pop();
      bNode = bNodes.pop();
    }
    return sharedNode;
  }
  d3.layout.chord = function() {
    var chord = {}, chords, groups, matrix, n, padding = 0, sortGroups, sortSubgroups, sortChords;
    function relayout() {
      var subgroups = {}, groupSums = [], groupIndex = d3.range(n), subgroupIndex = [], k, x, x0, i, j;
      chords = [];
      groups = [];
      k = 0, i = -1;
      while (++i < n) {
        x = 0, j = -1;
        while (++j < n) {
          x += matrix[i][j];
        }
        groupSums.push(x);
        subgroupIndex.push(d3.range(n));
        k += x;
      }
      if (sortGroups) {
        groupIndex.sort(function(a, b) {
          return sortGroups(groupSums[a], groupSums[b]);
        });
      }
      if (sortSubgroups) {
        subgroupIndex.forEach(function(d, i) {
          d.sort(function(a, b) {
            return sortSubgroups(matrix[i][a], matrix[i][b]);
          });
        });
      }
      k = (τ - padding * n) / k;
      x = 0, i = -1;
      while (++i < n) {
        x0 = x, j = -1;
        while (++j < n) {
          var di = groupIndex[i], dj = subgroupIndex[di][j], v = matrix[di][dj], a0 = x, a1 = x += v * k;
          subgroups[di + "-" + dj] = {
            index: di,
            subindex: dj,
            startAngle: a0,
            endAngle: a1,
            value: v
          };
        }
        groups[di] = {
          index: di,
          startAngle: x0,
          endAngle: x,
          value: (x - x0) / k
        };
        x += padding;
      }
      i = -1;
      while (++i < n) {
        j = i - 1;
        while (++j < n) {
          var source = subgroups[i + "-" + j], target = subgroups[j + "-" + i];
          if (source.value || target.value) {
            chords.push(source.value < target.value ? {
              source: target,
              target: source
            } : {
              source: source,
              target: target
            });
          }
        }
      }
      if (sortChords) resort();
    }
    function resort() {
      chords.sort(function(a, b) {
        return sortChords((a.source.value + a.target.value) / 2, (b.source.value + b.target.value) / 2);
      });
    }
    chord.matrix = function(x) {
      if (!arguments.length) return matrix;
      n = (matrix = x) && matrix.length;
      chords = groups = null;
      return chord;
    };
    chord.padding = function(x) {
      if (!arguments.length) return padding;
      padding = x;
      chords = groups = null;
      return chord;
    };
    chord.sortGroups = function(x) {
      if (!arguments.length) return sortGroups;
      sortGroups = x;
      chords = groups = null;
      return chord;
    };
    chord.sortSubgroups = function(x) {
      if (!arguments.length) return sortSubgroups;
      sortSubgroups = x;
      chords = null;
      return chord;
    };
    chord.sortChords = function(x) {
      if (!arguments.length) return sortChords;
      sortChords = x;
      if (chords) resort();
      return chord;
    };
    chord.chords = function() {
      if (!chords) relayout();
      return chords;
    };
    chord.groups = function() {
      if (!groups) relayout();
      return groups;
    };
    return chord;
  };
  d3.layout.force = function() {
    var force = {}, event = d3.dispatch("start", "tick", "end"), size = [ 1, 1 ], drag, alpha, friction = .9, linkDistance = d3_layout_forceLinkDistance, linkStrength = d3_layout_forceLinkStrength, charge = -30, chargeDistance2 = d3_layout_forceChargeDistance2, gravity = .1, theta2 = .64, nodes = [], links = [], distances, strengths, charges;
    function repulse(node) {
      return function(quad, x1, _, x2) {
        if (quad.point !== node) {
          var dx = quad.cx - node.x, dy = quad.cy - node.y, dw = x2 - x1, dn = dx * dx + dy * dy;
          if (dw * dw / theta2 < dn) {
            if (dn < chargeDistance2) {
              var k = quad.charge / dn;
              node.px -= dx * k;
              node.py -= dy * k;
            }
            return true;
          }
          if (quad.point && dn && dn < chargeDistance2) {
            var k = quad.pointCharge / dn;
            node.px -= dx * k;
            node.py -= dy * k;
          }
        }
        return !quad.charge;
      };
    }
    force.tick = function() {
      if ((alpha *= .99) < .005) {
        event.end({
          type: "end",
          alpha: alpha = 0
        });
        return true;
      }
      var n = nodes.length, m = links.length, q, i, o, s, t, l, k, x, y;
      for (i = 0; i < m; ++i) {
        o = links[i];
        s = o.source;
        t = o.target;
        x = t.x - s.x;
        y = t.y - s.y;
        if (l = x * x + y * y) {
          l = alpha * strengths[i] * ((l = Math.sqrt(l)) - distances[i]) / l;
          x *= l;
          y *= l;
          t.x -= x * (k = s.weight / (t.weight + s.weight));
          t.y -= y * k;
          s.x += x * (k = 1 - k);
          s.y += y * k;
        }
      }
      if (k = alpha * gravity) {
        x = size[0] / 2;
        y = size[1] / 2;
        i = -1;
        if (k) while (++i < n) {
          o = nodes[i];
          o.x += (x - o.x) * k;
          o.y += (y - o.y) * k;
        }
      }
      if (charge) {
        d3_layout_forceAccumulate(q = d3.geom.quadtree(nodes), alpha, charges);
        i = -1;
        while (++i < n) {
          if (!(o = nodes[i]).fixed) {
            q.visit(repulse(o));
          }
        }
      }
      i = -1;
      while (++i < n) {
        o = nodes[i];
        if (o.fixed) {
          o.x = o.px;
          o.y = o.py;
        } else {
          o.x -= (o.px - (o.px = o.x)) * friction;
          o.y -= (o.py - (o.py = o.y)) * friction;
        }
      }
      event.tick({
        type: "tick",
        alpha: alpha
      });
    };
    force.nodes = function(x) {
      if (!arguments.length) return nodes;
      nodes = x;
      return force;
    };
    force.links = function(x) {
      if (!arguments.length) return links;
      links = x;
      return force;
    };
    force.size = function(x) {
      if (!arguments.length) return size;
      size = x;
      return force;
    };
    force.linkDistance = function(x) {
      if (!arguments.length) return linkDistance;
      linkDistance = typeof x === "function" ? x : +x;
      return force;
    };
    force.distance = force.linkDistance;
    force.linkStrength = function(x) {
      if (!arguments.length) return linkStrength;
      linkStrength = typeof x === "function" ? x : +x;
      return force;
    };
    force.friction = function(x) {
      if (!arguments.length) return friction;
      friction = +x;
      return force;
    };
    force.charge = function(x) {
      if (!arguments.length) return charge;
      charge = typeof x === "function" ? x : +x;
      return force;
    };
    force.chargeDistance = function(x) {
      if (!arguments.length) return Math.sqrt(chargeDistance2);
      chargeDistance2 = x * x;
      return force;
    };
    force.gravity = function(x) {
      if (!arguments.length) return gravity;
      gravity = +x;
      return force;
    };
    force.theta = function(x) {
      if (!arguments.length) return Math.sqrt(theta2);
      theta2 = x * x;
      return force;
    };
    force.alpha = function(x) {
      if (!arguments.length) return alpha;
      x = +x;
      if (alpha) {
        if (x > 0) alpha = x; else alpha = 0;
      } else if (x > 0) {
        event.start({
          type: "start",
          alpha: alpha = x
        });
        d3.timer(force.tick);
      }
      return force;
    };
    force.start = function() {
      var i, n = nodes.length, m = links.length, w = size[0], h = size[1], neighbors, o;
      for (i = 0; i < n; ++i) {
        (o = nodes[i]).index = i;
        o.weight = 0;
      }
      for (i = 0; i < m; ++i) {
        o = links[i];
        if (typeof o.source == "number") o.source = nodes[o.source];
        if (typeof o.target == "number") o.target = nodes[o.target];
        ++o.source.weight;
        ++o.target.weight;
      }
      for (i = 0; i < n; ++i) {
        o = nodes[i];
        if (isNaN(o.x)) o.x = position("x", w);
        if (isNaN(o.y)) o.y = position("y", h);
        if (isNaN(o.px)) o.px = o.x;
        if (isNaN(o.py)) o.py = o.y;
      }
      distances = [];
      if (typeof linkDistance === "function") for (i = 0; i < m; ++i) distances[i] = +linkDistance.call(this, links[i], i); else for (i = 0; i < m; ++i) distances[i] = linkDistance;
      strengths = [];
      if (typeof linkStrength === "function") for (i = 0; i < m; ++i) strengths[i] = +linkStrength.call(this, links[i], i); else for (i = 0; i < m; ++i) strengths[i] = linkStrength;
      charges = [];
      if (typeof charge === "function") for (i = 0; i < n; ++i) charges[i] = +charge.call(this, nodes[i], i); else for (i = 0; i < n; ++i) charges[i] = charge;
      function position(dimension, size) {
        if (!neighbors) {
          neighbors = new Array(n);
          for (j = 0; j < n; ++j) {
            neighbors[j] = [];
          }
          for (j = 0; j < m; ++j) {
            var o = links[j];
            neighbors[o.source.index].push(o.target);
            neighbors[o.target.index].push(o.source);
          }
        }
        var candidates = neighbors[i], j = -1, l = candidates.length, x;
        while (++j < l) if (!isNaN(x = candidates[j][dimension])) return x;
        return Math.random() * size;
      }
      return force.resume();
    };
    force.resume = function() {
      return force.alpha(.1);
    };
    force.stop = function() {
      return force.alpha(0);
    };
    force.drag = function() {
      if (!drag) drag = d3.behavior.drag().origin(d3_identity).on("dragstart.force", d3_layout_forceDragstart).on("drag.force", dragmove).on("dragend.force", d3_layout_forceDragend);
      if (!arguments.length) return drag;
      this.on("mouseover.force", d3_layout_forceMouseover).on("mouseout.force", d3_layout_forceMouseout).call(drag);
    };
    function dragmove(d) {
      d.px = d3.event.x, d.py = d3.event.y;
      force.resume();
    }
    return d3.rebind(force, event, "on");
  };
  function d3_layout_forceDragstart(d) {
    d.fixed |= 2;
  }
  function d3_layout_forceDragend(d) {
    d.fixed &= ~6;
  }
  function d3_layout_forceMouseover(d) {
    d.fixed |= 4;
    d.px = d.x, d.py = d.y;
  }
  function d3_layout_forceMouseout(d) {
    d.fixed &= ~4;
  }
  function d3_layout_forceAccumulate(quad, alpha, charges) {
    var cx = 0, cy = 0;
    quad.charge = 0;
    if (!quad.leaf) {
      var nodes = quad.nodes, n = nodes.length, i = -1, c;
      while (++i < n) {
        c = nodes[i];
        if (c == null) continue;
        d3_layout_forceAccumulate(c, alpha, charges);
        quad.charge += c.charge;
        cx += c.charge * c.cx;
        cy += c.charge * c.cy;
      }
    }
    if (quad.point) {
      if (!quad.leaf) {
        quad.point.x += Math.random() - .5;
        quad.point.y += Math.random() - .5;
      }
      var k = alpha * charges[quad.point.index];
      quad.charge += quad.pointCharge = k;
      cx += k * quad.point.x;
      cy += k * quad.point.y;
    }
    quad.cx = cx / quad.charge;
    quad.cy = cy / quad.charge;
  }
  var d3_layout_forceLinkDistance = 20, d3_layout_forceLinkStrength = 1, d3_layout_forceChargeDistance2 = Infinity;
  d3.layout.hierarchy = function() {
    var sort = d3_layout_hierarchySort, children = d3_layout_hierarchyChildren, value = d3_layout_hierarchyValue;
    function hierarchy(root) {
      var stack = [ root ], nodes = [], node;
      root.depth = 0;
      while ((node = stack.pop()) != null) {
        nodes.push(node);
        if ((childs = children.call(hierarchy, node, node.depth)) && (n = childs.length)) {
          var n, childs, child;
          while (--n >= 0) {
            stack.push(child = childs[n]);
            child.parent = node;
            child.depth = node.depth + 1;
          }
          if (value) node.value = 0;
          node.children = childs;
        } else {
          if (value) node.value = +value.call(hierarchy, node, node.depth) || 0;
          delete node.children;
        }
      }
      d3_layout_hierarchyVisitAfter(root, function(node) {
        var childs, parent;
        if (sort && (childs = node.children)) childs.sort(sort);
        if (value && (parent = node.parent)) parent.value += node.value;
      });
      return nodes;
    }
    hierarchy.sort = function(x) {
      if (!arguments.length) return sort;
      sort = x;
      return hierarchy;
    };
    hierarchy.children = function(x) {
      if (!arguments.length) return children;
      children = x;
      return hierarchy;
    };
    hierarchy.value = function(x) {
      if (!arguments.length) return value;
      value = x;
      return hierarchy;
    };
    hierarchy.revalue = function(root) {
      if (value) {
        d3_layout_hierarchyVisitBefore(root, function(node) {
          if (node.children) node.value = 0;
        });
        d3_layout_hierarchyVisitAfter(root, function(node) {
          var parent;
          if (!node.children) node.value = +value.call(hierarchy, node, node.depth) || 0;
          if (parent = node.parent) parent.value += node.value;
        });
      }
      return root;
    };
    return hierarchy;
  };
  function d3_layout_hierarchyRebind(object, hierarchy) {
    d3.rebind(object, hierarchy, "sort", "children", "value");
    object.nodes = object;
    object.links = d3_layout_hierarchyLinks;
    return object;
  }
  function d3_layout_hierarchyVisitBefore(node, callback) {
    var nodes = [ node ];
    while ((node = nodes.pop()) != null) {
      callback(node);
      if ((children = node.children) && (n = children.length)) {
        var n, children;
        while (--n >= 0) nodes.push(children[n]);
      }
    }
  }
  function d3_layout_hierarchyVisitAfter(node, callback) {
    var nodes = [ node ], nodes2 = [];
    while ((node = nodes.pop()) != null) {
      nodes2.push(node);
      if ((children = node.children) && (n = children.length)) {
        var i = -1, n, children;
        while (++i < n) nodes.push(children[i]);
      }
    }
    while ((node = nodes2.pop()) != null) {
      callback(node);
    }
  }
  function d3_layout_hierarchyChildren(d) {
    return d.children;
  }
  function d3_layout_hierarchyValue(d) {
    return d.value;
  }
  function d3_layout_hierarchySort(a, b) {
    return b.value - a.value;
  }
  function d3_layout_hierarchyLinks(nodes) {
    return d3.merge(nodes.map(function(parent) {
      return (parent.children || []).map(function(child) {
        return {
          source: parent,
          target: child
        };
      });
    }));
  }
  d3.layout.partition = function() {
    var hierarchy = d3.layout.hierarchy(), size = [ 1, 1 ];
    function position(node, x, dx, dy) {
      var children = node.children;
      node.x = x;
      node.y = node.depth * dy;
      node.dx = dx;
      node.dy = dy;
      if (children && (n = children.length)) {
        var i = -1, n, c, d;
        dx = node.value ? dx / node.value : 0;
        while (++i < n) {
          position(c = children[i], x, d = c.value * dx, dy);
          x += d;
        }
      }
    }
    function depth(node) {
      var children = node.children, d = 0;
      if (children && (n = children.length)) {
        var i = -1, n;
        while (++i < n) d = Math.max(d, depth(children[i]));
      }
      return 1 + d;
    }
    function partition(d, i) {
      var nodes = hierarchy.call(this, d, i);
      position(nodes[0], 0, size[0], size[1] / depth(nodes[0]));
      return nodes;
    }
    partition.size = function(x) {
      if (!arguments.length) return size;
      size = x;
      return partition;
    };
    return d3_layout_hierarchyRebind(partition, hierarchy);
  };
  d3.layout.pie = function() {
    var value = Number, sort = d3_layout_pieSortByValue, startAngle = 0, endAngle = τ, padAngle = 0;
    function pie(data) {
      var n = data.length, values = data.map(function(d, i) {
        return +value.call(pie, d, i);
      }), a = +(typeof startAngle === "function" ? startAngle.apply(this, arguments) : startAngle), da = (typeof endAngle === "function" ? endAngle.apply(this, arguments) : endAngle) - a, p = Math.min(Math.abs(da) / n, +(typeof padAngle === "function" ? padAngle.apply(this, arguments) : padAngle)), pa = p * (da < 0 ? -1 : 1), k = (da - n * pa) / d3.sum(values), index = d3.range(n), arcs = [], v;
      if (sort != null) index.sort(sort === d3_layout_pieSortByValue ? function(i, j) {
        return values[j] - values[i];
      } : function(i, j) {
        return sort(data[i], data[j]);
      });
      index.forEach(function(i) {
        arcs[i] = {
          data: data[i],
          value: v = values[i],
          startAngle: a,
          endAngle: a += v * k + pa,
          padAngle: p
        };
      });
      return arcs;
    }
    pie.value = function(_) {
      if (!arguments.length) return value;
      value = _;
      return pie;
    };
    pie.sort = function(_) {
      if (!arguments.length) return sort;
      sort = _;
      return pie;
    };
    pie.startAngle = function(_) {
      if (!arguments.length) return startAngle;
      startAngle = _;
      return pie;
    };
    pie.endAngle = function(_) {
      if (!arguments.length) return endAngle;
      endAngle = _;
      return pie;
    };
    pie.padAngle = function(_) {
      if (!arguments.length) return padAngle;
      padAngle = _;
      return pie;
    };
    return pie;
  };
  var d3_layout_pieSortByValue = {};
  d3.layout.stack = function() {
    var values = d3_identity, order = d3_layout_stackOrderDefault, offset = d3_layout_stackOffsetZero, out = d3_layout_stackOut, x = d3_layout_stackX, y = d3_layout_stackY;
    function stack(data, index) {
      if (!(n = data.length)) return data;
      var series = data.map(function(d, i) {
        return values.call(stack, d, i);
      });
      var points = series.map(function(d) {
        return d.map(function(v, i) {
          return [ x.call(stack, v, i), y.call(stack, v, i) ];
        });
      });
      var orders = order.call(stack, points, index);
      series = d3.permute(series, orders);
      points = d3.permute(points, orders);
      var offsets = offset.call(stack, points, index);
      var m = series[0].length, n, i, j, o;
      for (j = 0; j < m; ++j) {
        out.call(stack, series[0][j], o = offsets[j], points[0][j][1]);
        for (i = 1; i < n; ++i) {
          out.call(stack, series[i][j], o += points[i - 1][j][1], points[i][j][1]);
        }
      }
      return data;
    }
    stack.values = function(x) {
      if (!arguments.length) return values;
      values = x;
      return stack;
    };
    stack.order = function(x) {
      if (!arguments.length) return order;
      order = typeof x === "function" ? x : d3_layout_stackOrders.get(x) || d3_layout_stackOrderDefault;
      return stack;
    };
    stack.offset = function(x) {
      if (!arguments.length) return offset;
      offset = typeof x === "function" ? x : d3_layout_stackOffsets.get(x) || d3_layout_stackOffsetZero;
      return stack;
    };
    stack.x = function(z) {
      if (!arguments.length) return x;
      x = z;
      return stack;
    };
    stack.y = function(z) {
      if (!arguments.length) return y;
      y = z;
      return stack;
    };
    stack.out = function(z) {
      if (!arguments.length) return out;
      out = z;
      return stack;
    };
    return stack;
  };
  function d3_layout_stackX(d) {
    return d.x;
  }
  function d3_layout_stackY(d) {
    return d.y;
  }
  function d3_layout_stackOut(d, y0, y) {
    d.y0 = y0;
    d.y = y;
  }
  var d3_layout_stackOrders = d3.map({
    "inside-out": function(data) {
      var n = data.length, i, j, max = data.map(d3_layout_stackMaxIndex), sums = data.map(d3_layout_stackReduceSum), index = d3.range(n).sort(function(a, b) {
        return max[a] - max[b];
      }), top = 0, bottom = 0, tops = [], bottoms = [];
      for (i = 0; i < n; ++i) {
        j = index[i];
        if (top < bottom) {
          top += sums[j];
          tops.push(j);
        } else {
          bottom += sums[j];
          bottoms.push(j);
        }
      }
      return bottoms.reverse().concat(tops);
    },
    reverse: function(data) {
      return d3.range(data.length).reverse();
    },
    "default": d3_layout_stackOrderDefault
  });
  var d3_layout_stackOffsets = d3.map({
    silhouette: function(data) {
      var n = data.length, m = data[0].length, sums = [], max = 0, i, j, o, y0 = [];
      for (j = 0; j < m; ++j) {
        for (i = 0, o = 0; i < n; i++) o += data[i][j][1];
        if (o > max) max = o;
        sums.push(o);
      }
      for (j = 0; j < m; ++j) {
        y0[j] = (max - sums[j]) / 2;
      }
      return y0;
    },
    wiggle: function(data) {
      var n = data.length, x = data[0], m = x.length, i, j, k, s1, s2, s3, dx, o, o0, y0 = [];
      y0[0] = o = o0 = 0;
      for (j = 1; j < m; ++j) {
        for (i = 0, s1 = 0; i < n; ++i) s1 += data[i][j][1];
        for (i = 0, s2 = 0, dx = x[j][0] - x[j - 1][0]; i < n; ++i) {
          for (k = 0, s3 = (data[i][j][1] - data[i][j - 1][1]) / (2 * dx); k < i; ++k) {
            s3 += (data[k][j][1] - data[k][j - 1][1]) / dx;
          }
          s2 += s3 * data[i][j][1];
        }
        y0[j] = o -= s1 ? s2 / s1 * dx : 0;
        if (o < o0) o0 = o;
      }
      for (j = 0; j < m; ++j) y0[j] -= o0;
      return y0;
    },
    expand: function(data) {
      var n = data.length, m = data[0].length, k = 1 / n, i, j, o, y0 = [];
      for (j = 0; j < m; ++j) {
        for (i = 0, o = 0; i < n; i++) o += data[i][j][1];
        if (o) for (i = 0; i < n; i++) data[i][j][1] /= o; else for (i = 0; i < n; i++) data[i][j][1] = k;
      }
      for (j = 0; j < m; ++j) y0[j] = 0;
      return y0;
    },
    zero: d3_layout_stackOffsetZero
  });
  function d3_layout_stackOrderDefault(data) {
    return d3.range(data.length);
  }
  function d3_layout_stackOffsetZero(data) {
    var j = -1, m = data[0].length, y0 = [];
    while (++j < m) y0[j] = 0;
    return y0;
  }
  function d3_layout_stackMaxIndex(array) {
    var i = 1, j = 0, v = array[0][1], k, n = array.length;
    for (;i < n; ++i) {
      if ((k = array[i][1]) > v) {
        j = i;
        v = k;
      }
    }
    return j;
  }
  function d3_layout_stackReduceSum(d) {
    return d.reduce(d3_layout_stackSum, 0);
  }
  function d3_layout_stackSum(p, d) {
    return p + d[1];
  }
  d3.layout.histogram = function() {
    var frequency = true, valuer = Number, ranger = d3_layout_histogramRange, binner = d3_layout_histogramBinSturges;
    function histogram(data, i) {
      var bins = [], values = data.map(valuer, this), range = ranger.call(this, values, i), thresholds = binner.call(this, range, values, i), bin, i = -1, n = values.length, m = thresholds.length - 1, k = frequency ? 1 : 1 / n, x;
      while (++i < m) {
        bin = bins[i] = [];
        bin.dx = thresholds[i + 1] - (bin.x = thresholds[i]);
        bin.y = 0;
      }
      if (m > 0) {
        i = -1;
        while (++i < n) {
          x = values[i];
          if (x >= range[0] && x <= range[1]) {
            bin = bins[d3.bisect(thresholds, x, 1, m) - 1];
            bin.y += k;
            bin.push(data[i]);
          }
        }
      }
      return bins;
    }
    histogram.value = function(x) {
      if (!arguments.length) return valuer;
      valuer = x;
      return histogram;
    };
    histogram.range = function(x) {
      if (!arguments.length) return ranger;
      ranger = d3_functor(x);
      return histogram;
    };
    histogram.bins = function(x) {
      if (!arguments.length) return binner;
      binner = typeof x === "number" ? function(range) {
        return d3_layout_histogramBinFixed(range, x);
      } : d3_functor(x);
      return histogram;
    };
    histogram.frequency = function(x) {
      if (!arguments.length) return frequency;
      frequency = !!x;
      return histogram;
    };
    return histogram;
  };
  function d3_layout_histogramBinSturges(range, values) {
    return d3_layout_histogramBinFixed(range, Math.ceil(Math.log(values.length) / Math.LN2 + 1));
  }
  function d3_layout_histogramBinFixed(range, n) {
    var x = -1, b = +range[0], m = (range[1] - b) / n, f = [];
    while (++x <= n) f[x] = m * x + b;
    return f;
  }
  function d3_layout_histogramRange(values) {
    return [ d3.min(values), d3.max(values) ];
  }
  d3.layout.pack = function() {
    var hierarchy = d3.layout.hierarchy().sort(d3_layout_packSort), padding = 0, size = [ 1, 1 ], radius;
    function pack(d, i) {
      var nodes = hierarchy.call(this, d, i), root = nodes[0], w = size[0], h = size[1], r = radius == null ? Math.sqrt : typeof radius === "function" ? radius : function() {
        return radius;
      };
      root.x = root.y = 0;
      d3_layout_hierarchyVisitAfter(root, function(d) {
        d.r = +r(d.value);
      });
      d3_layout_hierarchyVisitAfter(root, d3_layout_packSiblings);
      if (padding) {
        var dr = padding * (radius ? 1 : Math.max(2 * root.r / w, 2 * root.r / h)) / 2;
        d3_layout_hierarchyVisitAfter(root, function(d) {
          d.r += dr;
        });
        d3_layout_hierarchyVisitAfter(root, d3_layout_packSiblings);
        d3_layout_hierarchyVisitAfter(root, function(d) {
          d.r -= dr;
        });
      }
      d3_layout_packTransform(root, w / 2, h / 2, radius ? 1 : 1 / Math.max(2 * root.r / w, 2 * root.r / h));
      return nodes;
    }
    pack.size = function(_) {
      if (!arguments.length) return size;
      size = _;
      return pack;
    };
    pack.radius = function(_) {
      if (!arguments.length) return radius;
      radius = _ == null || typeof _ === "function" ? _ : +_;
      return pack;
    };
    pack.padding = function(_) {
      if (!arguments.length) return padding;
      padding = +_;
      return pack;
    };
    return d3_layout_hierarchyRebind(pack, hierarchy);
  };
  function d3_layout_packSort(a, b) {
    return a.value - b.value;
  }
  function d3_layout_packInsert(a, b) {
    var c = a._pack_next;
    a._pack_next = b;
    b._pack_prev = a;
    b._pack_next = c;
    c._pack_prev = b;
  }
  function d3_layout_packSplice(a, b) {
    a._pack_next = b;
    b._pack_prev = a;
  }
  function d3_layout_packIntersects(a, b) {
    var dx = b.x - a.x, dy = b.y - a.y, dr = a.r + b.r;
    return .999 * dr * dr > dx * dx + dy * dy;
  }
  function d3_layout_packSiblings(node) {
    if (!(nodes = node.children) || !(n = nodes.length)) return;
    var nodes, xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity, a, b, c, i, j, k, n;
    function bound(node) {
      xMin = Math.min(node.x - node.r, xMin);
      xMax = Math.max(node.x + node.r, xMax);
      yMin = Math.min(node.y - node.r, yMin);
      yMax = Math.max(node.y + node.r, yMax);
    }
    nodes.forEach(d3_layout_packLink);
    a = nodes[0];
    a.x = -a.r;
    a.y = 0;
    bound(a);
    if (n > 1) {
      b = nodes[1];
      b.x = b.r;
      b.y = 0;
      bound(b);
      if (n > 2) {
        c = nodes[2];
        d3_layout_packPlace(a, b, c);
        bound(c);
        d3_layout_packInsert(a, c);
        a._pack_prev = c;
        d3_layout_packInsert(c, b);
        b = a._pack_next;
        for (i = 3; i < n; i++) {
          d3_layout_packPlace(a, b, c = nodes[i]);
          var isect = 0, s1 = 1, s2 = 1;
          for (j = b._pack_next; j !== b; j = j._pack_next, s1++) {
            if (d3_layout_packIntersects(j, c)) {
              isect = 1;
              break;
            }
          }
          if (isect == 1) {
            for (k = a._pack_prev; k !== j._pack_prev; k = k._pack_prev, s2++) {
              if (d3_layout_packIntersects(k, c)) {
                break;
              }
            }
          }
          if (isect) {
            if (s1 < s2 || s1 == s2 && b.r < a.r) d3_layout_packSplice(a, b = j); else d3_layout_packSplice(a = k, b);
            i--;
          } else {
            d3_layout_packInsert(a, c);
            b = c;
            bound(c);
          }
        }
      }
    }
    var cx = (xMin + xMax) / 2, cy = (yMin + yMax) / 2, cr = 0;
    for (i = 0; i < n; i++) {
      c = nodes[i];
      c.x -= cx;
      c.y -= cy;
      cr = Math.max(cr, c.r + Math.sqrt(c.x * c.x + c.y * c.y));
    }
    node.r = cr;
    nodes.forEach(d3_layout_packUnlink);
  }
  function d3_layout_packLink(node) {
    node._pack_next = node._pack_prev = node;
  }
  function d3_layout_packUnlink(node) {
    delete node._pack_next;
    delete node._pack_prev;
  }
  function d3_layout_packTransform(node, x, y, k) {
    var children = node.children;
    node.x = x += k * node.x;
    node.y = y += k * node.y;
    node.r *= k;
    if (children) {
      var i = -1, n = children.length;
      while (++i < n) d3_layout_packTransform(children[i], x, y, k);
    }
  }
  function d3_layout_packPlace(a, b, c) {
    var db = a.r + c.r, dx = b.x - a.x, dy = b.y - a.y;
    if (db && (dx || dy)) {
      var da = b.r + c.r, dc = dx * dx + dy * dy;
      da *= da;
      db *= db;
      var x = .5 + (db - da) / (2 * dc), y = Math.sqrt(Math.max(0, 2 * da * (db + dc) - (db -= dc) * db - da * da)) / (2 * dc);
      c.x = a.x + x * dx + y * dy;
      c.y = a.y + x * dy - y * dx;
    } else {
      c.x = a.x + db;
      c.y = a.y;
    }
  }
  d3.layout.tree = function() {
    var hierarchy = d3.layout.hierarchy().sort(null).value(null), separation = d3_layout_treeSeparation, size = [ 1, 1 ], nodeSize = null;
    function tree(d, i) {
      var nodes = hierarchy.call(this, d, i), root0 = nodes[0], root1 = wrapTree(root0);
      d3_layout_hierarchyVisitAfter(root1, firstWalk), root1.parent.m = -root1.z;
      d3_layout_hierarchyVisitBefore(root1, secondWalk);
      if (nodeSize) d3_layout_hierarchyVisitBefore(root0, sizeNode); else {
        var left = root0, right = root0, bottom = root0;
        d3_layout_hierarchyVisitBefore(root0, function(node) {
          if (node.x < left.x) left = node;
          if (node.x > right.x) right = node;
          if (node.depth > bottom.depth) bottom = node;
        });
        var tx = separation(left, right) / 2 - left.x, kx = size[0] / (right.x + separation(right, left) / 2 + tx), ky = size[1] / (bottom.depth || 1);
        d3_layout_hierarchyVisitBefore(root0, function(node) {
          node.x = (node.x + tx) * kx;
          node.y = node.depth * ky;
        });
      }
      return nodes;
    }
    function wrapTree(root0) {
      var root1 = {
        A: null,
        children: [ root0 ]
      }, queue = [ root1 ], node1;
      while ((node1 = queue.pop()) != null) {
        for (var children = node1.children, child, i = 0, n = children.length; i < n; ++i) {
          queue.push((children[i] = child = {
            _: children[i],
            parent: node1,
            children: (child = children[i].children) && child.slice() || [],
            A: null,
            a: null,
            z: 0,
            m: 0,
            c: 0,
            s: 0,
            t: null,
            i: i
          }).a = child);
        }
      }
      return root1.children[0];
    }
    function firstWalk(v) {
      var children = v.children, siblings = v.parent.children, w = v.i ? siblings[v.i - 1] : null;
      if (children.length) {
        d3_layout_treeShift(v);
        var midpoint = (children[0].z + children[children.length - 1].z) / 2;
        if (w) {
          v.z = w.z + separation(v._, w._);
          v.m = v.z - midpoint;
        } else {
          v.z = midpoint;
        }
      } else if (w) {
        v.z = w.z + separation(v._, w._);
      }
      v.parent.A = apportion(v, w, v.parent.A || siblings[0]);
    }
    function secondWalk(v) {
      v._.x = v.z + v.parent.m;
      v.m += v.parent.m;
    }
    function apportion(v, w, ancestor) {
      if (w) {
        var vip = v, vop = v, vim = w, vom = vip.parent.children[0], sip = vip.m, sop = vop.m, sim = vim.m, som = vom.m, shift;
        while (vim = d3_layout_treeRight(vim), vip = d3_layout_treeLeft(vip), vim && vip) {
          vom = d3_layout_treeLeft(vom);
          vop = d3_layout_treeRight(vop);
          vop.a = v;
          shift = vim.z + sim - vip.z - sip + separation(vim._, vip._);
          if (shift > 0) {
            d3_layout_treeMove(d3_layout_treeAncestor(vim, v, ancestor), v, shift);
            sip += shift;
            sop += shift;
          }
          sim += vim.m;
          sip += vip.m;
          som += vom.m;
          sop += vop.m;
        }
        if (vim && !d3_layout_treeRight(vop)) {
          vop.t = vim;
          vop.m += sim - sop;
        }
        if (vip && !d3_layout_treeLeft(vom)) {
          vom.t = vip;
          vom.m += sip - som;
          ancestor = v;
        }
      }
      return ancestor;
    }
    function sizeNode(node) {
      node.x *= size[0];
      node.y = node.depth * size[1];
    }
    tree.separation = function(x) {
      if (!arguments.length) return separation;
      separation = x;
      return tree;
    };
    tree.size = function(x) {
      if (!arguments.length) return nodeSize ? null : size;
      nodeSize = (size = x) == null ? sizeNode : null;
      return tree;
    };
    tree.nodeSize = function(x) {
      if (!arguments.length) return nodeSize ? size : null;
      nodeSize = (size = x) == null ? null : sizeNode;
      return tree;
    };
    return d3_layout_hierarchyRebind(tree, hierarchy);
  };
  function d3_layout_treeSeparation(a, b) {
    return a.parent == b.parent ? 1 : 2;
  }
  function d3_layout_treeLeft(v) {
    var children = v.children;
    return children.length ? children[0] : v.t;
  }
  function d3_layout_treeRight(v) {
    var children = v.children, n;
    return (n = children.length) ? children[n - 1] : v.t;
  }
  function d3_layout_treeMove(wm, wp, shift) {
    var change = shift / (wp.i - wm.i);
    wp.c -= change;
    wp.s += shift;
    wm.c += change;
    wp.z += shift;
    wp.m += shift;
  }
  function d3_layout_treeShift(v) {
    var shift = 0, change = 0, children = v.children, i = children.length, w;
    while (--i >= 0) {
      w = children[i];
      w.z += shift;
      w.m += shift;
      shift += w.s + (change += w.c);
    }
  }
  function d3_layout_treeAncestor(vim, v, ancestor) {
    return vim.a.parent === v.parent ? vim.a : ancestor;
  }
  d3.layout.cluster = function() {
    var hierarchy = d3.layout.hierarchy().sort(null).value(null), separation = d3_layout_treeSeparation, size = [ 1, 1 ], nodeSize = false;
    function cluster(d, i) {
      var nodes = hierarchy.call(this, d, i), root = nodes[0], previousNode, x = 0;
      d3_layout_hierarchyVisitAfter(root, function(node) {
        var children = node.children;
        if (children && children.length) {
          node.x = d3_layout_clusterX(children);
          node.y = d3_layout_clusterY(children);
        } else {
          node.x = previousNode ? x += separation(node, previousNode) : 0;
          node.y = 0;
          previousNode = node;
        }
      });
      var left = d3_layout_clusterLeft(root), right = d3_layout_clusterRight(root), x0 = left.x - separation(left, right) / 2, x1 = right.x + separation(right, left) / 2;
      d3_layout_hierarchyVisitAfter(root, nodeSize ? function(node) {
        node.x = (node.x - root.x) * size[0];
        node.y = (root.y - node.y) * size[1];
      } : function(node) {
        node.x = (node.x - x0) / (x1 - x0) * size[0];
        node.y = (1 - (root.y ? node.y / root.y : 1)) * size[1];
      });
      return nodes;
    }
    cluster.separation = function(x) {
      if (!arguments.length) return separation;
      separation = x;
      return cluster;
    };
    cluster.size = function(x) {
      if (!arguments.length) return nodeSize ? null : size;
      nodeSize = (size = x) == null;
      return cluster;
    };
    cluster.nodeSize = function(x) {
      if (!arguments.length) return nodeSize ? size : null;
      nodeSize = (size = x) != null;
      return cluster;
    };
    return d3_layout_hierarchyRebind(cluster, hierarchy);
  };
  function d3_layout_clusterY(children) {
    return 1 + d3.max(children, function(child) {
      return child.y;
    });
  }
  function d3_layout_clusterX(children) {
    return children.reduce(function(x, child) {
      return x + child.x;
    }, 0) / children.length;
  }
  function d3_layout_clusterLeft(node) {
    var children = node.children;
    return children && children.length ? d3_layout_clusterLeft(children[0]) : node;
  }
  function d3_layout_clusterRight(node) {
    var children = node.children, n;
    return children && (n = children.length) ? d3_layout_clusterRight(children[n - 1]) : node;
  }
  d3.layout.treemap = function() {
    var hierarchy = d3.layout.hierarchy(), round = Math.round, size = [ 1, 1 ], padding = null, pad = d3_layout_treemapPadNull, sticky = false, stickies, mode = "squarify", ratio = .5 * (1 + Math.sqrt(5));
    function scale(children, k) {
      var i = -1, n = children.length, child, area;
      while (++i < n) {
        area = (child = children[i]).value * (k < 0 ? 0 : k);
        child.area = isNaN(area) || area <= 0 ? 0 : area;
      }
    }
    function squarify(node) {
      var children = node.children;
      if (children && children.length) {
        var rect = pad(node), row = [], remaining = children.slice(), child, best = Infinity, score, u = mode === "slice" ? rect.dx : mode === "dice" ? rect.dy : mode === "slice-dice" ? node.depth & 1 ? rect.dy : rect.dx : Math.min(rect.dx, rect.dy), n;
        scale(remaining, rect.dx * rect.dy / node.value);
        row.area = 0;
        while ((n = remaining.length) > 0) {
          row.push(child = remaining[n - 1]);
          row.area += child.area;
          if (mode !== "squarify" || (score = worst(row, u)) <= best) {
            remaining.pop();
            best = score;
          } else {
            row.area -= row.pop().area;
            position(row, u, rect, false);
            u = Math.min(rect.dx, rect.dy);
            row.length = row.area = 0;
            best = Infinity;
          }
        }
        if (row.length) {
          position(row, u, rect, true);
          row.length = row.area = 0;
        }
        children.forEach(squarify);
      }
    }
    function stickify(node) {
      var children = node.children;
      if (children && children.length) {
        var rect = pad(node), remaining = children.slice(), child, row = [];
        scale(remaining, rect.dx * rect.dy / node.value);
        row.area = 0;
        while (child = remaining.pop()) {
          row.push(child);
          row.area += child.area;
          if (child.z != null) {
            position(row, child.z ? rect.dx : rect.dy, rect, !remaining.length);
            row.length = row.area = 0;
          }
        }
        children.forEach(stickify);
      }
    }
    function worst(row, u) {
      var s = row.area, r, rmax = 0, rmin = Infinity, i = -1, n = row.length;
      while (++i < n) {
        if (!(r = row[i].area)) continue;
        if (r < rmin) rmin = r;
        if (r > rmax) rmax = r;
      }
      s *= s;
      u *= u;
      return s ? Math.max(u * rmax * ratio / s, s / (u * rmin * ratio)) : Infinity;
    }
    function position(row, u, rect, flush) {
      var i = -1, n = row.length, x = rect.x, y = rect.y, v = u ? round(row.area / u) : 0, o;
      if (u == rect.dx) {
        if (flush || v > rect.dy) v = rect.dy;
        while (++i < n) {
          o = row[i];
          o.x = x;
          o.y = y;
          o.dy = v;
          x += o.dx = Math.min(rect.x + rect.dx - x, v ? round(o.area / v) : 0);
        }
        o.z = true;
        o.dx += rect.x + rect.dx - x;
        rect.y += v;
        rect.dy -= v;
      } else {
        if (flush || v > rect.dx) v = rect.dx;
        while (++i < n) {
          o = row[i];
          o.x = x;
          o.y = y;
          o.dx = v;
          y += o.dy = Math.min(rect.y + rect.dy - y, v ? round(o.area / v) : 0);
        }
        o.z = false;
        o.dy += rect.y + rect.dy - y;
        rect.x += v;
        rect.dx -= v;
      }
    }
    function treemap(d) {
      var nodes = stickies || hierarchy(d), root = nodes[0];
      root.x = 0;
      root.y = 0;
      root.dx = size[0];
      root.dy = size[1];
      if (stickies) hierarchy.revalue(root);
      scale([ root ], root.dx * root.dy / root.value);
      (stickies ? stickify : squarify)(root);
      if (sticky) stickies = nodes;
      return nodes;
    }
    treemap.size = function(x) {
      if (!arguments.length) return size;
      size = x;
      return treemap;
    };
    treemap.padding = function(x) {
      if (!arguments.length) return padding;
      function padFunction(node) {
        var p = x.call(treemap, node, node.depth);
        return p == null ? d3_layout_treemapPadNull(node) : d3_layout_treemapPad(node, typeof p === "number" ? [ p, p, p, p ] : p);
      }
      function padConstant(node) {
        return d3_layout_treemapPad(node, x);
      }
      var type;
      pad = (padding = x) == null ? d3_layout_treemapPadNull : (type = typeof x) === "function" ? padFunction : type === "number" ? (x = [ x, x, x, x ], 
      padConstant) : padConstant;
      return treemap;
    };
    treemap.round = function(x) {
      if (!arguments.length) return round != Number;
      round = x ? Math.round : Number;
      return treemap;
    };
    treemap.sticky = function(x) {
      if (!arguments.length) return sticky;
      sticky = x;
      stickies = null;
      return treemap;
    };
    treemap.ratio = function(x) {
      if (!arguments.length) return ratio;
      ratio = x;
      return treemap;
    };
    treemap.mode = function(x) {
      if (!arguments.length) return mode;
      mode = x + "";
      return treemap;
    };
    return d3_layout_hierarchyRebind(treemap, hierarchy);
  };
  function d3_layout_treemapPadNull(node) {
    return {
      x: node.x,
      y: node.y,
      dx: node.dx,
      dy: node.dy
    };
  }
  function d3_layout_treemapPad(node, padding) {
    var x = node.x + padding[3], y = node.y + padding[0], dx = node.dx - padding[1] - padding[3], dy = node.dy - padding[0] - padding[2];
    if (dx < 0) {
      x += dx / 2;
      dx = 0;
    }
    if (dy < 0) {
      y += dy / 2;
      dy = 0;
    }
    return {
      x: x,
      y: y,
      dx: dx,
      dy: dy
    };
  }
  d3.random = {
    normal: function(µ, σ) {
      var n = arguments.length;
      if (n < 2) σ = 1;
      if (n < 1) µ = 0;
      return function() {
        var x, y, r;
        do {
          x = Math.random() * 2 - 1;
          y = Math.random() * 2 - 1;
          r = x * x + y * y;
        } while (!r || r > 1);
        return µ + σ * x * Math.sqrt(-2 * Math.log(r) / r);
      };
    },
    logNormal: function() {
      var random = d3.random.normal.apply(d3, arguments);
      return function() {
        return Math.exp(random());
      };
    },
    bates: function(m) {
      var random = d3.random.irwinHall(m);
      return function() {
        return random() / m;
      };
    },
    irwinHall: function(m) {
      return function() {
        for (var s = 0, j = 0; j < m; j++) s += Math.random();
        return s;
      };
    }
  };
  d3.scale = {};
  function d3_scaleExtent(domain) {
    var start = domain[0], stop = domain[domain.length - 1];
    return start < stop ? [ start, stop ] : [ stop, start ];
  }
  function d3_scaleRange(scale) {
    return scale.rangeExtent ? scale.rangeExtent() : d3_scaleExtent(scale.range());
  }
  function d3_scale_bilinear(domain, range, uninterpolate, interpolate) {
    var u = uninterpolate(domain[0], domain[1]), i = interpolate(range[0], range[1]);
    return function(x) {
      return i(u(x));
    };
  }
  function d3_scale_nice(domain, nice) {
    var i0 = 0, i1 = domain.length - 1, x0 = domain[i0], x1 = domain[i1], dx;
    if (x1 < x0) {
      dx = i0, i0 = i1, i1 = dx;
      dx = x0, x0 = x1, x1 = dx;
    }
    domain[i0] = nice.floor(x0);
    domain[i1] = nice.ceil(x1);
    return domain;
  }
  function d3_scale_niceStep(step) {
    return step ? {
      floor: function(x) {
        return Math.floor(x / step) * step;
      },
      ceil: function(x) {
        return Math.ceil(x / step) * step;
      }
    } : d3_scale_niceIdentity;
  }
  var d3_scale_niceIdentity = {
    floor: d3_identity,
    ceil: d3_identity
  };
  function d3_scale_polylinear(domain, range, uninterpolate, interpolate) {
    var u = [], i = [], j = 0, k = Math.min(domain.length, range.length) - 1;
    if (domain[k] < domain[0]) {
      domain = domain.slice().reverse();
      range = range.slice().reverse();
    }
    while (++j <= k) {
      u.push(uninterpolate(domain[j - 1], domain[j]));
      i.push(interpolate(range[j - 1], range[j]));
    }
    return function(x) {
      var j = d3.bisect(domain, x, 1, k) - 1;
      return i[j](u[j](x));
    };
  }
  d3.scale.linear = function() {
    return d3_scale_linear([ 0, 1 ], [ 0, 1 ], d3_interpolate, false);
  };
  function d3_scale_linear(domain, range, interpolate, clamp) {
    var output, input;
    function rescale() {
      var linear = Math.min(domain.length, range.length) > 2 ? d3_scale_polylinear : d3_scale_bilinear, uninterpolate = clamp ? d3_uninterpolateClamp : d3_uninterpolateNumber;
      output = linear(domain, range, uninterpolate, interpolate);
      input = linear(range, domain, uninterpolate, d3_interpolate);
      return scale;
    }
    function scale(x) {
      return output(x);
    }
    scale.invert = function(y) {
      return input(y);
    };
    scale.domain = function(x) {
      if (!arguments.length) return domain;
      domain = x.map(Number);
      return rescale();
    };
    scale.range = function(x) {
      if (!arguments.length) return range;
      range = x;
      return rescale();
    };
    scale.rangeRound = function(x) {
      return scale.range(x).interpolate(d3_interpolateRound);
    };
    scale.clamp = function(x) {
      if (!arguments.length) return clamp;
      clamp = x;
      return rescale();
    };
    scale.interpolate = function(x) {
      if (!arguments.length) return interpolate;
      interpolate = x;
      return rescale();
    };
    scale.ticks = function(m) {
      return d3_scale_linearTicks(domain, m);
    };
    scale.tickFormat = function(m, format) {
      return d3_scale_linearTickFormat(domain, m, format);
    };
    scale.nice = function(m) {
      d3_scale_linearNice(domain, m);
      return rescale();
    };
    scale.copy = function() {
      return d3_scale_linear(domain, range, interpolate, clamp);
    };
    return rescale();
  }
  function d3_scale_linearRebind(scale, linear) {
    return d3.rebind(scale, linear, "range", "rangeRound", "interpolate", "clamp");
  }
  function d3_scale_linearNice(domain, m) {
    return d3_scale_nice(domain, d3_scale_niceStep(d3_scale_linearTickRange(domain, m)[2]));
  }
  function d3_scale_linearTickRange(domain, m) {
    if (m == null) m = 10;
    var extent = d3_scaleExtent(domain), span = extent[1] - extent[0], step = Math.pow(10, Math.floor(Math.log(span / m) / Math.LN10)), err = m / span * step;
    if (err <= .15) step *= 10; else if (err <= .35) step *= 5; else if (err <= .75) step *= 2;
    extent[0] = Math.ceil(extent[0] / step) * step;
    extent[1] = Math.floor(extent[1] / step) * step + step * .5;
    extent[2] = step;
    return extent;
  }
  function d3_scale_linearTicks(domain, m) {
    return d3.range.apply(d3, d3_scale_linearTickRange(domain, m));
  }
  function d3_scale_linearTickFormat(domain, m, format) {
    var range = d3_scale_linearTickRange(domain, m);
    if (format) {
      var match = d3_format_re.exec(format);
      match.shift();
      if (match[8] === "s") {
        var prefix = d3.formatPrefix(Math.max(abs(range[0]), abs(range[1])));
        if (!match[7]) match[7] = "." + d3_scale_linearPrecision(prefix.scale(range[2]));
        match[8] = "f";
        format = d3.format(match.join(""));
        return function(d) {
          return format(prefix.scale(d)) + prefix.symbol;
        };
      }
      if (!match[7]) match[7] = "." + d3_scale_linearFormatPrecision(match[8], range);
      format = match.join("");
    } else {
      format = ",." + d3_scale_linearPrecision(range[2]) + "f";
    }
    return d3.format(format);
  }
  var d3_scale_linearFormatSignificant = {
    s: 1,
    g: 1,
    p: 1,
    r: 1,
    e: 1
  };
  function d3_scale_linearPrecision(value) {
    return -Math.floor(Math.log(value) / Math.LN10 + .01);
  }
  function d3_scale_linearFormatPrecision(type, range) {
    var p = d3_scale_linearPrecision(range[2]);
    return type in d3_scale_linearFormatSignificant ? Math.abs(p - d3_scale_linearPrecision(Math.max(abs(range[0]), abs(range[1])))) + +(type !== "e") : p - (type === "%") * 2;
  }
  d3.scale.log = function() {
    return d3_scale_log(d3.scale.linear().domain([ 0, 1 ]), 10, true, [ 1, 10 ]);
  };
  function d3_scale_log(linear, base, positive, domain) {
    function log(x) {
      return (positive ? Math.log(x < 0 ? 0 : x) : -Math.log(x > 0 ? 0 : -x)) / Math.log(base);
    }
    function pow(x) {
      return positive ? Math.pow(base, x) : -Math.pow(base, -x);
    }
    function scale(x) {
      return linear(log(x));
    }
    scale.invert = function(x) {
      return pow(linear.invert(x));
    };
    scale.domain = function(x) {
      if (!arguments.length) return domain;
      positive = x[0] >= 0;
      linear.domain((domain = x.map(Number)).map(log));
      return scale;
    };
    scale.base = function(_) {
      if (!arguments.length) return base;
      base = +_;
      linear.domain(domain.map(log));
      return scale;
    };
    scale.nice = function() {
      var niced = d3_scale_nice(domain.map(log), positive ? Math : d3_scale_logNiceNegative);
      linear.domain(niced);
      domain = niced.map(pow);
      return scale;
    };
    scale.ticks = function() {
      var extent = d3_scaleExtent(domain), ticks = [], u = extent[0], v = extent[1], i = Math.floor(log(u)), j = Math.ceil(log(v)), n = base % 1 ? 2 : base;
      if (isFinite(j - i)) {
        if (positive) {
          for (;i < j; i++) for (var k = 1; k < n; k++) ticks.push(pow(i) * k);
          ticks.push(pow(i));
        } else {
          ticks.push(pow(i));
          for (;i++ < j; ) for (var k = n - 1; k > 0; k--) ticks.push(pow(i) * k);
        }
        for (i = 0; ticks[i] < u; i++) {}
        for (j = ticks.length; ticks[j - 1] > v; j--) {}
        ticks = ticks.slice(i, j);
      }
      return ticks;
    };
    scale.tickFormat = function(n, format) {
      if (!arguments.length) return d3_scale_logFormat;
      if (arguments.length < 2) format = d3_scale_logFormat; else if (typeof format !== "function") format = d3.format(format);
      var k = Math.max(.1, n / scale.ticks().length), f = positive ? (e = 1e-12, Math.ceil) : (e = -1e-12, 
      Math.floor), e;
      return function(d) {
        return d / pow(f(log(d) + e)) <= k ? format(d) : "";
      };
    };
    scale.copy = function() {
      return d3_scale_log(linear.copy(), base, positive, domain);
    };
    return d3_scale_linearRebind(scale, linear);
  }
  var d3_scale_logFormat = d3.format(".0e"), d3_scale_logNiceNegative = {
    floor: function(x) {
      return -Math.ceil(-x);
    },
    ceil: function(x) {
      return -Math.floor(-x);
    }
  };
  d3.scale.pow = function() {
    return d3_scale_pow(d3.scale.linear(), 1, [ 0, 1 ]);
  };
  function d3_scale_pow(linear, exponent, domain) {
    var powp = d3_scale_powPow(exponent), powb = d3_scale_powPow(1 / exponent);
    function scale(x) {
      return linear(powp(x));
    }
    scale.invert = function(x) {
      return powb(linear.invert(x));
    };
    scale.domain = function(x) {
      if (!arguments.length) return domain;
      linear.domain((domain = x.map(Number)).map(powp));
      return scale;
    };
    scale.ticks = function(m) {
      return d3_scale_linearTicks(domain, m);
    };
    scale.tickFormat = function(m, format) {
      return d3_scale_linearTickFormat(domain, m, format);
    };
    scale.nice = function(m) {
      return scale.domain(d3_scale_linearNice(domain, m));
    };
    scale.exponent = function(x) {
      if (!arguments.length) return exponent;
      powp = d3_scale_powPow(exponent = x);
      powb = d3_scale_powPow(1 / exponent);
      linear.domain(domain.map(powp));
      return scale;
    };
    scale.copy = function() {
      return d3_scale_pow(linear.copy(), exponent, domain);
    };
    return d3_scale_linearRebind(scale, linear);
  }
  function d3_scale_powPow(e) {
    return function(x) {
      return x < 0 ? -Math.pow(-x, e) : Math.pow(x, e);
    };
  }
  d3.scale.sqrt = function() {
    return d3.scale.pow().exponent(.5);
  };
  d3.scale.ordinal = function() {
    return d3_scale_ordinal([], {
      t: "range",
      a: [ [] ]
    });
  };
  function d3_scale_ordinal(domain, ranger) {
    var index, range, rangeBand;
    function scale(x) {
      return range[((index.get(x) || (ranger.t === "range" ? index.set(x, domain.push(x)) : NaN)) - 1) % range.length];
    }
    function steps(start, step) {
      return d3.range(domain.length).map(function(i) {
        return start + step * i;
      });
    }
    scale.domain = function(x) {
      if (!arguments.length) return domain;
      domain = [];
      index = new d3_Map();
      var i = -1, n = x.length, xi;
      while (++i < n) if (!index.has(xi = x[i])) index.set(xi, domain.push(xi));
      return scale[ranger.t].apply(scale, ranger.a);
    };
    scale.range = function(x) {
      if (!arguments.length) return range;
      range = x;
      rangeBand = 0;
      ranger = {
        t: "range",
        a: arguments
      };
      return scale;
    };
    scale.rangePoints = function(x, padding) {
      if (arguments.length < 2) padding = 0;
      var start = x[0], stop = x[1], step = domain.length < 2 ? (start = (start + stop) / 2, 
      0) : (stop - start) / (domain.length - 1 + padding);
      range = steps(start + step * padding / 2, step);
      rangeBand = 0;
      ranger = {
        t: "rangePoints",
        a: arguments
      };
      return scale;
    };
    scale.rangeRoundPoints = function(x, padding) {
      if (arguments.length < 2) padding = 0;
      var start = x[0], stop = x[1], step = domain.length < 2 ? (start = stop = Math.round((start + stop) / 2), 
      0) : (stop - start) / (domain.length - 1 + padding) | 0;
      range = steps(start + Math.round(step * padding / 2 + (stop - start - (domain.length - 1 + padding) * step) / 2), step);
      rangeBand = 0;
      ranger = {
        t: "rangeRoundPoints",
        a: arguments
      };
      return scale;
    };
    scale.rangeBands = function(x, padding, outerPadding) {
      if (arguments.length < 2) padding = 0;
      if (arguments.length < 3) outerPadding = padding;
      var reverse = x[1] < x[0], start = x[reverse - 0], stop = x[1 - reverse], step = (stop - start) / (domain.length - padding + 2 * outerPadding);
      range = steps(start + step * outerPadding, step);
      if (reverse) range.reverse();
      rangeBand = step * (1 - padding);
      ranger = {
        t: "rangeBands",
        a: arguments
      };
      return scale;
    };
    scale.rangeRoundBands = function(x, padding, outerPadding) {
      if (arguments.length < 2) padding = 0;
      if (arguments.length < 3) outerPadding = padding;
      var reverse = x[1] < x[0], start = x[reverse - 0], stop = x[1 - reverse], step = Math.floor((stop - start) / (domain.length - padding + 2 * outerPadding));
      range = steps(start + Math.round((stop - start - (domain.length - padding) * step) / 2), step);
      if (reverse) range.reverse();
      rangeBand = Math.round(step * (1 - padding));
      ranger = {
        t: "rangeRoundBands",
        a: arguments
      };
      return scale;
    };
    scale.rangeBand = function() {
      return rangeBand;
    };
    scale.rangeExtent = function() {
      return d3_scaleExtent(ranger.a[0]);
    };
    scale.copy = function() {
      return d3_scale_ordinal(domain, ranger);
    };
    return scale.domain(domain);
  }
  d3.scale.category10 = function() {
    return d3.scale.ordinal().range(d3_category10);
  };
  d3.scale.category20 = function() {
    return d3.scale.ordinal().range(d3_category20);
  };
  d3.scale.category20b = function() {
    return d3.scale.ordinal().range(d3_category20b);
  };
  d3.scale.category20c = function() {
    return d3.scale.ordinal().range(d3_category20c);
  };
  var d3_category10 = [ 2062260, 16744206, 2924588, 14034728, 9725885, 9197131, 14907330, 8355711, 12369186, 1556175 ].map(d3_rgbString);
  var d3_category20 = [ 2062260, 11454440, 16744206, 16759672, 2924588, 10018698, 14034728, 16750742, 9725885, 12955861, 9197131, 12885140, 14907330, 16234194, 8355711, 13092807, 12369186, 14408589, 1556175, 10410725 ].map(d3_rgbString);
  var d3_category20b = [ 3750777, 5395619, 7040719, 10264286, 6519097, 9216594, 11915115, 13556636, 9202993, 12426809, 15186514, 15190932, 8666169, 11356490, 14049643, 15177372, 8077683, 10834324, 13528509, 14589654 ].map(d3_rgbString);
  var d3_category20c = [ 3244733, 7057110, 10406625, 13032431, 15095053, 16616764, 16625259, 16634018, 3253076, 7652470, 10607003, 13101504, 7695281, 10394312, 12369372, 14342891, 6513507, 9868950, 12434877, 14277081 ].map(d3_rgbString);
  d3.scale.quantile = function() {
    return d3_scale_quantile([], []);
  };
  function d3_scale_quantile(domain, range) {
    var thresholds;
    function rescale() {
      var k = 0, q = range.length;
      thresholds = [];
      while (++k < q) thresholds[k - 1] = d3.quantile(domain, k / q);
      return scale;
    }
    function scale(x) {
      if (!isNaN(x = +x)) return range[d3.bisect(thresholds, x)];
    }
    scale.domain = function(x) {
      if (!arguments.length) return domain;
      domain = x.map(d3_number).filter(d3_numeric).sort(d3_ascending);
      return rescale();
    };
    scale.range = function(x) {
      if (!arguments.length) return range;
      range = x;
      return rescale();
    };
    scale.quantiles = function() {
      return thresholds;
    };
    scale.invertExtent = function(y) {
      y = range.indexOf(y);
      return y < 0 ? [ NaN, NaN ] : [ y > 0 ? thresholds[y - 1] : domain[0], y < thresholds.length ? thresholds[y] : domain[domain.length - 1] ];
    };
    scale.copy = function() {
      return d3_scale_quantile(domain, range);
    };
    return rescale();
  }
  d3.scale.quantize = function() {
    return d3_scale_quantize(0, 1, [ 0, 1 ]);
  };
  function d3_scale_quantize(x0, x1, range) {
    var kx, i;
    function scale(x) {
      return range[Math.max(0, Math.min(i, Math.floor(kx * (x - x0))))];
    }
    function rescale() {
      kx = range.length / (x1 - x0);
      i = range.length - 1;
      return scale;
    }
    scale.domain = function(x) {
      if (!arguments.length) return [ x0, x1 ];
      x0 = +x[0];
      x1 = +x[x.length - 1];
      return rescale();
    };
    scale.range = function(x) {
      if (!arguments.length) return range;
      range = x;
      return rescale();
    };
    scale.invertExtent = function(y) {
      y = range.indexOf(y);
      y = y < 0 ? NaN : y / kx + x0;
      return [ y, y + 1 / kx ];
    };
    scale.copy = function() {
      return d3_scale_quantize(x0, x1, range);
    };
    return rescale();
  }
  d3.scale.threshold = function() {
    return d3_scale_threshold([ .5 ], [ 0, 1 ]);
  };
  function d3_scale_threshold(domain, range) {
    function scale(x) {
      if (x <= x) return range[d3.bisect(domain, x)];
    }
    scale.domain = function(_) {
      if (!arguments.length) return domain;
      domain = _;
      return scale;
    };
    scale.range = function(_) {
      if (!arguments.length) return range;
      range = _;
      return scale;
    };
    scale.invertExtent = function(y) {
      y = range.indexOf(y);
      return [ domain[y - 1], domain[y] ];
    };
    scale.copy = function() {
      return d3_scale_threshold(domain, range);
    };
    return scale;
  }
  d3.scale.identity = function() {
    return d3_scale_identity([ 0, 1 ]);
  };
  function d3_scale_identity(domain) {
    function identity(x) {
      return +x;
    }
    identity.invert = identity;
    identity.domain = identity.range = function(x) {
      if (!arguments.length) return domain;
      domain = x.map(identity);
      return identity;
    };
    identity.ticks = function(m) {
      return d3_scale_linearTicks(domain, m);
    };
    identity.tickFormat = function(m, format) {
      return d3_scale_linearTickFormat(domain, m, format);
    };
    identity.copy = function() {
      return d3_scale_identity(domain);
    };
    return identity;
  }
  d3.svg = {};
  function d3_zero() {
    return 0;
  }
  d3.svg.arc = function() {
    var innerRadius = d3_svg_arcInnerRadius, outerRadius = d3_svg_arcOuterRadius, cornerRadius = d3_zero, padRadius = d3_svg_arcAuto, startAngle = d3_svg_arcStartAngle, endAngle = d3_svg_arcEndAngle, padAngle = d3_svg_arcPadAngle;
    function arc() {
      var r0 = Math.max(0, +innerRadius.apply(this, arguments)), r1 = Math.max(0, +outerRadius.apply(this, arguments)), a0 = startAngle.apply(this, arguments) - halfπ, a1 = endAngle.apply(this, arguments) - halfπ, da = Math.abs(a1 - a0), cw = a0 > a1 ? 0 : 1;
      if (r1 < r0) rc = r1, r1 = r0, r0 = rc;
      if (da >= τε) return circleSegment(r1, cw) + (r0 ? circleSegment(r0, 1 - cw) : "") + "Z";
      var rc, cr, rp, ap, p0 = 0, p1 = 0, x0, y0, x1, y1, x2, y2, x3, y3, path = [];
      if (ap = (+padAngle.apply(this, arguments) || 0) / 2) {
        rp = padRadius === d3_svg_arcAuto ? Math.sqrt(r0 * r0 + r1 * r1) : +padRadius.apply(this, arguments);
        if (!cw) p1 *= -1;
        if (r1) p1 = d3_asin(rp / r1 * Math.sin(ap));
        if (r0) p0 = d3_asin(rp / r0 * Math.sin(ap));
      }
      if (r1) {
        x0 = r1 * Math.cos(a0 + p1);
        y0 = r1 * Math.sin(a0 + p1);
        x1 = r1 * Math.cos(a1 - p1);
        y1 = r1 * Math.sin(a1 - p1);
        var l1 = Math.abs(a1 - a0 - 2 * p1) <= π ? 0 : 1;
        if (p1 && d3_svg_arcSweep(x0, y0, x1, y1) === cw ^ l1) {
          var h1 = (a0 + a1) / 2;
          x0 = r1 * Math.cos(h1);
          y0 = r1 * Math.sin(h1);
          x1 = y1 = null;
        }
      } else {
        x0 = y0 = 0;
      }
      if (r0) {
        x2 = r0 * Math.cos(a1 - p0);
        y2 = r0 * Math.sin(a1 - p0);
        x3 = r0 * Math.cos(a0 + p0);
        y3 = r0 * Math.sin(a0 + p0);
        var l0 = Math.abs(a0 - a1 + 2 * p0) <= π ? 0 : 1;
        if (p0 && d3_svg_arcSweep(x2, y2, x3, y3) === 1 - cw ^ l0) {
          var h0 = (a0 + a1) / 2;
          x2 = r0 * Math.cos(h0);
          y2 = r0 * Math.sin(h0);
          x3 = y3 = null;
        }
      } else {
        x2 = y2 = 0;
      }
      if ((rc = Math.min(Math.abs(r1 - r0) / 2, +cornerRadius.apply(this, arguments))) > .001) {
        cr = r0 < r1 ^ cw ? 0 : 1;
        var oc = x3 == null ? [ x2, y2 ] : x1 == null ? [ x0, y0 ] : d3_geom_polygonIntersect([ x0, y0 ], [ x3, y3 ], [ x1, y1 ], [ x2, y2 ]), ax = x0 - oc[0], ay = y0 - oc[1], bx = x1 - oc[0], by = y1 - oc[1], kc = 1 / Math.sin(Math.acos((ax * bx + ay * by) / (Math.sqrt(ax * ax + ay * ay) * Math.sqrt(bx * bx + by * by))) / 2), lc = Math.sqrt(oc[0] * oc[0] + oc[1] * oc[1]);
        if (x1 != null) {
          var rc1 = Math.min(rc, (r1 - lc) / (kc + 1)), t30 = d3_svg_arcCornerTangents(x3 == null ? [ x2, y2 ] : [ x3, y3 ], [ x0, y0 ], r1, rc1, cw), t12 = d3_svg_arcCornerTangents([ x1, y1 ], [ x2, y2 ], r1, rc1, cw);
          if (rc === rc1) {
            path.push("M", t30[0], "A", rc1, ",", rc1, " 0 0,", cr, " ", t30[1], "A", r1, ",", r1, " 0 ", 1 - cw ^ d3_svg_arcSweep(t30[1][0], t30[1][1], t12[1][0], t12[1][1]), ",", cw, " ", t12[1], "A", rc1, ",", rc1, " 0 0,", cr, " ", t12[0]);
          } else {
            path.push("M", t30[0], "A", rc1, ",", rc1, " 0 1,", cr, " ", t12[0]);
          }
        } else {
          path.push("M", x0, ",", y0);
        }
        if (x3 != null) {
          var rc0 = Math.min(rc, (r0 - lc) / (kc - 1)), t03 = d3_svg_arcCornerTangents([ x0, y0 ], [ x3, y3 ], r0, -rc0, cw), t21 = d3_svg_arcCornerTangents([ x2, y2 ], x1 == null ? [ x0, y0 ] : [ x1, y1 ], r0, -rc0, cw);
          if (rc === rc0) {
            path.push("L", t21[0], "A", rc0, ",", rc0, " 0 0,", cr, " ", t21[1], "A", r0, ",", r0, " 0 ", cw ^ d3_svg_arcSweep(t21[1][0], t21[1][1], t03[1][0], t03[1][1]), ",", 1 - cw, " ", t03[1], "A", rc0, ",", rc0, " 0 0,", cr, " ", t03[0]);
          } else {
            path.push("L", t21[0], "A", rc0, ",", rc0, " 0 0,", cr, " ", t03[0]);
          }
        } else {
          path.push("L", x2, ",", y2);
        }
      } else {
        path.push("M", x0, ",", y0);
        if (x1 != null) path.push("A", r1, ",", r1, " 0 ", l1, ",", cw, " ", x1, ",", y1);
        path.push("L", x2, ",", y2);
        if (x3 != null) path.push("A", r0, ",", r0, " 0 ", l0, ",", 1 - cw, " ", x3, ",", y3);
      }
      path.push("Z");
      return path.join("");
    }
    function circleSegment(r1, cw) {
      return "M0," + r1 + "A" + r1 + "," + r1 + " 0 1," + cw + " 0," + -r1 + "A" + r1 + "," + r1 + " 0 1," + cw + " 0," + r1;
    }
    arc.innerRadius = function(v) {
      if (!arguments.length) return innerRadius;
      innerRadius = d3_functor(v);
      return arc;
    };
    arc.outerRadius = function(v) {
      if (!arguments.length) return outerRadius;
      outerRadius = d3_functor(v);
      return arc;
    };
    arc.cornerRadius = function(v) {
      if (!arguments.length) return cornerRadius;
      cornerRadius = d3_functor(v);
      return arc;
    };
    arc.padRadius = function(v) {
      if (!arguments.length) return padRadius;
      padRadius = v == d3_svg_arcAuto ? d3_svg_arcAuto : d3_functor(v);
      return arc;
    };
    arc.startAngle = function(v) {
      if (!arguments.length) return startAngle;
      startAngle = d3_functor(v);
      return arc;
    };
    arc.endAngle = function(v) {
      if (!arguments.length) return endAngle;
      endAngle = d3_functor(v);
      return arc;
    };
    arc.padAngle = function(v) {
      if (!arguments.length) return padAngle;
      padAngle = d3_functor(v);
      return arc;
    };
    arc.centroid = function() {
      var r = (+innerRadius.apply(this, arguments) + +outerRadius.apply(this, arguments)) / 2, a = (+startAngle.apply(this, arguments) + +endAngle.apply(this, arguments)) / 2 - halfπ;
      return [ Math.cos(a) * r, Math.sin(a) * r ];
    };
    return arc;
  };
  var d3_svg_arcAuto = "auto";
  function d3_svg_arcInnerRadius(d) {
    return d.innerRadius;
  }
  function d3_svg_arcOuterRadius(d) {
    return d.outerRadius;
  }
  function d3_svg_arcStartAngle(d) {
    return d.startAngle;
  }
  function d3_svg_arcEndAngle(d) {
    return d.endAngle;
  }
  function d3_svg_arcPadAngle(d) {
    return d && d.padAngle;
  }
  function d3_svg_arcSweep(x0, y0, x1, y1) {
    return (x0 - x1) * y0 - (y0 - y1) * x0 > 0 ? 0 : 1;
  }
  function d3_svg_arcCornerTangents(p0, p1, r1, rc, cw) {
    var x01 = p0[0] - p1[0], y01 = p0[1] - p1[1], lo = (cw ? rc : -rc) / Math.sqrt(x01 * x01 + y01 * y01), ox = lo * y01, oy = -lo * x01, x1 = p0[0] + ox, y1 = p0[1] + oy, x2 = p1[0] + ox, y2 = p1[1] + oy, x3 = (x1 + x2) / 2, y3 = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, d2 = dx * dx + dy * dy, r = r1 - rc, D = x1 * y2 - x2 * y1, d = (dy < 0 ? -1 : 1) * Math.sqrt(r * r * d2 - D * D), cx0 = (D * dy - dx * d) / d2, cy0 = (-D * dx - dy * d) / d2, cx1 = (D * dy + dx * d) / d2, cy1 = (-D * dx + dy * d) / d2, dx0 = cx0 - x3, dy0 = cy0 - y3, dx1 = cx1 - x3, dy1 = cy1 - y3;
    if (dx0 * dx0 + dy0 * dy0 > dx1 * dx1 + dy1 * dy1) cx0 = cx1, cy0 = cy1;
    return [ [ cx0 - ox, cy0 - oy ], [ cx0 * r1 / r, cy0 * r1 / r ] ];
  }
  function d3_svg_line(projection) {
    var x = d3_geom_pointX, y = d3_geom_pointY, defined = d3_true, interpolate = d3_svg_lineLinear, interpolateKey = interpolate.key, tension = .7;
    function line(data) {
      var segments = [], points = [], i = -1, n = data.length, d, fx = d3_functor(x), fy = d3_functor(y);
      function segment() {
        segments.push("M", interpolate(projection(points), tension));
      }
      while (++i < n) {
        if (defined.call(this, d = data[i], i)) {
          points.push([ +fx.call(this, d, i), +fy.call(this, d, i) ]);
        } else if (points.length) {
          segment();
          points = [];
        }
      }
      if (points.length) segment();
      return segments.length ? segments.join("") : null;
    }
    line.x = function(_) {
      if (!arguments.length) return x;
      x = _;
      return line;
    };
    line.y = function(_) {
      if (!arguments.length) return y;
      y = _;
      return line;
    };
    line.defined = function(_) {
      if (!arguments.length) return defined;
      defined = _;
      return line;
    };
    line.interpolate = function(_) {
      if (!arguments.length) return interpolateKey;
      if (typeof _ === "function") interpolateKey = interpolate = _; else interpolateKey = (interpolate = d3_svg_lineInterpolators.get(_) || d3_svg_lineLinear).key;
      return line;
    };
    line.tension = function(_) {
      if (!arguments.length) return tension;
      tension = _;
      return line;
    };
    return line;
  }
  d3.svg.line = function() {
    return d3_svg_line(d3_identity);
  };
  var d3_svg_lineInterpolators = d3.map({
    linear: d3_svg_lineLinear,
    "linear-closed": d3_svg_lineLinearClosed,
    step: d3_svg_lineStep,
    "step-before": d3_svg_lineStepBefore,
    "step-after": d3_svg_lineStepAfter,
    basis: d3_svg_lineBasis,
    "basis-open": d3_svg_lineBasisOpen,
    "basis-closed": d3_svg_lineBasisClosed,
    bundle: d3_svg_lineBundle,
    cardinal: d3_svg_lineCardinal,
    "cardinal-open": d3_svg_lineCardinalOpen,
    "cardinal-closed": d3_svg_lineCardinalClosed,
    monotone: d3_svg_lineMonotone
  });
  d3_svg_lineInterpolators.forEach(function(key, value) {
    value.key = key;
    value.closed = /-closed$/.test(key);
  });
  function d3_svg_lineLinear(points) {
    return points.join("L");
  }
  function d3_svg_lineLinearClosed(points) {
    return d3_svg_lineLinear(points) + "Z";
  }
  function d3_svg_lineStep(points) {
    var i = 0, n = points.length, p = points[0], path = [ p[0], ",", p[1] ];
    while (++i < n) path.push("H", (p[0] + (p = points[i])[0]) / 2, "V", p[1]);
    if (n > 1) path.push("H", p[0]);
    return path.join("");
  }
  function d3_svg_lineStepBefore(points) {
    var i = 0, n = points.length, p = points[0], path = [ p[0], ",", p[1] ];
    while (++i < n) path.push("V", (p = points[i])[1], "H", p[0]);
    return path.join("");
  }
  function d3_svg_lineStepAfter(points) {
    var i = 0, n = points.length, p = points[0], path = [ p[0], ",", p[1] ];
    while (++i < n) path.push("H", (p = points[i])[0], "V", p[1]);
    return path.join("");
  }
  function d3_svg_lineCardinalOpen(points, tension) {
    return points.length < 4 ? d3_svg_lineLinear(points) : points[1] + d3_svg_lineHermite(points.slice(1, -1), d3_svg_lineCardinalTangents(points, tension));
  }
  function d3_svg_lineCardinalClosed(points, tension) {
    return points.length < 3 ? d3_svg_lineLinear(points) : points[0] + d3_svg_lineHermite((points.push(points[0]), 
    points), d3_svg_lineCardinalTangents([ points[points.length - 2] ].concat(points, [ points[1] ]), tension));
  }
  function d3_svg_lineCardinal(points, tension) {
    return points.length < 3 ? d3_svg_lineLinear(points) : points[0] + d3_svg_lineHermite(points, d3_svg_lineCardinalTangents(points, tension));
  }
  function d3_svg_lineHermite(points, tangents) {
    if (tangents.length < 1 || points.length != tangents.length && points.length != tangents.length + 2) {
      return d3_svg_lineLinear(points);
    }
    var quad = points.length != tangents.length, path = "", p0 = points[0], p = points[1], t0 = tangents[0], t = t0, pi = 1;
    if (quad) {
      path += "Q" + (p[0] - t0[0] * 2 / 3) + "," + (p[1] - t0[1] * 2 / 3) + "," + p[0] + "," + p[1];
      p0 = points[1];
      pi = 2;
    }
    if (tangents.length > 1) {
      t = tangents[1];
      p = points[pi];
      pi++;
      path += "C" + (p0[0] + t0[0]) + "," + (p0[1] + t0[1]) + "," + (p[0] - t[0]) + "," + (p[1] - t[1]) + "," + p[0] + "," + p[1];
      for (var i = 2; i < tangents.length; i++, pi++) {
        p = points[pi];
        t = tangents[i];
        path += "S" + (p[0] - t[0]) + "," + (p[1] - t[1]) + "," + p[0] + "," + p[1];
      }
    }
    if (quad) {
      var lp = points[pi];
      path += "Q" + (p[0] + t[0] * 2 / 3) + "," + (p[1] + t[1] * 2 / 3) + "," + lp[0] + "," + lp[1];
    }
    return path;
  }
  function d3_svg_lineCardinalTangents(points, tension) {
    var tangents = [], a = (1 - tension) / 2, p0, p1 = points[0], p2 = points[1], i = 1, n = points.length;
    while (++i < n) {
      p0 = p1;
      p1 = p2;
      p2 = points[i];
      tangents.push([ a * (p2[0] - p0[0]), a * (p2[1] - p0[1]) ]);
    }
    return tangents;
  }
  function d3_svg_lineBasis(points) {
    if (points.length < 3) return d3_svg_lineLinear(points);
    var i = 1, n = points.length, pi = points[0], x0 = pi[0], y0 = pi[1], px = [ x0, x0, x0, (pi = points[1])[0] ], py = [ y0, y0, y0, pi[1] ], path = [ x0, ",", y0, "L", d3_svg_lineDot4(d3_svg_lineBasisBezier3, px), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier3, py) ];
    points.push(points[n - 1]);
    while (++i <= n) {
      pi = points[i];
      px.shift();
      px.push(pi[0]);
      py.shift();
      py.push(pi[1]);
      d3_svg_lineBasisBezier(path, px, py);
    }
    points.pop();
    path.push("L", pi);
    return path.join("");
  }
  function d3_svg_lineBasisOpen(points) {
    if (points.length < 4) return d3_svg_lineLinear(points);
    var path = [], i = -1, n = points.length, pi, px = [ 0 ], py = [ 0 ];
    while (++i < 3) {
      pi = points[i];
      px.push(pi[0]);
      py.push(pi[1]);
    }
    path.push(d3_svg_lineDot4(d3_svg_lineBasisBezier3, px) + "," + d3_svg_lineDot4(d3_svg_lineBasisBezier3, py));
    --i;
    while (++i < n) {
      pi = points[i];
      px.shift();
      px.push(pi[0]);
      py.shift();
      py.push(pi[1]);
      d3_svg_lineBasisBezier(path, px, py);
    }
    return path.join("");
  }
  function d3_svg_lineBasisClosed(points) {
    var path, i = -1, n = points.length, m = n + 4, pi, px = [], py = [];
    while (++i < 4) {
      pi = points[i % n];
      px.push(pi[0]);
      py.push(pi[1]);
    }
    path = [ d3_svg_lineDot4(d3_svg_lineBasisBezier3, px), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier3, py) ];
    --i;
    while (++i < m) {
      pi = points[i % n];
      px.shift();
      px.push(pi[0]);
      py.shift();
      py.push(pi[1]);
      d3_svg_lineBasisBezier(path, px, py);
    }
    return path.join("");
  }
  function d3_svg_lineBundle(points, tension) {
    var n = points.length - 1;
    if (n) {
      var x0 = points[0][0], y0 = points[0][1], dx = points[n][0] - x0, dy = points[n][1] - y0, i = -1, p, t;
      while (++i <= n) {
        p = points[i];
        t = i / n;
        p[0] = tension * p[0] + (1 - tension) * (x0 + t * dx);
        p[1] = tension * p[1] + (1 - tension) * (y0 + t * dy);
      }
    }
    return d3_svg_lineBasis(points);
  }
  function d3_svg_lineDot4(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  }
  var d3_svg_lineBasisBezier1 = [ 0, 2 / 3, 1 / 3, 0 ], d3_svg_lineBasisBezier2 = [ 0, 1 / 3, 2 / 3, 0 ], d3_svg_lineBasisBezier3 = [ 0, 1 / 6, 2 / 3, 1 / 6 ];
  function d3_svg_lineBasisBezier(path, x, y) {
    path.push("C", d3_svg_lineDot4(d3_svg_lineBasisBezier1, x), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier1, y), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier2, x), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier2, y), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier3, x), ",", d3_svg_lineDot4(d3_svg_lineBasisBezier3, y));
  }
  function d3_svg_lineSlope(p0, p1) {
    return (p1[1] - p0[1]) / (p1[0] - p0[0]);
  }
  function d3_svg_lineFiniteDifferences(points) {
    var i = 0, j = points.length - 1, m = [], p0 = points[0], p1 = points[1], d = m[0] = d3_svg_lineSlope(p0, p1);
    while (++i < j) {
      m[i] = (d + (d = d3_svg_lineSlope(p0 = p1, p1 = points[i + 1]))) / 2;
    }
    m[i] = d;
    return m;
  }
  function d3_svg_lineMonotoneTangents(points) {
    var tangents = [], d, a, b, s, m = d3_svg_lineFiniteDifferences(points), i = -1, j = points.length - 1;
    while (++i < j) {
      d = d3_svg_lineSlope(points[i], points[i + 1]);
      if (abs(d) < ε) {
        m[i] = m[i + 1] = 0;
      } else {
        a = m[i] / d;
        b = m[i + 1] / d;
        s = a * a + b * b;
        if (s > 9) {
          s = d * 3 / Math.sqrt(s);
          m[i] = s * a;
          m[i + 1] = s * b;
        }
      }
    }
    i = -1;
    while (++i <= j) {
      s = (points[Math.min(j, i + 1)][0] - points[Math.max(0, i - 1)][0]) / (6 * (1 + m[i] * m[i]));
      tangents.push([ s || 0, m[i] * s || 0 ]);
    }
    return tangents;
  }
  function d3_svg_lineMonotone(points) {
    return points.length < 3 ? d3_svg_lineLinear(points) : points[0] + d3_svg_lineHermite(points, d3_svg_lineMonotoneTangents(points));
  }
  d3.svg.line.radial = function() {
    var line = d3_svg_line(d3_svg_lineRadial);
    line.radius = line.x, delete line.x;
    line.angle = line.y, delete line.y;
    return line;
  };
  function d3_svg_lineRadial(points) {
    var point, i = -1, n = points.length, r, a;
    while (++i < n) {
      point = points[i];
      r = point[0];
      a = point[1] - halfπ;
      point[0] = r * Math.cos(a);
      point[1] = r * Math.sin(a);
    }
    return points;
  }
  function d3_svg_area(projection) {
    var x0 = d3_geom_pointX, x1 = d3_geom_pointX, y0 = 0, y1 = d3_geom_pointY, defined = d3_true, interpolate = d3_svg_lineLinear, interpolateKey = interpolate.key, interpolateReverse = interpolate, L = "L", tension = .7;
    function area(data) {
      var segments = [], points0 = [], points1 = [], i = -1, n = data.length, d, fx0 = d3_functor(x0), fy0 = d3_functor(y0), fx1 = x0 === x1 ? function() {
        return x;
      } : d3_functor(x1), fy1 = y0 === y1 ? function() {
        return y;
      } : d3_functor(y1), x, y;
      function segment() {
        segments.push("M", interpolate(projection(points1), tension), L, interpolateReverse(projection(points0.reverse()), tension), "Z");
      }
      while (++i < n) {
        if (defined.call(this, d = data[i], i)) {
          points0.push([ x = +fx0.call(this, d, i), y = +fy0.call(this, d, i) ]);
          points1.push([ +fx1.call(this, d, i), +fy1.call(this, d, i) ]);
        } else if (points0.length) {
          segment();
          points0 = [];
          points1 = [];
        }
      }
      if (points0.length) segment();
      return segments.length ? segments.join("") : null;
    }
    area.x = function(_) {
      if (!arguments.length) return x1;
      x0 = x1 = _;
      return area;
    };
    area.x0 = function(_) {
      if (!arguments.length) return x0;
      x0 = _;
      return area;
    };
    area.x1 = function(_) {
      if (!arguments.length) return x1;
      x1 = _;
      return area;
    };
    area.y = function(_) {
      if (!arguments.length) return y1;
      y0 = y1 = _;
      return area;
    };
    area.y0 = function(_) {
      if (!arguments.length) return y0;
      y0 = _;
      return area;
    };
    area.y1 = function(_) {
      if (!arguments.length) return y1;
      y1 = _;
      return area;
    };
    area.defined = function(_) {
      if (!arguments.length) return defined;
      defined = _;
      return area;
    };
    area.interpolate = function(_) {
      if (!arguments.length) return interpolateKey;
      if (typeof _ === "function") interpolateKey = interpolate = _; else interpolateKey = (interpolate = d3_svg_lineInterpolators.get(_) || d3_svg_lineLinear).key;
      interpolateReverse = interpolate.reverse || interpolate;
      L = interpolate.closed ? "M" : "L";
      return area;
    };
    area.tension = function(_) {
      if (!arguments.length) return tension;
      tension = _;
      return area;
    };
    return area;
  }
  d3_svg_lineStepBefore.reverse = d3_svg_lineStepAfter;
  d3_svg_lineStepAfter.reverse = d3_svg_lineStepBefore;
  d3.svg.area = function() {
    return d3_svg_area(d3_identity);
  };
  d3.svg.area.radial = function() {
    var area = d3_svg_area(d3_svg_lineRadial);
    area.radius = area.x, delete area.x;
    area.innerRadius = area.x0, delete area.x0;
    area.outerRadius = area.x1, delete area.x1;
    area.angle = area.y, delete area.y;
    area.startAngle = area.y0, delete area.y0;
    area.endAngle = area.y1, delete area.y1;
    return area;
  };
  d3.svg.chord = function() {
    var source = d3_source, target = d3_target, radius = d3_svg_chordRadius, startAngle = d3_svg_arcStartAngle, endAngle = d3_svg_arcEndAngle;
    function chord(d, i) {
      var s = subgroup(this, source, d, i), t = subgroup(this, target, d, i);
      return "M" + s.p0 + arc(s.r, s.p1, s.a1 - s.a0) + (equals(s, t) ? curve(s.r, s.p1, s.r, s.p0) : curve(s.r, s.p1, t.r, t.p0) + arc(t.r, t.p1, t.a1 - t.a0) + curve(t.r, t.p1, s.r, s.p0)) + "Z";
    }
    function subgroup(self, f, d, i) {
      var subgroup = f.call(self, d, i), r = radius.call(self, subgroup, i), a0 = startAngle.call(self, subgroup, i) - halfπ, a1 = endAngle.call(self, subgroup, i) - halfπ;
      return {
        r: r,
        a0: a0,
        a1: a1,
        p0: [ r * Math.cos(a0), r * Math.sin(a0) ],
        p1: [ r * Math.cos(a1), r * Math.sin(a1) ]
      };
    }
    function equals(a, b) {
      return a.a0 == b.a0 && a.a1 == b.a1;
    }
    function arc(r, p, a) {
      return "A" + r + "," + r + " 0 " + +(a > π) + ",1 " + p;
    }
    function curve(r0, p0, r1, p1) {
      return "Q 0,0 " + p1;
    }
    chord.radius = function(v) {
      if (!arguments.length) return radius;
      radius = d3_functor(v);
      return chord;
    };
    chord.source = function(v) {
      if (!arguments.length) return source;
      source = d3_functor(v);
      return chord;
    };
    chord.target = function(v) {
      if (!arguments.length) return target;
      target = d3_functor(v);
      return chord;
    };
    chord.startAngle = function(v) {
      if (!arguments.length) return startAngle;
      startAngle = d3_functor(v);
      return chord;
    };
    chord.endAngle = function(v) {
      if (!arguments.length) return endAngle;
      endAngle = d3_functor(v);
      return chord;
    };
    return chord;
  };
  function d3_svg_chordRadius(d) {
    return d.radius;
  }
  d3.svg.diagonal = function() {
    var source = d3_source, target = d3_target, projection = d3_svg_diagonalProjection;
    function diagonal(d, i) {
      var p0 = source.call(this, d, i), p3 = target.call(this, d, i), m = (p0.y + p3.y) / 2, p = [ p0, {
        x: p0.x,
        y: m
      }, {
        x: p3.x,
        y: m
      }, p3 ];
      p = p.map(projection);
      return "M" + p[0] + "C" + p[1] + " " + p[2] + " " + p[3];
    }
    diagonal.source = function(x) {
      if (!arguments.length) return source;
      source = d3_functor(x);
      return diagonal;
    };
    diagonal.target = function(x) {
      if (!arguments.length) return target;
      target = d3_functor(x);
      return diagonal;
    };
    diagonal.projection = function(x) {
      if (!arguments.length) return projection;
      projection = x;
      return diagonal;
    };
    return diagonal;
  };
  function d3_svg_diagonalProjection(d) {
    return [ d.x, d.y ];
  }
  d3.svg.diagonal.radial = function() {
    var diagonal = d3.svg.diagonal(), projection = d3_svg_diagonalProjection, projection_ = diagonal.projection;
    diagonal.projection = function(x) {
      return arguments.length ? projection_(d3_svg_diagonalRadialProjection(projection = x)) : projection;
    };
    return diagonal;
  };
  function d3_svg_diagonalRadialProjection(projection) {
    return function() {
      var d = projection.apply(this, arguments), r = d[0], a = d[1] - halfπ;
      return [ r * Math.cos(a), r * Math.sin(a) ];
    };
  }
  d3.svg.symbol = function() {
    var type = d3_svg_symbolType, size = d3_svg_symbolSize;
    function symbol(d, i) {
      return (d3_svg_symbols.get(type.call(this, d, i)) || d3_svg_symbolCircle)(size.call(this, d, i));
    }
    symbol.type = function(x) {
      if (!arguments.length) return type;
      type = d3_functor(x);
      return symbol;
    };
    symbol.size = function(x) {
      if (!arguments.length) return size;
      size = d3_functor(x);
      return symbol;
    };
    return symbol;
  };
  function d3_svg_symbolSize() {
    return 64;
  }
  function d3_svg_symbolType() {
    return "circle";
  }
  function d3_svg_symbolCircle(size) {
    var r = Math.sqrt(size / π);
    return "M0," + r + "A" + r + "," + r + " 0 1,1 0," + -r + "A" + r + "," + r + " 0 1,1 0," + r + "Z";
  }
  var d3_svg_symbols = d3.map({
    circle: d3_svg_symbolCircle,
    cross: function(size) {
      var r = Math.sqrt(size / 5) / 2;
      return "M" + -3 * r + "," + -r + "H" + -r + "V" + -3 * r + "H" + r + "V" + -r + "H" + 3 * r + "V" + r + "H" + r + "V" + 3 * r + "H" + -r + "V" + r + "H" + -3 * r + "Z";
    },
    diamond: function(size) {
      var ry = Math.sqrt(size / (2 * d3_svg_symbolTan30)), rx = ry * d3_svg_symbolTan30;
      return "M0," + -ry + "L" + rx + ",0" + " 0," + ry + " " + -rx + ",0" + "Z";
    },
    square: function(size) {
      var r = Math.sqrt(size) / 2;
      return "M" + -r + "," + -r + "L" + r + "," + -r + " " + r + "," + r + " " + -r + "," + r + "Z";
    },
    "triangle-down": function(size) {
      var rx = Math.sqrt(size / d3_svg_symbolSqrt3), ry = rx * d3_svg_symbolSqrt3 / 2;
      return "M0," + ry + "L" + rx + "," + -ry + " " + -rx + "," + -ry + "Z";
    },
    "triangle-up": function(size) {
      var rx = Math.sqrt(size / d3_svg_symbolSqrt3), ry = rx * d3_svg_symbolSqrt3 / 2;
      return "M0," + -ry + "L" + rx + "," + ry + " " + -rx + "," + ry + "Z";
    }
  });
  d3.svg.symbolTypes = d3_svg_symbols.keys();
  var d3_svg_symbolSqrt3 = Math.sqrt(3), d3_svg_symbolTan30 = Math.tan(30 * d3_radians);
  d3_selectionPrototype.transition = function(name) {
    var id = d3_transitionInheritId || ++d3_transitionId, ns = d3_transitionNamespace(name), subgroups = [], subgroup, node, transition = d3_transitionInherit || {
      time: Date.now(),
      ease: d3_ease_cubicInOut,
      delay: 0,
      duration: 250
    };
    for (var j = -1, m = this.length; ++j < m; ) {
      subgroups.push(subgroup = []);
      for (var group = this[j], i = -1, n = group.length; ++i < n; ) {
        if (node = group[i]) d3_transitionNode(node, i, ns, id, transition);
        subgroup.push(node);
      }
    }
    return d3_transition(subgroups, ns, id);
  };
  d3_selectionPrototype.interrupt = function(name) {
    return this.each(name == null ? d3_selection_interrupt : d3_selection_interruptNS(d3_transitionNamespace(name)));
  };
  var d3_selection_interrupt = d3_selection_interruptNS(d3_transitionNamespace());
  function d3_selection_interruptNS(ns) {
    return function() {
      var lock, active;
      if ((lock = this[ns]) && (active = lock[lock.active])) {
        if (--lock.count) delete lock[lock.active]; else delete this[ns];
        lock.active += .5;
        active.event && active.event.interrupt.call(this, this.__data__, active.index);
      }
    };
  }
  function d3_transition(groups, ns, id) {
    d3_subclass(groups, d3_transitionPrototype);
    groups.namespace = ns;
    groups.id = id;
    return groups;
  }
  var d3_transitionPrototype = [], d3_transitionId = 0, d3_transitionInheritId, d3_transitionInherit;
  d3_transitionPrototype.call = d3_selectionPrototype.call;
  d3_transitionPrototype.empty = d3_selectionPrototype.empty;
  d3_transitionPrototype.node = d3_selectionPrototype.node;
  d3_transitionPrototype.size = d3_selectionPrototype.size;
  d3.transition = function(selection, name) {
    return selection && selection.transition ? d3_transitionInheritId ? selection.transition(name) : selection : d3.selection().transition(selection);
  };
  d3.transition.prototype = d3_transitionPrototype;
  d3_transitionPrototype.select = function(selector) {
    var id = this.id, ns = this.namespace, subgroups = [], subgroup, subnode, node;
    selector = d3_selection_selector(selector);
    for (var j = -1, m = this.length; ++j < m; ) {
      subgroups.push(subgroup = []);
      for (var group = this[j], i = -1, n = group.length; ++i < n; ) {
        if ((node = group[i]) && (subnode = selector.call(node, node.__data__, i, j))) {
          if ("__data__" in node) subnode.__data__ = node.__data__;
          d3_transitionNode(subnode, i, ns, id, node[ns][id]);
          subgroup.push(subnode);
        } else {
          subgroup.push(null);
        }
      }
    }
    return d3_transition(subgroups, ns, id);
  };
  d3_transitionPrototype.selectAll = function(selector) {
    var id = this.id, ns = this.namespace, subgroups = [], subgroup, subnodes, node, subnode, transition;
    selector = d3_selection_selectorAll(selector);
    for (var j = -1, m = this.length; ++j < m; ) {
      for (var group = this[j], i = -1, n = group.length; ++i < n; ) {
        if (node = group[i]) {
          transition = node[ns][id];
          subnodes = selector.call(node, node.__data__, i, j);
          subgroups.push(subgroup = []);
          for (var k = -1, o = subnodes.length; ++k < o; ) {
            if (subnode = subnodes[k]) d3_transitionNode(subnode, k, ns, id, transition);
            subgroup.push(subnode);
          }
        }
      }
    }
    return d3_transition(subgroups, ns, id);
  };
  d3_transitionPrototype.filter = function(filter) {
    var subgroups = [], subgroup, group, node;
    if (typeof filter !== "function") filter = d3_selection_filter(filter);
    for (var j = 0, m = this.length; j < m; j++) {
      subgroups.push(subgroup = []);
      for (var group = this[j], i = 0, n = group.length; i < n; i++) {
        if ((node = group[i]) && filter.call(node, node.__data__, i, j)) {
          subgroup.push(node);
        }
      }
    }
    return d3_transition(subgroups, this.namespace, this.id);
  };
  d3_transitionPrototype.tween = function(name, tween) {
    var id = this.id, ns = this.namespace;
    if (arguments.length < 2) return this.node()[ns][id].tween.get(name);
    return d3_selection_each(this, tween == null ? function(node) {
      node[ns][id].tween.remove(name);
    } : function(node) {
      node[ns][id].tween.set(name, tween);
    });
  };
  function d3_transition_tween(groups, name, value, tween) {
    var id = groups.id, ns = groups.namespace;
    return d3_selection_each(groups, typeof value === "function" ? function(node, i, j) {
      node[ns][id].tween.set(name, tween(value.call(node, node.__data__, i, j)));
    } : (value = tween(value), function(node) {
      node[ns][id].tween.set(name, value);
    }));
  }
  d3_transitionPrototype.attr = function(nameNS, value) {
    if (arguments.length < 2) {
      for (value in nameNS) this.attr(value, nameNS[value]);
      return this;
    }
    var interpolate = nameNS == "transform" ? d3_interpolateTransform : d3_interpolate, name = d3.ns.qualify(nameNS);
    function attrNull() {
      this.removeAttribute(name);
    }
    function attrNullNS() {
      this.removeAttributeNS(name.space, name.local);
    }
    function attrTween(b) {
      return b == null ? attrNull : (b += "", function() {
        var a = this.getAttribute(name), i;
        return a !== b && (i = interpolate(a, b), function(t) {
          this.setAttribute(name, i(t));
        });
      });
    }
    function attrTweenNS(b) {
      return b == null ? attrNullNS : (b += "", function() {
        var a = this.getAttributeNS(name.space, name.local), i;
        return a !== b && (i = interpolate(a, b), function(t) {
          this.setAttributeNS(name.space, name.local, i(t));
        });
      });
    }
    return d3_transition_tween(this, "attr." + nameNS, value, name.local ? attrTweenNS : attrTween);
  };
  d3_transitionPrototype.attrTween = function(nameNS, tween) {
    var name = d3.ns.qualify(nameNS);
    function attrTween(d, i) {
      var f = tween.call(this, d, i, this.getAttribute(name));
      return f && function(t) {
        this.setAttribute(name, f(t));
      };
    }
    function attrTweenNS(d, i) {
      var f = tween.call(this, d, i, this.getAttributeNS(name.space, name.local));
      return f && function(t) {
        this.setAttributeNS(name.space, name.local, f(t));
      };
    }
    return this.tween("attr." + nameNS, name.local ? attrTweenNS : attrTween);
  };
  d3_transitionPrototype.style = function(name, value, priority) {
    var n = arguments.length;
    if (n < 3) {
      if (typeof name !== "string") {
        if (n < 2) value = "";
        for (priority in name) this.style(priority, name[priority], value);
        return this;
      }
      priority = "";
    }
    function styleNull() {
      this.style.removeProperty(name);
    }
    function styleString(b) {
      return b == null ? styleNull : (b += "", function() {
        var a = d3_window(this).getComputedStyle(this, null).getPropertyValue(name), i;
        return a !== b && (i = d3_interpolate(a, b), function(t) {
          this.style.setProperty(name, i(t), priority);
        });
      });
    }
    return d3_transition_tween(this, "style." + name, value, styleString);
  };
  d3_transitionPrototype.styleTween = function(name, tween, priority) {
    if (arguments.length < 3) priority = "";
    function styleTween(d, i) {
      var f = tween.call(this, d, i, d3_window(this).getComputedStyle(this, null).getPropertyValue(name));
      return f && function(t) {
        this.style.setProperty(name, f(t), priority);
      };
    }
    return this.tween("style." + name, styleTween);
  };
  d3_transitionPrototype.text = function(value) {
    return d3_transition_tween(this, "text", value, d3_transition_text);
  };
  function d3_transition_text(b) {
    if (b == null) b = "";
    return function() {
      this.textContent = b;
    };
  }
  d3_transitionPrototype.remove = function() {
    var ns = this.namespace;
    return this.each("end.transition", function() {
      var p;
      if (this[ns].count < 2 && (p = this.parentNode)) p.removeChild(this);
    });
  };
  d3_transitionPrototype.ease = function(value) {
    var id = this.id, ns = this.namespace;
    if (arguments.length < 1) return this.node()[ns][id].ease;
    if (typeof value !== "function") value = d3.ease.apply(d3, arguments);
    return d3_selection_each(this, function(node) {
      node[ns][id].ease = value;
    });
  };
  d3_transitionPrototype.delay = function(value) {
    var id = this.id, ns = this.namespace;
    if (arguments.length < 1) return this.node()[ns][id].delay;
    return d3_selection_each(this, typeof value === "function" ? function(node, i, j) {
      node[ns][id].delay = +value.call(node, node.__data__, i, j);
    } : (value = +value, function(node) {
      node[ns][id].delay = value;
    }));
  };
  d3_transitionPrototype.duration = function(value) {
    var id = this.id, ns = this.namespace;
    if (arguments.length < 1) return this.node()[ns][id].duration;
    return d3_selection_each(this, typeof value === "function" ? function(node, i, j) {
      node[ns][id].duration = Math.max(1, value.call(node, node.__data__, i, j));
    } : (value = Math.max(1, value), function(node) {
      node[ns][id].duration = value;
    }));
  };
  d3_transitionPrototype.each = function(type, listener) {
    var id = this.id, ns = this.namespace;
    if (arguments.length < 2) {
      var inherit = d3_transitionInherit, inheritId = d3_transitionInheritId;
      try {
        d3_transitionInheritId = id;
        d3_selection_each(this, function(node, i, j) {
          d3_transitionInherit = node[ns][id];
          type.call(node, node.__data__, i, j);
        });
      } finally {
        d3_transitionInherit = inherit;
        d3_transitionInheritId = inheritId;
      }
    } else {
      d3_selection_each(this, function(node) {
        var transition = node[ns][id];
        (transition.event || (transition.event = d3.dispatch("start", "end", "interrupt"))).on(type, listener);
      });
    }
    return this;
  };
  d3_transitionPrototype.transition = function() {
    var id0 = this.id, id1 = ++d3_transitionId, ns = this.namespace, subgroups = [], subgroup, group, node, transition;
    for (var j = 0, m = this.length; j < m; j++) {
      subgroups.push(subgroup = []);
      for (var group = this[j], i = 0, n = group.length; i < n; i++) {
        if (node = group[i]) {
          transition = node[ns][id0];
          d3_transitionNode(node, i, ns, id1, {
            time: transition.time,
            ease: transition.ease,
            delay: transition.delay + transition.duration,
            duration: transition.duration
          });
        }
        subgroup.push(node);
      }
    }
    return d3_transition(subgroups, ns, id1);
  };
  function d3_transitionNamespace(name) {
    return name == null ? "__transition__" : "__transition_" + name + "__";
  }
  function d3_transitionNode(node, i, ns, id, inherit) {
    var lock = node[ns] || (node[ns] = {
      active: 0,
      count: 0
    }), transition = lock[id];
    if (!transition) {
      var time = inherit.time;
      transition = lock[id] = {
        tween: new d3_Map(),
        time: time,
        delay: inherit.delay,
        duration: inherit.duration,
        ease: inherit.ease,
        index: i
      };
      inherit = null;
      ++lock.count;
      d3.timer(function(elapsed) {
        var delay = transition.delay, duration, ease, timer = d3_timer_active, tweened = [];
        timer.t = delay + time;
        if (delay <= elapsed) return start(elapsed - delay);
        timer.c = start;
        function start(elapsed) {
          if (lock.active > id) return stop();
          var active = lock[lock.active];
          if (active) {
            --lock.count;
            delete lock[lock.active];
            active.event && active.event.interrupt.call(node, node.__data__, active.index);
          }
          lock.active = id;
          transition.event && transition.event.start.call(node, node.__data__, i);
          transition.tween.forEach(function(key, value) {
            if (value = value.call(node, node.__data__, i)) {
              tweened.push(value);
            }
          });
          ease = transition.ease;
          duration = transition.duration;
          d3.timer(function() {
            timer.c = tick(elapsed || 1) ? d3_true : tick;
            return 1;
          }, 0, time);
        }
        function tick(elapsed) {
          if (lock.active !== id) return 1;
          var t = elapsed / duration, e = ease(t), n = tweened.length;
          while (n > 0) {
            tweened[--n].call(node, e);
          }
          if (t >= 1) {
            transition.event && transition.event.end.call(node, node.__data__, i);
            return stop();
          }
        }
        function stop() {
          if (--lock.count) delete lock[id]; else delete node[ns];
          return 1;
        }
      }, 0, time);
    }
  }
  d3.svg.axis = function() {
    var scale = d3.scale.linear(), orient = d3_svg_axisDefaultOrient, innerTickSize = 6, outerTickSize = 6, tickPadding = 3, tickArguments_ = [ 10 ], tickValues = null, tickFormat_;
    function axis(g) {
      g.each(function() {
        var g = d3.select(this);
        var scale0 = this.__chart__ || scale, scale1 = this.__chart__ = scale.copy();
        var ticks = tickValues == null ? scale1.ticks ? scale1.ticks.apply(scale1, tickArguments_) : scale1.domain() : tickValues, tickFormat = tickFormat_ == null ? scale1.tickFormat ? scale1.tickFormat.apply(scale1, tickArguments_) : d3_identity : tickFormat_, tick = g.selectAll(".tick").data(ticks, scale1), tickEnter = tick.enter().insert("g", ".domain").attr("class", "tick").style("opacity", ε), tickExit = d3.transition(tick.exit()).style("opacity", ε).remove(), tickUpdate = d3.transition(tick.order()).style("opacity", 1), tickSpacing = Math.max(innerTickSize, 0) + tickPadding, tickTransform;
        var range = d3_scaleRange(scale1), path = g.selectAll(".domain").data([ 0 ]), pathUpdate = (path.enter().append("path").attr("class", "domain"), 
        d3.transition(path));
        tickEnter.append("line");
        tickEnter.append("text");
        var lineEnter = tickEnter.select("line"), lineUpdate = tickUpdate.select("line"), text = tick.select("text").text(tickFormat), textEnter = tickEnter.select("text"), textUpdate = tickUpdate.select("text"), sign = orient === "top" || orient === "left" ? -1 : 1, x1, x2, y1, y2;
        if (orient === "bottom" || orient === "top") {
          tickTransform = d3_svg_axisX, x1 = "x", y1 = "y", x2 = "x2", y2 = "y2";
          text.attr("dy", sign < 0 ? "0em" : ".71em").style("text-anchor", "middle");
          pathUpdate.attr("d", "M" + range[0] + "," + sign * outerTickSize + "V0H" + range[1] + "V" + sign * outerTickSize);
        } else {
          tickTransform = d3_svg_axisY, x1 = "y", y1 = "x", x2 = "y2", y2 = "x2";
          text.attr("dy", ".32em").style("text-anchor", sign < 0 ? "end" : "start");
          pathUpdate.attr("d", "M" + sign * outerTickSize + "," + range[0] + "H0V" + range[1] + "H" + sign * outerTickSize);
        }
        lineEnter.attr(y2, sign * innerTickSize);
        textEnter.attr(y1, sign * tickSpacing);
        lineUpdate.attr(x2, 0).attr(y2, sign * innerTickSize);
        textUpdate.attr(x1, 0).attr(y1, sign * tickSpacing);
        if (scale1.rangeBand) {
          var x = scale1, dx = x.rangeBand() / 2;
          scale0 = scale1 = function(d) {
            return x(d) + dx;
          };
        } else if (scale0.rangeBand) {
          scale0 = scale1;
        } else {
          tickExit.call(tickTransform, scale1, scale0);
        }
        tickEnter.call(tickTransform, scale0, scale1);
        tickUpdate.call(tickTransform, scale1, scale1);
      });
    }
    axis.scale = function(x) {
      if (!arguments.length) return scale;
      scale = x;
      return axis;
    };
    axis.orient = function(x) {
      if (!arguments.length) return orient;
      orient = x in d3_svg_axisOrients ? x + "" : d3_svg_axisDefaultOrient;
      return axis;
    };
    axis.ticks = function() {
      if (!arguments.length) return tickArguments_;
      tickArguments_ = arguments;
      return axis;
    };
    axis.tickValues = function(x) {
      if (!arguments.length) return tickValues;
      tickValues = x;
      return axis;
    };
    axis.tickFormat = function(x) {
      if (!arguments.length) return tickFormat_;
      tickFormat_ = x;
      return axis;
    };
    axis.tickSize = function(x) {
      var n = arguments.length;
      if (!n) return innerTickSize;
      innerTickSize = +x;
      outerTickSize = +arguments[n - 1];
      return axis;
    };
    axis.innerTickSize = function(x) {
      if (!arguments.length) return innerTickSize;
      innerTickSize = +x;
      return axis;
    };
    axis.outerTickSize = function(x) {
      if (!arguments.length) return outerTickSize;
      outerTickSize = +x;
      return axis;
    };
    axis.tickPadding = function(x) {
      if (!arguments.length) return tickPadding;
      tickPadding = +x;
      return axis;
    };
    axis.tickSubdivide = function() {
      return arguments.length && axis;
    };
    return axis;
  };
  var d3_svg_axisDefaultOrient = "bottom", d3_svg_axisOrients = {
    top: 1,
    right: 1,
    bottom: 1,
    left: 1
  };
  function d3_svg_axisX(selection, x0, x1) {
    selection.attr("transform", function(d) {
      var v0 = x0(d);
      return "translate(" + (isFinite(v0) ? v0 : x1(d)) + ",0)";
    });
  }
  function d3_svg_axisY(selection, y0, y1) {
    selection.attr("transform", function(d) {
      var v0 = y0(d);
      return "translate(0," + (isFinite(v0) ? v0 : y1(d)) + ")";
    });
  }
  d3.svg.brush = function() {
    var event = d3_eventDispatch(brush, "brushstart", "brush", "brushend"), x = null, y = null, xExtent = [ 0, 0 ], yExtent = [ 0, 0 ], xExtentDomain, yExtentDomain, xClamp = true, yClamp = true, resizes = d3_svg_brushResizes[0];
    function brush(g) {
      g.each(function() {
        var g = d3.select(this).style("pointer-events", "all").style("-webkit-tap-highlight-color", "rgba(0,0,0,0)").on("mousedown.brush", brushstart).on("touchstart.brush", brushstart);
        var background = g.selectAll(".background").data([ 0 ]);
        background.enter().append("rect").attr("class", "background").style("visibility", "hidden").style("cursor", "crosshair");
        g.selectAll(".extent").data([ 0 ]).enter().append("rect").attr("class", "extent").style("cursor", "move");
        var resize = g.selectAll(".resize").data(resizes, d3_identity);
        resize.exit().remove();
        resize.enter().append("g").attr("class", function(d) {
          return "resize " + d;
        }).style("cursor", function(d) {
          return d3_svg_brushCursor[d];
        }).append("rect").attr("x", function(d) {
          return /[ew]$/.test(d) ? -3 : null;
        }).attr("y", function(d) {
          return /^[ns]/.test(d) ? -3 : null;
        }).attr("width", 6).attr("height", 6).style("visibility", "hidden");
        resize.style("display", brush.empty() ? "none" : null);
        var gUpdate = d3.transition(g), backgroundUpdate = d3.transition(background), range;
        if (x) {
          range = d3_scaleRange(x);
          backgroundUpdate.attr("x", range[0]).attr("width", range[1] - range[0]);
          redrawX(gUpdate);
        }
        if (y) {
          range = d3_scaleRange(y);
          backgroundUpdate.attr("y", range[0]).attr("height", range[1] - range[0]);
          redrawY(gUpdate);
        }
        redraw(gUpdate);
      });
    }
    brush.event = function(g) {
      g.each(function() {
        var event_ = event.of(this, arguments), extent1 = {
          x: xExtent,
          y: yExtent,
          i: xExtentDomain,
          j: yExtentDomain
        }, extent0 = this.__chart__ || extent1;
        this.__chart__ = extent1;
        if (d3_transitionInheritId) {
          d3.select(this).transition().each("start.brush", function() {
            xExtentDomain = extent0.i;
            yExtentDomain = extent0.j;
            xExtent = extent0.x;
            yExtent = extent0.y;
            event_({
              type: "brushstart"
            });
          }).tween("brush:brush", function() {
            var xi = d3_interpolateArray(xExtent, extent1.x), yi = d3_interpolateArray(yExtent, extent1.y);
            xExtentDomain = yExtentDomain = null;
            return function(t) {
              xExtent = extent1.x = xi(t);
              yExtent = extent1.y = yi(t);
              event_({
                type: "brush",
                mode: "resize"
              });
            };
          }).each("end.brush", function() {
            xExtentDomain = extent1.i;
            yExtentDomain = extent1.j;
            event_({
              type: "brush",
              mode: "resize"
            });
            event_({
              type: "brushend"
            });
          });
        } else {
          event_({
            type: "brushstart"
          });
          event_({
            type: "brush",
            mode: "resize"
          });
          event_({
            type: "brushend"
          });
        }
      });
    };
    function redraw(g) {
      g.selectAll(".resize").attr("transform", function(d) {
        return "translate(" + xExtent[+/e$/.test(d)] + "," + yExtent[+/^s/.test(d)] + ")";
      });
    }
    function redrawX(g) {
      g.select(".extent").attr("x", xExtent[0]);
      g.selectAll(".extent,.n>rect,.s>rect").attr("width", xExtent[1] - xExtent[0]);
    }
    function redrawY(g) {
      g.select(".extent").attr("y", yExtent[0]);
      g.selectAll(".extent,.e>rect,.w>rect").attr("height", yExtent[1] - yExtent[0]);
    }
    function brushstart() {
      var target = this, eventTarget = d3.select(d3.event.target), event_ = event.of(target, arguments), g = d3.select(target), resizing = eventTarget.datum(), resizingX = !/^(n|s)$/.test(resizing) && x, resizingY = !/^(e|w)$/.test(resizing) && y, dragging = eventTarget.classed("extent"), dragRestore = d3_event_dragSuppress(target), center, origin = d3.mouse(target), offset;
      var w = d3.select(d3_window(target)).on("keydown.brush", keydown).on("keyup.brush", keyup);
      if (d3.event.changedTouches) {
        w.on("touchmove.brush", brushmove).on("touchend.brush", brushend);
      } else {
        w.on("mousemove.brush", brushmove).on("mouseup.brush", brushend);
      }
      g.interrupt().selectAll("*").interrupt();
      if (dragging) {
        origin[0] = xExtent[0] - origin[0];
        origin[1] = yExtent[0] - origin[1];
      } else if (resizing) {
        var ex = +/w$/.test(resizing), ey = +/^n/.test(resizing);
        offset = [ xExtent[1 - ex] - origin[0], yExtent[1 - ey] - origin[1] ];
        origin[0] = xExtent[ex];
        origin[1] = yExtent[ey];
      } else if (d3.event.altKey) center = origin.slice();
      g.style("pointer-events", "none").selectAll(".resize").style("display", null);
      d3.select("body").style("cursor", eventTarget.style("cursor"));
      event_({
        type: "brushstart"
      });
      brushmove();
      function keydown() {
        if (d3.event.keyCode == 32) {
          if (!dragging) {
            center = null;
            origin[0] -= xExtent[1];
            origin[1] -= yExtent[1];
            dragging = 2;
          }
          d3_eventPreventDefault();
        }
      }
      function keyup() {
        if (d3.event.keyCode == 32 && dragging == 2) {
          origin[0] += xExtent[1];
          origin[1] += yExtent[1];
          dragging = 0;
          d3_eventPreventDefault();
        }
      }
      function brushmove() {
        var point = d3.mouse(target), moved = false;
        if (offset) {
          point[0] += offset[0];
          point[1] += offset[1];
        }
        if (!dragging) {
          if (d3.event.altKey) {
            if (!center) center = [ (xExtent[0] + xExtent[1]) / 2, (yExtent[0] + yExtent[1]) / 2 ];
            origin[0] = xExtent[+(point[0] < center[0])];
            origin[1] = yExtent[+(point[1] < center[1])];
          } else center = null;
        }
        if (resizingX && move1(point, x, 0)) {
          redrawX(g);
          moved = true;
        }
        if (resizingY && move1(point, y, 1)) {
          redrawY(g);
          moved = true;
        }
        if (moved) {
          redraw(g);
          event_({
            type: "brush",
            mode: dragging ? "move" : "resize"
          });
        }
      }
      function move1(point, scale, i) {
        var range = d3_scaleRange(scale), r0 = range[0], r1 = range[1], position = origin[i], extent = i ? yExtent : xExtent, size = extent[1] - extent[0], min, max;
        if (dragging) {
          r0 -= position;
          r1 -= size + position;
        }
        min = (i ? yClamp : xClamp) ? Math.max(r0, Math.min(r1, point[i])) : point[i];
        if (dragging) {
          max = (min += position) + size;
        } else {
          if (center) position = Math.max(r0, Math.min(r1, 2 * center[i] - min));
          if (position < min) {
            max = min;
            min = position;
          } else {
            max = position;
          }
        }
        if (extent[0] != min || extent[1] != max) {
          if (i) yExtentDomain = null; else xExtentDomain = null;
          extent[0] = min;
          extent[1] = max;
          return true;
        }
      }
      function brushend() {
        brushmove();
        g.style("pointer-events", "all").selectAll(".resize").style("display", brush.empty() ? "none" : null);
        d3.select("body").style("cursor", null);
        w.on("mousemove.brush", null).on("mouseup.brush", null).on("touchmove.brush", null).on("touchend.brush", null).on("keydown.brush", null).on("keyup.brush", null);
        dragRestore();
        event_({
          type: "brushend"
        });
      }
    }
    brush.x = function(z) {
      if (!arguments.length) return x;
      x = z;
      resizes = d3_svg_brushResizes[!x << 1 | !y];
      return brush;
    };
    brush.y = function(z) {
      if (!arguments.length) return y;
      y = z;
      resizes = d3_svg_brushResizes[!x << 1 | !y];
      return brush;
    };
    brush.clamp = function(z) {
      if (!arguments.length) return x && y ? [ xClamp, yClamp ] : x ? xClamp : y ? yClamp : null;
      if (x && y) xClamp = !!z[0], yClamp = !!z[1]; else if (x) xClamp = !!z; else if (y) yClamp = !!z;
      return brush;
    };
    brush.extent = function(z) {
      var x0, x1, y0, y1, t;
      if (!arguments.length) {
        if (x) {
          if (xExtentDomain) {
            x0 = xExtentDomain[0], x1 = xExtentDomain[1];
          } else {
            x0 = xExtent[0], x1 = xExtent[1];
            if (x.invert) x0 = x.invert(x0), x1 = x.invert(x1);
            if (x1 < x0) t = x0, x0 = x1, x1 = t;
          }
        }
        if (y) {
          if (yExtentDomain) {
            y0 = yExtentDomain[0], y1 = yExtentDomain[1];
          } else {
            y0 = yExtent[0], y1 = yExtent[1];
            if (y.invert) y0 = y.invert(y0), y1 = y.invert(y1);
            if (y1 < y0) t = y0, y0 = y1, y1 = t;
          }
        }
        return x && y ? [ [ x0, y0 ], [ x1, y1 ] ] : x ? [ x0, x1 ] : y && [ y0, y1 ];
      }
      if (x) {
        x0 = z[0], x1 = z[1];
        if (y) x0 = x0[0], x1 = x1[0];
        xExtentDomain = [ x0, x1 ];
        if (x.invert) x0 = x(x0), x1 = x(x1);
        if (x1 < x0) t = x0, x0 = x1, x1 = t;
        if (x0 != xExtent[0] || x1 != xExtent[1]) xExtent = [ x0, x1 ];
      }
      if (y) {
        y0 = z[0], y1 = z[1];
        if (x) y0 = y0[1], y1 = y1[1];
        yExtentDomain = [ y0, y1 ];
        if (y.invert) y0 = y(y0), y1 = y(y1);
        if (y1 < y0) t = y0, y0 = y1, y1 = t;
        if (y0 != yExtent[0] || y1 != yExtent[1]) yExtent = [ y0, y1 ];
      }
      return brush;
    };
    brush.clear = function() {
      if (!brush.empty()) {
        xExtent = [ 0, 0 ], yExtent = [ 0, 0 ];
        xExtentDomain = yExtentDomain = null;
      }
      return brush;
    };
    brush.empty = function() {
      return !!x && xExtent[0] == xExtent[1] || !!y && yExtent[0] == yExtent[1];
    };
    return d3.rebind(brush, event, "on");
  };
  var d3_svg_brushCursor = {
    n: "ns-resize",
    e: "ew-resize",
    s: "ns-resize",
    w: "ew-resize",
    nw: "nwse-resize",
    ne: "nesw-resize",
    se: "nwse-resize",
    sw: "nesw-resize"
  };
  var d3_svg_brushResizes = [ [ "n", "e", "s", "w", "nw", "ne", "se", "sw" ], [ "e", "w" ], [ "n", "s" ], [] ];
  var d3_time_format = d3_time.format = d3_locale_enUS.timeFormat;
  var d3_time_formatUtc = d3_time_format.utc;
  var d3_time_formatIso = d3_time_formatUtc("%Y-%m-%dT%H:%M:%S.%LZ");
  d3_time_format.iso = Date.prototype.toISOString && +new Date("2000-01-01T00:00:00.000Z") ? d3_time_formatIsoNative : d3_time_formatIso;
  function d3_time_formatIsoNative(date) {
    return date.toISOString();
  }
  d3_time_formatIsoNative.parse = function(string) {
    var date = new Date(string);
    return isNaN(date) ? null : date;
  };
  d3_time_formatIsoNative.toString = d3_time_formatIso.toString;
  d3_time.second = d3_time_interval(function(date) {
    return new d3_date(Math.floor(date / 1e3) * 1e3);
  }, function(date, offset) {
    date.setTime(date.getTime() + Math.floor(offset) * 1e3);
  }, function(date) {
    return date.getSeconds();
  });
  d3_time.seconds = d3_time.second.range;
  d3_time.seconds.utc = d3_time.second.utc.range;
  d3_time.minute = d3_time_interval(function(date) {
    return new d3_date(Math.floor(date / 6e4) * 6e4);
  }, function(date, offset) {
    date.setTime(date.getTime() + Math.floor(offset) * 6e4);
  }, function(date) {
    return date.getMinutes();
  });
  d3_time.minutes = d3_time.minute.range;
  d3_time.minutes.utc = d3_time.minute.utc.range;
  d3_time.hour = d3_time_interval(function(date) {
    var timezone = date.getTimezoneOffset() / 60;
    return new d3_date((Math.floor(date / 36e5 - timezone) + timezone) * 36e5);
  }, function(date, offset) {
    date.setTime(date.getTime() + Math.floor(offset) * 36e5);
  }, function(date) {
    return date.getHours();
  });
  d3_time.hours = d3_time.hour.range;
  d3_time.hours.utc = d3_time.hour.utc.range;
  d3_time.month = d3_time_interval(function(date) {
    date = d3_time.day(date);
    date.setDate(1);
    return date;
  }, function(date, offset) {
    date.setMonth(date.getMonth() + offset);
  }, function(date) {
    return date.getMonth();
  });
  d3_time.months = d3_time.month.range;
  d3_time.months.utc = d3_time.month.utc.range;
  function d3_time_scale(linear, methods, format) {
    function scale(x) {
      return linear(x);
    }
    scale.invert = function(x) {
      return d3_time_scaleDate(linear.invert(x));
    };
    scale.domain = function(x) {
      if (!arguments.length) return linear.domain().map(d3_time_scaleDate);
      linear.domain(x);
      return scale;
    };
    function tickMethod(extent, count) {
      var span = extent[1] - extent[0], target = span / count, i = d3.bisect(d3_time_scaleSteps, target);
      return i == d3_time_scaleSteps.length ? [ methods.year, d3_scale_linearTickRange(extent.map(function(d) {
        return d / 31536e6;
      }), count)[2] ] : !i ? [ d3_time_scaleMilliseconds, d3_scale_linearTickRange(extent, count)[2] ] : methods[target / d3_time_scaleSteps[i - 1] < d3_time_scaleSteps[i] / target ? i - 1 : i];
    }
    scale.nice = function(interval, skip) {
      var domain = scale.domain(), extent = d3_scaleExtent(domain), method = interval == null ? tickMethod(extent, 10) : typeof interval === "number" && tickMethod(extent, interval);
      if (method) interval = method[0], skip = method[1];
      function skipped(date) {
        return !isNaN(date) && !interval.range(date, d3_time_scaleDate(+date + 1), skip).length;
      }
      return scale.domain(d3_scale_nice(domain, skip > 1 ? {
        floor: function(date) {
          while (skipped(date = interval.floor(date))) date = d3_time_scaleDate(date - 1);
          return date;
        },
        ceil: function(date) {
          while (skipped(date = interval.ceil(date))) date = d3_time_scaleDate(+date + 1);
          return date;
        }
      } : interval));
    };
    scale.ticks = function(interval, skip) {
      var extent = d3_scaleExtent(scale.domain()), method = interval == null ? tickMethod(extent, 10) : typeof interval === "number" ? tickMethod(extent, interval) : !interval.range && [ {
        range: interval
      }, skip ];
      if (method) interval = method[0], skip = method[1];
      return interval.range(extent[0], d3_time_scaleDate(+extent[1] + 1), skip < 1 ? 1 : skip);
    };
    scale.tickFormat = function() {
      return format;
    };
    scale.copy = function() {
      return d3_time_scale(linear.copy(), methods, format);
    };
    return d3_scale_linearRebind(scale, linear);
  }
  function d3_time_scaleDate(t) {
    return new Date(t);
  }
  var d3_time_scaleSteps = [ 1e3, 5e3, 15e3, 3e4, 6e4, 3e5, 9e5, 18e5, 36e5, 108e5, 216e5, 432e5, 864e5, 1728e5, 6048e5, 2592e6, 7776e6, 31536e6 ];
  var d3_time_scaleLocalMethods = [ [ d3_time.second, 1 ], [ d3_time.second, 5 ], [ d3_time.second, 15 ], [ d3_time.second, 30 ], [ d3_time.minute, 1 ], [ d3_time.minute, 5 ], [ d3_time.minute, 15 ], [ d3_time.minute, 30 ], [ d3_time.hour, 1 ], [ d3_time.hour, 3 ], [ d3_time.hour, 6 ], [ d3_time.hour, 12 ], [ d3_time.day, 1 ], [ d3_time.day, 2 ], [ d3_time.week, 1 ], [ d3_time.month, 1 ], [ d3_time.month, 3 ], [ d3_time.year, 1 ] ];
  var d3_time_scaleLocalFormat = d3_time_format.multi([ [ ".%L", function(d) {
    return d.getMilliseconds();
  } ], [ ":%S", function(d) {
    return d.getSeconds();
  } ], [ "%I:%M", function(d) {
    return d.getMinutes();
  } ], [ "%I %p", function(d) {
    return d.getHours();
  } ], [ "%a %d", function(d) {
    return d.getDay() && d.getDate() != 1;
  } ], [ "%b %d", function(d) {
    return d.getDate() != 1;
  } ], [ "%B", function(d) {
    return d.getMonth();
  } ], [ "%Y", d3_true ] ]);
  var d3_time_scaleMilliseconds = {
    range: function(start, stop, step) {
      return d3.range(Math.ceil(start / step) * step, +stop, step).map(d3_time_scaleDate);
    },
    floor: d3_identity,
    ceil: d3_identity
  };
  d3_time_scaleLocalMethods.year = d3_time.year;
  d3_time.scale = function() {
    return d3_time_scale(d3.scale.linear(), d3_time_scaleLocalMethods, d3_time_scaleLocalFormat);
  };
  var d3_time_scaleUtcMethods = d3_time_scaleLocalMethods.map(function(m) {
    return [ m[0].utc, m[1] ];
  });
  var d3_time_scaleUtcFormat = d3_time_formatUtc.multi([ [ ".%L", function(d) {
    return d.getUTCMilliseconds();
  } ], [ ":%S", function(d) {
    return d.getUTCSeconds();
  } ], [ "%I:%M", function(d) {
    return d.getUTCMinutes();
  } ], [ "%I %p", function(d) {
    return d.getUTCHours();
  } ], [ "%a %d", function(d) {
    return d.getUTCDay() && d.getUTCDate() != 1;
  } ], [ "%b %d", function(d) {
    return d.getUTCDate() != 1;
  } ], [ "%B", function(d) {
    return d.getUTCMonth();
  } ], [ "%Y", d3_true ] ]);
  d3_time_scaleUtcMethods.year = d3_time.year.utc;
  d3_time.scale.utc = function() {
    return d3_time_scale(d3.scale.linear(), d3_time_scaleUtcMethods, d3_time_scaleUtcFormat);
  };
  d3.text = d3_xhrType(function(request) {
    return request.responseText;
  });
  d3.json = function(url, callback) {
    return d3_xhr(url, "application/json", d3_json, callback);
  };
  function d3_json(request) {
    return JSON.parse(request.responseText);
  }
  d3.html = function(url, callback) {
    return d3_xhr(url, "text/html", d3_html, callback);
  };
  function d3_html(request) {
    var range = d3_document.createRange();
    range.selectNode(d3_document.body);
    return range.createContextualFragment(request.responseText);
  }
  d3.xml = d3_xhrType(function(request) {
    return request.responseXML;
  });
  if (typeof define === "function" && define.amd) define('d3',d3); else if (typeof module === "object" && module.exports) module.exports = d3;
  this.d3 = d3;
}();
(function(root) {
define("crossfilter", ["d3"], function() {
  return (function() {
(function(exports){
crossfilter.version = "1.3.11";
function crossfilter_identity(d) {
  return d;
}
crossfilter.permute = permute;

function permute(array, index) {
  for (var i = 0, n = index.length, copy = new Array(n); i < n; ++i) {
    copy[i] = array[index[i]];
  }
  return copy;
}
var bisect = crossfilter.bisect = bisect_by(crossfilter_identity);

bisect.by = bisect_by;

function bisect_by(f) {

  // Locate the insertion point for x in a to maintain sorted order. The
  // arguments lo and hi may be used to specify a subset of the array which
  // should be considered; by default the entire array is used. If x is already
  // present in a, the insertion point will be before (to the left of) any
  // existing entries. The return value is suitable for use as the first
  // argument to `array.splice` assuming that a is already sorted.
  //
  // The returned insertion point i partitions the array a into two halves so
  // that all v < x for v in a[lo:i] for the left side and all v >= x for v in
  // a[i:hi] for the right side.
  function bisectLeft(a, x, lo, hi) {
    while (lo < hi) {
      var mid = lo + hi >>> 1;
      if (f(a[mid]) < x) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  // Similar to bisectLeft, but returns an insertion point which comes after (to
  // the right of) any existing entries of x in a.
  //
  // The returned insertion point i partitions the array into two halves so that
  // all v <= x for v in a[lo:i] for the left side and all v > x for v in
  // a[i:hi] for the right side.
  function bisectRight(a, x, lo, hi) {
    while (lo < hi) {
      var mid = lo + hi >>> 1;
      if (x < f(a[mid])) hi = mid;
      else lo = mid + 1;
    }
    return lo;
  }

  bisectRight.right = bisectRight;
  bisectRight.left = bisectLeft;
  return bisectRight;
}
var heap = crossfilter.heap = heap_by(crossfilter_identity);

heap.by = heap_by;

function heap_by(f) {

  // Builds a binary heap within the specified array a[lo:hi]. The heap has the
  // property such that the parent a[lo+i] is always less than or equal to its
  // two children: a[lo+2*i+1] and a[lo+2*i+2].
  function heap(a, lo, hi) {
    var n = hi - lo,
        i = (n >>> 1) + 1;
    while (--i > 0) sift(a, i, n, lo);
    return a;
  }

  // Sorts the specified array a[lo:hi] in descending order, assuming it is
  // already a heap.
  function sort(a, lo, hi) {
    var n = hi - lo,
        t;
    while (--n > 0) t = a[lo], a[lo] = a[lo + n], a[lo + n] = t, sift(a, 1, n, lo);
    return a;
  }

  // Sifts the element a[lo+i-1] down the heap, where the heap is the contiguous
  // slice of array a[lo:lo+n]. This method can also be used to update the heap
  // incrementally, without incurring the full cost of reconstructing the heap.
  function sift(a, i, n, lo) {
    var d = a[--lo + i],
        x = f(d),
        child;
    while ((child = i << 1) <= n) {
      if (child < n && f(a[lo + child]) > f(a[lo + child + 1])) child++;
      if (x <= f(a[lo + child])) break;
      a[lo + i] = a[lo + child];
      i = child;
    }
    a[lo + i] = d;
  }

  heap.sort = sort;
  return heap;
}
var heapselect = crossfilter.heapselect = heapselect_by(crossfilter_identity);

heapselect.by = heapselect_by;

function heapselect_by(f) {
  var heap = heap_by(f);

  // Returns a new array containing the top k elements in the array a[lo:hi].
  // The returned array is not sorted, but maintains the heap property. If k is
  // greater than hi - lo, then fewer than k elements will be returned. The
  // order of elements in a is unchanged by this operation.
  function heapselect(a, lo, hi, k) {
    var queue = new Array(k = Math.min(hi - lo, k)),
        min,
        i,
        x,
        d;

    for (i = 0; i < k; ++i) queue[i] = a[lo++];
    heap(queue, 0, k);

    if (lo < hi) {
      min = f(queue[0]);
      do {
        if (x = f(d = a[lo]) > min) {
          queue[0] = d;
          min = f(heap(queue, 0, k)[0]);
        }
      } while (++lo < hi);
    }

    return queue;
  }

  return heapselect;
}
var insertionsort = crossfilter.insertionsort = insertionsort_by(crossfilter_identity);

insertionsort.by = insertionsort_by;

function insertionsort_by(f) {

  function insertionsort(a, lo, hi) {
    for (var i = lo + 1; i < hi; ++i) {
      for (var j = i, t = a[i], x = f(t); j > lo && f(a[j - 1]) > x; --j) {
        a[j] = a[j - 1];
      }
      a[j] = t;
    }
    return a;
  }

  return insertionsort;
}
// Algorithm designed by Vladimir Yaroslavskiy.
// Implementation based on the Dart project; see lib/dart/LICENSE for details.

var quicksort = crossfilter.quicksort = quicksort_by(crossfilter_identity);

quicksort.by = quicksort_by;

function quicksort_by(f) {
  var insertionsort = insertionsort_by(f);

  function sort(a, lo, hi) {
    return (hi - lo < quicksort_sizeThreshold
        ? insertionsort
        : quicksort)(a, lo, hi);
  }

  function quicksort(a, lo, hi) {
    // Compute the two pivots by looking at 5 elements.
    var sixth = (hi - lo) / 6 | 0,
        i1 = lo + sixth,
        i5 = hi - 1 - sixth,
        i3 = lo + hi - 1 >> 1,  // The midpoint.
        i2 = i3 - sixth,
        i4 = i3 + sixth;

    var e1 = a[i1], x1 = f(e1),
        e2 = a[i2], x2 = f(e2),
        e3 = a[i3], x3 = f(e3),
        e4 = a[i4], x4 = f(e4),
        e5 = a[i5], x5 = f(e5);

    var t;

    // Sort the selected 5 elements using a sorting network.
    if (x1 > x2) t = e1, e1 = e2, e2 = t, t = x1, x1 = x2, x2 = t;
    if (x4 > x5) t = e4, e4 = e5, e5 = t, t = x4, x4 = x5, x5 = t;
    if (x1 > x3) t = e1, e1 = e3, e3 = t, t = x1, x1 = x3, x3 = t;
    if (x2 > x3) t = e2, e2 = e3, e3 = t, t = x2, x2 = x3, x3 = t;
    if (x1 > x4) t = e1, e1 = e4, e4 = t, t = x1, x1 = x4, x4 = t;
    if (x3 > x4) t = e3, e3 = e4, e4 = t, t = x3, x3 = x4, x4 = t;
    if (x2 > x5) t = e2, e2 = e5, e5 = t, t = x2, x2 = x5, x5 = t;
    if (x2 > x3) t = e2, e2 = e3, e3 = t, t = x2, x2 = x3, x3 = t;
    if (x4 > x5) t = e4, e4 = e5, e5 = t, t = x4, x4 = x5, x5 = t;

    var pivot1 = e2, pivotValue1 = x2,
        pivot2 = e4, pivotValue2 = x4;

    // e2 and e4 have been saved in the pivot variables. They will be written
    // back, once the partitioning is finished.
    a[i1] = e1;
    a[i2] = a[lo];
    a[i3] = e3;
    a[i4] = a[hi - 1];
    a[i5] = e5;

    var less = lo + 1,   // First element in the middle partition.
        great = hi - 2;  // Last element in the middle partition.

    // Note that for value comparison, <, <=, >= and > coerce to a primitive via
    // Object.prototype.valueOf; == and === do not, so in order to be consistent
    // with natural order (such as for Date objects), we must do two compares.
    var pivotsEqual = pivotValue1 <= pivotValue2 && pivotValue1 >= pivotValue2;
    if (pivotsEqual) {

      // Degenerated case where the partitioning becomes a dutch national flag
      // problem.
      //
      // [ |  < pivot  | == pivot | unpartitioned | > pivot  | ]
      //  ^             ^          ^             ^            ^
      // left         less         k           great         right
      //
      // a[left] and a[right] are undefined and are filled after the
      // partitioning.
      //
      // Invariants:
      //   1) for x in ]left, less[ : x < pivot.
      //   2) for x in [less, k[ : x == pivot.
      //   3) for x in ]great, right[ : x > pivot.
      for (var k = less; k <= great; ++k) {
        var ek = a[k], xk = f(ek);
        if (xk < pivotValue1) {
          if (k !== less) {
            a[k] = a[less];
            a[less] = ek;
          }
          ++less;
        } else if (xk > pivotValue1) {

          // Find the first element <= pivot in the range [k - 1, great] and
          // put [:ek:] there. We know that such an element must exist:
          // When k == less, then el3 (which is equal to pivot) lies in the
          // interval. Otherwise a[k - 1] == pivot and the search stops at k-1.
          // Note that in the latter case invariant 2 will be violated for a
          // short amount of time. The invariant will be restored when the
          // pivots are put into their final positions.
          while (true) {
            var greatValue = f(a[great]);
            if (greatValue > pivotValue1) {
              great--;
              // This is the only location in the while-loop where a new
              // iteration is started.
              continue;
            } else if (greatValue < pivotValue1) {
              // Triple exchange.
              a[k] = a[less];
              a[less++] = a[great];
              a[great--] = ek;
              break;
            } else {
              a[k] = a[great];
              a[great--] = ek;
              // Note: if great < k then we will exit the outer loop and fix
              // invariant 2 (which we just violated).
              break;
            }
          }
        }
      }
    } else {

      // We partition the list into three parts:
      //  1. < pivot1
      //  2. >= pivot1 && <= pivot2
      //  3. > pivot2
      //
      // During the loop we have:
      // [ | < pivot1 | >= pivot1 && <= pivot2 | unpartitioned  | > pivot2  | ]
      //  ^            ^                        ^              ^             ^
      // left         less                     k              great        right
      //
      // a[left] and a[right] are undefined and are filled after the
      // partitioning.
      //
      // Invariants:
      //   1. for x in ]left, less[ : x < pivot1
      //   2. for x in [less, k[ : pivot1 <= x && x <= pivot2
      //   3. for x in ]great, right[ : x > pivot2
      for (var k = less; k <= great; k++) {
        var ek = a[k], xk = f(ek);
        if (xk < pivotValue1) {
          if (k !== less) {
            a[k] = a[less];
            a[less] = ek;
          }
          ++less;
        } else {
          if (xk > pivotValue2) {
            while (true) {
              var greatValue = f(a[great]);
              if (greatValue > pivotValue2) {
                great--;
                if (great < k) break;
                // This is the only location inside the loop where a new
                // iteration is started.
                continue;
              } else {
                // a[great] <= pivot2.
                if (greatValue < pivotValue1) {
                  // Triple exchange.
                  a[k] = a[less];
                  a[less++] = a[great];
                  a[great--] = ek;
                } else {
                  // a[great] >= pivot1.
                  a[k] = a[great];
                  a[great--] = ek;
                }
                break;
              }
            }
          }
        }
      }
    }

    // Move pivots into their final positions.
    // We shrunk the list from both sides (a[left] and a[right] have
    // meaningless values in them) and now we move elements from the first
    // and third partition into these locations so that we can store the
    // pivots.
    a[lo] = a[less - 1];
    a[less - 1] = pivot1;
    a[hi - 1] = a[great + 1];
    a[great + 1] = pivot2;

    // The list is now partitioned into three partitions:
    // [ < pivot1   | >= pivot1 && <= pivot2   |  > pivot2   ]
    //  ^            ^                        ^             ^
    // left         less                     great        right

    // Recursive descent. (Don't include the pivot values.)
    sort(a, lo, less - 1);
    sort(a, great + 2, hi);

    if (pivotsEqual) {
      // All elements in the second partition are equal to the pivot. No
      // need to sort them.
      return a;
    }

    // In theory it should be enough to call _doSort recursively on the second
    // partition.
    // The Android source however removes the pivot elements from the recursive
    // call if the second partition is too large (more than 2/3 of the list).
    if (less < i1 && great > i5) {
      var lessValue, greatValue;
      while ((lessValue = f(a[less])) <= pivotValue1 && lessValue >= pivotValue1) ++less;
      while ((greatValue = f(a[great])) <= pivotValue2 && greatValue >= pivotValue2) --great;

      // Copy paste of the previous 3-way partitioning with adaptions.
      //
      // We partition the list into three parts:
      //  1. == pivot1
      //  2. > pivot1 && < pivot2
      //  3. == pivot2
      //
      // During the loop we have:
      // [ == pivot1 | > pivot1 && < pivot2 | unpartitioned  | == pivot2 ]
      //              ^                      ^              ^
      //            less                     k              great
      //
      // Invariants:
      //   1. for x in [ *, less[ : x == pivot1
      //   2. for x in [less, k[ : pivot1 < x && x < pivot2
      //   3. for x in ]great, * ] : x == pivot2
      for (var k = less; k <= great; k++) {
        var ek = a[k], xk = f(ek);
        if (xk <= pivotValue1 && xk >= pivotValue1) {
          if (k !== less) {
            a[k] = a[less];
            a[less] = ek;
          }
          less++;
        } else {
          if (xk <= pivotValue2 && xk >= pivotValue2) {
            while (true) {
              var greatValue = f(a[great]);
              if (greatValue <= pivotValue2 && greatValue >= pivotValue2) {
                great--;
                if (great < k) break;
                // This is the only location inside the loop where a new
                // iteration is started.
                continue;
              } else {
                // a[great] < pivot2.
                if (greatValue < pivotValue1) {
                  // Triple exchange.
                  a[k] = a[less];
                  a[less++] = a[great];
                  a[great--] = ek;
                } else {
                  // a[great] == pivot1.
                  a[k] = a[great];
                  a[great--] = ek;
                }
                break;
              }
            }
          }
        }
      }
    }

    // The second partition has now been cleared of pivot elements and looks
    // as follows:
    // [  *  |  > pivot1 && < pivot2  | * ]
    //        ^                      ^
    //       less                  great
    // Sort the second partition using recursive descent.

    // The second partition looks as follows:
    // [  *  |  >= pivot1 && <= pivot2  | * ]
    //        ^                        ^
    //       less                    great
    // Simply sort it by recursive descent.

    return sort(a, less, great + 1);
  }

  return sort;
}

var quicksort_sizeThreshold = 32;
var crossfilter_array8 = crossfilter_arrayUntyped,
    crossfilter_array16 = crossfilter_arrayUntyped,
    crossfilter_array32 = crossfilter_arrayUntyped,
    crossfilter_arrayLengthen = crossfilter_arrayLengthenUntyped,
    crossfilter_arrayWiden = crossfilter_arrayWidenUntyped;

if (typeof Uint8Array !== "undefined") {
  crossfilter_array8 = function(n) { return new Uint8Array(n); };
  crossfilter_array16 = function(n) { return new Uint16Array(n); };
  crossfilter_array32 = function(n) { return new Uint32Array(n); };

  crossfilter_arrayLengthen = function(array, length) {
    if (array.length >= length) return array;
    var copy = new array.constructor(length);
    copy.set(array);
    return copy;
  };

  crossfilter_arrayWiden = function(array, width) {
    var copy;
    switch (width) {
      case 16: copy = crossfilter_array16(array.length); break;
      case 32: copy = crossfilter_array32(array.length); break;
      default: throw new Error("invalid array width!");
    }
    copy.set(array);
    return copy;
  };
}

function crossfilter_arrayUntyped(n) {
  var array = new Array(n), i = -1;
  while (++i < n) array[i] = 0;
  return array;
}

function crossfilter_arrayLengthenUntyped(array, length) {
  var n = array.length;
  while (n < length) array[n++] = 0;
  return array;
}

function crossfilter_arrayWidenUntyped(array, width) {
  if (width > 32) throw new Error("invalid array width!");
  return array;
}
function crossfilter_filterExact(bisect, value) {
  return function(values) {
    var n = values.length;
    return [bisect.left(values, value, 0, n), bisect.right(values, value, 0, n)];
  };
}

function crossfilter_filterRange(bisect, range) {
  var min = range[0],
      max = range[1];
  return function(values) {
    var n = values.length;
    return [bisect.left(values, min, 0, n), bisect.left(values, max, 0, n)];
  };
}

function crossfilter_filterAll(values) {
  return [0, values.length];
}
function crossfilter_null() {
  return null;
}
function crossfilter_zero() {
  return 0;
}
function crossfilter_reduceIncrement(p) {
  return p + 1;
}

function crossfilter_reduceDecrement(p) {
  return p - 1;
}

function crossfilter_reduceAdd(f) {
  return function(p, v) {
    return p + +f(v);
  };
}

function crossfilter_reduceSubtract(f) {
  return function(p, v) {
    return p - f(v);
  };
}
exports.crossfilter = crossfilter;

function crossfilter() {
  var crossfilter = {
    add: add,
    remove: removeData,
    dimension: dimension,
    groupAll: groupAll,
    size: size
  };

  var data = [], // the records
      n = 0, // the number of records; data.length
      m = 0, // a bit mask representing which dimensions are in use
      M = 8, // number of dimensions that can fit in `filters`
      filters = crossfilter_array8(0), // M bits per record; 1 is filtered out
      filterListeners = [], // when the filters change
      dataListeners = [], // when data is added
      removeDataListeners = []; // when data is removed

  // Adds the specified new records to this crossfilter.
  function add(newData) {
    var n0 = n,
        n1 = newData.length;

    // If there's actually new data to add…
    // Merge the new data into the existing data.
    // Lengthen the filter bitset to handle the new records.
    // Notify listeners (dimensions and groups) that new data is available.
    if (n1) {
      data = data.concat(newData);
      filters = crossfilter_arrayLengthen(filters, n += n1);
      dataListeners.forEach(function(l) { l(newData, n0, n1); });
    }

    return crossfilter;
  }

  // Removes all records that match the current filters.
  function removeData() {
    var newIndex = crossfilter_index(n, n),
        removed = [];
    for (var i = 0, j = 0; i < n; ++i) {
      if (filters[i]) newIndex[i] = j++;
      else removed.push(i);
    }

    // Remove all matching records from groups.
    filterListeners.forEach(function(l) { l(0, [], removed); });

    // Update indexes.
    removeDataListeners.forEach(function(l) { l(newIndex); });

    // Remove old filters and data by overwriting.
    for (var i = 0, j = 0, k; i < n; ++i) {
      if (k = filters[i]) {
        if (i !== j) filters[j] = k, data[j] = data[i];
        ++j;
      }
    }
    data.length = j;
    while (n > j) filters[--n] = 0;
  }

  // Adds a new dimension with the specified value accessor function.
  function dimension(value) {
    var dimension = {
      filter: filter,
      filterExact: filterExact,
      filterRange: filterRange,
      filterFunction: filterFunction,
      filterAll: filterAll,
      top: top,
      bottom: bottom,
      group: group,
      groupAll: groupAll,
      dispose: dispose,
      remove: dispose // for backwards-compatibility
    };

    var one = ~m & -~m, // lowest unset bit as mask, e.g., 00001000
        zero = ~one, // inverted one, e.g., 11110111
        values, // sorted, cached array
        index, // value rank ↦ object id
        newValues, // temporary array storing newly-added values
        newIndex, // temporary array storing newly-added index
        sort = quicksort_by(function(i) { return newValues[i]; }),
        refilter = crossfilter_filterAll, // for recomputing filter
        refilterFunction, // the custom filter function in use
        indexListeners = [], // when data is added
        dimensionGroups = [],
        lo0 = 0,
        hi0 = 0;

    // Updating a dimension is a two-stage process. First, we must update the
    // associated filters for the newly-added records. Once all dimensions have
    // updated their filters, the groups are notified to update.
    dataListeners.unshift(preAdd);
    dataListeners.push(postAdd);

    removeDataListeners.push(removeData);

    // Incorporate any existing data into this dimension, and make sure that the
    // filter bitset is wide enough to handle the new dimension.
    m |= one;
    if (M >= 32 ? !one : m & (1 << M) - 1) {
      filters = crossfilter_arrayWiden(filters, M <<= 1);
    }
    preAdd(data, 0, n);
    postAdd(data, 0, n);

    // Incorporates the specified new records into this dimension.
    // This function is responsible for updating filters, values, and index.
    function preAdd(newData, n0, n1) {

      // Permute new values into natural order using a sorted index.
      newValues = newData.map(value);
      newIndex = sort(crossfilter_range(n1), 0, n1);
      newValues = permute(newValues, newIndex);

      // Bisect newValues to determine which new records are selected.
      var bounds = refilter(newValues), lo1 = bounds[0], hi1 = bounds[1], i;
      if (refilterFunction) {
        for (i = 0; i < n1; ++i) {
          if (!refilterFunction(newValues[i], i)) filters[newIndex[i] + n0] |= one;
        }
      } else {
        for (i = 0; i < lo1; ++i) filters[newIndex[i] + n0] |= one;
        for (i = hi1; i < n1; ++i) filters[newIndex[i] + n0] |= one;
      }

      // If this dimension previously had no data, then we don't need to do the
      // more expensive merge operation; use the new values and index as-is.
      if (!n0) {
        values = newValues;
        index = newIndex;
        lo0 = lo1;
        hi0 = hi1;
        return;
      }

      var oldValues = values,
          oldIndex = index,
          i0 = 0,
          i1 = 0;

      // Otherwise, create new arrays into which to merge new and old.
      values = new Array(n);
      index = crossfilter_index(n, n);

      // Merge the old and new sorted values, and old and new index.
      for (i = 0; i0 < n0 && i1 < n1; ++i) {
        if (oldValues[i0] < newValues[i1]) {
          values[i] = oldValues[i0];
          index[i] = oldIndex[i0++];
        } else {
          values[i] = newValues[i1];
          index[i] = newIndex[i1++] + n0;
        }
      }

      // Add any remaining old values.
      for (; i0 < n0; ++i0, ++i) {
        values[i] = oldValues[i0];
        index[i] = oldIndex[i0];
      }

      // Add any remaining new values.
      for (; i1 < n1; ++i1, ++i) {
        values[i] = newValues[i1];
        index[i] = newIndex[i1] + n0;
      }

      // Bisect again to recompute lo0 and hi0.
      bounds = refilter(values), lo0 = bounds[0], hi0 = bounds[1];
    }

    // When all filters have updated, notify index listeners of the new values.
    function postAdd(newData, n0, n1) {
      indexListeners.forEach(function(l) { l(newValues, newIndex, n0, n1); });
      newValues = newIndex = null;
    }

    function removeData(reIndex) {
      for (var i = 0, j = 0, k; i < n; ++i) {
        if (filters[k = index[i]]) {
          if (i !== j) values[j] = values[i];
          index[j] = reIndex[k];
          ++j;
        }
      }
      values.length = j;
      while (j < n) index[j++] = 0;

      // Bisect again to recompute lo0 and hi0.
      var bounds = refilter(values);
      lo0 = bounds[0], hi0 = bounds[1];
    }

    // Updates the selected values based on the specified bounds [lo, hi].
    // This implementation is used by all the public filter methods.
    function filterIndexBounds(bounds) {
      var lo1 = bounds[0],
          hi1 = bounds[1];

      if (refilterFunction) {
        refilterFunction = null;
        filterIndexFunction(function(d, i) { return lo1 <= i && i < hi1; });
        lo0 = lo1;
        hi0 = hi1;
        return dimension;
      }

      var i,
          j,
          k,
          added = [],
          removed = [];

      // Fast incremental update based on previous lo index.
      if (lo1 < lo0) {
        for (i = lo1, j = Math.min(lo0, hi1); i < j; ++i) {
          filters[k = index[i]] ^= one;
          added.push(k);
        }
      } else if (lo1 > lo0) {
        for (i = lo0, j = Math.min(lo1, hi0); i < j; ++i) {
          filters[k = index[i]] ^= one;
          removed.push(k);
        }
      }

      // Fast incremental update based on previous hi index.
      if (hi1 > hi0) {
        for (i = Math.max(lo1, hi0), j = hi1; i < j; ++i) {
          filters[k = index[i]] ^= one;
          added.push(k);
        }
      } else if (hi1 < hi0) {
        for (i = Math.max(lo0, hi1), j = hi0; i < j; ++i) {
          filters[k = index[i]] ^= one;
          removed.push(k);
        }
      }

      lo0 = lo1;
      hi0 = hi1;
      filterListeners.forEach(function(l) { l(one, added, removed); });
      return dimension;
    }

    // Filters this dimension using the specified range, value, or null.
    // If the range is null, this is equivalent to filterAll.
    // If the range is an array, this is equivalent to filterRange.
    // Otherwise, this is equivalent to filterExact.
    function filter(range) {
      return range == null
          ? filterAll() : Array.isArray(range)
          ? filterRange(range) : typeof range === "function"
          ? filterFunction(range)
          : filterExact(range);
    }

    // Filters this dimension to select the exact value.
    function filterExact(value) {
      return filterIndexBounds((refilter = crossfilter_filterExact(bisect, value))(values));
    }

    // Filters this dimension to select the specified range [lo, hi].
    // The lower bound is inclusive, and the upper bound is exclusive.
    function filterRange(range) {
      return filterIndexBounds((refilter = crossfilter_filterRange(bisect, range))(values));
    }

    // Clears any filters on this dimension.
    function filterAll() {
      return filterIndexBounds((refilter = crossfilter_filterAll)(values));
    }

    // Filters this dimension using an arbitrary function.
    function filterFunction(f) {
      refilter = crossfilter_filterAll;

      filterIndexFunction(refilterFunction = f);

      lo0 = 0;
      hi0 = n;

      return dimension;
    }

    function filterIndexFunction(f) {
      var i,
          k,
          x,
          added = [],
          removed = [];

      for (i = 0; i < n; ++i) {
        if (!(filters[k = index[i]] & one) ^ !!(x = f(values[i], i))) {
          if (x) filters[k] &= zero, added.push(k);
          else filters[k] |= one, removed.push(k);
        }
      }
      filterListeners.forEach(function(l) { l(one, added, removed); });
    }

    // Returns the top K selected records based on this dimension's order.
    // Note: observes this dimension's filter, unlike group and groupAll.
    function top(k) {
      var array = [],
          i = hi0,
          j;

      while (--i >= lo0 && k > 0) {
        if (!filters[j = index[i]]) {
          array.push(data[j]);
          --k;
        }
      }

      return array;
    }

    // Returns the bottom K selected records based on this dimension's order.
    // Note: observes this dimension's filter, unlike group and groupAll.
    function bottom(k) {
      var array = [],
          i = lo0,
          j;

      while (i < hi0 && k > 0) {
        if (!filters[j = index[i]]) {
          array.push(data[j]);
          --k;
        }
        i++;
      }

      return array;
    }

    // Adds a new group to this dimension, using the specified key function.
    function group(key) {
      var group = {
        top: top,
        all: all,
        reduce: reduce,
        reduceCount: reduceCount,
        reduceSum: reduceSum,
        order: order,
        orderNatural: orderNatural,
        size: size,
        dispose: dispose,
        remove: dispose // for backwards-compatibility
      };

      // Ensure that this group will be removed when the dimension is removed.
      dimensionGroups.push(group);

      var groups, // array of {key, value}
          groupIndex, // object id ↦ group id
          groupWidth = 8,
          groupCapacity = crossfilter_capacity(groupWidth),
          k = 0, // cardinality
          select,
          heap,
          reduceAdd,
          reduceRemove,
          reduceInitial,
          update = crossfilter_null,
          reset = crossfilter_null,
          resetNeeded = true,
          groupAll = key === crossfilter_null;

      if (arguments.length < 1) key = crossfilter_identity;

      // The group listens to the crossfilter for when any dimension changes, so
      // that it can update the associated reduce values. It must also listen to
      // the parent dimension for when data is added, and compute new keys.
      filterListeners.push(update);
      indexListeners.push(add);
      removeDataListeners.push(removeData);

      // Incorporate any existing data into the grouping.
      add(values, index, 0, n);

      // Incorporates the specified new values into this group.
      // This function is responsible for updating groups and groupIndex.
      function add(newValues, newIndex, n0, n1) {
        var oldGroups = groups,
            reIndex = crossfilter_index(k, groupCapacity),
            add = reduceAdd,
            initial = reduceInitial,
            k0 = k, // old cardinality
            i0 = 0, // index of old group
            i1 = 0, // index of new record
            j, // object id
            g0, // old group
            x0, // old key
            x1, // new key
            g, // group to add
            x; // key of group to add

        // If a reset is needed, we don't need to update the reduce values.
        if (resetNeeded) add = initial = crossfilter_null;

        // Reset the new groups (k is a lower bound).
        // Also, make sure that groupIndex exists and is long enough.
        groups = new Array(k), k = 0;
        groupIndex = k0 > 1 ? crossfilter_arrayLengthen(groupIndex, n) : crossfilter_index(n, groupCapacity);

        // Get the first old key (x0 of g0), if it exists.
        if (k0) x0 = (g0 = oldGroups[0]).key;

        // Find the first new key (x1), skipping NaN keys.
        while (i1 < n1 && !((x1 = key(newValues[i1])) >= x1)) ++i1;

        // While new keys remain…
        while (i1 < n1) {

          // Determine the lesser of the two current keys; new and old.
          // If there are no old keys remaining, then always add the new key.
          if (g0 && x0 <= x1) {
            g = g0, x = x0;

            // Record the new index of the old group.
            reIndex[i0] = k;

            // Retrieve the next old key.
            if (g0 = oldGroups[++i0]) x0 = g0.key;
          } else {
            g = {key: x1, value: initial()}, x = x1;
          }

          // Add the lesser group.
          groups[k] = g;

          // Add any selected records belonging to the added group, while
          // advancing the new key and populating the associated group index.
          while (!(x1 > x)) {
            groupIndex[j = newIndex[i1] + n0] = k;
            if (!(filters[j] & zero)) g.value = add(g.value, data[j]);
            if (++i1 >= n1) break;
            x1 = key(newValues[i1]);
          }

          groupIncrement();
        }

        // Add any remaining old groups that were greater than all new keys.
        // No incremental reduce is needed; these groups have no new records.
        // Also record the new index of the old group.
        while (i0 < k0) {
          groups[reIndex[i0] = k] = oldGroups[i0++];
          groupIncrement();
        }

        // If we added any new groups before any old groups,
        // update the group index of all the old records.
        if (k > i0) for (i0 = 0; i0 < n0; ++i0) {
          groupIndex[i0] = reIndex[groupIndex[i0]];
        }

        // Modify the update and reset behavior based on the cardinality.
        // If the cardinality is less than or equal to one, then the groupIndex
        // is not needed. If the cardinality is zero, then there are no records
        // and therefore no groups to update or reset. Note that we also must
        // change the registered listener to point to the new method.
        j = filterListeners.indexOf(update);
        if (k > 1) {
          update = updateMany;
          reset = resetMany;
        } else {
          if (!k && groupAll) {
            k = 1;
            groups = [{key: null, value: initial()}];
          }
          if (k === 1) {
            update = updateOne;
            reset = resetOne;
          } else {
            update = crossfilter_null;
            reset = crossfilter_null;
          }
          groupIndex = null;
        }
        filterListeners[j] = update;

        // Count the number of added groups,
        // and widen the group index as needed.
        function groupIncrement() {
          if (++k === groupCapacity) {
            reIndex = crossfilter_arrayWiden(reIndex, groupWidth <<= 1);
            groupIndex = crossfilter_arrayWiden(groupIndex, groupWidth);
            groupCapacity = crossfilter_capacity(groupWidth);
          }
        }
      }

      function removeData() {
        if (k > 1) {
          var oldK = k,
              oldGroups = groups,
              seenGroups = crossfilter_index(oldK, oldK);

          // Filter out non-matches by copying matching group index entries to
          // the beginning of the array.
          for (var i = 0, j = 0; i < n; ++i) {
            if (filters[i]) {
              seenGroups[groupIndex[j] = groupIndex[i]] = 1;
              ++j;
            }
          }

          // Reassemble groups including only those groups that were referred
          // to by matching group index entries.  Note the new group index in
          // seenGroups.
          groups = [], k = 0;
          for (i = 0; i < oldK; ++i) {
            if (seenGroups[i]) {
              seenGroups[i] = k++;
              groups.push(oldGroups[i]);
            }
          }

          if (k > 1) {
            // Reindex the group index using seenGroups to find the new index.
            for (var i = 0; i < j; ++i) groupIndex[i] = seenGroups[groupIndex[i]];
          } else {
            groupIndex = null;
          }
          filterListeners[filterListeners.indexOf(update)] = k > 1
              ? (reset = resetMany, update = updateMany)
              : k === 1 ? (reset = resetOne, update = updateOne)
              : reset = update = crossfilter_null;
        } else if (k === 1) {
          if (groupAll) return;
          for (var i = 0; i < n; ++i) if (filters[i]) return;
          groups = [], k = 0;
          filterListeners[filterListeners.indexOf(update)] =
          update = reset = crossfilter_null;
        }
      }

      // Reduces the specified selected or deselected records.
      // This function is only used when the cardinality is greater than 1.
      function updateMany(filterOne, added, removed) {
        if (filterOne === one || resetNeeded) return;

        var i,
            k,
            n,
            g;

        // Add the added values.
        for (i = 0, n = added.length; i < n; ++i) {
          if (!(filters[k = added[i]] & zero)) {
            g = groups[groupIndex[k]];
            g.value = reduceAdd(g.value, data[k]);
          }
        }

        // Remove the removed values.
        for (i = 0, n = removed.length; i < n; ++i) {
          if ((filters[k = removed[i]] & zero) === filterOne) {
            g = groups[groupIndex[k]];
            g.value = reduceRemove(g.value, data[k]);
          }
        }
      }

      // Reduces the specified selected or deselected records.
      // This function is only used when the cardinality is 1.
      function updateOne(filterOne, added, removed) {
        if (filterOne === one || resetNeeded) return;

        var i,
            k,
            n,
            g = groups[0];

        // Add the added values.
        for (i = 0, n = added.length; i < n; ++i) {
          if (!(filters[k = added[i]] & zero)) {
            g.value = reduceAdd(g.value, data[k]);
          }
        }

        // Remove the removed values.
        for (i = 0, n = removed.length; i < n; ++i) {
          if ((filters[k = removed[i]] & zero) === filterOne) {
            g.value = reduceRemove(g.value, data[k]);
          }
        }
      }

      // Recomputes the group reduce values from scratch.
      // This function is only used when the cardinality is greater than 1.
      function resetMany() {
        var i,
            g;

        // Reset all group values.
        for (i = 0; i < k; ++i) {
          groups[i].value = reduceInitial();
        }

        // Add any selected records.
        for (i = 0; i < n; ++i) {
          if (!(filters[i] & zero)) {
            g = groups[groupIndex[i]];
            g.value = reduceAdd(g.value, data[i]);
          }
        }
      }

      // Recomputes the group reduce values from scratch.
      // This function is only used when the cardinality is 1.
      function resetOne() {
        var i,
            g = groups[0];

        // Reset the singleton group values.
        g.value = reduceInitial();

        // Add any selected records.
        for (i = 0; i < n; ++i) {
          if (!(filters[i] & zero)) {
            g.value = reduceAdd(g.value, data[i]);
          }
        }
      }

      // Returns the array of group values, in the dimension's natural order.
      function all() {
        if (resetNeeded) reset(), resetNeeded = false;
        return groups;
      }

      // Returns a new array containing the top K group values, in reduce order.
      function top(k) {
        var top = select(all(), 0, groups.length, k);
        return heap.sort(top, 0, top.length);
      }

      // Sets the reduce behavior for this group to use the specified functions.
      // This method lazily recomputes the reduce values, waiting until needed.
      function reduce(add, remove, initial) {
        reduceAdd = add;
        reduceRemove = remove;
        reduceInitial = initial;
        resetNeeded = true;
        return group;
      }

      // A convenience method for reducing by count.
      function reduceCount() {
        return reduce(crossfilter_reduceIncrement, crossfilter_reduceDecrement, crossfilter_zero);
      }

      // A convenience method for reducing by sum(value).
      function reduceSum(value) {
        return reduce(crossfilter_reduceAdd(value), crossfilter_reduceSubtract(value), crossfilter_zero);
      }

      // Sets the reduce order, using the specified accessor.
      function order(value) {
        select = heapselect_by(valueOf);
        heap = heap_by(valueOf);
        function valueOf(d) { return value(d.value); }
        return group;
      }

      // A convenience method for natural ordering by reduce value.
      function orderNatural() {
        return order(crossfilter_identity);
      }

      // Returns the cardinality of this group, irrespective of any filters.
      function size() {
        return k;
      }

      // Removes this group and associated event listeners.
      function dispose() {
        var i = filterListeners.indexOf(update);
        if (i >= 0) filterListeners.splice(i, 1);
        i = indexListeners.indexOf(add);
        if (i >= 0) indexListeners.splice(i, 1);
        i = removeDataListeners.indexOf(removeData);
        if (i >= 0) removeDataListeners.splice(i, 1);
        return group;
      }

      return reduceCount().orderNatural();
    }

    // A convenience function for generating a singleton group.
    function groupAll() {
      var g = group(crossfilter_null), all = g.all;
      delete g.all;
      delete g.top;
      delete g.order;
      delete g.orderNatural;
      delete g.size;
      g.value = function() { return all()[0].value; };
      return g;
    }

    // Removes this dimension and associated groups and event listeners.
    function dispose() {
      dimensionGroups.forEach(function(group) { group.dispose(); });
      var i = dataListeners.indexOf(preAdd);
      if (i >= 0) dataListeners.splice(i, 1);
      i = dataListeners.indexOf(postAdd);
      if (i >= 0) dataListeners.splice(i, 1);
      i = removeDataListeners.indexOf(removeData);
      if (i >= 0) removeDataListeners.splice(i, 1);
      m &= zero;
      return filterAll();
    }

    return dimension;
  }

  // A convenience method for groupAll on a dummy dimension.
  // This implementation can be optimized since it always has cardinality 1.
  function groupAll() {
    var group = {
      reduce: reduce,
      reduceCount: reduceCount,
      reduceSum: reduceSum,
      value: value,
      dispose: dispose,
      remove: dispose // for backwards-compatibility
    };

    var reduceValue,
        reduceAdd,
        reduceRemove,
        reduceInitial,
        resetNeeded = true;

    // The group listens to the crossfilter for when any dimension changes, so
    // that it can update the reduce value. It must also listen to the parent
    // dimension for when data is added.
    filterListeners.push(update);
    dataListeners.push(add);

    // For consistency; actually a no-op since resetNeeded is true.
    add(data, 0, n);

    // Incorporates the specified new values into this group.
    function add(newData, n0) {
      var i;

      if (resetNeeded) return;

      // Add the added values.
      for (i = n0; i < n; ++i) {
        if (!filters[i]) {
          reduceValue = reduceAdd(reduceValue, data[i]);
        }
      }
    }

    // Reduces the specified selected or deselected records.
    function update(filterOne, added, removed) {
      var i,
          k,
          n;

      if (resetNeeded) return;

      // Add the added values.
      for (i = 0, n = added.length; i < n; ++i) {
        if (!filters[k = added[i]]) {
          reduceValue = reduceAdd(reduceValue, data[k]);
        }
      }

      // Remove the removed values.
      for (i = 0, n = removed.length; i < n; ++i) {
        if (filters[k = removed[i]] === filterOne) {
          reduceValue = reduceRemove(reduceValue, data[k]);
        }
      }
    }

    // Recomputes the group reduce value from scratch.
    function reset() {
      var i;

      reduceValue = reduceInitial();

      for (i = 0; i < n; ++i) {
        if (!filters[i]) {
          reduceValue = reduceAdd(reduceValue, data[i]);
        }
      }
    }

    // Sets the reduce behavior for this group to use the specified functions.
    // This method lazily recomputes the reduce value, waiting until needed.
    function reduce(add, remove, initial) {
      reduceAdd = add;
      reduceRemove = remove;
      reduceInitial = initial;
      resetNeeded = true;
      return group;
    }

    // A convenience method for reducing by count.
    function reduceCount() {
      return reduce(crossfilter_reduceIncrement, crossfilter_reduceDecrement, crossfilter_zero);
    }

    // A convenience method for reducing by sum(value).
    function reduceSum(value) {
      return reduce(crossfilter_reduceAdd(value), crossfilter_reduceSubtract(value), crossfilter_zero);
    }

    // Returns the computed reduce value.
    function value() {
      if (resetNeeded) reset(), resetNeeded = false;
      return reduceValue;
    }

    // Removes this group and associated event listeners.
    function dispose() {
      var i = filterListeners.indexOf(update);
      if (i >= 0) filterListeners.splice(i);
      i = dataListeners.indexOf(add);
      if (i >= 0) dataListeners.splice(i);
      return group;
    }

    return reduceCount();
  }

  // Returns the number of records in this crossfilter, irrespective of any filters.
  function size() {
    return n;
  }

  return arguments.length
      ? add(arguments[0])
      : crossfilter;
}

// Returns an array of size n, big enough to store ids up to m.
function crossfilter_index(n, m) {
  return (m < 0x101
      ? crossfilter_array8 : m < 0x10001
      ? crossfilter_array16
      : crossfilter_array32)(n);
}

// Constructs a new array of size n, with sequential values from 0 to n - 1.
function crossfilter_range(n) {
  var range = crossfilter_index(n, n);
  for (var i = -1; ++i < n;) range[i] = i;
  return range;
}

function crossfilter_capacity(w) {
  return w === 8
      ? 0x100 : w === 16
      ? 0x10000
      : 0x100000000;
}
})(typeof exports !== 'undefined' && exports || this);

return root.crossfilter = crossfilter;
  }).apply(root, arguments);
});
}(this));

define('text',["module"],function(module){var text,fs,Cc,Ci,xpcIsWindows,progIds=["Msxml2.XMLHTTP","Microsoft.XMLHTTP","Msxml2.XMLHTTP.4.0"],xmlRegExp=/^\s*<\?xml(\s)+version=[\'\"](\d)*.(\d)*[\'\"](\s)*\?>/im,bodyRegExp=/<body[^>]*>\s*([\s\S]+)\s*<\/body>/im,hasLocation=typeof location!=="undefined"&&location.href,defaultProtocol=hasLocation&&location.protocol&&location.protocol.replace(/\:/,""),defaultHostName=hasLocation&&location.hostname,defaultPort=hasLocation&&(location.port||undefined),buildMap={},masterConfig=(module.config&&module.config())||{};text={version:"2.0.12",strip:function(content){if(content){content=content.replace(xmlRegExp,"");var matches=content.match(bodyRegExp);if(matches){content=matches[1]}}else{content=""}return content},jsEscape:function(content){return content.replace(/(['\\])/g,"\\$1").replace(/[\f]/g,"\\f").replace(/[\b]/g,"\\b").replace(/[\n]/g,"\\n").replace(/[\t]/g,"\\t").replace(/[\r]/g,"\\r").replace(/[\u2028]/g,"\\u2028").replace(/[\u2029]/g,"\\u2029")},createXhr:masterConfig.createXhr||function(){var xhr,i,progId;if(typeof XMLHttpRequest!=="undefined"){return new XMLHttpRequest()}else{if(typeof ActiveXObject!=="undefined"){for(i=0;i<3;i+=1){progId=progIds[i];try{xhr=new ActiveXObject(progId)}catch(e){}if(xhr){progIds=[progId];break}}}}return xhr},parseName:function(name){var modName,ext,temp,strip=false,index=name.indexOf("."),isRelative=name.indexOf("./")===0||name.indexOf("../")===0;if(index!==-1&&(!isRelative||index>1)){modName=name.substring(0,index);ext=name.substring(index+1,name.length)}else{modName=name}temp=ext||modName;index=temp.indexOf("!");if(index!==-1){strip=temp.substring(index+1)==="strip";temp=temp.substring(0,index);if(ext){ext=temp}else{modName=temp}}return{moduleName:modName,ext:ext,strip:strip}},xdRegExp:/^((\w+)\:)?\/\/([^\/\\]+)/,useXhr:function(url,protocol,hostname,port){var uProtocol,uHostName,uPort,match=text.xdRegExp.exec(url);if(!match){return true}uProtocol=match[2];uHostName=match[3];uHostName=uHostName.split(":");uPort=uHostName[1];uHostName=uHostName[0];return(!uProtocol||uProtocol===protocol)&&(!uHostName||uHostName.toLowerCase()===hostname.toLowerCase())&&((!uPort&&!uHostName)||uPort===port)},finishLoad:function(name,strip,content,onLoad){content=strip?text.strip(content):content;if(masterConfig.isBuild){buildMap[name]=content}onLoad(content)},load:function(name,req,onLoad,config){if(config&&config.isBuild&&!config.inlineText){onLoad();return}masterConfig.isBuild=config&&config.isBuild;var parsed=text.parseName(name),nonStripName=parsed.moduleName+(parsed.ext?"."+parsed.ext:""),url=req.toUrl(nonStripName),useXhr=(masterConfig.useXhr)||text.useXhr;if(url.indexOf("empty:")===0){onLoad();return}if(!hasLocation||useXhr(url,defaultProtocol,defaultHostName,defaultPort)){text.get(url,function(content){text.finishLoad(name,parsed.strip,content,onLoad)},function(err){if(onLoad.error){onLoad.error(err)}})}else{req([nonStripName],function(content){text.finishLoad(parsed.moduleName+"."+parsed.ext,parsed.strip,content,onLoad)})}},write:function(pluginName,moduleName,write,config){if(buildMap.hasOwnProperty(moduleName)){var content=text.jsEscape(buildMap[moduleName]);write.asModule(pluginName+"!"+moduleName,"define(function () { return '"+content+"';});\n")}},writeFile:function(pluginName,moduleName,req,write,config){var parsed=text.parseName(moduleName),extPart=parsed.ext?"."+parsed.ext:"",nonStripName=parsed.moduleName+extPart,fileName=req.toUrl(parsed.moduleName+extPart)+".js";text.load(nonStripName,req,function(value){var textWrite=function(contents){return write(fileName,contents)};textWrite.asModule=function(moduleName,contents){return write.asModule(moduleName,fileName,contents)};text.write(pluginName,nonStripName,textWrite,config)},config)}};if(masterConfig.env==="node"||(!masterConfig.env&&typeof process!=="undefined"&&process.versions&&!!process.versions.node&&!process.versions["node-webkit"])){fs=require.nodeRequire("fs");text.get=function(url,callback,errback){try{var file=fs.readFileSync(url,"utf8");if(file.indexOf("\uFEFF")===0){file=file.substring(1)}callback(file)}catch(e){if(errback){errback(e)}}}}else{if(masterConfig.env==="xhr"||(!masterConfig.env&&text.createXhr())){text.get=function(url,callback,errback,headers){var xhr=text.createXhr(),header;xhr.open("GET",url,true);if(headers){for(header in headers){if(headers.hasOwnProperty(header)){xhr.setRequestHeader(header.toLowerCase(),headers[header])}}}if(masterConfig.onXhr){masterConfig.onXhr(xhr,url)}xhr.onreadystatechange=function(evt){var status,err;if(xhr.readyState===4){status=xhr.status||0;if(status>399&&status<600){err=new Error(url+" HTTP status: "+status);err.xhr=xhr;if(errback){errback(err)}}else{callback(xhr.responseText)}if(masterConfig.onXhrComplete){masterConfig.onXhrComplete(xhr,url)}}};xhr.send(null)}}else{if(masterConfig.env==="rhino"||(!masterConfig.env&&typeof Packages!=="undefined"&&typeof java!=="undefined")){text.get=function(url,callback){var stringBuffer,line,encoding="utf-8",file=new java.io.File(url),lineSeparator=java.lang.System.getProperty("line.separator"),input=new java.io.BufferedReader(new java.io.InputStreamReader(new java.io.FileInputStream(file),encoding)),content="";try{stringBuffer=new java.lang.StringBuffer();line=input.readLine();if(line&&line.length()&&line.charAt(0)===65279){line=line.substring(1)}if(line!==null){stringBuffer.append(line)}while((line=input.readLine())!==null){stringBuffer.append(lineSeparator);stringBuffer.append(line)}content=String(stringBuffer.toString())}finally{input.close()}callback(content)}}else{if(masterConfig.env==="xpconnect"||(!masterConfig.env&&typeof Components!=="undefined"&&Components.classes&&Components.interfaces)){Cc=Components.classes;Ci=Components.interfaces;Components.utils["import"]("resource://gre/modules/FileUtils.jsm");xpcIsWindows=("@mozilla.org/windows-registry-key;1" in Cc);text.get=function(url,callback){var inStream,convertStream,fileObj,readData={};if(xpcIsWindows){url=url.replace(/\//g,"\\")}fileObj=new FileUtils.File(url);try{inStream=Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream);inStream.init(fileObj,1,0,false);convertStream=Cc["@mozilla.org/intl/converter-input-stream;1"].createInstance(Ci.nsIConverterInputStream);convertStream.init(inStream,"utf-8",inStream.available(),Ci.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER);convertStream.readString(inStream.available(),readData);convertStream.close();inStream.close();callback(readData.value)}catch(e){throw new Error((fileObj&&fileObj.path||"")+": "+e)}}}}}}return text});

/*
 * Copyright (c) 2015 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/BarChartInfoView',[
    'underscore',
    'contrail-view'
],function(_,ContrailView) {
    var BarChartInfoView = ContrailView.extend({
        el: ".chart",
        chart: null,
        chartSelection: null,
        initialize: function(options) {
            var self = this;
            self.options = options;
            self.$el.append($('<div/>',{
                class:'infobox-container'
            }));
        },
        renderInfoboxes: function() {
            var self = this;
            var infoChartCfg = getValueByJsonPath(self,'attributes;viewConfig;config',[],false);
            var totalCntModel = getValueByJsonPath(self,'attributes;viewConfig;totalCntModel',null,false);
            var data = self.model.getItems();
            var dataCF = crossfilter(data);
            var chartInfoTmpl = contrail.getTemplate4Id(cowc.TMPL_CHARTINFO);
            var totalCntMap = {};
            //Sum-up each field across all records
            $.each(data,function(idx,obj) {
                for(var i=0;i<infoChartCfg.length;i++) {
                    var currField = infoChartCfg[i]['field'];
                    if(idx == 0) {
                        totalCntMap[currField] = 0;
                    }
                    totalCntMap[currField] += obj[currField]
                }
            });

            self.$el.find('.infobox-container').html('');
            for(var i=0;i<infoChartCfg.length;i++) {
                var currCfg = infoChartCfg[i];
                var chartCfg = {
                    title : currCfg['title'],
                    totalCnt: totalCntModel.has(currCfg['field']) ? '' : totalCntMap[currCfg['field']]
                };
                self.$el.find('.infobox-container').append(chartInfoTmpl(chartCfg));
                var currElem = self.$el.find('.infobox-container .infobox:last');
                if(totalCntModel.has(currCfg['field'])) {
                    $(currElem).find('.infobox-data-number').text(totalCntModel.get(currCfg['field']));
                    totalCntModel.on('change',function(updatedModel) {
                        $(currElem).find('.infobox-data-number').text(updatedModel.get(currCfg['field']));
                    })
                }
                var sparkLineData = bucketizeCFData(dataCF,function(d) {
                    return d[currCfg['field']];
                });
                //Draw sparkline
                chUtils.drawSparkLineBar(currElem.find('.sparkline')[0], {
                    data: sparkLineData['data'],
                    xLbl: currCfg['title'],
                    yLbl: currCfg['yLbl']
                });
            }
        },
        render: function() {
            var self = this;
            //Need to initialize crossfilter with model
            //If model is already populated
            if(self.model.isRequestInProgress() == false) {
                self.renderInfoboxes();
            }
            self.model.onDataUpdate.subscribe(function() {
                self.renderInfoboxes();
            });
        }
    });
    return BarChartInfoView;
});

/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/BreadcrumbDropdownView',[
    'underscore',
    'contrail-view',
    'contrail-list-model'
], function (_, ContrailView, ContrailListModel) {
    var BreadcrumbDropdownView = ContrailView.extend({
        render: function () {
            var self = this,
                viewConfig = self.attributes.viewConfig,
                ajaxConfig = viewConfig['ajaxConfig'],
                deferredObj = $.Deferred();

            if (self.model === null && viewConfig['modelConfig'] !== null) {
                self.model = new ContrailListModel(viewConfig['modelConfig']);
            }

            if (self.model !== null) {
                if(self.model.loadedFromCache || !(self.model.isRequestInProgress())) {
                    self.renderBreadcrumbDropdown();
                }

                self.model.onAllRequestsComplete.subscribe(function() {
                    self.renderBreadcrumbDropdown();
                });

                if(viewConfig.loadChartInChunks) {
                    self.model.onDataUpdate.subscribe(function() {
                        self.renderBreadcrumbDropdown();
                    });
                }
            } else {
                self.renderBreadcrumbDropdown();
            }
        },

        renderBreadcrumbDropdown: function() {
            var self = this,
                viewConfig = self.attributes.viewConfig,
                dropdownOptions = viewConfig.dropdownOptions,
                parentSelectedValueData = contrail.checkIfExist(dropdownOptions.parentSelectedValueData) ? dropdownOptions.parentSelectedValueData : null,
                dropdownData = (self.model === null) ? [] : self.model.getItems(),
                dropdownElementId = self.attributes.elementId;

            if (contrail.checkIfExist(dropdownOptions.allDropdownOption)) {
                dropdownData = dropdownOptions.allDropdownOption.concat(dropdownData);
            }

            if (dropdownData.length > 0) {
                var selectedValueData = null,
                    urlValue = contrail.checkIfExist(dropdownOptions.urlValue) ? dropdownOptions.urlValue : null,
                    cookieKey = contrail.checkIfExist(dropdownOptions.cookieKey) ? dropdownOptions.cookieKey : null,
                    cookieValue = contrail.getCookie(cookieKey),
                    urlDataKey = null, cookieDataKey = null;

                $.each(dropdownData, function (key, value) {
                    if (urlValue == value.name) {
                        urlDataKey = key;
                    }

                    if (cookieValue == value.name) {
                        cookieDataKey = key;
                    }
                });

                if(urlValue != null && urlDataKey == null) {
                    var notFoundTemplate = contrail.getTemplate4Id(cowc.TMPL_NOT_FOUND_MESSAGE),
                        notFoundConfig = $.extend(true, {}, cowc.DEFAULT_CONFIG_NOT_FOUND_PAGE, {errorMessage: urlValue + ' was not found.'});

                    $(contentContainer).html(notFoundTemplate(notFoundConfig));
                } else {
                    var onBreadcrumbDropdownChange = function(selectedValueData, dropdownOptions, type) {
                            var cookieKey = contrail.checkIfExist(dropdownOptions.cookieKey) ? dropdownOptions.cookieKey : null,
                                childViewConfig = null;

                            selectedValueData.parentSelectedValueData = parentSelectedValueData;

                            if (contrail.checkIfExist(dropdownOptions.childView)) {
                                type = (contrail.checkIfExist(dropdownOptions.childView[type]) ? type : 'init');
                                if (contrail.checkIfFunction(dropdownOptions.childView[type])) {
                                    childViewConfig = dropdownOptions.childView[type](selectedValueData);
                                } else if (!$.isEmptyObject(dropdownOptions.childView[type])) {
                                    childViewConfig = dropdownOptions.childView[type];
                                }
                            }

                            if (cookieKey !== null) {
                                contrail.setCookie(cookieKey, selectedValueData.name);
                            }

                            if (childViewConfig !== null) {
                                self.renderView4Config(self.$el, null, childViewConfig);
                            }
                        },
                        dropdownElement = constructBreadcrumbDropdownDOM(dropdownElementId, dropdownData, dropdownOptions, onBreadcrumbDropdownChange);

                    selectedValueData = (selectedValueData == null && urlDataKey != null) ? dropdownData[urlDataKey] : selectedValueData;
                    selectedValueData = (selectedValueData == null && cookieDataKey != null) ? dropdownData[cookieDataKey] : selectedValueData;
                    selectedValueData = (selectedValueData == null) ? dropdownData[0] : selectedValueData;

                    dropdownElement.data('contrailDropdown').text(selectedValueData.name);
                    if(dropdownOptions.preSelectCB != null && typeof(dropdownOptions.preSelectCB) == 'function') {
                        $.when(dropdownOptions.preSelectCB(selectedValueData)).always(function() {
                            onBreadcrumbDropdownChange(selectedValueData, dropdownOptions, 'init')
                        });
                    } else {
                            onBreadcrumbDropdownChange(selectedValueData, dropdownOptions, 'init')
                    }
                }


            } else {
                var notFoundTemplate = contrail.getTemplate4Id(cowc.TMPL_NOT_FOUND_MESSAGE),
                    notFoundConfig = $.extend(true, {}, cowc.DEFAULT_CONFIG_NOT_FOUND_PAGE, {title: cowm.DATA_SUCCESS_EMPTY});

                $(contentContainer).html(notFoundTemplate(notFoundConfig));
            }
        }
    });

    function constructBreadcrumbDropdownDOM (breadcrumbDropdownId, dropdownData, dropdownOptions, onBreadcrumbDropdownChange) {
        var breadcrumbElement = $('#' + cowl.BREADCRUMB_ID);

        destroyBreadcrumbDropdownDOM(breadcrumbDropdownId);

        breadcrumbElement.children('li').removeClass('active');
        breadcrumbElement.children('li:last').append('<span class="divider breadcrumb-divider"><i class="icon-angle-right"></i></span>');
        breadcrumbElement.append('<li class="active breadcrumb-item"><div id="' + breadcrumbDropdownId + '" class="breadcrumb-dropdown"></div></li>');

        return $('#' + breadcrumbDropdownId).contrailDropdown({
            dataTextField: "name",
            dataValueField: "value",
            data: dropdownData,
            dropdownCssClass: 'min-width-150',
            selecting: function (e) {
                var selectedValueData = {
                    name: e.object['name'],
                    value: e.object['value']
                };

                if(dropdownOptions.preSelectCB != null && typeof(dropdownOptions.preSelectCB) == 'function') {
                    //Wrapping the return value inside $.when to handle the case if the function doesn't return a deferred object
                    $.when(dropdownOptions.preSelectCB(selectedValueData)).done(function() {
                        if(contrail.checkIfFunction(dropdownOptions.changeCB)) {
                            dropdownOptions.changeCB(selectedValueData)
                        }

                        destroyNextAllBreadcrumbDropdown (breadcrumbDropdownId);
                        onBreadcrumbDropdownChange(selectedValueData, dropdownOptions, 'change');

                    });
                } else {
                    if(contrail.checkIfFunction(dropdownOptions.changeCB)) {
                        dropdownOptions.changeCB(selectedValueData)
                    }

                    destroyNextAllBreadcrumbDropdown (breadcrumbDropdownId);
                    onBreadcrumbDropdownChange(selectedValueData, dropdownOptions, 'change');
                }

            }
        });
    };

    function destroyBreadcrumbDropdownDOM (breadcrumbDropdownId){
        if (contrail.checkIfExist($('#' + breadcrumbDropdownId).data('contrailDropdown'))) {

            var breadcrumbLiElement = $('#' + breadcrumbDropdownId).parent(),
                breadcrumbDivider = breadcrumbLiElement.prev().find('.divider');

            breadcrumbLiElement.find('.breadcrumb-divider').remove();
            breadcrumbLiElement.nextAll('.breadcrumb-item').remove();

            $('#' + breadcrumbDropdownId).data('contrailDropdown').destroy();
            if(breadcrumbLiElement.hasClass('active')) {
                breadcrumbLiElement.prev().addClass('active')
            }
            breadcrumbDivider.remove();
            breadcrumbLiElement.remove();
        }
    };

    function destroyNextAllBreadcrumbDropdown (breadcrumbDropdownId){
        if (contrail.checkIfExist($('#' + breadcrumbDropdownId).data('contrailDropdown'))) {

            var breadcrumbLiElement = $('#' + breadcrumbDropdownId).parent();
            breadcrumbLiElement.find('.breadcrumb-divider').remove();
            breadcrumbLiElement.nextAll('.breadcrumb-item').remove();
        }
    };

    return BreadcrumbDropdownView;
});

/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/BreadcrumbTextView',[
    'underscore',
    'contrail-view'
], function (_, ContrailView) {
    var BreadcrumbTextView = ContrailView.extend({
        render: function () {
            var self = this,
                viewConfig = self.attributes.viewConfig,
                textOptions = viewConfig.textOptions,
                parentSelectedValueData = textOptions.parentSelectedValueData,
                textElementId = self.attributes.elementId,
                childViewConfig = null;

            if (contrail.checkIfExist(textOptions.childView)) {
                if (contrail.checkIfFunction(textOptions.childView.init)) {
                    childViewConfig = textOptions.childView.init({}, parentSelectedValueData);
                } else if (!$.isEmptyObject(textOptions.childView.init)) {
                    childViewConfig = textOptions.childView.init;
                }
            };

            constructBreadcrumbText(textElementId, textOptions);

            self.renderView4Config(self.$el, null, childViewConfig);
        },
    });

    function constructBreadcrumbText (breadcrumbTextId, textOptions) {
        var breadcrumbElement = $('#' + cowl.BREADCRUMB_ID),
            urlValue = textOptions.urlValue;

        destroyBreadcrumbText(breadcrumbTextId);

        breadcrumbElement.children('li').removeClass('active');
        breadcrumbElement.children('li:last').append('<span class="divider breadcrumb-divider"><i class="icon-angle-right"></i></span>');
        breadcrumbElement.append('<li class="active breadcrumb-item"><a id="' + breadcrumbTextId + '" class="breadcrumb-text" title="' + urlValue + '">' + urlValue + '</a></li>');

        return $('#' + breadcrumbTextId);
    };

    function destroyBreadcrumbText (breadcrumbTextId){
        if ($('#' + breadcrumbTextId).length > 0) {

            var breadcrumbLiElement = $('#' + breadcrumbTextId).parent(),
                breadcrumbDivider = breadcrumbLiElement.prev().find('.divider');

            if(breadcrumbLiElement.hasClass('active')) {
                breadcrumbLiElement.prev().addClass('active')
            }
            breadcrumbDivider.remove();
            breadcrumbLiElement.remove();
        }
    };

    return BreadcrumbTextView;
});
/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/ChartView',[
    'underscore',
    'contrail-view'
], function (_, ContrailView) {
    var ChartView = ContrailView.extend({
        render: function () {
            var loadingSpinnerTemplate = contrail.getTemplate4Id(cowc.TMPL_LOADING_SPINNER),
                viewConfig = this.attributes.viewConfig,
                ajaxConfig = viewConfig['ajaxConfig'],
                self = this, deferredObj = $.Deferred();

            self.$el.append(loadingSpinnerTemplate);

            $.ajax(ajaxConfig).done(function (result) {
                deferredObj.resolve(result);
            });

            deferredObj.done(function (response) {
                if (contrail.checkIfFunction(viewConfig['parseFn'])) {
                    response = viewConfig['parseFn'](response);
                }
                self.$el[viewConfig['renderFn']](response);
                self.$el.find('.loading-spinner').remove()
            });

            deferredObj.fail(function (errObject) {
                if (errObject['errTxt'] != null && errObject['errTxt'] != 'abort') {
                    showMessageInChart({selector: $(self.$el), msg: 'Error in fetching Details', type: 'bubblechart'});
                }
            });
        }
    });

    return ChartView;
});
/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/ControlPanelView',[
    'underscore',
    'contrail-view'
], function (_, ContrailView) {
    var ControlPanelView = ContrailView.extend({
        render: function() {
            var self = this,
                controlPanelTemplate = contrail.getTemplate4Id(cowc.TMPL_CONTROL_PANEL),
                viewConfig = self.attributes.viewConfig,
                controlPanelSelector = self.el;

            $(controlPanelSelector).html(controlPanelTemplate(viewConfig));

            if (contrail.checkIfKeyExistInObject(true, viewConfig, 'default.zoom.enabled') && viewConfig.default.zoom.enabled) {
                viewConfig.default.zoom.events(controlPanelSelector);
            }

            if (contrail.checkIfExist(viewConfig.custom)) {
                $.each(viewConfig.custom, function(configKey, configValue) {
                    var controlPanelElementSelector = $(controlPanelSelector).find('.' + configKey);

                    $.each(configValue.events, function(eventKey, eventValue) {
                        controlPanelElementSelector
                            .off(eventKey)
                            .on(eventKey, function(e) {
                                if (!$(this).hasClass('disabled') && !$(this).hasClass('refreshing')) {
                                    $(controlPanelSelector).find('.control-panel-item').addClass('disabled');
                                    $(this).removeClass('disabled').addClass('refreshing');
                                    eventValue(e, this, controlPanelSelector);
                                }
                            });
                    });
                });

                var closeFn = function(event) {
                    var chartControlPanelExpandedSelector = $(controlPanelSelector).parent().find('.control-panel-expanded-container');

                    if (chartControlPanelExpandedSelector.is(':visible') && $(event.target).closest(chartControlPanelExpandedSelector).length == 0) {
                        chartControlPanelExpandedSelector.hide();

                        $(controlPanelSelector).find('.control-panel-item')
                            .removeClass('active')
                            .removeClass('refreshing')
                            .removeClass('disabled');
                    }
                };

                $(document)
                    .off('click', closeFn)
                    .on('click', closeFn);
            }
        }
    });

    return ControlPanelView;
});

/*
 * Copyright (c) 2015 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/InfoboxesView',[
    'underscore',
    'backbone'
], function (_, Backbone) {
    var InfoboxesView = Backbone.View.extend({
        initialize: function() {
            var self = this;
            self.loadedInfoboxes = [];

            self.$el.append(contrail.getTemplate4Id(cowc.TMPL_INFOBOXES_VIEW)());
            self.$el.find("[data-action='refresh']").on('click',function() {
                for(var len=self.loadedInfoboxes.length,i=0;i < len;i++) {
                    var currInfobox = self.loadedInfoboxes[i];
                    currInfobox['model'].refreshData();
                }
            });

            //Add click listener for infoboxes to show/hide the respective container
            self.$el.find('.infobox-container').on('click','.infobox',function() {
                var tabIdx = $(this).index('.infobox');
                //Hide all infobox detail containers and show the one corresponding
                //to clicked infobox.
                self.$el.find('.infobox-detail-container').
                    find('.infobox-detail-item').hide();
                $(self.$el.find('.infobox-detail-container').
                    find('.infobox-detail-item')[tabIdx]).show();
                //Highlight the selected infobox
                self.$el.find('.infobox').removeClass('infobox-blue').
                    removeClass('infobox-dark active').addClass('infobox-grey');
                $(self.$el.find('.infobox')[tabIdx]).removeClass('infobox-grey').
                    addClass('infobox-blue infobox-dark active');
                $(window).resize();
            });
        },

        add: function(cfg) {
            var self = this;
            self.loadedInfoboxes.push(cfg);
            var infoboxTemplate = contrail.getTemplate4Id(cowc.TMPL_INFOBOX);
            self.$el.find('.infobox-container').append(infoboxTemplate(cfg));
            self.$el.find('.infobox-detail-container').append($('<div>',{
                    class:'infobox-detail-item',
                }));

            //Revisit - Highlight first infobox
            // self.$el.find('.infobox').removeClass('infobox-blue infobox-dark active').addClass('infobox-grey');
            // $(self.$el.find('.infobox')[0]).removeClass('infobox-grey').addClass('infobox-blue infobox-dark active');
            $(self.$el.find('.infobox')[0]).removeClass('infobox-grey').
                addClass('infobox-blue infobox-dark active');

            //Initialize view
            var chartView = new cfg['view']({
                model: cfg['model'],
                el: self.$el.find('.infobox-detail-container .infobox-detail-item:last')
            });
            var currInfobox = self.$el.find('.infobox-container .infobox:last');
            var renderFn = ifNull(cfg['renderfn'],'render');
            chartView[renderFn]();

            //Listen for changes on model to show/hide down count
            if(cfg['model'].loadedFromCache) {
                updateCnt();
            };
            cfg['model'].onDataUpdate.subscribe(function() {
                updateCnt();
            });
            function updateCnt() {
                var rowCnt = cfg['model'].getItems().length;
                var downCnt = 0;
                if(typeof(cfg['downCntFn']) == 'function') {
                    downCnt = cfg['downCntFn'](cfg['model'].getItems());
                }
                currInfobox.find(".stat.stat-important").text(downCnt);
                if(downCnt == 0) {
                    currInfobox.find(".stat.stat-important").hide();
                } else {
                    currInfobox.find(".stat.stat-important").show();
                }
                currInfobox.find(".infobox-data-number").text(rowCnt);
            }
        },
    });
    return InfoboxesView;
});

/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/SectionView',[
    'underscore',
    'contrail-view'
], function (_, ContrailView) {
    var SectionView = ContrailView.extend({

        render: function () {
            var sectionTempl = contrail.getTemplate4Id(cowc.TMPL_SECTION_VIEW),
                viewConfig = this.attributes.viewConfig,
                validation = this.attributes.validation,
                lockEditingByDefault = this.attributes.lockEditingByDefault,
                modelMap = this.modelMap,
                childElId, childViewObj, childView;

            this.$el.html(sectionTempl({viewConfig : viewConfig}));

            var rows = viewConfig[cowc.KEY_ROWS],
                columns;

            for (var i = 0; i < rows.length; i++) {
                columns = rows[i].columns;
                for (var j = 0; j < columns.length; j++) {
                    childViewObj = columns[j];
                    childElId = childViewObj[cowc.KEY_ELEMENT_ID];
                    childView = this.renderView4Config(this.$el.find("#" + childElId), this.model, childViewObj, validation, lockEditingByDefault, modelMap);
                }
            }
        }
    });

    return SectionView;
});
/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/WidgetView',[
    'underscore',
    'contrail-view'
], function (_, ContrailView) {
    var WidgetView = ContrailView.extend({
        render: function() {
            var self = this,
                widgetTemplate = contrail.getTemplate4Id(cowc.TMPL_WIDGET_VIEW),
                viewAttributes = self.attributes,
                viewConfig = viewAttributes.viewConfig,
                elementId = viewAttributes.elementId,
                selector = $(self.el),
                defaultWidgetConfig = getDefaultWidgetConfig(elementId),
                viewConfig = $.extend(true, {}, defaultWidgetConfig, viewConfig);

            if ((viewConfig.header !== false && viewConfig.controls.top !== false) || viewConfig.controls.right !== false) {
                selector.parent().append(widgetTemplate(viewConfig));

                var widgetElement = $('#' + elementId),
                    widgetContentContainer = null;

                if (viewConfig.header !== false && viewConfig.controls.top !== false) {
                    var topControls = viewConfig.controls.top;

                    if (topControls.default.collapseable === true) {
                        widgetElement.find('[data-action="widget-collapse"]')
                            .off('click')
                            .on('click', function (event) {
                                widgetElement.find('.widget-toolbar').find('i')
                                    .toggleClass('icon-chevron-up').toggleClass('icon-chevron-down');
                                widgetElement.find('.widget-body').toggle()
                                widgetElement.find('.widget-body-collapsed').toggle()
                            });

                        widgetElement.data('widget-action', {
                            collapse: function() {
                                widgetElement.find('.widget-toolbar').find('i')
                                    .removeClass('icon-chevron-up').addClass('icon-chevron-down');
                                widgetElement.find('.widget-body').hide()
                                widgetElement.find('.widget-body-collapsed').show()
                            },
                            expand: function() {
                                widgetElement.find('.widget-toolbar').find('i')
                                    .removeClass('icon-chevron-down').addClass('icon-chevron-up');
                                widgetElement.find('.widget-body').show()
                                widgetElement.find('.widget-body-collapsed').hide()
                            }
                        });
                    }

                    widgetContentContainer = widgetElement.find('.widget-main');
                }

                if (viewConfig.controls.right !== false) {
                    var controlPanelTemplate = contrail.getTemplate4Id(cowc.TMPL_CONTROL_PANEL),
                        rightControls = viewConfig.controls.right,
                        controlPanelSelector = widgetElement.find('.control-panel-container');

                    $.each(rightControls.custom, function(configKey, configValue) {
                        if (configKey === 'filterChart' && configValue.enable === true) {
                            rightControls.custom.filterChart = getFilterChartConfig(configValue);
                        }
                    });

                    $(controlPanelSelector).html(controlPanelTemplate(rightControls));

                    if (contrail.checkIfKeyExistInObject(true, rightControls, 'default.zoom.enabled') && rightControls.default.zoom.enabled) {
                        rightControls.default.zoom.events(controlPanelSelector);
                    }

                    if (contrail.checkIfExist(rightControls.custom)) {
                        $.each(rightControls.custom, function(configKey, configValue) {
                            var controlPanelElementSelector = $(controlPanelSelector).find('.' + configKey);

                            $.each(configValue.events, function(eventKey, eventValue) {
                                controlPanelElementSelector
                                    .off(eventKey)
                                    .on(eventKey, function(event) {
                                        if (!$(this).hasClass('disabled') && !$(this).hasClass('refreshing')) {
                                            $(controlPanelSelector).find('.control-panel-item').addClass('disabled');
                                            $(this).removeClass('disabled').addClass('refreshing');
                                            eventValue(event, this, controlPanelSelector);
                                        }
                                    });
                            });
                        });

                        var closeFn = function(event) {
                            var chartControlPanelExpandedSelector = $(controlPanelSelector).parent().find('.control-panel-expanded-container');

                            if (chartControlPanelExpandedSelector.is(':visible') && $(event.target).closest(chartControlPanelExpandedSelector).length == 0) {
                                chartControlPanelExpandedSelector.hide();
                                controlPanelSelector.find('.control-panel-item')
                                    .removeClass('active')
                                    .removeClass('refreshing')
                                    .removeClass('disabled');
                            }
                        };

                        $(document)
                            .off('click', closeFn)
                            .on('click', closeFn);
                    }

                    widgetContentContainer = widgetElement.find('.widget-main').find('.col1');
                }

                selector.appendTo(widgetContentContainer)
            }
        }
    });

    function getDefaultWidgetConfig(elementId) {
        return {
            elementId: elementId,
            header: false,
            controls: {
                top: false,
                right: false
            }
        }
    }

    function getFilterChartConfig(filterConfig) {
        return {
            iconClass: 'icon-filter',
            title: 'Filter',
            events: {
                click: function (event, self, controlPanelSelector) {
                    var controlPanelExpandedTemplateConfig = filterConfig.viewConfig,
                        chartControlPanelExpandedSelector = $(controlPanelSelector).parent().find('.control-panel-expanded-container');

                    if (chartControlPanelExpandedSelector.find('.control-panel-filter-container').length == 0) {
                        var controlPanelExpandedTemplate = contrail.getTemplate4Id(cowc.TMPL_CONTROL_PANEL_FILTER);

                        chartControlPanelExpandedSelector.html(controlPanelExpandedTemplate(controlPanelExpandedTemplateConfig));
                    }

                    $(self).toggleClass('active');
                    $(self).toggleClass('refreshing');

                    chartControlPanelExpandedSelector.toggle();

                    if (chartControlPanelExpandedSelector.is(':visible')) {
                        $.each(controlPanelExpandedTemplateConfig.groups, function (groupKey, groupValue) {
                            $.each(groupValue.items, function (itemKey, itemValue) {
                                $($('#control-panel-filter-group-items-' + groupValue.id).find('input')[itemKey])
                                    .off('click')
                                    .on('click', function (event) {
                                        if (contrail.checkIfKeyExistInObject(true, itemValue, 'events.click')) {
                                            itemValue.events.click(event)
                                        }
                                    });
                            });
                        });

                        chartControlPanelExpandedSelector.find('.control-panel-filter-close')
                            .off('click')
                            .on('click', function() {
                                chartControlPanelExpandedSelector.hide();
                                $(self).removeClass('active');
                                $(self).removeClass('refreshing');
                                $(controlPanelSelector).find('.control-panel-item').removeClass('disabled');
                            });

                    } else {
                        $(controlPanelSelector).find('.control-panel-item').removeClass('disabled');
                    }

                    event.stopPropagation();
                }
            }
        }
    }

    return WidgetView;
});
/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/models/ZoomScatterChartModel',[
    'underscore'
], function (_) {
    var ZoomScatterChartModel = function (dataListModel, chartConfig) {
        var self = this, forceX = chartConfig.forceX,
            forceY = chartConfig.forceY, margin = chartConfig.margin,
            chartData, d3Scale;

        self.margin = margin;
        self.noDataMessage = chartConfig['noDataMessage'];

        self.classes = ['error', 'warning', 'medium', 'okay', 'default'];

        self.loadedFromCache = dataListModel.loadedFromCache;

        self.isRequestInProgress = function() {
            return dataListModel.isRequestInProgress()
        };

        self.isPrimaryRequestInProgress = function() {
            return dataListModel.isPrimaryRequestInProgress()
        };

        self.isError = function() {
            if (contrail.checkIfExist(dataListModel.error) && dataListModel.error === true && dataListModel.errorList.length > 0) {
                var xhr = dataListModel.errorList[0];
                if(!(xhr.status === 0 && xhr.statusText === 'abort')) {
                    return true;
                }
            }
            return false;
        };

        self.isEmpty = function() {
            if (contrail.checkIfExist(dataListModel.empty)) {
                return (dataListModel.empty) ? true : ((dataListModel.getFilteredItems().length == 0) ? true : false);
            }
            return false;
        };

        self.refresh = function(chartConfig) {
            var rawData = dataListModel.getFilteredItems();
            self.data = contrail.checkIfFunction(chartConfig['dataParser']) ? chartConfig['dataParser'](rawData) : rawData;

            if(chartConfig['doBucketize'] == true) {
                self.data = doBucketization(self.data,chartConfig);
            }
            chartData = JSON.parse(JSON.stringify(self.data));
            self.chartData = chartData;
            self.sizeFieldName = contrail.handleIfNull(chartConfig['sizeFieldName'], 'size');
            self.sizeMinMax = getSizeMinMax(self.data, self.sizeFieldName);

            d3Scale = d3.scale.linear().range([6, 10]).domain(self.sizeMinMax);
            if(chartConfig['doBucketize'] == true) {
                //All nodes have same size
                if(self.sizeMinMax[0] != self.sizeMinMax[1]) {
                    d3SizeScale = d3.scale.quantize().domain(self.sizeMinMax).range([6,7,9,10,11,12]);
                }
            }

            $.each(chartData, function (idx, chartDataPoint) {
                if(chartConfig['doBucketize'] == true) {
                    chartDataPoint['size'] = (chartDataPoint['size'] == 0) ? 6 : d3SizeScale(chartDataPoint[self.sizeFieldName]);
                } else {
                    chartDataPoint['size'] = contrail.handleIfNaN(d3Scale(chartDataPoint[self.sizeFieldName]), 6);
                }
                // Add default color for the bubble if not already set
                chartDataPoint['color'] = chartDataPoint['color'] ? chartDataPoint['color']: "default";
            });

            self.width = chartConfig['width'] - margin.left - margin.right;
            self.height = chartConfig['height'] - margin.top - margin.bottom;

            if(chartConfig['doBucketize'] == true) {
                var chartOffset = 20;
                forceX = getAxisMinMaxForBucketization(chartData, chartConfig.xField, chartConfig.forceX);
                forceY = getAxisMinMaxForBucketization(chartData, chartConfig.yField, chartConfig.forceY);
                var xMin,xMax;
                //Keep 20px chart empty on either side such that nodes are not plotted on edges
                if(forceX[0] != forceX[1]) {
                    var xDiff = forceX[1] - forceX[0];
                    var domainRangePerPixel = xDiff/self.width;
                    var xDomainOffset = (domainRangePerPixel*chartOffset);
                    xMin = forceX[0]-xDomainOffset,xMax=forceX[1]+xDomainOffset;
                } else {
                    xMin = forceX[0] * .9;
                    xMax = forceX[0] * 1.1;
                }
                if(forceX[0] >= 0 && xMin < 0)
                    xMin = 0;
                forceX = [xMin,xMax];

                var yMin,yMax;
                if(forceY[0] != forceY[1]) {
                    var yDiff = forceY[1] - forceY[0];
                    var domainRangePerPixel = yDiff/self.height;
                    var yDomainOffset = (domainRangePerPixel*chartOffset);
                    yMin= forceY[0]-yDomainOffset,yMax=forceY[1]+yDomainOffset;
                } else {
                    yMin = forceY[0] * .9;
                    yMax = forceY[0] * 1.1;
                }
                if(forceY[0] >= 0 && yMin < 0)
                    yMin = 0;
                forceY = [yMin,yMax];
            } else {
                forceX = cowu.getForceAxis4Chart(chartData, chartConfig.xField, chartConfig.forceX);
                forceY = cowu.getForceAxis4Chart(chartData, chartConfig.yField, chartConfig.forceY);
            }

            self.xMin = forceX[0];
            self.xMax = forceX[1];

            self.yMin = forceY[0];
            self.yMax = forceY[1];

            //Round-off yMin/yMax to nearest 100
            /*self.yMin = self.yMin - (self.yMin%100)
            self.yMax = self.yMax + (100 - self.yMax%100)

            function decimalPlaces(num) {
            var match = (''+num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
            if (!match) { return 0; }
            return Math.max(
                0,
                // Number of digits right of decimal point.
                (match[1] ? match[1].length : 0)
                // Adjust for scientific notation.
                - (match[2] ? +match[2] : 0));
            }

            //Round-off xMin/xMax to 2 decimal
            if(d3.round(self.xMin,2) != d3.round(self.xMax,2)) {
                self.xMin = Math.min(self.xMin,d3.round(self.xMin,2));
                self.xMax = Math.max(d3.round(self.xMax,2),self.xMax);
            } else if(d3.round(self.xMin,3) != d3.round(self.xMax,3)) {
                self.xMin = Math.min(self.xMin,d3.round(self.xMin,3));
                self.xMax = Math.max(self.xMax,d3.round(self.xMax,3));
            } else if(d3.round(self.xMin,4) != d3.round(self.xMax,4)) {
                self.xMin = Math.min(d3.round(self.xMin,4),self.xMin);
                self.xMax = Math.max(d3.round(self.xMax,4),self.xMax);
            }*/

            self.xScale = d3.scale.linear().domain([self.xMin, self.xMax]).range([0, self.width]);
            self.yScale = d3.scale.linear().domain([self.yMin, self.yMax]).range([self.height, 0]);

            self.zoomBehavior = d3.behavior.zoom().x(self.xScale).y(self.yScale).scaleExtent([1, 4]);

            self.maxColorFilterFields = d3.max(chartData, function (d) {
                return +d[chartConfig.colorFilterFields]
            });

            //Set tickFormat only if specified
            self.xAxis = d3.svg.axis().scale(self.xScale).orient("bottom").ticks(10)
                .tickSize(-self.height)
                // .outerTickSize(0)
            if(chartConfig['doBucketize'] != true) {
                self.xAxis.tickFormat(chartConfig.xLabelFormat);
            } else if(chartConfig.xLabelFormat != null) {
                self.xAxis.tickFormat(chartConfig.xLabelFormat);
            }
            self.yAxis = d3.svg.axis().scale(self.yScale).orient("left").ticks(5)
                .tickSize(-self.width)
                // .outerTickSize(0)
            if(chartConfig['doBucketize'] != true) {
                self.yAxis.tickFormat(chartConfig.yLabelFormat)
            } else if(chartConfig.yLabelFormat != null) {
                self.yAxis.tickFormat(chartConfig.yLabelFormat)
            }

            self.xMed = median(_.map(chartData, function (d) {
                return d[chartConfig.xField];
            }));

            self.yMed = median(_.map(chartData, function (d) {
                return d[chartConfig.yField];
            }));
        };

        self.refresh(chartConfig);

        return self;
    };

    /*
     * Start: Bucketization functions
     */

    function getAxisMinMaxForBucketization(chartData, fieldName, forceAxis) {
        var axisMin = 0, axisMax;

        //If all nodes are closer,then adding 10% buffer on edges makes them even closer
        if(chartData.length > 0) {
            axisMax = d3.max(chartData, function (d) {
                    return +d[fieldName];
                });
            axisMin = d3.min(chartData, function (d) {
                    return +d[fieldName];
                });

            if (axisMax == null) {
                axisMax = 1;
            }

            if (axisMin == null) {
                axisMin = 0;
            } 

        } else {
            axisMax = 1;
            axisMin = 0;
        }

        if (forceAxis) {
            if (axisMin > forceAxis[0]) {
                axisMin = forceAxis[0];
            }

            if (axisMax < forceAxis[1]) {
                axisMax = forceAxis[1];
            }
        }

        return [axisMin, axisMax];
    };

    //Ensure the input data is not modified
    function doBucketization(data,chartOptions){
        // var data = $.extend(true,[],data);
        var retData = [];
        var minMax, minMaxX, minMaxY, parentMinMax, currLevel, maxBucketizeLevel, bucketsPerAxis,
            defaultBucketsPerAxis = 6;
        bucketsPerAxis = defaultBucketsPerAxis;

        if (data != null) {
            var combinedValues = data;
            var cf = crossfilter(data),
                xDim = cf.dimension(function(d) { return d.x;}),
                yDim = cf.dimension(function(d) { return d.y;});

            minMaxX = d3.extent(combinedValues,function(obj){
                return obj['x'];
            });
            minMaxY = d3.extent(combinedValues,function(obj){
                return obj['y'];
            });
            //set forceX and  forceY to fix the axes boundaries
            chartOptions.forceX = minMaxX;
            chartOptions.forceY = minMaxY;
            // if(parentMinMax == null){
            //     parentMinMax = [];
            // }
            var xDomainDiff = minMaxX[1]-minMaxX[0];
            var yDomainDiff = minMaxY[1]-minMaxY[0];
            //Heuristics to decide whether bucketization is needed
            // 1. If maxX/minX < 5%
            // 2. If maxY/minY < 5%
            // 3. No of nodes < 10
            // 4. Nodes having only non-numeric x/y values i.e xDomainDiff/yDomainDiff is null
            if(Math.abs(xDomainDiff/minMaxX[1]*100) < 5 || Math.abs(yDomainDiff/minMaxY[1]*100) < 5
                || combinedValues.length < 10
                || !$.isNumeric(yDomainDiff) || !$.isNumeric(xDomainDiff)) {
                    retData = data;
            } else {
                /* Bucketize based on d3Scale */
                var xBucketScale = d3.scale.quantize().domain(minMaxX).range(d3.range(1,bucketsPerAxis));
                var yBucketScale = d3.scale.quantize().domain(minMaxY).range(d3.range(1,bucketsPerAxis));
                var xPartitions = [],yPartitions = [];
                $.each(d3.range(1,bucketsPerAxis),function(idx,obj) {
                   xPartitions.push(xBucketScale.invertExtent(obj)[0]);
                   yPartitions.push(yBucketScale.invertExtent(obj)[0]);
                });
                var buckets = {};
                //Group nodes into buckets
                $.each(data,function(idx,obj) {
                    var xBucket = xBucketScale(obj['x']);
                    var yBucket = yBucketScale(obj['y']);
                    if(buckets[xBucket] == null) {
                        buckets[xBucket] = {};
                    }
                    if(buckets[xBucket][yBucket] == null) {
                        buckets[xBucket][yBucket] = [];
                    }
                    buckets[xBucket][yBucket].push(obj);
                });
                //Nodes that don't have numeric x & y values and those will be plotted at intersection of axis
                var nonXYNodes = [];
                //Merge all nodes in a single bucket to a single node
                $.each(buckets,function(x,xBuckets) {
                    $.each(buckets[x],function(y,bucket) {
                        if(buckets[x][y] != null && buckets[x][y] instanceof Array) {
                            if($.isNumeric(x) && $.isNumeric(y)) {
                                var obj = {};
                                avgX = d3.mean(buckets[x][y],function(d){return d.x});
                                avgY = d3.mean(buckets[x][y],function(d){return d.y});
                                //To Plot at center of bucket
                                // avgX = d3.mean(xBucketScale.invertExtent(parseInt(x)),function(d) { return d});
                                // avgY = d3.mean(yBucketScale.invertExtent(parseInt(y)),function(d) { return d});
                                obj['x'] = avgX;
                                obj['y'] = avgY;
                                if(typeof(chartOptions['bubbleSizeFn']) == 'function') {
                                    obj['size'] = chartOptions['bubbleSizeFn'](buckets[x][y]);
                                } else {
                                    obj['size'] = buckets[x][y].length;
                                }
                                //Show overlapped nodes with black storke
                                if(buckets[x][y].length > 1) {
                                    obj['isBucket'] = true;
                                    obj['stroke'] = 'black';
                                } else {
                                    obj['isBucket'] = false;
                                    obj['name'] = buckets[x][y][0]['name'];
                                }
                                buckets[x][y].sort(dashboardUtils.sortNodesByColor);
                                var nodeCnt = buckets[x][y].length;
                                obj['color'] = buckets[x][y][nodeCnt-1]['color'];
                                //If bucket contains only one node,minX and maxX will be same
                                obj['minMaxX'] = d3.extent(buckets[x][y],function(obj)  {
                                    return obj['x'];
                                });
                                obj['minMaxY'] = d3.extent(buckets[x][y],function(obj) {
                                    return obj['y'];
                                });
                                // obj['minMaxX'] = xBucketScale.invertExtent(parseInt(x));
                                // obj['minMaxY'] = yBucketScale.invertExtent(parseInt(y));

                                obj['children'] = buckets[x][y];
                                retData.push(obj);
                            } else {
                                nonXYNodes = nonXYNodes.concat(buckets[x][y]);
                            }
                        }
                    });
                });
                //Nodes with non-x/y values
                if(nonXYNodes.length > 0) {
                        retData.push({
                        size:typeof(chartOptions['bubbleSizeFn']) == 'function' ? chartOptions['bubbleSizeFn'](nonXYNodes) : nonXYNodes.length,
                        color:nonXYNodes[0]['color'],
                        stroke: 'black',
                        isBucket: true,
                        children:nonXYNodes
                    });
                }
            }
        }
        return retData;
    }

    /*
     * End: Bucketization fucntions
     */

    function median(values) {
        values.sort(function (a, b) {
            return a - b;
        });
        var half = Math.floor(values.length / 2);

        if (values.length % 2)
            return values[half];
        else
            return (parseFloat(values[half - 1]) + parseFloat(values[half])) / 2.0;
    };

    function getSizeMinMax(chartData, sizeFieldName) {
        //Merge the data values array if there are multiple categories plotted in chart, to get min/max values
        var sizeMinMax, dValues;

        dValues = flattenList(chartData);

        sizeMinMax = getBubbleSizeRange(dValues, sizeFieldName);
        return sizeMinMax;
    }

    function getBubbleSizeRange(values, sizeFieldName) {
        var sizeMinMax = d3.extent(values, function (obj) {
            return  contrail.handleIfNaN(obj[sizeFieldName], 0)
        });
        if (sizeMinMax[0] == sizeMinMax[1]) {
            sizeMinMax = [sizeMinMax[0] * .9, sizeMinMax[0] * 1.1];
        } else {
            sizeMinMax = [sizeMinMax[0], sizeMinMax[1]];
        }
        return sizeMinMax;
    }

    return ZoomScatterChartModel;
});

/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-basedir/js/views/ZoomScatterChartView',[
    'underscore',
    'contrail-view',
    'core-basedir/js/models/ZoomScatterChartModel',
    'contrail-list-model',
    'core-basedir/js/views/ControlPanelView'
], function (_, ContrailView, ZoomScatterChartModel, ContrailListModel, ControlPanelView) {
    var ZoomScatterChartView = ContrailView.extend({
        render: function () {
            var self = this,
                viewConfig = self.attributes.viewConfig,
                widgetConfig = contrail.checkIfExist(viewConfig.widgetConfig) ? viewConfig.widgetConfig : null,
                ajaxConfig = viewConfig['ajaxConfig'],
                chartOptions = viewConfig['chartOptions'],
                deferredObj = $.Deferred(),
                cfDataSource = self.attributes.viewConfig.cfDataSource,
                selector = $(self.$el);

            if (self.model == null && viewConfig['modelConfig'] != null) {
                self.model = new ContrailListModel(viewConfig['modelConfig']);
            }

            if (self.model != null) {
                if(cfDataSource == null) {
                    self.renderChart(selector, viewConfig, self.model);
                } else if(self.model.loadedFromCache == true) {
                    self.renderChart(selector, viewConfig, self.model);
                }

                if(cfDataSource != null) {
                    cfDataSource.addCallBack('updateChart',function(data) {
                        viewConfig['cfg'] = {};
                        viewConfig['cfg']['source'] = data['cfg']['source'];
                        $(selector).find('.filter-list-container .filter-criteria').hide();
                        self.renderChart(selector, viewConfig, self.model);
                        viewConfig['cfg'] = {};
                    });
                } else {
                    self.model.onAllRequestsComplete.subscribe(function () {
                        self.renderChart(selector, viewConfig, self.model);
                    });
                }

                if (viewConfig.loadChartInChunks !== false) {
                    self.model.onDataUpdate.subscribe(function () {
                        self.renderChart(selector, viewConfig, self.model);
                    });
                }

                $(selector).bind("refresh", function () {
                    self.renderChart(selector, viewConfig, self.model);
                });

                var resizeFunction = function (e) {
                    self.renderChart(selector, viewConfig, self.model);
                };

                $(window)
                    .off('resize', resizeFunction)
                    .on('resize', resizeFunction);
            }

            if (widgetConfig !== null) {
                self.renderView4Config($(self.$el).find('.zoom-scatter-chart-container'), self.model, widgetConfig, null, null, null);
            }
        },

        renderChart: function (selector, viewConfig, dataListModel) {
            if (!($(selector).is(':visible')) || this.isMyRenderInProgress) {
                return;
            }

            var self = this,
                chartOptions = viewConfig['chartOptions'],
                chartConfig;

            self.isMyRenderInProgress = true;

            if (!contrail.checkIfExist(self.chartModel)) {
                $(selector).html(contrail.getTemplate4Id(cowc.TMPL_ZOOMED_SCATTER_CHART));

                chartConfig = getChartConfig(selector, chartOptions);
                self.chartModel = new ZoomScatterChartModel(dataListModel, chartConfig);
                self.zm = self.chartModel.zoomBehavior.on("zoom", getChartZoomFn(self, chartConfig));
                if(typeof(self.zoomBySelection) == "undefined")
                    self.zoomBySelection = false;
                renderControlPanel(self, chartConfig, chartOptions, selector);
            } else {
                $(selector).find('.chart-container').empty();
                chartConfig = getChartConfig(selector, chartOptions);
                self.chartModel.refresh(chartConfig);
                self.zm = self.chartModel.zoomBehavior.on("zoom", getChartZoomFn(self, chartConfig));
                if(typeof(self.zoomBySelection) == "undefined")
                    self.zoomBySelection = false;
            }

            renderZoomScatterChart(self, chartConfig, chartOptions, selector);
        },

        renderMessage: function(message, selector) {
            var self = this,
                message = contrail.handleIfNull(message, ""),
                selector = contrail.handleIfNull(selector, $(self.$el)),
                chartSVG = d3.select($(selector).find("svg")[0]),
                chartModel = self.chartModel,
                margin = chartModel.margin,
                chartMessageText = chartSVG.selectAll('.nv-noData').data([message]);

            chartMessageText.enter().append('text')
                .attr('class', 'nvd3 nv-noData')
                .attr('dy', '-.7em')
                .style('text-anchor', 'middle');

            chartMessageText.attr('x', margin.left + chartModel.width / 2)
                .attr('y', (chartModel.height + margin.top + margin.bottom) / 2)
                .text(function (d) {
                    return d
                });

            if (chartModel.isRequestInProgress()) {
                chartMessageText.style('fill', '#000');
            }
        },

        removeMessage: function(selector) {
            var self = this,
                selector = contrail.handleIfNull(selector, $(self.$el));

            $(selector).find('.nv-noData').remove();
        }
    });

    function renderControlPanel(chartView, chartConfig, chartOptions, selector) {
        var chartControlPanelSelector = $(selector).find('.chart-control-panel-container'),
            viewAttributes = {
                viewConfig: getControlPanelConfig(chartView, chartConfig, chartOptions, selector)
            },
            controlPanelView = new ControlPanelView({
                el: chartControlPanelSelector,
                attributes: viewAttributes
            });

        controlPanelView.render();
    };

    function renderZoomScatterChart(chartView, chartConfig, chartOptions, selector) {
        var chartModel = chartView.chartModel,
            checkEmptyDataCB = function (data) {
                return (!data || data.length === 0);
            },
            chartDataRequestState = cowu.getRequestState4Model(chartModel, chartModel.data, checkEmptyDataCB);


        plotZoomScatterChart(chartView, chartConfig, chartOptions, selector);

        if (chartModel.isPrimaryRequestInProgress() && !chartModel.loadedFromCache) {
            dataLoadingHandler(chartView, chartConfig, chartOptions, chartDataRequestState)
        } else if (chartModel.isError() === true) {
            dataErrorHandler(chartView, chartDataRequestState);
        } else if(chartModel.isEmpty() === true) {
            dataEmptyHandler(chartView, chartConfig, chartDataRequestState)
        } else {
            dataSuccessHandler(chartView, chartConfig, chartOptions, chartDataRequestState)
        }

        chartView.isMyRenderInProgress = false;
    }

    function plotZoomScatterChart(chartView, chartConfig, chartOptions, selector) {
        var chartSVG, viewObjects,self=this,
            chartSelector = $(selector).find('.chart-container'),
            chartControlPanelSelector = $(selector).find('.chart-control-panel-container'),
            chartModel = chartView.chartModel,
            margin = chartConfig['margin'],
            width = chartModel.width,
            height = chartModel.height,
            cfDataSource = chartView.attributes.viewConfig.cfDataSource,
            maxCircleRadius = chartConfig.maxCircleRadius;

        $(chartSelector).height(height + margin.top + margin.bottom);
        //What if we want an icon to be active by default
        $(chartControlPanelSelector).find('.control-panel-item').removeClass('active');
        if(chartOptions['doBucketize'] == true && chartView.zoomBySelection == true)
            $(chartControlPanelSelector).find('.control-panel-item.zoomBySelectedArea').addClass('active');

        if(chartOptions['doBucketize'] != true) {
            chartSVG = d3.select($(chartSelector)[0]).append("svg")
                .attr("class", "zoom-scatter-chart")
            .attr("width", width + margin.left + margin.right + maxCircleRadius)
            .attr("height", height + margin.top + margin.bottom)
            .attr("viewbox", '0 0 ' + (width + margin.left + margin.right + maxCircleRadius) + ' ' + (height + margin.top + margin.bottom))
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .call(chartView.zm)
                .append("g")
                .on("mousedown", mouseDownCallback);
        } else {
            chartSVG = d3.select($(chartSelector)[0]).append("svg")
                .attr("class", "zoom-scatter-chart")
                .attr("width", width + margin.left + margin.right + maxCircleRadius)
                .attr("height", height + margin.top + margin.bottom)
                .attr("viewbox", '0 0 ' + (width + margin.left + margin.right + maxCircleRadius) + ' ' + (height + margin.top + margin.bottom))
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                .call(chartView.zm)
                .on('dblclick.zoom',function() {
                    zoomOut({cfDataSource:cfDataSource});
                })
                .append("g")
                .on('mousedown.zoom',mouseDownCallback);
        }

        //Add color filter
        //Don't show CPU/Mem filters
        if(chartOptions['doBucketize'] == true) {
            if($(selector).find('.zs-chart-settings').length == 0) {
                var zsChartSettingsTmpl = contrail.getTemplate4Id('zs-chart-settings');
                $(selector).prepend(zsChartSettingsTmpl());
            }

            /*
            $(selector).find('.filter-list-container .filter-criteria').hide();
            //Show filters
            var d3Format = d3.format('.2f');
            var showFilterTemplate = contrail.getTemplate4Id('zs-show-filter-range');
            if(cfDataSource.getFilter('x') != null) {
                $(selector).find('.filter-list-container').show();
                $(selector).find('.filter-list-container .filter-criteria.x').show();
                var minMaxX = cfDataSource.getFilterValues('x');
                $(selector).find('.filter-criteria.x').html(showFilterTemplate({
                        lbl: 'CPU (%)',
                        minValue: d3Format(minMaxX[0]),
                        maxValue: d3Format(minMaxX[1])
                    }));
                $(selector).find('.filter-criteria.x').find('.icon-remove').on('click',function() {
                    $(this).parents('.filter-criteria').hide();
                    cfDataSource.removeFilter('x');
                    cfDataSource.fireCallBacks({source:'chartFilterRemoved'});
                });
            }
            if(cfDataSource.getFilter('y') != null) {
                $(selector).find('.filter-list-container').show();
                $(selector).find('.filter-list-container .filter-criteria.y').show();
                var minMaxY = cfDataSource.getFilterValues('y');
                $(selector).find('.filter-criteria.y').html(showFilterTemplate({
                        lbl: 'Mem (MB)',
                        minValue: d3Format(minMaxY[0]),
                        maxValue: d3Format(minMaxY[1])
                }));
                $(selector).find('.filter-criteria.y').find('.icon-remove').on('click',function() {
                    $(this).parents('.filter-criteria').hide();
                    cfDataSource.removeFilter('y');
                    cfDataSource.fireCallBacks({source:'chartFilterRemoved'});
                });
            }*/
        }

        chartSVG.append("rect")
            .attr('class','zs-rect')
            .attr("width", width + maxCircleRadius)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(" + maxCircleRadius + ",0)")

        chartSVG.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(" + maxCircleRadius + "," + height + ")")
            .call(chartModel.xAxis)
            .selectAll("text")
            .attr("x", 0)
            .attr("y", 8);

        chartSVG.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + maxCircleRadius + ",0)")
            .call(chartModel.yAxis)
            .selectAll("text")
            .attr("x", -8)
            .attr("y", 0);

        viewObjects = chartSVG.append("svg")
            .attr("class", "objects")
            .attr("width", width + maxCircleRadius)
            .attr("height", height + maxCircleRadius);

        chartSVG.append("text")
            .attr("class", "x label")
            .attr("text-anchor", "end")
            .attr("x", width)
            .attr("y", height + margin.bottom - 10)
            .text(chartConfig.xLabel);

        chartSVG.append("text")
            .attr("class", "y label")
            .attr("text-anchor", "end")
            .attr("y", -margin.left)
            .attr("x", 0)
            .attr("dy", ".75em")
            .attr("transform", "rotate(-90)")
            .text(chartConfig.yLabel);

        chartView.svg = chartSVG;
        chartView.viewObjects = viewObjects;

        function mouseDownCallback() {
            if (!chartView.zoomBySelection) {
                return;
            }

            destroyTooltip(null);

            var e = this,
                origin = d3.mouse(e),
                rect = chartSVG.append("rect").attr("class", "zoom");
            d3.select("body").classed("noselect", true);
            origin[0] = Math.max(0, Math.min(width, origin[0]));
            origin[1] = Math.max(0, Math.min(height, origin[1]));
            d3.select(window)
                .on("mousemove.zoomRect", function () {
                    destroyTooltip(null);

                    var m = d3.mouse(e);
                    m[0] = Math.max(0, Math.min(width, m[0]));
                    m[1] = Math.max(0, Math.min(height, m[1]));
                    rect.attr("x", Math.min(origin[0], m[0]))
                        .attr("y", Math.min(origin[1], m[1]))
                        .attr("width", Math.abs(m[0] - origin[0]))
                        .attr("height", Math.abs(m[1] - origin[1]));
                })
                .on("mouseup.zoomRect", function () {
                    destroyTooltip(null);

                    d3.select(window).on("mousemove.zoomRect", null).on("mouseup.zoomRect", null);
                    d3.select("body").classed("noselect", false);
                    var m = d3.mouse(e);
                    m[0] = Math.max(0, Math.min(width, m[0]));
                    m[1] = Math.max(0, Math.min(height, m[1]));

                    rect.remove();
                    if(chartOptions['doBucketize'] != true) {
                        if (m[0] !== origin[0] && m[1] !== origin[1]) {
                            chartModel.zoomBehavior.x(
                                chartModel.xScale.domain([origin[0], m[0]].map(chartModel.xScale.invert).sort(function (a, b) {
                                    return a - b;
                                }))
                            )
                                .y(
                                chartModel.yScale.domain([origin[1], m[1]].map(chartModel.yScale.invert).sort(function (a, b) {
                                    return a - b;
                                }))
                            );
                        }

                        chartSVG.select(".x.axis")
                            .call(chartModel.xAxis)
                            .selectAll("text")
                            .attr("x", 0)
                            .attr("y", 8);

                        chartSVG.select(".y.axis")
                            .call(chartModel.yAxis)
                            .selectAll("text")
                            .attr("x", -8)
                            .attr("y", 0);

                        chartSVG.selectAll("circle").attr("transform", function (d) {
                            var xTranslate = chartModel.xScale(d[chartConfig.xField]) + maxCircleRadius,
                                yTranslate = chartModel.yScale(d[chartConfig.yField]);
                            //Position the non x/y nodes at axis start
                            if(!$.isNumeric(xTranslate))
                                xTranslate = chartModel.xScale.range()[0] + maxCircleRadius;
                            if(!$.isNumeric(yTranslate))
                                yTranslate = chartModel.yScale.range()[0];
                            return "translate(" + xTranslate + "," + yTranslate + ")";
                        });
                    } else {
                        //Bucketize the dragged selection
                        //As x-axis is transformated 50px and again 7px with circle radius
                        //y-axis is transformed 0px from svg
                        var xOffset = 10,yOffset = 0;
                        var minMaxX = [];
                        var xValue1 = chartModel.xScale.invert(origin[0] - xOffset);
                        var xValue2 = chartModel.xScale.invert(m[0] - xOffset);
                        minMaxX[0] = Math.min(xValue1, xValue2);
                        minMaxX[1] = Math.max(xValue1, xValue2);
                        var minMaxY = [];
                        var yValue1 = chartModel.yScale.invert(origin[1] - yOffset);
                        var yValue2 = chartModel.yScale.invert(m[1] - yOffset);
                        minMaxY[0] = Math.min(yValue1, yValue2);
                        minMaxY[1] = Math.max(yValue1, yValue2);
                        //Get the data associated with the chart
                        var d = d3.select($(chartView.$el).find('svg rect.zs-rect')[0]).data()[0];
                        zoomIn({
                            xRange: minMaxX,
                            yRange: minMaxY,
                            d     : d,
                            selector: selector,
                            viewConfig: chartView.attributes.viewConfig,
                            cfDataSource : cfDataSource
                        });
                    }
                }, true);
            d3.event.stopPropagation();
        };
        if(chartOptions['doBucketize'] == true) {
            if(chartView.zoomBySelection == true) {
                $('svg.zoom-scatter-chart').find('rect').addClassSVG('cursor-crosshair');
            }
            /*
            addScatterChartDragHandler({
                viewConfig: chartView.attributes.viewConfig,
                selector: chartView.$el,
                chartModel: chartView.chartModel,
                cfDataSource: chartView.attributes.viewConfig.cfDataSource
            });*/
            //Bind drag event once scatterChart initialized
            if(chartView.bindListeners == null) {
                chartView.bindListeners = true;
                addSelectorClickHandlers({
                    selector: chartView.$el,
                    chartModel: chartView.chartModel,
                    cfDataSource: chartView.attributes.viewConfig.cfDataSource
                });
            }
        }
    }

    function zoomOut(obj) {
        //Reset color-selection
        // $(selector).find('.color-selection .circle').addClass('filled');
        if(obj['cfDataSource'] != null) {
            var cfDataSource = obj['cfDataSource'];
            // cfDataSource.removeFilter('chartFilter');
            cfDataSource.removeFilter('x');
            cfDataSource.removeFilter('y');
            cfDataSource.fireCallBacks({source:'chartFilterRemoved'});
        }
    }

    function getColorFilterFn(selector) {
        //Add color filter
        var selectedColorElems = $(selector).find('.circle.filled');
        // selectedColorElems = $(selector).parents('.control-panel-filter-group').find('input:checked').siblings('span');
        var selColors = [];
        $.each(selectedColorElems,function(idx,obj) {
            $.each(cowc.COLOR_SEVERITY_MAP,function(currColorName,currColorCode) {
                if($(obj).hasClass(currColorName)) {
                    // if(selColors.indexOf(currColorName) == -1)
                        selColors.push(currColorCode);
                }
            });
        });
        var colorFilterFunc = function(d) {
            return selColors.indexOf(d) > -1;
        }
        return colorFilterFunc;
    }

    function addSelectorClickHandlers(obj) {
        /****
        * Selection handler for color filter in chart settings panel
        ****/
        $(obj['selector']).on('click','.zs-chart-settings .color-selection .circle',function() {
            var currElem = $(this);
            $(this).toggleClass('filled');

            var colorFilterFunc = getColorFilterFn($(this).parents('.color-selection'));
            if(obj['cfDataSource'] != null) {
                obj['cfDataSource'].applyFilter('colorFilter',colorFilterFunc);
                obj['cfDataSource'].fireCallBacks({source:'chart'});
            }
        });
    }

    function addScatterChartDragHandler(obj) {
        //Will be set to true on pressing "Esc" key
        var cancelDragEvent;
        var selector=obj['selector'],chartModel = obj['chartModel'];

        var dragSrc = d3.behavior.drag();
        //drag support
        d3.select($(selector)[0]).select('svg rect.zs-rect').call(dragSrc
            .on('dragstart',function(d,i) {
                var p = d3.mouse(this);
                this.__origin__ = {};
                this.__origin__.x = p[0];
                this.__origin__.y = p[1];
                this.__origin__.dx  = 0,this.__origin__.dy = 0;
                d3.select($(selector)[0]).select('svg').append('rect').attr('id','rect1');
            })
            .on("drag", function(d, i){
                cancelDragEvent = false;
                this.__origin__.dx += d3.event.dx;
                this.__origin__.dy += d3.event.dy;
                var xMirror = 1,yMirror =1,
                    offsetX = this.__origin__.x,offsetY = this.__origin__.y;
                //Working only when we negate both scale & x/y coordinates
                if(this.__origin__.dx < 0) {
                    xMirror = -1;
                    offsetX = -offsetX;
                }
                if(this.__origin__.dy < 0) {
                    yMirror = -1;
                    offsetY = -offsetY;
                }

                d3.select($(selector).find('svg rect#rect1')[0])
                .attr('x',offsetX)
                .attr('y',offsetY)
                .attr('width',Math.abs(d3.event.x - this.__origin__.x))
                .attr('height',Math.abs(d3.event.y - this.__origin__.y))
                .attr('style',"stroke:lightgrey;stroke-width:2;fill:lightgrey;fill-opacity:0.5;")
                .attr('transform', 'scale(' + xMirror + ',' + yMirror +')');
            })
            .on("dragend", function(d,i) {
                    if(cancelDragEvent == true) {
                        cancelDragEvent = false;
                        $('#rect1').remove();
                        return;
                    }
                    if(d.dx == 0 && d.dy == 0) {
                        $('#rect1').remove();
                        return;
                    }
                    $(selector).find('#rect1').remove();
                    //As x-axis is transformated 50px and again 7px with circle radius
                    //y-axis is transformed 10px from svg
                    var xOffset = 50+10,yOffset = 10;
                    var minMaxX = [];
                    var xValue1 = chartModel.xScale.invert(this.__origin__.x - xOffset);
                    var xValue2 = chartModel.xScale.invert(this.__origin__.x + this.__origin__.dx - xOffset);
                    minMaxX[0] = Math.min(xValue1, xValue2);
                    minMaxX[1] = Math.max(xValue1, xValue2);
                    var minMaxY = [];
                    var yValue1 = chartModel.yScale.invert(this.__origin__.y - yOffset);
                    var yValue2 = chartModel.yScale.invert(this.__origin__.y + this.__origin__.dy - yOffset);
                    minMaxY[0] = Math.min(yValue1, yValue2);
                    minMaxY[1] = Math.max(yValue1, yValue2);
                    zoomIn({
                        xRange: minMaxX,
                        yRange: minMaxY,
                        d     : d,
                        selector: selector,
                        viewConfig: obj['viewConfig'],
                        cfDataSource : obj['cfDataSource']
                    });
                    delete this.__origin__;
            })
        ).on('mousedown', function(d){
            //To store the initial co-ordinates??
            // d.offsetX = d3.event.offsetX;
            // d.offsetY = d3.event.offsetY;
        })
        d3.select('body').on('keyup', function(d) {
            if(d3.event.keyCode == 27) cancelDragEvent = true;
        });
    }

    function zoomIn(obj) {
        var minMaxX = obj['xRange'],
            minMaxY = obj['yRange'],
            viewConfig = obj.viewConfig,
            cfDataSource = obj['cfDataSource'],
            selector = obj['selector'],
            d = obj['d'];
        //adjust min and max values to include missed bubbles
        var combinedValues = [];

        if(d instanceof Array) {
            $.each(d,function(idx,item) {
                //Include all nodes whose center position falls within the dragged region
                if(item.x >= minMaxX[0] && item.x <= minMaxX[1]
                    && item.y >= minMaxY[0] && item.y <= minMaxY[1]) {
                    combinedValues.push(item);
                }
            });
        } else {
            minMaxX = d['minMaxX'];
            minMaxY = d['minMaxY'];
            combinedValues = [d];
        }
        var minMaxXs = [],minMaxYs = [];

        //If there is no node within dragged selection,ignore
        if(combinedValues.length == 0) {
            return;
        }
        var selectedNodes = [];
        $.each(combinedValues,function(idx,obj) {
            if(obj['isBucket'] || obj['children']) {
                $.each(obj['children'],function(idx,currNode) {
                    selectedNodes.push(currNode);
                });
            } else {
                selectedNodes.push(obj);
            }
        });
        minMaxX = d3.extent(selectedNodes,function(d) { return d.x;});
        minMaxY = d3.extent(selectedNodes,function(d) { return d.y;});
        var selNames = $.map(selectedNodes,function(obj,idx) {
           return obj['name'];
        });

        //Zoomin on the selected region
        if(obj['cfDataSource'] != null) {
            var cfDataSource = obj['cfDataSource'];
            if(cfDataSource.getDimension('x') == null) {
                cfDataSource.addDimension('x',function(d) {
                    return d['x'];
                });
            }
            if(cfDataSource.getDimension('y') == null) {
                cfDataSource.addDimension('y',function(d) {
                    return d['y'];
                });
            }
            if(cfDataSource.getDimension('chartFilter') == null) {
                cfDataSource.addDimension('chartFilter',function(d) {
                    return d['name'];
                });
            }
            var dataMinMaxX = d3.extent(cfDataSource.getFilteredData(),function(d) { return d.x;});
            var dataMinMaxY = d3.extent(cfDataSource.getFilteredData(),function(d) { return d.y;});
            //Apply the filter only if there are nodes less than the select min and greater than the selected max
            if(dataMinMaxX[0] < minMaxX[0] || dataMinMaxX[1] > minMaxX[1]) {
                cfDataSource.applyFilter('x',function(d) {
                    return d >= minMaxX[0] && d <= minMaxX[1];
                },minMaxX);
            }
            if(dataMinMaxY[0] < minMaxY[0] || dataMinMaxY[1] > minMaxY[1]) {
                cfDataSource.applyFilter('y',function(d) {
                    return d >= minMaxY[0] && d <= minMaxY[1];
                },minMaxY);
            }

            cfDataSource.fireCallBacks({source:'chart'});
        }
    }

    function dataLoadingHandler(chartView, chartConfig, chartOptions, chartDataRequestState) {
        var chartMessage = chartConfig.statusMessageHandler(chartDataRequestState);
        plotZoomScatterChartData(chartView, chartConfig, chartOptions);
        chartView.svg.attr('opacity', '0.8');
        if (chartConfig.defaultDataStatusMessage) {
            chartView.renderMessage(chartMessage);
        }
    }

    function dataEmptyHandler(chartView, chartConfig, chartDataRequestState) {
        var chartMessage = contrail.checkIfExist(chartConfig.noDataMessage) ? chartConfig.noDataMessage : chartConfig.statusMessageHandler(chartDataRequestState);

        chartView.renderMessage(chartMessage);
        updateFilteredCntInHeader(chartView);
    }

    function dataErrorHandler(chartView, chartDataRequestState) {
        var chartMessage = chartConfig.statusMessageHandler(chartDataRequestState);
        chartView.renderMessage(chartMessage);
        updateFilteredCntInHeader(chartView);
    }

    function dataSuccessHandler(chartView, chartConfig, chartOptions, chartDataRequestState) {
        plotZoomScatterChartData(chartView, chartConfig, chartOptions);
    }

    function updateFilteredCntInHeader(chartView) {
        var cfDataSource = chartView.attributes.viewConfig.cfDataSource;
        //Update cnt in title
        var headerElem = chartView.$el.parents('.widget-body').siblings('.widget-header')[0];
        if(headerElem != null && cfDataSource != null) {
            var filteredCnt = cfDataSource.getFilteredRecordCnt(),
                totalCnt = cfDataSource.getRecordCnt();
            var infoElem = ifNull($($(headerElem).contents()[1]),$(headerElem));
            var innerText = infoElem.text().split('(')[0].trim();
            if (filteredCnt == totalCnt) {
                innerText += ' (' + totalCnt + ')';
            } else {
                innerText += ' (' + filteredCnt + ' of ' + totalCnt + ')';
            }
            infoElem.text(innerText);
        }
    }

    function plotZoomScatterChartData(chartView, chartConfig, chartOptions) {
        var viewObjects = chartView.viewObjects,
            chartModel = chartView.chartModel,
            chartData = chartModel.chartData,
            tooltipConfigCB = chartOptions.tooltipConfigCB,
            bucketTooltipFn = chartOptions.bucketTooltipFn,
            clickCB = chartOptions.clickCB,
            overlapMap = getOverlapMap(chartData),
            timer = null, maxCircleRadius = chartConfig.maxCircleRadius;


        //Bind data to chart
        d3.select($(chartView.$el).find('svg rect.zs-rect')[0]).data([chartModel.data]);

        updateFilteredCntInHeader(chartView);
        viewObjects.selectAll("circle")
            .data(chartData)
            .enter()
            .append("circle")
            .attr("r", function (d) {
                return d['size'];
            })
            .attr("class", function (d) {
                return getBubbleColor(d[chartConfig.colorFilterFields], chartModel.classes, chartModel.maxColorFilterFields);
            })
            .attr("transform", function (d) {
                var xTranslate = chartModel.xScale(d[chartConfig.xField]) + maxCircleRadius,
                    yTranslate = chartModel.yScale(d[chartConfig.yField]);
                //Position the non x/y nodes at axis start
                if(!$.isNumeric(xTranslate))
                    xTranslate = chartModel.xScale.range()[0] + maxCircleRadius;
                if(!$.isNumeric(yTranslate))
                    yTranslate = chartModel.yScale.range()[0];
                return "translate(" + xTranslate + "," + yTranslate + ")";
            })
            .attr("opacity", "0.6")
            .on("mouseenter", function (d) {
                var tooltipData = d;
                if(tooltipData['isBucket'] == true) {
                    tooltipConfigCB = bucketTooltipFn;
                }
                var selfOffset = $(this).offset(),
                    tooltipConfig = tooltipConfigCB(tooltipData);

                clearTimeout(timer);
                timer = setTimeout(function () {
                    constructTooltip(selfOffset, tooltipData, tooltipConfigCB, overlapMap, chartData,chartView);
                }, contrail.handleIfNull(tooltipConfig.delay, cowc.TOOLTIP_DELAY));
            })
            .on("mouseleave", function (d) {
                clearTimeout(timer);
            })
            .on("click", function (d) {
                clearTimeout(timer);
                if(chartOptions['doBucketize'] == true && getValueByJsonPath(d,'children',[]).length > 1) {
                    zoomIn({
                        d : d,
                        viewConfig : chartView.attributes.viewConfig,
                        cfDataSource : chartView.attributes.viewConfig.cfDataSource,
                        selector: chartView.$el
                    });
                } else {
                    if(getValueByJsonPath(d,'children',[]).length == 1) {
                        d = d['children'][0];
                    }
                    clickCB(d);
                }
            });
    }

    function renderChartMessage(chartView, noDataMessage) {
        var chartSVG = chartView.svg,
            chartModel = chartView.chartModel,
            margin = chartModel.margin,
            noDataText = chartSVG.selectAll('.nv-noData').data([noDataMessage]);

        noDataText.enter().append('text')
            .attr('class', 'nvd3 nv-noData')
            .attr('dy', '-.7em')
            .style('text-anchor', 'middle');

        noDataText.attr('x', chartModel.width / 2)
            .attr('y', margin.top + (chartModel.height / 2))
            .text(function (d) {
                return d
            });

        if (chartModel.isRequestInProgress()) {
            noDataText.style('fill', '#000');
        }
    };

    function getChartZoomFn(chartView, chartConfig) {
        return function () {
            var chartModel = chartView.chartModel;

            //Restrict translation to 0 value
            var reset_s = 0;
            if ((chartModel.xScale.domain()[1] - chartModel.xScale.domain()[0]) >= (chartModel.xMax - chartModel.xMin)) {
                chartModel.zoomBehavior.x(chartModel.xScale.domain([chartModel.xMin, chartModel.xMax]));
                reset_s = 1;
            }
            if ((chartModel.yScale.domain()[1] - chartModel.yScale.domain()[0]) >= (chartModel.yMax - chartModel.yMin)) {
                chartModel.zoomBehavior.y(chartModel.yScale.domain([chartModel.yMin, chartModel.yMax]));
                reset_s += 1;
            }
            if (reset_s == 2) {
                // Both axes are full resolution. Reset.
                chartModel.zoomBehavior.scale(1);
                chartModel.zoomBehavior.translate([0, 0]);
            }
            else {
                if (chartModel.xScale.domain()[0] < chartModel.xMin) {
                    chartModel.xScale.domain([chartModel.xMin, chartModel.xScale.domain()[1] - chartModel.xScale.domain()[0] + chartModel.xMin]);
                }
                if (chartModel.xScale.domain()[1] > chartModel.xMax) {
                    var xdom0 = chartModel.xScale.domain()[0] - chartModel.xScale.domain()[1] + chartModel.xMax;
                    chartModel.xScale.domain([xdom0, chartModel.xMax]);
                }
                if (chartModel.yScale.domain()[0] < chartModel.yMin) {
                    chartModel.yScale.domain([chartModel.yMin, chartModel.yScale.domain()[1] - chartModel.yScale.domain()[0] + chartModel.yMin]);
                }
                if (chartModel.yScale.domain()[1] > chartModel.yMax) {
                    var ydom0 = chartModel.yScale.domain()[0] - chartModel.yScale.domain()[1] + chartModel.yMax;
                    chartModel.yScale.domain([ydom0, chartModel.yMax]);
                }
            }

            chartView.svg
                .select(".x.axis").call(chartModel.xAxis)
                .selectAll("text")
                .attr("x", 0)
                .attr("y", 8);

            chartView.svg
                .select(".y.axis").call(chartModel.yAxis)
                .selectAll("text")
                .attr("x", -8)
                .attr("y", 0);

            chartView.svg.selectAll("circle").attr("transform", function (d) {
                var xTranslate = chartModel.xScale(d[chartConfig.xField]) + chartConfig.maxCircleRadius,
                    yTranslate = chartModel.yScale(d[chartConfig.yField]);
                //Position the non x/y nodes at axis start
                if(!$.isNumeric(xTranslate))
                    xTranslate = chartModel.xScale.range()[0] + chartConfig.maxCircleRadius;
                if(!$.isNumeric(yTranslate))
                    yTranslate = chartModel.yScale.range()[0];
                return "translate(" + xTranslate + "," + yTranslate + ")";
            });
        };
    };

    function initZoomEvents(controlPanelSelector, chartView, chartConfig) {
        var zoomFn = getChartZoomFn(chartView, chartConfig);

        $(controlPanelSelector).find('.zoom-in').on('click', function (event) {
            if (!$(this).hasClass('disabled')) {
                event.preventDefault();
                if (chartView.zm.scale() < chartConfig.maxScale) {
                    chartView.zm.scale(chartView.zm.scale() * (1.25));
                    zoomFn();
                }

            }
        });

        $(controlPanelSelector).find('.zoom-out').on('click', function (event) {
            if (!$(this).hasClass('disabled')) {
                event.preventDefault();
                if (chartView.zm.scale() > chartConfig.minScale) {
                    chartView.zm.scale(chartView.zm.scale() * (100 / 125));
                    zoomFn();
                }
            }
        });

        $(controlPanelSelector).find('.zoom-reset').on('click', function (event) {
            if (!$(this).hasClass('disabled')) {
                event.preventDefault();
                if(chartConfig.doBucketize == true) {
                    zoomOut({
                        cfDataSource:chartView.attributes.viewConfig.cfDataSource
                    })
                    return;
                }
                var chartModel = chartView.chartModel;
                chartModel.zoomBehavior
                    .x(chartModel.xScale.domain([chartModel.xMin, chartModel.xMax]).range([0, chartModel.width]))
                    .y(chartModel.yScale.domain([chartModel.yMin, chartModel.yMax]).range([chartModel.height, 0]));

                chartView.svg.select(".x.axis")
                    .call(chartModel.xAxis)
                    .selectAll("text")
                    .attr("x", 0)
                    .attr("y", 8);
                chartView.svg.select(".y.axis")
                    .call(chartModel.yAxis)
                    .selectAll("text")
                    .attr("x", -8)
                    .attr("y", 0);

                chartView.svg.selectAll("circle")
                    .attr("transform", function (d) {
                        var xTranslate = chartModel.xScale(d[chartConfig.xField]) + chartConfig.maxCircleRadius,
                            yTranslate = chartModel.yScale(d[chartConfig.yField]);
                        //Position the non x/y nodes at axis start
                        if(!$.isNumeric(xTranslate))
                            xTranslate = chartModel.xScale.range()[0] + chartConfig.maxCircleRadius;
                        if(!$.isNumeric(yTranslate))
                            yTranslate = chartModel.yScale.range()[0];
                        return "translate(" + xTranslate + "," + yTranslate + ")";
                    });
                chartView.zm.scale(1);
                chartView.zm.translate([0, 0]);
            }
        });

        function translateChart(xy, constant) {
            return chartView.zm.translate()[xy] + (constant * (chartView.zm.scale()));
        };
    };

    function getControlPanelConfig(chartView, chartConfig, chartOptions, selector) {
        var zoomEnabled = true;
        var chartControlPanelExpandedSelector = $(selector).find('.chart-control-panel-expanded-container'),
            controlPanelConfig = {
                default: {
                    zoom: {
                        enabled: zoomEnabled,
                        doBucketize: chartConfig['doBucketize'],
                        events: function (controlPanelSelector) {
                            initZoomEvents(controlPanelSelector, chartView, chartConfig)
                        }
                    }
                },
                custom: {
                }
            };
            controlPanelConfig.custom.zoomBySelectedArea = {
                    iconClass: 'icon-crop',
                    title: 'Zoom By Selection',
                    events: {
                        click: function (event, self, controlPanelSelector) {
                            chartView.zoomBySelection = !chartView.zoomBySelection;
                            $(self).toggleClass('active');
                            $(self).removeClass('refreshing');
                            if ($(self).hasClass('active')) {
                                $('svg.zoom-scatter-chart').find('rect').addClassSVG('cursor-crosshair');
                            } else {
                                $('svg.zoom-scatter-chart').find('rect').removeClassSVG('cursor-crosshair');
                                $(controlPanelSelector).find('.control-panel-item').removeClass('disabled');
                            }
                        }
                    }
                }

        //Don't show Bucketize icon
        /*
        if(chartConfig['doBucketize'] == true) {
            controlPanelConfig.custom.zoomReset = {
                iconClass: 'icon-remove-circle active',
                    title: 'Reset',
                events: {
                    click: function (event, self, controlPanelSelector) {
                        $(self).toggleClass('active');
                        $(self).removeClass('refreshing');
                        zoomOut({cfDataSource:chartView.attributes.viewConfig.cfDataSource});
                        $(controlPanelSelector).find('.control-panel-item').removeClass('disabled');
                    }
                }
            }
        }*/
        /*
        if(chartConfig['doBucketize'] == true) {
            controlPanelConfig.custom.bucketize = {
                iconClass: 'icon-align-left active',
                    title: 'Bucketize',
                events: {
                    click: function (event, self, controlPanelSelector) {
                        $(self).toggleClass('active');
                        $(self).toggleClass('bucketize');
                        var viewConfig = chartView.attributes.viewConfig;
                        if($(self).hasClass('bucketize')) {
                            viewConfig['chartOptions']['doBucketize'] = true;
                        } else {
                            viewConfig['chartOptions']['doBucketize'] = false;
                        }
                        $(controlPanelSelector).find('.control-panel-item').removeClass('disabled');
                        $(self).removeClass('refreshing');
                        chartView.renderChart(selector,viewConfig,chartView.model);
                    }
                }
            }
        }*/
        if(contrail.checkIfKeyExistInObject(true, chartOptions, 'controlPanelConfig.filter.enable') && chartOptions.controlPanelConfig.filter.enable) {
            controlPanelConfig.custom.filter = getControlPanelFilterConfig(chartOptions.controlPanelConfig.filter, chartControlPanelExpandedSelector, chartView.model,{
                cfDataSource:chartView.attributes.viewConfig.cfDataSource})
        }

        if(contrail.checkIfKeyExistInObject(true, chartOptions, 'controlPanelConfig.legend.enable') && chartOptions.controlPanelConfig.legend.enable) {
            controlPanelConfig.custom.legend = getControlPanelLegendConfig(chartOptions.controlPanelConfig.legend, chartControlPanelExpandedSelector)
        }

        return controlPanelConfig;
    };

    var getControlPanelFilterConfig = function(customControlPanelFilterConfig, chartControlPanelExpandedSelector, listModel,filterCfg) {
        var filterCfg = ifNull(filterCfg,{});
        var cfDataSource = filterCfg['cfDataSource'];
        var scatterFilterFn = function(item, args) {
            if (args.itemCheckedLength == 0) {
                return true;
            } else if (args.itemValue.filterFn(item)) {
                return args.itemChecked;
            } else {
                return true;
            }
        };

        return {
            iconClass: 'icon-filter',
                title: 'Filter',
            events: {
                click: function (event, self, controlPanelSelector) {
                    var controlPanelExpandedTemplateConfig = customControlPanelFilterConfig.viewConfig;

                    if (chartControlPanelExpandedSelector.find('.control-panel-filter-container').length == 0) {
                        var controlPanelExpandedTemplate = contrail.getTemplate4Id(cowc.TMPL_CONTROL_PANEL_FILTER);

                        chartControlPanelExpandedSelector.html(controlPanelExpandedTemplate(controlPanelExpandedTemplateConfig));
                    }

                    $(self).toggleClass('active');
                    $(self).toggleClass('refreshing');

                    chartControlPanelExpandedSelector.toggle();

                    if (chartControlPanelExpandedSelector.is(':visible')) {
                        $.each(controlPanelExpandedTemplateConfig.groups, function (groupKey, groupValue) {
                            $.each(groupValue.items, function (itemKey, itemValue) {
                                $($('#control-panel-filter-group-items-' + groupValue.id).find('input')[itemKey])
                                    .off('click')
                                    .on('click', function (event) {
                                        if(cfDataSource == null) {
                                            var itemChecked = $(this).is(':checked'),
                                                itemCheckedLength = $('#control-panel-filter-group-items-' + groupValue.id).find('input:checked').length,
                                                scatterFilterArgs = {
                                                    itemChecked: itemChecked,
                                                    itemCheckedLength: itemCheckedLength,
                                                    itemValue: itemValue
                                                };


                                            if (itemCheckedLength == 0) {
                                                $('#control-panel-filter-group-items-' + groupValue.id).find('input').prop('checked', true);
                                            }

                                            listModel.setFilterArgs(scatterFilterArgs);
                                            listModel.setFilter(scatterFilterFn);

                                            if (contrail.checkIfKeyExistInObject(true, itemValue, 'events.click')) {
                                                itemValue.events.click(event)
                                            }
                                        } else {
                                            var itemCheckedLength = $('#control-panel-filter-group-items-' + groupValue.id).find('input:checked').length;
                                            if (itemCheckedLength == 0) {
                                                $('#control-panel-filter-group-items-' + groupValue.id).find('input').prop('checked', true);
                                            }
                                            var colorFilterFunc = getColorFilterFn($(this));
                                            if(cfDataSource != null) {
                                                cfDataSource.applyFilter('colorFilter',colorFilterFunc);
                                                cfDataSource.fireCallBacks({source:'chart'});
                                            }
                                        }
                                    });
                            });
                        });

                        chartControlPanelExpandedSelector.find('.control-panel-filter-close')
                            .off('click')
                            .on('click', function() {
                                chartControlPanelExpandedSelector.hide();
                                $(self).removeClass('active');
                                $(self).removeClass('refreshing');
                                $(controlPanelSelector).find('.control-panel-item').removeClass('disabled');
                            });

                        chartControlPanelExpandedSelector.find('.control-panel-group-filter-title')
                            .off('click')
                            .on('click', function() {
                                listModel.setFilter(function(item) {
                                    return true;
                                });

                                $(this).parent().find('.control-panel-filter-group-items').find('input').prop('checked', true);
                            });
                    } else {
                        $(controlPanelSelector).find('.control-panel-item').removeClass('disabled');
                    }

                    event.stopPropagation();
                }
            }
        };
    };

    var getControlPanelLegendConfig = function(customControlPanelFilterConfig, chartControlPanelExpandedSelector) {
        return {
            iconClass: 'icon-info-sign',
            title: 'Information',
            events: {
                click: function (event, self, controlPanelSelector) {
                    var controlPanelExpandedTemplate = contrail.getTemplate4Id(cowc.TMPL_ZOOMED_SCATTER_CHART_CONTROL_PANEL_LEGEND),
                        controlPanelExpandedTemplateConfig = customControlPanelFilterConfig.viewConfig;

                    $(self).toggleClass('active');
                    chartControlPanelExpandedSelector.toggle();

                    if (chartControlPanelExpandedSelector.is(':visible')) {
                        chartControlPanelExpandedSelector.html(controlPanelExpandedTemplate(controlPanelExpandedTemplateConfig));

                        $.each(controlPanelExpandedTemplateConfig.groups, function (groupKey, groupValue) {
                            $.each(groupValue.items, function (itemKey, itemValue) {
                                $($('#control-panel-filter-group-items-' + groupValue.id).find('input')[itemKey])
                                    .on('click', itemValue.events.click);
                            });
                        });

                        chartControlPanelExpandedSelector.find('.control-panel-legend-close')
                            .off('click')
                            .on('click', function() {
                                chartControlPanelExpandedSelector.hide();
                                $(self).removeClass('active');
                                $(self).removeClass('refreshing');
                                $(controlPanelSelector).find('.control-panel-item').removeClass('disabled');

                            });
                    }

                    event.stopPropagation();
                }
            }
        };
    };

    function getOverlapMap(data) {
        var tempMap = {},
            finalOverlapMap = {};
        $.each(data, function (index, value) {
            var key = (value['x'] + ',' + value['y']);
            if (key in finalOverlapMap) {
                finalOverlapMap[key].push(index);
            } else {
                if (key in tempMap) {
                    tempMap[key].push(index);
                    finalOverlapMap[key] = tempMap[key];
                    delete tempMap[key];
                } else {
                    var overlapArray = [];
                    overlapArray.push(index);
                    tempMap[key] = overlapArray;
                }
            }
        });
        return finalOverlapMap;
    };

    function generateTooltipHTML(tooltipConfig) {
        var tooltipElementTemplate = contrail.getTemplate4Id(cowc.TMPL_ELEMENT_TOOLTIP),
            tooltipElementTitleTemplate = contrail.getTemplate4Id(cowc.TMPL_ELEMENT_TOOLTIP_TITLE),
            tooltipElementContentTemplate = contrail.getTemplate4Id(cowc.TMPL_ELEMENT_TOOLTIP_CONTENT),
            tooltipElementObj, tooltipElementTitleObj, tooltipElementContentObj;

        tooltipConfig = $.extend(true, {}, cowc.DEFAULT_CONFIG_ELEMENT_TOOLTIP, tooltipConfig);

        tooltipElementObj = $(tooltipElementTemplate(tooltipConfig));
        tooltipElementTitleObj = $(tooltipElementTitleTemplate(tooltipConfig.title));
        tooltipElementContentObj = $(tooltipElementContentTemplate(tooltipConfig.content));

        tooltipElementObj.find('.popover-title').append(tooltipElementTitleObj);
        tooltipElementObj.find('.popover-content').append(tooltipElementContentObj);

        return tooltipElementObj;
    };

    function onDocumentClicktHandler(e) {
        if (!$(e.target).closest('.zoomed-scatter-popover-tooltip').length) {
            $('.zoomed-scatter-popover-tooltip').remove();
        }
    };

    function destroyTooltip(tooltipElementObj, overlappedElementsDropdownElement) {
        if (contrail.checkIfExist(overlappedElementsDropdownElement) && contrail.checkIfExist(overlappedElementsDropdownElement.data('contrailDropdown'))) {
            overlappedElementsDropdownElement.data('contrailDropdown').destroy();
        }
        if (tooltipElementObj !== null) {
            $(tooltipElementObj).remove();
        } else {
            $('.zoomed-scatter-popover-tooltip').remove();
        }

    };

    function constructTooltip(selfOffset, tooltipData, tooltipConfigCB, overlapMap, chartData,chartView) {
        var tooltipConfig = tooltipConfigCB(tooltipData),
            tooltipElementObj = generateTooltipHTML(tooltipConfig),
            tooltipElementKey = tooltipData['x'] + ',' + tooltipData['y'],
            overlappedElementsDropdownElement = null;

        destroyTooltip(null, overlappedElementsDropdownElement);
        $('body').append(tooltipElementObj);
        tooltipElementObj.addClass('zoomed-scatter-popover-tooltip');

        if (tooltipElementKey in overlapMap) {
            var overlappedElementData = $.map(overlapMap[tooltipElementKey], function (overlapMapValue, overlapMapKey) {
                var overlappedElementName = contrail.handleIfNull(chartData[overlapMapValue].name, '-'),
                    overlappedElementType = contrail.checkIfKeyExistInObject(true, tooltipConfig.content, 'overlappedElementConfig.dropdownTypeField') ?
                        ctwl.get(chartData[overlapMapValue][tooltipConfig.content.overlappedElementConfig.dropdownTypeField]) : null;

                if (!_.isEqual(chartData[overlapMapValue], tooltipData)) {
                    return {id: overlapMapValue, text: overlappedElementName + ((overlappedElementType !== null) ? ' (' + overlappedElementType + ')' : '')}
                }
                return null;
            });

            $(tooltipElementObj).find('.popover-tooltip-footer').append('<div class="overlapped-elements-dropdown"></div>');
            overlappedElementsDropdownElement = $(tooltipElementObj).find('.overlapped-elements-dropdown');

            overlappedElementsDropdownElement.contrailDropdown({
                dataTextField: 'text',
                dataValueField: 'id',
                placeholder: 'View more (' + overlappedElementData.length + ')',
                defaultValueId: -1,
                dropdownCssClass: 'min-width-250',
                data: overlappedElementData,
                change: function (e) {
                    var selectedTooltipKey = e.added.id,
                        selectedTooltipData = chartData[selectedTooltipKey];

                    $(tooltipElementObj).remove();
                    constructTooltip(selfOffset, selectedTooltipData, tooltipConfigCB, overlapMap, chartData);
                }
            });
        }

        var tooltipWidth = tooltipElementObj.width(),
            tooltipHeight = tooltipElementObj.height(),
            windowWidth = $(document).width(),
            tooltipPositionTop = 0,
            tooltipPositionLeft = selfOffset.left;

        if (selfOffset.top > tooltipHeight / 2) {
            tooltipPositionTop = selfOffset.top - tooltipHeight / 2;
        }

        if ((windowWidth - selfOffset.left) < tooltipWidth) {
            tooltipPositionLeft = selfOffset.left - tooltipWidth - 10;
        } else {
            tooltipPositionLeft += 20;
        }

        $(tooltipElementObj).css({
            top: tooltipPositionTop,
            left: tooltipPositionLeft
        });

        $(tooltipElementObj).find('.popover-tooltip-footer').find('.btn')
            .off('click')
            .on('click', function () {
                var actionKey = $(this).data('action'),
                    actionCallback = tooltipConfig.content.actions[actionKey].callback;

                destroyTooltip(tooltipElementObj, overlappedElementsDropdownElement);
                //Drill-down only if it's a bucket comprising of multiple nodes
                if(tooltipData['isBucket'] == true && getValueByJsonPath(tooltipData,'children',[]).length > 1) {
                    zoomIn({
                        d : tooltipData,
                        viewConfig : chartView.attributes.viewConfig,
                        cfDataSource : chartView.attributes.viewConfig.cfDataSource,
                        selector: chartView.$el
                    });
                } else {
                    actionCallback(tooltipData);
                }
            });

        $(tooltipElementObj).find('.popover-remove')
            .off('click')
            .on('click', function (e) {
                destroyTooltip(tooltipElementObj, overlappedElementsDropdownElement);
            });

        $(document)
            .off('click', onDocumentClicktHandler)
            .on('click', onDocumentClicktHandler);

        $(window).on('popstate', function (event) {
            $('.zoomed-scatter-popover-tooltip').remove();
        });
    };

    function getBubbleColor(val, array, maxColorFilterFields) {
        if (val == null) {
            return 'default';
        } else {
            return val;
        }
    };

    function computeBubbleColor(val, array, maxColorFilterFields) {
        if (val > (0.9 * maxColorFilterFields)) {
            return array[0];
        } else if (val > (0.75 * maxColorFilterFields)) {
            return array[1];
        } else if (val > (0.50 * maxColorFilterFields)) {
            return array[2];
        } else if (val > (0.25 * maxColorFilterFields)) {
            return array[3];
        } else {
            return array[4];
        }
    };

    function getChartConfig(selector, chartOptions) {
        var margin = $.extend(true, {}, {top: 20, right: 5, bottom: 50, left: 50}, chartOptions['margin']),
            chartSelector = $(selector).find('.chart-container'),
            width = $(chartSelector).width() - 10,
            height = 275;

        var chartViewConfig = {
            maxCircleRadius: 10,
            maxScale: 5,
            minScale: 1 / 5,
            yLabel: chartOptions.yLabel,
            xLabel: chartOptions.xLabel,
            yLabelFormat: chartOptions.yLabelFormat,
            xLabelFormat: chartOptions.xLabelFormat,
            xField: 'x',
            yField: 'y',
            forceX: chartOptions.forceX,
            forceY: chartOptions.forceY,
            colorFilterFields: 'color',
            titleKey: chartOptions.titleField,
            categoryKey: 'project',
            margin: margin,
            height: height,
            width: width,
            dataParser: chartOptions['dataParser'],
            sizeFieldName: chartOptions['sizeFieldName'],
            noDataMessage: chartOptions['noDataMessage'],
            doBucketize : chartOptions['doBucketize'],
            bubbleSizeFn: chartOptions['bubbleSizeFn'],
            defaultDataStatusMessage: true,
            statusMessageHandler: cowm.getRequestMessage
        };

        return chartViewConfig;
    };

    return ZoomScatterChartView;
});

define('js/core-bundle',[
        'chart-utils',
        'core-constants',
        'core-formatters',
        'core-cache',
        'core-labels',
        'core-messages',
        'core-views-default-config',
        'core.app.utils',
        'contrail-remote-data-handler',
        'cf-datasource',
        'contrail-view',
        'contrail-model',
        'contrail-view-model',
        'contrail-list-model',
        // 'lodash',
        // 'slick.core',
        // 'slick.dataview',
        // 'bezier',
        'crossfilter',
        'backbone',
        'text',
        'knockout',
        'core-basedir/js/views/BarChartInfoView',
        'core-basedir/js/views/BreadcrumbDropdownView',
        'core-basedir/js/views/BreadcrumbTextView',
        'core-basedir/js/views/ChartView',
        'core-basedir/js/views/ControlPanelView',
        'core-basedir/js/views/InfoboxesView',
        'core-basedir/js/views/SectionView',
        'core-basedir/js/views/WidgetView',
        'core-basedir/js/views/ZoomScatterChartView'
        ],function() {});



        
       

