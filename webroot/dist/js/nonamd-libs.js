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

/*!

 handlebars v1.3.0

Copyright (C) 2011 by Yehuda Katz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

@license
*/
/* exported Handlebars */
var Handlebars = (function() {
// handlebars/safe-string.js
var __module4__ = (function() {
  "use strict";
  var __exports__;
  // Build out our basic SafeString type
  function SafeString(string) {
    this.string = string;
  }

  SafeString.prototype.toString = function() {
    return "" + this.string;
  };

  __exports__ = SafeString;
  return __exports__;
})();

// handlebars/utils.js
var __module3__ = (function(__dependency1__) {
  "use strict";
  var __exports__ = {};
  /*jshint -W004 */
  var SafeString = __dependency1__;

  var escape = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "`": "&#x60;"
  };

  var badChars = /[&<>"'`]/g;
  var possible = /[&<>"'`]/;

  function escapeChar(chr) {
    return escape[chr] || "&amp;";
  }

  function extend(obj, value) {
    for(var key in value) {
      if(Object.prototype.hasOwnProperty.call(value, key)) {
        obj[key] = value[key];
      }
    }
  }

  __exports__.extend = extend;var toString = Object.prototype.toString;
  __exports__.toString = toString;
  // Sourced from lodash
  // https://github.com/bestiejs/lodash/blob/master/LICENSE.txt
  var isFunction = function(value) {
    return typeof value === 'function';
  };
  // fallback for older versions of Chrome and Safari
  if (isFunction(/x/)) {
    isFunction = function(value) {
      return typeof value === 'function' && toString.call(value) === '[object Function]';
    };
  }
  var isFunction;
  __exports__.isFunction = isFunction;
  var isArray = Array.isArray || function(value) {
    return (value && typeof value === 'object') ? toString.call(value) === '[object Array]' : false;
  };
  __exports__.isArray = isArray;

  function escapeExpression(string) {
    // don't escape SafeStrings, since they're already safe
    if (string instanceof SafeString) {
      return string.toString();
    } else if (!string && string !== 0) {
      return "";
    }

    // Force a string conversion as this will be done by the append regardless and
    // the regex test will do this transparently behind the scenes, causing issues if
    // an object's to string has escaped characters in it.
    string = "" + string;

    if(!possible.test(string)) { return string; }
    return string.replace(badChars, escapeChar);
  }

  __exports__.escapeExpression = escapeExpression;function isEmpty(value) {
    if (!value && value !== 0) {
      return true;
    } else if (isArray(value) && value.length === 0) {
      return true;
    } else {
      return false;
    }
  }

  __exports__.isEmpty = isEmpty;
  return __exports__;
})(__module4__);

// handlebars/exception.js
var __module5__ = (function() {
  "use strict";
  var __exports__;

  var errorProps = ['description', 'fileName', 'lineNumber', 'message', 'name', 'number', 'stack'];

  function Exception(message, node) {
    var line;
    if (node && node.firstLine) {
      line = node.firstLine;

      message += ' - ' + line + ':' + node.firstColumn;
    }

    var tmp = Error.prototype.constructor.call(this, message);

    // Unfortunately errors are not enumerable in Chrome (at least), so `for prop in tmp` doesn't work.
    for (var idx = 0; idx < errorProps.length; idx++) {
      this[errorProps[idx]] = tmp[errorProps[idx]];
    }

    if (line) {
      this.lineNumber = line;
      this.column = node.firstColumn;
    }
  }

  Exception.prototype = new Error();

  __exports__ = Exception;
  return __exports__;
})();

// handlebars/base.js
var __module2__ = (function(__dependency1__, __dependency2__) {
  "use strict";
  var __exports__ = {};
  var Utils = __dependency1__;
  var Exception = __dependency2__;

  var VERSION = "1.3.0";
  __exports__.VERSION = VERSION;var COMPILER_REVISION = 4;
  __exports__.COMPILER_REVISION = COMPILER_REVISION;
  var REVISION_CHANGES = {
    1: '<= 1.0.rc.2', // 1.0.rc.2 is actually rev2 but doesn't report it
    2: '== 1.0.0-rc.3',
    3: '== 1.0.0-rc.4',
    4: '>= 1.0.0'
  };
  __exports__.REVISION_CHANGES = REVISION_CHANGES;
  var isArray = Utils.isArray,
      isFunction = Utils.isFunction,
      toString = Utils.toString,
      objectType = '[object Object]';

  function HandlebarsEnvironment(helpers, partials) {
    this.helpers = helpers || {};
    this.partials = partials || {};

    registerDefaultHelpers(this);
  }

  __exports__.HandlebarsEnvironment = HandlebarsEnvironment;HandlebarsEnvironment.prototype = {
    constructor: HandlebarsEnvironment,

    logger: logger,
    log: log,

    registerHelper: function(name, fn, inverse) {
      if (toString.call(name) === objectType) {
        if (inverse || fn) { throw new Exception('Arg not supported with multiple helpers'); }
        Utils.extend(this.helpers, name);
      } else {
        if (inverse) { fn.not = inverse; }
        this.helpers[name] = fn;
      }
    },

    registerPartial: function(name, str) {
      if (toString.call(name) === objectType) {
        Utils.extend(this.partials,  name);
      } else {
        this.partials[name] = str;
      }
    }
  };

  function registerDefaultHelpers(instance) {
    instance.registerHelper('helperMissing', function(arg) {
      if(arguments.length === 2) {
        return undefined;
      } else {
        throw new Exception("Missing helper: '" + arg + "'");
      }
    });

    instance.registerHelper('blockHelperMissing', function(context, options) {
      var inverse = options.inverse || function() {}, fn = options.fn;

      if (isFunction(context)) { context = context.call(this); }

      if(context === true) {
        return fn(this);
      } else if(context === false || context == null) {
        return inverse(this);
      } else if (isArray(context)) {
        if(context.length > 0) {
          return instance.helpers.each(context, options);
        } else {
          return inverse(this);
        }
      } else {
        return fn(context);
      }
    });

    instance.registerHelper('each', function(context, options) {
      var fn = options.fn, inverse = options.inverse;
      var i = 0, ret = "", data;

      if (isFunction(context)) { context = context.call(this); }

      if (options.data) {
        data = createFrame(options.data);
      }

      if(context && typeof context === 'object') {
        if (isArray(context)) {
          for(var j = context.length; i<j; i++) {
            if (data) {
              data.index = i;
              data.first = (i === 0);
              data.last  = (i === (context.length-1));
            }
            ret = ret + fn(context[i], { data: data });
          }
        } else {
          for(var key in context) {
            if(context.hasOwnProperty(key)) {
              if(data) { 
                data.key = key; 
                data.index = i;
                data.first = (i === 0);
              }
              ret = ret + fn(context[key], {data: data});
              i++;
            }
          }
        }
      }

      if(i === 0){
        ret = inverse(this);
      }

      return ret;
    });

    instance.registerHelper('if', function(conditional, options) {
      if (isFunction(conditional)) { conditional = conditional.call(this); }

      // Default behavior is to render the positive path if the value is truthy and not empty.
      // The `includeZero` option may be set to treat the condtional as purely not empty based on the
      // behavior of isEmpty. Effectively this determines if 0 is handled by the positive path or negative.
      if ((!options.hash.includeZero && !conditional) || Utils.isEmpty(conditional)) {
        return options.inverse(this);
      } else {
        return options.fn(this);
      }
    });

    instance.registerHelper('unless', function(conditional, options) {
      return instance.helpers['if'].call(this, conditional, {fn: options.inverse, inverse: options.fn, hash: options.hash});
    });

    instance.registerHelper('with', function(context, options) {
      if (isFunction(context)) { context = context.call(this); }

      if (!Utils.isEmpty(context)) return options.fn(context);
    });

    instance.registerHelper('log', function(context, options) {
      var level = options.data && options.data.level != null ? parseInt(options.data.level, 10) : 1;
      instance.log(level, context);
    });
  }

  var logger = {
    methodMap: { 0: 'debug', 1: 'info', 2: 'warn', 3: 'error' },

    // State enum
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    level: 3,

    // can be overridden in the host environment
    log: function(level, obj) {
      if (logger.level <= level) {
        var method = logger.methodMap[level];
        if (typeof console !== 'undefined' && console[method]) {
          console[method].call(console, obj);
        }
      }
    }
  };
  __exports__.logger = logger;
  function log(level, obj) { logger.log(level, obj); }

  __exports__.log = log;var createFrame = function(object) {
    var obj = {};
    Utils.extend(obj, object);
    return obj;
  };
  __exports__.createFrame = createFrame;
  return __exports__;
})(__module3__, __module5__);

// handlebars/runtime.js
var __module6__ = (function(__dependency1__, __dependency2__, __dependency3__) {
  "use strict";
  var __exports__ = {};
  var Utils = __dependency1__;
  var Exception = __dependency2__;
  var COMPILER_REVISION = __dependency3__.COMPILER_REVISION;
  var REVISION_CHANGES = __dependency3__.REVISION_CHANGES;

  function checkRevision(compilerInfo) {
    var compilerRevision = compilerInfo && compilerInfo[0] || 1,
        currentRevision = COMPILER_REVISION;

    if (compilerRevision !== currentRevision) {
      if (compilerRevision < currentRevision) {
        var runtimeVersions = REVISION_CHANGES[currentRevision],
            compilerVersions = REVISION_CHANGES[compilerRevision];
        throw new Exception("Template was precompiled with an older version of Handlebars than the current runtime. "+
              "Please update your precompiler to a newer version ("+runtimeVersions+") or downgrade your runtime to an older version ("+compilerVersions+").");
      } else {
        // Use the embedded version info since the runtime doesn't know about this revision yet
        throw new Exception("Template was precompiled with a newer version of Handlebars than the current runtime. "+
              "Please update your runtime to a newer version ("+compilerInfo[1]+").");
      }
    }
  }

  __exports__.checkRevision = checkRevision;// TODO: Remove this line and break up compilePartial

  function template(templateSpec, env) {
    if (!env) {
      throw new Exception("No environment passed to template");
    }

    // Note: Using env.VM references rather than local var references throughout this section to allow
    // for external users to override these as psuedo-supported APIs.
    var invokePartialWrapper = function(partial, name, context, helpers, partials, data) {
      var result = env.VM.invokePartial.apply(this, arguments);
      if (result != null) { return result; }

      if (env.compile) {
        var options = { helpers: helpers, partials: partials, data: data };
        partials[name] = env.compile(partial, { data: data !== undefined }, env);
        return partials[name](context, options);
      } else {
        throw new Exception("The partial " + name + " could not be compiled when running in runtime-only mode");
      }
    };

    // Just add water
    var container = {
      escapeExpression: Utils.escapeExpression,
      invokePartial: invokePartialWrapper,
      programs: [],
      program: function(i, fn, data) {
        var programWrapper = this.programs[i];
        if(data) {
          programWrapper = program(i, fn, data);
        } else if (!programWrapper) {
          programWrapper = this.programs[i] = program(i, fn);
        }
        return programWrapper;
      },
      merge: function(param, common) {
        var ret = param || common;

        if (param && common && (param !== common)) {
          ret = {};
          Utils.extend(ret, common);
          Utils.extend(ret, param);
        }
        return ret;
      },
      programWithDepth: env.VM.programWithDepth,
      noop: env.VM.noop,
      compilerInfo: null
    };

    return function(context, options) {
      options = options || {};
      var namespace = options.partial ? options : env,
          helpers,
          partials;

      if (!options.partial) {
        helpers = options.helpers;
        partials = options.partials;
      }
      var result = templateSpec.call(
            container,
            namespace, context,
            helpers,
            partials,
            options.data);

      if (!options.partial) {
        env.VM.checkRevision(container.compilerInfo);
      }

      return result;
    };
  }

  __exports__.template = template;function programWithDepth(i, fn, data /*, $depth */) {
    var args = Array.prototype.slice.call(arguments, 3);

    var prog = function(context, options) {
      options = options || {};

      return fn.apply(this, [context, options.data || data].concat(args));
    };
    prog.program = i;
    prog.depth = args.length;
    return prog;
  }

  __exports__.programWithDepth = programWithDepth;function program(i, fn, data) {
    var prog = function(context, options) {
      options = options || {};

      return fn(context, options.data || data);
    };
    prog.program = i;
    prog.depth = 0;
    return prog;
  }

  __exports__.program = program;function invokePartial(partial, name, context, helpers, partials, data) {
    var options = { partial: true, helpers: helpers, partials: partials, data: data };

    if(partial === undefined) {
      throw new Exception("The partial " + name + " could not be found");
    } else if(partial instanceof Function) {
      return partial(context, options);
    }
  }

  __exports__.invokePartial = invokePartial;function noop() { return ""; }

  __exports__.noop = noop;
  return __exports__;
})(__module3__, __module5__, __module2__);

// handlebars.runtime.js
var __module1__ = (function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__) {
  "use strict";
  var __exports__;
  /*globals Handlebars: true */
  var base = __dependency1__;

  // Each of these augment the Handlebars object. No need to setup here.
  // (This is done to easily share code between commonjs and browse envs)
  var SafeString = __dependency2__;
  var Exception = __dependency3__;
  var Utils = __dependency4__;
  var runtime = __dependency5__;

  // For compatibility and usage outside of module systems, make the Handlebars object a namespace
  var create = function() {
    var hb = new base.HandlebarsEnvironment();

    Utils.extend(hb, base);
    hb.SafeString = SafeString;
    hb.Exception = Exception;
    hb.Utils = Utils;

    hb.VM = runtime;
    hb.template = function(spec) {
      return runtime.template(spec, hb);
    };

    return hb;
  };

  var Handlebars = create();
  Handlebars.create = create;

  __exports__ = Handlebars;
  return __exports__;
})(__module2__, __module4__, __module5__, __module3__, __module6__);

// handlebars/compiler/ast.js
var __module7__ = (function(__dependency1__) {
  "use strict";
  var __exports__;
  var Exception = __dependency1__;

  function LocationInfo(locInfo){
    locInfo = locInfo || {};
    this.firstLine   = locInfo.first_line;
    this.firstColumn = locInfo.first_column;
    this.lastColumn  = locInfo.last_column;
    this.lastLine    = locInfo.last_line;
  }

  var AST = {
    ProgramNode: function(statements, inverseStrip, inverse, locInfo) {
      var inverseLocationInfo, firstInverseNode;
      if (arguments.length === 3) {
        locInfo = inverse;
        inverse = null;
      } else if (arguments.length === 2) {
        locInfo = inverseStrip;
        inverseStrip = null;
      }

      LocationInfo.call(this, locInfo);
      this.type = "program";
      this.statements = statements;
      this.strip = {};

      if(inverse) {
        firstInverseNode = inverse[0];
        if (firstInverseNode) {
          inverseLocationInfo = {
            first_line: firstInverseNode.firstLine,
            last_line: firstInverseNode.lastLine,
            last_column: firstInverseNode.lastColumn,
            first_column: firstInverseNode.firstColumn
          };
          this.inverse = new AST.ProgramNode(inverse, inverseStrip, inverseLocationInfo);
        } else {
          this.inverse = new AST.ProgramNode(inverse, inverseStrip);
        }
        this.strip.right = inverseStrip.left;
      } else if (inverseStrip) {
        this.strip.left = inverseStrip.right;
      }
    },

    MustacheNode: function(rawParams, hash, open, strip, locInfo) {
      LocationInfo.call(this, locInfo);
      this.type = "mustache";
      this.strip = strip;

      // Open may be a string parsed from the parser or a passed boolean flag
      if (open != null && open.charAt) {
        // Must use charAt to support IE pre-10
        var escapeFlag = open.charAt(3) || open.charAt(2);
        this.escaped = escapeFlag !== '{' && escapeFlag !== '&';
      } else {
        this.escaped = !!open;
      }

      if (rawParams instanceof AST.SexprNode) {
        this.sexpr = rawParams;
      } else {
        // Support old AST API
        this.sexpr = new AST.SexprNode(rawParams, hash);
      }

      this.sexpr.isRoot = true;

      // Support old AST API that stored this info in MustacheNode
      this.id = this.sexpr.id;
      this.params = this.sexpr.params;
      this.hash = this.sexpr.hash;
      this.eligibleHelper = this.sexpr.eligibleHelper;
      this.isHelper = this.sexpr.isHelper;
    },

    SexprNode: function(rawParams, hash, locInfo) {
      LocationInfo.call(this, locInfo);

      this.type = "sexpr";
      this.hash = hash;

      var id = this.id = rawParams[0];
      var params = this.params = rawParams.slice(1);

      // a mustache is an eligible helper if:
      // * its id is simple (a single part, not `this` or `..`)
      var eligibleHelper = this.eligibleHelper = id.isSimple;

      // a mustache is definitely a helper if:
      // * it is an eligible helper, and
      // * it has at least one parameter or hash segment
      this.isHelper = eligibleHelper && (params.length || hash);

      // if a mustache is an eligible helper but not a definite
      // helper, it is ambiguous, and will be resolved in a later
      // pass or at runtime.
    },

    PartialNode: function(partialName, context, strip, locInfo) {
      LocationInfo.call(this, locInfo);
      this.type         = "partial";
      this.partialName  = partialName;
      this.context      = context;
      this.strip = strip;
    },

    BlockNode: function(mustache, program, inverse, close, locInfo) {
      LocationInfo.call(this, locInfo);

      if(mustache.sexpr.id.original !== close.path.original) {
        throw new Exception(mustache.sexpr.id.original + " doesn't match " + close.path.original, this);
      }

      this.type = 'block';
      this.mustache = mustache;
      this.program  = program;
      this.inverse  = inverse;

      this.strip = {
        left: mustache.strip.left,
        right: close.strip.right
      };

      (program || inverse).strip.left = mustache.strip.right;
      (inverse || program).strip.right = close.strip.left;

      if (inverse && !program) {
        this.isInverse = true;
      }
    },

    ContentNode: function(string, locInfo) {
      LocationInfo.call(this, locInfo);
      this.type = "content";
      this.string = string;
    },

    HashNode: function(pairs, locInfo) {
      LocationInfo.call(this, locInfo);
      this.type = "hash";
      this.pairs = pairs;
    },

    IdNode: function(parts, locInfo) {
      LocationInfo.call(this, locInfo);
      this.type = "ID";

      var original = "",
          dig = [],
          depth = 0;

      for(var i=0,l=parts.length; i<l; i++) {
        var part = parts[i].part;
        original += (parts[i].separator || '') + part;

        if (part === ".." || part === "." || part === "this") {
          if (dig.length > 0) {
            throw new Exception("Invalid path: " + original, this);
          } else if (part === "..") {
            depth++;
          } else {
            this.isScoped = true;
          }
        } else {
          dig.push(part);
        }
      }

      this.original = original;
      this.parts    = dig;
      this.string   = dig.join('.');
      this.depth    = depth;

      // an ID is simple if it only has one part, and that part is not
      // `..` or `this`.
      this.isSimple = parts.length === 1 && !this.isScoped && depth === 0;

      this.stringModeValue = this.string;
    },

    PartialNameNode: function(name, locInfo) {
      LocationInfo.call(this, locInfo);
      this.type = "PARTIAL_NAME";
      this.name = name.original;
    },

    DataNode: function(id, locInfo) {
      LocationInfo.call(this, locInfo);
      this.type = "DATA";
      this.id = id;
    },

    StringNode: function(string, locInfo) {
      LocationInfo.call(this, locInfo);
      this.type = "STRING";
      this.original =
        this.string =
        this.stringModeValue = string;
    },

    IntegerNode: function(integer, locInfo) {
      LocationInfo.call(this, locInfo);
      this.type = "INTEGER";
      this.original =
        this.integer = integer;
      this.stringModeValue = Number(integer);
    },

    BooleanNode: function(bool, locInfo) {
      LocationInfo.call(this, locInfo);
      this.type = "BOOLEAN";
      this.bool = bool;
      this.stringModeValue = bool === "true";
    },

    CommentNode: function(comment, locInfo) {
      LocationInfo.call(this, locInfo);
      this.type = "comment";
      this.comment = comment;
    }
  };

  // Must be exported as an object rather than the root of the module as the jison lexer
  // most modify the object to operate properly.
  __exports__ = AST;
  return __exports__;
})(__module5__);

// handlebars/compiler/parser.js
var __module9__ = (function() {
  "use strict";
  var __exports__;
  /* jshint ignore:start */
  /* Jison generated parser */
  var handlebars = (function(){
  var parser = {trace: function trace() { },
  yy: {},
  symbols_: {"error":2,"root":3,"statements":4,"EOF":5,"program":6,"simpleInverse":7,"statement":8,"openInverse":9,"closeBlock":10,"openBlock":11,"mustache":12,"partial":13,"CONTENT":14,"COMMENT":15,"OPEN_BLOCK":16,"sexpr":17,"CLOSE":18,"OPEN_INVERSE":19,"OPEN_ENDBLOCK":20,"path":21,"OPEN":22,"OPEN_UNESCAPED":23,"CLOSE_UNESCAPED":24,"OPEN_PARTIAL":25,"partialName":26,"partial_option0":27,"sexpr_repetition0":28,"sexpr_option0":29,"dataName":30,"param":31,"STRING":32,"INTEGER":33,"BOOLEAN":34,"OPEN_SEXPR":35,"CLOSE_SEXPR":36,"hash":37,"hash_repetition_plus0":38,"hashSegment":39,"ID":40,"EQUALS":41,"DATA":42,"pathSegments":43,"SEP":44,"$accept":0,"$end":1},
  terminals_: {2:"error",5:"EOF",14:"CONTENT",15:"COMMENT",16:"OPEN_BLOCK",18:"CLOSE",19:"OPEN_INVERSE",20:"OPEN_ENDBLOCK",22:"OPEN",23:"OPEN_UNESCAPED",24:"CLOSE_UNESCAPED",25:"OPEN_PARTIAL",32:"STRING",33:"INTEGER",34:"BOOLEAN",35:"OPEN_SEXPR",36:"CLOSE_SEXPR",40:"ID",41:"EQUALS",42:"DATA",44:"SEP"},
  productions_: [0,[3,2],[3,1],[6,2],[6,3],[6,2],[6,1],[6,1],[6,0],[4,1],[4,2],[8,3],[8,3],[8,1],[8,1],[8,1],[8,1],[11,3],[9,3],[10,3],[12,3],[12,3],[13,4],[7,2],[17,3],[17,1],[31,1],[31,1],[31,1],[31,1],[31,1],[31,3],[37,1],[39,3],[26,1],[26,1],[26,1],[30,2],[21,1],[43,3],[43,1],[27,0],[27,1],[28,0],[28,2],[29,0],[29,1],[38,1],[38,2]],
  performAction: function anonymous(yytext,yyleng,yylineno,yy,yystate,$$,_$) {

  var $0 = $$.length - 1;
  switch (yystate) {
  case 1: return new yy.ProgramNode($$[$0-1], this._$); 
  break;
  case 2: return new yy.ProgramNode([], this._$); 
  break;
  case 3:this.$ = new yy.ProgramNode([], $$[$0-1], $$[$0], this._$);
  break;
  case 4:this.$ = new yy.ProgramNode($$[$0-2], $$[$0-1], $$[$0], this._$);
  break;
  case 5:this.$ = new yy.ProgramNode($$[$0-1], $$[$0], [], this._$);
  break;
  case 6:this.$ = new yy.ProgramNode($$[$0], this._$);
  break;
  case 7:this.$ = new yy.ProgramNode([], this._$);
  break;
  case 8:this.$ = new yy.ProgramNode([], this._$);
  break;
  case 9:this.$ = [$$[$0]];
  break;
  case 10: $$[$0-1].push($$[$0]); this.$ = $$[$0-1]; 
  break;
  case 11:this.$ = new yy.BlockNode($$[$0-2], $$[$0-1].inverse, $$[$0-1], $$[$0], this._$);
  break;
  case 12:this.$ = new yy.BlockNode($$[$0-2], $$[$0-1], $$[$0-1].inverse, $$[$0], this._$);
  break;
  case 13:this.$ = $$[$0];
  break;
  case 14:this.$ = $$[$0];
  break;
  case 15:this.$ = new yy.ContentNode($$[$0], this._$);
  break;
  case 16:this.$ = new yy.CommentNode($$[$0], this._$);
  break;
  case 17:this.$ = new yy.MustacheNode($$[$0-1], null, $$[$0-2], stripFlags($$[$0-2], $$[$0]), this._$);
  break;
  case 18:this.$ = new yy.MustacheNode($$[$0-1], null, $$[$0-2], stripFlags($$[$0-2], $$[$0]), this._$);
  break;
  case 19:this.$ = {path: $$[$0-1], strip: stripFlags($$[$0-2], $$[$0])};
  break;
  case 20:this.$ = new yy.MustacheNode($$[$0-1], null, $$[$0-2], stripFlags($$[$0-2], $$[$0]), this._$);
  break;
  case 21:this.$ = new yy.MustacheNode($$[$0-1], null, $$[$0-2], stripFlags($$[$0-2], $$[$0]), this._$);
  break;
  case 22:this.$ = new yy.PartialNode($$[$0-2], $$[$0-1], stripFlags($$[$0-3], $$[$0]), this._$);
  break;
  case 23:this.$ = stripFlags($$[$0-1], $$[$0]);
  break;
  case 24:this.$ = new yy.SexprNode([$$[$0-2]].concat($$[$0-1]), $$[$0], this._$);
  break;
  case 25:this.$ = new yy.SexprNode([$$[$0]], null, this._$);
  break;
  case 26:this.$ = $$[$0];
  break;
  case 27:this.$ = new yy.StringNode($$[$0], this._$);
  break;
  case 28:this.$ = new yy.IntegerNode($$[$0], this._$);
  break;
  case 29:this.$ = new yy.BooleanNode($$[$0], this._$);
  break;
  case 30:this.$ = $$[$0];
  break;
  case 31:$$[$0-1].isHelper = true; this.$ = $$[$0-1];
  break;
  case 32:this.$ = new yy.HashNode($$[$0], this._$);
  break;
  case 33:this.$ = [$$[$0-2], $$[$0]];
  break;
  case 34:this.$ = new yy.PartialNameNode($$[$0], this._$);
  break;
  case 35:this.$ = new yy.PartialNameNode(new yy.StringNode($$[$0], this._$), this._$);
  break;
  case 36:this.$ = new yy.PartialNameNode(new yy.IntegerNode($$[$0], this._$));
  break;
  case 37:this.$ = new yy.DataNode($$[$0], this._$);
  break;
  case 38:this.$ = new yy.IdNode($$[$0], this._$);
  break;
  case 39: $$[$0-2].push({part: $$[$0], separator: $$[$0-1]}); this.$ = $$[$0-2]; 
  break;
  case 40:this.$ = [{part: $$[$0]}];
  break;
  case 43:this.$ = [];
  break;
  case 44:$$[$0-1].push($$[$0]);
  break;
  case 47:this.$ = [$$[$0]];
  break;
  case 48:$$[$0-1].push($$[$0]);
  break;
  }
  },
  table: [{3:1,4:2,5:[1,3],8:4,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,11],22:[1,13],23:[1,14],25:[1,15]},{1:[3]},{5:[1,16],8:17,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,11],22:[1,13],23:[1,14],25:[1,15]},{1:[2,2]},{5:[2,9],14:[2,9],15:[2,9],16:[2,9],19:[2,9],20:[2,9],22:[2,9],23:[2,9],25:[2,9]},{4:20,6:18,7:19,8:4,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,21],20:[2,8],22:[1,13],23:[1,14],25:[1,15]},{4:20,6:22,7:19,8:4,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,21],20:[2,8],22:[1,13],23:[1,14],25:[1,15]},{5:[2,13],14:[2,13],15:[2,13],16:[2,13],19:[2,13],20:[2,13],22:[2,13],23:[2,13],25:[2,13]},{5:[2,14],14:[2,14],15:[2,14],16:[2,14],19:[2,14],20:[2,14],22:[2,14],23:[2,14],25:[2,14]},{5:[2,15],14:[2,15],15:[2,15],16:[2,15],19:[2,15],20:[2,15],22:[2,15],23:[2,15],25:[2,15]},{5:[2,16],14:[2,16],15:[2,16],16:[2,16],19:[2,16],20:[2,16],22:[2,16],23:[2,16],25:[2,16]},{17:23,21:24,30:25,40:[1,28],42:[1,27],43:26},{17:29,21:24,30:25,40:[1,28],42:[1,27],43:26},{17:30,21:24,30:25,40:[1,28],42:[1,27],43:26},{17:31,21:24,30:25,40:[1,28],42:[1,27],43:26},{21:33,26:32,32:[1,34],33:[1,35],40:[1,28],43:26},{1:[2,1]},{5:[2,10],14:[2,10],15:[2,10],16:[2,10],19:[2,10],20:[2,10],22:[2,10],23:[2,10],25:[2,10]},{10:36,20:[1,37]},{4:38,8:4,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,11],20:[2,7],22:[1,13],23:[1,14],25:[1,15]},{7:39,8:17,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,21],20:[2,6],22:[1,13],23:[1,14],25:[1,15]},{17:23,18:[1,40],21:24,30:25,40:[1,28],42:[1,27],43:26},{10:41,20:[1,37]},{18:[1,42]},{18:[2,43],24:[2,43],28:43,32:[2,43],33:[2,43],34:[2,43],35:[2,43],36:[2,43],40:[2,43],42:[2,43]},{18:[2,25],24:[2,25],36:[2,25]},{18:[2,38],24:[2,38],32:[2,38],33:[2,38],34:[2,38],35:[2,38],36:[2,38],40:[2,38],42:[2,38],44:[1,44]},{21:45,40:[1,28],43:26},{18:[2,40],24:[2,40],32:[2,40],33:[2,40],34:[2,40],35:[2,40],36:[2,40],40:[2,40],42:[2,40],44:[2,40]},{18:[1,46]},{18:[1,47]},{24:[1,48]},{18:[2,41],21:50,27:49,40:[1,28],43:26},{18:[2,34],40:[2,34]},{18:[2,35],40:[2,35]},{18:[2,36],40:[2,36]},{5:[2,11],14:[2,11],15:[2,11],16:[2,11],19:[2,11],20:[2,11],22:[2,11],23:[2,11],25:[2,11]},{21:51,40:[1,28],43:26},{8:17,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,11],20:[2,3],22:[1,13],23:[1,14],25:[1,15]},{4:52,8:4,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,11],20:[2,5],22:[1,13],23:[1,14],25:[1,15]},{14:[2,23],15:[2,23],16:[2,23],19:[2,23],20:[2,23],22:[2,23],23:[2,23],25:[2,23]},{5:[2,12],14:[2,12],15:[2,12],16:[2,12],19:[2,12],20:[2,12],22:[2,12],23:[2,12],25:[2,12]},{14:[2,18],15:[2,18],16:[2,18],19:[2,18],20:[2,18],22:[2,18],23:[2,18],25:[2,18]},{18:[2,45],21:56,24:[2,45],29:53,30:60,31:54,32:[1,57],33:[1,58],34:[1,59],35:[1,61],36:[2,45],37:55,38:62,39:63,40:[1,64],42:[1,27],43:26},{40:[1,65]},{18:[2,37],24:[2,37],32:[2,37],33:[2,37],34:[2,37],35:[2,37],36:[2,37],40:[2,37],42:[2,37]},{14:[2,17],15:[2,17],16:[2,17],19:[2,17],20:[2,17],22:[2,17],23:[2,17],25:[2,17]},{5:[2,20],14:[2,20],15:[2,20],16:[2,20],19:[2,20],20:[2,20],22:[2,20],23:[2,20],25:[2,20]},{5:[2,21],14:[2,21],15:[2,21],16:[2,21],19:[2,21],20:[2,21],22:[2,21],23:[2,21],25:[2,21]},{18:[1,66]},{18:[2,42]},{18:[1,67]},{8:17,9:5,11:6,12:7,13:8,14:[1,9],15:[1,10],16:[1,12],19:[1,11],20:[2,4],22:[1,13],23:[1,14],25:[1,15]},{18:[2,24],24:[2,24],36:[2,24]},{18:[2,44],24:[2,44],32:[2,44],33:[2,44],34:[2,44],35:[2,44],36:[2,44],40:[2,44],42:[2,44]},{18:[2,46],24:[2,46],36:[2,46]},{18:[2,26],24:[2,26],32:[2,26],33:[2,26],34:[2,26],35:[2,26],36:[2,26],40:[2,26],42:[2,26]},{18:[2,27],24:[2,27],32:[2,27],33:[2,27],34:[2,27],35:[2,27],36:[2,27],40:[2,27],42:[2,27]},{18:[2,28],24:[2,28],32:[2,28],33:[2,28],34:[2,28],35:[2,28],36:[2,28],40:[2,28],42:[2,28]},{18:[2,29],24:[2,29],32:[2,29],33:[2,29],34:[2,29],35:[2,29],36:[2,29],40:[2,29],42:[2,29]},{18:[2,30],24:[2,30],32:[2,30],33:[2,30],34:[2,30],35:[2,30],36:[2,30],40:[2,30],42:[2,30]},{17:68,21:24,30:25,40:[1,28],42:[1,27],43:26},{18:[2,32],24:[2,32],36:[2,32],39:69,40:[1,70]},{18:[2,47],24:[2,47],36:[2,47],40:[2,47]},{18:[2,40],24:[2,40],32:[2,40],33:[2,40],34:[2,40],35:[2,40],36:[2,40],40:[2,40],41:[1,71],42:[2,40],44:[2,40]},{18:[2,39],24:[2,39],32:[2,39],33:[2,39],34:[2,39],35:[2,39],36:[2,39],40:[2,39],42:[2,39],44:[2,39]},{5:[2,22],14:[2,22],15:[2,22],16:[2,22],19:[2,22],20:[2,22],22:[2,22],23:[2,22],25:[2,22]},{5:[2,19],14:[2,19],15:[2,19],16:[2,19],19:[2,19],20:[2,19],22:[2,19],23:[2,19],25:[2,19]},{36:[1,72]},{18:[2,48],24:[2,48],36:[2,48],40:[2,48]},{41:[1,71]},{21:56,30:60,31:73,32:[1,57],33:[1,58],34:[1,59],35:[1,61],40:[1,28],42:[1,27],43:26},{18:[2,31],24:[2,31],32:[2,31],33:[2,31],34:[2,31],35:[2,31],36:[2,31],40:[2,31],42:[2,31]},{18:[2,33],24:[2,33],36:[2,33],40:[2,33]}],
  defaultActions: {3:[2,2],16:[2,1],50:[2,42]},
  parseError: function parseError(str, hash) {
      throw new Error(str);
  },
  parse: function parse(input) {
      var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = "", yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
      this.lexer.setInput(input);
      this.lexer.yy = this.yy;
      this.yy.lexer = this.lexer;
      this.yy.parser = this;
      if (typeof this.lexer.yylloc == "undefined")
          this.lexer.yylloc = {};
      var yyloc = this.lexer.yylloc;
      lstack.push(yyloc);
      var ranges = this.lexer.options && this.lexer.options.ranges;
      if (typeof this.yy.parseError === "function")
          this.parseError = this.yy.parseError;
      function popStack(n) {
          stack.length = stack.length - 2 * n;
          vstack.length = vstack.length - n;
          lstack.length = lstack.length - n;
      }
      function lex() {
          var token;
          token = self.lexer.lex() || 1;
          if (typeof token !== "number") {
              token = self.symbols_[token] || token;
          }
          return token;
      }
      var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
      while (true) {
          state = stack[stack.length - 1];
          if (this.defaultActions[state]) {
              action = this.defaultActions[state];
          } else {
              if (symbol === null || typeof symbol == "undefined") {
                  symbol = lex();
              }
              action = table[state] && table[state][symbol];
          }
          if (typeof action === "undefined" || !action.length || !action[0]) {
              var errStr = "";
              if (!recovering) {
                  expected = [];
                  for (p in table[state])
                      if (this.terminals_[p] && p > 2) {
                          expected.push("'" + this.terminals_[p] + "'");
                      }
                  if (this.lexer.showPosition) {
                      errStr = "Parse error on line " + (yylineno + 1) + ":\n" + this.lexer.showPosition() + "\nExpecting " + expected.join(", ") + ", got '" + (this.terminals_[symbol] || symbol) + "'";
                  } else {
                      errStr = "Parse error on line " + (yylineno + 1) + ": Unexpected " + (symbol == 1?"end of input":"'" + (this.terminals_[symbol] || symbol) + "'");
                  }
                  this.parseError(errStr, {text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected});
              }
          }
          if (action[0] instanceof Array && action.length > 1) {
              throw new Error("Parse Error: multiple actions possible at state: " + state + ", token: " + symbol);
          }
          switch (action[0]) {
          case 1:
              stack.push(symbol);
              vstack.push(this.lexer.yytext);
              lstack.push(this.lexer.yylloc);
              stack.push(action[1]);
              symbol = null;
              if (!preErrorSymbol) {
                  yyleng = this.lexer.yyleng;
                  yytext = this.lexer.yytext;
                  yylineno = this.lexer.yylineno;
                  yyloc = this.lexer.yylloc;
                  if (recovering > 0)
                      recovering--;
              } else {
                  symbol = preErrorSymbol;
                  preErrorSymbol = null;
              }
              break;
          case 2:
              len = this.productions_[action[1]][1];
              yyval.$ = vstack[vstack.length - len];
              yyval._$ = {first_line: lstack[lstack.length - (len || 1)].first_line, last_line: lstack[lstack.length - 1].last_line, first_column: lstack[lstack.length - (len || 1)].first_column, last_column: lstack[lstack.length - 1].last_column};
              if (ranges) {
                  yyval._$.range = [lstack[lstack.length - (len || 1)].range[0], lstack[lstack.length - 1].range[1]];
              }
              r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);
              if (typeof r !== "undefined") {
                  return r;
              }
              if (len) {
                  stack = stack.slice(0, -1 * len * 2);
                  vstack = vstack.slice(0, -1 * len);
                  lstack = lstack.slice(0, -1 * len);
              }
              stack.push(this.productions_[action[1]][0]);
              vstack.push(yyval.$);
              lstack.push(yyval._$);
              newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
              stack.push(newState);
              break;
          case 3:
              return true;
          }
      }
      return true;
  }
  };


  function stripFlags(open, close) {
    return {
      left: open.charAt(2) === '~',
      right: close.charAt(0) === '~' || close.charAt(1) === '~'
    };
  }

  /* Jison generated lexer */
  var lexer = (function(){
  var lexer = ({EOF:1,
  parseError:function parseError(str, hash) {
          if (this.yy.parser) {
              this.yy.parser.parseError(str, hash);
          } else {
              throw new Error(str);
          }
      },
  setInput:function (input) {
          this._input = input;
          this._more = this._less = this.done = false;
          this.yylineno = this.yyleng = 0;
          this.yytext = this.matched = this.match = '';
          this.conditionStack = ['INITIAL'];
          this.yylloc = {first_line:1,first_column:0,last_line:1,last_column:0};
          if (this.options.ranges) this.yylloc.range = [0,0];
          this.offset = 0;
          return this;
      },
  input:function () {
          var ch = this._input[0];
          this.yytext += ch;
          this.yyleng++;
          this.offset++;
          this.match += ch;
          this.matched += ch;
          var lines = ch.match(/(?:\r\n?|\n).*/g);
          if (lines) {
              this.yylineno++;
              this.yylloc.last_line++;
          } else {
              this.yylloc.last_column++;
          }
          if (this.options.ranges) this.yylloc.range[1]++;

          this._input = this._input.slice(1);
          return ch;
      },
  unput:function (ch) {
          var len = ch.length;
          var lines = ch.split(/(?:\r\n?|\n)/g);

          this._input = ch + this._input;
          this.yytext = this.yytext.substr(0, this.yytext.length-len-1);
          //this.yyleng -= len;
          this.offset -= len;
          var oldLines = this.match.split(/(?:\r\n?|\n)/g);
          this.match = this.match.substr(0, this.match.length-1);
          this.matched = this.matched.substr(0, this.matched.length-1);

          if (lines.length-1) this.yylineno -= lines.length-1;
          var r = this.yylloc.range;

          this.yylloc = {first_line: this.yylloc.first_line,
            last_line: this.yylineno+1,
            first_column: this.yylloc.first_column,
            last_column: lines ?
                (lines.length === oldLines.length ? this.yylloc.first_column : 0) + oldLines[oldLines.length - lines.length].length - lines[0].length:
                this.yylloc.first_column - len
            };

          if (this.options.ranges) {
              this.yylloc.range = [r[0], r[0] + this.yyleng - len];
          }
          return this;
      },
  more:function () {
          this._more = true;
          return this;
      },
  less:function (n) {
          this.unput(this.match.slice(n));
      },
  pastInput:function () {
          var past = this.matched.substr(0, this.matched.length - this.match.length);
          return (past.length > 20 ? '...':'') + past.substr(-20).replace(/\n/g, "");
      },
  upcomingInput:function () {
          var next = this.match;
          if (next.length < 20) {
              next += this._input.substr(0, 20-next.length);
          }
          return (next.substr(0,20)+(next.length > 20 ? '...':'')).replace(/\n/g, "");
      },
  showPosition:function () {
          var pre = this.pastInput();
          var c = new Array(pre.length + 1).join("-");
          return pre + this.upcomingInput() + "\n" + c+"^";
      },
  next:function () {
          if (this.done) {
              return this.EOF;
          }
          if (!this._input) this.done = true;

          var token,
              match,
              tempMatch,
              index,
              col,
              lines;
          if (!this._more) {
              this.yytext = '';
              this.match = '';
          }
          var rules = this._currentRules();
          for (var i=0;i < rules.length; i++) {
              tempMatch = this._input.match(this.rules[rules[i]]);
              if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                  match = tempMatch;
                  index = i;
                  if (!this.options.flex) break;
              }
          }
          if (match) {
              lines = match[0].match(/(?:\r\n?|\n).*/g);
              if (lines) this.yylineno += lines.length;
              this.yylloc = {first_line: this.yylloc.last_line,
                             last_line: this.yylineno+1,
                             first_column: this.yylloc.last_column,
                             last_column: lines ? lines[lines.length-1].length-lines[lines.length-1].match(/\r?\n?/)[0].length : this.yylloc.last_column + match[0].length};
              this.yytext += match[0];
              this.match += match[0];
              this.matches = match;
              this.yyleng = this.yytext.length;
              if (this.options.ranges) {
                  this.yylloc.range = [this.offset, this.offset += this.yyleng];
              }
              this._more = false;
              this._input = this._input.slice(match[0].length);
              this.matched += match[0];
              token = this.performAction.call(this, this.yy, this, rules[index],this.conditionStack[this.conditionStack.length-1]);
              if (this.done && this._input) this.done = false;
              if (token) return token;
              else return;
          }
          if (this._input === "") {
              return this.EOF;
          } else {
              return this.parseError('Lexical error on line '+(this.yylineno+1)+'. Unrecognized text.\n'+this.showPosition(),
                      {text: "", token: null, line: this.yylineno});
          }
      },
  lex:function lex() {
          var r = this.next();
          if (typeof r !== 'undefined') {
              return r;
          } else {
              return this.lex();
          }
      },
  begin:function begin(condition) {
          this.conditionStack.push(condition);
      },
  popState:function popState() {
          return this.conditionStack.pop();
      },
  _currentRules:function _currentRules() {
          return this.conditions[this.conditionStack[this.conditionStack.length-1]].rules;
      },
  topState:function () {
          return this.conditionStack[this.conditionStack.length-2];
      },
  pushState:function begin(condition) {
          this.begin(condition);
      }});
  lexer.options = {};
  lexer.performAction = function anonymous(yy,yy_,$avoiding_name_collisions,YY_START) {


  function strip(start, end) {
    return yy_.yytext = yy_.yytext.substr(start, yy_.yyleng-end);
  }


  var YYSTATE=YY_START
  switch($avoiding_name_collisions) {
  case 0:
                                     if(yy_.yytext.slice(-2) === "\\\\") {
                                       strip(0,1);
                                       this.begin("mu");
                                     } else if(yy_.yytext.slice(-1) === "\\") {
                                       strip(0,1);
                                       this.begin("emu");
                                     } else {
                                       this.begin("mu");
                                     }
                                     if(yy_.yytext) return 14;
                                   
  break;
  case 1:return 14;
  break;
  case 2:
                                     this.popState();
                                     return 14;
                                   
  break;
  case 3:strip(0,4); this.popState(); return 15;
  break;
  case 4:return 35;
  break;
  case 5:return 36;
  break;
  case 6:return 25;
  break;
  case 7:return 16;
  break;
  case 8:return 20;
  break;
  case 9:return 19;
  break;
  case 10:return 19;
  break;
  case 11:return 23;
  break;
  case 12:return 22;
  break;
  case 13:this.popState(); this.begin('com');
  break;
  case 14:strip(3,5); this.popState(); return 15;
  break;
  case 15:return 22;
  break;
  case 16:return 41;
  break;
  case 17:return 40;
  break;
  case 18:return 40;
  break;
  case 19:return 44;
  break;
  case 20:// ignore whitespace
  break;
  case 21:this.popState(); return 24;
  break;
  case 22:this.popState(); return 18;
  break;
  case 23:yy_.yytext = strip(1,2).replace(/\\"/g,'"'); return 32;
  break;
  case 24:yy_.yytext = strip(1,2).replace(/\\'/g,"'"); return 32;
  break;
  case 25:return 42;
  break;
  case 26:return 34;
  break;
  case 27:return 34;
  break;
  case 28:return 33;
  break;
  case 29:return 40;
  break;
  case 30:yy_.yytext = strip(1,2); return 40;
  break;
  case 31:return 'INVALID';
  break;
  case 32:return 5;
  break;
  }
  };
  lexer.rules = [/^(?:[^\x00]*?(?=(\{\{)))/,/^(?:[^\x00]+)/,/^(?:[^\x00]{2,}?(?=(\{\{|\\\{\{|\\\\\{\{|$)))/,/^(?:[\s\S]*?--\}\})/,/^(?:\()/,/^(?:\))/,/^(?:\{\{(~)?>)/,/^(?:\{\{(~)?#)/,/^(?:\{\{(~)?\/)/,/^(?:\{\{(~)?\^)/,/^(?:\{\{(~)?\s*else\b)/,/^(?:\{\{(~)?\{)/,/^(?:\{\{(~)?&)/,/^(?:\{\{!--)/,/^(?:\{\{![\s\S]*?\}\})/,/^(?:\{\{(~)?)/,/^(?:=)/,/^(?:\.\.)/,/^(?:\.(?=([=~}\s\/.)])))/,/^(?:[\/.])/,/^(?:\s+)/,/^(?:\}(~)?\}\})/,/^(?:(~)?\}\})/,/^(?:"(\\["]|[^"])*")/,/^(?:'(\\[']|[^'])*')/,/^(?:@)/,/^(?:true(?=([~}\s)])))/,/^(?:false(?=([~}\s)])))/,/^(?:-?[0-9]+(?=([~}\s)])))/,/^(?:([^\s!"#%-,\.\/;->@\[-\^`\{-~]+(?=([=~}\s\/.)]))))/,/^(?:\[[^\]]*\])/,/^(?:.)/,/^(?:$)/];
  lexer.conditions = {"mu":{"rules":[4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32],"inclusive":false},"emu":{"rules":[2],"inclusive":false},"com":{"rules":[3],"inclusive":false},"INITIAL":{"rules":[0,1,32],"inclusive":true}};
  return lexer;})()
  parser.lexer = lexer;
  function Parser () { this.yy = {}; }Parser.prototype = parser;parser.Parser = Parser;
  return new Parser;
  })();__exports__ = handlebars;
  /* jshint ignore:end */
  return __exports__;
})();

// handlebars/compiler/base.js
var __module8__ = (function(__dependency1__, __dependency2__) {
  "use strict";
  var __exports__ = {};
  var parser = __dependency1__;
  var AST = __dependency2__;

  __exports__.parser = parser;

  function parse(input) {
    // Just return if an already-compile AST was passed in.
    if(input.constructor === AST.ProgramNode) { return input; }

    parser.yy = AST;
    return parser.parse(input);
  }

  __exports__.parse = parse;
  return __exports__;
})(__module9__, __module7__);

// handlebars/compiler/compiler.js
var __module10__ = (function(__dependency1__) {
  "use strict";
  var __exports__ = {};
  var Exception = __dependency1__;

  function Compiler() {}

  __exports__.Compiler = Compiler;// the foundHelper register will disambiguate helper lookup from finding a
  // function in a context. This is necessary for mustache compatibility, which
  // requires that context functions in blocks are evaluated by blockHelperMissing,
  // and then proceed as if the resulting value was provided to blockHelperMissing.

  Compiler.prototype = {
    compiler: Compiler,

    disassemble: function() {
      var opcodes = this.opcodes, opcode, out = [], params, param;

      for (var i=0, l=opcodes.length; i<l; i++) {
        opcode = opcodes[i];

        if (opcode.opcode === 'DECLARE') {
          out.push("DECLARE " + opcode.name + "=" + opcode.value);
        } else {
          params = [];
          for (var j=0; j<opcode.args.length; j++) {
            param = opcode.args[j];
            if (typeof param === "string") {
              param = "\"" + param.replace("\n", "\\n") + "\"";
            }
            params.push(param);
          }
          out.push(opcode.opcode + " " + params.join(" "));
        }
      }

      return out.join("\n");
    },

    equals: function(other) {
      var len = this.opcodes.length;
      if (other.opcodes.length !== len) {
        return false;
      }

      for (var i = 0; i < len; i++) {
        var opcode = this.opcodes[i],
            otherOpcode = other.opcodes[i];
        if (opcode.opcode !== otherOpcode.opcode || opcode.args.length !== otherOpcode.args.length) {
          return false;
        }
        for (var j = 0; j < opcode.args.length; j++) {
          if (opcode.args[j] !== otherOpcode.args[j]) {
            return false;
          }
        }
      }

      len = this.children.length;
      if (other.children.length !== len) {
        return false;
      }
      for (i = 0; i < len; i++) {
        if (!this.children[i].equals(other.children[i])) {
          return false;
        }
      }

      return true;
    },

    guid: 0,

    compile: function(program, options) {
      this.opcodes = [];
      this.children = [];
      this.depths = {list: []};
      this.options = options;

      // These changes will propagate to the other compiler components
      var knownHelpers = this.options.knownHelpers;
      this.options.knownHelpers = {
        'helperMissing': true,
        'blockHelperMissing': true,
        'each': true,
        'if': true,
        'unless': true,
        'with': true,
        'log': true
      };
      if (knownHelpers) {
        for (var name in knownHelpers) {
          this.options.knownHelpers[name] = knownHelpers[name];
        }
      }

      return this.accept(program);
    },

    accept: function(node) {
      var strip = node.strip || {},
          ret;
      if (strip.left) {
        this.opcode('strip');
      }

      ret = this[node.type](node);

      if (strip.right) {
        this.opcode('strip');
      }

      return ret;
    },

    program: function(program) {
      var statements = program.statements;

      for(var i=0, l=statements.length; i<l; i++) {
        this.accept(statements[i]);
      }
      this.isSimple = l === 1;

      this.depths.list = this.depths.list.sort(function(a, b) {
        return a - b;
      });

      return this;
    },

    compileProgram: function(program) {
      var result = new this.compiler().compile(program, this.options);
      var guid = this.guid++, depth;

      this.usePartial = this.usePartial || result.usePartial;

      this.children[guid] = result;

      for(var i=0, l=result.depths.list.length; i<l; i++) {
        depth = result.depths.list[i];

        if(depth < 2) { continue; }
        else { this.addDepth(depth - 1); }
      }

      return guid;
    },

    block: function(block) {
      var mustache = block.mustache,
          program = block.program,
          inverse = block.inverse;

      if (program) {
        program = this.compileProgram(program);
      }

      if (inverse) {
        inverse = this.compileProgram(inverse);
      }

      var sexpr = mustache.sexpr;
      var type = this.classifySexpr(sexpr);

      if (type === "helper") {
        this.helperSexpr(sexpr, program, inverse);
      } else if (type === "simple") {
        this.simpleSexpr(sexpr);

        // now that the simple mustache is resolved, we need to
        // evaluate it by executing `blockHelperMissing`
        this.opcode('pushProgram', program);
        this.opcode('pushProgram', inverse);
        this.opcode('emptyHash');
        this.opcode('blockValue');
      } else {
        this.ambiguousSexpr(sexpr, program, inverse);

        // now that the simple mustache is resolved, we need to
        // evaluate it by executing `blockHelperMissing`
        this.opcode('pushProgram', program);
        this.opcode('pushProgram', inverse);
        this.opcode('emptyHash');
        this.opcode('ambiguousBlockValue');
      }

      this.opcode('append');
    },

    hash: function(hash) {
      var pairs = hash.pairs, pair, val;

      this.opcode('pushHash');

      for(var i=0, l=pairs.length; i<l; i++) {
        pair = pairs[i];
        val  = pair[1];

        if (this.options.stringParams) {
          if(val.depth) {
            this.addDepth(val.depth);
          }
          this.opcode('getContext', val.depth || 0);
          this.opcode('pushStringParam', val.stringModeValue, val.type);

          if (val.type === 'sexpr') {
            // Subexpressions get evaluated and passed in
            // in string params mode.
            this.sexpr(val);
          }
        } else {
          this.accept(val);
        }

        this.opcode('assignToHash', pair[0]);
      }
      this.opcode('popHash');
    },

    partial: function(partial) {
      var partialName = partial.partialName;
      this.usePartial = true;

      if(partial.context) {
        this.ID(partial.context);
      } else {
        this.opcode('push', 'depth0');
      }

      this.opcode('invokePartial', partialName.name);
      this.opcode('append');
    },

    content: function(content) {
      this.opcode('appendContent', content.string);
    },

    mustache: function(mustache) {
      this.sexpr(mustache.sexpr);

      if(mustache.escaped && !this.options.noEscape) {
        this.opcode('appendEscaped');
      } else {
        this.opcode('append');
      }
    },

    ambiguousSexpr: function(sexpr, program, inverse) {
      var id = sexpr.id,
          name = id.parts[0],
          isBlock = program != null || inverse != null;

      this.opcode('getContext', id.depth);

      this.opcode('pushProgram', program);
      this.opcode('pushProgram', inverse);

      this.opcode('invokeAmbiguous', name, isBlock);
    },

    simpleSexpr: function(sexpr) {
      var id = sexpr.id;

      if (id.type === 'DATA') {
        this.DATA(id);
      } else if (id.parts.length) {
        this.ID(id);
      } else {
        // Simplified ID for `this`
        this.addDepth(id.depth);
        this.opcode('getContext', id.depth);
        this.opcode('pushContext');
      }

      this.opcode('resolvePossibleLambda');
    },

    helperSexpr: function(sexpr, program, inverse) {
      var params = this.setupFullMustacheParams(sexpr, program, inverse),
          name = sexpr.id.parts[0];

      if (this.options.knownHelpers[name]) {
        this.opcode('invokeKnownHelper', params.length, name);
      } else if (this.options.knownHelpersOnly) {
        throw new Exception("You specified knownHelpersOnly, but used the unknown helper " + name, sexpr);
      } else {
        this.opcode('invokeHelper', params.length, name, sexpr.isRoot);
      }
    },

    sexpr: function(sexpr) {
      var type = this.classifySexpr(sexpr);

      if (type === "simple") {
        this.simpleSexpr(sexpr);
      } else if (type === "helper") {
        this.helperSexpr(sexpr);
      } else {
        this.ambiguousSexpr(sexpr);
      }
    },

    ID: function(id) {
      this.addDepth(id.depth);
      this.opcode('getContext', id.depth);

      var name = id.parts[0];
      if (!name) {
        this.opcode('pushContext');
      } else {
        this.opcode('lookupOnContext', id.parts[0]);
      }

      for(var i=1, l=id.parts.length; i<l; i++) {
        this.opcode('lookup', id.parts[i]);
      }
    },

    DATA: function(data) {
      this.options.data = true;
      if (data.id.isScoped || data.id.depth) {
        throw new Exception('Scoped data references are not supported: ' + data.original, data);
      }

      this.opcode('lookupData');
      var parts = data.id.parts;
      for(var i=0, l=parts.length; i<l; i++) {
        this.opcode('lookup', parts[i]);
      }
    },

    STRING: function(string) {
      this.opcode('pushString', string.string);
    },

    INTEGER: function(integer) {
      this.opcode('pushLiteral', integer.integer);
    },

    BOOLEAN: function(bool) {
      this.opcode('pushLiteral', bool.bool);
    },

    comment: function() {},

    // HELPERS
    opcode: function(name) {
      this.opcodes.push({ opcode: name, args: [].slice.call(arguments, 1) });
    },

    declare: function(name, value) {
      this.opcodes.push({ opcode: 'DECLARE', name: name, value: value });
    },

    addDepth: function(depth) {
      if(depth === 0) { return; }

      if(!this.depths[depth]) {
        this.depths[depth] = true;
        this.depths.list.push(depth);
      }
    },

    classifySexpr: function(sexpr) {
      var isHelper   = sexpr.isHelper;
      var isEligible = sexpr.eligibleHelper;
      var options    = this.options;

      // if ambiguous, we can possibly resolve the ambiguity now
      if (isEligible && !isHelper) {
        var name = sexpr.id.parts[0];

        if (options.knownHelpers[name]) {
          isHelper = true;
        } else if (options.knownHelpersOnly) {
          isEligible = false;
        }
      }

      if (isHelper) { return "helper"; }
      else if (isEligible) { return "ambiguous"; }
      else { return "simple"; }
    },

    pushParams: function(params) {
      var i = params.length, param;

      while(i--) {
        param = params[i];

        if(this.options.stringParams) {
          if(param.depth) {
            this.addDepth(param.depth);
          }

          this.opcode('getContext', param.depth || 0);
          this.opcode('pushStringParam', param.stringModeValue, param.type);

          if (param.type === 'sexpr') {
            // Subexpressions get evaluated and passed in
            // in string params mode.
            this.sexpr(param);
          }
        } else {
          this[param.type](param);
        }
      }
    },

    setupFullMustacheParams: function(sexpr, program, inverse) {
      var params = sexpr.params;
      this.pushParams(params);

      this.opcode('pushProgram', program);
      this.opcode('pushProgram', inverse);

      if (sexpr.hash) {
        this.hash(sexpr.hash);
      } else {
        this.opcode('emptyHash');
      }

      return params;
    }
  };

  function precompile(input, options, env) {
    if (input == null || (typeof input !== 'string' && input.constructor !== env.AST.ProgramNode)) {
      throw new Exception("You must pass a string or Handlebars AST to Handlebars.precompile. You passed " + input);
    }

    options = options || {};
    if (!('data' in options)) {
      options.data = true;
    }

    var ast = env.parse(input);
    var environment = new env.Compiler().compile(ast, options);
    return new env.JavaScriptCompiler().compile(environment, options);
  }

  __exports__.precompile = precompile;function compile(input, options, env) {
    if (input == null || (typeof input !== 'string' && input.constructor !== env.AST.ProgramNode)) {
      throw new Exception("You must pass a string or Handlebars AST to Handlebars.compile. You passed " + input);
    }

    options = options || {};

    if (!('data' in options)) {
      options.data = true;
    }

    var compiled;

    function compileInput() {
      var ast = env.parse(input);
      var environment = new env.Compiler().compile(ast, options);
      var templateSpec = new env.JavaScriptCompiler().compile(environment, options, undefined, true);
      return env.template(templateSpec);
    }

    // Template is only compiled on first use and cached after that point.
    return function(context, options) {
      if (!compiled) {
        compiled = compileInput();
      }
      return compiled.call(this, context, options);
    };
  }

  __exports__.compile = compile;
  return __exports__;
})(__module5__);

// handlebars/compiler/javascript-compiler.js
var __module11__ = (function(__dependency1__, __dependency2__) {
  "use strict";
  var __exports__;
  var COMPILER_REVISION = __dependency1__.COMPILER_REVISION;
  var REVISION_CHANGES = __dependency1__.REVISION_CHANGES;
  var log = __dependency1__.log;
  var Exception = __dependency2__;

  function Literal(value) {
    this.value = value;
  }

  function JavaScriptCompiler() {}

  JavaScriptCompiler.prototype = {
    // PUBLIC API: You can override these methods in a subclass to provide
    // alternative compiled forms for name lookup and buffering semantics
    nameLookup: function(parent, name /* , type*/) {
      var wrap,
          ret;
      if (parent.indexOf('depth') === 0) {
        wrap = true;
      }

      if (/^[0-9]+$/.test(name)) {
        ret = parent + "[" + name + "]";
      } else if (JavaScriptCompiler.isValidJavaScriptVariableName(name)) {
        ret = parent + "." + name;
      }
      else {
        ret = parent + "['" + name + "']";
      }

      if (wrap) {
        return '(' + parent + ' && ' + ret + ')';
      } else {
        return ret;
      }
    },

    compilerInfo: function() {
      var revision = COMPILER_REVISION,
          versions = REVISION_CHANGES[revision];
      return "this.compilerInfo = ["+revision+",'"+versions+"'];\n";
    },

    appendToBuffer: function(string) {
      if (this.environment.isSimple) {
        return "return " + string + ";";
      } else {
        return {
          appendToBuffer: true,
          content: string,
          toString: function() { return "buffer += " + string + ";"; }
        };
      }
    },

    initializeBuffer: function() {
      return this.quotedString("");
    },

    namespace: "Handlebars",
    // END PUBLIC API

    compile: function(environment, options, context, asObject) {
      this.environment = environment;
      this.options = options || {};

      log('debug', this.environment.disassemble() + "\n\n");

      this.name = this.environment.name;
      this.isChild = !!context;
      this.context = context || {
        programs: [],
        environments: [],
        aliases: { }
      };

      this.preamble();

      this.stackSlot = 0;
      this.stackVars = [];
      this.registers = { list: [] };
      this.hashes = [];
      this.compileStack = [];
      this.inlineStack = [];

      this.compileChildren(environment, options);

      var opcodes = environment.opcodes, opcode;

      this.i = 0;

      for(var l=opcodes.length; this.i<l; this.i++) {
        opcode = opcodes[this.i];

        if(opcode.opcode === 'DECLARE') {
          this[opcode.name] = opcode.value;
        } else {
          this[opcode.opcode].apply(this, opcode.args);
        }

        // Reset the stripNext flag if it was not set by this operation.
        if (opcode.opcode !== this.stripNext) {
          this.stripNext = false;
        }
      }

      // Flush any trailing content that might be pending.
      this.pushSource('');

      if (this.stackSlot || this.inlineStack.length || this.compileStack.length) {
        throw new Exception('Compile completed with content left on stack');
      }

      return this.createFunctionContext(asObject);
    },

    preamble: function() {
      var out = [];

      if (!this.isChild) {
        var namespace = this.namespace;

        var copies = "helpers = this.merge(helpers, " + namespace + ".helpers);";
        if (this.environment.usePartial) { copies = copies + " partials = this.merge(partials, " + namespace + ".partials);"; }
        if (this.options.data) { copies = copies + " data = data || {};"; }
        out.push(copies);
      } else {
        out.push('');
      }

      if (!this.environment.isSimple) {
        out.push(", buffer = " + this.initializeBuffer());
      } else {
        out.push("");
      }

      // track the last context pushed into place to allow skipping the
      // getContext opcode when it would be a noop
      this.lastContext = 0;
      this.source = out;
    },

    createFunctionContext: function(asObject) {
      var locals = this.stackVars.concat(this.registers.list);

      if(locals.length > 0) {
        this.source[1] = this.source[1] + ", " + locals.join(", ");
      }

      // Generate minimizer alias mappings
      if (!this.isChild) {
        for (var alias in this.context.aliases) {
          if (this.context.aliases.hasOwnProperty(alias)) {
            this.source[1] = this.source[1] + ', ' + alias + '=' + this.context.aliases[alias];
          }
        }
      }

      if (this.source[1]) {
        this.source[1] = "var " + this.source[1].substring(2) + ";";
      }

      // Merge children
      if (!this.isChild) {
        this.source[1] += '\n' + this.context.programs.join('\n') + '\n';
      }

      if (!this.environment.isSimple) {
        this.pushSource("return buffer;");
      }

      var params = this.isChild ? ["depth0", "data"] : ["Handlebars", "depth0", "helpers", "partials", "data"];

      for(var i=0, l=this.environment.depths.list.length; i<l; i++) {
        params.push("depth" + this.environment.depths.list[i]);
      }

      // Perform a second pass over the output to merge content when possible
      var source = this.mergeSource();

      if (!this.isChild) {
        source = this.compilerInfo()+source;
      }

      if (asObject) {
        params.push(source);

        return Function.apply(this, params);
      } else {
        var functionSource = 'function ' + (this.name || '') + '(' + params.join(',') + ') {\n  ' + source + '}';
        log('debug', functionSource + "\n\n");
        return functionSource;
      }
    },
    mergeSource: function() {
      // WARN: We are not handling the case where buffer is still populated as the source should
      // not have buffer append operations as their final action.
      var source = '',
          buffer;
      for (var i = 0, len = this.source.length; i < len; i++) {
        var line = this.source[i];
        if (line.appendToBuffer) {
          if (buffer) {
            buffer = buffer + '\n    + ' + line.content;
          } else {
            buffer = line.content;
          }
        } else {
          if (buffer) {
            source += 'buffer += ' + buffer + ';\n  ';
            buffer = undefined;
          }
          source += line + '\n  ';
        }
      }
      return source;
    },

    // [blockValue]
    //
    // On stack, before: hash, inverse, program, value
    // On stack, after: return value of blockHelperMissing
    //
    // The purpose of this opcode is to take a block of the form
    // `{{#foo}}...{{/foo}}`, resolve the value of `foo`, and
    // replace it on the stack with the result of properly
    // invoking blockHelperMissing.
    blockValue: function() {
      this.context.aliases.blockHelperMissing = 'helpers.blockHelperMissing';

      var params = ["depth0"];
      this.setupParams(0, params);

      this.replaceStack(function(current) {
        params.splice(1, 0, current);
        return "blockHelperMissing.call(" + params.join(", ") + ")";
      });
    },

    // [ambiguousBlockValue]
    //
    // On stack, before: hash, inverse, program, value
    // Compiler value, before: lastHelper=value of last found helper, if any
    // On stack, after, if no lastHelper: same as [blockValue]
    // On stack, after, if lastHelper: value
    ambiguousBlockValue: function() {
      this.context.aliases.blockHelperMissing = 'helpers.blockHelperMissing';

      var params = ["depth0"];
      this.setupParams(0, params);

      var current = this.topStack();
      params.splice(1, 0, current);

      this.pushSource("if (!" + this.lastHelper + ") { " + current + " = blockHelperMissing.call(" + params.join(", ") + "); }");
    },

    // [appendContent]
    //
    // On stack, before: ...
    // On stack, after: ...
    //
    // Appends the string value of `content` to the current buffer
    appendContent: function(content) {
      if (this.pendingContent) {
        content = this.pendingContent + content;
      }
      if (this.stripNext) {
        content = content.replace(/^\s+/, '');
      }

      this.pendingContent = content;
    },

    // [strip]
    //
    // On stack, before: ...
    // On stack, after: ...
    //
    // Removes any trailing whitespace from the prior content node and flags
    // the next operation for stripping if it is a content node.
    strip: function() {
      if (this.pendingContent) {
        this.pendingContent = this.pendingContent.replace(/\s+$/, '');
      }
      this.stripNext = 'strip';
    },

    // [append]
    //
    // On stack, before: value, ...
    // On stack, after: ...
    //
    // Coerces `value` to a String and appends it to the current buffer.
    //
    // If `value` is truthy, or 0, it is coerced into a string and appended
    // Otherwise, the empty string is appended
    append: function() {
      // Force anything that is inlined onto the stack so we don't have duplication
      // when we examine local
      this.flushInline();
      var local = this.popStack();
      this.pushSource("if(" + local + " || " + local + " === 0) { " + this.appendToBuffer(local) + " }");
      if (this.environment.isSimple) {
        this.pushSource("else { " + this.appendToBuffer("''") + " }");
      }
    },

    // [appendEscaped]
    //
    // On stack, before: value, ...
    // On stack, after: ...
    //
    // Escape `value` and append it to the buffer
    appendEscaped: function() {
      this.context.aliases.escapeExpression = 'this.escapeExpression';

      this.pushSource(this.appendToBuffer("escapeExpression(" + this.popStack() + ")"));
    },

    // [getContext]
    //
    // On stack, before: ...
    // On stack, after: ...
    // Compiler value, after: lastContext=depth
    //
    // Set the value of the `lastContext` compiler value to the depth
    getContext: function(depth) {
      if(this.lastContext !== depth) {
        this.lastContext = depth;
      }
    },

    // [lookupOnContext]
    //
    // On stack, before: ...
    // On stack, after: currentContext[name], ...
    //
    // Looks up the value of `name` on the current context and pushes
    // it onto the stack.
    lookupOnContext: function(name) {
      this.push(this.nameLookup('depth' + this.lastContext, name, 'context'));
    },

    // [pushContext]
    //
    // On stack, before: ...
    // On stack, after: currentContext, ...
    //
    // Pushes the value of the current context onto the stack.
    pushContext: function() {
      this.pushStackLiteral('depth' + this.lastContext);
    },

    // [resolvePossibleLambda]
    //
    // On stack, before: value, ...
    // On stack, after: resolved value, ...
    //
    // If the `value` is a lambda, replace it on the stack by
    // the return value of the lambda
    resolvePossibleLambda: function() {
      this.context.aliases.functionType = '"function"';

      this.replaceStack(function(current) {
        return "typeof " + current + " === functionType ? " + current + ".apply(depth0) : " + current;
      });
    },

    // [lookup]
    //
    // On stack, before: value, ...
    // On stack, after: value[name], ...
    //
    // Replace the value on the stack with the result of looking
    // up `name` on `value`
    lookup: function(name) {
      this.replaceStack(function(current) {
        return current + " == null || " + current + " === false ? " + current + " : " + this.nameLookup(current, name, 'context');
      });
    },

    // [lookupData]
    //
    // On stack, before: ...
    // On stack, after: data, ...
    //
    // Push the data lookup operator
    lookupData: function() {
      this.pushStackLiteral('data');
    },

    // [pushStringParam]
    //
    // On stack, before: ...
    // On stack, after: string, currentContext, ...
    //
    // This opcode is designed for use in string mode, which
    // provides the string value of a parameter along with its
    // depth rather than resolving it immediately.
    pushStringParam: function(string, type) {
      this.pushStackLiteral('depth' + this.lastContext);

      this.pushString(type);

      // If it's a subexpression, the string result
      // will be pushed after this opcode.
      if (type !== 'sexpr') {
        if (typeof string === 'string') {
          this.pushString(string);
        } else {
          this.pushStackLiteral(string);
        }
      }
    },

    emptyHash: function() {
      this.pushStackLiteral('{}');

      if (this.options.stringParams) {
        this.push('{}'); // hashContexts
        this.push('{}'); // hashTypes
      }
    },
    pushHash: function() {
      if (this.hash) {
        this.hashes.push(this.hash);
      }
      this.hash = {values: [], types: [], contexts: []};
    },
    popHash: function() {
      var hash = this.hash;
      this.hash = this.hashes.pop();

      if (this.options.stringParams) {
        this.push('{' + hash.contexts.join(',') + '}');
        this.push('{' + hash.types.join(',') + '}');
      }

      this.push('{\n    ' + hash.values.join(',\n    ') + '\n  }');
    },

    // [pushString]
    //
    // On stack, before: ...
    // On stack, after: quotedString(string), ...
    //
    // Push a quoted version of `string` onto the stack
    pushString: function(string) {
      this.pushStackLiteral(this.quotedString(string));
    },

    // [push]
    //
    // On stack, before: ...
    // On stack, after: expr, ...
    //
    // Push an expression onto the stack
    push: function(expr) {
      this.inlineStack.push(expr);
      return expr;
    },

    // [pushLiteral]
    //
    // On stack, before: ...
    // On stack, after: value, ...
    //
    // Pushes a value onto the stack. This operation prevents
    // the compiler from creating a temporary variable to hold
    // it.
    pushLiteral: function(value) {
      this.pushStackLiteral(value);
    },

    // [pushProgram]
    //
    // On stack, before: ...
    // On stack, after: program(guid), ...
    //
    // Push a program expression onto the stack. This takes
    // a compile-time guid and converts it into a runtime-accessible
    // expression.
    pushProgram: function(guid) {
      if (guid != null) {
        this.pushStackLiteral(this.programExpression(guid));
      } else {
        this.pushStackLiteral(null);
      }
    },

    // [invokeHelper]
    //
    // On stack, before: hash, inverse, program, params..., ...
    // On stack, after: result of helper invocation
    //
    // Pops off the helper's parameters, invokes the helper,
    // and pushes the helper's return value onto the stack.
    //
    // If the helper is not found, `helperMissing` is called.
    invokeHelper: function(paramSize, name, isRoot) {
      this.context.aliases.helperMissing = 'helpers.helperMissing';
      this.useRegister('helper');

      var helper = this.lastHelper = this.setupHelper(paramSize, name, true);
      var nonHelper = this.nameLookup('depth' + this.lastContext, name, 'context');

      var lookup = 'helper = ' + helper.name + ' || ' + nonHelper;
      if (helper.paramsInit) {
        lookup += ',' + helper.paramsInit;
      }

      this.push(
        '('
          + lookup
          + ',helper '
            + '? helper.call(' + helper.callParams + ') '
            + ': helperMissing.call(' + helper.helperMissingParams + '))');

      // Always flush subexpressions. This is both to prevent the compounding size issue that
      // occurs when the code has to be duplicated for inlining and also to prevent errors
      // due to the incorrect options object being passed due to the shared register.
      if (!isRoot) {
        this.flushInline();
      }
    },

    // [invokeKnownHelper]
    //
    // On stack, before: hash, inverse, program, params..., ...
    // On stack, after: result of helper invocation
    //
    // This operation is used when the helper is known to exist,
    // so a `helperMissing` fallback is not required.
    invokeKnownHelper: function(paramSize, name) {
      var helper = this.setupHelper(paramSize, name);
      this.push(helper.name + ".call(" + helper.callParams + ")");
    },

    // [invokeAmbiguous]
    //
    // On stack, before: hash, inverse, program, params..., ...
    // On stack, after: result of disambiguation
    //
    // This operation is used when an expression like `{{foo}}`
    // is provided, but we don't know at compile-time whether it
    // is a helper or a path.
    //
    // This operation emits more code than the other options,
    // and can be avoided by passing the `knownHelpers` and
    // `knownHelpersOnly` flags at compile-time.
    invokeAmbiguous: function(name, helperCall) {
      this.context.aliases.functionType = '"function"';
      this.useRegister('helper');

      this.emptyHash();
      var helper = this.setupHelper(0, name, helperCall);

      var helperName = this.lastHelper = this.nameLookup('helpers', name, 'helper');

      var nonHelper = this.nameLookup('depth' + this.lastContext, name, 'context');
      var nextStack = this.nextStack();

      if (helper.paramsInit) {
        this.pushSource(helper.paramsInit);
      }
      this.pushSource('if (helper = ' + helperName + ') { ' + nextStack + ' = helper.call(' + helper.callParams + '); }');
      this.pushSource('else { helper = ' + nonHelper + '; ' + nextStack + ' = typeof helper === functionType ? helper.call(' + helper.callParams + ') : helper; }');
    },

    // [invokePartial]
    //
    // On stack, before: context, ...
    // On stack after: result of partial invocation
    //
    // This operation pops off a context, invokes a partial with that context,
    // and pushes the result of the invocation back.
    invokePartial: function(name) {
      var params = [this.nameLookup('partials', name, 'partial'), "'" + name + "'", this.popStack(), "helpers", "partials"];

      if (this.options.data) {
        params.push("data");
      }

      this.context.aliases.self = "this";
      this.push("self.invokePartial(" + params.join(", ") + ")");
    },

    // [assignToHash]
    //
    // On stack, before: value, hash, ...
    // On stack, after: hash, ...
    //
    // Pops a value and hash off the stack, assigns `hash[key] = value`
    // and pushes the hash back onto the stack.
    assignToHash: function(key) {
      var value = this.popStack(),
          context,
          type;

      if (this.options.stringParams) {
        type = this.popStack();
        context = this.popStack();
      }

      var hash = this.hash;
      if (context) {
        hash.contexts.push("'" + key + "': " + context);
      }
      if (type) {
        hash.types.push("'" + key + "': " + type);
      }
      hash.values.push("'" + key + "': (" + value + ")");
    },

    // HELPERS

    compiler: JavaScriptCompiler,

    compileChildren: function(environment, options) {
      var children = environment.children, child, compiler;

      for(var i=0, l=children.length; i<l; i++) {
        child = children[i];
        compiler = new this.compiler();

        var index = this.matchExistingProgram(child);

        if (index == null) {
          this.context.programs.push('');     // Placeholder to prevent name conflicts for nested children
          index = this.context.programs.length;
          child.index = index;
          child.name = 'program' + index;
          this.context.programs[index] = compiler.compile(child, options, this.context);
          this.context.environments[index] = child;
        } else {
          child.index = index;
          child.name = 'program' + index;
        }
      }
    },
    matchExistingProgram: function(child) {
      for (var i = 0, len = this.context.environments.length; i < len; i++) {
        var environment = this.context.environments[i];
        if (environment && environment.equals(child)) {
          return i;
        }
      }
    },

    programExpression: function(guid) {
      this.context.aliases.self = "this";

      if(guid == null) {
        return "self.noop";
      }

      var child = this.environment.children[guid],
          depths = child.depths.list, depth;

      var programParams = [child.index, child.name, "data"];

      for(var i=0, l = depths.length; i<l; i++) {
        depth = depths[i];

        if(depth === 1) { programParams.push("depth0"); }
        else { programParams.push("depth" + (depth - 1)); }
      }

      return (depths.length === 0 ? "self.program(" : "self.programWithDepth(") + programParams.join(", ") + ")";
    },

    register: function(name, val) {
      this.useRegister(name);
      this.pushSource(name + " = " + val + ";");
    },

    useRegister: function(name) {
      if(!this.registers[name]) {
        this.registers[name] = true;
        this.registers.list.push(name);
      }
    },

    pushStackLiteral: function(item) {
      return this.push(new Literal(item));
    },

    pushSource: function(source) {
      if (this.pendingContent) {
        this.source.push(this.appendToBuffer(this.quotedString(this.pendingContent)));
        this.pendingContent = undefined;
      }

      if (source) {
        this.source.push(source);
      }
    },

    pushStack: function(item) {
      this.flushInline();

      var stack = this.incrStack();
      if (item) {
        this.pushSource(stack + " = " + item + ";");
      }
      this.compileStack.push(stack);
      return stack;
    },

    replaceStack: function(callback) {
      var prefix = '',
          inline = this.isInline(),
          stack,
          createdStack,
          usedLiteral;

      // If we are currently inline then we want to merge the inline statement into the
      // replacement statement via ','
      if (inline) {
        var top = this.popStack(true);

        if (top instanceof Literal) {
          // Literals do not need to be inlined
          stack = top.value;
          usedLiteral = true;
        } else {
          // Get or create the current stack name for use by the inline
          createdStack = !this.stackSlot;
          var name = !createdStack ? this.topStackName() : this.incrStack();

          prefix = '(' + this.push(name) + ' = ' + top + '),';
          stack = this.topStack();
        }
      } else {
        stack = this.topStack();
      }

      var item = callback.call(this, stack);

      if (inline) {
        if (!usedLiteral) {
          this.popStack();
        }
        if (createdStack) {
          this.stackSlot--;
        }
        this.push('(' + prefix + item + ')');
      } else {
        // Prevent modification of the context depth variable. Through replaceStack
        if (!/^stack/.test(stack)) {
          stack = this.nextStack();
        }

        this.pushSource(stack + " = (" + prefix + item + ");");
      }
      return stack;
    },

    nextStack: function() {
      return this.pushStack();
    },

    incrStack: function() {
      this.stackSlot++;
      if(this.stackSlot > this.stackVars.length) { this.stackVars.push("stack" + this.stackSlot); }
      return this.topStackName();
    },
    topStackName: function() {
      return "stack" + this.stackSlot;
    },
    flushInline: function() {
      var inlineStack = this.inlineStack;
      if (inlineStack.length) {
        this.inlineStack = [];
        for (var i = 0, len = inlineStack.length; i < len; i++) {
          var entry = inlineStack[i];
          if (entry instanceof Literal) {
            this.compileStack.push(entry);
          } else {
            this.pushStack(entry);
          }
        }
      }
    },
    isInline: function() {
      return this.inlineStack.length;
    },

    popStack: function(wrapped) {
      var inline = this.isInline(),
          item = (inline ? this.inlineStack : this.compileStack).pop();

      if (!wrapped && (item instanceof Literal)) {
        return item.value;
      } else {
        if (!inline) {
          if (!this.stackSlot) {
            throw new Exception('Invalid stack pop');
          }
          this.stackSlot--;
        }
        return item;
      }
    },

    topStack: function(wrapped) {
      var stack = (this.isInline() ? this.inlineStack : this.compileStack),
          item = stack[stack.length - 1];

      if (!wrapped && (item instanceof Literal)) {
        return item.value;
      } else {
        return item;
      }
    },

    quotedString: function(str) {
      return '"' + str
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\u2028/g, '\\u2028')   // Per Ecma-262 7.3 + 7.8.4
        .replace(/\u2029/g, '\\u2029') + '"';
    },

    setupHelper: function(paramSize, name, missingParams) {
      var params = [],
          paramsInit = this.setupParams(paramSize, params, missingParams);
      var foundHelper = this.nameLookup('helpers', name, 'helper');

      return {
        params: params,
        paramsInit: paramsInit,
        name: foundHelper,
        callParams: ["depth0"].concat(params).join(", "),
        helperMissingParams: missingParams && ["depth0", this.quotedString(name)].concat(params).join(", ")
      };
    },

    setupOptions: function(paramSize, params) {
      var options = [], contexts = [], types = [], param, inverse, program;

      options.push("hash:" + this.popStack());

      if (this.options.stringParams) {
        options.push("hashTypes:" + this.popStack());
        options.push("hashContexts:" + this.popStack());
      }

      inverse = this.popStack();
      program = this.popStack();

      // Avoid setting fn and inverse if neither are set. This allows
      // helpers to do a check for `if (options.fn)`
      if (program || inverse) {
        if (!program) {
          this.context.aliases.self = "this";
          program = "self.noop";
        }

        if (!inverse) {
          this.context.aliases.self = "this";
          inverse = "self.noop";
        }

        options.push("inverse:" + inverse);
        options.push("fn:" + program);
      }

      for(var i=0; i<paramSize; i++) {
        param = this.popStack();
        params.push(param);

        if(this.options.stringParams) {
          types.push(this.popStack());
          contexts.push(this.popStack());
        }
      }

      if (this.options.stringParams) {
        options.push("contexts:[" + contexts.join(",") + "]");
        options.push("types:[" + types.join(",") + "]");
      }

      if(this.options.data) {
        options.push("data:data");
      }

      return options;
    },

    // the params and contexts arguments are passed in arrays
    // to fill in
    setupParams: function(paramSize, params, useRegister) {
      var options = '{' + this.setupOptions(paramSize, params).join(',') + '}';

      if (useRegister) {
        this.useRegister('options');
        params.push('options');
        return 'options=' + options;
      } else {
        params.push(options);
        return '';
      }
    }
  };

  var reservedWords = (
    "break else new var" +
    " case finally return void" +
    " catch for switch while" +
    " continue function this with" +
    " default if throw" +
    " delete in try" +
    " do instanceof typeof" +
    " abstract enum int short" +
    " boolean export interface static" +
    " byte extends long super" +
    " char final native synchronized" +
    " class float package throws" +
    " const goto private transient" +
    " debugger implements protected volatile" +
    " double import public let yield"
  ).split(" ");

  var compilerWords = JavaScriptCompiler.RESERVED_WORDS = {};

  for(var i=0, l=reservedWords.length; i<l; i++) {
    compilerWords[reservedWords[i]] = true;
  }

  JavaScriptCompiler.isValidJavaScriptVariableName = function(name) {
    if(!JavaScriptCompiler.RESERVED_WORDS[name] && /^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(name)) {
      return true;
    }
    return false;
  };

  __exports__ = JavaScriptCompiler;
  return __exports__;
})(__module2__, __module5__);

// handlebars.js
var __module0__ = (function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__) {
  "use strict";
  var __exports__;
  /*globals Handlebars: true */
  var Handlebars = __dependency1__;

  // Compiler imports
  var AST = __dependency2__;
  var Parser = __dependency3__.parser;
  var parse = __dependency3__.parse;
  var Compiler = __dependency4__.Compiler;
  var compile = __dependency4__.compile;
  var precompile = __dependency4__.precompile;
  var JavaScriptCompiler = __dependency5__;

  var _create = Handlebars.create;
  var create = function() {
    var hb = _create();

    hb.compile = function(input, options) {
      return compile(input, options, hb);
    };
    hb.precompile = function (input, options) {
      return precompile(input, options, hb);
    };

    hb.AST = AST;
    hb.Compiler = Compiler;
    hb.JavaScriptCompiler = JavaScriptCompiler;
    hb.Parser = Parser;
    hb.parse = parse;

    return hb;
  };

  Handlebars = create();
  Handlebars.create = create;

  __exports__ = Handlebars;
  return __exports__;
})(__module1__, __module7__, __module8__, __module10__, __module11__);

  return __module0__;
})();

define("handlebars", function(){});

/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

Handlebars.registerHelper('IfCompare', function(lvalue, rvalue, options) {
    if (arguments.length < 3) {
        throw new Error("IfCompare helper function requires 2 parameters.");
    }

    var operator = options.hash.operator || "==",
        operators = {
            '==': function(l, r) { return l == r; },
            '===': function(l, r) { return l === r; },
            '!=': function(l, r) { return l != r; },
            '!==': function(l, r) { return l !== r; },
            '<': function(l, r) { return l < r; },
            '>': function(l, r) { return l > r; },
            '<=': function(l, r) { return l <= r; },
            '>=': function(l, r) { return l >= r; },
            '%3': function(l, r) { return (l % 3) == r; },
            '%2': function(l, r) { return (l % 2) == r; },
            '&&': function(l, r) { return l && r; },
            '||': function(l, r) { return l || r; },
            'lessByOne': function(l, r) { return (r - l) == 1; },
            'typeof': function(l, r) { return typeof l == r; }
        };

    if (!operators[operator]) {
        throw new Error("IfCompare helper function doesn't support given operator " + operator + ".");
    }

    var result = operators[operator](lvalue, rvalue);

    if( result ) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});

Handlebars.registerHelper('ArthematicOps', function(lvalue, rvalue, options) {
    var operator = options.hash.operator;
    operators = {
        '+': function(l, r) { return l + r; },
        '-': function(l, r) { return l - r; }
    };
    return operators[operator](lvalue,rvalue);
});

Handlebars.registerHelper('typeof', function(variable, dataType,options) {
    if (typeof variable == dataType) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});

Handlebars.registerHelper('getRelativeTime', function(timeStamp, options) {
    return diffDates(new XDate(parseInt(timeStamp/1000)),new XDate());
});

Handlebars.registerHelper('syntaxHighlight', function(rawdata, options) {
    return syntaxHighlight(rawdata);
});

Handlebars.registerHelper('formatJSON2HTML', function(rawdata, ignoreKeys, options) {
    return contrail.formatJSON2HTML(rawdata, 2, ignoreKeys);
});

Handlebars.registerHelper('formatGridJSON2HTML', function(rawdata, options) {
    var rawDataClone = $.extend(true,{}, rawdata);
    if (contrail.checkIfExist(rawDataClone.cgrid)) {
        delete rawDataClone.cgrid;
    }
    return contrail.formatJSON2HTML(rawDataClone,2);
});

Handlebars.registerHelper('formatString2HTML', function(string) {
    return string;
});

Handlebars.registerHelper('makeItValidDOMId', function(id, options) {
    return id.replace(/:/g,'-');
});

// Handlebars.registerPartial('scatterTooltip',$('#title-lblval-tooltip-template').html());
// Handlebars.registerPartial('scatterTooltipNew',$('#title-lblval-tooltip-template-new').html());


//Handlebar register helper for formatting json in details template
Handlebars.registerHelper('displayJson',function(rawjson){
	return syntaxHighlight(rawjson);
});

/* 
 * Register Helper to set index value inside the loop to be used under nested loops
 */
Handlebars.registerHelper('setLoopIndex', function(value){
    this.loopIndex = Number(value); 
});

Handlebars.registerHelper('eachCustomIncrement', function(context,loopstart,incrementor,options){
    var ret = "";
    for(var i = loopstart, j = context.length; i < j; i += Number(incrementor)) {
      ret = ret + options.fn(context[i]);
    }
    return ret;
});

Handlebars.registerHelper('jsonStringify', function(jsonObj) {
    return JSON.stringify(jsonObj);
});

Handlebars.registerHelper('getValue', function(context,key,options) {
    if(typeof(context) == 'string') {
        try{
            context = JSON.parse(context);
        }catch(e){
            throw new Error("Parameter passed is not an object");
        }
    }
    if($.isArray(context) && context[key] != null)
        return context[key]; 
    if(typeof(context) == 'object' && context[key] != null) 
        return context[key];
    else
        throw new Error("Parameter passed is not an object or the key doesn't exist");
});
/*
 * This method checks the menuItem object for hash if it find any hash property then it will return, else it will check for the 
 * sub menu items of the object and returns the first menu item object hash and query params if any and returns as string
 */
Handlebars.registerHelper('getHashFromMenuItem',function(menuItem){
    var result = {},params = {},childItems = [];
    if(menuItem['items'] != null && menuItem['items']['item'] != null) {
        childItems = menuItem['items']['item'];
        //If hash is not found for its first immediate children,look for one-level down
        var firstLevelMenuObj,leafLevelMenuObj;
        firstLevelMenuObj = childItems[0];
        leafLevelMenuObj = firstLevelMenuObj;
        if(firstLevelMenuObj != null && firstLevelMenuObj['hash'] == null)
            leafLevelMenuObj = firstLevelMenuObj['items']['item'][0];
        if(leafLevelMenuObj == null || leafLevelMenuObj['hash'] == null)
            return;
        result['p'] =  leafLevelMenuObj['hash'];
        $.each(ifNull(leafLevelMenuObj['queryParams'],[]),function(key,value){
            params[key] = value
        });
        result['q'] = params;
        return $.param.fragment(location.href,result,2);
    } else {
        if(menuItem['hash'] != null)
            result['p'] = menuItem['hash'];
        if(menuItem['queryParams'] != null){
            $.each(menuItem['queryParams'],function(key,value){
                params[key] = value
            });
            result['q'] = params;
        }
        return $.param.fragment(location.href,result,2)
    }
});

Handlebars.registerHelper('showHidePIDetails', function(type) {
    return type === 'Physical' ? 'show' : 'hide';
});

Handlebars.registerHelper('showHideLIDetails', function(type) {
    return type === 'Logical' ? 'show' : 'hide';
});

Handlebars.registerHelper('formatVirtualRouterType', function(type) {
    return formatVirtualRouterType(type);
});

Handlebars.registerHelper('showLIServer', function(type) {
    return type != null && type === 'L2'  ? 'show' : 'hide';
});

Handlebars.registerHelper('showLISubnet', function(type) {
    return type != null && type === 'L3' ? 'show' : 'hide';
});

Handlebars.registerHelper('showDeviceOwner', function(block) {
    if(globalObj.webServerInfo.loggedInOrchestrationMode == 'vcenter')
        return 'hide'; 
    else
        return 'show';
});

Handlebars.registerHelper('getLabel', function (label, labelKey, feature) {
    if(label != null && label != "undefined") {
        return label;
    }
    if (feature == cowc.APP_CONTRAIL_SM) {
        return smwl.get(labelKey);
    } else if (feature == cowc.APP_CONTRAIL_CONTROLLER) {
        return ctwl.get(labelKey);
    } else if (feature == cowc.APP_CONTRAIL_STORAGE) {
        return swl.get(labelKey);
    }
});

Handlebars.registerHelper('getJSONValueByPath', function (path, obj) {
    var pathValue = cowu.getJSONValueByPath(path, obj);
    return $.isArray(pathValue) ? pathValue.join(', ') : pathValue;
});

Handlebars.registerHelper('getValueByConfig', function (obj, options) {
    var config = $.parseJSON(options.hash.config),
        key = config.key,
        value = cowu.getJSONValueByPath(key, obj),
        templateGenerator = config.templateGenerator,
        templateGeneratorConfig = config.templateGeneratorConfig,
        returnValue;

    if(value == '-') {
        return value;
    }

    switch (templateGenerator) {
        case 'TextGenerator':
            if (contrail.checkIfExist(templateGeneratorConfig)) {
                var formatterKey = templateGeneratorConfig.formatter,
                    options = {
                        iconClass: templateGeneratorConfig.iconClass,
                        obj: obj,
                        key: key
                    };

                return cowf.getFormattedValue(formatterKey, value, options);
            } else {
                returnValue = $.isArray(value) ? value.join(', ') : value;
            }
        break;

        case 'LinkGenerator':

            var linkTemplate,
                params = contrail.handleIfNull(templateGeneratorConfig.params, {}),
                hrefLinkArray = [], hrefLink = 'javascript:void(0)';
            if(templateGeneratorConfig.template != null) {
                linkTemplate = Handlebars.compile(templateGeneratorConfig.template);
            }
            $.each(params, function(paramKey, paramValue) {
                if ($.isPlainObject(paramValue)) {
                    if (paramValue.type == 'fixed') {
                        params[paramKey] = paramValue.value;
                    } else if (paramValue.type == 'derived') {
                        params[paramKey] = cowu.getJSONValueByPath(paramValue.value, obj)
                    }
                } else {
                    params[paramKey] = cowu.getJSONValueByPath(paramValue, obj)
                }
            });

            if ($.isArray(value)) {
                $.each(value, function(vKey, vValue) {
                    if(linkTemplate != null) {
                        hrefLink = linkTemplate({key: vValue, params: params});
                    }
                    hrefLinkArray.push('<a class="value-link" target="_blank" href="' + hrefLink + '">' + vValue + '</a>');
                });

                returnValue = hrefLinkArray.join('');
            } else {
                if(linkTemplate != null) {
                    hrefLink = linkTemplate({key: value, params: params});
                }
                returnValue = '<a class="value-link" target="_blank" href="' + hrefLink + '">' + value + '</a>';
            }
        break;

        case 'json' :
            return contrail.formatJSON2HTML(value,7);
        break;
    };

    return returnValue;

});

Handlebars.registerHelper('IfValidJSONValueByPath', function (path, obj, index, options) {
    var result = (cowu.getJSONValueByPath(path, obj) != "-") ? true : false;
    if(result || index == 0) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});

Handlebars.registerHelper('IfValidJSONValueByPathLength', function (path, obj, options) {
    var value = cowu.getJSONValueByPath(path, obj),
        result = (value != "-") ? true : false;
    if(result && value.length > 0) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});

Handlebars.registerHelper('encodedVN', function(jsonObj) {
    if(null !== jsonObj && typeof jsonObj !== "undefined" &&
        jsonObj.hasOwnProperty('q') &&
        jsonObj['q'].hasOwnProperty('srcVN') && 
        jsonObj['q']['srcVN'].indexOf(' ') !== -1)
        jsonObj['q']['srcVN'] = encodeURIComponent(jsonObj['q']['srcVN']);
    return JSON.stringify(jsonObj);
});

Handlebars.registerHelper('handleIfNull', function(value, defaultValue) {
    return contrail.handleIfNull(value, defaultValue);
});

Handlebars.registerHelper('printJSON', function(jsonObject) {
    return JSON.stringify(jsonObject);
});

Handlebars.registerHelper ('truncate', function (str, len) {
    if (typeof(str) == "object") {
            str = JSON.stringify(str);
    }
    if (str.length > len && str.length > 0) {
        var new_str = str + " ";
        new_str = str.substr (0, len);
        new_str = str.substr (0, new_str.lastIndexOf(" "));
        new_str = (new_str.length > 0) ? new_str : str.substr (0, len);

        return new Handlebars.SafeString ( new_str +'...' ); 
    }
    return str;
});

define("handlebars-utils", ["jquery","handlebars"], function(){});

/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

contrail = new Contrail();

function Contrail() {
    var templates = {};
    this.format = function () {
        var args = arguments;
        return args[0].replace(/\{(\d+)\}/g, function (m, n) {
            n = parseInt(n) + 1;
            return args[n];
        });
    };
    this.getTemplate4Id = function(elementId, key) {
        var templateKey = key == null ? elementId : key;
        var template = templates[templateKey];
        if(template == null) {
            template = Handlebars.compile($('#' + elementId).html());
            templates[templateKey] = template;
        }
        return template;
    };
    this.getTemplate4Source = function(source, key) {
        if(!contrail.checkIfExist(templates[key])) {
            templates[key] = Handlebars.compile(source)
        }
        return templates[key];

    };

    this.checkIfExist = function(value) {
        var exist = true;
        if(value == null ||  typeof value  == "undefined") {
            exist = false;
        }
        return exist;
    };

    this.checkIfKnockoutBindingExist = function (id) {
        return this.checkIfExist(ko.dataFor(document.getElementById(id)))
    };

    this.handleIfNull = function(value, defaultValue) {
        if(value == null || typeof value == 'undefined') {
            return defaultValue;
        } else {
            return value;
        }
    };

    this.handleIfNaN = function(value, defaultValue) {
        if(isNaN(value)) {
            return defaultValue;
        } else {
            return value;
        }
    };

    this.checkAndReplace = function(value, ifValue, replaceValue) {
        if(value == null || typeof value == 'undefined' || value == ifValue) {
            return replaceValue;
        } else {
            return value;
        }
    };

    this.checkIfFunction = function(value) {
        var isFunction = true;
        if(value == null ||  typeof value  != "function") {
            isFunction = false;
        }
        return isFunction;
    };
    /*
        Function to check if key exist inside an object
        deep (Boolean): If true, the search becomes recursive (aka. deep copy).
        valueObject : Object to be searched.
        pathString: path to be traversed, separated by .(dot)
     */
    this.checkIfKeyExistInObject = function(deep, valueObject, pathString) {
        if (!contrail.checkIfExist(valueObject)) {
            return false;
        } else {
            if (deep) {
                var pathArray = pathString.split('.'),
                    traversedValue = valueObject,
                    returnFlag = true;
                $.each(pathArray, function (pathKey, pathValue) {
                    if (contrail.checkIfExist(traversedValue[pathValue])) {
                        traversedValue = traversedValue[pathValue];
                    } else {
                        returnFlag = false;
                        return;
                    }
                });

                return returnFlag;
            } else {
                return contrail.checkIfExist(valueObject[pathString]);
            }
        }
    };
    this.getObjectValueByPath = function(valueObject, pathString) {
        var pathArray = pathString.split('.'),
            returnValue = valueObject;

        $.each(pathArray, function (pathKey, pathValue) {
            if (contrail.checkIfExist(returnValue[pathValue])) {
                returnValue = returnValue[pathValue];
            } else {
                returnValue = null;
                return;
            }
        });

        return returnValue
    };
    this.parseErrorMsgFromXHR = function(xhr) {
        var errorMsg = '';
        if(contrail.checkIfExist(xhr.errorThrown)) {
            errorMsg = xhr.errorThrown;
        } else if(contrail.checkIfExist(xhr.responseText)) {
            errorMsg = xhr.responseText;
            if(errorMsg.length > 100) {
                errorMsg = errorMsg.substring(0, 100) + '...';
            }
        } else {
            errorMsg = 'Request Status Code: ' + xhr.status + ', Status Text: ' + xhr.statusText;
        }
        return errorMsg;
    };
    this.ajaxHandler = function (config, initHandler, successHandler,
        failureHandler, cbparam) {
        var contentType = null, dataType = config['dataType'],
            methodType = config['type'], cacheEnabled = config['cache'],
            reqTimeOut = config['timeout'], dataUrl = config['url'],
            postData = config['data'], ajaxConfig = {};

        ajaxConfig.async = contrail.checkIfExist(config.async) ? config.async : true;

        cacheEnabled = (cacheEnabled) == null ? false : cacheEnabled;

        if(initHandler != null) {
            initHandler();
        }

        if (isSet(methodType)) {
            if (methodType == "POST" || methodType == "PUT" || methodType == "DELETE") {
                if (!isSet(postData)) {
                    postData = "{}";
                }
                contentType = "application/json; charset=utf-8";
                ajaxConfig.dataType = (dataType == null)? "json" : dataType;
                ajaxConfig.contentType = contentType;
            }
        } else {
            methodType == "GET";
        }

        ajaxConfig.type = methodType;
        ajaxConfig.cache = cacheEnabled;
        ajaxConfig.url = dataUrl;
        ajaxConfig.data = postData;

        if (isSet(reqTimeOut) && isNumber(reqTimeOut) && reqTimeOut > 0) {
            ajaxConfig.timeout = reqTimeOut;
        } else {
            ajaxConfig.timeout = 30000;
        }

        $.ajax(ajaxConfig).success(function(response){
            successHandler(response, cbparam);
        }).fail(function (error) {
            if (error['statusText'] === "timeout") {
                error['responseText'] = "Request timeout.";
            }
            if (contrail.checkIfFunction(failureHandler)) {
                failureHandler(error);
            }
        });
    };

    this.truncateText = function(text, size){
    	var textLength = text.length;
        if(textLength <= size){
    		return text;
    	} else{
    		return text.substr(0, (size - 6)) + '...' + text.substr((textLength - 3), textLength);
    	}
    };

    this.getCookie = function(name) {
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
    };

    this.setCookie = function(name, value) {
        var secureCookieStr = "";
        var insecureAccess = getValueByJsonPath(globalObj, 'webServerInfo;insecureAccess', false);
        if (globalObj['test-env'] == globalObj['env'] + '-test') {
            secureCookieStr = "";
        } else if (false == insecureAccess) {
            secureCookieStr = "; secure";
        }
        document.cookie = name + "=" + escape(value) +
            "; expires=Sun, 17 Jan 2038 00:00:00 UTC; path=/" + secureCookieStr;
    };

    this.formatJSON2HTML = function(json, formatDepth, ignoreKeys){
        if(typeof json == 'string'){
            json = JSON.parse(json);
        }

        return '<pre class="pre-format-JSON2HTML">' + formatJsonObject(json, formatDepth, 0, ignoreKeys) + '</pre>';
    };
    
    this.isItemExists = function(value, data){
        var isThere = false;
        for(var i = 0; i < data.length; i++) {
            for(var j = 0; j < data[i].children.length; j++) {
                if(value === data[i].children[j].value) {
                    return true;
                }
            }
        }
        return isThere;
    };

    this.appendNewItemMainDataSource = function(value, data){
        var valueArray = value.split('~');
        if(valueArray.length === 2) {
            for(var i = 0; i < data.length; i++) {
                if(data[i].value === valueArray[1]) {
                    data[i].children.push(
                        {
                           text : valueArray[0],
                           id : value,
                           value : value ,
                           parent : valueArray[1]
                        }
                    );
                    break;
                }
            }
        }
    };

    function formatJsonObject(jsonObj, formatDepth, currentDepth, ignoreKeys) {
    	var output = '',
    		objType = {type: 'object', startTag: '{', endTag: '}'};
    	
    	if(jsonObj instanceof Array){
    		objType = {type: 'array', startTag: '[', endTag: ']'};
    	}
    	
		if(formatDepth == 0){
			output += '<i class="node-' + currentDepth + ' icon-plus expander"></i> ' + objType.startTag + '<ul data-depth="' + currentDepth + '" class="node-' + currentDepth + ' node hide raw">' + 
						JSON.stringify(jsonObj) + '</ul><span class="node-' + currentDepth + ' collapsed expander"> ... </span>' + objType.endTag;
		}
		else {
			output += '<i class="node-' + currentDepth + ' icon-minus collapser"></i> ' + objType.startTag + '<ul data-depth="' + currentDepth + '" class="node-' + currentDepth + ' node">';
            $.each(jsonObj, function(key, val){
                if (!contrail.checkIfExist(ignoreKeys) || (contrail.checkIfExist(ignoreKeys) && ignoreKeys.indexOf(key) === -1)) {
                    if (objType['type'] == 'object') {
                        output += '<li class="key-value"><span class="key">' + key + '</span>: ';
                    }
                    else {
                        output += '<li class="key-value">';
                    }

                    if (val != null && typeof val == 'object') {
                        output += '<span class="value">' + formatJsonObject(val, formatDepth - 1, currentDepth + 1) + '</span>';
                    }
                    else {
                        output += '<span class="value ' + typeof val + '">' + val + '</span>';
                    }
                    output += '</li>';
                }
			});
			output += '</ul><span class="node-' + currentDepth + ' collapsed hide expander"> ... </span>' + objType.endTag;
		}
		return output;
    };
};


define("contrail-common", ["jquery"], function(){});

/*
 * UUID-js: A js library to generate and parse UUIDs, TimeUUIDs and generate
 * TimeUUID based on dates for range selections.
 * @see http://www.ietf.org/rfc/rfc4122.txt
 **/

function UUIDjs() {
};

UUIDjs.maxFromBits = function(bits) {
  return Math.pow(2, bits);
};

UUIDjs.limitUI04 = UUIDjs.maxFromBits(4);
UUIDjs.limitUI06 = UUIDjs.maxFromBits(6);
UUIDjs.limitUI08 = UUIDjs.maxFromBits(8);
UUIDjs.limitUI12 = UUIDjs.maxFromBits(12);
UUIDjs.limitUI14 = UUIDjs.maxFromBits(14);
UUIDjs.limitUI16 = UUIDjs.maxFromBits(16);
UUIDjs.limitUI32 = UUIDjs.maxFromBits(32);
UUIDjs.limitUI40 = UUIDjs.maxFromBits(40);
UUIDjs.limitUI48 = UUIDjs.maxFromBits(48);

// Returns a random integer between min and max
// Using Math.round() will give you a non-uniform distribution!
// @see https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Math/random
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

UUIDjs.randomUI04 = function() {
  return getRandomInt(0, UUIDjs.limitUI04-1);
};
UUIDjs.randomUI06 = function() {
  return getRandomInt(0, UUIDjs.limitUI06-1);
};
UUIDjs.randomUI08 = function() {
  return getRandomInt(0, UUIDjs.limitUI08-1);
};
UUIDjs.randomUI12 = function() {
  return getRandomInt(0, UUIDjs.limitUI12-1);
};
UUIDjs.randomUI14 = function() {
  return getRandomInt(0, UUIDjs.limitUI14-1);
};
UUIDjs.randomUI16 = function() {
  return getRandomInt(0, UUIDjs.limitUI16-1);
};
UUIDjs.randomUI32 = function() {
  return getRandomInt(0, UUIDjs.limitUI32-1);
};
UUIDjs.randomUI40 = function() {
  return (0 | Math.random() * (1 << 30)) + (0 | Math.random() * (1 << 40 - 30)) * (1 << 30);
};
UUIDjs.randomUI48 = function() {
  return (0 | Math.random() * (1 << 30)) + (0 | Math.random() * (1 << 48 - 30)) * (1 << 30);
};

UUIDjs.paddedString = function(string, length, z) {
  string = String(string);
  z = (!z) ? '0' : z;
  var i = length - string.length;
  for (; i > 0; i >>>= 1, z += z) {
    if (i & 1) {
      string = z + string;
    }
  }
  return string;
};

UUIDjs.prototype.fromParts = function(timeLow, timeMid, timeHiAndVersion, clockSeqHiAndReserved, clockSeqLow, node) {
  this.version = (timeHiAndVersion >> 12) & 0xF;
  this.hex = UUIDjs.paddedString(timeLow.toString(16), 8)
             + '-'
             + UUIDjs.paddedString(timeMid.toString(16), 4)
             + '-'
             + UUIDjs.paddedString(timeHiAndVersion.toString(16), 4)
             + '-'
             + UUIDjs.paddedString(clockSeqHiAndReserved.toString(16), 2)
             + UUIDjs.paddedString(clockSeqLow.toString(16), 2)
             + '-'
             + UUIDjs.paddedString(node.toString(16), 12);
  return this;
};

UUIDjs.prototype.toString = function() {
  return this.hex;
};
UUIDjs.prototype.toURN = function() {
  return 'urn:uuid:' + this.hex;
};

UUIDjs.prototype.toBytes = function() {
  var parts = this.hex.split('-');
  var ints = [];
  var intPos = 0;
  for (var i = 0; i < parts.length; i++) {
    for (var j = 0; j < parts[i].length; j+=2) {
      ints[intPos++] = parseInt(parts[i].substr(j, 2), 16);
    }
  }
  return ints;
};

UUIDjs.prototype.equals = function(uuid) {
  if (!(uuid instanceof UUID)) {
    return false;
  }
  if (this.hex !== uuid.hex) {
    return false;
  }
  return true;
};

UUIDjs.getTimeFieldValues = function(time) {
  var ts = time - Date.UTC(1582, 9, 15);
  var hm = ((ts / 0x100000000) * 10000) & 0xFFFFFFF;
  return { low: ((ts & 0xFFFFFFF) * 10000) % 0x100000000,
            mid: hm & 0xFFFF, hi: hm >>> 16, timestamp: ts };
};

UUIDjs._create4 = function() {
  return new UUIDjs().fromParts(
    UUIDjs.randomUI32(),
    UUIDjs.randomUI16(),
    0x4000 | UUIDjs.randomUI12(),
    0x80   | UUIDjs.randomUI06(),
    UUIDjs.randomUI08(),
    UUIDjs.randomUI48()
  );
};

UUIDjs._create1 = function() {
  var now = new Date().getTime();
  var sequence = UUIDjs.randomUI14();
  var node = (UUIDjs.randomUI08() | 1) * 0x10000000000 + UUIDjs.randomUI40();
  var tick = UUIDjs.randomUI04();
  var timestamp = 0;
  var timestampRatio = 1/4;

  if (now != timestamp) {
    if (now < timestamp) {
      sequence++;
    }
    timestamp = now;
    tick = UUIDjs.randomUI04();
  } else if (Math.random() < timestampRatio && tick < 9984) {
    tick += 1 + UUIDjs.randomUI04();
  } else {
    sequence++;
  }

  var tf = UUIDjs.getTimeFieldValues(timestamp);
  var tl = tf.low + tick;
  var thav = (tf.hi & 0xFFF) | 0x1000;

  sequence &= 0x3FFF;
  var cshar = (sequence >>> 8) | 0x80;
  var csl = sequence & 0xFF;

  return new UUIDjs().fromParts(tl, tf.mid, thav, cshar, csl, node);
};

UUIDjs.create = function(version) {
  version = version || 4;
  return this['_create' + version]();
};

UUIDjs.fromTime = function(time, last) {
  last = (!last) ? false : last;
  var tf = UUIDjs.getTimeFieldValues(time);
  var tl = tf.low;
  var thav = (tf.hi & 0xFFF) | 0x1000;  // set version '0001'
  if (last === false) {
    return new UUIDjs().fromParts(tl, tf.mid, thav, 0, 0, 0);
  } else {
    return new UUIDjs().fromParts(tl, tf.mid, thav, 0x80 | UUIDjs.limitUI06, UUIDjs.limitUI08 - 1, UUIDjs.limitUI48 - 1);
  }
};

UUIDjs.firstFromTime = function(time) {
  return UUIDjs.fromTime(time, false);
};
UUIDjs.lastFromTime = function(time) {
  return UUIDjs.fromTime(time, true);
};

UUIDjs.fromURN = function(strId) {
  var r, p = /^(?:urn:uuid:|\{)?([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{2})([0-9a-f]{2})-([0-9a-f]{12})(?:\})?$/i;
  if ((r = p.exec(strId))) {
    return new UUIDjs().fromParts(parseInt(r[1], 16), parseInt(r[2], 16),
                            parseInt(r[3], 16), parseInt(r[4], 16),
                            parseInt(r[5], 16), parseInt(r[6], 16));
  }
  return null;
};

UUIDjs.fromBytes = function(ints) {
  if (ints.length < 5) {
    return null;
  }
  var str = '';
  var pos = 0;
  var parts = [4, 2, 2, 2, 6];
  for (var i = 0; i < parts.length; i++) {
    for (var j = 0; j < parts[i]; j++) {
      var octet = ints[pos++].toString(16);
      if (octet.length == 1) {
        octet = '0' + octet;
      }
      str += octet;
    }
    if (parts[i] !== 6) {
      str += '-';
    }
  }
  return UUIDjs.fromURN(str);
};

UUIDjs.fromBinary = function(binary) {
  var ints = [];
  for (var i = 0; i < binary.length; i++) {
    ints[i] = binary.charCodeAt(i);
    if (ints[i] > 255 || ints[i] < 0) {
      throw new Error('Unexpected byte in binary data.');
    }
  }
  return UUIDjs.fromBytes(ints);
};

// Aliases to support legacy code. Do not use these when writing new code as
// they may be removed in future versions!
UUIDjs.new = function() {
  return this.create(4);
};
UUIDjs.newTS = function() {
  return this.create(1);
};

//module.exports = UUIDjs;

define("uuid", function(){});

/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

var protocolMap = {
    "0":{
        "value":"0",
        "name":"HOPOPT",
        "description":"IPv6 Hop-by-Hop Option"
    },
    "1":{
        "value":"1",
        "name":"ICMP",
        "description":"Internet Control Message"
    },
    "2":{
        "value":"2",
        "name":"IGMP",
        "description":"Internet Group Management"
    },
    "3":{
        "value":"3",
        "name":"GGP",
        "description":"Gateway-to-Gateway"
    },
    "4":{
        "value":"4",
        "name":"IPv4",
        "description":"IPv4 encapsulation"
    },
    "5":{
        "value":"5",
        "name":"ST",
        "description":"Stream"
    },
    "6":{
        "value":"6",
        "name":"TCP",
        "description":"Transmission Control"
    },
    "7":{
        "value":"7",
        "name":"CBT",
        "description":"CBT"
    },
    "8":{
        "value":"8",
        "name":"EGP",
        "description":"Exterior Gateway Protocol"
    },
    "9":{
        "value":"9",
        "name":"IGP",
        "description":"Any private interior Gateway"
    },
    "10":{
        "value":"10",
        "name":"BBN-RCC-MON",
        "description":"BBN RCC Monitoring"
    },
    "11":{
        "value":"11",
        "name":"NVP-II",
        "description":"Network Voice Protocol"
    },
    "12":{
        "value":"12",
        "name":"PUP",
        "description":"PUP"
    },
    "13":{
        "value":"13",
        "name":"ARGUS",
        "description":"ARGUS"
    },
    "14":{
        "value":"14",
        "name":"EMCON",
        "description":"EMCON"
    },
    "15":{
        "value":"15",
        "name":"XNET",
        "description":"Cross Net Debugger"
    },
    "16":{
        "value":"16",
        "name":"CHAOS",
        "description":"Chaos"
    },
    "17":{
        "value":"17",
        "name":"UDP",
        "description":"User Datagram"
    },
    "18":{
        "value":"18",
        "name":"MUX",
        "description":"Multiplexing"
    },
    "19":{
        "value":"19",
        "name":"DCN-MEAS",
        "description":"DCN Measurement Subsystems"
    },
    "20":{
        "value":"20",
        "name":"HMP",
        "description":"Host Monitoring"
    },
    "21":{
        "value":"21",
        "name":"PRM",
        "description":"Packet Radio Measurement"
    },
    "22":{
        "value":"22",
        "name":"XNS-IDP",
        "description":"XEROX NS IDP"
    },
    "23":{
        "value":"23",
        "name":"TRUNK-1",
        "description":"Trunk-1"
    },
    "24":{
        "value":"24",
        "name":"TRUNK-2",
        "description":"Trunk-2"
    },
    "25":{
        "value":"25",
        "name":"LEAF-1",
        "description":"Leaf-1"
    },
    "26":{
        "value":"26",
        "name":"LEAF-2",
        "description":"Leaf-2"
    },
    "27":{
        "value":"27",
        "name":"RDP",
        "description":"Reliable Data Protocol"
    },
    "28":{
        "value":"28",
        "name":"IRTP",
        "description":"Internet Reliable Transaction"
    },
    "29":{
        "value":"29",
        "name":"ISO-TP4",
        "description":"ISO Transport Protocol Class 4"
    },
    "30":{
        "value":"30",
        "name":"NETBLT",
        "description":"Bulk Data Transfer Protocol"
    },
    "31":{
        "value":"31",
        "name":"MFE-NSP",
        "description":"MFE Network Services Protocol"
    },
    "32":{
        "value":"32",
        "name":"MERIT-INP",
        "description":"MERIT Internodal Protocol"
    },
    "33":{
        "value":"33",
        "name":"DCCP",
        "description":"Datagram Congestion Control Protocol"
    },
    "34":{
        "value":"34",
        "name":"3PC",
        "description":"Third Party Connect Protocol"
    },
    "35":{
        "value":"35",
        "name":"IDPR",
        "description":"Inter-Domain Policy Routing Protocol"
    },
    "36":{
        "value":"36",
        "name":"XTP",
        "description":"XTP"
    },
    "37":{
        "value":"37",
        "name":"DDP",
        "description":"Datagram Delivery Protocol"
    },
    "38":{
        "value":"38",
        "name":"IDPR-CMTP",
        "description":"IDPR Control Message Transport Proto"
    },
    "39":{
        "value":"39",
        "name":"TP++",
        "description":"TP++ Transport Protocol"
    },
    "40":{
        "value":"40",
        "name":"IL",
        "description":"IL Transport Protocol"
    },
    "41":{
        "value":"41",
        "name":"IPv6",
        "description":"IPv6 encapsulation"
    },
    "42":{
        "value":"42",
        "name":"SDRP",
        "description":"Source Demand Routing Protocol"
    },
    "43":{
        "value":"43",
        "name":"IPv6-Route",
        "description":"Routing Header for IPv6"
    },
    "44":{
        "value":"44",
        "name":"IPv6-Frag",
        "description":"Fragment Header for IPv6"
    },
    "45":{
        "value":"45",
        "name":"IDRP",
        "description":"Inter-Domain Routing Protocol"
    },
    "46":{
        "value":"46",
        "name":"RSVP",
        "description":"Reservation Protocol"
    },
    "47":{
        "value":"47",
        "name":"GRE",
        "description":"Generic Routing Encapsulation"
    },
    "48":{
        "value":"48",
        "name":"DSR",
        "description":"Dynamic Source Routing Protocol"
    },
    "49":{
        "value":"49",
        "name":"BNA",
        "description":"BNA"
    },
    "50":{
        "value":"50",
        "name":"ESP",
        "description":"Encap Security Payload"
    },
    "51":{
        "value":"51",
        "name":"AH",
        "description":"Authentication Header"
    },
    "52":{
        "value":"52",
        "name":"I-NLSP",
        "description":"Integrated Net Layer Security  TUBA"
    },
    "53":{
        "value":"53",
        "name":"SWIPE",
        "description":"IP with Encryption"
    },
    "54":{
        "value":"54",
        "name":"NARP",
        "description":"NBMA Address Resolution Protocol"
    },
    "55":{
        "value":"55",
        "name":"MOBILE",
        "description":"IP Mobility"
    },
    "56":{
        "value":"56",
        "name":"TLSP"
    },
    "57":{
        "value":"57",
        "name":"SKIP",
        "description":"SKIP"
    },
    "58":{
        "value":"58",
        "name":"IPv6-ICMP",
        "description":"ICMP for IPv6"
    },
    "59":{
        "value":"59",
        "name":"IPv6-NoNxt",
        "description":"No Next Header for IPv6"
    },
    "60":{
        "value":"60",
        "name":"IPv6-Opts",
        "description":"Destination Options for IPv6"
    },
    "62":{
        "value":"62",
        "name":"CFTP",
        "description":"CFTP"
    },
    "64":{
        "value":"64",
        "name":"SAT-EXPAK",
        "description":"SATNET and Backroom EXPAK"
    },
    "65":{
        "value":"65",
        "name":"KRYPTOLAN",
        "description":"Kryptolan"
    },
    "66":{
        "value":"66",
        "name":"RVD",
        "description":"MIT Remote Virtual Disk Protocol"
    },
    "67":{
        "value":"67",
        "name":"IPPC",
        "description":"Internet Pluribus Packet Core"
    },
    "69":{
        "value":"69",
        "name":"SAT-MON",
        "description":"SATNET Monitoring"
    },
    "70":{
        "value":"70",
        "name":"VISA",
        "description":"VISA Protocol"
    },
    "71":{
        "value":"71",
        "name":"IPCV",
        "description":"Internet Packet Core Utility"
    },
    "72":{
        "value":"72",
        "name":"CPNX",
        "description":"Computer Protocol Network Executive"
    },
    "73":{
        "value":"73",
        "name":"CPHB",
        "description":"Computer Protocol Heart Beat"
    },
    "74":{
        "value":"74",
        "name":"WSN",
        "description":"Wang Span Network"
    },
    "75":{
        "value":"75",
        "name":"PVP",
        "description":"Packet Video Protocol"
    },
    "76":{
        "value":"76",
        "name":"BR-SAT-MON",
        "description":"Backroom SATNET Monitoring"
    },
    "77":{
        "value":"77",
        "name":"SUN-ND",
        "description":"SUN ND PROTOCOL-Temporary"
    },
    "78":{
        "value":"78",
        "name":"WB-MON",
        "description":"WIDEBAND Monitoring"
    },
    "79":{
        "value":"79",
        "name":"WB-EXPAK",
        "description":"WIDEBAND EXPAK"
    },
    "80":{
        "value":"80",
        "name":"ISO-IP",
        "description":"ISO Internet Protocol"
    },
    "81":{
        "value":"81",
        "name":"VMTP",
        "description":"VMTP"
    },
    "82":{
        "value":"82",
        "name":"SECURE-VMTP",
        "description":"SECURE-VMTP"
    },
    "83":{
        "value":"83",
        "name":"VINES",
        "description":"VINES"
    },
    "84":{
        "value":"84",
        "name":"IPTM",
        "description":"Protocol Internet Protocol Traffic Manager"
    },
    "85":{
        "value":"85",
        "name":"NSFNET-IGP",
        "description":"NSFNET-IGP"
    },
    "86":{
        "value":"86",
        "name":"DGP",
        "description":"Dissimilar Gateway Protocol"
    },
    "87":{
        "value":"87",
        "name":"TCF",
        "description":"TCF"
    },
    "88":{
        "value":"88",
        "name":"EIGRP",
        "description":"EIGRP"
    },
    "89":{
        "value":"89",
        "name":"OSPFIGP",
        "description":"OSPFIGP"
    },
    "90":{
        "value":"90",
        "name":"Sprite-RPC",
        "description":"Sprite RPC Protocol"
    },
    "91":{
        "value":"91",
        "name":"LARP",
        "description":"Locus Address Resolution Protocol"
    },
    "92":{
        "value":"92",
        "name":"MTP",
        "description":"Multicast Transport Protocol"
    },
    "93":{
        "value":"93",
        "name":"AX.25",
        "description":"AX.25 Frames"
    },
    "94":{
        "value":"94",
        "name":"IPIP",
        "description":"IP-within-IP Encapsulation Protocol"
    },
    "95":{
        "value":"95",
        "name":"MICP",
        "description":"Mobile Internetworking Control Pro."
    },
    "96":{
        "value":"96",
        "name":"SCC-SP",
        "description":"Semaphore Communications Sec. Pro."
    },
    "97":{
        "value":"97",
        "name":"ETHERIP",
        "description":"Ethernet-within-IP Encapsulation"
    },
    "98":{
        "value":"98",
        "name":"ENCAP",
        "description":"Encapsulation Header"
    },
    "100":{
        "value":"100",
        "name":"GMTP",
        "description":"GMTP"
    },
    "101":{
        "value":"101",
        "name":"IFMP",
        "description":"Ipsilon Flow Management Protocol"
    },
    "102":{
        "value":"102",
        "name":"PNNI",
        "description":"PNNI over IP"
    },
    "103":{
        "value":"103",
        "name":"PIM",
        "description":"Protocol Independent Multicast"
    },
    "104":{
        "value":"104",
        "name":"ARIS",
        "description":"ARIS"
    },
    "105":{
        "value":"105",
        "name":"SCPS",
        "description":"SCPS"
    },
    "106":{
        "value":"106",
        "name":"QNX",
        "description":"QNX"
    },
    "107":{
        "value":"107",
        "name":"A/N",
        "description":"Active Networks"
    },
    "108":{
        "value":"108",
        "name":"IPComp",
        "description":"IP Payload Compression Protocol"
    },
    "109":{
        "value":"109",
        "name":"SNP",
        "description":"Sitara Networks Protocol"
    },
    "110":{
        "value":"110",
        "name":"Compaq-Peer",
        "description":"Compaq Peer Protocol"
    },
    "111":{
        "value":"111",
        "name":"IPX-in-IP",
        "description":"IPX in IP"
    },
    "112":{
        "value":"112",
        "name":"VRRP",
        "description":"Virtual Router Redundancy Protocol"
    },
    "113":{
        "value":"113",
        "name":"PGM",
        "description":"PGM Reliable Transport Protocol"
    },
    "115":{
        "value":"115",
        "name":"L2TP",
        "description":"Layer Two Tunneling Protocol"
    },
    "116":{
        "value":"116",
        "name":"DDX",
        "description":"D-II Data Exchange (DDX)"
    },
    "117":{
        "value":"117",
        "name":"IATP",
        "description":"Interactive Agent Transfer Protocol"
    },
    "118":{
        "value":"118",
        "name":"STP",
        "description":"Schedule Transfer Protocol"
    },
    "119":{
        "value":"119",
        "name":"SRP",
        "description":"SpectraLink Radio Protocol"
    },
    "120":{
        "value":"120",
        "name":"UTI",
        "description":"UTI"
    },
    "121":{
        "value":"121",
        "name":"SMP",
        "description":"Simple Message Protocol"
    },
    "122":{
        "value":"122",
        "name":"SM",
        "description":"SM"
    },
    "123":{
        "value":"123",
        "name":"PTP",
        "description":"Performance Transparency Protocol"
    },
    "126":{
        "value":"126",
        "name":"CRTP",
        "description":"Combat Radio Transport Protocol"
    },
    "127":{
        "value":"127",
        "name":"CRUDP",
        "description":"Combat Radio User Datagram"
    },
    "128":{
        "value":"128",
        "name":"SSCOPMCE"
    },
    "129":{
        "value":"129",
        "name":"IPLT"
    },
    "130":{
        "value":"130",
        "name":"SPS",
        "description":"Secure Packet Shield"
    },
    "131":{
        "value":"131",
        "name":"PIPE",
        "description":"Private IP Encapsulation within IP"
    },
    "132":{
        "value":"132",
        "name":"SCTP",
        "description":"Stream Control Transmission Protocol"
    },
    "133":{
        "value":"133",
        "name":"FC",
        "description":"Fibre Channel"
    },
    "134":{
        "value":"134",
        "name":"RSVP-E2E-IGNORE"
    },
    "135":{
        "value":"135",
        "name":"Mobility Header"
    },
    "136":{
        "value":"136",
        "name":"UDPLite"
    },
    "137":{
        "value":"137",
        "name":"MPLS-in-IP"
    },
    "138":{
        "value":"138",
        "name":"manet",
        "description":"MANET Protocols"
    },
    "139":{
        "value":"139",
        "name":"HIP",
        "description":"Host Identity Protocol"
    },
    "140":{
        "value":"140",
        "name":"Shim6",
        "description":"Shim6 Protocol"
    },
    "141":{
        "value":"141",
        "name":"WESP",
        "description":"Wrapped Encapsulating Security Payload"
    },
    "142":{
        "value":"142",
        "name":"ROHC",
        "description":"Robust Header Compression"
    },
    "255":{
        "value":"255",
        "name":"Reserved"
    }
};

var protocolList = [
    {
        "value":"0",
        "name":"HOPOPT",
        "description":"IPv6 Hop-by-Hop Option"
    },
    {
        "value":"1",
        "name":"ICMP",
        "description":"Internet Control Message"
    },
    {
        "value":"2",
        "name":"IGMP",
        "description":"Internet Group Management"
    },
    {
        "value":"3",
        "name":"GGP",
        "description":"Gateway-to-Gateway"
    },
    {
        "value":"4",
        "name":"IPv4",
        "description":"IPv4 encapsulation"
    },
    {
        "value":"5",
        "name":"ST",
        "description":"Stream"
    },
    {
        "value":"6",
        "name":"TCP",
        "description":"Transmission Control"
    },
    {
        "value":"7",
        "name":"CBT",
        "description":"CBT"
    },
    {
        "value":"8",
        "name":"EGP",
        "description":"Exterior Gateway Protocol"
    },
    {
        "value":"9",
        "name":"IGP",
        "description":"Any private interior Gateway"
    },
    {
        "value":"10",
        "name":"BBN-RCC-MON",
        "description":"BBN RCC Monitoring"
    },
    {
        "value":"11",
        "name":"NVP-II",
        "description":"Network Voice Protocol"
    },
    {
        "value":"12",
        "name":"PUP",
        "description":"PUP"
    },
    {
        "value":"13",
        "name":"ARGUS",
        "description":"ARGUS"
    },
    {
        "value":"14",
        "name":"EMCON",
        "description":"EMCON"
    },
    {
        "value":"15",
        "name":"XNET",
        "description":"Cross Net Debugger"
    },
    {
        "value":"16",
        "name":"CHAOS",
        "description":"Chaos"
    },
    {
        "value":"17",
        "name":"UDP",
        "description":"User Datagram"
    },
    {
        "value":"18",
        "name":"MUX",
        "description":"Multiplexing"
    },
    {
        "value":"19",
        "name":"DCN-MEAS",
        "description":"DCN Measurement Subsystems"
    },
    {
        "value":"20",
        "name":"HMP",
        "description":"Host Monitoring"
    },
    {
        "value":"21",
        "name":"PRM",
        "description":"Packet Radio Measurement"
    },
    {
        "value":"22",
        "name":"XNS-IDP",
        "description":"XEROX NS IDP"
    },
    {
        "value":"23",
        "name":"TRUNK-1",
        "description":"Trunk-1"
    },
    {
        "value":"24",
        "name":"TRUNK-2",
        "description":"Trunk-2"
    },
    {
        "value":"25",
        "name":"LEAF-1",
        "description":"Leaf-1"
    },
    {
        "value":"26",
        "name":"LEAF-2",
        "description":"Leaf-2"
    },
    {
        "value":"27",
        "name":"RDP",
        "description":"Reliable Data Protocol"
    },
    {
        "value":"28",
        "name":"IRTP",
        "description":"Internet Reliable Transaction"
    },
    {
        "value":"29",
        "name":"ISO-TP4",
        "description":"ISO Transport Protocol Class 4"
    },
    {
        "value":"30",
        "name":"NETBLT",
        "description":"Bulk Data Transfer Protocol"
    },
    {
        "value":"31",
        "name":"MFE-NSP",
        "description":"MFE Network Services Protocol"
    },
    {
        "value":"32",
        "name":"MERIT-INP",
        "description":"MERIT Internodal Protocol"
    },
    {
        "value":"33",
        "name":"DCCP",
        "description":"Datagram Congestion Control Protocol"
    },
    {
        "value":"34",
        "name":"3PC",
        "description":"Third Party Connect Protocol"
    },
    {
        "value":"35",
        "name":"IDPR",
        "description":"Inter-Domain Policy Routing Protocol"
    },
    {
        "value":"36",
        "name":"XTP",
        "description":"XTP"
    },
    {
        "value":"37",
        "name":"DDP",
        "description":"Datagram Delivery Protocol"
    },
    {
        "value":"38",
        "name":"IDPR-CMTP",
        "description":"IDPR Control Message Transport Proto"
    },
    {
        "value":"39",
        "name":"TP++",
        "description":"TP++ Transport Protocol"
    },
    {
        "value":"40",
        "name":"IL",
        "description":"IL Transport Protocol"
    },
    {
        "value":"41",
        "name":"IPv6",
        "description":"IPv6 encapsulation"
    },
    {
        "value":"42",
        "name":"SDRP",
        "description":"Source Demand Routing Protocol"
    },
    {
        "value":"43",
        "name":"IPv6-Route",
        "description":"Routing Header for IPv6"
    },
    {
        "value":"44",
        "name":"IPv6-Frag",
        "description":"Fragment Header for IPv6"
    },
    {
        "value":"45",
        "name":"IDRP",
        "description":"Inter-Domain Routing Protocol"
    },
    {
        "value":"46",
        "name":"RSVP",
        "description":"Reservation Protocol"
    },
    {
        "value":"47",
        "name":"GRE",
        "description":"Generic Routing Encapsulation"
    },
    {
        "value":"48",
        "name":"DSR",
        "description":"Dynamic Source Routing Protocol"
    },
    {
        "value":"49",
        "name":"BNA",
        "description":"BNA"
    },
    {
        "value":"50",
        "name":"ESP",
        "description":"Encap Security Payload"
    },
    {
        "value":"51",
        "name":"AH",
        "description":"Authentication Header"
    },
    {
        "value":"52",
        "name":"I-NLSP",
        "description":"Integrated Net Layer Security  TUBA"
    },
    {
        "value":"53",
        "name":"SWIPE",
        "description":"IP with Encryption"
    },
    {
        "value":"54",
        "name":"NARP",
        "description":"NBMA Address Resolution Protocol"
    },
    {
        "value":"55",
        "name":"MOBILE",
        "description":"IP Mobility"
    },
    {
        "value":"56",
        "name":"TLSP"
    },
    {
        "value":"57",
        "name":"SKIP",
        "description":"SKIP"
    },
    {
        "value":"58",
        "name":"IPv6-ICMP",
        "description":"ICMP for IPv6"
    },
    {
        "value":"59",
        "name":"IPv6-NoNxt",
        "description":"No Next Header for IPv6"
    },
    {
        "value":"60",
        "name":"IPv6-Opts",
        "description":"Destination Options for IPv6"
    },
    {
        "value":"62",
        "name":"CFTP",
        "description":"CFTP"
    },
    {
        "value":"64",
        "name":"SAT-EXPAK",
        "description":"SATNET and Backroom EXPAK"
    },
    {
        "value":"65",
        "name":"KRYPTOLAN",
        "description":"Kryptolan"
    },
    {
        "value":"66",
        "name":"RVD",
        "description":"MIT Remote Virtual Disk Protocol"
    },
    {
        "value":"67",
        "name":"IPPC",
        "description":"Internet Pluribus Packet Core"
    },
    {
        "value":"69",
        "name":"SAT-MON",
        "description":"SATNET Monitoring"
    },
    {
        "value":"70",
        "name":"VISA",
        "description":"VISA Protocol"
    },
    {
        "value":"71",
        "name":"IPCV",
        "description":"Internet Packet Core Utility"
    },
    {
        "value":"72",
        "name":"CPNX",
        "description":"Computer Protocol Network Executive"
    },
    {
        "value":"73",
        "name":"CPHB",
        "description":"Computer Protocol Heart Beat"
    },
    {
        "value":"74",
        "name":"WSN",
        "description":"Wang Span Network"
    },
    {
        "value":"75",
        "name":"PVP",
        "description":"Packet Video Protocol"
    },
    {
        "value":"76",
        "name":"BR-SAT-MON",
        "description":"Backroom SATNET Monitoring"
    },
    {
        "value":"77",
        "name":"SUN-ND",
        "description":"SUN ND PROTOCOL-Temporary"
    },
    {
        "value":"78",
        "name":"WB-MON",
        "description":"WIDEBAND Monitoring"
    },
    {
        "value":"79",
        "name":"WB-EXPAK",
        "description":"WIDEBAND EXPAK"
    },
    {
        "value":"80",
        "name":"ISO-IP",
        "description":"ISO Internet Protocol"
    },
    {
        "value":"81",
        "name":"VMTP",
        "description":"VMTP"
    },
    {
        "value":"82",
        "name":"SECURE-VMTP",
        "description":"SECURE-VMTP"
    },
    {
        "value":"83",
        "name":"VINES",
        "description":"VINES"
    },
    {
        "value":"84",
        "name":"IPTM",
        "description":"Protocol Internet Protocol Traffic Manager"
    },
    {
        "value":"85",
        "name":"NSFNET-IGP",
        "description":"NSFNET-IGP"
    },
    {
        "value":"86",
        "name":"DGP",
        "description":"Dissimilar Gateway Protocol"
    },
    {
        "value":"87",
        "name":"TCF",
        "description":"TCF"
    },
    {
        "value":"88",
        "name":"EIGRP",
        "description":"EIGRP"
    },
    {
        "value":"89",
        "name":"OSPFIGP",
        "description":"OSPFIGP"
    },
    {
        "value":"90",
        "name":"Sprite-RPC",
        "description":"Sprite RPC Protocol"
    },
    {
        "value":"91",
        "name":"LARP",
        "description":"Locus Address Resolution Protocol"
    },
    {
        "value":"92",
        "name":"MTP",
        "description":"Multicast Transport Protocol"
    },
    {
        "value":"93",
        "name":"AX.25",
        "description":"AX.25 Frames"
    },
    {
        "value":"94",
        "name":"IPIP",
        "description":"IP-within-IP Encapsulation Protocol"
    },
    {
        "value":"95",
        "name":"MICP",
        "description":"Mobile Internetworking Control Pro."
    },
    {
        "value":"96",
        "name":"SCC-SP",
        "description":"Semaphore Communications Sec. Pro."
    },
    {
        "value":"97",
        "name":"ETHERIP",
        "description":"Ethernet-within-IP Encapsulation"
    },
    {
        "value":"98",
        "name":"ENCAP",
        "description":"Encapsulation Header"
    },
    {
        "value":"100",
        "name":"GMTP",
        "description":"GMTP"
    },
    {
        "value":"101",
        "name":"IFMP",
        "description":"Ipsilon Flow Management Protocol"
    },
    {
        "value":"102",
        "name":"PNNI",
        "description":"PNNI over IP"
    },
    {
        "value":"103",
        "name":"PIM",
        "description":"Protocol Independent Multicast"
    },
    {
        "value":"104",
        "name":"ARIS",
        "description":"ARIS"
    },
    {
        "value":"105",
        "name":"SCPS",
        "description":"SCPS"
    },
    {
        "value":"106",
        "name":"QNX",
        "description":"QNX"
    },
    {
        "value":"107",
        "name":"A/N",
        "description":"Active Networks"
    },
    {
        "value":"108",
        "name":"IPComp",
        "description":"IP Payload Compression Protocol"
    },
    {
        "value":"109",
        "name":"SNP",
        "description":"Sitara Networks Protocol"
    },
    {
        "value":"110",
        "name":"Compaq-Peer",
        "description":"Compaq Peer Protocol"
    },
    {
        "value":"111",
        "name":"IPX-in-IP",
        "description":"IPX in IP"
    },
    {
        "value":"112",
        "name":"VRRP",
        "description":"Virtual Router Redundancy Protocol"
    },
    {
        "value":"113",
        "name":"PGM",
        "description":"PGM Reliable Transport Protocol"
    },
    {
        "value":"115",
        "name":"L2TP",
        "description":"Layer Two Tunneling Protocol"
    },
    {
        "value":"116",
        "name":"DDX",
        "description":"D-II Data Exchange (DDX)"
    },
    {
        "value":"117",
        "name":"IATP",
        "description":"Interactive Agent Transfer Protocol"
    },
    {
        "value":"118",
        "name":"STP",
        "description":"Schedule Transfer Protocol"
    },
    {
        "value":"119",
        "name":"SRP",
        "description":"SpectraLink Radio Protocol"
    },
    {
        "value":"120",
        "name":"UTI",
        "description":"UTI"
    },
    {
        "value":"121",
        "name":"SMP",
        "description":"Simple Message Protocol"
    },
    {
        "value":"122",
        "name":"SM",
        "description":"SM"
    },
    {
        "value":"123",
        "name":"PTP",
        "description":"Performance Transparency Protocol"
    },
    {
        "value":"126",
        "name":"CRTP",
        "description":"Combat Radio Transport Protocol"
    },
    {
        "value":"127",
        "name":"CRUDP",
        "description":"Combat Radio User Datagram"
    },
    {
        "value":"128",
        "name":"SSCOPMCE"
    },
    {
        "value":"129",
        "name":"IPLT"
    },
    {
        "value":"130",
        "name":"SPS",
        "description":"Secure Packet Shield"
    },
    {
        "value":"131",
        "name":"PIPE",
        "description":"Private IP Encapsulation within IP"
    },
    {
        "value":"132",
        "name":"SCTP",
        "description":"Stream Control Transmission Protocol"
    },
    {
        "value":"133",
        "name":"FC",
        "description":"Fibre Channel"
    },
    {
        "value":"134",
        "name":"RSVP-E2E-IGNORE"
    },
    {
        "value":"135",
        "name":"Mobility Header"
    },
    {
        "value":"136",
        "name":"UDPLite"
    },
    {
        "value":"137",
        "name":"MPLS-in-IP"
    },
    {
        "value":"138",
        "name":"manet",
        "description":"MANET Protocols"
    },
    {
        "value":"139",
        "name":"HIP",
        "description":"Host Identity Protocol"
    },
    {
        "value":"140",
        "name":"Shim6",
        "description":"Shim6 Protocol"
    },
    {
        "value":"141",
        "name":"WESP",
        "description":"Wrapped Encapsulating Security Payload"
    },
    {
        "value":"142",
        "name":"ROHC",
        "description":"Robust Header Compression"
    },
    {
        "value":"255",
        "name":"Reserved"
    }
];

function getProtocolName(protocolNumber) {
    var protocol = protocolMap[protocolNumber],
        protocolName;
    if (protocol != null) {
        protocolName = protocol['name'];
    } else {
        protocolName = protocolNumber;
    }
    return protocolName;
};
define("protocol", function(){});

//! moment.js
//! version : 2.6.0
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com

(function (undefined) {

    /************************************
        Constants
    ************************************/

    var moment,
        VERSION = "2.6.0",
        // the global-scope this is NOT the global object in Node.js
        globalScope = typeof global !== 'undefined' ? global : this,
        oldGlobalMoment,
        round = Math.round,
        i,

        YEAR = 0,
        MONTH = 1,
        DATE = 2,
        HOUR = 3,
        MINUTE = 4,
        SECOND = 5,
        MILLISECOND = 6,

        // internal storage for language config files
        languages = {},

        // moment internal properties
        momentProperties = {
            _isAMomentObject: null,
            _i : null,
            _f : null,
            _l : null,
            _strict : null,
            _isUTC : null,
            _offset : null,  // optional. Combine with _isUTC
            _pf : null,
            _lang : null  // optional
        },

        // check for nodeJS
        hasModule = (typeof module !== 'undefined' && module.exports),

        // ASP.NET json date format regex
        aspNetJsonRegex = /^\/?Date\((\-?\d+)/i,
        aspNetTimeSpanJsonRegex = /(\-)?(?:(\d*)\.)?(\d+)\:(\d+)(?:\:(\d+)\.?(\d{3})?)?/,

        // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
        // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
        isoDurationRegex = /^(-)?P(?:(?:([0-9,.]*)Y)?(?:([0-9,.]*)M)?(?:([0-9,.]*)D)?(?:T(?:([0-9,.]*)H)?(?:([0-9,.]*)M)?(?:([0-9,.]*)S)?)?|([0-9,.]*)W)$/,

        // format tokens
        formattingTokens = /(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Q|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|S{1,4}|X|zz?|ZZ?|.)/g,
        localFormattingTokens = /(\[[^\[]*\])|(\\)?(LT|LL?L?L?|l{1,4})/g,

        // parsing token regexes
        parseTokenOneOrTwoDigits = /\d\d?/, // 0 - 99
        parseTokenOneToThreeDigits = /\d{1,3}/, // 0 - 999
        parseTokenOneToFourDigits = /\d{1,4}/, // 0 - 9999
        parseTokenOneToSixDigits = /[+\-]?\d{1,6}/, // -999,999 - 999,999
        parseTokenDigits = /\d+/, // nonzero number of digits
        parseTokenWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i, // any word (or two) characters or numbers including two/three word month in arabic.
        parseTokenTimezone = /Z|[\+\-]\d\d:?\d\d/gi, // +00:00 -00:00 +0000 -0000 or Z
        parseTokenT = /T/i, // T (ISO separator)
        parseTokenTimestampMs = /[\+\-]?\d+(\.\d{1,3})?/, // 123456789 123456789.123
        parseTokenOrdinal = /\d{1,2}/,

        //strict parsing regexes
        parseTokenOneDigit = /\d/, // 0 - 9
        parseTokenTwoDigits = /\d\d/, // 00 - 99
        parseTokenThreeDigits = /\d{3}/, // 000 - 999
        parseTokenFourDigits = /\d{4}/, // 0000 - 9999
        parseTokenSixDigits = /[+-]?\d{6}/, // -999,999 - 999,999
        parseTokenSignedNumber = /[+-]?\d+/, // -inf - inf

        // iso 8601 regex
        // 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
        isoRegex = /^\s*(?:[+-]\d{6}|\d{4})-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/,

        isoFormat = 'YYYY-MM-DDTHH:mm:ssZ',

        isoDates = [
            ['YYYYYY-MM-DD', /[+-]\d{6}-\d{2}-\d{2}/],
            ['YYYY-MM-DD', /\d{4}-\d{2}-\d{2}/],
            ['GGGG-[W]WW-E', /\d{4}-W\d{2}-\d/],
            ['GGGG-[W]WW', /\d{4}-W\d{2}/],
            ['YYYY-DDD', /\d{4}-\d{3}/]
        ],

        // iso time formats and regexes
        isoTimes = [
            ['HH:mm:ss.SSSS', /(T| )\d\d:\d\d:\d\d\.\d+/],
            ['HH:mm:ss', /(T| )\d\d:\d\d:\d\d/],
            ['HH:mm', /(T| )\d\d:\d\d/],
            ['HH', /(T| )\d\d/]
        ],

        // timezone chunker "+10:00" > ["10", "00"] or "-1530" > ["-15", "30"]
        parseTimezoneChunker = /([\+\-]|\d\d)/gi,

        // getter and setter names
        proxyGettersAndSetters = 'Date|Hours|Minutes|Seconds|Milliseconds'.split('|'),
        unitMillisecondFactors = {
            'Milliseconds' : 1,
            'Seconds' : 1e3,
            'Minutes' : 6e4,
            'Hours' : 36e5,
            'Days' : 864e5,
            'Months' : 2592e6,
            'Years' : 31536e6
        },

        unitAliases = {
            ms : 'millisecond',
            s : 'second',
            m : 'minute',
            h : 'hour',
            d : 'day',
            D : 'date',
            w : 'week',
            W : 'isoWeek',
            M : 'month',
            Q : 'quarter',
            y : 'year',
            DDD : 'dayOfYear',
            e : 'weekday',
            E : 'isoWeekday',
            gg: 'weekYear',
            GG: 'isoWeekYear'
        },

        camelFunctions = {
            dayofyear : 'dayOfYear',
            isoweekday : 'isoWeekday',
            isoweek : 'isoWeek',
            weekyear : 'weekYear',
            isoweekyear : 'isoWeekYear'
        },

        // format function strings
        formatFunctions = {},

        // tokens to ordinalize and pad
        ordinalizeTokens = 'DDD w W M D d'.split(' '),
        paddedTokens = 'M D H h m s w W'.split(' '),

        formatTokenFunctions = {
            M    : function () {
                return this.month() + 1;
            },
            MMM  : function (format) {
                return this.lang().monthsShort(this, format);
            },
            MMMM : function (format) {
                return this.lang().months(this, format);
            },
            D    : function () {
                return this.date();
            },
            DDD  : function () {
                return this.dayOfYear();
            },
            d    : function () {
                return this.day();
            },
            dd   : function (format) {
                return this.lang().weekdaysMin(this, format);
            },
            ddd  : function (format) {
                return this.lang().weekdaysShort(this, format);
            },
            dddd : function (format) {
                return this.lang().weekdays(this, format);
            },
            w    : function () {
                return this.week();
            },
            W    : function () {
                return this.isoWeek();
            },
            YY   : function () {
                return leftZeroFill(this.year() % 100, 2);
            },
            YYYY : function () {
                return leftZeroFill(this.year(), 4);
            },
            YYYYY : function () {
                return leftZeroFill(this.year(), 5);
            },
            YYYYYY : function () {
                var y = this.year(), sign = y >= 0 ? '+' : '-';
                return sign + leftZeroFill(Math.abs(y), 6);
            },
            gg   : function () {
                return leftZeroFill(this.weekYear() % 100, 2);
            },
            gggg : function () {
                return leftZeroFill(this.weekYear(), 4);
            },
            ggggg : function () {
                return leftZeroFill(this.weekYear(), 5);
            },
            GG   : function () {
                return leftZeroFill(this.isoWeekYear() % 100, 2);
            },
            GGGG : function () {
                return leftZeroFill(this.isoWeekYear(), 4);
            },
            GGGGG : function () {
                return leftZeroFill(this.isoWeekYear(), 5);
            },
            e : function () {
                return this.weekday();
            },
            E : function () {
                return this.isoWeekday();
            },
            a    : function () {
                return this.lang().meridiem(this.hours(), this.minutes(), true);
            },
            A    : function () {
                return this.lang().meridiem(this.hours(), this.minutes(), false);
            },
            H    : function () {
                return this.hours();
            },
            h    : function () {
                return this.hours() % 12 || 12;
            },
            m    : function () {
                return this.minutes();
            },
            s    : function () {
                return this.seconds();
            },
            S    : function () {
                return toInt(this.milliseconds() / 100);
            },
            SS   : function () {
                return leftZeroFill(toInt(this.milliseconds() / 10), 2);
            },
            SSS  : function () {
                return leftZeroFill(this.milliseconds(), 3);
            },
            SSSS : function () {
                return leftZeroFill(this.milliseconds(), 3);
            },
            Z    : function () {
                var a = -this.zone(),
                    b = "+";
                if (a < 0) {
                    a = -a;
                    b = "-";
                }
                return b + leftZeroFill(toInt(a / 60), 2) + ":" + leftZeroFill(toInt(a) % 60, 2);
            },
            ZZ   : function () {
                var a = -this.zone(),
                    b = "+";
                if (a < 0) {
                    a = -a;
                    b = "-";
                }
                return b + leftZeroFill(toInt(a / 60), 2) + leftZeroFill(toInt(a) % 60, 2);
            },
            z : function () {
                return this.zoneAbbr();
            },
            zz : function () {
                return this.zoneName();
            },
            X    : function () {
                return this.unix();
            },
            Q : function () {
                return this.quarter();
            }
        },

        lists = ['months', 'monthsShort', 'weekdays', 'weekdaysShort', 'weekdaysMin'];

    function defaultParsingFlags() {
        // We need to deep clone this object, and es5 standard is not very
        // helpful.
        return {
            empty : false,
            unusedTokens : [],
            unusedInput : [],
            overflow : -2,
            charsLeftOver : 0,
            nullInput : false,
            invalidMonth : null,
            invalidFormat : false,
            userInvalidated : false,
            iso: false
        };
    }

    function deprecate(msg, fn) {
        var firstTime = true;
        function printMsg() {
            if (moment.suppressDeprecationWarnings === false &&
                    typeof console !== 'undefined' && console.warn) {
                console.warn("Deprecation warning: " + msg);
            }
        }
        return extend(function () {
            if (firstTime) {
                printMsg();
                firstTime = false;
            }
            return fn.apply(this, arguments);
        }, fn);
    }

    function padToken(func, count) {
        return function (a) {
            return leftZeroFill(func.call(this, a), count);
        };
    }
    function ordinalizeToken(func, period) {
        return function (a) {
            return this.lang().ordinal(func.call(this, a), period);
        };
    }

    while (ordinalizeTokens.length) {
        i = ordinalizeTokens.pop();
        formatTokenFunctions[i + 'o'] = ordinalizeToken(formatTokenFunctions[i], i);
    }
    while (paddedTokens.length) {
        i = paddedTokens.pop();
        formatTokenFunctions[i + i] = padToken(formatTokenFunctions[i], 2);
    }
    formatTokenFunctions.DDDD = padToken(formatTokenFunctions.DDD, 3);


    /************************************
        Constructors
    ************************************/

    function Language() {

    }

    // Moment prototype object
    function Moment(config) {
        checkOverflow(config);
        extend(this, config);
    }

    // Duration Constructor
    function Duration(duration) {
        var normalizedInput = normalizeObjectUnits(duration),
            years = normalizedInput.year || 0,
            quarters = normalizedInput.quarter || 0,
            months = normalizedInput.month || 0,
            weeks = normalizedInput.week || 0,
            days = normalizedInput.day || 0,
            hours = normalizedInput.hour || 0,
            minutes = normalizedInput.minute || 0,
            seconds = normalizedInput.second || 0,
            milliseconds = normalizedInput.millisecond || 0;

        // representation for dateAddRemove
        this._milliseconds = +milliseconds +
            seconds * 1e3 + // 1000
            minutes * 6e4 + // 1000 * 60
            hours * 36e5; // 1000 * 60 * 60
        // Because of dateAddRemove treats 24 hours as different from a
        // day when working around DST, we need to store them separately
        this._days = +days +
            weeks * 7;
        // It is impossible translate months into days without knowing
        // which months you are are talking about, so we have to store
        // it separately.
        this._months = +months +
            quarters * 3 +
            years * 12;

        this._data = {};

        this._bubble();
    }

    /************************************
        Helpers
    ************************************/


    function extend(a, b) {
        for (var i in b) {
            if (b.hasOwnProperty(i)) {
                a[i] = b[i];
            }
        }

        if (b.hasOwnProperty("toString")) {
            a.toString = b.toString;
        }

        if (b.hasOwnProperty("valueOf")) {
            a.valueOf = b.valueOf;
        }

        return a;
    }

    function cloneMoment(m) {
        var result = {}, i;
        for (i in m) {
            if (m.hasOwnProperty(i) && momentProperties.hasOwnProperty(i)) {
                result[i] = m[i];
            }
        }

        return result;
    }

    function absRound(number) {
        if (number < 0) {
            return Math.ceil(number);
        } else {
            return Math.floor(number);
        }
    }

    // left zero fill a number
    // see http://jsperf.com/left-zero-filling for performance comparison
    function leftZeroFill(number, targetLength, forceSign) {
        var output = '' + Math.abs(number),
            sign = number >= 0;

        while (output.length < targetLength) {
            output = '0' + output;
        }
        return (sign ? (forceSign ? '+' : '') : '-') + output;
    }

    // helper function for _.addTime and _.subtractTime
    function addOrSubtractDurationFromMoment(mom, duration, isAdding, updateOffset) {
        var milliseconds = duration._milliseconds,
            days = duration._days,
            months = duration._months;
        updateOffset = updateOffset == null ? true : updateOffset;

        if (milliseconds) {
            mom._d.setTime(+mom._d + milliseconds * isAdding);
        }
        if (days) {
            rawSetter(mom, 'Date', rawGetter(mom, 'Date') + days * isAdding);
        }
        if (months) {
            rawMonthSetter(mom, rawGetter(mom, 'Month') + months * isAdding);
        }
        if (updateOffset) {
            moment.updateOffset(mom, days || months);
        }
    }

    // check if is an array
    function isArray(input) {
        return Object.prototype.toString.call(input) === '[object Array]';
    }

    function isDate(input) {
        return  Object.prototype.toString.call(input) === '[object Date]' ||
                input instanceof Date;
    }

    // compare two arrays, return the number of differences
    function compareArrays(array1, array2, dontConvert) {
        var len = Math.min(array1.length, array2.length),
            lengthDiff = Math.abs(array1.length - array2.length),
            diffs = 0,
            i;
        for (i = 0; i < len; i++) {
            if ((dontConvert && array1[i] !== array2[i]) ||
                (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))) {
                diffs++;
            }
        }
        return diffs + lengthDiff;
    }

    function normalizeUnits(units) {
        if (units) {
            var lowered = units.toLowerCase().replace(/(.)s$/, '$1');
            units = unitAliases[units] || camelFunctions[lowered] || lowered;
        }
        return units;
    }

    function normalizeObjectUnits(inputObject) {
        var normalizedInput = {},
            normalizedProp,
            prop;

        for (prop in inputObject) {
            if (inputObject.hasOwnProperty(prop)) {
                normalizedProp = normalizeUnits(prop);
                if (normalizedProp) {
                    normalizedInput[normalizedProp] = inputObject[prop];
                }
            }
        }

        return normalizedInput;
    }

    function makeList(field) {
        var count, setter;

        if (field.indexOf('week') === 0) {
            count = 7;
            setter = 'day';
        }
        else if (field.indexOf('month') === 0) {
            count = 12;
            setter = 'month';
        }
        else {
            return;
        }

        moment[field] = function (format, index) {
            var i, getter,
                method = moment.fn._lang[field],
                results = [];

            if (typeof format === 'number') {
                index = format;
                format = undefined;
            }

            getter = function (i) {
                var m = moment().utc().set(setter, i);
                return method.call(moment.fn._lang, m, format || '');
            };

            if (index != null) {
                return getter(index);
            }
            else {
                for (i = 0; i < count; i++) {
                    results.push(getter(i));
                }
                return results;
            }
        };
    }

    function toInt(argumentForCoercion) {
        var coercedNumber = +argumentForCoercion,
            value = 0;

        if (coercedNumber !== 0 && isFinite(coercedNumber)) {
            if (coercedNumber >= 0) {
                value = Math.floor(coercedNumber);
            } else {
                value = Math.ceil(coercedNumber);
            }
        }

        return value;
    }

    function daysInMonth(year, month) {
        return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    }

    function weeksInYear(year, dow, doy) {
        return weekOfYear(moment([year, 11, 31 + dow - doy]), dow, doy).week;
    }

    function daysInYear(year) {
        return isLeapYear(year) ? 366 : 365;
    }

    function isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }

    function checkOverflow(m) {
        var overflow;
        if (m._a && m._pf.overflow === -2) {
            overflow =
                m._a[MONTH] < 0 || m._a[MONTH] > 11 ? MONTH :
                m._a[DATE] < 1 || m._a[DATE] > daysInMonth(m._a[YEAR], m._a[MONTH]) ? DATE :
                m._a[HOUR] < 0 || m._a[HOUR] > 23 ? HOUR :
                m._a[MINUTE] < 0 || m._a[MINUTE] > 59 ? MINUTE :
                m._a[SECOND] < 0 || m._a[SECOND] > 59 ? SECOND :
                m._a[MILLISECOND] < 0 || m._a[MILLISECOND] > 999 ? MILLISECOND :
                -1;

            if (m._pf._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
                overflow = DATE;
            }

            m._pf.overflow = overflow;
        }
    }

    function isValid(m) {
        if (m._isValid == null) {
            m._isValid = !isNaN(m._d.getTime()) &&
                m._pf.overflow < 0 &&
                !m._pf.empty &&
                !m._pf.invalidMonth &&
                !m._pf.nullInput &&
                !m._pf.invalidFormat &&
                !m._pf.userInvalidated;

            if (m._strict) {
                m._isValid = m._isValid &&
                    m._pf.charsLeftOver === 0 &&
                    m._pf.unusedTokens.length === 0;
            }
        }
        return m._isValid;
    }

    function normalizeLanguage(key) {
        return key ? key.toLowerCase().replace('_', '-') : key;
    }

    // Return a moment from input, that is local/utc/zone equivalent to model.
    function makeAs(input, model) {
        return model._isUTC ? moment(input).zone(model._offset || 0) :
            moment(input).local();
    }

    /************************************
        Languages
    ************************************/


    extend(Language.prototype, {

        set : function (config) {
            var prop, i;
            for (i in config) {
                prop = config[i];
                if (typeof prop === 'function') {
                    this[i] = prop;
                } else {
                    this['_' + i] = prop;
                }
            }
        },

        _months : "January_February_March_April_May_June_July_August_September_October_November_December".split("_"),
        months : function (m) {
            return this._months[m.month()];
        },

        _monthsShort : "Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),
        monthsShort : function (m) {
            return this._monthsShort[m.month()];
        },

        monthsParse : function (monthName) {
            var i, mom, regex;

            if (!this._monthsParse) {
                this._monthsParse = [];
            }

            for (i = 0; i < 12; i++) {
                // make the regex if we don't have it already
                if (!this._monthsParse[i]) {
                    mom = moment.utc([2000, i]);
                    regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
                    this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
                }
                // test the regex
                if (this._monthsParse[i].test(monthName)) {
                    return i;
                }
            }
        },

        _weekdays : "Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),
        weekdays : function (m) {
            return this._weekdays[m.day()];
        },

        _weekdaysShort : "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),
        weekdaysShort : function (m) {
            return this._weekdaysShort[m.day()];
        },

        _weekdaysMin : "Su_Mo_Tu_We_Th_Fr_Sa".split("_"),
        weekdaysMin : function (m) {
            return this._weekdaysMin[m.day()];
        },

        weekdaysParse : function (weekdayName) {
            var i, mom, regex;

            if (!this._weekdaysParse) {
                this._weekdaysParse = [];
            }

            for (i = 0; i < 7; i++) {
                // make the regex if we don't have it already
                if (!this._weekdaysParse[i]) {
                    mom = moment([2000, 1]).day(i);
                    regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
                    this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
                }
                // test the regex
                if (this._weekdaysParse[i].test(weekdayName)) {
                    return i;
                }
            }
        },

        _longDateFormat : {
            LT : "h:mm A",
            L : "MM/DD/YYYY",
            LL : "MMMM D YYYY",
            LLL : "MMMM D YYYY LT",
            LLLL : "dddd, MMMM D YYYY LT"
        },
        longDateFormat : function (key) {
            var output = this._longDateFormat[key];
            if (!output && this._longDateFormat[key.toUpperCase()]) {
                output = this._longDateFormat[key.toUpperCase()].replace(/MMMM|MM|DD|dddd/g, function (val) {
                    return val.slice(1);
                });
                this._longDateFormat[key] = output;
            }
            return output;
        },

        isPM : function (input) {
            // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
            // Using charAt should be more compatible.
            return ((input + '').toLowerCase().charAt(0) === 'p');
        },

        _meridiemParse : /[ap]\.?m?\.?/i,
        meridiem : function (hours, minutes, isLower) {
            if (hours > 11) {
                return isLower ? 'pm' : 'PM';
            } else {
                return isLower ? 'am' : 'AM';
            }
        },

        _calendar : {
            sameDay : '[Today at] LT',
            nextDay : '[Tomorrow at] LT',
            nextWeek : 'dddd [at] LT',
            lastDay : '[Yesterday at] LT',
            lastWeek : '[Last] dddd [at] LT',
            sameElse : 'L'
        },
        calendar : function (key, mom) {
            var output = this._calendar[key];
            return typeof output === 'function' ? output.apply(mom) : output;
        },

        _relativeTime : {
            future : "in %s",
            past : "%s ago",
            s : "a few seconds",
            m : "a minute",
            mm : "%d minutes",
            h : "an hour",
            hh : "%d hours",
            d : "a day",
            dd : "%d days",
            M : "a month",
            MM : "%d months",
            y : "a year",
            yy : "%d years"
        },
        relativeTime : function (number, withoutSuffix, string, isFuture) {
            var output = this._relativeTime[string];
            return (typeof output === 'function') ?
                output(number, withoutSuffix, string, isFuture) :
                output.replace(/%d/i, number);
        },
        pastFuture : function (diff, output) {
            var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
            return typeof format === 'function' ? format(output) : format.replace(/%s/i, output);
        },

        ordinal : function (number) {
            return this._ordinal.replace("%d", number);
        },
        _ordinal : "%d",

        preparse : function (string) {
            return string;
        },

        postformat : function (string) {
            return string;
        },

        week : function (mom) {
            return weekOfYear(mom, this._week.dow, this._week.doy).week;
        },

        _week : {
            dow : 0, // Sunday is the first day of the week.
            doy : 6  // The week that contains Jan 1st is the first week of the year.
        },

        _invalidDate: 'Invalid date',
        invalidDate: function () {
            return this._invalidDate;
        }
    });

    // Loads a language definition into the `languages` cache.  The function
    // takes a key and optionally values.  If not in the browser and no values
    // are provided, it will load the language file module.  As a convenience,
    // this function also returns the language values.
    function loadLang(key, values) {
        values.abbr = key;
        if (!languages[key]) {
            languages[key] = new Language();
        }
        languages[key].set(values);
        return languages[key];
    }

    // Remove a language from the `languages` cache. Mostly useful in tests.
    function unloadLang(key) {
        delete languages[key];
    }

    // Determines which language definition to use and returns it.
    //
    // With no parameters, it will return the global language.  If you
    // pass in a language key, such as 'en', it will return the
    // definition for 'en', so long as 'en' has already been loaded using
    // moment.lang.
    function getLangDefinition(key) {
        var i = 0, j, lang, next, split,
            get = function (k) {
                if (!languages[k] && hasModule) {
                    try {
                        require('./lang/' + k);
                    } catch (e) { }
                }
                return languages[k];
            };

        if (!key) {
            return moment.fn._lang;
        }

        if (!isArray(key)) {
            //short-circuit everything else
            lang = get(key);
            if (lang) {
                return lang;
            }
            key = [key];
        }

        //pick the language from the array
        //try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
        //substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
        while (i < key.length) {
            split = normalizeLanguage(key[i]).split('-');
            j = split.length;
            next = normalizeLanguage(key[i + 1]);
            next = next ? next.split('-') : null;
            while (j > 0) {
                lang = get(split.slice(0, j).join('-'));
                if (lang) {
                    return lang;
                }
                if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
                    //the next array item is better than a shallower substring of this one
                    break;
                }
                j--;
            }
            i++;
        }
        return moment.fn._lang;
    }

    /************************************
        Formatting
    ************************************/


    function removeFormattingTokens(input) {
        if (input.match(/\[[\s\S]/)) {
            return input.replace(/^\[|\]$/g, "");
        }
        return input.replace(/\\/g, "");
    }

    function makeFormatFunction(format) {
        var array = format.match(formattingTokens), i, length;

        for (i = 0, length = array.length; i < length; i++) {
            if (formatTokenFunctions[array[i]]) {
                array[i] = formatTokenFunctions[array[i]];
            } else {
                array[i] = removeFormattingTokens(array[i]);
            }
        }

        return function (mom) {
            var output = "";
            for (i = 0; i < length; i++) {
                output += array[i] instanceof Function ? array[i].call(mom, format) : array[i];
            }
            return output;
        };
    }

    // format date using native date object
    function formatMoment(m, format) {

        if (!m.isValid()) {
            return m.lang().invalidDate();
        }

        format = expandFormat(format, m.lang());

        if (!formatFunctions[format]) {
            formatFunctions[format] = makeFormatFunction(format);
        }

        return formatFunctions[format](m);
    }

    function expandFormat(format, lang) {
        var i = 5;

        function replaceLongDateFormatTokens(input) {
            return lang.longDateFormat(input) || input;
        }

        localFormattingTokens.lastIndex = 0;
        while (i >= 0 && localFormattingTokens.test(format)) {
            format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
            localFormattingTokens.lastIndex = 0;
            i -= 1;
        }

        return format;
    }


    /************************************
        Parsing
    ************************************/


    // get the regex to find the next token
    function getParseRegexForToken(token, config) {
        var a, strict = config._strict;
        switch (token) {
        case 'Q':
            return parseTokenOneDigit;
        case 'DDDD':
            return parseTokenThreeDigits;
        case 'YYYY':
        case 'GGGG':
        case 'gggg':
            return strict ? parseTokenFourDigits : parseTokenOneToFourDigits;
        case 'Y':
        case 'G':
        case 'g':
            return parseTokenSignedNumber;
        case 'YYYYYY':
        case 'YYYYY':
        case 'GGGGG':
        case 'ggggg':
            return strict ? parseTokenSixDigits : parseTokenOneToSixDigits;
        case 'S':
            if (strict) { return parseTokenOneDigit; }
            /* falls through */
        case 'SS':
            if (strict) { return parseTokenTwoDigits; }
            /* falls through */
        case 'SSS':
            if (strict) { return parseTokenThreeDigits; }
            /* falls through */
        case 'DDD':
            return parseTokenOneToThreeDigits;
        case 'MMM':
        case 'MMMM':
        case 'dd':
        case 'ddd':
        case 'dddd':
            return parseTokenWord;
        case 'a':
        case 'A':
            return getLangDefinition(config._l)._meridiemParse;
        case 'X':
            return parseTokenTimestampMs;
        case 'Z':
        case 'ZZ':
            return parseTokenTimezone;
        case 'T':
            return parseTokenT;
        case 'SSSS':
            return parseTokenDigits;
        case 'MM':
        case 'DD':
        case 'YY':
        case 'GG':
        case 'gg':
        case 'HH':
        case 'hh':
        case 'mm':
        case 'ss':
        case 'ww':
        case 'WW':
            return strict ? parseTokenTwoDigits : parseTokenOneOrTwoDigits;
        case 'M':
        case 'D':
        case 'd':
        case 'H':
        case 'h':
        case 'm':
        case 's':
        case 'w':
        case 'W':
        case 'e':
        case 'E':
            return parseTokenOneOrTwoDigits;
        case 'Do':
            return parseTokenOrdinal;
        default :
            a = new RegExp(regexpEscape(unescapeFormat(token.replace('\\', '')), "i"));
            return a;
        }
    }

    function timezoneMinutesFromString(string) {
        string = string || "";
        var possibleTzMatches = (string.match(parseTokenTimezone) || []),
            tzChunk = possibleTzMatches[possibleTzMatches.length - 1] || [],
            parts = (tzChunk + '').match(parseTimezoneChunker) || ['-', 0, 0],
            minutes = +(parts[1] * 60) + toInt(parts[2]);

        return parts[0] === '+' ? -minutes : minutes;
    }

    // function to convert string input to date
    function addTimeToArrayFromToken(token, input, config) {
        var a, datePartArray = config._a;

        switch (token) {
        // QUARTER
        case 'Q':
            if (input != null) {
                datePartArray[MONTH] = (toInt(input) - 1) * 3;
            }
            break;
        // MONTH
        case 'M' : // fall through to MM
        case 'MM' :
            if (input != null) {
                datePartArray[MONTH] = toInt(input) - 1;
            }
            break;
        case 'MMM' : // fall through to MMMM
        case 'MMMM' :
            a = getLangDefinition(config._l).monthsParse(input);
            // if we didn't find a month name, mark the date as invalid.
            if (a != null) {
                datePartArray[MONTH] = a;
            } else {
                config._pf.invalidMonth = input;
            }
            break;
        // DAY OF MONTH
        case 'D' : // fall through to DD
        case 'DD' :
            if (input != null) {
                datePartArray[DATE] = toInt(input);
            }
            break;
        case 'Do' :
            if (input != null) {
                datePartArray[DATE] = toInt(parseInt(input, 10));
            }
            break;
        // DAY OF YEAR
        case 'DDD' : // fall through to DDDD
        case 'DDDD' :
            if (input != null) {
                config._dayOfYear = toInt(input);
            }

            break;
        // YEAR
        case 'YY' :
            datePartArray[YEAR] = moment.parseTwoDigitYear(input);
            break;
        case 'YYYY' :
        case 'YYYYY' :
        case 'YYYYYY' :
            datePartArray[YEAR] = toInt(input);
            break;
        // AM / PM
        case 'a' : // fall through to A
        case 'A' :
            config._isPm = getLangDefinition(config._l).isPM(input);
            break;
        // 24 HOUR
        case 'H' : // fall through to hh
        case 'HH' : // fall through to hh
        case 'h' : // fall through to hh
        case 'hh' :
            datePartArray[HOUR] = toInt(input);
            break;
        // MINUTE
        case 'm' : // fall through to mm
        case 'mm' :
            datePartArray[MINUTE] = toInt(input);
            break;
        // SECOND
        case 's' : // fall through to ss
        case 'ss' :
            datePartArray[SECOND] = toInt(input);
            break;
        // MILLISECOND
        case 'S' :
        case 'SS' :
        case 'SSS' :
        case 'SSSS' :
            datePartArray[MILLISECOND] = toInt(('0.' + input) * 1000);
            break;
        // UNIX TIMESTAMP WITH MS
        case 'X':
            config._d = new Date(parseFloat(input) * 1000);
            break;
        // TIMEZONE
        case 'Z' : // fall through to ZZ
        case 'ZZ' :
            config._useUTC = true;
            config._tzm = timezoneMinutesFromString(input);
            break;
        case 'w':
        case 'ww':
        case 'W':
        case 'WW':
        case 'd':
        case 'dd':
        case 'ddd':
        case 'dddd':
        case 'e':
        case 'E':
            token = token.substr(0, 1);
            /* falls through */
        case 'gg':
        case 'gggg':
        case 'GG':
        case 'GGGG':
        case 'GGGGG':
            token = token.substr(0, 2);
            if (input) {
                config._w = config._w || {};
                config._w[token] = input;
            }
            break;
        }
    }

    // convert an array to a date.
    // the array should mirror the parameters below
    // note: all values past the year are optional and will default to the lowest possible value.
    // [year, month, day , hour, minute, second, millisecond]
    function dateFromConfig(config) {
        var i, date, input = [], currentDate,
            yearToUse, fixYear, w, temp, lang, weekday, week;

        if (config._d) {
            return;
        }

        currentDate = currentDateArray(config);

        //compute day of the year from weeks and weekdays
        if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
            fixYear = function (val) {
                var intVal = parseInt(val, 10);
                return val ?
                  (val.length < 3 ? (intVal > 68 ? 1900 + intVal : 2000 + intVal) : intVal) :
                  (config._a[YEAR] == null ? moment().weekYear() : config._a[YEAR]);
            };

            w = config._w;
            if (w.GG != null || w.W != null || w.E != null) {
                temp = dayOfYearFromWeeks(fixYear(w.GG), w.W || 1, w.E, 4, 1);
            }
            else {
                lang = getLangDefinition(config._l);
                weekday = w.d != null ?  parseWeekday(w.d, lang) :
                  (w.e != null ?  parseInt(w.e, 10) + lang._week.dow : 0);

                week = parseInt(w.w, 10) || 1;

                //if we're parsing 'd', then the low day numbers may be next week
                if (w.d != null && weekday < lang._week.dow) {
                    week++;
                }

                temp = dayOfYearFromWeeks(fixYear(w.gg), week, weekday, lang._week.doy, lang._week.dow);
            }

            config._a[YEAR] = temp.year;
            config._dayOfYear = temp.dayOfYear;
        }

        //if the day of the year is set, figure out what it is
        if (config._dayOfYear) {
            yearToUse = config._a[YEAR] == null ? currentDate[YEAR] : config._a[YEAR];

            if (config._dayOfYear > daysInYear(yearToUse)) {
                config._pf._overflowDayOfYear = true;
            }

            date = makeUTCDate(yearToUse, 0, config._dayOfYear);
            config._a[MONTH] = date.getUTCMonth();
            config._a[DATE] = date.getUTCDate();
        }

        // Default to current date.
        // * if no year, month, day of month are given, default to today
        // * if day of month is given, default month and year
        // * if month is given, default only year
        // * if year is given, don't default anything
        for (i = 0; i < 3 && config._a[i] == null; ++i) {
            config._a[i] = input[i] = currentDate[i];
        }

        // Zero out whatever was not defaulted, including time
        for (; i < 7; i++) {
            config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
        }

        // add the offsets to the time to be parsed so that we can have a clean array for checking isValid
        input[HOUR] += toInt((config._tzm || 0) / 60);
        input[MINUTE] += toInt((config._tzm || 0) % 60);

        config._d = (config._useUTC ? makeUTCDate : makeDate).apply(null, input);
    }

    function dateFromObject(config) {
        var normalizedInput;

        if (config._d) {
            return;
        }

        normalizedInput = normalizeObjectUnits(config._i);
        config._a = [
            normalizedInput.year,
            normalizedInput.month,
            normalizedInput.day,
            normalizedInput.hour,
            normalizedInput.minute,
            normalizedInput.second,
            normalizedInput.millisecond
        ];

        dateFromConfig(config);
    }

    function currentDateArray(config) {
        var now = new Date();
        if (config._useUTC) {
            return [
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate()
            ];
        } else {
            return [now.getFullYear(), now.getMonth(), now.getDate()];
        }
    }

    // date from string and format string
    function makeDateFromStringAndFormat(config) {

        config._a = [];
        config._pf.empty = true;

        // This array is used to make a Date, either with `new Date` or `Date.UTC`
        var lang = getLangDefinition(config._l),
            string = '' + config._i,
            i, parsedInput, tokens, token, skipped,
            stringLength = string.length,
            totalParsedInputLength = 0;

        tokens = expandFormat(config._f, lang).match(formattingTokens) || [];

        for (i = 0; i < tokens.length; i++) {
            token = tokens[i];
            parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
            if (parsedInput) {
                skipped = string.substr(0, string.indexOf(parsedInput));
                if (skipped.length > 0) {
                    config._pf.unusedInput.push(skipped);
                }
                string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
                totalParsedInputLength += parsedInput.length;
            }
            // don't parse if it's not a known token
            if (formatTokenFunctions[token]) {
                if (parsedInput) {
                    config._pf.empty = false;
                }
                else {
                    config._pf.unusedTokens.push(token);
                }
                addTimeToArrayFromToken(token, parsedInput, config);
            }
            else if (config._strict && !parsedInput) {
                config._pf.unusedTokens.push(token);
            }
        }

        // add remaining unparsed input length to the string
        config._pf.charsLeftOver = stringLength - totalParsedInputLength;
        if (string.length > 0) {
            config._pf.unusedInput.push(string);
        }

        // handle am pm
        if (config._isPm && config._a[HOUR] < 12) {
            config._a[HOUR] += 12;
        }
        // if is 12 am, change hours to 0
        if (config._isPm === false && config._a[HOUR] === 12) {
            config._a[HOUR] = 0;
        }

        dateFromConfig(config);
        checkOverflow(config);
    }

    function unescapeFormat(s) {
        return s.replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
            return p1 || p2 || p3 || p4;
        });
    }

    // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
    function regexpEscape(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    // date from string and array of format strings
    function makeDateFromStringAndArray(config) {
        var tempConfig,
            bestMoment,

            scoreToBeat,
            i,
            currentScore;

        if (config._f.length === 0) {
            config._pf.invalidFormat = true;
            config._d = new Date(NaN);
            return;
        }

        for (i = 0; i < config._f.length; i++) {
            currentScore = 0;
            tempConfig = extend({}, config);
            tempConfig._pf = defaultParsingFlags();
            tempConfig._f = config._f[i];
            makeDateFromStringAndFormat(tempConfig);

            if (!isValid(tempConfig)) {
                continue;
            }

            // if there is any input that was not parsed add a penalty for that format
            currentScore += tempConfig._pf.charsLeftOver;

            //or tokens
            currentScore += tempConfig._pf.unusedTokens.length * 10;

            tempConfig._pf.score = currentScore;

            if (scoreToBeat == null || currentScore < scoreToBeat) {
                scoreToBeat = currentScore;
                bestMoment = tempConfig;
            }
        }

        extend(config, bestMoment || tempConfig);
    }

    // date from iso format
    function makeDateFromString(config) {
        var i, l,
            string = config._i,
            match = isoRegex.exec(string);

        if (match) {
            config._pf.iso = true;
            for (i = 0, l = isoDates.length; i < l; i++) {
                if (isoDates[i][1].exec(string)) {
                    // match[5] should be "T" or undefined
                    config._f = isoDates[i][0] + (match[6] || " ");
                    break;
                }
            }
            for (i = 0, l = isoTimes.length; i < l; i++) {
                if (isoTimes[i][1].exec(string)) {
                    config._f += isoTimes[i][0];
                    break;
                }
            }
            if (string.match(parseTokenTimezone)) {
                config._f += "Z";
            }
            makeDateFromStringAndFormat(config);
        }
        else {
            moment.createFromInputFallback(config);
        }
    }

    function makeDateFromInput(config) {
        var input = config._i,
            matched = aspNetJsonRegex.exec(input);

        if (input === undefined) {
            config._d = new Date();
        } else if (matched) {
            config._d = new Date(+matched[1]);
        } else if (typeof input === 'string') {
            makeDateFromString(config);
        } else if (isArray(input)) {
            config._a = input.slice(0);
            dateFromConfig(config);
        } else if (isDate(input)) {
            config._d = new Date(+input);
        } else if (typeof(input) === 'object') {
            dateFromObject(config);
        } else if (typeof(input) === 'number') {
            // from milliseconds
            config._d = new Date(input);
        } else {
            moment.createFromInputFallback(config);
        }
    }

    function makeDate(y, m, d, h, M, s, ms) {
        //can't just apply() to create a date:
        //http://stackoverflow.com/questions/181348/instantiating-a-javascript-object-by-calling-prototype-constructor-apply
        var date = new Date(y, m, d, h, M, s, ms);

        //the date constructor doesn't accept years < 1970
        if (y < 1970) {
            date.setFullYear(y);
        }
        return date;
    }

    function makeUTCDate(y) {
        var date = new Date(Date.UTC.apply(null, arguments));
        if (y < 1970) {
            date.setUTCFullYear(y);
        }
        return date;
    }

    function parseWeekday(input, language) {
        if (typeof input === 'string') {
            if (!isNaN(input)) {
                input = parseInt(input, 10);
            }
            else {
                input = language.weekdaysParse(input);
                if (typeof input !== 'number') {
                    return null;
                }
            }
        }
        return input;
    }

    /************************************
        Relative Time
    ************************************/


    // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
    function substituteTimeAgo(string, number, withoutSuffix, isFuture, lang) {
        return lang.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
    }

    function relativeTime(milliseconds, withoutSuffix, lang) {
        var seconds = round(Math.abs(milliseconds) / 1000),
            minutes = round(seconds / 60),
            hours = round(minutes / 60),
            days = round(hours / 24),
            years = round(days / 365),
            args = seconds < 45 && ['s', seconds] ||
                minutes === 1 && ['m'] ||
                minutes < 45 && ['mm', minutes] ||
                hours === 1 && ['h'] ||
                hours < 22 && ['hh', hours] ||
                days === 1 && ['d'] ||
                days <= 25 && ['dd', days] ||
                days <= 45 && ['M'] ||
                days < 345 && ['MM', round(days / 30)] ||
                years === 1 && ['y'] || ['yy', years];
        args[2] = withoutSuffix;
        args[3] = milliseconds > 0;
        args[4] = lang;
        return substituteTimeAgo.apply({}, args);
    }


    /************************************
        Week of Year
    ************************************/


    // firstDayOfWeek       0 = sun, 6 = sat
    //                      the day of the week that starts the week
    //                      (usually sunday or monday)
    // firstDayOfWeekOfYear 0 = sun, 6 = sat
    //                      the first week is the week that contains the first
    //                      of this day of the week
    //                      (eg. ISO weeks use thursday (4))
    function weekOfYear(mom, firstDayOfWeek, firstDayOfWeekOfYear) {
        var end = firstDayOfWeekOfYear - firstDayOfWeek,
            daysToDayOfWeek = firstDayOfWeekOfYear - mom.day(),
            adjustedMoment;


        if (daysToDayOfWeek > end) {
            daysToDayOfWeek -= 7;
        }

        if (daysToDayOfWeek < end - 7) {
            daysToDayOfWeek += 7;
        }

        adjustedMoment = moment(mom).add('d', daysToDayOfWeek);
        return {
            week: Math.ceil(adjustedMoment.dayOfYear() / 7),
            year: adjustedMoment.year()
        };
    }

    //http://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
    function dayOfYearFromWeeks(year, week, weekday, firstDayOfWeekOfYear, firstDayOfWeek) {
        var d = makeUTCDate(year, 0, 1).getUTCDay(), daysToAdd, dayOfYear;

        weekday = weekday != null ? weekday : firstDayOfWeek;
        daysToAdd = firstDayOfWeek - d + (d > firstDayOfWeekOfYear ? 7 : 0) - (d < firstDayOfWeek ? 7 : 0);
        dayOfYear = 7 * (week - 1) + (weekday - firstDayOfWeek) + daysToAdd + 1;

        return {
            year: dayOfYear > 0 ? year : year - 1,
            dayOfYear: dayOfYear > 0 ?  dayOfYear : daysInYear(year - 1) + dayOfYear
        };
    }

    /************************************
        Top Level Functions
    ************************************/

    function makeMoment(config) {
        var input = config._i,
            format = config._f;

        if (input === null || (format === undefined && input === '')) {
            return moment.invalid({nullInput: true});
        }

        if (typeof input === 'string') {
            config._i = input = getLangDefinition().preparse(input);
        }

        if (moment.isMoment(input)) {
            config = cloneMoment(input);

            config._d = new Date(+input._d);
        } else if (format) {
            if (isArray(format)) {
                makeDateFromStringAndArray(config);
            } else {
                makeDateFromStringAndFormat(config);
            }
        } else {
            makeDateFromInput(config);
        }

        return new Moment(config);
    }

    moment = function (input, format, lang, strict) {
        var c;

        if (typeof(lang) === "boolean") {
            strict = lang;
            lang = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c = {};
        c._isAMomentObject = true;
        c._i = input;
        c._f = format;
        c._l = lang;
        c._strict = strict;
        c._isUTC = false;
        c._pf = defaultParsingFlags();

        return makeMoment(c);
    };

    moment.suppressDeprecationWarnings = false;

    moment.createFromInputFallback = deprecate(
            "moment construction falls back to js Date. This is " +
            "discouraged and will be removed in upcoming major " +
            "release. Please refer to " +
            "https://github.com/moment/moment/issues/1407 for more info.",
            function (config) {
        config._d = new Date(config._i);
    });

    // creating with utc
    moment.utc = function (input, format, lang, strict) {
        var c;

        if (typeof(lang) === "boolean") {
            strict = lang;
            lang = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c = {};
        c._isAMomentObject = true;
        c._useUTC = true;
        c._isUTC = true;
        c._l = lang;
        c._i = input;
        c._f = format;
        c._strict = strict;
        c._pf = defaultParsingFlags();

        return makeMoment(c).utc();
    };

    // creating with unix timestamp (in seconds)
    moment.unix = function (input) {
        return moment(input * 1000);
    };

    // duration
    moment.duration = function (input, key) {
        var duration = input,
            // matching against regexp is expensive, do it on demand
            match = null,
            sign,
            ret,
            parseIso;

        if (moment.isDuration(input)) {
            duration = {
                ms: input._milliseconds,
                d: input._days,
                M: input._months
            };
        } else if (typeof input === 'number') {
            duration = {};
            if (key) {
                duration[key] = input;
            } else {
                duration.milliseconds = input;
            }
        } else if (!!(match = aspNetTimeSpanJsonRegex.exec(input))) {
            sign = (match[1] === "-") ? -1 : 1;
            duration = {
                y: 0,
                d: toInt(match[DATE]) * sign,
                h: toInt(match[HOUR]) * sign,
                m: toInt(match[MINUTE]) * sign,
                s: toInt(match[SECOND]) * sign,
                ms: toInt(match[MILLISECOND]) * sign
            };
        } else if (!!(match = isoDurationRegex.exec(input))) {
            sign = (match[1] === "-") ? -1 : 1;
            parseIso = function (inp) {
                // We'd normally use ~~inp for this, but unfortunately it also
                // converts floats to ints.
                // inp may be undefined, so careful calling replace on it.
                var res = inp && parseFloat(inp.replace(',', '.'));
                // apply sign while we're at it
                return (isNaN(res) ? 0 : res) * sign;
            };
            duration = {
                y: parseIso(match[2]),
                M: parseIso(match[3]),
                d: parseIso(match[4]),
                h: parseIso(match[5]),
                m: parseIso(match[6]),
                s: parseIso(match[7]),
                w: parseIso(match[8])
            };
        }

        ret = new Duration(duration);

        if (moment.isDuration(input) && input.hasOwnProperty('_lang')) {
            ret._lang = input._lang;
        }

        return ret;
    };

    // version number
    moment.version = VERSION;

    // default format
    moment.defaultFormat = isoFormat;

    // Plugins that add properties should also add the key here (null value),
    // so we can properly clone ourselves.
    moment.momentProperties = momentProperties;

    // This function will be called whenever a moment is mutated.
    // It is intended to keep the offset in sync with the timezone.
    moment.updateOffset = function () {};

    // This function will load languages and then set the global language.  If
    // no arguments are passed in, it will simply return the current global
    // language key.
    moment.lang = function (key, values) {
        var r;
        if (!key) {
            return moment.fn._lang._abbr;
        }
        if (values) {
            loadLang(normalizeLanguage(key), values);
        } else if (values === null) {
            unloadLang(key);
            key = 'en';
        } else if (!languages[key]) {
            getLangDefinition(key);
        }
        r = moment.duration.fn._lang = moment.fn._lang = getLangDefinition(key);
        return r._abbr;
    };

    // returns language data
    moment.langData = function (key) {
        if (key && key._lang && key._lang._abbr) {
            key = key._lang._abbr;
        }
        return getLangDefinition(key);
    };

    // compare moment object
    moment.isMoment = function (obj) {
        return obj instanceof Moment ||
            (obj != null &&  obj.hasOwnProperty('_isAMomentObject'));
    };

    // for typechecking Duration objects
    moment.isDuration = function (obj) {
        return obj instanceof Duration;
    };

    for (i = lists.length - 1; i >= 0; --i) {
        makeList(lists[i]);
    }

    moment.normalizeUnits = function (units) {
        return normalizeUnits(units);
    };

    moment.invalid = function (flags) {
        var m = moment.utc(NaN);
        if (flags != null) {
            extend(m._pf, flags);
        }
        else {
            m._pf.userInvalidated = true;
        }

        return m;
    };

    moment.parseZone = function () {
        return moment.apply(null, arguments).parseZone();
    };

    moment.parseTwoDigitYear = function (input) {
        return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
    };

    /************************************
        Moment Prototype
    ************************************/


    extend(moment.fn = Moment.prototype, {

        clone : function () {
            return moment(this);
        },

        valueOf : function () {
            return +this._d + ((this._offset || 0) * 60000);
        },

        unix : function () {
            return Math.floor(+this / 1000);
        },

        toString : function () {
            return this.clone().lang('en').format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ");
        },

        toDate : function () {
            return this._offset ? new Date(+this) : this._d;
        },

        toISOString : function () {
            var m = moment(this).utc();
            if (0 < m.year() && m.year() <= 9999) {
                return formatMoment(m, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
            } else {
                return formatMoment(m, 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
            }
        },

        toArray : function () {
            var m = this;
            return [
                m.year(),
                m.month(),
                m.date(),
                m.hours(),
                m.minutes(),
                m.seconds(),
                m.milliseconds()
            ];
        },

        isValid : function () {
            return isValid(this);
        },

        isDSTShifted : function () {

            if (this._a) {
                return this.isValid() && compareArrays(this._a, (this._isUTC ? moment.utc(this._a) : moment(this._a)).toArray()) > 0;
            }

            return false;
        },

        parsingFlags : function () {
            return extend({}, this._pf);
        },

        invalidAt: function () {
            return this._pf.overflow;
        },

        utc : function () {
            return this.zone(0);
        },

        local : function () {
            this.zone(0);
            this._isUTC = false;
            return this;
        },

        format : function (inputString) {
            var output = formatMoment(this, inputString || moment.defaultFormat);
            return this.lang().postformat(output);
        },

        add : function (input, val) {
            var dur;
            // switch args to support add('s', 1) and add(1, 's')
            if (typeof input === 'string') {
                dur = moment.duration(+val, input);
            } else {
                dur = moment.duration(input, val);
            }
            addOrSubtractDurationFromMoment(this, dur, 1);
            return this;
        },

        subtract : function (input, val) {
            var dur;
            // switch args to support subtract('s', 1) and subtract(1, 's')
            if (typeof input === 'string') {
                dur = moment.duration(+val, input);
            } else {
                dur = moment.duration(input, val);
            }
            addOrSubtractDurationFromMoment(this, dur, -1);
            return this;
        },

        diff : function (input, units, asFloat) {
            var that = makeAs(input, this),
                zoneDiff = (this.zone() - that.zone()) * 6e4,
                diff, output;

            units = normalizeUnits(units);

            if (units === 'year' || units === 'month') {
                // average number of days in the months in the given dates
                diff = (this.daysInMonth() + that.daysInMonth()) * 432e5; // 24 * 60 * 60 * 1000 / 2
                // difference in months
                output = ((this.year() - that.year()) * 12) + (this.month() - that.month());
                // adjust by taking difference in days, average number of days
                // and dst in the given months.
                output += ((this - moment(this).startOf('month')) -
                        (that - moment(that).startOf('month'))) / diff;
                // same as above but with zones, to negate all dst
                output -= ((this.zone() - moment(this).startOf('month').zone()) -
                        (that.zone() - moment(that).startOf('month').zone())) * 6e4 / diff;
                if (units === 'year') {
                    output = output / 12;
                }
            } else {
                diff = (this - that);
                output = units === 'second' ? diff / 1e3 : // 1000
                    units === 'minute' ? diff / 6e4 : // 1000 * 60
                    units === 'hour' ? diff / 36e5 : // 1000 * 60 * 60
                    units === 'day' ? (diff - zoneDiff) / 864e5 : // 1000 * 60 * 60 * 24, negate dst
                    units === 'week' ? (diff - zoneDiff) / 6048e5 : // 1000 * 60 * 60 * 24 * 7, negate dst
                    diff;
            }
            return asFloat ? output : absRound(output);
        },

        from : function (time, withoutSuffix) {
            return moment.duration(this.diff(time)).lang(this.lang()._abbr).humanize(!withoutSuffix);
        },

        fromNow : function (withoutSuffix) {
            return this.from(moment(), withoutSuffix);
        },

        calendar : function () {
            // We want to compare the start of today, vs this.
            // Getting start-of-today depends on whether we're zone'd or not.
            var sod = makeAs(moment(), this).startOf('day'),
                diff = this.diff(sod, 'days', true),
                format = diff < -6 ? 'sameElse' :
                    diff < -1 ? 'lastWeek' :
                    diff < 0 ? 'lastDay' :
                    diff < 1 ? 'sameDay' :
                    diff < 2 ? 'nextDay' :
                    diff < 7 ? 'nextWeek' : 'sameElse';
            return this.format(this.lang().calendar(format, this));
        },

        isLeapYear : function () {
            return isLeapYear(this.year());
        },

        isDST : function () {
            return (this.zone() < this.clone().month(0).zone() ||
                this.zone() < this.clone().month(5).zone());
        },

        day : function (input) {
            var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
            if (input != null) {
                input = parseWeekday(input, this.lang());
                return this.add({ d : input - day });
            } else {
                return day;
            }
        },

        month : makeAccessor('Month', true),

        startOf: function (units) {
            units = normalizeUnits(units);
            // the following switch intentionally omits break keywords
            // to utilize falling through the cases.
            switch (units) {
            case 'year':
                this.month(0);
                /* falls through */
            case 'quarter':
            case 'month':
                this.date(1);
                /* falls through */
            case 'week':
            case 'isoWeek':
            case 'day':
                this.hours(0);
                /* falls through */
            case 'hour':
                this.minutes(0);
                /* falls through */
            case 'minute':
                this.seconds(0);
                /* falls through */
            case 'second':
                this.milliseconds(0);
                /* falls through */
            }

            // weeks are a special case
            if (units === 'week') {
                this.weekday(0);
            } else if (units === 'isoWeek') {
                this.isoWeekday(1);
            }

            // quarters are also special
            if (units === 'quarter') {
                this.month(Math.floor(this.month() / 3) * 3);
            }

            return this;
        },

        endOf: function (units) {
            units = normalizeUnits(units);
            return this.startOf(units).add((units === 'isoWeek' ? 'week' : units), 1).subtract('ms', 1);
        },

        isAfter: function (input, units) {
            units = typeof units !== 'undefined' ? units : 'millisecond';
            return +this.clone().startOf(units) > +moment(input).startOf(units);
        },

        isBefore: function (input, units) {
            units = typeof units !== 'undefined' ? units : 'millisecond';
            return +this.clone().startOf(units) < +moment(input).startOf(units);
        },

        isSame: function (input, units) {
            units = units || 'ms';
            return +this.clone().startOf(units) === +makeAs(input, this).startOf(units);
        },

        min: function (other) {
            other = moment.apply(null, arguments);
            return other < this ? this : other;
        },

        max: function (other) {
            other = moment.apply(null, arguments);
            return other > this ? this : other;
        },

        // keepTime = true means only change the timezone, without affecting
        // the local hour. So 5:31:26 +0300 --[zone(2, true)]--> 5:31:26 +0200
        // It is possible that 5:31:26 doesn't exist int zone +0200, so we
        // adjust the time as needed, to be valid.
        //
        // Keeping the time actually adds/subtracts (one hour)
        // from the actual represented time. That is why we call updateOffset
        // a second time. In case it wants us to change the offset again
        // _changeInProgress == true case, then we have to adjust, because
        // there is no such time in the given timezone.
        zone : function (input, keepTime) {
            var offset = this._offset || 0;
            if (input != null) {
                if (typeof input === "string") {
                    input = timezoneMinutesFromString(input);
                }
                if (Math.abs(input) < 16) {
                    input = input * 60;
                }
                this._offset = input;
                this._isUTC = true;
                if (offset !== input) {
                    if (!keepTime || this._changeInProgress) {
                        addOrSubtractDurationFromMoment(this,
                                moment.duration(offset - input, 'm'), 1, false);
                    } else if (!this._changeInProgress) {
                        this._changeInProgress = true;
                        moment.updateOffset(this, true);
                        this._changeInProgress = null;
                    }
                }
            } else {
                return this._isUTC ? offset : this._d.getTimezoneOffset();
            }
            return this;
        },

        zoneAbbr : function () {
            return this._isUTC ? "UTC" : "";
        },

        zoneName : function () {
            return this._isUTC ? "Coordinated Universal Time" : "";
        },

        parseZone : function () {
            if (this._tzm) {
                this.zone(this._tzm);
            } else if (typeof this._i === 'string') {
                this.zone(this._i);
            }
            return this;
        },

        hasAlignedHourOffset : function (input) {
            if (!input) {
                input = 0;
            }
            else {
                input = moment(input).zone();
            }

            return (this.zone() - input) % 60 === 0;
        },

        daysInMonth : function () {
            return daysInMonth(this.year(), this.month());
        },

        dayOfYear : function (input) {
            var dayOfYear = round((moment(this).startOf('day') - moment(this).startOf('year')) / 864e5) + 1;
            return input == null ? dayOfYear : this.add("d", (input - dayOfYear));
        },

        quarter : function (input) {
            return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
        },

        weekYear : function (input) {
            var year = weekOfYear(this, this.lang()._week.dow, this.lang()._week.doy).year;
            return input == null ? year : this.add("y", (input - year));
        },

        isoWeekYear : function (input) {
            var year = weekOfYear(this, 1, 4).year;
            return input == null ? year : this.add("y", (input - year));
        },

        week : function (input) {
            var week = this.lang().week(this);
            return input == null ? week : this.add("d", (input - week) * 7);
        },

        isoWeek : function (input) {
            var week = weekOfYear(this, 1, 4).week;
            return input == null ? week : this.add("d", (input - week) * 7);
        },

        weekday : function (input) {
            var weekday = (this.day() + 7 - this.lang()._week.dow) % 7;
            return input == null ? weekday : this.add("d", input - weekday);
        },

        isoWeekday : function (input) {
            // behaves the same as moment#day except
            // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
            // as a setter, sunday should belong to the previous week.
            return input == null ? this.day() || 7 : this.day(this.day() % 7 ? input : input - 7);
        },

        isoWeeksInYear : function () {
            return weeksInYear(this.year(), 1, 4);
        },

        weeksInYear : function () {
            var weekInfo = this._lang._week;
            return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
        },

        get : function (units) {
            units = normalizeUnits(units);
            return this[units]();
        },

        set : function (units, value) {
            units = normalizeUnits(units);
            if (typeof this[units] === 'function') {
                this[units](value);
            }
            return this;
        },

        // If passed a language key, it will set the language for this
        // instance.  Otherwise, it will return the language configuration
        // variables for this instance.
        lang : function (key) {
            if (key === undefined) {
                return this._lang;
            } else {
                this._lang = getLangDefinition(key);
                return this;
            }
        }
    });

    function rawMonthSetter(mom, value) {
        var dayOfMonth;

        // TODO: Move this out of here!
        if (typeof value === 'string') {
            value = mom.lang().monthsParse(value);
            // TODO: Another silent failure?
            if (typeof value !== 'number') {
                return mom;
            }
        }

        dayOfMonth = Math.min(mom.date(),
                daysInMonth(mom.year(), value));
        mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
        return mom;
    }

    function rawGetter(mom, unit) {
        return mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]();
    }

    function rawSetter(mom, unit, value) {
        if (unit === 'Month') {
            return rawMonthSetter(mom, value);
        } else {
            return mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
        }
    }

    function makeAccessor(unit, keepTime) {
        return function (value) {
            if (value != null) {
                rawSetter(this, unit, value);
                moment.updateOffset(this, keepTime);
                return this;
            } else {
                return rawGetter(this, unit);
            }
        };
    }

    moment.fn.millisecond = moment.fn.milliseconds = makeAccessor('Milliseconds', false);
    moment.fn.second = moment.fn.seconds = makeAccessor('Seconds', false);
    moment.fn.minute = moment.fn.minutes = makeAccessor('Minutes', false);
    // Setting the hour should keep the time, because the user explicitly
    // specified which hour he wants. So trying to maintain the same hour (in
    // a new timezone) makes sense. Adding/subtracting hours does not follow
    // this rule.
    moment.fn.hour = moment.fn.hours = makeAccessor('Hours', true);
    // moment.fn.month is defined separately
    moment.fn.date = makeAccessor('Date', true);
    moment.fn.dates = deprecate("dates accessor is deprecated. Use date instead.", makeAccessor('Date', true));
    moment.fn.year = makeAccessor('FullYear', true);
    moment.fn.years = deprecate("years accessor is deprecated. Use year instead.", makeAccessor('FullYear', true));

    // add plural methods
    moment.fn.days = moment.fn.day;
    moment.fn.months = moment.fn.month;
    moment.fn.weeks = moment.fn.week;
    moment.fn.isoWeeks = moment.fn.isoWeek;
    moment.fn.quarters = moment.fn.quarter;

    // add aliased format methods
    moment.fn.toJSON = moment.fn.toISOString;

    /************************************
        Duration Prototype
    ************************************/


    extend(moment.duration.fn = Duration.prototype, {

        _bubble : function () {
            var milliseconds = this._milliseconds,
                days = this._days,
                months = this._months,
                data = this._data,
                seconds, minutes, hours, years;

            // The following code bubbles up values, see the tests for
            // examples of what that means.
            data.milliseconds = milliseconds % 1000;

            seconds = absRound(milliseconds / 1000);
            data.seconds = seconds % 60;

            minutes = absRound(seconds / 60);
            data.minutes = minutes % 60;

            hours = absRound(minutes / 60);
            data.hours = hours % 24;

            days += absRound(hours / 24);
            data.days = days % 30;

            months += absRound(days / 30);
            data.months = months % 12;

            years = absRound(months / 12);
            data.years = years;
        },

        weeks : function () {
            return absRound(this.days() / 7);
        },

        valueOf : function () {
            return this._milliseconds +
              this._days * 864e5 +
              (this._months % 12) * 2592e6 +
              toInt(this._months / 12) * 31536e6;
        },

        humanize : function (withSuffix) {
            var difference = +this,
                output = relativeTime(difference, !withSuffix, this.lang());

            if (withSuffix) {
                output = this.lang().pastFuture(difference, output);
            }

            return this.lang().postformat(output);
        },

        add : function (input, val) {
            // supports only 2.0-style add(1, 's') or add(moment)
            var dur = moment.duration(input, val);

            this._milliseconds += dur._milliseconds;
            this._days += dur._days;
            this._months += dur._months;

            this._bubble();

            return this;
        },

        subtract : function (input, val) {
            var dur = moment.duration(input, val);

            this._milliseconds -= dur._milliseconds;
            this._days -= dur._days;
            this._months -= dur._months;

            this._bubble();

            return this;
        },

        get : function (units) {
            units = normalizeUnits(units);
            return this[units.toLowerCase() + 's']();
        },

        as : function (units) {
            units = normalizeUnits(units);
            return this['as' + units.charAt(0).toUpperCase() + units.slice(1) + 's']();
        },

        lang : moment.fn.lang,

        toIsoString : function () {
            // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
            var years = Math.abs(this.years()),
                months = Math.abs(this.months()),
                days = Math.abs(this.days()),
                hours = Math.abs(this.hours()),
                minutes = Math.abs(this.minutes()),
                seconds = Math.abs(this.seconds() + this.milliseconds() / 1000);

            if (!this.asSeconds()) {
                // this is the same as C#'s (Noda) and python (isodate)...
                // but not other JS (goog.date)
                return 'P0D';
            }

            return (this.asSeconds() < 0 ? '-' : '') +
                'P' +
                (years ? years + 'Y' : '') +
                (months ? months + 'M' : '') +
                (days ? days + 'D' : '') +
                ((hours || minutes || seconds) ? 'T' : '') +
                (hours ? hours + 'H' : '') +
                (minutes ? minutes + 'M' : '') +
                (seconds ? seconds + 'S' : '');
        }
    });

    function makeDurationGetter(name) {
        moment.duration.fn[name] = function () {
            return this._data[name];
        };
    }

    function makeDurationAsGetter(name, factor) {
        moment.duration.fn['as' + name] = function () {
            return +this / factor;
        };
    }

    for (i in unitMillisecondFactors) {
        if (unitMillisecondFactors.hasOwnProperty(i)) {
            makeDurationAsGetter(i, unitMillisecondFactors[i]);
            makeDurationGetter(i.toLowerCase());
        }
    }

    makeDurationAsGetter('Weeks', 6048e5);
    moment.duration.fn.asMonths = function () {
        return (+this - this.years() * 31536e6) / 2592e6 + this.years() * 12;
    };


    /************************************
        Default Lang
    ************************************/


    // Set default language, other languages will inherit from English.
    moment.lang('en', {
        ordinal : function (number) {
            var b = number % 10,
                output = (toInt(number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
            return number + output;
        }
    });

    /* EMBED_LANGUAGES */

    /************************************
        Exposing Moment
    ************************************/

    function makeGlobal(shouldDeprecate) {
        /*global ender:false */
        if (typeof ender !== 'undefined') {
            return;
        }
        oldGlobalMoment = globalScope.moment;
        if (shouldDeprecate) {
            globalScope.moment = deprecate(
                    "Accessing Moment through the global scope is " +
                    "deprecated, and will be removed in an upcoming " +
                    "release.",
                    moment);
        } else {
            globalScope.moment = moment;
        }
    }

    // CommonJS module is defined
    if (hasModule) {
        module.exports = moment;
    } else if (typeof define === "function" && define.amd) {
        define("moment", ['require','exports','module'],function (require, exports, module) {
            if (module.config && module.config() && module.config().noGlobal === true) {
                // release the global variable
                globalScope.moment = oldGlobalMoment;
            }

            return moment;
        });
        makeGlobal(true);
    } else {
        makeGlobal();
    }
}).call(this);

/*
 XDate v0.7
 Docs & Licensing: http://arshaw.com/xdate/
*/
var XDate=function(g,m,A,p){function f(){var a=this instanceof f?this:new f,c=arguments,b=c.length,d;typeof c[b-1]=="boolean"&&(d=c[--b],c=q(c,0,b));if(b)if(b==1)if(b=c[0],b instanceof g||typeof b=="number")a[0]=new g(+b);else if(b instanceof f){var c=a,h=new g(+b[0]);if(l(b))h.toString=w;c[0]=h}else{if(typeof b=="string"){a[0]=new g(0);a:{for(var c=b,b=d||!1,h=f.parsers,r=0,e;r<h.length;r++)if(e=h[r](c,b,a)){a=e;break a}a[0]=new g(c)}}}else a[0]=new g(n.apply(g,c)),d||(a[0]=s(a[0]));else a[0]=new g;
typeof d=="boolean"&&B(a,d);return a}function l(a){return a[0].toString===w}function B(a,c,b){if(c){if(!l(a))b&&(a[0]=new g(n(a[0].getFullYear(),a[0].getMonth(),a[0].getDate(),a[0].getHours(),a[0].getMinutes(),a[0].getSeconds(),a[0].getMilliseconds()))),a[0].toString=w}else l(a)&&(a[0]=b?s(a[0]):new g(+a[0]));return a}function C(a,c,b,d,h){var e=k(j,a[0],h),a=k(D,a[0],h),h=c==1?b%12:e(1),f=!1;d.length==2&&typeof d[1]=="boolean"&&(f=d[1],d=[b]);a(c,d);f&&e(1)!=h&&(a(1,[e(1)-1]),a(2,[E(e(0),e(1))]))}
function F(a,c,b,d){var b=Number(b),h=m.floor(b);a["set"+o[c]](a["get"+o[c]]()+h,d||!1);h!=b&&c<6&&F(a,c+1,(b-h)*G[c],d)}function H(a,c,b){var a=a.clone().setUTCMode(!0,!0),c=f(c).setUTCMode(!0,!0),d=0;if(b==0||b==1){for(var h=6;h>=b;h--)d/=G[h],d+=j(c,!1,h)-j(a,!1,h);b==1&&(d+=(c.getFullYear()-a.getFullYear())*12)}else b==2?(b=a.toDate().setUTCHours(0,0,0,0),d=c.toDate().setUTCHours(0,0,0,0),d=m.round((d-b)/864E5)+(c-d-(a-b))/864E5):d=(c-a)/[36E5,6E4,1E3,1][b-3];return d}function t(a){var c=a(0),
b=a(1),a=a(2),b=new g(n(c,b,a)),d=u(c),a=d;b<d?a=u(c-1):(c=u(c+1),b>=c&&(a=c));return m.floor(m.round((b-a)/864E5)/7)+1}function u(a){a=new g(n(a,0,4));a.setUTCDate(a.getUTCDate()-(a.getUTCDay()+6)%7);return a}function I(a,c,b,d){var h=k(j,a,d),e=k(D,a,d),b=u(b===p?h(0):b);d||(b=s(b));a.setTime(+b);e(2,[h(2)+(c-1)*7])}function J(a,c,b,d,e){var r=f.locales,g=r[f.defaultLocale]||{},i=k(j,a,e),b=(typeof b=="string"?r[b]:b)||{};return x(a,c,function(a){if(d)for(var b=(a==7?2:a)-1;b>=0;b--)d.push(i(b));
return i(a)},function(a){return b[a]||g[a]},e)}function x(a,c,b,d,e){for(var f,g,i="";f=c.match(M);){i+=c.substr(0,f.index);if(f[1]){g=i;for(var i=a,j=f[1],l=b,m=d,n=e,k=j.length,o=void 0,q="";k>0;)o=N(i,j.substr(0,k),l,m,n),o!==p?(q+=o,j=j.substr(k),k=j.length):k--;i=g+(q+j)}else f[3]?(g=x(a,f[4],b,d,e),parseInt(g.replace(/\D/g,""),10)&&(i+=g)):i+=f[7]||"'";c=c.substr(f.index+f[0].length)}return i+c}function N(a,c,b,d,e){var g=f.formatters[c];if(typeof g=="string")return x(a,g,b,d,e);else if(typeof g==
"function")return g(a,e||!1,d);switch(c){case "fff":return i(b(6),3);case "s":return b(5);case "ss":return i(b(5));case "m":return b(4);case "mm":return i(b(4));case "h":return b(3)%12||12;case "hh":return i(b(3)%12||12);case "H":return b(3);case "HH":return i(b(3));case "d":return b(2);case "dd":return i(b(2));case "ddd":return d("dayNamesShort")[b(7)]||"";case "dddd":return d("dayNames")[b(7)]||"";case "M":return b(1)+1;case "MM":return i(b(1)+1);case "MMM":return d("monthNamesShort")[b(1)]||"";
case "MMMM":return d("monthNames")[b(1)]||"";case "yy":return(b(0)+"").substring(2);case "yyyy":return b(0);case "t":return v(b,d).substr(0,1).toLowerCase();case "tt":return v(b,d).toLowerCase();case "T":return v(b,d).substr(0,1);case "TT":return v(b,d);case "z":case "zz":case "zzz":return e?c="Z":(d=a.getTimezoneOffset(),a=d<0?"+":"-",b=m.floor(m.abs(d)/60),d=m.abs(d)%60,e=b,c=="zz"?e=i(b):c=="zzz"&&(e=i(b)+":"+i(d)),c=a+e),c;case "w":return t(b);case "ww":return i(t(b));case "S":return c=b(2),c>
10&&c<20?"th":["st","nd","rd"][c%10-1]||"th"}}function v(a,c){return a(3)<12?c("amDesignator"):c("pmDesignator")}function y(a){return!isNaN(+a[0])}function j(a,c,b){return a["get"+(c?"UTC":"")+o[b]]()}function D(a,c,b,d){a["set"+(c?"UTC":"")+o[b]].apply(a,d)}function s(a){return new g(a.getUTCFullYear(),a.getUTCMonth(),a.getUTCDate(),a.getUTCHours(),a.getUTCMinutes(),a.getUTCSeconds(),a.getUTCMilliseconds())}function E(a,c){return 32-(new g(n(a,c,32))).getUTCDate()}function z(a){return function(){return a.apply(p,
[this].concat(q(arguments)))}}function k(a){var c=q(arguments,1);return function(){return a.apply(p,c.concat(q(arguments)))}}function q(a,c,b){return A.prototype.slice.call(a,c||0,b===p?a.length:b)}function K(a,c){for(var b=0;b<a.length;b++)c(a[b],b)}function i(a,c){c=c||2;for(a+="";a.length<c;)a="0"+a;return a}var o="FullYear,Month,Date,Hours,Minutes,Seconds,Milliseconds,Day,Year".split(","),L=["Years","Months","Days"],G=[12,31,24,60,60,1E3,1],M=/(([a-zA-Z])\2*)|(\((('.*?'|\(.*?\)|.)*?)\))|('(.*?)')/,
n=g.UTC,w=g.prototype.toUTCString,e=f.prototype;e.length=1;e.splice=A.prototype.splice;e.getUTCMode=z(l);e.setUTCMode=z(B);e.getTimezoneOffset=function(){return l(this)?0:this[0].getTimezoneOffset()};K(o,function(a,c){e["get"+a]=function(){return j(this[0],l(this),c)};c!=8&&(e["getUTC"+a]=function(){return j(this[0],!0,c)});c!=7&&(e["set"+a]=function(a){C(this,c,a,arguments,l(this));return this},c!=8&&(e["setUTC"+a]=function(a){C(this,c,a,arguments,!0);return this},e["add"+(L[c]||a)]=function(a,d){F(this,
c,a,d);return this},e["diff"+(L[c]||a)]=function(a){return H(this,a,c)}))});e.getWeek=function(){return t(k(j,this,!1))};e.getUTCWeek=function(){return t(k(j,this,!0))};e.setWeek=function(a,c){I(this,a,c,!1);return this};e.setUTCWeek=function(a,c){I(this,a,c,!0);return this};e.addWeeks=function(a){return this.addDays(Number(a)*7)};e.diffWeeks=function(a){return H(this,a,2)/7};f.parsers=[function(a,c,b){if(a=a.match(/^(\d{4})(-(\d{2})(-(\d{2})([T ](\d{2}):(\d{2})(:(\d{2})(\.(\d+))?)?(Z|(([-+])(\d{2})(:?(\d{2}))?))?)?)?)?$/)){var d=
new g(n(a[1],a[3]?a[3]-1:0,a[5]||1,a[7]||0,a[8]||0,a[10]||0,a[12]?Number("0."+a[12])*1E3:0));a[13]?a[14]&&d.setUTCMinutes(d.getUTCMinutes()+(a[15]=="-"?1:-1)*(Number(a[16])*60+(a[18]?Number(a[18]):0))):c||(d=s(d));return b.setTime(+d)}}];f.parse=function(a){return+f(""+a)};e.toString=function(a,c,b){return a===p||!y(this)?this[0].toString():J(this,a,c,b,l(this))};e.toUTCString=e.toGMTString=function(a,c,b){return a===p||!y(this)?this[0].toUTCString():J(this,a,c,b,!0)};e.toISOString=function(){return this.toUTCString("yyyy-MM-dd'T'HH:mm:ss(.fff)zzz")};
f.defaultLocale="";f.locales={"":{monthNames:"January,February,March,April,May,June,July,August,September,October,November,December".split(","),monthNamesShort:"Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec".split(","),dayNames:"Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday".split(","),dayNamesShort:"Sun,Mon,Tue,Wed,Thu,Fri,Sat".split(","),amDesignator:"AM",pmDesignator:"PM"}};f.formatters={i:"yyyy-MM-dd'T'HH:mm:ss(.fff)",u:"yyyy-MM-dd'T'HH:mm:ss(.fff)zzz"};K("getTime,valueOf,toDateString,toTimeString,toLocaleString,toLocaleDateString,toLocaleTimeString,toJSON".split(","),
function(a){e[a]=function(){return this[0][a]()}});e.setTime=function(a){this[0].setTime(a);return this};e.valid=z(y);e.clone=function(){return new f(this)};e.clearTime=function(){return this.setHours(0,0,0,0)};e.toDate=function(){return new g(+this[0])};f.now=function(){return+new g};f.today=function(){return(new f).clearTime()};f.UTC=n;f.getDaysInMonth=E;if(typeof module!=="undefined"&&module.exports)module.exports=f;return f}(Date,Math,Array);

define("xdate", function(){});

/* JSONPath 0.8.0 - XPath for JSON
 *
 * Copyright (c) 2007 Stefan Goessner (goessner.net)
 * Licensed under the MIT (MIT-LICENSE.txt) licence.
 */
function jsonPath(obj, expr, arg) {
   var P = {
      resultType: arg && arg.resultType || "VALUE",
      result: [],
      normalize: function(expr) {
         var subx = [];
         return expr.replace(/[\['](\??\(.*?\))[\]']/g, function($0,$1){return "[#"+(subx.push($1)-1)+"]";})
                    .replace(/'?\.'?|\['?/g, ";")
                    .replace(/;;;|;;/g, ";..;")
                    .replace(/;$|'?\]|'$/g, "")
                    .replace(/#([0-9]+)/g, function($0,$1){return subx[$1];});
      },
      asPath: function(path) {
         var x = path.split(";"), p = "$";
         for (var i=1,n=x.length; i<n; i++)
            p += /^[0-9*]+$/.test(x[i]) ? ("["+x[i]+"]") : ("['"+x[i]+"']");
         return p;
      },
      store: function(p, v) {
         if (p) P.result[P.result.length] = P.resultType == "PATH" ? P.asPath(p) : v;
         return !!p;
      },
      trace: function(expr, val, path) {
         if (expr) {
            var x = expr.split(";"), loc = x.shift();
            x = x.join(";");
            if (val && val.hasOwnProperty(loc))
               P.trace(x, val[loc], path + ";" + loc);
            else if (loc === "*")
               P.walk(loc, x, val, path, function(m,l,x,v,p) { P.trace(m+";"+x,v,p); });
            else if (loc === "..") {
               P.trace(x, val, path);
               P.walk(loc, x, val, path, function(m,l,x,v,p) { typeof v[m] === "object" && P.trace("..;"+x,v[m],p+";"+m); });
            }
            else if (/,/.test(loc)) { // [name1,name2,...]
               for (var s=loc.split(/'?,'?/),i=0,n=s.length; i<n; i++)
                  P.trace(s[i]+";"+x, val, path);
            }
            else if (/^\(.*?\)$/.test(loc)) // [(expr)]
               P.trace(P.eval(loc, val, path.substr(path.lastIndexOf(";")+1))+";"+x, val, path);
            else if (/^\?\(.*?\)$/.test(loc)) // [?(expr)]
               P.walk(loc, x, val, path, function(m,l,x,v,p) { if (P.eval(l.replace(/^\?\((.*?)\)$/,"$1"),v[m],m)) P.trace(m+";"+x,v,p); });
            else if (/^(-?[0-9]*):(-?[0-9]*):?([0-9]*)$/.test(loc)) // [start:end:step]  phyton slice syntax
               P.slice(loc, x, val, path);
         }
         else
            P.store(path, val);
      },
      walk: function(loc, expr, val, path, f) {
         if (val instanceof Array) {
            for (var i=0,n=val.length; i<n; i++)
               if (i in val)
                  f(i,loc,expr,val,path);
         }
         else if (typeof val === "object") {
            for (var m in val)
               if (val.hasOwnProperty(m))
                  f(m,loc,expr,val,path);
         }
      },
      slice: function(loc, expr, val, path) {
         if (val instanceof Array) {
            var len=val.length, start=0, end=len, step=1;
            loc.replace(/^(-?[0-9]*):(-?[0-9]*):?(-?[0-9]*)$/g, function($0,$1,$2,$3){start=parseInt($1||start);end=parseInt($2||end);step=parseInt($3||step);});
            start = (start < 0) ? Math.max(0,start+len) : Math.min(len,start);
            end   = (end < 0)   ? Math.max(0,end+len)   : Math.min(len,end);
            for (var i=start; i<end; i+=step)
               P.trace(i+";"+expr, val, path);
         }
      },
      eval: function(x, _v, _vname) {
         try { return $ && _v && eval(x.replace(/@/g, "_v")); }
         catch(e) { throw new SyntaxError("jsonPath: " + e.message + ": " + x.replace(/@/g, "_v").replace(/\^/g, "_a")); }
      }
   };

   var $ = obj;
   if (expr && obj && (P.resultType == "VALUE" || P.resultType == "PATH")) {
      P.trace(P.normalize(expr).replace(/^\$;/,""), obj, "$");
      return P.result.length ? P.result : false;
   }
} 
;
define("jsonpath", function(){});

/**
 * @license
 * lodash 3.10.1 (Custom Build) lodash.com/license | Underscore.js 1.8.3 underscorejs.org/LICENSE
 * Build: `lodash modern -o ./lodash.js`
 */
;(function(){function n(n,t){if(n!==t){var r=null===n,e=n===w,u=n===n,o=null===t,i=t===w,f=t===t;if(n>t&&!o||!u||r&&!i&&f||e&&f)return 1;if(n<t&&!r||!f||o&&!e&&u||i&&u)return-1}return 0}function t(n,t,r){for(var e=n.length,u=r?e:-1;r?u--:++u<e;)if(t(n[u],u,n))return u;return-1}function r(n,t,r){if(t!==t)return p(n,r);r-=1;for(var e=n.length;++r<e;)if(n[r]===t)return r;return-1}function e(n){return typeof n=="function"||false}function u(n){return null==n?"":n+""}function o(n,t){for(var r=-1,e=n.length;++r<e&&-1<t.indexOf(n.charAt(r)););
return r}function i(n,t){for(var r=n.length;r--&&-1<t.indexOf(n.charAt(r)););return r}function f(t,r){return n(t.a,r.a)||t.b-r.b}function a(n){return Nn[n]}function c(n){return Tn[n]}function l(n,t,r){return t?n=Bn[n]:r&&(n=Dn[n]),"\\"+n}function s(n){return"\\"+Dn[n]}function p(n,t,r){var e=n.length;for(t+=r?0:-1;r?t--:++t<e;){var u=n[t];if(u!==u)return t}return-1}function h(n){return!!n&&typeof n=="object"}function _(n){return 160>=n&&9<=n&&13>=n||32==n||160==n||5760==n||6158==n||8192<=n&&(8202>=n||8232==n||8233==n||8239==n||8287==n||12288==n||65279==n);
}function v(n,t){for(var r=-1,e=n.length,u=-1,o=[];++r<e;)n[r]===t&&(n[r]=z,o[++u]=r);return o}function g(n){for(var t=-1,r=n.length;++t<r&&_(n.charCodeAt(t)););return t}function y(n){for(var t=n.length;t--&&_(n.charCodeAt(t)););return t}function d(n){return Ln[n]}function m(_){function Nn(n){if(h(n)&&!(Oo(n)||n instanceof zn)){if(n instanceof Ln)return n;if(nu.call(n,"__chain__")&&nu.call(n,"__wrapped__"))return Mr(n)}return new Ln(n)}function Tn(){}function Ln(n,t,r){this.__wrapped__=n,this.__actions__=r||[],
this.__chain__=!!t}function zn(n){this.__wrapped__=n,this.__actions__=[],this.__dir__=1,this.__filtered__=false,this.__iteratees__=[],this.__takeCount__=Ru,this.__views__=[]}function Bn(){this.__data__={}}function Dn(n){var t=n?n.length:0;for(this.data={hash:gu(null),set:new lu};t--;)this.push(n[t])}function Mn(n,t){var r=n.data;return(typeof t=="string"||ge(t)?r.set.has(t):r.hash[t])?0:-1}function qn(n,t){var r=-1,e=n.length;for(t||(t=Be(e));++r<e;)t[r]=n[r];return t}function Pn(n,t){for(var r=-1,e=n.length;++r<e&&false!==t(n[r],r,n););
return n}function Kn(n,t){for(var r=-1,e=n.length;++r<e;)if(!t(n[r],r,n))return false;return true}function Vn(n,t){for(var r=-1,e=n.length,u=-1,o=[];++r<e;){var i=n[r];t(i,r,n)&&(o[++u]=i)}return o}function Gn(n,t){for(var r=-1,e=n.length,u=Be(e);++r<e;)u[r]=t(n[r],r,n);return u}function Jn(n,t){for(var r=-1,e=t.length,u=n.length;++r<e;)n[u+r]=t[r];return n}function Xn(n,t,r,e){var u=-1,o=n.length;for(e&&o&&(r=n[++u]);++u<o;)r=t(r,n[u],u,n);return r}function Hn(n,t){for(var r=-1,e=n.length;++r<e;)if(t(n[r],r,n))return true;
return false}function Qn(n,t,r,e){return n!==w&&nu.call(e,r)?n:t}function nt(n,t,r){for(var e=-1,u=zo(t),o=u.length;++e<o;){var i=u[e],f=n[i],a=r(f,t[i],i,n,t);(a===a?a===f:f!==f)&&(f!==w||i in n)||(n[i]=a)}return n}function tt(n,t){return null==t?n:et(t,zo(t),n)}function rt(n,t){for(var r=-1,e=null==n,u=!e&&Er(n),o=u?n.length:0,i=t.length,f=Be(i);++r<i;){var a=t[r];f[r]=u?Cr(a,o)?n[a]:w:e?w:n[a]}return f}function et(n,t,r){r||(r={});for(var e=-1,u=t.length;++e<u;){var o=t[e];r[o]=n[o]}return r}function ut(n,t,r){
var e=typeof n;return"function"==e?t===w?n:Bt(n,t,r):null==n?Fe:"object"==e?bt(n):t===w?ze(n):xt(n,t)}function ot(n,t,r,e,u,o,i){var f;if(r&&(f=u?r(n,e,u):r(n)),f!==w)return f;if(!ge(n))return n;if(e=Oo(n)){if(f=kr(n),!t)return qn(n,f)}else{var a=ru.call(n),c=a==K;if(a!=Z&&a!=B&&(!c||u))return Fn[a]?Rr(n,a,t):u?n:{};if(f=Ir(c?{}:n),!t)return tt(f,n)}for(o||(o=[]),i||(i=[]),u=o.length;u--;)if(o[u]==n)return i[u];return o.push(n),i.push(f),(e?Pn:_t)(n,function(e,u){f[u]=ot(e,t,r,u,n,o,i)}),f}function it(n,t,r){
if(typeof n!="function")throw new Ge(L);return su(function(){n.apply(w,r)},t)}function ft(n,t){var e=n?n.length:0,u=[];if(!e)return u;var o=-1,i=xr(),f=i===r,a=f&&t.length>=F&&gu&&lu?new Dn(t):null,c=t.length;a&&(i=Mn,f=false,t=a);n:for(;++o<e;)if(a=n[o],f&&a===a){for(var l=c;l--;)if(t[l]===a)continue n;u.push(a)}else 0>i(t,a,0)&&u.push(a);return u}function at(n,t){var r=true;return Su(n,function(n,e,u){return r=!!t(n,e,u)}),r}function ct(n,t,r,e){var u=e,o=u;return Su(n,function(n,i,f){i=+t(n,i,f),(r(i,u)||i===e&&i===o)&&(u=i,
o=n)}),o}function lt(n,t){var r=[];return Su(n,function(n,e,u){t(n,e,u)&&r.push(n)}),r}function st(n,t,r,e){var u;return r(n,function(n,r,o){return t(n,r,o)?(u=e?r:n,false):void 0}),u}function pt(n,t,r,e){e||(e=[]);for(var u=-1,o=n.length;++u<o;){var i=n[u];h(i)&&Er(i)&&(r||Oo(i)||pe(i))?t?pt(i,t,r,e):Jn(e,i):r||(e[e.length]=i)}return e}function ht(n,t){Nu(n,t,Re)}function _t(n,t){return Nu(n,t,zo)}function vt(n,t){return Tu(n,t,zo)}function gt(n,t){for(var r=-1,e=t.length,u=-1,o=[];++r<e;){var i=t[r];
ve(n[i])&&(o[++u]=i)}return o}function yt(n,t,r){if(null!=n){r!==w&&r in Br(n)&&(t=[r]),r=0;for(var e=t.length;null!=n&&r<e;)n=n[t[r++]];return r&&r==e?n:w}}function dt(n,t,r,e,u,o){if(n===t)n=true;else if(null==n||null==t||!ge(n)&&!h(t))n=n!==n&&t!==t;else n:{var i=dt,f=Oo(n),a=Oo(t),c=D,l=D;f||(c=ru.call(n),c==B?c=Z:c!=Z&&(f=xe(n))),a||(l=ru.call(t),l==B?l=Z:l!=Z&&xe(t));var s=c==Z,a=l==Z,l=c==l;if(!l||f||s){if(!e&&(c=s&&nu.call(n,"__wrapped__"),a=a&&nu.call(t,"__wrapped__"),c||a)){n=i(c?n.value():n,a?t.value():t,r,e,u,o);
break n}if(l){for(u||(u=[]),o||(o=[]),c=u.length;c--;)if(u[c]==n){n=o[c]==t;break n}u.push(n),o.push(t),n=(f?yr:mr)(n,t,i,r,e,u,o),u.pop(),o.pop()}else n=false}else n=dr(n,t,c)}return n}function mt(n,t,r){var e=t.length,u=e,o=!r;if(null==n)return!u;for(n=Br(n);e--;){var i=t[e];if(o&&i[2]?i[1]!==n[i[0]]:!(i[0]in n))return false}for(;++e<u;){var i=t[e],f=i[0],a=n[f],c=i[1];if(o&&i[2]){if(a===w&&!(f in n))return false}else if(i=r?r(a,c,f):w,i===w?!dt(c,a,r,true):!i)return false}return true}function wt(n,t){var r=-1,e=Er(n)?Be(n.length):[];
return Su(n,function(n,u,o){e[++r]=t(n,u,o)}),e}function bt(n){var t=Ar(n);if(1==t.length&&t[0][2]){var r=t[0][0],e=t[0][1];return function(n){return null==n?false:n[r]===e&&(e!==w||r in Br(n))}}return function(n){return mt(n,t)}}function xt(n,t){var r=Oo(n),e=Wr(n)&&t===t&&!ge(t),u=n+"";return n=Dr(n),function(o){if(null==o)return false;var i=u;if(o=Br(o),!(!r&&e||i in o)){if(o=1==n.length?o:yt(o,Et(n,0,-1)),null==o)return false;i=Zr(n),o=Br(o)}return o[i]===t?t!==w||i in o:dt(t,o[i],w,true)}}function At(n,t,r,e,u){
if(!ge(n))return n;var o=Er(t)&&(Oo(t)||xe(t)),i=o?w:zo(t);return Pn(i||t,function(f,a){if(i&&(a=f,f=t[a]),h(f)){e||(e=[]),u||(u=[]);n:{for(var c=a,l=e,s=u,p=l.length,_=t[c];p--;)if(l[p]==_){n[c]=s[p];break n}var p=n[c],v=r?r(p,_,c,n,t):w,g=v===w;g&&(v=_,Er(_)&&(Oo(_)||xe(_))?v=Oo(p)?p:Er(p)?qn(p):[]:me(_)||pe(_)?v=pe(p)?ke(p):me(p)?p:{}:g=false),l.push(_),s.push(v),g?n[c]=At(v,_,r,l,s):(v===v?v!==p:p===p)&&(n[c]=v)}}else c=n[a],l=r?r(c,f,a,n,t):w,(s=l===w)&&(l=f),l===w&&(!o||a in n)||!s&&(l===l?l===c:c!==c)||(n[a]=l);
}),n}function jt(n){return function(t){return null==t?w:t[n]}}function kt(n){var t=n+"";return n=Dr(n),function(r){return yt(r,n,t)}}function It(n,t){for(var r=n?t.length:0;r--;){var e=t[r];if(e!=u&&Cr(e)){var u=e;pu.call(n,e,1)}}}function Rt(n,t){return n+yu(ku()*(t-n+1))}function Ot(n,t,r,e,u){return u(n,function(n,u,o){r=e?(e=false,n):t(r,n,u,o)}),r}function Et(n,t,r){var e=-1,u=n.length;for(t=null==t?0:+t||0,0>t&&(t=-t>u?0:u+t),r=r===w||r>u?u:+r||0,0>r&&(r+=u),u=t>r?0:r-t>>>0,t>>>=0,r=Be(u);++e<u;)r[e]=n[e+t];
return r}function Ct(n,t){var r;return Su(n,function(n,e,u){return r=t(n,e,u),!r}),!!r}function Ut(n,t){var r=n.length;for(n.sort(t);r--;)n[r]=n[r].c;return n}function Wt(t,r,e){var u=wr(),o=-1;return r=Gn(r,function(n){return u(n)}),t=wt(t,function(n){return{a:Gn(r,function(t){return t(n)}),b:++o,c:n}}),Ut(t,function(t,r){var u;n:{for(var o=-1,i=t.a,f=r.a,a=i.length,c=e.length;++o<a;)if(u=n(i[o],f[o])){if(o>=c)break n;o=e[o],u*="asc"===o||true===o?1:-1;break n}u=t.b-r.b}return u})}function $t(n,t){
var r=0;return Su(n,function(n,e,u){r+=+t(n,e,u)||0}),r}function St(n,t){var e=-1,u=xr(),o=n.length,i=u===r,f=i&&o>=F,a=f&&gu&&lu?new Dn(void 0):null,c=[];a?(u=Mn,i=false):(f=false,a=t?[]:c);n:for(;++e<o;){var l=n[e],s=t?t(l,e,n):l;if(i&&l===l){for(var p=a.length;p--;)if(a[p]===s)continue n;t&&a.push(s),c.push(l)}else 0>u(a,s,0)&&((t||f)&&a.push(s),c.push(l))}return c}function Ft(n,t){for(var r=-1,e=t.length,u=Be(e);++r<e;)u[r]=n[t[r]];return u}function Nt(n,t,r,e){for(var u=n.length,o=e?u:-1;(e?o--:++o<u)&&t(n[o],o,n););
return r?Et(n,e?0:o,e?o+1:u):Et(n,e?o+1:0,e?u:o)}function Tt(n,t){var r=n;r instanceof zn&&(r=r.value());for(var e=-1,u=t.length;++e<u;)var o=t[e],r=o.func.apply(o.thisArg,Jn([r],o.args));return r}function Lt(n,t,r){var e=0,u=n?n.length:e;if(typeof t=="number"&&t===t&&u<=Eu){for(;e<u;){var o=e+u>>>1,i=n[o];(r?i<=t:i<t)&&null!==i?e=o+1:u=o}return u}return zt(n,t,Fe,r)}function zt(n,t,r,e){t=r(t);for(var u=0,o=n?n.length:0,i=t!==t,f=null===t,a=t===w;u<o;){var c=yu((u+o)/2),l=r(n[c]),s=l!==w,p=l===l;
(i?p||e:f?p&&s&&(e||null!=l):a?p&&(e||s):null==l?0:e?l<=t:l<t)?u=c+1:o=c}return xu(o,Ou)}function Bt(n,t,r){if(typeof n!="function")return Fe;if(t===w)return n;switch(r){case 1:return function(r){return n.call(t,r)};case 3:return function(r,e,u){return n.call(t,r,e,u)};case 4:return function(r,e,u,o){return n.call(t,r,e,u,o)};case 5:return function(r,e,u,o,i){return n.call(t,r,e,u,o,i)}}return function(){return n.apply(t,arguments)}}function Dt(n){var t=new ou(n.byteLength);return new hu(t).set(new hu(n)),
t}function Mt(n,t,r){for(var e=r.length,u=-1,o=bu(n.length-e,0),i=-1,f=t.length,a=Be(f+o);++i<f;)a[i]=t[i];for(;++u<e;)a[r[u]]=n[u];for(;o--;)a[i++]=n[u++];return a}function qt(n,t,r){for(var e=-1,u=r.length,o=-1,i=bu(n.length-u,0),f=-1,a=t.length,c=Be(i+a);++o<i;)c[o]=n[o];for(i=o;++f<a;)c[i+f]=t[f];for(;++e<u;)c[i+r[e]]=n[o++];return c}function Pt(n,t){return function(r,e,u){var o=t?t():{};if(e=wr(e,u,3),Oo(r)){u=-1;for(var i=r.length;++u<i;){var f=r[u];n(o,f,e(f,u,r),r)}}else Su(r,function(t,r,u){
n(o,t,e(t,r,u),u)});return o}}function Kt(n){return le(function(t,r){var e=-1,u=null==t?0:r.length,o=2<u?r[u-2]:w,i=2<u?r[2]:w,f=1<u?r[u-1]:w;for(typeof o=="function"?(o=Bt(o,f,5),u-=2):(o=typeof f=="function"?f:w,u-=o?1:0),i&&Ur(r[0],r[1],i)&&(o=3>u?w:o,u=1);++e<u;)(i=r[e])&&n(t,i,o);return t})}function Vt(n,t){return function(r,e){var u=r?Bu(r):0;if(!Sr(u))return n(r,e);for(var o=t?u:-1,i=Br(r);(t?o--:++o<u)&&false!==e(i[o],o,i););return r}}function Zt(n){return function(t,r,e){var u=Br(t);e=e(t);for(var o=e.length,i=n?o:-1;n?i--:++i<o;){
var f=e[i];if(false===r(u[f],f,u))break}return t}}function Yt(n,t){function r(){return(this&&this!==Zn&&this instanceof r?e:n).apply(t,arguments)}var e=Jt(n);return r}function Gt(n){return function(t){var r=-1;t=$e(Ce(t));for(var e=t.length,u="";++r<e;)u=n(u,t[r],r);return u}}function Jt(n){return function(){var t=arguments;switch(t.length){case 0:return new n;case 1:return new n(t[0]);case 2:return new n(t[0],t[1]);case 3:return new n(t[0],t[1],t[2]);case 4:return new n(t[0],t[1],t[2],t[3]);case 5:
return new n(t[0],t[1],t[2],t[3],t[4]);case 6:return new n(t[0],t[1],t[2],t[3],t[4],t[5]);case 7:return new n(t[0],t[1],t[2],t[3],t[4],t[5],t[6])}var r=$u(n.prototype),t=n.apply(r,t);return ge(t)?t:r}}function Xt(n){function t(r,e,u){return u&&Ur(r,e,u)&&(e=w),r=gr(r,n,w,w,w,w,w,e),r.placeholder=t.placeholder,r}return t}function Ht(n,t){return le(function(r){var e=r[0];return null==e?e:(r.push(t),n.apply(w,r))})}function Qt(n,t){return function(r,e,u){if(u&&Ur(r,e,u)&&(e=w),e=wr(e,u,3),1==e.length){
u=r=Oo(r)?r:zr(r);for(var o=e,i=-1,f=u.length,a=t,c=a;++i<f;){var l=u[i],s=+o(l);n(s,a)&&(a=s,c=l)}if(u=c,!r.length||u!==t)return u}return ct(r,e,n,t)}}function nr(n,r){return function(e,u,o){return u=wr(u,o,3),Oo(e)?(u=t(e,u,r),-1<u?e[u]:w):st(e,u,n)}}function tr(n){return function(r,e,u){return r&&r.length?(e=wr(e,u,3),t(r,e,n)):-1}}function rr(n){return function(t,r,e){return r=wr(r,e,3),st(t,r,n,true)}}function er(n){return function(){for(var t,r=arguments.length,e=n?r:-1,u=0,o=Be(r);n?e--:++e<r;){
var i=o[u++]=arguments[e];if(typeof i!="function")throw new Ge(L);!t&&Ln.prototype.thru&&"wrapper"==br(i)&&(t=new Ln([],true))}for(e=t?-1:r;++e<r;){var i=o[e],u=br(i),f="wrapper"==u?zu(i):w;t=f&&$r(f[0])&&f[1]==(E|k|R|C)&&!f[4].length&&1==f[9]?t[br(f[0])].apply(t,f[3]):1==i.length&&$r(i)?t[u]():t.thru(i)}return function(){var n=arguments,e=n[0];if(t&&1==n.length&&Oo(e)&&e.length>=F)return t.plant(e).value();for(var u=0,n=r?o[u].apply(this,n):e;++u<r;)n=o[u].call(this,n);return n}}}function ur(n,t){
return function(r,e,u){return typeof e=="function"&&u===w&&Oo(r)?n(r,e):t(r,Bt(e,u,3))}}function or(n){return function(t,r,e){return(typeof r!="function"||e!==w)&&(r=Bt(r,e,3)),n(t,r,Re)}}function ir(n){return function(t,r,e){return(typeof r!="function"||e!==w)&&(r=Bt(r,e,3)),n(t,r)}}function fr(n){return function(t,r,e){var u={};return r=wr(r,e,3),_t(t,function(t,e,o){o=r(t,e,o),e=n?o:e,t=n?t:o,u[e]=t}),u}}function ar(n){return function(t,r,e){return t=u(t),(n?t:"")+pr(t,r,e)+(n?"":t)}}function cr(n){
var t=le(function(r,e){var u=v(e,t.placeholder);return gr(r,n,w,e,u)});return t}function lr(n,t){return function(r,e,u,o){var i=3>arguments.length;return typeof e=="function"&&o===w&&Oo(r)?n(r,e,u,i):Ot(r,wr(e,o,4),u,i,t)}}function sr(n,t,r,e,u,o,i,f,a,c){function l(){for(var m=arguments.length,b=m,j=Be(m);b--;)j[b]=arguments[b];if(e&&(j=Mt(j,e,u)),o&&(j=qt(j,o,i)),_||y){var b=l.placeholder,k=v(j,b),m=m-k.length;if(m<c){var I=f?qn(f):w,m=bu(c-m,0),E=_?k:w,k=_?w:k,C=_?j:w,j=_?w:j;return t|=_?R:O,t&=~(_?O:R),
g||(t&=~(x|A)),j=[n,t,r,C,E,j,k,I,a,m],I=sr.apply(w,j),$r(n)&&Du(I,j),I.placeholder=b,I}}if(b=p?r:this,I=h?b[n]:n,f)for(m=j.length,E=xu(f.length,m),k=qn(j);E--;)C=f[E],j[E]=Cr(C,m)?k[C]:w;return s&&a<j.length&&(j.length=a),this&&this!==Zn&&this instanceof l&&(I=d||Jt(n)),I.apply(b,j)}var s=t&E,p=t&x,h=t&A,_=t&k,g=t&j,y=t&I,d=h?w:Jt(n);return l}function pr(n,t,r){return n=n.length,t=+t,n<t&&mu(t)?(t-=n,r=null==r?" ":r+"",Ue(r,vu(t/r.length)).slice(0,t)):""}function hr(n,t,r,e){function u(){for(var t=-1,f=arguments.length,a=-1,c=e.length,l=Be(c+f);++a<c;)l[a]=e[a];
for(;f--;)l[a++]=arguments[++t];return(this&&this!==Zn&&this instanceof u?i:n).apply(o?r:this,l)}var o=t&x,i=Jt(n);return u}function _r(n){var t=Pe[n];return function(n,r){return(r=r===w?0:+r||0)?(r=au(10,r),t(n*r)/r):t(n)}}function vr(n){return function(t,r,e,u){var o=wr(e);return null==e&&o===ut?Lt(t,r,n):zt(t,r,o(e,u,1),n)}}function gr(n,t,r,e,u,o,i,f){var a=t&A;if(!a&&typeof n!="function")throw new Ge(L);var c=e?e.length:0;if(c||(t&=~(R|O),e=u=w),c-=u?u.length:0,t&O){var l=e,s=u;e=u=w}var p=a?w:zu(n);
return r=[n,t,r,e,u,l,s,o,i,f],p&&(e=r[1],t=p[1],f=e|t,u=t==E&&e==k||t==E&&e==C&&r[7].length<=p[8]||t==(E|C)&&e==k,(f<E||u)&&(t&x&&(r[2]=p[2],f|=e&x?0:j),(e=p[3])&&(u=r[3],r[3]=u?Mt(u,e,p[4]):qn(e),r[4]=u?v(r[3],z):qn(p[4])),(e=p[5])&&(u=r[5],r[5]=u?qt(u,e,p[6]):qn(e),r[6]=u?v(r[5],z):qn(p[6])),(e=p[7])&&(r[7]=qn(e)),t&E&&(r[8]=null==r[8]?p[8]:xu(r[8],p[8])),null==r[9]&&(r[9]=p[9]),r[0]=p[0],r[1]=f),t=r[1],f=r[9]),r[9]=null==f?a?0:n.length:bu(f-c,0)||0,(p?Lu:Du)(t==x?Yt(r[0],r[2]):t!=R&&t!=(x|R)||r[4].length?sr.apply(w,r):hr.apply(w,r),r);
}function yr(n,t,r,e,u,o,i){var f=-1,a=n.length,c=t.length;if(a!=c&&(!u||c<=a))return false;for(;++f<a;){var l=n[f],c=t[f],s=e?e(u?c:l,u?l:c,f):w;if(s!==w){if(s)continue;return false}if(u){if(!Hn(t,function(n){return l===n||r(l,n,e,u,o,i)}))return false}else if(l!==c&&!r(l,c,e,u,o,i))return false}return true}function dr(n,t,r){switch(r){case M:case q:return+n==+t;case P:return n.name==t.name&&n.message==t.message;case V:return n!=+n?t!=+t:n==+t;case Y:case G:return n==t+""}return false}function mr(n,t,r,e,u,o,i){var f=zo(n),a=f.length,c=zo(t).length;
if(a!=c&&!u)return false;for(c=a;c--;){var l=f[c];if(!(u?l in t:nu.call(t,l)))return false}for(var s=u;++c<a;){var l=f[c],p=n[l],h=t[l],_=e?e(u?h:p,u?p:h,l):w;if(_===w?!r(p,h,e,u,o,i):!_)return false;s||(s="constructor"==l)}return s||(r=n.constructor,e=t.constructor,!(r!=e&&"constructor"in n&&"constructor"in t)||typeof r=="function"&&r instanceof r&&typeof e=="function"&&e instanceof e)?true:false}function wr(n,t,r){var e=Nn.callback||Se,e=e===Se?ut:e;return r?e(n,t,r):e}function br(n){for(var t=n.name+"",r=Wu[t],e=r?r.length:0;e--;){
var u=r[e],o=u.func;if(null==o||o==n)return u.name}return t}function xr(n,t,e){var u=Nn.indexOf||Vr,u=u===Vr?r:u;return n?u(n,t,e):u}function Ar(n){n=Oe(n);for(var t=n.length;t--;){var r=n[t][1];n[t][2]=r===r&&!ge(r)}return n}function jr(n,t){var r=null==n?w:n[t];return ye(r)?r:w}function kr(n){var t=n.length,r=new n.constructor(t);return t&&"string"==typeof n[0]&&nu.call(n,"index")&&(r.index=n.index,r.input=n.input),r}function Ir(n){return n=n.constructor,typeof n=="function"&&n instanceof n||(n=Ve),
new n}function Rr(n,t,r){var e=n.constructor;switch(t){case J:return Dt(n);case M:case q:return new e(+n);case X:case H:case Q:case nn:case tn:case rn:case en:case un:case on:return t=n.buffer,new e(r?Dt(t):t,n.byteOffset,n.length);case V:case G:return new e(n);case Y:var u=new e(n.source,kn.exec(n));u.lastIndex=n.lastIndex}return u}function Or(n,t,r){return null==n||Wr(t,n)||(t=Dr(t),n=1==t.length?n:yt(n,Et(t,0,-1)),t=Zr(t)),t=null==n?n:n[t],null==t?w:t.apply(n,r)}function Er(n){return null!=n&&Sr(Bu(n));
}function Cr(n,t){return n=typeof n=="number"||On.test(n)?+n:-1,t=null==t?Cu:t,-1<n&&0==n%1&&n<t}function Ur(n,t,r){if(!ge(r))return false;var e=typeof t;return("number"==e?Er(r)&&Cr(t,r.length):"string"==e&&t in r)?(t=r[t],n===n?n===t:t!==t):false}function Wr(n,t){var r=typeof n;return"string"==r&&dn.test(n)||"number"==r?true:Oo(n)?false:!yn.test(n)||null!=t&&n in Br(t)}function $r(n){var t=br(n),r=Nn[t];return typeof r=="function"&&t in zn.prototype?n===r?true:(t=zu(r),!!t&&n===t[0]):false}function Sr(n){return typeof n=="number"&&-1<n&&0==n%1&&n<=Cu;
}function Fr(n,t){return n===w?t:Eo(n,t,Fr)}function Nr(n,t){n=Br(n);for(var r=-1,e=t.length,u={};++r<e;){var o=t[r];o in n&&(u[o]=n[o])}return u}function Tr(n,t){var r={};return ht(n,function(n,e,u){t(n,e,u)&&(r[e]=n)}),r}function Lr(n){for(var t=Re(n),r=t.length,e=r&&n.length,u=!!e&&Sr(e)&&(Oo(n)||pe(n)),o=-1,i=[];++o<r;){var f=t[o];(u&&Cr(f,e)||nu.call(n,f))&&i.push(f)}return i}function zr(n){return null==n?[]:Er(n)?ge(n)?n:Ve(n):Ee(n)}function Br(n){return ge(n)?n:Ve(n)}function Dr(n){if(Oo(n))return n;
var t=[];return u(n).replace(mn,function(n,r,e,u){t.push(e?u.replace(An,"$1"):r||n)}),t}function Mr(n){return n instanceof zn?n.clone():new Ln(n.__wrapped__,n.__chain__,qn(n.__actions__))}function qr(n,t,r){return n&&n.length?((r?Ur(n,t,r):null==t)&&(t=1),Et(n,0>t?0:t)):[]}function Pr(n,t,r){var e=n?n.length:0;return e?((r?Ur(n,t,r):null==t)&&(t=1),t=e-(+t||0),Et(n,0,0>t?0:t)):[]}function Kr(n){return n?n[0]:w}function Vr(n,t,e){var u=n?n.length:0;if(!u)return-1;if(typeof e=="number")e=0>e?bu(u+e,0):e;else if(e)return e=Lt(n,t),
e<u&&(t===t?t===n[e]:n[e]!==n[e])?e:-1;return r(n,t,e||0)}function Zr(n){var t=n?n.length:0;return t?n[t-1]:w}function Yr(n){return qr(n,1)}function Gr(n,t,e,u){if(!n||!n.length)return[];null!=t&&typeof t!="boolean"&&(u=e,e=Ur(n,t,u)?w:t,t=false);var o=wr();if((null!=e||o!==ut)&&(e=o(e,u,3)),t&&xr()===r){t=e;var i;e=-1,u=n.length;for(var o=-1,f=[];++e<u;){var a=n[e],c=t?t(a,e,n):a;e&&i===c||(i=c,f[++o]=a)}n=f}else n=St(n,e);return n}function Jr(n){if(!n||!n.length)return[];var t=-1,r=0;n=Vn(n,function(n){
return Er(n)?(r=bu(n.length,r),true):void 0});for(var e=Be(r);++t<r;)e[t]=Gn(n,jt(t));return e}function Xr(n,t,r){return n&&n.length?(n=Jr(n),null==t?n:(t=Bt(t,r,4),Gn(n,function(n){return Xn(n,t,w,true)}))):[]}function Hr(n,t){var r=-1,e=n?n.length:0,u={};for(!e||t||Oo(n[0])||(t=[]);++r<e;){var o=n[r];t?u[o]=t[r]:o&&(u[o[0]]=o[1])}return u}function Qr(n){return n=Nn(n),n.__chain__=true,n}function ne(n,t,r){return t.call(r,n)}function te(n,t,r){var e=Oo(n)?Kn:at;return r&&Ur(n,t,r)&&(t=w),(typeof t!="function"||r!==w)&&(t=wr(t,r,3)),
e(n,t)}function re(n,t,r){var e=Oo(n)?Vn:lt;return t=wr(t,r,3),e(n,t)}function ee(n,t,r,e){var u=n?Bu(n):0;return Sr(u)||(n=Ee(n),u=n.length),r=typeof r!="number"||e&&Ur(t,r,e)?0:0>r?bu(u+r,0):r||0,typeof n=="string"||!Oo(n)&&be(n)?r<=u&&-1<n.indexOf(t,r):!!u&&-1<xr(n,t,r)}function ue(n,t,r){var e=Oo(n)?Gn:wt;return t=wr(t,r,3),e(n,t)}function oe(n,t,r){if(r?Ur(n,t,r):null==t){n=zr(n);var e=n.length;return 0<e?n[Rt(0,e-1)]:w}r=-1,n=je(n);var e=n.length,u=e-1;for(t=xu(0>t?0:+t||0,e);++r<t;){var e=Rt(r,u),o=n[e];
n[e]=n[r],n[r]=o}return n.length=t,n}function ie(n,t,r){var e=Oo(n)?Hn:Ct;return r&&Ur(n,t,r)&&(t=w),(typeof t!="function"||r!==w)&&(t=wr(t,r,3)),e(n,t)}function fe(n,t){var r;if(typeof t!="function"){if(typeof n!="function")throw new Ge(L);var e=n;n=t,t=e}return function(){return 0<--n&&(r=t.apply(this,arguments)),1>=n&&(t=w),r}}function ae(n,t,r){function e(t,r){r&&iu(r),a=p=h=w,t&&(_=ho(),c=n.apply(s,f),p||a||(f=s=w))}function u(){var n=t-(ho()-l);0>=n||n>t?e(h,a):p=su(u,n)}function o(){e(g,p);
}function i(){if(f=arguments,l=ho(),s=this,h=g&&(p||!y),false===v)var r=y&&!p;else{a||y||(_=l);var e=v-(l-_),i=0>=e||e>v;i?(a&&(a=iu(a)),_=l,c=n.apply(s,f)):a||(a=su(o,e))}return i&&p?p=iu(p):p||t===v||(p=su(u,t)),r&&(i=true,c=n.apply(s,f)),!i||p||a||(f=s=w),c}var f,a,c,l,s,p,h,_=0,v=false,g=true;if(typeof n!="function")throw new Ge(L);if(t=0>t?0:+t||0,true===r)var y=true,g=false;else ge(r)&&(y=!!r.leading,v="maxWait"in r&&bu(+r.maxWait||0,t),g="trailing"in r?!!r.trailing:g);return i.cancel=function(){p&&iu(p),a&&iu(a),
_=0,a=p=h=w},i}function ce(n,t){function r(){var e=arguments,u=t?t.apply(this,e):e[0],o=r.cache;return o.has(u)?o.get(u):(e=n.apply(this,e),r.cache=o.set(u,e),e)}if(typeof n!="function"||t&&typeof t!="function")throw new Ge(L);return r.cache=new ce.Cache,r}function le(n,t){if(typeof n!="function")throw new Ge(L);return t=bu(t===w?n.length-1:+t||0,0),function(){for(var r=arguments,e=-1,u=bu(r.length-t,0),o=Be(u);++e<u;)o[e]=r[t+e];switch(t){case 0:return n.call(this,o);case 1:return n.call(this,r[0],o);
case 2:return n.call(this,r[0],r[1],o)}for(u=Be(t+1),e=-1;++e<t;)u[e]=r[e];return u[t]=o,n.apply(this,u)}}function se(n,t){return n>t}function pe(n){return h(n)&&Er(n)&&nu.call(n,"callee")&&!cu.call(n,"callee")}function he(n,t,r,e){return e=(r=typeof r=="function"?Bt(r,e,3):w)?r(n,t):w,e===w?dt(n,t,r):!!e}function _e(n){return h(n)&&typeof n.message=="string"&&ru.call(n)==P}function ve(n){return ge(n)&&ru.call(n)==K}function ge(n){var t=typeof n;return!!n&&("object"==t||"function"==t)}function ye(n){
return null==n?false:ve(n)?uu.test(Qe.call(n)):h(n)&&Rn.test(n)}function de(n){return typeof n=="number"||h(n)&&ru.call(n)==V}function me(n){var t;if(!h(n)||ru.call(n)!=Z||pe(n)||!(nu.call(n,"constructor")||(t=n.constructor,typeof t!="function"||t instanceof t)))return false;var r;return ht(n,function(n,t){r=t}),r===w||nu.call(n,r)}function we(n){return ge(n)&&ru.call(n)==Y}function be(n){return typeof n=="string"||h(n)&&ru.call(n)==G}function xe(n){return h(n)&&Sr(n.length)&&!!Sn[ru.call(n)]}function Ae(n,t){
return n<t}function je(n){var t=n?Bu(n):0;return Sr(t)?t?qn(n):[]:Ee(n)}function ke(n){return et(n,Re(n))}function Ie(n){return gt(n,Re(n))}function Re(n){if(null==n)return[];ge(n)||(n=Ve(n));for(var t=n.length,t=t&&Sr(t)&&(Oo(n)||pe(n))&&t||0,r=n.constructor,e=-1,r=typeof r=="function"&&r.prototype===n,u=Be(t),o=0<t;++e<t;)u[e]=e+"";for(var i in n)o&&Cr(i,t)||"constructor"==i&&(r||!nu.call(n,i))||u.push(i);return u}function Oe(n){n=Br(n);for(var t=-1,r=zo(n),e=r.length,u=Be(e);++t<e;){var o=r[t];
u[t]=[o,n[o]]}return u}function Ee(n){return Ft(n,zo(n))}function Ce(n){return(n=u(n))&&n.replace(En,a).replace(xn,"")}function Ue(n,t){var r="";if(n=u(n),t=+t,1>t||!n||!mu(t))return r;do t%2&&(r+=n),t=yu(t/2),n+=n;while(t);return r}function We(n,t,r){var e=n;return(n=u(n))?(r?Ur(e,t,r):null==t)?n.slice(g(n),y(n)+1):(t+="",n.slice(o(n,t),i(n,t)+1)):n}function $e(n,t,r){return r&&Ur(n,t,r)&&(t=w),n=u(n),n.match(t||Wn)||[]}function Se(n,t,r){return r&&Ur(n,t,r)&&(t=w),h(n)?Ne(n):ut(n,t)}function Fe(n){
return n}function Ne(n){return bt(ot(n,true))}function Te(n,t,r){if(null==r){var e=ge(t),u=e?zo(t):w;((u=u&&u.length?gt(t,u):w)?u.length:e)||(u=false,r=t,t=n,n=this)}u||(u=gt(t,zo(t)));var o=true,e=-1,i=ve(n),f=u.length;false===r?o=false:ge(r)&&"chain"in r&&(o=r.chain);for(;++e<f;){r=u[e];var a=t[r];n[r]=a,i&&(n.prototype[r]=function(t){return function(){var r=this.__chain__;if(o||r){var e=n(this.__wrapped__);return(e.__actions__=qn(this.__actions__)).push({func:t,args:arguments,thisArg:n}),e.__chain__=r,e}return t.apply(n,Jn([this.value()],arguments));
}}(a))}return n}function Le(){}function ze(n){return Wr(n)?jt(n):kt(n)}_=_?Yn.defaults(Zn.Object(),_,Yn.pick(Zn,$n)):Zn;var Be=_.Array,De=_.Date,Me=_.Error,qe=_.Function,Pe=_.Math,Ke=_.Number,Ve=_.Object,Ze=_.RegExp,Ye=_.String,Ge=_.TypeError,Je=Be.prototype,Xe=Ve.prototype,He=Ye.prototype,Qe=qe.prototype.toString,nu=Xe.hasOwnProperty,tu=0,ru=Xe.toString,eu=Zn._,uu=Ze("^"+Qe.call(nu).replace(/[\\^$.*+?()[\]{}|]/g,"\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g,"$1.*?")+"$"),ou=_.ArrayBuffer,iu=_.clearTimeout,fu=_.parseFloat,au=Pe.pow,cu=Xe.propertyIsEnumerable,lu=jr(_,"Set"),su=_.setTimeout,pu=Je.splice,hu=_.Uint8Array,_u=jr(_,"WeakMap"),vu=Pe.ceil,gu=jr(Ve,"create"),yu=Pe.floor,du=jr(Be,"isArray"),mu=_.isFinite,wu=jr(Ve,"keys"),bu=Pe.max,xu=Pe.min,Au=jr(De,"now"),ju=_.parseInt,ku=Pe.random,Iu=Ke.NEGATIVE_INFINITY,Ru=Ke.POSITIVE_INFINITY,Ou=4294967294,Eu=2147483647,Cu=9007199254740991,Uu=_u&&new _u,Wu={};
Nn.support={},Nn.templateSettings={escape:_n,evaluate:vn,interpolate:gn,variable:"",imports:{_:Nn}};var $u=function(){function n(){}return function(t){if(ge(t)){n.prototype=t;var r=new n;n.prototype=w}return r||{}}}(),Su=Vt(_t),Fu=Vt(vt,true),Nu=Zt(),Tu=Zt(true),Lu=Uu?function(n,t){return Uu.set(n,t),n}:Fe,zu=Uu?function(n){return Uu.get(n)}:Le,Bu=jt("length"),Du=function(){var n=0,t=0;return function(r,e){var u=ho(),o=S-(u-t);if(t=u,0<o){if(++n>=$)return r}else n=0;return Lu(r,e)}}(),Mu=le(function(n,t){
return h(n)&&Er(n)?ft(n,pt(t,false,true)):[]}),qu=tr(),Pu=tr(true),Ku=le(function(n){for(var t=n.length,e=t,u=Be(l),o=xr(),i=o===r,f=[];e--;){var a=n[e]=Er(a=n[e])?a:[];u[e]=i&&120<=a.length&&gu&&lu?new Dn(e&&a):null}var i=n[0],c=-1,l=i?i.length:0,s=u[0];n:for(;++c<l;)if(a=i[c],0>(s?Mn(s,a):o(f,a,0))){for(e=t;--e;){var p=u[e];if(0>(p?Mn(p,a):o(n[e],a,0)))continue n}s&&s.push(a),f.push(a)}return f}),Vu=le(function(t,r){r=pt(r);var e=rt(t,r);return It(t,r.sort(n)),e}),Zu=vr(),Yu=vr(true),Gu=le(function(n){return St(pt(n,false,true));
}),Ju=le(function(n,t){return Er(n)?ft(n,t):[]}),Xu=le(Jr),Hu=le(function(n){var t=n.length,r=2<t?n[t-2]:w,e=1<t?n[t-1]:w;return 2<t&&typeof r=="function"?t-=2:(r=1<t&&typeof e=="function"?(--t,e):w,e=w),n.length=t,Xr(n,r,e)}),Qu=le(function(n){return n=pt(n),this.thru(function(t){t=Oo(t)?t:[Br(t)];for(var r=n,e=-1,u=t.length,o=-1,i=r.length,f=Be(u+i);++e<u;)f[e]=t[e];for(;++o<i;)f[e++]=r[o];return f})}),no=le(function(n,t){return rt(n,pt(t))}),to=Pt(function(n,t,r){nu.call(n,r)?++n[r]:n[r]=1}),ro=nr(Su),eo=nr(Fu,true),uo=ur(Pn,Su),oo=ur(function(n,t){
for(var r=n.length;r--&&false!==t(n[r],r,n););return n},Fu),io=Pt(function(n,t,r){nu.call(n,r)?n[r].push(t):n[r]=[t]}),fo=Pt(function(n,t,r){n[r]=t}),ao=le(function(n,t,r){var e=-1,u=typeof t=="function",o=Wr(t),i=Er(n)?Be(n.length):[];return Su(n,function(n){var f=u?t:o&&null!=n?n[t]:w;i[++e]=f?f.apply(n,r):Or(n,t,r)}),i}),co=Pt(function(n,t,r){n[r?0:1].push(t)},function(){return[[],[]]}),lo=lr(Xn,Su),so=lr(function(n,t,r,e){var u=n.length;for(e&&u&&(r=n[--u]);u--;)r=t(r,n[u],u,n);return r},Fu),po=le(function(n,t){
if(null==n)return[];var r=t[2];return r&&Ur(t[0],t[1],r)&&(t.length=1),Wt(n,pt(t),[])}),ho=Au||function(){return(new De).getTime()},_o=le(function(n,t,r){var e=x;if(r.length)var u=v(r,_o.placeholder),e=e|R;return gr(n,e,t,r,u)}),vo=le(function(n,t){t=t.length?pt(t):Ie(n);for(var r=-1,e=t.length;++r<e;){var u=t[r];n[u]=gr(n[u],x,n)}return n}),go=le(function(n,t,r){var e=x|A;if(r.length)var u=v(r,go.placeholder),e=e|R;return gr(t,e,n,r,u)}),yo=Xt(k),mo=Xt(I),wo=le(function(n,t){return it(n,1,t)}),bo=le(function(n,t,r){
return it(n,t,r)}),xo=er(),Ao=er(true),jo=le(function(n,t){if(t=pt(t),typeof n!="function"||!Kn(t,e))throw new Ge(L);var r=t.length;return le(function(e){for(var u=xu(e.length,r);u--;)e[u]=t[u](e[u]);return n.apply(this,e)})}),ko=cr(R),Io=cr(O),Ro=le(function(n,t){return gr(n,C,w,w,w,pt(t))}),Oo=du||function(n){return h(n)&&Sr(n.length)&&ru.call(n)==D},Eo=Kt(At),Co=Kt(function(n,t,r){return r?nt(n,t,r):tt(n,t)}),Uo=Ht(Co,function(n,t){return n===w?t:n}),Wo=Ht(Eo,Fr),$o=rr(_t),So=rr(vt),Fo=or(Nu),No=or(Tu),To=ir(_t),Lo=ir(vt),zo=wu?function(n){
var t=null==n?w:n.constructor;return typeof t=="function"&&t.prototype===n||typeof n!="function"&&Er(n)?Lr(n):ge(n)?wu(n):[]}:Lr,Bo=fr(true),Do=fr(),Mo=le(function(n,t){if(null==n)return{};if("function"!=typeof t[0])return t=Gn(pt(t),Ye),Nr(n,ft(Re(n),t));var r=Bt(t[0],t[1],3);return Tr(n,function(n,t,e){return!r(n,t,e)})}),qo=le(function(n,t){return null==n?{}:"function"==typeof t[0]?Tr(n,Bt(t[0],t[1],3)):Nr(n,pt(t))}),Po=Gt(function(n,t,r){return t=t.toLowerCase(),n+(r?t.charAt(0).toUpperCase()+t.slice(1):t);
}),Ko=Gt(function(n,t,r){return n+(r?"-":"")+t.toLowerCase()}),Vo=ar(),Zo=ar(true),Yo=Gt(function(n,t,r){return n+(r?"_":"")+t.toLowerCase()}),Go=Gt(function(n,t,r){return n+(r?" ":"")+(t.charAt(0).toUpperCase()+t.slice(1))}),Jo=le(function(n,t){try{return n.apply(w,t)}catch(r){return _e(r)?r:new Me(r)}}),Xo=le(function(n,t){return function(r){return Or(r,n,t)}}),Ho=le(function(n,t){return function(r){return Or(n,r,t)}}),Qo=_r("ceil"),ni=_r("floor"),ti=Qt(se,Iu),ri=Qt(Ae,Ru),ei=_r("round");return Nn.prototype=Tn.prototype,
Ln.prototype=$u(Tn.prototype),Ln.prototype.constructor=Ln,zn.prototype=$u(Tn.prototype),zn.prototype.constructor=zn,Bn.prototype["delete"]=function(n){return this.has(n)&&delete this.__data__[n]},Bn.prototype.get=function(n){return"__proto__"==n?w:this.__data__[n]},Bn.prototype.has=function(n){return"__proto__"!=n&&nu.call(this.__data__,n)},Bn.prototype.set=function(n,t){return"__proto__"!=n&&(this.__data__[n]=t),this},Dn.prototype.push=function(n){var t=this.data;typeof n=="string"||ge(n)?t.set.add(n):t.hash[n]=true;
},ce.Cache=Bn,Nn.after=function(n,t){if(typeof t!="function"){if(typeof n!="function")throw new Ge(L);var r=n;n=t,t=r}return n=mu(n=+n)?n:0,function(){return 1>--n?t.apply(this,arguments):void 0}},Nn.ary=function(n,t,r){return r&&Ur(n,t,r)&&(t=w),t=n&&null==t?n.length:bu(+t||0,0),gr(n,E,w,w,w,w,t)},Nn.assign=Co,Nn.at=no,Nn.before=fe,Nn.bind=_o,Nn.bindAll=vo,Nn.bindKey=go,Nn.callback=Se,Nn.chain=Qr,Nn.chunk=function(n,t,r){t=(r?Ur(n,t,r):null==t)?1:bu(yu(t)||1,1),r=0;for(var e=n?n.length:0,u=-1,o=Be(vu(e/t));r<e;)o[++u]=Et(n,r,r+=t);
return o},Nn.compact=function(n){for(var t=-1,r=n?n.length:0,e=-1,u=[];++t<r;){var o=n[t];o&&(u[++e]=o)}return u},Nn.constant=function(n){return function(){return n}},Nn.countBy=to,Nn.create=function(n,t,r){var e=$u(n);return r&&Ur(n,t,r)&&(t=w),t?tt(e,t):e},Nn.curry=yo,Nn.curryRight=mo,Nn.debounce=ae,Nn.defaults=Uo,Nn.defaultsDeep=Wo,Nn.defer=wo,Nn.delay=bo,Nn.difference=Mu,Nn.drop=qr,Nn.dropRight=Pr,Nn.dropRightWhile=function(n,t,r){return n&&n.length?Nt(n,wr(t,r,3),true,true):[]},Nn.dropWhile=function(n,t,r){
return n&&n.length?Nt(n,wr(t,r,3),true):[]},Nn.fill=function(n,t,r,e){var u=n?n.length:0;if(!u)return[];for(r&&typeof r!="number"&&Ur(n,t,r)&&(r=0,e=u),u=n.length,r=null==r?0:+r||0,0>r&&(r=-r>u?0:u+r),e=e===w||e>u?u:+e||0,0>e&&(e+=u),u=r>e?0:e>>>0,r>>>=0;r<u;)n[r++]=t;return n},Nn.filter=re,Nn.flatten=function(n,t,r){var e=n?n.length:0;return r&&Ur(n,t,r)&&(t=false),e?pt(n,t):[]},Nn.flattenDeep=function(n){return n&&n.length?pt(n,true):[]},Nn.flow=xo,Nn.flowRight=Ao,Nn.forEach=uo,Nn.forEachRight=oo,Nn.forIn=Fo,
Nn.forInRight=No,Nn.forOwn=To,Nn.forOwnRight=Lo,Nn.functions=Ie,Nn.groupBy=io,Nn.indexBy=fo,Nn.initial=function(n){return Pr(n,1)},Nn.intersection=Ku,Nn.invert=function(n,t,r){r&&Ur(n,t,r)&&(t=w),r=-1;for(var e=zo(n),u=e.length,o={};++r<u;){var i=e[r],f=n[i];t?nu.call(o,f)?o[f].push(i):o[f]=[i]:o[f]=i}return o},Nn.invoke=ao,Nn.keys=zo,Nn.keysIn=Re,Nn.map=ue,Nn.mapKeys=Bo,Nn.mapValues=Do,Nn.matches=Ne,Nn.matchesProperty=function(n,t){return xt(n,ot(t,true))},Nn.memoize=ce,Nn.merge=Eo,Nn.method=Xo,Nn.methodOf=Ho,
Nn.mixin=Te,Nn.modArgs=jo,Nn.negate=function(n){if(typeof n!="function")throw new Ge(L);return function(){return!n.apply(this,arguments)}},Nn.omit=Mo,Nn.once=function(n){return fe(2,n)},Nn.pairs=Oe,Nn.partial=ko,Nn.partialRight=Io,Nn.partition=co,Nn.pick=qo,Nn.pluck=function(n,t){return ue(n,ze(t))},Nn.property=ze,Nn.propertyOf=function(n){return function(t){return yt(n,Dr(t),t+"")}},Nn.pull=function(){var n=arguments,t=n[0];if(!t||!t.length)return t;for(var r=0,e=xr(),u=n.length;++r<u;)for(var o=0,i=n[r];-1<(o=e(t,i,o));)pu.call(t,o,1);
return t},Nn.pullAt=Vu,Nn.range=function(n,t,r){r&&Ur(n,t,r)&&(t=r=w),n=+n||0,r=null==r?1:+r||0,null==t?(t=n,n=0):t=+t||0;var e=-1;t=bu(vu((t-n)/(r||1)),0);for(var u=Be(t);++e<t;)u[e]=n,n+=r;return u},Nn.rearg=Ro,Nn.reject=function(n,t,r){var e=Oo(n)?Vn:lt;return t=wr(t,r,3),e(n,function(n,r,e){return!t(n,r,e)})},Nn.remove=function(n,t,r){var e=[];if(!n||!n.length)return e;var u=-1,o=[],i=n.length;for(t=wr(t,r,3);++u<i;)r=n[u],t(r,u,n)&&(e.push(r),o.push(u));return It(n,o),e},Nn.rest=Yr,Nn.restParam=le,
Nn.set=function(n,t,r){if(null==n)return n;var e=t+"";t=null!=n[e]||Wr(t,n)?[e]:Dr(t);for(var e=-1,u=t.length,o=u-1,i=n;null!=i&&++e<u;){var f=t[e];ge(i)&&(e==o?i[f]=r:null==i[f]&&(i[f]=Cr(t[e+1])?[]:{})),i=i[f]}return n},Nn.shuffle=function(n){return oe(n,Ru)},Nn.slice=function(n,t,r){var e=n?n.length:0;return e?(r&&typeof r!="number"&&Ur(n,t,r)&&(t=0,r=e),Et(n,t,r)):[]},Nn.sortBy=function(n,t,r){if(null==n)return[];r&&Ur(n,t,r)&&(t=w);var e=-1;return t=wr(t,r,3),n=wt(n,function(n,r,u){return{a:t(n,r,u),
b:++e,c:n}}),Ut(n,f)},Nn.sortByAll=po,Nn.sortByOrder=function(n,t,r,e){return null==n?[]:(e&&Ur(t,r,e)&&(r=w),Oo(t)||(t=null==t?[]:[t]),Oo(r)||(r=null==r?[]:[r]),Wt(n,t,r))},Nn.spread=function(n){if(typeof n!="function")throw new Ge(L);return function(t){return n.apply(this,t)}},Nn.take=function(n,t,r){return n&&n.length?((r?Ur(n,t,r):null==t)&&(t=1),Et(n,0,0>t?0:t)):[]},Nn.takeRight=function(n,t,r){var e=n?n.length:0;return e?((r?Ur(n,t,r):null==t)&&(t=1),t=e-(+t||0),Et(n,0>t?0:t)):[]},Nn.takeRightWhile=function(n,t,r){
return n&&n.length?Nt(n,wr(t,r,3),false,true):[]},Nn.takeWhile=function(n,t,r){return n&&n.length?Nt(n,wr(t,r,3)):[]},Nn.tap=function(n,t,r){return t.call(r,n),n},Nn.throttle=function(n,t,r){var e=true,u=true;if(typeof n!="function")throw new Ge(L);return false===r?e=false:ge(r)&&(e="leading"in r?!!r.leading:e,u="trailing"in r?!!r.trailing:u),ae(n,t,{leading:e,maxWait:+t,trailing:u})},Nn.thru=ne,Nn.times=function(n,t,r){if(n=yu(n),1>n||!mu(n))return[];var e=-1,u=Be(xu(n,4294967295));for(t=Bt(t,r,1);++e<n;)4294967295>e?u[e]=t(e):t(e);
return u},Nn.toArray=je,Nn.toPlainObject=ke,Nn.transform=function(n,t,r,e){var u=Oo(n)||xe(n);return t=wr(t,e,4),null==r&&(u||ge(n)?(e=n.constructor,r=u?Oo(n)?new e:[]:$u(ve(e)?e.prototype:w)):r={}),(u?Pn:_t)(n,function(n,e,u){return t(r,n,e,u)}),r},Nn.union=Gu,Nn.uniq=Gr,Nn.unzip=Jr,Nn.unzipWith=Xr,Nn.values=Ee,Nn.valuesIn=function(n){return Ft(n,Re(n))},Nn.where=function(n,t){return re(n,bt(t))},Nn.without=Ju,Nn.wrap=function(n,t){return t=null==t?Fe:t,gr(t,R,w,[n],[])},Nn.xor=function(){for(var n=-1,t=arguments.length;++n<t;){
var r=arguments[n];if(Er(r))var e=e?Jn(ft(e,r),ft(r,e)):r}return e?St(e):[]},Nn.zip=Xu,Nn.zipObject=Hr,Nn.zipWith=Hu,Nn.backflow=Ao,Nn.collect=ue,Nn.compose=Ao,Nn.each=uo,Nn.eachRight=oo,Nn.extend=Co,Nn.iteratee=Se,Nn.methods=Ie,Nn.object=Hr,Nn.select=re,Nn.tail=Yr,Nn.unique=Gr,Te(Nn,Nn),Nn.add=function(n,t){return(+n||0)+(+t||0)},Nn.attempt=Jo,Nn.camelCase=Po,Nn.capitalize=function(n){return(n=u(n))&&n.charAt(0).toUpperCase()+n.slice(1)},Nn.ceil=Qo,Nn.clone=function(n,t,r,e){return t&&typeof t!="boolean"&&Ur(n,t,r)?t=false:typeof t=="function"&&(e=r,
r=t,t=false),typeof r=="function"?ot(n,t,Bt(r,e,3)):ot(n,t)},Nn.cloneDeep=function(n,t,r){return typeof t=="function"?ot(n,true,Bt(t,r,3)):ot(n,true)},Nn.deburr=Ce,Nn.endsWith=function(n,t,r){n=u(n),t+="";var e=n.length;return r=r===w?e:xu(0>r?0:+r||0,e),r-=t.length,0<=r&&n.indexOf(t,r)==r},Nn.escape=function(n){return(n=u(n))&&hn.test(n)?n.replace(sn,c):n},Nn.escapeRegExp=function(n){return(n=u(n))&&bn.test(n)?n.replace(wn,l):n||"(?:)"},Nn.every=te,Nn.find=ro,Nn.findIndex=qu,Nn.findKey=$o,Nn.findLast=eo,
Nn.findLastIndex=Pu,Nn.findLastKey=So,Nn.findWhere=function(n,t){return ro(n,bt(t))},Nn.first=Kr,Nn.floor=ni,Nn.get=function(n,t,r){return n=null==n?w:yt(n,Dr(t),t+""),n===w?r:n},Nn.gt=se,Nn.gte=function(n,t){return n>=t},Nn.has=function(n,t){if(null==n)return false;var r=nu.call(n,t);if(!r&&!Wr(t)){if(t=Dr(t),n=1==t.length?n:yt(n,Et(t,0,-1)),null==n)return false;t=Zr(t),r=nu.call(n,t)}return r||Sr(n.length)&&Cr(t,n.length)&&(Oo(n)||pe(n))},Nn.identity=Fe,Nn.includes=ee,Nn.indexOf=Vr,Nn.inRange=function(n,t,r){
return t=+t||0,r===w?(r=t,t=0):r=+r||0,n>=xu(t,r)&&n<bu(t,r)},Nn.isArguments=pe,Nn.isArray=Oo,Nn.isBoolean=function(n){return true===n||false===n||h(n)&&ru.call(n)==M},Nn.isDate=function(n){return h(n)&&ru.call(n)==q},Nn.isElement=function(n){return!!n&&1===n.nodeType&&h(n)&&!me(n)},Nn.isEmpty=function(n){return null==n?true:Er(n)&&(Oo(n)||be(n)||pe(n)||h(n)&&ve(n.splice))?!n.length:!zo(n).length},Nn.isEqual=he,Nn.isError=_e,Nn.isFinite=function(n){return typeof n=="number"&&mu(n)},Nn.isFunction=ve,Nn.isMatch=function(n,t,r,e){
return r=typeof r=="function"?Bt(r,e,3):w,mt(n,Ar(t),r)},Nn.isNaN=function(n){return de(n)&&n!=+n},Nn.isNative=ye,Nn.isNull=function(n){return null===n},Nn.isNumber=de,Nn.isObject=ge,Nn.isPlainObject=me,Nn.isRegExp=we,Nn.isString=be,Nn.isTypedArray=xe,Nn.isUndefined=function(n){return n===w},Nn.kebabCase=Ko,Nn.last=Zr,Nn.lastIndexOf=function(n,t,r){var e=n?n.length:0;if(!e)return-1;var u=e;if(typeof r=="number")u=(0>r?bu(e+r,0):xu(r||0,e-1))+1;else if(r)return u=Lt(n,t,true)-1,n=n[u],(t===t?t===n:n!==n)?u:-1;
if(t!==t)return p(n,u,true);for(;u--;)if(n[u]===t)return u;return-1},Nn.lt=Ae,Nn.lte=function(n,t){return n<=t},Nn.max=ti,Nn.min=ri,Nn.noConflict=function(){return Zn._=eu,this},Nn.noop=Le,Nn.now=ho,Nn.pad=function(n,t,r){n=u(n),t=+t;var e=n.length;return e<t&&mu(t)?(e=(t-e)/2,t=yu(e),e=vu(e),r=pr("",e,r),r.slice(0,t)+n+r):n},Nn.padLeft=Vo,Nn.padRight=Zo,Nn.parseInt=function(n,t,r){return(r?Ur(n,t,r):null==t)?t=0:t&&(t=+t),n=We(n),ju(n,t||(In.test(n)?16:10))},Nn.random=function(n,t,r){r&&Ur(n,t,r)&&(t=r=w);
var e=null==n,u=null==t;return null==r&&(u&&typeof n=="boolean"?(r=n,n=1):typeof t=="boolean"&&(r=t,u=true)),e&&u&&(t=1,u=false),n=+n||0,u?(t=n,n=0):t=+t||0,r||n%1||t%1?(r=ku(),xu(n+r*(t-n+fu("1e-"+((r+"").length-1))),t)):Rt(n,t)},Nn.reduce=lo,Nn.reduceRight=so,Nn.repeat=Ue,Nn.result=function(n,t,r){var e=null==n?w:n[t];return e===w&&(null==n||Wr(t,n)||(t=Dr(t),n=1==t.length?n:yt(n,Et(t,0,-1)),e=null==n?w:n[Zr(t)]),e=e===w?r:e),ve(e)?e.call(n):e},Nn.round=ei,Nn.runInContext=m,Nn.size=function(n){var t=n?Bu(n):0;
return Sr(t)?t:zo(n).length},Nn.snakeCase=Yo,Nn.some=ie,Nn.sortedIndex=Zu,Nn.sortedLastIndex=Yu,Nn.startCase=Go,Nn.startsWith=function(n,t,r){return n=u(n),r=null==r?0:xu(0>r?0:+r||0,n.length),n.lastIndexOf(t,r)==r},Nn.sum=function(n,t,r){if(r&&Ur(n,t,r)&&(t=w),t=wr(t,r,3),1==t.length){n=Oo(n)?n:zr(n),r=n.length;for(var e=0;r--;)e+=+t(n[r])||0;n=e}else n=$t(n,t);return n},Nn.template=function(n,t,r){var e=Nn.templateSettings;r&&Ur(n,t,r)&&(t=r=w),n=u(n),t=nt(tt({},r||t),e,Qn),r=nt(tt({},t.imports),e.imports,Qn);
var o,i,f=zo(r),a=Ft(r,f),c=0;r=t.interpolate||Cn;var l="__p+='";r=Ze((t.escape||Cn).source+"|"+r.source+"|"+(r===gn?jn:Cn).source+"|"+(t.evaluate||Cn).source+"|$","g");var p="sourceURL"in t?"//# sourceURL="+t.sourceURL+"\n":"";if(n.replace(r,function(t,r,e,u,f,a){return e||(e=u),l+=n.slice(c,a).replace(Un,s),r&&(o=true,l+="'+__e("+r+")+'"),f&&(i=true,l+="';"+f+";\n__p+='"),e&&(l+="'+((__t=("+e+"))==null?'':__t)+'"),c=a+t.length,t}),l+="';",(t=t.variable)||(l="with(obj){"+l+"}"),l=(i?l.replace(fn,""):l).replace(an,"$1").replace(cn,"$1;"),
l="function("+(t||"obj")+"){"+(t?"":"obj||(obj={});")+"var __t,__p=''"+(o?",__e=_.escape":"")+(i?",__j=Array.prototype.join;function print(){__p+=__j.call(arguments,'')}":";")+l+"return __p}",t=Jo(function(){return qe(f,p+"return "+l).apply(w,a)}),t.source=l,_e(t))throw t;return t},Nn.trim=We,Nn.trimLeft=function(n,t,r){var e=n;return(n=u(n))?n.slice((r?Ur(e,t,r):null==t)?g(n):o(n,t+"")):n},Nn.trimRight=function(n,t,r){var e=n;return(n=u(n))?(r?Ur(e,t,r):null==t)?n.slice(0,y(n)+1):n.slice(0,i(n,t+"")+1):n;
},Nn.trunc=function(n,t,r){r&&Ur(n,t,r)&&(t=w);var e=U;if(r=W,null!=t)if(ge(t)){var o="separator"in t?t.separator:o,e="length"in t?+t.length||0:e;r="omission"in t?u(t.omission):r}else e=+t||0;if(n=u(n),e>=n.length)return n;if(e-=r.length,1>e)return r;if(t=n.slice(0,e),null==o)return t+r;if(we(o)){if(n.slice(e).search(o)){var i,f=n.slice(0,e);for(o.global||(o=Ze(o.source,(kn.exec(o)||"")+"g")),o.lastIndex=0;n=o.exec(f);)i=n.index;t=t.slice(0,null==i?e:i)}}else n.indexOf(o,e)!=e&&(o=t.lastIndexOf(o),
-1<o&&(t=t.slice(0,o)));return t+r},Nn.unescape=function(n){return(n=u(n))&&pn.test(n)?n.replace(ln,d):n},Nn.uniqueId=function(n){var t=++tu;return u(n)+t},Nn.words=$e,Nn.all=te,Nn.any=ie,Nn.contains=ee,Nn.eq=he,Nn.detect=ro,Nn.foldl=lo,Nn.foldr=so,Nn.head=Kr,Nn.include=ee,Nn.inject=lo,Te(Nn,function(){var n={};return _t(Nn,function(t,r){Nn.prototype[r]||(n[r]=t)}),n}(),false),Nn.sample=oe,Nn.prototype.sample=function(n){return this.__chain__||null!=n?this.thru(function(t){return oe(t,n)}):oe(this.value());
},Nn.VERSION=b,Pn("bind bindKey curry curryRight partial partialRight".split(" "),function(n){Nn[n].placeholder=Nn}),Pn(["drop","take"],function(n,t){zn.prototype[n]=function(r){var e=this.__filtered__;if(e&&!t)return new zn(this);r=null==r?1:bu(yu(r)||0,0);var u=this.clone();return e?u.__takeCount__=xu(u.__takeCount__,r):u.__views__.push({size:r,type:n+(0>u.__dir__?"Right":"")}),u},zn.prototype[n+"Right"]=function(t){return this.reverse()[n](t).reverse()}}),Pn(["filter","map","takeWhile"],function(n,t){
var r=t+1,e=r!=T;zn.prototype[n]=function(n,t){var u=this.clone();return u.__iteratees__.push({iteratee:wr(n,t,1),type:r}),u.__filtered__=u.__filtered__||e,u}}),Pn(["first","last"],function(n,t){var r="take"+(t?"Right":"");zn.prototype[n]=function(){return this[r](1).value()[0]}}),Pn(["initial","rest"],function(n,t){var r="drop"+(t?"":"Right");zn.prototype[n]=function(){return this.__filtered__?new zn(this):this[r](1)}}),Pn(["pluck","where"],function(n,t){var r=t?"filter":"map",e=t?bt:ze;zn.prototype[n]=function(n){
return this[r](e(n))}}),zn.prototype.compact=function(){return this.filter(Fe)},zn.prototype.reject=function(n,t){return n=wr(n,t,1),this.filter(function(t){return!n(t)})},zn.prototype.slice=function(n,t){n=null==n?0:+n||0;var r=this;return r.__filtered__&&(0<n||0>t)?new zn(r):(0>n?r=r.takeRight(-n):n&&(r=r.drop(n)),t!==w&&(t=+t||0,r=0>t?r.dropRight(-t):r.take(t-n)),r)},zn.prototype.takeRightWhile=function(n,t){return this.reverse().takeWhile(n,t).reverse()},zn.prototype.toArray=function(){return this.take(Ru);
},_t(zn.prototype,function(n,t){var r=/^(?:filter|map|reject)|While$/.test(t),e=/^(?:first|last)$/.test(t),u=Nn[e?"take"+("last"==t?"Right":""):t];u&&(Nn.prototype[t]=function(){function t(n){return e&&i?u(n,1)[0]:u.apply(w,Jn([n],o))}var o=e?[1]:arguments,i=this.__chain__,f=this.__wrapped__,a=!!this.__actions__.length,c=f instanceof zn,l=o[0],s=c||Oo(f);return s&&r&&typeof l=="function"&&1!=l.length&&(c=s=false),l={func:ne,args:[t],thisArg:w},a=c&&!a,e&&!i?a?(f=f.clone(),f.__actions__.push(l),n.call(f)):u.call(w,this.value())[0]:!e&&s?(f=a?f:new zn(this),
f=n.apply(f,o),f.__actions__.push(l),new Ln(f,i)):this.thru(t)})}),Pn("join pop push replace shift sort splice split unshift".split(" "),function(n){var t=(/^(?:replace|split)$/.test(n)?He:Je)[n],r=/^(?:push|sort|unshift)$/.test(n)?"tap":"thru",e=/^(?:join|pop|replace|shift)$/.test(n);Nn.prototype[n]=function(){var n=arguments;return e&&!this.__chain__?t.apply(this.value(),n):this[r](function(r){return t.apply(r,n)})}}),_t(zn.prototype,function(n,t){var r=Nn[t];if(r){var e=r.name+"";(Wu[e]||(Wu[e]=[])).push({
name:t,func:r})}}),Wu[sr(w,A).name]=[{name:"wrapper",func:w}],zn.prototype.clone=function(){var n=new zn(this.__wrapped__);return n.__actions__=qn(this.__actions__),n.__dir__=this.__dir__,n.__filtered__=this.__filtered__,n.__iteratees__=qn(this.__iteratees__),n.__takeCount__=this.__takeCount__,n.__views__=qn(this.__views__),n},zn.prototype.reverse=function(){if(this.__filtered__){var n=new zn(this);n.__dir__=-1,n.__filtered__=true}else n=this.clone(),n.__dir__*=-1;return n},zn.prototype.value=function(){
var n,t=this.__wrapped__.value(),r=this.__dir__,e=Oo(t),u=0>r,o=e?t.length:0;n=o;for(var i=this.__views__,f=0,a=-1,c=i.length;++a<c;){var l=i[a],s=l.size;switch(l.type){case"drop":f+=s;break;case"dropRight":n-=s;break;case"take":n=xu(n,f+s);break;case"takeRight":f=bu(f,n-s)}}if(n={start:f,end:n},i=n.start,f=n.end,n=f-i,u=u?f:i-1,i=this.__iteratees__,f=i.length,a=0,c=xu(n,this.__takeCount__),!e||o<F||o==n&&c==n)return Tt(t,this.__actions__);e=[];n:for(;n--&&a<c;){for(u+=r,o=-1,l=t[u];++o<f;){var p=i[o],s=p.type,p=p.iteratee(l);
if(s==T)l=p;else if(!p){if(s==N)continue n;break n}}e[a++]=l}return e},Nn.prototype.chain=function(){return Qr(this)},Nn.prototype.commit=function(){return new Ln(this.value(),this.__chain__)},Nn.prototype.concat=Qu,Nn.prototype.plant=function(n){for(var t,r=this;r instanceof Tn;){var e=Mr(r);t?u.__wrapped__=e:t=e;var u=e,r=r.__wrapped__}return u.__wrapped__=n,t},Nn.prototype.reverse=function(){function n(n){return n.reverse()}var t=this.__wrapped__;return t instanceof zn?(this.__actions__.length&&(t=new zn(this)),
t=t.reverse(),t.__actions__.push({func:ne,args:[n],thisArg:w}),new Ln(t,this.__chain__)):this.thru(n)},Nn.prototype.toString=function(){return this.value()+""},Nn.prototype.run=Nn.prototype.toJSON=Nn.prototype.valueOf=Nn.prototype.value=function(){return Tt(this.__wrapped__,this.__actions__)},Nn.prototype.collect=Nn.prototype.map,Nn.prototype.head=Nn.prototype.first,Nn.prototype.select=Nn.prototype.filter,Nn.prototype.tail=Nn.prototype.rest,Nn}var w,b="3.10.1",x=1,A=2,j=4,k=8,I=16,R=32,O=64,E=128,C=256,U=30,W="...",$=150,S=16,F=200,N=1,T=2,L="Expected a function",z="__lodash_placeholder__",B="[object Arguments]",D="[object Array]",M="[object Boolean]",q="[object Date]",P="[object Error]",K="[object Function]",V="[object Number]",Z="[object Object]",Y="[object RegExp]",G="[object String]",J="[object ArrayBuffer]",X="[object Float32Array]",H="[object Float64Array]",Q="[object Int8Array]",nn="[object Int16Array]",tn="[object Int32Array]",rn="[object Uint8Array]",en="[object Uint8ClampedArray]",un="[object Uint16Array]",on="[object Uint32Array]",fn=/\b__p\+='';/g,an=/\b(__p\+=)''\+/g,cn=/(__e\(.*?\)|\b__t\))\+'';/g,ln=/&(?:amp|lt|gt|quot|#39|#96);/g,sn=/[&<>"'`]/g,pn=RegExp(ln.source),hn=RegExp(sn.source),_n=/<%-([\s\S]+?)%>/g,vn=/<%([\s\S]+?)%>/g,gn=/<%=([\s\S]+?)%>/g,yn=/\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\n\\]|\\.)*?\1)\]/,dn=/^\w*$/,mn=/[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\n\\]|\\.)*?)\2)\]/g,wn=/^[:!,]|[\\^$.*+?()[\]{}|\/]|(^[0-9a-fA-Fnrtuvx])|([\n\r\u2028\u2029])/g,bn=RegExp(wn.source),xn=/[\u0300-\u036f\ufe20-\ufe23]/g,An=/\\(\\)?/g,jn=/\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g,kn=/\w*$/,In=/^0[xX]/,Rn=/^\[object .+?Constructor\]$/,On=/^\d+$/,En=/[\xc0-\xd6\xd8-\xde\xdf-\xf6\xf8-\xff]/g,Cn=/($^)/,Un=/['\n\r\u2028\u2029\\]/g,Wn=RegExp("[A-Z\\xc0-\\xd6\\xd8-\\xde]+(?=[A-Z\\xc0-\\xd6\\xd8-\\xde][a-z\\xdf-\\xf6\\xf8-\\xff]+)|[A-Z\\xc0-\\xd6\\xd8-\\xde]?[a-z\\xdf-\\xf6\\xf8-\\xff]+|[A-Z\\xc0-\\xd6\\xd8-\\xde]+|[0-9]+","g"),$n="Array ArrayBuffer Date Error Float32Array Float64Array Function Int8Array Int16Array Int32Array Math Number Object RegExp Set String _ clearTimeout isFinite parseFloat parseInt setTimeout TypeError Uint8Array Uint8ClampedArray Uint16Array Uint32Array WeakMap".split(" "),Sn={};
Sn[X]=Sn[H]=Sn[Q]=Sn[nn]=Sn[tn]=Sn[rn]=Sn[en]=Sn[un]=Sn[on]=true,Sn[B]=Sn[D]=Sn[J]=Sn[M]=Sn[q]=Sn[P]=Sn[K]=Sn["[object Map]"]=Sn[V]=Sn[Z]=Sn[Y]=Sn["[object Set]"]=Sn[G]=Sn["[object WeakMap]"]=false;var Fn={};Fn[B]=Fn[D]=Fn[J]=Fn[M]=Fn[q]=Fn[X]=Fn[H]=Fn[Q]=Fn[nn]=Fn[tn]=Fn[V]=Fn[Z]=Fn[Y]=Fn[G]=Fn[rn]=Fn[en]=Fn[un]=Fn[on]=true,Fn[P]=Fn[K]=Fn["[object Map]"]=Fn["[object Set]"]=Fn["[object WeakMap]"]=false;var Nn={"\xc0":"A","\xc1":"A","\xc2":"A","\xc3":"A","\xc4":"A","\xc5":"A","\xe0":"a","\xe1":"a","\xe2":"a",
"\xe3":"a","\xe4":"a","\xe5":"a","\xc7":"C","\xe7":"c","\xd0":"D","\xf0":"d","\xc8":"E","\xc9":"E","\xca":"E","\xcb":"E","\xe8":"e","\xe9":"e","\xea":"e","\xeb":"e","\xcc":"I","\xcd":"I","\xce":"I","\xcf":"I","\xec":"i","\xed":"i","\xee":"i","\xef":"i","\xd1":"N","\xf1":"n","\xd2":"O","\xd3":"O","\xd4":"O","\xd5":"O","\xd6":"O","\xd8":"O","\xf2":"o","\xf3":"o","\xf4":"o","\xf5":"o","\xf6":"o","\xf8":"o","\xd9":"U","\xda":"U","\xdb":"U","\xdc":"U","\xf9":"u","\xfa":"u","\xfb":"u","\xfc":"u","\xdd":"Y",
"\xfd":"y","\xff":"y","\xc6":"Ae","\xe6":"ae","\xde":"Th","\xfe":"th","\xdf":"ss"},Tn={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;","`":"&#96;"},Ln={"&amp;":"&","&lt;":"<","&gt;":">","&quot;":'"',"&#39;":"'","&#96;":"`"},zn={"function":true,object:true},Bn={0:"x30",1:"x31",2:"x32",3:"x33",4:"x34",5:"x35",6:"x36",7:"x37",8:"x38",9:"x39",A:"x41",B:"x42",C:"x43",D:"x44",E:"x45",F:"x46",a:"x61",b:"x62",c:"x63",d:"x64",e:"x65",f:"x66",n:"x6e",r:"x72",t:"x74",u:"x75",v:"x76",x:"x78"},Dn={"\\":"\\",
"'":"'","\n":"n","\r":"r","\u2028":"u2028","\u2029":"u2029"},Mn=zn[typeof exports]&&exports&&!exports.nodeType&&exports,qn=zn[typeof module]&&module&&!module.nodeType&&module,Pn=zn[typeof self]&&self&&self.Object&&self,Kn=zn[typeof window]&&window&&window.Object&&window,Vn=qn&&qn.exports===Mn&&Mn,Zn=Mn&&qn&&typeof global=="object"&&global&&global.Object&&global||Kn!==(this&&this.window)&&Kn||Pn||this,Yn=m();typeof define=="function"&&typeof define.amd=="object"&&define.amd?(Zn._=Yn, define('lodash',[],function(){
return Yn})):Mn&&qn?Vn?(qn.exports=Yn)._=Yn:Mn._=Yn:Zn._=Yn}).call(this);

/*
 * Copyright (c) 2015 Juniper Networks, Inc. All rights reserved.
 */

define('menu-handler',['underscore'], function (_) {
    var MenuHandler = function () {
        var self = this, menuObj,
            initMenuDefObj = $.Deferred();  //Will be resolved once menu is loaded and filtered
        //onHashChange is triggered once it is resolved
        self.deferredObj = $.Deferred();

        var featurePkgToMenuNameMap = {
            'webController': 'wc',
            'webStorage': 'ws',
            'serverManager': 'sm'
        };

        this.loadMenu = function (webServerInfo) {
            var mFileName = 'menu.xml';
            var featureMaps = [];
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
                    mFileName = 'menu_' + featureMaps.join('_') + '.xml';
                }
            }
            // $.get('/' + mFileName+ '?built_at=' + built_at, function (xml) {
            globalObj['layoutDefObj'].done(function(xml) {
                menuObj = $.xml2json(xml);
                var disabledFeatures = globalObj['webServerInfo']['disabledFeatures'];
                var featurePkgsInfo = globalObj['webServerInfo']['featurePkgsInfo'];
                processXMLJSON(menuObj, disabledFeatures);
                var menuShortcuts = contrail.getTemplate4Id('menu-shortcuts')(menuHandler.filterMenuItems(menuObj['items']['item'], 'menushortcut', featurePkgsInfo));
                $("#sidebar-shortcuts").html(menuShortcuts);
                ['items']['item'] = menuHandler.filterMenuItems(menuObj['items']['item']);
                initMenuDefObj.resolve();
            });

            //Add an event listener for clicking on menu items
            $('#menu').on('click', 'ul > li > a', function (e) {
                var href = $(this).attr('href');
                loadFeature($.deparam.fragment(href));
                if (!e.ctrlKey) {
                    e.preventDefault();//Stop the page to navigate to the url set in href
                }
            });

            $.when.apply(window, [initMenuDefObj]).done(function () {
                //Intialize the alarm flag
                var disabledFeatures = ifNull(globalObj['webServerInfo']['disabledFeatures']['disabled'],[]);
                $.each(disabledFeatures, function (i,d) {
                   if(d == 'monitor_alarms') {
                       cowu.getAlarmsFromAnalytics = false;
                   }
                });
                self.deferredObj.resolve();
            });
        }

        //Filter the menu items based
        //  * allowedRolesList for each feature and comparing them with the logged-in user roles
        //  * allowedOrchestrationModels for each feature and comparing it against loggedInOrchestrationMode
        //type = menushortcut returns only the first level menu (Configure,Monitor)
        this.filterMenuItems = function (items, type, webControllerPkg) {
            if (type == null) {
                items = items.filter(function (value) {
                    var hasAccess = false;
                    hasAccess = checkForAccess(value);
                    if (value['items'] != null && value['items']['item'] instanceof Array && hasAccess)
                        value['items']['item'] = menuHandler.filterMenuItems(value['items']['item']);
                    return hasAccess;
                });
                return items;
            } else if (type == 'menushortcut') {
                var result = [];
                for (var i = 0; i < items.length; i++) {
                    var obj = {};
                    obj['iconClass'] = items[i]['iconClass'], obj['id'] = items[i]['name'], obj['label'] = items[i]['label'];
                    /*disable config baremetal section if contrail-web-controller package is not installed and only
                     contrail-web-server-manager is installed*/
                    if (obj['id'] == 'configure' && (webControllerPkg.webController == null
                        || (webControllerPkg.webController != null && !webControllerPkg.webController.enable))) {
                        obj['cssClass'] = "disabledBtn";
                    } else {
                        /*If top level item has access tag then check for it
                         else check for the access tag in the sub menu items
                         */
                        if (items[i]['access'] != null)
                            obj['cssClass'] = checkForAccess(items[i]) ? "btn-" + items[i]['name'] : "disabledBtn";
                        else if (items[i]['items'] != null && items[i]['items']['item'] instanceof Array) {
                            var subMenu = items[i]['items']['item'], allowed = false;
                            for (var j = 0; j < subMenu.length; j++) {
                                if (subMenu[j]['access'] != null) {
                                    /*
                                     * if atleast one submenu item is allowed then menu button should not be disabled
                                     */
                                    if (checkForAccess(subMenu[j]))
                                        allowed = true;
                                    /*
                                     * if any submenu item has no access tag which mean it is accessible to everyone so menu button should not be disabled
                                     */
                                } else {
                                    allowed = true;
                                    break;
                                }
                            }
                            obj['cssClass'] = allowed ? "btn-" + items[i]['name'] : "disabledBtn";
                            //Menu with no sub items,so disabling it
                        } else
                            obj['cssClass'] = "disabledBtn";
                    }
                    result.push(obj);
                }
                return result;
            }
        }

        /*
         * This function checks whether the user(from globalObj) is permitted to view the menu item(which the parameter)
         * and returns true if permitted else false
         */
        function checkForAccess(value) {
            var roleExists = false, orchExists = false, accessFnRetVal = false;
            var orchModel = globalObj['webServerInfo']['loggedInOrchestrationMode'];
            var loggedInUserRoles = globalObj['webServerInfo']['role'];
            if (value.access != null) {
                if (value.access.roles != null) {
                    if (!(value.access.roles.role instanceof Array))
                        value.access.roles.role = [value.access.roles.role];
                    var rolesArr = value.access.roles.role;
                    var allowedRolesList = [];

                    //If logged-in user has superAdmin role,then allow all features
                    if ($.inArray(globalObj['roles']['ADMIN'], loggedInUserRoles) > -1) {
                        roleExists = true;
                    } else {
                        //If any one of userRole is in allowedRolesList
                        for (var i = 0; i < rolesArr.length; i++) {
                            if ($.inArray(rolesArr[i], loggedInUserRoles) > -1) {
                                roleExists = true;
                                break;
                            }
                        }
                    }
                } else
                    roleExists = true;

                if (value.access.accessFn != null) {
                    if (typeof(globalObj['menuAccessFns'][value.access.accessFn]) == 'function')
                        accessFnRetVal = globalObj['menuAccessFns'][value.access.accessFn]();
                } else
                    accessFnRetVal = true;

                if (value.access.orchModels != null) {
                    if (!(value.access.orchModels.model instanceof Array))
                        value.access.orchModels.model = [value.access.orchModels.model];
                    var orchModels = value.access.orchModels.model;

                    for (var i = 0; i < orchModels.length; i++) {
                        if ((orchModels[i] == orchModel) || ('none' == orchModel)) {
                            orchExists = true;
                        }
                    }
                } else
                    orchExists = true;
                return (roleExists && orchExists && accessFnRetVal);
            } else {
                return true;
            }
        }

        this.toggleMenuButton = function (menuButton, currPageHash, lastPageHash) {
            var currentBCTemplate = contrail.getTemplate4Id('current-breadcrumb');
            var currPageHashArray, subMenuId, reloadMenu, linkId;
            if (menuButton == null) {
                currPageHashArray = currPageHash.split('_');
                //Looks scalable only till 2nd level menu
                linkId = '#' + currPageHashArray[0] + '_' + currPageHashArray[1] + '_' + currPageHashArray[2];
                subMenuId = $(linkId).parent('ul.submenu');
                menuButton = getMenuButtonName(currPageHashArray[0]);
                //If user has switched between top-level menu
                reloadMenu = check2ReloadMenu(lastPageHash, currPageHashArray[0]);
            }
            if (reloadMenu == null || reloadMenu) {
                var menu = {};
                for (var i = 0; i < menuObj['items']['item'].length; i++) {
                    if (menuObj['items']['item'][i]['name'] == menuButton)
                        menu = menuObj['items']['item'][i];
                }
                $('#menu').html('');
                $('#menu').html(contrail.getTemplate4Id('menu-template')(menu));
                if ($('#sidebar').hasClass('menu-min')) {
                    $('#sidebar-collapse').find('i').toggleClass('icon-chevron-left').toggleClass('icon-chevron-right');
                }
                this.selectMenuButton("#btn-" + menuButton);
            }
            if (subMenuId == null) {
                subMenuId = $('.item:first').find('ul:first');
                var href = $('.item:first').find('ul:first').find('li:first a').attr("href");
                loadFeature($.deparam.fragment(href));
            } else {
                subMenuId = $(linkId).parent('ul.submenu');
                toggleSubMenu($(subMenuId), linkId);
                var currURL = window.location.href.split(window.location.host)[1];
                //Modify breadcrumb only if current URL is same as default one
                //Reset to default menu breadcrumbs
                //if($(linkId + ' a').attr('href') == currURL) {
                //var breacrumbsArr = [$(linkId).parents('li').parents('ul').children('li:first').children('a').text().trim(),
                //    $(linkId + ' a').text().trim(),$(linkId).parents('li').children('a').text().trim()];
                var breadcrumbsArr = [{
                    href: $(linkId + ' a:first').attr('href').trim(),
                    link: $(linkId + ' a:first').text().trim()
                }];
                if ($(linkId).parents('ul').length == 2) {
                    breadcrumbsArr.unshift({
                        href: $(linkId).parents('li').children('a:first').attr('data-link').trim(),
                        link: $(linkId).parents('li').children('a:first').text().trim()
                    });
                    breadcrumbsArr.unshift({
                        href: $(linkId).parents('li').parents('ul').children('li:first').children('a:first').attr('data-link').trim(),
                        link: $(linkId).parents('li').parents('ul').children('li:first').children('a:first').text().trim()
                    });
                } else {
                    breadcrumbsArr.unshift({
                        href: $(linkId).parents('li').parents('ul').children('li:first').children('a:first').attr('data-link').trim(),
                        link: $(linkId).parents('li').parents('ul').children('li:first').children('a:first').text().trim()
                    });
                }
                $('#breadcrumb').html(currentBCTemplate(breadcrumbsArr));
                //}
            }
        }

        this.selectMenuButton = function (buttonId) {
            $('#btn-monitor').removeClass("active");
            $('#btn-configure').removeClass("active");
            $('#btn-query').removeClass("active");
            $('#btn-setting').removeClass("active");
            $(buttonId).addClass("active");
        }
        /*
         * Here we are checking whether the hash exists in the menu object
         */
        this.isHashExists = function (hashObj) {
            //if the hash is null,which means no change in the current hash conveys that already it exists in menuObj
            if (hashObj != null && (hashObj['p'] == null || menuHandler.getMenuObjByHash(hashObj['p']) != -1))
                return true;
            else
                return false;
        }

        /*
         * post-processing of menu XML JSON
         * JSON expectes item to be an array,but xml2json make item as an object if there is only one instance
         */
        function processXMLJSON(json, disabledFeatures) {
            if ((json['resources'] != null) && json['resources']['resource'] != null) {
                if (!(json['resources']['resource'] instanceof Array))
                    json['resources']['resource'] = [json['resources']['resource']];
            }
            if ((json['items'] != null) && (json['items']['item'] != null)) {
                if (json['items']['item'] instanceof Array) {
                    var currItem = json['items']['item'];
                    for (var i = (currItem.length - 1); i > -1; i--) {
                        //remove diabled features from the menu obeject
                        if (currItem[i]['hash'] != undefined
                            && disabledFeatures.disabled != null && disabledFeatures.disabled.indexOf(currItem[i]['hash']) !== -1) {
                            currItem.splice(i, 1);
                        } else {
                            if (currItem[i] != undefined) {
                                processXMLJSON(currItem[i], disabledFeatures);
                                add2SiteMap(currItem[i]);
                            }
                        }
                    }
                } else {
                    processXMLJSON(json['items']['item'], disabledFeatures);
                    add2SiteMap(json['items']['item']);
                    json['items']['item'] = [json['items']['item']];
                }
            }
        }

        function add2SiteMap(item) {
            var searchStrings = item.searchStrings, hash = item.hash, queryParams = item.queryParams;
            if (hash != null && searchStrings != null) {
                var searchStrArray = cowu.splitString2Array(searchStrings, ',');
                globalObj['siteMap'][hash] = {searchStrings: searchStrArray, queryParams: queryParams};
                for (var j = 0; j < searchStrArray.length; j++) {
                    globalObj['siteMapSearchStrings'].push(searchStrArray[j]);
                }
            }
        }

        function isDependencyOk(dependencies) {
            return true;
        }

        /*
         * Strip down the menu object to only required fields
         */
        function formatMenuObj(currMenu) {
            var retMenuObj = {};
            $.each(['label', 'class', 'name'], function (index, value) {
                if (value == 'class') {
                    if ((currMenu[value] == null) && (currMenu['loadFn'] == null))
                        retMenuObj['cls'] = 'disabled';
                    else
                        retMenuObj['cls'] = 'enabled';
                    if (currMenu['hide'] == 'true')
                        retMenuObj['cls'] = 'hide';
                } else {
                    retMenuObj[value] = currMenu[value];
                }
            });
            return retMenuObj;
        }

        function processMenu(menuObj) {
            var retMenuObj = [];
            for (var i = 0, j = 0; i < menuObj.length; i++) {
                //Process this menu only if dependencies are OK
                if (isDependencyOk(menuObj[i])) {
                    retMenuObj[j] = formatMenuObj(menuObj[i]);
                    if ((menuObj[i]['items'] != null) && (menuObj[i]['items']['item'] != null) && (menuObj[i]['items']['item'].length > 0)) {
                        retMenuObj[j]['items'] = {};
                        retMenuObj[j]['items'] = processMenu(menuObj[i]['items']['item']);
                    }
                    j++;
                }
            }
            return retMenuObj;
        }

        this.destroyView = function (currMenuObj) {
            if (currMenuObj == null)
                return;
            //Call destory function on viewClass which is being unloaded
            if (currMenuObj['resources'] != null) {
                $.each(getValueByJsonPath(currMenuObj, 'resources;resource', []), function (idx, currResourceObj) {
                    if ((currResourceObj['class'] != null) && (typeof(window[currResourceObj['class']]) == 'function' || typeof(window[currResourceObj['class']]) == 'object') &&
                        (typeof(window[currResourceObj['class']]['destroy']) == 'function')) {
                        $.allajax.abort();

                        try {
                            window[currResourceObj['class']]['destroy']();
                        } catch (error) {
                            console.log(error.stack);
                        }
                    }
                    //window[currResourceObj['class']] = null;
                });
            }
        }

        /**
         * parentsArr is used to load the resources specified in the menu hierarchy
         */
        this.getMenuObjByHash = function (menuHash, currMenuObj, parentsArr) {
            parentsArr = ifNull(parentsArr, []);
            if (currMenuObj == null) {
                currMenuObj = menuObj['items']['item'];
            }
            for (var i = 0; i < currMenuObj.length; i++) {
                if (currMenuObj[i]['hash'] == menuHash) {
                    currMenuObj[i]['parents'] = parentsArr;
                    return currMenuObj[i];
                }
                if ((currMenuObj[i]['items'] != null) && (currMenuObj[i]['items']['item'] != null) && (currMenuObj[i]['items']['item'].length > 0)) {
                    parentsArr.push(currMenuObj[i]);
                    var retVal = self.getMenuObjByHash(menuHash, currMenuObj[i]['items']['item'], parentsArr);
                    if (retVal != -1) {
                        return retVal;
                    } else {
                        parentsArr.pop();
                    }
                }
            }
            return -1;
        }

        this.getMenuObjByName = function (menuName) {
            menuName = menuName.replace('menu_', '');
            var currMenuObj = menuObj;
            for (var i = 0; i < menuName.length; i++) {
                var currMenuIdx = menuName[i];
                currMenuObj = currMenuObj['items']['item'][currMenuIdx];
            }
            return currMenuObj;
        }

        this.handleSideMenu = function() {
            $('#menu-toggler').on('click', function () {
                $('#sidebar').toggleClass('display');
                $(this).toggleClass('display');
                return false;
            });
            //opening submenu
            var $minimized = false;
            $('.nav-list').on('click', function (e) {
                if ($minimized) return;

                //check to see if we have clicked on an element which is inside a .dropdown-toggle element?!
                //if so, it means we should toggle a submenu
                var link_element = $(e.target).closest('.dropdown-toggle');
                if (link_element && link_element.length > 0) {
                    var sub = link_element.next().get(0);
                    toggleSubMenu(sub);
                    return false;
                }
            });

            var sidebarState = getCookie('sidebar');
            if (sidebarState == 'close') {
                $('#sidebar').addClass('menu-min');
                $('#sidebar-collapse').find('i').removeClass('icon-chevron-left').addClass('icon-chevron-right');
            }
        }
    };

    return MenuHandler;
});

function toggleSubMenu(subMenu, linkId) {
    //if we are opening this submenu, close all other submenus except the ".active" one
    if (!$(subMenu).is(':visible')) {//ie, we are about to open it and make it visible
        $('.open > .submenu').each(function () {
            if (this != subMenu) {
                $(this).slideUp(200).parent().removeClass('open').removeClass('active');
            }
        });
        $(subMenu).slideToggle(200).parent().toggleClass('open').toggleClass('active');
    }
    if (linkId != null) {
        $('.submenu > li').each(function () {
            $(this).removeClass('active');
        });
        $(linkId).addClass('active');
    }
};


/*
 * Copyright (c) 2015 Juniper Networks, Inc. All rights reserved.
 */

define('content-handler',['underscore'], function (_) {
    var ContentHandler = function () {
        var self = this;
        self.featureAppDefObj = $.Deferred();
        self.initFeatureAppDefObjMap = {};
        //When we have multiple feature apps (contrail-web-controller,contrail-web-storage)??
        self.isInitFeatureAppComplete = false;
        self.isInitFeatureAppInProgress = false;
        self.initFeatureModuleMap = {};

        this.loadViewFromMenuObj = function (currMenuObj, resourcesDefObj, loadingStartedDefObj) {
            globalObj.currMenuObj = currMenuObj; //Store in globalObj
            try {
                self.initFeatureModule(currMenuObj, function() {
                    contentHandler.loadResourcesFromMenuObj(currMenuObj, resourcesDefObj);
                });
                resourcesDefObj.done(function () {
                    //set the global variable
                    IS_NODE_MANAGER_INSTALLED = getValueByJsonPath(globalObj, 'webServerInfo;uiConfig;nodemanager;installed', true);
                    //Cleanup the container
                    $(contentContainer).html('');

                    setTimeout(function () {
                        if ($(contentContainer).html() == '') {
                            $(contentContainer).html('<p id="content-container-loading"><i class="icon-spinner icon-spin"></i> &nbsp;Loading content ..</p>');
                        }
                    }, 2000);

                    var loaderObj = currMenuObj['loader'];

                    if(contrail.checkIfExist(loaderObj)) {
                        if (loaderObj['class'] != null && window[loaderObj['class']] != null) {
                            window[loaderObj['class']].load({
                                containerId: contentContainer,
                                hashParams: layoutHandler.getURLHashParams(),
                                function: loaderObj['function'],
                                loadingStartedDefObj: loadingStartedDefObj
                            });
                            $('#content-container-loading').remove();
                        }
                    } else {
                        $.each(getValueByJsonPath(currMenuObj, 'resources;resource', []), function (idx, currResourceObj) {
                            if (currResourceObj['class'] != null && window[currResourceObj['class']] != null) {
                                window[currResourceObj['class']].load({
                                    containerId: contentContainer,
                                    hashParams: layoutHandler.getURLHashParams(),
                                    function: currResourceObj['function'],
                                    loadingStartedDefObj: loadingStartedDefObj
                                });
                                $('#content-container-loading').remove();
                            }
                        });
                    }
                });
            } catch (error) {
                console.log(error.stack);
            }
        };

        this.loadContent = function(lastHash, currHash, loadingStartedDefObj) {
            var currPageHash = ifNull(currHash['p'], ''),
                resourcesDefObj = $.Deferred();

            if(globalObj['test-env'] == globalObj['env'] + "-test" && currPageHash == '') {
                return;
            }

            // hideHardRefresh();

            if ($('.modal-backdrop').is(':visible')) {
                $('.modal-backdrop').remove();
                $('.modal').remove();
            }
            var lastPageHash = ifNull(lastHash['p'], ''),
                currPageQueryStr = ifNull(currHash['q'], {}),
                lastPageQueryStr = ifNull(lastHash['q'], {}),
                webServerInfo = globalObj['webServerInfo'];

            try {
                if (currPageHash == '') {
                    if(webServerInfo['loggedInOrchestrationMode'] == 'vcenter') {
                        //If vCenter is the only orchestration model
                        if(webServerInfo['orchestrationModel'].length == 1)
                            currPageHash = "mon_infra_dashboard";
                        else
                            currPageHash = 'mon_networking_dashboard';
                    } else if(webServerInfo['featurePkg']['serverManager'] && !webServerInfo['featurePkg']['webController']) {
                        currPageHash = "setting_sm_clusters";
                    } else if($.inArray(globalObj['roles']['ADMIN'], webServerInfo['role']) > -1) {
                        currPageHash = "mon_infra_dashboard";
                    } else if ($.inArray(globalObj['roles']['TENANT'], webServerInfo['role']) > -1) {
                        currPageHash = "mon_networking_dashboard";
                    }
                }
                var currMenuObj = menuHandler.getMenuObjByHash(currPageHash);
                //Toggle menu button only if there is a change in hash of main menu[Monitor/Configure/Settings/Queries]
                menuHandler.toggleMenuButton(null, currPageHash, lastPageHash);
                //If curr URL is same as default URL, remove non-menu breadcrumbs
                //Always re-load the view if menu is clicked

                //If hashchange is within the same page
                if ((lastPageHash == currPageHash) && (globalObj['menuClicked'] == null || globalObj['menuClicked'] == false)) {
                    self.initFeatureModule(currMenuObj, function() {
                        contentHandler.loadResourcesFromMenuObj(currMenuObj, resourcesDefObj);
                    });
                    resourcesDefObj.done(function() {
                        //If hashchange is within the same page
                        var currMenuObj = menuHandler.getMenuObjByHash(currPageHash),
                            loaderObj = currMenuObj['loader'];

                        if(contrail.checkIfExist(loaderObj) && window[loaderObj['class']] != null && window[loaderObj['class']]['updateViewByHash'] != null) {
                            window[loaderObj['class']].updateViewByHash(currPageQueryStr, lastPageQueryStr, currMenuObj);
                        } else {
                            $.each(currMenuObj['resources']['resource'], function(idx,currResourceObj) {
                                if (window[currResourceObj['class']] != null && window[currResourceObj['class']]['updateViewByHash'] != null) {
                                    window[currResourceObj['class']].updateViewByHash(currPageQueryStr, lastPageQueryStr, currMenuObj);
                                }
                            });
                        }

                        if(contrail.checkIfExist(loadingStartedDefObj)) {
                            loadingStartedDefObj.resolve();
                        }
                    });
                } else {
                    globalObj['menuClicked'] = false;
                    //Clean-up the oldView if present
                    if ((lastHash != null) && (lastHash['p'] != null)) {
                        var menuObj = menuHandler.getMenuObjByHash(lastHash['p']);
                        menuHandler.destroyView(menuObj);
                    }
                    var currMenuObj = menuHandler.getMenuObjByHash(currPageHash);

                    contentHandler.loadViewFromMenuObj(currMenuObj, resourcesDefObj, loadingStartedDefObj);
                }
            } catch (error) {
                console.log(error.stack);
            }
        };

        this.initFeatureModule = function (currMenuObj, loadContentCB) {
            var parents = currMenuObj['parents'],
                initJS = parents.length > 0 ? parents[parents.length - 1]['init'] : null,
                initJSPath, initStatus, deferredObj;

            if(contrail.checkIfExist(initJS)) {
                initJSPath = pkgBaseDir + initJS;
                initStatus = self.initFeatureModuleMap[initJSPath];

                if(!contrail.checkIfExist(initStatus)) {
                    deferredObj = $.Deferred();
                    initStatus = {
                        'isProgress': true,
                        'isInProgress': false,
                        'deferredObj': deferredObj
                    };

                    deferredObj.done(function() {
                        loadContentCB();
                    });

                    self.initFeatureModuleMap[initJSPath] = initStatus;

                    require([initJSPath], function() {});
                } else if(initStatus['isInProgress']) {
                    initStatus['deferredObject'].done(function() {
                        loadContentCB();
                    });
                } else if (initStatus['isComplete']) {
                    loadContentCB()
                }
            } else {
                loadContentCB();
            }
        },

        this.loadResourcesFromMenuObj = function (currMenuObj, resourcesDefObj) {
            var parents = currMenuObj['parents'];

            //Update page Hash only if we are moving to a different view
            var currHashObj = layoutHandler.getURLHashObj();
            if (currHashObj['p'] != currMenuObj['hash']) {
                layoutHandler.setURLHashObj({p: currMenuObj['hash'], q: currMenuObj['queryParams']});
                globalObj.hashUpdated = 1;
            }
            var resourceDefObjList = [],
                rootDir = currMenuObj['rootDir'],
                viewDeferredObjs = [];

            function loadViewResources(menuObj, hash) {
                $.each(getValueByJsonPath(menuObj, 'resources;resource', []), function (idx, currResourceObj) {
                    if (currResourceObj['view'] != null) {
                        if (!(currResourceObj['view'] instanceof Array)) {
                            currResourceObj['view'] = [currResourceObj['view']];
                        }
                        if (currResourceObj['view'] != null && currResourceObj['view'].length > 0 && currResourceObj['view'][0] != null) {
                            $.each(currResourceObj['view'], function () {
                                var viewDeferredObj = $.Deferred();
                                viewDeferredObjs.push(viewDeferredObj);
                                var viewPath = pkgBaseDir + currResourceObj['rootDir'] + '/views/' + this;
                                loadExtTemplate(viewPath, viewDeferredObj, hash);
                            });
                        }
                    }
                })
            }

            function loadTemplateResources(menuObj, hash) {
                $.each(getValueByJsonPath(menuObj, 'resources;resource', []), function (idx, currResourceObj) {
                    if (currResourceObj['template'] != null) {
                        if (!(currResourceObj['template'] instanceof Array)) {
                            currResourceObj['template'] = [currResourceObj['template']];
                        }
                        if (currResourceObj['template'] != null && currResourceObj['template'].length > 0 && currResourceObj['template'][0] != null) {
                            $.each(currResourceObj['template'], function () {
                                var viewDeferredObj = $.Deferred();
                                viewDeferredObjs.push(viewDeferredObj);
                                var viewPath = pkgBaseDir + currResourceObj['rootDir'] + '/templates/' + this;
                                loadExtTemplate(viewPath, viewDeferredObj, hash);
                            });
                        }
                    }
                })
            }

            function loadCssResources(menuObj, hash) {
                $.each(getValueByJsonPath(menuObj, 'resources;resource', []), function (idx, currResourceObj) {
                    if (currResourceObj['css'] == null)
                        return;
                    if (!(currResourceObj['css'] instanceof Array)) {
                        currResourceObj['css'] = [currResourceObj['css']];
                    }
                    $.each(currResourceObj['css'], function () {
                        var cssPath = pkgBaseDir + currResourceObj['rootDir'] + '/css/' + this;
                        if ($.inArray(cssPath, globalObj['loadedCSS']) == -1) {
                            globalObj['loadedCSS'].push(cssPath);
                            var cssLink = $("<link rel='stylesheet' type='text/css' href='" + cssPath + "'>");
                            $('head').append(cssLink);
                        }
                    });
                });
            }

            function loadJsResources(menuObj) {
                $.each(getValueByJsonPath(menuObj, 'resources;resource', []), function (idx, currResourceObj) {
                    if (currResourceObj['js'] != null) {
                        if (!(currResourceObj['js'] instanceof Array))
                            currResourceObj['js'] = [currResourceObj['js']];
                        var isLoadFn = currResourceObj['loadFn'] != null ? true : false;
                        var isReloadRequired = true;
                        //Restrict not re-loading scripts only for monitor infrastructure and monitor networks for now
                        if (NO_RELOAD_JS_CLASSLIST.indexOf(currResourceObj['class']) != -1) {
                            isReloadRequired = false;
                        }
                        $.each(currResourceObj['js'], function () {
                            //Load the JS file only if it's not loaded already
                            //if (window[currResourceObj['class']] == null)
                            if (($.inArray(pkgBaseDir + currResourceObj['rootDir'] + '/js/' + this, globalObj['loadedScripts']) == -1) || (isLoadFn == true) || (isReloadRequired == true))
                                resourceDefObjList.push(getScript(pkgBaseDir + currResourceObj['rootDir'] + '/js/' + this));
                        });
                    }
                });
            }

            //Load the parent views
            if (parents != null && parents.length > 0) {
                $.each(parents, function (i, parent) {
                    var parentRootDir = parent['rootDir'];
                    if (parentRootDir != null || getValueByJsonPath(parent, 'resources;resource', []).length > 0) {
                        loadViewResources(parent, currMenuObj['hash']);
                        loadTemplateResources(parent, currMenuObj['hash']);
                        loadCssResources(parent, currMenuObj['hash']);
                    }
                });
            }
            //Load views required by module
            loadViewResources(currMenuObj, currMenuObj['hash']);
            //Load templates required by module
            loadTemplateResources(currMenuObj, currMenuObj['hash']);
            //Load styles required by module
            loadCssResources(currMenuObj);

            //View file need to be downloaded first before executing any JS file
            $.when.apply(window, viewDeferredObjs).done(function () {
                //Load the parent js
                if (parents != null && parents.length > 0) {
                    $.each(parents, function (i, parent) {
                        var parentRootDir = parent['rootDir'];
                        if (parentRootDir != null || getValueByJsonPath(parent, 'resources;resource', []).length > 0) {
                            loadJsResources(parent);
                        }
                    });
                }
                loadJsResources(currMenuObj);
                $.when.apply(window, resourceDefObjList).done(function () {
                    resourcesDefObj.resolve();
                });
            });
        };

        //Need a way to track featurePkg is initialized
        this.loadFeatureApps = function (featurePackages) {
            var featureAppDefObjList= [],
                initAppDefObj, url;

            for (var key in featurePackages) {
                if(featurePackages[key] && key == FEATURE_PCK_WEB_CONTROLLER) {
                    url = ctBaseDir + '/common/ui/js/controller.app.js';
                    if(globalObj['loadedScripts'].indexOf(url) == -1) {
                        initAppDefObj = $.Deferred();
                        featureAppDefObjList.push(initAppDefObj);
                        self.initFeatureAppDefObjMap[key] = initAppDefObj;
                        featureAppDefObjList.push(getScript(url));
                    }
                } else if (featurePackages[key] && key == FEATURE_PCK_WEB_SERVER_MANAGER) {
                    url = smBaseDir + '/common/ui/js/sm.app.js';
                    if(globalObj['loadedScripts'].indexOf(url) == -1) {
                        initAppDefObj = $.Deferred();
                        featureAppDefObjList.push(initAppDefObj);
                        self.initFeatureAppDefObjMap[key] = initAppDefObj;
                        featureAppDefObjList.push(getScript(url));
                    }
                }  else if (featurePackages[key] && key == FEATURE_PCK_WEB_STORAGE) {
                    url = strgBaseDir + '/common/ui/js/storage.app.js';
                    if(globalObj['loadedScripts'].indexOf(url) == -1) {
                        initAppDefObj = $.Deferred();
                        featureAppDefObjList.push(initAppDefObj);
                        self.initFeatureAppDefObjMap[key] = initAppDefObj;
                        featureAppDefObjList.push(getScript(url));
                    }
                }
            }

            if(featureAppDefObjList.length > 0) {
                self.isInitFeatureAppInProgress = true;
            }

            $.when.apply(window, featureAppDefObjList).done(function () {
                self.isInitFeatureAppInProgress = false;
                self.isInitFeatureAppComplete = true;
                self.featureAppDefObj.resolve();
            });
        };
    }

    return ContentHandler;
});

function loadExtTemplate(path, deferredObj, containerName) {
    path = 'text!' + path;

    require([path], function(result) {
        //Add templates to DOM
        if (containerName != null) {
            $('body').append('<div id="' + containerName + '"></div>');
            $('#' + containerName).append(result);
        } else {
            $("body").append(result);
        }

        if (deferredObj != null) {
            deferredObj.resolve();
        }
    });
};

/*
 * Copyright (c) 2015 Juniper Networks, Inc. All rights reserved.
 */

define('layout-handler',['underscore', 'menu-handler', 'content-handler'], function (_, MenuHandler, ContentHandler) {
    var LayoutHandler = function () {
        var self = this;

        //Don't escape ":[]" characters while pushing state via bbq
        $.param.fragment.noEscape(":[]");

        this.load = function () {
            menuHandler = new MenuHandler();

            globalObj['layoutDefObj'].done(
            // getWebServerInfo(contrail.getCookie('project'),
                             function(webServerInfo) {
                var webServerInfo = globalObj['webServerInfo'];
                menuHandler.loadMenu(webServerInfo);
                menuHandler.handleSideMenu();
                /**
                 * If there is existing instance of contentHandler, use it. Else create new instance.
                 * this will preserve the initFeatureModuleMap and prevent require-ing the same feature modules again
                 * when layoutHandler is loaded multiple times.
                 */
                //Need to fix the issue,if layoutHandler is loaded multiple times
                // if (typeof contentHandler === 'undefined') {
                //     contentHandler = new ContentHandler();
                // }

                $.when.apply(window, [menuHandler.deferredObj]).done(function () {
                    self.onHashChange({}, $.bbq.getState());
                });
            });
        };

        /** Get view height excluding header & footer **/
        this.getViewHeight = function () {
            var windowHeight = $(window).height();
            //To enforce minimum height
            if (windowHeight < 768)
                windowHeight = 768;
            //Subtract the height of pageHeader and seperator height
            return (windowHeight - $('#pageHeader').outerHeight() - 1);
        };

        /** Returns the entire hash object */
        this.getURLHashObj = function () {
            return $.bbq.getState();
        };

        /** Override the entire hash object with the given one */
        this.setURLHashObj = function (obj) {
            if (!menuHandler.isHashExists(obj))
                return
            var currHashObj = self.getURLHashObj();
            //Update Hash only if it differs from current hash
            if (JSON.stringify(sort(currHashObj)) != JSON.stringify(sort(obj))) {
                $.bbq.pushState(obj, 2);
            }
        };

        /** Returns the value of 'q' in urlHash which is used to maintain the state within a page */
        this.getURLHashParams = function () {
            var urlHash = $.bbq.getState('q');
            return ifNull(urlHash, {});
        };

        /** Sets the vaue of 'q' in urlHash */
        this.setURLHashParams = function (hashParams, obj) {
            var merge = true, triggerHashChange = true;
            if (!menuHandler.isHashExists(obj))
                return
            if (obj != null) {
                merge = ifNull(obj['merge'], true);
                triggerHashChange = ifNull(obj['triggerHashChange'], true);
            }
            //Update Hash only if it differs from current hash
            var currHashParams = self.getURLHashParams();
            //If merge is true, merge the parameters before comparing current hash with the new hash going to be pushed
            if ((merge == true) && (typeof(hashParams) == 'object'))
                hashParams = $.extend({}, currHashParams, hashParams);
            if (JSON.stringify(sort(currHashParams)) != JSON.stringify(sort(hashParams))) {
                //To avoid loading the view again
                if (triggerHashChange == false)
                    globalObj.hashUpdated = 1;
                if ((obj != null) && (obj['p'] != null))
                    $.bbq.pushState({p: obj['p'], q: hashParams});
                else
                    $.bbq.pushState({q: hashParams});
            }
        };

        this.onHashChange = function(lastHash, currHash, loadingStartedDefObj) {
            //Waiting for all feature pkgs to load??
            if(contentHandler.isInitFeatureAppComplete) {
                contentHandler.loadContent(lastHash, currHash, loadingStartedDefObj);
            } else if (contentHandler.isInitFeatureAppInProgress) {
                contentHandler.featureAppDefObj.done(function () {
                    contentHandler.loadContent(lastHash, currHash, loadingStartedDefObj);
                });
            } else {
                // contentHandler.loadFeatureApps(globalObj['webServerInfo']['featurePkg']);
                contentHandler.featureAppDefObj.done(function () {
                    contentHandler.loadContent(lastHash, currHash, loadingStartedDefObj);
                });
            }
        }
    };

    return LayoutHandler;
});

/*
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
        };
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
                webServerInfo['mFileName'] = 'menu_' + featureMaps.join('_') + '.xml';
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
            url: '/api/service/networking/web-server-info?project=' + project
        }).done(function (webServerInfo) {
            globalObj['webServerInfo'] = parseWebServerInfo(webServerInfo);
            $.ajax({
                url:'/' + mFileName + '?built_at=' + built_at
            }).done(function(xml) {
                layoutDefObj.resolve(xml);
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
};*/
;
/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define('core-utils',['underscore'], function (_) {
    var serializer = new XMLSerializer(),
        domParser = new DOMParser();

    var CoreUtils = function () {
        var self = this;
        this.getAlarmsFromAnalytics = false;
        //Setting the sevLevels used to display the node colors
        if(this.getAlarmsFromAnalytics) {
            sevLevels = cowc.SEV_LEVELS;
        }
        this.renderGrid = function (elementId, gridConfig) {
            $(elementId).contrailGrid($.extend(true, {
                header: {
                    title: {
                        cssClass: 'blue',
                        iconCssClass: 'blue'
                    },
                    defaultControls: {
                        refreshable: true,
                        collapseable: false
                    }
                },
                columnHeader: {},
                body: {
                    options: {
                        autoRefresh: false,
                        forceFitColumns: true,
                        checkboxSelectable: true,
                        detail: {
                            template: '<pre>{{{formatJSON2HTML this}}}</pre>'
                        }
                    },
                    dataSource: {}
                }
            }, gridConfig));
        };
        this.renderJSONEditor = function (options) {
            var modalId = 'configure-' + options['prefixId'];
            $.contrailBootstrapModal({
                id: modalId,
                className: options['className'],
                title: options['title'],
                body: '<div id="' + options['prefixId'] + '-pane-container"><pre>' + JSON.stringify(options['model'].attributes, null, " ") + '</pre></div>',
                footer: [
                    {
                        id: 'cancelBtn',
                        title: 'Cancel',
                        onclick: 'close'
                    },
                    {
                        className: 'btn-primary',
                        title: 'Save',
                        onclick: function () {
                            $("#" + modalId).modal('hide');
                            options['onSave']();
                        }
                    }
                ],
                onEnter: function () {
                    $("#" + modalId).modal('hide');
                }
            });
        };
        this.createModal = function (options) {
            var modalId = options['modalId'],
                footer = [];
            if(options['footer'] == null || options['footer'] == undefined) {
            if ((contrail.checkIfExist(options['onClose'])) && (contrail.checkIfFunction(options['onClose']))) {
                footer.push({
                    id        : 'closeBtn',
                    className : 'btn-primary',
                    title     : 'Close',
                    onclick   : function () {
                        options['onClose']();
                    },
                    onKeyupEsc: true
                });
            }
            if ((contrail.checkIfExist(options['onCancel'])) && (contrail.checkIfFunction(options['onCancel']))) {
                footer.push({
                    id        : 'cancelBtn',
                    title     : 'Cancel',
                    onclick   : function () {
                        options['onCancel']();
                    },
                    onKeyupEsc: true
                });
            }
            if ((contrail.checkIfExist(options['onSave'])) && (contrail.checkIfFunction(options['onSave']))) {
                footer.push({
                    className: 'btn-primary btnSave',
                    title: (options['btnName']) ? options['btnName'] : 'Save',
                    onclick: function () {
                        options['onSave']();
                        if ($('#' + modalId).find('.generic-delete-form').length > 0) {
                            $('#' + modalId).find('.btn-primary.btnSave').hide();
                        }
                    },
                    onKeyupEnter: true
                });
            }
            } else {
                footer = options['footer'];
            }
            $.contrailBootstrapModal({
                id: modalId,
                className: options['className'],
                title: options['title'],
                body: options['body'],
                footer: footer
            });
        };

        this.createWizardModal = function (options) {
            var modalId = options['modalId'];
            $.contrailBootstrapModal({
                id: modalId,
                className: options['className'],
                title: options['title'],
                body: options['body'],
                footer: false,
                keyupAction: {
                    onKeyupEnter: function () {
                        options['onSave']();
                    },
                    onKeyupEsc: function () {
                        options['onCancel']();
                    }
                }
            });
        };

        this.enableModalLoading = function (modalId) {
            $('#' + modalId).find('.modal-header h6').prepend('<i class="icon-spinner icon-spin margin-right-10 modal-loading-icon">');
            $('#' + modalId).find('.modal-header .icon-remove').addClass('icon-muted');

            $('#' + modalId).find('.modal-footer .btn').attr('disabled', true);
            $('#' + modalId).find('.modal-header button').attr('disabled', true);

        };

        this.disableModalLoading = function (modalId, callback) {
            setTimeout(function () {
                $('#' + modalId).find('.modal-body').animate({scrollTop: 0});

                $('#' + modalId).find('.modal-header h6 .modal-loading-icon').remove();
                $('#' + modalId).find('.modal-header .icon-remove').removeClass('icon-muted');

                $('#' + modalId).find('.modal-footer .btn').attr('disabled', false);
                $('#' + modalId).find('.modal-header button').attr('disabled', false);

                callback();
            }, 1000);
        };

        this.createColumns4Grid = function (fieldsObj) {
            var key, columns = [];
            for (key in fieldsObj) {
                columns.push({id: key, field: key, name: self.getGridTitle4Field(key), width: 150, minWidth: 15});
            }
        };
        this.getGridTitle4Field = function (field) {
            var title = field;
            return title;
        };
        this.getJSONValueByPath = function (jsonPath, jsonObj) {
            var path = jsonPath.replace(/\[(\w+)\]/g, '.$1');
            path = path.replace(/^\./, '');

            var pathArray = path.split('.'),
                obj = jsonObj;

            while (pathArray.length) {
                var property = pathArray.shift();
                if (obj != null && property in obj) {
                    obj = obj[property];
                } else {
                    return '-';
                }
            }

            if (contrail.checkIfExist(obj)) {
                obj = ($.isArray(obj) || typeof(obj) == "object") ? obj : obj.toString().trim();
                if (obj !== '' || obj === 0) {
                    return obj;
                }
            }

            return '-';
        };

        this.formatXML2JSON = function(xmlString, is4SystemLogs) {
            if (xmlString && xmlString != '') {
                var xmlDoc = filterXML(xmlString, is4SystemLogs);
                return $.xml2json(serializer.serializeToString(xmlDoc))
            } else {
                return '';
            }
        };

        this.getRequestState4Model = function(model, data, checkEmptyDataCB) {
            if (model.isRequestInProgress()) {
                return cowc.DATA_REQUEST_STATE_FETCHING;
            } else if (model.error === true) {
                return cowc.DATA_REQUEST_STATE_ERROR;
            } else if (model.empty === true || (contrail.checkIfFunction(checkEmptyDataCB) && checkEmptyDataCB(data))) {
                return cowc.DATA_REQUEST_STATE_SUCCESS_EMPTY;
            } else {
                return cowc.DATA_REQUEST_STATE_SUCCESS_NOT_EMPTY
            }
        };

        this.formatElementId = function (strArray) {
            var elId = '',
                str = strArray.join('_');
            elId = str.split(" ").join("_");
            return elId.toLowerCase();

        };

        this.flattenObject = function (object, intoObject, prefix) {
            var self = this;
            intoObject = intoObject || {};
            prefix = prefix || '';

            _.each(object, function (value, key) {
                if (object.hasOwnProperty(key)) {
                    if (value && typeof value === 'object' && !(value instanceof Array || value instanceof Date || value instanceof RegExp || value instanceof Backbone.Model || value instanceof Backbone.Collection)) {
                        self.flattenObject(value, intoObject, prefix + key + '.');
                    } else {
                        intoObject[prefix + key] = value;
                    }
                }
            });

            return intoObject;
        };

        self.handleNull4Grid = function(value, placeHolder) {
            if(value == 0) {
                return 0;
            } else if (value != null && value != '') {
                return value;
            } else if (placeHolder != null) {
                return placeHolder;
            } else {
                return '';
            }
        };

        self.formatMicroDate = function(microDateTime) {
            var microTime, resultString;
            if(microDateTime == null || microDateTime == 0 || microDateTime == '') {
                resultString = '';
            } else {
                microTime = microDateTime % 1000;
                resultString = moment(new Date(microDateTime / 1000)).format('YYYY-MM-DD HH:mm:ss:SSS');
                if (microTime > 0) {
                    resultString += ':' + microTime;
                } else {
                    resultString += ':0';
                }
            }
            return resultString;
        };

        this.isEmptyObject = function (obj) {
            for (var prop in obj) {
                if (obj.hasOwnProperty(prop))
                    return false;
            }
            return true;
        };

        this.getEditConfigObj = function (configObj, locks) {
            var lock = null,
                testobj = $.extend(true, {}, configObj);

            delete testobj.errors;
            delete testobj.locks;

            $.each(testobj, function (attribute, value) {
                if (_.isArray(value)) {
                    if (contrail.checkIfExist(locks[attribute + cowc.LOCKED_SUFFIX_ID])) {
                        lock = locks[attribute + cowc.LOCKED_SUFFIX_ID];
                        if (lock === true) {
                            delete testobj[attribute];
                        }
                    } else {
                        delete testobj[attribute];
                    }
                }
                // check if value is a key or object
                // if object make a recursive call on value
                else if (_.isObject(value)) {
                    testobj[attribute] = cowu.getEditConfigObj(value, locks);
                    if ($.isEmptyObject(testobj[attribute])) {
                        delete testobj[attribute];
                    }
                }
                // if we reach here :- then value is a key
                // now we check if the value is locked
                // we check it from the 'locks'
                else {
                    if (contrail.checkIfExist(value) && (typeof value == 'string')) {
                        testobj[attribute] = value.trim();
                    }
                    if (contrail.checkIfExist(locks[attribute + cowc.LOCKED_SUFFIX_ID])) {
                        lock = locks[attribute + cowc.LOCKED_SUFFIX_ID];
                        if (lock === true) {
                            delete testobj[attribute];
                        }
                    } else {
                        delete testobj[attribute];
                    }
                }
            });
            return testobj;
        };

        this.getForceAxis4Chart = function (chartData, fieldName, forceAxis) {
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
                } else {
                    axisMax += axisMax * 0.1;
                }

                if (axisMin == null) {
                    axisMin = 0;
                } else {
                    axisMin -= axisMax * 0.1;

                    if(axisMin <= 0) {
                        axisMin = 0;
                    }
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

        this.constructJsonHtmlViewer = function (jsonValue, formatDepth, currentDepth, ignoreKeys) {
            var htmlValue = '',
                objType = {type: 'object', startTag: '{', endTag: '}'};

            if(jsonValue instanceof Array){
                objType = {type: 'array', startTag: '[', endTag: ']'};
            }

            if(formatDepth == 0){
                htmlValue += '<i class="node-' + currentDepth + ' icon-plus expander"></i> ' + objType.startTag + '<ul data-depth="' + currentDepth + '" class="node-' + currentDepth + ' node hide raw">' +
                    JSON.stringify(jsonValue) + '</ul><span class="node-' + currentDepth + ' collapsed expander"> ... </span>' + objType.endTag;
            }
            else {
                htmlValue += '<i class="node-' + currentDepth + ' icon-minus collapser"></i> ' + objType.startTag + '<ul data-depth="' + currentDepth + '" class="node-' + currentDepth + ' node">';
                $.each(jsonValue, function(key, val){
                    if (!contrail.checkIfExist(ignoreKeys) || (contrail.checkIfExist(ignoreKeys) && ignoreKeys.indexOf(key) === -1)) {
                        if (objType['type'] == 'object') {
                            htmlValue += '<li class="key-value"><span class="key">' + key + '</span>: ';
                        }
                        else {
                            htmlValue += '<li class="key-value">';
                        }

                        if (val != null && typeof val == 'object') {
                            htmlValue += '<span class="value">' + cowu.constructJsonHtmlViewer(val, formatDepth - 1, currentDepth + 1) + '</span>';
                        }
                        else {
                            htmlValue += '<span class="value ' + typeof val + '">' + val + '</span>';
                        }
                        htmlValue += '</li>';
                    }
                });
                htmlValue += '</ul><span class="node-' + currentDepth + ' collapsed hide expander"> ... </span>' + objType.endTag;
            }
            return htmlValue;
        };

        // Deprecated: We should use renderView4Config of ContrailView instead of following function.
        this.renderView4Config = function (parentElement, model, viewObj, validation, lockEditingByDefault, modelMap) {
            var viewName = viewObj['view'],
                viewPathPrefix = viewObj['viewPathPrefix'],
                elementId = viewObj[cowc.KEY_ELEMENT_ID],
                validation = (validation != null) ? validation : cowc.KEY_VALIDATION,
                viewConfig = viewObj[cowc.KEY_VIEW_CONFIG],
                viewAttributes = {viewConfig: viewConfig, elementId: elementId, validation: validation, lockEditingByDefault: lockEditingByDefault},
                app = viewObj['app'];

            console.warn(cowm.DEPRECATION_WARNING_PREFIX + 'Function renderView4Config of core-utils is deprecated. Use renderView4Config() of ContrailView instead.');

            var renderConfig = {
                parentElement: parentElement,
                viewName: viewName,
                viewPathPrefix: viewPathPrefix,
                model: model,
                viewAttributes: viewAttributes,
                modelMap: modelMap,
                app: app
            };

            cowu.renderView(renderConfig);
        };

        this.renderView = function (renderConfig, renderCallback) {
            var elementView, viewPath, viewName, parentElement,
                model, viewAttributes, modelMap, rootView, viewPathPrefix,
                onAllViewsRenderCompleteCB, onAllRenderCompleteCB,
                lazyRenderingComplete, app = renderConfig['app'];

            if (app == cowc.APP_CONTRAIL_CONTROLLER) {
                ctwu.renderView(renderConfig, renderCallback);
            } else if (app == cowc.APP_CONTRAIL_SM) {
                smwu.renderView(renderConfig, renderCallback);
            } else if (app == cowc.APP_CONTRAIL_STORAGE) {
                swu.renderView(renderConfig, renderCallback);
            } else {
                parentElement = renderConfig['parentElement'];
                viewName = renderConfig['viewName'];
                /**
                 * if views are dynamically loaded using viewPathPrefix in a viewConfig, the path should prefix
                 * with 'core-basedir' as depending on the env, the root dir from which the files are served changes.
                 */
                viewPathPrefix = contrail.checkIfExist(renderConfig['viewPathPrefix']) ? 'core-basedir/' + renderConfig['viewPathPrefix'] : 'core-basedir/js/views/',
                model = renderConfig['model'];
                viewAttributes = renderConfig['viewAttributes'];
                modelMap = renderConfig['modelMap'];
                rootView = renderConfig['rootView'];
                viewPath = viewPathPrefix + viewName;
                onAllViewsRenderCompleteCB = renderConfig['onAllViewsRenderCompleteCB'];
                onAllRenderCompleteCB = renderConfig['onAllRenderCompleteCB'];
                lazyRenderingComplete  = renderConfig['lazyRenderingComplete'];

                require([viewPath], function(ElementView) {
                    elementView = new ElementView({el: parentElement, model: model, attributes: viewAttributes, rootView: rootView, onAllViewsRenderCompleteCB: onAllViewsRenderCompleteCB, onAllRenderCompleteCB: onAllRenderCompleteCB});
                    elementView.viewName = viewName;
                    elementView.modelMap = modelMap;
                    elementView.beginMyViewRendering();
                    try {
                        elementView.render();
                    } catch (error) {
                        elementView.error = true;
                        console.log(error.stack);
                    }
                    if(contrail.checkIfFunction(renderCallback)) {
                        renderCallback(elementView);
                    }

                    if(lazyRenderingComplete == null || !lazyRenderingComplete) {
                        elementView.endMyViewRendering();
                    }
                });
            }
        };

        this.getAttributeFromPath = function (attributePath) {
            var attributePathArray = attributePath.split('.'),
                attribute = attributePathArray[attributePathArray.length - 1];

            return attribute;
        };

        /* Detail Template Generator*/

        this.generateBlockListKeyValueTemplate = function (config, app, parentConfig) {
            var template = '' +
                '{{#IfCompare requestState "' + cowc.DATA_REQUEST_STATE_SUCCESS_NOT_EMPTY + '" operator="!==" }}' +
                    '{{#IfCompare requestState "' + cowc.DATA_REQUEST_STATE_FETCHING + '" operator="===" }}' +
                        '<p>' + cowm.DATA_FETCHING+ '</p>' +
                    '{{/IfCompare}} ' +
                    '{{#IfCompare requestState "' + cowc.DATA_REQUEST_STATE_ERROR + '" operator="===" }}' +
                        '<p class="error-text">' + cowm.DATA_ERROR + '</p>' +
                    '{{/IfCompare}} ' +
                    '{{#IfCompare requestState "' + cowc.DATA_REQUEST_STATE_SUCCESS_EMPTY + '" operator="===" }}' +
                        '<p>' + cowm.DATA_SUCCESS_EMPTY + '</p>' +
                    '{{/IfCompare}} ' +
                '{{else}}' +
                    '<ul class="item-list">';

            $.each(config, function (configKey, configValue) {
                template += '' +
                    '{{#IfValidJSONValueByPath "' + configValue.key + '" data ' + configKey + '}}' +
                    '<li>' +
                    '<label class="inline row-fluid">' +
                    '<span class="key span5 ' + (parentConfig.keyClass != null ? parentConfig.keyClass : '') +
                    ' ' + (configValue.keyClass != null ? configValue.keyClass : '')+'"> {{getLabel "' +
                    configValue.label + '" "' + configValue.key + '" "' + app + '"}} </span>' +
                    '<span class="value span7 ' + (parentConfig.valueClass != null ? parentConfig.valueClass : '') +
                    ' ' + (configValue.valueClass != null ? configValue.valueClass : '')+'">{{{getValueByConfig data config=\'' + JSON.stringify(configValue) + '\'}}}</span>';

                template += '</label>' +
                    '</li>' +
                    '{{/IfValidJSONValueByPath}}';
            });

            template += '</ul>' +
                '{{/IfCompare}}';

            return template;
        };

        this.generateInnerTemplate = function (config, app) {
            var template, templateObj,
                templateGenerator = config.templateGenerator, templateGeneratorConfig = config.templateGeneratorConfig;

            switch (templateGenerator) {
                case 'RowSectionTemplateGenerator':
                    var rowTemplate, rowTemplateObj;
                    template = contrail.getTemplate4Id(cowc.TMPL_DETAIL_SECTION);
                    templateObj = $(template());

                    $.each(templateGeneratorConfig.rows, function (rowKey, rowValue) {
                        rowTemplate = contrail.getTemplate4Id(cowc.TMPL_DETAIL_SECTION_ROW);
                        rowTemplateObj = $(rowTemplate());

                        rowTemplateObj.append(self.generateInnerTemplate(rowValue, app))
                        templateObj.append(rowTemplateObj);
                    });
                    break;

                case 'ColumnSectionTemplateGenerator':
                    var columnTemplate, columnTemplateObj;
                    template = contrail.getTemplate4Id(cowc.TMPL_DETAIL_SECTION);
                    templateObj = $(template());

                    $.each(templateGeneratorConfig.columns, function (columnKey, columnValue) {
                        columnTemplate = contrail.getTemplate4Id(cowc.TMPL_DETAIL_SECTION_COLUMN);
                        columnTemplateObj = $(columnTemplate({class: columnValue.class}));

                        $.each(columnValue.rows, function (rowKey, rowValue) {
                            columnTemplateObj.append(self.generateInnerTemplate(rowValue, app));
                            templateObj.append(columnTemplateObj);
                        });
                    });
                    break;

                case 'BlockListTemplateGenerator':
                    var template = '';

                    if (config.theme == cowc.THEME_DETAIL_WIDGET) {
                        template = '' +
                            '<div class="detail-block-list-content widget-box transparent">' +
                                '<div class="widget-header">' +
                                    '<h4 class="smaller">' +
                                        '{{#IfCompare requestState "fetching" operator="==" }}' + '<i class="icon-spin icon-spinner"></i>' + '{{/IfCompare}}' +
                                        config.title +
                                    '</h4>' +
                                    '<div class="widget-toolbar pull-right">' +
                                        '<a data-action="collapse"><i class="icon-chevron-up"></i></a>' +
                                    '</div>' +
                                    ((config.advancedViewOptions !== false) ? '' +
                                        '<div class="widget-toolbar pull-right">' +
                                            '<a data-action="settings" data-toggle="dropdown" style="display: inline-block;"><i class="icon-cog"></i></a>' +
                                            '<ul class="pull-right dropdown-menu dropdown-caret dropdown-closer">' +
                                                '<li><a data-action="list-view"><i class="icon-list"></i> &nbsp; Basic view </a></li>' +
                                                '<li><a data-action="advanced-view"><i class="icon-code"></i> &nbsp; Advanced view </a></li>' +
                                            '</ul>' +
                                        '</div>' : '') +
                                '</div>' +
                                '<div class="widget-body">' +
                                    '<div class="widget-main row-fluid">' +
                                        '<div class="list-view">' +
                                            self.generateBlockListKeyValueTemplate(config.templateGeneratorConfig, app, config) +
                                        '</div>' +
                                        '<div class="advanced-view hide">' +
                                            '{{{formatGridJSON2HTML this.data' +
                                                ((contrail.checkIfExist(config.templateGeneratorData) && config.templateGeneratorData !== '') ? '.' + config.templateGeneratorData : '') +
                                            '}}}' +
                                        '</div>' +
                                        '<div class="contrail-status-view hide">' +
                                        '</div>' +
                                    '</div>' +
                                '</div>' +
                            '</div>';
                    } else {
                        template = '<div class="detail-block-list-content row-fluid">' +
                            '<h6>' + config.title + '</h6>' +
                            self.generateBlockListKeyValueTemplate(config.templateGeneratorConfig, app, config) +
                            '<br/></div>';
                    }

                    templateObj = $(template);
                    break;

                case 'BlockGridTemplateGenerator':
                    var template = '<div>' +
                        '{{#IfValidJSONValueByPathLength "' + config.key + '" this}} ' +
                        '<div class="detail-block-grid-content row-fluid">' +
                        (contrail.checkIfExist(config.title) ? '<h6>' + config.title + '</h6>' : '') +
                        '<div class="row-fluid">' +
                        '{{#each ' + config.key + '}} ' +
                        '{{#IfCompare @index 0 operator="%2"}} ' +
                        '{{#IfCompare @index 0 operator="!="}}' +
                        '</div>' +
                        '<div class="row-fluid block-grid-row">' +
                        '{{else}}' +
                        '<div class="row-fluid block-grid-row">' +
                        '{{/IfCompare}}' +
                        '{{/IfCompare}}' +
                        '<div class="span6">' +
                        '<div class="row-fluid">' +
                        self.generateBlockListKeyValueTemplate(config.templateGeneratorConfig.dataColumn, app, config) +
                        '</div>' +
                        '</div>' +
                        '{{/each}} </div>' +
                        '</div></div> {{/IfValidJSONValueByPathLength}} </div>';

                    templateObj = $(template);
                    break;

                case 'BlockAdvancedOnlyTemplateGenerator':
                    var template = '';

                    template = '' +
                        '<div class="advanced-view">' +
                            '{{{formatGridJSON2HTML this.data' +
                                ((contrail.checkIfExist(config.templateGeneratorData) && config.templateGeneratorData !== '') ? '.' + config.templateGeneratorData : '') +
                            '}}}' +
                        '</div>' ;

                    templateObj = $(template);
                    break;
            };

            return (templateObj.prop('outerHTML'))
        };

        this.generateDetailTemplateHTML = function (config, app, jsonString) {
            var template = contrail.getTemplate4Id(cowc.TMPL_DETAIL_FOUNDATION),
                templateObj = $(template(config)),
                jsonValueString ='{{#if this.data.rawJson}}{{{formatGridJSON2HTML this.data.rawJson' +  (contrail.checkIfExist(jsonString) ? '.' + jsonString : '') + '}}}'+
                                '{{else}}{{{formatGridJSON2HTML this.data' +  (contrail.checkIfExist(jsonString) ? '.' + jsonString : '') + '}}}' +
                                '{{/if}}';

            templateObj.find('.detail-foundation-content-basic').append(self.generateInnerTemplate(config, app));
            templateObj.find('.detail-foundation-content-advanced').append(jsonValueString);

            return (templateObj.prop('outerHTML'))
        };

        this.generateDetailTemplate = function (config, app) {
            var template = contrail.getTemplate4Id(cowc.TMPL_DETAIL_FOUNDATION),
                templateObj = $(template(config));

            templateObj.find('.detail-foundation-content-basic').append(self.generateInnerTemplate(config, app));
            templateObj.find('.detail-foundation-content-advanced').append('{{{formatGridJSON2HTML this.data}}}');

            return Handlebars.compile(templateObj.prop('outerHTML'));
        };

        this.getValueFromTemplate = function (args) {
            return args[0].replace(/\{(\d+)\}/g, function (m, n) {
                n = parseInt(n) + 1;
                return args[n];
            });
        };

        this.replaceAll = function (find, replace, strValue) {
            return strValue.replace(new RegExp(find, 'g'), replace);
        };

        this.addUnits2Bytes = function (traffic, noDecimal, maxPrecision, precision, timeInterval) {
            var trafficPrefixes = cowc.BYTE_PREFIX,
                formatStr = '', decimalDigits = 2, size = 1024;

            if (!$.isNumeric(traffic)) {
                return '-';
            } else if (traffic == 0) {
                if (timeInterval != null && timeInterval != 0) {
                    return '0 bps';
                } else {
                    return '0 B';
                }
            }

            if (timeInterval != null && timeInterval != 0) {
                trafficPrefixes = ['bps', 'kbps', 'mbps', 'gbps', 'tbps', 'pbps', 'ebps', 'zbps'];
                size = 1000;
                traffic = (traffic * 8) / timeInterval;
            }

            if ((maxPrecision != null) && (maxPrecision == true)) {
                decimalDigits = 6;
            } else if (precision != null) {
                decimalDigits = precision < 7 ? precision : 6;
            }

            if (noDecimal != null && noDecimal == true)
                decimalDigits = 0;


            traffic = parseInt(traffic);
            traffic = makePositive(traffic);

            $.each(trafficPrefixes, function (idx, prefix) {
                if (traffic < size) {
                    formatStr = contrail.format('{0} {1}', parseFloat(traffic.toFixed(decimalDigits)), prefix);
                    return false;
                } else {
                    //last iteration
                    if (idx == (trafficPrefixes.length - 1))
                        formatStr = contrail.format('{0} {1}', parseFloat(traffic.toFixed(decimalDigits)), prefix);
                    else
                        traffic = traffic / size;
                }
            });
            return formatStr;
        };

        this.addUnits2Packets = function (traffic, noDecimal, maxPrecision, precision) {
            var trafficPrefixes = ['packets', 'K packets', 'M packets', "B packets", "T packets"],
                formatStr = '', decimalDigits = 2, size = 1000;

            if (!$.isNumeric(traffic)) {
                return '-';
            } else if (traffic == 0) {
                return '0 packets';
            }

            if ((maxPrecision != null) && (maxPrecision == true)) {
                decimalDigits = 6;
            } else if (precision != null) {
                decimalDigits = precision < 7 ? precision : 6;
            }

            if (noDecimal != null && noDecimal == true)
                decimalDigits = 0;


            traffic = parseInt(traffic);
            traffic = makePositive(traffic);

            $.each(trafficPrefixes, function (idx, prefix) {
                if (traffic < size) {
                    formatStr = contrail.format('{0} {1}', parseFloat(traffic.toFixed(decimalDigits)), prefix);
                    return false;
                } else {
                    //last iteration
                    if (idx == (trafficPrefixes.length - 1))
                        formatStr = contrail.format('{0} {1}', parseFloat(traffic.toFixed(decimalDigits)), prefix);
                    else
                        traffic = traffic / size;
                }
            });
            return formatStr;
        };

        this.interpolateSankey = function(points) {
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

        this.flattenList = function (arr) {
            //Flatten one-level of the list
            return $.map(arr, function (val) {
                return val;
            });
        };

        this.loadAlertsPopup = function(cfgObj) {
            var prefixId = 'dashboard-alerts';
            var cfgObj = ifNull(cfgObj,{});
            var modalTemplate =
                contrail.getTemplate4Id('core-modal-template');
            var modalId = 'dashboard-alerts-modal';
            var modalLayout = modalTemplate({prefixId: prefixId, modalId: modalId});
            var formId = prefixId + '_modal';
            var modalConfig = {
                    'modalId': modalId,
                    'className': 'modal-840',
                    'body': modalLayout,
                    'onCancel': function() {
                        $("#" + modalId).modal('hide');
                    }
                }
            if(!self.getAlarmsFromAnalytics) {
                modalConfig['title'] = 'Alerts';
            }
            cowu.createModal(modalConfig);

            /*if(cfgObj.model == null) {
                require(['mon-infra-node-list-model','monitor-infra-parsers',
                    'monitor-infra-constants','monitor-infra-utils'],
                    function(NodeListModel,MonitorInfraParsers,MonitorInfraConstants,
                        MonitorInfraUtils) {
                        if(typeof(monitorInfraConstants) == 'undefined') {
                            monitorInfraConstants = new MonitorInfraConstants();
                        }
                        if(typeof(monitorInfraUtils) == 'undefined') {
                            monitorInfraUtils = new MonitorInfraUtils();
                        }
                        if(typeof(monitorInfraParsers) == 'undefined') {
                            monitorInfraParsers = new MonitorInfraParsers();
                        }
                        var nodeListModel = new NodeListModel();
                        var nodeListModelResources = [];
                        //Register node List models
                        if(ctwu != null)
                            nodeListModelResources = nodeListModelResources.concat(ctwu.getNodeListModelsForAlerts());
                        if(contrail.checkIfExist(globalObj.webServerInfo.featurePkg.webStorage) && globalObj.webServerInfo.featurePkg.webStorage == true)
                            nodeListModelResources = nodeListModelResources.concat(swu.getNodeListModelsForAlerts());
                        if(self.getAlarmsFromAnalytics) {
                            require(['js/views/AlarmGridView'], function(AlarmGridView) {
                                var alarmGridView = new AlarmGridView({
                                    el:$("#" + modalId).find('#' + formId),
                                    viewConfig:{}
                                });
                                alarmGridView.render();
                            });
                        } else {
                            require(nodeListModelResources,function() {
                                $.each(arguments,function(idx,currListModel) {
                                    nodeListModel.addListModel(new currListModel());
                                    cfgObj.model = nodeListModel.getAlertListModel();
                                    require(['mon-infra-alert-grid-view'], function(AlertGridView) {
                                        var alertGridView = new AlertGridView({
                                            el:$("#" + modalId).find('#' + formId),
                                            model:cfgObj.model
                                        });
                                        alertGridView.render();
                                    });
                                });
                            });
                        }
                    });
            } else {
                if(self.getAlarmsFromAnalytics) {
                    require(['js/views/AlarmGridView'], function(AlarmGridView) {
                        var alarmGridView = new AlarmGridView({
                            el:$("#" + modalId).find('#' + formId),
                            viewConfig:{}
                        });
                        alarmGridView.render();
                    });
                } else {
                    require(['mon-infra-alert-grid-view'], function(AlertGridView) {
                        var alertGridView = new AlertGridView({
                            el:$("#" + modalId).find('#' + formId),
                            model:cfgObj.model
                        });
                        alertGridView.render();
                    });
                }
            }*/
        };

        this.delete_cookie = function(name) {
            document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        };

        this.splitString2Array = function (strValue, delimiter) {
            var strArray = strValue.split(delimiter),
                count = strArray.length;
            for (var i = 0; i < count; i++) {
                strArray[i] = strArray[i].trim();
            }
            return strArray;
        };

        this.bindPopoverInTopology = function (tooltipConfig, graphView) {
            var timer = null;
            $('.popover').remove();
            $.each(tooltipConfig, function (keyConfig, valueConfig) {
                valueConfig = $.extend(true, {}, cowc.DEFAULT_CONFIG_ELEMENT_TOOLTIP, valueConfig);
                $('g.' + keyConfig).popover('destroy');
                $('g.' + keyConfig).popover({
                    trigger: 'manual',
                    html: true,
                    animation: false,
                    placement: function (context, src) {
                        var srcOffset = $(src).offset(),
                            srcWidth = $(src)[0].getBoundingClientRect().width,
                            bodyWidth = $('body').width(),
                            bodyHeight = $('body').height(),
                            tooltipWidth = valueConfig.dimension.width;

                        $(context).addClass('popover-tooltip');
                        $(context).css({
                            'min-width': tooltipWidth + 'px',
                            'max-width': tooltipWidth + 'px'
                        });
                        $(context).addClass('popover-tooltip');

                        if (srcOffset.left > tooltipWidth) {
                            return 'left';
                        } else if (bodyWidth - srcOffset.left - srcWidth > tooltipWidth){
                            return 'right';
                        } else if (srcOffset.top > bodyHeight / 2){
                             return 'top';
                        } else {
                            return 'bottom';
                        }
                    },
                    title: function () {
                        return valueConfig.title($(this), graphView);
                    },
                    content: function () {
                        return valueConfig.content($(this), graphView);
                    },
                    container: $('body')
                })
                .off("mouseenter")
                .on("mouseenter", function () {
                    var _this = this;
                        clearTimeout(timer);
                        timer = setTimeout(function(){
                            $('g').popover('hide');
                            $('.popover').remove();

                            $(_this).popover("show");

                            $(".popover").find('.btn')
                                .off('click')
                                .on('click', function() {
                                    var actionKey = $(this).data('action'),
                                        actionsCallback = valueConfig.actionsCallback($(_this), graphView);

                                    actionsCallback[actionKey].callback();
                                    $(_this).popover('hide');
                                }
                            );

                            $(".popover").find('.popover-remove-icon')
                                .off('click')
                                .on('click', function() {
                                    $(_this).popover('hide');
                                    $(this).parents('.popover').remove();
                                }
                            );

                        }, contrail.handleIfNull(valueConfig.delay, cowc.TOOLTIP_DELAY))
                })
                .off("mouseleave")
                .on("mouseleave", function () {
                    clearTimeout(timer);
                });
            });
        };

        /*
        * Filter keys in given json object recursively whose value matches with null
        */
        this.filterJsonKeysWithNullValues = function(obj) {
            if(typeof(obj) instanceof Array) {
                for(var i=0,len=obj.length;i<len;i++) {
                    obj[i] = this.filterJsonKeysWithNullValues(obj[i]);
                }
            } else if(typeof(obj) == "object") {
                for(var key in obj) {
                    if(obj[key] == null) {
                        delete obj[key];
                    } else if(typeof(obj[key]) == "object") {
                        obj[key] = this.filterJsonKeysWithNullValues(obj[key]);
                    }
                }
            }
            return obj;
        }
        this.ifNull = function(value, defValue) {
            if (value == null)
                return defValue;
            else
                return value;
        }
        // this.ipUtils = {
        //     isValidSubnet: function(value,cfg) {
        //         var cfg = self.ifNull(cfg,{});
        //         var minIPsNeeded = ifNull(
        //
        //
        //     }
        //
        // }
        this.filterJsonKeysWithCfgOptions = function(obj,cfg) {
            var cfg = self.ifNull(cfg,{});
            var filterEmptyArrays = self.ifNull(cfg['filterEmptyArrays'],true);
            var filterEmptyObjects = self.ifNull(cfg['filterEmptyObjects'],false);
            var filterNullValues = self.ifNull(cfg['filterNullValues'],true);
            if(obj instanceof Array) {
                for(var i=0,len=obj.length;i<len;i++) {
                    obj[i] = this.filterJsonKeysWithCfgOptions(obj[i],cfg);
                }
            } else if(typeof(obj) == "object") {
                for(var key in obj) {
                    if(filterNullValues && (obj[key] == null)) {
                        delete obj[key];
                    } else if(obj[key] instanceof Array) {
                        if(filterEmptyArrays && obj[key].length == 0) {
                            delete obj[key];
                        }
                    } else if(typeof(obj[key]) == "object") {
                        if(filterEmptyObjects && _.keys(obj[key]).length == 0) {
                            delete obj[key];
                        } else {
                            obj[key] = this.filterJsonKeysWithCfgOptions(obj[key],cfg);
                        }
                    }
                }
            }
            return obj;
        }
    };

    function filterXML(xmlString, is4SystemLogs) {
        var xmlDoc = parseXML(xmlString);
        $(xmlDoc).find("[type='struct']").each(function () {
            formatStruct(this);
        });
        if(!is4SystemLogs) {
            $(xmlDoc).find("[type='sandesh']").each(function () {
                formatSandesh(this, is4SystemLogs);
            });
        }
        $(xmlDoc).find("[type]").each(function () {
            removeAttributes(this, ['type', 'size', 'identifier', 'aggtype', 'key']);
        });
        $(xmlDoc).find("data").each(function () {
            $(this).children().unwrap();
        });
        return xmlDoc;
    }

    function parseXML(xmlString) {
        if (window.DOMParser) {
            xmlDoc = domParser.parseFromString(xmlString, "text/xml");
        } else { // Internet Explorer
            xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
            xmlDoc.async = false;
            xmlDoc.loadXML(xmlString);
        }
        return xmlDoc;
    };


    function formatStruct(xmlNode) {
        $(xmlNode).find("list").each(function () {
            $(this).children().unwrap();
        });
        //$(xmlNode).children().unwrap();
    };

    function formatSandesh(xmlNode, is4SystemLogs) {
        var messageString = '', nodeCount, i;
        $(xmlNode).find("file").each(function () {
            $(this).remove();
        });
        $(xmlNode).find("line").each(function () {
            $(this).remove();
        });
        if(is4SystemLogs != null && is4SystemLogs) {
            nodeCount = $(xmlNode).find("[identifier]").length;
            for (i = 1; i < (nodeCount + 1); i++) {
                $(xmlNode).find("[identifier='" + i + "']").each(function () {
                    messageString += $(this).text() + ' ';
                    $(this).remove();
                });
            }
            if (messageString != '') {
                $(xmlNode).text(messageString);
            }
            removeAttributes(xmlNode, ['type']);
        }
    };

    function removeAttributes(xmlNode, attrArray) {
        for (var i = 0; i < attrArray.length; i++) {
            xmlNode.removeAttribute(attrArray[i]);
        }
    };

    return CoreUtils;
});

define('js/nonamd-libs',[
        'web-utils',
        'config_global',
        'contrail-layout',
        'handlebars-utils',          
        'contrail-common',           
        'uuid',
        'protocol',
        'moment',
        'xdate',
        //Third-party
        'handlebars',
        'jsonpath',
        //Combining from layout-libs
        'layout-handler',
        'menu-handler',
        'content-handler',
        'core-utils',
        ], function() {});

