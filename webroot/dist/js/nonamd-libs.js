/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

var contentContainer = "#content-container";
if(typeof(globalObj) == "undefined")
    globalObj = {};
globalObj['loadedScripts'] = [];
globalObj['loadedCSS'] = [];
globalObj['orchModel'] = 'openstack';
globalObj.NUM_FLOW_DATA_POINTS = 1000;
var globalAlerts = [];
globalObj['timeStampTolerance'] = 5 * 60 * 1000;//To check the mismatch between the browser time and the webserver time
var enableHardRefresh = false;  //Set to true if "Hard Refresh" provision need to be shown in UI
//Set to true if we want to discard ongoing requests while refreshing the dataSource and start fetching from beginnging
//Ajax calls shouldn't be aborted if we don't want to discard ongoing update
var discardOngoingUpdate = true;
var DEFAULT_TIME_SLICE = 3600000,
    pageContainer = "#content-container",
    dblClick = 0;
var CONTRAIL_STATUS_USER = [];
globalObj['roles'] = {TENANT : "member",ADMIN : "superAdmin"};
var CONTRAIL_STATUS_PWD = [];
var flowKeyStack = [];
var aclIterKeyStack = [];
var d3Colors = {red:'#dc6660',green:'#7dc48a',blue:'#7892dd',orange:'#ffbf87'};
if(typeof(built_at) == 'undefined')
    built_at = '';
var TENANT_API_URL = "/api/tenant/get-data";
var SANDESH_DATA_URL = "/api/admin/monitor/infrastructure/get-sandesh-data";
var INDENT_RIGHT = "&nbsp;&nbsp;&nbsp;&nbsp;";
var INST_PAGINATION_CNT = 50;
var NETWORKS_PAGINATION_CNT = 25;
// Need to move to controller.utils.js files once the functions are accessible globally
var ctInitComplete = false;
var sInitComplete = false;
var sevLevels = {
    ERROR   : 0, //Red
    WARNING : 1, //Orange
    NOTICE  : 2, //Blue
    INFO    : 3, //Green
}
var infraAlertMsgs = {
        'UVE_MISSING'           : "System Information unavailable", 
        'PARTIAL_UVE_MISSING'   : "Partial System Information",
        'CONFIG_MISSING'        : "Configuration unavailable",
        'CONFIG_IP_MISMATCH'    : "Configured IP mismatch",
        'IFMAP_DOWN'            : "Ifmap connection down",
        'BGP_CONFIG_MISMATCH'   : "BGP peer configuration mismatch",
        'PROCESS_STATES_MISSING': "Process States unavailable",
        'DOWN_CNT'              : "{0} Down",        //Used for displaying "XMPP Peers" & "BGP Peers" in node tooltip 
        'BGP_PEER_DOWN'         : "{0:BGP Peer;BGP Peers} down",
        'XMPP_PEER_DOWN'        : "{0:XMPP Peer;XMPP Peers} down",
        'INTERFACE_DOWN'        : "{0:Interface;Interfaces} down",
        'TIMESTAMP_MISMATCH_BEHIND'   : "Browser is {0} behind system time",
        'TIMESTAMP_MISMATCH_AHEAD'    : "Browser is {0} ahead of system time",
        'IFMAP_DOWN'            : "Ifmap Connection down",
        'PROCESS_DOWN'          : "{0:Process;Processes} down",
        'PROCESS_STARTING'      : "{0:Process;Processes} starting",
        'PROCESS_STOPPED'       : "{0} stopped",
        'PROCESS_DOWN_MSG'      : "{0} down",
        'PROCESS_STARTING_MSG'  : "{0} starting",
        'PROCESS_COREDUMP'      : "{0:core dump;core dumps}",
        'PROCESS_RESTART'       : "{0:restart;restarts}",
        'SPACE_THRESHOLD_EXCEEDED'  : '{0} space usage exceeds threshold',
        'SPACE_USAGE_WARNING'   : '{0} space usage warning',
        'NTP_UNSYNCED_ERROR'    : 'NTP state unsynchronized'
    }
////Contant to check if a nodemanger is installed in the setup or not and use is appropriately
var IS_NODE_MANAGER_INSTALLED = true;

var NO_RELOAD_JS_CLASSLIST = [
    'infraMonitorView',
    'tenantNetworkMonitorView',
    'clustersPageLoader',
    'serversPageLoader',
    'imagesPageLoader',
    'packagesPageLoader',
    'smPageLoader',
    'mnPageLoader'
];

//Sets the following prototype if not defined already.
//Array.prototype.unique - returns unique values of an array.
//Array.prototype.diff - difference between two arrays.
//Array.prototype.move - moves an element from one index to another.
//String.prototype.trim - trims 'spaces' of a string, both preceeding and succeeding.
initializePrototypes();

function initializePrototypes() {
    if (!String.prototype.trim) {
        String.prototype.trim = function () {
            return
            this.replace(/(?:(?:^|\n)s+|s+(?:$|\n))/g, "").replace(/s+/g, " ");
        };
    }
    if (!Array.prototype.diff) {
        Array.prototype.diff = function(a) {
            return this.filter(function(i) {return !(a.indexOf(i) > -1);});
        };
    }
    if (!Array.prototype.unique) {
	    Array.prototype.unique = function() {
	        var unique = [];
	        for (var i = 0; i < this.length; i++) {
	            if (unique.indexOf(this[i]) == -1) {
	                unique.push(this[i]);
	            }
	        }
	        return unique;
	    };
    }
    if (!Array.prototype.move) {
        Array.prototype.move = function (old_index, new_index) {
            while (old_index < 0) {
                old_index += this.length;
            }
            while (new_index < 0) {
                new_index += this.length;
            }
            if (new_index >= this.length) {
                var k = new_index - this.length;
                while ((k--) + 1) {
                    this.push(undefined);
                }
            }
            this.splice(new_index, 0, this.splice(old_index, 1)[0]);
            return this;
        };
    }
}

function collapseElement(e,collapseDivID) {
    if($(e).prop("tagName").toUpperCase() == "I"){
        $(e).toggleClass('icon-caret-right').toggleClass('icon-caret-down');
    } else {
        $(e).find("i.icon-caret-right,i.icon-caret-down").toggleClass('icon-caret-right').toggleClass('icon-caret-down');
    }
    //var widgetBodyElem = $(e).parents('div.widget-box').find('div.widget-body');
    var widgetBoxElem;
    if(collapseDivID != null && collapseDivID != "" && collapseDivID != undefined){
        widgetBoxElem = $(collapseDivID);
       // widgetBoxElem.toggleClass('hide');	
    }
    else 
        widgetBoxElem = $(e).parents('div.widget-box');
    $(widgetBoxElem).toggleClass('collapsed');	
}


globalObj['siteMap'] = {};
globalObj['siteMapSearchStrings'] = [];

function keys(obj) {
    var count = 0;
    for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
            count++;
        }
    }
    return count;
}

var defaultSeriesColors = [ "#70b5dd", "#1083c7", "#1c638d" ];
var defColors = ['#1c638d', '#4DA3D5'];

(function ($) {
    $.extend($.fn, {
        initWidgetHeader:function (data) {
            var widgetHdrTemplate = contrail.getTemplate4Id("widget-header-template");
            $(this).html(widgetHdrTemplate(data));
            if(data['widgetBoxId'] != undefined){
                startWidgetLoading(data['widgetBoxId']);
            }
            if (data['link'] != null)
                $(this).find('span').addClass('href-link');
            $(this).find('span').on('click', function () {
                if ((data['link'] != null) && (data['link']['hashParams'] != null))
                    layoutHandler.setURLHashObj(data['link']['hashParams']);
            });
        },
    });
})(jQuery);

function formatLblValueTooltip(infoObj) {
    var tooltipTemplateSel = 'title-lblval-tooltip-template';
    var tooltipTemplate = contrail.getTemplate4Id(tooltipTemplateSel);
    return tooltipTemplate(infoObj);
}

function formatLblValueMultiTooltip(data) {
    var tooltipTemplateSel = 'overlapped-bubble-tooltip';
    var tooltipTemplate = contrail.getTemplate4Id(tooltipTemplateSel);
    return tooltipTemplate(data);
}
/**
 * As dataSource events don't trigger on cached dataSource's, trigger events manually
 */
function triggerDatasourceEvents(dataSource){
    if(dataSource != null) {
        $(dataSource).trigger('change');
    }
}

function prettifyBytes(obj) {
    var bytes = obj['bytes'];
    var maxPrecision = obj['maxPrecision'];
    var noDecimal = obj['noDecimal'];
    var stripUnit = obj['stripUnit'];
    if (!$.isNumeric(bytes))
        return '-';
    if (bytes == 0)
        return (stripUnit != null) ? 0 : '0 B';
    var formatStr = '';
    var decimalDigits = 2;
    if ((maxPrecision != null) && (maxPrecision == true))
        decimalDigits = 6;
    if (noDecimal != null && noDecimal == true)
        decimalDigits = 0;
    //Ensure that bytes is always positive
    bytes = parseInt(bytes);
    bytes = makePositive(bytes);
    var bytePrefixes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB'];
    var multipliers = [
        1, //B
        1024, //KB
        1024 * 1024, //MB
        1024 * 1024 * 1024, //GB
        1024 * 1024 * 1024 * 1024, //TB
        1024 * 1024 * 1024 * 1024 * 1024, //PB
        1024 * 1024 * 1024 * 1024 * 1024 * 1024, //EB
        1024 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024 //ZB
    ];
    var prefixIdx = 0;
    var multiplier = 1;
    if ($.inArray(obj['prefix'], bytePrefixes) > -1) {
        prefixIdx = $.inArray(obj['prefix'], bytePrefixes);
        multiplier = multipliers[prefixIdx];
    } else
        $.each(bytePrefixes, function (idx, prefix) {
            //Can be converted into higher unit
            if (bytes / multiplier > 1024) {
                multiplier = multiplier * 1024;
                prefixIdx++;
            } else
                return false;
        });
    if (stripUnit != null)
        formatStr = parseFloat((bytes / multiplier).toFixed(decimalDigits));
    else
        formatStr = contrail.format('{0} {1}', (bytes / multiplier).toFixed(decimalDigits), bytePrefixes[prefixIdx]);
    logMessage('formatBytes', bytes, multiplier, prefixIdx, bytes / multiplier);
    return formatStr;
}
/*
 * This function formats the Throughput value if the input is integer/float which inturn uses the
 * formatBytes function 
 * example of output 1234 bps 
 */
function formatThroughput(bytes,noDecimal,maxPrecision) {
    var data = formatBytes(bytes,noDecimal,maxPrecision);
    if(data != '-')
        return data.replace('B','b') + 'ps';
    else
        return '-';
}

function formatBytes(bytes, noDecimal, maxPrecision, precision) {
    if (!$.isNumeric(bytes))
        return '-';
    if (bytes == 0)
        return '0 B';
    var formatStr = '';
    var decimalDigits = 2;
    if ((maxPrecision != null) && (maxPrecision == true)) {
        decimalDigits = 6;
    } else if(precision != null) {
        decimalDigits = precision < 7 ? precision : 6;
    }
    if (noDecimal != null && noDecimal == true)
        decimalDigits = 0;
    //Ensure that bytes is always positive
    bytes = parseInt(bytes);
    bytes = makePositive(bytes);
    var bytePrefixes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB']
    $.each(bytePrefixes, function (idx, prefix) {
        if (bytes < 1024) {
            formatStr = contrail.format('{0} {1}', parseFloat(bytes.toFixed(decimalDigits)), prefix);
            return false;
        } else {
            //last iteration
            if (idx == (bytePrefixes.length - 1))
                formatStr = contrail.format('{0} {1}', parseFloat(bytes.toFixed(decimalDigits)), prefix);
            else
                bytes = bytes / 1024;
        }
    });
    return formatStr;
}

function formatNumberByCommas(num) {
    var numString = num.toString().split("").reverse(),
        formattedNumstring = [],
        numStringLength = numString.length;

    for (var i = 0 ; i < numStringLength; i = i + 3) {
        if (numStringLength - i < 3) {
            formattedNumstring = formattedNumstring.concat(numString.slice(i, numStringLength));
        } else {
            formattedNumstring = formattedNumstring.concat(numString.slice(i, i + 3));
            if (numStringLength - i > 3) {
                formattedNumstring = formattedNumstring.concat([',']);
            }
        }
    }

    return formattedNumstring.reverse().join('');
}

function convertToBytes(formattedBytes) {
    var formatStr;
    var decimalDigits = 2;
    var arr = formattedBytes.split(" ");
    var value = arr[0];
    var unit = arr[1];
    var unitMultiplier = {'B':1, 'KB':1024, 'MB':1024 * 1024, 'GB':1024 * 1024 * 1024};
    return value * unitMultiplier[unit];
}

function fixDecimals(number, maxPrecision) {
    try {
        return parseInt(number).toFixed(maxPrecision);
    } catch (e) {
        return number;
    }
}

function ifNull(value, defValue) {
    if (value == null)
        return defValue;
    else
        return value;
}

function ifNotNumeric(value,defValue) {
    if($.isNumeric(value))
        return value;
    else
        return defValue;
}

function ifNullOrEmptyObject(value, defValue) {
    //If value is null or an empty object
    if (value == null || ($.isPlainObject(value) && $.isEmptyObject(value)))
        return defValue;
    else
        return value;
}

function ifEmpty(value, defValue) {
    if (value == '')
        return defValue;
    else
        return value;
}

