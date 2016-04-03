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

define('js/nonamd-libs',[
        'web-utils',
        'config_global',
        'contrail-layout',
        'handlebars-utils',          
        'contrail-common',           
        'uuid',
        'protocol',
        'xdate',
        //Third-party
        'handlebars',
        'jsonpath',
        //Combining from layout-libs
        ], function() {});