function ifNullOrEmpty(value, defValue) {
    if (value == null || value == '')
        return defValue;
    else
        return value;
}

function ifNotEmpty(value,defValue) {
    if(value != '')
        return defValue;
    else
        value;
}

function makePositive(num) {
    if (num < 0)
        return -1 * num;
    else
        return num;
}

function makeNegative(num) {
    if (num > 0)
        return -1 * num;
    else
        return num;
}

function dot2num(dot) {
    var d = dot.split('.');
    return ((((((+d[0]) * 256) + (+d[1])) * 256) + (+d[2])) * 256) + (+d[3]);
}

function num2dot(num) {
    var d = num % 256;
    for (var i = 3; i > 0; i--) {
        num = Math.floor(num / 256);
        d = num % 256 + '.' + d;
    }
    return d;
}

function ip2long(ip) {
    if (typeof(ip) != 'string')
        return ip;
    var ipl = 0;
    ip.split('.').forEach(function (octet) {
        ipl <<= 8;
        ipl += parseInt(octet);
    });
    return(ipl >>> 0);
}

function long2ip(ipl) {
    if (typeof(ipl) != 'number')
        return ipl;
    return ( (ipl >>> 24) + '.' +
        (ipl >> 16 & 255) + '.' +
        (ipl >> 8 & 255) + '.' +
        (ipl & 255) );
}

function pushBreadcrumb(breadcrumbsArr) {
    for (var i = 0; i < breadcrumbsArr.length; i++) {
        //Remove active class
        $('#breadcrumb').children('li').removeClass('active');
        if (i == 0) {
            //Add divider icon for previous breadcrumb
            $('#breadcrumb').children('li:last').append('<span class="divider"><i class="icon-angle-right"></i></span>')
        }
        if (i == breadcrumbsArr.length - 1) {
            $('#breadcrumb').append('<li class="active"><a>' + breadcrumbsArr[i] + '</a></li>');
        } else {
            $('#breadcrumb').append('<li><a>' + breadcrumbsArr[i] + '</a><span class="divider"><i class="icon-angle-right"></i></span></li>');
        }
    }
}

function removeActiveBreadcrumb(breadcrumbsArr) {
    if($('#breadcrumb').children('li.active:last')) {
        $('#breadcrumb').children('li.active:last').remove();
        $('#breadcrumb').children('li:last').children('span').remove();
    }
}

function pushBreadcrumbDropdown(id){
	$('#breadcrumb').children('li').removeClass('active');
	$('#breadcrumb').children('li:last').append('<span class="divider"><i class="icon-angle-right"></i></span>');
	$('#breadcrumb').append('<li class="active"><div id="' + id + '"></div></li>');
}

globalObj['menuAccessFns'] = {
     hideInFederatedvCenter : function() {
        //Hide in case of multiple orchestration modes along with vCenter and loggedInOrchestrationMode is vCenter
        if(globalObj['webServerInfo']['loggedInOrchestrationMode'] == 'vcenter' &&
                globalObj['webServerInfo']['orchestrationModel'].length > 1 &&
                globalObj['webServerInfo']['orchestrationModel'].indexOf('vcenter') > -1)
            return false;
        else
            return true;
    }
}

function strUtil() {
    this.splitStrToChunks = function (value) {
        var valueArr = [];
        var startIdx = 0;
        do {
            valueArr.push(value.substr(startIdx, 10));
            startIdx += 10;
        } while (startIdx < value.length)
        valueArr.push(value.substr(startIdx));
        //console.info(valueArr);
        return valueArr;
    }
}

var stringUtil = new strUtil();

function isInitialized(selector) {
    if ($(selector).attr('data-role') != null)
        return true;
    else
        return false;
}

function isGridInitialized(selector) {
    if ($(selector).attr('class') != null && $(selector).attr('class').indexOf('contrail-grid') != -1)
        return true;
    else 
        return false;
}

function isDropdownInitialized(selector){
    if($('#s2id_' + selector).length > 0)
        return true;
    else 
        return false;
}

function flattenList(arr) {
    //Flatten one-level of the list
    return $.map(arr, function (val) {
        return val;
    });
}
function flattenArr(arr) {
    var retArr = [];
    $.each(arr, function (idx, obj) {
        if (obj['length'] != null)
            $.each(obj, function (idx, obj) {
                retArr.push(obj);
            });
        else
            retArr.push(obj);
    });
    return retArr;
}

$.deparamURLArgs = function (query) {
    var query_string = {};
    var query = ifNull(query,'');
    if (query.indexOf('?') > -1) {
        query = query.substr(query.indexOf('?') + 1);
        var vars = query.split("&");
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split("=");
            pair[0] = decodeURIComponent(pair[0]);
            pair[1] = decodeURIComponent(pair[1]);
            // If first entry with this name
            if (typeof query_string[pair[0]] === "undefined") {
                query_string[pair[0]] = pair[1];
                // If second entry with this name
            } else if (typeof query_string[pair[0]] === "string") {
                var arr = [ query_string[pair[0]], pair[1] ];
                query_string[pair[0]] = arr;
                // If third or later entry with this name
            } else {
                query_string[pair[0]].push(pair[1]);
            }
        }
    }
    return query_string;
};


function reloadGrid(grid){
	grid.refreshData();
}

/* 
 * Function to style links on grid cell
 */
function cellTemplateLinks(options) {
    var name = null, nameStr = '', cellText = '', titleStr = '', nameCls = '', tooltipCls = '', onclickAction = '',statusBubble = '';
    if (options == null)
        options = {};
    name = ifNull(options['name'], name);
    var rowData = ifNull(options['rowData'],{});
    cellText = ifNull(options['cellText'], cellText);
    //Assign title attribute only if tooltipCls is present
    if ((cellText != null) && (cellText.indexOf('#') != 0))
        cellText = ifNull(rowData[cellText],'-');
    var tooltipText = cellText;
    tooltipText = ifNull(options['tooltipText'], tooltipText);

    if (name != null) {
        nameStr = 'name="' + name + '"';
    }
    if ((options['tooltip'] == true) || (options['tooltipText'] != null) || (options['tooltipFn'] != null)) {
        tooltipCls = 'mastertooltip';
        if (options['tooltipFn'] != null) {
            titleStr = 'title="#=tooltipFns.' + options['tooltipFn'] + '(data)#"';
        } else
            titleStr = 'title="' + tooltipText + '"';
    }
    if (options['onclick'] != null) {
        onclickAction = 'onclick="' + options['onclick'] + '"';
    }
    if(options['statusBubble'] == true)
        statusBubble = getNodeStatusForSummaryPages(rowData,'summary');
    return contrail.format("<div class='{1}' {0} {2} {4}>{5}{3}</div>", nameStr, tooltipCls, titleStr, cellText, onclickAction, statusBubble);
}

/**
 * Default jQuery Ajax Error Handler
 */
function ajaxDefErrorHandler(xhr) {
    return;
    var responseText = x.responseText;
    if (x.status == 0) {
        showInfoWindow('You are offline!!n Please Check Your Network. ' + responseText);
    } else if (x.status == 404) {
        showInfoWindow('Requested URL not found. ' + responseText);
    } else if (x.status == 500) {
        showInfoWindow('Internel Server Error. ' + responseText);
    } else if (e == 'parsererror') {
        showInfoWindow('Error Parsing JSON Request failed. ' + responseText);
    } else if (e == 'timeout') {
        showInfoWindow('Request Time out. ' + responseText);
    } else {
        showInfoWindow('Unknow Error.n ' + x.responseText);
    }
}

function renderSparkLines(cellNode,row,dataContext,colDef) {
    $(cellNode).find('.gridSparkline').each(function() {
            chUtils.drawSparkLine4Selector(this, 'blue-grid-sparkline', dataContext['histCpuArr']);
        });
}

function sort(object) {
    if (Array.isArray(object)) {
        return object.sort();
    }
    else if (typeof object !== "object" || object === null) {
        return object;
    }

    return Object.keys(object).sort().map(function (key) {
        return {
            key:key,
            value:sort(object[key])
        };
    });
}

function isCellSelectable(elem) {
    if ($(elem).find('*[name]').length > 0)
        return $(elem).find('*[name]').attr('name');
    else
        return false;
}

function selectTab(tabStrip,tabIdx) {
    $( '#'+tabStrip ).find('#contrail-tabs').tabs( "option", "active", tabIdx );
}

function displayAjaxError(jQueryElem, xhr, textStatus, errorThrown) {
    var errMsg = "";
    if (textStatus == 'timeout')
        errMsg = "Timeout occured in fetching the details";
    else
        errMsg = 'Unexpected Error in fetching the details';
    jQueryElem.html(contrail.format('<div class="ajax-error">{0}</div>', errMsg));
}

function logMessage() {
    return;
    var allTypes = ['flowSeriesChart','hashChange','scatterChart','formatBytes','bucketization'];
    var reqTypes = [];
    var timeMessages = ['flowSeriesChart'];
    var args = [], logType;
    if (arguments.length != 0) {
        args = Array.prototype.slice.call(arguments);
        logType = args.shift();
    }
    if ($.inArray(logType, reqTypes) == -1)
        return;
    //Can make the last argument as a context for message that enables controlling the logmessages
    //Append time only for certain types
    if($.inArray(logType,timeMessages) > -1)
        args.push(new Date());
    //args.unshift(logType);
    console.log.apply(console, args);
}

function formatProtocol(proto) {
    var protMAP = {17:'UDP', 6:'TCP', 2:'IGMP', 1:'ICMP'}
    return (protMAP[proto] != null) ? protMAP[proto] : proto;
}

function log10(val) {
    return Math.log(val) / Math.LN10;
}

function log2(val) {
    return Math.log(val) / Math.LN2;
}

function getContextObj(data) {
    var contextObj = {};
    $.each(['fqName', 'srcVN', 'destVN', 'vnName', 'ip', 'objectType', 'context'], function (idx, field) {
        if (data[field] != null)
            contextObj[field] = data[field];
    });
    return contextObj;
}

function capitalize(s) {
    return s[0].toUpperCase() + s.slice(1);
}

var tooltipFns = {
    multiPathTooltip:function (data) {
        if (data['alternatePaths'].length > 0) {
            return 'Source:' + data['alternatePaths'][0]['source'] + '<br/>' +
                'AS Path:' + data['alternatePaths'][0]['as_path'];
        } else
            return data['source'].split(':').pop();
    }
}

function monitorRefresh(selector) {
    if (selector == null)
        selector = $(pageContainer);
    //Refresh summary stats
    $(selector).find('.summary-stats').each(function (idx, elem) {
        var elemDS = $(elem).data('dataSource');
        $(elem).data('loaded', false);
        if(elemDS != null)
            elemDS.read();
    });
    $(selector).find('.contrail-grid').each(function (idx) {
        var gridDS = $(this).data('contrailGrid')._dataView;
        $(this).data('loaded', false);
        gridDS.refreshData();
    });
}

function wrapValue(str) {
    return '<span class="text-info">' + str + '</span>';
}

function wrapLbl(str) {
    return '<span class="lighter">' + str + '</span>';
}

function wrapLabelValue(lbl, value) {
	value = ifNullOrEmptyObject(value,"");
    return '<span class="label-value-text">' + lbl + ': <span>' + value + '</span></span>';
}


function formatTooltipDate(str) {
    return new XDate(str).toString('M/d/yy h:mm:ss');
}

//Get the number of keys in an object
function getKeyCnt(obj) {
    var len = 0;
    for (var i in obj) {
        if (obj.hasOwnProperty(i))
            len++;
    }
    return len;
}

function diffDates(startDt, endDt, type) {
    //If either startDt/endDt is null, return '-'
    var dayCnt = 0, hrCnt = 0, minCnt = 0;
    //No of days
    dayCnt = startDt.diffDays(endDt);
    dayCnt = (dayCnt > 0)?Math.floor(dayCnt):Math.ceil(dayCnt);
    hrCnt = startDt.diffHours(endDt);
    hrCnt = (hrCnt > 0)?Math.floor(hrCnt):Math.ceil(hrCnt);
    minCnt = startDt.diffMinutes(endDt);
    minCnt = (minCnt > 0)?Math.floor(minCnt):Math.ceil(minCnt);
    hrCnt = hrCnt - (dayCnt * 24);
    minCnt = minCnt - (((dayCnt * 24) + hrCnt) * 60);
    if(type == 'rounded'){
        if(dayCnt > 0 && hrCnt > 0 && minCnt > 0)
            return  dayCnt +' day(s)';
        else if(hrCnt > 0 && minCnt > 0)
            return hrCnt +' hour(s)';
        else if(minCnt > 0)
            return minCnt + ' mins';
    } else {
        if (dayCnt == 0 && hrCnt == 0)
            return  minCnt + 'm';
        else if (dayCnt == 0)
            return hrCnt + 'h ' + minCnt + 'm';
        else
            return dayCnt + 'd ' + hrCnt + 'h ' + minCnt + 'm';
    }
}

String.prototype.padleft = function (length, character) {
    return new Array(length - this.length + 1).join(character || ' ') + this;
}

function get64binary(int) {
    if (int >= 0)
        return int
            .toString(2)
            .padleft(64, "0");
    // else
    return (-int - 1)
        .toString(2)
        .replace(/[01]/g, function (d) {
            return +!+d;
        })// hehe: inverts each char
        .padleft(64, "1");
};

function get32binary(int) {
    if (int >= 0)
        return int
            .toString(2)
            .padleft(32, "0");
    // else
    return (-int - 1)
        .toString(2)
        .replace(/[01]/g, function (d) {
            return +!+d;
        })// hehe: inverts each char
        .padleft(32, "1");
};

//DNS TTL Validations
function validateTTLRange(v){
    if(v >=0 && v<=2147483647)
        return true;
    return false;
}

function  allowNumeric(v){
    for(var i=0;i<v.length;i++){
        if(v[i] ==="-")
            continue;
        if(isNaN(parseInt(v[i],10)))
            return false;
    }
    return true;
}

function validateIPAddress(inputText){
    if(typeof inputText != 'string')
        return false;
    var ipformat = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if(inputText.match(ipformat))
        return true;
    else
        return false;
}

function bucketizeCFData(dataCF,accessorFn,cfg) {
    var retArr = [],value;
    var dimension = dataCF.dimension(accessorFn);
    var cfGroup = dimension.group();
    var maxKey = 0;
    var cfg = ifNull(cfg,{});
    var bucketCnt = ifNull(cfg['bucketCnt'],8);
    if(cfGroup.all().length > 0)
        maxKey = cfGroup.all()[cfGroup.all().length-1]['key'];
    
    //Max no of occurrences in any bucket
    var maxValue = 0;
    $.each(cfGroup.all(),function(idx,obj) {
        if(obj['value'] > maxValue)
            maxValue = obj['value'];
    });
    var zeroValue = 0.01;
    var bucketRange = parseInt(maxKey / 8) + 1;
    //Have buckets 0-8
    if(maxKey <= 8) {
        maxKey = 8;
    } else {
    	bucketRange = Math.ceil((maxKey+1)/bucketCnt);
    }
    for(var i=0;i<=maxKey;i+=bucketRange) {
        dimension.filterAll();
        if(bucketRange == 1) {
            value = dimension.filter(i).top(Infinity).length;
            if(value == 0)
                value = zeroValue;
            retArr.push({name:i,min:i,max:i+bucketRange-1,value:value});
        } else {
            value = dimension.filter(function(d) { return ((d >= i) && (d <= (i+bucketRange-1))); }).top(Infinity).length;
            if(value == 0)
                value = zeroValue;
            retArr.push({name:i + '-' + (i+bucketRange-1),min:i,max:i+bucketRange-1,value:value});
        }
    }
    dimension.filterAll();
    return {data:retArr,zeroValue:zeroValue};
}

function getMaxNumericValueInArray(inputArray) {
    var maxVal;
    if(inputArray != null && inputArray instanceof Array){
        maxVal = inputArray[0];
        for(var i = 1; i < inputArray.length; i++){
            if(inputArray[i] > maxVal)
                maxVal = inputArray[i];
        }
        return maxVal;
    } else {
        return inputArray;
    }
}

function toggleDivs(hideDetailId,showDetailId){
    $('#'+hideDetailId).hide();
    $('#'+showDetailId).show();
}

function showMoreAlerts(){
    var currentUrl=layoutHandler.getURLHashObj();
    if(currentUrl['p']=='mon_infra_dashboard') {
        loadAlertsContent();
    } else {
        layoutHandler.setURLHashObj({p:'mon_infra_dashboard',q:{tab:'vRouter'}});
        globalObj['showAlertsPopup']=true;
    }
}

/**
 * function takes the parameters event object of bubble chart as parameter
 * and redirects to corresponding page on drill down. 
 * 
 * @param e
 */

function processDrillDownForNodes(e) {
     if (e['point']['type'] == 'network') {
         layoutHandler.setURLHashParams({fqName:e['point']['name']}, {p:'mon_networking_networks'});
     } else if (e['point']['type'] == 'project') {
         layoutHandler.setURLHashParams({fqName:e['point']['name']}, {p:'mon_networking_projects'});
     } else if ($.inArray(e['point']['type'], ['sport' | 'dport'] > -1)) {
         var obj= {
             fqName:e['point']['fqName'],
             port:e['point']['range']
         };
         if(e['point']['startTime'] != null && e['point']['endTime'] != null) {
             obj['startTime'] = e['point']['startTime'];
             obj['endTime'] = e['point']['endTime'];
         }

         if(e['point']['type'] == 'sport')
             obj['portType']='src';
         else if(e['point']['type'] == 'dport')
             obj['portType']='dst';
         if(obj['fqName'].split(':').length == 2) {
             layoutHandler.setURLHashParams(obj,{p:'mon_networking_projects'});
         } else
             layoutHandler.setURLHashParams(obj,{p:'mon_networking_networks'});
     }
}

function loadAlertsContent(deferredObj){
    var alertsDS = globalObj['dataSources']['alertsDS']['dataSource'];
    var renderPopupEveryTime = true,alertsData = [];
    //$('#header ul li.nav-header').text(data.length+' New Alerts');
    var alerts = contrail.getTemplate4Id("alerts-template");
    var alertsTemplate = contrail.getTemplate4Id('moreAlerts-template');
    var statusTemplate = contrail.getTemplate4Id('statusTemplate');
    var alertsGrid;
    if(renderPopupEveryTime || $("#moreAlerts").length == 0) {
        $("#moreAlerts").remove();
        $('body').append(alertsTemplate({}));
        alertsWindow = $("#moreAlerts");
        alertsWindow.modal({backdrop:'static',keyboard:false,show:false});
        $("#alertsClose").click(function(){
            alertsWindow.hide();
        });
        $("#alertContent").contrailGrid({
            header : {
                title : {
                    text : 'Details',
                    cssClass : 'blue',
                },
                customControls: []
            },
            body: {
                options: {
                    forceFitColumns:true,
                    lazyLoading:false
                },
                dataSource: {
                    dataView: alertsDS,
                },
                statusMessages: {
                    empty: {
                        text: 'No Alerts to display'
                    }, 
                    errorGettingData: {
                        type: 'error',
                        iconClasses: 'icon-warning',
                        text: 'Error in getting Data.'
                    }
                }
            },
            columnHeader: {
                columns:[ 
                    {
                        field:'name',
                        name:'Node',
                        minWidth:150,
                        formatter: function(r,c,v,cd,dc){
                            if(typeof(dc['sevLevel']) != "undefined" && typeof(dc['name']) != "undefined")
                                return "<span>"+statusTemplate({sevLevel:dc['sevLevel'],sevLevels:sevLevels})+dc['name']+"</span>";
                            else
                                return dc['name'];
                        }
                    },{
                        field:'type',
                        name:'Node Type / Process',
                        minWidth:100
                    },{
                        field:'msg',
                        name:'Status',
                        minWidth:200,
                    },{
                        field:'timeStamp',
                        name:'Time',
                        minWidth:100,
                        formatter:function(r,c,v,cd,dc) {
                            if(typeof(dc['timeStamp']) != "undefined")
                                return getFormattedDate(dc['timeStamp']/1000);
                            else
                                return "";
                        }
                    }]
            }
        });
    }
    alertsWindow.modal('show');
    alertsGrid = $('#alertContent').data('contrailGrid');
    if(alertsGrid != null) {
        alertsGrid.refreshView();
        alertsGrid._grid.resizeCanvas();
        if(deferredObj != null) {
            deferredObj.always(function(){
                alertsGrid.removeGridLoading();
                alertsGrid.refreshView();
            }); 
        } else {
            alertsGrid.removeGridLoading();
            alertsGrid.refreshView();
        }
    }
    globalObj.showAlertsPopup = false;
}

/**
 * Function is event handler for the more and hide link in the overall node status of infra details page
 * accepts parameters of type array or single element but need to send with '#' or '.'
 * eg:  ['#id','#id1','#id2'] ,['.class1','.class2']
 */
function toggleOverallNodeStatus(selector) {
    if(selector instanceof Array) {
        for(var i = 0;i < selector.length; i++)
            $(selector[i]).toggleClass('hide');
    } else 
        $(selector).toggleClass('hide');
}

/**
 * Get the value of a property inside a json object with a given path
 */
function getValueByJsonPath(obj,pathStr,defValue,doClone) {
    try {
    	var currObj = obj;
        var pathArr = pathStr.split(';');
        var doClone = ifNull(doClone,true);
        var arrLength = pathArr.length;
        for(var i=0;i<arrLength;i++) {
            if(currObj[pathArr[i]] != null) {
                currObj = currObj[pathArr[i]];
            } else
                return defValue;
        }
        if(currObj instanceof Array) {
            if(doClone == false) {
                return currObj;
            } else {
                return $.extend(true,[],currObj);
            }
        } else if(typeof(currObj) == "object") {
            if(doClone == false) { 
                return currObj;
            } else {
                return $.extend(true,{},currObj);
            }
        } else
            return currObj;
    } catch(e) {
        return defValue;
    }
}


/**
 * cfg['loadedDeferredObj'] - resolved when all records are fetched
 *                          - reject when any ajax call fails
 */
function getOutputByPagination(dataSource,cfg,dsObj) {
    var currData = ifNull(cfg['currData'],[]);
    var transportCfg = ifNull(cfg['transportCfg'],{});
    var dsObj = ifNull(dsObj,{});
    var dsName = dsObj['name'];
    var urlParams = $.deparamURLArgs(transportCfg['url']);
    urlParams['startAt'] = dsObj['updateStartTime'];
    transportCfg['url'] = ifNull(transportCfg['url'],'').split('?')[0] + '?' + $.param(urlParams);

    // If we want to delay populating DS,pass a deferredObj
    if(cfg['deferredObj'] != null) {
        cfg['deferredObj'].done(waitForDeferred);
    } else
        waitForDeferred();
    function waitForDeferred() {
        $.ajax($.extend({
            abortOnNavigate:discardOngoingUpdate == true ? true : false
        },transportCfg)).done(function(response) {
            //Check if the response is for the current series of requests
            var urlParams = $.deparamURLArgs(transportCfg['url']);
            if(dsName != null && globalObj['dataSources'][dsName] != null) {
                if(urlParams['startAt'] != globalObj['dataSources'][dsName]['updateStartTime']) {
                    return; 
                }
            }
            var dataResponse = response['data'];
            if(cfg['parseFn'] != null) {
            	if(response['data'] != null){
            		dataResponse = cfg['parseFn'](response['data']);
            	} else {
            		dataResponse = cfg['parseFn'](response);
            	}
            } else {
            	dataResponse = dataResponse['value'];
            } 
            //Purging the old response if the request is for first N records.
            if(transportCfg['url'].indexOf('lastKey') == -1) {
                currData = [];
            }
            //No need to update dataSource if there no records to display in current pagination request and it's not the last request.
            if(dataResponse.length == 0 && response['more'] == true) {
                //Nothing to do
            } else {
                currData = $.merge(currData,dataResponse);
                dataSource.setData(currData);
            }
            if(response['more'] == null || response['more'] == false){
            	if(cfg['loadedDeferredObj'] != null) {
                    //Info: Any reason to resolve with an object??
            		cfg['loadedDeferredObj'].resolve({dataSource:dataSource});
                }
            } else if (response['more'] == true) {
                var urlParams = $.deparamURLArgs(transportCfg['url']);
                urlParams['lastKey'] = response['lastKey'];
                cfg['currData'] = currData;
                transportCfg['url'] = transportCfg['url'].split('?')[0] + '?' + $.param(urlParams);
                getOutputByPagination(dataSource,cfg,dsObj);
            } 
        })
        .fail(function(errObj,status,errorText){
            if(cfg['loadedDeferredObj'] != null)
                cfg['loadedDeferredObj'].reject({errObj:errObj,status:status,errTxt:errorText});
        });
    }
}

/**
 * Formats the given string removing the place holders enclosed with {} with the corresponding values
 * a. Will replace {0} inside string with first argument and so on
 * b. Supports specifiying singular/plural string 
 *  Will replace {0:BGP peer;BGP peers} inside string to "1 BGP peer" when passed 1 as argument and as "2 BGP peers" when passed 2 as argument
 */
String.prototype.format = function() {
    var args = arguments;
    var retStr = this.toString();
    var formatHolders = this.toString().match(/{[a-zA-Z0-9:; ]*}/g);
    for(var argIdx=0; argIdx < args.length ; argIdx++) {
        if(formatHolders[argIdx] == null)
            continue;
        var currHolder = formatHolders[argIdx].replace(/[{}\d:]+/g,'');
        var currValue = args[argIdx];
        var strVariants = currHolder.split(';');
        if((currHolder.length > 0) && (strVariants.length > 0)) {
            if(args[argIdx] > 1)
                currValue += ' ' + strVariants[1];
            else
                currValue += ' ' + strVariants[0];
        }
        retStr = retStr.replace(formatHolders[argIdx],currValue);
    }
    return retStr;
};

/**
 * Removes the duplicates in an array
 */
function uniqueArray(arr) {
    var retArr = [];
    $.each(arr,function(idx,value) {
        if($.inArray(value,retArr) == -1)
            retArr.push(value);
    });
    return retArr;
}

function getFormattedDate(timeStamp){
    if(!$.isNumeric(timeStamp))
        return '';
    else{
    var date=new Date(timeStamp),fmtDate="",mnth,hrs,mns,secs,dte;
    dte=date.getDate()+"";
    if(dte.length==1)
        dte="0"+dte;
    mnth=parseInt(date.getMonth()+1)+"";
    if(mnth.length==1)
        mnth="0"+mnth;
    hrs=parseInt(date.getHours())+"";
    if(hrs.length==1)
        hrs="0"+hrs;
    mns=date.getMinutes()+"";
    if(mns.length==1)
        mns="0"+mns;
    secs=date.getSeconds()+"";
    if(secs.length==1)
        secs="0"+secs;
    fmtDate=date.getFullYear()+"-"+mnth+"-"+dte+"  "+hrs+":"+mns+":"+secs;
    return fmtDate;}
}

//Returns true if the loggedInOrchestrationMode is vcenter
function isVCenter() {
    if(globalObj['webServerInfo']['loggedInOrchestrationMode'] == 'vcenter')
        return true;
    else
        return false; 
}
//Returns the corresponding NetMask for a givne prefix length
function prefixToNetMask(prefixLen) {
    var prefix = Math.pow(2,prefixLen) - 1;
    var binaryString = prefix.toString(2);
    for(var i=binaryString.length;i<32;i++) {
            binaryString += '0';
    }
    return v4.Address.fromHex(parseInt(binaryString,2).toString(16)).address;
}

/***
 *  Returns the list of keys from a hashmap whose value matches with the given value
 ***/
function getKeysForValue(obj, value) {
  var all = [];
  for (var name in obj) {
    if (!Object.hasOwnProperty(name) && obj[name] === value) {
      all.push(name);
    }
  }
  return all;
}

function getIPforHostName(name,dataSourceName) {
   if(globalObj.dataSources != null && globalObj.dataSources[dataSourceName] != null 
       &&  globalObj.dataSources[dataSourceName].dataSource != null) {
       var dataSrc = globalObj.dataSources[dataSourceName].dataSource.getItems();
       for(var i = 0;i < dataSrc.length;i++) {
           if(dataSrc[i].name === name) {
               return dataSrc[i].ip;    
           }
       }
   } else {
       return null;
   }
}

// This function accepts the ip and checks whether it is IPV4 or IPV6 and returns the label value html content for the IP
function getLabelValueForIP(ip) {
    var lbl = 'IPv4';
    var value = ip;
    if(ip == '') {
        return '';
    }
    if(ip != null && isIPv6(ip)) {
        lbl = 'IPv6';
        value = new v6.Address(ip).correctForm();
    }
    return wrapLabelValue(lbl,value);
}

/**
 * Given an ipaddress returns 
 * "v4" if it is ipv4
 * "v6" if it is ipv6
 * "invalid" if not an ipaddress
 * @param ipAddress
 * @returns {String}
 */
function getIPType(ipAddress){
    if(ipAddress == null){
        return "invalid";
    }
    var IP = new v4.Address(ipAddress); 
    if(IP.isValid() === true){
        return "v4";
    }
    IP = new v6.Address(ipAddress); 
    if(IP.isValid() === true){
        return "v6";
    }
    return "invalid";
}

/**
 * This function can be use as the sorter function in grids for values with ip
 * @param ip1
 * @param ip2
 * @param sign
 * @returns {Number}
 */
function comparatorIP(ip1, ip2, sign){
    if(ip1 instanceof Array){
        ip1 = ip1[0];
    }
    if(ip2 instanceof Array){
        ip2 = ip2[0]
    }
    //Get ip types to see if ipv4 or ipv6
    var ip1Type = getIPType(ip1);
    var ip2Type = getIPType(ip2);
    
    //If both are valid ips
    if(ip1Type != "invalid" && ip2Type != "invalid"){
      //If both are of same type do the comparison
        if(ip1Type == "v4" && ip2Type == "v4"){
            var IP1 = new v4.Address(ip1);
            var IP2 = new v4.Address(ip2);
            var ip1Int = IP1.bigInteger();
            var ip2Int = IP2.bigInteger();
            return (ip1Int.compareTo(ip2Int) > 0)? 1 * sign : -1 * sign;
        } else if(ip1Type == "v6" && ip2Type == "v6"){
            var IP1 = new v6.Address(ip1);
            var IP2 = new v6.Address(ip2);
            var ip1Int = IP1.bigInteger();
            var ip2Int = IP2.bigInteger();
            return (ip1Int.compareTo(ip2Int) > 0)? 1 * sign : -1 * sign;
        } else {
            if (ip1Type == "v4") {
                return 1 * sign;
            } else {
                return -1 * sign;
            }
        }
    } else {
        if(ip1Type != "invalid"){
            return -1 * sign;
        } else {
            return 1 * sign;
        }
    }
    return -1;
}
/*
 * This function formats the VN name by discarding the domain name and appending the 
 * project name in the braces 
 * input:either array of networks or single network like [default-domain:demo:ipv6test2],default-domain:demo:ipv6test2
 * output:[ipv6test2 (demo)],ipv6test2 (demo)
 */
function formatVN(vn){
    var formattedValue;
    if(!$.isArray(vn))
        vn = [vn];
    formattedValue = $.map(vn,function(value,idx) {
                                var fqNameArr = value.split(':');
                                if(fqNameArr.length == 3)
                                    return fqNameArr[2] + ' (' + fqNameArr[1] + ')';
                                else
                                    return value;
                              });
    return formattedValue;
}

/**
 * Cross filter management methods ENDS
*/

function checkIfDuplicates(arr){
    
    var sortedArr = arr.sort(); 

    for (var i = 0; i < sortedArr.length - 1; i++) {
        if (sortedArr[i + 1] == sortedArr[i]) {
            return true;
        }
    }
    return false;
}

function getIntrospectPaginationInfo(response) {
    var paginationInfo = {};
    var paginationInfo = jsonPath(response,'$..Pagination');
    if(paginationInfo instanceof Array && paginationInfo.length > 0) {
        paginationInfo = getValueByJsonPath(paginationInfo,'0;req;PageReqData');
    }
    return paginationInfo;
}

function check4StorageInit(callback) {
    if (!sInitComplete) {
        requirejs(['storage-init'], function () {
            sInitComplete = true;
            callback()
        });
    } else {
        callback();
    }
};

function generateQueryUUID() {
    var s = [], itoh = '0123456789ABCDEF';
    for (var i = 0; i < 36; i++) {
        s[i] = Math.floor(Math.random() * 0x10);
    }
    s[14] = 4;
    s[19] = (s[19] & 0x3) | 0x8;
    for (var i = 0; i < 36; i++) {
        s[i] = itoh[s[i]];
    }
    s[8] = s[13] = s[18] = s[23] = s[s.length] = '-';
    s[s.length] = (new Date()).getTime();
    return s.join('');
};
/**
 * This function takes parsed nodeData from the infra parse functions and returns object with all alerts displaying in dashboard tooltip,
 * and tooltip messages array
 */
function getNodeStatusForSummaryPages(data,page) {
    var result = {},msgs = [],tooltipAlerts = [];
    for(var i = 0;i < ifNull(data['alerts'],[]).length; i++) {
        if(data['alerts'][i]['tooltipAlert'] != false) {
            tooltipAlerts.push(data['alerts'][i]);
            msgs.push(data['alerts'][i]['msg']);
        }
    }
    //Status is pushed to messages array only if the status is "UP" and tooltip alerts(which are displaying in tooltip) are zero
    if(ifNull(data['status'],"").indexOf('Up') > -1 && tooltipAlerts.length == 0) {
        msgs.push(data['status']);
        tooltipAlerts.push({msg:data['status'],sevLevel:sevLevels['INFO']});
    } else if(ifNull(data['status'],"").indexOf('Down') > -1) {
        //Need to discuss and add the down status
        //msgs.push(data['status']);
        //tooltipAlerts.push({msg:data['status'],sevLevel:sevLevels['ERROR']})
    }
    result['alerts'] = tooltipAlerts;
    result['nodeSeverity'] = data['alerts'][0] != null ? data['alerts'][0]['sevLevel'] : sevLevels['INFO'];
    result['messages'] = msgs;
     var statusTemplate = contrail.getTemplate4Id('statusTemplate');
    if(page == 'summary')
        return statusTemplate({sevLevel:result['nodeSeverity'],sevLevels:sevLevels});
    return result;
}
var dashboardUtils = {
    sortNodesByColor: function(a,b) {
        // var colorPriorities = [d3Colors['green'],d3Colors['blue'],d3Colors['orange'],d3Colors['red']];
        var colorPriorities = [d3Colors['blue'],d3Colors['green'],d3Colors['orange'],d3Colors['red']];
        var aColor = $.inArray(a['color'],colorPriorities);
        var bColor = $.inArray(b['color'],colorPriorities);
        return aColor-bColor;
    },
    getDownNodeCnt : function(data) {
        var downNodes = $.grep(data,function(obj,idx) {
                           return obj['color'] == cowc.COLOR_SEVERITY_MAP['red'];
                        });
        return downNodes.length;
    },
    /**
     * Sort alerts first by severity and with in same severity,sort by timestamp if available
     */
    sortInfraAlerts: function(a,b) {
        if(a['sevLevel'] != b['sevLevel'])
            return a['sevLevel'] - b['sevLevel'];
        if(a['sevLevel'] == b['sevLevel']) {
            if(a['timeStamp'] != null && b['timeStamp'] != null)
                return b['timeStamp'] - a['timeStamp'];
        }
        return 0;
    },
}
;
define("web-utils", ["jquery","knockout"], function(){});

/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

var configObj = "[object Object]";
var timeouts = "[object Object]";
var PAGE_MIN_WIDTH_PX = 700;
var PAGE_MIN_HEIGHT_PX = 700;
var PAGE_DEFAULT_WIDTH_PX = 700;
var PAGE_DEFAULT_HEIGHT_PX = 700;
var PAGE_MIN_WIDTH_PT = 20;
var PAGE_MIN_HEIGHT_PT = 20;
var PAGE_DEFAULT_WIDTH_PT = 30;
var PAGE_DEFAULT_HEIGHT_PT = 30;
var TABLE_PAGING_SIZE = 10;
var TABLE_SORT_ASC = "ascending";
var TABLE_SORT_DESC = "descending";
var PC = "%";
var PX = "px";
var UNIQUE_ID_LIMIT = 10000;
var UNIQUE_ID_LOWER_BOUND = 1;
var UNIQUE_ID_UPPER_BOUND = 10000;
var UNIQUE_ID_PADDING = 000000000;
var RELATIVE = "relative";
var ABSOLUTE = "absolute";
var RIGHT = "right";
var MULTISELECT_WIDTH = 310;
var MULTISELECT_HEIGHT = 160;
var ELEMENT_WIDTH = 360;
var ELEMENT_HEIGHT = 35;
var RGB_94C0D2 = "#94C0D2";
var RGB_DAECF4 = "#DAECF4";
var INLINE_BLOCK = "inline-block";
var TOP = "top";
var AUTO = "auto";
var ARROW_BTN_WIDTH = 29;
var LTOR_BTN_TOP = 65;
var RTOL_BTN_TOP = 70;
var SELECT_WIDTH = 135;
var SELECT_HEIGHT = 150;
var SOLID = "solid";
var BTN_WIDTH = 90;
var JNPR_HDR_HEIGHT = 77;
var EDIV_WIDTH = 30;
var DUMMY_ITEM_VALUE = 9999999999;


function getCookie(name) {
	if(isSet(name) && isString(name)) {
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
function setCookie(name, value) {
    document.cookie = name + "=" + escape(value) +
        "; expires=Sun, 17 Jan 2038 00:00:00 UTC; path=/";
}
function isSet(o) {
    if (typeof o == "undefined" || null == o)
        return false;
    else if (isString(o)) {
        return ("" !== o.trim())
    }
    else if (isNumber(o))
        return true;
    else if (isObject(o)) {
        return true;
    }
}
function isObject(o) {
    return (typeof o === "object");
}
function isNumber(o) {
    return !isNaN(o - 0);
}
function isString(o) {
    return (typeof o === "string");
}
function pad(num, size) {
    var s = g.UNIQUE_ID_PADDING + num;
    return s.substr(s.length - size);
}
function doAjaxCall(targetUrl, methodType, postData, successHandler, failureHandler, cacheEnabled, callbackParams, timeOut, hideErrMsg,abortCall,projectUUID) {
    var url = targetUrl, type = methodType, cache = cacheEnabled,
        success = successHandler, failure = failureHandler, data = postData,
        cbParams = callbackParams, headers = {}, timeout = timeOut, hideErrorMsg = hideErrMsg;
    headers["X-Tenant-Name"] = "default-project";
    var contentType = null, dataType = null;
    if (isSet(url)) {
        if (isSet(type)) {
            var type = type.trim();
            if (type !== "GET" && type !== "POST" && type !== "DELETE" &&
                type !== "PUT") {
                type = "GET";
            }
            if (type === "POST" || type === "PUT" || type === "DELETE") {
                headers["X-Tenant-Name"] = "default-project";
                if (!isSet(data)) {
                    data = "{}";
                }
                contentType = "application/json; charset=utf-8";
                dataType = "json";
            }
        } else {
        	type = "GET";
        }
        if (isSet(cache)) {
            if (cache === "true" || cache === true)
                cache = true;
            else if (cache === "false" || cache === false)
                cache = false;
        }
        else {
            cache = false;
        }
        if (!isSet(success)) {
            success = "";
        }
        if (!isSet(failure)) {
            failure = "";
        }

        var config = {
            type:type,
            cache:cache,
            url:url,
            data:data,
            headers:headers,
            abortOnNavigate:abortCall
        };
        if (isSet(contentType))
            config.contentType = contentType;
        if (isSet(dataType))
            config.dataType = dataType;

        if(isSet(timeout) && isNumber(timeout) && timeout > 0) {
        	config.timeout = timeout;
        }

        if(methodType === "POST") {
            var jsonPostData = JSON.parse(data);
            var projectUUId = "";
            var parent_type = jsonPath(jsonPostData, "$..parent_type");
            if(null !== parent_type && false !== parent_type && 
                parent_type.length == 1) {
                parent_type = parent_type[0];
                if(parent_type === "project") {
                    var fqn = jsonPath(jsonPostData, "$.*..fq_name")[0];
                    projectUUId = 
                        jsonPath(configObj, "$.projects[?(@.fq_name[0]=='" + fqn[0] + "' && @.fq_name[1]=='" + fqn[1] + "')]")[0].uuid;
                    var dataType = jsonPath(jsonPostData, "$.*")[0];
                    dataType["parent_uuid"] = projectUUId;
                } else if(parent_type === "domain") {
                    var fqn = jsonPath(jsonPostData, "$.*.fq_name")[0];
                    var domainUUId = 
                        jsonPath(configObj, "$.domains[?(@.fq_name[0]=='" + fqn[0] + "')]")[0].uuid;
                    var dataType = jsonPath(jsonPostData, "$.*")[0];
                    dataType["parent_uuid"] = domainUUId;
                } else if(parent_type === "floating-ip-pool") {
                    var fqn = jsonPath(jsonPostData, "$.*.fq_name")[0];
                    var fipoolUUId = 
                        jsonPath(configObj, "$.floating-ip-pools[?(@.to[0]=='" + fqn[0] + "' && @.to[1]=='" + fqn[1] + 
                            "' && @.to[2]=='" + fqn[2] + "')]")[0].uuid;
                    var dataType = jsonPath(jsonPostData, "$.*")[0];
                    dataType["parent_uuid"] = fipoolUUId;
                }
                data = JSON.stringify(jsonPostData);
                config.data = data;

                var getProject = {
                    type:"GET",
                    abortOnNavigate:true
                };
                if(parent_type === "project" || parent_type === "floating-ip-pool") {
                    getProject["url"] = "/api/tenants/config/project/" + projectUUId + 
                        "?exclude_children=True&exclude_back_refs=True";
                }
                $.ajax(getProject)
                    .success(function (res) {
                        callAjax(config, success, failure, hideErrorMsg, cbParams);
                    })
                    .fail(function (res) {
                        callAjax(config, success, failure, hideErrorMsg, cbParams);
                    });
            } else {
                callAjax(config, success, failure, hideErrorMsg, cbParams);
            }
        } else {
            callAjax(config, success, failure, hideErrorMsg, cbParams);
        }
    }
    else {
    	return false;
    }
}
function getID(divid){
    if(divid === undefined){
         return -1;
    }
    var split = divid.split("_");
    if(split.length > 1){
        return(split[1])
    } else {
        return -1;
    }
}
function getInnerID(divid){
    var split = divid.split("_");
    if(split.length > 3){
        return(split[3])
    } else {
        return -1;
    }
}
function callAjax(config, success, failure, hideErrorMsg, cbParams) {
    $.ajax(config)
        .success(function (res) {
            configObj = $.extend({}, configObj, res);
            if (typeof window[success] === "function")
                window[success](res, cbParams);
        })
        .fail(function (res) {
            if(res.statusText === 'abort') {
                return;
            }         
            if(hideErrorMsg !== "true" && hideErrorMsg !== true) {
                if(res.responseText && res.responseText != "") {
                    showInfoWindow(res.responseText, res.statusText);
                }
            }
            if (typeof window[failure] === "function")
                window[failure](res, cbParams);
        });
}
function formatPolicyRule(rule, domain, project) {
    var rule_display = "";
    if (isSet(rule) && !rule.hasOwnProperty("length")) {
        if (isSet(rule["action_list"]) && isSet(rule["action_list"]["simple_action"]))
            rule_display += policyRuleFormat(rule["action_list"]["simple_action"]);

        if (isSet(rule["application"]) && rule["application"].length > 0) {
            rule_display += " application " + policyRuleFormat(rule["application"].toString());
            var src_addr = formatSrcDestAddresses(rule["src_addresses"], domain, project);
            rule_display += src_addr;
            if(isSet(rule["direction"]))
            	rule_display += policyRuleFormat(rule["direction"]);
            var dest_addr = policy_net_display(rule["dst_addresses"], domain, project);
            var dest_addr = formatSrcDestAddresses(rule["dst_addresses"], domain, project); 
            rule_display += dest_addr;
            if (isSet(rule["action_list"]))
                rule_display += " action" + policyRuleFormat(rule["action_list"].toString());
        } else {
        	if(null !== rule["simple_action"] && typeof rule["simple_action"] !== "undefined")
        	    rule_display += policyRuleFormat(rule["simple_action"]);
            if (isSet(rule["protocol"]))
                //rule_display += " protocol " + rule["protocol"].toString();
                  rule_display += ' protocol ' + policyRuleFormat(rule["protocol"].toString());
            
            var src_addr = formatSrcDestAddresses(rule["src_addresses"], domain, project);
            rule_display += src_addr;

            var src_ports = policy_ports_display(rule["src_ports"]); 
            if(isSet(src_ports))
                rule_display += " ports " + policyRuleFormat(src_ports);

            if(isSet(rule["direction"]))
            	rule_display += ' ' + policyRuleFormat(rule["direction"]);

            var dest_addr = formatSrcDestAddresses(rule["dst_addresses"], domain, project); 
            rule_display += dest_addr;

            var dst_ports = policy_ports_display(rule["dst_ports"]); 
            if(isSet(dst_ports))
                rule_display += ' ports ' + policyRuleFormat(dst_ports);

            var action_list = policy_services_display(rule["action_list"], domain, project); 
            if(isSet(action_list))
                rule_display += action_list;
        }
    }
    return rule_display;
}
function policy_net_display(nets, domain, project) {
    var net_disp_all = "";
    var labelName = ' network ';
    if (isSet(nets) && nets.length > 0) {
        for (var i = 0; i < nets.length; i++) {
            var net_disp = "";
            var net = nets[i];
            if (isSet(net)) {
                if (isSet(net["security_group"])) {
                    net_disp += net["security_group"].toString();
                }    
                if (isSet(net["subnet"]) && isSet(net["subnet"]["ip_prefix"]) &&
                    isSet(net["subnet"]["ip_prefix_len"])) {
                    labelName = ' ';
                    net_disp +=
                        policyRuleFormat(net["subnet"]["ip_prefix"] + "/" +
                            net["subnet"]["ip_prefix_len"]);
                }            
                if (isSet(net["virtual_network"])) {
                    labelName = ' network ';
                    net_disp += prepareFQN(domain, project, net["virtual_network"]);
                }
                if(isSet(net["network_policy"])) {
                    labelName = ' policy ';
                    net_disp += prepareFQN(domain, project, net["network_policy"]);
                }
            }
            net_disp_all += net_disp;
        }
    }
    return {value : net_disp_all, label : labelName} ;
}
function policy_ports_display(ports) {
    var ports_str = "";
    if (isSet(ports) && ports.length > 0) {
        if (ports.length == 1 && ports[0]["start_port"] == -1) {
            ports_str += " any";
        }
        else {
            ports_str += " [";
            for (var i = 0; i < ports.length; i++) {
                var p = ports[i];
                if (isSet(p["start_port"])) {
                    ports_str += " " + p["start_port"].toString();

                    if (isSet(p["end_port"])) {
                        if (p["start_port"] !== p["end_port"]) {
                            ports_str += "-" + p["end_port"].toString();
                        }
                    }
                }
                if (i != (ports.length - 1)) {
                    ports_str += ",";
                }
            }
            ports_str = ports_str + " ]";
        }
    }
    return ports_str;
}
function clone(obj) {
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        var copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        var copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy[i] = clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        var copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isnt supported.");
}
function getProtocol(protocol) {
    return (isSet(protocol)) ? protocol.toLowerCase() : "any";
}
function getFQNofVN(domain, project, vn) {
	if(!isSet(domain) || !isSet(project)) {
		if(isSet(vn)) {
			return vn;
		} else {
			return null;
		}
	}
    var fqn = jsonPath(configObj, 
            "$..virtual-networks[?(@.fq_name[0]=='" + domain + 
            "' && @.fq_name[1]=='" + project + 
            "' && @.fq_name[2]=='" + vn + "')]");
    if (fqn && fqn.length == 1) {
        fqn = fqn[0].fq_name;
        fqn = (fqn.toString()).replace(/,/g, ":");
        return fqn;
    } else if (isSet(vn)) {
        return vn
    }
    return null;
}
function getEndPort(port) {
    if (isSet(port)) {
    	port = port.toString();
        if (port.trim().toLowerCase() == "any")
            return -1;
        else {
            if (port.indexOf(",") != -1) {
                var startports = [];
                var parts = port.split(",");
                for (var i = 0; i < parts.length; i++) {
                    var part = parts[i];
                    if (isSet(part.split("-")[1]))
                        startports[startports.length] = part.split("-")[1];
                    else {
                        if (isSet(part.split("-")[0])) {
                            startports[startports.length] =
                                part.split("-")[0];
                        }
                    }
                }
                return startports.toString();
            } else {
                var part = port.split("-")[1];
                if (isSet(part)) {
                    part = part.trim().toLowerCase();
                    return part;
                } else if (isSet(port.split("-")[0])) {
                    port = port.split("-")[0];
                    return port;
                }
            }
        }
    }
    return -1;
}
function getStartPort(port) {
    if (isSet(port)) {
        if (port.trim().toLowerCase() == "any")
            return -1;
        else {
            if (port.indexOf(",") != -1) {
                var startports = [];
                var parts = port.split(",");
                for (var i = 0; i < parts.length; i++) {
                    var part = parts[i];
                    if (isSet(part.split("-")[0]))
                        startports[startports.length] = part.split("-")[0];
                    else {
                        if (isSet(part.split("-")[1])) {
                            startports[startports.length] =
                                part.split("-")[1];
                        }
                    }
                }
                return startports.toString();
            } else {
                port = port.split("-")[0];
                if (isSet(port)) {
                    port = port.trim().toLowerCase();
                    return port;
                }
            }
        }
    }
    return -1;
}
function validip(ip) {
    if (null != ip && "" != ip) {
        ipsplit = ip.split("/");
        if (null != ipsplit && "" != ipsplit) {
            var regex = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/
            if (regex.test(ipsplit[0]) == true) {
                if (null != ipsplit[1] && "" != ipsplit[1]) {
                    try {
                        var subnet = parseInt(ipsplit[1]);
                        if (subnet >= 0 && subnet <= 32)
                            return true;
                        else
                            return false;
                    } catch (e) {
                        return false;
                    }
                }
                else {
                    return true;
                }
            }
            else {
                //invalid ip
                return false;
            }
        }
        else {
            return false;
        }
    }
    else {
        //blank input - throw error
        return false;
    }
    return false;
}
function convert_str_to_ip(ip_str) {
    var temp_ip_str = ip_str.trim();
    var ip_octet = "";
    var ip_int = 0;
    var ip_int = 0;
    var max_bits = 32;
    pos = temp_ip_str.indexOf('.');
    while (-1 != pos) {
        ip_octet = temp_ip_str.substr(0, pos);
        ip_int += (parseInt(ip_octet) << (max_bits - 8));
        max_bits -= 8;
        temp_ip_str = temp_ip_str.slice(pos + 1);
        pos = temp_ip_str.indexOf('.');
    }
    ip_int += (parseInt(temp_ip_str) << (max_bits - 8));
    return ip_int;
}
function get_subnet_mask(ip_str) {
    var pos = ip_str.indexOf('/');
    var subnet_mask = 0;
    if (-1 == pos) {
        return;
    }
    var mask = parseInt(ip_str.slice(pos + 1));

    for (var i = 1; i <= mask; i++) {
        subnet_mask += (1 << (32 - i));
    }
    return convert_ip_to_str(subnet_mask);

}
function convert_ip_to_str(ip_addr) {
    ip_addr = ip_addr;
    var ip_str = "";
    var max_bits = 32;
    while (max_bits > 0) {
        ip_str += ((ip_addr >> (max_bits - 8)) & 0xff);
        max_bits -= 8;
        if (max_bits) {
            ip_str += ".";
        }
    }
    return ip_str;
}
function ip_range_add(ip_str, ip_list) {

    var pos = ip_str.indexOf('-');
    var ip_str1 = ip_str.substr(0, pos);
    var ip_str2 = ip_str.slice(pos + 1);
    var ip_addr1 = convert_str_to_ip(ip_str1);
    var ip_addr2 = convert_str_to_ip(ip_str2);

    if (ip_addr2 < ip_addr1) {
        ip_list = "";
        alert("ip2 < ip1")
        return 0;
    }
    while (ip_addr1 <= ip_addr2) {
        /* Skip FF and 0 as 4th Octet */
        ip_fourth_octet = ip_addr1 & 0xFF;
        if (!(ip_fourth_octet) || (0xFF == ip_fourth_octet)) {
            ip_addr1++;
            continue;
        }
        ip_list.push(convert_ip_to_str(ip_addr1));
        ip_addr1++;
    }
    return 1;
}
function ip_range_with_mask(ip_str, ip_list) {
    var i;
    var ip_addr = 0;
    var subnet_mask = 0;
    var ip_addr_octet = [];
    var host_all_1s = 0;
    var subnet_octet = [];
    var pos = ip_str.indexOf('/');
    var mask = parseInt(ip_str.slice(pos + 1));
    var str = ip_str.substr(0, pos);
    var max_no_subnet = 0;
    var no_host = 0;
    var subnet_mask = 0;

    for (i = 1; i <= mask; i++) {
        subnet_mask += (1 << (32 - i));
    }

    ip_addr = convert_str_to_ip(str);
    ip_addr_octet[0] = (ip_addr >> 24) & 0xFF;
    ip_addr_octet[1] = (ip_addr >> 16) & 0xFF;
    ip_addr_octet[2] = (ip_addr >> 8) & 0xFF;
    ip_addr_octet[3] = (ip_addr >> 0) & 0xFF;

    var first_ip = subnet_mask && ip_addr;
    //console.log("first :", convert_ip_to_str(first_ip));
    for (i = 0; i < 32 - mask; i++) {
        host_all_1s += (1 << i);
    }
    var last_ip = ip_addr | host_all_1s;
    for (i = first_ip + 1; i <= last_ip - 1; i++) {
        str = convert_ip_to_str(i);
        ip_list.push(str);
    }
    //console.log("Last:", convert_ip_to_str(last_ip));
    return ip_list;
}
function ip_range_add_raw(ip_str, ip_list) {
    /* Check for - or / character */
    var pos = ip_str.indexOf('/');
    if (-1 == pos) {
        pos = ip_str.indexOf('-');
        if (-1 == pos) {
            ip_list.push(ip_str);
        } else {
            ip_range_add(ip_str, ip_list);
        }
    } else {
        ip_range_with_mask(ip_str, ip_list);
    }
}
function ip_range(ip_str, ip_list) {
    /* First divide the string into comma seperated strings and store all those
     * in some list
     */
    var i = 0;
    var pos = -1;
    var raw_ip_list = [];
    var ip_str_slice = "";
    ip_str = ip_str.trim();
    if (!ip_str.length) {
        return null;
    }
    pos = ip_str.indexOf(',');
    if (-1 == pos) {
        /* Only one IP */
        //ip_list.push(ip_str);
        ip_range_add_raw(ip_str, ip_list);
        return ip_list;
    }
    ip_str_slice = ip_str;
    while (-1 != pos) {
        raw_ip_list.push(ip_str_slice.substr(0, pos));
        ip_range_add_raw(ip_str_slice.substr(0, pos), ip_list);
        ip_str_slice = ip_str_slice.slice(pos + 1);
        pos = ip_str_slice.indexOf(',');
    }
    raw_ip_list.push(ip_str_slice);
    ip_range_add_raw(ip_str_slice, ip_list);
    return ip_list;
}
function removeRTString(rt) {
    if (isSet(rt) && rt.indexOf("target:") != -1) {
        return rt.split("target:")[1];
    }
    return rt;
}
function checkValidDestinationNetwork(vn) {
    if (!isSet(vn)) {
        //showInfoWindow("Select valid destination network", "Input required");
        return "any";
    }
    return vn;
}
function checkValidSourceNetwork(vn) {
    if (!isSet(vn)) {
        //showInfoWindow("Select valid source network", "Input required");
        return "any";
    }
    return vn;
}
function toggleButtonStateByID(id, enable) {
    var btn = $("#" + id);
    if (isSet(btn) && btn.length > 0) {
        if (enable === true) {
            $("#" + id)[0].disabled = false;
            $("#" + id).removeClass("disabled");
        } else {
            $("#" + id)[0].disabled = true;
            $("#" + id).addClass("disabled");
        }
    }
}
function getFormatVNName(vn) {
    if (isSet(vn) && vn.length > 0) {
        if (vn.trim().toLowerCase() === "automatic") {
            return "";
        }
        return vn.trim();
    }
    return "";

}
function getApplyServices(arr) {
    if (isSet(arr) && arr.length > 0) {
        for (var i = 0; i < arr.length; i++) {
            arr[i] = arr[i].trim();
            var sis = jsonPath(configObj, "$..service_templates[*].service-template.service_instance_back_refs[*]");
            for (var j = 0; j < sis.length; j++) {
                var si = sis[j];
                if (si.to[2] == arr[i]) {
                    arr[i] = si.to[0] + ":" + si.to[1] + ":" + si.to[2];
                    break;
                }
            }
        }
        return arr;
    }
    return null;
}
function policy_services_display(action_list, domain, project) {
    var service_str = "";
    if (isSet(action_list)) {
        var as = action_list.apply_service;
        var mt = action_list.mirror_to;
        if (isSet(as) && as.length > 0) {
            var services_value = "";
            for (var i = 0; i < as.length; i++) {
                var item = as[i].split(':');
                if(item.length === 3) {
                    if(item[0] === domain &&
                        item[1] === project) {
                        item = item[2];  
                    } else {               
                        item = item[2] + ' (' + item[0] + ':' + item[1] + ')'; 
                    }    
                } else {
                    item = item[0];
                }
                services_value += item;
                if (i != (as.length - 1)) {
                    services_value += ",";
                }
            }
            service_str += ' services ' + policyRuleFormat(services_value);
        }
        if (isSet(mt) && isSet(mt.analyzer_name)) {
            mt.analyzer_name = mt.analyzer_name.split(':');
            if(mt.analyzer_name.length === 3) {
                if(mt.analyzer_name[0] === domain && 
                    mt.analyzer_name[1] === project) {
                    mt.analyzer_name = mt.analyzer_name[2];        
                } else {
                    mt.analyzer_name = mt.analyzer_name[2] + ' (' + mt.analyzer_name[0] + ':' + mt.analyzer_name[1] + ')'; 
                }    
            } else {
                mt.analyzer_name = mt.analyzer_name[0];
            }
            service_str += ' mirror ' + policyRuleFormat(mt.analyzer_name);
        }
    }
    return service_str;
}
function launchVNCcb(result, cbParams) {
    var href = jsonPath(result, "$.console.url")[0];
    if (cbParams.sameWindow) {
        $("#vnc-console-widget").show();
        if(cbParams.title) {
            $("#vnc-console-title").text(cbParams.title);
        }
        $("#vnc-console-frame").attr("src", href);
    } else {
        window.open(href);
    }
}
function failureLaunchVNCcb(error) {
    $("#vnc-console-widget").hide();
    $("#vnc-console-frame").attr("src", "");
    showInfoWindow("Error in getting url of VNC console: " + error.statusText, "Error");
}
function fetchDomains(successCB, failureCB) {
    doAjaxCall("/api/tenants/config/domains", "GET", null, successCB, (failureCB) ? failureCB : "errorInFetchingDomains", null, null);
}
function fetchProjects(successCB, failureCB, domainUUID) {
    if(domainUUID) {
        domainUUID = "/" + domainUUID;
    } else {
        if($("#ddDomainSwitcher").hasOwnProperty("length")) {
            //Works fine when the ID of the domain switcher is 'ddDomainSwitcher'
            //and is a contrailDropdown. Pass UUID of the Domain, otherwise.
            if(undefined !== $("#ddDomainSwitcher").data("contrailDropdown")) {
                domainUUID = "/" + $("#ddDomainSwitcher").data("contrailDropdown").value();
            }
        } else {
            domainUUID = "";
        }
    }
    doAjaxCall("/api/tenants/config/projects"+domainUUID, "GET", null, successCB, (failureCB) ? failureCB : "errorInFetchingProjects", null, null);
}
function errorInFetchingDomains(error) {
    showInfoWindow("Error in Fetching domains", "Error");
}
function errorInFetchingProjects(error) {
    showInfoWindow("Error in Fetching projects", "Error");
}
function isValidDomainAndProject(selectedDomain, selectedProject) {
	if(isValidDomain(selectedDomain) === true &&
		isValidProject(selectedProject) === true) {
		return true;
	}
	return false;
}
function isValidDomain(selectedDomain) {
    if(null == selectedDomain || typeof selectedDomain === "boolean" || "" == selectedDomain.trim()) {
    	showInfoWindow("Selected Domain appears to be invalid. Select a valid Domain and try again.", "Invalid Domain");
    	return false;
    }
    return true;
}
function isValidProject(selectedProject) {
    if(null == selectedProject || typeof selectedProject === "boolean" || "" == selectedProject.trim()) {
    	showInfoWindow("Selected Project appears to be invalid. Select a valid Project and try again.", "Invalid Project");
    	return false;
    }
	return true;
}
function checkValidPortRange(startPortsArray, endPortsArray, source) {
    var validPortRangeMsg =
        (source && source === true) ? "Enter a valid source port between 1 - 65535 and try again" :
            "Enter a valid destination port between 1 - 65535 and try again";

    for (var j = 0; j < startPortsArray.length; j++) {
        if(!isNumber(startPortsArray[j]) || !isNumber(endPortsArray[j])) {
            showInfoWindow(validPortRangeMsg, "Invalid input");
            return false;
        }
        if(isNumber(startPortsArray[j]) && isNumber(endPortsArray[j])) {
            if(parseInt(startPortsArray[j]) <= 0 || parseInt(startPortsArray[j]) > 65535) {
                showInfoWindow(validPortRangeMsg, "Invalid input");
                return false;
            }
            if(parseInt(endPortsArray[j]) <= 0 || parseInt(endPortsArray[j]) > 65535) {
                showInfoWindow(validPortRangeMsg, "Invalid input");
                return false;
            }
        }
    }
    return true;
}
function deleteObject(cbParams) {
	if(cbParams && (cbParams.index === null || typeof cbParams.index === "undefined")) {
		cbParams.index = 0;
	}
	if(cbParams && (cbParams.index < cbParams.selected_rows.length)) {
		var selected_row_data = cbParams.selected_rows[cbParams.index];
	    doAjaxCall(cbParams.url + selected_row_data[cbParams.urlField], 
	        "DELETE", JSON.stringify(selected_row_data), "deleteSuccess", "deleteFailure", null, cbParams, cbParams.timeout, true);
	} else {
		deleteComplete(cbParams);
	}
}
function deleteSuccess(result, cbParams) {
	if(cbParams && (cbParams.index < cbParams.selected_rows.length)) {
		var params = {};
		params.selected_rows = cbParams.selected_rows;
		params.url = cbParams.url; 
		params.urlField = cbParams.urlField;
		params.fetchDataFunction = cbParams.fetchDataFunction;
		params.errorShortMessage = cbParams.errorShortMessage;
		params.errorTitle = cbParams.errorTitle;
		params.errorShortMessage = cbParams.errorShortMessage;
		params.errorField = cbParams.errorField;
		params.index = cbParams.index + 1;
        if(typeof cbParams.errors !== "undefined" &&
            null !== cbParams.errors) {
            params.errors = cbParams.errors;
            params.errorDesc = cbParams.errorDesc;
        }
        deleteObject(params);
	} else {
		deleteComplete(cbParams);
	}
}
function deleteComplete(cbParams) {
    if(typeof cbParams.errors !== "undefined" &&
        null !== cbParams.errors && 
        cbParams.errors.length > 0) {
    	var msg = "";
    	var objects = [];
        for(var i=0; i<cbParams.errors.length; i++) {
            objects[i] = cbParams.selected_rows[cbParams.errors[i]][cbParams.errorField];
            msg = msg +
            cbParams.errorField + ": " + cbParams.selected_rows[i][cbParams.errorField] + "<br>" +
            cbParams.errorDesc[i] + "<br><br>";
        }
        objects = objects.join(", ");
        cbParams.errorShortMessage += objects;
        showInfoWindow(cbParams.errorShortMessage, cbParams.errorTitle, msg);
    }
    window[cbParams.fetchDataFunction]();
}
function deleteFailure(result, cbParams) {
    if(cbParams && (cbParams.index < cbParams.selected_rows.length)) {	
        var params = {};
        params.selected_rows = cbParams.selected_rows;
		params.url = cbParams.url; 
		params.urlField = cbParams.urlField;
		params.fetchDataFunction = cbParams.fetchDataFunction;
		params.errorShortMessage = cbParams.errorShortMessage;
		params.errorTitle = cbParams.errorTitle;
		params.errorShortMessage = cbParams.errorShortMessage;
		params.errorField = cbParams.errorField;
        if(typeof cbParams.errors !== "undefined" &&
            null !== cbParams.errors) {
        	params.errors = cbParams.errors;
        	params.errorDesc = cbParams.errorDesc;
        } else {
        	params.errors = [];
        	params.errorDesc = [];
        }
	    params.errors[params.errors.length] = cbParams.index;
	    params.errorDesc[params.errorDesc.length] = result.responseText;
	    params.index = cbParams.index + 1;
	    deleteObject(params);
    } else {
        deleteComplete(cbParams);	
    }
}
function checkSystemProject(project) {
	var sysProjects = ["service", "invisible_to_admin"];
	if(sysProjects.indexOf(project) !== -1)
		return true;
	return false;
}
function scrollUp(contWindow,div,boolCollapse,collapseDivID){
    //div.scrollIntoView();
    if(46 >= Math.abs(
        $(contWindow).find("div.modal-body")[0].getBoundingClientRect().bottom - 
        $(div)[0].getBoundingClientRect().bottom)) {
        $($(contWindow).find("div.modal-body")[0]).animate({
         scrollTop: $(div)[0].getBoundingClientRect().top
        }, 1000);
    }
    if(boolCollapse === true){
        collapseElement(div,collapseDivID);
    }
}
function getSelectedProjectObjNew(projectSwitcherId, elementType) {
    var firstProjectName = "", firstProjectValue = "";
    var cookiedProject = getCookie("project");
    if (cookiedProject === false || cookiedProject === "null" || cookiedProject === "undefined") {
        if(elementType === "contrailDropdown") {
            firstProjectName = $("#" + projectSwitcherId).data(elementType).text();
            firstProjectValue = $("#" + projectSwitcherId).data(elementType).value();
        }
        setCookie("project", firstProjectName);
        return firstProjectValue;
    } else {
        if(elementType === "contrailDropdown") {
            for (var i = 0; i < $("#" + projectSwitcherId).data(elementType).getAllData().length; i++) {
                var pname = $("#" + projectSwitcherId).data(elementType).getAllData()[i].text;
                if (pname === cookiedProject) {
                    return $("#" + projectSwitcherId).data(elementType).getAllData()[i].value;
                }
            }
            firstProjectName = $("#" + projectSwitcherId).data(elementType).text();
            firstProjectValue = $("#" + projectSwitcherId).data(elementType).value();
        }
    }
    setCookie("project", firstProjectName);
    return firstProjectValue;
}
function getSelectedDomainProjectObjNew(filterSwitcherId, elementType, filterType) {
    var firstFilterName = "", firstFilterValue = "";
    var cookiedFilter = getCookie(filterType);
    var dataSrc = $("#" + filterSwitcherId).data(elementType).getAllData()[0];
    if (cookiedFilter === false || cookiedFilter === "null" || cookiedFilter === "undefined") {
        if(elementType === "contrailDropdown") {
            firstFilterName = dataSrc ? dataSrc.text : "";
            firstFilterValue = dataSrc ? dataSrc.value : "";
        }
    } else {
        if(elementType === "contrailDropdown") {
            for (var i = 0; i < $("#" + filterSwitcherId).data(elementType).getAllData().length; i++) {
                var pname = $("#" + filterSwitcherId).data(elementType).getAllData()[i].text;
                if (pname === cookiedFilter) {
                    return $("#" + filterSwitcherId).data(elementType).getAllData()[i].value;
                }
            }
            firstFilterName = dataSrc ? dataSrc.text : "";
            firstFilterValue = dataSrc ? dataSrc.value : "";
        }
    }
    setCookie(filterType, firstFilterName);
    return firstFilterValue;
}
function setDomainProjectEmptyMsg(filterSwitcherId, filterType) {
        var filter = filterType === 'project'? 'Projects' : 'Domains';
        var emptyObj = [{text:'No '+ filter +' found',value:"Message"}];
        $("#" + filterSwitcherId).data("contrailDropdown").setData(emptyObj);
        $("#" + filterSwitcherId).data("contrailDropdown").text(emptyObj[0].text);
        $("#" + filterSwitcherId).data("contrailDropdown").enable(false);
}
function emptyCookie(filterType) {
    setCookie(filterType, "");
}
function policyRuleFormat(text) {
    return '<span class="rule-format">' + text  + '</span>';
}
function formatSrcDestAddresses(rule, domain, project) {
    var rule_display = '';
    var addrSrcDest = policy_net_display(rule, domain, project); 
    if(isSet(addrSrcDest.value)) {
        rule_display = addrSrcDest.label + addrSrcDest.value;
    }
    return rule_display;     
}
function prepareFQN(domain, project, net) {
    var net_disp = '';
    if(isSet(domain) && isSet(project) && isString(domain) &&
    	isString(project)) {
    	var splits = net.split(":");
    	if(domain === splits[0] && project === splits[1]) {
            if(splits.length === 3) {    
                if(splits[2].toLowerCase() === "any" 
                    || splits[2].toLowerCase() === "local"){
                    net_disp = policyRuleFormat(net.toString());
                } else {
                    net_disp = policyRuleFormat(splits[2]);
                }
            } else {
                net_disp = policyRuleFormat(splits[0]);    
            }    
    	} else {
            //prepare network display format
            var netArry = net.toString().split(':');
            if(netArry.length === 3) {
                if(netArry[0].toLowerCase() != 'any' && netArry[0].toLowerCase() != 'local') {
                    netArry = policyRuleFormat(netArry[2]) + ' (' + netArry[0] + ':' + netArry[1] + ')';
                    net_disp = netArry;
                } else {
                    net_disp = policyRuleFormat(netArry[0]);                                
                }
            } else {
                net_disp = policyRuleFormat(netArry[0]); 
            }
    	}
    } else {
    	net_disp = policyRuleFormat(net.toString());	
    }
    return net_disp;
}
function getFQNofPolicy(domain, project, policy) {
	if(!isSet(domain) || !isSet(project)) {
		if(isSet(policy)) {
			return policy;
		} else {
			return null;
		}
	}
    var fqn = jsonPath(configObj, 
            "$..policys-input[?(@.fq_name[0]=='" + domain + 
            "' && @.fq_name[1]=='" + project + 
            "' && @.fq_name[2]=='" + policy + "')]");
    if (fqn && fqn.length == 1) {
        fqn = fqn[0].fq_name;
        fqn = (fqn.toString()).replace(/,/g, ":");
        return fqn;
    } else if (isSet(policy)) {
        return policy
    }
    return null;
}
function genarateGateway(cidr,from){
    var ciderValue = new v4.Address(cidr); 
    var gateway;
    if(ciderValue.isValid() === true){
        var ipcreated;
        var bigInt;
        if(from == "end"){
            ipcreated = ciderValue.endAddress();
            var bg1 = ipcreated.bigInteger();
            bigInt = bg1.subtract(new BigInteger("1",10));
        } else if(from == "start" || from == "" ){
            ipcreated = ciderValue.startAddress();
            var bg1 = ipcreated.bigInteger();
            bigInt = bg1.add(new BigInteger("1",10));
        }
        gateway = v4.Address.fromBigInteger(bigInt).address;
    } else {    
        ciderValue = new v6.Address(cidr); 
        if(ciderValue.isValid() === true){
            var ipcreated;
            var bigInt;
            if(from == "end"){
                ipcreated = ciderValue.endAddress();
                var bg1 = ipcreated.bigInteger();
                bigInt = bg1.subtract(new BigInteger("1",10));
            } else if(from == "start" || from == "" ){
                ipcreated = ciderValue.startAddress();
                var bg1 = ipcreated.bigInteger();
                bigInt = bg1.add(new BigInteger("1",10));
            }
            gateway = new v6.Address.fromBigInteger(bigInt).correctForm()

        } else {
            return false;
        }
    }
    return gateway;
}
function isValidIP(ipAddress){
    if(ipAddress == null)
        return false;
    var IP = new v4.Address(ipAddress); 
    if(IP.isValid() === true){
        return true;
    }
    IP = new v6.Address(ipAddress); 
    if(IP.isValid() === true){
        return true;
    }
    return false;
}
function isIPv4(ipAddress){
    if(ipAddress == null)
        return false;
    var IP = new v4.Address(ipAddress); 
    if(IP.isValid() === true){
        return true;
    }
    return false;
}
function isIPv6(ipAddress){
    var IP;

    if(ipAddress == null ) {
        return false;
    } else {
        try {
            IP = new v6.Address(ipAddress);
        } catch (error) {
            return false;
        }
        if(IP.isValid() === true){
            return true;
        }
    }

    return false;
}
function isIPBoundToRange(range,ipAddress){
    var IP = new v4.Address(ipAddress); 
    var IPRange = new v4.Address(range); 
    if(IP.isValid() === true && IPRange.isValid() === true){
        return IP.isInSubnet(IPRange);
    } else {
        IP = new v6.Address(ipAddress); 
        IPRange = new v6.Address(range);        
        if(IP.isValid() === true && IPRange.isValid() === true){
            return IP.isInSubnet(IPRange);
        }
    }
}
function formatVirtualRouterType(type) {
    var formattedType = '';
    if(type === '-') {
         formattedType = type;
    } else if(type instanceof  Array) {
        if(type.length > 0) {
            for(var i = 0; i < type.length; i++) {
                var actText = '';
                switch(type[i]) {
                    case 'hypervisor' :
                        actText = 'Hypervisor';
                        break;
                    case 'embedded' :
                        actText = 'Embedded';
                        break;
                    case 'tor-agent' :
                        actText = 'TOR Agent';
                        break;
                    case 'tor-service-node' :
                        actText = 'TOR Service Node';
                        break;
                    default :
                        actText = 'Hypervisor';
                        break;
                }
                if(formattedType === '') {
                    formattedType = actText
                } else {
                    formattedType += ' , ' + actText;
                }
            }
        } else {
            formattedType = 'Hypervisor';
        }
    }else {
            switch(type) {
                case 'hypervisor' :
                    formattedType = 'Hypervisor';
                    break;
                case 'embedded' :
                    formattedType = 'Embedded';
                    break;
                case 'tor-agent' :
                    formattedType = 'TOR Agent';
                    break;
                case 'tor-service-node' :
                    formattedType = 'TOR Service Node';
                    break;
                default :
                    formattedType = 'Hypervisor';
                    break;
            }
    }
    return formattedType;
}
function isValidMACAddress(mac) {
    mac = mac.toUpperCase();
    var mac_address_regex = /^([0-9A-F]{2}[:-]){5}([0-9A-F]{2})$/;
    return mac_address_regex.test(mac);
}
function isIPBoundToIPRange(rangeStart, rangeEnd, ipAddress){
    var code = 2;//Out of Range
    var IP = new v4.Address(ipAddress);
    var IPRangeStart = new v4.Address(rangeStart);
    var IPRangeEnd = new v4.Address(rangeEnd);
    if(IP.isValid() === true && IPRangeStart.isValid() === true && IPRangeEnd.isValid()){
        var IPInt = IP.bigInteger();
        var startIPInt = IPRangeStart.bigInteger();
        var endIPInt = IPRangeEnd.bigInteger();
        if(startIPInt.compareTo(IPInt) <= 0 && endIPInt.compareTo(IPInt) >= 0){
            code = 0;// In Range
        }
    } else {
        IP = new v6.Address(ipAddress); 
        IPRangeStart = new v6.Address(rangeStart);
        IPRangeEnd = new v6.Address(rangeEnd);
        if(IP.isValid() === true && IPRangeStart.isValid() === true && IPRangeEnd.isValid()){
            var IPInt = IP.bigInteger();
            var startIPInt = IPRangeStart.bigInteger();
            var endIPInt = IPRangeEnd.bigInteger();
            if(startIPInt.compareTo(IPInt) <= 0 && endIPInt.compareTo(IPInt) >= 0){
                code = 0;// In Range
            }
        } else {
            code = 1;// Invalid IP
        }
    }
    //code 0-> In Range.
    //code 1-> Invalid IP.
    //code 2-> Not in Range.
    return code;
}
function isStartAddress(cidr, ipAddress){
    var cidrAddress = new v4.Address(cidr);
    if(cidrAddress.isValid() == true){
        if(isIPv4(ipAddress)){
            var cidrBigInt = new v4.Address(ipAddress).bigInteger();
            var IPBigInt = new v4.Address(cidrAddress.startAddress().address).bigInteger();
            if(cidrBigInt.compareTo(IPBigInt) == 0){
                return true;
            }
        }
    } else {
        cidrAddress = new v6.Address(cidr); 
        if(cidrAddress.isValid() == true){
            if(isIPv6(ipAddress)){
                var cidrBigInt = new v6.Address(cidrAddress.startAddress().address).bigInteger();
                var IPBigInt = new v6.Address(ipAddress).bigInteger();
                if(cidrBigInt.compareTo(IPBigInt) == 0){
                    return true;
                }
            }
        }
    }
    return false;
}
function isEndAddress(cidr, ipAddress){
    var cidrAddress = new v4.Address(cidr);
    if(cidrAddress.isValid() == true){
        if(isIPv4(ipAddress)){
            var cidrBigInt = new v4.Address(ipAddress).bigInteger();
            var IPBigInt = new v4.Address(cidrAddress.endAddress().address).bigInteger();
            if(cidrBigInt.compareTo(IPBigInt) == 0){
                return true;
            }
        }
    } else {
        cidrAddress = new v6.Address(cidr); 
        if(cidrAddress.isValid() == true){
            if(isIPv6(ipAddress)){
                var cidrBigInt = new v6.Address(cidrAddress.endAddress().address).bigInteger();
                var IPBigInt = new v6.Address(ipAddress).bigInteger();
                if(cidrBigInt.compareTo(IPBigInt) == 0){
                    return true;
                }
            }
        }
    }
    return false;
}
;
define("config_global", function(){});

/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */


var lastHash = {};
$.xhrPool = [];

var previous_scroll = $(window).scrollTop(),
    scrollHeight = $(document).height() - $(window).height();

$.allajax = (function ($) {
    var xhrPool = [];
    var ajaxId = 0;
    $(document).ajaxSend(function (e, jqXHR, options) {
        if (options.abortOnNavigate != false && options.abortOnNavigate != "false") {
            xhrPool.push(jqXHR);
        }
    });
    $(document).ajaxComplete(function (e, jqXHR, options) {
        var index = xhrPool.indexOf(jqXHR);
        if (index > -1) {
            xhrPool.splice(index, 1);
        }
    });
    this.abort = function () {
        var tempXhrPool = [];
        $.extend(true, tempXhrPool, xhrPool);
        for (var i = 0; i < tempXhrPool.length; i++) {
            tempXhrPool[i].abort();
        }
    };

    return this;
})($);

Object.identical = function (a, b, sortArrays) {
    function sort(object) {
        if (sortArrays === true && Array.isArray(object)) {
            return object.sort();
        }
        else if (typeof object !== "object" || object === null) {
            return object;
        }

        return Object.keys(object).sort().map(function (key) {
            return {
                key: key,
                value: sort(object[key])
            };
        });
    }

    return JSON.stringify(sort(a)) === JSON.stringify(sort(b));
};

function onClickSidebarCollapse() {
    var $minimized = false;
    $('#sidebar').toggleClass('menu-min');
    $('#sidebar-collapse').find('i').toggleClass('icon-chevron-left').toggleClass('icon-chevron-right');

    $minimized = $('#sidebar').hasClass('menu-min');
    if ($minimized) {
        $('.open > .submenu').removeClass('open');
        setCookie('sidebar', 'close');
    } else {
        setCookie('sidebar', 'open');
    }
}

function enableSearchAhead() {
    $('#nav-search-input').contrailAutoComplete({
        source: globalObj['siteMapSearchStrings'],
        select: function (event, ui) {
            searchSiteMap();
        }
    });
}

function searchSiteMap() {
    var searchString = $('#nav-search-input').val(), hash, queryParams;
    var siteMap = globalObj['siteMap'];
    for (hash in siteMap) {
        if (siteMap[hash]['searchStrings'].indexOf(searchString.trim()) != -1) {
            lastHash = $.bbq.getState();
            queryParams = siteMap[hash]['queryParams'];
            currHash = {p: hash, q: queryParams};
            layoutHandler.onHashChange(lastHash, currHash);
            lastHash = currHash;
            return false;
        }
    }
    return false;
};

function generalInit() {
    $('.ace-nav [class*="icon-animated-"]').closest('a').on('click', function () {
        var icon = $(this).find('[class*="icon-animated-"]').eq(0);
        var $match = icon.attr('class').match(/icon\-animated\-([\d\w]+)/);
        icon.removeClass($match[0]);
        $(this).off('click');
    });

    $('#btn-scroll-up').on('click', function () {
        var duration = Math.max(100, parseInt($('html').scrollTop() / 3));
        $('html,body').animate({scrollTop: 0}, duration);
        return false;
    });

}

function openWidget(id) {
    var $this = $(id).find('.widget-toolbar > a[data-action]');
    var $box = $this.closest('.widget-box');
    var $body = $box.find('.widget-body');
    var $icon = $this.find('[class*=icon-]').eq(0);
    var $match = $icon.attr('class').match(/icon\-(.*)\-(up|down)/);
    var $icon_down = 'icon-' + $match[1] + '-down';
    var $icon_up = 'icon-' + $match[1] + '-up';
    $body = $body.find(':first-child').eq(0);
    if ($box.hasClass('collapsed')) {
        if ($icon) $icon.addClass($icon_up).removeClass($icon_down);
        $box.removeClass('collapsed');
        $body.slideDown(200);
    }
    if ($box.hasClass('collapsed') && $icon) $icon.addClass($icon_down).removeClass($icon_up);
};

function collapseWidget(id) {
    var $this = $(id).find('.widget-toolbar > a[data-action]');
    var $box = $this.closest('.widget-box');
    var $body = $box.find('.widget-body');
    var $icon = $this.find('[class*=icon-]').eq(0);
    var $match = $icon.attr('class').match(/icon\-(.*)\-(up|down)/);
    var $icon_down = 'icon-' + $match[1] + '-down';
    var $icon_up = 'icon-' + $match[1] + '-up';
    $body = $body.find(':first-child').eq(0);
    if (!($box.hasClass('collapsed'))) {
        if ($icon) $icon.addClass($icon_down).removeClass($icon_up);
        //$body.slideUp(300, function () {
        $box.addClass('collapsed');
        //});
    }
};

function toggleWidget(id) {
    var $this = $(id);
    var $box = $this.closest('.widget-box');
    var $body = $box.find('.widget-body');
    var $icon = $this.find('[class*=icon-]').eq(0);
    var $match = $icon.attr('class').match(/icon\-(.*)\-(up|down)/);
    var $icon_down = 'icon-' + $match[1] + '-down';
    var $icon_up = 'icon-' + $match[1] + '-up';
    $body = $body.wrapInner('<div class="widget-body-inner"></div>').find(':first-child').eq(0);
    if ($box.hasClass('collapsed')) {
        if ($icon) $icon.addClass($icon_up).removeClass($icon_down);
        $box.removeClass('collapsed');
        $body.slideDown(200);
    } else {
        if ($icon) $icon.addClass($icon_down).removeClass($icon_up);
        $body.slideUp(300, function () {
            $box.addClass('collapsed');
        });
    }
    if ($box.hasClass('collapsed') && $icon) $icon.addClass($icon_down).removeClass($icon_up);
};

function toggleWidgetsVisibility(showWidgetIds, hideWidgetIds) {
    for (var i = 0; i < showWidgetIds.length; i++) {
        $('#' + showWidgetIds[i]).removeClass('hide');
    }
    for (var j = 0; j < hideWidgetIds.length; j++) {
        $('#' + hideWidgetIds[j]).addClass('hide');
    }
};

function initWidgetBoxes() {
    $('.widget-toolbar > a[data-action]').each(function () {
        initWidget(this);
    });
};

function initWidget4Id(id) {
    $(id).find('.widget-toolbar > a[data-action]').each(function () {
            initWidget(this);
        }
    );
};

function initWidget(widget) {
    var $this = $(widget);
    var $action = $this.data('action');
    var $box = $this.closest('.widget-box');

    if ($action == 'collapse') {
        /*var $body = $box.find('.widget-body');
         var $icon = $this.find('[class*=icon-]').eq(0);
         var $match = $icon.attr('class').match(/icon\-(.*)\-(up|down)/);
         var $icon_down = 'icon-' + $match[1] + '-down';
         var $icon_up = 'icon-' + $match[1] + '-up';

         $body = $body.wrapInner('<div class="widget-body-inner"></div>').find(':first-child').eq(0);
         $this.on('click', function (ev) {
         if ($box.hasClass('collapsed')) {
         if ($icon) $icon.addClass($icon_up).removeClass($icon_down);
         $box.removeClass('collapsed');
         $body.slideDown(200);
         } else {
         if ($icon) $icon.addClass($icon_down).removeClass($icon_up);
         $body.slideUp(300, function () {
         $box.addClass('collapsed')
         });
         }
         ev.preventDefault();
         });
         if ($box.hasClass('collapsed') && $icon) $icon.addClass($icon_down).removeClass($icon_up);*/

    } else if ($action == 'close') {
        $this.on('click', function (ev) {
            $box.hide(300, function () {
                $box.remove();
            });
            ev.preventDefault();
        });
    } else if ($action == 'close-hide') {
        $this.on('click', function (ev) {
            $box.slideUp();
            ev.preventDefault();
        });
    } else if ($action == 'reload') {
        $this.on('click', function (ev) {
            $this.blur();
            //var $body = $box.find('.widget-body');
            var $remove = false;
            if (!$box.hasClass('position-relative')) {
                $remove = true;
                $box.addClass('position-relative');
            }
            $box.append('<div class="widget-box-layer"><i class="icon-spinner icon-spin icon-2x white"></i></div>');
            setTimeout(function () {
                $box.find('> div:last-child').remove();
                if ($remove) $box.removeClass('position-relative');
            }, parseInt(Math.random() * 1000 + 1000));
            ev.preventDefault();
        });
    } else if ($action == 'settings') {
        $this.on('click', function (ev) {
            ev.preventDefault();
        });
    }
};

//code taken from http://code.jquery.com/jquery-1.8.3.js to provide simple browser detection for 1.9+ versions
function addBrowserDetection($) {
    if (!$.browser) {
        var matched, browser;

        // Use of jQuery.browser is frowned upon.
        // More details: http://api.jquery.com/jQuery.browser
        // jQuery.uaMatch maintained for back-compat
        $.uaMatch = function (ua) {
            ua = ua.toLowerCase();

            var match = /(chrome)[ \/]([\w.]+)/.exec(ua) ||
                /(webkit)[ \/]([\w.]+)/.exec(ua) ||
                /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua) ||
                /(msie) ([\w.]+)/.exec(ua) ||
                ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua) ||
                [];

            return {
                browser: match[1] || "",
                version: match[2] || "0"
            };
        };

        matched = $.uaMatch(navigator.userAgent);
        browser = {};

        if (matched.browser) {
            browser[matched.browser] = true;
            browser.version = matched.version;
        }

        // Chrome is Webkit, but Webkit is also Safari.
        if (browser.chrome) {
            browser.webkit = true;
        } else if (browser.webkit) {
            browser.safari = true;
        }

        $.browser = browser;

    }
}

function onWindowResize() {
    //Trigger resize event on current view
    if ((globalObj.currMenuObj != null))
        if (globalObj.currMenuObj['class'] != null)
            globalObj.currMenuObj['class'].resize();
}

function getScript(url, callback) {
    var scriptPath = url + '?built_at=' + built_at;
    globalObj['loadedScripts'].push(url);
    return $.ajax({
        type: "GET",
        url: scriptPath,
        success: callback,
        dataType: "script",
        cache: true
    });
};

function loadCSS(cssFilePath) {
    var links = document.getElementsByTagName('link'),
        loadcss = true;

    var loadedCSSs = $.map(links, function (idx, obj) {
        return link.getAttribute('href');
    });
    if ($.inArray(cssFilePath, loadedCSSs) == -1) {
        $("<link/>", {
            rel: "stylesheet",
            type: "text/css",
            href: cssFilePath
        }).appendTo("head");
    }
}

function getMenuButtonName(buttonHash) {
    if (buttonHash == "mon") {
        return "monitor"
    } else if (buttonHash == "config") {
        return "configure";
    } else if (buttonHash == "query") {
        return "query";
    } else if (buttonHash == "setting") {
        return "setting";
    } else {
        return "monitor";
    }
}

function check2ReloadMenu(lastPageHash, currentMenu) {
    var lastPageHashArray, reloadMenu = true;
    if (lastPageHash != null && lastPageHash != "") {
        lastPageHashArray = lastPageHash.split("_");
        reloadMenu = (lastPageHashArray[0] == currentMenu) ? false : true;
    }
    return reloadMenu;
}

// JSON Highlighter + Expand & Collapse
function syntaxHighlight(json) {
    if (json == null)
        return;
    json = JSON.stringify(json, undefined, 2)
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    var syntaxedJson = json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }

        if (cls == 'key') {
            match = match.replace(/"/g, '');
            return '<span class="' + cls + '">' + match + '</span>';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });

    syntaxedJson = syntaxedJson.replace(/\]/g, ']</span></span>');
    syntaxedJson = syntaxedJson.replace(/\[/g, '<span class="preBlock"><i class="icon-minus"></i><span class="collapsed hide"> [...]</span><span class="expanded"> [');

    syntaxedJson = syntaxedJson.replace(/\}/g, '}</span></span>');
    syntaxedJson = syntaxedJson.replace(/\{/g, '<span class="preBlock"><i class="icon-minus"></i><span class="collapsed hide"> {...}</span><span class="expanded"> {');

    return syntaxedJson;
}

// Loads the feature screen based on given hashParams
function loadFeature(hashParams) {
    var loadingStartedDefObj = $.Deferred();
    globalObj['menuClicked'] = true;
    //Set hashUpdated flag only if current URL hashParams differs from the passed on
    if (JSON.stringify(layoutHandler.getURLHashObj()) != JSON.stringify(hashParams)) {
        globalObj['hashUpdated'] = 1;
    }
    layoutHandler.setURLHashObj(hashParams);
    //Hiding the last updated time and refresh icon on click of an item left menu
    //hideHardRefresh();
    //Call onHashChange explicitly,as hashchange event is not triggered if there is no change in hahsParams being pushed
    layoutHandler.onHashChange(lastHash, hashParams, loadingStartedDefObj);
    return loadingStartedDefObj;
}

// Info Window Modal
function showInfoWindow(msg, title, detail, yesFunction) {
    //detail = "check check check check check <br> check check check
    //check check check check check <br> check check check";
    if ($('.modal-backdrop').is(':visible')) {
        var nameValue = $('body').find('#infoWindow').attr('id');
        if (nameValue != undefined) {
            if (($("#infoWindow").hasClass("in"))) {
                $('.modal-backdrop').remove();
                $('.modal').remove();
            }
        }
    }
    var content = '<div id="short-msg"><p>' + msg + '</p></div>';
    var footerValue = [];
    if (detail != "" && detail != undefined) {
        content += '<div id="detail" class=""><p><br>' + detail + '</p></div>';
        footerValue.push({
            title: 'Show More',
            className: 'detailNote'
        });
    }
    if (yesFunction != "" && yesFunction != null) {
        footerValue.push({
            title: 'Yes',
            onclick: window[yesFunction],
            className: 'btn-primary'
        });
        footerValue.push({
            title: 'No',
            onclick: 'close',
            className: 'btn-primary'
        });
    } else {
        footerValue.push({
            title: 'Close',
            onclick: 'close',
            className: 'btn-primary'
        });
    }
    $.contrailBootstrapModal({
        id: 'infoWindow',
        title: title,
        body: content,
        footer: footerValue
    });

    if (detail != "" && detail != undefined) {
        $("#detail").addClass("hide");
        $('.detailNote').on('click', function () {
            if ($('.detailNote').text().trim() == "Show More") {
                $('.detailNote').html("Show Less");
                $("#detail").removeClass("hide");
            } else {
                $('.detailNote').html("Show More");
                $("#detail").addClass("hide");
            }
        });
    }
    $('#infoWindow').css('z-index', 1052);
    $('.modal-backdrop:last-child').css('z-index', 1051);
};


define("contrail-layout", function(){});

define('js/nonamd-libs',[
        'web-utils',
        'config_global',
        'contrail-layout'
        ], function() {});

